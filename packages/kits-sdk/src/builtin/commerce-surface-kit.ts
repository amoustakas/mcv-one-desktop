// src/lib/kits/builtin/commerce-surface-kit.ts
// Commerce Surface Kit — Cart, Customer, Inventory, Fulfillment, Reviews, Analytics, Search
// 8 agent tools for the Commerce Surface Layer

import type { KitManifest, KitToolHandler, KitExecutionContext } from '../types';

// ─────────────────────────────────────────────────────────
// API HELPER
// ─────────────────────────────────────────────────────────

async function surfaceApi(
  action: string,
  params: Record<string, unknown>,
  ctx: KitExecutionContext,
) {
  const query = new URLSearchParams({ action, ventureId: ctx.ventureId });
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null && String(v) !== '') query.set(k, String(v));
  }
  const res = await ctx.fetch(`/api/commerce-surface?${query.toString()}`);
  if (!res.ok) {
    const e = await res.json().catch(() => ({})) as { error?: string };
    throw new Error(e.error ?? `Commerce Surface API ${res.status}`);
  }
  return res.json() as Promise<{ data: unknown }>;
}

// ─────────────────────────────────────────────────────────
// TOOL HANDLERS
// ─────────────────────────────────────────────────────────

const surfaceSearchProducts: KitToolHandler = async (input, ctx) => {
  if (!input.query) {
    return { success: false, error: 'query is required for surface_search_products' };
  }
  const result = await surfaceApi('search', { query: String(input.query) }, ctx);
  const data = result.data as { query: string; totalCount: number; products: Array<{ productId: string; name: string; score: number; highlight: string | null }> } | null;

  if (!data || data.products.length === 0) {
    return {
      success: true,
      data: [],
      displayMarkdown: `No products found matching **"${input.query}"**.`,
    };
  }

  const lines = data.products.slice(0, 20).map((p) => {
    const score = (p.score * 100).toFixed(0);
    const hl = p.highlight ? ` — ${p.highlight.slice(0, 80)}` : '';
    return `- **${p.name}** (relevance: ${score}%)${hl}`;
  });

  return {
    success: true,
    data: data.products,
    displayMarkdown: `## Search: "${data.query}" — ${data.totalCount} result(s)\n\n${lines.join('\n')}`,
  };
};

const surfaceGetCart: KitToolHandler = async (input, ctx) => {
  if (!input.cartId) {
    return { success: false, error: 'cartId is required for surface_get_cart' };
  }
  const result = await surfaceApi('get-cart', { cartId: String(input.cartId) }, ctx);
  const cart = result.data as {
    id: string; total: number; subtotal: number; discount_total: number; tax_total: number;
    shipping_total: number; currency: string; items: Array<{ product_id: string; quantity: number; total_price: number }>;
    abandoned_at: string | null;
  } | null;

  if (!cart) {
    return { success: true, data: null, displayMarkdown: 'Cart not found.' };
  }

  const items = cart.items ?? [];
  const itemLines = items.map((i) => `- Product \`${i.product_id}\` × ${i.quantity} = $${Number(i.total_price).toFixed(2)}`);

  const summary = [
    `**Subtotal:** $${Number(cart.subtotal).toFixed(2)}`,
    cart.discount_total > 0 ? `**Discount:** -$${Number(cart.discount_total).toFixed(2)}` : null,
    `**Tax:** $${Number(cart.tax_total).toFixed(2)}`,
    `**Shipping:** $${Number(cart.shipping_total).toFixed(2)}`,
    `**Total:** $${Number(cart.total).toFixed(2)} ${cart.currency}`,
  ].filter(Boolean).join(' | ');

  const abandonedNote = cart.abandoned_at ? '\n\n> Cart is marked as abandoned.' : '';

  return {
    success: true,
    data: cart,
    displayMarkdown: `## Cart \`${cart.id}\`\n\n${itemLines.join('\n') || 'Cart is empty.'}\n\n${summary}${abandonedNote}`,
  };
};

