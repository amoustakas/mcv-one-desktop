// src/lib/kits/builtin/creator-kit.ts
// Creator Economy Kit — royalties, escrow, transaction intelligence
// Kit id: 'creator-economy'

import type { KitManifest, KitToolHandler, KitExecutionContext } from '../types';

// ─────────────────────────────────────────────────────────
// API HELPERS
// ─────────────────────────────────────────────────────────

async function creatorGet(
  action: string,
  params: Record<string, string | number | boolean | undefined>,
  ctx: KitExecutionContext,
): Promise<{ data: unknown; meta?: unknown }> {
  const query = new URLSearchParams({ action, ventureId: ctx.ventureId });
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null && String(v) !== '') query.set(k, String(v));
  }
  const res = await ctx.fetch(`/api/creator?${query.toString()}`);
  if (!res.ok) {
    const e = await res.json().catch(() => ({})) as { error?: string };
    throw new Error(e.error ?? `Creator API ${res.status}`);
  }
  return res.json() as Promise<{ data: unknown; meta?: unknown }>;
}

async function creatorPost(
  action: string,
  body: Record<string, unknown>,
  ctx: KitExecutionContext,
): Promise<{ data: unknown }> {
  const res = await ctx.fetch('/api/creator', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action, ventureId: ctx.ventureId, ...body }),
  });
  if (!res.ok) {
    const e = await res.json().catch(() => ({})) as { error?: string };
    throw new Error(e.error ?? `Creator API ${res.status}`);
  }
  return res.json() as Promise<{ data: unknown }>;
}

// ─────────────────────────────────────────────────────────
// TOOL 1: creator_list_royalties
// ─────────────────────────────────────────────────────────

const listRoyalties: KitToolHandler = async (_input, ctx) => {
  const result = await creatorGet('list-agreements', {}, ctx);
  const agreements = (result.data as Array<Record<string, unknown>>) ?? [];

  if (agreements.length === 0) {
    return { success: true, data: [], displayMarkdown: 'No royalty agreements found.' };
  }

  const header = '| Product | Creator | Type | Splits | Resale % |\n|---------|---------|------|--------|----------|\n';
  const rows = agreements.map(a => {
    const splits = (a.royalty_splits as Array<{ recipient_id: string; percentage: number }>) ?? [];
    const splitStr = splits.map(s => `${s.recipient_id.slice(0, 8)}: ${s.percentage}%`).join(', ');
    return `| ${String(a.product_id).slice(0, 8)} | ${String(a.creator_id).slice(0, 12)} | ${a.royalty_type} | ${splitStr} | ${a.resale_royalty_percent}% |`;
  }).join('\n');

  return {
    success: true,
    data: agreements,
    displayMarkdown: `## Royalty Agreements (${agreements.length})\n\n${header}${rows}`,
  };
};

// ─────────────────────────────────────────────────────────
// TOOL 2: creator_get_earnings
// ─────────────────────────────────────────────────────────

const getEarnings: KitToolHandler = async (input, ctx) => {
  if (!input.creatorId) {
    return { success: false, error: 'creatorId is required for creator_get_earnings' };
  }

  const result = await creatorGet('get-earnings', { creatorId: input.creatorId as string }, ctx);
  const data = result.data as { totalEarned: number; pendingPayout: number; distributions: unknown[] };

  return {
    success: true,
    data,
    displayMarkdown: [
      `## Creator Earnings — ${input.creatorId}`,
      '',
      `- **Total Earned:** $${Number(data.totalEarned).toFixed(2)}`,
      `- **Pending Payout:** $${Number(data.pendingPayout).toFixed(2)}`,
      `- **Distribution Count:** ${data.distributions.length}`,
    ].join('\n'),
  };
};

// ─────────────────────────────────────────────────────────
// TOOL 3: creator_list_escrows
// ─────────────────────────────────────────────────────────

