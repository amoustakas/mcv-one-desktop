# @mcv/agentic-os — Agentic Operating System

**Parent Package:** @mcv/agentic-os  
**Tier:** 5 (Domain Layer — MCV-Only)  
**Classification:** MCV-ONLY (internal use; white-label Q3 2026, SaaS 2027)  
**Version:** 1.0.0  
**Last Updated:** February 9, 2026

---

## Purpose

The `agentic-os` module is the cognitive operating system of the MCV.ONE platform. It implements a hierarchical, multi-agent intelligence architecture that orchestrates AI operations across all nine consortium ventures. At its core, the system decomposes high-level human intents into atomic, verifiable tasks; delegates those tasks to specialized worker agents; maintains persistent memory and learning across interactions; enforces human-in-the-loop approval gates for high-risk operations; and continuously monitors system health through autonomous scout agents.

**This is the brain of MCV.ONE — where strategic decisions are planned, tasks are decomposed and delegated, human oversight is maintained, and institutional knowledge accumulates.**

The Agentic OS follows a three-tier hierarchy inspired by biological intelligence:

1. **Queen** (Level 3) — The strategic orchestrator. She receives requests, decomposes them into subtask graphs, assesses risk, routes HITL approvals, and delegates execution. She never executes work directly.
2. **Ralph Swarm** (Level 2) — Specialized execution pods (Smith/Engineer, Growth/Marketer, Director/Operator, Ledger/Finance, Scribe/Content, Oracle/Analytics, Herald/Communications, Shield/Security). Each pod carries domain-specific instruments and system prompts.
3. **Scouts** (Level 1) — Autonomous watchers that observe, collect data, detect anomalies, and report. They never take action — only observe and alert.

Supporting these three levels are five foundational subsystems:

- **NAOS** — The Natural Agent Operating System runtime: agent lifecycle, registry, instrument management, capability enforcement, and execution context.
- **Memory** — The Neural Hive-Mind: episodic memory, semantic knowledge graphs, procedural know-how, working context, Deep RAG retrieval, and consolidation.
- **Reasoning** — The Agentic Kernel: Recursive Language Modeling (RLM), chain-of-thought, tree-of-thought, self-consistency, SPARC methodology, truth verification, and the Genesis Engine.
- **Prompts** — Prompt template management, versioning, A/B testing, chain orchestration, and the instrument bank.
- **HITL** — Human-in-the-loop approval workflows, multi-step escalation, quorum voting, timeout handling, and audit trails.

Together, these eight submodules form a complete cognitive architecture that can plan, reason, execute, learn, and self-correct — all under human supervision.

---

## Exports

```typescript
// ═══════════════════════════════════════════════════════════════════════════════
// NAOS — Natural Agent Operating System Framework
// ═══════════════════════════════════════════════════════════════════════════════

// Core agent classes
export {
  NAOSAgent,                         // Base agent class for all NAOS agents
  AgentRegistry,                     // Agent lifecycle management and discovery
  Instrument,                        // Executable tool wrapper with safety controls
} from './naos';

export type {
  AgentConfig,                       // Full agent configuration
  AgentCapability,                   // read | write | execute | approve | delegate | external | financial
  AgentConstraints,                  // Operational constraints (tokens, cost, timeout)
  AgentRequest,                      // Incoming request to an agent
  AgentResponse,                     // Agent response with reasoning trace
  AgentMetrics,                      // Performance and usage metrics
  AgentRegistration,                 // Registry entry with status
  InstrumentDefinition,              // Tool definition schema
  InstrumentConfig,                  // Instrument configuration
  ExecutionContext,                   // Runtime execution context
  ModelConfig,                       // LLM model configuration
  MemoryConfig,                      // Memory subsystem configuration
  HITLTrigger,                       // Conditions requiring human approval
} from './naos';

// Built-in instruments
export {
  builtInInstruments,                // Pre-configured system instruments
} from './naos/instruments';

// Schema exports
export {
  naosAgents,                        // Agent definitions table
  naosAgentMetrics,                  // Agent metrics table
  naosInstruments,                   // Instrument definitions table
  naosAgentTypeEnum,                 // Agent type enum
  naosAgentStatusEnum,               // Agent status enum
  naosCapabilityEnum,                // Capability enum
} from './naos/schema';

// ═══════════════════════════════════════════════════════════════════════════════
// QUEEN — Strategic Orchestrator
// ═══════════════════════════════════════════════════════════════════════════════

export {
  Queen,                             // Strategic orchestrator agent
  TaskPlanner,                       // Request → task graph decomposition
  ResourceAllocator,                 // Task → pod assignment and resource planning
} from './queen';

export type {
  QueenConfig,                       // Queen-specific configuration
  StrategicRequest,                  // High-level request input
  StrategicResponse,                 // Aggregated execution response
  RequestAnalysis,                   // Intent analysis output
  Task,                              // Atomic executable task
  TaskType,                          // development | marketing | operations | finance | content | analytics | communications | security
  RalphPodType,                      // smith | growth | director | ledger | scribe | oracle | herald | shield
  ResourcePlan,                      // Execution plan with assignments
  TaskAssignment,                    // Task-to-pod assignment
  ParallelGroup,                     // Parallelizable task group
  ResourceRequirements,              // Token, tool, timeout, model tier
  RiskAssessment,                    // Risk level and approver requirements
  Risk,                              // Individual risk item
  RiskLevel,                         // low | medium | high | critical
  ApproverConfig,                    // Approver role and count
} from './queen';

// ═══════════════════════════════════════════════════════════════════════════════
// SCOUTS — Autonomous Monitoring Network
// ═══════════════════════════════════════════════════════════════════════════════

export {
  ScoutNetwork,                      // Scout deployment and management
  AnomalyDetector,                   // Time-series anomaly detection
  Monitor,                           // Health check monitoring
} from './scouts';

export type {
  Scout,                             // Scout agent configuration
  ScoutType,                         // health | performance | security | compliance | cost | quality | custom
  ScoutTarget,                       // Monitoring target definition
  ScoutSchedule,                     // Cron / interval / event schedule
  ScoutConfig,                       // Collectors, thresholds, alert rules
  ScoutReport,                       // Scout execution report
  CollectorConfig,                   // Data collection configuration
  ThresholdConfig,                   // Alerting thresholds
  AlertRule,                         // Alert routing rules
  Observation,                       // Collected data point
  Anomaly,                           // Detected anomaly
  AnomalyDetectorConfig,            // Algorithm and sensitivity config
  AnomalyAlgorithm,                 // zscore | iqr | isolation_forest | prophet | lstm
  AnomalyResult,                    // Detection result with scoring
  DataPoint,                         // Time-series data point
  MonitorConfig,                     // Monitor configuration
  MonitorStatus,                     // Current health status
  HealthCheck,                       // Individual health check
  CheckResult,                       // Health check result
} from './scouts';

// Schema exports
export {
  naosScouts,                        // Scout definitions table
  naosScoutObservations,             // Scout observation log table
  naosAlerts,                        // Alert tracking table
  naosScoutTypeEnum,                 // Scout type enum
  naosObservationSeverityEnum,       // Severity enum
  naosAlertStatusEnum,               // Alert status enum
} from './scouts/schema';

// ═══════════════════════════════════════════════════════════════════════════════
// SWARM — Ralph Execution Pods
// ═══════════════════════════════════════════════════════════════════════════════

export {
  RalphPod,                          // Specialized execution agent
  SwarmDispatcher,                   // Task dispatch to pods
  WorkerPool,                        // Scalable worker pool
} from './swarm';

export type {
  RalphPodConfig,                    // Pod-specific configuration
  TaskResult,                        // Task execution result
  ExecutionResult,                   // Dispatch result (completed | failed)
  WorkerPoolConfig,                  // Pool sizing and scaling config
  PoolStatus,                        // Current pool status
  QueuedTask,                        // Task in the queue
} from './swarm';

// Ralph pod specializations (pre-configured)
export {
  RALPH_PODS,                        // Map of all Ralph pod configurations
} from './swarm/ralph';

// Schema exports
export {
  naosTasks,                         // Task definitions and tracking table
  naosTaskEvents,                    // Task event log table
  naosTaskQueues,                    // Queue management table
  naosTrajectories,                  // Execution trajectory table
  naosTaskStatusEnum,                // Task status enum
  naosTaskTypeEnum,                  // Task type enum
  naosPriorityEnum,                  // Priority enum
  naosTaskEventTypeEnum,             // Task event type enum
  naosTrajectoryOutcomeEnum,         // Trajectory outcome enum
} from './swarm/schema';

// ═══════════════════════════════════════════════════════════════════════════════
// HITL — Human-in-the-Loop Approval Workflows
// ═══════════════════════════════════════════════════════════════════════════════

export {
  HITLGateway,                       // Approval request gateway
  HITLQueue,                         // Pending approval queue
  ApprovalWorkflow,                  // Multi-step workflow engine
  EscalationManager,                 // Timeout and conflict escalation
  HITLNotifier,                      // Approver notification dispatcher
} from './hitl';

export type {
  HITLRequest,                       // Approval request
  HITLRequestType,                   // task_approval | financial_approval | data_access | ...
  HITLApproval,                      // Final approval result
  ApprovalDecision,                  // Individual approver decision
  ApprovalWorkflowConfig,           // Workflow definition
  ApprovalStep,                      // Workflow step
  ApprovalCondition,                 // Conditional approval rules
  QuorumConfig,                      // majority | unanimous | threshold
  EscalationConfig,                  // Escalation rules
  EscalationRule,                    // Individual escalation rule
  WorkflowResult,                    // Workflow processing result
  WorkflowState,                     // Current workflow state
  QueueStatus,                       // Approval queue status
} from './hitl';

// Schema exports
export {
  naosHitlRequests,                  // HITL request table
  naosHitlApprovals,                 // Individual approval decisions table
  naosHitlEscalationRules,          // Escalation rule table
  naosHitlRequestTypeEnum,          // Request type enum
  naosHitlStatusEnum,               // HITL status enum
  naosRiskLevelEnum,                // Risk level enum
  naosApprovalDecisionEnum,         // Decision enum
} from './hitl/schema';

// ═══════════════════════════════════════════════════════════════════════════════
// PROMPTS — Prompt Engineering Infrastructure
// ═══════════════════════════════════════════════════════════════════════════════

export {
  PromptBank,                        // Template management and rendering
  PromptChainExecutor,               // Multi-step prompt chain execution
} from './prompts';

export type {
  PromptTemplate,                    // Template definition
  PromptCategory,                    // system | task | reasoning | formatting | safety | persona | tool_use
  PromptVariable,                    // Template variable definition
  PromptExample,                     // Input/output example pair
  PromptChain,                       // Multi-step chain definition
  ChainStep,                         // Individual chain step
  InputMapping,                      // Step input mapping
  StepCondition,                     // Conditional step execution
  ChainResult,                       // Chain execution result
  RenderOptions,                     // Template render options
  PromptSearchQuery,                 // Search/filter query
} from './prompts';

// Core system prompts (pre-configured)
export {
  CORE_PROMPTS,                      // Queen, Ralph, Scout system prompts
} from './prompts/bank';

// Schema exports
export {
  naosPrompts,                       // Prompt template table
  naosPromptChains,                  // Prompt chain table
  naosPromptStatusEnum,              // Prompt status enum
} from './prompts/schema';

// ═══════════════════════════════════════════════════════════════════════════════
// MEMORY — Neural Hive-Mind
// ═══════════════════════════════════════════════════════════════════════════════

export {
  MemoryStore,                       // Unified memory storage and retrieval
  EpisodicMemory,                    // Experience-based memory
  SemanticMemory,                    // Fact and knowledge memory
  DeepRAGProcessor,                  // Recursive retrieval-augmented generation
} from './memory';

export type {
  MemoryEntry,                       // Memory entry record
  MemoryType,                        // episodic | semantic | procedural | working
  MemoryQuery,                       // Memory retrieval query
  ForgetCriteria,                    // Memory deletion criteria
  Episode,                           // Complete episode record
  EpisodeType,                       // task_execution | user_interaction | error_recovery | learning_moment
  EpisodeEvent,                      // Event within an episode
  EpisodeOutcome,                    // Episode result
  SemanticFact,                      // Subject-predicate-object triple
  DeepRAGResult,                     // Recursive retrieval result
  KnowledgeGap,                      // Identified knowledge gap
  PersonaConfig,                     // Venture-specific persona tuning
  MemoryImportance,                  // 1-10 importance scale
} from './memory';

// Schema exports
export {
  naosMemoryEntries,                 // Memory entries table (with vector embedding)
  episodicMemories,                  // Raw episodic trace table
  semanticChunks,                    // Processed semantic chunks table
  memoryConsolidation,               // Consolidation tracking table
  naosMemoryTypeEnum,                // Memory type enum
  naosMemoryStatusEnum,              // Memory status enum
} from './memory/schema';

// ═══════════════════════════════════════════════════════════════════════════════
// REASONING — Agentic Kernel
// ═══════════════════════════════════════════════════════════════════════════════

export {
  ReasoningEngine,                   // Multi-strategy reasoning engine
  ChainOfThought,                    // Step-by-step reasoning
  AgenticKernel,                     // Recursive Language Model (RLM) kernel
  GenesisEngine,                     // Intent-to-execution blueprint generator
} from './reasoning';

export type {
  ReasoningStrategy,                 // chain-of-thought | tree-of-thought | self-consistency | decomposition | analogical | counterfactual
  ReasoningConfig,                   // Strategy configuration
  ReasoningResult,                   // Reasoning output with confidence
  ReasoningStep,                     // Individual reasoning step
  ReasoningPath,                     // Alternative reasoning path
  ThoughtNode,                       // Tree-of-thought node
  ThoughtStep,                       // Chain-of-thought step
  EvaluationCriterion,              // Scoring criteria
  ReasoningContext,                  // Problem context
  TaskDecomposition,                 // Decomposed task graph
  VerificationResult,                // Truth verification output
  ConfidenceScore,                   // 0.0 to 1.0 confidence
  RalphBlueprint,                    // Genesis Engine output
} from './reasoning';

// ═══════════════════════════════════════════════════════════════════════════════
// CLIENT HOOKS (React)
// ═══════════════════════════════════════════════════════════════════════════════

export { useAgentRegistry } from './client/hooks/use-agent-registry';
export { useTaskTracker } from './client/hooks/use-task-tracker';
export { useHITLQueue } from './client/hooks/use-hitl-queue';
export { useApprovalWorkflow } from './client/hooks/use-approval-workflow';
export { useScoutDashboard } from './client/hooks/use-scout-dashboard';
export { useAgentMemory } from './client/hooks/use-agent-memory';
export { usePromptBank } from './client/hooks/use-prompt-bank';
export { useSwarmStatus } from './client/hooks/use-swarm-status';
export { useReasoningTrace } from './client/hooks/use-reasoning-trace';
export { useAlerts } from './client/hooks/use-alerts';

// ═══════════════════════════════════════════════════════════════════════════════
// CLIENT COMPONENTS (React)
// ═══════════════════════════════════════════════════════════════════════════════

export { AgentRegistryPanel } from './client/components/agent-registry-panel';
export { TaskGraphVisualizer } from './client/components/task-graph-visualizer';
export { HITLApprovalInbox } from './client/components/hitl-approval-inbox';
export { ApprovalWorkflowEditor } from './client/components/approval-workflow-editor';
export { SwarmDashboard } from './client/components/swarm-dashboard';
export { ScoutMonitorGrid } from './client/components/scout-monitor-grid';
export { MemoryExplorer } from './client/components/memory-explorer';
export { PromptTemplateEditor } from './client/components/prompt-template-editor';
export { ReasoningTraceViewer } from './client/components/reasoning-trace-viewer';
export { AlertTimeline } from './client/components/alert-timeline';
export { CostTracker } from './client/components/cost-tracker';
export { AgentConversation } from './client/components/agent-conversation';

// ═══════════════════════════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════════════════════════

export {
  AGENT_TYPES,
  AGENT_CAPABILITIES,
  TASK_TYPES,
  RALPH_POD_TYPES,
  RISK_LEVELS,
  MEMORY_TYPES,
  REASONING_STRATEGIES,
  SCOUT_TYPES,
  HITL_REQUEST_TYPES,
  APPROVAL_DECISIONS,
  PROMPT_CATEGORIES,
  DEFAULT_AGENT_CONSTRAINTS,
  HIGH_RISK_INSTRUMENTS,
  COST_THRESHOLD_USD,
} from './constants';

// ═══════════════════════════════════════════════════════════════════════════════
// TYPES (aggregate re-exports)
// ═══════════════════════════════════════════════════════════════════════════════

export type {
  // Shared types
  VentureID,
  UserID,
  Timestamp,
  Duration,
  Priority,

  // Error types
  AgentError,
  TaskExecutionError,
  HITLTimeoutError,
  MemoryError,
  ReasoningError,
  ScoutError,
  PlanningError,
  AllocationError,
  WorkflowError,
  ChainExecutionError,
  ContradictionError,
  AnomalyError,
  RateLimitError,
} from './types';
```

