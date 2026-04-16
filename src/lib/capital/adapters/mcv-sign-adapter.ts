// Capital × MCV Sign — LegacyAdapter (native signing rail).
// Epic 9 v0. Peer of docusign-adapter.ts; emits the same
// CapitalSigningEvent so signing-reconcile.ts works without
// modification.
//
// Shape differences from DocuSign:
//   - No external webhook. Completion is synchronous when the last
//     signer hits the apply endpoint. The "event" is the internal
//     state transition; adapter.fromForeign maps the post-apply
//     envelope row → CapitalSigningEvent.
//   - Receipt is a `contentId` pointer into the Content OS rather than
//     a base64 PDF, because the signed artifact IS a Content OS row
//     we hash-bound at envelope creation.
//   - Outbound goes through createEnvelope (envelope.ts), not a
//     toForeign step — keeps the factory-function pattern consistent
//     with VerifyInvestor + DocuSign.

import type { LegacyAdapter, CapitalSigningEvent } from './types';

/** Shape we synthesize from a signing_envelopes row + signers rows
 *  when status flips to signed|declined|voided|expired. */
export interface MCVSignEnvelopeEvent {
  envelopePublicId: string;
  envelopeId: string;
  status: 'signed' | 'declined' | 'voided' | 'expired';
  contentId: string | null;
  commitmentId: string | null;
  completedAt: string;
  signers: Array<{
    name?: string;
    email?: string;
    role?: string;
    signedAt?: string;
    ipAddress?: string;
  }>;
}

export function createMCVSignAdapter(): LegacyAdapter<MCVSignEnvelopeEvent, CapitalSigningEvent> {
  return {
    id: 'mcv-sign',
    async fromForeign(event) {
      if (!event?.envelopePublicId || !event?.status) return null;
      if (!event.commitmentId) return null; // non-commitment envelopes (NDAs etc) don't fan out here

      return {
        commitmentId: event.commitmentId,
        outcome: event.status,
        envelopeId: event.envelopePublicId,
        source: 'mcv-sign',
        signers: event.signers,
        receipt: event.contentId
          ? { contentId: event.contentId, contentType: 'text/markdown' }
          : undefined,
        completedAt: event.completedAt,
        rawEvent: event,
      };
    },
    // No toForeign — outbound path is createEnvelope in
    // src/lib/capital/sign/envelope.ts
  };
}
