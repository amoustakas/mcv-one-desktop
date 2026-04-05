// @ts-nocheck
// src/lib/kits/builtin/compliance-kit.ts
// Compliance Safety Kit — 5 agent tools for fraud, dunning, tax, nexus, localization
// Kit ID: compliance-safety

import type { KitManifest, KitToolHandler, KitExecutionContext } from '../types';

// ─────────────────────────────────────────────────────────
// API HELPER
// ─────────────────────────────────────────────────────────

async function complianceGet(
  action: string,
  ctx: KitExecutionContext,
  extra?: Record<string, string>,
) {
  const params = new URLSearchParams({ action, ventureId: ctx.ventureId, ...extra });
  const res = await ctx.fetch(`/api/compliance?${params.toString()}`);
  if (!res.ok) {
    const e = await res.json().catch(() => ({}));
    throw new Error((e as { error?: string }).error ?? `Compliance API ${res.status}`);
  }
  return res.json();
}

async function compliancePost(
  action: string,
  ctx: KitExecutionContext,
  body: Record<string, unknown>,
) {
  const res = await ctx.fetch('/api/compliance', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action, ventureId: ctx.ventureId, ...body }),
  });
  if (!res.ok) {
    const e = await res.json().catch(() => ({}));
    throw new Error((e as { error?: string }).error ?? `Compliance API ${res.status}`);
  }
  return res.json();
}

function fmt(cents: number): string {
  const dollars = cents / 100;
  if (dollars >= 1_000_000) return `$${(dollars / 1_000_000).toFixed(2)}M`;
  if (dollars >= 1_000) return `$${(dollars / 1_000).toFixed(1)}K`;
  return `$${dollars.toFixed(2)}`;
}

function pct(rate: number): string {
  return `${(rate * 100).toFixed(2)}%`;
}

function riskBadge(score: number): string {
  if (score <= 30) return `🟢 LOW (${score})`;
  if (score <= 70) return `🟡 MEDIUM (${score})`;
  return `🔴 HIGH (${score})`;
}

// ─────────────────────────────────────────────────────────
// TOOL 1 — Score a transaction for fraud risk
// ─────────────────────────────────────────────────────────

const scoreTransaction: KitToolHandler = async (input, ctx) => {
  const result = await compliancePost('score-transaction', ctx, {
    transactionId: input.transaction_id as string,
    customerId: (input.customer_id as string) ?? 'unknown',
    amount: input.amount as number,
    currency: (input.currency as string) ?? 'USD',
    customerCountry: input.customer_country as string | undefined,
    paymentMethodCountry: input.payment_method_country as string | undefined,
    customerCreatedAt: input.customer_created_at as string | undefined,
  });

  const d = result.data;
  if (!d) return { success: false, error: 'No result returned' };

  const lines = [
    `## Fraud Risk Score — Transaction ${d.transactionId}`,
    '',
    `**Risk Score:** ${riskBadge(d.riskScore)}`,
    `**Decision:** ${d.decision.toUpperCase()}`,
    d.requiresVerification ? '**⚠️ Requires 3DS/Verification**' : '',
    '',
  ];

  if (d.signals && d.signals.length > 0) {
    lines.push('### Risk Signals');
    lines.push('| Signal | Severity | Score | Description |');
    lines.push('|--------|----------|-------|-------------|');
    for (const s of d.signals) {
      const sev = s.severity === 'critical' ? '🔴' : s.severity === 'high' ? '🟠' : s.severity === 'medium' ? '🟡' : '⚪';
      lines.push(`| ${s.type} | ${sev} ${s.severity} | +${s.score} | ${s.description} |`);
    }
  } else {
    lines.push('No risk signals detected.');
  }

  return { success: true, result: d, output: lines.filter((l) => l !== '').join('\n') };
};

// ─────────────────────────────────────────────────────────
// TOOL 2 — Dunning recovery stats
// ─────────────────────────────────────────────────────────

const dunningStats: KitToolHandler = async (_input, ctx) => {
  const result = await complianceGet('get-dunning-stats', ctx);
  const d = result.data;
  if (!d) return { success: false, error: 'No stats returned' };

  const lines = [
    `## Dunning Recovery Stats`,
    '',
    `| Metric | Value |`,
    `|--------|-------|`,
    `| Active Dunning Cases | ${d.activeCount} |`,
    `| Recovered This Month | ${d.recoveredThisMonth} |`,
    `| Exhausted This Month | ${d.exhaustedThisMonth} |`,
    `| Recovery Rate | ${pct(d.recoveryRate)} |`,
    `| Revenue at Risk | ${fmt(d.revenueAtRisk)} |`,
  ];

  return { success: true, result: d, output: lines.join('\n') };
};

