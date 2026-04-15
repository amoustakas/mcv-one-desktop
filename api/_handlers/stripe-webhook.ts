// api/stripe-webhook.ts
//
// Stripe webhook receiver for the MCV payment audit loop.
//
// Closes the second leg of the 2-phase commit: api/stripe.ts + api/stripe-
// connect.ts emit *.created events synchronously when a charge/payout/refund
// is initiated; Stripe then pushes the async terminal state (*.succeeded /
// *.failed) to this endpoint and we emit the matching payment_events row so
// reconciliation against Stripe matches our ledger.
//
// Handles both platform and Connect events — Stripe delivers Connect events
// to the same endpoint with `event.account` set to the connected account id,
// which we reverse-look into `venture_stripe_accounts` to tag the venture.
//
// No Clerk auth. Signature verification via Stripe.webhooks.constructEvent.
// Raw body required → bodyParser disabled.

import type { VercelRequest, VercelResponse } from '@vercel/node';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';
import { emitPaymentEvent, type PaymentEventType } from './_payment-events.js';

export const config = { api: { bodyParser: false } };

const supabase = createClient(
  process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_KEY || process.env.VITE_SUPABASE_ANON_KEY || '',
);

function getStripe(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error('STRIPE_SECRET_KEY not configured');
  return new Stripe(key, { apiVersion: '2024-11-20.acacia' as Stripe.StripeConfig['apiVersion'] });
}

