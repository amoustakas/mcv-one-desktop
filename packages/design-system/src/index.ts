// @mcv/design-system — public surface.
//
// Consumers:
//   import { TOKENS } from '@mcv/design-system';
//   import { PALETTE, RADII } from '@mcv/design-system';
//   import '@mcv/design-system/css'; // optional CSS variable layer
//
// This package is the first extracted MCV SDK. Future packages (naos-sdk,
// kits-runtime, payments-sdk, voice-sdk, rag-sdk, mcp-sdk, memory-sdk,
// task-sdk, commerce-sdk, comms-sdk) sit alongside in the packages/
// directory and re-use these tokens.

export * from './tokens';

/**
 * Package metadata. Used by the Core Triangle Fabric client to report
 * SDK versions in use across the ecosystem.
 */
export const MCV_DESIGN_SYSTEM_VERSION = '0.1.0' as const;
