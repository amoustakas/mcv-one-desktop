// src/lib/kits/builtin/payments-kit.ts
// Smart Payment Router kit — 4 agent tools for routing estimates, payment history,
// savings reporting, and processor health.

import type { KitManifest, KitToolHandler, KitExecutionContext } from '../types';

// ── API HELPER ───────────────────────────────────────────────────────────────

async function paymentsApi(
  action: string,
  params: Record<string, unknown>,
  ctx: KitExecutionContext,
) {
  const query = new URLSearchParams({ action, ventureId: ctx.ventureId });
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null && v !== '') query.set(k, String(v));
  }
  const res = await ctx.fetch(`/api/payments-router?${query.toString()}`);
  if (!res.ok) {
    const e = await res.json().catch(() => ({}));
    throw new Error((e as { error?: string }).error || `Payments API ${res.status}`);
  }
  return res.json();
}

// ── TOOL: payments_estimate_route ─────────────────────────────────────────────

const estimateRoute: KitToolHandler = async (input, ctx) => {
  if (!input.amount || Number(input.amount) <= 0) {
    return { success: false, error: 'amount must be a positive number' };
  }

  const data = await paymentsApi(
    'estimate-route',
    {
      amount:          input.amount,
      currency:        input.currency        ?? 'USD',
      customerCountry: input.customerCountry ?? 'US',
      paymentMethod:   input.paymentMethod   ?? '',
    },
    ctx,
  );

  const decision = data.data;
  if (!decision) {
    return { success: false, error: 'No routing decision returned' };
  }

  const rails: Array<{ id: string; name: string; fee: number; speed: string; score: number }> =
    decision.allRails ?? [];

  if (rails.length === 0) {
    return { success: true, data: decision, displayMarkdown: 'No eligible payment rails found.' };
  }

  // Build comparison table
  const colRail  = 20;
  const colFee   = 12;
  const colSpeed = 12;
  const colScore = 8;

  const pad = (s: string, n: number) => s.padEnd(n);

  const header  = `${pad('Rail', colRail)} | ${pad('Fee', colFee)} | ${pad('Speed', colSpeed)} | ${pad('Score', colScore)}`;
  const divider = `${'-'.repeat(colRail)}-+-${'-'.repeat(colFee)}-+-${'-'.repeat(colSpeed)}-+-${'-'.repeat(colScore)}`;

  const rows = rails.map((r) => {
    const feeStr   = `$${r.fee.toFixed(r.fee < 0.01 ? 4 : 2)}`;
    const scoreStr = r.score.toFixed(2);
    const tag      = r.id === decision.primaryRail ? ' ← RECOMMENDED' : '';
    return `${pad(r.name, colRail)} | ${pad(feeStr, colFee)} | ${pad(r.speed, colSpeed)} | ${pad(scoreStr, colScore)}${tag}`;
  });

  const amount   = Number(input.amount);
  const currency = (input.currency as string) ?? 'USD';
  const savings  = decision.savingsVsDefault ?? 0;
  const savingsNote =
    savings > 0
      ? `\n\n_Smart routing saves **$${savings.toFixed(2)}** vs Stripe card default for this transaction._`
      : '';

  const table = [header, divider, ...rows].join('\n');

  return {
    success: true,
    data: decision,
    displayMarkdown: `## Payment Route Estimate — ${currency} ${amount.toFixed(2)}\n\n\`\`\`\n${table}\n\`\`\`${savingsNote}`,
  };
};

// ── TOOL: payments_list_recent ────────────────────────────────────────────────

const listRecent: KitToolHandler = async (input, ctx) => {
  const data = await paymentsApi(
    'list-payments',
    { limit: input.limit ?? '10' },
    ctx,
  );

  const payments: Array<{
    id: string;
    created_at: string;
    amount: number;
    currency: string;
    status: string;
    primary_rail: string;
    savings_vs_default: number;
  }> = data.data ?? [];

  if (payments.length === 0) {
    return { success: true, data: [], displayMarkdown: 'No payments found.' };
  }

  const lines = payments.map((p) => {
    const date    = p.created_at ? new Date(p.created_at).toLocaleDateString() : '—';
    const savings = p.savings_vs_default > 0 ? ` _(saved $${p.savings_vs_default.toFixed(2)})_` : '';
    return `- **${date}** — ${p.currency} ${Number(p.amount).toFixed(2)} via \`${p.primary_rail ?? 'unknown'}\` — ${p.status}${savings}`;
  });

  return {
    success: true,
    data: payments,
    displayMarkdown: `## Recent Payments (${payments.length})\n\n${lines.join('\n')}`,
  };
};

// ── TOOL: payments_get_savings ────────────────────────────────────────────────

const getSavings: KitToolHandler = async (_input, ctx) => {
  const data = await paymentsApi('get-savings', {}, ctx);
  const stats = data.data;

  if (!stats) {
    return { success: false, error: 'No savings data returned' };
  }

  const savings      = Number(stats.totalSavings30d  ?? 0).toFixed(2);
  const volume       = Number(stats.totalVolume30d   ?? 0).toFixed(2);
  const count        = stats.paymentCount30d ?? 0;
  const rails        = stats.railBreakdown as Record<string, number> ?? {};

  const railLines = Object.entries(rails)
    .sort(([, a], [, b]) => b - a)
    .map(([rail, cnt]) => `  - \`${rail}\`: ${cnt} payments`)
    .join('\n');

  const savingsNote =
    Number(savings) > 0
      ? `Smart routing saved **$${savings}** over the last 30 days on **${count}** payments ($${volume} volume).`
      : `No savings recorded in the last 30 days (${count} payments, $${volume} volume).`;

  return {
    success: true,
    data: stats,
    displayMarkdown: `## Smart Routing Savings — Last 30 Days\n\n${savingsNote}\n\n**Rail Breakdown:**\n${railLines || '  _No data_'}`,
  };
};

