# @mcv/intelligence — Technical Architecture
## System Design & Data Flow

**Package:** `@mcv/intelligence`  
**Classification:** MCV-ONLY  
**Version:** 1.0.0  
**Last Updated:** February 9, 2026

---

## Architecture Overview

The Intelligence package follows a layered architecture with clear boundaries between core services, extensions, and plugins. Each layer has different loading behavior, lifecycle management, and coupling characteristics.

```
┌─────────────────────────────────────────────────────────────────────────────────────────────┐
│                                    CLIENT APPLICATIONS                                       │
│                                                                                              │
│   Web Apps │ Mobile Apps │ API Clients │ Agent Services │ External Widgets                  │
│                                                                                              │
└─────────────────────────────────────────────┬────────────────────────────────────────────────┘
                                              │
                              ┌───────────────┴───────────────┐
                              │         API GATEWAY           │
                              │   (Rate Limiting, Auth, WAF)  │
                              └───────────────┬───────────────┘
                                              │
┌─────────────────────────────────────────────┴────────────────────────────────────────────────┐
│                                   @mcv/intelligence                                          │
│                                                                                              │
│  ┌────────────────────────────────────────────────────────────────────────────────────────┐ │
│  │                              REQUEST ROUTER                                             │ │
│  │            Routes to appropriate module based on request type                          │ │
│  └─────────┬─────────────┬─────────────┬─────────────┬─────────────┬─────────────────────┘ │
│            │             │             │             │             │                         │
│            ▼             ▼             ▼             ▼             ▼                         │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐           │
│  │   GATEWAY   │ │   CONTEXT   │ │  EMBEDDING  │ │  STREAMING  │ │   METRICS   │           │
│  │   Module    │ │   Module    │ │   Module    │ │   Module    │ │   Module    │           │
│  │             │ │             │ │             │ │             │ │             │           │
│  │ ┌─────────┐ │ │ ┌─────────┐ │ │ ┌─────────┐ │ │ ┌─────────┐ │ │ ┌─────────┐ │           │
│  │ │ Router  │ │ │ │Assembler│ │ │ │Embedder │ │ │ │   SSE   │ │ │ │ Tracker │ │           │
│  │ │ Cache   │ │ │ │Tokenizer│ │ │ │ Chunker │ │ │ │WebSocket│ │ │ │Analyzer │ │           │
│  │ │ Failover│ │ │ │Injector │ │ │ │ Search  │ │ │ │ Buffer  │ │ │ │Dashboard│ │           │
│  │ └─────────┘ │ │ └─────────┘ │ │ └─────────┘ │ │ └─────────┘ │ │ └─────────┘ │           │
│  └──────┬──────┘ └──────┬──────┘ └──────┬──────┘ └──────┬──────┘ └──────┬──────┘           │
│         │               │               │               │               │                   │
│         └───────────────┴───────────────┼───────────────┴───────────────┘                   │
│                                         │                                                   │
│                               CORE EVENT BUS                                                │
│                                         │                                                   │
│         ┌───────────────┬───────────────┼───────────────┬───────────────┐                   │
│         │               │               │               │               │                   │
│         ▼               ▼               ▼               ▼               ▼                   │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐           │
│  │     RAG     │ │  KNOWLEDGE  │ │  PERSONAS   │ │   MEMORY    │ │     ML      │           │
│  │   Module    │ │   Module    │ │   Module    │ │   Module    │ │   Module    │           │
│  │  (Loadable) │ │  (Loadable) │ │  (Loadable) │ │  (Loadable) │ │  (Loadable) │           │
│  │             │ │             │ │             │ │             │ │             │           │
│  │ ┌─────────┐ │ │ ┌─────────┐ │ │ ┌─────────┐ │ │ ┌─────────┐ │ │ ┌─────────┐ │           │
│  │ │Retriever│ │ │ │ Neo4j   │ │ │ │ Profiles│ │ │ │ Store   │ │ │ │Predictors│ │           │
│  │ │ Indexer │ │ │ │ Entity  │ │ │ │  Voice  │ │ │ │Summarize│ │ │ │ Features │ │           │
│  │ │ Ranker  │ │ │ │Relation │ │ │ │   A/B   │ │ │ │ Recall  │ │ │ │  Scoring │ │           │
│  │ └─────────┘ │ │ └─────────┘ │ │ └─────────┘ │ │ └─────────┘ │ │ └─────────┘ │           │
│  └─────────────┘ └─────────────┘ └─────────────┘ └─────────────┘ └─────────────┘           │
│                                                                                              │
│  ┌────────────────────────────────────────────────────────────────────────────────────────┐ │
│  │                              EMBED PLUGIN LAYER                                        │ │
│  │                                                                                         │ │
│  │   ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐   │ │
│  │   │   Chat Widget   │  │  Search Widget  │  │  Voice Widget   │  │  Embed SDK      │   │ │
│  │   │   (iframe/JS)   │  │   (iframe/JS)   │  │   (iframe/JS)   │  │  (npm package)  │   │ │
│  │   └─────────────────┘  └─────────────────┘  └─────────────────┘  └─────────────────┘   │ │
│  └────────────────────────────────────────────────────────────────────────────────────────┘ │
│                                                                                              │
└──────────────────────────────────────────┬───────────────────────────────────────────────────┘
                                           │
                                           ▼
┌─────────────────────────────────────────────────────────────────────────────────────────────┐
│                                   DATA LAYER                                                 │
│                                                                                              │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐       │
│  │  Supabase   │  │    Neo4j    │  │  Pinecone/  │  │    Redis    │  │  Redpanda   │       │
│  │ PostgreSQL  │  │   Graph     │  │   Qdrant    │  │   Cache     │  │   Events    │       │
│  │             │  │             │  │             │  │             │  │             │       │
│  │ • Requests  │  │ • Entities  │  │ • Vectors   │  │ • Sessions  │  │ • Metrics   │       │
│  │ • Configs   │  │ • Relations │  │ • Embeddings│  │ • Prompts   │  │ • Events    │       │
│  │ • Metrics   │  │ • Facts     │  │ • Documents │  │ • Responses │  │ • Logs      │       │
│  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘       │
│                                                                                              │
└─────────────────────────────────────────────────────────────────────────────────────────────┘
                                           │
                                           ▼
┌─────────────────────────────────────────────────────────────────────────────────────────────┐
│                               EXTERNAL SERVICES                                              │
│                                                                                              │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐       │
│  │ OpenRouter  │  │   Google    │  │  Anthropic  │  │   OpenAI    │  │   Cohere    │       │
│  │   (LLMs)    │  │  GenAI API  │  │   Direct    │  │   Direct    │  │  Embeddings │       │
│  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘       │
│                                                                                              │
└─────────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## Layer Definitions

### Core Layer (Always Loaded)

**Characteristics:**
- Initialized at application startup
- Always resident in memory
- Zero runtime overhead to access
- Hot-path optimized for latency

**Modules:** gateway, context, embedding, streaming, metrics

**Loading Strategy:**
```typescript
// Core modules are imported synchronously at startup
import { gateway } from './gateway';
import { context } from './context';
import { embedding } from './embedding';
import { streaming } from './streaming';
import { metrics } from './metrics';

