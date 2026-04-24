// packages/signer-sdk/src/index.ts — top-level barrel
//
// Consumers usually import from subpaths directly (e.g.
// `@mcv/signer-sdk/core` or `@mcv/signer-sdk/next`) so the top-level
// import stays lean. This index re-exports the most common surface
// so `import { SignerShell, buildEnvelope, SigningContract } from '@mcv/signer-sdk'`
// also works.

export * from './core/types';
export * from './core/errors';
export { buildUsEsignConsent, US_ESIGN_CONSENT_VERSION } from './core/esign-consent';
export type { EsignConsentPayload, EsignDisclosure } from './core/esign-consent';
export { parseEnvelope, safeParseEnvelope } from './core/envelope-schema';
export { createSignerServerClient } from './core/server-client';
export type { SignerServerClient, AcceptSignatureInput, AcceptSignatureResult } from './core/server-client';

export { SigningContract } from './events/contracts';
export { createSigningEmitter } from './events/emitter';
export type { SigningEmitter } from './events/emitter';

export { buildEnvelope } from './server/envelope-builder';
export type { BuildEnvelopeInput, BuildEnvelopeResult } from './server/envelope-builder';

export { rollupEnvelopes, rollupByChildVenture } from './server/audit-rollup';
export { detectMutations, hasMutations } from './server/template-versioning';
export type { MutationReport, TemplateSnapshot } from './server/template-versioning';

export { createInMemoryRegistry, SIGNER_SDK_VERSION } from './registry/client';
export type { SignerBundleRegistry, RegistryFilter } from './registry/client';
export type { SignerBundleManifest, SignerTemplateRef } from './registry/manifest';