const listEscrows: KitToolHandler = async (input, ctx) => {
  const params: Record<string, string> = {};
  if (input.status) params.status = String(input.status);

  await creatorGet('list-transactions', { ...params, type: 'escrow_hold' }, ctx);
  // Fetch actual escrow_agreements
  const escrowResult = await creatorGet('list-agreements', {}, ctx);
  const escrows = (escrowResult.data as Array<Record<string, unknown>>) ?? [];

  if (escrows.length === 0) {
    return { success: true, data: [], displayMarkdown: 'No escrow agreements found.' };
  }

  const header = '| ID | Buyer | Seller | Amount | Status | Release |\n|----|-------|--------|--------|--------|---------|\n';
  const rows = escrows.map(e => {
    return `| ${String(e.id).slice(0, 8)} | ${String(e.buyer_id).slice(0, 10)} | ${String(e.seller_id).slice(0, 10)} | $${Number(e.amount).toFixed(2)} ${e.currency} | ${e.status} | ${e.release_condition} |`;
  }).join('\n');

  return {
    success: true,
    data: escrows,
    displayMarkdown: `## Escrow Agreements (${escrows.length})\n\n${header}${rows}`,
  };
};

// ─────────────────────────────────────────────────────────
// TOOL 4: creator_search_transactions (the receipt killer)
// ─────────────────────────────────────────────────────────

const searchTransactions: KitToolHandler = async (input, ctx) => {
  const body: Record<string, unknown> = {};
  if (input.type)        body.type        = input.type;
  if (input.status)      body.status      = input.status;
  if (input.customerId)  body.customerId  = input.customerId;
  if (input.rail)        body.rail        = input.rail;
  if (input.query)       body.query       = input.query;
  if (input.dateFrom)    body.dateFrom    = input.dateFrom;
  if (input.dateTo)      body.dateTo      = input.dateTo;
  if (input.amountMin)   body.amountMin   = input.amountMin;
  if (input.amountMax)   body.amountMax   = input.amountMax;
  body.limit  = input.limit  ?? 20;
  body.offset = input.offset ?? 0;

  const result = await creatorPost('search-transactions', body, ctx);
  const transactions = (result.data as Array<Record<string, unknown>>) ?? [];

  if (transactions.length === 0) {
    return { success: true, data: [], displayMarkdown: 'No transactions found matching your criteria.' };
  }

  const header = '| # | Type | Status | Amount | Rail | Timestamp |\n|---|------|--------|--------|------|-----------|' + '\n';
  const rows = transactions.map(t => {
    const ts = new Date(t.timestamp as string).toLocaleDateString();
    return `| ${t.transaction_number} | ${t.type} | ${t.status} | $${Number(t.amount).toFixed(2)} ${t.currency} | ${t.rail ?? '—'} | ${ts} |`;
  }).join('\n');

  return {
    success: true,
    data: transactions,
    displayMarkdown: `## Transactions (${transactions.length})\n\n${header}${rows}`,
  };
};

// ─────────────────────────────────────────────────────────
// TOOL 5: creator_get_transaction (with full provenance)
// ─────────────────────────────────────────────────────────

const getTransaction: KitToolHandler = async (input, ctx) => {
  if (!input.id) {
    return { success: false, error: 'id is required for creator_get_transaction' };
  }

  const result = await creatorGet('get-transaction', { id: input.id as string }, ctx);
  const tx = result.data as Record<string, unknown>;

  if (!tx) {
    return { success: false, error: `Transaction ${input.id} not found` };
  }

  const events = (tx.events as Array<{ timestamp: string; event: string; actor: string | null }>) ?? [];
  const related = (tx.related_records as Array<{ type: string; id: string; relationship: string }>) ?? [];

  const lines = [
    `## Transaction ${tx.transaction_number}`,
    '',
    `- **Type:** ${tx.type}`,
    `- **Status:** ${tx.status}`,
    `- **Amount:** $${Number(tx.amount).toFixed(2)} ${tx.currency}`,
    `- **Net Amount:** $${Number(tx.net_amount).toFixed(2)} ${tx.currency}`,
    `- **Rail:** ${tx.rail ?? '—'}`,
    `- **Payer:** ${tx.payer_id} (${tx.payer_type})`,
    `- **Payee:** ${tx.payee_id} (${tx.payee_type})`,
    `- **Timestamp:** ${new Date(tx.timestamp as string).toISOString()}`,
  ];

  if (events.length > 0) {
    lines.push('', '### Event Timeline');
    for (const e of events) {
      lines.push(`- \`${e.event}\` — ${new Date(e.timestamp).toLocaleString()} by ${e.actor ?? 'system'}`);
    }
  }

  if (related.length > 0) {
    lines.push('', '### Related Records');
    for (const r of related) {
      lines.push(`- **${r.relationship}** → ${r.type} \`${r.id}\``);
    }
  }

  return {
    success: true,
    data: tx,
    displayMarkdown: lines.join('\n'),
  };
};

