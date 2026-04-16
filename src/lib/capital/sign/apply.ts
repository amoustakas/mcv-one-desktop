// MCV Sign — apply-signature flow.
//
// Called when a signer clicks their signing URL and submits consent.
// Validates the token, re-derives the content hash to catch tamper,
// applies an Ed25519 signature over the canonicalized envelope
// payload, and transitions the envelope to 'signed' once all signers
// are done.

import type { SupabaseClient } from '@supabase/supabase-js';
import crypto from 'node:crypto';
import { appendAuditEvent } from './audit-trail';
import {
  canonicalize,
  computeContentHash,
  signEnvelopePayload,
  tokenHash,
  verifySignerToken,
  buildCompletionReceipt,
  loadIssuerKey,
} from './signer';

export interface ApplySignatureInput {
  envelopePublicId: string;
  token: string;              // raw token from signing URL
  /** Evidence of intent captured at apply time. Required for ESIGN. */
  signerInfo: {
    ipAddress?: string;
    userAgent?: string;
    acceptedTerms: boolean;   // explicit true; ESIGN consent
  };
}

export interface ApplySignatureResult {
  outcome: 'signed' | 'pending_others' | 'already_signed' | 'envelope_completed';
  envelopeId: string;
  signerOrdinal: number;
  remainingSigners: number;
  /** Populated when this was the last signer — the issuer completion
   *  attestation + completion receipt. */
  completion?: {
    completionSignature: string;
    completionKid: string;
    receipt: Record<string, unknown>;
  };
}