// Initialize connections at startup
await Promise.all([
  gateway.initialize(),
  embedding.initialize(),
  metrics.initialize(),
]);
```

### Extension Layer (Loadable)

**Characteristics:**
- Lazy-loaded on first use
- Can be unloaded when idle
- Per-venture configuration
- May have external dependencies (Neo4j, etc.)

**Modules:** rag, knowledge, personas, memory, ml

**Loading Strategy:**
```typescript
// Extension modules are lazy-loaded
const moduleRegistry = new Map<string, Module>();

async function loadExtension(name: string): Promise<Module> {
  if (moduleRegistry.has(name)) {
    return moduleRegistry.get(name)!;
  }
  
  const module = await import(`./${name}`);
  await module.initialize();
  moduleRegistry.set(name, module);
  
  return module;
}

// Usage
const rag = await loadExtension('rag');
const results = await rag.query({ ... });
```

### Plugin Layer (External)

**Characteristics:**
- Runs in client browsers or embedded contexts
- Communicates via API only
- Sandboxed and isolated
- Customizable per-venture

**Modules:** embed (chat, search, voice widgets)

**Loading Strategy:**
```html
<!-- External script loading -->
<script src="https://cdn.mcv.one/embed/v1/chat.js" async></script>

<!-- Iframe embedding -->
<iframe 
  src="https://embed.mcv.one/chat?venture=xxx" 
  sandbox="allow-scripts allow-same-origin"
></iframe>
```

---

## Request Flow Architecture

### Standard Chat Request

```
┌─────────────────────────────────────────────────────────────────────────────────────────────┐
│                               CHAT REQUEST FLOW                                              │
└─────────────────────────────────────────────────────────────────────────────────────────────┘

Client                API Gateway              Intelligence                External
  │                       │                        │                         │
  │  1. POST /chat        │                        │                         │
  │──────────────────────▶│                        │                         │
  │                       │  2. Auth + Rate Limit  │                         │
  │                       │───────────────────────▶│                         │
  │                       │                        │                         │
  │                       │                        │  3. Load Persona        │
  │                       │                        │─────────┐               │
  │                       │                        │◀────────┘               │
  │                       │                        │                         │
  │                       │                        │  4. Assemble Context    │
  │                       │                        │  ┌───────────────────┐  │
  │                       │                        │  │ • System prompt   │  │
  │                       │                        │  │ • User profile    │  │
  │                       │                        │  │ • RAG results     │  │
  │                       │                        │  │ • Memory recall   │  │
  │                       │                        │  │ • Conversation    │  │
  │                       │                        │  └───────────────────┘  │
  │                       │                        │                         │
  │                       │                        │  5. Route Model         │
  │                       │                        │  ┌───────────────────┐  │
  │                       │                        │  │ Select: claude    │  │
  │                       │                        │  │ Fallback: gpt-4o  │  │
  │                       │                        │  │ Cache key: hash   │  │
  │                       │                        │  └───────────────────┘  │
  │                       │                        │                         │
  │                       │                        │  6. Check Cache         │
  │                       │                        │────────▶ Redis         │
  │                       │                        │◀────────               │
  │                       │                        │  (cache miss)           │
  │                       │                        │                         │
  │                       │                        │  7. Call LLM            │
  │                       │                        │────────────────────────▶│
  │                       │                        │                         │ OpenRouter
  │                       │                        │  8. Stream Response     │
  │                       │                        │◀────────────────────────│
  │  9. SSE: tokens       │                        │                         │
  │◀──────────────────────│◀───────────────────────│                         │
  │  ...                  │                        │                         │
  │  10. SSE: complete    │                        │                         │
  │◀──────────────────────│◀───────────────────────│                         │
  │                       │                        │                         │
  │                       │                        │  11. Track Metrics      │
  │                       │                        │─────────┐               │
  │                       │                        │◀────────┘  → Redpanda   │
  │                       │                        │                         │
  │                       │                        │  12. Update Memory      │
  │                       │                        │─────────┐               │
  │                       │                        │◀────────┘  → Supabase   │
  │                       │                        │                         │
```

### RAG-Enhanced Request

```
┌─────────────────────────────────────────────────────────────────────────────────────────────┐
│                              RAG-ENHANCED REQUEST FLOW                                       │
└─────────────────────────────────────────────────────────────────────────────────────────────┘

1. User Query Received
   │
   ▼
2. Embedding Generation
   │  ┌─────────────────────────────────────────────┐
   │  │ query = "What is the return policy?"        │
   │  │ vector = embed(query) → [0.12, -0.34, ...]  │
   │  └─────────────────────────────────────────────┘
   │
   ▼
3. Multi-Store Search (Parallel)
   │
   ├──────────────────┬──────────────────┬──────────────────┐
   │                  │                  │                  │
   ▼                  ▼                  ▼                  ▼
┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐
│ Venture  │    │ Shared   │    │ Google   │    │ Neo4j    │
│ Vectors  │    │ Vectors  │    │ File API │    │ Graph    │
│(Pinecone)│    │ (Qdrant) │    │ (GFS)    │    │(Entities)│
└────┬─────┘    └────┬─────┘    └────┬─────┘    └────┬─────┘
     │               │               │               │
     │ top_k=5       │ top_k=3       │ top_k=5       │ related
     │               │               │               │ entities
     ▼               ▼               ▼               ▼
4. Result Fusion
   │  ┌─────────────────────────────────────────────┐
   │  │ Reciprocal Rank Fusion (RRF)                │
   │  │ - Combine scores from all sources           │
   │  │ - Re-rank by relevance                      │
   │  │ - Deduplicate overlapping content           │
   │  └─────────────────────────────────────────────┘
   │
   ▼
5. Context Assembly
   │  ┌─────────────────────────────────────────────┐
   │  │ system_prompt + retrieved_docs + user_query │
   │  │ Token budget: 8000 tokens                   │
   │  │ Truncation: oldest docs first               │
   │  └─────────────────────────────────────────────┘
   │
   ▼
6. LLM Generation
   │  ┌─────────────────────────────────────────────┐
   │  │ Model: claude-sonnet                        │
   │  │ Temperature: 0.3 (factual)                  │
   │  │ Max tokens: 1024                            │
   │  └─────────────────────────────────────────────┘
   │
   ▼
7. Response with Citations
   │  ┌─────────────────────────────────────────────┐
   │  │ {                                           │
   │  │   "response": "Our return policy allows..." │
   │  │   "citations": [                            │
   │  │     { "doc": "return-policy.pdf", ... },    │
   │  │     { "doc": "faq.md", ... }                │
   │  │   ]                                         │
   │  │ }                                           │
   │  └─────────────────────────────────────────────┘
```

---

## Data Flow Patterns

### Event-Driven Metrics Pipeline

```
┌─────────────────────────────────────────────────────────────────────────────────────────────┐
│                              METRICS EVENT PIPELINE                                          │
└─────────────────────────────────────────────────────────────────────────────────────────────┘

 Intelligence Module          Redpanda           Processors          Storage
        │                        │                   │                  │
        │  Emit Event            │                   │                  │
        │───────────────────────▶│                   │                  │
        │  {                     │                   │                  │
        │    topic: "ai.request" │                   │                  │
        │    event: {            │                   │                  │
        │      requestId,        │                   │                  │
        │      ventureId,        │                   │                  │
        │      model,            │                   │                  │
        │      tokensIn,         │                   │                  │
        │      tokensOut,        │                   │                  │
        │      latencyMs,        │                   │                  │
        │      cost,             │                   │                  │
        │      cacheHit          │                   │                  │
        │    }                   │                   │                  │
        │  }                     │                   │                  │
        │                        │                   │                  │
        │                        │  Consume          │                  │
        │                        │─────────────────▶ │                  │
        │                        │                   │                  │
        │                        │                   │  Aggregate       │
        │                        │                   │─────────┐        │
        │                        │                   │◀────────┘        │
        │                        │                   │                  │
        │                        │                   │  Write Batch     │
        │                        │                   │─────────────────▶│
        │                        │                   │                  │ TimescaleDB
        │                        │                   │                  │
        │                        │                   │  Update Budget   │
        │                        │                   │─────────────────▶│
        │                        │                   │                  │ Supabase
        │                        │                   │                  │
        │                        │                   │  Alert if Over   │
        │                        │                   │─────────────────▶│
        │                        │                   │                  │ Notification
```

### Knowledge Graph Update Flow

```
┌─────────────────────────────────────────────────────────────────────────────────────────────┐
│                           KNOWLEDGE GRAPH UPDATE FLOW                                        │
└─────────────────────────────────────────────────────────────────────────────────────────────┘

1. New Data Event (e.g., new order)
   │
   ▼
2. Entity Extraction (LLM-powered)
   │  ┌─────────────────────────────────────────────────────────────┐
   │  │ Input: "John Smith purchased iPhone 15 Pro for $999"        │
   │  │                                                             │
   │  │ Extracted:                                                  │
   │  │   Person: { name: "John Smith", id: "person_123" }         │
   │  │   Product: { name: "iPhone 15 Pro", price: 999 }           │
   │  │   Event: { type: "Purchase", amount: 999 }                 │
   │  └─────────────────────────────────────────────────────────────┘
   │
   ▼
3. Graph Operations
   │
   ├──────────────────────────────────────────────────────┐
   │                                                      │
   ▼                                                      ▼
┌─────────────────────────────────┐     ┌─────────────────────────────────┐
│ MERGE (Person:John Smith)       │     │ MERGE (Product:iPhone 15 Pro)   │
│ SET p.lastPurchase = $date      │     │ SET p.lastSold = $date          │
└─────────────────────────────────┘     └─────────────────────────────────┘
   │                                                      │
   └──────────────────────┬───────────────────────────────┘
                          │
                          ▼
   ┌─────────────────────────────────────────────────────────────────────┐
   │ CREATE (Person)-[:PURCHASED {date, amount}]->(Product)              │
   └─────────────────────────────────────────────────────────────────────┘
   │
   ▼
4. Vector Embedding Update
   │  ┌─────────────────────────────────────────────────────────────┐
   │  │ Update entity embeddings for semantic search                │
   │  │ Person: embed("John Smith, Customer, purchased iPhone...")  │
   │  └─────────────────────────────────────────────────────────────┘
   │
   ▼
5. Cache Invalidation
   │  ┌─────────────────────────────────────────────────────────────┐
   │  │ Invalidate cached queries involving:                       │
   │  │   - person_123                                              │
   │  │   - product_iphone15pro                                     │
   │  │   - venture_xyz purchases                                   │
   │  └─────────────────────────────────────────────────────────────┘
