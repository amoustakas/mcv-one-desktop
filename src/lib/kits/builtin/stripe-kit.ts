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

const createCustomer: KitToolHandler = async (input, ctx) => {
  const d = await stripeApi('create-customer', { email: input.email, name: input.name, description: input.description }, ctx, 'POST');
  return { success: true, data: d, displayMarkdown: `**Customer created:** ${d.name || d.email} \`${d.id}\`` };
};

const updateCustomer: KitToolHandler = async (input, ctx) => {
  const d = await stripeApi('update-customer', { id: input.id, email: input.email, name: input.name, description: input.description }, ctx, 'POST');
  return { success: true, data: d, displayMarkdown: `**Customer updated:** \`${d.id}\`` };
};

const deleteCustomer: KitToolHandler = async (input, ctx) => {
  const d = await stripeApi('delete-customer', { id: input.id }, ctx, 'POST');
  return { success: true, data: d, displayMarkdown: `**Customer deleted:** \`${input.id}\`` };
};

const createProduct: KitToolHandler = async (input, ctx) => {
  const d = await stripeApi('create-product', { name: input.name, description: input.description }, ctx, 'POST');
  return { success: true, data: d, displayMarkdown: `**Product created:** ${d.name} \`${d.id}\`` };
};

const updateProduct: KitToolHandler = async (input, ctx) => {
  const d = await stripeApi('update-product', { id: input.id, name: input.name, description: input.description, active: input.active }, ctx, 'POST');
  return { success: true, data: d, displayMarkdown: `**Product updated:** \`${d.id}\`` };
};

const createPrice: KitToolHandler = async (input, ctx) => {
  const d = await stripeApi('create-price', { product: input.product, unit_amount: input.unit_amount, currency: input.currency, recurring: input.recurring }, ctx, 'POST');
  return { success: true, data: d, displayMarkdown: `**Price created:** $${((d.unit_amount ?? 0) / 100).toFixed(2)} ${d.currency?.toUpperCase()} \`${d.id}\`` };
};

const createSubscription: KitToolHandler = async (input, ctx) => {
  const d = await stripeApi('create-subscription', { customer: input.customer, price: input.price, trial_period_days: input.trial_period_days }, ctx, 'POST');
  return { success: true, data: d, displayMarkdown: `**Subscription created:** \`${d.id}\` status=${d.status}` };
};

const updateSubscription: KitToolHandler = async (input, ctx) => {
  const d = await stripeApi('update-subscription', { id: input.id, price: input.price }, ctx, 'POST');
  return { success: true, data: d, displayMarkdown: `**Subscription updated:** \`${d.id}\`` };
};

const refundPayment: KitToolHandler = async (input, ctx) => {
  const d = await stripeApi('refund-payment', { payment_intent: input.payment_intent, amount: input.amount, reason: input.reason }, ctx, 'POST');
  return { success: true, data: d, displayMarkdown: `**Refund created:** \`${d.id}\` — $${((d.amount ?? 0) / 100).toFixed(2)}` };
};

const createCoupon: KitToolHandler = async (input, ctx) => {
  const d = await stripeApi('create-coupon', { percent_off: input.percent_off, duration: input.duration, name: input.name }, ctx, 'POST');
  return { success: true, data: d, displayMarkdown: `**Coupon created:** ${d.name || d.id} — ${d.percent_off}% off (${d.duration})` };
};

const listDisputes: KitToolHandler = async (_input, ctx) => {
  const data = await stripeApi('list-disputes', {}, ctx);
  const disputes = data.data ?? [];
  if (disputes.length === 0) return { success: true, data: [], displayMarkdown: 'No disputes found.' };
  const lines = disputes.map((d: { id: string; amount: number; currency: string; status: string; reason: string }) =>
    `- $${(d.amount / 100).toFixed(2)} ${d.currency.toUpperCase()} — **${d.status}** (${d.reason}) \`${d.id}\``);
  return { success: true, data: disputes, displayMarkdown: `## Disputes (${disputes.length})\n\n${lines.join('\n')}` };
};

const createCheckout: KitToolHandler = async (input, ctx) => {
  const d = await stripeApi('create-checkout', { customer: input.customer, mode: input.mode, line_items: input.line_items, success_url: input.success_url }, ctx, 'POST');
  return { success: true, data: d, displayMarkdown: `**Checkout session created:** \`${d.id}\`\n\nURL: ${d.url || 'N/A'}` };
};

