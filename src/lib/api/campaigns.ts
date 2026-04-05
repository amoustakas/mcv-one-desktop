import { apiPost } from './client';

export interface Campaign {
  id: string;
  name: string;
  type: string;
  status: string;
  venture_id: string;
  channel: string;
  budget: number;
  spent: number;
  reach: number;
  impressions: number;
  clicks: number;
  conversions: number;
  start_date: string;
  end_date: string;
  description: string;
  created_at: string;
  updated_at: string;
}

const EP = '/api/campaigns';

export async function listCampaigns(ventureId?: string) {
  return apiPost<{ campaigns: Campaign[] }>(EP, { action: 'list', venture_id: ventureId });
}

export async function createCampaign(campaign: Partial<Campaign>) {
  return apiPost<{ campaign: Campaign }>(EP, { action: 'create', campaign });
}

export async function updateCampaign(id: string, updates: Partial<Campaign>) {
  return apiPost<{ campaign: Campaign }>(EP, { action: 'update', campaign: { id, ...updates } });
}

export async function deleteCampaign(id: string) {
  return apiPost<{ success: boolean }>(EP, { action: 'delete', id });
}
