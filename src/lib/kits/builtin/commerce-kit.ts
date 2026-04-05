// src/lib/kits/builtin/commerce-kit.ts
// Commerce Operations Kit — products, subscriptions, invoices, loans

import type { KitManifest, KitToolHandler, KitExecutionContext } from '../types';

// ─────────────────────────────────────────────────────────
// API HELPER
// ─────────────────────────────────────────────────────────

async function commerceApi(
  action: string,
  params: Record<string, unknown>,
  ctx: KitExecutionContext,
) {
  const query = new URLSearchParams({ action, ventureId: ctx.ventureId });
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null && String(v) !== '') query.set(k, String(v));
  }
  const res = await ctx.fetch(`/api/commerce?${query.toString()}`);
  if (!res.ok) {
    const e = await res.json().catch(() => ({})) as { error?: string };
    throw new Error(e.error ?? `Commerce API ${res.status}`);
  }
  return res.json() as Promise<{ data: unknown }>;
}

// ─────────────────────────────────────────────────────────
// TOOL HANDLERS
// ─────────────────────────────────────────────────────────

const listProducts: KitToolHandler = async (input, ctx) => {
  const result = await commerceApi('list-products', {
    type: input.type ?? '',
    status: input.status ?? '',
  }, ctx);
  const products = (result.data as Array<{
    id: string; name: string; type: string; status: string;
    pricing: { default: { amount: number; currency: string } };
  }>) ?? [];

  if (products.length === 0) {
    return { success: true, data: [], displayMarkdown: 'No products found.' };
  }

  const typeFilter = input.type ? ` (type: ${input.type})` : '';
  const statusFilter = input.status ? ` (status: ${input.status})` : '';
  const header = '| Name | Type | Status | Price |\n|------|------|--------|-------|\n';
  const rows = products
    .map((p) => {
      const price = p.pricing?.default;
      const priceStr = price ? `$${Number(price.amount).toFixed(2)} ${price.currency}` : '—';
      return `| ${p.name} | ${p.type} | ${p.status} | ${priceStr} |`;
    })
    .join('\n');

  return {
    success: true,
    data: products,
    displayMarkdown: `## Products${typeFilter}${statusFilter} (${products.length})\n\n${header}${rows}`,
  };
};

const searchProducts: KitToolHandler = async (input, ctx) => {
  if (!input.query) {
    return { success: false, error: 'query is required for commerce_search_products' };
  }
  const result = await commerceApi('search-products', { query: input.query }, ctx);
  const products = (result.data as Array<{
    id: string; name: string; type: string; description: string | null;
    pricing: { default: { amount: number; currency: string } };
  }>) ?? [];

  if (products.length === 0) {
    return {
      success: true,
      data: [],
      displayMarkdown: `No products matching "${input.query}".`,
    };
  }

  const lines = products.map((p) => {
    const price = p.pricing?.default;
    const priceStr = price ? `$${Number(price.amount).toFixed(2)} ${price.currency}` : '—';
    const desc = p.description ? ` — ${p.description.slice(0, 80)}` : '';
    return `- **${p.name}** (${p.type}) — ${priceStr}${desc}`;
  });

  return {
    success: true,
    data: products,
    displayMarkdown: `## Search Results: "${input.query}" (${products.length})\n\n${lines.join('\n')}`,
  };
};

const listSubscriptions: KitToolHandler = async (input, ctx) => {
  const result = await commerceApi('list-subscriptions', {
    status: input.status ?? '',
    customerId: input.customerId ?? '',
  }, ctx);
  const subs = (result.data as Array<{
    id: string; customer_id: string; plan_id: string; status: string;
    current_period_end: string; cancel_at_period_end: boolean; quantity: number;
  }>) ?? [];

  if (subs.length === 0) {
    return { success: true, data: [], displayMarkdown: 'No subscriptions found.' };
  }

  const active = subs.filter((s) => s.status === 'active' || s.status === 'trialing');
  const statusFilter = input.status ? ` (status: ${input.status})` : '';

  const header = '| Customer | Plan | Status | Period End | Qty |\n|----------|------|--------|------------|-----|\n';
  const rows = subs
    .map((s) => {
      const periodEnd = s.current_period_end
        ? new Date(s.current_period_end).toLocaleDateString()
        : '—';
      const cancelNote = s.cancel_at_period_end ? ' ⚠ cancels' : '';
      return `| ${s.customer_id.slice(0, 12)}… | ${s.plan_id} | ${s.status}${cancelNote} | ${periodEnd} | ${s.quantity} |`;
    })
    .join('\n');

  const summary = `**${active.length}** active / trialing out of ${subs.length} total subscriptions.`;

  return {
    success: true,
    data: subs,
    displayMarkdown: `## Subscriptions${statusFilter} (${subs.length})\n\n${summary}\n\n${header}${rows}`,
  };
};

