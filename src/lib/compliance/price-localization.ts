// src/lib/compliance/price-localization.ts
// PPP-based Price Localization — 15+ country multipliers
// MCV Commerce & Financial OS — Plan 6

import { supabase } from '../supabase';
import type {
  CountryPriceOverride,
  LocalizedPrice,
  PriceLocalizationConfig,
  PricingStrategy,
  RoundingRule,
} from './types';

// ─────────────────────────────────────────────────────────
// PPP MULTIPLIER TABLE
// Major economies (US, CA, GB, AU, DE, FR, JP) — exchange rate only (1.0)
// Emerging markets — PPP-adjusted multipliers
// ─────────────────────────────────────────────────────────

const PPP_MULTIPLIERS: Record<string, number> = {
  // Adjusted (PPP)
  IN: 0.30,  // India
  BR: 0.35,  // Brazil
  MX: 0.40,  // Mexico
  TR: 0.35,  // Turkey
  PL: 0.50,  // Poland
  ZA: 0.40,  // South Africa
  PH: 0.30,  // Philippines
  VN: 0.25,  // Vietnam
  TH: 0.40,  // Thailand
  ID: 0.30,  // Indonesia
  MY: 0.50,  // Malaysia
  CO: 0.35,  // Colombia
  AR: 0.30,  // Argentina
  EG: 0.25,  // Egypt
  NG: 0.20,  // Nigeria
  PK: 0.25,  // Pakistan
  BD: 0.25,  // Bangladesh
  UA: 0.30,  // Ukraine
  RO: 0.45,  // Romania
  HU: 0.50,  // Hungary
  // Major economies — exchange rate only
  US: 1.00,
  CA: 1.00,
  GB: 1.00,
  AU: 1.00,
  DE: 1.00,
  FR: 1.00,
  JP: 1.00,
  NL: 1.00,
  SE: 1.00,
  NO: 1.00,
  CH: 1.00,
  SG: 1.00,
  NZ: 1.00,
};

// Country → ISO 4217 currency code (common markets)
const COUNTRY_CURRENCY: Record<string, string> = {
  US: 'USD', CA: 'CAD', GB: 'GBP', AU: 'AUD', NZ: 'NZD',
  DE: 'EUR', FR: 'EUR', NL: 'EUR', IT: 'EUR', ES: 'EUR',
  BE: 'EUR', AT: 'EUR', PT: 'EUR', FI: 'EUR', IE: 'EUR',
  SE: 'SEK', NO: 'NOK', DK: 'DKK', CH: 'CHF',
  JP: 'JPY', SG: 'SGD', HK: 'HKD', KR: 'KRW', CN: 'CNY',
  IN: 'INR', BR: 'BRL', MX: 'MXN', AR: 'ARS', CO: 'COP',
  TR: 'TRY', PL: 'PLN', HU: 'HUF', RO: 'RON', UA: 'UAH',
  ZA: 'ZAR', NG: 'NGN', EG: 'EGP', KE: 'KES',
  PH: 'PHP', VN: 'VND', TH: 'THB', ID: 'IDR', MY: 'MYR',
  PK: 'PKR', BD: 'BDT',
};

// ─────────────────────────────────────────────────────────
// GET COUNTRY MULTIPLIER
// ─────────────────────────────────────────────────────────

export function getCountryMultiplier(country: string): number {
  return PPP_MULTIPLIERS[country.toUpperCase()] ?? 1.0;
}

export function getCountryCurrency(country: string): string {
  return COUNTRY_CURRENCY[country.toUpperCase()] ?? 'USD';
}

// ─────────────────────────────────────────────────────────
// ROUNDING
// ─────────────────────────────────────────────────────────

function applyRounding(amount: number, rule: RoundingRule): number {
  switch (rule) {
    case 'nearest_dollar':
      return Math.round(amount / 100) * 100; // round to nearest dollar (cents)
    case 'nearest_5':
      return Math.round(amount / 500) * 500;
    case 'nearest_10':
      return Math.round(amount / 1000) * 1000;
    case 'psychological': {
      // Round to nearest dollar then subtract 1 cent ($X.99 pricing)
      const dollars = Math.round(amount / 100);
      return dollars * 100 - 1;
    }
    case 'none':
    default:
      return Math.round(amount);
  }
}

// ─────────────────────────────────────────────────────────
// LOCALIZE PRICE
// ─────────────────────────────────────────────────────────

