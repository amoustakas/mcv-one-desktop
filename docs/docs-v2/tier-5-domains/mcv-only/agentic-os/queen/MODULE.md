# @mcv/agentic-os/queen — Strategic Orchestrator
## Task Decomposition, Resource Allocation & Intelligent Dispatch

**Module:** `@mcv/agentic-os/queen`  
**Classification:** INTERNAL (MCV-Only)  
**Status:** CANONICAL SPECIFICATION  
**Quality Level:** SURGICAL (500+ lines)

---

## 1. Purpose

The Queen module is the **Level 3 strategic orchestrator** of the NAOS hierarchy — the brain that receives high-level human intents and system events, analyzes them, decomposes them into atomic task graphs, assesses risk, routes HITL approvals, delegates execution to Ralph pods, monitors progress, handles failures, and aggregates results into unified responses.

**The Queen never executes work directly.** She only plans and delegates. This separation of concerns ensures that:

1. **Planning intelligence** can be upgraded independently of execution capabilities.
2. **All execution** passes through capability gates and HITL controls.
3. **Risk assessment** happens before any side effects occur.
4. **Adaptive re-planning** can reroute failed tasks without restarting the entire pipeline.

The Queen is analogous to a CEO who sets strategy and delegates to department heads (Ralph pods) — she has visibility into everything but touches nothing directly.

---

## 2. Architecture

### 2.1 Internal Component Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           QUEEN ORCHESTRATOR                                │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                     REQUEST INTAKE & ANALYSIS                       │   │
│  │                                                                     │   │
│  │  • Parse user/system intent                                         │   │
│  │  • Identify target domains (marketing, development, finance...)     │   │
│  │  • Assess complexity (simple / moderate / complex / critical)       │   │
│  │  • Load relevant context from Neural Hive-Mind (Memory)             │   │
│  │  • Retrieve venture-specific configuration & constraints            │   │
│  └──────────────────────────────┬──────────────────────────────────────┘   │
│                                 │                                           │
│                                 ▼                                           │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                        TASK PLANNER                                 │   │
│  │                                                                     │   │
│  │  • Decompose request into atomic tasks                              │   │
│  │  • Identify inter-task dependencies (DAG)                           │   │
│  │  • Validate task graph (DFS cycle detection)                        │   │
│  │  • Topological sort with priority tie-breaking                      │   │
│  │  • Map each task to a target Ralph pod type                         │   │
│  └──────────────────────────────┬──────────────────────────────────────┘   │
│                                 │                                           │
│                                 ▼                                           │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                       RISK ASSESSOR                                 │   │
│  │                                                                     │   │
│  │  • Scan tasks for high-risk instruments                             │   │
│  │  • Check cost thresholds ($500 default)                             │   │
│  │  • Flag external communications                                     │   │
│  │  • Determine HITL requirements per risk matrix                      │   │
│  │  • Identify required approver roles and counts                      │   │
│  └──────────────────────────────┬──────────────────────────────────────┘   │
│                                 │                                           │
│                                 ▼                                           │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                     RESOURCE ALLOCATOR                              │   │
│  │                                                                     │   │
│  │  • Group tasks into parallel execution waves                        │   │
│  │  • Assign each task to a specific Ralph pod instance                │   │
│  │  • Select model tier per task (economy/standard/premium/reasoning)  │   │
│  │  • Set token budgets, tool limits, and timeouts                     │   │
│  │  • Estimate total duration and cost                                 │   │
│  └──────────────────────────────┬──────────────────────────────────────┘   │
│                                 │                                           │
│                    ┌────────────┴────────────┐                              │
│                    │ HITL Required?          │                              │
│                    │ YES → HITLGateway       │                              │
│                    │ NO  → Direct dispatch   │                              │
│                    └────────────┬────────────┘                              │
│                                 │                                           │
│                                 ▼                                           │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                    DISPATCH & MONITOR                               │   │
│  │                                                                     │   │
│  │  • Send tasks to SwarmDispatcher in parallel group order            │   │
│  │  • Monitor execution progress via task events                       │   │
│  │  • Handle failures: retry, re-plan, or escalate                     │   │
│  │  • Track cost accumulation against budget                           │   │
│  └──────────────────────────────┬──────────────────────────────────────┘   │
│                                 │                                           │
│                                 ▼                                           │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                    RESULT AGGREGATOR                                │   │
│  │                                                                     │   │
│  │  • Collect outputs from all completed tasks                         │   │
│  │  • Synthesize into unified StrategicResponse                        │   │
│  │  • Calculate total cost, duration, token usage                      │   │
│  │  • Store execution trajectory for learning                          │   │
│  │  • Update agent metrics                                             │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 2.2 Request Lifecycle

```
User/System Request
        │
        ▼
┌───────────────────┐
│  Queen.handle     │
│  Request()        │
│                   │
│  1. Analyze       │──── Memory.retrieve() → load venture context
│  2. Decompose     │──── TaskPlanner.decompose() → task graph
│  3. Assess risk   │──── RiskAssessor.assess() → risk + HITL reqs
│  4. Allocate      │──── ResourceAllocator.allocate() → execution plan
│                   │
└────────┬──────────┘
         │
         ├──── [Low Risk] ────────────────────┐
         │                                     │
         └──── [High Risk] ──┐                │
                              ▼                │
                    ┌──────────────────┐       │
                    │ HITLGateway      │       │
                    │ .requestApproval │       │
                    ├──────────────────┤       │
                    │ Approved ────────┤───────┤
                    │ Rejected ────────┤─── Return error
                    │ Expired  ────────┤─── Escalate or reject
                    └──────────────────┘       │
                                               ▼
                                    ┌──────────────────┐
                                    │ SwarmDispatcher   │
                                    │ .dispatch()       │
                                    │                   │
                                    │ Wave 1: [A, B]    │── parallel
                                    │ Wave 2: [C]       │── depends on A,B
                                    │ Wave 3: [D, E]    │── depends on C
                                    └────────┬──────────┘
                                             │
                                             ▼
                                    ┌──────────────────┐
                                    │ Result Aggregator │
                                    │                   │
                                    │ Combine outputs   │
                                    │ Compute summary   │
                                    │ Record trajectory │
                                    └──────────────────┘
```

### 2.3 Task Decomposition Flow

