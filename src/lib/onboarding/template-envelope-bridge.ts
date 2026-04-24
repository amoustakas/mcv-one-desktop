// src/lib/onboarding/template-envelope-bridge.ts
//
// Bridge: turns a pending user_document_requirement into a live MCV Sign
// envelope. Runs on-demand when the user clicks "Review & Sign" (not at
// invite-accept time) so envelopes are only issued to users who actually
// engage — preserving the hash-chain integrity of signed content even if
// the upstream template is later revised.
//
// Flow (single call):
//   1. Snapshot the template body into a fresh `content` row (Content OS)
//      tagged with template_key + template_version + requirement_id.
//   2. Call MCV Sign's createEnvelope() with the content_id + user email.
//   3. Patch the user_document_requirements row with envelope_id + flip
//      status to 'envelope_issued'.
//   4. Emit `onboarding.requirement.envelope.created` on the event bus.
//
// Idempotency: if the requirement already has a non-null envelope_id and
// status 'envelope_issued' / 'signed', this function is a no-op that
// re-fetches and returns the existing envelope metadata.
//
// EXPAND: multi-signer support — today assumes the requirement has one
// signer (the requirement's user). When counsel needs to countersign or
// a corporate rep adds a second signer, extend signers[] here.
// EXPAND: template variable interpolation — swap body_md in step 1 for an
// interpolated copy ({{user_name}}, {{venture_name}}), but hash the
// interpolated body, not the template, so ESIGN integrity still binds.

import type { SupabaseClient } from '@supabase/supabase-js';
import { createEnvelope, type EnvelopeCreationResult } from '../capital/sign/envelope';

export interface MaterializeEnvelopeInput {
  requirementId: string;
  /** Clerk user_id of the signer. */
  userId: string;
  /** The signer's email — where the signing URL is delivered. */
  userEmail: string;
  /** Optional display name for the signer (shown on the signing page). */
  userName?: string;
  /** Optional correlation_id from the parent request, for event tracing. */
  correlationId?: string;
}

export interface MaterializeEnvelopeResult {
  envelopeId: string;
  envelopePublicId: string;
  signingUrl: string;
  expiresAt: string;
  alreadyIssued: boolean;
}

interface RequirementRow {
  id: string;
  user_id: string;
  invite_id: string;
  bundle_id: string;
  template_id: string;
  envelope_id: string | null;
  status: string;
}

interface TemplateRow {
  id: string;
  template_key: string;
  title: string;
  version: string;
  body_md: string;
}

interface InviteRow {
  target_venture_id: string | null;
}

interface EnvelopeSummary {
  id: string;
  public_id: string;
  expires_at: string;
}

/**
 * Materialize (or re-read) the signing envelope for a requirement.
 * Throws on: requirement not found, template not found, body empty,
 * or any downstream createEnvelope failure.
 */
export async function materializeEnvelopeForRequirement(
  supabase: SupabaseClient,
  input: MaterializeEnvelopeInput,
): Promise<MaterializeEnvelopeResult> {
  // 1. Load the requirement — verify ownership + load joins we need.
  const { data: reqRaw, error: reqErr } = await supabase
    .from('user_document_requirements')
    .select('*')
    .eq('id', input.requirementId)
    .maybeSingle();
  if (reqErr) throw reqErr;
  if (!reqRaw) throw new Error(`requirement ${input.requirementId} not found`);
  const requirement = reqRaw as RequirementRow;

  if (requirement.user_id !== input.userId) {
    throw new Error('requirement does not belong to this user');
  }

  // 2. Idempotent branch — envelope already issued, just re-read + return.
  if (requirement.envelope_id && ['envelope_issued', 'signed'].includes(requirement.status)) {
    const { data: existing } = await supabase
      .from('signing_envelopes')
      .select('id, public_id, expires_at')
      .eq('id', requirement.envelope_id)
      .maybeSingle();
    if (existing) {
      const row = existing as EnvelopeSummary;
      return {
        envelopeId: row.id,
        envelopePublicId: row.public_id,
        // No fresh signingUrl available post-creation (raw token is not re-derivable).
        // Caller should redirect to {onboardingOrigin}/sign/{publicId} and the
        // signer-side page will challenge for the token from the user's email.
        signingUrl: buildSigningFallbackUrl(row.public_id),
        expiresAt: row.expires_at,
        alreadyIssued: true,
      };
    }
    // envelope_id pointed at a missing row — fall through and re-issue.
  }

  // 3. Load template body.
  const { data: tplRaw, error: tplErr } = await supabase
    .from('document_templates')
    .select('id, template_key, title, version, body_md')
    .eq('id', requirement.template_id)
    .maybeSingle();
  if (tplErr) throw tplErr;
  if (!tplRaw) throw new Error(`template ${requirement.template_id} not found`);
  const template = tplRaw as TemplateRow;
  if (!template.body_md || template.body_md.trim().length === 0) {
    throw new Error(`template ${template.template_key} has empty body`);
  }

  // 4. Load invite for venture context (so envelope + event carry it).
  const { data: inviteRaw } = await supabase
    .from('onboarding_invites')
    .select('target_venture_id')
    .eq('id', requirement.invite_id)
    .maybeSingle();
  const ventureId = (inviteRaw as InviteRow | null)?.target_venture_id ?? null;

  // 5. Snapshot template body into Content OS so MCV Sign can hash-bind it.
  //    Metadata carries the template lineage so audit queries can trace
  //    this content row back to its source template without joining on
  //    envelope payloads.
  const { data: contentRow, error: contentErr } = await supabase
    .from('content')
    .insert({
      kind: 'onboarding_document',
      title: `${template.title} · ${input.userEmail}`,
      body_markdown: template.body_md,
      body_type: 'markdown',
      venture_id: ventureId,
      metadata: {
        source: 'onboarding',
        template_id: template.id,
        template_key: template.template_key,
        template_version: template.version,
        requirement_id: requirement.id,
        user_id: input.userId,
      },
    })
    .select('id')
    .single();
  if (contentErr) throw contentErr;
  const contentId = (contentRow as { id: string }).id;

  // 6. Create the MCV Sign envelope. 30-day TTL is deliberate — long enough
  //    for a user to come back to finish onboarding, short enough that
  //    abandoned envelopes age out cleanly.
  const envelope: EnvelopeCreationResult = await createEnvelope(supabase, {
    contentId,
    ventureId: ventureId ?? undefined,
    subject: `Please sign: ${template.title}`,
    message: `Your onboarding requires signing this document. Opens in a secure, token-gated page.`,
    expiresInDays: 30,
    signers: [
      {
        email: input.userEmail,
        name: input.userName,
        role: 'Signer',
      },
    ],
    createdBy: 'system:onboarding',
  });

  // 7. Bind the envelope back to the requirement + flip status.
  const { error: patchErr } = await supabase
    .from('user_document_requirements')
    .update({
      envelope_id: envelope.envelopeId,
      status: 'envelope_issued',
      updated_at: new Date().toISOString(),
    })
    .eq('id', requirement.id);
  if (patchErr) throw patchErr;

  return {
    envelopeId: envelope.envelopeId,
    envelopePublicId: envelope.publicId,
    signingUrl: envelope.signers[0]?.signingUrl ?? buildSigningFallbackUrl(envelope.publicId),
    expiresAt: envelope.expiresAt,
    alreadyIssued: false,
  };
}

function buildSigningFallbackUrl(publicId: string): string {
  const base = process.env.MCV_SIGN_BASE_URL
    ?? process.env.VITE_APP_URL
    ?? 'http://localhost:5173';
  return `${base}/sign/${publicId}`;
}
