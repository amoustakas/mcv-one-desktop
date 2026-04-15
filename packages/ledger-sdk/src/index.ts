// @mcv/ledger-sdk — double-entry ledger primitives.
//
// v0.1.0: full runtime via DI factories.
//   createLedgerEngine({supabase}) composes ledger + credit services.
//   Per-domain createLedgerService / createCreditService are available
//   when callers only need one half.
//
// Zero module-level singletons — caller supplies Supabase (or null for a
// degraded in-memory mode where reads return empty and writes throw).

export * from './types';
export * from './chart-of-accounts';
export * from './service';
export * from './credit-service';
export * from './engine';
export * from './adapter';

export const MCV_LEDGER_SDK_VERSION = '0.1.0' as const;