const surfaceGetAbandonedCarts: KitToolHandler = async (input, ctx) => {
  const olderThanHours = input.olderThanHours ? String(input.olderThanHours) : '1';
  const result = await surfaceApi('get-abandoned-carts', { olderThanHours }, ctx);
  const carts = (result.data as Array<{
    id: string; total: number; currency: string;
    abandoned_at: string; customer_id: string | null; recovery_email_sent: boolean;
  }>) ?? [];

  if (carts.length === 0) {
    return {
      success: true,
      data: [],
      displayMarkdown: 'No abandoned carts found.',
    };
  }

  const totalValue = carts.reduce((s, c) => s + Number(c.total ?? 0), 0);
  const unreachable = carts.filter((c) => !c.customer_id).length;

  const header = '| Cart ID | Customer | Value | Abandoned At | Recovery Sent |\n|---------|----------|-------|-------------|---------------|\n';
  const rows = carts.map((c) => {
    const when = new Date(c.abandoned_at).toLocaleString();
    const custId = c.customer_id ? c.customer_id.slice(0, 12) + '…' : 'Guest';
    return `| \`${c.id.slice(0, 12)}\` | ${custId} | $${Number(c.total).toFixed(2)} ${c.currency} | ${when} | ${c.recovery_email_sent ? 'Yes' : 'No'} |`;
  }).join('\n');

  return {
    success: true,
    data: carts,
    displayMarkdown: `## Abandoned Carts (${carts.length})\n\n**Revenue at risk:** $${totalValue.toFixed(2)} | **Guest carts:** ${unreachable}\n\n${header}${rows}`,
  };
};

const surfaceListCustomers: KitToolHandler = async (input, ctx) => {
  const result = await surfaceApi('list-customers', {
    segment: input.segment ?? '',
    limit: input.limit ?? 50,
    offset: input.offset ?? 0,
  }, ctx);
  const customers = (result.data as Array<{
    id: string; email: string; first_name: string; last_name: string;
    total_orders: number; total_spent: number; segments: string[];
  }>) ?? [];

  if (customers.length === 0) {
    return { success: true, data: [], displayMarkdown: 'No customers found.' };
  }

  const segFilter = input.segment ? ` (segment: ${input.segment})` : '';
  const header = '| Name | Email | Orders | Total Spent | Segments |\n|------|-------|--------|-------------|----------|\n';
  const rows = customers.map((c) => {
    const name = `${c.first_name} ${c.last_name}`;
    const segs = (c.segments ?? []).join(', ') || '—';
    return `| ${name} | ${c.email} | ${c.total_orders} | $${Number(c.total_spent).toFixed(2)} | ${segs} |`;
  }).join('\n');

  return {
    success: true,
    data: customers,
    displayMarkdown: `## Customers${segFilter} (${customers.length})\n\n${header}${rows}`,
  };
};

const surfaceGetLowStock: KitToolHandler = async (input, ctx) => {
  const threshold = input.threshold ? String(input.threshold) : '10';
  const result = await surfaceApi('get-low-stock', { threshold }, ctx);
  const items = (result.data as Array<{
    product_id: string; available: number; low_stock_threshold: number;
    location_id: string; products?: { name: string };
  }>) ?? [];

  if (items.length === 0) {
    return {
      success: true,
      data: [],
      displayMarkdown: `No low stock products (threshold: ${threshold} units).`,
    };
  }

  const critical = items.filter((i) => i.available === 0);
  const header = '| Product | Available | Threshold | Location |\n|---------|-----------|-----------|----------|\n';
  const rows = items.map((i) => {
    const name = i.products?.name ?? i.product_id;
    const urgency = i.available === 0 ? ' 🔴' : ' ⚠️';
    return `| ${name}${urgency} | ${i.available} | ${i.low_stock_threshold} | \`${i.location_id.slice(0, 12)}\` |`;
  }).join('\n');

  const summary = critical.length > 0 ? `**${critical.length} product(s) completely out of stock.**` : `All items have some stock remaining.`;

  return {
    success: true,
    data: items,
    displayMarkdown: `## Low Stock Alert — ${items.length} product(s)\n\n${summary}\n\n${header}${rows}`,
  };
};

const surfaceGetUnfulfilled: KitToolHandler = async (_input, ctx) => {
  const result = await surfaceApi('get-unfulfilled', {}, ctx);
  const orders = (result.data as Array<{
    id: string; customer_id: string; total_amount: number;
    created_at: string; status: string; fulfillment_status: string;
  }>) ?? [];

  if (orders.length === 0) {
    return {
      success: true,
      data: [],
      displayMarkdown: 'No unfulfilled orders. All orders have been processed.',
    };
  }

  const totalValue = orders.reduce((s, o) => s + Number(o.total_amount ?? 0), 0);
  const header = '| Order ID | Customer | Amount | Status | Fulfillment | Ordered At |\n|----------|----------|--------|--------|-------------|------------|\n';
  const rows = orders.map((o) => {
    const orderedAt = new Date(o.created_at).toLocaleDateString();
    return `| \`${o.id.slice(0, 12)}\` | \`${o.customer_id.slice(0, 12)}\` | $${Number(o.total_amount).toFixed(2)} | ${o.status} | ${o.fulfillment_status} | ${orderedAt} |`;
  }).join('\n');

  return {
    success: true,
    data: orders,
    displayMarkdown: `## Unfulfilled Orders — ${orders.length} pending\n\n**Total value pending shipment:** $${totalValue.toFixed(2)}\n\n${header}${rows}`,
  };
};

