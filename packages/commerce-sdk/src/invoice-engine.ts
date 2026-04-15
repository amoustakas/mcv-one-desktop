// @mcv/commerce-sdk/invoice-engine — invoice lifecycle + double-entry
// ledger integration.
//
// 8 methods behind createInvoiceEngine({ supabase, ledger }) plus two
// pure row mappers exported top-level.
//
// Lifecycle + accounting:
//   createInvoice        draft row + line items; invoice_number set by
//                        DB trigger
//   sendInvoice          draft → sent + DR 1025 AR / CR 4020 Revenue
//   recordPayment        sent/viewed/partial/overdue → paid/partial;
//                        DR 1010 Cash / CR 1025 AR per payment
//   voidInvoice          any pre-paid → voided; if already sent, fires
//                        a reversal (DR Revenue / CR AR)
//   addLineItem          draft-only; recalcs subtotal/tax/total/due
//
// Plus getInvoice / listInvoices (with line-items hydrated in one
// sweep) / getOverdueInvoices.

import type { SupabaseClient } from '@supabase/supabase-js';
import type {
  Invoice,
  InvoiceLineItem,
  CreateInvoiceInput,
  InvoiceStatus,
} from './types';

// ─── Adapter (same 3-method shape as the other ledger-backed factories) ─

export interface LedgerAccountRef { id: string }
export interface LedgerJournalEntryRef { id: string }

export interface LedgerJournalEntryInput {
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
}

export interface LedgerAdapter {
  getAccountByCode(ventureId: string, code: string): Promise<LedgerAccountRef | null>;
  createJournalEntry(input: LedgerJournalEntryInput): Promise<LedgerJournalEntryRef>;
  postJournalEntry(entryId: string, postedBy: string): Promise<unknown>;
}

// ─── Row mappers (exported top-level for external hydration) ────────────

export function mapLineItemRow(row: Record<string, unknown>): InvoiceLineItem {
  return {
    id: row.id as string,
    invoiceId: row.invoice_id as string,
    description: row.description as string,
    quantity: Number(row.quantity),
    unitPrice: Number(row.unit_price),
    total: Number(row.total),
    productId: (row.product_id as string | null) ?? null,
    taxAmount: Number(row.tax_amount ?? 0),
  };
}