// ─────────────────────────────────────────────────────────
// TOOL 3 — Calculate tax for customer location
// ─────────────────────────────────────────────────────────

const calculateTax: KitToolHandler = async (input, ctx) => {
  const amount = (input.amount as number) ?? 10000; // default $100
  const country = (input.country as string) ?? 'US';
  const state = input.state as string | undefined;
  const isB2B = (input.is_b2b as boolean) ?? false;
  const customerVatId = input.customer_vat_id as string | undefined;

  const result = await compliancePost('calculate-tax', ctx, {
    lineItems: [
      {
        id: 'item-1',
        description: input.description as string ?? 'Product',
        amount,
        quantity: 1,
      },
    ],
    customerLocation: { country, state },
    isB2B,
    customerVatId,
  });

  const d = result.data;
  if (!d) return { success: false, error: 'Tax calculation failed' };

  const lines = [
    `## Tax Calculation — ${country}${state ? `-${state}` : ''}`,
    '',
    `| Line Item | Amount |`,
    `|-----------|--------|`,
    `| Subtotal | ${fmt(d.subtotal)} |`,
    `| Taxable Amount | ${fmt(d.taxableAmount)} |`,
    `| Total Tax | ${fmt(d.totalTax)} |`,
    d.exemptAmount > 0 ? `| Exempt Amount | ${fmt(d.exemptAmount)} |` : null,
    `| **Effective Rate** | **${pct(d.effectiveRate)}** |`,
    '',
  ];

  if (d.components && d.components.length > 0) {
    lines.push('### Tax Components');
    lines.push('| Jurisdiction | Type | Rate | Amount | Notes |');
    lines.push('|-------------|------|------|--------|-------|');
    for (const c of d.components) {
      const notes = [
        c.compound ? 'compound' : '',
        c.inclusive ? 'inclusive' : '',
        c.amount === 0 ? 'reverse charge' : '',
      ].filter(Boolean).join(', ');
      lines.push(`| ${c.name} | ${c.taxType.toUpperCase()} | ${pct(c.rate)} | ${fmt(c.amount)} | ${notes} |`);
    }
  }

  return { success: true, result: d, output: lines.filter((l) => l !== null).join('\n') };
};

// ─────────────────────────────────────────────────────────
// TOOL 4 — Check nexus thresholds and alerts
// ─────────────────────────────────────────────────────────

const checkNexus: KitToolHandler = async (_input, ctx) => {
  const result = await complianceGet('check-nexus', ctx);
  const data = result.data as Array<{
    jurisdictionCode: string;
    jurisdictionName: string;
    metricType: string;
    currentValue: number;
    threshold: number;
    percentageOfThreshold: number;
    thresholdReached: boolean;
    periodStart: string;
    periodEnd: string;
  }>;

  if (!data || data.length === 0) {
    return {
      success: true,
      result: [],
      output: '## Nexus Tracking\n\nNo nexus thresholds being tracked for this venture yet. Sales data will populate as transactions are recorded.',
    };
  }

  const reached = data.filter((a) => a.thresholdReached);
  const approaching = data.filter((a) => !a.thresholdReached && a.percentageOfThreshold >= 75);

  const lines = [
    `## Tax Nexus Status`,
    '',
    reached.length > 0 ? `**⚠️ ${reached.length} threshold(s) reached — register and file now**` : '',
    approaching.length > 0 ? `**📊 ${approaching.length} jurisdiction(s) approaching threshold**` : '',
    '',
    '| Jurisdiction | Metric | Progress | Period |',
    '|-------------|--------|----------|--------|',
  ];

  for (const a of data) {
    const bar = a.thresholdReached ? '🔴 REACHED' : a.percentageOfThreshold >= 75 ? `🟡 ${a.percentageOfThreshold.toFixed(0)}%` : `🟢 ${a.percentageOfThreshold.toFixed(0)}%`;
    const value = a.metricType === 'revenue' ? fmt(a.currentValue) : `${a.currentValue} txns`;
    const threshold = a.metricType === 'revenue' ? fmt(a.threshold) : `${a.threshold} txns`;
    lines.push(`| ${a.jurisdictionName} | ${a.metricType} | ${bar} (${value} / ${threshold}) | ${a.periodStart} → ${a.periodEnd} |`);
  }

  return { success: true, result: data, output: lines.filter((l) => l !== '').join('\n') };
};

// ─────────────────────────────────────────────────────────
// TOOL 5 — Localize price for a country
// ─────────────────────────────────────────────────────────

