// Root barrel for @mcv/marketplace-sdk.
//
// Consumers typically prefer subpath imports (`@mcv/marketplace-sdk/types`,
// `@mcv/marketplace-sdk/core/mcv-client`), but this barrel exists for
// convenience + autocomplete discovery.

export * from './types/index';
export * from './core/attestations';
export { AuthRouter, createMockAuthRouter, hashAttestations } from './core/auth-router';
export { MCVClient } from './core/mcv-client';