// ── TOOL: payments_processor_health ──────────────────────────────────────────
// Calls getHealth() on all registered processors via the client-side router.
// Since kit handlers run in the browser, we can import paymentRouter directly.

const processorHealth: KitToolHandler = async (_input, _ctx) => {
  const { getSharedPaymentRouter } = await import('@mcv/payments-sdk/shared-router');
  const paymentRouter = getSharedPaymentRouter();
  if (!paymentRouter) {
    return {
      success: true,
      data: [],
      displayMarkdown: 'Payment router not configured in this runtime.',
    };
  }

  const processors = paymentRouter.getProcessors();

  if (processors.length === 0) {
    return { success: true, data: [], displayMarkdown: 'No processors registered.' };
  }

  const results = await Promise.allSettled(
    processors.map((p) => p.getHealth()),
  );

  const healthRows: Array<{
    id:          string;
    status:      string;
    latencyMs:   number;
    successRate: number;
    lastChecked: string;
  }> = [];

  for (let i = 0; i < processors.length; i++) {
    const r = results[i];
    const p = processors[i];
    if (r.status === 'fulfilled') {
      healthRows.push({
        id:          p.id,
        status:      r.value.status,
        latencyMs:   r.value.latencyMs,
        successRate: r.value.successRate,
        lastChecked: r.value.lastChecked,
      });
    } else {
      healthRows.push({
        id:          p.id,
        status:      'down',
        latencyMs:   -1,
        successRate: 0,
        lastChecked: new Date().toISOString(),
      });
    }
  }

  const statusEmoji = (s: string) =>
    s === 'healthy' ? '✅' : s === 'degraded' ? '⚠️' : '❌';

  const lines = healthRows.map((h) => {
    const rate = `${(h.successRate * 100).toFixed(1)}%`;
    const lat  = h.latencyMs >= 0 ? `${h.latencyMs}ms` : 'N/A';
    return `| ${h.id.padEnd(18)} | ${statusEmoji(h.status)} ${h.status.padEnd(8)} | ${lat.padEnd(8)} | ${rate.padEnd(8)} |`;
  });

  const header  = `| ${'Processor'.padEnd(18)} | ${'Status'.padEnd(10)} | ${'Latency'.padEnd(8)} | ${'Success'.padEnd(8)} |`;
  const divider = `|${'-'.repeat(20)}|${'-'.repeat(12)}|${'-'.repeat(10)}|${'-'.repeat(10)}|`;

  return {
    success: true,
    data: healthRows,
    displayMarkdown: `## Processor Health\n\n\`\`\`\n${header}\n${divider}\n${lines.join('\n')}\n\`\`\``,
  };
};

// ── MANIFEST ──────────────────────────────────────────────────────────────────

export const manifest: KitManifest = {
  id: 'payments-router',
  name: 'Smart Payment Router',
  version: '1.0.0',
  description:
    'Intelligent payment routing — compares rails (Stripe, Solana, Platform Credits) by cost and speed, tracks savings, and reports processor health.',
  author: 'MCV',
  capabilities: ['network', 'supabase'],
  runtime: 'inline',
  ventureScope: '*',
  instructions:
    'Use payments tools when the user asks about payment routing, transaction fees, rail selection, payment history, savings from smart routing, or processor uptime. Use payments_estimate_route before processing any payment to show cost comparison.',
  tools: [
    {
      name: 'payments_estimate_route',
      description:
        'Estimate the cheapest payment rail for a given amount. Shows a cost comparison table across Stripe, Solana, and Platform Credits with fees, speed, and scores.',
      input_schema: {
        type: 'object',
        properties: {
          amount: {
            type: 'number',
            description: 'Payment amount (e.g. 49.99)',
          },
          currency: {
            type: 'string',
            description: 'ISO currency code (default: USD)',
          },
          customerCountry: {
            type: 'string',
            description: '2-letter ISO country code of the customer (default: US)',
          },
          paymentMethod: {
            type: 'string',
            description:
              'Optional specific payment method: card | ach | usdc | sol | platform_credit | etc.',
          },
        },
        required: ['amount'],
      },
    },
    {
      name: 'payments_list_recent',
      description: 'List recent payments for the current venture, including rail used and savings per transaction.',
      input_schema: {
        type: 'object',
        properties: {
          limit: {
            type: 'number',
            description: 'Number of payments to return (default 10, max 100)',
          },
        },
      },
    },
    {
      name: 'payments_get_savings',
      description:
        'Show smart routing savings for the last 30 days — total dollars saved vs Stripe card default, volume processed, and rail breakdown.',
      input_schema: {
        type: 'object',
        properties: {},
      },
    },
    {
      name: 'payments_processor_health',
      description:
        'Show health status of all registered payment processors — uptime, latency, and success rate.',
      input_schema: {
        type: 'object',
        properties: {},
      },
    },
  ],
};

// ── HANDLERS ─────────────────────────────────────────────────────────────────

export const handlers: Record<string, KitToolHandler> = {
  payments_estimate_route:    estimateRoute,
  payments_list_recent:       listRecent,
  payments_get_savings:       getSavings,
  payments_processor_health:  processorHealth,
};
