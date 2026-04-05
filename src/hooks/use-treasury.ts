import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as api from '../lib/api/treasury';

export const treasuryKeys = {
  overview: () => ['treasury', 'overview'] as const,
  venture: (id: string) => ['treasury', 'venture', id] as const,
  financials: (month: string) => ['treasury', 'financials', month] as const,
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

export function useFinancialsList(month: string) {
  return useQuery({
    queryKey: treasuryKeys.financials(month),
    queryFn: () => api.listFinancials(month).then(r => r.financials),
  });
}

export function useUpsertFinancials() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (params: { ventureId: string; month: string; revenue: number; expenses: number }) =>
      api.upsertFinancials(params.ventureId, params.month, params.revenue, params.expenses),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['treasury'] }); },
  });
}
