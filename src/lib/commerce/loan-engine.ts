// src/lib/commerce/loan-engine.ts
// Loan lifecycle engine — Tier 5 Commerce Layer
// Handles application → approval → disbursement → repayment → paid_off / defaulted

import { supabase } from '../supabase';
import {
  createJournalEntry,
  postJournalEntry,
  getAccountByCode,
} from '../ledger/service';
import type {
  Loan,
  LoanRepayment,
  LoanStatus,
  CreateLoanInput,
} from './types';

// ─────────────────────────────────────────────────────────
// ROW MAPPERS (snake_case → camelCase)
// ─────────────────────────────────────────────────────────

export function mapRepaymentRow(row: Record<string, unknown>): LoanRepayment {
  return {
    id: row.id as string,
    loanId: row.loan_id as string,
    amount: Number(row.amount),
    principalPortion: Number(row.principal_portion),
    interestPortion: Number(row.interest_portion),
    paymentDate: row.payment_date as string,
    status: row.status as LoanRepayment['status'],
  };
}

export function mapLoanRow(
  row: Record<string, unknown>,
  repayments: Record<string, unknown>[] = [],
): Loan {
  return {
    id: row.id as string,
    ventureId: row.venture_id as string,
    customerId: row.customer_id as string,
    productId: (row.product_id as string | null) ?? null,
    principal: Number(row.principal),
    interestRate: Number(row.interest_rate),
    interestType: row.interest_type as Loan['interestType'],
    termMonths: Number(row.term_months),
    status: row.status as LoanStatus,
    outstandingBalance: Number(row.outstanding_balance),
    nextPaymentDate: (row.next_payment_date as string | null) ?? null,
    disbursedAt: (row.disbursed_at as string | null) ?? null,
    repayments: repayments.map(mapRepaymentRow),
    metadata: (row.metadata as Record<string, unknown>) ?? {},
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

// ─────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────

async function fetchLoanWithRepayments(id: string): Promise<Loan> {
  if (!supabase) throw new Error('Supabase client not available');

  const { data: loan, error: loanErr } = await supabase
    .from('loans')
    .select()
    .eq('id', id)
    .single();

  if (loanErr) throw new Error(`Failed to fetch loan: ${loanErr.message}`);

  const { data: repayments, error: repErr } = await supabase
    .from('loan_repayments')
    .select()
    .eq('loan_id', id)
    .order('payment_date', { ascending: true });

  if (repErr) throw new Error(`Failed to fetch loan repayments: ${repErr.message}`);

  return mapLoanRow(loan, repayments ?? []);
}

async function requireAccount(ventureId: string, code: string): Promise<string> {
  const account = await getAccountByCode(ventureId, code);
  if (!account) throw new Error(`Ledger account ${code} not found for venture ${ventureId}`);
  return account.id;
}

/**
 * Calculate next payment date (first day of next month after disbursement,
 * or the same day-of-month each month).
 */
function nextMonthDate(from: Date): string {
  const d = new Date(from);
  d.setMonth(d.getMonth() + 1);
  return d.toISOString().split('T')[0];
}

// ─────────────────────────────────────────────────────────
// AMORTIZATION
// ─────────────────────────────────────────────────────────

export interface AmortizationRow {
  period: number;
  payment: number;
  principal: number;
  interest: number;
  remainingBalance: number;
}

/**
 * Calculate full amortization schedule.
 * For BNPL (interestRate === 0): equal principal installments.
 * For interest-bearing: standard amortization formula.
 */
export function calculateAmortization(
  principal: number,
  annualRate: number,
  termMonths: number,
): AmortizationRow[] {
  const schedule: AmortizationRow[] = [];
  let balance = principal;

  if (annualRate === 0) {
    // BNPL: equal installments
    const installment = principal / termMonths;
    for (let i = 1; i <= termMonths; i++) {
      const principalPortion = Math.min(installment, balance);
      balance = Math.max(0, balance - principalPortion);
      schedule.push({
        period: i,
        payment: principalPortion,
        principal: principalPortion,
        interest: 0,
        remainingBalance: balance,
      });
    }
    return schedule;
  }

  // Standard amortization: P * (r/12) / (1 - (1 + r/12)^(-n))
  const r = annualRate / 12;
  const monthlyPayment = (principal * r) / (1 - Math.pow(1 + r, -termMonths));

  for (let i = 1; i <= termMonths; i++) {
    const interestPortion = balance * r;
    const principalPortion = monthlyPayment - interestPortion;
    balance = Math.max(0, balance - principalPortion);

    schedule.push({
      period: i,
      payment: Number(monthlyPayment.toFixed(2)),
      principal: Number(principalPortion.toFixed(2)),
      interest: Number(interestPortion.toFixed(2)),
      remainingBalance: Number(balance.toFixed(2)),
    });
  }

  return schedule;
}

// ─────────────────────────────────────────────────────────
// CREATE LOAN
// ─────────────────────────────────────────────────────────

export async function createLoan(input: CreateLoanInput): Promise<Loan> {
  if (!supabase) throw new Error('Supabase client not available');

  const { data: loan, error } = await supabase
    .from('loans')
    .insert({
      venture_id: input.ventureId,
      customer_id: input.customerId,
      product_id: input.productId ?? null,
      principal: input.principal,
      interest_rate: input.interestRate,
      interest_type: input.interestType,
      term_months: input.termMonths,
      status: input.status ?? 'application',
      outstanding_balance: input.outstandingBalance ?? input.principal,
      next_payment_date: input.nextPaymentDate ?? null,
      disbursed_at: input.disbursedAt ?? null,
      metadata: input.metadata ?? {},
    })
    .select()
    .single();

  if (error) throw new Error(`Failed to create loan: ${error.message}`);

  return fetchLoanWithRepayments(loan.id);
}

// ─────────────────────────────────────────────────────────
// APPROVE LOAN
// ─────────────────────────────────────────────────────────

export async function approveLoan(id: string, ventureId: string): Promise<Loan> {
  if (!supabase) throw new Error('Supabase client not available');

  const { data: existing, error: fetchErr } = await supabase
    .from('loans')
    .select()
    .eq('id', id)
    .eq('venture_id', ventureId)
    .single();

  if (fetchErr) throw new Error(`Loan not found: ${fetchErr.message}`);
  if (existing.status !== 'application') {
    throw new Error(`Cannot approve loan with status "${existing.status}". Must be "application".`);
  }

  const { error } = await supabase
    .from('loans')
    .update({ status: 'approved', updated_at: new Date().toISOString() })
    .eq('id', id);

  if (error) throw new Error(`Failed to approve loan: ${error.message}`);

  return fetchLoanWithRepayments(id);
}

// ─────────────────────────────────────────────────────────
// DISBURSE LOAN
// ─────────────────────────────────────────────────────────

export async function disburseLoan(id: string, ventureId: string): Promise<Loan> {
  if (!supabase) throw new Error('Supabase client not available');

  const { data: existing, error: fetchErr } = await supabase
    .from('loans')
    .select()
    .eq('id', id)
    .eq('venture_id', ventureId)
    .single();

  if (fetchErr) throw new Error(`Loan not found: ${fetchErr.message}`);
  if (existing.status !== 'approved') {
    throw new Error(`Cannot disburse loan with status "${existing.status}". Must be "approved".`);
  }

  const now = new Date();
  const disbursedAt = now.toISOString();
  const nextPaymentDate = nextMonthDate(now);

  const { error: updateErr } = await supabase
    .from('loans')
    .update({
      status: 'disbursed',
      disbursed_at: disbursedAt,
      next_payment_date: nextPaymentDate,
      updated_at: disbursedAt,
    })
    .eq('id', id);

  if (updateErr) throw new Error(`Failed to disburse loan: ${updateErr.message}`);

  // Ledger: DR Loans Receivable (1070), CR Cash (1010)
  const loansReceivableId = await requireAccount(ventureId, '1070');
  const cashAccountId = await requireAccount(ventureId, '1010');
  const amount = Number(existing.principal);

  const entry = await createJournalEntry({
    ventureId,
    entryDate: disbursedAt,
    description: `Loan disbursed: ${id} — principal ${amount}`,
    sourceType: 'loan_disbursement',
    sourceId: id,
    lines: [
      {
        accountId: loansReceivableId,
        debitAmount: amount,
        creditAmount: 0,
        dimensions: { ventureId, customerId: existing.customer_id },
      },
      {
        accountId: cashAccountId,
        debitAmount: 0,
        creditAmount: amount,
        dimensions: { ventureId, customerId: existing.customer_id },
      },
    ],
  });

  await postJournalEntry(entry.id, 'system');

  return fetchLoanWithRepayments(id);
}

// ─────────────────────────────────────────────────────────
// RECORD REPAYMENT
// ─────────────────────────────────────────────────────────

export async function recordRepayment(
  loanId: string,
  ventureId: string,
  amount: number,
): Promise<Loan> {
  if (!supabase) throw new Error('Supabase client not available');

  const { data: existing, error: fetchErr } = await supabase
    .from('loans')
    .select()
    .eq('id', loanId)
    .eq('venture_id', ventureId)
    .single();

  if (fetchErr) throw new Error(`Loan not found: ${fetchErr.message}`);

  const repayableStatuses: LoanStatus[] = ['disbursed', 'repaying'];
  if (!repayableStatuses.includes(existing.status as LoanStatus)) {
    throw new Error(`Cannot record repayment for loan with status "${existing.status}".`);
  }

  if (amount <= 0) throw new Error('Repayment amount must be positive.');

  const outstandingBalance = Number(existing.outstanding_balance);
  const annualRate = Number(existing.interest_rate);
  const r = annualRate / 12;

  // Split into interest and principal portions
  let interestPortion: number;
  let principalPortion: number;

  if (annualRate === 0) {
    interestPortion = 0;
    principalPortion = Math.min(amount, outstandingBalance);
  } else {
    interestPortion = Number((outstandingBalance * r).toFixed(2));
    // Interest accrued cannot exceed the payment amount
    interestPortion = Math.min(interestPortion, amount);
    principalPortion = Math.min(amount - interestPortion, outstandingBalance);
  }

  const newBalance = Math.max(0, outstandingBalance - principalPortion);
  const now = new Date();
  const paymentDate = now.toISOString();
  const isFullyPaid = newBalance <= 0;
  const newStatus: LoanStatus = isFullyPaid ? 'paid_off' : 'repaying';

  // Insert repayment record
  const { error: repErr } = await supabase.from('loan_repayments').insert({
    loan_id: loanId,
    amount,
    principal_portion: principalPortion,
    interest_portion: interestPortion,
    payment_date: paymentDate,
    status: 'completed',
  });

  if (repErr) throw new Error(`Failed to insert repayment: ${repErr.message}`);

  // Update loan balance and status
  const nextPayment = isFullyPaid ? null : nextMonthDate(now);

  const { error: updateErr } = await supabase
    .from('loans')
    .update({
      outstanding_balance: newBalance,
      status: newStatus,
      next_payment_date: nextPayment,
      updated_at: paymentDate,
    })
    .eq('id', loanId);

  if (updateErr) throw new Error(`Failed to update loan after repayment: ${updateErr.message}`);

  // Ledger entries:
  // DR Cash (1010) for total amount
  // CR Loans Receivable (1070) for principal portion
  // CR Revenue-Interest (4080) for interest portion
  const cashAccountId = await requireAccount(ventureId, '1010');
  const loansReceivableId = await requireAccount(ventureId, '1070');

  const lines: Parameters<typeof createJournalEntry>[0]['lines'] = [
    {
      accountId: cashAccountId,
      debitAmount: amount,
      creditAmount: 0,
      dimensions: { ventureId, customerId: existing.customer_id },
    },
    {
      accountId: loansReceivableId,
      debitAmount: 0,
      creditAmount: principalPortion,
      dimensions: { ventureId, customerId: existing.customer_id },
    },
  ];

  if (interestPortion > 0) {
    const interestRevenueId = await requireAccount(ventureId, '4080');
    lines.push({
      accountId: interestRevenueId,
      debitAmount: 0,
      creditAmount: interestPortion,
      dimensions: { ventureId, customerId: existing.customer_id },
    });
  }

  const entry = await createJournalEntry({
    ventureId,
    entryDate: paymentDate,
    description: `Loan repayment: ${loanId} — principal ${principalPortion}, interest ${interestPortion}`,
    sourceType: 'loan_repayment',
    sourceId: loanId,
    lines,
  });

  await postJournalEntry(entry.id, 'system');

  return fetchLoanWithRepayments(loanId);
}

// ─────────────────────────────────────────────────────────
// GET LOAN
// ─────────────────────────────────────────────────────────

export async function getLoan(id: string, ventureId: string): Promise<Loan | null> {
  if (!supabase) return null;

  const { data: loan, error } = await supabase
    .from('loans')
    .select()
    .eq('id', id)
    .eq('venture_id', ventureId)
    .single();

  if (error?.code === 'PGRST116') return null;
  if (error) throw new Error(`Failed to get loan: ${error.message}`);

  const { data: repayments, error: repErr } = await supabase
    .from('loan_repayments')
    .select()
    .eq('loan_id', id)
    .order('payment_date', { ascending: true });

  if (repErr) throw new Error(`Failed to get loan repayments: ${repErr.message}`);

  return mapLoanRow(loan, repayments ?? []);
}

// ─────────────────────────────────────────────────────────
// LIST LOANS
// ─────────────────────────────────────────────────────────

export async function listLoans(
  ventureId: string,
  filters?: {
    status?: LoanStatus;
    customerId?: string;
    page?: number;
    pageSize?: number;
  },
): Promise<{ loans: Loan[]; total: number; page: number; pageSize: number }> {
  if (!supabase) return { loans: [], total: 0, page: 1, pageSize: 20 };

  const page = filters?.page ?? 1;
  const pageSize = filters?.pageSize ?? 20;
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = supabase
    .from('loans')
    .select('*', { count: 'exact' })
    .eq('venture_id', ventureId)
    .order('created_at', { ascending: false })
    .range(from, to);

  if (filters?.status) query = query.eq('status', filters.status);
  if (filters?.customerId) query = query.eq('customer_id', filters.customerId);

  const { data, error, count } = await query;

  if (error) throw new Error(`Failed to list loans: ${error.message}`);

  const ids = (data ?? []).map((r: Record<string, unknown>) => r.id as string);
  let repaymentsMap: Record<string, Record<string, unknown>[]> = {};

  if (ids.length > 0) {
    const { data: allRepayments, error: repErr } = await supabase
      .from('loan_repayments')
      .select()
      .in('loan_id', ids)
      .order('payment_date', { ascending: true });

    if (repErr) throw new Error(`Failed to fetch repayments: ${repErr.message}`);

    repaymentsMap = (allRepayments ?? []).reduce(
      (acc: Record<string, Record<string, unknown>[]>, rep: Record<string, unknown>) => {
        const lid = rep.loan_id as string;
        if (!acc[lid]) acc[lid] = [];
        acc[lid].push(rep);
        return acc;
      },
      {},
    );
  }

  const loans = (data ?? []).map((row: Record<string, unknown>) =>
    mapLoanRow(row, repaymentsMap[row.id as string] ?? []),
  );

  return { loans, total: count ?? 0, page, pageSize };
}

// ─────────────────────────────────────────────────────────
// GET REPAYMENT SCHEDULE
// ─────────────────────────────────────────────────────────

export async function getRepaymentSchedule(loanId: string): Promise<AmortizationRow[]> {
  if (!supabase) return [];

  const { data: loan, error } = await supabase
    .from('loans')
    .select('principal, interest_rate, term_months')
    .eq('id', loanId)
    .single();

  if (error?.code === 'PGRST116') return [];
  if (error) throw new Error(`Failed to get loan for schedule: ${error.message}`);

  return calculateAmortization(
    Number(loan.principal),
    Number(loan.interest_rate),
    Number(loan.term_months),
  );
}

// ─────────────────────────────────────────────────────────
// DEFAULT LOAN
// ─────────────────────────────────────────────────────────

export async function defaultLoan(id: string, ventureId: string): Promise<Loan> {
  if (!supabase) throw new Error('Supabase client not available');

  const { data: existing, error: fetchErr } = await supabase
    .from('loans')
    .select()
    .eq('id', id)
    .eq('venture_id', ventureId)
    .single();

  if (fetchErr) throw new Error(`Loan not found: ${fetchErr.message}`);

  const defaultableStatuses: LoanStatus[] = ['disbursed', 'repaying'];
  if (!defaultableStatuses.includes(existing.status as LoanStatus)) {
    throw new Error(`Cannot default loan with status "${existing.status}".`);
  }

  const now = new Date().toISOString();

  const { error: updateErr } = await supabase
    .from('loans')
    .update({ status: 'defaulted', updated_at: now })
    .eq('id', id);

  if (updateErr) throw new Error(`Failed to default loan: ${updateErr.message}`);

  // Write-off ledger entry:
  // DR Loan Write-offs (5060), CR Loans Receivable (1070)
  const writeOffAccountId = await requireAccount(ventureId, '5060');
  const loansReceivableId = await requireAccount(ventureId, '1070');
  const outstandingBalance = Number(existing.outstanding_balance);

  const entry = await createJournalEntry({
    ventureId,
    entryDate: now,
    description: `Loan write-off (default): ${id} — balance ${outstandingBalance}`,
    sourceType: 'loan_default',
    sourceId: id,
    lines: [
      {
        accountId: writeOffAccountId,
        debitAmount: outstandingBalance,
        creditAmount: 0,
        dimensions: { ventureId, customerId: existing.customer_id },
      },
      {
        accountId: loansReceivableId,
        debitAmount: 0,
        creditAmount: outstandingBalance,
        dimensions: { ventureId, customerId: existing.customer_id },
      },
    ],
  });

  await postJournalEntry(entry.id, 'system');

  return fetchLoanWithRepayments(id);
}
