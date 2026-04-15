import { useQueries, useQuery } from '@tanstack/react-query';
import { apiGet } from '../lib/api/client';
import { ventures } from '../lib/ventures';

// Shape returned by /api/commerce-metrics?action=snapshot (see api/commerce-metrics.ts)
export interface CommerceMetricsSnapshot {
  venture_id: string;
  range_days: number;
  orders: {
    total_count: number;
    by_status: Record<string, number>;
    revenue: number;
  };
  invoices: {
    total_count: number;
    outstanding_ar: number;
    overdue_count: number;
    by_status: Record<string, number>;
  };
  subscriptions: {
    total: number;
    active: number;
    mrr_estimate: number;
    arr_estimate: number;
  };
  customers: {
    total: number;
    avg_ltv: number;
    total_spent: number;
  };
  products: { total: number; active: number };
  payments: {
    total_count: number;
    succeeded: number;
    failed: number;
    total_processed: number;
  };
  cashflow: { inflow: number; outflow: number; net: number; transaction_count: number };
  top_customers: Array<{
    id: string;
    email: string;
    first_name?: string;
    last_name?: string;
    total_spent?: number;
    ltv?: number;
  }>;
}

const METRICS_BASE = '/api/commerce-metrics';

export const commerceMetricsKeys = {
  snapshot: (ventureId: string | 'all', range: string) => ['commerce-metrics', 'snapshot', ventureId, range] as const,
  timeseries: (ventureId: string | 'all', range: string) => ['commerce-metrics', 'timeseries', ventureId, range] as const,
};

/**
 * Fetch a single venture's commerce snapshot. Pass `venture_id='all'` to
 * aggregate across every venture (the endpoint defaults to 'all' when the
 * query param is omitted).
 */
export function useCommerceMetrics(ventureId: string | 'all' = 'all', range = '30d') {
  return useQuery({
    queryKey: commerceMetricsKeys.snapshot(ventureId, range),
    queryFn: async () => {
      const params = new URLSearchParams({ action: 'snapshot', range });
      if (ventureId !== 'all') params.set('venture_id', ventureId);
      return apiGet<CommerceMetricsSnapshot>(`${METRICS_BASE}?${params}`);
    },
    staleTime: 60_000,
    refetchInterval: 120_000,
    retry: 1,
  });
}

/**
 * Fetch snapshots for every venture in parallel. Returns a record keyed
 * by venture id. Values are undefined while individual queries are loading
 * or have errored. Convenient for Command Center-style per-venture rollup
 * grids where we want partial data rather than all-or-nothing.
 */
export function useAllVentureMetrics(range = '30d') {
  const queries = useQueries({
    queries: ventures.map((v) => ({
      queryKey: commerceMetricsKeys.snapshot(v.id, range),
      queryFn: async () => {
        const params = new URLSearchParams({ action: 'snapshot', range, venture_id: v.id });
        return apiGet<CommerceMetricsSnapshot>(`${METRICS_BASE}?${params}`);
      },
      staleTime: 60_000,
      refetchInterval: 120_000,
      retry: 1,
    })),
  });

  const byVenture: Record<string, CommerceMetricsSnapshot | undefined> = {};
  ventures.forEach((v, i) => {
    byVenture[v.id] = queries[i]?.data;
  });

  const isLoading = queries.some((q) => q.isLoading);
  const isError = queries.every((q) => q.isError);

  return { byVenture, isLoading, isError, queries };
}

// ─── Timeseries ───────────────────────────────────────────────

export interface TimeseriesPoint {
  date: string;
  revenue: number;
  orders: number;
}

export interface CommerceTimeseriesResponse {
  venture_id: string;
  range_days: number;
  series: TimeseriesPoint[];
}

// ─── Cohort ───────────────────────────────────────────────────

export interface CohortBucket {
  cohort: string; // YYYY-MM
  count: number;
  revenue: number;
  avg_ltv: number;
  total_orders: number;
}

export interface CohortResponse {
  venture_id: string;
  cohorts: CohortBucket[];
}

const cohortKey = (ventureId: string | 'all') => ['commerce-metrics', 'cohort', ventureId] as const;

/**
 * Fetch the customer cohort grid (signup-month buckets with count, revenue,
 * avg LTV, total orders). Single global query — most users want the
 * portfolio view, and per-venture cohorts can be slow with many ventures.
 */
export function useCommerceCohorts(ventureId: string | 'all' = 'all') {
  return useQuery({
    queryKey: cohortKey(ventureId),
    queryFn: async () => {
      const params = new URLSearchParams({ action: 'cohort' });
      if (ventureId !== 'all') params.set('venture_id', ventureId);
      return apiGet<CohortResponse>(`${METRICS_BASE}?${params}`);
    },
    staleTime: 10 * 60_000,
    refetchInterval: 30 * 60_000,
    retry: 1,
  });
}

/**
 * Fetch daily revenue/orders timeseries for every venture in parallel.
 * Used by VentureRollupGrid to render a 30-day revenue sparkline per
 * venture. Longer staleTime than snapshot since the series changes less.
 */
export function useAllVentureTimeseries(range = '30d') {
  const queries = useQueries({
    queries: ventures.map((v) => ({
      queryKey: commerceMetricsKeys.timeseries(v.id, range),
      queryFn: async () => {
        const params = new URLSearchParams({ action: 'timeseries', range, venture_id: v.id });
        return apiGet<CommerceTimeseriesResponse>(`${METRICS_BASE}?${params}`);
      },
      staleTime: 5 * 60_000,
      refetchInterval: 10 * 60_000,
      retry: 1,
    })),
  });

  const byVenture: Record<string, CommerceTimeseriesResponse | undefined> = {};
  ventures.forEach((v, i) => {
    byVenture[v.id] = queries[i]?.data;
  });

  return { byVenture };
}

export interface CustomerOrderRow {
  id: string;
  order_number?: string;
  total: number;
  status: string;
  created_at: string;
  line_count?: number;
}

/**
 * Recent N orders for a single customer in a venture. Powers the
 * TopCustomersCard expand panel and any future customer-detail surface.
 * Disabled when either id is empty so the card can pass an empty
 * customerId before the user expands a row without firing a request.
 */
export function useCustomerRecentOrders(
  ventureId: string,
  customerId: string,
  limit = 5,
) {
  return useQuery({
    queryKey: ['commerce', 'customer-orders', ventureId, customerId, limit] as const,
    queryFn: async () => {
      const params = new URLSearchParams({
        action: 'list-customer-orders',
        ventureId,
        customerId,
        limit: String(limit),
      });
      const res = await apiGet<{ data: CustomerOrderRow[] }>(`/api/commerce?${params}`);
      return res.data ?? [];
    },
    enabled: !!ventureId && !!customerId,
    staleTime: 60_000,
  });
}