const surfaceModerationQueue: KitToolHandler = async (_input, ctx) => {
  const result = await surfaceApi('get-moderation-queue', {}, ctx);
  const reviews = (result.data as Array<{
    id: string; product_id: string; customer_id: string;
    rating: number; title: string; body: string;
    is_verified_purchase: boolean; created_at: string;
  }>) ?? [];

  if (reviews.length === 0) {
    return {
      success: true,
      data: [],
      displayMarkdown: 'Moderation queue is empty. No reviews pending approval.',
    };
  }

  const verified = reviews.filter((r) => r.is_verified_purchase).length;
  const header = '| Rating | Product | Title | Verified | Submitted |\n|--------|---------|-------|----------|----------|\n';
  const rows = reviews.map((r) => {
    const stars = '★'.repeat(r.rating) + '☆'.repeat(5 - r.rating);
    const submitted = new Date(r.created_at).toLocaleDateString();
    return `| ${stars} | \`${r.product_id.slice(0, 12)}\` | ${r.title.slice(0, 40)} | ${r.is_verified_purchase ? 'Yes' : 'No'} | ${submitted} |`;
  }).join('\n');

  return {
    success: true,
    data: reviews,
    displayMarkdown: `## Review Moderation Queue — ${reviews.length} pending\n\n**Verified purchases:** ${verified} of ${reviews.length}\n\n${header}${rows}`,
  };
};

const surfaceGetAnalytics: KitToolHandler = async (input, ctx) => {
  const from = input.from ? String(input.from) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
  const to = input.to ? String(input.to) : new Date().toISOString();

  const result = await surfaceApi('get-analytics', { from, to }, ctx);
  const analytics = result.data as {
    funnel: { visitors: number; productViews: number; addedToCart: number; reachedCheckout: number; completed: number; conversionRate: number };
    cartAbandonment: { rate: number; recoveryRate: number; revenueRecovered: number };
    topProducts: Array<{ productId: string; revenue: number; unitsSold: number }>;
    customerAcquisitionCost: number;
    repeatPurchaseRate: number;
    averageOrderValue: number;
  } | null;

  if (!analytics) {
    return { success: true, data: null, displayMarkdown: 'No analytics data available.' };
  }

  const { funnel, cartAbandonment, topProducts } = analytics;

  const funnelLines = [
    `| Visitors | ${funnel.visitors} | 100% |`,
    `| Product Views | ${funnel.productViews} | ${funnel.visitors > 0 ? ((funnel.productViews / funnel.visitors) * 100).toFixed(1) : 0}% |`,
    `| Added to Cart | ${funnel.addedToCart} | ${funnel.visitors > 0 ? ((funnel.addedToCart / funnel.visitors) * 100).toFixed(1) : 0}% |`,
    `| Reached Checkout | ${funnel.reachedCheckout} | ${funnel.visitors > 0 ? ((funnel.reachedCheckout / funnel.visitors) * 100).toFixed(1) : 0}% |`,
    `| Completed | ${funnel.completed} | ${(funnel.conversionRate * 100).toFixed(2)}% |`,
  ].join('\n');

  const topProductLines = topProducts.slice(0, 5).map((p, i) =>
    `${i + 1}. \`${p.productId.slice(0, 16)}\` — $${Number(p.revenue).toFixed(2)} revenue, ${p.unitsSold} units`
  ).join('\n');

  const dateLabel = `${new Date(from).toLocaleDateString()} → ${new Date(to).toLocaleDateString()}`;

  return {
    success: true,
    data: analytics,
    displayMarkdown: `## Commerce Analytics — ${dateLabel}

### Conversion Funnel
| Stage | Count | Rate |
|-------|-------|------|
${funnelLines}

### Key Metrics
- **Average Order Value:** $${analytics.averageOrderValue.toFixed(2)}
- **Repeat Purchase Rate:** ${(analytics.repeatPurchaseRate * 100).toFixed(1)}%
- **Cart Abandonment Rate:** ${(cartAbandonment.rate * 100).toFixed(1)}%
- **Recovery Rate:** ${(cartAbandonment.recoveryRate * 100).toFixed(1)}%
- **Revenue Recovered:** $${cartAbandonment.revenueRecovered.toFixed(2)}

### Top Products by Revenue
${topProductLines || 'No orders in this period.'}`,
  };
};

