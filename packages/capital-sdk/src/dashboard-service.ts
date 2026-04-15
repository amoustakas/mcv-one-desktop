// @mcv/capital-sdk/dashboard-service — portfolio + venture roll-ups.

import type { SupabaseClient } from '@supabase/supabase-js';
import { mapRoundRow } from './rounds-service';
import { mapInvestorRow } from './contacts-service';
import { mapActivityRow } from './activities-service';
import type { GlobalSummary, VentureSummary, ContactStage, Round } from './types';

export interface DashboardService {
  globalSummary(): Promise<GlobalSummary>;
  ventureSummary(ventureId: string): Promise<VentureSummary>;
  pipelineFunnel(ventureId?: string): Promise<Record<ContactStage, number>>;
  topInvestors(limit?: number): Promise<GlobalSummary['topInvestors']>;
  upcomingFollowUps(daysAhead?: number): Promise<Array<{ contactId: string; ventureId: string; nextFollowUp: string }>>;
}

export interface DashboardServiceOptions {
  supabase: SupabaseClient | null;
}

const STAGES: ContactStage[] = [
  'cold', 'warm', 'engaged', 'soft_commit', 'due_diligence',
  'signed', 'funded', 'active_investor', 'churned', 'dormant',
];

export function createDashboardService({ supabase }: DashboardServiceOptions): DashboardService {
  return {
    async globalSummary() {
      if (!supabase) {
        return {
          totalRaisedUsd: 0,
          totalCommittedUsd: 0,
          activeRounds: 0,
          totalInvestors: 0,
          pipelineFunnel: STAGES.reduce((acc, s) => { acc[s] = 0; return acc; }, {} as Record<ContactStage, number>),
          topInvestors: [],
          recentActivity: [],
        };
      }

      const [
        roundsRes,
        investorsRes,
        activitiesRes,
      ] = await Promise.all([
        supabase.from('capital_rounds').select('total_committed, total_funded, status').is('deleted_at', null),
        supabase.from('capital_investor_profile').select('contact_id, stage, total_committed_usd'),
        supabase.from('capital_activities').select().order('occurred_at', { ascending: false }).limit(20),
      ]);

      const rounds = roundsRes.data ?? [];
      const investors = investorsRes.data ?? [];
      const activities = activitiesRes.data ?? [];

      const totalCommittedUsd = rounds.reduce((sum: number, r: { total_committed: number | string }) => sum + Number(r.total_committed ?? 0), 0);
      const totalRaisedUsd = rounds.reduce((sum: number, r: { total_funded: number | string }) => sum + Number(r.total_funded ?? 0), 0);
      const activeRounds = rounds.filter((r: { status: string }) => r.status === 'open' || r.status === 'closing').length;
      const totalInvestors = investors.length;

      const pipelineFunnel = STAGES.reduce((acc, s) => { acc[s] = 0; return acc; }, {} as Record<ContactStage, number>);
      for (const inv of investors as Array<{ stage: ContactStage }>) {
        if (inv.stage in pipelineFunnel) pipelineFunnel[inv.stage]++;
      }

      const topInvestors = await this.topInvestors(10);

      return {
        totalRaisedUsd,
        totalCommittedUsd,
        activeRounds,
        totalInvestors,
        pipelineFunnel,
        topInvestors,
        recentActivity: activities.map(mapActivityRow),
      };
    },

    async ventureSummary(ventureId) {
      if (!supabase) {
        return {
          ventureId,
          totalRaisedUsd: 0,
          totalCommittedUsd: 0,
          activeRoundsCount: 0,
          investorCount: 0,
          recentActivity: [],
          rounds: [],
        };
      }

      const [roundsRes, investorsRes, activitiesRes] = await Promise.all([
        supabase.from('capital_rounds').select().eq('venture_id', ventureId).is('deleted_at', null).order('created_at', { ascending: false }),
        supabase.from('capital_investor_profile').select('contact_id').eq('venture_id', ventureId),
        supabase.from('capital_activities').select().eq('venture_id', ventureId).order('occurred_at', { ascending: false }).limit(20),
      ]);

      const rounds: Round[] = (roundsRes.data ?? []).map(mapRoundRow);
      const totalCommittedUsd = rounds.reduce((s, r) => s + r.totalCommitted, 0);
      const totalRaisedUsd = rounds.reduce((s, r) => s + r.totalFunded, 0);
      const activeRoundsCount = rounds.filter((r) => r.status === 'open' || r.status === 'closing').length;

      return {
        ventureId,
        totalRaisedUsd,
        totalCommittedUsd,
        activeRoundsCount,
        investorCount: (investorsRes.data ?? []).length,
        recentActivity: (activitiesRes.data ?? []).map(mapActivityRow),
        rounds,
      };
    },

    async pipelineFunnel(ventureId) {
      const result = STAGES.reduce((acc, s) => { acc[s] = 0; return acc; }, {} as Record<ContactStage, number>);
      if (!supabase) return result;
      let q = supabase.from('capital_investor_profile').select('stage');
      if (ventureId) q = q.eq('venture_id', ventureId);
      const { data } = await q;
      for (const inv of (data ?? []) as Array<{ stage: ContactStage }>) {
        if (inv.stage in result) result[inv.stage]++;
      }
      return result;
    },

    async topInvestors(limit = 10) {
      if (!supabase) return [];
      const { data } = await supabase
        .from('capital_investor_profile')
        .select('contact_id, organization_id, total_committed_usd, venture_id')
        .gt('total_committed_usd', 0)
        .order('total_committed_usd', { ascending: false })
        .limit(limit);

      // Group by contactId across ventures.
      const byContact = new Map<string, { totalCommittedUsd: number; ventures: Set<string>; orgId: string | null }>();
      for (const row of (data ?? []) as Array<{ contact_id: string; organization_id: string | null; total_committed_usd: number | string; venture_id: string }>) {
        const existing = byContact.get(row.contact_id);
        if (existing) {
          existing.totalCommittedUsd += Number(row.total_committed_usd);
          existing.ventures.add(row.venture_id);
        } else {
          byContact.set(row.contact_id, {
            totalCommittedUsd: Number(row.total_committed_usd),
            ventures: new Set([row.venture_id]),
            orgId: row.organization_id,
          });
        }
      }

      const contactIds = [...byContact.keys()];
      const orgIds = [...new Set([...byContact.values()].map((v) => v.orgId).filter((x): x is string => x !== null))];

      const [contactsRes, orgsRes] = await Promise.all([
        contactIds.length
          ? supabase.from('crm_contacts').select('id, name').in('id', contactIds)
          : Promise.resolve({ data: [] }),
        orgIds.length
          ? supabase.from('capital_organizations').select('id, name').in('id', orgIds)
          : Promise.resolve({ data: [] }),
      ]);

      const contactNames = new Map((contactsRes.data ?? []).map((c: { id: string; name: string }) => [c.id, c.name]));
      const orgNames = new Map((orgsRes.data ?? []).map((o: { id: string; name: string }) => [o.id, o.name]));

      return [...byContact.entries()].map(([contactId, agg]) => ({
        contactId,
        name: contactNames.get(contactId) ?? 'Unknown',
        organizationName: agg.orgId ? orgNames.get(agg.orgId) ?? null : null,
        totalCommittedUsd: agg.totalCommittedUsd,
        ventureCount: agg.ventures.size,
      })).sort((a, b) => b.totalCommittedUsd - a.totalCommittedUsd).slice(0, limit);
    },

    async upcomingFollowUps(daysAhead = 7) {
      if (!supabase) return [];
      const now = new Date();
      const horizon = new Date(now.getTime() + daysAhead * 24 * 60 * 60 * 1000);
      const { data } = await supabase
        .from('capital_investor_profile')
        .select('contact_id, venture_id, next_follow_up')
        .not('next_follow_up', 'is', null)
        .gte('next_follow_up', now.toISOString())
        .lte('next_follow_up', horizon.toISOString())
        .order('next_follow_up', { ascending: true })
        .limit(50);
      return (data ?? []).map((r: { contact_id: string; venture_id: string; next_follow_up: string }) => ({
        contactId: r.contact_id,
        ventureId: r.venture_id,
        nextFollowUp: r.next_follow_up,
      }));
    },
  };
}

// Re-mappers used in the dashboard above. Keep alongside (avoids a circular import).
export { mapInvestorRow };
