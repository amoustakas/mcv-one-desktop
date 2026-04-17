// src/hooks/use-persona-xp.ts
// Marathon #3 T9.4 — per-persona XP history + achievement list hooks.
// Both are read-only queries that translate camelCase hook input (agentId)
// into snake_case wire body (agent_id) to match handler contract.

import { useQuery } from '@tanstack/react-query';
import { apiPost } from '../lib/api/client';

export type XpEventKind =
  | 'activity'
  | 'tool_call'
  | 'workflow_run'
  | 'chat_turn'
  | 'handoff'
  | 'milestone'
  | 'achievement'
  | 'manual_grant';

export interface XpEvent {
  id: string;
  agent_id: string;
  event_kind: XpEventKind;
  xp: number;
  source_type: string | null;
  source_id: string | null;
  description: string | null;
  occurred_at: string;
  metadata: Record<string, unknown>;
}

export interface PersonaXpSummary {
  persona: {
    id: string;
    handle: string;
    full_name: string;
    title: string;
    xp: number;
    dimension: string | null;
  };
  events: XpEvent[];
  by_kind: Record<string, { count: number; xp: number }>;
}

export type AchievementTier = 'bronze' | 'silver' | 'gold' | 'diamond' | 'mythic';

export interface Achievement {
  id: string;
  agent_id: string;
  achievement_key: string;
  achievement_label: string;
  tier: AchievementTier;
  xp_granted: number;
  earned_at: string;
  metadata: Record<string, unknown>;
}

export interface UsePersonaXpOptions {
  limit?: number;
}

export function usePersonaXp(agentId: string | null, opts?: UsePersonaXpOptions) {
  const limit = opts?.limit ?? 100;
  return useQuery({
    queryKey: ['gamification', 'persona-xp', agentId, limit],
    queryFn: () =>
      apiPost<PersonaXpSummary>('/api/gamification', {
        action: 'get_persona_xp',
        agent_id: agentId!,
        limit: opts?.limit,
      }),
    enabled: !!agentId,
    staleTime: 15_000,
  });
}

export function usePersonaAchievements(agentId: string | null) {
  return useQuery({
    queryKey: ['gamification', 'achievements', agentId],
    queryFn: () =>
      apiPost<{ achievements: Achievement[] }>('/api/gamification', {
        action: 'get_persona_achievements',
        agent_id: agentId!,
      }),
    enabled: !!agentId,
    staleTime: 60_000,
  });
}
