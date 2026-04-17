// api/verify-investor-webhook.ts
//
// VerifyInvestor webhook receiver (Epic 13 S9).
//
// Completes the accreditation loop started by
// /api/capital action=initiate-accreditation-verification. Flow:
//
//   1. Vendor completes the investor's verification workflow
//   2. Vendor POSTs a `verification.{completed|rejected|pending}` event
//      with an HMAC-SHA256 signature in X-VI-Signature
//   3. We verify the signature, map the event through the adapter,
//      reconcile the compliance outcome onto the investor profile,
//      and when outcome='clear' (verified accredited) auto-issue an
//      Ed25519-signed AccreditedInvestorCredential VC via the existing
//      Epic 11 issuer — closing the loop on accredited-only rounds.
//
// Verification: HMAC-SHA256 over the raw body with shared secret
// VERIFY_INVESTOR_WEBHOOK_SECRET. Standard constant-time comparison.
// VERIFY_INVESTOR_WEBHOOK_VERIFY=0 skips verification in dev.

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import crypto from 'node:crypto';
import { withRateLimit, LIMITS, getClientIp } from '../../src/lib/server/rate-limit';

import { requestLogger } from '../../src/lib/server/logger';
export const config = { api: { bodyParser: false } };

const supabase = createClient(
  process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_KEY || process.env.VITE_SUPABASE_ANON_KEY || '',
);

async function readRawBody(req: VercelRequest): Promise<Buffer> {
  return new Promise<Buffer>((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on('data', (c: Buffer) => chunks.push(c));
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}

function verifySignature(raw: Buffer, signature: string | undefined, secret: string): boolean {
  if (!signature) return false;
  const expected = crypto.createHmac('sha256', secret).update(raw).digest('hex');
  // Signature header may be prefixed with 'sha256='. Strip that; compare
  // the hex portion only in constant time.
  const provided = signature.startsWith('sha256=') ? signature.slice(7) : signature;
  if (expected.length !== provided.length) return false;
  return crypto.timingSafeEqual(Buffer.from(expected, 'hex'), Buffer.from(provided, 'hex'));
}

async function handler(req: VercelRequest, res: VercelResponse) {
  const { log: __log, correlationId: __correlationId } = requestLogger(req as unknown as { headers?: Record<string, unknown>; url?: string; method?: string });
  try { res.setHeader('x-correlation-id', __correlationId); } catch { /* headers already sent */ }
  const __start = Date.now();
  __log.info({ event: 'request_in' });
  res.on('finish', () => {
    __log.info({ event: 'request_out', status: res.statusCode, duration_ms: Date.now() - __start });
  });
  res.on('close', () => {
    if (!res.writableEnded) {
      __log.warn({ event: 'request_abort', duration_ms: Date.now() - __start });
    }
  });
  if (req.method !== 'POST') return res.status(405).send('POST only');

  let raw: Buffer;
  try {
    raw = await readRawBody(req);
  } catch {
    return res.status(400).send('Failed to read body');
  }

  const secret = process.env.VERIFY_INVESTOR_WEBHOOK_SECRET;
  const verifyEnabled = (process.env.VERIFY_INVESTOR_WEBHOOK_VERIFY ?? '1') !== '0';
  if (verifyEnabled && secret) {
    const ok = verifySignature(raw, req.headers['x-vi-signature'] as string | undefined, secret);
    if (!ok) return res.status(401).send('Invalid signature');
  }

  let body: unknown;
  try {
    body = JSON.parse(raw.toString('utf8'));
  } catch {
    return res.status(400).send('Invalid JSON');
  }

  const { createVerifyInvestorAdapter } = await import('../../src/lib/capital/adapters/verify-investor-adapter');
  const { reconcileCapitalCompliance } = await import('../../src/lib/capital/compliance-reconcile');

  const adapter = createVerifyInvestorAdapter();
  const event = await adapter.fromForeign(body as never);
  if (!event) return res.status(200).json({ received: true, handled: false, reason: 'malformed event' });

  await reconcileCapitalCompliance(event, { supabase });

  // Auto-issue the VC on clear outcome. We import + call the issuer
  // directly rather than round-tripping through /api/capital — saves a
  // hop and avoids the Clerk-auth requirement that the main capital
  // handler enforces (this endpoint is authenticated by the vendor
  // HMAC, not by a user session).
  let vcIssued = false;
  if (event.outcome === 'clear') {
    try {
      vcIssued = await issueVcFromEvent(event, body as never);
    } catch (err) {
      console.warn('[verify-investor-webhook] VC issuance failed:',
        err instanceof Error ? err.message : err);
    }
  }

  return res.status(200).json({
    received: true,
    handled: true,
    outcome: event.outcome,
    vcIssued,
  });
}

export default withRateLimit(LIMITS.WEBHOOK, getClientIp)(handler);

async function issueVcFromEvent(
  event: Awaited<ReturnType<Exclude<ReturnType<typeof import('../../src/lib/capital/adapters/verify-investor-adapter').createVerifyInvestorAdapter>['fromForeign'], undefined>>>,
  raw: import('../../src/lib/capital/adapters/verify-investor-adapter').VerifyInvestorEvent,
): Promise<boolean> {
  if (!event) return false;
  const { issueAccreditationCredential } = await import('../../src/lib/capital/vc-issuer');

  // Look up the linked Clerk user so the VC subject DID is correct.
  const { data: profile } = await supabase
    .from('capital_investor_profile')
    .select('clerk_user_id, metadata')
    .eq('contact_id', event.contactId)
    .maybeSingle();
  const clerkUserId = (profile?.clerk_user_id as string | undefined)
    ?? raw.subject.clerkUserId
    ?? event.contactId; // fallback: use contactId so the VC still issues — subject is still unique per-contact

  const basis = raw.accreditationBasis;
  const accreditationStatus =
    basis === 'qualified_purchaser' ? 'qualified_purchaser'
    : basis === 'entity' ? 'institutional'
    : 'accredited';

  const vc = issueAccreditationCredential({
    clerkUserId,
    accreditationStatus,
    jurisdiction: raw.jurisdiction ?? 'US',
    verificationMethod: `VerifyInvestor:${raw.id}`,
  });

  const currentMeta = (profile?.metadata as Record<string, unknown> | undefined) ?? {};
  await supabase
    .from('capital_investor_profile')
    .update({
      metadata: { ...currentMeta, vc },
      updated_at: new Date().toISOString(),
    })
    .eq('contact_id', event.contactId);

  // Emit an auditable activity + notification. capital.accreditation.issued
  // is the existing topic (PR #11 Epic 11 issuer).
  await supabase.from('notifications').insert({
    type: 'success',
    title: `Accreditation VC issued via VerifyInvestor — ${accreditationStatus}`,
    description: `Subject ${clerkUserId} · basis ${basis ?? 'unspecified'} · jurisdiction ${raw.jurisdiction ?? 'US'}`,
    source: 'capital',
    metadata: {
      topic: 'capital.accreditation.issued',
      adapter: 'verify-investor',
      contact_id: event.contactId,
      vendor_request_id: raw.id,
    },
  });

  return true;
}