// ─────────────────────────────────────────────────────────
// MANIFEST
// ─────────────────────────────────────────────────────────

export const manifest: KitManifest = {
  id: 'commerce-surface',
  name: 'Commerce Surface',
  version: '1.0.0',
  description:
    'Cart management, customer profiles, inventory tracking, order fulfillment, review moderation, and commerce analytics for MCV ventures.',
  author: 'MCV',
  capabilities: ['network', 'supabase'],
  runtime: 'inline',
  ventureScope: '*',
  instructions:
    'Use commerce surface tools when the user asks about shopping carts, abandoned cart recovery, customer segments, stock levels, unfulfilled orders, review approvals, or conversion analytics. Use surface_get_analytics proactively for commerce health checks.',
  tools: [
    {
      name: 'surface_search_products',
      description: 'Search products by keyword with relevance scoring. Returns matching products with highlights. Use for product discovery, category browsing, or finding specific items.',
      input_schema: {
        type: 'object',
        properties: {
          query: { type: 'string', description: 'Search query — product name, category, or keyword' },
        },
        required: ['query'],
      },
    },
    {
      name: 'surface_get_cart',
      description: 'View a specific shopping cart with all items, applied discounts, and order totals. Use when inspecting a customer\'s cart or debugging checkout issues.',
      input_schema: {
        type: 'object',
        properties: {
          cartId: { type: 'string', description: 'The cart session ID to inspect' },
        },
        required: ['cartId'],
      },
    },
    {
      name: 'surface_get_abandoned_carts',
      description: 'List abandoned carts with total revenue at risk. Use for recovery campaigns or to understand cart abandonment patterns. Shows guest vs. authenticated carts.',
      input_schema: {
        type: 'object',
        properties: {
          olderThanHours: {
            type: 'number',
            description: 'Only return carts abandoned for at least this many hours (default: 1)',
          },
        },
      },
    },
    {
      name: 'surface_list_customers',
      description: 'List customers with purchase stats and segments (new, repeat, high_value, whale, at_risk, dormant). Use for CRM analysis, campaign targeting, or churn monitoring.',
      input_schema: {
        type: 'object',
        properties: {
          segment: {
            type: 'string',
            description: 'Filter by customer segment: new | repeat | high_value | whale | at_risk | dormant | subscription_active',
          },
          limit: { type: 'number', description: 'Max results (default: 50)' },
        },
      },
    },
    {
      name: 'surface_get_low_stock',
      description: 'Get products with inventory below threshold. Use for restocking decisions or to alert when stock is running low before a promotion.',
      input_schema: {
        type: 'object',
        properties: {
          threshold: {
            type: 'number',
            description: 'Report products with stock at or below this level (default: 10)',
          },
        },
      },
    },
    {
      name: 'surface_get_unfulfilled',
      description: 'List all unfulfilled orders that need to be picked, packed, and shipped. Returns orders sorted by oldest first with total pending value.',
      input_schema: {
        type: 'object',
        properties: {},
      },
    },
    {
      name: 'surface_moderation_queue',
      description: 'Get all customer reviews pending moderation. Shows rating, title, verified purchase status. Use to process review approvals or flag spam.',
      input_schema: {
        type: 'object',
        properties: {},
      },
    },
    {
      name: 'surface_get_analytics',
      description: 'Full commerce analytics dashboard: conversion funnel, cart abandonment, top products, AOV, and repeat purchase rate for the specified date range.',
      input_schema: {
        type: 'object',
        properties: {
          from: { type: 'string', description: 'Start date ISO string (default: 30 days ago)' },
          to: { type: 'string', description: 'End date ISO string (default: now)' },
        },
      },
    },
  ],
};

// ─────────────────────────────────────────────────────────
// HANDLERS
// ─────────────────────────────────────────────────────────

export const handlers: Record<string, KitToolHandler> = {
  surface_search_products: surfaceSearchProducts,
  surface_get_cart: surfaceGetCart,
  surface_get_abandoned_carts: surfaceGetAbandonedCarts,
  surface_list_customers: surfaceListCustomers,
  surface_get_low_stock: surfaceGetLowStock,
  surface_get_unfulfilled: surfaceGetUnfulfilled,
  surface_moderation_queue: surfaceModerationQueue,
  surface_get_analytics: surfaceGetAnalytics,
};
