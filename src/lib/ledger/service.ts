// src/lib/ledger/service.ts

import { supabase } from '../supabase';
import type { WalletBinding, CustodyType, SyncStrategy } from './types';
import {
  CreateAccountInput,
  CreateJournalEntryInput,
  type JournalEntry,
  type JournalEntryLine,
  type LedgerAccount,
  type TrialBalanceRow,
} from './types';
import { DEFAULT_CHART_OF_ACCOUNTS } from './chart-of-accounts';

// ─────────────────────────────────────────────────────────
// ROW MAPPERS (snake_case → camelCase)
// ─────────────────────────────────────────────────────────

function mapAccountRow(row: Record<string, unknown>): LedgerAccount {
  return {
    id: row.id as string,
    ventureId: row.venture_id as string,
    code: row.code as string,
    name: row.name as string,
    type: row.type as LedgerAccount['type'],
    subtype: row.subtype as LedgerAccount['subtype'],
    currency: row.currency as string,
    currentBalance: Number(row.current_balance),
    isSystem: row.is_system as boolean,
    wallet: row.wallet_chain
      ? {
          chain: row.wallet_chain as WalletBinding['chain'],
          address: row.wallet_address as string | null,
          provider: row.wallet_provider as string | null,
          custodyType: row.wallet_custody_type as CustodyType,
          lastSyncedAt: row.wallet_last_synced_at as string | null,
          syncStrategy: row.wallet_sync_strategy as SyncStrategy,
        }
      : null,
    metadata: (row.metadata as Record<string, unknown>) ?? {},
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

function mapEntryRow(
  entry: Record<string, unknown>,
  lines: Record<string, unknown>[],
): JournalEntry {
  return {
    id: entry.id as string,
    ventureId: entry.venture_id as string,
    entryNumber: entry.entry_number as string,
    entryDate: entry.entry_date as string,
    description: entry.description as string,
    sourceType: entry.source_type as JournalEntry['sourceType'],
    sourceId: entry.source_id as string,
    status: entry.status as JournalEntry['status'],
    lines: lines.map(mapLineRow),
    postedAt: entry.posted_at as string | null,
    postedBy: entry.posted_by as string | null,
    reversalOf: entry.reversal_of as string | null,
    createdAt: entry.created_at as string,
  };
}

function mapLineRow(row: Record<string, unknown>): JournalEntryLine {
  return {
    id: row.id as string,
    entryId: row.entry_id as string,
    accountId: row.account_id as string,
    lineNumber: row.line_number as number,
    debitAmount: Number(row.debit_amount),
    creditAmount: Number(row.credit_amount),
    currency: row.currency as string,
    exchangeRate: Number(row.exchange_rate),
    dimensions: {
      ventureId: row.dim_venture_id as string | undefined,
      productId: row.dim_product_id as string | undefined,
      customerId: row.dim_customer_id as string | undefined,
      departmentId: row.dim_department_id as string | undefined,
      projectId: row.dim_project_id as string | undefined,
      rail: row.dim_rail as string | undefined,
      taxJurisdiction: row.dim_tax_jurisdiction as string | undefined,
    },
  };
}

// ─────────────────────────────────────────────────────────
// ACCOUNT OPERATIONS
// ─────────────────────────────────────────────────────────

export async function createAccount(input: {
  ventureId: string;
  code: string;
  name: string;
  type: string;
  subtype: string;
  currency?: string;
  isSystem?: boolean;
  wallet?: Record<string, unknown> | null;
  metadata?: Record<string, unknown>;
}): Promise<LedgerAccount> {
  if (!supabase) throw new Error('Supabase client not available');

  const validated = CreateAccountInput.parse(input);

  const row = {
    venture_id: validated.ventureId,
    code: validated.code,
    name: validated.name,
    type: validated.type,
    subtype: validated.subtype,
    currency: validated.currency,
    is_system: validated.isSystem,
    wallet_chain: validated.wallet?.chain ?? null,
    wallet_address: validated.wallet?.address ?? null,
    wallet_provider: validated.wallet?.provider ?? null,
    wallet_custody_type: validated.wallet?.custodyType ?? null,
    wallet_sync_strategy: validated.wallet?.syncStrategy ?? null,
    metadata: validated.metadata,
  };

  const { data, error } = await supabase
    .from('ledger_accounts')
    .insert(row)
    .select()
    .single();

  if (error) throw new Error(`Failed to create account: ${error.message}`);
  return mapAccountRow(data);
}

export async function getAccountByCode(
  ventureId: string,
  code: string,
): Promise<LedgerAccount | null> {
  if (!supabase) return null;

  const { data, error } = await supabase
    .from('ledger_accounts')
    .select()
    .eq('venture_id', ventureId)
    .eq('code', code)
    .single();

  if (error?.code === 'PGRST116') return null; // not found
  if (error) throw new Error(`Failed to get account: ${error.message}`);
  return mapAccountRow(data);
}

export async function listAccounts(
  ventureId: string,
  filters?: { type?: string; subtype?: string },
): Promise<LedgerAccount[]> {
  if (!supabase) return [];

  let query = supabase
    .from('ledger_accounts')
    .select()
    .eq('venture_id', ventureId)
    .order('code', { ascending: true });

  if (filters?.type) query = query.eq('type', filters.type);
  if (filters?.subtype) query = query.eq('subtype', filters.subtype);

  const { data, error } = await query;
  if (error) throw new Error(`Failed to list accounts: ${error.message}`);
  return (data ?? []).map(mapAccountRow);
}

export async function provisionVentureAccounts(ventureId: string): Promise<void> {
  if (!supabase) throw new Error('Supabase client not available');

  const rows = DEFAULT_CHART_OF_ACCOUNTS.map((a) => ({
    venture_id: ventureId,
    code: a.code,
    name: a.name,
    type: a.type,
    subtype: a.subtype,
    currency: a.currency,
    is_system: a.isSystem,
    metadata: {},
  }));

  const { error } = await supabase.from('ledger_accounts').insert(rows);

  if (error) throw new Error(`Failed to provision accounts: ${error.message}`);
}

// ─────────────────────────────────────────────────────────
// JOURNAL ENTRY OPERATIONS
// ─────────────────────────────────────────────────────────

export async function createJournalEntry(input: {
  ventureId: string;
  entryDate: string;
  description: string;
  sourceType: string;
  sourceId: string;
  lines: Array<{
    accountId: string;
    debitAmount: number;
    creditAmount: number;
    currency?: string;
    exchangeRate?: number;
    dimensions?: Record<string, string | undefined>;
  }>;
}): Promise<JournalEntry> {
  if (!supabase) throw new Error('Supabase client not available');

  const validated = CreateJournalEntryInput.parse(input);

  // Insert entry (entry_number auto-generated by DB trigger)
  const { data: entry, error: entryError } = await supabase
    .from('journal_entries')
    .insert({
      venture_id: validated.ventureId,
      entry_number: 'TEMP', // overwritten by trigger
      entry_date: validated.entryDate,
      description: validated.description,
      source_type: validated.sourceType,
      source_id: validated.sourceId,
      status: 'draft',
    })
    .select()
    .single();

  if (entryError) throw new Error(`Failed to create journal entry: ${entryError.message}`);

  // Insert lines
  const lineRows = validated.lines.map((line, i) => ({
    entry_id: entry.id,
    account_id: line.accountId,
    line_number: i + 1,
    debit_amount: line.debitAmount,
    credit_amount: line.creditAmount,
    currency: line.currency,
    exchange_rate: line.exchangeRate,
    dim_venture_id: line.dimensions?.ventureId ?? null,
    dim_product_id: line.dimensions?.productId ?? null,
    dim_customer_id: line.dimensions?.customerId ?? null,
    dim_department_id: line.dimensions?.departmentId ?? null,
    dim_project_id: line.dimensions?.projectId ?? null,
    dim_rail: line.dimensions?.rail ?? null,
    dim_tax_jurisdiction: line.dimensions?.taxJurisdiction ?? null,
  }));

  const { error: linesError } = await supabase
    .from('journal_entry_lines')
    .insert(lineRows);

  if (linesError) throw new Error(`Failed to create journal entry lines: ${linesError.message}`);

  return getJournalEntry(entry.id);
}

export async function postJournalEntry(
  entryId: string,
  postedBy: string,
): Promise<JournalEntry> {
  if (!supabase) throw new Error('Supabase client not available');

  const { data, error } = await supabase
    .from('journal_entries')
    .update({
      status: 'posted',
      posted_at: new Date().toISOString(),
      posted_by: postedBy,
    })
    .eq('id', entryId)
    .eq('status', 'draft')
    .select()
    .single();

  if (error) throw new Error(`Failed to post journal entry: ${error.message}`);
  return getJournalEntry(data.id);
}

export async function reverseJournalEntry(
  entryId: string,
  postedBy: string,
): Promise<JournalEntry> {
  if (!supabase) throw new Error('Supabase client not available');

  const original = await getJournalEntry(entryId);
  if (original.status !== 'posted') throw new Error('Can only reverse posted entries');

  // Create reversal: swap debits and credits
  const reversalLines = original.lines.map((line) => ({
    accountId: line.accountId,
    debitAmount: line.creditAmount,
    creditAmount: line.debitAmount,
    currency: line.currency,
    exchangeRate: line.exchangeRate,
    dimensions: line.dimensions,
  }));

  const reversal = await createJournalEntry({
    ventureId: original.ventureId,
    entryDate: new Date().toISOString(),
    description: `Reversal of ${original.entryNumber}: ${original.description}`,
    sourceType: original.sourceType,
    sourceId: original.sourceId,
    lines: reversalLines,
  });

  // Mark original as reversed
  await supabase
    .from('journal_entries')
    .update({ status: 'reversed' })
    .eq('id', entryId);

  // Post the reversal immediately
  return postJournalEntry(reversal.id, postedBy);
}

export async function getJournalEntry(entryId: string): Promise<JournalEntry> {
  if (!supabase) throw new Error('Supabase client not available');

  const { data: entry, error: entryError } = await supabase
    .from('journal_entries')
    .select()
    .eq('id', entryId)
    .single();

  if (entryError) throw new Error(`Failed to get journal entry: ${entryError.message}`);

  const { data: lines, error: linesError } = await supabase
    .from('journal_entry_lines')
    .select()
    .eq('entry_id', entryId)
    .order('line_number', { ascending: true });

  if (linesError) throw new Error(`Failed to get journal entry lines: ${linesError.message}`);

  return mapEntryRow(entry, lines ?? []);
}

export async function getTrialBalance(
  ventureId: string,
  asOfDate?: string,
): Promise<TrialBalanceRow[]> {
  if (!supabase) return [];

  // Sum all posted entry lines grouped by account
  let query = supabase
    .from('journal_entry_lines')
    .select(
      `
      account_id,
      debit_amount,
      credit_amount,
      journal_entries!inner(venture_id, status, entry_date)
    `,
    )
    .eq('journal_entries.venture_id', ventureId)
    .eq('journal_entries.status', 'posted');

  if (asOfDate) {
    query = query.lte('journal_entries.entry_date', asOfDate);
  }

  const { data, error } = await query;
  if (error) throw new Error(`Failed to get trial balance: ${error.message}`);

  // Aggregate by account
  const accountTotals = new Map<string, { debits: number; credits: number }>();
  for (const line of data ?? []) {
    const existing = accountTotals.get(line.account_id) ?? { debits: 0, credits: 0 };
    existing.debits += Number(line.debit_amount);
    existing.credits += Number(line.credit_amount);
    accountTotals.set(line.account_id, existing);
  }

  // Fetch account details
  const accountIds = Array.from(accountTotals.keys());
  if (accountIds.length === 0) return [];

  const { data: accounts } = await supabase
    .from('ledger_accounts')
    .select('id, code, name, type, currency')
    .in('id', accountIds);

  return (accounts ?? [])
    .map((acc: { id: string; code: string; name: string; type: string; currency: string }) => {
      const totals = accountTotals.get(acc.id)!;
      const isDebitNormal = acc.type === 'asset' || acc.type === 'expense';
      const netBalance = totals.debits - totals.credits;
      return {
        accountId: acc.id,
        accountCode: acc.code,
        accountName: acc.name,
        accountType: acc.type as TrialBalanceRow['accountType'],
        debitBalance: isDebitNormal ? Math.max(netBalance, 0) : Math.max(-netBalance, 0),
        creditBalance: isDebitNormal ? Math.max(-netBalance, 0) : Math.max(netBalance, 0),
        currency: acc.currency,
      };
    })
    .sort((a: TrialBalanceRow, b: TrialBalanceRow) => a.accountCode.localeCompare(b.accountCode));
}
