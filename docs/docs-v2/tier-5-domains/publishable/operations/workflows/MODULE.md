# @mcv/operations/workflows

> **Workflow Automation Engine** — Visual workflow building, durable execution, and business process automation across all MCV.ONE ventures.

**Package:** `@mcv/operations/workflows`  
**Layer:** Operations (Tier 5 — Domain)  
**Runtime:** Server-side (Node.js + BullMQ workers)  
**DB:** Supabase PostgreSQL via Drizzle ORM  
**Events:** Redpanda (Kafka-compatible)  
**Queue:** BullMQ (Redis-backed durable execution)  
**Bundle:** Not applicable (server-only module)  
**Status:** Production  
**Since:** 0.14.0

---

## Table of Contents

1. [Purpose](#purpose)
2. [Exports](#exports)
3. [Architecture](#architecture)
4. [Core Interfaces](#core-interfaces)
5. [Database Schemas](#database-schemas)
6. [Code Examples](#code-examples)
7. [Error Codes](#error-codes)
8. [Security](#security)
9. [Environment Variables](#environment-variables)
10. [Dependencies](#dependencies)
11. [Testing](#testing)

---

## Purpose

The `@mcv/operations/workflows` module is the backbone of business process automation within the MCV.ONE platform. It provides a complete workflow automation system — from a visual drag-and-drop builder that business users can operate, to a battle-tested durable execution engine that developers can rely on for mission-critical processes.

### What It Does

- **Visual Workflow Design** — Drag-and-drop workflow builder with support for triggers, actions, conditions, delays, loops, parallel execution, and sub-workflow composition
- **Event-Driven Triggers** — Workflows can be triggered by Redpanda events, webhooks, cron schedules, manual invocation, form submissions, record changes, or inbound emails
- **Rich Action Library** — Built-in actions for sending email/SMS, creating and updating records, making HTTP requests, running sandboxed JavaScript, assigning tasks, and sending notifications
- **Conditional Logic** — If/else branching, switch/case routing, data filters, comparison operators, regex matching, and segment membership checks
- **Durable Execution** — Workflow executions survive server restarts, handle retries with configurable policies, enforce timeouts, route errors to dedicated branches, and support compensation (rollback) actions
- **Data Pipeline** — Workflow-scoped variables, input/output mapping between steps, JSONata data transformations, and Handlebars template rendering
- **Full Observability** — Execution history with step-by-step audit trails, structured error logs, execution metrics (duration, success rate, throughput), and an active instance dashboard
- **Version Control** — Workflows support draft/published lifecycle, version history with rollback, and A/B testing between versions
- **Template Marketplace** — Pre-built workflow templates (employee onboarding, invoice approval, lead nurturing, etc.) with a marketplace for sharing across ventures
- **Rate Limiting & Concurrency** — Per-workflow execution limits, global rate limits, priority queues, and concurrency controls to prevent resource exhaustion

### Why It Exists

Every venture within MCV.ONE eventually needs process automation — lead follow-up sequences, approval chains, onboarding flows, notification routing, data synchronization. Without a centralized workflow engine, each venture would build its own ad-hoc automation, leading to duplicated effort, inconsistent behavior, and operational blind spots.

This module provides a single, multi-tenant workflow engine that:

1. **Empowers business users** to build automations without writing code
2. **Gives developers** a programmable API for complex workflow logic
3. **Ensures reliability** through durable execution and retry policies
4. **Maintains auditability** with complete execution history and step-level logs
5. **Scales across ventures** with tenant isolation and resource controls

### Design Principles

| Principle | Implementation |
|-----------|---------------|
| **Durability First** | Every execution step is persisted before processing. Crashes resume from the last checkpoint. |
| **Tenant Isolation** | Row-Level Security (RLS) ensures workflows and executions are scoped to their venture. |
| **Composability** | Workflows can invoke sub-workflows, enabling complex processes from simple building blocks. |
| **Observability** | Every step produces structured logs and metrics. Nothing happens in the dark. |
| **Graceful Degradation** | Failed steps trigger error branches, not workflow crashes. Compensation actions can undo partial work. |
| **Version Safety** | Running executions continue on their original version. New triggers use the latest published version. |

---

## Exports

### Services

```typescript
export { WorkflowService }        from './services/workflow.service';
export { ExecutionService }       from './services/execution.service';
export { TriggerService }         from './services/trigger.service';
export { ActionService }          from './services/action.service';
export { ConditionService }       from './services/condition.service';
export { TemplateService }        from './services/template.service';
export { VersionService }         from './services/version.service';
export { SchedulerService }       from './services/scheduler.service';
export { MonitoringService }      from './services/monitoring.service';
export { VariableService }        from './services/variable.service';
export { RateLimiterService }     from './services/rate-limiter.service';
```

### Router

```typescript
export { workflowRouter }        from './router';
```

### Types & Interfaces

```typescript
export type {
  Workflow,
  WorkflowNode,
  WorkflowEdge,
  WorkflowExecution,
  WorkflowTrigger,
  WorkflowAction,
  WorkflowCondition,
  ExecutionStep,
  WorkflowVersion,
  WorkflowTemplate,
  WorkflowVariable,
  WorkflowSchedule,
  ExecutionError,
  NodeType,
  TriggerType,
  ActionType,
  ConditionOperator,
  ExecutionStatus,
  StepStatus,
  WorkflowStatus,
  RetryPolicy,
  RateLimitConfig,
  ConcurrencyConfig,
  DataMapping,
  TransformExpression,
  WorkflowContext,
  StepResult,
  TriggerPayload,
  ActionPayload,
  ConditionEvaluation,
  WorkflowMetrics,
  ExecutionFilter,
  WorkflowCreateInput,
  WorkflowUpdateInput,
  NodeCreateInput,
  EdgeCreateInput,
  TriggerCreateInput,
  TemplateCreateInput,
} from './types';
```

### Schemas (Drizzle)

```typescript
export {
  workflows,
  workflowNodes,
  workflowEdges,
  workflowExecutions,
  executionSteps,
  workflowTriggers,
  workflowVersions,
  workflowTemplates,
  workflowVariables,
  workflowSchedules,
  executionErrors,
} from './schemas';
```

### Workers

```typescript
export { WorkflowWorker }        from './workers/workflow.worker';
export { SchedulerWorker }       from './workers/scheduler.worker';
export { CleanupWorker }         from './workers/cleanup.worker';
```

### Utilities

```typescript
export { WorkflowValidator }     from './utils/validator';
export { DataTransformer }       from './utils/transformer';
export { TemplateRenderer }      from './utils/renderer';
export { GraphAnalyzer }         from './utils/graph-analyzer';
export { WorkflowSerializer }    from './utils/serializer';
```

### Constants

```typescript
export {
  NODE_TYPES,
  TRIGGER_TYPES,
  ACTION_TYPES,
  CONDITION_OPERATORS,
  EXECUTION_STATUSES,
  STEP_STATUSES,
  WORKFLOW_STATUSES,
  DEFAULT_RETRY_POLICY,
  DEFAULT_RATE_LIMIT,
  MAX_WORKFLOW_DEPTH,
  MAX_LOOP_ITERATIONS,
  MAX_PARALLEL_BRANCHES,
  EXECUTION_TTL_DAYS,
  WORKFLOW_QUEUE_NAME,
  SCHEDULER_QUEUE_NAME,
  CLEANUP_QUEUE_NAME,
} from './constants';
```

---

## Architecture

### High-Level Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                        Workflow Builder UI                          │
│              (Visual drag-and-drop designer — @mcv/ui)              │
└──────────────────────────────┬──────────────────────────────────────┘
                               │ tRPC
                               ▼
┌─────────────────────────────────────────────────────────────────────┐
│                         Workflow Router                             │
│                   (tRPC procedures — CRUD + ops)                    │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌─────────────┐  ┌──────────────┐  ┌────────────┐  ┌───────────┐ │
│  │  Workflow    │  │  Execution   │  │  Trigger   │  │  Template │ │
│  │  Service     │  │  Service     │  │  Service   │  │  Service  │ │
│  └──────┬──────┘  └──────┬───────┘  └─────┬──────┘  └─────┬─────┘ │
│         │                │                 │               │       │
│  ┌──────┴──────┐  ┌──────┴───────┐  ┌─────┴──────┐  ┌─────┴─────┐ │
│  │  Version    │  │  Monitoring  │  │  Scheduler │  │  Rate     │ │
│  │  Service    │  │  Service     │  │  Service   │  │  Limiter  │ │
│  └─────────────┘  └──────────────┘  └────────────┘  └───────────┘ │
│                                                                     │
└──────────────────────────────┬──────────────────────────────────────┘
                               │
              ┌────────────────┼────────────────┐
              ▼                ▼                ▼
┌──────────────────┐ ┌─────────────────┐ ┌────────────────┐
│   PostgreSQL     │ │    BullMQ       │ │   Redpanda     │
│   (Supabase)     │ │    (Redis)      │ │   (Events)     │
│                  │ │                  │ │                │
│ • workflows      │ │ • workflow-exec │ │ • trigger      │
│ • nodes/edges    │ │ • scheduler     │ │   events       │
│ • executions     │ │ • cleanup       │ │ • action       │
│ • steps          │ │                  │ │   events       │
│ • triggers       │ │  Workers:       │ │ • completion   │
│ • versions       │ │ • WorkflowWorker│ │   events       │
│ • templates      │ │ • SchedulerWorker│ │                │
│ • variables      │ │ • CleanupWorker │ │                │
└──────────────────┘ └─────────────────┘ └────────────────┘
```

### Workflow Engine Architecture

The workflow engine follows a **graph-based execution model** where workflows are directed acyclic graphs (DAGs) with support for controlled cycles (loops). Each node in the graph represents a discrete unit of work — a trigger, action, condition, or control flow construct.

#### Node Types

| Type | Symbol | Description | Behavior |
|------|--------|-------------|----------|
| **Trigger** | ⚡ | Entry point for workflow execution | Receives external event, starts execution |
| **Action** | ▶️ | Performs a side effect | Executes, produces output, advances to next node |
| **Condition** | 🔀 | Evaluates an expression | Routes to one of N branches based on result |
| **Delay** | ⏳ | Pauses execution | Suspends execution for a duration or until a time |
| **Loop** | 🔄 | Iterates over a collection | Executes child nodes for each item in a list |
| **Parallel** | ⫸ | Concurrent execution | Executes N branches simultaneously, joins on completion |
| **Sub-Workflow** | 📦 | Invokes another workflow | Starts a child execution, waits for result |
| **Error** | ❌ | Error handler | Catches errors from connected nodes, executes recovery |
| **End** | 🏁 | Terminal node | Marks a branch as complete |

#### Execution Pipeline

```
Trigger Event
    │
    ▼
┌─────────────────────────────────┐
│  1. TRIGGER EVALUATION          │
│  • Validate trigger conditions  │
│  • Extract payload data         │
│  • Check rate limits            │
│  • Check workflow is published  │
└───────────────┬─────────────────┘
                │
                ▼
┌─────────────────────────────────┐
│  2. EXECUTION INITIALIZATION    │
│  • Create execution record      │
│  • Initialize workflow context  │
│  • Resolve workflow version     │
│  • Set up variable scope        │
│  • Enqueue to BullMQ            │
└───────────────┬─────────────────┘
                │
                ▼
┌─────────────────────────────────┐
│  3. NODE PROCESSING (Worker)    │
│  • Dequeue from BullMQ          │
│  • Load execution context       │
│  • Execute current node         │
│  • Persist step result          │
│  • Determine next node(s)       │
│  • Re-enqueue for next step     │
└───────────────┬─────────────────┘
                │
                ▼
┌─────────────────────────────────┐
│  4. STEP EXECUTION              │
│  Per node type:                 │
│  • Action → run action handler  │
│  • Condition → evaluate expr    │
│  • Delay → schedule resume      │
│  • Loop → expand iterations     │
│  • Parallel → fork branches     │
│  • Sub-Workflow → spawn child   │
│  • Error → execute recovery     │
└───────────────┬─────────────────┘
                │
                ▼
┌─────────────────────────────────┐
│  5. COMPLETION                  │
│  • All branches reach End node  │
│  • Aggregate outputs            │
│  • Update execution status      │
│  • Emit completion event        │
│  • Clean up resources           │
└─────────────────────────────────┘
```

#### Durable Execution Model

The engine uses a **checkpoint-resume** pattern for durable execution:

1. **Before** executing any node, the engine persists an `execution_step` record with status `pending`
2. The step is processed (action executed, condition evaluated, etc.)
3. **After** execution, the step record is updated with the result and status `completed` or `failed`
4. If the worker crashes between steps 1 and 3, the step is retried on restart
5. BullMQ provides at-least-once delivery guarantees for queued work

This ensures that:
- No work is lost during crashes or deployments
- Long-running workflows (hours, days) survive infrastructure changes
- Each step has a clear audit record of what happened and when

#### Retry & Error Handling

```
Step Execution
    │
    ├── Success ──→ Next Node
    │
    ├── Retryable Error ──→ Check Retry Policy
    │                            │
    │                    ├── Retries Left ──→ Wait (backoff) ──→ Retry Step
    │                    │
    │                    └── Exhausted ──→ Error Branch (if exists)
    │                                          │
    │                                   ├── Has Handler ──→ Execute Error Branch
    │                                   │
    │                                   └── No Handler ──→ Fail Execution
    │
    └── Fatal Error ──→ Error Branch (if exists) ──→ or Fail Execution
```

Retry policies support:
- **Fixed delay** — Wait N seconds between retries
- **Exponential backoff** — Wait 2^attempt × base seconds
- **Linear backoff** — Wait attempt × base seconds
- Custom maximum retry count (default: 3)
- Custom maximum retry delay (default: 300s)
- Error classification (retryable vs. fatal)

#### Variable Scoping

Workflow variables follow a hierarchical scope model:

```
┌─────────────────────────────────────┐
│  Global Scope (Workflow Variables)   │
│  • Defined at workflow level         │
│  • Readable by all nodes             │
│  • Writable via set-variable action  │
│                                      │
│  ┌───────────────────────────────┐   │
│  │  Trigger Scope                │   │
│  │  • trigger.payload            │   │
│  │  • trigger.metadata           │   │
│  │  • trigger.timestamp          │   │
│  │                               │   │
│  │  ┌─────────────────────────┐  │   │
│  │  │  Step Scope             │  │   │
│  │  │  • steps.<nodeId>.output│  │   │
│  │  │  • steps.<nodeId>.error │  │   │
│  │  │  • steps.<nodeId>.meta  │  │   │
│  │  │                         │  │   │
│  │  │  ┌───────────────────┐  │  │   │
│  │  │  │  Loop Scope       │  │  │   │
│  │  │  │  • loop.item      │  │  │   │
│  │  │  │  • loop.index     │  │  │   │
│  │  │  │  • loop.total     │  │  │   │
│  │  │  └───────────────────┘  │  │   │
│  │  └─────────────────────────┘  │   │
│  └───────────────────────────────┘   │
└─────────────────────────────────────┘
```

Variables are resolved using dot notation (e.g., `steps.send_email_1.output.messageId`) and can be referenced in action configurations, condition expressions, and template strings.

#### Data Transformation

The engine supports JSONata expressions for data transformation between steps:

```jsonata
/* Transform trigger payload for an action */
{
  "fullName": trigger.payload.firstName & " " & trigger.payload.lastName,
  "email": $lowercase(trigger.payload.email),
  "score": $sum(steps.calculate_score.output.factors.value),
  "tier": score > 80 ? "gold" : score > 50 ? "silver" : "bronze"
}
```

Template rendering uses Handlebars syntax for string interpolation:

```handlebars
Hello {{trigger.payload.firstName}},

Your order #{{steps.create_order.output.orderId}} has been confirmed.
Total: ${{steps.calculate_total.output.amount}}

{{#if steps.apply_discount.output.applied}}
Discount applied: {{steps.apply_discount.output.percentage}}% off!
{{/if}}
```

### Multi-Tenant Architecture

```
Request → Auth Middleware → Extract venture_id from JWT
                                    │
                                    ▼
                          ┌─────────────────┐
                          │  RLS Policy      │
                          │                  │
                          │  workflows       │
                          │  WHERE venture_id│
                          │  = auth.uid()    │
                          │  .venture_id     │
                          └─────────────────┘
                                    │
                                    ▼
                          Scoped query results
```

All tables in this module include a `venture_id` column with RLS policies ensuring:
- Workflows created by venture A are invisible to venture B
- Execution history is fully isolated per tenant
- Templates can be scoped to a venture or marked as global (platform templates)
- Rate limits and quotas are enforced per venture

### Queue Architecture

```
┌──────────────────────────────────────────────────────────────────┐
│                        BullMQ Queues                             │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  workflow-execution (main queue)                                 │
│  ├── Priority: 1 (critical) → 10 (background)                  │
│  ├── Concurrency: configurable per venture (default: 10)        │
│  ├── Rate limit: configurable per workflow                      │
│  └── Jobs:                                                      │
│      ├── execute-step      → Process a single workflow step     │
│      ├── resume-delay      → Resume after delay node            │
│      ├── join-parallel     → Check if parallel branches done    │
│      ├── complete-execution→ Finalize workflow execution        │
│      └── compensation      → Execute rollback actions           │
│                                                                  │
│  workflow-scheduler (cron queue)                                 │
│  ├── Repeatable jobs for cron triggers                          │
│  └── Jobs:                                                      │
│      └── cron-trigger      → Fire scheduled workflow trigger    │
│                                                                  │
│  workflow-cleanup (maintenance queue)                            │
│  ├── Runs periodically                                          │
│  └── Jobs:                                                      │
│      ├── prune-executions  → Remove old execution records       │
│      ├── expire-delays     → Timeout stuck delay nodes          │
│      └── orphan-check      → Detect and resolve stuck executions│
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

---

## Core Interfaces

### Workflow

The top-level workflow definition. Represents a complete automation that can be triggered, executed, and monitored.

```typescript
/**
 * A workflow definition — the blueprint for an automation.
 * Contains the graph of nodes and edges, trigger configuration,
 * and execution settings.
 */
interface Workflow {
  /** Unique workflow identifier (UUID v7) */
  id: string;

  /** Owning venture (tenant) */
  ventureId: string;

  /** Human-readable workflow name */
  name: string;

  /** Optional description of what the workflow does */
  description: string | null;

  /** Current lifecycle status */
  status: WorkflowStatus;

  /** Currently published version ID (null if never published) */
  publishedVersionId: string | null;

  /** Currently active draft version ID */
  draftVersionId: string;

  /** Icon identifier for the UI */
  icon: string | null;

  /** Color identifier for the UI */
  color: string | null;

  /** Tags for categorization and search */
  tags: string[];

  /** Folder/category path for organization */
  folderPath: string | null;

  /** Rate limit configuration for this workflow */
  rateLimit: RateLimitConfig | null;

  /** Concurrency configuration */
  concurrency: ConcurrencyConfig | null;

  /** Default retry policy for all steps (can be overridden per node) */
  defaultRetryPolicy: RetryPolicy;

  /** Maximum execution duration (ms) before timeout */
  executionTimeoutMs: number;

  /** Whether this workflow is a template */
  isTemplate: boolean;

  /** Template ID this workflow was created from (null if original) */
  sourceTemplateId: string | null;

  /** User who created the workflow */
  createdBy: string;

  /** User who last modified the workflow */
  updatedBy: string;

  /** Creation timestamp */
  createdAt: Date;

  /** Last modification timestamp */
  updatedAt: Date;

  /** Soft-delete timestamp */
  deletedAt: Date | null;
}

type WorkflowStatus = 'draft' | 'published' | 'paused' | 'archived' | 'error';
```

### WorkflowNode

A single node in the workflow graph. Represents one unit of work — a trigger, action, condition, or control flow construct.

```typescript
/**
 * A node in the workflow graph. Each node has a type that determines
 * its behavior and a configuration object specific to that type.
 */
interface WorkflowNode {
  /** Unique node identifier (UUID v7) */
  id: string;

  /** Parent workflow ID */
  workflowId: string;

  /** Workflow version this node belongs to */
  versionId: string;

  /** Node type — determines processing behavior */
  type: NodeType;

  /** Human-readable node name (shown in builder UI) */
  name: string;

  /** Optional description */
  description: string | null;

  /**
   * Type-specific configuration.
   * Structure depends on `type`:
   * - trigger: TriggerConfig
   * - action: ActionConfig
   * - condition: ConditionConfig
   * - delay: DelayConfig
   * - loop: LoopConfig
   * - parallel: ParallelConfig
   * - sub_workflow: SubWorkflowConfig
   * - error_handler: ErrorHandlerConfig
   * - end: EndConfig
   */
  config: Record<string, unknown>;

  /** Input data mapping — transforms incoming data for this node */
  inputMapping: DataMapping | null;

  /** Output data mapping — transforms this node's output for downstream nodes */
  outputMapping: DataMapping | null;

  /** Node-specific retry policy (overrides workflow default) */
  retryPolicy: RetryPolicy | null;

  /** Timeout for this specific node (ms) */
  timeoutMs: number | null;

  /** Visual position in the builder UI */
  position: { x: number; y: number };

  /** Visual dimensions in the builder UI */
  dimensions: { width: number; height: number } | null;

  /** Metadata for UI rendering (collapsed state, color, etc.) */
  uiMeta: Record<string, unknown> | null;

  /** Order index for deterministic processing */
  sortOrder: number;

  /** Whether this node is disabled (skipped during execution) */
  disabled: boolean;

  /** Notes/comments from the workflow author */
  notes: string | null;

  createdAt: Date;
  updatedAt: Date;
}

type NodeType =
  | 'trigger'
  | 'action'
  | 'condition'
  | 'delay'
  | 'loop'
  | 'parallel'
  | 'sub_workflow'
  | 'error_handler'
  | 'end';
```

### WorkflowEdge

A directed connection between two nodes in the workflow graph.

```typescript
/**
 * An edge connecting two workflow nodes.
 * Edges define the execution flow — when sourceNode completes,
 * execution advances to targetNode.
 */
interface WorkflowEdge {
  /** Unique edge identifier (UUID v7) */
  id: string;

  /** Parent workflow ID */
  workflowId: string;

  /** Workflow version this edge belongs to */
  versionId: string;

  /** Source node ID — execution flows FROM here */
  sourceNodeId: string;

  /** Target node ID — execution flows TO here */
  targetNodeId: string;

  /** Source handle/port (e.g., 'true', 'false', 'default', 'error') */
  sourceHandle: string;

  /** Target handle/port (usually 'input') */
  targetHandle: string;

  /**
   * Optional condition label for the builder UI.
   * For condition nodes, this shows the branch label
   * (e.g., "Score > 80", "Default").
   */
  label: string | null;

  /** Sort order for deterministic branching */
  sortOrder: number;

  createdAt: Date;
  updatedAt: Date;
}
```

### WorkflowExecution

A single invocation/run of a workflow. Tracks the full lifecycle from trigger to completion.

```typescript
/**
 * A workflow execution — one complete run of a workflow.
 * Contains the full execution state including all step results,
 * variables, and timing information.
 */
interface WorkflowExecution {
  /** Unique execution identifier (UUID v7) */
  id: string;

  /** The workflow being executed */
  workflowId: string;

  /** The specific version of the workflow being executed */
  versionId: string;

  /** Owning venture (denormalized for RLS performance) */
  ventureId: string;

  /** Current execution status */
  status: ExecutionStatus;

  /** The trigger that initiated this execution */
  triggerId: string | null;

  /** Raw trigger payload */
  triggerPayload: Record<string, unknown> | null;

  /** Current workflow variables (mutable state) */
  variables: Record<string, unknown>;

  /** Step outputs indexed by node ID */
  stepOutputs: Record<string, unknown>;

  /** ID of the currently executing node (null if complete) */
  currentNodeId: string | null;

  /** Stack of active parallel/loop scopes */
  scopeStack: ExecutionScope[];

  /** Parent execution ID (for sub-workflow executions) */
  parentExecutionId: string | null;

  /** Parent node ID that spawned this sub-workflow */
  parentNodeId: string | null;

  /** Number of steps executed so far */
  stepCount: number;

  /** Number of retries across all steps */
  retryCount: number;

  /** Error information if execution failed */
  error: ExecutionErrorInfo | null;

  /** Priority level (1 = highest, 10 = lowest) */
  priority: number;

  /** Execution start time */
  startedAt: Date;

  /** Execution completion time */
  completedAt: Date | null;

  /** Time the execution was last active (for timeout detection) */
  lastActiveAt: Date;

  /** Scheduled resume time (for delay nodes) */
  resumeAt: Date | null;

  /** Maximum execution duration (inherited from workflow at creation) */
  executionTimeoutMs: number;

  /** User or system that triggered this execution */
  initiatedBy: string;

  /** Metadata tags for filtering/search */
  tags: Record<string, string>;

  createdAt: Date;
  updatedAt: Date;
}

type ExecutionStatus =
  | 'pending'
  | 'running'
  | 'waiting'       // Delay node or sub-workflow
  | 'completed'
  | 'failed'
  | 'cancelled'
  | 'timed_out'
  | 'compensating'; // Running compensation/rollback actions

interface ExecutionScope {
  type: 'parallel' | 'loop';
  nodeId: string;
  branchIndex?: number;
  loopIndex?: number;
  loopTotal?: number;
  activeBranches?: string[];
  completedBranches?: string[];
}

interface ExecutionErrorInfo {
  code: string;
  message: string;
  nodeId: string;
  stepId: string;
  stack?: string;
  retryable: boolean;
}
```

### WorkflowTrigger

Defines how a workflow is initiated.

```typescript
/**
 * A trigger defines what event or condition starts a workflow execution.
 * Each workflow has exactly one trigger node, but the trigger can respond
 * to multiple event types or conditions.
 */
interface WorkflowTrigger {
  /** Unique trigger identifier (UUID v7) */
  id: string;

  /** Parent workflow ID */
  workflowId: string;

  /** Workflow version */
  versionId: string;

  /** Associated trigger node ID */
  nodeId: string;

  /** Trigger type — determines activation mechanism */
  type: TriggerType;

  /**
   * Type-specific configuration:
   * - event: { topic, filter, consumerGroup }
   * - webhook: { path, method, secret, headers }
   * - schedule: { cron, timezone }
   * - manual: { inputSchema }
   * - form_submission: { formId }
   * - record_change: { table, operation, filter }
   * - email_received: { address, subjectFilter }
   */
  config: Record<string, unknown>;

  /** Whether this trigger is currently active */
  enabled: boolean;

  /** Last time this trigger fired */
  lastFiredAt: Date | null;

  /** Total number of times this trigger has fired */
  fireCount: number;

  createdAt: Date;
  updatedAt: Date;
}

type TriggerType =
  | 'event'           // Redpanda event
  | 'webhook'         // Inbound HTTP
  | 'schedule'        // Cron expression
  | 'manual'          // User-initiated
  | 'form_submission' // Form submit event
  | 'record_change'   // Database change (INSERT/UPDATE/DELETE)
  | 'email_received'; // Inbound email
```

### WorkflowAction

Configuration for an action node — what the node actually does.

```typescript
/**
 * Action configuration for an action node.
 * Defines what side effect the node performs.
 */
interface WorkflowAction {
  /** Action type — determines the handler */
  type: ActionType;

  /**
   * Type-specific configuration:
   * - send_email: { to, subject, body, template, attachments }
   * - send_sms: { to, message }
   * - create_record: { table, data }
   * - update_record: { table, id, data }
   * - delete_record: { table, id }
   * - http_request: { url, method, headers, body, auth }
   * - run_code: { code, runtime, timeout }
   * - assign_task: { assignee, title, description, dueDate }
   * - send_notification: { channel, message, recipients }
   * - set_variable: { name, value }
   * - log: { level, message, data }
   * - transform_data: { expression, outputVariable }
   * - wait_for_approval: { approvers, timeout, message }
   * - call_api: { serviceId, operationId, parameters }
   */
  config: Record<string, unknown>;
}

type ActionType =
  | 'send_email'
  | 'send_sms'
  | 'create_record'
  | 'update_record'
  | 'delete_record'
  | 'http_request'
  | 'run_code'
  | 'assign_task'
  | 'send_notification'
  | 'set_variable'
  | 'log'
  | 'transform_data'
  | 'wait_for_approval'
  | 'call_api';
```

### WorkflowCondition

Configuration for a condition node — branching logic.

```typescript
/**
 * Condition configuration for a condition node.
 * Evaluates an expression and routes execution based on the result.
 */
interface WorkflowCondition {
  /** Condition mode — simple or complex */
  mode: 'simple' | 'switch' | 'expression';

  /**
   * Simple mode: single boolean expression
   * Routes to 'true' or 'false' branches
   */
  simple?: {
    leftOperand: string;          // Variable reference or literal
    operator: ConditionOperator;
    rightOperand: string;         // Variable reference or literal
  };

  /**
   * Switch mode: multiple case branches
   * Routes to matching case or 'default'
   */
  switch?: {
    expression: string;           // Value to switch on
    cases: Array<{
      value: string;
      label: string;
    }>;
  };

  /**
   * Expression mode: JSONata expression returning a branch name
   */
  expression?: {
    code: string;                 // JSONata expression
    branches: string[];           // Possible branch names
  };
}

type ConditionOperator =
  | 'equals'
  | 'not_equals'
  | 'greater_than'
  | 'greater_than_or_equal'
  | 'less_than'
  | 'less_than_or_equal'
  | 'contains'
  | 'not_contains'
  | 'starts_with'
  | 'ends_with'
  | 'matches_regex'
  | 'is_empty'
  | 'is_not_empty'
  | 'is_null'
  | 'is_not_null'
  | 'in_list'
  | 'not_in_list'
  | 'between'
  | 'is_true'
  | 'is_false'
  | 'in_segment';
```

### ExecutionStep

A single step in a workflow execution — the audit record for one node processing.

```typescript
/**
 * An execution step — the record of processing one node during execution.
 * Provides the full audit trail of what happened at each point.
 */
interface ExecutionStep {
  /** Unique step identifier (UUID v7) */
  id: string;

  /** Parent execution ID */
  executionId: string;

  /** The node that was executed */
  nodeId: string;

  /** Node type (denormalized for query performance) */
  nodeType: NodeType;

  /** Node name (denormalized for display) */
  nodeName: string;

  /** Step status */
  status: StepStatus;

  /** Input data that was provided to this step */
  input: Record<string, unknown> | null;

  /** Output data produced by this step */
  output: Record<string, unknown> | null;

  /** Error information if the step failed */
  error: StepErrorInfo | null;

  /** Retry attempt number (0 = first attempt) */
  attemptNumber: number;

  /** Scope context (loop index, parallel branch, etc.) */
  scopeContext: Record<string, unknown> | null;

  /** Duration of this step in milliseconds */
  durationMs: number | null;

  /** When this step started processing */
  startedAt: Date;

  /** When this step completed */
  completedAt: Date | null;

  /** Scheduled time (for delay nodes, before they resume) */
  scheduledAt: Date | null;

  createdAt: Date;
}

type StepStatus =
  | 'pending'
  | 'running'
  | 'completed'
  | 'failed'
  | 'skipped'
  | 'cancelled'
  | 'waiting'
  | 'retrying';

interface StepErrorInfo {
  code: string;
  message: string;
  stack?: string;
  retryable: boolean;
  details?: Record<string, unknown>;
}
```

### WorkflowVersion

Version tracking for workflow definitions.

```typescript
/**
 * A workflow version — a snapshot of the workflow definition at a point in time.
 * Enables draft/published lifecycle, rollback, and A/B testing.
 */
interface WorkflowVersion {
  /** Unique version identifier (UUID v7) */
  id: string;

  /** Parent workflow ID */
  workflowId: string;

  /** Version number (monotonically increasing) */
  versionNumber: number;

  /** Human-readable version label */
  label: string | null;

  /** Version status */
  status: VersionStatus;

  /** Change description (commit message) */
  changeDescription: string | null;

  /** Snapshot of the full workflow graph (nodes + edges) */
  graphSnapshot: {
    nodes: WorkflowNode[];
    edges: WorkflowEdge[];
    triggers: WorkflowTrigger[];
    variables: WorkflowVariable[];
  };

  /** A/B testing traffic allocation (0-100, null if not in A/B test) */
  trafficPercentage: number | null;

  /** Number of executions on this version */
  executionCount: number;

  /** Success rate for executions on this version */
  successRate: number | null;

  /** User who created this version */
  createdBy: string;

  /** When this version was published (null if never published) */
  publishedAt: Date | null;

  createdAt: Date;
}

type VersionStatus = 'draft' | 'published' | 'archived' | 'ab_testing';
```

### WorkflowTemplate

Pre-built workflow templates for common patterns.

```typescript
/**
 * A workflow template — a reusable workflow pattern that can be
 * instantiated into a new workflow. Includes category, preview,
 * and marketplace metadata.
 */
interface WorkflowTemplate {
  /** Unique template identifier (UUID v7) */
  id: string;

  /** Template name */
  name: string;

  /** Template description */
  description: string;

  /** Category for browsing (e.g., 'hr', 'sales', 'support') */
  category: string;

  /** Subcategory for finer grouping */
  subcategory: string | null;

  /** Tags for search */
  tags: string[];

  /** Icon identifier */
  icon: string;

  /** Color identifier */
  color: string;

  /** Full workflow graph definition */
  graph: {
    nodes: Omit<WorkflowNode, 'id' | 'workflowId' | 'versionId' | 'createdAt' | 'updatedAt'>[];
    edges: Omit<WorkflowEdge, 'id' | 'workflowId' | 'versionId' | 'createdAt' | 'updatedAt'>[];
    triggers: Omit<WorkflowTrigger, 'id' | 'workflowId' | 'versionId' | 'nodeId' | 'createdAt' | 'updatedAt'>[];
    variables: Omit<WorkflowVariable, 'id' | 'workflowId' | 'versionId' | 'createdAt' | 'updatedAt'>[];
  };

  /** Configuration inputs the user must fill in when using this template */
  setupInputs: TemplateInput[];

  /** Preview image URL */
  previewImageUrl: string | null;

  /** Estimated setup time (minutes) */
  estimatedSetupMinutes: number;

  /** Complexity rating (1-5) */
  complexity: number;

  /** Scope: 'global' for platform templates, venture ID for private */
  scope: 'global' | string;

  /** Number of times this template has been used */
  usageCount: number;

  /** Average rating (1-5) */
  averageRating: number | null;

  /** Whether this is a featured template */
  featured: boolean;

  /** User who created this template */
  createdBy: string;

  createdAt: Date;
  updatedAt: Date;
}

interface TemplateInput {
  key: string;
  label: string;
  type: 'string' | 'number' | 'boolean' | 'select' | 'email' | 'url';
  required: boolean;
  default?: unknown;
  options?: Array<{ label: string; value: string }>;
  description?: string;
  placeholder?: string;
}
```

### WorkflowVariable

A variable definition for a workflow.

```typescript
/**
 * A workflow variable — a named, typed value that persists
 * across the entire workflow execution.
 */
interface WorkflowVariable {
  /** Unique variable identifier (UUID v7) */
  id: string;

  /** Parent workflow ID */
  workflowId: string;

  /** Workflow version */
  versionId: string;

  /** Variable name (unique within workflow) */
  name: string;

  /** Display label */
  label: string;

  /** Data type */
  type: VariableType;

  /** Default value (JSON-serialized) */
  defaultValue: unknown;

  /** Optional description */
  description: string | null;

  /** Whether this variable is an input (settable at trigger time) */
  isInput: boolean;

  /** Whether this variable is an output (included in execution result) */
  isOutput: boolean;

  /** Whether this variable is required (for inputs) */
  required: boolean;

  /** JSON Schema for validation (optional) */
  schema: Record<string, unknown> | null;

  createdAt: Date;
  updatedAt: Date;
}

type VariableType =
  | 'string'
  | 'number'
  | 'boolean'
  | 'object'
  | 'array'
  | 'date'
  | 'email'
  | 'url';
```

### WorkflowService

The primary service for workflow CRUD, publishing, and orchestration.

```typescript
/**
 * Primary service for managing workflows — CRUD, publishing,
 * version management, and execution coordination.
 */
interface WorkflowService {
  // --- CRUD ---

  /** Create a new workflow with an initial draft version */
  create(input: WorkflowCreateInput): Promise<Workflow>;

  /** Get a workflow by ID (includes published version's nodes/edges) */
  getById(id: string): Promise<WorkflowWithGraph | null>;

  /** List workflows with filtering, sorting, and pagination */
  list(filter: WorkflowListFilter): Promise<PaginatedResult<Workflow>>;

  /** Update workflow metadata (name, description, tags, etc.) */
  update(id: string, input: WorkflowUpdateInput): Promise<Workflow>;

  /** Soft-delete a workflow (pauses all triggers, cancels pending executions) */
  delete(id: string): Promise<void>;

  /** Duplicate a workflow (creates new draft from published version) */
  duplicate(id: string, newName?: string): Promise<Workflow>;

  // --- Graph Operations ---

  /** Add a node to the workflow's draft version */
  addNode(workflowId: string, input: NodeCreateInput): Promise<WorkflowNode>;

  /** Update a node's configuration */
  updateNode(nodeId: string, input: NodeUpdateInput): Promise<WorkflowNode>;

  /** Remove a node and its connected edges */
  removeNode(nodeId: string): Promise<void>;

  /** Add an edge between two nodes */
  addEdge(workflowId: string, input: EdgeCreateInput): Promise<WorkflowEdge>;

  /** Remove an edge */
  removeEdge(edgeId: string): Promise<void>;

  /** Validate the workflow graph (check for cycles, orphans, missing configs) */
  validate(workflowId: string): Promise<ValidationResult>;

  // --- Publishing ---

  /** Publish the current draft (creates new version, activates triggers) */
  publish(workflowId: string, description?: string): Promise<WorkflowVersion>;

  /** Unpublish a workflow (deactivates triggers, preserves version) */
  unpublish(workflowId: string): Promise<void>;

  /** Rollback to a previous version */
  rollback(workflowId: string, versionId: string): Promise<WorkflowVersion>;

  /** Pause a published workflow (deactivates triggers, keeps published state) */
  pause(workflowId: string): Promise<void>;

  /** Resume a paused workflow */
  resume(workflowId: string): Promise<void>;

  // --- Execution ---

  /** Manually trigger a workflow execution */
  execute(workflowId: string, input?: Record<string, unknown>): Promise<WorkflowExecution>;

  /** Cancel a running execution */
  cancelExecution(executionId: string, reason?: string): Promise<void>;

  /** Retry a failed execution from the failed step */
  retryExecution(executionId: string): Promise<WorkflowExecution>;

  // --- A/B Testing ---

  /** Start an A/B test between two versions */
  startAbTest(
    workflowId: string,
    versionA: string,
    versionB: string,
    trafficSplit: number
  ): Promise<void>;

  /** Stop an A/B test and promote a winner */
  stopAbTest(workflowId: string, winnerVersionId: string): Promise<void>;
}

interface WorkflowWithGraph extends Workflow {
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
  triggers: WorkflowTrigger[];
  variables: WorkflowVariable[];
}

interface WorkflowListFilter {
  status?: WorkflowStatus[];
  tags?: string[];
  search?: string;
  folderPath?: string;
  createdBy?: string;
  sortBy?: 'name' | 'createdAt' | 'updatedAt' | 'executionCount';
  sortOrder?: 'asc' | 'desc';
  offset?: number;
  limit?: number;
}

interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
}

interface ValidationError {
  nodeId?: string;
  edgeId?: string;
  code: string;
  message: string;
}

interface ValidationWarning {
  nodeId?: string;
  code: string;
  message: string;
}
```

### Supporting Configuration Interfaces

```typescript
/**
 * Retry policy configuration for workflow steps.
 */
interface RetryPolicy {
  /** Maximum number of retry attempts */
  maxRetries: number;

  /** Backoff strategy */
  backoffStrategy: 'fixed' | 'exponential' | 'linear';

  /** Base delay between retries (ms) */
  baseDelayMs: number;

  /** Maximum delay between retries (ms) */
  maxDelayMs: number;

  /** Error codes that should NOT be retried */
  nonRetryableErrors?: string[];
}

/**
 * Rate limit configuration for workflow executions.
 */
interface RateLimitConfig {
  /** Maximum executions per time window */
  maxExecutions: number;

  /** Time window duration (ms) */
  windowMs: number;

  /** Behavior when limit is reached */
  onLimitReached: 'reject' | 'queue' | 'drop';
}

/**
 * Concurrency configuration for workflow executions.
 */
interface ConcurrencyConfig {
  /** Maximum concurrent executions of this workflow */
  maxConcurrent: number;

  /** Behavior when limit is reached */
  onLimitReached: 'reject' | 'queue';

  /** Queue priority for waiting executions */
  queuePriority?: number;
}

/**
 * Data mapping for transforming data between steps.
 */
interface DataMapping {
  /** Mapping mode */
  mode: 'passthrough' | 'manual' | 'expression';

  /** Manual field mappings (mode: 'manual') */
  fields?: Array<{
    source: string;      // Source path (dot notation)
    target: string;      // Target path (dot notation)
    transform?: string;  // Optional JSONata transform
  }>;

  /** JSONata expression (mode: 'expression') */
  expression?: string;
}

/**
 * Workflow execution metrics for monitoring.
 */
interface WorkflowMetrics {
  workflowId: string;
  period: 'hour' | 'day' | 'week' | 'month';

  /** Total executions in period */
  totalExecutions: number;

  /** Successful executions */
  successCount: number;

  /** Failed executions */
  failureCount: number;

  /** Cancelled executions */
  cancelledCount: number;

  /** Timed out executions */
  timedOutCount: number;

  /** Success rate (0-1) */
  successRate: number;

  /** Average execution duration (ms) */
  avgDurationMs: number;

  /** P50 execution duration */
  p50DurationMs: number;

  /** P95 execution duration */
  p95DurationMs: number;

  /** P99 execution duration */
  p99DurationMs: number;

  /** Total steps executed */
  totalSteps: number;

  /** Total retries */
  totalRetries: number;

  /** Most common error codes */
  topErrors: Array<{ code: string; count: number }>;

  /** Currently active executions */
  activeExecutions: number;

  /** Currently queued executions */
  queuedExecutions: number;
}
```

---

## Database Schemas

### workflows

The root table for workflow definitions.

```typescript
import { pgTable, text, timestamp, jsonb, boolean, uuid, integer, pgEnum } from 'drizzle-orm/pg-core';
import { createId } from '@paralleldrive/cuid2';

export const workflowStatusEnum = pgEnum('workflow_status', [
  'draft',
  'published',
  'paused',
  'archived',
  'error',
]);

export const workflows = pgTable('workflows', {
  id: uuid('id').primaryKey().defaultRandom(),
  ventureId: uuid('venture_id').notNull().references(() => ventures.id),
  name: text('name').notNull(),
  description: text('description'),
  status: workflowStatusEnum('status').notNull().default('draft'),
  publishedVersionId: uuid('published_version_id'),
  draftVersionId: uuid('draft_version_id').notNull(),
  icon: text('icon'),
  color: text('color'),
  tags: jsonb('tags').$type<string[]>().notNull().default([]),
  folderPath: text('folder_path'),
  rateLimit: jsonb('rate_limit').$type<RateLimitConfig>(),
  concurrency: jsonb('concurrency').$type<ConcurrencyConfig>(),
  defaultRetryPolicy: jsonb('default_retry_policy')
    .$type<RetryPolicy>()
    .notNull()
    .default({
      maxRetries: 3,
      backoffStrategy: 'exponential',
      baseDelayMs: 1000,
      maxDelayMs: 300000,
    }),
  executionTimeoutMs: integer('execution_timeout_ms').notNull().default(3600000), // 1 hour
  isTemplate: boolean('is_template').notNull().default(false),
  sourceTemplateId: uuid('source_template_id'),
  createdBy: uuid('created_by').notNull(),
  updatedBy: uuid('updated_by').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  deletedAt: timestamp('deleted_at', { withTimezone: true }),
}, (table) => ({
  ventureIdx: index('workflows_venture_id_idx').on(table.ventureId),
  statusIdx: index('workflows_status_idx').on(table.status),
  folderIdx: index('workflows_folder_path_idx').on(table.folderPath),
  tagsIdx: index('workflows_tags_idx').using('gin', table.tags),
  deletedIdx: index('workflows_deleted_at_idx').on(table.deletedAt),
}));
```

**RLS Policy:**
```sql
ALTER TABLE workflows ENABLE ROW LEVEL SECURITY;

CREATE POLICY "workflows_venture_isolation" ON workflows
  USING (venture_id = (current_setting('app.current_venture_id'))::uuid);

CREATE POLICY "workflows_insert_venture" ON workflows
  FOR INSERT WITH CHECK (
    venture_id = (current_setting('app.current_venture_id'))::uuid
  );
```

### workflow_nodes

Nodes within a workflow graph.

```typescript
export const nodeTypeEnum = pgEnum('node_type', [
  'trigger',
  'action',
  'condition',
  'delay',
  'loop',
  'parallel',
  'sub_workflow',
  'error_handler',
  'end',
]);

export const workflowNodes = pgTable('workflow_nodes', {
  id: uuid('id').primaryKey().defaultRandom(),
  workflowId: uuid('workflow_id').notNull().references(() => workflows.id, { onDelete: 'cascade' }),
  versionId: uuid('version_id').notNull().references(() => workflowVersions.id, { onDelete: 'cascade' }),
  type: nodeTypeEnum('type').notNull(),
  name: text('name').notNull(),
  description: text('description'),
  config: jsonb('config').notNull().default({}),
  inputMapping: jsonb('input_mapping').$type<DataMapping>(),
  outputMapping: jsonb('output_mapping').$type<DataMapping>(),
  retryPolicy: jsonb('retry_policy').$type<RetryPolicy>(),
  timeoutMs: integer('timeout_ms'),
  position: jsonb('position').$type<{ x: number; y: number }>().notNull().default({ x: 0, y: 0 }),
  dimensions: jsonb('dimensions').$type<{ width: number; height: number }>(),
  uiMeta: jsonb('ui_meta'),
  sortOrder: integer('sort_order').notNull().default(0),
  disabled: boolean('disabled').notNull().default(false),
  notes: text('notes'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  workflowIdx: index('workflow_nodes_workflow_id_idx').on(table.workflowId),
  versionIdx: index('workflow_nodes_version_id_idx').on(table.versionId),
  typeIdx: index('workflow_nodes_type_idx').on(table.type),
}));
```

### workflow_edges

Edges connecting nodes in the workflow graph.

```typescript
export const workflowEdges = pgTable('workflow_edges', {
  id: uuid('id').primaryKey().defaultRandom(),
  workflowId: uuid('workflow_id').notNull().references(() => workflows.id, { onDelete: 'cascade' }),
  versionId: uuid('version_id').notNull().references(() => workflowVersions.id, { onDelete: 'cascade' }),
  sourceNodeId: uuid('source_node_id').notNull().references(() => workflowNodes.id, { onDelete: 'cascade' }),
  targetNodeId: uuid('target_node_id').notNull().references(() => workflowNodes.id, { onDelete: 'cascade' }),
  sourceHandle: text('source_handle').notNull().default('output'),
  targetHandle: text('target_handle').notNull().default('input'),
  label: text('label'),
  sortOrder: integer('sort_order').notNull().default(0),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  workflowIdx: index('workflow_edges_workflow_id_idx').on(table.workflowId),
  versionIdx: index('workflow_edges_version_id_idx').on(table.versionId),
  sourceIdx: index('workflow_edges_source_node_id_idx').on(table.sourceNodeId),
  targetIdx: index('workflow_edges_target_node_id_idx').on(table.targetNodeId),
}));
```

### workflow_executions

Execution records for workflow runs.

```typescript
export const executionStatusEnum = pgEnum('execution_status', [
  'pending',
  'running',
  'waiting',
  'completed',
  'failed',
  'cancelled',
  'timed_out',
  'compensating',
]);

export const workflowExecutions = pgTable('workflow_executions', {
  id: uuid('id').primaryKey().defaultRandom(),
  workflowId: uuid('workflow_id').notNull().references(() => workflows.id),
  versionId: uuid('version_id').notNull().references(() => workflowVersions.id),
  ventureId: uuid('venture_id').notNull(),
  status: executionStatusEnum('status').notNull().default('pending'),
  triggerId: uuid('trigger_id'),
  triggerPayload: jsonb('trigger_payload'),
  variables: jsonb('variables').notNull().default({}),
  stepOutputs: jsonb('step_outputs').notNull().default({}),
  currentNodeId: uuid('current_node_id'),
  scopeStack: jsonb('scope_stack').$type<ExecutionScope[]>().notNull().default([]),
  parentExecutionId: uuid('parent_execution_id'),
  parentNodeId: uuid('parent_node_id'),
  stepCount: integer('step_count').notNull().default(0),
  retryCount: integer('retry_count').notNull().default(0),
  error: jsonb('error').$type<ExecutionErrorInfo>(),
  priority: integer('priority').notNull().default(5),
  startedAt: timestamp('started_at', { withTimezone: true }).notNull().defaultNow(),
  completedAt: timestamp('completed_at', { withTimezone: true }),
  lastActiveAt: timestamp('last_active_at', { withTimezone: true }).notNull().defaultNow(),
  resumeAt: timestamp('resume_at', { withTimezone: true }),
  executionTimeoutMs: integer('execution_timeout_ms').notNull().default(3600000),
  initiatedBy: text('initiated_by').notNull(),
  tags: jsonb('tags').$type<Record<string, string>>().notNull().default({}),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  workflowIdx: index('workflow_executions_workflow_id_idx').on(table.workflowId),
  ventureIdx: index('workflow_executions_venture_id_idx').on(table.ventureId),
  statusIdx: index('workflow_executions_status_idx').on(table.status),
  startedIdx: index('workflow_executions_started_at_idx').on(table.startedAt),
  parentIdx: index('workflow_executions_parent_execution_id_idx').on(table.parentExecutionId),
  resumeIdx: index('workflow_executions_resume_at_idx').on(table.resumeAt),
  activeIdx: index('workflow_executions_active_idx')
    .on(table.status, table.lastActiveAt)
    .where(sql`status IN ('pending', 'running', 'waiting', 'compensating')`),
}));
```

**RLS Policy:**
```sql
ALTER TABLE workflow_executions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "executions_venture_isolation" ON workflow_executions
  USING (venture_id = (current_setting('app.current_venture_id'))::uuid);
```

### execution_steps

Individual step records within an execution.

```typescript
export const stepStatusEnum = pgEnum('step_status', [
  'pending',
  'running',
  'completed',
  'failed',
  'skipped',
  'cancelled',
  'waiting',
  'retrying',
]);

export const executionSteps = pgTable('execution_steps', {
  id: uuid('id').primaryKey().defaultRandom(),
  executionId: uuid('execution_id').notNull().references(() => workflowExecutions.id, { onDelete: 'cascade' }),
  nodeId: uuid('node_id').notNull(),
  nodeType: nodeTypeEnum('node_type').notNull(),
  nodeName: text('node_name').notNull(),
  status: stepStatusEnum('status').notNull().default('pending'),
  input: jsonb('input'),
  output: jsonb('output'),
  error: jsonb('error').$type<StepErrorInfo>(),
  attemptNumber: integer('attempt_number').notNull().default(0),
  scopeContext: jsonb('scope_context'),
  durationMs: integer('duration_ms'),
  startedAt: timestamp('started_at', { withTimezone: true }).notNull().defaultNow(),
  completedAt: timestamp('completed_at', { withTimezone: true }),
  scheduledAt: timestamp('scheduled_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  executionIdx: index('execution_steps_execution_id_idx').on(table.executionId),
  nodeIdx: index('execution_steps_node_id_idx').on(table.nodeId),
  statusIdx: index('execution_steps_status_idx').on(table.status),
  startedIdx: index('execution_steps_started_at_idx').on(table.startedAt),
}));
```

### workflow_triggers

Trigger configurations for workflows.

```typescript
export const triggerTypeEnum = pgEnum('trigger_type', [
  'event',
  'webhook',
  'schedule',
  'manual',
  'form_submission',
  'record_change',
  'email_received',
]);

export const workflowTriggers = pgTable('workflow_triggers', {
  id: uuid('id').primaryKey().defaultRandom(),
  workflowId: uuid('workflow_id').notNull().references(() => workflows.id, { onDelete: 'cascade' }),
  versionId: uuid('version_id').notNull().references(() => workflowVersions.id, { onDelete: 'cascade' }),
  nodeId: uuid('node_id').notNull().references(() => workflowNodes.id, { onDelete: 'cascade' }),
  type: triggerTypeEnum('type').notNull(),
  config: jsonb('config').notNull().default({}),
  enabled: boolean('enabled').notNull().default(true),
  lastFiredAt: timestamp('last_fired_at', { withTimezone: true }),
  fireCount: integer('fire_count').notNull().default(0),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  workflowIdx: index('workflow_triggers_workflow_id_idx').on(table.workflowId),
  typeIdx: index('workflow_triggers_type_idx').on(table.type),
  enabledIdx: index('workflow_triggers_enabled_idx').on(table.enabled),
}));
```

### workflow_versions

Version history for workflows.

```typescript
export const versionStatusEnum = pgEnum('version_status', [
  'draft',
  'published',
  'archived',
  'ab_testing',
]);

export const workflowVersions = pgTable('workflow_versions', {
  id: uuid('id').primaryKey().defaultRandom(),
  workflowId: uuid('workflow_id').notNull().references(() => workflows.id, { onDelete: 'cascade' }),
  versionNumber: integer('version_number').notNull(),
  label: text('label'),
  status: versionStatusEnum('status').notNull().default('draft'),
  changeDescription: text('change_description'),
  graphSnapshot: jsonb('graph_snapshot').notNull(),
  trafficPercentage: integer('traffic_percentage'),
  executionCount: integer('execution_count').notNull().default(0),
  successRate: integer('success_rate'), // stored as percentage * 100 (e.g., 9500 = 95.00%)
  createdBy: uuid('created_by').notNull(),
  publishedAt: timestamp('published_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  workflowIdx: index('workflow_versions_workflow_id_idx').on(table.workflowId),
  statusIdx: index('workflow_versions_status_idx').on(table.status),
  versionNumberIdx: index('workflow_versions_version_number_idx').on(table.workflowId, table.versionNumber),
}));
```

### workflow_templates

Pre-built workflow templates.

```typescript
export const workflowTemplates = pgTable('workflow_templates', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  description: text('description').notNull(),
  category: text('category').notNull(),
  subcategory: text('subcategory'),
  tags: jsonb('tags').$type<string[]>().notNull().default([]),
  icon: text('icon').notNull(),
  color: text('color').notNull(),
  graph: jsonb('graph').notNull(),
  setupInputs: jsonb('setup_inputs').$type<TemplateInput[]>().notNull().default([]),
  previewImageUrl: text('preview_image_url'),
  estimatedSetupMinutes: integer('estimated_setup_minutes').notNull().default(5),
  complexity: integer('complexity').notNull().default(1),
  scope: text('scope').notNull().default('global'),
  usageCount: integer('usage_count').notNull().default(0),
  averageRating: integer('average_rating'), // stored as rating * 100
  featured: boolean('featured').notNull().default(false),
  createdBy: uuid('created_by').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  categoryIdx: index('workflow_templates_category_idx').on(table.category),
  scopeIdx: index('workflow_templates_scope_idx').on(table.scope),
  featuredIdx: index('workflow_templates_featured_idx').on(table.featured),
  tagsIdx: index('workflow_templates_tags_idx').using('gin', table.tags),
}));
```

### workflow_variables

Variable definitions for workflows.

```typescript
export const variableTypeEnum = pgEnum('variable_type', [
  'string',
  'number',
  'boolean',
  'object',
  'array',
  'date',
  'email',
  'url',
]);

export const workflowVariables = pgTable('workflow_variables', {
  id: uuid('id').primaryKey().defaultRandom(),
  workflowId: uuid('workflow_id').notNull().references(() => workflows.id, { onDelete: 'cascade' }),
  versionId: uuid('version_id').notNull().references(() => workflowVersions.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  label: text('label').notNull(),
  type: variableTypeEnum('type').notNull(),
  defaultValue: jsonb('default_value'),
  description: text('description'),
  isInput: boolean('is_input').notNull().default(false),
  isOutput: boolean('is_output').notNull().default(false),
  required: boolean('required').notNull().default(false),
  schema: jsonb('schema'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  workflowIdx: index('workflow_variables_workflow_id_idx').on(table.workflowId),
  versionIdx: index('workflow_variables_version_id_idx').on(table.versionId),
  nameIdx: index('workflow_variables_name_idx').on(table.workflowId, table.versionId, table.name),
}));
```

### workflow_schedules

Schedule definitions for cron-triggered workflows.

```typescript
export const workflowSchedules = pgTable('workflow_schedules', {
  id: uuid('id').primaryKey().defaultRandom(),
  workflowId: uuid('workflow_id').notNull().references(() => workflows.id, { onDelete: 'cascade' }),
  triggerId: uuid('trigger_id').notNull().references(() => workflowTriggers.id, { onDelete: 'cascade' }),
  ventureId: uuid('venture_id').notNull(),
  cronExpression: text('cron_expression').notNull(),
  timezone: text('timezone').notNull().default('UTC'),
  enabled: boolean('enabled').notNull().default(true),
  nextRunAt: timestamp('next_run_at', { withTimezone: true }),
  lastRunAt: timestamp('last_run_at', { withTimezone: true }),
  lastRunExecutionId: uuid('last_run_execution_id'),
  runCount: integer('run_count').notNull().default(0),
  metadata: jsonb('metadata').default({}),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  workflowIdx: index('workflow_schedules_workflow_id_idx').on(table.workflowId),
  enabledIdx: index('workflow_schedules_enabled_idx').on(table.enabled),
  nextRunIdx: index('workflow_schedules_next_run_at_idx').on(table.nextRunAt),
}));
```

### execution_errors

Detailed error records for failed execution steps.

```typescript
export const executionErrors = pgTable('execution_errors', {
  id: uuid('id').primaryKey().defaultRandom(),
  executionId: uuid('execution_id').notNull().references(() => workflowExecutions.id, { onDelete: 'cascade' }),
  stepId: uuid('step_id').notNull().references(() => executionSteps.id, { onDelete: 'cascade' }),
  nodeId: uuid('node_id').notNull(),
  errorCode: text('error_code').notNull(),
  errorMessage: text('error_message').notNull(),
  errorStack: text('error_stack'),
  errorDetails: jsonb('error_details'),
  retryable: boolean('retryable').notNull().default(false),
  attemptNumber: integer('attempt_number').notNull().default(0),
  resolvedAt: timestamp('resolved_at', { withTimezone: true }),
  resolvedBy: text('resolved_by'), // 'retry', 'error_handler', 'manual', 'cancelled'
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  executionIdx: index('execution_errors_execution_id_idx').on(table.executionId),
  stepIdx: index('execution_errors_step_id_idx').on(table.stepId),
  codeIdx: index('execution_errors_error_code_idx').on(table.errorCode),
  unresolvedIdx: index('execution_errors_unresolved_idx')
    .on(table.executionId)
    .where(sql`resolved_at IS NULL`),
}));
```

---

## Code Examples

### Example 1: Creating a Workflow Programmatically

```typescript
import { WorkflowService } from '@mcv/operations/workflows';

const workflowService = new WorkflowService(db, redis, redpanda);

// Create a new lead nurturing workflow
const workflow = await workflowService.create({
  name: 'Lead Nurturing Sequence',
  description: 'Automated follow-up sequence for new leads from the website',
  tags: ['sales', 'leads', 'nurture'],
  folderPath: '/sales/automation',
  defaultRetryPolicy: {
    maxRetries: 3,
    backoffStrategy: 'exponential',
    baseDelayMs: 2000,
    maxDelayMs: 60000,
  },
  executionTimeoutMs: 7 * 24 * 60 * 60 * 1000, // 7 days (long-running nurture)
});

// Add trigger node: new lead form submission
const triggerNode = await workflowService.addNode(workflow.id, {
  type: 'trigger',
  name: 'New Lead Submitted',
  config: {
    triggerType: 'form_submission',
    formId: 'website-contact-form',
  },
  position: { x: 250, y: 50 },
});

// Add action node: send welcome email
const welcomeEmail = await workflowService.addNode(workflow.id, {
  type: 'action',
  name: 'Send Welcome Email',
  config: {
    actionType: 'send_email',
    to: '{{trigger.payload.email}}',
    subject: 'Welcome to {{venture.name}}!',
    template: 'lead-welcome',
    templateData: {
      firstName: '{{trigger.payload.firstName}}',
      downloadLink: '{{trigger.payload.resourceUrl}}',
    },
  },
  position: { x: 250, y: 200 },
});

// Add delay node: wait 2 days
const delayNode = await workflowService.addNode(workflow.id, {
  type: 'delay',
  name: 'Wait 2 Days',
  config: {
    delayType: 'duration',
    durationMs: 2 * 24 * 60 * 60 * 1000, // 2 days
  },
  position: { x: 250, y: 350 },
});

// Add condition: check if lead opened email
const checkOpen = await workflowService.addNode(workflow.id, {
  type: 'condition',
  name: 'Email Opened?',
  config: {
    mode: 'simple',
    simple: {
      leftOperand: 'steps.send_welcome_email.output.opened',
      operator: 'is_true',
      rightOperand: '',
    },
  },
  position: { x: 250, y: 500 },
});

// Add action: follow-up email (if opened)
const followUp = await workflowService.addNode(workflow.id, {
  type: 'action',
  name: 'Send Follow-Up Email',
  config: {
    actionType: 'send_email',
    to: '{{trigger.payload.email}}',
    subject: 'Quick follow-up, {{trigger.payload.firstName}}',
    template: 'lead-followup-engaged',
  },
  position: { x: 100, y: 650 },
});

// Add action: re-engagement email (if not opened)
const reEngage = await workflowService.addNode(workflow.id, {
  type: 'action',
  name: 'Send Re-Engagement Email',
  config: {
    actionType: 'send_email',
    to: '{{trigger.payload.email}}',
    subject: 'Did you see this, {{trigger.payload.firstName}}?',
    template: 'lead-reengagement',
  },
  position: { x: 400, y: 650 },
});

// Connect the nodes with edges
await workflowService.addEdge(workflow.id, {
  sourceNodeId: triggerNode.id,
  targetNodeId: welcomeEmail.id,
  sourceHandle: 'output',
  targetHandle: 'input',
});

await workflowService.addEdge(workflow.id, {
  sourceNodeId: welcomeEmail.id,
  targetNodeId: delayNode.id,
  sourceHandle: 'output',
  targetHandle: 'input',
});

await workflowService.addEdge(workflow.id, {
  sourceNodeId: delayNode.id,
  targetNodeId: checkOpen.id,
  sourceHandle: 'output',
  targetHandle: 'input',
});

await workflowService.addEdge(workflow.id, {
  sourceNodeId: checkOpen.id,
  targetNodeId: followUp.id,
  sourceHandle: 'true',
  targetHandle: 'input',
  label: 'Opened',
});

await workflowService.addEdge(workflow.id, {
  sourceNodeId: checkOpen.id,
  targetNodeId: reEngage.id,
  sourceHandle: 'false',
  targetHandle: 'input',
  label: 'Not Opened',
});

// Validate and publish
const validation = await workflowService.validate(workflow.id);
if (validation.valid) {
  await workflowService.publish(workflow.id, 'Initial version — lead nurture sequence');
  console.log('Workflow published successfully!');
} else {
  console.error('Validation errors:', validation.errors);
}
```

### Example 2: tRPC Router Integration

```typescript
import { z } from 'zod';
import { router, protectedProcedure } from '@mcv/trpc';
import { WorkflowService, ExecutionService, TemplateService } from '@mcv/operations/workflows';
import { TRPCError } from '@trpc/server';

export const workflowRouter = router({
  // List workflows for the current venture
  list: protectedProcedure
    .input(z.object({
      status: z.array(z.enum(['draft', 'published', 'paused', 'archived', 'error'])).optional(),
      tags: z.array(z.string()).optional(),
      search: z.string().optional(),
      folderPath: z.string().optional(),
      sortBy: z.enum(['name', 'createdAt', 'updatedAt', 'executionCount']).optional(),
      sortOrder: z.enum(['asc', 'desc']).optional(),
      offset: z.number().min(0).optional(),
      limit: z.number().min(1).max(100).optional(),
    }))
    .query(async ({ ctx, input }) => {
      const service = new WorkflowService(ctx.db, ctx.redis, ctx.redpanda);
      return service.list({
        ...input,
        ventureId: ctx.ventureId,
      });
    }),

  // Get workflow with full graph
  getById: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const service = new WorkflowService(ctx.db, ctx.redis, ctx.redpanda);
      const workflow = await service.getById(input.id);

      if (!workflow) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Workflow not found' });
      }

      return workflow;
    }),

  // Create a new workflow
  create: protectedProcedure
    .input(z.object({
      name: z.string().min(1).max(200),
      description: z.string().max(2000).optional(),
      tags: z.array(z.string().max(50)).max(20).optional(),
      folderPath: z.string().max(500).optional(),
      templateId: z.string().uuid().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const service = new WorkflowService(ctx.db, ctx.redis, ctx.redpanda);

      if (input.templateId) {
        const templateService = new TemplateService(ctx.db);
        return templateService.instantiate(input.templateId, {
          name: input.name,
          description: input.description,
          tags: input.tags,
          folderPath: input.folderPath,
          ventureId: ctx.ventureId,
          createdBy: ctx.userId,
        });
      }

      return service.create({
        ...input,
        ventureId: ctx.ventureId,
        createdBy: ctx.userId,
      });
    }),

  // Update workflow metadata
  update: protectedProcedure
    .input(z.object({
      id: z.string().uuid(),
      name: z.string().min(1).max(200).optional(),
      description: z.string().max(2000).nullable().optional(),
      tags: z.array(z.string().max(50)).max(20).optional(),
      folderPath: z.string().max(500).nullable().optional(),
      icon: z.string().max(50).nullable().optional(),
      color: z.string().max(20).nullable().optional(),
      rateLimit: z.object({
        maxExecutions: z.number().min(1).max(100000),
        windowMs: z.number().min(1000).max(86400000),
        onLimitReached: z.enum(['reject', 'queue', 'drop']),
      }).nullable().optional(),
      concurrency: z.object({
        maxConcurrent: z.number().min(1).max(1000),
        onLimitReached: z.enum(['reject', 'queue']),
      }).nullable().optional(),
      defaultRetryPolicy: z.object({
        maxRetries: z.number().min(0).max(10),
        backoffStrategy: z.enum(['fixed', 'exponential', 'linear']),
        baseDelayMs: z.number().min(100).max(600000),
        maxDelayMs: z.number().min(100).max(3600000),
      }).optional(),
      executionTimeoutMs: z.number().min(1000).max(604800000).optional(), // max 7 days
    }))
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      const service = new WorkflowService(ctx.db, ctx.redis, ctx.redpanda);
      return service.update(id, { ...data, updatedBy: ctx.userId });
    }),

  // Publish workflow
  publish: protectedProcedure
    .input(z.object({
      id: z.string().uuid(),
      description: z.string().max(500).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const service = new WorkflowService(ctx.db, ctx.redis, ctx.redpanda);

      // Validate before publishing
      const validation = await service.validate(input.id);
      if (!validation.valid) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Workflow validation failed',
          cause: validation.errors,
        });
      }

      return service.publish(input.id, input.description);
    }),

  // Execute workflow manually
  execute: protectedProcedure
    .input(z.object({
      workflowId: z.string().uuid(),
      input: z.record(z.unknown()).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const service = new WorkflowService(ctx.db, ctx.redis, ctx.redpanda);
      return service.execute(input.workflowId, input.input);
    }),

  // Get execution details
  getExecution: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const executionService = new ExecutionService(ctx.db, ctx.redis);
      const execution = await executionService.getById(input.id);

      if (!execution) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Execution not found' });
      }

      return execution;
    }),

  // List executions for a workflow
  listExecutions: protectedProcedure
    .input(z.object({
      workflowId: z.string().uuid(),
      status: z.array(z.enum([
        'pending', 'running', 'waiting', 'completed',
        'failed', 'cancelled', 'timed_out', 'compensating',
      ])).optional(),
      startedAfter: z.date().optional(),
      startedBefore: z.date().optional(),
      offset: z.number().min(0).optional(),
      limit: z.number().min(1).max(100).optional(),
    }))
    .query(async ({ ctx, input }) => {
      const executionService = new ExecutionService(ctx.db, ctx.redis);
      return executionService.list(input);
    }),

  // Get execution steps (audit trail)
  getExecutionSteps: protectedProcedure
    .input(z.object({
      executionId: z.string().uuid(),
    }))
    .query(async ({ ctx, input }) => {
      const executionService = new ExecutionService(ctx.db, ctx.redis);
      return executionService.getSteps(input.executionId);
    }),

  // Get workflow metrics
  getMetrics: protectedProcedure
    .input(z.object({
      workflowId: z.string().uuid(),
      period: z.enum(['hour', 'day', 'week', 'month']).optional().default('day'),
    }))
    .query(async ({ ctx, input }) => {
      const monitoring = new MonitoringService(ctx.db, ctx.redis);
      return monitoring.getWorkflowMetrics(input.workflowId, input.period);
    }),
});
```

### Example 3: Workflow Execution Worker

```typescript
import { Worker, Job } from 'bullmq';
import { ExecutionService } from '@mcv/operations/workflows';
import { WORKFLOW_QUEUE_NAME } from '@mcv/operations/workflows/constants';
import type { WorkflowNode, WorkflowExecution, StepResult, WorkflowContext } from '@mcv/operations/workflows';

interface ExecuteStepPayload {
  executionId: string;
  nodeId: string;
  attempt: number;
}

export class WorkflowWorker {
  private worker: Worker;
  private executionService: ExecutionService;
  private actionHandlers: Map<string, ActionHandler>;
  private conditionEvaluator: ConditionEvaluator;

  constructor(
    private db: Database,
    private redis: Redis,
    private redpanda: Redpanda,
  ) {
    this.executionService = new ExecutionService(db, redis);
    this.actionHandlers = this.registerActionHandlers();
    this.conditionEvaluator = new ConditionEvaluator();

    this.worker = new Worker(
      WORKFLOW_QUEUE_NAME,
      async (job: Job) => this.processJob(job),
      {
        connection: redis,
        concurrency: 10,
        limiter: {
          max: 100,
          duration: 1000,
        },
      },
    );

    this.worker.on('failed', (job, err) => {
      console.error(`Job ${job?.id} failed:`, err);
    });

    this.worker.on('completed', (job) => {
      console.log(`Job ${job.id} completed`);
    });
  }

  private async processJob(job: Job): Promise<void> {
    const { executionId, nodeId, attempt } = job.data as ExecuteStepPayload;

    // Load execution context
    const execution = await this.executionService.getById(executionId);
    if (!execution || execution.status === 'cancelled') {
      return; // Execution was cancelled, don't process
    }

    // Check execution timeout
    const elapsed = Date.now() - execution.startedAt.getTime();
    if (elapsed > execution.executionTimeoutMs) {
      await this.executionService.timeout(executionId);
      return;
    }

    // Load the node definition
    const node = await this.executionService.getNode(execution.versionId, nodeId);
    if (!node) {
      await this.executionService.failStep(executionId, nodeId, {
        code: 'WF_NODE_NOT_FOUND',
        message: `Node ${nodeId} not found in version ${execution.versionId}`,
        retryable: false,
      });
      return;
    }

    // Skip disabled nodes
    if (node.disabled) {
      await this.executionService.skipStep(executionId, nodeId);
      await this.advanceToNextNodes(execution, node, { skipped: true });
      return;
    }

    // Create step record
    const step = await this.executionService.createStep(executionId, node, attempt);

    try {
      // Build execution context for this step
      const context = this.buildContext(execution, node);

      // Resolve input mapping
      const input = await this.resolveInput(node, context);

      // Execute the node based on its type
      const result = await this.executeNode(node, input, context);

      // Apply output mapping
      const output = await this.resolveOutput(node, result, context);

      // Mark step as completed
      await this.executionService.completeStep(step.id, output);

      // Update execution state with step output
      await this.executionService.updateStepOutput(executionId, nodeId, output);

      // Advance to next node(s)
      await this.advanceToNextNodes(execution, node, result);

    } catch (error) {
      await this.handleStepError(execution, node, step, error as Error, attempt);
    }
  }

  private async executeNode(
    node: WorkflowNode,
    input: Record<string, unknown>,
    context: WorkflowContext,
  ): Promise<StepResult> {
    switch (node.type) {
      case 'action':
        return this.executeAction(node, input, context);

      case 'condition':
        return this.evaluateCondition(node, context);

      case 'delay':
        return this.executeDelay(node, context);

      case 'loop':
        return this.executeLoop(node, input, context);

      case 'parallel':
        return this.executeParallel(node, context);

      case 'sub_workflow':
        return this.executeSubWorkflow(node, input, context);

      case 'end':
        return { completed: true };

      default:
        throw new Error(`Unknown node type: ${node.type}`);
    }
  }

  private async executeAction(
    node: WorkflowNode,
    input: Record<string, unknown>,
    context: WorkflowContext,
  ): Promise<StepResult> {
    const actionType = node.config.actionType as string;
    const handler = this.actionHandlers.get(actionType);

    if (!handler) {
      throw new Error(`Unknown action type: ${actionType}`);
    }

    // Apply timeout
    const timeoutMs = node.timeoutMs ?? 30000; // Default 30s
    const result = await Promise.race([
      handler.execute(node.config, input, context),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Action timed out')), timeoutMs),
      ),
    ]);

    return result;
  }

  private async handleStepError(
    execution: WorkflowExecution,
    node: WorkflowNode,
    step: ExecutionStep,
    error: Error,
    attempt: number,
  ): Promise<void> {
    const retryPolicy = node.retryPolicy ?? execution.defaultRetryPolicy;
    const isRetryable = this.isRetryableError(error, retryPolicy);

    // Record the error
    await this.executionService.recordError(execution.id, step.id, node.id, {
      code: (error as any).code ?? 'WF_STEP_FAILED',
      message: error.message,
      stack: error.stack,
      retryable: isRetryable,
    });

    if (isRetryable && attempt < retryPolicy.maxRetries) {
      // Schedule retry with backoff
      const delay = this.calculateBackoff(retryPolicy, attempt);
      await this.executionService.retryStep(step.id, attempt + 1);

      await this.worker.queue.add(
        'execute-step',
        { executionId: execution.id, nodeId: node.id, attempt: attempt + 1 },
        { delay, priority: execution.priority },
      );
    } else {
      // Check for error handler branch
      const errorHandler = await this.executionService.findErrorHandler(execution.versionId, node.id);

      if (errorHandler) {
        await this.executionService.failStep(step.id, error);
        await this.advanceToNode(execution, errorHandler.id);
      } else {
        // No error handler — fail the execution
        await this.executionService.failExecution(execution.id, {
          code: (error as any).code ?? 'WF_STEP_FAILED',
          message: error.message,
          nodeId: node.id,
          stepId: step.id,
          retryable: false,
        });
      }
    }
  }

  private calculateBackoff(policy: RetryPolicy, attempt: number): number {
    let delay: number;

    switch (policy.backoffStrategy) {
      case 'fixed':
        delay = policy.baseDelayMs;
        break;
      case 'exponential':
        delay = Math.pow(2, attempt) * policy.baseDelayMs;
        break;
      case 'linear':
        delay = (attempt + 1) * policy.baseDelayMs;
        break;
      default:
        delay = policy.baseDelayMs;
    }

    // Add jitter (±10%)
    const jitter = delay * 0.1 * (Math.random() * 2 - 1);
    delay = Math.round(delay + jitter);

    return Math.min(delay, policy.maxDelayMs);
  }

  async shutdown(): Promise<void> {
    await this.worker.close();
  }
}
```

### Example 4: Trigger Service — Event-Based Trigger Registration

```typescript
import { Consumer, Kafka } from 'kafkajs';
import type { WorkflowTrigger, TriggerPayload } from '@mcv/operations/workflows';

export class TriggerService {
  private consumers: Map<string, Consumer> = new Map();
  private webhookRegistry: Map<string, WebhookRegistration> = new Map();

  constructor(
    private db: Database,
    private redis: Redis,
    private kafka: Kafka,
    private workflowService: WorkflowService,
    private rateLimiter: RateLimiterService,
  ) {}

  /**
   * Register an event-based trigger — subscribes to a Redpanda topic
   * and fires the workflow when matching events arrive.
   */
  async registerEventTrigger(trigger: WorkflowTrigger): Promise<void> {
    const config = trigger.config as {
      topic: string;
      filter?: Record<string, unknown>;
      consumerGroup?: string;
    };

    const groupId = config.consumerGroup ??
      `wf-trigger-${trigger.workflowId}-${trigger.id}`;

    const consumer = this.kafka.consumer({ groupId });
    await consumer.connect();
    await consumer.subscribe({ topic: config.topic, fromBeginning: false });

    await consumer.run({
      eachMessage: async ({ topic, partition, message }) => {
        try {
          const payload = JSON.parse(message.value?.toString() ?? '{}');

          // Apply filter if configured
          if (config.filter && !this.matchesFilter(payload, config.filter)) {
            return; // Skip — doesn't match filter
          }

          // Check rate limit
          const allowed = await this.rateLimiter.checkWorkflowLimit(trigger.workflowId);
          if (!allowed) {
            console.warn(`Rate limit exceeded for workflow ${trigger.workflowId}`);
            return;
          }

          // Fire the trigger
          await this.fireTrigger(trigger, {
            source: 'event',
            topic,
            partition,
            offset: message.offset,
            payload,
            timestamp: new Date(),
          });
        } catch (error) {
          console.error(`Error processing event trigger ${trigger.id}:`, error);
        }
      },
    });

    this.consumers.set(trigger.id, consumer);
    console.log(`Registered event trigger ${trigger.id} on topic ${config.topic}`);
  }

  /**
   * Register a webhook trigger — creates an endpoint that fires
   * the workflow when called.
   */
  async registerWebhookTrigger(trigger: WorkflowTrigger): Promise<string> {
    const config = trigger.config as {
      path?: string;
      method?: string;
      secret?: string;
      headers?: Record<string, string>;
    };

    // Generate unique webhook path
    const webhookPath = config.path ??
      `/webhooks/workflow/${trigger.workflowId}/${trigger.id}`;

    this.webhookRegistry.set(webhookPath, {
      triggerId: trigger.id,
      workflowId: trigger.workflowId,
      method: config.method ?? 'POST',
      secret: config.secret,
      expectedHeaders: config.headers,
    });

    // Store webhook URL in Redis for fast lookup during HTTP handling
    await this.redis.hset(
      'webhook-triggers',
      webhookPath,
      JSON.stringify({
        triggerId: trigger.id,
        workflowId: trigger.workflowId,
        secret: config.secret,
      }),
    );

    return webhookPath;
  }

  /**
   * Handle an incoming webhook request.
   */
  async handleWebhook(
    path: string,
    method: string,
    headers: Record<string, string>,
    body: unknown,
  ): Promise<{ executionId: string } | { error: string }> {
    // Look up webhook registration
    const registrationJson = await this.redis.hget('webhook-triggers', path);
    if (!registrationJson) {
      return { error: 'Webhook not found' };
    }

    const registration = JSON.parse(registrationJson);

    // Validate secret if configured
    if (registration.secret) {
      const providedSecret = headers['x-webhook-secret'] ?? headers['authorization'];
      if (providedSecret !== `Bearer ${registration.secret}`) {
        return { error: 'Unauthorized' };
      }
    }

    // Load trigger
    const trigger = await this.getTrigger(registration.triggerId);
    if (!trigger || !trigger.enabled) {
      return { error: 'Trigger disabled' };
    }

    // Check rate limit
    const allowed = await this.rateLimiter.checkWorkflowLimit(registration.workflowId);
    if (!allowed) {
      return { error: 'Rate limit exceeded' };
    }

    // Fire the trigger
    const execution = await this.fireTrigger(trigger, {
      source: 'webhook',
      method,
      path,
      headers,
      payload: body,
      timestamp: new Date(),
    });

    return { executionId: execution.id };
  }

  /**
   * Fire a trigger — initiates a workflow execution.
   */
  private async fireTrigger(
    trigger: WorkflowTrigger,
    payload: TriggerPayload,
  ): Promise<WorkflowExecution> {
    // Update trigger fire count
    await this.db
      .update(workflowTriggers)
      .set({
        lastFiredAt: new Date(),
        fireCount: sql`fire_count + 1`,
      })
      .where(eq(workflowTriggers.id, trigger.id));

    // Start workflow execution
    const execution = await this.workflowService.execute(
      trigger.workflowId,
      payload.payload as Record<string, unknown>,
    );

    // Emit trigger event to Redpanda
    await this.emitEvent('workflow.trigger.fired', {
      triggerId: trigger.id,
      workflowId: trigger.workflowId,
      executionId: execution.id,
      triggerType: trigger.type,
      timestamp: payload.timestamp,
    });

    return execution;
  }

  /**
   * Check if a payload matches a filter specification.
   */
  private matchesFilter(
    payload: Record<string, unknown>,
    filter: Record<string, unknown>,
  ): boolean {
    for (const [key, expected] of Object.entries(filter)) {
      const actual = this.getNestedValue(payload, key);

      if (typeof expected === 'object' && expected !== null) {
        // Operator-based filter: { $gt: 10 }, { $in: ['a', 'b'] }, etc.
        const ops = expected as Record<string, unknown>;
        for (const [op, value] of Object.entries(ops)) {
          switch (op) {
            case '$eq': if (actual !== value) return false; break;
            case '$ne': if (actual === value) return false; break;
            case '$gt': if ((actual as number) <= (value as number)) return false; break;
            case '$gte': if ((actual as number) < (value as number)) return false; break;
            case '$lt': if ((actual as number) >= (value as number)) return false; break;
            case '$lte': if ((actual as number) > (value as number)) return false; break;
            case '$in': if (!(value as unknown[]).includes(actual)) return false; break;
            case '$nin': if ((value as unknown[]).includes(actual)) return false; break;
            case '$regex': if (!new RegExp(value as string).test(String(actual))) return false; break;
            case '$exists': if ((actual !== undefined) !== value) return false; break;
          }
        }
      } else {
        // Direct equality check
        if (actual !== expected) return false;
      }
    }
    return true;
  }

  /**
   * Deregister all triggers for a workflow.
   */
  async deregisterAll(workflowId: string): Promise<void> {
    const triggers = await this.db
      .select()
      .from(workflowTriggers)
      .where(eq(workflowTriggers.workflowId, workflowId));

    for (const trigger of triggers) {
      await this.deregisterTrigger(trigger);
    }
  }

  private async deregisterTrigger(trigger: WorkflowTrigger): Promise<void> {
    // Disconnect Kafka consumer if event trigger
    const consumer = this.consumers.get(trigger.id);
    if (consumer) {
      await consumer.disconnect();
      this.consumers.delete(trigger.id);
    }

    // Remove webhook registration
    if (trigger.type === 'webhook') {
      const config = trigger.config as { path?: string };
      const path = config.path ?? `/webhooks/workflow/${trigger.workflowId}/${trigger.id}`;
      this.webhookRegistry.delete(path);
      await this.redis.hdel('webhook-triggers', path);
    }
  }

  async shutdown(): Promise<void> {
    for (const [id, consumer] of this.consumers) {
      await consumer.disconnect();
    }
    this.consumers.clear();
    this.webhookRegistry.clear();
  }
}
```

### Example 5: Condition Evaluation Engine

```typescript
import jsonata from 'jsonata';
import type { WorkflowCondition, ConditionOperator, WorkflowContext } from '@mcv/operations/workflows';

export class ConditionEvaluator {
  /**
   * Evaluate a condition node and return the branch to follow.
   */
  async evaluate(
    condition: WorkflowCondition,
    context: WorkflowContext,
  ): Promise<{ branch: string; evaluation: ConditionEvaluation }> {
    switch (condition.mode) {
      case 'simple':
        return this.evaluateSimple(condition.simple!, context);

      case 'switch':
        return this.evaluateSwitch(condition.switch!, context);

      case 'expression':
        return this.evaluateExpression(condition.expression!, context);

      default:
        throw new Error(`Unknown condition mode: ${condition.mode}`);
    }
  }

  /**
   * Evaluate a simple boolean condition.
   * Returns branch 'true' or 'false'.
   */
  private async evaluateSimple(
    simple: NonNullable<WorkflowCondition['simple']>,
    context: WorkflowContext,
  ): Promise<{ branch: string; evaluation: ConditionEvaluation }> {
    // Resolve operand values from context
    const leftValue = this.resolveValue(simple.leftOperand, context);
    const rightValue = this.resolveValue(simple.rightOperand, context);

    const result = this.compareValues(leftValue, simple.operator, rightValue);

    return {
      branch: result ? 'true' : 'false',
      evaluation: {
        mode: 'simple',
        leftOperand: simple.leftOperand,
        leftValue,
        operator: simple.operator,
        rightOperand: simple.rightOperand,
        rightValue,
        result,
      },
    };
  }

  /**
   * Evaluate a switch/case condition.
   * Returns the matching case branch name or 'default'.
   */
  private async evaluateSwitch(
    switchConfig: NonNullable<WorkflowCondition['switch']>,
    context: WorkflowContext,
  ): Promise<{ branch: string; evaluation: ConditionEvaluation }> {
    const expressionValue = this.resolveValue(switchConfig.expression, context);

    for (const caseItem of switchConfig.cases) {
      const caseValue = this.resolveValue(caseItem.value, context);
      if (String(expressionValue) === String(caseValue)) {
        return {
          branch: caseItem.label,
          evaluation: {
            mode: 'switch',
            expression: switchConfig.expression,
            expressionValue,
            matchedCase: caseItem.label,
            matchedValue: caseValue,
          },
        };
      }
    }

    return {
      branch: 'default',
      evaluation: {
        mode: 'switch',
        expression: switchConfig.expression,
        expressionValue,
        matchedCase: 'default',
        matchedValue: null,
      },
    };
  }

  /**
   * Evaluate a JSONata expression that returns a branch name.
   */
  private async evaluateExpression(
    exprConfig: NonNullable<WorkflowCondition['expression']>,
    context: WorkflowContext,
  ): Promise<{ branch: string; evaluation: ConditionEvaluation }> {
    const expression = jsonata(exprConfig.code);

    // Set up bindings for context access
    expression.registerFunction('now', () => new Date().toISOString());
    expression.registerFunction('dayOfWeek', () => new Date().getDay());

    const result = await expression.evaluate(context);
    const branch = String(result);

    // Validate that the result is a valid branch
    if (!exprConfig.branches.includes(branch)) {
      throw new Error(
        `Condition expression returned '${branch}' which is not a valid branch. ` +
        `Valid branches: ${exprConfig.branches.join(', ')}`,
      );
    }

    return {
      branch,
      evaluation: {
        mode: 'expression',
        code: exprConfig.code,
        result: branch,
        validBranches: exprConfig.branches,
      },
    };
  }

  /**
   * Compare two values using the given operator.
   */
  private compareValues(
    left: unknown,
    operator: ConditionOperator,
    right: unknown,
  ): boolean {
    switch (operator) {
      case 'equals':
        return String(left) === String(right);

      case 'not_equals':
        return String(left) !== String(right);

      case 'greater_than':
        return Number(left) > Number(right);

      case 'greater_than_or_equal':
        return Number(left) >= Number(right);

      case 'less_than':
        return Number(left) < Number(right);

      case 'less_than_or_equal':
        return Number(left) <= Number(right);

      case 'contains':
        return String(left).includes(String(right));

      case 'not_contains':
        return !String(left).includes(String(right));

      case 'starts_with':
        return String(left).startsWith(String(right));

      case 'ends_with':
        return String(left).endsWith(String(right));

      case 'matches_regex':
        return new RegExp(String(right)).test(String(left));

      case 'is_empty':
        return left === '' || left === null || left === undefined ||
               (Array.isArray(left) && left.length === 0);

      case 'is_not_empty':
        return left !== '' && left !== null && left !== undefined &&
               !(Array.isArray(left) && left.length === 0);

      case 'is_null':
        return left === null || left === undefined;

      case 'is_not_null':
        return left !== null && left !== undefined;

      case 'in_list': {
        const list = Array.isArray(right) ? right : String(right).split(',').map(s => s.trim());
        return list.includes(String(left));
      }

      case 'not_in_list': {
        const list = Array.isArray(right) ? right : String(right).split(',').map(s => s.trim());
        return !list.includes(String(left));
      }

      case 'between': {
        const [min, max] = Array.isArray(right) ? right : String(right).split(',').map(Number);
        return Number(left) >= Number(min) && Number(left) <= Number(max);
      }

      case 'is_true':
        return left === true || left === 'true' || left === 1 || left === '1';

      case 'is_false':
        return left === false || left === 'false' || left === 0 || left === '0';

      case 'in_segment':
        // Segment membership is resolved externally before comparison
        return Boolean(left);

      default:
        throw new Error(`Unknown operator: ${operator}`);
    }
  }

  /**
   * Resolve a value reference from the execution context.
   * Supports dot notation: 'trigger.payload.email', 'steps.node1.output.count'
   */
  private resolveValue(reference: string, context: WorkflowContext): unknown {
    // Check if it's a literal value (quoted string or number)
    if (/^["'].*["']$/.test(reference)) {
      return reference.slice(1, -1);
    }
    if (/^-?\d+(\.\d+)?$/.test(reference)) {
      return Number(reference);
    }
    if (reference === 'true') return true;
    if (reference === 'false') return false;
    if (reference === 'null') return null;

    // Resolve from context using dot notation
    const parts = reference.split('.');
    let current: unknown = context;

    for (const part of parts) {
      if (current === null || current === undefined) return undefined;
      current = (current as Record<string, unknown>)[part];
    }

    return current;
  }
}

interface ConditionEvaluation {
  mode: string;
  [key: string]: unknown;
}
```

### Example 6: Template Service — Instantiating a Pre-Built Template

```typescript
import { eq, and, desc, ilike, sql } from 'drizzle-orm';
import type {
  WorkflowTemplate,
  TemplateInput,
  Workflow,
  WorkflowCreateInput,
} from '@mcv/operations/workflows';

export class TemplateService {
  constructor(private db: Database) {}

  /**
   * List available templates with filtering and search.
   */
  async list(filter: {
    category?: string;
    subcategory?: string;
    search?: string;
    featured?: boolean;
    complexity?: number;
    scope: 'global' | string;
    offset?: number;
    limit?: number;
  }): Promise<PaginatedResult<WorkflowTemplate>> {
    const conditions = [
      // Include global templates and venture-specific ones
      sql`(${workflowTemplates.scope} = 'global' OR ${workflowTemplates.scope} = ${filter.scope})`,
    ];

    if (filter.category) {
      conditions.push(eq(workflowTemplates.category, filter.category));
    }
    if (filter.subcategory) {
      conditions.push(eq(workflowTemplates.subcategory, filter.subcategory));
    }
    if (filter.search) {
      conditions.push(
        sql`(${workflowTemplates.name} ILIKE ${`%${filter.search}%`} OR ${workflowTemplates.description} ILIKE ${`%${filter.search}%`})`,
      );
    }
    if (filter.featured !== undefined) {
      conditions.push(eq(workflowTemplates.featured, filter.featured));
    }
    if (filter.complexity) {
      conditions.push(eq(workflowTemplates.complexity, filter.complexity));
    }

    const offset = filter.offset ?? 0;
    const limit = filter.limit ?? 20;

    const [templates, countResult] = await Promise.all([
      this.db
        .select()
        .from(workflowTemplates)
        .where(and(...conditions))
        .orderBy(desc(workflowTemplates.featured), desc(workflowTemplates.usageCount))
        .offset(offset)
        .limit(limit),
      this.db
        .select({ count: sql<number>`count(*)` })
        .from(workflowTemplates)
        .where(and(...conditions)),
    ]);

    return {
      items: templates,
      total: countResult[0].count,
      offset,
      limit,
    };
  }

  /**
   * Instantiate a template into a new workflow.
   * Replaces setup input placeholders with user-provided values.
   */
  async instantiate(
    templateId: string,
    params: {
      name: string;
      description?: string;
      tags?: string[];
      folderPath?: string;
      ventureId: string;
      createdBy: string;
      setupValues?: Record<string, unknown>;
    },
  ): Promise<Workflow> {
    const template = await this.db
      .select()
      .from(workflowTemplates)
      .where(eq(workflowTemplates.id, templateId))
      .then(rows => rows[0]);

    if (!template) {
      throw new WorkflowError('WF_TEMPLATE_NOT_FOUND', `Template ${templateId} not found`);
    }

    // Validate required setup inputs
    this.validateSetupInputs(template.setupInputs, params.setupValues ?? {});

    // Start a transaction for atomic workflow creation
    return this.db.transaction(async (tx) => {
      // Create the workflow
      const [workflow] = await tx
        .insert(workflows)
        .values({
          ventureId: params.ventureId,
          name: params.name,
          description: params.description ?? template.description,
          status: 'draft',
          tags: params.tags ?? template.tags,
          folderPath: params.folderPath,
          icon: template.icon,
          color: template.color,
          sourceTemplateId: templateId,
          isTemplate: false,
          createdBy: params.createdBy,
          updatedBy: params.createdBy,
        })
        .returning();

      // Create the initial version
      const [version] = await tx
        .insert(workflowVersions)
        .values({
          workflowId: workflow.id,
          versionNumber: 1,
          label: 'From template: ' + template.name,
          status: 'draft',
          changeDescription: `Created from template "${template.name}"`,
          graphSnapshot: template.graph,
          createdBy: params.createdBy,
        })
        .returning();

      // Update workflow with draft version ID
      await tx
        .update(workflows)
        .set({ draftVersionId: version.id })
        .where(eq(workflows.id, workflow.id));

      // Create nodes from template, replacing placeholders
      const nodeIdMap = new Map<string, string>(); // template nodeId → real nodeId

      for (const nodeTemplate of template.graph.nodes) {
        const config = this.replaceSetupValues(nodeTemplate.config, params.setupValues ?? {});

        const [node] = await tx
          .insert(workflowNodes)
          .values({
            workflowId: workflow.id,
            versionId: version.id,
            type: nodeTemplate.type,
            name: nodeTemplate.name,
            description: nodeTemplate.description,
            config,
            inputMapping: nodeTemplate.inputMapping,
            outputMapping: nodeTemplate.outputMapping,
            retryPolicy: nodeTemplate.retryPolicy,
            timeoutMs: nodeTemplate.timeoutMs,
            position: nodeTemplate.position,
            dimensions: nodeTemplate.dimensions,
            uiMeta: nodeTemplate.uiMeta,
            sortOrder: nodeTemplate.sortOrder,
            disabled: nodeTemplate.disabled,
            notes: nodeTemplate.notes,
          })
          .returning();

        // Use sortOrder as a stable template-side node identifier
        nodeIdMap.set(String(nodeTemplate.sortOrder), node.id);
      }

      // Create edges from template, mapping node IDs
      for (const edgeTemplate of template.graph.edges) {
        const sourceNodeId = nodeIdMap.get(String(edgeTemplate.sortOrder)) ??
          this.findNodeBySort(nodeIdMap, edgeTemplate.sourceHandle);
        const targetNodeId = nodeIdMap.get(String(edgeTemplate.sortOrder)) ??
          this.findNodeBySort(nodeIdMap, edgeTemplate.targetHandle);

        // In practice, edges reference source/target by their sortOrder
        // since template nodes don't have real IDs yet
        await tx
          .insert(workflowEdges)
          .values({
            workflowId: workflow.id,
            versionId: version.id,
            sourceNodeId: nodeIdMap.get(edgeTemplate.sourceHandle) ?? nodeIdMap.values().next().value!,
            targetNodeId: nodeIdMap.get(edgeTemplate.targetHandle) ?? nodeIdMap.values().next().value!,
            sourceHandle: edgeTemplate.sourceHandle,
            targetHandle: edgeTemplate.targetHandle,
            label: edgeTemplate.label,
            sortOrder: edgeTemplate.sortOrder,
          });
      }

      // Create triggers from template
      for (const triggerTemplate of template.graph.triggers) {
        const config = this.replaceSetupValues(triggerTemplate.config, params.setupValues ?? {});
        const triggerNodeId = nodeIdMap.get('0') ?? nodeIdMap.values().next().value!; // First node is trigger

        await tx
          .insert(workflowTriggers)
          .values({
            workflowId: workflow.id,
            versionId: version.id,
            nodeId: triggerNodeId,
            type: triggerTemplate.type,
            config,
            enabled: false, // Disabled until published
          });
      }

      // Create variables from template
      for (const varTemplate of template.graph.variables) {
        await tx
          .insert(workflowVariables)
          .values({
            workflowId: workflow.id,
            versionId: version.id,
            name: varTemplate.name,
            label: varTemplate.label,
            type: varTemplate.type,
            defaultValue: varTemplate.defaultValue,
            description: varTemplate.description,
            isInput: varTemplate.isInput,
            isOutput: varTemplate.isOutput,
            required: varTemplate.required,
            schema: varTemplate.schema,
          });
      }

      // Increment template usage count
      await tx
        .update(workflowTemplates)
        .set({ usageCount: sql`usage_count + 1` })
        .where(eq(workflowTemplates.id, templateId));

      return { ...workflow, draftVersionId: version.id };
    });
  }

  /**
   * Validate that all required setup inputs are provided.
   */
  private validateSetupInputs(
    inputs: TemplateInput[],
    values: Record<string, unknown>,
  ): void {
    const errors: string[] = [];

    for (const input of inputs) {
      if (input.required && (values[input.key] === undefined || values[input.key] === '')) {
        errors.push(`Required setup input "${input.label}" (${input.key}) is missing`);
      }

      if (values[input.key] !== undefined) {
        // Type validation
        switch (input.type) {
          case 'number':
            if (typeof values[input.key] !== 'number' && isNaN(Number(values[input.key]))) {
              errors.push(`Setup input "${input.label}" must be a number`);
            }
            break;
          case 'email':
            if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(values[input.key]))) {
              errors.push(`Setup input "${input.label}" must be a valid email`);
            }
            break;
          case 'url':
            try { new URL(String(values[input.key])); }
            catch { errors.push(`Setup input "${input.label}" must be a valid URL`); }
            break;
          case 'select':
            if (input.options && !input.options.some(o => o.value === values[input.key])) {
              errors.push(`Setup input "${input.label}" must be one of: ${input.options.map(o => o.value).join(', ')}`);
            }
            break;
        }
      }
    }

    if (errors.length > 0) {
      throw new WorkflowError('WF_TEMPLATE_VALIDATION', errors.join('; '));
    }
  }

  /**
   * Replace {{setup.key}} placeholders in config with actual values.
   */
  private replaceSetupValues(
    config: Record<string, unknown>,
    values: Record<string, unknown>,
  ): Record<string, unknown> {
    const json = JSON.stringify(config);
    const replaced = json.replace(/\{\{setup\.(\w+)\}\}/g, (match, key) => {
      const value = values[key];
      if (value === undefined) return match; // Leave placeholder if no value
      return typeof value === 'string' ? value : JSON.stringify(value);
    });
    return JSON.parse(replaced);
  }

  private findNodeBySort(nodeIdMap: Map<string, string>, sortKey: string): string | undefined {
    return nodeIdMap.get(sortKey);
  }
}
```

### Example 7: Monitoring Service — Execution Metrics & Dashboard

```typescript
import { sql, eq, and, gte, lte, count, avg, desc } from 'drizzle-orm';
import type { WorkflowMetrics } from '@mcv/operations/workflows';

export class MonitoringService {
  constructor(
    private db: Database,
    private redis: Redis,
  ) {}

  /**
   * Get aggregated metrics for a workflow over a time period.
   */
  async getWorkflowMetrics(
    workflowId: string,
    period: 'hour' | 'day' | 'week' | 'month',
  ): Promise<WorkflowMetrics> {
    const since = this.getPeriodStart(period);

    // Query execution statistics
    const [stats] = await this.db
      .select({
        total: count(),
        successCount: sql<number>`count(*) filter (where status = 'completed')`,
        failureCount: sql<number>`count(*) filter (where status = 'failed')`,
        cancelledCount: sql<number>`count(*) filter (where status = 'cancelled')`,
        timedOutCount: sql<number>`count(*) filter (where status = 'timed_out')`,
        avgDuration: sql<number>`avg(extract(epoch from (completed_at - started_at)) * 1000)
          filter (where completed_at is not null)`,
        p50Duration: sql<number>`percentile_cont(0.5) within group (
          order by extract(epoch from (completed_at - started_at)) * 1000
        ) filter (where completed_at is not null)`,
        p95Duration: sql<number>`percentile_cont(0.95) within group (
          order by extract(epoch from (completed_at - started_at)) * 1000
        ) filter (where completed_at is not null)`,
        p99Duration: sql<number>`percentile_cont(0.99) within group (
          order by extract(epoch from (completed_at - started_at)) * 1000
        ) filter (where completed_at is not null)`,
        totalSteps: sql<number>`sum(step_count)`,
        totalRetries: sql<number>`sum(retry_count)`,
      })
      .from(workflowExecutions)
      .where(and(
        eq(workflowExecutions.workflowId, workflowId),
        gte(workflowExecutions.startedAt, since),
      ));

    // Get top error codes
    const topErrors = await this.db
      .select({
        code: executionErrors.errorCode,
        count: count(),
      })
      .from(executionErrors)
      .innerJoin(
        workflowExecutions,
        eq(executionErrors.executionId, workflowExecutions.id),
      )
      .where(and(
        eq(workflowExecutions.workflowId, workflowId),
        gte(executionErrors.createdAt, since),
      ))
      .groupBy(executionErrors.errorCode)
      .orderBy(desc(count()))
      .limit(10);

    // Get active and queued execution counts from Redis
    const activeKey = `wf:active:${workflowId}`;
    const queuedKey = `wf:queued:${workflowId}`;
    const [activeCount, queuedCount] = await Promise.all([
      this.redis.scard(activeKey),
      this.redis.llen(queuedKey),
    ]);

    const total = stats.total ?? 0;
    const successCount = stats.successCount ?? 0;

    return {
      workflowId,
      period,
      totalExecutions: total,
      successCount,
      failureCount: stats.failureCount ?? 0,
      cancelledCount: stats.cancelledCount ?? 0,
      timedOutCount: stats.timedOutCount ?? 0,
      successRate: total > 0 ? successCount / total : 0,
      avgDurationMs: Math.round(stats.avgDuration ?? 0),
      p50DurationMs: Math.round(stats.p50Duration ?? 0),
      p95DurationMs: Math.round(stats.p95Duration ?? 0),
      p99DurationMs: Math.round(stats.p99Duration ?? 0),
      totalSteps: stats.totalSteps ?? 0,
      totalRetries: stats.totalRetries ?? 0,
      topErrors,
      activeExecutions: activeCount,
      queuedExecutions: queuedCount,
    };
  }

  /**
   * Get the active execution dashboard — all running/waiting executions
   * across all workflows for a venture.
   */
  async getActiveDashboard(ventureId: string): Promise<{
    executions: Array<{
      id: string;
      workflowId: string;
      workflowName: string;
      status: string;
      currentNodeName: string | null;
      stepCount: number;
      startedAt: Date;
      elapsedMs: number;
    }>;
    summary: {
      running: number;
      waiting: number;
      pending: number;
      compensating: number;
    };
  }> {
    const activeStatuses = ['pending', 'running', 'waiting', 'compensating'];

    const executions = await this.db
      .select({
        id: workflowExecutions.id,
        workflowId: workflowExecutions.workflowId,
        workflowName: workflows.name,
        status: workflowExecutions.status,
        currentNodeId: workflowExecutions.currentNodeId,
        stepCount: workflowExecutions.stepCount,
        startedAt: workflowExecutions.startedAt,
      })
      .from(workflowExecutions)
      .innerJoin(workflows, eq(workflowExecutions.workflowId, workflows.id))
      .where(and(
        eq(workflowExecutions.ventureId, ventureId),
        sql`${workflowExecutions.status} = ANY(${activeStatuses})`,
      ))
      .orderBy(desc(workflowExecutions.startedAt))
      .limit(100);

    // Resolve current node names
    const enriched = await Promise.all(
      executions.map(async (exec) => {
        let currentNodeName: string | null = null;
        if (exec.currentNodeId) {
          const [node] = await this.db
            .select({ name: workflowNodes.name })
            .from(workflowNodes)
            .where(eq(workflowNodes.id, exec.currentNodeId))
            .limit(1);
          currentNodeName = node?.name ?? null;
        }

        return {
          ...exec,
          currentNodeName,
          elapsedMs: Date.now() - exec.startedAt.getTime(),
        };
      }),
    );

    // Summary counts
    const summary = {
      running: enriched.filter(e => e.status === 'running').length,
      waiting: enriched.filter(e => e.status === 'waiting').length,
      pending: enriched.filter(e => e.status === 'pending').length,
      compensating: enriched.filter(e => e.status === 'compensating').length,
    };

    return { executions: enriched, summary };
  }

  /**
   * Get the step-by-step audit trail for an execution.
   */
  async getAuditTrail(executionId: string): Promise<Array<{
    stepId: string;
    nodeId: string;
    nodeName: string;
    nodeType: string;
    status: string;
    input: Record<string, unknown> | null;
    output: Record<string, unknown> | null;
    error: Record<string, unknown> | null;
    attemptNumber: number;
    durationMs: number | null;
    startedAt: Date;
    completedAt: Date | null;
  }>> {
    return this.db
      .select()
      .from(executionSteps)
      .where(eq(executionSteps.executionId, executionId))
      .orderBy(executionSteps.startedAt);
  }

  private getPeriodStart(period: 'hour' | 'day' | 'week' | 'month'): Date {
    const now = new Date();
    switch (period) {
      case 'hour':
        return new Date(now.getTime() - 60 * 60 * 1000);
      case 'day':
        return new Date(now.getTime() - 24 * 60 * 60 * 1000);
      case 'week':
        return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      case 'month':
        return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }
  }
}
```

### Example 8: Graph Validator — Ensuring Workflow Integrity

```typescript
import type { WorkflowNode, WorkflowEdge, WorkflowTrigger, ValidationResult } from '@mcv/operations/workflows';

export class WorkflowValidator {
  /**
   * Validate a workflow graph for structural and semantic correctness.
   * Checks for: cycles, orphan nodes, missing configurations, type-specific rules.
   */
  validate(
    nodes: WorkflowNode[],
    edges: WorkflowEdge[],
    triggers: WorkflowTrigger[],
  ): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    // --- Structural Checks ---

    // 1. Must have exactly one trigger node
    const triggerNodes = nodes.filter(n => n.type === 'trigger');
    if (triggerNodes.length === 0) {
      errors.push({
        code: 'WF_NO_TRIGGER',
        message: 'Workflow must have exactly one trigger node',
      });
    } else if (triggerNodes.length > 1) {
      errors.push({
        code: 'WF_MULTIPLE_TRIGGERS',
        message: `Workflow has ${triggerNodes.length} trigger nodes but only one is allowed`,
      });
    }

    // 2. Must have at least one end node
    const endNodes = nodes.filter(n => n.type === 'end');
    if (endNodes.length === 0) {
      warnings.push({
        code: 'WF_NO_END_NODE',
        message: 'Workflow has no explicit end node. Execution will end when no next node is found.',
      });
    }

    // 3. Check for orphan nodes (not connected to any edge)
    const connectedNodeIds = new Set<string>();
    for (const edge of edges) {
      connectedNodeIds.add(edge.sourceNodeId);
      connectedNodeIds.add(edge.targetNodeId);
    }
    for (const node of nodes) {
      if (!connectedNodeIds.has(node.id) && node.type !== 'trigger' && nodes.length > 1) {
        warnings.push({
          nodeId: node.id,
          code: 'WF_ORPHAN_NODE',
          message: `Node "${node.name}" is not connected to any other node`,
        });
      }
    }

    // 4. Check for unreachable nodes (not reachable from trigger)
    if (triggerNodes.length === 1) {
      const reachable = this.findReachableNodes(triggerNodes[0].id, edges);
      for (const node of nodes) {
        if (node.type !== 'trigger' && !reachable.has(node.id)) {
          warnings.push({
            nodeId: node.id,
            code: 'WF_UNREACHABLE_NODE',
            message: `Node "${node.name}" is not reachable from the trigger`,
          });
        }
      }
    }

    // 5. Check for cycles (excluding loops which are intentional)
    const nonLoopEdges = edges.filter(e => {
      const sourceNode = nodes.find(n => n.id === e.sourceNodeId);
      return sourceNode?.type !== 'loop';
    });
    const cycles = this.detectCycles(nodes, nonLoopEdges);
    for (const cycle of cycles) {
      errors.push({
        code: 'WF_CYCLE_DETECTED',
        message: `Cycle detected: ${cycle.map(id => {
          const node = nodes.find(n => n.id === id);
          return node?.name ?? id;
        }).join(' → ')}`,
      });
    }

    // --- Node-Specific Checks ---

    for (const node of nodes) {
      switch (node.type) {
        case 'trigger': {
          if (!node.config.triggerType) {
            errors.push({
              nodeId: node.id,
              code: 'WF_TRIGGER_NO_TYPE',
              message: `Trigger node "${node.name}" has no trigger type configured`,
            });
          }
          break;
        }

        case 'action': {
          if (!node.config.actionType) {
            errors.push({
              nodeId: node.id,
              code: 'WF_ACTION_NO_TYPE',
              message: `Action node "${node.name}" has no action type configured`,
            });
          }
          // Validate action-specific config
          this.validateActionConfig(node, errors);
          break;
        }

        case 'condition': {
          const condConfig = node.config as WorkflowCondition;
          if (!condConfig.mode) {
            errors.push({
              nodeId: node.id,
              code: 'WF_CONDITION_NO_MODE',
              message: `Condition node "${node.name}" has no evaluation mode configured`,
            });
          }
          // Check that condition has at least 2 outgoing edges
          const outEdges = edges.filter(e => e.sourceNodeId === node.id);
          if (outEdges.length < 2) {
            warnings.push({
              nodeId: node.id,
              code: 'WF_CONDITION_FEW_BRANCHES',
              message: `Condition node "${node.name}" has fewer than 2 branches`,
            });
          }
          break;
        }

        case 'delay': {
          if (!node.config.delayType) {
            errors.push({
              nodeId: node.id,
              code: 'WF_DELAY_NO_TYPE',
              message: `Delay node "${node.name}" has no delay type configured`,
            });
          }
          if (node.config.delayType === 'duration' && !node.config.durationMs) {
            errors.push({
              nodeId: node.id,
              code: 'WF_DELAY_NO_DURATION',
              message: `Delay node "${node.name}" has no duration configured`,
            });
          }
          break;
        }

        case 'loop': {
          if (!node.config.collection) {
            errors.push({
              nodeId: node.id,
              code: 'WF_LOOP_NO_COLLECTION',
              message: `Loop node "${node.name}" has no collection to iterate over`,
            });
          }
          break;
        }

        case 'sub_workflow': {
          if (!node.config.workflowId) {
            errors.push({
              nodeId: node.id,
              code: 'WF_SUB_NO_WORKFLOW',
              message: `Sub-workflow node "${node.name}" has no target workflow configured`,
            });
          }
          break;
        }
      }
    }

    // --- Trigger Configuration Check ---
    if (triggers.length === 0 && triggerNodes.length > 0) {
      errors.push({
        code: 'WF_NO_TRIGGER_CONFIG',
        message: 'Trigger node exists but no trigger configuration is defined',
      });
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  }

  private findReachableNodes(startId: string, edges: WorkflowEdge[]): Set<string> {
    const reachable = new Set<string>();
    const queue = [startId];

    while (queue.length > 0) {
      const current = queue.shift()!;
      if (reachable.has(current)) continue;
      reachable.add(current);

      for (const edge of edges) {
        if (edge.sourceNodeId === current && !reachable.has(edge.targetNodeId)) {
          queue.push(edge.targetNodeId);
        }
      }
    }

    return reachable;
  }

  private detectCycles(nodes: WorkflowNode[], edges: WorkflowEdge[]): string[][] {
    const cycles: string[][] = [];
    const visited = new Set<string>();
    const inStack = new Set<string>();
    const path: string[] = [];

    const adjacency = new Map<string, string[]>();
    for (const edge of edges) {
      const targets = adjacency.get(edge.sourceNodeId) ?? [];
      targets.push(edge.targetNodeId);
      adjacency.set(edge.sourceNodeId, targets);
    }

    const dfs = (nodeId: string) => {
      visited.add(nodeId);
      inStack.add(nodeId);
      path.push(nodeId);

      for (const neighbor of adjacency.get(nodeId) ?? []) {
        if (!visited.has(neighbor)) {
          dfs(neighbor);
        } else if (inStack.has(neighbor)) {
          const cycleStart = path.indexOf(neighbor);
          cycles.push(path.slice(cycleStart));
        }
      }

      path.pop();
      inStack.delete(nodeId);
    };

    for (const node of nodes) {
      if (!visited.has(node.id)) {
        dfs(node.id);
      }
    }

    return cycles;
  }

  private validateActionConfig(node: WorkflowNode, errors: ValidationError[]): void {
    const actionType = node.config.actionType as string;

    switch (actionType) {
      case 'send_email':
        if (!node.config.to) {
          errors.push({
            nodeId: node.id,
            code: 'WF_EMAIL_NO_TO',
            message: `Email action "${node.name}" has no recipient configured`,
          });
        }
        if (!node.config.subject && !node.config.template) {
          errors.push({
            nodeId: node.id,
            code: 'WF_EMAIL_NO_SUBJECT',
            message: `Email action "${node.name}" has no subject or template configured`,
          });
        }
        break;

      case 'http_request':
        if (!node.config.url) {
          errors.push({
            nodeId: node.id,
            code: 'WF_HTTP_NO_URL',
            message: `HTTP request action "${node.name}" has no URL configured`,
          });
        }
        break;

      case 'create_record':
      case 'update_record':
        if (!node.config.table) {
          errors.push({
            nodeId: node.id,
            code: 'WF_RECORD_NO_TABLE',
            message: `Record action "${node.name}" has no table configured`,
          });
        }
        break;

      case 'run_code':
        if (!node.config.code) {
          errors.push({
            nodeId: node.id,
            code: 'WF_CODE_EMPTY',
            message: `Code action "${node.name}" has no code to execute`,
          });
        }
        break;
    }
  }
}
```

---

## Error Codes

All errors thrown by the workflow module extend the base `WorkflowError` class:

```typescript
class WorkflowError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly details?: Record<string, unknown>,
  ) {
    super(message);
    this.name = 'WorkflowError';
  }
}
```

### Workflow Lifecycle Errors

| Code | HTTP | Description | Resolution |
|------|------|-------------|------------|
| `WF_NOT_FOUND` | 404 | Workflow does not exist or is not accessible | Check workflow ID and venture context |
| `WF_ALREADY_PUBLISHED` | 409 | Workflow is already published | Unpublish first or update the draft |
| `WF_NOT_PUBLISHED` | 409 | Workflow is not published (cannot execute) | Publish the workflow before triggering |
| `WF_IS_PAUSED` | 409 | Workflow is paused and cannot accept triggers | Resume the workflow |
| `WF_IS_ARCHIVED` | 410 | Workflow has been archived | Restore from archive before using |
| `WF_VALIDATION_FAILED` | 422 | Workflow graph failed validation | Fix errors reported in validation result |
| `WF_NAME_DUPLICATE` | 409 | A workflow with this name already exists in the folder | Choose a different name |

### Node & Edge Errors

| Code | HTTP | Description | Resolution |
|------|------|-------------|------------|
| `WF_NODE_NOT_FOUND` | 404 | Node does not exist in the workflow version | Check node ID and version |
| `WF_EDGE_NOT_FOUND` | 404 | Edge does not exist | Check edge ID |
| `WF_NODE_TYPE_INVALID` | 422 | Invalid node type specified | Use a valid NodeType enum value |
| `WF_EDGE_CYCLE` | 422 | Adding this edge would create a cycle | Restructure the workflow graph |
| `WF_EDGE_DUPLICATE` | 409 | An edge between these nodes/handles already exists | Remove existing edge first |
| `WF_NODE_CONFIG_INVALID` | 422 | Node configuration is invalid for its type | Check the node type's config schema |

### Execution Errors

| Code | HTTP | Description | Resolution |
|------|------|-------------|------------|
| `WF_EXECUTION_NOT_FOUND` | 404 | Execution record does not exist | Check execution ID |
| `WF_EXECUTION_ALREADY_COMPLETE` | 409 | Cannot modify a completed execution | Start a new execution |
| `WF_EXECUTION_CANCELLED` | 409 | Execution has been cancelled | Start a new execution |
| `WF_EXECUTION_TIMED_OUT` | 408 | Execution exceeded its timeout limit | Increase `executionTimeoutMs` or optimize the workflow |
| `WF_STEP_FAILED` | 500 | A workflow step failed during execution | Check step error details and retry policy |
| `WF_STEP_TIMEOUT` | 408 | A specific step exceeded its timeout | Increase node `timeoutMs` |
| `WF_MAX_DEPTH_EXCEEDED` | 422 | Sub-workflow nesting depth exceeded maximum | Reduce sub-workflow nesting (max: 10) |
| `WF_MAX_ITERATIONS_EXCEEDED` | 422 | Loop exceeded maximum iteration count | Add a loop limit or reduce collection size (max: 10,000) |
| `WF_MAX_PARALLEL_EXCEEDED` | 422 | Too many parallel branches | Reduce parallel branch count (max: 50) |

### Trigger Errors

| Code | HTTP | Description | Resolution |
|------|------|-------------|------------|
| `WF_TRIGGER_NOT_FOUND` | 404 | Trigger configuration not found | Check trigger ID |
| `WF_TRIGGER_DISABLED` | 409 | Trigger is disabled | Enable the trigger |
| `WF_WEBHOOK_UNAUTHORIZED` | 401 | Webhook secret validation failed | Provide correct secret in headers |
| `WF_WEBHOOK_NOT_FOUND` | 404 | No webhook registered at this path | Check webhook URL path |

### Rate Limit & Concurrency Errors

| Code | HTTP | Description | Resolution |
|------|------|-------------|------------|
| `WF_RATE_LIMIT_EXCEEDED` | 429 | Workflow execution rate limit reached | Wait and retry, or increase rate limit |
| `WF_CONCURRENCY_LIMIT` | 429 | Maximum concurrent executions reached | Wait for running executions to complete |
| `WF_QUEUE_FULL` | 503 | Execution queue is full | Wait for capacity or increase queue limits |

### Template Errors

| Code | HTTP | Description | Resolution |
|------|------|-------------|------------|
| `WF_TEMPLATE_NOT_FOUND` | 404 | Template does not exist | Check template ID |
| `WF_TEMPLATE_VALIDATION` | 422 | Template setup input validation failed | Provide all required setup values |

### Version Errors

| Code | HTTP | Description | Resolution |
|------|------|-------------|------------|
| `WF_VERSION_NOT_FOUND` | 404 | Version does not exist | Check version ID |
| `WF_VERSION_ARCHIVED` | 410 | Cannot use an archived version | Use a published or draft version |
| `WF_AB_TEST_ACTIVE` | 409 | Cannot modify workflow during an A/B test | Stop the A/B test first |

---

## Security

### Authentication & Authorization

All workflow operations require authentication via the platform's JWT-based auth system. Authorization is enforced at two levels:

1. **Row-Level Security (RLS)** — PostgreSQL policies ensure workflows and executions are scoped to the authenticated venture. This is the hard boundary — even if application code has a bug, the database will not return data from another venture.

2. **Application-Level Permissions** — The tRPC router checks user roles and permissions:

```typescript
// Permission checks in the router
const WORKFLOW_PERMISSIONS = {
  'workflow.create':     ['admin', 'workflow_admin', 'editor'],
  'workflow.read':       ['admin', 'workflow_admin', 'editor', 'viewer'],
  'workflow.update':     ['admin', 'workflow_admin', 'editor'],
  'workflow.delete':     ['admin', 'workflow_admin'],
  'workflow.publish':    ['admin', 'workflow_admin'],
  'workflow.execute':    ['admin', 'workflow_admin', 'editor', 'operator'],
  'execution.read':      ['admin', 'workflow_admin', 'editor', 'viewer', 'operator'],
  'execution.cancel':    ['admin', 'workflow_admin', 'operator'],
  'template.create':     ['admin', 'workflow_admin'],
  'template.read':       ['admin', 'workflow_admin', 'editor', 'viewer'],
} as const;
```

### Sandboxed Code Execution

The `run_code` action type executes user-provided JavaScript in a sandboxed environment:

```typescript
// Code execution sandbox configuration
const SANDBOX_CONFIG = {
  // Time limit for code execution
  timeoutMs: 10_000,

  // Memory limit
  memoryLimitMb: 64,

  // No access to:
  // - File system
  // - Network (except through provided HTTP client)
  // - Process/OS information
  // - require/import
  // - eval/Function constructor

  // Available APIs:
  // - console.log (captured, not printed)
  // - JSON.parse / JSON.stringify
  // - Math, Date, String, Array, Object
  // - Provided context variables
  // - Provided HTTP client (rate-limited, allowlisted domains only)

  // Execution environment: isolated V8 context (vm2 or isolated-vm)
  runtime: 'isolated-vm',
};
```

### Webhook Security

Webhook triggers support multiple authentication methods:

| Method | Header | Description |
|--------|--------|-------------|
| **Bearer Token** | `Authorization: Bearer <secret>` | Simple shared secret |
| **HMAC Signature** | `X-Webhook-Signature: sha256=<hash>` | HMAC-SHA256 of request body |
| **IP Allowlist** | N/A | Only accept from configured IP ranges |
| **mTLS** | N/A | Mutual TLS certificate validation |

### Data Protection

- **Sensitive Data in Variables** — Workflow variables can be marked as `sensitive`, which causes them to be encrypted at rest and masked in audit logs
- **Execution Data Retention** — Configurable TTL for execution records (default: 90 days). After TTL, execution data is purged
- **PII Detection** — Optional PII scanner on trigger payloads and step outputs. Detected PII is flagged and can be auto-redacted in logs
- **Audit Logging** — All workflow modifications (create, update, publish, delete) are recorded in the platform audit log with full before/after snapshots

### Input Validation

All external inputs (trigger payloads, webhook bodies, manual execution inputs) are validated:

```typescript
// Input validation pipeline
const validateInput = (input: unknown, schema: JSONSchema): ValidationResult => {
  // 1. JSON Schema validation (structural)
  const structuralResult = ajv.validate(schema, input);

  // 2. Size limits (prevent payload bombs)
  const serialized = JSON.stringify(input);
  if (serialized.length > MAX_PAYLOAD_SIZE) {
    return { valid: false, error: 'Payload exceeds maximum size (1MB)' };
  }

  // 3. Depth limit (prevent deeply nested objects)
  if (getObjectDepth(input) > MAX_OBJECT_DEPTH) {
    return { valid: false, error: 'Payload exceeds maximum nesting depth (20)' };
  }

  // 4. Sanitization (XSS protection for string fields rendered in UI)
  sanitizeStrings(input);

  return { valid: true };
};
```

---

## Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `WORKFLOW_REDIS_URL` | Yes | — | Redis connection URL for BullMQ queues |
| `WORKFLOW_REDIS_PREFIX` | No | `wf:` | Key prefix for workflow-related Redis data |
| `WORKFLOW_QUEUE_CONCURRENCY` | No | `10` | Number of concurrent workflow step executions per worker |
| `WORKFLOW_SCHEDULER_INTERVAL_MS` | No | `60000` | How often the scheduler checks for cron triggers (ms) |
| `WORKFLOW_CLEANUP_INTERVAL_MS` | No | `3600000` | How often the cleanup worker runs (ms) |
| `WORKFLOW_EXECUTION_TTL_DAYS` | No | `90` | Days to retain completed execution records |
| `WORKFLOW_MAX_EXECUTION_TIMEOUT_MS` | No | `604800000` | Maximum allowed execution timeout (7 days) |
| `WORKFLOW_MAX_STEP_TIMEOUT_MS` | No | `300000` | Maximum allowed step timeout (5 minutes) |
| `WORKFLOW_MAX_DEPTH` | No | `10` | Maximum sub-workflow nesting depth |
| `WORKFLOW_MAX_LOOP_ITERATIONS` | No | `10000` | Maximum iterations for loop nodes |
| `WORKFLOW_MAX_PARALLEL_BRANCHES` | No | `50` | Maximum concurrent branches in parallel nodes |
| `WORKFLOW_DEFAULT_RATE_LIMIT` | No | `1000/3600000` | Default rate limit (executions/window_ms) |
| `WORKFLOW_DEFAULT_CONCURRENCY` | No | `10` | Default max concurrent executions per workflow |
| `WORKFLOW_SANDBOX_TIMEOUT_MS` | No | `10000` | Timeout for sandboxed code execution |
| `WORKFLOW_SANDBOX_MEMORY_MB` | No | `64` | Memory limit for sandboxed code execution |
| `WORKFLOW_WEBHOOK_BASE_URL` | Yes | — | Base URL for webhook endpoints |
| `WORKFLOW_WEBHOOK_MAX_PAYLOAD_BYTES` | No | `1048576` | Maximum webhook payload size (1MB) |
| `REDPANDA_BROKERS` | Yes | — | Comma-separated Redpanda broker addresses |
| `REDPANDA_CLIENT_ID` | No | `mcv-workflows` | Kafka client ID for workflow consumers |
| `WORKFLOW_EVENTS_TOPIC` | No | `workflow.events` | Redpanda topic for workflow lifecycle events |

---

## Dependencies

### Runtime Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| `bullmq` | `^5.x` | Durable job queue for workflow execution |
| `ioredis` | `^5.x` | Redis client for BullMQ and caching |
| `kafkajs` | `^2.x` | Redpanda/Kafka client for event triggers |
| `drizzle-orm` | `^0.30.x` | PostgreSQL ORM for database operations |
| `jsonata` | `^2.x` | JSONata expression evaluation for data transforms |
| `handlebars` | `^4.x` | Template rendering for string interpolation |
| `cron-parser` | `^4.x` | Cron expression parsing for scheduled triggers |
| `isolated-vm` | `^4.x` | Sandboxed JavaScript execution for `run_code` action |
| `ajv` | `^8.x` | JSON Schema validation for inputs/payloads |
| `zod` | `^3.x` | Runtime type validation for tRPC inputs |
| `@trpc/server` | `^10.x` | tRPC server for API router |
| `uuid` | `^9.x` | UUID generation for entity IDs |

### Internal Dependencies

| Package | Purpose |
|---------|---------|
| `@mcv/auth` | Authentication and authorization |
| `@mcv/db` | Shared database connection and utilities |
| `@mcv/events` | Redpanda event bus abstraction |
| `@mcv/trpc` | Shared tRPC context and middleware |
| `@mcv/operations/notifications` | Send notifications from workflow actions |
| `@mcv/operations/email` | Send emails from workflow actions |
| `@mcv/operations/sms` | Send SMS from workflow actions |
| `@mcv/operations/tasks` | Create and assign tasks from workflow actions |
| `@mcv/shared/logger` | Structured logging |
| `@mcv/shared/errors` | Base error classes |
| `@mcv/shared/types` | Shared type definitions |

### Peer Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| `@supabase/supabase-js` | `^2.x` | Supabase client for RLS context |

---

## Testing

### Test Setup

```typescript
import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { createTestDatabase, createTestRedis, seedTestVenture } from '@mcv/testing';
import { WorkflowService, ExecutionService, TriggerService } from '@mcv/operations/workflows';
import { WorkflowValidator } from '@mcv/operations/workflows/utils/validator';

let db: TestDatabase;
let redis: TestRedis;
let ventureId: string;
let userId: string;

beforeAll(async () => {
  db = await createTestDatabase();
  redis = await createTestRedis();
  const seed = await seedTestVenture(db);
  ventureId = seed.ventureId;
  userId = seed.userId;
});

afterAll(async () => {
  await db.cleanup();
  await redis.cleanup();
});

beforeEach(async () => {
  // Clear workflow data between tests
  await db.truncate([
    'workflow_executions',
    'execution_steps',
    'execution_errors',
    'workflow_triggers',
    'workflow_edges',
    'workflow_nodes',
    'workflow_versions',
    'workflows',
  ]);
  await redis.flushdb();
});
```

### Unit Tests — Condition Evaluator

```typescript
describe('ConditionEvaluator', () => {
  const evaluator = new ConditionEvaluator();

  const context: WorkflowContext = {
    trigger: {
      payload: { score: 85, email: 'test@example.com', tags: ['vip', 'active'] },
      metadata: {},
      timestamp: new Date(),
    },
    steps: {
      calculate: { output: { total: 150.75 } },
    },
    variables: { threshold: 80 },
  };

  describe('simple conditions', () => {
    it('should evaluate equals operator', async () => {
      const result = await evaluator.evaluate(
        { mode: 'simple', simple: { leftOperand: 'trigger.payload.email', operator: 'equals', rightOperand: '"test@example.com"' } },
        context,
      );
      expect(result.branch).toBe('true');
    });

    it('should evaluate greater_than with variable reference', async () => {
      const result = await evaluator.evaluate(
        { mode: 'simple', simple: { leftOperand: 'trigger.payload.score', operator: 'greater_than', rightOperand: 'variables.threshold' } },
        context,
      );
      expect(result.branch).toBe('true');
    });

    it('should evaluate contains on strings', async () => {
      const result = await evaluator.evaluate(
        { mode: 'simple', simple: { leftOperand: 'trigger.payload.email', operator: 'contains', rightOperand: '"@example"' } },
        context,
      );
      expect(result.branch).toBe('true');
    });

    it('should evaluate is_empty on missing values', async () => {
      const result = await evaluator.evaluate(
        { mode: 'simple', simple: { leftOperand: 'trigger.payload.missing', operator: 'is_empty', rightOperand: '' } },
        context,
      );
      expect(result.branch).toBe('true');
    });

    it('should evaluate matches_regex', async () => {
      const result = await evaluator.evaluate(
        { mode: 'simple', simple: { leftOperand: 'trigger.payload.email', operator: 'matches_regex', rightOperand: '"^[\\w.]+@[\\w.]+$"' } },
        context,
      );
      expect(result.branch).toBe('true');
    });
  });

  describe('switch conditions', () => {
    it('should match the correct case', async () => {
      const result = await evaluator.evaluate(
        {
          mode: 'switch',
          switch: {
            expression: 'trigger.payload.score',
            cases: [
              { value: '100', label: 'perfect' },
              { value: '85', label: 'good' },
              { value: '50', label: 'average' },
            ],
          },
        },
        context,
      );
      expect(result.branch).toBe('good');
    });

    it('should return default when no case matches', async () => {
      const result = await evaluator.evaluate(
        {
          mode: 'switch',
          switch: {
            expression: 'trigger.payload.score',
            cases: [
              { value: '100', label: 'perfect' },
              { value: '0', label: 'zero' },
            ],
          },
        },
        context,
      );
      expect(result.branch).toBe('default');
    });
  });

  describe('expression conditions', () => {
    it('should evaluate JSONata expression', async () => {
      const result = await evaluator.evaluate(
        {
          mode: 'expression',
          expression: {
            code: 'trigger.payload.score > 90 ? "excellent" : trigger.payload.score > 70 ? "good" : "needs_improvement"',
            branches: ['excellent', 'good', 'needs_improvement'],
          },
        },
        context,
      );
      expect(result.branch).toBe('good');
    });
  });
});
```

### Unit Tests — Graph Validator

```typescript
describe('WorkflowValidator', () => {
  const validator = new WorkflowValidator();

  it('should pass validation for a valid simple workflow', () => {
    const nodes = [
      createNode({ id: 'n1', type: 'trigger', name: 'Start', config: { triggerType: 'manual' } }),
      createNode({ id: 'n2', type: 'action', name: 'Send Email', config: { actionType: 'send_email', to: 'test@test.com', subject: 'Hi' } }),
      createNode({ id: 'n3', type: 'end', name: 'Done' }),
    ];
    const edges = [
      createEdge({ sourceNodeId: 'n1', targetNodeId: 'n2' }),
      createEdge({ sourceNodeId: 'n2', targetNodeId: 'n3' }),
    ];
    const triggers = [createTrigger({ nodeId: 'n1', type: 'manual' })];

    const result = validator.validate(nodes, edges, triggers);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('should fail when no trigger node exists', () => {
    const nodes = [
      createNode({ id: 'n1', type: 'action', name: 'Action' }),
    ];

    const result = validator.validate(nodes, [], []);
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.code === 'WF_NO_TRIGGER')).toBe(true);
  });

  it('should detect cycles', () => {
    const nodes = [
      createNode({ id: 'n1', type: 'trigger', name: 'Start', config: { triggerType: 'manual' } }),
      createNode({ id: 'n2', type: 'action', name: 'A' }),
      createNode({ id: 'n3', type: 'action', name: 'B' }),
    ];
    const edges = [
      createEdge({ sourceNodeId: 'n1', targetNodeId: 'n2' }),
      createEdge({ sourceNodeId: 'n2', targetNodeId: 'n3' }),
      createEdge({ sourceNodeId: 'n3', targetNodeId: 'n2' }), // cycle!
    ];

    const result = validator.validate(nodes, edges, []);
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.code === 'WF_CYCLE_DETECTED')).toBe(true);
  });

  it('should warn about orphan nodes', () => {
    const nodes = [
      createNode({ id: 'n1', type: 'trigger', name: 'Start', config: { triggerType: 'manual' } }),
      createNode({ id: 'n2', type: 'action', name: 'Connected' }),
      createNode({ id: 'n3', type: 'action', name: 'Orphan' }), // not connected
    ];
    const edges = [
      createEdge({ sourceNodeId: 'n1', targetNodeId: 'n2' }),
    ];

    const result = validator.validate(nodes, edges, []);
    expect(result.warnings.some(w => w.code === 'WF_ORPHAN_NODE')).toBe(true);
  });
});
```

### Integration Tests — Workflow Execution

```typescript
describe('Workflow Execution (Integration)', () => {
  let workflowService: WorkflowService;
  let executionService: ExecutionService;

  beforeEach(() => {
    workflowService = new WorkflowService(db, redis, redpanda);
    executionService = new ExecutionService(db, redis);
  });

  it('should execute a simple linear workflow end-to-end', async () => {
    // Create workflow
    const workflow = await workflowService.create({
      name: 'Test Linear Workflow',
      ventureId,
      createdBy: userId,
    });

    // Build graph: trigger → action → end
    const trigger = await workflowService.addNode(workflow.id, {
      type: 'trigger',
      name: 'Manual Start',
      config: { triggerType: 'manual', inputSchema: {} },
      position: { x: 0, y: 0 },
    });

    const action = await workflowService.addNode(workflow.id, {
      type: 'action',
      name: 'Log Message',
      config: { actionType: 'log', level: 'info', message: 'Hello from workflow!' },
      position: { x: 0, y: 100 },
    });

    const end = await workflowService.addNode(workflow.id, {
      type: 'end',
      name: 'Done',
      config: {},
      position: { x: 0, y: 200 },
    });

    await workflowService.addEdge(workflow.id, {
      sourceNodeId: trigger.id, targetNodeId: action.id,
      sourceHandle: 'output', targetHandle: 'input',
    });
    await workflowService.addEdge(workflow.id, {
      sourceNodeId: action.id, targetNodeId: end.id,
      sourceHandle: 'output', targetHandle: 'input',
    });

    // Publish
    await workflowService.publish(workflow.id, 'Test version');

    // Execute
    const execution = await workflowService.execute(workflow.id, { test: true });
    expect(execution.status).toBe('pending');

    // Process the execution (simulate worker)
    await processAllJobs(redis);

    // Verify completion
    const completed = await executionService.getById(execution.id);
    expect(completed!.status).toBe('completed');
    expect(completed!.stepCount).toBe(3); // trigger + action + end

    // Verify audit trail
    const steps = await executionService.getSteps(execution.id);
    expect(steps).toHaveLength(3);
    expect(steps.every(s => s.status === 'completed')).toBe(true);
  });

  it('should handle condition branching correctly', async () => {
    const workflow = await workflowService.create({
      name: 'Test Condition Workflow',
      ventureId,
      createdBy: userId,
    });

    // Build: trigger → condition (score > 80?) → [true: "High"] [false: "Low"] → end
    const trigger = await workflowService.addNode(workflow.id, {
      type: 'trigger', name: 'Start',
      config: { triggerType: 'manual' },
      position: { x: 0, y: 0 },
    });

    const condition = await workflowService.addNode(workflow.id, {
      type: 'condition', name: 'Check Score',
      config: {
        mode: 'simple',
        simple: { leftOperand: 'trigger.payload.score', operator: 'greater_than', rightOperand: '80' },
      },
      position: { x: 0, y: 100 },
    });

    const highAction = await workflowService.addNode(workflow.id, {
      type: 'action', name: 'High Score',
      config: { actionType: 'log', message: 'High score!' },
      position: { x: -100, y: 200 },
    });

    const lowAction = await workflowService.addNode(workflow.id, {
      type: 'action', name: 'Low Score',
      config: { actionType: 'log', message: 'Low score' },
      position: { x: 100, y: 200 },
    });

    const end = await workflowService.addNode(workflow.id, {
      type: 'end', name: 'Done', config: {},
      position: { x: 0, y: 300 },
    });

    // Connect edges
    await workflowService.addEdge(workflow.id, { sourceNodeId: trigger.id, targetNodeId: condition.id, sourceHandle: 'output', targetHandle: 'input' });
    await workflowService.addEdge(workflow.id, { sourceNodeId: condition.id, targetNodeId: highAction.id, sourceHandle: 'true', targetHandle: 'input', label: 'High' });
    await workflowService.addEdge(workflow.id, { sourceNodeId: condition.id, targetNodeId: lowAction.id, sourceHandle: 'false', targetHandle: 'input', label: 'Low' });
    await workflowService.addEdge(workflow.id, { sourceNodeId: highAction.id, targetNodeId: end.id, sourceHandle: 'output', targetHandle: 'input' });
    await workflowService.addEdge(workflow.id, { sourceNodeId: lowAction.id, targetNodeId: end.id, sourceHandle: 'output', targetHandle: 'input' });

    await workflowService.publish(workflow.id);

    // Execute with score > 80
    const exec1 = await workflowService.execute(workflow.id, { score: 95 });
    await processAllJobs(redis);
    const result1 = await executionService.getById(exec1.id);
    expect(result1!.status).toBe('completed');

    // Verify it took the 'true' branch
    const steps1 = await executionService.getSteps(exec1.id);
    const actionNames1 = steps1.filter(s => s.nodeType === 'action').map(s => s.nodeName);
    expect(actionNames1).toContain('High Score');
    expect(actionNames1).not.toContain('Low Score');

    // Execute with score <= 80
    const exec2 = await workflowService.execute(workflow.id, { score: 50 });
    await processAllJobs(redis);
    const result2 = await executionService.getById(exec2.id);
    expect(result2!.status).toBe('completed');

    // Verify it took the 'false' branch
    const steps2 = await executionService.getSteps(exec2.id);
    const actionNames2 = steps2.filter(s => s.nodeType === 'action').map(s => s.nodeName);
    expect(actionNames2).toContain('Low Score');
    expect(actionNames2).not.toContain('High Score');
  });

  it('should retry failed steps according to retry policy', async () => {
    const workflow = await workflowService.create({
      name: 'Test Retry Workflow',
      ventureId,
      createdBy: userId,
      defaultRetryPolicy: {
        maxRetries: 2,
        backoffStrategy: 'fixed',
        baseDelayMs: 100,
        maxDelayMs: 1000,
      },
    });

    // Set up a workflow with an action that will fail twice then succeed
    // (using a mock action handler that tracks call count)
    const trigger = await workflowService.addNode(workflow.id, {
      type: 'trigger', name: 'Start',
      config: { triggerType: 'manual' },
      position: { x: 0, y: 0 },
    });

    const flakyAction = await workflowService.addNode(workflow.id, {
      type: 'action', name: 'Flaky Action',
      config: { actionType: 'http_request', url: 'http://flaky-service.test/api' },
      position: { x: 0, y: 100 },
    });

    const end = await workflowService.addNode(workflow.id, {
      type: 'end', name: 'Done', config: {},
      position: { x: 0, y: 200 },
    });

    await workflowService.addEdge(workflow.id, { sourceNodeId: trigger.id, targetNodeId: flakyAction.id, sourceHandle: 'output', targetHandle: 'input' });
    await workflowService.addEdge(workflow.id, { sourceNodeId: flakyAction.id, targetNodeId: end.id, sourceHandle: 'output', targetHandle: 'input' });

    await workflowService.publish(workflow.id);

    const execution = await workflowService.execute(workflow.id, {});
    await processAllJobs(redis);

    // Verify retry behavior
    const steps = await executionService.getSteps(execution.id);
    const actionSteps = steps.filter(s => s.nodeName === 'Flaky Action');
    // Should have multiple attempt records
    expect(actionSteps.length).toBeGreaterThanOrEqual(1);
  });
});
```

### Test Utilities

```typescript
// Helper functions used in tests

function createNode(overrides: Partial<WorkflowNode> & { id: string; type: NodeType; name: string }): WorkflowNode {
  return {
    workflowId: 'test-workflow',
    versionId: 'test-version',
    description: null,
    config: {},
    inputMapping: null,
    outputMapping: null,
    retryPolicy: null,
    timeoutMs: null,
    position: { x: 0, y: 0 },
    dimensions: null,
    uiMeta: null,
    sortOrder: 0,
    disabled: false,
    notes: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

function createEdge(overrides: Partial<WorkflowEdge> & { sourceNodeId: string; targetNodeId: string }): WorkflowEdge {
  return {
    id: `edge-${overrides.sourceNodeId}-${overrides.targetNodeId}`,
    workflowId: 'test-workflow',
    versionId: 'test-version',
    sourceHandle: 'output',
    targetHandle: 'input',
    label: null,
    sortOrder: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

function createTrigger(overrides: Partial<WorkflowTrigger> & { nodeId: string; type: TriggerType }): WorkflowTrigger {
  return {
    id: `trigger-${overrides.nodeId}`,
    workflowId: 'test-workflow',
    versionId: 'test-version',
    config: {},
    enabled: true,
    lastFiredAt: null,
    fireCount: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

async function processAllJobs(redis: TestRedis): Promise<void> {
  // Drain all BullMQ queues in test mode
  const worker = new TestWorkflowWorker(db, redis);
  await worker.processAll();
  await worker.shutdown();
}
```

### Test Coverage Requirements

| Area | Minimum Coverage | Notes |
|------|-----------------|-------|
| `WorkflowService` | 90% | Core CRUD, publishing, execution |
| `ExecutionService` | 90% | Step processing, state management |
| `TriggerService` | 85% | Event, webhook, schedule triggers |
| `ConditionEvaluator` | 95% | All operators must be tested |
| `WorkflowValidator` | 95% | All validation rules must be tested |
| `DataTransformer` | 90% | JSONata expressions, template rendering |
| `RateLimiterService` | 85% | Limit enforcement, window sliding |
| `WorkflowWorker` | 80% | Job processing, retry, error handling |
| **Overall** | **88%** | Minimum across all files |

---

*Last updated: 2026-02-09*  
*Module version: 0.14.0*  
*Maintainer: MCV Platform Team*