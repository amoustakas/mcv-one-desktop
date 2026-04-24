// packages/signer-sdk/src/v0-2-hooks/attestation.ts
//
// v0.2 extension point — biometric / authorized-device attestation.
// When v0.2 lands, every signature can optionally carry proof of the
// human who approved the signing action (WebAuthn, authorized-device
// binding from the MCV identity-sdk, or an OTP challenge).
//
// Exported types only in v0.1 so consumers can forward-declare
// attestation-aware code without a breaking change when the runtime
// ships. The v0.1 runtime receives `attestationHook` via SignerConfig
// and simply ignores it; v0.2 wires it into the server-side
// envelope-builder so the attestation result lands in the audit
// trail alongside the signature.

import type { AttestationContext, AttestationHook, AttestationResult } from '../core/types';

/** Re-exports of the v0.1 types so v0.2-aware consumers can import
 *  from this stable path even after the v0.1 core/types.ts widens. */
export type { AttestationContext, AttestationHook, AttestationResult };

/** v0.1 no-op — returns `{ verified: false, method: 'none' }` so every
 *  attestation-gated flow explicitly skips verification in v0.1. */
export const noopAttestationHook: AttestationHook = async () => ({
  verified: false,
  method: 'none',
});

/** Helper for v0.2 implementations: fold an attestation result into the
 *  envelope's audit trail. Exported as a type-signature placeholder in
 *  v0.1; v0.2 provides the real helper. */
export interface AttestedSignature {
  signerEmail: string;
  documentId: string;
  attestation: AttestationResult;
}
