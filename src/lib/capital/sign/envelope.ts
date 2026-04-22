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

// ─── Read helpers ──────────────────────────────────────────────
// Two viewing modes: 'operator' returns the full envelope + every
// signer + recent audit trail (Desktop inbox). 'signer' returns
// envelope metadata + the ONE signer row whose token was presented
// (Futurestate public signing page). Signer mode never leaks other
// signers' emails or signature bytes.

export type EnvelopeViewMode = 'operator' | 'signer';

export interface EnvelopeRow {
  id: string;
  publicId: string;
  adapter: string;
  ventureId: string | null;
  commitmentId: string | null;
  contentId: string;
  contentHash: string;
  status: 'draft' | 'sent' | 'in_progress' | 'signed' | 'declined' | 'voided' | 'expired';
  subject: string | null;
  message: string | null;
  expiresAt: string;
  completedAt: string | null;
  createdBy: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface SignerRow {
  id: string;
  ordinal: number;
  email: string;
  name: string | null;
  role: string | null;
  contactId: string | null;
  status: 'pending' | 'viewed' | 'signed' | 'declined';
  signedAt: string | null;
  tokenExpiresAt: string;
}

export interface OperatorSignerRow extends SignerRow {
  signature: string | null;
  signatureAlgo: string | null;
  ipAddress: string | null;
  userAgent: string | null;
  declinedReason: string | null;
}

export interface AuditRow {
  id: string;
  eventType: string;
  actor: string | null;
  actorType: 'user' | 'signer' | 'system';
  payload: Record<string, unknown>;
  createdAt: string;
}

export interface GetEnvelopeOperatorResult {
  mode: 'operator';
  envelope: EnvelopeRow & {
    envelopePayload: Record<string, unknown>;
    completionSignature: string | null;
    completionSigningKey: string | null;
  };
  signers: OperatorSignerRow[];
  audit: AuditRow[];
}

export interface GetEnvelopeSignerResult {
  mode: 'signer';
  envelope: Omit<EnvelopeRow, 'createdBy'>;
  /** Only the signer whose token was presented — other signers never leak. */
  signer: SignerRow;
  /** Envelope body + bodyType so the signer UX can render the document
   *  without a second Content OS fetch. */
  content: { body: string; bodyType: string };
}

/**
 * Fetch one envelope. Operator mode requires a Clerk userId (caller is
 * trusted). Signer mode requires the raw token — the helper verifies
 * token → signer-row match before returning.
 */
export async function getEnvelope(
  supabase: SupabaseClient,
  publicId: string,
  opts: { mode: 'operator' } | { mode: 'signer'; token: string },
): Promise<GetEnvelopeOperatorResult | GetEnvelopeSignerResult | null> {
  const { data: envelope } = await supabase
    .from('signing_envelopes')
    .select('id, public_id, adapter, venture_id, commitment_id, content_id, content_hash, envelope_payload, status, subject, message, expires_at, completion_signature, completion_signing_key, completed_at, created_by, created_at, updated_at')
    .eq('public_id', publicId)
    .maybeSingle();
  if (!envelope) return null;

  const envelopeCommon: EnvelopeRow = {
    id: envelope.id as string,
    publicId: envelope.public_id as string,
    adapter: envelope.adapter as string,
    ventureId: (envelope.venture_id as string | null) ?? null,
    commitmentId: (envelope.commitment_id as string | null) ?? null,
    contentId: envelope.content_id as string,
    contentHash: envelope.content_hash as string,
    status: envelope.status as EnvelopeRow['status'],
    subject: (envelope.subject as string | null) ?? null,
    message: (envelope.message as string | null) ?? null,
    expiresAt: envelope.expires_at as string,
    completedAt: (envelope.completed_at as string | null) ?? null,
    createdBy: (envelope.created_by as string | null) ?? null,
    createdAt: envelope.created_at as string,
    updatedAt: envelope.updated_at as string,
  };

  if (opts.mode === 'operator') {
    const { data: signers } = await supabase
      .from('signing_envelope_signers')
      .select('id, ordinal, email, name, role, contact_id, status, signed_at, token_expires_at, signature, signature_algo, ip_address, user_agent, declined_reason')
      .eq('envelope_id', envelope.id)
      .order('ordinal');

    const { data: audit } = await supabase
      .from('signing_envelope_audit')
      .select('id, event_type, actor, actor_type, payload, created_at')
      .eq('envelope_id', envelope.id)
      .order('created_at', { ascending: false })
      .limit(100);

    return {
      mode: 'operator',
      envelope: {
        ...envelopeCommon,
        envelopePayload: (envelope.envelope_payload as Record<string, unknown>) ?? {},
        completionSignature: (envelope.completion_signature as string | null) ?? null,
        completionSigningKey: (envelope.completion_signing_key as string | null) ?? null,
      },
      signers: (signers ?? []).map((s) => ({
        id: s.id as string,
        ordinal: s.ordinal as number,
        email: s.email as string,
        name: (s.name as string | null) ?? null,
        role: (s.role as string | null) ?? null,
        contactId: (s.contact_id as string | null) ?? null,
        status: s.status as SignerRow['status'],
        signedAt: (s.signed_at as string | null) ?? null,
        tokenExpiresAt: s.token_expires_at as string,
        signature: (s.signature as string | null) ?? null,
        signatureAlgo: (s.signature_algo as string | null) ?? null,
        ipAddress: (s.ip_address as string | null) ?? null,
        userAgent: (s.user_agent as string | null) ?? null,
        declinedReason: (s.declined_reason as string | null) ?? null,
      })),
      audit: (audit ?? []).map((a) => ({
        id: a.id as string,
        eventType: a.event_type as string,
        actor: (a.actor as string | null) ?? null,
        actorType: a.actor_type as AuditRow['actorType'],
        payload: (a.payload as Record<string, unknown>) ?? {},
        createdAt: a.created_at as string,
      })),
    };
  }

  // Signer mode — verify the presented token picks exactly one signer.
  const { verifySignerToken, tokenHash } = await import('./signer');
  const tokenResult = verifySignerToken(opts.token);
  if (!tokenResult.ok || !tokenResult.claim) return null;
  if (tokenResult.claim.envelopePublicId !== publicId) return null;

  const { data: signer } = await supabase
    .from('signing_envelope_signers')
    .select('id, ordinal, email, name, role, contact_id, status, signed_at, token_hash, token_expires_at')
    .eq('envelope_id', envelope.id)
    .eq('ordinal', tokenResult.claim.signerOrdinal)
    .maybeSingle();
  if (!signer) return null;
  if (signer.token_hash !== tokenHash(opts.token)) return null;

  const { data: content } = await supabase
    .from('content')
    .select('body_markdown, body_html, body_json')
    .eq('id', envelope.content_id)
    .maybeSingle();
  if (!content) return null;
  const body = (content.body_markdown as string | null)
    ?? (content.body_html as string | null)
    ?? (content.body_json ? JSON.stringify(content.body_json) : null);
  if (!body) return null;
  const bodyType = (content.body_markdown as string | null) ? 'markdown'
    : (content.body_html as string | null) ? 'html'
    : 'json';

  // Strip createdBy from envelope shape returned to signer.
  const { createdBy: _createdBy, ...envelopeForSigner } = envelopeCommon;
  void _createdBy;

  return {
    mode: 'signer',
    envelope: envelopeForSigner,
    signer: {
      id: signer.id as string,
      ordinal: signer.ordinal as number,
      email: signer.email as string,
      name: (signer.name as string | null) ?? null,
      role: (signer.role as string | null) ?? null,
      contactId: (signer.contact_id as string | null) ?? null,
      status: signer.status as SignerRow['status'],
      signedAt: (signer.signed_at as string | null) ?? null,
      tokenExpiresAt: signer.token_expires_at as string,
    },
    content: { body, bodyType },
  };
}

export interface ListEnvelopesFilters {
  ventureId?: string;
  status?: EnvelopeRow['status'][];
  limit?: number;
}

export interface EnvelopeSummary extends EnvelopeRow {
  signerCount: number;
  signedCount: number;
}

/**
 * List envelopes for the operator inbox. Aggregates signer counts so
 * the table can render a "2 of 3 signed" progress indicator without a
 * per-row fetch.
 */
export async function listEnvelopes(
  supabase: SupabaseClient,
  filters: ListEnvelopesFilters = {},
): Promise<EnvelopeSummary[]> {
  let query = supabase
    .from('signing_envelopes')
    .select('id, public_id, adapter, venture_id, commitment_id, content_id, content_hash, status, subject, message, expires_at, completed_at, created_by, created_at, updated_at')
    .order('created_at', { ascending: false })
    .limit(filters.limit ?? 100);

  if (filters.ventureId) query = query.eq('venture_id', filters.ventureId);
  if (filters.status && filters.status.length > 0) query = query.in('status', filters.status);

  const { data: envelopes } = await query;
  if (!envelopes || envelopes.length === 0) return [];

  const envelopeIds = envelopes.map((e) => e.id as string);
  const { data: signerRows } = await supabase
    .from('signing_envelope_signers')
    .select('envelope_id, status')
    .in('envelope_id', envelopeIds);

  // Bucket counts by envelope for O(N) merge.
  const counts = new Map<string, { total: number; signed: number }>();
  for (const row of signerRows ?? []) {
    const envId = row.envelope_id as string;
    const bucket = counts.get(envId) ?? { total: 0, signed: 0 };
    bucket.total += 1;
    if (row.status === 'signed') bucket.signed += 1;
    counts.set(envId, bucket);
  }

  return envelopes.map((e) => {
    const bucket = counts.get(e.id as string) ?? { total: 0, signed: 0 };
    return {
      id: e.id as string,
      publicId: e.public_id as string,
      adapter: e.adapter as string,
      ventureId: (e.venture_id as string | null) ?? null,
      commitmentId: (e.commitment_id as string | null) ?? null,
      contentId: e.content_id as string,
      contentHash: e.content_hash as string,
      status: e.status as EnvelopeRow['status'],
      subject: (e.subject as string | null) ?? null,
      message: (e.message as string | null) ?? null,
      expiresAt: e.expires_at as string,
      completedAt: (e.completed_at as string | null) ?? null,
      createdBy: (e.created_by as string | null) ?? null,
      createdAt: e.created_at as string,
      updatedAt: e.updated_at as string,
      signerCount: bucket.total,
      signedCount: bucket.signed,
    };
  });
}
