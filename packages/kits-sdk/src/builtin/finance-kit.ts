// src/lib/kits/builtin/finance-kit.ts
// Finance Reporting Kit — P&L, balance sheet, metrics, cost intelligence, deferred revenue

import type { KitManifest, KitToolHandler, KitExecutionContext } from '../types';

// ─────────────────────────────────────────────────────────
// API HELPER
// ─────────────────────────────────────────────────────────

async function financeApi(
  action: string,
  params: Record<string, string | number | undefined>,
  ctx: KitExecutionContext,
  method: 'GET' | 'POST' = 'GET',
) {
  if (method === 'GET') {
    const query = new URLSearchParams({ action, ventureId: ctx.ventureId });
    for (const [k, v] of Object.entries(params)) {
      if (v !== undefined && v !== null && v !== '') query.set(k, String(v));
    }
    const res = await ctx.fetch(`/api/finance?${query.toString()}`);
    if (!res.ok) {
      const e = await res.json().catch(() => ({}));
      throw new Error((e as { error?: string }).error || `Finance API ${res.status}`);
    }
    return res.json();
  } else {
    const res = await ctx.fetch('/api/finance', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, ventureId: ctx.ventureId, ...params }),
    });
    if (!res.ok) {
      const e = await res.json().catch(() => ({}));
      throw new Error((e as { error?: string }).error || `Finance API ${res.status}`);
    }
    return res.json();
  }
}

function fmt(n: number): string {
  if (Math.abs(n) >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`;
  if (Math.abs(n) >= 1_000) return `$${(n / 1_000).toFixed(1)}K`;
  return `$${n.toFixed(2)}`;
}

function pct(n: number): string {
  return `${(n * 100).toFixed(1)}%`;
}

// ─────────────────────────────────────────────────────────
// TOOL 1 — Income Statement
// ─────────────────────────────────────────────────────────

const incomeStatement: KitToolHandler = async (input, ctx) => {
  const today = new Date().toISOString().slice(0, 10);
  const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10);

  const startDate = (input.start_date as string) ?? thirtyDaysAgo;
  const endDate = (input.end_date as string) ?? today;
  const currency = (input.currency as string) ?? 'USD';

  const result = await financeApi('income-statement', { startDate, endDate, currency }, ctx);
  const d = result.data;
  if (!d) return { success: false, error: 'No data returned' };

  const lines = [
    `## Income Statement (${startDate} → ${endDate})`,
    '',
    '### Revenue',
    `| Category | Amount |`,
    `|----------|--------|`,
    d.revenue.subscriptions > 0 ? `| Subscriptions | ${fmt(d.revenue.subscriptions)} |` : null,
    d.revenue.oneTimeSales > 0 ? `| One-Time Sales | ${fmt(d.revenue.oneTimeSales)} |` : null,
    d.revenue.digitalProducts > 0 ? `| Digital Products | ${fmt(d.revenue.digitalProducts)} |` : null,
    d.revenue.services > 0 ? `| Services | ${fmt(d.revenue.services)} |` : null,
    d.revenue.platformFees > 0 ? `| Platform Fees | ${fmt(d.revenue.platformFees)} |` : null,
    `| **Total Revenue** | **${fmt(d.revenue.total)}** |`,
    '',
    `**Gross Profit:** ${fmt(d.grossProfit)} (${pct(d.grossMargin)} margin)`,
    '',
    `**Operating Expenses:** ${fmt(d.operatingExpenses.total)}`,
    `**Operating Income:** ${fmt(d.operatingIncome)}`,
    `**Net Income:** ${fmt(d.netIncome)}`,
  ].filter(Boolean).join('\n');

  return { success: true, data: d, displayMarkdown: lines };
};

// ─────────────────────────────────────────────────────────
// TOOL 2 — Balance Sheet
// ─────────────────────────────────────────────────────────

