# @mcv/agentic-os — Technical Architecture

## Tier 5: MCV-Only Domains

**Package:** `@mcv/agentic-os`  
**Classification:** INTERNAL (MCV-Only)  
**Version:** 1.0.0  
**Last Updated:** February 9, 2026

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [System Architecture Diagram](#system-architecture-diagram)
3. [Module Architecture](#module-architecture)
   - [NAOS — Natural Agent Operating System Core Runtime](#naos--natural-agent-operating-system-core-runtime)
   - [Queen — Strategic Orchestrator](#queen--strategic-orchestrator)
   - [Swarm — Ralph Execution Pods & Multi-Agent Coordination](#swarm--ralph-execution-pods--multi-agent-coordination)
   - [Scouts — Specialized Worker Agents & Monitoring Network](#scouts--specialized-worker-agents--monitoring-network)
   - [HITL — Human-in-the-Loop Approval Workflows](#hitl--human-in-the-loop-approval-workflows)
   - [Memory — Agent Memory Persistence and Retrieval](#memory--agent-memory-persistence-and-retrieval)
   - [Reasoning — Chain-of-Thought and Reasoning Engine](#reasoning--chain-of-thought-and-reasoning-engine)
   - [Prompts — Prompt Template Management and Versioning](#prompts--prompt-template-management-and-versioning)
4. [Data Models & Database Schema](#data-models--database-schema)
5. [Data Flow & Events](#data-flow--events)
6. [Integration Points](#integration-points)
7. [Performance Architecture](#performance-architecture)
8. [Scalability](#scalability)
9. [Error Handling](#error-handling)
10. [Observability](#observability)
11. [Security Architecture](#security-architecture)

---

## Architecture Overview

`@mcv/agentic-os` is the **Neural Agentic Operating System** — the cognitive brain of the MCV.ONE platform. It transforms MCV.ONE from a conventional SaaS platform into an autonomous, AI-driven operating system capable of planning, reasoning, executing, learning, and self-correcting across all nine consortium ventures — all under rigorous human supervision.

The architecture follows a **three-tier biological intelligence hierarchy**:

| Tier | Agent | Role | Analogy |
|------|-------|------|---------|
| **Level 3** | **Queen** | Strategic orchestrator — receives intents, decomposes into task graphs, assesses risk, routes HITL approvals, delegates execution. Never executes work directly. | Prefrontal cortex — planning and decision-making |
| **Level 2** | **Ralph Swarm** | Specialized execution pods (Smith/Engineer, Growth/Marketer, Director/Operator, Ledger/Finance, Scribe/Content, Oracle/Analytics, Herald/Communications, Shield/Security). Each pod carries domain-specific instruments and system prompts. | Motor cortex — specialized execution |
| **Level 1** | **Scouts** | Autonomous watchers that observe, collect data, detect anomalies, and report. They never take action — only observe and alert. | Sensory cortex — perception and monitoring |

Supporting these three tiers are five **foundational subsystems**:

- **NAOS** — The kernel: agent lifecycle, registry, instrument management, capability enforcement, execution context
- **Memory** — The Neural Hive-Mind: episodic memory, semantic knowledge graphs, procedural know-how, working context, Deep RAG retrieval, consolidation
- **Reasoning** — The Agentic Kernel: Recursive Language Modeling (RLM), chain-of-thought, tree-of-thought, self-consistency, SPARC methodology, truth verification, Genesis Engine
- **Prompts** — Prompt engineering infrastructure: template registry, versioning, A/B testing, chain orchestration, instrument bank
- **HITL** — Human oversight: approval workflows, multi-step escalation, quorum voting, timeout handling, audit trails

### Design Principles

1. **Separation of Planning and Execution** — The Queen plans; Ralph pods execute. This enables independent upgrades to planning intelligence vs. execution capabilities and ensures all execution passes through capability and HITL gates.

2. **Capability-Based Access Control** — Every agent declares capabilities (`read`, `write`, `execute`, `approve`, `delegate`, `external`, `financial`). Every instrument declares a required capability. The NAOS runtime enforces these gates at invocation time.

3. **Human-in-the-Loop by Default** — High-risk operations (financial transactions, external communications, system configuration changes) require explicit human approval before execution proceeds. The risk assessment matrix is configurable per venture.

4. **Persistent Memory Across Context Windows** — Agents transcend LLM context window limitations through the Neural Hive-Mind, which provides episodic, semantic, procedural, and working memory with Deep RAG retrieval.

5. **Observable and Auditable** — Every agent action, tool call, reasoning step, and approval decision is logged as a trajectory record. This enables performance optimization, compliance auditing, and learning from execution traces.

6. **Venture Isolation with Global Intelligence** — Each venture has isolated agents, memory stores, and scouts. Only Queen agents with `CAPABILITY_GLOBAL_SYNTHESIS` can perform cross-venture queries for portfolio-level analysis.

7. **Fail-Safe Degradation** — If any subsystem fails, the system degrades gracefully. Memory failures don't block execution (agents proceed with reduced context). Reasoning failures fall back to simpler strategies. HITL timeouts trigger configurable escalation rules.

---

## System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                    @mcv/agentic-os — NEURAL AGENTIC OPERATING SYSTEM                │
│                                                                                     │
│  ┌───────────────────────────────────────────────────────────────────────────────┐  │
│  │                              ENTRY POINTS                                     │  │
│  │                                                                               │  │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │  │
│  │  │  API Routes   │  │  Cron Jobs   │  │  Event Bus   │  │ Dashboard UI │     │  │
│  │  │ /api/agents   │  │ Scout runs   │  │ @mcv/fabric  │  │  Operator    │     │  │
│  │  │ /api/tasks    │  │ Consolidate  │  │ Redpanda     │  │  Console     │     │  │
│  │  │ /api/hitl     │  │ Cleanup      │  │              │  │              │     │  │
│  │  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘     │  │
│  │         └─────────────────┴─────────────────┴─────────────────┘              │  │
│  └───────────────────────────────────┬───────────────────────────────────────────┘  │
│                                      │                                              │
│  ┌───────────────────────────────────▼───────────────────────────────────────────┐  │
│  │                          QUEEN (Level 3)                                      │  │
│  │                    Strategic Orchestrator                                      │  │
│  │                                                                               │  │
│  │  ┌────────────────┐  ┌────────────────┐  ┌────────────────┐  ┌────────────┐  │  │
│  │  │ Task Planner   │  │ Resource       │  │ Risk Assessor  │  │ Result     │  │  │
│  │  │ Decompose      │  │ Allocator      │  │ HITL Router    │  │ Aggregator │  │  │
│  │  │ requests into  │  │ Assign pods &  │  │ Flag high-risk │  │ Combine    │  │  │
│  │  │ task graphs    │  │ resources      │  │ operations     │  │ outputs    │  │  │
│  │  └────────────────┘  └────────────────┘  └───────┬────────┘  └────────────┘  │  │
│  └──────────────────────────────────────────────────┬────────────────────────────┘  │
│                                                     │                               │
│                         ┌───── Low Risk ────────────┤──── High Risk ──────┐         │
│                         │                           │                     │         │
│                         ▼                           │                     ▼         │
│  ┌──────────────────────────────┐                   │  ┌─────────────────────────┐  │
│  │    SWARM DISPATCHER          │                   │  │    HITL SUBSYSTEM       │  │
│  │    Route to Ralph Pods       │◄──── approved ────┘  │                         │  │
│  │    Parallel execution        │                      │  Gateway → Queue →      │  │
│  │    Worker pool scaling       │                      │  Workflow → Escalation  │  │
│  └──────────────┬───────────────┘                      │  Quorum voting          │  │
│                 │                                       │  Timeout handling       │  │
│                 ▼                                       └─────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────────────────────────────┐   │
│  │                    RALPH SWARM (Level 2) — Execution Pods                    │   │
│  │                                                                              │   │
│  │  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐  │   │
│  │  │ SMITH   │ │ GROWTH  │ │DIRECTOR │ │ LEDGER  │ │ SCRIBE  │ │ ORACLE  │  │   │
│  │  │Engineer │ │Marketer │ │Operator │ │Finance  │ │Content  │ │Analyst  │  │   │
│  │  │code,git │ │campaign │ │workflow │ │invoice  │ │write,   │ │data,    │  │   │
│  │  │deploy   │ │social   │ │calendar │ │budget   │ │edit     │ │insight  │  │   │
│  │  └─────────┘ └─────────┘ └─────────┘ └─────────┘ └─────────┘ └─────────┘  │   │
│  │  ┌─────────┐ ┌─────────┐                                                   │   │
│  │  │ HERALD  │ │ SHIELD  │      ┌──────────────────────────────────┐          │   │
│  │  │Comms    │ │Security │      │ Worker Pool — Dynamic scaling,   │          │   │
│  │  │email,   │ │audit,   │      │ load balancing, priority queues  │          │   │
│  │  │notify   │ │threat   │      └──────────────────────────────────┘          │   │
│  │  └─────────┘ └─────────┘                                                   │   │
│  └──────────────────────────────────┬───────────────────────────────────────────┘   │
│                                     │                                               │
│  ┌──────────────────────────────────▼───────────────────────────────────────────┐   │
│  │                     FOUNDATIONAL SUBSYSTEMS                                  │   │
│  │                                                                              │   │
│  │  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐           │   │
│  │  │      NAOS        │  │     MEMORY       │  │    REASONING     │           │   │
│  │  │  Agent Runtime   │  │  Neural Hive-    │  │  Agentic Kernel  │           │   │
│  │  │                  │  │  Mind            │  │                  │           │   │
│  │  │ Agent lifecycle  │  │ Episodic store   │  │ Recursive LM     │           │   │
│  │  │ Registry         │  │ Semantic chunks  │  │ SPARC pipeline   │           │   │
│  │  │ Instruments      │  │ Knowledge graph  │  │ Truth verify     │           │   │
│  │  │ Capability gates │  │ Deep RAG         │  │ Genesis engine   │           │   │
│  │  │ Execution ctx    │  │ Working memory   │  │ Chain-of-thought │           │   │
│  │  │ Trajectory log   │  │ Consolidation    │  │ Tree-of-thought  │           │   │
│  │  └──────────────────┘  └──────────────────┘  └──────────────────┘           │   │
│  │                                                                              │   │
│  │  ┌──────────────────┐  ┌──────────────────────────────────────────────────┐  │   │
│  │  │     PROMPTS      │  │            SCOUTS (Level 1)                      │  │   │
│  │  │  Prompt Bank     │  │       Autonomous Watchers                        │  │   │
│  │  │                  │  │                                                  │  │   │
│  │  │ Template registry│  │  System health      Security scanning           │  │   │
│  │  │ Versioning       │  │  Performance metrics Compliance checks          │  │   │
│  │  │ A/B testing      │  │  Anomaly detection   Cost monitoring            │  │   │
│  │  │ Chain executor   │  │  Alert management    Data collection            │  │   │
│  │  │ Rendering engine │  │                                                  │  │   │
│  │  └──────────────────┘  └──────────────────────────────────────────────────┘  │   │
│  └──────────────────────────────────────────────────────────────────────────────┘   │
│                                                                                     │
│  ┌──────────────────────────────────────────────────────────────────────────────┐   │
│  │              DATABASE LAYER (PostgreSQL + pgvector + Redis + Neo4j)          │   │
│  │                                                                              │   │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐          │   │
│  │  │ Agents   │ │ Tasks    │ │  HITL    │ │ Memory   │ │ Prompts  │          │   │
│  │  │ 3 tables │ │ 4 tables │ │ 3 tables │ │ 3 tables │ │ 2 tables │          │   │
│  │  └──────────┘ └──────────┘ └──────────┘ └──────────┘ └──────────┘          │   │
│  │  ┌──────────┐ ┌──────────────────┐ ┌──────────────────┐ ┌──────────────┐   │   │
│  │  │ Scouts   │ │ Trajectories     │ │ Knowledge Graph  │ │ Working Mem  │   │   │
│  │  │ 3 tables │ │ naos_trajectories│ │ Neo4j (semantic) │ │ Redis (live) │   │   │
│  │  └──────────┘ └──────────────────┘ └──────────────────┘ └──────────────┘   │   │
│  └──────────────────────────────────────────────────────────────────────────────┘   │
│                                                                                     │
│  ┌──────────────────────────────────────────────────────────────────────────────┐   │
│  │                       EXTERNAL DEPENDENCIES                                  │   │
│  │                                                                              │   │
│  │  @mcv/intelligence    @mcv/fabric          @mcv/identity     @mcv/kernel    │   │
│  │  (LLM Gateway, RAG,   (Events, Queues,     (Auth, RBAC,      (DB, Context,  │   │
│  │   ML, Embeddings)      Realtime, Kafka)      Permissions)      Errors, Logs) │   │
│  │                                                                              │   │
│  │  OpenRouter           Neo4j               Pinecone/pgvector   Redis/BullMQ  │   │
│  │  (400+ LLM models)   (Knowledge Graph)   (Vector storage)    (Queues, WM)  │   │
│  │                                                                              │   │
│  │  E2B Sandbox          Redpanda/Kafka      Supabase            Solana/EDGE   │   │
│  │  (Code execution)    (Event streaming)   (PostgreSQL, Auth)  (Token-gated)  │   │
│  └──────────────────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────────────┘
```

### Request Lifecycle — End-to-End Flow

```
User Request Arrives
        │
        ▼
┌───────────────┐     ┌───────────────┐     ┌───────────────┐
│ Queen          │────►│ Task Planner  │────►│ Risk Assessor │
│                │     │               │     │               │
│ Receive intent │     │ Decompose to  │     │ Evaluate risk │
│ Load context   │     │ task graph    │     │ Flag HITL     │
└────────────────┘     └───────────────┘     └───────┬───────┘
                                                     │
                                       ┌─────────────┴───────────────┐
                                       │ Low Risk                    │ High Risk
                                       ▼                             ▼
                             ┌───────────────┐          ┌───────────────┐
                             │ Resource      │          │ HITL Gateway  │
                             │ Allocator     │          │               │
                             │ Assign pods   │          │ Queue request │
                             │ Set resources │          │ Notify humans │
                             └───────┬───────┘          │ Wait/escalate│
                                     │                  └───────┬───────┘
                                     │                          │ approved
                                     ◄──────────────────────────┘
                                     ▼
                             ┌───────────────┐     ┌───────────────┐
                             │ Swarm         │────►│ Ralph Pod     │
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
                   └───────────────┘              └───────┬───────┘
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

## Module Architecture

### NAOS — Natural Agent Operating System Core Runtime

#### Purpose

NAOS is the **kernel** of the Agentic OS. It provides the foundational runtime environment upon which every other module operates — agent lifecycle management, capability-based access control, instrument (tool) execution, execution context propagation, and metrics collection. Think of NAOS as providing the primitives (process model, IPC, syscalls, permissions) that higher-level components use.

#### Internal Architecture

```
┌──────────────────────────────────────────────────────────────────┐
│                         NAOS RUNTIME                             │
│                                                                  │
│  ┌─────────────────────┐     ┌─────────────────────┐           │
│  │   Agent Registry     │     │  Instrument Manager  │           │
│  │                      │     │                      │           │
│  │  register()          │     │  register()           │           │
│  │  getAgent()          │     │  execute()            │           │
│  │  findByCapability()  │     │  validate()           │           │
│  │  updateStatus()      │     │  toToolDefinition()   │           │
│  │  getMetrics()        │     │  checkRateLimit()     │           │
│  └──────────┬───────────┘     └──────────┬───────────┘           │
│             │                            │                       │
│  ┌──────────▼────────────────────────────▼───────────┐           │
│  │              Execution Engine                      │           │
│  │                                                    │           │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────┐ │           │
│  │  │ Capability   │  │ Cost Budget  │  │ Context  │ │           │
│  │  │ Gate         │  │ Tracker      │  │ Manager  │ │           │
│  │  │              │  │              │  │          │ │           │
│  │  │ Verify agent │  │ Track tokens │  │ Build    │ │           │
│  │  │ capabilities │  │ + cost per   │  │ execution│ │           │
│  │  │ vs. required │  │ request      │  │ context  │ │           │
│  │  └──────────────┘  └──────────────┘  └──────────┘ │           │
│  └────────────────────────────────────────────────────┘           │
│                                                                  │
│  ┌────────────────────────────────────────────────────┐           │
│  │              Metrics Aggregator                     │           │
│  │                                                    │           │
│  │  Per-request → Hourly → Daily → Weekly → Monthly  │           │
│  │  Tokens, cost, latency, tool calls, HITL, quality │           │
│  └────────────────────────────────────────────────────┘           │
└──────────────────────────────────────────────────────────────────┘
```

#### Core Components

| Component | Responsibility | Key Methods |
|-----------|---------------|-------------|
| **NAOSAgent** | Base agent class for all NAOS agents. Provides `process()` for request handling, `useInstrument()` for tool execution, and `hasCapability()` for permission checks. | `process()`, `useInstrument()`, `hasCapability()` |
| **AgentRegistry** | Agent lifecycle management. Registers, discovers, and tracks agents. Maintains status (active/paused/maintenance/retired) and aggregates metrics. | `register()`, `getAgent()`, `findAgentsByCapability()`, `getAgentMetrics()`, `updateAgentStatus()` |
| **Instrument** | Executable tool wrapper with safety controls. Validates input/output schemas, enforces rate limits and cooldowns, logs all executions for auditing. | `execute()`, `toToolDefinition()` |
| **Execution Engine** | Orchestrates the agent request lifecycle: capability verification → context assembly → LLM completion → tool call routing → cost tracking → metric recording. | Internal to `NAOSAgent.process()` |
| **Metrics Aggregator** | Automatically rolls up per-request metrics (tokens, cost, latency, tool calls) into hourly/daily/weekly/monthly aggregates in `naos_agent_metrics`. | Background cron via `@mcv/fabric` |

#### Capability Model

```typescript
type AgentCapability = 
  | 'read'       // Query data, read files, fetch information
  | 'write'      // Modify data, create files, update records
  | 'execute'    // Run code, deploy, trigger workflows
  | 'approve'    // Approve/reject HITL requests
  | 'delegate'   // Assign tasks to other agents
  | 'external'   // Communicate outside the system (email, API)
  | 'financial'; // Process financial transactions
```

Every instrument declares a `requiredCapability`. The NAOS runtime verifies the requesting agent's capability list before execution. Missing capabilities throw `AgentError` with code `CAPABILITY_DENIED`.

#### Cost Budget Enforcement

Each agent has a per-request cost budget (`constraints.costBudgetUSD`). The runtime tracks token usage and cost accumulation across all tool calls within a single request. Exceeding the budget terminates the request with error code `COST_BUDGET_EXCEEDED`, ensuring no runaway agent can incur unbounded expenses.

```
Request Start → costAccumulator = 0.0
  Tool Call 1 → costAccumulator += $0.003
  Tool Call 2 → costAccumulator += $0.012
  LLM Call 1  → costAccumulator += $0.045
  Tool Call 3 → costAccumulator += $0.008
  LLM Call 2  → costAccumulator > budget? → ABORT
```

#### Agent Lifecycle States

```
┌──────────┐   register()   ┌──────────┐   pause()    ┌──────────────┐
│          │───────────────►│          │──────────────►│              │
│  (new)   │                │  ACTIVE  │               │   PAUSED     │
│          │                │          │◄──────────────│              │
└──────────┘                └─────┬────┘   resume()    └──────────────┘
                                  │
                            maintain()
                                  │
                                  ▼
                            ┌──────────────┐   retire()   ┌──────────┐
                            │              │─────────────►│          │
                            │ MAINTENANCE  │               │ RETIRED  │
                            │              │               │          │
                            └──────────────┘               └──────────┘
```

---

### Queen — Strategic Orchestrator

#### Purpose

The Queen is the **strategic brain** of the NAOS hierarchy. She receives high-level requests from humans or system events, analyzes intent, decomposes complex requests into atomic task graphs, assesses risk and HITL requirements, allocates resources to Ralph pods, dispatches execution, and aggregates results into a unified response. The Queen never executes work directly — she only plans and delegates.

#### Internal Architecture

```
┌──────────────────────────────────────────────────────────────────────┐
│                            QUEEN                                      │
│                                                                       │
│  ┌─────────────────────────────────────────────────────────────────┐ │
│  │                    REQUEST ANALYSIS                              │ │
│  │                                                                  │ │
│  │  1. Parse intent (what is the user trying to accomplish?)       │ │
│  │  2. Identify domains (marketing? development? finance?)         │ │
│  │  3. Assess complexity (simple / moderate / complex / critical)  │ │
│  │  4. Load relevant context from Neural Hive-Mind (Memory)        │ │
│  └──────────────────────────────┬──────────────────────────────────┘ │
│                                 ▼                                     │
│  ┌──────────────────────────────────────────────────────────────┐    │
│  │                   TASK PLANNER                                │    │
│  │                                                               │    │
│  │  • Break intent into atomic tasks (each assignable to 1 pod) │    │
│  │  • Identify inter-task dependencies (task B needs output of A)│    │
│  │  • Validate task graph (no cycles via DFS, all deps exist)   │    │
│  │  • Optimize execution order (topological sort + priority)     │    │
│  └──────────────────────────────┬────────────────────────────────┘    │
│                                 ▼                                     │
│  ┌──────────────────────────────────────────────────────────────┐    │
│  │                   RISK ASSESSOR                               │    │
│  │                                                               │    │
│  │  • Check for high-risk instruments in task plan              │    │
│  │  • Check cost thresholds ($500+ triggers High)               │    │
│  │  • Check for external communications                         │    │
│  │  • Determine HITL requirements and approver roles            │    │
│  └──────────────────────────────┬────────────────────────────────┘    │
│                                 ▼                                     │
│  ┌──────────────────────────────────────────────────────────────┐    │
│  │                  RESOURCE ALLOCATOR                            │    │
│  │                                                               │    │
│  │  • Group tasks into parallel execution waves                 │    │
│  │  • Assign each task to a specific Ralph pod type             │    │
│  │  • Select model tier (economy/standard/premium/reasoning)    │    │
│  │  • Set token budgets and timeouts per task                   │    │
│  │  • Estimate total duration and cost                          │    │
│  └──────────────────────────────┬────────────────────────────────┘    │
│                                 ▼                                     │
│  ┌──────────────────────────────────────────────────────────────┐    │
│  │                  DISPATCH & AGGREGATE                         │    │
│  │                                                               │    │
│  │  • Route through HITL if required (block until approved)     │    │
│  │  • Dispatch parallel groups in dependency order              │    │
│  │  • Monitor execution progress via event stream               │    │
│  │  • Handle failures (retry strategy or re-plan)               │    │
│  │  • Aggregate results into unified StrategicResponse          │    │
│  └──────────────────────────────────────────────────────────────┘    │
└──────────────────────────────────────────────────────────────────────┘
```

#### Task Decomposition Algorithm

1. **Intent Analysis** — The Queen uses a planning-optimized model (Claude Sonnet) to analyze the request, identifying target domains, required capabilities, and complexity level.

2. **Task Graph Construction** — The planner generates a directed acyclic graph (DAG) of atomic tasks. Each task specifies: `id`, `type`, `title`, `description`, `targetPod`, `instruments`, `dependencies[]`, `priority`, `estimatedDurationMs`, `estimatedCostUSD`.

3. **Cycle Detection** — DFS-based cycle detection validates the DAG. If cycles are found, `PlanningError` is thrown and the Queen re-plans with explicit acyclicity constraints.

4. **Topological Sorting** — Tasks are topologically sorted with priority as the tie-breaker. Tasks with no dependencies form the first parallel group; subsequent groups form as their dependencies complete.

5. **Adaptive Re-Planning** — If a task fails during execution, the Queen can re-plan remaining tasks, potentially routing to different pods or simplifying the approach.

#### Risk Assessment Matrix

| Condition | Risk Level | HITL Required | Approvers |
|-----------|-----------|--------------|-----------|
| Read-only operations, internal queries | **Low** | No | — |
| Data modifications, standard API calls | **Medium** | Yes (1 approver) | Manager ×1 |
| Financial transactions, user data changes | **High** | Yes (2 approvers) | Manager ×1 + Executive ×1 |
| System configuration, security changes, bulk ops | **Critical** | Yes (3 approvers) | Executive ×2 + Security ×1 |
| Cost exceeds $500 per request | **High** | Yes | Manager ×1 + Finance ×1 |
| External communication (email, SMS, social) | **Medium** | Yes | Manager ×1 |

#### Queen Capabilities & Constraints

```typescript
// Queen is planning-only — never executes side effects directly
const QUEEN_CONFIG = {
  capabilities: ['read', 'delegate', 'approve'],  // NO write, execute, financial
  constraints: {
    maxTokensPerTurn: 16000,
    maxToolCalls: 0,           // Queen doesn't use tools directly
    timeoutMs: 900000,         // 15 minutes max for full request lifecycle
    costBudgetUSD: 50.0,       // Budget covers all delegated tasks
    requiresHITL: [],          // Queen's planning doesn't need HITL
    forbiddenActions: [],      // Queen doesn't act — she delegates
  },
  planningModel: { model: 'claude-opus-4', tier: 'reasoning' },
  maxConcurrentTasks: 20,
};
```

---

### Swarm — Ralph Execution Pods & Multi-Agent Coordination

#### Purpose

The Swarm module manages the **Ralph execution pods** — specialized AI worker agents that perform the actual work delegated by Queen. Each Ralph pod has a domain specialization, a curated set of instruments, and a tailored system prompt. The Swarm also provides the **Worker Pool** for dynamic scaling, the **Swarm Dispatcher** for parallel task execution, and the **trajectory logging system** for learning from execution traces.

#### Ralph Pod Specializations

| Pod | Slug | Role | Capabilities | Key Instruments | Max Concurrent |
|-----|------|------|-------------|-----------------|----------------|
| **Smith** | `smith` | Engineer | read, write, execute, external | `code_edit`, `code_review`, `git_operations`, `test_runner`, `deployment`, `database_migration`, `api_call` | 3 |
| **Growth** | `growth` | Marketer | read, write, external | `campaign_builder`, `content_generator`, `analytics_query`, `social_scheduler`, `email_sender`, `ab_test` | 5 |
| **Director** | `director` | Operator | read, write, delegate | `workflow_builder`, `task_manager`, `calendar_operations`, `meeting_scheduler`, `document_manager` | 10 |
| **Ledger** | `ledger` | Accountant | read, financial | `invoice_generator`, `payment_processor`, `report_builder`, `budget_tracker`, `expense_manager` | 3 |
| **Scribe** | `scribe` | Writer | read, write | `content_writer`, `editor`, `translator`, `summarizer`, `seo_optimizer`, `plagiarism_checker` | 5 |
| **Oracle** | `oracle` | Analyst | read | `data_query`, `visualization_builder`, `insight_generator`, `trend_analyzer`, `forecast_model` | 5 |
| **Herald** | `herald` | Communicator | read, external | `email_composer`, `notification_sender`, `slack_messenger`, `sms_sender`, `template_manager` | 20 |
| **Shield** | `shield` | Guardian | read, write | `access_auditor`, `threat_scanner`, `incident_reporter`, `permission_manager`, `compliance_checker` | 3 |

#### Task Execution Loop

```
┌─────────────────────────────────────────────────────────────────┐
│                    RALPH POD EXECUTION LOOP                      │
│                                                                  │
│  1. INITIALIZE                                                   │
│     ├─ Load system prompt (pod-specific + venture persona)       │
│     ├─ Build task prompt (instructions + input data)             │
│     ├─ Prepare instruments (tool definitions for LLM)            │
│     └─ Initialize trajectory recorder                            │
│                                                                  │
│  2. EXECUTION LOOP (max 10 iterations)                           │
│     ┌─────────────────────────────────────────────────────────┐ │
│     │  LLM Completion                                          │ │
│     │  ├─ Send messages + tool definitions to model            │ │
│     │  ├─ Receive response (text or tool calls)                │ │
│     │  │                                                       │ │
│     │  │  finish_reason == 'stop'?                             │ │
│     │  │    YES → Parse result → Return TaskResult             │ │
│     │  │    NO  → Process tool calls:                          │ │
│     │  │          ├─ Validate capability                       │ │
│     │  │          ├─ Check rate limits                          │ │
│     │  │          ├─ Execute instrument                        │ │
│     │  │          ├─ Log to trajectory                          │ │
│     │  │          ├─ Accumulate cost                            │ │
│     │  │          └─ Append tool results to message history    │ │
│     │  │                                                       │ │
│     │  └─ Budget exceeded? → ABORT with COST_BUDGET_EXCEEDED   │ │
│     └─────────────────────────────────────────────────────────┘ │
│                                                                  │
│  3. FINALIZE                                                     │
│     ├─ Record trajectory (steps, tokens, cost, outcome)          │
│     ├─ Compute reward signal for learning                        │
│     ├─ Flag as exemplar/failure case if applicable               │
│     └─ Publish task.completed / task.failed event                │
└─────────────────────────────────────────────────────────────────┘
```

#### Worker Pool Architecture

The Worker Pool provides dynamic scaling for Ralph pod execution:

```
┌───────────────────────────────────────────────────────────┐
│                     WORKER POOL                            │
│                                                            │
│  ┌─────────────────────────────────────────────────────┐  │
│  │  Priority Queue (Redis Sorted Set)                   │  │
│  │                                                      │  │
│  │  Score = (priority_weight * 1000) + timestamp        │  │
│  │  Critical tasks always dequeue first                 │  │
│  └──────────────────────┬──────────────────────────────┘  │
│                         │                                  │
│  ┌──────────────────────▼──────────────────────────────┐  │
│  │  Worker Scaling Engine                               │  │
│  │                                                      │  │
│  │  minWorkers: 2      maxWorkers: 20                  │  │
│  │  scaleUpThreshold: queue_depth > 5                  │  │
│  │  scaleDownDelay: 300s idle                          │  │
│  │  workerIdleTimeout: 600s                            │  │
│  └──────────────────────┬──────────────────────────────┘  │
│                         │                                  │
│  ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐ │
│  │Worker 1│ │Worker 2│ │Worker 3│ │Worker 4│ │  ...   │ │
│  │(Smith) │ │(Growth)│ │(Oracle)│ │(Smith) │ │        │ │
│  └────────┘ └────────┘ └────────┘ └────────┘ └────────┘ │
└───────────────────────────────────────────────────────────┘
```

**Scaling Rules:**

| Condition | Action |
|-----------|--------|
| Queue depth > `scaleUpThreshold` | Spawn new worker (up to `maxWorkers`) |
| Worker idle > `workerIdleTimeoutMs` | Terminate worker (down to `minWorkers`) |
| Task priority == `critical` | Preempt non-critical queue items |
| Pod type at max concurrent | Queue task until slot opens |

#### Model Tier Selection

The Resource Allocator selects model tiers based on task complexity and domain:

| Task Domain | Default Tier | Model Examples | Token Budget |
|-------------|-------------|----------------|--------------|
| Development | `premium` | Claude Opus, Sonnet | 8,000 |
| Analytics | `standard` | Claude Sonnet, GPT-4o | 6,000 |
| Content | `standard` | Claude Sonnet, GPT-4o | 8,000 |
| Communications | `economy` | Claude Haiku, GPT-3.5 | 4,000 |
| Finance | `premium` | Claude Opus, Sonnet | 6,000 |
| Operations | `standard` | Claude Sonnet, GPT-4o | 6,000 |
| Security | `premium` | Claude Opus, Sonnet | 6,000 |
| Marketing | `standard` | Claude Sonnet, GPT-4o | 6,000 |

#### Trajectory Learning System

Every task execution produces a **trajectory record** that captures the complete execution trace:

```typescript
interface Trajectory {
  id: string;
  taskId: string;
  agentId: string;
  taskType: TaskType;
  taskInput: Record<string, unknown>;
  
  // Step-by-step execution trace
  steps: Array<{
    step: number;
    action: 'tool_call' | 'llm_completion' | 'reasoning';
    tool?: string;
    input?: Record<string, unknown>;
    output?: Record<string, unknown>;
    reasoning?: string;
    durationMs: number;
  }>;
  
  // Outcome and metrics
  outcome: 'success' | 'partial' | 'failure';
  totalDurationMs: number;
  totalTokens: number;
  totalToolCalls: number;
  totalCostUsd: number;
  
  // Learning signals
  rewardSignal: number;       // -1.0 to 1.0
  isExemplar: boolean;         // Flag for few-shot prompting
  isFailureCase: boolean;      // Flag for debugging
  humanFeedback?: string;      // Optional human review
  humanRating?: number;        // 1-5 scale
}
```

Trajectories serve three purposes:
1. **Compliance Auditing** — Full trace of every AI action for regulatory review
2. **Few-Shot Prompting** — Exemplar trajectories are used as few-shot examples to improve future task execution
3. **Performance Optimization** — Aggregate analysis of trajectories identifies bottleneck instruments, suboptimal model tier choices, and failure patterns

---

### Scouts — Specialized Worker Agents & Monitoring Network

#### Purpose

Scouts are **autonomous monitoring agents** that observe system behavior, collect metrics, detect anomalies, and raise alerts — without ever taking action. They are the sensory cortex of the Agentic OS, providing the telemetry data that Queen uses for adaptive planning and that operators use for system oversight.

#### Internal Architecture

```
┌──────────────────────────────────────────────────────────────────────┐
│                         SCOUT NETWORK                                 │
│                                                                       │
│  ┌────────────────────────────────────────────────────────────────┐  │
│  │                    SCOUT SCHEDULER                              │  │
│  │                                                                 │  │
│  │  Cron expressions → Next run calculation → Dispatch             │  │
│  │  Supports: cron | interval | event-triggered                    │  │
│  └──────────────────────────┬─────────────────────────────────────┘  │
│                              │                                        │
│  ┌──────────────────────────▼─────────────────────────────────────┐  │
│  │                    COLLECTOR ENGINE                              │  │
│  │                                                                 │  │
│  │  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐          │  │
│  │  │  HTTP   │  │  TCP    │  │Database │  │ Metrics │          │  │
│  │  │Collector│  │Collector│  │Collector│  │Collector│          │  │
│  │  └────┬────┘  └────┬────┘  └────┬────┘  └────┬────┘          │  │
│  │       └────────────┴────────────┴────────────┘                │  │
│  └──────────────────────────┬─────────────────────────────────────┘  │
│                              │ observations                           │
│  ┌──────────────────────────▼─────────────────────────────────────┐  │
│  │                   ANOMALY DETECTOR                              │  │
│  │                                                                 │  │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐         │  │
│  │  │ Z-Score  │ │   IQR    │ │ Isolation│ │ Prophet  │         │  │
│  │  │          │ │          │ │  Forest  │ │          │         │  │
│  │  └──────────┘ └──────────┘ └──────────┘ └──────────┘         │  │
│  └──────────────────────────┬─────────────────────────────────────┘  │
│                              │ anomalies detected                     │
│  ┌──────────────────────────▼─────────────────────────────────────┐  │
│  │                   ALERT MANAGER                                 │  │
│  │                                                                 │  │
│  │  Threshold check → Deduplication → Severity → Notification     │  │
│  │  Channels: Slack, PagerDuty, Email, In-App, Push               │  │
│  └────────────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────────────┘
```

#### Scout Types

| Type | Purpose | Typical Schedule | Example |
|------|---------|-----------------|---------|
| `system_health` | Monitor infrastructure uptime and response times | Every 1 minute | API Gateway health check |
| `performance` | Track response time percentiles, throughput, queue depth | Every 5 minutes | P95 latency monitoring |
| `security` | Scan for vulnerabilities, unauthorized access attempts | Every 15 minutes | Failed auth attempt spikes |
| `compliance` | Verify regulatory compliance and policy adherence | Every 6 hours | PII exposure scanning |
| `cost` | Monitor API costs, token usage, infrastructure spend | Every hour | OpenRouter spend tracking |
| `anomaly_detection` | Detect statistical anomalies in time-series data | Every 5 minutes | Revenue anomaly detection |
| `data_collection` | Gather metrics for reporting and analysis | Every 15 minutes | SERP position tracking |

#### Anomaly Detection Algorithms

| Algorithm | Distribution | Speed | Best For |
|-----------|-------------|-------|----------|
| **Z-Score** | Normal | ~1ms | Normally distributed metrics (latency, throughput) |
| **IQR** | Any | ~2ms | Skewed distributions, outlier detection (costs, errors) |
| **Isolation Forest** | Any | ~50ms | Multi-dimensional anomalies (correlated metrics) |
| **Prophet** | Seasonal | ~200ms | Seasonal time series with trends (daily traffic patterns) |
| **LSTM** | Complex | ~500ms | Complex temporal patterns (fraud detection signals) |

#### Alert Lifecycle

```
┌──────────┐   threshold   ┌──────────┐   ack()     ┌──────────────┐
│          │  exceeded     │          │────────────►│              │
│  (none)  │──────────────►│   OPEN   │             │ ACKNOWLEDGED │
│          │               │          │             │              │
└──────────┘               └────┬─────┘             └──────┬───────┘
                                │                          │
                           snooze()                   resolve()
                                │                          │
                                ▼                          ▼
                           ┌──────────┐            ┌──────────┐
                           │          │            │          │
                           │ SNOOZED  │            │ RESOLVED │
                           │          │──(wakes)──►│          │
                           └──────────┘   OPEN     └──────────┘
```

**Alert Deduplication:** Consecutive alerts for the same condition are deduplicated. Only the first alert fires; subsequent observations update the existing open alert's metadata until it is resolved.

#### Key Behaviors

1. **Observe-only** — Scouts have `capabilities: ['read']` only. They cannot modify data, send communications, or execute code.
2. **Multi-collector execution** — Each scout can run multiple collectors (HTTP, TCP, database, metrics, custom) per execution, producing a unified observation record.
3. **Threshold cascading** — Observations are checked against multiple thresholds. Exceeding a threshold triggers alert generation with severity determined by deviation magnitude.
4. **Alert routing** — Different severity levels route to different channels: `warning` → Slack, `critical` → Slack + PagerDuty + Email.

---

### HITL — Human-in-the-Loop Approval Workflows

#### Purpose

The HITL module ensures **human oversight** of all high-risk AI operations. It implements a complete approval lifecycle: request creation, multi-channel notification, multi-step workflow processing, quorum-based voting, timeout escalation, and full audit trails. Every operation flagged by the Queen's risk assessor must pass through HITL before execution proceeds.

#### Approval Workflow State Machine

```
┌──────────┐   create()    ┌──────────┐
│          │──────────────►│          │
│  (new)   │               │ PENDING  │
│          │               │          │
└──────────┘               └─────┬────┘
                                 │
                   ┌─────────────┼─────────────┬──────────────┐
                   │             │              │              │
              approve(s)    reject(1)      timeout         cancel()
                   │             │              │              │
                   ▼             ▼              ▼              ▼
          ┌──────────────┐ ┌──────────┐ ┌──────────────┐ ┌──────────┐
          │ Quorum met?  │ │          │ │ Check        │ │          │
          │              │ │ REJECTED │ │ escalation   │ │CANCELLED │
          │ YES → next   │ │          │ │ rules        │ │          │
          │ NO  → wait   │ └──────────┘ └──────┬───────┘ └──────────┘
          └──────┬───────┘                      │
                 │                    ┌─────────┼─────────┐
                 │ all steps done     │         │         │
                 ▼                 escalate  auto_appr  auto_rej
          ┌──────────────┐           │         │         │
          │              │           ▼         ▼         ▼
          │   APPROVED   │     ┌──────────┐ ┌────────┐ ┌────────┐
          │              │     │ESCALATED │ │APPROVED│ │REJECTED│
          │  (execution  │     │(add new  │ │(system)│ │(timeout│
          │   proceeds)  │     │ approver)│ │        │ │  rule) │
          └──────────────┘     └──────────┘ └────────┘ └────────┘
```

#### Quorum Modes

| Mode | Description | Example |
|------|-------------|---------|
| `majority` | >50% of approvers must approve | 2 of 3 approvers approve → approved |
| `unanimous` | 100% must approve; single rejection fails | 1 rejection → entire request rejected |
| `threshold` | Configurable percentage (e.g., 75%) | 3 of 4 (75%) → approved |

#### Escalation Rules

When 75% of the deadline has elapsed without resolution, the escalation manager activates:

| Action | Description |
|--------|-------------|
| `add_approver` | Add a higher-level approver to the request |
| `auto_approve` | Automatically approve (for low-risk operations only) |
| `auto_reject` | Automatically reject (fail-safe default) |
| `notify_executive` | Send urgent notification to executive team |

#### Dual Storage Strategy

HITL requests are stored in **two locations** for optimal performance:

- **PostgreSQL** — Durability, querying, audit trail, compliance reporting
- **Redis Sorted Sets** — Fast queue operations, deadline-based ordering, real-time status checks

The Redis sorted set key is `hitl:queue:{ventureId}` with score = deadline timestamp, enabling O(log N) insertion and O(1) retrieval of the next-expiring request.

#### Notification Channels

Approvers are notified via multiple channels with reminder cadence:

| Channel | Trigger | Reminder at 50% | Reminder at 75% |
|---------|---------|-----------------|-----------------|
| In-app notification | Immediate | ✓ | ✓ |
| Email | Immediate | ✓ | ✓ |
| Slack DM | Immediate | ✓ | ✓ |
| Push notification | Immediate | — | ✓ |

---

### Memory — Agent Memory Persistence and Retrieval

#### Purpose

The Memory module, known as the **Neural Hive-Mind**, is the cognitive persistence layer of the Agentic OS. It enables agents to transcend LLM context window limitations by treating knowledge as a programmatic, external environment. The system implements four memory types, recursive Deep RAG retrieval, Knowledge Graph integration, and automatic consolidation.

#### Tri-Modal Storage Architecture

```
┌──────────────────────────────────────────────────────────────────────────┐
│                          NEURAL HIVE-MIND                                │
│                                                                          │
│  ┌─────────────────────┐  ┌─────────────────────┐  ┌────────────────┐  │
│  │  1. EPISODIC STORE  │  │  2. SEMANTIC STORE   │  │ 3. WORKING MEM │  │
│  │    (PostgreSQL)      │  │  (Neo4j + pgvector)  │  │   (Redis)      │  │
│  ├─────────────────────┤  ├─────────────────────┤  ├────────────────┤  │
│  │ Raw event logs       │  │ Entities & Relations │  │ Active session │  │
│  │ Input/Output pairs   │  │ Validated facts      │  │ Local state    │  │
│  │ Tool call traces     │  │ Embedded chunks      │  │ Short-term     │  │
│  │ Importance scores    │  │ Recursive search     │  │  context cache │  │
│  └──────────┬──────────┘  └──────────┬──────────┘  └───────┬────────┘  │
│             └────────────────────────┼──────────────────────┘           │
│                                      │                                   │
│  ┌───────────────────────────────────▼────────────────────────────────┐  │
│  │                CONTEXT CONSOLIDATION ENGINE                        │  │
│  │                                                                    │  │
│  │  1. Ingest Episodic Memory (Raw Experience)                       │  │
│  │  2. Analyze for Learnings (LLM Synthesis)                         │  │
│  │  3. Extract Entities & Relations (Knowledge Graph)                │  │
│  │  4. Update Vector Chunks (Semantic Search)                        │  │
│  │  5. Resolve Contradictions (Confidence Comparison)                │  │
│  └────────────────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────────────────┘
```

#### Memory Types

| Type | Storage | Retention | Use Case |
|------|---------|-----------|----------|
| **Episodic** | PostgreSQL (`agent_episodic_memories`) | 90 days (configurable per agent) | Raw interaction traces — what happened, in order |
| **Semantic** | Neo4j + pgvector (`agent_semantic_chunks`) | Indefinite (until superseded) | Validated facts, knowledge triples (subject-predicate-object) |
| **Procedural** | PostgreSQL (`naos_memory_entries`) | Indefinite | How-to knowledge — learned procedures, best practices |
| **Working** | Redis (TTL = session duration) | Session-scoped | Active context, recent conversation, scratchpad |

#### Deep RAG Process (Recursive Retrieval-Augmented Generation)

```
Agent Query: "What is BetEdge's stake in Malta?"
        │
        ▼
┌───────────────────────────────────────────────────────────────────┐
│  DEPTH 1: Initial Retrieval                                       │
│                                                                   │
│  ┌──────────────────┐     ┌──────────────────┐                   │
│  │ Vector Store      │     │ Knowledge Graph  │                   │
│  │ (cosine search)   │     │ (entity search)  │                   │
│  │                   │     │                   │                   │
│  │ Top 5 results     │     │ BetEdge → Malta   │                   │
│  │ by embedding sim  │     │ relationships     │                   │
│  └────────┬─────────┘     └────────┬──────────┘                   │
│           └────────────┬───────────┘                               │
│                        │                                           │
│  ┌─────────────────────▼───────────────────────────────────────┐  │
│  │  Gap Analysis (Reasoning Engine)                             │  │
│  │                                                              │  │
│  │  "Found licensing entity but missing current status (2026)" │  │
│  │  → Recursive search needed                                  │  │
│  └─────────────────────┬───────────────────────────────────────┘  │
│                        │                                           │
│  DEPTH 2: Recursive Retrieval                                     │
│                                                                   │
│  Vector Search: "BetEdge Malta License 2026 status"              │
│  → Found: License renewal approved Jan 2026                      │
│  → No further gaps detected                                      │
│                                                                   │
│  SYNTHESIZE: Combine Depth 1 + Depth 2 results                  │
│  → Return synthesized answer with citations                      │
└───────────────────────────────────────────────────────────────────┘
```

**Deep RAG Parameters:**
- `maxDepth`: Maximum recursive retrieval depth (default: 3, max: 5)
- `minConfidence`: Minimum confidence to stop recursion (default: 0.85)
- `gapDetectionModel`: Model used for gap analysis (Claude Sonnet)

#### Hybrid Retrieval Scoring

Retrieved memories are scored using a weighted combination:

```
finalScore = (1 - recencyBias) × vectorSimilarity + recencyBias × recencyScore
```

- `vectorSimilarity`: Cosine similarity between query embedding and memory embedding (0.0–1.0)
- `recencyScore`: Exponential decay based on time since last access (0.0–1.0)
- `recencyBias`: Caller-configurable weight (default: 0.3)

#### Consolidation Engine

A cron job (`0 */4 * * *` — every 4 hours) runs the consolidation engine:

1. **Cluster** related episodic memories using embedding similarity
2. **Synthesize** clusters into semantic facts via LLM analysis
3. **Extract** entity-relationship triples for the Knowledge Graph
4. **Embed** new semantic chunks with vector embeddings
5. **Resolve** contradictions by comparing confidence scores (higher wins; loser marked `validUntil: now()`)
6. **Prune** episodic memories older than retention policy

#### Latency Targets

| Store | Target | P99 | Description |
|-------|--------|-----|-------------|
| Working Memory (Redis) | < 5ms | < 10ms | Session state, recent context |
| Semantic Search (pgvector) | < 50ms | < 100ms | Embedding-based retrieval |
| Knowledge Graph (Neo4j) | < 100ms | < 200ms | Entity-relationship queries |
| Deep RAG (Recursive) | < 500ms (p50) | < 800ms (p95) | Multi-hop retrieval with gap filling |
| Consolidation (batch) | < 30s per cluster | — | Background processing |

#### Venture Isolation & PII Scrubbing

- All memory queries are scoped by `ventureId`. Cross-venture queries require `CAPABILITY_GLOBAL_SYNTHESIS`.
- Before episodic memory enters long-term storage, the Shield pod runs a PII sanitizer to strip passwords, API keys, and personal identifiers.

---

### Reasoning — Chain-of-Thought and Reasoning Engine

#### Purpose

The Reasoning module, known as the **Agentic Kernel**, is the logic engine of the Agentic OS. It implements the **Recursive Language Model (RLM)** pattern, treating the LLM not as a creative generator but as a **Cognitive CPU** executing structured logic loops. The module provides multiple reasoning strategies, the SPARC methodology, a truth verification layer, and the Genesis Engine.

#### Agentic Kernel Architecture

```
┌──────────────────────────────────────────────────────────────────────┐
│                      THE AGENTIC KERNEL (RLM)                         │
│                                                                       │
│  ┌─────────────────────────────────────────────────────────────────┐ │
│  │              RECURSIVE REASONING LOOP (CPU)                      │ │
│  │                                                                  │ │
│  │  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐      │ │
│  │  │  DECOMPOSE   │───►│   DISPATCH   │───►│  SYNTHESIZE  │      │ │
│  │  │(Sub-problems)│    │ (Tool/Agent) │    │(Consolidate) │      │ │
│  │  └──────────────┘    └──────────────┘    └──────┬───────┘      │ │
│  │                                                  │              │ │
│  │         ◄──────────── RECURSE ───────────────────┘              │ │
│  └─────────────────────────────────────────────────────────────────┘ │
│                                │                                      │
│                                ▼                                      │
│  ┌─────────────────────────────────────────────────────────────────┐ │
│  │              TRUTH VERIFICATION LAYER                            │ │
│  │                                                                  │ │
│  │   ┌─ Confidence Check (> 0.95 threshold → accept)               │ │
│  │   ├─ Sandbox Experimentation (E2B code execution)               │ │
│  │   ├─ Static Analysis Validation                                 │ │
│  │   └─ Schema Cross-Reference (Drizzle metadata)                  │ │
│  └─────────────────────────────────────────────────────────────────┘ │
│                                │                                      │
│                                ▼                                      │
│  ┌─────────────────────────────────────────────────────────────────┐ │
│  │              GENESIS ENGINE                                      │ │
│  │                                                                  │ │
│  │  [User Intent] → [Researcher] → [Spec Generator]               │ │
│  │        → [Acceptance Criteria] → [Ralph Blueprint]              │ │
│  └─────────────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────────────┘
```

#### Reasoning Strategies

| Strategy | Best For | Approach | Token Cost | Max Depth |
|----------|---------|---------|------------|-----------|
| **Chain-of-Thought** | Sequential problems with clear steps | Linear step-by-step reasoning | Low | 1 |
| **Tree-of-Thought** | Exploratory problems with multiple paths | BFS branching + evaluation + beam search | High | 4 |
| **Self-Consistency** | Problems where confidence matters | Multiple independent CoT paths + majority voting | Medium-High | 1 |
| **Decomposition** | Complex multi-domain problems | Recursive sub-problem splitting | Medium | 5 |
| **Analogical** | Novel problems with known analogues | Find similar solved problems, adapt | Low | 1 |
| **Counterfactual** | Decision analysis and risk assessment | "What if" scenario exploration | Medium | 3 |

#### SPARC Methodology

Every unit of technical work follows the SPARC lifecycle:

```
┌──────────────────────────────────────────────────────────────────┐
│                    SPARC PIPELINE                                  │
│                                                                   │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐              │
│  │     S        │  │     P        │  │     A        │              │
│  │ Specification│─►│ Pseudocode   │─►│ Architecture │              │
│  │              │  │              │  │              │              │
│  │ Requirement  │  │ Logical flow │  │ System design│              │
│  │ analysis &   │  │ & algorithm  │  │ API contracts│              │
│  │ boundaries   │  │ (LLM-only)  │  │ DB schemas   │              │
│  └─────────────┘  └─────────────┘  └──────┬──────┘              │
│                                            │                      │
│  ┌─────────────┐  ┌─────────────┐          │                      │
│  │     C        │  │     R        │◄─────────┘                      │
│  │ Completion   │◄─│ Refinement   │                                  │
│  │              │  │              │                                  │
│  │ Code gen,    │  │ Peer review  │                                  │
│  │ testing,     │  │ (Agent-to-   │                                  │
│  │ documentation│  │  Agent)      │                                  │
│  └─────────────┘  └─────────────┘                                  │
└──────────────────────────────────────────────────────────────────┘
```

#### Truth Verification

The kernel never accepts an LLM assertion as fact without verification if confidence < 0.95:

| Verification Method | When Used | How It Works |
|---------------------|-----------|-------------|
| **Code Execution** | Code-related assertions | Run in E2B sandbox, compare output to assertion |
| **Schema Validation** | Database-related claims | Cross-reference Drizzle ORM metadata |
| **Semantic Cross-Reference** | Factual claims | Query Knowledge Graph for supporting/contradicting evidence |
| **Multi-Model Consensus** | High-stakes decisions | Same question to different LLM (e.g., Claude + Gemini) to avoid confirmation bias |

#### Dual Model Strategy

Task decomposition uses a **planning-optimized model** (e.g., Claude Sonnet), while truth verification uses a **different model** (e.g., Gemini Ultra) to avoid confirmation bias. This ensures the verifier has no knowledge of the planning model's reasoning path.

#### Genesis Engine Pipeline

The Genesis Engine converts human intents into fully contextualized Ralph Blueprints:

```
User Intent
    │
    ▼
┌───────────────────┐     ┌───────────────────┐
│ Researcher Agent  │────►│ Spec Generator    │
│                   │     │                   │
│ Query Neural      │     │ Build acceptance  │
│ Hive-Mind for     │     │ criteria from     │
│ relevant context  │     │ research results  │
└───────────────────┘     └─────────┬─────────┘
                                    │
                                    ▼
                          ┌───────────────────┐
                          │ Blueprint Builder  │
                          │                   │
                          │ Generate markdown │
                          │ document ready    │
                          │ for Ralph Smith   │
                          │ execution         │
                          └───────────────────┘
```

---

### Prompts — Prompt Template Management and Versioning

#### Purpose

The Prompts module manages the **prompt engineering infrastructure** for the entire Agentic OS. It provides a versioned template registry, variable validation, Handlebars-style rendering, multi-step chain orchestration, and A/B testing of prompt variants. Every system prompt, task prompt, reasoning prompt, safety guard, and formatting instruction used by any agent is registered here.

#### Internal Architecture

```
┌──────────────────────────────────────────────────────────────────┐
│                        PROMPT BANK                                │
│                                                                   │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │                 TEMPLATE REGISTRY                            │ │
│  │                                                              │ │
│  │  ┌───────────┐  ┌───────────┐  ┌───────────┐               │ │
│  │  │  System   │  │   Task    │  │ Reasoning │               │ │
│  │  │  Prompts  │  │  Prompts  │  │  Prompts  │               │ │
│  │  └───────────┘  └───────────┘  └───────────┘               │ │
│  │  ┌───────────┐  ┌───────────┐  ┌───────────┐               │ │
│  │  │ Formatting│  │  Safety   │  │  Persona  │               │ │
│  │  │  Prompts  │  │  Guards   │  │  Tuning   │               │ │
│  │  └───────────┘  └───────────┘  └───────────┘               │ │
│  │  ┌───────────┐                                              │ │
│  │  │ Tool Use  │  Immutable after activation.                 │ │
│  │  │  Prompts  │  Updates create new versions.                │ │
│  │  └───────────┘                                              │ │
│  └─────────────────────────────────────────────────────────────┘ │
│                                                                   │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │                RENDERING ENGINE                              │ │
│  │                                                              │ │
│  │  1. Resolve template (by name/id, optional version)         │ │
│  │  2. Validate required variables (Zod schemas)               │ │
│  │  3. Apply defaults for optional variables                   │ │
│  │  4. Render Handlebars template ({{variable}}, {{#if}})      │ │
│  │  5. Increment usage counter                                 │ │
│  └─────────────────────────────────────────────────────────────┘ │
│                                                                   │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │                CHAIN EXECUTOR                                │ │
│  │                                                              │ │
│  │  Step 1 → LLM → output₁                                    │ │
│  │  Step 2 (input: output₁) → LLM → output₂                  │ │
│  │  Step 3 (input: output₂) → LLM → output₃                  │ │
│  │  ...                                                        │ │
│  │  Supports: conditional steps, branching, retry, fail_fast   │ │
│  └─────────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────────┘
```

#### Prompt Categories

| Category | Purpose | Example |
|----------|---------|---------|
| `system` | Agent identity and behavior prompts | Queen system prompt, Ralph Smith system prompt |
| `task` | Task-specific instruction templates | "Analyze this dataset", "Write a blog post" |
| `reasoning` | Reasoning strategy prompts | Chain-of-thought template, tree-of-thought branching |
| `formatting` | Output format instructions | JSON schema formatting, markdown report structure |
| `safety` | Safety guardrails and constraints | Content moderation, PII detection |
| `persona` | Venture-specific personality tuning | BetEdge's casual sports tone vs. Futurestate's professional tone |
| `tool_use` | Instrument usage guidance | "When to use database_query vs. api_call" |

#### Version Management

Templates are **immutable after activation**. Updates create new versions:

```
Version 1 (draft) → Version 1 (active) → Version 2 (draft) → Version 2 (active)
                                            ↑ Version 1 (deprecated)
```

Queries without an explicit version return the latest `active` version. Previous versions remain accessible for rollback and audit.

#### A/B Testing Support

The prompt bank supports traffic-splitting between template versions:

```typescript
// 80% traffic to v2, 20% to v1 (the control)
const prompt = await bank.render('task_decomposition', variables, {
  abTest: {
    variants: [
      { version: 2, weight: 0.8 },  // treatment
      { version: 1, weight: 0.2 },  // control
    ],
    trackingId: requestId,
  },
});
```

Results are tracked in `naos_agent_metrics` and correlated with task success rates to determine the winning variant.

---

## Data Models & Database Schema

### Schema Overview

The Agentic OS uses **18 PostgreSQL tables** managed by Drizzle ORM, plus Redis for working memory and task queues, and Neo4j for the knowledge graph.

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    DATABASE SCHEMA MAP                                    │
│                                                                          │
│  NAOS (3 tables)                                                        │
│  ├─ naos_agents            — Agent definitions and configuration        │
│  ├─ naos_agent_metrics     — Performance and usage tracking             │
│  └─ naos_instruments       — Tool definitions for agents                │
│                                                                          │
│  SWARM / TASKS (4 tables)                                               │
│  ├─ naos_tasks             — Task definitions and execution tracking    │
│  ├─ naos_task_events       — Event log for task execution               │
│  ├─ naos_task_queues       — Queue management for task distribution     │
│  └─ naos_trajectories      — Execution trajectories for learning        │
│                                                                          │
│  HITL (3 tables)                                                        │
│  ├─ naos_hitl_requests     — Human-in-the-loop approval requests        │
│  ├─ naos_hitl_approvals    — Individual approval decisions              │
│  └─ naos_hitl_escalation_rules — Automatic escalation configuration     │
│                                                                          │
│  MEMORY (3 tables + external)                                           │
│  ├─ naos_memory_entries    — Agent memory storage (with vector embed)   │
│  ├─ agent_episodic_memories — Raw interaction traces (append-only)      │
│  ├─ agent_semantic_chunks  — Processed knowledge chunks                 │
│  ├─ [Neo4j]               — Knowledge graph (entity-relationship)       │
│  └─ [Redis]               — Working memory (session-scoped TTL)         │
│                                                                          │
│  PROMPTS (2 tables)                                                     │
│  ├─ naos_prompts           — Prompt template bank                       │
│  └─ naos_prompt_chains     — Chained prompt sequences                   │
│                                                                          │
│  SCOUTS (3 tables)                                                      │
│  ├─ naos_scouts            — Monitoring agent definitions               │
│  ├─ naos_scout_observations — Collected data points                     │
│  └─ naos_alerts            — Alert tracking                             │
└─────────────────────────────────────────────────────────────────────────┘
```

### Core Tables — Detailed Schema

#### naos_agents

```sql
CREATE TABLE naos_agents (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  venture_id        UUID NOT NULL REFERENCES ventures(id),
  name              VARCHAR(100) NOT NULL,
  slug              VARCHAR(100) NOT NULL,
  type              naos_agent_type NOT NULL,           -- queen | ralph | scout | specialist
  description       TEXT,
  capabilities      naos_capability[] NOT NULL DEFAULT '{}',
  model_config      JSONB NOT NULL DEFAULT '{}',
  instruments       TEXT[] NOT NULL DEFAULT '{}',
  constraints       JSONB NOT NULL DEFAULT '{}',
  memory_config     JSONB DEFAULT '{}',
  system_prompt     TEXT,
  status            naos_agent_status DEFAULT 'active', -- active | paused | maintenance | retired
  metadata          JSONB DEFAULT '{}',
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(venture_id, slug)
);
```

#### naos_tasks

```sql
CREATE TABLE naos_tasks (
  id                     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  venture_id             UUID NOT NULL REFERENCES ventures(id),
  parent_task_id         UUID REFERENCES naos_tasks(id),
  root_task_id           UUID REFERENCES naos_tasks(id),
  assigned_agent_id      UUID REFERENCES naos_agents(id),
  target_pod_type        VARCHAR(50),
  title                  VARCHAR(500) NOT NULL,
  description            TEXT,
  type                   naos_task_type NOT NULL,
  priority               naos_priority DEFAULT 'medium',
  instruments            TEXT[] DEFAULT '{}',
  dependencies           UUID[] DEFAULT '{}',
  input                  JSONB NOT NULL DEFAULT '{}',
  output                 JSONB,
  context                JSONB DEFAULT '{}',
  status                 naos_task_status DEFAULT 'pending',
  -- pending → queued → assigned → running → waiting_hitl → completed | failed | cancelled | timeout
  estimated_duration_ms  INTEGER,
  estimated_cost_usd     NUMERIC(10,4),
  actual_duration_ms     INTEGER,
  actual_cost_usd        NUMERIC(10,4),
  tokens_used            INTEGER,
  tool_calls_made        INTEGER,
  queued_at              TIMESTAMPTZ,
  started_at             TIMESTAMPTZ,
  completed_at           TIMESTAMPTZ,
  deadline               TIMESTAMPTZ,
  error_message          TEXT,
  retry_count            INTEGER DEFAULT 0,
  max_retries            INTEGER DEFAULT 3,
  requires_hitl          BOOLEAN DEFAULT FALSE,
  hitl_request_id        UUID,
  created_by             UUID,
  created_at             TIMESTAMPTZ DEFAULT NOW(),
  updated_at             TIMESTAMPTZ DEFAULT NOW()
);
```

#### naos_hitl_requests

```sql
CREATE TABLE naos_hitl_requests (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  venture_id        UUID NOT NULL REFERENCES ventures(id),
  request_type      naos_hitl_request_type NOT NULL,
  -- task_approval | financial_approval | data_access | external_communication | configuration_change | escalation
  source_task_id    UUID REFERENCES naos_tasks(id),
  source_agent_id   UUID REFERENCES naos_agents(id),
  title             VARCHAR(500) NOT NULL,
  description       TEXT NOT NULL,
  risk_level        naos_risk_level NOT NULL,            -- low | medium | high | critical
  risk_factors      JSONB DEFAULT '[]',
  tasks             JSONB NOT NULL DEFAULT '[]',
  required_approvers JSONB NOT NULL DEFAULT '[]',
  context           JSONB DEFAULT '{}',
  status            naos_hitl_status DEFAULT 'pending',  -- pending | approved | rejected | expired | cancelled
  deadline          TIMESTAMPTZ NOT NULL,
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  resolved_at       TIMESTAMPTZ,
  final_decision    naos_hitl_status,
  final_comments    TEXT,
  conditions        JSONB,
  escalated_at      TIMESTAMPTZ,
  escalation_reason TEXT
);
```

#### naos_memory_entries

```sql
CREATE TABLE naos_memory_entries (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  venture_id        UUID NOT NULL REFERENCES ventures(id),
  agent_id          UUID REFERENCES naos_agents(id),
  memory_type       naos_memory_type NOT NULL,           -- episodic | semantic | procedural | working
  category          VARCHAR(100),
  content           TEXT NOT NULL,
  summary           TEXT,
  source_type       VARCHAR(50) NOT NULL,                -- task | conversation | explicit | inferred
  source_id         UUID,
  importance        NUMERIC(3,2) DEFAULT 0.5,            -- 0.00 to 1.00
  confidence        NUMERIC(3,2) DEFAULT 1.0,
  embedding         VECTOR(3072),                         -- pgvector for semantic search
  related_entities  JSONB DEFAULT '[]',
  tags              TEXT[] DEFAULT '{}',
  valid_from        TIMESTAMPTZ DEFAULT NOW(),
  valid_until       TIMESTAMPTZ,                          -- NULL = currently valid
  access_count      INTEGER DEFAULT 0,
  last_accessed_at  TIMESTAMPTZ,
  status            naos_memory_status DEFAULT 'active', -- active | archived | superseded | deleted
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for vector similarity search
CREATE INDEX ON naos_memory_entries 
  USING ivfflat (embedding vector_cosine_ops) 
  WITH (lists = 100);
```

#### naos_trajectories

```sql
CREATE TABLE naos_trajectories (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  venture_id        UUID NOT NULL REFERENCES ventures(id),
  task_id           UUID NOT NULL REFERENCES naos_tasks(id),
  agent_id          UUID NOT NULL REFERENCES naos_agents(id),
  task_type         naos_task_type NOT NULL,
  task_input        JSONB NOT NULL,
  steps             JSONB NOT NULL DEFAULT '[]',
  outcome           naos_trajectory_outcome NOT NULL,     -- success | partial | failure
  task_output       JSONB,
  error_message     TEXT,
  total_duration_ms INTEGER NOT NULL,
  total_tokens      INTEGER NOT NULL,
  total_tool_calls  INTEGER NOT NULL,
  total_cost_usd    NUMERIC(10,4) NOT NULL,
  reward_signal     NUMERIC(3,2),                         -- -1.0 to 1.0
  reward_components JSONB DEFAULT '{}',
  human_feedback    TEXT,
  human_rating      INTEGER,                               -- 1–5
  is_exemplar       BOOLEAN DEFAULT FALSE,
  is_failure_case   BOOLEAN DEFAULT FALSE,
  created_at        TIMESTAMPTZ DEFAULT NOW()
);
```

### Enum Types

```sql
CREATE TYPE naos_agent_type AS ENUM ('queen', 'ralph', 'scout', 'specialist');
CREATE TYPE naos_agent_status AS ENUM ('active', 'paused', 'maintenance', 'retired');
CREATE TYPE naos_capability AS ENUM ('read', 'write', 'execute', 'approve', 'delegate', 'external', 'financial');
CREATE TYPE naos_task_type AS ENUM ('development', 'marketing', 'operations', 'finance', 'content', 'analytics', 'communications', 'security');
CREATE TYPE naos_task_status AS ENUM ('pending', 'queued', 'assigned', 'running', 'waiting_hitl', 'completed', 'failed', 'cancelled', 'timeout');
CREATE TYPE naos_priority AS ENUM ('low', 'medium', 'high', 'critical');
CREATE TYPE naos_risk_level AS ENUM ('low', 'medium', 'high', 'critical');
CREATE TYPE naos_hitl_request_type AS ENUM ('task_approval', 'financial_approval', 'data_access', 'external_communication', 'configuration_change', 'escalation');
CREATE TYPE naos_hitl_status AS ENUM ('pending', 'approved', 'rejected', 'expired', 'cancelled');
CREATE TYPE naos_approval_decision AS ENUM ('approve', 'reject', 'delegate', 'abstain');
CREATE TYPE naos_memory_type AS ENUM ('episodic', 'semantic', 'procedural', 'working');
CREATE TYPE naos_memory_status AS ENUM ('active', 'archived', 'superseded', 'deleted');
CREATE TYPE naos_trajectory_outcome AS ENUM ('success', 'partial', 'failure');
CREATE TYPE naos_scout_type AS ENUM ('system_health', 'anomaly_detection', 'data_collection', 'performance', 'security', 'compliance');
CREATE TYPE naos_observation_severity AS ENUM ('info', 'warning', 'error', 'critical');
CREATE TYPE naos_alert_status AS ENUM ('open', 'acknowledged', 'resolved', 'snoozed');
CREATE TYPE naos_prompt_status AS ENUM ('draft', 'active', 'deprecated');
CREATE TYPE naos_task_event_type AS ENUM ('created', 'queued', 'assigned', 'started', 'progress', 'tool_called', 'tool_result', 'hitl_requested', 'hitl_completed', 'completed', 'failed', 'cancelled', 'retried', 'timeout');
```

### Row-Level Security (RLS) Policy

All tables enforce venture isolation through Supabase RLS:

```sql
-- Example: naos_agents table RLS
ALTER TABLE naos_agents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Venture isolation for agents"
  ON naos_agents
  FOR ALL
  USING (venture_id = auth.jwt() -> 'venture_id')
  WITH CHECK (venture_id = auth.jwt() -> 'venture_id');

-- Queen cross-venture access (with CAPABILITY_GLOBAL_SYNTHESIS)
CREATE POLICY "Queen global synthesis"
  ON naos_memory_entries
  FOR SELECT
  USING (
    venture_id = auth.jwt() -> 'venture_id'
    OR EXISTS (
      SELECT 1 FROM naos_agents 
      WHERE id = auth.jwt() -> 'agent_id' 
      AND 'global_synthesis' = ANY(capabilities)
    )
  );
```

### Redis Data Structures

| Key Pattern | Type | Purpose | TTL |
|-------------|------|---------|-----|
| `working_memory:{sessionId}` | Hash | Agent working memory per session | Session duration |
| `hitl:queue:{ventureId}` | Sorted Set | Pending HITL requests (score = deadline) | None |
| `task:queue:{podType}` | List | Pod-specific task queues | None |
| `agent:status:{agentId}` | String | Real-time agent status | 60s refresh |
| `metrics:realtime:{agentId}` | Hash | Real-time metrics counters | 1 hour |
| `rate_limit:{instrumentId}:{agentId}` | String | Instrument rate limit counters | Per-minute/hour window |
| `lock:task:{taskId}` | String | Distributed lock for task assignment | 30s |

---

## Data Flow & Events

### Event Architecture (Redpanda/Kafka)

The Agentic OS publishes and consumes events through `@mcv/fabric`'s Redpanda/Kafka integration. Events enable decoupled communication between subsystems and provide an immutable audit log.

#### Event Topics

| Topic | Publisher | Consumers | Description |
|-------|-----------|-----------|-------------|
| `agentic.agent.lifecycle` | NAOS | Scouts, Metrics, Dashboard | Agent registered, status changed, retired |
| `agentic.task.lifecycle` | Swarm | Queen, Memory, Metrics | Task created, started, completed, failed |
| `agentic.task.progress` | Ralph Pods | Dashboard, Queen | Real-time task progress updates |
| `agentic.hitl.lifecycle` | HITL | Queen, Dashboard, Notifications | Approval requested, decided, escalated, expired |
| `agentic.memory.lifecycle` | Memory | Scouts (compliance), Dashboard | Memory stored, consolidated, superseded |
| `agentic.scout.observation` | Scouts | Alert Manager, Dashboard | New observation recorded |
| `agentic.alert.lifecycle` | Alert Manager | Dashboard, Notifications, Queen | Alert opened, acknowledged, resolved |
| `agentic.reasoning.trace` | Reasoning | Memory, Dashboard | Reasoning step completed, verification result |
| `agentic.prompt.usage` | Prompts | Metrics, A/B Testing | Template rendered, chain executed |

#### Event Schema

All events follow a standard envelope:

```typescript
interface AgenticEvent<T> {
  id: string;                    // UUID v7 (time-ordered)
  type: string;                  // e.g., 'task.completed'
  source: string;                // e.g., 'agentic-os.swarm'
  ventureId: string;             // Venture isolation
  timestamp: string;             // ISO 8601
  correlationId: string;         // Request correlation
  data: T;                       // Event-specific payload
  metadata: {
    agentId?: string;
    taskId?: string;
    userId?: string;
    version: string;             // Schema version
  };
}
```

#### Key Event Flows

**Task Completion Flow:**
```
Ralph Pod completes task
  → Publish: agentic.task.lifecycle { type: 'task.completed', data: TaskResult }
  → Consumer: Queen → Check if all parallel group tasks done → dispatch next group
  → Consumer: Memory → Start episode recording → Store episodic trace
  → Consumer: Metrics → Update agent_metrics counters
  → Consumer: Dashboard → Push real-time update via WebSocket
```

**HITL Approval Flow:**
```
Queen flags high-risk task
  → Publish: agentic.hitl.lifecycle { type: 'hitl.requested', data: HITLRequest }
  → Consumer: HITL Queue → Add to Redis sorted set + PostgreSQL
  → Consumer: Notifications → Send Slack/Email/Push to approvers
  → Consumer: Dashboard → Show in HITL Approval Inbox

Approver submits decision
  → Publish: agentic.hitl.lifecycle { type: 'hitl.decided', data: ApprovalDecision }
  → Consumer: HITL Workflow → Check quorum → Update status
  → Consumer: Queen → If approved, resume task dispatch
  → Consumer: Dashboard → Update approval status
```

**Memory Consolidation Flow:**
```
Cron triggers consolidation (every 4 hours)
  → Read: episodic memories from last window
  → Process: LLM synthesis → Extract facts → Build knowledge triples
  → Publish: agentic.memory.lifecycle { type: 'memory.consolidated' }
  → Consumer: Knowledge Graph → Insert new entity-relationship triples
  → Consumer: Vector Store → Generate and store embeddings
```

---

## Integration Points

### Dependency Map

```
┌─────────────────────────────────────────────────────────────────────┐
│                     @mcv/agentic-os                                  │
│                                                                      │
│  CONSUMES (depends on):                                              │
│                                                                      │
│  ┌────────────────────┐  ┌────────────────────┐                     │
│  │ @mcv/intelligence  │  │ @mcv/fabric        │                     │
│  │                    │  │                    │                     │
│  │ • LLM Gateway      │  │ • Event Bus        │                     │
│  │   (OpenRouter)     │  │   (Redpanda/Kafka) │                     │
│  │ • Embedding API    │  │ • Queue System     │                     │
│  │ • RAG Pipeline     │  │   (BullMQ/Redis)   │                     │
│  │ • Model Registry   │  │ • Realtime          │                     │
│  │                    │  │   (WebSocket)       │                     │
│  └────────────────────┘  └────────────────────┘                     │
│                                                                      │
│  ┌────────────────────┐  ┌────────────────────┐                     │
│  │ @mcv/identity      │  │ @mcv/kernel        │                     │
│  │                    │  │                    │                     │
│  │ • Auth/Sessions    │  │ • Database Client  │                     │
│  │ • RBAC Policies    │  │   (Drizzle ORM)    │                     │
│  │ • Permission       │  │ • Error Handling   │                     │
│  │   Verification     │  │ • Logging          │                     │
│  │ • Approver         │  │ • Context          │                     │
│  │   Resolution       │  │   Propagation      │                     │
│  └────────────────────┘  └────────────────────┘                     │
│                                                                      │
│  CONSUMED BY (dependents):                                           │
│                                                                      │
│  All 9 venture domains use agentic-os for AI capabilities:          │
│  @mcv/betedge, @mcv/serpspace, @mcv/full-gain, @mcv/mcv-studios,   │
│  @mcv/futurestate, @mcv/verdant, @mcv/covalyon, @mcv/chronos,      │
│  @mcv/edge-token                                                     │
│                                                                      │
│  EXTERNAL SERVICES:                                                  │
│                                                                      │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌────────────┐ │
│  │ OpenRouter   │ │ Neo4j        │ │ Pinecone/    │ │ E2B        │ │
│  │ (LLM API)   │ │ (Knowledge   │ │ pgvector     │ │ (Sandbox)  │ │
│  │ 400+ models │ │  Graph)      │ │ (Vectors)    │ │ (Code exec)│ │
│  └──────────────┘ └──────────────┘ └──────────────┘ └────────────┘ │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐               │
│  │ Redis        │ │ Redpanda     │ │ Supabase     │               │
│  │ (Working mem │ │ (Event       │ │ (PostgreSQL  │               │
│  │  + queues)   │ │  streaming)  │ │  + Auth)     │               │
│  └──────────────┘ └──────────────┘ └──────────────┘               │
└─────────────────────────────────────────────────────────────────────┘
```

### Integration Patterns

#### @mcv/intelligence — LLM Access

All LLM calls route through `@mcv/intelligence`'s Gateway, which provides:
- **Model routing** — OpenRouter with 400+ models, automatic failover
- **Token tracking** — Per-request token counting for cost budgeting
- **Rate limiting** — Per-venture and per-model rate limits
- **Embedding generation** — For memory vector storage (dimension 1536 or 3072)

```typescript
// Example: Agent LLM call through intelligence gateway
import { gateway } from '@mcv/intelligence';

const response = await gateway.complete({
  model: 'claude-sonnet-4',
  messages,
  tools: instruments.map(i => i.toToolDefinition()),
  maxTokens: context.resources.maxTokens,
  temperature: 0.7,
  metadata: {
    agentId: agent.id,
    taskId: task.id,
    ventureId: task.ventureId,
  },
});
```

#### @mcv/identity — Authentication & Authorization

Every API endpoint and agent action is authenticated through `@mcv/identity`:
- **Session validation** — All API routes verify JWT tokens
- **RBAC enforcement** — Agent operations check venture-level permissions
- **Approver resolution** — HITL workflows resolve approver lists from identity roles
- **Impersonation guards** — Agents cannot impersonate users or escalate permissions

#### @mcv/fabric — Events & Queues

`@mcv/fabric` provides the event bus and queue system:
- **Redpanda/Kafka** — Durable event streaming for agent lifecycle events
- **BullMQ** — Redis-backed task queues for worker pool distribution
- **WebSocket** — Real-time updates for Dashboard UI components
- **Dead Letter Queue** — Failed event processing retries with exponential backoff

#### Cross-Venture Agent Sharing (Future)

In Phase 3, agents will support cross-venture sharing:
```typescript
// Portfolio-level analysis using Queen with global synthesis capability
const portfolioInsight = await queen.handleRequest({
  description: 'Analyze Q1 performance across all ventures',
  context: {
    ventureId: 'mcv-global',  // Special global venture context
    userId: 'user_cfo',
    scope: 'portfolio',
  },
  priority: 'high',
});
```

---

## Performance Architecture

### Latency Budgets

| Operation | Target (p50) | Target (p95) | Budget Breakdown |
|-----------|-------------|-------------|------------------|
| Simple query (read-only) | 200ms | 500ms | LLM: 150ms, Memory: 30ms, overhead: 20ms |
| Standard task execution | 5s | 15s | LLM: 3s (×2 turns), Tools: 1.5s, Memory: 500ms |
| Complex multi-task request | 30s | 60s | Planning: 5s, HITL: 0s (low risk), Execution: 20s, Aggregation: 5s |
| HITL-gated request | 30s + approval time | — | Same as above + human decision time |
| Memory retrieval (vector search) | 50ms | 100ms | Embedding: 20ms, Search: 25ms, Ranking: 5ms |
| Deep RAG (recursive) | 500ms | 800ms | Vector: 50ms, Graph: 100ms, Gap analysis: 200ms, Recurse: 150ms |
| Scout execution | 2s | 5s | Collection: 1s, Analysis: 500ms, Alert check: 500ms |

### Caching Strategy

| Cache Layer | Technology | TTL | Purpose |
|-------------|-----------|-----|---------|
| Agent config | Redis | 5 min | Avoid DB lookup on every request |
| Prompt templates | Redis | 10 min | Frequently rendered templates |
| Instrument definitions | Redis | 10 min | Tool definitions for LLM calls |
| Recent memories | Redis | Session | Working memory context window |
| Metric counters | Redis | 1 hour | Real-time metric accumulation |
| Model pricing | Redis | 1 hour | Cost calculation lookups |

### Connection Pooling

| Service | Pool Size | Timeout | Notes |
|---------|-----------|---------|-------|
| PostgreSQL (Supabase) | 20 | 30s | Via Drizzle ORM connection pool |
| Redis | 10 | 5s | For working memory + queues |
| Neo4j | 5 | 10s | Knowledge graph queries |
| OpenRouter API | 50 concurrent | 60s | LLM inference requests |

### Resource Limits per Request

| Resource | Default Limit | Configurable |
|----------|--------------|--------------|
| Max tokens per turn | 8,000 | Per agent |
| Max tool calls per request | 20 | Per agent |
| Request timeout | 300s (5 min) | Per agent |
| Cost budget per request | $10.00 | Per agent |
| Max parallel tasks | 20 | Per Queen |
| Max recursion depth (reasoning) | 5 | Per strategy |
| Max Deep RAG depth | 3 | Per query |

---

## Scalability

### Horizontal Scaling Architecture

```
┌───────────────────────────────────────────────────────────────────┐
│                    HORIZONTAL SCALING MODEL                        │
│                                                                    │
│  ┌─────────────────────────────────────────────────────────────┐  │
│  │  API Layer (Stateless — scale via Vercel/K8s replicas)      │  │
│  │                                                              │  │
│  │  Instance 1  │  Instance 2  │  Instance 3  │  Instance N    │  │
│  └──────────────┼──────────────┼──────────────┼────────────────┘  │
│                 │              │              │                    │
│  ┌──────────────▼──────────────▼──────────────▼────────────────┐  │
│  │  Queen (Stateless — one per venture, horizontally scalable)  │  │
│  │                                                              │  │
│  │  Venture 1   │  Venture 2   │  Venture 3   │  ...           │  │
│  └──────────────┼──────────────┼──────────────┼────────────────┘  │
│                 │              │              │                    │
│  ┌──────────────▼──────────────▼──────────────▼────────────────┐  │
│  │  Worker Pool (Scale via queue depth — auto-scaling workers)  │  │
│  │                                                              │  │
│  │  Workers: 2 ←→ 20 (dynamic based on queue depth)            │  │
│  │  Each worker handles one Ralph Pod task at a time            │  │
│  └─────────────────────────────────────────────────────────────┘  │
│                                                                    │
│  ┌─────────────────────────────────────────────────────────────┐  │
│  │  Data Layer (Vertically scalable + read replicas)            │  │
│  │                                                              │  │
│  │  PostgreSQL: Primary + 2 read replicas                      │  │
│  │  Redis: Cluster mode (3 shards)                              │  │
│  │  Neo4j: Single instance (sharding at 10M+ nodes)           │  │
│  │  Redpanda: 3-broker cluster                                  │  │
│  └─────────────────────────────────────────────────────────────┘  │
└───────────────────────────────────────────────────────────────────┘
```

### Scaling Dimensions

| Dimension | Current Target | Scaling Strategy | Bottleneck |
|-----------|---------------|-----------------|------------|
| Concurrent agents | 50 per venture | Horizontal (worker pool) | LLM API rate limits |
| Active task queue | 500 tasks | Redis sorted sets | Worker pool size |
| HITL approval queue | 100 pending | Redis + PostgreSQL | Human response time |
| Memory entries | 10M per venture | pgvector IVFFlat indexing | Vector search latency |
| Episodic memories | 100M total | Partitioned by month | Storage costs |
| Scout observations | 50M/month | Time-partitioned, auto-archived | Query performance |
| Events throughput | 10K events/sec | Redpanda 3-broker cluster | Consumer lag |

### Queue-Based Task Distribution

The Worker Pool uses Redis-backed priority queues for task distribution:

```
Priority Queue Strategy:
  Score = (priority_weight × 1000) + unix_timestamp
  
  Critical (priority=4): Score = 4000 + timestamp  → Always dequeued first
  High     (priority=3): Score = 3000 + timestamp
  Medium   (priority=2): Score = 2000 + timestamp
  Low      (priority=1): Score = 1000 + timestamp
  
  Within same priority: FIFO (earlier timestamp = lower score = first out)
```

### Auto-Scaling Triggers

| Metric | Threshold | Action |
|--------|-----------|--------|
| Queue depth | > 5 tasks pending for a pod type | Spawn new worker for that pod |
| Queue depth | > 20 tasks across all pods | Spawn 3 additional workers |
| Worker idle time | > 10 minutes | Terminate worker (respect `minWorkers`) |
| P95 latency | > 30 seconds for 5 minutes | Spawn 2 additional workers |
| LLM API errors | > 5% error rate for 2 minutes | Switch to fallback model |
| Memory | > 80% heap usage | Alert + potential worker restart |

---

## Error Handling

### Error Hierarchy

```typescript
// Base error for all Agentic OS errors
class AgenticError extends Error {
  code: string;
  statusCode: number;
  context: Record<string, unknown>;
  retryable: boolean;
}

// Module-specific errors
class AgentError extends AgenticError {}           // NAOS runtime errors
class TaskExecutionError extends AgenticError {}    // Swarm execution errors
class HITLTimeoutError extends AgenticError {}      // HITL deadline exceeded
class MemoryError extends AgenticError {}           // Memory store errors
class ReasoningError extends AgenticError {}        // Reasoning engine errors
class ScoutError extends AgenticError {}            // Scout execution errors
class PlanningError extends AgenticError {}         // Queen planning errors
class AllocationError extends AgenticError {}       // Resource allocation errors
class WorkflowError extends AgenticError {}         // HITL workflow errors
class ChainExecutionError extends AgenticError {}   // Prompt chain errors
class ContradictionError extends AgenticError {}    // Memory contradiction
class AnomalyError extends AgenticError {}          // Anomaly detection errors
class RateLimitError extends AgenticError {}        // Rate limit exceeded
```

### Error Codes

| Code | Module | Description | Retryable |
|------|--------|-------------|-----------|
| `CAPABILITY_DENIED` | NAOS | Agent lacks required capability | No |
| `COST_BUDGET_EXCEEDED` | NAOS | Request cost exceeded agent budget | No |
| `RATE_LIMIT_EXCEEDED` | NAOS | Instrument rate limit exceeded | Yes (with backoff) |
| `AGENT_NOT_FOUND` | NAOS | Requested agent doesn't exist | No |
| `AGENT_UNAVAILABLE` | NAOS | Agent is paused/maintenance/retired | Yes (check status) |
| `PLANNING_CYCLE_DETECTED` | Queen | Task graph contains a dependency cycle | No (re-plan) |
| `PLANNING_FAILED` | Queen | Unable to decompose request | No |
| `ALLOCATION_FAILED` | Queen | No suitable pod for task type | No |
| `TASK_TIMEOUT` | Swarm | Task exceeded timeout | Yes (1 retry) |
| `TASK_MAX_RETRIES` | Swarm | All retry attempts exhausted | No |
| `TASK_MAX_ITERATIONS` | Swarm | Agent exceeded max LLM iterations | No |
| `HITL_TIMEOUT` | HITL | Approval deadline exceeded | No (escalation) |
| `HITL_REJECTED` | HITL | Approval request rejected by human | No |
| `HITL_CANCELLED` | HITL | Approval request cancelled | No |
| `MEMORY_STORE_FAILED` | Memory | Failed to store memory entry | Yes |
| `MEMORY_RETRIEVAL_FAILED` | Memory | Vector search or graph query failed | Yes |
| `MEMORY_CONTRADICTION` | Memory | New fact contradicts existing knowledge | No (resolved) |
| `REASONING_DEPTH_EXCEEDED` | Reasoning | Max recursion depth reached | No |
| `REASONING_CONFIDENCE_LOW` | Reasoning | Unable to reach confidence threshold | No |
| `VERIFICATION_FAILED` | Reasoning | Truth verification disproved assertion | No |
| `SCOUT_COLLECTION_FAILED` | Scouts | Data collector returned error | Yes |
| `PROMPT_NOT_FOUND` | Prompts | Template not found | No |
| `PROMPT_VALIDATION_FAILED` | Prompts | Required variable missing or invalid | No |
| `CHAIN_STEP_FAILED` | Prompts | Chain step failed (no continue_on_error) | Depends on config |

### Retry Strategy

```typescript
const DEFAULT_RETRY_CONFIG = {
  maxRetries: 3,
  baseDelayMs: 1000,
  maxDelayMs: 30000,
  backoffMultiplier: 2,      // Exponential backoff
  jitterFactor: 0.1,          // ±10% jitter to prevent thundering herd
  retryableErrors: [
    'RATE_LIMIT_EXCEEDED',
    'MEMORY_STORE_FAILED',
    'MEMORY_RETRIEVAL_FAILED',
    'SCOUT_COLLECTION_FAILED',
    'TASK_TIMEOUT',
  ],
};

// Delay calculation: min(baseDelay * backoff^attempt * (1 ± jitter), maxDelay)
```

### Graceful Degradation

| Subsystem Failure | Impact | Degradation Strategy |
|-------------------|--------|---------------------|
| Memory unavailable | Agents lose historical context | Continue with current context window only; log warning |
| Neo4j down | No knowledge graph queries | Fall back to vector-only retrieval |
| Reasoning engine failure | Can't use advanced strategies | Fall back to simple chain-of-thought |
| HITL queue full | Approval bottleneck | Auto-approve low-risk; escalate high-risk to exec |
| Scout network down | No monitoring data | Alert operations team; continue without telemetry |
| Redis unavailable | No working memory or queues | Fall back to PostgreSQL-based queuing (degraded perf) |
| LLM API failure | No agent execution | Queue tasks for retry; switch to fallback model provider |

---

## Observability

### Metrics Collection

#### Key Metrics (Exported to Prometheus/Grafana)

| Metric | Type | Labels | Description |
|--------|------|--------|-------------|
| `agentic_requests_total` | Counter | `venture, agent, status` | Total requests processed |
| `agentic_request_duration_ms` | Histogram | `venture, agent` | Request processing time |
| `agentic_tokens_total` | Counter | `venture, agent, model` | Total tokens consumed |
| `agentic_cost_usd_total` | Counter | `venture, agent, model` | Total LLM costs |
| `agentic_tool_calls_total` | Counter | `venture, agent, instrument` | Total tool invocations |
| `agentic_task_queue_depth` | Gauge | `venture, pod_type` | Current task queue depth |
| `agentic_active_workers` | Gauge | `venture, pod_type` | Current active workers |
| `agentic_hitl_pending` | Gauge | `venture` | Pending HITL approvals |
| `agentic_hitl_resolution_time_ms` | Histogram | `venture, risk_level` | Time to resolve HITL requests |
| `agentic_memory_entries_total` | Gauge | `venture, memory_type` | Total memory entries |
| `agentic_memory_retrieval_ms` | Histogram | `venture, store` | Memory retrieval latency |
| `agentic_scout_observations_total` | Counter | `venture, scout_type` | Total scout observations |
| `agentic_alerts_active` | Gauge | `venture, severity` | Active unresolved alerts |
| `agentic_trajectory_reward` | Histogram | `venture, task_type` | Reward signal distribution |
| `agentic_reasoning_depth` | Histogram | `strategy` | Reasoning recursion depth |

### Structured Logging

All log entries follow the structured format:

```json
{
  "timestamp": "2026-02-09T04:44:00.000Z",
  "level": "info",
  "service": "agentic-os",
  "module": "swarm",
  "component": "ralph-smith",
  "ventureId": "betedge",
  "agentId": "smith-betedge-01",
  "taskId": "task_001",
  "correlationId": "req_abc123",
  "message": "Task completed successfully",
  "duration_ms": 4500,
  "tokens_used": 3200,
  "cost_usd": 0.048,
  "tool_calls": 3,
  "metadata": {
    "model": "claude-sonnet-4",
    "outcome": "success"
  }
}
```

### Dashboard Components (React)

The Agentic OS exports 12 React components for operator dashboards:

| Component | Purpose | Data Source |
|-----------|---------|-------------|
| `AgentRegistryPanel` | View/manage all registered agents | `naos_agents` |
| `TaskGraphVisualizer` | Visualize task decomposition DAGs | `naos_tasks` |
| `HITLApprovalInbox` | Review/approve pending HITL requests | `naos_hitl_requests` |
| `ApprovalWorkflowEditor` | Configure approval workflows | `naos_hitl_escalation_rules` |
| `SwarmDashboard` | Monitor Ralph pod activity and queue depth | `naos_tasks` + Redis |
| `ScoutMonitorGrid` | View scout status, recent observations | `naos_scouts` + `naos_scout_observations` |
| `MemoryExplorer` | Browse and search agent memories | `naos_memory_entries` |
| `PromptTemplateEditor` | Create/edit prompt templates | `naos_prompts` |
| `ReasoningTraceViewer` | Inspect reasoning chains step-by-step | `naos_trajectories` |
| `AlertTimeline` | View alert history and resolution notes | `naos_alerts` |
| `CostTracker` | Monitor LLM costs by venture/agent/model | `naos_agent_metrics` |
| `AgentConversation` | Interactive agent chat interface | Real-time via WebSocket |

### React Hooks (Client-Side)

| Hook | Purpose | Polling/Realtime |
|------|---------|-----------------|
| `useAgentRegistry()` | Agent list and status | 30s polling |
| `useTaskTracker()` | Active task progress | WebSocket realtime |
| `useHITLQueue()` | Pending approval count | WebSocket realtime |
| `useApprovalWorkflow()` | Workflow state for a request | WebSocket realtime |
| `useScoutDashboard()` | Scout status and recent alerts | 60s polling |
| `useAgentMemory()` | Memory search results | On-demand |
| `usePromptBank()` | Template listing and search | 60s polling |
| `useSwarmStatus()` | Worker pool and queue depth | 10s polling |
| `useReasoningTrace()` | Reasoning trace for a task | On-demand |
| `useAlerts()` | Active alerts by severity | WebSocket realtime |

### Distributed Tracing

Each request receives a `correlationId` (UUID v7) that propagates through all subsystems:

```
Request → correlationId: "req_01HQWX..."
  → Queen.handleRequest()     [span: queen.plan]
  → TaskPlanner.decompose()   [span: queen.decompose]
  → RiskAssessor.assess()     [span: queen.risk]
  → HITLGateway.request()     [span: hitl.request]
  → SwarmDispatcher.dispatch() [span: swarm.dispatch]
    → Ralph.executeTask()      [span: swarm.execute.smith]
      → Instrument.execute()   [span: instrument.code_edit]
    → Ralph.executeTask()      [span: swarm.execute.oracle]
  → Queen.aggregate()          [span: queen.aggregate]
  → MemoryStore.store()        [span: memory.store]
```

All spans are exported to the observability stack for end-to-end request tracing.

---

## Security Architecture

### Threat Model

| Threat | Risk | Mitigation |
|--------|------|-----------|
| Prompt injection | Agent executes unintended actions | Capability gates prevent unauthorized actions; HITL gates for high-risk operations |
| Agent privilege escalation | Agent gains capabilities beyond its config | Capability enforcement at NAOS runtime level; immutable after registration |
| Data exfiltration via agent | Agent sends private data externally | `external` capability required; HITL approval for external communications |
| Runaway cost | Misconfigured agent incurs unbounded LLM costs | Per-request cost budget enforcement; per-agent rate limits |
| Cross-venture data leak | Agent accesses another venture's data | RLS enforcement at database level; `ventureId` scoping in all queries |
| Memory poisoning | Adversary stores misleading memories | Confidence scoring; contradiction resolution; PII scrubbing |
| Chain-of-thought injection | Manipulated reasoning chain | Stateless execution from clean Working Memory; truth verification layer |
| HITL bypass | Agent circumvents human approval | Risk assessment is mandatory; HITL gates enforced by Queen dispatcher |
| Replay attacks | Re-submitted events cause duplicate execution | Idempotent event processing; UUID v7 deduplication |

### Agent Sandboxing

```
┌─────────────────────────────────────────────────────────────────┐
│                    AGENT SANDBOX MODEL                           │
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  Layer 1: Capability Gates (NAOS Runtime)                   │ │
│  │  ✓ Agent can only call instruments it has capability for    │ │
│  │  ✓ Enforced at invocation time, not configuration time      │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  Layer 2: Instrument Safety Controls                        │ │
│  │  ✓ Input/output schema validation (Zod)                     │ │
│  │  ✓ Rate limiting per instrument per agent                   │ │
│  │  ✓ Cooldown periods between calls                           │ │
│  │  ✓ Max calls per request                                    │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  Layer 3: Cost Budget Enforcement                           │ │
│  │  ✓ Per-request USD budget                                   │ │
│  │  ✓ Token accumulation tracking                              │ │
│  │  ✓ Automatic termination on budget exceed                   │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  Layer 4: HITL Gates                                        │ │
│  │  ✓ Risk assessment on every task plan                       │ │
│  │  ✓ Mandatory approval for high-risk operations              │ │
│  │  ✓ Quorum voting for critical operations                    │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  Layer 5: Data Isolation (Supabase RLS)                     │ │
│  │  ✓ All queries scoped by ventureId                          │ │
│  │  ✓ Cross-venture access requires global_synthesis           │ │
│  │  ✓ PII scrubbing on memory persistence                      │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  Layer 6: Code Execution Sandbox (E2B)                      │ │
│  │  ✓ Untrusted code runs in isolated E2B containers           │ │
│  │  ✓ No network access from sandbox (configurable)            │ │
│  │  ✓ Resource limits (CPU, memory, disk, time)                │ │
│  └────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

### Permission Boundaries

| Agent Type | Can Read | Can Write | Can Execute | Can Communicate | Needs HITL |
|-----------|---------|----------|------------|----------------|-----------|
| **Queen** | All venture data | Nothing directly | Nothing directly | Nothing directly | Never (planning only) |
| **Smith** | Code repos, docs, DB schemas | Code, configs, migrations | Tests, deployments | GitHub, CI/CD | High-risk deploys |
| **Growth** | Analytics, content, campaigns | Campaigns, content | A/B tests | Social, email | External posts |
| **Director** | All venture operations | Workflows, docs, tasks | Workflows | Calendar, Slack | Bulk operations |
| **Ledger** | Financial data | Nothing | Nothing | Nothing | All financial ops |
| **Scribe** | Content library, knowledge base | Articles, docs | Nothing | Nothing | Published content |
| **Oracle** | All analytics data | Nothing | Queries, models | Nothing | Never |
| **Herald** | Templates, contacts | Nothing | Nothing | Email, SMS, Slack, Push | All communications |
| **Shield** | Security logs, configs | Incident reports | Scans, audits | Nothing | Config changes |
| **Scouts** | Monitoring endpoints | Nothing | Nothing | Nothing | Never |

### Audit Trail

Every agent action is recorded in the trajectory system, providing a complete audit trail:

- **Who** — Agent ID, venture ID, user who initiated the request
- **What** — Every tool call, LLM prompt, and response
- **When** — Millisecond-precision timestamps on every event
- **Why** — Reasoning traces explaining the agent's decision-making
- **Outcome** — Success/failure status, error messages, human feedback

Trajectories are immutable (append-only) and retained for 1 year for compliance purposes. They can be queried by:
- Agent ID
- Task ID
- Venture