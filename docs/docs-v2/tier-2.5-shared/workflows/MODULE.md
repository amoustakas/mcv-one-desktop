# @mcv/shared/workflows — Workflow Automation Engine

**Parent Package:** @mcv/shared  
**Tier:** 2.5 (Shared Business Utilities)  
**Classification:** PUBLISHABLE  
**Last Updated:** February 8, 2026

---

## Purpose

The `workflows` module is a full-featured **graph-based workflow automation engine** powering every automated business process in MCV.ONE. It provides DAG (Directed Acyclic Graph) execution with 80+ node types spanning triggers, actions, flow control, AI, and integrations. Features include human-in-the-loop (HITL) approvals with escalation, version-controlled workflow definitions with full node/edge snapshots, sub-workflow invocation, parallel execution branches, business hours awareness, conditional branching, retry policies, and a templates marketplace.

**Every automated process — from lead nurture sequences to invoice approval chains to AI-powered classification pipelines — is modeled, versioned, and executed through this engine.**

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          WORKFLOW AUTOMATION ENGINE                          │
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │                        TRIGGER LAYER                                │    │
│  │                                                                     │    │
│  │  Events ──► Cron ──► Webhooks ──► Manual ──► Sub-workflow           │    │
│  │    │         │          │           │              │                 │    │
│  │    └─────────┴──────────┴───────────┴──────────────┘                │    │
│  │                          │                                          │    │
│  │                    Condition Evaluator                               │    │
│  │              (ConditionGroup: AND/OR/NOT)                           │    │
│  └──────────────────────────┬──────────────────────────────────────────┘    │
│                              │                                               │
│  ┌──────────────────────────▼──────────────────────────────────────────┐    │
│  │                     DAG EXECUTION ENGINE                            │    │
│  │                                                                     │    │
│  │   ┌─────────┐    ┌──────────┐    ┌───────────┐    ┌─────────┐     │    │
│  │   │ Node    │───►│ Edge     │───►│ Condition │───►│ Node    │     │    │
│  │   │ (step)  │    │ (link)   │    │ Evaluator │    │ (step)  │     │    │
│  │   └─────────┘    └──────────┘    └───────────┘    └─────────┘     │    │
│  │        │                                               │           │    │
│  │        │         ┌──────────────┐                      │           │    │
│  │        ├────────►│  Parallel    │◄─────────────────────┤           │    │
│  │        │         │  Executor    │                      │           │    │
│  │        │         └──────────────┘                      │           │    │
│  │        │                                               │           │    │
│  │        │         ┌──────────────┐                      │           │    │
│  │        └────────►│  Sub-Wf      │──────────────────────┘           │    │
│  │                  │  Invoker     │                                   │    │
│  │                  └──────────────┘                                   │    │
│  │                                                                     │    │
│  │   Flow Control: if_else │ switch │ split_test │ wait │ loop        │    │
│  │                  parallel │ try_catch │ goto │ delay_until          │    │
│  │                  rate_limit │ approval │ sub_workflow               │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                              │                                               │
│  ┌──────────────────────────▼──────────────────────────────────────────┐    │
│  │                     HITL APPROVAL LAYER                             │    │
│  │                                                                     │    │
│  │   Request ──► Assign ──► Pending ──┬──► Approved ──► Resume        │    │
│  │                                     ├──► Rejected ──► Branch/Stop   │    │
│  │                                     ├──► Expired  ──► Escalate      │    │
│  │                                     └──► Escalated ──► Re-assign    │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                              │                                               │
│  ┌──────────────────────────▼──────────────────────────────────────────┐    │
│  │                     PERSISTENCE LAYER                               │    │
│  │                                                                     │    │
│  │   workflows ◄──► workflow_versions ◄──► workflow_executions         │    │
│  │                                         workflow_step_executions     │    │
│  │   workflow_templates    workflow_approvals    workflow_runs (v1)     │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Exports

```typescript
// ═══════════════════════════════════════════════════════════════════════════════
// WORKFLOW DEFINITION
// ═══════════════════════════════════════════════════════════════════════════════

export {
  defineWorkflow,            // Create a workflow definition
  createWorkflowInstance,    // Instantiate a workflow for execution
  publishVersion,            // Publish a new workflow version
  getWorkflowDefinition,     // Get workflow with nodes/edges
} from './server/services/workflow-service';

// ═══════════════════════════════════════════════════════════════════════════════
// EXECUTION ENGINE
// ═══════════════════════════════════════════════════════════════════════════════

export {
  executeWorkflow,           // Start workflow execution
  pauseExecution,            // Pause running execution
  resumeExecution,           // Resume paused execution
  cancelExecution,           // Cancel running execution
  retryStep,                 // Retry a failed step
  getExecutionStatus,        // Get execution state + step statuses
  getExecutionHistory,       // Get full execution timeline
} from './server/services/execution-service';

// ═══════════════════════════════════════════════════════════════════════════════
// TRIGGER MANAGEMENT
// ═══════════════════════════════════════════════════════════════════════════════

export {
  registerTrigger,           // Register event-based trigger
  evaluateTrigger,           // Evaluate trigger conditions
  fireTrigger,               // Manually fire a trigger
  listActiveTriggers,        // List active triggers for a venture
} from './server/services/trigger-service';

// ═══════════════════════════════════════════════════════════════════════════════
// APPROVAL (HITL)
// ═══════════════════════════════════════════════════════════════════════════════

export {
  requestApproval,           // Create approval request
  approveStep,               // Approve a pending step
  rejectStep,                // Reject a pending step
  escalateApproval,          // Escalate to next approver
  getApprovalQueue,          // Get pending approvals for user
  getPendingApprovals,       // Get all pending approvals for workflow
} from './server/services/approval-service';

// ═══════════════════════════════════════════════════════════════════════════════
// VERSIONING
// ═══════════════════════════════════════════════════════════════════════════════

export {
  createVersion,             // Create new version snapshot
  getVersion,                // Get specific version
  listVersions,              // List all versions for workflow
  diffVersions,              // Compare two versions
  rollbackToVersion,         // Rollback to a prior version
} from './server/services/version-service';

// ═══════════════════════════════════════════════════════════════════════════════
// TEMPLATES MARKETPLACE
// ═══════════════════════════════════════════════════════════════════════════════

export {
  listTemplates,             // Browse available templates
  getTemplate,               // Get template details
  createFromTemplate,        // Create workflow from template
  publishTemplate,           // Publish workflow as template
  importTemplate,            // Import template into venture
} from './server/services/template-service';

// ═══════════════════════════════════════════════════════════════════════════════
// CONDITION EVALUATOR
// ═══════════════════════════════════════════════════════════════════════════════

export {
  evaluateCondition,         // Evaluate a single condition
  evaluateConditionGroup,    // Evaluate nested AND/OR/NOT conditions
} from './server/services/condition-service';

// ═══════════════════════════════════════════════════════════════════════════════
// CLIENT HOOKS (React)
// ═══════════════════════════════════════════════════════════════════════════════

export { useWorkflowBuilder } from './client/hooks/use-workflow-builder';
export { useWorkflowExecution } from './client/hooks/use-workflow-execution';
export { useApprovalQueue } from './client/hooks/use-approval-queue';
export { useWorkflowTemplates } from './client/hooks/use-workflow-templates';

// ═══════════════════════════════════════════════════════════════════════════════
// CLIENT COMPONENTS (React)
// ═══════════════════════════════════════════════════════════════════════════════

export { WorkflowCanvas } from './client/components/workflow-canvas';
export { NodePalette } from './client/components/node-palette';
export { ExecutionTimeline } from './client/components/execution-timeline';
export { ApprovalPanel } from './client/components/approval-panel';
export { TemplateGallery } from './client/components/template-gallery';

// ═══════════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════════

export type {
  // Graph types
  WorkflowNode,
  WorkflowEdge,
  WorkflowNodeType,

  // Condition types
  Condition,
  ConditionGroup,
  ComparisonOperator,

  // Execution types
  WorkflowExecutionStatus,
  StepExecutionStatus,
  ApprovalStatus,

  // Config types
  BusinessHoursConfig,
  WorkflowTriggerConditions,
  WorkflowAction,

  // Entity types
  Workflow,
  NewWorkflow,
  WorkflowVersion,
  NewWorkflowVersion,
  WorkflowExecution,
  NewWorkflowExecution,
  WorkflowStepExecution,
  NewWorkflowStepExecution,
  WorkflowApproval,
  NewWorkflowApproval,
  WorkflowTemplate,
  NewWorkflowTemplate,
  WorkflowRun,
  NewWorkflowRun,
  WorkflowTriggerData,
  ExecutedAction,
} from './types';

// ═══════════════════════════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════════════════════════

export {
  workflowTriggerTypes,
  workflowExecutionStatuses,
  stepExecutionStatuses,
  approvalStatuses,
  workflowRunStatuses,
} from './constants';
```

