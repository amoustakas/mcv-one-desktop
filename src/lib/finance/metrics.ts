// src/lib/finance/metrics.ts
// Real-Time Metrics Engine — MRR, ARR, Churn, Burn Rate, Runway, AR Aging, etc.

import { supabase } from '../supabase';
import type { RealTimeMetrics, ArAging } from './types';

// ─────────────────────────────────────────────────────────
// DATE HELPERS
// ─────────────────────────────────────────────────────────

function daysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString();
}

export function startOfMonthsAgo(n: number): string {
  const d = new Date();
  d.setMonth(d.getMonth() - n, 1);
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
}

function now(): string {
  return new Date().toISOString();
}

// ─────────────────────────────────────────────────────────
// REVENUE SUM HELPER
// Sums credit_amount - debit_amount on posted 4xxx accounts for a venture
// over a given period.
// ─────────────────────────────────────────────────────────

async function sumRevenueForPeriod(ventureId: string, since: string): Promise<number> {
  if (!supabase) return 0;

  const { data } = await supabase
    .from('journal_entry_lines')
    .select(`
      debit_amount,
      credit_amount,
      ledger_accounts!inner(code, venture_id),
      journal_entries!inner(status, entry_date, venture_id)
    `)
    .eq('journal_entries.status', 'posted')
    .eq('journal_entries.venture_id', ventureId)
    .gte('journal_entries.entry_date', since)
    .gte('ledger_accounts.code', '4000')
    .lte('ledger_accounts.code', '4999');

  if (!data) return 0;

  return (data as Array<{ debit_amount: number; credit_amount: number }>).reduce(
    (sum, line) => sum + ((line.credit_amount ?? 0) - (line.debit_amount ?? 0)),
    0,
  );
}

// ─────────────────────────────────────────────────────────
// EXPENSE SUM HELPER
// Sums debit_amount - credit_amount on posted 5xxx+6xxx accounts
// ─────────────────────────────────────────────────────────

async function sumExpensesForPeriod(ventureId: string, since: string): Promise<number> {
  if (!supabase) return 0;

  const { data } = await supabase
    .from('journal_entry_lines')
    .select(`
      debit_amount,
      credit_amount,
      ledger_accounts!inner(code, venture_id),
      journal_entries!inner(status, entry_date, venture_id)
    `)
    .eq('journal_entries.status', 'posted')
    .eq('journal_entries.venture_id', ventureId)
    .gte('journal_entries.entry_date', since)
    .gte('ledger_accounts.code', '5000')
    .lte('ledger_accounts.code', '6999');

  if (!data) return 0;

  return (data as Array<{ debit_amount: number; credit_amount: number }>).reduce(
    (sum, line) => sum + ((line.debit_amount ?? 0) - (line.credit_amount ?? 0)),
    0,
  );
}

// ─────────────────────────────────────────────────────────
// GET REAL-TIME METRICS
// ─────────────────────────────────────────────────────────