```

---

## Gateway Routing Architecture

### Model Selection Decision Tree

```
┌─────────────────────────────────────────────────────────────────────────────────────────────┐
│                              MODEL ROUTING DECISION TREE                                     │
└─────────────────────────────────────────────────────────────────────────────────────────────┘

                                    Request Received
                                          │
                                          ▼
                              ┌───────────────────────┐
                              │ Explicit model        │
                              │ specified?            │
                              └───────────┬───────────┘
                                    │           │
                              Yes   │           │ No
                                    │           │
                    ┌───────────────┘           └───────────────┐
                    │                                           │
                    ▼                                           ▼
          ┌─────────────────┐                     ┌───────────────────────┐
          │ Use specified   │                     │ Check venture config  │
          │ model           │                     │ for default routing   │
          └────────┬────────┘                     └───────────┬───────────┘
                   │                                          │
                   │                              ┌───────────┴───────────┐
                   │                              │                       │
                   │                    Has rules │                       │ No rules
                   │                              │                       │
                   │                              ▼                       ▼
                   │               ┌───────────────────────┐  ┌───────────────────────┐
                   │               │ Apply routing rules:  │  │ Use system defaults:  │
                   │               │ • Task type mapping   │  │ • economy: deepseek   │
                   │               │ • Cost tier limits    │  │ • standard: sonnet    │
                   │               │ • Time-based routing  │  │ • premium: opus       │
                   │               └───────────┬───────────┘  └───────────┬───────────┘
                   │                           │                          │
                   └───────────────────────────┴──────────────────────────┘
                                               │
                                               ▼
                                   ┌───────────────────────┐
                                   │ Check provider health │
                                   └───────────┬───────────┘
                                               │
                              ┌────────────────┴────────────────┐
                              │                                 │
                    Healthy   │                                 │ Degraded/Down
                              │                                 │
                              ▼                                 ▼
                   ┌───────────────────┐           ┌───────────────────────┐
                   │ Check rate limits │           │ Select failover model │
                   └─────────┬─────────┘           │ from configured chain │
                             │                     └───────────┬───────────┘
                             │                                 │
              ┌──────────────┴──────────────┐                  │
              │                             │                  │
    Under limit                    At/Over limit               │
              │                             │                  │
              ▼                             ▼                  │
   ┌───────────────────┐       ┌───────────────────────┐       │
   │ Check prompt cache│       │ Queue or use fallback │       │
   └─────────┬─────────┘       └───────────┬───────────┘       │
             │                             │                   │
             │                             └───────────────────┘
             │                                        │
             ▼                                        │
  ┌─────────────────────────────────────────────────────────────────────┐
  │                    FINAL MODEL SELECTION                            │
  │                                                                     │
  │  Model: claude-sonnet-4                                             │
  │  Provider: anthropic (via openrouter)                               │
  │  Cache: enabled, key=sha256(system+last_user)                       │
  │  Fallback: [gpt-4o, gemini-pro, deepseek-v3]                        │
  │  ZDR: false                                                         │
  │  Budget remaining: $45.23                                           │
  └─────────────────────────────────────────────────────────────────────┘
```

### Failover Chain Implementation

```
┌─────────────────────────────────────────────────────────────────────────────────────────────┐
│                              FAILOVER CHAIN EXECUTION                                        │
└─────────────────────────────────────────────────────────────────────────────────────────────┘

Primary Model: claude-sonnet
Failover Chain: [gpt-4o, gemini-pro, deepseek-v3]

Attempt 1: claude-sonnet
    │
    ├── Success ──────────────────────▶ Return Response
    │
    └── Failure (timeout/500/rate-limit)
            │
            ▼
        Log failure, update provider health
            │
            ▼
Attempt 2: gpt-4o
    │
    ├── Success ──────────────────────▶ Return Response (with model_used: gpt-4o)
    │
    └── Failure
            │
            ▼
Attempt 3: gemini-pro
    │
    ├── Success ──────────────────────▶ Return Response
    │
    └── Failure
            │
            ▼
Attempt 4: deepseek-v3
    │
    ├── Success ──────────────────────▶ Return Response
    │
    └── Failure
            │
            ▼
        Return Error: All providers failed
        {
          error: "SERVICE_UNAVAILABLE",
          attempted: ["claude-sonnet", "gpt-4o", "gemini-pro", "deepseek-v3"],
          lastError: { ... }
        }
```

---

## Caching Architecture

### Multi-Layer Cache Strategy

```
┌─────────────────────────────────────────────────────────────────────────────────────────────┐
│                              CACHING ARCHITECTURE                                            │
└─────────────────────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────────────────────┐
│ L1: IN-MEMORY CACHE (per-instance)                                                          │
│                                                                                              │
│ • Model configs (TTL: 5 min)                                                                │
│ • Provider health status (TTL: 30 sec)                                                      │
│ • Token counts for common prompts (TTL: 1 hour)                                             │
│ • Persona definitions (TTL: 5 min)                                                          │
│                                                                                              │
│ Size: 100MB max per instance                                                                │
│ Eviction: LRU                                                                               │
└─────────────────────────────────────────────────────────────────────────────────────────────┘
                                           │
                                           ▼
┌─────────────────────────────────────────────────────────────────────────────────────────────┐
│ L2: REDIS CACHE (shared)                                                                    │
│                                                                                              │
│ • Embedding vectors (TTL: 24 hours)                                                         │
│ • RAG search results (TTL: 1 hour)                                                          │
│ • User session context (TTL: 30 min sliding)                                                │
│ • Rate limit counters (TTL: 1 min)                                                          │
│ • Budget usage counters (TTL: 1 day)                                                        │
│                                                                                              │
│ Size: 10GB allocated                                                                        │
│ Eviction: volatile-lru                                                                      │
└─────────────────────────────────────────────────────────────────────────────────────────────┘
                                           │
                                           ▼
┌─────────────────────────────────────────────────────────────────────────────────────────────┐
│ L3: OPENROUTER PROMPT CACHE (provider-side)                                                 │
│                                                                                              │
│ • Full prompt caching for supported models                                                  │
│ • Cache key: hash(system_prompt + previous_messages)                                        │
│ • Cost reduction: 90% on cache hit                                                          │
│ • Supported: Claude (all), GPT-4+ (selected)                                                │
│                                                                                              │
│ TTL: Up to 5 minutes (provider controlled)                                                  │
└─────────────────────────────────────────────────────────────────────────────────────────────┘
                                           │
                                           ▼