---

## TypeScript Interfaces

### WorkflowNode

A single node in the workflow graph. Nodes can be triggers, actions, or flow control elements.

```typescript
interface WorkflowNode {
  /** Unique node ID within the workflow */
  id: string;
  /** Node type — determines behavior and config shape */
  type: WorkflowNodeType;
  /** Display label in the canvas */
  label: string;
  /** Canvas position for the visual builder */
  position: { x: number; y: number };
  /** Type-specific configuration (varies by node type) */
  config: Record<string, unknown>;
  /** Optional metadata (color, notes, etc.) */
  metadata?: Record<string, unknown>;
}
```

### WorkflowEdge

An edge connecting two nodes in the workflow graph. Edges can carry conditions for branching.

```typescript
interface WorkflowEdge {
  /** Unique edge ID */
  id: string;
  /** Source node ID */
  source: string;
  /** Target node ID */
  target: string;
  /** Source handle (for nodes with multiple outputs, e.g., if_else → "true" | "false") */
  sourceHandle?: string;
  /** Target handle (for nodes with multiple inputs) */
  targetHandle?: string;
  /** Display label on the edge */
  label?: string;
  /** Condition that must evaluate to true for this edge to be traversed */
  condition?: ConditionGroup;
}
```

### ConditionGroup & Condition

Recursive condition tree supporting AND/OR/NOT logic with 22 comparison operators.

```typescript
type ComparisonOperator =
  | 'equals' | 'not_equals'
  | 'contains' | 'not_contains'
  | 'starts_with' | 'ends_with'
  | 'regex_match'
  | 'greater_than' | 'less_than'
  | 'greater_than_or_equal' | 'less_than_or_equal'
  | 'between'
  | 'is_empty' | 'is_not_empty'
  | 'before' | 'after'
  | 'within_last' | 'within_next'
  | 'day_of_week' | 'hour_of_day'
  | 'includes' | 'not_includes'
  | 'array_length';

interface Condition {
  field: string;
  operator: ComparisonOperator;
  value?: unknown;
}

interface ConditionGroup {
  logic: 'AND' | 'OR' | 'NOT';
  conditions: Array<Condition | ConditionGroup>;  // Recursive nesting
}
```

### BusinessHoursConfig

```typescript
interface BusinessHoursConfig {
  timezone: string;                              // IANA timezone, e.g. "America/New_York"
  workingDays: number[];                         // 0=Sun, 6=Sat. e.g. [1,2,3,4,5]
  workingHours: { start: string; end: string };  // "09:00", "17:00"
  holidays: string[];                            // ISO date strings ["2026-12-25"]
}
```

### Status Types

```typescript
// Workflow execution lifecycle
type WorkflowExecutionStatus = 'running' | 'completed' | 'failed' | 'paused' | 'cancelled';

// Individual step lifecycle
type StepExecutionStatus = 'pending' | 'running' | 'completed' | 'failed' | 'skipped' | 'waiting_approval';

// HITL approval lifecycle
type ApprovalStatus = 'pending' | 'approved' | 'rejected' | 'expired' | 'escalated';

// V1 workflow run status (simplified)
type WorkflowRunStatus = 'running' | 'completed' | 'failed';
```

### WorkflowTriggerConditions

```typescript
interface WorkflowTriggerConditions {
  taskStatus?: string[];
  taskPriority?: string[];
  taskType?: string[];
  assigneeIds?: string[];
  daysBeforeDue?: number;      // For task_due_approaching
  daysOverdue?: number;        // For task_overdue
  fieldConditions?: Array<{
    field: string;
    operator: 'eq' | 'neq' | 'gt' | 'lt' | 'gte' | 'lte' | 'in' | 'contains';
    value: unknown;
  }>;
  [key: string]: unknown;      // Extensible
}
```

### WorkflowAction (V1)

```typescript
interface WorkflowAction {
  id: string;
  type: 'send_notification' | 'update_field' | 'assign_user' | 'create_task'
      | 'add_comment' | 'webhook' | 'custom';
  config: {
    notificationType?: 'email' | 'in_app' | 'sms' | 'push';
    recipientType?: 'assignee' | 'creator' | 'specific_users' | 'role';
    recipientIds?: string[];
    templateId?: string;
    subject?: string;
    message?: string;
    fieldName?: string;
    fieldValue?: unknown;
    assignToUserId?: string;
    assignToRole?: string;
    taskTemplate?: {
      title: string;
      description?: string;
      priority?: string;
      dueInDays?: number;
    };
    commentText?: string;
    webhookUrl?: string;
    webhookMethod?: 'POST' | 'PUT' | 'PATCH';
    webhookHeaders?: Record<string, string>;
    webhookPayload?: Record<string, unknown>;
    [key: string]: unknown;
  };
  order: number;
  condition?: {
    field: string;
    operator: 'eq' | 'neq' | 'gt' | 'lt' | 'gte' | 'lte' | 'in' | 'contains';
    value: unknown;
  };
}
```

### WorkflowTriggerData (V1 Runs)

```typescript
interface WorkflowTriggerData {
  eventType: string;
  taskId?: string;
  taskTitle?: string;
  taskStatus?: string;
  taskPriority?: string;
  taskAssigneeId?: string;
  previousValue?: unknown;
  newValue?: unknown;
  triggeredByUserId?: string;
  [key: string]: unknown;
}
```

### ExecutedAction (V1 Runs)

```typescript
interface ExecutedAction {
  actionId: string;
  actionType: WorkflowAction['type'];
  status: 'success' | 'failed' | 'skipped';
  executedAt: string;     // ISO timestamp
  result?: {
    notificationId?: string;
    updatedFields?: Record<string, unknown>;
    createdTaskId?: string;
    webhookResponse?: { statusCode: number; body?: unknown };
    [key: string]: unknown;
  };
  error?: { code: string; message: string; details?: unknown };
  durationMs?: number;
}
```

---

## WorkflowNodeType — Complete Reference (80+ Types)

### Triggers (50 types)