```
┌──────────────────────────────────────────────────────────────────────────┐
│                      QUEEN TASK DECOMPOSITION                            │
│                                                                          │
│  1. ANALYZE REQUEST                                                      │
│     ├── Parse intent (what is the user trying to accomplish?)            │
│     ├── Identify domains (marketing? development? finance?)              │
│     ├── Assess complexity (simple / moderate / complex / critical)       │
│     └── Load relevant context from Neural Hive-Mind (Memory)             │
│                                                                          │
│  2. DECOMPOSE INTO TASKS                                                 │
│     ├── Break into atomic units (each assignable to one pod)             │
│     ├── Identify dependencies (task B needs output of task A)            │
│     ├── Validate task graph (no cycles, all deps resolvable)             │
│     └── Optimize execution order (topological sort + priority)           │
│                                                                          │
│  3. ASSESS RISK                                                          │
│     ├── Check for HIGH_RISK_INSTRUMENTS usage                            │
│     ├── Check cost thresholds (default $500 per request)                 │
│     ├── Check for external communications                                │
│     ├── Determine HITL requirements per risk matrix                      │
│     └── Identify required approvers by role                              │
│                                                                          │
│  4. ALLOCATE RESOURCES                                                   │
│     ├── Group tasks into parallel execution waves                        │
│     ├── Assign each task to a specific Ralph pod                         │
│     ├── Select model tier (economy / standard / premium / reasoning)     │
│     ├── Set token budgets and timeouts                                   │
│     └── Estimate total duration and cost                                 │
│                                                                          │
│  5. DISPATCH & AGGREGATE                                                 │
│     ├── Route through HITL if required (block until resolved)            │
│     ├── Dispatch parallel groups in dependency order                     │
│     ├── Monitor execution progress                                       │
│     ├── Handle failures (retry / re-plan / escalate)                     │
│     └── Aggregate results into unified StrategicResponse                 │
└──────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Core Concepts

### 3.1 Planning-Only Agent

The Queen is configured with capabilities `['read', 'delegate', 'approve']` — she **never** has `write`, `execute`, `external`, or `financial`. This means:

- She cannot modify data directly.
- She cannot call external APIs or send communications.
- She cannot perform financial transactions.
- She can only plan, delegate to Ralph pods, and approve HITL escalations.

This constraint is enforced at the NAOS runtime level — even if the Queen's LLM hallucinates a tool call for an instrument requiring `write`, the runtime will reject it with `AgentError`.

### 3.2 Task Graph as a DAG

Tasks are organized as a **Directed Acyclic Graph (DAG)**. Each task has:
- A unique `id`
- An array of `dependencies` (other task IDs that must complete first)
- A `targetPod` (which Ralph pod should execute it)
- A `priority` (for ordering within the same dependency level)

The TaskPlanner validates the graph using DFS-based cycle detection. If a cycle is found, it throws `PlanningError` with the cycle path.

### 3.3 Parallel Waves

The ResourceAllocator groups independent tasks into "parallel waves" — sets of tasks that have no mutual dependencies and can execute simultaneously. Within each wave, tasks are ordered by priority.

```
Wave 1: [Task A (oracle), Task B (scribe)]    ← no deps, run in parallel
Wave 2: [Task C (growth)]                     ← depends on A and B
Wave 3: [Task D (herald), Task E (smith)]     ← depends on C
```

### 3.4 Risk Assessment Matrix

| Condition | Risk Level | HITL Required | Approvers |
|-----------|-----------|--------------|-----------|
| Read-only operations, internal queries | Low | No | — |
| Data modifications, standard API calls | Medium | Yes (1 step) | Manager ×1 |
| Financial transactions, user data changes | High | Yes (2 steps) | Manager ×1 + Executive ×1 |
| System configuration, security changes, bulk operations | Critical | Yes (3 steps) | Executive ×2 |
| Cost exceeds $500 per request | High | Yes | Manager ×1 + Finance ×1 |
| External communication (email, SMS, social) | Medium | Yes | Manager ×1 |
| Instruments in `HIGH_RISK_INSTRUMENTS` set | High | Yes | Manager ×1 + Domain Expert ×1 |

### 3.5 Adaptive Re-Planning

When a task fails during execution, the Queen doesn't just retry blindly. She performs adaptive re-planning:

1. **Analyze the failure**: What went wrong? Tool error? Timeout? Bad output?
2. **Assess alternatives**: Can a different pod handle it? Can the task be simplified?
3. **Re-plan remaining graph**: Remove the failed task's dependents or route around it.
4. **Escalate if needed**: If re-planning fails, escalate to HITL for human guidance.

### 3.6 Cost Estimation

Before dispatching, the Queen estimates costs per task based on:
- **Historical averages**: Per task type and instrument count from `naos_trajectories`.
- **Model tier pricing**: Economy ($0.001/1K tokens) → Premium ($0.03/1K tokens).
- **Tool call overhead**: Each tool call adds estimated latency and token cost.
- **Budget check**: If estimated total exceeds the request's `costBudgetUSD`, the Queen either trims scope or requests HITL approval for the overage.

---

## 4. Exports

```typescript
// @mcv/agentic-os/queen/index.ts

// ═══════════════════════════════════════════════════════════════════════════════
// Core Classes
// ═══════════════════════════════════════════════════════════════════════════════

export { Queen } from './queen';
export { TaskPlanner } from './planner';
export { ResourceAllocator } from './allocator';
export { RiskAssessor } from './risk';
export { ResultAggregator } from './aggregator';

// ═══════════════════════════════════════════════════════════════════════════════
// Types
// ═══════════════════════════════════════════════════════════════════════════════

export type {
  // Configuration
  QueenConfig,                       // Full Queen configuration
  PlannerConfig,                     // TaskPlanner configuration
  AllocatorConfig,                   // ResourceAllocator configuration

  // Request / Response
  StrategicRequest,                  // High-level request input
  StrategicResponse,                 // Aggregated execution response
  RequestAnalysis,                   // Intent analysis output

  // Tasks
  Task,                              // Atomic executable task
  TaskType,                          // development | marketing | operations | finance | content | analytics | communications | security
  TaskGraph,                         // Complete task graph with metadata

  // Ralph Pods
  RalphPodType,                      // smith | growth | director | ledger | scribe | oracle | herald | shield

  // Resource Planning
  ResourcePlan,                      // Execution plan with assignments
  TaskAssignment,                    // Task-to-pod assignment
  ParallelGroup,                     // Parallelizable task group (wave)
  ResourceRequirements,              // Token, tool, timeout, model tier per task

  // Risk Assessment
  RiskAssessment,                    // Complete risk assessment
  Risk,                              // Individual risk item
  RiskLevel,                         // low | medium | high | critical
  ApproverConfig,                    // Approver role and count requirement

  // Cost Estimation
  CostEstimate,                      // Per-task and total cost estimate
  CostBreakdown,                     // Detailed cost breakdown by component

  // Re-planning
  RePlanStrategy,                    // How to handle failures
  RePlanResult,                      // Re-planning outcome
} from './types';

// ═══════════════════════════════════════════════════════════════════════════════
// Constants
// ═══════════════════════════════════════════════════════════════════════════════

export {
  HIGH_RISK_INSTRUMENTS,             // Set of instruments requiring HITL
  COST_THRESHOLD_USD,                // Default cost threshold ($500)
  DEFAULT_QUEEN_CONFIG,              // Default Queen configuration
  RISK_MATRIX,                       // Risk assessment matrix
  MODEL_TIER_PRICING,                // Cost per 1K tokens per tier
} from './constants';
```

---

## 5. TypeScript Interfaces

```typescript
// @mcv/agentic-os/queen/types.ts

import type { AgentConfig, ModelConfig, AgentCapability } from '../naos';
import type { Duration, VentureID, UserID, Priority, Timestamp } from '../types';

// ═══════════════════════════════════════════════════════════════════════════════
// Configuration
// ═══════════════════════════════════════════════════════════════════════════════

export interface QueenConfig extends AgentConfig {
  /** Model used for planning and decomposition (recommend reasoning tier) */
  planningModel: ModelConfig;

  /** Maximum number of concurrent tasks across all waves */
  maxConcurrentTasks: number;

  /** Default timeout for individual task execution */
  taskTimeout: Duration;

  /** HITL escalation rules */
  escalationRules: EscalationRule[];

  /** Default cost budget per request in USD */
  defaultCostBudgetUSD: number;

  /** Maximum allowed task graph depth (prevents infinite decomposition) */
  maxGraphDepth: number;

