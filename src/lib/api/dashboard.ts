import { apiPost } from './client';

export interface DashboardStats {
  stats: {
    tasks: { total: number; open: number; overdue: number; critical: number };
    contacts: { total: number };
    deals: { total: number; pipelineValue: number; wonValue: number };
    docs: { total: number };
    conversations: { total: number };
    unreadNotifications: number;
  };
  overdueTasks: Array<{ id: string; title: string; due_date: string; venture_id: string; priority: string }>;
  criticalTasks: Array<{ id: string; title: string; due_date: string; venture_id: string; priority: string }>;
}

export interface AttentionItem {
  id: string;
  type: string;
  severity: 'critical' | 'warning' | 'info';
  title: string;
  description: string;
  ventureId?: string;
  actionLabel: string;
  actionView: string;
}

export interface MorningBrief {
  brief: string;
  data: {
    tasks: number;
    deals: number;
    docs: number;
    activities: number;
    conversations: number;
  };
  generated: boolean;
}

const EP = '/api/dashboard';

export async function getDashboardStats() {
  return apiPost<DashboardStats>(EP, { action: 'stats' });
}

export async function getAttentionItems() {
  return apiPost<{ items: AttentionItem[] }>(EP, { action: 'attention' });
}

export async function getMorningBrief() {
  return apiPost<MorningBrief>(EP, { action: 'morning-brief' });
}