| Category | Node Type | Description |
|----------|-----------|-------------|
| **Contact** | `trigger_contact_created` | New contact added |
| | `trigger_contact_updated` | Contact field changed |
| | `trigger_contact_tagged` | Tag applied to contact |
| | `trigger_contact_scored` | Lead score threshold crossed |
| | `trigger_contact_deleted` | Contact removed |
| | `trigger_birthday` | Contact birthday |
| | `trigger_anniversary` | Contact anniversary |
| **Deal** | `trigger_deal_stage_changed` | Deal moved to new stage |
| | `trigger_deal_won` | Deal marked as won |
| | `trigger_deal_lost` | Deal marked as lost |
| | `trigger_deal_created` | New deal created |
| | `trigger_deal_updated` | Deal field changed |
| | `trigger_deal_deleted` | Deal removed |
| | `trigger_pipeline_stage_changed` | Pipeline stage change |
| **Communication** | `trigger_sms_received` | Inbound SMS |
| | `trigger_sms_sent` | Outbound SMS sent |
| | `trigger_email_opened` | Email opened |
| | `trigger_email_clicked` | Email link clicked |
| | `trigger_email_bounced` | Email bounced |
| | `trigger_email_sent` | Email sent |
| | `trigger_email_replied` | Email reply received |
| | `trigger_call_completed` | Phone call completed |
| | `trigger_call_missed` | Phone call missed |
| | `trigger_voicemail_received` | Voicemail left |
| | `trigger_conversation_started` | Chat conversation opened |
| | `trigger_conversation_closed` | Chat conversation closed |
| **Form / Survey** | `trigger_form_submitted` | Form submission |
| | `trigger_survey_completed` | Survey completed |
| **Appointment** | `trigger_appointment_booked` | Booking created |
| | `trigger_appointment_cancelled` | Booking cancelled |
| | `trigger_appointment_reminder` | Reminder due |
| **Payment** | `trigger_payment_received` | Payment collected |
| | `trigger_invoice_created` | Invoice generated |
| | `trigger_invoice_paid` | Invoice paid |
| | `trigger_invoice_overdue` | Invoice past due |
| | `trigger_subscription_created` | Subscription started |
| | `trigger_subscription_cancelled` | Subscription cancelled |
| | `trigger_membership_created` | Membership started |
| | `trigger_membership_cancelled` | Membership cancelled |
| | `trigger_refund_issued` | Refund processed |
| **Task** | `trigger_task_completed` | Task completed |
| | `trigger_task_overdue` | Task past due |
| | `trigger_task_created` | Task created |
| | `trigger_task_status_changed` | Task status changed |
| | `trigger_task_assigned` | Task assigned |
| | `trigger_task_due_approaching` | Task due soon |
| **Other** | `trigger_workflow_completed` | Another workflow finished |
| | `trigger_cron` | Scheduled (cron expression) |
| | `trigger_webhook_received` | Inbound webhook |
| | `trigger_manual` | Manual trigger by user |
| | `trigger_custom_event` | Custom event name |
| | `trigger_note_added` | Note added to entity |
| | `trigger_tag_added` | Tag added |
| | `trigger_tag_removed` | Tag removed |
| **Advertising** | `trigger_facebook_lead` | Facebook lead form |
| | `trigger_google_lead` | Google Ads lead |

### Actions — Communication (6 types)

| Node Type | Description |
|-----------|-------------|
| `send_sms` | Send SMS message |
| `send_email` | Send email (templated) |
| `send_whatsapp` | Send WhatsApp message |
| `make_call` | Initiate phone call |
| `voicemail_drop` | Drop pre-recorded voicemail |
| `send_internal_notification` | Notify team member |

### Actions — CRM (10 types)

| Node Type | Description |
|-----------|-------------|
| `create_contact` | Create new contact |
| `update_contact` | Update contact fields |
| `add_tag` | Add tag to contact |
| `remove_tag` | Remove tag from contact |
| `create_deal` | Create new deal |
| `update_deal` | Update deal fields |
| `update_deal_stage` | Move deal to stage |
| `add_note` | Add note to entity |
| `add_activity` | Log activity |
| `assign_user` | Assign owner/user |

### Actions — Task (3 types)

| Node Type | Description |
|-----------|-------------|
| `create_task` | Create new task |
| `update_task` | Update task fields |
| `complete_task` | Mark task complete |

### Actions — Data (6 types)

| Node Type | Description |
|-----------|-------------|
| `set_variable` | Set runtime variable |
| `math_operation` | Arithmetic operations |
| `text_formatter` | String manipulation |
| `array_operation` | Array filter/map/reduce |
| `json_transform` | JSON path transformation |
| `http_request` | External HTTP request |

### Actions — AI (5 types)

| Node Type | Description |
|-----------|-------------|
| `ai_prompt` | Free-form LLM prompt |
| `ai_classify` | AI-powered classification |
| `ai_extract` | Extract structured data from text |
| `ai_summarize` | Summarize content |
| `rag_search` | RAG knowledge base search |

### Actions — Integration (3 types)

| Node Type | Description |
|-----------|-------------|
| `webhook_send` | Send outbound webhook |
| `zapier_trigger` | Trigger Zapier automation |
| `custom_code` | Execute custom JavaScript |

### Actions — Payment (3 types)

| Node Type | Description |
|-----------|-------------|
| `create_invoice` | Generate invoice |
| `charge_customer` | Charge payment method |
| `create_subscription` | Create recurring subscription |

### Flow Control (12 types)

| Node Type | Description |
|-----------|-------------|
| `if_else` | Conditional branch (true/false) |
| `switch` | Multi-way branch (N outputs) |
| `split_test` | A/B test (percentage-based routing) |
| `wait` | Delay for fixed duration |
| `delay_until` | Wait until specific date/time |
| `loop` | Iterate over array or count |
| `parallel` | Execute branches concurrently |
| `try_catch` | Error handling wrapper |
| `approval` | HITL approval gate |
| `goto` | Jump to another node |
| `sub_workflow` | Invoke another workflow |
| `rate_limit` | Throttle execution rate |

---

## Database Schemas

### `workflows` — Core Workflow Definitions

```sql
CREATE TABLE workflows (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  venture_id      UUID NOT NULL REFERENCES ventures(id) ON DELETE CASCADE,
  name            TEXT NOT NULL,
  description     TEXT,
  trigger_type    TEXT NOT NULL,  -- enum: task_created, task_status_changed,
                                 --   task_assigned, task_due_approaching,
                                 --   task_overdue, manual
  trigger_conditions  JSONB NOT NULL DEFAULT '{}',  -- WorkflowTriggerConditions
  actions         JSONB NOT NULL DEFAULT '[]',       -- WorkflowAction[]
  is_active       BOOLEAN DEFAULT true,
  run_count       INTEGER DEFAULT 0,
  last_run_at     TIMESTAMPTZ,
  created_by      UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX workflows_venture_idx ON workflows(venture_id);
CREATE INDEX workflows_trigger_type_idx ON workflows(trigger_type);
CREATE INDEX workflows_is_active_idx ON workflows(is_active);
CREATE INDEX workflows_venture_active_idx ON workflows(venture_id, is_active);
CREATE INDEX workflows_venture_trigger_idx ON workflows(venture_id, trigger_type);
CREATE INDEX workflows_created_by_idx ON workflows(created_by);
```

### `workflow_versions` — Version History with Node/Edge Snapshots

```sql
CREATE TABLE workflow_versions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_id     UUID NOT NULL REFERENCES workflows(id) ON DELETE CASCADE,
  version         INTEGER NOT NULL,
  nodes           JSONB NOT NULL DEFAULT '[]',  -- WorkflowNode[]
  edges           JSONB NOT NULL DEFAULT '[]',  -- WorkflowEdge[]
  changelog       TEXT,
  created_by      UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX wf_versions_workflow_idx ON workflow_versions(workflow_id);
CREATE INDEX wf_versions_workflow_version_idx ON workflow_versions(workflow_id, version);
```

### `workflow_executions` — V2 Detailed Execution Logs

