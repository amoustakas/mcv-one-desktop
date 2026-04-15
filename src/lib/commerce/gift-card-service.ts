// Thin shim — canonical implementation lives in @mcv/commerce-sdk/gift-card-service.
// Binds createGiftCardService to the app's Supabase, the ledger service,
// and the credit service (for grant/consume flows).
import {
  createGiftCardService,
  type LedgerAdapter,
  type CreditAdapter,
} from '@mcv/commerce-sdk/gift-card-service';
import { supabase } from '../supabase';
import {
  createJournalEntry as svcCreateJournalEntry,
  postJournalEntry as svcPostJournalEntry,
  getAccountByCode as svcGetAccountByCode,
} from '../ledger/service';
import {
  grantCredits as creditGrant,
  consumeCredits as creditConsume,
} from '../ledger/credit-service';

const ledger: LedgerAdapter = {
  getAccountByCode: (ventureId, code) => svcGetAccountByCode(ventureId, code),
  createJournalEntry: (input) => svcCreateJournalEntry(input),
  postJournalEntry: (entryId, postedBy) => svcPostJournalEntry(entryId, postedBy),
};

const credit: CreditAdapter = {
  grantCredits: (input) => creditGrant(input),
  consumeCredits: (input) => creditConsume(input),
};

const service = createGiftCardService({ supabase, ledger, credit });

export const createGiftCard = service.createGiftCard;
export const getGiftCard = service.getGiftCard;
export const getGiftCardBalance = service.getGiftCardBalance;
export const redeemGiftCard = service.redeemGiftCard;
export const refundToGiftCard = service.refundToGiftCard;
export const disableGiftCard = service.disableGiftCard;
export const listGiftCards = service.listGiftCards;
export const getGiftCardTransactions = service.getGiftCardTransactions;

export type { GiftCardService } from '@mcv/commerce-sdk/gift-card-service';
