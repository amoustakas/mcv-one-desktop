// src/stores/finance.ts
// Zustand store for financial reporting — income statement, balance sheet,
// cash flow, real-time metrics, and cost intelligence.

import { create } from 'zustand';
import type {
  IncomeStatement,
  BalanceSheet,
  CashFlowStatement,
  RealTimeMetrics,
  CostIntelligence,
} from '../lib/finance/types';

// ─────────────────────────────────────────────────────────
// STATE INTERFACE
// ─────────────────────────────────────────────────────────

interface FinanceState {
  // ── Data ──────────────────────────────────────────────
  incomeStatement: IncomeStatement | null;
  balanceSheet: BalanceSheet | null;
  cashFlow: CashFlowStatement | null;
  metrics: RealTimeMetrics | null;
  costIntelligence: CostIntelligence | null;
  deferredRevenue: number | null;

  // ── Loading flags ─────────────────────────────────────
  loadingIncomeStatement: boolean;
  loadingBalanceSheet: boolean;
  loadingCashFlow: boolean;
  loadingMetrics: boolean;
  loadingCostIntelligence: boolean;
  loadingDeferredRevenue: boolean;

  // ── Errors ────────────────────────────────────────────
  error: string | null;

  // ── Actions ───────────────────────────────────────────
  fetchIncomeStatement: (ventureId: string, startDate: string, endDate: string, currency?: string) => Promise<void>;
  fetchBalanceSheet: (ventureId: string, asOfDate?: string, currency?: string) => Promise<void>;
  fetchCashFlow: (ventureId: string, startDate: string, endDate: string) => Promise<void>;
  fetchMetrics: (ventureId: string) => Promise<void>;
  fetchCostIntelligence: (ventureId: string, days?: number) => Promise<void>;
  fetchDeferredRevenue: (ventureId: string) => Promise<void>;
  triggerRecognition: (ventureId: string, asOfDate?: string) => Promise<{ processedCount: number }>;
  clearError: () => void;
  reset: () => void;
}

// ─────────────────────────────────────────────────────────
// API BASE
// ─────────────────────────────────────────────────────────

const API_BASE = '/api/finance';

async function apiFetch<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, options);
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error((body as { error?: string }).error ?? `Finance API ${res.status}`);
  }
  const json = await res.json();
  return json.data as T;
}

// ─────────────────────────────────────────────────────────
// STORE
// ─────────────────────────────────────────────────────────

