// @mcv/compliance-sdk/engine — top-level composition.
//
// Single factory that bundles fraud, dunning, tax, and price-localization
// engines into a uniform surface. Host app calls once with its Supabase
// client and gets back the full compliance runtime.

import type { SupabaseClient } from '@supabase/supabase-js';
import { createFraudEngine, type FraudEngine } from './fraud';
import { createDunningEngine, type DunningEngine } from './dunning';
import { createTaxEngine, type TaxEngine } from './tax';
import { createPriceEngine, type PriceLocalizationEngine } from './price';

export interface ComplianceEngine {
  fraud: FraudEngine;
  dunning: DunningEngine;
  tax: TaxEngine;
  price: PriceLocalizationEngine;
}

export function createComplianceEngine({
  supabase,
}: {
  supabase: SupabaseClient | null;
}): ComplianceEngine {
  return {
    fraud: createFraudEngine({ supabase }),
    dunning: createDunningEngine({ supabase }),
    tax: createTaxEngine({ supabase }),
    price: createPriceEngine({ supabase }),
  };
}