---

## Architecture

```
┌──────────────────────────────────────────────────────────────────────────────────────────────────┐
│                         @mcv/agentic-os — AGENTIC OPERATING SYSTEM ARCHITECTURE                  │
│                                                                                                   │
│  ┌────────────────────────────────────────────────────────────────────────────────────────────┐   │
│  │                                  ENTRY POINTS                                               │   │
│  │                                                                                             │   │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐ │   │
│  │  │  API Routes  │  │  Cron Jobs   │  │ Event Bus    │  │ Webhooks     │  │ Dashboard UI │ │   │
│  │  │ /api/agents  │  │  Scout runs  │  │ @mcv/fabric  │  │ External     │  │ Operator     │ │   │
│  │  │ /api/tasks   │  │  Consolidate │  │ Redpanda     │  │ Callbacks    │  │ Console      │ │   │
│  │  │ /api/hitl    │  │  Cleanup     │  │              │  │              │  │              │ │   │
│  │  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘ │   │
│  │         └─────────────────┴──────────────────┴─────────────────┴──────────────────┘         │   │
│  │                                           │                                                  │   │
│  └───────────────────────────────────────────┼──────────────────────────────────────────────────┘   │
│                                              │                                                      │
│  ┌───────────────────────────────────────────▼──────────────────────────────────────────────────┐   │
│  │                                    QUEEN (Level 3)                                            │   │
│  │                              Strategic Orchestrator                                            │   │
│  │                                                                                               │   │
│  │  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐         │   │
│  │  │  Task Planner   │  │  Resource       │  │  Risk Assessor  │  │  Result          │         │   │
│  │  │  Decompose      │  │  Allocator      │  │  HITL Router    │  │  Aggregator      │         │   │
│  │  │  requests into  │  │  Assign pods    │  │  Flag high-risk │  │  Combine outputs │         │   │
│  │  │  task graphs    │  │  and resources  │  │  operations     │  │  into response   │         │   │
│  │  └─────────────────┘  └─────────────────┘  └────────┬────────┘  └─────────────────┘         │   │
│  │                                                      │                                        │   │
│  └──────────────────────────────────────────────────────┼────────────────────────────────────────┘   │
│                                                         │                                            │
│                              ┌───────────────── HITL Gate ──────────────────┐                        │
│                              │                                               │                        │
│  ┌───────────────────────────▼───────────────────────────────────────────────▼──────────────────┐   │
│  │                              HITL SUBSYSTEM                                                    │   │
│  │                                                                                               │   │
│  │  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐         │   │
│  │  │  HITL Gateway   │  │  Approval Queue │  │  Workflow Engine│  │  Escalation Mgr │         │   │
│  │  │  Request intake │  │  Redis + PG     │  │  Multi-step     │  │  Timeout/reject │         │   │
│  │  │  and routing    │  │  sorted set     │  │  quorum voting  │  │  auto-escalate  │         │   │
│  │  └─────────────────┘  └─────────────────┘  └─────────────────┘  └─────────────────┘         │   │
│  │                                                                                               │   │
│  └──────────────────────────────────────────────┬────────────────────────────────────────────────┘   │
│                                                  │ approved                                          │
│  ┌───────────────────────────────────────────────▼──────────────────────────────────────────────┐   │
│  │                              RALPH SWARM (Level 2)                                            │   │
│  │                            Specialized Execution Pods                                          │   │
│  │                                                                                               │   │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐             │   │
│  │  │  SMITH   │ │  GROWTH  │ │ DIRECTOR │ │  LEDGER  │ │  SCRIBE  │ │  ORACLE  │             │   │
│  │  │ Engineer │ │ Marketer │ │ Operator │ │ Finance  │ │ Content  │ │ Analyst  │             │   │
│  │  │ code,git │ │ campaign │ │ workflow │ │ invoice  │ │ write,   │ │ data,    │             │   │
│  │  │ deploy   │ │ social   │ │ calendar │ │ budget   │ │ edit     │ │ insight  │             │   │
│  │  └──────────┘ └──────────┘ └──────────┘ └──────────┘ └──────────┘ └──────────┘             │   │
│  │  ┌──────────┐ ┌──────────┐                                                                  │   │
│  │  │  HERALD  │ │  SHIELD  │     ┌───────────────────────────────┐                            │   │
│  │  │ Comms    │ │ Security │     │  Worker Pool                  │                            │   │
│  │  │ email,   │ │ audit,   │     │  Dynamic scaling, load        │                            │   │
│  │  │ notify   │ │ threat   │     │  balancing, priority queues   │                            │   │
│  │  └──────────┘ └──────────┘     └───────────────────────────────┘                            │   │
│  │                                                                                               │   │
│  └──────────────────────────────────────────────┬────────────────────────────────────────────────┘   │
│                                                  │                                                    │
│  ┌───────────────────────────────────────────────▼──────────────────────────────────────────────┐   │
│  │                              FOUNDATIONAL SUBSYSTEMS                                          │   │
│  │                                                                                               │   │
│  │  ┌─────────────────────┐  ┌─────────────────────┐  ┌─────────────────────┐                  │   │
│  │  │       NAOS          │  │       MEMORY         │  │     REASONING       │                  │   │
│  │  │  Agent Runtime      │  │  Neural Hive-Mind    │  │  Agentic Kernel     │                  │   │
│  │  │                     │  │                      │  │                     │                  │   │
│  │  │ • Agent lifecycle   │  │ • Episodic store     │  │ • Recursive LM      │                  │   │
│  │  │ • Registry          │  │ • Semantic chunks    │  │ • SPARC pipeline    │                  │   │
│  │  │ • Instruments       │  │ • Knowledge graph    │  │ • Truth verify      │                  │   │
│  │  │ • Capability gates  │  │ • Deep RAG           │  │ • Genesis engine    │                  │   │
│  │  │ • Execution context │  │ • Working memory     │  │ • Chain-of-thought  │                  │   │
│  │  │ • Trajectory log    │  │ • Consolidation      │  │ • Tree-of-thought   │                  │   │
│  │  └─────────────────────┘  └─────────────────────┘  └─────────────────────┘                  │   │
│  │                                                                                               │   │
│  │  ┌─────────────────────┐  ┌─────────────────────────────────────────────┐                   │   │
│  │  │      PROMPTS        │  │              SCOUTS (Level 1)               │                   │   │
│  │  │  Prompt Bank        │  │         Autonomous Watchers                 │                   │   │
│  │  │                     │  │                                             │                   │   │
│  │  │ • Template registry │  │ • System health      • Security scanning   │                   │   │
│  │  │ • Versioning        │  │ • Performance metrics • Compliance checks  │                   │   │
│  │  │ • A/B testing       │  │ • Anomaly detection   • Cost monitoring    │                   │   │
│  │  │ • Chain executor    │  │ • Alert management    • Data collection    │                   │   │
│  │  │ • Rendering engine  │  │                                             │                   │   │
│  │  └─────────────────────┘  └─────────────────────────────────────────────┘                   │   │
│  │                                                                                               │   │
│  └───────────────────────────────────────────────────────────────────────────────────────────────┘   │
│                                                                                                      │
│  ┌───────────────────────────────────────────────────────────────────────────────────────────────┐   │
│  │                            DATABASE LAYER (PostgreSQL + pgvector + Redis)                      │   │
│  │                                                                                               │   │
│  │  ┌───────────┐ ┌───────────┐ ┌───────────┐ ┌───────────┐ ┌───────────┐ ┌───────────┐       │   │
│  │  │  Agents   │ │  Tasks    │ │   HITL    │ │  Memory   │ │  Prompts  │ │  Scouts   │       │   │
│  │  │  2 tables │ │  4 tables │ │  3 tables │ │  3 tables │ │  2 tables │ │  3 tables │       │   │
│  │  └───────────┘ └───────────┘ └───────────┘ └───────────┘ └───────────┘ └───────────┘       │   │
│  │                                                                                               │   │
│  │  Trajectories:  naos_trajectories  (execution traces + reward signals for learning)           │   │
│  │  Knowledge Graph:  Neo4j  (entity-relationship for semantic memory)                           │   │
│  │  Vector Store:  pgvector / Pinecone  (embedding-based retrieval)                              │   │
│  │  Working Memory:  Redis  (session state + HITL queue sorted sets)                             │   │
│  │                                                                                               │   │
│  └───────────────────────────────────────────────────────────────────────────────────────────────┘   │
│                                                                                                      │
│  ┌───────────────────────────────────────────────────────────────────────────────────────────────┐   │
│  │                            EXTERNAL DEPENDENCIES                                              │   │
│  │                                                                                               │   │
│  │  @mcv/intelligence     @mcv/fabric           @mcv/identity          @mcv/kernel              │   │
│  │  (Gateway, RAG,        (Events, Queues,      (Auth, Permissions,    (DB, Context,            │   │
│  │   ML, Embeddings)       Realtime, Kafka)      RBAC, Policies)       Errors, Logging)         │   │
│  │                                                                                               │   │
│  │  OpenRouter            Neo4j                 Pinecone / pgvector    Redis / BullMQ            │   │
│  │  (400+ LLM models,    (Knowledge Graph,     (Vector storage,       (Working memory,          │   │
│  │   inference routing)    entity relations)     semantic search)       task queues)             │   │
│  │                                                                                               │   │
│  │  E2B Sandbox           Redpanda / Kafka      Supabase               Solana / EDGE             │   │
│  │  (Code execution,     (Event streaming,     (PostgreSQL,           (Token-gated              │   │
│  │   verification)        agent events)          storage, auth)         agent access)            │   │
│  │                                                                                               │   │
│  └───────────────────────────────────────────────────────────────────────────────────────────────┘   │
│                                                                                                      │
└──────────────────────────────────────────────────────────────────────────────────────────────────────┘
```