  /** Whether to enable adaptive re-planning on failure */
  enableAdaptiveRePlanning: boolean;

  /** Maximum re-plan attempts before escalating */
  maxRePlanAttempts: number;
}

export interface PlannerConfig {
  /** Maximum number of tasks per decomposition */
  maxTasks: number;

  /** Maximum dependency chain length */
  maxDependencyDepth: number;

  /** Model for decomposition reasoning */
  decompositionModel: ModelConfig;

  /** Whether to use Memory for context-aware decomposition */
  useMemoryContext: boolean;

  /** Maximum context tokens to load from Memory */
  maxContextTokens: number;
}

export interface AllocatorConfig {
  /** Pod availability and capacity map */
  podCapacity: Record<RalphPodType, number>;

  /** Default model tier per task type */
  defaultModelTiers: Record<TaskType, ModelTier>;

  /** Whether to load-balance across pod instances */
  enableLoadBalancing: boolean;

  /** Maximum parallel waves */
  maxParallelWaves: number;
}

// ═══════════════════════════════════════════════════════════════════════════════
// Request / Response
// ═══════════════════════════════════════════════════════════════════════════════

export interface StrategicRequest {
  /** Unique request identifier */
  id: string;

  /** Human-readable description of the request */
  description: string;

  /** Execution context */
  context: {
    /** Venture this request belongs to */
    ventureId: VentureID;
    /** User who initiated the request */
    userId: UserID;
    /** Optional cost budget override */
    budget?: number;
    /** Optional deadline */
    deadline?: Date;
    /** Additional context passed to task planning */
    metadata?: Record<string, unknown>;
  };

  /** Request priority */
  priority: Priority;

  /** Optional constraints on execution */
  constraints?: {
    /** Whether to require HITL regardless of risk */
    requiresApproval?: boolean;
    /** Restrict to specific pod types */
    allowedPods?: RalphPodType[];
    /** Restrict to specific instruments */
    allowedInstruments?: string[];
    /** Channels for communication tasks */
    channels?: string[];
    /** Maximum number of tasks */
    maxTasks?: number;
  };
}

export interface StrategicResponse {
  /** Original request ID */
  requestId: string;

  /** Overall execution status */
  status: 'completed' | 'partial' | 'failed' | 'awaiting_approval';

  /** All task results */
  tasks: TaskResult[];

  /** Human-readable summary of what was accomplished */
  summary: string;

  /** Total execution duration in milliseconds */
  duration: number;

  /** Total cost in USD */
  costUSD: number;

  /** Total tokens consumed */
  totalTokens: number;

  /** HITL decisions that were made (if any) */
  hitlDecisions?: HITLDecisionSummary[];

  /** Trajectory ID for learning system */
  trajectoryId?: string;

  /** Any warnings or notes */
  warnings?: string[];
}

export interface RequestAnalysis {
  /** Identified intent category */
  intent: string;

  /** Complexity assessment */
  complexity: 'simple' | 'moderate' | 'complex' | 'critical';

  /** Domains involved */
  domains: TaskType[];

  /** Constraints extracted from the request */
  constraints: Record<string, unknown>;

  /** Context loaded from Memory */
  memoryContext?: string;

  /** Confidence in the analysis */
  confidence: number;
}

// ═══════════════════════════════════════════════════════════════════════════════
// Tasks
// ═══════════════════════════════════════════════════════════════════════════════

export type TaskType =
  | 'development'
  | 'marketing'
  | 'operations'
  | 'finance'
  | 'content'
  | 'analytics'
  | 'communications'
  | 'security';

export type RalphPodType =
  | 'smith'       // Development (Engineer)
  | 'growth'      // Marketing (Marketer)
  | 'director'    // Operations (Operator)
  | 'ledger'      // Finance (Accountant)
  | 'scribe'      // Content (Writer)
  | 'oracle'      // Analytics (Analyst)
  | 'herald'      // Communications (Communicator)
  | 'shield';     // Security (Guardian)

export type ModelTier = 'economy' | 'standard' | 'premium' | 'reasoning';

export interface Task {
  /** Unique task identifier */
  id: string;

  /** Parent task ID (for hierarchical decomposition) */
  parentId?: string;

  /** Task type (maps to domain) */
  type: TaskType;

  /** Human-readable task title */
  title: string;

  /** Detailed description of what to do */
  description: string;

  /** Which Ralph pod should execute this */
  targetPod: RalphPodType;

  /** Instruments (tools) needed for execution */
  instruments: string[];

  /** Input data for the task */
  inputs: Record<string, unknown>;

  /** IDs of tasks that must complete before this one */
  dependencies: string[];

  /** Execution priority (lower number = higher priority) */
  priority: number;

  /** Estimated execution time in ms */
  estimatedDurationMs: number;

  /** Estimated cost in USD */
  estimatedCostUSD: number;
}

export interface TaskGraph {
  /** All tasks in the graph */
  tasks: Task[];

  /** Computed parallel execution waves */
  waves: ParallelGroup[];

  /** Graph metadata */
  metadata: {
    totalTasks: number;
    maxDepth: number;
    estimatedDurationMs: number;
    estimatedCostUSD: number;
    domainsInvolved: TaskType[];
    podsRequired: RalphPodType[];
  };
}

export interface TaskResult {
  /** Task ID */
  taskId: string;

  /** Execution status */
  status: 'completed' | 'failed' | 'partial' | 'skipped';

  /** Task output data */
  output: unknown;

  /** Artifacts produced (files, reports, etc.) */
  artifacts: Artifact[];

  /** Tokens consumed */
  tokensUsed: number;

  /** Tool calls made during execution */
  toolCalls: ToolCallRecord[];

  /** Execution duration in ms */
  duration: number;

  /** Cost in USD */
  costUSD: number;

  /** Error message if failed */
  error?: string;
}

// ═══════════════════════════════════════════════════════════════════════════════
// Resource Planning
// ═══════════════════════════════════════════════════════════════════════════════

export interface ResourcePlan {
  /** Task-to-pod assignments */
  assignments: TaskAssignment[];

  /** Parallel execution groups (waves) */
  parallelGroups: ParallelGroup[];

  /** Estimated total duration across all waves */
  estimatedTotalDuration: number;

  /** Estimated total cost */
  estimatedTotalCost: number;

  /** Model tier selections */
  modelSelections: Record<string, ModelTier>;
}

export interface TaskAssignment {
  /** Task ID */
  taskId: string;

  /** Assigned pod type */
  podType: RalphPodType;

  /** Specific pod instance (for load balancing) */
  podInstance: string;

  /** Resource requirements */
  resources: ResourceRequirements;
}

export interface ParallelGroup {
  /** Group ID */
  groupId: string;

  /** Wave number (execution order) */
  waveNumber: number;

  /** Task IDs in this group */
  taskIds: string[];

  /** Groups that must complete before this one starts */
  startAfter: string[];
}

export interface ResourceRequirements {
  /** Maximum tokens per LLM turn */
  maxTokens: number;

  /** Maximum tool calls allowed */
  maxToolCalls: number;

  /** Timeout in milliseconds */
  timeoutMs: number;

  /** Model tier to use */
  modelTier: ModelTier;

  /** Cost budget for this specific task */
  costBudgetUSD?: number;
}

// ═══════════════════════════════════════════════════════════════════════════════
// Risk Assessment
// ═══════════════════════════════════════════════════════════════════════════════

export type RiskLevel = 'low' | 'medium' | 'high' | 'critical';

