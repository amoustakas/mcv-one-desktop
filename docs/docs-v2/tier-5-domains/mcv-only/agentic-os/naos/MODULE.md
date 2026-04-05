# @mcv/agentic-os/naos

> **Tier 5 — Domain Module (MCV-Only)**
> Natural Agent Operating System — the runtime kernel for AI agents.

**Package:** `@mcv/agentic-os/naos`
**Since:** 0.1.0
**Status:** Core Infrastructure
**Maintainer:** MCV Platform Team

---

## Purpose

NAOS (Natural Agent Operating System) is the microkernel that sits at the very bottom of the MCV agentic stack. Every AI agent — whether it's a queen orchestrating a swarm, a scout performing reconnaissance, a worker executing a task, or a specialist handling domain-specific logic — runs as a **managed process** inside NAOS. It is the runtime that spawns them, constrains them, monitors them, and kills them when they misbehave. Without NAOS, agents are just unbounded LLM calls with no lifecycle, no accountability, and no safety guarantees.

Think of NAOS the way you think of a Unix kernel. It doesn't know what your programs do — it just manages processes, enforces permissions, allocates resources, and provides IPC primitives. NAOS does the same for agents. It doesn't care whether an agent is summarizing documents, writing code, or coordinating twenty sub-agents. It cares that the agent was spawned with valid credentials, runs within its token budget, only accesses tools it has permission to use, and terminates cleanly when its work is done. The agent's *intelligence* lives in higher layers (queen, scouts, hive). NAOS provides the *operating environment*.

This design makes NAOS the single enforcement point for multi-tenant security, resource isolation, and capability-based access control across the entire agentic platform. Every tool invocation, every inter-agent message, every token consumed passes through NAOS accounting. If an agent tries to exceed its budget, NAOS suspends it. If an agent tries to call a tool it doesn't have permission for, NAOS rejects the call. If an agent crashes, NAOS captures the state, logs the failure, and optionally restarts it. This is not optional infrastructure — it is the foundation that makes autonomous agent operation safe and auditable in a multi-tenant SaaS environment.

---

## Exports

```typescript
// === Runtime Core ===
export { NaosRuntime } from './runtime';
export { createNaosRuntime } from './runtime';
export type { NaosRuntimeConfig } from './runtime';

// === Process Management ===
export { ProcessManager } from './process-manager';
export { AgentProcess } from './process';
export type {
  ProcessState,
  ProcessHandle,
  ProcessDescriptor,
  SpawnOptions,
  SpawnResult,
  ProcessEvent,
  ProcessEventType,
} from './process';

// === Lifecycle ===
export {
  spawnAgent,
  suspendAgent,
  resumeAgent,
  terminateAgent,
  killAgent,
  restartAgent,
} from './lifecycle';
export type {
  LifecycleHook,
  LifecyclePhase,
  LifecycleTransition,
} from './lifecycle';

// === Sandboxing ===
export { Sandbox } from './sandbox';
export { SandboxManager } from './sandbox';
export type {
  SandboxConfig,
  SandboxCapability,
  CapabilitySet,
  SandboxIsolationLevel,
  SandboxViolation,
} from './sandbox';

// === Resource Management ===
export { ResourceGovernor } from './resources';
export type {
  ResourceLimits,
  ResourceUsage,
  ResourceSnapshot,
  TokenBudget,
  ComputeBudget,
  MemoryBudget,
  RateLimitConfig,
  ResourceExhaustedEvent,
} from './resources';

// === Tool Registry ===
export { ToolRegistry } from './tools';
export type {
  ToolManifest,
  ToolDescriptor,
  ToolPermission,
  ToolInvocation,
  ToolResult,
  ToolMiddleware,
} from './tools';

// === Scheduling ===
export { Scheduler } from './scheduler';
export type {
  SchedulerConfig,
  TaskPriority,
  TaskQueue,
  ScheduledTask,
  PreemptionPolicy,
} from './scheduler';

// === Monitoring ===
export { Monitor } from './monitor';
export type {
  HealthCheck,
  HealthStatus,
  Heartbeat,
  AgentMetrics,
  CrashReport,
  MonitorConfig,
} from './monitor';

// === IPC (Inter-Process Communication) ===
export { IpcBus } from './ipc';
export type {
  IpcMessage,
  IpcChannel,
  IpcSubscription,
  SharedState,
  SharedStateHandle,
  MessageEnvelope,
} from './ipc';

// === DB Schemas ===
export {
  agentProcesses,
  processLogs,
  resourceUsage,
  toolPermissions,
  agentConfigs,
} from './schema';

// === tRPC Router ===
export { naosRouter } from './router';
export type { NaosRouter } from './router';

// === Error Codes ===
export { NaosErrorCode, NaosError } from './errors';

// === Constants ===
export {
  DEFAULT_TOKEN_BUDGET,
  DEFAULT_COMPUTE_TIMEOUT_MS,
  DEFAULT_MEMORY_LIMIT_MB,
  MAX_CONCURRENT_AGENTS,
  HEARTBEAT_INTERVAL_MS,
  PROCESS_GC_INTERVAL_MS,
} from './constants';
```

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         NAOS Runtime Kernel                             │
│                                                                         │
│  ┌───────────────────────────────────────────────────────────────────┐  │
│  │                        API Surface (tRPC)                         │  │
│  │   spawn · suspend · resume · terminate · query · configure        │  │
│  └──────────────────────────┬────────────────────────────────────────┘  │
│                              │                                          │
│  ┌──────────────────────────▼────────────────────────────────────────┐  │
│  │                      Process Manager                              │  │
│  │                                                                   │  │
│  │   ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐           │  │
│  │   │  PID 1  │  │  PID 2  │  │  PID 3  │  │  PID N  │    ...    │  │
│  │   │ (queen) │  │ (scout) │  │(worker) │  │  (any)  │           │  │
│  │   └────┬────┘  └────┬────┘  └────┬────┘  └────┬────┘           │  │
│  │        │             │            │             │                 │  │
│  └────────┼─────────────┼────────────┼─────────────┼────────────────┘  │
│           │             │            │             │                    │
│  ┌────────▼─────────────▼────────────▼─────────────▼────────────────┐  │
│  │                        Sandbox Layer                              │  │
│  │                                                                   │  │
│  │   ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐       │  │
│  │   │Sandbox 1 │  │Sandbox 2 │  │Sandbox 3 │  │Sandbox N │       │  │
│  │   │ caps: rw │  │ caps: ro │  │ caps: rw │  │ caps: .. │       │  │
│  │   │ tools: 8 │  │ tools: 3 │  │ tools: 5 │  │ tools: N │       │  │
│  │   └──────────┘  └──────────┘  └──────────┘  └──────────┘       │  │
│  └───────────────────────────────────────────────────────────────────┘  │
│                                                                         │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────────────┐ │
│  │    Scheduler     │  │ Resource Governor│  │     Tool Registry      │ │
│  │                  │  │                  │  │                         │ │
│  │ Priority queues  │  │ Token budgets    │  │ Manifest store          │ │
│  │ Preemption       │  │ Compute limits   │  │ Permission matrix       │ │
│  │ Fair-share       │  │ Memory caps      │  │ Invocation middleware   │ │
│  │ Deadline-aware   │  │ Rate limiters    │  │ Audit trail             │ │
│  └────────┬────────┘  └────────┬────────┘  └────────────┬────────────┘ │
│           │                     │                         │              │
│  ┌────────▼─────────────────────▼─────────────────────────▼────────────┐│
│  │                         IPC Bus                                     ││
│  │                                                                     ││
│  │   point-to-point │ pub/sub │ request/reply │ shared state           ││
│  └─────────────────────────────────────────────────────────────────────┘│
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────────┐│
│  │                         Monitor                                     ││
│  │                                                                     ││
│  │   Heartbeats │ Health checks │ Metrics │ Crash detection │ Logs     ││
│  └─────────────────────────────────────────────────────────────────────┘│
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────────┐│
│  │                    Persistence (Supabase/Drizzle)                   ││
│  │                                                                     ││
│  │   agent_processes │ process_logs │ resource_usage │ tool_permissions ││
│  │   agent_configs   │ ipc_messages │ sandbox_violations               ││
│  └─────────────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────────────┘

Process State Machine:
                                 ┌───────────┐
                    ┌───────────►│ SUSPENDED  │◄──────────┐
                    │            └─────┬──────┘           │
                    │ suspend()        │ resume()         │ suspend()
                    │                  ▼                  │
┌────────┐  spawn() │  ┌──────────────────────────┐      │
│CREATED │──────────┼─►│        RUNNING            │──────┘
└────────┘          │  └─────┬──────────────┬──────┘
                    │        │              │
                    │        │ terminate()  │ crash/error
                    │        ▼              ▼
                    │  ┌──────────┐  ┌──────────────┐
                    │  │TERMINATED│  │   CRASHED     │
                    │  └──────────┘  └──────┬───────┘
                    │                       │ restart()
                    │                       │
                    └───────────────────────┘

Legend:
  caps = capabilities granted to sandbox
  rw   = read-write tools/state access
  ro   = read-only tools/state access
  PID  = process identifier (unique per tenant + runtime)
```

---

## Core Interfaces

### NaosRuntime

The top-level runtime object. One instance per server process. Coordinates all subsystems.

```typescript
/**
 * The NAOS runtime kernel. Manages the full lifecycle of agent processes
 * within a single server instance. In a multi-server deployment, each
 * server runs its own NaosRuntime and coordinates via the database +
 * distributed IPC layer.
 */
interface NaosRuntime {
  /** Unique identifier for this runtime instance (server-level). */
  readonly instanceId: string;

  /** Tenant context this runtime is operating under. */
  readonly tenantId: string;

  /** Access to the process manager subsystem. */
  readonly processes: ProcessManager;

  /** Access to the scheduler subsystem. */
  readonly scheduler: Scheduler;

  /** Access to the resource governor subsystem. */
  readonly resources: ResourceGovernor;

  /** Access to the tool registry subsystem. */
  readonly tools: ToolRegistry;

  /** Access to the sandbox manager subsystem. */
  readonly sandboxes: SandboxManager;

  /** Access to the IPC bus subsystem. */
  readonly ipc: IpcBus;

  /** Access to the monitoring subsystem. */
  readonly monitor: Monitor;

  /**
   * Initialize the runtime. Must be called before any operations.
   * Sets up DB connections, starts the scheduler, initializes monitors.
   */
  initialize(): Promise<void>;

  /**
   * Gracefully shut down the runtime. Suspends all running agents,
   * flushes logs, closes connections.
   */
  shutdown(options?: ShutdownOptions): Promise<void>;

  /**
   * Spawn a new agent process. This is the primary entry point for
   * creating agents. Internally allocates a PID, creates a sandbox,
   * applies resource limits, and starts execution.
   */
  spawn(options: SpawnOptions): Promise<ProcessHandle>;

  /**
   * Get a handle to an existing agent process by PID.
   */
  getProcess(pid: string): Promise<ProcessHandle | null>;

  /**
   * List all agent processes matching the given filter.
   */
  listProcesses(filter?: ProcessFilter): Promise<ProcessDescriptor[]>;

  /**
   * Register a lifecycle hook that fires on process state transitions.
   */
  onLifecycle(hook: LifecycleHook): () => void;

  /**
   * Get runtime-level metrics (total processes, resource usage, etc.).
   */
  getMetrics(): Promise<RuntimeMetrics>;
}

interface NaosRuntimeConfig {
  /** Unique instance ID. Auto-generated if not provided. */
  instanceId?: string;

  /** Tenant ID for multi-tenant isolation. Required. */
  tenantId: string;

  /** Database connection string (Supabase PostgreSQL). */
  databaseUrl: string;

  /** Maximum concurrent agent processes for this instance. */
  maxConcurrentProcesses?: number;  // default: 50

  /** Default resource limits applied to new processes. */
  defaultResourceLimits?: Partial<ResourceLimits>;

  /** Default sandbox isolation level. */
  defaultIsolationLevel?: SandboxIsolationLevel;

  /** Scheduler configuration. */
  scheduler?: Partial<SchedulerConfig>;

  /** Monitor configuration. */
  monitor?: Partial<MonitorConfig>;

  /** Whether to enable distributed IPC (for multi-server). */
  distributedIpc?: boolean;

  /** Redis URL for distributed IPC pub/sub. */
  redisUrl?: string;

  /** Encryption key for sensitive process state at rest. */
  stateEncryptionKey?: string;
}

interface ShutdownOptions {
  /** Grace period in ms before force-killing agents. Default: 30000. */
  gracePeriodMs?: number;

  /** Whether to save agent state for later resumption. Default: true. */
  saveState?: boolean;

  /** Whether to wait for all agents to finish naturally. Default: false. */
  waitForCompletion?: boolean;
}

interface RuntimeMetrics {
  instanceId: string;
  tenantId: string;
  uptimeMs: number;
  totalProcessesSpawned: number;
  activeProcesses: number;
  suspendedProcesses: number;
  totalTokensConsumed: number;
  totalToolInvocations: number;
  totalIpcMessages: number;
  avgProcessDurationMs: number;
  crashCount: number;
  resourceExhaustionCount: number;
}
```

### AgentProcess & ProcessState

```typescript
/**
 * Represents a single agent process managed by NAOS. This is the
 * fundamental unit of execution — analogous to a Unix process but
 * for AI agents.
 */
