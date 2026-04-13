import { useQuery } from '@tanstack/react-query';

interface SearchConsoleQuery {
  query: string;
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
}

interface SearchConsolePage {
  page: string;
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
}

async function gscApi(action: string, params: Record<string, unknown> = {}) {
  const qs = new URLSearchParams({
    action,
    ...Object.fromEntries(Object.entries(params).filter(([, v]) => v != null).map(([k, v]) => [k, String(v)])),
  }).toString();
  const res = await fetch(`/api/google-search-console?${qs}`);
  if (!res.ok) {
    const e = await res.json().catch(() => ({}));
    throw new Error(e.error || `Search Console ${res.status}`);
  }
  return res.json();
}

export function useSearchConsoleQueries(days = 28) {
  return useQuery<{ rows: SearchConsoleQuery[] }>({
    queryKey: ['gsc', 'queries', days],
    queryFn: () => gscApi('queries', { days }),
    staleTime: 10 * 60 * 1000,
    retry: 1,
  });
}

export function useSearchConsolePages(days = 28) {
  return useQuery<{ rows: SearchConsolePage[] }>({
    queryKey: ['gsc', 'pages', days],
    queryFn: () => gscApi('pages', { days }),
    staleTime: 10 * 60 * 1000,
    retry: 1,
  });
}

export function useSearchConsoleOverview(days = 28) {
  return useQuery<{ totalClicks: number; totalImpressions: number; avgCtr: number; avgPosition: number }>({
    queryKey: ['gsc', 'overview', days],
    queryFn: () => gscApi('overview', { days }),
    staleTime: 10 * 60 * 1000,
    retry: 1,
  });
}
