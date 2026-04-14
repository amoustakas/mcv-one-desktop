// Thin shim — canonical implementation lives in @mcv/ledger-sdk/service.
// Binds createLedgerService to the app's Supabase client and re-exports the
// historical function surface so consumers (payments, commerce, creator,
// stores) keep working without call-site changes.
import { createLedgerService } from '@mcv/ledger-sdk/service';
import { supabase } from '../supabase';

const service = createLedgerService({ supabase });

export const createAccount = service.createAccount;
export const getAccountByCode = service.getAccountByCode;
export const listAccounts = service.listAccounts;
export const provisionVentureAccounts = service.provisionVentureAccounts;
export const createJournalEntry = service.createJournalEntry;
export const postJournalEntry = service.postJournalEntry;
export const reverseJournalEntry = service.reverseJournalEntry;
export const getJournalEntry = service.getJournalEntry;
export const getTrialBalance = service.getTrialBalance;

export type { LedgerService } from '@mcv/ledger-sdk/service';