### Data Flow: User Request → Agent Execution → Result

```
User Request Arrives
        │
        ▼
┌───────────────┐     ┌───────────────┐     ┌───────────────┐
│ Queen          │────▶│ Task Planner  │────▶│ Risk Assessor │
│                │     │               │     │               │
│ Receive intent │     │ Decompose to  │     │ Evaluate risk │
│ Load context   │     │ task graph    │     │ Flag HITL     │
└────────────────┘     └───────────────┘     └───────┬───────┘
                                                      │
                                        ┌─────────────┴─────────────┐
                                        │ Low Risk                  │ High Risk
                                        ▼                           ▼
                              ┌───────────────┐          ┌───────────────┐
                              │ Resource      │          │ HITL Gateway  │
                              │ Allocator     │          │               │
                              │ Assign pods   │          │ Queue request │
                              │ Set resources │          │ Notify humans │
                              └───────┬───────┘          │ Wait/escalate│
                                      │                  └───────┬───────┘
                                      │                          │ approved
                                      ├──────────────────────────┘
                                      ▼
                              ┌───────────────┐     ┌───────────────┐
                              │ Swarm         │────▶│ Ralph Pod     │
                              │ Dispatcher    │     │               │
                              │ Route to pods │     │ Load prompts  │
                              │ Parallel exec │     │ Use instruments│
                              └───────────────┘     │ Execute task  │
                                                    └───────┬───────┘
                                                            │
                              ┌──────────────────────────────┤
                              ▼                              ▼
                    ┌───────────────┐              ┌───────────────┐
                    │ Memory Store  │              │ Trajectory    │
                    │               │              │ Log           │
                    │ Store episode │              │ Record steps  │
                    │ Extract facts │              │ Compute reward│
                    │ Update graph  │              │ Flag exemplars│
                    └───────────────┘              └───────────────┘
                                                            │
                                                            ▼
                                                  ┌───────────────┐
                                                  │ Queen          │
                                                  │ Aggregator     │
                                                  │                │
                                                  │ Combine results│
                                                  │ Build response │
                                                  └───────────────┘
```

---

## Sub-Module Overview

| Module | Purpose | Tables | Key Operations |
|--------|---------|--------|----------------|
| **naos** | Agent runtime framework, registry, instruments, capability enforcement | 3 | register agent, process request, use instrument, update status |
| **queen** | Strategic orchestrator, task decomposition, resource allocation, risk assessment | 0 (uses naos_tasks) | handle request, decompose, allocate, dispatch |
| **swarm** | Ralph execution pods, worker pool, parallel dispatch, trajectory logging | 4 | execute task, dispatch, submit to pool, record trajectory |
| **scouts** | Autonomous monitoring, anomaly detection, health checks, alerting | 3 | deploy scout, run scout, detect anomaly, send alert |
| **hitl** | Human approval workflows, escalation, quorum voting, queue management | 3 | request approval, record decision, escalate, process workflow |
| **prompts** | Prompt templates, versioning, chains, rendering, A/B testing | 2 | register template, render, search, execute chain |
| **memory** | Episodic/semantic/procedural/working memory, Deep RAG, knowledge graph | 3 | store, retrieve, consolidate, forget, Deep RAG query |
| **reasoning** | Chain-of-thought, tree-of-thought, self-consistency, SPARC, truth verification | 0 (uses memory + trajectories) | reason, decompose, verify, generate blueprint |

---

## Module: naos

### Purpose

The NAOS (Natural Agent Operating System) module is the foundational runtime environment for all AI agents within the MCV.ONE ecosystem. It provides the agent lifecycle management, capability-based access control, instrument (tool) execution framework, execution context propagation, and metrics collection that every other module builds upon.

Think of NAOS as the kernel of the Agentic OS — it provides the primitives (process model, IPC, syscalls, permissions) that higher-level components like Queen, Swarm, and Scouts use to operate.

### Database Schema

```typescript
// naos_agents — Agent Definitions and Configuration
export const naosAgents = pgTable('naos_agents', {
  id: uuid('id').primaryKey().defaultRandom(),
  ventureId: uuid('venture_id').notNull().references(() => ventures.id),

  // Identity
  name: varchar('name', { length: 100 }).notNull(),
  slug: varchar('slug', { length: 100 }).notNull(),
  type: naosAgentTypeEnum('type').notNull(),              // queen | ralph | scout | specialist
  description: text('description'),

  // Configuration
  capabilities: sql`naos_capability[]`.notNull().default('{}'),
  modelConfig: jsonb('model_config').notNull().default('{}'),
  /*
    modelConfig: {
      defaultModel: "claude-sonnet-4",
      tier: "standard",
      maxTokensPerTurn: 4000,
      maxToolCalls: 10,
      temperature: 0.7
    }
  */

  // Instruments (tools this agent can use)
  instruments: sql`text[]`.notNull().default('{}'),

  // Constraints
  constraints: jsonb('constraints').notNull().default('{}'),
  /*
    constraints: {
      maxTokensPerTurn: 8000,
      maxToolCalls: 20,
      timeoutMs: 300000,
      costBudgetUSD: 10.0,
      requiresHITL: ["financial_transfer", "external_communication"],
      forbiddenActions: ["delete_user", "modify_billing"]
    }
  */

  // Memory configuration
  memoryConfig: jsonb('memory_config').default('{}'),

  // System prompt
  systemPrompt: text('system_prompt'),

  // Status
  status: naosAgentStatusEnum('status').default('active'), // active | paused | maintenance | retired

  // Metadata
  metadata: jsonb('metadata').default('{}'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
}, (table) => ({
  ventureSlugUnique: unique().on(table.ventureId, table.slug),
}));

// naos_agent_metrics — Performance and Usage Tracking
export const naosAgentMetrics = pgTable('naos_agent_metrics', {
  id: uuid('id').primaryKey().defaultRandom(),
  agentId: uuid('agent_id').notNull().references(() => naosAgents.id, { onDelete: 'cascade' }),

  // Time period
  periodStart: timestamp('period_start', { withTimezone: true }).notNull(),
  periodEnd: timestamp('period_end', { withTimezone: true }).notNull(),
  periodType: varchar('period_type', { length: 10 }).notNull(), // hour | day | week | month

  // Request metrics
  totalRequests: integer('total_requests').default(0),
  successfulRequests: integer('successful_requests').default(0),
  failedRequests: integer('failed_requests').default(0),
  avgLatencyMs: integer('avg_latency_ms'),
  p95LatencyMs: integer('p95_latency_ms'),

  // Token and cost metrics
  totalTokensUsed: bigint('total_tokens_used', { mode: 'number' }).default(0),
  totalCostUsd: numeric('total_cost_usd', { precision: 10, scale: 4 }).default('0'),

  // HITL metrics
  hitlRequests: integer('hitl_requests').default(0),
  hitlApprovals: integer('hitl_approvals').default(0),
  hitlRejections: integer('hitl_rejections').default(0),

  // Tool usage
  toolCalls: integer('tool_calls').default(0),
  toolCallBreakdown: jsonb('tool_call_breakdown').default('{}'),

  // Quality metrics
  avgTaskCompletionRate: numeric('avg_task_completion_rate', { precision: 5, scale: 4 }),
  avgUserSatisfaction: numeric('avg_user_satisfaction', { precision: 3, scale: 2 }),

  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
}, (table) => ({
  agentPeriodUnique: unique().on(table.agentId, table.periodType, table.periodStart),
}));

// naos_instruments — Tool Definitions for Agents
export const naosInstruments = pgTable('naos_instruments', {
  id: uuid('id').primaryKey().defaultRandom(),
  ventureId: uuid('venture_id').references(() => ventures.id), // null = system-wide

  // Identity
  name: varchar('name', { length: 100 }).notNull(),
  slug: varchar('slug', { length: 100 }).notNull(),
  description: text('description').notNull(),

  // Capability requirement
  requiredCapability: naosCapabilityEnum('required_capability').notNull(),

  // Schema
  inputSchema: jsonb('input_schema').notNull(),
  outputSchema: jsonb('output_schema').notNull(),

  // Implementation
  handlerType: varchar('handler_type', { length: 50 }).notNull(), // builtin | http | grpc | code
  handlerConfig: jsonb('handler_config').notNull(),

  // Safety controls
  requiresHitl: boolean('requires_hitl').default(false),
  maxCallsPerRequest: integer('max_calls_per_request').default(10),
  cooldownMs: integer('cooldown_ms').default(0),
  auditLevel: varchar('audit_level', { length: 10 }).default('basic'), // none | basic | full

  // Rate limits
  rateLimitPerMinute: integer('rate_limit_per_minute'),
  rateLimitPerHour: integer('rate_limit_per_hour'),

  // Status
  isActive: boolean('is_active').default(true),

  // Metrics
  totalCalls: bigint('total_calls', { mode: 'number' }).default(0),
  avgDurationMs: integer('avg_duration_ms'),
  successRate: numeric('success_rate', { precision: 5, scale: 4 }),

  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
}, (table) => ({
  ventureSlugUnique: unique().on(table.ventureId, table.slug),
}));
```

### Core Interface

```typescript
export class NAOSAgent {
  readonly id: string;
  readonly config: AgentConfig;

  constructor(config: AgentConfig);

  // Process an incoming request with full lifecycle
  async process(request: AgentRequest): Promise<AgentResponse>;

  // Execute a registered instrument (tool call)
  async useInstrument(name: string, params: unknown): Promise<unknown>;

  // Check if agent has a specific capability
  hasCapability(capability: AgentCapability): boolean;
}

export class AgentRegistry {
  // Register a new agent
  async register(config: AgentConfig): Promise<NAOSAgent>;

  // Retrieve an active agent by ID
  async getAgent(id: string): Promise<NAOSAgent>;

  // Find all active agents with a specific capability
  async findAgentsByCapability(capability: AgentCapability): Promise<NAOSAgent[]>;

  // Get performance metrics for an agent
  async getAgentMetrics(id: string): Promise<AgentMetrics>;

  // Update agent operational status
  async updateAgentStatus(id: string, status: AgentRegistration['status']): Promise<void>;
}

export class Instrument {
  readonly definition: InstrumentDefinition;

  constructor(definition: InstrumentDefinition);

  // Execute with input validation, rate limiting, and audit logging
  async execute(input: unknown, context: ExecutionContext): Promise<unknown>;

  // Convert to LLM tool definition format
  toToolDefinition(): ToolDefinition;
}
```

### Key Behaviors

1. **Capability enforcement**: Every instrument declares a `requiredCapability`. When an agent attempts to use an instrument, the NAOS runtime verifies the agent's capability list first. Missing capabilities throw `AgentError`.
2. **Cost budgeting**: Each agent has a per-request cost budget (`constraints.costBudgetUSD`). The runtime tracks token usage and cost accumulation across tool calls. Exceeding the budget terminates the request with `COST_BUDGET_EXCEEDED`.
3. **Instrument rate limiting**: Instruments support per-request call limits and cooldown periods. Exceeding either throws `RateLimitError`.
4. **Audit logging**: Instruments log all executions at configurable levels (`none`, `basic`, `full`). Full audit captures input/output payloads for compliance review.
5. **Metric aggregation**: The NAOS runtime automatically aggregates per-request metrics (tokens, cost, latency, tool calls) into hourly/daily/weekly/monthly rollups in `naos_agent_metrics`.

