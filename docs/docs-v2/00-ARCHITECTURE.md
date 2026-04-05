# MCV.ONE Architecture Overview
## Three-Layer Agentic Operating System

**Version:** 3.2  
**Last Updated:** February 9, 2026  
**Reference:** ADR-001

---

## Executive Summary

MCV.ONE is a **Three-Layer Agentic Operating System** designed to serve a consortium of 9+ ventures across 7 jurisdictions, scaling to billions of users. The platform combines enterprise-grade infrastructure with AI-native capabilities and Web3 economics.

---

## The Three Layers

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                                                                              │
│  LAYER 3: AGENT LAYER (Agentic OS)                                          │
│  ┌────────────────────────────────────────────────────────────────────────┐ │
│  │                                                                         │ │
│  │   QUEEN ORCHESTRATOR                                                    │ │
│  │   ├── Strategic task decomposition                                      │ │
│  │   ├── Resource allocation                                               │ │
│  │   ├── Priority management                                               │ │
│  │   └── HITL escalation                                                   │ │
│  │                                                                         │ │
│  │   RALPH EXECUTION PODS (Swarm)                                          │ │
│  │   ├── Smith (Builder)      — Code, infrastructure, deployments          │ │
│  │   ├── Growth (Marketing)   — Campaigns, content, social                 │ │
│  │   ├── Director (Strategy)  — Analysis, decisions, reports               │ │
│  │   └── ... (extensible)                                                  │ │
│  │                                                                         │ │
│  │   SCOUTS (Monitoring)                                                   │ │
│  │   ├── Data collection                                                   │ │
│  │   ├── Anomaly detection                                                 │ │
│  │   └── Alert generation                                                  │ │
│  │                                                                         │ │
│  └────────────────────────────────────────────────────────────────────────┘ │
│                                                                              │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  LAYER 2: MODULE LAYER (55+ Platform Modules)                               │
│  ┌────────────────────────────────────────────────────────────────────────┐ │
│  │                                                                         │ │
│  │   TIER 6: Presentation (UI, API, Apps)                                  │ │
│  │   TIER 5: Business Domains (Nexus Hub, Growth, Commerce, etc.)          │ │
│  │   TIER 4: Intelligence (Core Gateway + Extensions + Plugins)            │ │
│  │   TIER 3: Connectors (External World Integrations)                      │ │
│  │   TIER 2.5: Shared Services (Business Logic & Workflows)                │ │
│  │   TIER 2: Fabric (Cross-Cutting Infrastructure)                         │ │
│  │   TIER 1: Identity (Security Boundary)                                  │ │
│  │   TIER 0: Kernel (Absolute Primitives)                                  │ │
│  │                                                                         │ │
│  └────────────────────────────────────────────────────────────────────────┘ │
│                                                                              │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  LAYER 1: DATA LAYER (Composable Data Platform / CDP)                       │
│  ┌────────────────────────────────────────────────────────────────────────┐ │
│  │                                                                         │ │
│  │   EVENT STREAMING          DATA LAKEHOUSE         FEATURE STORE         │ │
│  │   ├── Redpanda/Kafka       ├── Apache Iceberg     ├── Feast            │ │
│  │   ├── Real-time ingest     ├── MinIO (S3)         ├── Real-time        │ │
│  │   └── Event bus            └── dbt transforms     └── ML features      │ │
│  │                                                                         │ │
│  │   IDENTITY RESOLUTION      SEGMENTATION           ML PIPELINES          │ │
│  │   ├── Cross-device         ├── Real-time          ├── Predictions      │ │
│  │   ├── Cross-venture        ├── Behavioral         ├── Recommendations  │ │
│  │   └── Probabilistic        └── Demographic        └── Anomaly detection│ │
│  │                                                                         │ │
│  └────────────────────────────────────────────────────────────────────────┘ │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘
```

---

## Module Layer: 8-Tier Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  TIER 6: PRESENTATION                                                       │
│  ┌─────────────────────────────────────────────────────────────────────────┐│
│  │  @mcv/ui (508 Components)              @mcv/api (tRPC Gateway)          ││
│  │  Classification: PUBLISHABLE           Classification: INTERNAL         ││
│  └─────────────────────────────────────────────────────────────────────────┘│
├─────────────────────────────────────────────────────────────────────────────┤
│  TIER 5: BUSINESS DOMAINS (The Mega-Engines)                                │
│  ┌─ MCV-ONLY ─────────────────────────────────────────────────────────────┐│
│  │  @mcv/agentic-os    @mcv/cdp         @mcv/portfolio    @mcv/treasury   ││
│  │  @mcv/compliance    @mcv/web3-core                                     ││
│  └────────────────────────────────────────────────────────────────────────┘│
│  ┌─ PUBLISHABLE ──────────────────────────────────────────────────────────┐│
│  │  @mcv/nexus Hub     @mcv/engagement   @mcv/growth       @mcv/commerce  ││
│  │  @mcv/operations    @mcv/finance      @mcv/people       @mcv/analytics ││
│  │  @mcv/web3-public   @mcv/token-economy                                 ││
│  └────────────────────────────────────────────────────────────────────────┘│
├─────────────────────────────────────────────────────────────────────────────┤
│  TIER 4: INTELLIGENCE (@mcv/intelligence) — Hybrid Architecture             │
│  ├── Core (Always Loaded): gateway, context, embedding, streaming, metrics  │
│  ├── Extensions (Loadable): rag, knowledge, personas, memory, ml            │
│  └── Plugins (Dynamic): ventures, custom, marketplace                       │
├─────────────────────────────────────────────────────────────────────────────┤
│  TIER 3: CONNECTORS (@mcv/connectors) — PUBLISHABLE                         │
│  ├── email, voice, payments, oauth, github, google                          │
│  └── social, registrars, payroll, accounting, webhooks                      │
├─────────────────────────────────────────────────────────────────────────────┤
│  TIER 2.5: SHARED (@mcv/shared) — INTERNAL                                  │
│  ├── templates, workflows, validation, calculations, scheduling             │
│  └── localization, theming, media, export, import, versioning               │
├─────────────────────────────────────────────────────────────────────────────┤
│  TIER 2: FABRIC (@mcv/fabric) — INTERNAL                                    │
│  ├── audit, storage, realtime, notifications, flags                         │
│  └── queue, events, search, cache                                           │
├─────────────────────────────────────────────────────────────────────────────┤
│  TIER 1: IDENTITY (@mcv/identity) — INTERNAL                                │
│  └── auth, permissions, tenants, users, sso                                 │
├─────────────────────────────────────────────────────────────────────────────┤
│  TIER 0: KERNEL (@mcv/kernel) — INTERNAL                                    │
│  └── db, config, logger, errors, utils, types, context                      │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Package Dependencies

```
                                    ┌─────────────┐
                                    │   @mcv/ui   │
                                    │   @mcv/api  │
                                    └──────┬──────┘
                                           │
              ┌────────────────────────────┼────────────────────────────┐
              │                            │                            │
              ▼                            ▼                            ▼
    ┌─────────────────┐          ┌─────────────────┐          ┌─────────────────┐
    │  @mcv/nexus     │          │ @mcv/engagement │          │  @mcv/commerce  │
    │  @mcv/growth    │          │ @mcv/analytics  │          │  @mcv/operations│
    │  ...            │          │ ...             │          │  ...            │
    └────────┬────────┘          └────────┬────────┘          └────────┬────────┘
              │                            │                            │
              └────────────────────────────┼────────────────────────────┘
                                           │
                                           ▼
                               ┌───────────────────────┐
                               │   @mcv/intelligence   │
                               └───────────┬───────────┘
                                           │
                               ┌───────────────────────┐
                               │   @mcv/connectors     │
                               └───────────┬───────────┘
                                           │
                               ┌───────────────────────┐
                               │     @mcv/shared       │
                               └───────────┬───────────┘
                                           │
                               ┌───────────────────────┐
                               │     @mcv/fabric       │
                               └───────────┬───────────┘
                                           │
                               ┌───────────────────────┐
                               │    @mcv/identity      │
                               └───────────┬───────────┘
                                           │
                               ┌───────────────────────┐
                               │     @mcv/kernel       │
                               └───────────────────────┘