export interface RiskAssessment {
  /** Individual risks identified */
  risks: Risk[];

  /** Overall risk level (highest among all risks) */
  overallLevel: RiskLevel;

  /** Whether HITL approval is required */
  requiresApproval: boolean;

  /** Required approvers */
  approvers: ApproverConfig[];
}

export interface Risk {
  /** Task ID this risk applies to */
  taskId: string;

  /** Risk type */
  type: 'cost_threshold' | 'external_communication' | 'financial_transaction'
      | 'data_modification' | 'system_configuration' | 'security_change'
      | 'bulk_operation' | 'high_risk_instrument';

  /** Risk level */
  level: RiskLevel;

  /** Human-readable description */
  description: string;

  /** Specific instrument that triggered the risk (if applicable) */
  instrument?: string;

  /** Estimated cost impact (if applicable) */
  costImpact?: number;
}

export interface ApproverConfig {
  /** Role required (manager, executive, finance, domain_expert) */
  role: string;

  /** Number of approvers with this role needed */
  count: number;
}

// ═══════════════════════════════════════════════════════════════════════════════
// Cost Estimation
// ═══════════════════════════════════════════════════════════════════════════════

export interface CostEstimate {
  /** Per-task cost estimates */
  perTask: Record<string, number>;

  /** Total estimated cost */
  total: number;

  /** Breakdown by component */
  breakdown: CostBreakdown;

  /** Whether total exceeds budget */
  exceedsBudget: boolean;

  /** Budget amount */
  budget: number;
}

export interface CostBreakdown {
  /** LLM inference cost */
  inference: number;

  /** Tool execution cost */
  toolCalls: number;

  /** External API costs */
  externalApis: number;

  /** Overhead (logging, metrics, etc.) */
  overhead: number;
}

// ═══════════════════════════════════════════════════════════════════════════════
// Re-Planning
// ═══════════════════════════════════════════════════════════════════════════════

export type RePlanStrategy =
  | 'retry_same_pod'        // Retry on the same pod with failure context
  | 'retry_different_pod'   // Route to a different pod type
  | 'simplify_task'         // Break the failed task into simpler sub-tasks
  | 'skip_and_continue'     // Skip the failed task, continue with dependents
  | 'abort_dependents'      // Skip the failed task and all its dependents
  | 'escalate_hitl';        // Escalate to human for guidance

export interface RePlanResult {
  /** Strategy chosen */
  strategy: RePlanStrategy;

  /** Updated task graph (if modified) */
  updatedGraph?: TaskGraph;

  /** Tasks that were removed or skipped */
  skippedTasks: string[];

  /** New tasks created (if task was simplified) */
  newTasks?: Task[];

  /** Whether re-planning succeeded */
  success: boolean;

  /** Reason if re-planning failed */
  failureReason?: string;
}

// ═══════════════════════════════════════════════════════════════════════════════
// Supporting Types
// ═══════════════════════════════════════════════════════════════════════════════

export interface Artifact {
  type: 'file' | 'report' | 'code' | 'data' | 'image' | 'document';
  name: string;
  path?: string;
  url?: string;
  mimeType?: string;
  size?: number;
}

export interface ToolCallRecord {
  tool: string;
  input: unknown;
  output: unknown;
  durationMs: number;
  success: boolean;
}

export interface HITLDecisionSummary {
  requestId: string;
  decision: 'approved' | 'rejected';
  approvers: string[];
  conditions?: string[];
  decidedAt: Date;
}

export interface EscalationRule {
  /** Conditions that trigger escalation */
  conditions: {
    riskLevels?: RiskLevel[];
    requestTypes?: string[];
    costAbove?: number;
    afterHours?: number;
  };

  /** Action to take */
  action: {
    type: 'add_approver' | 'auto_approve' | 'auto_reject' | 'notify';
    targetRole?: string;
    notifyChannels?: string[];
    reason: string;
  };
}
```

---

## 6. Database Schema (Drizzle ORM)

The Queen module does not have its own dedicated tables — it uses the `naos_tasks` table (owned by the Swarm module) for task storage, the `naos_hitl_requests` table (owned by the HITL module) for approvals, and the `naos_agents` table (owned by NAOS) for its own registration. However, the Queen defines specific **views** and **query patterns** over these tables.

### 6.1 Queen-Specific Queries

```typescript
// @mcv/agentic-os/queen/queries.ts

import { db } from '@mcv/kernel';
import { naosTasks, naosTaskEvents, naosTrajectories } from '../swarm/schema';
import { naosHitlRequests } from '../hitl/schema';
import { eq, and, inArray, desc, sql } from 'drizzle-orm';

/**
 * Get the full task graph for a request (root task + all descendants).
 */
export async function getTaskGraph(rootTaskId: string) {
  return db.query.naosTasks.findMany({
    where: eq(naosTasks.rootTaskId, rootTaskId),
    orderBy: [naosTasks.priority, naosTasks.createdAt],
  });
}

/**
 * Get all pending tasks awaiting HITL approval for a venture.
 */
export async function getPendingHITLTasks(ventureId: string) {
  return db
    .select()
    .from(naosTasks)
    .where(
      and(
        eq(naosTasks.ventureId, ventureId),
        eq(naosTasks.status, 'waiting_hitl'),
      )
    )
    .orderBy(desc(naosTasks.priority));
}

/**
 * Get cost estimation data from historical trajectories.
 */
export async function getHistoricalCostData(
  ventureId: string,
  taskType: string,
  limit = 100
) {
  return db
    .select({
      taskType: naosTrajectories.taskType,
      avgCost: sql<number>`AVG(${naosTrajectories.totalCostUsd})`,
      avgDuration: sql<number>`AVG(${naosTrajectories.totalDurationMs})`,
      avgTokens: sql<number>`AVG(${naosTrajectories.totalTokens})`,
      avgToolCalls: sql<number>`AVG(${naosTrajectories.totalToolCalls})`,
      sampleCount: sql<number>`COUNT(*)`,
    })
    .from(naosTrajectories)
    .where(
      and(
        eq(naosTrajectories.ventureId, ventureId),
        eq(naosTrajectories.taskType, taskType),
        eq(naosTrajectories.outcome, 'success'),
      )
    )
    .groupBy(naosTrajectories.taskType)
    .limit(limit);
}

/**
 * Get task execution timeline with all events.
 */
export async function getTaskTimeline(taskId: string) {
  return db.query.naosTaskEvents.findMany({
    where: eq(naosTaskEvents.taskId, taskId),
    orderBy: [naosTaskEvents.timestamp],
  });
}
```

### 6.2 Queen Agent Registration

```typescript
// @mcv/agentic-os/queen/setup.ts

import { AgentRegistry } from '../naos';

/**
 * Register the Queen agent for a venture.
 */
export async function registerQueen(ventureId: string) {
  const registry = new AgentRegistry();

  return registry.register({
    id: `queen-${ventureId}`,
    name: 'Queen',
    type: 'queen',
    description: 'Strategic orchestrator — decomposes requests, delegates to Ralph pods, monitors execution',
    capabilities: ['read', 'delegate', 'approve'],
    model: {
      defaultModel: 'claude-opus-4',
      tier: 'reasoning',
      maxTokensPerTurn: 16000,
      temperature: 0.3,
    },
    instruments: [], // Queen has NO instruments — she delegates
    memory: {
      enabled: true,
      episodicRetention: '365d',
      semanticIndexing: true,
      maxWorkingMemory: 50,
    },
    constraints: {
      maxTokensPerTurn: 16000,
      maxToolCalls: 0,        // Queen NEVER calls tools directly
      timeoutMs: 900000,      // 15 minute max
      costBudgetUSD: 50.0,
      requiresHITL: [],
      forbiddenActions: ['write_data', 'send_email', 'financial_transfer', 'deploy_code'],
    },
  });
}
```

---

## 7. Core Class Implementations

### 7.1 Queen

```typescript
// @mcv/agentic-os/queen/queen.ts