---

## Module: queen

### Purpose

The Queen is the strategic orchestrator of the NAOS hierarchy. She receives high-level requests from humans or system events, analyzes intent, decomposes complex requests into atomic task graphs, assesses risk and HITL requirements, allocates resources to Ralph pods, dispatches execution, and aggregates results into a unified response.

The Queen never executes work directly — she only plans and delegates. This separation of concerns ensures that the planning intelligence can be upgraded independently of execution capabilities, and that all execution passes through capability and HITL gates.

### Core Interface

```typescript
export class Queen extends NAOSAgent {
  private planner: TaskPlanner;
  private allocator: ResourceAllocator;
  private dispatcher: SwarmDispatcher;
  private hitl: HITLGateway;

  constructor(config: QueenConfig);

  // Process a high-level strategic request
  async handleRequest(request: StrategicRequest): Promise<StrategicResponse>;
}

export class TaskPlanner {
  // Decompose a request into atomic, executable tasks
  async decompose(request: StrategicRequest, analysis: RequestAnalysis): Promise<Task[]>;
}

export class ResourceAllocator {
  // Create an execution plan with resource allocations
  async allocate(tasks: Task[]): Promise<ResourcePlan>;
}
```

### Task Decomposition Flow

```
┌──────────────────────────────────────────────────────────────────┐
│                   QUEEN TASK DECOMPOSITION                        │
│                                                                   │
│  1. ANALYZE REQUEST                                               │
│     ├── Parse intent (what is the user trying to accomplish?)     │
│     ├── Identify domains (marketing? development? finance?)       │
│     ├── Assess complexity (simple/moderate/complex/critical)      │
│     └── Load relevant context from Memory                         │
│                                                                   │
│  2. DECOMPOSE INTO TASKS                                          │
│     ├── Break into atomic units (each assignable to one pod)      │
│     ├── Identify dependencies (task B needs output of task A)     │
│     ├── Validate task graph (no cycles, all deps exist)           │
│     └── Optimize execution order (topological sort + priority)    │
│                                                                   │
│  3. ASSESS RISK                                                   │
│     ├── Check for high-risk instruments                           │
│     ├── Check cost thresholds                                     │
│     ├── Check for external communications                         │
│     ├── Determine HITL requirements                               │
│     └── Identify required approvers by role                       │
│                                                                   │
│  4. ALLOCATE RESOURCES                                            │
│     ├── Group tasks into parallel execution waves                 │
│     ├── Assign each task to a specific Ralph pod                  │
│     ├── Select model tier (economy/standard/premium/reasoning)    │
│     ├── Set token budgets and timeouts                            │
│     └── Estimate total duration and cost                          │
│                                                                   │
│  5. DISPATCH & AGGREGATE                                          │
│     ├── Route through HITL if required (wait for approval)        │
│     ├── Dispatch parallel groups in dependency order              │
│     ├── Monitor execution progress                                │
│     ├── Handle failures (retry or escalate)                       │
│     └── Aggregate results into unified response                   │
└──────────────────────────────────────────────────────────────────┘
```

### Risk Assessment Matrix

| Condition | Risk Level | HITL Required | Approvers |
|-----------|-----------|--------------|-----------|
| Read-only operations, internal queries | Low | No | — |
| Data modifications, standard API calls | Medium | Yes (1) | Manager ×1 |
| Financial transactions, user data changes | High | Yes (2) | Manager ×1 + Executive ×1 |
| System configuration, security changes, bulk operations | Critical | Yes (3) | Executive ×2 |
| Cost exceeds $500 per request | High | Yes | Manager ×1 + Finance ×1 |
| External communication (email, SMS, social) | Medium | Yes | Manager ×1 |

### Key Behaviors

1. **Planning-only**: The Queen has capabilities `['read', 'delegate', 'approve']` — never `write`, `execute`, or `financial`. She cannot perform side effects directly.
2. **Cycle detection**: The TaskPlanner validates the dependency graph using DFS-based cycle detection. Cycles throw `PlanningError`.
3. **Priority-aware scheduling**: Tasks are topologically sorted with priority tie-breaking. Critical tasks execute first within each parallel wave.
4. **Cost estimation**: The Queen estimates costs per task based on historical averages per task type and instrument count, enabling pre-execution budget checks.
5. **Adaptive re-planning**: If a task fails during execution, the Queen can re-plan the remaining tasks, potentially routing to different pods or simplifying the approach.

---

## Module: swarm

### Purpose

The Swarm module manages the Ralph execution pods — specialized AI worker agents that perform the actual work delegated by Queen. Each Ralph pod has a domain specialization (engineering, marketing, operations, finance, content, analytics, communications, security), a curated set of instruments, and a tailored system prompt.

The Swarm also provides the Worker Pool for dynamic scaling, the Swarm Dispatcher for parallel task execution, and the trajectory logging system for learning from execution traces.

### Database Schema

```typescript
// naos_tasks — Task Definitions and Execution Tracking
export const naosTasks = pgTable('naos_tasks', {
  id: uuid('id').primaryKey().defaultRandom(),
  ventureId: uuid('venture_id').notNull().references(() => ventures.id),

  // Hierarchy
  parentTaskId: uuid('parent_task_id').references(() => naosTasks.id),
  rootTaskId: uuid('root_task_id').references(() => naosTasks.id),

  // Assignment
  assignedAgentId: uuid('assigned_agent_id').references(() => naosAgents.id),
  targetPodType: varchar('target_pod_type', { length: 50 }),

  // Task definition
  title: varchar('title', { length: 500 }).notNull(),
  description: text('description'),
  type: naosTaskTypeEnum('type').notNull(),
  priority: naosPriorityEnum('priority').default('medium'),

  // Instruments needed
  instruments: sql`text[]`.default('{}'),

  // Dependencies
  dependencies: sql`uuid[]`.default('{}'),

  // Input/Output
  input: jsonb('input').notNull().default('{}'),
  output: jsonb('output'),

  // Execution context
  context: jsonb('context').default('{}'),

  // Status
  status: naosTaskStatusEnum('status').default('pending'),
  // pending → queued → assigned → running → waiting_hitl → completed | failed | cancelled | timeout

  // Estimates
  estimatedDurationMs: integer('estimated_duration_ms'),
  estimatedCostUsd: numeric('estimated_cost_usd', { precision: 10, scale: 4 }),

  // Actual metrics
  actualDurationMs: integer('actual_duration_ms'),
  actualCostUsd: numeric('actual_cost_usd', { precision: 10, scale: 4 }),
  tokensUsed: integer('tokens_used'),
  toolCallsMade: integer('tool_calls_made'),

  // Timing
  queuedAt: timestamp('queued_at', { withTimezone: true }),
  startedAt: timestamp('started_at', { withTimezone: true }),
  completedAt: timestamp('completed_at', { withTimezone: true }),
  deadline: timestamp('deadline', { withTimezone: true }),

  // Error handling
  errorMessage: text('error_message'),
  retryCount: integer('retry_count').default(0),
  maxRetries: integer('max_retries').default(3),

  // HITL
  requiresHitl: boolean('requires_hitl').default(false),
  hitlRequestId: uuid('hitl_request_id'),

  // Audit
  createdBy: uuid('created_by'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

// naos_task_events — Event Log for Task Execution
export const naosTaskEvents = pgTable('naos_task_events', {
  id: uuid('id').primaryKey().defaultRandom(),
  taskId: uuid('task_id').notNull().references(() => naosTasks.id, { onDelete: 'cascade' }),

  // Event details
  eventType: naosTaskEventTypeEnum('event_type').notNull(),
  // created | queued | assigned | started | progress | tool_called | tool_result
  // | hitl_requested | hitl_completed | completed | failed | cancelled | retried | timeout

  // Progress tracking
  progressPercent: integer('progress_percent'),
  progressMessage: text('progress_message'),

  // Event data
  data: jsonb('data').default('{}'),

  // Timing
  timestamp: timestamp('timestamp', { withTimezone: true }).defaultNow(),
  durationMs: integer('duration_ms'),
});

// naos_task_queues — Queue Management for Task Distribution
export const naosTaskQueues = pgTable('naos_task_queues', {
  id: uuid('id').primaryKey().defaultRandom(),
  ventureId: uuid('venture_id').notNull().references(() => ventures.id),

  // Queue definition
  name: varchar('name', { length: 100 }).notNull(),
  slug: varchar('slug', { length: 100 }).notNull(),
  description: text('description'),

  // Target
  targetPodType: varchar('target_pod_type', { length: 50 }),
  targetAgentId: uuid('target_agent_id').references(() => naosAgents.id),

  // Configuration
  maxConcurrent: integer('max_concurrent').default(10),
  priorityWeight: integer('priority_weight').default(1),
  processingTimeoutMs: integer('processing_timeout_ms').default(300000),

  // Rate limiting
  rateLimitPerMinute: integer('rate_limit_per_minute'),
  rateLimitPerHour: integer('rate_limit_per_hour'),

  // Status
  isActive: boolean('is_active').default(true),
  isPaused: boolean('is_paused').default(false),

  // Stats
  pendingCount: integer('pending_count').default(0),
  processingCount: integer('processing_count').default(0),

  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
}, (table) => ({
  ventureSlugUnique: unique().on(table.ventureId, table.slug),
}));

// naos_trajectories — Execution Trajectories for Learning
export const naosTrajectories = pgTable('naos_trajectories', {
  id: uuid('id').primaryKey().defaultRandom(),
  ventureId: uuid('venture_id').notNull().references(() => ventures.id),
  taskId: uuid('task_id').notNull().references(() => naosTasks.id),
  agentId: uuid('agent_id').notNull().references(() => naosAgents.id),

  // Task context
  taskType: naosTaskTypeEnum('task_type').notNull(),
  taskInput: jsonb('task_input').notNull(),

  // Execution steps
  steps: jsonb('steps').notNull().default('[]'),
  /*
    steps: [
      { step: 1, action: "tool_call", tool: "database_query", input: {...},
        output: {...}, reasoning: "Need to fetch user data first", duration_ms: 150 },
      { step: 2, action: "llm_completion", prompt_tokens: 500,
        completion_tokens: 200, reasoning: "Analyzing retrieved data" }
    ]
  */

  // Outcome
  outcome: naosTrajectoryOutcomeEnum('outcome').notNull(), // success | partial | failure
  taskOutput: jsonb('task_output'),
  errorMessage: text('error_message'),

  // Metrics
  totalDurationMs: integer('total_duration_ms').notNull(),
  totalTokens: integer('total_tokens').notNull(),
  totalToolCalls: integer('total_tool_calls').notNull(),
  totalCostUsd: numeric('total_cost_usd', { precision: 10, scale: 4 }).notNull(),

  // Reward signal for learning
  rewardSignal: numeric('reward_signal', { precision: 3, scale: 2 }), // -1.0 to 1.0
  rewardComponents: jsonb('reward_components').default('{}'),

  // Feedback
  humanFeedback: text('human_feedback'),
  humanRating: integer('human_rating'), // 1-5

  // Flags
  isExemplar: boolean('is_exemplar').default(false),
  isFailureCase: boolean('is_failure_case').default(false),

  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});
```

### Ralph Pod Specializations

| Pod | Slug | Role | Capabilities | Default Instruments | Max Concurrent |
|-----|------|------|-------------|---------------------|----------------|
| **Smith** | `smith` | Engineer | read, write, execute, external | code_edit, code_review, git_operations, test_runner, deployment, database_migration, api_call | 3 |
| **Growth** | `growth` | Marketer | read, write, external | campaign_builder, content_generator, analytics_query, social_scheduler, email_sender, ab_test | 5 |
| **Director** | `director` | Operator | read, write, delegate | workflow_builder, task_manager, calendar_operations, meeting_scheduler, document_manager | 10 |
| **Ledger** | `ledger` | Accountant | read, financial | invoice_generator, payment_processor, report_builder, budget_tracker, expense_manager | 3 |
| **Scribe** | `scribe` | Writer | read, write | content_writer, editor, translator, summarizer, seo_optimizer, plagiarism_checker | 5 |
| **Oracle** | `oracle` | Analyst | read | data_query, visualization_builder, insight_generator, trend_analyzer, forecast_model | 5 |
| **Herald** | `herald` | Communicator | read, external | email_composer, notification_sender, slack_messenger, sms_sender, template_manager | 20 |
| **Shield** | `shield` | Guardian | read, write | access_auditor, threat_scanner, incident_reporter, permission_manager, compliance_checker | 3 |

### Core Interface