const listInvoices: KitToolHandler = async (input, ctx) => {
  const result = await commerceApi('list-invoices', {
    status: input.status ?? '',
    customerId: input.customerId ?? '',
  }, ctx);
  const invoices = (result.data as Array<{
    id: string; invoice_number: string; customer_id: string; status: string;
    total: number; amount_due: number; amount_paid: number; due_date: string;
  }>) ?? [];

  if (invoices.length === 0) {
    return { success: true, data: [], displayMarkdown: 'No invoices found.' };
  }

  const totalAR = invoices.reduce((sum, inv) => sum + Number(inv.amount_due), 0);
  const overdue = invoices.filter((inv) => {
    const today = new Date().toISOString().split('T')[0];
    return ['sent', 'viewed', 'partial'].includes(inv.status) && inv.due_date < today;
  });

  const statusFilter = input.status ? ` (status: ${input.status})` : '';
  const header = '| Invoice # | Customer | Status | Total | Due | Due Date |\n|-----------|----------|--------|-------|-----|----------|\n';
  const rows = invoices
    .map((inv) => {
      const dueDate = inv.due_date ? new Date(inv.due_date).toLocaleDateString() : '—';
      return `| ${inv.invoice_number} | ${inv.customer_id.slice(0, 12)}… | ${inv.status} | $${Number(inv.total).toFixed(2)} | $${Number(inv.amount_due).toFixed(2)} | ${dueDate} |`;
    })
    .join('\n');

  const summary = [
    `**Total AR:** $${totalAR.toFixed(2)}`,
    overdue.length > 0 ? `**Overdue:** ${overdue.length} invoice(s)` : null,
  ].filter(Boolean).join(' | ');

  return {
    success: true,
    data: invoices,
    displayMarkdown: `## Invoices${statusFilter} (${invoices.length})\n\n${summary}\n\n${header}${rows}`,
  };
};

const listLoans: KitToolHandler = async (input, ctx) => {
  const result = await commerceApi('list-loans', {
    status: input.status ?? '',
  }, ctx);
  const loans = (result.data as Array<{
    id: string; customer_id: string; principal: number; outstanding_balance: number;
    interest_rate: number; term_months: number; status: string; next_payment_date: string | null;
  }>) ?? [];

  if (loans.length === 0) {
    return { success: true, data: [], displayMarkdown: 'No loans found.' };
  }

  const activeLoans = loans.filter((l) => l.status === 'disbursed' || l.status === 'repaying');
  const totalOutstanding = activeLoans.reduce((sum, l) => sum + Number(l.outstanding_balance), 0);
  const totalPrincipal = loans.reduce((sum, l) => sum + Number(l.principal), 0);

  const statusFilter = input.status ? ` (status: ${input.status})` : '';
  const header = '| Customer | Principal | Outstanding | Rate | Term | Status | Next Payment |\n|----------|-----------|-------------|------|------|--------|-------------|\n';
  const rows = loans
    .map((l) => {
      const nextPay = l.next_payment_date
        ? new Date(l.next_payment_date).toLocaleDateString()
        : '—';
      return `| ${l.customer_id.slice(0, 12)}… | $${Number(l.principal).toFixed(2)} | $${Number(l.outstanding_balance).toFixed(2)} | ${l.interest_rate}% | ${l.term_months}mo | ${l.status} | ${nextPay} |`;
    })
    .join('\n');

  const summary = [
    `**Portfolio Principal:** $${totalPrincipal.toFixed(2)}`,
    `**Outstanding Balance:** $${totalOutstanding.toFixed(2)}`,
    `**Active Loans:** ${activeLoans.length}`,
  ].join(' | ');

  return {
    success: true,
    data: loans,
    displayMarkdown: `## Loan Portfolio${statusFilter} (${loans.length})\n\n${summary}\n\n${header}${rows}`,
  };
};

