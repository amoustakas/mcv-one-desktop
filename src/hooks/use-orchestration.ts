import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiPost } from '../lib/api/client';

const EP = '/api/orchestration';

// ── Types ──
export interface TaskNode {
  id: string;
  title: string;
  description: string;
  task_type: 'epic' | 'sprint' | 'story' | 'task' | 'sub_atomic';
  status: string;
  priority: string;
  progress: number;
  venture_id: string;
  parent_id: string | null;
  sprint_id: string | null;
  session_id: string | null;
  assignee: string | null;
  source: string;
  story_points: number;
  sort_order: number;
  estimated_hours: number;
  actual_hours: number;
  acceptance_criteria: string[];
  tags: string[];
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
  completed_at: string | null;
  children?: TaskNode[];
  // Rollup fields (from roadmap endpoint)
  child_count?: number;
  done_count?: number;
  in_progress_count?: number;
  completion?: number;
}

export interface Session {
  id: string;
  project: string;
  venture_id: string | null;
  status: 'active' | 'idle' | 'completed' | 'abandoned';
  started_at: string;
  last_active: string;
  ended_at: string | null;
  plan_file: string | null;
  worktree: string | null;
  summary: string | null;
  commits_count: number;
  files_changed: number;
  metadata: Record<string, unknown>;
}

export interface SessionEvent {
  id: string;
  session_id: string;
  event_type: string;
  title: string;
  description: string | null;
  venture_id: string | null;
  task_id: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
}

// ── Query Keys ──
export const orchKeys = {
  epics: (ventureId?: string) => ['orchestration', 'epics', ventureId] as const,
  epic: (id: string) => ['orchestration', 'epic', id] as const,
  roadmap: () => ['orchestration', 'roadmap'] as const,
  sessions: () => ['orchestration', 'sessions'] as const,
  timeline: (sessionId?: string) => ['orchestration', 'timeline', sessionId] as const,
};

// ── Hooks ──

/** All epics, optionally filtered by venture */
export function useEpics(ventureId?: string) {
  return useQuery({
    queryKey: orchKeys.epics(ventureId),
    queryFn: () => apiPost<{ epics: TaskNode[] }>(EP, { action: 'list-epics', venture_id: ventureId }).then(r => r.epics),
  });
}

/** Single epic with full child hierarchy */
export function useEpicDetail(id: string) {
  return useQuery({
    queryKey: orchKeys.epic(id),
    queryFn: () => apiPost<{ epic: TaskNode; children: TaskNode[] }>(EP, { action: 'get-epic', id }),
    enabled: !!id,
  });
}

/** Roadmap overview: all epics with completion stats + active sessions */
export function useRoadmap() {
  return useQuery({
    queryKey: orchKeys.roadmap(),
    queryFn: () => apiPost<{ epics: TaskNode[]; sessions: Session[] }>(EP, { action: 'roadmap' }),
    staleTime: 30_000,
    refetchInterval: 60_000,
  });
}

/** Active sessions across all projects */
export function useSessions() {
  return useQuery({
    queryKey: orchKeys.sessions(),
    queryFn: () => apiPost<{ sessions: Session[] }>(EP, { action: 'list-sessions' }).then(r => r.sessions),
    refetchInterval: 30_000,
  });
}

/** Session event timeline */
export function useSessionTimeline(sessionId?: string) {
  return useQuery({
    queryKey: orchKeys.timeline(sessionId),
    queryFn: () => apiPost<{ events: SessionEvent[] }>(EP, { action: 'session-timeline', session_id: sessionId }).then(r => r.events),
    refetchInterval: 15_000,
  });
}

/** Create a task at any hierarchy level */
export function useCreateTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (task: {
      title: string; task_type: TaskNode['task_type']; description?: string;
      parent_id?: string; venture_id?: string; priority?: string; assignee?: string;
      session_id?: string; story_points?: number; acceptance_criteria?: string[];
    }) => apiPost<{ task: TaskNode }>(EP, { action: 'create', ...task }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['orchestration'] });
      qc.invalidateQueries({ queryKey: ['tasks'] });
    },
  });
}

/** Update task progress (auto-rolls up to parent) */
export function useUpdateProgress() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, progress }: { id: string; progress?: number }) =>
      apiPost(EP, { action: 'update-progress', id, progress }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['orchestration'] });
      qc.invalidateQueries({ queryKey: ['tasks'] });
    },
  });
}

/** Send session heartbeat */
export function useSessionHeartbeat() {
  return useMutation({
    mutationFn: (session: {
      session_id: string; project: string; venture_id?: string;
      summary?: string; plan_file?: string; worktree?: string;
      commits_count?: number; files_changed?: number;
    }) => apiPost(EP, { action: 'session-heartbeat', ...session }),
  });
}

/** Log a session event */
export function useLogSessionEvent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (event: {
      session_id: string; event_type: string; title: string;
      description?: string; venture_id?: string; task_id?: string;
      metadata?: Record<string, unknown>;
    }) => apiPost(EP, { action: 'log-event', ...event }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['orchestration', 'timeline'] });
    },
  });
}