```typescript
export class RalphPod extends NAOSAgent {
  readonly podType: RalphPodType;

  constructor(config: RalphPodConfig);

  // Execute an assigned task with resource constraints
  async executeTask(task: Task, resources: ResourceRequirements): Promise<TaskResult>;

  // Check if pod is currently executing tasks
  isBusy(): boolean;
}

export class SwarmDispatcher {
  // Dispatch tasks according to allocation plan (respects parallel groups)
  async dispatch(tasks: Task[], allocation: ResourcePlan): Promise<ExecutionResult[]>;
}

export class WorkerPool {
  // Submit a task to the worker pool (auto-scales)
  async submitTask(task: Task, assignment: TaskAssignment): Promise<TaskResult>;

  // Get current pool status
  getStatus(): PoolStatus;
}
```

### Task Execution Loop

```typescript
// Simplified view of how a Ralph pod executes a task
async function executeTask(task: Task, context: TaskContext): Promise<TaskResult> {
  const messages: Message[] = [
    { role: 'system', content: buildSystemPrompt(task) },
    { role: 'user', content: buildTaskPrompt(task) },
  ];

  let iteration = 0;
  const maxIterations = 10;

  while (iteration < maxIterations) {
    iteration++;

    // 1. Get LLM response
    const response = await llm.complete({
      model: context.resources.modelTier,
      messages,
      tools: instruments.map(i => i.toToolDefinition()),
      maxTokens: context.resources.maxTokens,
    });

    // 2. Task complete?
    if (response.finishReason === 'stop') {
      return parseResult(response.content, task);
    }

    // 3. Process tool calls
    if (response.toolCalls?.length > 0) {
      const toolResults = await executeToolCalls(response.toolCalls, instruments, context);
      messages.push({ role: 'assistant', content: response.content, toolCalls: response.toolCalls });
      messages.push({ role: 'tool', content: JSON.stringify(toolResults) });
    }
  }

  throw new TaskExecutionError('Max iterations exceeded', task.id);
}
```

### Key Behaviors

1. **Model tier selection**: The ResourceAllocator selects model tiers based on task complexity. Development tasks default to `premium` (Claude Opus/Sonnet), communications to `economy` (Haiku/GPT-3.5), analytics to `standard`.
2. **Parallel execution**: Tasks with no mutual dependencies execute in parallel via `Promise.allSettled`. Failure of one task in a parallel group doesn't block others.
3. **Trajectory recording**: Every task execution produces a trajectory record with step-by-step traces, token counts, tool calls, and an outcome. Exemplar trajectories are flagged for future few-shot prompting.
4. **Retry with backoff**: Failed tasks retry up to `maxRetries` times with exponential backoff. Each retry is a fresh execution with the failure context added to the prompt.
5. **Dynamic scaling**: The WorkerPool scales between `minWorkers` and `maxWorkers` based on queue depth. Scale-up triggers when queue depth exceeds `scaleUpThreshold`. Idle workers are reclaimed after `workerIdleTimeoutMs`.

---

## Module: hitl

### Purpose

The HITL (Human-in-the-Loop) module ensures human oversight of all high-risk AI operations. It implements a complete approval lifecycle: request creation, multi-channel notification, multi-step workflow processing, quorum-based voting, timeout escalation, and full audit trails.

Every operation flagged by the Queen's risk assessor — financial transactions, external communications, data modifications above thresholds, system configuration changes — must pass through HITL before execution proceeds.

### Database Schema

```typescript
// naos_hitl_requests — Human-in-the-Loop Approval Requests
export const naosHitlRequests = pgTable('naos_hitl_requests', {
  id: uuid('id').primaryKey().defaultRandom(),
  ventureId: uuid('venture_id').notNull().references(() => ventures.id),

  // Reference
  requestType: naosHitlRequestTypeEnum('request_type').notNull(),
  // task_approval | financial_approval | data_access | external_communication | configuration_change | escalation
  sourceTaskId: uuid('source_task_id').references(() => naosTasks.id),
  sourceAgentId: uuid('source_agent_id').references(() => naosAgents.id),

  // Request details
  title: varchar('title', { length: 500 }).notNull(),
  description: text('description').notNull(),

  // Risk assessment
  riskLevel: naosRiskLevelEnum('risk_level').notNull(), // low | medium | high | critical
  riskFactors: jsonb('risk_factors').default('[]'),

  // Tasks being approved
  tasks: jsonb('tasks').notNull().default('[]'),

  // Approval requirements
  requiredApprovers: jsonb('required_approvers').notNull().default('[]'),

  // Context for approvers
  context: jsonb('context').default('{}'),

  // Status
  status: naosHitlStatusEnum('status').default('pending'),
  // pending | approved | rejected | expired | cancelled

  // Timing
  deadline: timestamp('deadline', { withTimezone: true }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  resolvedAt: timestamp('resolved_at', { withTimezone: true }),

  // Outcome
  finalDecision: naosHitlStatusEnum('final_decision'),
  finalComments: text('final_comments'),
  conditions: jsonb('conditions'),

  // Escalation
  escalatedAt: timestamp('escalated_at', { withTimezone: true }),
  escalationReason: text('escalation_reason'),
});

// naos_hitl_approvals — Individual Approval Decisions
export const naosHitlApprovals = pgTable('naos_hitl_approvals', {
  id: uuid('id').primaryKey().defaultRandom(),
  requestId: uuid('request_id').notNull().references(() => naosHitlRequests.id, { onDelete: 'cascade' }),

  // Approver
  approverId: uuid('approver_id').notNull(),
  approverRole: varchar('approver_role', { length: 50 }).notNull(),
  approvalLevel: integer('approval_level').notNull(),

  // Decision
  decision: naosApprovalDecisionEnum('decision'), // approve | reject | delegate | abstain
  comments: text('comments'),
  conditions: jsonb('conditions'),

  // Delegation
  delegatedTo: uuid('delegated_to'),
  delegationReason: text('delegation_reason'),

  // Timing
  dueDate: timestamp('due_date', { withTimezone: true }),
  decidedAt: timestamp('decided_at', { withTimezone: true }),
  reminderSentAt: timestamp('reminder_sent_at', { withTimezone: true }),

  // Status
  status: varchar('status', { length: 20 }).default('pending'),

  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

// naos_hitl_escalation_rules — Automatic Escalation Configuration
export const naosHitlEscalationRules = pgTable('naos_hitl_escalation_rules', {
  id: uuid('id').primaryKey().defaultRandom(),
  ventureId: uuid('venture_id').notNull().references(() => ventures.id),

  // Rule definition
  name: varchar('name', { length: 200 }).notNull(),
  description: text('description'),

  // Trigger conditions
  triggerConditions: jsonb('trigger_conditions').notNull(),

  // Escalation action
  escalationAction: jsonb('escalation_action').notNull(),

  // Priority
  priority: integer('priority').default(0),

  // Status
  isActive: boolean('is_active').default(true),

  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});
```

### Approval Workflow State Machine

```
┌──────────┐  create      ┌──────────┐
│          │─────────────▶│          │
│  (new)   │              │ PENDING  │
│          │              │          │
└──────────┘              └────┬─────┘
                               │
                 ┌─────────────┼──────────────┬──────────────┐
                 │             │              │              │
            approve(s)    reject(1)     timeout         cancel
                 │             │              │              │
                 ▼             ▼              ▼              ▼
        ┌──────────────┐ ┌──────────┐ ┌──────────────┐ ┌──────────┐
        │ Quorum met?  │ │          │ │  Check       │ │          │
        │              │ │ REJECTED │ │  escalation  │ │ CANCELLED│
        │ YES → next   │ │          │ │  rules       │ │          │
        │ NO  → wait   │ └──────────┘ └──────┬───────┘ └──────────┘
        └──────┬───────┘                      │
               │                   ┌──────────┼──────────┐
               │ all steps done    │          │          │
               ▼                escalate  auto_approve auto_reject
        ┌──────────────┐          │          │          │
        │              │          ▼          ▼          ▼
        │  APPROVED    │   ┌──────────┐ ┌──────────┐ ┌──────────┐
        │              │   │ESCALATED │ │ APPROVED │ │ REJECTED │
        │  (execute    │   │(add new  │ │ (system) │ │ (timeout)│
        │   proceeds)  │   │ approver)│ └──────────┘ └──────────┘
        └──────────────┘   └──────────┘
```

### Core Interface

```typescript
export class HITLGateway {
  // Request human approval for tasks (blocks until resolved or timeout)
  async requestApproval(params: {
    requestId: string;
    tasks: Task[];
    riskAssessment: RiskAssessment;
    requiredApprovers: ApproverConfig[];
    timeout: Duration;
    context?: Record<string, unknown>;
  }): Promise<HITLApproval>;
}

export class HITLQueue {
  // Add a request to the approval queue
  async enqueue(request: HITLRequest): Promise<void>;

  // Get the status of a pending request
  async getStatus(requestId: string): Promise<QueueStatus>;

  // Record an approver's decision
  async recordDecision(requestId: string, decision: ApprovalDecision): Promise<void>;

  // Get pending requests for a specific approver
  async getPendingForApprover(approverId: UserID, ventureId: VentureID): Promise<HITLRequest[]>;
}

export class ApprovalWorkflow {
  // Process an approval decision for a workflow step
  async processApproval(stepId: string, decision: ApprovalDecision): Promise<WorkflowResult>;

  // Get current workflow state
  getState(): WorkflowState;
}
```

### Key Behaviors

1. **Dual storage**: HITL requests are stored in PostgreSQL for durability and in Redis sorted sets (keyed by deadline) for fast queue operations.
2. **Multi-step workflows**: Workflows can have N sequential steps, each requiring M approvers of specific roles. Step N+1 only activates when step N is fully approved.
3. **Quorum voting**: Three modes — `majority` (>50%), `unanimous` (100%), `threshold` (configurable %). A single rejection in `unanimous` mode fails the entire request.
4. **Escalation**: When 75% of the deadline has elapsed without resolution, the escalation manager activates. Escalation actions include adding higher-level approvers, auto-approving, auto-rejecting, or notifying executives.
5. **Timeout handling**: Expired requests check escalation rules. If no rule matches, the default behavior is rejection. Escalation rules can override to auto-approve for low-risk operations.
6. **Real-time notifications**: Approvers are notified via email, Slack, push notification, and in-app. Reminders fire at 50% and 75% of the deadline.

---

## Module: prompts

### Purpose

The Prompts module manages the prompt engineering infrastructure for the entire Agentic OS. It provides a versioned template registry, variable validation, Handlebars-style rendering, multi-step chain orchestration, and the foundation for A/B testing of prompt variants.

Every system prompt, task prompt, reasoning prompt, safety guard, and formatting instruction used by any agent in the system is registered here. This centralization enables prompt auditing, performance tracking, and iterative optimization.

### Database Schema

```typescript
// naos_prompts — Prompt Template Bank
export const naosPrompts = pgTable('naos_prompts', {
  id: uuid('id').primaryKey().defaultRandom(),
  ventureId: uuid('venture_id').references(() => ventures.id), // null = system-wide

  // Identity
  name: varchar('name', { length: 200 }).notNull(),
  slug: varchar('slug', { length: 100 }).notNull(),
  description: text('description'),

  // Categorization
  category: varchar('category', { length: 50 }).notNull(),
  // system | task | reasoning | formatting | safety | persona | tool_use
  subcategory: varchar('subcategory', { length: 50 }),
  tags: sql`text[]`.default('{}'),

  // Template
  template: text('template').notNull(),

  // Variables
  variables: jsonb('variables').default('[]'),

  // Model hints
  recommendedModels: sql`text[]`.default('{}'),
  maxTokens: integer('max_tokens'),
  temperature: numeric('temperature', { precision: 3, scale: 2 }),

  // Versioning
  version: integer('version').default(1),
  parentId: uuid('parent_id').references(() => naosPrompts.id),

  // Status
  status: naosPromptStatusEnum('status').default('draft'), // draft | active | deprecated

  // Metrics
  usageCount: integer('usage_count').default(0),
  avgQualityScore: numeric('avg_quality_score', { precision: 3, scale: 2 }),

  // Audit
  createdBy: uuid('created_by'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
}, (table) => ({
  ventureSlugVersionUnique: unique().on(table.ventureId, table.slug, table.version),
}));

// naos_prompt_chains — Chained Prompt Sequences
export const naosPromptChains = pgTable('naos_prompt_chains', {
  id: uuid('id').primaryKey().defaultRandom(),
  ventureId: uuid('venture_id').references(() => ventures.id),

  // Identity
  name: varchar('name', { length: 200 }).notNull(),
  slug: varchar('slug', { length: 100 }).notNull(),
  description: text('description'),

  // Chain definition
  steps: jsonb('steps').notNull().default('[]'),

  // Execution config
  continueOnError: boolean('continue_on_error').default(false),
  maxIterations: integer('max_iterations').default(10),

  // Status
  isActive: boolean('is_active').default(true),

  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
}, (table) => ({
  ventureSlugUnique: unique().on(table.ventureId, table.slug),
}));
```