import { NAOSAgent } from '../naos';
import { TaskPlanner } from './planner';
import { ResourceAllocator } from './allocator';
import { RiskAssessor } from './risk';
import { ResultAggregator } from './aggregator';
import { SwarmDispatcher } from '../swarm';
import { HITLGateway } from '../hitl';
import { MemoryStore } from '../memory';
import type {
  QueenConfig, StrategicRequest, StrategicResponse,
  RequestAnalysis, TaskGraph, RiskAssessment, ResourcePlan,
} from './types';

export class Queen extends NAOSAgent {
  private planner: TaskPlanner;
  private allocator: ResourceAllocator;
  private riskAssessor: RiskAssessor;
  private aggregator: ResultAggregator;
  private dispatcher: SwarmDispatcher;
  private hitl: HITLGateway;
  private memory: MemoryStore;

  constructor(config: QueenConfig) {
    super(config);
    this.planner = new TaskPlanner(config);
    this.allocator = new ResourceAllocator(config);
    this.riskAssessor = new RiskAssessor();
    this.aggregator = new ResultAggregator();
    this.dispatcher = new SwarmDispatcher();
    this.hitl = new HITLGateway();
    this.memory = new MemoryStore();
  }

  /**
   * Process a high-level strategic request through the full pipeline.
   */
  async handleRequest(request: StrategicRequest): Promise<StrategicResponse> {
    const startTime = Date.now();

    // 1. Analyze the request
    const analysis = await this.analyzeRequest(request);

    // 2. Load context from Memory
    const context = await this.memory.retrieve({
      query: request.description,
      ventureId: request.context.ventureId,
      types: ['semantic', 'procedural'],
      limit: 10,
      minImportance: 0.5,
    });

    // 3. Decompose into task graph
    const tasks = await this.planner.decompose(request, analysis);

    // 4. Assess risk
    const riskAssessment = await this.riskAssessor.assess(tasks, request);

    // 5. Allocate resources
    const plan = await this.allocator.allocate(tasks);

    // 6. HITL gate (if required)
    if (riskAssessment.requiresApproval) {
      const approval = await this.hitl.requestApproval({
        requestId: request.id,
        tasks,
        riskAssessment,
        requiredApprovers: riskAssessment.approvers,
        timeout: request.context.deadline
          ? { until: request.context.deadline }
          : { hours: 4 },
        context: request.context.metadata,
      });

      if (!approval.approved) {
        return {
          requestId: request.id,
          status: 'failed',
          tasks: [],
          summary: `Request rejected by HITL: ${approval.comments}`,
          duration: Date.now() - startTime,
          costUSD: 0,
          totalTokens: 0,
          hitlDecisions: [{
            requestId: approval.requestId,
            decision: 'rejected',
            approvers: approval.approvers.map(a => a.approverRole),
            decidedAt: approval.decidedAt,
          }],
        };
      }
    }

    // 7. Dispatch to swarm
    const results = await this.dispatcher.dispatch(tasks, plan);

    // 8. Aggregate results
    return this.aggregator.aggregate(request, results, startTime);
  }

  /**
   * Analyze the request to understand intent, complexity, and domains.
   */
  private async analyzeRequest(request: StrategicRequest): Promise<RequestAnalysis> {
    // Use the planning model to analyze the request
    const response = await this.process({
      id: `analysis-${request.id}`,
      type: 'analysis',
      content: `Analyze this request and identify the intent, complexity, and domains involved:\n\n${request.description}`,
      context: request.context,
      priority: 1,
    });

    return response.result as RequestAnalysis;
  }
}
```

### 7.2 TaskPlanner

```typescript
// @mcv/agentic-os/queen/planner.ts

import type { StrategicRequest, RequestAnalysis, Task, TaskGraph } from './types';
import { PlanningError } from '../types';

export class TaskPlanner {
  /**
   * Decompose a strategic request into an executable task graph.
   */
  async decompose(
    request: StrategicRequest,
    analysis: RequestAnalysis
  ): Promise<Task[]> {
    // 1. Generate tasks using the planning model
    const tasks = await this.generateTasks(request, analysis);

    // 2. Validate the dependency graph
    this.validateGraph(tasks);

    // 3. Optimize execution order
    return this.topologicalSort(tasks);
  }

  /**
   * Validate that the task graph is a valid DAG (no cycles).
   * Uses DFS-based cycle detection.
   */
  private validateGraph(tasks: Task[]): void {
    const taskMap = new Map(tasks.map(t => [t.id, t]));
    const visited = new Set<string>();
    const inStack = new Set<string>();
    const cyclePath: string[] = [];

    const dfs = (taskId: string): boolean => {
      if (inStack.has(taskId)) {
        cyclePath.push(taskId);
        return true; // Cycle detected
      }
      if (visited.has(taskId)) return false;

      visited.add(taskId);
      inStack.add(taskId);

      const task = taskMap.get(taskId);
      if (task) {
        for (const dep of task.dependencies) {
          if (!taskMap.has(dep)) {
            throw new PlanningError(
              `Task "${taskId}" depends on non-existent task "${dep}"`,
              { taskId, dependency: dep }
            );
          }
          if (dfs(dep)) {
            cyclePath.push(taskId);
            return true;
          }
        }
      }

      inStack.delete(taskId);
      return false;
    };

    for (const task of tasks) {
      if (dfs(task.id)) {
        throw new PlanningError(
          `Cycle detected in task graph: ${cyclePath.reverse().join(' → ')}`,
          { cycle: cyclePath }
        );
      }
    }
  }

  /**
   * Topological sort with priority tie-breaking.
   * Tasks with lower priority numbers execute first within the same wave.
   */
  private topologicalSort(tasks: Task[]): Task[] {
    const taskMap = new Map(tasks.map(t => [t.id, t]));
    const inDegree = new Map<string, number>();
    const adjacency = new Map<string, string[]>();

    // Initialize
    for (const task of tasks) {
      inDegree.set(task.id, task.dependencies.length);
      for (const dep of task.dependencies) {
        const edges = adjacency.get(dep) || [];
        edges.push(task.id);
        adjacency.set(dep, edges);
      }
    }

    // Process nodes with in-degree 0, sorted by priority
    const result: Task[] = [];
    const queue = tasks
      .filter(t => t.dependencies.length === 0)
      .sort((a, b) => a.priority - b.priority);

    while (queue.length > 0) {
      const task = queue.shift()!;
      result.push(task);

      for (const neighbor of (adjacency.get(task.id) || [])) {
        const degree = (inDegree.get(neighbor) || 0) - 1;
        inDegree.set(neighbor, degree);
        if (degree === 0) {
          queue.push(taskMap.get(neighbor)!);
          queue.sort((a, b) => a.priority - b.priority);
        }
      }
    }

    return result;
  }

