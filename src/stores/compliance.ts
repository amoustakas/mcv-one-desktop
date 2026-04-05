// src/stores/compliance.ts
// Compliance Store — Fraud, Dunning, Tax, Price Localization
// MCV Commerce & Financial OS — Plan 6

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import type { FraudRule, TaxBreakdown, TaxCalculationRequest } from '../lib/compliance/types';
import type { DunningStats } from '../lib/compliance/dunning-manager';
import type { NexusAlert } from '../lib/compliance/tax-engine';
import type { LocalizedPrice } from '../lib/compliance/types';

// ─────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────

interface TaxCacheEntry {
  key: string;
  breakdown: TaxBreakdown;
  cachedAt: number;
}

interface ComplianceState {
  // Fraud
  fraudRules: FraudRule[];
  fraudRulesLoading: boolean;
  fraudRulesError: string | null;

  // Dunning
  dunningStats: DunningStats | null;
  dunningStatsLoading: boolean;
  dunningStatsError: string | null;

  // Nexus
  nexusAlerts: NexusAlert[];
  nexusAlertsLoading: boolean;
  nexusAlertsError: string | null;

  // Tax cache (keyed by customer location + amount)
  taxCache: TaxCacheEntry[];
  taxLoading: boolean;
  taxError: string | null;
  lastTaxBreakdown: TaxBreakdown | null;

  // Price localization
  localizedPrices: Map<string, LocalizedPrice>;
}

interface ComplianceActions {
  fetchFraudRules: (ventureId: string) => Promise<void>;
  fetchDunningStats: (ventureId: string) => Promise<void>;
  fetchNexusAlerts: (ventureId: string) => Promise<void>;
  calculateTax: (request: TaxCalculationRequest, ventureId: string) => Promise<TaxBreakdown | null>;
  localizePrice: (
    amount: number,
    baseCurrency: string,
    customerCountry: string,
    ventureId: string,
  ) => Promise<LocalizedPrice | null>;
  clearTaxCache: () => void;
  reset: () => void;
}

// ─────────────────────────────────────────────────────────
// API HELPER
// ─────────────────────────────────────────────────────────

async function complianceGet<T>(action: string, ventureId: string, extra?: Record<string, string>): Promise<T | null> {
  const params = new URLSearchParams({ action, ventureId, ...extra });
  const res = await fetch(`/api/compliance?${params.toString()}`);
  if (!res.ok) return null;
  const json = await res.json();
  return json.data as T;
}

async function compliancePost<T>(action: string, ventureId: string, body: Record<string, unknown>): Promise<T | null> {
  const res = await fetch('/api/compliance', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action, ventureId, ...body }),
  });
  if (!res.ok) return null;
  const json = await res.json();
  return json.data as T;
}

function taxCacheKey(request: TaxCalculationRequest): string {
  const loc = request.customerLocation;
  const total = request.lineItems.reduce((s, li) => s + li.amount * li.quantity, 0);
  return `${loc.country}-${loc.state ?? ''}-${total}-${request.isB2B ? 'b2b' : 'b2c'}`;
}

const TAX_CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

// ─────────────────────────────────────────────────────────
// INITIAL STATE
// ─────────────────────────────────────────────────────────

const initialState: ComplianceState = {
  fraudRules: [],
  fraudRulesLoading: false,
  fraudRulesError: null,
  dunningStats: null,
  dunningStatsLoading: false,
  dunningStatsError: null,
  nexusAlerts: [],
  nexusAlertsLoading: false,
  nexusAlertsError: null,
  taxCache: [],
  taxLoading: false,
  taxError: null,
  lastTaxBreakdown: null,
  localizedPrices: new Map(),
};

// ─────────────────────────────────────────────────────────
// STORE
// ─────────────────────────────────────────────────────────

export const useComplianceStore = create<ComplianceState & ComplianceActions>()(
  devtools(
    (set, get) => ({
      ...initialState,

      fetchFraudRules: async (ventureId) => {
        set({ fraudRulesLoading: true, fraudRulesError: null });
        const rules = await complianceGet<FraudRule[]>('list-fraud-rules', ventureId);
        if (rules) {
          set({ fraudRules: rules, fraudRulesLoading: false });
        } else {
          set({ fraudRulesLoading: false, fraudRulesError: 'Failed to fetch fraud rules' });
        }
      },

      fetchDunningStats: async (ventureId) => {
        set({ dunningStatsLoading: true, dunningStatsError: null });
        const stats = await complianceGet<DunningStats>('get-dunning-stats', ventureId);
        if (stats) {
          set({ dunningStats: stats, dunningStatsLoading: false });
        } else {
          set({ dunningStatsLoading: false, dunningStatsError: 'Failed to fetch dunning stats' });
        }
      },

      fetchNexusAlerts: async (ventureId) => {
        set({ nexusAlertsLoading: true, nexusAlertsError: null });
        const alerts = await complianceGet<NexusAlert[]>('check-nexus', ventureId);
        if (alerts) {
          set({ nexusAlerts: alerts, nexusAlertsLoading: false });
        } else {
          set({ nexusAlertsLoading: false, nexusAlertsError: 'Failed to fetch nexus alerts' });
        }
      },

      calculateTax: async (request, ventureId) => {
        // Check cache first
        const cacheKey = taxCacheKey(request);
        const cached = get().taxCache.find(
          (e) => e.key === cacheKey && Date.now() - e.cachedAt < TAX_CACHE_TTL_MS,
        );
        if (cached) {
          set({ lastTaxBreakdown: cached.breakdown });
          return cached.breakdown;
        }

        set({ taxLoading: true, taxError: null });
        const breakdown = await compliancePost<TaxBreakdown>('calculate-tax', ventureId, request as unknown as Record<string, unknown>);

        if (breakdown) {
          const entry: TaxCacheEntry = { key: cacheKey, breakdown, cachedAt: Date.now() };
          set((state) => ({
            taxLoading: false,
            lastTaxBreakdown: breakdown,
            taxCache: [...state.taxCache.filter((e) => e.key !== cacheKey), entry],
          }));
          return breakdown;
        }

        set({ taxLoading: false, taxError: 'Tax calculation failed' });
        return null;
      },

      localizePrice: async (amount, baseCurrency, customerCountry, ventureId) => {
        const key = `${customerCountry}-${amount}-${baseCurrency}`;
        const cached = get().localizedPrices.get(key);
        if (cached) return cached;

        const result = await compliancePost<LocalizedPrice>('localize-price', ventureId, {
          amount,
          baseCurrency,
          customerCountry,
        });

        if (result) {
          set((state) => {
            const updated = new Map(state.localizedPrices);
            updated.set(key, result);
            return { localizedPrices: updated };
          });
        }

        return result;
      },

      clearTaxCache: () => set({ taxCache: [], lastTaxBreakdown: null }),

      reset: () => set({ ...initialState, localizedPrices: new Map() }),
    }),
    { name: 'compliance-store' },
  ),
);
