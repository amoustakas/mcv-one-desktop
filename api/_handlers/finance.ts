// api/finance.ts
// Vercel serverless function — Finance API
// Actions: income-statement, balance-sheet, cash-flow, metrics,
//          cost-intelligence, deferred-revenue, process-recognition

import type { VercelRequest, VercelResponse } from '@vercel/node';

import { requestLogger } from '../../src/lib/server/logger';
async function requireAuth(req: VercelRequest, res: VercelResponse): Promise<string | null> {
  const secretKey = process.env.CLERK_SECRET_KEY;
  if (!secretKey) return 'no-secret';
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : (req.cookies?.__session || null);
  if (!token) { res.status(401).json({ error: 'Authentication required' }); return null; }
  try {
    const { verifyToken } = await import('@clerk/backend');
    const payload = await verifyToken(token, { secretKey });
    return payload.sub;
  } catch { res.status(401).json({ error: 'Invalid session' }); return null; }
}

// ─────────────────────────────────────────────────────────────────────────────
// SUPABASE FACTORY — uses service key for server-side queries
// ─────────────────────────────────────────────────────────────────────────────

async function makeSupabase() {
  const { createClient } = await import('@supabase/supabase-js');
  return createClient(
    process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL ?? '',
    process.env.SUPABASE_SERVICE_KEY ?? process.env.VITE_SUPABASE_ANON_KEY ?? '',
  );
}

type SupabaseClient = Awaited<ReturnType<typeof makeSupabase>>;

// ─────────────────────────────────────────────────────────────────────────────
// CACHE HELPERS
// ─────────────────────────────────────────────────────────────────────────────

async function getCached(
  sb: SupabaseClient,
  ventureId: string,
  reportType: string,
  period: string,
): Promise<Record<string, unknown> | null> {
  const { data } = await sb
    .from('financial_report_cache')
    .select('report_data, created_at')
    .eq('venture_id', ventureId)
    .eq('report_type', reportType)
    .eq('period', period)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (!data) return null;

  const raw = data as { report_data: Record<string, unknown>; created_at: string };
  const ageMs = Date.now() - new Date(raw.created_at).getTime();
  if (ageMs > 60 * 60 * 1000) return null; // stale after 1 hour

  return raw.report_data;
}

async function setCache(
  sb: SupabaseClient,
  ventureId: string,
  reportType: string,
  period: string,
  data: Record<string, unknown>,
): Promise<void> {
  await sb.from('financial_report_cache').upsert({
    venture_id: ventureId,
    report_type: reportType,
    period,
    report_data: data,
    created_at: new Date().toISOString(),
  }, { onConflict: 'venture_id,report_type,period' });
}

// ─────────────────────────────────────────────────────────────────────────────
// INLINE AGGREGATION HELPERS
// These replicate the logic from src/lib/finance/ but use the API's supabase client
// so we avoid import.meta.env issues in Node serverless context.
// ─────────────────────────────────────────────────────────────────────────────

const REVENUE_MAP: Record<string, string> = {
  '4010': 'subscriptions', '4020': 'oneTimeSales', '4030': 'digitalProducts',
  '4040': 'physicalGoods', '4050': 'platformFees', '4060': 'transactionFees',
  '4070': 'creditSales', '4080': 'loanInterest', '4090': 'marketplaceCommissions',
  '4100': 'meteredUsage', '4110': 'services',
};

const COGS_MAP: Record<string, string> = {
  '5010': 'physicalGoodsCost', '5020': 'digitalDeliveryCost',
  '5030': 'paymentProcessingFees', '5040': 'refundsAndChargebacks',
};

const OPEX_MAP: Record<string, string> = {
  '6010': 'infrastructure', '6020': 'thirdPartyServices',
  '6030': 'creditGrants', '6040': 'loanWriteoffs',
};