```

---

## Data Flow Architecture

### Request Flow

```
┌──────────┐     ┌──────────┐     ┌──────────┐     ┌──────────┐
│  Client  │────▶│   API    │────▶│  Domain  │────▶│   DB     │
│  (Next)  │     │  (tRPC)  │     │  Logic   │     │(Supabase)│
└──────────┘     └──────────┘     └──────────┘     └──────────┘
                      │                 │
                      │                 ▼
                      │          ┌──────────┐
                      │          │  Events  │
                      │          │(Redpanda)│
                      │          └──────────┘
                      │                 │
                      ▼                 ▼
               ┌──────────┐     ┌──────────┐
               │   AI     │     │   CDP    │
               │(OpenRouter)    │(Iceberg) │
               └──────────┘     └──────────┘
```

### Event-Driven Communication

```
Domain A                          Domain B                         Domain C
    │                                 │                                │
    │  deal.won ──────────────────────┼─────────────────▶              │
    │                                 │                    engagement. │
    │                                 │                    points.award│
    │                                 │                                │
    │                                 │  ◀──────────────── engagement. │
    │                                 │                    points.     │
    │                                 │                    awarded     │
    │                                 │                                │
    │  ◀──────────────────────────────┼────────────────────────────────│
    │                                 │                                │
    ▼                                 ▼                                ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                         EVENT BUS (Redpanda)                            │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Technology Stack