  private async generateTasks(
    request: StrategicRequest,
    analysis: RequestAnalysis
  ): Promise<Task[]> {
    // LLM-based task generation (simplified)
    // In production, this uses a specialized prompt from the PromptBank
    throw new Error('Implementation delegated to LLM inference');
  }
}
```

### 7.3 ResourceAllocator

```typescript
// @mcv/agentic-os/queen/allocator.ts

import type {
  Task, ResourcePlan, TaskAssignment, ParallelGroup,
  ResourceRequirements, ModelTier, RalphPodType, TaskType
} from './types';
import { AllocationError } from '../types';

/** Default model tier mapping per task type */
const DEFAULT_MODEL_TIERS: Record<TaskType, ModelTier> = {
  development: 'premium',
  marketing: 'standard',
  operations: 'standard',
  finance: 'premium',
  content: 'standard',
  analytics: 'standard',
  communications: 'economy',
  security: 'premium',
};

/** Default resource budgets per model tier */
const TIER_RESOURCES: Record<ModelTier, ResourceRequirements> = {
  economy: { maxTokens: 2000, maxToolCalls: 5, timeoutMs: 60000, modelTier: 'economy' },
  standard: { maxTokens: 4000, maxToolCalls: 10, timeoutMs: 180000, modelTier: 'standard' },
  premium: { maxTokens: 8000, maxToolCalls: 20, timeoutMs: 300000, modelTier: 'premium' },
  reasoning: { maxTokens: 16000, maxToolCalls: 30, timeoutMs: 600000, modelTier: 'reasoning' },
};

export class ResourceAllocator {
  /**
   * Create an execution plan with resource allocations.
   */
  async allocate(tasks: Task[]): Promise<ResourcePlan> {
    // 1. Group into parallel waves
    const waves = this.computeParallelWaves(tasks);

    // 2. Assign resources per task
    const assignments = tasks.map(task => this.assignResources(task));

    // 3. Calculate estimates
    const estimatedTotalDuration = this.estimateDuration(waves, assignments);
    const estimatedTotalCost = assignments.reduce(
      (sum, a) => sum + (a.resources.costBudgetUSD || 0), 0
    );

    return {
      assignments,
      parallelGroups: waves,
      estimatedTotalDuration,
      estimatedTotalCost,
      modelSelections: Object.fromEntries(
        assignments.map(a => [a.taskId, a.resources.modelTier])
      ),
    };
  }

  /**
   * Compute parallel execution waves from the task graph.
   */
  private computeParallelWaves(tasks: Task[]): ParallelGroup[] {
    const taskMap = new Map(tasks.map(t => [t.id, t]));
    const taskWave = new Map<string, number>();
    const waves: Map<number, string[]> = new Map();

    // Assign wave numbers (longest path from root)
    const getWave = (taskId: string): number => {
      if (taskWave.has(taskId)) return taskWave.get(taskId)!;

      const task = taskMap.get(taskId)!;
      if (task.dependencies.length === 0) {
        taskWave.set(taskId, 0);
        return 0;
      }

      const maxDepWave = Math.max(
        ...task.dependencies.map(dep => getWave(dep))
      );
      const wave = maxDepWave + 1;
      taskWave.set(taskId, wave);
      return wave;
    };

    for (const task of tasks) {
      const wave = getWave(task.id);
      if (!waves.has(wave)) waves.set(wave, []);
      waves.get(wave)!.push(task.id);
    }

    // Convert to ParallelGroup[]
    return Array.from(waves.entries())
      .sort(([a], [b]) => a - b)
      .map(([waveNum, taskIds]) => ({
        groupId: `wave_${waveNum}`,
        waveNumber: waveNum,
        taskIds,
        startAfter: waveNum > 0 ? [`wave_${waveNum - 1}`] : [],
      }));
  }

  /**
   * Assign resources to a task based on its type and requirements.
   */
  private assignResources(task: Task): TaskAssignment {
    const tier = DEFAULT_MODEL_TIERS[task.type] || 'standard';
    const resources = { ...TIER_RESOURCES[tier] };

    // Adjust based on instrument count
    if (task.instruments.length > 10) {
      resources.maxToolCalls = Math.min(task.instruments.length * 2, 50);
    }

    return {
      taskId: task.id,
      podType: task.targetPod,
      podInstance: `${task.targetPod}-1`, // Load balancer selects actual instance
      resources,
    };
  }

  private estimateDuration(
    waves: ParallelGroup[],
    assignments: TaskAssignment[]
  ): number {
    // Sum of max timeout per wave (worst case)
    let total = 0;
    for (const wave of waves) {
      const waveMax = Math.max(
        ...wave.taskIds.map(id => {
          const assignment = assignments.find(a => a.taskId === id);
          return assignment?.resources.timeoutMs || 300000;
        })
      );
      total += waveMax;
    }
    return total;
  }
}
```

---

## 8. Key Behaviors

### 8.1 Planning-Only Enforcement

The Queen has capabilities `['read', 'delegate', 'approve']` — never `write`, `execute`, or `financial`. She cannot perform side effects directly. This is enforced at the NAOS runtime level. If the Queen's LLM response includes a tool call for an instrument requiring `write`, the runtime rejects it with:

```typescript
throw new AgentError('CAPABILITY_MISSING', {
  agent: 'queen',
  requiredCapability: 'write',
  agentCapabilities: ['read', 'delegate', 'approve'],
  instrument: 'database_write',
});
```

### 8.2 Cycle Detection

The TaskPlanner validates the dependency graph using DFS-based cycle detection. If a cycle is found (e.g., Task A depends on Task B which depends on Task A), it throws:

```typescript
throw new PlanningError('Cycle detected in task graph: task_a → task_b → task_a', {
  cycle: ['task_a', 'task_b', 'task_a'],
});
```

### 8.3 Priority-Aware Scheduling

Tasks are topologically sorted with priority tie-breaking. Within each parallel wave, tasks with lower priority numbers execute first. Critical tasks (priority 0) always execute before high (1), medium (2), and low (3) tasks.

### 8.4 Cost Estimation

The Queen estimates costs per task based on historical averages from `naos_trajectories`. For tasks with no history, she uses default estimates based on model tier pricing:

| Model Tier | Cost per 1K Input Tokens | Cost per 1K Output Tokens |
|-----------|-------------------------|--------------------------|
| Economy | $0.0003 | $0.001 |
| Standard | $0.003 | $0.015 |
| Premium | $0.015 | $0.075 |
| Reasoning | $0.03 | $0.15 |

### 8.5 Adaptive Re-Planning

If a task fails during execution, the Queen can re-plan:

1. **Retry same pod** (default for transient errors): Re-run with failure context added to the prompt.
2. **Retry different pod**: If Smith fails on a code task, try Oracle for a data-focused approach.
3. **Simplify task**: Break the failed task into smaller sub-tasks.
4. **Skip and continue**: Mark the task as skipped and continue with dependents (if they can proceed without it).
5. **Abort dependents**: Skip the failed task and all tasks that depend on it.
6. **Escalate to HITL**: Request human guidance on how to proceed.

---

## 9. Code Examples

### Example 1: Basic Strategic Request

```typescript
import { Queen, DEFAULT_QUEEN_CONFIG } from '@mcv/agentic-os/queen';

const queen = new Queen({
  ...DEFAULT_QUEEN_CONFIG,
  id: 'queen-serpspace',
  planningModel: { model: 'claude-opus-4', tier: 'reasoning' },
  maxConcurrentTasks: 20,
  taskTimeout: { minutes: 30 },
  defaultCostBudgetUSD: 25.0,
});