export function mapInvoiceRow(
  row: Record<string, unknown>,
  lineItems: Record<string, unknown>[] = [],
): Invoice {
  return {
    id: row.id as string,
    ventureId: row.venture_id as string,
    customerId: row.customer_id as string,
    invoiceNumber: row.invoice_number as string,
    status: row.status as InvoiceStatus,
    subtotal: Number(row.subtotal),
    tax: Number(row.tax ?? 0),
    discountAmount: Number(row.discount_amount ?? 0),
    total: Number(row.total),
    amountDue: Number(row.amount_due),
    amountPaid: Number(row.amount_paid ?? 0),
    dueDate: row.due_date as string,
    paymentTerms: row.payment_terms as Invoice['paymentTerms'],
    lineItems: lineItems.map(mapLineItemRow),
    sentAt: (row.sent_at as string | null) ?? null,
    viewedAt: (row.viewed_at as string | null) ?? null,
    paidAt: (row.paid_at as string | null) ?? null,
    metadata: (row.metadata as Record<string, unknown>) ?? {},
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

// ─── Engine interface ──────────────────────────────────────────────────

export interface ListInvoicesFilters {
  status?: InvoiceStatus;
  customerId?: string;
  page?: number;
  pageSize?: number;
}

export interface InvoiceEngine {
  createInvoice(input: CreateInvoiceInput): Promise<Invoice>;
  sendInvoice(id: string, ventureId: string): Promise<Invoice>;
  recordPayment(id: string, ventureId: string, amount: number): Promise<Invoice>;
  voidInvoice(id: string, ventureId: string): Promise<Invoice>;
  getInvoice(id: string, ventureId: string): Promise<Invoice | null>;
  listInvoices(
    ventureId: string,
    filters?: ListInvoicesFilters,
  ): Promise<{ invoices: Invoice[]; total: number; page: number; pageSize: number }>;
  getOverdueInvoices(ventureId: string): Promise<Invoice[]>;
  addLineItem(
    invoiceId: string,
    item: {
      description: string;
      quantity: number;
      unitPrice: number;
      productId?: string | null;
      taxAmount?: number;
    },
  ): Promise<Invoice>;
}

export interface InvoiceEngineOptions {
  supabase: SupabaseClient | null;
  ledger: LedgerAdapter;
}

// ─── Factory ───────────────────────────────────────────────────────────

export function createInvoiceEngine({ supabase, ledger }: InvoiceEngineOptions): InvoiceEngine {
  async function fetchInvoiceWithLines(id: string): Promise<Invoice> {
    if (!supabase) throw new Error('Supabase client not available');

    const { data: inv, error: invErr } = await supabase
      .from('invoices')
      .select()
      .eq('id', id)
      .single();

    if (invErr) throw new Error(`Failed to fetch invoice: ${invErr.message}`);

    const { data: lines, error: linesErr } = await supabase
      .from('invoice_line_items')
      .select()
      .eq('invoice_id', id)
      .order('created_at', { ascending: true });

    if (linesErr) throw new Error(`Failed to fetch invoice line items: ${linesErr.message}`);

    return mapInvoiceRow(inv, lines ?? []);
  }

  async function requireAccount(ventureId: string, code: string): Promise<string> {
    const account = await ledger.getAccountByCode(ventureId, code);
    if (!account) throw new Error(`Ledger account ${code} not found for venture ${ventureId}`);
    return account.id;
  }

  const engine: InvoiceEngine = {
    async createInvoice(input) {
      if (!supabase) throw new Error('Supabase client not available');

      const validated = input;

      const { data: inv, error: invErr } = await supabase
        .from('invoices')
        .insert({
          venture_id: validated.ventureId,
          customer_id: validated.customerId,
          invoice_number: 'TEMP', // overwritten by DB trigger
          status: validated.status ?? 'draft',
          subtotal: validated.subtotal,
          tax: validated.tax ?? 0,
          discount_amount: validated.discountAmount ?? 0,
          total: validated.total,
          amount_due: validated.amountDue,
          amount_paid: validated.amountPaid ?? 0,
          due_date: validated.dueDate,
          payment_terms: validated.paymentTerms,
          sent_at: validated.sentAt ?? null,
          viewed_at: validated.viewedAt ?? null,
          paid_at: validated.paidAt ?? null,
          metadata: validated.metadata ?? {},
        })
        .select()
        .single();

      if (invErr) throw new Error(`Failed to create invoice: ${invErr.message}`);

      if (validated.lineItems.length > 0) {
        const lineRows = validated.lineItems.map((item) => ({
          invoice_id: inv.id,
          description: item.description,
          quantity: item.quantity,
          unit_price: item.unitPrice,
          total: item.total,
          product_id: item.productId ?? null,
          tax_amount: item.taxAmount ?? 0,
        }));

        const { error: linesErr } = await supabase
          .from('invoice_line_items')
          .insert(lineRows);

        if (linesErr) throw new Error(`Failed to create invoice line items: ${linesErr.message}`);
      }

      return fetchInvoiceWithLines(inv.id);
    },

    async sendInvoice(id, ventureId) {
      if (!supabase) throw new Error('Supabase client not available');

      const { data: existing, error: fetchErr } = await supabase
        .from('invoices')
        .select()
        .eq('id', id)
        .eq('venture_id', ventureId)
        .single();

      if (fetchErr) throw new Error(`Invoice not found: ${fetchErr.message}`);
      if (existing.status !== 'draft') {
        throw new Error(`Cannot send invoice with status "${existing.status}". Must be "draft".`);
      }

      const sentAt = new Date().toISOString();

      const { error: updateErr } = await supabase
        .from('invoices')
        .update({ status: 'sent', sent_at: sentAt, updated_at: sentAt })
        .eq('id', id);

      if (updateErr) throw new Error(`Failed to send invoice: ${updateErr.message}`);

      // Revenue recognition: DR 1025 AR - Invoiced / CR 4020 Revenue.
      const arAccountId = await requireAccount(ventureId, '1025');
      const revenueAccountId = await requireAccount(ventureId, '4020');
      const amount = Number(existing.total);

      const entry = await ledger.createJournalEntry({
        ventureId,
        entryDate: sentAt,
        description: `Invoice sent: ${existing.invoice_number}`,
        sourceType: 'invoice',
        sourceId: id,
        lines: [
          {
            accountId: arAccountId,
            debitAmount: amount,
            creditAmount: 0,
            dimensions: { ventureId, customerId: existing.customer_id },
          },
          {
            accountId: revenueAccountId,
            debitAmount: 0,
            creditAmount: amount,
            dimensions: { ventureId, customerId: existing.customer_id },
          },
        ],
      });

      await ledger.postJournalEntry(entry.id, 'system');

      return fetchInvoiceWithLines(id);
    },

    async recordPayment(id, ventureId, amount) {
      if (!supabase) throw new Error('Supabase client not available');

      const { data: existing, error: fetchErr } = await supabase
        .from('invoices')
        .select()
        .eq('id', id)
        .eq('venture_id', ventureId)
        .single();

      if (fetchErr) throw new Error(`Invoice not found: ${fetchErr.message}`);

      const allowedStatuses: InvoiceStatus[] = ['sent', 'viewed', 'partial', 'overdue'];
      if (!allowedStatuses.includes(existing.status as InvoiceStatus)) {
        throw new Error(`Cannot record payment for invoice with status "${existing.status}".`);
      }

      if (amount <= 0) throw new Error('Payment amount must be positive.');

      const currentAmountPaid = Number(existing.amount_paid ?? 0);
      const currentAmountDue = Number(existing.amount_due);

      const newAmountPaid = currentAmountPaid + amount;
      const newAmountDue = Math.max(0, currentAmountDue - amount);
      const now = new Date().toISOString();

      const isFullyPaid = newAmountDue <= 0;
      const newStatus: InvoiceStatus = isFullyPaid ? 'paid' : 'partial';

      const { error: updateErr } = await supabase
        .from('invoices')
        .update({
          amount_paid: newAmountPaid,
          amount_due: newAmountDue,
          status: newStatus,
          paid_at: isFullyPaid ? now : null,
          updated_at: now,
        })
        .eq('id', id);

      if (updateErr) throw new Error(`Failed to record payment: ${updateErr.message}`);

      // Payment settlement: DR 1010 Cash / CR 1025 AR.
      const cashAccountId = await requireAccount(ventureId, '1010');
      const arAccountId = await requireAccount(ventureId, '1025');

      const entry = await ledger.createJournalEntry({
        ventureId,
        entryDate: now,
        description: `Payment received on invoice ${existing.invoice_number}: ${amount}`,
        sourceType: 'invoice_payment',
        sourceId: id,
        lines: [
          {
            accountId: cashAccountId,
            debitAmount: amount,
            creditAmount: 0,
            dimensions: { ventureId, customerId: existing.customer_id },
          },
          {
            accountId: arAccountId,
            debitAmount: 0,
            creditAmount: amount,
            dimensions: { ventureId, customerId: existing.customer_id },
          },
        ],
      });

      await ledger.postJournalEntry(entry.id, 'system');

      return fetchInvoiceWithLines(id);
    },

    async voidInvoice(id, ventureId) {
      if (!supabase) throw new Error('Supabase client not available');

      const { data: existing, error: fetchErr } = await supabase
        .from('invoices')
        .select()
        .eq('id', id)
        .eq('venture_id', ventureId)
        .single();

      if (fetchErr) throw new Error(`Invoice not found: ${fetchErr.message}`);

      const voidableStatuses: InvoiceStatus[] = ['draft', 'sent', 'viewed', 'partial', 'overdue'];
      if (!voidableStatuses.includes(existing.status as InvoiceStatus)) {
        throw new Error(`Cannot void invoice with status "${existing.status}".`);
      }

      const now = new Date().toISOString();

      const { error: updateErr } = await supabase
        .from('invoices')
        .update({ status: 'voided', updated_at: now })
        .eq('id', id);

      if (updateErr) throw new Error(`Failed to void invoice: ${updateErr.message}`);

      // Only fire a reversal if AR was previously debited (i.e. invoice
      // had been sent). Draft voids have no journal to reverse.
      const wasSent: InvoiceStatus[] = ['sent', 'viewed', 'partial', 'overdue'];
      if (wasSent.includes(existing.status as InvoiceStatus)) {
        const arAccountId = await requireAccount(ventureId, '1025');
        const revenueAccountId = await requireAccount(ventureId, '4020');
        const amount = Number(existing.total);

        // Reversal: DR 4020 Revenue / CR 1025 AR.
        const entry = await ledger.createJournalEntry({
          ventureId,
          entryDate: now,
          description: `Void reversal for invoice ${existing.invoice_number}`,
          sourceType: 'invoice_void',
          sourceId: id,
          lines: [
            {
              accountId: revenueAccountId,
              debitAmount: amount,
              creditAmount: 0,
              dimensions: { ventureId, customerId: existing.customer_id },
            },
            {
              accountId: arAccountId,
              debitAmount: 0,
              creditAmount: amount,
              dimensions: { ventureId, customerId: existing.customer_id },
            },
          ],
        });

        await ledger.postJournalEntry(entry.id, 'system');
      }

      return fetchInvoiceWithLines(id);
    },

    async getInvoice(id, ventureId) {
      if (!supabase) return null;

      const { data: inv, error } = await supabase
        .from('invoices')
        .select()
        .eq('id', id)
        .eq('venture_id', ventureId)
        .single();

      if (error?.code === 'PGRST116') return null;
      if (error) throw new Error(`Failed to get invoice: ${error.message}`);

      const { data: lines, error: linesErr } = await supabase
        .from('invoice_line_items')
        .select()
        .eq('invoice_id', id)
        .order('created_at', { ascending: true });

      if (linesErr) throw new Error(`Failed to get invoice line items: ${linesErr.message}`);

      return mapInvoiceRow(inv, lines ?? []);
    },

    async listInvoices(ventureId, filters) {
      if (!supabase) return { invoices: [], total: 0, page: 1, pageSize: 20 };

      const page = filters?.page ?? 1;
      const pageSize = filters?.pageSize ?? 20;
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;

      let query = supabase
        .from('invoices')
        .select('*', { count: 'exact' })
        .eq('venture_id', ventureId)
        .order('created_at', { ascending: false })
        .range(from, to);

      if (filters?.status) query = query.eq('status', filters.status);
      if (filters?.customerId) query = query.eq('customer_id', filters.customerId);

      const { data, error, count } = await query;
      if (error) throw new Error(`Failed to list invoices: ${error.message}`);

      // Hydrate all line items in one query rather than N+1.
      const ids = (data ?? []).map((r: Record<string, unknown>) => r.id as string);
      let lineItemsMap: Record<string, Record<string, unknown>[]> = {};

      if (ids.length > 0) {
        const { data: allLines, error: linesErr } = await supabase
          .from('invoice_line_items')
          .select()
          .in('invoice_id', ids);

        if (linesErr) throw new Error(`Failed to fetch line items: ${linesErr.message}`);

        lineItemsMap = (allLines ?? []).reduce(
          (acc: Record<string, Record<string, unknown>[]>, line: Record<string, unknown>) => {
            const iid = line.invoice_id as string;
            if (!acc[iid]) acc[iid] = [];
            acc[iid].push(line);
            return acc;
          },
          {},
        );
      }

      const invoices = (data ?? []).map((row: Record<string, unknown>) =>
        mapInvoiceRow(row, lineItemsMap[row.id as string] ?? []),
      );

      return { invoices, total: count ?? 0, page, pageSize };
    },

    async getOverdueInvoices(ventureId) {
      if (!supabase) return [];

      const now = new Date().toISOString().split('T')[0];

      const { data, error } = await supabase
        .from('invoices')
        .select()
        .eq('venture_id', ventureId)
        .eq('status', 'sent')
        .lt('due_date', now)
        .order('due_date', { ascending: true });

      if (error) throw new Error(`Failed to get overdue invoices: ${error.message}`);

      const ids = (data ?? []).map((r: Record<string, unknown>) => r.id as string);
      if (ids.length === 0) return [];

      const { data: allLines, error: linesErr } = await supabase
        .from('invoice_line_items')
        .select()
        .in('invoice_id', ids);

      if (linesErr) throw new Error(`Failed to fetch overdue invoice line items: ${linesErr.message}`);

      const lineItemsMap = (allLines ?? []).reduce(
        (acc: Record<string, Record<string, unknown>[]>, line: Record<string, unknown>) => {
          const iid = line.invoice_id as string;
          if (!acc[iid]) acc[iid] = [];
          acc[iid].push(line);
          return acc;
        },
        {},
      );

      return (data ?? []).map((row: Record<string, unknown>) =>
        mapInvoiceRow(row, lineItemsMap[row.id as string] ?? []),
      );
    },

    async addLineItem(invoiceId, item) {
      if (!supabase) throw new Error('Supabase client not available');

      const { data: existing, error: fetchErr } = await supabase
        .from('invoices')
        .select()
        .eq('id', invoiceId)
        .single();

      if (fetchErr) throw new Error(`Invoice not found: ${fetchErr.message}`);
      if (existing.status !== 'draft') {
        throw new Error(`Cannot add line items to invoice with status "${existing.status}". Must be "draft".`);
      }

      const itemTotal = item.quantity * item.unitPrice;
      const taxAmount = item.taxAmount ?? 0;

      const { error: insertErr } = await supabase.from('invoice_line_items').insert({
        invoice_id: invoiceId,
        description: item.description,
        quantity: item.quantity,
        unit_price: item.unitPrice,
        total: itemTotal,
        product_id: item.productId ?? null,
        tax_amount: taxAmount,
      });

      if (insertErr) throw new Error(`Failed to add line item: ${insertErr.message}`);

      // Recalculate rollups from the full line set.
      const { data: allLines, error: linesErr } = await supabase
        .from('invoice_line_items')
        .select()
        .eq('invoice_id', invoiceId);

      if (linesErr) throw new Error(`Failed to recalculate totals: ${linesErr.message}`);

      const subtotal = (allLines ?? []).reduce(
        (sum: number, l: Record<string, unknown>) => sum + Number(l.total),
        0,
      );
      const totalTax = (allLines ?? []).reduce(
        (sum: number, l: Record<string, unknown>) => sum + Number(l.tax_amount ?? 0),
        0,
      );
      const discount = Number(existing.discount_amount ?? 0);
      const total = subtotal + totalTax - discount;
      const amountDue = total - Number(existing.amount_paid ?? 0);
      const now = new Date().toISOString();

      const { error: updateErr } = await supabase
        .from('invoices')
        .update({
          subtotal,
          tax: totalTax,
          total,
          amount_due: Math.max(0, amountDue),
          updated_at: now,
        })
        .eq('id', invoiceId);

      if (updateErr) throw new Error(`Failed to update invoice totals: ${updateErr.message}`);

      return fetchInvoiceWithLines(invoiceId);
    },
  };

  return engine;
}
