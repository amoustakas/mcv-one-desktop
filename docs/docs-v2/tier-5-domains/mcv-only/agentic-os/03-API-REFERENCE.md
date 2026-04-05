# @mcv/agentic-os — API Reference

## Tier 5: MCV-Only Domains

**Package:** `@mcv/agentic-os`  
**Classification:** INTERNAL (MCV-Only)  
**Version:** 1.0.0  
**Last Updated:** February 9, 2026

---

## Table of Contents

1. [API Overview](#api-overview)
2. [NAOS — Natural Agent Operating System](#naos--natural-agent-operating-system)
   - [createSession](#createsession)
   - [executeTask](#executetask)
   - [getAgentStatus](#getagentstatus)
3. [Queen — Strategic Orchestrator](#queen--strategic-orchestrator)
   - [delegateTask](#delegatetask)
   - [getSwarmStatus](#getswarmstatus)
   - [planExecution](#planexecution)
4. [Scouts — Autonomous Monitoring Network](#scouts--autonomous-monitoring-network)
   - [registerScout](#registerscout)
   - [executeScoutTask](#executescouttask)
   - [getScoutCapabilities](#getscoutcapabilities)
5. [Memory — Neural Hive-Mind](#memory--neural-hive-mind)
   - [storeMemory](#storememory)
   - [retrieveMemory](#retrievememory)
   - [searchMemories](#searchmemories)
   - [consolidateMemories](#consolidatememories)
6. [HITL — Human-in-the-Loop](#hitl--human-in-the-loop)
   - [requestApproval](#requestapproval)
   - [submitDecision](#submitdecision)
   - [getApprovalQueue](#getapprovalqueue)
7. [Prompts — Prompt Engineering Infrastructure](#prompts--prompt-engineering-infrastructure)
   - [createTemplate](#createtemplate)
   - [renderPrompt](#renderprompt)
   - [listTemplates](#listtemplates)
   - [versionPrompt](#versionprompt)
8. [Reasoning — Agentic Kernel](#reasoning--agentic-kernel)
   - [startChain](#startchain)
   - [getTrace](#gettrace)
   - [evaluateResult](#evaluateresult)
   - [explainDecision](#explaindecision)
9. [Swarm — Ralph Execution Pods](#swarm--ralph-execution-pods)
   - [createSwarm](#createswarm)
   - [addAgent](#addagent)
   - [coordinateSwarm](#coordinateswarm)
   - [getSwarmResult](#getswarmresult)
10. [Type Definitions](#type-definitions)
11. [Zod Schemas](#zod-schemas)
12. [Event Types](#event-types)
13. [Error Codes](#error-codes)
14. [Configuration Reference](#configuration-reference)

---

## API Overview

The `@mcv/agentic-os` API is organized around eight submodules, each exposing service-layer methods that orchestrate the Neural Agentic Operating System. All methods are async, return typed results, and throw strongly-typed errors from the `AgentError` hierarchy.

### Authentication & Context

Every API call requires an `ExecutionContext` that carries identity, venture scope, and tracing metadata:

```typescript
import type { ExecutionContext } from '@mcv/agentic-os';

const context: ExecutionContext = {
  ventureId: 'betedge',               // Venture scope (RLS-enforced)
  userId: 'user_abc123',              // Authenticated user
  requestId: 'req_7f3a9b2c',         // Correlation ID for tracing
  traceId: 'trace_e4d2f1a8',         // OpenTelemetry trace ID
  sessionId: 'sess_001',             // Agent session (optional)
  permissions: ['agent:read', 'agent:write', 'hitl:approve'],
  metadata: {
    source: 'api',                   // api | cron | event | webhook
    ip: '10.0.0.1',
    userAgent: 'MCV-Dashboard/2.0',
  },
};
```

### Base URL & Transport

All service methods are invoked in-process via TypeScript imports. For external access, a REST API layer is exposed via Next.js 15 API routes:

| Route Prefix | Submodule | Description |
|---|---|---|
| `/api/agents` | NAOS | Agent lifecycle, registration, status |
| `/api/agents/queen` | Queen | Strategic requests, planning, delegation |
| `/api/agents/scouts` | Scouts | Scout deployment, monitoring, reports |
| `/api/agents/swarm` | Swarm | Pod management, task dispatch, results |
| `/api/agents/memory` | Memory | Store, retrieve, search, consolidate |
| `/api/agents/hitl` | HITL | Approval requests, decisions, queue |
| `/api/agents/prompts` | Prompts | Template CRUD, rendering, chains |
| `/api/agents/reasoning` | Reasoning | Reasoning chains, traces, evaluation |

### Response Envelope

All REST responses follow a standard envelope:

```typescript
interface APIResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;           // Machine-readable error code
    message: string;        // Human-readable description
    details?: unknown;      // Additional context
  };
  meta?: {
    requestId: string;
    duration: number;       // ms
    timestamp: string;      // ISO 8601
  };
}
```

---

## NAOS — Natural Agent Operating System

The NAOS submodule provides the foundational agent runtime: session management, task execution lifecycle, agent status monitoring, instrument registration, and capability enforcement.

### createSession

Creates a new agent execution session, initializing the agent runtime, loading instruments, hydrating working memory, and returning a session handle for subsequent operations.

```typescript
import { AgentRegistry, NAOSAgent } from '@mcv/agentic-os';

const registry = new AgentRegistry();

async function createSession(
  params: CreateSessionParams,
  context: ExecutionContext
): Promise<AgentSession>;
```

**Parameters:**

| Name | Type | Required | Description |
|---|---|---|---|
| `params.agentId` | `string` | Yes | UUID of the registered agent to activate |
| `params.sessionConfig` | `SessionConfig` | No | Override defaults for this session |
| `params.sessionConfig.maxDuration` | `Duration` | No | Maximum session lifetime. Default: `{ minutes: 30 }` |
| `params.sessionConfig.costBudgetUSD` | `number` | No | Per-session spending cap. Default: agent's `constraints.costBudgetUSD` |
| `params.sessionConfig.memoryScope` | `MemoryScope` | No | `'full'` | `'readonly'` | `'none'`. Default: `'full'` |
| `params.sessionConfig.instrumentOverrides` | `string[]` | No | Whitelist instruments for this session (subset of agent's registered instruments) |
| `params.initialContext` | `Record<string, unknown>` | No | Seed data injected into working memory at session start |
| `context` | `ExecutionContext` | Yes | Caller identity and venture scope |

**Returns:** `Promise<AgentSession>`

```typescript
interface AgentSession {
  sessionId: string;                  // Unique session identifier
  agentId: string;                    // Agent that owns this session
  ventureId: string;                  // Venture scope
  status: 'active' | 'paused' | 'completed' | 'terminated';
  startedAt: string;                  // ISO 8601
  expiresAt: string;                  // ISO 8601
  instruments: string[];              // Loaded instrument slugs
  capabilities: AgentCapability[];    // Active capabilities
  metrics: {
    tokensUsed: number;
    costUSD: number;
    toolCalls: number;
    requestsProcessed: number;
  };
  workingMemory: {
    entryCount: number;
    sizeBytes: number;
  };
}
```

**Example:**

```typescript
const session = await createSession({
  agentId: 'ralph-smith-betedge',
  sessionConfig: {
    maxDuration: { minutes: 60 },
    costBudgetUSD: 5.00,
    memoryScope: 'full',
  },
  initialContext: {
    repository: 'mcv-one/betedge-api',
    branch: 'develop',
  },
}, context);

console.log(session.sessionId);    // "sess_a1b2c3d4"
console.log(session.status);       // "active"
console.log(session.instruments);  // ["code_edit", "test_runner", "git_operations"]
```

**Errors:**

| Code | Description |
|---|---|
| `AGENT_NOT_FOUND` | No agent registered with the given `agentId` |
| `AGENT_INACTIVE` | Agent exists but is paused, in maintenance, or retired |
| `SESSION_LIMIT_EXCEEDED` | Agent already has the maximum number of concurrent sessions |
| `INSUFFICIENT_PERMISSIONS` | Caller lacks `agent:write` permission |
| `VENTURE_MISMATCH` | Agent's `ventureId` does not match the execution context |

---

### executeTask

Submits a task for execution within an active agent session. The NAOS runtime handles instrument invocation, capability checks, cost tracking, timeout enforcement, and trajectory logging. This is the core execution primitive used by higher-level orchestrators (Queen, Swarm).

```typescript
async function executeTask(
  params: ExecuteTaskParams,
  context: ExecutionContext
): Promise<TaskResult>;
```

**Parameters:**

| Name | Type | Required | Description |
|---|---|---|---|
| `params.sessionId` | `string` | Yes | Active session handle from `createSession` |
| `params.task` | `Task` | Yes | Task definition (title, description, type, instruments, inputs) |
| `params.resources` | `ResourceRequirements` | No | Execution resource constraints |
| `params.resources.maxTokens` | `number` | No | Token ceiling for this execution. Default: `8000` |
| `params.resources.maxToolCalls` | `number` | No | Maximum tool invocations. Default: `20` |
| `params.resources.timeoutMs` | `number` | No | Hard timeout in milliseconds. Default: `300000` (5 min) |
| `params.resources.modelTier` | `ModelTier` | No | `'economy'` | `'standard'` | `'premium'` | `'reasoning'`. Default: `'standard'` |
| `params.retryPolicy` | `RetryPolicy` | No | Retry behavior on failure |
| `params.retryPolicy.maxRetries` | `number` | No | Maximum retry attempts. Default: `3` |
| `params.retryPolicy.backoffMs` | `number` | No | Initial backoff delay. Default: `1000` |
| `params.retryPolicy.backoffMultiplier` | `number` | No | Exponential multiplier. Default: `2` |

**Returns:** `Promise<TaskResult>`

```typescript
interface TaskResult {
  taskId: string;                     // Task UUID
  sessionId: string;                  // Session that executed the task
  status: 'completed' | 'failed' | 'timeout' | 'cancelled';
  output: unknown;                    // Structured task output
  reasoning: string;                  // Agent's reasoning trace (summary)
  toolCalls: ToolCallRecord[];        // Ordered list of tool invocations
  metrics: {
    durationMs: number;
    tokensUsed: number;
    costUSD: number;
    toolCallCount: number;
    iterationCount: number;           // LLM loop iterations
    retryCount: number;
  };
  trajectory: {
    trajectoryId: string;             // Reference to full trajectory record
    outcome: 'success' | 'partial' | 'failure';
    rewardSignal: number;             // -1.0 to 1.0
    isExemplar: boolean;              // Flagged for few-shot use
  };
  error?: {
    code: string;
    message: string;
    failedAtStep: number;
  };
}
```

**Example:**

```typescript
const result = await executeTask({
  sessionId: 'sess_a1b2c3d4',
  task: {
    id: 'task_dev_042',
    type: 'development',
    title: 'Add input validation to user registration endpoint',
    description: 'Implement Zod schema validation for POST /api/users/register',
    targetPod: 'smith',
    instruments: ['code_edit', 'test_runner'],
    input: {
      endpoint: '/api/users/register',
      validationRules: {
        email: 'valid email format',
        password: 'min 8 chars, 1 upper, 1 number',
        name: 'min 2, max 100 chars',
      },
    },
    dependencies: [],
    priority: 2,
    estimatedDurationMs: 120000,
    estimatedCostUSD: 0.08,
  },
  resources: {
    maxTokens: 6000,
    maxToolCalls: 15,
    timeoutMs: 180000,
    modelTier: 'standard',
  },
}, context);

console.log(result.status);                   // "completed"
console.log(result.metrics.toolCallCount);     // 5
console.log(result.trajectory.rewardSignal);   // 0.92
```

**Errors:**

| Code | Description |
|---|---|
| `SESSION_NOT_FOUND` | No active session with the given ID |
| `SESSION_EXPIRED` | Session exceeded its `maxDuration` or `expiresAt` |
| `TASK_TIMEOUT` | Execution exceeded `resources.timeoutMs` |
| `COST_BUDGET_EXCEEDED` | Cumulative session cost exceeded `costBudgetUSD` |
| `INSTRUMENT_NOT_AVAILABLE` | Task references an instrument not loaded in the session |
| `CAPABILITY_DENIED` | Agent lacks the capability required by an instrument |
| `MAX_ITERATIONS_EXCEEDED` | LLM execution loop hit the 10-iteration ceiling |
| `RATE_LIMIT_EXCEEDED` | Instrument rate limit triggered |

---

### getAgentStatus

Retrieves the current operational status, active sessions, resource consumption, and performance metrics for a registered agent.

```typescript
async function getAgentStatus(
  params: GetAgentStatusParams,
  context: ExecutionContext
): Promise<AgentStatusReport>;
```

**Parameters:**

| Name | Type | Required | Description |
|---|---|---|---|
| `params.agentId` | `string` | Yes | UUID of the agent to query |
| `params.includeMetrics` | `boolean` | No | Include performance metrics. Default: `true` |
| `params.metricsPeriod` | `'hour'` \| `'day'` \| `'week'` \| `'month'` | No | Metrics aggregation window. Default: `'day'` |
| `params.includeSessions` | `boolean` | No | Include active sessions list. Default: `false` |

**Returns:** `Promise<AgentStatusReport>`

```typescript
interface AgentStatusReport {
  agentId: string;
  name: string;
  type: 'queen' | 'ralph' | 'scout' | 'specialist';
  status: 'active' | 'paused' | 'maintenance' | 'retired';
  ventureId: string;
  capabilities: AgentCapability[];
  instruments: string[];
  activeSessions: number;
  sessions?: AgentSession[];                // If includeSessions=true
  metrics?: {
    period: string;
    totalRequests: number;
    successfulRequests: number;
    failedRequests: number;
    avgLatencyMs: number;
    p95LatencyMs: number;
    totalTokensUsed: number;
    totalCostUSD: number;
    hitlRequests: number;
    hitlApprovalRate: number;
    toolCalls: number;
    toolCallBreakdown: Record<string, number>;
    avgTaskCompletionRate: number;
    avgUserSatisfaction: number;
  };
  health: {
    isHealthy: boolean;
    lastActivityAt: string;               // ISO 8601
    consecutiveFailures: number;
    errorRate: number;                     // 0.0 to 1.0
  };
}
```

**Example:**

```typescript
const status = await getAgentStatus({
  agentId: 'ralph-smith-betedge',
  includeMetrics: true,
  metricsPeriod: 'day',
  includeSessions: true,
}, context);

console.log(status.status);                      // "active"
console.log(status.activeSessions);               // 2
console.log(status.metrics?.totalRequests);        // 47
console.log(status.metrics?.avgLatencyMs);         // 1830
console.log(status.health.isHealthy);             // true
console.log(status.health.errorRate);             // 0.02
```

**Errors:**

| Code | Description |
|---|---|
| `AGENT_NOT_FOUND` | No agent registered with the given `agentId` |
| `INSUFFICIENT_PERMISSIONS` | Caller lacks `agent:read` permission |

---

## Queen — Strategic Orchestrator

The Queen submodule handles strategic request processing, task decomposition, resource planning, risk assessment, and delegation to Ralph execution pods.

### delegateTask

Submits a high-level intent to the Queen for decomposition and delegation. The Queen analyzes the request, builds a task graph, assesses risk, routes through HITL if required, dispatches to Ralph pods, and returns the aggregated result.

```typescript
import { Queen } from '@mcv/agentic-os';

async function delegateTask(
  params: DelegateTaskParams,
  context: ExecutionContext
): Promise<StrategicResponse>;
```

**Parameters:**

| Name | Type | Required | Description |
|---|---|---|---|
| `params.description` | `string` | Yes | Natural-language description of what needs to be accomplished |
| `params.priority` | `Priority` | No | `'low'` \| `'medium'` \| `'high'` \| `'critical'`. Default: `'medium'` |
| `params.deadline` | `string` | No | ISO 8601 deadline for completion |
| `params.budget` | `number` | No | Maximum cost in USD for this request |
| `params.constraints` | `DelegationConstraints` | No | Additional constraints on execution |
| `params.constraints.allowedPods` | `RalphPodType[]` | No | Restrict which pods can be assigned |
| `params.constraints.forbiddenInstruments` | `string[]` | No | Instruments that must not be used |
| `params.constraints.requireHITL` | `boolean` | No | Force HITL approval even for low-risk tasks |
| `params.constraints.maxTasks` | `number` | No | Maximum number of decomposed tasks. Default: `20` |
| `params.context` | `Record<string, unknown>` | No | Additional context for the Queen's planning |

**Returns:** `Promise<StrategicResponse>`

```typescript
interface StrategicResponse {
  requestId: string;
  status: 'completed' | 'partial' | 'failed' | 'rejected';
  tasks: TaskSummary[];                // All decomposed tasks with results
  result: unknown;                     // Aggregated final output
  reasoning: string;                   // Queen's strategic reasoning
  riskAssessment: RiskAssessment;      // Risk evaluation summary
  hitlDecisions: HITLDecisionSummary[];// HITL approvals/rejections (if any)
  metrics: {
    planningDurationMs: number;        // Time spent on decomposition/planning
    executionDurationMs: number;       // Time spent executing tasks
    totalDurationMs: number;           // Total wall-clock time
    totalTokensUsed: number;
    totalCostUSD: number;
    tasksCompleted: number;
    tasksFailed: number;
    tasksCancelled: number;
    parallelGroups: number;            // Number of parallel execution waves
  };
}
```

**Example:**

```typescript
const queen = new Queen(QUEEN_CONFIG);

const response = await queen.handleRequest({
  description: 'Audit our security posture: scan for vulnerabilities, review access logs, and generate a compliance report',
  priority: 'high',
  deadline: '2026-02-10T18:00:00Z',
  budget: 25.00,
  context: {
    ventureId: 'mcv-one',
    complianceFramework: 'SOC2',
    lastAuditDate: '2025-11-15',
  },
});

// Queen decomposes into:
// Task 1 (Shield): Scan infrastructure for known vulnerabilities
// Task 2 (Shield): Review access logs for anomalous patterns
// Task 3 (Oracle): Analyze scan + log results for risk scoring
// Task 4 (Scribe): Generate SOC2 compliance report from findings
// HITL Gate: Manager approval required before publishing report

console.log(response.status);                    // "completed"
console.log(response.tasks.length);              // 4
console.log(response.metrics.totalCostUSD);      // 3.42
console.log(response.metrics.parallelGroups);    // 2 (tasks 1+2 parallel, then 3, then 4)
```

**Errors:**

| Code | Description |
|---|---|
| `PLANNING_ERROR` | Queen failed to decompose the request into valid tasks |
| `CYCLE_DETECTED` | Task dependency graph contains a cycle |
| `BUDGET_EXCEEDED` | Estimated execution cost exceeds `params.budget` |
| `DEADLINE_INFEASIBLE` | Estimated execution time exceeds deadline |
| `HITL_REJECTED` | Human reviewer rejected the execution plan |
| `HITL_TIMEOUT` | HITL approval window expired without resolution |
| `ALL_TASKS_FAILED` | Every decomposed task failed execution |

---

### getSwarmStatus

Returns a real-time snapshot of the entire Ralph swarm: pod availability, active tasks, queue depths, resource utilization, and health indicators.

```typescript
async function getSwarmStatus(
  context: ExecutionContext
): Promise<SwarmStatusReport>;
```

**Parameters:**

| Name | Type | Required | Description |
|---|---|---|---|
| `context` | `ExecutionContext` | Yes | Caller identity and venture scope |

**Returns:** `Promise<SwarmStatusReport>`

```typescript
interface SwarmStatusReport {
  ventureId: string;
  timestamp: string;                         // ISO 8601
  pods: PodStatus[];
  queues: QueueStatus[];
  aggregate: {
    totalActiveTasks: number;
    totalQueuedTasks: number;
    totalCompletedToday: number;
    totalFailedToday: number;
    avgTaskDurationMs: number;
    totalCostTodayUSD: number;
    totalTokensToday: number;
    healthScore: number;                     // 0.0 to 1.0
  };
}

interface PodStatus {
  podType: RalphPodType;
  name: string;
  status: 'active' | 'paused' | 'maintenance';
  activeTasks: number;
  maxConcurrent: number;
  utilization: number;                       // 0.0 to 1.0
  avgLatencyMs: number;
  errorRate: number;
  completedToday: number;
  costTodayUSD: number;
}

interface QueueStatus {
  queueName: string;
  targetPod: RalphPodType;
  pendingCount: number;
  processingCount: number;
  oldestItemAge: number;                     // ms
  isPaused: boolean;
}
```

**Example:**

```typescript
const swarmStatus = await getSwarmStatus(context);

console.log(swarmStatus.aggregate.totalActiveTasks);   // 12
console.log(swarmStatus.aggregate.healthScore);        // 0.97
swarmStatus.pods.forEach(pod => {
  console.log(`${pod.name}: ${pod.activeTasks}/${pod.maxConcurrent} (${(pod.utilization * 100).toFixed(0)}%)`);
});
// Smith: 3/3 (100%)
// Growth: 2/5 (40%)
// Director: 1/10 (10%)
// ...
```

---

### planExecution

Performs task decomposition and resource planning **without executing**. Useful for previewing what the Queen would do, estimating costs, and reviewing the plan before committing to execution.

```typescript
async function planExecution(
  params: PlanExecutionParams,
  context: ExecutionContext
): Promise<ExecutionPlan>;
```

**Parameters:**

| Name | Type | Required | Description |
|---|---|---|---|
| `params.description` | `string` | Yes | Natural-language description of the intent |
| `params.priority` | `Priority` | No | Priority level. Default: `'medium'` |
| `params.constraints` | `DelegationConstraints` | No | Execution constraints |

**Returns:** `Promise<ExecutionPlan>`

```typescript
interface ExecutionPlan {
  requestId: string;
  analysis: RequestAnalysis;
  tasks: Task[];                              // Decomposed task graph
  parallelGroups: ParallelGroup[];            // Execution wave ordering
  resourcePlan: ResourcePlan;                 // Pod assignments + resource budgets
  riskAssessment: RiskAssessment;             // Risk evaluation
  estimates: {
    totalDurationMs: number;
    totalCostUSD: number;
    totalTokens: number;
    hitlRequired: boolean;
    hitlApprovers: ApproverConfig[];
  };
  warnings: string[];                          // Non-blocking concerns
}
```

**Example:**

```typescript
const plan = await planExecution({
  description: 'Migrate the user database from MySQL to PostgreSQL',
  priority: 'high',
}, context);

console.log(plan.tasks.length);                         // 6
console.log(plan.estimates.totalCostUSD);               // 2.15
console.log(plan.estimates.hitlRequired);               // true
console.log(plan.riskAssessment.overallLevel);          // "critical"
console.log(plan.warnings);
// ["Database migration is a destructive operation - recommend staging test first"]
```

---

## Scouts — Autonomous Monitoring Network

The Scouts submodule manages autonomous observer agents that monitor system health, detect anomalies, and generate alerts without performing any modifications.

### registerScout

Deploys a new scout agent to the monitoring network with a defined observation target, schedule, collection configuration, and alerting rules.

```typescript
import { ScoutNetwork } from '@mcv/agentic-os';

async function registerScout(
  params: RegisterScoutParams,
  context: ExecutionContext
): Promise<ScoutRegistration>;
```

**Parameters:**

| Name | Type | Required | Description |
|---|---|---|---|
| `params.name` | `string` | Yes | Human-readable scout name |
| `params.slug` | `string` | Yes | Unique slug within the venture |
| `params.description` | `string` | No | Description of what this scout monitors |
| `params.scoutType` | `ScoutType` | Yes | `'health'` \| `'performance'` \| `'security'` \| `'compliance'` \| `'cost'` \| `'quality'` \| `'custom'` |
| `params.target` | `ScoutTarget` | Yes | What to observe |
| `params.target.type` | `string` | Yes | `'service'` \| `'database'` \| `'endpoint'` \| `'external'` \| `'metric'` |
| `params.target.identifier` | `string` | Yes | Target identifier (URL, service name, metric path) |
| `params.schedule` | `ScoutSchedule` | Yes | When to run |
| `params.schedule.type` | `string` | Yes | `'cron'` \| `'interval'` \| `'event'` |
| `params.schedule.expression` | `string` | Yes | Cron expression, interval duration (`'5m'`, `'1h'`), or event type |
| `params.config` | `ScoutConfig` | Yes | Collection and alerting configuration |
| `params.config.collectors` | `CollectorConfig[]` | Yes | Data collection definitions |
| `params.config.thresholds` | `ThresholdConfig[]` | No | Alerting thresholds |
| `params.config.alertRules` | `AlertRule[]` | No | Alert routing rules |
| `params.config.anomalyDetection` | `AnomalyDetectorConfig` | No | Anomaly detection algorithm configuration |

**Returns:** `Promise<ScoutRegistration>`

```typescript
interface ScoutRegistration {
  scoutId: string;
  slug: string;
  status: 'active' | 'paused';
  nextRunAt: string;                   // ISO 8601
  collectors: string[];                // Registered collector identifiers
  thresholds: number;                  // Number of configured thresholds
  alertRules: number;                  // Number of configured alert rules
}
```

**Example:**

```typescript
const network = new ScoutNetwork();

const registration = await network.deployScout({
  name: 'BetEdge Odds Freshness',
  slug: 'betedge-odds-freshness',
  scoutType: 'quality',
  target: { type: 'service', identifier: 'betedge-odds-engine' },
  schedule: { type: 'interval', expression: '2m' },
  config: {
    collectors: [
      {
        type: 'http',
        url: 'https://api.betedge.com/v1/odds/freshness',
        method: 'GET',
        timeout: 5000,
        headers: { 'Authorization': 'Bearer {{BETEDGE_API_KEY}}' },
      },
    ],
    thresholds: [
      { metric: 'max_stale_seconds', operator: 'gt', value: 120, severity: 'warning' },
      { metric: 'max_stale_seconds', operator: 'gt', value: 300, severity: 'critical' },
      { metric: 'stale_market_count', operator: 'gt', value: 10, severity: 'warning' },
    ],
    alertRules: [
      { condition: { severity: 'warning' }, channels: ['slack'] },
      { condition: { severity: 'critical' }, channels: ['slack', 'pagerduty', 'email'] },
    ],
    anomalyDetection: {
      algorithm: 'zscore',
      sensitivity: 2.5,
      minDataPoints: 30,
      windowSize: 60,
    },
  },
});

console.log(registration.scoutId);     // "scout_f8e2a1b3"
console.log(registration.nextRunAt);   // "2026-02-09T12:14:00Z"
```

---

### executeScoutTask

Manually triggers a scout observation run outside the normal schedule. Returns the full observation report including collected metrics, detected anomalies, and any generated alerts.

```typescript
async function executeScoutTask(
  params: ExecuteScoutTaskParams,
  context: ExecutionContext
): Promise<ScoutReport>;
```

**Parameters:**

| Name | Type | Required | Description |
|---|---|---|---|
| `params.scoutId` | `string` | Yes | UUID of the scout to execute |
| `params.force` | `boolean` | No | Run even if recently executed. Default: `false` |
| `params.dryRun` | `boolean` | No | Collect data but don't generate alerts. Default: `false` |

**Returns:** `Promise<ScoutReport>`

```typescript
interface ScoutReport {
  scoutId: string;
  scoutName: string;
  executedAt: string;                         // ISO 8601
  durationMs: number;
  observations: Observation[];
  anomalies: AnomalyResult[];
  alerts: AlertSummary[];
  metrics: Record<string, number>;            // Collected metric values
  status: 'healthy' | 'degraded' | 'critical';
  nextRunAt: string;                          // ISO 8601
}

interface Observation {
  observationType: string;
  severity: 'info' | 'warning' | 'error' | 'critical';
  metrics: Record<string, number>;
  anomalies: AnomalyResult[];
  alertGenerated: boolean;
  observedAt: string;
}

interface AnomalyResult {
  metric: string;
  value: number;
  expectedRange: { min: number; max: number };
  score: number;                              // 0.0 to 1.0 (1.0 = most anomalous)
  algorithm: AnomalyAlgorithm;
  isAnomaly: boolean;
}
```

**Example:**

```typescript
const report = await executeScoutTask({
  scoutId: 'scout_f8e2a1b3',
  force: true,
}, context);

console.log(report.status);                    // "degraded"
console.log(report.anomalies.length);          // 1
console.log(report.anomalies[0].metric);       // "max_stale_seconds"
console.log(report.anomalies[0].score);        // 0.87
console.log(report.alerts.length);             // 1
```

---

### getScoutCapabilities

Returns the complete capabilities manifest for the scout network: available scout types, supported algorithms, collector types, and the current deployment summary.

```typescript
async function getScoutCapabilities(
  context: ExecutionContext
): Promise<ScoutCapabilitiesReport>;
```

**Returns:** `Promise<ScoutCapabilitiesReport>`

```typescript
interface ScoutCapabilitiesReport {
  scoutTypes: ScoutType[];
  collectorTypes: string[];                   // "http" | "tcp" | "database" | "metrics" | "custom"
  anomalyAlgorithms: AnomalyAlgorithm[];     // "zscore" | "iqr" | "isolation_forest" | "prophet" | "lstm"
  alertChannels: string[];                    // "slack" | "email" | "pagerduty" | "webhook" | "in_app"
  deployment: {
    totalScouts: number;
    activeScouts: number;
    pausedScouts: number;
    scoutsByType: Record<ScoutType, number>;
    totalObservationsToday: number;
    totalAlertsToday: number;
    openAlerts: number;
  };
}
```

---

## Memory — Neural Hive-Mind

The Memory submodule provides cognitive persistence: storing, retrieving, searching, and consolidating agent memories across episodic, semantic, procedural, and working memory types.

### storeMemory

Stores a new memory entry in the Neural Hive-Mind. Automatically generates vector embeddings, indexes in the knowledge graph (for semantic memories), and updates relevance scores.

```typescript
import { MemoryStore } from '@mcv/agentic-os';

async function storeMemory(
  params: StoreMemoryParams,
  context: ExecutionContext
): Promise<MemoryStorageResult>;
```

**Parameters:**

| Name | Type | Required | Description |
|---|---|---|---|
| `params.agentId` | `string` | No | Agent that owns this memory. `null` = shared venture memory |
| `params.memoryType` | `MemoryType` | Yes | `'episodic'` \| `'semantic'` \| `'procedural'` \| `'working'` |
| `params.content` | `string \| Record<string, unknown>` | Yes | Memory content (text or structured data) |
| `params.summary` | `string` | No | Short summary for display/indexing |
| `params.category` | `string` | No | Categorization label |
| `params.importance` | `number` | No | 0.00–1.00 importance score. Default: `0.50` |
| `params.confidence` | `number` | No | 0.00–1.00 confidence score. Default: `1.00` |
| `params.tags` | `string[]` | No | Filterable tags |
| `params.relatedEntities` | `EntityRef[]` | No | Links to knowledge graph entities |
| `params.sourceType` | `string` | No | `'task'` \| `'conversation'` \| `'explicit'` \| `'inferred'` |
| `params.sourceId` | `string` | No | Reference to the source record |
| `params.validUntil` | `string` | No | ISO 8601 expiry for time-bounded knowledge |
| `params.metadata` | `Record<string, unknown>` | No | Arbitrary metadata |

**Returns:** `Promise<MemoryStorageResult>`

```typescript
interface MemoryStorageResult {
  memoryId: string;                    // Stored memory UUID
  embeddingGenerated: boolean;         // Whether vector embedding was created
  knowledgeGraphUpdated: boolean;      // Whether Neo4j was updated (semantic only)
  contradictions: ContradictionReport[];// Any detected contradictions with existing memories
  consolidationScheduled: boolean;     // Whether this triggered a consolidation run
}
```

**Example:**

```typescript
const store = new MemoryStore();

const result = await store.store({
  agentId: 'ralph-oracle-serpspace',
  memoryType: 'semantic',
  content: {
    subject: 'SerpSpace',
    predicate: 'has_monthly_active_users',
    object: '12,500',
    details: { as_of: '2026-02-01', source: 'analytics_dashboard', trend: 'up_8_percent' },
  },
  summary: 'SerpSpace has 12,500 MAU as of Feb 2026 (+8% MoM)',
  importance: 0.85,
  confidence: 0.95,
  tags: ['serpspace', 'metrics', 'mau', 'growth'],
  sourceType: 'task',
  sourceId: 'task_analytics_042',
});

console.log(result.memoryId);                 // "mem_9a8b7c6d"
console.log(result.knowledgeGraphUpdated);    // true
console.log(result.contradictions.length);    // 0
```

---

### retrieveMemory

Retrieves relevant memories using hybrid search: vector similarity (pgvector), knowledge graph traversal (Neo4j), keyword filtering, and recency-weighted ranking.

```typescript
async function retrieveMemory(
  params: RetrieveMemoryParams,
  context: ExecutionContext
): Promise<MemoryRetrievalResult>;
```

**Parameters:**

| Name | Type | Required | Description |
|---|---|---|---|
| `params.query` | `string` | Yes | Natural-language search query |
| `params.agentId` | `string` | No | Scope to a specific agent's memories |
| `params.types` | `MemoryType[]` | No | Filter by memory type(s). Default: all types |
| `params.tags` | `string[]` | No | Filter by tags (OR logic) |
| `params.minImportance` | `number` | No | Minimum importance threshold. Default: `0.0` |
| `params.minConfidence` | `number` | No | Minimum confidence threshold. Default: `0.0` |
| `params.recencyBias` | `number` | No | 0.0–1.0: weight recent results vs. relevance. Default: `0.3` |
| `params.limit` | `number` | No | Maximum results to return. Default: `10` |
| `params.includeArchived` | `boolean` | No | Include archived memories. Default: `false` |
| `params.deepRAG` | `boolean` | No | Enable recursive retrieval with gap filling. Default: `false` |
| `params.deepRAGMaxDepth` | `number` | No | Maximum Deep RAG recursion depth. Default: `3` |

**Returns:** `Promise<MemoryRetrievalResult>`

```typescript
interface MemoryRetrievalResult {
  memories: ScoredMemory[];
  totalMatches: number;
  searchStrategy: string;              // "vector" | "graph" | "hybrid" | "deep_rag"
  deepRAG?: {
    depth: number;                     // Actual recursion depth used
    gapsDetected: KnowledgeGap[];      // Identified gaps in knowledge
    gapsFilled: number;                // Gaps resolved via recursive search
  };
  metrics: {
    searchDurationMs: number;
    vectorSearchMs: number;
    graphSearchMs: number;
    rerankingMs: number;
  };
}

interface ScoredMemory extends MemoryEntry {
  relevanceScore: number;              // 0.0 to 1.0 combined score
  vectorScore: number;                 // Raw cosine similarity
  recencyScore: number;                // Time-decay score
  graphScore: number;                  // Knowledge graph proximity
  matchReason: string;                 // Why this memory was selected
}
```

**Example:**

```typescript
const result = await store.retrieve({
  query: 'What marketing strategies worked for BetEdge last quarter?',
  types: ['episodic', 'semantic'],
  tags: ['betedge', 'marketing'],
  minImportance: 0.5,
  recencyBias: 0.4,
  limit: 5,
  deepRAG: true,
  deepRAGMaxDepth: 2,
});

console.log(result.memories.length);                    // 5
console.log(result.searchStrategy);                     // "deep_rag"
console.log(result.deepRAG?.gapsDetected.length);       // 1
console.log(result.deepRAG?.gapsFilled);                // 1
console.log(result.metrics.searchDurationMs);           // 340
result.memories.forEach(m => {
  console.log(`[${m.relevanceScore.toFixed(2)}] ${m.summary}`);
});
```

---

### searchMemories

Performs a structured search across the memory store with advanced filtering, pagination, and aggregation support. Unlike `retrieveMemory` (which is optimized for relevance), `searchMemories` supports exact filters, date ranges, and aggregate analytics.

```typescript
async function searchMemories(
  params: SearchMemoriesParams,
  context: ExecutionContext
): Promise<MemorySearchResult>;
```

**Parameters:**

| Name | Type | Required | Description |
|---|---|---|---|
| `params.filters` | `MemoryFilters` | Yes | Structured filter criteria |
| `params.filters.agentIds` | `string[]` | No | Filter to specific agents |
| `params.filters.memoryTypes` | `MemoryType[]` | No | Filter by memory type |
| `params.filters.tags` | `string[]` | No | Filter by tags |
| `params.filters.categories` | `string[]` | No | Filter by category |
| `params.filters.importanceRange` | `[number, number]` | No | Min/max importance |
| `params.filters.dateRange` | `{ from: string; to: string }` | No | ISO 8601 date range |
| `params.filters.status` | `MemoryStatus[]` | No | `'active'` \| `'archived'` \| `'superseded'` |
| `params.filters.textSearch` | `string` | No | Full-text search across content |
| `params.sort` | `MemorySort` | No | Sort field and direction. Default: `{ field: 'createdAt', direction: 'desc' }` |
| `params.pagination` | `Pagination` | No | `{ page: number; pageSize: number }`. Default: `{ page: 1, pageSize: 20 }` |
| `params.aggregate` | `boolean` | No | Include aggregate statistics. Default: `false` |

**Returns:** `Promise<MemorySearchResult>`

```typescript
interface MemorySearchResult {
  memories: MemoryEntry[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  aggregates?: {
    byType: Record<MemoryType, number>;
    byCategory: Record<string, number>;
    avgImportance: number;
    totalEntries: number;
    dateDistribution: { date: string; count: number }[];
  };
}
```

---

### consolidateMemories

Triggers the memory consolidation engine, which processes raw episodic memories into distilled semantic knowledge. This runs automatically on a 4-hour cron, but can be triggered manually for immediate knowledge synthesis.

```typescript
async function consolidateMemories(
  params: ConsolidateParams,
  context: ExecutionContext
): Promise<ConsolidationResult>;
```

**Parameters:**

| Name | Type | Required | Description |
|---|---|---|---|
| `params.agentId` | `string` | No | Consolidate for a specific agent. `null` = all agents |
| `params.since` | `string` | No | Only consolidate memories created after this ISO 8601 timestamp |
| `params.dryRun` | `boolean` | No | Preview consolidation without writing. Default: `false` |
| `params.minEpisodes` | `number` | No | Minimum episodic memories required to trigger. Default: `5` |

**Returns:** `Promise<ConsolidationResult>`

```typescript
interface ConsolidationResult {
  episodesProcessed: number;           // Raw episodic memories consumed
  factsExtracted: number;              // New semantic facts created
  factsUpdated: number;                // Existing facts updated with new confidence
  contradictionsResolved: number;      // Contradictions identified and resolved
  knowledgeGraphNodes: number;         // New Neo4j nodes created
  knowledgeGraphEdges: number;         // New Neo4j relationships created
  durationMs: number;
  costUSD: number;                     // LLM cost for synthesis
  preview?: ConsolidationPreview;      // Only if dryRun=true
}
```

**Example:**

```typescript
const result = await consolidateMemories({
  agentId: 'ralph-oracle-betedge',
  since: '2026-02-08T00:00:00Z',
  dryRun: false,
}, context);

console.log(result.episodesProcessed);          // 23
console.log(result.factsExtracted);             // 8
console.log(result.contradictionsResolved);     // 1
console.log(result.knowledgeGraphNodes);        // 12
console.log(result.durationMs);                 // 4200
```

---

## HITL — Human-in-the-Loop

The HITL submodule manages human oversight workflows: approval requests, decision recording, queue management, escalation, and audit trails.

### requestApproval

Creates a new HITL approval request, notifies the required approvers via all configured channels, and returns a tracking handle. The approval workflow proceeds asynchronously; poll via `getApprovalQueue` or listen for events.

```typescript
import { HITLGateway } from '@mcv/agentic-os';

async function requestApproval(
  params: RequestApprovalParams,
  context: ExecutionContext
): Promise<HITLRequestHandle>;
```

**Parameters:**

| Name | Type | Required | Description |
|---|---|---|---|
| `params.title` | `string` | Yes | Human-readable title for the approval request |
| `params.description` | `string` | Yes | Detailed description of what's being approved |
| `params.requestType` | `HITLRequestType` | Yes | `'task_approval'` \| `'financial_approval'` \| `'data_access'` \| `'external_communication'` \| `'configuration_change'` \| `'escalation'` |
| `params.tasks` | `Task[]` | Yes | Tasks pending approval |
| `params.riskAssessment` | `RiskAssessment` | Yes | Risk evaluation from the Queen |
| `params.requiredApprovers` | `ApproverConfig[]` | Yes | Required approver roles and counts |
| `params.timeout` | `Duration` | Yes | Approval deadline (e.g., `{ hours: 4 }`) |
| `params.context` | `Record<string, unknown>` | No | Additional context for reviewers |
| `params.workflowConfig` | `ApprovalWorkflowConfig` | No | Multi-step workflow definition |
| `params.workflowConfig.steps` | `ApprovalStep[]` | No | Sequential approval steps |
| `params.workflowConfig.quorum` | `QuorumConfig` | No | `{ mode: 'majority' \| 'unanimous' \| 'threshold', threshold?: number }` |
| `params.escalationRules` | `EscalationRule[]` | No | Auto-escalation rules for timeout scenarios |
| `params.notifyChannels` | `string[]` | No | Override notification channels. Default: `['email', 'slack', 'in_app']` |

**Returns:** `Promise<HITLRequestHandle>`

```typescript
interface HITLRequestHandle {
  requestId: string;                   // Unique request identifier
  status: 'pending';
  deadline: string;                    // ISO 8601
  approversNotified: number;           // Count of approvers notified
  notificationChannels: string[];      // Channels used
  estimatedResponseTime: string;       // Based on historical data
  trackingUrl: string;                 // Dashboard URL to monitor this request
}
```

**Example:**

```typescript
const hitl = new HITLGateway();

const handle = await hitl.requestApproval({
  title: 'Publish SerpSpace Q1 Marketing Report',
  description: 'Approve publication of the Q1 marketing performance report to external stakeholders via email blast',
  requestType: 'external_communication',
  tasks: [publishTask],
  riskAssessment: {
    risks: [{
      taskId: 'task_pub_001',
      type: 'external_communication',
      level: 'medium',
      description: 'Sending marketing data to 2,400 stakeholders',
    }],
    overallLevel: 'medium',
    requiresApproval: true,
    approvers: [{ role: 'manager', count: 1 }],
  },
  requiredApprovers: [{ role: 'manager', count: 1 }],
  timeout: { hours: 8 },
  context: {
    recipientCount: 2400,
    reportPreviewUrl: 'https://dashboard.mcv.one/reports/serpspace-q1',
  },
});

console.log(handle.requestId);               // "hitl_req_5d4e3f2g"
console.log(handle.approversNotified);       // 3
console.log(handle.estimatedResponseTime);   // "2h 15m"
```

---

### submitDecision

Records an individual approver's decision (approve, reject, delegate, abstain) for a pending HITL request. Automatically checks quorum thresholds and advances multi-step workflows.

```typescript
async function submitDecision(
  params: SubmitDecisionParams,
  context: ExecutionContext
): Promise<DecisionResult>;
```

**Parameters:**

| Name | Type | Required | Description |
|---|---|---|---|
| `params.requestId` | `string` | Yes | HITL request UUID |
| `params.decision` | `ApprovalDecision` | Yes | `'approve'` \| `'reject'` \| `'delegate'` \| `'abstain'` |
| `params.comments` | `string` | No | Explanation or notes |
| `params.conditions` | `Record<string, unknown>` | No | Conditional approval constraints (e.g., "approved if amount < $10k") |
| `params.delegateTo` | `string` | No | User UUID to delegate to (required if `decision` is `'delegate'`) |
| `params.delegationReason` | `string` | No | Reason for delegation |

**Returns:** `Promise<DecisionResult>`

```typescript
interface DecisionResult {
  requestId: string;
  decisionRecorded: boolean;
  currentStatus: 'pending' | 'approved' | 'rejected' | 'expired' | 'cancelled';
  quorumProgress: {
    required: number;                  // Total approvals needed
    received: number;                  // Approvals received so far
    rejected: number;                  // Rejections received
    remaining: number;                 // Approvals still needed
  };
  workflowStep?: {
    currentStep: number;
    totalSteps: number;
    stepName: string;
  };
  isResolved: boolean;                 // Whether this decision resolved the request
  nextAction?: string;                 // What happens next
}
```

**Example:**

```typescript
const result = await submitDecision({
  requestId: 'hitl_req_5d4e3f2g',
  decision: 'approve',
  comments: 'Report looks accurate. Approved for distribution.',
  conditions: { maxRecipients: 3000 },
}, context);

console.log(result.currentStatus);           // "approved"
console.log(result.isResolved);              // true
console.log(result.quorumProgress);          // { required: 1, received: 1, rejected: 0, remaining: 0 }
console.log(result.nextAction);              // "Task execution will proceed"
```

---

### getApprovalQueue

Returns the pending approval queue for a specific approver or venture, with filtering, sorting, and pagination support.

```typescript
async function getApprovalQueue(
  params: GetApprovalQueueParams,
  context: ExecutionContext
): Promise<ApprovalQueueResult>;
```

**Parameters:**

| Name | Type | Required | Description |
|---|---|---|---|
| `params.approverId` | `string` | No | Filter to requests assigned to this approver |
| `params.status` | `HITLStatus[]` | No | Filter by status. Default: `['pending']` |
| `params.requestTypes` | `HITLRequestType[]` | No | Filter by request type |
| `params.riskLevels` | `RiskLevel[]` | No | Filter by risk level |
| `params.sort` | `QueueSort` | No | Sort criteria. Default: `{ field: 'deadline', direction: 'asc' }` |
| `params.pagination` | `Pagination` | No | Default: `{ page: 1, pageSize: 20 }` |

**Returns:** `Promise<ApprovalQueueResult>`

```typescript
interface ApprovalQueueResult {
  requests: HITLRequestSummary[];
  total: number;
  page: number;
  pageSize: number;
  urgentCount: number;                 // Requests expiring within 1 hour
  overdueCount: number;                // Requests past their deadline
  stats: {
    byType: Record<HITLRequestType, number>;
    byRiskLevel: Record<RiskLevel, number>;
    avgPendingDuration: number;        // ms
  };
}

interface HITLRequestSummary {
  requestId: string;
  title: string;
  requestType: HITLRequestType;
  riskLevel: RiskLevel;
  status: HITLStatus;
  deadline: string;                    // ISO 8601
  createdAt: string;                   // ISO 8601
  timeRemaining: number;              // ms until deadline
  sourceAgent: string;                 // Agent that requested approval
  quorumProgress: { required: number; received: number };
  isUrgent: boolean;                   // < 1 hour remaining
}
```

---

## Prompts — Prompt Engineering Infrastructure

The Prompts submodule manages the versioned prompt template registry, variable validation, Handlebars-style rendering, and chain orchestration.

### createTemplate

Registers a new prompt template in the bank with typed variables, validation rules, model hints, and categorization metadata.

```typescript
import { PromptBank } from '@mcv/agentic-os';

async function createTemplate(
  params: CreateTemplateParams,
  context: ExecutionContext
): Promise<TemplateRegistration>;
```

**Parameters:**

| Name | Type | Required | Description |
|---|---|---|---|
| `params.name` | `string` | Yes | Unique template name |
| `params.slug` | `string` | Yes | URL-safe identifier |
| `params.category` | `PromptCategory` | Yes | `'system'` \| `'task'` \| `'reasoning'` \| `'formatting'` \| `'safety'` \| `'persona'` \| `'tool_use'` |
| `params.subcategory` | `string` | No | Sub-categorization |
| `params.description` | `string` | No | Template description |
| `params.template` | `string` | Yes | Handlebars template body |
| `params.variables` | `PromptVariable[]` | Yes | Variable definitions |
| `params.variables[].name` | `string` | Yes | Variable name (matches `{{name}}` in template) |
| `params.variables[].type` | `string` | Yes | `'string'` \| `'number'` \| `'boolean'` \| `'array'` \| `'object'` |
| `params.variables[].required` | `boolean` | Yes | Whether the variable must be provided |
| `params.variables[].default` | `unknown` | No | Default value if not provided |
| `params.variables[].description` | `string` | No | Description for documentation |
| `params.variables[].validation` | `ZodSchema` | No | Zod schema for value validation |
| `params.recommendedModels` | `string[]` | No | Models this template works best with |
| `params.maxTokens` | `number` | No | Recommended max tokens for responses |
| `params.temperature` | `number` | No | Recommended temperature |
| `params.tags` | `string[]` | No | Searchable tags |
| `params.examples` | `PromptExample[]` | No | Input/output example pairs |
| `params.status` | `PromptStatus` | No | `'draft'` \| `'active'`. Default: `'draft'` |

**Returns:** `Promise<TemplateRegistration>`

```typescript
interface TemplateRegistration {
  templateId: string;
  slug: string;
  version: number;
  status: PromptStatus;
  variableCount: number;
  estimatedTokens: number;             // Template token count (without variables)
}
```

**Example:**

```typescript
const bank = new PromptBank();

const registration = await bank.register({
  name: 'Security Audit Report Generator',
  slug: 'security-audit-report',
  category: 'task',
  description: 'Generates a structured security audit report from scan findings',
  template: `You are a security analyst generating a formal audit report.

## Audit Scope
- Framework: {{compliance_framework}}
- Scan Date: {{scan_date}}
- Systems Scanned: {{systems_count}}

## Findings
{{findings_json}}

Generate a professional security audit report with:
1. Executive Summary
2. Critical Findings (sorted by severity)
3. Risk Ratings with CVSS scores
4. Recommended Remediation Steps
5. Compliance Status ({{compliance_framework}})
6. Next Steps and Timeline

{{#if include_technical_details}}
Include full technical details with CVE references.
{{/if}}

Format as markdown. Target length: {{target_length}} words.`,
  variables: [
    { name: 'compliance_framework', type: 'string', required: true, description: 'SOC2, ISO27001, HIPAA, etc.' },
    { name: 'scan_date', type: 'string', required: true, description: 'Date of the security scan' },
    { name: 'systems_count', type: 'number', required: true, description: 'Number of systems scanned' },
    { name: 'findings_json', type: 'string', required: true, description: 'JSON array of scan findings' },
    { name: 'include_technical_details', type: 'boolean', required: false, default: true },
    { name: 'target_length', type: 'number', required: false, default: 2000 },
  ],
  recommendedModels: ['claude-sonnet-4', 'claude-opus-4'],
  maxTokens: 4000,
  temperature: 0.3,
  tags: ['security', 'audit', 'compliance', 'report'],
  status: 'active',
});

console.log(registration.templateId);          // "prompt_8f7e6d5c"
console.log(registration.version);             // 1
```

---

### renderPrompt

Renders a prompt template by resolving variables, applying defaults, validating types, and producing the final prompt string. Increments the template's usage counter.

```typescript
async function renderPrompt(
  params: RenderPromptParams,
  context: ExecutionContext
): Promise<RenderedPrompt>;
```

**Parameters:**

| Name | Type | Required | Description |
|---|---|---|---|
| `params.templateId` | `string` | Yes | Template UUID or slug |
| `params.version` | `number` | No | Specific version. Default: latest active |
| `params.variables` | `Record<string, unknown>` | Yes | Variable values to inject |
| `params.options` | `RenderOptions` | No | Rendering options |
| `params.options.strict` | `boolean` | No | Fail on unknown variables. Default: `true` |
| `params.options.sanitize` | `boolean` | No | Strip HTML/script from variable values. Default: `true` |
| `params.options.maxLength` | `number` | No | Truncate output at character limit |

**Returns:** `Promise<RenderedPrompt>`

```typescript
interface RenderedPrompt {
  prompt: string;                      // Fully rendered prompt text
  templateId: string;
  templateVersion: number;
  variablesUsed: string[];             // Variables that were resolved
  variablesDefaulted: string[];        // Variables that used default values
  tokenEstimate: number;               // Estimated token count
  warnings: string[];                  // Non-fatal rendering issues
}
```

**Example:**

```typescript
const rendered = await bank.render('security-audit-report', {
  compliance_framework: 'SOC2',
  scan_date: '2026-02-09',
  systems_count: 42,
  findings_json: JSON.stringify(scanFindings),
});

console.log(rendered.tokenEstimate);           // 850
console.log(rendered.variablesDefaulted);      // ["include_technical_details", "target_length"]
console.log(rendered.prompt.substring(0, 80));
// "You are a security analyst generating a formal audit report.\n\n## Audit Scope..."
```

**Errors:**

| Code | Description |
|---|---|
| `TEMPLATE_NOT_FOUND` | No template with the given ID/slug |
| `TEMPLATE_INACTIVE` | Template exists but is in `draft` or `deprecated` status |
| `VARIABLE_MISSING` | A required variable was not provided |
| `VARIABLE_INVALID` | A variable value failed Zod schema validation |
| `RENDER_ERROR` | Handlebars rendering failed (malformed template) |

---

### listTemplates

Searches and lists prompt templates with filtering by category, tags, status, and free-text search.

```typescript
async function listTemplates(
  params: ListTemplatesParams,
  context: ExecutionContext
): Promise<TemplateListResult>;
```

**Parameters:**

| Name | Type | Required | Description |
|---|---|---|---|
| `params.category` | `PromptCategory` | No | Filter by category |
| `params.subcategory` | `string` | No | Filter by subcategory |
| `params.tags` | `string[]` | No | Filter by tags (OR logic) |
| `params.status` | `PromptStatus[]` | No | Filter by status. Default: `['active']` |
| `params.search` | `string` | No | Full-text search across name, description, template body |
| `params.sort` | `TemplateSort` | No | Sort criteria. Default: `{ field: 'usageCount', direction: 'desc' }` |
| `params.pagination` | `Pagination` | No | Default: `{ page: 1, pageSize: 20 }` |

**Returns:** `Promise<TemplateListResult>`

```typescript
interface TemplateListResult {
  templates: PromptTemplateSummary[];
  total: number;
  page: number;
  pageSize: number;
  categories: Record<PromptCategory, number>; // Facet counts
}

interface PromptTemplateSummary {
  templateId: string;
  name: string;
  slug: string;
  category: PromptCategory;
  description: string;
  version: number;
  status: PromptStatus;
  variableCount: number;
  usageCount: number;
  avgQualityScore: number;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}
```

---

### versionPrompt

Creates a new version of an existing prompt template. The previous version remains accessible by explicit version number, but the new version becomes the `latest`. Immutable after activation.

```typescript
async function versionPrompt(
  params: VersionPromptParams,
  context: ExecutionContext
): Promise<VersionResult>;
```

**Parameters:**

| Name | Type | Required | Description |
|---|---|---|---|
| `params.templateId` | `string` | Yes | Template UUID or slug to version |
| `params.template` | `string` | No | Updated template body. Default: carry forward |
| `params.variables` | `PromptVariable[]` | No | Updated variable definitions |
| `params.changelog` | `string` | Yes | Description of changes in this version |
| `params.status` | `PromptStatus` | No | `'draft'` \| `'active'`. Default: `'draft'` |
| `params.deprecatePrevious` | `boolean` | No | Deprecate the previous active version. Default: `false` |

**Returns:** `Promise<VersionResult>`

```typescript
interface VersionResult {
  templateId: string;
  previousVersion: number;
  newVersion: number;
  status: PromptStatus;
  previousDeprecated: boolean;
  diff: {
    templateChanged: boolean;
    variablesAdded: string[];
    variablesRemoved: string[];
    variablesModified: string[];
  };
}
```

**Example:**

```typescript
const version = await versionPrompt({
  templateId: 'security-audit-report',
  template: updatedTemplate,
  variables: [...previousVars, {
    name: 'risk_threshold',
    type: 'string',
    required: false,
    default: 'medium',
    description: 'Minimum risk level to include in report',
  }],
  changelog: 'Added risk_threshold filter variable for targeted reports',
  status: 'active',
  deprecatePrevious: true,
});

console.log(version.newVersion);               // 2
console.log(version.diff.variablesAdded);      // ["risk_threshold"]
console.log(version.previousDeprecated);       // true
```

---

## Reasoning — Agentic Kernel

The Reasoning submodule implements the Recursive Language Model (RLM) pattern with multiple reasoning strategies, truth verification, and the Genesis Engine.

### startChain

Initiates a new reasoning chain using the specified strategy. Returns a chain handle for monitoring progress and retrieving results.

```typescript
import { ReasoningEngine } from '@mcv/agentic-os';

async function startChain(
  params: StartChainParams,
  context: ExecutionContext
): Promise<ReasoningChainHandle>;
```

**Parameters:**

| Name | Type | Required | Description |
|---|---|---|---|
| `params.problem` | `string` | Yes | Natural-language problem description |
| `params.strategy` | `ReasoningStrategy` | Yes | `'chain-of-thought'` \| `'tree-of-thought'` \| `'self-consistency'` \| `'decomposition'` \| `'analogical'` \| `'counterfactual'` |
| `params.context` | `ReasoningContext` | No | Problem-specific context data |
| `params.config` | `ReasoningConfig` | No | Strategy configuration |
| `params.config.maxDepth` | `number` | No | Max recursion depth. Default: `3` |
| `params.config.branchingFactor` | `number` | No | Tree-of-thought branching. Default: `3` |
| `params.config.samplingCount` | `number` | No | Self-consistency sample count. Default: `5` |
| `params.config.confidenceThreshold` | `number` | No | Min confidence for truth verification. Default: `0.95` |
| `params.config.enableVerification` | `boolean` | No | Enable truth verification layer. Default: `true` |
| `params.config.evaluationCriteria` | `EvaluationCriterion[]` | No | Weighted scoring criteria |
| `params.config.modelOverride` | `string` | No | Override the reasoning model |
| `params.config.verificationModel` | `string` | No | Override the verification model (for dual-model strategy) |
| `params.memoryContext` | `boolean` | No | Load relevant memories as context. Default: `true` |

**Returns:** `Promise<ReasoningChainHandle>`

```typescript
interface ReasoningChainHandle {
  chainId: string;                     // Unique chain identifier
  strategy: ReasoningStrategy;
  status: 'running' | 'completed' | 'failed';
  startedAt: string;                   // ISO 8601
  estimatedDuration: string;           // Estimated completion time
}
```

**Example:**

```typescript
const engine = new ReasoningEngine();

const chain = await engine.reason(
  'Should MCV.ONE expand BetEdge into the UK market in Q3 2026? Consider regulatory, competitive, and financial factors.',
  {
    currentMarkets: ['US', 'Canada', 'Malta'],
    financials: { revenue: 2400000, burn: 180000, runway: 14 },
    ukRegulatory: { gamblingCommission: 'pending', dataProtection: 'GDPR-compliant' },
  },
  {
    strategy: 'tree-of-thought',
    maxDepth: 3,
    branchingFactor: 3,
    enableVerification: true,
    evaluationCriteria: [
      { name: 'regulatory_feasibility', weight: 0.3, description: 'Regulatory compliance assessment' },
      { name: 'financial_viability', weight: 0.3, description: 'ROI and cost analysis' },
      { name: 'competitive_position', weight: 0.2, description: 'Market positioning assessment' },
      { name: 'operational_readiness', weight: 0.2, description: 'Ability to execute in timeframe' },
    ],
  }
);

console.log(chain.confidence);               // 0.82
console.log(chain.recommendation);           // "Proceed with caution..."
console.log(chain.steps.length);             // 12
```

---

### getTrace

Retrieves the full reasoning trace for a completed or in-progress chain, including every step, branch evaluation, verification result, and scoring.

```typescript
async function getTrace(
  params: GetTraceParams,
  context: ExecutionContext
): Promise<ReasoningTrace>;
```

**Parameters:**

| Name | Type | Required | Description |
|---|---|---|---|
| `params.chainId` | `string` | Yes | Reasoning chain UUID |
| `params.includeRawLLM` | `boolean` | No | Include raw LLM prompts/completions. Default: `false` |
| `params.format` | `'full'` \| `'summary'` \| `'tree'` | No | Output format. Default: `'full'` |

**Returns:** `Promise<ReasoningTrace>`

```typescript
interface ReasoningTrace {
  chainId: string;
  strategy: ReasoningStrategy;
  problem: string;
  status: 'running' | 'completed' | 'failed';
  steps: ReasoningStep[];
  paths?: ReasoningPath[];             // Tree-of-thought: all explored paths
  verifications: VerificationResult[];
  conclusion: {
    answer: string;
    confidence: ConfidenceScore;
    reasoning: string;
    supportingEvidence: string[];
    counterarguments: string[];
  };
  metrics: {
    totalSteps: number;
    totalBranches: number;
    branchesPruned: number;
    verificationsRun: number;
    verificationsPassed: number;
    durationMs: number;
    tokensUsed: number;
    costUSD: number;
    modelsUsed: string[];
  };
}

interface ReasoningStep {
  stepNumber: number;
  type: 'decompose' | 'reason' | 'verify' | 'synthesize' | 'evaluate';
  input: string;
  output: string;
  confidence: number;
  durationMs: number;
  model: string;
  children?: ReasoningStep[];          // For tree-of-thought branches
}
```

---

### evaluateResult

Scores a reasoning result against defined evaluation criteria, producing a detailed quality assessment. Used both for runtime validation and for computing trajectory reward signals.

```typescript
async function evaluateResult(
  params: EvaluateResultParams,
  context: ExecutionContext
): Promise<EvaluationReport>;
```

**Parameters:**

| Name | Type | Required | Description |
|---|---|---|---|
| `params.chainId` | `string` | Yes | Reasoning chain to evaluate |
| `params.criteria` | `EvaluationCriterion[]` | Yes | Weighted scoring criteria |
| `params.groundTruth` | `string` | No | Known correct answer for validation |
| `params.humanFeedback` | `string` | No | Human reviewer's assessment |
| `params.humanRating` | `number` | No | 1–5 human quality rating |

**Returns:** `Promise<EvaluationReport>`

```typescript
interface EvaluationReport {
  chainId: string;
  overallScore: number;                // 0.0 to 1.0
  criteriaScores: {
    criterion: string;
    weight: number;
    score: number;
    reasoning: string;
  }[];
  rewardSignal: number;                // -1.0 to 1.0 for trajectory learning
  isExemplar: boolean;                 // Recommended for few-shot prompting
  suggestions: string[];               // Improvement recommendations
  groundTruthMatch?: number;           // If provided, 0.0–1.0 match score
}
```

---

### explainDecision

Generates a human-readable explanation of how a reasoning chain arrived at its conclusion. Designed for HITL review and audit compliance.

```typescript
async function explainDecision(
  params: ExplainDecisionParams,
  context: ExecutionContext
): Promise<DecisionExplanation>;
```

**Parameters:**

| Name | Type | Required | Description |
|---|---|---|---|
| `params.chainId` | `string` | Yes | Reasoning chain to explain |
| `params.audience` | `'technical'` \| `'executive'` \| `'compliance'` | No | Target audience level. Default: `'executive'` |
| `params.format` | `'narrative'` \| `'bullet'` \| `'structured'` | No | Output format. Default: `'narrative'` |
| `params.maxLength` | `number` | No | Maximum word count. Default: `500` |

**Returns:** `Promise<DecisionExplanation>`

```typescript
interface DecisionExplanation {
  chainId: string;
  audience: string;
  explanation: string;                 // Human-readable explanation
  keyFactors: string[];                // Primary decision drivers
  alternativesConsidered: string[];    // Other options that were evaluated
  risks: string[];                     // Identified risks with the decision
  confidence: number;                  // Decision confidence level
  dataSources: string[];               // Sources consulted during reasoning
}
```

---

## Swarm — Ralph Execution Pods

The Swarm submodule manages multi-agent coordination, worker pools, task dispatching, and result aggregation across Ralph execution pods.

### createSwarm

Creates a new swarm configuration for coordinated multi-agent execution. A swarm defines which pods participate, coordination strategy, and resource constraints.

```typescript
import { SwarmDispatcher } from '@mcv/agentic-os';

async function createSwarm(
  params: CreateSwarmParams,
  context: ExecutionContext
): Promise<SwarmHandle>;
```

**Parameters:**

| Name | Type | Required | Description |
|---|---|---|---|
| `params.name` | `string` | Yes | Swarm name |
| `params.description` | `string` | No | Swarm purpose description |
| `params.coordinationStrategy` | `CoordinationStrategy` | Yes | `'parallel'` \| `'pipeline'` \| `'hierarchical'` \| `'consensus'` |
| `params.pods` | `SwarmPodConfig[]` | Yes | Pod configurations for this swarm |
| `params.pods[].podType` | `RalphPodType` | Yes | Pod type to include |
| `params.pods[].count` | `number` | No | Number of instances. Default: `1` |
| `params.pods[].resources` | `ResourceRequirements` | No | Per-pod resource constraints |
| `params.maxDuration` | `Duration` | No | Swarm-level timeout. Default: `{ minutes: 30 }` |
| `params.budgetUSD` | `number` | No | Total swarm budget. Default: `50.00` |
| `params.failurePolicy` | `FailurePolicy` | No | `'fail_fast'` \| `'continue'` \| `'retry'`. Default: `'continue'` |

**Returns:** `Promise<SwarmHandle>`

```typescript
interface SwarmHandle {
  swarmId: string;
  name: string;
  status: 'created' | 'active' | 'completed' | 'failed';
  pods: { podType: RalphPodType; instanceCount: number }[];
  coordination: CoordinationStrategy;
  createdAt: string;
}
```

**Example:**

```typescript
const dispatcher = new SwarmDispatcher();

const swarm = await createSwarm({
  name: 'Content Production Pipeline',
  description: 'End-to-end content creation from research to publication',
  coordinationStrategy: 'pipeline',
  pods: [
    { podType: 'oracle', count: 1, resources: { modelTier: 'standard' } },
    { podType: 'scribe', count: 2, resources: { modelTier: 'premium' } },
    { podType: 'herald', count: 1, resources: { modelTier: 'economy' } },
  ],
  maxDuration: { minutes: 45 },
  budgetUSD: 15.00,
  failurePolicy: 'continue',
}, context);

console.log(swarm.swarmId);                    // "swarm_1a2b3c4d"
console.log(swarm.pods.length);                // 3
```

---

### addAgent

Dynamically adds a new agent (pod instance) to an active swarm, enabling runtime scaling based on workload.

```typescript
async function addAgent(
  params: AddAgentParams,
  context: ExecutionContext
): Promise<AgentAddResult>;
```

**Parameters:**

| Name | Type | Required | Description |
|---|---|---|---|
| `params.swarmId` | `string` | Yes | Active swarm UUID |
| `params.podType` | `RalphPodType` | Yes | Type of pod to add |
| `params.agentConfig` | `Partial<RalphPodConfig>` | No | Custom agent configuration overrides |
| `params.resources` | `ResourceRequirements` | No | Resource constraints for this agent |
| `params.assignTask` | `string` | No | Immediately assign a specific task ID |

**Returns:** `Promise<AgentAddResult>`

```typescript
interface AgentAddResult {
  agentId: string;
  swarmId: string;
  podType: RalphPodType;
  status: 'active' | 'initializing';
  sessionId: string;                   // The agent's session handle
  assignedTask?: string;               // Task assigned (if any)
}
```

---

### coordinateSwarm

Dispatches a set of tasks to an active swarm for coordinated execution according to the swarm's coordination strategy.

```typescript
async function coordinateSwarm(
  params: CoordinateSwarmParams,
  context: ExecutionContext
): Promise<SwarmExecutionHandle>;
```

**Parameters:**

| Name | Type | Required | Description |
|---|---|---|---|
| `params.swarmId` | `string` | Yes | Active swarm UUID |
| `params.tasks` | `Task[]` | Yes | Tasks to execute |
| `params.resourcePlan` | `ResourcePlan` | No | Pre-computed resource plan from Queen |
| `params.priority` | `Priority` | No | Execution priority. Default: `'medium'` |
| `params.onProgress` | `(event: SwarmProgressEvent) => void` | No | Progress callback |

**Returns:** `Promise<SwarmExecutionHandle>`

```typescript
interface SwarmExecutionHandle {
  executionId: string;
  swarmId: string;
  status: 'dispatching' | 'executing' | 'completed' | 'failed';
  tasksTotal: number;
  tasksAssigned: number;
  parallelGroups: number;
  estimatedDurationMs: number;
  estimatedCostUSD: number;
}
```

---

### getSwarmResult

Retrieves the final results of a completed swarm execution, including per-task outcomes, aggregated metrics, and trajectory data.

```typescript
async function getSwarmResult(
  params: GetSwarmResultParams,
  context: ExecutionContext
): Promise<SwarmResult>;
```

**Parameters:**

| Name | Type | Required | Description |
|---|---|---|---|
| `params.executionId` | `string` | Yes | Swarm execution handle UUID |
| `params.includeTrajectories` | `boolean` | No | Include full trajectory data. Default: `false` |

**Returns:** `Promise<SwarmResult>`

```typescript
interface SwarmResult {
  executionId: string;
  swarmId: string;
  status: 'completed' | 'partial' | 'failed';
  tasks: TaskResultSummary[];
  aggregate: {
    tasksCompleted: number;
    tasksFailed: number;
    tasksCancelled: number;
    totalDurationMs: number;
    totalTokensUsed: number;
    totalCostUSD: number;
    totalToolCalls: number;
    avgRewardSignal: number;
    exemplarCount: number;
  };
  trajectories?: TrajectoryRecord[];   // If includeTrajectories=true
  errors: SwarmError[];                // All errors encountered
}

interface TaskResultSummary {
  taskId: string;
  title: string;
  assignedPod: RalphPodType;
  status: 'completed' | 'failed' | 'cancelled' | 'timeout';
  durationMs: number;
  tokensUsed: number;
  costUSD: number;
  output?: unknown;
  error?: string;
}
```

---

## Type Definitions

### Core Identity Types

```typescript
type VentureID = string;               // UUID of an MCV.ONE venture
type UserID = string;                  // UUID of an authenticated user
type Timestamp = string;               // ISO 8601 datetime string
type Duration = {                      // Human-friendly duration
  hours?: number;
  minutes?: number;
  seconds?: number;
};
type Priority = 'low' | 'medium' | 'high' | 'critical';
type ModelTier = 'economy' | 'standard' | 'premium' | 'reasoning';
```

### Agent Types

```typescript
type AgentCapability = 'read' | 'write' | 'execute' | 'approve' | 'delegate' | 'external' | 'financial';

type RalphPodType = 'smith' | 'growth' | 'director' | 'ledger' | 'scribe' | 'oracle' | 'herald' | 'shield';

type TaskType = 'development' | 'marketing' | 'operations' | 'finance' | 'content' | 'analytics' | 'communications' | 'security';

type RiskLevel = 'low' | 'medium' | 'high' | 'critical';

type MemoryType = 'episodic' | 'semantic' | 'procedural' | 'working';

type ReasoningStrategy = 'chain-of-thought' | 'tree-of-thought' | 'self-consistency' | 'decomposition' | 'analogical' | 'counterfactual';

type ScoutType = 'health' | 'performance' | 'security' | 'compliance' | 'cost' | 'quality' | 'custom';

type HITLRequestType = 'task_approval' | 'financial_approval' | 'data_access' | 'external_communication' | 'configuration_change' | 'escalation';

type PromptCategory = 'system' | 'task' | 'reasoning' | 'formatting' | 'safety' | 'persona' | 'tool_use';

type AnomalyAlgorithm = 'zscore' | 'iqr' | 'isolation_forest' | 'prophet' | 'lstm';

type CoordinationStrategy = 'parallel' | 'pipeline' | 'hierarchical' | 'consensus';
```

### Approval Types

```typescript
type HITLStatus = 'pending' | 'approved' | 'rejected' | 'expired' | 'cancelled';

type ApprovalDecision = 'approve' | 'reject' | 'delegate' | 'abstain';

interface QuorumConfig {
  mode: 'majority' | 'unanimous' | 'threshold';
  threshold?: number;                  // Required when mode = 'threshold' (0.0–1.0)
}

interface ApproverConfig {
  role: string;                        // 'manager' | 'executive' | 'finance' | 'legal' | 'tech_lead'
  count: number;                       // Number of approvers needed with this role
}
```

### Task & Execution Types

```typescript
interface Task {
  id: string;
  type: TaskType;
  title: string;
  description?: string;
  targetPod: RalphPodType;
  instruments: string[];
  input: Record<string, unknown>;
  dependencies: string[];              // Task IDs that must complete first
  priority: number;                    // 1 (highest) to 10 (lowest)
  estimatedDurationMs: number;
  estimatedCostUSD: number;
}

interface ResourceRequirements {
  maxTokens: number;
  maxToolCalls: number;
  timeoutMs: number;
  modelTier: ModelTier;
}

interface RiskAssessment {
  risks: Risk[];
  overallLevel: RiskLevel;
  requiresApproval: boolean;
  approvers: ApproverConfig[];
}

interface Risk {
  taskId: string;
  type: string;
  level: RiskLevel;
  description: string;
}
```

---

## Zod Schemas

All input types are validated at runtime using Zod schemas. These schemas are exported for use in API routes, form validation, and type generation.

```typescript
import { z } from 'zod';

// ─────────────────────────────────────────────
// Core Enums
// ─────────────────────────────────────────────

export const AgentCapabilitySchema = z.enum([
  'read', 'write', 'execute', 'approve', 'delegate', 'external', 'financial',
]);

export const RalphPodTypeSchema = z.enum([
  'smith', 'growth', 'director', 'ledger', 'scribe', 'oracle', 'herald', 'shield',
]);

export const TaskTypeSchema = z.enum([
  'development', 'marketing', 'operations', 'finance',
  'content', 'analytics', 'communications', 'security',
]);

export const PrioritySchema = z.enum(['low', 'medium', 'high', 'critical']);

export const RiskLevelSchema = z.enum(['low', 'medium', 'high', 'critical']);

export const MemoryTypeSchema = z.enum(['episodic', 'semantic', 'procedural', 'working']);

export const ReasoningStrategySchema = z.enum([
  'chain-of-thought', 'tree-of-thought', 'self-consistency',
  'decomposition', 'analogical', 'counterfactual',
]);

export const ScoutTypeSchema = z.enum([
  'health', 'performance', 'security', 'compliance', 'cost', 'quality', 'custom',
]);

export const HITLRequestTypeSchema = z.enum([
  'task_approval', 'financial_approval', 'data_access',
  'external_communication', 'configuration_change', 'escalation',
]);

export const PromptCategorySchema = z.enum([
  'system', 'task', 'reasoning', 'formatting', 'safety', 'persona', 'tool_use',
]);

export const ModelTierSchema = z.enum(['economy', 'standard', 'premium', 'reasoning']);

// ─────────────────────────────────────────────
// Composite Schemas
// ─────────────────────────────────────────────

export const DurationSchema = z.object({
  hours: z.number().int().min(0).optional(),
  minutes: z.number().int().min(0).optional(),
  seconds: z.number().int().min(0).optional(),
}).refine(d => (d.hours || 0) + (d.minutes || 0) + (d.seconds || 0) > 0, {
  message: 'Duration must be positive',
});

export const ResourceRequirementsSchema = z.object({
  maxTokens: z.number().int().min(100).max(200000).default(8000),
  maxToolCalls: z.number().int().min(0).max(100).default(20),
  timeoutMs: z.number().int().min(1000).max(3600000).default(300000),
  modelTier: ModelTierSchema.default('standard'),
});

export const TaskSchema = z.object({
  id: z.string().uuid(),
  type: TaskTypeSchema,
  title: z.string().min(1).max(500),
  description: z.string().optional(),
  targetPod: RalphPodTypeSchema,
  instruments: z.array(z.string()).default([]),
  input: z.record(z.unknown()).default({}),
  dependencies: z.array(z.string().uuid()).default([]),
  priority: z.number().int().min(1).max(10).default(5),
  estimatedDurationMs: z.number().int().min(0),
  estimatedCostUSD: z.number().min(0),
});

export const RiskSchema = z.object({
  taskId: z.string().uuid(),
  type: z.string(),
  level: RiskLevelSchema,
  description: z.string(),
});

export const RiskAssessmentSchema = z.object({
  risks: z.array(RiskSchema),
  overallLevel: RiskLevelSchema,
  requiresApproval: z.boolean(),
  approvers: z.array(z.object({
    role: z.string(),
    count: z.number().int().min(1),
  })),
});

export const ApprovalDecisionSchema = z.enum(['approve', 'reject', 'delegate', 'abstain']);

export const QuorumConfigSchema = z.object({
  mode: z.enum(['majority', 'unanimous', 'threshold']),
  threshold: z.number().min(0).max(1).optional(),
}).refine(q => q.mode !== 'threshold' || q.threshold !== undefined, {
  message: 'Threshold value required when mode is "threshold"',
});

export const CreateSessionSchema = z.object({
  agentId: z.string().uuid(),
  sessionConfig: z.object({
    maxDuration: DurationSchema.optional(),
    costBudgetUSD: z.number().min(0).optional(),
    memoryScope: z.enum(['full', 'readonly', 'none']).default('full'),
    instrumentOverrides: z.array(z.string()).optional(),
  }).optional(),
  initialContext: z.record(z.unknown()).optional(),
});

export const ExecuteTaskSchema = z.object({
  sessionId: z.string(),
  task: TaskSchema,
  resources: ResourceRequirementsSchema.optional(),
  retryPolicy: z.object({
    maxRetries: z.number().int().min(0).max(10).default(3),
    backoffMs: z.number().int().min(100).default(1000),
    backoffMultiplier: z.number().min(1).max(10).default(2),
  }).optional(),
});

export const StoreMemorySchema = z.object({
  agentId: z.string().uuid().optional(),
  memoryType: MemoryTypeSchema,
  content: z.union([z.string(), z.record(z.unknown())]),
  summary: z.string().optional(),
  category: z.string().optional(),
  importance: z.number().min(0).max(1).default(0.5),
  confidence: z.number().min(0).max(1).default(1.0),
  tags: z.array(z.string()).default([]),
  relatedEntities: z.array(z.object({
    entityId: z.string(),
    entityType: z.string(),
    relationship: z.string(),
  })).default([]),
  sourceType: z.enum(['task', 'conversation', 'explicit', 'inferred']).optional(),
  sourceId: z.string().uuid().optional(),
  validUntil: z.string().datetime().optional(),
  metadata: z.record(z.unknown()).optional(),
});

export const RetrieveMemorySchema = z.object({
  query: z.string().min(1),
  agentId: z.string().uuid().optional(),
  types: z.array(MemoryTypeSchema).optional(),
  tags: z.array(z.string()).optional(),
  minImportance: z.number().min(0).max(1).default(0),
  minConfidence: z.number().min(0).max(1).default(0),
  recencyBias: z.number().min(0).max(1).default(0.3),
  limit: z.number().int().min(1).max(100).default(10),
  includeArchived: z.boolean().default(false),
  deepRAG: z.boolean().default(false),
  deepRAGMaxDepth: z.number().int().min(1).max(5).default(3),
});

export const RequestApprovalSchema = z.object({
  title: z.string().min(1).max(500),
  description: z.string().min(1),
  requestType: HITLRequestTypeSchema,
  tasks: z.array(TaskSchema),
  riskAssessment: RiskAssessmentSchema,
  requiredApprovers: z.array(z.object({
    role: z.string(),
    count: z.number().int().min(1),
  })),
  timeout: DurationSchema,
  context: z.record(z.unknown()).optional(),
  workflowConfig: z.object({
    steps: z.array(z.object({
      name: z.string(),
      approvers: z.array(z.object({ role: z.string(), count: z.number().int().min(1) })),
      quorum: QuorumConfigSchema.optional(),
    })).optional(),
    quorum: QuorumConfigSchema.optional(),
  }).optional(),
  escalationRules: z.array(z.object({
    triggerConditions: z.record(z.unknown()),
    escalationAction: z.record(z.unknown()),
    priority: z.number().int().default(0),
  })).optional(),
  notifyChannels: z.array(z.string()).optional(),
});

export const StartChainSchema = z.object({
  problem: z.string().min(1),
  strategy: ReasoningStrategySchema,
  context: z.record(z.unknown()).optional(),
  config: z.object({
    maxDepth: z.number().int().min(1).max(5).default(3),
    branchingFactor: z.number().int().min(2).max(10).default(3),
    samplingCount: z.number().int().min(2).max(20).default(5),
    confidenceThreshold: z.number().min(0).max(1).default(0.95),
    enableVerification: z.boolean().default(true),
    evaluationCriteria: z.array(z.object({
      name: z.string(),
      weight: z.number().min(0).max(1),
      description: z.string().optional(),
    })).optional(),
    modelOverride: z.string().optional(),
    verificationModel: z.string().optional(),
  }).optional(),
  memoryContext: z.boolean().default(true),
});
```

---

## Event Types

The Agentic OS emits events via Redpanda/Kafka for real-time monitoring, dashboard updates, and cross-service integration. All events follow the `@mcv/fabric` event schema.

### Agent Lifecycle Events

```typescript
// Emitted when an agent session starts
interface AgentSessionStartedEvent {
  type: 'agent.session.started';
  payload: {
    agentId: string;
    sessionId: string;
    ventureId: string;
    agentType: 'queen' | 'ralph' | 'scout' | 'specialist';
    podType?: RalphPodType;            // For Ralph agents
    instruments: string[];
    timestamp: string;
  };
}

// Emitted when an agent session ends
interface AgentSessionEndedEvent {
  type: 'agent.session.ended';
  payload: {
    agentId: string;
    sessionId: string;
    ventureId: string;
    reason: 'completed' | 'timeout' | 'error' | 'terminated' | 'budget_exceeded';
    metrics: {
      durationMs: number;
      tokensUsed: number;
      costUSD: number;
      toolCalls: number;
      tasksProcessed: number;
    };
    timestamp: string;
  };
}

// Emitted when an agent's status changes
interface AgentStatusChangedEvent {
  type: 'agent.status.changed';
  payload: {
    agentId: string;
    ventureId: string;
    previousStatus: string;
    newStatus: string;
    reason: string;
    timestamp: string;
  };
}
```

### Task Completion Events

```typescript
// Emitted when a task begins execution
interface TaskStartedEvent {
  type: 'task.started';
  payload: {
    taskId: string;
    rootTaskId: string;
    ventureId: string;
    taskType: TaskType;
    assignedPod: RalphPodType;
    priority: Priority;
    timestamp: string;
  };
}

// Emitted during task execution with progress updates
interface TaskProgressEvent {
  type: 'task.progress';
  payload: {
    taskId: string;
    ventureId: string;
    progressPercent: number;
    progressMessage: string;
    currentStep: number;
    totalSteps: number;
    timestamp: string;
  };
}

// Emitted when a task completes (success or failure)
interface TaskCompletedEvent {
  type: 'task.completed';
  payload: {
    taskId: string;
    rootTaskId: string;
    ventureId: string;
    status: 'completed' | 'failed' | 'timeout' | 'cancelled';
    metrics: {
      durationMs: number;
      tokensUsed: number;
      costUSD: number;
      toolCalls: number;
      retryCount: number;
    };
    trajectory: {
      trajectoryId: string;
      outcome: 'success' | 'partial' | 'failure';
      rewardSignal: number;
    };
    error?: { code: string; message: string };
    timestamp: string;
  };
}
```

### Approval Events

```typescript
// Emitted when a new HITL approval is requested
interface ApprovalRequestedEvent {
  type: 'hitl.approval.requested';
  payload: {
    requestId: string;
    ventureId: string;
    requestType: HITLRequestType;
    riskLevel: RiskLevel;
    requiredApprovers: ApproverConfig[];
    deadline: string;
    sourceAgentId: string;
    sourceTaskId?: string;
    timestamp: string;
  };
}

// Emitted when an approver submits a decision
interface ApprovalDecisionEvent {
  type: 'hitl.approval.decision';
  payload: {
    requestId: string;
    ventureId: string;
    approverId: string;
    approverRole: string;
    decision: ApprovalDecision;
    quorumProgress: { required: number; received: number; remaining: number };
    timestamp: string;
  };
}

// Emitted when an approval request is fully resolved
interface ApprovalResolvedEvent {
  type: 'hitl.approval.resolved';
  payload: {
    requestId: string;
    ventureId: string;
    finalDecision: 'approved' | 'rejected' | 'expired';
    totalApprovers: number;
    approvals: number;
    rejections: number;
    durationMs: number;
    wasEscalated: boolean;
    timestamp: string;
  };
}
```

### Memory Events

```typescript
// Emitted when a new memory is stored
interface MemoryStoredEvent {
  type: 'memory.stored';
  payload: {
    memoryId: string;
    ventureId: string;
    agentId?: string;
    memoryType: MemoryType;
    importance: number;
    tags: string[];
    embeddingGenerated: boolean;
    knowledgeGraphUpdated: boolean;
    timestamp: string;
  };
}

// Emitted when memory consolidation completes
interface MemoryConsolidatedEvent {
  type: 'memory.consolidated';
  payload: {
    ventureId: string;
    agentId?: string;
    episodesProcessed: number;
    factsExtracted: number;
    contradictionsResolved: number;
    durationMs: number;
    costUSD: number;
    timestamp: string;
  };
}

// Emitted when a contradiction is detected between memories
interface MemoryContradictionEvent {
  type: 'memory.contradiction';
  payload: {
    ventureId: string;
    existingMemoryId: string;
    newMemoryId: string;
    existingContent: string;
    newContent: string;
    resolution: 'new_wins' | 'existing_wins' | 'unresolved';
    confidenceDelta: number;
    timestamp: string;
  };
}
```

### Scout & Alert Events

```typescript
// Emitted when an alert is created
interface AlertCreatedEvent {
  type: 'scout.alert.created';
  payload: {
    alertId: string;
    scoutId: string;
    ventureId: string;
    severity: 'info' | 'warning' | 'error' | 'critical';
    title: string;
    description: string;
    metrics: Record<string, number>;
    anomalies: AnomalyResult[];
    timestamp: string;
  };
}

// Emitted when an alert is resolved
interface AlertResolvedEvent {
  type: 'scout.alert.resolved';
  payload: {
    alertId: string;
    scoutId: string;
    ventureId: string;
    resolvedBy: string;
    resolutionNotes: string;
    durationMs: number;                // Time from creation to resolution
    timestamp: string;
  };
}
```

---

## Error Codes

All errors extend the base `AgentError` class and carry a machine-readable code, human-readable message, and optional details payload.

```typescript
class AgentError extends Error {
  readonly code: string;
  readonly statusCode: number;
  readonly details?: unknown;
}
```

### Error Code Reference

| Code | HTTP | Module | Description |
|---|---|---|---|
| `AGENT_NOT_FOUND` | 404 | NAOS | Agent with the specified ID does not exist |
| `AGENT_INACTIVE` | 409 | NAOS | Agent is paused, in maintenance, or retired |
| `SESSION_NOT_FOUND` | 404 | NAOS | No active session with the given ID |
| `SESSION_EXPIRED` | 410 | NAOS | Session exceeded its time limit |
| `SESSION_LIMIT_EXCEEDED` | 429 | NAOS | Maximum concurrent sessions for this agent |
| `INSTRUMENT_NOT_AVAILABLE` | 400 | NAOS | Referenced instrument not loaded in session |
| `CAPABILITY_DENIED` | 403 | NAOS | Agent lacks required capability for operation |
| `COST_BUDGET_EXCEEDED` | 402 | NAOS | Session or task cost budget exhausted |
| `RATE_LIMIT_EXCEEDED` | 429 | NAOS | Instrument or agent rate limit triggered |
| `MAX_ITERATIONS_EXCEEDED` | 500 | NAOS | LLM execution loop hit 10-iteration ceiling |
| `PLANNING_ERROR` | 500 | Queen | Failed to decompose request into valid tasks |
| `CYCLE_DETECTED` | 400 | Queen | Task dependency graph contains a cycle |
| `ALLOCATION_ERROR` | 500 | Queen | Resource allocation failed (no suitable pod) |
| `BUDGET_EXCEEDED` | 402 | Queen | Estimated cost exceeds request budget |
| `DEADLINE_INFEASIBLE` | 400 | Queen | Estimated duration exceeds deadline |
| `TASK_TIMEOUT` | 504 | Swarm | Task execution exceeded timeout |
| `TASK_EXECUTION_ERROR` | 500 | Swarm | Unrecoverable error during task execution |
| `ALL_TASKS_FAILED` | 500 | Swarm | Every task in the execution plan failed |
| `WORKER_POOL_EXHAUSTED` | 503 | Swarm | No workers available and queue is full |
| `HITL_REJECTED` | 403 | HITL | Human reviewer rejected the request |
| `HITL_TIMEOUT` | 408 | HITL | Approval deadline expired without resolution |
| `HITL_ESCALATION_FAILED` | 500 | HITL | Escalation rules failed to resolve timeout |
| `WORKFLOW_ERROR` | 500 | HITL | Approval workflow processing error |
| `TEMPLATE_NOT_FOUND` | 404 | Prompts | No template with the given ID/slug |
| `TEMPLATE_INACTIVE` | 409 | Prompts | Template is in draft or deprecated status |
| `VARIABLE_MISSING` | 400 | Prompts | Required template variable not provided |
| `VARIABLE_INVALID` | 400 | Prompts | Variable value failed Zod validation |
| `RENDER_ERROR` | 500 | Prompts | Template rendering failed |
| `CHAIN_EXECUTION_ERROR` | 500 | Prompts | Prompt chain execution failed |
| `MEMORY_ERROR` | 500 | Memory | Memory storage or retrieval failure |
| `MEMORY_CONTRADICTION` | 409 | Memory | New memory contradicts existing knowledge |
| `EMBEDDING_ERROR` | 500 | Memory | Vector embedding generation failed |
| `KNOWLEDGE_GRAPH_ERROR` | 500 | Memory | Neo4j operation failed |
| `REASONING_ERROR` | 500 | Reasoning | Reasoning chain failed to produce a result |
| `VERIFICATION_FAILED` | 422 | Reasoning | Truth verification rejected the conclusion |
| `RECURSION_DEPTH_EXCEEDED` | 500 | Reasoning | Exceeded maximum recursion depth (5) |
| `SCOUT_ERROR` | 500 | Scouts | Scout execution or data collection failed |
| `ANOMALY_ERROR` | 500 | Scouts | Anomaly detection algorithm error |
| `VENTURE_MISMATCH` | 403 | Global | Operation attempted across venture boundary |
| `INSUFFICIENT_PERMISSIONS` | 403 | Global | Caller lacks required permission |
| `VALIDATION_ERROR` | 400 | Global | Request body failed Zod schema validation |

---

## Configuration Reference

### Environment Variables

| Variable | Type | Required | Default | Description |
|---|---|---|---|---|
| `NAOS_DATABASE_URL` | `string` | Yes | — | PostgreSQL connection string (Supabase) |
| `NAOS_REDIS_URL` | `string` | Yes | — | Redis connection string (working memory, queues) |
| `NAOS_NEO4J_URL` | `string` | Yes | — | Neo4j connection string (knowledge graph) |
| `NAOS_NEO4J_USERNAME` | `string` | Yes | — | Neo4j authentication username |
| `NAOS_NEO4J_PASSWORD` | `string` | Yes | — | Neo4j authentication password |
| `NAOS_KAFKA_BROKERS` | `string` | Yes | — | Redpanda/Kafka broker addresses (comma-separated) |
| `NAOS_OPENROUTER_API_KEY` | `string` | Yes | — | OpenRouter API key for LLM access |
| `NAOS_OPENROUTER_BASE_URL` | `string` | No | `https://openrouter.ai/api/v1` | OpenRouter API base URL |
| `NAOS_E2B_API_KEY` | `string` | No | — | E2B sandbox API key (for code verification) |
| `NAOS_PINECONE_API_KEY` | `string` | No | — | Pinecone API key (optional vector store) |
| `NAOS_PINECONE_ENVIRONMENT` | `string` | No | — | Pinecone environment |
| `NAOS_DEFAULT_MODEL` | `string` | No | `claude-sonnet-4` | Default LLM model for agents |
| `NAOS_REASONING_MODEL` | `string` | No | `claude-opus-4` | Default model for reasoning tasks |
| `NAOS_VERIFICATION_MODEL` | `string` | No | `gemini-2.5-pro` | Default model for truth verification |
| `NAOS_EMBEDDING_MODEL` | `string` | No | `text-embedding-3-large` | Model for vector embeddings |
| `NAOS_EMBEDDING_DIMENSIONS` | `number` | No | `3072` | Embedding vector dimensions |
| `NAOS_MAX_CONCURRENT_SESSIONS` | `number` | No | `50` | Global maximum concurrent agent sessions |
| `NAOS_COST_THRESHOLD_USD` | `number` | No | `500` | Cost threshold triggering HITL review |
| `NAOS_HITL_DEFAULT_TIMEOUT_HOURS` | `number` | No | `24` | Default HITL approval timeout |
| `NAOS_CONSOLIDATION_CRON` | `string` | No | `0 */4 * * *` | Memory consolidation schedule |
| `NAOS_LOG_LEVEL` | `string` | No | `info` | Logging level (`debug`, `info`, `warn`, `error`) |

### Agent Configuration Object

```typescript
interface AgentConfig {
  // Identity
  id: string;                          // Unique agent identifier
  name: string;                        // Human-readable name
  type: 'queen' | 'ralph' | 'scout' | 'specialist';
  description?: string;

  // Capabilities & instruments
  capabilities: AgentCapability[];
  instruments: string[];               // Instrument slugs

  // Model configuration
  model: {
    defaultModel: string;              // e.g., "claude-sonnet-4"
    tier: ModelTier;
    maxTokensPerTurn: number;
    maxToolCalls?: number;
    temperature?: number;
  };

  // Memory configuration
  memory: {
    enabled: boolean;
    episodicRetention?: string;        // e.g., "90d", "1y"
    semanticIndexing?: boolean;
    maxWorkingMemory?: number;         // Max entries in working memory
    personaConfig?: PersonaConfig;     // Venture-specific persona tuning
  };

  // Operational constraints
  constraints: {
    maxTokensPerTurn: number;
    maxToolCalls: number;
    timeoutMs: number;
    costBudgetUSD: number;
    requiresHITL: string[];            // Instrument slugs requiring HITL
    forbiddenActions: string[];        // Absolutely forbidden instruments
  };

  // System prompt
  systemPrompt?: string;

  // Metadata
  metadata?: Record<string, unknown>;
}
```

### Queen Configuration Extension

```typescript
interface QueenConfig extends AgentConfig {
  planningModel: {
    model: string;                     // Model for task decomposition
    tier: ModelTier;
  };
  maxConcurrentTasks: number;          // Max tasks in flight at once
  taskTimeout: Duration;               // Default timeout per task
  escalationRules: EscalationRule[];   // Default escalation rules
  riskThresholds: {
    costHITLTrigger: number;           // USD amount triggering financial HITL
    externalCommsRequiresHITL: boolean;
    dataModificationRequiresHITL: boolean;
  };
}
```

### Ralph Pod Configuration Extension

```typescript
interface RalphPodConfig extends AgentConfig {
  podType: RalphPodType;
  maxConcurrentTasks: number;
  defaultModelTier: ModelTier;
  specialization: {
    domain: string;                    // "engineering", "marketing", etc.
    expertise: string[];               // Domain-specific skills
    defaultInstruments: string[];      // Instruments loaded by default
  };
}
```

### Scout Configuration Object

```typescript
interface ScoutConfig {
  collectors: CollectorConfig[];
  thresholds: ThresholdConfig[];
  alertRules: AlertRule[];
  anomalyDetection?: AnomalyDetectorConfig;
}

interface CollectorConfig {
  type: 'http' | 'tcp' | 'database' | 'metrics' | 'custom';
  url?: string;
  method?: string;
  headers?: Record<string, string>;
  timeout?: number;
  query?: string;                      // For database collectors
  metrics?: string[];                  // For metrics collectors
  customHandler?: string;              // For custom collectors
}

interface ThresholdConfig {
  metric: string;
  operator: 'gt' | 'gte' | 'lt' | 'lte' | 'eq' | 'neq';
  value: number;
  severity?: 'info' | 'warning' | 'error' | 'critical';
  message?: string;
}

interface AlertRule {
  condition: {
    severity?: string;
    metric?: string;
    scoutType?: string;
  };
  channels: string[];                  // "slack" | "email" | "pagerduty" | "webhook" | "in_app"
  webhookUrl?: string;                 // For webhook channel
  cooldownMinutes?: number;            // Minimum time between alerts
}

interface AnomalyDetectorConfig {
  algorithm: AnomalyAlgorithm;
  sensitivity: number;                 // Algorithm-specific sensitivity parameter
  minDataPoints: number;               // Minimum history required before detection activates
  windowSize: number;                  // Rolling window size for analysis
  seasonalPeriod?: number;             // For Prophet: seasonal decomposition period
}
```

---

*@mcv/agentic-os — Neural Agentic Operating System*
