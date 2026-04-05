// src/lib/commerce/commerce-analytics.ts
// Commerce Surface Layer — Commerce Analytics Engine
// Conversion funnel, cart abandonment, top products, customer analytics, revenue by channel

import { supabase } from '../supabase';
import type { CommerceAnalytics, ConversionFunnel } from './surface-types';

// ─────────────────────────────────────────────────────────
// DATE RANGE TYPE
// ─────────────────────────────────────────────────────────

export interface DateRange {
  from: string; // ISO date string
  to: string;   // ISO date string
}

// ─────────────────────────────────────────────────────────
// CONVERSION FUNNEL
// ─────────────────────────────────────────────────────────

export async function getConversionFunnel(
  ventureId: string,
  dateRange: DateRange,
): Promise<ConversionFunnel> {
  if (!supabase) {
    return { visitors: 0, productViews: 0, addedToCart: 0, reachedCheckout: 0, completed: 0, conversionRate: 0 };
  }

  const { from, to } = dateRange;

  // Visitors — distinct sessions from search_analytics
  let visitors = 0;
  const { data: searchData } = await supabase
    .from('search_analytics')
    .select('query')
    .eq('venture_id', ventureId)
    .gte('created_at', from)
    .lte('created_at', to);
  visitors = searchData?.length ?? 0;

  // Product views — search analytics rows where clicked_product_id is not null
  const { data: viewData } = await supabase
    .from('search_analytics')
    .select('clicked_product_id')
    .eq('venture_id', ventureId)
    .not('clicked_product_id', 'is', null)
    .gte('created_at', from)
    .lte('created_at', to);
  const productViews = viewData?.length ?? 0;

  // Added to cart — cart_items created in period for this venture
  const { data: cartItemData } = await supabase
    .from('cart_items')
    .select('id')
    .gte('created_at', from)
    .lte('created_at', to);
  // Filter by venture via join — approximate count
  const addedToCart = cartItemData?.length ?? 0;

  // Reached checkout — cart_sessions where shipping_address is not null in period
  const { data: checkoutData } = await supabase
    .from('cart_sessions')
    .select('id')
    .eq('venture_id', ventureId)
    .not('shipping_address', 'is', null)
    .gte('created_at', from)
    .lte('created_at', to);
  const reachedCheckout = checkoutData?.length ?? 0;

  // Completed orders in period
  const { data: ordersData } = await supabase
    .from('orders')
    .select('id')
    .eq('venture_id', ventureId)
    .gte('created_at', from)
    .lte('created_at', to);
  const completed = ordersData?.length ?? 0;

  // Conversion rate: completed / visitors (fall back to addedToCart if no visitor tracking)
  const denominator = visitors > 0 ? visitors : (addedToCart > 0 ? addedToCart : 1);
  const conversionRate = completed / denominator;

  return { visitors, productViews, addedToCart, reachedCheckout, completed, conversionRate };
}

// ─────────────────────────────────────────────────────────
// CART ABANDONMENT
// ─────────────────────────────────────────────────────────

