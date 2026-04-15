// @mcv/capital-sdk/activities-service — relationship & lifecycle timeline log.

import type { SupabaseClient } from '@supabase/supabase-js';
import { CreateActivityInput, type Activity, type ActivityType } from './types';

export function mapActivityRow(row: Record<string, unknown>): Activity {
  return {
    id: row.id as string,
    ventureId: row.venture_id as string,
    contactId: (row.contact_id as string) ?? null,
    organizationId: (row.organization_id as string) ?? null,
    roundId: (row.round_id as string) ?? null,
    commitmentId: (row.commitment_id as string) ?? null,
    activityType: row.activity_type as ActivityType,
    title: row.title as string,
    description: (row.description as string) ?? null,
    previousValue: (row.previous_value as string) ?? null,
    newValue: (row.new_value as string) ?? null,
    actorId: (row.actor_id as string) ?? null,
    actorType: row.actor_type as Activity['actorType'],
    metadata: (row.metadata as Record<string, unknown>) ?? {},
    occurredAt: row.occurred_at as string,
    createdAt: row.created_at as string,
  };
}

export interface ListActivitiesFilters {
  contactId?: string;
  roundId?: string;
  commitmentId?: string;
  activityType?: ActivityType;
  since?: string;
  limit?: number;
}

export interface ActivitiesService {
  recordActivity(input: CreateActivityInput): Promise<Activity>;
  listActivities(ventureId: string, filters?: ListActivitiesFilters): Promise<Activity[]>;
  listAllRecent(filters?: { limit?: number; since?: string }): Promise<Activity[]>;
  listByContact(contactId: string, limit?: number): Promise<Activity[]>;
}

export interface ActivitiesServiceOptions {
  supabase: SupabaseClient | null;
}

export function createActivitiesService({ supabase }: ActivitiesServiceOptions): ActivitiesService {
  return {
    async recordActivity(input) {
      if (!supabase) throw new Error('Supabase client not available');
      const validated = CreateActivityInput.parse(input);
      const row = {
        venture_id: validated.ventureId,
        contact_id: validated.contactId ?? null,
        organization_id: validated.organizationId ?? null,
        round_id: validated.roundId ?? null,
        commitment_id: validated.commitmentId ?? null,
        activity_type: validated.activityType,
        title: validated.title,
        description: validated.description ?? null,
        previous_value: validated.previousValue ?? null,
        new_value: validated.newValue ?? null,
        actor_id: validated.actorId ?? null,
        actor_type: validated.actorType,
        metadata: validated.metadata,
      };
      const { data, error } = await supabase
        .from('capital_activities')
        .insert(row)
        .select()
        .single();
      if (error) throw new Error(`Failed to record activity: ${error.message}`);
      return mapActivityRow(data);
    },

    async listActivities(ventureId, filters) {
      if (!supabase) return [];
      let q = supabase
        .from('capital_activities')
        .select()
        .eq('venture_id', ventureId)
        .order('occurred_at', { ascending: false })
        .limit(filters?.limit ?? 100);
      if (filters?.contactId) q = q.eq('contact_id', filters.contactId);
      if (filters?.roundId) q = q.eq('round_id', filters.roundId);
      if (filters?.commitmentId) q = q.eq('commitment_id', filters.commitmentId);
      if (filters?.activityType) q = q.eq('activity_type', filters.activityType);
      if (filters?.since) q = q.gte('occurred_at', filters.since);
      const { data, error } = await q;
      if (error) throw new Error(`Failed: ${error.message}`);
      return (data ?? []).map(mapActivityRow);
    },

    async listAllRecent(filters) {
      if (!supabase) return [];
      let q = supabase
        .from('capital_activities')
        .select()
        .order('occurred_at', { ascending: false })
        .limit(filters?.limit ?? 50);
      if (filters?.since) q = q.gte('occurred_at', filters.since);
      const { data, error } = await q;
      if (error) throw new Error(`Failed: ${error.message}`);
      return (data ?? []).map(mapActivityRow);
    },

    async listByContact(contactId, limit = 50) {
      if (!supabase) return [];
      const { data, error } = await supabase
        .from('capital_activities')
        .select()
        .eq('contact_id', contactId)
        .order('occurred_at', { ascending: false })
        .limit(limit);
      if (error) throw new Error(`Failed: ${error.message}`);
      return (data ?? []).map(mapActivityRow);
    },
  };
}
