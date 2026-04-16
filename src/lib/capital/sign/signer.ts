// MCV Sign cryptography — Epic 9 v0.
//
// Pure functions for the signing primitive:
//   - canonicalizeEnvelopePayload  : deterministic JSON serialization
//   - computeContentHash           : sha256 hex of body string
//   - issueSignerToken             : short-lived signer-access token
//   - verifySignerToken            : validate + decode on apply
//   - signEnvelopePayload          : apply Ed25519 sig (per signer)
//   - verifyEnvelopeSignature      : check sig against the payload
//   - computeCompletionSignature   : issuer attestation over finished
//                                     envelope (binds all signatures)
//
// Reuses the issuer keypair loaded by vc-issuer.ts so MCV Sign and
// AccreditedInvestorCredential share one root of trust. When the key
// isn't configured, tokens still issue (unsigned, dev-only) and the
// verifier surfaces the `unsigned: true` flag so callers can decide
// whether to accept.

import crypto from 'node:crypto';

// ─── Content hashing ─────────────────────────────────────────────

export function computeContentHash(body: string): string {
  return crypto.createHash('sha256').update(body, 'utf8').digest('hex');
}

// ─── Canonical JSON ─────────────────────────────────────────────
// Deterministic serialization: keys sorted, no whitespace. The hash
// of this is what signers commit to — any reorder/reformatting of
// the envelope payload would break signatures. Same algorithm as
// vc-issuer.ts uses for VC proof computation.