export const useFinanceStore = create<FinanceState>((set) => ({
  incomeStatement: null,
  balanceSheet: null,
  cashFlow: null,
  metrics: null,
  costIntelligence: null,
  deferredRevenue: null,

  loadingIncomeStatement: false,
  loadingBalanceSheet: false,
  loadingCashFlow: false,
  loadingMetrics: false,
  loadingCostIntelligence: false,
  loadingDeferredRevenue: false,

  error: null,

  // ── Fetch income statement ─────────────────────────────
  fetchIncomeStatement: async (ventureId, startDate, endDate, currency = 'USD') => {
    set({ loadingIncomeStatement: true, error: null });
    try {
      const params = new URLSearchParams({ action: 'income-statement', ventureId, startDate, endDate, currency });
      const data = await apiFetch<IncomeStatement>(`${API_BASE}?${params}`);
      set({ incomeStatement: data });
    } catch (err) {
      set({ error: err instanceof Error ? err.message : 'Failed to load income statement' });
    } finally {
      set({ loadingIncomeStatement: false });
    }
  },

  // ── Fetch balance sheet ────────────────────────────────
  fetchBalanceSheet: async (ventureId, asOfDate, currency = 'USD') => {
    set({ loadingBalanceSheet: true, error: null });
    try {
      const params = new URLSearchParams({ action: 'balance-sheet', ventureId, currency });
      if (asOfDate) params.set('asOfDate', asOfDate);
      const data = await apiFetch<BalanceSheet>(`${API_BASE}?${params}`);
      set({ balanceSheet: data });
    } catch (err) {
      set({ error: err instanceof Error ? err.message : 'Failed to load balance sheet' });
    } finally {
      set({ loadingBalanceSheet: false });
    }
  },

  // ── Fetch cash flow ────────────────────────────────────
  fetchCashFlow: async (ventureId, startDate, endDate) => {
    set({ loadingCashFlow: true, error: null });
    try {
      const params = new URLSearchParams({ action: 'cash-flow', ventureId, startDate, endDate });
      const data = await apiFetch<CashFlowStatement>(`${API_BASE}?${params}`);
      set({ cashFlow: data });
    } catch (err) {
      set({ error: err instanceof Error ? err.message : 'Failed to load cash flow' });
    } finally {
      set({ loadingCashFlow: false });
    }
  },

  // ── Fetch real-time metrics ────────────────────────────
  fetchMetrics: async (ventureId) => {
    set({ loadingMetrics: true, error: null });
    try {
      const params = new URLSearchParams({ action: 'metrics', ventureId });
      const data = await apiFetch<RealTimeMetrics>(`${API_BASE}?${params}`);
      set({ metrics: data });
    } catch (err) {
      set({ error: err instanceof Error ? err.message : 'Failed to load metrics' });
    } finally {
      set({ loadingMetrics: false });
    }
  },

  // ── Fetch cost intelligence ────────────────────────────
  fetchCostIntelligence: async (ventureId, days = 30) => {
    set({ loadingCostIntelligence: true, error: null });
    try {
      const params = new URLSearchParams({ action: 'cost-intelligence', ventureId, days: String(days) });
      const data = await apiFetch<CostIntelligence>(`${API_BASE}?${params}`);
      set({ costIntelligence: data });
    } catch (err) {
      set({ error: err instanceof Error ? err.message : 'Failed to load cost intelligence' });
    } finally {
      set({ loadingCostIntelligence: false });
    }
  },

  // ── Fetch deferred revenue ─────────────────────────────
  fetchDeferredRevenue: async (ventureId) => {
    set({ loadingDeferredRevenue: true, error: null });
    try {
      const params = new URLSearchParams({ action: 'deferred-revenue', ventureId });
      const data = await apiFetch<{ deferredRevenue: number }>(`${API_BASE}?${params}`);
      set({ deferredRevenue: data.deferredRevenue });
    } catch (err) {
      set({ error: err instanceof Error ? err.message : 'Failed to load deferred revenue' });
    } finally {
      set({ loadingDeferredRevenue: false });
    }
  },

  // ── Trigger revenue recognition ────────────────────────
  triggerRecognition: async (ventureId, asOfDate) => {
    const body = {
      action: 'process-recognition',
      ventureId,
      asOfDate: asOfDate ?? new Date().toISOString().slice(0, 10),
    };
    const data = await apiFetch<{ processedCount: number }>(API_BASE, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    return data;
  },

  // ── Utilities ──────────────────────────────────────────
  clearError: () => set({ error: null }),

  reset: () => set({
    incomeStatement: null,
    balanceSheet: null,
    cashFlow: null,
    metrics: null,
    costIntelligence: null,
    deferredRevenue: null,
    error: null,
  }),
}));

// ─────────────────────────────────────────────────────────
// DERIVED SELECTORS
// ─────────────────────────────────────────────────────────

/** True when totalAssets ≈ totalLiabilities + equity */
export function selectIsBookBalanced(state: FinanceState): boolean {
  const bs = state.balanceSheet;
  if (!bs) return true;
  return bs.balanced;
}

/** Monthly burn rate from metrics */
export function selectMonthlyBurnRate(state: FinanceState): number {
  return state.metrics?.burnRate ?? 0;
}

/** Runway in months from metrics */
export function selectRunwayMonths(state: FinanceState): number {
  return state.metrics?.runway ?? 9999;
}