const balanceSheet: KitToolHandler = async (input, ctx) => {
  const asOfDate = (input.as_of_date as string) ?? new Date().toISOString().slice(0, 10);
  const currency = (input.currency as string) ?? 'USD';

  const result = await financeApi('balance-sheet', { asOfDate, currency }, ctx);
  const d = result.data;
  if (!d) return { success: false, error: 'No data returned' };

  const balanceIcon = d.balanced ? '✓ Balanced' : '⚠ OUT OF BALANCE';
  const lines = [
    `## Balance Sheet (as of ${asOfDate})`,
    '',
    '### Assets',
    `| Category | Amount |`,
    `|----------|--------|`,
    `| Cash & Equivalents | ${fmt(d.assets.current.cashAndEquivalents)} |`,
    `| Accounts Receivable | ${fmt(d.assets.current.accountsReceivable)} |`,
    d.assets.current.creditsReceivable > 0 ? `| Credits Receivable | ${fmt(d.assets.current.creditsReceivable)} |` : null,
    d.assets.current.loansReceivable > 0 ? `| Loans Receivable | ${fmt(d.assets.current.loansReceivable)} |` : null,
    d.assets.nonCurrent.tokenTreasury > 0 ? `| Token Treasury | ${fmt(d.assets.nonCurrent.tokenTreasury)} |` : null,
    `| **Total Assets** | **${fmt(d.totalAssets)}** |`,
    '',
    '### Liabilities & Equity',
    `| Category | Amount |`,
    `|----------|--------|`,
    `| Accounts Payable | ${fmt(d.liabilities.current.accountsPayable)} |`,
    d.liabilities.current.unearnedRevenue > 0 ? `| Unearned Revenue | ${fmt(d.liabilities.current.unearnedRevenue)} |` : null,
    `| **Total Liabilities** | **${fmt(d.totalLiabilities)}** |`,
    `| **Total Equity** | **${fmt(d.equity.totalEquity)}** |`,
    '',
    `**Liabilities + Equity:** ${fmt(d.totalLiabilities + d.equity.totalEquity)}`,
    `**${balanceIcon}**`,
  ].filter(Boolean).join('\n');

  return { success: true, data: d, displayMarkdown: lines };
};

// ─────────────────────────────────────────────────────────
// TOOL 3 — Real-Time Metrics
// ─────────────────────────────────────────────────────────

const realtimeMetrics: KitToolHandler = async (_input, ctx) => {
  const result = await financeApi('metrics', {}, ctx);
  const d = result.data;
  if (!d) return { success: false, error: 'No data returned' };

  const runwayLabel = d.runway >= 9999 ? 'Infinite' : `${d.runway.toFixed(1)} months`;

  const lines = [
    `## Real-Time Metrics`,
    '',
    `| Metric | Value |`,
    `|--------|-------|`,
    `| MRR | ${fmt(d.mrr)} |`,
    `| ARR | ${fmt(d.arr)} |`,
    `| Active Subscriptions | ${d.activeSubscriptions.toLocaleString()} |`,
    `| Churn Rate (30d) | ${pct(d.churnRate30d)} |`,
    `| LTV | ${fmt(d.ltv)} |`,
    `| Net Revenue (30d) | ${fmt(d.netRevenue30d)} |`,
    `| Revenue Growth MoM | ${pct(d.revenueGrowthMoM)} |`,
    `| Burn Rate | ${fmt(d.burnRate)}/mo |`,
    `| Runway | ${runwayLabel} |`,
    `| Outstanding Credits | ${fmt(d.outstandingCredits)} |`,
    `| Processing Fees (30d) | ${fmt(d.processingFeesTotal30d)} |`,
    `| Smart Routing Savings (30d) | ${fmt(d.smartRoutingSavings30d)} |`,
  ].join('\n');

  return { success: true, data: d, displayMarkdown: lines };
};

// ─────────────────────────────────────────────────────────
// TOOL 4 — Cost Intelligence
// ─────────────────────────────────────────────────────────

const costIntelligence: KitToolHandler = async (input, ctx) => {
  const days = (input.days as number) ?? 30;

  const result = await financeApi('cost-intelligence', { days }, ctx);
  const d = result.data;
  if (!d) return { success: false, error: 'No data returned' };

  const recLines = d.recommendations.map((r: {
    priority: number;
    title: string;
    description: string;
    estimatedMonthlySavings: number;
    effort: string;
  }) =>
    `${r.priority}. **${r.title}** — Save ${fmt(r.estimatedMonthlySavings)}/mo | Effort: ${r.effort}\n   ${r.description}`,
  );

  const railLines = Object.entries(d.feesByRail as Record<string, number>)
    .sort(([, a], [, b]) => b - a)
    .map(([rail, fee]) => `| ${rail} | ${fmt(fee)} |`)
    .join('\n');

  const lines = [
    `## Cost Intelligence (Last ${days} days)`,
    '',
    `| Metric | Value |`,
    `|--------|-------|`,
    `| Total Processing Fees | ${fmt(d.totalProcessingFees)} |`,
    `| Avg Fee Rate | ${pct(d.avgFeePercentage)} |`,
    `| Smart Routing Savings | ${fmt(d.savingsFromSmartRouting)} |`,
    `| Crypto Rail Savings | ${fmt(d.savingsFromCryptoRails)} |`,
    `| Total Savings | ${fmt(d.totalSavings)} |`,
    '',
    '### Fees by Rail',
    `| Rail | Fees |`,
    `|------|------|`,
    railLines || '| No data | — |',
    '',
    d.recommendations.length > 0
      ? `### Recommendations\n\n${recLines.join('\n\n')}`
      : '_No recommendations at this time._',
  ].join('\n');

  return { success: true, data: d, displayMarkdown: lines };
};

