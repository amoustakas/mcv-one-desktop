// @mcv/payments-sdk/split-engine — multi-party payment split orchestrator.
//
// Executes a SplitPaymentRequest against two caller-injected dependencies:
//   1. A Supabase-like client for the `split_payments` + `split_payment_items`
//      audit tables. Typed loosely via SupabaseClient | null so offline
//      callers degrade to a best-effort in-memory split with no persistence.
//   2. A minimal LedgerAdapter (3 methods) so the engine can post a
//      double-entry journal entry per split item without depending on any
//      particular chart-of-accounts implementation.
//
// This follows the same DI pattern as @mcv/compliance-sdk's
// createComplianceEngine / createTaxEngine / etc. — zero module-level
// singletons, caller controls the runtime.

import type { SupabaseClient } from '@supabase/supabase-js';
import {
  type SplitPaymentRequest,
  type SplitPaymentResult,
  type VenturePaymentConfig,
  SplitPaymentRequestSchema,
} from './types';

// ─── Ledger adapter ─────────────────────────────────────────────────────
//
// The minimum surface the engine needs from the caller's ledger. Using a
// structural interface (rather than importing from `ledger/service`) keeps
// the SDK free of an app-specific ledger coupling — any ledger
// implementation that can fulfill these three methods works.

// Shared ledger contract — see @mcv/ledger-sdk/adapter.
import type { LedgerAdapter } from '@mcv/ledger-sdk';
export type {
  LedgerAccountRef,
  LedgerJournalEntryRef,
  LedgerJournalEntryInput,
  LedgerAdapter,
} from '@mcv/ledger-sdk';

// ─── Constants ──────────────────────────────────────────────────────────

// Default CR-side clearing account. Ventures can override per split via
// `metadata.sourceAccountCode`.
const DEFAULT_SOURCE_ACCOUNT_CODE = '1010'; // Cash / Clearing (asset)

// ─── Engine interface ──────────────────────────────────────────────────

export interface SplitEngine {
  executeSplit(request: SplitPaymentRequest): Promise<SplitPaymentResult>;
}

export interface SplitEngineOptions {
  supabase: SupabaseClient | null;
  ledger: LedgerAdapter;
}

// ─── Pure helper: platform fee calculation ──────────────────────────────
//
// Exported so callers can precompute the platform fee before building the
// SplitPaymentRequest (e.g. to add it as a dedicated split item).

export function calculatePlatformFee(
  amount: number,
  config: Pick<VenturePaymentConfig, 'platformFee'>,
): number {
  const { platformFee } = config;

  switch (platformFee.type) {
    case 'flat':
      return platformFee.value;

    case 'percentage':
      return Math.round(amount * (platformFee.value / 100) * 10_000) / 10_000;

    case 'tiered': {
      if (!platformFee.tiers || platformFee.tiers.length === 0) {
        return Math.round(amount * (platformFee.value / 100) * 10_000) / 10_000;
      }
      const tier = platformFee.tiers.find(
        (t) => amount >= t.minAmount && amount <= t.maxAmount,
      );
      if (!tier) {
        const lastTier = platformFee.tiers[platformFee.tiers.length - 1];
        return Math.round(amount * (lastTier.feePercent / 100) * 10_000) / 10_000;
      }
      return Math.round(amount * (tier.feePercent / 100) * 10_000) / 10_000;
    }

    default:
      return 0;
  }
}

// ─── Factory ────────────────────────────────────────────────────────────

