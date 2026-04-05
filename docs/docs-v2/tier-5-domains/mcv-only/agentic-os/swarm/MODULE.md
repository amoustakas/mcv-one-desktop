# @mcv/agentic-os/swarm

> **Tier 5 — Domain Module (MCV-Only)**
> Multi-agent coordination layer for parallel execution, consensus, and swarm intelligence.

| Field         | Value                                      |
|---------------|--------------------------------------------|
| Package       | `@mcv/agentic-os/swarm`                    |
| Tier          | 5 — Domain                                 |
| Availability  | MCV-Only (not published to npm)            |
| Runtime       | Server + Client                            |
| DB Required   | Yes — Supabase PostgreSQL                  |
| Messaging     | Redpanda / Kafka                           |
| API           | tRPC                                       |
| Since         | 0.9.0                                      |
| Status        | Active Development                         |

---

## Purpose

Swarm is the multi-agent coordination layer within the MCV agentic operating system. Where `queen` provides the high-level orchestrator that decomposes goals into tasks, and `scouts` execute individual tasks as worker agents, **swarm** sits between them — managing groups of agents working in parallel, resolving disagreements through consensus algorithms, sharing memory across agent boundaries, and ensuring fault-tolerant execution even when individual agents fail. Swarm transforms a collection of independent agents into a cohesive, intelligent workforce.

The core problem swarm solves is coordination at scale. A single agent working on a single task is straightforward. But when a venture needs twelve agents researching competitors simultaneously, or five agents debating the best architecture for a new feature, or twenty agents processing a backlog of customer support tickets with shared context about the customer — that's where swarm becomes essential. It provides the primitives for parallel execution with task distribution, consensus mechanisms for resolving conflicting agent outputs, shared memory so agents don't duplicate work, load balancing across available compute capacity, and circuit breakers that prevent cascading failures from taking down an entire swarm.

Swarm is designed with multi-tenancy at its foundation. Every swarm, every agent slot, every message, and every byte of shared memory is scoped to a venture through PostgreSQL Row-Level Security. This means ventures can run arbitrarily complex multi-agent workflows without any risk of data leakage between tenants. The messaging layer (built on Redpanda/Kafka) provides the high-throughput, low-latency communication backbone that enables real-time inter-agent coordination, while Supabase PostgreSQL provides durable state management and the transactional guarantees needed for consensus rounds and resource accounting.

---

## Exports

### Server Services

```typescript
// Core swarm lifecycle
export { SwarmService }            from './server/swarm-service';
export { SwarmOrchestrator }       from './server/swarm-orchestrator';
export { SwarmScheduler }          from './server/swarm-scheduler';

// Agent slot management
export { AgentSlotManager }        from './server/agent-slot-manager';
export { SlotAllocator }           from './server/slot-allocator';
export { AgentHealthMonitor }      from './server/agent-health-monitor';

// Consensus
export { ConsensusEngine }         from './server/consensus-engine';
export { VotingStrategy }          from './server/strategies/voting-strategy';
export { MajorityStrategy }        from './server/strategies/majority-strategy';
export { WeightedConsensusStrategy } from './server/strategies/weighted-consensus-strategy';
export { BordaCountStrategy }      from './server/strategies/borda-count-strategy';
export { UnanimityStrategy }       from './server/strategies/unanimity-strategy';

// Task distribution
export { TaskDistributor }         from './server/task-distributor';
export { TaskQueue }               from './server/task-queue';
export { PriorityScheduler }       from './server/priority-scheduler';

// Resource management
export { ResourceAllocator }       from './server/resource-allocator';
export { TokenBudgetManager }      from './server/token-budget-manager';
export { ComputeLimiter }          from './server/compute-limiter';

// Communication
export { MessageBus }              from './server/message-bus';
export { BlackboardService }       from './server/blackboard-service';
export { PubSubChannelManager }    from './server/pubsub-channel-manager';

// Memory
export { SwarmMemoryService }      from './server/swarm-memory-service';
export { SharedContextManager }    from './server/shared-context-manager';
export { MemorySyncEngine }        from './server/memory-sync-engine';

// Fault tolerance
export { CircuitBreakerRegistry }  from './server/circuit-breaker-registry';
export { RetryManager }            from './server/retry-manager';
export { FailoverController }      from './server/failover-controller';
export { SwarmRecoveryService }    from './server/swarm-recovery-service';

// Load balancing
export { LoadBalancer }            from './server/load-balancer';
export { CapacityTracker }         from './server/capacity-tracker';

// tRPC router
export { swarmRouter }             from './server/trpc/swarm-router';
```

### Client Hooks

```typescript
// Swarm lifecycle
export { useSwarm }                from './client/use-swarm';
export { useSwarmList }            from './client/use-swarm-list';
export { useCreateSwarm }          from './client/use-create-swarm';
export { useSwarmStatus }          from './client/use-swarm-status';
export { useSwarmControls }        from './client/use-swarm-controls';

// Agent slots
export { useAgentSlots }           from './client/use-agent-slots';
export { useSlotHealth }           from './client/use-slot-health';

// Tasks
export { useSwarmTasks }           from './client/use-swarm-tasks';
export { useTaskProgress }         from './client/use-task-progress';
export { useTaskAssignment }       from './client/use-task-assignment';

// Consensus
export { useConsensusRound }       from './client/use-consensus-round';
export { useConsensusHistory }     from './client/use-consensus-history';
export { useVoteSubmission }       from './client/use-vote-submission';

// Communication
export { useSwarmMessages }        from './client/use-swarm-messages';
export { useBlackboard }           from './client/use-blackboard';
export { useSwarmChannel }         from './client/use-swarm-channel';

// Memory
export { useSwarmMemory }          from './client/use-swarm-memory';
export { useSharedContext }        from './client/use-shared-context';

// Resource monitoring
export { useResourceUsage }        from './client/use-resource-usage';
export { useTokenBudget }          from './client/use-token-budget';

// Real-time
export { useSwarmStream }          from './client/use-swarm-stream';
export { useSwarmEvents }          from './client/use-swarm-events';
```

### Types

```typescript
// Core types
export type {
  Swarm,
  SwarmId,
  SwarmConfig,
  SwarmState,
  SwarmStatus,
  SwarmMode,
  SwarmTopology,
  SwarmMetrics,
  SwarmEvent,
  SwarmSnapshot,
} from './types/swarm';

// Agent slots
export type {
  AgentSlot,
  AgentSlotId,
  AgentSlotConfig,
  AgentSlotStatus,
  AgentCapability,
  AgentRole,
  SlotAssignment,
  SlotHealthReport,
} from './types/agent-slot';

// Tasks
export type {
  SwarmTask,
  SwarmTaskId,
  TaskPriority,
  TaskStatus,
  TaskResult,
  TaskDependency,
  TaskDistributionStrategy,
  TaskBatch,
} from './types/task';

// Consensus
export type {
  ConsensusRound,
  ConsensusRoundId,
  ConsensusStrategy,
  ConsensusStrategyType,
  ConsensusVote,
  ConsensusOutcome,
  ConsensusConfig,
  VoteWeight,
  ConsensusDeadline,
} from './types/consensus';

// Communication
export type {
  SwarmMessage,
  SwarmMessageId,
  MessageChannel,
  ChannelTopic,
  BlackboardEntry,
  BlackboardKey,
  PubSubSubscription,
  MessagePriority,
  MessageEnvelope,
} from './types/communication';

// Memory
export type {
  SwarmMemoryEntry,
  SwarmMemoryId,
  MemoryScope,
  MemoryTag,
  SharedContext,
  ContextMergeStrategy,
  MemoryQuery,
  MemorySearchResult,
} from './types/memory';

// Resources
export type {
  ResourceBudget,
  TokenBudget,
  ComputeLimit,
  ResourceUsage,
  ResourceAlert,
  PriorityQueueConfig,
  AllocationPolicy,
} from './types/resources';

// Fault tolerance
export type {
  CircuitBreakerState,
  CircuitBreakerConfig,
  RetryPolicy,
  FailoverConfig,
  RecoveryPlan,
  HealthCheck,
  HealthStatus,
} from './types/fault-tolerance';

// Load balancing
export type {
  LoadBalancerConfig,
  BalancingStrategy,
  AgentCapacity,
  LoadMetrics,
  RoutingDecision,
} from './types/load-balancing';
```

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                              SWARM MODULE                                       │
│                                                                                 │
│  ┌─────────────────────────────────────────────────────────────────────────┐    │
│  │                        SwarmOrchestrator                                │    │
│  │   Lifecycle management • Topology control • State machine               │    │
│  └───────────┬──────────────────┬───────────────────┬──────────────────────┘    │
│              │                  │                   │                            │
│   ┌──────────▼────────┐ ┌──────▼──────────┐ ┌──────▼──────────┐                │
│   │  TaskDistributor   │ │ ConsensusEngine │ │ ResourceAllocator│               │
│   │                    │ │                 │ │                  │                │
│   │ • Priority queues  │ │ • Voting rounds │ │ • Token budgets  │               │
│   │ • Batch splitting  │ │ • Strategies    │ │ • Compute limits │               │
│   │ • Dependency DAG   │ │ • Deadlines     │ │ • Priority queues│               │
│   │ • Work stealing    │ │ • Quorum check  │ │ • Rate limiting  │               │
│   └──────────┬─────────┘ └──────┬──────────┘ └──────┬──────────┘               │
│              │                  │                    │                           │
│   ┌──────────▼──────────────────▼────────────────────▼──────────┐               │
│   │                       MessageBus                             │              │
│   │          (Redpanda/Kafka — Inter-agent communication)        │              │
│   │                                                              │              │
│   │   ┌──────────────┐  ┌─────────────┐  ┌───────────────┐     │              │
│   │   │  Pub/Sub      │  │ Blackboard  │  │ Direct Msgs   │     │              │
│   │   │  Channels     │  │ Pattern     │  │ Point-to-Point│     │              │
│   │   └──────────────┘  └─────────────┘  └───────────────┘     │              │
│   └──────────┬───────────────────────────────────────────────────┘              │
│              │                                                                  │
│   ┌──────────▼──────────────────────────────────────────────────┐               │
│   │                     Agent Slot Pool                          │              │
│   │                                                              │              │
│   │   ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐      │              │
│   │   │ Scout A  │  │ Scout B  │  │ Scout C  │  │ Scout D  │     │              │
│   │   │ (worker) │  │ (worker) │  │ (worker) │  │ (worker) │     │              │
│   │   │          │  │          │  │          │  │          │      │              │
│   │   │ Health:✓ │  │ Health:✓ │  │ Health:✗ │  │ Health:✓ │     │              │
│   │   └─────────┘  └─────────┘  └─────────┘  └─────────┘      │              │
│   │        │              │            │             │            │              │
│   │   ┌────▼──────────────▼────────────▼─────────────▼────┐     │              │
│   │   │          LoadBalancer + HealthMonitor               │    │              │
│   │   │   Round-robin • Least-loaded • Capability-based    │    │              │
│   │   └────────────────────────────────────────────────────┘    │              │
│   └──────────────────────────────────────────────────────────────┘              │
│                                                                                 │
│   ┌─────────────────────────────────┐  ┌────────────────────────────────┐       │
│   │       SwarmMemoryService        │  │   CircuitBreakerRegistry       │       │
│   │                                 │  │                                │       │
│   │ • Shared context store          │  │ • Per-agent circuit breakers   │       │
│   │ • Vector similarity search      │  │ • Retry policies              │       │
│   │ • Conflict resolution           │  │ • Failover controller         │       │
│   │ • Memory sync across agents     │  │ • Recovery orchestration      │       │
│   │ • Garbage collection            │  │ • Dead letter queue           │       │
│   └─────────────┬───────────────────┘  └──────────────┬─────────────────┘       │
│                 │                                      │                         │
│   ┌─────────────▼──────────────────────────────────────▼─────────────────┐      │
│   │                     Supabase PostgreSQL (RLS)                         │     │
│   │                                                                      │      │
│   │  swarms │ swarm_agents │ swarm_tasks │ swarm_messages │              │      │
│   │  swarm_memory │ consensus_rounds │ consensus_votes │                 │      │
│   │  resource_budgets │ circuit_breaker_state │ swarm_events             │      │
│   └──────────────────────────────────────────────────────────────────────┘      │
│                                                                                 │
│   ┌──────────────────────────────────────────────────────────────────────┐      │
│   │                         Queen (upstream)                              │     │
│   │         Goal decomposition → Swarm creation → Task assignment         │     │
│   └──────────────────────────────────────────────────────────────────────┘      │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### Data Flow

```
Queen decomposes goal
       │
       ▼
SwarmOrchestrator.createSwarm(config)
       │
       ├──► AgentSlotManager.allocateSlots(count, capabilities)
       │         │
       │         ▼
       │    LoadBalancer selects agents from available pool
       │         │
       │         ▼
       │    AgentHealthMonitor starts heartbeat checks
       │
       ├──► TaskDistributor.distribute(tasks, slots)
       │         │
       │         ▼
       │    PriorityScheduler orders by priority + dependencies
       │         │
       │         ▼
       │    Tasks published to Redpanda topic per swarm
       │
       ├──► ResourceAllocator.setBudget(swarmId, budget)
       │         │
       │         ▼
       │    TokenBudgetManager tracks per-agent and per-swarm usage
       │
       └──► MessageBus.createChannels(swarmId, topology)
                 │
                 ▼
            Pub/Sub channels + Blackboard initialized
                 │
                 ▼
            Agents consume tasks, communicate, produce results
                 │
                 ▼
            ConsensusEngine.resolve() when disagreements arise
                 │
                 ▼
            SwarmOrchestrator.complete() → Results to Queen
```