interface AgentProcess {
  /** Globally unique process identifier (UUID). */
  readonly pid: string;

  /** Human-readable process name (e.g., "queen-main", "scout-web-3"). */
  readonly name: string;

  /** The type/role of this agent (queen, scout, worker, specialist). */
  readonly agentType: AgentType;

  /** Tenant that owns this process. */
  readonly tenantId: string;

  /** Parent process PID (null for top-level agents). */
  readonly parentPid: string | null;

  /** Current process state. */
  readonly state: ProcessState;

  /** The sandbox this process runs in. */
  readonly sandbox: Sandbox;

  /** Resource limits imposed on this process. */
  readonly resourceLimits: ResourceLimits;

  /** Current resource usage. */
  readonly resourceUsage: ResourceUsage;

  /** Tools available to this process. */
  readonly toolManifest: ToolManifest;

  /** When the process was created. */
  readonly createdAt: Date;

  /** When the process last transitioned state. */
  readonly lastStateChange: Date;

  /** Custom metadata attached to the process. */
  readonly metadata: Record<string, unknown>;

  /** Process exit code (set after termination/crash). */
  readonly exitCode: number | null;

  /** Process exit reason (set after termination/crash). */
  readonly exitReason: string | null;
}

/**
 * The finite set of states an agent process can be in.
 * Transitions are enforced by the ProcessManager — invalid
 * transitions throw NAOS_INVALID_TRANSITION.
 */
type ProcessState =
  | 'created'      // Allocated but not yet running
  | 'initializing' // Running setup hooks, loading tools
  | 'running'      // Actively executing
  | 'suspended'    // Paused, state preserved, can resume
  | 'waiting'      // Blocked on IPC or external event
  | 'terminating'  // Graceful shutdown in progress
  | 'terminated'   // Clean exit
  | 'crashed'      // Unclean exit (error, panic, timeout)
  | 'zombie';      // Terminated but not yet reaped (parent hasn't acknowledged)

/**
 * Valid state transitions. The ProcessManager enforces these strictly.
 */
const VALID_TRANSITIONS: Record<ProcessState, ProcessState[]> = {
  created:      ['initializing', 'terminated'],
  initializing: ['running', 'crashed', 'terminated'],
  running:      ['suspended', 'waiting', 'terminating', 'crashed'],
  suspended:    ['running', 'terminating', 'terminated'],
  waiting:      ['running', 'suspended', 'terminating', 'crashed'],
  terminating:  ['terminated', 'crashed'],
  terminated:   ['zombie'],  // only if parent exists and hasn't reaped
  crashed:      ['initializing', 'zombie'],  // initializing = restart
  zombie:       [],  // terminal state, cleaned by GC
};

type AgentType =
  | 'queen'       // Orchestrator agent
  | 'scout'       // Reconnaissance/research agent
  | 'worker'      // Task execution agent
  | 'specialist'  // Domain-specific agent
  | 'daemon'      // Long-running background agent
  | 'ephemeral';  // One-shot agent (fire and forget)

/**
 * A handle to a running process. This is what callers interact with
 * after spawning an agent. It provides methods to control the process
 * without direct access to internal state.
 */
interface ProcessHandle {
  /** The underlying process descriptor. */
  readonly descriptor: ProcessDescriptor;

  /** PID shortcut. */
  readonly pid: string;

  /** Current state shortcut. */
  readonly state: ProcessState;

  /** Suspend this process (preserves state). */
  suspend(reason?: string): Promise<void>;

  /** Resume a suspended process. */
  resume(): Promise<void>;

  /** Gracefully terminate this process. */
  terminate(reason?: string): Promise<void>;

  /** Force-kill this process immediately. */
  kill(reason?: string): Promise<void>;

  /** Restart this process (terminate + spawn with same config). */
  restart(): Promise<ProcessHandle>;

  /** Send an IPC message to this process. */
  send(message: IpcMessage): Promise<void>;

  /** Wait for this process to reach a terminal state. */
  wait(): Promise<ProcessExitInfo>;

  /** Get current resource usage snapshot. */
  getUsage(): Promise<ResourceSnapshot>;

  /** Update resource limits (can tighten or loosen). */
  updateLimits(limits: Partial<ResourceLimits>): Promise<void>;

  /** Subscribe to process events (state changes, errors, etc.). */
  on(event: ProcessEventType, handler: (e: ProcessEvent) => void): () => void;
}

interface ProcessDescriptor {
  pid: string;
  name: string;
  agentType: AgentType;
  tenantId: string;
  parentPid: string | null;
  state: ProcessState;
  createdAt: Date;
  lastStateChange: Date;
  resourceLimits: ResourceLimits;
  resourceUsage: ResourceUsage;
  metadata: Record<string, unknown>;
  exitCode: number | null;
  exitReason: string | null;
  sandboxId: string;
  toolCount: number;
  childPids: string[];
}

interface ProcessExitInfo {
  pid: string;
  state: 'terminated' | 'crashed';
  exitCode: number;
  exitReason: string | null;
  duration: number;       // total runtime in ms
  tokensConsumed: number;
  toolInvocations: number;
}

interface SpawnOptions {
  /** Human-readable name for this agent. */
  name: string;

  /** Agent type / role. */
  agentType: AgentType;

  /** Parent PID (for sub-agents). */
  parentPid?: string;

  /** Resource limits (merged with defaults). */
  resourceLimits?: Partial<ResourceLimits>;

  /** Tools this agent is allowed to use. */
  tools?: string[];  // tool IDs

  /** Sandbox isolation level override. */
  isolationLevel?: SandboxIsolationLevel;

  /** Additional sandbox capabilities to grant. */
  capabilities?: SandboxCapability[];

  /** Custom metadata. */
  metadata?: Record<string, unknown>;

  /** Model to use for this agent (e.g., 'gpt-4o', 'claude-sonnet'). */
  model?: string;

  /** System prompt for the agent. */
  systemPrompt?: string;

  /** Initial messages / context for the agent. */
  initialContext?: AgentMessage[];

  /** Priority level for scheduling. */
  priority?: TaskPriority;

  /** Lifecycle hooks for this specific process. */
  hooks?: Partial<ProcessLifecycleHooks>;

  /**
   * Whether to auto-restart on crash. Default: false.
   * For daemon-type agents, this is typically true.
   */
  autoRestart?: boolean;

  /** Maximum restart attempts before giving up. Default: 3. */
  maxRestarts?: number;

  /** Time window for restart counting (ms). Default: 300000 (5 min). */
  restartWindowMs?: number;
}

interface ProcessLifecycleHooks {
  /** Called after process is created but before initialization. */
  onCreated: (process: ProcessDescriptor) => Promise<void>;

  /** Called after initialization completes, before running. */
  onReady: (process: ProcessDescriptor) => Promise<void>;

  /** Called when process is suspended. */
  onSuspended: (process: ProcessDescriptor, reason?: string) => Promise<void>;

  /** Called when process is resumed. */
  onResumed: (process: ProcessDescriptor) => Promise<void>;

  /** Called when process exits (clean or crash). */
  onExit: (process: ProcessDescriptor, info: ProcessExitInfo) => Promise<void>;
}

interface AgentMessage {
  role: 'system' | 'user' | 'assistant' | 'tool';
  content: string;
  toolCallId?: string;
  name?: string;
}
```

### ResourceLimits

```typescript
/**
 * Resource constraints for an agent process. NAOS enforces these
 * continuously — exceeding any limit triggers a configurable policy
 * (suspend, terminate, warn, or throttle).
 */
interface ResourceLimits {
  /** Maximum total tokens (input + output) the agent can consume. */
  maxTokens: number;

  /** Maximum tokens per single LLM call. */
  maxTokensPerCall: number;

  /** Maximum compute wall-clock time in ms. */
  maxComputeTimeMs: number;

  /** Maximum memory usage in MB (for state/context). */
  maxMemoryMb: number;

  /** Maximum number of tool invocations. */
  maxToolInvocations: number;

  /** Maximum number of LLM calls. */
  maxLlmCalls: number;

  /** Maximum number of child processes this agent can spawn. */
  maxChildProcesses: number;

  /** Maximum IPC messages this agent can send per minute. */
  maxIpcMessagesPerMinute: number;

  /** API rate limits per external service. */
  rateLimits: RateLimitConfig[];

  /** What to do when a limit is hit. */
  exhaustionPolicy: ResourceExhaustionPolicy;

  /** Whether the agent can request limit increases. */
  allowLimitEscalation: boolean;

  /** Maximum cost in USD (if cost tracking is enabled). */
  maxCostUsd?: number;
}

interface ResourceUsage {
  /** Tokens consumed so far (input + output). */
  tokensConsumed: number;

  /** Input tokens consumed. */
  inputTokens: number;

  /** Output tokens consumed. */
  outputTokens: number;

  /** Compute time used so far in ms. */
  computeTimeMs: number;

  /** Current memory usage in MB. */
  memoryMb: number;

  /** Tool invocations performed. */
  toolInvocations: number;

  /** LLM calls made. */
  llmCalls: number;

  /** Child processes spawned (active). */
  activeChildProcesses: number;

  /** Total child processes spawned (lifetime). */
  totalChildProcesses: number;

  /** IPC messages sent in current window. */
  ipcMessagesSentThisMinute: number;

  /** Estimated cost in USD. */
  estimatedCostUsd: number;

  /** Timestamp of this snapshot. */
  snapshotAt: Date;
}

interface ResourceSnapshot {
  pid: string;
  limits: ResourceLimits;
  usage: ResourceUsage;
  percentages: {
    tokens: number;
    computeTime: number;
    memory: number;
    toolInvocations: number;
    llmCalls: number;
    cost: number;
  };
  warnings: ResourceWarning[];
}

interface ResourceWarning {
  resource: string;
  threshold: number;    // percentage (e.g., 80)
  currentPercent: number;
  message: string;
}

type ResourceExhaustionPolicy =
  | 'suspend'     // Pause the agent, can be resumed with new limits
  | 'terminate'   // Kill the agent immediately
  | 'warn'        // Log a warning but let it continue (soft limit)
  | 'throttle'    // Slow down execution (add delays between calls)
  | 'escalate';   // Notify parent process to decide

interface RateLimitConfig {
  /** Service identifier (e.g., "openai", "anthropic", "web-search"). */
  service: string;

  /** Maximum requests per window. */
  maxRequests: number;

  /** Window size in ms. */
  windowMs: number;

  /** What to do when rate limited. */
  onLimit: 'queue' | 'reject' | 'throttle';
}

interface TokenBudget {
  /** Total token budget. */
  total: number;

  /** Tokens remaining. */
  remaining: number;

  /** Input tokens used. */
  inputUsed: number;

  /** Output tokens used. */
  outputUsed: number;

  /** Whether the budget is exhausted. */
  exhausted: boolean;

  /** Percentage used. */
  percentUsed: number;
}

interface ResourceExhaustedEvent {
  pid: string;
  resource: keyof ResourceLimits;
  limit: number;
  actual: number;
  policy: ResourceExhaustionPolicy;
  timestamp: Date;
}
```

### ToolManifest & ToolRegistry

```typescript
/**
 * A tool manifest describes which tools an agent process has access to
 * and under what constraints. Tools are the agent's interface to the
 * outside world — every action an agent takes (besides thinking)
 * goes through a tool.
 */
interface ToolManifest {
  /** Process this manifest belongs to. */
  pid: string;

  /** Available tools. */
  tools: ToolDescriptor[];

  /** Default permissions applied to all tools. */
  defaultPermissions: ToolPermission;

  /** Per-tool permission overrides. */
  overrides: Map<string, ToolPermission>;
}

interface ToolDescriptor {
  /** Unique tool identifier. */
  id: string;

  /** Human-readable tool name. */
  name: string;

  /** Tool description (shown to the agent). */
  description: string;

  /** JSON Schema for tool parameters. */
  inputSchema: Record<string, unknown>;

  /** JSON Schema for tool output. */
  outputSchema?: Record<string, unknown>;

  /** Tool category (filesystem, network, database, etc.). */
  category: ToolCategory;

  /** Whether this tool has side effects. */
  hasSideEffects: boolean;

  /** Whether this tool requires confirmation before execution. */
  requiresConfirmation: boolean;

  /** Estimated cost per invocation (tokens or USD). */
  estimatedCost?: number;

  /** Rate limit specific to this tool (overrides global). */
  rateLimit?: RateLimitConfig;

  /** Middleware to run before/after tool execution. */
  middleware?: ToolMiddleware[];

  /** Whether the tool is currently enabled. */
  enabled: boolean;
}

type ToolCategory =
  | 'filesystem'   // File read/write/delete
  | 'network'      // HTTP requests, API calls
  | 'database'     // Direct DB queries
  | 'compute'      // Code execution, shell commands
  | 'communication'// Email, messaging, notifications
  | 'search'       // Web search, document search
  | 'media'        // Image/audio/video processing
  | 'agent'        // Inter-agent operations (spawn, message)
  | 'system'       // NAOS system tools (metrics, config)
  | 'custom';      // User-defined tools

interface ToolPermission {
  /** Whether the tool can be invoked. */
  canInvoke: boolean;

  /** Maximum invocations per process lifetime. */
  maxInvocations?: number;

