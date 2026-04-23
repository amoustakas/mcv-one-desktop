// Root barrel for @mcv/identity-sdk.
// Consumers prefer subpath imports; this barrel is for IDE autocomplete.

export * from './types';
export {
  computeTrustScore,
  TRUST_BANDS,
} from './trust-engine';
export {
  readMcvClaims,
  decodeJwtPayloadUnsafe,
  extractMcvClaimsFromJwt,
} from './claims';
export {
  evaluateStepUp,
  RETAIL_POLICY,
  ELIGIBLE_POLICY,
  ACCREDITED_POLICY,
  SOVEREIGN_POLICY,
} from './step-up';