async function computeIncomeStatement(
  sb: SupabaseClient,
  ventureId: string,
  startDate: string,
  endDate: string,
  currency: string,
) {
  let query = sb
    .from('journal_entry_lines')
    .select(`
      debit_amount,
      credit_amount,
      ledger_accounts!inner(code, type, venture_id),
      journal_entries!inner(status, entry_date, venture_id)
    `)
    .eq('journal_entries.status', 'posted')
    .gte('journal_entries.entry_date', startDate)
    .lte('journal_entries.entry_date', endDate);

  if (ventureId !== '*') query = query.eq('journal_entries.venture_id', ventureId);

  const { data: lines } = await query;

  const revenueAccum: Record<string, number> = {};
  const cogsAccum: Record<string, number> = {};
  const opexAccum: Record<string, number> = {};

  for (const line of (lines ?? []) as Array<{
    debit_amount: number;
    credit_amount: number;
    ledger_accounts: { code: string };
  }>) {
    const code = line.ledger_accounts?.code;
    if (!code) continue;
    if (REVENUE_MAP[code]) {
      revenueAccum[code] = (revenueAccum[code] ?? 0) + ((line.credit_amount ?? 0) - (line.debit_amount ?? 0));
    } else if (COGS_MAP[code]) {
      cogsAccum[code] = (cogsAccum[code] ?? 0) + ((line.debit_amount ?? 0) - (line.credit_amount ?? 0));
    } else if (OPEX_MAP[code]) {
      opexAccum[code] = (opexAccum[code] ?? 0) + ((line.debit_amount ?? 0) - (line.credit_amount ?? 0));
    }
  }

  const revenue: Record<string, number> = {
    subscriptions: 0, oneTimeSales: 0, digitalProducts: 0, physicalGoods: 0,
    platformFees: 0, transactionFees: 0, creditSales: 0, loanInterest: 0,
    marketplaceCommissions: 0, meteredUsage: 0, services: 0, total: 0,
  };
  for (const [code, net] of Object.entries(revenueAccum)) {
    const key = REVENUE_MAP[code];
    if (key) revenue[key] = (revenue[key] ?? 0) + net;
  }
  revenue.total = Object.entries(revenue).filter(([k]) => k !== 'total').reduce((s, [, v]) => s + v, 0);

  const costOfRevenue: Record<string, number> = {
    physicalGoodsCost: 0, digitalDeliveryCost: 0, paymentProcessingFees: 0, refundsAndChargebacks: 0, total: 0,
  };
  for (const [code, net] of Object.entries(cogsAccum)) {
    const key = COGS_MAP[code];
    if (key) costOfRevenue[key] = (costOfRevenue[key] ?? 0) + net;
  }
  costOfRevenue.total = Object.entries(costOfRevenue).filter(([k]) => k !== 'total').reduce((s, [, v]) => s + v, 0);

  const operatingExpenses: Record<string, number> = {
    infrastructure: 0, thirdPartyServices: 0, creditGrants: 0, loanWriteoffs: 0, total: 0,
  };
  for (const [code, net] of Object.entries(opexAccum)) {
    const key = OPEX_MAP[code];
    if (key) operatingExpenses[key] = (operatingExpenses[key] ?? 0) + net;
  }
  operatingExpenses.total = Object.entries(operatingExpenses).filter(([k]) => k !== 'total').reduce((s, [, v]) => s + v, 0);

  const grossProfit = revenue.total - costOfRevenue.total;
  const grossMargin = revenue.total > 0 ? grossProfit / revenue.total : 0;
  const operatingIncome = grossProfit - operatingExpenses.total;

  return {
    scope: { level: 'venture', ventureId, dateRange: { start: startDate, end: endDate }, currency },
    revenue,
    costOfRevenue,
    grossProfit,
    grossMargin,
    operatingExpenses,
    operatingIncome,
    netIncome: operatingIncome,
    generatedAt: new Date().toISOString(),
  };
}

