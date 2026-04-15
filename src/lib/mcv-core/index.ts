// src/lib/mcv-core/index.ts
//
// MCV Desktop barrel over @mcv/core-triangle. The extracted package holds the
// canonical typed-HTTP-client logic; this path stays as the blessed import for
// root-app code so future SDK swaps are localized to src/lib/mcv-core/.
//
// File layout matches the playbook in
// mcv-core-triangle/docs/integration/ventures/mcv-one-desktop.md:
//   identity.ts      — IdentityClient + createServerIdentity()
//   fabric.ts        — FabricClient + auditedAction() wrapper
//   intelligence.ts  — IntelligenceClient + createServerIntelligence()
//   identity-token.ts — Clerk JWT → Identity token exchange (boot-time)
//
// Browser code should prefer useCoreTriangle() from src/hooks/use-core-triangle.ts;
// server code (api/_handlers/*) should use the createServer* factories.

export * from './identity';
export * from './fabric';
export * from './intelligence';

// Re-export the unified factory + types so existing imports keep working.
export {
  createCoreTriangle,
  type CoreTriangle,
  type CoreTriangleConfig,
  MCV_CORE_TRIANGLE_SDK_VERSION,
} from '@mcv/core-triangle';

// Shared types live at the package root; re-export for convenience.
export {
  CoreApiError,
  CoreNotAvailableError,
  type CoreServiceConfig,
  type CoreResponse,
  type CoreResult,
  type CoreFailure,
  coreOk,
  coreFail,
} from '@mcv/core-triangle/types';