### Swarm Topologies

```
Star (default)              Mesh                        Ring
┌───────────┐          ┌───────────┐             ┌───────────┐
│           │          │     A     │             │     A     │
│  Queen ◄──┼──► A     │   ╱   ╲   │             │   ↙   ↘   │
│     ▲     │          │  B ──── C │             │  E       B │
│     │     │          │  │ ╲  ╱ │ │             │  ↑       ↓ │
│     ▼     │          │  D ──── E │             │  D ←── C  │
│     B     │          │           │             │           │
│     ▲     │          └───────────┘             └───────────┘
│     │     │
│     ▼     │       Hierarchical                Pipeline
│     C     │       ┌───────────┐          ┌───────────────┐
│           │       │  Leader    │          │ A → B → C → D │
└───────────┘       │   ╱  ╲    │          │   (stages)    │
                    │  Sub   Sub │          └───────────────┘
                    │  ╱╲    ╱╲  │
                    │ W  W  W  W │
                    └───────────┘
```

---

## Core Interfaces

### SwarmService

The primary entry point for all swarm operations. Provides the full lifecycle API for creating, managing, and tearing down swarms.

```typescript
interface SwarmService {
  // Lifecycle
  create(config: SwarmConfig): Promise<Swarm>;
  get(swarmId: SwarmId): Promise<Swarm | null>;
  list(filters?: SwarmListFilters): Promise<PaginatedResult<Swarm>>;
  update(swarmId: SwarmId, patch: Partial<SwarmConfig>): Promise<Swarm>;
  delete(swarmId: SwarmId): Promise<void>;

  // State management
  start(swarmId: SwarmId): Promise<SwarmState>;
  pause(swarmId: SwarmId): Promise<SwarmState>;
  resume(swarmId: SwarmId): Promise<SwarmState>;
  stop(swarmId: SwarmId, reason?: string): Promise<SwarmState>;
  getState(swarmId: SwarmId): Promise<SwarmState>;

  // Agent management
  addAgent(swarmId: SwarmId, config: AgentSlotConfig): Promise<AgentSlot>;
  removeAgent(swarmId: SwarmId, slotId: AgentSlotId): Promise<void>;
  listAgents(swarmId: SwarmId): Promise<AgentSlot[]>;
  replaceAgent(swarmId: SwarmId, slotId: AgentSlotId, newConfig: AgentSlotConfig): Promise<AgentSlot>;

  // Task management
  submitTask(swarmId: SwarmId, task: SwarmTaskInput): Promise<SwarmTask>;
  submitBatch(swarmId: SwarmId, tasks: SwarmTaskInput[]): Promise<SwarmTask[]>;
  getTask(taskId: SwarmTaskId): Promise<SwarmTask | null>;
  cancelTask(taskId: SwarmTaskId): Promise<void>;
  retryTask(taskId: SwarmTaskId): Promise<SwarmTask>;

  // Consensus
  initiateConsensus(swarmId: SwarmId, config: ConsensusConfig): Promise<ConsensusRound>;
  submitVote(roundId: ConsensusRoundId, vote: ConsensusVote): Promise<void>;
  resolveConsensus(roundId: ConsensusRoundId): Promise<ConsensusOutcome>;

  // Metrics
  getMetrics(swarmId: SwarmId): Promise<SwarmMetrics>;
  getResourceUsage(swarmId: SwarmId): Promise<ResourceUsage>;

  // Events
  subscribe(swarmId: SwarmId, handler: SwarmEventHandler): Unsubscribe;
  getEvents(swarmId: SwarmId, filters?: EventFilters): Promise<SwarmEvent[]>;
}
```

### SwarmConfig

```typescript
interface SwarmConfig {
  /** Unique name for this swarm within the venture */
  name: string;

  /** Human-readable description of the swarm's purpose */
  description?: string;

  /** Venture that owns this swarm (injected via RLS context) */
  ventureId: VentureId;

  /** The queen/orchestrator session that spawned this swarm */
  parentSessionId?: SessionId;

  /** Execution mode */
  mode: SwarmMode;

  /** Communication topology between agents */
  topology: SwarmTopology;

  /** Minimum number of agents required to start */
  minAgents: number;

  /** Maximum number of agents allowed */
  maxAgents: number;

  /** Agent slot configurations (pre-defined roster) */
  slots?: AgentSlotConfig[];

  /** Consensus configuration for the swarm */
  consensus?: ConsensusConfig;

  /** Resource budget for the entire swarm */
  budget: ResourceBudget;

  /** Fault tolerance settings */
  faultTolerance: FaultToleranceConfig;

  /** Load balancing strategy */
  loadBalancing: LoadBalancerConfig;

  /** Shared memory configuration */
  memory?: SwarmMemoryConfig;

  /** Maximum wall-clock time for the swarm to complete */
  timeoutMs?: number;

  /** Tags for filtering and organization */
  tags?: string[];

  /** Arbitrary metadata */
  metadata?: Record<string, unknown>;
}

type SwarmMode =
  | 'parallel'        // All agents work on independent tasks simultaneously
  | 'pipeline'        // Tasks flow through agents in sequence (stages)
  | 'debate'          // Agents argue positions, consensus resolves
  | 'ensemble'        // All agents solve same problem, best answer wins
  | 'hierarchical'    // Leader agent delegates to sub-agents
  | 'collaborative';  // Agents freely cooperate on shared goals

type SwarmTopology =
  | 'star'            // Central coordinator (Queen) connects to all
  | 'mesh'            // Every agent can communicate with every other
  | 'ring'            // Each agent connects to next in circle
  | 'hierarchical'    // Tree structure with leader nodes
  | 'pipeline'        // Linear chain for sequential processing
  | 'custom';         // User-defined adjacency matrix
```

### SwarmState

```typescript
interface SwarmState {
  /** Current lifecycle status */
  status: SwarmStatus;

  /** When the swarm entered this status */
  statusChangedAt: Date;

  /** Number of active agent slots */
  activeAgents: number;

  /** Number of tasks in various states */
  taskCounts: {
    pending: number;
    assigned: number;
    running: number;
    completed: number;
    failed: number;
    cancelled: number;
  };

  /** Active consensus rounds */
  activeConsensusRounds: number;

  /** Resource usage snapshot */
  resourceUsage: ResourceUsage;

  /** Per-agent health summary */
  agentHealth: Record<AgentSlotId, HealthStatus>;

  /** Circuit breaker states */
  circuitBreakers: Record<AgentSlotId, CircuitBreakerState>;

  /** Error log (last N errors) */
  recentErrors: SwarmError[];

  /** Overall progress (0-1) */
  progress: number;

  /** Estimated time remaining in ms */
  estimatedTimeRemainingMs?: number;

  /** Snapshot timestamp */
  snapshotAt: Date;
}

type SwarmStatus =
  | 'created'          // Config saved, not yet started
  | 'provisioning'     // Allocating agent slots
  | 'ready'            // All slots allocated, awaiting start
  | 'running'          // Actively processing tasks
  | 'paused'           // Temporarily halted
  | 'draining'         // Completing in-flight tasks, no new assignments
  | 'completing'       // All tasks done, running consensus/aggregation
  | 'completed'        // Successfully finished
  | 'failed'           // Unrecoverable error
  | 'cancelled'        // Manually cancelled
  | 'timeout';         // Exceeded time limit
```

### AgentSlot

```typescript
interface AgentSlot {
  id: AgentSlotId;
  swarmId: SwarmId;
  ventureId: VentureId;

  /** The scout/agent instance assigned to this slot */
  agentId?: AgentId;

  /** Human-readable label (e.g., "Researcher-1", "Critic-A") */
  label: string;

  /** Role this agent plays in the swarm */
  role: AgentRole;

  /** Capabilities this slot requires/provides */
  capabilities: AgentCapability[];

  /** Model configuration for this slot */
  model: {
    provider: string;
    model: string;
    temperature?: number;
    maxTokens?: number;
  };

  /** System prompt override for this agent */
  systemPrompt?: string;

  /** Current status of this slot */
  status: AgentSlotStatus;

  /** Tasks currently assigned */
  assignedTasks: SwarmTaskId[];

  /** Resource usage for this specific slot */
  usage: {
    tokensUsed: number;
    tokensRemaining: number;
    tasksCompleted: number;
    tasksFailed: number;
    avgLatencyMs: number;
  };

  /** Health check state */
  health: {
    status: HealthStatus;
    lastHeartbeat: Date;
    consecutiveFailures: number;
    uptimeMs: number;
  };

  /** Weight for consensus voting (0-1) */
  consensusWeight: number;

  /** Priority level for task assignment */
  priority: number;

  createdAt: Date;
  updatedAt: Date;
}

type AgentSlotStatus =
  | 'pending'       // Slot created, no agent assigned
  | 'provisioning'  // Agent being initialized
  | 'idle'          // Agent ready, no current task
  | 'busy'          // Agent working on task(s)
  | 'draining'      // Finishing current tasks, no new assignments
  | 'unhealthy'     // Failed health checks
  | 'terminated';   // Slot decommissioned

type AgentRole =
  | 'worker'        // General-purpose task executor
  | 'researcher'    // Specialized for information gathering
  | 'critic'        // Reviews and critiques others' work
  | 'synthesizer'   // Combines outputs from multiple agents
  | 'validator'     // Verifies correctness of outputs
  | 'leader'        // Coordinates sub-group in hierarchical mode
  | 'specialist'    // Domain-specific expert
  | 'monitor';      // Observes and reports on swarm health

type AgentCapability =
  | 'web-search'
  | 'code-execution'
  | 'file-analysis'
  | 'data-extraction'
  | 'summarization'
  | 'translation'
  | 'image-analysis'
  | 'reasoning'
  | 'math'
  | 'creative-writing'
  | string; // extensible
```

### ConsensusStrategy

```typescript
interface ConsensusConfig {
  /** Which strategy to use for resolving disagreements */
  strategy: ConsensusStrategyType;

  /** Minimum number of votes required for quorum */
  quorum: number;

  /** How long to wait for votes before deadline */
  deadlineMs: number;

  /** What happens if quorum is not met */
  quorumFailurePolicy: 'extend' | 'fail' | 'proceed-with-available';

  /** Maximum number of rounds before escalation */
  maxRounds: number;

  /** Whether agents can see others' votes before submitting */
  blindVoting: boolean;

  /** Custom weights per agent slot (for weighted strategies) */
  weights?: Record<AgentSlotId, number>;

  /** Tie-breaking strategy */
  tieBreaker: 'random' | 'leader-decides' | 'highest-confidence' | 'escalate';

  /** Minimum confidence threshold for a vote to count */
  minConfidence?: number;
}

type ConsensusStrategyType =
  | 'majority'              // Simple majority (>50%) wins
  | 'supermajority'         // Two-thirds majority required
  | 'unanimity'             // All must agree
  | 'weighted-majority'     // Votes weighted by agent expertise/confidence
  | 'borda-count'           // Ranked-choice voting
  | 'approval'              // Agents approve/reject each option
  | 'delphi'                // Iterative rounds with feedback
  | 'best-of-n'             // Highest confidence/quality score wins
  | 'leader-decides';       // Designated leader makes final call

interface ConsensusRound {
  id: ConsensusRoundId;
  swarmId: SwarmId;
  ventureId: VentureId;

  /** The question or decision being resolved */
  prompt: string;

  /** Structured options (if applicable) */
  options?: ConsensusOption[];

  /** Strategy being used */
  strategy: ConsensusStrategyType;

  /** Current round number (for multi-round strategies like Delphi) */
  roundNumber: number;

  /** Votes received so far */
  votes: ConsensusVote[];

  /** Whether quorum has been reached */
  quorumReached: boolean;

  /** Deadline for this round */
  deadline: Date;

  /** Current status */
  status: 'open' | 'closed' | 'resolved' | 'failed' | 'escalated';

  /** Final outcome (once resolved) */
  outcome?: ConsensusOutcome;

  createdAt: Date;
  resolvedAt?: Date;
}

interface ConsensusVote {
  agentSlotId: AgentSlotId;
  roundId: ConsensusRoundId;

  /** The agent's choice (option ID, free-text, or ranking) */
  choice: string | string[]; // single choice or ranked list

  /** Agent's confidence in their choice (0-1) */
  confidence: number;

  /** Reasoning behind the vote */
  reasoning: string;

  /** Evidence or supporting data */
  evidence?: Record<string, unknown>;

  /** Timestamp of vote submission */
  submittedAt: Date;
}

interface ConsensusOutcome {
  /** Winning choice */
  winner: string;

  /** Final vote tally */
  tally: Record<string, number>;

  /** Confidence-weighted tally */
  weightedTally: Record<string, number>;

  /** Agreement level (0-1, where 1 = unanimous) */
  agreementLevel: number;

  /** Dissenting votes with reasoning */
  dissents: Array<{
    agentSlotId: AgentSlotId;
    choice: string;
    reasoning: string;
  }>;

  /** How the outcome was determined */
  method: ConsensusStrategyType;

  /** Number of rounds taken */
  roundsTaken: number;
}
```

### ResourceBudget

