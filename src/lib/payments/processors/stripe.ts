// src/lib/payments/processors/stripe.ts
//
// Stripe processor adapter — wraps the existing /api/stripe serverless endpoint.
// Does NOT call Stripe directly from the client. All Stripe REST calls are
// proxied through /api/stripe to keep secret keys server-side.

import type {
  PaymentProcessor,
  PaymentRequest,
  PaymentResult,
  RefundResult,
  FeeEstimate,
  ProcessorHealth,
  ProcessorCapability,
  PaymentMethod,
  PaymentStatus,
} from '../types';

// ── FEE CONSTANTS ───────────────────────────────────────────────────────────

const STRIPE_CARD_PERCENT  = 0.029;  // 2.9%
const STRIPE_CARD_FIXED    = 0.30;   // $0.30
const STRIPE_ACH_PERCENT   = 0.008;  // 0.8%
const STRIPE_ACH_CAP       = 5.00;   // $5.00 cap
const STRIPE_SEPA_PERCENT  = 0.008;  // 0.8%
const STRIPE_SEPA_CAP      = 5.00;   // €5.00 cap

// ── HEALTH CACHE ────────────────────────────────────────────────────────────

let _healthCache: ProcessorHealth | null = null;
let _healthCachedAt = 0;
const HEALTH_TTL_MS = 60_000; // 1 minute

// ── HELPERS ─────────────────────────────────────────────────────────────────

async function postStripeApi(action: string, body: Record<string, unknown>): Promise<unknown> {
  const res = await fetch('/api/stripe', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action, ...body }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? `Stripe API error ${res.status}`);
  return data;
}

async function getStripeApi(action: string, params: Record<string, string> = {}): Promise<unknown> {
  const qs = new URLSearchParams({ action, ...params }).toString();
  const res = await fetch(`/api/stripe?${qs}`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? `Stripe API error ${res.status}`);
  return data;
}

// ── PROCESSOR ───────────────────────────────────────────────────────────────

