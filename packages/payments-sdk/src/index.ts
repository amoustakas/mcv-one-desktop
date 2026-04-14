// @mcv/payments-sdk — unified payment rails.
//
// What's in the SDK:
//   * types.ts          — PaymentProcessor interface + schemas + PaymentMethod/Status enums
//   * router.ts         — PaymentRouter scoring engine (no Supabase dependency)
//   * split-engine.ts   — multi-party split orchestrator with DI factory
//                         (createSplitEngine({supabase, ledger})). Caller
//                         injects a LedgerAdapter so any venture's ledger plugs in.
//   * processors/stripe — REST wrapper around /api/stripe
//   * processors/plaid  — REST wrapper around /api/plaid
//   * processors/solana — Solana Pay URL generation + reference tracking
//
// What stays in the root app (MCV Desktop):
//   * processors/credits — platform credits via Supabase ledger
//
// Venture apps that need their own credit system import types + PaymentProcessor
// and implement a credits processor bound to their own ledger.

export * from './types';
export * from './router';
export * from './split-engine';

export { stripeProcessor } from './processors/stripe';
export { solanaProcessor } from './processors/solana';
export { plaidProcessor } from './processors/plaid';

export const MCV_PAYMENTS_SDK_VERSION = '0.2.0' as const;
