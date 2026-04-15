// @mcv/commerce-sdk/gift-card-service — code generation, redemption,
// refunds, double-entry ledger integration.
//
// 8 methods behind createGiftCardService({ supabase, ledger, credit }).
// Each gift card maps 1-1 to a CreditAccount (owner = gift card id,
// currency = lowercase(currency)) so balances flow through the same
// credit-payable journaling as any other credit grant.
//
// Accounting:
//   createGiftCard       DR 1000 Cash / CR 2030 Unearned Revenue
//                        + credit.grantCredits(amount)
//   redeemGiftCard       credit.consumeCredits(amount) — that itself
//                        fires DR 2020 Credits Payable / CR 4070 Revenue
//   refundToGiftCard     credit.grantCredits again to re-inflate balance

import { nanoid } from 'nanoid';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { GiftCard, GiftCardTransaction, GiftCardStatus } from './surface-types';

// ─── Adapters ──────────────────────────────────────────────────────────

// Shared ledger contract — see @mcv/ledger-sdk/adapter.
import type { LedgerAdapter } from '@mcv/ledger-sdk';
export type {
  LedgerAccountRef,
  LedgerJournalEntryRef,
  LedgerJournalEntryInput,
  LedgerAdapter,
} from '@mcv/ledger-sdk';

export interface CreditAdapter {
  grantCredits(input: {
    ventureId: string;
    ownerId: string;
    amount: number;
    reason: string;
    currency?: string;
  }): Promise<unknown>;
  consumeCredits(input: {
    ventureId: string;
    ownerId: string;
    amount: number;
    reason: string;
    currency?: string;
  }): Promise<unknown>;
}

// ─── Row mappers ────────────────────────────────────────────────────────

function mapTransactionRow(row: Record<string, unknown>): GiftCardTransaction {
  return {
    id: row.id as string,
    giftCardId: row.gift_card_id as string,
    type: row.type as GiftCardTransaction['type'],
    amount: Number(row.amount),
    orderId: (row.order_id as string) ?? null,
    balanceAfter: Number(row.balance_after ?? 0),
    createdAt: row.created_at as string,
  };
}

function mapGiftCardRow(
  row: Record<string, unknown>,
  transactions: GiftCardTransaction[],
): GiftCard {
  return {
    id: row.id as string,
    ventureId: row.venture_id as string,
    code: row.code as string,
    initialBalance: Number(row.initial_balance),
    currentBalance: Number(row.current_balance),
    currency: (row.currency as string) ?? 'USD',
    purchasedBy: (row.purchased_by as string) ?? null,
    recipientEmail: (row.recipient_email as string) ?? null,
    recipientMessage: (row.recipient_message as string) ?? null,
    status: row.status as GiftCardStatus,
    expiresAt: (row.expires_at as string) ?? null,
    redeemedAt: (row.redeemed_at as string) ?? null,
    transactions,
    createdAt: row.created_at as string,
  };
}

// ─── Pure helpers ──────────────────────────────────────────────────────

function generateGiftCardCode(): string {
  // Format: GIFT-XXXX-XXXX-XXXX (uppercase alphanumeric, sanitized).
  const segment = () =>
    nanoid(4).toUpperCase().replace(/[^A-Z0-9]/g, '0').padEnd(4, '0').slice(0, 4);
  return `GIFT-${segment()}-${segment()}-${segment()}`;
}

// ─── Engine interface ──────────────────────────────────────────────────

export interface GiftCardService {
  createGiftCard(
    ventureId: string,
    initialBalance: number,
    currency?: string,
    purchasedBy?: string | null,
    recipientEmail?: string | null,
    recipientMessage?: string | null,
  ): Promise<GiftCard>;
  getGiftCard(code: string): Promise<GiftCard | null>;
  getGiftCardBalance(code: string): Promise<number>;
  redeemGiftCard(code: string, amount: number, orderId: string): Promise<GiftCard>;
  refundToGiftCard(code: string, amount: number, orderId: string): Promise<GiftCard>;
  disableGiftCard(code: string): Promise<GiftCard>;
  listGiftCards(ventureId: string, status?: GiftCardStatus): Promise<GiftCard[]>;
  getGiftCardTransactions(giftCardId: string): Promise<GiftCardTransaction[]>;
}