### Core Interface

```typescript
export class PromptBank {
  // Register a new prompt template
  async register(template: Omit<PromptTemplate, 'id'>): Promise<string>;

  // Retrieve a template by name or ID (optionally by version)
  async getTemplate(nameOrId: string, version?: string): Promise<PromptTemplate>;

  // Render a template with variables (validates required vars, applies defaults)
  async render(nameOrId: string, variables: Record<string, unknown>, options?: RenderOptions): Promise<string>;

  // Search for templates by category, tags, or text
  async search(query: PromptSearchQuery): Promise<PromptTemplate[]>;
}

export class PromptChainExecutor {
  // Execute a multi-step prompt chain with input mapping between steps
  async execute(
    chain: PromptChain,
    initialInput: Record<string, unknown>,
    context: ExecutionContext
  ): Promise<ChainResult>;
}
```

### Prompt Categories

| Category | Purpose | Example |
|----------|---------|---------|
| `system` | Agent identity and behavior prompts | Queen system prompt, Ralph Smith system prompt |
| `task` | Task-specific instruction templates | "Analyze this dataset", "Write a blog post" |
| `reasoning` | Reasoning strategy prompts | Chain-of-thought template, tree-of-thought branching |
| `formatting` | Output format instructions | JSON schema formatting, markdown report structure |
| `safety` | Safety guardrails and constraints | Content moderation, PII detection |
| `persona` | Venture-specific personality tuning | BetEdge's casual sports tone vs. Futurestate's professional real estate tone |
| `tool_use` | Instrument usage guidance | "When to use database_query vs. api_call" |

### Key Behaviors

1. **Variable validation**: Required variables must be provided; missing ones throw `ValidationError`. Optional variables fall back to defaults. Zod schemas validate type constraints.
2. **Version management**: Templates are immutable after activation. Updates create new versions. Queries without a version return the latest active version.
3. **Usage tracking**: Every `render()` call increments the template's `usageCount`. Quality scores are updated when human feedback is received.
4. **Chain error handling**: Chains support `fail_fast` (stop on first error) and `continue_on_error` (skip failed steps) strategies. Each step can have its own retry policy.
5. **Conditional steps**: Chain steps can specify conditions (e.g., "only run if step A produced a high confidence score") to enable branching logic within chains.

---

## Module: memory

### Purpose

The Memory module, known as the **Neural Hive-Mind**, is the cognitive persistence layer of the Agentic OS. It enables agents to transcend context window limitations by treating knowledge as a programmatic, external environment. The system implements four memory types (episodic, semantic, procedural, working), recursive Deep RAG retrieval, Knowledge Graph integration via Neo4j, and automatic consolidation from raw traces to distilled knowledge.

### Architecture: Tri-Modal Storage

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           🧠 NEURAL HIVE-MIND                               │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌───────────────────────┐  ┌───────────────────────┐  ┌─────────────────┐ │
│  │   1. EPISODIC STORE   │  │   2. SEMANTIC STORE   │  │ 3. WORKING MEM  │ │
│  │     (PostgreSQL)      │  │   (Neo4j + pgvector)  │  │    (Redis)      │ │
│  ├───────────────────────┤  ├───────────────────────┤  ├─────────────────┤ │
│  │ • Raw event logs      │  │ • Entities & Relations│  │ • Active session│ │
│  │ • Input/Output pairs  │  │ • Validated facts     │  │ • Local state   │ │
│  │ • Tool call traces    │  │ • Embedded chunks     │  │ • Short-term    │ │
│  │ • Importance scores   │  │ • Recursive search    │  │   context cache │ │
│  └───────────┬───────────┘  └───────────┬───────────┘  └────────┬────────┘ │
│              │                          │                       │          │
│              └────────────┬─────────────┴───────────────────────┘          │
│                           ▼                                                │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                   CONTEXT CONSOLIDATION ENGINE                       │   │
│  │                                                                     │   │
│  │  1. Ingest Episodic Memory (Raw Experience)                         │   │
│  │  2. Analyze for Learnings (LLM Synthesis)                           │   │
│  │  3. Extract Entities & Relations (Knowledge Graph)                   │   │
│  │  4. Update Vector Chunks (Semantic Search)                          │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Database Schema

```typescript
// naos_memory_entries — Agent Memory Storage (with vector embedding)
export const naosMemoryEntries = pgTable('naos_memory_entries', {
  id: uuid('id').primaryKey().defaultRandom(),
  ventureId: uuid('venture_id').notNull().references(() => ventures.id),
  agentId: uuid('agent_id').references(() => naosAgents.id),

  // Memory classification
  memoryType: naosMemoryTypeEnum('memory_type').notNull(),
  // episodic | semantic | procedural | working
  category: varchar('category', { length: 100 }),

  // Content
  content: text('content').notNull(),
  summary: text('summary'),

  // Source
  sourceType: varchar('source_type', { length: 50 }).notNull(),
  // task | conversation | explicit | inferred
  sourceId: uuid('source_id'),

  // Relevance
  importance: numeric('importance', { precision: 3, scale: 2 }).default('0.5'), // 0.00 to 1.00
  confidence: numeric('confidence', { precision: 3, scale: 2 }).default('1.0'),

  // Vector embedding for semantic search
  embedding: sql`vector(3072)`,

  // Relationships
  relatedEntities: jsonb('related_entities').default('[]'),

  // Tags for filtering
  tags: sql`text[]`.default('{}'),

  // Validity
  validFrom: timestamp('valid_from', { withTimezone: true }).defaultNow(),
  validUntil: timestamp('valid_until', { withTimezone: true }),

  // Access tracking
  accessCount: integer('access_count').default(0),
  lastAccessedAt: timestamp('last_accessed_at', { withTimezone: true }),

  // Status
  status: naosMemoryStatusEnum('status').default('active'),
  // active | archived | superseded | deleted

  // Audit
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

// agent_episodic_memories — Raw Interaction Traces (High Volume, Append-Only)
export const episodicMemories = pgTable('agent_episodic_memories', {
  id: uuid('id').primaryKey().defaultRandom(),
  ventureId: uuid('venture_id').notNull().references(() => ventures.id),
  agentId: text('agent_id').notNull(),
  requestId: uuid('request_id').notNull(),

  // Interaction data
  type: text('type', { enum: ['task_execution', 'user_interaction', 'error_recovery', 'learning_moment'] }).notNull(),
  input: text('input').notNull(),
  output: text('output').notNull(),
  toolCalls: jsonb('tool_calls').$type<any[]>(),

  // Metrics
  model: text('model').notNull(),
  tokensIn: integer('tokens_in').notNull(),
  tokensOut: integer('tokens_out').notNull(),
  latencyMs: integer('latency_ms').notNull(),
  costUsd: numeric('cost_usd', { precision: 10, scale: 6 }).notNull(),

  // Importance
  importance: integer('importance').default(5), // 1-10
  emotionalValence: numeric('emotional_valence', { precision: 3, scale: 2 }), // -1 to 1

  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

// agent_semantic_chunks — Processed Knowledge Chunks
export const semanticChunks = pgTable('agent_semantic_chunks', {
  id: uuid('id').primaryKey().defaultRandom(),
  ventureId: uuid('venture_id').notNull().references(() => ventures.id),
  sourceId: uuid('source_id'),
  sourceType: text('source_type').notNull(), // episodic | document | system

  content: text('content').notNull(),
  summary: text('summary'),
  embedding: sql`vector(1536)`,

  tags: sql`text[]`,
  metadata: jsonb('metadata'),

  accessCount: integer('access_count').default(0),
  lastAccessedAt: timestamp('last_accessed_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});
```

### Core Interface

```typescript
export class MemoryStore {
  // Store a new memory entry (generates embedding automatically)
  async store(entry: Omit<MemoryEntry, 'id' | 'embedding'>): Promise<string>;

  // Retrieve relevant memories (vector search + filtering + recency bias)
  async retrieve(query: MemoryQuery): Promise<MemoryEntry[]>;

  // Consolidate episodic memories into semantic knowledge
  async consolidate(agentId: string): Promise<void>;

  // Remove memories matching criteria
  async forget(criteria: ForgetCriteria): Promise<number>;
}

export class EpisodicMemory {
  // Start recording a new episode
  startEpisode(agentId: string, type: EpisodeType): string;

  // Add an event to the current episode
  addEvent(event: Omit<EpisodeEvent, 'timestamp'>): void;

  // End the current episode and analyze it
  async endEpisode(outcome: EpisodeOutcome): Promise<Episode>;
}

export class SemanticMemory {
  // Add a subject-predicate-object triple
  async addFact(fact: Omit<SemanticFact, 'id' | 'createdAt' | 'updatedAt'>): Promise<string>;

  // Query semantic memory
  async query(agentId: string, query: string): Promise<SemanticFact[]>;

  // Apply inference rules to derive new facts
  async inferFacts(agentId: string): Promise<SemanticFact[]>;
}

export class DeepRAGProcessor {
  // Recursive retrieval with gap detection and filling
  async retrieve(query: string, options: { maxDepth: number }): Promise<DeepRAGResult>;
}
```

### Deep RAG Process

```
[Agent] -> [Memory Module]: Query ("What is BetEdge's stake in Malta?")
[Memory Module] -> [Vector Store]: Semantic Search (Top 5)
[Memory Module] -> [Knowledge Graph]: Entity Search (BetEdge, Malta)
[Memory Module] -> [Reasoning Engine]: Analyze for Gaps
[Reasoning Engine] -> [Memory Module]: Gap Found ("Missing current license status")
[Memory Module] -> [Vector Store]: Recursive Search ("BetEdge Malta License 2026")
[Memory Module] -> [Agent]: Synthesized Answer (Depth 2)
```

### Key Behaviors

1. **Hybrid retrieval**: Queries run against both the vector store (cosine similarity on embeddings) and the Knowledge Graph (entity-relationship queries). Results are merged and re-ranked.
2. **Recency bias**: Retrieved memories are scored as `(1 - recencyBias) * vectorScore + recencyBias * recencyScore`, allowing callers to tune how much recent context matters vs. semantic relevance.
3. **Automatic consolidation**: A cron job (`0 */4 * * *`) runs the consolidation engine, which clusters related episodic memories, synthesizes them into semantic facts, and updates the Knowledge Graph.
4. **Contradiction resolution**: When a new fact contradicts an existing one, the system compares confidence scores. Higher confidence wins; the losing fact is marked `validUntil: now()`.
5. **Venture isolation**: All memory queries are scoped by `ventureId`. Only Queen agents with `CAPABILITY_GLOBAL_SYNTHESIS` can perform cross-venture queries for portfolio-level analysis.
6. **PII scrubbing**: Before episodic memory enters long-term storage, the Shield pod runs a PII sanitizer to strip passwords, API keys, and personal identifiers.

### Latency Targets

| Store | Target | Description |
|-------|--------|-------------|
| Working Memory (Redis) | < 5ms | Session state, recent context |
| Semantic Search (pgvector) | < 50ms | Embedding-based retrieval |
| Knowledge Graph (Neo4j) | < 100ms | Entity-relationship queries |
| Deep RAG (Recursive) | < 800ms (p95) | Multi-hop retrieval with gap filling |

---

## Module: reasoning

### Purpose

The Reasoning module, known as the **Agentic Kernel**, is the logic engine of the Agentic OS. It implements the Recursive Language Model (RLM) pattern, treating the LLM not as a creative generator but as a **Cognitive CPU** that executes structured logic loops. The module provides multiple reasoning strategies (chain-of-thought, tree-of-thought, self-consistency, decomposition, analogical, counterfactual), the SPARC methodology for rigorous technical work, a truth verification layer with sandbox experimentation, and the Genesis Engine for converting human intents into executable Ralph blueprints.

### Architecture: The Agentic Kernel

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         THE AGENTIC KERNEL (RLM)                            │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌──────────────────────────────────────────────────────────────────────┐   │
│  │                 RECURSIVE REASONING LOOP (CPU)                       │   │
│  │                                                                      │   │
│  │  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐           │   │
│  │  │  DECOMPOSE   │───▶│   DISPATCH   │───▶│  SYNTHESIZE  │           │   │
│  │  │(Sub-problems)│    │ (Tool/Agent) │    │ (Consolidate)│           │   │
│  │  └──────────────┘    └──────────────┘    └──────────────┘           │   │
│  │         ▲                                        │                   │   │
│  │         └───────────────── RECURSE ──────────────┘                   │   │
│  └──────────────────────────────┬───────────────────────────────────────┘   │
│                                 │                                           │
│                                 ▼                                           │
│  ┌──────────────────────────────────────────────────────────────────────┐   │
│  │                 TRUTH VERIFICATION LAYER                             │   │
│  │                                                                      │   │
│  │  • Confidence Check (>0.95 threshold)                                │   │
│  │  • Sandbox Experimentation (E2B)                                     │   │
│  │  • Static Analysis Validation                                        │   │
│  │  • Schema Cross-Reference (Drizzle metadata)                         │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  ┌──────────────────────────────────────────────────────────────────────┐   │
│  │                 GENESIS ENGINE                                       │   │
│  │                                                                      │   │
│  │  [User Intent] → [Researcher] → [Spec Generator]                    │   │
│  │       → [Acceptance Criteria] → [Ralph Blueprint]                    │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Core Interface

