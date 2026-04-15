// Capital × Stripe — LegacyAdapter scaffold (inbound reconciliation).
// Epic 13 Story 2. Companion to the Plaid adapter (Story 1).
//
// Context — why Stripe has BOTH an outbound processor AND an inbound
// adapter:
//   • Outbound: @mcv/payments-sdk owns the PaymentProcessor for card/ACH
//     payouts (distributions pay out via this path).
//   • Inbound: when an investor pays *into* a round via a Stripe Checkout
//     Session or PaymentIntent, the webhook arrives at
//     /api/stripe-webhook.  Today that path only audits to payment_events
//     and never flips the matching capital_commitment.
//
// This adapter closes the inbound half. Matching mirrors Plaid:
//   • crm_contacts.metadata.stripe_customer_id is stamped by the Stripe
//     link flow (StripeCustomerLinkButton.tsx → link-stripe-customer
//     Capital action) exactly the way plaid_account_id is stamped.
//   • We join crm_contacts → capital_commitments by contact + amount
//     tolerance + date window, picking a commitment only when the match
//     is unambiguous.
//
// Additional Stripe-specific guards:
//   • Commerce orders already have a direct payment_intent_id linkage at
//     order creation; when the PaymentIntent carries
//     metadata.commerce_order_id Commerce owns it and we skip.
//   • If the PaymentIntent itself carries metadata.capital_commitment_id
//     (set by Checkout Session creation on the Capital side), we fast-
//     path that to an exact match — no ambiguity possible.

import type { SupabaseClient } from '@supabase/supabase-js';
import type { LegacyAdapter, CapitalPaymentEvent } from './types';

/** The subset of Stripe.PaymentIntent fields we reconcile on. Typed
 *  loosely so the adapter can be driven from the webhook without pulling
 *  the full Stripe type in here. */
export interface StripePaymentIntentSucceeded {
  id: string;                      // pi_…
  object?: 'payment_intent';
  amount: number;                  // minor units (cents)
  amount_received?: number;
  currency: string;                // lowercase ISO
  status: string;                  // 'succeeded' | …
  customer?: string | null;        // cus_…
  payment_method_types?: string[]; // ['card'], ['us_bank_account'], …
  created: number;                 // unix seconds
  metadata?: Record<string, string> | null;
  latest_charge?: string | null;
  livemode?: boolean;
}

export interface StripeAdapterOptions {
  supabase: SupabaseClient | null;
  /** Tolerance on amount match in cents (default 0). Stripe does not skim
   *  fees from the customer-facing amount, so exact match is the default. */
  amountToleranceCents?: number;
  /** Hours window around created timestamp for commitment match (default
   *  72h — same as Plaid). */
  dateWindowHours?: number;
}

function paymentMethodFor(intent: StripePaymentIntentSucceeded): CapitalPaymentEvent['paymentMethod'] {
  const types = intent.payment_method_types ?? [];
  if (types.includes('us_bank_account') || types.includes('ach_debit') || types.includes('ach_credit_transfer')) {
    return 'ach';
  }
  // Cards (and any unknown Stripe rail) map to 'other' — the Capital DB
  // CHECK constraint on payment_method doesn't list 'card'. payment_reference
  // still carries pi_… so we retain full traceability.
  return 'other';
}

export function createStripeAdapter(
  opts: StripeAdapterOptions,
): LegacyAdapter<StripePaymentIntentSucceeded, CapitalPaymentEvent> {
  const toleranceCents = opts.amountToleranceCents ?? 0;
  const windowMs = (opts.dateWindowHours ?? 72) * 60 * 60 * 1000;

  return {
    id: 'stripe',

    async fromForeign(event) {
      // Guard: only act on succeeded PaymentIntents.
      if (event.status !== 'succeeded') return null;
      if ((event.currency ?? 'usd').toLowerCase() !== 'usd') return null;
      const amountCents = event.amount_received ?? event.amount;
      if (!amountCents || amountCents <= 0) return null;

      // Commerce owns its own order → commitment matching is meaningless.
      if (event.metadata?.commerce_order_id) return null;

      const amountUsd = amountCents / 100;
      const paymentMethod = paymentMethodFor(event);
      const postedAt = new Date(event.created * 1000).toISOString();

      // Fast path: metadata explicitly names the commitment. We still
      // report unambiguous=true so downstream logging stays consistent.
      const explicitCommitmentId = event.metadata?.capital_commitment_id;
      if (explicitCommitmentId) {
        return {
          commitmentId: explicitCommitmentId,
          contactId: null,
          amountUsd,
          paymentMethod,
          paymentReference: event.id,
          postedAt,
          rawEvent: event,
          matchDiagnostics: {
            strategy: 'stripe-metadata.capital_commitment_id',
            candidates: 1,
            unambiguous: true,
          },
        };
      }

      let commitmentId: string | null = null;
      let contactId: string | null = null;
      let candidates = 0;
      let unambiguous = false;

      if (opts.supabase && event.customer) {
        // Find the Capital contact linked to this Stripe customer via the
        // metadata stamp established by StripeCustomerLinkButton.
        const { data: contactRow } = await opts.supabase
          .from('crm_contacts')
          .select('id')
          .contains('metadata', { stripe_customer_id: event.customer })
          .maybeSingle();

        if (contactRow) {
          contactId = contactRow.id as string;
          const postedMs = event.created * 1000;
          const windowStart = new Date(postedMs - windowMs).toISOString();
          const windowEnd = new Date(postedMs + windowMs).toISOString();
          const lowCents = amountCents - toleranceCents;
          const highCents = amountCents + toleranceCents;

          const { data: commits } = await opts.supabase
            .from('capital_commitments')
            .select('id, amount_usd')
            .eq('contact_id', contactId)
            .in('status', ['signed', 'pending_wire'])
            .gte('created_at', windowStart)
            .lte('created_at', windowEnd);

          const inRange = (commits ?? []).filter((c) => {
            const cents = Math.round(Number(c.amount_usd) * 100);
            return cents >= lowCents && cents <= highCents;
          });
          candidates = inRange.length;
          unambiguous = candidates === 1;
          if (unambiguous) commitmentId = inRange[0].id as string;
        }
      }

      return {
        commitmentId,
        contactId,
        amountUsd,
        paymentMethod,
        paymentReference: event.id,
        postedAt,
        rawEvent: event,
        matchDiagnostics: {
          strategy: 'stripe-customer+amount+date',
          candidates,
          unambiguous,
        },
      };
    },

    // toForeign intentionally omitted — Stripe outbound (distributions,
    // payouts) routes through @mcv/payments-sdk's PaymentProcessor, not
    // this adapter. The adapter is observer-only, mirror of Plaid.
  };
}
