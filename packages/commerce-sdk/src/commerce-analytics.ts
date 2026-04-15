// @mcv/commerce-sdk/commerce-analytics — conversion funnel, cart
// abandonment, top products, customer analytics, revenue by channel.
//
// Read-only aggregation engine. Six methods, all date-range-scoped except
// getCustomerAnalytics which aggregates all-time per venture. getFullAnalytics
// fans out the other five in parallel and assembles a CommerceAnalytics
// object in one call.

import type { SupabaseClient } from '@supabase/supabase-js';
import type { CommerceAnalytics, ConversionFunnel } from './surface-types';

// ─── Types ──────────────────────────────────────────────────────────────

export interface DateRange {
  from: string; // ISO date string
  to: string;
}

// ─── Engine interface ──────────────────────────────────────────────────

export interface CommerceAnalyticsEngine {
  getConversionFunnel(ventureId: string, dateRange: DateRange): Promise<ConversionFunnel>;
  getCartAbandonment(
    ventureId: string,
    dateRange: DateRange,
  ): Promise<CommerceAnalytics['cartAbandonment']>;
  getTopProducts(
    ventureId: string,
    dateRange: DateRange,
    limit?: number,
  ): Promise<CommerceAnalytics['topProducts']>;
  getCustomerAnalytics(ventureId: string): Promise<{
    customerAcquisitionCost: number;
    repeatPurchaseRate: number;
    averageOrderValue: number;
    note?: string;
  }>;
  getRevenueByChannel(
    ventureId: string,
    dateRange: DateRange,
  ): Promise<Array<{ channel: string; revenue: number; transactionCount: number }>>;
  getFullAnalytics(ventureId: string, dateRange: DateRange): Promise<CommerceAnalytics>;
}

export interface CommerceAnalyticsOptions {
  supabase: SupabaseClient | null;
}

// ─── Factory ───────────────────────────────────────────────────────────

