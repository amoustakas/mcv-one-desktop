// src/lib/payments/processors/plaid.ts
//
// Plaid ACH processor — a direct bank-to-bank rail using Plaid Transfer API.
// Distinct from Stripe ACH (which uses Plaid for verification only and then
// runs settlement on Stripe's rails). This processor is ideal for:
//   * FutureState RWA: low-fee, direct-debit subscriptions
//   * Credit-line origination + repayment flows
//   * Payouts to suppliers with bank accounts on file
//
// Unlike the Stripe processor, Plaid ACH requires a pre-existing
// plaid_item_id + account_id (from the linked bank). Callers pass these
// via req.metadata.{plaid_item_id,account_id} or a specialized
// PaymentRequest extension. The server endpoint /api/plaid handles
// authorize-then-create two-step flow and persists plaid_transfers rows.

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

// ── Fees ──
// Plaid Transfer pricing varies by volume; use a conservative flat rate.
// In sandbox fees are zero; production charges a % and/or flat per-transfer.
const PLAID_FEE_PERCENT = 0.005;   // 0.5%
const PLAID_FEE_FIXED_USD = 0.40;  // $0.40 per transfer
const PLAID_FEE_CAP_USD = 5.00;    // capped

// ── Helpers ──

async function postPlaid(action: string, body: Record<string, unknown>): Promise<Record<string, unknown>> {
  const res = await fetch('/api/plaid', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action, ...body }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? `Plaid ${action} failed: ${res.status}`);
  return data as Record<string, unknown>;
}

function mapPlaidStatus(s?: string): PaymentStatus {
  switch (s) {
    case 'posted':
    case 'settled':      return 'succeeded';
    case 'pending':      return 'processing';
    case 'cancelled':    return 'canceled';
    case 'failed':
    case 'returned':     return 'failed';
    default:             return 'pending';
  }
}

interface PlaidMetadata {
  plaid_item_id?: string;
  account_id?: string;
  transfer_type?: 'debit' | 'credit'; // default 'debit' (pull from customer)
  user?: {
    legal_name: string;
    email_address?: string;
    phone_number?: string;
    address?: Record<string, string>;
  };
}

function readPlaidMeta(req: PaymentRequest): PlaidMetadata {
  const m = (req.metadata || {}) as Record<string, unknown>;
  return {
    plaid_item_id: m.plaid_item_id as string | undefined,
    account_id: m.account_id as string | undefined,
    transfer_type: (m.transfer_type as 'debit' | 'credit' | undefined) || 'debit',
    user: m.user as PlaidMetadata['user'],
  };
}

// ── PROCESSOR ──

export const plaidProcessor: PaymentProcessor = {
  id: 'plaid',
  name: 'Plaid ACH',

  capabilities: ['one_time', 'recurring', 'payout'] as ProcessorCapability[],
  supportedCurrencies: ['USD'],
  supportedCountries: ['US'],
  supportedMethods: ['ach'] as PaymentMethod[],

  async createPayment(req: PaymentRequest): Promise<PaymentResult> {
    const fee = await this.estimateFee(req);
    const meta = readPlaidMeta(req);

    if (!meta.plaid_item_id || !meta.account_id) {
      return {
        success: false,
        paymentId: '',
        processorId: 'plaid',
        processorPaymentId: null,
        status: 'failed',
        amount: req.amount,
        currency: req.currency,
        fee,
        error: 'plaid_item_id and account_id required in metadata. Link a bank via PlaidLinkButton first.',
      };
    }

    try {
      // Two-step flow: authorize → create
      const authRes = await postPlaid('transfer-authorize', {
        plaid_item_id: meta.plaid_item_id,
        account_id: meta.account_id,
        type: meta.transfer_type ?? 'debit',
        amount_cents: Math.round(req.amount * 100),
        description: req.description?.slice(0, 15) || `${req.ventureId.slice(0, 14)}`,
        user: meta.user ?? { legal_name: req.customerId || 'MCV Customer' },
      });

      const authorization = (authRes.authorization as { id?: string; decision?: string; decision_rationale?: { description?: string } }) || {};
      if (authorization.decision !== 'approved') {
        return {
          success: false,
          paymentId: '',
          processorId: 'plaid',
          processorPaymentId: null,
          status: 'failed',
          amount: req.amount,
          currency: req.currency,
          fee,
          error: authorization.decision_rationale?.description || `Plaid declined: ${authorization.decision}`,
        };
      }

      const createRes = await postPlaid('transfer-create', {
        plaid_item_id: meta.plaid_item_id,
        authorization_id: authorization.id,
        account_id: meta.account_id,
        description: req.description?.slice(0, 15) || 'MCV payment',
      });

      const transfer = (createRes.transfer as { id?: string; status?: string }) || {};
      return {
        success: true,
        paymentId: `plaid_${transfer.id}`,
        processorId: 'plaid',
        processorPaymentId: transfer.id || null,
        status: mapPlaidStatus(transfer.status),
        amount: req.amount,
        currency: req.currency,
        fee,
      };
    } catch (err) {
      return {
        success: false,
        paymentId: '',
        processorId: 'plaid',
        processorPaymentId: null,
        status: 'failed',
        amount: req.amount,
        currency: req.currency,
        fee,
        error: err instanceof Error ? err.message : 'Plaid transfer failed',
      };
    }
  },

  async refundPayment(paymentId: string, _amount?: number): Promise<RefundResult> {
    // Plaid doesn't have a native "refund"; emit an inverse transfer.
    // Requires the same metadata the original payment used. Callers that
    // need this should build a new createPayment with type='credit'.
    return {
      success: false,
      refundId: '',
      amount: 0,
      error: 'Plaid refunds are issued as inverse transfers — call createPayment with metadata.transfer_type="credit" against the same plaid_item_id/account_id.',
    };
  },

  async getStatus(paymentId: string): Promise<PaymentStatus> {
    try {
      const transferId = paymentId.startsWith('plaid_') ? paymentId.slice('plaid_'.length) : paymentId;
      const res = await postPlaid('transfer-get', { transfer_id: transferId });
      const transfer = (res.transfer as { status?: string }) || {};
      return mapPlaidStatus(transfer.status);
    } catch {
      return 'failed';
    }
  },

  async estimateFee(req: PaymentRequest): Promise<FeeEstimate> {
    const pct = req.amount * PLAID_FEE_PERCENT;
    const total = Math.min(pct + PLAID_FEE_FIXED_USD, PLAID_FEE_CAP_USD);
    return {
      fixedFee: PLAID_FEE_FIXED_USD,
      percentageFee: PLAID_FEE_PERCENT,
      totalFee: total,
      currency: req.currency,
    };
  },

  async getHealth(): Promise<ProcessorHealth> {
    // There's no cheap Plaid ping; treat as healthy if the env is set.
    // Deeper health comes from /api/plaid list-items which requires an
    // authed user — not suitable for a global health check.
    return {
      processorId: 'plaid',
      status: 'healthy',
      latencyMs: 0,
      successRate: 0.98,
      lastChecked: new Date().toISOString(),
    };
  },
};