```typescript
interface ResourceBudget {
  /** Total token budget for the entire swarm */
  totalTokens: number;

  /** Per-agent token limit */
  perAgentTokens?: number;

  /** Per-task token limit */
  perTaskTokens?: number;

  /** Maximum concurrent API calls */
  maxConcurrentCalls: number;

  /** Maximum wall-clock time in milliseconds */
  maxDurationMs: number;

  /** Maximum number of tasks */
  maxTasks?: number;

  /** Cost ceiling in cents */
  maxCostCents?: number;

  /** How to handle budget exhaustion */
  exhaustionPolicy: 'stop' | 'degrade' | 'alert-and-continue' | 'request-increase';

  /** Alert thresholds (percentage of budget) */
  alertThresholds: number[]; // e.g., [0.5, 0.75, 0.9]

  /** Priority tier for resource allocation */
  priority: 'low' | 'normal' | 'high' | 'critical';
}

interface ResourceUsage {
  swarmId: SwarmId;

  tokens: {
    used: number;
    remaining: number;
    limit: number;
    percentUsed: number;
  };

  compute: {
    activeSlots: number;
    maxSlots: number;
    totalApiCalls: number;
    avgLatencyMs: number;
    p95LatencyMs: number;
    p99LatencyMs: number;
  };

  cost: {
    totalCents: number;
    ceilingCents?: number;
    byModel: Record<string, number>;
    byAgent: Record<AgentSlotId, number>;
  };

  duration: {
    elapsedMs: number;
    remainingMs?: number;
    limitMs: number;
  };

  alerts: ResourceAlert[];
  snapshotAt: Date;
}
```

### FaultToleranceConfig

```typescript
interface FaultToleranceConfig {
  /** Circuit breaker settings per agent */
  circuitBreaker: CircuitBreakerConfig;

  /** Retry policy for failed tasks */
  retryPolicy: RetryPolicy;

  /** Failover behavior when agents die */
  failover: FailoverConfig;

  /** Maximum percentage of agents that can fail before swarm fails */
  maxFailureRate: number;

  /** Whether to automatically replace failed agents */
  autoReplace: boolean;

  /** Dead letter queue for unprocessable tasks */
  deadLetterQueue: boolean;

  /** Checkpoint interval for recovery */
  checkpointIntervalMs: number;
}

interface CircuitBreakerConfig {
  /** Number of failures before opening circuit */
  failureThreshold: number;

  /** Time window for counting failures (ms) */
  failureWindowMs: number;

  /** How long circuit stays open before half-open test (ms) */
  resetTimeoutMs: number;

  /** Number of successful half-open requests to close circuit */
  halfOpenSuccesses: number;

  /** Types of errors that count as failures */
  countableErrors: string[];
}

interface RetryPolicy {
  /** Maximum number of retries */
  maxRetries: number;

  /** Base delay between retries (ms) */
  baseDelayMs: number;

  /** Maximum delay between retries (ms) */
  maxDelayMs: number;

  /** Backoff strategy */
  backoff: 'constant' | 'linear' | 'exponential' | 'jitter';

  /** Whether to retry on a different agent */
  retryOnDifferentAgent: boolean;

  /** Error types that are retryable */
  retryableErrors: string[];

  /** Error types that should NOT be retried */
  nonRetryableErrors: string[];
}

interface FailoverConfig {
  /** Strategy for handling agent failure */
  strategy: 'reassign' | 'respawn' | 'degrade' | 'abort';

  /** Maximum time to wait for failover (ms) */
  timeoutMs: number;

  /** Whether to preserve partial results from failed agent */
  preservePartialResults: boolean;

  /** Cooldown before failed agent type can be re-provisioned (ms) */
  cooldownMs: number;
}
```

### Communication Types

```typescript
interface MessageEnvelope {
  id: SwarmMessageId;
  swarmId: SwarmId;
  ventureId: VentureId;

  /** Sender agent slot */
  from: AgentSlotId;

  /** Recipient(s) — null for broadcast */
  to: AgentSlotId | AgentSlotId[] | null;

  /** Channel this message was sent on */
  channel: string;

  /** Message type for routing */
  type: SwarmMessageType;

  /** Message priority */
  priority: MessagePriority;

  /** Structured payload */
  payload: Record<string, unknown>;

  /** Human-readable content */
  content?: string;

  /** References to other messages (threading) */
  replyTo?: SwarmMessageId;

  /** Time-to-live (ms) — message expires after this */
  ttlMs?: number;

  /** Whether this message requires acknowledgment */
  requiresAck: boolean;

  createdAt: Date;
  expiresAt?: Date;
  acknowledgedBy?: AgentSlotId[];
}

type SwarmMessageType =
  | 'task-assignment'
  | 'task-result'
  | 'task-update'
  | 'consensus-request'
  | 'consensus-vote'
  | 'memory-update'
  | 'memory-query'
  | 'health-ping'
  | 'health-pong'
  | 'resource-alert'
  | 'coordination'
  | 'broadcast'
  | 'direct'
  | 'blackboard-write'
  | 'blackboard-read'
  | 'error'
  | 'system';

type MessagePriority = 'low' | 'normal' | 'high' | 'urgent';

interface BlackboardEntry {
  key: BlackboardKey;
  swarmId: SwarmId;
  ventureId: VentureId;

  /** The structured data stored at this key */
  value: Record<string, unknown>;

  /** Who last wrote this entry */
  lastWrittenBy: AgentSlotId;

  /** Version number for optimistic concurrency */
  version: number;

  /** Tags for querying */
  tags: string[];

  /** Lock state for exclusive access */
  lock?: {
    heldBy: AgentSlotId;
    acquiredAt: Date;
    expiresAt: Date;
  };

  createdAt: Date;
  updatedAt: Date;
}
```

### SwarmMemory Types

```typescript
interface SwarmMemoryEntry {
  id: SwarmMemoryId;
  swarmId: SwarmId;
  ventureId: VentureId;

  /** The scope of this memory — who can access it */
  scope: MemoryScope;

  /** The agent that created this memory */
  authorAgentId: AgentSlotId;

  /** Key for direct lookup */
  key: string;

  /** The memory content */
  content: string;

  /** Structured data associated with this memory */
  data?: Record<string, unknown>;

  /** Embedding vector for similarity search */
  embedding?: number[];

  /** Tags for filtering */
  tags: MemoryTag[];

  /** Importance score (0-1), used for garbage collection */
  importance: number;

  /** How many times this memory has been accessed */
  accessCount: number;

  /** Last time an agent read this memory */
  lastAccessedAt: Date;

  /** Whether this memory is pinned (immune to GC) */
  pinned: boolean;

  /** Expiry time — memory auto-deleted after this */
  expiresAt?: Date;

  createdAt: Date;
  updatedAt: Date;
}

type MemoryScope =
  | 'swarm'           // Visible to all agents in the swarm
  | 'role'            // Visible to agents with the same role
  | 'agent'           // Private to the creating agent
  | 'persistent';     // Survives swarm completion, available to future swarms

interface SwarmMemoryConfig {
  /** Maximum total memory entries per swarm */
  maxEntries: number;

  /** Maximum memory size in bytes */
  maxSizeBytes: number;

  /** Enable vector embeddings for similarity search */
  enableEmbeddings: boolean;

  /** Embedding model to use */
  embeddingModel?: string;

  /** Garbage collection strategy */
  gcStrategy: 'lru' | 'lfu' | 'importance' | 'ttl' | 'none';

  /** GC interval in milliseconds */
  gcIntervalMs: number;

  /** Conflict resolution when two agents write same key */
  conflictResolution: ContextMergeStrategy;

  /** Whether to sync memory in real-time or batch */
  syncMode: 'realtime' | 'batch';

  /** Batch sync interval (if batch mode) */
  syncIntervalMs?: number;
}

type ContextMergeStrategy =
  | 'last-write-wins'      // Most recent write overwrites
  | 'first-write-wins'     // Original value preserved
  | 'merge-append'         // Both values kept (array append)
  | 'merge-deep'           // Deep merge of objects
  | 'consensus'            // Trigger consensus round to resolve
  | 'highest-importance';  // Write with higher importance wins
```

---

## Database Schemas

All tables use Supabase PostgreSQL with Row-Level Security (RLS) policies scoped to `venture_id`. UUIDs are used for all primary keys. Timestamps use `timestamptz`.

### swarms

The primary table storing swarm configuration and state.

```typescript
import { pgTable, uuid, text, timestamp, jsonb, integer, real, pgEnum } from 'drizzle-orm/pg-core';

export const swarmStatusEnum = pgEnum('swarm_status', [
  'created',
  'provisioning',
  'ready',
  'running',
  'paused',
  'draining',
  'completing',
  'completed',
  'failed',
  'cancelled',
  'timeout',
]);

export const swarmModeEnum = pgEnum('swarm_mode', [
  'parallel',
  'pipeline',
  'debate',
  'ensemble',
  'hierarchical',
  'collaborative',
]);

export const swarmTopologyEnum = pgEnum('swarm_topology', [
  'star',
  'mesh',
  'ring',
  'hierarchical',
  'pipeline',
  'custom',
]);

export const swarms = pgTable('swarms', {
  id:               uuid('id').primaryKey().defaultRandom(),
  ventureId:        uuid('venture_id').notNull().references(() => ventures.id, { onDelete: 'cascade' }),
  parentSessionId:  uuid('parent_session_id').references(() => sessions.id, { onDelete: 'set null' }),

  name:             text('name').notNull(),
  description:      text('description'),

  mode:             swarmModeEnum('mode').notNull().default('parallel'),
  topology:         swarmTopologyEnum('topology').notNull().default('star'),
  status:           swarmStatusEnum('status').notNull().default('created'),

  minAgents:        integer('min_agents').notNull().default(1),
  maxAgents:        integer('max_agents').notNull().default(10),

  config:           jsonb('config').notNull().$type<SwarmConfig>(),
  budget:           jsonb('budget').notNull().$type<ResourceBudget>(),
  faultTolerance:   jsonb('fault_tolerance').notNull().$type<FaultToleranceConfig>(),
  memoryConfig:     jsonb('memory_config').$type<SwarmMemoryConfig>(),
  consensusConfig:  jsonb('consensus_config').$type<ConsensusConfig>(),
  loadBalancing:    jsonb('load_balancing').notNull().$type<LoadBalancerConfig>(),

  progress:         real('progress').notNull().default(0),
  timeoutMs:        integer('timeout_ms'),
  tags:             jsonb('tags').$type<string[]>().default([]),
  metadata:         jsonb('metadata').$type<Record<string, unknown>>().default({}),

  startedAt:        timestamp('started_at', { withTimezone: true }),
  completedAt:      timestamp('completed_at', { withTimezone: true }),
  failedAt:         timestamp('failed_at', { withTimezone: true }),
  failureReason:    text('failure_reason'),

  createdAt:        timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt:        timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  ventureIdx:       index('swarms_venture_id_idx').on(table.ventureId),
  statusIdx:        index('swarms_status_idx').on(table.status),
  parentSessionIdx: index('swarms_parent_session_idx').on(table.parentSessionId),
  nameVentureIdx:   uniqueIndex('swarms_name_venture_idx').on(table.ventureId, table.name),
}));
```

### swarm_agents

Tracks each agent slot within a swarm, including its configuration, health, and resource usage.

```typescript
export const agentSlotStatusEnum = pgEnum('agent_slot_status', [
  'pending',
  'provisioning',
  'idle',
  'busy',
  'draining',
  'unhealthy',
  'terminated',
]);

export const agentRoleEnum = pgEnum('agent_role', [
  'worker',
  'researcher',
  'critic',
  'synthesizer',
  'validator',
  'leader',
  'specialist',
  'monitor',
]);

export const swarmAgents = pgTable('swarm_agents', {
  id:               uuid('id').primaryKey().defaultRandom(),
  swarmId:          uuid('swarm_id').notNull().references(() => swarms.id, { onDelete: 'cascade' }),
  ventureId:        uuid('venture_id').notNull().references(() => ventures.id, { onDelete: 'cascade' }),
  agentId:          uuid('agent_id').references(() => agents.id, { onDelete: 'set null' }),

  label:            text('label').notNull(),
  role:             agentRoleEnum('role').notNull().default('worker'),
  capabilities:     jsonb('capabilities').$type<AgentCapability[]>().default([]),

  modelProvider:    text('model_provider').notNull(),
  modelName:        text('model_name').notNull(),
  modelConfig:      jsonb('model_config').$type<Record<string, unknown>>().default({}),
  systemPrompt:     text('system_prompt'),

  status:           agentSlotStatusEnum('status').notNull().default('pending'),
  consensusWeight:  real('consensus_weight').notNull().default(1.0),
  priority:         integer('priority').notNull().default(0),

  // Resource tracking
  tokensUsed:       integer('tokens_used').notNull().default(0),
  tokensLimit:      integer('tokens_limit'),
  tasksCompleted:   integer('tasks_completed').notNull().default(0),
  tasksFailed:      integer('tasks_failed').notNull().default(0),
  avgLatencyMs:     real('avg_latency_ms').notNull().default(0),

  // Health
  healthStatus:     text('health_status').notNull().default('unknown'),
  lastHeartbeat:    timestamp('last_heartbeat', { withTimezone: true }),
  consecutiveFailures: integer('consecutive_failures').notNull().default(0),

  // Circuit breaker
  circuitState:     text('circuit_state').notNull().default('closed'),
  circuitOpenedAt:  timestamp('circuit_opened_at', { withTimezone: true }),
  circuitFailCount: integer('circuit_fail_count').notNull().default(0),

  metadata:         jsonb('metadata').$type<Record<string, unknown>>().default({}),

  provisionedAt:    timestamp('provisioned_at', { withTimezone: true }),
  terminatedAt:     timestamp('terminated_at', { withTimezone: true }),
  createdAt:        timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt:        timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  swarmIdx:         index('swarm_agents_swarm_id_idx').on(table.swarmId),
  ventureIdx:       index('swarm_agents_venture_id_idx').on(table.ventureId),
  statusIdx:        index('swarm_agents_status_idx').on(table.status),
  agentIdx:         index('swarm_agents_agent_id_idx').on(table.agentId),
  labelSwarmIdx:    uniqueIndex('swarm_agents_label_swarm_idx').on(table.swarmId, table.label),
}));
```