┌─────────────────────────────────────────────────────────────────────────────────────────────┐
│ L4: PERSISTENT CACHE (database)                                                             │
│                                                                                              │
│ • Conversation summaries (no TTL, updated)                                                  │
│ • Memory facts (no TTL, versioned)                                                          │
│ • ML model predictions (TTL: varies by model)                                               │
│ • Knowledge graph query results (TTL: on invalidation)                                      │
│                                                                                              │
│ Storage: Supabase PostgreSQL                                                                │
└─────────────────────────────────────────────────────────────────────────────────────────────┘


Cache Key Patterns:
─────────────────────
• Embedding:      embed:v1:{model}:{sha256(text)}
• RAG:            rag:v1:{venture}:{sha256(query)}:{store}
• Session:        session:v1:{user}:{conversation}
• Rate Limit:     rate:v1:{venture}:{window}
• Budget:         budget:v1:{venture}:{period}
• Prompt:         prompt:v1:{sha256(system+messages[-3:])}
```

---

## Database Schema Design

### Core Tables

```sql
-- LLM Request Tracking
CREATE TABLE llm_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    venture_id UUID NOT NULL REFERENCES ventures(id),
    user_id UUID REFERENCES users(id),
    conversation_id UUID,
    
    -- Request details
    request_id VARCHAR(50) UNIQUE NOT NULL,
    model_requested VARCHAR(100),
    model_used VARCHAR(100) NOT NULL,
    provider VARCHAR(50) NOT NULL,
    
    -- Tokens and cost
    tokens_input INTEGER NOT NULL,
    tokens_output INTEGER NOT NULL,
    cost_usd DECIMAL(10, 6) NOT NULL,
    
    -- Performance
    latency_ttft_ms INTEGER,
    latency_total_ms INTEGER,
    cache_hit BOOLEAN DEFAULT FALSE,
    
    -- Status
    status VARCHAR(20) NOT NULL, -- success, error, timeout
    error_code VARCHAR(50),
    error_message TEXT,
    
    -- Failover tracking
    failover_attempted BOOLEAN DEFAULT FALSE,
    failover_chain JSONB,
    
    -- Audit
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Indexes
    INDEX idx_requests_venture_date (venture_id, created_at DESC),
    INDEX idx_requests_user (user_id, created_at DESC),
    INDEX idx_requests_model (model_used, created_at DESC)
);

-- Model Routing Configuration
CREATE TABLE model_configs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    venture_id UUID NOT NULL REFERENCES ventures(id),
    
    -- Routing rules
    default_model VARCHAR(100) NOT NULL DEFAULT 'claude-sonnet',
    routing_rules JSONB NOT NULL DEFAULT '{}',
    /*
    routing_rules example:
    {
      "task_routing": {
        "chat": "claude-sonnet",
        "code": "gpt-4o",
        "analysis": "claude-opus"
      },
      "cost_tiers": {
        "economy": ["deepseek-v3", "gpt-4o-mini"],
        "standard": ["claude-sonnet", "gpt-4o"],
        "premium": ["claude-opus", "gpt-4.5"]
      },
      "time_routing": {
        "peak_hours": "economy",
        "off_peak": "standard"
      }
    }
    */
    
    -- Failover
    failover_enabled BOOLEAN DEFAULT TRUE,
    failover_chain JSONB NOT NULL DEFAULT '["gpt-4o", "gemini-pro", "deepseek-v3"]',
    
    -- Rate limits
    requests_per_minute INTEGER DEFAULT 60,
    requests_per_day INTEGER DEFAULT 10000,
    
    -- Flags
    cache_enabled BOOLEAN DEFAULT TRUE,
    zdr_enabled BOOLEAN DEFAULT FALSE,
    
    -- Audit
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(venture_id)
);

-- Cost Budgets
CREATE TABLE cost_budgets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    venture_id UUID NOT NULL REFERENCES ventures(id),
    
    -- Budget periods
    daily_limit_usd DECIMAL(10, 2),
    weekly_limit_usd DECIMAL(10, 2),
    monthly_limit_usd DECIMAL(10, 2),
    
    -- Current usage (updated by trigger/job)
    daily_used_usd DECIMAL(10, 2) DEFAULT 0,
    weekly_used_usd DECIMAL(10, 2) DEFAULT 0,
    monthly_used_usd DECIMAL(10, 2) DEFAULT 0,
    
    -- Alert thresholds
    alert_at_percent INTEGER DEFAULT 80,
    hard_limit_enabled BOOLEAN DEFAULT FALSE,
    
    -- Status
    last_reset_daily TIMESTAMPTZ,
    last_reset_weekly TIMESTAMPTZ,
    last_reset_monthly TIMESTAMPTZ,
    
    -- Audit
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(venture_id)
);

-- Provider Health
CREATE TABLE provider_health (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    provider VARCHAR(50) NOT NULL,
    model VARCHAR(100) NOT NULL,
    
    -- Health status
    status VARCHAR(20) NOT NULL, -- healthy, degraded, down
    latency_p50_ms INTEGER,
    latency_p99_ms INTEGER,
    error_rate_percent DECIMAL(5, 2),
    
    -- Tracking window
    window_start TIMESTAMPTZ NOT NULL,
    window_end TIMESTAMPTZ NOT NULL,
    request_count INTEGER NOT NULL,
    error_count INTEGER NOT NULL,
    
    -- Last check
    last_check_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(provider, model, window_start)
);

-- Embeddings Cache
CREATE TABLE embeddings_cache (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    venture_id UUID NOT NULL REFERENCES ventures(id),
    
    -- Content identification
    content_hash VARCHAR(64) NOT NULL, -- SHA256 of content
    content_preview VARCHAR(500), -- First 500 chars for debugging
    
    -- Embedding data
    model VARCHAR(100) NOT NULL,
    dimensions INTEGER NOT NULL,
    vector VECTOR(3072), -- Max dimensions supported
    
    -- Metadata
    token_count INTEGER,
    
    -- Cache management
    created_at TIMESTAMPTZ DEFAULT NOW(),
    last_accessed_at TIMESTAMPTZ DEFAULT NOW(),
    access_count INTEGER DEFAULT 1,
    
    UNIQUE(venture_id, content_hash, model),
    INDEX idx_embeddings_hash (content_hash)
);

