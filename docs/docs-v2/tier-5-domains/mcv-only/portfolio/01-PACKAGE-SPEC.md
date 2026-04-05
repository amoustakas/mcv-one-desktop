# @mcv/portfolio — Package Specification

> **Package:** `@mcv/portfolio`
> **Classification:** MCV-ONLY
> **Tier:** 5 — Domain Layer
> **Version:** 1.0.0
> **Status:** Active Development
> **Owner:** MCV Platform Team
> **Last Updated:** February 9, 2026

---

## Table of Contents

1. [Overview](#overview)
2. [Purpose & Scope](#purpose--scope)
3. [Module Summary](#module-summary)
   - [Entities](#entities-module)
   - [Grants](#grants-module)
   - [Strategy](#strategy-module)
   - [Ventures](#ventures-module)
4. [Architecture Position](#architecture-position)
5. [Key Interfaces & Types](#key-interfaces--types)
6. [Configuration](#configuration)
7. [Dependencies](#dependencies)
8. [Multi-Tenant Design](#multi-tenant-design)
9. [Security](#security)
10. [Performance](#performance)
11. [Deployment & Operations](#deployment--operations)

---

## Overview

The `@mcv/portfolio` package is the **consortium-level meta-layer** for the MCV Global Consortium platform. It is the single, authoritative domain for managing everything that defines MCV as a multi-venture enterprise: which ventures exist and how they are governed, which legal entities structure the consortium, what grant funding supports the ventures, and where the consortium is heading strategically.

**This is not a per-venture package.** This is the package that manages **all ventures from above** — the birds-eye view of the entire MCV consortium.

MCV Global Consortium operates 9 active ventures spanning diverse verticals:

| Venture | Domain | Description |
|---------|--------|-------------|
| **BetEdge** | Sports Betting AI | AI-powered sports analytics and predictive betting platform |
| **SerpSpace** | SEO | Search engine optimization tools and agency services |
| **Full Gain** | Grants | Grant discovery, application, and management platform |
| **MCV Studios** | Gaming | Game development studio and publishing |
| **Futurestate** | Real Estate | AI-driven real estate analytics and investment platform |
| **NexTech** | SaaS | B2B productivity tools and workflow automation |
| **Vaultik** | FinTech | Digital asset custody and DeFi infrastructure |
| **AuraHealth** | HealthTech | AI diagnostics and telemedicine platform |
| **EcoGrid** | CleanTech | Renewable energy marketplace and carbon credit trading |

Every decision at the consortium level — launching a new venture, restructuring legal entities, applying for grant funding, pivoting strategic direction — flows through this package.

### Key Capabilities

- **Venture Lifecycle Management** — Full state-machine-driven lifecycle from concept through active operations to sunset and archival, with health monitoring, KPI tracking, team assignments, tech stack registry, and deployment configurations.
- **Legal Entity Management** — Corporate structure tracking for corporations, LLCs, partnerships, and holding structures with ownership hierarchies, registered agents, officer management, compliance tracking, and secure corporate document vaults.
- **Grant Lifecycle Management** — Complete grant pipeline from discovery through application, award, milestone tracking, disbursement management, compliance reporting, budget tracking, and closeout.
- **Strategic Planning** — OKR tracking at both consortium and venture levels, competitive analysis, market sizing (TAM/SAM/SOM), venture scoring and ranking, investment thesis management, pivot decision tracking, and configurable portfolio dashboards.
- **Cross-Venture Aggregation** — Consolidated portfolio summaries, venture comparison matrices, health heatmaps, grant funding pipelines, and trend detection across all 9 ventures.

---

## Purpose & Scope

### Purpose

The `@mcv/portfolio` package exists to answer the fundamental questions of consortium governance:

1. **What ventures do we operate?** — Registry of all ventures with their status, stage, health, configuration, and team composition.
2. **How are we structured legally?** — Full corporate hierarchy with ownership percentages, compliance tracking, and document management across all jurisdictions.
3. **Where does our funding come from?** — Grant pipeline management from discovery through closeout, with milestone-based disbursement tracking and compliance reporting.
4. **Where are we heading?** — Strategic objectives (OKRs) at consortium and venture levels, competitive intelligence, market sizing, venture scoring, and investment thesis tracking.

### Scope

**In Scope:**

- Venture CRUD operations and lifecycle state management (concept → setup → active → scaling → hibernating → sunset → archived)
- Per-venture configuration, feature toggles, maintenance mode, and branding
- Health monitoring with composite scoring across 5 dimensions (financial, product, team, market, compliance)
- KPI definition, target setting, measurement recording, and trend analysis
- Team member assignment with allocation tracking and cross-venture validation
- Technology stack registry and deployment environment management
- Legal entity CRUD with full entity type support (C-Corp, S-Corp, LLC, LP, LLP, Trust, Holding)
- Entity hierarchy management with circular-reference detection
- Ownership structure tracking with cap table generation
- Officer and director management with signing authority
- Registered agent tracking across multiple jurisdictions
- Corporate document vault with versioning and access control
- Entity compliance record-keeping with deadline alerts
- Grant discovery, qualification, application, and award tracking
- Grant milestone management with funding-trigger disbursements
- Grant budget management with line-item expenditure tracking
- Grant compliance reporting with deadline management
- Grant document management and grantor contact tracking
- Strategic objective and key result (OKR) management with auto-progress calculation
- Competitive analysis with SWOT, competitor profiles, and market positioning
- Market sizing (TAM/SAM/SOM) with methodology tracking
- Venture scorecards with configurable criteria, automated ranking, and tier assignment
- Investment thesis lifecycle tracking with validation/invalidation
- Pivot decision logging with before/after metrics
- Strategic initiative tracking with budget and progress
- Configurable portfolio dashboards with cached widget data
- Cross-venture aggregation: portfolio summaries, health heatmaps, comparison matrices, and consolidated metrics

**Out of Scope:**

- Per-venture business logic (CRM, invoicing, product features) — handled by individual venture packages
- Financial accounting, ledger management, chart of accounts — handled by `@mcv/finance`
- Wallet management, token operations, DeFi — handled by `@mcv/treasury`
- User authentication, tenant provisioning, RBAC policy — handled by `@mcv/identity`
- Audit log storage, event bus infrastructure — handled by `@mcv/fabric`
- PDF generation, file storage infrastructure — handled by `@mcv/documents`
- Email/SMS/push notification delivery — handled by `@mcv/notifications`

### Design Philosophy

1. **Single Source of Truth** — The portfolio package is the canonical registry for ventures, entities, grants, and strategy. Other packages reference portfolio records, never duplicate them.
2. **State Machine Enforcement** — All lifecycle transitions (venture status, grant status) are validated against defined state machines. Invalid transitions are rejected at the service layer, never deferred to the caller.
3. **Audit Everything** — Every state change emits events to `@mcv/fabric` with full before/after snapshots. The audit trail is non-negotiable.
4. **Cross-Venture Isolation with Aggregation** — Individual venture data is isolated by tenant (via `@mcv/identity`), but super admins and portfolio-level views can aggregate across all ventures for consortium-level insights.
5. **Composable Services** — Each submodule (ventures, entities, grants, strategy) exposes an independent service class that can be consumed individually. The aggregation layer composes them for cross-cutting views.

---

## Module Summary

The `@mcv/portfolio` package is composed of four primary submodules and one aggregation layer:

| Module | Purpose | Database Tables | Key Operations |
|--------|---------|-----------------|----------------|
| **ventures** | Venture lifecycle, health monitoring, team & tech management | 9 tables | Create venture, lifecycle transitions, health snapshots, KPI tracking, team assignments |
| **entities** | Legal entity management, ownership, compliance | 8 tables | Entity CRUD, hierarchy management, compliance tracking, document vault |
| **grants** | Grant lifecycle from discovery to closeout | 10 tables | Grant CRUD, application management, milestone tracking, disbursement, compliance reporting |
| **strategy** | OKRs, competitive analysis, scoring, dashboards | 12 tables | Objective/KR management, competitive analysis, scoring, thesis tracking, dashboards |
| **aggregation** | Cross-venture analytics and reporting | Materialized views | Portfolio summaries, venture comparisons, health heatmaps, consolidated metrics |

**Total Database Tables:** 39 (plus materialized views for aggregation)

---

### Entities Module

The entities submodule manages the **legal corporate structure** of the MCV Global Consortium. It tracks every corporation, LLC, partnership, holding company, and subsidiary in the consortium hierarchy, along with their ownership structures, officers, registered agents, compliance obligations, and corporate documents.

**Key Responsibilities:**

- **Entity Registry** — CRUD operations for all legal entities with support for C-Corp, S-Corp, LLC, LP, LLP, Sole Proprietorship, Trust, and Holding Company types.
- **Hierarchy Management** — Parent-child entity relationships with ownership percentages, effective dates, and controlling interest flags. Circular-reference detection prevents invalid hierarchies.
- **Ownership Tracking** — Detailed ownership records including equity type, share class, par value, capital contributions, vesting schedules, and transfer restrictions. Full cap table generation with dilution calculations.
- **Officer Management** — Officers and directors with appointment dates, signing authority, board committee memberships, and compensation tracking (encrypted).
- **Registered Agents** — Per-jurisdiction registered agent records with renewal tracking and cost management.
- **Corporate Document Vault** — Secure document storage with versioning, access control levels, and support for articles of incorporation, operating agreements, bylaws, tax returns, board resolutions, and more.
- **Compliance Tracking** — Per-entity, per-jurisdiction compliance records for annual reports, franchise taxes, foreign qualifications, and business licenses. Automated deadline alerts.
- **Multi-Jurisdiction Support** — Entities can be registered in multiple jurisdictions with independent compliance tracking per jurisdiction.

**Database Tables (8):**

| Table | Purpose |
|-------|---------|
| `portfolio_legal_entities` | Master entity records |
| `portfolio_entity_hierarchies` | Parent-child relationships |
| `portfolio_ownership_structures` | Ownership percentages and types |
| `portfolio_registered_agents` | Registered agent records |
| `portfolio_corporate_documents` | Document vault |
| `portfolio_entity_compliance_records` | Compliance tracking |
| `portfolio_entity_officers` | Officers and directors |
| `portfolio_entity_jurisdictions` | Multi-jurisdiction registrations |

**Example Hierarchy:**

```
MCV Global Holdings Corp (Delaware C-Corp)
├── BetEdge Technologies LLC (Nevada LLC) — 100%
├── SerpSpace Inc. (Delaware C-Corp) — 100%
├── Full Gain Corp (Delaware C-Corp) — 85%
│   └── Full Gain Canada Ltd (Ontario Corp) — 100% (subsidiary)
├── MCV Studios LLC (California LLC) — 100%
├── Futurestate Real Estate Inc. (Delaware C-Corp) — 90%
├── NexTech Solutions LLC (Delaware LLC) — 100%
├── Vaultik Financial Inc. (Wyoming C-Corp) — 75%
├── AuraHealth Technologies Inc. (Delaware C-Corp) — 80%
└── EcoGrid Energy LLC (Delaware LLC) — 100%
```

**Key Behaviors:**

- EIN values are encrypted at rest using AES-256-GCM via `@mcv/kernel/config/secrets`
- Circular hierarchy detection prevents entity A from being a child of entity B when B is already a descendant of A
- Ownership percentages are validated to never exceed 100% per entity
- Weekly cron job checks good standing status and sends compliance alerts 30 days before due dates
- Document versioning links new uploads to prior versions via `previousVersionId`
- Registering in a new jurisdiction auto-creates compliance records for that jurisdiction's known requirements

---

### Grants Module

The grants submodule manages the **complete grant funding lifecycle** — from initial discovery of funding opportunities through application, award, milestone tracking, disbursement management, compliance reporting, and closeout. This is critical for ventures like Full Gain (which is itself a grants platform) and for consortium-level grants (SBIR/STTR, state incentives) that fund MCV ventures.

**Key Responsibilities:**

- **Grant Pipeline** — Discovery, qualification, and application tracking with internal scoring and review workflows.
- **Application Management** — Full application document management with narrative, budget, supporting docs, key personnel, and revision tracking.
- **Milestone Tracking** — Grant-specific milestones with deliverable tracking, completion evidence, and verification workflows.
- **Disbursement Management** — Funding disbursement records with milestone-triggered automatic disbursement creation, status tracking (pending → approved → received → deposited), and remaining amount synchronization.
- **Compliance Reporting** — Progress, financial, final, annual, and audit reports with submission deadlines and auto-generated reminders.
- **Budget Management** — Grant-specific budgets independent of venture operating budgets, with line-item tracking (personnel, fringe, travel, equipment, supplies, contractual, other, indirect), expenditure recording, and burn rate analysis.
- **Deadline Management** — Comprehensive deadline tracking with configurable reminder schedules (30, 14, 7, 3, 1 days before due) and recurring deadline support.
- **Document Management** — Grant-specific document storage for applications, budgets, reports, correspondence, award letters, amendments, and audits.
- **Contact Management** — Grantor contact tracking for program officers, grants specialists, financial officers, and technical monitors.

**Database Tables (10):**

| Table | Purpose |
|-------|---------|
| `portfolio_grants` | Master grant records |
| `portfolio_grant_applications` | Application submissions |
| `portfolio_grant_milestones` | Milestone definitions & tracking |
| `portfolio_grant_disbursements` | Funding disbursement records |
| `portfolio_grant_compliance_reports` | Compliance report submissions |
| `portfolio_grant_budgets` | Grant-specific budgets |
| `portfolio_grant_budget_lines` | Budget line items |
| `portfolio_grant_deadlines` | Deadline tracking |
| `portfolio_grant_documents` | Supporting documents |
| `portfolio_grant_contacts` | Grantor contacts |

**Grant Lifecycle State Machine:**

```
DISCOVERED → QUALIFIED → APPLIED → AWARDED → ACTIVE → COMPLETED → CLOSED
                │                    │          │
                ↓                    ↓          ├→ ON_HOLD → ACTIVE
            DISCOVERED          DECLINED       └→ TERMINATED
              (disqualify)      WITHDRAWN
```

**Key Behaviors:**

- Status transitions follow the state machine strictly — skipping states throws `PORTFOLIO_INVALID_GRANT_TRANSITION`
- Activating a grant auto-generates recurring deadlines for compliance reports based on the performance period
- Verifying a milestone with `fundingTrigger: true` auto-creates a pending disbursement request
- Budget expenditure recording auto-recalculates remaining amounts and emits warnings on over-budget conditions
- Daily cron scans deadlines against `reminderDays` arrays and dispatches notifications via `@mcv/notifications`
- Grant `remainingAmount` auto-syncs: `remainingAmount = awardedAmount - disbursedAmount`
- Federal grants (`category: 'federal'`) require CFDA number, OMB Uniform Guidance, and Single Audit compliance

---

### Strategy Module

The strategy submodule provides the **strategic planning and analysis layer** for the MCV consortium. It answers the fundamental strategic question: *Are we investing in the right ventures? How do they compare? Where should we double down or pull back?*

**Key Responsibilities:**

- **OKR Management** — Objectives and Key Results at consortium, venture, and team levels with cascading progress calculation, weighted scoring, and check-in tracking.
- **Competitive Analysis** — SWOT analysis framework with individual competitor profiles, threat levels, market positioning, moat strength assessment, and actionable recommendations.
- **Market Sizing** — TAM/SAM/SOM calculations using top-down, bottom-up, and value-theory methodologies with growth rates, market drivers, assumptions, and source tracking.
- **Venture Scorecards** — Configurable multi-criteria scoring across 5 dimensions (financial, market, product, team, strategic) with weighted scoring, automated ranking, and tier assignment (A/B/C/D).
- **Investment Theses** — Lifecycle tracking for venture investment theses from active through validated/invalidated, with key assumptions, risk factors, success criteria, and return expectations.
- **Pivot Decision Log** — Historical record of venture pivots with before/after metrics, rationale, lessons learned, and portfolio-level success rate analysis.
- **Strategic Initiatives** — Project-level tracking for strategic initiatives linked to objectives, with budget allocation, progress tracking, milestones, and risk management.
- **Portfolio Dashboards** — Configurable dashboard system with widget-based layouts, multiple data sources, caching, and auto-refresh.

**Database Tables (12):**

| Table | Purpose |
|-------|---------|
| `portfolio_strategic_objectives` | OKR objectives |
| `portfolio_key_results` | OKR key results |
| `portfolio_key_result_checkins` | Key result progress check-ins |
| `portfolio_competitive_analyses` | Competitive landscape analyses |
| `portfolio_competitor_profiles` | Individual competitor profiles |
| `portfolio_market_sizings` | TAM/SAM/SOM estimates |
| `portfolio_venture_scorecards` | Venture scoring/ranking |
| `portfolio_scorecard_criteria` | Scoring criteria definitions |
| `portfolio_investment_theses` | Investment thesis tracking |
| `portfolio_pivot_decisions` | Pivot decision log |
| `portfolio_strategic_initiatives` | Strategic initiative tracking |
| `portfolio_dashboards` | Dashboard configurations |

*Note: `portfolio_dashboard_widgets` is a 13th table closely coupled to dashboards.*

**OKR Hierarchy:**

```
Consortium-Level Objective
├── Key Result 1 (BetEdge target — weight 30%)
├── Key Result 2 (SerpSpace target — weight 20%)
├── Key Result 3 (Full Gain target — weight 15%)
├── Key Result 4 (New Ventures target — weight 15%)
└── Key Result 5 (Burn Rate target — weight 20%)
    │
    └── Venture-Level Objective (child)
        ├── Key Result A (weight 30%)
        ├── Key Result B (weight 25%)
        ├── Key Result C (weight 20%)
        └── Key Result D (weight 25%)
```

**Key Behaviors:**

- OKR auto-progress: Key result check-ins trigger weighted average recalculation of parent objective progress
- Cascading OKRs: Venture-level objectives link to consortium-level objectives via `parentObjectiveId`
- Scorecard auto-ranking: Saving any venture scorecard re-ranks all ventures for that period (A: 80-100, B: 60-79, C: 40-59, D: 0-39)
- Investment thesis lifecycle: Validation triggers increased investment confidence events; invalidation triggers strategic review
- Pivot tracking captures before/after metrics for portfolio-level success rate analysis
- Dashboard widget caching prevents excessive database queries during dashboard browsing
- Competitive analyses older than 90 days are auto-flagged for review with cron reminders

---

### Ventures Module

The ventures submodule is the **registry of record** for what constitutes the MCV consortium. It manages the full lifecycle of every venture from concept through active operations to sunset and archival. Every other system in the MCV platform references venture records defined here.

**Key Responsibilities:**

- **Venture Registry** — CRUD operations for all ventures with slug-based identification, branding, industry/vertical classification, and priority assignment.
- **Lifecycle Management** — Full state machine: concept → setup → active → scaling → hibernating → sunset → archived, with validated transitions and automatic tenant creation on approval.
- **Configuration Management** — Per-venture feature toggles, integration settings, resource limits, branding configuration, billing setup, custom domains, and maintenance mode.
- **Health Monitoring** — Point-in-time health snapshots with composite scoring across 5 weighted dimensions (financial 30%, product 25%, team 20%, market 15%, compliance 10%) and configurable alert thresholds.
- **KPI Tracking** — Configurable KPI definitions with target setting, measurement recording, automatic status calculation (exceeded/on_track/at_risk/off_track), trend analysis, and global KPI support.
- **Team Management** — Team member assignments with role, title, allocation percentage (validated across ventures to ≤100%), compensation type, and responsibilities.
- **Tech Stack Registry** — Technology inventory per venture with category, version, license, cost tracking, and migration planning.
- **Deployment Management** — Multi-environment deployment tracking (production, staging, development, preview) with health checks, auto-deploy configuration, and cost monitoring.
- **Milestone Tracking** — Venture-level milestones with category, status, priority, dependency chains, blocker tracking, and completion evidence.

**Database Tables (9):**

| Table | Purpose |
|-------|---------|
| `portfolio_ventures` | Ventures master table |
| `portfolio_venture_configs` | Per-venture configuration |
| `portfolio_venture_health_snapshots` | Health monitoring snapshots |
| `portfolio_venture_kpis` | KPI definitions and targets |
| `portfolio_venture_kpi_records` | KPI measurement records |
| `portfolio_venture_team_assignments` | Team member assignments |
| `portfolio_venture_tech_stacks` | Technology stack registry |
| `portfolio_venture_deployments` | Deployment configurations |
| `portfolio_venture_milestones` | Venture-level milestones |

**Venture Lifecycle State Machine:**

```
                     ┌──────────┐
                     │          │
          ┌─────────>│ CONCEPT  │
          │          │          │
          │          └────┬─────┘
          │               │ approve
          │               ▼
          │          ┌──────────┐
          │          │          │
          │          │  SETUP   │──────────────┐
          │          │          │              │
          │          └────┬─────┘              │
          │               │ launch             │ cancel
          │               ▼                    │
          │          ┌──────────┐              │
          │          │          │              │
          │     ┌───>│  ACTIVE  │<───┐        │
          │     │    │          │    │        │
          │     │    └────┬─────┘    │        │
          │     │    ┌────┴────┐     │        │
          │     │    ▼         ▼     │        │
          │     │ ┌────────┐ ┌────────────┐  │
          │     │ │SCALING │ │HIBERNATING │  │
          │     │ └───┬────┘ └─────┬──────┘  │
          │     │     │            │ reactivate
          │     └─────┘            │          │
          │                        ▼          │
          │               ┌──────────────┐    │
          │               │              │    │
          └──────────────>│   SUNSET     │<───┘
                          │              │
                          └──────┬───────┘
                                 │ archive
                                 ▼
                          ┌──────────────┐
                          │   ARCHIVED   │
                          └──────────────┘
```

**Key Behaviors:**

- Lifecycle enforcement: Invalid transitions throw `PORTFOLIO_INVALID_TRANSITION` (e.g., cannot launch a concept venture — must approve first)
- Tenant synchronization: Approving a venture (`concept → setup`) auto-creates a corresponding tenant in `@mcv/identity` linked via `tenantId`
- Health score: Composite score (0-100) = weighted average of 5 dimensions with configurable weights per venture
- KPI auto-status: Recording a KPI value auto-calculates status by comparing against warning/critical thresholds
- Allocation validation: Total allocation across all ventures per user ≤ 100% — exceeding throws `PORTFOLIO_ALLOCATION_EXCEEDED`
- Audit trail: All lifecycle transitions, config changes, and team assignments emit `portfolio.ventures.*` events to `@mcv/fabric`
- Archive cascade: Archiving deactivates all team assignments, archives deployments, and freezes KPI tracking

---

## Architecture Position

The `@mcv/portfolio` package sits at **Tier 5 (Domain Layer)** in the MCV platform architecture. It is classified as **MCV-ONLY**, meaning it contains business logic specific to the MCV Global Consortium and is not designed for reuse outside the platform.

```
┌─────────────────────────────────────────────────────────────────────┐
│                        MCV Platform Architecture                     │
│                                                                      │
│  ┌─────────────────────────────────────────────────────────────┐    │
│  │  TIER 7 — Application Layer                                  │    │
│  │  @mcv/web (Next.js App)   @mcv/mobile   @mcv/admin-console  │    │
│  └──────────────────────────────┬──────────────────────────────┘    │
│                                 │                                    │
│  ┌──────────────────────────────┼──────────────────────────────┐    │
│  │  TIER 6 — Orchestration Layer│                               │    │
│  │  @mcv/agentic-os             ▼          @mcv/workflows       │    │
│  │  (AI Agents: NAOS Strategist, Portfolio Analyst)              │    │
│  └──────────────────────────────┬──────────────────────────────┘    │
│                                 │                                    │
│  ┌──────────────────────────────┼──────────────────────────────┐    │
│  │  TIER 5 — Domain Layer       │     ◄── YOU ARE HERE          │    │
│  │                              ▼                                │    │
│  │  ┌─────────────────────────────────────────────────────┐     │    │
│  │  │             ╔══════════════════════╗                 │     │    │
│  │  │             ║   @mcv/portfolio     ║                 │     │    │
│  │  │             ║                      ║                 │     │    │
│  │  │             ║  ventures | entities ║                 │     │    │
│  │  │             ║  grants | strategy   ║                 │     │    │
│  │  │             ║  aggregation         ║                 │     │    │
│  │  │             ╚══════════════════════╝                 │     │    │
│  │  │                                                      │     │    │
│  │  │  @mcv/crm    @mcv/social    @mcv/analytics          │     │    │
│  │  │  @mcv/content @mcv/commerce @mcv/marketplace        │     │    │
│  │  └──────────────────────────────────────────────────────┘     │    │
│  └──────────────────────────────┬──────────────────────────────┘    │
│                                 │                                    │
│  ┌──────────────────────────────┼──────────────────────────────┐    │
│  │  TIER 4 — Capability Layer   │                               │    │
│  │  @mcv/finance   @mcv/treasury ▼   @mcv/notifications        │    │
│  │  @mcv/documents @mcv/payments     @mcv/search               │    │
│  └──────────────────────────────┬──────────────────────────────┘    │
│                                 │                                    │
│  ┌──────────────────────────────┼──────────────────────────────┐    │
│  │  TIER 3 — Platform Layer     │                               │    │
│  │  @mcv/identity  @mcv/fabric   ▼   @mcv/storage              │    │
│  │  (Tenants/RBAC) (Audit/Events)    (Files/Buckets)           │    │
│  └──────────────────────────────┬──────────────────────────────┘    │
│                                 │                                    │
│  ┌──────────────────────────────┼──────────────────────────────┐    │
│  │  TIER 2 — Infrastructure     │                               │    │
│  │  @mcv/database  @mcv/cache    ▼   @mcv/queue                │    │
│  │  (Supabase/PG)  (Redis)           (Redpanda/Kafka)          │    │
│  └──────────────────────────────┬──────────────────────────────┘    │
│                                 │                                    │
│  ┌──────────────────────────────┼──────────────────────────────┐    │
│  │  TIER 1 — Kernel             ▼                               │    │
│  │  @mcv/kernel (Config, Schema Utilities, Shared Types, DI)   │    │
│  └─────────────────────────────────────────────────────────────┘    │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

### Dependency Direction

- **Upward (consumes):** `@mcv/kernel` (Tier 1), `@mcv/identity` (Tier 3), `@mcv/fabric` (Tier 3), `@mcv/finance` (Tier 4), `@mcv/notifications` (Tier 4), `@mcv/documents` (Tier 4)
- **Downward (consumed by):** `@mcv/treasury` (Tier 4 — reads venture/entity info for funding flows), `@mcv/agentic-os` (Tier 6 — AI agents query portfolio data), `@mcv/web` (Tier 7 — portfolio UI pages)

### Data Flow Position

```
@mcv/identity ──────┐
(Tenant creation)    │
                     ▼
@mcv/finance ──► @mcv/portfolio ──► @mcv/fabric
(P&L, budgets)   (Ventures,         (Audit events,
                  Entities,          notifications)
                  Grants,
@mcv/treasury ◄─  Strategy)  ──► @mcv/agentic-os
(Funding flows)                    (AI agents query
                                    portfolio state)
```

---

## Key Interfaces & Types

### Core Service Interfaces

```typescript
// ═══════════════════════════════════════════════════════════════
// VENTURE SERVICE
// ═══════════════════════════════════════════════════════════════

export class VentureService {
  // Venture CRUD
  createVenture(input: CreateVentureInput): Promise<Venture>;
  updateVenture(ventureId: string, input: UpdateVentureInput): Promise<Venture>;
  getVenture(ventureId: string): Promise<Venture | null>;
  getVentureBySlug(slug: string): Promise<Venture | null>;
  listVentures(options?: VentureListOptions): Promise<Venture[]>;
  deleteVenture(ventureId: string): Promise<void>;

  // Lifecycle Transitions
  approveVenture(ventureId: string, approvedBy: string): Promise<Venture>;
  launchVenture(ventureId: string): Promise<Venture>;
  scaleVenture(ventureId: string): Promise<Venture>;
  hibernateVenture(ventureId: string, reason: string): Promise<Venture>;
  reactivateVenture(ventureId: string): Promise<Venture>;
  sunsetVenture(ventureId: string, reason: string, sunsetDate: Date): Promise<Venture>;
  archiveVenture(ventureId: string): Promise<Venture>;

  // Configuration
  getConfig(ventureId: string): Promise<VentureConfig>;
  updateConfig(ventureId: string, config: Partial<VentureConfig>): Promise<VentureConfig>;
  toggleFeature(ventureId: string, feature: string, enabled: boolean): Promise<VentureConfig>;
  setMaintenanceMode(ventureId: string, enabled: boolean, message?: string): Promise<VentureConfig>;

  // Health Monitoring
  recordHealthSnapshot(ventureId: string, snapshot: VentureHealthSnapshot): Promise<HealthSnapshot>;
  getLatestHealth(ventureId: string): Promise<HealthSnapshot | null>;
  getHealthHistory(ventureId: string, options?: HealthHistoryOptions): Promise<HealthSnapshot[]>;
  getHealthHeatmap(): Promise<HealthHeatmapData>;

  // KPI Management
  createKpi(ventureId: string, input: KpiDefinition): Promise<VentureKpi>;
  recordKpi(kpiId: string, record: VentureKpiRecord): Promise<KpiRecord>;
  getKpiDashboard(ventureId: string, period?: string): Promise<KpiDashboard>;
  getKpiTrends(ventureId: string, kpiSlug: string, periods?: number): Promise<KpiTrend>;

  // Team Management
  assignTeamMember(input: TeamAssignmentInput): Promise<TeamAssignment>;
  removeTeamMember(ventureId: string, userId: string): Promise<void>;
  updateAllocation(assignmentId: string, allocation: number): Promise<TeamAssignment>;
  getTeamRoster(ventureId: string): Promise<TeamAssignment[]>;
  getPersonAllocations(userId: string): Promise<PersonAllocation[]>;

  // Tech Stack
  registerTechnology(ventureId: string, entry: TechStackEntry): Promise<TechStack>;
  deprecateTechnology(techId: string, migrationTarget?: string): Promise<TechStack>;
  getTechStack(ventureId: string): Promise<TechStack[]>;
  getTechStackMatrix(): Promise<TechStackMatrix>;

  // Deployments
  registerDeployment(input: DeploymentConfigInput): Promise<Deployment>;
  updateDeploymentStatus(deploymentId: string, status: string, commit?: string): Promise<Deployment>;
  runHealthCheck(deploymentId: string): Promise<HealthCheckResult>;
  getDeploymentMatrix(): Promise<DeploymentMatrix>;

  // Milestones
  createMilestone(ventureId: string, input: MilestoneInput): Promise<Milestone>;
  updateMilestoneProgress(milestoneId: string, percent: number, notes?: string): Promise<Milestone>;
  completeMilestone(milestoneId: string, evidence?: object[]): Promise<Milestone>;
  getMilestoneTimeline(ventureId: string): Promise<Milestone[]>;
}

// ═══════════════════════════════════════════════════════════════
// ENTITY SERVICE
// ═══════════════════════════════════════════════════════════════

export class EntityService {
  createEntity(input: CreateEntityInput): Promise<LegalEntity>;
  updateEntity(entityId: string, input: UpdateEntityInput): Promise<LegalEntity>;
  getEntity(entityId: string): Promise<LegalEntity | null>;
  listEntities(options?: EntityListOptions): Promise<LegalEntity[]>;
  dissolveEntity(entityId: string, reason: string, effectiveDate: Date): Promise<LegalEntity>;

  addChildEntity(parentId: string, childId: string, input: HierarchyInput): Promise<EntityHierarchy>;
  removeChildEntity(parentId: string, childId: string): Promise<void>;
  getEntityTree(rootEntityId?: string): Promise<EntityTreeNode>;
  getFullHierarchy(): Promise<EntityTreeNode>;

  recordOwnership(entityId: string, input: OwnershipStructureInput): Promise<OwnershipStructure>;
  getCapTable(entityId: string): Promise<CapTable>;

  appointOfficer(entityId: string, input: OfficerInput): Promise<EntityOfficer>;
  getSignatories(entityId: string): Promise<EntityOfficer[]>;

  uploadDocument(entityId: string, input: CorporateDocumentInput): Promise<CorporateDocument>;
  recordComplianceCheck(entityId: string, input: ComplianceCheckInput): Promise<ComplianceRecord>;
  getComplianceMatrix(): Promise<ComplianceMatrix>;
  getUpcomingDeadlines(daysAhead?: number): Promise<ComplianceRecord[]>;
}

// ═══════════════════════════════════════════════════════════════
// GRANT SERVICE
// ═══════════════════════════════════════════════════════════════

export class GrantService {
  createGrant(input: CreateGrantInput): Promise<Grant>;
  getGrant(grantId: string): Promise<Grant | null>;
  listGrants(options?: GrantListOptions): Promise<Grant[]>;

  qualifyGrant(grantId: string, notes?: string): Promise<Grant>;
  applyForGrant(grantId: string): Promise<Grant>;
  recordAward(grantId: string, amount: string, date: Date): Promise<Grant>;
  activateGrant(grantId: string, startDate: Date, endDate: Date): Promise<Grant>;
  completeGrant(grantId: string): Promise<Grant>;
  closeGrant(grantId: string): Promise<Grant>;

  createMilestone(grantId: string, input: GrantMilestoneInput): Promise<GrantMilestone>;
  verifyMilestone(milestoneId: string, verifiedBy: string): Promise<GrantMilestone>;

  requestDisbursement(grantId: string, input: DisbursementInput): Promise<GrantDisbursement>;
  recordReceipt(disbursementId: string, date: Date, ref: string): Promise<GrantDisbursement>;
  getDisbursementSummary(grantId: string): Promise<DisbursementSummary>;

  createGrantBudget(grantId: string, input: GrantBudgetInput): Promise<GrantBudgetResult>;
  recordExpenditure(lineId: string, amount: string, desc: string): Promise<GrantBudgetLine>;
  getBudgetVsActual(grantId: string): Promise<GrantBudgetComparison>;

  getUpcomingDeadlines(daysAhead?: number): Promise<GrantDeadline[]>;
  getGrantPipeline(): Promise<GrantPipelineData>;
  getFundingForecast(months?: number): Promise<FundingForecast>;
}

// ═══════════════════════════════════════════════════════════════
// STRATEGY SERVICE
// ═══════════════════════════════════════════════════════════════

export class StrategyService {
  createObjective(input: CreateObjectiveInput): Promise<StrategicObjective>;
  createKeyResult(objectiveId: string, input: CreateKeyResultInput): Promise<KeyResult>;
  checkinKeyResult(keyResultId: string, input: KeyResultCheckinInput): Promise<KeyResultCheckin>;
  getOkrTree(options?: OkrTreeOptions): Promise<OkrTreeNode[]>;

  createAnalysis(ventureId: string, input: CompetitiveAnalysisInput): Promise<CompetitiveAnalysis>;
  addCompetitor(analysisId: string, input: CompetitorProfileInput): Promise<CompetitorProfile>;

  createMarketSizing(ventureId: string, input: MarketSizingInput): Promise<MarketSizing>;
  compareMarketSizings(ventureIds: string[]): Promise<MarketSizingComparison>;

  scoreVenture(ventureId: string, input: VentureScorecardInput): Promise<VentureScorecard>;
  getVentureRankings(period: string): Promise<VentureRanking[]>;

  createThesis(ventureId: string, input: InvestmentThesisInput): Promise<InvestmentThesis>;
  validateThesis(thesisId: string, evidence: string): Promise<InvestmentThesis>;
  invalidateThesis(thesisId: string, reason: string): Promise<InvestmentThesis>;

  recordPivot(ventureId: string, input: PivotDecisionInput): Promise<PivotDecision>;
  getPivotAnalysis(): Promise<PivotAnalysisReport>;

  createDashboard(input: DashboardInput): Promise<PortfolioDashboard>;
  addWidget(dashboardId: string, input: WidgetInput): Promise<DashboardWidget>;
  getDefaultDashboard(): Promise<PortfolioDashboard & { widgets: DashboardWidget[] }>;
}

// ═══════════════════════════════════════════════════════════════
// AGGREGATION SERVICE
// ═══════════════════════════════════════════════════════════════

export class PortfolioAggregationService {
  getPortfolioSummary(): Promise<PortfolioSummary>;
  compareVentures(ventureIds: string[], metrics: string[]): Promise<VentureComparison>;
  getPortfolioHealthReport(): Promise<PortfolioHealthReport>;
  getAllocationAnalysis(): Promise<AllocationAnalysis>;
  getConsolidatedMetrics(period: string): Promise<ConsolidatedMetrics>;
}
```

### Core Type Definitions

```typescript
// ═══════════════════════════════════════════════════════════════
// VENTURE TYPES
// ═══════════════════════════════════════════════════════════════

export type VentureStatus =
  | 'concept' | 'setup' | 'active' | 'scaling'
  | 'hibernating' | 'sunset' | 'archived';

export type VentureStage =
  | 'ideation' | 'mvp' | 'growth' | 'maturity' | 'decline';

export type VenturePriority =
  | 'critical' | 'high' | 'medium' | 'low' | 'experimental';

export type VentureHealthStatus =
  | 'healthy' | 'warning' | 'critical' | 'unknown';

export interface CreateVentureInput {
  slug: string;
  name: string;
  legalName?: string;
  description?: string;
  mission?: string;
  tagline?: string;
  domain?: string;
  logoUrl?: string;
  brandColors?: { primary: string; secondary: string };
  industry: string;
  vertical?: string;
  priority?: VenturePriority;
  timezone?: string;
  currency?: string;
  metadata?: Record<string, unknown>;
}

export interface VentureHealthSnapshot {
  overallHealth: VentureHealthStatus;
  healthScore: number; // 0-100
  dimensions: {
    financial: HealthDimension;
    product: HealthDimension;
    team: HealthDimension;
    market: HealthDimension;
    compliance: HealthDimension;
  };
  alerts?: HealthAlert[];
  generatedBy?: 'system' | 'manual' | 'agent';
  notes?: string;
}

export interface HealthDimension {
  score: number; // 0-100
  trend: 'up' | 'stable' | 'down';
  [key: string]: unknown; // Dimension-specific metrics
}

export interface HealthAlert {
  type: string;
  severity: 'info' | 'warning' | 'critical';
  message: string;
}

// ═══════════════════════════════════════════════════════════════
// ENTITY TYPES
// ═══════════════════════════════════════════════════════════════

export type EntityType =
  | 'c_corp' | 's_corp' | 'llc' | 'lp' | 'llp'
  | 'sole_prop' | 'trust' | 'holding';

export type EntityStatus =
  | 'active' | 'inactive' | 'dissolved' | 'suspended' | 'pending_formation';

export type ComplianceStatus =
  | 'compliant' | 'pending' | 'overdue' | 'waived' | 'not_applicable';

export interface CreateEntityInput {
  ventureId?: string;
  name: string;
  legalName: string;
  dbaNames?: string[];
  entityType: EntityType;
  ein?: string;
  formationDate?: Date;
  formationState?: string;
  formationCountry?: string;
  fiscalYearEnd?: string;
  taxClassification?: string;
  registeredAddress?: Address;
  isHoldingCompany?: boolean;
  isOperating?: boolean;
}

export interface EntityTreeNode {
  entity: LegalEntity;
  ownershipPercent?: number;
  isControlling?: boolean;
  children: EntityTreeNode[];
}

// ═══════════════════════════════════════════════════════════════
// GRANT TYPES
// ═══════════════════════════════════════════════════════════════

export type GrantStatus =
  | 'discovered' | 'qualified' | 'applied' | 'awarded' | 'declined'
  | 'withdrawn' | 'active' | 'on_hold' | 'completed' | 'terminated'
  | 'closed';

export type ApplicationStatus =
  | 'drafting' | 'internal_review' | 'submitted' | 'under_review'
  | 'revision_requested' | 'awarded' | 'declined';

export type MilestoneStatus =
  | 'not_started' | 'in_progress' | 'completed' | 'overdue' | 'waived';

export interface CreateGrantInput {
  ventureId?: string;
  entityId?: string;
  title: string;
  fundingSource: string;
  fundingAgency?: string;
  program?: string;
  category: 'federal' | 'state' | 'private' | 'foundation' | 'corporate';
  description?: string;
  purpose?: string;
  requestedAmount?: string;
  applicationDeadline?: Date;
  cfda?: string;
  grantUrl?: string;
  tags?: string[];
}

// ═══════════════════════════════════════════════════════════════
// STRATEGY TYPES
// ═══════════════════════════════════════════════════════════════

export type ObjectiveStatus =
  | 'draft' | 'active' | 'completed' | 'cancelled' | 'deferred';

export type KeyResultType =
  | 'numeric' | 'percentage' | 'currency' | 'boolean' | 'milestone';

export type PivotType =
  | 'customer_segment' | 'value_proposition' | 'revenue_model'
  | 'channel' | 'technology' | 'product' | 'market' | 'platform';

export interface CreateObjectiveInput {
  ventureId?: string; // null = consortium-level
  parentObjectiveId?: string;
  title: string;
  description?: string;
  level: 'consortium' | 'venture' | 'team';
  timeframe: string;
  startDate?: Date;
  endDate?: Date;
  ownerId?: string;
  priority?: 'critical' | 'high' | 'medium' | 'low';
}

export interface VentureScorecardInput {
  period: string;
  scores: {
    financial: ScorecardDimensionInput;
    market: ScorecardDimensionInput;
    product: ScorecardDimensionInput;
    team: ScorecardDimensionInput;
    strategic: ScorecardDimensionInput;
  };
  notes?: string;
}

export interface ScorecardDimensionInput {
  score: number; // 0-100
  weight: number; // 0.00-1.00
  details: Record<string, unknown>;
}

// ═══════════════════════════════════════════════════════════════
// AGGREGATION TYPES
// ═══════════════════════════════════════════════════════════════

export interface PortfolioSummary {
  totalVentures: number;
  activeVentures: number;
  totalRevenue: string;
  totalBurn: string;
  healthDistribution: Record<VentureHealthStatus, number>;
  topVenturesByScore: VentureRanking[];
  activeGrants: number;
  totalGrantFunding: string;
  okrProgress: number; // 0-100 consortium-level
  lastUpdated: Date;
}

export interface VentureComparison {
  ventures: string[];
  metrics: ComparisonMetric[];
  period: string;
  generatedAt: Date;
}

export type PortfolioHealthGrade = 'A' | 'B' | 'C' | 'D' | 'F';
export type TrendDirection = 'up' | 'stable' | 'down';
```

### React Client Hooks

```typescript
// Venture hooks
export function useVentures(options?: VentureListOptions): UseQueryResult<Venture[]>;
export function useVentureDetail(ventureId: string): UseQueryResult<Venture>;
export function useVentureHealth(ventureId: string): UseQueryResult<HealthSnapshot>;
export function useVentureKpis(ventureId: string, period?: string): UseQueryResult<KpiDashboard>;
export function useVentureTeam(ventureId: string): UseQueryResult<TeamAssignment[]>;

// Entity hooks
export function useLegalEntities(options?: EntityListOptions): UseQueryResult<LegalEntity[]>;
export function useEntityHierarchy(rootId?: string): UseQueryResult<EntityTreeNode>;
export function useEntityCompliance(entityId: string): UseQueryResult<ComplianceRecord[]>;

// Grant hooks
export function useGrants(options?: GrantListOptions): UseQueryResult<Grant[]>;
export function useGrantLifecycle(grantId: string): UseQueryResult<GrantLifecycleView>;
export function useGrantBudget(grantId: string): UseQueryResult<GrantBudgetComparison>;

// Strategy hooks
export function useStrategicObjectives(options?: OkrTreeOptions): UseQueryResult<StrategicObjective[]>;
export function useOkrProgress(objectiveId: string): UseQueryResult<OkrProgressReport>;
export function useVentureScorecards(period?: string): UseQueryResult<VentureScorecard[]>;
export function usePortfolioDashboard(dashboardId?: string): UseQueryResult<DashboardData>;
export function usePortfolioSummary(): UseQueryResult<PortfolioSummary>;
export function useCompetitiveLandscape(ventureId: string): UseQueryResult<CompetitiveAnalysis>;
```

### React Client Components

```typescript
// Venture components
export const VentureGrid: React.FC<{ ventures: Venture[] }>;
export const VentureCard: React.FC<{ venture: Venture }>;
export const VentureDetailPanel: React.FC<{ ventureId: string }>;
export const VentureHealthDashboard: React.FC<{ ventureId: string }>;
export const VentureKpiTracker: React.FC<{ ventureId: string }>;
export const VentureTeamRoster: React.FC<{ ventureId: string }>;
export const TechStackViewer: React.FC<{ ventureId: string }>;

// Entity components
export const EntityHierarchyTree: React.FC<{ rootEntityId?: string }>;
export const EntityComplianceMatrix: React.FC;
export const CorporateDocumentVault: React.FC<{ entityId: string }>;

// Grant components
export const GrantPipeline: React.FC<{ ventureId?: string }>;
export const GrantTimelineView: React.FC<{ grantId: string }>;
export const GrantBudgetTracker: React.FC<{ grantId: string }>;
export const GrantComplianceCalendar: React.FC<{ grantId?: string }>;

// Strategy components
export const OkrTreeView: React.FC<{ timeframe?: string }>;
export const VentureScorecardMatrix: React.FC<{ period?: string }>;
export const CompetitorMap: React.FC<{ ventureId: string }>;
export const MarketSizingChart: React.FC<{ ventureId: string }>;
export const PortfolioDashboard: React.FC<{ dashboardId?: string }>;
export const ConsolidatedMetricsPanel: React.FC;
export const InvestmentThesisBoard: React.FC<{ ventureId?: string }>;
export const PivotDecisionLog: React.FC<{ ventureId?: string }>;
```

---

## Configuration

### Environment Variables

```bash
# ═══════════════════════════════════════════════════════════════
# DATABASE
# ═══════════════════════════════════════════════════════════════
DATABASE_URL=postgresql://user:pass@host:5432/mcv
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# ═══════════════════════════════════════════════════════════════
# ENCRYPTION (for EIN, compensation data)
# ═══════════════════════════════════════════════════════════════
PORTFOLIO_ENCRYPTION_KEY=base64-encoded-256-bit-key
PORTFOLIO_ENCRYPTION_ALGORITHM=aes-256-gcm

# ═══════════════════════════════════════════════════════════════
# EVENT BUS (Redpanda/Kafka)
# ═══════════════════════════════════════════════════════════════
REDPANDA_BROKERS=localhost:9092
PORTFOLIO_EVENTS_TOPIC=portfolio.events
PORTFOLIO_CONSUMER_GROUP=portfolio-service

# ═══════════════════════════════════════════════════════════════
# REDIS (caching, rate limiting)
# ═══════════════════════════════════════════════════════════════
REDIS_URL=redis://localhost:6379
PORTFOLIO_CACHE_TTL=300  # seconds

# ═══════════════════════════════════════════════════════════════
# OPENROUTER AI (for AI-powered analysis)
# ═══════════════════════════════════════════════════════════════
OPENROUTER_API_KEY=sk-or-...
PORTFOLIO_AI_MODEL=anthropic/claude-sonnet-4-20250514

# ═══════════════════════════════════════════════════════════════
# FILE STORAGE
# ═══════════════════════════════════════════════════════════════
SUPABASE_STORAGE_BUCKET=portfolio-documents

# ═══════════════════════════════════════════════════════════════
# CRON SCHEDULES (overridable)
# ═══════════════════════════════════════════════════════════════
PORTFOLIO_HEALTH_SNAPSHOT_CRON=0 */6 * * *      # Every 6 hours
PORTFOLIO_KPI_REFRESH_CRON=0 6 * * *            # Daily 06:00 UTC
PORTFOLIO_COMPLIANCE_CHECK_CRON=0 9 * * 1        # Weekly Monday 09:00 UTC
PORTFOLIO_GRANT_DEADLINE_CRON=0 8 * * *          # Daily 08:00 UTC
PORTFOLIO_QUARTERLY_REVIEW_CRON=0 0 1 1,4,7,10 * # Quarterly
PORTFOLIO_DASHBOARD_CACHE_CRON=*/5 * * * *       # Every 5 minutes
```

### Package Configuration

```typescript
// packages/portfolio/src/config.ts
import { z } from 'zod';

export const portfolioConfigSchema = z.object({
  // Health monitoring
  healthWeights: z.object({
    financial: z.number().min(0).max(1).default(0.30),
    product: z.number().min(0).max(1).default(0.25),
    team: z.number().min(0).max(1).default(0.20),
    market: z.number().min(0).max(1).default(0.15),
    compliance: z.number().min(0).max(1).default(0.10),
  }).refine(w => Math.abs(w.financial + w.product + w.team + w.market + w.compliance - 1.0) < 0.001, {
    message: 'Health weights must sum to 1.0',
  }),

  // Scorecard tiers
  scorecardTiers: z.object({
    A: z.object({ min: z.number().default(80), max: z.number().default(100) }),
    B: z.object({ min: z.number().default(60), max: z.number().default(79) }),
    C: z.object({ min: z.number().default(40), max: z.number().default(59) }),
    D: z.object({ min: z.number().default(0), max: z.number().default(39) }),
  }),

  // Compliance
  complianceAlertDays: z.number().default(30),
  competitiveAnalysisFreshnessDays: z.number().default(90),

  // Grant defaults
  grantDefaultReminderDays: z.array(z.number()).default([30, 14, 7, 3, 1]),

  // Dashboard limits
  maxDashboardsPerUser: z.number().default(10),
  maxWidgetsPerDashboard: z.number().default(20),
  defaultDashboardRefreshSeconds: z.number().default(300),

  // Cache
  cacheTtlSeconds: z.number().default(300),
  healthSnapshotCacheTtl: z.number().default(600),

  // AI
  aiEnabled: z.boolean().default(true),
  aiModel: z.string().default('anthropic/claude-sonnet-4-20250514'),
});

export type PortfolioConfig = z.infer<typeof portfolioConfigSchema>;
```

---

## Dependencies

### Upstream Dependencies (packages this package consumes)

| Package | Tier | Purpose | Integration Points |
|---------|------|---------|-------------------|
| **@mcv/kernel** | 1 | Database connection, schema utilities, shared config, dependency injection | `db` connection, `createSchema()`, `envConfig`, DI container |
| **@mcv/identity** | 3 | Tenant management, RBAC, user references | `createTenant()` on venture approval, `userId` references in assignments/officers, RBAC policy enforcement for RLS |
| **@mcv/fabric** | 3 | Audit logging, event bus, notification dispatch | `emitEvent()` for all state changes, `auditLog()` for lifecycle transitions, event propagation to consumers |
| **@mcv/finance** | 4 | Per-venture P&L, budgets, expense tracking | Health snapshot pulls financial data (revenue, burn, runway), KPI auto-refresh sources MRR/ARR from finance |
| **@mcv/documents** | 4 | PDF generation, file storage | Corporate document vault storage, grant document management, PDF report generation |
| **@mcv/notifications** | 4 | Email, SMS, push notifications | Compliance deadline alerts, grant deadline reminders, health alert escalations, OKR check-in reminders |

### Downstream Dependencies (packages that consume this package)

| Package | Tier | Purpose | What They Read |
|---------|------|---------|---------------|
| **@mcv/treasury** | 4 | Funding flows, wallet management, EDGE token ops | Venture/entity info for funding flow routing, grant disbursement records for treasury reconciliation |
| **@mcv/agentic-os** | 6 | AI agents (NAOS Strategist, Portfolio Analyst) | Full portfolio state for AI-driven insights, venture health for automated recommendations, grant pipeline for AI matching |
| **@mcv/web** | 7 | Next.js application UI | All portfolio data via client hooks and components, portfolio dashboards, venture cards, grant pipelines |

### External Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| `drizzle-orm` | `^0.38.x` | ORM for PostgreSQL schema definitions and queries |
| `zod` | `^3.x` | Runtime input validation for all service methods |
| `date-fns` | `^3.x` | Date manipulation for deadlines, periods, schedules |
| `@supabase/supabase-js` | `^2.x` | Supabase client for RLS, storage, and realtime |

### Dependency Graph

```
                    @mcv/kernel (Tier 1)
                         │
              ┌──────────┼──────────┐
              │          │          │
         @mcv/identity   │     @mcv/fabric
         (Tier 3)        │     (Tier 3)
              │          │          │
              │    @mcv/finance     │
              │    (Tier 4)        │
              │          │          │
              ├──────────┼──────────┤
              │          │          │
              │    @mcv/documents   │
              │    @mcv/notifications
              │    (Tier 4)        │
              │          │          │
              └──────────┼──────────┘
                         │
                ╔════════╧════════╗
                ║  @mcv/portfolio  ║  ◄── Tier 5
                ║  (THIS PACKAGE)  ║
                ╚════════╤════════╝
                         │
              ┌──────────┼──────────┐
              │          │          │
         @mcv/treasury   │   @mcv/agentic-os
         (Tier 4)        │     (Tier 6)
                         │
                      @mcv/web
                      (Tier 7)
```

---

## Multi-Tenant Design

### Tenant Isolation Model

The `@mcv/portfolio` package operates in a **hybrid multi-tenant model**:

1. **Consortium-Level Data** — Ventures, entities, consortium-level OKRs, portfolio dashboards, and aggregation data are accessible only to users with `super_admin` or `portfolio_admin` roles. This data spans all tenants.

2. **Venture-Scoped Data** — KPIs, health snapshots, team assignments, tech stacks, deployments, milestones, venture-level grants, venture-level OKRs, competitive analyses, and scorecards are scoped to the venture's tenant via `ventureId`. Venture admins see only their assigned ventures.

3. **Cross-Venture Views** — Aggregation queries (portfolio summaries, health heatmaps, comparison matrices) are restricted to `super_admin` and `portfolio_admin` roles. These views join data across all tenants.

### RLS Policy Structure

```sql
-- ═══════════════════════════════════════════════════════════════
-- Venture-scoped tables: Super admins see all; venture admins see their ventures
-- ═══════════════════════════════════════════════════════════════

CREATE POLICY "portfolio_ventures_select" ON portfolio_ventures
  FOR SELECT USING (
    auth.role() = 'super_admin'
    OR auth.role() = 'portfolio_admin'
    OR id IN (
      SELECT venture_id FROM portfolio_venture_team_assignments
      WHERE user_id = auth.uid() AND is_active = true
    )
  );

CREATE POLICY "portfolio_ventures_insert" ON portfolio_ventures
  FOR INSERT WITH CHECK (
    auth.role() IN ('super_admin', 'portfolio_admin')
  );

CREATE POLICY "portfolio_ventures_update" ON portfolio_ventures
  FOR UPDATE USING (
    auth.role() = 'super_admin'
    OR auth.role() = 'portfolio_admin'
    OR (
      auth.role() = 'venture_admin'
      AND id IN (
        SELECT venture_id FROM portfolio_venture_team_assignments
        WHERE user_id = auth.uid() AND role = 'lead' AND is_active = true
      )
    )
  );

-- ═══════════════════════════════════════════════════════════════
-- Entity tables: Super admins and entity admins only
-- ═══════════════════════════════════════════════════════════════

CREATE POLICY "portfolio_entities_select" ON portfolio_legal_entities
  FOR SELECT USING (
    auth.role() IN ('super_admin', 'portfolio_admin', 'entity_admin')
    OR venture_id IN (
      SELECT venture_id FROM portfolio_venture_team_assignments
      WHERE user_id = auth.uid() AND is_active = true
    )
  );

-- ═══════════════════════════════════════════════════════════════
-- Grant tables: Venture-scoped with portfolio admin override
-- ═══════════════════════════════════════════════════════════════

CREATE POLICY "portfolio_grants_select" ON portfolio_grants
  FOR SELECT USING (
    auth.role() IN ('super_admin', 'portfolio_admin')
    OR venture_id IN (
      SELECT venture_id FROM portfolio_venture_team_assignments
      WHERE user_id = auth.uid() AND is_active = true
    )
  );
```

### Tenant Creation Flow

When a venture is approved (`concept → setup`), the portfolio package orchestrates tenant creation:

```typescript
// Internal flow in VentureService.approveVenture()
async approveVenture(ventureId: string, approvedBy: string): Promise<Venture> {
  const venture = await this.getVenture(ventureId);
  if (!venture) throw new PortfolioError('PORTFOLIO_VENTURE_NOT_FOUND');
  if (venture.status !== 'concept') {
    throw new PortfolioError('PORTFOLIO_INVALID_TRANSITION', {
      from: venture.status,
      to: 'setup',
    });
  }

  // Create tenant in @mcv/identity
  const tenant = await identityService.createTenant({
    slug: venture.slug,
    name: venture.name,
    type: 'venture',
    sourcePackage: '@mcv/portfolio',
    sourceId: ventureId,
  });

  // Update venture with tenant link
  const updated = await db.update(ventures)
    .set({
      status: 'setup',
      tenantId: tenant.id,
      updatedAt: new Date(),
    })
    .where(eq(ventures.id, ventureId))
    .returning();

  // Emit audit event
  await fabricService.emitEvent({
    type: 'portfolio.ventures.approved',
    payload: {
      ventureId,
      tenantId: tenant.id,
      approvedBy,
      previousStatus: 'concept',
      newStatus: 'setup',
    },
  });

  return updated[0];
}
```

---

## Security

### Authentication & Authorization

| Role | Ventures | Entities | Grants | Strategy | Aggregation |
|------|----------|----------|--------|----------|-------------|
| `super_admin` | Full CRUD + all ventures | Full CRUD + all entities | Full CRUD + all grants | Full CRUD + all OKRs | Full access |
| `portfolio_admin` | Full CRUD + all ventures | Full CRUD + all entities | Full CRUD + all grants | Full CRUD + all OKRs | Full access |
| `entity_admin` | Read own ventures | Full CRUD + assigned entities | Read own grants | Read own OKRs | No access |
| `venture_admin` | CRUD own ventures | Read linked entities | CRUD own grants | CRUD own OKRs | No access |
| `venture_lead` | Read/update own venture | Read linked entity | Read/update own grants | Read/update own OKRs | No access |
| `team_member` | Read own venture | No access | Read own grants | Read own OKRs | No access |
| `read_only` | Read own venture | No access | Read own grants | Read own OKRs | No access |

### Data Encryption

- **EIN Encryption:** Federal EIN values in `portfolio_legal_entities.ein` are encrypted at rest using AES-256-GCM via `@mcv/kernel/config/secrets`. Decryption requires `super_admin` or `entity_admin` role.
- **Compensation Data:** Officer compensation details in `portfolio_entity_officers.compensationDetails` are encrypted using the same AES-256-GCM scheme. Accessible only to `super_admin`.
- **Document Access Control:** Corporate documents have configurable `accessLevel` (super_admin, admin, manager, all). The API enforces access checks before returning document URLs.
- **Transport Security:** All API calls require TLS 1.3. Supabase connections use encrypted connections by default.

### Input Validation

All service methods validate inputs with Zod schemas before database operations:

```typescript
const createVentureSchema = z.object({
  slug: z.string().min(2).max(50).regex(/^[a-z0-9-]+$/),
  name: z.string().min(1).max(200),
  legalName: z.string().max(500).optional(),
  description: z.string().max(5000).optional(),
  industry: z.string().min(1).max(100),
  priority: z.enum(['critical', 'high', 'medium', 'low', 'experimental']).optional(),
  // ... all fields validated
});

// Numeric precision validation
const amountSchema = z.string().regex(/^\d+(\.\d{1,4})?$/, 'Invalid amount format');
const percentSchema = z.number().min(0).max(100);
```

### Audit Trail

Every state-changing operation emits an audit event to `@mcv/fabric`:

```typescript
// Event structure
interface PortfolioAuditEvent {
  type: string;                    // e.g., 'portfolio.ventures.status_changed'
  timestamp: Date;
  actorId: string;                 // User who performed the action
  actorRole: string;               // Role at time of action
  resourceType: string;            // 'venture' | 'entity' | 'grant' | 'objective'
  resourceId: string;              // ID of affected resource
  action: string;                  // 'create' | 'update' | 'delete' | 'transition'
  before: Record<string, unknown>; // State before change
  after: Record<string, unknown>;  // State after change
  metadata: Record<string, unknown>;
}
```

**Audited Operations:**
- All lifecycle transitions (venture status, grant status, objective status)
- Entity hierarchy changes (add/remove child, ownership changes)
- Compliance filings and status changes
- Grant award/disbursement events
- Team assignment changes
- Configuration changes (feature toggles, maintenance mode)
- Scorecard submissions and ranking changes
- Investment thesis validation/invalidation
- Pivot decisions

---

## Performance

### Caching Strategy

```typescript
// Redis cache keys
const CACHE_KEYS = {
  ventureList: 'portfolio:ventures:list',                    // TTL: 5 min
  ventureDetail: (id: string) => `portfolio:ventures:${id}`, // TTL: 5 min
  healthHeatmap: 'portfolio:health:heatmap',                 // TTL: 10 min
  healthSnapshot: (id: string) => `portfolio:health:${id}`,  // TTL: 10 min
  complianceMatrix: 'portfolio:compliance:matrix',           // TTL: 1 hour
  grantPipeline: 'portfolio:grants:pipeline',                // TTL: 5 min
  portfolioSummary: 'portfolio:aggregation:summary',         // TTL: 5 min
  dashboardWidget: (id: string) => `portfolio:widget:${id}`, // TTL: per widget config
  entityHierarchy: 'portfolio:entities:hierarchy',           // TTL: 30 min
  ventureRankings: (period: string) => `portfolio:rankings:${period}`, // TTL: 1 hour
};
```

### Database Optimization

- **Indexes:** Composite indexes on `(venture_id, status)`, `(venture_id, period)`, `(entity_id, jurisdiction)`, `(grant_id, status)`, `(objective_id, status)` for all major query patterns.
- **Materialized Views:** Cross-venture aggregation queries use materialized views refreshed every 5 minutes by the dashboard cache cron job.
- **Pagination:** All `list*` methods support cursor-based pagination with configurable page sizes (default: 50, max: 200).
- **Selective Loading:** Service methods accept `include` options to control relation loading depth, preventing N+1 queries.

### Performance Targets

| Operation | Target Latency (p95) | Notes |
|-----------|---------------------|-------|
| `getVenture` | < 50ms | Single row + cache |
| `listVentures` | < 100ms | Paginated, indexed |
| `recordHealthSnapshot` | < 200ms | Insert + cache invalidation |
| `getHealthHeatmap` | < 300ms | Aggregation across 9 ventures, cached |
| `getPortfolioSummary` | < 500ms | Cross-venture aggregation, cached |
| `getComplianceMatrix` | < 400ms | All entities × all jurisdictions, cached |
| `getGrantPipeline` | < 200ms | Grouped by status, cached |
| `getOkrTree` | < 300ms | Recursive tree with progress, cached |
| `scoreVenture` | < 500ms | Weighted calculation + rank update |
| `getFullHierarchy` | < 200ms | Recursive CTE, cached |

---

## Deployment & Operations

### Cron Jobs

| Job | Schedule | Description | Owner |
|-----|----------|-------------|-------|
| `portfolio.health_snapshot` | `0 */6 * * *` | Collects automated health snapshots for all active ventures | System |
| `portfolio.kpi_refresh` | `0 6 * * *` | Pulls latest KPI data from integrated sources | System |
| `portfolio.compliance_check` | `0 9 * * 1` | Checks entity good standing, flags overdue reports | System |
| `portfolio.grant_deadlines` | `0 8 * * *` | Scans grant deadlines, sends approaching notifications | System |
| `portfolio.grant_overdue_check` | `0 10 * * *` | Identifies overdue milestones/reports, escalates | System |
| `portfolio.quarterly_review` | `0 0 1 1,4,7,10 *` | Triggers scoring, portfolio summary, OKR reminders | System |
| `portfolio.competitive_freshness` | `0 14 * * 5` | Flags stale competitive analyses (>90 days) | System |
| `portfolio.dashboard_cache_refresh` | `*/5 * * * *` | Refreshes expired widget cached data | System |

### Monitoring & Observability

**Health Check Endpoint:**
```
GET /api/portfolio/health
```
Returns:
```json
{
  "status": "healthy",
  "version": "1.0.0",
  "database": "connected",
  "redis": "connected",
  "eventBus": "connected",
  "lastHealthSnapshot": "2026-02-09T04:00:00Z",
  "activeVentures": 7,
  "pendingDeadlines": 3,
  "overdueCompliance": 0
}
```

**Key Metrics (exported to observability platform):**

| Metric | Type | Description |
|--------|------|-------------|
| `portfolio.ventures.total` | Gauge | Total ventures by status |
| `portfolio.ventures.health_score` | Gauge | Per-venture health score |
| `portfolio.entities.compliance_overdue` | Gauge | Count of overdue compliance records |
| `portfolio.grants.pipeline_value` | Gauge | Total value in grant pipeline by status |
| `portfolio.grants.deadlines_approaching` | Gauge | Deadlines due within 7 days |
| `portfolio.strategy.okr_progress` | Gauge | Consortium-level OKR progress |
| `portfolio.api.latency_ms` | Histogram | API endpoint latency |
| `portfolio.api.error_rate` | Counter | API errors by code |
| `portfolio.cache.hit_rate` | Counter | Redis cache hit/miss ratio |
| `portfolio.events.emitted` | Counter | Events emitted to fabric |

### Error Codes

| Code | HTTP | Description |
|------|------|-------------|
| `PORTFOLIO_VENTURE_NOT_FOUND` | 404 | Venture ID does not exist |
| `PORTFOLIO_VENTURE_SLUG_TAKEN` | 409 | Slug already in use |
| `PORTFOLIO_INVALID_TRANSITION` | 422 | Invalid lifecycle transition |
| `PORTFOLIO_VENTURE_NOT_DELETABLE` | 422 | Can only delete concepts |
| `PORTFOLIO_ALLOCATION_EXCEEDED` | 422 | Team allocation >100% |
| `PORTFOLIO_ENTITY_NOT_FOUND` | 404 | Entity not found |
| `PORTFOLIO_CIRCULAR_HIERARCHY` | 422 | Circular entity hierarchy detected |
| `PORTFOLIO_OWNERSHIP_EXCEEDED` | 422 | Ownership >100% |
| `PORTFOLIO_GRANT_NOT_FOUND` | 404 | Grant not found |
| `PORTFOLIO_INVALID_GRANT_TRANSITION` | 422 | Invalid grant status transition |
| `PORTFOLIO_GRANT_OVER_BUDGET` | 422 | Expenditure exceeds budget line |
| `PORTFOLIO_MILESTONE_NOT_FOUND` | 404 | Milestone not found |
| `PORTFOLIO_DISBURSEMENT_EXCEEDS_AWARD` | 422 | Disbursement > awarded amount |
| `PORTFOLIO_OBJECTIVE_NOT_FOUND` | 404 | Objective not found |
| `PORTFOLIO_OBJECTIVE_NOT_DELETABLE` | 422 | Only drafts deletable |
| `PORTFOLIO_KR_PROGRESS_INVALID` | 422 | Value outside valid range |
| `PORTFOLIO_SCORECARD_WEIGHTS_INVALID` | 422 | Weights don't sum to 1.0 |
| `PORTFOLIO_THESIS_ALREADY_RESOLVED` | 422 | Thesis already validated/invalidated |
| `PORTFOLIO_DASHBOARD_LIMIT` | 422 | Too many dashboards |
| `PORTFOLIO_UNAUTHORIZED` | 403 | Insufficient permissions |

### Database Migration Strategy

Portfolio database migrations follow the MCV standard migration workflow:

```bash
# Generate migration from schema changes
pnpm drizzle-kit generate:pg --schema=packages/portfolio/src/*/schema.ts

# Apply migration to development
pnpm drizzle-kit push:pg

# Apply to production (via CI/CD)
pnpm drizzle-kit migrate
```

**Migration Safety Rules:**
1. All migrations are forward-only (no rollback in production)
2. Destructive operations (column drops, type changes) require a 2-phase migration
3. New columns must have defaults or be nullable
4. Index creation uses `CONCURRENTLY` to avoid table locks
5. RLS policies are versioned alongside schema migrations

### Turborepo Integration

```json
// packages/portfolio/package.json
{
  "name": "@mcv/portfolio",
  "version": "1.0.0",
  "private": true,
  "main": "./src/index.ts",
  "types": "./src/index.ts",
  "scripts": {
    "build": "tsup src/index.ts --format esm,cjs --dts",
    "dev": "tsup src/index.ts --format esm,cjs --dts --watch",
    "lint": "eslint src/",
    "test": "vitest run",
    "test:watch": "vitest watch",
    "db:generate": "drizzle-kit generate:pg",
    "db:push": "drizzle-kit push:pg",
    "db:migrate": "drizzle-kit migrate"
  },
  "dependencies": {
    "@mcv/kernel": "workspace:*",
    "@mcv/identity": "workspace:*",
    "@mcv/fabric": "workspace:*",
    "@mcv/finance": "workspace:*",
    "@mcv/documents": "workspace:*",
    "@mcv/notifications": "workspace:*",
    "drizzle-orm": "^0.38.0",
    "zod": "^3.23.0",
    "date-fns": "^3.6.0"
  },
  "devDependencies": {
    "@mcv/testing": "workspace:*",
    "vitest": "^2.0.0",
    "tsup": "^8.0.0",
    "drizzle-kit": "^0.28.0"
  }
}
```

### Directory Structure

```
packages/portfolio/
├── src/
│   ├── index.ts                      # Package entry point (re-exports)
│   ├── config.ts                     # Package configuration schema
│   ├── constants.ts                  # Shared constants
│   ├── types.ts                      # Shared type definitions
│   ├── errors.ts                     # Error codes and PortfolioError class
│   │
│   ├── ventures/
│   │   ├── schema.ts                 # Drizzle schema (9 tables)
│   │   ├── service.ts                # VentureService class
│   │   ├── validators.ts             # Zod schemas for venture inputs
│   │   └── lifecycle.ts              # State machine definition
│   │
│   ├── entities/
│   │   ├── schema.ts                 # Drizzle schema (8 tables)
│   │   ├── service.ts                # EntityService class
│   │   ├── validators.ts             # Zod schemas for entity inputs
│   │   └── hierarchy.ts              # Hierarchy tree utilities
│   │
│   ├── grants/
│   │   ├── schema.ts                 # Drizzle schema (10 tables)
│   │   ├── service.ts                # GrantService class
│   │   ├── validators.ts             # Zod schemas for grant inputs
│   │   └── lifecycle.ts              # Grant state machine
│   │
│   ├── strategy/
│   │   ├── schema.ts                 # Drizzle schema (12+ tables)
│   │   ├── service.ts                # StrategyService class
│   │   ├── validators.ts             # Zod schemas for strategy inputs
│   │   └── scoring.ts               # Scorecard calculation logic
│   │
│   ├── aggregation/
│   │   ├── service.ts                # PortfolioAggregationService
│   │   └── queries.ts                # Cross-venture SQL queries
│   │
│   └── client/
│       ├── hooks/
│       │   ├── use-ventures.ts
│       │   ├── use-venture-detail.ts
│       │   ├── use-venture-health.ts
│       │   ├── use-venture-kpis.ts
│       │   ├── use-venture-team.ts
│       │   ├── use-legal-entities.ts
│       │   ├── use-entity-hierarchy.ts
│       │   ├── use-entity-compliance.ts
│       │   ├── use-grants.ts
│       │   ├── use-grant-lifecycle.ts
│       │   ├── use-grant-budget.ts
│       │   ├── use-strategic-objectives.ts
│       │   ├── use-okr-progress.ts
│       │   ├── use-venture-scorecards.ts
│       │   ├── use-portfolio-dashboard.ts
│       │   ├── use-portfolio-summary.ts
│       │   └── use-competitive-landscape.ts
│       │
│       └── components/
│           ├── venture-grid.tsx
│           ├── venture-card.tsx
│           ├── venture-detail-panel.tsx
│           ├── venture-health-dashboard.tsx
│           ├── venture-kpi-tracker.tsx
│           ├── venture-team-roster.tsx
│           ├── tech-stack-viewer.tsx
│           ├── entity-hierarchy-tree.tsx
│           ├── entity-compliance-matrix.tsx
│           ├── corporate-document-vault.tsx
│           ├── grant-pipeline.tsx
│           ├── grant-timeline-view.tsx
│           ├── grant-budget-tracker.tsx
│           ├── grant-compliance-calendar.tsx
│           ├── okr-tree-view.tsx
│           ├── venture-scorecard-matrix.tsx
│           ├── competitor-map.tsx
│           ├── market-sizing-chart.tsx
│           ├── portfolio-dashboard.tsx
│           ├── consolidated-metrics-panel.tsx
│           ├── investment-thesis-board.tsx
│           └── pivot-decision-log.tsx
│
├── __tests__/
│   ├── ventures.test.ts
│   ├── entities.test.ts
│   ├── grants.test.ts
│   ├── strategy.test.ts
│   └── aggregation.test.ts
│
├── drizzle.config.ts
├── package.json
├── tsconfig.json
└── vitest.config.ts
```

---

*@mcv/portfolio — Portfolio Management Domain*