### swarm_tasks

Tasks distributed across the swarm, with priority, dependencies, and result tracking.

```typescript
export const taskStatusEnum = pgEnum('swarm_task_status', [
  'pending',
  'assigned',
  'running',
  'completed',
  'failed',
  'cancelled',
  'retrying',
  'dead-letter',
]);

export const taskPriorityEnum = pgEnum('task_priority', [
  'low',
  'normal',
  'high',
  'critical',
]);

export const swarmTasks = pgTable('swarm_tasks', {
  id:               uuid('id').primaryKey().defaultRandom(),
  swarmId:          uuid('swarm_id').notNull().references(() => swarms.id, { onDelete: 'cascade' }),
  ventureId:        uuid('venture_id').notNull().references(() => ventures.id, { onDelete: 'cascade' }),

  /** The agent slot this task is assigned to */
  assignedTo:       uuid('assigned_to').references(() => swarmAgents.id, { onDelete: 'set null' }),

  /** Task type for routing */
  type:             text('type').notNull(),

  /** Human-readable description */
  description:      text('description').notNull(),

  /** Structured input data for the task */
  input:            jsonb('input').notNull().$type<Record<string, unknown>>(),

  /** Task output/result (populated on completion) */
  output:           jsonb('output').$type<Record<string, unknown>>(),

  status:           taskStatusEnum('status').notNull().default('pending'),
  priority:         taskPriorityEnum('priority').notNull().default('normal'),

  /** Position in pipeline (for pipeline mode) */
  stageIndex:       integer('stage_index'),

  /** Dependencies — task IDs that must complete before this one */
  dependencies:     jsonb('dependencies').$type<string[]>().default([]),

  /** Batch identifier for grouped tasks */
  batchId:          text('batch_id'),

  /** Number of retries attempted */
  retryCount:       integer('retry_count').notNull().default(0),
  maxRetries:       integer('max_retries').notNull().default(3),

  /** Error information if failed */
  error:            jsonb('error').$type<{ code: string; message: string; stack?: string }>(),

  /** Token usage for this task */
  tokensUsed:       integer('tokens_used').notNull().default(0),

  /** Execution timing */
  assignedAt:       timestamp('assigned_at', { withTimezone: true }),
  startedAt:        timestamp('started_at', { withTimezone: true }),
  completedAt:      timestamp('completed_at', { withTimezone: true }),
  deadlineAt:       timestamp('deadline_at', { withTimezone: true }),

  metadata:         jsonb('metadata').$type<Record<string, unknown>>().default({}),
  createdAt:        timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt:        timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  swarmIdx:         index('swarm_tasks_swarm_id_idx').on(table.swarmId),
  ventureIdx:       index('swarm_tasks_venture_id_idx').on(table.ventureId),
  assignedIdx:      index('swarm_tasks_assigned_to_idx').on(table.assignedTo),
  statusIdx:        index('swarm_tasks_status_idx').on(table.status),
  priorityIdx:      index('swarm_tasks_priority_idx').on(table.priority),
  batchIdx:         index('swarm_tasks_batch_id_idx').on(table.batchId),
  stageIdx:         index('swarm_tasks_stage_idx').on(table.swarmId, table.stageIndex),
  deadlineIdx:      index('swarm_tasks_deadline_idx').on(table.deadlineAt),
}));
```

### swarm_messages

Inter-agent messages routed through the Redpanda/Kafka message bus. This table serves as the durable log; real-time delivery uses Kafka topics.

```typescript
export const messageTypeEnum = pgEnum('swarm_message_type', [
  'task-assignment',
  'task-result',
  'task-update',
  'consensus-request',
  'consensus-vote',
  'memory-update',
  'memory-query',
  'health-ping',
  'health-pong',
  'resource-alert',
  'coordination',
  'broadcast',
  'direct',
  'blackboard-write',
  'blackboard-read',
  'error',
  'system',
]);

export const messagePriorityEnum = pgEnum('message_priority', [
  'low',
  'normal',
  'high',
  'urgent',
]);

export const swarmMessages = pgTable('swarm_messages', {
  id:               uuid('id').primaryKey().defaultRandom(),
  swarmId:          uuid('swarm_id').notNull().references(() => swarms.id, { onDelete: 'cascade' }),
  ventureId:        uuid('venture_id').notNull().references(() => ventures.id, { onDelete: 'cascade' }),

  fromAgentId:      uuid('from_agent_id').notNull().references(() => swarmAgents.id, { onDelete: 'cascade' }),
  toAgentId:        uuid('to_agent_id').references(() => swarmAgents.id, { onDelete: 'cascade' }), // null = broadcast
  toAgentIds:       jsonb('to_agent_ids').$type<string[]>(), // multicast

  channel:          text('channel').notNull().default('default'),
  type:             messageTypeEnum('type').notNull(),
  priority:         messagePriorityEnum('priority').notNull().default('normal'),

  content:          text('content'),
  payload:          jsonb('payload').notNull().$type<Record<string, unknown>>().default({}),

  replyTo:          uuid('reply_to').references(() => swarmMessages.id, { onDelete: 'set null' }),
  requiresAck:      boolean('requires_ack').notNull().default(false),
  acknowledgedBy:   jsonb('acknowledged_by').$type<string[]>().default([]),

  ttlMs:            integer('ttl_ms'),
  expiresAt:        timestamp('expires_at', { withTimezone: true }),

  /** Kafka partition/offset for traceability */
  kafkaPartition:   integer('kafka_partition'),
  kafkaOffset:      text('kafka_offset'),

  createdAt:        timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  swarmIdx:         index('swarm_messages_swarm_id_idx').on(table.swarmId),
  ventureIdx:       index('swarm_messages_venture_id_idx').on(table.ventureId),
  fromIdx:          index('swarm_messages_from_agent_idx').on(table.fromAgentId),
  toIdx:            index('swarm_messages_to_agent_idx').on(table.toAgentId),
  channelIdx:       index('swarm_messages_channel_idx').on(table.swarmId, table.channel),
  typeIdx:          index('swarm_messages_type_idx').on(table.type),
  createdIdx:       index('swarm_messages_created_idx').on(table.createdAt),
  expiresIdx:       index('swarm_messages_expires_idx').on(table.expiresAt),
}));
```

### swarm_memory

Shared knowledge store with vector embeddings for semantic search.

```typescript
export const memoryScopeEnum = pgEnum('memory_scope', [
  'swarm',
  'role',
  'agent',
  'persistent',
]);

export const swarmMemory = pgTable('swarm_memory', {
  id:               uuid('id').primaryKey().defaultRandom(),
  swarmId:          uuid('swarm_id').notNull().references(() => swarms.id, { onDelete: 'cascade' }),
  ventureId:        uuid('venture_id').notNull().references(() => ventures.id, { onDelete: 'cascade' }),
  authorAgentId:    uuid('author_agent_id').notNull().references(() => swarmAgents.id, { onDelete: 'cascade' }),

  scope:            memoryScopeEnum('scope').notNull().default('swarm'),
  key:              text('key').notNull(),
  content:          text('content').notNull(),
  data:             jsonb('data').$type<Record<string, unknown>>(),

  /** pgvector embedding for similarity search */
  embedding:        vector('embedding', { dimensions: 1536 }),

  tags:             jsonb('tags').$type<string[]>().default([]),
  importance:       real('importance').notNull().default(0.5),
  accessCount:      integer('access_count').notNull().default(0),
  lastAccessedAt:   timestamp('last_accessed_at', { withTimezone: true }).notNull().defaultNow(),
  pinned:           boolean('pinned').notNull().default(false),
  expiresAt:        timestamp('expires_at', { withTimezone: true }),

  /** Optimistic concurrency version */
  version:          integer('version').notNull().default(1),

  createdAt:        timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt:        timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  swarmIdx:         index('swarm_memory_swarm_id_idx').on(table.swarmId),
  ventureIdx:       index('swarm_memory_venture_id_idx').on(table.ventureId),
  authorIdx:        index('swarm_memory_author_idx').on(table.authorAgentId),
  scopeIdx:         index('swarm_memory_scope_idx').on(table.scope),
  keySwarmIdx:      uniqueIndex('swarm_memory_key_swarm_idx').on(table.swarmId, table.key),
  tagsIdx:          index('swarm_memory_tags_idx').using('gin', table.tags),
  importanceIdx:    index('swarm_memory_importance_idx').on(table.importance),
  embeddingIdx:     index('swarm_memory_embedding_idx').using('ivfflat', table.embedding).with({ lists: 100 }),
  expiresIdx:       index('swarm_memory_expires_idx').on(table.expiresAt),
}));
```

### consensus_rounds

Tracks consensus voting rounds including votes, outcomes, and multi-round Delphi processes.

```typescript
export const consensusStrategyEnum = pgEnum('consensus_strategy', [
  'majority',
  'supermajority',
  'unanimity',
  'weighted-majority',
  'borda-count',
  'approval',
  'delphi',
  'best-of-n',
  'leader-decides',
]);

export const consensusStatusEnum = pgEnum('consensus_status', [
  'open',
  'closed',
  'resolved',
  'failed',
  'escalated',
]);

export const consensusRounds = pgTable('consensus_rounds', {
  id:               uuid('id').primaryKey().defaultRandom(),
  swarmId:          uuid('swarm_id').notNull().references(() => swarms.id, { onDelete: 'cascade' }),
  ventureId:        uuid('venture_id').notNull().references(() => ventures.id, { onDelete: 'cascade' }),

  /** The question being decided */
  prompt:           text('prompt').notNull(),

  /** Structured options (if applicable) */
  options:          jsonb('options').$type<ConsensusOption[]>(),

  strategy:         consensusStrategyEnum('strategy').notNull(),
  status:           consensusStatusEnum('status').notNull().default('open'),

  /** For multi-round strategies (Delphi) */
  roundNumber:      integer('round_number').notNull().default(1),
  parentRoundId:    uuid('parent_round_id').references(() => consensusRounds.id, { onDelete: 'set null' }),

  /** Quorum requirements */
  quorum:           integer('quorum').notNull(),
  quorumReached:    boolean('quorum_reached').notNull().default(false),

  /** Voting configuration */
  blindVoting:      boolean('blind_voting').notNull().default(true),
  weights:          jsonb('weights').$type<Record<string, number>>(),
  minConfidence:    real('min_confidence'),
  tieBreaker:       text('tie_breaker').notNull().default('highest-confidence'),

  /** Deadline */
  deadlineAt:       timestamp('deadline_at', { withTimezone: true }).notNull(),

  /** Result (populated on resolution) */
  outcome:          jsonb('outcome').$type<ConsensusOutcome>(),

  maxRounds:        integer('max_rounds').notNull().default(3),

  metadata:         jsonb('metadata').$type<Record<string, unknown>>().default({}),

  resolvedAt:       timestamp('resolved_at', { withTimezone: true }),
  createdAt:        timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt:        timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  swarmIdx:         index('consensus_rounds_swarm_id_idx').on(table.swarmId),
  ventureIdx:       index('consensus_rounds_venture_id_idx').on(table.ventureId),
  statusIdx:        index('consensus_rounds_status_idx').on(table.status),
  parentIdx:        index('consensus_rounds_parent_idx').on(table.parentRoundId),
  deadlineIdx:      index('consensus_rounds_deadline_idx').on(table.deadlineAt),
}));

/** Individual votes within a consensus round */
export const consensusVotes = pgTable('consensus_votes', {
  id:               uuid('id').primaryKey().defaultRandom(),
  roundId:          uuid('round_id').notNull().references(() => consensusRounds.id, { onDelete: 'cascade' }),
  swarmId:          uuid('swarm_id').notNull().references(() => swarms.id, { onDelete: 'cascade' }),
  ventureId:        uuid('venture_id').notNull().references(() => ventures.id, { onDelete: 'cascade' }),
  agentSlotId:      uuid('agent_slot_id').notNull().references(() => swarmAgents.id, { onDelete: 'cascade' }),

  /** The agent's choice (option ID or free-text) */
  choice:           text('choice').notNull(),

  /** Ranked choices for Borda count / ranked strategies */
  rankedChoices:    jsonb('ranked_choices').$type<string[]>(),

  /** Agent's confidence in their choice (0-1) */
  confidence:       real('confidence').notNull(),

  /** Reasoning behind the vote */
  reasoning:        text('reasoning').notNull(),

  /** Evidence supporting the vote */
  evidence:         jsonb('evidence').$type<Record<string, unknown>>(),

  /** Effective weight (consensus_weight * confidence) */
  effectiveWeight:  real('effective_weight').notNull(),

  submittedAt:      timestamp('submitted_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  roundIdx:         index('consensus_votes_round_id_idx').on(table.roundId),
  agentIdx:         index('consensus_votes_agent_idx').on(table.agentSlotId),
  uniqueVoteIdx:    uniqueIndex('consensus_votes_unique_idx').on(table.roundId, table.agentSlotId),
}));
```