export function createSplitEngine({ supabase, ledger }: SplitEngineOptions): SplitEngine {
  return {
    async executeSplit(request) {
      // ── 1. Validate ──
      const validated = SplitPaymentRequestSchema.parse(request);
      const { totalAmount, currency, ventureId, description, splits, metadata } = validated;

      // ── 2. Resolve percentage-based amounts ──
      const resolvedSplits = splits.map((split) => {
        if (split.percentage !== undefined && split.percentage > 0) {
          return {
            ...split,
            amount: Math.round(totalAmount * (split.percentage / 100) * 100) / 100,
          };
        }
        return split;
      });

      // ── 3. Verify sum ──
      const splitSum = resolvedSplits.reduce((acc, s) => acc + s.amount, 0);
      if (Math.abs(splitSum - totalAmount) > 0.01) {
        return {
          success: false,
          splitPaymentId: '',
          items: [],
          totalFees: 0,
          error: `Split amounts sum (${splitSum.toFixed(4)}) does not equal totalAmount (${totalAmount.toFixed(4)}). Difference: ${Math.abs(splitSum - totalAmount).toFixed(4)}`,
        };
      }

      const splitPaymentId = `sp_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
      const now = new Date().toISOString();

      // ── 4. Insert parent split_payments record ──
      if (supabase) {
        const { error: insertError } = await supabase
          .from('split_payments')
          .insert({
            id: splitPaymentId,
            venture_id: ventureId,
            total_amount: totalAmount,
            currency,
            description,
            status: 'processing',
            metadata,
            created_at: now,
            updated_at: now,
          });

        if (insertError) {
          return {
            success: false,
            splitPaymentId,
            items: [],
            totalFees: 0,
            error: `Failed to create split payment record: ${insertError.message}`,
          };
        }
      }

      // ── 5. Resolve source (clearing) account once ──
      const sourceAccountCode =
        (metadata['sourceAccountCode'] as string | undefined) ?? DEFAULT_SOURCE_ACCOUNT_CODE;
      const sourceAccount = supabase
        ? await ledger.getAccountByCode(ventureId, sourceAccountCode)
        : null;

      // ── 6. Process each split item ──
      const itemResults: SplitPaymentResult['items'] = [];
      let totalFees = 0; // reserved for future fee routing

      for (const split of resolvedSplits) {
        const itemId = `spi_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
        let journalEntryId: string | null = null;

        try {
          // a. Audit row
          if (supabase) {
            const { error: itemError } = await supabase
              .from('split_payment_items')
              .insert({
                id: itemId,
                split_payment_id: splitPaymentId,
                recipient_id: split.recipientId,
                recipient_type: split.recipientType,
                amount: split.amount,
                percentage: split.percentage ?? null,
                rail: split.rail ?? null,
                description: split.description,
                ledger_account: split.ledgerAccount,
                timing: split.timing,
                status: 'processing',
                created_at: now,
              });

            if (itemError) {
              throw new Error(`Failed to create split item: ${itemError.message}`);
            }
          }

          // b. Resolve recipient ledger account
          const recipientAccount = supabase
            ? await ledger.getAccountByCode(ventureId, split.ledgerAccount)
            : null;

          // c. Create + post the journal entry (DR recipient, CR source)
          if (supabase && recipientAccount && sourceAccount) {
            const entry = await ledger.createJournalEntry({
              ventureId,
              entryDate: now,
              description: `Split payment to ${split.recipientId}: ${split.description}`,
              sourceType: 'split_payment',
              sourceId: splitPaymentId,
              lines: [
                {
                  accountId: recipientAccount.id,
                  debitAmount: split.amount,
                  creditAmount: 0,
                  currency,
                  exchangeRate: 1,
                  dimensions: { ventureId, rail: split.rail ?? 'internal' },
                },
                {
                  accountId: sourceAccount.id,
                  debitAmount: 0,
                  creditAmount: split.amount,
                  currency,
                  exchangeRate: 1,
                  dimensions: { ventureId, rail: split.rail ?? 'internal' },
                },
              ],
            });

            journalEntryId = entry.id;

            await ledger.postJournalEntry(entry.id, 'split-engine');
          }

          // d. Update item to succeeded
          if (supabase) {
            await supabase
              .from('split_payment_items')
              .update({
                status: 'succeeded',
                journal_entry_id: journalEntryId,
                updated_at: now,
              })
              .eq('id', itemId);
          }

          itemResults.push({
            recipientId: split.recipientId,
            amount: split.amount,
            status: 'succeeded',
            rail: split.rail ?? 'internal',
            journalEntryId,
          });
        } catch (err) {
          const errorMsg = err instanceof Error ? err.message : String(err);

          if (supabase) {
            // Best-effort mark-failed; secondary errors are not re-thrown.
            await supabase
              .from('split_payment_items')
              .update({ status: 'failed', error: errorMsg, updated_at: now })
              .eq('id', itemId);
          }

          itemResults.push({
            recipientId: split.recipientId,
            amount: split.amount,
            status: 'failed',
            rail: split.rail ?? 'internal',
            journalEntryId: null,
          });
        }
      }

      // ── 7. Update parent status ──
      const anyFailed = itemResults.some((r) => r.status === 'failed');
      const finalStatus = anyFailed ? 'partially_completed' : 'completed';

      if (supabase) {
        await supabase
          .from('split_payments')
          .update({ status: finalStatus, updated_at: new Date().toISOString() })
          .eq('id', splitPaymentId);
      }

      return {
        success: !anyFailed,
        splitPaymentId,
        items: itemResults,
        totalFees,
        ...(anyFailed ? { error: 'One or more split items failed — see items for details' } : {}),
      };
    },
  };
}
