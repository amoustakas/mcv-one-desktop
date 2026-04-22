// api/_handlers/sign.ts
//
// MCV Sign operator + signer HTTP surface (Epic 9 follow-up).
//
// Three actions:
//   create-envelope   — Clerk-auth'd. Wraps createEnvelope() and
//                       returns signing URLs for every signer.
//   get-envelope      — Clerk OR signer-token. `list: true` returns
//                       the operator inbox summary list; otherwise
//                       returns one envelope (operator: full detail;
//                       signer-token: the signer's slice only).
//   accept-signature  — PUBLIC. Signer's Ed25519 token is the auth.
//                       Wraps applySignature() and surfaces tamper /
//                       expiry errors with distinct status codes so
//                       the Futurestate public page can show the
//                       right UX for each.

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import { requireAuth } from './_auth';
import {
  createEnvelope,
  getEnvelope,
  listEnvelopes,
  type ListEnvelopesFilters,
  type EnvelopeRow,
} from '../../src/lib/capital/sign/envelope';
import { applySignature } from '../../src/lib/capital/sign/apply';
import { mapApplyError } from '../../src/lib/capital/sign/error-mapper';

const supabase = createClient(
  process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_KEY || process.env.VITE_SUPABASE_ANON_KEY || '',
);

type Params = Record<string, unknown>;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const action = (req.body?.action ?? req.query.action) as string | undefined;
  const params: Params = { ...req.query, ...(req.body ?? {}) };

  if (!action) {
    return res.status(400).json({ error: 'action required' });
  }

  // accept-signature is the one public action — signer has no Clerk
  // session at this point; the Ed25519 token inside params IS the auth.
  if (action === 'accept-signature') {
    return handleAcceptSignature(req, res, params);
  }

  // get-envelope is dual-auth: Clerk (operator) OR signer token. If
  // a token is present in params, skip Clerk — the helper verifies it.
  if (action === 'get-envelope' && typeof params.token === 'string' && params.token.length > 0) {
    return handleGetEnvelopeWithToken(res, params);
  }

  const userId = await requireAuth(req, res);
  if (!userId) return; // requireAuth already sent 401

  switch (action) {
    case 'create-envelope':
      return handleCreateEnvelope(res, params, userId);
    case 'get-envelope':
      return handleGetEnvelope(res, params);
    default:
      return res.status(400).json({ error: `unknown action: ${action}` });
  }
}

// ─── create-envelope ─────────────────────────────────────────────

async function handleCreateEnvelope(res: VercelResponse, params: Params, userId: string) {
  const contentId = params.contentId as string | undefined;
  const signers = params.signers as Array<{ email: string; name?: string; role?: string; contactId?: string }> | undefined;

  if (!contentId) return res.status(400).json({ error: 'contentId required' });
  if (!Array.isArray(signers) || signers.length === 0) {
    return res.status(400).json({ error: 'signers must be a non-empty array' });
  }
  for (const s of signers) {
    if (!s || typeof s.email !== 'string' || !s.email.includes('@')) {
      return res.status(400).json({ error: 'each signer requires a valid email' });
    }
  }

  try {
    const result = await createEnvelope(supabase, {
      contentId,
      signers,
      ventureId: params.ventureId as string | undefined,
      commitmentId: params.commitmentId as string | undefined,
      subject: params.subject as string | undefined,
      message: params.message as string | undefined,
      expiresInDays: params.expiresInDays as number | undefined,
      createdBy: userId === 'public' || userId === 'no-secret' ? undefined : userId,
    });
    return res.status(201).json({ envelope: result });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('[sign:create-envelope]', message);
    return res.status(400).json({ error: message });
  }
}

// ─── get-envelope (operator) ─────────────────────────────────────

async function handleGetEnvelope(res: VercelResponse, params: Params) {
  if (params.list === true || params.list === 'true') {
    const filters: ListEnvelopesFilters = {};
    if (typeof params.ventureId === 'string') filters.ventureId = params.ventureId;
    if (Array.isArray(params.status)) {
      filters.status = params.status as EnvelopeRow['status'][];
    } else if (typeof params.status === 'string') {
      filters.status = [params.status as EnvelopeRow['status']];
    }
    if (typeof params.limit === 'number') filters.limit = params.limit;

    const envelopes = await listEnvelopes(supabase, filters);
    return res.json({ envelopes });
  }

  const publicId = params.publicId as string | undefined;
  if (!publicId) return res.status(400).json({ error: 'publicId required' });

  const envelope = await getEnvelope(supabase, publicId, { mode: 'operator' });
  if (!envelope) return res.status(404).json({ error: 'envelope not found' });
  return res.json(envelope);
}

// ─── get-envelope (signer token — public) ────────────────────────

async function handleGetEnvelopeWithToken(res: VercelResponse, params: Params) {
  const publicId = params.publicId as string | undefined;
  const token = params.token as string;
  if (!publicId) return res.status(400).json({ error: 'publicId required' });

  const envelope = await getEnvelope(supabase, publicId, { mode: 'signer', token });
  if (!envelope) {
    // The helper returns null for any of: envelope missing, token
    // invalid, token/envelope mismatch, signer missing, content
    // missing. Don't leak which one to unauthenticated callers.
    return res.status(404).json({ error: 'envelope not found or token invalid' });
  }
  return res.json(envelope);
}

// ─── accept-signature (public, token-gated) ──────────────────────

async function handleAcceptSignature(req: VercelRequest, res: VercelResponse, params: Params) {
  const publicId = params.publicId as string | undefined;
  const token = params.token as string | undefined;
  const acceptedTerms = params.acceptedTerms === true;

  if (!publicId) return res.status(400).json({ error: 'publicId required' });
  if (!token) return res.status(400).json({ error: 'token required' });
  if (!acceptedTerms) {
    return res.status(400).json({ error: 'acceptedTerms must be true (ESIGN consent)', code: 'consent_required' });
  }

  // Capture signer intent evidence. x-forwarded-for may be comma-
  // separated when passing through multiple proxies — first entry is
  // the originating client.
  const xff = req.headers['x-forwarded-for'];
  const ipAddress = (Array.isArray(xff) ? xff[0] : xff)?.split(',')[0]?.trim()
    || req.socket?.remoteAddress
    || undefined;
  const userAgent = (req.headers['user-agent'] as string | undefined) ?? undefined;

  try {
    const result = await applySignature(supabase, {
      envelopePublicId: publicId,
      token,
      signerInfo: { ipAddress, userAgent, acceptedTerms: true },
    });
    return res.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    const { status, code } = mapApplyError(message);
    if (status >= 500) console.error('[sign:accept-signature]', message);
    return res.status(status).json({ error: message, code });
  }
}

