// Thin shim — canonical implementation lives in @mcv/ledger-sdk/credit-service.
// Rebuilds the credit service on top of the app-bound ledger service so
// journal entries written by credit operations flow through the same
// instance.
import { createLedgerService } from '@mcv/ledger-sdk/service';
import { createCreditService } from '@mcv/ledger-sdk/credit-service';
import { supabase } from '../supabase';

const ledger = createLedgerService({ supabase });
const credit = createCreditService({ supabase, ledger });

export const createCreditAccount = credit.createCreditAccount;
export const getCreditBalance = credit.getCreditBalance;
export const grantCredits = credit.grantCredits;
export const consumeCredits = credit.consumeCredits;
export const transferCredits = credit.transferCredits;

export type { CreditService } from '@mcv/ledger-sdk/credit-service';
