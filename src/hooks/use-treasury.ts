import { useQuery } from '@tanstack/react-query';
import * as api from '../lib/api/treasury';

export const treasuryKeys = {
  overview: () => ['treasury', 'overview'] as const,
  venture: (id: string) => ['treasury', 'venture', id] as const,
};

export function useTreasuryOverview() {
  return useQuery({
    queryKey: treasuryKeys.overview(),
    queryFn: () => api.getTreasuryOverview(),
    staleTime: 60_000,
  });
}

export function useVentureFinancials(ventureId: string) {
  return useQuery({
    queryKey: treasuryKeys.venture(ventureId),
    queryFn: () => api.getVentureFinancials(ventureId).then(r => r.financials),
    enabled: !!ventureId,
  });
}