```sql
CREATE TABLE workflow_executions (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_id           UUID NOT NULL REFERENCES workflows(id) ON DELETE CASCADE,
  version_id            UUID REFERENCES workflow_versions(id) ON DELETE SET NULL,
  trigger_id            TEXT,
  trigger_data          JSONB DEFAULT '{}',
  status                TEXT NOT NULL DEFAULT 'running',  -- running|completed|failed|paused|cancelled
  started_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at          TIMESTAMPTZ,
  error                 TEXT,
  contact_id            UUID,
  venture_id            UUID NOT NULL REFERENCES ventures(id) ON DELETE CASCADE,
  parent_execution_id   UUID,  -- Self-reference for sub-workflows
  variables             JSONB DEFAULT '{}',  -- Runtime variables accumulated during execution
  is_test               BOOLEAN DEFAULT false,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX wf_exec_workflow_idx ON workflow_executions(workflow_id);
CREATE INDEX wf_exec_status_idx ON workflow_executions(status);
CREATE INDEX wf_exec_venture_idx ON workflow_executions(venture_id);
CREATE INDEX wf_exec_contact_idx ON workflow_executions(contact_id);
CREATE INDEX wf_exec_parent_idx ON workflow_executions(parent_execution_id);
CREATE INDEX wf_exec_started_idx ON workflow_executions(started_at);
CREATE INDEX wf_exec_workflow_status_idx ON workflow_executions(workflow_id, status);
```

### `workflow_step_executions` — Per-Step Execution Detail

```sql
CREATE TABLE workflow_step_executions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  execution_id    UUID NOT NULL REFERENCES workflow_executions(id) ON DELETE CASCADE,
  node_id         TEXT NOT NULL,
  node_type       TEXT NOT NULL,
  status          TEXT NOT NULL DEFAULT 'pending',  -- pending|running|completed|failed|skipped|waiting_approval
  input           JSONB DEFAULT '{}',
  output          JSONB DEFAULT '{}',
  error           TEXT,
  started_at      TIMESTAMPTZ,
  completed_at    TIMESTAMPTZ,
  retry_count     INTEGER DEFAULT 0,
  approved_by     UUID REFERENCES users(id) ON DELETE SET NULL,
  approved_at     TIMESTAMPTZ
);

-- Indexes
CREATE INDEX wf_step_exec_execution_idx ON workflow_step_executions(execution_id);
CREATE INDEX wf_step_exec_node_idx ON workflow_step_executions(execution_id, node_id);
CREATE INDEX wf_step_exec_status_idx ON workflow_step_executions(status);
```

### `workflow_approvals` — HITL Approval Records

```sql
CREATE TABLE workflow_approvals (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  step_execution_id   UUID NOT NULL REFERENCES workflow_step_executions(id) ON DELETE CASCADE,
  workflow_id         UUID NOT NULL REFERENCES workflows(id) ON DELETE CASCADE,
  requested_by        UUID REFERENCES users(id) ON DELETE SET NULL,
  assigned_to         JSONB NOT NULL DEFAULT '[]',  -- string[] of user IDs
  status              TEXT NOT NULL DEFAULT 'pending',  -- pending|approved|rejected|expired|escalated
  reason              TEXT,
  expires_at          TIMESTAMPTZ,
  escalate_to         UUID REFERENCES users(id) ON DELETE SET NULL,
  escalated_at        TIMESTAMPTZ,
  decided_by          UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX wf_approvals_step_exec_idx ON workflow_approvals(step_execution_id);
CREATE INDEX wf_approvals_workflow_idx ON workflow_approvals(workflow_id);
CREATE INDEX wf_approvals_status_idx ON workflow_approvals(status);
CREATE INDEX wf_approvals_expires_idx ON workflow_approvals(expires_at);
```

### `workflow_templates` — Reusable Templates Marketplace

```sql
CREATE TABLE workflow_templates (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name            TEXT NOT NULL,
  description     TEXT,
  category        TEXT,
  nodes           JSONB NOT NULL DEFAULT '[]',  -- WorkflowNode[]
  edges           JSONB NOT NULL DEFAULT '[]',  -- WorkflowEdge[]
  icon            TEXT,
  is_public       BOOLEAN DEFAULT false,
  usage_count     INTEGER DEFAULT 0,
  author_id       UUID REFERENCES users(id) ON DELETE SET NULL,
  venture_id      UUID REFERENCES ventures(id) ON DELETE CASCADE,
  tags            JSONB DEFAULT '[]',  -- string[]
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX wf_templates_venture_idx ON workflow_templates(venture_id);
CREATE INDEX wf_templates_category_idx ON workflow_templates(category);
CREATE INDEX wf_templates_public_idx ON workflow_templates(is_public);
CREATE INDEX wf_templates_author_idx ON workflow_templates(author_id);
```

### `workflow_runs` — V1 Simplified Run Log

```sql
CREATE TABLE workflow_runs (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_id     UUID NOT NULL REFERENCES workflows(id) ON DELETE CASCADE,
  task_id         UUID,  -- Optional, no FK constraint
  status          TEXT NOT NULL DEFAULT 'running',  -- running|completed|failed
  trigger_data    JSONB DEFAULT '{"eventType":"unknown"}',  -- WorkflowTriggerData
  actions_executed JSONB DEFAULT '[]',  -- ExecutedAction[]
  error_message   TEXT,
  started_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at    TIMESTAMPTZ
);

-- Indexes
CREATE INDEX workflow_runs_workflow_idx ON workflow_runs(workflow_id);
CREATE INDEX workflow_runs_task_idx ON workflow_runs(task_id);
CREATE INDEX workflow_runs_status_idx ON workflow_runs(status);
CREATE INDEX workflow_runs_started_at_idx ON workflow_runs(started_at);
CREATE INDEX workflow_runs_workflow_status_idx ON workflow_runs(workflow_id, status);
CREATE INDEX workflow_runs_workflow_started_idx ON workflow_runs(workflow_id, started_at);
```

---

## Entity Relationships

```
workflows ──────┬──── 1:N ────► workflow_versions
                │
                ├──── 1:N ────► workflow_executions ──── 1:N ────► workflow_step_executions
                │                       │                                  │
                │                       │ (self-ref)                       │
                │                       └── parent_execution_id            └── 1:N ──► workflow_approvals
                │
                ├──── 1:N ────► workflow_runs (v1)
                │
                └──── 1:N ────► workflow_approvals

workflow_templates (standalone, venture-scoped or public)

ventures ──── 1:N ──► workflows
users    ──── 1:N ──► created_by / assigned_to / approved_by / decided_by
```

---

## Code Examples

### 1. Simple Linear Workflow

```typescript
import { defineWorkflow, publishVersion } from '@mcv/shared';

// Create a simple 3-step lead follow-up workflow
const workflow = await defineWorkflow({
  ventureId: 'venture-123',
  name: 'New Lead Follow-Up',
  description: 'Automatically follow up with new leads',
  triggerType: 'manual',
  createdBy: 'user-admin',
});

// Define the graph: trigger → wait → send email → create task
await publishVersion({
  workflowId: workflow.id,
  version: 1,
  changelog: 'Initial version',
  createdBy: 'user-admin',
  nodes: [
    {
      id: 'trigger-1',
      type: 'trigger_contact_created',
      label: 'New Contact',
      position: { x: 100, y: 100 },
      config: {},
    },
    {
      id: 'wait-1',
      type: 'wait',
      label: 'Wait 1 Hour',
      position: { x: 100, y: 250 },
      config: { duration: '1h' },
    },
    {
      id: 'email-1',
      type: 'send_email',
      label: 'Send Welcome Email',
      position: { x: 100, y: 400 },
      config: {
        templateId: 'tmpl-welcome',
        to: '{{contact.email}}',
        subject: 'Welcome, {{contact.firstName}}!',
      },
    },
    {
      id: 'task-1',
      type: 'create_task',
      label: 'Follow-Up Task',
      position: { x: 100, y: 550 },
      config: {
        title: 'Call new lead: {{contact.name}}',
        priority: 'high',
        dueInDays: 1,
        assignToRole: 'sales-rep',
      },
    },
  ],
  edges: [
    { id: 'e1', source: 'trigger-1', target: 'wait-1' },
    { id: 'e2', source: 'wait-1', target: 'email-1' },
    { id: 'e3', source: 'email-1', target: 'task-1' },
  ],
});
```

