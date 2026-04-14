// @mcv/ledger-sdk/engine — top-level composition.
//
// Single factory that bundles createLedgerService + createCreditService
// into a uniform surface. Host app calls once with its Supabase client
// and gets back { ledger, credit } — ready to use.

import type { SupabaseClient } from '@supabase/supabase-js';
import { createLedgerService, type LedgerService } from './service';
import { createCreditService, type CreditService } from './credit-service';

export interface LedgerEngine {
  ledger: LedgerService;
  credit: CreditService;
}

export function createLedgerEngine({
  supabase,
}: {
  supabase: SupabaseClient | null;
}): LedgerEngine {
  const ledger = createLedgerService({ supabase });
  const credit = createCreditService({ supabase, ledger });
  return { ledger, credit };
}
