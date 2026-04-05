// src/stores/payments.ts
// Zustand store for Smart Payment Router
// Client-side routing via paymentRouter singleton; API for persistence + savings reporting.

import { create } from 'zustand';
import { paymentRouter } from '../lib/payments/router';
import type {
  RoutingDecision,
  PaymentResult,
  PaymentRequest,
  RoutingRequest,
  ProcessorHealth,
} from '../lib/payments/types';

// ── STATE ─────────────────────────────────────────────────────────────────────

interface PaymentsState {
  /** Health status per processor ID */
  processorHealth: Record<string, ProcessorHealth>;

  /** Last N routing decisions (most recent first, capped at 50) */
  recentDecisions: RoutingDecision[];

  /** Aggregated savings from smart routing over the last 30 days */
  totalSavings30d: number;

  /** Paginated payment intents from Supabase */
  payments: unknown[];

  /** Loading flag for async operations */
  paymentsLoading: boolean;

  // ── ACTIONS ──────────────────────────────────────────────────────────────

  /**
   * Estimate the cheapest rail for a payment (client-side, no persistence).
   * Returns the RoutingDecision and prepends it to recentDecisions.
   */
  estimateRoute: (request: RoutingRequest) => Promise<RoutingDecision>;

  /**
   * Route + execute the payment via the client-side router, then POST to the
   * API to persist the payment_intent record.
   */
  processPayment: (request: PaymentRequest) => Promise<{ result: PaymentResult; decision: RoutingDecision }>;

  /**
   * Fetch aggregated smart routing savings for the last 30 days from the API.
   */
  fetchSavings: (ventureId: string) => Promise<void>;

  /**
   * Fetch paginated payment intents for a venture from the API.
   */
  fetchPayments: (ventureId: string, limit?: number, offset?: number) => Promise<void>;

  /**
   * Refresh health status for all registered processors.
   */
  refreshHealth: () => Promise<void>;
}

// ── STORE ─────────────────────────────────────────────────────────────────────

const API_BASE = '/api/payments-router';

export const usePaymentsStore = create<PaymentsState>((set, get) => ({
  processorHealth: {},
  recentDecisions: [],
  totalSavings30d: 0,
  payments: [],
  paymentsLoading: false,

  // ── estimateRoute ───────────────────────────────────────────────────────────

  estimateRoute: async (request) => {
    const decision = await paymentRouter.estimateRoute(request);

    set((state) => ({
      recentDecisions: [decision, ...state.recentDecisions].slice(0, 50),
    }));

    return decision;
  },

  // ── processPayment ──────────────────────────────────────────────────────────

  processPayment: async (request) => {
    set({ paymentsLoading: true });
    try {
      const { result, decision } = await paymentRouter.processPayment(request);

      // Prepend decision to recent list
      set((state) => ({
        recentDecisions: [decision, ...state.recentDecisions].slice(0, 50),
      }));

      // Best-effort: persist the payment intent to the API
      try {
        await fetch(API_BASE, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'create-payment',
            ventureId: request.ventureId,
            paymentResult: result,
            routingDecision: decision,
          }),
        });
      } catch {
        // Persistence failure is non-fatal — payment already processed
        console.warn('[payments-store] Failed to persist payment intent to API');
      }

      return { result, decision };
    } finally {
      set({ paymentsLoading: false });
    }
  },

  // ── fetchSavings ────────────────────────────────────────────────────────────

  fetchSavings: async (ventureId) => {
    set({ paymentsLoading: true });
    try {
      const res = await fetch(
        `${API_BASE}?action=get-savings&ventureId=${encodeURIComponent(ventureId)}`,
      );
      if (!res.ok) {
        const { error } = await res.json().catch(() => ({}));
        throw new Error(error || `API error ${res.status}`);
      }
      const { data } = await res.json();
      set({ totalSavings30d: data?.totalSavings30d ?? 0 });
    } finally {
      set({ paymentsLoading: false });
    }
  },

  // ── fetchPayments ────────────────────────────────────────────────────────────

  fetchPayments: async (ventureId, limit = 20, offset = 0) => {
    set({ paymentsLoading: true });
    try {
      const params = new URLSearchParams({
        action: 'list-payments',
        ventureId,
        limit: String(limit),
        offset: String(offset),
      });
      const res = await fetch(`${API_BASE}?${params.toString()}`);
      if (!res.ok) {
        const { error } = await res.json().catch(() => ({}));
        throw new Error(error || `API error ${res.status}`);
      }
      const { data } = await res.json();
      set({ payments: data ?? [] });
    } finally {
      set({ paymentsLoading: false });
    }
  },

  // ── refreshHealth ───────────────────────────────────────────────────────────

  refreshHealth: async () => {
    const processors = paymentRouter.getProcessors();
    const results = await Promise.allSettled(
      processors.map((p) => p.getHealth().then((h) => ({ id: p.id, health: h }))),
    );

    const healthMap: Record<string, ProcessorHealth> = { ...get().processorHealth };

    for (const result of results) {
      if (result.status === 'fulfilled') {
        healthMap[result.value.id] = result.value.health;
      }
    }

    set({ processorHealth: healthMap });
  },
}));