### Core Infrastructure

| Category | Technology | Purpose |
|----------|------------|---------|
| **Framework** | Next.js 15 | Full-stack React framework |
| **Language** | TypeScript 5.x | Type-safe development |
| **Monorepo** | Turborepo | Build orchestration |
| **Database** | Supabase (PostgreSQL) | Primary data store + RLS |
| **ORM** | Drizzle | Type-safe SQL |
| **API** | tRPC | End-to-end typesafe APIs |

### AI & Intelligence

| Category | Technology | Purpose |
|----------|------------|---------|
| **LLM Gateway** | OpenRouter | 400+ model access |
| **Vector Store** | Pinecone / pgvector | Embeddings storage |
| **RAG** | Google File Search API | Document retrieval |
| **Knowledge Graph** | Neo4j | Entity relationships |

### Data Platform (CDP)

| Category | Technology | Purpose |
|----------|------------|---------|
| **Event Streaming** | Redpanda | Kafka-compatible streaming |
| **Data Lakehouse** | Apache Iceberg | ACID transactions on S3 |
| **Object Storage** | MinIO | S3-compatible storage |
| **Transformations** | dbt | SQL-based transforms |
| **Feature Store** | Feast | ML feature serving |

### Web3 & Blockchain

| Category | Technology | Purpose |
|----------|------------|---------|
| **Primary Chain** | Solana | High-throughput blockchain |
| **Smart Contracts** | Anchor (Rust) | Solana programs |
| **NFTs** | Metaplex | NFT standard + cNFTs |
| **Cross-Chain** | Wormhole | Bridge protocol |

### Communications

| Category | Technology | Purpose |
|----------|------------|---------|
| **Voice/SMS** | Twilio | Programmable communications |
| **Email** | SendGrid / Resend | Transactional email |
| **Push** | OneSignal | Push notifications |
| **Realtime** | Supabase Realtime | WebSocket subscriptions |

### Infrastructure

