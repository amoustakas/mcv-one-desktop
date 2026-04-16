// React Query hooks for the Agent Roster. Backs /api/agents handler.

import { useQuery } from '@tanstack/react-query';
import { apiPost } from '../lib/api/client';
import { listAgentConversations, type AgentConversationSummary } from '../lib/agents/chat';

export interface AgentPersona {
  id: string;
  handle: string;
  full_name: string;
  title: string;
  department: string;
  seniority: string;
  scope_kind: string;
  scope_value: string | null;
  reports_to_agent_id: string | null;
  interaction_mode: string;
  persona_bio: string;
  voice_profile: Record<string, unknown>;
  kit_allowlist: string[];
  /** Optional narrowing inside kit_allowlist — null/undefined means "all
   *  tools from the allowed kits". */
  tool_allowlist?: string[] | null;
  data_scopes: Record<string, unknown>;
  avatar_url: string | null;
  accent_color: string | null;
  active: boolean;
  hired_at: string;
  metadata: Record<string, unknown>;
}

export interface AgentOrgNode {
  id: string;
  handle: string;
  full_name: string;
  title: string;
  department: string;
  seniority: string;
  scope_kind: string;
  scope_value: string | null;
  reports_to_agent_id: string | null;
  accent_color: string | null;
  avatar_url: string | null;
}

export function useAgents(filters?: { department?: string; seniority?: string; scope_kind?: string }) {
  return useQuery({
    queryKey: ['agents', 'list', filters?.department ?? 'all', filters?.seniority ?? 'all', filters?.scope_kind ?? 'all'],
    queryFn: async () => {
      const data = await apiPost<{ agents: AgentPersona[] }>('/api/agents', {
        action: 'list',
        department: filters?.department,
        seniority: filters?.seniority,
        scope_kind: filters?.scope_kind,
      });
      return data.agents;
    },
  });
}

export function useAgent(handleOrId: string | null | undefined) {
  return useQuery({
    queryKey: ['agents', 'get', handleOrId ?? 'none'],
    queryFn: async () => {
      if (!handleOrId) return null;
      const payload: Record<string, string> = { action: 'get' };
      if (handleOrId.startsWith('@')) payload.handle = handleOrId;
      else payload.id = handleOrId;
      const data = await apiPost<{ agent: AgentPersona | null }>('/api/agents', payload);
      return data.agent;
    },
    enabled: Boolean(handleOrId),
  });
}

export function useAgentOrgChart() {
  return useQuery({
    queryKey: ['agents', 'org-chart'],
    queryFn: async () => {
      const data = await apiPost<{ nodes: AgentOrgNode[] }>('/api/agents', { action: 'org-chart' });
      return data.nodes;
    },
  });
}

export function useAgentActivity(agentId: string | null | undefined, limit = 50) {
  return useQuery({
    queryKey: ['agents', 'activity', agentId ?? 'all', limit],
    queryFn: async () => {
      const data = await apiPost<{ activity: Array<Record<string, unknown>> }>('/api/agents', {
        action: 'activity',
        agent_id: agentId,
        limit,
      });
      return data.activity;
    },
  });
}

/**
 * Recent conversations the current user has had with a specific agent.
 * Session B — powers the "Recent conversations with [Agent]" sidebar on
 * the Agent Profile view.
 */
export function useAgentConversations(agentHandle: string | null | undefined, limit = 25) {
  return useQuery({
    queryKey: ['agents', 'conversations', agentHandle ?? 'none', limit],
    queryFn: async (): Promise<AgentConversationSummary[]> => {
      if (!agentHandle) return [];
      const data = await listAgentConversations({ handle: agentHandle, limit });
      return data.conversations;
    },
    enabled: Boolean(agentHandle),
  });
}
