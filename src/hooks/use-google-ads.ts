import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

interface AdsCampaign {
  id: string;
  name: string;
  status: string;
  budget: number;
  spend: number;
  impressions: number;
  clicks: number;
  conversions: number;
  ctr: number;
  cpc: number;
  roas: number;
}

interface AdsOverview {
  totalSpend: number;
  totalClicks: number;
  totalImpressions: number;
  totalConversions: number;
  avgCtr: number;
  avgCpc: number;
  campaigns: AdsCampaign[];
}

async function adsApi(action: string, params: Record<string, unknown> = {}, method = 'GET') {
  const base = '/api/google-ads';
  if (method === 'GET') {
    const qs = new URLSearchParams({
      action,
      ...Object.fromEntries(Object.entries(params).filter(([, v]) => v != null).map(([k, v]) => [k, String(v)])),
    }).toString();
    const res = await fetch(`${base}?${qs}`);
    if (!res.ok) { const e = await res.json().catch(() => ({})); throw new Error(e.error || `Ads ${res.status}`); }
    return res.json();
  }
  const res = await fetch(base, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action, ...params }),
  });
  if (!res.ok) { const e = await res.json().catch(() => ({})); throw new Error(e.error || `Ads ${res.status}`); }
  return res.json();
}

export function useGoogleAdsOverview() {
  return useQuery<AdsOverview>({
    queryKey: ['gads', 'overview'],
    queryFn: () => adsApi('overview'),
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });
}

export function useGoogleAdsCampaigns() {
  return useQuery<{ campaigns: AdsCampaign[] }>({
    queryKey: ['gads', 'campaigns'],
    queryFn: () => adsApi('campaigns'),
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });
}

export function useGoogleAdsPerformance(campaignId?: string) {
  return useQuery({
    queryKey: ['gads', 'performance', campaignId],
    queryFn: () => adsApi('performance', { campaignId }),
    staleTime: 5 * 60 * 1000,
    enabled: true,
    retry: 1,
  });
}

export function useGoogleAdsKeywords(campaignId?: string) {
  return useQuery({
    queryKey: ['gads', 'keywords', campaignId],
    queryFn: () => adsApi('keywords', { campaignId }),
    staleTime: 10 * 60 * 1000,
    retry: 1,
  });
}

export function usePauseAdsCampaign() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (campaignId: string) => adsApi('pause-campaign', { campaignId }, 'POST'),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['gads'] }),
  });
}

export function useEnableAdsCampaign() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (campaignId: string) => adsApi('enable-campaign', { campaignId }, 'POST'),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['gads'] }),
  });
}

export function useGoogleAdsRecommendations() {
  return useQuery({
    queryKey: ['gads', 'recommendations'],
    queryFn: () => adsApi('recommendations'),
    staleTime: 30 * 60 * 1000,
    retry: 1,
  });
}