export function createCommerceAnalytics({
  supabase,
}: CommerceAnalyticsOptions): CommerceAnalyticsEngine {
  const engine: CommerceAnalyticsEngine = {
    async getConversionFunnel(ventureId, dateRange) {
      if (!supabase) {
        return { visitors: 0, productViews: 0, addedToCart: 0, reachedCheckout: 0, completed: 0, conversionRate: 0 };
      }

      const { from, to } = dateRange;

      // Visitors proxied by search_analytics rows in the range.
      const { data: searchData } = await supabase
        .from('search_analytics')
        .select('query')
        .eq('venture_id', ventureId)
        .gte('created_at', from)
        .lte('created_at', to);
      const visitors = searchData?.length ?? 0;

      // Product views = search rows that clicked through to a product.
      const { data: viewData } = await supabase
        .from('search_analytics')
        .select('clicked_product_id')
        .eq('venture_id', ventureId)
        .not('clicked_product_id', 'is', null)
        .gte('created_at', from)
        .lte('created_at', to);
      const productViews = viewData?.length ?? 0;

      // Cart adds aren't venture-scoped here — approximate count.
      const { data: cartItemData } = await supabase
        .from('cart_items')
        .select('id')
        .gte('created_at', from)
        .lte('created_at', to);
      const addedToCart = cartItemData?.length ?? 0;

      // Reached checkout = cart_session with a shipping_address.
      const { data: checkoutData } = await supabase
        .from('cart_sessions')
        .select('id')
        .eq('venture_id', ventureId)
        .not('shipping_address', 'is', null)
        .gte('created_at', from)
        .lte('created_at', to);
      const reachedCheckout = checkoutData?.length ?? 0;

      const { data: ordersData } = await supabase
        .from('orders')
        .select('id')
        .eq('venture_id', ventureId)
        .gte('created_at', from)
        .lte('created_at', to);
      const completed = ordersData?.length ?? 0;

      const denominator = visitors > 0 ? visitors : (addedToCart > 0 ? addedToCart : 1);
      const conversionRate = completed / denominator;

      return { visitors, productViews, addedToCart, reachedCheckout, completed, conversionRate };
    },

    async getCartAbandonment(ventureId, dateRange) {
      if (!supabase) {
        return { rate: 0, recoveryRate: 0, revenueRecovered: 0, topAbandonedProducts: [] };
      }

      const { from, to } = dateRange;

      const { data: abandonedData } = await supabase
        .from('cart_sessions')
        .select('id, total, recovery_email_sent')
        .eq('venture_id', ventureId)
        .not('abandoned_at', 'is', null)
        .gte('abandoned_at', from)
        .lte('abandoned_at', to);

      const abandoned = abandonedData ?? [];

      const { data: totalData } = await supabase
        .from('cart_sessions')
        .select('id')
        .eq('venture_id', ventureId)
        .gte('created_at', from)
        .lte('created_at', to);

      const totalCarts = totalData?.length ?? 0;
      const abandonedCount = abandoned.length;
      const rate = totalCarts > 0 ? abandonedCount / totalCarts : 0;

      // Recovery proxy: abandoned carts where recovery_email_sent=true.
      // A follow-up pass could tighten this by joining to orders where the
      // customer subsequently purchased.
      const recovered = abandoned.filter((c) => c.recovery_email_sent === true);
      const recoveryRate = abandonedCount > 0 ? recovered.length / abandonedCount : 0;
      const revenueRecovered = recovered.reduce((sum, c) => sum + Number(c.total ?? 0), 0);

      const abandonedIds = abandoned.map((c) => c.id as string);
      let topAbandonedProducts: { productId: string; count: number }[] = [];

      if (abandonedIds.length > 0) {
        const { data: itemData } = await supabase
          .from('cart_items')
          .select('product_id')
          .in('cart_id', abandonedIds.slice(0, 100));

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
    },

    async getTopProducts(ventureId, dateRange, limit = 10) {
      if (!supabase) return [];

      const { from, to } = dateRange;

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
    },

    async getCustomerAnalytics(ventureId) {
      if (!supabase) {
        return { customerAcquisitionCost: 0, repeatPurchaseRate: 0, averageOrderValue: 0 };
      }

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

      const totalRevenue = orders.reduce((sum, o) => sum + Number(o.total_amount ?? 0), 0);
      const averageOrderValue = totalRevenue / orders.length;

      const customerOrderCounts = new Map<string, number>();
      for (const o of orders) {
        const cid = o.customer_id as string;
        if (cid) customerOrderCounts.set(cid, (customerOrderCounts.get(cid) ?? 0) + 1);
      }
      const totalCustomers = customerOrderCounts.size;
      const repeatCustomers = Array.from(customerOrderCounts.values()).filter((c) => c >= 2).length;
      const repeatPurchaseRate = totalCustomers > 0 ? repeatCustomers / totalCustomers : 0;

      return {
        customerAcquisitionCost: 0,
        repeatPurchaseRate,
        averageOrderValue,
        note: 'CAC not computed — marketing spend data not available in this system.',
      };
    },

    async getRevenueByChannel(ventureId, dateRange) {
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
    },

    async getFullAnalytics(ventureId, dateRange) {
      const [funnel, cartAbandonment, topProducts, customerStats] = await Promise.all([
        engine.getConversionFunnel(ventureId, dateRange),
        engine.getCartAbandonment(ventureId, dateRange),
        engine.getTopProducts(ventureId, dateRange, 10),
        engine.getCustomerAnalytics(ventureId),
      ]);

      return {
        funnel,
        cartAbandonment,
        topProducts,
        customerAcquisitionCost: customerStats.customerAcquisitionCost,
        repeatPurchaseRate: customerStats.repeatPurchaseRate,
        averageOrderValue: customerStats.averageOrderValue,
        cohorts: [], // Cohort analysis requires extensive date-bucketing — deferred.
      };
    },
  };

  return engine;
}