export async function getRealTimeMetrics(ventureId: string): Promise<RealTimeMetrics> {
  if (!supabase) {
    return buildEmptyMetrics(ventureId);
  }

  // ── All independent queries run in parallel ──────────────────────────────

  const [
    subscriptionData,
    canceledData,
    startPeriodSubData,
    creditAccountData,
    loanData,
    routingData,
    cashAccountData,
    expensesLast30d,
    revenue24h,
    revenue7d,
    revenue30d,
    revenuePrev30d,
    invoiceData,
    revenueByRailData,
    revenueByProductData,
  ] = await Promise.all([

    // 1. Active subscriptions with plan pricing
    supabase
      .from('subscriptions')
      .select('id, status, quantity, plans(price, interval, interval_count)')
      .eq('venture_id', ventureId)
      .in('status', ['active', 'trialing']),

    // 2. Subscriptions canceled in last 30d
    supabase
      .from('subscriptions')
      .select('id')
      .eq('venture_id', ventureId)
      .eq('status', 'canceled')
      .gte('updated_at', daysAgo(30)),

    // 3. Subscriptions active at start of 30d period (for churn denominator)
    supabase
      .from('subscriptions')
      .select('id')
      .eq('venture_id', ventureId)
      .in('status', ['active', 'trialing', 'canceled'])
      .lte('created_at', daysAgo(30)),

    // 4. Outstanding credits (credit_accounts)
    supabase
      .from('credit_accounts')
      .select('balance')
      .eq('venture_id', ventureId),

    // 5. Outstanding loans
    supabase
      .from('loans')
      .select('outstanding_balance')
      .eq('venture_id', ventureId)
      .in('status', ['disbursed', 'repaying']),

    // 6. Smart routing savings last 30d (from routing_decisions if available)
    supabase
      .from('routing_decisions')
      .select('savings_vs_default, estimated_fee_total_fee')
      .eq('venture_id', ventureId)
      .gte('created_at', daysAgo(30))
      .limit(10000),

    // 7. Cash account balances (1010–1015)
    supabase
      .from('ledger_accounts')
      .select('current_balance')
      .eq('venture_id', ventureId)
      .gte('code', '1010')
      .lte('code', '1015'),

    // 8. Expenses last 30d (for burn rate)
    sumExpensesForPeriod(ventureId, daysAgo(30)),

    // 9. Net revenue 24h
    sumRevenueForPeriod(ventureId, daysAgo(1)),

    // 10. Net revenue 7d
    sumRevenueForPeriod(ventureId, daysAgo(7)),

    // 11. Net revenue 30d
    sumRevenueForPeriod(ventureId, daysAgo(30)),

    // 12. Net revenue prior 30d (for MoM growth)
    sumRevenueForPeriod(ventureId, daysAgo(60)),

    // 13. Invoice AR aging
    supabase
      .from('invoices')
      .select('amount_due, amount_paid, due_date, status')
      .eq('venture_id', ventureId)
      .in('status', ['sent', 'viewed', 'partial', 'overdue']),

    // 14. Revenue by rail (from journal_entry_lines dimensions)
    supabase
      .from('journal_entry_lines')
      .select(`
        credit_amount,
        debit_amount,
        dim_rail,
        ledger_accounts!inner(code, venture_id),
        journal_entries!inner(status, entry_date, venture_id)
      `)
      .eq('journal_entries.status', 'posted')
      .eq('journal_entries.venture_id', ventureId)
      .gte('journal_entries.entry_date', daysAgo(30))
      .gte('ledger_accounts.code', '4000')
      .lte('ledger_accounts.code', '4999')
      .not('dim_rail', 'is', null),

    // 15. Revenue by product type (from journal_entry_lines account code)
    supabase
      .from('journal_entry_lines')
      .select(`
        credit_amount,
        debit_amount,
        ledger_accounts!inner(code, name, venture_id),
        journal_entries!inner(status, entry_date, venture_id)
      `)
      .eq('journal_entries.status', 'posted')
      .eq('journal_entries.venture_id', ventureId)
      .gte('journal_entries.entry_date', daysAgo(30))
      .gte('ledger_accounts.code', '4000')
      .lte('ledger_accounts.code', '4999'),
  ]);

  // ── MRR Calculation ───────────────────────────────────────────────────────

  let mrr = 0;
  const activeSubscriptions = subscriptionData.data?.length ?? 0;

  for (const sub of subscriptionData.data ?? []) {
    const plan = Array.isArray((sub as Record<string, unknown>).plans)
      ? ((sub as Record<string, unknown>).plans as Array<{ price: number; interval: string; interval_count: number }>)[0]
      : (sub as Record<string, unknown>).plans as { price: number; interval: string; interval_count: number } | null;

    if (!plan) continue;
    const qty = (sub as Record<string, unknown>).quantity as number ?? 1;
    const unitPrice: number = (plan.price ?? 0);
    const interval: string = plan.interval ?? 'month';
    const intervalCount: number = plan.interval_count ?? 1;

    // Normalize to monthly
    let monthlyAmount = 0;
    if (interval === 'month') monthlyAmount = unitPrice / intervalCount;
    else if (interval === 'year') monthlyAmount = unitPrice / (12 * intervalCount);
    else if (interval === 'week') monthlyAmount = (unitPrice / intervalCount) * 4.33;
    else if (interval === 'day') monthlyAmount = (unitPrice / intervalCount) * 30;

    mrr += monthlyAmount * qty;
  }

  const arr = mrr * 12;

  // ── Churn Rate (last 30d) ─────────────────────────────────────────────────

  const canceledCount = canceledData.data?.length ?? 0;
  const startPeriodCount = startPeriodSubData.data?.length ?? 0;
  const churnRate30d = startPeriodCount > 0 ? canceledCount / startPeriodCount : 0;

  // ── LTV (simplified: MRR / churn rate) ──────────────────────────────────

  const ltv = churnRate30d > 0 ? mrr / churnRate30d : mrr * 24; // fallback: 2 years

  // ── Revenue Growth MoM ────────────────────────────────────────────────────

  const netRevenue30d = revenue30d;
  const netRevenuePrev30d = revenuePrev30d - revenue30d; // subtract current period from 60d window
  const revenueGrowthMoM = netRevenuePrev30d > 0
    ? (netRevenue30d - netRevenuePrev30d) / netRevenuePrev30d
    : 0;

  // ── Burn Rate & Runway ────────────────────────────────────────────────────

  const burnRate = expensesLast30d; // per month approximation (last 30d)

  const totalCash = (cashAccountData.data as Array<{ current_balance: number }> | null)
    ?.reduce((sum, acc) => sum + (acc.current_balance ?? 0), 0) ?? 0;

  const runway = burnRate > 0 ? totalCash / burnRate : Infinity;

  // ── Outstanding Credits & Loans ───────────────────────────────────────────

  const outstandingCredits = (creditAccountData.data as Array<{ balance: number }> | null)
    ?.reduce((sum, acc) => sum + (acc.balance ?? 0), 0) ?? 0;

  const outstandingLoans = (loanData.data as Array<{ outstanding_balance: number }> | null)
    ?.reduce((sum, loan) => sum + (loan.outstanding_balance ?? 0), 0) ?? 0;

  // ── Processing Fees & Smart Routing Savings ───────────────────────────────

  type RoutingRow = { savings_vs_default: number; estimated_fee_total_fee: number };
  const routingRows = (routingData.data as RoutingRow[] | null) ?? [];

  const smartRoutingSavings30d = routingRows.reduce(
    (sum, row) => sum + (row.savings_vs_default ?? 0), 0,
  );
  const processingFeesTotal30d = routingRows.reduce(
    (sum, row) => sum + (row.estimated_fee_total_fee ?? 0), 0,
  );

  // ── Revenue by Rail ──────────────────────────────────────────────────────

  type RailLine = { credit_amount: number; debit_amount: number; dim_rail: string | null };
  const revenueByRail: Record<string, number> = {};
  for (const line of (revenueByRailData.data as RailLine[] | null) ?? []) {
    if (!line.dim_rail) continue;
    const net = (line.credit_amount ?? 0) - (line.debit_amount ?? 0);
    revenueByRail[line.dim_rail] = (revenueByRail[line.dim_rail] ?? 0) + net;
  }

  // ── Revenue by Product Type (mapped from account code) ───────────────────

  type ProductLine = { credit_amount: number; debit_amount: number; ledger_accounts: { code: string; name: string } };

  const PRODUCT_TYPE_MAP: Record<string, string> = {
    '4010': 'subscriptions', '4020': 'one_time_sales', '4030': 'digital_products',
    '4040': 'physical_goods', '4050': 'platform_fees', '4060': 'transaction_fees',
    '4070': 'credit_sales', '4080': 'loan_interest', '4090': 'marketplace_commissions',
    '4100': 'metered_usage', '4110': 'services',
  };

  const revenueByProductType: Record<string, number> = {};
  for (const line of (revenueByProductData.data as ProductLine[] | null) ?? []) {
    const code = line.ledger_accounts?.code;
    const productType = PRODUCT_TYPE_MAP[code] ?? 'other';
    const net = (line.credit_amount ?? 0) - (line.debit_amount ?? 0);
    revenueByProductType[productType] = (revenueByProductType[productType] ?? 0) + net;
  }

  // ── AR Aging ─────────────────────────────────────────────────────────────

  type InvoiceRow = { amount_due: number; amount_paid: number; due_date: string };
  const arAging: ArAging = { current: 0, days30: 0, days60: 0, days90: 0, days90plus: 0 };
  const today = new Date();

  for (const inv of (invoiceData.data as InvoiceRow[] | null) ?? []) {
    const outstanding = (inv.amount_due ?? 0) - (inv.amount_paid ?? 0);
    if (outstanding <= 0) continue;

    const dueDate = new Date(inv.due_date);
    const daysOverdue = Math.floor((today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));

    if (daysOverdue <= 0) arAging.current += outstanding;
    else if (daysOverdue <= 30) arAging.days30 += outstanding;
    else if (daysOverdue <= 60) arAging.days60 += outstanding;
    else if (daysOverdue <= 90) arAging.days90 += outstanding;
    else arAging.days90plus += outstanding;
  }

  return {
    ventureId,
    mrr,
    arr,
    activeSubscriptions,
    churnRate30d,
    ltv,
    netRevenue24h: revenue24h,
    netRevenue7d: revenue7d,
    netRevenue30d,
    revenueGrowthMoM,
    burnRate,
    runway: isFinite(runway) ? runway : 9999,
    outstandingCredits,
    outstandingLoans,
    processingFeesTotal30d,
    smartRoutingSavings30d,
    revenueByRail,
    revenueByVenture: { [ventureId]: netRevenue30d },
    revenueByProductType,
    revenueByCountry: {}, // requires dim_tax_jurisdiction mapping — future enhancement
    arAging,
    calculatedAt: now(),
  };
}

// ─────────────────────────────────────────────────────────
// EMPTY METRICS (returned when Supabase is null)
// ─────────────────────────────────────────────────────────

function buildEmptyMetrics(ventureId: string): RealTimeMetrics {
  return {
    ventureId,
    mrr: 0,
    arr: 0,
    activeSubscriptions: 0,
    churnRate30d: 0,
    ltv: 0,
    netRevenue24h: 0,
    netRevenue7d: 0,
    netRevenue30d: 0,
    revenueGrowthMoM: 0,
    burnRate: 0,
    runway: 9999,
    outstandingCredits: 0,
    outstandingLoans: 0,
    processingFeesTotal30d: 0,
    smartRoutingSavings30d: 0,
    revenueByRail: {},
    revenueByVenture: {},
    revenueByProductType: {},
    revenueByCountry: {},
    arAging: { current: 0, days30: 0, days60: 0, days90: 0, days90plus: 0 },
    calculatedAt: new Date().toISOString(),
  };
}