const response = await queen.handleRequest({
  id: 'req_001',
  description: 'Analyze our Q1 marketing performance and draft a Q2 strategy document',
  context: {
    ventureId: 'serpspace',
    userId: 'user_ceo',
    budget: 10000,
    deadline: new Date('2026-02-15'),
  },
  priority: 'high',
});

console.log(`Status: ${response.status}`);           // completed
console.log(`Tasks completed: ${response.tasks.length}`); // 4
console.log(`Total cost: $${response.costUSD.toFixed(2)}`); // $0.82
console.log(`Duration: ${response.duration}ms`);      // 45230
console.log(`Summary: ${response.summary}`);
// Queen decomposed into:
//   Task 1 (Oracle): Fetch Q1 marketing data from analytics
//   Task 2 (Oracle): Analyze performance trends and KPIs
//   Task 3 (Scribe): Draft Q2 strategy document from analysis
//   Task 4 (Director): Create action items and timeline
```

### Example 2: Multi-Domain Request with HITL

```typescript
import { Queen } from '@mcv/agentic-os/queen';

const queen = new Queen(queenConfig);

// This request touches finance AND external communication = High Risk
const response = await queen.handleRequest({
  id: 'req_002',
  description: 'Process the $15,000 vendor invoice from Acme Corp and send a payment confirmation email',
  context: {
    ventureId: 'betedge',
    userId: 'user_ops_manager',
    metadata: {
      invoiceNumber: 'INV-ACME-2026-001',
      vendorId: 'vendor_acme',
    },
  },
  priority: 'high',
});

// The Queen will:
// 1. Decompose into: verify_invoice (Oracle) → process_payment (Ledger) → send_confirmation (Herald)
// 2. Assess risk: HIGH (financial transaction > $10K + external communication)
// 3. Require HITL: Manager ×1 + Finance ×1
// 4. Block until both approvers respond
// 5. Only dispatch to Ralph pods after approval
```

### Example 3: Task Graph Decomposition

```typescript
import { TaskPlanner } from '@mcv/agentic-os/queen';

const planner = new TaskPlanner(plannerConfig);

const tasks = await planner.decompose(
  {
    id: 'req_003',
    description: 'Launch a new blog post with SEO optimization and social media promotion',
    context: { ventureId: 'serpspace', userId: 'user_marketing' },
    priority: 'medium',
  },
  {
    intent: 'content_launch',
    complexity: 'moderate',
    domains: ['content', 'marketing', 'analytics'],
    constraints: {},
    confidence: 0.92,
  }
);

// Result: 5 tasks with dependencies
// Task 1 (Oracle):  Research SEO keywords         → no deps
// Task 2 (Scribe):  Write blog post draft         → depends on Task 1
// Task 3 (Scribe):  Edit and SEO-optimize post    → depends on Task 2
// Task 4 (Growth):  Create social media campaign   → depends on Task 2
// Task 5 (Herald):  Schedule and publish           → depends on Task 3, Task 4

// Parallel waves:
// Wave 0: [Task 1]
// Wave 1: [Task 2]
// Wave 2: [Task 3, Task 4]  ← parallel!
// Wave 3: [Task 5]
```

### Example 4: Resource Allocation

```typescript
import { ResourceAllocator } from '@mcv/agentic-os/queen';

const allocator = new ResourceAllocator(allocatorConfig);

const plan = await allocator.allocate(tasks);

console.log('Assignments:');
for (const a of plan.assignments) {
  console.log(`  ${a.taskId} → ${a.podType} (${a.resources.modelTier})`);
  console.log(`    Tokens: ${a.resources.maxTokens}, Tools: ${a.resources.maxToolCalls}`);
  console.log(`    Timeout: ${a.resources.timeoutMs}ms`);
}
// task_1 → oracle (standard)    Tokens: 4000, Tools: 10, Timeout: 180000ms
// task_2 → scribe (standard)    Tokens: 4000, Tools: 10, Timeout: 180000ms
// task_3 → scribe (standard)    Tokens: 4000, Tools: 10, Timeout: 180000ms
// task_4 → growth (standard)    Tokens: 4000, Tools: 10, Timeout: 180000ms
// task_5 → herald (economy)     Tokens: 2000, Tools: 5,  Timeout: 60000ms

console.log('Parallel Groups:');
for (const g of plan.parallelGroups) {
  console.log(`  ${g.groupId}: [${g.taskIds.join(', ')}] after: [${g.startAfter.join(', ')}]`);
}
// wave_0: [task_1] after: []
// wave_1: [task_2] after: [wave_0]
// wave_2: [task_3, task_4] after: [wave_1]
// wave_3: [task_5] after: [wave_2]

console.log(`Estimated total duration: ${plan.estimatedTotalDuration}ms`);
console.log(`Estimated total cost: $${plan.estimatedTotalCost.toFixed(2)}`);
```

### Example 5: Adaptive Re-Planning on Failure

```typescript
import { Queen } from '@mcv/agentic-os/queen';

const queen = new Queen({
  ...queenConfig,
  enableAdaptiveRePlanning: true,
  maxRePlanAttempts: 3,
});

// Internally, when a task fails:
// 1. Queen receives TaskExecutionError from SwarmDispatcher
// 2. Analyzes the error type
// 3. Selects re-plan strategy

// Example: Smith pod fails to deploy code due to test failures
// Strategy: retry_same_pod with failure context
//
// The retry prompt includes:
// "Previous attempt failed with: 3 unit tests failed in auth.test.ts
//  Specific failures: [test output...]
//  Please fix the failing tests and try again."

// Example: Oracle pod times out on a complex analytics query
// Strategy: simplify_task
//
// Original task "Analyze all Q1 data" → split into:
//   Sub-task A: "Analyze Q1 revenue data"
//   Sub-task B: "Analyze Q1 user engagement data"
//   Sub-task C: "Synthesize sub-analyses into summary"
```

### Example 6: Cross-Venture Portfolio Request

```typescript
import { Queen } from '@mcv/agentic-os/queen';

// The CEO wants a portfolio-wide analysis
const response = await queen.handleRequest({
  id: 'req_portfolio_001',
  description: 'Generate a consolidated Q1 performance report across all nine ventures with key metrics, risks, and opportunities',
  context: {
    ventureId: 'mcv-global', // Global venture context
    userId: 'user_ceo',
    budget: 50000,
    deadline: new Date('2026-02-20'),
    metadata: {
      ventures: ['betedge', 'serpspace', 'fullgain', 'futurestate', 'mcv-studios',
                 'assetedge', 'aetheriq', 'dreamaker', 'edgetoken'],
      format: 'executive_summary',
    },
  },
  priority: 'critical',
});

// Queen decomposes into 9 parallel Oracle tasks (one per venture) + 1 Scribe synthesis:
// Wave 0: [oracle_betedge, oracle_serpspace, oracle_fullgain, ...] (9 parallel)
// Wave 1: [scribe_consolidate] → depends on all Wave 0 tasks
// Wave 2: [director_action_items] → depends on Wave 1

// Total: 11 tasks, estimated $3.50, ~120 seconds
```

### Example 7: Risk Assessment

```typescript
import { RiskAssessor } from '@mcv/agentic-os/queen';

const assessor = new RiskAssessor();

const assessment = await assessor.assess(tasks, request);

