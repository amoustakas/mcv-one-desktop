# @mcv/crm — Implementation Plan

| Field | Value |
|---|---|
| **Package** | `@mcv/crm` |
| **Classification** | PUBLISHABLE |
| **Tier** | 5 — Domain Modules |
| **Last Updated** | February 9, 2026 |

---

## Table of Contents

1. [Overview](#overview)
2. [Prerequisites](#prerequisites)
3. [Phase 1 — Foundation](#phase-1--foundation)
4. [Phase 2 — Core](#phase-2--core)
5. [Phase 3 — Advanced](#phase-3--advanced)
6. [Phase 4 — Polish & Publishable Readiness](#phase-4--polish--publishable-readiness)
7. [Testing Strategy](#testing-strategy)
8. [Acceptance Criteria](#acceptance-criteria)
9. [Risks & Mitigations](#risks--mitigations)
10. [Timeline](#timeline)

---

## Overview

This document defines the phased implementation plan for `@mcv/crm`, the Customer Relationship Management domain module within MCV.ONE. The CRM is classified as **PUBLISHABLE** — it must function both as an internal domain for the 9-venture consortium and as a standalone SaaS product deployable independently.

The implementation is divided into four phases:

| Phase | Focus | Duration | Status |
|---|---|---|---|
| **Phase 1 — Foundation** | Contact/company schema, basic CRUD, multi-tenancy | 4 weeks | ✅ Complete |
| **Phase 2 — Core** | Deals, pipelines, activities, custom fields, smart views | 5 weeks | ✅ Complete |
| **Phase 3 — Advanced** | AI deal scoring, lead scoring, forecasting, duplicate detection, custom objects | 6 weeks | ✅ Complete |
| **Phase 4 — Polish** | Publishable packaging, performance tuning, documentation, standalone deployment | 4 weeks | 🔄 In Progress |

### Guiding Principles

1. **Schema-first** — Define Drizzle ORM schemas and Zod validation schemas before writing service logic. The database design drives everything.
2. **Multi-tenancy from day one** — Every table has `venture_id`, every query is venture-scoped, RLS policies are created alongside tables.
3. **Test as you build** — Unit tests for service logic, integration tests for database operations, written alongside features.
4. **Incremental value** — Each phase delivers a usable product increment. Phase 1 alone is a functional contact manager.
5. **Publishable mindset** — No MCV.ONE-specific assumptions in core logic. Integration points are clean interfaces, not hard dependencies.

---

## Prerequisites

### Infrastructure Dependencies

| Dependency | Required For | Status |
|---|---|---|
| `@mcv/kernel` (Tier 1) | Database client, Drizzle ORM, config, logging, audit framework, venture context | ✅ Available |
| `@mcv/identity` (Tier 2) | Authentication, RBAC permissions, user context, permission procedures | ✅ Available |
| `@mcv/fabric` (Tier 2) | File storage for activity attachments (documents, recordings) | ✅ Available |
| PostgreSQL (Supabase) | Primary data store with RLS | ✅ Available |
| Redis | Caching for scores, search indexes, rate limiting | ✅ Available |
| Redpanda/Kafka | Event streaming for cross-domain events | ✅ Available |

### Development Environment

| Requirement | Details |
|---|---|
| Turborepo workspace | Package at `packages/domains/crm/` |
| Drizzle Kit | Schema generation and migration tooling |
| tRPC v10 | API route definitions with middleware |
| Zod v3 | Input validation schemas |
| Vitest | Unit and integration testing |
| TypeScript 5.x | Strict mode enabled |

### Team Skills

| Skill | Required For |
|---|---|
| Drizzle ORM + PostgreSQL | Schema design, complex queries, indexing |
| tRPC + Zod | API design, input validation, middleware |
| React + Next.js 15 | Client hooks and components |
| PostgreSQL RLS | Multi-tenancy security |
| Algorithm design | Deal scoring, duplicate detection, lead scoring |

---

## Phase 1 — Foundation

**Duration:** 4 weeks
**Goal:** Establish the data foundation with contacts, organizations, and the multi-tenancy backbone.

### Week 1: Schema & Infrastructure

#### Tasks

- [ ] **1.1 — Create package scaffold**
  - Initialize `packages/domains/crm/` with `package.json`, `tsconfig.json`
  - Set up directory structure: `server/services/`, `server/schema/`, `client/hooks/`, `client/components/`
  - Configure Turborepo build pipeline
  - Create `constants.ts`, `types.ts`, `index.ts` barrel exports

- [ ] **1.2 — Define contacts schema**
  - Create `server/schema/contacts.ts` with Drizzle table definition
  - Fields: id, ventureId, type, firstName, lastName, email, phone, company, jobTitle, leadScore, lifecycleStage, ownerId, customFields, tags, timestamps
  - Define all 9 indexes (venture, email, owner, type, lifecycle, composites, leadScore)
  - Generate and run migration

- [ ] **1.3 — Define organizations schema**
  - Create `server/schema/organizations.ts`
  - Fields: id, ventureId, name, domain, industry, employeeCount, annualRevenue, address, phone, website, description, ownerId, tags, customFields, timestamps
  - Unique constraint on venture_id + domain
  - Generate and run migration

- [ ] **1.4 — RLS policies**
  - Create RLS policies for contacts table (venture_id isolation)
  - Create RLS policies for organizations table
  - Test RLS enforcement with different venture contexts
  - Document service-role bypass for administrative operations

#### Deliverables
- Contacts and organizations tables created with indexes
- RLS policies active and tested
- Package scaffold ready for service development

### Week 2: Contact Service

#### Tasks

- [ ] **2.1 — Contact service CRUD**
  - Implement `createContact` — validate input, insert, emit audit event
  - Implement `getContact` — venture-scoped fetch, throw CONTACT_NOT_FOUND
  - Implement `updateContact` — partial update, custom field merging, emit audit
  - Implement `deleteContact` — soft referential integrity check, emit audit
  - Implement `listContacts` — pagination, filtering, sorting

- [ ] **2.2 — Contact search**
  - Implement `searchContacts` — prefix ILIKE on firstName, lastName, email, company
  - Limit to 10 results by default
  - Optimize for < 30ms response time

- [ ] **2.3 — Bulk operations**
  - Implement `bulkUpdateContacts` — iterate with error collection
  - Implement `bulkDeleteContacts` — batch delete with audit

- [ ] **2.4 — Zod schemas**
  - `createContactSchema`, `updateContactSchema`, `listContactsSchema`, `searchContactsSchema`
  - Email normalization (toLowerCase), string trimming, length limits

#### Deliverables
- Full contact CRUD with search, bulk operations
- Input validation via Zod
- Audit events for all mutations

### Week 3: Organization Service

#### Tasks

- [ ] **3.1 — Organization service CRUD**
  - Implement `createOrganization` — domain deduplication check, insert, audit
  - Implement `getOrganization`, `updateOrganization`, `deleteOrganization`
  - Implement `listOrganizations` with industry filtering
  - Implement `searchOrganizations` — prefix search on name, domain

- [ ] **3.2 — Organization relationships**
  - Implement `getOrganizationContacts` — join contacts where organizationId matches
  - Implement `getOrganizationDeals` — join deals where organizationId matches
  - Implement `getOrganizationRevenue` — aggregate deal values by status

- [ ] **3.3 — Industry utilities**
  - Implement `getIndustries` — SELECT DISTINCT industry with Redis caching
  - Implement `bulkDeleteOrganizations`

#### Deliverables
- Full organization management with domain deduplication
- Cross-entity relationship queries
- Revenue aggregation per organization

### Week 4: tRPC Routes & Client Hooks

#### Tasks

- [ ] **4.1 — tRPC router setup**
  - Create `/api/crm` router with contact and organization sub-routers
  - Integrate `permissionProcedure` middleware for all routes
  - Wire up venture context from session

- [ ] **4.2 — Client hooks**
  - `useContacts` — list, filter, paginate contacts
  - `useContact` — single contact with optimistic updates
  - Implement React Query patterns with cache invalidation

- [ ] **4.3 — Client components**
  - `ContactList` — paginated table with sort and filter controls
  - `ContactDetail` — profile view with linked entities

- [ ] **4.4 — Phase 1 testing**
  - Unit tests for contact and organization services
  - Integration tests for database operations
  - Permission tests (unauthorized access → 403)
  - RLS isolation tests (venture A cannot see venture B data)

#### Deliverables
- End-to-end contact and organization management
- React hooks and components for client UI
- Test coverage > 80% for Phase 1 code

---

## Phase 2 — Core

**Duration:** 5 weeks
**Goal:** Add deal pipeline management, activity tracking, pipeline configuration, smart views, and stage automation.

### Week 5: Pipeline & Deal Schema

#### Tasks

- [ ] **5.1 — Pipelines schema**
  - Create `server/schema/pipelines.ts`
  - Fields: id, ventureId, name, stages (JSONB), isDefault, timestamps
  - Create `server/schema/pipeline-stages-v2.ts` for enhanced stages
  - Fields: id, pipelineId, name, order, probability, rottingDays, requiredFields, automations

- [ ] **5.2 — Deals schema**
  - Create `server/schema/deals.ts`
  - Fields: id, ventureId, pipelineId, contactId, organizationId, name, value, currency, stage, probability, status, expectedCloseDate, actualCloseDate, lostReason, ownerId, timestamps
  - All 9 indexes including composites
  - Foreign keys to pipelines, contacts, organizations (with appropriate onDelete)

- [ ] **5.3 — Pipeline service**
  - Pipeline CRUD (create, update, delete, list)
  - Default pipeline management (only one default per venture)
  - Stage ordering and validation

#### Deliverables
- Pipeline and deal tables with migrations
- Pipeline configuration service

### Week 6: Deal Service

#### Tasks

- [ ] **6.1 — Deal CRUD**
  - `createDeal` — validate pipeline and stage, insert, audit
  - `getDeal`, `updateDeal`, `deleteDeal`
  - `listDeals` — with pipeline, status, owner, date filters
  - `searchDeals` — autocomplete on deal name

- [ ] **6.2 — Stage management**
  - `moveDealStage` — validate stage exists in pipeline, update, audit
  - V2 stage validation — check required fields before entry
  - `closeDeal` — set status (won/lost), actualCloseDate, lostReason
  - Auto-update probability from stage defaults

- [ ] **6.3 — Pipeline views**
  - `getDealsByStage` — GROUP BY stage with aggregates (Kanban view)
  - `getPipelineSummary` — total value, weighted value, deal count, stage breakdown
  - `getClosedSummary` — won/lost stats for date range, win rate, avg deal size

#### Deliverables
- Full deal lifecycle management
- Kanban-ready data structure
- Pipeline analytics

### Week 7: Activity Tracking

#### Tasks

- [ ] **7.1 — Activities schema**
  - Create `server/schema/activities.ts`
  - Fields: id, ventureId, subjectType, subjectId, activityType, title, description, metadata (JSONB), createdBy, createdAt
  - 6 indexes for feed, subject, type, venture queries

- [ ] **7.2 — Activity service**
  - `logActivity` — validate subject exists, store with metadata, audit
  - `getActivities` — feed for entity with type filtering, pagination
  - `getTimeline` — cursor-based chronological timeline (newest first)
  - Metadata validation per activity type (email fields, call fields, meeting fields, task fields)

- [ ] **7.3 — Stage automation engine**
  - Process `on_enter` triggers when deal moves to new stage
  - Process `on_exit` triggers when deal leaves old stage
  - Action handlers: create_task, update_field, notify
  - Placeholder for `send_email` (requires @mcv/connectors/email) and `webhook`

#### Deliverables
- Polymorphic activity logging with rich metadata
- Timeline and feed views
- Basic stage automation framework

### Week 8: Smart Views

#### Tasks

- [ ] **8.1 — Smart views schema**
  - Create `server/schema/smart-views.ts`
  - Fields: id, ventureId, name, objectType, filters, sortBy, columns, isDefault, isShared, ownerId, timestamps

- [ ] **8.2 — Smart view service**
  - `createSmartView`, `updateSmartView`, `deleteSmartView`, `getSmartView`, `listSmartViews`
  - `applySmartView` — dynamic query building from filter/sort/column config
  - `shareSmartView` — toggle personal vs shared
  - `duplicateSmartView` — clone with new name
  - Filter operator implementation (eq, neq, gt, gte, lt, lte, contains, in, between, is_null, is_not_null)

- [ ] **8.3 — Client components**
  - `SmartViewBuilder` — visual filter/sort/column configuration
  - `useSmartView` hook

#### Deliverables
- Saved, shareable view configurations
- Dynamic query execution from view definitions
- Visual view builder component

### Week 9: Deal/Activity Client & Phase 2 Testing

#### Tasks

- [ ] **9.1 — Deal client hooks & components**
  - `useDeals` — list, filter, paginate
  - `useDealPipeline` — Kanban view data
  - `DealKanban` — drag-and-drop Kanban board component
  - `PipelineView` — pipeline overview with stage metrics

- [ ] **9.2 — Activity client hooks & components**
  - `useActivities` — timeline data with cursor pagination
  - `ActivityTimeline` — chronological activity feed component

- [ ] **9.3 — tRPC route expansion**
  - Add deal, activity, and smart view routes to `/api/crm`
  - Permission checks on all new routes

- [ ] **9.4 — Phase 2 testing**
  - Deal lifecycle tests (create → stage moves → close)
  - Activity logging tests (each type with metadata)
  - Smart view filter tests (all operators)
  - Stage automation tests
  - Integration tests with Phase 1 entities

#### Deliverables
- Complete deal pipeline UI
- Activity timeline component
- Test coverage > 80% for Phase 2 code

---

## Phase 3 — Advanced

**Duration:** 6 weeks
**Goal:** Add AI-powered deal scoring, lead scoring engine, revenue forecasting, duplicate detection & merge, and custom objects.

### Week 10: AI Deal Scoring

#### Tasks

- [ ] **10.1 — Deal scores schema**
  - Create `server/schema/deal-scores.ts`
  - Fields: id, dealId, ventureId, score, confidence, factors, signals, predictedCloseDate, predictedAmount, winProbability, riskLevel, scoredAt, createdAt
  - Historical tracking (new row per score, not update)

- [ ] **10.2 — Scoring algorithm**
  - Implement 9-factor scoring engine:
    1. Stage Progression (20 pts) — position in pipeline
    2. Deal Velocity (15 pts) — age vs historical cycle time
    3. Activity Recency (15 pts) — days since last activity
    4. Activity Frequency (10 pts) — activities in last 30 days
    5. Meeting Engagement (10 pts) — meeting count
    6. Email Engagement (10 pts) — email count
    7. Deal Size (10 pts) — value vs pipeline average
    8. Stakeholder Involvement (5 pts) — unique participants
    9. Contact Engagement (5 pts) — linked contact's lead score
  - Parallel data gathering via `Promise.all` (10 queries)
  - Risk classification: 0-29 high, 30-59 medium, 60-100 low
  - Win probability sigmoid mapping: `100 / (1 + e^(-0.08 × (score - 50)))`

- [ ] **10.3 — Scoring service**
  - `scoreDeal` — single deal scoring with result persistence
  - `batchScoreDeals` — background scoring for all open deals
  - `getScoreHistory` — historical trend
  - `getScoringFactors` — detailed breakdown
  - `getAtRiskDeals` — low/declining score deals
  - `predictCloseDate` — historical data prediction

- [ ] **10.4 — Client integration**
  - `useDealScore` hook
  - `DealScoreCard` component — score visualization with factors and signals

#### Deliverables
- 9-factor AI deal scoring algorithm
- Score history tracking
- At-risk deal identification
- Close date prediction

### Week 11: Lead Scoring Engine

#### Tasks

- [ ] **11.1 — Lead scoring schema**
  - Create `server/schema/contact-scores.ts` — per-contact score with 3-category breakdown
  - Create `server/schema/lead-scoring-rules.ts` — configurable rules per venture
  - Unique constraint on contactId (one score record per contact)

- [ ] **11.2 — Rule engine**
  - `createScoringRule`, `updateScoringRule`, `deleteScoringRule`, `listScoringRules`
  - Three scoring categories: behavioral, demographic, firmographic
  - Condition evaluation engine (field resolution, operator matching, point accumulation)
  - Max score capping per rule
  - Score composition: totalScore = behavioral + demographic + firmographic

- [ ] **11.3 — Scoring execution**
  - `evaluateContact` — evaluate single contact against all active rules
  - `batchScoreContacts` — re-score all contacts in venture
  - `getScoreBreakdown` — detailed per-rule breakdown
  - Denormalize totalScore to `contact.leadScore` for fast queries

- [ ] **11.4 — Decay & analytics**
  - `applyDecay` — reduce scores for inactive contacts (configurable days + percentage)
  - `getLeaderboard` — top-scored contacts
  - `getScoreDistribution` — histogram buckets
  - `useLeadScoring` hook
  - `LeadScoreWidget` component

#### Deliverables
- Configurable 3-category lead scoring engine
- Score decay for inactive contacts
- Leaderboard and distribution analytics

### Week 12: Revenue Forecasting

#### Tasks

- [ ] **12.1 — Forecast schema**
  - Create `server/schema/forecasts.ts` — period-based forecast records
  - Create `server/schema/forecast-items.ts` — per-deal categorized items
  - Category thresholds: commit (≥90%), best_case (≥70%), pipeline (<70%), omitted

- [ ] **12.2 — Forecast service**
  - `createForecast` — create period, auto-populate with matching open deals
  - `updateForecastItem` — re-categorize or adjust amounts
  - `getForecastSummary` — category breakdown with computed totals
  - `getForecastVsActual` — accuracy comparison after period closes

- [ ] **12.3 — Advanced analytics**
  - `getForecastByOwner` — per-rep breakdown
  - `getForecastByPipeline` — per-pipeline breakdown
  - `getQuotaAttainment` — quota tracking with gap analysis
  - `getTrendAnalysis` — multi-period trends

- [ ] **12.4 — Client integration**
  - `useForecast` hook
  - `ForecastDashboard` component with chart visualizations

#### Deliverables
- Period-based revenue forecasting
- Quota attainment tracking
- Multi-period trend analysis
- Forecast dashboard component

### Week 13: Duplicate Detection & Merge

#### Tasks

- [ ] **13.1 — Duplicate schema**
  - Create `server/schema/duplicate-rules.ts` — configurable matching rules per object type
  - Create `server/schema/merge-history.ts` — full audit trail of all merges

- [ ] **13.2 — Detection engine**
  - Strategy 1: Exact email matching (98% confidence)
  - Strategy 2: Phone normalization matching (90% confidence)
  - Strategy 3: Fuzzy name matching — Levenshtein distance with ≥85% similarity threshold
  - Strategy 4: Domain matching for organizations (70% confidence)
  - Confidence scoring with reason aggregation
  - `findDuplicates` — pre-creation single-record check
  - `scanForDuplicates` — batch scan with group clustering

- [ ] **13.3 — Merge workflow**
  - `getMergePreview` — identify conflicts, auto-resolve non-conflicting fields
  - `mergeRecords` — execute with field-level control (survivor vs merged per field)
  - Re-link related records (deals, activities) from merged → survivor
  - Snapshot both records before merge (full data preservation)
  - Create merge_history entry with audit trail
  - `getMergeHistory` — review past merges

- [ ] **13.4 — Client integration**
  - `useDuplicates` hook
  - `DuplicateResolver` component — side-by-side comparison with conflict resolution

#### Deliverables
- Multi-strategy duplicate detection
- Merge workflow with field-level control
- Full merge audit trail
- Duplicate resolver UI component

### Week 14: Custom Objects

#### Tasks

- [ ] **14.1 — Custom object schema**
  - Create `server/schema/custom-objects.ts` — object definitions with field schemas
  - Create `server/schema/custom-object-records.ts` — data records with JSONB data
  - Create `server/schema/object-relationships.ts` — inter-object links
  - Unique constraint on venture_id + slug

- [ ] **14.2 — Custom object service**
  - `createCustomObject` — define entity with field schema, enforce limits (50 objects, 100 fields)
  - `updateCustomObject`, `deleteCustomObject` (cascade delete records)
  - `getCustomObject`, `listCustomObjects`
  - Dynamic field validation engine (type checking, required fields, options, ranges)

- [ ] **14.3 — Custom record CRUD**
  - `createCustomRecord` — validate data against object's field schema
  - `updateCustomRecord`, `deleteCustomRecord`
  - `listCustomRecords` — with pagination

- [ ] **14.4 — Relationships**
  - `createRelationship` — link any objects (contact↔custom, deal↔custom, custom↔custom)
  - `deleteRelationship`
  - `getRelatedRecords` — traverse relationships for an object

#### Deliverables
- User-defined CRM entities with dynamic field schemas
- Full CRUD for custom records with validation
- Inter-object relationship system

### Week 15: Phase 3 Integration & Testing

#### Tasks

- [ ] **15.1 — tRPC v2 routes**
  - Create `/api/crm-v2` router for all Phase 3 services
  - Deal scoring, lead scoring, forecast, duplicate, custom object routes
  - Permission checks on all routes

- [ ] **15.2 — Cron job setup**
  - Batch deal scoring: daily at 2 AM (`CRM_BATCH_SCORE_CRON`)
  - Lead score decay: weekly Monday 3 AM (`CRM_LEAD_DECAY_CRON`)
  - Duplicate scan: weekly Sunday 4 AM (`CRM_DUPLICATE_SCAN_CRON`)

- [ ] **15.3 — Cross-service integration**
  - Deal scoring uses contact.leadScore (cross-service data)
  - Forecast auto-populates from deal data
  - Scoring affects smart view sorting/filtering
  - Activities feed into scoring factors

- [ ] **15.4 — Phase 3 testing**
  - Deal scoring algorithm tests (all 9 factors, edge cases)
  - Lead scoring rule engine tests (all operators, all categories)
  - Forecast accuracy tests (populate, close deals, compare)
  - Duplicate detection tests (exact, fuzzy, phone, domain)
  - Merge tests (conflicts, re-linking, audit trail)
  - Custom object tests (schema validation, relationships)
  - Test coverage > 80% for Phase 3 code

#### Deliverables
- All Phase 3 services routed and accessible
- Cron jobs configured and tested
- Cross-service integration verified
- Comprehensive test suite

---

## Phase 4 — Polish & Publishable Readiness

**Duration:** 4 weeks
**Goal:** Prepare CRM for publishable status — performance tuning, standalone deployment, documentation, and production hardening.

### Week 16: Performance Optimization

#### Tasks

- [ ] **16.1 — Query optimization**
  - Profile all queries with `EXPLAIN ANALYZE`
  - Verify composite indexes are being used effectively
  - Optimize Kanban query (single GROUP BY, no N+1)
  - Optimize search queries (prefix ILIKE, result limiting)
  - Optimize scoring queries (parallel execution verified)

- [ ] **16.2 — Redis caching**
  - Implement score result caching (TTL: 1 hour)
  - Implement pipeline stages caching (TTL: 24 hours)
  - Implement industry list caching (TTL: 1 hour)
  - Implement smart view result caching (TTL: 5 minutes)
  - Cache invalidation on relevant mutations

- [ ] **16.3 — Latency verification**
  - Contact list: < 50ms (P50), < 150ms (P99)
  - Contact search: < 30ms (P50), < 80ms (P99)
  - Deal by stage: < 100ms (P50), < 300ms (P99)
  - Single deal score: < 200ms (P50), < 500ms (P99)
  - Smart view apply: < 80ms (P50), < 200ms (P99)

- [ ] **16.4 — Load testing**
  - Test with 100K contacts per venture
  - Test with 10K deals per venture
  - Test concurrent user scenarios (50+ simultaneous users)
  - Identify and resolve bottlenecks

#### Deliverables
- All latency targets met under load
- Caching layer operational
- Load test report with benchmarks

### Week 17: Standalone Deployment & Publishable Packaging

#### Tasks

- [ ] **17.1 — Dependency isolation**
  - Audit all imports — ensure no MCV.ONE-specific assumptions in core logic
  - Create clean interface boundaries for @mcv/kernel, @mcv/identity, @mcv/fabric
  - Document minimum kernel interface required for standalone deployment
  - Create adapter pattern for auth/identity (swappable for standalone)

- [ ] **17.2 — Standalone configuration**
  - Environment variable documentation (all CRM_* variables)
  - Default configuration for standalone deployment
  - Docker compose for standalone CRM (PostgreSQL + Redis + CRM app)
  - Migration script for fresh database setup

- [ ] **17.3 — API documentation**
  - OpenAPI/Swagger spec generation from tRPC routes (if applicable)
  - API usage guide with curl examples
  - Webhook configuration for stage automations

- [ ] **17.4 — npm package preparation**
  - Clean barrel exports in `index.ts`
  - Type-only exports verified
  - No runtime dependencies on MCV-internal packages beyond the defined interfaces
  - Package metadata (description, keywords, license)

#### Deliverables
- Standalone-deployable CRM package
- Docker compose for self-hosted deployment
- Clean dependency boundaries

### Week 18: Production Hardening

#### Tasks

- [ ] **18.1 — Error handling audit**
  - Verify all service methods throw appropriate error codes
  - Verify all error codes documented in 03-API-REFERENCE.md are implemented
  - Add retry logic for transient database failures
  - Add circuit breaker for external dependencies (Redis, Redpanda)

- [ ] **18.2 — Security audit**
  - RLS policy review — verify no data leakage paths
  - Permission matrix review — verify all routes have correct checks
  - Input validation audit — verify all user inputs pass through Zod
  - SQL injection review — verify all queries use parameterized inputs
  - JSONB injection review — verify custom fields are properly sanitized

- [ ] **18.3 — Observability**
  - Structured logging for all service operations
  - Metric collection (contact count, deal count, scoring operations, error rates)
  - Health check endpoint implementation
  - Alerting rule definitions

- [ ] **18.4 — Data migration tooling**
  - CSV import for contacts (bulk creation with duplicate checking)
  - CSV import for organizations
  - CSV export for contacts, deals, organizations
  - Data migration guide for moving from other CRMs

#### Deliverables
- Production-hardened error handling and retries
- Security audit completed with findings addressed
- Observability stack operational
- Import/export tooling

### Week 19: Documentation & Release

#### Tasks

- [ ] **19.1 — Documentation finalization**
  - Verify 01-PACKAGE-SPEC.md is accurate and complete
  - Verify 02-TECHNICAL-ARCHITECTURE.md reflects implementation
  - Verify 03-API-REFERENCE.md covers all endpoints
  - Update this implementation plan (04-IMPLEMENTATION-PLAN.md) with final status
  - Create README.md for the package root

- [ ] **19.2 — Integration testing**
  - End-to-end test: contact → lead score → deal → pipeline → close → forecast
  - Cross-venture isolation test (comprehensive)
  - Concurrent user test (50+ users, mixed operations)
  - Cron job reliability test (scoring, decay, duplicate scan)

- [ ] **19.3 — Release checklist**
  - All tests passing (> 80% coverage)
  - All latency targets met
  - Security audit clean
  - Documentation complete
  - Standalone deployment verified
  - Cron jobs configured
  - Monitoring and alerting active

- [ ] **19.4 — Handoff**
  - Knowledge transfer session for operations team
  - Runbook for common issues (scoring failures, RLS policy updates, migration procedures)
  - On-call rotation for CRM domain

#### Deliverables
- Complete, accurate documentation
- All tests passing with coverage targets met
- Release-ready CRM domain module

---

## Testing Strategy

### Testing Pyramid

```
                    ┌───────────┐
                    │   E2E     │  5-10 tests
                    │  Tests    │  Full user flows
                    ├───────────┤
                    │Integration│  30-50 tests
                    │  Tests    │  DB operations, cross-service
                    ├───────────┤
                    │   Unit    │  100-200 tests
                    │  Tests    │  Service logic, scoring, validation
                    └───────────┘
```

### Unit Tests

| Area | Test Focus | Count |
|---|---|---|
| Contact service | CRUD logic, lifecycle validation, custom field merging | 15-20 |
| Organization service | CRUD, domain dedup, revenue aggregation | 10-15 |
| Deal service | CRUD, stage validation, closure logic, Kanban grouping | 15-20 |
| Activity service | Logging, metadata validation, timeline ordering | 10-15 |
| Deal scoring | All 9 factors individually, sigmoid mapping, risk classification | 20-30 |
| Lead scoring | Rule evaluation, category scoring, decay logic | 15-20 |
| Forecast | Auto-population, category thresholds, accuracy computation | 10-15 |
| Duplicate detection | Exact match, fuzzy match, phone normalization, confidence | 15-20 |
| Custom objects | Schema validation, field type checking, relationship creation | 10-15 |
| Smart views | Filter operators, dynamic query building | 10-15 |
| **Total** | | **130-185** |

### Integration Tests

| Area | Test Focus | Count |
|---|---|---|
| Database operations | Insert, update, delete with real DB, index usage | 10-15 |
| RLS isolation | Venture A cannot read venture B data | 5-10 |
| Cross-service | Scoring reads activities, forecasts read deals | 5-10 |
| Bulk operations | Bulk update/delete with partial failure | 5 |
| Merge workflow | End-to-end merge with re-linking | 5 |
| **Total** | | **30-45** |

### End-to-End Tests

| Flow | Steps |
|---|---|
| Contact lifecycle | Create contact → score lead → qualify → create deal → close won |
| Pipeline flow | Create pipeline → add deals → move stages → close → forecast |
| Duplicate resolution | Create duplicates → detect → preview merge → merge → verify |
| Smart view workflow | Create view → apply filters → share → duplicate → delete |
| Custom object workflow | Define object → create records → link relationships → query |

### Test Configuration

```typescript
// vitest.config.ts
export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    setupFiles: ['./test/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      thresholds: {
        global: {
          branches: 75,
          functions: 80,
          lines: 80,
          statements: 80,
        },
      },
    },
  },
});
```

---

## Acceptance Criteria

### Phase 1 Acceptance

| Criterion | Verification |
|---|---|
| Contacts CRUD functional | Create, read, update, delete contact via API |
| Organizations CRUD functional | Create, read, update, delete organization via API |
| Multi-tenancy enforced | Venture A data invisible to venture B (DB + API) |
| Search works | Autocomplete returns results in < 80ms |
| Bulk operations work | Bulk update/delete with partial failure handling |
| Client hooks functional | useContacts, useContact render data correctly |
| Tests pass | > 80% coverage for Phase 1 code |

### Phase 2 Acceptance

| Criterion | Verification |
|---|---|
| Deal pipeline management | Create pipeline → add deal → move stages → close |
| Kanban view functional | getDealsByStage returns grouped data correctly |
| Activity logging works | Log all 5 types with metadata, view timeline |
| Smart views work | Create view with filters → apply → get filtered results |
| Stage automation fires | Moving deal to new stage triggers configured actions |
| Pipeline analytics correct | Summary, closed summary, win rate calculations verified |
| Tests pass | > 80% coverage for Phase 2 code |

### Phase 3 Acceptance

| Criterion | Verification |
|---|---|
| Deal scoring accurate | Score 100 deals, verify factor calculations against manual check |
| Risk classification correct | High/medium/low correctly assigned based on score ranges |
| Lead scoring configurable | Create rules, evaluate contacts, verify score composition |
| Score decay works | Inactive contacts lose points after configured period |
| Forecast auto-populates | Creating forecast imports matching deals with correct categories |
| Forecast accuracy calculated | Close period, verify accuracy = closedWon / forecast × 100 |
| Duplicates detected | Email, name, phone, domain matching with correct confidence |
| Merge preserves data | Merged record's deals and activities linked to survivor |
| Custom objects extensible | Create object, add records, validate against schema |
| Cron jobs run reliably | Batch scoring, decay, duplicate scan complete without errors |
| Tests pass | > 80% coverage for Phase 3 code |

### Phase 4 Acceptance (Publishable Readiness)

| Criterion | Verification |
|---|---|
| Latency targets met | All operations within P50 and P99 targets under load |
| Standalone deployment works | CRM starts and operates without MCV.ONE-specific services |
| Security audit clean | No RLS gaps, no injection vectors, all inputs validated |
| Documentation complete | All 4 docs accurate and comprehensive |
| Import/export functional | CSV import contacts, CSV export all entity types |
| Monitoring active | Health checks, metrics, alerts configured |
| 100K contact scale | System performs within targets at enterprise scale |

---

## Risks & Mitigations

### Technical Risks

| Risk | Probability | Impact | Mitigation |
|---|---|---|---|
| **Deal scoring too slow** — Parallel queries may hit connection pool limits under batch load | Medium | High | Implement batch connection management; score in configurable batch sizes (default 100); add Redis caching for score results |
| **Fuzzy matching expensive** — Levenshtein distance computation on large datasets may exceed latency targets | Medium | Medium | Cap duplicate scan at 2000 records; use pre-filters (first letter, domain) before fuzzy matching; consider pg_trgm extension for database-level similarity |
| **JSONB query performance** — Custom fields and metadata stored as JSONB may not index efficiently for complex queries | Low | Medium | Add GIN indexes on frequently-queried JSONB paths; document query limitations; consider materialized columns for most-used custom fields |
| **RLS policy gaps** — Complex queries (joins, aggregations) may bypass RLS in unexpected ways | Low | Critical | Comprehensive RLS testing in every phase; use `current_setting('app.current_venture_id')` consistently; security audit in Phase 4 |
| **Smart view query injection** — Dynamic query building from user-defined filters could introduce SQL injection | Low | Critical | All filter values parameterized via Drizzle ORM (never string concatenation); operator whitelist (enum); field whitelist per object type |

### Product Risks

| Risk | Probability | Impact | Mitigation |
|---|---|---|---|
| **Feature creep** — CRM is a broad domain; scope could expand beyond timeline | High | High | Strict phase boundaries; features not in plan go to backlog; no custom development during phases |
| **Publishable complexity** — Making the CRM truly standalone may require significant abstraction work | Medium | Medium | Design clean interfaces from Phase 1; use adapter pattern for auth and storage; test standalone deployment in Phase 4 |
| **Cross-venture data model conflicts** — Different ventures may want different pipeline configurations, custom fields, or scoring rules | Low | Medium | All configuration is venture-scoped; no shared configuration between ventures; document limits clearly |

### Operational Risks

| Risk | Probability | Impact | Mitigation |
|---|---|---|---|
| **Cron job failures** — Batch scoring or decay jobs may fail silently | Medium | Medium | Job monitoring with alerting; retry logic; admin visibility into last run timestamps via health check |
| **Data migration complexity** — Importing data from external CRMs may be error-prone | Medium | Low | Phase 4 includes import tooling with validation; duplicate detection runs on import; rollback capability |
| **Scale surprises** — Enterprise ventures with 1M+ contacts may exceed expected load patterns | Low | High | Load test with enterprise-scale data in Phase 4; document scale limits; plan for table partitioning if needed |

---

## Timeline

### Gantt Chart (Summary)

```
Week  1  2  3  4  5  6  7  8  9 10 11 12 13 14 15 16 17 18 19
      ├──Phase 1──┤  ├─────Phase 2──────┤  ├──────Phase 3──────┤  ├──Phase 4──┤
      │           │  │                   │  │                    │  │           │
W1    ████ Schema/infra                                                        
W2       ████ Contact service                                                  
W3          ████ Org service                                                   
W4             ████ Routes/hooks/tests                                         
W5                ████ Pipeline/deal schema                                    
W6                   ████ Deal service                                         
W7                      ████ Activities                                        
W8                         ████ Smart views                                    
W9                            ████ Client/tests                               
W10                              ████ Deal scoring                             
W11                                 ████ Lead scoring                          
W12                                    ████ Forecasting                        
W13                                       ████ Duplicate detect                
W14                                          ████ Custom objects               
W15                                             ████ Integration               
W16                                                ████ Perf tuning            
W17                                                   ████ Standalone          
W18                                                      ████ Hardening        
W19                                                         ████ Release       
```

### Milestone Summary

| Milestone | Week | Deliverable |
|---|---|---|
| **M1: Contact Manager** | Week 4 | Full contact/org CRUD with search, multi-tenancy, and UI |
| **M2: Sales Pipeline** | Week 9 | Deal management, Kanban view, activities, smart views |
| **M3: AI-Powered CRM** | Week 15 | Deal scoring, lead scoring, forecasting, duplicates, custom objects |
| **M4: Publishable Release** | Week 19 | Production-ready, standalone-deployable CRM domain module |

### Resource Requirements

| Role | Allocation | Phases |
|---|---|---|
| Backend engineer (senior) | Full-time | All phases |
| Backend engineer | Full-time | Phases 2-3 |
| Frontend engineer | Half-time | Phases 1-2 (hooks/components), full-time Phase 4 |
| DevOps engineer | Quarter-time | Phase 1 (infra), Phase 4 (deployment) |
| QA engineer | Half-time | Phases 1-4 (testing) |

### Dependencies Between Phases

```
Phase 1 ──► Phase 2 ──► Phase 3 ──► Phase 4
   │             │            │
   │             │            ├── Deal scoring depends on:
   │             │            │   • Deals (Phase 2)
   │             │            │   • Activities (Phase 2)
   │             │            │   • Contact scores (Phase 3, week 11)
   │             │            │
   │             │            ├── Forecasting depends on:
   │             │            │   • Deals (Phase 2)
   │             │            │   • Pipelines (Phase 2)
   │             │            │
   │             │            └── Duplicate detection depends on:
   │             │                • Contacts (Phase 1)
   │             │                • Organizations (Phase 1)
   │             │
   │             ├── Deals depend on:
   │             │   • Contacts (Phase 1)
   │             │   • Organizations (Phase 1)
   │             │
   │             └── Activities depend on:
   │                 • Contacts (Phase 1)
   │                 • Deals (Phase 2, week 5-6)
   │
   └── Foundation: contacts, organizations, multi-tenancy
```

---

*@mcv/crm — Customer Relationship Management Domain*