async function computeBalanceSheet(
  sb: SupabaseClient,
  ventureId: string,
  asOfDate: string,
  currency: string,
) {
  let query = sb.from('ledger_accounts').select('code, type, current_balance, venture_id');
  if (ventureId !== '*') query = query.eq('venture_id', ventureId);
  const { data: accounts } = await query;

  const ca = { cashAndEquivalents: 0, accountsReceivable: 0, inventory: 0, creditsReceivable: 0, loansReceivable: 0, prepaidExpenses: 0, total: 0 };
  const nca = { equipment: 0, investments: 0, tokenTreasury: 0, total: 0 };
  const cl = { accountsPayable: 0, creditsPayable: 0, unearnedRevenue: 0, taxPayable: 0, refundsPayable: 0, total: 0 };
  const ncl = { loansPayable: 0, total: 0 };
  const eq = { ownersEquity: 0, retainedEarnings: 0, tokenTreasury: 0, totalEquity: 0 };

  for (const acc of (accounts ?? []) as Array<{ code: string; type: string; current_balance: number }>) {
    const n = parseInt(acc.code, 10);
    const b = acc.current_balance ?? 0;
    if (acc.type === 'asset') {
      if (n >= 1010 && n <= 1015) ca.cashAndEquivalents += b;
      else if (n >= 1020 && n <= 1025) ca.accountsReceivable += b;
      else if (n === 1030) ca.inventory += b;
      else if (n >= 1031 && n <= 1035) ca.creditsReceivable += b;
      else if (n >= 1036 && n <= 1040) ca.loansReceivable += b;
      else if (n >= 1050 && n <= 1059) ca.prepaidExpenses += b;
      else if (n >= 1060 && n <= 1089) nca.equipment += b;
      else if (n >= 1090 && n <= 1099) nca.investments += b;
      else if (n >= 1200 && n <= 1299) nca.tokenTreasury += b;
    } else if (acc.type === 'liability') {
      if (n >= 2010 && n <= 2019) cl.accountsPayable += b;
      else if (n >= 2020 && n <= 2029) cl.creditsPayable += b;
      else if (n >= 2030 && n <= 2039) cl.unearnedRevenue += b;
      else if (n >= 2040 && n <= 2049) cl.taxPayable += b;
      else if (n >= 2050 && n <= 2059) cl.refundsPayable += b;
      else if (n >= 2100 && n <= 2199) ncl.loansPayable += b;
    } else if (acc.type === 'equity') {
      if (n >= 3010 && n <= 3019) eq.ownersEquity += b;
      else if (n >= 3020 && n <= 3029) eq.retainedEarnings += b;
      else if (n >= 3030 && n <= 3099) eq.tokenTreasury += b;
    }
  }

  ca.total = ca.cashAndEquivalents + ca.accountsReceivable + ca.inventory + ca.creditsReceivable + ca.loansReceivable + ca.prepaidExpenses;
  nca.total = nca.equipment + nca.investments + nca.tokenTreasury;
  cl.total = cl.accountsPayable + cl.creditsPayable + cl.unearnedRevenue + cl.taxPayable + cl.refundsPayable;
  ncl.total = ncl.loansPayable;
  eq.totalEquity = eq.ownersEquity + eq.retainedEarnings + eq.tokenTreasury;

  const totalAssets = ca.total + nca.total;
  const totalLiabilities = cl.total + ncl.total;
  const balanced = Math.abs(totalAssets - (totalLiabilities + eq.totalEquity)) < 0.01;

  return {
    scope: { level: 'venture', ventureId, dateRange: { start: asOfDate, end: asOfDate }, currency },
    assets: { current: ca, nonCurrent: nca },
    totalAssets,
    liabilities: { current: cl, nonCurrent: ncl },
    totalLiabilities,
    equity: eq,
    balanced,
    generatedAt: new Date().toISOString(),
  };
}

