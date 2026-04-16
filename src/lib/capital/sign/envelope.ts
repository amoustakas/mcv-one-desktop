// MCV Sign envelope primitive — Epic 9 v0.
//
// Creates a hash-bound envelope over a Content OS row with an ordered
// signer list, issues per-signer JWT-like tokens for the apply step,
// and records the initial audit events.
//
// Security model (v0):
//   - Each signer gets a short-lived token (default 14 days). The
//     token payload is signed by the same Ed25519 keypair used by
//     vc-issuer.ts (MCV_VC_ISSUER_DID), so the DID rooting the
//     AccreditedInvestorCredential VCs also anchors signing envelopes.
//     One issuer key → one MCV root of trust.
//   - Only the sha256 of the token is persisted — raw tokens live
//     solely in the signing URL sent to the signer. Database leak
//     won't reveal usable tokens.
//   - envelope_payload is canonicalized (deterministic JSON) then
//     sha256'd — this is the digest every signer signs. When the
//     referenced Content OS body mutates, the content_hash check at
//     apply time rejects the signature ("content mutation detected").
//
// This file is pure composition + DB writes; the crypto primitives
// live in ./signer.ts so tests can exercise them without a DB.

import type { SupabaseClient } from '@supabase/supabase-js';
import crypto from 'node:crypto';
import { appendAuditEvent } from './audit-trail';
import {
  computeContentHash,
  canonicalizeEnvelopePayload,
  issueSignerToken,
  tokenHash,
} from './signer';

export interface CreateEnvelopeInput {
  commitmentId?: string;
  contentId: string;
  ventureId?: string;
  subject?: string;
  message?: string;
  expiresInDays?: number;        // default 14
  signers: Array<{
    email: string;
    name?: string;
    role?: string;
    contactId?: string;
  }>;
  createdBy?: string;            // clerk user id
}

export interface EnvelopeCreationResult {
  envelopeId: string;
  publicId: string;
  contentHash: string;
  signers: Array<{
    envelopeSignerId: string;
    email: string;
    ordinal: number;
    /** Full signing URL the caller surfaces to the signer. Contains
     *  the raw token; never re-derivable from the DB row. Must be
     *  emailed / presented to the signer exactly once. */
    signingUrl: string;
    /** Unix timestamp after which the token stops validating. */
    expiresAt: string;
  }>;
  expiresAt: string;
}

const DEFAULT_EXPIRES_DAYS = 14;
const SIGNING_BASE_URL = process.env.MCV_SIGN_BASE_URL
  ?? process.env.VITE_APP_URL
  ?? 'http://localhost:3100';

/**
 * Fetch the content body from the Content OS row we're binding to.
 * Tries body_markdown first (most common for Capital documents), then
 * body_html, then body_json stringified. Returns null when the row
 * is empty or missing.
 */
async function fetchContentBody(
  supabase: SupabaseClient,
  contentId: string,
): Promise<{ body: string; body_type: string } | null> {
  const { data } = await supabase
    .from('content')
    .select('body_markdown, body_html, body_json')
    .eq('id', contentId)
    .maybeSingle();
  if (!data) return null;
  const md = data.body_markdown as string | null;
  if (md) return { body: md, body_type: 'markdown' };
  const html = data.body_html as string | null;
  if (html) return { body: html, body_type: 'html' };
  const json = data.body_json;
  if (json) return { body: JSON.stringify(json), body_type: 'json' };
  return null;
}

/**
 * Create an envelope in status='sent', issue per-signer tokens,
 * persist signers + audit events. Returns signing URLs for each
 * signer so the caller can deliver them (email, copy-link, iframe).
 */