export const stripeProcessor: PaymentProcessor = {
  id: 'stripe',
  name: 'Stripe',

  capabilities: [
    'one_time', 'recurring', 'invoicing', 'payout', 'refund', 'dispute', 'connect',
  ] as ProcessorCapability[],

  supportedCurrencies: ['USD', 'CAD', 'EUR', 'GBP', 'AUD', 'JPY', 'CHF', 'SEK', 'NOK', 'DKK', 'NZD', 'SGD', 'HKD', 'MXN'],

  supportedCountries: [
    'US', 'CA', 'GB', 'AU', 'NZ', 'IE', 'AT', 'BE', 'BG', 'HR', 'CY', 'CZ',
    'DK', 'EE', 'FI', 'FR', 'DE', 'GR', 'HU', 'IT', 'LV', 'LT', 'LU', 'MT',
    'NL', 'PL', 'PT', 'RO', 'SK', 'SI', 'ES', 'SE', 'CH', 'NO', 'SG', 'HK',
    'JP', 'MX', 'BR', 'IN', 'TH', 'MY', 'PH', 'ID',
  ],

  supportedMethods: ['card', 'ach', 'sepa', 'apple_pay', 'google_pay'] as PaymentMethod[],

  // ── createPayment ──────────────────────────────────────────────────────────
  async createPayment(req: PaymentRequest): Promise<PaymentResult> {
    const fee = await this.estimateFee(req);

    try {
      // Stripe amounts are in smallest currency unit (cents for USD)
      const amountInCents = Math.round(req.amount * 100);

      const raw = await postStripeApi('create-payment', {
        amount: amountInCents,
        currency: req.currency.toLowerCase(),
        customer: req.customerId ?? undefined,
        description: req.description || `Payment for ${req.ventureId}`,
        metadata: { ventureId: req.ventureId, ...req.metadata },
      }) as Record<string, unknown>;

      return {
        success: true,
        paymentId: `pay_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        processorId: 'stripe',
        processorPaymentId: raw.id as string ?? null,
        status: mapStripeStatus((raw.status as string) ?? 'requires_payment_method'),
        amount: req.amount,
        currency: req.currency,
        fee,
      };
    } catch (err) {
      const error = err instanceof Error ? err.message : 'Stripe payment failed';
      return {
        success: false,
        paymentId: '',
        processorId: 'stripe',
        processorPaymentId: null,
        status: 'failed',
        amount: req.amount,
        currency: req.currency,
        fee,
        error,
      };
    }
  },

  // ── refundPayment ──────────────────────────────────────────────────────────
  async refundPayment(paymentId: string, amount?: number): Promise<RefundResult> {
    try {
      const body: Record<string, unknown> = { charge: paymentId };
      if (amount !== undefined) body.amount = Math.round(amount * 100);

      const raw = await postStripeApi('create-refund', body) as Record<string, unknown>;

      return {
        success: true,
        refundId: (raw.id as string) ?? `re_${Date.now()}`,
        amount: amount ?? ((raw.amount as number) ?? 0) / 100,
      };
    } catch (err) {
      const error = err instanceof Error ? err.message : 'Refund failed';
      return { success: false, refundId: '', amount: 0, error };
    }
  },

  // ── getStatus ─────────────────────────────────────────────────────────────
  async getStatus(paymentId: string): Promise<PaymentStatus> {
    try {
      const raw = await getStripeApi('get-payment', { id: paymentId }) as Record<string, unknown>;
      return mapStripeStatus((raw.status as string) ?? 'pending');
    } catch {
      return 'failed';
    }
  },

  // ── estimateFee ───────────────────────────────────────────────────────────
  // Computed locally — no API call needed.
  async estimateFee(req: PaymentRequest): Promise<FeeEstimate> {
    const method = req.method ?? 'card';
    const currency = req.currency.toUpperCase();

    switch (method) {
      case 'ach': {
        const pct = req.amount * STRIPE_ACH_PERCENT;
        const total = Math.min(pct, STRIPE_ACH_CAP);
        return { fixedFee: 0, percentageFee: STRIPE_ACH_PERCENT, totalFee: total, currency };
      }
      case 'sepa': {
        const pct = req.amount * STRIPE_SEPA_PERCENT;
        const total = Math.min(pct, STRIPE_SEPA_CAP);
        return { fixedFee: 0, percentageFee: STRIPE_SEPA_PERCENT, totalFee: total, currency };
      }
      // card, apple_pay, google_pay — same rate
      default: {
        const total = req.amount * STRIPE_CARD_PERCENT + STRIPE_CARD_FIXED;
        return { fixedFee: STRIPE_CARD_FIXED, percentageFee: STRIPE_CARD_PERCENT, totalFee: total, currency };
      }
    }
  },

  // ── getHealth ─────────────────────────────────────────────────────────────
  async getHealth(): Promise<ProcessorHealth> {
    const now = Date.now();

    // Return cached result if fresh
    if (_healthCache && now - _healthCachedAt < HEALTH_TTL_MS) {
      return _healthCache;
    }

    const start = Date.now();
    try {
      await getStripeApi('get-account');
      const latencyMs = Date.now() - start;

      _healthCache = {
        processorId: 'stripe',
        status: latencyMs < 3000 ? 'healthy' : 'degraded',
        latencyMs,
        successRate: 0.999,
        lastChecked: new Date().toISOString(),
      };
    } catch {
      _healthCache = {
        processorId: 'stripe',
        status: 'down',
        latencyMs: Date.now() - start,
        successRate: 0,
        lastChecked: new Date().toISOString(),
      };
    }

    _healthCachedAt = now;
    return _healthCache;
  },
};

// ── HELPERS ──────────────────────────────────────────────────────────────────

function mapStripeStatus(stripeStatus: string): PaymentStatus {
  switch (stripeStatus) {
    case 'succeeded':
      return 'succeeded';
    case 'processing':
      return 'processing';
    case 'requires_payment_method':
    case 'requires_confirmation':
    case 'requires_action':
    case 'requires_capture':
      return 'pending';
    case 'canceled':
      return 'canceled';
    default:
      return 'failed';
  }
}