  /** Maximum invocations per minute. */
  maxInvocationsPerMinute?: number;

  /** Whether each invocation requires human approval. */
  requiresApproval: boolean;

  /** Allowed parameter patterns (regex-based filtering). */
  parameterConstraints?: Record<string, string>;

  /** Additional conditions as a serialized expression. */
  condition?: string;
}

interface ToolInvocation {
  /** Unique invocation ID. */
  id: string;

  /** Process that invoked the tool. */
  pid: string;

  /** Tool being invoked. */
  toolId: string;

  /** Input parameters. */
  input: Record<string, unknown>;

  /** When the invocation started. */
  startedAt: Date;

  /** When the invocation completed (null if still running). */
  completedAt: Date | null;

  /** Invocation status. */
  status: 'pending' | 'approved' | 'running' | 'completed' | 'failed' | 'rejected';

  /** Tool output (null if not yet completed). */
  output: unknown | null;

  /** Error if failed. */
  error: string | null;

  /** Duration in ms. */
  durationMs: number | null;

  /** Tokens consumed by this invocation (if applicable). */
  tokensConsumed: number;
}

interface ToolResult {
  /** Whether the tool invocation succeeded. */
  success: boolean;

  /** The tool's output. */
  output: unknown;

  /** Error message if failed. */
  error?: string;

  /** Tokens consumed. */
  tokensConsumed: number;

  /** Duration in ms. */
  durationMs: number;

  /** Whether the result was cached. */
  cached: boolean;
}

interface ToolMiddleware {
  /** Middleware name for logging/debugging. */
  name: string;

  /** Priority (lower runs first). */
  priority: number;

  /** Before hook — can modify input or reject the invocation. */
  before?: (invocation: ToolInvocation) => Promise<ToolInvocation | null>;

  /** After hook — can modify output or trigger side effects. */
  after?: (invocation: ToolInvocation, result: ToolResult) => Promise<ToolResult>;
}
```

### Sandbox

```typescript
/**
 * A sandbox is an isolated execution environment for an agent process.
 * It enforces capability-based security — an agent can only do what
 * its sandbox explicitly allows.
 *
 * Sandboxes operate at three isolation levels:
 * - shared:   Agents share state within the same tenant (least isolated)
 * - isolated:  Each agent has its own state, no cross-agent access
 * - hardened:  Like isolated, plus additional runtime restrictions
 */
interface Sandbox {
  /** Unique sandbox identifier. */
  readonly id: string;

  /** The process this sandbox belongs to. */
  readonly pid: string;

  /** Tenant that owns this sandbox. */
  readonly tenantId: string;

  /** Isolation level. */
  readonly isolationLevel: SandboxIsolationLevel;

  /** Capabilities granted to this sandbox. */
  readonly capabilities: CapabilitySet;

  /** Whether this sandbox is active. */
  readonly active: boolean;

  /**
   * Check if this sandbox has a specific capability.
   */
  hasCapability(capability: SandboxCapability): boolean;

  /**
   * Assert a capability — throws NAOS_CAPABILITY_DENIED if not granted.
   */
  assertCapability(capability: SandboxCapability): void;

  /**
   * Execute a function within this sandbox's constraints.
   * All tool invocations from the agent go through this method.
   */
  execute<T>(fn: () => Promise<T>, requiredCapabilities: SandboxCapability[]): Promise<T>;

  /**
   * Get a read-only view of sandbox state.
   */
  getState(): SandboxState;

  /**
   * Record a violation (logged but doesn't necessarily terminate).
   */
  recordViolation(violation: SandboxViolation): void;

  /**
   * Get all recorded violations.
   */
  getViolations(): SandboxViolation[];

  /**
   * Destroy this sandbox and clean up resources.
   */
  destroy(): Promise<void>;
}

type SandboxIsolationLevel =
  | 'shared'    // Can access shared tenant state
  | 'isolated'  // Own state only, no cross-agent access
  | 'hardened'; // Maximum restrictions, audit everything

/**
 * Capabilities are fine-grained permissions. A sandbox starts with
 * none and must be explicitly granted each capability.
 */
type SandboxCapability =
  | 'tool:invoke'           // Can invoke tools at all
  | 'tool:filesystem:read'  // Can read files
  | 'tool:filesystem:write' // Can write files
  | 'tool:network:outbound' // Can make outbound network requests
  | 'tool:network:inbound'  // Can receive inbound requests
  | 'tool:database:read'    // Can read from database
  | 'tool:database:write'   // Can write to database
  | 'tool:compute:execute'  // Can execute code/commands
  | 'tool:communication'    // Can send emails/messages
  | 'agent:spawn'           // Can spawn child agents
  | 'agent:ipc:send'        // Can send IPC messages
  | 'agent:ipc:receive'     // Can receive IPC messages
  | 'agent:ipc:broadcast'   // Can broadcast to all agents
  | 'state:read'            // Can read shared state
  | 'state:write'           // Can write shared state
  | 'state:own:read'        // Can read own process state
  | 'state:own:write'       // Can write own process state
  | 'system:metrics'        // Can read system metrics
  | 'system:config'         // Can modify system config
  | 'escalate:limits';      // Can request resource limit increases

interface CapabilitySet {
  /** All granted capabilities. */
  readonly capabilities: ReadonlySet<SandboxCapability>;

  /** Check if a capability is in the set. */
  has(capability: SandboxCapability): boolean;

  /** Check if ALL of the given capabilities are in the set. */
  hasAll(capabilities: SandboxCapability[]): boolean;

  /** Check if ANY of the given capabilities are in the set. */
  hasAny(capabilities: SandboxCapability[]): boolean;

  /** Serialize to array (for storage). */
  toArray(): SandboxCapability[];
}

interface SandboxState {
  id: string;
  pid: string;
  isolationLevel: SandboxIsolationLevel;
  capabilities: SandboxCapability[];
  active: boolean;
  violationCount: number;
  createdAt: Date;
  lastActivityAt: Date;
}

interface SandboxViolation {
  /** What capability was attempted. */
  attemptedCapability: SandboxCapability;

  /** When the violation occurred. */
  timestamp: Date;

  /** Context about what the agent was trying to do. */
  context: string;

  /** The tool invocation that triggered the violation (if applicable). */
  toolInvocationId?: string;

  /** Severity of the violation. */
  severity: 'low' | 'medium' | 'high' | 'critical';

  /** Action taken in response. */
  actionTaken: 'logged' | 'warned' | 'suspended' | 'terminated';
}

interface SandboxConfig {
  /** Isolation level for the sandbox. */
  isolationLevel: SandboxIsolationLevel;

  /** Capabilities to grant. */
  capabilities: SandboxCapability[];

  /** Maximum violations before auto-termination. */
  maxViolations?: number;  // default: 10

  /** Violation severity threshold for auto-termination. */
  autoTerminateSeverity?: 'medium' | 'high' | 'critical';  // default: 'critical'

  /** Whether to log all capability checks (verbose auditing). */
  auditAllChecks?: boolean;  // default: false for shared/isolated, true for hardened
}
```

### Scheduler

```typescript
/**
 * The scheduler manages agent task queues and determines which agents
 * run when. In a world where LLM calls are expensive and slow, smart
 * scheduling matters — you don't want a low-priority background agent
 * hogging the API while a user-facing agent waits.
 */
interface Scheduler {
  /**
   * Enqueue a task for execution.
   */
  enqueue(task: ScheduledTask): Promise<string>;

  /**
   * Dequeue the next task (highest priority, respecting fairness).
   */
  dequeue(): Promise<ScheduledTask | null>;

  /**
   * Get the current queue depth by priority.
   */
  getQueueDepth(): Promise<Record<TaskPriority, number>>;

  /**
   * Preempt a running task in favor of a higher-priority one.
   */
  preempt(pid: string, reason: string): Promise<boolean>;

  /**
   * Cancel a scheduled task that hasn't started yet.
   */
  cancel(taskId: string): Promise<boolean>;

  /**
   * Get scheduler metrics.
   */
  getMetrics(): Promise<SchedulerMetrics>;
}

type TaskPriority =
  | 'critical'   // User-facing, real-time (e.g., chat response)
  | 'high'       // Important but can wait seconds
  | 'normal'     // Standard agent work
  | 'low'        // Background processing
  | 'idle';      // Only when nothing else is running

interface ScheduledTask {
  /** Unique task ID. */
  id: string;

  /** Process this task belongs to. */
  pid: string;

  /** Priority level. */
  priority: TaskPriority;

  /** Task type (llm-call, tool-invocation, ipc-message, etc.). */
  type: string;

  /** Task payload. */
  payload: unknown;

  /** When the task was enqueued. */
  enqueuedAt: Date;

  /** Deadline — task should complete before this time. */
  deadline?: Date;

  /** Maximum time to wait in queue before dropping. */
  maxQueueTimeMs?: number;

  /** Whether this task can be preempted. */
  preemptible: boolean;

  /** Estimated tokens this task will consume. */
  estimatedTokens?: number;
}

interface SchedulerConfig {
  /** Maximum tasks processed concurrently across all agents. */
  maxConcurrentTasks: number;  // default: 10

  /** Scheduling algorithm. */
  algorithm: 'priority-fifo' | 'fair-share' | 'deadline-aware';

  /** Fair-share weight per priority level. */
  priorityWeights?: Record<TaskPriority, number>;

  /** How often to rebalance the queue (ms). */
  rebalanceIntervalMs?: number;  // default: 5000

  /** Whether to allow preemption. */
  allowPreemption: boolean;  // default: true

  /** Maximum queue depth before rejecting new tasks. */
  maxQueueDepth: number;  // default: 1000
}

interface SchedulerMetrics {
  totalTasksEnqueued: number;
  totalTasksCompleted: number;
  totalTasksDropped: number;
  totalPreemptions: number;
  currentQueueDepth: number;
  avgWaitTimeMs: number;
  avgProcessingTimeMs: number;
  tasksByPriority: Record<TaskPriority, number>;
}

interface PreemptionPolicy {
  /** Minimum priority difference to trigger preemption. */
  minPriorityGap: number;

  /** Grace period before actually preempting (ms). */
  gracePeriodMs: number;

  /** Whether to save state before preemption. */
  saveState: boolean;

  /** Maximum times a single process can be preempted. */
  maxPreemptions: number;
}
```

### Monitor

```typescript
/**
 * The monitoring subsystem. Tracks agent health, detects crashes,
 * collects metrics, and provides the observability layer for the
 * entire runtime.
 */
interface Monitor {
  /**
   * Register a process for monitoring.
   */
  register(pid: string): void;

  /**
   * Unregister a process from monitoring.
   */
  unregister(pid: string): void;

  /**
   * Record a heartbeat from a process.
   */
  heartbeat(pid: string): void;

  /**
   * Get health status for a specific process.
   */
  getHealth(pid: string): Promise<HealthStatus>;

  /**
   * Get health status for all monitored processes.
   */
  getAllHealth(): Promise<Map<string, HealthStatus>>;

  /**
   * Get metrics for a specific process.
   */
  getMetrics(pid: string): Promise<AgentMetrics>;

  /**
   * Subscribe to crash events.
   */
  onCrash(handler: (report: CrashReport) => void): () => void;

  /**
   * Subscribe to health change events.
   */
  onHealthChange(handler: (pid: string, status: HealthStatus) => void): () => void;

  /**
   * Get all crash reports within a time window.
   */
  getCrashReports(since: Date, until?: Date): Promise<CrashReport[]>;
}

type HealthStatus =
  | 'healthy'     // Process is running and responsive
  | 'degraded'    // Process is running but slow or resource-strained
  | 'unresponsive'// Process hasn't sent a heartbeat recently
  | 'crashed'     // Process has crashed
  | 'unknown';    // Not enough data yet

interface Heartbeat {
  pid: string;
  timestamp: Date;
  state: ProcessState;
  resourceUsage: ResourceUsage;
  lastToolInvocation?: string;
  customData?: Record<string, unknown>;
}

interface HealthCheck {
  pid: string;
  status: HealthStatus;
  lastHeartbeat: Date | null;
  missedHeartbeats: number;
  uptime: number;
  restartCount: number;
  issues: HealthIssue[];
}

interface HealthIssue {
  type: 'missed-heartbeat' | 'high-memory' | 'high-tokens' | 'slow-response' | 'crash-loop' | 'sandbox-violations';
  severity: 'warning' | 'error' | 'critical';
  message: string;
  detectedAt: Date;
}

interface AgentMetrics {
  pid: string;
  name: string;
  agentType: AgentType;
  uptime: number;
  state: ProcessState;
  tokensConsumed: number;
  tokensPerMinute: number;
  toolInvocations: number;
  toolInvocationsPerMinute: number;
  llmCalls: number;
  avgLlmLatencyMs: number;
  p95LlmLatencyMs: number;
  ipcMessagesSent: number;
  ipcMessagesReceived: number;
  memoryMb: number;
  sandboxViolations: number;
  errors: number;
  restartCount: number;
}

interface CrashReport {
  /** The process that crashed. */
  pid: string;

  /** Process name. */
  name: string;

  /** When the crash occurred. */
  timestamp: Date;

  /** Error that caused the crash. */
  error: {
    code: string;
    message: string;
    stack?: string;
  };

  /** Process state at time of crash. */
  lastKnownState: ProcessState;