const localizePrice: KitToolHandler = async (input, ctx) => {
  const amount = (input.amount as number) ?? 9900; // $99
  const baseCurrency = (input.base_currency as string) ?? 'USD';
  const country = (input.country as string) ?? 'US';

  const result = await compliancePost('localize-price', ctx, {
    amount,
    baseCurrency,
    customerCountry: country,
  });

  const d = result.data;
  if (!d) return { success: false, error: 'Localization failed' };

  const lines = [
    `## Price Localization — ${country}`,
    '',
    `| Field | Value |`,
    `|-------|-------|`,
    `| Original Price | ${fmt(d.originalAmount)} ${d.baseCurrency} |`,
    `| Localized Price | ${fmt(d.localizedAmount)} ${d.targetCurrency} |`,
    `| Multiplier | ${d.multiplier.toFixed(2)}x |`,
    `| Strategy | ${d.strategy.replace(/_/g, ' ')} |`,
    `| Currency | ${d.targetCurrency} |`,
  ];

  const savings = d.originalAmount - d.localizedAmount;
  if (savings > 0) {
    lines.push(`| Savings | ${fmt(savings)} (${((savings / d.originalAmount) * 100).toFixed(0)}% off) |`);
  }

  return { success: true, result: d, output: lines.join('\n') };
};

// ─────────────────────────────────────────────────────────
// MANIFEST
// ─────────────────────────────────────────────────────────

export const manifest: KitManifest = {
  id: 'compliance-safety',
  name: 'Compliance & Safety',
  description: 'Fraud detection, dunning recovery, multi-jurisdiction tax, and price localization',
  version: '1.0.0',
  ventureScope: '*',
  tools: [
    {
      name: 'compliance_score_transaction',
      description: 'Score a transaction for fraud risk. Returns a 0-100 risk score, decision (allow/review/block), and detailed signals.',
      inputSchema: {
        type: 'object',
        properties: {
          transaction_id:          { type: 'string',  description: 'Unique transaction ID to score' },
          amount:                  { type: 'number',  description: 'Transaction amount in cents (e.g. 9900 = $99)' },
          currency:                { type: 'string',  description: 'Currency code (default: USD)' },
          customer_id:             { type: 'string',  description: 'Customer ID for velocity checks' },
          customer_country:        { type: 'string',  description: 'ISO 3166-1 alpha-2 country of customer (e.g. US, DE)' },
          payment_method_country:  { type: 'string',  description: 'Country of the payment method for geo mismatch check' },
          customer_created_at:     { type: 'string',  description: 'ISO timestamp of account creation for age check' },
        },
        required: ['transaction_id', 'amount'],
      },
    },
    {
      name: 'compliance_dunning_stats',
      description: 'Show dunning recovery statistics: active cases, recovery rate, revenue at risk.',
      inputSchema: {
        type: 'object',
        properties: {},
      },
    },
    {
      name: 'compliance_calculate_tax',
      description: 'Calculate applicable taxes for a customer location. Handles US sales tax, EU VAT (inclusive), Canadian HST/QST, Australian GST, B2B reverse charge.',
      inputSchema: {
        type: 'object',
        properties: {
          amount:           { type: 'number',  description: 'Amount in cents to calculate tax on' },
          country:          { type: 'string',  description: 'Customer country ISO 3166-1 alpha-2 (e.g. US, DE, CA, GB, AU)' },
          state:            { type: 'string',  description: 'State/province code for US or Canada (e.g. CA, ON, QC)' },
          is_b2b:           { type: 'boolean', description: 'Is this a B2B transaction? Enables reverse charge for EU.' },
          customer_vat_id:  { type: 'string',  description: 'Customer VAT ID for B2B EU reverse charge' },
          description:      { type: 'string',  description: 'Product/service description' },
        },
        required: ['amount', 'country'],
      },
    },
    {
      name: 'compliance_check_nexus',
      description: 'Check tax nexus thresholds and alert on jurisdictions where registration is required. Shows progress toward revenue and transaction thresholds.',
      inputSchema: {
        type: 'object',
        properties: {},
      },
    },
    {
      name: 'compliance_localize_price',
      description: 'Localize a price for a specific country using PPP multipliers or exchange rates. Returns the adjusted price and the strategy applied.',
      inputSchema: {
        type: 'object',
        properties: {
          amount:         { type: 'number', description: 'Price in cents to localize (e.g. 9900 = $99)' },
          base_currency:  { type: 'string', description: 'Base currency code (default: USD)' },
          country:        { type: 'string', description: 'Target country ISO 3166-1 alpha-2 (e.g. IN, BR, MX)' },
        },
        required: ['amount', 'country'],
      },
    },
  ],
};

export const handlers: Record<string, KitToolHandler> = {
  compliance_score_transaction: scoreTransaction,
  compliance_dunning_stats:     dunningStats,
  compliance_calculate_tax:     calculateTax,
  compliance_check_nexus:       checkNexus,
  compliance_localize_price:    localizePrice,
};