### 2. Conditional Branching (If/Else)

```typescript
const nodes: WorkflowNode[] = [
  {
    id: 'trigger-1',
    type: 'trigger_deal_stage_changed',
    label: 'Deal Stage Changed',
    position: { x: 250, y: 50 },
    config: {},
  },
  {
    id: 'check-value',
    type: 'if_else',
    label: 'Deal > $10K?',
    position: { x: 250, y: 200 },
    config: {
      condition: {
        logic: 'AND',
        conditions: [
          { field: 'deal.value', operator: 'greater_than', value: 10000 },
        ],
      },
    },
  },
  {
    id: 'high-value',
    type: 'send_internal_notification',
    label: 'Notify VP Sales',
    position: { x: 100, y: 400 },
    config: {
      recipientRole: 'vp-sales',
      message: 'High-value deal {{deal.name}} moved to {{deal.stage}}',
    },
  },
  {
    id: 'standard',
    type: 'send_email',
    label: 'Send Stage Update',
    position: { x: 400, y: 400 },
    config: {
      templateId: 'tmpl-deal-update',
      to: '{{deal.owner.email}}',
    },
  },
];

const edges: WorkflowEdge[] = [
  { id: 'e1', source: 'trigger-1', target: 'check-value' },
  { id: 'e2', source: 'check-value', target: 'high-value', sourceHandle: 'true' },
  { id: 'e3', source: 'check-value', target: 'standard', sourceHandle: 'false' },
];
```

### 3. Parallel Execution

```typescript
const nodes: WorkflowNode[] = [
  {
    id: 'trigger-1',
    type: 'trigger_form_submitted',
    label: 'Application Submitted',
    position: { x: 300, y: 50 },
    config: { formId: 'application-form' },
  },
  {
    id: 'parallel-1',
    type: 'parallel',
    label: 'Run Checks',
    position: { x: 300, y: 200 },
    config: { waitForAll: true },  // Wait for all branches before continuing
  },
  // Branch A
  {
    id: 'credit-check',
    type: 'http_request',
    label: 'Credit Check',
    position: { x: 100, y: 400 },
    config: {
      url: 'https://api.creditbureau.com/check',
      method: 'POST',
      body: { ssn: '{{contact.ssn}}' },
    },
  },
  // Branch B
  {
    id: 'bg-check',
    type: 'http_request',
    label: 'Background Check',
    position: { x: 300, y: 400 },
    config: {
      url: 'https://api.bgcheck.com/verify',
      method: 'POST',
      body: { name: '{{contact.name}}', dob: '{{contact.dob}}' },
    },
  },
  // Branch C
  {
    id: 'send-ack',
    type: 'send_email',
    label: 'Acknowledgment Email',
    position: { x: 500, y: 400 },
    config: { templateId: 'tmpl-application-received' },
  },
  // Converge
  {
    id: 'evaluate',
    type: 'ai_classify',
    label: 'Evaluate Application',
    position: { x: 300, y: 600 },
    config: {
      prompt: 'Evaluate this application based on credit score: {{credit-check.output.score}} and background: {{bg-check.output.status}}',
      categories: ['approve', 'review', 'reject'],
    },
  },
];

const edges: WorkflowEdge[] = [
  { id: 'e1', source: 'trigger-1', target: 'parallel-1' },
  { id: 'e2', source: 'parallel-1', target: 'credit-check', sourceHandle: 'branch-0' },
  { id: 'e3', source: 'parallel-1', target: 'bg-check', sourceHandle: 'branch-1' },
  { id: 'e4', source: 'parallel-1', target: 'send-ack', sourceHandle: 'branch-2' },
  { id: 'e5', source: 'credit-check', target: 'evaluate' },
  { id: 'e6', source: 'bg-check', target: 'evaluate' },
  { id: 'e7', source: 'send-ack', target: 'evaluate' },
];
```

### 4. HITL Approval Flow

```typescript
import { requestApproval, approveStep, rejectStep, escalateApproval } from '@mcv/shared';

// Define workflow with approval gate
const nodes: WorkflowNode[] = [
  {
    id: 'trigger-1',
    type: 'trigger_invoice_created',
    label: 'Invoice Created',
    position: { x: 250, y: 50 },
    config: {},
  },
  {
    id: 'check-amount',
    type: 'if_else',
    label: 'Amount > $5000?',
    position: { x: 250, y: 200 },
    config: {
      condition: {
        logic: 'AND',
        conditions: [
          { field: 'invoice.amount', operator: 'greater_than', value: 5000 },
        ],
      },
    },
  },
  {
    id: 'approval-gate',
    type: 'approval',
    label: 'Manager Approval',
    position: { x: 100, y: 400 },
    config: {
      assignedTo: ['{{invoice.owner.managerId}}'],
      expiresIn: '48h',
      escalateTo: 'user-vp-finance',
      message: 'Please approve invoice #{{invoice.number}} for ${{invoice.amount}}',
    },
  },
  {
    id: 'auto-approve',
    type: 'set_variable',
    label: 'Auto Approve',
    position: { x: 400, y: 400 },
    config: { variable: 'approved', value: true },
  },
  {
    id: 'process-payment',
    type: 'charge_customer',
    label: 'Process Payment',
    position: { x: 250, y: 600 },
    config: { amount: '{{invoice.amount}}', customerId: '{{invoice.customerId}}' },
  },
];

const edges: WorkflowEdge[] = [
  { id: 'e1', source: 'trigger-1', target: 'check-amount' },
  { id: 'e2', source: 'check-amount', target: 'approval-gate', sourceHandle: 'true' },
  { id: 'e3', source: 'check-amount', target: 'auto-approve', sourceHandle: 'false' },
  { id: 'e4', source: 'approval-gate', target: 'process-payment', sourceHandle: 'approved' },
  { id: 'e5', source: 'auto-approve', target: 'process-payment' },
];

// --- Approval API usage ---

// Get pending approvals for a user
const queue = await getApprovalQueue({ userId: 'user-manager-1' });

// Approve
await approveStep({
  approvalId: queue[0].id,
  decidedBy: 'user-manager-1',
  reason: 'Looks good, approved.',
});

// Or reject
await rejectStep({
  approvalId: queue[0].id,
  decidedBy: 'user-manager-1',
  reason: 'Amount exceeds department budget.',
});

// Manual escalation
await escalateApproval({
  approvalId: queue[0].id,
  escalateTo: 'user-cfo',
  reason: 'Need CFO sign-off for this amount.',
});
```

### 5. AI-Powered Workflow Steps

```typescript
const nodes: WorkflowNode[] = [
  {
    id: 'trigger-1',
    type: 'trigger_email_received',
    label: 'Email Received',
    position: { x: 250, y: 50 },
    config: {},
  },
  {
    id: 'classify',
    type: 'ai_classify',
    label: 'Classify Intent',
    position: { x: 250, y: 200 },
    config: {
      input: '{{email.body}}',
      categories: ['support', 'sales', 'billing', 'spam'],
      model: 'auto',  // Uses gateway routing
    },
  },
  {
    id: 'extract',
    type: 'ai_extract',
    label: 'Extract Details',
    position: { x: 250, y: 350 },
    config: {
      input: '{{email.body}}',
      schema: {
        customerName: 'string',
        orderId: 'string?',
        urgency: 'low | medium | high',
        summary: 'string',
      },
    },
  },
  {
    id: 'summarize',
    type: 'ai_summarize',
    label: 'Summarize for Agent',
    position: { x: 250, y: 500 },
    config: {
      input: '{{email.body}}',
      maxLength: 100,
      style: 'bullet_points',
    },
  },
  {
    id: 'rag-lookup',
    type: 'rag_search',
    label: 'Find KB Articles',
    position: { x: 250, y: 650 },
    config: {
      query: '{{extract.output.summary}}',
      collectionId: 'knowledge-base',
      topK: 3,
    },
  },
  {
    id: 'draft-reply',
    type: 'ai_prompt',
    label: 'Draft Reply',
    position: { x: 250, y: 800 },
    config: {
      prompt: `You are a helpful support agent. Using these KB articles:
{{rag-lookup.output.results}}

