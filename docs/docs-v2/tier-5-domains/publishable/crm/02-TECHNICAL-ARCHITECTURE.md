# @mcv/crm — Technical Architecture

| Field | Value |
|---|---|
| **Package** | `@mcv/crm` |
| **Classification** | PUBLISHABLE |
| **Tier** | 5 — Domain Modules |
| **Last Updated** | February 9, 2026 |

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [System Diagram](#system-diagram)
3. [Module Architecture](#module-architecture)
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

`@mcv/crm` follows a **layered service architecture** within MCV.ONE's monorepo. The module is structured as a single Turborepo package (`packages/domains/crm/`) with clear internal separation between entry points, service logic, database schema, client hooks, and UI components.

### Architectural Principles

1. **Venture-scoped multi-tenancy** — Every query, every mutation, every response is scoped to a single venture. There are no cross-venture queries in the standard API surface. PostgreSQL RLS provides defense-in-depth.

2. **Service-layer encapsulation** — Business logic lives in service functions (not in route handlers or components). Services are pure functions that accept typed inputs and return typed outputs, making them testable and composable.

3. **Schema-first validation** — Every service input is validated through Zod schemas before execution. Invalid inputs never reach the database layer.

4. **Polymorphic associations** — Activities use `subjectType` + `subjectId` to link to contacts, deals, or organizations without separate tables per entity type.

5. **JSONB for extensibility** — Custom fields, activity metadata, scoring breakdowns, and stage automations use JSONB columns rather than rigid column schemas, enabling runtime extensibility.

6. **Denormalized read paths** — Lead scores are cached on contact records; deal scores are stored in a separate table with historical tracking. This optimizes common read patterns (sort by score, filter by risk level).

7. **Background computation** — Expensive operations (batch scoring, duplicate scanning, score decay) run as background cron jobs rather than inline with user requests.

8. **Event-driven side effects** — Mutations emit audit events that downstream consumers (analytics, growth, nexus) can react to without coupling.

### Technology Stack

| Layer | Technology | Purpose |
|---|---|---|
| API | tRPC v10 | Type-safe RPC routes with middleware |
| Validation | Zod v3 | Input schema validation |
| ORM | Drizzle ORM v0.29+ | Type-safe SQL queries, schema definitions, migrations |
| Database | PostgreSQL (Supabase) | Primary data store with RLS |
| Cache | Redis | Scoring result caching, search indexes |
| Events | Redpanda/Kafka | Cross-domain event streaming |
| Client | React 18+ (Next.js 15) | Hooks and components for UI |
| Monorepo | Turborepo | Build orchestration, dependency management |

---

## System Diagram

### Full System Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              CLIENT LAYER                                    │
│                                                                              │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐          │
│  │   React Hooks     │  │  React Components │  │  External API    │          │
│  │                   │  │                   │  │  Consumers       │          │
│  │  useContacts()    │  │  ContactList      │  │                  │          │
│  │  useDeals()       │  │  DealKanban       │  │  REST/tRPC       │          │
│  │  useDealScore()   │  │  PipelineView     │  │  integrations    │          │
│  │  useForecast()    │  │  ForecastDashboard│  │                  │          │
│  │  useLeadScoring() │  │  LeadScoreWidget  │  │                  │          │
│  │  useDuplicates()  │  │  DuplicateResolver│  │                  │          │
│  │  useSmartView()   │  │  SmartViewBuilder │  │                  │          │
│  │  useActivities()  │  │  ActivityTimeline │  │                  │          │
│  └────────┬─────────┘  └────────┬─────────┘  └────────┬─────────┘          │
│           │                      │                      │                    │
│           └──────────────────────┼──────────────────────┘                    │
│                                  │                                           │
└──────────────────────────────────┼───────────────────────────────────────────┘
                                   │ tRPC / HTTP
                                   ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                             ROUTE LAYER                                      │
│                                                                              │
│  ┌──────────────────────────────────────────────────────────────────┐       │
│  │                    tRPC Router (Next.js API)                      │       │
│  │                                                                   │       │
│  │  /api/crm                          /api/crm-v2                    │       │
│  │  ├─ contacts.*                     ├─ deals.score                 │       │
│  │  ├─ organizations.*                ├─ deals.batchScore            │       │
│  │  ├─ deals.*                        ├─ deals.atRisk               │       │
│  │  ├─ activities.*                   ├─ leads.score                 │       │
│  │  └─ smartViews.*                   ├─ leads.rules                 │       │
│  │                                    ├─ forecast.*                   │       │
│  │                                    ├─ duplicates.*                 │       │
│  │                                    └─ customObjects.*              │       │
│  │                                                                   │       │
│  │  Middleware: auth → venture context → permission check → handler  │       │
│  └──────────────────────────────┬───────────────────────────────────┘       │
│                                  │                                           │
└──────────────────────────────────┼───────────────────────────────────────────┘
                                   │
                                   ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                           SERVICE LAYER                                      │
│                                                                              │
│  ┌─────────────┐ ┌──────────────┐ ┌─────────────┐ ┌──────────────┐        │
│  │  Contact     │ │ Organization │ │    Deal      │ │   Activity    │        │
│  │  Service     │ │ Service      │ │  Service     │ │   Service     │        │
│  │             │ │              │ │             │ │              │        │
│  │ CRUD        │ │ CRUD         │ │ CRUD        │ │ Log          │        │
│  │ Search      │ │ Search       │ │ Stage mgmt  │ │ Timeline     │        │
│  │ Bulk ops    │ │ Revenue      │ │ Close       │ │ Feed         │        │
│  │ Lifecycle   │ │ Industries   │ │ Kanban      │ │              │        │
│  └──────┬──────┘ └──────┬───────┘ └──────┬──────┘ └──────┬───────┘        │
│         │               │                │                │                  │
│  ┌──────┴──────┐ ┌──────┴───────┐ ┌──────┴──────┐ ┌──────┴───────┐        │
│  │ Deal Scoring│ │ Lead Scoring │ │  Forecast   │ │  Duplicate    │        │
│  │ Service     │ │ Service      │ │  Service    │ │  Detection    │        │
│  │             │ │              │ │             │ │  Service      │        │
│  │ AI scoring  │ │ Rule engine  │ │ Period mgmt │ │              │        │
│  │ 9 factors   │ │ 3 categories │ │ Categories  │ │ Exact email  │        │
│  │ Risk level  │ │ Decay        │ │ Quota       │ │ Fuzzy name   │        │
│  │ Win prob    │ │ Distribution │ │ Trends      │ │ Phone norm   │        │
│  │ Prediction  │ │ Leaderboard  │ │ By owner    │ │ Domain match │        │
│  └──────┬──────┘ └──────┬───────┘ └──────┬──────┘ │ Merge        │        │
│         │               │                │         └──────┬───────┘        │
│  ┌──────┴──────┐ ┌──────┴───────┐        │                │                │
│  │ Custom Obj  │ │ Smart View   │        │                │                │
│  │ Service     │ │ Service      │        │                │                │
│  │             │ │              │        │                │                │
│  │ User-defined│ │ Saved filters│        │                │                │
│  │ Dynamic     │ │ Columns      │        │                │                │
│  │ Relations   │ │ Sharing      │        │                │                │
│  └──────┬──────┘ └──────┬───────┘        │                │                │
│         │               │                │                │                  │
│         └───────────────┴────────────────┴────────────────┘                  │
│                                  │                                           │
└──────────────────────────────────┼───────────────────────────────────────────┘
                                   │
                                   ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                          DATABASE LAYER                                      │
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │                     Drizzle ORM Schema                               │    │
│  │                                                                      │    │
│  │  contacts          organizations      deals              pipelines   │    │
│  │  contact_scores    deal_scores        crm_activities                 │    │
│  │  lead_scoring_rules forecasts         forecast_items                 │    │
│  │  smart_views       custom_objects     custom_object_records          │    │
│  │  object_relationships  duplicate_rules  merge_history               │    │
│  │  pipeline_stages_v2                                                  │    │
│  └─────────────────────────────┬───────────────────────────────────────┘    │
│                                 │                                            │
│  ┌─────────────────────────────┴───────────────────────────────────────┐    │
│  │              PostgreSQL (Supabase) + Row-Level Security              │    │
│  │                                                                      │    │
│  │  • Venture-scoped RLS policies on all tables                         │    │
│  │  • Composite indexes for common query patterns                       │    │
│  │  • JSONB columns for custom fields, metadata, breakdowns             │    │
│  │  • Decimal precision for financial values                            │    │
│  │  • UUID primary keys with defaultRandom()                            │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
                                   │
                                   ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                       INFRASTRUCTURE LAYER                                   │
│                                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐   │
│  │    Redis      │  │  Redpanda    │  │  @mcv/kernel  │  │  @mcv/       │   │
│  │              │  │  (Kafka)     │  │              │  │  identity    │   │
│  │  Score cache │  │  Audit events│  │  DB client   │  │  Auth/RBAC   │   │
│  │  Search idx  │  │  CRM events  │  │  Config      │  │  Permissions │   │
│  │  Rate limits │  │  Cross-domain│  │  Logging     │  │  User ctx    │   │
│  └──────────────┘  └──────────────┘  └──────────────┘  └──────────────┘   │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Request Flow (Simplified)

```
Browser/Client
    │
    ▼
React Hook (useContacts, useDeals, etc.)
    │ tRPC query/mutation
    ▼
tRPC Router (/api/crm or /api/crm-v2)
    │
    ▼
Middleware Pipeline:
    1. Authentication (verify JWT/session)
    2. Venture Context (extract ventureId)
    3. Permission Check (contacts:read, deals:create, etc.)
    │
    ▼
Service Function (contactService.listContacts, dealService.createDeal, etc.)
    │
    ├──► Zod Validation (input schema)
    │
    ├──► Drizzle Query (venture-scoped SQL)
    │         │
    │         ▼
    │    PostgreSQL + RLS
    │
    ├──► Audit Event (async, non-blocking)
    │         │
    │         ▼
    │    Redpanda/Kafka (crm.contacts.created, etc.)
    │
    └──► Response (typed result or error)
```

---

## Module Architecture

### Contact Service (`contact-service.ts`)

The contact service is the most heavily-used module, handling all person and company contact operations.

```
┌─────────────────────────────────────────────────────────────┐
│                    Contact Service                            │
│                                                              │
│  Public API:                                                 │
│  ├─ listContacts(filters, pagination, sort)                  │
│  ├─ getContact(id)                                          │
│  ├─ createContact(data)                                     │
│  ├─ updateContact(id, data)                                 │
│  ├─ deleteContact(id)                                       │
│  ├─ searchContacts(query)                                   │
│  ├─ bulkUpdateContacts(ids, data)                           │
│  └─ bulkDeleteContacts(ids)                                 │
│                                                              │
│  Internal Behavior:                                          │
│  ├─ Venture-scoped queries (ventureId in all WHERE)         │
│  ├─ Lifecycle stage validation                              │
│  ├─ Custom field merging (partial JSONB update)             │
│  ├─ Tag array management                                    │
│  ├─ Ownership assignment validation                         │
│  ├─ Audit event emission (contacts.created, etc.)           │
│  └─ Pagination: offset + cursor-based                       │
│                                                              │
│  Dependencies:                                               │
│  ├─ @mcv/kernel (db, audit, config)                         │
│  ├─ @mcv/identity (user context, permissions)               │
│  └─ contacts table + indexes                                │
└─────────────────────────────────────────────────────────────┘
```

**Query patterns and indexes:**

| Query Pattern | Index Used |
|---|---|
| List by venture | `idx_contacts_venture` |
| Filter by email | `idx_contacts_email` |
| Filter by owner | `idx_contacts_venture_owner` |
| Filter by type | `idx_contacts_venture_type` |
| Filter by lifecycle | `idx_contacts_venture_lifecycle` |
| Sort by lead score | `idx_contacts_lead_score` |
| Search (LIKE) | Sequential scan with limit (autocomplete) |

### Organization Service (`organization-service.ts`)

```
┌─────────────────────────────────────────────────────────────┐
│                  Organization Service                        │
│                                                              │
│  Public API:                                                 │
│  ├─ listOrganizations(filters, pagination)                  │
│  ├─ getOrganization(id)                                     │
│  ├─ createOrganization(data)                                │
│  ├─ updateOrganization(id, data)                            │
│  ├─ deleteOrganization(id)                                  │
│  ├─ searchOrganizations(query)                              │
│  ├─ bulkDeleteOrganizations(ids)                            │
│  ├─ getOrganizationContacts(orgId)                          │
│  ├─ getOrganizationDeals(orgId)                             │
│  ├─ getOrganizationRevenue(orgId)                           │
│  └─ getIndustries()                                         │
│                                                              │
│  Internal Behavior:                                          │
│  ├─ Domain uniqueness enforcement per venture               │
│  ├─ Industry distinct-values caching                        │
│  ├─ Revenue computation (SUM of linked deal values)         │
│  ├─ Cross-table joins for linked contacts/deals             │
│  └─ Audit event emission                                    │
└─────────────────────────────────────────────────────────────┘
```

**Domain deduplication flow:**

```
createOrganization(data)
    │
    ├─ Extract domain from data.domain
    │
    ├─ Query: SELECT id FROM organizations
    │         WHERE venture_id = ? AND domain = ?
    │
    ├─ If exists → throw DUPLICATE_DOMAIN error
    │
    └─ If unique → INSERT and return
```

### Deal Service (`deal-service.ts`)

```
┌─────────────────────────────────────────────────────────────┐
│                      Deal Service                            │
│                                                              │
│  Public API:                                                 │
│  ├─ listDeals(filters, pagination)                          │
│  ├─ getDeal(id)                                             │
│  ├─ createDeal(data)                                        │
│  ├─ updateDeal(id, data)                                    │
│  ├─ deleteDeal(id)                                          │
│  ├─ moveDealStage(id, stage)                                │
│  ├─ closeDeal(id, status, reason?)                          │
│  ├─ searchDeals(query)                                      │
│  ├─ getDealsByStage(pipelineId) → Kanban view               │
│  ├─ getPipelineSummary(pipelineId)                          │
│  └─ getClosedSummary(dateRange)                             │
│                                                              │
│  Internal Behavior:                                          │
│  ├─ Pipeline stage validation (stage must exist)            │
│  ├─ Stage movement tracking + audit                         │
│  ├─ Close logic (set actualCloseDate, status)               │
│  ├─ Kanban grouping (GROUP BY stage, SUM values)            │
│  ├─ Pipeline summary aggregation                            │
│  └─ Lost reason capture                                     │
└─────────────────────────────────────────────────────────────┘
```

**Stage movement validation flow:**

```
moveDealStage(dealId, newStage)
    │
    ├─ Fetch deal → validate exists, venture match
    │
    ├─ Fetch pipeline → get valid stages list
    │
    ├─ Validate newStage ∈ pipeline.stages
    │     └─ If invalid → throw INVALID_STAGE
    │
    ├─ Check V2 stage requirements
    │     ├─ Required fields populated?
    │     └─ If not → throw REQUIRED_FIELDS_MISSING
    │
    ├─ UPDATE deals SET stage = newStage
    │
    ├─ Execute stage automations
    │     ├─ Old stage: on_exit triggers
    │     └─ New stage: on_enter triggers
    │
    └─ Emit audit: deals.stage_changed
```

### Deal Scoring Service (`deal-scoring-service.ts`)

```
┌─────────────────────────────────────────────────────────────┐
│                   Deal Scoring Service                        │
│                                                              │
│  Public API:                                                 │
│  ├─ scoreDeal(dealId) → ScoreResult                         │
│  ├─ batchScoreDeals() → BatchResult                         │
│  ├─ getScoreHistory(dealId) → DealScore[]                   │
│  ├─ getScoringFactors(dealId) → ScoringFactor[]             │
│  ├─ getAtRiskDeals(limit) → AtRiskDeal[]                    │
│  └─ predictCloseDate(dealId) → Prediction | null            │
│                                                              │
│  Scoring Algorithm (9 factors, 100 points total):           │
│  ├─ stageProgression(deal, pipeline)         → 0-20 pts    │
│  ├─ dealVelocity(deal, historicalAvg)        → 0-15 pts    │
│  ├─ activityRecency(lastActivity)            → 0-15 pts    │
│  ├─ activityFrequency(last30dCount)          → 0-10 pts    │
│  ├─ meetingEngagement(meetingCount)          → 0-10 pts    │
│  ├─ emailEngagement(emailCount)              → 0-10 pts    │
│  ├─ dealSize(value, pipelineAvg)             → 0-10 pts    │
│  ├─ stakeholderInvolvement(uniqueParticips)  → 0-5 pts     │
│  └─ contactEngagement(contactLeadScore)      → 0-5 pts     │
│                                                              │
│  Risk Classification:                                        │
│  ├─ score 0-29  → HIGH risk  (P(win) < 20%)                │
│  ├─ score 30-59 → MEDIUM risk (P(win) 20-70%)              │
│  └─ score 60-100 → LOW risk  (P(win) > 70%)                │
│                                                              │
│  Win Probability: 100 / (1 + e^(-0.08 × (score - 50)))     │
└─────────────────────────────────────────────────────────────┘
```

**Scoring data gathering (parallel):**

```
scoreDeal(dealId)
    │
    ├─ Fetch deal record
    │
    ├─ Promise.all([                          ← Parallel!
    │     fetchPipeline(deal.pipelineId),
    │     fetchActivities(dealId, last30d),
    │     fetchMeetings(dealId),
    │     fetchEmails(dealId),
    │     fetchLastActivity(dealId),
    │     fetchPipelineAvgValue(pipelineId),
    │     fetchHistoricalCycleTime(ventureId),
    │     fetchStakeholders(dealId),
    │     fetchContactScore(deal.contactId),
    │     fetchPreviousScore(dealId),
    │   ])
    │
    ├─ Compute each factor score
    │
    ├─ Sum → total score
    │
    ├─ Classify risk level
    │
    ├─ Compute win probability (sigmoid)
    │
    ├─ Generate signals (positive/negative)
    │
    ├─ Predict close date (if historical data available)
    │
    ├─ INSERT INTO deal_scores (historical record)
    │
    └─ Return ScoreResult
```

### Lead Scoring Service (`lead-scoring-service.ts`)

```
┌─────────────────────────────────────────────────────────────┐
│                   Lead Scoring Service                        │
│                                                              │
│  Rule Management:                                            │
│  ├─ createScoringRule(data) → Rule                          │
│  ├─ updateScoringRule(id, data) → Rule                      │
│  ├─ deleteScoringRule(id) → void                            │
│  └─ listScoringRules() → Rule[]                             │
│                                                              │
│  Scoring:                                                    │
│  ├─ evaluateContact(contactId) → ContactScore               │
│  ├─ batchScoreContacts() → BatchResult                      │
│  ├─ getScoreBreakdown(contactId) → Breakdown                │
│  └─ applyDecay() → DecayResult                              │
│                                                              │
│  Analytics:                                                  │
│  ├─ getLeaderboard(limit) → LeaderboardEntry[]              │
│  └─ getScoreDistribution() → DistributionBucket[]           │
│                                                              │
│  Evaluation Flow:                                            │
│  ├─ Fetch active rules for venture                          │
│  ├─ For each rule:                                          │
│  │   ├─ Evaluate conditions against contact data            │
│  │   ├─ Sum matched condition points (cap at maxScore)      │
│  │   └─ Categorize (behavioral/demographic/firmographic)    │
│  ├─ Total = behavioral + demographic + firmographic         │
│  ├─ Upsert contact_scores record                            │
│  └─ Update contact.leadScore (denormalized)                 │
│                                                              │
│  Decay:                                                      │
│  ├─ Find contacts where lastActivity > decayDays            │
│  ├─ Reduce score by decayPercent per period                 │
│  └─ Update both contact_scores and contact.leadScore        │
└─────────────────────────────────────────────────────────────┘
```

**Rule evaluation logic:**

```
evaluateContact(contactId)
    │
    ├─ Fetch contact (with custom fields, tags)
    ├─ Fetch organization (if linked — for firmographic rules)
    ├─ Fetch activity counts (email, meeting, call counts in windows)
    ├─ Fetch active scoring rules for venture
    │
    ├─ For each rule:
    │     ├─ category = rule.category (behavioral|demographic|firmographic)
    │     ├─ For each condition in rule.rules:
    │     │     ├─ Resolve field value (contact.email, org.employeeCount, etc.)
    │     │     ├─ Evaluate operator (eq, gte, contains, in, etc.)
    │     │     └─ If match → accumulate points
    │     └─ Cap accumulated points at rule.maxScore
    │
    ├─ behavioralScore = SUM(behavioral rule scores)
    ├─ demographicScore = SUM(demographic rule scores)
    ├─ firmographicScore = SUM(firmographic rule scores)
    ├─ totalScore = behavioral + demographic + firmographic
    │
    ├─ UPSERT contact_scores (full breakdown)
    ├─ UPDATE contact SET leadScore = totalScore
    │
    └─ Return ContactScore with breakdown
```

### Forecast Service (`forecast-service.ts`)

```
┌─────────────────────────────────────────────────────────────┐
│                    Forecast Service                           │
│                                                              │
│  Public API:                                                 │
│  ├─ createForecast(period, start, end, pipeline?, owner?)   │
│  ├─ updateForecastItem(itemId, category, amount)            │
│  ├─ getForecastSummary(period)                              │
│  ├─ getForecastVsActual(start, end)                         │
│  ├─ getForecastByOwner(forecastId)                          │
│  ├─ getForecastByPipeline(forecastId)                       │
│  ├─ getQuotaAttainment(userId, start, end, quota)           │
│  └─ getTrendAnalysis(periods[])                             │
│                                                              │
│  Auto-Population Logic:                                      │
│  ├─ On createForecast:                                      │
│  │   ├─ Find open deals with expectedCloseDate in range     │
│  │   ├─ For each deal:                                      │
│  │   │   ├─ probability ≥ 90% → category = 'commit'        │
│  │   │   ├─ probability ≥ 70% → category = 'best_case'     │
│  │   │   └─ else → category = 'pipeline'                   │
│  │   └─ Create forecast_items for each deal                 │
│  │                                                          │
│  Computed Totals:                                            │
│  ├─ forecastAmount = SUM(non-omitted items)                 │
│  ├─ weightedAmount = SUM(amount × probability/100)          │
│  ├─ bestCase = SUM(commit + best_case items)                │
│  ├─ worstCase = SUM(commit items only)                      │
│  └─ closedWonAmount = SUM(won deals in period)              │
└─────────────────────────────────────────────────────────────┘
```

### Duplicate Detection Service (`duplicate-detection-service.ts`)

```
┌─────────────────────────────────────────────────────────────┐
│                Duplicate Detection Service                    │
│                                                              │
│  Detection:                                                  │
│  ├─ findDuplicates(objectType, data) → DuplicateMatch[]     │
│  ├─ scanForDuplicates(objectType) → DuplicateGroup[]        │
│  └─ getDuplicateGroups() → DuplicateGroup[]                 │
│                                                              │
│  Merge:                                                      │
│  ├─ getMergePreview(type, survivorId, mergedId)             │
│  ├─ mergeRecords(type, survivorId, mergedId, resolutions)   │
│  └─ getMergeHistory() → MergeHistoryRecord[]                │
│                                                              │
│  Matching Strategies:                                        │
│  ├─ 1. Exact email match → 98% confidence                  │
│  ├─ 2. Phone normalization match → 90% confidence           │
│  ├─ 3. Fuzzy name (Levenshtein ≥ 85%) → variable           │
│  └─ 4. Domain match (organizations) → 70% confidence        │
│                                                              │
│  Merge Execution:                                            │
│  ├─ Snapshot both records (pre-merge state)                 │
│  ├─ Apply field resolutions (survivor vs merged per field)  │
│  ├─ Re-link related records (deals, activities, etc.)       │
│  ├─ Delete merged record                                    │
│  ├─ Write merge_history entry                               │
│  └─ Emit audit: contacts.merged / organizations.merged      │
└─────────────────────────────────────────────────────────────┘
```

**Duplicate detection algorithm:**

```
findDuplicates('contact', candidateData)
    │
    ├─ Strategy 1: Exact Email
    │   ├─ SELECT * FROM contacts WHERE email = candidateData.email
    │   └─ Each match → confidence = 98, reason = "Exact email match"
    │
    ├─ Strategy 2: Phone Normalization
    │   ├─ Normalize phone: strip spaces, parens, dashes
    │   ├─ SELECT * FROM contacts WHERE normalize(phone) = normalizedPhone
    │   └─ Each match → confidence = 90, reason = "Phone match"
    │
    ├─ Strategy 3: Fuzzy Name
    │   ├─ SELECT * FROM contacts WHERE venture_id = ?
    │   │   AND first_name IS NOT NULL AND last_name IS NOT NULL
    │   │   LIMIT CRM_DUPLICATE_SCAN_LIMIT
    │   ├─ For each: compute Levenshtein similarity
    │   │   similarity = 1 - (distance / max(len(a), len(b)))
    │   └─ If similarity ≥ 85% → match with reason "Name similarity: XX%"
    │
    ├─ Deduplicate matches (same record from multiple strategies)
    ├─ Take highest confidence per matched record
    ├─ Combine match reasons
    │
    └─ Return sorted by confidence DESC
```

### Custom Object Service (`custom-object-service.ts`)

```
┌─────────────────────────────────────────────────────────────┐
│                  Custom Object Service                       │
│                                                              │
│  Object Definition:                                          │
│  ├─ createCustomObject(name, fields, slug, icon, color)     │
│  ├─ updateCustomObject(id, updates)                         │
│  ├─ deleteCustomObject(id) → cascade delete all records     │
│  ├─ getCustomObject(id)                                     │
│  └─ listCustomObjects()                                     │
│                                                              │
│  Record CRUD:                                                │
│  ├─ createCustomRecord(objectId, data)                      │
│  │   └─ Validates data against object's field schema        │
│  ├─ updateCustomRecord(recordId, data)                      │
│  ├─ deleteCustomRecord(recordId)                            │
│  └─ listCustomRecords(objectId, pagination)                 │
│                                                              │
│  Relationships:                                              │
│  ├─ createRelationship(source, target, type, label)         │
│  ├─ deleteRelationship(id)                                  │
│  └─ getRelatedRecords(objectType, objectId)                 │
│                                                              │
│  Field Type Validation:                                      │
│  ├─ text → string, max length                               │
│  ├─ number → numeric, min/max                               │
│  ├─ email → email format                                    │
│  ├─ phone → phone pattern                                   │
│  ├─ url → URL format                                        │
│  ├─ date → ISO date string                                  │
│  ├─ datetime → ISO datetime                                 │
│  ├─ boolean → true/false                                    │
│  ├─ select → value ∈ options[]                              │
│  ├─ multiselect → all values ∈ options[]                    │
│  ├─ textarea → string, max length                           │
│  ├─ currency → numeric, precision 2                         │
│  └─ percent → numeric, 0-100                                │
│                                                              │
│  Limits:                                                     │
│  ├─ Max 50 custom objects per venture                       │
│  └─ Max 100 fields per custom object                        │
└─────────────────────────────────────────────────────────────┘
```

### Smart View Service (`smart-view-service.ts`)

```
┌─────────────────────────────────────────────────────────────┐
│                   Smart View Service                         │
│                                                              │
│  View CRUD:                                                  │
│  ├─ createSmartView(name, objectType, filters, sort, cols)  │
│  ├─ updateSmartView(id, updates)                            │
│  ├─ deleteSmartView(id)                                     │
│  ├─ getSmartView(id)                                        │
│  ├─ listSmartViews(objectType)                              │
│  ├─ shareSmartView(id, isShared)                            │
│  └─ duplicateSmartView(id, newName)                         │
│                                                              │
│  View Execution:                                             │
│  ├─ applySmartView(viewId)                                  │
│  │   ├─ Fetch view configuration                            │
│  │   ├─ Build dynamic WHERE clause from filters             │
│  │   ├─ Apply ORDER BY from sort config                     │
│  │   ├─ Select columns from column config                   │
│  │   └─ Execute query with pagination                       │
│  │                                                          │
│  Filter Operators:                                           │
│  ├─ eq, neq → WHERE field = value / field != value          │
│  ├─ gt, gte, lt, lte → comparisons                         │
│  ├─ contains → WHERE field ILIKE '%value%'                  │
│  ├─ in → WHERE field IN (values)                            │
│  ├─ between → WHERE field BETWEEN v1 AND v2                 │
│  ├─ is_null → WHERE field IS NULL                           │
│  └─ is_not_null → WHERE field IS NOT NULL                   │
└─────────────────────────────────────────────────────────────┘
```

### Activity Service (`activity-service.ts`)

```
┌─────────────────────────────────────────────────────────────┐
│                    Activity Service                          │
│                                                              │
│  Public API:                                                 │
│  ├─ logActivity(data) → CrmActivity                        │
│  │   ├─ Validate subject exists (contact/deal/org)          │
│  │   ├─ Validate activity type                              │
│  │   ├─ Store metadata (type-specific JSONB)                │
│  │   ├─ Record createdBy (current user)                     │
│  │   └─ Emit audit event                                    │
│  │                                                          │
│  ├─ getActivities(subjectType, subjectId, pagination)       │
│  │   └─ Activity feed for a single entity                   │
│  │                                                          │
│  └─ getTimeline(subjectType, subjectId, pagination)         │
│      └─ Chronological timeline (newest first)               │
│                                                              │
│  Subject Types (polymorphic):                                │
│  ├─ contact → Activities linked to a contact                │
│  ├─ deal → Activities linked to a deal                      │
│  └─ organization → Activities linked to an organization     │
│                                                              │
│  Activity Types:                                             │
│  ├─ note → Free-text note with optional attachments         │
│  ├─ email → Email with from/to/subject/direction            │
│  ├─ call → Call with direction/duration/outcome             │
│  ├─ meeting → Meeting with time/location/attendees          │
│  └─ task → Task with due date/priority/status/assignee      │
└─────────────────────────────────────────────────────────────┘
```

---

## Data Models

### Entity-Relationship Diagram

```
                    ┌──────────────┐
                    │   ventures   │  (from @mcv/kernel)
                    │──────────────│
                    │  id (PK)     │
                    │  name        │
                    └──────┬───────┘
                           │ 1:N (venture_id FK on all CRM tables)
          ┌────────────────┼────────────────────────┐
          │                │                         │
          ▼                ▼                         ▼
┌──────────────┐  ┌──────────────┐         ┌──────────────┐
│   contacts   │  │organizations │         │  pipelines   │
│──────────────│  │──────────────│         │──────────────│
│ id (PK)      │  │ id (PK)      │         │ id (PK)      │
│ venture_id   │  │ venture_id   │         │ venture_id   │
│ type         │  │ name         │         │ name         │
│ firstName    │  │ domain       │         │ stages[]     │
│ lastName     │  │ industry     │         │ isDefault    │
│ email        │  │ employeeCount│         └──────┬───────┘
│ phone        │  │ annualRevenue│                │
│ company      │  │ address{}    │                │ 1:N
│ jobTitle     │  │ tags[]       │                │
│ leadScore    │  │ customFields │                ▼
│ lifecycle    │  └──────┬───────┘    ┌─────────────────────┐
│ ownerId      │         │            │ pipeline_stages_v2  │
│ customFields │         │            │─────────────────────│
│ tags[]       │         │            │ id (PK)             │
└──────┬───────┘         │            │ pipeline_id (FK)    │
       │                 │            │ name                │
       │  ┌──────────────┼────┐       │ order               │
       │  │              │    │       │ probability         │
       ▼  ▼              ▼    │       │ rottingDays         │
┌──────────────┐              │       │ requiredFields[]    │
│    deals     │              │       │ automations[]       │
│──────────────│              │       └─────────────────────┘
│ id (PK)      │              │
│ venture_id   │              │
│ pipeline_id  │──────────────┘ (FK to pipelines)
│ contact_id   │──────────────── (FK to contacts)
│ org_id       │──────────────── (FK to organizations)
│ name         │
│ value        │
│ currency     │
│ stage        │
│ probability  │
│ status       │
│ expected_    │
│   close_date │
│ actual_      │
│   close_date │
│ lostReason   │
│ ownerId      │
└──────┬───────┘
       │
       │ 1:N
       ▼
┌──────────────┐        ┌──────────────────┐
│ deal_scores  │        │  contact_scores  │
│──────────────│        │──────────────────│
│ id (PK)      │        │ id (PK)          │
│ deal_id (FK) │        │ contact_id (FK)  │ ← 1:1 unique
│ venture_id   │        │ venture_id       │
│ score        │        │ totalScore       │
│ confidence   │        │ behavioralScore  │
│ factors[]    │        │ demographicScore │
│ signals[]    │        │ firmographicScore│
│ predicted_   │        │ breakdown{}      │
│   close_date │        │ lastActivityAt   │
│ predicted_   │        │ scoredAt         │
│   amount     │        └──────────────────┘
│ winProbability│
│ riskLevel    │
│ scoredAt     │
└──────────────┘

       ┌──────────────────────────────────────┐
       │          crm_activities               │
       │──────────────────────────────────────│
       │ id (PK)                               │
       │ venture_id                            │
       │ subject_type  ('contact'|'deal'|'org')│
       │ subject_id    (polymorphic FK)        │
       │ activity_type ('note'|'email'|...)    │
       │ title                                 │
       │ description                           │
       │ metadata {}   (type-specific JSONB)   │
       │ created_by                            │
       │ created_at                            │
       └──────────────────────────────────────┘

┌──────────────────┐     ┌──────────────────┐
│    forecasts     │     │  forecast_items  │
│──────────────────│     │──────────────────│
│ id (PK)          │ 1:N │ id (PK)          │
│ venture_id       │────►│ forecast_id (FK) │
│ period           │     │ deal_id (FK)     │
│ periodStart      │     │ amount           │
│ periodEnd        │     │ probability      │
│ pipelineId       │     │ category         │
│ ownerId          │     └──────────────────┘
│ forecastAmount   │
│ weightedAmount   │
│ bestCase         │
│ worstCase        │
│ closedWonAmount  │
│ status           │
│ createdBy        │
└──────────────────┘

┌──────────────────────┐    ┌──────────────────────┐
│ lead_scoring_rules   │    │     smart_views       │
│──────────────────────│    │──────────────────────│
│ id (PK)              │    │ id (PK)              │
│ venture_id           │    │ venture_id           │
│ name                 │    │ name                 │
│ category             │    │ objectType           │
│ rules[]              │    │ filters[]            │
│ maxScore             │    │ sortBy[]             │
│ decayEnabled         │    │ columns[]            │
│ decayDays            │    │ isDefault            │
│ decayPercent         │    │ isShared             │
│ isActive             │    │ ownerId              │
└──────────────────────┘    └──────────────────────┘

┌──────────────────────┐    ┌──────────────────────┐    ┌──────────────────────┐
│   custom_objects     │    │ custom_object_records │    │ object_relationships │
│──────────────────────│    │──────────────────────│    │──────────────────────│
│ id (PK)              │ 1:N│ id (PK)              │    │ id (PK)              │
│ venture_id           │───►│ object_id (FK)       │    │ sourceObjectType     │
│ name                 │    │ venture_id           │    │ sourceObjectId       │
│ pluralName           │    │ data {}              │    │ targetObjectType     │
│ slug (unique/venture)│    │ created_at           │    │ targetObjectId       │
│ icon                 │    │ updated_at           │    │ relationshipType     │
│ color                │    └──────────────────────┘    │ label                │
│ fields[]             │                                └──────────────────────┘
│ isActive             │
└──────────────────────┘

┌──────────────────────┐    ┌──────────────────────┐
│   duplicate_rules    │    │    merge_history      │
│──────────────────────│    │──────────────────────│
│ id (PK)              │    │ id (PK)              │
│ venture_id           │    │ objectType           │
│ objectType           │    │ survivorId           │
│ matchFields[]        │    │ mergedId             │
│ thresholds{}         │    │ fieldResolutions{}   │
└──────────────────────┘    │ survivorSnapshot{}   │
                            │ mergedSnapshot{}     │
                            │ mergedBy             │
                            │ mergedAt             │
                            └──────────────────────┘
```

### Drizzle ORM Schema Definitions

#### contacts Table

```typescript
export const contacts = pgTable('contacts', {
  id: uuid('id').primaryKey().defaultRandom(),
  ventureId: uuid('venture_id').notNull()
    .references(() => ventures.id, { onDelete: 'cascade' }),
  type: text('type', { enum: ['person', 'company'] }).notNull(),
  firstName: text('first_name'),
  lastName: text('last_name'),
  email: text('email'),
  phone: text('phone'),
  company: text('company'),
  jobTitle: text('job_title'),
  leadScore: integer('lead_score').default(0),
  lifecycleStage: text('lifecycle_stage', {
    enum: ['lead', 'marketing_qualified', 'sales_qualified',
           'opportunity', 'customer', 'evangelist', 'churned'],
  }).default('lead'),
  ownerId: uuid('owner_id').references(() => users.id, { onDelete: 'set null' }),
  customFields: jsonb('custom_fields').$type<ContactCustomFields>().default({}),
  tags: jsonb('tags').$type<string[]>().default([]),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  index('idx_contacts_venture').on(table.ventureId),
  index('idx_contacts_email').on(table.email),
  index('idx_contacts_owner').on(table.ownerId),
  index('idx_contacts_type').on(table.type),
  index('idx_contacts_lifecycle_stage').on(table.lifecycleStage),
  index('idx_contacts_venture_type').on(table.ventureId, table.type),
  index('idx_contacts_venture_lifecycle').on(table.ventureId, table.lifecycleStage),
  index('idx_contacts_venture_owner').on(table.ventureId, table.ownerId),
  index('idx_contacts_lead_score').on(table.leadScore),
]);
```

#### organizations Table

```typescript
export const organizations = pgTable('organizations', {
  id: uuid('id').primaryKey().defaultRandom(),
  ventureId: uuid('venture_id').notNull()
    .references(() => ventures.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  domain: text('domain'),
  industry: text('industry'),
  employeeCount: integer('employee_count'),
  annualRevenue: decimal('annual_revenue', { precision: 15, scale: 2 }),
  address: jsonb('address').$type<OrganizationAddress>(),
  phone: text('phone'),
  website: text('website'),
  description: text('description'),
  ownerId: uuid('owner_id').references(() => users.id, { onDelete: 'set null' }),
  tags: jsonb('tags').$type<string[]>().default([]),
  customFields: jsonb('custom_fields').$type<Record<string, unknown>>().default({}),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  index('idx_organizations_venture').on(table.ventureId),
  index('idx_organizations_domain').on(table.domain),
  index('idx_organizations_industry').on(table.industry),
  uniqueIndex('idx_organizations_venture_domain').on(table.ventureId, table.domain),
]);
```

#### deals Table

```typescript
export const deals = pgTable('deals', {
  id: uuid('id').primaryKey().defaultRandom(),
  ventureId: uuid('venture_id').notNull()
    .references(() => ventures.id, { onDelete: 'cascade' }),
  pipelineId: uuid('pipeline_id').notNull()
    .references(() => pipelines.id, { onDelete: 'restrict' }),
  contactId: uuid('contact_id').references(() => contacts.id, { onDelete: 'set null' }),
  organizationId: uuid('organization_id')
    .references(() => organizations.id, { onDelete: 'set null' }),
  name: text('name').notNull(),
  value: decimal('value', { precision: 15, scale: 2 }),
  currency: text('currency').default('USD'),
  stage: text('stage').notNull(),
  probability: integer('probability'),
  status: text('status', { enum: ['open', 'won', 'lost'] }).default('open'),
  expectedCloseDate: date('expected_close_date'),
  actualCloseDate: date('actual_close_date'),
  lostReason: text('lost_reason'),
  ownerId: uuid('owner_id').references(() => users.id, { onDelete: 'set null' }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  index('idx_deals_venture').on(table.ventureId),
  index('idx_deals_pipeline').on(table.pipelineId),
  index('idx_deals_contact').on(table.contactId),
  index('idx_deals_organization').on(table.organizationId),
  index('idx_deals_status').on(table.status),
  index('idx_deals_owner').on(table.ownerId),
  index('idx_deals_venture_status').on(table.ventureId, table.status),
  index('idx_deals_venture_pipeline').on(table.ventureId, table.pipelineId),
  index('idx_deals_expected_close').on(table.expectedCloseDate),
]);
```

#### pipelines Table

```typescript
export const pipelines = pgTable('pipelines', {
  id: uuid('id').primaryKey().defaultRandom(),
  ventureId: uuid('venture_id').notNull()
    .references(() => ventures.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  stages: jsonb('stages').$type<PipelineStage[]>().notNull().default([]),
  isDefault: boolean('is_default').default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  index('idx_pipelines_venture').on(table.ventureId),
]);
```

#### pipeline_stages_v2 Table

```typescript
export const pipelineStagesV2 = pgTable('pipeline_stages_v2', {
  id: uuid('id').primaryKey().defaultRandom(),
  pipelineId: uuid('pipeline_id').notNull()
    .references(() => pipelines.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  order: integer('order').notNull(),
  probability: integer('probability').default(0),
  rottingDays: integer('rotting_days'),
  requiredFields: jsonb('required_fields').$type<string[]>().default([]),
  automations: jsonb('automations').$type<StageAutomation[]>().default([]),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  index('idx_pipeline_stages_v2_pipeline').on(table.pipelineId),
  index('idx_pipeline_stages_v2_order').on(table.pipelineId, table.order),
]);
```

#### deal_scores Table

```typescript
export const dealScores = pgTable('deal_scores', {
  id: uuid('id').primaryKey().defaultRandom(),
  dealId: uuid('deal_id').notNull()
    .references(() => deals.id, { onDelete: 'cascade' }),
  ventureId: uuid('venture_id').notNull()
    .references(() => ventures.id, { onDelete: 'cascade' }),
  score: integer('score').notNull().default(0),
  confidence: decimal('confidence', { precision: 5, scale: 2 }),
  factors: jsonb('factors').$type<ScoringFactor[]>().notNull().default([]),
  signals: jsonb('signals').$type<ScoringSignal[]>().notNull().default([]),
  predictedCloseDate: date('predicted_close_date'),
  predictedAmount: decimal('predicted_amount', { precision: 15, scale: 2 }),
  winProbability: decimal('win_probability', { precision: 5, scale: 2 }),
  riskLevel: text('risk_level', { enum: ['low', 'medium', 'high'] }).default('medium'),
  scoredAt: timestamp('scored_at', { withTimezone: true }).defaultNow().notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  index('idx_deal_scores_deal').on(table.dealId),
  index('idx_deal_scores_venture').on(table.ventureId),
  index('idx_deal_scores_score').on(table.score),
  index('idx_deal_scores_risk').on(table.riskLevel),
  index('idx_deal_scores_scored_at').on(table.scoredAt),
]);
```

#### contact_scores Table

```typescript
export const contactScores = pgTable('contact_scores', {
  id: uuid('id').primaryKey().defaultRandom(),
  contactId: uuid('contact_id').notNull()
    .references(() => contacts.id, { onDelete: 'cascade' }),
  ventureId: uuid('venture_id').notNull()
    .references(() => ventures.id, { onDelete: 'cascade' }),
  totalScore: integer('total_score').notNull().default(0),
  behavioralScore: integer('behavioral_score').notNull().default(0),
  demographicScore: integer('demographic_score').notNull().default(0),
  firmographicScore: integer('firmographic_score').notNull().default(0),
  breakdown: jsonb('breakdown').$type<ScoreBreakdown>().notNull().default({ rules: [] }),
  lastActivityAt: timestamp('last_activity_at', { withTimezone: true }),
  scoredAt: timestamp('scored_at', { withTimezone: true }).defaultNow().notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  uniqueIndex('idx_contact_scores_contact').on(table.contactId),
  index('idx_contact_scores_venture').on(table.ventureId),
  index('idx_contact_scores_total').on(table.totalScore),
  index('idx_contact_scores_venture_total').on(table.ventureId, table.totalScore),
]);
```

#### lead_scoring_rules Table

```typescript
export const leadScoringRules = pgTable('lead_scoring_rules', {
  id: uuid('id').primaryKey().defaultRandom(),
  ventureId: uuid('venture_id').notNull()
    .references(() => ventures.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  category: text('category', {
    enum: ['behavioral', 'demographic', 'firmographic'],
  }).notNull(),
  rules: jsonb('rules').$type<ScoringRuleCondition[]>().notNull().default([]),
  maxScore: integer('max_score').notNull().default(100),
  decayEnabled: boolean('decay_enabled').default(false),
  decayDays: integer('decay_days'),
  decayPercent: integer('decay_percent'),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  index('idx_lead_scoring_rules_venture').on(table.ventureId),
  index('idx_lead_scoring_rules_category').on(table.category),
  index('idx_lead_scoring_rules_active').on(table.ventureId, table.isActive),
]);
```

#### crm_activities Table

```typescript
export const crmActivities = pgTable('crm_activities', {
  id: uuid('id').primaryKey().defaultRandom(),
  ventureId: uuid('venture_id').notNull()
    .references(() => ventures.id, { onDelete: 'cascade' }),
  subjectType: text('subject_type', {
    enum: ['contact', 'deal', 'organization'],
  }).notNull(),
  subjectId: uuid('subject_id').notNull(),
  activityType: text('activity_type', {
    enum: ['note', 'email', 'call', 'meeting', 'task'],
  }).notNull(),
  title: text('title'),
  description: text('description'),
  metadata: jsonb('metadata').$type<CrmActivityMetadata>().default({}),
  createdBy: uuid('created_by').references(() => users.id, { onDelete: 'set null' }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  index('idx_crm_activities_subject').on(table.subjectType, table.subjectId),
  index('idx_crm_activities_venture').on(table.ventureId),
  index('idx_crm_activities_type').on(table.activityType),
  index('idx_crm_activities_created_by').on(table.createdBy),
  index('idx_crm_activities_venture_feed').on(table.ventureId, table.createdAt),
  index('idx_crm_activities_subject_feed').on(table.subjectType, table.subjectId, table.createdAt),
]);
```

#### forecasts & forecast_items Tables

```typescript
export const forecasts = pgTable('forecasts', {
  id: uuid('id').primaryKey().defaultRandom(),
  ventureId: uuid('venture_id').notNull()
    .references(() => ventures.id, { onDelete: 'cascade' }),
  period: text('period', { enum: ['monthly', 'quarterly', 'yearly'] }).notNull(),
  periodStart: date('period_start').notNull(),
  periodEnd: date('period_end').notNull(),
  pipelineId: uuid('pipeline_id').references(() => pipelines.id, { onDelete: 'set null' }),
  ownerId: uuid('owner_id').references(() => users.id, { onDelete: 'set null' }),
  forecastAmount: decimal('forecast_amount', { precision: 15, scale: 2 }).notNull().default('0'),
  weightedAmount: decimal('weighted_amount', { precision: 15, scale: 2 }).notNull().default('0'),
  bestCase: decimal('best_case', { precision: 15, scale: 2 }).notNull().default('0'),
  worstCase: decimal('worst_case', { precision: 15, scale: 2 }).notNull().default('0'),
  closedWonAmount: decimal('closed_won_amount', { precision: 15, scale: 2 }).notNull().default('0'),
  status: text('status', { enum: ['open', 'closed'] }).default('open'),
  createdBy: uuid('created_by').references(() => users.id, { onDelete: 'set null' }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  index('idx_forecasts_venture').on(table.ventureId),
  index('idx_forecasts_period').on(table.period, table.periodStart, table.periodEnd),
  index('idx_forecasts_venture_period').on(table.ventureId, table.period, table.periodStart),
]);

export const forecastItems = pgTable('forecast_items', {
  id: uuid('id').primaryKey().defaultRandom(),
  forecastId: uuid('forecast_id').notNull()
    .references(() => forecasts.id, { onDelete: 'cascade' }),
  dealId: uuid('deal_id').notNull()
    .references(() => deals.id, { onDelete: 'cascade' }),
  amount: decimal('amount', { precision: 15, scale: 2 }).notNull().default('0'),
  probability: integer('probability'),
  category: text('category', {
    enum: ['commit', 'best_case', 'pipeline', 'omitted'],
  }).notNull().default('pipeline'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  index('idx_forecast_items_forecast').on(table.forecastId),
  index('idx_forecast_items_deal').on(table.dealId),
  index('idx_forecast_items_category').on(table.category),
]);
```

#### smart_views Table

```typescript
export const smartViews = pgTable('smart_views', {
  id: uuid('id').primaryKey().defaultRandom(),
  ventureId: uuid('venture_id').notNull()
    .references(() => ventures.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  objectType: text('object_type', {
    enum: ['contact', 'organization', 'deal', 'custom'],
  }).notNull(),
  filters: jsonb('filters').$type<SmartViewFilter[]>().notNull().default([]),
  sortBy: jsonb('sort_by').$type<SmartViewSort[]>().notNull().default([]),
  columns: jsonb('columns').$type<SmartViewColumn[]>().notNull().default([]),
  isDefault: boolean('is_default').default(false),
  isShared: boolean('is_shared').default(false),
  ownerId: uuid('owner_id').references(() => users.id, { onDelete: 'set null' }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  index('idx_smart_views_venture').on(table.ventureId),
  index('idx_smart_views_object_type').on(table.ventureId, table.objectType),
  index('idx_smart_views_owner').on(table.ownerId),
]);
```

#### custom_objects, custom_object_records, object_relationships Tables

```typescript
export const customObjects = pgTable('custom_objects', {
  id: uuid('id').primaryKey().defaultRandom(),
  ventureId: uuid('venture_id').notNull()
    .references(() => ventures.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  pluralName: text('plural_name').notNull(),
  slug: text('slug').notNull(),
  icon: text('icon'),
  color: text('color'),
  fields: jsonb('fields').$type<CustomObjectFieldDef[]>().notNull().default([]),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  index('idx_custom_objects_venture').on(table.ventureId),
  uniqueIndex('idx_custom_objects_venture_slug').on(table.ventureId, table.slug),
]);

export const customObjectRecords = pgTable('custom_object_records', {
  id: uuid('id').primaryKey().defaultRandom(),
  objectId: uuid('object_id').notNull()
    .references(() => customObjects.id, { onDelete: 'cascade' }),
  ventureId: uuid('venture_id').notNull()
    .references(() => ventures.id, { onDelete: 'cascade' }),
  data: jsonb('data').$type<Record<string, unknown>>().notNull().default({}),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  index('idx_custom_object_records_object').on(table.objectId),
  index('idx_custom_object_records_venture').on(table.ventureId),
]);

export const objectRelationships = pgTable('object_relationships', {
  id: uuid('id').primaryKey().defaultRandom(),
  ventureId: uuid('venture_id').notNull()
    .references(() => ventures.id, { onDelete: 'cascade' }),
  sourceObjectType: text('source_object_type').notNull(),
  sourceObjectId: uuid('source_object_id').notNull(),
  targetObjectType: text('target_object_type').notNull(),
  targetObjectId: uuid('target_object_id').notNull(),
  relationshipType: text('relationship_type', {
    enum: ['has_many', 'belongs_to', 'many_to_many'],
  }).notNull(),
  label: text('label'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  index('idx_object_relationships_source').on(table.sourceObjectType, table.sourceObjectId),
  index('idx_object_relationships_target').on(table.targetObjectType, table.targetObjectId),
  index('idx_object_relationships_venture').on(table.ventureId),
]);
```

#### duplicate_rules & merge_history Tables

```typescript
export const duplicateRules = pgTable('duplicate_rules', {
  id: uuid('id').primaryKey().defaultRandom(),
  ventureId: uuid('venture_id').notNull()
    .references(() => ventures.id, { onDelete: 'cascade' }),
  objectType: text('object_type', {
    enum: ['contact', 'organization'],
  }).notNull(),
  matchFields: jsonb('match_fields').$type<string[]>().notNull().default([]),
  thresholds: jsonb('thresholds').$type<Record<string, number>>().notNull().default({}),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  index('idx_duplicate_rules_venture').on(table.ventureId),
  index('idx_duplicate_rules_object_type').on(table.objectType),
]);

export const mergeHistory = pgTable('merge_history', {
  id: uuid('id').primaryKey().defaultRandom(),
  ventureId: uuid('venture_id').notNull()
    .references(() => ventures.id, { onDelete: 'cascade' }),
  objectType: text('object_type').notNull(),
  survivorId: uuid('survivor_id').notNull(),
  mergedId: uuid('merged_id').notNull(),
  fieldResolutions: jsonb('field_resolutions')
    .$type<Record<string, 'survivor' | 'merged'>>().notNull().default({}),
  survivorSnapshot: jsonb('survivor_snapshot')
    .$type<Record<string, unknown>>().notNull().default({}),
  mergedSnapshot: jsonb('merged_snapshot')
    .$type<Record<string, unknown>>().notNull().default({}),
  mergedBy: uuid('merged_by').references(() => users.id, { onDelete: 'set null' }),
  mergedAt: timestamp('merged_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  index('idx_merge_history_venture').on(table.ventureId),
  index('idx_merge_history_survivor').on(table.survivorId),
  index('idx_merge_history_merged_at').on(table.mergedAt),
]);
```

### Index Summary

| Table | Index Count | Key Patterns |
|---|---|---|
| contacts | 9 | venture, email, owner, type, lifecycle, lead_score |
| organizations | 4 | venture, domain, industry, venture+domain (unique) |
| deals | 9 | venture, pipeline, contact, org, status, owner, expected_close |
| deal_scores | 5 | deal, venture, score, risk, scored_at |
| contact_scores | 4 | contact (unique), venture, total, venture+total |
| crm_activities | 6 | subject, venture, type, created_by, venture+feed, subject+feed |
| forecasts | 3 | venture, period, venture+period |
| forecast_items | 3 | forecast, deal, category |
| smart_views | 3 | venture, venture+object_type, owner |
| custom_objects | 2 | venture, venture+slug (unique) |
| custom_object_records | 2 | object, venture |
| object_relationships | 3 | source, target, venture |
| pipeline_stages_v2 | 2 | pipeline, pipeline+order |
| lead_scoring_rules | 3 | venture, category, venture+active |
| duplicate_rules | 2 | venture, object_type |
| merge_history | 3 | venture, survivor, merged_at |
| **Total** | **~63** | |

---

## Data Flow & Events

### Event Architecture

CRM mutations emit audit events via `@mcv/kernel`'s audit service. Events are published to Redpanda/Kafka for downstream consumption by analytics, growth, nexus, and other domains.

```
CRM Service Mutation
    │
    ├─ Database Write (synchronous)
    │
    └─ Audit Event Emission (asynchronous, non-blocking)
         │
         ▼
    Redpanda/Kafka Topic: crm.events
         │
         ├──► @mcv/analytics (dashboard updates, metrics)
         ├──► @mcv/growth (lead gen triggers, campaign updates)
         ├──► @mcv/nexus (conversation context enrichment)
         └──► @mcv/naos (AI agent notifications)
```

### Audit Events Catalog

| Event | Category | Payload | Trigger |
|---|---|---|---|
| `contacts.created` | data | Contact record | createContact |
| `contacts.updated` | data | Changed fields | updateContact |
| `contacts.deleted` | data | Contact ID | deleteContact |
| `contacts.bulk_updated` | data | Count, fields | bulkUpdateContacts |
| `contacts.bulk_deleted` | data | Count, IDs | bulkDeleteContacts |
| `contacts.scored` | analytics | Score breakdown | evaluateContact |
| `contacts.merged` | data | Survivor, merged, resolutions | mergeRecords |
| `organizations.created` | data | Organization record | createOrganization |
| `organizations.updated` | data | Changed fields | updateOrganization |
| `organizations.deleted` | data | Organization ID | deleteOrganization |
| `organizations.bulk_deleted` | data | Count, IDs | bulkDeleteOrganizations |
| `organizations.merged` | data | Survivor, merged, resolutions | mergeRecords |
| `deals.created` | data | Deal record | createDeal |
| `deals.updated` | data | Changed fields | updateDeal |
| `deals.stage_changed` | workflow | Old stage, new stage, deal | moveDealStage |
| `deals.closed_won` | revenue | Deal, value, close date | closeDeal(won) |
| `deals.closed_lost` | revenue | Deal, reason | closeDeal(lost) |
| `deals.deleted` | data | Deal ID | deleteDeal |
| `deals.scored` | analytics | Score result | scoreDeal |
| `forecast.created` | analytics | Forecast period | createForecast |
| `smart_view.created` | config | View config | createSmartView |
| `custom_object.created` | config | Object definition | createCustomObject |

### Cross-Service Data Flows

#### Contact → Lead Score → Deal Pipeline

```
Contact Created
    │
    ▼
Lead Scoring Engine (evaluateContact)
    │
    ├─ Evaluate behavioral rules (activity patterns)
    ├─ Evaluate demographic rules (title, industry)
    ├─ Evaluate firmographic rules (company size, revenue)
    │
    ▼
Contact Score Updated (contact.leadScore = total)
    │
    ▼
Sales Team Views (Smart View: "Hot Leads")
    │
    ▼
Deal Created (linked to contact)
    │
    ▼
Deal Scoring Engine (scoreDeal)
    ├─ Factor: Contact Engagement (uses contact.leadScore)
    │
    ▼
Pipeline Dashboard (Kanban with score badges)
```

#### Activity → Deal Score → At-Risk Alert

```
Activity Logged (call/email/meeting)
    │
    ▼
Activity Stored (crm_activities table)
    │
    ▼ (next batch scoring run)
Deal Scoring Engine
    │
    ├─ Factor: Activity Recency (improved)
    ├─ Factor: Activity Frequency (improved)
    ├─ Factor: Meeting Engagement (if meeting)
    ├─ Factor: Email Engagement (if email)
    │
    ▼
Score Change Detected
    │
    ├─ If score dropped → Add to at-risk list
    └─ If score improved → Remove from at-risk
```

#### Forecast → Deal Close → Actual vs Forecast

```
Forecast Created (Q1 2026)
    │
    ├─ Auto-populate with matching open deals
    │   ├─ probability ≥ 90% → commit
    │   ├─ probability ≥ 70% → best_case
    │   └─ else → pipeline
    │
    ▼
During Quarter: Deals Progress
    │
    ├─ Deal closes won → closedWonAmount increases
    ├─ Deal closes lost → removed from forecast
    ├─ New deals added → auto-categorized
    │
    ▼
End of Quarter: Forecast vs Actual
    │
    ├─ Accuracy = closedWon / forecastAmount × 100
    ├─ Gap = forecastAmount - closedWon
    └─ Trend analysis across quarters
```

---

## Integration Points

### Email Connector (`@mcv/connectors/email`)

The email connector integrates with CRM for two primary purposes:

1. **Activity Sync** — Incoming and outgoing emails linked to CRM contacts are automatically logged as activities:

```
Email Received/Sent
    │
    ▼
Email Connector processes message
    │
    ├─ Match sender/recipient to CRM contact (by email)
    │
    ├─ If match found:
    │   └─ logActivity({
    │       subjectType: 'contact',
    │       subjectId: matchedContact.id,
    │       activityType: 'email',
    │       metadata: {
    │         emailFrom: sender,
    │         emailTo: recipients,
    │         emailSubject: subject,
    │         emailDirection: 'inbound' | 'outbound',
    │       }
    │     })
    │
    └─ If no match → skip (or create new contact if auto-capture enabled)
```

2. **Stage Automation** — Pipeline stage automations can trigger email sends:

```
Deal Moves to "Proposal" Stage
    │
    ▼
Stage Automation: on_enter → send_email
    │
    ▼
Email Connector sends template email to deal contact
```

### Nexus (`@mcv/nexus`) — Omnichannel Conversations

Nexus links conversations to CRM contacts for context enrichment:

```
Incoming Conversation (chat, email, social)
    │
    ▼
Nexus resolves conversation → CRM contact
    │
    ├─ searchContacts by email/phone
    │
    ├─ If found:
    │   ├─ Display contact card in conversation view
    │   ├─ Show linked deals, recent activities
    │   └─ Log conversation as CRM activity
    │
    └─ If not found:
        └─ Option to create new contact from conversation
```

### Growth (`@mcv/growth`) — Lead Generation

Growth uses CRM data for campaign targeting and lead management:

```
Campaign Created in Growth
    │
    ├─ Target audience from CRM:
    │   ├─ Smart View: "Enterprise Leads"
    │   ├─ Filter: lifecycle = lead, industry = SaaS
    │   └─ Result: contact list for campaign
    │
    ▼
Campaign Executed
    │
    ├─ Responses tracked in Growth
    │
    ▼
Lead Conversion
    │
    ├─ Update contact lifecycle: lead → marketing_qualified
    ├─ Log activity: "Responded to campaign X"
    └─ Trigger lead scoring re-evaluation
```

### Analytics (`@mcv/analytics`) — Cross-Domain Reporting

Analytics reads CRM data for dashboard generation:

```
Analytics Dashboard Request
    │
    ├─ Pipeline health → getPipelineSummary()
    ├─ Revenue forecast → getForecastSummary()
    ├─ Conversion rates → contacts by lifecycle stage over time
    ├─ Deal velocity → average time per stage
    ├─ Rep performance → deals by owner with win rates
    └─ At-risk deals → getAtRiskDeals()
```

### NAOS (`@mcv/naos`) — AI Agent Framework

NAOS agents use CRM services for intelligent automation:

```
Sales Agent (NAOS)
    │
    ├─ Monitors at-risk deals → getAtRiskDeals()
    ├─ Suggests next actions → based on scoring signals
    ├─ Auto-logs activities → logActivity()
    ├─ Predicts close dates → predictCloseDate()
    └─ Recommends stage movements → based on score trends

CRM Agent (NAOS)
    │
    ├─ Answers CRM queries → "Show me deals closing this month"
    ├─ Creates/updates records → via CRM service functions
    ├─ Generates reports → pipeline summary, forecast
    └─ Detects duplicates → findDuplicates() before creation
```

---

## Performance

### Search & Query Optimization

#### Contact Search (Autocomplete)

```
searchContacts("sarah")
    │
    ├─ Query Strategy:
    │   SELECT * FROM contacts
    │   WHERE venture_id = ?
    │     AND (
    │       first_name ILIKE 'sarah%'
    │       OR last_name ILIKE 'sarah%'
    │       OR email ILIKE 'sarah%'
    │       OR company ILIKE 'sarah%'
    │     )
    │   ORDER BY lead_score DESC
    │   LIMIT 10
    │
    ├─ Index: idx_contacts_venture (for venture filter)
    ├─ Pattern: prefix ILIKE (more index-friendly than %contains%)
    ├─ Limit: Hard cap at 10 results for autocomplete
    │
    └─ Target: < 30ms (P50), < 80ms (P99)
```

#### Kanban View (Deals by Stage)

```
getDealsByStage(pipelineId)
    │
    ├─ Query Strategy:
    │   SELECT stage, COUNT(*), SUM(value), json_agg(deals.*)
    │   FROM deals
    │   WHERE venture_id = ? AND pipeline_id = ? AND status = 'open'
    │   GROUP BY stage
    │   ORDER BY (SELECT order FROM pipeline_stages WHERE name = stage)
    │
    ├─ Index: idx_deals_venture_pipeline (composite)
    ├─ Aggregation: Single query with GROUP BY (no N+1)
    │
    └─ Target: < 100ms (P50), < 300ms (P99)
```

### Scoring Performance

#### Deal Scoring Optimization

The deal scoring engine uses parallel data gathering to minimize latency:

```
scoreDeal(dealId) — Single Deal
    │
    ├─ 10 parallel queries via Promise.all
    │   ├─ Each query: 5-20ms (indexed)
    │   └─ Total parallel time: ~20ms (limited by slowest query)
    │
    ├─ Score computation: ~1ms (in-memory arithmetic)
    │
    ├─ Score persistence: ~5ms (INSERT)
    │
    └─ Total: ~30-50ms typical, < 200ms target

batchScoreDeals() — All Open Deals
    │
    ├─ Batch size: 100 deals per iteration
    ├─ Each batch: ~2-5s (100 × 30-50ms, with connection pool limits)
    ├─ Total for 1000 deals: ~20-50s
    │
    └─ Runs as background cron job (2 AM daily)
```

#### Lead Scoring Optimization

```
evaluateContact(contactId) — Single Contact
    │
    ├─ Fetch contact + org + activity counts: ~15ms
    ├─ Fetch active rules: ~5ms
    ├─ Rule evaluation (in-memory): ~1ms
    ├─ Score persistence (UPSERT): ~5ms
    │
    └─ Total: ~30ms typical, < 100ms target

batchScoreContacts() — All Contacts
    │
    ├─ Batch size: 5000 contacts per iteration
    ├─ Pre-load all rules (single query)
    ├─ Stream contacts in pages
    ├─ Batch UPSERT scores
    │
    └─ Total for 100K contacts: ~5-10 minutes (background)
```

### Caching Strategy

```
Redis Cache
    │
    ├─ Score Results (TTL: 1 hour)
    │   Key: crm:score:deal:{dealId}
    │   Value: JSON ScoreResult
    │   Invalidated on: activity logged, deal updated, stage moved
    │
    ├─ Pipeline Stages (TTL: 24 hours)
    │   Key: crm:pipeline:{pipelineId}:stages
    │   Value: JSON PipelineStage[]
    │   Invalidated on: pipeline updated
    │
    ├─ Industry List (TTL: 1 hour)
    │   Key: crm:industries:{ventureId}
    │   Value: string[]
    │   Invalidated on: organization created/updated
    │
    └─ Smart View Results (TTL: 5 minutes)
        Key: crm:view:{viewId}:page:{page}
        Value: JSON query result
        Invalidated on: any CRM mutation in venture
```

---

## Scalability

### Horizontal Scaling Considerations

| Dimension | Current | Scale Path |
|---|---|---|
| Database | Single Supabase instance | Read replicas for analytics queries |
| Application | Single Next.js deployment | Serverless functions per service module |
| Background Jobs | In-process cron | Dedicated job queue (BullMQ/Redis) |
| Event Processing | Redpanda single partition | Multi-partition by ventureId |
| Search | PostgreSQL ILIKE | Elasticsearch/Meilisearch for full-text |

### Data Partitioning Strategy

For ventures exceeding standard limits (1M+ contacts):

```
Option 1: Logical Partitioning (current)
    └─ ventureId in every query + composite indexes

Option 2: Table Partitioning (future)
    └─ PostgreSQL PARTITION BY RANGE (venture_id)

Option 3: Schema Isolation (future, enterprise)
    └─ Separate PostgreSQL schema per large venture
```

### Connection Pool Management

```
Supabase Connection Pooler
    │
    ├─ Transaction mode (default): 50 connections
    │   └─ Used for: CRUD operations, search, scoring
    │
    ├─ Session mode: 10 connections
    │   └─ Used for: Long-running batch operations
    │
    └─ Direct connections: 5
        └─ Used for: Migrations, schema changes
```

---

## Error Handling

### Error Code Hierarchy

```typescript
// CRM Error Codes
const CRM_ERRORS = {
  // 400 - Bad Request
  VENTURE_REQUIRED: { status: 400, message: 'Venture context required for CRM operations' },
  INVALID_STAGE: { status: 400, message: 'Stage does not exist in pipeline' },
  REQUIRED_FIELDS_MISSING: { status: 400, message: 'Required fields not populated for stage entry' },

  // 404 - Not Found
  CONTACT_NOT_FOUND: { status: 404, message: 'Contact does not exist or not in venture' },
  ORGANIZATION_NOT_FOUND: { status: 404, message: 'Organization does not exist' },
  DEAL_NOT_FOUND: { status: 404, message: 'Deal does not exist' },
  PIPELINE_NOT_FOUND: { status: 404, message: 'Pipeline does not exist' },
  SCORING_RULE_NOT_FOUND: { status: 404, message: 'Lead scoring rule does not exist' },
  FORECAST_NOT_FOUND: { status: 404, message: 'Forecast period does not exist' },
  FORECAST_ITEM_NOT_FOUND: { status: 404, message: 'Forecast item does not exist' },
  MERGE_RECORD_NOT_FOUND: { status: 404, message: 'One or both records not found for merge' },
  VIEW_NOT_FOUND: { status: 404, message: 'Smart view does not exist' },
  CUSTOM_OBJECT_NOT_FOUND: { status: 404, message: 'Custom object definition does not exist' },

  // 409 - Conflict
  DUPLICATE_DOMAIN: { status: 409, message: 'Organization with this domain already exists' },
  CUSTOM_OBJECT_SLUG_EXISTS: { status: 409, message: 'Custom object slug already in use' },

  // 500 - Server Error
  DATABASE_UNAVAILABLE: { status: 500, message: 'Database connection not available' },
  SCORING_ENGINE_ERROR: { status: 500, message: 'Scoring engine encountered an error' },
} as const;
```

### Error Handling Patterns

```typescript
// Service-level error handling
async function getContact(id: string, ventureId: string): Promise<Contact> {
  const contact = await db.select()
    .from(contacts)
    .where(and(eq(contacts.id, id), eq(contacts.ventureId, ventureId)))
    .limit(1);

  if (!contact.length) {
    throw new TRPCError({
      code: 'NOT_FOUND',
      message: CRM_ERRORS.CONTACT_NOT_FOUND.message,
    });
  }

  return contact[0];
}

// Batch operation error handling (partial success)
async function bulkUpdateContacts(ids: string[], data: Partial<Contact>, ventureId: string) {
  const results = {
    updated: 0,
    failed: 0,
    errors: [] as Array<{ id: string; error: string }>,
  };

  for (const id of ids) {
    try {
      await updateContact(id, data, ventureId);
      results.updated++;
    } catch (error) {
      results.failed++;
      results.errors.push({ id, error: error.message });
    }
  }

  return results;
}
```

### Retry Strategy

| Operation | Retries | Backoff | Timeout |
|---|---|---|---|
| Database reads | 2 | 100ms, 500ms | 5s |
| Database writes | 1 | 200ms | 10s |
| Batch scoring | 3 | 1s, 5s, 30s | 60s per batch |
| Event emission | 3 | 100ms, 1s, 5s | 10s |
| Cache operations | 1 | 50ms | 1s |

---

## Observability

### Logging

CRM services use structured logging via `@mcv/kernel`'s logger:

```typescript
// Service-level logging
logger.info('CRM: Contact created', {
  contactId: contact.id,
  ventureId: contact.ventureId,
  type: contact.type,
  lifecycleStage: contact.lifecycleStage,
  duration: Date.now() - startTime,
});

logger.warn('CRM: Deal scoring confidence low', {
  dealId: deal.id,
  score: result.score,
  confidence: result.confidence,
  reason: 'Insufficient activity data',
});

logger.error('CRM: Batch scoring failed', {
  ventureId,
  batchSize: deals.length,
  error: error.message,
  stack: error.stack,
});
```

### Metrics

| Metric | Type | Labels | Purpose |
|---|---|---|---|
| `crm_contacts_total` | Gauge | venture_id, type | Contact count |
| `crm_deals_total` | Gauge | venture_id, status, pipeline_id | Deal count |
| `crm_deal_score_computed` | Counter | venture_id, risk_level | Scoring operations |
| `crm_lead_score_computed` | Counter | venture_id | Lead scoring operations |
| `crm_activities_logged` | Counter | venture_id, activity_type | Activity volume |
| `crm_duplicates_found` | Counter | venture_id, object_type | Duplicate detections |
| `crm_merges_completed` | Counter | venture_id, object_type | Merge operations |
| `crm_forecast_accuracy` | Gauge | venture_id, period | Forecast accuracy % |
| `crm_service_duration_ms` | Histogram | service, method | Latency distribution |
| `crm_service_errors_total` | Counter | service, error_code | Error rates |

### Health Checks

```typescript
// CRM health endpoint
GET /api/crm/health

Response:
{
  "status": "healthy" | "degraded" | "unhealthy",
  "timestamp": "2026-02-09T04:00:00Z",
  "checks": {
    "database": { "status": "up", "latency_ms": 5 },
    "redis": { "status": "up", "latency_ms": 2 },
    "tables": {
      "contacts": true,
      "deals": true,
      "pipelines": true,
      "activities": true,
      "deal_scores": true,
      "contact_scores": true,
      "forecasts": true,
      "smart_views": true,
      "custom_objects": true
    },
    "cron": {
      "lastBatchScore": "2026-02-09T02:00:00Z",
      "lastDecayRun": "2026-02-03T03:00:00Z",
      "lastDuplicateScan": "2026-02-02T04:00:00Z"
    }
  }
}
```

### Alerting Rules

| Alert | Condition | Severity |
|---|---|---|
| CRM Database Latency High | P99 > 500ms for 5 min | Warning |
| CRM Database Unavailable | Health check fails 3x | Critical |
| Batch Scoring Failed | Cron job error | Warning |
| Batch Scoring Missed | No score run in 36 hours | Warning |
| High Duplicate Rate | > 100 duplicates detected per scan | Info |
| Forecast Accuracy Low | < 50% accuracy for closed period | Info |
| Contact Limit Approaching | > 90% of venture limit | Warning |

---

## Security

### Defense-in-Depth Layers

```
Layer 1: Network
    └─ TLS, API Gateway rate limiting

Layer 2: Authentication
    └─ JWT/session validation via @mcv/identity

Layer 3: Authorization
    └─ Permission procedures (contacts:read, deals:create, etc.)

Layer 4: Application
    └─ Venture context enforcement in every service function

Layer 5: ORM
    └─ Venture-scoped WHERE clauses in all queries

Layer 6: Database
    └─ PostgreSQL Row-Level Security (RLS) policies

Layer 7: Audit
    └─ All mutations logged with user, venture, timestamp
```

### Input Sanitization

```typescript
// All inputs validated through Zod before reaching service layer
const createContactSchema = z.object({
  type: z.enum(['person', 'company']),
  firstName: z.string().max(255).trim().optional(),
  lastName: z.string().max(255).trim().optional(),
  email: z.string().email().toLowerCase().optional(),
  phone: z.string().max(50).trim().optional(),
  company: z.string().max(255).trim().optional(),
  jobTitle: z.string().max(255).trim().optional(),
  lifecycleStage: z.enum(LIFECYCLE_STAGES).default('lead'),
  ownerId: z.string().uuid().optional(),
  customFields: z.record(z.unknown()).default({}),
  tags: z.array(z.string().max(100)).max(50).default([]),
});

// Custom field values validated against object schema before storage
function validateCustomRecord(data: Record<string, unknown>, fields: CustomObjectFieldDef[]) {
  for (const field of fields) {
    const value = data[field.key];
    if (field.required && (value === undefined || value === null)) {
      throw new Error(`Required field missing: ${field.label}`);
    }
    // Type-specific validation (email format, number range, select options, etc.)
    validateFieldType(field, value);
  }
}
```

### Sensitive Data Handling

| Data Type | Storage | Access Control | Encryption |
|---|---|---|---|
| Contact emails | PostgreSQL | RLS + permission | At rest (Supabase) |
| Phone numbers | PostgreSQL | RLS + permission | At rest (Supabase) |
| Deal values | PostgreSQL (decimal) | RLS + permission | At rest (Supabase) |
| Activity metadata | PostgreSQL (JSONB) | RLS + permission | At rest (Supabase) |
| Merge snapshots | PostgreSQL (JSONB) | RLS + permission | At rest (Supabase) |
| Custom field data | PostgreSQL (JSONB) | RLS + permission | At rest (Supabase) |
| Call recordings | @mcv/fabric (S3) | Signed URLs | At rest + in transit |

---

*@mcv/crm — Customer Relationship Management Domain*