console.log(`Overall risk: ${assessment.overallLevel}`);      // high
console.log(`HITL required: ${assessment.requiresApproval}`); // true
console.log(`Risks found: ${assessment.risks.length}`);       // 2

for (const risk of assessment.risks) {
  console.log(`  [${risk.level}] ${risk.type}: ${risk.description}`);
}
// [high] financial_transaction: Payment of $15,000 exceeds $10,000 threshold
// [medium] external_communication: Sending email to external vendor

console.log(`Required approvers:`);
for (const approver of assessment.approvers) {
  console.log(`  ${approver.role} × ${approver.count}`);
}
// manager × 1
// finance × 1
```

---

## 10. Error Codes

| Code | Name | Description | Recovery |
|------|------|-------------|----------|
| `QUE_001` | `PLANNING_CYCLE_DETECTED` | Cycle found in task dependency graph | Fix task dependencies |
| `QUE_002` | `PLANNING_MISSING_DEPENDENCY` | Task references non-existent dependency | Check task IDs |
| `QUE_003` | `PLANNING_MAX_DEPTH_EXCEEDED` | Task graph exceeds `maxGraphDepth` | Simplify request |
| `QUE_004` | `PLANNING_MAX_TASKS_EXCEEDED` | Too many tasks generated | Reduce scope or increase limit |
| `QUE_005` | `ALLOCATION_NO_POD_AVAILABLE` | No Ralph pod available for task type | Wait for pod availability |
| `QUE_006` | `ALLOCATION_BUDGET_EXCEEDED` | Estimated cost exceeds budget | Increase budget or reduce scope |
| `QUE_007` | `HITL_TIMEOUT` | HITL approval timed out | Escalate or retry |
| `QUE_008` | `HITL_REJECTED` | HITL approval was rejected | Modify request per feedback |
| `QUE_009` | `DISPATCH_PARTIAL_FAILURE` | Some tasks failed during execution | Check individual task errors |
| `QUE_010` | `DISPATCH_TOTAL_FAILURE` | All tasks failed during execution | Investigate root cause |
| `QUE_011` | `REPLAN_MAX_ATTEMPTS` | Maximum re-plan attempts exhausted | Manual intervention required |
| `QUE_012` | `REPLAN_FAILED` | Re-planning could not produce valid plan | Escalate to human |
| `QUE_013` | `ANALYSIS_LOW_CONFIDENCE` | Request analysis confidence below threshold | Clarify request |
| `QUE_014` | `CONTEXT_LOAD_FAILED` | Failed to load context from Memory | Check Memory subsystem |
| `QUE_015` | `CAPABILITY_VIOLATION` | Queen attempted forbidden action | Bug — Queen should never execute |

---

## 11. Security

### 11.1 Capability Enforcement

The Queen's capabilities are strictly limited:
- **read**: Can read data from Memory, query task status, view metrics.
- **delegate**: Can assign tasks to Ralph pods via SwarmDispatcher.
- **approve**: Can approve HITL escalations within her authority.

She **cannot**: write data, call external APIs, send emails, process payments, deploy code, or execute any tool directly.

### 11.2 Budget Controls

Every request has a cost budget. The Queen:
1. Estimates cost before dispatching.
2. Rejects requests that exceed budget without HITL approval.
3. Monitors cost accumulation during execution.
4. Can abort execution if actual costs deviate significantly from estimates.

### 11.3 HITL Integration

All high-risk operations pass through the HITL gateway. The Queen cannot bypass HITL for operations flagged by the risk assessor. This ensures human oversight of:
- Financial transactions above thresholds
- External communications
- Data modifications affecting user data
- System configuration changes
- Security-sensitive operations

### 11.4 Venture Isolation

Each venture has its own Queen instance. Queen cannot access data or dispatch tasks for a different venture. Cross-venture analysis (e.g., portfolio reports) requires the `CAPABILITY_GLOBAL_SYNTHESIS` flag, which is only available to the global Queen instance with Executive-level HITL approval.

### 11.5 Audit Trail

Every Queen decision is recorded:
- Request analysis and decomposition reasoning
- Risk assessment results
- Resource allocation decisions
- HITL routing decisions
- Re-planning decisions
- Final aggregation and response

All audit records are stored in `naos_task_events` and `naos_trajectories` for compliance review.

---

## 12. Configuration

| Config Key | Type | Default | Description |
|-----------|------|---------|-------------|
| `QUEEN_PLANNING_MODEL` | String | `claude-opus-4` | Model for task decomposition |
| `QUEEN_MAX_CONCURRENT_TASKS` | Integer | `20` | Maximum parallel tasks |
| `QUEEN_TASK_TIMEOUT_MS` | Integer | `900000` (15m) | Default task timeout |
| `QUEEN_DEFAULT_COST_BUDGET` | Float | `50.0` | Default cost budget per request |
| `QUEEN_MAX_GRAPH_DEPTH` | Integer | `5` | Maximum task graph depth |
| `QUEEN_ENABLE_ADAPTIVE_REPLAN` | Boolean | `true` | Enable adaptive re-planning |
| `QUEEN_MAX_REPLAN_ATTEMPTS` | Integer | `3` | Max re-plan attempts per task |
| `QUEEN_COST_THRESHOLD_HITL` | Float | `500.0` | Cost threshold triggering HITL |
| `QUEEN_ANALYSIS_MIN_CONFIDENCE` | Float | `0.7` | Minimum analysis confidence |
| `QUEEN_MEMORY_CONTEXT_TOKENS` | Integer | `8000` | Max tokens loaded from Memory |

---

## 13. Dependencies

| Package | Purpose |
|---------|---------|
| `@mcv/agentic-os/naos` | Base agent class, capability enforcement, metrics |
| `@mcv/agentic-os/swarm` | SwarmDispatcher for task execution |
| `@mcv/agentic-os/hitl` | HITLGateway for approval workflows |
| `@mcv/agentic-os/memory` | MemoryStore for context retrieval |
| `@mcv/agentic-os/prompts` | PromptBank for system and planning prompts |
| `@mcv/agentic-os/reasoning` | ReasoningEngine for complex decomposition |
| `@mcv/kernel` | Database, logging, error primitives |
| `@mcv/gateway` | LLM inference routing |
| `@mcv/identity` | Auth, permissions, RBAC for HITL |

---

## 14. Audit Events

| Event Code | Name | Data Captured |
|-----------|------|---------------|
| `QUE_EVT_001` | Request Received | Request ID, venture, user, priority |
| `QUE_EVT_002` | Analysis Complete | Intent, complexity, domains, confidence |
| `QUE_EVT_003` | Tasks Decomposed | Task count, graph depth, estimated cost |
| `QUE_EVT_004` | Risk Assessed | Overall level, risks, HITL requirement |
| `QUE_EVT_005` | Resources Allocated | Assignments, waves, model tiers |
| `QUE_EVT_006` | HITL Requested | Request ID, approvers, deadline |
| `QUE_EVT_007` | HITL Resolved | Decision, approvers, conditions |
| `QUE_EVT_008` | Dispatch Started | Wave count, task count |
| `QUE_EVT_009` | Task Completed | Task ID, status, cost, duration |
| `QUE_EVT_010` | Task Failed | Task ID, error, retry count |
| `QUE_EVT_011` | Re-Plan Triggered | Failed task, strategy, new tasks |
| `QUE_EVT_012` | Request Completed | Status, total cost, total duration |

---

*MCV Global Consortium — Queen Orchestrator Specification v3.2*