  /** Resource usage at time of crash. */
  lastResourceUsage: ResourceUsage;

  /** Last few log entries before the crash. */
  lastLogs: ProcessLogEntry[];

  /** Whether the process was auto-restarted. */
  autoRestarted: boolean;

  /** Number of times this process has crashed. */
  crashCount: number;

  /** Parent PID (for notification). */
  parentPid: string | null;
}

interface MonitorConfig {
  /** How often to check for missed heartbeats (ms). */
  checkIntervalMs: number;  // default: 10000

  /** How long before a missed heartbeat triggers "unresponsive". */
  heartbeatTimeoutMs: number;  // default: 30000

  /** How many missed heartbeats before declaring "crashed". */
  maxMissedHeartbeats: number;  // default: 3

  /** Whether to auto-restart crashed processes. */
  autoRestart: boolean;  // default: false (per-process setting takes precedence)

  /** How many crashes within restartWindowMs before giving up. */
  crashLoopThreshold: number;  // default: 5

  /** Window for crash loop detection (ms). */
  crashLoopWindowMs: number;  // default: 300000

  /** Whether to collect detailed metrics. */
  detailedMetrics: boolean;  // default: true

  /** Metrics retention period. */
  metricsRetentionMs: number;  // default: 86400000 (24h)
}

interface ProcessLogEntry {
  pid: string;
  timestamp: Date;
  level: 'debug' | 'info' | 'warn' | 'error' | 'fatal';
  message: string;
  data?: Record<string, unknown>;
  source: 'agent' | 'runtime' | 'sandbox' | 'tool' | 'scheduler' | 'ipc';
}
```

### IPC (Inter-Process Communication)

```typescript
/**
 * The IPC bus enables communication between agent processes.
 * Supports point-to-point messaging, pub/sub channels, request/reply
 * patterns, and shared state.
 *
 * All IPC goes through NAOS — agents cannot communicate outside
 * the bus. This ensures auditability and sandboxing.
 */
interface IpcBus {
  /**
   * Send a point-to-point message to a specific process.
   */
  send(from: string, to: string, message: IpcMessage): Promise<void>;

  /**
   * Send a message and wait for a reply (request/reply pattern).
   */
  request(from: string, to: string, message: IpcMessage, timeoutMs?: number): Promise<IpcMessage>;

  /**
   * Subscribe to a named channel (pub/sub).
   */
  subscribe(pid: string, channel: string, handler: (msg: IpcMessage) => void): IpcSubscription;

  /**
   * Publish a message to a named channel.
   */
  publish(from: string, channel: string, message: IpcMessage): Promise<void>;

  /**
   * Broadcast a message to all processes (requires agent:ipc:broadcast capability).
   */
  broadcast(from: string, message: IpcMessage): Promise<void>;

  /**
   * Create or access a shared state object.
   */
  getSharedState(namespace: string): SharedStateHandle;

  /**
   * Get IPC metrics.
   */
  getMetrics(): Promise<IpcMetrics>;
}

interface IpcMessage {
  /** Message type (for routing/filtering). */
  type: string;

  /** Message payload. */
  payload: unknown;

  /** Correlation ID (for request/reply). */
  correlationId?: string;

  /** Reply-to PID (for request/reply). */
  replyTo?: string;

  /** Message priority. */
  priority?: 'normal' | 'high' | 'urgent';

  /** TTL in ms (message expires after this). */
  ttlMs?: number;

  /** Custom headers. */
  headers?: Record<string, string>;
}

interface MessageEnvelope {
  /** Unique message ID. */
  id: string;

  /** Sender PID. */
  from: string;

  /** Recipient PID or channel name. */
  to: string;

  /** The actual message. */
  message: IpcMessage;

  /** When the message was sent. */
  sentAt: Date;

  /** When the message was delivered (null if pending). */
  deliveredAt: Date | null;

  /** Delivery status. */
  status: 'pending' | 'delivered' | 'expired' | 'rejected';
}

interface IpcSubscription {
  /** Subscription ID. */
  id: string;

  /** Channel name. */
  channel: string;

  /** Subscriber PID. */
  pid: string;

  /** Unsubscribe from the channel. */
  unsubscribe(): void;
}

interface SharedState {
  /** Namespace for this shared state. */
  namespace: string;

  /** Current state value. */
  value: Record<string, unknown>;

  /** Version number (for optimistic concurrency). */
  version: number;

  /** Last modified timestamp. */
  lastModified: Date;

  /** PID that last modified this state. */
  lastModifiedBy: string;
}

interface SharedStateHandle {
  /** Get the current state. */
  get(): Promise<SharedState>;

  /** Get a specific key from the state. */
  getKey<T = unknown>(key: string): Promise<T | undefined>;

  /**
   * Set a key in the state. Uses optimistic concurrency —
   * throws NAOS_STATE_CONFLICT if the version has changed.
   */
  set(key: string, value: unknown): Promise<void>;

  /**
   * Atomic compare-and-swap for a key.
   */
  cas(key: string, expected: unknown, newValue: unknown): Promise<boolean>;

  /**
   * Delete a key from the state.
   */
  delete(key: string): Promise<void>;

  /**
   * Subscribe to changes on this shared state.
   */
  onChange(handler: (key: string, value: unknown, pid: string) => void): () => void;

  /**
   * Lock the state for exclusive access.
   */
  lock(timeoutMs?: number): Promise<SharedStateLock>;
}

interface SharedStateLock {
  /** Whether the lock is still held. */
  readonly held: boolean;

  /** Release the lock. */
  release(): Promise<void>;
}

interface IpcChannel {
  name: string;
  subscriberCount: number;
  messageCount: number;
  createdAt: Date;
}

interface IpcMetrics {
  totalMessagesSent: number;
  totalMessagesDelivered: number;
  totalMessagesExpired: number;
  totalMessagesRejected: number;
  activeSubscriptions: number;
  activeChannels: number;
  sharedStateNamespaces: number;
  avgDeliveryLatencyMs: number;
}
```

---

## Database Schemas

All schemas use Drizzle ORM with Supabase PostgreSQL. Every table includes `tenant_id` with row-level security (RLS) policies for multi-tenant isolation. Timestamps are `timestamptz` and default to `now()`.

### agent_processes

The primary process registry. Every spawned agent gets a row here.

```typescript
import { pgTable, uuid, text, timestamp, jsonb, integer, pgEnum } from 'drizzle-orm/pg-core';

export const processStateEnum = pgEnum('process_state', [
  'created',
  'initializing',
  'running',
  'suspended',
  'waiting',
  'terminating',
  'terminated',
  'crashed',
  'zombie',
]);

export const agentTypeEnum = pgEnum('agent_type', [
  'queen',
  'scout',
  'worker',
  'specialist',
  'daemon',
  'ephemeral',
]);

