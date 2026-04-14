// @mcv/task-sdk/types — Epic / Story / Task / Checkpoint type system.
//
// Mirrors the Supabase schema from supabase/migration-epics.sql.
// Single source of truth across every MCV venture app.

// ── Status enums ────────────────────────────────────────────────────────────

export type EpicStatus =
  | 'draft'
  | 'proposed'
  | 'approved'
  | 'in-progress'
  | 'blocked'
  | 'review'
  | 'done'
  | 'cancelled';

export type EpicPriority = 'critical' | 'high' | 'medium' | 'low';

export type StoryStatus =
  | 'todo'
  | 'in-progress'
  | 'review'
  | 'blocked'
  | 'done'
  | 'cancelled';

export type CheckpointType =
  | 'spec-review'
  | 'design-review'
  | 'pre-commit'
  | 'pre-merge'
  | 'pre-deploy'
  | 'post-deploy'
  | 'custom';

export type CheckpointState =
  | 'pending'
  | 'awaiting-review'
  | 'approved'
  | 'rejected'
  | 'skipped';

// The ordered ladder the Epic Board kanban uses (excludes draft/blocked/cancelled
// which live in aux panels).
export const EPIC_COLUMN_ORDER: EpicStatus[] = [
  'proposed', 'approved', 'in-progress', 'review', 'done',
];

// ── Row types ───────────────────────────────────────────────────────────────

export interface EpicRow {
  id: string;
  title: string;
  summary: string | null;
  spec_md: string | null;
  venture_id: string | null;
  suite: string | null;
  owner_agent: string | null;
  created_by: string | null;
  status: EpicStatus;
  priority: EpicPriority;
  priority_order: number;
  progress_pct: number;
  target_completion: string | null;
  tags: string[];
  linked_docs: string[];
  created_at: string;
  updated_at: string;
  completed_at: string | null;
}

export interface StoryRow {
  id: string;
  epic_id: string;
  title: string;
  description: string | null;
  acceptance_criteria: string[];
  assigned_agent: string | null;
  status: StoryStatus;
  priority_order: number;
  artifacts: Array<Record<string, unknown>>;
  kit_invocations: Array<Record<string, unknown>>;
  estimated_effort: string | null;
  created_at: string;
  updated_at: string;
  completed_at: string | null;
}

export interface CheckpointRow {
  id: string;
  epic_id: string;
  checkpoint_type: CheckpointType;
  title: string;
  description: string | null;
  required_approvers: string[];
  approved_by: string[];
  state: CheckpointState;
  decision_notes: string | null;
  payload: Record<string, unknown>;
  created_at: string;
  resolved_at: string | null;
}

// ── Session claim invocation record ─────────────────────────────────────────

/**
 * Appended to story.kit_invocations when a Claude Code session calls the
 * claim_story tool. Enables multi-session coordination across parallel
 * windows.
 */
export interface SessionClaimInvocation {
  type: 'session_claim';
  session_id: string;
  at: string;
  note: string | null;
}

export interface SessionReleaseInvocation {
  type: 'session_release';
  session_id: string;
  at: string;
}

export type KitInvocation =
  | SessionClaimInvocation
  | SessionReleaseInvocation
  | ({ type: string; [key: string]: unknown });

// ── Task row (pre-existing — extended with epic/story linkage) ──────────────

export interface TaskRow {
  id: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  venture_id: string | null;
  assignee: string | null;
  due_date: string | null;
  tags: string[];
  created_at: string;
  // Epic/story linkage (from migration-epics.sql tasks table extension)
  epic_id: string | null;
  story_id: string | null;
  assigned_agent: string | null;
  kit_invocations: KitInvocation[];
  outputs: Array<Record<string, unknown>>;
}

// ── Roll-up helpers ─────────────────────────────────────────────────────────

/**
 * Compute progress_pct the same way the recompute_epic_progress Postgres
 * trigger does, for client-side optimistic UI updates.
 */
export function computeEpicProgress(stories: Pick<StoryRow, 'status'>[]): number {
  if (stories.length === 0) return 0;
  const done = stories.filter(s => s.status === 'done').length;
  return Math.round((done / stories.length) * 100);
}