export async function createEnvelope(
  supabase: SupabaseClient,
  input: CreateEnvelopeInput,
): Promise<EnvelopeCreationResult> {
  if (!input.signers || input.signers.length === 0) {
    throw new Error('at least one signer required');
  }
  if (!input.contentId) {
    throw new Error('contentId required — hash-bind target');
  }

  // 1. Fetch + hash the content body. Empty bodies are blocked —
  //    you can't sign nothing.
  const content = await fetchContentBody(supabase, input.contentId);
  if (!content) {
    throw new Error(`content row ${input.contentId} is empty or missing`);
  }
  const contentHash = computeContentHash(content.body);

  // 2. Build the canonicalized envelope payload — this is what every
  //    signer commits to signing. Includes ordered signer list so
  //    tampering with the signer set after send invalidates signatures.
  const envelopePayload = canonicalizeEnvelopePayload({
    contentId: input.contentId,
    contentHash,
    contentBodyType: content.body_type,
    ventureId: input.ventureId,
    commitmentId: input.commitmentId,
    subject: input.subject,
    signers: input.signers.map((s, i) => ({
      ordinal: i,
      email: s.email.toLowerCase().trim(),
      name: s.name,
      role: s.role ?? 'Signer',
    })),
    createdAt: new Date().toISOString(),
  });

  const publicId = `mcvs_${crypto.randomBytes(12).toString('hex')}`;
  const now = new Date();
  const expiresAt = new Date(now.getTime() + (input.expiresInDays ?? DEFAULT_EXPIRES_DAYS) * 86400000);

  // 3. Insert envelope row.
  const { data: envelopeRow, error: envelopeErr } = await supabase
    .from('signing_envelopes')
    .insert({
      public_id: publicId,
      adapter: 'mcv-sign',
      commitment_id: input.commitmentId ?? null,
      venture_id: input.ventureId ?? null,
      content_id: input.contentId,
      content_hash: contentHash,
      envelope_payload: envelopePayload,
      status: 'sent',
      subject: input.subject ?? null,
      message: input.message ?? null,
      expires_at: expiresAt.toISOString(),
      created_by: input.createdBy ?? null,
    })
    .select('id')
    .maybeSingle();
  if (envelopeErr || !envelopeRow?.id) {
    throw new Error(`envelope insert failed: ${envelopeErr?.message ?? 'unknown'}`);
  }
  const envelopeId = envelopeRow.id as string;

  // 4. Issue per-signer tokens + insert signer rows. Keep raw tokens
  //    in memory only so we can return them in the signingUrl.
  const signerResults: EnvelopeCreationResult['signers'] = [];
  for (let i = 0; i < input.signers.length; i++) {
    const s = input.signers[i];
    const email = s.email.toLowerCase().trim();
    const rawToken = issueSignerToken({
      envelopePublicId: publicId,
      signerEmail: email,
      signerOrdinal: i,
      expiresAt,
    });
    const tokenHashHex = tokenHash(rawToken);

    const { data: signerRow, error: signerErr } = await supabase
      .from('signing_envelope_signers')
      .insert({
        envelope_id: envelopeId,
        ordinal: i,
        email,
        name: s.name ?? null,
        role: s.role ?? null,
        contact_id: s.contactId ?? null,
        token_hash: tokenHashHex,
        token_expires_at: expiresAt.toISOString(),
      })
      .select('id')
      .maybeSingle();
    if (signerErr || !signerRow?.id) {
      throw new Error(`signer insert failed: ${signerErr?.message ?? 'unknown'}`);
    }

    signerResults.push({
      envelopeSignerId: signerRow.id as string,
      email,
      ordinal: i,
      signingUrl: `${SIGNING_BASE_URL}/sign/${publicId}?token=${encodeURIComponent(rawToken)}`,
      expiresAt: expiresAt.toISOString(),
    });

    await appendAuditEvent(supabase, {
      envelopeId,
      eventType: 'token_issued',
      actor: email,
      actorType: 'signer',
      payload: { ordinal: i, expires_at: expiresAt.toISOString() },
    });
  }

  // 5. Audit trail — envelope created + sent.
  await appendAuditEvent(supabase, {
    envelopeId,
    eventType: 'envelope_created',
    actor: input.createdBy ?? 'system',
    actorType: input.createdBy ? 'user' : 'system',
    payload: {
      content_id: input.contentId,
      content_hash: contentHash,
      public_id: publicId,
      signer_count: input.signers.length,
    },
  });
  await appendAuditEvent(supabase, {
    envelopeId,
    eventType: 'envelope_sent',
    actor: input.createdBy ?? 'system',
    actorType: input.createdBy ? 'user' : 'system',
    payload: { signer_count: input.signers.length },
  });

  return {
    envelopeId,
    publicId,
    contentHash,
    signers: signerResults,
    expiresAt: expiresAt.toISOString(),
  };
}
