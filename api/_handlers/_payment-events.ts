// api/_payment-events.ts
//
// Shared helper for emitting to the unified payment_events audit table.
// Used by every payment processor endpoint (stripe, stripe-connect, plaid,
// solana-refund) so the timeline is consistent.
//
// Best-effort: any DB failure is swallowed. The audit log must never
// block a payment flow.

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_KEY || process.env.VITE_SUPABASE_ANON_KEY || '',
);

export type PaymentEventType =
  | 'charge.created' | 'charge.succeeded' | 'charge.failed' | 'charge.refunded'
  | 'refund.created' | 'refund.succeeded' | 'refund.failed'
  | 'payout.created' | 'payout.succeeded' | 'payout.failed'
  | 'transfer.created' | 'transfer.succeeded' | 'transfer.failed'
  | 'dispute.opened' | 'dispute.resolved'
  | 'subscription.renewed' | 'subscription.cancelled';

export type PaymentProcessorName = 'stripe' | 'plaid' | 'solana' | 'credits' | 'other';

export interface EmitPaymentEventArgs {
  event_type: PaymentEventType;
  processor: PaymentProcessorName;
  venture_id?: string | null;
  actor?: string | null;
  payment_id?: string | null;
  external_id?: string | null;
  external_signature?: string | null;
  amount_cents?: number | null;
  currency?: string;
  status?: string | null;
  error_message?: string | null;
  payload?: Record<string, unknown>;
}

/**
 * Emit one payment event. Never throws — failures degrade silently so a
 * payment flow is never blocked by an audit write.
 */
export async function emitPaymentEvent(args: EmitPaymentEventArgs): Promise<void> {
  try {
    await supabase.from('payment_events').insert({
      event_type: args.event_type,
      processor: args.processor,
      venture_id: args.venture_id ?? null,
      actor: args.actor ?? null,
      payment_id: args.payment_id ?? null,
      external_id: args.external_id ?? null,
      external_signature: args.external_signature ?? null,
      amount_cents: args.amount_cents ?? null,
      currency: args.currency ?? 'USD',
      status: args.status ?? null,
      error_message: args.error_message ?? null,
      payload: args.payload ?? {},
    });
  } catch {
    // best-effort
  }
}