-- Conversations
CREATE TABLE conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    venture_id UUID NOT NULL REFERENCES ventures(id),
    user_id UUID REFERENCES users(id),
    
    -- Conversation metadata
    title VARCHAR(255),
    summary TEXT,
    
    -- Configuration
    persona_id UUID REFERENCES personas(id),
    model_override VARCHAR(100),
    
    -- Status
    status VARCHAR(20) DEFAULT 'active', -- active, archived, deleted
    message_count INTEGER DEFAULT 0,
    
    -- Token tracking
    total_tokens_in INTEGER DEFAULT 0,
    total_tokens_out INTEGER DEFAULT 0,
    total_cost_usd DECIMAL(10, 4) DEFAULT 0,
    
    -- Audit
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    last_message_at TIMESTAMPTZ,
    
    INDEX idx_conversations_user (user_id, updated_at DESC),
    INDEX idx_conversations_venture (venture_id, updated_at DESC)
);

-- Messages
CREATE TABLE messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    
    -- Message content
    role VARCHAR(20) NOT NULL, -- system, user, assistant, tool
    content TEXT NOT NULL,
    
    -- For tool calls
    tool_calls JSONB,
    tool_call_id VARCHAR(100),
    
    -- Token counts
    token_count INTEGER,
    
    -- Metadata
    model_used VARCHAR(100),
    latency_ms INTEGER,
    
    -- Audit
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    INDEX idx_messages_conversation (conversation_id, created_at)
);

-- Personas
CREATE TABLE personas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    venture_id UUID NOT NULL REFERENCES ventures(id),
    
    -- Identity
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(100) NOT NULL,
    description TEXT,
    
    -- Personality definition
    system_prompt TEXT NOT NULL,
    personality JSONB NOT NULL DEFAULT '{}',
    /*
    personality example:
    {
      "tone": "professional_friendly",
      "traits": ["helpful", "concise", "knowledgeable"],
      "vocabulary": {
        "greeting": "Hello! I'm here to help.",
        "farewell": "Thanks for chatting!"
      },
      "avoid": ["slang", "emojis", "competitor_mentions"],
      "knowledge": {
        "company_name": "BetEdge",
        "founded": "2024",
        "mission": "..."
      }
    }
    */
    
    -- Voice settings (for TTS)
    voice_id VARCHAR(100),
    voice_settings JSONB,
    
    -- A/B testing
    is_default BOOLEAN DEFAULT FALSE,
    variant_of UUID REFERENCES personas(id),
    variant_weight DECIMAL(3, 2) DEFAULT 1.0,
    
    -- Status
    status VARCHAR(20) DEFAULT 'active',
    
    -- Audit
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(venture_id, slug)
);

-- Memory Store
CREATE TABLE memories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    venture_id UUID NOT NULL REFERENCES ventures(id),
    user_id UUID NOT NULL REFERENCES users(id),
    
    -- Memory content
    memory_type VARCHAR(50) NOT NULL, -- fact, preference, event, summary
    content TEXT NOT NULL,
    
    -- Source tracking
    source_type VARCHAR(50), -- conversation, explicit, inferred
    source_id UUID,
    
    -- Embedding for retrieval
    embedding VECTOR(1536),
    
    -- Confidence and validity
    confidence DECIMAL(3, 2) DEFAULT 1.0,
    valid_from TIMESTAMPTZ DEFAULT NOW(),
    valid_until TIMESTAMPTZ,
    
    -- Status
    status VARCHAR(20) DEFAULT 'active', -- active, superseded, deleted
    superseded_by UUID REFERENCES memories(id),
    
    -- Audit
    created_at TIMESTAMPTZ DEFAULT NOW(),
    last_accessed_at TIMESTAMPTZ,
    access_count INTEGER DEFAULT 0,
    
    INDEX idx_memories_user (user_id, memory_type, status),
    INDEX idx_memories_embedding (embedding vector_cosine_ops)
);

-- RAG Document Stores
CREATE TABLE rag_stores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    venture_id UUID REFERENCES ventures(id), -- NULL for shared stores
    
    -- Store identity
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(100) NOT NULL,
    description TEXT,
    
    -- Store type
    store_type VARCHAR(50) NOT NULL, -- venture, shared, compliance, training
    provider VARCHAR(50) NOT NULL, -- google_file_search, pinecone, qdrant
    
    -- Provider-specific config
    provider_config JSONB NOT NULL DEFAULT '{}',
    /*
    provider_config example for Google File Search:
    {
      "store_id": "gfs_xxx",
      "capacity_gb": 2,
      "used_gb": 0.5
    }
    */
    
    -- Statistics
    document_count INTEGER DEFAULT 0,
    chunk_count INTEGER DEFAULT 0,
    total_tokens INTEGER DEFAULT 0,
    
    -- Status
    status VARCHAR(20) DEFAULT 'active',
    last_indexed_at TIMESTAMPTZ,
    
    -- Audit
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(venture_id, slug)
);

-- RAG Documents
CREATE TABLE rag_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id UUID NOT NULL REFERENCES rag_stores(id),
    
    -- Document identity
    filename VARCHAR(500) NOT NULL,
    content_hash VARCHAR(64) NOT NULL,
    
    -- Content type
    mime_type VARCHAR(100),
    file_size_bytes BIGINT,
    
    -- Processing status
    status VARCHAR(20) DEFAULT 'pending', -- pending, processing, indexed, failed
    chunk_count INTEGER,
    token_count INTEGER,
    error_message TEXT,
    
    -- Metadata
    metadata JSONB DEFAULT '{}',
    
    -- Audit
    created_at TIMESTAMPTZ DEFAULT NOW(),
    indexed_at TIMESTAMPTZ,
    
    INDEX idx_rag_docs_store (store_id, status)
);

