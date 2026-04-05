# @mcv/portfolio — Implementation Plan

> **Package:** `@mcv/portfolio`
> **Classification:** MCV-ONLY
> **Tier:** 5 — Domain Layer
> **Version:** 1.0.0
> **Last Updated:** February 9, 2026

---

## Table of Contents

1. [Overview & Goals](#overview--goals)
2. [Prerequisites](#prerequisites)
3. [Phase 1 — Foundation](#phase-1--foundation)
4. [Phase 2 — Core Features](#phase-2--core-features)
5. [Phase 3 — Advanced Features](#phase-3--advanced-features)
6. [Phase 4 — Polish & Hardening](#phase-4--polish--hardening)
7. [Testing Strategy](#testing-strategy)
8. [Acceptance Criteria](#acceptance-criteria)
9. [Risks & Mitigations](#risks--mitigations)
10. [Timeline](#timeline)

---

## Overview & Goals

### Purpose

This document defines the phased implementation plan for the `@mcv/portfolio` package — the consortium-level domain layer that manages MCV's 9 ventures, their legal entities, grant funding, and strategic direction.

### Goals

1. **Establish the venture registry** — Provide the canonical source of truth for all MCV ventures with lifecycle state management, configuration, and tenant integration.
2. **Formalize corporate structure** — Track all legal entities, ownership hierarchies, compliance obligations, and corporate documents in a single auditable system.
3. **Systematize grant management** — Replace ad-hoc spreadsheet tracking with a full-lifecycle grant management system supporting milestones, disbursements, budgets, and compliance reporting.
4. **Enable strategic oversight** — Give consortium leadership a data-driven strategic planning layer with OKRs, venture scoring, competitive intelligence, and portfolio dashboards.
5. **Aggregate cross-venture insights** — Provide consolidated views of portfolio health, resource allocation, and performance trends across all ventures.

### Success Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| All 9 ventures registered with health monitoring | 100% | Venture count in system |
| Legal entities mapped with compliance tracking | 100% of known entities | Entity count vs known list |
| Grant pipeline migrated from spreadsheets | 100% | Grant count in system |
| OKR system adopted by venture leads | ≥7 of 9 ventures | Active objectives per venture |
| Health snapshot automation | Every 6 hours | Cron execution logs |
| API p95 latency | < 500ms for all endpoints | Performance monitoring |
| Test coverage | ≥ 80% | Vitest coverage report |

---

## Prerequisites

### Required Infrastructure

Before implementation begins, the following infrastructure must be in place:

| Prerequisite | Package / Service | Status | Notes |
|-------------|-------------------|--------|-------|
| PostgreSQL database | Supabase | ✅ Ready | Production instance available |
| Database migration tooling | Drizzle Kit | ✅ Ready | Configured in monorepo |
| Redis cache | Redis 7+ | ✅ Ready | Upstash or self-hosted |
| Event bus | Redpanda | ✅ Ready | `portfolio.events` topic pre-created |
| Kernel utilities | `@mcv/kernel` | ✅ Ready | DB connection, config, DI |
| Identity service | `@mcv/identity` | ✅ Ready | `createTenant()` API available |
| Fabric service | `@mcv/fabric` | ✅ Ready | `emitEvent()`, audit logging |
| Finance service | `@mcv/finance` | ⚠️ Partial | Revenue data API needed for health snapshots |
| Notification service | `@mcv/notifications` | ⚠️ Partial | Email/push delivery needed for deadline alerts |
| Document storage | Supabase Storage | ✅ Ready | `portfolio-documents` bucket created |
| Monorepo tooling | Turborepo | ✅ Ready | Package scaffolding available |

### Required Knowledge

- Drizzle ORM schema definitions and migrations
- Zod validation patterns used across MCV packages
- Supabase RLS policy design
- Redpanda/Kafka event production patterns
- MCV monorepo conventions (package structure, testing, naming)

### Data Collection (Pre-Phase 1)

Before Phase 1 begins, collect the following from existing records:

| Data | Source | Owner | Status |
|------|--------|-------|--------|
| List of all 9 ventures with metadata | Founding docs, spreadsheets | CEO | ☐ Pending |
| Legal entity registry | Legal counsel, formation documents | Legal | ☐ Pending |
| Corporate hierarchy / ownership percentages | Operating agreements | Legal | ☐ Pending |
| Active grant list with statuses | Grant spreadsheets, Full Gain | Grants Team | ☐ Pending |
| Current KPI definitions per venture | Venture leads | Product | ☐ Pending |
| Existing OKRs / strategic objectives | Planning docs | CEO / Strategy | ☐ Pending |
| Compliance calendar / deadlines | Legal, Admin | Legal | ☐ Pending |

---

## Phase 1 — Foundation

**Duration:** 2 weeks
**Goal:** Package scaffolding, database schema, core infrastructure, basic CRUD for all 4 submodules.

### Week 1: Package Setup & Schema

#### 1.1 Package Scaffolding

- [ ] Create `packages/portfolio/` directory structure:
  ```
  packages/portfolio/
  ├── src/
  │   ├── index.ts
  │   ├── config.ts
  │   ├── constants.ts
  │   ├── types.ts
  │   ├── errors.ts
  │   ├── ventures/
  │   │   ├── schema.ts
  │   │   ├── service.ts
  │   │   ├── validators.ts
  │   │   └── lifecycle.ts
  │   ├── entities/
  │   │   ├── schema.ts
  │   │   ├── service.ts
  │   │   ├── validators.ts
  │   │   └── hierarchy.ts
  │   ├── grants/
  │   │   ├── schema.ts
  │   │   ├── service.ts
  │   │   ├── validators.ts
  │   │   └── lifecycle.ts
  │   ├── strategy/
  │   │   ├── schema.ts
  │   │   ├── service.ts
  │   │   ├── validators.ts
  │   │   └── scoring.ts
  │   ├── aggregation/
  │   │   ├── service.ts
  │   │   └── queries.ts
  │   └── client/
  │       ├── hooks/
  │       └── components/
  ├── __tests__/
  ├── package.json
  ├── tsconfig.json
  ├── drizzle.config.ts
  └── vitest.config.ts
  ```
- [ ] Configure `package.json` with workspace dependencies
- [ ] Configure `tsconfig.json` extending monorepo base
- [ ] Configure `vitest.config.ts`
- [ ] Configure `drizzle.config.ts` for schema generation

#### 1.2 Shared Infrastructure

- [ ] Implement `errors.ts` — `PortfolioError` class with all error codes
- [ ] Implement `types.ts` — All shared type definitions and enums
- [ ] Implement `constants.ts` — Status arrays, default KPI definitions, tier thresholds
- [ ] Implement `config.ts` — `portfolioConfigSchema` Zod schema for package configuration
- [ ] Implement `index.ts` — Re-export entry point for all public API

#### 1.3 Database Schema (All 39 Tables)

- [ ] **Ventures schema** (`ventures/schema.ts`) — 9 tables:
  - `portfolio_ventures`
  - `portfolio_venture_configs`
  - `portfolio_venture_health_snapshots`
  - `portfolio_venture_kpis`
  - `portfolio_venture_kpi_records`
  - `portfolio_venture_team_assignments`
  - `portfolio_venture_tech_stacks`
  - `portfolio_venture_deployments`
  - `portfolio_venture_milestones`

- [ ] **Entities schema** (`entities/schema.ts`) — 8 tables:
  - `portfolio_legal_entities`
  - `portfolio_entity_hierarchies`
  - `portfolio_ownership_structures`
  - `portfolio_registered_agents`
  - `portfolio_corporate_documents`
  - `portfolio_entity_compliance_records`
  - `portfolio_entity_officers`
  - `portfolio_entity_jurisdictions`

- [ ] **Grants schema** (`grants/schema.ts`) — 10 tables:
  - `portfolio_grants`
  - `portfolio_grant_applications`
  - `portfolio_grant_milestones`
  - `portfolio_grant_disbursements`
  - `portfolio_grant_compliance_reports`
  - `portfolio_grant_budgets`
  - `portfolio_grant_budget_lines`
  - `portfolio_grant_deadlines`
  - `portfolio_grant_documents`
  - `portfolio_grant_contacts`

- [ ] **Strategy schema** (`strategy/schema.ts`) — 12+ tables:
  - `portfolio_strategic_objectives`
  - `portfolio_key_results`
  - `portfolio_key_result_checkins`
  - `portfolio_competitive_analyses`
  - `portfolio_competitor_profiles`
  - `portfolio_market_sizings`
  - `portfolio_venture_scorecards`
  - `portfolio_scorecard_criteria`
  - `portfolio_investment_theses`
  - `portfolio_pivot_decisions`
  - `portfolio_strategic_initiatives`
  - `portfolio_dashboards`
  - `portfolio_dashboard_widgets`

- [ ] Generate and apply database migration
- [ ] Create all database indexes (see Technical Architecture doc)
- [ ] Verify schema in Supabase dashboard

### Week 2: Validators, Basic Services & RLS

#### 1.4 Zod Validators

- [ ] `ventures/validators.ts` — `createVentureSchema`, `updateVentureSchema`, `healthSnapshotSchema`, `kpiDefinitionSchema`, `teamAssignmentSchema`, `deploymentConfigSchema`, `milestoneInputSchema`
- [ ] `entities/validators.ts` — `createEntitySchema`, `updateEntitySchema`, `hierarchyInputSchema`, `ownershipInputSchema`, `officerInputSchema`, `documentInputSchema`, `complianceCheckSchema`
- [ ] `grants/validators.ts` — `createGrantSchema`, `grantApplicationSchema`, `grantMilestoneSchema`, `disbursementInputSchema`, `complianceReportSchema`, `grantBudgetSchema`, `deadlineInputSchema`
- [ ] `strategy/validators.ts` — `createObjectiveSchema`, `createKeyResultSchema`, `checkinSchema`, `competitiveAnalysisSchema`, `marketSizingSchema`, `scorecardInputSchema`, `thesisInputSchema`, `pivotInputSchema`, `dashboardInputSchema`, `widgetInputSchema`

#### 1.5 Basic Service Classes (CRUD Only)

- [ ] `VentureService` — `createVenture`, `updateVenture`, `getVenture`, `getVentureBySlug`, `listVentures`, `deleteVenture`
- [ ] `EntityService` — `createEntity`, `updateEntity`, `getEntity`, `listEntities`, `dissolveEntity`
- [ ] `GrantService` — `createGrant`, `updateGrant`, `getGrant`, `listGrants`
- [ ] `StrategyService` — `createObjective`, `updateObjective`, `getObjective`, `listObjectives`, `createKeyResult`, `getKeyResults`

#### 1.6 RLS Policies

- [ ] Create RLS policies for all 39 tables following the security architecture:
  - Super admin / portfolio admin: full access to all tables
  - Venture admin: CRUD on assigned venture data
  - Venture lead: read/update on assigned venture data
  - Team member: read-only on assigned venture data
- [ ] Create `portfolio_has_access()` PostgreSQL helper function
- [ ] Test RLS policies with different user roles

#### 1.7 Foundation Tests

- [ ] Unit tests for all Zod validators
- [ ] Integration tests for CRUD operations (ventures, entities, grants, objectives)
- [ ] RLS policy tests (verify isolation between roles)

**Phase 1 Deliverable:** Package compiles, all schemas deployed, basic CRUD works for all 4 submodules, RLS enforced.

---

## Phase 2 — Core Features

**Duration:** 4 weeks
**Goal:** Full lifecycle management, health monitoring, KPI tracking, grant pipeline, OKR engine, entity hierarchy.

### Week 3-4: Venture Lifecycle & Health

#### 2.1 Venture Lifecycle Engine

- [ ] Implement `ventures/lifecycle.ts` — state machine definition with `VENTURE_TRANSITIONS` map
- [ ] Implement `validateTransition()` guard function
- [ ] Implement `approveVenture()` — Includes `@mcv/identity` tenant creation
- [ ] Implement `launchVenture()` — Set `launchedAt`, create default KPIs, schedule health checks
- [ ] Implement `scaleVenture()`, `hibernateVenture()`, `reactivateVenture()`
- [ ] Implement `sunsetVenture()` — Notify stakeholders, freeze new grants
- [ ] Implement `archiveVenture()` — Cascade deactivation of team, deployments, KPIs
- [ ] Wire up `@mcv/fabric` event emission for all transitions
- [ ] Write transition validation tests (valid and invalid paths)

#### 2.2 Health Monitoring

- [ ] Implement `recordHealthSnapshot()` with composite score calculation
- [ ] Implement weighted health score algorithm (financial 30%, product 25%, team 20%, market 15%, compliance 10%)
- [ ] Implement `getLatestHealth()`, `getHealthHistory()`, `getHealthHeatmap()`
- [ ] Implement health alert detection (critical dimensions trigger alerts)
- [ ] Create `portfolio.health_snapshot` cron job (every 6 hours)
- [ ] Wire up health data from `@mcv/finance` for automated snapshots
- [ ] Redis caching for health heatmap (10 min TTL)

#### 2.3 KPI Tracking

- [ ] Implement `createKpi()` with global KPI support
- [ ] Implement `recordKpi()` with auto-status calculation (exceeded/on_track/at_risk/off_track)
- [ ] Implement auto-calculated fields: `changePercent`, `targetAttainment`
- [ ] Implement `getKpiDashboard()`, `getKpiTrends()`
- [ ] Create `portfolio.kpi_refresh` cron job (daily)
- [ ] Wire up external KPI sources (Stripe for MRR, analytics for users)

#### 2.4 Team Management

- [ ] Implement `assignTeamMember()` with cross-venture allocation validation (≤100%)
- [ ] Implement `removeTeamMember()`, `updateAllocation()`, `getTeamRoster()`
- [ ] Implement `getPersonAllocations()` for cross-venture view
- [ ] Write allocation validation tests (boundary cases)

#### 2.5 Venture Configuration

- [ ] Implement `getConfig()`, `updateConfig()`, `toggleFeature()`, `setMaintenanceMode()`
- [ ] Wire up configuration change events

### Week 5: Entity Hierarchy & Compliance

#### 2.6 Entity Hierarchy

- [ ] Implement `entities/hierarchy.ts` — Recursive CTE for tree traversal
- [ ] Implement circular reference detection with DFS
- [ ] Implement `addChildEntity()` with circular check
- [ ] Implement `removeChildEntity()`
- [ ] Implement `getEntityTree()`, `getFullHierarchy()`
- [ ] Write hierarchy tests (valid trees, circular detection)

#### 2.7 Ownership & Officers

- [ ] Implement `recordOwnership()` with total ≤100% validation
- [ ] Implement `getOwnershipTable()`, `getCapTable()`
- [ ] Implement `appointOfficer()`, `removeOfficer()`, `getOfficers()`, `getSignatories()`
- [ ] Implement EIN encryption/decryption using AES-256-GCM
- [ ] Implement officer compensation encryption

#### 2.8 Compliance Tracking

- [ ] Implement `recordComplianceCheck()` with auto-created next due dates
- [ ] Implement `getComplianceStatus()`, `getComplianceMatrix()`, `getUpcomingDeadlines()`
- [ ] Implement auto-compliance record creation on new jurisdiction registration
- [ ] Create `portfolio.compliance_check` cron job (weekly)
- [ ] Wire up compliance alerts to `@mcv/notifications`

#### 2.9 Corporate Document Vault

- [ ] Implement `uploadDocument()` with Supabase Storage integration
- [ ] Implement document versioning (linking via `previousVersionId`)
- [ ] Implement access level enforcement
- [ ] Implement `getDocuments()`, `getDocumentVersionHistory()`

### Week 6: Grant Management

#### 2.10 Grant Lifecycle

- [ ] Implement `grants/lifecycle.ts` — grant state machine
- [ ] Implement all lifecycle transition methods: `qualifyGrant`, `applyForGrant`, `recordAward`, `recordDecline`, `withdrawApplication`, `activateGrant`, `holdGrant`, `resumeGrant`, `completeGrant`, `terminateGrant`, `closeGrant`
- [ ] Implement auto-deadline creation on grant activation
- [ ] Wire up `@mcv/fabric` events for all transitions

#### 2.11 Grant Milestones & Disbursements

- [ ] Implement `createMilestone()`, `updateMilestoneStatus()`, `verifyMilestone()`
- [ ] Implement auto-disbursement creation on funding-trigger milestone verification
- [ ] Implement `requestDisbursement()` with award amount validation
- [ ] Implement `approveDisbursement()`, `recordReceipt()`
- [ ] Implement `getDisbursementSummary()` with remaining amount sync
- [ ] Wire up `@mcv/treasury` integration for disbursement routing

#### 2.12 Grant Budget Management

- [ ] Implement `createGrantBudget()` with line items
- [ ] Implement `recordExpenditure()` with auto-recalculation and over-budget warnings
- [ ] Implement `getBudgetVsActual()`, `getBurnRate()`

#### 2.13 Grant Compliance & Deadlines

- [ ] Implement compliance report CRUD: `createComplianceReport()`, `submitComplianceReport()`, `getComplianceReports()`
- [ ] Implement deadline management: `createDeadline()`, `completeDeadline()`, `getUpcomingDeadlines()`, `getOverdueDeadlines()`
- [ ] Create `portfolio.grant_deadlines` cron job (daily)
- [ ] Create `portfolio.grant_overdue_check` cron job (daily)
- [ ] Wire up deadline reminders to `@mcv/notifications`

#### 2.14 Grant Analytics

- [ ] Implement `getGrantPipeline()` — grouped by status
- [ ] Implement `getFundingForecast()` — projected future funding
- [ ] Implement `getGrantsByVenture()` — per-venture breakdown

### Week 6 (cont.): Strategy — OKR Engine

#### 2.15 OKR Management

- [ ] Implement full OKR CRUD: objectives and key results
- [ ] Implement `checkinKeyResult()` with auto-progress calculation (linear, binary, threshold)
- [ ] Implement `recalculateObjectiveProgress()` — weighted average of KR progress
- [ ] Implement cascading OKR recalculation (child → parent via `parentObjectiveId`)
- [ ] Implement `getOkrTree()` with recursive loading
- [ ] Implement `getOkrProgress()` for detailed reports

#### 2.16 Venture Scoring

- [ ] Implement `scoreVenture()` with weighted 5-dimension scoring
- [ ] Implement `reRankVentures()` — auto-ranking on scorecard submission
- [ ] Implement tier assignment (A: 80-100, B: 60-79, C: 40-59, D: 0-39)
- [ ] Implement `getVentureRankings()`, `getScorecardTrends()`
- [ ] Implement `createScoringCriteria()`, `updateScoringCriteria()`

**Phase 2 Deliverable:** All core business logic works end-to-end. Lifecycle management, health monitoring, KPI tracking, entity hierarchy, grant pipeline, OKR engine, and venture scoring all functional with cron jobs and event emission.

---

## Phase 3 — Advanced Features

**Duration:** 3 weeks
**Goal:** AI portfolio insights, cross-venture analytics, automated reporting, competitive intelligence, dashboards.

### Week 7: Cross-Venture Aggregation

#### 3.1 Aggregation Service

- [ ] Implement `PortfolioAggregationService`
- [ ] Implement `getPortfolioSummary()` — consolidated portfolio metrics
- [ ] Implement `compareVentures()` — side-by-side venture comparison
- [ ] Implement `getPortfolioHealthReport()` — health heatmap with trends
- [ ] Implement `getAllocationAnalysis()` — team/budget/infra allocation
- [ ] Implement `getConsolidatedMetrics()` — unified KPI view

#### 3.2 Materialized Views

- [ ] Create `mv_portfolio_summary` materialized view
- [ ] Create `mv_venture_health_latest` materialized view with unique index
- [ ] Create `mv_grant_pipeline_summary` materialized view
- [ ] Create `mv_consolidated_kpis` materialized view
- [ ] Create refresh function and wire to `portfolio.dashboard_cache_refresh` cron (every 5 minutes)

#### 3.3 Competitive Intelligence

- [ ] Implement `createAnalysis()`, `updateAnalysis()`, `getLatestAnalysis()`
- [ ] Implement `addCompetitor()`, `updateCompetitor()`, `getCompetitorMatrix()`
- [ ] Implement SWOT analysis structure with market positioning
- [ ] Create `portfolio.competitive_freshness` cron (weekly) — flag stale analyses >90 days

#### 3.4 Market Sizing

- [ ] Implement `createMarketSizing()` with TAM/SAM/SOM
- [ ] Implement `compareMarketSizings()` — cross-venture comparison
- [ ] Support top-down, bottom-up, and value-theory methodologies

### Week 8: Strategic Tools & Dashboards

#### 3.5 Investment Theses

- [ ] Implement `createThesis()`, `updateThesis()`
- [ ] Implement `validateThesis()` with evidence tracking
- [ ] Implement `invalidateThesis()` with reason and strategic review trigger
- [ ] Implement `getTheses()`, `getActiveTheses()`

#### 3.6 Pivot Decision Tracking

- [ ] Implement `recordPivot()` with before/after metrics capture
- [ ] Implement `updatePivotOutcome()` — record result after implementation
- [ ] Implement `getPivotHistory()` — per-venture pivot log
- [ ] Implement `getPivotAnalysis()` — portfolio-level success rate analysis

#### 3.7 Strategic Initiatives

- [ ] Implement `createInitiative()`, `updateInitiative()`, `updateInitiativeProgress()`
- [ ] Implement budget tracking (allocated vs spent)
- [ ] Link initiatives to objectives via `objectiveId`

#### 3.8 Portfolio Dashboards

- [ ] Implement `createDashboard()`, `updateDashboard()`, `getDashboard()`, `getDefaultDashboard()`
- [ ] Implement `addWidget()`, `updateWidget()`, `removeWidget()`, `reorderWidgets()`
- [ ] Implement `refreshWidgetData()` with data source routing
- [ ] Implement widget caching (database column + Redis)
- [ ] Support widget types: `kpi_card`, `health_heatmap`, `grant_pipeline`, `okr_progress`, `venture_ranking`, `chart`, `table`, `metric`
- [ ] Create `portfolio.dashboard_cache_refresh` cron (every 5 minutes)

### Week 9: AI Integration & Automated Reporting

#### 3.9 AI-Powered Portfolio Insights

- [ ] Integrate OpenRouter AI for portfolio analysis
- [ ] Implement `suggestGrants()` — AI-powered grant matching for ventures
- [ ] Implement `generateCompetitiveInsights()` — AI-assisted competitive analysis
- [ ] Implement `getPortfolioOptimizations()` — AI-driven resource allocation suggestions
- [ ] Add AI model configuration via `PORTFOLIO_AI_MODEL` env var
- [ ] Implement rate limiting and cost tracking for AI API calls

#### 3.10 Quarterly Review Automation

- [ ] Create `portfolio.quarterly_review` cron (quarterly)
- [ ] Auto-trigger venture scoring for all active ventures
- [ ] Auto-generate portfolio summary report
- [ ] Auto-send OKR check-in reminders to all venture leads
- [ ] Generate PDF report via `@mcv/documents` integration

#### 3.11 Tech Stack & Deployment Management

- [ ] Implement `registerTechnology()`, `deprecateTechnology()`, `getTechStack()`, `getTechStackMatrix()`
- [ ] Implement `registerDeployment()`, `updateDeploymentStatus()`, `runHealthCheck()`, `getDeploymentMatrix()`
- [ ] Implement deployment health check automation

**Phase 3 Deliverable:** Full analytics and intelligence layer. AI insights, cross-venture aggregation, competitive intelligence, configurable dashboards, and automated quarterly reviews.

---

## Phase 4 — Polish & Hardening

**Duration:** 2 weeks
**Goal:** Client hooks/components, performance optimization, comprehensive testing, documentation, production hardening.

### Week 10: Client Layer

#### 4.1 React Hooks

- [ ] `useVentures`, `useVentureDetail`, `useVentureHealth`, `useVentureKpis`, `useVentureTeam`
- [ ] `useLegalEntities`, `useEntityHierarchy`, `useEntityCompliance`
- [ ] `useGrants`, `useGrantLifecycle`, `useGrantBudget`
- [ ] `useStrategicObjectives`, `useOkrProgress`, `useVentureScorecards`
- [ ] `usePortfolioDashboard`, `usePortfolioSummary`, `useCompetitiveLandscape`
- [ ] Implement React Query integration with cache invalidation
- [ ] Implement optimistic updates for common mutations

#### 4.2 React Components

- [ ] Venture components: `VentureGrid`, `VentureCard`, `VentureDetailPanel`, `VentureHealthDashboard`, `VentureKpiTracker`, `VentureTeamRoster`, `TechStackViewer`
- [ ] Entity components: `EntityHierarchyTree`, `EntityComplianceMatrix`, `CorporateDocumentVault`
- [ ] Grant components: `GrantPipeline`, `GrantTimelineView`, `GrantBudgetTracker`, `GrantComplianceCalendar`
- [ ] Strategy components: `OkrTreeView`, `VentureScorecardMatrix`, `CompetitorMap`, `MarketSizingChart`, `PortfolioDashboard`, `ConsolidatedMetricsPanel`, `InvestmentThesisBoard`, `PivotDecisionLog`
- [ ] All components use Tailwind CSS + `@mcv/ui` design system

#### 4.3 API Routes

- [ ] Create Next.js API routes for all service methods:
  - `GET/POST /api/portfolio/ventures`
  - `GET/PATCH/DELETE /api/portfolio/ventures/[id]`
  - `POST /api/portfolio/ventures/[id]/approve`
  - `POST /api/portfolio/ventures/[id]/launch`
  - `GET/POST /api/portfolio/ventures/[id]/health`
  - `GET/POST /api/portfolio/ventures/[id]/kpis`
  - `GET/POST /api/portfolio/ventures/[id]/team`
  - `GET/POST /api/portfolio/entities`
  - `GET /api/portfolio/entities/hierarchy`
  - `GET /api/portfolio/entities/compliance`
  - `GET/POST /api/portfolio/grants`
  - `GET/POST /api/portfolio/grants/[id]/milestones`
  - `GET/POST /api/portfolio/grants/[id]/disbursements`
  - `GET/POST /api/portfolio/strategy/objectives`
  - `POST /api/portfolio/strategy/objectives/[id]/checkin`
  - `GET /api/portfolio/strategy/rankings`
  - `GET /api/portfolio/aggregation/summary`
  - `GET /api/portfolio/health` (health check endpoint)
- [ ] Wire up `withPortfolioAuth` middleware on all routes
- [ ] Implement rate limiting per user per endpoint

### Week 11: Performance & Hardening

#### 4.4 Performance Optimization

- [ ] Verify all database indexes are created and utilized
- [ ] Implement Redis caching for all read-heavy endpoints
- [ ] Implement cache invalidation on writes
- [ ] Verify cursor-based pagination works correctly
- [ ] Load test with simulated 9-venture dataset
- [ ] Verify p95 latency targets:
  - `getVenture`: < 50ms
  - `listVentures`: < 100ms
  - `getHealthHeatmap`: < 300ms
  - `getPortfolioSummary`: < 500ms
  - `scoreVenture`: < 500ms

#### 4.5 Observability

- [ ] Implement structured logging with `@mcv/kernel` logger
- [ ] Export Prometheus metrics: `portfolio_ventures_total`, `portfolio_venture_health_score`, `portfolio_entities_compliance_overdue`, `portfolio_grants_pipeline_value`, `portfolio_api_latency_ms`, etc.
- [ ] Implement health check endpoint at `/api/portfolio/health`
- [ ] Set up alerting rules for critical conditions:
  - Compliance overdue > 0
  - Venture health critical
  - Grant deadline overdue
  - API error rate > 1%

#### 4.6 Data Seeding

- [ ] Create seed script for all 9 MCV ventures with realistic data
- [ ] Seed legal entity hierarchy (MCV Global Holdings → 9 subsidiaries)
- [ ] Seed sample grants (at least 3 active, 2 in pipeline)
- [ ] Seed sample OKRs (1 consortium-level, 1 per venture)
- [ ] Seed sample scorecards (1 quarter of data)
- [ ] Seed sample health snapshots (30 days of history)

#### 4.7 Security Hardening

- [ ] Verify all RLS policies work correctly across all roles
- [ ] Verify EIN encryption/decryption works end-to-end
- [ ] Verify compensation data encryption
- [ ] Verify document access control enforcement
- [ ] Run input validation fuzzing on all Zod schemas
- [ ] Verify no sensitive data leaks in API responses for non-privileged users

**Phase 4 Deliverable:** Production-ready package with full client layer, performance targets met, comprehensive test coverage, observability, and security hardening.

---

## Testing Strategy

### Test Pyramid

```
         ┌─────────────────┐
         │    E2E Tests     │  ~10 tests
         │  (Critical paths) │  Full API → DB → Events
         ├─────────────────┤
         │  Integration     │  ~50 tests
         │  Tests           │  Service → DB with test DB
         │                  │  Includes RLS verification
         ├──────────────────┤
         │                  │
         │   Unit Tests     │  ~150 tests
         │                  │  Validators, lifecycle,
         │                  │  scoring, calculations
         │                  │
         └──────────────────┘
```

### Unit Tests (~150 tests)

```typescript
// Validator tests
describe('createVentureSchema', () => {
  it('accepts valid input', () => { /* ... */ });
  it('rejects invalid slug format', () => { /* ... */ });
  it('rejects slug > 50 chars', () => { /* ... */ });
  it('applies default priority', () => { /* ... */ });
});

// Lifecycle tests
describe('Venture Lifecycle', () => {
  it('allows concept → setup', () => { /* ... */ });
  it('rejects concept → active (must approve first)', () => { /* ... */ });
  it('rejects archived → any (terminal state)', () => { /* ... */ });
  it('lists valid transitions from each state', () => { /* ... */ });
});

// Scoring tests
describe('Health Score Calculation', () => {
  it('calculates weighted average correctly', () => { /* ... */ });
  it('classifies 70+ as healthy', () => { /* ... */ });
  it('classifies 40-69 as warning', () => { /* ... */ });
  it('classifies <40 as critical', () => { /* ... */ });
});

// OKR progress tests
describe('OKR Progress Calculation', () => {
  it('calculates linear progress correctly', () => { /* ... */ });
  it('calculates binary progress (0 or 100)', () => { /* ... */ });
  it('calculates weighted objective progress from KRs', () => { /* ... */ });
  it('caps progress at 100', () => { /* ... */ });
});

// Allocation tests
describe('Team Allocation Validation', () => {
  it('allows allocation within 100%', () => { /* ... */ });
  it('rejects allocation exceeding 100%', () => { /* ... */ });
  it('calculates correctly with multiple ventures', () => { /* ... */ });
});
```

### Integration Tests (~50 tests)

```typescript
describe('VentureService Integration', () => {
  it('creates venture and retrieves by slug', async () => { /* ... */ });
  it('approves venture and creates tenant', async () => { /* ... */ });
  it('records health snapshot and updates heatmap', async () => { /* ... */ });
  it('enforces team allocation across ventures', async () => { /* ... */ });
  it('cascades on archive (team, deploys, KPIs)', async () => { /* ... */ });
});

describe('EntityService Integration', () => {
  it('builds entity hierarchy without circular refs', async () => { /* ... */ });
  it('detects and rejects circular hierarchy', async () => { /* ... */ });
  it('validates ownership ≤ 100%', async () => { /* ... */ });
  it('encrypts/decrypts EIN correctly', async () => { /* ... */ });
});

describe('GrantService Integration', () => {
  it('follows complete grant lifecycle', async () => { /* ... */ });
  it('auto-creates disbursement on milestone verify', async () => { /* ... */ });
  it('rejects disbursement exceeding award', async () => { /* ... */ });
  it('tracks budget vs actual with over-budget warnings', async () => { /* ... */ });
});

describe('StrategyService Integration', () => {
  it('auto-calculates OKR progress from key results', async () => { /* ... */ });
  it('auto-ranks ventures on scorecard submission', async () => { /* ... */ });
  it('rejects scorecard weights not summing to 1.0', async () => { /* ... */ });
});

describe('RLS Policy Tests', () => {
  it('super_admin sees all ventures', async () => { /* ... */ });
  it('venture_admin sees only assigned ventures', async () => { /* ... */ });
  it('team_member has read-only access', async () => { /* ... */ });
  it('unauthenticated user sees nothing', async () => { /* ... */ });
});
```

### E2E Tests (~10 tests)

```typescript
describe('E2E: Venture Lifecycle', () => {
  it('create → approve → launch → record health → record KPI → archive', async () => { /* ... */ });
});

describe('E2E: Grant Lifecycle', () => {
  it('create → qualify → apply → award → activate → milestone → disburse → complete → close', async () => { /* ... */ });
});

describe('E2E: Strategic Review', () => {
  it('create objectives → key results → check-in → score ventures → get rankings', async () => { /* ... */ });
});

describe('E2E: Entity Management', () => {
  it('create holding → create subsidiaries → build hierarchy → compliance check', async () => { /* ... */ });
});

describe('E2E: Portfolio Aggregation', () => {
  it('creates ventures + health + grants → portfolio summary is accurate', async () => { /* ... */ });
});
```

---

## Acceptance Criteria

### Phase 1 Acceptance

- [ ] Package compiles with zero TypeScript errors
- [ ] All 39 database tables created successfully
- [ ] All Zod validators pass valid/invalid input tests
- [ ] Basic CRUD works for all 4 submodules
- [ ] RLS policies enforce role-based access
- [ ] Package exports correctly from `@mcv/portfolio`

### Phase 2 Acceptance

- [ ] Venture lifecycle state machine enforces all valid/invalid transitions
- [ ] `approveVenture` successfully creates tenant in `@mcv/identity`
- [ ] Health snapshots calculate correct composite scores
- [ ] KPI recording auto-calculates status from thresholds
- [ ] Team allocation validation rejects >100% across ventures
- [ ] Entity hierarchy traversal returns correct tree via recursive CTE
- [ ] Circular hierarchy detection prevents invalid insertions
- [ ] EIN encryption/decryption round-trips correctly
- [ ] Ownership validation rejects >100% total
- [ ] Grant lifecycle state machine enforces all valid/invalid transitions
- [ ] Milestone verification auto-creates disbursement when `fundingTrigger: true`
- [ ] Budget expenditure tracking auto-recalculates remaining amounts
- [ ] OKR check-in auto-recalculates parent objective progress
- [ ] Venture scorecard auto-ranks all ventures for the period
- [ ] All cron jobs execute on schedule (health, KPI, compliance, deadlines)
- [ ] All state changes emit events to `@mcv/fabric`

### Phase 3 Acceptance

- [ ] Portfolio summary aggregates data from all submodules correctly
- [ ] Materialized views refresh on schedule
- [ ] Competitive analysis freshness tracking works (90-day flag)
- [ ] Dashboard widgets render cached data and auto-refresh
- [ ] AI integration returns useful grant suggestions and competitive insights
- [ ] Quarterly review automation triggers scoring, reports, and reminders

### Phase 4 Acceptance

- [ ] All React hooks work with React Query
- [ ] All React components render correctly with sample data
- [ ] All API routes are protected by authentication middleware
- [ ] p95 latency targets met for all endpoints
- [ ] Health check endpoint returns accurate status
- [ ] Prometheus metrics export correctly
- [ ] Security audit checklist passes (encryption, RLS, input validation)
- [ ] Test coverage ≥ 80%
- [ ] Data seeding script populates realistic consortium data
- [ ] Documentation is complete and up-to-date

---

## Risks & Mitigations

### Technical Risks

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| **RLS policy complexity** — 39 tables with different access patterns may be difficult to maintain | Medium | High | Use `portfolio_has_access()` helper function to centralize logic. Test every policy combination. |
| **Recursive CTE performance** — Entity hierarchy queries may be slow on deep trees | Low | Medium | MCV hierarchy is only ~3 levels deep. Add depth limit to CTE (max 10). Cache hierarchy (30 min TTL). |
| **Event bus reliability** — Redpanda downtime could cause missed events | Low | High | Implement retry with exponential backoff. Queue events locally on failure. Dead letter queue for unprocessable events. |
| **Encryption key rotation** — Need to re-encrypt EIN/compensation data if key changes | Low | Medium | Implement key versioning — store key version alongside encrypted data. Support decryption with old keys during rotation window. |
| **Finance service dependency** — Health snapshot cron depends on `@mcv/finance` for revenue data | Medium | Medium | Graceful degradation — generate health snapshots without financial dimension if finance is unavailable. Flag the gap. |
| **Database migration complexity** — 39 tables in a single migration is risky | Medium | High | Split into 4 migrations (one per submodule). Apply in sequence. Test on staging first. |

### Business Risks

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| **Data collection delays** — Legal entity data and grant info may take time to gather | High | Medium | Start with ventures (data is well-known). Entities and grants can be loaded incrementally. |
| **Adoption resistance** — Venture leads may not use OKR system voluntarily | Medium | Medium | Start with consortium-level OKRs. Demonstrate value with automated scorecards. Integrate with existing planning workflows. |
| **Scope creep** — Each submodule could expand significantly | Medium | High | Strict adherence to MODULE.md spec. Phase 3+ features are optional. Core lifecycle management is the priority. |
| **AI cost management** — OpenRouter API calls can be expensive at scale | Medium | Low | Implement rate limiting, cost caps, and caching for AI responses. AI features are non-blocking. |

### Dependency Risks

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| **`@mcv/identity` API changes** — Tenant creation API may change | Low | Medium | Wrap identity calls in an adapter. Version the integration interface. |
| **`@mcv/fabric` event schema changes** — Event format may evolve | Low | Medium | Version events with `version: '1.0'` field. Support backward-compatible changes. |
| **Supabase RLS limitations** — Complex policies may hit Supabase edge cases | Low | High | Test early. Have fallback to application-level access control if needed. |

---

## Timeline

### Summary

| Phase | Duration | Start | End | Key Deliverables |
|-------|----------|-------|-----|------------------|
| **Phase 1** — Foundation | 2 weeks | Week 1 | Week 2 | Package scaffold, 39 tables, CRUD, RLS, validators |
| **Phase 2** — Core Features | 4 weeks | Week 3 | Week 6 | Lifecycle engines, health monitoring, KPI, entities, grants, OKRs, scoring |
| **Phase 3** — Advanced | 3 weeks | Week 7 | Week 9 | Aggregation, competitive intel, AI insights, dashboards, automated reports |
| **Phase 4** — Polish | 2 weeks | Week 10 | Week 11 | Client hooks/components, API routes, perf optimization, security hardening |

**Total Duration:** 11 weeks

### Gantt Chart (ASCII)

```
Week:   1    2    3    4    5    6    7    8    9    10   11
        |----|----|----|----|----|----|----|----|----|----|----|

Phase 1: Foundation
        [████████]
        Schema   CRUD
        Setup    RLS

Phase 2: Core Features
                  [████████████████████████]
                  Ventures  Entities  Grants
                  Lifecycle Health    OKRs
                  KPIs      Hierarchy Scoring

Phase 3: Advanced
                                          [██████████████]
                                          Aggregation
                                          Competitive
                                          AI Insights
                                          Dashboards

Phase 4: Polish
                                                        [████████]
                                                        Hooks/UI
                                                        API Routes
                                                        Perf/Security
```

### Milestones

| Milestone | Target Date | Criteria |
|-----------|-------------|----------|
| **M1: Schema Deployed** | End of Week 1 | All 39 tables live in Supabase |
| **M2: Basic CRUD Working** | End of Week 2 | All 4 submodules have working CRUD |
| **M3: Venture Lifecycle Complete** | End of Week 4 | Full state machine with tenant integration |
| **M4: Entity Hierarchy Working** | End of Week 5 | Recursive tree with circular detection |
| **M5: Grant Pipeline Complete** | End of Week 6 | Full grant lifecycle with milestones/disbursements |
| **M6: OKR Engine Complete** | End of Week 6 | Auto-progress calculation working |
| **M7: Aggregation Layer Live** | End of Week 7 | Portfolio summary with materialized views |
| **M8: Dashboards Working** | End of Week 8 | Configurable dashboards with cached widgets |
| **M9: AI Integration Live** | End of Week 9 | Grant suggestions and competitive insights |
| **M10: Client Layer Complete** | End of Week 10 | All hooks and components working |
| **M11: Production Ready** | End of Week 11 | Performance targets met, security hardened, tests passing |

### Resource Requirements

| Role | Allocation | Duration | Notes |
|------|-----------|----------|-------|
| **Senior Full-Stack Developer** | 100% | 11 weeks | Primary implementer — schema, services, tests |
| **Backend Developer** | 50% | Weeks 3-9 | Cron jobs, event integration, AI integration |
| **Frontend Developer** | 80% | Weeks 10-11 | React hooks, components, API routes |
| **DevOps / DBA** | 20% | Weeks 1-2, 10-11 | Database setup, RLS policies, performance tuning |
| **Product / Legal** | As needed | Weeks 1-2 | Data collection, entity verification, compliance requirements |

---

*@mcv/portfolio — Portfolio Management Domain*