| Category | Technology | Purpose |
|----------|------------|---------|
| **CDN** | Cloudflare | Edge delivery + Workers |
| **Hosting** | Vercel | Next.js hosting |
| **Queue** | BullMQ / Temporal | Background jobs |
| **Cache** | Redis (Upstash) | Distributed cache |
| **Search** | Meilisearch | Full-text search |

---

## Multi-Tenancy Model

### Tenant Hierarchy

```
MCV Global Consortium (Root)
│
├── Venture: BetEdge AI
│   ├── Organization: BetEdge Inc.
│   │   ├── User: admin@betedge.app
│   │   └── User: support@betedge.app
│   └── Organization: BetEdge Partners
│       └── User: partner@example.com
│
├── Venture: EdgeIQ Markets
│   └── Organization: EdgeIQ Corp.
│       └── ...
│
└── Venture: MCV Studios
    └── ...
```

### Isolation Strategy

| Level | Isolation | Implementation |
|-------|-----------|----------------|
| **Venture** | Complete data isolation | `venture_id` on all tables + RLS |
| **Organization** | Workspace isolation | `org_id` scoping |
| **User** | Role-based access | RBAC + ABAC policies |

---

## Security Architecture

### Authentication Flow

```
┌──────────┐     ┌──────────┐     ┌──────────┐     ┌──────────┐
│  Client  │────▶│  Auth    │────▶│ Identity │────▶│ Session  │
│          │     │  (MFA)   │     │  Verify  │     │  Create  │
└──────────┘     └──────────┘     └──────────┘     └──────────┘
                      │                 │
                      ▼                 ▼
               ┌──────────┐     ┌──────────┐
               │ Passkeys │     │  OAuth   │
               │ WebAuthn │     │ Providers│
               └──────────┘     └──────────┘
```

### Authorization Model

| Type | Description | Use Case |
|------|-------------|----------|
| **RBAC** | Role-Based Access Control | Standard permissions |
| **ABAC** | Attribute-Based Access Control | Dynamic policies |
| **RLS** | Row-Level Security | Database-level isolation |
| **Gates** | Feature-level permissions | UI/API guards |

---

## Deployment Architecture

```
                         ┌─────────────────┐
                         │   Cloudflare    │
                         │   (CDN + WAF)   │
                         └────────┬────────┘
                                  │
                    ┌─────────────┼─────────────┐
                    │             │             │
                    ▼             ▼             ▼
             ┌──────────┐  ┌──────────┐  ┌──────────┐
             │  Vercel  │  │  Vercel  │  │  Vercel  │
             │  (Prod)  │  │ (Staging)│  │   (Dev)  │
             └──────────┘  └──────────┘  └──────────┘
                    │
                    ▼
    ┌───────────────────────────────────────────┐
    │              Supabase                      │
    │  ┌─────────┐  ┌─────────┐  ┌─────────┐   │
    │  │Postgres │  │Realtime │  │ Storage │   │
    │  └─────────┘  └─────────┘  └─────────┘   │
    └───────────────────────────────────────────┘
```

---

## Key Design Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| **Monorepo** | Turborepo | Unified builds, shared types, atomic changes |
| **API Style** | tRPC | End-to-end type safety, no codegen |
| **Auth** | Better Auth | Flexible, self-hosted, extensible |
| **Database** | Supabase | PostgreSQL + RLS + Realtime built-in |
| **AI Gateway** | OpenRouter | 400+ models, single integration |
| **Event Bus** | Redpanda | Kafka-compatible, simpler ops |
| **Blockchain** | Solana | Speed, low cost, NFT ecosystem |

---

## Related Documents

- [Package Registry](./00-PACKAGE-REGISTRY.md)
- [Tech Stack Standards](./00-TECH-STACK.md)
- [ADR-001: Enterprise Decisions](./adrs/ADR-001-enterprise-decisions.md)

---

*MCV Global Consortium — Architecture Overview v3.2*
