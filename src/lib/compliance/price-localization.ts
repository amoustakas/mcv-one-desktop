// Thin shim — canonical implementation lives in @mcv/compliance-sdk.
// Pure helpers (localizePrice, formatLocalizedPrice, getCountryMultiplier,
// getCountryCurrency, localizeForCountries) re-exported directly; CRUD
// methods go through the Supabase-bound factory.
import { createPriceEngine } from '@mcv/compliance-sdk/price';
import { supabase } from '../supabase';

const engine = createPriceEngine({ supabase });

export const getPriceLocalizationConfig = engine.getPriceLocalizationConfig;
export const updatePriceLocalizationConfig = engine.updatePriceLocalizationConfig;

export {
  localizePrice,
  localizeForCountries,
  formatLocalizedPrice,
  getCountryMultiplier,
  getCountryCurrency,
} from '@mcv/compliance-sdk/price';

export type { PriceLocalizationEngine } from '@mcv/compliance-sdk/price';
