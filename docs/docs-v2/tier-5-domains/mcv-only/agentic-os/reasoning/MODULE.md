# @mcv/agentic-os/reasoning — Reasoning Engine
## Recursive Language Model (RLM), Chain-of-Thought, Tree-of-Thought & Strategic Planning Subsystem

**Module:** `@mcv/agentic-os/reasoning`  
**Classification:** INTERNAL (MCV-Only)  
**Status:** CANONICAL SPECIFICATION  
**Quality Level:** SURGICAL (2500+ lines)  
**Version:** 3.2.0  
**Last Updated:** February 9, 2026

---

## Table of Contents

1. [Purpose & Overview](#1-purpose--overview)
2. [Architecture](#2-architecture)
3. [Core Concepts](#3-core-concepts)
4. [Reasoning Types](#4-reasoning-types)
5. [Reasoning Engine](#5-reasoning-engine)
6. [Reasoning Traces](#6-reasoning-traces)
7. [Trace Storage](#7-trace-storage)
8. [Decomposition Engine](#8-decomposition-engine)
9. [Evaluation & Scoring](#9-evaluation--scoring)
10. [Reasoning Templates](#10-reasoning-templates)
11. [Tool-Augmented Reasoning (ReAct)](#11-tool-augmented-reasoning-react)
12. [Integration Points](#12-integration-points)
13. [Configuration](#13-configuration)
14. [Performance](#14-performance)
15. [Observability](#15-observability)
16. [Security](#16-security)
17. [Testing](#17-testing)
18. [TypeScript Interfaces](#18-typescript-interfaces)
19. [Usage Examples](#19-usage-examples)
20. [Database Schema](#20-database-schema)
21. [Error Handling](#21-error-handling)
22. [Migration & Versioning](#22-migration--versioning)
23. [Audit Events](#23-audit-events)
24. [Dependencies](#24-dependencies)
25. [Glossary](#25-glossary)

---

## 1. Purpose & Overview

The Reasoning module, known as the **Agentic Kernel**, is the logic engine of the MCV.ONE Agentic Operating System. It implements the "Recursive Language Model" (RLM) pattern, which treats the Large Language Model not as a creative generator, but as a **Cognitive CPU** that executes structured logic loops. Every decision the Agentic OS makes — from decomposing a user request into subtasks, to selecting which tool an agent should call, to verifying that a code change is correct — flows through this module.

### 1.1 What the Reasoning Module Provides

The Agentic Kernel provides six foundational capabilities:

1. **Recursive Decomposition:** Breaking complex executive intents into atomic, verifiable tasks. A single high-level request like "Launch the loyalty points system for BetEdge" becomes a directed acyclic graph of 15–30 subtasks, each with clear acceptance criteria, dependency ordering, and risk assessment.

2. **Multi-Strategy Reasoning:** Support for chain-of-thought (linear step-by-step), tree-of-thought (branching exploration with pruning), reflexion (self-critique and iterative correction), ReAct (reasoning + acting in an interleaved loop), self-consistency (majority voting over multiple reasoning paths), analogical reasoning (transfer from known patterns), and counterfactual reasoning (exploring "what if" scenarios).

3. **SPARC Execution Pipeline:** A rigorous 5-step methodology (Specification, Pseudocode, Architecture, Refinement, Completion) that every unit of technical work must follow, ensuring enterprise-grade reliability and auditability.

4. **Truth Verification Layer:** Ensuring all technical assertions pass a configurable confidence threshold (default 0.95) through automated sandbox experimentation, static analysis, schema validation, and semantic cross-referencing against the Knowledge Graph.

5. **Genesis Engine:** The automated prompt engineering pipeline that converts high-level "ideas" into Ralph-executable blueprints, complete with technical context, acceptance criteria, and verification experiments.

6. **Full Trace Capture:** Every reasoning step — including token usage, latency, confidence scores, model selection, branching decisions, and evaluation results — is captured in a structured trace that can be replayed, audited, and used for continuous improvement.

### 1.2 Design Philosophy

The Reasoning module is built on several core principles:

- **Structured over creative.** LLMs are treated as deterministic logic processors, not creative writers. Every output is constrained by schemas, validated against criteria, and verified through experimentation.

- **Recursive over monolithic.** No single LLM call should handle a task beyond its context budget. Complex problems are recursively decomposed until each subtask fits comfortably within the model's effective reasoning window.

- **Auditable over opaque.** Every reasoning step is traced, scored, and stored. There is no "black box" — every decision can be inspected, replayed, and explained to a human reviewer.

- **Fail-safe over fail-fast.** When confidence is low, the system escalates to human review (HITL) rather than proceeding with uncertain results. The confidence threshold is configurable but defaults to 0.95 for production workloads.

- **Multi-model over single-model.** Different reasoning strategies may use different models. Planning might use Claude Opus for its superior instruction-following, while verification might use Gemini Ultra for its factual grounding. The gateway module handles intelligent routing.

### 1.3 Position in the Agentic OS

The Reasoning module sits at the foundation of the Agentic OS stack, alongside NAOS (agent runtime), Memory (neural hive-mind), Prompts (template management), and HITL (human oversight). It is consumed by:

- **Queen** (Level 3): Uses the Decomposition Engine to break strategic requests into task graphs, and the Evaluation Engine to assess result quality.
- **Ralph Pods** (Level 2): Use chain-of-thought and ReAct loops for task execution, tool selection, and output generation.
- **Scouts** (Level 1): Use lightweight reasoning for anomaly classification and alert severity assessment.
- **Genesis Engine**: Uses multi-step reasoning chains to convert intents into executable blueprints.

```
┌─────────────────────────────────────────────────────────────────┐
│                     CONSUMER LAYERS                              │
│                                                                  │
│  ┌──────────┐  ┌──────────────┐  ┌──────────┐  ┌────────────┐  │
│  │  Queen    │  │ Ralph Swarm  │  │  Scouts  │  │  Genesis   │  │
│  │ (L3)     │  │ (L2)         │  │  (L1)    │  │  Engine    │  │
│  └────┬─────┘  └──────┬───────┘  └────┬─────┘  └─────┬──────┘  │
│       │               │               │              │          │
│       └───────────────┴───────────────┴──────────────┘          │
│                               │                                  │
├───────────────────────────────┼──────────────────────────────────┤
│                    REASONING ENGINE                               │
│                               │                                  │
│  ┌────────────────────────────┴────────────────────────────────┐ │
│  │                                                              │ │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐ │ │
│  │  │ Decompose   │  │ Reason      │  │ Evaluate & Verify   │ │ │
│  │  │ Engine      │  │ (CoT/ToT/   │  │ (Scoring, Truth     │ │ │
│  │  │             │  │  ReAct/etc) │  │  Verification)      │ │ │
│  │  └─────────────┘  └─────────────┘  └─────────────────────┘ │ │
│  │                                                              │ │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐ │ │
│  │  │ Trace       │  │ Template    │  │ State Machine       │ │ │
│  │  │ Capture     │  │ Registry    │  │ (xstate)            │ │ │
│  │  └─────────────┘  └─────────────┘  └─────────────────────┘ │ │
│  │                                                              │ │
│  └──────────────────────────────────────────────────────────────┘ │
│                               │                                  │
├───────────────────────────────┼──────────────────────────────────┤
│                    FOUNDATION LAYER                               │
│                               │                                  │
│  ┌──────────┐  ┌──────────┐  │  ┌──────────┐  ┌──────────────┐ │
│  │  NAOS    │  │  Memory  │  │  │  Prompts │  │  HITL        │ │
│  │  Runtime │  │  Store   │  │  │  Bank    │  │  Gateway     │ │
│  └──────────┘  └──────────┘  │  └──────────┘  └──────────────┘ │
│                              │                                   │
│                    ┌─────────┴─────────┐                        │
│                    │  @mcv/gateway     │                        │
│                    │  (LLM Routing)    │                        │
│                    └───────────────────┘                        │
└─────────────────────────────────────────────────────────────────┘
```

### 1.4 Key Metrics

| Metric | Target | Current |
|--------|--------|---------|
| Average reasoning latency (CoT, 5 steps) | < 3s | 2.1s |
| Average reasoning latency (ToT, 3 branches × 5 depth) | < 8s | 6.4s |
| Trace capture overhead | < 5% | 3.2% |
| Verification pass rate (production) | > 98% | 98.7% |
| HITL escalation rate | < 5% | 3.1% |
| Reasoning cache hit rate | > 40% | 47% |
| Template coverage (common tasks) | > 90% | 92% |

---

## 2. Architecture

### 2.1 High-Level Architecture

The Reasoning Engine is composed of six primary subsystems that work together in a pipeline:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                            THE AGENTIC KERNEL (RLM)                         │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │                    REASONING PIPELINE                                 │  │
│  │                                                                       │  │
│  │  ┌─────────┐   ┌──────────┐   ┌─────────┐   ┌──────────┐   ┌─────┐  │  │
│  │  │  INPUT   │──→│ DECOMPOSE│──→│ REASON  │──→│ EVALUATE │──→│ OUT │  │  │
│  │  │ (Intent) │   │ (Break   │   │ (CoT /  │   │ (Score / │   │ PUT │  │  │
│  │  │          │   │  down)   │   │  ToT /  │   │  Verify) │   │     │  │  │
│  │  │          │   │          │   │  ReAct) │   │          │   │     │  │  │
│  │  └─────────┘   └──────────┘   └─────────┘   └──────────┘   └─────┘  │  │
│  │       │                            │              │                   │  │
│  │       │         ┌──────────────────┘              │                   │  │
│  │       │         │ RECURSE (if complex)            │                   │  │
│  │       │         └────────────────────→ DECOMPOSE  │                   │  │
│  │       │                                           │                   │  │
│  │       │              ESCALATE (if low confidence) │                   │  │
│  │       │              └────────────────────────────→ HITL              │  │
│  └───────┴───────────────────────────────────────────────────────────────┘  │
│                                                                             │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │                    TRUTH VERIFICATION LAYER                           │  │
│  │                                                                       │  │
│  │   ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────────┐  │  │
│  │   │ Code Sandbox    │  │ Schema Validate │  │ Semantic Cross-Ref  │  │  │
│  │   │ (E2B Runtime)   │  │ (Drizzle Meta)  │  │ (Knowledge Graph)   │  │  │
│  │   └─────────────────┘  └─────────────────┘  └─────────────────────┘  │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │                    TRACE & TELEMETRY LAYER                            │  │
│  │                                                                       │  │
│  │   ┌──────────────┐  ┌──────────────┐  ┌───────────────────────────┐  │  │
│  │   │ Trace Store  │  │ Metrics      │  │ Reasoning Quality Dash    │  │  │
│  │   │ (Drizzle/PG) │  │ (Prometheus) │  │ (Grafana + Custom)       │  │  │
│  │   └──────────────┘  └──────────────┘  └───────────────────────────┘  │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │                    STATE MANAGEMENT (xstate)                          │  │
│  │                                                                       │  │
│  │   ┌──────────────┐  ┌──────────────┐  ┌───────────────────────────┐  │  │
│  │   │ Reasoning    │  │ Branch       │  │ Step Tracking &           │  │  │
│  │   │ Flow Machine │  │ Management   │  │ Context Windows           │  │  │
│  │   └──────────────┘  └──────────────┘  └───────────────────────────┘  │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 2.2 Data Flow

The reasoning pipeline processes requests through a well-defined data flow:

```
1. INPUT PHASE
   ├── Receive intent/problem from caller (Queen, Ralph, Scout)
   ├── Parse and normalize the input
   ├── Retrieve relevant context from Memory
   ├── Select reasoning strategy based on problem characteristics
   └── Initialize trace capture

2. DECOMPOSITION PHASE
   ├── Analyze problem complexity (simple / compound / complex / chaotic)
   ├── If compound+: decompose into subtask DAG
   ├── Identify dependencies between subtasks
   ├── Estimate resource requirements per subtask
   ├── Plan parallel execution groups
   └── Generate decomposition trace

3. REASONING PHASE (per subtask)
   ├── Select strategy (CoT / ToT / ReAct / Reflexion / etc.)
   ├── Load relevant reasoning template (if available)
   ├── Execute reasoning loop:
   │   ├── Generate thought step
   │   ├── Evaluate step quality (inline scoring)
   │   ├── If tool needed: enter ReAct loop
   │   ├── If branching useful: spawn ToT branches
   │   ├── If self-correction needed: enter Reflexion loop
   │   └── Record trace for each step
   ├── Produce intermediate result
   └── Pass to evaluation

4. EVALUATION PHASE
   ├── Score output quality (coherence, relevance, completeness)
   ├── Check factual grounding against Knowledge Graph
   ├── Validate consistency with prior reasoning steps
   ├── Calibrate confidence score
   ├── If confidence < threshold: trigger verification or HITL
   └── Record evaluation trace

5. VERIFICATION PHASE (conditional)
   ├── If code output: run in E2B sandbox
   ├── If schema change: validate against Drizzle metadata
   ├── If factual claim: cross-reference with semantic memory
   ├── If financial: verify calculations independently
   └── Record verification trace

6. OUTPUT PHASE
   ├── Synthesize results from all subtasks
   ├── Generate final confidence score
   ├── Package output with full trace
   ├── Cache reasoning pattern (if reusable)
   └── Return to caller
```

### 2.3 Component Interaction Map

```typescript
// Internal component dependencies

ReasoningEngine
  ├── DecompositionEngine          // Breaks problems into subtasks
  ├── StrategySelector             // Picks CoT/ToT/ReAct/etc.
  ├── ChainOfThought               // Linear step-by-step reasoning
  ├── TreeOfThought                // Branching exploration
  ├── ReActLoop                    // Reasoning + Acting
  ├── ReflexionEngine              // Self-critique and correction
  ├── SelfConsistency              // Majority voting
  ├── EvaluationEngine             // Output quality scoring
  ├── VerificationLayer            // Truth verification
  ├── TemplateRegistry             // Pre-built reasoning patterns
  ├── TraceCapture                 // Full reasoning trace
  ├── ReasoningStateMachine        // xstate flow management
  └── ReasoningCache               // Pattern caching

// External dependencies
ReasoningEngine
  ├── @mcv/gateway                 // LLM calls (model routing)
  ├── @mcv/agentic-os/memory       // Context retrieval
  ├── @mcv/agentic-os/prompts      // Template rendering
  ├── @mcv/agentic-os/hitl         // Human escalation
  ├── @mcv/agentic-os/naos         // Agent context & instruments
  ├── @mcv/kernel                  // Logging, errors, context
  ├── xstate                       // State machine runtime
  └── drizzle-orm                  // Trace persistence
```

### 2.4 Stateless Execution Model

The Agentic Kernel operates as a **stateless cognitive processor**. Each reasoning invocation receives all necessary context as input (from Memory, from the caller's execution context, and from the prompt templates) and produces a complete result with trace. There is no mutable state held between invocations.

This stateless design enables:

- **Horizontal scaling:** Multiple kernel instances can run concurrently without coordination.
- **Deterministic replay:** Given the same inputs and random seed, a reasoning trace can be exactly replayed.
- **Fault tolerance:** If a kernel instance crashes mid-reasoning, the work can be retried from the beginning without corrupted state.
- **Testing:** Reasoning flows can be unit-tested with fixture inputs and expected outputs.

The only persistent state is the trace store (PostgreSQL via Drizzle), which is append-only and used for observability, not for reasoning state management.

---

## 3. Core Concepts

### 3.1 Recursive Language Modeling (RLM)

Unlike standard "one-shot" prompting, RLM operates by iteratively refining its internal state. If a task is too complex for the current context budget, the kernel spawns a child "Thought Instance" with a narrower scope, executes it, and synthesizes the result back up the call stack.

The RLM pattern treats the LLM as a CPU instruction set:

| CPU Concept | RLM Equivalent | Implementation |
|-------------|---------------|----------------|
| Instruction | Prompt template | `@mcv/agentic-os/prompts` |
| Register | Working memory slot | `@mcv/agentic-os/memory` (working) |
| ALU | LLM inference call | `@mcv/gateway` |
| Stack | Recursive thought stack | `ReasoningEngine.thoughtStack` |
| Branch | Conditional reasoning path | `TreeOfThought.branches` |
| Interrupt | HITL escalation | `@mcv/agentic-os/hitl` |
| Cache | Reasoning pattern cache | `ReasoningCache` |
| DMA | Tool execution (ReAct) | `ReActLoop.executeAction` |

```typescript
// Recursive reasoning with depth control
async function recursiveReason(
  problem: string,
  context: ReasoningContext,
  depth: number = 0
): Promise<ReasoningResult> {
  // Guard: prevent infinite recursion
  if (depth >= context.config.maxRecursionDepth) {
    return escalateToHITL(problem, context, 'max_recursion_reached');
  }

  // Guard: check token budget
  if (context.remainingTokenBudget < context.config.minTokensPerStep) {
    return escalateToHITL(problem, context, 'token_budget_exhausted');
  }

  // Attempt direct reasoning
  const result = await chainOfThought.reason(problem, context);

  if (result.confidence >= context.config.confidenceThreshold) {
    return result;
  }

  // If not confident enough, decompose and recurse
  const subtasks = await decompositionEngine.decompose(problem, context);

  const subResults = await Promise.all(
    subtasks.map(subtask =>
      recursiveReason(subtask.description, {
        ...context,
        remainingTokenBudget: context.remainingTokenBudget / subtasks.length,
        parentTraceId: result.traceId,
      }, depth + 1)
    )
  );

  // Synthesize sub-results
  return synthesize(subResults, context);
}
```

#### RLM Execution Lifecycle

```
INIT ──→ ASSESS_COMPLEXITY ──→ ┬──→ SIMPLE: direct CoT ──→ EVALUATE ──→ OUTPUT
                                │
                                ├──→ COMPOUND: decompose ──→ parallel CoT ──→ SYNTHESIZE ──→ EVALUATE ──→ OUTPUT
                                │
                                └──→ COMPLEX: recursive decompose ──→ per-subtask RLM ──→ SYNTHESIZE ──→ EVALUATE ──→ OUTPUT
                                                                                                              │
                                                                                           LOW CONFIDENCE ──→ HITL
```

### 3.2 The SPARC Methodology

Every unit of work performed by the Agentic OS must follow the SPARC lifecycle to ensure enterprise-grade reliability. SPARC is not just a development methodology — it is encoded into the reasoning engine as a **reasoning template** that structures how technical tasks are approached.

| Phase | Activity | Output | Model Used | Token Budget |
|-------|----------|--------|------------|-------------|
| **S**pecification | Requirement analysis, boundary definition, edge case identification | Functional Spec document | Claude Opus | 4,000 |
| **P**seudocode | Logical flow design, algorithm selection, data structure planning | Logic Blueprint | Claude Opus | 3,000 |
| **A**rchitecture | System design, API contracts, DB schemas, integration points | Technical Design document | Claude Opus | 5,000 |
| **R**efinement | Agent-to-agent peer review, optimization, edge case hardening | Reviewed Blueprint | Claude Sonnet | 3,000 |
| **C**ompletion | Code generation, test writing, documentation, deployment config | PR-ready artifact | Claude Sonnet | 8,000 |

#### SPARC State Machine

```typescript
// @mcv/agentic-os/reasoning/sparc-machine.ts

import { createMachine, assign } from 'xstate';

export const sparcMachine = createMachine({
  id: 'sparc',
  initial: 'specification',
  context: {
    intent: '',
    spec: null,
    pseudocode: null,
    architecture: null,
    refinement: null,
    completion: null,
    currentPhase: 'specification',
    attempts: { specification: 0, pseudocode: 0, architecture: 0, refinement: 0, completion: 0 },
    maxAttempts: 3,
    traces: [],
  },
  states: {
    specification: {
      invoke: {
        src: 'generateSpecification',
        onDone: {
          target: 'specReview',
          actions: assign({
            spec: (_, event) => event.data,
            traces: (ctx, event) => [...ctx.traces, event.data.trace],
          }),
        },
        onError: {
          target: 'specRetry',
        },
      },
    },
    specReview: {
      invoke: {
        src: 'evaluateSpecification',
        onDone: [
          { target: 'pseudocode', cond: 'specPassesReview' },
          { target: 'specRetry', cond: 'specFailsReview' },
        ],
      },
    },
    specRetry: {
      always: [
        { target: 'specification', cond: 'attemptsRemaining', actions: 'incrementAttempts' },
        { target: 'hitlEscalation', cond: 'noAttemptsRemaining' },
      ],
    },
    pseudocode: {
      invoke: {
        src: 'generatePseudocode',
        onDone: {
          target: 'pseudoReview',
          actions: assign({
            pseudocode: (_, event) => event.data,
            traces: (ctx, event) => [...ctx.traces, event.data.trace],
          }),
        },
        onError: { target: 'pseudoRetry' },
      },
    },
    pseudoReview: {
      invoke: {
        src: 'evaluatePseudocode',
        onDone: [
          { target: 'architecture', cond: 'pseudoPassesReview' },
          { target: 'pseudoRetry', cond: 'pseudoFailsReview' },
        ],
      },
    },
    pseudoRetry: {
      always: [
        { target: 'pseudocode', cond: 'attemptsRemaining', actions: 'incrementAttempts' },
        { target: 'hitlEscalation' },
      ],
    },
    architecture: {
      invoke: {
        src: 'generateArchitecture',
        onDone: {
          target: 'archReview',
          actions: assign({
            architecture: (_, event) => event.data,
            traces: (ctx, event) => [...ctx.traces, event.data.trace],
          }),
        },
        onError: { target: 'archRetry' },
      },
    },
    archReview: {
      invoke: {
        src: 'evaluateArchitecture',
        onDone: [
          { target: 'refinement', cond: 'archPassesReview' },
          { target: 'archRetry', cond: 'archFailsReview' },
        ],
      },
    },
    archRetry: {
      always: [
        { target: 'architecture', cond: 'attemptsRemaining', actions: 'incrementAttempts' },
        { target: 'hitlEscalation' },
      ],
    },
    refinement: {
      invoke: {
        src: 'performRefinement',
        onDone: {
          target: 'refineReview',
          actions: assign({
            refinement: (_, event) => event.data,
            traces: (ctx, event) => [...ctx.traces, event.data.trace],
          }),
        },
        onError: { target: 'refineRetry' },
      },
    },
    refineReview: {
      invoke: {
        src: 'evaluateRefinement',
        onDone: [
          { target: 'completion', cond: 'refinePassesReview' },
          { target: 'refineRetry', cond: 'refineFailsReview' },
        ],
      },
    },
    refineRetry: {
      always: [
        { target: 'refinement', cond: 'attemptsRemaining', actions: 'incrementAttempts' },
        { target: 'hitlEscalation' },
      ],
    },
    completion: {
      invoke: {
        src: 'generateCompletion',
        onDone: {
          target: 'finalVerification',
          actions: assign({
            completion: (_, event) => event.data,
            traces: (ctx, event) => [...ctx.traces, event.data.trace],
          }),
        },
        onError: { target: 'completionRetry' },
      },
    },
    finalVerification: {
      invoke: {
        src: 'verifyCompletion',
        onDone: [
          { target: 'done', cond: 'verificationPasses' },
          { target: 'completionRetry', cond: 'verificationFails' },
        ],
      },
    },
    completionRetry: {
      always: [
        { target: 'completion', cond: 'attemptsRemaining', actions: 'incrementAttempts' },
        { target: 'hitlEscalation' },
      ],
    },
    hitlEscalation: {
      invoke: {
        src: 'escalateToHuman',
        onDone: [
          { target: 'specification', cond: 'humanSaysRestartSpec' },
          { target: 'done', cond: 'humanApproves' },
          { target: 'failed', cond: 'humanRejects' },
        ],
      },
    },
    done: { type: 'final' },
    failed: { type: 'final' },
  },
});
```

### 3.3 The Genesis Engine

The Genesis Engine is the "Intent-to-Execution" bridge. It translates a human statement like *"Add a loyalty points system to BetEdge"* into a fully contextualized `RalphBlueprint` containing:

1. **Technical Context:** Relevant schemas, API contracts, coding standards, and existing patterns retrieved from `Memory`.
2. **Acceptance Criteria:** Quantifiable goals with specific pass/fail conditions.
3. **Verification Experiments:** Sandbox tests to prove the logic works before deployment.
4. **Risk Assessment:** Identification of potential issues, rollback plans, and HITL gates.
5. **Resource Estimates:** Token budgets, model requirements, and estimated completion time.

#### Genesis Pipeline

```
[User Intent]
      │
      ▼
[Intent Classifier] ──→ categorize (feature / bugfix / analysis / migration / etc.)
      │
      ▼
[Context Retriever] ──→ query Memory for relevant schemas, APIs, patterns
      │
      ▼
[Spec Generator] ──→ produce functional specification
      │
      ▼
[Acceptance Criteria Agent] ──→ define testable success conditions
      │
      ▼
[Risk Assessor] ──→ identify risks, HITL gates, rollback strategy
      │
      ▼
[Blueprint Assembler] ──→ combine into RalphBlueprint
      │
      ▼
[Blueprint Validator] ──→ verify completeness, consistency, feasibility
      │
      ▼
[Ralph Blueprint] (Markdown file ready for Smith Pod execution)
```

#### Genesis Engine Implementation

```typescript
// @mcv/agentic-os/reasoning/genesis.ts

export class GenesisEngine {
  constructor(
    private readonly memory: MemoryStore,
    private readonly gateway: LLMGateway,
    private readonly prompts: PromptBank,
    private readonly evaluator: EvaluationEngine,
    private readonly traceCapture: TraceCapture,
  ) {}

  async generateBlueprint(
    intent: string,
    ventureId: string,
    options?: GenesisOptions,
  ): Promise<GenesisResult> {
    const trace = this.traceCapture.startTrace('genesis', { intent, ventureId });

    try {
      // 1. Classify Intent
      const classification = await this.classifyIntent(intent, trace);

      // 2. Retrieve Technical Context
      const technicalContext = await this.retrieveContext(intent, ventureId, classification, trace);

      // 3. Generate Specification
      const spec = await this.generateSpec(intent, technicalContext, classification, trace);

      // 4. Generate Acceptance Criteria
      const criteria = await this.generateAcceptanceCriteria(spec, technicalContext, trace);

      // 5. Assess Risks
      const risks = await this.assessRisks(spec, technicalContext, trace);

      // 6. Generate Verification Experiments
      const experiments = await this.generateVerificationExperiments(spec, criteria, trace);

      // 7. Estimate Resources
      const resources = await this.estimateResources(spec, classification, trace);

      // 8. Assemble Blueprint
      const blueprint: RalphBlueprint = {
        id: generateId('blueprint'),
        intent,
        ventureId,
        classification,
        specification: spec,
        acceptanceCriteria: criteria,
        riskAssessment: risks,
        verificationExperiments: experiments,
        resourceEstimates: resources,
        technicalContext: technicalContext.summary,
        createdAt: new Date(),
        traceId: trace.id,
      };

      // 9. Validate Blueprint
      const validation = await this.validateBlueprint(blueprint, trace);

      if (!validation.valid) {
        // Attempt self-correction
        const corrected = await this.correctBlueprint(blueprint, validation.issues, trace);
        if (corrected) {
          trace.complete('success_after_correction');
          return { blueprint: corrected, trace: trace.finalize(), corrected: true };
        }
        trace.complete('validation_failed');
        return { blueprint, trace: trace.finalize(), validationIssues: validation.issues };
      }

      trace.complete('success');
      return { blueprint, trace: trace.finalize() };

    } catch (error) {
      trace.complete('error', { error: error.message });
      throw new GenesisError(`Blueprint generation failed: ${error.message}`, { cause: error });
    }
  }

  private async classifyIntent(
    intent: string,
    trace: TraceContext,
  ): Promise<IntentClassification> {
    const step = trace.startStep('classify_intent');
    const prompt = await this.prompts.render('genesis_classify_v2', { intent });
    const result = await this.gateway.generateStructured<IntentClassification>(prompt, {
      schema: IntentClassificationSchema,
      model: 'claude-3-5-sonnet',
      temperature: 0.1,
    });
    step.complete({ classification: result.category });
    return result;
  }

  private async retrieveContext(
    intent: string,
    ventureId: string,
    classification: IntentClassification,
    trace: TraceContext,
  ): Promise<TechnicalContext> {
    const step = trace.startStep('retrieve_context');

    // Parallel retrieval from multiple memory sources
    const [schemas, apiContracts, patterns, recentChanges, standards] = await Promise.all([
      this.memory.retrieve({ query: intent, ventureId, tags: ['schema'], limit: 10 }),
      this.memory.retrieve({ query: intent, ventureId, tags: ['api-contract'], limit: 10 }),
      this.memory.retrieve({ query: intent, ventureId, tags: ['pattern', classification.category], limit: 5 }),
      this.memory.retrieve({ query: intent, ventureId, tags: ['recent-change'], limit: 5, recency: '7d' }),
      this.memory.retrieve({ query: 'coding standards', ventureId, tags: ['standards'], limit: 3 }),
    ]);

    const context: TechnicalContext = {
      schemas: schemas.results,
      apiContracts: apiContracts.results,
      patterns: patterns.results,
      recentChanges: recentChanges.results,
      codingStandards: standards.results,
      summary: '', // Generated below
    };

    // Generate context summary for the blueprint
    const summaryPrompt = await this.prompts.render('genesis_context_summary', { context });
    context.summary = await this.gateway.generate(summaryPrompt, {
      model: 'claude-3-5-sonnet',
      maxTokens: 2000,
    });

    step.complete({ retrievedDocuments: schemas.results.length + apiContracts.results.length + patterns.results.length });
    return context;
  }

  private async generateSpec(
    intent: string,
    context: TechnicalContext,
    classification: IntentClassification,
    trace: TraceContext,
  ): Promise<FunctionalSpec> {
    const step = trace.startStep('generate_spec');
    const prompt = await this.prompts.render('genesis_spec_v2', {
      intent,
      context: context.summary,
      classification,
      codingStandards: context.codingStandards,
    });

    const spec = await this.gateway.generateStructured<FunctionalSpec>(prompt, {
      schema: FunctionalSpecSchema,
      model: 'claude-3-5-sonnet',
      temperature: 0.2,
      maxTokens: 4000,
    });

    // Evaluate spec quality
    const evaluation = await this.evaluator.evaluateSpec(spec, intent);
    step.complete({ quality: evaluation.score, issues: evaluation.issues.length });

    if (evaluation.score < 0.8) {
      // Refine spec with feedback
      const refinedPrompt = await this.prompts.render('genesis_spec_refine', {
        spec,
        feedback: evaluation.issues,
      });
      const refined = await this.gateway.generateStructured<FunctionalSpec>(refinedPrompt, {
        schema: FunctionalSpecSchema,
        model: 'claude-3-5-sonnet',
        temperature: 0.15,
        maxTokens: 4000,
      });
      return refined;
    }

    return spec;
  }

  private async generateAcceptanceCriteria(
    spec: FunctionalSpec,
    context: TechnicalContext,
    trace: TraceContext,
  ): Promise<AcceptanceCriterion[]> {
    const step = trace.startStep('generate_acceptance_criteria');
    const prompt = await this.prompts.render('genesis_criteria_v2', { spec, context: context.summary });

    const criteria = await this.gateway.generateStructured<{ criteria: AcceptanceCriterion[] }>(prompt, {
      schema: AcceptanceCriteriaSchema,
      model: 'claude-3-5-sonnet',
      temperature: 0.1,
    });

    step.complete({ criteriaCount: criteria.criteria.length });
    return criteria.criteria;
  }

  private async assessRisks(
    spec: FunctionalSpec,
    context: TechnicalContext,
    trace: TraceContext,
  ): Promise<RiskAssessment> {
    const step = trace.startStep('assess_risks');
    const prompt = await this.prompts.render('genesis_risk_v2', { spec, context: context.summary });

    const risks = await this.gateway.generateStructured<RiskAssessment>(prompt, {
      schema: RiskAssessmentSchema,
      model: 'claude-3-5-sonnet',
      temperature: 0.1,
    });

    step.complete({ riskLevel: risks.level, riskCount: risks.risks.length });
    return risks;
  }

  private async generateVerificationExperiments(
    spec: FunctionalSpec,
    criteria: AcceptanceCriterion[],
    trace: TraceContext,
  ): Promise<VerificationExperiment[]> {
    const step = trace.startStep('generate_verification_experiments');
    const prompt = await this.prompts.render('genesis_verification_v2', { spec, criteria });

    const experiments = await this.gateway.generateStructured<{ experiments: VerificationExperiment[] }>(prompt, {
      schema: VerificationExperimentsSchema,
      model: 'claude-3-5-sonnet',
      temperature: 0.1,
    });

    step.complete({ experimentCount: experiments.experiments.length });
    return experiments.experiments;
  }

  private async estimateResources(
    spec: FunctionalSpec,
    classification: IntentClassification,
    trace: TraceContext,
  ): Promise<ResourceEstimate> {
    const step = trace.startStep('estimate_resources');

    // Use historical data from similar tasks
    const historicalTasks = await this.memory.retrieve({
      query: spec.summary,
      tags: ['task-completion', classification.category],
      limit: 10,
    });

    const prompt = await this.prompts.render('genesis_resource_estimate', {
      spec,
      classification,
      historicalData: historicalTasks.results,
    });

    const estimate = await this.gateway.generateStructured<ResourceEstimate>(prompt, {
      schema: ResourceEstimateSchema,
      model: 'claude-3-5-sonnet',
      temperature: 0.1,
    });

    step.complete({ estimatedTokens: estimate.totalTokens, estimatedMinutes: estimate.estimatedMinutes });
    return estimate;
  }

  private async validateBlueprint(
    blueprint: RalphBlueprint,
    trace: TraceContext,
  ): Promise<ValidationResult> {
    const step = trace.startStep('validate_blueprint');
    const issues: ValidationIssue[] = [];

    // Check completeness
    if (!blueprint.specification) issues.push({ field: 'specification', severity: 'error', message: 'Missing specification' });
    if (blueprint.acceptanceCriteria.length === 0) issues.push({ field: 'acceptanceCriteria', severity: 'error', message: 'No acceptance criteria defined' });
    if (!blueprint.riskAssessment) issues.push({ field: 'riskAssessment', severity: 'warning', message: 'Missing risk assessment' });
    if (blueprint.verificationExperiments.length === 0) issues.push({ field: 'verificationExperiments', severity: 'warning', message: 'No verification experiments defined' });

    // Check consistency
    const consistencyPrompt = await this.prompts.render('genesis_consistency_check', { blueprint });
    const consistency = await this.gateway.generateStructured<ConsistencyCheck>(consistencyPrompt, {
      schema: ConsistencyCheckSchema,
      model: 'claude-3-5-sonnet',
      temperature: 0.0,
    });

    if (!consistency.isConsistent) {
      issues.push(...consistency.inconsistencies.map(i => ({
        field: i.field,
        severity: 'error' as const,
        message: i.description,
      })));
    }

    step.complete({ valid: issues.filter(i => i.severity === 'error').length === 0, issueCount: issues.length });
    return {
      valid: issues.filter(i => i.severity === 'error').length === 0,
      issues,
    };
  }

  private async correctBlueprint(
    blueprint: RalphBlueprint,
    issues: ValidationIssue[],
    trace: TraceContext,
  ): Promise<RalphBlueprint | null> {
    const step = trace.startStep('correct_blueprint');
    const prompt = await this.prompts.render('genesis_correct_blueprint', { blueprint, issues });

    try {
      const corrected = await this.gateway.generateStructured<RalphBlueprint>(prompt, {
        schema: RalphBlueprintSchema,
        model: 'claude-3-5-sonnet',
        temperature: 0.15,
        maxTokens: 6000,
      });
      step.complete({ corrected: true });
      return corrected;
    } catch {
      step.complete({ corrected: false });
      return null;
    }
  }
}
```

### 3.4 Complexity Assessment

Before selecting a reasoning strategy, the engine assesses problem complexity using a four-level Cynefin-inspired framework:

| Level | Characteristics | Strategy | Example |
|-------|----------------|----------|---------|
| **Simple** | Clear cause-effect, known solution pattern | Direct CoT (1–3 steps) | "What's the status of task X?" |
| **Compound** | Multiple clear steps, no ambiguity | CoT with decomposition (3–10 steps) | "Create a REST endpoint for user profiles" |
| **Complex** | Emergent behavior, multiple valid approaches | ToT + Reflexion + verification | "Design a recommendation engine" |
| **Chaotic** | No clear patterns, novel territory | Multi-strategy ensemble + HITL | "Migrate our entire auth system to passkeys" |

```typescript
// @mcv/agentic-os/reasoning/complexity.ts

export interface ComplexityAssessment {
  level: 'simple' | 'compound' | 'complex' | 'chaotic';
  score: number; // 0-1 continuous scale
  factors: {
    ambiguity: number;       // How unclear is the intent?
    dependencies: number;    // How many external systems are involved?
    novelty: number;         // How different from known patterns?
    risk: number;            // What's the potential damage if wrong?
    scope: number;           // How many subtasks are likely needed?
  };
  recommendedStrategy: ReasoningStrategy;
  estimatedSteps: number;
  estimatedTokens: number;
  requiresHITL: boolean;
}

export class ComplexityAssessor {
  async assess(
    problem: string,
    context: ReasoningContext,
  ): Promise<ComplexityAssessment> {
    // Use a lightweight model for fast classification
    const prompt = await this.prompts.render('complexity_assessment_v2', {
      problem,
      availableContext: context.summary,
      historicalPatterns: await this.getRelevantPatterns(problem),
    });

    const assessment = await this.gateway.generateStructured<ComplexityAssessment>(prompt, {
      schema: ComplexityAssessmentSchema,
      model: 'claude-3-5-haiku', // Fast model for classification
      temperature: 0.0,
      maxTokens: 500,
    });

    // Override: always require HITL for chaotic-level problems
    if (assessment.level === 'chaotic') {
      assessment.requiresHITL = true;
    }

    // Override: financial operations always require HITL if risk > 0.5
    if (context.domain === 'financial' && assessment.factors.risk > 0.5) {
      assessment.requiresHITL = true;
    }

    return assessment;
  }

  private async getRelevantPatterns(problem: string): Promise<ReasoningPattern[]> {
    return this.patternCache.search(problem, { limit: 5, minSimilarity: 0.7 });
  }
}
```

---

## 4. Reasoning Types

The Reasoning Engine supports seven distinct reasoning strategies, each optimized for different problem characteristics. The `StrategySelector` automatically picks the best strategy based on the complexity assessment, but callers can also specify a strategy explicitly.

### 4.1 Chain-of-Thought (CoT)

**Purpose:** Linear, step-by-step reasoning for problems with a clear logical progression.

**When to use:** Simple to compound problems where the reasoning path is relatively straightforward. Most common strategy — used for ~65% of all reasoning tasks.

**How it works:**
1. The problem is presented with an instruction to "think step by step."
2. The model generates a sequence of reasoning steps, each building on the previous.
3. Each step is scored for coherence and relevance.
4. The final step produces the answer.

```typescript
// @mcv/agentic-os/reasoning/strategies/chain-of-thought.ts

export class ChainOfThought implements ReasoningStrategy {
  readonly name = 'chain-of-thought';
  readonly shortName = 'cot';

  async reason(
    problem: string,
    context: ReasoningContext,
    options?: CoTOptions,
  ): Promise<ReasoningResult> {
    const trace = context.trace.startStep('cot_reasoning');
    const steps: ThoughtStep[] = [];
    let currentThought = problem;

    const maxSteps = options?.maxSteps ?? context.config.cotMaxSteps ?? 10;
    const promptTemplate = options?.promptTemplate ?? 'cot_standard_v2';

    for (let i = 0; i < maxSteps; i++) {
      const stepTrace = trace.startStep(`cot_step_${i}`);

      // Build prompt with accumulated reasoning
      const prompt = await this.prompts.render(promptTemplate, {
        problem,
        previousSteps: steps,
        currentThought,
        stepNumber: i + 1,
        maxSteps,
        context: context.relevantContext,
      });

      // Generate next reasoning step
      const response = await this.gateway.generate(prompt, {
        model: context.config.cotModel ?? 'claude-3-5-sonnet',
        temperature: context.config.cotTemperature ?? 0.2,
        maxTokens: context.config.cotMaxTokensPerStep ?? 1000,
        stopSequences: ['[FINAL_ANSWER]', '[NEED_MORE_INFO]', '[STUCK]'],
      });

      const step: ThoughtStep = {
        index: i,
        thought: response.content,
        tokenUsage: response.usage,
        latencyMs: response.latencyMs,
        confidence: await this.scoreStepConfidence(response.content, steps, context),
        isFinal: response.stopReason === 'stop' || response.content.includes('[FINAL_ANSWER]'),
        needsInfo: response.content.includes('[NEED_MORE_INFO]'),
        isStuck: response.content.includes('[STUCK]'),
      };

      steps.push(step);
      stepTrace.complete({
        confidence: step.confidence,
        isFinal: step.isFinal,
        tokens: step.tokenUsage,
      });

      // Check termination conditions
      if (step.isFinal) break;
      if (step.isStuck) {
        // Try to unstick by providing additional context
        const additionalContext = await context.memory.retrieve({
          query: step.thought,
          limit: 3,
        });
        currentThought = `Previous reasoning got stuck. Additional context: ${additionalContext.summary}\n\nContinue reasoning:`;
        continue;
      }
      if (step.needsInfo) {
        // Attempt to retrieve needed information
        const info = await this.retrieveMissingInfo(step.thought, context);
        if (info) {
          currentThought = `Additional information found: ${info}\n\nContinue reasoning:`;
        } else {
          // Can't find the info — return partial result with low confidence
          break;
        }
      }

      currentThought = step.thought;
    }

    // Extract final answer from reasoning chain
    const finalAnswer = await this.extractAnswer(steps, problem, context);

    // Calculate overall confidence
    const overallConfidence = this.calculateChainConfidence(steps);

    trace.complete({
      stepCount: steps.length,
      overallConfidence,
      totalTokens: steps.reduce((sum, s) => sum + (s.tokenUsage?.totalTokens ?? 0), 0),
    });

    return {
      answer: finalAnswer,
      confidence: overallConfidence,
      strategy: 'chain-of-thought',
      steps: steps.map(s => ({
        type: 'thought',
        content: s.thought,
        confidence: s.confidence,
        tokenUsage: s.tokenUsage,
        latencyMs: s.latencyMs,
      })),
      traceId: trace.id,
      metadata: {
        totalSteps: steps.length,
        totalTokens: steps.reduce((sum, s) => sum + (s.tokenUsage?.totalTokens ?? 0), 0),
        totalLatencyMs: steps.reduce((sum, s) => sum + (s.latencyMs ?? 0), 0),
      },
    };
  }

  private async scoreStepConfidence(
    thought: string,
    previousSteps: ThoughtStep[],
    context: ReasoningContext,
  ): Promise<number> {
    // Use a fast model to score the step
    const prompt = await this.prompts.render('cot_step_scoring', {
      thought,
      previousSteps,
      originalProblem: context.problem,
    });

    const score = await this.gateway.generateStructured<{ confidence: number }>(prompt, {
      schema: ConfidenceScoreSchema,
      model: 'claude-3-5-haiku',
      temperature: 0.0,
      maxTokens: 50,
    });

    return Math.max(0, Math.min(1, score.confidence));
  }

  private calculateChainConfidence(steps: ThoughtStep[]): number {
    if (steps.length === 0) return 0;

    // Weighted average: later steps count more
    let totalWeight = 0;
    let weightedSum = 0;

    for (let i = 0; i < steps.length; i++) {
      const weight = 1 + (i / steps.length); // Linear increase
      totalWeight += weight;
      weightedSum += steps[i].confidence * weight;
    }

    // Apply chain penalty: longer chains are less reliable
    const chainPenalty = Math.max(0.8, 1 - (steps.length * 0.02));

    return (weightedSum / totalWeight) * chainPenalty;
  }

  private async extractAnswer(
    steps: ThoughtStep[],
    problem: string,
    context: ReasoningContext,
  ): Promise<string> {
    const lastStep = steps[steps.length - 1];

    // If the last step contains a clear final answer, extract it
    if (lastStep.isFinal && lastStep.thought.includes('[FINAL_ANSWER]')) {
      return lastStep.thought.split('[FINAL_ANSWER]')[1].trim();
    }

    // Otherwise, synthesize from the chain
    const prompt = await this.prompts.render('cot_extract_answer', {
      problem,
      reasoningChain: steps.map(s => s.thought),
    });

    return this.gateway.generate(prompt, {
      model: context.config.cotModel ?? 'claude-3-5-sonnet',
      temperature: 0.0,
      maxTokens: 2000,
    }).then(r => r.content);
  }

  private async retrieveMissingInfo(
    thought: string,
    context: ReasoningContext,
  ): Promise<string | null> {
    const result = await context.memory.retrieve({
      query: thought,
      limit: 5,
      minRelevance: 0.7,
    });

    if (result.results.length === 0) return null;
    return result.results.map(r => r.content).join('\n\n');
  }
}
```

### 4.2 Tree-of-Thought (ToT)

**Purpose:** Branching exploration for problems where multiple approaches should be considered and compared.

**When to use:** Complex problems with multiple valid solution paths. The system explores several approaches in parallel, evaluates each branch, prunes unpromising ones, and selects the best path.

**How it works:**
1. The problem is presented with an instruction to generate multiple candidate approaches.
2. Each approach becomes a branch in the thought tree.
3. Each branch is explored to a configurable depth (default: 5 steps).
4. At each level, branches are evaluated and pruned (beam search).
5. The best-scoring path's result is selected as the answer.

```typescript
// @mcv/agentic-os/reasoning/strategies/tree-of-thought.ts

export class TreeOfThought implements ReasoningStrategy {
  readonly name = 'tree-of-thought';
  readonly shortName = 'tot';

  async reason(
    problem: string,
    context: ReasoningContext,
    options?: ToTOptions,
  ): Promise<ReasoningResult> {
    const trace = context.trace.startStep('tot_reasoning');

    const maxBranches = options?.maxBranches ?? context.config.totMaxBranches ?? 3;
    const maxDepth = options?.maxDepth ?? context.config.totMaxDepth ?? 5;
    const beamWidth = options?.beamWidth ?? context.config.totBeamWidth ?? 2;
    const pruneThreshold = options?.pruneThreshold ?? context.config.totPruneThreshold ?? 0.3;

    // Step 1: Generate initial branches
    const rootNode: ThoughtNode = {
      id: generateId('node'),
      depth: 0,
      thought: problem,
      score: 1.0,
      children: [],
      isLeaf: false,
      metadata: {},
    };

    const initialBranches = await this.generateBranches(rootNode, problem, context, maxBranches);
    rootNode.children = initialBranches;

    // Step 2: Explore tree with beam search
    let activeBranches = initialBranches;

    for (let depth = 1; depth < maxDepth; depth++) {
      const depthTrace = trace.startStep(`tot_depth_${depth}`);

      // Evaluate all active branches
      const scoredBranches = await Promise.all(
        activeBranches.map(async (branch) => ({
          node: branch,
          score: await this.evaluateBranch(branch, problem, context),
        }))
      );

      // Sort by score and keep top beamWidth branches
      scoredBranches.sort((a, b) => b.score - a.score);
      const topBranches = scoredBranches
        .filter(b => b.score > pruneThreshold)
        .slice(0, beamWidth);

      if (topBranches.length === 0) {
        depthTrace.complete({ status: 'all_branches_pruned' });
        break;
      }

      // Expand each surviving branch
      const nextLevel: ThoughtNode[] = [];
      for (const { node, score } of topBranches) {
        node.score = score;

        // Check if this branch has reached a conclusion
        if (await this.isBranchComplete(node, problem, context)) {
          node.isLeaf = true;
          nextLevel.push(node);
          continue;
        }

        // Generate children for this branch
        const children = await this.generateBranches(node, problem, context, maxBranches);
        node.children = children;
        nextLevel.push(...children);
      }

      activeBranches = nextLevel;
      depthTrace.complete({
        activeBranches: nextLevel.length,
        prunedBranches: scoredBranches.length - topBranches.length,
      });

      // All remaining branches are leaves — stop expanding
      if (activeBranches.every(b => b.isLeaf)) break;
    }

    // Step 3: Select best path
    const allLeaves = this.collectLeaves(rootNode);
    const scoredLeaves = await Promise.all(
      allLeaves.map(async (leaf) => ({
        leaf,
        score: await this.evaluateFinalAnswer(leaf, problem, context),
      }))
    );

    scoredLeaves.sort((a, b) => b.score - a.score);
    const bestLeaf = scoredLeaves[0];

    // Step 4: Extract the reasoning path from root to best leaf
    const bestPath = this.tracePathToRoot(bestLeaf.leaf, rootNode);

    trace.complete({
      totalNodesExplored: this.countNodes(rootNode),
      maxDepthReached: this.getMaxDepth(rootNode),
      bestScore: bestLeaf.score,
      pathLength: bestPath.length,
    });

    return {
      answer: bestLeaf.leaf.thought,
      confidence: bestLeaf.score,
      strategy: 'tree-of-thought',
      steps: bestPath.map(node => ({
        type: 'thought',
        content: node.thought,
        confidence: node.score,
        metadata: { nodeId: node.id, depth: node.depth },
      })),
      traceId: trace.id,
      metadata: {
        totalNodesExplored: this.countNodes(rootNode),
        maxDepthReached: this.getMaxDepth(rootNode),
        alternativePaths: scoredLeaves.slice(1).map(l => ({
          score: l.score,
          summary: l.leaf.thought.substring(0, 200),
        })),
        treeStructure: this.serializeTree(rootNode),
      },
    };
  }

  private async generateBranches(
    parent: ThoughtNode,
    problem: string,
    context: ReasoningContext,
    count: number,
  ): Promise<ThoughtNode[]> {
    const prompt = await this.prompts.render('tot_generate_branches', {
      problem,
      parentThought: parent.thought,
      depth: parent.depth,
      existingSiblings: parent.children.map(c => c.thought),
      branchCount: count,
    });

    const response = await this.gateway.generateStructured<{ branches: string[] }>(prompt, {
      schema: BranchesSchema,
      model: context.config.totModel ?? 'claude-3-5-sonnet',
      temperature: context.config.totTemperature ?? 0.7, // Higher temperature for diversity
      maxTokens: count * 500,
    });

    return response.branches.map((thought, i) => ({
      id: generateId('node'),
      depth: parent.depth + 1,
      thought,
      score: 0,
      children: [],
      isLeaf: false,
      parent: parent,
      metadata: { branchIndex: i },
    }));
  }

  private async evaluateBranch(
    node: ThoughtNode,
    problem: string,
    context: ReasoningContext,
  ): Promise<number> {
    const prompt = await this.prompts.render('tot_evaluate_branch', {
      problem,
      thought: node.thought,
      depth: node.depth,
      pathToHere: this.tracePathToRoot(node, null).map(n => n.thought),
    });

    const evaluation = await this.gateway.generateStructured<{ score: number; reasoning: string }>(prompt, {
      schema: BranchEvaluationSchema,
      model: 'claude-3-5-haiku', // Fast model for evaluation
      temperature: 0.0,
      maxTokens: 200,
    });

    return evaluation.score;
  }

  private async isBranchComplete(
    node: ThoughtNode,
    problem: string,
    context: ReasoningContext,
  ): Promise<boolean> {
    const prompt = await this.prompts.render('tot_check_completion', {
      problem,
      thought: node.thought,
      path: this.tracePathToRoot(node, null).map(n => n.thought),
    });

    const result = await this.gateway.generateStructured<{ isComplete: boolean }>(prompt, {
      schema: CompletionCheckSchema,
      model: 'claude-3-5-haiku',
      temperature: 0.0,
      maxTokens: 50,
    });

    return result.isComplete;
  }

  private async evaluateFinalAnswer(
    leaf: ThoughtNode,
    problem: string,
    context: ReasoningContext,
  ): Promise<number> {
    const path = this.tracePathToRoot(leaf, null);
    const prompt = await this.prompts.render('tot_evaluate_final', {
      problem,
      reasoningPath: path.map(n => n.thought),
      finalAnswer: leaf.thought,
    });

    const evaluation = await this.gateway.generateStructured<{ score: number }>(prompt, {
      schema: ConfidenceScoreSchema,
      model: context.config.totModel ?? 'claude-3-5-sonnet',
      temperature: 0.0,
      maxTokens: 100,
    });

    return evaluation.score;
  }

  private collectLeaves(node: ThoughtNode): ThoughtNode[] {
    if (node.isLeaf || node.children.length === 0) return [node];
    return node.children.flatMap(child => this.collectLeaves(child));
  }

  private tracePathToRoot(node: ThoughtNode, root: ThoughtNode | null): ThoughtNode[] {
    const path: ThoughtNode[] = [];
    let current: ThoughtNode | undefined = node;
    while (current && current !== root) {
      path.unshift(current);
      current = current.parent;
    }
    return path;
  }

  private countNodes(node: ThoughtNode): number {
    return 1 + node.children.reduce((sum, child) => sum + this.countNodes(child), 0);
  }

  private getMaxDepth(node: ThoughtNode): number {
    if (node.children.length === 0) return node.depth;
    return Math.max(...node.children.map(child => this.getMaxDepth(child)));
  }

  private serializeTree(node: ThoughtNode): SerializedNode {
    return {
      id: node.id,
      depth: node.depth,
      score: node.score,
      thoughtPreview: node.thought.substring(0, 100),
      isLeaf: node.isLeaf,
      children: node.children.map(child => this.serializeTree(child)),
    };
  }
}
```

### 4.3 Reflexion

**Purpose:** Self-critique and iterative correction. The model reasons, evaluates its own output, identifies flaws, and tries again with targeted improvements.

**When to use:** Problems where the first attempt is likely to have subtle errors that can be caught by self-review. Particularly effective for code generation, logical proofs, and multi-step calculations.

**How it works:**
1. Generate an initial answer using CoT.
2. Evaluate the answer against the problem requirements.
3. If the evaluation finds issues, generate a self-critique.
4. Use the critique to guide a corrected attempt.
5. Repeat until the answer passes evaluation or max iterations are reached.

```typescript
// @mcv/agentic-os/reasoning/strategies/reflexion.ts

export class ReflexionEngine implements ReasoningStrategy {
  readonly name = 'reflexion';
  readonly shortName = 'rfx';

  async reason(
    problem: string,
    context: ReasoningContext,
    options?: ReflexionOptions,
  ): Promise<ReasoningResult> {
    const trace = context.trace.startStep('reflexion_reasoning');

    const maxIterations = options?.maxIterations ?? context.config.reflexionMaxIterations ?? 3;
    const improvementThreshold = options?.improvementThreshold ?? 0.05;

    const iterations: ReflexionIteration[] = [];
    let bestResult: ReasoningResult | null = null;
    let bestScore = 0;

    for (let i = 0; i < maxIterations; i++) {
      const iterTrace = trace.startStep(`reflexion_iteration_${i}`);

      // Step 1: Generate attempt (use CoT as base strategy)
      const attempt = await this.generateAttempt(
        problem,
        context,
        iterations, // Pass previous iterations for learning
      );

      // Step 2: Self-evaluate
      const evaluation = await this.selfEvaluate(attempt, problem, context);

      // Step 3: Record iteration
      const iteration: ReflexionIteration = {
        index: i,
        attempt: attempt.answer,
        evaluation,
        critique: null,
        improvements: null,
      };

      // Step 4: Check if good enough
      if (evaluation.score >= context.config.confidenceThreshold) {
        iteration.critique = null;
        iterations.push(iteration);
        iterTrace.complete({ score: evaluation.score, status: 'accepted' });

        bestResult = attempt;
        bestScore = evaluation.score;
        break;
      }

      // Step 5: Check if improving
      if (i > 0 && evaluation.score - bestScore < improvementThreshold) {
        // Not improving enough — stop iterating
        iterations.push(iteration);
        iterTrace.complete({ score: evaluation.score, status: 'stalled' });
        break;
      }

      // Step 6: Generate self-critique
      const critique = await this.generateCritique(attempt, evaluation, problem, context);
      iteration.critique = critique;

      // Step 7: Plan improvements
      const improvements = await this.planImprovements(critique, attempt, problem, context);
      iteration.improvements = improvements;

      iterations.push(iteration);

      if (evaluation.score > bestScore) {
        bestResult = attempt;
        bestScore = evaluation.score;
      }

      iterTrace.complete({
        score: evaluation.score,
        status: 'needs_improvement',
        critiquePoints: critique.issues.length,
        plannedImprovements: improvements.length,
      });
    }

    trace.complete({
      totalIterations: iterations.length,
      finalScore: bestScore,
      improvementFromFirst: iterations.length > 1
        ? bestScore - (iterations[0]?.evaluation?.score ?? 0)
        : 0,
    });

    return {
      ...bestResult!,
      strategy: 'reflexion',
      confidence: bestScore,
      metadata: {
        ...bestResult!.metadata,
        reflexionIterations: iterations.length,
        iterationScores: iterations.map(i => i.evaluation.score),
        totalImprovements: iterations.reduce(
          (sum, i) => sum + (i.improvements?.length ?? 0), 0
        ),
      },
    };
  }

  private async generateAttempt(
    problem: string,
    context: ReasoningContext,
    previousIterations: ReflexionIteration[],
  ): Promise<ReasoningResult> {
    if (previousIterations.length === 0) {
      // First attempt — use standard CoT
      return this.cot.reason(problem, context);
    }

    // Subsequent attempts — include lessons from previous iterations
    const lastIteration = previousIterations[previousIterations.length - 1];
    const prompt = await this.prompts.render('reflexion_retry', {
      problem,
      previousAttempt: lastIteration.attempt,
      critique: lastIteration.critique,
      improvements: lastIteration.improvements,
      iterationHistory: previousIterations.map(i => ({
        attempt: i.attempt.substring(0, 500),
        score: i.evaluation.score,
        critique: i.critique?.summary ?? 'N/A',
      })),
    });

    const response = await this.gateway.generate(prompt, {
      model: context.config.reflexionModel ?? 'claude-3-5-sonnet',
      temperature: 0.3,
      maxTokens: 3000,
    });

    return {
      answer: response.content,
      confidence: 0, // Will be set by evaluation
      strategy: 'reflexion',
      steps: [{ type: 'thought', content: response.content, confidence: 0 }],
      traceId: context.trace.id,
      metadata: { iteration: previousIterations.length },
    };
  }

  private async selfEvaluate(
    attempt: ReasoningResult,
    problem: string,
    context: ReasoningContext,
  ): Promise<ReflexionEvaluation> {
    const prompt = await this.prompts.render('reflexion_self_evaluate', {
      problem,
      attempt: attempt.answer,
      evaluationCriteria: context.config.evaluationCriteria ?? [
        'correctness',
        'completeness',
        'clarity',
        'efficiency',
      ],
    });

    return this.gateway.generateStructured<ReflexionEvaluation>(prompt, {
      schema: ReflexionEvaluationSchema,
      model: context.config.reflexionEvalModel ?? 'claude-3-5-sonnet',
      temperature: 0.0,
      maxTokens: 1000,
    });
  }

  private async generateCritique(
    attempt: ReasoningResult,
    evaluation: ReflexionEvaluation,
    problem: string,
    context: ReasoningContext,
  ): Promise<ReflexionCritique> {
    const prompt = await this.prompts.render('reflexion_critique', {
      problem,
      attempt: attempt.answer,
      evaluation,
    });

    return this.gateway.generateStructured<ReflexionCritique>(prompt, {
      schema: ReflexionCritiqueSchema,
      model: context.config.reflexionModel ?? 'claude-3-5-sonnet',
      temperature: 0.2,
      maxTokens: 1500,
    });
  }

  private async planImprovements(
    critique: ReflexionCritique,
    attempt: ReasoningResult,
    problem: string,
    context: ReasoningContext,
  ): Promise<PlannedImprovement[]> {
    const prompt = await this.prompts.render('reflexion_plan_improvements', {
      problem,
      attempt: attempt.answer,
      critique,
    });

    const result = await this.gateway.generateStructured<{ improvements: PlannedImprovement[] }>(prompt, {
      schema: PlannedImprovementsSchema,
      model: context.config.reflexionModel ?? 'claude-3-5-sonnet',
      temperature: 0.1,
      maxTokens: 1000,
    });

    return result.improvements;
  }
}
```

### 4.4 ReAct (Reasoning + Acting)

**Purpose:** Interleaved reasoning and tool use. The model thinks about what to do, executes a tool, observes the result, and reasons about the next step.

**When to use:** Problems that require external information gathering, computation, or side effects. The primary strategy for Ralph Pod task execution.

See [Section 11: Tool-Augmented Reasoning](#11-tool-augmented-reasoning-react) for the full implementation.

### 4.5 Self-Consistency

**Purpose:** Majority voting over multiple independent reasoning paths. Generate N independent answers and select the most common one.

**When to use:** Problems with a clear correct answer where different reasoning paths should converge. Especially useful for mathematical reasoning, factual questions, and logical deductions.

```typescript
// @mcv/agentic-os/reasoning/strategies/self-consistency.ts

export class SelfConsistency implements ReasoningStrategy {
  readonly name = 'self-consistency';
  readonly shortName = 'sc';

  async reason(
    problem: string,
    context: ReasoningContext,
    options?: SelfConsistencyOptions,
  ): Promise<ReasoningResult> {
    const trace = context.trace.startStep('self_consistency_reasoning');

    const sampleCount = options?.sampleCount ?? context.config.scSampleCount ?? 5;
    const temperature = options?.temperature ?? context.config.scTemperature ?? 0.7;

    // Generate N independent reasoning paths in parallel
    const paths = await Promise.all(
      Array.from({ length: sampleCount }, (_, i) =>
        this.generatePath(problem, context, i, temperature)
      )
    );

    // Extract and normalize answers
    const answers = paths.map(p => ({
      path: p,
      normalizedAnswer: this.normalizeAnswer(p.answer),
    }));

    // Group by normalized answer
    const groups = new Map<string, typeof answers>();
    for (const answer of answers) {
      const existing = groups.get(answer.normalizedAnswer) ?? [];
      existing.push(answer);
      groups.set(answer.normalizedAnswer, existing);
    }

    // Find majority answer
    let majorityAnswer = '';
    let majorityCount = 0;
    let majorityGroup: typeof answers = [];

    for (const [answer, group] of groups) {
      if (group.length > majorityCount) {
        majorityAnswer = answer;
        majorityCount = group.length;
        majorityGroup = group;
      }
    }

    // Confidence = proportion of paths that agree
    const confidence = majorityCount / sampleCount;

    // Select the best-quality path from the majority group
    const bestPath = majorityGroup.reduce((best, current) =>
      current.path.confidence > best.path.confidence ? current : best
    );

    trace.complete({
      sampleCount,
      uniqueAnswers: groups.size,
      majorityCount,
      confidence,
    });

    return {
      answer: bestPath.path.answer,
      confidence,
      strategy: 'self-consistency',
      steps: bestPath.path.steps,
      traceId: trace.id,
      metadata: {
        sampleCount,
        uniqueAnswers: groups.size,
        answerDistribution: Object.fromEntries(
          Array.from(groups.entries()).map(([answer, group]) => [answer, group.length])
        ),
        allPaths: paths.map(p => ({
          answer: p.answer.substring(0, 200),
          confidence: p.confidence,
        })),
      },
    };
  }

  private async generatePath(
    problem: string,
    context: ReasoningContext,
    index: number,
    temperature: number,
  ): Promise<ReasoningResult> {
    // Use CoT with higher temperature for diversity
    return this.cot.reason(problem, {
      ...context,
      config: {
        ...context.config,
        cotTemperature: temperature,
        cotModel: context.config.scModel ?? context.config.cotModel,
      },
      trace: context.trace.startStep(`sc_path_${index}`),
    });
  }

  private normalizeAnswer(answer: string): string {
    // Normalize for comparison: trim, lowercase, remove punctuation
    return answer
      .trim()
      .toLowerCase()
      .replace(/[^\w\s]/g, '')
      .replace(/\s+/g, ' ');
  }
}
```

### 4.6 Analogical Reasoning

**Purpose:** Transfer knowledge from known patterns to novel problems. Find similar problems in memory and adapt their solutions.

**When to use:** Problems that resemble previously solved problems. Leverages the Memory module's semantic search to find relevant precedents.

```typescript
// @mcv/agentic-os/reasoning/strategies/analogical.ts

export class AnalogicalReasoning implements ReasoningStrategy {
  readonly name = 'analogical';
  readonly shortName = 'ana';

  async reason(
    problem: string,
    context: ReasoningContext,
    options?: AnalogicalOptions,
  ): Promise<ReasoningResult> {
    const trace = context.trace.startStep('analogical_reasoning');

    // Step 1: Find analogous problems from memory
    const analogies = await this.findAnalogies(problem, context);

    if (analogies.length === 0) {
      // No analogies found — fall back to CoT
      trace.complete({ status: 'no_analogies_found', fallback: 'cot' });
      return this.cot.reason(problem, context);
    }

    // Step 2: Map the analogy
    const mapping = await this.mapAnalogy(problem, analogies[0], context);

    // Step 3: Transfer the solution
    const transferredSolution = await this.transferSolution(problem, mapping, analogies[0], context);

    // Step 4: Adapt and verify
    const adaptedSolution = await this.adaptSolution(transferredSolution, problem, context);

    // Step 5: Verify the adapted solution
    const verification = await this.verifySolution(adaptedSolution, problem, context);

    trace.complete({
      analogiesFound: analogies.length,
      bestAnalogyScore: analogies[0].similarity,
      transferSuccess: verification.passed,
      confidence: verification.confidence,
    });

    return {
      answer: adaptedSolution,
      confidence: verification.confidence,
      strategy: 'analogical',
      steps: [
        { type: 'analogy_search', content: `Found ${analogies.length} analogies. Best: "${analogies[0].summary}" (similarity: ${analogies[0].similarity.toFixed(2)})`, confidence: analogies[0].similarity },
        { type: 'analogy_mapping', content: mapping.description, confidence: mapping.confidence },
        { type: 'solution_transfer', content: transferredSolution.substring(0, 500), confidence: 0 },
        { type: 'solution_adaptation', content: adaptedSolution.substring(0, 500), confidence: verification.confidence },
      ],
      traceId: trace.id,
      metadata: {
        analogiesConsidered: analogies.length,
        bestAnalogy: analogies[0].summary,
        analogySimilarity: analogies[0].similarity,
        mappingConfidence: mapping.confidence,
      },
    };
  }

  private async findAnalogies(
    problem: string,
    context: ReasoningContext,
  ): Promise<Analogy[]> {
    const results = await context.memory.retrieve({
      query: problem,
      tags: ['reasoning-trace', 'solved-problem'],
      limit: 5,
      minRelevance: 0.6,
    });

    return results.results.map(r => ({
      id: r.id,
      summary: r.content.substring(0, 200),
      fullContent: r.content,
      similarity: r.relevanceScore,
      solution: r.metadata?.solution,
      reasoningTrace: r.metadata?.trace,
    }));
  }

  private async mapAnalogy(
    problem: string,
    analogy: Analogy,
    context: ReasoningContext,
  ): Promise<AnalogyMapping> {
    const prompt = await this.prompts.render('analogical_map', {
      problem,
      analogousProblem: analogy.fullContent,
      analogousSolution: analogy.solution,
    });

    return this.gateway.generateStructured<AnalogyMapping>(prompt, {
      schema: AnalogyMappingSchema,
      model: context.config.analogicalModel ?? 'claude-3-5-sonnet',
      temperature: 0.2,
      maxTokens: 2000,
    });
  }

  private async transferSolution(
    problem: string,
    mapping: AnalogyMapping,
    analogy: Analogy,
    context: ReasoningContext,
  ): Promise<string> {
    const prompt = await this.prompts.render('analogical_transfer', {
      problem,
      mapping,
      originalSolution: analogy.solution,
    });

    const response = await this.gateway.generate(prompt, {
      model: context.config.analogicalModel ?? 'claude-3-5-sonnet',
      temperature: 0.2,
      maxTokens: 3000,
    });

    return response.content;
  }

  private async adaptSolution(
    transferredSolution: string,
    problem: string,
    context: ReasoningContext,
  ): Promise<string> {
    const prompt = await this.prompts.render('analogical_adapt', {
      problem,
      transferredSolution,
      currentContext: context.relevantContext,
    });

    const response = await this.gateway.generate(prompt, {
      model: context.config.analogicalModel ?? 'claude-3-5-sonnet',
      temperature: 0.2,
      maxTokens: 3000,
    });

    return response.content;
  }

  private async verifySolution(
    solution: string,
    problem: string,
    context: ReasoningContext,
  ): Promise<VerificationResult> {
    return this.evaluator.evaluate(solution, problem, context);
  }
}
```

### 4.7 Counterfactual Reasoning

**Purpose:** Exploring "what if" scenarios to test the robustness of a solution or identify potential failure modes.

**When to use:** Risk assessment, decision analysis, and identifying edge cases. Used by the Queen for strategic planning and by the Genesis Engine for risk assessment.

```typescript
// @mcv/agentic-os/reasoning/strategies/counterfactual.ts

export class CounterfactualReasoning implements ReasoningStrategy {
  readonly name = 'counterfactual';
  readonly shortName = 'cf';

  async reason(
    problem: string,
    context: ReasoningContext,
    options?: CounterfactualOptions,
  ): Promise<ReasoningResult> {
    const trace = context.trace.startStep('counterfactual_reasoning');

    const scenarioCount = options?.scenarioCount ?? 3;

    // Step 1: Generate the baseline solution
    const baseline = await this.cot.reason(problem, context);

    // Step 2: Generate counterfactual scenarios
    const scenarios = await this.generateScenarios(problem, baseline, context, scenarioCount);

    // Step 3: Evaluate each scenario
    const evaluatedScenarios = await Promise.all(
      scenarios.map(async (scenario) => {
        const impact = await this.evaluateScenarioImpact(scenario, baseline, problem, context);
        return { ...scenario, impact };
      })
    );

    // Step 4: Synthesize insights
    const synthesis = await this.synthesizeInsights(
      problem,
      baseline,
      evaluatedScenarios,
      context,
    );

    // Step 5: Refine baseline if needed
    const criticalScenarios = evaluatedScenarios.filter(s => s.impact.severity === 'critical');
    let finalAnswer = baseline.answer;
    let finalConfidence = baseline.confidence;

    if (criticalScenarios.length > 0) {
      const refined = await this.refineWithCounterfactuals(
        baseline,
        criticalScenarios,
        problem,
        context,
      );
      finalAnswer = refined.answer;
      finalConfidence = refined.confidence;
    }

    trace.complete({
      scenarioCount: evaluatedScenarios.length,
      criticalScenarios: criticalScenarios.length,
      wasRefined: criticalScenarios.length > 0,
      finalConfidence,
    });

    return {
      answer: finalAnswer,
      confidence: finalConfidence,
      strategy: 'counterfactual',
      steps: [
        { type: 'baseline', content: baseline.answer.substring(0, 500), confidence: baseline.confidence },
        ...evaluatedScenarios.map(s => ({
          type: 'counterfactual_scenario' as const,
          content: `Scenario: ${s.description}\nImpact: ${s.impact.description}\nSeverity: ${s.impact.severity}`,
          confidence: 1 - s.impact.probability,
        })),
        { type: 'synthesis', content: synthesis, confidence: finalConfidence },
      ],
      traceId: trace.id,
      metadata: {
        baselineConfidence: baseline.confidence,
        scenariosExplored: evaluatedScenarios.length,
        criticalRisks: criticalScenarios.map(s => s.description),
        synthesisInsights: synthesis,
      },
    };
  }

  private async generateScenarios(
    problem: string,
    baseline: ReasoningResult,
    context: ReasoningContext,
    count: number,
  ): Promise<CounterfactualScenario[]> {
    const prompt = await this.prompts.render('counterfactual_scenarios', {
      problem,
      baselineSolution: baseline.answer,
      scenarioCount: count,
    });

    const result = await this.gateway.generateStructured<{ scenarios: CounterfactualScenario[] }>(prompt, {
      schema: CounterfactualScenariosSchema,
      model: context.config.counterfactualModel ?? 'claude-3-5-sonnet',
      temperature: 0.6,
      maxTokens: 2000,
    });

    return result.scenarios;
  }

  private async evaluateScenarioImpact(
    scenario: CounterfactualScenario,
    baseline: ReasoningResult,
    problem: string,
    context: ReasoningContext,
  ): Promise<ScenarioImpact> {
    const prompt = await this.prompts.render('counterfactual_evaluate_impact', {
      problem,
      baseline: baseline.answer,
      scenario,
    });

    return this.gateway.generateStructured<ScenarioImpact>(prompt, {
      schema: ScenarioImpactSchema,
      model: context.config.counterfactualModel ?? 'claude-3-5-sonnet',
      temperature: 0.1,
      maxTokens: 1000,
    });
  }

  private async synthesizeInsights(
    problem: string,
    baseline: ReasoningResult,
    scenarios: (CounterfactualScenario & { impact: ScenarioImpact })[],
    context: ReasoningContext,
  ): Promise<string> {
    const prompt = await this.prompts.render('counterfactual_synthesize', {
      problem,
      baseline: baseline.answer,
      scenarios: scenarios.map(s => ({ description: s.description, impact: s.impact })),
    });

    const response = await this.gateway.generate(prompt, {
      model: context.config.counterfactualModel ?? 'claude-3-5-sonnet',
      temperature: 0.2,
      maxTokens: 2000,
    });

    return response.content;
  }

  private async refineWithCounterfactuals(
    baseline: ReasoningResult,
    criticalScenarios: (CounterfactualScenario & { impact: ScenarioImpact })[],
    problem: string,
    context: ReasoningContext,
  ): Promise<ReasoningResult> {
    const prompt = await this.prompts.render('counterfactual_refine', {
      problem,
      baseline: baseline.answer,
      criticalRisks: criticalScenarios.map(s => ({
        scenario: s.description,
        impact: s.impact.description,
        mitigation: s.impact.suggestedMitigation,
      })),
    });

    const response = await this.gateway.generate(prompt, {
      model: context.config.counterfactualModel ?? 'claude-3-5-sonnet',
      temperature: 0.2,
      maxTokens: 3000,
    });

    return {
      ...baseline,
      answer: response.content,
      confidence: Math.min(baseline.confidence * 1.1, 1.0), // Slight confidence boost for robustness
    };
  }
}
```

### 4.8 Structured Output Reasoning

**Purpose:** JSON/schema-constrained reasoning where the output must conform to a specific TypeScript/Zod schema.

**When to use:** Whenever the reasoning result needs to be machine-parseable — task decomposition, risk assessment, structured reports, API responses.

```typescript
// @mcv/agentic-os/reasoning/strategies/structured-output.ts

export class StructuredOutputReasoning implements ReasoningStrategy {
  readonly name = 'structured-output';
  readonly shortName = 'so';

  async reason<T>(
    problem: string,
    context: ReasoningContext,
    options: StructuredOutputOptions<T>,
  ): Promise<ReasoningResult & { structuredAnswer: T }> {
    const trace = context.trace.startStep('structured_output_reasoning');

    // Step 1: Reason about the problem using CoT
    const reasoning = await this.cot.reason(problem, context);

    // Step 2: Convert reasoning into structured output
    const prompt = await this.prompts.render('structured_output_convert', {
      problem,
      reasoning: reasoning.answer,
      schema: JSON.stringify(options.schema),
      schemaDescription: options.schemaDescription,
      examples: options.examples,
    });

    const structured = await this.gateway.generateStructured<T>(prompt, {
      schema: options.schema,
      model: context.config.structuredModel ?? 'claude-3-5-sonnet',
      temperature: 0.0,
      maxTokens: options.maxTokens ?? 4000,
    });

    // Step 3: Validate against additional constraints
    if (options.validate) {
      const validationResult = options.validate(structured);
      if (!validationResult.valid) {
        // Attempt correction
        const correctionPrompt = await this.prompts.render('structured_output_correct', {
          problem,
          structured,
          validationErrors: validationResult.errors,
          schema: JSON.stringify(options.schema),
        });

        const corrected = await this.gateway.generateStructured<T>(correctionPrompt, {
          schema: options.schema,
          model: context.config.structuredModel ?? 'claude-3-5-sonnet',
          temperature: 0.0,
          maxTokens: options.maxTokens ?? 4000,
        });

        trace.complete({ corrected: true, validationErrors: validationResult.errors.length });
        return {
          ...reasoning,
          strategy: 'structured-output',
          structuredAnswer: corrected,
        };
      }
    }

    trace.complete({ corrected: false });
    return {
      ...reasoning,
      strategy: 'structured-output',
      structuredAnswer: structured,
    };
  }
}
```

### 4.9 Strategy Selector

The `StrategySelector` automatically selects the best reasoning strategy based on the complexity assessment and problem characteristics:

```typescript
// @mcv/agentic-os/reasoning/strategy-selector.ts

export class StrategySelector {
  private readonly strategies: Map<string, ReasoningStrategy>;

  constructor(
    private readonly complexityAssessor: ComplexityAssessor,
    private readonly config: ReasoningConfig,
  ) {
    this.strategies = new Map([
      ['chain-of-thought', new ChainOfThought(/* ... */)],
      ['tree-of-thought', new TreeOfThought(/* ... */)],
      ['reflexion', new ReflexionEngine(/* ... */)],
      ['react', new ReActLoop(/* ... */)],
      ['self-consistency', new SelfConsistency(/* ... */)],
      ['analogical', new AnalogicalReasoning(/* ... */)],
      ['counterfactual', new CounterfactualReasoning(/* ... */)],
      ['structured-output', new StructuredOutputReasoning(/* ... */)],
    ]);
  }

  async selectStrategy(
    problem: string,
    context: ReasoningContext,
    override?: ReasoningStrategy,
  ): Promise<{ strategy: ReasoningStrategy; reasoning: string }> {
    // Allow explicit override
    if (override) {
      return { strategy: override, reasoning: 'Caller specified strategy explicitly.' };
    }

    // Assess complexity
    const assessment = await this.complexityAssessor.assess(problem, context);

    // Check if the problem requires tool use
    const needsTools = await this.checkToolRequirement(problem, context);

    // Check if structured output is required
    if (context.outputSchema) {
      return {
        strategy: this.strategies.get('structured-output')!,
        reasoning: `Structured output required (schema: ${context.outputSchema.name}).`,
      };
    }

    // Strategy selection logic
    if (needsTools) {
      return {
        strategy: this.strategies.get('react')!,
        reasoning: `Problem requires tool use (detected tools: ${needsTools.join(', ')}).`,
      };
    }

    switch (assessment.level) {
      case 'simple':
        return {
          strategy: this.strategies.get('chain-of-thought')!,
          reasoning: `Simple problem (score: ${assessment.score.toFixed(2)}). CoT is sufficient.`,
        };

      case 'compound':
        // Check if there are known analogies
        const hasAnalogies = await this.checkAnalogies(problem, context);
        if (hasAnalogies) {
          return {
            strategy: this.strategies.get('analogical')!,
            reasoning: `Compound problem with known analogies. Using analogical reasoning.`,
          };
        }
        return {
          strategy: this.strategies.get('chain-of-thought')!,
          reasoning: `Compound problem (score: ${assessment.score.toFixed(2)}). CoT with decomposition.`,
        };

      case 'complex':
        // Use ToT for design/planning, Reflexion for code/logic, Self-Consistency for factual
        if (context.domain === 'design' || context.domain === 'planning') {
          return {
            strategy: this.strategies.get('tree-of-thought')!,
            reasoning: `Complex ${context.domain} problem. ToT for exploration.`,
          };
        }
        if (context.domain === 'code' || context.domain === 'logic') {
          return {
            strategy: this.strategies.get('reflexion')!,
            reasoning: `Complex ${context.domain} problem. Reflexion for self-correction.`,
          };
        }
        if (context.domain === 'factual') {
          return {
            strategy: this.strategies.get('self-consistency')!,
            reasoning: `Complex factual problem. Self-consistency for convergence.`,
          };
        }
        return {
          strategy: this.strategies.get('tree-of-thought')!,
          reasoning: `Complex problem (score: ${assessment.score.toFixed(2)}). Defaulting to ToT.`,
        };

      case 'chaotic':
        // Use counterfactual reasoning with HITL
        return {
          strategy: this.strategies.get('counterfactual')!,
          reasoning: `Chaotic problem (score: ${assessment.score.toFixed(2)}). Counterfactual + HITL required.`,
        };
    }
  }

  private async checkToolRequirement(
    problem: string,
    context: ReasoningContext,
  ): Promise<string[] | false> {
    const prompt = await this.prompts.render('tool_requirement_check', {
      problem,
      availableTools: context.availableInstruments?.map(i => i.name) ?? [],
    });

    const result = await this.gateway.generateStructured<{ needsTools: boolean; tools: string[] }>(prompt, {
      schema: ToolRequirementSchema,
      model: 'claude-3-5-haiku',
      temperature: 0.0,
      maxTokens: 100,
    });

    return result.needsTools ? result.tools : false;
  }

  private async checkAnalogies(
    problem: string,
    context: ReasoningContext,
  ): Promise<boolean> {
    const results = await context.memory.retrieve({
      query: problem,
      tags: ['reasoning-trace', 'solved-problem'],
      limit: 1,
      minRelevance: 0.8,
    });

    return results.results.length > 0;
  }
}
```

---

## 5. Reasoning Engine

The `ReasoningEngine` is the main entry point for all reasoning operations. It orchestrates strategy selection, execution, evaluation, and trace capture.

### 5.1 Engine Implementation

```typescript
// @mcv/agentic-os/reasoning/engine.ts

export class ReasoningEngine {
  constructor(
    private readonly strategySelector: StrategySelector,
    private readonly evaluationEngine: EvaluationEngine,
    private readonly verificationLayer: VerificationLayer,
    private readonly decompositionEngine: DecompositionEngine,
    private readonly templateRegistry: TemplateRegistry,
    private readonly traceCapture: TraceCapture,
    private readonly cache: ReasoningCache,
    private readonly config: ReasoningConfig,
  ) {}

  /**
   * Main entry point for reasoning.
   * Automatically selects strategy, executes, evaluates, and verifies.
   */
  async reason(
    problem: string,
    context: Partial<ReasoningContext> = {},
  ): Promise<ReasoningResult> {
    // Build full context
    const fullContext = await this.buildContext(problem, context);
    const trace = this.traceCapture.startTrace('reasoning', {
      problem: problem.substring(0, 500),
      caller: fullContext.callerId,
    });
    fullContext.trace = trace;

    try {
      // Check cache first
      const cached = await this.cache.get(problem, fullContext);
      if (cached) {
        trace.complete('cache_hit');
        return cached;
      }

      // Check for applicable template
      const template = await this.templateRegistry.findTemplate(problem, fullContext);
      if (template) {
        const result = await this.executeTemplate(template, problem, fullContext);
        trace.complete('template_execution');
        return result;
      }

      // Select strategy
      const { strategy, reasoning: strategyReason } = await this.strategySelector.selectStrategy(
        problem,
        fullContext,
      );
      trace.addMetadata({ selectedStrategy: strategy.name, strategyReason });

      // Execute reasoning
      const result = await strategy.reason(problem, fullContext);

      // Evaluate result
      const evaluation = await this.evaluationEngine.evaluate(result, problem, fullContext);
      result.evaluation = evaluation;

      // Verify if needed
      if (evaluation.score < fullContext.config.confidenceThreshold) {
        const verification = await this.verificationLayer.verify(result, problem, fullContext);
        result.verification = verification;

        if (!verification.passed) {
          // Attempt retry with different strategy
          const retryResult = await this.retryWithAlternateStrategy(problem, fullContext, strategy.name);
          if (retryResult && retryResult.confidence > result.confidence) {
            this.cache.set(problem, fullContext, retryResult);
            trace.complete('retry_success');
            return retryResult;
          }

          // Still not good enough — escalate to HITL if configured
          if (fullContext.config.escalateOnLowConfidence) {
            result.requiresHITL = true;
            result.hitlReason = `Confidence (${result.confidence.toFixed(2)}) below threshold (${fullContext.config.confidenceThreshold})`;
          }
        }
      }

      // Cache the result
      await this.cache.set(problem, fullContext, result);

      // Store reasoning trace for future analogical reasoning
      await this.storeForFutureAnalogy(problem, result, fullContext);

      trace.complete('success', { confidence: result.confidence, strategy: strategy.name });
      return result;

    } catch (error) {
      trace.complete('error', { error: error.message });
      throw new ReasoningError(`Reasoning failed: ${error.message}`, {
        cause: error,
        problem: problem.substring(0, 200),
        context: fullContext.callerId,
      });
    }
  }

  /**
   * Reason with a specific strategy (no auto-selection).
   */
  async reasonWithStrategy(
    strategyName: string,
    problem: string,
    context: Partial<ReasoningContext> = {},
  ): Promise<ReasoningResult> {
    const fullContext = await this.buildContext(problem, context);
    const trace = this.traceCapture.startTrace('reasoning', {
      problem: problem.substring(0, 500),
      strategy: strategyName,
    });
    fullContext.trace = trace;

    const strategy = this.strategySelector.getStrategy(strategyName);
    if (!strategy) {
      throw new ReasoningError(`Unknown strategy: ${strategyName}`);
    }

    const result = await strategy.reason(problem, fullContext);
    trace.complete('success', { confidence: result.confidence });
    return result;
  }

  /**
   * Decompose a complex problem into subtasks.
   */
  async decompose(
    problem: string,
    context: Partial<ReasoningContext> = {},
  ): Promise<TaskDecomposition> {
    const fullContext = await this.buildContext(problem, context);
    return this.decompositionEngine.decompose(problem, fullContext);
  }

  /**
   * Execute a reasoning template.
   */
  async executeTemplate(
    template: ReasoningTemplate,
    input: string | Record<string, any>,
    context: Partial<ReasoningContext> = {},
  ): Promise<ReasoningResult> {
    const fullContext = await this.buildContext(
      typeof input === 'string' ? input : JSON.stringify(input),
      context,
    );

    return this.templateRegistry.executeTemplate(template, input, fullContext);
  }

  /**
   * Verify a result using the truth verification layer.
   */
  async verify(
    result: ReasoningResult,
    problem: string,
    context: Partial<ReasoningContext> = {},
  ): Promise<VerificationResult> {
    const fullContext = await this.buildContext(problem, context);
    return this.verificationLayer.verify(result, problem, fullContext);
  }

  private async buildContext(
    problem: string,
    partial: Partial<ReasoningContext>,
  ): Promise<ReasoningContext> {
    // Retrieve relevant context from memory
    const memoryResults = partial.skipMemory
      ? { results: [] }
      : await this.memory.retrieve({
          query: problem,
          limit: partial.contextLimit ?? 10,
          ventureId: partial.ventureId,
        });

    return {
      problem,
      callerId: partial.callerId ?? 'anonymous',
      ventureId: partial.ventureId,
      domain: partial.domain ?? 'general',
      relevantContext: memoryResults.results.map(r => r.content).join('\n\n'),
      availableInstruments: partial.availableInstruments,
      outputSchema: partial.outputSchema,
      config: {
        ...this.config,
        ...partial.config,
      },
      memory: this.memory,
      trace: partial.trace ?? this.traceCapture.startTrace('reasoning_context'),
      remainingTokenBudget: partial.remainingTokenBudget ?? this.config.defaultTokenBudget,
      parentTraceId: partial.parentTraceId,
    };
  }

  private async retryWithAlternateStrategy(
    problem: string,
    context: ReasoningContext,
    failedStrategy: string,
  ): Promise<ReasoningResult | null> {
    // Try strategies in fallback order
    const fallbackOrder = [
      'reflexion',
      'tree-of-thought',
      'self-consistency',
      'chain-of-thought',
    ].filter(s => s !== failedStrategy);

    for (const strategyName of fallbackOrder) {
      try {
        const strategy = this.strategySelector.getStrategy(strategyName);
        if (!strategy) continue;

        const result = await strategy.reason(problem, context);
        if (result.confidence >= context.config.confidenceThreshold) {
          return result;
        }
      } catch {
        // Strategy failed — try next
        continue;
      }
    }

    return null;
  }

  private async storeForFutureAnalogy(
    problem: string,
    result: ReasoningResult,
    context: ReasoningContext,
  ): Promise<void> {
    // Only store high-confidence results
    if (result.confidence < 0.9) return;

    await context.memory.store({
      content: `Problem: ${problem}\n\nSolution: ${result.answer}`,
      type: 'semantic',
      tags: ['reasoning-trace', 'solved-problem', result.strategy, context.domain ?? 'general'],
      importance: Math.round(result.confidence * 10),
      metadata: {
        solution: result.answer,
        strategy: result.strategy,
        confidence: result.confidence,
        trace: result.traceId,
      },
    });
  }
}
```

### 5.2 State Machine Integration

The reasoning engine uses xstate for managing complex, multi-step reasoning flows. The state machine ensures that reasoning progresses through well-defined phases with proper error handling and recovery.

```typescript
// @mcv/agentic-os/reasoning/state-machine.ts

import { createMachine, assign, interpret } from 'xstate';

export interface ReasoningMachineContext {
  problem: string;
  config: ReasoningConfig;
  currentStrategy: string;
  currentStep: number;
  maxSteps: number;
  steps: ReasoningStep[];
  result: ReasoningResult | null;
  evaluation: EvaluationResult | null;
  verification: VerificationResult | null;
  error: Error | null;
  retryCount: number;
  maxRetries: number;
  traceId: string;
}

export type ReasoningMachineEvent =
  | { type: 'START'; problem: string; config: ReasoningConfig }
  | { type: 'STEP_COMPLETE'; step: ReasoningStep }
  | { type: 'REASONING_COMPLETE'; result: ReasoningResult }
  | { type: 'EVALUATION_COMPLETE'; evaluation: EvaluationResult }
  | { type: 'VERIFICATION_COMPLETE'; verification: VerificationResult }
  | { type: 'HITL_RESPONSE'; approved: boolean; feedback?: string }
  | { type: 'ERROR'; error: Error }
  | { type: 'TIMEOUT' }
  | { type: 'CANCEL' };

export const reasoningMachine = createMachine<ReasoningMachineContext, ReasoningMachineEvent>({
  id: 'reasoning',
  initial: 'idle',
  context: {
    problem: '',
    config: {} as ReasoningConfig,
    currentStrategy: '',
    currentStep: 0,
    maxSteps: 10,
    steps: [],
    result: null,
    evaluation: null,
    verification: null,
    error: null,
    retryCount: 0,
    maxRetries: 3,
    traceId: '',
  },
  states: {
    idle: {
      on: {
        START: {
          target: 'assessing_complexity',
          actions: assign({
            problem: (_, event) => event.problem,
            config: (_, event) => event.config,
            steps: () => [],
            result: () => null,
            evaluation: () => null,
            verification: () => null,
            error: () => null,
            retryCount: () => 0,
          }),
        },
      },
    },
    assessing_complexity: {
      invoke: {
        src: 'assessComplexity',
        onDone: {
          target: 'selecting_strategy',
          actions: assign({
            currentStrategy: (_, event) => event.data.recommendedStrategy,
            maxSteps: (_, event) => event.data.estimatedSteps,
          }),
        },
        onError: {
          target: 'error',
          actions: assign({ error: (_, event) => event.data }),
        },
      },
    },
    selecting_strategy: {
      invoke: {
        src: 'selectStrategy',
        onDone: {
          target: 'reasoning',
          actions: assign({
            currentStrategy: (_, event) => event.data.strategy,
          }),
        },
        onError: {
          target: 'error',
          actions: assign({ error: (_, event) => event.data }),
        },
      },
    },
    reasoning: {
      invoke: {
        src: 'executeReasoning',
        onDone: {
          target: 'evaluating',
          actions: assign({
            result: (_, event) => event.data,
          }),
        },
        onError: [
          {
            target: 'retrying',
            cond: 'canRetry',
          },
          {
            target: 'error',
            actions: assign({ error: (_, event) => event.data }),
          },
        ],
      },
      on: {
        STEP_COMPLETE: {
          actions: assign({
            steps: (ctx, event) => [...ctx.steps, event.step],
            currentStep: (ctx) => ctx.currentStep + 1,
          }),
        },
        TIMEOUT: { target: 'timeout' },
        CANCEL: { target: 'cancelled' },
      },
    },
    evaluating: {
      invoke: {
        src: 'evaluateResult',
        onDone: [
          {
            target: 'verifying',
            cond: 'needsVerification',
            actions: assign({ evaluation: (_, event) => event.data }),
          },
          {
            target: 'complete',
            cond: 'passesEvaluation',
            actions: assign({ evaluation: (_, event) => event.data }),
          },
          {
            target: 'retrying',
            cond: 'canRetry',
            actions: assign({ evaluation: (_, event) => event.data }),
          },
          {
            target: 'hitl_required',
            actions: assign({ evaluation: (_, event) => event.data }),
          },
        ],
        onError: {
          target: 'error',
          actions: assign({ error: (_, event) => event.data }),
        },
      },
    },
    verifying: {
      invoke: {
        src: 'verifyResult',
        onDone: [
          {
            target: 'complete',
            cond: 'verificationPasses',
            actions: assign({ verification: (_, event) => event.data }),
          },
          {
            target: 'retrying',
            cond: 'canRetry',
            actions: assign({ verification: (_, event) => event.data }),
          },
          {
            target: 'hitl_required',
            actions: assign({ verification: (_, event) => event.data }),
          },
        ],
        onError: {
          target: 'error',
          actions: assign({ error: (_, event) => event.data }),
        },
      },
    },
    retrying: {
      entry: assign({
        retryCount: (ctx) => ctx.retryCount + 1,
      }),
      always: [
        { target: 'reasoning', cond: 'canRetry' },
        { target: 'hitl_required' },
      ],
    },
    hitl_required: {
      invoke: {
        src: 'requestHITLApproval',
      },
      on: {
        HITL_RESPONSE: [
          { target: 'complete', cond: 'hitlApproved' },
          { target: 'reasoning', cond: 'hitlRevisionsRequested' },
          { target: 'failed', cond: 'hitlRejected' },
        ],
        TIMEOUT: { target: 'timeout' },
      },
    },
    complete: { type: 'final' },
    failed: { type: 'final' },
    error: { type: 'final' },
    timeout: { type: 'final' },
    cancelled: { type: 'final' },
  },
}, {
  guards: {
    canRetry: (ctx) => ctx.retryCount < ctx.maxRetries,
    passesEvaluation: (_, event) => event.data.score >= 0.95,
    needsVerification: (_, event) => event.data.score >= 0.8 && event.data.score < 0.95,
    verificationPasses: (_, event) => event.data.passed,
    hitlApproved: (_, event) => event.approved,
    hitlRejected: (_, event) => !event.approved && !event.feedback,
    hitlRevisionsRequested: (_, event) => !event.approved && !!event.feedback,
  },
});
```

---

## 6. Reasoning Traces

Every reasoning operation produces a **trace** — a complete, serializable record of every step, decision, LLM call, tool invocation, evaluation, and verification that occurred during the reasoning process. Traces are the foundation of the system's auditability and observability.

### 6.1 Trace Structure

```typescript
// @mcv/agentic-os/reasoning/trace.ts

export interface ReasoningTrace {
  id: string;                          // Unique trace ID (uuid v7)
  parentTraceId?: string;              // Parent trace (for recursive reasoning)
  type: TraceType;                     // 'reasoning' | 'genesis' | 'decomposition' | 'verification'
  status: TraceStatus;                 // 'running' | 'success' | 'failed' | 'cancelled' | 'timeout'
  
  // Problem & context
  problem: string;                     // Original problem (truncated for storage)
  callerId: string;                    // Who invoked this reasoning
  ventureId?: string;                  // Associated venture
  domain?: string;                     // Problem domain
  
  // Strategy & configuration
  strategy: string;                    // Selected reasoning strategy
  strategyReason: string;              // Why this strategy was selected
  config: Partial<ReasoningConfig>;    // Applied configuration
  
  // Steps
  steps: TraceStep[];                  // All reasoning steps
  
  // Result
  answer?: string;                     // Final answer (truncated for storage)
  confidence: number;                  // Final confidence score
  
  // Evaluation
  evaluation?: TraceEvaluation;        // Quality evaluation
  verification?: TraceVerification;    // Truth verification
  
  // Resource usage
  tokenUsage: {
    prompt: number;                    // Total prompt tokens
    completion: number;                // Total completion tokens
    total: number;                     // Grand total tokens
    costUsd: number;                   // Estimated cost in USD
  };
  
  // Timing
  startedAt: Date;
  completedAt?: Date;
  totalLatencyMs: number;
  
  // Metadata
  metadata: Record<string, any>;       // Strategy-specific metadata
}

export interface TraceStep {
  id: string;                          // Step ID
  parentStepId?: string;               // Parent step (for nested operations)
  type: StepType;                      // 'thought' | 'tool_call' | 'evaluation' | 'verification' | ...
  name: string;                        // Human-readable step name
  
  // Content
  input?: string;                      // Step input (truncated)
  output?: string;                     // Step output (truncated)
  
  // LLM call details (if applicable)
  llmCall?: {
    model: string;
    promptTokens: number;
    completionTokens: number;
    temperature: number;
    latencyMs: number;
  };
  
  // Tool call details (if applicable)
  toolCall?: {
    tool: string;
    params: Record<string, any>;
    result: any;
    latencyMs: number;
  };
  
  // Scoring
  confidence: number;
  
  // Timing
  startedAt: Date;
  completedAt?: Date;
  durationMs: number;
  
  // Metadata
  metadata: Record<string, any>;
}

export type TraceType = 'reasoning' | 'genesis' | 'decomposition' | 'verification' | 'template';
export type TraceStatus = 'running' | 'success' | 'failed' | 'cancelled' | 'timeout' | 'cache_hit' | 'success_after_correction';
export type StepType = 'thought' | 'tool_call' | 'evaluation' | 'verification' | 'decomposition' | 'synthesis' | 'branch' | 'prune' | 'critique' | 'correction' | 'analogy_search' | 'analogy_mapping' | 'solution_transfer' | 'solution_adaptation' | 'counterfactual_scenario' | 'baseline';
```

### 6.2 Trace Capture

The `TraceCapture` class provides a fluent API for building traces during reasoning:

```typescript
// @mcv/agentic-os/reasoning/trace-capture.ts

export class TraceCapture {
  constructor(
    private readonly store: TraceStore,
    private readonly config: TraceConfig,
  ) {}

  startTrace(type: TraceType, metadata?: Record<string, any>): TraceContext {
    const trace: ReasoningTrace = {
      id: generateId('trace'),
      type,
      status: 'running',
      problem: '',
      callerId: '',
      strategy: '',
      strategyReason: '',
      config: {},
      steps: [],
      confidence: 0,
      tokenUsage: { prompt: 0, completion: 0, total: 0, costUsd: 0 },
      startedAt: new Date(),
      totalLatencyMs: 0,
      metadata: metadata ?? {},
    };

    return new TraceContext(trace, this.store, this.config);
  }
}

export class TraceContext {
  constructor(
    private trace: ReasoningTrace,
    private readonly store: TraceStore,
    private readonly config: TraceConfig,
  ) {}

  get id(): string {
    return this.trace.id;
  }

  startStep(name: string, metadata?: Record<string, any>): StepContext {
    const step: TraceStep = {
      id: generateId('step'),
      type: 'thought',
      name,
      confidence: 0,
      startedAt: new Date(),
      durationMs: 0,
      metadata: metadata ?? {},
    };

    this.trace.steps.push(step);
    return new StepContext(step, this.trace, this);
  }

  addMetadata(metadata: Record<string, any>): void {
    Object.assign(this.trace.metadata, metadata);
  }

  addTokenUsage(usage: { prompt: number; completion: number; total: number; costUsd?: number }): void {
    this.trace.tokenUsage.prompt += usage.prompt;
    this.trace.tokenUsage.completion += usage.completion;
    this.trace.tokenUsage.total += usage.total;
    this.trace.tokenUsage.costUsd += usage.costUsd ?? 0;
  }

  async complete(status: TraceStatus, metadata?: Record<string, any>): Promise<void> {
    this.trace.status = status;
    this.trace.completedAt = new Date();
    this.trace.totalLatencyMs = this.trace.completedAt.getTime() - this.trace.startedAt.getTime();
    if (metadata) Object.assign(this.trace.metadata, metadata);

    // Persist trace
    if (this.config.persistTraces) {
      await this.store.saveTrace(this.trace);
    }

    // Emit trace event
    if (this.config.emitEvents) {
      await this.store.emitTraceEvent(this.trace);
    }
  }

  finalize(): ReasoningTrace {
    return { ...this.trace };
  }
}

export class StepContext {
  constructor(
    private step: TraceStep,
    private trace: ReasoningTrace,
    private parent: TraceContext,
  ) {}

  get id(): string {
    return this.step.id;
  }

  setType(type: StepType): void {
    this.step.type = type;
  }

  setInput(input: string): void {
    this.step.input = input.substring(0, 5000); // Truncate for storage
  }

  setOutput(output: string): void {
    this.step.output = output.substring(0, 5000);
  }

  recordLLMCall(details: TraceStep['llmCall']): void {
    this.step.llmCall = details;
    if (details) {
      this.parent.addTokenUsage({
        prompt: details.promptTokens,
        completion: details.completionTokens,
        total: details.promptTokens + details.completionTokens,
      });
    }
  }

  recordToolCall(details: TraceStep['toolCall']): void {
    this.step.toolCall = details;
    this.step.type = 'tool_call';
  }

  startStep(name: string, metadata?: Record<string, any>): StepContext {
    const childStep: TraceStep = {
      id: generateId('step'),
      parentStepId: this.step.id,
      type: 'thought',
      name,
      confidence: 0,
      startedAt: new Date(),
      durationMs: 0,
      metadata: metadata ?? {},
    };

    this.trace.steps.push(childStep);
    return new StepContext(childStep, this.trace, this.parent);
  }

  complete(metadata?: Record<string, any>): void {
    this.step.completedAt = new Date();
    this.step.durationMs = this.step.completedAt.getTime() - this.step.startedAt.getTime();
    if (metadata) {
      Object.assign(this.step.metadata, metadata);
      if (typeof metadata.confidence === 'number') {
        this.step.confidence = metadata.confidence;
      }
    }
  }
}
```

### 6.3 Trace Streaming

For long-running reasoning operations, traces can be streamed to the client in real-time:

```typescript
// @mcv/agentic-os/reasoning/trace-stream.ts

export class TraceStream {
  private subscribers: Map<string, (event: TraceStreamEvent) => void> = new Map();

  subscribe(traceId: string, callback: (event: TraceStreamEvent) => void): () => void {
    this.subscribers.set(traceId, callback);
    return () => this.subscribers.delete(traceId);
  }

  emit(traceId: string, event: TraceStreamEvent): void {
    const callback = this.subscribers.get(traceId);
    if (callback) callback(event);
  }
}

export type TraceStreamEvent =
  | { type: 'step_started'; stepId: string; name: string; timestamp: Date }
  | { type: 'step_completed'; stepId: string; confidence: number; durationMs: number }
  | { type: 'thought'; stepId: string; content: string }
  | { type: 'tool_call'; stepId: string; tool: string; params: Record<string, any> }
  | { type: 'tool_result'; stepId: string; result: any }
  | { type: 'branch_created'; nodeId: string; depth: number }
  | { type: 'branch_pruned'; nodeId: string; score: number }
  | { type: 'evaluation'; score: number; feedback: string }
  | { type: 'verification'; passed: boolean; details: string }
  | { type: 'hitl_required'; reason: string }
  | { type: 'complete'; confidence: number; totalLatencyMs: number }
  | { type: 'error'; message: string };
```

---

## 7. Trace Storage

Reasoning traces are persisted to PostgreSQL via Drizzle ORM, enabling historical analysis, debugging, quality monitoring, and analogical reasoning retrieval.

### 7.1 Schema Definition

```typescript
// @mcv/agentic-os/reasoning/schema.ts

import { pgTable, pgEnum, varchar, text, jsonb, real, integer, timestamp, uuid, boolean, index } from 'drizzle-orm/pg-core';

// Enums
export const reasoningTraceStatusEnum = pgEnum('reasoning_trace_status', [
  'running', 'success', 'failed', 'cancelled', 'timeout', 'cache_hit', 'success_after_correction',
]);

export const reasoningTraceTypeEnum = pgEnum('reasoning_trace_type', [
  'reasoning', 'genesis', 'decomposition', 'verification', 'template',
]);

export const reasoningStepTypeEnum = pgEnum('reasoning_step_type', [
  'thought', 'tool_call', 'evaluation', 'verification', 'decomposition',
  'synthesis', 'branch', 'prune', 'critique', 'correction',
  'analogy_search', 'analogy_mapping', 'solution_transfer', 'solution_adaptation',
  'counterfactual_scenario', 'baseline',
]);

export const reasoningStrategyEnum = pgEnum('reasoning_strategy', [
  'chain-of-thought', 'tree-of-thought', 'reflexion', 'react',
  'self-consistency', 'analogical', 'counterfactual', 'structured-output',
]);

export const traceEvaluationCriterionEnum = pgEnum('trace_evaluation_criterion', [
  'correctness', 'completeness', 'clarity', 'efficiency',
  'factual_grounding', 'consistency', 'relevance', 'safety',
]);

// Tables
export const reasoningTraces = pgTable('reasoning_traces', {
  id: uuid('id').primaryKey().defaultRandom(),
  parentTraceId: uuid('parent_trace_id').references(() => reasoningTraces.id),
  type: reasoningTraceTypeEnum('type').notNull(),
  status: reasoningTraceStatusEnum('status').notNull().default('running'),

  // Problem & context
  problem: text('problem').notNull(),
  callerId: varchar('caller_id', { length: 255 }).notNull(),
  ventureId: varchar('venture_id', { length: 50 }),
  domain: varchar('domain', { length: 100 }),

  // Strategy
  strategy: reasoningStrategyEnum('strategy'),
  strategyReason: text('strategy_reason'),
  config: jsonb('config'),

  // Result
  answer: text('answer'),
  confidence: real('confidence').default(0),

  // Token usage
  promptTokens: integer('prompt_tokens').default(0),
  completionTokens: integer('completion_tokens').default(0),
  totalTokens: integer('total_tokens').default(0),
  costUsd: real('cost_usd').default(0),

  // Timing
  startedAt: timestamp('started_at', { withTimezone: true }).notNull().defaultNow(),
  completedAt: timestamp('completed_at', { withTimezone: true }),
  totalLatencyMs: integer('total_latency_ms').default(0),

  // Metadata
  metadata: jsonb('metadata'),
}, (table) => ({
  statusIdx: index('idx_reasoning_traces_status').on(table.status),
  callerIdx: index('idx_reasoning_traces_caller').on(table.callerId),
  ventureIdx: index('idx_reasoning_traces_venture').on(table.ventureId),
  strategyIdx: index('idx_reasoning_traces_strategy').on(table.strategy),
  startedAtIdx: index('idx_reasoning_traces_started_at').on(table.startedAt),
  parentIdx: index('idx_reasoning_traces_parent').on(table.parentTraceId),
}));

export const reasoningSteps = pgTable('reasoning_steps', {
  id: uuid('id').primaryKey().defaultRandom(),
  traceId: uuid('trace_id').notNull().references(() => reasoningTraces.id, { onDelete: 'cascade' }),
  parentStepId: uuid('parent_step_id').references(() => reasoningSteps.id),
  type: reasoningStepTypeEnum('type').notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  stepIndex: integer('step_index').notNull(),

  // Content
  input: text('input'),
  output: text('output'),

  // LLM call details
  llmModel: varchar('llm_model', { length: 100 }),
  llmPromptTokens: integer('llm_prompt_tokens'),
  llmCompletionTokens: integer('llm_completion_tokens'),
  llmTemperature: real('llm_temperature'),
  llmLatencyMs: integer('llm_latency_ms'),

  // Tool call details
  toolName: varchar('tool_name', { length: 255 }),
  toolParams: jsonb('tool_params'),
  toolResult: jsonb('tool_result'),
  toolLatencyMs: integer('tool_latency_ms'),

  // Scoring
  confidence: real('confidence').default(0),

  // Timing
  startedAt: timestamp('started_at', { withTimezone: true }).notNull().defaultNow(),
  completedAt: timestamp('completed_at', { withTimezone: true }),
  durationMs: integer('duration_ms').default(0),

  // Metadata
  metadata: jsonb('metadata'),
}, (table) => ({
  traceIdx: index('idx_reasoning_steps_trace').on(table.traceId),
  parentStepIdx: index('idx_reasoning_steps_parent').on(table.parentStepId),
  typeIdx: index('idx_reasoning_steps_type').on(table.type),
}));

export const traceEvaluations = pgTable('trace_evaluations', {
  id: uuid('id').primaryKey().defaultRandom(),
  traceId: uuid('trace_id').notNull().references(() => reasoningTraces.id, { onDelete: 'cascade' }),

  // Overall score
  overallScore: real('overall_score').notNull(),

  // Per-criterion scores
  criteria: jsonb('criteria').$type<{
    criterion: string;
    score: number;
    feedback: string;
  }[]>(),

  // Factual grounding
  factualGroundingScore: real('factual_grounding_score'),
  factualGroundingDetails: jsonb('factual_grounding_details'),

  // Consistency
  consistencyScore: real('consistency_score'),
  consistencyDetails: jsonb('consistency_details'),

  // Evaluator details
  evaluatorModel: varchar('evaluator_model', { length: 100 }),
  evaluationLatencyMs: integer('evaluation_latency_ms'),

  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  metadata: jsonb('metadata'),
}, (table) => ({
  traceIdx: index('idx_trace_evaluations_trace').on(table.traceId),
  scoreIdx: index('idx_trace_evaluations_score').on(table.overallScore),
}));

export const reasoningTemplates = pgTable('reasoning_templates', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 255 }).notNull().unique(),
  description: text('description').notNull(),
  category: varchar('category', { length: 100 }).notNull(),
  version: integer('version').notNull().default(1),

  // Template definition
  strategy: reasoningStrategyEnum('strategy').notNull(),
  promptTemplateId: varchar('prompt_template_id', { length: 255 }),
  steps: jsonb('steps').$type<TemplateStepDefinition[]>(),
  config: jsonb('config').$type<Partial<ReasoningConfig>>(),
  inputSchema: jsonb('input_schema'),
  outputSchema: jsonb('output_schema'),

  // Quality metrics
  avgConfidence: real('avg_confidence'),
  usageCount: integer('usage_count').default(0),
  successRate: real('success_rate'),

  // Status
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  metadata: jsonb('metadata'),
}, (table) => ({
  categoryIdx: index('idx_reasoning_templates_category').on(table.category),
  strategyIdx: index('idx_reasoning_templates_strategy').on(table.strategy),
  activeIdx: index('idx_reasoning_templates_active').on(table.isActive),
}));
```

### 7.2 Trace Store Implementation

```typescript
// @mcv/agentic-os/reasoning/trace-store.ts

export class TraceStore {
  constructor(private readonly db: DrizzleDB) {}

  async saveTrace(trace: ReasoningTrace): Promise<void> {
    await this.db.transaction(async (tx) => {
      // Insert trace
      await tx.insert(reasoningTraces).values({
        id: trace.id,
        parentTraceId: trace.parentTraceId,
        type: trace.type,
        status: trace.status,
        problem: trace.problem.substring(0, 10000),
        callerId: trace.callerId,
        ventureId: trace.ventureId,
        domain: trace.domain,
        strategy: trace.strategy as any,
        strategyReason: trace.strategyReason,
        config: trace.config,
        answer: trace.answer?.substring(0, 10000),
        confidence: trace.confidence,
        promptTokens: trace.tokenUsage.prompt,
        completionTokens: trace.tokenUsage.completion,
        totalTokens: trace.tokenUsage.total,
        costUsd: trace.tokenUsage.costUsd,
        startedAt: trace.startedAt,
        completedAt: trace.completedAt,
        totalLatencyMs: trace.totalLatencyMs,
        metadata: trace.metadata,
      });

      // Insert steps
      if (trace.steps.length > 0) {
        await tx.insert(reasoningSteps).values(
          trace.steps.map((step, index) => ({
            id: step.id,
            traceId: trace.id,
            parentStepId: step.parentStepId,
            type: step.type as any,
            name: step.name,
            stepIndex: index,
            input: step.input?.substring(0, 5000),
            output: step.output?.substring(0, 5000),
            llmModel: step.llmCall?.model,
            llmPromptTokens: step.llmCall?.promptTokens,
            llmCompletionTokens: step.llmCall?.completionTokens,
            llmTemperature: step.llmCall?.temperature,
            llmLatencyMs: step.llmCall?.latencyMs,
            toolName: step.toolCall?.tool,
            toolParams: step.toolCall?.params,
            toolResult: step.toolCall?.result,
            toolLatencyMs: step.toolCall?.latencyMs,
            confidence: step.confidence,
            startedAt: step.startedAt,
            completedAt: step.completedAt,
            durationMs: step.durationMs,
            metadata: step.metadata,
          }))
        );
      }

      // Insert evaluation if present
      if (trace.evaluation) {
        await tx.insert(traceEvaluations).values({
          traceId: trace.id,
          overallScore: trace.evaluation.score,
          criteria: trace.evaluation.criteria,
          factualGroundingScore: trace.evaluation.factualGrounding?.score,
          factualGroundingDetails: trace.evaluation.factualGrounding?.details,
          consistencyScore: trace.evaluation.consistency?.score,
          consistencyDetails: trace.evaluation.consistency?.details,
          evaluatorModel: trace.evaluation.evaluatorModel,
          evaluationLatencyMs: trace.evaluation.latencyMs,
          metadata: trace.evaluation.metadata,
        });
      }
    });
  }

  async getTrace(traceId: string): Promise<ReasoningTrace | null> {
    const [trace] = await this.db
      .select()
      .from(reasoningTraces)
      .where(eq(reasoningTraces.id, traceId));

    if (!trace) return null;

    const steps = await this.db
      .select()
      .from(reasoningSteps)
      .where(eq(reasoningSteps.traceId, traceId))
      .orderBy(reasoningSteps.stepIndex);

    const [evaluation] = await this.db
      .select()
      .from(traceEvaluations)
      .where(eq(traceEvaluations.traceId, traceId));

    return this.mapToReasoningTrace(trace, steps, evaluation);
  }

  async queryTraces(query: TraceQuery): Promise<{ traces: ReasoningTrace[]; total: number }> {
    let baseQuery = this.db.select().from(reasoningTraces);

    if (query.status) baseQuery = baseQuery.where(eq(reasoningTraces.status, query.status));
    if (query.strategy) baseQuery = baseQuery.where(eq(reasoningTraces.strategy, query.strategy));
    if (query.ventureId) baseQuery = baseQuery.where(eq(reasoningTraces.ventureId, query.ventureId));
    if (query.callerId) baseQuery = baseQuery.where(eq(reasoningTraces.callerId, query.callerId));
    if (query.minConfidence) baseQuery = baseQuery.where(gte(reasoningTraces.confidence, query.minConfidence));
    if (query.since) baseQuery = baseQuery.where(gte(reasoningTraces.startedAt, query.since));
    if (query.until) baseQuery = baseQuery.where(lte(reasoningTraces.startedAt, query.until));

    const total = await this.db.select({ count: sql`count(*)` }).from(reasoningTraces);
    const traces = await baseQuery
      .orderBy(desc(reasoningTraces.startedAt))
      .limit(query.limit ?? 50)
      .offset(query.offset ?? 0);

    return { traces: traces.map(t => this.mapToReasoningTrace(t, [], null)), total: Number(total[0].count) };
  }

  async getTraceMetrics(period: { since: Date; until: Date }): Promise<TraceMetrics> {
    const metrics = await this.db.execute(sql`
      SELECT
        COUNT(*) as total_traces,
        COUNT(*) FILTER (WHERE status = 'success') as successful_traces,
        COUNT(*) FILTER (WHERE status = 'failed') as failed_traces,
        AVG(confidence) as avg_confidence,
        AVG(total_latency_ms) as avg_latency_ms,
        SUM(total_tokens) as total_tokens,
        SUM(cost_usd) as total_cost_usd,
        strategy,
        COUNT(*) as strategy_count
      FROM reasoning_traces
      WHERE started_at >= ${period.since} AND started_at <= ${period.until}
      GROUP BY strategy
    `);

    return this.mapToTraceMetrics(metrics.rows);
  }

  private mapToReasoningTrace(
    trace: any,
    steps: any[],
    evaluation: any | null,
  ): ReasoningTrace {
    return {
      id: trace.id,
      parentTraceId: trace.parentTraceId,
      type: trace.type,
      status: trace.status,
      problem: trace.problem,
      callerId: trace.callerId,
      ventureId: trace.ventureId,
      domain: trace.domain,
      strategy: trace.strategy,
      strategyReason: trace.strategyReason,
      config: trace.config ?? {},
      steps: steps.map(s => ({
        id: s.id,
        parentStepId: s.parentStepId,
        type: s.type,
        name: s.name,
        input: s.input,
        output: s.output,
        llmCall: s.llmModel ? {
          model: s.llmModel,
          promptTokens: s.llmPromptTokens,
          completionTokens: s.llmCompletionTokens,
          temperature: s.llmTemperature,
          latencyMs: s.llmLatencyMs,
        } : undefined,
        toolCall: s.toolName ? {
          tool: s.toolName,
          params: s.toolParams,
          result: s.toolResult,
          latencyMs: s.toolLatencyMs,
        } : undefined,
        confidence: s.confidence,
        startedAt: s.startedAt,
        completedAt: s.completedAt,
        durationMs: s.durationMs,
        metadata: s.metadata ?? {},
      })),
      answer: trace.answer,
      confidence: trace.confidence,
      evaluation: evaluation ? {
        score: evaluation.overallScore,
        criteria: evaluation.criteria,
        factualGrounding: evaluation.factualGroundingScore != null ? {
          score: evaluation.factualGroundingScore,
          details: evaluation.factualGroundingDetails,
        } : undefined,
        consistency: evaluation.consistencyScore != null ? {
          score: evaluation.consistencyScore,
          details: evaluation.consistencyDetails,
        } : undefined,
        evaluatorModel: evaluation.evaluatorModel,
        latencyMs: evaluation.evaluationLatencyMs,
        metadata: evaluation.metadata,
      } : undefined,
      tokenUsage: {
        prompt: trace.promptTokens,
        completion: trace.completionTokens,
        total: trace.totalTokens,
        costUsd: trace.costUsd,
      },
      startedAt: trace.startedAt,
      completedAt: trace.completedAt,
      totalLatencyMs: trace.totalLatencyMs,
      metadata: trace.metadata ?? {},
    };
  }
}
```

---

## 8. Decomposition Engine

The Decomposition Engine is responsible for breaking complex problems into manageable subtask graphs. It is used by the Queen for strategic planning and by the ReasoningEngine for recursive decomposition.

### 8.1 Decomposition Process

```
Input Problem
    │
    ▼
┌──────────────────┐
│ Classify Problem │ ──→ Simple? → Return single task
│ Complexity       │
└────────┬─────────┘
         │ Compound/Complex
         ▼
┌──────────────────┐
│ Identify         │ ──→ Extract key components, entities, actions
│ Components       │
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│ Generate         │ ──→ Create atomic subtasks with descriptions
│ Subtasks         │
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│ Identify         │ ──→ Build dependency graph (DAG)
│ Dependencies     │
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│ Plan Parallel    │ ──→ Group independent tasks for concurrent execution
│ Execution        │
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│ Estimate         │ ──→ Token budgets, model requirements, time estimates
│ Resources        │
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│ Assess Risks     │ ──→ Per-subtask risk assessment, HITL requirements
│                  │
└────────┬─────────┘
         │
         ▼
TaskDecomposition (DAG with execution plan)
```

### 8.2 Implementation

```typescript
// @mcv/agentic-os/reasoning/decomposition.ts

export class DecompositionEngine {
  constructor(
    private readonly gateway: LLMGateway,
    private readonly prompts: PromptBank,
    private readonly memory: MemoryStore,
    private readonly complexityAssessor: ComplexityAssessor,
  ) {}

  async decompose(
    problem: string,
    context: ReasoningContext,
  ): Promise<TaskDecomposition> {
    const trace = context.trace.startStep('decomposition');

    // Step 1: Assess complexity
    const complexity = await this.complexityAssessor.assess(problem, context);

    if (complexity.level === 'simple') {
      trace.complete({ level: 'simple', taskCount: 1 });
      return this.createSingleTaskDecomposition(problem, context);
    }

    // Step 2: Retrieve relevant context for decomposition
    const domainContext = await this.memory.retrieve({
      query: problem,
      ventureId: context.ventureId,
      tags: ['decomposition-pattern', 'task-template'],
      limit: 5,
    });

    // Step 3: Generate decomposition
    const prompt = await this.prompts.render('decompose_v3', {
      problem,
      complexity,
      domainContext: domainContext.results.map(r => r.content),
      ventureId: context.ventureId,
      availablePods: ['smith', 'growth', 'director', 'ledger', 'scribe', 'oracle', 'herald', 'shield'],
    });

    const rawDecomposition = await this.gateway.generateStructured<RawDecomposition>(prompt, {
      schema: RawDecompositionSchema,
      model: context.config.decompositionModel ?? 'claude-3-5-sonnet',
      temperature: 0.2,
      maxTokens: 4000,
    });

    // Step 4: Validate DAG (no cycles)
    const validatedTasks = this.validateDAG(rawDecomposition.tasks);

    // Step 5: Plan parallel execution groups
    const parallelGroups = this.computeParallelGroups(validatedTasks);

    // Step 6: Estimate resources per task
    const estimatedTasks = await Promise.all(
      validatedTasks.map(task => this.estimateTaskResources(task, context))
    );

    // Step 7: Assess risks
    const riskAssessment = await this.assessDecompositionRisk(estimatedTasks, problem, context);

    const decomposition: TaskDecomposition = {
      originalIntent: problem,
      complexity,
      tasks: estimatedTasks,
      parallelGroups,
      riskAssessment,
      totalEstimatedTokens: estimatedTasks.reduce((sum, t) => sum + (t.estimatedTokens ?? 0), 0),
      totalEstimatedMinutes: Math.max(...parallelGroups.map(g => g.estimatedMinutes)),
      metadata: {
        decompositionModel: context.config.decompositionModel ?? 'claude-3-5-sonnet',
        domainContextUsed: domainContext.results.length,
      },
    };

    trace.complete({
      taskCount: estimatedTasks.length,
      parallelGroupCount: parallelGroups.length,
      riskLevel: riskAssessment.level,
      estimatedTokens: decomposition.totalEstimatedTokens,
    });

    return decomposition;
  }

  private validateDAG(tasks: DecompositionTask[]): DecompositionTask[] {
    // Topological sort to detect cycles
    const taskMap = new Map(tasks.map(t => [t.id, t]));
    const visited = new Set<string>();
    const visiting = new Set<string>();
    const sorted: DecompositionTask[] = [];

    const visit = (taskId: string) => {
      if (visited.has(taskId)) return;
      if (visiting.has(taskId)) {
        throw new DecompositionError(`Cycle detected in task dependencies involving task ${taskId}`);
      }

      visiting.add(taskId);
      const task = taskMap.get(taskId);
      if (!task) throw new DecompositionError(`Unknown task dependency: ${taskId}`);

      for (const depId of task.dependencies) {
        visit(depId);
      }

      visiting.delete(taskId);
      visited.add(taskId);
      sorted.push(task);
    };

    for (const task of tasks) {
      visit(task.id);
    }

    return sorted;
  }

  private computeParallelGroups(tasks: DecompositionTask[]): ParallelGroup[] {
    const groups: ParallelGroup[] = [];
    const completed = new Set<string>();

    while (completed.size < tasks.length) {
      // Find all tasks whose dependencies are satisfied
      const ready = tasks.filter(
        t => !completed.has(t.id) && t.dependencies.every(d => completed.has(d))
      );

      if (ready.length === 0 && completed.size < tasks.length) {
        throw new DecompositionError('Unable to resolve task dependencies — possible cycle');
      }

      groups.push({
        index: groups.length,
        taskIds: ready.map(t => t.id),
        estimatedMinutes: Math.max(...ready.map(t => t.estimatedMinutes ?? 5)),
        canParallelize: true,
      });

      for (const task of ready) {
        completed.add(task.id);
      }
    }

    return groups;
  }

  private async estimateTaskResources(
    task: DecompositionTask,
    context: ReasoningContext,
  ): Promise<DecompositionTask> {
    // Simple heuristic-based estimation
    const baseTokens = {
      development: 8000,
      marketing: 5000,
      operations: 3000,
      finance: 4000,
      content: 6000,
      analytics: 5000,
      communications: 3000,
      security: 6000,
    };

    const complexityMultiplier = {
      low: 0.5,
      medium: 1.0,
      high: 1.5,
      critical: 2.0,
    };

    const base = baseTokens[task.type as keyof typeof baseTokens] ?? 5000;
    const multiplier = complexityMultiplier[task.priority as keyof typeof complexityMultiplier] ?? 1.0;

    return {
      ...task,
      estimatedTokens: Math.round(base * multiplier),
      estimatedMinutes: Math.round((base * multiplier) / 1000), // Rough: 1000 tokens/minute
      recommendedModel: task.priority === 'critical' ? 'claude-3-5-sonnet' : 'claude-3-5-haiku',
    };
  }

  private async assessDecompositionRisk(
    tasks: DecompositionTask[],
    problem: string,
    context: ReasoningContext,
  ): Promise<RiskAssessment> {
    const prompt = await this.prompts.render('decomposition_risk_assessment', {
      problem,
      tasks: tasks.map(t => ({
        id: t.id,
        title: t.title,
        type: t.type,
        priority: t.priority,
        dependencies: t.dependencies,
      })),
    });

    return this.gateway.generateStructured<RiskAssessment>(prompt, {
      schema: RiskAssessmentSchema,
      model: 'claude-3-5-sonnet',
      temperature: 0.1,
      maxTokens: 1000,
    });
  }

  private createSingleTaskDecomposition(
    problem: string,
    context: ReasoningContext,
  ): TaskDecomposition {
    const task: DecompositionTask = {
      id: generateId('task'),
      title: problem.substring(0, 100),
      description: problem,
      type: context.domain ?? 'general',
      priority: 'medium',
      dependencies: [],
      targetPod: 'smith',
      acceptanceCriteria: [],
      estimatedTokens: 5000,
      estimatedMinutes: 5,
      recommendedModel: 'claude-3-5-sonnet',
    };

    return {
      originalIntent: problem,
      complexity: { level: 'simple', score: 0.2, factors: { ambiguity: 0.1, dependencies: 0, novelty: 0.1, risk: 0.1, scope: 0.1 }, recommendedStrategy: 'chain-of-thought', estimatedSteps: 3, estimatedTokens: 5000, requiresHITL: false },
      tasks: [task],
      parallelGroups: [{ index: 0, taskIds: [task.id], estimatedMinutes: 5, canParallelize: true }],
      riskAssessment: { level: 'low', risks: [], requiresHITL: false, mitigationStrategy: 'Standard execution' },
      totalEstimatedTokens: 5000,
      totalEstimatedMinutes: 5,
      metadata: {},
    };
  }
}
```

---

## 9. Evaluation & Scoring

The Evaluation Engine assesses the quality of reasoning outputs across multiple dimensions: correctness, completeness, clarity, efficiency, factual grounding, consistency, relevance, and safety.

### 9.1 Evaluation Dimensions

| Dimension | Description | Weight | Evaluator |
|-----------|------------|--------|-----------|
| **Correctness** | Is the answer factually and logically correct? | 0.30 | LLM + verification |
| **Completeness** | Does the answer address all aspects of the problem? | 0.20 | LLM |
| **Clarity** | Is the answer clear, well-organized, and unambiguous? | 0.10 | LLM |
| **Efficiency** | Is the solution efficient (code performance, token usage)? | 0.10 | LLM + static analysis |
| **Factual Grounding** | Are claims backed by verifiable sources? | 0.15 | Knowledge Graph cross-ref |
| **Consistency** | Is the answer consistent with prior reasoning and known facts? | 0.10 | Memory cross-ref |
| **Safety** | Does the answer avoid harmful, biased, or policy-violating content? | 0.05 | Shield Pod |

### 9.2 Evaluation Implementation

```typescript
// @mcv/agentic-os/reasoning/evaluation.ts

export class EvaluationEngine {
  constructor(
    private readonly gateway: LLMGateway,
    private readonly prompts: PromptBank,
    private readonly memory: MemoryStore,
    private readonly config: EvaluationConfig,
  ) {}

  async evaluate(
    result: ReasoningResult,
    problem: string,
    context: ReasoningContext,
  ): Promise<EvaluationResult> {
    const trace = context.trace.startStep('evaluation');

    // Run evaluations in parallel
    const [
      qualityEval,
      factualGrounding,
      consistencyCheck,
      safetyCheck,
    ] = await Promise.all([
      this.evaluateQuality(result, problem, context),
      this.checkFactualGrounding(result, context),
      this.checkConsistency(result, context),
      this.checkSafety(result, context),
    ]);

    // Compute weighted overall score
    const weights = this.config.dimensionWeights;
    const overallScore =
      qualityEval.correctness * weights.correctness +
      qualityEval.completeness * weights.completeness +
      qualityEval.clarity * weights.clarity +
      qualityEval.efficiency * weights.efficiency +
      factualGrounding.score * weights.factualGrounding +
      consistencyCheck.score * weights.consistency +
      safetyCheck.score * weights.safety;

    // Calibrate confidence
    const calibratedConfidence = this.calibrateConfidence(
      result.confidence,
      overallScore,
      context,
    );

    const evaluation: EvaluationResult = {
      score: overallScore,
      calibratedConfidence,
      quality: qualityEval,
      factualGrounding,
      consistency: consistencyCheck,
      safety: safetyCheck,
      criteria: [
        { criterion: 'correctness', score: qualityEval.correctness, feedback: qualityEval.correctnessFeedback },
        { criterion: 'completeness', score: qualityEval.completeness, feedback: qualityEval.completenessFeedback },
        { criterion: 'clarity', score: qualityEval.clarity, feedback: qualityEval.clarityFeedback },
        { criterion: 'efficiency', score: qualityEval.efficiency, feedback: qualityEval.efficiencyFeedback },
        { criterion: 'factual_grounding', score: factualGrounding.score, feedback: factualGrounding.summary },
        { criterion: 'consistency', score: consistencyCheck.score, feedback: consistencyCheck.summary },
        { criterion: 'safety', score: safetyCheck.score, feedback: safetyCheck.summary },
      ],
      evaluatorModel: this.config.evaluatorModel,
      latencyMs: 0, // Set below
      metadata: {},
    };

    trace.complete({
      overallScore,
      calibratedConfidence,
      correctness: qualityEval.correctness,
      factualGrounding: factualGrounding.score,
    });

    return evaluation;
  }

  private async evaluateQuality(
    result: ReasoningResult,
    problem: string,
    context: ReasoningContext,
  ): Promise<QualityEvaluation> {
    const prompt = await this.prompts.render('evaluation_quality_v2', {
      problem,
      answer: result.answer,
      reasoningSteps: result.steps?.map(s => s.content),
      strategy: result.strategy,
    });

    return this.gateway.generateStructured<QualityEvaluation>(prompt, {
      schema: QualityEvaluationSchema,
      model: this.config.evaluatorModel ?? 'claude-3-5-sonnet',
      temperature: 0.0,
      maxTokens: 1500,
    });
  }

  private async checkFactualGrounding(
    result: ReasoningResult,
    context: ReasoningContext,
  ): Promise<FactualGroundingResult> {
    // Extract claims from the answer
    const claims = await this.extractClaims(result.answer);

    if (claims.length === 0) {
      return { score: 1.0, claims: [], summary: 'No factual claims to verify.' };
    }

    // Verify each claim against the knowledge graph
    const verifiedClaims = await Promise.all(
      claims.map(async (claim) => {
        const evidence = await context.memory.retrieve({
          query: claim.text,
          tags: ['fact', 'verified'],
          limit: 3,
          minRelevance: 0.7,
        });

        const isGrounded = evidence.results.length > 0;
        return {
          claim: claim.text,
          isGrounded,
          evidence: evidence.results.map(r => r.content.substring(0, 200)),
          confidence: isGrounded ? evidence.results[0].relevanceScore : 0,
        };
      })
    );

    const groundedCount = verifiedClaims.filter(c => c.isGrounded).length;
    const score = claims.length > 0 ? groundedCount / claims.length : 1.0;

    return {
      score,
      claims: verifiedClaims,
      summary: `${groundedCount}/${claims.length} claims are grounded in verified knowledge.`,
    };
  }

  private async checkConsistency(
    result: ReasoningResult,
    context: ReasoningContext,
  ): Promise<ConsistencyResult> {
    // Check against recent reasoning results
    const recentTraces = await context.memory.retrieve({
      query: result.answer,
      tags: ['reasoning-trace'],
      limit: 5,
      recency: '24h',
    });

    if (recentTraces.results.length === 0) {
      return { score: 1.0, contradictions: [], summary: 'No prior reasoning to check against.' };
    }

    const prompt = await this.prompts.render('evaluation_consistency', {
      currentAnswer: result.answer,
      priorResults: recentTraces.results.map(r => r.content),
    });

    return this.gateway.generateStructured<ConsistencyResult>(prompt, {
      schema: ConsistencyResultSchema,
      model: this.config.evaluatorModel ?? 'claude-3-5-sonnet',
      temperature: 0.0,
      maxTokens: 1000,
    });
  }

  private async checkSafety(
    result: ReasoningResult,
    context: ReasoningContext,
  ): Promise<SafetyResult> {
    const prompt = await this.prompts.render('evaluation_safety', {
      answer: result.answer,
      domain: context.domain,
    });

    return this.gateway.generateStructured<SafetyResult>(prompt, {
      schema: SafetyResultSchema,
      model: 'claude-3-5-haiku', // Fast model for safety screening
      temperature: 0.0,
      maxTokens: 500,
    });
  }

  private calibrateConfidence(
    rawConfidence: number,
    evaluationScore: number,
    context: ReasoningContext,
  ): number {
    // Blend raw model confidence with evaluation score
    // Weight evaluation more heavily (70/30) since it's multi-dimensional
    const blended = rawConfidence * 0.3 + evaluationScore * 0.7;

    // Apply domain-specific calibration
    const domainCalibration = this.config.domainCalibration?.[context.domain ?? 'general'] ?? 1.0;

    return Math.max(0, Math.min(1, blended * domainCalibration));
  }

  private async extractClaims(answer: string): Promise<{ text: string; type: string }[]> {
    const prompt = await this.prompts.render('extract_factual_claims', { answer });

    const result = await this.gateway.generateStructured<{ claims: { text: string; type: string }[] }>(prompt, {
      schema: ExtractClaimsSchema,
      model: 'claude-3-5-haiku',
      temperature: 0.0,
      maxTokens: 1000,
    });

    return result.claims;
  }
}
```

### 9.3 Confidence Calibration

The system maintains a calibration model that adjusts raw LLM confidence scores based on historical accuracy. Over time, the calibrator learns how to map model-reported confidence to actual correctness probability.

```typescript
// @mcv/agentic-os/reasoning/calibration.ts

export class ConfidenceCalibrator {
  private bucketAccuracy: Map<string, { correct: number; total: number }> = new Map();

  async calibrate(
    rawConfidence: number,
    model: string,
    strategy: string,
    domain: string,
  ): Promise<number> {
    const bucketKey = `${model}:${strategy}:${domain}:${Math.floor(rawConfidence * 10) / 10}`;
    const bucket = this.bucketAccuracy.get(bucketKey);

    if (!bucket || bucket.total < 10) {
      // Not enough data — use raw confidence with a conservative penalty
      return rawConfidence * 0.9;
    }

    // Use historical accuracy for this bucket
    const historicalAccuracy = bucket.correct / bucket.total;

    // Blend with raw confidence (Bayesian-style)
    return (rawConfidence + historicalAccuracy) / 2;
  }

  async recordOutcome(
    rawConfidence: number,
    model: string,
    strategy: string,
    domain: string,
    wasCorrect: boolean,
  ): Promise<void> {
    const bucketKey = `${model}:${strategy}:${domain}:${Math.floor(rawConfidence * 10) / 10}`;
    const bucket = this.bucketAccuracy.get(bucketKey) ?? { correct: 0, total: 0 };

    bucket.total += 1;
    if (wasCorrect) bucket.correct += 1;

    this.bucketAccuracy.set(bucketKey, bucket);
  }
}
```

---

## 10. Reasoning Templates

Reasoning Templates are pre-built, reusable reasoning patterns for common task types. They encapsulate the strategy selection, prompt templates, evaluation criteria, and configuration for a specific class of problems.

### 10.1 Template Categories

| Category | Templates | Description |
|----------|-----------|-------------|
| **Analysis** | `code_review`, `architecture_review`, `security_audit`, `performance_analysis`, `data_analysis` | Systematic analysis of artifacts |
| **Comparison** | `technology_comparison`, `approach_comparison`, `vendor_evaluation`, `tradeoff_analysis` | Comparing alternatives with structured criteria |
| **Planning** | `project_plan`, `sprint_plan`, `migration_plan`, `rollback_plan`, `capacity_plan` | Creating actionable plans |
| **Debugging** | `bug_diagnosis`, `performance_debug`, `error_trace`, `regression_analysis` | Systematic debugging workflows |
| **Summarization** | `meeting_summary`, `document_summary`, `code_summary`, `incident_report` | Distilling information |
| **Generation** | `api_design`, `schema_design`, `test_generation`, `documentation` | Creating new artifacts |
| **Decision** | `decision_matrix`, `risk_assessment`, `go_no_go`, `priority_ranking` | Structured decision-making |

### 10.2 Template Definition

```typescript
// @mcv/agentic-os/reasoning/templates/types.ts

export interface ReasoningTemplate {
  id: string;
  name: string;
  description: string;
  category: TemplateCategory;
  version: number;

  // Strategy configuration
  strategy: ReasoningStrategy;
  strategyConfig: Partial<ReasoningConfig>;

  // Steps
  steps: TemplateStepDefinition[];

  // Input/output
  inputSchema: z.ZodSchema;
  outputSchema: z.ZodSchema;
  inputDescription: string;
  outputDescription: string;

  // Prompts
  promptTemplateIds: string[];

  // Evaluation
  evaluationCriteria: EvaluationCriterion[];

  // Metadata
  tags: string[];
  usageGuidelines: string;
  examples: TemplateExample[];
}

export interface TemplateStepDefinition {
  name: string;
  description: string;
  promptTemplateId: string;
  inputMapping: Record<string, string>; // Maps template input fields to step input
  outputMapping: Record<string, string>;
  model?: string;
  temperature?: number;
  maxTokens?: number;
  optional?: boolean;
  condition?: string; // JavaScript expression evaluated against prior step outputs
}

export interface TemplateExample {
  name: string;
  input: Record<string, any>;
  expectedOutput: Record<string, any>;
  description: string;
}

export type TemplateCategory =
  | 'analysis'
  | 'comparison'
  | 'planning'
  | 'debugging'
  | 'summarization'
  | 'generation'
  | 'decision';
```

### 10.3 Built-in Templates

```typescript
// @mcv/agentic-os/reasoning/templates/built-in/code-review.ts

export const codeReviewTemplate: ReasoningTemplate = {
  id: 'tpl_code_review_v2',
  name: 'Code Review',
  description: 'Systematic code review analyzing correctness, performance, security, maintainability, and test coverage.',
  category: 'analysis',
  version: 2,

  strategy: 'chain-of-thought',
  strategyConfig: {
    cotMaxSteps: 8,
    cotModel: 'claude-3-5-sonnet',
    cotTemperature: 0.1,
    confidenceThreshold: 0.9,
  },

  steps: [
    {
      name: 'understand_context',
      description: 'Understand the purpose, scope, and context of the code change.',
      promptTemplateId: 'code_review_context',
      inputMapping: { code: 'code', prTitle: 'title', prDescription: 'description' },
      outputMapping: { context: 'output' },
      model: 'claude-3-5-sonnet',
      temperature: 0.1,
      maxTokens: 1000,
    },
    {
      name: 'check_correctness',
      description: 'Verify logical correctness, edge cases, and error handling.',
      promptTemplateId: 'code_review_correctness',
      inputMapping: { code: 'code', context: 'steps.understand_context.output' },
      outputMapping: { correctnessIssues: 'output' },
      model: 'claude-3-5-sonnet',
      temperature: 0.1,
      maxTokens: 2000,
    },
    {
      name: 'check_performance',
      description: 'Analyze time/space complexity, potential bottlenecks, and optimization opportunities.',
      promptTemplateId: 'code_review_performance',
      inputMapping: { code: 'code', context: 'steps.understand_context.output' },
      outputMapping: { performanceIssues: 'output' },
      model: 'claude-3-5-sonnet',
      temperature: 0.1,
      maxTokens: 1500,
    },
    {
      name: 'check_security',
      description: 'Identify security vulnerabilities, injection risks, and auth/authz issues.',
      promptTemplateId: 'code_review_security',
      inputMapping: { code: 'code', context: 'steps.understand_context.output' },
      outputMapping: { securityIssues: 'output' },
      model: 'claude-3-5-sonnet',
      temperature: 0.1,
      maxTokens: 1500,
    },
    {
      name: 'check_maintainability',
      description: 'Evaluate code organization, naming, documentation, and adherence to coding standards.',
      promptTemplateId: 'code_review_maintainability',
      inputMapping: { code: 'code', context: 'steps.understand_context.output' },
      outputMapping: { maintainabilityIssues: 'output' },
      model: 'claude-3-5-sonnet',
      temperature: 0.1,
      maxTokens: 1500,
    },
    {
      name: 'check_tests',
      description: 'Assess test coverage, test quality, and missing test scenarios.',
      promptTemplateId: 'code_review_tests',
      inputMapping: { code: 'code', tests: 'tests', context: 'steps.understand_context.output' },
      outputMapping: { testIssues: 'output' },
      model: 'claude-3-5-sonnet',
      temperature: 0.1,
      maxTokens: 1500,
      optional: true,
      condition: 'input.tests != null',
    },
    {
      name: 'synthesize_review',
      description: 'Combine all findings into a structured code review report.',
      promptTemplateId: 'code_review_synthesis',
      inputMapping: {
        context: 'steps.understand_context.output',
        correctness: 'steps.check_correctness.output',
        performance: 'steps.check_performance.output',
        security: 'steps.check_security.output',
        maintainability: 'steps.check_maintainability.output',
        tests: 'steps.check_tests.output',
      },
      outputMapping: { review: 'output' },
      model: 'claude-3-5-sonnet',
      temperature: 0.1,
      maxTokens: 3000,
    },
  ],

  inputSchema: z.object({
    code: z.string().describe('The code to review'),
    title: z.string().optional().describe('PR title'),
    description: z.string().optional().describe('PR description'),
    tests: z.string().optional().describe('Associated test code'),
    language: z.string().optional().describe('Programming language'),
  }),

  outputSchema: z.object({
    summary: z.string(),
    verdict: z.enum(['approve', 'request_changes', 'reject']),
    issues: z.array(z.object({
      severity: z.enum(['critical', 'major', 'minor', 'suggestion']),
      category: z.enum(['correctness', 'performance', 'security', 'maintainability', 'testing']),
      line: z.number().optional(),
      description: z.string(),
      suggestion: z.string().optional(),
    })),
    score: z.number().min(0).max(10),
  }),

  inputDescription: 'Code diff or full source file with optional PR context and tests.',
  outputDescription: 'Structured review with categorized issues, severity ratings, and an overall verdict.',

  promptTemplateIds: [
    'code_review_context', 'code_review_correctness', 'code_review_performance',
    'code_review_security', 'code_review_maintainability', 'code_review_tests',
    'code_review_synthesis',
  ],

  evaluationCriteria: [
    { name: 'correctness', weight: 0.35, description: 'Are the identified issues real and accurately described?' },
    { name: 'completeness', weight: 0.25, description: 'Are all significant issues caught?' },
    { name: 'actionability', weight: 0.25, description: 'Are suggestions specific and implementable?' },
    { name: 'false_positive_rate', weight: 0.15, description: 'Are there few or no false positives?' },
  ],

  tags: ['code', 'review', 'quality', 'smith-pod'],
  usageGuidelines: 'Use for all code changes going through the Smith Pod. Input should be a diff or complete file. For large PRs, decompose into per-file reviews.',
  examples: [
    {
      name: 'Simple function review',
      input: { code: 'function add(a, b) { return a + b; }', language: 'typescript' },
      expectedOutput: { verdict: 'approve', score: 9, issues: [] },
      description: 'A trivial function that should pass review.',
    },
  ],
};
```

### 10.4 Template Registry

```typescript
// @mcv/agentic-os/reasoning/templates/registry.ts

export class TemplateRegistry {
  private templates: Map<string, ReasoningTemplate> = new Map();

  constructor(
    private readonly db: DrizzleDB,
    private readonly gateway: LLMGateway,
    private readonly prompts: PromptBank,
  ) {}

  async initialize(): Promise<void> {
    // Load built-in templates
    const builtIn = [
      codeReviewTemplate,
      architectureReviewTemplate,
      securityAuditTemplate,
      technologyComparisonTemplate,
      projectPlanTemplate,
      bugDiagnosisTemplate,
      documentSummaryTemplate,
      apiDesignTemplate,
      decisionMatrixTemplate,
      riskAssessmentTemplate,
    ];

    for (const template of builtIn) {
      this.templates.set(template.id, template);
    }

    // Load custom templates from database
    const customTemplates = await this.db
      .select()
      .from(reasoningTemplates)
      .where(eq(reasoningTemplates.isActive, true));

    for (const ct of customTemplates) {
      this.templates.set(ct.id, this.mapFromDB(ct));
    }
  }

  async findTemplate(
    problem: string,
    context: ReasoningContext,
  ): Promise<ReasoningTemplate | null> {
    // Use semantic search to find matching templates
    const prompt = await this.prompts.render('template_match', {
      problem,
      availableTemplates: Array.from(this.templates.values()).map(t => ({
        id: t.id,
        name: t.name,
        description: t.description,
        category: t.category,
        tags: t.tags,
      })),
    });

    const match = await this.gateway.generateStructured<{ templateId: string | null; confidence: number }>(prompt, {
      schema: TemplateMatchSchema,
      model: 'claude-3-5-haiku',
      temperature: 0.0,
      maxTokens: 100,
    });

    if (match.templateId && match.confidence > 0.8) {
      return this.templates.get(match.templateId) ?? null;
    }

    return null;
  }

  async executeTemplate(
    template: ReasoningTemplate,
    input: string | Record<string, any>,
    context: ReasoningContext,
  ): Promise<ReasoningResult> {
    const trace = context.trace.startStep('template_execution', { templateId: template.id });
    const parsedInput = typeof input === 'string' ? { text: input } : input;

    // Validate input
    const inputValidation = template.inputSchema.safeParse(parsedInput);
    if (!inputValidation.success) {
      throw new ReasoningError(`Template input validation failed: ${inputValidation.error.message}`);
    }

    const stepOutputs: Record<string, any> = {};
    const steps: ReasoningStep[] = [];

    for (const stepDef of template.steps) {
      // Check condition
      if (stepDef.condition) {
        const conditionResult = this.evaluateCondition(stepDef.condition, { input: parsedInput, steps: stepOutputs });
        if (!conditionResult) continue;
      }

      const stepTrace = trace.startStep(stepDef.name);

      // Resolve input mapping
      const stepInput = this.resolveMapping(stepDef.inputMapping, parsedInput, stepOutputs);

      // Render prompt
      const prompt = await this.prompts.render(stepDef.promptTemplateId, stepInput);

      // Execute
      const response = await this.gateway.generate(prompt, {
        model: stepDef.model ?? template.strategyConfig.cotModel ?? 'claude-3-5-sonnet',
        temperature: stepDef.temperature ?? 0.2,
        maxTokens: stepDef.maxTokens ?? 2000,
      });

      // Store output
      stepOutputs[stepDef.name] = response.content;

      steps.push({
        type: 'thought',
        content: response.content,
        confidence: 0,
        tokenUsage: response.usage,
        latencyMs: response.latencyMs,
      });

      stepTrace.complete({ tokens: response.usage?.totalTokens });
    }

    // Parse final output
    const finalOutput = stepOutputs[template.steps[template.steps.length - 1].name];

    // Update template usage stats
    await this.updateUsageStats(template.id);

    trace.complete({ stepCount: steps.length });

    return {
      answer: finalOutput,
      confidence: 0.9, // Templates have inherently high confidence
      strategy: 'template',
      steps,
      traceId: trace.id,
      metadata: {
        templateId: template.id,
        templateName: template.name,
        templateCategory: template.category,
      },
    };
  }

  private resolveMapping(
    mapping: Record<string, string>,
    input: Record<string, any>,
    stepOutputs: Record<string, any>,
  ): Record<string, any> {
    const resolved: Record<string, any> = {};

    for (const [key, path] of Object.entries(mapping)) {
      if (path.startsWith('steps.')) {
        const parts = path.split('.');
        resolved[key] = stepOutputs[parts[1]];
      } else {
        resolved[key] = input[path] ?? path;
      }
    }

    return resolved;
  }

  private evaluateCondition(condition: string, ctx: any): boolean {
    try {
      const fn = new Function('input', 'steps', `return ${condition}`);
      return !!fn(ctx.input, ctx.steps);
    } catch {
      return true; // Default to executing if condition evaluation fails
    }
  }

  private async updateUsageStats(templateId: string): Promise<void> {
    await this.db
      .update(reasoningTemplates)
      .set({
        usageCount: sql`${reasoningTemplates.usageCount} + 1`,
        updatedAt: new Date(),
      })
      .where(eq(reasoningTemplates.id, templateId));
  }
}
```

---

## 11. Tool-Augmented Reasoning (ReAct)

The ReAct (Reasoning + Acting) loop is the primary strategy for tasks requiring interaction with external tools, APIs, databases, and file systems. It interleaves reasoning steps with tool execution in a structured loop.

### 11.1 ReAct Loop Architecture

```
┌─────────────────────────────────────────────┐
│                REACT LOOP                    │
│                                              │
│  ┌──────────┐                               │
│  │ OBSERVE  │ ←────── tool result            │
│  │ (Context)│                                │
│  └────┬─────┘                                │
│       │                                      │
│       ▼                                      │
│  ┌──────────┐                               │
│  │ THINK    │ ←────── reasoning step         │
│  │ (Reason) │                                │
│  └────┬─────┘                                │
│       │                                      │
│       ├──→ DONE? ──→ YES ──→ Return result  │
│       │                                      │
│       ▼                                      │
│  ┌──────────┐                               │
│  │ ACT      │ ──────→ execute tool           │
│  │ (Tool)   │                                │
│  └────┬─────┘                                │
│       │                                      │
│       └────────────────→ OBSERVE (loop)      │
│                                              │
└─────────────────────────────────────────────┘
```

### 11.2 Implementation

```typescript
// @mcv/agentic-os/reasoning/strategies/react.ts

export class ReActLoop implements ReasoningStrategy {
  readonly name = 'react';
  readonly shortName = 'react';

  constructor(
    private readonly gateway: LLMGateway,
    private readonly prompts: PromptBank,
    private readonly instrumentRegistry: InstrumentRegistry,
    private readonly config: ReActConfig,
  ) {}

  async reason(
    problem: string,
    context: ReasoningContext,
    options?: ReActOptions,
  ): Promise<ReasoningResult> {
    const trace = context.trace.startStep('react_reasoning');

    const maxIterations = options?.maxIterations ?? this.config.maxIterations ?? 10;
    const availableTools = this.getAvailableTools(context);

    const history: ReActStep[] = [];
    let iteration = 0;

    while (iteration < maxIterations) {
      const iterTrace = trace.startStep(`react_iteration_${iteration}`);

      // THINK: Generate next reasoning step
      const thinkPrompt = await this.prompts.render('react_think_v2', {
        problem,
        history,
        availableTools: availableTools.map(t => ({
          name: t.name,
          description: t.description,
          parameters: t.parameterSchema,
        })),
        iteration,
        maxIterations,
      });

      const thinkResponse = await this.gateway.generateStructured<ReActThought>(thinkPrompt, {
        schema: ReActThoughtSchema,
        model: context.config.reactModel ?? 'claude-3-5-sonnet',
        temperature: context.config.reactTemperature ?? 0.2,
        maxTokens: 1500,
      });

      const thought: ReActStep = {
        type: 'thought',
        content: thinkResponse.thought,
        confidence: thinkResponse.confidence,
        metadata: { iteration },
      };
      history.push(thought);

      // CHECK: Is the answer ready?
      if (thinkResponse.action.type === 'finish') {
        const answer = thinkResponse.action.answer;
        iterTrace.complete({ status: 'finished', confidence: thinkResponse.confidence });

        trace.complete({
          totalIterations: iteration + 1,
          toolCallCount: history.filter(h => h.type === 'action').length,
          finalConfidence: thinkResponse.confidence,
        });

        return {
          answer,
          confidence: thinkResponse.confidence,
          strategy: 'react',
          steps: history.map(h => ({
            type: h.type,
            content: h.content,
            confidence: h.confidence,
            metadata: h.metadata,
          })),
          traceId: trace.id,
          metadata: {
            totalIterations: iteration + 1,
            toolsCalled: [...new Set(history.filter(h => h.type === 'action').map(h => h.metadata?.tool))],
          },
        };
      }

      // ACT: Execute the selected tool
      const toolName = thinkResponse.action.tool;
      const toolParams = thinkResponse.action.params;

      const actionStep: ReActStep = {
        type: 'action',
        content: `Calling ${toolName} with params: ${JSON.stringify(toolParams)}`,
        confidence: 0,
        metadata: { tool: toolName, params: toolParams, iteration },
      };
      history.push(actionStep);

      // Execute tool
      let toolResult: any;
      try {
        const tool = availableTools.find(t => t.name === toolName);
        if (!tool) {
          throw new Error(`Tool not found: ${toolName}`);
        }

        // Safety check: verify tool is allowed in current context
        if (!this.isToolAllowed(tool, context)) {
          throw new Error(`Tool ${toolName} is not allowed in the current context`);
        }

        toolResult = await tool.execute(toolParams, {
          timeout: this.config.toolTimeoutMs ?? 30000,
          sandbox: this.config.sandboxTools ?? true,
        });
      } catch (error) {
        toolResult = { error: error.message };
      }

      // OBSERVE: Record tool result
      const observationStep: ReActStep = {
        type: 'observation',
        content: typeof toolResult === 'string'
          ? toolResult
          : JSON.stringify(toolResult, null, 2),
        confidence: 0,
        metadata: { tool: toolName, iteration },
      };
      history.push(observationStep);

      iterTrace.complete({
        status: 'continue',
        tool: toolName,
        toolSuccess: !toolResult?.error,
      });

      iteration++;
    }

    // Max iterations reached — synthesize best answer from history
    const fallbackAnswer = await this.synthesizeFallback(problem, history, context);

    trace.complete({
      totalIterations: maxIterations,
      status: 'max_iterations_reached',
    });

    return {
      answer: fallbackAnswer,
      confidence: 0.5, // Low confidence since we hit the limit
      strategy: 'react',
      steps: history.map(h => ({
        type: h.type,
        content: h.content,
        confidence: h.confidence,
        metadata: h.metadata,
      })),
      traceId: trace.id,
      metadata: {
        totalIterations: maxIterations,
        hitMaxIterations: true,
        toolsCalled: [...new Set(history.filter(h => h.type === 'action').map(h => h.metadata?.tool))],
      },
    };
  }

  private getAvailableTools(context: ReasoningContext): Instrument[] {
    if (context.availableInstruments) {
      return context.availableInstruments;
    }
    return this.instrumentRegistry.getAll();
  }

  private isToolAllowed(tool: Instrument, context: ReasoningContext): boolean {
    // Check capability requirements
    if (tool.requiredCapabilities) {
      const agentCapabilities = context.agentCapabilities ?? [];
      return tool.requiredCapabilities.every(cap => agentCapabilities.includes(cap));
    }
    return true;
  }

  private async synthesizeFallback(
    problem: string,
    history: ReActStep[],
    context: ReasoningContext,
  ): Promise<string> {
    const prompt = await this.prompts.render('react_synthesize_fallback', {
      problem,
      history: history.map(h => ({ type: h.type, content: h.content.substring(0, 500) })),
    });

    const response = await this.gateway.generate(prompt, {
      model: context.config.reactModel ?? 'claude-3-5-sonnet',
      temperature: 0.1,
      maxTokens: 2000,
    });

    return response.content;
  }
}
```

### 11.3 Tool Selection Strategy

The ReAct loop uses a structured approach to tool selection:

```typescript
// @mcv/agentic-os/reasoning/tool-selection.ts

export interface ReActThought {
  thought: string;
  confidence: number;
  action: ReActAction;
}

export type ReActAction =
  | { type: 'tool'; tool: string; params: Record<string, any>; reasoning: string }
  | { type: 'finish'; answer: string; reasoning: string };

// Tool selection is guided by the prompt template which includes:
// 1. Available tool descriptions with parameter schemas
// 2. Previous tool calls and their results
// 3. The current reasoning state
// 4. Guidelines for when to use each tool vs. when to finish
```

---

## 12. Integration Points

### 12.1 Intelligence/Gateway Integration

The Reasoning Engine uses `@mcv/gateway` for all LLM calls. The gateway handles model selection, rate limiting, fallback routing, and cost optimization.

```typescript
// Integration with @mcv/gateway

// Model routing per reasoning strategy
const modelRouting: Record<string, ModelPreference> = {
  'chain-of-thought': { primary: 'claude-3-5-sonnet', fallback: 'gpt-4o' },
  'tree-of-thought': { primary: 'claude-3-5-sonnet', fallback: 'gpt-4o' },
  'reflexion': { primary: 'claude-3-5-sonnet', fallback: 'gpt-4o' },
  'react': { primary: 'claude-3-5-sonnet', fallback: 'gpt-4o' },
  'self-consistency': { primary: 'claude-3-5-sonnet', fallback: 'gpt-4o' },
  'evaluation': { primary: 'claude-3-5-sonnet', fallback: 'gemini-2-0-ultra' },
  'verification': { primary: 'gemini-2-0-ultra', fallback: 'claude-3-5-sonnet' },
  'complexity-assessment': { primary: 'claude-3-5-haiku', fallback: 'gpt-4o-mini' },
  'template-matching': { primary: 'claude-3-5-haiku', fallback: 'gpt-4o-mini' },
};
```

### 12.2 Memory Integration

The Reasoning Engine integrates with `@mcv/agentic-os/memory` at multiple points:

| Integration Point | Memory Type | Purpose |
|-------------------|------------|---------|
| Context retrieval | Semantic | Fetch relevant knowledge for reasoning |
| Analogical search | Episodic | Find similar solved problems |
| Fact verification | Semantic | Cross-reference factual claims |
| Consistency check | Episodic | Check against recent reasoning results |
| Result storage | Episodic + Semantic | Store solved problems for future reference |
| Pattern caching | Procedural | Cache reusable reasoning patterns |
| Working memory | Working | Short-term context during multi-step reasoning |

### 12.3 Queen Integration

The Queen (Level 3 orchestrator) uses the Reasoning Engine for:

- **Task Decomposition:** Breaking strategic requests into task graphs via `DecompositionEngine`.
- **Risk Assessment:** Evaluating task risks via `EvaluationEngine` and `CounterfactualReasoning`.
- **Result Aggregation:** Synthesizing results from multiple Ralph Pods.
- **Strategic Planning:** Using `TreeOfThought` for exploring multiple strategic approaches.

### 12.4 HITL Integration

The Reasoning Engine integrates with `@mcv/agentic-os/hitl` for human oversight:

```typescript
// HITL escalation from reasoning
async function escalateToHITL(
  problem: string,
  context: ReasoningContext,
  reason: string,
): Promise<ReasoningResult> {
  const hitlRequest: HITLRequest = {
    type: 'reasoning_review',
    title: `Reasoning Review: ${problem.substring(0, 100)}`,
    description: `The reasoning engine requires human review.\n\nReason: ${reason}`,
    context: {
      problem,
      currentBestAnswer: context.currentBestResult?.answer,
      currentConfidence: context.currentBestResult?.confidence,
      traceId: context.trace.id,
      strategy: context.currentStrategy,
    },
    priority: context.priority ?? 'medium',
    riskLevel: 'medium',
    requiredApprovers: 1,
    timeoutMinutes: 60,
  };

  const approval = await hitlGateway.requestApproval(hitlRequest);

  if (approval.approved) {
    return {
      answer: approval.feedback ?? context.currentBestResult?.answer ?? '',
      confidence: 1.0, // Human-approved
      strategy: 'hitl',
      steps: [{ type: 'hitl', content: `Human approved. Feedback: ${approval.feedback ?? 'None'}`, confidence: 1.0 }],
      traceId: context.trace.id,
      metadata: { hitlApprovalId: approval.id, hitlApprover: approval.approverId },
    };
  }

  throw new ReasoningError('HITL review rejected the reasoning result', {
    hitlFeedback: approval.feedback,
    hitlApprovalId: approval.id,
  });
}
```

---

## 13. Configuration

### 13.1 Configuration Reference

| Config Key | Type | Default | Description |
|------------|------|---------|-------------|
| **General** | | | |
| `defaultTokenBudget` | Integer | `50000` | Total token budget for a reasoning operation |
| `confidenceThreshold` | Float | `0.95` | Score required to bypass manual HITL |
| `escalateOnLowConfidence` | Boolean | `true` | Whether to escalate to HITL when confidence is low |
| `maxRecursionDepth` | Integer | `5` | Maximum call stack depth for recursive reasoning |
| `minTokensPerStep` | Integer | `500` | Minimum token budget to attempt a reasoning step |
| **Chain-of-Thought** | | | |
| `cotMaxSteps` | Integer | `10` | Maximum reasoning steps |
| `cotModel` | String | `claude-3-5-sonnet` | Model for CoT reasoning |
| `cotTemperature` | Float | `0.2` | Temperature for CoT |
| `cotMaxTokensPerStep` | Integer | `1000` | Max tokens per step |
| **Tree-of-Thought** | | | |
| `totMaxBranches` | Integer | `3` | Branches per node |
| `totMaxDepth` | Integer | `5` | Maximum tree depth |
| `totBeamWidth` | Integer | `2` | Branches to keep per level |
| `totPruneThreshold` | Float | `0.3` | Minimum score to keep a branch |
| `totModel` | String | `claude-3-5-sonnet` | Model for ToT |
| `totTemperature` | Float | `0.7` | Temperature for branch generation |
| **Reflexion** | | | |
| `reflexionMaxIterations` | Integer | `3` | Maximum self-correction iterations |
| `reflexionModel` | String | `claude-3-5-sonnet` | Model for Reflexion |
| `reflexionEvalModel` | String | `claude-3-5-sonnet` | Model for self-evaluation |
| **ReAct** | | | |
| `reactMaxIterations` | Integer | `10` | Maximum think-act-observe loops |
| `reactModel` | String | `claude-3-5-sonnet` | Model for ReAct |
| `reactTemperature` | Float | `0.2` | Temperature for ReAct |
| `reactToolTimeoutMs` | Integer | `30000` | Tool execution timeout |
| `reactSandboxTools` | Boolean | `true` | Run tools in sandbox |
| **Self-Consistency** | | | |
| `scSampleCount` | Integer | `5` | Number of independent paths |
| `scTemperature` | Float | `0.7` | Temperature for diversity |
| `scModel` | String | `claude-3-5-sonnet` | Model for SC |
| **Verification** | | | |
| `verificationModel` | String | `gemini-2-0-ultra` | Model for truth verification |
| `verificationSandboxTimeout` | Duration | `30s` | Sandbox experiment timeout |
| `verificationEnabled` | Boolean | `true` | Enable verification layer |
| **Decomposition** | | | |
| `decompositionModel` | String | `claude-3-5-sonnet` | Model for decomposition |
| `decompositionMaxTasks` | Integer | `20` | Maximum subtasks |
| **Evaluation** | | | |
| `evaluatorModel` | String | `claude-3-5-sonnet` | Model for evaluation |
| `evaluationEnabled` | Boolean | `true` | Enable evaluation layer |
| `dimensionWeights` | Object | See §9.1 | Evaluation dimension weights |
| **Cache** | | | |
| `cacheEnabled` | Boolean | `true` | Enable reasoning cache |
| `cacheTTLSeconds` | Integer | `3600` | Cache TTL |
| `cacheMaxSize` | Integer | `10000` | Maximum cached entries |
| **Trace** | | | |
| `persistTraces` | Boolean | `true` | Persist traces to database |
| `emitEvents` | Boolean | `true` | Emit trace events |
| `truncateContentAt` | Integer | `5000` | Max chars stored per step |

### 13.2 Environment-Specific Configuration

```typescript
// @mcv/agentic-os/reasoning/config.ts

export const reasoningConfigs: Record<string, Partial<ReasoningConfig>> = {
  development: {
    confidenceThreshold: 0.8,
    persistTraces: true,
    cacheEnabled: false, // Fresh results during development
    defaultTokenBudget: 100000,
    verificationEnabled: true,
    escalateOnLowConfidence: false,
  },
  staging: {
    confidenceThreshold: 0.9,
    persistTraces: true,
    cacheEnabled: true,
    defaultTokenBudget: 75000,
    verificationEnabled: true,
    escalateOnLowConfidence: true,
  },
  production: {
    confidenceThreshold: 0.95,
    persistTraces: true,
    cacheEnabled: true,
    cacheTTLSeconds: 3600,
    defaultTokenBudget: 50000,
    verificationEnabled: true,
    escalateOnLowConfidence: true,
    cotModel: 'claude-3-5-sonnet',
    verificationModel: 'gemini-2-0-ultra',
  },
};
```

### 13.3 Per-Venture Configuration Overrides

```typescript
// Venture-specific overrides
export const ventureReasoningOverrides: Record<string, Partial<ReasoningConfig>> = {
  betedge: {
    // BetEdge requires higher confidence for financial operations
    confidenceThreshold: 0.98,
    domain: 'financial',
    evaluationDimensions: {
      ...defaultDimensions,
      correctness: 0.40, // Higher weight on correctness
      safety: 0.10,
    },
  },
  keyzii: {
    // Keyzii creative content generation needs more creative freedom
    cotTemperature: 0.4,
    totTemperature: 0.8,
    confidenceThreshold: 0.85,
    domain: 'creative',
  },
  voltzy: {
    // Voltzy EV operations need real-time reasoning
    cotMaxSteps: 5, // Fewer steps for speed
    reactMaxIterations: 5,
    defaultTokenBudget: 30000,
    domain: 'operations',
  },
};
```

---

## 14. Performance

### 14.1 Latency Targets

| Operation | Target | p50 | p95 | p99 |
|-----------|--------|-----|-----|-----|
| Simple CoT (3 steps) | < 2s | 1.2s | 2.1s | 3.5s |
| Compound CoT (5-8 steps) | < 5s | 3.1s | 5.2s | 7.8s |
| Tree-of-Thought (3×5) | < 8s | 5.4s | 8.1s | 12s |
| Reflexion (3 iterations) | < 10s | 6.8s | 10.5s | 15s |
| ReAct (5 iterations) | < 15s | 8.2s | 14s | 22s |
| Self-Consistency (5 samples) | < 8s | 5.5s | 8.3s | 12s |
| Task Decomposition | < 3s | 1.8s | 3.2s | 5s |
| Evaluation | < 2s | 1.1s | 2.3s | 3.8s |
| Verification | < 5s | 2.8s | 5.5s | 8s |

### 14.2 Streaming Partial Results

For long-running reasoning operations, partial results are streamed to the caller:

```typescript
// @mcv/agentic-os/reasoning/streaming.ts

export class ReasoningStream {
  private emitter = new EventEmitter();

  onStep(callback: (step: PartialReasoningStep) => void): void {
    this.emitter.on('step', callback);
  }

  onProgress(callback: (progress: ReasoningProgress) => void): void {
    this.emitter.on('progress', callback);
  }

  onComplete(callback: (result: ReasoningResult) => void): void {
    this.emitter.on('complete', callback);
  }

  emitStep(step: PartialReasoningStep): void {
    this.emitter.emit('step', step);
  }

  emitProgress(progress: ReasoningProgress): void {
    this.emitter.emit('progress', progress);
  }

  emitComplete(result: ReasoningResult): void {
    this.emitter.emit('complete', result);
  }
}

export interface ReasoningProgress {
  currentStep: number;
  totalExpectedSteps: number;
  currentStrategy: string;
  elapsedMs: number;
  tokensUsed: number;
  currentConfidence: number;
  status: 'reasoning' | 'evaluating' | 'verifying' | 'waiting_hitl';
}
```

### 14.3 Caching Strategy

The reasoning cache stores results for repeated or similar queries:

```typescript
// @mcv/agentic-os/reasoning/cache.ts

export class ReasoningCache {
  constructor(
    private readonly redis: Redis,
    private readonly config: CacheConfig,
  ) {}

  async get(problem: string, context: ReasoningContext): Promise<ReasoningResult | null> {
    if (!this.config.enabled) return null;

    const key = this.computeKey(problem, context);
    const cached = await this.redis.get(key);

    if (!cached) return null;

    const result = JSON.parse(cached) as ReasoningResult;

    // Check if cache entry is still valid
    if (this.isExpired(result)) {
      await this.redis.del(key);
      return null;
    }

    // Mark as cache hit
    result.metadata = { ...result.metadata, cacheHit: true };
    return result;
  }

  async set(
    problem: string,
    context: ReasoningContext,
    result: ReasoningResult,
  ): Promise<void> {
    if (!this.config.enabled) return;
    if (result.confidence < this.config.minConfidenceForCache ?? 0.9) return;

    const key = this.computeKey(problem, context);
    await this.redis.setex(key, this.config.ttlSeconds, JSON.stringify(result));
  }

  private computeKey(problem: string, context: ReasoningContext): string {
    // Hash the problem + relevant context fields
    const input = `${problem}:${context.ventureId ?? ''}:${context.domain ?? ''}`;
    const hash = crypto.createHash('sha256').update(input).digest('hex').substring(0, 16);
    return `reasoning:cache:${hash}`;
  }

  private isExpired(result: ReasoningResult): boolean {
    if (!result.metadata?.cachedAt) return true;
    const age = Date.now() - new Date(result.metadata.cachedAt).getTime();
    return age > (this.config.ttlSeconds * 1000);
  }
}
```

---

## 15. Observability

### 15.1 Metrics

The Reasoning Engine exports Prometheus metrics:

| Metric | Type | Labels | Description |
|--------|------|--------|-------------|
| `reasoning_operations_total` | Counter | strategy, status, venture | Total reasoning operations |
| `reasoning_duration_ms` | Histogram | strategy, venture | Operation duration |
| `reasoning_confidence` | Histogram | strategy, venture | Final confidence scores |
| `reasoning_tokens_total` | Counter | strategy, model, venture | Total tokens consumed |
| `reasoning_cost_usd` | Counter | strategy, model, venture | Total cost in USD |
| `reasoning_steps_total` | Counter | strategy, step_type | Total reasoning steps |
| `reasoning_cache_hits_total` | Counter | venture | Cache hit count |
| `reasoning_cache_misses_total` | Counter | venture | Cache miss count |
| `reasoning_hitl_escalations_total` | Counter | strategy, reason, venture | HITL escalation count |
| `reasoning_verification_pass_rate` | Gauge | strategy, venture | Verification pass rate |
| `reasoning_evaluation_scores` | Histogram | dimension, strategy | Per-dimension scores |
| `reasoning_template_usage_total` | Counter | template_id, category | Template usage count |
| `reasoning_decomposition_task_count` | Histogram | venture | Tasks per decomposition |

### 15.2 Trace Visualization

The `ReasoningTraceViewer` React component provides an interactive UI for exploring reasoning traces:

```typescript
// @mcv/agentic-os/client/components/reasoning-trace-viewer.tsx

export interface ReasoningTraceViewerProps {
  traceId: string;
  autoRefresh?: boolean;
  showTokenCosts?: boolean;
  showTimeline?: boolean;
  collapsible?: boolean;
}

export function ReasoningTraceViewer({
  traceId,
  autoRefresh = false,
  showTokenCosts = true,
  showTimeline = true,
  collapsible = true,
}: ReasoningTraceViewerProps) {
  const { trace, isLoading } = useReasoningTrace(traceId, { autoRefresh });

  if (isLoading) return <TraceSkeleton />;
  if (!trace) return <TraceNotFound />;

  return (
    <div className="reasoning-trace-viewer">
      {/* Header: strategy, status, confidence, timing */}
      <TraceHeader trace={trace} showTokenCosts={showTokenCosts} />

      {/* Timeline view */}
      {showTimeline && <TraceTimeline steps={trace.steps} />}

      {/* Step-by-step view */}
      <TraceStepList
        steps={trace.steps}
        collapsible={collapsible}
        renderStep={(step) => (
          <TraceStepCard
            step={step}
            showLLMDetails={showTokenCosts}
            showToolDetails={step.type === 'tool_call'}
          />
        )}
      />

      {/* Tree visualization (for ToT) */}
      {trace.strategy === 'tree-of-thought' && trace.metadata?.treeStructure && (
        <ThoughtTreeVisualization tree={trace.metadata.treeStructure} />
      )}

      {/* Evaluation results */}
      {trace.evaluation && (
        <EvaluationPanel evaluation={trace.evaluation} />
      )}

      {/* Verification results */}
      {trace.verification && (
        <VerificationPanel verification={trace.verification} />
      )}
    </div>
  );
}
```

### 15.3 Grafana Dashboards

Pre-built Grafana dashboards are provided:

1. **Reasoning Overview** — Total operations, success rate, latency distribution, cost breakdown
2. **Strategy Analysis** — Per-strategy metrics, confidence distributions, token usage
3. **Quality Metrics** — Evaluation scores over time, factual grounding rates, consistency scores
4. **Template Performance** — Template usage, success rates, average confidence per template
5. **HITL Integration** — Escalation rates, approval times, human override frequency
6. **Cost Management** — Token consumption, cost per operation, cost trends by venture

---

## 16. Security

### 16.1 Reasoning Sandboxing

To prevent "Chain of Thought" prompt injection or logic manipulation:

1. **Input Sanitization:** All user intents are pre-processed by the Shield Pod to strip malicious instructions, encoded payloads, and adversarial prompt patterns.

2. **Stateless Execution:** Each reasoning loop starts from a clean environment derived from Working Memory. No persistent state is carried between invocations that could be manipulated.

3. **Output Validation:** All reasoning outputs are validated against expected schemas before being passed to consumers. Structured outputs are validated with Zod schemas.

4. **Auditability:** Every step of the reasoning trace is stored in Episodic Memory with a cryptographically signed hash, enabling tamper detection.

5. **Tool Sandboxing:** All tool executions within ReAct loops are sandboxed. Code execution happens in E2B sandboxes with resource limits. Network access is restricted to approved endpoints.

### 16.2 Prompt Injection Defense

```typescript
// @mcv/agentic-os/reasoning/security/injection-defense.ts

export class InjectionDefense {
  private readonly patterns: RegExp[] = [
    /ignore\s+(previous|all|above)\s+(instructions|prompts)/i,
    /you\s+are\s+now\s+a/i,
    /system\s*:\s*/i,
    /\[INST\]/i,
    /<\|im_start\|>/i,
    /```system/i,
    /override\s+safety/i,
    /bypass\s+(filter|safety|guard)/i,
  ];

  sanitize(input: string): { sanitized: string; flagged: boolean; flags: string[] } {
    const flags: string[] = [];

    for (const pattern of this.patterns) {
      if (pattern.test(input)) {
        flags.push(`Matched injection pattern: ${pattern.source}`);
      }
    }

    // Remove potential control characters
    let sanitized = input.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');

    // Escape potential prompt delimiters
    sanitized = sanitized.replace(/```/g, '\\`\\`\\`');

    return {
      sanitized,
      flagged: flags.length > 0,
      flags,
    };
  }
}
```

### 16.3 Output Validation

```typescript
// @mcv/agentic-os/reasoning/security/output-validation.ts

export class OutputValidator {
  async validate(
    output: string,
    context: ReasoningContext,
  ): Promise<ValidationResult> {
    const issues: ValidationIssue[] = [];

    // Check for PII leakage
    const piiCheck = await this.checkPII(output);
    if (piiCheck.found) {
      issues.push({
        severity: 'critical',
        type: 'pii_leakage',
        description: `PII detected: ${piiCheck.types.join(', ')}`,
      });
    }

    // Check for credential leakage
    const credCheck = this.checkCredentials(output);
    if (credCheck.found) {
      issues.push({
        severity: 'critical',
        type: 'credential_leakage',
        description: 'Potential credentials detected in output',
      });
    }

    // Check for harmful content
    const harmCheck = await this.checkHarmfulContent(output);
    if (harmCheck.isHarmful) {
      issues.push({
        severity: 'critical',
        type: 'harmful_content',
        description: harmCheck.reason,
      });
    }

    return {
      valid: issues.filter(i => i.severity === 'critical').length === 0,
      issues,
    };
  }

  private checkCredentials(output: string): { found: boolean; types: string[] } {
    const patterns = [
      { type: 'api_key', pattern: /[a-zA-Z0-9_-]{32,}/ },
      { type: 'jwt', pattern: /eyJ[a-zA-Z0-9_-]+\.eyJ[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+/ },
      { type: 'password', pattern: /password\s*[:=]\s*["'][^"']+["']/i },
      { type: 'secret', pattern: /secret\s*[:=]\s*["'][^"']+["']/i },
    ];

    const found: string[] = [];
    for (const { type, pattern } of patterns) {
      if (pattern.test(output)) found.push(type);
    }

    return { found: found.length > 0, types: found };
  }
}
```

### 16.4 Rate Limiting & Resource Controls

```typescript
// Per-agent reasoning rate limits
export const reasoningRateLimits: Record<string, RateLimit> = {
  queen: {
    maxOperationsPerMinute: 30,
    maxTokensPerMinute: 500000,
    maxCostPerHourUsd: 50.0,
  },
  ralph_pod: {
    maxOperationsPerMinute: 60,
    maxTokensPerMinute: 300000,
    maxCostPerHourUsd: 30.0,
  },
  scout: {
    maxOperationsPerMinute: 10,
    maxTokensPerMinute: 50000,
    maxCostPerHourUsd: 5.0,
  },
  genesis: {
    maxOperationsPerMinute: 5,
    maxTokensPerMinute: 200000,
    maxCostPerHourUsd: 20.0,
  },
};
```

---

## 17. Testing

### 17.1 Unit Tests

```typescript
// @mcv/agentic-os/reasoning/__tests__/chain-of-thought.test.ts

describe('ChainOfThought', () => {
  let cot: ChainOfThought;
  let mockGateway: MockLLMGateway;
  let mockPrompts: MockPromptBank;

  beforeEach(() => {
    mockGateway = new MockLLMGateway();
    mockPrompts = new MockPromptBank();
    cot = new ChainOfThought(mockGateway, mockPrompts);
  });

  describe('reason()', () => {
    it('should produce a result with confidence score', async () => {
      mockGateway.setResponse('Step 1: Analyze...\n[FINAL_ANSWER] 42');

      const result = await cot.reason('What is 6 * 7?', createTestContext());

      expect(result.answer).toContain('42');
      expect(result.confidence).toBeGreaterThan(0);
      expect(result.steps.length).toBeGreaterThan(0);
    });

    it('should handle stuck reasoning by retrieving additional context', async () => {
      mockGateway.setResponses([
        'Step 1: I need more information...\n[NEED_MORE_INFO]',
        'Step 2: With the additional context, the answer is X.\n[FINAL_ANSWER] X',
      ]);

      const result = await cot.reason('Complex query', createTestContext({
        memory: createMockMemory([{ content: 'Relevant context' }]),
      }));

      expect(result.steps.length).toBe(2);
    });

    it('should respect maxSteps limit', async () => {
      mockGateway.setResponse('Step: Thinking...');

      const result = await cot.reason('Problem', createTestContext(), { maxSteps: 3 });

      expect(result.steps.length).toBeLessThanOrEqual(3);
    });

    it('should calculate chain confidence with step weighting', async () => {
      mockGateway.setResponses([
        'Step 1: Initial analysis',
        'Step 2: Deeper analysis',
        'Step 3: Final answer\n[FINAL_ANSWER] result',
      ]);

      const result = await cot.reason('Problem', createTestContext());

      // Later steps should have more weight
      expect(result.confidence).toBeGreaterThan(0);
      expect(result.confidence).toBeLessThanOrEqual(1);
    });
  });
});
```

### 17.2 Integration Tests

```typescript
// @mcv/agentic-os/reasoning/__tests__/integration/engine.test.ts

describe('ReasoningEngine Integration', () => {
  let engine: ReasoningEngine;
  let testDB: TestDatabase;

  beforeAll(async () => {
    testDB = await TestDatabase.create();
    engine = await createTestReasoningEngine(testDB);
  });

  afterAll(async () => {
    await testDB.cleanup();
  });

  it('should auto-select CoT for simple problems', async () => {
    const result = await engine.reason('What is 2 + 2?');

    expect(result.strategy).toBe('chain-of-thought');
    expect(result.confidence).toBeGreaterThan(0.9);
  });

  it('should auto-select ToT for complex design problems', async () => {
    const result = await engine.reason(
      'Design a microservices architecture for a real-time bidding system',
      { domain: 'design' },
    );

    expect(result.strategy).toBe('tree-of-thought');
    expect(result.metadata?.totalNodesExplored).toBeGreaterThan(1);
  });

  it('should persist traces to database', async () => {
    const result = await engine.reason('Simple problem');

    const trace = await testDB.query(reasoningTraces)
      .where(eq(reasoningTraces.id, result.traceId))
      .first();

    expect(trace).toBeDefined();
    expect(trace.status).toBe('success');
  });

  it('should use cache for repeated queries', async () => {
    const result1 = await engine.reason('Repeated problem');
    const result2 = await engine.reason('Repeated problem');

    expect(result2.metadata?.cacheHit).toBe(true);
  });

  it('should execute templates for matching problems', async () => {
    const result = await engine.reason(
      'Review this code: function add(a, b) { return a + b; }',
      { domain: 'code' },
    );

    expect(result.metadata?.templateId).toBeDefined();
  });
});
```

### 17.3 Benchmark Tests

```typescript
// @mcv/agentic-os/reasoning/__tests__/benchmarks/latency.bench.ts

describe('Reasoning Latency Benchmarks', () => {
  it('CoT simple (3 steps) should complete under 3s', async () => {
    const start = Date.now();
    await engine.reason('Simple math: what is 15 * 23?');
    const elapsed = Date.now() - start;

    expect(elapsed).toBeLessThan(3000);
  });

  it('ToT (3 branches × 5 depth) should complete under 10s', async () => {
    const start = Date.now();
    await engine.reasonWithStrategy('tree-of-thought', 'Design a caching strategy');
    const elapsed = Date.now() - start;

    expect(elapsed).toBeLessThan(10000);
  });

  it('Decomposition should complete under 3s', async () => {
    const start = Date.now();
    await engine.decompose('Build a complete user authentication system');
    const elapsed = Date.now() - start;

    expect(elapsed).toBeLessThan(3000);
  });
});
```

### 17.4 Evaluation Benchmarks

```typescript
// @mcv/agentic-os/reasoning/__tests__/benchmarks/quality.bench.ts

describe('Reasoning Quality Benchmarks', () => {
  const testCases: QualityTestCase[] = [
    {
      problem: 'What is the time complexity of quicksort?',
      expectedAnswer: /O\(n\s*log\s*n\)/i,
      category: 'factual',
    },
    {
      problem: 'Write a function to reverse a linked list',
      validator: (answer) => answer.includes('next') && answer.includes('prev'),
      category: 'code',
    },
    // ... 50+ test cases
  ];

  it('should achieve >95% accuracy on factual questions', async () => {
    const factualCases = testCases.filter(c => c.category === 'factual');
    let correct = 0;

    for (const tc of factualCases) {
      const result = await engine.reason(tc.problem);
      if (tc.expectedAnswer instanceof RegExp) {
        if (tc.expectedAnswer.test(result.answer)) correct++;
      }
    }

    expect(correct / factualCases.length).toBeGreaterThan(0.95);
  });
});
```

---

## 18. TypeScript Interfaces

### 18.1 Core Types

```typescript
// @mcv/agentic-os/reasoning/types.ts

export type ConfidenceScore = number; // 0.0 to 1.0

export type ReasoningStrategyName =
  | 'chain-of-thought'
  | 'tree-of-thought'
  | 'reflexion'
  | 'react'
  | 'self-consistency'
  | 'analogical'
  | 'counterfactual'
  | 'structured-output'
  | 'template'
  | 'hitl';

export interface ReasoningResult {
  answer: string;
  confidence: ConfidenceScore;
  strategy: ReasoningStrategyName;
  steps: ReasoningStep[];
  traceId: string;
  evaluation?: EvaluationResult;
  verification?: VerificationResult;
  requiresHITL?: boolean;
  hitlReason?: string;
  metadata: Record<string, any>;
}

export interface ReasoningStep {
  type: StepType;
  content: string;
  confidence: ConfidenceScore;
  tokenUsage?: TokenUsage;
  latencyMs?: number;
  metadata?: Record<string, any>;
}

export interface ReasoningContext {
  problem: string;
  callerId: string;
  ventureId?: string;
  domain?: string;
  relevantContext: string;
  availableInstruments?: Instrument[];
  agentCapabilities?: string[];
  outputSchema?: z.ZodSchema;
  config: ReasoningConfig;
  memory: MemoryStore;
  trace: TraceContext;
  remainingTokenBudget: number;
  parentTraceId?: string;
  priority?: 'low' | 'medium' | 'high' | 'critical';
  currentBestResult?: ReasoningResult;
  currentStrategy?: string;
  skipMemory?: boolean;
  contextLimit?: number;
}

export interface ReasoningConfig {
  // General
  defaultTokenBudget: number;
  confidenceThreshold: number;
  escalateOnLowConfidence: boolean;
  maxRecursionDepth: number;
  minTokensPerStep: number;

  // Chain-of-Thought
  cotMaxSteps: number;
  cotModel: string;
  cotTemperature: number;
  cotMaxTokensPerStep: number;

  // Tree-of-Thought
  totMaxBranches: number;
  totMaxDepth: number;
  totBeamWidth: number;
  totPruneThreshold: number;
  totModel: string;
  totTemperature: number;

  // Reflexion
  reflexionMaxIterations: number;
  reflexionModel: string;
  reflexionEvalModel: string;

  // ReAct
  reactMaxIterations: number;
  reactModel: string;
  reactTemperature: number;
  reactToolTimeoutMs: number;
  reactSandboxTools: boolean;

  // Self-Consistency
  scSampleCount: number;
  scTemperature: number;
  scModel: string;

  // Verification
  verificationModel: string;
  verificationSandboxTimeout: number;
  verificationEnabled: boolean;

  // Decomposition
  decompositionModel: string;
  decompositionMaxTasks: number;

  // Evaluation
  evaluatorModel: string;
  evaluationEnabled: boolean;
  evaluationCriteria: string[];
  dimensionWeights: Record<string, number>;

  // Cache
  cacheEnabled: boolean;
  cacheTTLSeconds: number;
  cacheMaxSize: number;

  // Trace
  persistTraces: boolean;
  emitEvents: boolean;
  truncateContentAt: number;

  // Domain
  domain: string;
  domainCalibration: Record<string, number>;
}

export interface TokenUsage {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  costUsd?: number;
}

export interface EvaluationResult {
  score: number;
  calibratedConfidence: number;
  quality: QualityEvaluation;
  factualGrounding: FactualGroundingResult;
  consistency: ConsistencyResult;
  safety: SafetyResult;
  criteria: { criterion: string; score: number; feedback: string }[];
  evaluatorModel: string;
  latencyMs: number;
  metadata: Record<string, any>;
}

export interface VerificationResult {
  passed: boolean;
  confidence: ConfidenceScore;
  assertions: {
    claim: string;
    proof: string;
    verified: boolean;
  }[];
  experiments?: {
    code: string;
    output: string;
    exitCode: number;
  }[];
  metadata: Record<string, any>;
}

export interface TaskDecomposition {
  originalIntent: string;
  complexity: ComplexityAssessment;
  tasks: DecompositionTask[];
  parallelGroups: ParallelGroup[];
  riskAssessment: RiskAssessment;
  totalEstimatedTokens: number;
  totalEstimatedMinutes: number;
  metadata: Record<string, any>;
}

export interface DecompositionTask {
  id: string;
  title: string;
  description: string;
  type: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  dependencies: string[];
  targetPod: string;
  acceptanceCriteria: string[];
  estimatedTokens?: number;
  estimatedMinutes?: number;
  recommendedModel?: string;
}

export interface ParallelGroup {
  index: number;
  taskIds: string[];
  estimatedMinutes: number;
  canParallelize: boolean;
}

export interface RiskAssessment {
  level: 'low' | 'medium' | 'high' | 'critical';
  risks: Risk[];
  requiresHITL: boolean;
  mitigationStrategy: string;
}

export interface Risk {
  id: string;
  description: string;
  probability: number;
  impact: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
  mitigation: string;
}

export interface ThoughtNode {
  id: string;
  depth: number;
  thought: string;
  score: number;
  children: ThoughtNode[];
  parent?: ThoughtNode;
  isLeaf: boolean;
  metadata: Record<string, any>;
}

export interface ThoughtStep {
  index: number;
  thought: string;
  tokenUsage?: TokenUsage;
  latencyMs?: number;
  confidence: number;
  isFinal: boolean;
  needsInfo: boolean;
  isStuck: boolean;
}

export interface RalphBlueprint {
  id: string;
  intent: string;
  ventureId: string;
  classification: IntentClassification;
  specification: FunctionalSpec;
  acceptanceCriteria: AcceptanceCriterion[];
  riskAssessment: RiskAssessment;
  verificationExperiments: VerificationExperiment[];
  resourceEstimates: ResourceEstimate;
  technicalContext: string;
  createdAt: Date;
  traceId: string;
}

export interface IntentClassification {
  category: 'feature' | 'bugfix' | 'analysis' | 'migration' | 'refactor' | 'documentation' | 'infrastructure';
  confidence: number;
  reasoning: string;
}

export interface QualityEvaluation {
  correctness: number;
  correctnessFeedback: string;
  completeness: number;
  completenessFeedback: string;
  clarity: number;
  clarityFeedback: string;
  efficiency: number;
  efficiencyFeedback: string;
}
```

---

## 19. Usage Examples

### 19.1 Basic Chain-of-Thought Reasoning

```typescript
import { ReasoningEngine } from '@mcv/agentic-os/reasoning';

const engine = new ReasoningEngine(/* ... */);

// Simple reasoning
const result = await engine.reason(
  'What are the three main benefits of using TypeScript over JavaScript?',
);

console.log(result.answer);       // Detailed answer
console.log(result.confidence);   // 0.95
console.log(result.strategy);     // 'chain-of-thought'
console.log(result.steps.length); // 4
```

### 19.2 Forced Strategy Selection

```typescript
// Force Tree-of-Thought for a design problem
const result = await engine.reasonWithStrategy(
  'tree-of-thought',
  'Design a rate limiting system for our API gateway that supports per-user, per-IP, and global limits.',
);

console.log(result.metadata?.totalNodesExplored);  // 15
console.log(result.metadata?.alternativePaths);     // 2 alternative solutions
```

### 19.3 Task Decomposition

```typescript
// Decompose a complex task
const decomposition = await engine.decompose(
  'Build a complete user authentication system with email/password, OAuth2 (Google, GitHub), MFA (TOTP, SMS), password reset, and session management.',
  { ventureId: 'betedge', domain: 'development' },
);

console.log(decomposition.tasks.length);           // 8
console.log(decomposition.parallelGroups.length);  // 4
console.log(decomposition.riskAssessment.level);   // 'medium'
console.log(decomposition.totalEstimatedTokens);   // 45000
```

### 19.4 Genesis Engine Blueprint

```typescript
import { GenesisEngine } from '@mcv/agentic-os/reasoning';

const genesis = new GenesisEngine(/* ... */);

const { blueprint, trace } = await genesis.generateBlueprint(
  'Add a loyalty points system to BetEdge where users earn points for placing bets and can redeem them for bonuses.',
  'betedge',
);

console.log(blueprint.specification.summary);
console.log(blueprint.acceptanceCriteria.length);  // 12
console.log(blueprint.riskAssessment.level);       // 'medium'
console.log(blueprint.verificationExperiments.length);  // 5
```

### 19.5 ReAct Loop with Tools

```typescript
// ReAct reasoning with tool access
const result = await engine.reasonWithStrategy('react', 
  'Find the current price of Bitcoin and compare it with the price from 24 hours ago. Calculate the percentage change.',
  {
    availableInstruments: [
      cryptoPriceTool,
      calculatorTool,
    ],
  },
);

// The engine will:
// 1. Think: I need to get the current BTC price
// 2. Act: Call cryptoPriceTool({ symbol: 'BTC' })
// 3. Observe: Current price: $43,250
// 4. Think: Now I need the price from 24h ago
// 5. Act: Call cryptoPriceTool({ symbol: 'BTC', timeframe: '24h_ago' })
// 6. Observe: 24h ago price: $42,100
// 7. Think: Calculate the percentage change
// 8. Act: Call calculatorTool({ expression: '((43250 - 42100) / 42100) * 100' })
// 9. Observe: 2.73%
// 10. Think: I have the answer
// 11. Finish: "Bitcoin is currently at $43,250, up 2.73% from $42,100 24 hours ago."
```

### 19.6 Template-Based Reasoning

```typescript
// Use a reasoning template for code review
const result = await engine.executeTemplate(
  codeReviewTemplate,
  {
    code: `
      async function processPayment(userId: string, amount: number) {
        const user = await db.users.findOne({ id: userId });
        if (user.balance >= amount) {
          user.balance -= amount;
          await db.users.save(user);
          return { success: true };
        }
        return { success: false, error: 'Insufficient balance' };
      }
    `,
    title: 'Add payment processing',
    language: 'typescript',
  },
);

console.log(result.metadata?.templateName);  // 'Code Review'
// Result will flag: race condition (no transaction), no input validation, no error handling
```

### 19.7 Streaming Reasoning

```typescript
// Stream reasoning results in real-time
const stream = new ReasoningStream();

stream.onStep((step) => {
  console.log(`Step ${step.index}: ${step.content.substring(0, 100)}...`);
});

stream.onProgress((progress) => {
  console.log(`Progress: ${progress.currentStep}/${progress.totalExpectedSteps} (${progress.status})`);
});

stream.onComplete((result) => {
  console.log(`Complete! Confidence: ${result.confidence}`);
});

await engine.reason('Complex problem...', { stream });
```

---

## 20. Database Schema

### 20.1 Migration: Create Tables

```sql
-- Migration: 001_create_reasoning_tables.sql

CREATE TYPE reasoning_trace_status AS ENUM (
  'running', 'success', 'failed', 'cancelled', 'timeout',
  'cache_hit', 'success_after_correction'
);

CREATE TYPE reasoning_trace_type AS ENUM (
  'reasoning', 'genesis', 'decomposition', 'verification', 'template'
);

CREATE TYPE reasoning_step_type AS ENUM (
  'thought', 'tool_call', 'evaluation', 'verification', 'decomposition',
  'synthesis', 'branch', 'prune', 'critique', 'correction',
  'analogy_search', 'analogy_mapping', 'solution_transfer',
  'solution_adaptation', 'counterfactual_scenario', 'baseline'
);

CREATE TYPE reasoning_strategy AS ENUM (
  'chain-of-thought', 'tree-of-thought', 'reflexion', 'react',
  'self-consistency', 'analogical', 'counterfactual', 'structured-output'
);

CREATE TABLE reasoning_traces (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_trace_id UUID REFERENCES reasoning_traces(id),
  type reasoning_trace_type NOT NULL,
  status reasoning_trace_status NOT NULL DEFAULT 'running',
  problem TEXT NOT NULL,
  caller_id VARCHAR(255) NOT NULL,
  venture_id VARCHAR(50),
  domain VARCHAR(100),
  strategy reasoning_strategy,
  strategy_reason TEXT,
  config JSONB,
  answer TEXT,
  confidence REAL DEFAULT 0,
  prompt_tokens INTEGER DEFAULT 0,
  completion_tokens INTEGER DEFAULT 0,
  total_tokens INTEGER DEFAULT 0,
  cost_usd REAL DEFAULT 0,
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  total_latency_ms INTEGER DEFAULT 0,
  metadata JSONB
);

CREATE INDEX idx_reasoning_traces_status ON reasoning_traces(status);
CREATE INDEX idx_reasoning_traces_caller ON reasoning_traces(caller_id);
CREATE INDEX idx_reasoning_traces_venture ON reasoning_traces(venture_id);
CREATE INDEX idx_reasoning_traces_strategy ON reasoning_traces(strategy);
CREATE INDEX idx_reasoning_traces_started_at ON reasoning_traces(started_at);
CREATE INDEX idx_reasoning_traces_parent ON reasoning_traces(parent_trace_id);

CREATE TABLE reasoning_steps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trace_id UUID NOT NULL REFERENCES reasoning_traces(id) ON DELETE CASCADE,
  parent_step_id UUID REFERENCES reasoning_steps(id),
  type reasoning_step_type NOT NULL,
  name VARCHAR(255) NOT NULL,
  step_index INTEGER NOT NULL,
  input TEXT,
  output TEXT,
  llm_model VARCHAR(100),
  llm_prompt_tokens INTEGER,
  llm_completion_tokens INTEGER,
  llm_temperature REAL,
  llm_latency_ms INTEGER,
  tool_name VARCHAR(255),
  tool_params JSONB,
  tool_result JSONB,
  tool_latency_ms INTEGER,
  confidence REAL DEFAULT 0,
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  duration_ms INTEGER DEFAULT 0,
  metadata JSONB
);

CREATE INDEX idx_reasoning_steps_trace ON reasoning_steps(trace_id);
CREATE INDEX idx_reasoning_steps_parent ON reasoning_steps(parent_step_id);
CREATE INDEX idx_reasoning_steps_type ON reasoning_steps(type);

CREATE TABLE trace_evaluations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trace_id UUID NOT NULL REFERENCES reasoning_traces(id) ON DELETE CASCADE,
  overall_score REAL NOT NULL,
  criteria JSONB,
  factual_grounding_score REAL,
  factual_grounding_details JSONB,
  consistency_score REAL,
  consistency_details JSONB,
  evaluator_model VARCHAR(100),
  evaluation_latency_ms INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  metadata JSONB
);

CREATE INDEX idx_trace_evaluations_trace ON trace_evaluations(trace_id);
CREATE INDEX idx_trace_evaluations_score ON trace_evaluations(overall_score);

CREATE TABLE reasoning_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL UNIQUE,
  description TEXT NOT NULL,
  category VARCHAR(100) NOT NULL,
  version INTEGER NOT NULL DEFAULT 1,
  strategy reasoning_strategy NOT NULL,
  prompt_template_id VARCHAR(255),
  steps JSONB,
  config JSONB,
  input_schema JSONB,
  output_schema JSONB,
  avg_confidence REAL,
  usage_count INTEGER DEFAULT 0,
  success_rate REAL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  metadata JSONB
);

CREATE INDEX idx_reasoning_templates_category ON reasoning_templates(category);
CREATE INDEX idx_reasoning_templates_strategy ON reasoning_templates(strategy);
CREATE INDEX idx_reasoning_templates_active ON reasoning_templates(is_active);
```

---

## 21. Error Handling

### 21.1 Error Types

```typescript
// @mcv/agentic-os/reasoning/errors.ts

export class ReasoningError extends Error {
  constructor(
    message: string,
    public readonly details?: {
      cause?: Error;
      problem?: string;
      context?: string;
      strategy?: string;
      traceId?: string;
      hitlFeedback?: string;
      hitlApprovalId?: string;
    },
  ) {
    super(message);
    this.name = 'ReasoningError';
  }
}

export class DecompositionError extends ReasoningError {
  constructor(message: string) {
    super(message);
    this.name = 'DecompositionError';
  }
}

export class VerificationError extends ReasoningError {
  constructor(
    message: string,
    public readonly failedAssertions: string[],
  ) {
    super(message);
    this.name = 'VerificationError';
  }
}

export class GenesisError extends ReasoningError {
  constructor(message: string, details?: any) {
    super(message, details);
    this.name = 'GenesisError';
  }
}

export class TokenBudgetExhaustedError extends ReasoningError {
  constructor(
    public readonly usedTokens: number,
    public readonly budgetTokens: number,
  ) {
    super(`Token budget exhausted: used ${usedTokens} of ${budgetTokens} tokens`);
    this.name = 'TokenBudgetExhaustedError';
  }
}

export class RecursionDepthExceededError extends ReasoningError {
  constructor(
    public readonly currentDepth: number,
    public readonly maxDepth: number,
  ) {
    super(`Recursion depth exceeded: ${currentDepth} >= ${maxDepth}`);
    this.name = 'RecursionDepthExceededError';
  }
}

export class StrategyNotFoundError extends ReasoningError {
  constructor(strategyName: string) {
    super(`Unknown reasoning strategy: ${strategyName}`);
    this.name = 'StrategyNotFoundError';
  }
}
```

### 21.2 Error Recovery

```typescript
// Error recovery strategies
export const errorRecoveryStrategies: Record<string, ErrorRecoveryStrategy> = {
  token_budget_exhausted: {
    action: 'reduce_and_retry',
    handler: async (error, context) => {
      // Reduce scope and retry with smaller token budget
      const reducedProblem = await summarize(context.problem, { maxTokens: 500 });
      return engine.reason(reducedProblem, {
        ...context,
        remainingTokenBudget: context.config.defaultTokenBudget * 0.5,
      });
    },
  },
  recursion_depth_exceeded: {
    action: 'escalate_to_hitl',
    handler: async (error, context) => {
      return escalateToHITL(context.problem, context, 'max_recursion_reached');
    },
  },
  model_rate_limited: {
    action: 'fallback_model',
    handler: async (error, context) => {
      return engine.reason(context.problem, {
        ...context,
        config: { ...context.config, cotModel: 'gpt-4o' }, // Fallback model
      });
    },
  },
  verification_failed: {
    action: 'retry_with_reflexion',
    handler: async (error, context) => {
      return engine.reasonWithStrategy('reflexion', context.problem, context);
    },
  },
};
```

---

## 22. Migration & Versioning

### 22.1 Reasoning Strategy Versioning

Each reasoning strategy is versioned independently. Prompt templates include version suffixes (e.g., `cot_standard_v2`, `tot_generate_branches_v3`) to enable gradual rollout and A/B testing of improved reasoning approaches.

| Strategy | Current Version | Changelog |
|----------|----------------|-----------|
| Chain-of-Thought | v2 | Added stuck detection and context retrieval |
| Tree-of-Thought | v2 | Improved beam search with adaptive pruning |
| Reflexion | v1 | Initial release |
| ReAct | v2 | Added tool safety checks and sandboxing |
| Self-Consistency | v1 | Initial release |
| Analogical | v1 | Initial release |
| Counterfactual | v1 | Initial release |

### 22.2 Database Migrations

All schema changes are managed through Drizzle ORM migrations in `@mcv/agentic-os/reasoning/migrations/`. The migration naming convention is `NNNN_description.sql` (e.g., `0001_create_reasoning_tables.sql`, `0002_add_template_versioning.sql`).

### 22.3 Configuration Migration

When configuration keys are renamed or restructured, a migration helper ensures backward compatibility:

```typescript
// @mcv/agentic-os/reasoning/config-migration.ts

export function migrateConfig(config: Record<string, any>): ReasoningConfig {
  const migrated = { ...config };

  // v2 → v3: renamed keys
  if ('maxRecursion' in migrated) {
    migrated.maxRecursionDepth = migrated.maxRecursion;
    delete migrated.maxRecursion;
  }

  if ('cotSteps' in migrated) {
    migrated.cotMaxSteps = migrated.cotSteps;
    delete migrated.cotSteps;
  }

  return migrated as ReasoningConfig;
}
```

---

## 23. Audit Events

Every significant action in the Reasoning module emits an audit event for compliance and debugging:

| Event Code | Name | Data Captured |
|------------|------|---------------|
| `REA_001` | Task Decomposed | Original intent, task graph, risk level, estimated tokens |
| `REA_002` | Verification Failed | Assertions failed, experiment output, trace ID |
| `REA_003` | Recursion Limit Reached | Current stack trace, task ID, depth |
| `REA_004` | Genesis Blueprint Created | Blueprint hash, context sources, venture ID |
| `REA_005` | HITL Escalation Triggered | Problem, confidence, reason, trace ID |
| `REA_006` | Strategy Selected | Problem hash, strategy, reason, complexity |
| `REA_007` | Reasoning Completed | Trace ID, strategy, confidence, token usage, cost |
| `REA_008` | Template Executed | Template ID, input hash, confidence, latency |
| `REA_009` | Cache Hit | Problem hash, cached trace ID, age |
| `REA_010` | Security Violation | Injection attempt, sanitization result, caller ID |
| `REA_011` | Token Budget Exhausted | Used tokens, budget, trace ID |
| `REA_012` | Output Validation Failed | Validation issues, severity, trace ID |

```typescript
// Audit event emission
import { auditLog } from '@mcv/kernel';

auditLog.emit({
  code: 'REA_007',
  name: 'Reasoning Completed',
  module: '@mcv/agentic-os/reasoning',
  severity: 'info',
  data: {
    traceId: result.traceId,
    strategy: result.strategy,
    confidence: result.confidence,
    totalTokens: result.metadata.totalTokens,
    costUsd: result.metadata.costUsd,
    latencyMs: result.metadata.totalLatencyMs,
    status: result.confidence >= config.confidenceThreshold ? 'pass' : 'low_confidence',
  },
  ventureId: context.ventureId,
  userId: context.callerId,
  timestamp: new Date(),
});
```

---

## 24. Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| `@mcv/kernel` | `^1.0.0` | Logging, context, error primitives, audit events |
| `@mcv/gateway` | `^1.0.0` | Strategic LLM routing, model selection, rate limiting |
| `@mcv/agentic-os/memory` | `^1.0.0` | Context retrieval, knowledge graph, semantic search |
| `@mcv/agentic-os/prompts` | `^1.0.0` | Prompt template rendering, versioning |
| `@mcv/agentic-os/hitl` | `^1.0.0` | Human-in-the-loop escalation and approval |
| `@mcv/agentic-os/naos` | `^1.0.0` | Agent context, instruments, capability enforcement |
| `xstate` | `^5.0.0` | State machine management for reasoning flows |
| `drizzle-orm` | `^0.30.0` | Database ORM for trace persistence |
| `zod` | `^3.22.0` | Schema validation for structured outputs |
| `ioredis` | `^5.3.0` | Caching layer |
| `prom-client` | `^15.0.0` | Prometheus metrics |
| `nanoid` | `^5.0.0` | ID generation |

---

## 25. Glossary

| Term | Definition |
|------|-----------|
| **Agentic Kernel** | The core reasoning engine of the Agentic OS, implementing RLM patterns. |
| **Chain-of-Thought (CoT)** | Linear step-by-step reasoning strategy. |
| **Confidence Score** | A 0.0–1.0 value indicating how certain the system is in its answer. |
| **Counterfactual Reasoning** | Exploring "what if" scenarios to test solution robustness. |
| **Decomposition** | Breaking a complex problem into a directed acyclic graph of subtasks. |
| **Genesis Engine** | The intent-to-execution bridge that creates Ralph Blueprints. |
| **HITL** | Human-in-the-loop; escalation to human reviewers when confidence is low. |
| **Ralph Blueprint** | A structured execution plan ready for a Ralph Pod to implement. |
| **ReAct** | Reasoning + Acting; interleaved thinking and tool use. |
| **Reasoning Trace** | A complete, serializable record of every step in a reasoning operation. |
| **Reflexion** | Self-critique and iterative correction strategy. |
| **RLM** | Recursive Language Model; treating LLMs as cognitive CPUs. |
| **Self-Consistency** | Majority voting over multiple independent reasoning paths. |
| **SPARC** | Specification, Pseudocode, Architecture, Refinement, Completion methodology. |
| **Strategy Selector** | Component that automatically picks the best reasoning strategy. |
| **Template** | A reusable reasoning pattern for a specific class of problems. |
| **Tree-of-Thought (ToT)** | Branching exploration with beam search pruning. |
| **Truth Verification** | Automated validation of reasoning outputs via sandboxed experiments. |

---

*@mcv/agentic-os/reasoning — Reasoning Engine*