-- ML Models Registry
CREATE TABLE ml_models (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    venture_id UUID REFERENCES ventures(id), -- NULL for platform models
    
    -- Model identity
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(100) NOT NULL,
    version VARCHAR(50) NOT NULL,
    description TEXT,
    
    -- Model type
    model_type VARCHAR(50) NOT NULL, -- churn, recommender, anomaly, scorer, sentiment
    
    -- Model storage
    model_uri VARCHAR(500), -- S3/GCS path to model artifacts
    
    -- Features
    input_schema JSONB NOT NULL,
    output_schema JSONB NOT NULL,
    
    -- Performance metrics
    metrics JSONB DEFAULT '{}',
    /*
    metrics example:
    {
      "accuracy": 0.92,
      "f1_score": 0.89,
      "auc_roc": 0.94,
      "training_date": "2026-01-15",
      "training_samples": 50000
    }
    */
    
    -- Status
    status VARCHAR(20) DEFAULT 'active', -- active, deprecated, training
    
    -- Audit
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(venture_id, slug, version)
);

-- ML Predictions Log
CREATE TABLE ml_predictions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    venture_id UUID NOT NULL REFERENCES ventures(id),
    model_id UUID NOT NULL REFERENCES ml_models(id),
    
    -- Prediction target
    entity_type VARCHAR(50) NOT NULL, -- user, order, lead
    entity_id UUID NOT NULL,
    
    -- Prediction
    prediction JSONB NOT NULL,
    confidence DECIMAL(5, 4),
    
    -- Features used
    features JSONB,
    
    -- Outcome tracking (for model improvement)
    actual_outcome JSONB,
    outcome_recorded_at TIMESTAMPTZ,
    
    -- Audit
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    INDEX idx_predictions_entity (entity_type, entity_id, created_at DESC),
    INDEX idx_predictions_model (model_id, created_at DESC)
);
```

---

## Scaling Strategy

### Horizontal Scaling

```
┌─────────────────────────────────────────────────────────────────────────────────────────────┐
│                              HORIZONTAL SCALING                                              │
└─────────────────────────────────────────────────────────────────────────────────────────────┘

                              Load Balancer (Cloudflare)
                                        │
           ┌────────────────────────────┼────────────────────────────┐
           │                            │                            │
           ▼                            ▼                            ▼
    ┌─────────────┐             ┌─────────────┐             ┌─────────────┐
    │  API Pod 1  │             │  API Pod 2  │             │  API Pod N  │
    │             │             │             │             │             │
    │ intelligence│             │ intelligence│             │ intelligence│
    │   service   │             │   service   │             │   service   │
    └──────┬──────┘             └──────┬──────┘             └──────┬──────┘
           │                           │                           │
           └───────────────────────────┼───────────────────────────┘
                                       │
                                       ▼
                              ┌─────────────────┐
                              │  Redis Cluster  │
                              │   (3 nodes)     │
                              └────────┬────────┘
                                       │
              ┌────────────────────────┼────────────────────────────┐
              │                        │                            │
              ▼                        ▼                            ▼
       ┌─────────────┐         ┌─────────────┐            ┌─────────────┐
       │  Supabase   │         │   Neo4j     │            │  Pinecone   │
       │  (Primary)  │         │   Cluster   │            │  (Managed)  │
       │             │         │             │            │             │
       │  • Requests │         │  • Entities │            │  • Vectors  │
       │  • Configs  │         │  • Relations│            │  • Search   │
       │  • Metrics  │         │  • Facts    │            │             │
       └─────────────┘         └─────────────┘            └─────────────┘

Scaling Triggers:
─────────────────
• API Pods: Scale at 70% CPU, min 3, max 20
• Redis: Scale at 80% memory
• Neo4j: Add read replicas at 1000 qps
• Pinecone: Managed auto-scaling
```

### Queue-Based Processing

```
┌─────────────────────────────────────────────────────────────────────────────────────────────┐
│                              QUEUE-BASED PROCESSING                                          │
└─────────────────────────────────────────────────────────────────────────────────────────────┘

Async Operations:
─────────────────
1. Document Indexing
2. Embedding Generation (batch)
3. Knowledge Graph Updates
4. ML Model Predictions (batch)
5. Memory Consolidation
6. Usage Report Generation

               API Request                    Background Worker
                    │                               │
                    ▼                               │
    ┌───────────────────────────┐                  │
    │ "Index this document"     │                  │
    └─────────────┬─────────────┘                  │
                  │                                │
                  ▼                                │
    ┌───────────────────────────┐                  │
    │ Validate & Enqueue        │                  │
    │ Return: { jobId: "xxx" }  │                  │
    └─────────────┬─────────────┘                  │
                  │                                │
                  ▼                                │
    ┌───────────────────────────┐    ┌─────────────────────────────┐
    │      Redpanda Queue       │───▶│     Worker Pool             │
    │                           │    │                             │
    │ Topic: ai.indexing.jobs   │    │ • Pick job from queue       │
    │                           │    │ • Process document          │
    │ { jobId, document, store }│    │ • Update vectors            │
    └───────────────────────────┘    │ • Mark complete             │
                                     └─────────────────────────────┘
                                                  │
                                                  ▼
                                     ┌─────────────────────────────┐
                                     │     Completion Webhook      │
                                     │     or SSE Notification     │
                                     └─────────────────────────────┘
