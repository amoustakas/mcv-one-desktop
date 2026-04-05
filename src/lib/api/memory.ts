import { apiGet, apiPost } from './client';
import type { MemoryEntry, SessionEvent, MemoryFilter, CreateMemoryPayload, CreateEventPayload } from '../types/memory';

const EP = '/api/memory';

export async function listMemories(filter?: MemoryFilter) {
  return apiGet<{ memories: MemoryEntry[] }>(EP, {
    type: filter?.type,
    ventureId: filter?.ventureId,
    sessionId: filter?.sessionId,
    search: filter?.search,
  });
}

export async function upsertMemory(payload: CreateMemoryPayload) {
  return apiPost<{ memory: MemoryEntry }>(EP, {
    type: payload.type,
    key: payload.key,
    value: payload.value,
    sessionId: payload.sessionId,
    ventureId: payload.ventureId,
    ttlSeconds: payload.ttlSeconds,
  });
}

export async function deleteMemory(id: string) {
  // Use fetch directly for DELETE since apiGet/apiPost only handle GET/POST
  const res = await fetch(`${EP}?id=${encodeURIComponent(id)}`, { method: 'DELETE' });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || `Delete failed: ${res.status}`);
  }
  return res.json() as Promise<{ success: boolean }>;
}

export async function listSessionEvents(sessionId?: string, eventType?: string, limit?: number) {
  return apiGet<{ events: SessionEvent[] }>(EP, {
    events: 'true',
    sessionId,
    eventType,
    limit: limit?.toString(),
  });
}

export async function appendEvent(payload: CreateEventPayload) {
  return apiPost<{ event: SessionEvent }>(EP, {
    event: true,
    sessionId: payload.sessionId,
    eventType: payload.eventType,
    payload: payload.payload,
    ventureId: payload.ventureId,
  });
}
