import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getServiceClient, requireAuth } from './_supabase.js';

import { requestLogger } from '../../src/lib/server/logger';
// ---------------------------------------------------------------------------
// Commerce + Financial Metrics Aggregator
// Single endpoint that dashboards hit for a full financial health roll-up
// per venture (or global across all 7 ventures when venture_id omitted).
//
// GET /api/commerce-metrics?venture_id=mcv&range=30d
// Actions:
//   (default) snapshot  — MRR, orders, revenue, AR, top customers, etc.
//   timeseries            — daily revenue / orders for charting
//   cohort                — customer cohort retention (simplified)
// ---------------------------------------------------------------------------

function parseRange(range: string | undefined): number {
  if (!range) return 30;
  const m = range.match(/^(\d+)([dw])$/);
  if (!m) return 30;
  const n = parseInt(m[1]);
  return m[2] === 'w' ? n * 7 : n;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { log: __log, correlationId: __correlationId } = requestLogger(req as unknown as { headers?: Record<string, unknown>; url?: string; method?: string });
  try { res.setHeader('x-correlation-id', __correlationId); } catch { /* headers already sent */ }
  const __start = Date.now();
  __log.info({ event: 'request_in' });
  res.on('finish', () => {
    __log.info({ event: 'request_out', status: res.statusCode, duration_ms: Date.now() - __start });
  });
  res.on('close', () => {
    if (!res.writableEnded) {
      __log.warn({ event: 'request_abort', duration_ms: Date.now() - __start });
    }
  });
  const ctx = await requireAuth(req, res);
  if (!ctx) return;
  const supabase = getServiceClient();
  const action = (req.query.action as string) || 'snapshot';
  const ventureId = req.query.venture_id as string | undefined;
  const days = parseRange(req.query.range as string);
  const since = new Date(Date.now() - days * 864e5).toISOString();

  try {
    switch (action) {
      // ── Full financial snapshot ──
      case 'snapshot': {
        const ventureFilter = (q: ReturnType<typeof supabase.from>) =>
          ventureId ? q.eq('venture_id', ventureId) : q;

        // Run everything in parallel
        const [
          ordersRes, invoicesRes, subsRes, customersRes, productsRes,
          transactionsRes, paymentIntentsRes, topCustomersRes,
        ] = await Promise.all([
          ventureFilter(supabase.from('orders').select('id, total_amount, status, created_at')).gte('created_at', since),
          ventureFilter(supabase.from('invoices').select('id, total, amount_due, amount_paid, status, due_date')),
          ventureFilter(supabase.from('subscriptions').select('id, status, current_period_end, quantity')),
          ventureFilter(supabase.from('customers').select('id, total_spent, ltv, total_orders, created_at')),
          ventureFilter(supabase.from('products').select('id, status')),
          ventureFilter(supabase.from('transaction_records').select('amount, direction, category, created_at')).gte('created_at', since),
          ventureFilter(supabase.from('payment_intents').select('id, amount, status, created_at')).gte('created_at', since),
          ventureFilter(supabase.from('customers').select('id, email, first_name, last_name, total_spent, ltv')).order('ltv', { ascending: false }).limit(5),
        ]);

        const orders = ordersRes.data || [];
        const invoices = invoicesRes.data || [];
        const subs = subsRes.data || [];
        const customers = customersRes.data || [];
        const products = productsRes.data || [];
        const transactions = transactionsRes.data || [];
        const payments = paymentIntentsRes.data || [];

        const revenueInRange = orders
          .filter(o => ['delivered', 'shipped', 'processing'].includes(o.status))
          .reduce((s, o) => s + Number(o.total_amount || 0), 0);

        const activeSubs = subs.filter(s => ['active', 'trialing'].includes(s.status));
        const mrr = activeSubs.reduce((s) => s, 0); // Placeholder — needs plan_amount join
        const arrEstimate = mrr * 12;

        const outstandingAR = invoices
          .filter(i => ['sent', 'viewed', 'partial', 'overdue'].includes(i.status))
          .reduce((s, i) => s + Number(i.amount_due || 0), 0);

        const overdueCount = invoices.filter(i =>
          i.status !== 'paid' && i.due_date && new Date(i.due_date) < new Date() && Number(i.amount_due) > 0
        ).length;

        const inflow = transactions.filter(t => t.direction === 'inflow').reduce((s, t) => s + Number(t.amount), 0);
        const outflow = transactions.filter(t => t.direction === 'outflow').reduce((s, t) => s + Number(t.amount), 0);

        return res.json({
          venture_id: ventureId || 'all',
          range_days: days,
          orders: {
            total_count: orders.length,
            by_status: orders.reduce((acc, o) => { acc[o.status] = (acc[o.status] || 0) + 1; return acc; }, {} as Record<string, number>),
            revenue: revenueInRange,
          },
          invoices: {
            total_count: invoices.length,
            outstanding_ar: outstandingAR,
            overdue_count: overdueCount,
            by_status: invoices.reduce((acc, i) => { acc[i.status] = (acc[i.status] || 0) + 1; return acc; }, {} as Record<string, number>),
          },
          subscriptions: {
            total: subs.length,
            active: activeSubs.length,
            mrr_estimate: mrr,
            arr_estimate: arrEstimate,
          },
          customers: {
            total: customers.length,
            avg_ltv: customers.length > 0 ? customers.reduce((s, c) => s + Number(c.ltv || 0), 0) / customers.length : 0,
            total_spent: customers.reduce((s, c) => s + Number(c.total_spent || 0), 0),
          },
          products: {
            total: products.length,
            active: products.filter(p => p.status === 'active').length,
          },
          payments: {
            total_count: payments.length,
            succeeded: payments.filter(p => p.status === 'succeeded').length,
            failed: payments.filter(p => p.status === 'failed').length,
            total_processed: payments.filter(p => p.status === 'succeeded').reduce((s, p) => s + Number(p.amount), 0),
          },
          cashflow: {
            inflow, outflow, net: inflow - outflow,
            transaction_count: transactions.length,
          },
          top_customers: topCustomersRes.data || [],
        });
      }

      // ── Daily revenue timeseries ──
      case 'timeseries': {
        let q = supabase.from('orders')
          .select('total_amount, status, created_at')
          .gte('created_at', since);
        if (ventureId) q = q.eq('venture_id', ventureId);
        const { data, error } = await q;
        if (error) throw error;

        const buckets: Record<string, { date: string; revenue: number; orders: number }> = {};
        for (let i = 0; i < days; i++) {
          const d = new Date(Date.now() - i * 864e5).toISOString().slice(0, 10);
          buckets[d] = { date: d, revenue: 0, orders: 0 };
        }
        for (const o of data || []) {
          const d = o.created_at.slice(0, 10);
          if (!buckets[d]) buckets[d] = { date: d, revenue: 0, orders: 0 };
          buckets[d].orders += 1;
          if (['delivered', 'shipped', 'processing'].includes(o.status)) {
            buckets[d].revenue += Number(o.total_amount);
          }
        }
        const series = Object.values(buckets).sort((a, b) => a.date.localeCompare(b.date));
        return res.json({ venture_id: ventureId || 'all', range_days: days, series });
      }

      // ── Simplified cohort view (customers grouped by signup month) ──
      case 'cohort': {
        let q = supabase.from('customers')
          .select('id, created_at, total_spent, total_orders, ltv');
        if (ventureId) q = q.eq('venture_id', ventureId);
        const { data, error } = await q;
        if (error) throw error;

        const cohorts: Record<string, { cohort: string; count: number; revenue: number; avg_ltv: number; total_orders: number }> = {};
        for (const c of data || []) {
          const cohort = c.created_at.slice(0, 7); // YYYY-MM
          if (!cohorts[cohort]) cohorts[cohort] = { cohort, count: 0, revenue: 0, avg_ltv: 0, total_orders: 0 };
          cohorts[cohort].count += 1;
          cohorts[cohort].revenue += Number(c.total_spent);
          cohorts[cohort].avg_ltv += Number(c.ltv);
          cohorts[cohort].total_orders += Number(c.total_orders);
        }
        // Normalize avg_ltv
        for (const k of Object.keys(cohorts)) {
          cohorts[k].avg_ltv = cohorts[k].count > 0 ? cohorts[k].avg_ltv / cohorts[k].count : 0;
        }
        const series = Object.values(cohorts).sort((a, b) => a.cohort.localeCompare(b.cohort));
        return res.json({ venture_id: ventureId || 'all', cohorts: series });
      }

      default:
        return res.status(400).json({ error: `Unknown action: ${action}. Use snapshot | timeseries | cohort.` });
    }
  } catch (err) {
    return res.status(500).json({ error: err instanceof Error ? err.message : (err && typeof err === 'object' && 'message' in err ? String((err as { message: unknown }).message) : JSON.stringify(err)) });
  }
}
