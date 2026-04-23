// @mcv/foundation-sdk/services/filings — writes filing_records AND emits the
// matching double-entry journal through the injected LedgerAdapter.
//
// On record():
//   1. INSERT filing_records row.
//   2. Resolve DR/CR accounts via adapter.getAccountByCode().
//      - DR: 5180 "IP & Legal Filing Expense"
//      - CR: 2010 "Accounts Payable — Counsel" if counselEngagementId is present
//             else 1010 "Cash" (paid immediately)
//   3. adapter.createJournalEntry({ sourceType: 'ip_filing_expense',
//      sourceId: filing_record.id, lines: [DR, CR] }).
//   4. adapter.postJournalEntry(entry.id, 'system:foundation-filings').
//   5. Backfill filing_records.journal_entry_id with the posted entry id.
//
// Ledger failures are swallowed (same pattern as commerce-sdk/checkout-service) —
// an outage in the ledger should not block filing bookkeeping. The filing_record
// row stays with journal_entry_id=null, flagged by the cockpit as "ledger pending".

import type { SupabaseClient } from '@supabase/supabase-js';
import type { LedgerAdapter } from '@mcv/ledger-sdk';
import {
  FilingRecord,
  RecordFilingInput,
  FilingType,
  IPStatus,
} from '../types';

// ─── Default ventureId for IP filings (MCV Inc. is the interim IP holder) ───
// See memory: project_mcv_inc_crown_philosophy.md. Until the Root trust is formed
// and IP transfer executes, MCV Inc. carries the bookkeeping.
import { MCV_INC_ID } from '../corpus/entity-stack-ids';
export const DEFAULT_FILING_VENTURE_ID = MCV_INC_ID;

// ─── Chart-of-accounts codes for the IP-filing double-entry ─────────────────
// These codes must exist in the ventures's chart-of-accounts. Missing codes cause
// the ledger emit to be skipped (non-fatal — filing_record still persists).
export const IP_FILING_EXPENSE_ACCOUNT_CODE = '5180';
export const COUNSEL_PAYABLE_ACCOUNT_CODE = '2010';
export const CASH_ACCOUNT_CODE = '1010';

// ─── Row mapping ────────────────────────────────────────────────────────────

export function mapFilingRecordRow(row: Record<string, unknown>): FilingRecord {
  return {
    id: row.id as string,
    ipMarkId: row.ip_mark_id as string,
    filingType: row.filing_type as FilingRecord['filingType'],
    jurisdiction: row.jurisdiction as string,
    filedAt: (row.filed_at as string) ?? null,
    filingNumber: (row.filing_number as string) ?? null,
    counselEngagementId: (row.counsel_engagement_id as string) ?? null,
    feeFilingUsd: Number(row.fee_filing_usd ?? 0),
    feeCounselUsd: Number(row.fee_counsel_usd ?? 0),
    feeTotalUsd: Number(row.fee_total_usd ?? 0),
    status: row.status as FilingRecord['status'],
    notes: (row.notes as string) ?? null,
    capitalFlowId: (row.journal_entry_id as string) ?? null,
    createdAt: row.created_at as string,
  };
}

// ─── Service ────────────────────────────────────────────────────────────────

export interface FilingsService {
  list(ipMarkId?: string): Promise<FilingRecord[]>;
  get(id: string): Promise<FilingRecord | null>;
  /** Records a filing AND emits the DR 5180 / CR 2010|1010 journal entry. */
  record(input: RecordFilingInput & { ventureId?: string }, postedBy?: string): Promise<FilingRecord>;
  updateStatus(id: string, status: FilingRecord['status']): Promise<FilingRecord>;
  /** Read the total filing fees paid to date — used by IPPortfolioView budget tracker. */
  totalFeesPaid(): Promise<number>;
}

export interface FilingsServiceOptions {
  supabase: SupabaseClient | null;
  ledger: LedgerAdapter | null;
}

// ─── Factory ────────────────────────────────────────────────────────────────

