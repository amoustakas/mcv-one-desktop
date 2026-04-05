/* ═══════════════════════════════════════════ */
/* MCV ONE — Sequential Memory System Types   */
/* ═══════════════════════════════════════════ */

export type MemoryType = 'session' | 'project' | 'user' | 'feedback' | 'reference';

export interface MemoryEntry {
  id: string;
  type: MemoryType;
  key: string;
  value: Record<string, unknown>;
  sessionId: string | null;
  ventureId: string | null;
  userId: string;
  ttlSeconds: number | null; // null = permanent
  createdAt: string;
  updatedAt: string;
}

export type SessionEventType =
  | 'task_start'
  | 'task_complete'
  | 'error'
  | 'decision'
  | 'file_change'
  | 'deploy'
  | 'commit'
  | 'kit_tool_call'
  | 'venture_switch'
  | 'session_start'
  | 'session_end'
  | 'memory_write';

export interface SessionEvent {
  id: string;
  sessionId: string;
  userId: string;
  eventType: SessionEventType;
  payload: Record<string, unknown>;
  ventureId: string | null;
  createdAt: string;
}

export interface MemoryFilter {
  type?: MemoryType;
  ventureId?: string;
  sessionId?: string;
  search?: string;
}

export interface SessionEventFilter {
  sessionId?: string;
  eventType?: SessionEventType;
  ventureId?: string;
  since?: string; // ISO timestamp
  limit?: number;
}

export interface CreateMemoryPayload {
  type: MemoryType;
  key: string;
  value: Record<string, unknown>;
  sessionId?: string;
  ventureId?: string;
  ttlSeconds?: number;
}

export interface CreateEventPayload {
  sessionId: string;
  eventType: SessionEventType;
  payload: Record<string, unknown>;
  ventureId?: string;
}
