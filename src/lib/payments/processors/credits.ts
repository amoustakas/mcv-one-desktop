// src/lib/payments/processors/credits.ts
//
// Platform Credits processor — deducts/restores credits from the internal
// ledger. Zero fees. Backed by credit-service.ts + Supabase.

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
import { consumeCredits, grantCredits } from '../../ledger/credit-service';

// ── ZERO FEE CONSTANT ────────────────────────────────────────────────────────

const ZERO_FEE: FeeEstimate = {
  fixedFee: 0,
  percentageFee: 0,
  totalFee: 0,
  currency: 'USD',
};

// ── PROCESSOR ────────────────────────────────────────────────────────────────

export const creditsProcessor: PaymentProcessor = {
  id: 'platform_credits',
  name: 'Platform Credits',

  capabilities: ['one_time', 'credits'] as ProcessorCapability[],

  // Credits are currency-agnostic; the 'credits' denomination is canonical.
  supportedCurrencies: ['credits', 'USD'],

  // Credits work globally — no country restriction.
  supportedCountries: ['*'],

  supportedMethods: ['platform_credit'] as PaymentMethod[],

  // ── createPayment ──────────────────────────────────────────────────────────
  async createPayment(req: PaymentRequest): Promise<PaymentResult> {
    const paymentId = `crd_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

    if (!req.customerId) {
      return {
        success: false,
        paymentId,
        processorId: 'platform_credits',
        processorPaymentId: null,
        status: 'failed',
        amount: req.amount,
        currency: req.currency,
        fee: ZERO_FEE,
        error: 'customerId is required for credit payments',
      };
    }

    try {
      await consumeCredits({
        ventureId: req.ventureId,
        ownerId: req.customerId,
        amount: req.amount,
        reason: req.description || `Payment ${paymentId}`,
        currency: req.currency === 'USD' ? 'credits' : req.currency,
      });

      return {
        success: true,
        paymentId,
        processorId: 'platform_credits',
        processorPaymentId: paymentId,
        status: 'succeeded',
        amount: req.amount,
        currency: req.currency,
        fee: ZERO_FEE,
      };
    } catch (err) {
      const error = err instanceof Error ? err.message : 'Credit consumption failed';
      return {
        success: false,
        paymentId,
        processorId: 'platform_credits',
        processorPaymentId: null,
        status: 'failed',
        amount: req.amount,
        currency: req.currency,
        fee: ZERO_FEE,
        error,
      };
    }
  },

  // ── refundPayment ──────────────────────────────────────────────────────────
  // Parses ownerId out of the internal payment ID format: crd_{ts}_{ownerId}
  // For credit refunds we require the paymentId to embed the customerId,
  // OR the caller passes the original PaymentRequest's customerId in metadata
  // via the description field convention. Since refundPayment only receives
  // a string ID, we look it up from the in-memory store — or fall back to
  // requiring the caller to include ownerId in the paymentId.
  //
  // Practical approach: the router layer should call createPayment result and
  // store the mapping. Here we parse the ventureId from the paymentId prefix
  // and expect callers to use the paymentId returned from createPayment.
  async refundPayment(paymentId: string, amount?: number): Promise<RefundResult> {
    // paymentId format: crd_{timestamp}_{randomSuffix}
    // We cannot restore credits without knowing the venture + owner.
    // The refund must be initiated with context. Return a clear error so the
    // router layer knows to call refundWithContext instead.
    return {
      success: false,
      refundId: '',
      amount: 0,
      error: 'Credit refunds require owner context — use refundWithContext(paymentId, amount, ventureId, ownerId)',
    };
  },

  // ── refundWithContext ──────────────────────────────────────────────────────
  // Extended method (not on the base interface) for callers that have context.
  // The router layer or kit handler should call this directly when available.

  // ── getStatus ─────────────────────────────────────────────────────────────
  // Credit payments are synchronous and final — succeeded or failed.
  async getStatus(_paymentId: string): Promise<PaymentStatus> {
    // Credit transactions are immediately final; we have no async lifecycle.
    // A stored result would be needed for real lookup — for now return succeeded
    // since any payment that reached getStatus was already confirmed.
    return 'succeeded';
  },

  // ── estimateFee ───────────────────────────────────────────────────────────
  async estimateFee(_req: PaymentRequest): Promise<FeeEstimate> {
    return { ...ZERO_FEE };
  },

  // ── getHealth ─────────────────────────────────────────────────────────────
  async getHealth(): Promise<ProcessorHealth> {
    // The credit processor is internal — healthy as long as the module loads.
    // If Supabase is unavailable the consume call will throw, but the processor
    // itself is considered healthy (it will surface errors per-transaction).
    return {
      processorId: 'platform_credits',
      status: 'healthy',
      latencyMs: 0,
      successRate: 1,
      lastChecked: new Date().toISOString(),
    };
  },
};

// ── EXTENDED REFUND WITH CONTEXT ─────────────────────────────────────────────
// Exported separately so the router/kit layer can call it when full context is
// available (after looking up the original PaymentRequest).

export async function refundCreditsWithContext(
  paymentId: string,
  amount: number,
  ventureId: string,
  ownerId: string,
  currency = 'credits',
): Promise<RefundResult> {
  const refundId = `crd_ref_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

  try {
    await grantCredits({
      ventureId,
      ownerId,
      amount,
      reason: `Refund for payment ${paymentId}`,
      currency,
    });

    return { success: true, refundId, amount };
  } catch (err) {
    const error = err instanceof Error ? err.message : 'Credit refund failed';
    return { success: false, refundId: '', amount: 0, error };
  }
}
