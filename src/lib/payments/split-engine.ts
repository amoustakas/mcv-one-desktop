// src/lib/payments/split-engine.ts
//
// SplitPaymentEngine — executes multi-party payment splits with double-entry
// ledger integration. Each split item creates a journal entry (DR recipient
// ledger account, CR source account) and posts it immediately.

import type { SplitPaymentRequest, SplitPaymentResult, VenturePaymentConfig } from './types';
import { SplitPaymentRequestSchema } from './types';
import { supabase } from '../supabase';
import {
  createJournalEntry,
  postJournalEntry,
  getAccountByCode,
} from '../ledger/service';

// ── SOURCE ACCOUNT CODE ──────────────────────────────────────────────────────
// Default clearing account used as the credit side of every split entry.
// Ventures can override via metadata.
const DEFAULT_SOURCE_ACCOUNT_CODE = '1010'; // Cash / Clearing (asset)

// ── SPLIT PAYMENT ENGINE ─────────────────────────────────────────────────────

export class SplitPaymentEngine {
  /**
   * Execute a split payment.
   *
   * Steps:
   *   1. Validate the request via Zod schema.
   *   2. Resolve any percentage-based split amounts.
   *   3. Verify the splits sum to totalAmount (±0.01 tolerance).
   *   4. Insert the parent `split_payments` record in Supabase.
   *   5. For each split item:
   *      a. Insert a `split_payment_items` row.
   *      b. Resolve the recipient's ledger account by code.
   *      c. Create a journal entry (DR recipient, CR source).
   *      d. Post the journal entry.
   *   6. Update the split payment status to 'completed'.
   *   7. Return SplitPaymentResult.
   *
   * All Supabase calls are guarded with `if (!supabase)` so the engine degrades
   * gracefully in environments without a configured Supabase client.
   */
  async executeSplit(request: SplitPaymentRequest): Promise<SplitPaymentResult> {
    // ── 1. Validate ──────────────────────────────────────────────────────────
    const validated = SplitPaymentRequestSchema.parse(request);
    const { totalAmount, currency, ventureId, description, splits, metadata } = validated;

    // ── 2. Resolve percentage-based amounts ──────────────────────────────────
    const resolvedSplits = splits.map(split => {
      if (split.percentage !== undefined && split.percentage > 0) {
        return {
          ...split,
          amount: Math.round((totalAmount * (split.percentage / 100)) * 100) / 100,
        };
      }
      return split;
    });

    // ── 3. Verify sum ────────────────────────────────────────────────────────
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

    // ── 4. Insert parent split_payments record ───────────────────────────────
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

    // ── 5. Process each split item ───────────────────────────────────────────
    const itemResults: SplitPaymentResult['items'] = [];
    let totalFees = 0;

    // Resolve the source (clearing) account for CR side of journal entries
    const sourceAccountCode = (metadata['sourceAccountCode'] as string | undefined)
      ?? DEFAULT_SOURCE_ACCOUNT_CODE;

    const sourceAccount = supabase
      ? await getAccountByCode(ventureId, sourceAccountCode)
      : null;

    for (const split of resolvedSplits) {
      const itemId = `spi_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
      let journalEntryId: string | null = null;

      try {
        // a. Insert split_payment_items record
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
          ? await getAccountByCode(ventureId, split.ledgerAccount)
          : null;

        // c. Create journal entry: DR recipient, CR source
        if (supabase && recipientAccount && sourceAccount) {
          const entry = await createJournalEntry({
            ventureId,
            entryDate: now,
            description: `Split payment to ${split.recipientId}: ${split.description}`,
            sourceType: 'split_payment',
            sourceId: splitPaymentId,
            lines: [
              {
                // Debit recipient account (increases asset / reduces liability)
                accountId: recipientAccount.id,
                debitAmount: split.amount,
                creditAmount: 0,
                currency,
                exchangeRate: 1,
                dimensions: {
                  ventureId,
                  rail: split.rail ?? 'internal',
                },
              },
              {
                // Credit source / clearing account
                accountId: sourceAccount.id,
                debitAmount: 0,
                creditAmount: split.amount,
                currency,
                exchangeRate: 1,
                dimensions: {
                  ventureId,
                  rail: split.rail ?? 'internal',
                },
              },
            ],
          });

          journalEntryId = entry.id;

          // d. Post the journal entry
          await postJournalEntry(entry.id, 'split-engine');
        }

        // Update item status to succeeded
        if (supabase) {
          await supabase
            .from('split_payment_items')
            .update({ status: 'succeeded', journal_entry_id: journalEntryId, updated_at: now })
            .eq('id', itemId);
        }

        itemResults.push({
          recipientId:    split.recipientId,
          amount:         split.amount,
          status:         'succeeded',
          rail:           split.rail ?? 'internal',
          journalEntryId,
        });
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : String(err);

        // Mark item as failed
        if (supabase) {
          await supabase
            .from('split_payment_items')
            .update({ status: 'failed', error: errorMsg, updated_at: now })
            .eq('id', itemId)
            .catch(() => {}); // ignore secondary errors
        }

        itemResults.push({
          recipientId:    split.recipientId,
          amount:         split.amount,
          status:         'failed',
          rail:           split.rail ?? 'internal',
          journalEntryId: null,
        });
      }
    }

    // ── 6. Update parent status ──────────────────────────────────────────────
    const anyFailed = itemResults.some(r => r.status === 'failed');
    const finalStatus = anyFailed ? 'partially_completed' : 'completed';

    if (supabase) {
      await supabase
        .from('split_payments')
        .update({ status: finalStatus, updated_at: new Date().toISOString() })
        .eq('id', splitPaymentId)
        .catch(() => {}); // ignore secondary errors
    }

    // ── 7. Return result ─────────────────────────────────────────────────────
    return {
      success:        !anyFailed,
      splitPaymentId,
      items:          itemResults,
      totalFees,
      ...(anyFailed
        ? { error: 'One or more split items failed — see items for details' }
        : {}),
    };
  }
}

// ── SINGLETON ────────────────────────────────────────────────────────────────

export const splitPaymentEngine = new SplitPaymentEngine();

// ── CALCULATE PLATFORM FEE ───────────────────────────────────────────────────
// Exported utility for callers that need to calculate the platform fee
// before executing the split (e.g., to add it as a split item).

export function calculatePlatformFee(
  amount: number,
  config: Pick<VenturePaymentConfig, 'platformFee'>,
): number {
  const { platformFee } = config;

  switch (platformFee.type) {
    case 'flat': {
      return platformFee.value;
    }

    case 'percentage': {
      return Math.round(amount * (platformFee.value / 100) * 10_000) / 10_000;
    }

    case 'tiered': {
      if (!platformFee.tiers || platformFee.tiers.length === 0) {
        // Fall back to percentage value if no tiers configured
        return Math.round(amount * (platformFee.value / 100) * 10_000) / 10_000;
      }

      // Find the matching tier
      const tier = platformFee.tiers.find(
        t => amount >= t.minAmount && amount <= t.maxAmount,
      );

      if (!tier) {
        // Amount outside all tiers — use the last tier's rate
        const lastTier = platformFee.tiers[platformFee.tiers.length - 1];
        return Math.round(amount * (lastTier.feePercent / 100) * 10_000) / 10_000;
      }

      return Math.round(amount * (tier.feePercent / 100) * 10_000) / 10_000;
    }

    default: {
      return 0;
    }
  }
}
