import { useQuery } from '@tanstack/react-query';

interface AnalyticsReport {
  rows: Array<{ dimensions: string[]; metrics: string[] }>;
  totals?: Record<string, string>;
}

async function gaApi(action: string, params: Record<string, unknown> = {}) {
  const qs = new URLSearchParams({
    action,
    ...Object.fromEntries(Object.entries(params).filter(([, v]) => v != null).map(([k, v]) => [k, String(v)])),
  }).toString();
  const res = await fetch(`/api/google-analytics?${qs}`);
  if (!res.ok) {
    const e = await res.json().catch(() => ({}));
    throw new Error(e.error || `Analytics ${res.status}`);
  }
  return res.json();
}

export function useAnalyticsOverview() {
  return useQuery<{ activeUsers: number; sessions: number; pageViews: number; bounceRate: number }>({
    queryKey: ['ga', 'overview'],
    queryFn: () => gaApi('overview'),
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });
}

export function useAnalyticsRealtime() {
  return useQuery<{ activeUsers: number; topPages: Array<{ page: string; users: number }> }>({
    queryKey: ['ga', 'realtime'],
    queryFn: () => gaApi('realtime'),
    refetchInterval: 30000, // Refresh every 30s
    retry: 1,
  });
}

export function useAnalyticsTopPages(days = 30) {
  return useQuery<AnalyticsReport>({
    queryKey: ['ga', 'top-pages', days],
    queryFn: () => gaApi('top-pages', { days }),
    staleTime: 10 * 60 * 1000,
    retry: 1,
  });
}

export function useAnalyticsTrafficSources(days = 30) {
  return useQuery<AnalyticsReport>({
    queryKey: ['ga', 'traffic-sources', days],
    queryFn: () => gaApi('traffic-sources', { days }),
    staleTime: 10 * 60 * 1000,
    retry: 1,
  });
}

export function useAnalyticsReport(params: { metrics: string[]; dimensions?: string[]; dateRange?: string }) {
  return useQuery<AnalyticsReport>({
    queryKey: ['ga', 'report', params],
    queryFn: () => gaApi('run-report', params),
    staleTime: 10 * 60 * 1000,
    enabled: params.metrics.length > 0,
    retry: 1,
  });
}