```typescript
export class ReasoningEngine {
  // Perform structured reasoning on a problem using the specified strategy
  async reason(
    problem: string,
    context: ReasoningContext,
    config: ReasoningConfig
  ): Promise<ReasoningResult>;
}

export class ChainOfThought {
  // Generate step-by-step reasoning for a problem
  async generateSteps(problem: string, context: Record<string, unknown>): Promise<ThoughtStep[]>;
}

export class AgenticKernel {
  // Main entry point for complex reasoning with recursive self-correction
  async solve(problem: string, context: Record<string, any>): Promise<ReasoningResult>;
}

export class GenesisEngine {
  // Convert a human intent into a fully contextualized Ralph Blueprint
  async generateBlueprint(intent: string, ventureId: string): Promise<RalphBlueprint>;
}
```

### Reasoning Strategies

| Strategy | Best For | Approach | Token Cost |
|----------|---------|---------|------------|
| **Chain-of-Thought** | Sequential problems with clear steps | Linear step-by-step reasoning | Low |
| **Tree-of-Thought** | Exploratory problems with multiple paths | BFS branching + evaluation + beam search | High |
| **Self-Consistency** | Problems where confidence matters | Multiple independent CoT paths + voting | Medium-High |
| **Decomposition** | Complex multi-domain problems | Recursive sub-problem splitting | Medium |
| **Analogical** | Novel problems with known analogues | Find similar solved problems, adapt | Low |
| **Counterfactual** | Decision analysis and risk assessment | "What if" scenario exploration | Medium |

### The SPARC Methodology

Every unit of technical work follows the SPARC lifecycle:

| Phase | Activity | Output |
|-------|----------|--------|
| **S**pecification | Requirement analysis & boundary definition | Functional Spec |
| **P**seudocode | Logical flow & algorithm design (LLM-only, no code) | Logic Blueprint |
| **A**rchitecture | System design, API contracts & DB schemas | Technical Design |
| **R**efinement | Peer review (Agent-to-Agent) & optimization | Reviewed Blueprint |
| **C**ompletion | Code generation, testing & documentation | PR / Release |

### Key Behaviors

1. **Recursive decomposition**: If a task is too complex for the current context budget, the kernel spawns a child Thought Instance with a narrower scope, executes it, and synthesizes the result back up the call stack. Maximum recursion depth: 5.
2. **Truth verification**: The kernel never accepts an LLM assertion as fact without verification if confidence < 0.95. Verification methods include code execution in E2B sandboxes, schema validation against Drizzle metadata, and semantic cross-referencing against the Knowledge Graph.
3. **Genesis Engine pipeline**: User intent → Researcher agent queries Neural Hive-Mind → Spec Generator builds acceptance criteria → Blueprint Generator creates a markdown document ready for Ralph Smith execution.
4. **Stateless execution**: Each reasoning loop starts from a clean environment derived from Working Memory, preventing chain-of-thought injection attacks.
5. **Dual model strategy**: Task decomposition uses a planning-optimized model (e.g., Claude Sonnet), while truth verification uses a different model (e.g., Gemini Ultra) to avoid confirmation bias.

---

## Module: scouts

### Purpose

The Scouts module provides autonomous monitoring agents that observe system behavior, collect metrics, detect anomalies, and raise alerts — without ever taking action. Scouts are the eyes and ears of the Agentic OS, providing the telemetry data that Queen uses for adaptive planning and that operators use for system oversight.

### Database Schema

```typescript
// naos_scouts — Monitoring Agent Definitions
export const naosScouts = pgTable('naos_scouts', {
  id: uuid('id').primaryKey().defaultRandom(),
  ventureId: uuid('venture_id').notNull().references(() => ventures.id),

  // Identity
  name: varchar('name', { length: 100 }).notNull(),
  slug: varchar('slug', { length: 100 }).notNull(),
  description: text('description'),
  scoutType: naosScoutTypeEnum('scout_type').notNull(),
  // system_health | anomaly_detection | data_collection | performance | security | compliance

  // Configuration
  config: jsonb('config').notNull().default('{}'),

  // Schedule
  scheduleCron: varchar('schedule_cron', { length: 100 }),
  lastRunAt: timestamp('last_run_at', { withTimezone: true }),
  nextRunAt: timestamp('next_run_at', { withTimezone: true }),

  // Status
  isActive: boolean('is_active').default(true),

  // Stats
  totalRuns: bigint('total_runs', { mode: 'number' }).default(0),
  alertsGenerated: bigint('alerts_generated', { mode: 'number' }).default(0),

  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

// naos_scout_observations — Collected Data Points
export const naosScoutObservations = pgTable('naos_scout_observations', {
  id: uuid('id').primaryKey().defaultRandom(),
  scoutId: uuid('scout_id').notNull().references(() => naosScouts.id, { onDelete: 'cascade' }),
  ventureId: uuid('venture_id').notNull().references(() => ventures.id),

  // Observation
  observationType: varchar('observation_type', { length: 100 }).notNull(),
  severity: naosObservationSeverityEnum('severity').default('info'),
  // info | warning | error | critical

  // Data
  metrics: jsonb('metrics').notNull().default('{}'),

  // Anomalies detected
  anomalies: jsonb('anomalies').default('[]'),

  // Alert status
  alertGenerated: boolean('alert_generated').default(false),
  alertId: uuid('alert_id'),

  // Timing
  observedAt: timestamp('observed_at', { withTimezone: true }).defaultNow(),

  // Raw data
  rawData: jsonb('raw_data'),
});

// naos_alerts — Alert Tracking
export const naosAlerts = pgTable('naos_alerts', {
  id: uuid('id').primaryKey().defaultRandom(),
  ventureId: uuid('venture_id').notNull().references(() => ventures.id),
  scoutId: uuid('scout_id').references(() => naosScouts.id),
  observationId: uuid('observation_id').references(() => naosScoutObservations.id),

  // Alert details
  title: varchar('title', { length: 500 }).notNull(),
  description: text('description'),
  severity: naosObservationSeverityEnum('severity').notNull(),

  // Status
  status: naosAlertStatusEnum('status').default('open'),
  // open | acknowledged | resolved | snoozed

  // Handling
  acknowledgedBy: uuid('acknowledged_by'),
  acknowledgedAt: timestamp('acknowledged_at', { withTimezone: true }),
  resolvedBy: uuid('resolved_by'),
  resolvedAt: timestamp('resolved_at', { withTimezone: true }),
  resolutionNotes: text('resolution_notes'),

  // Snooze
  snoozedUntil: timestamp('snoozed_until', { withTimezone: true }),

  // Notification tracking
  notificationsSent: jsonb('notifications_sent').default('[]'),

  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});
```

### Core Interface

```typescript
export class ScoutNetwork {
  // Deploy a new scout
  async deployScout(config: Omit<Scout, 'id' | 'status'>): Promise<string>;

  // Manually trigger a scout run
  async runScout(scoutId: string): Promise<ScoutReport>;

  // Pause/resume a scout
  async pauseScout(scoutId: string): Promise<void>;
  async resumeScout(scoutId: string): Promise<void>;

  // Get current scout status
  async getScoutStatus(scoutId: string): Promise<Scout>;
}

export class AnomalyDetector {
  constructor(config: AnomalyDetectorConfig);

  // Add a data point to history
  addDataPoint(point: DataPoint): void;

  // Check if a data point is anomalous
  async detect(point: DataPoint): Promise<AnomalyResult | null>;
}

export class Monitor {
  constructor(config: MonitorConfig);

  // Run all health checks
  async check(): Promise<MonitorStatus>;

  // Get current uptime percentage
  getUptime(): number;

  // Get recent check history
  getHistory(limit?: number): CheckResult[];
}
```

### Anomaly Detection Algorithms

| Algorithm | Use Case | Approach | Speed |
|-----------|---------|---------|-------|
| **Z-Score** | Normally distributed metrics | Standard deviation from mean | Fastest |
| **IQR** | Skewed distributions, outlier detection | Interquartile range bounds | Fast |
| **Isolation Forest** | Multi-dimensional anomalies | ML-based feature isolation | Moderate |
| **Prophet** | Seasonal time series with trends | Facebook Prophet decomposition | Slow |
| **LSTM** | Complex temporal patterns | Neural network prediction | Slowest |

### Key Behaviors

1. **Observe-only**: Scouts have capabilities `['read']` only. They cannot modify data, send communications, or execute code. They can only collect data and raise alerts.
2. **Scheduled execution**: Scouts run on cron schedules (e.g., `*/5 * * * *` for every 5 minutes). Manual runs are also supported.
3. **Multi-collector**: Each scout can run multiple collectors (HTTP, TCP, database, metrics, custom) per execution, producing a unified observation record.
4. **Threshold cascading**: Observations are checked against multiple thresholds. Exceeding a threshold triggers alert generation with severity determined by the deviation magnitude.
5. **Alert deduplication**: Consecutive alerts for the same condition are deduplicated. Only the first alert fires; subsequent observations update the existing alert until it's resolved.
6. **Alert lifecycle**: Alerts flow through `open → acknowledged → resolved` (or `open → snoozed → open → resolved`). Resolution requires notes explaining the fix.

---

## Cross-Venture Usage

The Agentic OS serves all nine MCV.ONE consortium ventures. Each venture gets its own set of agents, memory stores, and scouts, while sharing the global prompt bank and instrument definitions.

### BetEdge (Sports Betting AI)

```typescript
// BetEdge uses the Agentic OS for automated odds analysis and content generation
const queen = new Queen({
  ...QUEEN_DEFAULTS,
  id: 'betedge-queen',
  planningModel: { model: 'claude-sonnet-4', tier: 'premium' },
});

// Dispatch automated pre-game analysis
const response = await queen.handleRequest({
  description: 'Generate pre-game analysis for tonight\'s NBA slate',
  context: { ventureId: 'betedge', userId: 'system', deadline: new Date('2026-02-08T18:00:00Z') },
  priority: 'high',
});
// Queen decomposes into:
//   Task 1 (Oracle): Fetch live odds data from sportsbook APIs
//   Task 2 (Oracle): Run statistical models on player/team data
//   Task 3 (Scribe): Generate analysis article from Oracle outputs
//   Task 4 (Herald): Publish to content feed + notify subscribers
```

### SerpSpace (SEO Platform)

```typescript
// SerpSpace uses scouts for SERP monitoring and content optimization
await scoutNetwork.deployScout({
  name: 'SERP Position Monitor — SerpSpace',
  type: 'performance',
  target: { type: 'external', identifier: 'serp-tracker' },
  schedule: { type: 'cron', expression: '0 */6 * * *' }, // Every 6 hours
  config: {
    collectors: [{ type: 'api', url: 'https://api.serpspace.com/v1/rankings' }],
    thresholds: [
      { metric: 'avg_position_change', operator: 'gt', value: 3 }, // Alert on 3+ position drop
    ],
    alertRules: [
      { condition: { severity: 'warning' }, channels: ['slack', 'email'] },
    ],
  },
});
```

### Full Gain (Grant Management)

```typescript
// Full Gain uses HITL extensively for grant application reviews
const approval = await hitlGateway.requestApproval({
  requestId: 'grant-review-001',
  tasks: [{
    id: 'task-1', type: 'content', title: 'Submit grant application to SBIR',
    targetPod: 'scribe', instruments: ['document_manager', 'email_composer'],
    description: 'Submit the finalized SBIR Phase I application',
    dependencies: [], priority: 1, estimatedDurationMs: 60000, estimatedCostUSD: 0.05,
  }],
  riskAssessment: {
    risks: [{ taskId: 'task-1', type: 'external_communication', level: 'high',
              description: 'Submitting official grant application to federal agency' }],
    overallLevel: 'high',
    requiresApproval: true,
    approvers: [{ role: 'manager', count: 1 }, { role: 'executive', count: 1 }],
  },
  requiredApprovers: [{ role: 'manager', count: 1 }, { role: 'executive', count: 1 }],
  timeout: { hours: 24 },
});
```

### MCV Studios (Gaming)