export function canonicalize(value: unknown): string {
  if (value === null || typeof value !== 'object') return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(canonicalize).join(',')}]`;
  const keys = Object.keys(value as Record<string, unknown>).sort();
  return `{${keys.map((k) => `${JSON.stringify(k)}:${canonicalize((value as Record<string, unknown>)[k])}`).join(',')}}`;
}

export interface EnvelopePayloadInput {
  contentId: string;
  contentHash: string;
  contentBodyType: string;
  ventureId?: string;
  commitmentId?: string;
  subject?: string;
  signers: Array<{
    ordinal: number;
    email: string;
    name?: string;
    role: string;
  }>;
  createdAt: string;
}

export function canonicalizeEnvelopePayload(input: EnvelopePayloadInput): Record<string, unknown> {
  // We return the structured object (not the string) because Supabase
  // stores it as JSONB. Consumers who want the digest input call
  // canonicalize() on the returned object themselves — guarantees
  // storage + verification hash over the same bytes.
  return {
    version: 'mcv-sign/v0',
    content_id: input.contentId,
    content_hash: input.contentHash,
    content_body_type: input.contentBodyType,
    venture_id: input.ventureId ?? null,
    commitment_id: input.commitmentId ?? null,
    subject: input.subject ?? null,
    signers: input.signers,
    created_at: input.createdAt,
  };
}

export function payloadDigest(payload: Record<string, unknown>): string {
  return crypto.createHash('sha256').update(canonicalize(payload), 'utf8').digest('hex');
}

// ─── Issuer key (shared with vc-issuer) ─────────────────────────
// Ed25519 key loaded from env (MCV_VC_ISSUER_PRIVATE_KEY_PEM, optional
// MCV_VC_ISSUER_KID). Returns null when not configured — caller
// decides dev-mode fallback.

export interface SigningKey {
  privateKey: crypto.KeyObject;
  publicKeyPem: string;
  keyId: string;
}

export function loadIssuerKey(): SigningKey | null {
  const pem = process.env.MCV_VC_ISSUER_PRIVATE_KEY_PEM;
  if (!pem) return null;
  try {
    const privateKey = crypto.createPrivateKey({ key: pem, format: 'pem' });
    const publicKey = crypto.createPublicKey(privateKey);
    const publicKeyPem = publicKey.export({ type: 'spki', format: 'pem' }).toString();
    const keyId = process.env.MCV_VC_ISSUER_KID ?? 'key-1';
    return { privateKey, publicKeyPem, keyId };
  } catch {
    return null;
  }
}

// ─── Signer tokens ──────────────────────────────────────────────
// Format: base64url(JSON.stringify(claim)).base64url(sig)
// Claim: { envelopePublicId, signerEmail, signerOrdinal, exp }
// Signature: Ed25519(pem(claim)) with issuer key.
// When no issuer key configured, the sig portion is empty — the token
// still verifies structurally but the verifier flags it unsigned.

export interface SignerTokenClaim {
  envelopePublicId: string;
  signerEmail: string;
  signerOrdinal: number;
  exp: number; // unix seconds
}

function b64url(buf: Buffer): string {
  return buf.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function b64urlDecode(s: string): Buffer {
  const pad = s.length % 4 === 0 ? '' : '='.repeat(4 - (s.length % 4));
  return Buffer.from(s.replace(/-/g, '+').replace(/_/g, '/') + pad, 'base64');
}

export interface IssueSignerTokenInput {
  envelopePublicId: string;
  signerEmail: string;
  signerOrdinal: number;
  expiresAt: Date;
}

export function issueSignerToken(input: IssueSignerTokenInput): string {
  const claim: SignerTokenClaim = {
    envelopePublicId: input.envelopePublicId,
    signerEmail: input.signerEmail.toLowerCase(),
    signerOrdinal: input.signerOrdinal,
    exp: Math.floor(input.expiresAt.getTime() / 1000),
  };
  const claimJson = JSON.stringify(claim);
  const claimB64 = b64url(Buffer.from(claimJson, 'utf8'));

  const key = loadIssuerKey();
  if (!key) return `${claimB64}.`;
  const sig = crypto.sign(null, Buffer.from(claimJson, 'utf8'), key.privateKey);
  return `${claimB64}.${b64url(sig)}`;
}

export interface VerifySignerTokenResult {
  ok: boolean;
  reason?: string;
  claim?: SignerTokenClaim;
  unsigned?: boolean;
  expired?: boolean;
}

export function verifySignerToken(token: string): VerifySignerTokenResult {
  const parts = token.split('.');
  if (parts.length !== 2) return { ok: false, reason: 'malformed token' };
  let claim: SignerTokenClaim;
  try {
    claim = JSON.parse(b64urlDecode(parts[0]).toString('utf8')) as SignerTokenClaim;
  } catch {
    return { ok: false, reason: 'unparseable claim' };
  }
  if (!claim.envelopePublicId || !claim.signerEmail || claim.signerOrdinal == null || !claim.exp) {
    return { ok: false, reason: 'incomplete claim' };
  }
  const now = Math.floor(Date.now() / 1000);
  if (claim.exp <= now) return { ok: false, reason: 'expired', expired: true, claim };

  // Signature verification
  const sigB64 = parts[1];
  if (!sigB64) return { ok: true, unsigned: true, claim };
  const key = loadIssuerKey();
  if (!key) return { ok: false, reason: 'issuer key absent — cannot verify signed token', claim };
  try {
    const sig = b64urlDecode(sigB64);
    const claimBytes = Buffer.from(JSON.stringify(claim), 'utf8');
    const publicKey = crypto.createPublicKey(key.privateKey);
    const ok = crypto.verify(null, claimBytes, publicKey, sig);
    return ok ? { ok: true, claim } : { ok: false, reason: 'signature mismatch', claim };
  } catch {
    return { ok: false, reason: 'signature verification threw', claim };
  }
}

export function tokenHash(token: string): string {
  return crypto.createHash('sha256').update(token, 'utf8').digest('hex');
}

// ─── Envelope signing ───────────────────────────────────────────
// Each signer's signature is over the canonicalized envelope_payload
// (NOT over the raw content body — the content_hash field inside the
// payload already commits to the body). Signing the canonical payload
// means the signers also commit to the signer set + ordinal order.

export interface SignEnvelopeInput {
  payload: Record<string, unknown>;
  /** Optional private key override — tests use this so they can
   *  round-trip without needing env vars set. Production path loads
   *  via loadIssuerKey. */
  privateKey?: crypto.KeyObject;
}

export function signEnvelopePayload(input: SignEnvelopeInput): { signature: string; algo: 'Ed25519' } | null {
  const key = input.privateKey ?? loadIssuerKey()?.privateKey;
  if (!key) return null;
  const canonical = canonicalize(input.payload);
  const sig = crypto.sign(null, Buffer.from(canonical, 'utf8'), key);
  return { signature: b64url(sig), algo: 'Ed25519' };
}

export interface VerifyEnvelopeSignatureInput {
  payload: Record<string, unknown>;
  signature: string;
  publicKey?: crypto.KeyObject;
}

export function verifyEnvelopeSignature(input: VerifyEnvelopeSignatureInput): boolean {
  const key = input.publicKey ?? (() => {
    const k = loadIssuerKey();
    return k ? crypto.createPublicKey(k.privateKey) : null;
  })();
  if (!key) return false;
  try {
    const canonical = canonicalize(input.payload);
    return crypto.verify(null, Buffer.from(canonical, 'utf8'), key, b64urlDecode(input.signature));
  } catch {
    return false;
  }
}

// ─── Completion attestation ─────────────────────────────────────
// After the last signer applies their signature, the issuer appends
// ONE attestation signature over a completion-receipt object that
// includes the envelope public_id + content_hash + every signer's
// sig. This becomes the single verifiable artifact external parties
// can check — they verify ONE Ed25519 sig against the issuer DID
// instead of N individual signer sigs.

export interface CompletionReceiptInput {
  envelopePublicId: string;
  contentHash: string;
  completedAt: string;
  signers: Array<{
    ordinal: number;
    email: string;
    signature: string;
    signedAt: string;
  }>;
}

export function buildCompletionReceipt(input: CompletionReceiptInput): Record<string, unknown> {
  return {
    version: 'mcv-sign-receipt/v0',
    envelope_public_id: input.envelopePublicId,
    content_hash: input.contentHash,
    completed_at: input.completedAt,
    signers: input.signers.sort((a, b) => a.ordinal - b.ordinal),
  };
}
