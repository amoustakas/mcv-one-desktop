import { apiPost } from './client';

export interface TreasuryData {
  totalAssets: number;
  totalLiabilities: number;
  netWorth: number;
  cashFlow: number;
  ventures: Array<{
    id: string;
    name: string;
    revenue: number;
    expenses: number;
    profit: number;
    runway: number;
  }>;
}

const EP = '/api/treasury';

export async function getTreasuryOverview() {
  return apiPost<TreasuryData>(EP, { action: 'overview' });
}

export async function getVentureFinancials(ventureId: string) {
  return apiPost<{ financials: Record<string, unknown> }>(EP, { action: 'venture', venture_id: ventureId });
}
