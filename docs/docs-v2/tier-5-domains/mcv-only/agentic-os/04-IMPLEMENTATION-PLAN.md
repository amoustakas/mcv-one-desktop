# @mcv/agentic-os — Implementation Plan

## Tier 5: MCV-Only Domains

**Package:** `@mcv/agentic-os`  
**Classification:** INTERNAL (MCV-Only)  
**Version:** 1.0.0  
**Last Updated:** February 9, 2026

---

## Table of Contents

1. [Overview & Goals](#overview--goals)
2. [Prerequisites](#prerequisites)
3. [Phase 1: Foundation (Weeks 1–4)](#phase-1-foundation-weeks-14)
4. [Phase 2: Core (Weeks 5–10)](#phase-2-core-weeks-510)
5. [Phase 3: Advanced (Weeks 11–16)](#phase-3-advanced-weeks-1116)
6. [Phase 4: Polish (Weeks 17–20)](#phase-4-polish-weeks-1720)
7. [Testing Strategy](#testing-strategy)
8. [Acceptance Criteria](#acceptance-criteria)
9. [Risk Assessment](#risk-assessment)
10. [Timeline](#timeline)

---

## Overview & Goals

`@mcv/agentic-os` is the **crown jewel** of the MCV.ONE platform — a Neural Agentic Operating System that transforms the consortium from a collection of SaaS products into an autonomous, AI-driven intelligence layer. This implementation plan details the phased construction of all eight submodules (NAOS, Queen, Swarm, Scouts, HITL, Memory, Prompts, Reasoning) from foundational primitives to production-grade multi-agent orchestration.

### Strategic Objectives

| Objective | Description | Success Metric |
|---|---|---|
| **Autonomous Task Execution** | AI agents independently plan, execute, and verify work across all nine ventures | 90% task completion rate within 5 minutes |
| **Human Oversight** | Every high-risk operation passes through HITL approval before execution | 100% HITL compliance for operations above risk threshold |
| **Persistent Learning** | Agents accumulate knowledge across sessions, improving performance over time | 15% improvement in task success rate per quarter |
| **Cross-Venture Intelligence** | Queen-level agents synthesize insights across the entire MCV.ONE portfolio | Portfolio-level reports generated without manual data aggregation |
| **Cost Efficiency** | Intelligent model routing and resource allocation minimize LLM spend | Average task cost < $0.10 for standard operations |
| **Reliability** | Self-healing, observable, and auditable agent operations | 99.5% uptime, < 2s p95 latency for standard tasks |

### Architecture Summary

```
┌─────────────────────────────────────────────────────────────────┐
│                     @mcv/agentic-os                             │
│                                                                 │
│  Phase 1 (Foundation)    Phase 2 (Core)     Phase 3 (Advanced)  │
│  ┌──────────┐           ┌──────────┐       ┌──────────────┐    │
│  │ NAOS     │           │ Queen    │       │ Multi-Agent  │    │
│  │ Runtime  │──────────▶│ Orchestr │──────▶│ Collaboration│    │
│  └──────────┘           └──────────┘       └──────────────┘    │
│  ┌──────────┐           ┌──────────┐       ┌──────────────┐    │
│  │ Basic    │           │ HITL     │       │ RAG-Powered  │    │
│  │ Memory   │──────────▶│ Approval │──────▶│ Memory       │    │
│  └──────────┘           └──────────┘       └──────────────┘    │
│  ┌──────────┐           ┌──────────┐       ┌──────────────┐    │
│  │ Prompt   │           │ Reasoning│       │ Autonomous   │    │
│  │ Templates│──────────▶│ Engine   │──────▶│ Planning     │    │
│  └──────────┘           └──────────┘       └──────────────┘    │
│                         ┌──────────┐       ┌──────────────┐    │
│                         │ Scouts + │       │ Cross-Venture│    │
│                         │ Swarm    │──────▶│ Agents       │    │
│                         └──────────┘       └──────────────┘    │
│                                                                 │
│  Phase 4 (Polish): Optimization, Docs, Monitoring, Hardening   │
└─────────────────────────────────────────────────────────────────┘
```

### Design Principles

1. **Bottom-Up Construction** — Each phase builds on the primitives established by the previous phase. No forward dependencies.
2. **Working Software at Every Phase** — Each phase ends with a deployable, testable system. Phase 1 alone produces a functional single-agent runtime.
3. **Test-Driven Everything** — Every service method has unit tests before implementation. Integration tests validate cross-module interactions.
4. **Incremental Risk** — High-risk components (HITL, financial instruments, external communications) are gated behind approval workflows from the moment they're introduced.
5. **Observable by Default** — Every component emits structured events, logs, and metrics from day one.

---

## Prerequisites

### Platform Dependencies

These MCV.ONE packages must be available before Phase 1 begins:

| Package | Required Version | Purpose | Status |
|---|---|---|---|
| `@mcv/kernel` | `≥1.0.0` | Database context, error handling, logging, config | ✅ Available |
| `@mcv/identity` | `≥1.0.0` | Authentication, RBAC, permissions, policies | ✅ Available |
| `@mcv/intelligence` | `≥1.0.0` | LLM gateway, OpenRouter integration, embeddings, RAG primitives | ✅ Available |
| `@mcv/fabric` | `≥1.0.0` | Event bus (Redpanda/Kafka), real-time subscriptions | ✅ Available |
| `@mcv/observability` | `≥1.0.0` | Structured logging, OpenTelemetry tracing, metrics | ✅ Available |

### Infrastructure Requirements

| Service | Purpose | Specification |
|---|---|---|
| **PostgreSQL 16+** (Supabase) | Primary data store with RLS | pgvector extension enabled, 3072-dimension support |
| **Redis 7+** | Working memory, HITL queues, session state | Cluster mode, 4GB+ memory, sorted sets |
| **Redpanda/Kafka** | Event streaming for agent lifecycle events | 3-broker cluster, 7-day retention |
| **Neo4j 5+** | Knowledge graph for semantic memory | AuraDB or self-hosted, 50GB+ storage |
| **OpenRouter** | LLM inference gateway (400+ models) | API key with $500+/month budget |
| **E2B Sandboxes** | Code execution for truth verification | API key, 10 concurrent sandboxes |

### Team Requirements

| Role | Count | Responsibilities |
|---|---|---|
| **Senior AI Engineer** | 2 | Core NAOS runtime, reasoning engine, memory system |
| **Full-Stack Engineer** | 2 | HITL UI, dashboard components, API routes, prompt bank |
| **Platform Engineer** | 1 | Infrastructure, Kafka, Neo4j, Redis, deployment |
| **AI/ML Specialist** | 1 | Anomaly detection algorithms, embedding optimization, RAG tuning |
| **QA Engineer** | 1 | Test automation, integration testing, load testing |
| **Product Owner** | 1 | Prioritization, acceptance criteria, cross-venture coordination |

### Development Environment Setup

```bash
# 1. Clone the monorepo
git clone git@github.com:mcv-one/platform.git
cd platform

# 2. Install dependencies
pnpm install

# 3. Set up environment variables
cp packages/agentic-os/.env.example packages/agentic-os/.env
# Edit .env with your infrastructure credentials

# 4. Run database migrations
pnpm --filter @mcv/agentic-os db:migrate

# 5. Seed development data
pnpm --filter @mcv/agentic-os db:seed

# 6. Start development server
pnpm --filter @mcv/agentic-os dev

# 7. Run test suite
pnpm --filter @mcv/agentic-os test
```

---

## Phase 1: Foundation (Weeks 1–4)

**Goal:** Establish the core runtime primitives — a single agent can be registered, configured, given instruments, execute tasks against an LLM, and persist basic memories. This is the "kernel boot" of the Agentic OS.

### Week 1: NAOS Core Runtime

**Objective:** Agent lifecycle management, registry, and capability enforcement.

#### Deliverables

| # | Deliverable | Description | Effort |
|---|---|---|---|
| 1.1 | Database schema: `naos_agents` | Agent definitions table with Drizzle ORM, RLS policies, venture scoping | 4h |
| 1.2 | Database schema: `naos_agent_metrics` | Performance metrics table with period-based aggregation | 3h |
| 1.3 | Database schema: `naos_instruments` | Instrument (tool) definitions with capability requirements | 3h |
| 1.4 | `NAOSAgent` class | Base agent class with capability checking, instrument loading, request processing loop | 8h |
| 1.5 | `AgentRegistry` class | Agent registration, retrieval, status management, capability search | 6h |
| 1.6 | `Instrument` class | Tool wrapper with input validation, rate limiting, audit logging, LLM tool definition conversion | 6h |
| 1.7 | `ExecutionContext` propagation | Context threading for venture scoping, tracing, permission checks | 4h |
| 1.8 | Built-in instruments | `database_query`, `web_search`, `code_edit` — three core instruments for development bootstrapping | 6h |
| 1.9 | Unit tests | Full coverage for registry, capabilities, instruments, context | 4h |
| 1.10 | Zod schemas | Input validation schemas for all NAOS types | 3h |

#### Key Decisions

- **Drizzle ORM** over Prisma for type-safe schema co-location with business logic
- **Capability-based access** rather than role-based — more granular, composable
- **Instrument abstraction** over direct tool calls — enables rate limiting, auditing, HITL gating

#### Definition of Done

- [ ] Agent can be registered with capabilities and instruments
- [ ] Agent can process a request and return a structured response
- [ ] Capability checks prevent unauthorized instrument usage
- [ ] Rate limiting enforces per-request call limits
- [ ] All Zod schemas validate correctly with edge cases
- [ ] 95%+ unit test coverage

---

### Week 2: Agent Execution Engine

**Objective:** The LLM execution loop — agents can call instruments, iterate on results, and produce task outputs.

#### Deliverables

| # | Deliverable | Description | Effort |
|---|---|---|---|
| 2.1 | LLM integration layer | OpenRouter client via `@mcv/intelligence`, model selection by tier, streaming support | 6h |
| 2.2 | Execution loop | ReAct-style loop: LLM → tool calls → results → LLM → ... → final answer. Max 10 iterations | 8h |
| 2.3 | Cost tracking | Per-request token counting, cost calculation (via OpenRouter pricing), budget enforcement | 4h |
| 2.4 | Timeout enforcement | Hard timeouts with graceful cancellation, partial result capture | 3h |
| 2.5 | Session management | `createSession` / `endSession` lifecycle, session state in Redis, expiry handling | 6h |
| 2.6 | Trajectory logging | Record every execution step (tool calls, LLM responses, reasoning) for learning | 6h |
| 2.7 | Database schema: `naos_trajectories` | Trajectory storage with outcome tracking and reward signals | 3h |
| 2.8 | Metric aggregation cron | Hourly/daily/weekly/monthly rollup of agent metrics | 4h |
| 2.9 | Integration tests | End-to-end: register agent → create session → execute task → verify trajectory | 4h |

#### Definition of Done

- [ ] Agent executes a multi-step task using instruments and produces structured output
- [ ] Cost tracking accurately reflects token usage per model
- [ ] Budget exceeded triggers graceful termination with partial results
- [ ] Trajectory captures every step with timing and token counts
- [ ] Session state survives Redis restart (persistence enabled)

---

### Week 3: Basic Memory System

**Objective:** Agents can store and retrieve memories across sessions. Episodic logging and basic vector search.

#### Deliverables

| # | Deliverable | Description | Effort |
|---|---|---|---|
| 3.1 | Database schema: `naos_memory_entries` | Memory entries with pgvector column (3072 dimensions) | 4h |
| 3.2 | Database schema: `episodic_memories` | Raw episodic trace table (append-only, high volume) | 3h |
| 3.3 | Database schema: `semantic_chunks` | Processed knowledge chunks with embeddings | 3h |
| 3.4 | `MemoryStore` class | Unified store/retrieve/forget interface with automatic embedding generation | 8h |
| 3.5 | `EpisodicMemory` class | Episode lifecycle (start → events → end), importance scoring, outcome capture | 6h |
| 3.6 | Embedding pipeline | Integration with `@mcv/intelligence` for `text-embedding-3-large` generation | 4h |
| 3.7 | Vector search | pgvector cosine similarity search with recency bias scoring | 6h |
| 3.8 | Memory injection | Automatic injection of relevant memories into agent execution context | 4h |
| 3.9 | Venture isolation | RLS policies ensuring memory is scoped to `ventureId` | 2h |
| 3.10 | Unit + integration tests | Memory store/retrieve/search lifecycle, embedding accuracy | 4h |

#### Definition of Done

- [ ] Agents store episodic memories during task execution automatically
- [ ] Vector search retrieves relevant memories with < 50ms latency
- [ ] Recency bias correctly weights recent memories higher when configured
- [ ] Venture isolation prevents cross-venture memory access
- [ ] Memory entries survive consolidation without data loss

---

### Week 4: Prompt Template System

**Objective:** Centralized prompt management with versioning, variable validation, and rendering.

#### Deliverables

| # | Deliverable | Description | Effort |
|---|---|---|---|
| 4.1 | Database schema: `naos_prompts` | Prompt template table with versioning, categorization, metrics | 4h |
| 4.2 | Database schema: `naos_prompt_chains` | Prompt chain definitions | 3h |
| 4.3 | `PromptBank` class | Template registration, retrieval, search, rendering, usage tracking | 8h |
| 4.4 | Handlebars rendering | Template engine with variable substitution, conditionals, loops, helpers | 6h |
| 4.5 | Variable validation | Zod-based variable type checking, required field enforcement, default injection | 4h |
| 4.6 | Version management | Immutable versioning, latest resolution, deprecation workflow | 4h |
| 4.7 | Core system prompts | Queen, Ralph pod (all 8), and Scout system prompts — the "DNA" of the Agentic OS | 8h |
| 4.8 | `PromptChainExecutor` class | Multi-step chain execution with input mapping between steps | 6h |
| 4.9 | API routes | REST API for prompt CRUD, rendering, and search | 4h |
| 4.10 | Tests | Template registration, rendering (with edge cases), chain execution, version resolution | 4h |

#### Phase 1 Milestone Definition of Done

- [ ] Prompt templates render correctly with all variable types
- [ ] Version resolution returns latest active version
- [ ] Chain executor maps outputs between steps correctly
- [ ] All 8 Ralph pod system prompts + Queen prompt are registered
- [ ] **Full Phase 1 integration test**: Register agent → load prompts → create session → execute task → store memory → retrieve memory → verify trajectory

---

## Phase 2: Core (Weeks 5–10)

**Goal:** Transform the single-agent runtime into a multi-agent hierarchy with strategic orchestration, execution swarms, human oversight, reasoning capabilities, and autonomous monitoring.

### Week 5: Queen / Scout Architecture — Task Decomposition

**Objective:** The Queen can receive high-level requests, analyze intent, decompose them into task graphs, and validate the dependency structure.

#### Deliverables

| # | Deliverable | Description | Effort |
|---|---|---|---|
| 5.1 | `Queen` class | Strategic orchestrator extending `NAOSAgent`, planning-only capabilities | 8h |
| 5.2 | `TaskPlanner` class | Intent analysis, domain identification, complexity assessment, atomic decomposition | 10h |
| 5.3 | Task graph validation | Cycle detection (DFS-based), dependency completeness, topological sort | 4h |
| 5.4 | `ResourceAllocator` class | Pod assignment, model tier selection, token budgeting, cost estimation | 8h |
| 5.5 | Parallel grouping | Topological sort with priority tie-breaking, parallel wave computation | 4h |
| 5.6 | Risk assessment engine | Risk scoring per task, threshold checks, HITL requirement determination | 6h |
| 5.7 | Risk assessment matrix | Configurable rules: cost thresholds, instrument blacklists, external comms flags | 3h |
| 5.8 | Database schema: `naos_tasks` | Task definitions, execution tracking, dependency management, status lifecycle | 4h |
| 5.9 | Database schema: `naos_task_events` | Task event log for progress tracking | 3h |
| 5.10 | Tests | Decomposition accuracy, cycle detection, parallel grouping, risk assessment | 6h |

#### Definition of Done

- [ ] Queen decomposes a multi-domain request into 3–8 atomic tasks
- [ ] Task graph correctly identifies parallel execution opportunities
- [ ] Cycle detection catches circular dependencies
- [ ] Risk assessment accurately flags high-risk operations
- [ ] Cost estimation within 30% of actual execution cost

---

### Week 6: Swarm Execution Pods

**Objective:** Ralph pods execute delegated tasks with domain-specific instruments and system prompts. Worker pool provides scaling and queue management.

#### Deliverables

| # | Deliverable | Description | Effort |
|---|---|---|---|
| 6.1 | `RalphPod` class | Specialized agent extending `NAOSAgent`, domain instruments, task execution | 8h |
| 6.2 | Pod configurations | All 8 Ralph pods (Smith, Growth, Director, Ledger, Scribe, Oracle, Herald, Shield) with instruments, capabilities, system prompts | 10h |
| 6.3 | `SwarmDispatcher` class | Task routing to pods, parallel execution with `Promise.allSettled`, result aggregation | 8h |
| 6.4 | `WorkerPool` class | Dynamic scaling, queue management (BullMQ on Redis), priority sorting | 8h |
| 6.5 | Database schema: `naos_task_queues` | Queue management with rate limiting and concurrency control | 3h |
| 6.6 | Retry engine | Exponential backoff, failure context injection, max retry enforcement | 4h |
| 6.7 | Result aggregation | Queen aggregator: combine pod outputs into unified strategic response | 4h |
| 6.8 | Event emission | Task lifecycle events via Redpanda: started, progress, completed, failed | 4h |
| 6.9 | Integration tests | Queen → decompose → dispatch → pods execute → aggregate → response | 6h |

#### Definition of Done

- [ ] All 8 Ralph pods execute tasks with correct domain instruments
- [ ] Parallel tasks execute concurrently and complete independently
- [ ] Failed tasks retry with backoff and failure context
- [ ] Worker pool scales between min/max workers based on queue depth
- [ ] Events emitted for every task state transition

---

### Week 7: HITL Approval Workflows

**Objective:** High-risk operations require human approval before execution. Multi-channel notifications, quorum voting, escalation, and audit trails.

#### Deliverables

| # | Deliverable | Description | Effort |
|---|---|---|---|
| 7.1 | Database schema: `naos_hitl_requests` | Approval request storage with risk assessment, deadline, status lifecycle | 4h |
| 7.2 | Database schema: `naos_hitl_approvals` | Individual approver decisions with delegation support | 3h |
| 7.3 | Database schema: `naos_hitl_escalation_rules` | Configurable escalation rules per venture | 3h |
| 7.4 | `HITLGateway` class | Approval request creation, approver notification dispatch, blocking until resolution | 8h |
| 7.5 | `HITLQueue` class | Redis sorted set queue (sorted by deadline), PostgreSQL durability, status tracking | 6h |
| 7.6 | `ApprovalWorkflow` class | Multi-step workflow engine with sequential step progression | 8h |
| 7.7 | Quorum logic | Majority, unanimous, and threshold voting modes with proper edge case handling | 4h |
| 7.8 | `EscalationManager` class | Timeout monitoring, escalation rule evaluation, auto-escalate/auto-approve/auto-reject | 6h |
| 7.9 | `HITLNotifier` class | Multi-channel notification (email via `@mcv/fabric`, Slack webhook, in-app) | 6h |
| 7.10 | Reminder system | 50% and 75% deadline reminders to pending approvers | 3h |
| 7.11 | Queen-HITL integration | Wire Queen's risk assessor output into HITL gateway, block task dispatch until approved | 4h |
| 7.12 | React components | `HITLApprovalInbox`, `ApprovalWorkflowEditor` — operator UI for reviewing and deciding | 8h |
| 7.13 | Tests | Full approval lifecycle: request → notify → approve → proceed. Rejection, timeout, escalation | 6h |

#### Definition of Done

- [ ] High-risk tasks block at HITL gate until approved
- [ ] Approvers receive notifications via email + Slack + in-app
- [ ] Quorum voting correctly resolves all three modes
- [ ] Escalation triggers at 75% deadline with correct action
- [ ] Approval inbox UI renders pending requests with risk context
- [ ] Full audit trail captured for every decision

---

### Week 8: Reasoning Engine

**Objective:** Agents can perform structured reasoning beyond simple LLM calls — chain-of-thought, tree-of-thought, self-consistency, and truth verification.

#### Deliverables

| # | Deliverable | Description | Effort |
|---|---|---|---|
| 8.1 | `ReasoningEngine` class | Strategy router: select and execute reasoning strategy based on problem type | 8h |
| 8.2 | `ChainOfThought` class | Linear step-by-step reasoning with intermediate validation | 6h |
| 8.3 | Tree-of-Thought strategy | BFS branching, node evaluation, beam search pruning, path selection | 10h |
| 8.4 | Self-Consistency strategy | Multiple independent CoT paths, cross-validation, majority voting | 6h |
| 8.5 | Decomposition strategy | Recursive sub-problem splitting with max depth enforcement | 4h |
| 8.6 | Truth verification layer | Confidence checking, E2B sandbox code execution, schema validation, cross-referencing | 8h |
| 8.7 | Dual-model strategy | Planning model vs. verification model to prevent confirmation bias | 4h |
| 8.8 | Reasoning trace capture | Full trace recording for every step, branch, and verification | 4h |
| 8.9 | `evaluateResult` method | Weighted criteria scoring, reward signal computation, exemplar flagging | 4h |
| 8.10 | `explainDecision` method | Human-readable explanation generation for HITL review | 4h |
| 8.11 | Tests | Strategy selection, CoT accuracy, ToT branching, verification, dual-model | 6h |

#### Definition of Done

- [ ] Chain-of-thought produces step-by-step reasoning with confidence scores
- [ ] Tree-of-thought explores multiple paths and selects the best
- [ ] Self-consistency produces higher confidence than single-path reasoning
- [ ] Truth verification catches incorrect assertions (false positive rate < 5%)
- [ ] Dual-model strategy uses different models for planning vs. verification

---

### Weeks 9–10: Scout Network & Swarm Coordination

**Objective:** Deploy autonomous monitoring scouts and complete the full orchestration loop from Queen → HITL → Swarm → Memory → Response.

#### Week 9: Scout Network

| # | Deliverable | Description | Effort |
|---|---|---|---|
| 9.1 | Database schemas | `naos_scouts`, `naos_scout_observations`, `naos_alerts` | 6h |
| 9.2 | `ScoutNetwork` class | Scout deployment, scheduling (cron-based), manual trigger, pause/resume | 8h |
| 9.3 | Collector framework | HTTP, TCP, database, metrics collectors with timeout handling | 8h |
| 9.4 | `AnomalyDetector` class | Z-Score and IQR algorithms (start simple, expand later) | 6h |
| 9.5 | Threshold engine | Multi-threshold evaluation with severity cascading | 4h |
| 9.6 | `Monitor` class | Health check runner with uptime tracking and history | 4h |
| 9.7 | Alert lifecycle | Create → acknowledge → resolve/snooze, deduplication, notification routing | 6h |
| 9.8 | Alert channels | Slack webhook, email, in-app notification integration | 4h |
| 9.9 | React components | `ScoutMonitorGrid`, `AlertTimeline` — operator dashboards | 6h |
| 9.10 | Tests | Scout execution, anomaly detection accuracy, alert deduplication | 4h |

#### Week 10: Full Orchestration Integration

| # | Deliverable | Description | Effort |
|---|---|---|---|
| 10.1 | End-to-end orchestration | Queen → plan → HITL (if needed) → Swarm dispatch → Pod execution → Memory → Response | 10h |
| 10.2 | Adaptive re-planning | Queen re-plans if a task fails, routing to different pods or simplifying approach | 6h |
| 10.3 | Real-time progress | WebSocket/SSE progress updates via `@mcv/fabric` real-time subscriptions | 6h |
| 10.4 | Dashboard integration | `SwarmDashboard`, `TaskGraphVisualizer`, `AgentRegistryPanel` React components | 8h |
| 10.5 | API routes | Complete REST API for all submodules, Zod-validated, RLS-enforced | 6h |
| 10.6 | Event-driven triggers | Scout alerts → Queen investigation → automated remediation proposals | 4h |
| 10.7 | Cross-module integration tests | 10 end-to-end scenarios covering all submodules | 8h |

#### Phase 2 Milestone Definition of Done

- [ ] **Full orchestration loop** works end-to-end: human request → Queen → HITL → Swarm → Memory → response
- [ ] All 8 Ralph pods operational with domain-specific behavior
- [ ] HITL approval workflow blocks/allows execution correctly
- [ ] Reasoning engine produces verifiable, traceable conclusions
- [ ] Scout network detects anomalies and generates alerts
- [ ] Dashboard renders real-time agent and task status
- [ ] < 5s total latency for a 3-task parallel execution plan

---

## Phase 3: Advanced (Weeks 11–16)

**Goal:** Elevate the system from functional multi-agent orchestration to intelligent, learning, and cross-venture operations with RAG-powered memory, autonomous planning, and collaborative agent behaviors.

### Weeks 11–12: Multi-Agent Collaboration

**Objective:** Agents can collaborate on complex tasks, sharing context, delegating sub-work, and negotiating resource allocation.

#### Deliverables

| # | Deliverable | Description | Effort |
|---|---|---|---|
| 11.1 | Agent-to-agent messaging | Structured message passing between agents via Redis pub/sub | 8h |
| 11.2 | Shared context protocol | Agents share working memory subsets with collaborators via scoped Redis keys | 6h |
| 11.3 | Delegation chains | Ralph pod delegates sub-tasks to other Ralph pods (with Queen oversight) | 8h |
| 11.4 | Consensus coordination | Multiple agents vote on approach before execution (for `consensus` swarm strategy) | 6h |
| 11.5 | Pipeline coordination | Sequential hand-off between pods with intermediate validation (for `pipeline` swarm strategy) | 6h |
| 11.6 | Hierarchical coordination | Queen spawns sub-Queens for complex multi-domain requests | 8h |
| 11.7 | Conflict resolution | When agents disagree, Queen arbitrates based on confidence scores and domain expertise | 4h |
| 11.8 | Agent peer review | Smith pod code → another Smith instance reviews → merge only if both approve | 6h |
| 11.9 | Collaboration metrics | Track collaboration patterns, identify bottlenecks, measure quality impact | 4h |
| 11.10 | Tests | Delegation chains, consensus, pipeline, conflict resolution | 6h |

---

### Weeks 13–14: RAG-Powered Memory & Knowledge Graph

**Objective:** Transform basic memory into a Deep RAG system with recursive retrieval, knowledge graph integration, automatic consolidation, and PII protection.

#### Deliverables

| # | Deliverable | Description | Effort |
|---|---|---|---|
| 13.1 | Neo4j integration | Knowledge graph setup, entity/relationship CRUD, Cypher query builder | 10h |
| 13.2 | `SemanticMemory` class | Subject-predicate-object triples, fact validation, inference rules | 8h |
| 13.3 | `DeepRAGProcessor` class | Recursive retrieval with gap detection, multi-hop queries, depth-limited search | 10h |
| 13.4 | Hybrid retrieval | Merge vector search (pgvector) + graph traversal (Neo4j) with unified re-ranking | 8h |
| 13.5 | Contradiction detection | Compare new facts against existing knowledge, confidence-based resolution | 6h |
| 13.6 | Automatic consolidation | Cron-based: cluster episodic memories → synthesize semantic facts → update knowledge graph | 8h |
| 13.7 | PII scrubbing pipeline | Shield pod integration: sanitize passwords, API keys, personal data before long-term storage | 6h |
| 13.8 | Working memory optimization | Redis-based sliding window, LRU eviction, importance-weighted retention | 4h |
| 13.9 | Procedural memory | Store learned procedures (tool call sequences that worked well) for reuse | 4h |
| 13.10 | Cross-venture synthesis | Queen-level global memory queries (with special capability gate) | 4h |
| 13.11 | `MemoryExplorer` component | React UI for browsing, searching, and auditing agent memories | 6h |
| 13.12 | Latency optimization | Target: < 50ms vector, < 100ms graph, < 800ms Deep RAG p95 | 4h |
| 13.13 | Tests | Deep RAG accuracy, contradiction resolution, consolidation, PII scrubbing | 6h |

---

### Weeks 15–16: Autonomous Planning & Cross-Venture Agents

**Objective:** The system can autonomously propose and execute improvement plans, and agents can operate across venture boundaries for portfolio-level intelligence.

#### Deliverables

| # | Deliverable | Description | Effort |
|---|---|---|---|
| 15.1 | `GenesisEngine` class | Intent-to-blueprint: user intent → research → spec → acceptance criteria → Ralph blueprint | 10h |
| 15.2 | SPARC pipeline | Full Specification → Pseudocode → Architecture → Refinement → Completion pipeline | 8h |
| 15.3 | Proactive proposals | Scout anomalies → Queen analyzes → proposes remediation plan → awaits HITL approval | 8h |
| 15.4 | Analogical reasoning | Find similar past tasks, adapt successful approaches to new problems | 6h |
| 15.5 | Counterfactual reasoning | "What if" scenario exploration for strategic decision support | 6h |
| 15.6 | Cross-venture Queen | Portfolio-level agent with read access to all venture memories | 6h |
| 15.7 | Cross-venture reports | Automated portfolio health, financial roll-up, cross-venture insights | 6h |
| 15.8 | Venture persona system | Each venture gets personality tuning: BetEdge (casual sports), Futurestate (professional), etc. | 4h |
| 15.9 | A/B testing framework | Prompt variant testing, model comparison, statistical significance tracking | 8h |
| 15.10 | Advanced anomaly detection | Isolation Forest and Prophet algorithms for multi-dimensional and seasonal anomalies | 6h |
| 15.11 | Tests | Genesis Engine output quality, SPARC pipeline, cross-venture isolation, A/B stats | 6h |

#### Phase 3 Milestone Definition of Done

- [ ] Multi-agent collaboration produces higher-quality results than single-agent execution
- [ ] Deep RAG retrieves multi-hop knowledge in < 800ms p95
- [ ] Knowledge graph contains validated semantic facts with entity relationships
- [ ] Genesis Engine produces actionable blueprints from vague intents
- [ ] Cross-venture reports aggregate data without manual intervention
- [ ] PII scrubbing catches 99%+ of sensitive data patterns
- [ ] Proactive proposals generate actionable improvement plans from scout alerts

---

## Phase 4: Polish (Weeks 17–20)

**Goal:** Production hardening, performance optimization, documentation completion, monitoring dashboards, security audit, and operational readiness.

### Week 17: Performance Optimization

| # | Deliverable | Description | Effort |
|---|---|---|---|
| 17.1 | Connection pooling | PostgreSQL and Neo4j connection pool tuning, idle connection management | 4h |
| 17.2 | Redis pipeline optimization | Batch Redis operations, pipeline reads, reduce round trips | 4h |
| 17.3 | Embedding cache | LRU cache for frequently accessed embeddings, reducing re-computation | 4h |
| 17.4 | Query optimization | Analyze and optimize slow queries (pg_stat_statements), add missing indexes | 6h |
| 17.5 | LLM response streaming | Stream LLM responses for real-time progress, reduce time-to-first-token | 4h |
| 17.6 | Worker pool auto-tuning | Dynamic min/max adjustment based on historical load patterns | 4h |
| 17.7 | Load testing | Simulate 100 concurrent agent sessions, identify and fix bottlenecks | 8h |
| 17.8 | Memory profiling | Identify and fix memory leaks in long-running agent sessions | 4h |

### Week 18: Security Hardening

| # | Deliverable | Description | Effort |
|---|---|---|---|
| 18.1 | RLS policy audit | Verify every table has correct RLS policies, test cross-venture isolation | 6h |
| 18.2 | Input sanitization | Ensure all user inputs are sanitized before LLM injection (prompt injection defense) | 6h |
| 18.3 | Instrument access audit | Review all instrument capabilities, ensure no privilege escalation paths | 4h |
| 18.4 | Rate limiting | Per-user, per-venture, per-agent rate limits on all API routes | 4h |
| 18.5 | Audit logging | Comprehensive audit trail for all state-changing operations | 4h |
| 18.6 | Secret management | Verify no secrets in code, environment variable validation on startup | 3h |
| 18.7 | Cost guardrails | Hard spending limits per venture, per agent, per day with automatic shutoff | 4h |
| 18.8 | Penetration testing | Attempt prompt injection, privilege escalation, data exfiltration | 8h |

### Week 19: Monitoring & Observability

| # | Deliverable | Description | Effort |
|---|---|---|---|
| 19.1 | OpenTelemetry traces | Distributed tracing across all agent operations with span annotations | 6h |
| 19.2 | Metrics dashboards | Grafana dashboards: agent utilization, task throughput, error rates, costs | 8h |
| 19.3 | Alerting rules | PagerDuty/OpsGenie integration for critical system alerts | 4h |
| 19.4 | Cost dashboard | Real-time LLM spend tracking per venture, per agent, per model | 4h |
| 19.5 | Health endpoints | `/health`, `/ready`, `/metrics` endpoints for each submodule | 3h |
| 19.6 | Log aggregation | Structured JSON logging with correlation IDs, searchable in Loki/CloudWatch | 4h |
| 19.7 | SLA monitoring | Track and report on latency, uptime, and error rate SLAs | 4h |
| 19.8 | Runbook documentation | Operational runbooks for common failure scenarios and recovery procedures | 6h |

### Week 20: Documentation & Launch Preparation

| # | Deliverable | Description | Effort |
|---|---|---|---|
| 20.1 | API documentation | OpenAPI 3.1 spec for all REST endpoints, auto-generated from Zod schemas | 6h |
| 20.2 | Architecture guide | Updated technical architecture document with final implementation details | 4h |
| 20.3 | Operator guide | How to deploy, configure, monitor, and troubleshoot the Agentic OS | 6h |
| 20.4 | Developer guide | How to create custom agents, instruments, prompts, and scouts | 6h |
| 20.5 | Storybook | Component library documentation for all React components | 4h |
| 20.6 | Migration guide | Database migration procedures, rollback plans, data seeding | 3h |
| 20.7 | Production deployment | Staging → production deployment with feature flags and gradual rollout | 6h |
| 20.8 | Launch checklist | Final verification of all acceptance criteria, sign-off from stakeholders | 4h |

#### Phase 4 Milestone Definition of Done

- [ ] System handles 100 concurrent sessions with < 2s p95 latency
- [ ] No critical or high-severity security vulnerabilities
- [ ] Full observability: traces, metrics, logs, dashboards, alerts
- [ ] Complete documentation: API, architecture, operator, developer
- [ ] Production deployment with feature flags and monitoring

---

## Testing Strategy

### Test Pyramid

```
                    ┌────────────┐
                    │   E2E (10) │  Full orchestration scenarios
                   ┌┴────────────┴┐
                   │ Integration   │  Cross-module, database, LLM
                   │    (50+)      │
                  ┌┴───────────────┴┐
                  │   Unit (200+)    │  Pure logic, schemas, utilities
                  └──────────────────┘
```

### Unit Tests (200+ tests)

**Coverage target: 95%+**

| Module | Test Focus | Count |
|---|---|---|
| NAOS | Capability checks, instrument validation, rate limiting, cost calculation, session lifecycle | 30+ |
| Queen | Task decomposition, cycle detection, parallel grouping, risk scoring, cost estimation | 25+ |
| Swarm | Pod selection, dispatch logic, retry behavior, result aggregation, worker pool scaling | 25+ |
| Scouts | Threshold evaluation, anomaly detection (Z-Score, IQR), alert deduplication, schedule parsing | 20+ |
| HITL | Quorum calculation (all modes), workflow step progression, escalation trigger, timeout handling | 25+ |
| Memory | Embedding generation, vector search scoring, recency bias, contradiction detection, PII scrubbing | 25+ |
| Prompts | Variable validation, Handlebars rendering, version resolution, chain step mapping | 20+ |
| Reasoning | Strategy selection, CoT step generation, ToT branching, self-consistency voting, confidence scoring | 25+ |
| Schemas | Zod schema validation for every input type, edge cases, error messages | 20+ |

### Integration Tests (50+ tests)

**Database, Redis, and LLM required (use test fixtures and mocked LLM responses).**

| Scenario Category | Tests | Description |
|---|---|---|
| Agent lifecycle | 5 | Register → session → execute → metrics → status |
| Queen orchestration | 8 | Decompose → plan → risk assess → allocate → dispatch |
| HITL workflow | 8 | Request → notify → approve/reject → escalate → resolve |
| Memory operations | 6 | Store → search → consolidate → retrieve → contradict → resolve |
| Prompt management | 5 | Create → version → render → chain → deprecate |
| Scout monitoring | 5 | Deploy → schedule → collect → detect → alert |
| Swarm execution | 6 | Create swarm → add agents → coordinate → progress → result |
| Reasoning | 5 | Start chain → trace → evaluate → explain → verify |
| Cross-module | 5 | Full loops involving 3+ submodules |

### End-to-End Tests (10 scenarios)

**Full stack with real (or stubbed) LLM responses, databases, and Redis.**

| # | Scenario | Modules Exercised |
|---|---|---|
| E2E-1 | "Write a blog post about AI trends" — simple content creation | Queen, Swarm (Scribe), Memory, Prompts |
| E2E-2 | "Deploy new feature to staging" — development with code execution | Queen, Swarm (Smith), HITL, Memory |
| E2E-3 | "Transfer $50,000 to vendor" — financial operation requiring HITL | Queen, HITL, Swarm (Ledger), Memory |
| E2E-4 | "Analyze Q1 performance across all ventures" — cross-venture query | Queen, Swarm (Oracle), Memory, Reasoning |
| E2E-5 | "Scout detects API latency spike → auto-investigate" — reactive | Scouts, Queen, Swarm (Smith, Oracle) |
| E2E-6 | "Plan Q2 marketing strategy" — multi-pod collaboration | Queen, Swarm (Growth, Oracle, Scribe), Memory, Reasoning |
| E2E-7 | "HITL approval timeout → escalation → auto-approve" — edge case | HITL, Queen, Swarm |
| E2E-8 | "Run security audit and generate compliance report" | Queen, Swarm (Shield, Oracle, Scribe), HITL |
| E2E-9 | "Deep RAG memory retrieval with knowledge gap filling" | Memory (Deep RAG), Reasoning |
| E2E-10 | "Genesis Engine: vague intent → full execution blueprint" | Reasoning (Genesis), Queen, Memory |

### Performance Tests

| Metric | Target | Test Method |
|---|---|---|
| Agent session creation | < 200ms | Benchmark with 100 iterations |
| Simple task execution (1 tool call) | < 3s | 50 concurrent executions |
| Complex task execution (5+ tool calls) | < 15s | 20 concurrent executions |
| Vector memory search | < 50ms | 1000 queries against 100k entries |
| Knowledge graph query | < 100ms | 500 queries against 10k nodes |
| Deep RAG retrieval (depth 3) | < 800ms p95 | 100 queries |
| HITL request creation | < 500ms | Includes notification dispatch |
| Prompt rendering | < 10ms | 1000 renders |
| 100 concurrent sessions | Stable, no OOM | 30-minute sustained load |

### Test Infrastructure

```typescript
// Test configuration
const testConfig = {
  database: 'postgresql://test@localhost:5432/naos_test',
  redis: 'redis://localhost:6379/1',
  neo4j: 'bolt://localhost:7687',
  llm: {
    provider: 'mock',                  // Use MockLLM for unit/integration tests
    fallback: 'openrouter',            // Use real LLM for E2E tests only
  },
  fixtures: {
    agents: './test/fixtures/agents.json',
    prompts: './test/fixtures/prompts.json',
    memories: './test/fixtures/memories.json',
  },
};

// MockLLM for deterministic testing
class MockLLM {
  constructor(private responses: Map<string, MockResponse>) {}

  async complete(request: LLMRequest): Promise<LLMResponse> {
    const key = this.matchRequest(request);
    return this.responses.get(key) ?? this.defaultResponse;
  }
}
```

---

## Acceptance Criteria

### Functional Acceptance

| ID | Criterion | Verification |
|---|---|---|
| AC-01 | Agents register with typed capabilities and instruments | Unit test: capability assignment and retrieval |
| AC-02 | Agent sessions track cost, tokens, and tool calls | Integration test: execute 5 tasks, verify aggregate metrics |
| AC-03 | Queen decomposes requests into valid task graphs | E2E test: 5 different request types, verify decomposition quality |
| AC-04 | Task dependency graphs execute in correct order | Integration test: verify parallel groups and sequential dependencies |
| AC-05 | All 8 Ralph pods execute domain-specific tasks | E2E test: one task per pod type, verify correct instrument usage |
| AC-06 | HITL blocks high-risk operations until approved | E2E test: financial transfer blocked, approved only after human decision |
| AC-07 | HITL escalation triggers at 75% deadline | Integration test: time-advance simulation |
| AC-08 | Memory stores and retrieves with vector similarity | Integration test: store 100 memories, query with 90%+ recall accuracy |
| AC-09 | Deep RAG fills knowledge gaps across retrieval hops | E2E test: query requiring 2-hop retrieval, verify gap detection |
| AC-10 | Prompt templates render correctly with all variable types | Unit test: string, number, boolean, array, object, conditional |
| AC-11 | Prompt versioning maintains immutability | Integration test: create v1, create v2, verify v1 unchanged |
| AC-12 | Reasoning engine produces traceable multi-step chains | E2E test: tree-of-thought with 3 branches, verify trace completeness |
| AC-13 | Truth verification catches incorrect LLM assertions | Integration test: inject false assertion, verify rejection |
| AC-14 | Scouts detect anomalies and generate alerts | Integration test: inject anomalous data point, verify alert |
| AC-15 | Alert deduplication prevents duplicate notifications | Integration test: trigger same condition 5x, verify single alert |
| AC-16 | Cross-venture memory isolation enforced by RLS | Security test: attempt cross-venture query without capability |
| AC-17 | Cost budgets enforced with graceful termination | Integration test: set $0.01 budget, verify termination with partial result |
| AC-18 | Full orchestration loop completes in < 30s for standard requests | Performance test: 10 standard requests, measure p95 |

### Non-Functional Acceptance

| ID | Criterion | Target | Verification |
|---|---|---|---|
| NF-01 | System uptime | 99.5% | Monitoring SLA tracking |
| NF-02 | Standard task p95 latency | < 5s | Performance tests |
| NF-03 | Complex task p95 latency | < 30s | Performance tests |
| NF-04 | Vector search p95 latency | < 50ms | Performance tests |
| NF-05 | Concurrent sessions | 100+ stable | Load test |
| NF-06 | Unit test coverage | 95%+ | Coverage report |
| NF-07 | Zero critical security findings | 0 | Penetration test |
| NF-08 | Average task cost | < $0.10 | Cost tracking dashboard |
| NF-09 | HITL response time (human) | < 4h median | Queue analytics |
| NF-10 | Memory consolidation | 100% of episodic → semantic within 8h | Cron monitoring |

---

## Risk Assessment

### Technical Risks

| Risk | Impact | Probability | Mitigation |
|---|---|---|---|
| **LLM API instability** — OpenRouter or upstream providers have outages | High | Medium | Multi-provider fallback chain (OpenRouter → direct Anthropic → direct OpenAI). Circuit breaker pattern with 5-minute cooldown. Redis queue buffers tasks during outages. |
| **LLM cost overrun** — Agents consume more tokens than budgeted | High | Medium | Per-session cost budgets with hard enforcement. Model tier routing (economy for simple tasks). Cost anomaly scout with real-time alerts. Daily spend caps per venture. |
| **Prompt injection attacks** — Malicious inputs manipulate agent behavior | Critical | Medium | Input sanitization layer. Capability-based access prevents escalation. All external inputs treated as untrusted data. HITL gate on sensitive operations. Regular red-team exercises. |
| **Knowledge graph corruption** — Incorrect facts stored with high confidence | High | Low | Contradiction detection on every store. Dual-source verification for critical facts. Human review queue for high-importance semantic entries. Soft-delete with recovery. |
| **Memory scaling** — Vector index performance degrades with millions of entries | Medium | Medium | Partitioned pgvector indexes by venture. Archival policy for old memories. Pinecone fallback for high-volume ventures. Embedding compression research. |
| **Neo4j availability** — Knowledge graph becomes a single point of failure | Medium | Low | Graceful degradation: if Neo4j is down, fall back to vector-only search. Neo4j AuraDB with automatic backups. Read replicas for query load. |
| **HITL bottleneck** — Approval queue backs up, blocking task execution | High | Medium | Escalation rules with auto-approve for low-risk after timeout. Multiple approver pools. Mobile push notifications for urgent requests. Historical data: most approvals < 30 minutes. |
| **Recursive reasoning loops** — Reasoning engine enters infinite recursion | Medium | Low | Hard depth limit (5). Cycle detection in reasoning chains. Timeout enforcement per reasoning session. Token budget acts as secondary limit. |

### Organizational Risks

| Risk | Impact | Probability | Mitigation |
|---|---|---|---|
| **Scope creep** — Feature requests expand scope beyond 20-week plan | High | High | Strict phase gating. New features go to backlog, not current phase. Product owner empowered to say no. Weekly scope review. |
| **Key person dependency** — Critical knowledge in one engineer's head | High | Medium | Pair programming for all complex modules. Architecture decision records (ADRs). Comprehensive inline documentation. Knowledge sharing sessions every 2 weeks. |
| **Cross-team coordination** — Dependency on `@mcv/intelligence`, `@mcv/fabric` teams | Medium | Medium | Define APIs early (Week 0). Use contract testing. Mock external dependencies for development. Weekly sync with dependent teams. |
| **Infrastructure delays** — Neo4j, Redpanda, or E2B provisioning takes longer than expected | Medium | Low | Start infrastructure provisioning in Week 0 (before Phase 1). Dockerized local development with all services. Cloud infrastructure can be provisioned in parallel. |

### Risk Severity Matrix

```
                    Impact
                Low    Medium    High    Critical
           ┌────────┬─────────┬────────┬──────────┐
  High     │        │ Scope   │ Cost   │          │
           │        │ creep   │ overrun│          │
Probability├────────┼─────────┼────────┼──────────┤
  Medium   │        │ Memory  │ HITL   │ Prompt   │
           │        │ scaling │ bottle │ injection│
           │        │ Key pers│ LLM API│          │
           ├────────┼─────────┼────────┼──────────┤
  Low      │        │ Neo4j   │ KG     │          │
           │        │ avail   │ corrupt│          │
           │ Infra  │ Recurse │        │          │
           └────────┴─────────┴────────┴──────────┘
```

---

## Timeline

### Gantt Overview

```
Week  1  2  3  4  5  6  7  8  9 10 11 12 13 14 15 16 17 18 19 20
      ├──┼──┼──┼──┤──┼──┼──┼──┼──┼──┤──┼──┼──┼──┼──┼──┤──┼──┼──┼──┤
      │  PHASE 1   │     PHASE 2        │     PHASE 3        │ PHASE 4  │
      │ Foundation  │     Core           │     Advanced       │  Polish  │
      ├──┼──┼──┼──┤──┼──┼──┼──┼──┼──┤──┼──┼──┼──┼──┼──┤──┼──┼──┼──┤
NAOS  │██████████│  │  │  │  │  │  │  │  │  │  │  │  │  │  │  │  │  │
      │W1  │W2  │  │  │  │  │  │  │  │  │  │  │  │  │  │  │  │  │  │
Mem   │  │  │████│  │  │  │  │  │  │  │  │  │██████│  │  │  │  │  │  │
      │  │  │W3  │  │  │  │  │  │  │  │  │  │W13-14│  │  │  │  │  │  │
Prompt│  │  │  │██│  │  │  │  │  │  │  │  │  │  │  │  │  │  │  │  │  │
      │  │  │  │W4│  │  │  │  │  │  │  │  │  │  │  │  │  │  │  │  │  │
Queen │  │  │  │  │██│  │  │  │  │  │  │  │  │  │  │  │  │  │  │  │  │
      │  │  │  │  │W5│  │  │  │  │  │  │  │  │  │  │  │  │  │  │  │  │
Swarm │  │  │  │  │  │██│  │  │  │  │  │  │  │  │  │  │  │  │  │  │  │
      │  │  │  │  │  │W6│  │  │  │  │  │  │  │  │  │  │  │  │  │  │  │
HITL  │  │  │  │  │  │  │██│  │  │  │  │  │  │  │  │  │  │  │  │  │  │
      │  │  │  │  │  │  │W7│  │  │  │  │  │  │  │  │  │  │  │  │  │  │
Reason│  │  │  │  │  │  │  │██│  │  │  │  │  │  │██████│  │  │  │  │  │
      │  │  │  │  │  │  │  │W8│  │  │  │  │  │  │W15-16│  │  │  │  │  │
Scouts│  │  │  │  │  │  │  │  │██│  │  │  │  │  │  │  │  │  │  │  │  │
      │  │  │  │  │  │  │  │  │W9│  │  │  │  │  │  │  │  │  │  │  │  │
Integ │  │  │  │  │  │  │  │  │  │██│  │  │  │  │  │  │  │  │  │  │  │
      │  │  │  │  │  │  │  │  │  │W10│  │  │  │  │  │  │  │  │  │  │  │
Collab│  │  │  │  │  │  │  │  │  │  │██████│  │  │  │  │  │  │  │  │  │
      │  │  │  │  │  │  │  │  │  │  │W11-12│  │  │  │  │  │  │  │  │  │
Perf  │  │  │  │  │  │  │  │  │  │  │  │  │  │  │  │  │██│  │  │  │  │
Sec   │  │  │  │  │  │  │  │  │  │  │  │  │  │  │  │  │  │██│  │  │  │
Obs   │  │  │  │  │  │  │  │  │  │  │  │  │  │  │  │  │  │  │██│  │  │
Docs  │  │  │  │  │  │  │  │  │  │  │  │  │  │  │  │  │  │  │  │██│  │
      ├──┼──┼──┼──┤──┼──┼──┼──┼──┼──┤──┼──┼──┼──┼──┼──┤──┼──┼──┼──┤
      M1          M2                   M3                   M4
      (Single     (Full               (Advanced            (Production
       Agent)      Orchestration)      Intelligence)        Ready)
```

### Milestones

| Milestone | Week | Gate Criteria | Stakeholder Sign-off |
|---|---|---|---|
| **M1: Single Agent Runtime** | Week 4 | Agent registers, executes tasks, stores memories, renders prompts. All Phase 1 DoD items pass. | Engineering Lead |
| **M2: Full Orchestration** | Week 10 | Queen → HITL → Swarm → Memory → Response loop works end-to-end. All Phase 2 DoD items pass. | Engineering Lead + Product Owner |
| **M3: Advanced Intelligence** | Week 16 | Multi-agent collaboration, Deep RAG, Genesis Engine, cross-venture agents operational. All Phase 3 DoD items pass. | Engineering Lead + CTO |
| **M4: Production Ready** | Week 20 | Performance targets met, security audit passed, documentation complete, monitoring live. All acceptance criteria pass. | CTO + CEO |

### Sprint Cadence

- **Sprint length:** 1 week
- **Sprint planning:** Monday morning (30 min)
- **Daily standups:** 15 min async (Slack thread)
- **Sprint review:** Friday afternoon (30 min demo)
- **Retrospective:** Every 2 weeks (45 min)
- **Architecture review:** End of each phase (2h)

### Resource Allocation by Phase

| Phase | Senior AI | Full-Stack | Platform | AI/ML | QA | Total Person-Weeks |
|---|---|---|---|---|---|---|
| Phase 1 (4 wks) | 2×4=8 | 1×4=4 | 1×2=2 | 0 | 1×2=2 | **16** |
| Phase 2 (6 wks) | 2×6=12 | 2×6=12 | 1×3=3 | 0.5×6=3 | 1×4=4 | **34** |
| Phase 3 (6 wks) | 2×6=12 | 2×6=12 | 1×4=4 | 1×6=6 | 1×4=4 | **38** |
| Phase 4 (4 wks) | 1×4=4 | 2×4=8 | 1×4=4 | 0.5×4=2 | 1×4=4 | **22** |
| **Total** | **36** | **36** | **13** | **11** | **14** | **110 person-weeks** |

### Critical Path

The critical path runs through these sequential dependencies:

```
NAOS Runtime (W1-2)
  └─▶ Agent Execution (W2)
       └─▶ Queen Decomposition (W5)
            └─▶ Swarm Execution (W6)
                 └─▶ HITL Integration (W7)
                      └─▶ Full Orchestration (W10)
                           └─▶ Multi-Agent Collaboration (W11-12)
                                └─▶ Production Hardening (W17-20)
```

**Critical path duration:** 16 weeks (Weeks 1–12 + 17–20)

Memory, Prompts, Reasoning, and Scouts can progress in parallel with the critical path, providing 4 weeks of schedule float.

### Key Dates (Projected)

| Date | Event |
|---|---|
| **Feb 10, 2026** | Phase 1 kickoff |
| **Mar 9, 2026** | M1: Single Agent Runtime |
| **Apr 20, 2026** | M2: Full Orchestration |
| **Jun 1, 2026** | M3: Advanced Intelligence |
| **Jun 29, 2026** | M4: Production Ready |
| **Jul 2026** | Internal launch across MCV.ONE ventures |
| **Q3 2026** | White-label preparation |
| **2027** | SaaS offering |

---

*@mcv/agentic-os — Neural Agentic Operating System*
