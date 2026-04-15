// Thin shim — canonical implementation lives in @mcv/commerce-sdk/invoice-engine.
// Binds createInvoiceEngine to the app's Supabase + ledger service.
import {
  createInvoiceEngine,
  type LedgerAdapter,
} from '@mcv/commerce-sdk/invoice-engine';
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

const engine = createInvoiceEngine({ supabase, ledger });

export const createInvoice = engine.createInvoice;
export const sendInvoice = engine.sendInvoice;
export const recordPayment = engine.recordPayment;
export const voidInvoice = engine.voidInvoice;
export const getInvoice = engine.getInvoice;
export const listInvoices = engine.listInvoices;
export const getOverdueInvoices = engine.getOverdueInvoices;
export const addLineItem = engine.addLineItem;

export { mapInvoiceRow, mapLineItemRow } from '@mcv/commerce-sdk/invoice-engine';
export type { InvoiceEngine, ListInvoicesFilters } from '@mcv/commerce-sdk/invoice-engine';