// ─────────────────────────────────────────────────────────
// MANIFEST + HANDLERS
// ─────────────────────────────────────────────────────────

export const manifest: KitManifest = {
  id: 'creator-economy',
  name: 'Creator Economy',
  version: '1.0.0',
  description: 'Royalty management, milestone-based escrow, and full-provenance transaction intelligence. Receipts are dead.',
  author: 'MCV One',
  capabilities: ['supabase', 'network'],
  runtime: 'inline',
  ventureScope: '*',
  instructions: `
You have access to creator economy tools:
- creator_list_royalties: List all royalty agreements for a venture
- creator_get_earnings: Get total earnings for a specific creator (requires creatorId)
- creator_list_escrows: List all escrow agreements with statuses
- creator_search_transactions: Search transaction records by type, status, date, amount, customer, or text query — this replaces receipts
- creator_get_transaction: Get a single transaction with full provenance chain and event timeline

When users ask about payments, revenue, money received/sent, receipts, or escrow — use these tools.
For transaction search, always pass a meaningful query/filter to narrow results.
`.trim(),
  tools: [
    {
      name: 'creator_list_royalties',
      description: 'List all royalty agreements for the current venture, including splits per recipient.',
      input_schema: {
        type: 'object',
        properties: {},
      },
    },
    {
      name: 'creator_get_earnings',
      description: 'Get total earnings, pending payout, and distribution history for a specific creator.',
      input_schema: {
        type: 'object',
        properties: {
          creatorId: {
            type: 'string',
            description: 'The creator user ID to look up earnings for',
          },
        },
        required: ['creatorId'],
      },
    },
    {
      name: 'creator_list_escrows',
      description: 'List all escrow agreements with buyer, seller, amount, status, and milestones.',
      input_schema: {
        type: 'object',
        properties: {
          status: {
            type: 'string',
            description: 'Filter by status: pending_funding, funded, in_progress, released, disputed, refunded',
          },
        },
      },
    },
    {
      name: 'creator_search_transactions',
      description: 'Search transaction records — the intelligence layer that replaces receipts. Filter by type, status, date range, amount, customer, payment rail, or free-text query.',
      input_schema: {
        type: 'object',
        properties: {
          type: {
            type: 'string',
            description: 'Filter by transaction type: purchase, subscription_renewal, refund, credit_grant, credit_consume, transfer, payout, royalty_distribution, yield_distribution, escrow_hold, escrow_release',
          },
          status: {
            type: 'string',
            description: 'Filter by status: initiated, processing, succeeded, failed, refunded, disputed, settled',
          },
          customerId: {
            type: 'string',
            description: 'Filter by payer or payee ID',
          },
          rail: {
            type: 'string',
            description: 'Filter by payment rail (stripe, solana, ach, etc.)',
          },
          query: {
            type: 'string',
            description: 'Free-text search against transaction number and access URL',
          },
          dateFrom: {
            type: 'string',
            description: 'ISO datetime — start of date range',
          },
          dateTo: {
            type: 'string',
            description: 'ISO datetime — end of date range',
          },
          amountMin: {
            type: 'number',
            description: 'Minimum transaction amount',
          },
          amountMax: {
            type: 'number',
            description: 'Maximum transaction amount',
          },
          limit: {
            type: 'number',
            description: 'Number of results to return (max 200, default 20)',
          },
          offset: {
            type: 'number',
            description: 'Pagination offset',
          },
        },
      },
    },
    {
      name: 'creator_get_transaction',
      description: 'Get a single transaction record with full event timeline and provenance chain (related records graph).',
      input_schema: {
        type: 'object',
        properties: {
          id: {
            type: 'string',
            description: 'Transaction UUID or transaction number (TXN-YYYY-MM-NNNNNN)',
          },
        },
        required: ['id'],
      },
    },
  ],
};

export const handlers: Record<string, KitToolHandler> = {
  creator_list_royalties:      listRoyalties,
  creator_get_earnings:        getEarnings,
  creator_list_escrows:        listEscrows,
  creator_search_transactions: searchTransactions,
  creator_get_transaction:     getTransaction,
};
