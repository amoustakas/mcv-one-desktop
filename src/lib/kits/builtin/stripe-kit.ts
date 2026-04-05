import type { KitManifest, KitToolHandler, KitExecutionContext } from '../types';

async function stripeApi(action: string, params: Record<string, unknown>, ctx: KitExecutionContext, method = 'GET') {
  const query = method === 'GET' ? `?action=${action}&${new URLSearchParams(params as Record<string, string>).toString()}` : '';
  const res = await ctx.fetch(`/api/stripe${query}`, {
    method: method === 'GET' ? 'GET' : 'POST',
    headers: { 'Content-Type': 'application/json' },
    ...(method !== 'GET' ? { body: JSON.stringify({ action, ...params }) } : {}),
  });
  if (!res.ok) { const e = await res.json().catch(() => ({})); throw new Error(e.error || `Stripe ${res.status}`); }
  return res.json();
}

const listCustomers: KitToolHandler = async (input, ctx) => {
  const data = await stripeApi('list-customers', { limit: input.limit ?? '10', email: input.email }, ctx);
  const custs = data.data ?? [];
  if (custs.length === 0) return { success: true, data: [], displayMarkdown: 'No customers found.' };
  const lines = custs.map((c: { id: string; email: string; name: string }) => `- **${c.name || 'No name'}** (${c.email}) — \`${c.id}\``);
  return { success: true, data: custs, displayMarkdown: `## Customers (${custs.length})\n\n${lines.join('\n')}` };
};

const getBalance: KitToolHandler = async (_input, ctx) => {
  const data = await stripeApi('get-balance', {}, ctx);
  const available = data.available?.map((b: { amount: number; currency: string }) => `${b.currency.toUpperCase()}: $${(b.amount / 100).toFixed(2)}`).join(', ') || 'N/A';
  const pending = data.pending?.map((b: { amount: number; currency: string }) => `${b.currency.toUpperCase()}: $${(b.amount / 100).toFixed(2)}`).join(', ') || 'N/A';
  return { success: true, data, displayMarkdown: `## Stripe Balance\n\n**Available:** ${available}\n**Pending:** ${pending}` };
};

const listPayments: KitToolHandler = async (input, ctx) => {
  const data = await stripeApi('list-payments', { limit: input.limit ?? '10', customer: input.customer }, ctx);
  const payments = data.data ?? [];
  if (payments.length === 0) return { success: true, data: [], displayMarkdown: 'No payments found.' };
  const lines = payments.map((p: { id: string; amount: number; currency: string; status: string }) =>
    `- $${(p.amount / 100).toFixed(2)} ${p.currency.toUpperCase()} — **${p.status}** — \`${p.id}\``);
  return { success: true, data: payments, displayMarkdown: `## Payments (${payments.length})\n\n${lines.join('\n')}` };
};

const listSubscriptions: KitToolHandler = async (input, ctx) => {
  const data = await stripeApi('list-subscriptions', { limit: input.limit ?? '10', status: input.status ?? 'active' }, ctx);
  const subs = data.data ?? [];
  if (subs.length === 0) return { success: true, data: [], displayMarkdown: 'No subscriptions found.' };
  const lines = subs.map((s: { id: string; status: string; current_period_end: number }) =>
    `- **${s.status}** — renews ${new Date(s.current_period_end * 1000).toLocaleDateString()} — \`${s.id}\``);
  return { success: true, data: subs, displayMarkdown: `## Subscriptions (${subs.length})\n\n${lines.join('\n')}` };
};

const listInvoices: KitToolHandler = async (input, ctx) => {
  const data = await stripeApi('list-invoices', { limit: input.limit ?? '10', status: input.status }, ctx);
  const invoices = data.data ?? [];
  if (invoices.length === 0) return { success: true, data: [], displayMarkdown: 'No invoices found.' };
  const lines = invoices.map((inv: { id: string; amount_due: number; currency: string; status: string; number: string }) =>
    `- ${inv.number || inv.id} — $${(inv.amount_due / 100).toFixed(2)} ${inv.currency.toUpperCase()} — **${inv.status}**`);
  return { success: true, data: invoices, displayMarkdown: `## Invoices (${invoices.length})\n\n${lines.join('\n')}` };
};

const stripeOverview: KitToolHandler = async (_input, ctx) => {
  const data = await stripeApi('overview', {}, ctx);
  return { success: true, data, displayMarkdown: `## Stripe Overview\n\n- Balance: ${JSON.stringify(data.balance)}\n- Pending: ${JSON.stringify(data.pending)}\n- Recent customers: ${data.recent_customers}\n- Recent payments: ${data.recent_payments}\n- Active subscriptions: ${data.active_subscriptions}` };
};

export const manifest: KitManifest = {
  id: 'stripe-finance',
  name: 'Stripe Finance',
  version: '1.0.0',
  description: 'Stripe payment processing — customers, payments, subscriptions, invoices, balance, and revenue analytics.',
  author: 'MCV',
  capabilities: ['network', 'credentials'],
  runtime: 'inline',
  ventureScope: '*',
  instructions: 'Use stripe tools for financial data, payment management, customer queries, and revenue reporting.',
  tools: [
    { name: 'stripe_list_customers', description: 'List Stripe customers. Optionally filter by email.', input_schema: { type: 'object', properties: { limit: { type: 'string', description: 'Max results (default 10)' }, email: { type: 'string', description: 'Filter by email' } } } },
    { name: 'stripe_get_balance', description: 'Get current Stripe account balance (available + pending).', input_schema: { type: 'object', properties: {} } },
    { name: 'stripe_list_payments', description: 'List payment intents. Optionally filter by customer.', input_schema: { type: 'object', properties: { limit: { type: 'string' }, customer: { type: 'string', description: 'Customer ID filter' } } } },
    { name: 'stripe_list_subscriptions', description: 'List subscriptions. Optionally filter by status.', input_schema: { type: 'object', properties: { limit: { type: 'string' }, status: { type: 'string', description: 'active, past_due, canceled, etc.' } } } },
    { name: 'stripe_list_invoices', description: 'List invoices. Optionally filter by status.', input_schema: { type: 'object', properties: { limit: { type: 'string' }, status: { type: 'string', description: 'draft, open, paid, void, uncollectible' } } } },
    { name: 'stripe_overview', description: 'Get Stripe dashboard summary: balance, recent payments, subscriptions, customers.', input_schema: { type: 'object', properties: {} } },
  ],
};

export const handlers: Record<string, KitToolHandler> = {
  stripe_list_customers: listCustomers,
  stripe_get_balance: getBalance,
  stripe_list_payments: listPayments,
  stripe_list_subscriptions: listSubscriptions,
  stripe_list_invoices: listInvoices,
  stripe_overview: stripeOverview,
};