### RLS Policies

All tables enforce venture-level isolation:

```sql
-- Example RLS policy (applied to all swarm tables)
ALTER TABLE swarms ENABLE ROW LEVEL SECURITY;

CREATE POLICY swarms_venture_isolation ON swarms
  USING (venture_id = current_setting('app.current_venture_id')::uuid);

CREATE POLICY swarms_venture_insert ON swarms
  FOR INSERT WITH CHECK (venture_id = current_setting('app.current_venture_id')::uuid);

-- Repeated for: swarm_agents, swarm_tasks, swarm_messages, swarm_memory,
--               consensus_rounds, consensus_votes
```

---

## Code Examples

### 1. Create and Start a Swarm

```typescript
import { SwarmService } from '@mcv/agentic-os/swarm';
import { createTRPCContext } from '@mcv/api';

async function createResearchSwarm(ventureId: string) {
  const ctx = await createTRPCContext({ ventureId });
  const swarmService = new SwarmService(ctx);

  // Create a parallel research swarm with 5 researchers and 1 synthesizer
  const swarm = await swarmService.create({
    name: 'competitor-analysis-q1-2026',
    description: 'Analyze top 10 competitors across pricing, features, and market positioning',
    ventureId,
    mode: 'parallel',
    topology: 'star',
    minAgents: 4,
    maxAgents: 6,
    slots: [
      // 5 researchers for parallel data gathering
      ...Array.from({ length: 5 }, (_, i) => ({
        label: `Researcher-${i + 1}`,
        role: 'researcher' as const,
        capabilities: ['web-search', 'data-extraction', 'summarization'],
        model: {
          provider: 'anthropic',
          model: 'claude-sonnet-4-20250514',
          temperature: 0.3,
          maxTokens: 4096,
        },
      })),
      // 1 synthesizer to combine findings
      {
        label: 'Synthesizer',
        role: 'synthesizer' as const,
        capabilities: ['summarization', 'reasoning'],
        model: {
          provider: 'anthropic',
          model: 'claude-opus-4-20250514',
          temperature: 0.2,
          maxTokens: 8192,
        },
        systemPrompt: 'You synthesize research findings into comprehensive analysis reports.',
      },
    ],
    budget: {
      totalTokens: 500_000,
      perAgentTokens: 100_000,
      perTaskTokens: 20_000,
      maxConcurrentCalls: 5,
      maxDurationMs: 30 * 60 * 1000, // 30 minutes
      maxCostCents: 1500, // $15
      exhaustionPolicy: 'degrade',
      alertThresholds: [0.5, 0.75, 0.9],
      priority: 'normal',
    },
    faultTolerance: {
      circuitBreaker: {
        failureThreshold: 3,
        failureWindowMs: 60_000,
        resetTimeoutMs: 30_000,
        halfOpenSuccesses: 2,
        countableErrors: ['AGENT_TIMEOUT', 'AGENT_ERROR', 'API_ERROR'],
      },
      retryPolicy: {
        maxRetries: 3,
        baseDelayMs: 1000,
        maxDelayMs: 30_000,
        backoff: 'exponential',
        retryOnDifferentAgent: true,
        retryableErrors: ['AGENT_TIMEOUT', 'RATE_LIMIT', 'TRANSIENT_ERROR'],
        nonRetryableErrors: ['INVALID_INPUT', 'BUDGET_EXHAUSTED'],
      },
      failover: {
        strategy: 'reassign',
        timeoutMs: 10_000,
        preservePartialResults: true,
        cooldownMs: 60_000,
      },
      maxFailureRate: 0.4,
      autoReplace: true,
      deadLetterQueue: true,
      checkpointIntervalMs: 60_000,
    },
    loadBalancing: {
      strategy: 'least-loaded',
      healthCheckIntervalMs: 10_000,
      unhealthyThreshold: 3,
    },
    memory: {
      maxEntries: 1000,
      maxSizeBytes: 10 * 1024 * 1024, // 10 MB
      enableEmbeddings: true,
      embeddingModel: 'text-embedding-3-small',
      gcStrategy: 'importance',
      gcIntervalMs: 5 * 60 * 1000,
      conflictResolution: 'last-write-wins',
      syncMode: 'realtime',
    },
    timeoutMs: 30 * 60 * 1000,
    tags: ['research', 'competitor-analysis', 'q1-2026'],
  });

  console.log(`Swarm created: ${swarm.id}`);

  // Start the swarm — provisions agents and begins accepting tasks
  const state = await swarmService.start(swarm.id);
  console.log(`Swarm status: ${state.status}, active agents: ${state.activeAgents}`);

  return swarm;
}
```

### 2. Parallel Research with Task Distribution

```typescript
import { SwarmService, TaskDistributor } from '@mcv/agentic-os/swarm';

async function runParallelResearch(swarmId: string) {
  const swarmService = new SwarmService(ctx);

  // Define research tasks — one per competitor
  const competitors = [
    'Acme Corp', 'Beta Industries', 'Gamma Solutions', 'Delta Tech',
    'Epsilon AI', 'Zeta Cloud', 'Eta Platform', 'Theta Labs',
    'Iota Systems', 'Kappa Analytics',
  ];

  // Submit all tasks as a batch — TaskDistributor handles assignment
  const tasks = await swarmService.submitBatch(swarmId, competitors.map((company, i) => ({
    type: 'competitor-research',
    description: `Research ${company}: pricing, features, market position, recent news`,
    input: {
      company,
      aspects: ['pricing', 'features', 'market_position', 'recent_news', 'team_size'],
      depth: 'comprehensive',
    },
    priority: i < 3 ? 'high' : 'normal', // Top 3 competitors are high priority
  })));

  console.log(`Submitted ${tasks.length} tasks`);

  // Monitor progress with real-time events
  const unsubscribe = swarmService.subscribe(swarmId, (event) => {
    switch (event.type) {
      case 'task.completed':
        console.log(`✓ Completed: ${event.data.description} (${event.data.tokensUsed} tokens)`);
        break;
      case 'task.failed':
        console.log(`✗ Failed: ${event.data.description} — ${event.data.error.message}`);
        break;
      case 'resource.alert':
        console.log(`⚠ Resource alert: ${event.data.message}`);
        break;
      case 'agent.unhealthy':
        console.log(`🏥 Agent unhealthy: ${event.data.label}`);
        break;
    }
  });

  // Wait for all research tasks to complete
  const results = await swarmService.awaitCompletion(swarmId, {
    timeoutMs: 20 * 60 * 1000,
    onProgress: (progress) => {
      console.log(`Progress: ${(progress * 100).toFixed(1)}%`);
    },
  });

  unsubscribe();

  // Now submit synthesis task for the synthesizer agent
  const synthesisTask = await swarmService.submitTask(swarmId, {
    type: 'synthesis',
    description: 'Synthesize all competitor research into a comprehensive report',
    input: {
      researchResults: results.map(r => r.output),
      format: 'executive-summary',
      maxLength: 5000,
    },
    priority: 'high',
  });

  const report = await swarmService.awaitTask(synthesisTask.id);
  console.log('Final report:', report.output);

  return report;
}
```

### 3. Consensus Voting — Architecture Decision

```typescript
import { SwarmService, ConsensusEngine } from '@mcv/agentic-os/swarm';

async function architectureDecision(swarmId: string) {
  const swarmService = new SwarmService(ctx);
  const consensusEngine = new ConsensusEngine(ctx);

  // Create a debate swarm for architecture decisions
  const debateSwarm = await swarmService.create({
    name: 'architecture-decision-auth-system',
    description: 'Decide on authentication architecture for the new platform',
    ventureId,
    mode: 'debate',
    topology: 'mesh',
    minAgents: 3,
    maxAgents: 5,
    slots: [
      {
        label: 'Security-Expert',
        role: 'specialist' as const,
        capabilities: ['reasoning'],
        model: { provider: 'anthropic', model: 'claude-opus-4-20250514' },
        systemPrompt: 'You are a security expert. Prioritize security, compliance, and threat modeling.',
        consensusWeight: 1.5, // Security expert gets extra weight
      },
      {
        label: 'Performance-Engineer',
        role: 'specialist' as const,
        capabilities: ['reasoning'],
        model: { provider: 'anthropic', model: 'claude-opus-4-20250514' },
        systemPrompt: 'You are a performance engineer. Prioritize latency, throughput, and scalability.',
      },
      {
        label: 'DX-Advocate',
        role: 'specialist' as const,
        capabilities: ['reasoning'],
        model: { provider: 'anthropic', model: 'claude-sonnet-4-20250514' },
        systemPrompt: 'You are a developer experience advocate. Prioritize API ergonomics and simplicity.',
      },
      {
        label: 'Critic',
        role: 'critic' as const,
        capabilities: ['reasoning'],
        model: { provider: 'anthropic', model: 'claude-opus-4-20250514' },
        systemPrompt: 'You are a devil\'s advocate. Find weaknesses in every proposal.',
      },
    ],
    consensus: {
      strategy: 'weighted-majority',
      quorum: 3,
      deadlineMs: 5 * 60 * 1000,
      quorumFailurePolicy: 'extend',
      maxRounds: 3,
      blindVoting: false, // Agents can see others' reasoning
      tieBreaker: 'highest-confidence',
      minConfidence: 0.3,
    },
    budget: {
      totalTokens: 200_000,
      maxConcurrentCalls: 4,
      maxDurationMs: 15 * 60 * 1000,
      exhaustionPolicy: 'stop',
      alertThresholds: [0.75, 0.9],
      priority: 'high',
    },
    faultTolerance: {
      circuitBreaker: {
        failureThreshold: 2,
        failureWindowMs: 60_000,
        resetTimeoutMs: 15_000,
        halfOpenSuccesses: 1,
        countableErrors: ['AGENT_TIMEOUT', 'API_ERROR'],
      },
      retryPolicy: {
        maxRetries: 2,
        baseDelayMs: 2000,
        maxDelayMs: 10_000,
        backoff: 'exponential',
        retryOnDifferentAgent: false, // Each agent has unique expertise
        retryableErrors: ['AGENT_TIMEOUT'],
        nonRetryableErrors: ['INVALID_INPUT'],
      },
      failover: {
        strategy: 'degrade',
        timeoutMs: 5_000,
        preservePartialResults: true,
        cooldownMs: 30_000,
      },
      maxFailureRate: 0.25,
      autoReplace: false,
      deadLetterQueue: false,
      checkpointIntervalMs: 30_000,
    },
    loadBalancing: {
      strategy: 'round-robin',
      healthCheckIntervalMs: 15_000,
      unhealthyThreshold: 2,
    },
  });

  await swarmService.start(debateSwarm.id);

  // Each agent researches and proposes their preferred approach
  const researchTasks = await swarmService.submitBatch(debateSwarm.id, [
    {
      type: 'research-proposal',
      description: 'Research and propose an authentication architecture',
      input: {
        question: 'What authentication architecture should we use for our multi-tenant SaaS platform?',
        options: [
          'JWT with refresh tokens (self-managed)',
          'OAuth 2.0 with third-party provider (Auth0/Clerk)',
          'Session-based with Redis store',
          'Passkey/WebAuthn primary with fallback',
        ],
        constraints: [
          'Must support multi-tenant isolation',
          'Must handle 10K+ concurrent users',
          'Must support SSO/SAML for enterprise clients',
          'Budget: moderate (not unlimited)',
        ],
      },
      priority: 'high',
    },
  ]);

  // Wait for research to complete
  await swarmService.awaitCompletion(debateSwarm.id);

  // Initiate consensus round
  const round = await consensusEngine.initiateRound({
    swarmId: debateSwarm.id,
    prompt: 'Based on your research, which authentication architecture best meets our requirements?',
    options: [
      { id: 'jwt', label: 'JWT with refresh tokens (self-managed)' },
      { id: 'oauth', label: 'OAuth 2.0 with third-party provider' },
      { id: 'session', label: 'Session-based with Redis store' },
      { id: 'passkey', label: 'Passkey/WebAuthn primary with fallback' },
    ],
    strategy: 'weighted-majority',
    quorum: 3,
    deadlineMs: 3 * 60 * 1000,
    blindVoting: false,
  });

  console.log(`Consensus round opened: ${round.id}`);

  // Agents submit votes automatically (or you can do it manually)
  // The ConsensusEngine handles vote collection via the message bus

  // Wait for resolution
  const outcome = await consensusEngine.awaitResolution(round.id, {
    timeoutMs: 5 * 60 * 1000,
  });

  console.log(`Decision: ${outcome.winner}`);
  console.log(`Agreement level: ${(outcome.agreementLevel * 100).toFixed(1)}%`);
  console.log(`Rounds taken: ${outcome.roundsTaken}`);
  console.log('Vote tally:', outcome.weightedTally);

  if (outcome.dissents.length > 0) {
    console.log('Dissenting opinions:');
    for (const dissent of outcome.dissents) {
      console.log(`  - ${dissent.agentSlotId}: preferred "${dissent.choice}" because: ${dissent.reasoning}`);
    }
  }

  return outcome;
}
```

### 4. Shared Memory — Collaborative Knowledge Building

