// src/lib/commerce/gift-card-service.ts
// Commerce Surface Layer — Gift Card Service
// Code generation, redemption, refunds, and double-entry ledger integration

import { nanoid } from 'nanoid';
import { supabase } from '../supabase';
import { grantCredits, consumeCredits } from '../ledger/credit-service';
import { createJournalEntry, postJournalEntry, getAccountByCode } from '../ledger/service';
import type { GiftCard, GiftCardTransaction, GiftCardStatus } from './surface-types';

// ─────────────────────────────────────────────────────────
// ROW MAPPERS
// ─────────────────────────────────────────────────────────

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

// ─────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────

function generateGiftCardCode(): string {
  // Format: GIFT-XXXX-XXXX-XXXX
  const segment = () => nanoid(4).toUpperCase().replace(/[^A-Z0-9]/g, '0').padEnd(4, '0').slice(0, 4);
  return `GIFT-${segment()}-${segment()}-${segment()}`;
}

async function fetchTransactions(giftCardId: string): Promise<GiftCardTransaction[]> {
  if (!supabase) return [];
  const { data } = await supabase
    .from('gift_card_transactions')
    .select()
    .eq('gift_card_id', giftCardId)
    .order('created_at', { ascending: true });
  return (data ?? []).map(mapTransactionRow);
}

// ─────────────────────────────────────────────────────────
// CREATE GIFT CARD
// DR: 1000 Cash (or AR) / CR: 2030 Unearned Revenue
// ─────────────────────────────────────────────────────────

export async function createGiftCard(
  ventureId: string,
  initialBalance: number,
  currency = 'USD',
  purchasedBy?: string | null,
  recipientEmail?: string | null,
  recipientMessage?: string | null,
): Promise<GiftCard> {
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

  // Insert initial purchase transaction
  await supabase.from('gift_card_transactions').insert({
    gift_card_id: giftCard.id,
    type: 'purchase',
    amount: initialBalance,
    order_id: null,
    balance_after: initialBalance,
    created_at: now,
  });

  // Create CreditAccount via grantCredits (uses gift card id as ownerId)
  await grantCredits({
    ventureId,
    ownerId: giftCard.id,
    amount: initialBalance,
    reason: `Gift card ${code} issued`,
    currency: currency.toLowerCase(),
  });

  // Double-entry ledger: DR 1000 Cash / CR 2030 Unearned Revenue
  const cashAccount = await getAccountByCode(ventureId, '1000');
  const unearnedRevenueAccount = await getAccountByCode(ventureId, '2030');

  if (cashAccount && unearnedRevenueAccount) {
    const entry = await createJournalEntry({
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
    await postJournalEntry(entry.id, 'system');
  }

  return { ...giftCard, transactions: await fetchTransactions(giftCard.id) };
}

// ─────────────────────────────────────────────────────────
// GET GIFT CARD
// ─────────────────────────────────────────────────────────

export async function getGiftCard(code: string): Promise<GiftCard | null> {
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
}

// ─────────────────────────────────────────────────────────
// GET GIFT CARD BALANCE
// ─────────────────────────────────────────────────────────

export async function getGiftCardBalance(code: string): Promise<number> {
  const card = await getGiftCard(code);
  if (!card) throw new Error(`Gift card not found: ${code}`);
  return card.currentBalance;
}

// ─────────────────────────────────────────────────────────
// REDEEM GIFT CARD
// ─────────────────────────────────────────────────────────

export async function redeemGiftCard(
  code: string,
  amount: number,
  orderId: string,
): Promise<GiftCard> {
  if (!supabase) throw new Error('Supabase client not available');
  if (amount <= 0) throw new Error('Redemption amount must be positive');

  const card = await getGiftCard(code);
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

  // Consume credits from ledger credit account
  await consumeCredits({
    ventureId: card.ventureId,
    ownerId: card.id,
    amount,
    reason: `Gift card redemption on order ${orderId}`,
    currency: card.currency.toLowerCase(),
  });

  const transactions = await fetchTransactions(card.id);
  return mapGiftCardRow(data, transactions);
}

// ─────────────────────────────────────────────────────────
// REFUND TO GIFT CARD
// ─────────────────────────────────────────────────────────

export async function refundToGiftCard(
  code: string,
  amount: number,
  orderId: string,
): Promise<GiftCard> {
  if (!supabase) throw new Error('Supabase client not available');
  if (amount <= 0) throw new Error('Refund amount must be positive');

  const card = await getGiftCard(code);
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

  // Re-grant credits
  await grantCredits({
    ventureId: card.ventureId,
    ownerId: card.id,
    amount,
    reason: `Gift card refund from order ${orderId}`,
    currency: card.currency.toLowerCase(),
  });

  const transactions = await fetchTransactions(card.id);
  return mapGiftCardRow(data, transactions);
}

// ─────────────────────────────────────────────────────────
// DISABLE GIFT CARD
// ─────────────────────────────────────────────────────────

export async function disableGiftCard(code: string): Promise<GiftCard> {
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
}

// ─────────────────────────────────────────────────────────
// LIST GIFT CARDS
// ─────────────────────────────────────────────────────────

export async function listGiftCards(
  ventureId: string,
  status?: GiftCardStatus,
): Promise<GiftCard[]> {
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
}

// ─────────────────────────────────────────────────────────
// GET GIFT CARD TRANSACTIONS
// ─────────────────────────────────────────────────────────

export async function getGiftCardTransactions(
  giftCardId: string,
): Promise<GiftCardTransaction[]> {
  return fetchTransactions(giftCardId);
}