export const agentProcesses = pgTable('agent_processes', {
  /** Process ID (PK). */
  id: uuid('id').primaryKey().defaultRandom(),

  /** Tenant ID for RLS. */
  tenantId: uuid('tenant_id').notNull(),

  /** Runtime instance that owns this process. */
  instanceId: text('instance_id').notNull(),

  /** Human-readable process name. */
  name: text('name').notNull(),

  /** Agent type. */
  agentType: agentTypeEnum('agent_type').notNull(),

  /** Parent process ID (null for top-level). */
  parentPid: uuid('parent_pid').references(() => agentProcesses.id, {
    onDelete: 'set null',
  }),

  /** Current state. */
  state: processStateEnum('state').notNull().default('created'),

  /** Sandbox ID. */
  sandboxId: uuid('sandbox_id').notNull(),

  /** Resource limits (JSONB). */
  resourceLimits: jsonb('resource_limits').$type<ResourceLimits>().notNull(),

  /** Current resource usage snapshot (JSONB). */
  resourceUsage: jsonb('resource_usage').$type<ResourceUsage>().notNull(),

  /** Tool manifest — which tools are available (JSONB). */
  toolManifest: jsonb('tool_manifest').$type<{ toolIds: string[]; overrides: Record<string, ToolPermission> }>().notNull(),

  /** Model identifier (e.g., 'gpt-4o', 'claude-sonnet-4-20250514'). */
  model: text('model'),

  /** System prompt. */
  systemPrompt: text('system_prompt'),

  /** Serialized agent state (for suspend/resume). */
  savedState: jsonb('saved_state'),

  /** Custom metadata. */
  metadata: jsonb('metadata').$type<Record<string, unknown>>().default({}),

  /** Exit code (null while running). */
  exitCode: integer('exit_code'),

  /** Exit reason. */
  exitReason: text('exit_reason'),

  /** Scheduling priority. */
  priority: text('priority').$type<TaskPriority>().notNull().default('normal'),

  /** Whether auto-restart is enabled. */
  autoRestart: integer('auto_restart').notNull().default(0),  // boolean as int

  /** Restart count within current window. */
  restartCount: integer('restart_count').notNull().default(0),

  /** Maximum allowed restarts. */
  maxRestarts: integer('max_restarts').notNull().default(3),

  /** Created timestamp. */
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),

  /** Last state transition timestamp. */
  lastStateChange: timestamp('last_state_change', { withTimezone: true }).notNull().defaultNow(),

  /** Last heartbeat timestamp. */
  lastHeartbeat: timestamp('last_heartbeat', { withTimezone: true }),

  /** Terminated/crashed timestamp. */
  endedAt: timestamp('ended_at', { withTimezone: true }),

  /** Updated timestamp. */
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

// Indexes
// CREATE INDEX idx_agent_processes_tenant ON agent_processes(tenant_id);
// CREATE INDEX idx_agent_processes_state ON agent_processes(tenant_id, state);
// CREATE INDEX idx_agent_processes_parent ON agent_processes(parent_pid);
// CREATE INDEX idx_agent_processes_instance ON agent_processes(instance_id);
// CREATE INDEX idx_agent_processes_type ON agent_processes(tenant_id, agent_type);

// RLS Policy
// CREATE POLICY agent_processes_tenant_isolation ON agent_processes
//   USING (tenant_id = current_setting('app.tenant_id')::uuid);
```

### process_logs

Structured log entries for all agent processes. High-volume — consider partitioning by time.

```typescript
export const logLevelEnum = pgEnum('log_level', [
  'debug',
  'info',
  'warn',
  'error',
  'fatal',
]);

export const logSourceEnum = pgEnum('log_source', [
  'agent',
  'runtime',
  'sandbox',
  'tool',
  'scheduler',
  'ipc',
  'monitor',
]);

export const processLogs = pgTable('process_logs', {
  /** Log entry ID. */
  id: uuid('id').primaryKey().defaultRandom(),

  /** Tenant ID for RLS. */
  tenantId: uuid('tenant_id').notNull(),

  /** Process that generated this log. */
  pid: uuid('pid').notNull().references(() => agentProcesses.id, {
    onDelete: 'cascade',
  }),

  /** Log level. */
  level: logLevelEnum('level').notNull(),

  /** Log source subsystem. */
  source: logSourceEnum('source').notNull(),

  /** Log message. */
  message: text('message').notNull(),

  /** Structured data payload. */
  data: jsonb('data'),

  /** Process state at time of log. */
  processState: processStateEnum('process_state'),

  /** Token count at time of log (for tracking). */
  tokenCount: integer('token_count'),

  /** Timestamp. */
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

// Indexes
// CREATE INDEX idx_process_logs_pid ON process_logs(pid, created_at DESC);
// CREATE INDEX idx_process_logs_tenant ON process_logs(tenant_id, created_at DESC);
// CREATE INDEX idx_process_logs_level ON process_logs(pid, level);

// RLS Policy
// CREATE POLICY process_logs_tenant_isolation ON process_logs
//   USING (tenant_id = current_setting('app.tenant_id')::uuid);
```

### resource_usage

Time-series snapshots of resource consumption per process. Used for billing, monitoring dashboards, and limit enforcement auditing.

```typescript
export const resourceUsage = pgTable('resource_usage', {
  /** Snapshot ID. */
  id: uuid('id').primaryKey().defaultRandom(),

  /** Tenant ID for RLS. */
  tenantId: uuid('tenant_id').notNull(),

  /** Process ID. */
  pid: uuid('pid').notNull().references(() => agentProcesses.id, {
    onDelete: 'cascade',
  }),

  /** Snapshot timestamp. */
  snapshotAt: timestamp('snapshot_at', { withTimezone: true }).notNull().defaultNow(),

  /** Input tokens consumed (cumulative). */
  inputTokens: integer('input_tokens').notNull().default(0),

  /** Output tokens consumed (cumulative). */
  outputTokens: integer('output_tokens').notNull().default(0),

  /** Total tokens consumed (cumulative). */
  totalTokens: integer('total_tokens').notNull().default(0),

  /** Compute time used in ms (cumulative). */
  computeTimeMs: integer('compute_time_ms').notNull().default(0),

  /** Memory usage in MB (point-in-time). */
  memoryMb: integer('memory_mb').notNull().default(0),

  /** Tool invocations (cumulative). */
  toolInvocations: integer('tool_invocations').notNull().default(0),

  /** LLM calls (cumulative). */
  llmCalls: integer('llm_calls').notNull().default(0),

  /** IPC messages sent (cumulative). */
  ipcMessagesSent: integer('ipc_messages_sent').notNull().default(0),

  /** Active child processes (point-in-time). */
  activeChildren: integer('active_children').notNull().default(0),

  /** Estimated cost in USD (cumulative). */
  estimatedCostUsd: jsonb('estimated_cost_usd').$type<number>().default(0),

  /** Whether any limit was exceeded at this snapshot. */
  limitExceeded: integer('limit_exceeded').notNull().default(0),  // boolean as int

  /** Which limit was exceeded (if any). */
  exceededLimit: text('exceeded_limit'),

  /** Full resource limits at time of snapshot (for auditing). */
  limitsSnapshot: jsonb('limits_snapshot').$type<ResourceLimits>(),
});

// Indexes
// CREATE INDEX idx_resource_usage_pid ON resource_usage(pid, snapshot_at DESC);
// CREATE INDEX idx_resource_usage_tenant ON resource_usage(tenant_id, snapshot_at DESC);
// CREATE INDEX idx_resource_usage_exceeded ON resource_usage(tenant_id, limit_exceeded)
//   WHERE limit_exceeded = 1;

// RLS Policy
// CREATE POLICY resource_usage_tenant_isolation ON resource_usage
//   USING (tenant_id = current_setting('app.tenant_id')::uuid);
```

### tool_permissions

Per-agent tool permission matrix. Determines which tools each agent type or specific process can use.

```typescript
export const toolPermissions = pgTable('tool_permissions', {
  /** Permission ID. */
  id: uuid('id').primaryKey().defaultRandom(),

  /** Tenant ID for RLS. */
  tenantId: uuid('tenant_id').notNull(),

  /**
   * Scope: either a specific PID or an agent type.
   * If pid is set, this overrides type-level permissions.
   */
  pid: uuid('pid').references(() => agentProcesses.id, {
    onDelete: 'cascade',
  }),

  /** Agent type this permission applies to (if pid is null). */
  agentType: agentTypeEnum('agent_type'),

  /** Tool identifier. */
  toolId: text('tool_id').notNull(),

  /** Whether the tool can be invoked. */
  canInvoke: integer('can_invoke').notNull().default(1),

  /** Maximum invocations per process lifetime. */
  maxInvocations: integer('max_invocations'),

  /** Maximum invocations per minute. */
  maxInvocationsPerMinute: integer('max_invocations_per_minute'),

  /** Whether human approval is required. */
  requiresApproval: integer('requires_approval').notNull().default(0),

  /** Parameter constraints (JSONB — regex patterns per parameter). */
  parameterConstraints: jsonb('parameter_constraints').$type<Record<string, string>>(),

  /** Additional condition expression. */
  condition: text('condition'),

  /** Who created this permission. */
  createdBy: uuid('created_by'),

  /** Created timestamp. */
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),

  /** Updated timestamp. */
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

// Indexes
// CREATE INDEX idx_tool_permissions_pid ON tool_permissions(pid);
// CREATE INDEX idx_tool_permissions_type ON tool_permissions(tenant_id, agent_type);
// CREATE INDEX idx_tool_permissions_tool ON tool_permissions(tenant_id, tool_id);
// CREATE UNIQUE INDEX idx_tool_permissions_unique_pid ON tool_permissions(pid, tool_id)
//   WHERE pid IS NOT NULL;
// CREATE UNIQUE INDEX idx_tool_permissions_unique_type ON tool_permissions(tenant_id, agent_type, tool_id)
//   WHERE pid IS NULL AND agent_type IS NOT NULL;

// RLS Policy
// CREATE POLICY tool_permissions_tenant_isolation ON tool_permissions
//   USING (tenant_id = current_setting('app.tenant_id')::uuid);
```

### agent_configs

Configuration templates and presets for agent types. Defines the default resource limits, tool sets, sandbox settings, and model choices for each agent role within a tenant.

```typescript
export const agentConfigs = pgTable('agent_configs', {
  /** Config ID. */
  id: uuid('id').primaryKey().defaultRandom(),

  /** Tenant ID for RLS. */
  tenantId: uuid('tenant_id').notNull(),

  /** Config name (e.g., "default-queen", "budget-scout", "premium-worker"). */
  name: text('name').notNull(),

  /** Config description. */
  description: text('description'),

  /** Agent type this config applies to. */
  agentType: agentTypeEnum('agent_type').notNull(),

  /** Whether this is the default config for the agent type. */
  isDefault: integer('is_default').notNull().default(0),

  /** Default model for this agent type. */
  model: text('model').notNull(),

  /** Default system prompt. */
  systemPrompt: text('system_prompt'),

  /** Default resource limits (JSONB). */
  resourceLimits: jsonb('resource_limits').$type<ResourceLimits>().notNull(),

  /** Default sandbox config (JSONB). */
  sandboxConfig: jsonb('sandbox_config').$type<SandboxConfig>().notNull(),

  /** Default tool IDs available. */
  toolIds: jsonb('tool_ids').$type<string[]>().notNull().default([]),

  /** Default scheduling priority. */
  priority: text('priority').$type<TaskPriority>().notNull().default('normal'),

  /** Whether auto-restart is enabled by default. */
  autoRestart: integer('auto_restart').notNull().default(0),

  /** Max restarts. */
  maxRestarts: integer('max_restarts').notNull().default(3),

  /** Custom metadata defaults. */
  metadata: jsonb('metadata').$type<Record<string, unknown>>().default({}),

  /** Whether this config is active. */
  active: integer('active').notNull().default(1),

  /** Created by user ID. */
  createdBy: uuid('created_by'),

  /** Created timestamp. */
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),

  /** Updated timestamp. */
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

// Indexes
// CREATE INDEX idx_agent_configs_tenant ON agent_configs(tenant_id);
// CREATE INDEX idx_agent_configs_type ON agent_configs(tenant_id, agent_type);
// CREATE UNIQUE INDEX idx_agent_configs_default ON agent_configs(tenant_id, agent_type)
//   WHERE is_default = 1;
// CREATE UNIQUE INDEX idx_agent_configs_name ON agent_configs(tenant_id, name);

// RLS Policy
// CREATE POLICY agent_configs_tenant_isolation ON agent_configs
//   USING (tenant_id = current_setting('app.tenant_id')::uuid);
```

---

## Code Examples

### 1. Spawning an Agent

```typescript
import { createNaosRuntime } from '@mcv/agentic-os/naos';

// Create and initialize the runtime
const runtime = createNaosRuntime({
  tenantId: 'tenant-abc-123',
  databaseUrl: process.env.DATABASE_URL!,
  maxConcurrentProcesses: 50,
  defaultResourceLimits: {
    maxTokens: 100_000,
    maxTokensPerCall: 4_096,
    maxComputeTimeMs: 300_000,       // 5 minutes
    maxMemoryMb: 256,
    maxToolInvocations: 100,
    maxLlmCalls: 50,
    maxChildProcesses: 5,
    maxIpcMessagesPerMinute: 60,
    rateLimits: [],
    exhaustionPolicy: 'suspend',
    allowLimitEscalation: false,
  },
});

await runtime.initialize();

// Spawn a queen agent
const queen = await runtime.spawn({
  name: 'queen-main',
  agentType: 'queen',
  model: 'claude-sonnet-4-20250514',
  systemPrompt: `You are the queen orchestrator. Your job is to decompose
    complex tasks into subtasks and coordinate scout and worker agents.`,
  priority: 'high',
  tools: [
    'agent:spawn',
    'agent:message',
    'agent:query',
    'web:search',
    'fs:read',
    'fs:write',
  ],
  capabilities: [
    'tool:invoke',
    'tool:network:outbound',
    'tool:filesystem:read',
    'tool:filesystem:write',
    'agent:spawn',
    'agent:ipc:send',
    'agent:ipc:receive',
    'agent:ipc:broadcast',
  ],
  resourceLimits: {
    maxTokens: 500_000,       // Queen gets a bigger budget
    maxChildProcesses: 20,    // Can spawn many sub-agents
    maxLlmCalls: 200,
    exhaustionPolicy: 'escalate',
  },
  autoRestart: true,
  maxRestarts: 5,
  metadata: {
    purpose: 'Main orchestrator for user task pipeline',
    version: '1.2.0',
  },
});

console.log(`Queen spawned: PID=${queen.pid}, state=${queen.state}`);

// Spawn a scout under the queen
const scout = await runtime.spawn({
  name: 'scout-web-research',
  agentType: 'scout',
  parentPid: queen.pid,
  model: 'gpt-4o-mini',    // Scouts can use cheaper models
  systemPrompt: 'You are a web research scout. Search for information and report back.',
  priority: 'normal',
  tools: ['web:search', 'web:fetch', 'web:extract'],
  capabilities: [
    'tool:invoke',
    'tool:network:outbound',
    'agent:ipc:send',
    'agent:ipc:receive',
  ],
  resourceLimits: {
    maxTokens: 50_000,       // Scouts get less budget
    maxChildProcesses: 0,    // Scouts can't spawn children
    maxToolInvocations: 30,
    exhaustionPolicy: 'terminate',
  },
});

console.log(`Scout spawned: PID=${scout.pid}, parent=${queen.pid}`);
```

### 2. Setting and Enforcing Resource Limits

```typescript
import { createNaosRuntime, type ResourceLimits } from '@mcv/agentic-os/naos';

const runtime = createNaosRuntime({ /* ... */ });
await runtime.initialize();

// Define tiered resource limits
const TIER_LIMITS: Record<string, Partial<ResourceLimits>> = {
  free: {
    maxTokens: 10_000,
    maxTokensPerCall: 1_024,
    maxComputeTimeMs: 60_000,         // 1 minute
    maxMemoryMb: 64,
    maxToolInvocations: 10,
    maxLlmCalls: 5,
    maxChildProcesses: 0,
    maxIpcMessagesPerMinute: 10,
    exhaustionPolicy: 'terminate',
    allowLimitEscalation: false,
    maxCostUsd: 0.10,
  },
  pro: {
    maxTokens: 500_000,
    maxTokensPerCall: 8_192,
    maxComputeTimeMs: 600_000,        // 10 minutes
    maxMemoryMb: 512,
    maxToolInvocations: 200,
    maxLlmCalls: 100,
    maxChildProcesses: 10,
    maxIpcMessagesPerMinute: 120,
    exhaustionPolicy: 'suspend',
    allowLimitEscalation: true,
    maxCostUsd: 5.00,
    rateLimits: [
      { service: 'openai', maxRequests: 60, windowMs: 60_000, onLimit: 'queue' },
      { service: 'anthropic', maxRequests: 40, windowMs: 60_000, onLimit: 'queue' },
    ],
  },
  enterprise: {
    maxTokens: 10_000_000,
    maxTokensPerCall: 32_768,
    maxComputeTimeMs: 3_600_000,      // 1 hour
    maxMemoryMb: 2_048,
    maxToolInvocations: 5_000,
    maxLlmCalls: 1_000,
    maxChildProcesses: 50,
    maxIpcMessagesPerMinute: 600,
    exhaustionPolicy: 'escalate',
    allowLimitEscalation: true,
    maxCostUsd: 100.00,
  },
};

// Spawn with tier-specific limits
const agent = await runtime.spawn({
  name: 'worker-data-analysis',
  agentType: 'worker',
  resourceLimits: TIER_LIMITS.pro,
  // ...
});

// Monitor resource usage
const snapshot = await agent.getUsage();
console.log(`Token usage: ${snapshot.percentages.tokens}%`);
console.log(`Compute time: ${snapshot.percentages.computeTime}%`);
console.log(`Cost: $${snapshot.usage.estimatedCostUsd.toFixed(4)}`);

if (snapshot.warnings.length > 0) {
  for (const warning of snapshot.warnings) {
    console.warn(`⚠️ ${warning.resource}: ${warning.currentPercent}% used (threshold: ${warning.threshold}%)`);
  }
}

// Dynamically adjust limits (e.g., user upgraded mid-task)
await agent.updateLimits({
  maxTokens: 1_000_000,    // Doubled
  maxCostUsd: 10.00,       // Doubled
});

// Listen for resource exhaustion
runtime.onLifecycle({
  phase: 'resource-exhausted',
  handler: async (event) => {
    const { pid, resource, limit, actual, policy } = event as ResourceExhaustedEvent;
    console.error(`Process ${pid} exhausted ${resource}: ${actual}/${limit} (policy: ${policy})`);

    if (policy === 'escalate') {
      // Notify the parent process to decide
      const process = await runtime.getProcess(pid);
      if (process?.descriptor.parentPid) {
        await runtime.ipc.send(pid, process.descriptor.parentPid, {
          type: 'resource-exhausted',
          payload: { pid, resource, limit, actual },
        });
      }
    }
  },
});
```

### 3. Registering and Managing Tools

```typescript
import { createNaosRuntime, type ToolDescriptor, type ToolMiddleware } from '@mcv/agentic-os/naos';

const runtime = createNaosRuntime({ /* ... */ });
await runtime.initialize();

// Register tools in the global tool registry
await runtime.tools.register({
  id: 'web:search',
  name: 'Web Search',
  description: 'Search the web using Brave Search API. Returns titles, URLs, and snippets.',
  category: 'search',
  hasSideEffects: false,
  requiresConfirmation: false,
  enabled: true,
  inputSchema: {
    type: 'object',
    properties: {
      query: { type: 'string', description: 'Search query' },
      count: { type: 'number', description: 'Number of results (1-10)', default: 5 },
      freshness: { type: 'string', enum: ['pd', 'pw', 'pm', 'py'] },
    },
    required: ['query'],
  },
  outputSchema: {
    type: 'object',
    properties: {
      results: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            title: { type: 'string' },
            url: { type: 'string' },
            snippet: { type: 'string' },
          },
        },
      },
    },
  },
  estimatedCost: 0.001,
  rateLimit: { service: 'brave-search', maxRequests: 30, windowMs: 60_000, onLimit: 'queue' },
});

await runtime.tools.register({
  id: 'fs:write',
  name: 'Write File',
  description: 'Write content to a file. Creates parent directories if needed.',
  category: 'filesystem',
  hasSideEffects: true,
  requiresConfirmation: false,    // false for agents, but sandbox controls access
  enabled: true,
  inputSchema: {
    type: 'object',
    properties: {
      path: { type: 'string', description: 'File path' },
      content: { type: 'string', description: 'File content' },
    },
    required: ['path', 'content'],
  },
});

await runtime.tools.register({
  id: 'db:query',
  name: 'Database Query',
  description: 'Execute a read-only SQL query against the tenant database.',
  category: 'database',
  hasSideEffects: false,
  requiresConfirmation: true,     // Requires approval for DB access
  enabled: true,
  inputSchema: {
    type: 'object',
    properties: {
      sql: { type: 'string', description: 'SQL query (SELECT only)' },
      params: { type: 'array', description: 'Query parameters' },
    },
    required: ['sql'],
  },
});

// Add middleware for auditing all tool invocations
const auditMiddleware: ToolMiddleware = {
  name: 'audit-logger',
  priority: 0,  // Runs first
  before: async (invocation) => {
    console.log(`[AUDIT] Tool invocation: pid=${invocation.pid} tool=${invocation.toolId}`);
    console.log(`[AUDIT] Input: ${JSON.stringify(invocation.input).substring(0, 200)}`);
    return invocation;  // Pass through
  },
  after: async (invocation, result) => {
    console.log(`[AUDIT] Result: success=${result.success} duration=${result.durationMs}ms tokens=${result.tokensConsumed}`);
    return result;  // Pass through
  },
};

await runtime.tools.addMiddleware('*', auditMiddleware);  // Apply to all tools

// Add middleware to block dangerous file paths
const pathGuard: ToolMiddleware = {
  name: 'path-guard',
  priority: 10,
  before: async (invocation) => {
    if (invocation.toolId === 'fs:write') {
      const path = invocation.input.path as string;
      const forbidden = ['/etc/', '/sys/', '/proc/', 'C:\\Windows\\', '.env', '.ssh'];
      if (forbidden.some(f => path.includes(f))) {
        return null;  // Reject the invocation
      }
    }
    return invocation;
  },
};

await runtime.tools.addMiddleware('fs:write', pathGuard);

// Set per-agent-type tool permissions
await runtime.tools.setPermission({
  agentType: 'scout',
  toolId: 'fs:write',
  canInvoke: false,         // Scouts cannot write files
});

await runtime.tools.setPermission({
  agentType: 'scout',
  toolId: 'web:search',
  canInvoke: true,
  maxInvocationsPerMinute: 10,
  requiresApproval: false,
});

await runtime.tools.setPermission({
  agentType: 'worker',
  toolId: 'db:query',
  canInvoke: true,
  maxInvocations: 50,       // Max 50 queries per process lifetime
  requiresApproval: false,  // Override: workers can query without approval
  parameterConstraints: {
    sql: '^SELECT\\s',       // Must start with SELECT
  },
});

// Query available tools for a process
const agent = await runtime.getProcess('some-pid');
if (agent) {
  const manifest = agent.descriptor.toolManifest;
  console.log(`Agent has access to ${manifest.toolIds.length} tools`);
}
```

### 4. Monitoring Agent Health

```typescript
import { createNaosRuntime } from '@mcv/agentic-os/naos';

const runtime = createNaosRuntime({ /* ... */ });
await runtime.initialize();

// Subscribe to crash events
const unsubCrash = runtime.monitor.onCrash((report) => {
  console.error(`🔴 CRASH: Process ${report.name} (${report.pid})`);
  console.error(`   Error: ${report.error.message}`);
  console.error(`   Crash count: ${report.crashCount}`);
  console.error(`   Auto-restarted: ${report.autoRestarted}`);

  if (report.crashCount >= 3) {
    console.error(`   ⚠️ Crash loop detected — notifying admin`);
    // Send alert via notification system
  }

  // Log the last few entries for debugging
  for (const log of report.lastLogs) {
    console.error(`   [${log.level}] ${log.message}`);
  }
});

// Subscribe to health changes
const unsubHealth = runtime.monitor.onHealthChange((pid, status) => {
  if (status === 'degraded') {
    console.warn(`⚠️ Process ${pid} is degraded`);
  } else if (status === 'unresponsive') {
    console.error(`🔴 Process ${pid} is unresponsive`);
  }
});

// Periodic health dashboard
async function printHealthDashboard() {
  const allHealth = await runtime.monitor.getAllHealth();
  const metrics = await runtime.getMetrics();

  console.log('\n=== NAOS Health Dashboard ===');
  console.log(`Instance: ${metrics.instanceId}`);
  console.log(`Uptime: ${Math.round(metrics.uptimeMs / 1000)}s`);
  console.log(`Active: ${metrics.activeProcesses} | Suspended: ${metrics.suspendedProcesses}`);
  console.log(`Total tokens: ${metrics.totalTokensConsumed.toLocaleString()}`);
  console.log(`Crashes: ${metrics.crashCount}`);
  console.log('');

  for (const [pid, status] of allHealth) {
    const agentMetrics = await runtime.monitor.getMetrics(pid);
    const icon = status === 'healthy' ? '🟢' :
                 status === 'degraded' ? '🟡' :
                 status === 'unresponsive' ? '🔴' : '⚫';

    console.log(`${icon} ${agentMetrics.name} (${agentMetrics.agentType})`);
    console.log(`   PID: ${pid} | State: ${agentMetrics.state}`);
    console.log(`   Tokens: ${agentMetrics.tokensConsumed.toLocaleString()} (${agentMetrics.tokensPerMinute}/min)`);
    console.log(`   Tools: ${agentMetrics.toolInvocations} invocations`);
    console.log(`   LLM: ${agentMetrics.llmCalls} calls, avg ${agentMetrics.avgLlmLatencyMs}ms, p95 ${agentMetrics.p95LlmLatencyMs}ms`);
    console.log(`   Memory: ${agentMetrics.memoryMb}MB`);

    if (agentMetrics.sandboxViolations > 0) {
      console.log(`   ⚠️ Sandbox violations: ${agentMetrics.sandboxViolations}`);
    }
    if (agentMetrics.errors > 0) {
      console.log(`   ⚠️ Errors: ${agentMetrics.errors}`);
    }
  }
}

// Print dashboard every 30 seconds
setInterval(printHealthDashboard, 30_000);

// Get crash reports for the last hour
const recentCrashes = await runtime.monitor.getCrashReports(
  new Date(Date.now() - 3_600_000)
);
console.log(`Crashes in last hour: ${recentCrashes.length}`);
```

### 5. IPC — Inter-Agent Messaging

```typescript
import { createNaosRuntime, type IpcMessage } from '@mcv/agentic-os/naos';

const runtime = createNaosRuntime({ /* ... */ });
await runtime.initialize();

// Spawn a queen and workers
const queen = await runtime.spawn({
  name: 'queen-coordinator',
  agentType: 'queen',
  capabilities: [
    'tool:invoke',
    'agent:spawn',
    'agent:ipc:send',
    'agent:ipc:receive',
    'agent:ipc:broadcast',
    'state:write',
    'state:read',
  ],
  // ...
});

const worker1 = await runtime.spawn({
  name: 'worker-alpha',
  agentType: 'worker',
  parentPid: queen.pid,
  capabilities: [
    'tool:invoke',
    'agent:ipc:send',
    'agent:ipc:receive',
    'state:read',
  ],
  // ...
});

const worker2 = await runtime.spawn({
  name: 'worker-beta',
  agentType: 'worker',
  parentPid: queen.pid,
  capabilities: [
    'tool:invoke',
    'agent:ipc:send',
    'agent:ipc:receive',
    'state:read',
  ],
  // ...
});

// === Point-to-Point Messaging ===
// Queen sends a task to worker-alpha
await queen.send({
  type: 'task:assign',
  payload: {
    taskId: 'task-001',
    description: 'Analyze Q4 revenue data',
    deadline: new Date(Date.now() + 300_000),
  },
  priority: 'high',
});

// Worker listens for messages
worker1.on('ipc:message', (event) => {
  const msg = event.message as IpcMessage;
  if (msg.type === 'task:assign') {
    console.log(`Worker received task: ${JSON.stringify(msg.payload)}`);
    // Process the task...
  }
});

// === Request/Reply Pattern ===
// Queen asks worker for a status update and waits for the reply
const statusReply = await runtime.ipc.request(
  queen.pid,
  worker1.pid,
  {
    type: 'status:request',
    payload: { taskId: 'task-001' },
  },
  10_000  // 10 second timeout
);
console.log(`Worker status: ${JSON.stringify(statusReply.payload)}`);

// === Pub/Sub Channels ===
// Create a channel for progress updates
const progressSub = runtime.ipc.subscribe(queen.pid, 'progress', (msg) => {
  const { taskId, percent, status } = msg.payload as any;
  console.log(`[Progress] Task ${taskId}: ${percent}% — ${status}`);
});

// Workers publish progress
await runtime.ipc.publish(worker1.pid, 'progress', {
  type: 'progress:update',
  payload: { taskId: 'task-001', percent: 50, status: 'Analyzing data...' },
});

await runtime.ipc.publish(worker2.pid, 'progress', {
  type: 'progress:update',
  payload: { taskId: 'task-002', percent: 75, status: 'Generating report...' },
});

// === Broadcast ===
// Queen broadcasts to all agents
await runtime.ipc.broadcast(queen.pid, {
  type: 'system:shutdown-warning',
  payload: { reason: 'Maintenance window', gracePeriodMs: 60_000 },
  priority: 'urgent',
});

// === Shared State ===
// Queen creates shared state for coordination
const taskBoard = runtime.ipc.getSharedState('task-board');

await taskBoard.set('task-001', {
  assignee: worker1.pid,
  status: 'in-progress',
  priority: 'high',
});

await taskBoard.set('task-002', {
  assignee: worker2.pid,
  status: 'in-progress',
  priority: 'normal',
});

// Workers can read shared state
const task = await taskBoard.getKey('task-001');
console.log(`Task 001 status: ${(task as any).status}`);

// Watch for changes
const unsubState = taskBoard.onChange((key, value, changedBy) => {
  console.log(`[State] ${key} changed by ${changedBy}: ${JSON.stringify(value)}`);
});

// Atomic update with compare-and-swap
const swapped = await taskBoard.cas(
  'task-001',
  { assignee: worker1.pid, status: 'in-progress', priority: 'high' },
  { assignee: worker1.pid, status: 'completed', priority: 'high' },
);
console.log(`CAS succeeded: ${swapped}`);

// Clean up
progressSub.unsubscribe();
unsubState();
```

### 6. Sandbox Configuration and Violation Handling

```typescript
import { createNaosRuntime, type SandboxConfig, NaosError, NaosErrorCode } from '@mcv/agentic-os/naos';

const runtime = createNaosRuntime({ /* ... */ });
await runtime.initialize();

// Spawn an agent with hardened sandbox
const sensitiveWorker = await runtime.spawn({
  name: 'worker-pii-processor',
  agentType: 'specialist',
  isolationLevel: 'hardened',
  capabilities: [
    'tool:invoke',
    'tool:database:read',    // Can read DB
    // Notably missing: tool:network:outbound — can't exfiltrate data
    // Notably missing: tool:filesystem:write — can't write to disk
    'agent:ipc:send',        // Can report results back
    'state:own:read',
    'state:own:write',
  ],
  resourceLimits: {
    maxTokens: 100_000,
    maxToolInvocations: 50,
    exhaustionPolicy: 'terminate',
    allowLimitEscalation: false,  // No escalation for sensitive work
  },
  metadata: {
    dataClassification: 'pii',
    auditLevel: 'full',
  },
});

// The sandbox enforces capabilities at runtime
// If the agent tries to make a network request:
try {
  await sensitiveWorker.descriptor.sandbox.assertCapability('tool:network:outbound');
} catch (err) {
  if (err instanceof NaosError && err.code === NaosErrorCode.CAPABILITY_DENIED) {
    console.log('✅ Correctly blocked: agent cannot make outbound network requests');
    // This violation is automatically recorded in the sandbox
  }
}

// Query sandbox violations
const violations = sensitiveWorker.descriptor.sandbox.getViolations();
for (const v of violations) {
  console.log(`Violation: attempted ${v.attemptedCapability} at ${v.timestamp}`);
  console.log(`  Severity: ${v.severity}, Action: ${v.actionTaken}`);
  console.log(`  Context: ${v.context}`);
}

// Configure violation auto-response
// (The sandbox auto-terminates after 3 critical violations)
```

### 7. Agent Lifecycle Management

```typescript
import { createNaosRuntime } from '@mcv/agentic-os/naos';

const runtime = createNaosRuntime({ /* ... */ });
await runtime.initialize();

// Spawn a daemon agent (long-running)
const daemon = await runtime.spawn({
  name: 'daemon-inbox-watcher',
  agentType: 'daemon',
  autoRestart: true,
  maxRestarts: 10,
  restartWindowMs: 600_000,  // 10-minute window for restart counting
  priority: 'low',
  // ...
});

// Register lifecycle hooks
runtime.onLifecycle({
  phase: 'state-change',
  handler: async (event) => {
    console.log(`Process ${event.pid}: ${event.fromState} → ${event.toState}`);
  },
});

// Suspend an agent (preserves state for later resumption)
await daemon.suspend('Maintenance window');
console.log(`Daemon state: ${daemon.state}`);  // 'suspended'

// Resume the agent
await daemon.resume();
console.log(`Daemon state: ${daemon.state}`);  // 'running'

// Wait for an ephemeral agent to complete
const ephemeral = await runtime.spawn({
  name: 'one-shot-summarizer',
  agentType: 'ephemeral',
  resourceLimits: {
    maxTokens: 10_000,
    maxComputeTimeMs: 30_000,
    exhaustionPolicy: 'terminate',
  },
  // ...
});

const exitInfo = await ephemeral.wait();
console.log(`Ephemeral agent exited: code=${exitInfo.exitCode}, tokens=${exitInfo.tokensConsumed}`);

// List all running processes
const running = await runtime.listProcesses({ state: 'running' });
console.log(`Running processes: ${running.length}`);
for (const proc of running) {
  console.log(`  ${proc.name} (${proc.agentType}) — PID: ${proc.pid}`);
}

// Graceful shutdown — suspends all agents
await runtime.shutdown({ gracePeriodMs: 30_000, saveState: true });
```

---

## Error Codes

All NAOS errors extend `NaosError` and include a machine-readable error code, human-readable message, and optional context.

```typescript
class NaosError extends Error {
  constructor(
    public readonly code: NaosErrorCode,
    message: string,
    public readonly context?: Record<string, unknown>,
  ) {
    super(`[${code}] ${message}`);
    this.name = 'NaosError';
  }
}
```

| Code | Constant | Description |
|------|----------|-------------|
| `NAOS_PROCESS_NOT_FOUND` | `NaosErrorCode.PROCESS_NOT_FOUND` | The specified PID does not exist or has been reaped. |
| `NAOS_INVALID_TRANSITION` | `NaosErrorCode.INVALID_TRANSITION` | Attempted an invalid state transition (e.g., `terminated` → `running`). |
| `NAOS_RESOURCE_EXHAUSTED` | `NaosErrorCode.RESOURCE_EXHAUSTED` | An agent exceeded its resource limits. Includes which resource and the limit/actual values. |
| `NAOS_CAPABILITY_DENIED` | `NaosErrorCode.CAPABILITY_DENIED` | An agent attempted an action its sandbox does not permit. Logged as a sandbox violation. |
| `NAOS_TOOL_NOT_FOUND` | `NaosErrorCode.TOOL_NOT_FOUND` | The requested tool ID is not registered in the global tool registry. |
| `NAOS_TOOL_PERMISSION_DENIED` | `NaosErrorCode.TOOL_PERMISSION_DENIED` | The agent does not have permission to invoke this tool (per its tool manifest/permissions). |
| `NAOS_TOOL_RATE_LIMITED` | `NaosErrorCode.TOOL_RATE_LIMITED` | The agent exceeded the rate limit for a specific tool or external service. |
| `NAOS_MAX_PROCESSES` | `NaosErrorCode.MAX_PROCESSES` | The runtime has reached its maximum concurrent process limit. |
| `NAOS_MAX_CHILDREN` | `NaosErrorCode.MAX_CHILDREN` | The parent agent has reached its maximum child process limit. |
| `NAOS_IPC_TIMEOUT` | `NaosErrorCode.IPC_TIMEOUT` | An IPC request/reply timed out waiting for a response. |
| `NAOS_IPC_REJECTED` | `NaosErrorCode.IPC_REJECTED` | An IPC message was rejected (recipient doesn't have receive capability, or message was expired). |
| `NAOS_STATE_CONFLICT` | `NaosErrorCode.STATE_CONFLICT` | Optimistic concurrency conflict on shared state (version mismatch). Retry with fresh state. |
| `NAOS_SANDBOX_VIOLATION_LIMIT` | `NaosErrorCode.SANDBOX_VIOLATION_LIMIT` | The agent accumulated too many sandbox violations and was auto-terminated. |
| `NAOS_SPAWN_FAILED` | `NaosErrorCode.SPAWN_FAILED` | Failed to spawn an agent process. Includes the underlying cause. |
| `NAOS_SCHEDULER_FULL` | `NaosErrorCode.SCHEDULER_FULL` | The scheduler queue is at maximum capacity. Reject or retry later. |
| `NAOS_CRASH_LOOP` | `NaosErrorCode.CRASH_LOOP` | The agent has crashed and restarted too many times within the restart window. Auto-restart disabled. |
| `NAOS_RUNTIME_NOT_INITIALIZED` | `NaosErrorCode.RUNTIME_NOT_INITIALIZED` | Attempted to use the runtime before calling `initialize()`. |
| `NAOS_SHUTDOWN_IN_PROGRESS` | `NaosErrorCode.SHUTDOWN_IN_PROGRESS` | Attempted to spawn or perform operations while the runtime is shutting down. |

```typescript
enum NaosErrorCode {
  PROCESS_NOT_FOUND = 'NAOS_PROCESS_NOT_FOUND',
  INVALID_TRANSITION = 'NAOS_INVALID_TRANSITION',
  RESOURCE_EXHAUSTED = 'NAOS_RESOURCE_EXHAUSTED',
  CAPABILITY_DENIED = 'NAOS_CAPABILITY_DENIED',
  TOOL_NOT_FOUND = 'NAOS_TOOL_NOT_FOUND',
  TOOL_PERMISSION_DENIED = 'NAOS_TOOL_PERMISSION_DENIED',
  TOOL_RATE_LIMITED = 'NAOS_TOOL_RATE_LIMITED',
  MAX_PROCESSES = 'NAOS_MAX_PROCESSES',
  MAX_CHILDREN = 'NAOS_MAX_CHILDREN',
  IPC_TIMEOUT = 'NAOS_IPC_TIMEOUT',
  IPC_REJECTED = 'NAOS_IPC_REJECTED',
  STATE_CONFLICT = 'NAOS_STATE_CONFLICT',
  SANDBOX_VIOLATION_LIMIT = 'NAOS_SANDBOX_VIOLATION_LIMIT',
  SPAWN_FAILED = 'NAOS_SPAWN_FAILED',
  SCHEDULER_FULL = 'NAOS_SCHEDULER_FULL',
  CRASH_LOOP = 'NAOS_CRASH_LOOP',
  RUNTIME_NOT_INITIALIZED = 'NAOS_RUNTIME_NOT_INITIALIZED',
  SHUTDOWN_IN_PROGRESS = 'NAOS_SHUTDOWN_IN_PROGRESS',
}
```

---

## Security

NAOS is the **single enforcement boundary** for agent operations. Every action an agent takes passes through NAOS. This makes security design straightforward in principle but absolutely critical to get right.

### Threat Model

| Threat | Mitigation |
|--------|-----------|
| **Agent exfiltrates data** | Sandbox capability system — agents without `tool:network:outbound` cannot make any external requests. PII-processing agents run in `hardened` sandboxes with no network access. |
| **Agent exceeds resource budget** | ResourceGovernor enforces hard limits per process. Limits are checked before every LLM call and tool invocation. Exceeded limits trigger configurable policies (suspend/terminate/escalate). |
| **Agent accesses another tenant's data** | PostgreSQL RLS policies on every table. `tenant_id` is set at the connection level via `SET app.tenant_id`. No cross-tenant queries are possible at the DB level, regardless of what the agent does. |
| **Agent spawns unbounded sub-agents** | `maxChildProcesses` limit per process. `MAX_CONCURRENT_AGENTS` limit per runtime instance. Recursive spawning is depth-limited. |
| **Agent calls unauthorized tools** | ToolRegistry permission matrix. Every tool invocation is checked against the agent's manifest before execution. Denied invocations are logged as sandbox violations. |
| **Agent manipulates shared state** | Shared state requires explicit `state:write` capability. Optimistic concurrency control prevents race conditions. Hardened sandboxes can only access their own state (`state:own:*`). |
| **Agent crash loop consumes resources** | Crash loop detection (configurable threshold + window). After N crashes in M minutes, auto-restart is disabled and the process is moved to `zombie` state for manual review. |
| **Prompt injection via IPC** | IPC messages are typed and structured — not raw text injected into prompts. The receiving agent's message handler parses the structured payload, not a raw string. |
| **Agent escalates privileges** | Capabilities are immutable after sandbox creation. The `escalate:limits` capability only allows requesting *resource* increases, not capability changes. Capability changes require a new sandbox (terminate + respawn). |
| **Malicious tool middleware** | Middleware runs within the NAOS runtime process, not within the agent's sandbox. Middleware is registered by the platform operator, not by agents. Agents cannot install their own middleware. |

### Capability-Based Security Model

NAOS uses a **capability-based security** model inspired by operating systems like seL4 and Capsicum. Each agent process is granted a set of capabilities at spawn time. These capabilities are:

1. **Fine-grained** — `tool:filesystem:read` vs `tool:filesystem:write` are separate capabilities.
2. **Non-escalatable** — An agent cannot grant itself new capabilities. Only the spawning parent (or the platform) can set capabilities.
3. **Auditable** — Every capability check is logged in `hardened` mode. Violations are always logged regardless of isolation level.
4. **Monotonically decreasing** — A parent can grant a child at most the capabilities it has itself. You cannot delegate what you don't possess.

```
Queen (20 capabilities)
├── Scout (8 capabilities — subset of queen's)
├── Worker (12 capabilities — subset of queen's)
│   └── Sub-worker (6 capabilities — subset of worker's)
└── Specialist (4 capabilities — minimal, hardened)
```

### Multi-Tenant Isolation

Every row in every NAOS table includes a `tenant_id` column with RLS enforced at the PostgreSQL level:

```sql
-- Applied to all NAOS tables
ALTER TABLE agent_processes ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation ON agent_processes
  USING (tenant_id = current_setting('app.tenant_id')::uuid)
  WITH CHECK (tenant_id = current_setting('app.tenant_id')::uuid);

-- Connection-level tenant context (set by the application)
SET app.tenant_id = 'tenant-uuid-here';
```

At the application level, the NAOS runtime is instantiated with a `tenantId` that is validated against the authenticated session. There is no API to change the tenant ID after initialization.

### Audit Trail

NAOS maintains a complete audit trail via:

1. **process_logs** — Every state transition, tool invocation, IPC message, and error is logged with the PID, timestamp, and context.
2. **resource_usage** — Time-series snapshots of resource consumption, including which limits were exceeded and when.
3. **sandbox_violations** — Every denied capability check, with the attempted action and severity.
4. **Tool middleware** — The audit middleware logs every tool invocation's input and output (configurable per tool/tenant).

All audit data is retained per the `metricsRetentionMs` configuration (default: 24 hours for real-time data, with aggregated summaries retained indefinitely).

---

## Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `NAOS_DATABASE_URL` | Yes | — | Supabase PostgreSQL connection string. |
| `NAOS_REDIS_URL` | No | — | Redis URL for distributed IPC pub/sub. Required for multi-server deployments. |
| `NAOS_INSTANCE_ID` | No | Auto-generated UUID | Unique identifier for this runtime instance. |
| `NAOS_MAX_CONCURRENT_PROCESSES` | No | `50` | Maximum agent processes per runtime instance. |
| `NAOS_DEFAULT_TOKEN_BUDGET` | No | `100000` | Default max tokens per agent. |
| `NAOS_DEFAULT_COMPUTE_TIMEOUT_MS` | No | `300000` | Default max compute time per agent (ms). |
| `NAOS_DEFAULT_MEMORY_LIMIT_MB` | No | `256` | Default max memory per agent (MB). |
| `NAOS_DEFAULT_ISOLATION_LEVEL` | No | `isolated` | Default sandbox isolation level (`shared`, `isolated`, `hardened`). |
| `NAOS_HEARTBEAT_INTERVAL_MS` | No | `15000` | How often agents should send heartbeats. |
| `NAOS_HEARTBEAT_TIMEOUT_MS` | No | `30000` | How long before a missing heartbeat triggers "unresponsive". |
| `NAOS_MAX_MISSED_HEARTBEATS` | No | `3` | Missed heartbeats before declaring "crashed". |
| `NAOS_SCHEDULER_ALGORITHM` | No | `priority-fifo` | Scheduling algorithm (`priority-fifo`, `fair-share`, `deadline-aware`). |
| `NAOS_SCHEDULER_MAX_CONCURRENT` | No | `10` | Maximum concurrent tasks in the scheduler. |
| `NAOS_SCHEDULER_MAX_QUEUE_DEPTH` | No | `1000` | Maximum task queue depth before rejecting. |
| `NAOS_CRASH_LOOP_THRESHOLD` | No | `5` | Crashes within window before disabling auto-restart. |
| `NAOS_CRASH_LOOP_WINDOW_MS` | No | `300000` | Crash loop detection window (ms). |
| `NAOS_METRICS_RETENTION_MS` | No | `86400000` | How long to retain detailed metrics (ms). |
| `NAOS_STATE_ENCRYPTION_KEY` | No | — | AES-256 key for encrypting saved agent state at rest. Recommended for production. |
| `NAOS_LOG_LEVEL` | No | `info` | Minimum log level (`debug`, `info`, `warn`, `error`). |
| `NAOS_ENABLE_DISTRIBUTED_IPC` | No | `false` | Whether to enable Redis-backed distributed IPC. |
| `NAOS_PROCESS_GC_INTERVAL_MS` | No | `60000` | How often to garbage-collect zombie processes (ms). |

---

## Dependencies

### Internal (MCV)

| Package | Purpose |
|---------|---------|
| `@mcv/db` | Drizzle ORM schemas, database client, migration utilities. |
| `@mcv/auth` | Tenant authentication and session validation. Provides the `tenantId` for RLS context. |
| `@mcv/trpc` | tRPC router utilities and context creation. |
| `@mcv/logger` | Structured logging with tenant context and trace IDs. |
| `@mcv/config` | Environment variable loading and validation. |
| `@mcv/events` | Internal event bus for lifecycle and monitoring events. |
| `@mcv/crypto` | AES-256 encryption for saved agent state at rest. |

### External

| Package | Version | Purpose |
|---------|---------|---------|
| `drizzle-orm` | `^0.30.0` | Type-safe SQL query builder and schema definitions. |
| `@trpc/server` | `^10.0.0` | tRPC server for the NAOS API surface. |
| `ioredis` | `^5.0.0` | Redis client for distributed IPC pub/sub (optional, only needed for multi-server). |
| `zod` | `^3.22.0` | Input validation for tRPC procedures and configuration. |
| `nanoid` | `^5.0.0` | Compact unique ID generation for message correlation IDs. |
| `prom-client` | `^15.0.0` | Prometheus metrics for monitoring integration (optional). |
| `superjson` | `^2.0.0` | JSON serialization with Date/Map/Set support for IPC messages and saved state. |

---

## tRPC Router

The NAOS tRPC router exposes the runtime's functionality to the application layer. All procedures require authenticated tenant context.

```typescript
import { router, protectedProcedure } from '@mcv/trpc';
import { z } from 'zod';

export const naosRouter = router({
  // === Process Management ===
  spawn: protectedProcedure
    .input(z.object({
      name: z.string().min(1).max(128),
      agentType: z.enum(['queen', 'scout', 'worker', 'specialist', 'daemon', 'ephemeral']),
      parentPid: z.string().uuid().optional(),
      model: z.string().optional(),
      systemPrompt: z.string().optional(),
      tools: z.array(z.string()).optional(),
      priority: z.enum(['critical', 'high', 'normal', 'low', 'idle']).optional(),
      resourceLimits: z.object({
        maxTokens: z.number().positive().optional(),
        maxComputeTimeMs: z.number().positive().optional(),
        maxToolInvocations: z.number().nonnegative().optional(),
        maxLlmCalls: z.number().nonnegative().optional(),
        maxChildProcesses: z.number().nonnegative().optional(),
      }).optional(),
      metadata: z.record(z.unknown()).optional(),
      autoRestart: z.boolean().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const handle = await ctx.naos.spawn({
        ...input,
        // tenantId is injected from auth context
      });
      return { pid: handle.pid, state: handle.state };
    }),

  getProcess: protectedProcedure
    .input(z.object({ pid: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const handle = await ctx.naos.getProcess(input.pid);
      if (!handle) throw new NaosError(NaosErrorCode.PROCESS_NOT_FOUND, `Process ${input.pid} not found`);
      return handle.descriptor;
    }),

  listProcesses: protectedProcedure
    .input(z.object({
      state: z.enum(['created', 'initializing', 'running', 'suspended', 'waiting', 'terminating', 'terminated', 'crashed', 'zombie']).optional(),
      agentType: z.enum(['queen', 'scout', 'worker', 'specialist', 'daemon', 'ephemeral']).optional(),
      parentPid: z.string().uuid().optional(),
      limit: z.number().min(1).max(100).optional(),
      offset: z.number().min(0).optional(),
    }).optional())
    .query(async ({ ctx, input }) => {
      return ctx.naos.listProcesses(input);
    }),

  suspend: protectedProcedure
    .input(z.object({ pid: z.string().uuid(), reason: z.string().optional() }))
    .mutation(async ({ ctx, input }) => {
      const handle = await ctx.naos.getProcess(input.pid);
      if (!handle) throw new NaosError(NaosErrorCode.PROCESS_NOT_FOUND, `Process ${input.pid} not found`);
      await handle.suspend(input.reason);
      return { pid: input.pid, state: 'suspended' };
    }),

  resume: protectedProcedure
    .input(z.object({ pid: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const handle = await ctx.naos.getProcess(input.pid);
      if (!handle) throw new NaosError(NaosErrorCode.PROCESS_NOT_FOUND, `Process ${input.pid} not found`);
      await handle.resume();
      return { pid: input.pid, state: 'running' };
    }),

  terminate: protectedProcedure
    .input(z.object({ pid: z.string().uuid(), reason: z.string().optional() }))
    .mutation(async ({ ctx, input }) => {
      const handle = await ctx.naos.getProcess(input.pid);
      if (!handle) throw new NaosError(NaosErrorCode.PROCESS_NOT_FOUND, `Process ${input.pid} not found`);
      await handle.terminate(input.reason);
      return { pid: input.pid, state: 'terminated' };
    }),

  // === Resource Management ===
  getUsage: protectedProcedure
    .input(z.object({ pid: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const handle = await ctx.naos.getProcess(input.pid);
      if (!handle) throw new NaosError(NaosErrorCode.PROCESS_NOT_FOUND, `Process ${input.pid} not found`);
      return handle.getUsage();
    }),

  updateLimits: protectedProcedure
    .input(z.object({
      pid: z.string().uuid(),
      limits: z.object({
        maxTokens: z.number().positive().optional(),
        maxComputeTimeMs: z.number().positive().optional(),
        maxToolInvocations: z.number().nonnegative().optional(),
        maxCostUsd: z.number().nonnegative().optional(),
      }),
    }))
    .mutation(async ({ ctx, input }) => {
      const handle = await ctx.naos.getProcess(input.pid);
      if (!handle) throw new NaosError(NaosErrorCode.PROCESS_NOT_FOUND, `Process ${input.pid} not found`);
      await handle.updateLimits(input.limits);
      return { pid: input.pid, updated: true };
    }),

  // === Monitoring ===
  getHealth: protectedProcedure
    .input(z.object({ pid: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      return ctx.naos.monitor.getHealth(input.pid);
    }),

  getMetrics: protectedProcedure
    .query(async ({ ctx }) => {
      return ctx.naos.getMetrics();
    }),

  getAgentMetrics: protectedProcedure
    .input(z.object({ pid: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      return ctx.naos.monitor.getMetrics(input.pid);
    }),

  getCrashReports: protectedProcedure
    .input(z.object({
      since: z.date(),
      until: z.date().optional(),
    }))
    .query(async ({ ctx, input }) => {
      return ctx.naos.monitor.getCrashReports(input.since, input.until);
    }),

  // === IPC ===
  sendMessage: protectedProcedure
    .input(z.object({
      from: z.string().uuid(),
      to: z.string().uuid(),
      message: z.object({
        type: z.string(),
        payload: z.unknown(),
        priority: z.enum(['normal', 'high', 'urgent']).optional(),
        ttlMs: z.number().positive().optional(),
      }),
    }))
    .mutation(async ({ ctx, input }) => {
      await ctx.naos.ipc.send(input.from, input.to, input.message);
      return { sent: true };
    }),

  // === Configs ===
  getConfigs: protectedProcedure
    .input(z.object({
      agentType: z.enum(['queen', 'scout', 'worker', 'specialist', 'daemon', 'ephemeral']).optional(),
    }).optional())
    .query(async ({ ctx, input }) => {
      return ctx.naos.getConfigs(input);
    }),
});

export type NaosRouter = typeof naosRouter;
```

---

## Testing

### Unit Tests

NAOS subsystems are tested in isolation with mocked dependencies.

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { ProcessManager } from '@mcv/agentic-os/naos';
import { createMockDb, createMockMonitor } from './test-utils';

describe('ProcessManager', () => {
  let pm: ProcessManager;

  beforeEach(() => {
    pm = new ProcessManager({
      db: createMockDb(),
      monitor: createMockMonitor(),
      tenantId: 'test-tenant',
    });
  });

  it('should spawn a process and assign a PID', async () => {
    const handle = await pm.spawn({
      name: 'test-agent',
      agentType: 'worker',
    });

    expect(handle.pid).toBeDefined();
    expect(handle.state).toBe('created');
  });

  it('should enforce valid state transitions', async () => {
    const handle = await pm.spawn({ name: 'test', agentType: 'worker' });

    // created → running (via initializing) is valid
    await handle.resume();  // internally: created → initializing → running

    // running → terminated is valid
    await handle.terminate();
    expect(handle.state).toBe('terminated');

    // terminated → running is invalid
    await expect(handle.resume()).rejects.toThrow('NAOS_INVALID_TRANSITION');
  });

  it('should respect maxChildProcesses limit', async () => {
    const parent = await pm.spawn({
      name: 'parent',
      agentType: 'queen',
      resourceLimits: { maxChildProcesses: 2 },
    });

    await pm.spawn({ name: 'child-1', agentType: 'worker', parentPid: parent.pid });
    await pm.spawn({ name: 'child-2', agentType: 'worker', parentPid: parent.pid });

    await expect(
      pm.spawn({ name: 'child-3', agentType: 'worker', parentPid: parent.pid })
    ).rejects.toThrow('NAOS_MAX_CHILDREN');
  });
});
```

### Integration Tests

Integration tests run against a real Supabase PostgreSQL instance (test database) and verify end-to-end flows.

```typescript
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createNaosRuntime, type NaosRuntime } from '@mcv/agentic-os/naos';
import { setupTestDb, teardownTestDb } from './test-utils';

describe('NAOS Integration', () => {
  let runtime: NaosRuntime;

  beforeAll(async () => {
    await setupTestDb();
    runtime = createNaosRuntime({
      tenantId: 'test-tenant',
      databaseUrl: process.env.TEST_DATABASE_URL!,
    });
    await runtime.initialize();
  });

  afterAll(async () => {
    await runtime.shutdown({ gracePeriodMs: 5_000 });
    await teardownTestDb();
  });

  it('should spawn, run, and terminate an agent', async () => {
    const agent = await runtime.spawn({
      name: 'integration-test-agent',
      agentType: 'ephemeral',
      resourceLimits: { maxTokens: 1_000 },
    });

    expect(agent.pid).toBeDefined();
    expect(agent.state).toBe('running');

    await agent.terminate('test complete');
    const exitInfo = await agent.wait();
    expect(exitInfo.state).toBe('terminated');
    expect(exitInfo.exitCode).toBe(0);
  });

  it('should enforce resource limits', async () => {
    const agent = await runtime.spawn({
      name: 'limited-agent',
      agentType: 'ephemeral',
      resourceLimits: {
        maxTokens: 100,
        exhaustionPolicy: 'terminate',
      },
    });

    // Simulate token consumption exceeding limit
    // (In real tests, this would be done via actual LLM calls)
    await simulateTokenConsumption(agent.pid, 150);

    const exitInfo = await agent.wait();
    expect(exitInfo.state).toBe('terminated');
    expect(exitInfo.exitReason).toContain('RESOURCE_EXHAUSTED');
  });

  it('should handle IPC between agents', async () => {
    const sender = await runtime.spawn({
      name: 'ipc-sender',
      agentType: 'worker',
      capabilities: ['agent:ipc:send'],
    });

    const receiver = await runtime.spawn({
      name: 'ipc-receiver',
      agentType: 'worker',
      capabilities: ['agent:ipc:receive'],
    });

    const received: IpcMessage[] = [];
    receiver.on('ipc:message', (event) => {
      received.push(event.message);
    });

    await sender.send({
      type: 'test:ping',
      payload: { message: 'hello' },
    });

    // Wait for delivery
    await new Promise(resolve => setTimeout(resolve, 100));
    expect(received).toHaveLength(1);
    expect(received[0].type).toBe('test:ping');
    expect(received[0].payload).toEqual({ message: 'hello' });
  });

  it('should block unauthorized tool invocations', async () => {
    const agent = await runtime.spawn({
      name: 'restricted-agent',
      agentType: 'scout',
      capabilities: [
        'tool:invoke',
        'tool:network:outbound',
        // Notably missing: tool:filesystem:write
      ],
    });

    // Attempting to use a filesystem write tool should fail
    await expect(
      agent.descriptor.sandbox.assertCapability('tool:filesystem:write')
    ).rejects.toThrow('NAOS_CAPABILITY_DENIED');

    const violations = agent.descriptor.sandbox.getViolations();
    expect(violations).toHaveLength(1);
    expect(violations[0].attemptedCapability).toBe('tool:filesystem:write');
  });
});
```

### Load Tests

For production readiness, NAOS should be