async function readRawBody(req: VercelRequest): Promise<Buffer> {
  return new Promise<Buffer>((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on('data', (c: Buffer) => chunks.push(c));
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}

async function ventureForConnectAccount(accountId: string | null): Promise<string | null> {
  if (!accountId) return null;
  const { data } = await supabase
    .from('venture_stripe_accounts')
    .select('venture_id')
    .eq('stripe_account_id', accountId)
    .maybeSingle();
  return data?.venture_id ?? null;
}

interface MappedEvent {
  event_type: PaymentEventType;
  external_id: string | null;
  amount_cents: number | null;
  currency: string;
  status: string | null;
  error_message: string | null;
  payload: Record<string, unknown>;
}

function mapStripeEvent(event: Stripe.Event): MappedEvent | null {
  // The event data is only weakly typed; pull fields with `any` access to
  // avoid a 12-branch discriminated union. Each case maps one Stripe event
  // type to one of our canonical PaymentEventType codes.
  const obj = event.data.object as Record<string, unknown> & {
    id?: string;
    amount?: number;
    amount_refunded?: number;
    amount_paid?: number;
    currency?: string;
    status?: string;
    customer?: string | null;
    subscription?: string | null;
    billing_reason?: string;
    latest_charge?: string | null;
    cancellation_details?: { reason?: string };
    canceled_at?: number | null;
    arrival_date?: number;
    method?: string;
    destination?: string | null;
    source_transaction?: string | null;
    refunded?: boolean;
    captured?: boolean;
    failure_reason?: string | null;
    failure_message?: string | null;
    failure_code?: string | null;
    failure_balance_transaction?: string | null;
    charge?: string | null;
    reason?: string | null;
    evidence_details?: unknown;
    last_payment_error?: { message?: string; code?: string };
  };

  const currency = (obj.currency ?? 'usd').toUpperCase();

  switch (event.type) {
    case 'payment_intent.succeeded':
      return {
        event_type: 'charge.succeeded',
        external_id: obj.id ?? null,
        amount_cents: obj.amount ?? null,
        currency,
        status: obj.status ?? null,
        error_message: null,
        payload: { latest_charge: obj.latest_charge, customer: obj.customer },
      };

    case 'payment_intent.payment_failed':
      return {
        event_type: 'charge.failed',
        external_id: obj.id ?? null,
        amount_cents: obj.amount ?? null,
        currency,
        status: obj.status ?? null,
        error_message: obj.last_payment_error?.message ?? null,
        payload: { code: obj.last_payment_error?.code, customer: obj.customer },
      };

    case 'charge.refunded':
      return {
        event_type: 'charge.refunded',
        external_id: obj.id ?? null,
        amount_cents: obj.amount_refunded ?? null,
        currency,
        status: obj.status ?? null,
        error_message: null,
        payload: { refunded: obj.refunded, captured: obj.captured },
      };

    case 'refund.updated': {
      const status = obj.status ?? null;
      const eventType: PaymentEventType =
        status === 'succeeded' ? 'refund.succeeded'
        : status === 'failed' ? 'refund.failed'
        : 'refund.created';
      return {
        event_type: eventType,
        external_id: obj.id ?? null,
        amount_cents: obj.amount ?? null,
        currency,
        status,
        error_message: obj.failure_reason ?? null,
        payload: { charge: obj.charge },
      };
    }

    case 'payout.paid':
      return {
        event_type: 'payout.succeeded',
        external_id: obj.id ?? null,
        amount_cents: obj.amount ?? null,
        currency,
        status: obj.status ?? 'paid',
        error_message: null,
        payload: { arrival_date: obj.arrival_date, method: obj.method },
      };

    case 'payout.failed':
      return {
        event_type: 'payout.failed',
        external_id: obj.id ?? null,
        amount_cents: obj.amount ?? null,
        currency,
        status: obj.status ?? 'failed',
        error_message: obj.failure_message ?? null,
        payload: {
          failure_code: obj.failure_code,
          failure_balance_transaction: obj.failure_balance_transaction,
        },
      };

    case 'transfer.paid':
      return {
        event_type: 'transfer.succeeded',
        external_id: obj.id ?? null,
        amount_cents: obj.amount ?? null,
        currency,
        status: 'paid',
        error_message: null,
        payload: { destination: obj.destination, source_transaction: obj.source_transaction },
      };

    case 'transfer.failed':
      return {
        event_type: 'transfer.failed',
        external_id: obj.id ?? null,
        amount_cents: obj.amount ?? null,
        currency,
        status: 'failed',
        error_message: null,
        payload: { destination: obj.destination },
      };

    case 'charge.dispute.created':
      return {
        event_type: 'dispute.opened',
        external_id: obj.id ?? null,
        amount_cents: obj.amount ?? null,
        currency,
        status: obj.status ?? null,
        error_message: obj.reason ?? null,
        payload: { charge: obj.charge, evidence_details: obj.evidence_details },
      };

    case 'charge.dispute.closed':
      return {
        event_type: 'dispute.resolved',
        external_id: obj.id ?? null,
        amount_cents: obj.amount ?? null,
        currency,
        status: obj.status ?? null,
        error_message: null,
        payload: { charge: obj.charge, outcome: obj.status },
      };

    case 'invoice.payment_succeeded':
      // Only treat subscription-cycle invoices as renewals. First payments
      // ship as `subscription_create` billing_reason and are covered by the
      // initial charge.created / charge.succeeded pair.
      if (obj.billing_reason === 'subscription_cycle') {
        return {
          event_type: 'subscription.renewed',
          external_id: obj.subscription ?? obj.id ?? null,
          amount_cents: obj.amount_paid ?? null,
          currency,
          status: obj.status ?? null,
          error_message: null,
          payload: { invoice_id: obj.id, customer: obj.customer, subscription: obj.subscription },
        };
      }
      return null;

    case 'customer.subscription.deleted':
      return {
        event_type: 'subscription.cancelled',
        external_id: obj.id ?? null,
        amount_cents: null,
        currency,
        status: obj.status ?? null,
        error_message: obj.cancellation_details?.reason ?? null,
        payload: { customer: obj.customer, canceled_at: obj.canceled_at },
      };

    default:
      return null;
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).send('POST only');

  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) return res.status(500).send('STRIPE_WEBHOOK_SECRET not configured');

  const sig = req.headers['stripe-signature'];
  if (!sig || typeof sig !== 'string') return res.status(400).send('Missing stripe-signature');

  let raw: Buffer;
  try {
    raw = await readRawBody(req);
  } catch {
    return res.status(400).send('Failed to read body');
  }

  let event: Stripe.Event;
  try {
    event = getStripe().webhooks.constructEvent(raw, sig, secret);
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'unknown';
    return res.status(400).send(`Invalid signature: ${msg}`);
  }

  // Stripe.Event.account is only present on Connect events. Platform events
  // leave it undefined.
  const connectAccount = (event as Stripe.Event & { account?: string | null }).account ?? null;
  const venture_id = await ventureForConnectAccount(connectAccount);

  const mapped = mapStripeEvent(event);

  if (mapped) {
    await emitPaymentEvent({
      event_type: mapped.event_type,
      processor: 'stripe',
      venture_id,
      actor: null,
      external_id: mapped.external_id,
      external_signature: sig.slice(0, 120),
      amount_cents: mapped.amount_cents,
      currency: mapped.currency,
      status: mapped.status,
      error_message: mapped.error_message,
      payload: {
        stripe_event_id: event.id,
        stripe_event_type: event.type,
        connect_account: connectAccount,
        livemode: event.livemode,
        ...mapped.payload,
      },
    });
  }

  // ── Capital reconciliation hook (Epic 13 S2) ──
  // On payment_intent.succeeded, try to auto-match an open Capital
  // commitment via the StripeAdapter. Commerce-owned intents carry
  // metadata.commerce_order_id and are skipped inside the adapter.
  // Failures are logged; webhook still ACKs 200 so Stripe doesn't retry.
  if (event.type === 'payment_intent.succeeded') {
    try {
      await reconcileStripeToCapital(event);
    } catch (err) {
      console.warn('[stripe-webhook] capital reconciliation failed:', err instanceof Error ? err.message : err);
    }
  }

  // Always 200 so Stripe stops retrying. Unhandled event types are recorded
  // only in the response body for inspection.
  return res.status(200).json({ received: true, handled: !!mapped, type: event.type });
}

// ── Capital reconciliation ──────────────────────────────────────────────
// Composes the StripeAdapter (Epic 13 S2) with the shared reconcile
// helper. Mirrors api/plaid-webhook.ts: adapter maps → recordPayment +
// notification fan-out. Best-effort; never blocks the webhook ACK.

async function reconcileStripeToCapital(event: Stripe.Event): Promise<void> {
  const pi = event.data.object as Stripe.PaymentIntent;
  if (!pi?.id || pi.object !== 'payment_intent') return;

  const { createStripeAdapter } = await import('../../src/lib/capital/adapters/stripe-adapter');
  const { reconcileCapitalPayment } = await import('../../src/lib/capital/reconcile');

  const adapter = createStripeAdapter({ supabase });
  const mapped = await adapter.fromForeign({
    id: pi.id,
    object: 'payment_intent',
    amount: pi.amount,
    amount_received: pi.amount_received,
    currency: pi.currency,
    status: pi.status,
    customer: typeof pi.customer === 'string' ? pi.customer : (pi.customer?.id ?? null),
    payment_method_types: pi.payment_method_types,
    created: pi.created,
    metadata: pi.metadata ?? null,
    latest_charge: typeof pi.latest_charge === 'string' ? pi.latest_charge : (pi.latest_charge?.id ?? null),
    livemode: pi.livemode,
  });

  await reconcileCapitalPayment(mapped, {
    supabase,
    source: 'stripe',
    refLabel: 'Stripe payment',
  });
}