// ─────────────────────────────────────────────────────────
// TOOL 5 — Deferred Revenue
// ─────────────────────────────────────────────────────────

const deferredRevenue: KitToolHandler = async (_input, ctx) => {
  const result = await financeApi('deferred-revenue', {}, ctx);
  const d = result.data;
  if (!d) return { success: false, error: 'No data returned' };

  const lines = [
    `## Deferred Revenue (ASC 606)`,
    '',
    `**Total Deferred Revenue:** ${fmt(d.deferredRevenue)}`,
    '',
    '_Deferred revenue represents cash collected but not yet earned under ASC 606._',
    '_This appears as a liability (Unearned Revenue, account 2030) on the balance sheet._',
    '',
    `_Calculated at: ${d.calculatedAt}_`,
  ].join('\n');

  return {
    success: true,
    data: d,
    displayMarkdown: lines,
  };
};

// ─────────────────────────────────────────────────────────
// MANIFEST
// ─────────────────────────────────────────────────────────

export const manifest: KitManifest = {
  id: 'finance-reporting',
  name: 'Finance Reporting',
  version: '1.0.0',
  description: 'Financial statements, real-time SaaS metrics, cost intelligence, and ASC 606 revenue recognition.',
  author: 'MCV',
  capabilities: ['network', 'supabase'],
  runtime: 'inline',
  ventureScope: '*',
  instructions: `Use finance tools when the user asks about P&L, revenue, expenses, balance sheet, MRR/ARR, churn, burn rate, runway, processing fees, or deferred revenue.
- finance_metrics is the most-used tool — it returns MRR, ARR, burn rate, runway in one call.
- finance_income_statement for detailed P&L breakdown.
- finance_balance_sheet to check assets vs liabilities and equity balance.
- finance_cost_intelligence for processing fee analysis and optimization recommendations.
- finance_deferred_revenue for ASC 606 compliance checking.`,
  tools: [
    {
      name: 'finance_income_statement',
      description: 'Generate P&L (income statement) for a date range. Shows revenue by category, COGS, gross profit, operating expenses, and net income.',
      input_schema: {
        type: 'object',
        properties: {
          start_date: {
            type: 'string',
            description: 'Start date in YYYY-MM-DD format (default: 30 days ago)',
          },
          end_date: {
            type: 'string',
            description: 'End date in YYYY-MM-DD format (default: today)',
          },
          currency: {
            type: 'string',
            description: 'Currency code (default: USD)',
          },
        },
      },
    },
    {
      name: 'finance_balance_sheet',
      description: 'Generate balance sheet showing assets, liabilities, and equity. Includes balance check (assets = liabilities + equity).',
      input_schema: {
        type: 'object',
        properties: {
          as_of_date: {
            type: 'string',
            description: 'Date in YYYY-MM-DD format (default: today)',
          },
          currency: {
            type: 'string',
            description: 'Currency code (default: USD)',
          },
        },
      },
    },
    {
      name: 'finance_metrics',
      description: 'Real-time SaaS and financial metrics: MRR, ARR, churn, burn rate, runway, processing fees, smart routing savings. Most commonly used finance tool.',
      input_schema: {
        type: 'object',
        properties: {},
      },
    },
    {
      name: 'finance_cost_intelligence',
      description: 'Analyze payment processing fees by rail and processor. Shows savings from smart routing and crypto rails. Generates actionable recommendations to reduce fees.',
      input_schema: {
        type: 'object',
        properties: {
          days: {
            type: 'number',
            description: 'Analysis window in days (default: 30, max: 365)',
          },
        },
      },
    },
    {
      name: 'finance_deferred_revenue',
      description: 'Get total deferred revenue for ASC 606 compliance. Shows cash collected but not yet earned across all active revenue schedules.',
      input_schema: {
        type: 'object',
        properties: {},
      },
    },
  ],
};

export const handlers: Record<string, KitToolHandler> = {
  finance_income_statement: incomeStatement,
  finance_balance_sheet: balanceSheet,
  finance_metrics: realtimeMetrics,
  finance_cost_intelligence: costIntelligence,
  finance_deferred_revenue: deferredRevenue,
};
