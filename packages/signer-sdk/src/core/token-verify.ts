// packages/signer-sdk/src/core/token-verify.ts
//
// Ed25519 token-verification contract. The SDK does not ship a bundled
// crypto implementation — the actual verification logic lives in the
// signing backbone (mcv-one-desktop's /api/sign handler, or a BYO
// backbone). What the SDK provides is the contract shape and a helper
// that lets consumers *pass in* their verifier (e.g. noble-ed25519) so
// themes/apps can swap implementations for test/mock environments.

/** The verification attempt. `issuer` is typically a KID (key id) the
 *  signing backbone resolves to its issuer public key. */
export interface TokenVerifyInput {
  token: string;
  publicId: string;
  /** Optional pinned issuer — when the consumer already knows which
   *  issuer key should have signed. */
  issuer?: string;
}

export interface TokenVerifyResult {
  valid: boolean;
  /** When valid: the signer email the token binds to. */
  signerEmail?: string;
  /** When valid: the envelope public id the token binds to. */
  publicId?: string;
  /** When valid: the expiry timestamp. */
  expiresAt?: string;
  /** When invalid: machine-readable reason. Maps to `ErrorCode`. */
  reason?: 'token_expired' | 'token_revoked' | 'token_mismatch' | 'token_invalid';
}

/** The verification function shape. Concrete impls live in the signing
 *  backbone; the SDK accepts one as a pluggable dependency. */
export type TokenVerifier = (input: TokenVerifyInput) => Promise<TokenVerifyResult>;

/** No-op verifier — returns `token_invalid` for every input. Useful as
 *  a default in test environments or as a fail-closed placeholder
 *  before the real verifier is wired. */
export const noopVerifier: TokenVerifier = async () => ({
  valid: false,
  reason: 'token_invalid',
});

/** Compose a verifier that short-circuits empty/obviously-malformed
 *  tokens before delegating to the real implementation. Saves a
 *  round-trip + keeps the backbone's error surface cleaner. */
export function withPreflight(inner: TokenVerifier): TokenVerifier {
  return async (input) => {
    if (!input.token || typeof input.token !== 'string') {
      return { valid: false, reason: 'token_invalid' };
    }
    if (!input.publicId || typeof input.publicId !== 'string') {
      return { valid: false, reason: 'token_mismatch' };
    }
    return inner(input);
  };
}
