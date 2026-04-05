// src/lib/ledger/credit-service.ts

import { supabase } from '../supabase';
import { CreateCreditAccountInput, type CreditAccount } from './types';
import { createJournalEntry, postJournalEntry, getAccountByCode } from './service';

// ─────────────────────────────────────────────────────────
// ROW MAPPER (snake_case → camelCase)
// ─────────────────────────────────────────────────────────

function mapCreditRow(row: Record<string, unknown>): CreditAccount {
  return {
    id: row.id as string,
    ventureId: row.venture_id as string,
    ownerId: row.owner_id as string,
    ownerType: row.owner_type as CreditAccount['ownerType'],
    currency: row.currency as string,
    balance: Number(row.balance),
    creditLimit: Number(row.credit_limit),
    totalGranted: Number(row.total_granted),
    totalConsumed: Number(row.total_consumed),
    totalExpired: Number(row.total_expired),
    expiresAt: row.expires_at as string | null,
    metadata: (row.metadata as Record<string, unknown>) ?? {},
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

// ─────────────────────────────────────────────────────────
// CREATE CREDIT ACCOUNT
// ─────────────────────────────────────────────────────────

export async function createCreditAccount(input: {
  ventureId: string;
  ownerId: string;
  ownerType?: string;
  currency?: string;
  creditLimit?: number;
  expiresAt?: string | null;
  metadata?: Record<string, unknown>;
}): Promise<CreditAccount> {
  if (!supabase) throw new Error('Supabase client not available');

  const validated = CreateCreditAccountInput.parse(input);

  const row = {
    venture_id: validated.ventureId,
    owner_id: validated.ownerId,
    owner_type: validated.ownerType,
    currency: validated.currency,
    credit_limit: validated.creditLimit,
    expires_at: validated.expiresAt,
    metadata: validated.metadata,
  };

  const { data, error } = await supabase
    .from('credit_accounts')
    .insert(row)
    .select()
    .single();

  if (error) throw new Error(`Failed to create credit account: ${error.message}`);
  return mapCreditRow(data);
}

// ─────────────────────────────────────────────────────────
// GET CREDIT BALANCE
// ─────────────────────────────────────────────────────────

export async function getCreditBalance(
  ventureId: string,
  ownerId: string,
  currency = 'credits',
): Promise<CreditAccount> {
  if (!supabase) throw new Error('Supabase client not available');

  const { data, error } = await supabase
    .from('credit_accounts')
    .select()
    .eq('venture_id', ventureId)
    .eq('owner_id', ownerId)
    .eq('currency', currency)
    .single();

  if (error) throw new Error(`Credit account not found: ${error.message}`);
  return mapCreditRow(data);
}

// ─────────────────────────────────────────────────────────
// GRANT CREDITS
// DR: 5050 Credit Grants (Promotional)
// CR: 2020 Credits Payable
// ─────────────────────────────────────────────────────────

export async function grantCredits(input: {
  ventureId: string;
  ownerId: string;
  amount: number;
  reason: string;
  currency?: string;
}): Promise<CreditAccount> {
  if (!supabase) throw new Error('Supabase client not available');
  if (input.amount <= 0) throw new Error('Grant amount must be positive');

  const currency = input.currency ?? 'credits';

  // Check if credit account already exists
  const { data: existing } = await supabase
    .from('credit_accounts')
    .select()
    .eq('venture_id', input.ventureId)
    .eq('owner_id', input.ownerId)
    .eq('currency', currency)
    .single();

  if (!existing) {
    await createCreditAccount({
      ventureId: input.ventureId,
      ownerId: input.ownerId,
      currency,
    });
  }

  // Try RPC first; fall back to direct update
  const { error: rpcError } = await supabase.rpc('grant_credits', {
    p_venture_id: input.ventureId,
    p_owner_id: input.ownerId,
    p_currency: currency,
    p_amount: input.amount,
  });

  if (rpcError) {
    // Fallback: direct update
    const { error: updateError } = await supabase
      .from('credit_accounts')
      .update({
        balance: (existing?.balance ?? 0) + input.amount,
        total_granted: (existing?.total_granted ?? 0) + input.amount,
        updated_at: new Date().toISOString(),
      })
      .eq('venture_id', input.ventureId)
      .eq('owner_id', input.ownerId)
      .eq('currency', currency);

    if (updateError) throw new Error(`Failed to grant credits: ${updateError.message}`);
  }

  // Create double-entry journal: DR 5050 Credit Grants / CR 2020 Credits Payable
  const creditPayableAccount = await getAccountByCode(input.ventureId, '2020');
  const creditExpenseAccount = await getAccountByCode(input.ventureId, '5050');

  if (creditPayableAccount && creditExpenseAccount) {
    const entry = await createJournalEntry({
      ventureId: input.ventureId,
      entryDate: new Date().toISOString(),
      description: `Credit grant: ${input.reason}`,
      sourceType: 'credit_grant',
      sourceId: input.ownerId,
      lines: [
        { accountId: creditExpenseAccount.id, debitAmount: input.amount, creditAmount: 0 },
        { accountId: creditPayableAccount.id, debitAmount: 0, creditAmount: input.amount },
      ],
    });
    await postJournalEntry(entry.id, 'system');
  }

  return getCreditBalance(input.ventureId, input.ownerId, currency);
}

// ─────────────────────────────────────────────────────────
// CONSUME CREDITS
// DR: 2020 Credits Payable
// CR: 4070 Revenue - Credit Sales
// ─────────────────────────────────────────────────────────

export async function consumeCredits(input: {
  ventureId: string;
  ownerId: string;
  amount: number;
  reason: string;
  currency?: string;
}): Promise<CreditAccount> {
  if (!supabase) throw new Error('Supabase client not available');
  if (input.amount <= 0) throw new Error('Consume amount must be positive');

  const currency = input.currency ?? 'credits';

  // Check balance
  const account = await getCreditBalance(input.ventureId, input.ownerId, currency);
  if (account.balance < input.amount) {
    throw new Error(`Insufficient credits: have ${account.balance}, need ${input.amount}`);
  }

  // Deduct balance
  const { error } = await supabase
    .from('credit_accounts')
    .update({
      balance: account.balance - input.amount,
      total_consumed: account.totalConsumed + input.amount,
      updated_at: new Date().toISOString(),
    })
    .eq('id', account.id);

  if (error) throw new Error(`Failed to consume credits: ${error.message}`);

  // Create double-entry journal: DR 2020 Credits Payable / CR 4070 Revenue - Credit Sales
  const creditPayableAccount = await getAccountByCode(input.ventureId, '2020');
  const revenueAccount = await getAccountByCode(input.ventureId, '4070');

  if (creditPayableAccount && revenueAccount) {
    const entry = await createJournalEntry({
      ventureId: input.ventureId,
      entryDate: new Date().toISOString(),
      description: `Credit consumption: ${input.reason}`,
      sourceType: 'credit_consume',
      sourceId: input.ownerId,
      lines: [
        { accountId: creditPayableAccount.id, debitAmount: input.amount, creditAmount: 0 },
        { accountId: revenueAccount.id, debitAmount: 0, creditAmount: input.amount },
      ],
    });
    await postJournalEntry(entry.id, 'system');
  }

  return getCreditBalance(input.ventureId, input.ownerId, currency);
}

// ─────────────────────────────────────────────────────────
// TRANSFER CREDITS
// Consume from sender, grant to recipient
// ─────────────────────────────────────────────────────────

export async function transferCredits(input: {
  ventureId: string;
  fromOwnerId: string;
  toOwnerId: string;
  amount: number;
  currency?: string;
}): Promise<void> {
  await consumeCredits({
    ventureId: input.ventureId,
    ownerId: input.fromOwnerId,
    amount: input.amount,
    reason: `Transfer to ${input.toOwnerId}`,
    currency: input.currency,
  });
  await grantCredits({
    ventureId: input.ventureId,
    ownerId: input.toOwnerId,
    amount: input.amount,
    reason: `Transfer from ${input.fromOwnerId}`,
    currency: input.currency,
  });
}