```typescript
// MCV Studios uses the memory system for game narrative continuity
await memoryStore.store({
  agentId: 'mcv-studios-narrator',
  type: 'semantic',
  content: {
    subject: 'Player_42',
    predicate: 'completed_quest',
    object: 'Dragon_Slayer_Arc',
    details: { level: 45, time: '2h15m', choices: ['spared_dragon', 'allied_mages'] },
  },
  importance: 0.9,
  accessCount: 0,
  lastAccessed: new Date(),
  createdAt: new Date(),
  tags: ['player_42', 'quest_completion', 'dragon_slayer'],
  metadata: { gameId: 'eternal-realms', sessionId: 'sess_789' },
});
```

### Futurestate (Real Estate Analytics)

```typescript
// Futurestate uses the reasoning engine for property valuation analysis
const valuation = await reasoningEngine.reason(
  'What is the fair market value of 123 Main St, Austin, TX?',
  {
    propertyData: { sqft: 2400, beds: 4, baths: 3, yearBuilt: 2018, lot: 0.25 },
    comparables: [/* recent sales data */],
    marketTrends: { austinYoYAppreciation: 0.08, inventoryMonths: 2.1 },
  },
  {
    strategy: 'self-consistency',
    maxDepth: 3,
    branchingFactor: 3,
    samplingCount: 5,
    evaluationCriteria: [
      { name: 'data_support', weight: 0.4 },
      { name: 'methodology', weight: 0.3 },
      { name: 'market_alignment', weight: 0.3 },
    ],
  }
);
// Returns valuation with confidence interval across 5 independent reasoning paths
```

---

## Code Examples

### Example 1: Register a Custom Agent

```typescript
import { AgentRegistry } from '@mcv/agentic-os';

const registry = new AgentRegistry();

const agent = await registry.register({
  id: 'custom-research-agent',
  name: 'Research Agent',
  type: 'specialist',
  description: 'Specialized agent for deep research tasks',
  capabilities: ['read', 'external'],
  model: {
    defaultModel: 'claude-sonnet-4',
    tier: 'standard',
    maxTokensPerTurn: 8000,
    temperature: 0.3,
  },
  instruments: ['database_query', 'web_search', 'document_reader'],
  memory: {
    enabled: true,
    episodicRetention: '90d',
    semanticIndexing: true,
    maxWorkingMemory: 20,
  },
  constraints: {
    maxTokensPerTurn: 8000,
    maxToolCalls: 15,
    timeoutMs: 600000,
    costBudgetUSD: 5.0,
    requiresHITL: [],
    forbiddenActions: ['write_data', 'send_email'],
  },
});

console.log(`Registered agent: ${agent.id}`);
// Registered agent: custom-research-agent
```

### Example 2: Queen Handles a Strategic Request

```typescript
import { Queen, RALPH_PODS } from '@mcv/agentic-os';

const queen = new Queen({
  id: 'queen-main',
  name: 'Queen',
  type: 'queen',
  description: 'Strategic orchestrator',
  capabilities: ['read', 'delegate', 'approve'],
  model: { defaultModel: 'claude-opus-4', tier: 'reasoning' },
  instruments: [],
  memory: { enabled: true },
  constraints: {
    maxTokensPerTurn: 16000,
    maxToolCalls: 0,
    timeoutMs: 900000,
    costBudgetUSD: 50.0,
    requiresHITL: [],
    forbiddenActions: [],
  },
  planningModel: { model: 'claude-opus-4', tier: 'reasoning' },
  maxConcurrentTasks: 20,
  taskTimeout: { minutes: 30 },
  escalationRules: [],
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

console.log(`Status: ${response.status}`);
console.log(`Tasks completed: ${response.tasks.length}`);
console.log(`Total cost: $${response.costUSD.toFixed(2)}`);
console.log(`Duration: ${response.duration}ms`);
// Status: completed
// Tasks completed: 4
// Total cost: $0.82
// Duration: 45230ms
```

### Example 3: Execute a Task with the Smith Pod

```typescript
import { RalphPod, RALPH_PODS } from '@mcv/agentic-os';

const smith = new RalphPod(RALPH_PODS.smith);

const result = await smith.executeTask(
  {
    id: 'task_dev_001',
    type: 'development',
    title: 'Add rate limiting to the API gateway',
    description: 'Implement token bucket rate limiting on all public API endpoints',
    targetPod: 'smith',
    instruments: ['code_edit', 'test_runner', 'git_operations'],
    inputs: {
      repository: 'mcv-one/api-gateway',
      branch: 'feature/rate-limiting',
      maxRequestsPerMinute: 100,
      burstSize: 20,
    },
    dependencies: [],
    priority: 2,
    estimatedDurationMs: 300000,
    estimatedCostUSD: 0.15,
  },
  {
    maxTokens: 8000,
    maxToolCalls: 20,
    timeoutMs: 600000,
    modelTier: 'premium',
  }
);

console.log(`Task status: ${result.status}`);
console.log(`Tool calls: ${result.toolCalls.length}`);
console.log(`Tokens used: ${result.tokensUsed}`);
// Task status: completed
// Tool calls: 8
// Tokens used: 12450
```

### Example 4: Request HITL Approval for a Financial Transfer

```typescript
import { HITLGateway } from '@mcv/agentic-os';

const hitl = new HITLGateway();

const approval = await hitl.requestApproval({
  requestId: 'req_fin_001',
  tasks: [{
    id: 'task_transfer',
    type: 'finance',
    title: 'Transfer $25,000 to vendor account',
    targetPod: 'ledger',
    instruments: ['financial_transfer'],
    inputs: {
      fromAccount: 'operating-001',
      toAccount: 'vendor-acme-corp',
      amount: 25000,
      currency: 'USD',
      reason: 'Q1 infrastructure invoice payment',
    },
    dependencies: [],
    priority: 1,
    estimatedDurationMs: 5000,
    estimatedCostUSD: 0.02,
  }],
  riskAssessment: {
    risks: [{
      taskId: 'task_transfer',
      type: 'cost_threshold',
      level: 'high',
      description: 'Financial transfer exceeds $10,000 threshold',
    }],
    overallLevel: 'high',
    requiresApproval: true,
    approvers: [
      { role: 'manager', count: 1 },
      { role: 'finance', count: 1 },
    ],
  },
  requiredApprovers: [
    { role: 'manager', count: 1 },
    { role: 'finance', count: 1 },
  ],
  timeout: { hours: 4 },
  context: { invoiceNumber: 'INV-ACME-2026-Q1', vendor: 'Acme Corp' },
});

if (approval.approved) {
  console.log('Transfer approved — proceeding with execution');
  console.log(`Approved by: ${approval.approvers.map(a => a.approverRole).join(', ')}`);
} else {
  console.log(`Transfer rejected: ${approval.comments}`);
}
```

### Example 5: Deploy a Scout for API Health Monitoring

```typescript
import { ScoutNetwork } from '@mcv/agentic-os';

const network = new ScoutNetwork();

const scoutId = await network.deployScout({
  name: 'API Gateway Health',
  type: 'health',
  target: { type: 'service', identifier: 'api-gateway' },
  schedule: { type: 'interval', expression: '1m' },
  config: {
    collectors: [
      { type: 'http', url: 'https://api.mcv.one/health', method: 'GET', timeout: 5000 },
      { type: 'metrics', metrics: ['response_time_p95', 'error_rate', 'active_connections'] },
    ],
    thresholds: [
      { metric: 'response_time_p95', operator: 'gt', value: 500 },
      { metric: 'error_rate', operator: 'gt', value: 0.05 },
      { metric: 'active_connections', operator: 'gt', value: 10000 },
    ],
    alertRules: [
      { condition: { severity: 'warning' }, channels: ['slack'] },
      { condition: { severity: 'critical' }, channels: ['slack', 'pagerduty', 'email'] },
    ],
  },
});

// Manual run
const report = await network.runScout(scoutId);
console.log(`Observations: ${report.observationCount}`);
console.log(`Anomalies: ${report.anomalyCount}`);
console.log(`Duration: ${report.duration}ms`);
```

### Example 6: Store and Retrieve Agent Memory

```typescript
import { MemoryStore, EpisodicMemory } from '@mcv/agentic-os';

const store = new MemoryStore();
const episodic = new EpisodicMemory();

// Start an episode
const episodeId = episodic.startEpisode('ralph-smith', 'task_execution');

// Log events during execution
episodic.addEvent({
  type: 'tool_call',
  description: 'Queried database for user schema',
  data: { tool: 'database_query', rows: 15 },
});

episodic.addEvent({
  type: 'tool_call',
  description: 'Generated migration file for new column',
  data: { tool: 'code_edit', file: 'migrations/0042_add_preferences.ts' },
});

// End episode with outcome
const episode = await episodic.endEpisode({
  success: true,
  result: { migrationFile: 'migrations/0042_add_preferences.ts' },
  feedback: 'Migration looks correct — clean implementation',
});

console.log(`Episode summary: ${episode.summary}`);
console.log(`Learnings: ${episode.learnings.join(', ')}`);
console.log(`Importance: ${episode.importance}`);

// Later — retrieve relevant memories
const memories = await store.retrieve({
  agentId: 'ralph-smith',
  query: 'database migration best practices',
  types: ['episodic', 'semantic'],
  tags: ['database', 'migration'],
  limit: 5,
  minImportance: 0.5,
  recencyBias: 0.3,
});

console.log(`Found ${memories.length} relevant memories`);
```

### Example 7: Register and Render a Prompt Template

```typescript
import { PromptBank } from '@mcv/agentic-os';

const bank = new PromptBank();

// Register a venture-specific template
const templateId = await bank.register({
  name: 'betedge_game_analysis',
  version: '1.0.0',
  category: 'task',
  description: 'Template for BetEdge pre-game analysis articles',
  template: `You are writing a pre-game analysis for {{sport}} - {{matchup}}.

Key data:
- Odds: {{odds_data}}
- Recent form: {{recent_form}}
- Head-to-head: {{h2h_record}}
{{#if injuries}}
- Injuries: {{injuries}}
{{/if}}

Write an engaging analysis in BetEdge's conversational sports tone.
Include statistical backing for every assertion.
Format as markdown with clear sections.
Target length: {{target_words}} words.`,
  variables: [
    { name: 'sport', type: 'string', required: true, description: 'Sport type' },
    { name: 'matchup', type: 'string', required: true, description: 'Team matchup' },
    { name: 'odds_data', type: 'string', required: true, description: 'Current odds' },
    { name: 'recent_form', type: 'string', required: true, description: 'Recent form data' },
    { name: 'h2h_record', type: 'string', required: true, description: 'Head-to-head' },
    { name: 'injuries', type: 'string', required: false, description: 'Injury report' },
    { name: 'target_words', type: 'number', required: false, default: 800, description: 'Target word count' },
  ],
  examples: [],
  metadata: { author: 'betedge-team', tags: ['betedge', 'sports', 'analysis'] },
  constraints: { allowedModels: ['claude-sonnet-4', 'gpt-4o'] },
});

// Render the template
const prompt = await bank.render('betedge_game_analysis', {
  sport: 'NBA',
  matchup: 'Lakers vs Celtics',
  odds_data: 'LAL -3.5 (-110), BOS +3.5 (-110), O/U 220.5',
  recent_form: 'LAL: W-W-L-W-W (8-2 L10), BOS: L-W-W-L-W (6-4 L10)',
  h2h_record: 'LAL leads 3-1 this season',
  injuries: 'BOS: Jaylen Brown (questionable, ankle)',
});

console.log(prompt);
```

### Example 8: Execute a Prompt Chain

```typescript
import { PromptBank, PromptChainExecutor } from '@mcv/agentic-os';

const bank = new PromptBank();
const executor = new PromptChainExecutor();

const result = await executor.execute(
  {
    id: 'content_pipeline',
    name: 'Content Creation Pipeline',
    description: 'Research → Draft → Edit → SEO Optimize',
    steps: [
      {
        id: 'research',
        name: 'Research Topic',
        promptTemplate: 'research_topic',
        inputMapping: [
          { source: 'initial', sourceKey: 'topic', targetKey: 'topic' },
          { source: 'initial', sourceKey: 'audience', targetKey: 'target_audience' },
        ],
        outputKey: 'research_results',
      },
      {
        id: 'draft',
        name: 'Write First Draft',
        promptTemplate: 'write_article',
        inputMapping: [
          { source: 'step', sourceKey: 'research', targetKey: 'research_data' },
          { source: 'initial', sourceKey: 'tone', targetKey: 'brand_tone' },
        ],
        outputKey: 'draft',
      },
      {
        id: 'edit',
        name: 'Edit and Polish',
        promptTemplate: 'edit_content',
        inputMapping: [
          { source: 'step', sourceKey: 'draft', targetKey: 'content' },
        ],
