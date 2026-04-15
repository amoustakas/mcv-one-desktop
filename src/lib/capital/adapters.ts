// @mcv/capital-sdk → host-app adapters.
//
// Bridges the capital-sdk's narrow LedgerAdapterLike / PaymentRouterLike
// contracts to the app's real @mcv/ledger-sdk service + @mcv/payments-sdk
// PaymentRouter instance. Imported by api/_handlers/capital.ts to give
// createCapitalEngine full ledger + payment routing capability.
//
// Contract mismatches handled here (keeps the SDK contracts tight while
// adapting to the richer host APIs):
//   - Ledger: translates {date, memo, debit, credit} → {entryDate,
//     description, debitAmount, creditAmount, sourceType, sourceId}.
//   - Payments: maps {ventureId, recipientContactId, reference} →
//     PaymentRequest {ventureId, customerId, customerCountry, ...}.

import type { SupabaseClient } from '@supabase/supabase-js';
import { createLedgerService } from '@mcv/ledger-sdk/service';
import type {
  LedgerAdapterLike,
  PaymentRouterLike,
} from '@mcv/capital-sdk/distributions-service';
import type { PaymentRouter, PaymentMethod } from '@mcv/payments-sdk';
import { resolveProcessor } from '../payments/processor-config';

export function makeCapitalLedgerAdapter(supabase: SupabaseClient): LedgerAdapterLike {
  const svc = createLedgerService({ supabase });
  return {
    async getAccountByCode(ventureId, code) {
      const acct = await svc.getAccountByCode(ventureId, code);
      return acct ? { id: acct.id, code: acct.code } : null;
    },
    async createJournalEntry(input) {
      const sourceType = (input.metadata?.sourceType as string) ?? 'capital_distribution';
      const sourceId = (input.metadata?.sourceId as string) ?? (input.metadata?.distribution_id as string) ?? '';
      const entry = await svc.createJournalEntry({
        ventureId: input.ventureId,
        entryDate: input.date,
        description: input.memo,
        sourceType,
        sourceId,
        lines: input.lines.map((l) => ({
          accountId: l.accountId,
          debitAmount: l.debit ?? 0,
          creditAmount: l.credit ?? 0,
        })),
      });
      return { id: entry.id };
    },
    postJournalEntry: (entryId, postedBy) => svc.postJournalEntry(entryId, postedBy),
  };
}

export function makeCapitalPaymentRouterAdapter(router: PaymentRouter): PaymentRouterLike {
  return {
    async processPayment(request) {
      // Per-venture processor override: if payment_processor_config has a row
      // for this (venture, method), surface the preferred processor_id +
      // processor-specific metadata (e.g. Stripe Connect account_id) into
      // the PaymentRequest metadata. Router scoring + processor implementations
      // can consume `preferred_processor` as a routing hint.
      let configMetadata: Record<string, unknown> = {};
      let preferredProcessor: string | null = null;
      if (request.ventureId && request.method) {
        const resolved = await resolveProcessor(request.ventureId, request.method);
        if (resolved) {
          preferredProcessor = resolved.processorId;
          configMetadata = resolved.metadata;
        }
      }

      const res = await router.processPayment({
        amount: request.amount,
        currency: request.currency,
        method: (request.method as PaymentMethod) || null,
        customerId: request.recipientContactId ?? 'capital-system',
        customerCountry: 'US',
        ventureId: request.ventureId ?? 'capital',
        description: request.reference ?? `capital distribution`,
        metadata: {
          ...configMetadata,
          ...(request.metadata ?? {}),
          ...(preferredProcessor ? { preferred_processor: preferredProcessor } : {}),
        },
      });
      return { result: res.result, decision: res.decision };
    },
  };
}