export function localizePrice(
  amount: number,          // in base currency cents
  baseCurrency: string,
  customerCountry: string,
  config?: Partial<PriceLocalizationConfig>,
): LocalizedPrice {
  const country = customerCountry.toUpperCase();
  const strategy: PricingStrategy = config?.strategy ?? 'purchasing_power_parity';
  const roundingRule: RoundingRule = config?.roundingRule ?? 'nearest_dollar';
  const targetCurrency = getCountryCurrency(country);

  // Check for manual country override
  const override = config?.countryOverrides?.find(
    (o: CountryPriceOverride) => o.country.toUpperCase() === country,
  );

  if (override && !override.enabled) {
    // Country excluded — return base price
    return {
      originalAmount: amount,
      localizedAmount: amount,
      baseCurrency,
      targetCurrency: baseCurrency,
      country,
      multiplier: 1.0,
      strategy: 'exchange_rate_only',
    };
  }

  let multiplier: number;

  if (override?.fixedPrice !== undefined) {
    // Fixed price override
    return {
      originalAmount: amount,
      localizedAmount: override.fixedPrice,
      baseCurrency,
      targetCurrency: override.currency ?? targetCurrency,
      country,
      multiplier: override.fixedPrice / amount,
      strategy: 'manual_override',
    };
  } else if (override?.multiplier !== undefined) {
    multiplier = override.multiplier;
  } else if (strategy === 'purchasing_power_parity') {
    multiplier = getCountryMultiplier(country);
  } else {
    // exchange_rate_only — same price, different currency display
    multiplier = 1.0;
  }

  const rawLocalized = amount * multiplier;
  const localizedAmount = applyRounding(rawLocalized, roundingRule);

  return {
    originalAmount: amount,
    localizedAmount,
    baseCurrency,
    targetCurrency,
    country,
    multiplier,
    strategy,
  };
}

// ─────────────────────────────────────────────────────────
// CONFIG CRUD
// ─────────────────────────────────────────────────────────

const DEFAULT_CONFIG: Omit<PriceLocalizationConfig, 'ventureId'> = {
  enabled: false,
  baseCurrency: 'USD',
  strategy: 'purchasing_power_parity',
  roundingRule: 'nearest_dollar',
  countryOverrides: [],
};

export async function getPriceLocalizationConfig(
  ventureId: string,
): Promise<PriceLocalizationConfig> {
  if (!supabase) return { ventureId, ...DEFAULT_CONFIG };

  const { data } = await supabase
    .from('price_localization_configs')
    .select('*')
    .eq('venture_id', ventureId)
    .single();

  if (!data) return { ventureId, ...DEFAULT_CONFIG };

  return {
    ventureId: data.venture_id,
    enabled: data.enabled,
    baseCurrency: data.base_currency,
    strategy: data.strategy as PricingStrategy,
    roundingRule: data.rounding_rule as RoundingRule,
    countryOverrides: (data.country_overrides as CountryPriceOverride[]) ?? [],
  };
}

export async function updatePriceLocalizationConfig(
  ventureId: string,
  updates: Partial<Omit<PriceLocalizationConfig, 'ventureId'>>,
): Promise<PriceLocalizationConfig> {
  const current = await getPriceLocalizationConfig(ventureId);
  const merged: PriceLocalizationConfig = { ...current, ...updates, ventureId };

  if (!supabase) return merged;

  await supabase
    .from('price_localization_configs')
    .upsert({
      venture_id: ventureId,
      enabled: merged.enabled,
      base_currency: merged.baseCurrency,
      strategy: merged.strategy,
      rounding_rule: merged.roundingRule,
      country_overrides: merged.countryOverrides,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'venture_id' });

  return merged;
}

// ─────────────────────────────────────────────────────────
// BULK: localize for multiple countries (for pricing pages)
// ─────────────────────────────────────────────────────────

export function localizeForCountries(
  amount: number,
  baseCurrency: string,
  countries: string[],
  config?: Partial<PriceLocalizationConfig>,
): LocalizedPrice[] {
  return countries.map((country) => localizePrice(amount, baseCurrency, country, config));
}

// ─────────────────────────────────────────────────────────
// FORMAT localized price as display string
// ─────────────────────────────────────────────────────────

export function formatLocalizedPrice(localized: LocalizedPrice): string {
  const amount = localized.localizedAmount / 100;
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: localized.targetCurrency,
      minimumFractionDigits: localized.localizedAmount % 100 === 0 ? 0 : 2,
    }).format(amount);
  } catch {
    return `${localized.targetCurrency} ${amount.toFixed(2)}`;
  }
}
