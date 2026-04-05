import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as api from '../lib/api/memory';
import type { MemoryFilter, CreateMemoryPayload, CreateEventPayload } from '../lib/types/memory';

export const memoryKeys = {
  memories: (filter?: MemoryFilter) => ['memory', 'project', filter] as const,
  events: (sessionId?: string, eventType?: string) => ['memory', 'events', sessionId, eventType] as const,
  allEvents: () => ['memory', 'events'] as const,
};

/** Query project memory entries with optional filter */
export function useProjectMemory(filter?: MemoryFilter) {
  return useQuery({
    queryKey: memoryKeys.memories(filter),
    queryFn: () => api.listMemories(filter).then((r) => r.memories),
  });
}

/** Query session events for a specific session */
export function useSessionEvents(sessionId?: string, eventType?: string) {
  return useQuery({
    queryKey: memoryKeys.events(sessionId, eventType),
    queryFn: () => api.listSessionEvents(sessionId, eventType).then((r) => r.events),
    enabled: !!sessionId,
  });
}

/** Query all session events (for timeline) */
export function useAllEvents() {
  return useQuery({
    queryKey: memoryKeys.allEvents(),
    queryFn: () => api.listSessionEvents().then((r) => r.events),
  });
}

/** Mutation for creating/updating project memory entries */
export function useMemoryMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateMemoryPayload) => api.upsertMemory(payload).then((r) => r.memory),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['memory', 'project'] });
    },
  });
}

/** Mutation for deleting a project memory entry */
export function useMemoryDelete() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.deleteMemory(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['memory', 'project'] });
    },
  });
}

/** Mutation for appending session events */
export function useEventMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateEventPayload) => api.appendEvent(payload).then((r) => r.event),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['memory', 'events'] });
    },
  });
}