Draft a reply to this customer inquiry:
{{email.body}}

Customer: {{extract.output.customerName}}
Urgency: {{extract.output.urgency}}`,
      model: 'auto',
      maxTokens: 500,
    },
  },
];
```

### 6. Sub-Workflow Invocation

```typescript
const nodes: WorkflowNode[] = [
  {
    id: 'trigger-1',
    type: 'trigger_deal_won',
    label: 'Deal Won',
    position: { x: 250, y: 50 },
    config: {},
  },
  {
    id: 'onboarding',
    type: 'sub_workflow',
    label: 'Run Client Onboarding',
    position: { x: 250, y: 200 },
    config: {
      workflowId: 'wf-client-onboarding',  // Reference to another workflow
      inputMapping: {
        contactId: '{{deal.contactId}}',
        dealValue: '{{deal.value}}',
        productType: '{{deal.product}}',
      },
      waitForCompletion: true,  // Block until sub-workflow finishes
    },
  },
  {
    id: 'celebrate',
    type: 'send_internal_notification',
    label: 'Notify Team',
    position: { x: 250, y: 400 },
    config: {
      recipientRole: 'sales-team',
      message: '🎉 Deal won! {{deal.name}} — ${{deal.value}}. Onboarding started.',
    },
  },
];

// Sub-workflow executions link via parent_execution_id
// enabling full execution tree tracing
```

### 7. Template-Based Workflow Creation

```typescript
import { listTemplates, createFromTemplate, publishTemplate } from '@mcv/shared';

// Browse available templates
const templates = await listTemplates({
  category: 'lead-nurture',
  isPublic: true,
  tags: ['email', 'sms'],
});

// Create workflow from template
const workflow = await createFromTemplate({
  templateId: templates[0].id,
  ventureId: 'venture-123',
  name: 'My Lead Nurture Sequence',
  overrides: {
    // Override specific node configs
    'email-1': { config: { templateId: 'my-custom-template' } },
    'wait-1': { config: { duration: '2h' } },
  },
});

// Publish your own workflow as a template
await publishTemplate({
  workflowId: 'wf-my-proven-sequence',
  name: 'Proven 5-Touch Lead Sequence',
  description: 'Our best-performing lead nurture flow',
  category: 'lead-nurture',
  icon: '🎯',
  isPublic: true,
  tags: ['email', 'sms', 'lead-nurture', 'proven'],
});
```

### 8. Workflow Versioning

```typescript
import { createVersion, listVersions, diffVersions, rollbackToVersion } from '@mcv/shared';

// Create new version with changes
await createVersion({
  workflowId: 'wf-123',
  version: 3,
  changelog: 'Added AI classification step before approval gate',
  createdBy: 'user-admin',
  nodes: updatedNodes,
  edges: updatedEdges,
});

// List version history
const versions = await listVersions({ workflowId: 'wf-123' });
// [{ version: 3, changelog: '...', createdAt: ... },
//  { version: 2, changelog: '...', createdAt: ... },
//  { version: 1, changelog: '...', createdAt: ... }]

// Compare two versions
const diff = await diffVersions({
  workflowId: 'wf-123',
  fromVersion: 2,
  toVersion: 3,
});
// { nodesAdded: [...], nodesRemoved: [...], nodesModified: [...],
//   edgesAdded: [...], edgesRemoved: [...] }

// Rollback to previous version
await rollbackToVersion({
  workflowId: 'wf-123',
  targetVersion: 2,
  createdBy: 'user-admin',
  changelog: 'Rollback: AI step causing timeout issues',
});
```

### 9. Execution Monitoring

```typescript
import { getExecutionStatus, getExecutionHistory } from '@mcv/shared';

// Get real-time execution status
const status = await getExecutionStatus({ executionId: 'exec-456' });
// {
//   id: 'exec-456',
//   workflowId: 'wf-123',
//   status: 'running',
//   startedAt: '2026-02-08T14:30:00Z',
//   variables: { contactId: 'c-789', score: 85 },
//   steps: [
//     { nodeId: 'trigger-1', status: 'completed', durationMs: 12 },
//     { nodeId: 'classify', status: 'completed', durationMs: 1340 },
//     { nodeId: 'approval-gate', status: 'waiting_approval', startedAt: '...' },
//   ],
// }

// Get execution history for a workflow
const history = await getExecutionHistory({
  workflowId: 'wf-123',
  status: 'failed',
  limit: 20,
  offset: 0,
});
```

### 10. Switch (Multi-Way Branching)

```typescript
const nodes: WorkflowNode[] = [
  {
    id: 'trigger-1',
    type: 'trigger_form_submitted',
    label: 'Support Form',
    position: { x: 300, y: 50 },
    config: { formId: 'support-form' },
  },
  {
    id: 'route',
    type: 'switch',
    label: 'Route by Category',
    position: { x: 300, y: 200 },
    config: {
      field: '{{form.category}}',
      cases: [
        { value: 'billing', handle: 'billing' },
        { value: 'technical', handle: 'technical' },
        { value: 'sales', handle: 'sales' },
      ],
      defaultHandle: 'general',
    },
  },
  {
    id: 'billing-team',
    type: 'assign_user',
    label: 'Assign to Billing',
    position: { x: 50, y: 400 },
    config: { assignToRole: 'billing-team' },
  },
  {
    id: 'tech-team',
    type: 'assign_user',
    label: 'Assign to Tech',
    position: { x: 200, y: 400 },
    config: { assignToRole: 'tech-support' },
  },
  {
    id: 'sales-team',
    type: 'assign_user',
    label: 'Assign to Sales',
    position: { x: 400, y: 400 },
    config: { assignToRole: 'sales-team' },
  },
  {
    id: 'general-team',
    type: 'assign_user',
    label: 'Assign to General',
    position: { x: 550, y: 400 },
    config: { assignToRole: 'general-support' },
  },
];
```

### 11. Try/Catch Error Handling

```typescript
const nodes: WorkflowNode[] = [
  {
    id: 'try-block',
    type: 'try_catch',
    label: 'Protected Block',
    position: { x: 250, y: 100 },
    config: { maxRetries: 3, retryDelayMs: 5000 },
  },
  {
    id: 'risky-call',
    type: 'http_request',
    label: 'Call External API',
    position: { x: 250, y: 250 },
    config: {
      url: 'https://api.partner.com/sync',
      method: 'POST',
      timeout: 30000,
    },
  },
  {
    id: 'error-handler',
    type: 'send_internal_notification',
    label: 'Alert DevOps',
    position: { x: 450, y: 250 },
    config: {
      recipientRole: 'devops',
      message: 'Partner API sync failed after retries: {{error.message}}',
    },
  },
];

const edges: WorkflowEdge[] = [
  { id: 'e1', source: 'try-block', target: 'risky-call', sourceHandle: 'try' },
  { id: 'e2', source: 'try-block', target: 'error-handler', sourceHandle: 'catch' },
];
```

### 12. A/B Split Test