export const manifest: KitManifest = {
  id: 'stripe-finance',
  name: 'Stripe Finance',
  version: '2.0.0',
  description: 'Stripe payment processing — customers, payments, subscriptions, invoices, balance, products, prices, coupons, disputes, checkouts, and revenue analytics.',
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
    { name: 'stripe_create_customer', description: 'Create a new Stripe customer.', input_schema: { type: 'object', properties: { email: { type: 'string', description: 'Customer email' }, name: { type: 'string', description: 'Customer name' }, description: { type: 'string', description: 'Description' } }, required: ['email'] } },
    { name: 'stripe_update_customer', description: 'Update an existing Stripe customer.', input_schema: { type: 'object', properties: { id: { type: 'string', description: 'Customer ID' }, email: { type: 'string' }, name: { type: 'string' }, description: { type: 'string' } }, required: ['id'] } },
    { name: 'stripe_delete_customer', description: 'Delete a Stripe customer.', input_schema: { type: 'object', properties: { id: { type: 'string', description: 'Customer ID' } }, required: ['id'] } },
    { name: 'stripe_create_product', description: 'Create a new Stripe product.', input_schema: { type: 'object', properties: { name: { type: 'string', description: 'Product name' }, description: { type: 'string', description: 'Product description' } }, required: ['name'] } },
    { name: 'stripe_update_product', description: 'Update a Stripe product.', input_schema: { type: 'object', properties: { id: { type: 'string', description: 'Product ID' }, name: { type: 'string' }, description: { type: 'string' }, active: { type: 'boolean' } }, required: ['id'] } },
    { name: 'stripe_create_price', description: 'Create a price for a product.', input_schema: { type: 'object', properties: { product: { type: 'string', description: 'Product ID' }, unit_amount: { type: 'number', description: 'Amount in cents' }, currency: { type: 'string', description: 'Currency code (e.g. usd)' }, recurring: { type: 'object', description: 'Recurring interval config (e.g. {interval: "month"})' } }, required: ['product', 'unit_amount', 'currency'] } },
    { name: 'stripe_create_subscription', description: 'Create a subscription for a customer.', input_schema: { type: 'object', properties: { customer: { type: 'string', description: 'Customer ID' }, price: { type: 'string', description: 'Price ID' }, trial_period_days: { type: 'number', description: 'Trial days' } }, required: ['customer', 'price'] } },
    { name: 'stripe_update_subscription', description: 'Update a subscription price.', input_schema: { type: 'object', properties: { id: { type: 'string', description: 'Subscription ID' }, price: { type: 'string', description: 'New price ID' } }, required: ['id', 'price'] } },
    { name: 'stripe_refund_payment', description: 'Refund a payment intent (full or partial).', input_schema: { type: 'object', properties: { payment_intent: { type: 'string', description: 'Payment Intent ID' }, amount: { type: 'number', description: 'Refund amount in cents (omit for full refund)' }, reason: { type: 'string', description: 'Reason: duplicate, fraudulent, requested_by_customer' } }, required: ['payment_intent'] } },
    { name: 'stripe_create_coupon', description: 'Create a discount coupon.', input_schema: { type: 'object', properties: { percent_off: { type: 'number', description: 'Discount percentage' }, duration: { type: 'string', description: 'once, repeating, or forever' }, name: { type: 'string', description: 'Coupon name' } }, required: ['percent_off', 'duration'] } },
    { name: 'stripe_list_disputes', description: 'List all payment disputes.', input_schema: { type: 'object', properties: {} } },
    { name: 'stripe_create_checkout', description: 'Create a Checkout Session.', input_schema: { type: 'object', properties: { customer: { type: 'string', description: 'Customer ID' }, mode: { type: 'string', description: 'payment, subscription, or setup' }, line_items: { type: 'array', description: 'Line items array' }, success_url: { type: 'string', description: 'Redirect URL on success' } }, required: ['mode', 'line_items', 'success_url'] } },
  ],
};

export const handlers: Record<string, KitToolHandler> = {
  stripe_list_customers: listCustomers,
  stripe_get_balance: getBalance,
  stripe_list_payments: listPayments,
  stripe_list_subscriptions: listSubscriptions,
  stripe_list_invoices: listInvoices,
  stripe_overview: stripeOverview,
  stripe_create_customer: createCustomer,
  stripe_update_customer: updateCustomer,
  stripe_delete_customer: deleteCustomer,
  stripe_create_product: createProduct,
  stripe_update_product: updateProduct,
  stripe_create_price: createPrice,
  stripe_create_subscription: createSubscription,
  stripe_update_subscription: updateSubscription,
  stripe_refund_payment: refundPayment,
  stripe_create_coupon: createCoupon,
  stripe_list_disputes: listDisputes,
  stripe_create_checkout: createCheckout,
};