export function createFilingsService(options: FilingsServiceOptions): FilingsService {
  const { supabase, ledger } = options;

  const requireClient = (): SupabaseClient => {
    if (!supabase) throw new Error('Supabase client not available for FilingsService');
    return supabase;
  };

  /**
   * Emit the double-entry journal for a filing. Swallows ledger errors —
   * filing_record persistence must not depend on ledger availability.
   * Returns the journal entry id on success, null otherwise.
   */
  async function emitFilingJournal(args: {
    ventureId: string;
    filingRecordId: string;
    jurisdiction: string;
    filingType: FilingRecord['filingType'];
    totalFeeUsd: number;
    counselEngagementId: string | null;
    filingNumber: string | null;
    postedBy: string;
  }): Promise<string | null> {
    if (!ledger) return null;
    if (args.totalFeeUsd <= 0) return null;
    try {
      const [expenseAccount, creditAccount] = await Promise.all([
        ledger.getAccountByCode(args.ventureId, IP_FILING_EXPENSE_ACCOUNT_CODE),
        ledger.getAccountByCode(
          args.ventureId,
          args.counselEngagementId ? COUNSEL_PAYABLE_ACCOUNT_CODE : CASH_ACCOUNT_CODE,
        ),
      ]);
      if (!expenseAccount || !creditAccount) return null;

      const entry = await ledger.createJournalEntry({
        ventureId: args.ventureId,
        entryDate: new Date().toISOString(),
        description:
          `IP filing — ${args.filingType} (${args.jurisdiction})` +
          (args.filingNumber ? ` — ${args.filingNumber}` : ''),
        sourceType: 'ip_filing_expense',               // CapitalFlow kind (see capital-sdk)
        sourceId: args.filingRecordId,
        lines: [
          {
            accountId: expenseAccount.id,
            debitAmount: args.totalFeeUsd,
            creditAmount: 0,
            currency: 'USD',
            dimensions: {
              jurisdiction: args.jurisdiction,
              filingType: args.filingType,
              counselEngagementId: args.counselEngagementId ?? undefined,
            },
          },
          {
            accountId: creditAccount.id,
            debitAmount: 0,
            creditAmount: args.totalFeeUsd,
            currency: 'USD',
            dimensions: {
              jurisdiction: args.jurisdiction,
              filingType: args.filingType,
              counselEngagementId: args.counselEngagementId ?? undefined,
            },
          },
        ],
      });

      await ledger.postJournalEntry(entry.id, args.postedBy).catch(() => null);
      return entry.id;
    } catch {
      // Ledger outage / missing accounts → filing still persists, entry skipped.
      return null;
    }
  }

  return {
    async list(ipMarkId) {
      const client = requireClient();
      let q = client.from('filing_records').select().order('filed_at', { ascending: false });
      if (ipMarkId) q = q.eq('ip_mark_id', ipMarkId);
      const { data, error } = await q;
      if (error) throw new Error(`FilingsService.list failed: ${error.message}`);
      return (data ?? []).map(mapFilingRecordRow);
    },

    async get(id) {
      if (!supabase) return null;
      const { data, error } = await supabase
        .from('filing_records').select().eq('id', id).maybeSingle();
      if (error) throw new Error(`FilingsService.get failed: ${error.message}`);
      return data ? mapFilingRecordRow(data) : null;
    },

    async record(input, postedBy = 'system:foundation-filings') {
      const client = requireClient();
      const validated = RecordFilingInput.parse(input);
      const ventureId = input.ventureId ?? DEFAULT_FILING_VENTURE_ID;

      // 1. Insert the filing record.
      const row = {
        ip_mark_id: validated.ipMarkId,
        filing_type: validated.filingType,
        jurisdiction: validated.jurisdiction,
        filed_at: new Date().toISOString(),
        filing_number: validated.filingNumber ?? null,
        counsel_engagement_id: validated.counselEngagementId ?? null,
        fee_filing_usd: validated.feeFilingUsd,
        fee_counsel_usd: validated.feeCounselUsd,
        status: 'filed' as const,
        notes: validated.notes ?? null,
      };
      const { data: insertedRow, error: insErr } = await client
        .from('filing_records').insert(row).select().single();
      if (insErr) throw new Error(`FilingsService.record failed (insert): ${insErr.message}`);
      const inserted = mapFilingRecordRow(insertedRow);

      // 2. Flip the ip_mark to filed status (doesn't depend on ledger).
      await client
        .from('ip_marks')
        .update({ status: 'filed', filed_at: row.filed_at, filing_number: row.filing_number })
        .eq('id', validated.ipMarkId);

      // 3. Emit the ledger journal. On success, backfill journal_entry_id.
      const journalEntryId = await emitFilingJournal({
        ventureId,
        filingRecordId: inserted.id,
        jurisdiction: validated.jurisdiction,
        filingType: validated.filingType,
        totalFeeUsd: inserted.feeTotalUsd,
        counselEngagementId: inserted.counselEngagementId,
        filingNumber: inserted.filingNumber,
        postedBy,
      });

      if (journalEntryId) {
        const { data: updated, error: updErr } = await client
          .from('filing_records')
          .update({ journal_entry_id: journalEntryId })
          .eq('id', inserted.id).select().single();
        if (updErr) {
          // Journal posted but backfill failed — log-only. Return the pre-update record.
          return inserted;
        }
        return mapFilingRecordRow(updated);
      }

      return inserted;
    },

    async updateStatus(id, status) {
      const client = requireClient();
      IPStatus.parse(status);
      const { data, error } = await client
        .from('filing_records').update({ status }).eq('id', id).select().single();
      if (error) throw new Error(`FilingsService.updateStatus failed: ${error.message}`);
      return mapFilingRecordRow(data);
    },

    async totalFeesPaid() {
      const client = requireClient();
      const { data, error } = await client
        .from('filing_records').select('fee_total_usd');
      if (error) throw new Error(`FilingsService.totalFeesPaid failed: ${error.message}`);
      return (data ?? []).reduce((sum, r) => sum + Number((r as { fee_total_usd?: number }).fee_total_usd ?? 0), 0);
    },
  };
}

// Re-export FilingType for CLI/kit consumers narrowing on it.
export { FilingType };
