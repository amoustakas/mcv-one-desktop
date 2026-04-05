# @mcv/agentic-os/memory — Neural Hive-Mind
## Persistent Intelligence & Recursive Context Subsystem

**Module:** `@mcv/agentic-os/memory`  
**Parent:** `@mcv/agentic-os`  
**Tier:** 5 (Domain Layer — MCV-Only)  
**Classification:** INTERNAL (MCV-Only)  
**Status:** CANONICAL SPECIFICATION  
**Quality Level:** SURGICAL (2000+ lines)  
**Version:** 3.2.0  
**Last Updated:** February 9, 2026

---

## Table of Contents

1. [Purpose & Overview](#1-purpose--overview)
2. [Architecture: The Neural Hive-Mind](#2-architecture-the-neural-hive-mind)
3. [Memory Layers](#3-memory-layers)
4. [Memory Types & Taxonomy](#4-memory-types--taxonomy)
5. [Database Schema (Drizzle ORM)](#5-database-schema-drizzle-orm)
6. [Knowledge Graph Schema (Neo4j)](#6-knowledge-graph-schema-neo4j)
7. [Embedding & Vector Search](#7-embedding--vector-search)
8. [Memory Retrieval](#8-memory-retrieval)
9. [Deep RAG (Recursive Retrieval-Augmented Generation)](#9-deep-rag-recursive-retrieval-augmented-generation)
10. [Memory Consolidation](#10-memory-consolidation)
11. [Memory Operations API](#11-memory-operations-api)
12. [Cross-Agent Memory](#12-cross-agent-memory)
13. [Memory Lifecycle Management](#13-memory-lifecycle-management)
14. [Integration Points](#14-integration-points)
15. [Configuration](#15-configuration)
16. [Performance & Optimization](#16-performance--optimization)
17. [Security & Isolation](#17-security--isolation)
18. [Observability & Audit](#18-observability--audit)
19. [Error Handling & Resilience](#19-error-handling--resilience)
20. [Testing Strategy](#20-testing-strategy)
21. [TypeScript Interfaces](#21-typescript-interfaces)
22. [Usage Examples](#22-usage-examples)
23. [Client Components & Hooks](#23-client-components--hooks)
24. [Migration & Versioning](#24-migration--versioning)
25. [Dependencies](#25-dependencies)
26. [Roadmap](#26-roadmap)
27. [Glossary](#27-glossary)

---

## 1. Purpose & Overview

The Memory module, known as the **Neural Hive-Mind**, is the cognitive persistence layer of the MCV.ONE Agentic Operating System. It enables agents to transcend the limitations of traditional LLM context windows by treating knowledge as a programmatic, externally-managed environment — transforming ephemeral conversational context into durable, searchable, and synthesizable institutional intelligence.

### 1.1 The Problem

Large Language Models operate within fixed context windows. Once a conversation ends, all accumulated knowledge vanishes. This creates several critical limitations for enterprise AI deployments:

1. **Amnesia Between Sessions:** An agent that helped draft a contract yesterday has zero memory of it today. The human must re-explain context every session, wasting time and creating frustration.
2. **Knowledge Fragmentation:** Information learned by one agent instance never reaches another. If the Smith pod (Engineering) discovers a critical API limitation, the Scribe pod (Content) documenting that API has no awareness of it.
3. **No Learning Curve:** Unlike human employees who improve over time, stateless agents repeat the same mistakes indefinitely. There is no mechanism for procedural improvement or institutional memory.
4. **Context Window Saturation:** Even within a single session, stuffing all potentially-relevant context into a prompt leads to diluted attention, increased latency, higher costs, and eventual truncation of critical information.
5. **Hallucination Risk:** Without access to verified historical facts, agents are forced to generate answers from parametric knowledge alone, dramatically increasing hallucination rates for domain-specific queries.

### 1.2 The Solution

The Neural Hive-Mind solves these problems through a biologically-inspired memory architecture that mirrors human cognitive memory systems:

| Human Memory System | Neural Hive-Mind Equivalent | Implementation |
|---|---|---|
| Sensory Memory | Input Buffer | Redis stream with 30-second TTL |
| Working Memory | Working Context | In-memory state + Redis with session TTL |
| Short-Term Memory | Episodic Store | PostgreSQL with pgvector embeddings |
| Long-Term (Declarative) | Semantic Store | Neo4j Knowledge Graph + Pinecone vectors |
| Long-Term (Procedural) | Procedural Memory | Versioned prompt templates + instrument configs |
| Episodic Memory | Episode Timeline | Timestamped event chains in PostgreSQL |
| Semantic Memory | Fact Store | Subject-predicate-object triples in Neo4j |
| Meta-Memory | Memory-about-Memory | Consolidation tracking + retrieval analytics |

### 1.3 Design Principles

The Neural Hive-Mind is built on seven core principles:

1. **Active Kernel Model:** The LLM is the CPU; the Memory Store is the Disk. Rather than passively stuffing context, the agent actively queries and retrieves what it needs, when it needs it.
2. **Separation of Storage and Recall:** Memory encoding (writing) and memory retrieval (reading) are independent subsystems with different optimization targets. Writes optimize for completeness; reads optimize for relevance.
3. **Importance-Weighted Retention:** Not all memories are equal. The system assigns importance scores (1-10) based on novelty, emotional valence, decision impact, and access frequency. Low-importance memories decay; high-importance memories are consolidated and reinforced.
4. **Recursive Depth:** When initial retrieval is insufficient, the system spawns sub-queries to fill knowledge gaps — the Deep RAG pattern. This eliminates the "I don't have that information" failure mode.
5. **Multi-Modal Storage:** Different types of knowledge require different storage strategies. Raw events go to PostgreSQL, semantic relationships go to Neo4j, dense vector representations go to Pinecone, and hot working data goes to Redis.
6. **Venture Isolation with Cross-Pollination:** Each venture's memory is strictly isolated by default, but the Queen agent can selectively synthesize cross-venture patterns when authorized.
7. **Human-Readable Audit Trail:** Every memory operation is logged, traceable, and explainable. A human can inspect exactly what an agent remembers, why it remembers it, and how it influenced decisions.

### 1.4 Key Capabilities

The Memory module provides the following capabilities to the Agentic OS:

- **Long-Term Persistence:** Storage of every agent decision, interaction, and learning across the entire consortium, with configurable retention policies per venture and per memory type.
- **Recursive Context (Deep RAG):** An iterative retrieval mechanism that fills knowledge gaps by spawning sub-queries, achieving up to 94% knowledge coverage compared to 67% for standard single-pass RAG.
- **Knowledge Graph Integration:** Structured relationship mapping (Neo4j) that captures entity-link dynamics — "who signed what contract," "which vendor serves which ventures," "who approved which expenditure" — that vector similarity stores cannot represent.
- **Cross-Venture Synthesis:** Collective intelligence that shares non-sensitive operational patterns between ventures while maintaining strict data isolation boundaries.
- **Temporal Awareness:** Full timeline reconstruction of agent activities, enabling questions like "What did we decide about the Malta license renewal last Thursday?" with precise temporal retrieval.
- **Procedural Learning:** Automatic extraction and versioning of successful execution patterns, enabling agents to improve their performance over time based on historical outcomes.
- **Forgetting Curves:** Biologically-inspired memory decay that automatically deprioritizes stale, irrelevant, or superseded information to keep retrieval results fresh and relevant.
- **Memory Consolidation:** Periodic LLM-driven synthesis that compresses episodic memories into semantic facts, reducing storage costs while preserving essential knowledge.

### 1.5 Module Boundaries

The Memory module is responsible for:

| In Scope | Out of Scope |
|---|---|
| Memory storage, retrieval, and lifecycle | LLM inference (→ `@mcv/intelligence`) |
| Vector embedding generation coordination | Document parsing/chunking (→ `@mcv/intelligence/rag`) |
| Knowledge graph CRUD operations | Event bus infrastructure (→ `@mcv/fabric/events`) |
| Deep RAG recursive retrieval | Agent lifecycle management (→ `@mcv/agentic-os/naos`) |
| Memory consolidation scheduling | Task decomposition (→ `@mcv/agentic-os/queen`) |
| Cross-agent memory sharing | Prompt template management (→ `@mcv/agentic-os/prompts`) |
| PII scrubbing before storage | Full data encryption at rest (→ `@mcv/security`) |
| Memory audit trail | HITL approval workflows (→ `@mcv/agentic-os/hitl`) |
| Retrieval ranking algorithms | Model selection/routing (→ `@mcv/intelligence/routing`) |

---

## 2. Architecture: The Neural Hive-Mind

### 2.1 High-Level Architecture

The Memory system follows a **tri-modal storage architecture** with a unified access layer:

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                              🧠 NEURAL HIVE-MIND                                │
│                     Persistent Intelligence Subsystem                            │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │                        UNIFIED MEMORY ACCESS LAYER                      │   │
│  │                                                                         │   │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐                 │   │
│  │  │  MemoryStore  │  │ DeepRAG      │  │ MemorySearch │                 │   │
│  │  │  (Primary API)│  │ Processor    │  │ Engine       │                 │   │
│  │  └──────────────┘  └──────────────┘  └──────────────┘                 │   │
│  │                                                                         │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                    │                │                │                           │
│  ┌─────────────────┼────────────────┼────────────────┼───────────────────────┐ │
│  │                 STORAGE LAYER                                              │ │
│  │                                                                            │ │
│  │  ┌─────────────────────┐  ┌─────────────────────┐  ┌─────────────────┐  │ │
│  │  │  1. EPISODIC STORE  │  │  2. SEMANTIC STORE   │  │ 3. WORKING MEM  │  │ │
│  │  │    (PostgreSQL)      │  │  (Neo4j + Pinecone)  │  │    (Redis)      │  │ │
│  │  ├─────────────────────┤  ├─────────────────────┤  ├─────────────────┤  │ │
│  │  │ Raw event logs      │  │ Entities & Relations │  │ Active session  │  │ │
│  │  │ Input/Output pairs  │  │ Validated facts      │  │ Local state     │  │ │
│  │  │ Tool call traces    │  │ Recursive embeddings │  │ Short-term cache│  │ │
│  │  │ Error records       │  │ Concept hierarchies  │  │ Attention buffer│  │ │
│  │  │ Timing metadata     │  │ Causal chains        │  │ Context window  │  │ │
│  │  │ Cost accounting     │  │ Confidence scores    │  │ Priority queue  │  │ │
│  │  └─────────────────────┘  └─────────────────────┘  └─────────────────┘  │ │
│  │           │                         │                        │            │ │
│  └───────────┼─────────────────────────┼────────────────────────┼────────────┘ │
│              └─────────────────────────┼────────────────────────┘              │
│                                        │                                       │
│  ┌─────────────────────────────────────┴─────────────────────────────────────┐ │
│  │                    CONTEXT CONSOLIDATION ENGINE                            │ │
│  │                                                                           │ │
│  │  Phase 1: Ingest Episodic Memory (Raw Experience Capture)                 │ │
│  │  Phase 2: Importance Scoring (Novelty + Impact + Frequency Analysis)      │ │
│  │  Phase 3: Entity Extraction (Knowledge Graph Population)                  │ │
│  │  Phase 4: Semantic Synthesis (LLM-driven Summarization)                   │ │
│  │  Phase 5: Vector Embedding (Dense Representation Update)                  │ │
│  │  Phase 6: Decay Application (Forgetting Curve Enforcement)                │ │
│  │  Phase 7: Audit Logging (Consolidation Trace Recording)                   │ │
│  └───────────────────────────────────────────────────────────────────────────┘ │
│                                                                                 │
│  ┌───────────────────────────────────────────────────────────────────────────┐ │
│  │                    MEMORY ANALYTICS ENGINE                                │ │
│  │                                                                           │ │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌────────────┐  │ │
│  │  │ Usage Tracker │  │ Decay Engine │  │ Quality Score│  │ Cost Meter │  │ │
│  │  │ Access freq   │  │ Time-based   │  │ Accuracy of  │  │ Storage +  │  │ │
│  │  │ Hit/miss rate │  │ decay curves │  │ recalled vs  │  │ retrieval  │  │ │
│  │  │ Agent patterns│  │ per memory   │  │ actual data  │  │ cost track │  │ │
│  │  └──────────────┘  └──────────────┘  └──────────────┘  └────────────┘  │ │
│  └───────────────────────────────────────────────────────────────────────────┘ │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### 2.2 Data Flow Architecture

Memory operations follow a clearly defined flow through the system:

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                           MEMORY DATA FLOW                                    │
│                                                                               │
│  ┌──────────┐     ┌──────────┐     ┌──────────┐     ┌──────────┐           │
│  │  ENCODE  │ ──→ │  STORE   │ ──→ │ CONSOLI- │ ──→ │  RETRIEVE│           │
│  │          │     │          │     │   DATE   │     │          │           │
│  │ Raw input│     │ Episodic │     │ Episodic │     │ Ranked   │           │
│  │ → chunks │     │ + Vector │     │ → Semantic│     │ results  │           │
│  │ → embed  │     │ + Graph  │     │ → Graph   │     │ → context│           │
│  │ → score  │     │ + Redis  │     │ → Decay   │     │ → agent  │           │
│  └──────────┘     └──────────┘     └──────────┘     └──────────┘           │
│       │                │                │                │                    │
│       ▼                ▼                ▼                ▼                    │
│  ┌──────────┐     ┌──────────┐     ┌──────────┐     ┌──────────┐           │
│  │ PII Scrub│     │ Audit Log│     │ Cron Job │     │ Audit Log│           │
│  │ Validate │     │ Write    │     │ Schedule │     │ Read     │           │
│  │ Classify │     │ Confirm  │     │ Report   │     │ Metrics  │           │
│  └──────────┘     └──────────┘     └──────────┘     └──────────┘           │
│                                                                               │
└──────────────────────────────────────────────────────────────────────────────┘
```

#### 2.2.1 Write Path (Memory Encoding)

When an agent completes an interaction, the memory system encodes the experience:

1. **Input Reception:** The agent's request/response pair, tool call traces, timing metadata, and model information are packaged into a `MemoryWriteRequest`.
2. **PII Scrubbing:** The Shield pod's sanitization pipeline runs over the content, redacting passwords, API keys, SSNs, credit card numbers, and other PII patterns before storage.
3. **Importance Scoring:** An LLM-based importance classifier assigns a score from 1-10 based on:
   - **Novelty:** Is this new information or a repetition? (0.0-1.0)
   - **Decision Impact:** Did this interaction lead to an action or just information? (0.0-1.0)
   - **Emotional Valence:** Does this carry emotional significance (frustration, urgency, satisfaction)? (-1.0 to 1.0)
   - **Entity Density:** How many named entities (people, companies, contracts) are mentioned? (count)
   - **Temporal Relevance:** Does this reference future deadlines or commitments? (boolean weight)
4. **Chunking:** Long content is split into semantic chunks (target: 512 tokens per chunk) using recursive text splitting that respects paragraph and sentence boundaries.
5. **Embedding Generation:** Each chunk is embedded using the configured model (default: `voyage-3-large`, 1024 dimensions) via `@mcv/intelligence/embedding`.
6. **Parallel Storage:** The chunks, embeddings, importance scores, and metadata are written simultaneously to:
   - PostgreSQL (episodic record + pgvector embedding)
   - Pinecone (dense vector for fast similarity search)
   - Neo4j (extracted entities and relationships, if any)
   - Redis (working memory cache, if session is active)
7. **Event Emission:** A `memory.stored` event is published to the `@mcv/fabric/events` bus for downstream consumers (analytics, consolidation triggers, etc.).

#### 2.2.2 Read Path (Memory Retrieval)

When an agent needs context, the retrieval pipeline activates:

1. **Query Analysis:** The incoming query is analyzed to determine:
   - **Query Type:** Factual lookup, temporal search, entity search, or exploratory
   - **Required Stores:** Which stores to query (episodic, semantic, graph, or all)
   - **Time Constraints:** Does the query reference a specific time period?
   - **Entity Focus:** Are specific entities (people, contracts, ventures) mentioned?
2. **Parallel Search:** Based on query analysis, searches are dispatched to relevant stores:
   - **Vector Search (Pinecone):** Cosine similarity against the query embedding, top-k results
   - **Graph Search (Neo4j):** Entity-relationship traversal for structured queries
   - **Temporal Search (PostgreSQL):** Time-range filtered episodic memory scan
   - **Working Memory (Redis):** Current session context check
3. **Result Fusion:** Results from all stores are merged using Reciprocal Rank Fusion (RRF):
   - Each result receives a rank from each store
   - Scores are combined: `score = Σ (1 / (k + rank_i))` where `k` is a constant (default: 60)
   - Duplicate content is deduplicated using MinHash similarity
4. **Relevance Ranking:** Fused results are re-ranked using:
   - Cosine similarity to query (40% weight)
   - Temporal recency decay (20% weight)
   - Importance score (20% weight)
   - Access frequency boost (10% weight)
   - Source diversity bonus (10% weight)
5. **Gap Detection:** If the top results don't meet the confidence threshold (default: 0.82), the Deep RAG module spawns recursive sub-queries.
6. **Context Assembly:** Final ranked results are formatted into a context block suitable for the agent's prompt, with source citations and confidence indicators.
7. **Access Logging:** Every retrieval is logged with the query, results returned, latency, and the requesting agent/task.

#### 2.2.3 Consolidation Path (Memory Maintenance)

On a configurable schedule (default: every 4 hours), the consolidation engine processes accumulated episodic memories:

1. **Batch Selection:** Unprocessed episodic memories since the last consolidation run are loaded.
2. **Cluster Analysis:** Memories are grouped by topic using k-means clustering on their embeddings.
3. **Summarization:** Each cluster is summarized by an LLM, extracting key facts, decisions, and learnings.
4. **Entity Extraction:** Named entities and relationships are extracted from summaries and upserted into Neo4j.
5. **Semantic Chunk Creation:** Summaries become new semantic chunks with fresh embeddings.
6. **Decay Application:** Existing memories that haven't been accessed recently have their importance scores decremented according to the configured forgetting curve.
7. **Garbage Collection:** Memories below the minimum importance threshold (default: 2) and older than the retention period are archived or deleted.
8. **Statistics Recording:** Consolidation metrics are logged for monitoring.

### 2.3 Component Architecture

```
┌──────────────────────────────────────────────────────────────────────────────────┐
│                        MEMORY MODULE - COMPONENT MAP                              │
│                                                                                   │
│  ┌────────────────────────────────────────────────────────────────────────────┐  │
│  │                         PUBLIC API LAYER                                    │  │
│  │                                                                            │  │
│  │  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐        │  │
│  │  │   MemoryStore    │  │ DeepRAGProcessor │  │  MemorySearch    │        │  │
│  │  │                  │  │                  │  │                  │        │  │
│  │  │ store()          │  │ retrieve()       │  │ search()         │        │  │
│  │  │ retrieve()       │  │ identifyGaps()   │  │ searchByEntity() │        │  │
│  │  │ search()         │  │ synthesize()     │  │ searchByTime()   │        │  │
│  │  │ consolidate()    │  │                  │  │ searchByTag()    │        │  │
│  │  │ forget()         │  │                  │  │ searchHybrid()   │        │  │
│  │  │ getTimeline()    │  │                  │  │                  │        │  │
│  │  │ share()          │  │                  │  │                  │        │  │
│  │  └──────────────────┘  └──────────────────┘  └──────────────────┘        │  │
│  └────────────────────────────────────────────────────────────────────────────┘  │
│                    │                    │                    │                     │
│  ┌────────────────────────────────────────────────────────────────────────────┐  │
│  │                       INTERNAL SERVICE LAYER                               │  │
│  │                                                                            │  │
│  │  ┌────────────────┐  ┌────────────────┐  ┌────────────────┐              │  │
│  │  │ EpisodicMemory │  │ SemanticMemory │  │ WorkingMemory  │              │  │
│  │  │                │  │                │  │                │              │  │
│  │  │ PostgreSQL +   │  │ Neo4j +        │  │ Redis          │              │  │
│  │  │ pgvector       │  │ Pinecone       │  │ Session-scoped │              │  │
│  │  └────────────────┘  └────────────────┘  └────────────────┘              │  │
│  │                                                                            │  │
│  │  ┌────────────────┐  ┌────────────────┐  ┌────────────────┐              │  │
│  │  │ ImportanceScorer│  │ DecayEngine    │  │ PIIScrubber    │              │  │
│  │  │                │  │                │  │                │              │  │
│  │  │ LLM-based      │  │ Ebbinghaus     │  │ Pattern-based  │              │  │
│  │  │ scoring        │  │ decay curves   │  │ + LLM-based    │              │  │
│  │  └────────────────┘  └────────────────┘  └────────────────┘              │  │
│  │                                                                            │  │
│  │  ┌────────────────┐  ┌────────────────┐  ┌────────────────┐              │  │
│  │  │ EntityExtractor│  │ ChunkSplitter  │  │ EmbeddingClient│              │  │
│  │  │                │  │                │  │                │              │  │
│  │  │ LLM-based      │  │ Recursive text │  │ Voyage/OpenAI  │              │  │
│  │  │ NER + RE       │  │ splitting      │  │ via @mcv/intel │              │  │
│  │  └────────────────┘  └────────────────┘  └────────────────┘              │  │
│  │                                                                            │  │
│  │  ┌────────────────┐  ┌────────────────┐  ┌────────────────┐              │  │
│  │  │ ResultFusion   │  │ RelevanceRanker│  │ ConsolidationMgr│             │  │
│  │  │                │  │                │  │                │              │  │
│  │  │ RRF algorithm  │  │ Multi-factor   │  │ Scheduled batch│              │  │
│  │  │ Deduplication  │  │ re-ranking     │  │ processing     │              │  │
│  │  └────────────────┘  └────────────────┘  └────────────────┘              │  │
│  └────────────────────────────────────────────────────────────────────────────┘  │
│                    │                    │                    │                     │
│  ┌────────────────────────────────────────────────────────────────────────────┐  │
│  │                       STORAGE DRIVER LAYER                                 │  │
│  │                                                                            │  │
│  │  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐       │  │
│  │  │ Drizzle │  │ neo4j-  │  │ Pinecone│  │ ioredis │  │ GCS     │       │  │
│  │  │ ORM     │  │ driver  │  │ SDK     │  │         │  │ (backup)│       │  │
│  │  │ (PG)    │  │         │  │         │  │         │  │         │       │  │
│  │  └─────────┘  └─────────┘  └─────────┘  └─────────┘  └─────────┘       │  │
│  └────────────────────────────────────────────────────────────────────────────┘  │
│                                                                                   │
└──────────────────────────────────────────────────────────────────────────────────┘
```

### 2.4 The Agentic Kernel & Active Memory Model

Traditional AI uses a **Passive Context** model where all potentially relevant data is pre-loaded into the prompt. This is fundamentally limited:

```
Traditional (Passive Context):
┌──────────────┐      ┌──────────────────────────┐
│ User Query   │ ───→ │ Prompt = System + RAG +  │ ───→ LLM ───→ Response
│              │      │ User Query + History     │
└──────────────┘      │ (everything pre-loaded)  │
                      └──────────────────────────┘
                      Problem: Fixed capacity, no depth control,
                      irrelevant context dilutes attention
```

MCV.ONE uses an **Active Kernel** model where the LLM is the CPU and the Memory Store is the Disk:

```
MCV.ONE (Active Kernel):
┌──────────────┐      ┌──────────┐      ┌──────────────┐
│ User Query   │ ───→ │ LLM      │ ←──→ │ Memory Store │
│              │      │ (CPU)    │      │ (Disk)       │
└──────────────┘      │          │      │              │
                      │ Actively │      │ Episodic     │
                      │ queries  │      │ Semantic     │
                      │ memory   │      │ Graph        │
                      │ as needed│      │ Working      │
                      └──────────┘      └──────────────┘
                      Solution: On-demand retrieval, depth control,
                      relevance-filtered context assembly
```

In the Active Kernel model:
- The agent decides **what** to retrieve based on the current query
- Retrieval is **iterative** — initial results inform subsequent queries
- Context assembly is **adaptive** — only the most relevant results enter the prompt
- The agent can **write back** new learnings immediately
- Memory operations are **auditable** — every read/write is logged

### 2.5 Memory Flow Through Agent Lifecycle

Every agent interaction follows this memory-integrated lifecycle:

```
Agent Request Lifecycle with Memory:

1. REQUEST RECEIVED
   │
   ├─→ Load Working Memory (Redis: current session context)
   ├─→ Retrieve Relevant Episodic Memories (recent interactions)
   ├─→ Search Semantic Memory (knowledge graph + vectors)
   │
2. CONTEXT ASSEMBLED
   │
   ├─→ Rank and filter retrieved memories
   ├─→ Inject into agent prompt as context block
   ├─→ Include memory confidence indicators
   │
3. AGENT EXECUTES
   │
   ├─→ Agent processes request with memory-enriched context
   ├─→ Agent may trigger additional memory searches mid-execution
   ├─→ Tool calls are traced for episodic storage
   │
4. RESPONSE GENERATED
   │
   ├─→ Store interaction as new episodic memory
   ├─→ Update working memory with new context
   ├─→ Extract entities for knowledge graph (async)
   ├─→ Score importance for future retrieval
   │
5. POST-PROCESSING (async)
   │
   ├─→ Generate and store embeddings
   ├─→ Publish memory.stored event
   ├─→ Update access patterns for retrieved memories
   └─→ Queue for next consolidation cycle
```

---

## 3. Memory Layers

The Neural Hive-Mind implements five distinct memory layers, each serving a specific cognitive function. These layers work together to provide comprehensive memory capabilities — from sub-second working context to years-long institutional knowledge.

### 3.1 Working Memory (Layer 0 — Attention Buffer)

**Storage:** Redis  
**Latency Target:** < 5ms  
**Retention:** Session-scoped (TTL: configurable, default 2 hours)  
**Capacity:** Up to 128KB per agent session

Working Memory is the agent's "mental scratch pad" — the equivalent of human working memory that holds the immediately relevant context for the current task. It is the fastest memory layer and the most volatile.

#### 3.1.1 Purpose

- Hold the current conversation context (last N messages)
- Store intermediate computation results during multi-step reasoning
- Cache recently retrieved memories to avoid redundant lookups
- Maintain the agent's current "focus" — what entities, topics, and goals are active
- Track the agent's current execution state (what step of a plan is being executed)

#### 3.1.2 Data Structure

```typescript
interface WorkingMemoryState {
  // Session identification
  sessionId: string;
  agentId: string;
  ventureId: string;
  
  // Conversation context
  messages: ConversationMessage[];       // Last N messages (configurable)
  messageCount: number;                  // Total messages in session
  
  // Active focus
  activeEntities: string[];              // Entities currently being discussed
  activeTopics: string[];                // Topics currently active
  activeGoals: string[];                 // Current task/goal stack
  
  // Retrieval cache
  cachedMemories: Map<string, CachedMemory>;  // Recently retrieved, keyed by query hash
  cacheHitRate: number;                  // Running hit rate for diagnostics
  
  // Execution state
  currentPlan: TaskPlan | null;          // If executing a multi-step plan
  currentStep: number;                   // Current step index
  intermediateResults: Record<string, any>;  // Intermediate computation outputs
  
  // Metadata
  createdAt: Date;
  lastAccessedAt: Date;
  totalTokensUsed: number;
  estimatedContextSize: number;          // Current context window usage estimate
}

interface ConversationMessage {
  role: 'user' | 'assistant' | 'system' | 'tool';
  content: string;
  timestamp: Date;
  toolCalls?: ToolCallRecord[];
  tokenCount: number;
}

interface CachedMemory {
  query: string;
  results: MemorySearchResult[];
  cachedAt: Date;
  ttl: number;                           // Cache TTL in seconds
  hits: number;                          // Times this cache entry was used
}
```

#### 3.1.3 Redis Key Schema

```
working_memory:{ventureId}:{agentId}:{sessionId}         → JSON (full state)
working_memory:{ventureId}:{agentId}:{sessionId}:messages → List (conversation)
working_memory:{ventureId}:{agentId}:{sessionId}:cache    → Hash (retrieval cache)
working_memory:{ventureId}:{agentId}:{sessionId}:focus    → Set (active entities)
working_memory:{ventureId}:{agentId}:{sessionId}:plan     → JSON (execution state)
```

#### 3.1.4 Eviction Policy

Working memory uses a hybrid eviction strategy:

1. **Session TTL:** Entire working memory expires after session timeout (default: 2 hours of inactivity)
2. **Message Windowing:** Only the last N messages are retained (default: 50); older messages are summarized and stored as a "conversation summary" entry
3. **Cache LRU:** Retrieval cache uses LRU eviction with a maximum of 100 entries
4. **Focus Decay:** Entities not referenced in the last 5 messages are removed from the active focus set
5. **Size Cap:** If total working memory exceeds 128KB, the oldest non-essential entries are pruned

#### 3.1.5 Working Memory Operations

```typescript
class WorkingMemory {
  /**
   * Initialize working memory for a new agent session.
   */
  async initialize(config: WorkingMemoryConfig): Promise<WorkingMemoryState>;
  
  /**
   * Add a message to the conversation history.
   * Automatically handles windowing and summarization.
   */
  async addMessage(message: ConversationMessage): Promise<void>;
  
  /**
   * Get the current conversation context formatted for prompt injection.
   * Applies token budgeting to stay within limits.
   */
  async getContext(tokenBudget: number): Promise<string>;
  
  /**
   * Update the active focus based on current interaction.
   */
  async updateFocus(entities: string[], topics: string[], goals: string[]): Promise<void>;
  
  /**
   * Cache a memory retrieval result for fast re-access.
   */
  async cacheRetrieval(query: string, results: MemorySearchResult[], ttl?: number): Promise<void>;
  
  /**
   * Check if a query has cached results.
   */
  async checkCache(query: string): Promise<MemorySearchResult[] | null>;
  
  /**
   * Store intermediate computation results.
   */
  async storeIntermediate(key: string, value: any): Promise<void>;
  
  /**
   * Retrieve intermediate computation results.
   */
  async getIntermediate(key: string): Promise<any>;
  
  /**
   * Flush working memory to episodic storage on session end.
   * Creates a session summary and stores it as an episodic memory.
   */
  async flush(): Promise<void>;
  
  /**
   * Get working memory diagnostics.
   */
  async getDiagnostics(): Promise<WorkingMemoryDiagnostics>;
}
```

### 3.2 Short-Term Memory (Layer 1 — Episodic Buffer)

**Storage:** PostgreSQL (with pgvector)  
**Latency Target:** < 50ms  
**Retention:** 30 days (configurable per venture)  
**Capacity:** Unlimited (partition-managed)

Short-Term Memory stores raw episodic traces — the detailed record of every agent interaction. This is the primary write target for all memory operations and serves as the source of truth for recent agent activity.

#### 3.2.1 Purpose

- Record every agent interaction with full fidelity (input, output, tool calls, timing)
- Provide temporal search capabilities ("what happened yesterday?")
- Serve as the input buffer for consolidation into long-term memory
- Enable replay and debugging of agent behavior
- Feed the importance scoring system with raw interaction data

#### 3.2.2 Characteristics

| Property | Value |
|---|---|
| Write Pattern | Append-only, high volume |
| Read Pattern | Temporal range queries, embedding similarity search |
| Consistency | Strong (ACID via PostgreSQL) |
| Partitioning | By `venture_id` and `created_at` (monthly partitions) |
| Indexing | B-tree on (venture_id, agent_id, created_at), GIN on tags, HNSW on embedding |
| Compression | TOAST compression for large text fields |
| Archival | After 30 days, archived to GCS cold storage via pg_dump |

#### 3.2.3 Data Model

Short-term memories are stored in the `agent_episodic_memories` table (see [Section 5.1](#51-episodic-memory-tables) for full schema). Each record captures:

- **Identity:** Who (agent_id), what venture, what request
- **Content:** Full input, output, and tool call traces
- **Metrics:** Token counts, latency, cost
- **Scoring:** Importance (1-10), emotional valence (-1 to 1), novelty score
- **Embedding:** pgvector embedding for similarity search
- **Metadata:** Tags, source type, parent session, error indicators
- **Timestamps:** Created, last accessed, scheduled for consolidation

### 3.3 Long-Term Memory (Layer 2 — Semantic Store)

**Storage:** PostgreSQL (semantic chunks) + Pinecone (vector index) + Neo4j (knowledge graph)  
**Latency Target:** < 100ms (vector), < 150ms (graph)  
**Retention:** Indefinite (importance-gated)  
**Capacity:** Unlimited (managed by consolidation)

Long-Term Memory is the agent's consolidated knowledge base. Unlike short-term episodic memories that capture raw interactions, long-term memories represent distilled facts, learned patterns, and structural knowledge that has been validated through the consolidation process.

#### 3.3.1 Purpose

- Store validated, consolidated knowledge extracted from episodic memories
- Maintain the knowledge graph of entities and relationships
- Provide high-quality, de-noised retrieval results for complex queries
- Serve as the primary context source for factual questions
- Enable cross-temporal knowledge queries spanning weeks, months, or years

#### 3.3.2 Semantic Chunks

Semantic chunks are the atomic units of long-term memory. Each chunk represents a coherent piece of knowledge — a fact, a decision, a learned pattern, or a relationship description.

```typescript
interface SemanticChunk {
  id: string;
  ventureId: string;
  
  // Content
  content: string;                    // The knowledge content (typically 100-500 tokens)
  summary: string;                    // One-line summary for fast scanning
  
  // Classification
  sourceType: 'consolidation' | 'document' | 'manual' | 'system';
  sourceIds: string[];                // Links to episodic memories or documents that produced this
  category: MemoryCategory;           // factual | procedural | relational | temporal | evaluative
  
  // Vector representation
  embedding: number[];                // Dense vector (1024d Voyage or 1536d OpenAI)
  embeddingModel: string;             // Model used to generate embedding
  
  // Quality signals
  importance: number;                 // 1-10, inherited from sources + consolidation boost
  confidence: number;                 // 0.0-1.0, how confident the system is in this fact
  verificationStatus: 'unverified' | 'verified' | 'contradicted' | 'superseded';
  
  // Usage tracking
  accessCount: number;                // Total times retrieved
  lastAccessedAt: Date;               // Last retrieval timestamp
  accessPatterns: AccessPattern[];    // Which agents/queries access this most
  
  // Lifecycle
  createdAt: Date;
  updatedAt: Date;
  expiresAt: Date | null;            // Optional explicit expiration
  decayScore: number;                // Current decay-adjusted importance
  
  // Metadata
  tags: string[];
  metadata: Record<string, any>;
}

type MemoryCategory = 
  | 'factual'        // "The Malta gaming license #4492 expires December 2026"
  | 'procedural'     // "To deploy to production, run the CI pipeline then notify ops"
  | 'relational'     // "BetEdge and Malta Gaming Authority have a licensing relationship"
  | 'temporal'       // "The quarterly board meeting happens on the first Monday of each quarter"
  | 'evaluative';    // "Using Claude Opus for contract review yields better results than GPT-4"
```

#### 3.3.3 Knowledge Graph Entities

The Neo4j knowledge graph stores structured relationships that complement vector-based semantic search:

- **Entities:** People, organizations, ventures, contracts, documents, products, licenses, jurisdictions
- **Relationships:** Works-for, owns, authorized-for, party-to, involves, context-for, signed-by, issued-by
- **Properties:** Each entity and relationship carries metadata (dates, amounts, status, confidence)

The graph is essential for queries that require relationship traversal — "Which contracts involve vendors used by both BetEdge and MCV Studios?" — which vector similarity alone cannot answer.

### 3.4 Episodic Memory (Cross-Cutting — Event Timeline)

**Storage:** PostgreSQL  
**Latency Target:** < 50ms  
**Retention:** 90 days (configurable)

Episodic Memory represents the agent's ability to recall specific events in temporal sequence — not just what was learned, but when it was learned and what happened before and after.

#### 3.4.1 Purpose

- Provide timeline reconstruction of agent activities
- Enable temporal queries ("What happened between Monday and Wednesday?")
- Support cause-effect analysis ("What led to this error?")
- Feed the consolidation engine with ordered event sequences
- Enable session replay for debugging and quality review

#### 3.4.2 Episode Structure

An episode represents a complete interaction cycle — from request receipt to response delivery:

```typescript
interface Episode {
  id: string;
  ventureId: string;
  agentId: string;
  sessionId: string;
  requestId: string;
  
  // Episode classification
  type: EpisodeType;
  category: string;                   // Domain-specific category
  
  // Timeline
  startedAt: Date;
  completedAt: Date;
  durationMs: number;
  
  // Event chain
  events: EpisodeEvent[];             // Ordered sequence of events within the episode
  
  // Context
  triggerSource: 'user' | 'system' | 'cron' | 'event' | 'escalation';
  parentEpisodeId: string | null;     // If this episode was triggered by another
  childEpisodeIds: string[];          // Episodes spawned by this one
  
  // Outcome
  outcome: EpisodeOutcome;
  outcomeDetails: string;
  
  // Scoring
  importance: number;
  novelty: number;
  emotionalValence: number;
  
  // Consolidation
  consolidatedAt: Date | null;
  consolidationChunkIds: string[];    // Semantic chunks produced from this episode
}

type EpisodeType = 
  | 'task_execution'      // Agent executed a task
  | 'user_interaction'    // Direct conversation with a user
  | 'error_recovery'      // Agent encountered and recovered from an error
  | 'learning_moment'     // Agent discovered something new
  | 'decision_point'      // Agent made a significant decision
  | 'escalation'          // Agent escalated to human or higher-level agent
  | 'tool_execution'      // Agent used an external tool
  | 'memory_retrieval'    // Agent performed a significant memory search
  | 'consolidation';      // Memory consolidation cycle

interface EpisodeEvent {
  id: string;
  episodeId: string;
  sequence: number;                   // Order within episode
  
  type: 'input' | 'reasoning' | 'tool_call' | 'tool_result' | 'output' | 'error' | 'decision' | 'memory_access';
  content: string;
  metadata: Record<string, any>;
  
  timestamp: Date;
  durationMs: number;
  tokenCount: number;
}

interface EpisodeOutcome {
  status: 'success' | 'partial_success' | 'failure' | 'escalated' | 'timeout';
  confidence: number;                 // Agent's self-assessed confidence in the outcome
  userSatisfaction: number | null;    // If user feedback was collected (1-5)
  learnings: string[];                // Key takeaways from this episode
}
```

#### 3.4.3 Temporal Indexing

Episodes are indexed for efficient temporal queries:

```sql
-- Composite index for temporal range queries
CREATE INDEX idx_episodes_venture_time 
ON agent_episodes (venture_id, started_at DESC);

-- Index for agent-specific timeline
CREATE INDEX idx_episodes_agent_time 
ON agent_episodes (agent_id, started_at DESC);

-- Index for session reconstruction
CREATE INDEX idx_episodes_session 
ON agent_episodes (session_id, sequence);

-- Partial index for unconsolidated episodes
CREATE INDEX idx_episodes_unconsolidated 
ON agent_episodes (started_at) 
WHERE consolidated_at IS NULL;
```

### 3.5 Semantic Memory (Cross-Cutting — Fact Store)

**Storage:** Neo4j (primary) + PostgreSQL (indexed facts)  
**Latency Target:** < 100ms  
**Retention:** Indefinite (confidence-gated)

Semantic Memory stores structured factual knowledge as subject-predicate-object triples. This is the agent's "encyclopedia" — facts that are true independent of when they were learned.

#### 3.5.1 Purpose

- Store validated factual knowledge in a structured, queryable format
- Enable relationship-based reasoning ("Who is authorized to approve purchases over $10K?")
- Support ontology-based inference ("If A owns B and B owns C, what is A's indirect stake in C?")
- Provide ground truth for hallucination detection
- Enable fact contradiction detection and resolution

#### 3.5.2 Semantic Fact Structure

```typescript
interface SemanticFact {
  id: string;
  ventureId: string;
  
  // Triple structure
  subject: string;                    // Entity name or ID
  subjectType: EntityType;            // person | organization | venture | document | ...
  predicate: string;                  // Relationship type
  object: string;                     // Entity name, value, or ID
  objectType: EntityType | 'literal'; // Entity type or literal value
  
  // Temporal validity
  validFrom: Date | null;             // When this fact became true
  validUntil: Date | null;            // When this fact expires (null = ongoing)
  
  // Confidence and provenance
  confidence: number;                 // 0.0-1.0
  source: FactSource;                 // How was this fact established?
  sourceIds: string[];                // Links to episodic memories / documents
  
  // Contradiction tracking
  contradictedBy: string[];           // IDs of facts that contradict this one
  supersededBy: string | null;        // ID of the fact that replaced this one
  
  // Metadata
  extractedAt: Date;
  lastVerifiedAt: Date;
  verificationCount: number;          // Times this fact has been re-confirmed
  
  tags: string[];
  metadata: Record<string, any>;
}

type EntityType = 
  | 'person'
  | 'organization'
  | 'venture'
  | 'document'
  | 'contract'
  | 'product'
  | 'license'
  | 'jurisdiction'
  | 'event'
  | 'concept'
  | 'metric'
  | 'policy';

type FactSource = 
  | 'consolidation'       // Extracted during memory consolidation
  | 'document_ingestion'  // Extracted from an ingested document
  | 'user_stated'         // Directly stated by a user
  | 'agent_inferred'      // Inferred by an agent during reasoning
  | 'system_generated'    // Generated by system processes
  | 'external_api';       // Retrieved from an external data source
```

#### 3.5.3 Fact Lifecycle

```
┌──────────┐     ┌──────────┐     ┌──────────┐     ┌──────────┐
│ PROPOSED │ ──→ │ ACTIVE   │ ──→ │ VERIFIED │ ──→ │ ARCHIVED │
│          │     │          │     │          │     │          │
│ Extracted│     │ In use   │     │ Multi-   │     │ Expired/ │
│ awaiting │     │ not yet  │     │ source   │     │ superseded│
│ review   │     │ verified │     │ confirmed│     │ or wrong │
└──────────┘     └──────────┘     └──────────┘     └──────────┘
      │                                                  ▲
      └────────────── REJECTED ──────────────────────────┘
                    (contradiction detected)
```

Facts move through this lifecycle:
1. **Proposed:** Newly extracted, awaiting validation
2. **Active:** Accepted into the knowledge base, used in retrieval
3. **Verified:** Confirmed by multiple independent sources (confidence > 0.9)
4. **Archived:** Expired, superseded, or contradicted — kept for audit but excluded from retrieval
5. **Rejected:** Contradicted by higher-confidence facts during proposal stage

### 3.6 Procedural Memory (Layer 3 — Know-How Store)

**Storage:** PostgreSQL + Version Control  
**Latency Target:** < 50ms  
**Retention:** Indefinite (versioned)

Procedural Memory stores learned patterns of behavior — "how to do things" rather than "what things are." This is the agent's accumulation of operational expertise.

#### 3.6.1 Purpose

- Store successful execution patterns (prompt templates, tool sequences, error recovery strategies)
- Enable agents to learn from past successes and failures
- Provide execution blueprints for recurring task types
- Support A/B testing of different operational approaches
- Track which strategies work best for which contexts

#### 3.6.2 Procedural Memory Structure

```typescript
interface ProceduralMemory {
  id: string;
  ventureId: string;
  agentType: string;                  // Which agent type this procedure applies to
  
  // Procedure definition
  name: string;                       // Human-readable name
  description: string;                // What this procedure accomplishes
  category: ProceduralCategory;
  
  // The actual procedure
  steps: ProceduralStep[];            // Ordered steps
  preconditions: string[];            // Conditions that must be true before executing
  postconditions: string[];           // Expected state after successful execution
  
  // Performance tracking
  executionCount: number;             // Times this procedure has been used
  successRate: number;                // Success rate (0.0-1.0)
  avgDurationMs: number;              // Average execution time
  avgCostUSD: number;                 // Average cost
  
  // Versioning
  version: number;
  previousVersionId: string | null;
  changeLog: string;
  
  // Context
  applicableWhen: string[];           // Natural language conditions for when to use this
  notApplicableWhen: string[];        // When NOT to use this
  
  createdAt: Date;
  updatedAt: Date;
  lastUsedAt: Date;
}

type ProceduralCategory = 
  | 'tool_sequence'        // Sequence of tool calls for a task
  | 'error_recovery'       // How to handle specific error types
  | 'prompt_strategy'      // Effective prompt patterns
  | 'communication'        // How to format/phrase responses
  | 'escalation'           // When and how to escalate
  | 'optimization';        // Performance optimization patterns

interface ProceduralStep {
  sequence: number;
  action: string;                     // What to do
  instrument: string | null;          // Which tool to use (if applicable)
  parameters: Record<string, any>;    // Default parameters
  expectedOutcome: string;
  fallbackAction: string | null;      // What to do if this step fails
  timeoutMs: number;
}
```

---

## 4. Memory Types & Taxonomy

The Memory module classifies all stored memories using a comprehensive taxonomy that informs storage strategy, retrieval priority, consolidation behavior, and retention policy.

### 4.1 Primary Memory Types

| Type | Layer | Storage | Write Frequency | Read Frequency | Consolidation |
|---|---|---|---|---|---|
| `working` | L0 | Redis | Very High | Very High | Flush to episodic on session end |
| `episodic` | L1 | PostgreSQL | High | Medium | Summarize → semantic (4h cycle) |
| `semantic` | L2 | PG + Pinecone + Neo4j | Low | High | Verify + reinforce |
| `procedural` | L3 | PostgreSQL | Low | Medium | Version + optimize |

### 4.2 Memory Category Taxonomy

Each memory entry is further categorized by its content type:

```typescript
type MemoryCategory = 
  // Factual knowledge
  | 'fact'                // Atomic fact: "BetEdge HQ is in Malta"
  | 'definition'          // Concept definition: "HITL stands for Human-in-the-Loop"
  | 'metric'              // Quantitative data: "Q3 revenue was $2.1M"
  | 'status'              // Current state: "The Malta license is pending renewal"
  
  // Relational knowledge
  | 'relationship'        // Entity relationship: "Tony reports to Michael"
  | 'ownership'           // Ownership: "MCV Global owns 100% of BetEdge"
  | 'dependency'          // System dependency: "Payment processing requires Stripe API"
  | 'hierarchy'           // Organizational structure: "Shield pod is under NAOS framework"
  
  // Temporal knowledge
  | 'event'               // Something that happened: "Board meeting held on Jan 15"
  | 'deadline'            // Future commitment: "License renewal due by Dec 2026"
  | 'schedule'            // Recurring pattern: "Sprint planning every Monday at 10 AM"
  | 'milestone'           // Project milestone: "v2.0 launched to production"
  
  // Procedural knowledge
  | 'process'             // How to do something: "Deploy process: PR → review → merge → CI"
  | 'policy'              // Business rule: "All expenses > $5K require CFO approval"
  | 'preference'          // User/venture preference: "Tony prefers Slack over email"
  | 'lesson_learned'      // Post-mortem insight: "Always check timezone before scheduling"
  
  // Evaluative knowledge
  | 'assessment'          // Quality judgment: "Claude Opus outperforms GPT-4 for legal review"
  | 'risk'                // Risk identification: "Single point of failure in payment gateway"
  | 'opportunity'         // Opportunity noted: "Malta market expansion could yield 30% growth"
  | 'recommendation';     // Suggested action: "Consider migrating to pgvector from Pinecone"
```

### 4.3 Importance Scoring

Every memory receives an importance score from 1-10 that determines its retention priority and retrieval ranking:

| Score | Level | Description | Example | Retention |
|---|---|---|---|---|
| 1-2 | Trivial | Routine acknowledgments, status checks | "OK, I'll look into that" | 7 days |
| 3-4 | Low | Standard information exchanges | "The API endpoint is /api/v2/users" | 30 days |
| 5-6 | Medium | Meaningful decisions, useful context | "We decided to use Stripe for payments" | 90 days |
| 7-8 | High | Strategic decisions, critical information | "Board approved $500K budget for Q2" | 1 year |
| 9-10 | Critical | Legal, financial, security-critical | "Contract signed with Malta Gaming Authority" | Indefinite |

The importance score is calculated using a weighted formula:

```typescript
function calculateImportance(memory: MemoryInput): number {
  const weights = {
    novelty: 0.25,         // How new/unique is this information?
    decisionImpact: 0.25,  // Did this lead to an action or decision?
    entityDensity: 0.15,   // How many named entities are involved?
    temporalRelevance: 0.15, // Does this reference future events/deadlines?
    emotionalValence: 0.10,  // Does this carry emotional significance?
    userExplicit: 0.10,    // Did the user explicitly mark this as important?
  };
  
  const scores = {
    novelty: calculateNoveltyScore(memory),
    decisionImpact: classifyDecisionImpact(memory),
    entityDensity: Math.min(countEntities(memory) / 5, 1.0),
    temporalRelevance: hasFutureReferences(memory) ? 1.0 : 0.0,
    emotionalValence: Math.abs(memory.emotionalValence || 0),
    userExplicit: memory.userMarkedImportant ? 1.0 : 0.0,
  };
  
  const rawScore = Object.entries(weights).reduce(
    (sum, [key, weight]) => sum + weight * scores[key as keyof typeof scores],
    0
  );
  
  // Map 0.0-1.0 to 1-10 scale
  return Math.max(1, Math.min(10, Math.round(rawScore * 10)));
}
```

### 4.4 Emotional Valence

Memories carry an emotional valence score from -1.0 to 1.0 that influences retrieval:

| Range | Meaning | Impact on Retrieval |
|---|---|---|
| -1.0 to -0.5 | Strongly Negative | Boosted for error-prevention queries |
| -0.5 to -0.1 | Mildly Negative | Slightly boosted for risk-related queries |
| -0.1 to 0.1 | Neutral | No emotional bias in retrieval |
| 0.1 to 0.5 | Mildly Positive | Slightly boosted for recommendation queries |
| 0.5 to 1.0 | Strongly Positive | Boosted for success-pattern queries |

Emotional valence is extracted by the importance scoring LLM during memory encoding. Strongly emotional memories (|valence| > 0.7) receive an automatic +1 importance boost, reflecting the psychological finding that emotional events are remembered more vividly.

---

## 5. Database Schema (Drizzle ORM)

All relational memory data is stored in PostgreSQL using Drizzle ORM, with the `pgvector` extension providing native vector operations.

### 5.1 Episodic Memory Tables

```typescript
// packages/@mcv/db/src/schema/agentic-os/memory.ts

import { 
  pgTable, pgEnum, uuid, text, timestamp, jsonb, integer, 
  numeric, boolean, index, uniqueIndex, vector 
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { ventures, users } from '../core';

// ─── Enums ──────────────────────────────────────────────────────────────────

export const naosMemoryTypeEnum = pgEnum('naos_memory_type', [
  'working',
  'episodic', 
  'semantic',
  'procedural',
]);

export const naosMemoryStatusEnum = pgEnum('naos_memory_status', [
  'active',
  'consolidated', 
  'archived',
  'deleted',
]);

export const naosEpisodeTypeEnum = pgEnum('naos_episode_type', [
  'task_execution',
  'user_interaction',
  'error_recovery',
  'learning_moment',
  'decision_point',
  'escalation',
  'tool_execution',
  'memory_retrieval',
  'consolidation',
]);

export const naosEpisodeOutcomeEnum = pgEnum('naos_episode_outcome', [
  'success',
  'partial_success',
  'failure',
  'escalated',
  'timeout',
]);

export const naosFactStatusEnum = pgEnum('naos_fact_status', [
  'proposed',
  'active',
  'verified',
  'contradicted',
  'superseded',
  'archived',
]);

export const naosMemoryCategoryEnum = pgEnum('naos_memory_category', [
  'fact', 'definition', 'metric', 'status',
  'relationship', 'ownership', 'dependency', 'hierarchy',
  'event', 'deadline', 'schedule', 'milestone',
  'process', 'policy', 'preference', 'lesson_learned',
  'assessment', 'risk', 'opportunity', 'recommendation',
]);

// ─── Episodic Memories (Raw Traces) ────────────────────────────────────────

/**
 * Primary episodic memory table.
 * Records every agent interaction with full fidelity.
 * High volume, append-only, partitioned by venture_id + created_at.
 */
export const episodicMemories = pgTable('agent_episodic_memories', {
  id: uuid('id').primaryKey().defaultRandom(),
  ventureId: uuid('venture_id').notNull().references(() => ventures.id, { onDelete: 'cascade' }),
  agentId: text('agent_id').notNull(),
  sessionId: uuid('session_id').notNull(),
  requestId: uuid('request_id').notNull(),
  
  // Episode classification
  type: naosEpisodeTypeEnum('type').notNull(),
  category: naosMemoryCategoryEnum('category'),
  
  // Interaction data
  input: text('input').notNull(),
  output: text('output').notNull(),
  toolCalls: jsonb('tool_calls').$type<ToolCallRecord[]>(),
  reasoningTrace: text('reasoning_trace'),
  
  // Model information
  model: text('model').notNull(),
  modelTier: text('model_tier'),                    // 'frontier' | 'standard' | 'fast'
  
  // Metrics
  tokensIn: integer('tokens_in').notNull(),
  tokensOut: integer('tokens_out').notNull(),
  totalTokens: integer('total_tokens').notNull(),
  latencyMs: integer('latency_ms').notNull(),
  costUSD: numeric('cost_usd', { precision: 10, scale: 6 }).notNull(),
  
  // Importance scoring
  importance: integer('importance').default(5).notNull(),
  noveltyScore: numeric('novelty_score', { precision: 3, scale: 2 }),
  emotionalValence: numeric('emotional_valence', { precision: 3, scale: 2 }),
  decisionImpact: numeric('decision_impact', { precision: 3, scale: 2 }),
  
  // Vector embedding
  embedding: vector('embedding', { dimensions: 1024 }),
  embeddingModel: text('embedding_model'),
  
  // Outcome
  outcome: naosEpisodeOutcomeEnum('outcome'),
  outcomeDetails: text('outcome_details'),
  userSatisfaction: integer('user_satisfaction'),    // 1-5 if feedback collected
  
  // Context links
  parentEpisodeId: uuid('parent_episode_id'),
  parentTaskId: uuid('parent_task_id'),
  
  // Tags and metadata
  tags: text('tags').array(),
  metadata: jsonb('metadata').$type<Record<string, any>>(),
  
  // Consolidation tracking
  consolidatedAt: timestamp('consolidated_at', { withTimezone: true }),
  consolidationChunkIds: uuid('consolidation_chunk_ids').array(),
  
  // Status and lifecycle
  status: naosMemoryStatusEnum('status').default('active').notNull(),
  
  // Timestamps
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  lastAccessedAt: timestamp('last_accessed_at', { withTimezone: true }),
  expiresAt: timestamp('expires_at', { withTimezone: true }),
}, (table) => ({
  // Primary query indexes
  ventureTimeIdx: index('idx_episodic_venture_time')
    .on(table.ventureId, table.createdAt),
  agentTimeIdx: index('idx_episodic_agent_time')
    .on(table.agentId, table.createdAt),
  sessionIdx: index('idx_episodic_session')
    .on(table.sessionId, table.createdAt),
  requestIdx: index('idx_episodic_request')
    .on(table.requestId),
  
  // Importance-based queries
  importanceIdx: index('idx_episodic_importance')
    .on(table.ventureId, table.importance),
  
  // Consolidation queries
  unconsolidatedIdx: index('idx_episodic_unconsolidated')
    .on(table.ventureId, table.createdAt)
    .where(sql`consolidated_at IS NULL AND status = 'active'`),
  
  // Tag-based search
  tagsIdx: index('idx_episodic_tags')
    .using('gin', table.tags),
  
  // Vector similarity search (HNSW index for fast ANN)
  embeddingIdx: index('idx_episodic_embedding')
    .using('hnsw', table.embedding)
    .with({ m: 16, ef_construction: 64 }),
  
  // Status filter
  statusIdx: index('idx_episodic_status')
    .on(table.status),
}));

/**
 * Episodic event log — individual events within an episode.
 * Provides fine-grained timeline within each interaction.
 */
export const episodicEvents = pgTable('agent_episodic_events', {
  id: uuid('id').primaryKey().defaultRandom(),
  episodeId: uuid('episode_id').notNull().references(() => episodicMemories.id, { onDelete: 'cascade' }),
  ventureId: uuid('venture_id').notNull().references(() => ventures.id, { onDelete: 'cascade' }),
  
  // Event ordering
  sequence: integer('sequence').notNull(),
  
  // Event data
  type: text('type', { enum: ['input', 'reasoning', 'tool_call', 'tool_result', 'output', 'error', 'decision', 'memory_access'] }).notNull(),
  content: text('content').notNull(),
  metadata: jsonb('metadata').$type<Record<string, any>>(),
  
  // Timing
  timestamp: timestamp('timestamp', { withTimezone: true }).notNull(),
  durationMs: integer('duration_ms'),
  tokenCount: integer('token_count'),
  
  // References
  toolName: text('tool_name'),
  toolCallId: text('tool_call_id'),
  memoryId: uuid('memory_id'),           // If type is 'memory_access', link to the retrieved memory
  
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  episodeSeqIdx: index('idx_events_episode_seq')
    .on(table.episodeId, table.sequence),
  ventureTimeIdx: index('idx_events_venture_time')
    .on(table.ventureId, table.timestamp),
  typeIdx: index('idx_events_type')
    .on(table.type),
}));
```

### 5.2 Semantic Memory Tables

```typescript
// ─── Semantic Chunks (Consolidated Knowledge) ──────────────────────────────

/**
 * Semantic chunks — the atomic units of long-term memory.
 * Produced by the consolidation engine from episodic memories.
 * Also populated by document ingestion and manual input.
 */
export const semanticChunks = pgTable('agent_semantic_chunks', {
  id: uuid('id').primaryKey().defaultRandom(),
  ventureId: uuid('venture_id').notNull().references(() => ventures.id, { onDelete: 'cascade' }),
  
  // Content
  content: text('content').notNull(),
  summary: text('summary'),
  
  // Source tracking
  sourceType: text('source_type', { 
    enum: ['consolidation', 'document', 'manual', 'system'] 
  }).notNull(),
  sourceIds: uuid('source_ids').array(),  // Links to episodic memories or documents
  
  // Classification
  category: naosMemoryCategoryEnum('category'),
  
  // Vector representation
  embedding: vector('embedding', { dimensions: 1024 }),
  embeddingModel: text('embedding_model').default('voyage-3-large'),
  
  // Quality signals
  importance: integer('importance').default(5).notNull(),
  confidence: numeric('confidence', { precision: 3, scale: 2 }).default('0.80'),
  verificationStatus: naosFactStatusEnum('verification_status').default('active'),
  
  // Usage tracking
  accessCount: integer('access_count').default(0),
  lastAccessedAt: timestamp('last_accessed_at', { withTimezone: true }),
  
  // Decay
  decayScore: numeric('decay_score', { precision: 5, scale: 4 }).default('1.0000'),
  lastDecayAt: timestamp('last_decay_at', { withTimezone: true }),
  
  // Tags and metadata
  tags: text('tags').array(),
  metadata: jsonb('metadata').$type<Record<string, any>>(),
  
  // Lifecycle
  status: naosMemoryStatusEnum('status').default('active').notNull(),
  expiresAt: timestamp('expires_at', { withTimezone: true }),
  
  // Timestamps
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  // Primary query indexes
  ventureStatusIdx: index('idx_semantic_venture_status')
    .on(table.ventureId, table.status),
  categoryIdx: index('idx_semantic_category')
    .on(table.ventureId, table.category),
  importanceIdx: index('idx_semantic_importance')
    .on(table.ventureId, table.importance),
  
  // Vector similarity search
  embeddingIdx: index('idx_semantic_embedding')
    .using('hnsw', table.embedding)
    .with({ m: 16, ef_construction: 64 }),
  
  // Tag search
  tagsIdx: index('idx_semantic_tags')
    .using('gin', table.tags),
  
  // Source tracking
  sourceTypeIdx: index('idx_semantic_source_type')
    .on(table.sourceType),
  
  // Verification status
  verificationIdx: index('idx_semantic_verification')
    .on(table.verificationStatus),
  
  // Decay-based cleanup
  decayIdx: index('idx_semantic_decay')
    .on(table.decayScore, table.lastDecayAt),
}));

/**
 * Semantic facts — subject-predicate-object triples.
 * Structured knowledge extracted from semantic chunks and stored in both
 * PostgreSQL (for ACID queries) and Neo4j (for graph traversal).
 */
export const semanticFacts = pgTable('agent_semantic_facts', {
  id: uuid('id').primaryKey().defaultRandom(),
  ventureId: uuid('venture_id').notNull().references(() => ventures.id, { onDelete: 'cascade' }),
  
  // Triple structure
  subject: text('subject').notNull(),
  subjectType: text('subject_type').notNull(),
  predicate: text('predicate').notNull(),
  object: text('object').notNull(),
  objectType: text('object_type').notNull(),
  
  // Temporal validity
  validFrom: timestamp('valid_from', { withTimezone: true }),
  validUntil: timestamp('valid_until', { withTimezone: true }),
  
  // Confidence and provenance
  confidence: numeric('confidence', { precision: 3, scale: 2 }).notNull(),
  source: text('source', { 
    enum: ['consolidation', 'document_ingestion', 'user_stated', 'agent_inferred', 'system_generated', 'external_api'] 
  }).notNull(),
  sourceIds: uuid('source_ids').array(),
  
  // Graph sync
  neo4jNodeId: text('neo4j_node_id'),       // Corresponding Neo4j node ID
  neo4jSynced: boolean('neo4j_synced').default(false),
  lastSyncedAt: timestamp('last_synced_at', { withTimezone: true }),
  
  // Contradiction tracking
  contradictedBy: uuid('contradicted_by').array(),
  supersededBy: uuid('superseded_by'),
  
  // Status
  status: naosFactStatusEnum('status').default('proposed').notNull(),
  
  // Metadata
  tags: text('tags').array(),
  metadata: jsonb('metadata').$type<Record<string, any>>(),
  
  // Timestamps
  extractedAt: timestamp('extracted_at', { withTimezone: true }).defaultNow().notNull(),
  lastVerifiedAt: timestamp('last_verified_at', { withTimezone: true }),
  verificationCount: integer('verification_count').default(0),
  
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  // Triple lookup
  subjectIdx: index('idx_facts_subject')
    .on(table.ventureId, table.subject, table.subjectType),
  predicateIdx: index('idx_facts_predicate')
    .on(table.ventureId, table.predicate),
  objectIdx: index('idx_facts_object')
    .on(table.ventureId, table.object, table.objectType),
  
  // Temporal validity
  validityIdx: index('idx_facts_validity')
    .on(table.validFrom, table.validUntil),
  
  // Status filter
  statusIdx: index('idx_facts_status')
    .on(table.ventureId, table.status),
  
  // Graph sync
  syncIdx: index('idx_facts_unsync')
    .on(table.neo4jSynced)
    .where(sql`neo4j_synced = false`),
  
  // Confidence ranking
  confidenceIdx: index('idx_facts_confidence')
    .on(table.ventureId, table.confidence),
}));
```

### 5.3 Memory Association Tables

```typescript
// ─── Memory Associations ───────────────────────────────────────────────────

/**
 * Memory associations — links between related memory entries.
 * Captures "this memory is related to that memory" relationships
 * that don't fit into the formal knowledge graph.
 */
export const memoryAssociations = pgTable('agent_memory_associations', {
  id: uuid('id').primaryKey().defaultRandom(),
  ventureId: uuid('venture_id').notNull().references(() => ventures.id, { onDelete: 'cascade' }),
  
  // Association endpoints
  sourceMemoryId: uuid('source_memory_id').notNull(),
  sourceMemoryType: naosMemoryTypeEnum('source_memory_type').notNull(),
  targetMemoryId: uuid('target_memory_id').notNull(),
  targetMemoryType: naosMemoryTypeEnum('target_memory_type').notNull(),
  
  // Association metadata
  associationType: text('association_type', {
    enum: ['causal', 'temporal', 'topical', 'contradictory', 'supporting', 'derived_from', 'supersedes']
  }).notNull(),
  strength: numeric('strength', { precision: 3, scale: 2 }).notNull(),  // 0.0-1.0
  bidirectional: boolean('bidirectional').default(true),
  
  // Context
  reason: text('reason'),             // Why this association exists
  createdBy: text('created_by'),      // 'consolidation' | 'agent' | 'manual'
  
  // Timestamps
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  sourceIdx: index('idx_assoc_source')
    .on(table.sourceMemoryId, table.sourceMemoryType),
  targetIdx: index('idx_assoc_target')
    .on(table.targetMemoryId, table.targetMemoryType),
  typeIdx: index('idx_assoc_type')
    .on(table.associationType),
  ventureIdx: index('idx_assoc_venture')
    .on(table.ventureId),
}));

/**
 * Memory embeddings — supplementary embedding table for hybrid search.
 * Stores multiple embedding representations per memory entry.
 */
export const memoryEmbeddings = pgTable('agent_memory_embeddings', {
  id: uuid('id').primaryKey().defaultRandom(),
  memoryId: uuid('memory_id').notNull(),
  memoryType: naosMemoryTypeEnum('memory_type').notNull(),
  ventureId: uuid('venture_id').notNull().references(() => ventures.id, { onDelete: 'cascade' }),
  
  // Embedding data
  embedding: vector('embedding', { dimensions: 1024 }).notNull(),
  model: text('model').notNull(),             // 'voyage-3-large', 'text-embedding-3-large', etc.
  dimensions: integer('dimensions').notNull(),
  
  // Embedding metadata
  chunkIndex: integer('chunk_index').default(0),  // For multi-chunk memories
  chunkContent: text('chunk_content'),             // The text this embedding represents
  
  // Timestamps
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  memoryIdx: index('idx_embeddings_memory')
    .on(table.memoryId, table.memoryType),
  ventureIdx: index('idx_embeddings_venture')
    .on(table.ventureId),
  embeddingIdx: index('idx_embeddings_vector')
    .using('hnsw', table.embedding)
    .with({ m: 16, ef_construction: 64 }),
}));
```

### 5.4 Consolidation Tracking Tables

```typescript
// ─── Consolidation Management ──────────────────────────────────────────────

/**
 * Memory consolidation runs — tracks each consolidation cycle.
 */
export const memoryConsolidations = pgTable('agent_memory_consolidations', {
  id: uuid('id').primaryKey().defaultRandom(),
  ventureId: uuid('venture_id').notNull().references(() => ventures.id, { onDelete: 'cascade' }),
  
  // Run identification
  runType: text('run_type', { 
    enum: ['scheduled', 'manual', 'triggered', 'emergency'] 
  }).notNull(),
  
  // Scope
  agentId: text('agent_id'),               // Null = all agents in venture
  startEpisodeId: uuid('start_episode_id'),
  endEpisodeId: uuid('end_episode_id'),
  
  // Results
  episodesProcessed: integer('episodes_processed').default(0),
  chunksCreated: integer('chunks_created').default(0),
  factsExtracted: integer('facts_extracted').default(0),
  associationsCreated: integer('associations_created').default(0),
  memoriesDecayed: integer('memories_decayed').default(0),
  memoriesArchived: integer('memories_archived').default(0),
  memoriesDeleted: integer('memories_deleted').default(0),
  
  // Costs
  tokensUsed: integer('tokens_used').default(0),
  costUSD: numeric('cost_usd', { precision: 10, scale: 6 }).default('0'),
  
  // Timing
  startedAt: timestamp('started_at', { withTimezone: true }).notNull(),
  completedAt: timestamp('completed_at', { withTimezone: true }),
  durationMs: integer('duration_ms'),
  
  // Status
  status: text('status', { 
    enum: ['running', 'completed', 'failed', 'cancelled'] 
  }).notNull(),
  error: text('error'),
  
  // Metadata
  config: jsonb('config').$type<ConsolidationConfig>(),
  
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  ventureTimeIdx: index('idx_consolidation_venture_time')
    .on(table.ventureId, table.startedAt),
  statusIdx: index('idx_consolidation_status')
    .on(table.status),
}));

/**
 * Memory access log — records every memory retrieval for analytics and audit.
 */
export const memoryAccessLog = pgTable('agent_memory_access_log', {
  id: uuid('id').primaryKey().defaultRandom(),
  ventureId: uuid('venture_id').notNull().references(() => ventures.id, { onDelete: 'cascade' }),
  
  // What was accessed
  memoryId: uuid('memory_id').notNull(),
  memoryType: naosMemoryTypeEnum('memory_type').notNull(),
  
  // Who accessed it
  agentId: text('agent_id').notNull(),
  sessionId: uuid('session_id'),
  requestId: uuid('request_id'),
  
  // How it was accessed
  accessType: text('access_type', { 
    enum: ['vector_search', 'graph_query', 'temporal_query', 'direct_lookup', 'deep_rag'] 
  }).notNull(),
  query: text('query'),                    // The query that triggered this access
  
  // Relevance
  similarityScore: numeric('similarity_score', { precision: 5, scale: 4 }),
  rankPosition: integer('rank_position'),
  wasUsedInResponse: boolean('was_used_in_response'),
  
  // Impact
  impactScore: numeric('impact_score', { precision: 3, scale: 2 }),  // 0-1, how much it influenced output
  
  // Timing
  latencyMs: integer('latency_ms'),
  
  accessedAt: timestamp('accessed_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  memoryIdx: index('idx_access_memory')
    .on(table.memoryId, table.memoryType),
  agentIdx: index('idx_access_agent')
    .on(table.agentId, table.accessedAt),
  ventureTimeIdx: index('idx_access_venture_time')
    .on(table.ventureId, table.accessedAt),
}));
```

### 5.5 Unified Memory Entry Table

```typescript
// ─── Unified Memory Entries ────────────────────────────────────────────────

/**
 * Unified memory entries — the primary table for the MemoryStore API.
 * Provides a single interface across all memory types.
 * Individual type tables (episodic, semantic) hold type-specific data.
 */
export const naosMemoryEntries = pgTable('naos_memory_entries', {
  id: uuid('id').primaryKey().defaultRandom(),
  ventureId: uuid('venture_id').notNull().references(() => ventures.id, { onDelete: 'cascade' }),
  agentId: text('agent_id').notNull(),
  
  // Memory classification
  type: naosMemoryTypeEnum('type').notNull(),
  category: naosMemoryCategoryEnum('category'),
  
  // Content
  content: text('content').notNull(),
  summary: text('summary'),
  
  // Importance
  importance: integer('importance').default(5).notNull(),
  
  // Vector
  embedding: vector('embedding', { dimensions: 1024 }),
  
  // Links
  sourceTableId: uuid('source_table_id'),     // ID in the type-specific table
  sourceTable: text('source_table'),           // 'episodic_memories' | 'semantic_chunks' | etc.
  
  // Tags
  tags: text('tags').array(),
  metadata: jsonb('metadata').$type<Record<string, any>>(),
  
  // Status
  status: naosMemoryStatusEnum('status').default('active').notNull(),
  
  // Timestamps
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  lastAccessedAt: timestamp('last_accessed_at', { withTimezone: true }),
  expiresAt: timestamp('expires_at', { withTimezone: true }),
}, (table) => ({
  ventureTypeIdx: index('idx_memory_entries_venture_type')
    .on(table.ventureId, table.type, table.status),
  agentIdx: index('idx_memory_entries_agent')
    .on(table.agentId, table.type),
  importanceIdx: index('idx_memory_entries_importance')
    .on(table.ventureId, table.importance),
  embeddingIdx: index('idx_memory_entries_embedding')
    .using('hnsw', table.embedding)
    .with({ m: 16, ef_construction: 64 }),
  tagsIdx: index('idx_memory_entries_tags')
    .using('gin', table.tags),
}));

// ─── Relations ─────────────────────────────────────────────────────────────

export const episodicMemoriesRelations = relations(episodicMemories, ({ one, many }) => ({
  venture: one(ventures, {
    fields: [episodicMemories.ventureId],
    references: [ventures.id],
  }),
  events: many(episodicEvents),
  parentEpisode: one(episodicMemories, {
    fields: [episodicMemories.parentEpisodeId],
    references: [episodicMemories.id],
  }),
}));

export const episodicEventsRelations = relations(episodicEvents, ({ one }) => ({
  episode: one(episodicMemories, {
    fields: [episodicEvents.episodeId],
    references: [episodicMemories.id],
  }),
}));

export const semanticChunksRelations = relations(semanticChunks, ({ one }) => ({
  venture: one(ventures, {
    fields: [semanticChunks.ventureId],
    references: [ventures.id],
  }),
}));

export const semanticFactsRelations = relations(semanticFacts, ({ one }) => ({
  venture: one(ventures, {
    fields: [semanticFacts.ventureId],
    references: [ventures.id],
  }),
}));
```

### 5.6 Database Migrations

```sql
-- Migration: 001_create_memory_tables.sql
-- Creates all memory tables with proper extensions and indexes

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS vector;        -- pgvector for embeddings
CREATE EXTENSION IF NOT EXISTS pg_trgm;       -- Trigram similarity for fuzzy text search
CREATE EXTENSION IF NOT EXISTS btree_gin;     -- GIN indexing for arrays

-- Create enums
CREATE TYPE naos_memory_type AS ENUM ('working', 'episodic', 'semantic', 'procedural');
CREATE TYPE naos_memory_status AS ENUM ('active', 'consolidated', 'archived', 'deleted');
CREATE TYPE naos_episode_type AS ENUM (
  'task_execution', 'user_interaction', 'error_recovery', 'learning_moment',
  'decision_point', 'escalation', 'tool_execution', 'memory_retrieval', 'consolidation'
);
CREATE TYPE naos_episode_outcome AS ENUM ('success', 'partial_success', 'failure', 'escalated', 'timeout');
CREATE TYPE naos_fact_status AS ENUM ('proposed', 'active', 'verified', 'contradicted', 'superseded', 'archived');
CREATE TYPE naos_memory_category AS ENUM (
  'fact', 'definition', 'metric', 'status',
  'relationship', 'ownership', 'dependency', 'hierarchy',
  'event', 'deadline', 'schedule', 'milestone',
  'process', 'policy', 'preference', 'lesson_learned',
  'assessment', 'risk', 'opportunity', 'recommendation'
);

-- Create tables (DDL generated by Drizzle Kit from the schema above)
-- [Drizzle Kit generates the CREATE TABLE statements from the TypeScript schema]

-- Partitioning for high-volume episodic memories
-- (Applied as a post-migration step for ventures exceeding 1M rows)
-- CREATE TABLE agent_episodic_memories_partitioned (LIKE agent_episodic_memories INCLUDING ALL)
-- PARTITION BY RANGE (created_at);
-- 
-- CREATE TABLE episodic_2026_01 PARTITION OF agent_episodic_memories_partitioned
--   FOR VALUES FROM ('2026-01-01') TO ('2026-02-01');
-- CREATE TABLE episodic_2026_02 PARTITION OF agent_episodic_memories_partitioned
--   FOR VALUES FROM ('2026-02-01') TO ('2026-03-01');
-- ... etc.
```

---

## 6. Knowledge Graph Schema (Neo4j)

The Neo4j knowledge graph provides structured relationship storage that complements the vector-based semantic search. While vectors capture "this text is similar to that text," the graph captures "this entity has a specific relationship to that entity."

### 6.1 Core Node Types

```cypher
// ─── Core Entity Nodes ─────────────────────────────────────────────────────

// Venture — a business entity within the MCV consortium
(:Venture {
  id: String,           // UUID matching PostgreSQL ventures table
  name: String,
  slug: String,
  domain: String,
  status: String,       // 'active' | 'dormant' | 'exited'
  ventureId: String,    // Self-referencing for query consistency
  createdAt: DateTime
})

// Organization — any company, agency, or institution
(:Organization {
  id: String,
  name: String,
  type: String,         // 'company' | 'agency' | 'regulator' | 'vendor' | 'partner'
  jurisdiction: String,
  status: String,
  ventureId: String,    // Which venture's knowledge graph this belongs to
  createdAt: DateTime
})

// Person — any individual referenced in agent interactions
(:Person {
  id: String,
  name: String,
  email: String,
  roles: [String],
  ventureId: String,
  createdAt: DateTime
})

// Document — any document processed by the system
(:Document {
  id: String,
  type: String,         // 'contract' | 'license' | 'invoice' | 'report' | 'email' | 'memo'
  title: String,
  status: String,       // 'draft' | 'active' | 'expired' | 'archived'
  gcsPath: String,      // Google Cloud Storage path
  ventureId: String,
  createdAt: DateTime
})

// Contract — a legal agreement
(:Contract {
  id: String,
  title: String,
  type: String,         // 'service' | 'license' | 'employment' | 'nda' | 'partnership'
  status: String,       // 'draft' | 'pending' | 'active' | 'expired' | 'terminated'
  value: Float,
  currency: String,
  effectiveDate: DateTime,
  expirationDate: DateTime,
  ventureId: String,
  createdAt: DateTime
})

// Product — a product or service offered by a venture
(:Product {
  id: String,
  name: String,
  type: String,
  status: String,
  ventureId: String,
  createdAt: DateTime
})

// License — a regulatory license or permit
(:License {
  id: String,
  number: String,
  type: String,
  issuedBy: String,
  issuedDate: DateTime,
  expirationDate: DateTime,
  status: String,       // 'active' | 'pending' | 'expired' | 'revoked'
  ventureId: String,
  createdAt: DateTime
})

// Jurisdiction — a regulatory jurisdiction
(:Jurisdiction {
  id: String,
  name: String,
  country: String,
  type: String,         // 'country' | 'state' | 'city' | 'special_zone'
  createdAt: DateTime
})

// Transaction — a financial transaction
(:Transaction {
  id: String,
  type: String,         // 'payment' | 'invoice' | 'refund' | 'transfer' | 'fee'
  amount: Float,
  currency: String,
  status: String,
  date: DateTime,
  ventureId: String,
  createdAt: DateTime
})

// Concept — an abstract concept or topic
(:Concept {
  id: String,
  name: String,
  domain: String,
  description: String,
  ventureId: String,
  createdAt: DateTime
})

// Task — a tracked task or work item
(:Task {
  id: String,
  title: String,
  type: String,
  status: String,
  priority: String,
  assignedTo: String,
  ventureId: String,
  createdAt: DateTime
})
```

### 6.2 Relationship Types

```cypher
// ─── Strategic Relationships ───────────────────────────────────────────────

// Employment & Roles
(:Person)-[:WORKS_FOR {role: String, department: String, startedAt: DateTime, endedAt: DateTime}]->(:Organization)
(:Person)-[:MANAGES {since: DateTime}]->(:Person)
(:Person)-[:REPORTS_TO {since: DateTime}]->(:Person)
(:Person)-[:MEMBER_OF {role: String}]->(:Organization)

// Ownership & Control
(:Organization)-[:OWNS {equityPercent: Float, acquiredAt: DateTime}]->(:Organization)
(:Person)-[:OWNS {equityPercent: Float}]->(:Organization)
(:Venture)-[:SUBSIDIARY_OF]->(:Organization)
(:Organization)-[:CONTROLS {type: String}]->(:Organization)

// Authorization & Access
(:Person)-[:AUTHORIZED_FOR {permissionLevel: String, grantedAt: DateTime, expiresAt: DateTime}]->(:Venture)
(:Person)-[:APPROVED {decision: String, timestamp: DateTime}]->(:Task)
(:Person)-[:SIGNED {timestamp: DateTime, role: String}]->(:Document)

// Contractual
(:Contract)-[:PARTIES_TO]->(:Organization)
(:Contract)-[:GOVERNED_BY]->(:Jurisdiction)
(:Contract)-[:RELATES_TO]->(:Product)
(:Document)-[:ATTACHMENT_OF]->(:Contract)

// Licensing & Regulatory
(:License)-[:ISSUED_BY]->(:Organization)
(:License)-[:HELD_BY]->(:Organization)
(:License)-[:VALID_IN]->(:Jurisdiction)
(:Organization)-[:REGULATED_BY]->(:Organization)

// Vendor & Service
(:Organization)-[:USES_VENDOR {since: DateTime, serviceType: String}]->(:Organization)
(:Organization)-[:PROVIDES_SERVICE {serviceType: String}]->(:Organization)
(:Organization)-[:LOCATED_IN]->(:Jurisdiction)

// Financial
(:Transaction)-[:FROM]->(:Organization)
(:Transaction)-[:TO]->(:Organization)
(:Transaction)-[:INVOLVES]->(:Product)
(:Transaction)-[:AUTHORIZED_BY]->(:Person)

// Knowledge & Context
(:Document)-[:CONTEXT_FOR]->(:Task)
(:Concept)-[:RELATED_TO]->(:Concept)
(:Concept)-[:APPLIES_TO]->(:Venture)

// Temporal & Causal
(:Task)-[:DEPENDS_ON]->(:Task)
(:Task)-[:TRIGGERED_BY]->(:Task)
(:Document)-[:SUPERSEDES]->(:Document)
```

### 6.3 Complex Query Examples

#### 6.3.1 Cross-Venture Vendor Exposure

Find all vendors shared between two ventures in a specific jurisdiction:

```cypher
MATCH (v1:Venture {slug: 'betedge'})-[:USES_VENDOR]->(vendor:Organization)
MATCH (v2:Venture {slug: 'mcv-studios'})-[:USES_VENDOR]->(vendor)
MATCH (vendor)-[:LOCATED_IN]->(j:Jurisdiction {name: 'Malta'})
OPTIONAL MATCH (vendor)-[:PARTIES_TO]->(c:Contract)
RETURN 
  vendor.name AS vendor,
  collect(DISTINCT c.title) AS contracts,
  collect(DISTINCT c.status) AS contractStatuses,
  collect(DISTINCT c.expirationDate) AS expirations
ORDER BY vendor.name
```

#### 6.3.2 Authorization Chain

Find who can approve a specific type of operation:

```cypher
MATCH (p:Person)-[:AUTHORIZED_FOR {permissionLevel: 'admin'}]->(v:Venture {slug: 'betedge'})
WHERE p.roles CONTAINS 'director' OR p.roles CONTAINS 'cfo'
OPTIONAL MATCH (p)-[:MANAGES]->(subordinate:Person)
RETURN 
  p.name AS approver,
  p.roles AS roles,
  collect(subordinate.name) AS directReports
ORDER BY p.name
```

#### 6.3.3 License Expiration Risk

Find all licenses expiring within 90 days:

```cypher
MATCH (l:License)-[:HELD_BY]->(org:Organization)
MATCH (l)-[:VALID_IN]->(j:Jurisdiction)
WHERE l.expirationDate <= datetime() + duration({days: 90})
  AND l.status = 'active'
RETURN 
  org.name AS organization,
  l.number AS licenseNumber,
  l.type AS licenseType,
  j.name AS jurisdiction,
  l.expirationDate AS expires,
  duration.between(datetime(), l.expirationDate).days AS daysRemaining
ORDER BY daysRemaining ASC
```

#### 6.3.4 Contract Dependency Graph

Find all contracts and their dependent relationships:

```cypher
MATCH path = (c1:Contract)-[:RELATES_TO*1..3]->(c2:Contract)
WHERE c1.ventureId = $ventureId
  AND c1.status = 'active'
RETURN 
  c1.title AS sourceContract,
  [n IN nodes(path) | n.title] AS contractChain,
  length(path) AS depth
ORDER BY depth DESC
LIMIT 50
```

### 6.4 Entity Extraction Pipeline

The entity extraction system converts unstructured episodic memories into structured graph nodes and relationships:

```typescript
// @mcv/agentic-os/memory/entity-extractor.ts

export class EntityExtractor {
  private llmClient: IntelligenceClient;
  private graphDB: Neo4jClient;
  
  /**
   * Extract entities and relationships from a memory entry.
   * Uses a specialized LLM prompt for Named Entity Recognition (NER)
   * and Relationship Extraction (RE).
   */
  async extract(memory: EpisodicMemory): Promise<ExtractionResult> {
    // 1. Run NER + RE prompt
    const extraction = await this.llmClient.complete({
      model: 'claude-sonnet-4-20250514',  // Good balance of cost vs. quality for extraction
      systemPrompt: ENTITY_EXTRACTION_SYSTEM_PROMPT,
      userPrompt: this.formatExtractionPrompt(memory),
      responseFormat: 'json',
      temperature: 0.1,  // Low temperature for factual extraction
    });
    
    // 2. Validate extracted entities against schema
    const validated = this.validateExtraction(extraction);
    
    // 3. Deduplicate against existing graph entities
    const deduplicated = await this.deduplicateEntities(validated);
    
    // 4. Upsert into Neo4j
    const graphResult = await this.upsertToGraph(deduplicated);
    
    // 5. Mirror to PostgreSQL semantic_facts table
    await this.mirrorToPostgres(deduplicated);
    
    return {
      entitiesCreated: graphResult.nodesCreated,
      entitiesUpdated: graphResult.nodesUpdated,
      relationshipsCreated: graphResult.relsCreated,
      relationshipsUpdated: graphResult.relsUpdated,
    };
  }
  
  /**
   * Deduplicate entities against the existing graph.
   * Uses fuzzy matching on entity names + type to avoid duplicates.
   */
  private async deduplicateEntities(extraction: ValidatedExtraction): Promise<DeduplicatedExtraction> {
    const results: DeduplicatedExtraction = {
      newEntities: [],
      existingEntities: [],
      newRelationships: [],
      updatedRelationships: [],
    };
    
    for (const entity of extraction.entities) {
      // Search for existing entity with similar name and same type
      const existing = await this.graphDB.query(`
        MATCH (n:${entity.type} {ventureId: $ventureId})
        WHERE toLower(n.name) = toLower($name) 
           OR n.name CONTAINS $name 
           OR $name CONTAINS n.name
        RETURN n
        LIMIT 5
      `, { ventureId: entity.ventureId, name: entity.name });
      
      if (existing.records.length > 0) {
        // Found existing entity — merge
        results.existingEntities.push({
          ...entity,
          existingId: existing.records[0].get('n').properties.id,
        });
      } else {
        // New entity
        results.newEntities.push(entity);
      }
    }
    
    return results;
  }
}

// Entity extraction system prompt
const ENTITY_EXTRACTION_SYSTEM_PROMPT = `
You are a Knowledge Extraction Agent for the MCV.ONE Agentic Operating System.
Your task is to extract structured entities and relationships from agent interaction logs.

ENTITY TYPES: Person, Organization, Venture, Document, Contract, Product, License, Jurisdiction, Transaction, Concept, Task

RELATIONSHIP TYPES: WORKS_FOR, MANAGES, REPORTS_TO, OWNS, AUTHORIZED_FOR, SIGNED, PARTIES_TO, GOVERNED_BY, ISSUED_BY, HELD_BY, VALID_IN, USES_VENDOR, PROVIDES_SERVICE, LOCATED_IN, INVOLVES, CONTEXT_FOR, RELATED_TO, DEPENDS_ON, SUPERSEDES

RULES:
1. Only extract entities and relationships explicitly mentioned or strongly implied in the text.
2. Do NOT infer relationships not supported by the text.
3. Include temporal properties (dates, durations) when mentioned.
4. Flag confidence level for each extraction (high/medium/low).
5. Use consistent naming (e.g., "Malta Gaming Authority" not "MGA" unless alias is specified).

OUTPUT FORMAT:
{
  "entities": [
    { "type": "EntityType", "name": "Name", "properties": { ... }, "confidence": "high|medium|low" }
  ],
  "relationships": [
    { "subject": "Name", "predicate": "RELATIONSHIP_TYPE", "object": "Name", "properties": { ... }, "confidence": "high|medium|low" }
  ]
}
`;
```

---

## 7. Embedding & Vector Search

The embedding subsystem converts text-based memories into dense vector representations, enabling semantic similarity search across the entire memory corpus.

### 7.1 Embedding Architecture

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                        EMBEDDING PIPELINE                                     │
│                                                                               │
│  ┌──────────┐     ┌──────────┐     ┌──────────┐     ┌──────────┐           │
│  │  Text    │ ──→ │  Chunk   │ ──→ │  Embed   │ ──→ │  Store   │           │
│  │  Input   │     │  Split   │     │  Generate │     │  Index   │           │
│  │          │     │          │     │          │     │          │           │
│  │ Raw text │     │ 512-tok  │     │ Voyage/  │     │ pgvector │           │
│  │ from     │     │ chunks   │     │ OpenAI   │     │ Pinecone │           │
│  │ memory   │     │ with     │     │ API call │     │ (dual)   │           │
│  │ entry    │     │ overlap  │     │          │     │          │           │
│  └──────────┘     └──────────┘     └──────────┘     └──────────┘           │
│                                                                               │
└──────────────────────────────────────────────────────────────────────────────┘
```

### 7.2 Embedding Models

The system supports multiple embedding models, configurable per venture:

| Model | Provider | Dimensions | Context | Cost (per 1M tokens) | Use Case |
|---|---|---|---|---|---|
| `voyage-3-large` | Voyage AI | 1024 | 32K | $0.18 | **Default** — best quality/cost ratio |
| `voyage-3-lite` | Voyage AI | 512 | 32K | $0.02 | High-volume, cost-sensitive workloads |
| `text-embedding-3-large` | OpenAI | 3072/1536 | 8K | $0.13 | Alternative when Voyage is unavailable |
| `text-embedding-3-small` | OpenAI | 1536/512 | 8K | $0.02 | Budget option |
| `voyage-code-3` | Voyage AI | 1024 | 32K | $0.18 | Code-specific memories (Smith pod) |

### 7.3 Chunking Strategy

The text splitter uses a recursive strategy that respects document structure:

```typescript
// @mcv/agentic-os/memory/chunker.ts

export class MemoryChunker {
  private readonly targetChunkSize = 512;    // Target tokens per chunk
  private readonly chunkOverlap = 64;        // Overlap tokens between chunks
  private readonly minChunkSize = 100;       // Minimum viable chunk size
  
  /**
   * Split text into semantic chunks.
   * Uses a hierarchy of separators to find natural break points.
   */
  split(text: string): ChunkResult[] {
    // Separator hierarchy (try each in order)
    const separators = [
      '\n\n\n',    // Triple newline (section breaks)
      '\n\n',      // Double newline (paragraph breaks)
      '\n',        // Single newline (line breaks)
      '. ',        // Sentence endings
      ', ',        // Clause breaks
      ' ',         // Word boundaries (last resort)
    ];
    
    return this.recursiveSplit(text, separators, 0);
  }
  
  private recursiveSplit(
    text: string, 
    separators: string[], 
    separatorIndex: number
  ): ChunkResult[] {
    if (this.tokenCount(text) <= this.targetChunkSize) {
      return [{
        content: text.trim(),
        tokenCount: this.tokenCount(text),
        startOffset: 0,
        endOffset: text.length,
      }];
    }
    
    if (separatorIndex >= separators.length) {
      // Force split at target size
      return this.forceSplit(text);
    }
    
    const separator = separators[separatorIndex];
    const segments = text.split(separator);
    
    if (segments.length <= 1) {
      // This separator doesn't help — try the next one
      return this.recursiveSplit(text, separators, separatorIndex + 1);
    }
    
    // Merge segments into chunks of target size
    return this.mergeSegments(segments, separator, separators, separatorIndex);
  }
  
  /**
   * Apply overlap between chunks for context continuity.
   */
  private applyOverlap(chunks: ChunkResult[]): ChunkResult[] {
    if (chunks.length <= 1) return chunks;
    
    return chunks.map((chunk, i) => {
      if (i === 0) return chunk;
      
      // Prepend the last N tokens of the previous chunk
      const prevChunk = chunks[i - 1];
      const overlapText = this.getLastNTokens(prevChunk.content, this.chunkOverlap);
      
      return {
        ...chunk,
        content: overlapText + ' ' + chunk.content,
        tokenCount: chunk.tokenCount + this.chunkOverlap,
        hasOverlap: true,
      };
    });
  }
}
```

### 7.4 Embedding Generation

```typescript
// @mcv/agentic-os/memory/embedding-client.ts

export class EmbeddingClient {
  private intelligenceClient: IntelligenceClient;
  private batchSize = 100;         // Max items per API call
  private rateLimiter: RateLimiter;
  
  constructor(config: EmbeddingConfig) {
    this.intelligenceClient = new IntelligenceClient(config.intelligenceEndpoint);
    this.rateLimiter = new RateLimiter({
      maxRequestsPerSecond: config.maxRPS || 50,
      maxTokensPerMinute: config.maxTPM || 1_000_000,
    });
  }
  
  /**
   * Generate embeddings for one or more text chunks.
   * Automatically batches, rate-limits, and retries.
   */
  async embed(texts: string[], options?: EmbedOptions): Promise<EmbeddingResult[]> {
    const model = options?.model || 'voyage-3-large';
    const results: EmbeddingResult[] = [];
    
    // Process in batches
    for (let i = 0; i < texts.length; i += this.batchSize) {
      const batch = texts.slice(i, i + this.batchSize);
      
      await this.rateLimiter.acquire(batch.reduce((sum, t) => sum + this.tokenCount(t), 0));
      
      const response = await this.intelligenceClient.embed({
        model,
        input: batch,
        inputType: options?.inputType || 'document',  // 'document' for storage, 'query' for search
        truncation: true,
      });
      
      results.push(...response.embeddings.map((embedding, idx) => ({
        embedding: embedding.values,
        dimensions: embedding.values.length,
        model,
        tokenCount: response.usage.totalTokens / batch.length,
        text: batch[idx],
      })));
    }
    
    return results;
  }
  
  /**
   * Generate a query embedding optimized for search.
   * Query embeddings use a different input type for asymmetric search.
   */
  async embedQuery(query: string, options?: EmbedOptions): Promise<number[]> {
    const result = await this.embed([query], {
      ...options,
      inputType: 'query',
    });
    return result[0].embedding;
  }
}
```

### 7.5 Vector Storage (Dual-Write)

Embeddings are stored in both pgvector (for ACID-compliant queries with SQL joins) and Pinecone (for high-performance approximate nearest neighbor search):

```typescript
// @mcv/agentic-os/memory/vector-store.ts

export class VectorStore {
  private pgClient: DrizzleClient;
  private pinecone: PineconeClient;
  
  /**
   * Store an embedding in both pgvector and Pinecone.
   * pgvector provides ACID compliance and SQL join capability.
   * Pinecone provides sub-10ms ANN search at scale.
   */
  async store(entry: VectorStoreEntry): Promise<void> {
    // Dual write with transaction semantics
    await Promise.all([
      // pgvector write
      this.pgClient.insert(memoryEmbeddings).values({
        memoryId: entry.memoryId,
        memoryType: entry.memoryType,
        ventureId: entry.ventureId,
        embedding: entry.embedding,
        model: entry.model,
        dimensions: entry.dimensions,
        chunkIndex: entry.chunkIndex,
        chunkContent: entry.chunkContent,
      }),
      
      // Pinecone write
      this.pinecone.upsert({
        namespace: entry.ventureId,  // Venture-scoped namespace for isolation
        vectors: [{
          id: `${entry.memoryId}-${entry.chunkIndex}`,
          values: entry.embedding,
          metadata: {
            memoryId: entry.memoryId,
            memoryType: entry.memoryType,
            ventureId: entry.ventureId,
            agentId: entry.agentId,
            importance: entry.importance,
            category: entry.category,
            tags: entry.tags,
            createdAt: entry.createdAt.toISOString(),
          },
        }],
      }),
    ]);
  }
  
  /**
   * Search for similar vectors.
   * Uses Pinecone for speed, falls back to pgvector if Pinecone is unavailable.
   */
  async search(query: VectorSearchQuery): Promise<VectorSearchResult[]> {
    try {
      // Primary: Pinecone (fastest)
      const results = await this.pinecone.query({
        namespace: query.ventureId,
        vector: query.embedding,
        topK: query.topK || 20,
        includeMetadata: true,
        filter: this.buildPineconeFilter(query),
      });
      
      return results.matches.map(match => ({
        memoryId: match.metadata.memoryId as string,
        memoryType: match.metadata.memoryType as string,
        score: match.score,
        metadata: match.metadata,
      }));
    } catch (error) {
      // Fallback: pgvector
      console.warn('Pinecone unavailable, falling back to pgvector', error);
      return this.pgVectorSearch(query);
    }
  }
  
  /**
   * pgvector fallback search using cosine distance.
   */
  private async pgVectorSearch(query: VectorSearchQuery): Promise<VectorSearchResult[]> {
    const results = await this.pgClient.execute(sql`
      SELECT 
        memory_id,
        memory_type,
        1 - (embedding <=> ${query.embedding}::vector) AS score,
        chunk_content
      FROM agent_memory_embeddings
      WHERE venture_id = ${query.ventureId}
      ${query.memoryType ? sql`AND memory_type = ${query.memoryType}` : sql``}
      ORDER BY embedding <=> ${query.embedding}::vector
      LIMIT ${query.topK || 20}
    `);
    
    return results.rows.map(row => ({
      memoryId: row.memory_id,
      memoryType: row.memory_type,
      score: row.score,
      metadata: {},
    }));
  }
  
  /**
   * Build Pinecone metadata filter from search query.
   */
  private buildPineconeFilter(query: VectorSearchQuery): Record<string, any> {
    const filter: Record<string, any> = {};
    
    if (query.memoryType) filter.memoryType = query.memoryType;
    if (query.agentId) filter.agentId = query.agentId;
    if (query.minImportance) filter.importance = { $gte: query.minImportance };
    if (query.category) filter.category = { $in: Array.isArray(query.category) ? query.category : [query.category] };
    if (query.tags?.length) filter.tags = { $in: query.tags };
    if (query.createdAfter) filter.createdAt = { $gte: query.createdAfter.toISOString() };
    if (query.createdBefore) filter.createdAt = { ...filter.createdAt, $lte: query.createdBefore.toISOString() };
    
    return filter;
  }
}
```

### 7.6 pgvector Index Configuration

```sql
-- HNSW index for fast approximate nearest neighbor search
-- m = 16: number of bi-directional links per element (higher = better recall, more memory)
-- ef_construction = 64: size of dynamic candidate list during construction (higher = better quality)
CREATE INDEX idx_memory_embeddings_hnsw 
ON agent_memory_embeddings 
USING hnsw (embedding vector_cosine_ops)
WITH (m = 16, ef_construction = 64);

-- Set search parameters for queries
-- ef_search: size of dynamic candidate list during search (higher = better recall, slower)
SET hnsw.ef_search = 40;  -- Default for most queries
-- For high-recall queries (consolidation, cross-agent search):
-- SET hnsw.ef_search = 100;

-- IVFFlat alternative for very large datasets (> 10M vectors)
-- Requires periodic REINDEX to maintain quality
-- CREATE INDEX idx_memory_embeddings_ivfflat
-- ON agent_memory_embeddings
-- USING ivfflat (embedding vector_cosine_ops)
-- WITH (lists = 1000);
```

---

## 8. Memory Retrieval

The retrieval system is the read-side of the memory module — the mechanism by which agents access their stored knowledge. It implements a multi-stage pipeline that combines results from all memory stores into a ranked, contextually-relevant result set.

### 8.1 Retrieval Pipeline

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                         RETRIEVAL PIPELINE                                       │
│                                                                                  │
│  Query ──→ [Analysis] ──→ [Parallel Search] ──→ [Fusion] ──→ [Ranking] ──→ Out │
│                                                                                  │
│  ┌──────────┐   ┌────────────────────────────────────────┐   ┌──────────────┐  │
│  │  Query   │   │         Parallel Search                 │   │   Post-      │  │
│  │ Analysis │   │                                         │   │ Processing   │  │
│  │          │   │  ┌─────────┐  ┌─────────┐  ┌─────────┐│   │              │  │
│  │ Type     │──→│  │ Vector  │  │ Graph   │  │Temporal ││──→│ Fusion       │  │
│  │ Scope    │   │  │ Search  │  │ Search  │  │ Search  ││   │ Ranking      │  │
│  │ Time     │   │  │(Pinecone│  │(Neo4j)  │  │(PG SQL) ││   │ Dedup        │  │
│  │ Entities │   │  │+pgvector│  │         │  │         ││   │ Formatting   │  │
│  │          │   │  └─────────┘  └─────────┘  └─────────┘│   │              │  │
│  └──────────┘   │                                         │   └──────────────┘  │
│                  │  ┌─────────┐  ┌─────────┐             │                      │
│                  │  │ Working │  │  Full   │             │                      │
│                  │  │ Memory  │  │  Text   │             │                      │
│                  │  │ (Redis) │  │ (PG)    │             │                      │
│                  │  └─────────┘  └─────────┘             │                      │
│                  └────────────────────────────────────────┘                      │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### 8.2 Query Analysis

Before searching, the system analyzes the incoming query to optimize retrieval strategy:

```typescript
// @mcv/agentic-os/memory/query-analyzer.ts

export class QueryAnalyzer {
  /**
   * Analyze a memory retrieval query to determine optimal search strategy.
   */
  async analyze(query: string, context?: QueryContext): Promise<QueryAnalysis> {
    // Fast classification using heuristics first
    const heuristic = this.heuristicAnalysis(query);
    
    // If heuristic is confident, skip LLM analysis
    if (heuristic.confidence > 0.9) return heuristic;
    
    // LLM-based analysis for ambiguous queries
    return this.llmAnalysis(query, context);
  }
  
  private heuristicAnal