```

---

## Security Architecture

### Data Isolation

```
┌─────────────────────────────────────────────────────────────────────────────────────────────┐
│                              VENTURE DATA ISOLATION                                          │
└─────────────────────────────────────────────────────────────────────────────────────────────┘

                                    Request with JWT
                                          │
                                          ▼
                              ┌───────────────────────┐
                              │  Extract venture_id   │
                              │  from JWT claims      │
                              └───────────┬───────────┘
                                          │
                                          ▼
                              ┌───────────────────────┐
                              │  Set PostgreSQL var   │
                              │  SET app.venture_id   │
                              └───────────┬───────────┘
                                          │
                                          ▼
                      ┌───────────────────────────────────────────┐
                      │             ROW-LEVEL SECURITY            │
                      │                                           │
                      │  Policy: venture_id = current_setting(    │
                      │            'app.venture_id'               │
                      │          )::uuid                          │
                      │                                           │
                      │  Applied to ALL tables automatically      │
                      └───────────────────────────────────────────┘
                                          │
            ┌─────────────────────────────┼─────────────────────────────┐
            │                             │                             │
            ▼                             ▼                             ▼
    ┌─────────────┐             ┌─────────────────┐           ┌─────────────┐
    │  Vector DB  │             │  Knowledge Graph │           │  RAG Store  │
    │             │             │                  │           │             │
    │ Namespace:  │             │ Label:           │           │ Collection: │
    │ {ventureId} │             │ :Venture_{id}    │           │ {ventureId} │
    └─────────────┘             └─────────────────┘           └─────────────┘
```

### PII Handling

```
┌─────────────────────────────────────────────────────────────────────────────────────────────┐
│                              PII HANDLING PIPELINE                                           │
└─────────────────────────────────────────────────────────────────────────────────────────────┘

        User Message                                             LLM Provider
             │                                                         │
             ▼                                                         │
    ┌─────────────────┐                                               │
    │ PII Detection   │                                               │
    │                 │                                               │
    │ Patterns:       │                                               │
    │ • Email         │                                               │
    │ • Phone         │                                               │
    │ • SSN           │                                               │
    │ • Credit Card   │                                               │
    │ • Address       │                                               │
    └────────┬────────┘                                               │
             │                                                         │
             ▼                                                         │
    ┌─────────────────┐                                               │
    │ PII Masking     │                                               │
    │                 │                                               │
    │ Before:         │                                               │
    │ "Email john@... │                                               │
    │  Call 555-1234" │                                               │
    │                 │                                               │
    │ After:          │                                               │
    │ "Email [EMAIL]  │                                               │
    │  Call [PHONE]"  │                                               │
    └────────┬────────┘                                               │
             │                                                         │
             ▼                                                         │
    ┌─────────────────┐                                               │
    │ Store Mapping   │                                               │
    │                 │                                               │
    │ {               │                                               │
    │  "[EMAIL]":     │         ┌──────────────────────┐              │
    │   "john@...",   │────────▶│  Encrypted Storage   │              │
    │  "[PHONE]":     │         │  (Session-scoped)    │              │
    │   "555-1234"    │         └──────────────────────┘              │
    │ }               │                                               │
    └────────┬────────┘                                               │
             │                                                         │
             │  Masked message                                         │
             └────────────────────────────────────────────────────────▶│
                                                                       │
                                       ◀───────────────────────────────┘
                                       │  Response (may contain masks)
                                       │
                                       ▼
                              ┌─────────────────┐
                              │ PII Restoration │
                              │                 │
                              │ "[EMAIL]" →     │
                              │ "john@..."      │
                              └────────┬────────┘
                                       │
                                       ▼
                                 Final Response
```

---

## Monitoring & Observability

### Metrics Collection

```
┌─────────────────────────────────────────────────────────────────────────────────────────────┐
│                              OBSERVABILITY STACK                                             │
└─────────────────────────────────────────────────────────────────────────────────────────────┘

                            Intelligence Service
                                    │
        ┌───────────────────────────┼───────────────────────────┐
        │                           │                           │
        ▼                           ▼                           ▼
 ┌─────────────┐           ┌─────────────┐           ┌─────────────┐
 │   Metrics   │           │   Traces    │           │    Logs     │
 │             │           │             │           │             │
 │ Prometheus  │           │   Jaeger    │           │   Loki      │
 │             │           │             │           │             │
 │ • latency   │           │ • request   │           │ • errors    │
 │ • tokens    │           │   flow      │           │ • events    │
 │ • errors    │           │ • spans     │           │ • debug     │
 │ • costs     │           │ • deps      │           │             │
 └──────┬──────┘           └──────┬──────┘           └──────┬──────┘
        │                         │                         │
        └─────────────────────────┼─────────────────────────┘
                                  │
                                  ▼
                        ┌─────────────────┐
                        │    Grafana      │
                        │                 │
                        │ Dashboards:     │
                        │ • AI Operations │
                        │ • Cost Analysis │
                        │ • Error Rates   │
                        │ • Model Perf    │
                        └─────────────────┘

Key Metrics:
────────────
• ai_request_duration_seconds{model,venture,status}
• ai_tokens_total{model,venture,direction}
• ai_cost_usd{model,venture}
• ai_cache_hits_total{cache_type}
• ai_failover_count{from_model,to_model}
• ai_error_count{model,error_type}
• rag_query_duration_seconds{store}
• embedding_generation_duration_seconds{model}
• knowledge_query_duration_seconds{query_type}
```

---

## Disaster Recovery

### Backup Strategy

```
┌─────────────────────────────────────────────────────────────────────────────────────────────┐
│                              BACKUP & RECOVERY                                               │
└─────────────────────────────────────────────────────────────────────────────────────────────┘

Component          Backup Frequency     Retention    RTO        RPO
─────────────────────────────────────────────────────────────────────
Supabase (PITR)    Continuous           30 days      1 hour     0 min
Neo4j              Daily full           14 days      4 hours    24 hours
Pinecone           N/A (managed)        N/A          N/A        N/A
Redis              Hourly snapshot      7 days       30 min     1 hour
Configs            On change            Forever      5 min      0 min

Recovery Procedures:
───────────────────
1. Supabase: Point-in-time restore via dashboard
2. Neo4j: Restore from daily dump + transaction logs
3. Redis: Restore from RDB snapshot
4. Configs: Restore from Git repository
```

---

## Related Documentation

- [Package Specification](./01-PACKAGE-SPEC.md)
- [API Reference](./03-API-REFERENCE.md)
- [Implementation Plan](./04-IMPLEMENTATION-PLAN.md)
- [gateway Module](./gateway/MODULE.md)
- [context Module](./context/MODULE.md)
- [embedding Module](./embedding/MODULE.md)

---

*@mcv/intelligence — Technical Architecture v1.0.0*
