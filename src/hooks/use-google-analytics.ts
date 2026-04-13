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

// ── Advanced hooks ──

/** Funnel analysis — conversion rates across defined steps */
export function useAnalyticsFunnel(steps: string[], days = 30) {
  return useQuery({
    queryKey: ['ga', 'funnel', steps, days],
    queryFn: () => gaApi('funnel-report', { steps: steps.join(','), days }),
    staleTime: 15 * 60 * 1000,
    enabled: steps.length >= 2,
    retry: 1,
  });
}

/** Period-over-period comparison (e.g. this week vs last week) */
export function useAnalyticsComparison(metric: string, period: 'week' | 'month' = 'week') {
  return useQuery<{
    current: number;
    previous: number;
    change: number;
    changePercent: number;
    trend: 'up' | 'down' | 'flat';
  }>({
    queryKey: ['ga', 'comparison', metric, period],
    queryFn: async () => {
      const days = period === 'week' ? 7 : 30;
      const [current, previous] = await Promise.all([
        gaApi('run-report', { metrics: [metric], dateRange: `${days}daysAgo-today` }),
        gaApi('run-report', { metrics: [metric], dateRange: `${days * 2}daysAgo-${days}daysAgo` }),
      ]);
      const curVal = Number(current.totals?.[metric] || current.rows?.[0]?.metrics?.[0] || 0);
      const prevVal = Number(previous.totals?.[metric] || previous.rows?.[0]?.metrics?.[0] || 0);
      const change = curVal - prevVal;
      const changePercent = prevVal > 0 ? (change / prevVal) * 100 : 0;
      return {
        current: curVal,
        previous: prevVal,
        change,
        changePercent: Math.round(changePercent * 10) / 10,
        trend: changePercent > 2 ? 'up' : changePercent < -2 ? 'down' : 'flat',
      };
    },
    staleTime: 10 * 60 * 1000,
    retry: 1,
  });
}

/** AI-generated analytics narrative via Gemini */
export function useAnalyticsInsights() {
  return useQuery<{ narrative: string; highlights: string[]; alerts: string[] }>({
    queryKey: ['ga', 'ai-insights'],
    queryFn: async () => {
      // Gather data in parallel
      const [overview, topPages, traffic] = await Promise.allSettled([
        gaApi('overview'),
        gaApi('top-pages', { days: 7 }),
        gaApi('traffic-sources', { days: 7 }),
      ]);

      const context = {
        overview: overview.status === 'fulfilled' ? overview.value : null,
        topPages: topPages.status === 'fulfilled' ? topPages.value : null,
        traffic: traffic.status === 'fulfilled' ? traffic.value : null,
      };

      // Generate narrative with Gemini
      const res = await fetch('/api/google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'gemini-generate',
          prompt: `You are an analytics expert. Based on this Google Analytics data, provide:\n1. A 2-3 sentence executive summary\n2. 3 highlights (positive trends)\n3. 2 alerts (issues to investigate)\n\nData:\n${JSON.stringify(context, null, 2)}\n\nRespond in JSON format: { "narrative": "...", "highlights": ["..."], "alerts": ["..."] }`,
        }),
      });

      if (!res.ok) throw new Error('AI insights unavailable');
      const data = await res.json();
      try {
        return JSON.parse(data.content);
      } catch {
        return { narrative: data.content, highlights: [], alerts: [] };
      }
    },
    staleTime: 30 * 60 * 1000,
    retry: 1,
  });
}