```typescript
import { SwarmMemoryService, SharedContextManager } from '@mcv/agentic-os/swarm';

async function collaborativeKnowledge(swarmId: string) {
  const memory = new SwarmMemoryService(ctx);
  const sharedCtx = new SharedContextManager(ctx);

  // Agent writes a discovery to shared memory
  await memory.write({
    swarmId,
    key: 'competitor/acme-corp/pricing',
    content: 'Acme Corp uses a tiered pricing model: Free ($0), Pro ($49/mo), Enterprise (custom). ' +
             'They recently introduced a usage-based component for API calls over 10K/month.',
    data: {
      tiers: [
        { name: 'Free', price: 0, limits: { apiCalls: 1000, users: 3 } },
        { name: 'Pro', price: 49, limits: { apiCalls: 10000, users: 25 } },
        { name: 'Enterprise', price: null, limits: { apiCalls: 'unlimited', users: 'unlimited' } },
      ],
      usagePricing: { perApiCall: 0.001, threshold: 10000 },
      lastUpdated: '2026-01-15',
      source: 'https://acme.example.com/pricing',
    },
    scope: 'swarm',
    tags: ['pricing', 'competitor', 'acme-corp'],
    importance: 0.8,
  });

  // Another agent queries memory to avoid duplicate work
  const existing = await memory.search({
    swarmId,
    query: 'competitor pricing information',
    scope: 'swarm',
    tags: ['pricing'],
    limit: 10,
  });

  console.log(`Found ${existing.length} existing pricing entries`);

  // Semantic search using embeddings
  const similar = await memory.semanticSearch({
    swarmId,
    query: 'What do competitors charge for their API access?',
    topK: 5,
    minSimilarity: 0.7,
  });

  for (const result of similar) {
    console.log(`[${result.similarity.toFixed(2)}] ${result.key}: ${result.content.substring(0, 100)}...`);
  }

  // Use the blackboard pattern for coordination signals
  const blackboard = sharedCtx.getBlackboard(swarmId);

  // Agent signals that a competitor has been fully researched
  await blackboard.write('status/acme-corp', {
    status: 'complete',
    completedBy: 'Researcher-1',
    sections: ['pricing', 'features', 'market_position', 'news'],
    tokensUsed: 3500,
  });

  // Another agent checks what's already done before starting work
  const statuses = await blackboard.readPattern('status/*');
  const completed = statuses.filter(s => s.value.status === 'complete');
  const remaining = statuses.filter(s => s.value.status !== 'complete');

  console.log(`Research progress: ${completed.length}/${statuses.length} competitors done`);

  // Atomic read-modify-write with optimistic locking
  await blackboard.update('aggregated-findings', (current) => ({
    ...current,
    competitorCount: (current?.competitorCount ?? 0) + 1,
    avgPricing: recalculateAvg(current?.avgPricing, newPricingData),
    lastUpdated: new Date().toISOString(),
  }));

  // Pin critical memory so garbage collection won't remove it
  await memory.pin(swarmId, 'competitor/acme-corp/pricing');

  // Read with access tracking (increments accessCount, updates lastAccessedAt)
  const entry = await memory.read(swarmId, 'competitor/acme-corp/pricing', {
    trackAccess: true,
  });

  console.log(`Entry accessed ${entry.accessCount} times, importance: ${entry.importance}`);
}
```

### 5. Fault Recovery — Circuit Breaker and Failover

```typescript
import {
  SwarmService,
  CircuitBreakerRegistry,
  RetryManager,
  FailoverController,
  SwarmRecoveryService,
} from '@mcv/agentic-os/swarm';

async function faultTolerantExecution(swarmId: string) {
  const swarmService = new SwarmService(ctx);
  const circuitBreakers = new CircuitBreakerRegistry(ctx);
  const retryManager = new RetryManager(ctx);
  const failover = new FailoverController(ctx);
  const recovery = new SwarmRecoveryService(ctx);

  // Monitor circuit breaker state changes
  circuitBreakers.on('state-change', (event) => {
    const { agentSlotId, previousState, newState, failureCount } = event;
    console.log(
      `Circuit breaker [${agentSlotId}]: ${previousState} → ${newState} ` +
      `(${failureCount} failures)`
    );

    if (newState === 'open') {
      // Circuit is open — agent is unhealthy, tasks will be rerouted
      console.warn(`Agent ${agentSlotId} circuit OPEN — rerouting tasks`);
    }

    if (newState === 'half-open') {
      // Trying a test request to see if agent has recovered
      console.log(`Agent ${agentSlotId} circuit HALF-OPEN — testing recovery`);
    }

    if (newState === 'closed') {
      console.log(`Agent ${agentSlotId} circuit CLOSED — agent recovered`);
    }
  });

  // Subscribe to swarm events for comprehensive fault monitoring
  swarmService.subscribe(swarmId, async (event) => {
    switch (event.type) {
      case 'agent.failed': {
        const { slotId, error, consecutiveFailures } = event.data;
        console.error(`Agent ${slotId} failed: ${error.message} (${consecutiveFailures} consecutive)`);

        // Check if we should trigger failover
        const breaker = await circuitBreakers.getState(slotId);
        if (breaker.state === 'open') {
          // Trigger failover — reassign tasks to healthy agents
          const result = await failover.execute(swarmId, slotId, {
            strategy: 'reassign',
            preservePartialResults: true,
          });

          console.log(`Failover result: ${result.reassignedTasks} tasks reassigned to ${result.targetSlotId}`);
        }
        break;
      }

      case 'agent.terminated': {
        const { slotId, reason } = event.data;
        console.warn(`Agent ${slotId} terminated: ${reason}`);

        // Auto-replace if configured
        const swarm = await swarmService.get(swarmId);
        if (swarm.config.faultTolerance.autoReplace) {
          const newSlot = await swarmService.replaceAgent(swarmId, slotId, {
            label: `Replacement-${Date.now()}`,
            role: 'worker',
            capabilities: ['web-search', 'summarization'],
            model: { provider: 'anthropic', model: 'claude-sonnet-4-20250514' },
          });
          console.log(`Replaced failed agent with ${newSlot.label} (${newSlot.id})`);
        }
        break;
      }

      case 'task.failed': {
        const { taskId, error, retryCount, maxRetries } = event.data;

        if (retryCount < maxRetries) {
          // RetryManager handles this automatically with backoff
          console.log(`Task ${taskId} failed, retry ${retryCount + 1}/${maxRetries} scheduled`);
        } else {
          // Max retries exceeded — move to dead letter queue
          console.error(`Task ${taskId} exhausted retries, moving to dead letter queue`);
          await retryManager.moveToDeadLetter(taskId, error);
        }
        break;
      }

      case 'swarm.degraded': {
        const { healthyAgents, totalAgents, failureRate } = event.data;
        console.warn(
          `Swarm degraded: ${healthyAgents}/${totalAgents} healthy ` +
          `(${(failureRate * 100).toFixed(1)}% failure rate)`
        );

        if (failureRate > 0.5) {
          // More than half the swarm is unhealthy — consider recovery
          console.error('Critical degradation — initiating recovery');
          await recovery.initiateRecovery(swarmId, {
            strategy: 'checkpoint-restore',
            preserveCompletedWork: true,
          });
        }
        break;
      }
    }
  });

  // Manual circuit breaker management
  // Force-close a circuit breaker (e.g., after manual intervention)
  await circuitBreakers.forceClose('agent-slot-id-123');

  // Get dead letter queue contents for manual review
  const deadLetters = await retryManager.getDeadLetterQueue(swarmId);
  console.log(`Dead letter queue: ${deadLetters.length} tasks`);

  for (const dl of deadLetters) {
    console.log(`  - Task ${dl.taskId}: ${dl.error.message} (failed ${dl.totalAttempts} times)`);

    // Optionally retry dead-lettered tasks after fixing the issue
    if (dl.error.code === 'RATE_LIMIT') {
      await retryManager.retryDeadLetter(dl.taskId, {
        delayMs: 60_000, // Wait a minute before retry
        assignToDifferentAgent: true,
      });
    }
  }

  // Create recovery checkpoint manually
  const checkpoint = await recovery.createCheckpoint(swarmId);
  console.log(`Checkpoint created: ${checkpoint.id} at ${checkpoint.createdAt}`);

  // Restore from checkpoint (e.g., after infrastructure recovery)
  await recovery.restoreFromCheckpoint(swarmId, checkpoint.id, {
    skipCompletedTasks: true,
    resetFailedAgents: true,
  });
}
```

### 6. Ensemble Mode — Best-of-N Problem Solving

```typescript
import { SwarmService, ConsensusEngine } from '@mcv/agentic-os/swarm';

async function ensembleProblemSolving() {
  const swarmService = new SwarmService(ctx);

  // Create an ensemble swarm — all agents solve the same problem
  const swarm = await swarmService.create({
    name: 'code-review-ensemble',
    description: 'Multiple agents review the same PR, best analysis wins',
    ventureId,
    mode: 'ensemble',
    topology: 'star',
    minAgents: 3,
    maxAgents: 5,
    slots: [
      {
        label: 'Reviewer-GPT4',
        role: 'critic',
        capabilities: ['code-execution', 'reasoning'],
        model: { provider: 'openai', model: 'gpt-4o' },
        systemPrompt: 'Perform a thorough code review. Focus on correctness, performance, and security.',
      },
      {
        label: 'Reviewer-Claude',
        role: 'critic',
        capabilities: ['code-execution', 'reasoning'],
        model: { provider: 'anthropic', model: 'claude-opus-4-20250514' },
        systemPrompt: 'Perform a thorough code review. Focus on correctness, performance, and security.',
      },
      {
        label: 'Reviewer-Gemini',
        role: 'critic',
        capabilities: ['code-execution', 'reasoning'],
        model: { provider: 'google', model: 'gemini-2.5-pro' },
        systemPrompt: 'Perform a thorough code review. Focus on correctness, performance, and security.',
      },
    ],
    consensus: {
      strategy: 'best-of-n',
      quorum: 3,
      deadlineMs: 5 * 60 * 1000,
      quorumFailurePolicy: 'proceed-with-available',
      maxRounds: 1,
      blindVoting: true,
      tieBreaker: 'highest-confidence',
    },
    budget: {
      totalTokens: 150_000,
      maxConcurrentCalls: 3,
      maxDurationMs: 10 * 60 * 1000,
      exhaustionPolicy: 'stop',
      alertThresholds: [0.8],
      priority: 'normal',
    },
    faultTolerance: {
      circuitBreaker: {
        failureThreshold: 2,
        failureWindowMs: 60_000,
        resetTimeoutMs: 30_000,
        halfOpenSuccesses: 1,
        countableErrors: ['AGENT_TIMEOUT', 'API_ERROR'],
      },
      retryPolicy: {
        maxRetries: 1,
        baseDelayMs: 5000,
        maxDelayMs: 15_000,
        backoff: 'constant',
        retryOnDifferentAgent: false,
        retryableErrors: ['AGENT_TIMEOUT'],
        nonRetryableErrors: [],
      },
      failover: {
        strategy: 'degrade',
        timeoutMs: 5_000,
        preservePartialResults: true,
        cooldownMs: 30_000,
      },
      maxFailureRate: 0.5,
      autoReplace: false,
      deadLetterQueue: false,
      checkpointIntervalMs: 60_000,
    },
    loadBalancing: {
      strategy: 'round-robin',
      healthCheckIntervalMs: 10_000,
      unhealthyThreshold: 2,
    },
  });

  await swarmService.start(swarm.id);

  // Submit the same task to all agents (ensemble mode distributes automatically)
  const task = await swarmService.submitTask(swarm.id, {
    type: 'code-review',
    description: 'Review PR #1234 — New authentication middleware',
    input: {
      prUrl: 'https://github.com/venture/repo/pull/1234',
      diff: '... the PR diff content ...',
      context: 'This PR adds JWT authentication middleware to the Express API.',
    },
    priority: 'high',
  });

  // In ensemble mode, all agents work on the same task independently
  // ConsensusEngine (best-of-n) picks the highest-quality response
  const result = await swarmService.awaitTask(task.id);

  console.log('Best review:', result.output.review);
  console.log('Selected from agent:', result.output.selectedAgent);
  console.log('Quality score:', result.output.qualityScore);
  console.log('All reviews:', result.output.allReviews); // For comparison
}
```

### 7. Pipeline Mode — Sequential Processing

