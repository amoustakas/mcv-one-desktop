// Workflow SDK types — the durable orchestration surface.
//
// A Workflow is a named recipe of Steps. Each Step is a discriminated
// union — StepKind drives which handler runs. The Runner advances from
// Step to Step, persisting state after each (so crashes resume cleanly),
// and emits Fabric events at every lifecycle transition.
//
// The output of a workflow is typically one or more DraftArtifacts —
// agent-produced material that lands in the Jarvis inbox (M4) for
// human review. "Humans propose, algorithms govern, cryptography
// audits" — workflows are the "algorithms govern" execution engine
// that humans approve at the inbox boundary.

// ───────────────────────────────────────────────────────────────────────────
// Workflow definition
// ───────────────────────────────────────────────────────────────────────────

/** A single step in a workflow. Discriminated by `kind`. */
export type WorkflowStep =
  | DispatchAgentStep
  | DraftGateStep
  | HttpStep
  | SqlStep;

export type StepKind = WorkflowStep['kind'];

export interface DispatchAgentStep {
  id: string;
  kind: 'dispatch-agent';
  /** Persona id (e.g., 'hermes', 'argus') */
  agentHandle: string;
  /** Task template. May reference prior-step outputs via `{{step-id.result.field}}`. */
  taskTemplate: string;
  /** Venture context */
  ventureId: string;
  domain: string;
  /** Optional timeout in ms (default 30s) */
  timeoutMs?: number;
}

export interface DraftGateStep {
  id: string;
  kind: 'draft-gate';
  /** Artifact kind produced, e.g. 'email-draft', 'filing-outline', 'decision-record' */
  artifactKind: string;
  /** Who / what should review before the next step fires */
  reviewTarget: 'human-inbox' | 'agent-fleet' | 'auto-approve';
  /** Optional confidence threshold for auto-approve */
  autoApproveConfidence?: number;
}

export interface HttpStep {
  id: string;
  kind: 'http';
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  urlTemplate: string;
  headers?: Record<string, string>;
  bodyTemplate?: unknown;
  timeoutMs?: number;
}

export interface SqlStep {
  id: string;
  kind: 'sql';
  /** Template: named params :userId etc., substituted from prior steps */
  sqlTemplate: string;
  params: Record<string, unknown>;
  /** Whether this step mutates state (affects audit-trail classification) */
  mutating: boolean;
}

export interface WorkflowDefinition {
  /** Stable workflow id (e.g., 'capital.round-opened') */
  id: string;
  /** Human-readable name */
  name: string;
  /** Topic(s) that trigger this workflow */
  triggerTopics: string[];
  /** Steps execute in array order; dependencies implicit (each step sees prior results) */
  steps: WorkflowStep[];
  /** Optional explicit retry policy */
  retry?: { maxAttempts: number; backoffMs: number };
}

// ───────────────────────────────────────────────────────────────────────────
// Runtime state
// ───────────────────────────────────────────────────────────────────────────

export type WorkflowRunStatus =
  | 'pending'
  | 'running'
  | 'awaiting-review'   // blocked on a DraftGate with reviewTarget='human-inbox'
  | 'completed'
  | 'failed'
  | 'canceled';

export type StepRunStatus =
  | 'pending'
  | 'running'
  | 'succeeded'
  | 'failed'
  | 'skipped';

export interface StepResult {
  stepId: string;
  stepKind: StepKind;
  status: StepRunStatus;
  /** Step output data (kind-specific). */
  output: unknown;
  /** Error message when status=failed */
  errorMessage?: string;
  startedAtMs: number;
  completedAtMs?: number;
  /** Number of attempts made (first attempt = 1) */
  attempt: number;
}

export interface WorkflowRun {
  /** UUID of this run */
  id: string;
  workflowId: string;
  /** Event envelope that triggered this run, if any */
  triggerEventId?: string;
  /** Context passed by the trigger */
  triggerPayload: Record<string, unknown>;
  /** Venture scope */
  ventureId: string | null;
  /** Current lifecycle status */
  status: WorkflowRunStatus;
  /** Per-step results, in execution order */
  stepResults: StepResult[];
  /** Artifacts produced during this run */
  artifactIds: string[];
  /** Correlation id for Fabric cascade */
  correlationId: string;
  startedAtMs: number;
  completedAtMs?: number;
  /** Human-readable failure reason when status=failed */
  failureReason?: string;
}

// ───────────────────────────────────────────────────────────────────────────
// Draft artifacts
// ───────────────────────────────────────────────────────────────────────────

export type ArtifactStatus =
  | 'proposed'      // agent-produced, awaiting human review
  | 'approved'      // reviewer accepted; downstream adapter should fire
  | 'rejected'      // reviewer declined; agent memory should learn
  | 'modified'      // reviewer edited before approving
  | 'snoozed'       // deferred to later review cycle
  | 'fired';        // downstream effect has been executed

export interface DraftArtifact {
  id: string;
  /** Artifact kind — drives the close-loop adapter (gmail, counsel-task, memo) */
  kind: string;
  /** Payload (kind-specific). */
  payload: Record<string, unknown>;
  /** Workflow run id that produced this artifact */
  runId: string;
  /** Workflow id that produced this artifact */
  workflowId: string;
  /** Agent that actually drafted the content */
  agentHandle: string;
  /** Venture scope */
  ventureId: string | null;
  /** Confidence score (0-1) assigned by the producing agent */
  confidence: number;
  status: ArtifactStatus;
  /** ISO timestamp of initial creation */
  createdAt: string;
  /** ISO timestamp of last status change */
  updatedAt: string;
  /** Human reviewer who last acted on this artifact, if any */
  reviewerUserId?: string;
  /** Freeform reviewer note */
  reviewerNote?: string;
  /** Optional snooze-until timestamp */
  snoozeUntilMs?: number;
}

// ───────────────────────────────────────────────────────────────────────────
// Trigger event shape
// ───────────────────────────────────────────────────────────────────────────

export interface WorkflowTrigger {
  /** Topic string (see @mcv/events-sdk convention) */
  topic: string;
  payload: Record<string, unknown>;
  ventureId: string | null;
  correlationId: string;
  /** Optional event id if triggered by a Fabric event */
  eventId?: string;
}
