// Capital × Plaid — LegacyAdapter scaffold.
// Epic 13 Story 1. Per docs/capital/INTEROP.md §PlaidAdapter: investors
// link bank accounts via Plaid; we reconcile incoming wire/ACH transfers
// against a stored account_id, calling recordPayment on matched commits.
//
// MVP scaffold scope (full Plaid API integration pends sandbox creds):
//   - Contract: LegacyAdapter<PlaidTransferSettled, CapitalPaymentEvent>
//   - Pure mapper fromForeign(event) → { commitmentRef, amount, method, reference }
//   - No outbound path (Plaid is inbound-only in this adapter)
//   - Matching strategy documented: (contact.plaid_account_id, transfer_amount, transfer_date)
//     → single open commitment tuple; multi-match → flag for manual review

import type { SupabaseClient } from '@supabase/supabase-js';
import type { LegacyAdapter, CapitalPaymentEvent } from './types';

// Re-export for back-compat with existing imports of these names from
// plaid-adapter. New adapters should import from './types' directly.
export type { LegacyAdapter, CapitalPaymentEvent };

/** Shape of a Plaid Transfer event we care about (settled ACH / wire inbound). */
export interface PlaidTransferSettled {
  transfer_id: string;
  account_id: string;           // Plaid account id linked to investor
  amount: string;               // decimal string, USD
  iso_currency_code: 'USD';
  type: 'debit' | 'credit';
  status: 'settled';
  description?: string;
  metadata?: Record<string, string>;
  posted_at: string;            // ISO
  authorization_id?: string;
}

export interface PlaidAdapterOptions {
  supabase: SupabaseClient | null;
  /** Tolerance on amount match in cents (default 0 — exact match). Plaid may
   *  round; some institutions charge a wire fee deducted upstream. */
  amountToleranceCents?: number;
  /** Hours window around posted_at to match commitments (default 72h). */
  dateWindowHours?: number;
}

export function createPlaidAdapter(
  opts: PlaidAdapterOptions,
): LegacyAdapter<PlaidTransferSettled, CapitalPaymentEvent> {
  const toleranceCents = opts.amountToleranceCents ?? 0;
  const windowMs = (opts.dateWindowHours ?? 72) * 60 * 60 * 1000;

  return {
    id: 'plaid',

    async fromForeign(event) {
      // Guard: we only act on settled credits (money arriving).
      if (event.status !== 'settled' || event.type !== 'credit') return null;
      if (event.iso_currency_code !== 'USD') return null;

      const amountUsd = Number(event.amount);
      // Wire descriptors map to the USD-specific enum value ('wire_usd')
      // required by the capital_commitments.payment_method CHECK constraint.
      const paymentMethod: 'wire_usd' | 'ach' =
        (event.description ?? '').toLowerCase().includes('wire') ? 'wire_usd' : 'ach';

      let commitmentId: string | null = null;
      let contactId: string | null = null;
      let candidates = 0;
      let unambiguous = false;

      // Match strategy: find contact by plaid_account_id, then find an open
      // commitment from that contact within amount tolerance + date window.
      if (opts.supabase) {
        const { data: contactRow } = await opts.supabase
          .from('crm_contacts')
          .select('id')
          // metadata.plaid_account_id — we store it during Plaid Link success
          .contains('metadata', { plaid_account_id: event.account_id })
          .maybeSingle();

        if (contactRow) {
          contactId = contactRow.id as string;
          const postedAt = new Date(event.posted_at).getTime();
          const windowStart = new Date(postedAt - windowMs).toISOString();
          const windowEnd = new Date(postedAt + windowMs).toISOString();
          const lowCents = Math.round(amountUsd * 100) - toleranceCents;
          const highCents = Math.round(amountUsd * 100) + toleranceCents;

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
        paymentReference: event.transfer_id,
        postedAt: event.posted_at,
        rawEvent: event,
        matchDiagnostics: {
          strategy: 'plaid-account+amount+date',
          candidates,
          unambiguous,
        },
      };
    },

    // toForeign intentionally omitted — Plaid is inbound-only in this adapter.
    // Outbound funding uses Stripe/Solana via the PaymentRouter's processPayment.
  };
}