const getOverdue: KitToolHandler = async (_input, ctx) => {
  const result = await commerceApi('get-overdue', {}, ctx);
  const invoices = (result.data as Array<{
    id: string; invoice_number: string; customer_id: string;
    total: number; amount_due: number; due_date: string; status: string;
  }>) ?? [];

  if (invoices.length === 0) {
    return {
      success: true,
      data: [],
      displayMarkdown: 'No overdue invoices. All accounts receivable are current.',
    };
  }

  const totalOverdue = invoices.reduce((sum, inv) => sum + Number(inv.amount_due), 0);
  const today = new Date();
  const lines = invoices.map((inv) => {
    const dueDate = new Date(inv.due_date);
    const daysOverdue = Math.floor((today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));
    return `- **${inv.invoice_number}** | Customer: \`${inv.customer_id.slice(0, 16)}\` | Due: $${Number(inv.amount_due).toFixed(2)} | ${daysOverdue}d overdue`;
  });

  return {
    success: true,
    data: invoices,
    displayMarkdown: `## Overdue Invoices — Action Required (${invoices.length})\n\n**Total Overdue AR:** $${totalOverdue.toFixed(2)}\n\n${lines.join('\n')}`,
  };
};

// ─────────────────────────────────────────────────────────
// MANIFEST
// ─────────────────────────────────────────────────────────

export const manifest: KitManifest = {
  id: 'commerce-ops',
  name: 'Commerce Operations',
  version: '1.0.0',
  description:
    'Product catalog, subscriptions, invoices, and loan portfolio management for MCV ventures.',
  author: 'MCV',
  capabilities: ['network', 'supabase'],
  runtime: 'inline',
  ventureScope: '*',
  instructions:
    'Use commerce tools when the user asks about products, subscriptions, MRR, invoices, accounts receivable, overdue payments, or loans. Use commerce_get_overdue proactively when discussing cash flow or collection issues.',
  tools: [
    {
      name: 'commerce_list_products',
      description:
        'List products in the venture catalog. Optionally filter by type (e.g. subscription, digital_download, service) or status (draft, active, archived).',
      input_schema: {
        type: 'object',
        properties: {
          type: {
            type: 'string',
            description:
              'Product type filter: physical_good | digital_download | subscription | metered | service | loan | investment | credit_pack | token | etc.',
          },
          status: {
            type: 'string',
            description: 'Status filter: draft | active | archived',
          },
        },
      },
    },
    {
      name: 'commerce_search_products',
      description:
        'Search products by name or description keyword. Returns active and draft products matching the query.',
      input_schema: {
        type: 'object',
        properties: {
          query: {
            type: 'string',
            description: 'Search term to match against product name and description',
          },
        },
        required: ['query'],
      },
    },
    {
      name: 'commerce_list_subscriptions',
      description:
        'List subscriptions for the venture with an MRR summary. Optionally filter by status or customer ID.',
      input_schema: {
        type: 'object',
        properties: {
          status: {
            type: 'string',
            description: 'Status filter: trialing | active | paused | past_due | canceled | unpaid',
          },
          customerId: {
            type: 'string',
            description: 'Filter by a specific customer ID',
          },
        },
      },
    },
    {
      name: 'commerce_list_invoices',
      description:
        'List invoices for the venture with an accounts receivable (AR) summary. Optionally filter by status or customer.',
      input_schema: {
        type: 'object',
        properties: {
          status: {
            type: 'string',
            description: 'Status filter: draft | sent | viewed | partial | paid | overdue | voided',
          },
          customerId: {
            type: 'string',
            description: 'Filter by a specific customer ID',
          },
        },
      },
    },
    {
      name: 'commerce_list_loans',
      description:
        'List loans in the venture loan portfolio with outstanding balance and portfolio totals. Optionally filter by status.',
      input_schema: {
        type: 'object',
        properties: {
          status: {
            type: 'string',
            description: 'Status filter: application | approved | disbursed | repaying | paid_off | defaulted',
          },
        },
      },
    },
    {
      name: 'commerce_get_overdue',
      description:
        'Get all overdue invoices for the venture — invoices past due date that are still unpaid or partially paid. Returns attention items with days overdue.',
      input_schema: {
        type: 'object',
        properties: {},
      },
    },
  ],
};

// ─────────────────────────────────────────────────────────
// HANDLERS
// ─────────────────────────────────────────────────────────

export const handlers: Record<string, KitToolHandler> = {
  commerce_list_products: listProducts,
  commerce_search_products: searchProducts,
  commerce_list_subscriptions: listSubscriptions,
  commerce_list_invoices: listInvoices,
  commerce_list_loans: listLoans,
  commerce_get_overdue: getOverdue,
};
