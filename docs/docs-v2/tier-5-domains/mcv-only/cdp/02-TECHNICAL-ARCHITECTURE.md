# @mcv/cdp — Technical Architecture
## Tier 5: MCV-Only Domains

**Package:** `@mcv/cdp`  
**Classification:** INTERNAL (MCV-Only)  
**Architecture Version:** 2.0  
**Last Updated:** February 9, 2026

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [System Diagram](#system-diagram)
3. [Module Architecture](#module-architecture)
   - [events — Event Ingestion & Processing Pipeline](#submodule-events)
   - [identity-graph — Cross-Venture Identity Resolution](#submodule-identity-graph)
   - [profiles — Unified Customer Profiles](#submodule-profiles)
   - [segments — Dynamic Audience Segmentation](#submodule-segments)
   - [sync — External Data Synchronization](#submodule-sync)
   - [traits — Computed & Behavioral Attributes](#submodule-traits)
4. [Data Models](#data-models)
5. [Data Flow & Events](#data-flow--events)
6. [Integration Points](#integration-points)
7. [Performance](#performance)
8. [Scalability](#scalability)
9. [Error Handling](#error-handling)
10. [Observability](#observability)
11. [Security](#security)

---

## Architecture Overview

The `@mcv/cdp` package implements a **vertically integrated Customer Data Platform** that serves as the unified source of truth for customer intelligence across all 9 MCV ventures. The architecture follows an event-driven, pipeline-oriented design where behavioral data flows from ingestion through identity resolution, profile unification, trait computation, audience segmentation, and finally outbound synchronization to activation destinations.

### Design Principles

| Principle | Description |
|-----------|-------------|
| **Event-First** | Every customer interaction is captured as an immutable event before any processing occurs. Events are the atomic unit of truth. |
| **Identity-Centric** | The identity graph sits at the core — every operation resolves through identity first. Cross-venture resolution enables a single view of the customer. |
| **Privacy-First** | GDPR/CCPA compliance is built into every layer: PII hashing, consent-gated processing, profile suppression, and data minimization. |
| **Venture-Isolated** | All data is scoped by `ventureId` with PostgreSQL Row-Level Security (RLS). Cross-venture queries require explicit portfolio-level authorization. |
| **Real-Time + Batch** | Hybrid processing model — real-time for event ingestion and profile updates; batch for trait recomputation and segment materialization. |
| **Schema-Validated** | Every event, trait, and segment rule is validated via Zod schemas before persistence. Event definitions serve as a schema registry. |
| **Horizontally Scalable** | Event partitioning by date, profile sharding by venture, and Redpanda-based stream processing enable horizontal scaling. |

### Technology Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Runtime** | Next.js 15 (App Router) | API routes, server actions, React server components |
| **Monorepo** | Turborepo | Build orchestration, dependency management |
| **Database** | Supabase PostgreSQL + RLS | Primary data store with row-level security |
| **ORM** | Drizzle ORM | Type-safe SQL query builder and schema management |
| **Validation** | Zod | Runtime schema validation for all inputs |
| **Streaming** | Redpanda (Kafka-compatible) | High-throughput event ingestion and processing |
| **Caching** | Redis (Upstash) | Profile cache, segment membership cache, rate limiting |
| **AI/ML** | OpenRouter | Predictive trait computation, lookalike audience modeling |
| **API Layer** | tRPC | Type-safe RPC for internal service communication |
| **Background Jobs** | Inngest / pg-boss | Batch computations, scheduled syncs, trait recomputation |

### Architecture Layers

The CDP is organized into six distinct layers that form a processing pipeline:

```
┌──────────────────────────────────────────────────────────────────────┐
│  Layer 1: EVENT INGESTION       (events submodule)                   │
│  Collect → Validate → Deduplicate → Enrich → Persist → Route        │
├──────────────────────────────────────────────────────────────────────┤
│  Layer 2: IDENTITY RESOLUTION   (identity-graph submodule)           │
│  Hash → Match → Link → Score → Merge/Create Profile                 │
├──────────────────────────────────────────────────────────────────────┤
│  Layer 3: PROFILE UNIFICATION   (profiles submodule)                 │
│  Upsert → Merge → 360° View → Timeline → GDPR Suppression          │
├──────────────────────────────────────────────────────────────────────┤
│  Layer 4: TRAIT COMPUTATION     (traits submodule)                   │
│  Define → Compute (aggregate/window/recency/frequency) → Store      │
├──────────────────────────────────────────────────────────────────────┤
│  Layer 5: AUDIENCE SEGMENTATION (segments submodule)                 │
│  Define Rules → Evaluate → Materialize Membership → Diff            │
├──────────────────────────────────────────────────────────────────────┤
│  Layer 6: SYNC & ACTIVATION     (sync submodule)                    │
│  Map Fields → Transform → Batch → Deliver → Retry → Report          │
└──────────────────────────────────────────────────────────────────────┘
```

---

## System Diagram

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                                DATA SOURCES                                     │
│                                                                                 │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────────┐ │
│  │ Web SDKs│ │ Mobile  │ │ Server  │ │Blockchain│ │  Email  │ │ Support/CRM │ │
│  │ (JS/TS) │ │(iOS/And)│ │ (Node)  │ │ (Events)│ │ Webhooks│ │(HubSpot etc)│ │
│  └────┬────┘ └────┬────┘ └────┬────┘ └────┬────┘ └────┬────┘ └──────┬──────┘ │
│       │           │           │           │           │              │         │
│       └───────────┴───────────┴─────┬─────┴───────────┴──────────────┘         │
│                                     │                                           │
│                              HTTP / WebSocket                                   │
│                                     │                                           │
└─────────────────────────────────────┼───────────────────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│                                 @mcv/cdp                                        │
│                                                                                 │
│  ┌───────────────────────────────────────────────────────────────────────────┐  │
│  │                    1. EVENT INGESTION LAYER (events)                      │  │
│  │                                                                           │  │
│  │  ┌──────────────┐   ┌───────────────┐   ┌──────────────┐                │  │
│  │  │EventCollector │   │EventProcessor │   │  EventStore  │                │  │
│  │  │              │   │               │   │              │                │  │
│  │  │ track()      │   │ validate()    │   │ partitioned  │                │  │
│  │  │ trackBatch() │──▶│ deduplicate() │──▶│  by date     │                │  │
│  │  │ identify()   │   │ enrich()      │   │ indexed by   │                │  │
│  │  │ page()       │   │ route()       │   │  profile +   │                │  │
│  │  │ screen()     │   │               │   │  venture     │                │  │
│  │  └──────────────┘   └───────┬───────┘   └──────────────┘                │  │
│  │                             │                                             │  │
│  └─────────────────────────────┼─────────────────────────────────────────────┘  │
│                                │                                                 │
│                                ▼                                                 │
│  ┌───────────────────────────────────────────────────────────────────────────┐  │
│  │                2. IDENTITY RESOLUTION LAYER (identity-graph)              │  │
│  │                                                                           │  │
│  │  ┌──────────────┐   ┌───────────────┐   ┌──────────────┐                │  │
│  │  │IdentityGraph │   │IdentityResolve│   │ AliasManager │                │  │
│  │  │              │   │               │   │              │                │  │
│  │  │ nodes: email,│   │ deterministic │   │ add/remove   │                │  │
│  │  │  phone,wallet│   │  matching     │   │  aliases     │                │  │
│  │  │  device,user │   │ probabilistic │   │ verify       │                │  │
│  │  │ edges: co-   │   │  scoring      │   │ hash values  │                │  │
│  │  │  occurrence  │   │ merge trigger │   │ cross-venture│                │  │
│  │  └──────┬───────┘   └───────┬───────┘   └──────────────┘                │  │
│  │         │                   │                                             │  │
│  └─────────┼───────────────────┼─────────────────────────────────────────────┘  │
│            │                   │                                                 │
│            ▼                   ▼                                                 │
│  ┌───────────────────────────────────────────────────────────────────────────┐  │
│  │                3. PROFILE UNIFICATION LAYER (profiles)                    │  │
│  │                                                                           │  │
│  │  ┌──────────────┐   ┌───────────────┐   ┌──────────────┐                │  │
│  │  │ProfileService│   │ ProfileMerger │   │ProfileResolve│                │  │
│  │  │              │   │               │   │              │                │  │
│  │  │ upsert       │   │ conflict      │   │ resolve by   │                │  │
│  │  │ get 360°     │   │  resolution   │   │  email/phone/│                │  │
│  │  │ search       │   │ field merging │   │  wallet/devic│                │  │
│  │  │ timeline     │   │ LTV rollup    │   │ rank profiles│                │  │
│  │  │ suppress/GDPR│   │ rollback      │   │ confidence   │                │  │
│  │  └──────┬───────┘   └───────────────┘   └──────────────┘                │  │
│  │         │                                                                 │  │
│  └─────────┼─────────────────────────────────────────────────────────────────┘  │
│            │                                                                     │
│            ├──────────────────────────┐                                          │
│            ▼                          ▼                                          │
│  ┌─────────────────────┐  ┌─────────────────────┐                               │
│  │ 4. TRAIT ENGINE      │  │ 5. SEGMENTATION     │                               │
│  │    (traits)          │  │    (segments)        │                               │
│  │                      │  │                      │                               │
│  │  ┌────────────────┐ │  │  ┌────────────────┐  │                               │
│  │  │ TraitEngine    │ │  │  │ SegmentBuilder │  │                               │
│  │  │                │ │  │  │                │  │                               │
│  │  │ defineTrait()  │ │  │  │ createSegment()│  │                               │
│  │  │ setTrait()     │ │  │  │ updateRules()  │  │                               │
│  │  │ computeTraits()│ │  │  │ estimateSize() │  │                               │
│  │  │ batchCompute() │ │  │  │ computeSegment│  │                               │
│  │  └────────────────┘ │  │  └────────────────┘  │                               │
│  │                      │  │                      │                               │
│  │  Sources:            │  │  Types:              │                               │
│  │   computed           │  │   dynamic (rules)    │                               │
│  │   manual             │  │   static (curated)   │                               │
│  │   ML predictions     │  │   ML (lookalike)     │                               │
│  │   enrichment         │  │                      │                               │
│  │   imported           │  │  Rules DSL:          │                               │
│  │                      │  │   trait conditions    │                               │
│  │  Computations:       │  │   event conditions   │                               │
│  │   aggregate          │  │   segment inclusion  │                               │
│  │   window             │  │   nested AND/OR      │                               │
│  │   recency            │  │                      │                               │
│  │   frequency          │  │                      │                               │
│  └──────────────────────┘  └──────────┬───────────┘                               │
│                                       │                                           │
│                                       ▼                                           │
│  ┌───────────────────────────────────────────────────────────────────────────┐  │
│  │                    6. SYNC / ACTIVATION LAYER (sync)                      │  │
│  │                                                                           │  │
│  │  ┌──────────────┐   ┌───────────────┐   ┌──────────────┐                │  │
│  │  │SyncOrchestrat│   │DestinationMgr │   │   SyncJob    │                │  │
│  │  │              │   │               │   │              │                │  │
│  │  │ trigger()    │   │ CRUD          │   │ batch proc   │                │  │
│  │  │ schedule     │   │ test()        │   │ field mapping│                │  │
│  │  │ monitor      │   │ adapters      │   │ transforms   │                │  │
│  │  └──────────────┘   └───────────────┘   │ error retry  │                │  │
│  │                                          └──────────────┘                │  │
│  │                                                                           │  │
│  │  ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐     │  │
│  │  │Facebook│ │ Google │ │ TikTok │ │Klaviyo │ │Snowflak│ │Webhook │     │  │
│  │  │  Ads   │ │  Ads   │ │  Ads   │ │/ Braze │ │/BigQuer│ │/Custom │     │  │
│  │  └────────┘ └────────┘ └────────┘ └────────┘ └────────┘ └────────┘     │  │
│  │                                                                           │  │
│  └───────────────────────────────────────────────────────────────────────────┘  │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      │ powers
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│  @mcv/marketing │ @mcv/agentic-os │ @mcv/commerce │ @mcv/compliance │ analytics│
└─────────────────────────────────────────────────────────────────────────────────┘
```

### Data Flow Pipeline (Simplified)

```
                INGEST               RESOLVE              UNIFY
             ┌──────────┐      ┌──────────────┐     ┌──────────┐
  track() ──▶│ Validate  │─────▶│   Identity   │────▶│ Profile  │
  identify()▶│ Dedup     │      │   Graph      │     │ Merger   │
  page() ───▶│ Enrich    │      │  Resolution  │     │ 360° View│
             └──────────┘      └──────────────┘     └──────────┘
                                                          │
                  ┌───────────────────────────────────────┤
                  │                                       │
                  ▼                                       ▼
            ┌──────────┐                          ┌──────────────┐
            │  Trait    │                          │   Segment    │
            │  Engine   │◀── triggers ───────────▶│  Evaluator   │
            │  Compute  │                          │  Membership  │
            └──────────┘                          └──────────────┘
                                                        │
                                                        ▼
                                                  ┌──────────────┐
                                                  │    Sync      │
                                                  │ Orchestrator │
                                                  │  Activate    │
                                                  └──────────────┘
```

---

## Module Architecture

### Submodule: events

**Purpose:** High-throughput behavioral event ingestion, validation, deduplication, enrichment, storage, and routing. The events submodule is the entry point for all customer interaction data across all 9 MCV ventures.

**Directory Structure:**

```
cdp/events/
├── schema.ts              # Drizzle ORM table definitions
├── collector.ts           # EventCollector — track, trackBatch, identify, page, screen
├── processor.ts           # EventProcessor — validate, deduplicate, enrich, route
├── store.ts               # EventStore — query, aggregate, metrics
├── service.ts             # Unified service facade
├── constants.ts           # Event categories, max batch size, debounce
├── validators/
│   ├── event-schema.ts    # Zod schemas for event validation
│   ├── context-schema.ts  # EventContext validation
│   └── properties.ts      # Dynamic property schema validation
├── enrichers/
│   ├── geo-enricher.ts    # IP → country/region/city resolution
│   ├── device-enricher.ts # User-agent → device/browser/OS parsing
│   └── campaign-enricher.ts # UTM parameter extraction & normalization
├── metrics/
│   ├── aggregator.ts      # Pre-aggregate metrics into cdp_event_metric
│   └── rollup-job.ts      # Scheduled hourly/daily rollup background job
└── __tests__/
    ├── collector.test.ts
    ├── processor.test.ts
    └── store.test.ts
```

**Core Components:**

| Component | Responsibility |
|-----------|---------------|
| `EventCollector` | Public-facing API for tracking events. Accepts `track()`, `trackBatch()`, `identify()`, `page()`, `screen()`, `group()`, `alias()` calls. Delegates to processor. |
| `EventProcessor` | Internal pipeline that validates events against Zod schemas, deduplicates via `messageId` uniqueness, enriches context (geo, device, campaign), and routes to identity resolution + trait triggers. |
| `EventStore` | Query layer for events. Supports multi-dimensional filtering by venture, profile, event name, date range. Powers the Event Explorer UI. |
| `MetricsAggregator` | Pre-computes aggregated metrics into `cdp_event_metric` table at hourly/daily/weekly/monthly granularity for fast dashboard rendering. |

**Event Processing Pipeline:**

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                        EVENT PROCESSING PIPELINE                             │
│                                                                              │
│  ┌─────────┐   ┌──────────┐   ┌──────────┐   ┌──────────┐   ┌──────────┐ │
│  │ RECEIVE  │──▶│ VALIDATE │──▶│ DEDUP    │──▶│ ENRICH   │──▶│ PERSIST  │ │
│  │          │   │          │   │          │   │          │   │          │ │
│  │ HTTP/WS  │   │ Zod      │   │ messageId│   │ geo      │   │ INSERT   │ │
│  │ Redpanda │   │ schema   │   │ check    │   │ device   │   │ cdp_event│ │
│  │ import   │   │ validate │   │ idempoten│   │ campaign │   │ partition│ │
│  └─────────┘   └──────────┘   └──────────┘   └──────────┘   └────┬─────┘ │
│                                                                    │       │
│                          ┌─────────────────────────────────────────┤       │
│                          │                │                │       │       │
│                          ▼                ▼                ▼       ▼       │
│                   ┌────────────┐  ┌────────────┐  ┌────────────┐ ┌─────┐ │
│                   │  IDENTITY  │  │   TRAIT     │  │  PROFILE   │ │EVENT│ │
│                   │  RESOLVE   │  │  TRIGGER    │  │  UPDATE    │ │ BUS │ │
│                   │            │  │            │  │            │ │     │ │
│                   │ resolve()  │  │ queue      │  │ lastSeen   │ │emit │ │
│                   │ link IDs   │  │ compute    │  │ totalEvents│ │     │ │
│                   └────────────┘  └────────────┘  └────────────┘ └─────┘ │
│                                                                           │
└──────────────────────────────────────────────────────────────────────────────┘
```

**Event Categories:**

| Category | Description | Examples |
|----------|-------------|---------|
| `page` | Web page view events | Page Viewed, Section Scrolled |
| `track` | Custom behavioral events | Bet Placed, Order Completed, Token Staked |
| `identify` | Identity assertion events | User signs in, email confirmed |
| `screen` | Mobile screen view events | Screen Viewed (iOS/Android) |
| `group` | Organization/group association | User joined team, company set |
| `alias` | Identity alias creation | Anonymous → identified merge |

**Redpanda Integration:**

Events are published to Redpanda topics for downstream consumers:

```
Topic: cdp.events.raw          — All raw events (partitioned by ventureId)
Topic: cdp.events.identity     — Identity-related events (identify, alias)
Topic: cdp.events.revenue      — Revenue events (for LTV computation)
Topic: cdp.events.trait-trigger — Events that trigger trait recomputation
```

Partitioning strategy: Events are partitioned by `ventureId` to ensure all events for a single venture are processed in order within a partition. Within each partition, events are ordered by `receivedAt` timestamp.

```typescript
// Redpanda producer configuration
const producerConfig = {
  topic: 'cdp.events.raw',
  partitionKey: (event: CDPEvent) => event.ventureId,
  compression: 'snappy',
  batchSize: 500,
  lingerMs: 50,          // Buffer for 50ms to batch
  maxBatchBytes: 1048576, // 1MB max batch
};
```

**Deduplication Strategy:**

Events include a `messageId` field (client-generated UUID) with a unique constraint in the database. The processor also maintains a Redis-backed bloom filter for fast pre-check deduplication before database insertion:

```typescript
// Deduplication flow
async deduplicate(event: TrackEventInput): Promise<boolean> {
  if (!event.messageId) return false; // No messageId = always accept

  // 1. Fast check: Redis bloom filter (probabilistic, ~0.01% false positive)
  const mayExist = await redis.bf.exists('cdp:dedup:bloom', event.messageId);
  if (!mayExist) {
    await redis.bf.add('cdp:dedup:bloom', event.messageId);
    return false; // Definitely new
  }

  // 2. Definitive check: PostgreSQL unique constraint
  // Handled by INSERT ... ON CONFLICT (message_id) DO NOTHING
  return true; // Likely duplicate
}
```

---

### Submodule: identity-graph

**Purpose:** Cross-venture identity resolution and matching. Maintains a directed graph of identifier nodes (email, phone, device ID, wallet address, social IDs, advertising IDs) connected by co-occurrence edges, and resolves them to unified profiles.

**Directory Structure:**

```
cdp/identity-graph/
├── schema.ts              # Drizzle ORM: identity_nodes, identity_edges, resolution_rules
├── service.ts             # IdentityGraph — main service class
├── resolver.ts            # IdentityResolver — resolution algorithm
├── alias-manager.ts       # AliasManager — manage identifier aliases
├── constants.ts           # Identity types, confidence thresholds
├── algorithms/
│   ├── deterministic.ts   # Exact match on hashed identifiers
│   ├── probabilistic.ts   # Fuzzy matching with confidence scoring
│   ├── graph-traversal.ts # BFS/DFS for connected component discovery
│   └── merge-scorer.ts    # Scoring algorithm for merge decisions
├── validators/
│   ├── identity-schema.ts # Zod schemas for identity inputs
│   └── resolution-rules.ts # Rule validation
└── __tests__/
    ├── resolver.test.ts
    ├── deterministic.test.ts
    └── probabilistic.test.ts
```

**Core Components:**

| Component | Responsibility |
|-----------|---------------|
| `IdentityGraph` | Manages the graph of identifier nodes and co-occurrence edges. Provides graph traversal and visualization. |
| `IdentityResolver` | Core resolution algorithm: collects identifiers, hashes, finds matching nodes, collects profiles, applies merge rules, returns highest-confidence profile. |
| `AliasManager` | CRUD for identifier aliases with verification tracking, PII hashing, and cross-venture deduplication. |

**Identity Resolution Algorithm:**

The resolution algorithm is a multi-step process that efficiently resolves one or more identifiers to a single profile:

```
┌───────────────────────────────────────────────────────────────────────┐
│                    IDENTITY RESOLUTION FLOW                           │
│                                                                       │
│  Input: { email: "j@x.com", deviceId: "abc123", wallet: "0x..." }   │
│                                                                       │
│  Step 1 — HASH ALL IDENTIFIERS                                       │
│     email   → SHA256("j@x.com")     → node_A                        │
│     device  → SHA256("abc123")      → node_B                        │
│     wallet  → SHA256("0x...")       → node_C                        │
│                                                                       │
│  Step 2 — FIND EXISTING NODES IN cdp_identity_node                   │
│     node_A → profile_1  (confidence: 1.0)                            │
│     node_B → profile_1  (confidence: 0.9)                            │
│     node_C → profile_2  (confidence: 1.0)                            │
│                                                                       │
│  Step 3 — COLLECT UNIQUE PROFILES: { profile_1, profile_2 }         │
│                                                                       │
│  Step 4 — APPLY RESOLUTION RULES                                     │
│     Rule "email_wallet_merge" → action: merge                        │
│     ✓ identity types [email, wallet] present                         │
│     ✓ confidence ≥ 0.8                                               │
│                                                                       │
│  Step 5 — AUTO-MERGE: profile_1 (winner) ← profile_2 (loser)        │
│     Winner = profile with most events                                 │
│                                                                       │
│  Result: { profileId: profile_1, confidence: 1.0 }                   │
└───────────────────────────────────────────────────────────────────────┘
```

**Deterministic vs. Probabilistic Matching:**

| Strategy | Trigger | Confidence | Example |
|----------|---------|-----------|---------|
| **Deterministic** | Exact hash match on known identifier | 1.0 | Same email appears on two profiles |
| **Probabilistic** | Co-occurrence patterns, fuzzy matching | 0.5–0.95 | Same device + similar browsing pattern |
| **ML-Enhanced** | Model-predicted identity linkage | 0.3–0.99 | Behavioral fingerprinting across ventures |

**Graph Data Structure:**

The identity graph uses a node-edge model stored in PostgreSQL:

- **Nodes** (`cdp_identity_node`): Each unique identifier (email, phone, device_id, wallet, cookie, social, advertising, custom) is a node. Nodes are scoped by `ventureId` and store a SHA-256 hash of the value for fast indexed lookups.
- **Edges** (`cdp_identity_edge`): Co-occurrence links between nodes. When two identifiers appear in the same event or session, an edge is created or strengthened. Edge `strength` tracks co-occurrence count; `confidence` tracks resolution confidence.
- **Rules** (`cdp_resolution_rule`): Per-venture configurable policies that define when auto-merge should trigger based on identity types, confidence thresholds, and occurrence counts.

**Cross-Venture Resolution:**

The identity graph supports cross-venture resolution when identifiers are shared across ventures. For example, if a user uses the same email on BetEdge and SerpSpace:

```
Venture: BetEdge                    Venture: SerpSpace
┌────────────────────┐              ┌────────────────────┐
│ node: email        │              │ node: email        │
│ value: j@x.com     │              │ value: j@x.com     │
│ profile: betedge-1 │              │ profile: serp-42   │
└────────────────────┘              └────────────────────┘
         │                                    │
         └─────────── cross-venture ──────────┘
                      link detected
                           │
                           ▼
                 Portfolio-level merge
                 (requires admin auth)
```

Cross-venture merges require portfolio-level authorization and create a "super-profile" that spans ventures while maintaining per-venture data isolation.

---

### Submodule: profiles

**Purpose:** Unified customer profile management with 360° view capability. Each profile represents a single human (or anonymous device) with consolidated identity aliases, behavioral traits, engagement metrics, and lifetime value tracking.

**Directory Structure:**

```
cdp/profiles/
├── schema.ts              # Drizzle ORM: profiles, profile_aliases, profile_merges, profile_timeline
├── service.ts             # ProfileService — main service facade
├── merger.ts              # ProfileMerger — conflict resolution, field merging
├── resolver.ts            # ProfileResolver — resolve identifiers to profiles
├── queries.ts             # Exported query functions (getProfile, searchProfiles, etc.)
├── constants.ts           # Profile statuses, types, merge strategies
├── validators/
│   ├── profile-schema.ts  # Zod schemas for profile CRUD
│   └── search-schema.ts   # Search criteria validation
├── merge/
│   ├── strategies.ts      # Merge strategy definitions (newest, primary, merged)
│   ├── conflict-resolver.ts # Field-level conflict resolution
│   └── rollback.ts        # Merge rollback support
├── gdpr/
│   ├── suppression.ts     # Profile suppression (right to erasure)
│   ├── export.ts          # Data export (right to access)
│   └── consent.ts         # Consent tracking integration
└── __tests__/
    ├── service.test.ts
    ├── merger.test.ts
    └── gdpr.test.ts
```

**Core Components:**

| Component | Responsibility |
|-----------|---------------|
| `ProfileService` | Main facade: upsert, get, search, update, addAlias, merge, suppress, timeline. Orchestrates identity resolution and trait computation. |
| `ProfileMerger` | Handles the complex logic of merging two profiles: field-level conflict resolution, LTV rollup, alias migration, event reassignment, and audit trail. |
| `ProfileResolver` | Thin wrapper that resolves input identifiers (email, phone, userId, deviceId, wallet) to an existing profile or signals that a new one should be created. |

**Profile Lifecycle:**

```
                    ┌──────────┐
                    │ ANONYMOUS│ ←── First device/cookie touch
                    └────┬─────┘
                         │ identify() with email
                         ▼
                    ┌──────────┐
                    │   LEAD   │ ←── Has email but no account
                    └────┬─────┘
                         │ enrichment (Clearbit, etc.)
                         ▼
                    ┌──────────┐
                    │ PROSPECT │ ←── Enriched lead with company data
                    └────┬─────┘
                         │ user signs up / links account
                         ▼
                    ┌──────────┐
                    │IDENTIFIED│ ←── Has authenticated user account
                    └────┬─────┘
                         │
              ┌──────────┼──────────┐
              │          │          │
              ▼          ▼          ▼
        ┌──────────┐ ┌────────┐ ┌─────────┐
        │  MERGED  │ │SUPPRESS│ │ DELETED │
        │(into other│ │(GDPR)  │ │(hard del│
        │ profile)  │ │        │ │  req.)  │
        └──────────┘ └────────┘ └─────────┘
```

**Merge Strategy:**

When two profiles need to be merged (e.g., same email discovered on two profiles), the merger follows this decision tree:

1. **Winner Selection**: Profile with more events wins (keeps its ID).
2. **Field Merging**: For each field, apply strategy:
   - `displayName` → use most recently updated
   - `traits` → deep merge (primary overrides on conflict)
   - `externalIds` → union of all IDs
   - `totalEvents` / `totalSessions` → sum
   - `ltvAmount` → sum
   - `firstSeenAt` → earliest
   - `lastSeenAt` → latest
3. **Alias Migration**: All aliases from the loser are moved to the winner.
4. **Event Reassignment**: Events referencing the loser's profileId are updated.
5. **Audit Trail**: Full merge log recorded in `cdp_profile_merge`.
6. **Reversibility**: Merge is marked as reversible with rollback data preserved.

**GDPR Compliance:**

The profiles submodule provides full GDPR support:

| Right | Implementation |
|-------|---------------|
| **Right to Access** | `exportProfile()` — generates JSON export of all profile data, aliases, events, traits, and segment memberships |
| **Right to Erasure** | `suppressProfile()` — clears all PII fields, deletes aliases, sets status to `suppressed`, anonymizes event links |
| **Right to Rectification** | `updateProfile()` — standard profile update with audit trail |
| **Right to Portability** | Export in machine-readable JSON format via `exportProfile()` |
| **Consent Management** | Integration with `@mcv/compliance` for consent-gated processing |

---

### Submodule: segments

**Purpose:** Dynamic audience segmentation engine that builds, evaluates, and maintains audiences based on profile traits, event history, and nested boolean logic. Segments power marketing campaigns, ad targeting, content personalization, and analytics across all MCV ventures.

**Directory Structure:**

```
cdp/segments/
├── schema.ts              # Drizzle ORM: segments, segment_memberships, segment_computations
├── service.ts             # SegmentService — main facade
├── builder.ts             # SegmentBuilder — create/configure segments
├── evaluator.ts           # SegmentEvaluator — evaluate rules against profiles
├── membership.ts          # MembershipEngine — manage membership lifecycle
├── constants.ts           # Segment types, statuses, max rule depth
├── rules/
│   ├── dsl.ts             # Segment rules DSL type definitions
│   ├── compiler.ts        # Compile rules DSL → SQL WHERE clause
│   ├── optimizer.ts       # Query plan optimization for complex rules
│   └── validator.ts       # Validate rule structure and prevent cycles
├── computation/
│   ├── full-compute.ts    # Full segment recomputation
│   ├── incremental.ts     # Incremental membership diff
│   └── scheduler.ts       # Scheduled recomputation cron
├── ml/
│   ├── lookalike.ts       # ML-based lookalike audience generation
│   └── predictive.ts      # Predictive segment via OpenRouter
└── __tests__/
    ├── evaluator.test.ts
    ├── compiler.test.ts
    └── membership.test.ts
```

**Core Components:**

| Component | Responsibility |
|-----------|---------------|
| `SegmentBuilder` | Create and configure segment definitions with rules DSL validation. |
| `SegmentEvaluator` | Compile rules DSL into efficient SQL queries, evaluate single-profile membership in real-time. |
| `MembershipEngine` | Manage the segment membership lifecycle: compute, diff, enter, exit, with full audit trail. |

**Segment Types:**

| Type | Description | Recomputation |
|------|-------------|--------------|
| **Dynamic** | Rule-based, automatically recomputed when traits/events change | Scheduled (hourly/daily) + on-demand |
| **Static** | Manually curated list of profiles | Manual only — profiles added/removed via API |
| **ML** | Lookalike or predictive audience based on a seed segment | On-demand via OpenRouter model inference |

**Rules DSL:**

The segment rules DSL supports arbitrary nesting of AND/OR conditions with four condition types:

```typescript
interface SegmentRules {
  operator: 'and' | 'or';
  conditions: SegmentCondition[];
}

interface SegmentCondition {
  type: 'trait' | 'event' | 'segment' | 'computed';

  // Trait conditions
  traitKey?: string;

  // Event conditions
  eventName?: string;
  timeframe?: { value: number; unit: 'days' | 'hours' | 'minutes' };

  // Segment inclusion/exclusion
  segmentId?: string;

  // Comparison
  operator: 'eq' | 'ne' | 'gt' | 'gte' | 'lt' | 'lte'
          | 'contains' | 'not_contains'
          | 'exists' | 'not_exists'
          | 'in' | 'not_in';
  value?: unknown;

  // Nested conditions (unlimited depth)
  conditions?: SegmentCondition[];
  nestedOperator?: 'and' | 'or';
}
```

**Rules → SQL Compilation:**

The evaluator compiles the rules DSL into optimized PostgreSQL queries:

```
Rules DSL:
{
  operator: "and",
  conditions: [
    { type: "trait", traitKey: "lifetime_value", operator: "gte", value: 500 },
    { type: "trait", traitKey: "days_since_last_bet", operator: "gte", value: 30 },
    { type: "event", eventName: "Bet Placed", timeframe: { value: 90, unit: "days" }, operator: "exists" }
  ]
}

Compiled SQL:
SELECT p.id FROM cdp_profile p
WHERE p.venture_id = $1
  AND p.status = 'active'
  AND (p.traits->>'lifetime_value')::numeric >= 500
  AND (p.traits->>'days_since_last_bet')::numeric >= 30
  AND EXISTS (
    SELECT 1 FROM cdp_event e
    WHERE e.profile_id = p.id
      AND e.name = 'Bet Placed'
      AND e.timestamp >= NOW() - INTERVAL '90 days'
  )
```

**Computation Flow:**

```
┌─────────────────────────────────────────────────────────────┐
│                  SEGMENT COMPUTATION FLOW                     │
│                                                               │
│  1. Load segment definition + rules                          │
│  2. Compile rules → SQL WHERE clause                         │
│  3. Execute: SELECT profile_ids WHERE rules match            │
│  4. Load current membership set from cdp_segment_membership  │
│  5. Compute diff:                                            │
│     - NEW = matched_profiles - current_members               │
│     - EXITED = current_members - matched_profiles            │
│  6. INSERT new memberships (enteredAt, entryReason)          │
│  7. UPDATE exited memberships (exitedAt, exitReason)         │
│  8. Update segment stats (size, lastComputedAt)              │
│  9. Record computation in cdp_segment_computation            │
│  10. Emit cdp.segment.computed event                         │
│  11. Trigger sync if syncEnabled = true                      │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

---

### Submodule: sync

**Purpose:** Outbound data synchronization to external activation destinations. Manages destination configurations, field mapping, data transformation, batched delivery, and retry logic. Supports ad platforms (Facebook, Google, TikTok), email platforms (Klaviyo, Braze), CRMs (HubSpot, Salesforce), data warehouses (Snowflake, BigQuery), and custom webhooks.

**Directory Structure:**

```
cdp/sync/
├── schema.ts              # Drizzle ORM: destinations, sync_configs, sync_jobs
├── orchestrator.ts        # SyncOrchestrator — trigger, schedule, monitor
├── destination-manager.ts # DestinationManager — CRUD, test connectivity
├── job.ts                 # SyncJob — individual job execution
├── constants.ts           # Destination types, sync modes, batch sizes
├── adapters/
│   ├── base.ts            # DestinationAdapter interface
│   ├── facebook-ads.ts    # Facebook Custom Audiences adapter
│   ├── google-ads.ts      # Google Customer Match adapter
│   ├── tiktok-ads.ts      # TikTok Audiences adapter
│   ├── klaviyo.ts         # Klaviyo list sync adapter
│   ├── braze.ts           # Braze user sync adapter
│   ├── hubspot.ts         # HubSpot contacts adapter
│   ├── salesforce.ts      # Salesforce leads adapter
│   ├── snowflake.ts       # Snowflake data share adapter
│   ├── bigquery.ts        # BigQuery dataset adapter
│   └── webhook.ts         # Generic webhook adapter
├── transforms/
│   ├── hash.ts            # SHA-256 hashing for ad platform PII
│   ├── phone-e164.ts      # Phone number → E.164 format
│   ├── field-mapper.ts    # Generic field mapping engine
│   └── normalizer.ts      # Lowercase, trim, normalize
├── scheduler/
│   ├── cron.ts            # Cron-based sync scheduling
│   └── realtime.ts        # Real-time sync on membership change
└── __tests__/
    ├── orchestrator.test.ts
    ├── adapters/
    │   ├── facebook.test.ts
    │   └── webhook.test.ts
    └── transforms.test.ts
```

**Core Components:**

| Component | Responsibility |
|-----------|---------------|
| `SyncOrchestrator` | Top-level coordinator: triggers sync jobs, manages scheduling, monitors progress, handles retries. |
| `DestinationManager` | CRUD for destination configurations with credential encryption and connectivity testing. |
| `SyncJob` | Individual job execution: loads segment members, applies field mappings and transforms, batches records, delivers to adapter, tracks progress. |

**Sync Pipeline:**

```
┌────────────────────────────────────────────────────────────────────────────┐
│                          SYNC PIPELINE                                     │
│                                                                            │
│  ┌──────────┐   ┌──────────┐   ┌──────────┐   ┌──────────┐   ┌────────┐│
│  │  LOAD    │──▶│  MAP     │──▶│TRANSFORM │──▶│  BATCH   │──▶│DELIVER ││
│  │          │   │          │   │          │   │          │   │        ││
│  │ segment  │   │ field    │   │ hash PII │   │ chunk to │   │ adapter││
│  │ members  │   │ mappings │   │ E.164    │   │ batch    │   │ .sync()││
│  │ profiles │   │ apply    │   │ normalize│   │ size     │   │        ││
│  └──────────┘   └──────────┘   └──────────┘   └──────────┘   └───┬────┘│
│                                                                    │     │
│                                              ┌─────────────────────┤     │
│                                              │                     │     │
│                                              ▼                     ▼     │
│                                        ┌──────────┐         ┌──────────┐│
│                                        │  RETRY   │         │  REPORT  ││
│                                        │          │         │          ││
│                                        │ per-rec  │         │ success  ││
│                                        │ backoff  │         │ failures ││
│                                        │ 3 max    │         │ metrics  ││
│                                        └──────────┘         └──────────┘│
│                                                                          │
└────────────────────────────────────────────────────────────────────────────┘
```

**Destination Adapters:**

Each destination type has a dedicated adapter implementing the `DestinationAdapter` interface:

```typescript
interface DestinationAdapter {
  /** Validate credentials and test connectivity */
  test(destination: Destination): Promise<{ success: boolean; message: string }>;

  /** Sync a batch of records to the destination */
  sync(
    destination: Destination,
    records: SyncRecord[],
    mode: 'full' | 'incremental',
  ): Promise<SyncBatchResult>;

  /** Remove records from the destination (for segment exits) */
  remove?(destination: Destination, profileIds: string[]): Promise<void>;
}
```

**Sync Modes:**

| Mode | Description | Use Case |
|------|-------------|----------|
| **Full** | Replaces entire audience at destination | Initial sync, data cleanup |
| **Incremental** | Sends only additions and removals since last sync | Daily/hourly updates |
| **Real-time** | Syncs immediately when segment membership changes | High-priority audiences |

**Field Transformations:**

| Transform | Description | Used By |
|-----------|-------------|---------|
| `hash` | SHA-256 hash (required for ad platform PII) | Facebook Ads, Google Ads, TikTok |
| `phone_e164` | Convert phone to E.164 international format | All ad platforms |
| `lowercase` | Lowercase and trim | Email normalization |
| `uppercase` | Uppercase | Country codes |

---

### Submodule: traits

**Purpose:** Computed and behavioral attribute management. Traits are the building blocks for segmentation — every segment rule evaluates against profile traits. The trait engine supports aggregate computations, time-windowed calculations, recency tracking, frequency analysis, ML predictions, and third-party enrichment.

**Directory Structure:**

```
cdp/traits/
├── schema.ts              # Drizzle ORM: trait_definitions, trait_values, trait_computation_jobs
├── engine.ts              # TraitEngine — define, compute, manage traits
├── computer.ts            # TraitComputer — execute computation rules
├── store.ts               # TraitStore — read/write trait values
├── operations.ts          # Exported operation functions
├── constants.ts           # Trait types, sources, debounce config
├── computations/
│   ├── aggregate.ts       # count, sum, avg, min, max, first, last
│   ├── window.ts          # Time-windowed aggregations (last N days)
│   ├── recency.ts         # Days/hours since last event
│   ├── frequency.ts       # Active days in time window
│   ├── custom-sql.ts      # Custom SQL computation rules
│   └── ml-prediction.ts   # ML-based trait computation via OpenRouter
├── batch/
│   ├── batch-computer.ts  # Batch compute a trait across all profiles
│   ├── scheduler.ts       # Nightly batch computation scheduling
│   └── progress.ts        # Job progress tracking
├── validators/
│   ├── trait-schema.ts    # Zod schemas for trait definitions
│   └── computation-rule.ts # Computation rule validation
└── __tests__/
    ├── engine.test.ts
    ├── computations/
    │   ├── aggregate.test.ts
    │   ├── window.test.ts
    │   └── recency.test.ts
    └── batch.test.ts
```

**Core Components:**

| Component | Responsibility |
|-----------|---------------|
| `TraitEngine` | Main facade: define traits, set/get values, trigger computation, batch compute. |
| `TraitComputer` | Executes computation rules against event data: aggregate, window, recency, frequency, custom SQL, ML prediction. |
| `TraitStore` | Read/write layer for materialized trait values with optimistic locking and expiration. |

**Trait Sources:**

| Source | Description | Example |
|--------|-------------|---------|
| **Computed** | Derived automatically from event data via computation rules | `total_bets`, `avg_order_value`, `days_since_last_login` |
| **Manual** | Set explicitly via API or admin UI | `vip_status`, `preferred_sport`, `account_manager` |
| **Imported** | Bulk CSV/JSON import from external systems | `company_size`, `industry`, `annual_revenue` |
| **Enrichment** | Third-party data enrichment (Clearbit, etc.) | `job_title`, `company_name`, `linkedin_url` |
| **ML** | Machine learning model predictions | `churn_risk`, `conversion_propensity`, `lifetime_value_predicted` |

**Computation Types:**

| Type | Description | SQL Pattern |
|------|-------------|-------------|
| **aggregate** | count, sum, avg, min, max over event properties | `SELECT COUNT(*)/SUM(prop)/AVG(prop) FROM cdp_event WHERE profile_id = $1 AND name = $2` |
| **window** | Count/sum within last N days | `... AND timestamp >= NOW() - INTERVAL 'N days'` |
| **recency** | Days/hours since last occurrence of event | `SELECT EXTRACT(EPOCH FROM NOW() - MAX(timestamp))/86400 FROM cdp_event WHERE ...` |
| **frequency** | Count of distinct active days in window | `SELECT COUNT(DISTINCT DATE(timestamp)) FROM cdp_event WHERE ... AND timestamp >= NOW() - INTERVAL 'N days'` |
| **custom** | Custom SQL expression | Arbitrary SQL with parameter binding |

**Trait Materialization Strategy:**

Trait values are materialized in two places for performance:

1. **`cdp_trait_value` table** — Canonical store with full metadata (source, confidence, expiry, versioning)
2. **`cdp_profile.traits` JSONB column** — Denormalized copy for fast segment evaluation via JSONB queries

When a trait is computed or set, both locations are updated atomically:

```typescript
async materializeTrait(profileId: string, key: string, value: unknown): Promise<void> {
  await db.transaction(async (tx) => {
    // 1. Upsert in cdp_trait_value
    await tx.insert(traitValues)
      .values({ profileId, traitDefinitionId, value, source, computedAt: new Date() })
      .onConflictDoUpdate({ set: { value, computedAt: new Date(), version: sql`version + 1` } });

    // 2. Update JSONB on profile
    await tx.update(profiles)
      .set({ traits: sql`jsonb_set(traits, '{${key}}', ${JSON.stringify(value)}::jsonb)` })
      .where(eq(profiles.id, profileId));
  });
}
```

**Event-Triggered Computation:**

When an event is tracked, the processor checks if the event name matches any trait's `triggerEvent` configuration. If so, it queues a debounced trait computation:

```
Event "Bet Placed" tracked
        │
        ▼
Check: Any traits triggered by "Bet Placed"?
        │
        ├── total_bets (aggregate count)
        ├── total_wagered (aggregate sum of revenue)
        ├── days_since_last_bet (recency)
        └── active_betting_days_30d (frequency window)
        │
        ▼
Queue debounced computation (5s coalesce window)
        │
        ▼
Execute all 4 computations for this profile
        │
        ▼
Materialize updated values → trait_values + profile.traits
```

---

## Data Models

### Complete Database Schema (Drizzle ORM)

The CDP maintains 15 core tables across 6 submodules. All tables use CUID2 for primary keys, include `createdAt` timestamps, and are scoped by `ventureId` where applicable.

#### Table: `cdp_profile`

The core unified customer profile table. Each row represents a single customer across a venture.

```typescript
export const profiles = pgTable('cdp_profile', {
  id: text('id').$defaultFn(() => createId()).primaryKey(),
  ventureId: text('venture_id').references(() => ventures.id).notNull(),
  userId: text('user_id').references(() => users.id),
  type: profileTypeEnum('type').default('anonymous').notNull(),
  status: profileStatusEnum('status').default('active').notNull(),
  canonicalEmail: text('canonical_email'),
  canonicalPhone: text('canonical_phone'),
  displayName: text('display_name'),
  avatarUrl: text('avatar_url'),
  country: text('country'),
  region: text('region'),
  city: text('city'),
  timezone: text('timezone'),
  firstSeenAt: timestamp('first_seen_at'),
  lastSeenAt: timestamp('last_seen_at'),
  lastActiveAt: timestamp('last_active_at'),
  totalEvents: integer('total_events').default(0),
  totalSessions: integer('total_sessions').default(0),
  ltvAmount: numeric('ltv_amount', { precision: 20, scale: 4 }).default('0'),
  ltvCurrency: text('ltv_currency').default('USD'),
  externalIds: jsonb('external_ids').$type<Record<string, string>>().default({}),
  traits: jsonb('traits').$type<Record<string, unknown>>().default({}),
  mergedIntoId: text('merged_into_id'),
  mergedAt: timestamp('merged_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});
```

**Indexes:** `venture_id`, `user_id`, `canonical_email`, `canonical_phone`, `status`, `last_seen_at`

**Estimated rows:** 1M+ (across all ventures)

---

#### Table: `cdp_profile_alias`

All known identifiers for a profile — email addresses, phone numbers, device IDs, wallet addresses, cookies, social IDs.

```typescript
export const profileAliases = pgTable('cdp_profile_alias', {
  id: text('id').$defaultFn(() => createId()).primaryKey(),
  profileId: text('profile_id').references(() => profiles.id).notNull(),
  type: text('type').notNull(),
  value: text('value').notNull(),
  valueHash: text('value_hash').notNull(),
  isVerified: boolean('is_verified').default(false),
  verifiedAt: timestamp('verified_at'),
  verificationMethod: text('verification_method'),
  source: text('source').notNull(),
  sourceId: text('source_id'),
  confidence: numeric('confidence', { precision: 5, scale: 4 }).default('1.0'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});
```

**Indexes:** `profile_id`, UNIQUE(`type`, `value_hash`), `value_hash`

**Estimated rows:** 3M+

---

#### Table: `cdp_profile_merge`

Audit trail for all profile merge operations with rollback support.

```typescript
export const profileMerges = pgTable('cdp_profile_merge', {
  id: text('id').$defaultFn(() => createId()).primaryKey(),
  primaryProfileId: text('primary_profile_id').references(() => profiles.id).notNull(),
  secondaryProfileId: text('secondary_profile_id').references(() => profiles.id).notNull(),
  reason: text('reason').notNull(),
  confidence: numeric('confidence', { precision: 5, scale: 4 }),
  triggeredBy: text('triggered_by'),
  mergeLog: jsonb('merge_log').$type<MergeLog>(),
  isReversible: boolean('is_reversible').default(true),
  reversedAt: timestamp('reversed_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});
```

**Indexes:** `primary_profile_id`, `secondary_profile_id`

**Estimated rows:** 50K+

---

#### Table: `cdp_profile_timeline`

Aggregated activity feed for each profile, derived from events.

```typescript
export const profileTimeline = pgTable('cdp_profile_timeline', {
  id: text('id').$defaultFn(() => createId()).primaryKey(),
  profileId: text('profile_id').references(() => profiles.id).notNull(),
  activityType: text('activity_type').notNull(),
  title: text('title').notNull(),
  description: text('description'),
  metadata: jsonb('metadata').$type<Record<string, unknown>>(),
  eventId: text('event_id'),
  occurredAt: timestamp('occurred_at').notNull(),
});
```

**Indexes:** COMPOSITE(`profile_id`, `occurred_at`)

**Estimated rows:** 10M+ (partitioned by date)

---

#### Table: `cdp_identity_node`

Each unique identifier in the identity graph.

```typescript
export const identityNodes = pgTable('cdp_identity_node', {
  id: text('id').$defaultFn(() => createId()).primaryKey(),
  ventureId: text('venture_id').references(() => ventures.id).notNull(),
  type: identityTypeEnum('type').notNull(),
  value: text('value').notNull(),
  valueHash: text('value_hash').notNull(),
  profileId: text('profile_id').references(() => profiles.id),
  firstSeenAt: timestamp('first_seen_at').defaultNow().notNull(),
  lastSeenAt: timestamp('last_seen_at').defaultNow().notNull(),
  occurrenceCount: integer('occurrence_count').default(1),
  sources: jsonb('sources').$type<IdentitySource[]>().default([]),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});
```

**Indexes:** UNIQUE(`venture_id`, `type`, `value_hash`), `profile_id`, `value_hash`

**Estimated rows:** 5M+

---

#### Table: `cdp_identity_edge`

Co-occurrence links between identity nodes.

```typescript
export const identityEdges = pgTable('cdp_identity_edge', {
  id: text('id').$defaultFn(() => createId()).primaryKey(),
  sourceNodeId: text('source_node_id').references(() => identityNodes.id).notNull(),
  targetNodeId: text('target_node_id').references(() => identityNodes.id).notNull(),
  strength: integer('strength').default(1),
  confidence: numeric('confidence', { precision: 5, scale: 4 }).default('1.0'),
  linkType: text('link_type').notNull(),
  firstLinkedAt: timestamp('first_linked_at').defaultNow().notNull(),
  lastLinkedAt: timestamp('last_linked_at').defaultNow().notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});
```

**Indexes:** `source_node_id`, `target_node_id`, UNIQUE(`source_node_id`, `target_node_id`)

**Estimated rows:** 10M+

---

#### Table: `cdp_resolution_rule`

Per-venture configurable identity merge policies.

```typescript
export const resolutionRules = pgTable('cdp_resolution_rule', {
  id: text('id').$defaultFn(() => createId()).primaryKey(),
  ventureId: text('venture_id').references(() => ventures.id).notNull(),
  name: text('name').notNull(),
  description: text('description'),
  priority: integer('priority').default(100),
  identityTypes: jsonb('identity_types').$type<string[]>().notNull(),
  minConfidence: numeric('min_confidence', { precision: 5, scale: 4 }).default('0.8'),
  minOccurrences: integer('min_occurrences').default(1),
  action: text('action').notNull(),
  requiresReview: boolean('requires_review').default(false),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});
```

**Estimated rows:** 100+

---

#### Table: `cdp_event`

High-volume raw behavioral events. **Partitioned by date (monthly)** for performance.

```typescript
export const events = pgTable('cdp_event', {
  id: text('id').$defaultFn(() => createId()).primaryKey(),
  ventureId: text('venture_id').references(() => ventures.id).notNull(),
  profileId: text('profile_id').references(() => profiles.id),
  anonymousId: text('anonymous_id'),
  category: eventCategoryEnum('category').notNull(),
  name: text('name').notNull(),
  properties: jsonb('properties').$type<Record<string, unknown>>().default({}),
  context: jsonb('context').$type<EventContext>().default({}),
  timestamp: timestamp('timestamp').notNull(),
  receivedAt: timestamp('received_at').defaultNow().notNull(),
  sentAt: timestamp('sent_at'),
  source: text('source').notNull(),
  sourceId: text('source_id'),
  messageId: text('message_id').unique(),
  revenue: numeric('revenue', { precision: 20, scale: 4 }),
  currency: text('currency'),
  version: integer('version').default(1),
});
```

**Indexes:** COMPOSITE(`venture_id`, `timestamp`), COMPOSITE(`profile_id`, `timestamp`), `name`, `anonymous_id`

**Partitioning:** Monthly by `timestamp` (e.g., `cdp_event_2026_01`, `cdp_event_2026_02`)

**Estimated rows:** 100M+

---

#### Table: `cdp_event_definition`

Schema registry for event types — tracks known event names, schemas, and usage.

```typescript
export const eventDefinitions = pgTable('cdp_event_definition', {
  id: text('id').$defaultFn(() => createId()).primaryKey(),
  ventureId: text('venture_id').references(() => ventures.id).notNull(),
  category: eventCategoryEnum('category').notNull(),
  name: text('name').notNull(),
  description: text('description'),
  propertiesSchema: jsonb('properties_schema').$type<JSONSchema>(),
  status: text('status').default('active'),
  totalCount: integer('total_count').default(0),
  lastSeenAt: timestamp('last_seen_at'),
  tags: jsonb('tags').$type<string[]>().default([]),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});
```

**Indexes:** UNIQUE(`venture_id`, `category`, `name`)

**Estimated rows:** 500+

---

#### Table: `cdp_event_metric`

Pre-aggregated event metrics for dashboard performance.

```typescript
export const eventMetrics = pgTable('cdp_event_metric', {
  id: text('id').$defaultFn(() => createId()).primaryKey(),
  ventureId: text('venture_id').references(() => ventures.id).notNull(),
  windowStart: timestamp('window_start').notNull(),
  windowEnd: timestamp('window_end').notNull(),
  granularity: text('granularity').notNull(),
  eventName: text('event_name').notNull(),
  source: text('source'),
  eventCount: integer('event_count').default(0),
  uniqueProfiles: integer('unique_profiles').default(0),
  totalRevenue: numeric('total_revenue', { precision: 20, scale: 4 }),
  propertyAggregates: jsonb('property_aggregates').$type<Record<string, number>>(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});
```

**Indexes:** COMPOSITE(`venture_id`, `granularity`, `window_start`), `event_name`

**Estimated rows:** 1M+

---

#### Table: `cdp_trait_definition`

Schema definitions for available traits per venture.

```typescript
export const traitDefinitions = pgTable('cdp_trait_definition', {
  id: text('id').$defaultFn(() => createId()).primaryKey(),
  ventureId: text('venture_id').references(() => ventures.id).notNull(),
  key: text('key').notNull(),
  name: text('name').notNull(),
  description: text('description'),
  category: text('category'),
  type: traitTypeEnum('type').notNull(),
  source: traitSourceEnum('source').notNull(),
  computationRule: jsonb('computation_rule').$type<ComputationRule>(),
  mlModelId: text('ml_model_id'),
  defaultValue: jsonb('default_value'),
  validationRules: jsonb('validation_rules').$type<ValidationRule[]>(),
  isPii: boolean('is_pii').default(false),
  isExportable: boolean('is_exportable').default(true),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});
```

**Indexes:** UNIQUE(`venture_id`, `key`), `category`

**Estimated rows:** 500+

---

#### Table: `cdp_trait_value`

Per-profile materialized trait values.

```typescript
export const traitValues = pgTable('cdp_trait_value', {
  id: text('id').$defaultFn(() => createId()).primaryKey(),
  profileId: text('profile_id').references(() => profiles.id).notNull(),
  traitDefinitionId: text('trait_definition_id').references(() => traitDefinitions.id).notNull(),
  value: jsonb('value'),
  source: traitSourceEnum('source').notNull(),
  sourceDetails: jsonb('source_details').$type<SourceDetails>(),
  confidence: numeric('confidence', { precision: 5, scale: 4 }),
  computedAt: timestamp('computed_at'),
  expiresAt: timestamp('expires_at'),
  version: integer('version').default(1),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});
```

**Indexes:** UNIQUE(`profile_id`, `trait_definition_id`), `trait_definition_id`

**Estimated rows:** 5M+

---

#### Table: `cdp_trait_computation_job`

Batch trait computation job tracking.

```typescript
export const traitComputationJobs = pgTable('cdp_trait_computation_job', {
  id: text('id').$defaultFn(() => createId()).primaryKey(),
  traitDefinitionId: text('trait_definition_id').references(() => traitDefinitions.id).notNull(),
  profileId: text('profile_id').references(() => profiles.id),
  triggeredBy: text('triggered_by').notNull(),
  triggerEventName: text('trigger_event_name'),
  status: text('status').default('pending'),
  profilesProcessed: integer('profiles_processed').default(0),
  profilesUpdated: integer('profiles_updated').default(0),
  error: text('error'),
  startedAt: timestamp('started_at'),
  completedAt: timestamp('completed_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});
```

**Estimated rows:** 10K+

---

#### Table: `cdp_segment`

Segment definitions with rules, type, and status.

```typescript
export const segments = pgTable('cdp_segment', {
  id: text('id').$defaultFn(() => createId()).primaryKey(),
  ventureId: text('venture_id').references(() => ventures.id).notNull(),
  name: text('name').notNull(),
  slug: text('slug').notNull(),
  description: text('description'),
  type: segmentTypeEnum('type').default('dynamic').notNull(),
  status: segmentStatusEnum('status').default('draft').notNull(),
  rules: jsonb('rules').$type<SegmentRules>(),
  seedSegmentId: text('seed_segment_id'),
  mlModelId: text('ml_model_id'),
  similarityThreshold: numeric('similarity_threshold', { precision: 5, scale: 4 }),
  estimatedSize: integer('estimated_size'),
  lastComputedSize: integer('last_computed_size'),
  lastComputedAt: timestamp('last_computed_at'),
  syncEnabled: boolean('sync_enabled').default(false),
  syncDestinations: jsonb('sync_destinations').$type<string[]>().default([]),
  tags: jsonb('tags').$type<string[]>().default([]),
  createdBy: text('created_by'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});
```

**Indexes:** UNIQUE(`venture_id`, `slug`), `status`

**Estimated rows:** 500+

---

#### Table: `cdp_segment_membership`

Cached segment membership with entry/exit tracking.

```typescript
export const segmentMemberships = pgTable('cdp_segment_membership', {
  id: text('id').$defaultFn(() => createId()).primaryKey(),
  segmentId: text('segment_id').references(() => segments.id).notNull(),
  profileId: text('profile_id').references(() => profiles.id).notNull(),
  enteredAt: timestamp('entered_at').defaultNow().notNull(),
  entryReason: text('entry_reason'),
  score: numeric('score', { precision: 5, scale: 4 }),
  exitedAt: timestamp('exited_at'),
  exitReason: text('exit_reason'),
  snapshotVersion: integer('snapshot_version').default(1),
});
```

**Indexes:** UNIQUE(`segment_id`, `profile_id`), `profile_id`, `entered_at`

**Estimated rows:** 20M+

---

#### Table: `cdp_segment_computation`

Audit trail for segment recomputations.

```typescript
export const segmentComputations = pgTable('cdp_segment_computation', {
  id: text('id').$defaultFn(() => createId()).primaryKey(),
  segmentId: text('segment_id').references(() => segments.id).notNull(),
  status: text('status').default('running'),
  previousSize: integer('previous_size'),
  newSize: integer('new_size'),
  added: integer('added'),
  removed: integer('removed'),
  startedAt: timestamp('started_at').defaultNow().notNull(),
  completedAt: timestamp('completed_at'),
  durationMs: integer('duration_ms'),
  error: text('error'),
});
```

**Estimated rows:** 10K+

---

#### Table: `cdp_destination`

External platform configurations for sync.

```typescript
export const destinations = pgTable('cdp_destination', {
  id: text('id').$defaultFn(() => createId()).primaryKey(),
  ventureId: text('venture_id').references(() => ventures.id).notNull(),
  name: text('name').notNull(),
  type: destinationTypeEnum('type').notNull(),
  config: jsonb('config').$type<DestinationConfig>().notNull(),
  credentials: jsonb('credentials').$type<Record<string, string>>(),
  fieldMappings: jsonb('field_mappings').$type<FieldMapping[]>().default([]),
  isActive: boolean('is_active').default(true),
  lastTestedAt: timestamp('last_tested_at'),
  lastTestResult: text('last_test_result'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});
```

**Estimated rows:** 100+

---

#### Table: `cdp_sync_config`

Segment → Destination binding configurations.

```typescript
export const syncConfigs = pgTable('cdp_sync_config', {
  id: text('id').$defaultFn(() => createId()).primaryKey(),
  segmentId: text('segment_id').references(() => segments.id).notNull(),
  destinationId: text('destination_id').references(() => destinations.id).notNull(),
  mode: text('mode').default('incremental'),
  scheduleType: text('schedule_type').default('manual'),
  cronExpression: text('cron_expression'),
  includeTraits: jsonb('include_traits').$type<string[]>(),
  excludeTraits: jsonb('exclude_traits').$type<string[]>(),
  isActive: boolean('is_active').default(true),
  lastSyncAt: timestamp('last_sync_at'),
  lastSyncStatus: syncStatusEnum('last_sync_status'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});
```

**Indexes:** UNIQUE(`segment_id`, `destination_id`)

**Estimated rows:** 200+

---

#### Table: `cdp_sync_job`

Individual sync job execution records.

```typescript
export const syncJobs = pgTable('cdp_sync_job', {
  id: text('id').$defaultFn(() => createId()).primaryKey(),
  syncConfigId: text('sync_config_id').references(() => syncConfigs.id).notNull(),
  status: syncStatusEnum('status').default('pending').notNull(),
  triggeredBy: text('triggered_by').notNull(),
  totalRecords: integer('total_records'),
  processedRecords: integer('processed_records').default(0),
  successfulRecords: integer('successful_records').default(0),
  failedRecords: integer('failed_records').default(0),
  errors: jsonb('errors').$type<SyncError[]>().default([]),
  startedAt: timestamp('started_at'),
  completedAt: timestamp('completed_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});
```

**Indexes:** COMPOSITE(`sync_config_id`, `status`), `created_at`

**Estimated rows:** 5K+

---

### Database Table Summary

| Table | Description | Est. Rows | Partitioning |
|-------|-------------|-----------|-------------|
| `cdp_profile` | Unified customer profiles | 1M+ | By venture |
| `cdp_profile_alias` | Email/phone/device/wallet identifiers | 3M+ | — |
| `cdp_profile_merge` | Merge audit trail | 50K+ | — |
| `cdp_profile_timeline` | Aggregated activity feed | 10M+ | By date |
| `cdp_identity_node` | Identity graph nodes | 5M+ | — |
| `cdp_identity_edge` | Identity graph co-occurrence edges | 10M+ | — |
| `cdp_resolution_rule` | Per-venture merge policies | 100+ | — |
| `cdp_event` | Raw behavioral events | 100M+ | **By date (monthly)** |
| `cdp_event_definition` | Event schema registry | 500+ | — |
| `cdp_event_metric` | Pre-aggregated metrics | 1M+ | By granularity |
| `cdp_trait_definition` | Trait schema definitions | 500+ | — |
| `cdp_trait_value` | Per-profile trait values | 5M+ | — |
| `cdp_trait_computation_job` | Batch computation history | 10K+ | — |
| `cdp_segment` | Segment definitions | 500+ | — |
| `cdp_segment_membership` | Profile ↔ segment membership | 20M+ | — |
| `cdp_segment_computation` | Segment computation audit trail | 10K+ | — |
| `cdp_destination` | External platform configurations | 100+ | — |
| `cdp_sync_config` | Segment → Destination bindings | 200+ | — |
| `cdp_sync_job` | Sync job execution history | 5K+ | — |

---

## Data Flow & Events

### High-Throughput Event Ingestion via Redpanda

The CDP uses Redpanda (Kafka-compatible) as the backbone for high-throughput event ingestion. Events flow through a multi-stage pipeline:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        REDPANDA EVENT TOPOLOGY                              │
│                                                                             │
│  Producers (SDKs, Servers, Webhooks)                                        │
│       │                                                                     │
│       ▼                                                                     │
│  ┌─────────────────────────────────────┐                                   │
│  │  Topic: cdp.events.ingest           │  ← Raw events from all sources    │
│  │  Partitions: 18 (by ventureId)      │                                   │
│  │  Retention: 7 days                  │                                   │
│  └───────────────┬─────────────────────┘                                   │
│                  │                                                           │
│                  ▼                                                           │
│  ┌─────────────────────────────────────┐                                   │
│  │  Consumer Group: cdp-processor      │  ← EventProcessor instances       │
│  │  Instances: 3-9 (1 per venture)     │                                   │
│  │  Processing: validate, dedup, enrich│                                   │
│  └───┬──────────┬──────────┬───────────┘                                   │
│      │          │          │                                                │
│      ▼          ▼          ▼                                                │
│  ┌────────┐ ┌────────┐ ┌────────┐                                         │
│  │cdp.    │ │cdp.    │ │cdp.    │                                         │
│  │events. │ │events. │ │events. │                                         │
│  │identity│ │revenue │ │trait-  │                                         │
│  │        │ │        │ │trigger │                                         │
│  └────────┘ └────────┘ └────────┘                                         │
│      │          │          │                                                │
│      ▼          ▼          ▼                                                │
│  Identity    LTV Update  Trait                                             │
│  Resolution  Pipeline    Computation                                       │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Redpanda Topics:**

| Topic | Purpose | Partitions | Retention |
|-------|---------|-----------|-----------|
| `cdp.events.ingest` | Raw incoming events from all sources | 18 (by ventureId) | 7 days |
| `cdp.events.processed` | Validated, enriched events (after processor) | 18 | 30 days |
| `cdp.events.identity` | Identity-related events for resolution pipeline | 9 | 7 days |
| `cdp.events.revenue` | Revenue events for LTV computation | 9 | 7 days |
| `cdp.events.trait-trigger` | Events that trigger trait recomputation | 9 | 1 day |
| `cdp.segment.computed` | Segment computation completion events | 1 | 7 days |
| `cdp.sync.requested` | Sync job trigger events | 1 | 1 day |
| `cdp.profile.updated` | Profile change events for downstream consumers | 18 | 7 days |

### Real-Time Profile Updates

When an event is tracked, the profile is updated in real-time:

```typescript
// Inside EventProcessor.process()
async processEvent(event: CDPEvent): Promise<void> {
  // 1. Resolve profile
  const resolution = await this.identityGraph.resolve({
    ventureId: event.ventureId,
    ...this.extractIdentifiers(event),
  });

  // 2. Update profile stats (atomic)
  await db.update(profiles)
    .set({
      lastSeenAt: event.timestamp,
      lastActiveAt: event.timestamp,
      totalEvents: sql`total_events + 1`,
      // Update LTV if revenue event
      ...(event.revenue ? {
        ltvAmount: sql`ltv_amount + ${event.revenue}`,
      } : {}),
    })
    .where(eq(profiles.id, resolution.profileId));

  // 3. Trigger trait computation (debounced)
  await this.traitEngine.queueComputation(
    resolution.profileId,
    event.name
  );

  // 4. Emit for downstream consumers
  await this.redpanda.produce('cdp.events.processed', {
    key: event.ventureId,
    value: { ...event, profileId: resolution.profileId },
  });
}
```

### Segment Recomputation

Segments are recomputed on a configurable schedule:

| Schedule | Segment Types | Trigger |
|----------|--------------|---------|
| **Hourly** | Critical marketing segments (active campaigns) | Cron job |
| **Daily** | Standard audience segments | Nightly batch at 2 AM EST |
| **On-demand** | Any segment | Manual trigger via API or UI |
| **Real-time** | Segments with `syncEnabled = true` and `scheduleType = 'realtime'` | Trait/event change |

### Event Bus Events (Internal)

The CDP emits events for internal coordination between submodules:

| Event | Payload | Consumers |
|-------|---------|-----------|
| `cdp.event.tracked` | `{ eventId, profileId, ventureId, name }` | TraitEngine, MetricsAggregator |
| `cdp.profile.created` | `{ profileId, ventureId, type }` | Analytics, Growth |
| `cdp.profile.updated` | `{ profileId, changes }` | SegmentEvaluator, Sync |
| `cdp.profile.merged` | `{ primaryId, secondaryId, reason }` | SegmentEvaluator, Sync |
| `cdp.profile.suppressed` | `{ profileId, reason }` | Sync (remove from destinations) |
| `cdp.identity.resolved` | `{ profileId, identifiers, confidence }` | ProfileService |
| `cdp.merge.requested` | `{ primaryId, secondaryId, reason }` | ProfileMerger |
| `cdp.merge.candidate` | `{ profileIds, reason }` | Admin review queue |
| `cdp.trait.computed` | `{ profileId, traitKey, value }` | SegmentEvaluator |
| `cdp.segment.computed` | `{ segmentId, size, added, removed }` | SyncOrchestrator |
| `cdp.sync.completed` | `{ syncJobId, status, records }` | Monitoring, Alerts |

---

## Integration Points

### Inbound Dependencies (CDP consumes from)

| Package | What CDP Gets | Integration Method |
|---------|--------------|-------------------|
| `@mcv/kernel/identity` | User accounts, authentication state | Direct import, FK to `users.id` |
| `@mcv/portfolio` | Venture definitions, venture IDs | Direct import, FK to `ventures.id` |
| `@mcv/analytics` | Behavioral data, funnel events | Redpanda topic subscription |
| `@mcv/compliance` | Consent state, GDPR requests | Event bus + direct query |
| `@mcv/kernel/events` | Platform event bus for cross-module coordination | Direct import |

### Outbound Dependencies (Other packages consume CDP)

| Package | What They Get | Integration Method |
|---------|--------------|-------------------|
| `@mcv/marketing` | Audience segments for campaigns | tRPC query, segment API |
| `@mcv/growth` | Audience targeting, user acquisition | Segment membership query |
| `@mcv/engagement` | Personalization data, user traits | Profile traits query |
| `@mcv/analytics` | Customer metrics, LTV data | Event metrics API |
| `@mcv/agentic-os` | Customer context for AI agents | Profile 360° view API |
| `@mcv/commerce` | Customer purchase history, LTV | Profile + events query |
| `@mcv/compliance` | Data inventory, PII mapping | Profile schema introspection |

### External Integrations (via Sync adapters)

| Platform | Direction | Data |
|----------|----------|------|
| Facebook Ads | Outbound | Custom Audiences (hashed emails/phones) |
| Google Ads | Outbound | Customer Match lists |
| TikTok Ads | Outbound | Audience segments |
| Klaviyo | Outbound | Email lists with traits |
| Braze | Outbound | User profiles with attributes |
| HubSpot | Outbound | Contacts with custom properties |
| Salesforce | Outbound | Leads/contacts sync |
| Snowflake | Outbound | Full profile + event data share |
| BigQuery | Outbound | Analytics-ready datasets |
| Webhooks | Outbound | Custom JSON payloads |

---

## Performance

### Targets

| Metric | Target | Notes |
|--------|--------|-------|
| **Event ingestion throughput** | 10,000 events/second sustained | Via Redpanda batching + parallel consumers |
| **Event ingestion latency (p50)** | < 50ms | From HTTP receipt to database persistence |
| **Event ingestion latency (p99)** | < 200ms | Including enrichment and identity resolution |
| **Profile lookup by ID** | < 10ms | Direct primary key lookup with Redis cache |
| **Profile lookup by email** | < 25ms | Indexed hash lookup |
| **Profile search (complex)** | < 500ms | JSONB trait filtering with pagination |
| **Identity resolution** | < 50ms | SHA-256 hash + index lookup + rule evaluation |
| **Trait computation (single)** | < 100ms | Single profile, single trait |
| **Trait batch computation** | < 30 min / 100K profiles | Nightly batch for one trait across all profiles |
| **Segment estimation** | < 2s | COUNT(*) with rule compilation |
| **Segment full computation** | < 5 min / 100K profiles | Full materialization with diff |
| **Sync job (1K records)** | < 30s | Batch delivery to destination adapter |
| **Sync job (100K records)** | < 15 min | With batching and retry |

### Caching Strategy

```
┌─────────────────────────────────────────────────────────────┐
│                     REDIS CACHE LAYERS                       │
│                                                               │
│  Layer 1: Profile Cache                                       │
│  Key: cdp:profile:{profileId}                                │
│  TTL: 5 minutes                                              │
│  Invalidation: On profile update event                        │
│                                                               │
│  Layer 2: Identity Resolution Cache                           │
│  Key: cdp:identity:{type}:{valueHash}                        │
│  TTL: 15 minutes                                             │
│  Invalidation: On identity link/merge event                   │
│                                                               │
│  Layer 3: Segment Membership Cache                            │
│  Key: cdp:segment:{segmentId}:members (Set)                  │
│  TTL: Until next computation                                  │
│  Invalidation: On segment recomputation                       │
│                                                               │
│  Layer 4: Event Dedup Bloom Filter                            │
│  Key: cdp:dedup:bloom                                        │
│  False positive rate: 0.01%                                   │
│  Size: ~10MB for 100M events                                 │
│                                                               │
│  Layer 5: Trait Value Cache                                   │
│  Key: cdp:traits:{profileId}                                 │
│  TTL: 10 minutes                                             │
│  Invalidation: On trait computation                           │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

### Query Optimization

| Query Pattern | Optimization |
|--------------|-------------|
| Profile by email/phone | SHA-256 hash → B-tree index on `value_hash` |
| Events by profile + date | Composite index `(profile_id, timestamp)` + monthly partitioning |
| Segment evaluation | JSONB `traits` column with GIN index for containment queries |
| Event metrics | Pre-aggregated `cdp_event_metric` table at multiple granularities |
| Profile search with traits | Partial GIN indexes on common trait keys |
| Membership lookup | Unique composite index `(segment_id, profile_id)` |

---

## Scalability

### Event Partitioning

Events are the highest-volume data in the CDP. The partitioning strategy ensures sustainable growth:

**Time-Based Partitioning (PostgreSQL):**

```sql
-- Monthly partitions for cdp_event
CREATE TABLE cdp_event (
  ...
) PARTITION BY RANGE (timestamp);

CREATE TABLE cdp_event_2026_01 PARTITION OF cdp_event
  FOR VALUES FROM ('2026-01-01') TO ('2026-02-01');

CREATE TABLE cdp_event_2026_02 PARTITION OF cdp_event
  FOR VALUES FROM ('2026-02-01') TO ('2026-03-01');
-- Auto-created by partition management job
```

**Redpanda Partitioning:**

Events are partitioned by `ventureId` in Redpanda topics, ensuring:
- All events for a venture are processed in order
- Consumer groups can scale to 1 consumer per venture (9 max)
- Hot ventures can be further sub-partitioned by profile hash

### Profile Sharding

For ventures with 1M+ profiles, sharding is supported:

| Strategy | Description | When |
|----------|-------------|------|
| **Venture-based** | Natural sharding via `ventureId` — each venture's data is logically isolated | Default (always) |
| **Hash-based** | Profile ID hash → shard assignment for cross-venture queries | When portfolio-level queries exceed single-node capacity |
| **Read replicas** | PostgreSQL streaming replicas for read-heavy workloads | When profile read throughput exceeds primary capacity |

### Horizontal Scaling Points

```
┌──────────────────────────────────────────────────────────────────┐
│                    SCALING ARCHITECTURE                            │
│                                                                    │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │  API Layer (Next.js)                                         │ │
│  │  Scales: Horizontally via Vercel/K8s                        │ │
│  │  Bottleneck: Stateless — scales linearly                    │ │
│  └─────────────────────────────────────────────────────────────┘ │
│                                                                    │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │  Event Processing (Redpanda Consumers)                       │ │
│  │  Scales: Up to 18 consumers (# partitions)                  │ │
│  │  Bottleneck: Partition count — increase partitions to scale  │ │
│  └─────────────────────────────────────────────────────────────┘ │
│                                                                    │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │  Database (PostgreSQL)                                       │ │
│  │  Scales: Vertical (primary) + read replicas                 │ │
│  │  Bottleneck: Write throughput — partition hot tables         │ │
│  └─────────────────────────────────────────────────────────────┘ │
│                                                                    │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │  Cache (Redis)                                               │ │
│  │  Scales: Redis Cluster with sharding                        │ │
│  │  Bottleneck: Memory — evict stale profiles                  │ │
│  └─────────────────────────────────────────────────────────────┘ │
│                                                                    │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │  Background Jobs (Inngest / pg-boss)                         │ │
│  │  Scales: Worker pool size                                   │ │
│  │  Bottleneck: CPU for trait computation — add workers         │ │
│  └─────────────────────────────────────────────────────────────┘ │
│                                                                    │
└──────────────────────────────────────────────────────────────────┘
```

### Growth Projections

| Metric | Year 1 | Year 2 | Year 3 |
|--------|--------|--------|--------|
| Total profiles | 500K | 2M | 5M |
| Events/month | 50M | 200M | 500M |
| Segments | 100 | 300 | 1,000 |
| Sync destinations | 20 | 50 | 100 |
| Daily trait computations | 500K | 2M | 10M |
| Storage (events) | 100 GB | 500 GB | 1.5 TB |

---

## Error Handling

### Error Categories

| Category | Examples | Handling Strategy |
|----------|---------|------------------|
| **Validation Errors** | Invalid event schema, malformed identifiers, missing required fields | Reject immediately with 400 status, log to error tracker |
| **Resolution Conflicts** | Multiple profiles match, ambiguous identity | Queue for manual review, return highest-confidence match |
| **Merge Failures** | Concurrent merge on same profile, circular merge | Retry with locking, fail-safe to skip merge |
| **Computation Errors** | SQL error in trait computation, timeout | Log error, mark job failed, retry on next schedule |
| **Sync Failures** | Destination API error, rate limiting, auth failure | Per-record retry with exponential backoff, partial success |
| **GDPR Errors** | Failed to suppress across all systems | Alert immediately, manual intervention required |

### Error Handling Patterns

```typescript
// Event ingestion — never lose events
async trackWithRetry(input: TrackEventInput): Promise<void> {
  try {
    await this.track(input);
  } catch (error) {
    if (error instanceof ValidationError) {
      // Log and reject — client must fix
      logger.warn('Event validation failed', { error, input });
      throw error;
    }

    // All other errors — persist to dead letter queue
    await this.deadLetterQueue.push({
      event: input,
      error: error.message,
      timestamp: new Date(),
      retryCount: 0,
    });

    // Don't throw — event is safely queued for retry
    logger.error('Event processing failed, queued for retry', { error });
  }
}
```

### Dead Letter Queue (DLQ)

Failed events and sync records are persisted to a DLQ for manual review and retry:

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│ Failed Event │────▶│  DLQ Table   │────▶│ Admin Review  │
│              │     │              │     │              │
│ validation   │     │ cdp_dlq      │     │ retry / drop │
│ resolution   │     │ max 3 retries│     │ investigate  │
│ persistence  │     │ TTL: 30 days │     │              │
└──────────────┘     └──────────────┘     └──────────────┘
```

### Circuit Breaker for Sync Adapters

External destination APIs may be unreliable. Each sync adapter uses a circuit breaker:

```typescript
const circuitBreaker = new CircuitBreaker({
  failureThreshold: 5,          // Open after 5 consecutive failures
  resetTimeoutMs: 60_000,       // Try again after 60 seconds
  halfOpenMaxRequests: 2,       // Allow 2 test requests in half-open
});

// In SyncOrchestrator
async syncBatch(adapter: DestinationAdapter, records: SyncRecord[]): Promise<void> {
  const state = circuitBreaker.getState(adapter.name);

  if (state === 'open') {
    throw new CircuitOpenError(`${adapter.name} circuit is open`);
  }

  try {
    await adapter.sync(destination, records);
    circuitBreaker.recordSuccess(adapter.name);
  } catch (error) {
    circuitBreaker.recordFailure(adapter.name);
    throw error;
  }
}
```

---

## Observability

### Metrics (Prometheus / Grafana)

| Metric | Type | Labels | Description |
|--------|------|--------|-------------|
| `cdp_events_ingested_total` | Counter | `venture`, `category`, `source` | Total events ingested |
| `cdp_events_ingested_latency` | Histogram | `venture` | Event ingestion latency (ms) |
| `cdp_events_duplicates_total` | Counter | `venture` | Duplicate events detected |
| `cdp_events_validation_failures` | Counter | `venture`, `reason` | Validation failures |
| `cdp_identity_resolutions_total` | Counter | `venture`, `result` | Identity resolutions (new/existing/merge) |
| `cdp_identity_resolution_latency` | Histogram | `venture` | Resolution latency (ms) |
| `cdp_profiles_total` | Gauge | `venture`, `type`, `status` | Total profiles by state |
| `cdp_profile_merges_total` | Counter | `venture`, `reason` | Profile merges performed |
| `cdp_traits_computed_total` | Counter | `venture`, `trait_key` | Trait computations executed |
| `cdp_traits_computation_latency` | Histogram | `type` | Trait computation duration (ms) |
| `cdp_segments_computed_total` | Counter | `venture` | Segment computations |
| `cdp_segment_computation_latency` | Histogram | — | Segment computation duration (ms) |
| `cdp_segment_size` | Gauge | `venture`, `segment_slug` | Current segment membership count |
| `cdp_sync_jobs_total` | Counter | `destination_type`, `status` | Sync jobs by outcome |
| `cdp_sync_records_total` | Counter | `destination_type`, `status` | Individual sync records |
| `cdp_sync_job_latency` | Histogram | `destination_type` | Sync job duration (ms) |
| `cdp_cache_hit_rate` | Gauge | `cache_layer` | Redis cache hit rate |
| `cdp_dlq_depth` | Gauge | `type` | Dead letter queue depth |

### Logging

Structured JSON logging with correlation IDs for request tracing:

```typescript
// Log format
{
  "level": "info",
  "service": "cdp",
  "submodule": "events",
  "action": "track",
  "ventureId": "betedge-xxx",
  "profileId": "profile-yyy",
  "eventName": "Bet Placed",
  "latencyMs": 42,
  "correlationId": "req-abc-123",
  "timestamp": "2026-02-09T04:44:00.000Z"
}
```

**Log Levels:**

| Level | Usage |
|-------|-------|
| `error` | Unrecoverable failures, DLQ entries, circuit breaker opens |
| `warn` | Validation failures, merge conflicts requiring review, rate limiting |
| `info` | Event tracked, profile created/merged, segment computed, sync completed |
| `debug` | Identity resolution details, SQL queries, cache hits/misses |

### Alerting Rules

| Alert | Condition | Severity | Action |
|-------|----------|----------|--------|
| **Event Ingestion Down** | `cdp_events_ingested_total` rate = 0 for 5 min | Critical | Page on-call |
| **High DLQ Depth** | `cdp_dlq_depth` > 1000 | Warning | Investigate failures |
| **Sync Failure Spike** | `cdp_sync_jobs_total{status="failed"}` > 10 in 1h | Warning | Check destination APIs |
| **Identity Resolution Slow** | `cdp_identity_resolution_latency` p99 > 500ms | Warning | Check database indexes |
| **Segment Computation Timeout** | Computation exceeds 30 min | Warning | Optimize rules or increase resources |
| **Profile Merge Anomaly** | Merge rate > 3x normal in 1h | Warning | Possible data quality issue |
| **GDPR Suppression Failed** | Suppression error | Critical | Immediate manual intervention |

### Dashboards

| Dashboard | Panels |
|-----------|--------|
| **CDP Overview** | Events/sec, profiles total, active segments, sync status, error rate |
| **Event Explorer** | Event volume by name, by venture, by source, latency percentiles |
| **Identity Health** | Resolution success rate, merge rate, graph size, orphaned nodes |
| **Profile Analytics** | Profile types distribution, LTV histogram, activity heatmap |
| **Segment Monitor** | Segment sizes over time, computation duration, membership churn |
| **Sync Operations** | Job success/failure, records synced, destination health, retry rate |

---

## Security

### Data Access Control

| Layer | Mechanism | Description |
|-------|----------|-------------|
| **Row-Level Security (RLS)** | PostgreSQL RLS policies | All CDP tables enforce `venture_id` scoping. Users can only access their venture's data. Portfolio admins can access cross-venture data. |
| **API Authentication** | Supabase Auth + JWT | All API routes require valid JWT with venture scope claim |
| **Service-to-Service** | tRPC middleware | Internal service calls authenticated via shared secret + venture context |
| **Admin Operations** | Role-based access | Profile suppression, merge, and sync management require `cdp:admin` role |

### PII Protection

| PII Type | Storage | Protection |
|----------|---------|------------|
| Email addresses | `cdp_profile.canonical_email`, `cdp_profile_alias.value` | Stored in plaintext for operational use; SHA-256 hash in `value_hash` for lookups. Cleared on GDPR suppression. |
| Phone numbers | `cdp_profile.canonical_phone`, `cdp_profile_alias.value` | E.164 normalized; cleared on GDPR suppression |
| IP addresses | `cdp_event.context.location.ip` | Stored for geo-enrichment; auto-deleted after 90 days per retention policy |
| Device IDs | `cdp_identity_node.value` | SHA-256 hashed for lookups |
| Wallet addresses | `cdp_identity_node.value` | Public by nature (blockchain); hashed in identity graph |

### Encryption

| Layer | Method |
|-------|--------|
| **At rest** | Supabase managed encryption (AES-256) for all PostgreSQL data |
| **In transit** | TLS 1.3 for all API communication |
| **Credentials** | Sync destination credentials encrypted with application-level encryption before JSONB storage |
| **Event payloads** | Redpanda TLS for inter-broker and client communication |

### Sync Security

- Destination credentials are encrypted at rest using AES-256-GCM with a per-venture key
- API tokens are never logged or included in error messages
- PII fields are hashed before transmission to ad platforms (SHA-256 as required by Facebook/Google)
- Field mappings support `transform: 'hash'` to automatically hash PII before sync
- Webhook destinations support custom `X-Signature` headers for payload verification

### Data Retention

| Data Type | Retention | Deletion Method |
|-----------|-----------|----------------|
| Raw events (`cdp_event`) | 24 months | Monthly partition drop |
| Event metrics (`cdp_event_metric`) | 36 months | Granularity-based cleanup (hourly → 3mo, daily → 12mo, monthly → 36mo) |
| Profile data (`cdp_profile`) | Indefinite (until suppression/deletion) | GDPR suppression or hard delete |
| Identity graph nodes/edges | Indefinite | Pruned when all connected profiles are deleted |
| Trait values | Indefinite (computed refreshed nightly) | Cleared on profile suppression |
| Segment memberships | Until segment archived | Cascade delete on segment archive |
| Sync job history | 12 months | Automated cleanup |
| Dead letter queue | 30 days | Automated cleanup |
| Profile timeline | 24 months | Time-based partition drop |

### Audit Trail

All sensitive operations are logged to an immutable audit trail:

| Operation | Audit Fields |
|-----------|-------------|
| Profile merge | Who triggered, merge log with field decisions, reversibility |
| Profile suppression | Who requested, reason, timestamp |
| Sync credential update | Who changed, previous hash (not value) |
| Resolution rule change | Who changed, previous/new rule config |
| Segment rule modification | Who changed, previous/new rules, computation impact |
| Manual trait override | Who set, previous value, new value |

---

*@mcv/cdp — Customer Data Platform Domain*