```typescript
const nodes: WorkflowNode[] = [
  {
    id: 'trigger-1',
    type: 'trigger_contact_created',
    label: 'New Lead',
    position: { x: 250, y: 50 },
    config: {},
  },
  {
    id: 'split',
    type: 'split_test',
    label: '50/50 Split',
    position: { x: 250, y: 200 },
    config: {
      splits: [
        { handle: 'variant-a', weight: 50 },
        { handle: 'variant-b', weight: 50 },
      ],
    },
  },
  {
    id: 'email-a',
    type: 'send_email',
    label: 'Variant A: Formal',
    position: { x: 100, y: 400 },
    config: { templateId: 'tmpl-welcome-formal' },
  },
  {
    id: 'email-b',
    type: 'send_email',
    label: 'Variant B: Casual',
    position: { x: 400, y: 400 },
    config: { templateId: 'tmpl-welcome-casual' },
  },
];
```

### 13. Loop with Rate Limiting

```typescript
const nodes: WorkflowNode[] = [
  {
    id: 'trigger-1',
    type: 'trigger_cron',
    label: 'Daily at 9 AM',
    position: { x: 250, y: 50 },
    config: { cron: '0 9 * * *', timezone: 'America/New_York' },
  },
  {
    id: 'fetch-contacts',
    type: 'http_request',
    label: 'Get Stale Leads',
    position: { x: 250, y: 200 },
    config: {
      url: '{{env.API_BASE}}/contacts?lastActivity=30d&status=active',
      method: 'GET',
    },
  },
  {
    id: 'loop-1',
    type: 'loop',
    label: 'For Each Contact',
    position: { x: 250, y: 350 },
    config: { iterable: '{{fetch-contacts.output.data}}', itemVar: 'contact' },
  },
  {
    id: 'throttle',
    type: 'rate_limit',
    label: 'Max 100/hour',
    position: { x: 250, y: 500 },
    config: { maxPerHour: 100 },
  },
  {
    id: 'send-sms',
    type: 'send_sms',
    label: 'Re-engagement SMS',
    position: { x: 250, y: 650 },
    config: {
      to: '{{contact.phone}}',
      message: 'Hi {{contact.firstName}}, we miss you! Check out our latest offers.',
    },
  },
];
```

### 14. Business Hours Delay

```typescript
const nodes: WorkflowNode[] = [
  {
    id: 'trigger-1',
    type: 'trigger_contact_scored',
    label: 'Lead Score > 80',
    position: { x: 250, y: 50 },
    config: { threshold: 80, direction: 'above' },
  },
  {
    id: 'wait-biz-hours',
    type: 'delay_until',
    label: 'Wait for Business Hours',
    position: { x: 250, y: 200 },
    config: {
      businessHours: {
        timezone: 'America/New_York',
        workingDays: [1, 2, 3, 4, 5],
        workingHours: { start: '09:00', end: '17:00' },
        holidays: ['2026-12-25', '2026-01-01'],
      } satisfies BusinessHoursConfig,
    },
  },
  {
    id: 'call',
    type: 'make_call',
    label: 'Call Hot Lead',
    position: { x: 250, y: 400 },
    config: {
      to: '{{contact.phone}}',
      assignTo: '{{contact.ownerId}}',
      script: 'Hot lead follow-up: score {{contact.score}}',
    },
  },
];
```

### 15. Custom Code Execution

```typescript
const nodes: WorkflowNode[] = [
  {
    id: 'trigger-1',
    type: 'trigger_webhook_received',
    label: 'Stripe Webhook',
    position: { x: 250, y: 50 },
    config: { path: '/webhooks/stripe' },
  },
  {
    id: 'transform',
    type: 'custom_code',
    label: 'Transform Payload',
    position: { x: 250, y: 200 },
    config: {
      language: 'javascript',
      code: `
        const event = input.body;
        if (event.type === 'invoice.paid') {
          return {
            customerId: event.data.object.customer,
            amount: event.data.object.amount_paid / 100,
            currency: event.data.object.currency.toUpperCase(),
            invoiceId: event.data.object.id,
          };
        }
        return { skip: true };
      `,
      timeout: 5000,
      sandbox: true,  // Runs in isolated VM
    },
  },
  {
    id: 'check-skip',
    type: 'if_else',
    label: 'Should Process?',
    position: { x: 250, y: 400 },
    config: {
      condition: {
        logic: 'AND',
        conditions: [
          { field: 'transform.output.skip', operator: 'not_equals', value: true },
        ],
      },
    },
  },
  {
    id: 'update-contact',
    type: 'update_contact',
    label: 'Update Payment Info',
    position: { x: 250, y: 600 },
    config: {
      lookupField: 'stripeCustomerId',
      lookupValue: '{{transform.output.customerId}}',
      fields: {
        lastPaymentAmount: '{{transform.output.amount}}',
        lastPaymentDate: '{{now}}',
      },
    },
  },
];
```

### 16. V1 Workflow (Simple Task Automation)

```typescript
import { db } from '@mcv/db';
import { workflows, workflowRuns } from '@mcv/db/schema';

// Create a v1 workflow (trigger + flat action list)
const [wf] = await db.insert(workflows).values({
  ventureId: 'venture-123',
  name: 'Task Overdue Notification',
  triggerType: 'task_overdue',
  triggerConditions: {
    daysOverdue: 3,
    taskPriority: ['high', 'urgent'],
  },
  actions: [
    {
      id: 'action-1',
      type: 'send_notification',
      order: 1,
      config: {
        notificationType: 'email',
        recipientType: 'assignee',
        subject: 'Task Overdue: {{task.title}}',
        message: 'Your task "{{task.title}}" is {{daysOverdue}} days overdue.',
      },
    },
    {
      id: 'action-2',
      type: 'send_notification',
      order: 2,
      config: {
        notificationType: 'in_app',
        recipientType: 'role',
        recipientIds: ['manager'],
        message: 'Escalation: {{task.title}} is overdue (assigned to {{task.assignee}})',
      },
      condition: {
        field: 'daysOverdue',
        operator: 'gte',
        value: 7,
      },
    },
  ],
  isActive: true,
  createdBy: 'user-admin',
}).returning();

// Record a v1 run
await db.insert(workflowRuns).values({
  workflowId: wf.id,
  taskId: 'task-456',
  status: 'completed',
  triggerData: {
    eventType: 'task_overdue',
    taskId: 'task-456',
    taskTitle: 'Client proposal review',
    taskPriority: 'high',
  },
  actionsExecuted: [
    {
      actionId: 'action-1',
      actionType: 'send_notification',
      status: 'success',
      executedAt: new Date().toISOString(),
      durationMs: 245,
      result: { notificationId: 'notif-789' },
    },
  ],
  completedAt: new Date(),
});
```

---

## Performance Considerations

### DAG Scheduling

The workflow engine uses **topological sort** for DAG execution, ensuring:

1. **No node executes before its dependencies** — edges define the dependency graph
2. **Parallel branches run concurrently** — nodes without shared dependencies execute in parallel via `Promise.all`
3. **Early termination** — if a branch fails and no `try_catch` handles it, the execution is marked failed immediately
4. **Memory-efficient** — only active step states are held in memory; completed steps persist to `workflow_step_executions`

### Step Retry Policy

| Setting | Default | Description |
|---------|---------|-------------|
| `maxRetries` | 3 | Maximum retry attempts per step |
| `retryDelayMs` | 5000 | Delay between retries (exponential backoff: `delay * 2^attempt`) |
| `retryableErrors` | `['TIMEOUT', 'RATE_LIMIT', 'TRANSIENT']` | Error codes that trigger retry |
| `maxRetryDelayMs` | 300000 | Cap on exponential backoff (5 minutes) |

### Execution Indexes

Critical query patterns and their supporting indexes:

| Query Pattern | Index |
|--------------|-------|
| Active workflows for trigger evaluation | `workflows_venture_active_idx` |
| Workflow executions by status | `wf_exec_workflow_status_idx` |
| Pending approvals nearing expiry | `wf_approvals_expires_idx` |
| Step executions for a running workflow | `wf_step_exec_execution_idx` |
| Sub-workflow parent chain | `wf_exec_parent_idx` |

