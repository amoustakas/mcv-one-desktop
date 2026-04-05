import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as api from '../lib/api/campaigns';
import type { Campaign } from '../lib/api/campaigns';

export const campaignKeys = {
  list: (ventureId?: string) => ['campaigns', ventureId] as const,
};

export function useCampaigns(ventureId?: string) {
  return useQuery({
    queryKey: campaignKeys.list(ventureId),
    queryFn: () => api.listCampaigns(ventureId).then(r => r.campaigns),
  });
}

export function useCreateCampaign() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (campaign: Partial<Campaign>) => api.createCampaign(campaign),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['campaigns'] }); },
  });
}

export function useUpdateCampaign() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...updates }: Partial<Campaign> & { id: string }) => api.updateCampaign(id, updates),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['campaigns'] }); },
  });
}

export function useDeleteCampaign() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.deleteCampaign(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['campaigns'] }); },
  });
}