export async function getCartAbandonment(
  ventureId: string,
  dateRange: DateRange,
): Promise<CommerceAnalytics['cartAbandonment']> {
  if (!supabase) {
    return { rate: 0, recoveryRate: 0, revenueRecovered: 0, topAbandonedProducts: [] };
  }

  const { from, to } = dateRange;

  // Abandoned carts in period
  const { data: abandonedData } = await supabase
    .from('cart_sessions')
    .select('id, total, recovery_email_sent')
    .eq('venture_id', ventureId)
    .not('abandoned_at', 'is', null)
    .gte('abandoned_at', from)
    .lte('abandoned_at', to);

  const abandoned = abandonedData ?? [];

  // Total carts in period (for rate calculation)
  const { data: totalData } = await supabase
    .from('cart_sessions')
    .select('id')
    .eq('venture_id', ventureId)
    .gte('created_at', from)
    .lte('created_at', to);

  const totalCarts = totalData?.length ?? 0;
  const abandonedCount = abandoned.length;
  const rate = totalCarts > 0 ? abandonedCount / totalCarts : 0;

  // Recovery: carts that had recovery email sent and subsequently had an order placed
  // Approximate: count carts with recovery_email_sent = true
  const recovered = abandoned.filter((c) => c.recovery_email_sent === true);
  const recoveryRate = abandonedCount > 0 ? recovered.length / abandonedCount : 0;
  const revenueRecovered = recovered.reduce((sum, c) => sum + Number(c.total ?? 0), 0);

  // Top abandoned products — items in abandoned carts
  const abandonedIds = abandoned.map((c) => c.id as string);
  let topAbandonedProducts: { productId: string; count: number }[] = [];

  if (abandonedIds.length > 0) {
    const { data: itemData } = await supabase
      .from('cart_items')
      .select('product_id')
      .in('cart_id', abandonedIds.slice(0, 100)); // limit for query size

    if (itemData) {
      const productCounts = new Map<string, number>();
      for (const row of itemData) {
        const pid = row.product_id as string;
        productCounts.set(pid, (productCounts.get(pid) ?? 0) + 1);
      }
      topAbandonedProducts = Array.from(productCounts.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(([productId, count]) => ({ productId, count }));
    }
  }

  return { rate, recoveryRate, revenueRecovered, topAbandonedProducts };
}

// ─────────────────────────────────────────────────────────
// TOP PRODUCTS
// ─────────────────────────────────────────────────────────

export async function getTopProducts(
  ventureId: string,
  dateRange: DateRange,
  limit = 10,
): Promise<CommerceAnalytics['topProducts']> {
  if (!supabase) return [];

  const { from, to } = dateRange;

  // Get order_items joined with orders filtered by venture and date range
  const { data: orders } = await supabase
    .from('orders')
    .select('id')
    .eq('venture_id', ventureId)
    .gte('created_at', from)
    .lte('created_at', to);

  if (!orders || orders.length === 0) return [];

  const orderIds = orders.map((o) => o.id as string);

  const { data: items } = await supabase
    .from('order_items')
    .select('product_id, quantity, unit_price')
    .in('order_id', orderIds.slice(0, 500));

  if (!items || items.length === 0) return [];

  // Aggregate by product
  const productMap = new Map<string, { revenue: number; unitsSold: number }>();
  for (const item of items) {
    const pid = item.product_id as string;
    const qty = Number(item.quantity ?? 0);
    const price = Number(item.unit_price ?? 0);
    const existing = productMap.get(pid) ?? { revenue: 0, unitsSold: 0 };
    productMap.set(pid, {
      revenue: existing.revenue + qty * price,
      unitsSold: existing.unitsSold + qty,
    });
  }

  return Array.from(productMap.entries())
    .sort((a, b) => b[1].revenue - a[1].revenue)
    .slice(0, limit)
    .map(([productId, stats]) => ({ productId, ...stats }));
}

// ─────────────────────────────────────────────────────────
// CUSTOMER ANALYTICS
// ─────────────────────────────────────────────────────────

export async function getCustomerAnalytics(ventureId: string): Promise<{
  customerAcquisitionCost: number;
  repeatPurchaseRate: number;
  averageOrderValue: number;
  note?: string;
}> {
  if (!supabase) {
    return { customerAcquisitionCost: 0, repeatPurchaseRate: 0, averageOrderValue: 0 };
  }

  // All orders for this venture
  const { data: orders } = await supabase
    .from('orders')
    .select('customer_id, total_amount')
    .eq('venture_id', ventureId);

  if (!orders || orders.length === 0) {
    return {
      customerAcquisitionCost: 0,
      repeatPurchaseRate: 0,
      averageOrderValue: 0,
      note: 'CAC not computed — no marketing spend data available.',
    };
  }

  // Average order value
  const totalRevenue = orders.reduce((sum, o) => sum + Number(o.total_amount ?? 0), 0);
  const averageOrderValue = totalRevenue / orders.length;

  // Repeat purchase rate: customers with 2+ orders / total customers
  const customerOrderCounts = new Map<string, number>();
  for (const o of orders) {
    const cid = o.customer_id as string;
    if (cid) customerOrderCounts.set(cid, (customerOrderCounts.get(cid) ?? 0) + 1);
  }
  const totalCustomers = customerOrderCounts.size;
  const repeatCustomers = Array.from(customerOrderCounts.values()).filter((c) => c >= 2).length;
  const repeatPurchaseRate = totalCustomers > 0 ? repeatCustomers / totalCustomers : 0;

  return {
    customerAcquisitionCost: 0, // Not computable without marketing spend data
    repeatPurchaseRate,
    averageOrderValue,
    note: 'CAC not computed — marketing spend data not available in this system.',
  };
}

// ─────────────────────────────────────────────────────────
// REVENUE BY CHANNEL
// ─────────────────────────────────────────────────────────

export async function getRevenueByChannel(
  ventureId: string,
  dateRange: DateRange,
): Promise<Array<{ channel: string; revenue: number; transactionCount: number }>> {
  if (!supabase) return [];

  const { from, to } = dateRange;

  const { data } = await supabase
    .from('payment_intents')
    .select('rail, amount, status')
    .eq('venture_id', ventureId)
    .eq('status', 'succeeded')
    .gte('created_at', from)
    .lte('created_at', to);

  if (!data || data.length === 0) return [];

  const channelMap = new Map<string, { revenue: number; transactionCount: number }>();
  for (const row of data) {
    const channel = (row.rail as string) ?? 'unknown';
    const amount = Number(row.amount ?? 0);
    const existing = channelMap.get(channel) ?? { revenue: 0, transactionCount: 0 };
    channelMap.set(channel, {
      revenue: existing.revenue + amount,
      transactionCount: existing.transactionCount + 1,
    });
  }

  return Array.from(channelMap.entries())
    .sort((a, b) => b[1].revenue - a[1].revenue)
    .map(([channel, stats]) => ({ channel, ...stats }));
}

// ─────────────────────────────────────────────────────────
// FULL ANALYTICS (aggregates all above)
// ─────────────────────────────────────────────────────────

export async function getFullAnalytics(
  ventureId: string,
  dateRange: DateRange,
): Promise<CommerceAnalytics> {
  const [funnel, cartAbandonment, topProducts, customerStats] = await Promise.all([
    getConversionFunnel(ventureId, dateRange),
    getCartAbandonment(ventureId, dateRange),
    getTopProducts(ventureId, dateRange, 10),
    getCustomerAnalytics(ventureId),
  ]);

  return {
    funnel,
    cartAbandonment,
    topProducts,
    customerAcquisitionCost: customerStats.customerAcquisitionCost,
    repeatPurchaseRate: customerStats.repeatPurchaseRate,
    averageOrderValue: customerStats.averageOrderValue,
    cohorts: [], // Cohort analysis requires extensive date-bucketing — deferred to Phase 2
  };
}