export async function applySignature(
  supabase: SupabaseClient,
  input: ApplySignatureInput,
): Promise<ApplySignatureResult> {
  if (!input.signerInfo.acceptedTerms) {
    throw new Error('ESIGN consent required: signerInfo.acceptedTerms must be true');
  }

  // 1. Verify token.
  const tokenResult = verifySignerToken(input.token);
  if (!tokenResult.ok) {
    throw new Error(`token invalid: ${tokenResult.reason ?? 'unknown'}`);
  }
  const claim = tokenResult.claim!;
  if (claim.envelopePublicId !== input.envelopePublicId) {
    throw new Error('token envelope mismatch');
  }

  // 2. Load the envelope + check status.
  const { data: envelope } = await supabase
    .from('signing_envelopes')
    .select('id, public_id, status, content_id, content_hash, envelope_payload')
    .eq('public_id', input.envelopePublicId)
    .maybeSingle();
  if (!envelope) throw new Error('envelope not found');
  if (envelope.status === 'signed') {
    return {
      outcome: 'envelope_completed',
      envelopeId: envelope.id as string,
      signerOrdinal: claim.signerOrdinal,
      remainingSigners: 0,
    };
  }
  if (envelope.status !== 'sent' && envelope.status !== 'in_progress') {
    throw new Error(`envelope status '${envelope.status}' does not accept signatures`);
  }

  // 3. Find the signer row for this ordinal + verify token hash matches.
  const { data: signer } = await supabase
    .from('signing_envelope_signers')
    .select('id, ordinal, email, token_hash, token_expires_at, status')
    .eq('envelope_id', envelope.id)
    .eq('ordinal', claim.signerOrdinal)
    .maybeSingle();
  if (!signer) throw new Error('signer row not found');
  if (signer.email !== claim.signerEmail) throw new Error('token email mismatch');
  if (signer.status === 'signed') {
    return {
      outcome: 'already_signed',
      envelopeId: envelope.id as string,
      signerOrdinal: claim.signerOrdinal,
      remainingSigners: await countRemaining(supabase, envelope.id as string),
    };
  }
  if (signer.token_hash !== tokenHash(input.token)) {
    throw new Error('token hash mismatch — token may have been rotated');
  }
  if (new Date(signer.token_expires_at as string).getTime() < Date.now()) {
    throw new Error('token expired');
  }

  // 4. Re-derive content hash → tamper detection. Any mutation of the
  //    Content OS body since envelope creation makes the sig void.
  const { data: content } = await supabase
    .from('content')
    .select('body_markdown, body_html, body_json')
    .eq('id', envelope.content_id)
    .maybeSingle();
  if (!content) throw new Error('bound content row missing — refuse to sign');
  const currentBody =
    (content.body_markdown as string | null)
    ?? (content.body_html as string | null)
    ?? (content.body_json ? JSON.stringify(content.body_json) : null);
  if (!currentBody) throw new Error('bound content body is empty — refuse to sign');
  const currentHash = computeContentHash(currentBody);
  if (currentHash !== envelope.content_hash) {
    await appendAuditEvent(supabase, {
      envelopeId: envelope.id as string,
      eventType: 'content_mutation_detected',
      actor: claim.signerEmail,
      actorType: 'signer',
      payload: { expected: envelope.content_hash, actual: currentHash },
    });
    throw new Error('content hash mismatch — document has been modified since envelope creation');
  }

  // 5. Sign the canonicalized envelope payload.
  const envelopePayload = envelope.envelope_payload as Record<string, unknown>;
  const signed = signEnvelopePayload({ payload: envelopePayload });
  const signaturePayload = signed?.signature ?? null;
  const signedAt = new Date().toISOString();

  // 6. Persist signature + capture metadata.
  await supabase
    .from('signing_envelope_signers')
    .update({
      status: 'signed',
      signed_at: signedAt,
      signature: signaturePayload,
      signature_algo: signed?.algo ?? null,
      ip_address: input.signerInfo.ipAddress ?? null,
      user_agent: input.signerInfo.userAgent ?? null,
      updated_at: signedAt,
    })
    .eq('id', signer.id);

  await appendAuditEvent(supabase, {
    envelopeId: envelope.id as string,
    eventType: 'signature_applied',
    actor: claim.signerEmail,
    actorType: 'signer',
    payload: {
      ordinal: claim.signerOrdinal,
      algo: signed?.algo ?? 'unsigned-dev-mode',
      signed_at: signedAt,
      ip: input.signerInfo.ipAddress,
      ua: input.signerInfo.userAgent,
    },
  });

  // 7. Move envelope to in_progress if not yet signed; complete if all signers done.
  const remaining = await countRemaining(supabase, envelope.id as string);
  if (remaining > 0) {
    if (envelope.status === 'sent') {
      await supabase.from('signing_envelopes').update({
        status: 'in_progress',
        updated_at: new Date().toISOString(),
      }).eq('id', envelope.id);
    }
    return {
      outcome: 'pending_others',
      envelopeId: envelope.id as string,
      signerOrdinal: claim.signerOrdinal,
      remainingSigners: remaining,
    };
  }

  // 8. All signers done — issuer attestation + envelope completion.
  const { data: allSigners } = await supabase
    .from('signing_envelope_signers')
    .select('ordinal, email, signature, signed_at')
    .eq('envelope_id', envelope.id)
    .order('ordinal');
  const receipt = buildCompletionReceipt({
    envelopePublicId: input.envelopePublicId,
    contentHash: envelope.content_hash as string,
    completedAt: signedAt,
    signers: (allSigners ?? []).map((s) => ({
      ordinal: s.ordinal as number,
      email: s.email as string,
      signature: (s.signature as string | null) ?? '',
      signedAt: (s.signed_at as string | null) ?? signedAt,
    })),
  });
  const completionSig = signEnvelopePayload({ payload: receipt });
  const issuerKey = loadIssuerKey();

  await supabase.from('signing_envelopes').update({
    status: 'signed',
    completion_signature: completionSig?.signature ?? null,
    completion_signing_key: issuerKey?.keyId ?? null,
    completed_at: signedAt,
    updated_at: signedAt,
  }).eq('id', envelope.id);

  await appendAuditEvent(supabase, {
    envelopeId: envelope.id as string,
    eventType: 'envelope_completed',
    actor: 'system',
    actorType: 'system',
    payload: {
      completion_signature_algo: completionSig?.algo ?? 'unsigned-dev-mode',
      kid: issuerKey?.keyId,
      signer_count: (allSigners ?? []).length,
    },
  });

  return {
    outcome: 'signed',
    envelopeId: envelope.id as string,
    signerOrdinal: claim.signerOrdinal,
    remainingSigners: 0,
    completion: {
      completionSignature: completionSig?.signature ?? '',
      completionKid: issuerKey?.keyId ?? 'unsigned-dev-mode',
      receipt,
    },
  };
}

async function countRemaining(supabase: SupabaseClient, envelopeId: string): Promise<number> {
  const { count } = await supabase
    .from('signing_envelope_signers')
    .select('id', { count: 'exact', head: true })
    .eq('envelope_id', envelopeId)
    .in('status', ['pending', 'viewed']);
  return count ?? 0;
}

// Expose for tests — lets unit tests assert specific intermediate
// states without going through the full HTTP flow.
export const _internal = { countRemaining };
// Silence unused import when called only from tests.
void crypto;
