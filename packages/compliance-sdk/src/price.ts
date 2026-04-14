// @mcv/compliance-sdk/price — PPP-based price localization factory.
//
// 20+ emerging-market multipliers + major-economy exchange-rate fallback.
// Pure logic for `localizePrice` and `formatLocalizedPrice`; Supabase needed
// only for per-venture config read/write.

import type { SupabaseClient } from '@supabase/supabase-js';
import type {
  CountryPriceOverride,
  LocalizedPrice,
  PriceLocalizationConfig,
  PricingStrategy,
  RoundingRule,
} from './types';

const PPP_MULTIPLIERS: Record<string, number> = {
  IN: 0.30, BR: 0.35, MX: 0.40, TR: 0.35, PL: 0.50,
  ZA: 0.40, PH: 0.30, VN: 0.25, TH: 0.40, ID: 0.30,
  MY: 0.50, CO: 0.35, AR: 0.30, EG: 0.25, NG: 0.20,
  PK: 0.25, BD: 0.25, UA: 0.30, RO: 0.45, HU: 0.50,
  US: 1.00, CA: 1.00, GB: 1.00, AU: 1.00, DE: 1.00,
  FR: 1.00, JP: 1.00, NL: 1.00, SE: 1.00, NO: 1.00,
  CH: 1.00, SG: 1.00, NZ: 1.00,
};

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

const DEFAULT_CONFIG: Omit<PriceLocalizationConfig, 'ventureId'> = {
  enabled: false,
  baseCurrency: 'USD',
  strategy: 'purchasing_power_parity',
  roundingRule: 'nearest_dollar',
  countryOverrides: [],
};

export function getCountryMultiplier(country: string): number {
  return PPP_MULTIPLIERS[country.toUpperCase()] ?? 1.0;
}

export function getCountryCurrency(country: string): string {
  return COUNTRY_CURRENCY[country.toUpperCase()] ?? 'USD';
}

function applyRounding(amount: number, rule: RoundingRule): number {
  switch (rule) {
    case 'nearest_dollar':
      return Math.round(amount / 100) * 100;
    case 'nearest_5':
      return Math.round(amount / 500) * 500;
    case 'nearest_10':
      return Math.round(amount / 1000) * 1000;
    case 'psychological': {
      const dollars = Math.round(amount / 100);
      return dollars * 100 - 1;
    }
    case 'none':
    default:
      return Math.round(amount);
  }
}

export function localizePrice(
  amount: number,
  baseCurrency: string,
  customerCountry: string,
  config?: Partial<PriceLocalizationConfig>,
): LocalizedPrice {
  const country = customerCountry.toUpperCase();
  const strategy: PricingStrategy = config?.strategy ?? 'purchasing_power_parity';
  const roundingRule: RoundingRule = config?.roundingRule ?? 'nearest_dollar';
  const targetCurrency = getCountryCurrency(country);

  const override = config?.countryOverrides?.find(
    (o: CountryPriceOverride) => o.country.toUpperCase() === country,
  );

  if (override && !override.enabled) {
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

export function localizeForCountries(
  amount: number,
  baseCurrency: string,
  countries: string[],
  config?: Partial<PriceLocalizationConfig>,
): LocalizedPrice[] {
  return countries.map((country) => localizePrice(amount, baseCurrency, country, config));
}

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

export interface PriceLocalizationEngine {
  getPriceLocalizationConfig(ventureId: string): Promise<PriceLocalizationConfig>;
  updatePriceLocalizationConfig(
    ventureId: string,
    updates: Partial<Omit<PriceLocalizationConfig, 'ventureId'>>,
  ): Promise<PriceLocalizationConfig>;
  localizePrice: typeof localizePrice;
  localizeForCountries: typeof localizeForCountries;
  formatLocalizedPrice: typeof formatLocalizedPrice;
  getCountryMultiplier: typeof getCountryMultiplier;
  getCountryCurrency: typeof getCountryCurrency;
}

export function createPriceEngine({
  supabase,
}: {
  supabase: SupabaseClient | null;
}): PriceLocalizationEngine {
  async function getConfig(ventureId: string): Promise<PriceLocalizationConfig> {
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

  return {
    getPriceLocalizationConfig: getConfig,

    async updatePriceLocalizationConfig(ventureId, updates) {
      const current = await getConfig(ventureId);
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
    },

    localizePrice,
    localizeForCountries,
    formatLocalizedPrice,
    getCountryMultiplier,
    getCountryCurrency,
  };
}