export interface GiftCardServiceOptions {
  supabase: SupabaseClient | null;
  ledger: LedgerAdapter;
  credit: CreditAdapter;
}

// ─── Factory ───────────────────────────────────────────────────────────

export function createGiftCardService({
  supabase,
  ledger,
  credit,
}: GiftCardServiceOptions): GiftCardService {
  async function fetchTransactions(giftCardId: string): Promise<GiftCardTransaction[]> {
    if (!supabase) return [];
    const { data } = await supabase
      .from('gift_card_transactions')
      .select()
      .eq('gift_card_id', giftCardId)
      .order('created_at', { ascending: true });
    return (data ?? []).map(mapTransactionRow);
  }

  const service: GiftCardService = {
    async createGiftCard(
      ventureId,
      initialBalance,
      currency = 'USD',
      purchasedBy,
      recipientEmail,
      recipientMessage,
    ) {
      if (!supabase) throw new Error('Supabase client not available');
      if (initialBalance <= 0) throw new Error('Initial balance must be positive');

      const code = generateGiftCardCode();
      const now = new Date().toISOString();

      const { data, error } = await supabase
        .from('gift_cards')
        .insert({
          venture_id: ventureId,
          code,
          initial_balance: initialBalance,
          current_balance: initialBalance,
          currency,
          purchased_by: purchasedBy ?? null,
          recipient_email: recipientEmail ?? null,
          recipient_message: recipientMessage ?? null,
          status: 'active',
          created_at: now,
        })
        .select()
        .single();

      if (error) throw new Error(`Failed to create gift card: ${error.message}`);

      const giftCard = mapGiftCardRow(data, []);

      // Initial purchase audit row.
      await supabase.from('gift_card_transactions').insert({
        gift_card_id: giftCard.id,
        type: 'purchase',
        amount: initialBalance,
        order_id: null,
        balance_after: initialBalance,
        created_at: now,
      });

      // Mirror balance into a CreditAccount (ownerId = gift card id) so
      // redemption/refund flows use the same credit-payable journaling.
      await credit.grantCredits({
        ventureId,
        ownerId: giftCard.id,
        amount: initialBalance,
        reason: `Gift card ${code} issued`,
        currency: currency.toLowerCase(),
      });

      // Double-entry on sale: DR 1000 Cash / CR 2030 Unearned Revenue.
      const cashAccount = await ledger.getAccountByCode(ventureId, '1000');
      const unearnedRevenueAccount = await ledger.getAccountByCode(ventureId, '2030');

      if (cashAccount && unearnedRevenueAccount) {
        const entry = await ledger.createJournalEntry({
          ventureId,
          entryDate: now,
          description: `Gift card sale: ${code}`,
          sourceType: 'gift_card_sale',
          sourceId: giftCard.id,
          lines: [
            { accountId: cashAccount.id, debitAmount: initialBalance, creditAmount: 0 },
            { accountId: unearnedRevenueAccount.id, debitAmount: 0, creditAmount: initialBalance },
          ],
        });
        await ledger.postJournalEntry(entry.id, 'system');
      }

      return { ...giftCard, transactions: await fetchTransactions(giftCard.id) };
    },

    async getGiftCard(code) {
      if (!supabase) return null;

      const { data, error } = await supabase
        .from('gift_cards')
        .select()
        .eq('code', code)
        .single();

      if (error?.code === 'PGRST116') return null;
      if (error) throw new Error(`Failed to get gift card: ${error.message}`);

      const transactions = await fetchTransactions(data.id as string);
      return mapGiftCardRow(data, transactions);
    },

    async getGiftCardBalance(code) {
      const card = await service.getGiftCard(code);
      if (!card) throw new Error(`Gift card not found: ${code}`);
      return card.currentBalance;
    },

    async redeemGiftCard(code, amount, orderId) {
      if (!supabase) throw new Error('Supabase client not available');
      if (amount <= 0) throw new Error('Redemption amount must be positive');

      const card = await service.getGiftCard(code);
      if (!card) throw new Error(`Gift card not found: ${code}`);
      if (card.status !== 'active') throw new Error(`Gift card is ${card.status}`);
      if (card.currentBalance < amount) {
        throw new Error(`Insufficient balance: have ${card.currentBalance}, need ${amount}`);
      }

      const newBalance = card.currentBalance - amount;
      const newStatus: GiftCardStatus = newBalance === 0 ? 'redeemed' : 'active';
      const now = new Date().toISOString();

      const { data, error } = await supabase
        .from('gift_cards')
        .update({
          current_balance: newBalance,
          status: newStatus,
          redeemed_at: newStatus === 'redeemed' ? now : card.redeemedAt,
        })
        .eq('id', card.id)
        .select()
        .single();

      if (error) throw new Error(`Failed to redeem gift card: ${error.message}`);

      await supabase.from('gift_card_transactions').insert({
        gift_card_id: card.id,
        type: 'redemption',
        amount: -amount,
        order_id: orderId,
        balance_after: newBalance,
        created_at: now,
      });

      // Credit.consumeCredits internally fires DR 2020 Credits Payable /
      // CR 4070 Revenue — Credit Sales, so the gift-card-service layer
      // doesn't need its own journal here.
      await credit.consumeCredits({
        ventureId: card.ventureId,
        ownerId: card.id,
        amount,
        reason: `Gift card redemption on order ${orderId}`,
        currency: card.currency.toLowerCase(),
      });

      const transactions = await fetchTransactions(card.id);
      return mapGiftCardRow(data, transactions);
    },

    async refundToGiftCard(code, amount, orderId) {
      if (!supabase) throw new Error('Supabase client not available');
      if (amount <= 0) throw new Error('Refund amount must be positive');

      const card = await service.getGiftCard(code);
      if (!card) throw new Error(`Gift card not found: ${code}`);
      if (card.status === 'disabled') throw new Error('Cannot refund to a disabled gift card');

      const newBalance = card.currentBalance + amount;
      const now = new Date().toISOString();

      const { data, error } = await supabase
        .from('gift_cards')
        .update({
          current_balance: newBalance,
          status: 'active',
          redeemed_at: null,
        })
        .eq('id', card.id)
        .select()
        .single();

      if (error) throw new Error(`Failed to refund to gift card: ${error.message}`);

      await supabase.from('gift_card_transactions').insert({
        gift_card_id: card.id,
        type: 'refund',
        amount,
        order_id: orderId,
        balance_after: newBalance,
        created_at: now,
      });

      await credit.grantCredits({
        ventureId: card.ventureId,
        ownerId: card.id,
        amount,
        reason: `Gift card refund from order ${orderId}`,
        currency: card.currency.toLowerCase(),
      });

      const transactions = await fetchTransactions(card.id);
      return mapGiftCardRow(data, transactions);
    },

    async disableGiftCard(code) {
      if (!supabase) throw new Error('Supabase client not available');

      const { data, error } = await supabase
        .from('gift_cards')
        .update({ status: 'disabled' })
        .eq('code', code)
        .select()
        .single();

      if (error) throw new Error(`Failed to disable gift card: ${error.message}`);
      const transactions = await fetchTransactions(data.id as string);
      return mapGiftCardRow(data, transactions);
    },

    async listGiftCards(ventureId, status) {
      if (!supabase) return [];

      let query = supabase
        .from('gift_cards')
        .select()
        .eq('venture_id', ventureId)
        .order('created_at', { ascending: false });

      if (status) query = query.eq('status', status);

      const { data, error } = await query;
      if (error) throw new Error(`Failed to list gift cards: ${error.message}`);

      const cards: GiftCard[] = [];
      for (const row of data ?? []) {
        const transactions = await fetchTransactions(row.id as string);
        cards.push(mapGiftCardRow(row, transactions));
      }
      return cards;
    },

    async getGiftCardTransactions(giftCardId) {
      return fetchTransactions(giftCardId);
    },
  };

  return service;
}
