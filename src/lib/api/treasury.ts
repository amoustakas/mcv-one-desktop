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

export interface FinancialRow {
  venture_id: string;
  revenue: number;
  expenses: number;
}

export async function listFinancials(month: string) {
  return apiPost<{ financials: FinancialRow[] }>(EP, { action: 'list', month });
}

export async function upsertFinancials(ventureId: string, month: string, revenue: number, expenses: number) {
  return apiPost<{ success: boolean }>(EP, { action: 'upsert', venture_id: ventureId, month, revenue, expenses });
}
