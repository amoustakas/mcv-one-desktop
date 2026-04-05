import { useQuery } from '@tanstack/react-query';
import * as api from '../lib/api/dashboard';

export const dashboardKeys = {
  stats: () => ['dashboard', 'stats'] as const,
  attention: () => ['dashboard', 'attention'] as const,
  morningBrief: () => ['dashboard', 'morning-brief'] as const,
};

export function useDashboardStats() {
  return useQuery({
    queryKey: dashboardKeys.stats(),
    queryFn: () => api.getDashboardStats(),
    staleTime: 30_000,
    refetchInterval: 60_000, // Auto-refresh every 60s
  });
}

export function useAttentionItems() {
  return useQuery({
    queryKey: dashboardKeys.attention(),
    queryFn: () => api.getAttentionItems().then(r => r.items),
    staleTime: 60_000,
    refetchInterval: 120_000, // Check every 2min
  });
}

export function useMorningBrief() {
  return useQuery({
    queryKey: dashboardKeys.morningBrief(),
    queryFn: () => api.getMorningBrief(),
    staleTime: 30 * 60_000, // 30min — morning brief doesn't change often
  });
}