```typescript
import { SwarmService } from '@mcv/agentic-os/swarm';

async function pipelineProcessing() {
  const swarmService = new SwarmService(ctx);

  // Pipeline swarm: content goes through stages
  const swarm = await swarmService.create({
    name: 'content-pipeline',
    description: 'Research → Draft → Edit → Fact-check → Publish',
    ventureId,
    mode: 'pipeline',
    topology: 'pipeline',
    minAgents: 4,
    maxAgents: 4,
    slots: [
      {
        label: 'Stage-1-Researcher',
        role: 'researcher',
        capabilities: ['web-search', 'data-extraction'],
        model: { provider: 'anthropic', model: 'claude-sonnet-4-20250514' },
        systemPrompt: 'Research the given topic thoroughly. Output structured research notes.',
      },
      {
        label: 'Stage-2-Writer',
        role: 'worker',
        capabilities: ['creative-writing'],
        model: { provider: 'anthropic', model: 'claude-opus-4-20250514' },
        systemPrompt: 'Write engaging, well-structured content based on the research provided.',
      },
      {
        label: 'Stage-3-Editor',
        role: 'critic',
        capabilities: ['reasoning'],
        model: { provider: 'anthropic', model: 'claude-opus-4-20250514' },
        systemPrompt: 'Edit for clarity, grammar, tone consistency. Return the improved version with tracked changes.',
      },
      {
        label: 'Stage-4-FactChecker',
        role: 'validator',
        capabilities: ['web-search', 'reasoning'],
        model: { provider: 'anthropic', model: 'claude-sonnet-4-20250514' },
        systemPrompt: 'Verify all claims and statistics. Flag anything unverifiable. Return fact-check report.',
      },
    ],
    budget: {
      totalTokens: 300_000,
      maxConcurrentCalls: 2,
      maxDurationMs: 20 * 60 * 1000,
      exhaustionPolicy: 'alert-and-continue',
      alertThresholds: [0.5, 0.8],
      priority: 'normal',
    },
    faultTolerance: {
      circuitBreaker: {
        failureThreshold: 2,
        failureWindowMs: 120_000,
        resetTimeoutMs: 30_000,
        halfOpenSuccesses: 1,
        countableErrors: ['AGENT_TIMEOUT', 'API_ERROR'],
      },
      retryPolicy: {
        maxRetries: 2,
        baseDelayMs: 3000,
        maxDelayMs: 15_000,
        backoff: 'exponential',
        retryOnDifferentAgent: false,
        retryableErrors: ['AGENT_TIMEOUT', 'TRANSIENT_ERROR'],
        nonRetryableErrors: ['INVALID_INPUT'],
      },
      failover: {
        strategy: 'reassign',
        timeoutMs: 10_000,
        preservePartialResults: true,
        cooldownMs: 30_000,
      },
      maxFailureRate: 0.25,
      autoReplace: true,
      deadLetterQueue: true,
      checkpointIntervalMs: 60_000,
    },
    loadBalancing: {
      strategy: 'capability-based',
      healthCheckIntervalMs: 15_000,
      unhealthyThreshold: 3,
    },
  });

  await swarmService.start(swarm.id);

  // Submit pipeline task — it flows through all stages automatically
  const task = await swarmService.submitTask(swarm.id, {
    type: 'content-creation',
    description: 'Create blog post: "The Future of Multi-Agent AI Systems"',
    input: {
      topic: 'The Future of Multi-Agent AI Systems',
      audience: 'Technical leaders and CTOs',
      wordCount: 2000,
      tone: 'authoritative but accessible',
      keywords: ['multi-agent', 'AI orchestration', 'swarm intelligence', 'enterprise AI'],
    },
    priority: 'normal',
  });

  // Track pipeline progress stage by stage
  swarmService.subscribe(swarm.id, (event) => {
    if (event.type === 'task.stage-completed') {
      const { stageIndex, stageName, output } = event.data;
      console.log(`Stage ${stageIndex} (${stageName}) complete`);
      console.log(`  Output preview: ${JSON.stringify(output).substring(0, 200)}...`);
    }
  });

  const result = await swarmService.awaitTask(task.id);

  console.log('Pipeline complete!');
  console.log('Final article:', result.output.article);
  console.log('Fact-check report:', result.output.factCheckReport);
  console.log('Stages completed:', result.output.stagesCompleted);
}
```

### 8. Load Balancing and Real-time Monitoring

```typescript
import { SwarmService, LoadBalancer, CapacityTracker } from '@mcv/agentic-os/swarm';

async function monitorSwarmPerformance(swarmId: string) {
  const swarmService = new SwarmService(ctx);
  const loadBalancer = new LoadBalancer(ctx);
  const capacityTracker = new CapacityTracker(ctx);

  // Get current load distribution
  const distribution = await loadBalancer.getDistribution(swarmId);

  console.log('Load Distribution:');
  for (const [slotId, metrics] of Object.entries(distribution)) {
    console.log(`  ${metrics.label}:`);
    console.log(`    Active tasks: ${metrics.activeTasks}`);
    console.log(`    Queue depth:  ${metrics.queueDepth}`);
    console.log(`    Avg latency:  ${metrics.avgLatencyMs.toFixed(0)}ms`);
    console.log(`    Utilization:  ${(metrics.utilization * 100).toFixed(1)}%`);
    console.log(`    Tokens used:  ${metrics.tokensUsed}/${metrics.tokensLimit}`);
  }

  // Get capacity overview
  const capacity = await capacityTracker.getCapacity(swarmId);

  console.log('\nSwarm Capacity:');
  console.log(`  Total slots:    ${capacity.totalSlots}`);
  console.log(`  Healthy slots:  ${capacity.healthySlots}`);
  console.log(`  Available:      ${capacity.availableCapacity} tasks`);
  console.log(`  Pending tasks:  ${capacity.pendingTasks}`);
  console.log(`  Throughput:     ${capacity.tasksPerMinute.toFixed(1)} tasks/min`);

  // Get full metrics snapshot
  const metrics = await swarmService.getMetrics(swarmId);

  console.log('\nSwarm Metrics:');
  console.log(`  Progress:       ${(metrics.progress * 100).toFixed(1)}%`);
  console.log(`  Tasks:          ${metrics.taskCounts.completed}/${metrics.taskCounts.completed + metrics.taskCounts.pending + metrics.taskCounts.running} done`);
  console.log(`  Tokens:         ${metrics.resourceUsage.tokens.used}/${metrics.resourceUsage.tokens.limit}`);
  console.log(`  Cost:           $${(metrics.resourceUsage.cost.totalCents / 100).toFixed(2)}`);
  console.log(`  Uptime:         ${(metrics.resourceUsage.duration.elapsedMs / 1000 / 60).toFixed(1)} min`);
  console.log(`  Avg latency:    ${metrics.resourceUsage.compute.avgLatencyMs.toFixed(0)}ms`);
  console.log(`  P95 latency:    ${metrics.resourceUsage.compute.p95LatencyMs.toFixed(0)}ms`);

  // Dynamically adjust load balancing strategy based on metrics
  if (metrics.resourceUsage.compute.p95LatencyMs > 10_000) {
    console.warn('High P95 latency detected — switching to least-loaded strategy');
    await loadBalancer.setStrategy(swarmId, 'least-loaded');
  }

  // Scale up if capacity is insufficient
  if (capacity.pendingTasks > capacity.availableCapacity * 2) {
    const state = await swarmService.getState(swarmId);
    const swarm = await swarmService.get(swarmId);

    if (state.activeAgents < swarm.maxAgents) {
      console.log('Scaling up — adding agent slot');
      await swarmService.addAgent(swarmId, {
        label: `AutoScale-${Date.now()}`,
        role: 'worker',
        capabilities: ['web-search', 'summarization'],
        model: { provider: 'anthropic', model: 'claude-sonnet-4-20250514' },
      });
    }
  }
}
```

---

## Error Codes

| Code | Name | HTTP | Description |
|------|------|------|-------------|
| `SWARM_NOT_FOUND` | Swarm Not Found | 404 | No swarm exists with the given ID in this venture |
| `SWARM_ALREADY_RUNNING` | Swarm Already Running | 409 | Cannot start a swarm that is already in running state |
| `SWARM_NOT_RUNNING` | Swarm Not Running | 409 | Operation requires swarm to be in running state |
| `SWARM_BUDGET_EXHAUSTED` | Budget Exhausted | 402 | Swarm has exhausted its token/cost budget |
| `SWARM_TIMEOUT` | Swarm Timeout | 408 | Swarm exceeded its maximum wall-clock duration |
| `SWARM_MIN_AGENTS_NOT_MET` | Minimum Agents Not Met | 400 | Cannot start swarm — fewer agents than minAgents configured |
| `SWARM_MAX_AGENTS_EXCEEDED` | Maximum Agents Exceeded | 400 | Cannot add agent — swarm already at maxAgents capacity |
| `AGENT_SLOT_NOT_FOUND` | Agent Slot Not Found | 404 | No agent slot exists with the given ID in this swarm |
| `AGENT_SLOT_UNHEALTHY` | Agent Slot Unhealthy | 503 | Agent slot is in unhealthy state and cannot accept tasks |
| `AGENT_CIRCUIT_OPEN` | Circuit Breaker Open | 503 | Agent's circuit breaker is open due to repeated failures |
| `TASK_NOT_FOUND` | Task Not Found | 404 | No task exists with the given ID |
| `TASK_ALREADY_COMPLETED` | Task Already Completed | 409 | Cannot modify a task that has already completed |
| `TASK_DEPENDENCY_CYCLE` | Dependency Cycle | 400 | Task dependencies form a cycle (circular dependency) |
| `TASK_UNRESOLVABLE_DEPS` | Unresolvable Dependencies | 400 | Task depends on tasks that don't exist or are cancelled |
| `CONSENSUS_ROUND_NOT_FOUND` | Consensus Round Not Found | 404 | No consensus round exists with the given ID |
| `CONSENSUS_ALREADY_VOTED` | Already Voted | 409 | Agent has already submitted a vote in this round |
| `CONSENSUS_DEADLINE_PASSED` | Consensus Deadline Passed | 410 | Voting deadline has passed for this consensus round |
| `CONSENSUS_QUORUM_FAILED` | Quorum Not Reached | 400 | Consensus round failed — insufficient votes for quorum |
| `MEMORY_KEY_CONFLICT` | Memory Key Conflict | 409 | Optimistic concurrency conflict — memory entry was modified |
| `MEMORY_QUOTA_EXCEEDED` | Memory Quota Exceeded | 413 | Swarm memory has exceeded configured maxEntries or maxSizeBytes |
| `MESSAGE_CHANNEL_NOT_FOUND` | Message Channel Not Found | 404 | No message channel exists with the given name |
| `MESSAGE_TTL_EXPIRED` | Message Expired | 410 | Message TTL has expired before delivery |
| `BLACKBOARD_LOCK_HELD` | Blackboard Lock Held | 423 | Blackboard entry is locked by another agent |
| `INVALID_TOPOLOGY` | Invalid Topology | 400 | Specified topology is invalid for the given swarm mode |
| `RESOURCE_LIMIT_EXCEEDED` | Resource Limit | 429 | Per-agent or per-task resource limit exceeded |

### Error Response Format

```typescript
interface SwarmError {
  code: string;           // e.g., 'SWARM_BUDGET_EXHAUSTED'
  message: string;        // Human-readable description
  swarmId?: SwarmId;      // Related swarm
  agentSlotId?: AgentSlotId; // Related agent slot
  taskId?: SwarmTaskId;   // Related task
  details?: Record<string, unknown>; // Additional context
  retryable: boolean;     // Whether the operation can be retried
  timestamp: Date;
}
```

---

## Security Considerations

### Multi-Tenant Isolation

All swarm data is scoped to a venture via PostgreSQL Row-Level Security. The `venture_id` is extracted from the authenticated session context and set as a runtime parameter (`app.current_venture_id`) on every database connection. This ensures:

- **Data isolation**: Agents in Venture A cannot see or modify swarms, tasks, messages, or memory belonging to Venture B
- **Cross-venture protection**: Even if an agent is misconfigured or compromised, RLS prevents data leakage at the database level
- **Audit trail**: All operations are logged with venture context for compliance

### Agent Sandboxing

Each agent slot runs in an isolated execution context:

- **System prompt isolation**: Agent system prompts are not shared across slots unless explicitly configured
- **Memory scope enforcement**: `agent`-scoped memory is only readable by the creating agent; scope escalation requires explicit API calls
- **Capability restrictions**: Agents can only use capabilities explicitly granted in their slot configuration
- **Token budget isolation**: Per-agent token limits prevent a single agent from consuming the entire swarm budget

### Message Security

Inter-agent messages are secured through multiple layers:

- **Venture-scoped topics**: Kafka topics are partitioned by venture ID, preventing cross-tenant message leakage
- **Message validation**: All messages are validated against the `SwarmMessageType` schema before delivery
- **TTL enforcement**: Messages with expired TTL are automatically purged, preventing stale data from influencing decisions
- **Acknowledgment tracking**: Critical messages can require explicit acknowledgment, ensuring delivery guarantees

### Consensus Integrity

Consensus mechanisms include protections against manipulation:

- **Blind voting**: When enabled, agents submit votes without seeing others' choices, preventing bandwagon effects
- **Confidence thresholds**: Votes below `minConfidence` are excluded, filtering out low-conviction responses
- **Weight bounds**: Consensus weights are clamped to prevent any single agent from dominating decisions
- **Audit logging**: All votes, with reasoning and evidence, are stored for post-hoc analysis

### Resource Abuse Prevention

- **Budget hard limits**: Token and cost budgets have hard ceilings that cannot be exceeded even with `alert-and-continue` policy
- **Rate limiting**: Per-agent and per-swarm rate limits prevent abuse of upstream LLM APIs
- **Circuit breakers**: Prevent cascading failures from consuming resources unnecessarily
- **Timeout enforcement**: All operations have configurable timeouts with mandatory maximums

### Secrets Management

- Model API keys are never stored in swarm configuration; they are resolved at runtime from the venture's secrets vault
- Agent system prompts may contain sensitive context but are encrypted at rest
- Memory entries marked as sensitive can be auto-encrypted using the venture's encryption key

---

## Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `SWARM_MAX_AGENTS_PER_SWARM` | No | `20` | Maximum number of agent slots per swarm |
| `SWARM_MAX_SWARMS_PER_VENTURE` | No | `50` | Maximum concurrent swarms per venture |
| `SWARM_MAX_TASKS_PER_SWARM` | No | `1000` | Maximum tasks per swarm |
| `SWARM_DEFAULT_TIMEOUT_MS` | No | `3600000` | Default swarm timeout (1 hour) |
| `SWARM_HEALTH_CHECK_INTERVAL_MS` | No | `10000` | Default health check interval |
| `SWARM_CHECKPOINT_INTERVAL_MS` | No | `60000` | Default recovery checkpoint interval |
| `SWARM_MESSAGE_RETENTION_HOURS` | No | `168` | How long to retain messages (7 days) |
| `SWARM_MEMORY_MAX_ENTRIES` | No | `10000` | Default max memory entries per swarm |
| `SWARM_MEMORY_MAX_SIZE_MB` | No | `50` | Default max memory size per swarm |
| `SWARM_GC_INTERVAL_MS` | No | `300000` | Memory garbage collection interval (5 min) |
| `SWARM_CIRCUIT_BREAKER_THRESHOLD` | No | `5` | Default failure threshold for circuit breakers |
| `SWARM_CIRCUIT_BREAKER_RESET_MS` | No | `30000` | Default circuit breaker reset timeout |
| `SWARM_MAX_RETRIES` | No | `3` | Default maximum task retries |
| `SWARM_RETRY_BASE_DELAY_MS` | No | `1000` | Default base retry delay |
| `SWARM_DEAD_LETTER_RETENTION_HOURS` | No | `720` | Dead letter queue retention (30 days) |
| `KAFKA_BROKERS` | Yes | — | Redpanda/Kafka broker addresses (comma-separated) |
| `KAFKA_SWARM_TOPIC_PREFIX` | No | `swarm` | Prefix for swarm-related Kafka topics |
| `KAFKA_CONSUMER_GROUP_PREFIX` | No | `swarm-cg` | Consumer group prefix |
| `KAFKA_MESSAGE_MAX_BYTES` | No | `1048576` | Maximum message size (1 MB) |
| `EMBEDDING_MODEL` | No | `text-embedding-3-small` | Default embedding model for memory |
| `EMBEDDING_DIMENSIONS` | No | `1536` | Embedding vector dimensions |
| `SUPABASE_URL` | Yes | — | Supabase project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | — | Supabase service role key (server-side only) |
| `DATABASE_URL` | Yes | — | PostgreSQL connection string |
| `SWARM_LOG_LEVEL` | No | `info` | Logging verbosity (debug, info, warn, error) |
| `SWARM_METRICS_ENABLED` | No | `true` | Enable Prometheus metrics export |
| `SWARM_METRICS_PORT` | No | `9090` | Port for metrics endpoint |

---

## Dependencies

### Internal (MCV Modules)

| Module | Relationship | Purpose |
|--------|-------------|---------|
| `@mcv/agentic-os/queen` | Upstream | Queen decomposes goals and creates swarms |
| `@mcv/agentic-os/scouts` | Downstream | Scouts are the worker agents that fill swarm slots |
| `@mcv/agentic-os/naos` | Runtime | Provides the agent runtime/execution environment |
| `@mcv/db` | Infrastructure | Drizzle ORM schemas, migrations, connection pool |
| `@mcv/auth` | Security | Authentication, venture context, RLS setup |
| `@mcv/api` | API | tRPC router registration, middleware |
| `@mcv/events` | Eventing | Domain event publishing/subscribing |
| `@mcv/observability` | Monitoring | Logging, tracing, metrics |
| `@mcv/secrets` | Security | API key resolution for LLM providers |

### External (npm)

| Package | Version | Purpose |
|---------|---------|---------|
| `kafkajs` | `^2.2` | Redpanda/Kafka client for message bus |
| `drizzle-orm` | `^0.36` | PostgreSQL ORM for schema and queries |
| `@supabase/supabase-js` | `^2.45` | Supabase client for real-time subscriptions |
| `pgvector` | `^0.2` | PostgreSQL vector operations for memory embeddings |
| `zod` | `^3.23` | Runtime schema validation |
| `@trpc/server` | `^11` | tRPC server for API routes |
| `nanoid` | `^5` | ID generation for short, URL-safe identifiers |
| `eventemitter3` | `^5` | Type-safe event emitter for internal events |
| `prom-client` | `^15` | Prometheus metrics for monitoring |
| `p-queue` | `^8` | Promise-based priority queue for task scheduling |
| `p-retry` | `^6` | Retry with exponential backoff |
| `cockatiel` | `^3` | Circuit breaker, bulkhead, timeout policies |
| `lodash-es` | `^4.17` | Utility functions (deep merge, throttle, etc.) |
| `date-fns` | `^3` | Date manipulation for deadlines and TTLs |

---

## Testing Notes

### Unit Tests

Unit tests cover individual services in isolation with mocked dependencies.

```typescript
// Example: ConsensusEngine unit test
describe('ConsensusEngine', () => {
  describe('majority strategy', () => {
    it('should resolve when majority agrees', async () => {
      const engine = new ConsensusEngine(mockCtx);
      const round = await engine.initiateRound({
        swarmId: 'swarm-1',
        prompt: 'Which framework?',
        options: [
          { id: 'react', label: 'React' },
          { id: 'vue', label: 'Vue' },
          { id: 'svelte', label: 'Svelte' },
        ],
        strategy: 'majority',
        quorum: 3,
        deadlineMs: 60_000,
        blindVoting: true,
      });

      await engine.submitVote(round.id, {
        agentSlotId: 'agent-1',
        choice: 'react',
        confidence: 0.9,
        reasoning: 'Largest ecosystem and community support',
      });

      await engine.submitVote(round.id, {
        agentSlotId: 'agent-2',
        choice: 'react',
        confidence: 0.7,
        reasoning: 'Best TypeScript support',
      });

      await engine.submitVote(round.id, {
        agentSlotId: 'agent-3',
        choice: 'svelte',
        confidence: 0.8,
        reasoning: 'Best performance and DX',
      });

      const outcome = await engine.resolve(round.id);

      expect(outcome.winner).toBe('react');
      expect(outcome.agreementLevel).toBeCloseTo(0.67, 1);
      expect(outcome.tally).toEqual({ react: 2, svelte: 1 });
      expect(outcome.dissents).toHaveLength(1);
      expect(outcome.dissents[0].choice).toBe('svelte');
    });

    it('should handle tie with tieBreaker', async () => {
      // ... test tie-breaking logic
    });

    it('should fail when quorum not reached', async () => {
      // ... test quorum failure
    });
  });

  describe('weighted-majority strategy', () => {
    it('should apply weights to votes', async () => {
      // ... test weighted voting
    });
  });

  describe('borda-count strategy', () => {
    it('should correctly compute Borda scores', async () => {
      // ... test Borda count
    });
  });
});
```

### Integration Tests

Integration tests verify the full lifecycle with real database and Kafka connections.

```typescript
describe('Swarm Integration', () => {
  let swarmService: SwarmService;

  beforeAll(async () => {
    await setupTestDatabase();
    await setupTestKafka();
    swarmService = new SwarmService(testCtx);
  });

  afterAll(async () => {
    await teardownTestDatabase();
    await teardownTestKafka();
  });

  it('should create, start, execute tasks, and complete a swarm', async () => {
    // Create swarm
    const swarm = await swarmService.create(testSwarmConfig);
    expect(swarm.status).toBe('created');

    // Start swarm
    const state = await swarmService.start(swarm.id);
    expect(state.status).toBe('running');
    expect(state.activeAgents).toBe(testSwarmConfig.slots.length);

    // Submit tasks
    const tasks = await swarmService.submitBatch(swarm.id, testTasks);
    expect(tasks).toHaveLength(testTasks.length);

    // Wait for completion
    await swarmService.awaitCompletion(swarm.id, { timeoutMs: 60_000 });

    // Verify state
    const finalState = await swarmService.getState(swarm.id);
    expect(finalState.status).toBe('completed');
    expect(finalState.taskCounts.completed).toBe(testTasks.length);
    expect(finalState.taskCounts.failed).toBe(0);
  });

  it('should handle agent failure and failover', async () => {
    // ... test fault tolerance
  });

  it('should enforce resource budgets', async () => {
    // ... test budget exhaustion
  });

  it('should maintain RLS isolation between ventures', async () => {
    // Create swarm in venture A
    const swarmA = await swarmServiceA.create(configA);

    // Attempt to access from venture B context — should not find it
    const result = await swarmServiceB.get(swarmA.id);
    expect(result).toBeNull();
  });
});
```

### Load Tests

Load tests validate swarm behavior under stress conditions.

```typescript
describe('Swarm Load Tests', () => {
  it('should handle 100 concurrent tasks across 10 agents', async () => {
    const swarm = await createLargeSwarm({ agentCount: 10 });
    const tasks = generateTasks(100);

    const start = Date.now();
    await swarmService.submitBatch(swarm.id, tasks);
    await swarmService.awaitCompletion(swarm.id, { timeoutMs: 300_000 });
    const duration = Date.now() - start;

    const metrics = await swarmService.getMetrics(swarm.id);
    expect(metrics.taskCounts.completed).toBe(100);
    expect(metrics.resourceUsage.compute.avgLatencyMs).toBeLessThan(5000);
    console.log(`100 tasks across 10 agents completed in ${duration}ms`);
  });

  it('should maintain throughput with agent churn', async () => {
    // ... test with agents failing and being replaced during execution
  });

  it('should handle message bus backpressure', async () => {
    // ... test with high message volume
  });
});
```

### Test Utilities

```typescript
// Shared test helpers
export function createTestSwarmConfig(overrides?: Partial<SwarmConfig>): SwarmConfig;
export function createTestAgentSlot(overrides?: Partial<AgentSlotConfig>): AgentSlotConfig;
export function createTestTask(overrides?: Partial<SwarmTaskInput>): SwarmTaskInput;
export function createMockMessageBus(): MockMessageBus;
export function createMockConsensusEngine(): MockConsensusEngine;
export function setupTestDatabase(): Promise<void>;
export function teardownTestDatabase(): Promise<void>;
export function setupTestKafka(): Promise<void>;
export function teardownTestKafka(): Promise<void>;
export function waitForSwarmStatus(swarmId: string, status: SwarmStatus, timeoutMs?: number): Promise<void>;
export function generateTasks(count: number): SwarmTaskInput[];
```

### Running Tests

```bash
# Unit tests
pnpm test --filter=@mcv/agentic-os -- --testPathPattern=swarm

# Integration tests (requires database and Kafka)
pnpm test:integration --filter=@mcv/agentic-os -- --testPathPattern=swarm

# Load tests (requires full infrastructure)
pnpm test:load --filter=@mcv/agentic-os -- --testPathPattern=swarm

# Coverage
pnpm test:coverage --filter=@mcv/agentic-os -- --testPathPattern=swarm
```

---

## Kafka Topic Naming

Swarm uses the following Kafka topic naming convention:

```
{prefix}.{venture_id}.{swarm_id}.{channel}

Examples:
  swarm.v_abc123.s_def456.tasks          — Task assignments and results
  swarm.v_abc123.s_def456.messages        — Inter-agent messages
  swarm.v_abc123.s_def456.consensus       — Consensus voting messages
  swarm.v_abc123.s_def456.health          — Health checks and heartbeats
  swarm.v_abc123.s_def456.memory          — Memory sync events
  swarm.v_abc123.s_def456.events          — General swarm events
  swarm.v_abc123.dead-letter              — Dead letter queue (venture-wide)
```

Consumer groups follow a similar pattern:

```
{prefix}-cg.{venture_id}.{swarm_id}.{agent_slot_id}

Examples:
  swarm-cg.v_abc123.s_def456.slot_789     — Per-agent consumer group
  swarm-cg.v_abc123.s_def456.orchestrator  — Swarm orchestrator consumer
  swarm-cg.v_abc123.s_def456.monitor       — Health monitor consumer
```

### Topic Lifecycle

Topics are created when a swarm is provisioned and deleted (after retention period) when a swarm is completed or cancelled. The `MessageBus` service manages topic lifecycle automatically:

```typescript
// Topics created on swarm.start()
await messageBus.createTopics(swarmId, [
  'tasks', 'messages', 'consensus', 'health', 'memory', 'events'
]);

// Topics deleted after retention period on swarm.complete()
await messageBus.scheduleTopicDeletion(swarmId, {
  retentionMs: SWARM_MESSAGE_RETENTION_HOURS * 60 * 60 * 1000,
});
```

---

## Glossary

| Term | Definition |
|------|------------|
| **Swarm** | A coordinated group of agents working toward a shared goal |
| **Agent Slot** | A reserved position in a swarm for a specific agent configuration |
| **Scout** | A worker agent from `@mcv/agentic-os/scouts` that fills an agent slot |
| **Queen** | The orchestrator from `@mcv/agentic-os/queen` that creates and manages swarms |
| **Consensus Round** | A structured decision-making process where agents vote on an outcome |
| **Blackboard** | A shared data structure where agents read/write coordination signals |
| **Circuit Breaker** | A fault tolerance pattern that stops sending requests to a failing agent |
| **Dead Letter Queue** | Storage for tasks that have exhausted all retry attempts |
| **Checkpoint** | A snapshot of swarm state for recovery purposes |
| **Topology** | The communication structure between agents (star, mesh, ring, etc.) |
| **Quorum** | The minimum number of votes required for a consensus decision |

---

*Last updated: 2026-02-08*
*Module maintainer: MCV Platform Team*