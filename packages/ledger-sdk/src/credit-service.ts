// @mcv/ledger-sdk/credit-service — credit account factory.
//
// Composes on top of createLedgerService — takes a LedgerService plus a
// SupabaseClient and returns the 5 credit-account operations. Every grant/
// consume/transfer posts a matching double-entry journal through the
// ledger service.

import type { SupabaseClient } from '@supabase/supabase-js';
import { CreateCreditAccountInput, type CreditAccount } from './types';
import type { LedgerService } from './service';

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

export interface CreditService {
  createCreditAccount(input: {
    ventureId: string;
    ownerId: string;
    ownerType?: string;
    currency?: string;
    creditLimit?: number;
    expiresAt?: string | null;
    metadata?: Record<string, unknown>;
  }): Promise<CreditAccount>;
  getCreditBalance(ventureId: string, ownerId: string, currency?: string): Promise<CreditAccount>;
  grantCredits(input: {
    ventureId: string;
    ownerId: string;
    amount: number;
    reason: string;
    currency?: string;
  }): Promise<CreditAccount>;
  consumeCredits(input: {
    ventureId: string;
    ownerId: string;
    amount: number;
    reason: string;
    currency?: string;
  }): Promise<CreditAccount>;
  transferCredits(input: {
    ventureId: string;
    fromOwnerId: string;
    toOwnerId: string;
    amount: number;
    currency?: string;
  }): Promise<void>;
}

export interface CreditServiceOptions {
  supabase: SupabaseClient | null;
  ledger: LedgerService;
}

export function createCreditService({ supabase, ledger }: CreditServiceOptions): CreditService {
  const credit: CreditService = {
    async createCreditAccount(input) {
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
    },

    async getCreditBalance(ventureId, ownerId, currency = 'credits') {
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
    },

    async grantCredits(input) {
      if (!supabase) throw new Error('Supabase client not available');
      if (input.amount <= 0) throw new Error('Grant amount must be positive');

      const currency = input.currency ?? 'credits';

      const { data: existing } = await supabase
        .from('credit_accounts')
        .select()
        .eq('venture_id', input.ventureId)
        .eq('owner_id', input.ownerId)
        .eq('currency', currency)
        .single();

      if (!existing) {
        await credit.createCreditAccount({
          ventureId: input.ventureId,
          ownerId: input.ownerId,
          currency,
        });
      }

      // Try RPC first; fall back to direct balance update.
      const { error: rpcError } = await supabase.rpc('grant_credits', {
        p_venture_id: input.ventureId,
        p_owner_id: input.ownerId,
        p_currency: currency,
        p_amount: input.amount,
      });

      if (rpcError) {
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

      // Double-entry: DR 5050 Credit Grants (Promotional) / CR 2020 Credits Payable
      const creditPayableAccount = await ledger.getAccountByCode(input.ventureId, '2020');
      const creditExpenseAccount = await ledger.getAccountByCode(input.ventureId, '5050');

      if (creditPayableAccount && creditExpenseAccount) {
        const entry = await ledger.createJournalEntry({
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
        await ledger.postJournalEntry(entry.id, 'system');
      }

      return credit.getCreditBalance(input.ventureId, input.ownerId, currency);
    },

    async consumeCredits(input) {
      if (!supabase) throw new Error('Supabase client not available');
      if (input.amount <= 0) throw new Error('Consume amount must be positive');

      const currency = input.currency ?? 'credits';

      const account = await credit.getCreditBalance(input.ventureId, input.ownerId, currency);
      if (account.balance < input.amount) {
        throw new Error(`Insufficient credits: have ${account.balance}, need ${input.amount}`);
      }

      const { error } = await supabase
        .from('credit_accounts')
        .update({
          balance: account.balance - input.amount,
          total_consumed: account.totalConsumed + input.amount,
          updated_at: new Date().toISOString(),
        })
        .eq('id', account.id);

      if (error) throw new Error(`Failed to consume credits: ${error.message}`);

      // Double-entry: DR 2020 Credits Payable / CR 4070 Revenue - Credit Sales
      const creditPayableAccount = await ledger.getAccountByCode(input.ventureId, '2020');
      const revenueAccount = await ledger.getAccountByCode(input.ventureId, '4070');

      if (creditPayableAccount && revenueAccount) {
        const entry = await ledger.createJournalEntry({
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
        await ledger.postJournalEntry(entry.id, 'system');
      }

      return credit.getCreditBalance(input.ventureId, input.ownerId, currency);
    },

    async transferCredits(input) {
      await credit.consumeCredits({
        ventureId: input.ventureId,
        ownerId: input.fromOwnerId,
        amount: input.amount,
        reason: `Transfer to ${input.toOwnerId}`,
        currency: input.currency,
      });
      await credit.grantCredits({
        ventureId: input.ventureId,
        ownerId: input.toOwnerId,
        amount: input.amount,
        reason: `Transfer from ${input.fromOwnerId}`,
        currency: input.currency,
      });
    },
  };

  return credit;
}