async function computeCostIntelligence(
  sb: SupabaseClient,
  ventureId: string,
  days: number,
) {
  const periodStart = new Date(Date.now() - days * 86400000).toISOString().slice(0, 10);
  const periodEnd = new Date().toISOString().slice(0, 10);

  const { data: routingRows } = await sb
    .from('routing_decisions')
    .select('primary_rail, estimated_fee_total_fee, savings_vs_default, amount')
    .eq('venture_id', ventureId)
    .gte('created_at', periodStart)
    .limit(50000);

  type RRow = { primary_rail: string | null; estimated_fee_total_fee: number | null; savings_vs_default: number | null; amount: number | null };

  const routing = (routingRows as RRow[] | null) ?? [];
  let totalProcessingFees = 0;
  let totalAmount = 0;
  let savingsFromSmartRouting = 0;
  const feesByProcessor: Record<string, number> = {};
  const feesByRail: Record<string, number> = {};

  for (const row of routing) {
    const fee = row.estimated_fee_total_fee ?? 0;
    const rail = row.primary_rail ?? 'unknown';
    totalProcessingFees += fee;
    totalAmount += row.amount ?? 0;
    savingsFromSmartRouting += row.savings_vs_default ?? 0;
    feesByProcessor[rail] = (feesByProcessor[rail] ?? 0) + fee;
    feesByRail[rail] = (feesByRail[rail] ?? 0) + fee;
  }

  return {
    ventureId,
    periodStart,
    periodEnd,
    totalProcessingFees,
    feesByProcessor,
    feesByRail,
    avgFeePercentage: totalAmount > 0 ? totalProcessingFees / totalAmount : 0,
    savingsFromSmartRouting,
    savingsFromCryptoRails: 0,
    totalSavings: savingsFromSmartRouting,
    recommendations: [],
    generatedAt: new Date().toISOString(),
  };
}

