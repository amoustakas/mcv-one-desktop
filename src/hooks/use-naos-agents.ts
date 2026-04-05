// src/hooks/use-naos-agents.ts — React Query hooks for NAOS agent system

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiPost, apiGet } from '../lib/api/client';
import { useNAOSStore } from '../stores/naos';
import type {
  AgentIdentity,
  PersonalityMatrix,
  EmotionalState,
  AgentRelationship,
  CultureSnapshot,
} from '../stores/naos';

// ---------------------------------------------------------------------------
// Query Keys
// ---------------------------------------------------------------------------

export const naosKeys = {
  all: ['naos'] as const,
  agents: (filters?: Record<string, string | undefined>) =>
    ['naos', 'agents', filters] as const,
  agent: (id: string) => ['naos', 'agent', id] as const,
  personality: (id: string) => ['naos', 'personality', id] as const,
  emotional: (id: string) => ['naos', 'emotional', id] as const,
  relationships: (id: string) => ['naos', 'relationships', id] as const,
  predictions: (id: string, limit?: number) =>
    ['naos', 'predictions', id, limit] as const,
  interactions: (id: string, limit?: number) =>
    ['naos', 'interactions', id, limit] as const,
  culture: () => ['naos', 'culture'] as const,
};

// ---------------------------------------------------------------------------
// Queries
// ---------------------------------------------------------------------------

/** Fetch agent roster with optional filters */
export function useNaosAgents(filters?: {
  tier?: number;
  venture?: string;
  status?: string;
}) {
  const setAgents = useNAOSStore((s) => s.setAgents);

  const params: Record<string, string | undefined> = {
    action: 'list-agents',
    tier: filters?.tier?.toString(),
    venture: filters?.venture,
    status: filters?.status,
  };

  return useQuery({
    queryKey: naosKeys.agents(params),
    queryFn: async () => {
      const data = await apiGet<{ agents: AgentIdentity[] }>(
        '/api/naos-agents',
        params,
      );
      setAgents(data.agents);
      return data.agents;
    },
  });
}

/** Fetch a single agent by ID */
export function useNaosAgent(agentId: string) {
  return useQuery({
    queryKey: naosKeys.agent(agentId),
    queryFn: () =>
      apiGet<{ agent: AgentIdentity }>('/api/naos-agents', {
        action: 'get-agent',
        agentId,
      }).then((d) => d.agent),
    enabled: !!agentId,
  });
}

/** Fetch personality matrix for an agent */
export function useNaosPersonality(agentId: string) {
  const setPersonality = useNAOSStore((s) => s.setPersonality);

  return useQuery({
    queryKey: naosKeys.personality(agentId),
    queryFn: async () => {
      const data = await apiGet<{ personality: PersonalityMatrix }>(
        '/api/naos-agents',
        { action: 'get-personality', agentId },
      );
      setPersonality(agentId, data.personality);
      return data.personality;
    },
    enabled: !!agentId,
  });
}

/** Fetch emotional state for an agent */
export function useNaosEmotionalState(agentId: string) {
  const setEmotionalState = useNAOSStore((s) => s.setEmotionalState);

  return useQuery({
    queryKey: naosKeys.emotional(agentId),
    queryFn: async () => {
      const data = await apiGet<{ state: EmotionalState }>(
        '/api/naos-agents',
        { action: 'get-emotional-state', agentId },
      );
      setEmotionalState(agentId, data.state);
      return data.state;
    },
    enabled: !!agentId,
    // Emotional state is volatile — refetch frequently
    refetchInterval: 30_000,
  });
}

/** Fetch relationships for an agent */
export function useNaosRelationships(agentId: string) {
  const setRelationships = useNAOSStore((s) => s.setRelationships);

  return useQuery({
    queryKey: naosKeys.relationships(agentId),
    queryFn: async () => {
      const data = await apiGet<{ relationships: AgentRelationship[] }>(
        '/api/naos-agents',
        { action: 'get-relationships', agentId },
      );
      setRelationships(data.relationships);
      return data.relationships;
    },
    enabled: !!agentId,
  });
}

/** Fetch behavioral predictions for an agent */
export function useNaosPredictions(agentId: string, limit = 10) {
  return useQuery({
    queryKey: naosKeys.predictions(agentId, limit),
    queryFn: () =>
      apiGet<{ predictions: unknown[] }>('/api/naos-agents', {
        action: 'get-predictions',
        agentId,
        limit: limit.toString(),
      }).then((d) => d.predictions),
    enabled: !!agentId,
  });
}

/** Fetch recent interactions for an agent */
export function useNaosInteractions(agentId: string, limit = 20) {
  return useQuery({
    queryKey: naosKeys.interactions(agentId, limit),
    queryFn: () =>
      apiGet<{ interactions: unknown[] }>('/api/naos-agents', {
        action: 'get-interactions',
        agentId,
        limit: limit.toString(),
      }).then((d) => d.interactions),
    enabled: !!agentId,
  });
}

/** Fetch organization-wide culture snapshot */
export function useNaosCulture() {
  const setCultureSnapshot = useNAOSStore((s) => s.setCultureSnapshot);

  return useQuery({
    queryKey: naosKeys.culture(),
    queryFn: async () => {
      const data = await apiGet<{ culture: CultureSnapshot }>(
        '/api/naos-agents',
        { action: 'get-culture' },
      );
      setCultureSnapshot(data.culture);
      return data.culture;
    },
    // Culture is aggregate — refetch less often
    refetchInterval: 60_000,
  });
}

// ---------------------------------------------------------------------------
// Mutations
// ---------------------------------------------------------------------------

/** Create a new agent */
export function useCreateAgent() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (agent: Omit<AgentIdentity, 'id' | 'created_at' | 'updated_at'>) =>
      apiPost<{ agent: AgentIdentity }>('/api/naos-agents', {
        action: 'create-agent',
        agent,
      }).then((d) => d.agent),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: naosKeys.all });
    },
  });
}

/** Update an existing agent */
export function useUpdateAgent() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (params: { agentId: string; updates: Partial<AgentIdentity> }) =>
      apiPost<{ agent: AgentIdentity }>('/api/naos-agents', {
        action: 'update-agent',
        agentId: params.agentId,
        updates: params.updates,
      }).then((d) => d.agent),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: naosKeys.agent(vars.agentId) });
      qc.invalidateQueries({ queryKey: naosKeys.agents() });
    },
  });
}