### Recommended Limits

| Metric | Recommended Limit | Notes |
|--------|-------------------|-------|
| Nodes per workflow | 200 | Beyond this, consider sub-workflows |
| Concurrent executions per workflow | 100 | Configurable per venture |
| Step execution timeout | 30s (default) | AI steps may use 120s |
| Approval expiry | 48h (default) | Auto-escalation on expiry |
| Nested sub-workflow depth | 5 levels | Prevents infinite recursion |
| Variables per execution | 1MB JSON | Runtime variable accumulation |

---

## Security

### Row-Level Security (RLS)

All workflow tables are scoped by `venture_id`:

```sql
-- Workflows: only accessible within venture
CREATE POLICY workflows_venture_isolation ON workflows
  USING (venture_id = current_setting('app.venture_id')::uuid);

-- Executions: same venture scope
CREATE POLICY wf_exec_venture_isolation ON workflow_executions
  USING (venture_id = current_setting('app.venture_id')::uuid);

-- Templates: venture-scoped OR public
CREATE POLICY wf_templates_access ON workflow_templates
  USING (
    venture_id = current_setting('app.venture_id')::uuid
    OR is_public = true
  );
```

### Approval Permissions

| Action | Required Permission | Notes |
|--------|-------------------|-------|
| Create workflow | `workflows:create` | Venture admin or workflow manager |
| Edit workflow | `workflows:edit` | Owner or venture admin |
| Activate/deactivate | `workflows:manage` | Venture admin |
| Approve step | `workflows:approve` | Must be in `assigned_to` array |
| Escalate approval | `workflows:escalate` | Current approver or admin |
| View execution logs | `workflows:read` | Any venture member |
| Run in test mode | `workflows:test` | Workflow owner or admin |
| Publish template | `templates:publish` | Venture admin |

### Custom Code Sandboxing

The `custom_code` node type runs in an **isolated V8 sandbox**:
- No filesystem access
- No network access (use `http_request` node instead)
- 5-second default timeout (configurable)
- Memory limit: 128MB
- Only `input`, `output`, `console.log` available in scope

---

## Audit Events

All workflow operations emit audit events via `@mcv/fabric/events`:

| Event | Payload | When |
|-------|---------|------|
| `workflow.created` | `{ workflowId, name, ventureId }` | New workflow created |
| `workflow.updated` | `{ workflowId, changes }` | Workflow definition changed |
| `workflow.activated` | `{ workflowId }` | Workflow enabled |
| `workflow.deactivated` | `{ workflowId }` | Workflow disabled |
| `workflow.deleted` | `{ workflowId }` | Workflow deleted |
| `workflow.version.published` | `{ workflowId, version }` | New version published |
| `workflow.version.rolledback` | `{ workflowId, fromVersion, toVersion }` | Version rollback |
| `execution.started` | `{ executionId, workflowId, triggerId }` | Execution began |
| `execution.completed` | `{ executionId, durationMs }` | Execution finished |
| `execution.failed` | `{ executionId, error }` | Execution failed |
| `execution.paused` | `{ executionId, stepId }` | Execution paused (HITL) |
| `execution.resumed` | `{ executionId }` | Execution resumed |
| `execution.cancelled` | `{ executionId, cancelledBy }` | Execution cancelled |
| `step.completed` | `{ executionId, nodeId, durationMs }` | Step finished |
| `step.failed` | `{ executionId, nodeId, error }` | Step failed |
| `step.retried` | `{ executionId, nodeId, attempt }` | Step retry attempted |
| `approval.requested` | `{ approvalId, assignedTo }` | Approval requested |
| `approval.approved` | `{ approvalId, decidedBy }` | Step approved |
| `approval.rejected` | `{ approvalId, decidedBy, reason }` | Step rejected |
| `approval.escalated` | `{ approvalId, escalateTo }` | Approval escalated |
| `approval.expired` | `{ approvalId }` | Approval timed out |
| `template.published` | `{ templateId, name }` | Template published |
| `template.imported` | `{ templateId, workflowId }` | Template used |

---

## Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `WORKFLOW_MAX_CONCURRENT_EXECUTIONS` | No | `100` | Max concurrent executions per venture |
| `WORKFLOW_STEP_TIMEOUT_MS` | No | `30000` | Default step execution timeout |
| `WORKFLOW_AI_STEP_TIMEOUT_MS` | No | `120000` | Timeout for AI node types |
| `WORKFLOW_MAX_RETRY_ATTEMPTS` | No | `3` | Default max retries per step |
| `WORKFLOW_APPROVAL_DEFAULT_EXPIRY_HOURS` | No | `48` | Default approval expiry |
| `WORKFLOW_MAX_NESTED_DEPTH` | No | `5` | Max sub-workflow nesting depth |
| `WORKFLOW_CUSTOM_CODE_TIMEOUT_MS` | No | `5000` | Custom code sandbox timeout |
| `WORKFLOW_CUSTOM_CODE_MEMORY_MB` | No | `128` | Custom code memory limit |
| `WORKFLOW_RATE_LIMIT_DEFAULT` | No | `1000/hour` | Default rate limit for rate_limit nodes |
| `WORKFLOW_ENABLE_TEST_MODE` | No | `true` | Allow test execution mode |

---

## Dependencies

| Dependency | Tier | Purpose |
|------------|------|---------|
| `@mcv/kernel` | 0 | UUID generation, error types, logging |
| `@mcv/api` | 1 | tRPC router definitions for workflow CRUD |
| `@mcv/fabric/db` | 2 | Drizzle ORM, database connection |
| `@mcv/fabric/events` | 2 | Audit event emission |
| `@mcv/fabric/jobs` | 2 | Background job scheduling for delayed steps |
| `@mcv/identity/permissions` | 3 | Permission checks for approval actions |
| `@mcv/connectors/email` | 3 | `send_email` node execution |
| `@mcv/connectors/sms` | 3 | `send_sms` node execution |
| `@mcv/connectors/voice` | 3 | `make_call`, `voicemail_drop` execution |
| `@mcv/intelligence/gateway` | 4 | `ai_prompt`, `ai_classify`, `ai_extract`, `ai_summarize` execution |
| `@mcv/intelligence/rag` | 4 | `rag_search` node execution |
| `@mcv/shared/templates` | 2.5 | Email/notification template rendering |
| `@mcv/shared/scheduling` | 2.5 | Business hours evaluation, cron parsing |

---

## Integration Points

| Consumer | Usage |
|----------|-------|
| `@mcv/ventures` | Venture-scoped workflow management |
| `@mcv/commerce` | Order fulfillment, payment, subscription workflows |
| `@mcv/community` | Member onboarding, engagement sequences |
| `@mcv/jobs` | Application processing, interview scheduling |
| `@mcv/finance` | Invoice approval, expense workflows |
| `@mcv/crm` | Lead nurture, deal stage automation |
| Admin Dashboard | Visual workflow builder (WorkflowCanvas component) |

---

## Migration Notes

### V1 → V2 Compatibility

The module maintains both V1 (`workflows` + `workflow_runs`) and V2 (`workflow_versions` + `workflow_executions` + `workflow_step_executions`) schemas:

- **V1** uses flat `actions` array on the workflow with `trigger_conditions` — suitable for simple trigger → action sequences
- **V2** uses graph-based `nodes`/`edges` stored in `workflow_versions` — suitable for complex DAG workflows with branching, parallelism, and HITL

Both schemas share the `workflows` base table. V2 extends it with the versioned graph and detailed execution tracking. Existing V1 workflows continue to function; new workflows should use the V2 graph format.

---

*@mcv/shared/workflows — Workflow Automation Engine*