async function computeMetrics(sb: SupabaseClient, ventureId: string) {
  const daysAgo = (n: number) => new Date(Date.now() - n * 86400000).toISOString();

  const [subData, routingData, cashData] = await Promise.all([
    sb.from('subscriptions')
      .select('id, quantity, plans(price, interval, interval_count)')
      .eq('venture_id', ventureId)
      .in('status', ['active', 'trialing']),
    sb.from('routing_decisions')
      .select('savings_vs_default, estimated_fee_total_fee')
      .eq('venture_id', ventureId)
      .gte('created_at', daysAgo(30)),
    sb.from('ledger_accounts')
      .select('current_balance')
      .eq('venture_id', ventureId)
      .gte('code', '1010')
      .lte('code', '1015'),
  ]);

  let mrr = 0;
  for (const sub of (subData.data ?? []) as Array<{
    quantity: number;
    plans: { price: number; interval: string; interval_count: number } | null;
  }>) {
    const plan = sub.plans;
    if (!plan) continue;
    const qty = sub.quantity ?? 1;
    let monthly = 0;
    if (plan.interval === 'month') monthly = plan.price / (plan.interval_count || 1);
    else if (plan.interval === 'year') monthly = plan.price / (12 * (plan.interval_count || 1));
    mrr += monthly * qty;
  }

  const routingRows = (routingData.data ?? []) as Array<{ savings_vs_default: number; estimated_fee_total_fee: number }>;
  const smartRoutingSavings30d = routingRows.reduce((s, r) => s + (r.savings_vs_default ?? 0), 0);
  const processingFeesTotal30d = routingRows.reduce((s, r) => s + (r.estimated_fee_total_fee ?? 0), 0);
  const totalCash = (cashData.data ?? []).reduce((s: number, a: { current_balance: number }) => s + (a.current_balance ?? 0), 0);

  return {
    ventureId,
    mrr,
    arr: mrr * 12,
    activeSubscriptions: subData.data?.length ?? 0,
    churnRate30d: 0,
    ltv: mrr * 24,
    netRevenue24h: 0,
    netRevenue7d: 0,
    netRevenue30d: 0,
    revenueGrowthMoM: 0,
    burnRate: 0,
    runway: 9999,
    outstandingCredits: 0,
    outstandingLoans: 0,
    processingFeesTotal30d,
    smartRoutingSavings30d,
    revenueByRail: {},
    revenueByVenture: { [ventureId]: 0 },
    revenueByProductType: {},
    revenueByCountry: {},
    arAging: { current: 0, days30: 0, days60: 0, days90: 0, days90plus: 0 },
    totalCash,
    calculatedAt: new Date().toISOString(),
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// HANDLER
// ─────────────────────────────────────────────────────────────────────────────

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { log: __log, correlationId: __correlationId } = requestLogger(req as unknown as { headers?: Record<string, unknown>; url?: string; method?: string });
  try { res.setHeader('x-correlation-id', __correlationId); } catch { /* headers already sent */ }
  const __start = Date.now();
  __log.info({ event: 'request_in' });
  res.on('finish', () => {
    __log.info({ event: 'request_out', status: res.statusCode, duration_ms: Date.now() - __start });
  });
  res.on('close', () => {
    if (!res.writableEnded) {
      __log.warn({ event: 'request_abort', duration_ms: Date.now() - __start });
    }
  });
  const userId = await requireAuth(req, res);
  if (!userId) return;

  const sb = await makeSupabase();
  const isGet = req.method === 'GET';
  const action = (isGet ? req.query.action : req.body?.action) as string;
  const ventureId = ((isGet ? req.query.ventureId : req.body?.ventureId) as string) ?? '';

  if (!ventureId) {
    return res.status(400).json({ error: 'ventureId is required' });
  }

  try {
    switch (action) {

      // ── income-statement ────────────────────────────────────────────────
      case 'income-statement': {
        const startDate = (req.query.startDate as string) ?? new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10);
        const endDate = (req.query.endDate as string) ?? new Date().toISOString().slice(0, 10);
        const currency = (req.query.currency as string) ?? 'USD';
        const period = `${startDate}:${endDate}`;

        const cached = await getCached(sb, ventureId, 'income-statement', period);
        if (cached) return res.json({ data: cached, cached: true });

        const data = await computeIncomeStatement(sb, ventureId, startDate, endDate, currency);
        await setCache(sb, ventureId, 'income-statement', period, data as Record<string, unknown>);
        return res.json({ data });
      }

      // ── balance-sheet ───────────────────────────────────────────────────
      case 'balance-sheet': {
        const asOfDate = (req.query.asOfDate as string) ?? new Date().toISOString().slice(0, 10);
        const currency = (req.query.currency as string) ?? 'USD';
        const period = asOfDate;

        const cached = await getCached(sb, ventureId, 'balance-sheet', period);
        if (cached) return res.json({ data: cached, cached: true });

        const data = await computeBalanceSheet(sb, ventureId, asOfDate, currency);
        await setCache(sb, ventureId, 'balance-sheet', period, data as Record<string, unknown>);
        return res.json({ data });
      }

      // ── cash-flow ───────────────────────────────────────────────────────
      case 'cash-flow': {
        const startDate = (req.query.startDate as string) ?? new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10);
        const endDate = (req.query.endDate as string) ?? new Date().toISOString().slice(0, 10);
        const period = `${startDate}:${endDate}`;

        const cached = await getCached(sb, ventureId, 'cash-flow', period);
        if (cached) return res.json({ data: cached, cached: true });

        // Compute using income statement net income + working capital changes
        const incomeSt = await computeIncomeStatement(sb, ventureId, startDate, endDate, 'USD');

        const data = {
          scope: { level: 'venture', ventureId, dateRange: { start: startDate, end: endDate }, currency: 'USD' },
          operating: {
            netIncome: incomeSt.netIncome,
            adjustments: { depreciation: 0, arChange: 0, apChange: 0, inventoryChange: 0, unearnedRevenueChange: 0, creditsPayableChange: 0, other: 0 },
            netOperatingCashFlow: incomeSt.netIncome,
          },
          investing: { equipmentPurchases: 0, investmentPurchases: 0, investmentSales: 0, netInvestingCashFlow: 0 },
          financing: { loanProceeds: 0, loanRepayments: 0, equityContributions: 0, equityDistributions: 0, netFinancingCashFlow: 0 },
          netCashChange: incomeSt.netIncome,
          beginningCash: 0,
          endingCash: 0,
          generatedAt: new Date().toISOString(),
        };

        await setCache(sb, ventureId, 'cash-flow', period, data as Record<string, unknown>);
        return res.json({ data });
      }

      // ── metrics ─────────────────────────────────────────────────────────
      case 'metrics': {
        const data = await computeMetrics(sb, ventureId);
        return res.json({ data });
      }

      // ── cost-intelligence ────────────────────────────────────────────────
      case 'cost-intelligence': {
        const days = Math.min(Number(req.query.days) || 30, 365);
        const period = `last-${days}d`;

        const cached = await getCached(sb, ventureId, 'cost-intelligence', period);
        if (cached) return res.json({ data: cached, cached: true });

        const data = await computeCostIntelligence(sb, ventureId, days);
        await setCache(sb, ventureId, 'cost-intelligence', period, data as Record<string, unknown>);
        return res.json({ data });
      }

      // ── deferred-revenue ─────────────────────────────────────────────────
      case 'deferred-revenue': {
        const { data: schedules } = await sb
          .from('revenue_schedules')
          .select('deferred_amount')
          .eq('venture_id', ventureId)
          .eq('status', 'active');

        const total = (schedules as Array<{ deferred_amount: number }> | null)
          ?.reduce((sum, row) => sum + (row.deferred_amount ?? 0), 0) ?? 0;

        return res.json({ data: { ventureId, deferredRevenue: total, calculatedAt: new Date().toISOString() } });
      }

      // ── process-recognition (POST) ───────────────────────────────────────
      case 'process-recognition': {
        if (req.method !== 'POST') return res.status(405).json({ error: 'POST required' });

        const asOfDate = (req.body?.asOfDate as string) ?? new Date().toISOString().slice(0, 10);

        // Fetch active schedules
        const { data: schedules } = await sb
          .from('revenue_schedules')
          .select('id, total_amount, recognized_amount, deferred_amount, recognition_method, start_date, end_date, source_type')
          .eq('venture_id', ventureId)
          .eq('status', 'active');

        let processedCount = 0;

        for (const schedule of (schedules ?? []) as Array<{
          id: string;
          total_amount: number;
          recognized_amount: number;
          recognition_method: string;
          source_type: string;
        }>) {
          if (schedule.recognition_method === 'usage_based') continue;
          if (schedule.recognition_method === 'milestone') continue;

          const { data: pendingEntries } = await sb
            .from('revenue_entries')
            .select('id, amount, period_date')
            .eq('schedule_id', schedule.id)
            .eq('type', 'recognition')
            .is('recognized_at', null)
            .lte('period_date', asOfDate);

          if (!pendingEntries || pendingEntries.length === 0) continue;

          for (const entry of pendingEntries as Array<{ id: string; amount: number; period_date: string }>) {
            const { data: je } = await sb
              .from('journal_entries')
              .insert({
                venture_id: ventureId,
                entry_number: `REV-REC-${Date.now()}`,
                entry_date: entry.period_date,
                description: `Revenue recognition: ${schedule.source_type} schedule ${schedule.id}`,
                source_type: 'revenue_recognition',
                source_id: schedule.id,
                status: 'posted',
                posted_at: new Date().toISOString(),
              })
              .select('id')
              .single();

            if (!je) continue;
            const jeId = (je as { id: string }).id;

            await sb.from('revenue_entries')
              .update({ journal_entry_id: jeId, recognized_at: new Date().toISOString() })
              .eq('id', entry.id);

            processedCount++;
          }

          // Update totals
          const { data: allEntries } = await sb
            .from('revenue_entries')
            .select('amount')
            .eq('schedule_id', schedule.id)
            .eq('type', 'recognition')
            .not('recognized_at', 'is', null);

          const newRecognized = (allEntries as Array<{ amount: number }> | null)
            ?.reduce((s, e) => s + e.amount, 0) ?? 0;

          const newDeferred = Math.max(0, schedule.total_amount - newRecognized);

          await sb.from('revenue_schedules').update({
            recognized_amount: newRecognized,
            deferred_amount: newDeferred,
            ...(newDeferred < 0.01 ? { status: 'completed' } : {}),
          }).eq('id', schedule.id);
        }

        return res.json({ data: { processedCount, asOfDate } });
      }

      default:
        return res.status(400).json({ error: `Unknown action: ${action}` });
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : (err && typeof err === 'object' && 'message' in err ? String((err as { message: unknown }).message) : JSON.stringify(err));
    return res.status(500).json({ error: message });
  }
}
