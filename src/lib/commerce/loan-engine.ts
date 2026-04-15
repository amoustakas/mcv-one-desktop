// Thin shim — canonical implementation lives in @mcv/commerce-sdk/loan-engine.
// Binds createLoanEngine to the app's Supabase + ledger service.
import {
  createLoanEngine,
  type LedgerAdapter,
} from '@mcv/commerce-sdk/loan-engine';
import { supabase } from '../supabase';
import {
  createJournalEntry as svcCreateJournalEntry,
  postJournalEntry as svcPostJournalEntry,
  getAccountByCode as svcGetAccountByCode,
} from '../ledger/service';

const ledger: LedgerAdapter = {
  getAccountByCode: (ventureId, code) => svcGetAccountByCode(ventureId, code),
  createJournalEntry: (input) => svcCreateJournalEntry(input),
  postJournalEntry: (entryId, postedBy) => svcPostJournalEntry(entryId, postedBy),
};

const engine = createLoanEngine({ supabase, ledger });

export const createLoan = engine.createLoan;
export const approveLoan = engine.approveLoan;
export const disburseLoan = engine.disburseLoan;
export const recordRepayment = engine.recordRepayment;
export const defaultLoan = engine.defaultLoan;
export const getLoan = engine.getLoan;
export const listLoans = engine.listLoans;
export const getRepaymentSchedule = engine.getRepaymentSchedule;

export { calculateAmortization, mapLoanRow, mapRepaymentRow } from '@mcv/commerce-sdk/loan-engine';
export type {
  LoanEngine,
  ListLoansFilters,
  AmortizationRow,
} from '@mcv/commerce-sdk/loan-engine';
