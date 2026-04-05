# @mcv/portfolio — Portfolio Domain Module

**Parent Package:** @mcv/portfolio  
**Tier:** 5 (Domain Layer — MCV-Only)  
**Classification:** MCV-ONLY  
**Version:** 1.0.0  
**Last Updated:** February 8, 2026

---

## Purpose

The `portfolio` module is the **consortium-level meta-layer** that manages the entirety of the MCV Global Consortium — its ventures, legal entities, grant funding, and strategic direction. It is the single source of truth for everything that defines MCV as a multi-venture enterprise: which ventures exist, how they're structured legally, what grants fund them, and where the consortium is heading strategically.

**This is not a per-venture module. This is the module that manages all ventures from above.**

MCV Global Consortium operates 9 active ventures across diverse verticals:

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

The `@mcv/portfolio` module provides four submodules:

- **ventures** — Venture lifecycle management from inception to sunset, including configuration, health monitoring, KPI tracking, team assignments, tech stack registry, deployment configs, and multi-tenant isolation mapping
- **entities** — Legal entity management for corporations, LLCs, partnerships, and holding structures, with ownership hierarchies, registered agents, corporate document vaults, and compliance tracking
- **grants** — Full grant lifecycle from discovery through application, award, milestone tracking, disbursement, compliance reporting, and closeout — with grant-specific budgets and deadline management
- **strategy** — Strategic planning layer with OKR tracking, competitive analysis, market sizing, venture scoring/ranking, investment thesis management, pivot decision tracking, and portfolio-level dashboards

Every decision at the consortium level — launching a new venture, restructuring legal entities, applying for grant funding, pivoting strategic direction — flows through this module. It integrates with `@mcv/identity` for tenant isolation, `@mcv/fabric` for audit trails and event propagation, `@mcv/finance` for per-venture P&L and budgets, and `@mcv/treasury` for funding flows across the consortium.

---

## Exports

```typescript
// ═══════════════════════════════════════════════════════════════════════════════
// VENTURES
// ═══════════════════════════════════════════════════════════════════════════════

// Core services
export {
  ventureService,                    // Venture lifecycle operations
} from './ventures/service';

export type {
  CreateVentureInput,                // Create a new venture
  UpdateVentureInput,                // Update venture configuration
  VentureHealthSnapshot,             // Point-in-time health data
  VentureKpiRecord,                  // KPI measurement record
  TeamAssignmentInput,               // Assign member to venture
  DeploymentConfigInput,             // Deployment environment config
} from './ventures/service';

// Schema exports
export {
  ventures,                          // Ventures master table
  ventureConfigs,                    // Per-venture configuration
  ventureHealthSnapshots,            // Health monitoring snapshots
  ventureKpis,                       // KPI definitions and targets
  ventureKpiRecords,                 // KPI measurement records
  ventureTeamAssignments,            // Team member assignments
  ventureTechStacks,                 // Technology stack registry
  ventureDeployments,                // Deployment configurations
  ventureMilestones,                 // Venture-level milestones
  ventureStatusEnum,                 // Venture status enum
  ventureStageEnum,                  // Venture stage enum
  ventureHealthEnum,                 // Health status enum
  venturePriorityEnum,               // Priority classification enum
} from './ventures/schema';

// ═══════════════════════════════════════════════════════════════════════════════
// ENTITIES
// ═══════════════════════════════════════════════════════════════════════════════

export {
  entityService,                     // Legal entity operations
} from './entities/service';

export type {
  CreateEntityInput,                 // Create a legal entity
  UpdateEntityInput,                 // Update entity details
  OwnershipStructureInput,           // Define ownership hierarchy
  RegisteredAgentInput,              // Registered agent information
  CorporateDocumentInput,            // Upload corporate document
  ComplianceCheckInput,              // Record compliance check
} from './entities/service';

export {
  legalEntities,                     // Legal entities table
  entityHierarchies,                 // Parent-child entity relationships
  ownershipStructures,               // Ownership percentages and types
  registeredAgents,                  // Registered agent records
  corporateDocuments,                // Corporate document vault
  entityComplianceRecords,           // Compliance tracking
  entityOfficers,                    // Officers and directors
  entityJurisdictions,               // Multi-jurisdiction registrations
  entityTypeEnum,                    // Entity type enum
  entityStatusEnum,                  // Entity status enum
  complianceStatusEnum,              // Compliance status enum
  documentTypeEnum,                  // Document type enum
} from './entities/schema';

// ═══════════════════════════════════════════════════════════════════════════════
// GRANTS
// ═══════════════════════════════════════════════════════════════════════════════

export {
  grantService,                      // Grant lifecycle operations
} from './grants/service';

export type {
  CreateGrantInput,                  // Create a grant record
  GrantApplicationInput,             // Submit grant application
  GrantMilestoneInput,               // Define grant milestone
  DisbursementInput,                 // Record disbursement
  ComplianceReportInput,             // Submit compliance report
  GrantBudgetInput,                  // Grant-specific budget
} from './grants/service';

export {
  grants,                            // Grants master table
  grantApplications,                 // Application submissions
  grantMilestones,                   // Milestone definitions & tracking
  grantDisbursements,                // Funding disbursement records
  grantComplianceReports,            // Compliance report submissions
  grantBudgets,                      // Grant-specific budgets
  grantBudgetLines,                  // Grant budget line items
  grantDeadlines,                    // Deadline tracking
  grantDocuments,                    // Supporting documents
  grantContacts,                     // Grantor contacts
  grantStatusEnum,                   // Grant status enum
  applicationStatusEnum,             // Application status enum
  milestoneStatusEnum,               // Milestone status enum
  disbursementStatusEnum,            // Disbursement status enum
} from './grants/schema';

// ═══════════════════════════════════════════════════════════════════════════════
// STRATEGY
// ═══════════════════════════════════════════════════════════════════════════════

export {
  strategyService,                   // Strategic planning operations
} from './strategy/service';

export type {
  CreateObjectiveInput,              // Create strategic objective
  CreateKeyResultInput,              // Create key result
  CompetitiveAnalysisInput,          // Record competitor analysis
  MarketSizingInput,                 // Market sizing estimate
  VentureScorecardInput,             // Venture scoring input
  InvestmentThesisInput,             // Investment thesis record
  PivotDecisionInput,                // Pivot decision record
} from './strategy/service';

export {
  strategicObjectives,               // OKR objectives
  keyResults,                        // OKR key results
  keyResultCheckins,                 // Key result progress check-ins
  competitiveAnalyses,               // Competitive landscape
  competitorProfiles,                // Individual competitor profiles
  marketSizings,                     // TAM/SAM/SOM estimates
  ventureScorecards,                 // Venture scoring/ranking
  scorecardCriteria,                 // Scoring criteria definitions
  investmentTheses,                  // Investment thesis tracking
  pivotDecisions,                    // Pivot decision log
  strategicInitiatives,              // Strategic initiative tracking
  portfolioDashboards,               // Dashboard configurations
  dashboardWidgets,                  // Dashboard widget definitions
  objectiveStatusEnum,               // Objective status enum
  keyResultTypeEnum,                 // Key result type enum
  pivotTypeEnum,                     // Pivot type enum
  initiativeStatusEnum,              // Initiative status enum
} from './strategy/schema';

// ═══════════════════════════════════════════════════════════════════════════════
// CROSS-VENTURE AGGREGATION
// ═══════════════════════════════════════════════════════════════════════════════

export {
  portfolioAggregationService,       // Cross-venture analytics
} from './aggregation/service';

export type {
  PortfolioSummary,                  // Full portfolio summary
  VentureComparison,                 // Side-by-side venture comparison
  PortfolioHealthReport,             // Consortium health report
  AllocationAnalysis,                // Resource allocation analysis
  ConsolidatedMetrics,               // Consolidated KPI metrics
} from './aggregation/service';

// ═══════════════════════════════════════════════════════════════════════════════
// CLIENT HOOKS (React)
// ═══════════════════════════════════════════════════════════════════════════════

export { useVentures } from './client/hooks/use-ventures';
export { useVentureDetail } from './client/hooks/use-venture-detail';
export { useVentureHealth } from './client/hooks/use-venture-health';
export { useVentureKpis } from './client/hooks/use-venture-kpis';
export { useVentureTeam } from './client/hooks/use-venture-team';
export { useLegalEntities } from './client/hooks/use-legal-entities';
export { useEntityHierarchy } from './client/hooks/use-entity-hierarchy';
export { useEntityCompliance } from './client/hooks/use-entity-compliance';
export { useGrants } from './client/hooks/use-grants';
export { useGrantLifecycle } from './client/hooks/use-grant-lifecycle';
export { useGrantBudget } from './client/hooks/use-grant-budget';
export { useStrategicObjectives } from './client/hooks/use-strategic-objectives';
export { useOkrProgress } from './client/hooks/use-okr-progress';
export { useVentureScorecards } from './client/hooks/use-venture-scorecards';
export { usePortfolioDashboard } from './client/hooks/use-portfolio-dashboard';
export { usePortfolioSummary } from './client/hooks/use-portfolio-summary';
export { useCompetitiveLandscape } from './client/hooks/use-competitive-landscape';

// ═══════════════════════════════════════════════════════════════════════════════
// CLIENT COMPONENTS (React)
// ═══════════════════════════════════════════════════════════════════════════════

export { VentureGrid } from './client/components/venture-grid';
export { VentureCard } from './client/components/venture-card';
export { VentureDetailPanel } from './client/components/venture-detail-panel';
export { VentureHealthDashboard } from './client/components/venture-health-dashboard';
export { VentureKpiTracker } from './client/components/venture-kpi-tracker';
export { VentureTeamRoster } from './client/components/venture-team-roster';
export { TechStackViewer } from './client/components/tech-stack-viewer';
export { EntityHierarchyTree } from './client/components/entity-hierarchy-tree';
export { EntityComplianceMatrix } from './client/components/entity-compliance-matrix';
export { CorporateDocumentVault } from './client/components/corporate-document-vault';
export { GrantPipeline } from './client/components/grant-pipeline';
export { GrantTimelineView } from './client/components/grant-timeline-view';
export { GrantBudgetTracker } from './client/components/grant-budget-tracker';
export { GrantComplianceCalendar } from './client/components/grant-compliance-calendar';
export { OkrTreeView } from './client/components/okr-tree-view';
export { VentureScorecardMatrix } from './client/components/venture-scorecard-matrix';
export { CompetitorMap } from './client/components/competitor-map';
export { MarketSizingChart } from './client/components/market-sizing-chart';
export { PortfolioDashboard } from './client/components/portfolio-dashboard';
export { ConsolidatedMetricsPanel } from './client/components/consolidated-metrics-panel';
export { InvestmentThesisBoard } from './client/components/investment-thesis-board';
export { PivotDecisionLog } from './client/components/pivot-decision-log';

// ═══════════════════════════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════════════════════════

export {
  VENTURE_STATUSES,
  VENTURE_STAGES,
  VENTURE_PRIORITIES,
  HEALTH_THRESHOLDS,
  DEFAULT_KPI_DEFINITIONS,
  ENTITY_TYPES,
  COMPLIANCE_REQUIREMENTS,
  GRANT_STATUSES,
  GRANT_CATEGORIES,
  FEDERAL_GRANT_SOURCES,
  OKR_SCORING_METHODS,
  SCORECARD_CRITERIA_DEFAULTS,
  PIVOT_TYPES,
  MARKET_SIZING_METHODS,
  PORTFOLIO_METRICS,
  MCV_VENTURES,
} from './constants';

// ═══════════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════════

export type {
  // Venture types
  VentureStatus,
  VentureStage,
  VenturePriority,
  VentureHealthStatus,
  VentureConfig,
  TechStackEntry,
  DeploymentEnvironment,
  TeamRole,
  KpiDefinition,
  KpiTarget,

  // Entity types
  EntityType,
  EntityStatus,
  ComplianceStatus,
  OwnershipType,
  OfficerRole,
  JurisdictionType,
  DocumentType,
  CorporateDocumentMetadata,

  // Grant types
  GrantStatus,
  ApplicationStatus,
  MilestoneStatus,
  DisbursementStatus,
  GrantCategory,
  FundingSource,
  ComplianceReportType,
  GrantDeadlineType,

  // Strategy types
  ObjectiveStatus,
  KeyResultType,
  KeyResultScoringMethod,
  CompetitorThreatLevel,
  MarketSizingMethod,
  ScorecardWeight,
  InvestmentThesisStatus,
  PivotType,
  PivotOutcome,
  InitiativeStatus,
  DashboardLayout,
  WidgetType,

  // Aggregation types
  PortfolioHealthGrade,
  AllocationCategory,
  TrendDirection,
  ComparisonMetric,
} from './types';
```

---

## Architecture

```
┌──────────────────────────────────────────────────────────────────────────────────────────────────┐
│                          @mcv/portfolio — PORTFOLIO DOMAIN ARCHITECTURE                           │
│                                                                                                   │
│  ┌────────────────────────────────────────────────────────────────────────────────────────────┐  │
│  │                              ENTRY POINTS                                                   │  │
│  │                                                                                             │  │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌────────────┐  │  │
│  │  │  API Routes  │  │  Cron Jobs   │  │  Webhooks    │  │ NAOS Agents  │  │ Super Admin│  │  │
│  │  │ /api/portfolio│ │  Health pings│  │  Grant feeds │  │  Strategist  │  │ Dashboard  │  │  │
│  │  │ /api/ventures│  │  KPI refresh │  │  Entity APIs │  │  Portfolio   │  │ Console    │  │  │
│  │  │ /api/grants  │  │  Deadlines   │  │  Compliance  │  │  Analyst     │  │            │  │  │
│  │  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘  └─────┬──────┘  │  │
│  │         │                 │                  │                 │                 │          │  │
│  │         └─────────────────┴──────────────────┴─────────────────┴─────────────────┘          │  │
│  │                                      │                                                      │  │
│  └──────────────────────────────────────┼──────────────────────────────────────────────────────┘  │
│                                         │                                                         │
│  ┌──────────────────────────────────────▼──────────────────────────────────────────────────────┐  │
│  │                              SERVICE LAYER                                                   │  │
│  │                                                                                              │  │
│  │  ┌──────────────────────┐  ┌──────────────────────┐                                         │  │
│  │  │      VENTURES        │  │       ENTITIES        │                                         │  │
│  │  │                      │  │                       │                                         │  │
│  │  │ • Venture CRUD       │  │ • Entity CRUD         │                                         │  │
│  │  │ • Lifecycle mgmt     │  │ • Hierarchy mgmt      │                                         │  │
│  │  │ • Health monitoring  │  │ • Ownership tracking   │                                         │  │
│  │  │ • KPI tracking       │  │ • Compliance checks   │                                         │  │
│  │  │ • Team assignments   │  │ • Document vault      │                                         │  │
│  │  │ • Tech stack registry│  │ • Officer management  │                                         │  │
│  │  │ • Deployment configs │  │ • Jurisdiction mgmt   │                                         │  │
│  │  │ • Milestone tracking │  │ • Registered agents   │                                         │  │
│  │  └──────────┬───────────┘  └──────────┬────────────┘                                         │  │
│  │             │                          │                                                      │  │
│  │  ┌──────────────────────┐  ┌──────────────────────┐                                         │  │
│  │  │       GRANTS         │  │       STRATEGY        │                                         │  │
│  │  │                      │  │                       │                                         │  │
│  │  │ • Grant discovery    │  │ • OKR management      │                                         │  │
│  │  │ • Application mgmt   │  │ • Competitive analysis│                                         │  │
│  │  │ • Milestone tracking │  │ • Market sizing       │                                         │  │
│  │  │ • Disbursement mgmt  │  │ • Venture scoring     │                                         │  │
│  │  │ • Compliance reports │  │ • Investment theses   │                                         │  │
│  │  │ • Budget tracking    │  │ • Pivot decisions     │                                         │  │
│  │  │ • Deadline alerts    │  │ • Portfolio dashboards│                                         │  │
│  │  │ • Document mgmt     │  │ • Strategic initiatives│                                         │  │
│  │  └──────────┬───────────┘  └──────────┬────────────┘                                         │  │
│  │             │                          │                                                      │  │
│  │  ┌─────────────────────────────────────────────────────────────────────────────────────────┐ │  │
│  │  │                    CROSS-VENTURE AGGREGATION ENGINE                                      │ │  │
│  │  │                                                                                         │ │  │
│  │  │  • Portfolio summary (all 9 ventures)      • Consolidated KPI metrics                   │ │  │
│  │  │  • Venture comparison matrices              • Resource allocation analysis              │ │  │
│  │  │  • Health heatmaps                          • Trend detection & forecasting             │ │  │
│  │  │  • Grant funding pipeline                   • Investor relations reporting              │ │  │
│  │  │                                                                                         │ │  │
│  │  └─────────────────────────────────────────────────────────────────────────────────────────┘ │  │
│  │                                                                                              │  │
│  └──────────────────────────────────────────────────────────────────────────────────────────────┘  │
│                                         │                                                         │
│  ┌──────────────────────────────────────▼──────────────────────────────────────────────────────┐  │
│  │                            DATABASE LAYER (PostgreSQL + RLS)                                  │  │
│  │                                                                                               │  │
│  │  ┌───────────┐ ┌───────────┐ ┌───────────┐ ┌───────────┐ ┌───────────────────────────┐     │  │
│  │  │ Ventures  │ │ Entities  │ │  Grants   │ │ Strategy  │ │ Aggregation (materialized │     │  │
│  │  │ 9 tables  │ │ 8 tables  │ │ 10 tables │ │ 12 tables │ │ views & cache tables)     │     │  │
│  │  └───────────┘ └───────────┘ └───────────┘ └───────────┘ └───────────────────────────┘     │  │
│  │                                                                                               │  │
│  │  RLS Policy: Super Admin (role=super_admin) sees all ventures.                               │  │
│  │              Venture Admin sees only their assigned ventures.                                  │  │
│  │              Read-only roles see ventures they're team members of.                            │  │
│  │                                                                                               │  │
│  └───────────────────────────────────────────────────────────────────────────────────────────────┘  │
│                                                                                                     │
│  ┌───────────────────────────────────────────────────────────────────────────────────────────────┐  │
│  │                            EXTERNAL DEPENDENCIES                                               │  │
│  │                                                                                                │  │
│  │  @mcv/identity         @mcv/fabric            @mcv/finance           @mcv/treasury             │  │
│  │  (Tenant isolation,    (Audit trails,          (Per-venture P&L,      (Funding flows,           │  │
│  │   venture ↔ tenant     event bus,              budgets, expense       wallet management,        │  │
│  │   mapping, RBAC)       notification dispatch)  tracking per venture)  EDGE token ops)           │  │
│  │                                                                                                │  │
│  │  @mcv/documents        @mcv/notifications      OpenRouter (AI)        Supabase                 │  │
│  │  (PDF generation,      (Email, SMS, push       (Grant matching,       (PostgreSQL, RLS,         │  │
│  │   file storage,        for deadlines and       competitive intel,     realtime subscriptions,   │  │
│  │   corporate docs)      compliance alerts)      market analysis)       storage buckets)          │  │
│  │                                                                                                │  │
│  └───────────────────────────────────────────────────────────────────────────────────────────────┘  │
│                                                                                                     │
└─────────────────────────────────────────────────────────────────────────────────────────────────────┘
```

### Data Flow: New Venture Creation → Full Ecosystem Setup

```
Consortium Decision: Launch New Venture
        │
        ▼
┌────────────────┐     ┌────────────────┐     ┌────────────────┐
│ strategy       │────▶│ ventures       │────▶│ @mcv/identity  │
│                │     │                │     │                │
│ Investment     │     │ Create venture │     │ Create tenant  │
│ thesis approved│     │ status=setup   │     │ Map venture →  │
│ → launch       │     │                │     │ tenant isolation│
└────────────────┘     └───────┬────────┘     └────────────────┘
                               │
              ┌────────────────┼────────────────┐
              │                │                │
              ▼                ▼                ▼
┌────────────────┐  ┌────────────────┐  ┌────────────────┐
│ entities       │  │ @mcv/finance   │  │ @mcv/fabric    │
│                │  │                │  │                │
│ Create legal   │  │ Set up chart   │  │ Emit event:    │
│ entity (LLC)   │  │ of accounts,   │  │ venture.created│
│ Link to venture│  │ initial budget │  │ Audit trail    │
└────────────────┘  └────────────────┘  └────────────────┘
        │
        ▼
┌────────────────┐     ┌────────────────┐
│ grants         │     │ ventures       │
│                │     │                │
│ Identify       │     │ Assign team,   │
│ applicable     │     │ register tech  │
│ grant funding  │     │ stack, deploy  │
│                │     │ status=active  │
└────────────────┘     └────────────────┘
```

### Data Flow: Quarterly Portfolio Review

```
Cron: portfolio.quarterly_review
        │
        ▼
┌────────────────┐     ┌────────────────┐     ┌────────────────┐
│ ventures       │     │ @mcv/finance   │     │ grants         │
│                │     │                │     │                │
│ Collect health │     │ Pull P&L per   │     │ Pull grant     │
│ snapshots for  │     │ venture, budget │    │ status, funding│
│ all 9 ventures │     │ vs actual data │     │ pipeline data  │
└───────┬────────┘     └───────┬────────┘     └───────┬────────┘
        │                      │                       │
        └──────────────────────┴───────────────────────┘
                               │
                               ▼
                ┌────────────────────────┐
                │ aggregation            │
                │                        │
                │ Build consolidated     │
                │ portfolio report:      │
                │ • Revenue by venture   │
                │ • Health heatmap       │
                │ • Grant pipeline       │
                │ • OKR progress         │
                │ • Venture rankings     │
                └───────────┬────────────┘
                            │
               ┌────────────┼────────────┐
               │            │            │
               ▼            ▼            ▼
        ┌──────────┐ ┌──────────┐ ┌──────────┐
        │ Super    │ │ Investor │ │ @mcv/    │
        │ Admin    │ │ Relations│ │ fabric   │
        │ Dashboard│ │ Report   │ │          │
        │          │ │ (PDF)    │ │ Audit:   │
        │          │ │          │ │ review   │
        │          │ │          │ │ completed│
        └──────────┘ └──────────┘ └──────────┘
```

---

## Sub-Module Overview

| Module | Purpose | Tables | Key Operations |
|--------|---------|--------|----------------|
| **ventures** | Venture lifecycle, health monitoring, team & tech management | 9 | create venture, update status, record KPI, assign team, register tech |
| **entities** | Legal entity management, ownership, compliance | 8 | create entity, build hierarchy, track compliance, manage officers |
| **grants** | Grant lifecycle from discovery to closeout | 10 | create grant, submit application, track milestones, record disbursement |
| **strategy** | OKRs, competitive analysis, scoring, portfolio dashboards | 12 | create objective, check in KR, score venture, record pivot, build dashboard |

---

## Module: ventures

### Purpose

Manages the full lifecycle of every venture within the MCV Global Consortium — from initial concept and setup through active operations, potential hibernation, and eventual sunset. Each venture is a first-class entity with its own configuration, health monitoring, KPI tracking, team assignments, technology stack registry, deployment environments, and milestone tracking.

The ventures submodule is the **registry of record** for what constitutes the MCV consortium. When `@mcv/identity` creates a tenant, it references a venture record from this module. When `@mcv/finance` tracks revenue, it's tagged to a venture defined here. Everything flows from the venture definition.

### Venture Lifecycle State Machine

```
                    ┌──────────┐
                    │          │
         ┌─────────│  CONCEPT │
         │         │          │
         │         └────┬─────┘
         │              │ approve
         │              ▼
         │         ┌──────────┐
         │         │          │
         │         │  SETUP   │──────────────────┐
         │         │          │                  │
         │         └────┬─────┘                  │
         │              │ launch                 │ cancel
         │              ▼                        │
         │         ┌──────────┐                  │
         │         │          │                  │
         │    ┌───▶│  ACTIVE  │◀────┐            │
         │    │    │          │     │            │
         │    │    └────┬─────┘     │            │
         │    │         │           │ reactivate │
         │    │    ┌────┴────┐      │            │
         │    │    │         │      │            │
         │    │    ▼         ▼      │            │
         │    │ ┌────────┐ ┌────────────┐        │
         │    │ │        │ │            │        │
         │    │ │ SCALING│ │ HIBERNATING│        │
         │    │ │        │ │            │        │
         │    │ └───┬────┘ └─────┬──────┘        │
         │    │     │            │               │
         │    └─────┘            │ sunset         │
         │                       ▼               │
         │              ┌──────────────┐         │
         │              │              │         │
         └─────────────▶│   SUNSET     │◀────────┘
                        │              │
                        └──────┬───────┘
                               │ archive
                               ▼
                        ┌──────────────┐
                        │              │
                        │  ARCHIVED    │
                        │              │
                        └──────────────┘
```

### Database Schema

```typescript
// portfolio_ventures — Ventures Master Table
export const ventures = pgTable('portfolio_ventures', {
  id: uuid('id').primaryKey().defaultRandom(),
  slug: text('slug').notNull().unique(),                 // "betedge", "serpspace"
  name: text('name').notNull(),                          // "BetEdge"
  legalName: text('legal_name'),                         // "BetEdge Technologies Inc."
  description: text('description'),
  mission: text('mission'),                              // Venture mission statement
  tagline: text('tagline'),                              // Short description for cards
  domain: text('domain'),                                // "betedge.com"
  logoUrl: text('logo_url'),
  brandColors: jsonb('brand_colors'),                    // { primary: '#FF6B00', secondary: '#1A1A2E' }
  status: ventureStatusEnum('status').default('concept'), // concept|setup|active|scaling|hibernating|sunset|archived
  stage: ventureStageEnum('stage').default('ideation'),  // ideation|mvp|growth|maturity|decline
  priority: venturePriorityEnum('priority').default('medium'), // critical|high|medium|low|experimental
  tenantId: uuid('tenant_id'),                           // Links to @mcv/identity tenant
  primaryEntityId: uuid('primary_entity_id'),            // Links to primary legal entity
  industry: text('industry').notNull(),                  // "Sports Betting", "SEO", etc.
  vertical: text('vertical'),                            // "AI/ML", "SaaS", "Marketplace"
  foundedAt: timestamp('founded_at', { withTimezone: true }),
  launchedAt: timestamp('launched_at', { withTimezone: true }),
  sunsetAt: timestamp('sunset_at', { withTimezone: true }),
  archivedAt: timestamp('archived_at', { withTimezone: true }),
  leadId: uuid('lead_id'),                               // Venture lead (user ID)
  timezone: text('timezone').default('America/Toronto'),
  currency: text('currency').default('USD'),
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

// portfolio_venture_configs — Per-Venture Configuration
export const ventureConfigs = pgTable('portfolio_venture_configs', {
  id: uuid('id').primaryKey().defaultRandom(),
  ventureId: uuid('venture_id').references(() => ventures.id, { onDelete: 'cascade' }).notNull().unique(),
  features: jsonb('features').notNull().default({}),
  // { crm: true, invoicing: true, grants: false, socialMedia: true, analytics: true }
  integrations: jsonb('integrations').default({}),
  // { stripe: { accountId: 'acct_xxx', mode: 'live' }, openrouter: { model: 'gpt-4o' } }
  limits: jsonb('limits').default({}),
  // { maxUsers: 50, maxStorage: '100GB', maxApiCalls: 100000 }
  branding: jsonb('branding').default({}),
  // { theme: 'dark', customCss: '...', emailLogo: '...' }
  notificationPreferences: jsonb('notification_preferences').default({}),
  billingConfig: jsonb('billing_config').default({}),
  // { stripeConnectId: '...', platformFeePercent: 2.5, paymentMethods: ['card', 'bank'] }
  customDomain: text('custom_domain'),
  sslCertificateId: text('ssl_certificate_id'),
  maintenanceMode: boolean('maintenance_mode').default(false),
  maintenanceMessage: text('maintenance_message'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

// portfolio_venture_health_snapshots — Point-in-Time Health Data
export const ventureHealthSnapshots = pgTable('portfolio_venture_health_snapshots', {
  id: uuid('id').primaryKey().defaultRandom(),
  ventureId: uuid('venture_id').references(() => ventures.id, { onDelete: 'cascade' }).notNull(),
  snapshotDate: timestamp('snapshot_date', { withTimezone: true }).notNull(),
  overallHealth: ventureHealthEnum('overall_health').notNull(), // healthy|warning|critical|unknown
  healthScore: integer('health_score').notNull(),        // 0-100 composite score
  dimensions: jsonb('dimensions').notNull(),
  // {
  //   financial: { score: 85, revenue: 150000, burn: 45000, runway: 18, trend: 'up' },
  //   product: { score: 72, uptime: 99.9, bugCount: 12, featureVelocity: 8, trend: 'stable' },
  //   team: { score: 90, headcount: 12, satisfaction: 4.2, turnover: 0.08, trend: 'up' },
  //   market: { score: 65, userGrowth: 0.15, churnRate: 0.03, nps: 42, trend: 'down' },
  //   compliance: { score: 95, openIssues: 1, lastAudit: '2026-01-15', trend: 'stable' },
  // }
  alerts: jsonb('alerts').default([]),
  // [{ type: 'burn_rate_high', severity: 'warning', message: 'Burn rate exceeds 60% of revenue' }]
  previousSnapshotId: uuid('previous_snapshot_id'),
  generatedBy: text('generated_by').default('system'),   // 'system' | 'manual' | 'agent'
  notes: text('notes'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

// portfolio_venture_kpis — KPI Definitions and Targets
export const ventureKpis = pgTable('portfolio_venture_kpis', {
  id: uuid('id').primaryKey().defaultRandom(),
  ventureId: uuid('venture_id').references(() => ventures.id, { onDelete: 'cascade' }).notNull(),
  name: text('name').notNull(),                          // "Monthly Recurring Revenue"
  slug: text('slug').notNull(),                          // "mrr"
  description: text('description'),
  category: text('category').notNull(),                  // "financial" | "product" | "growth" | "team"
  unit: text('unit').notNull(),                          // "USD" | "percent" | "count" | "days"
  format: text('format').default('number'),              // "number" | "currency" | "percentage" | "duration"
  targetValue: numeric('target_value', { precision: 19, scale: 4 }),
  targetDate: timestamp('target_date', { withTimezone: true }),
  warningThreshold: numeric('warning_threshold', { precision: 19, scale: 4 }),
  criticalThreshold: numeric('critical_threshold', { precision: 19, scale: 4 }),
  direction: text('direction').default('higher_is_better'), // "higher_is_better" | "lower_is_better"
  frequency: text('frequency').default('monthly'),       // "daily" | "weekly" | "monthly" | "quarterly"
  isActive: boolean('is_active').default(true),
  isGlobal: boolean('is_global').default(false),         // true = applies to all ventures
  sortOrder: integer('sort_order').default(0),
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

// portfolio_venture_kpi_records — KPI Measurement Records
export const ventureKpiRecords = pgTable('portfolio_venture_kpi_records', {
  id: uuid('id').primaryKey().defaultRandom(),
  kpiId: uuid('kpi_id').references(() => ventureKpis.id, { onDelete: 'cascade' }).notNull(),
  ventureId: uuid('venture_id').references(() => ventures.id, { onDelete: 'cascade' }).notNull(),
  period: text('period').notNull(),                      // "2026-01", "2026-Q1", "2026-W05"
  value: numeric('value', { precision: 19, scale: 4 }).notNull(),
  previousValue: numeric('previous_value', { precision: 19, scale: 4 }),
  changePercent: numeric('change_percent', { precision: 10, scale: 4 }),
  targetValue: numeric('target_value', { precision: 19, scale: 4 }),
  targetAttainment: numeric('target_attainment', { precision: 10, scale: 4 }), // percentage
  status: text('status').default('on_track'),            // "on_track" | "at_risk" | "off_track" | "exceeded"
  source: text('source').default('manual'),              // "manual" | "api" | "calculated" | "imported"
  notes: text('notes'),
  recordedBy: uuid('recorded_by'),
  recordedAt: timestamp('recorded_at', { withTimezone: true }).defaultNow().notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

// portfolio_venture_team_assignments — Team Member Assignments
export const ventureTeamAssignments = pgTable('portfolio_venture_team_assignments', {
  id: uuid('id').primaryKey().defaultRandom(),
  ventureId: uuid('venture_id').references(() => ventures.id, { onDelete: 'cascade' }).notNull(),
  userId: uuid('user_id').notNull(),                     // References @mcv/identity user
  role: text('role').notNull(),                          // "lead" | "developer" | "designer" | "marketer" | "advisor"
  title: text('title'),                                  // "CTO", "Lead Developer", etc.
  allocation: integer('allocation').default(100),        // Percentage of time (0-100)
  isActive: boolean('is_active').default(true),
  startDate: timestamp('start_date', { withTimezone: true }).notNull(),
  endDate: timestamp('end_date', { withTimezone: true }),
  responsibilities: jsonb('responsibilities').default([]),
  // ["Backend architecture", "Team hiring", "Sprint planning"]
  compensationType: text('compensation_type'),           // "salary" | "equity" | "contract" | "volunteer"
  notes: text('notes'),
  assignedBy: uuid('assigned_by'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

// portfolio_venture_tech_stacks — Technology Stack Registry
export const ventureTechStacks = pgTable('portfolio_venture_tech_stacks', {
  id: uuid('id').primaryKey().defaultRandom(),
  ventureId: uuid('venture_id').references(() => ventures.id, { onDelete: 'cascade' }).notNull(),
  category: text('category').notNull(),                  // "frontend" | "backend" | "database" | "infrastructure" | "ai"
  technology: text('technology').notNull(),               // "Next.js 15", "PostgreSQL", "OpenRouter"
  version: text('version'),                              // "15.1.0"
  purpose: text('purpose'),                              // "Primary web framework"
  license: text('license'),                              // "MIT", "Apache-2.0", "Commercial"
  cost: numeric('cost', { precision: 19, scale: 4 }),    // Monthly cost if applicable
  costFrequency: text('cost_frequency'),                 // "monthly" | "annual" | "one-time"
  status: text('status').default('active'),              // "active" | "deprecated" | "evaluating" | "migrating"
  migrationTarget: text('migration_target'),             // If migrating, what to
  addedAt: timestamp('added_at', { withTimezone: true }).defaultNow().notNull(),
  deprecatedAt: timestamp('deprecated_at', { withTimezone: true }),
  notes: text('notes'),
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

// portfolio_venture_deployments — Deployment Configurations
export const ventureDeployments = pgTable('portfolio_venture_deployments', {
  id: uuid('id').primaryKey().defaultRandom(),
  ventureId: uuid('venture_id').references(() => ventures.id, { onDelete: 'cascade' }).notNull(),
  environment: text('environment').notNull(),            // "production" | "staging" | "development" | "preview"
  provider: text('provider').notNull(),                  // "vercel" | "aws" | "gcp" | "railway" | "self-hosted"
  region: text('region'),                                // "us-east-1", "iad1"
  url: text('url'),                                      // "https://betedge.com"
  repositoryUrl: text('repository_url'),                 // "https://github.com/mcv-global/betedge"
  branch: text('branch'),                                // "main", "staging"
  lastDeployAt: timestamp('last_deploy_at', { withTimezone: true }),
  lastDeployStatus: text('last_deploy_status'),          // "success" | "failed" | "building"
  lastDeployCommit: text('last_deploy_commit'),          // Git SHA
  autoDeployEnabled: boolean('auto_deploy_enabled').default(true),
  envVars: jsonb('env_vars').default({}),                // Non-sensitive env var names (not values)
  healthCheckUrl: text('health_check_url'),
  healthCheckStatus: text('health_check_status'),        // "healthy" | "degraded" | "down"
  lastHealthCheckAt: timestamp('last_health_check_at', { withTimezone: true }),
  resourceConfig: jsonb('resource_config').default({}),
  // { cpu: '2 vCPU', memory: '4GB', storage: '50GB', replicas: 2 }
  monthlyCost: numeric('monthly_cost', { precision: 19, scale: 4 }),
  notes: text('notes'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

// portfolio_venture_milestones — Venture-Level Milestones
export const ventureMilestones = pgTable('portfolio_venture_milestones', {
  id: uuid('id').primaryKey().defaultRandom(),
  ventureId: uuid('venture_id').references(() => ventures.id, { onDelete: 'cascade' }).notNull(),
  title: text('title').notNull(),                        // "MVP Launch"
  description: text('description'),
  category: text('category').notNull(),                  // "product" | "business" | "funding" | "team" | "legal"
  status: text('status').default('planned'),             // "planned" | "in_progress" | "completed" | "cancelled" | "deferred"
  priority: text('priority').default('medium'),          // "critical" | "high" | "medium" | "low"
  targetDate: timestamp('target_date', { withTimezone: true }),
  completedAt: timestamp('completed_at', { withTimezone: true }),
  completionPercent: integer('completion_percent').default(0), // 0-100
  blockers: jsonb('blockers').default([]),               // [{ description: '...', severity: 'high' }]
  dependsOn: uuid('depends_on').array(),                 // Other milestone IDs
  assigneeId: uuid('assignee_id'),
  evidence: jsonb('evidence').default([]),               // [{ type: 'url', value: 'https://...' }]
  notes: text('notes'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});
```

### Core Interface

```typescript
export class VentureService {
  // ── Venture CRUD ─────────────────────────────────────────────────────
  createVenture(input: CreateVentureInput): Promise<Venture>;
  updateVenture(ventureId: string, input: UpdateVentureInput): Promise<Venture>;
  getVenture(ventureId: string): Promise<Venture | null>;
  getVentureBySlug(slug: string): Promise<Venture | null>;
  listVentures(options?: { status?: VentureStatus[]; stage?: VentureStage[]; priority?: VenturePriority[] }): Promise<Venture[]>;
  deleteVenture(ventureId: string): Promise<void>;       // Only for 'concept' status

  // ── Lifecycle Transitions ────────────────────────────────────────────
  approveVenture(ventureId: string, approvedBy: string): Promise<Venture>;           // concept → setup
  launchVenture(ventureId: string): Promise<Venture>;                                // setup → active
  scaleVenture(ventureId: string): Promise<Venture>;                                 // active → scaling
  hibernateVenture(ventureId: string, reason: string): Promise<Venture>;             // active|scaling → hibernating
  reactivateVenture(ventureId: string): Promise<Venture>;                            // hibernating → active
  sunsetVenture(ventureId: string, reason: string, sunsetDate: Date): Promise<Venture>; // * → sunset
  archiveVenture(ventureId: string): Promise<Venture>;                               // sunset → archived

  // ── Configuration ────────────────────────────────────────────────────
  getConfig(ventureId: string): Promise<VentureConfig>;
  updateConfig(ventureId: string, config: Partial<VentureConfig>): Promise<VentureConfig>;
  toggleFeature(ventureId: string, feature: string, enabled: boolean): Promise<VentureConfig>;
  setMaintenanceMode(ventureId: string, enabled: boolean, message?: string): Promise<VentureConfig>;

  // ── Health Monitoring ────────────────────────────────────────────────
  recordHealthSnapshot(ventureId: string, snapshot: VentureHealthSnapshot): Promise<HealthSnapshot>;
  getLatestHealth(ventureId: string): Promise<HealthSnapshot | null>;
  getHealthHistory(ventureId: string, options?: { startDate?: Date; endDate?: Date; limit?: number }): Promise<HealthSnapshot[]>;
  getHealthHeatmap(): Promise<HealthHeatmapData>;        // All ventures, latest health

  // ── KPI Management ───────────────────────────────────────────────────
  createKpi(ventureId: string, input: KpiDefinition): Promise<VentureKpi>;
  recordKpi(kpiId: string, record: VentureKpiRecord): Promise<KpiRecord>;
  getKpiDashboard(ventureId: string, period?: string): Promise<KpiDashboard>;
  getKpiTrends(ventureId: string, kpiSlug: string, periods?: number): Promise<KpiTrend>;

  // ── Team Management ──────────────────────────────────────────────────
  assignTeamMember(input: TeamAssignmentInput): Promise<TeamAssignment>;
  removeTeamMember(ventureId: string, userId: string): Promise<void>;
  updateAllocation(assignmentId: string, allocation: number): Promise<TeamAssignment>;
  getTeamRoster(ventureId: string): Promise<TeamAssignment[]>;
  getPersonAllocations(userId: string): Promise<{ venture: Venture; allocation: number; role: string }[]>;

  // ── Tech Stack ───────────────────────────────────────────────────────
  registerTechnology(ventureId: string, entry: TechStackEntry): Promise<TechStack>;
  deprecateTechnology(techId: string, migrationTarget?: string): Promise<TechStack>;
  getTechStack(ventureId: string): Promise<TechStack[]>;
  getTechStackMatrix(): Promise<TechStackMatrix>;        // All ventures, all tech

  // ── Deployments ──────────────────────────────────────────────────────
  registerDeployment(input: DeploymentConfigInput): Promise<Deployment>;
  updateDeploymentStatus(deploymentId: string, status: string, commit?: string): Promise<Deployment>;
  runHealthCheck(deploymentId: string): Promise<HealthCheckResult>;
  getDeploymentMatrix(): Promise<DeploymentMatrix>;      // All ventures, all environments

  // ── Milestones ───────────────────────────────────────────────────────
  createMilestone(ventureId: string, input: MilestoneInput): Promise<Milestone>;
  updateMilestoneProgress(milestoneId: string, percent: number, notes?: string): Promise<Milestone>;
  completeMilestone(milestoneId: string, evidence?: object[]): Promise<Milestone>;
  getMilestoneTimeline(ventureId: string): Promise<Milestone[]>;
}
```

### Key Behaviors

1. **Lifecycle enforcement**: Status transitions are validated against the state machine. Attempting `launchVenture` on a venture in `concept` status throws `BUSINESS_RULE_VIOLATION`. Only valid transitions are permitted.
2. **Tenant synchronization**: When a venture transitions to `setup`, the system automatically creates a corresponding tenant in `@mcv/identity` and links it via `tenantId`. The tenant inherits the venture slug as its identifier.
3. **Health score calculation**: The composite health score (0–100) is a weighted average of five dimensions: financial (30%), product (25%), team (20%), market (15%), compliance (10%). Weights are configurable per venture.
4. **KPI auto-status**: When a KPI record is created, the system compares the value against `warningThreshold` and `criticalThreshold` to set the status automatically: `exceeded` if value beats target, `on_track` if above warning, `at_risk` if between warning and critical, `off_track` if below critical.
5. **Allocation validation**: Team allocation across all ventures for a single user cannot exceed 100%. Attempting to over-allocate throws `ALLOCATION_EXCEEDED`.
6. **Audit trail**: Every lifecycle transition, configuration change, and team assignment emits a `portfolio.ventures.*` event to `@mcv/fabric` for the audit log.
7. **Cascade on archive**: Archiving a venture sets all team assignments to `isActive: false`, marks all active deployments as `archived`, and freezes all KPI tracking.

---

## Module: entities

### Purpose

Manages the legal structure of the MCV consortium — every corporation, LLC, partnership, holding company, and subsidiary. Tracks ownership hierarchies (which entity owns which), registered agents across jurisdictions, corporate officers and directors, compliance status per jurisdiction, and provides a secure vault for corporate documents (articles of incorporation, operating agreements, tax filings, etc.).

The consortium's legal structure is complex: a parent holding company owns percentages of multiple operating entities, some ventures share legal entities, and jurisdictional requirements vary. This module keeps it all organized and auditable.

### Entity Hierarchy (MCV Example)

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

### Database Schema

```typescript
// portfolio_legal_entities — Legal Entities Table
export const legalEntities = pgTable('portfolio_legal_entities', {
  id: uuid('id').primaryKey().defaultRandom(),
  ventureId: uuid('venture_id').references(() => ventures.id, { onDelete: 'set null' }),
  name: text('name').notNull(),                          // "BetEdge Technologies LLC"
  legalName: text('legal_name').notNull(),               // Full legal name as registered
  dbaNames: text('dba_names').array(),                   // ["BetEdge", "BetEdge AI"]
  entityType: entityTypeEnum('entity_type').notNull(),   // c_corp|s_corp|llc|lp|llp|sole_prop|trust|holding
  status: entityStatusEnum('status').default('active'),  // active|inactive|dissolved|suspended|pending_formation
  ein: text('ein'),                                      // Federal EIN (encrypted)
  stateId: text('state_id'),                             // State registration number
  formationDate: timestamp('formation_date', { withTimezone: true }),
  formationState: text('formation_state'),               // "Delaware", "Nevada", etc.
  formationCountry: text('formation_country').default('US'),
  fiscalYearEnd: text('fiscal_year_end').default('12-31'), // MM-DD
  taxClassification: text('tax_classification'),         // "C-Corp" | "S-Corp" | "Partnership" | "Disregarded"
  registeredAddress: jsonb('registered_address'),
  // { street: '123 Main St', suite: '400', city: 'Wilmington', state: 'DE', zip: '19801', country: 'US' }
  mailingAddress: jsonb('mailing_address'),
  phone: text('phone'),
  email: text('email'),
  website: text('website'),
  isHoldingCompany: boolean('is_holding_company').default(false),
  isOperating: boolean('is_operating').default(true),
  annualReportDue: timestamp('annual_report_due', { withTimezone: true }),
  lastAnnualReport: timestamp('last_annual_report', { withTimezone: true }),
  goodStanding: boolean('good_standing').default(true),
  goodStandingVerifiedAt: timestamp('good_standing_verified_at', { withTimezone: true }),
  notes: text('notes'),
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

// portfolio_entity_hierarchies — Parent-Child Entity Relationships
export const entityHierarchies = pgTable('portfolio_entity_hierarchies', {
  id: uuid('id').primaryKey().defaultRandom(),
  parentEntityId: uuid('parent_entity_id').references(() => legalEntities.id, { onDelete: 'cascade' }).notNull(),
  childEntityId: uuid('child_entity_id').references(() => legalEntities.id, { onDelete: 'cascade' }).notNull(),
  relationshipType: text('relationship_type').notNull(), // "subsidiary" | "affiliate" | "division" | "joint_venture"
  ownershipPercent: numeric('ownership_percent', { precision: 5, scale: 2 }), // 0.00 - 100.00
  effectiveDate: timestamp('effective_date', { withTimezone: true }).notNull(),
  terminationDate: timestamp('termination_date', { withTimezone: true }),
  isControlling: boolean('is_controlling').default(false), // >50% ownership
  notes: text('notes'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

// portfolio_ownership_structures — Detailed Ownership Records
export const ownershipStructures = pgTable('portfolio_ownership_structures', {
  id: uuid('id').primaryKey().defaultRandom(),
  entityId: uuid('entity_id').references(() => legalEntities.id, { onDelete: 'cascade' }).notNull(),
  ownerType: text('owner_type').notNull(),               // "entity" | "individual" | "trust" | "fund"
  ownerEntityId: uuid('owner_entity_id').references(() => legalEntities.id),
  ownerName: text('owner_name'),                         // For individual/trust owners
  ownershipType: text('ownership_type').notNull(),       // "equity" | "membership_interest" | "limited_partner" | "general_partner"
  ownershipPercent: numeric('ownership_percent', { precision: 7, scale: 4 }).notNull(),
  votingPercent: numeric('voting_percent', { precision: 7, scale: 4 }),
  shareClass: text('share_class'),                       // "Common" | "Preferred A" | "Preferred B"
  numberOfShares: integer('number_of_shares'),
  parValue: numeric('par_value', { precision: 19, scale: 4 }),
  capitalContribution: numeric('capital_contribution', { precision: 19, scale: 4 }),
  effectiveDate: timestamp('effective_date', { withTimezone: true }).notNull(),
  terminationDate: timestamp('termination_date', { withTimezone: true }),
  vestingSchedule: jsonb('vesting_schedule'),
  // { cliff: 12, totalMonths: 48, vestedPercent: 25 }
  restrictions: jsonb('restrictions'),
  // { transferRestriction: true, rightOfFirstRefusal: true, dragAlong: true }
  notes: text('notes'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

// portfolio_registered_agents — Registered Agent Records
export const registeredAgents = pgTable('portfolio_registered_agents', {
  id: uuid('id').primaryKey().defaultRandom(),
  entityId: uuid('entity_id').references(() => legalEntities.id, { onDelete: 'cascade' }).notNull(),
  jurisdiction: text('jurisdiction').notNull(),           // "Delaware", "Nevada", "Ontario"
  agentName: text('agent_name').notNull(),                // "CT Corporation System"
  agentAddress: jsonb('agent_address').notNull(),
  agentPhone: text('agent_phone'),
  agentEmail: text('agent_email'),
  serviceProvider: text('service_provider'),              // "CT Corporation", "Registered Agents Inc."
  annualCost: numeric('annual_cost', { precision: 19, scale: 4 }),
  renewalDate: timestamp('renewal_date', { withTimezone: true }),
  isActive: boolean('is_active').default(true),
  notes: text('notes'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

// portfolio_corporate_documents — Corporate Document Vault
export const corporateDocuments = pgTable('portfolio_corporate_documents', {
  id: uuid('id').primaryKey().defaultRandom(),
  entityId: uuid('entity_id').references(() => legalEntities.id, { onDelete: 'cascade' }).notNull(),
  documentType: documentTypeEnum('document_type').notNull(),
  // articles_of_incorporation|operating_agreement|bylaws|annual_report|tax_return|
  // board_resolution|meeting_minutes|stock_certificate|amendment|certificate_of_good_standing|
  // foreign_qualification|ein_letter|bank_resolution|nda|ip_assignment
  title: text('title').notNull(),
  description: text('description'),
  fileUrl: text('file_url').notNull(),                   // Supabase Storage URL
  fileSize: integer('file_size'),                        // bytes
  mimeType: text('mime_type'),
  version: integer('version').default(1),
  previousVersionId: uuid('previous_version_id'),
  effectiveDate: timestamp('effective_date', { withTimezone: true }),
  expirationDate: timestamp('expiration_date', { withTimezone: true }),
  isConfidential: boolean('is_confidential').default(false),
  accessLevel: text('access_level').default('admin'),    // "super_admin" | "admin" | "manager" | "all"
  tags: text('tags').array(),
  uploadedBy: uuid('uploaded_by'),
  reviewedBy: uuid('reviewed_by'),
  reviewedAt: timestamp('reviewed_at', { withTimezone: true }),
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

// portfolio_entity_compliance_records — Compliance Tracking
export const entityComplianceRecords = pgTable('portfolio_entity_compliance_records', {
  id: uuid('id').primaryKey().defaultRandom(),
  entityId: uuid('entity_id').references(() => legalEntities.id, { onDelete: 'cascade' }).notNull(),
  jurisdiction: text('jurisdiction').notNull(),
  requirementType: text('requirement_type').notNull(),   // "annual_report" | "tax_filing" | "franchise_tax" | "foreign_qualification" | "business_license"
  requirementName: text('requirement_name').notNull(),
  status: complianceStatusEnum('status').default('pending'), // compliant|pending|overdue|waived|not_applicable
  dueDate: timestamp('due_date', { withTimezone: true }),
  completedDate: timestamp('completed_date', { withTimezone: true }),
  filedBy: uuid('filed_by'),
  confirmationNumber: text('confirmation_number'),
  cost: numeric('cost', { precision: 19, scale: 4 }),
  penaltyAmount: numeric('penalty_amount', { precision: 19, scale: 4 }),
  documentId: uuid('document_id').references(() => corporateDocuments.id),
  notes: text('notes'),
  reminderSentAt: timestamp('reminder_sent_at', { withTimezone: true }),
  nextDueDate: timestamp('next_due_date', { withTimezone: true }),
  isRecurring: boolean('is_recurring').default(true),
  recurringFrequency: text('recurring_frequency'),       // "annual" | "quarterly" | "monthly"
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

// portfolio_entity_officers — Officers and Directors
export const entityOfficers = pgTable('portfolio_entity_officers', {
  id: uuid('id').primaryKey().defaultRandom(),
  entityId: uuid('entity_id').references(() => legalEntities.id, { onDelete: 'cascade' }).notNull(),
  userId: uuid('user_id'),                               // If MCV team member
  fullName: text('full_name').notNull(),
  role: text('role').notNull(),                          // "CEO" | "CFO" | "CTO" | "Director" | "Secretary" | "Treasurer" | "Member/Manager"
  title: text('title'),                                  // Full title
  email: text('email'),
  phone: text('phone'),
  address: jsonb('address'),
  appointedDate: timestamp('appointed_date', { withTimezone: true }).notNull(),
  resignedDate: timestamp('resigned_date', { withTimezone: true }),
  isActive: boolean('is_active').default(true),
  isSignatory: boolean('is_signatory').default(false),   // Can sign on behalf of entity
  signingAuthority: jsonb('signing_authority'),
  // { maxAmount: 50000, requiresCoSign: true, coSignerRoles: ['CFO'] }
  boardCommittees: text('board_committees').array(),
  compensationDetails: jsonb('compensation_details'),    // Encrypted
  notes: text('notes'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

// portfolio_entity_jurisdictions — Multi-Jurisdiction Registrations
export const entityJurisdictions = pgTable('portfolio_entity_jurisdictions', {
  id: uuid('id').primaryKey().defaultRandom(),
  entityId: uuid('entity_id').references(() => legalEntities.id, { onDelete: 'cascade' }).notNull(),
  jurisdiction: text('jurisdiction').notNull(),           // "California", "New York", "Ontario"
  registrationType: text('registration_type').notNull(), // "domestic" | "foreign_qualification" | "doing_business_as"
  registrationNumber: text('registration_number'),
  registrationDate: timestamp('registration_date', { withTimezone: true }),
  status: text('status').default('active'),              // "active" | "withdrawn" | "revoked" | "pending"
  annualCost: numeric('annual_cost', { precision: 19, scale: 4 }),
  agentId: uuid('agent_id').references(() => registeredAgents.id),
  notes: text('notes'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});
```

### Core Interface

```typescript
export class EntityService {
  // ── Entity CRUD ──────────────────────────────────────────────────────
  createEntity(input: CreateEntityInput): Promise<LegalEntity>;
  updateEntity(entityId: string, input: UpdateEntityInput): Promise<LegalEntity>;
  getEntity(entityId: string): Promise<LegalEntity | null>;
  listEntities(options?: { type?: EntityType[]; status?: EntityStatus[]; ventureId?: string }): Promise<LegalEntity[]>;
  dissolveEntity(entityId: string, reason: string, effectiveDate: Date): Promise<LegalEntity>;

  // ── Hierarchy Management ─────────────────────────────────────────────
  addChildEntity(parentId: string, childId: string, input: HierarchyInput): Promise<EntityHierarchy>;
  removeChildEntity(parentId: string, childId: string): Promise<void>;
  getEntityTree(rootEntityId?: string): Promise<EntityTreeNode>;
  getFullHierarchy(): Promise<EntityTreeNode>;           // Full consortium hierarchy

  // ── Ownership ────────────────────────────────────────────────────────
  recordOwnership(entityId: string, input: OwnershipStructureInput): Promise<OwnershipStructure>;
  updateOwnership(ownershipId: string, input: Partial<OwnershipStructureInput>): Promise<OwnershipStructure>;
  getOwnershipTable(entityId: string): Promise<OwnershipStructure[]>;
  getCapTable(entityId: string): Promise<CapTable>;      // Full cap table with dilution calcs

  // ── Officers & Directors ─────────────────────────────────────────────
  appointOfficer(entityId: string, input: OfficerInput): Promise<EntityOfficer>;
  removeOfficer(officerId: string, resignedDate: Date): Promise<EntityOfficer>;
  getOfficers(entityId: string): Promise<EntityOfficer[]>;
  getSignatories(entityId: string): Promise<EntityOfficer[]>;

  // ── Registered Agents ────────────────────────────────────────────────
  registerAgent(entityId: string, input: RegisteredAgentInput): Promise<RegisteredAgent>;
  updateAgent(agentId: string, input: Partial<RegisteredAgentInput>): Promise<RegisteredAgent>;
  getAgents(entityId: string): Promise<RegisteredAgent[]>;

  // ── Documents ────────────────────────────────────────────────────────
  uploadDocument(entityId: string, input: CorporateDocumentInput): Promise<CorporateDocument>;
  getDocuments(entityId: string, options?: { type?: DocumentType[]; tags?: string[] }): Promise<CorporateDocument[]>;
  getDocumentVersionHistory(documentId: string): Promise<CorporateDocument[]>;

  // ── Compliance ───────────────────────────────────────────────────────
  recordComplianceCheck(entityId: string, input: ComplianceCheckInput): Promise<ComplianceRecord>;
  getComplianceStatus(entityId: string): Promise<ComplianceRecord[]>;
  getComplianceMatrix(): Promise<ComplianceMatrix>;      // All entities, all jurisdictions
  getUpcomingDeadlines(daysAhead?: number): Promise<ComplianceRecord[]>;

  // ── Jurisdictions ────────────────────────────────────────────────────
  registerInJurisdiction(entityId: string, input: JurisdictionInput): Promise<EntityJurisdiction>;
  withdrawFromJurisdiction(jurisdictionId: string, effectiveDate: Date): Promise<EntityJurisdiction>;
  getJurisdictions(entityId: string): Promise<EntityJurisdiction[]>;
}
```

### Key Behaviors

1. **EIN encryption**: Federal EIN values are encrypted at rest using `@mcv/kernel/config/secrets`. The `ein` field is only decrypted when accessed by users with `super_admin` or `entity_admin` roles.
2. **Hierarchy validation**: Circular references are prohibited. Adding entity A as a child of entity B when B is already a descendant of A throws `CIRCULAR_HIERARCHY_DETECTED`.
3. **Ownership validation**: Total ownership percentages for an entity cannot exceed 100%. The system validates on insert/update.
4. **Good standing monitoring**: A cron job runs weekly to check good standing status for all active entities. Entities approaching annual report due dates (30 days) trigger compliance alerts.
5. **Document versioning**: Uploading a new version of an existing document type creates a new record with `previousVersionId` linking to the prior version. The latest version is always returned by default.
6. **Compliance cascade**: When an entity registers in a new jurisdiction, the system automatically creates compliance records for all known requirements in that jurisdiction (annual report, franchise tax, etc.).
7. **Signatory authority**: Officers marked as signatories can sign documents up to their `maxAmount`. Amounts exceeding the limit require co-signatures from officers in `coSignerRoles`.

---

## Module: grants

### Purpose

Manages the complete grant lifecycle from initial discovery of funding opportunities through application submission, award notification, milestone tracking, disbursement management, compliance reporting, and closeout. Each grant has its own budget, timeline, and compliance requirements independent of the venture's operating budget.

This is critical for ventures like Full Gain (which is itself a grants platform), but also for consortium-level grants (SBIR/STTR, state economic development incentives, innovation grants) that fund MCV ventures directly.

### Grant Lifecycle State Machine

```
┌────────────┐   qualify    ┌────────────┐    apply     ┌────────────┐
│            │─────────────▶│            │─────────────▶│            │
│ DISCOVERED │              │ QUALIFIED  │              │  APPLIED   │
│            │◀─ ─ ─ ─ ─ ─ │            │              │            │
└────────────┘  disqualify  └────────────┘              └─────┬──────┘
                                                              │
                                          ┌───────────────────┼───────────────────┐
                                          │                   │                   │
                                          ▼                   ▼                   ▼
                                   ┌────────────┐     ┌────────────┐     ┌────────────┐
                                   │            │     │            │     │            │
                                   │  AWARDED   │     │ DECLINED   │     │ WITHDRAWN  │
                                   │            │     │            │     │            │
                                   └─────┬──────┘     └────────────┘     └────────────┘
                                         │
                                         │ begin
                                         ▼
                                   ┌────────────┐
                                   │            │
                                   │   ACTIVE   │──────────────────────┐
                                   │            │                      │
                                   └─────┬──────┘                      │
                                         │                             │
                                    ┌────┴─────┐                       │
                                    │          │                       │
                                    ▼          ▼                       ▼
                             ┌────────────┐ ┌────────────┐    ┌────────────┐
                             │            │ │            │    │            │
                             │ COMPLETED  │ │ ON HOLD    │    │ TERMINATED │
                             │            │ │            │    │            │
                             └─────┬──────┘ └────────────┘    └────────────┘
                                   │
                                   │ close
                                   ▼
                             ┌────────────┐
                             │            │
                             │  CLOSED    │
                             │            │
                             └────────────┘
```

### Database Schema

```typescript
// portfolio_grants — Grants Master Table
export const grants = pgTable('portfolio_grants', {
  id: uuid('id').primaryKey().defaultRandom(),
  ventureId: uuid('venture_id').references(() => ventures.id, { onDelete: 'set null' }),
  entityId: uuid('entity_id').references(() => legalEntities.id, { onDelete: 'set null' }),
  title: text('title').notNull(),                        // "SBIR Phase I — AI Sports Analytics"
  grantNumber: text('grant_number'),                     // Assigned grant/award number
  fundingSource: text('funding_source').notNull(),       // "NSF", "DOE", "State of Delaware", etc.
  fundingAgency: text('funding_agency'),                 // "National Science Foundation"
  program: text('program'),                              // "SBIR Phase I", "STTR", "Innovation Fund"
  category: text('category').notNull(),                  // "federal" | "state" | "private" | "foundation" | "corporate"
  status: grantStatusEnum('status').default('discovered'),
  // discovered|qualified|applied|awarded|declined|withdrawn|active|on_hold|completed|terminated|closed
  description: text('description'),
  purpose: text('purpose'),                              // How funds will be used
  requestedAmount: numeric('requested_amount', { precision: 19, scale: 4 }),
  awardedAmount: numeric('awarded_amount', { precision: 19, scale: 4 }),
  disbursedAmount: numeric('disbursed_amount', { precision: 19, scale: 4 }).default('0'),
  remainingAmount: numeric('remaining_amount', { precision: 19, scale: 4 }),
  matchRequired: boolean('match_required').default(false),
  matchAmount: numeric('match_amount', { precision: 19, scale: 4 }),
  matchType: text('match_type'),                         // "cash" | "in_kind" | "both"
  currency: text('currency').default('USD'),
  applicationDeadline: timestamp('application_deadline', { withTimezone: true }),
  awardDate: timestamp('award_date', { withTimezone: true }),
  startDate: timestamp('start_date', { withTimezone: true }),
  endDate: timestamp('end_date', { withTimezone: true }),
  closeoutDate: timestamp('closeout_date', { withTimezone: true }),
  performancePeriod: text('performance_period'),         // "12 months", "24 months"
  cfda: text('cfda'),                                    // CFDA number for federal grants
  grantUrl: text('grant_url'),                           // URL to opportunity listing
  contactName: text('contact_name'),                     // Primary contact at funder
  contactEmail: text('contact_email'),
  notes: text('notes'),
  tags: text('tags').array(),
  metadata: jsonb('metadata'),
  createdBy: uuid('created_by'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

// portfolio_grant_applications — Application Submissions
export const grantApplications = pgTable('portfolio_grant_applications', {
  id: uuid('id').primaryKey().defaultRandom(),
  grantId: uuid('grant_id').references(() => grants.id, { onDelete: 'cascade' }).notNull(),
  applicationNumber: text('application_number'),
  status: applicationStatusEnum('status').default('drafting'),
  // drafting|internal_review|submitted|under_review|revision_requested|awarded|declined
  version: integer('version').default(1),
  submittedAt: timestamp('submitted_at', { withTimezone: true }),
  submittedBy: uuid('submitted_by'),
  narrativeUrl: text('narrative_url'),                   // Uploaded narrative document
  budgetUrl: text('budget_url'),                         // Budget justification document
  supportingDocs: jsonb('supporting_docs').default([]),
  // [{ name: 'Letter of Support', url: '...', type: 'pdf' }]
  reviewerComments: jsonb('reviewer_comments').default([]),
  internalScore: numeric('internal_score', { precision: 5, scale: 2 }),
  internalReviewNotes: text('internal_review_notes'),
  revisionNotes: text('revision_notes'),
  feedbackFromFunder: text('feedback_from_funder'),
  keyPersonnel: jsonb('key_personnel').default([]),
  // [{ name: 'John Smith', role: 'PI', percentEffort: 25 }]
  partnersCollaborators: jsonb('partners_collaborators').default([]),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

// portfolio_grant_milestones — Milestone Definitions & Tracking
export const grantMilestones = pgTable('portfolio_grant_milestones', {
  id: uuid('id').primaryKey().defaultRandom(),
  grantId: uuid('grant_id').references(() => grants.id, { onDelete: 'cascade' }).notNull(),
  title: text('title').notNull(),                        // "Prototype Development Complete"
  description: text('description'),
  milestoneNumber: integer('milestone_number').notNull(),
  status: milestoneStatusEnum('status').default('not_started'),
  // not_started|in_progress|completed|overdue|waived
  targetDate: timestamp('target_date', { withTimezone: true }).notNull(),
  completedDate: timestamp('completed_date', { withTimezone: true }),
  deliverables: jsonb('deliverables').default([]),
  // [{ title: 'Technical Report', type: 'document', required: true, submittedUrl: null }]
  fundingTrigger: boolean('funding_trigger').default(false), // Disbursement tied to this milestone
  triggerAmount: numeric('trigger_amount', { precision: 19, scale: 4 }),
  completionEvidence: jsonb('completion_evidence').default([]),
  verifiedBy: uuid('verified_by'),
  verifiedAt: timestamp('verified_at', { withTimezone: true }),
  notes: text('notes'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

// portfolio_grant_disbursements — Funding Disbursement Records
export const grantDisbursements = pgTable('portfolio_grant_disbursements', {
  id: uuid('id').primaryKey().defaultRandom(),
  grantId: uuid('grant_id').references(() => grants.id, { onDelete: 'cascade' }).notNull(),
  milestoneId: uuid('milestone_id').references(() => grantMilestones.id),
  disbursementNumber: text('disbursement_number').notNull(), // "DISB-2026-001"
  amount: numeric('amount', { precision: 19, scale: 4 }).notNull(),
  currency: text('currency').default('USD'),
  status: disbursementStatusEnum('status').default('pending'),
  // pending|approved|received|deposited|returned
  requestedDate: timestamp('requested_date', { withTimezone: true }),
  approvedDate: timestamp('approved_date', { withTimezone: true }),
  receivedDate: timestamp('received_date', { withTimezone: true }),
  depositedDate: timestamp('deposited_date', { withTimezone: true }),
  bankAccount: text('bank_account'),                     // Last 4 digits
  referenceNumber: text('reference_number'),             // Wire/ACH reference
  paymentMethod: text('payment_method'),                 // "wire" | "ach" | "check"
  notes: text('notes'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

// portfolio_grant_compliance_reports — Compliance Report Submissions
export const grantComplianceReports = pgTable('portfolio_grant_compliance_reports', {
  id: uuid('id').primaryKey().defaultRandom(),
  grantId: uuid('grant_id').references(() => grants.id, { onDelete: 'cascade' }).notNull(),
  reportType: text('report_type').notNull(),             // "progress" | "financial" | "final" | "annual" | "audit"
  reportPeriod: text('report_period').notNull(),         // "2026-Q1", "2026-H1"
  title: text('title').notNull(),
  status: text('status').default('drafting'),            // "drafting" | "internal_review" | "submitted" | "accepted" | "revision_required"
  dueDate: timestamp('due_date', { withTimezone: true }).notNull(),
  submittedAt: timestamp('submitted_at', { withTimezone: true }),
  submittedBy: uuid('submitted_by'),
  documentUrl: text('document_url'),
  financialSummary: jsonb('financial_summary'),
  // { totalExpended: 45000, totalBudget: 150000, percentExpended: 30, byCategory: {...} }
  progressSummary: text('progress_summary'),
  challenges: text('challenges'),
  nextSteps: text('next_steps'),
  reviewComments: text('review_comments'),
  acceptedAt: timestamp('accepted_at', { withTimezone: true }),
  notes: text('notes'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

// portfolio_grant_budgets — Grant-Specific Budgets
export const grantBudgets = pgTable('portfolio_grant_budgets', {
  id: uuid('id').primaryKey().defaultRandom(),
  grantId: uuid('grant_id').references(() => grants.id, { onDelete: 'cascade' }).notNull(),
  version: integer('version').default(1),
  status: text('status').default('draft'),               // "draft" | "submitted" | "approved" | "revised"
  totalBudget: numeric('total_budget', { precision: 19, scale: 4 }).notNull(),
  indirectCostRate: numeric('indirect_cost_rate', { precision: 5, scale: 2 }), // e.g., 52.5%
  indirectCostBase: text('indirect_cost_base'),          // "MTDC" | "TDC" | "salary_and_wages"
  totalDirect: numeric('total_direct', { precision: 19, scale: 4 }),
  totalIndirect: numeric('total_indirect', { precision: 19, scale: 4 }),
  costShare: numeric('cost_share', { precision: 19, scale: 4 }),
  approvedBy: uuid('approved_by'),
  approvedAt: timestamp('approved_at', { withTimezone: true }),
  notes: text('notes'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

// portfolio_grant_budget_lines — Grant Budget Line Items
export const grantBudgetLines = pgTable('portfolio_grant_budget_lines', {
  id: uuid('id').primaryKey().defaultRandom(),
  budgetId: uuid('budget_id').references(() => grantBudgets.id, { onDelete: 'cascade' }).notNull(),
  category: text('category').notNull(),                  // "personnel" | "fringe" | "travel" | "equipment" | "supplies" | "contractual" | "other" | "indirect"
  subcategory: text('subcategory'),                      // "PI salary", "Postdoc salary"
  description: text('description').notNull(),
  budgetedAmount: numeric('budgeted_amount', { precision: 19, scale: 4 }).notNull(),
  expendedAmount: numeric('expended_amount', { precision: 19, scale: 4 }).default('0'),
  encumberedAmount: numeric('encumbered_amount', { precision: 19, scale: 4 }).default('0'),
  remainingAmount: numeric('remaining_amount', { precision: 19, scale: 4 }),
  justification: text('justification'),                  // Budget justification narrative
  periodAllocations: jsonb('period_allocations'),
  isDirectCost: boolean('is_direct_cost').default(true),
  notes: text('notes'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

// portfolio_grant_deadlines — Deadline Tracking
export const grantDeadlines = pgTable('portfolio_grant_deadlines', {
  id: uuid('id').primaryKey().defaultRandom(),
  grantId: uuid('grant_id').references(() => grants.id, { onDelete: 'cascade' }).notNull(),
  title: text('title').notNull(),                        // "Q1 Progress Report Due"
  description: text('description'),
  deadlineType: text('deadline_type').notNull(),         // "application" | "report" | "milestone" | "disbursement_request" | "compliance" | "audit"
  dueDate: timestamp('due_date', { withTimezone: true }).notNull(),
  status: text('status').default('upcoming'),            // "upcoming" | "approaching" | "due_today" | "overdue" | "completed" | "waived"
  completedAt: timestamp('completed_at', { withTimezone: true }),
  completedBy: uuid('completed_by'),
  reminderDays: integer('reminder_days').array().default([30, 14, 7, 3, 1]),
  lastReminderSent: timestamp('last_reminder_sent', { withTimezone: true }),
  assigneeId: uuid('assignee_id'),
  isRecurring: boolean('is_recurring').default(false),
  recurringFrequency: text('recurring_frequency'),       // "quarterly" | "annual" | "semi_annual"
  linkedRecordType: text('linked_record_type'),          // "milestone" | "compliance_report" | "application"
  linkedRecordId: uuid('linked_record_id'),
  notes: text('notes'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

// portfolio_grant_documents — Supporting Documents
export const grantDocuments = pgTable('portfolio_grant_documents', {
  id: uuid('id').primaryKey().defaultRandom(),
  grantId: uuid('grant_id').references(() => grants.id, { onDelete: 'cascade' }).notNull(),
  title: text('title').notNull(),
  documentType: text('document_type').notNull(),         // "application" | "budget" | "report" | "correspondence" | "award_letter" | "amendment" | "audit"
  fileUrl: text('file_url').notNull(),
  fileSize: integer('file_size'),
  mimeType: text('mime_type'),
  uploadedBy: uuid('uploaded_by'),
  notes: text('notes'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

// portfolio_grant_contacts — Grantor Contacts
export const grantContacts = pgTable('portfolio_grant_contacts', {
  id: uuid('id').primaryKey().defaultRandom(),
  grantId: uuid('grant_id').references(() => grants.id, { onDelete: 'cascade' }).notNull(),
  name: text('name').notNull(),
  role: text('role').notNull(),                          // "program_officer" | "grants_specialist" | "financial_officer" | "technical_monitor"
  email: text('email'),
  phone: text('phone'),
  organization: text('organization'),
  isPrimary: boolean('is_primary').default(false),
  notes: text('notes'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});
```

### Core Interface

```typescript
export class GrantService {
  // ── Grant CRUD ───────────────────────────────────────────────────────
  createGrant(input: CreateGrantInput): Promise<Grant>;
  updateGrant(grantId: string, input: Partial<CreateGrantInput>): Promise<Grant>;
  getGrant(grantId: string): Promise<Grant | null>;
  listGrants(options?: { ventureId?: string; status?: GrantStatus[]; category?: string; fundingSource?: string }): Promise<Grant[]>;

  // ── Lifecycle Transitions ────────────────────────────────────────────
  qualifyGrant(grantId: string, notes?: string): Promise<Grant>;               // discovered → qualified
  disqualifyGrant(grantId: string, reason: string): Promise<Grant>;            // qualified → discovered
  applyForGrant(grantId: string): Promise<Grant>;                              // qualified → applied
  withdrawApplication(grantId: string, reason: string): Promise<Grant>;        // applied → withdrawn
  recordAward(grantId: string, awardedAmount: string, awardDate: Date): Promise<Grant>; // applied → awarded
  recordDecline(grantId: string, feedback?: string): Promise<Grant>;           // applied → declined
  activateGrant(grantId: string, startDate: Date, endDate: Date): Promise<Grant>; // awarded → active
  holdGrant(grantId: string, reason: string): Promise<Grant>;                  // active → on_hold
  resumeGrant(grantId: string): Promise<Grant>;                                // on_hold → active
  completeGrant(grantId: string): Promise<Grant>;                              // active → completed
  terminateGrant(grantId: string, reason: string): Promise<Grant>;             // active → terminated
  closeGrant(grantId: string): Promise<Grant>;                                 // completed → closed

  // ── Applications ─────────────────────────────────────────────────────
  createApplication(grantId: string, input: GrantApplicationInput): Promise<GrantApplication>;
  submitApplication(applicationId: string): Promise<GrantApplication>;
  reviseApplication(applicationId: string, notes: string): Promise<GrantApplication>;
  getApplication(applicationId: string): Promise<GrantApplication | null>;

  // ── Milestones ───────────────────────────────────────────────────────
  createMilestone(grantId: string, input: GrantMilestoneInput): Promise<GrantMilestone>;
  updateMilestoneStatus(milestoneId: string, status: MilestoneStatus, evidence?: object[]): Promise<GrantMilestone>;
  verifyMilestone(milestoneId: string, verifiedBy: string): Promise<GrantMilestone>;
  getMilestones(grantId: string): Promise<GrantMilestone[]>;

  // ── Disbursements ────────────────────────────────────────────────────
  requestDisbursement(grantId: string, input: DisbursementInput): Promise<GrantDisbursement>;
  approveDisbursement(disbursementId: string): Promise<GrantDisbursement>;
  recordReceipt(disbursementId: string, receivedDate: Date, referenceNumber: string): Promise<GrantDisbursement>;
  getDisbursements(grantId: string): Promise<GrantDisbursement[]>;
  getDisbursementSummary(grantId: string): Promise<DisbursementSummary>;

  // ── Compliance Reporting ─────────────────────────────────────────────
  createComplianceReport(grantId: string, input: ComplianceReportInput): Promise<GrantComplianceReport>;
  submitComplianceReport(reportId: string): Promise<GrantComplianceReport>;
  getComplianceReports(grantId: string): Promise<GrantComplianceReport[]>;
  getOverdueReports(): Promise<GrantComplianceReport[]>;

  // ── Budget Management ────────────────────────────────────────────────
  createGrantBudget(grantId: string, input: GrantBudgetInput): Promise<{ budget: GrantBudget; lines: GrantBudgetLine[] }>;
  recordExpenditure(budgetLineId: string, amount: string, description: string): Promise<GrantBudgetLine>;
  getBudgetVsActual(grantId: string): Promise<GrantBudgetComparison>;
  getBurnRate(grantId: string): Promise<GrantBurnRate>;

  // ── Deadlines ────────────────────────────────────────────────────────
  createDeadline(grantId: string, input: DeadlineInput): Promise<GrantDeadline>;
  completeDeadline(deadlineId: string): Promise<GrantDeadline>;
  getUpcomingDeadlines(daysAhead?: number): Promise<GrantDeadline[]>;
  getOverdueDeadlines(): Promise<GrantDeadline[]>;

  // ── Documents ────────────────────────────────────────────────────────
  uploadDocument(grantId: string, input: GrantDocumentInput): Promise<GrantDocument>;
  getDocuments(grantId: string, type?: string): Promise<GrantDocument[]>;

  // ── Analytics ────────────────────────────────────────────────────────
  getGrantPipeline(): Promise<GrantPipelineData>;        // All grants by status
  getFundingForecast(months?: number): Promise<FundingForecast>;
  getGrantsByVenture(): Promise<{ venture: Venture; grants: Grant[]; totalFunding: string }[]>;
}
```

### Key Behaviors

1. **Lifecycle enforcement**: Grant status transitions follow the state machine strictly. Attempting `recordAward` on a grant with status `discovered` throws `INVALID_GRANT_TRANSITION`. The grant must first be qualified and applied.
2. **Deadline auto-generation**: When a grant transitions to `active`, the system automatically creates recurring deadlines for all compliance reports based on the grant's `performancePeriod` and funder requirements.
3. **Disbursement triggers**: When a milestone with `fundingTrigger: true` is verified, the system automatically creates a pending disbursement request for the milestone's `triggerAmount`.
4. **Budget tracking**: Every expenditure recorded against a grant budget line automatically recalculates `expendedAmount`, `remainingAmount`, and checks for over-budget conditions. Over-budget conditions emit warnings to `@mcv/fabric`.
5. **Deadline reminders**: A daily cron job checks all upcoming deadlines against their `reminderDays` array and sends notifications via `@mcv/notifications` to the assigned user and venture lead.
6. **Remaining amount sync**: The grant's `remainingAmount` is automatically recalculated whenever a disbursement status changes: `remainingAmount = awardedAmount - disbursedAmount`.
7. **Federal grant compliance**: Grants with `category: 'federal'` automatically require additional compliance fields (CFDA number, OMB Uniform Guidance, Single Audit).

---

## Module: strategy

### Purpose

Provides the strategic planning and analysis layer for the MCV consortium. Tracks Objectives and Key Results (OKRs) at both the venture and portfolio level, maintains competitive intelligence for each venture's market, calculates TAM/SAM/SOM market sizing, scores and ranks ventures against configurable criteria, tracks investment theses and pivot decisions, manages strategic initiatives, and powers the portfolio-level dashboards that give consortium leadership a birds-eye view.

This is where the consortium answers: *Are we investing in the right ventures? How do they compare? Where should we double down or pull back?*

### OKR Hierarchy

```
┌──────────────────────────────────────────────────────────┐
│                  CONSORTIUM-LEVEL OKR                      │
│  Objective: "Reach $10M ARR across all ventures by Q4"    │
│                                                            │
│  ┌─────────────────────────────────────────────────────┐  │
│  │ KR1: BetEdge reaches $3M ARR (weight: 30%)          │  │
│  │ KR2: SerpSpace reaches $2M ARR (weight: 20%)        │  │
│  │ KR3: Full Gain reaches $1.5M ARR (weight: 15%)      │  │
│  │ KR4: Launch 2 new ventures generating $500K (15%)    │  │
│  │ KR5: Reduce consortium burn rate by 20% (20%)       │  │
│  └─────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────┐
│                  VENTURE-LEVEL OKR (BetEdge)              │
│  Objective: "Become the #1 AI sports betting platform"    │
│                                                            │
│  ┌─────────────────────────────────────────────────────┐  │
│  │ KR1: Reach 50,000 active users (weight: 30%)        │  │
│  │ KR2: Achieve 85% prediction accuracy (weight: 25%)  │  │
│  │ KR3: Launch iOS app with 4.5+ rating (weight: 20%)  │  │
│  │ KR4: Close 3 B2B partnerships (weight: 25%)         │  │
│  └─────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────┘
```

### Database Schema

```typescript
// portfolio_strategic_objectives — OKR Objectives
export const strategicObjectives = pgTable('portfolio_strategic_objectives', {
  id: uuid('id').primaryKey().defaultRandom(),
  ventureId: uuid('venture_id').references(() => ventures.id, { onDelete: 'cascade' }),
  // null ventureId = consortium-level objective
  parentObjectiveId: uuid('parent_objective_id').references(() => strategicObjectives.id),
  title: text('title').notNull(),                        // "Reach $10M ARR across all ventures by Q4"
  description: text('description'),
  status: objectiveStatusEnum('status').default('draft'), // draft|active|completed|cancelled|deferred
  level: text('level').notNull(),                        // "consortium" | "venture" | "team"
  timeframe: text('timeframe').notNull(),                // "2026-Q1", "2026-H1", "2026"
  startDate: timestamp('start_date', { withTimezone: true }),
  endDate: timestamp('end_date', { withTimezone: true }),
  ownerId: uuid('owner_id'),                             // Person responsible
  progress: numeric('progress', { precision: 5, scale: 2 }).default('0'), // 0-100
  confidence: numeric('confidence', { precision: 5, scale: 2 }), // 0-100 confidence of completion
  priority: text('priority').default('medium'),          // "critical" | "high" | "medium" | "low"
  tags: text('tags').array(),
  notes: text('notes'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

// portfolio_key_results — OKR Key Results
export const keyResults = pgTable('portfolio_key_results', {
  id: uuid('id').primaryKey().defaultRandom(),
  objectiveId: uuid('objective_id').references(() => strategicObjectives.id, { onDelete: 'cascade' }).notNull(),
  ventureId: uuid('venture_id').references(() => ventures.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),                        // "Reach 50,000 active users"
  description: text('description'),
  type: keyResultTypeEnum('type').notNull(),             // "numeric" | "percentage" | "currency" | "boolean" | "milestone"
  unit: text('unit'),                                    // "users" | "%" | "USD" | null
  startValue: numeric('start_value', { precision: 19, scale: 4 }).default('0'),
  currentValue: numeric('current_value', { precision: 19, scale: 4 }).default('0'),
  targetValue: numeric('target_value', { precision: 19, scale: 4 }).notNull(),
  progress: numeric('progress', { precision: 5, scale: 2 }).default('0'), // 0-100 (auto-calculated)
  weight: numeric('weight', { precision: 5, scale: 2 }).default('1.0'), // Weighting within objective
  scoringMethod: text('scoring_method').default('linear'), // "linear" | "binary" | "threshold"
  status: text('status').default('not_started'),         // "not_started" | "on_track" | "at_risk" | "off_track" | "completed"
  ownerId: uuid('owner_id'),
  dueDate: timestamp('due_date', { withTimezone: true }),
  completedAt: timestamp('completed_at', { withTimezone: true }),
  notes: text('notes'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

// portfolio_key_result_checkins — Key Result Progress Check-ins
export const keyResultCheckins = pgTable('portfolio_key_result_checkins', {
  id: uuid('id').primaryKey().defaultRandom(),
  keyResultId: uuid('key_result_id').references(() => keyResults.id, { onDelete: 'cascade' }).notNull(),
  checkinDate: timestamp('checkin_date', { withTimezone: true }).notNull(),
  previousValue: numeric('previous_value', { precision: 19, scale: 4 }),
  newValue: numeric('new_value', { precision: 19, scale: 4 }).notNull(),
  confidence: numeric('confidence', { precision: 5, scale: 2 }), // 0-100
  status: text('status').notNull(),                      // "on_track" | "at_risk" | "off_track"
  notes: text('notes'),
  blockers: jsonb('blockers').default([]),
  // [{ description: 'API rate limiting', severity: 'medium', owner: 'CTO' }]
  checkedInBy: uuid('checked_in_by'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

// portfolio_competitive_analyses — Competitive Landscape
export const competitiveAnalyses = pgTable('portfolio_competitive_analyses', {
  id: uuid('id').primaryKey().defaultRandom(),
  ventureId: uuid('venture_id').references(() => ventures.id, { onDelete: 'cascade' }).notNull(),
  title: text('title').notNull(),                        // "Q1 2026 Competitive Landscape — Sports Betting AI"
  analysisDate: timestamp('analysis_date', { withTimezone: true }).notNull(),
  summary: text('summary'),
  strengths: jsonb('strengths').default([]),              // SWOT
  weaknesses: jsonb('weaknesses').default([]),
  opportunities: jsonb('opportunities').default([]),
  threats: jsonb('threats').default([]),
  marketPosition: text('market_position'),               // "leader" | "challenger" | "follower" | "niche"
  competitiveAdvantage: text('competitive_advantage'),
  moatStrength: text('moat_strength'),                   // "strong" | "moderate" | "weak" | "none"
  recommendations: jsonb('recommendations').default([]),
  // [{ priority: 'high', action: 'Accelerate mobile launch', rationale: '...' }]
  conductedBy: uuid('conducted_by'),
  nextReviewDate: timestamp('next_review_date', { withTimezone: true }),
  notes: text('notes'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

// portfolio_competitor_profiles — Individual Competitor Profiles
export const competitorProfiles = pgTable('portfolio_competitor_profiles', {
  id: uuid('id').primaryKey().defaultRandom(),
  analysisId: uuid('analysis_id').references(() => competitiveAnalyses.id, { onDelete: 'cascade' }).notNull(),
  ventureId: uuid('venture_id').references(() => ventures.id, { onDelete: 'cascade' }).notNull(),
  name: text('name').notNull(),                          // "DraftKings"
  website: text('website'),
  description: text('description'),
  threatLevel: text('threat_level').notNull(),           // "critical" | "high" | "medium" | "low" | "emerging"
  fundingStage: text('funding_stage'),                   // "seed" | "series_a" | "public" | "bootstrapped"
  estimatedRevenue: numeric('estimated_revenue', { precision: 19, scale: 4 }),
  estimatedUsers: integer('estimated_users'),
  keyDifferentiators: jsonb('key_differentiators').default([]),
  weaknesses: jsonb('weaknesses').default([]),
  recentMoves: jsonb('recent_moves').default([]),
  // [{ date: '2026-01-15', action: 'Launched AI predictions', impact: 'high' }]
  pricingModel: text('pricing_model'),
  technologyStack: jsonb('technology_stack').default([]),
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

// portfolio_market_sizings — TAM/SAM/SOM Estimates
export const marketSizings = pgTable('portfolio_market_sizings', {
  id: uuid('id').primaryKey().defaultRandom(),
  ventureId: uuid('venture_id').references(() => ventures.id, { onDelete: 'cascade' }).notNull(),
  title: text('title').notNull(),                        // "US Sports Betting AI Market — 2026"
  analysisDate: timestamp('analysis_date', { withTimezone: true }).notNull(),
  method: text('method').notNull(),                      // "top_down" | "bottom_up" | "value_theory"
  currency: text('currency').default('USD'),
  tam: numeric('tam', { precision: 19, scale: 0 }),      // Total Addressable Market
  sam: numeric('sam', { precision: 19, scale: 0 }),      // Serviceable Addressable Market
  som: numeric('som', { precision: 19, scale: 0 }),      // Serviceable Obtainable Market
  tamGrowthRate: numeric('tam_growth_rate', { precision: 5, scale: 2 }), // Annual CAGR %
  marketDrivers: jsonb('market_drivers').default([]),
  // [{ factor: 'State-by-state legalization', impact: 'high', trend: 'growing' }]
  assumptions: jsonb('assumptions').default([]),
  // [{ description: 'US online sports betting grows 15% annually', source: 'Grand View Research' }]
  sources: jsonb('sources').default([]),
  // [{ title: 'Grand View Research 2025', url: '...', accessDate: '2026-01-10' }]
  validUntil: timestamp('valid_until', { withTimezone: true }),
  conductedBy: uuid('conducted_by'),
  notes: text('notes'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

// portfolio_venture_scorecards — Venture Scoring/Ranking
export const ventureScorecards = pgTable('portfolio_venture_scorecards', {
  id: uuid('id').primaryKey().defaultRandom(),
  ventureId: uuid('venture_id').references(() => ventures.id, { onDelete: 'cascade' }).notNull(),
  period: text('period').notNull(),                      // "2026-Q1"
  overallScore: numeric('overall_score', { precision: 5, scale: 2 }).notNull(), // 0-100
  rank: integer('rank'),                                 // Rank among active ventures
  tier: text('tier'),                                    // "A" | "B" | "C" | "D" — based on score ranges
  scores: jsonb('scores').notNull(),
  // {
  //   financial: { score: 85, weight: 0.25, details: { revenue: 150000, growth: 0.15, margin: 0.30 } },
  //   market: { score: 72, weight: 0.20, details: { tam: 5000000000, marketShare: 0.001, nps: 42 } },
  //   product: { score: 80, weight: 0.20, details: { uptime: 99.9, features: 45, velocity: 8 } },
  //   team: { score: 90, weight: 0.15, details: { headcount: 12, retention: 0.92, keyHires: 3 } },
  //   strategic: { score: 78, weight: 0.20, details: { okrProgress: 0.68, pivotRisk: 'low' } },
  // }
  previousScore: numeric('previous_score', { precision: 5, scale: 2 }),
  scoreChange: numeric('score_change', { precision: 5, scale: 2 }),
  recommendations: jsonb('recommendations').default([]),
  // [{ action: 'Increase marketing spend', rationale: '...', priority: 'high' }]
  scoredBy: uuid('scored_by'),
  scoredAt: timestamp('scored_at', { withTimezone: true }).defaultNow().notNull(),
  notes: text('notes'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

// portfolio_scorecard_criteria — Scoring Criteria Definitions
export const scorecardCriteria = pgTable('portfolio_scorecard_criteria', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),                          // "Financial Performance"
  slug: text('slug').notNull().unique(),                 // "financial"
  description: text('description'),
  weight: numeric('weight', { precision: 5, scale: 2 }).notNull(), // 0.00-1.00
  category: text('category').notNull(),                  // "financial" | "market" | "product" | "team" | "strategic"
  metrics: jsonb('metrics').notNull(),
  // [{ name: 'Revenue', slug: 'revenue', weight: 0.40, scoring: { ranges: [...] } }]
  isActive: boolean('is_active').default(true),
  sortOrder: integer('sort_order').default(0),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

// portfolio_investment_theses — Investment Thesis Tracking
export const investmentTheses = pgTable('portfolio_investment_theses', {
  id: uuid('id').primaryKey().defaultRandom(),
  ventureId: uuid('venture_id').references(() => ventures.id, { onDelete: 'cascade' }).notNull(),
  title: text('title').notNull(),                        // "AI disruption of sports betting analytics"
  version: integer('version').default(1),
  status: text('status').default('active'),              // "active" | "validated" | "invalidated" | "revised" | "archived"
  thesis: text('thesis').notNull(),                      // Core thesis statement
  keyAssumptions: jsonb('key_assumptions').notNull(),
  // [{ assumption: 'AI models outperform human handicappers', status: 'validated', evidence: '...' }]
  riskFactors: jsonb('risk_factors').default([]),
  // [{ risk: 'Regulatory changes', likelihood: 'medium', impact: 'high', mitigation: '...' }]
  successCriteria: jsonb('success_criteria').default([]),
  // [{ criterion: 'Reach 85% prediction accuracy', target: '2026-Q2', status: 'on_track' }]
  expectedReturn: text('expected_return'),               // "5-10x in 5 years"
  timeHorizon: text('time_horizon'),                     // "3-5 years"
  investmentToDate: numeric('investment_to_date', { precision: 19, scale: 4 }),
  currentValuation: numeric('current_valuation', { precision: 19, scale: 4 }),
  validatedAt: timestamp('validated_at', { withTimezone: true }),
  invalidatedAt: timestamp('invalidated_at', { withTimezone: true }),
  invalidationReason: text('invalidation_reason'),
  authorId: uuid('author_id'),
  notes: text('notes'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

// portfolio_pivot_decisions — Pivot Decision Log
export const pivotDecisions = pgTable('portfolio_pivot_decisions', {
  id: uuid('id').primaryKey().defaultRandom(),
  ventureId: uuid('venture_id').references(() => ventures.id, { onDelete: 'cascade' }).notNull(),
  title: text('title').notNull(),                        // "Pivot from B2C to B2B"
  pivotType: pivotTypeEnum('pivot_type').notNull(),
  // customer_segment|value_proposition|revenue_model|channel|technology|product|market|platform
  description: text('description').notNull(),
  rationale: text('rationale').notNull(),                // Why we're pivoting
  fromState: text('from_state').notNull(),               // "B2C consumer app"
  toState: text('to_state').notNull(),                   // "B2B API platform"
  decisionDate: timestamp('decision_date', { withTimezone: true }).notNull(),
  implementationStart: timestamp('implementation_start', { withTimezone: true }),
  implementationEnd: timestamp('implementation_end', { withTimezone: true }),
  status: text('status').default('proposed'),            // "proposed" | "approved" | "in_progress" | "completed" | "reverted"
  outcome: text('outcome'),                              // "successful" | "partially_successful" | "failed" | "too_early_to_tell"
  metricsBeforePivot: jsonb('metrics_before_pivot'),
  // { revenue: 50000, users: 5000, growth: 0.05, churn: 0.12 }
  metricsAfterPivot: jsonb('metrics_after_pivot'),
  // { revenue: 120000, users: 200, growth: 0.25, churn: 0.03 }
  lessonsLearned: text('lessons_learned'),
  decisionMakers: jsonb('decision_makers').default([]),
  // [{ userId: '...', name: 'CEO', vote: 'approve' }]
  supportingData: jsonb('supporting_data').default([]),
  notes: text('notes'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

// portfolio_strategic_initiatives — Strategic Initiative Tracking
export const strategicInitiatives = pgTable('portfolio_strategic_initiatives', {
  id: uuid('id').primaryKey().defaultRandom(),
  ventureId: uuid('venture_id').references(() => ventures.id, { onDelete: 'cascade' }),
  // null ventureId = consortium-level initiative
  objectiveId: uuid('objective_id').references(() => strategicObjectives.id),
  title: text('title').notNull(),                        // "Build Unified Analytics Dashboard"
  description: text('description'),
  status: initiativeStatusEnum('status').default('proposed'),
  // proposed|approved|planning|in_progress|completed|cancelled|on_hold
  priority: text('priority').default('medium'),
  ownerId: uuid('owner_id'),
  startDate: timestamp('start_date', { withTimezone: true }),
  targetDate: timestamp('target_date', { withTimezone: true }),
  completedAt: timestamp('completed_at', { withTimezone: true }),
  budgetAllocated: numeric('budget_allocated', { precision: 19, scale: 4 }),
  budgetSpent: numeric('budget_spent', { precision: 19, scale: 4 }).default('0'),
  progressPercent: integer('progress_percent').default(0),
  milestones: jsonb('milestones').default([]),
  // [{ title: 'Phase 1 Complete', dueDate: '2026-03-01', status: 'completed' }]
  dependencies: jsonb('dependencies').default([]),
  risks: jsonb('risks').default([]),
  outcomes: jsonb('outcomes').default([]),
  notes: text('notes'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

// portfolio_dashboards — Dashboard Configurations
export const portfolioDashboards = pgTable('portfolio_dashboards', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),                          // "Consortium Overview"
  description: text('description'),
  layout: text('layout').default('grid'),                // "grid" | "kanban" | "list"
  isDefault: boolean('is_default').default(false),
  isPublic: boolean('is_public').default(false),         // Visible to all authorized users
  columns: integer('columns').default(3),
  refreshInterval: integer('refresh_interval').default(300), // seconds
  filters: jsonb('filters').default({}),
  // { ventures: ['all'], dateRange: 'last_90_days', metrics: [...] }
  createdBy: uuid('created_by'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

// portfolio_dashboard_widgets — Dashboard Widget Definitions
export const dashboardWidgets = pgTable('portfolio_dashboard_widgets', {
  id: uuid('id').primaryKey().defaultRandom(),
  dashboardId: uuid('dashboard_id').references(() => portfolioDashboards.id, { onDelete: 'cascade' }).notNull(),
  widgetType: text('widget_type').notNull(),             // "kpi_card" | "health_heatmap" | "grant_pipeline" | "okr_progress" | "venture_ranking" | "chart" | "table" | "metric"
  title: text('title').notNull(),
  description: text('description'),
  dataSource: text('data_source').notNull(),             // "ventures.health" | "grants.pipeline" | "strategy.okrs" | "kpis.mrr"
  config: jsonb('config').notNull().default({}),
  // {
  //   chartType: 'bar',
  //   timeRange: 'last_12_months',
  //   ventures: ['all'],
  //   metric: 'revenue',
  //   aggregation: 'sum',
  //   comparison: 'previous_period',
  // }
  position: jsonb('position').notNull().default({}),
  // { row: 0, col: 0, width: 1, height: 1 }
  refreshInterval: integer('refresh_interval'),          // Override dashboard default (seconds)
  isVisible: boolean('is_visible').default(true),
  sortOrder: integer('sort_order').default(0),
  cachedData: jsonb('cached_data'),                      // Last fetched data for fast rendering
  cachedAt: timestamp('cached_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});
```

### Core Interface

```typescript
export class StrategyService {
  // ── OKR Management ───────────────────────────────────────────────────
  createObjective(input: CreateObjectiveInput): Promise<StrategicObjective>;
  updateObjective(objectiveId: string, input: Partial<CreateObjectiveInput>): Promise<StrategicObjective>;
  getObjective(objectiveId: string): Promise<StrategicObjective | null>;
  listObjectives(options?: { ventureId?: string; level?: string; status?: ObjectiveStatus[]; timeframe?: string }): Promise<StrategicObjective[]>;
  deleteObjective(objectiveId: string): Promise<void>;   // Only for 'draft' status

  createKeyResult(objectiveId: string, input: CreateKeyResultInput): Promise<KeyResult>;
  updateKeyResult(keyResultId: string, input: Partial<CreateKeyResultInput>): Promise<KeyResult>;
  checkinKeyResult(keyResultId: string, input: KeyResultCheckinInput): Promise<KeyResultCheckin>;
  getKeyResults(objectiveId: string): Promise<KeyResult[]>;
  getOkrTree(options?: { ventureId?: string; timeframe?: string }): Promise<OkrTreeNode[]>;
  getOkrProgress(objectiveId: string): Promise<OkrProgressReport>;

  // ── Competitive Analysis ─────────────────────────────────────────────
  createAnalysis(ventureId: string, input: CompetitiveAnalysisInput): Promise<CompetitiveAnalysis>;
  updateAnalysis(analysisId: string, input: Partial<CompetitiveAnalysisInput>): Promise<CompetitiveAnalysis>;
  getAnalysis(analysisId: string): Promise<CompetitiveAnalysis | null>;
  listAnalyses(ventureId: string): Promise<CompetitiveAnalysis[]>;
  getLatestAnalysis(ventureId: string): Promise<CompetitiveAnalysis | null>;

  addCompetitor(analysisId: string, input: CompetitorProfileInput): Promise<CompetitorProfile>;
  updateCompetitor(competitorId: string, input: Partial<CompetitorProfileInput>): Promise<CompetitorProfile>;
  getCompetitors(analysisId: string): Promise<CompetitorProfile[]>;
  getCompetitorMatrix(ventureId: string): Promise<CompetitorMatrix>;

  // ── Market Sizing ────────────────────────────────────────────────────
  createMarketSizing(ventureId: string, input: MarketSizingInput): Promise<MarketSizing>;
  updateMarketSizing(sizingId: string, input: Partial<MarketSizingInput>): Promise<MarketSizing>;
  getMarketSizing(sizingId: string): Promise<MarketSizing | null>;
  getLatestMarketSizing(ventureId: string): Promise<MarketSizing | null>;
  compareMarketSizings(ventureIds: string[]): Promise<MarketSizingComparison>;

  // ── Venture Scorecards ───────────────────────────────────────────────
  scoreVenture(ventureId: string, input: VentureScorecardInput): Promise<VentureScorecard>;
  getScorecards(options?: { ventureId?: string; period?: string }): Promise<VentureScorecard[]>;
  getVentureRankings(period: string): Promise<VentureRanking[]>;
  getScorecardTrends(ventureId: string, periods?: number): Promise<ScorecardTrend>;

  createScoringCriteria(input: ScorecardCriteriaInput): Promise<ScorecardCriteria>;
  updateScoringCriteria(criteriaId: string, input: Partial<ScorecardCriteriaInput>): Promise<ScorecardCriteria>;
  getScoringCriteria(): Promise<ScorecardCriteria[]>;

  // ── Investment Theses ────────────────────────────────────────────────
  createThesis(ventureId: string, input: InvestmentThesisInput): Promise<InvestmentThesis>;
  updateThesis(thesisId: string, input: Partial<InvestmentThesisInput>): Promise<InvestmentThesis>;
  validateThesis(thesisId: string, evidence: string): Promise<InvestmentThesis>;
  invalidateThesis(thesisId: string, reason: string): Promise<InvestmentThesis>;
  getTheses(ventureId: string): Promise<InvestmentThesis[]>;
  getActiveTheses(): Promise<InvestmentThesis[]>;

  // ── Pivot Decisions ──────────────────────────────────────────────────
  recordPivot(ventureId: string, input: PivotDecisionInput): Promise<PivotDecision>;
  updatePivotOutcome(pivotId: string, outcome: PivotOutcome, metrics?: object): Promise<PivotDecision>;
  getPivotHistory(ventureId: string): Promise<PivotDecision[]>;
  getPivotAnalysis(): Promise<PivotAnalysisReport>;      // Success/failure rates across portfolio

  // ── Strategic Initiatives ────────────────────────────────────────────
  createInitiative(input: InitiativeInput): Promise<StrategicInitiative>;
  updateInitiative(initiativeId: string, input: Partial<InitiativeInput>): Promise<StrategicInitiative>;
  updateInitiativeProgress(initiativeId: string, percent: number, notes?: string): Promise<StrategicInitiative>;
  getInitiatives(options?: { ventureId?: string; status?: InitiativeStatus[] }): Promise<StrategicInitiative[]>;

  // ── Portfolio Dashboards ─────────────────────────────────────────────
  createDashboard(input: DashboardInput): Promise<PortfolioDashboard>;
  updateDashboard(dashboardId: string, input: Partial<DashboardInput>): Promise<PortfolioDashboard>;
  getDashboard(dashboardId: string): Promise<PortfolioDashboard & { widgets: DashboardWidget[] }>;
  getDefaultDashboard(): Promise<PortfolioDashboard & { widgets: DashboardWidget[] }>;
  listDashboards(): Promise<PortfolioDashboard[]>;

  addWidget(dashboardId: string, input: WidgetInput): Promise<DashboardWidget>;
  updateWidget(widgetId: string, input: Partial<WidgetInput>): Promise<DashboardWidget>;
  removeWidget(widgetId: string): Promise<void>;
  reorderWidgets(dashboardId: string, positions: { widgetId: string; position: object }[]): Promise<void>;
  refreshWidgetData(widgetId: string): Promise<DashboardWidget>;
}
```

### Key Behaviors

1. **OKR auto-progress**: When a key result check-in is recorded, the system automatically recalculates the parent objective's `progress` as a weighted average of all its key results. Key result progress is calculated based on `scoringMethod`: linear interpolation from `startValue` to `targetValue`, binary (0 or 100), or threshold-based.
2. **Cascading OKRs**: Consortium-level objectives can have venture-level objectives as children via `parentObjectiveId`. Updating a child objective's progress triggers a re-evaluation of the parent's confidence score.
3. **Scorecard auto-ranking**: When any venture scorecard is saved for a period, the system re-ranks all ventures for that period by `overallScore` descending and assigns tier labels: A (80-100), B (60-79), C (40-59), D (0-39).
4. **Thesis lifecycle**: Investment theses start as `active`. When sufficient evidence validates or invalidates the thesis, they transition. A validated thesis triggers an event to increase investment confidence; an invalidated thesis triggers a strategic review.
5. **Pivot tracking**: Pivot decisions capture before/after metrics to quantify impact. The system calculates portfolio-level pivot success rates to inform future decisions.
6. **Dashboard caching**: Widget data is cached in `cachedData` with a `cachedAt` timestamp. Data older than the widget's `refreshInterval` is re-fetched from the source on next load, preventing excessive database queries during dashboard browsing.
7. **Competitive analysis freshness**: Analyses older than 90 days are automatically flagged for review. A cron job sends reminders to the venture lead to update competitive intelligence.

---

## Error Codes

| Code | HTTP Status | Description | User Message |
|------|-------------|-------------|--------------|
| `PORTFOLIO_VENTURE_NOT_FOUND` | 404 | Venture ID does not exist | Venture not found |
| `PORTFOLIO_VENTURE_SLUG_TAKEN` | 409 | Slug already in use | This venture identifier is already taken |
| `PORTFOLIO_INVALID_TRANSITION` | 422 | Invalid lifecycle transition | Cannot transition from {from} to {to} |
| `PORTFOLIO_VENTURE_NOT_DELETABLE` | 422 | Can only delete concepts | Only ventures in 'concept' status can be deleted |
| `PORTFOLIO_ALLOCATION_EXCEEDED` | 422 | Team allocation >100% | Team member is over-allocated across ventures |
| `PORTFOLIO_ENTITY_NOT_FOUND` | 404 | Entity ID does not exist | Legal entity not found |
| `PORTFOLIO_CIRCULAR_HIERARCHY` | 422 | Circular entity hierarchy | This would create a circular ownership structure |
| `PORTFOLIO_OWNERSHIP_EXCEEDED` | 422 | Ownership >100% | Total ownership cannot exceed 100% |
| `PORTFOLIO_GRANT_NOT_FOUND` | 404 | Grant ID does not exist | Grant not found |
| `PORTFOLIO_INVALID_GRANT_TRANSITION` | 422 | Invalid grant lifecycle transition | Cannot transition grant from {from} to {to} |
| `PORTFOLIO_GRANT_OVER_BUDGET` | 422 | Expenditure exceeds budget line | Expenditure would exceed the budget line amount |
| `PORTFOLIO_MILESTONE_NOT_FOUND` | 404 | Milestone not found | Milestone not found |
| `PORTFOLIO_DISBURSEMENT_EXCEEDS_AWARD` | 422 | Disbursement > awarded amount | Disbursement would exceed the total award amount |
| `PORTFOLIO_OBJECTIVE_NOT_FOUND` | 404 | Objective ID does not exist | Strategic objective not found |
| `PORTFOLIO_OBJECTIVE_NOT_DELETABLE` | 422 | Can only delete drafts | Only objectives in 'draft' status can be deleted |
| `PORTFOLIO_KR_PROGRESS_INVALID` | 422 | Value outside valid range | Key result value must be between start and target values |
| `PORTFOLIO_SCORECARD_WEIGHTS_INVALID` | 422 | Scoring weights don't sum to 1.0 | Scoring criteria weights must sum to 1.0 |
| `PORTFOLIO_THESIS_ALREADY_RESOLVED` | 422 | Thesis already validated/invalidated | This thesis has already been resolved |
| `PORTFOLIO_DASHBOARD_LIMIT` | 422 | Too many dashboards | Maximum number of dashboards reached |
| `PORTFOLIO_UNAUTHORIZED` | 403 | Insufficient permissions | You do not have access to this resource |

---

## Usage Examples

### Example 1: Create a New Venture and Full Setup

```typescript
import { ventureService, entityService, grantService, strategyService } from '@mcv/portfolio';

// 1. Create the venture
const venture = await ventureService.createVenture({
  slug: 'betedge',
  name: 'BetEdge',
  legalName: 'BetEdge Technologies LLC',
  description: 'AI-powered sports analytics and predictive betting platform',
  mission: 'Democratize sports betting through AI-driven analytics',
  industry: 'Sports Betting',
  vertical: 'AI/ML',
  priority: 'high',
  timezone: 'America/Toronto',
  currency: 'USD',
});

// 2. Approve and launch
const approved = await ventureService.approveVenture(venture.id, 'ceo-user-id');
const launched = await ventureService.launchVenture(approved.id);

// 3. Create legal entity and link
const entity = await entityService.createEntity({
  ventureId: launched.id,
  name: 'BetEdge Technologies LLC',
  legalName: 'BetEdge Technologies LLC',
  entityType: 'llc',
  formationState: 'Nevada',
  formationCountry: 'US',
  fiscalYearEnd: '12-31',
  taxClassification: 'Partnership',
});

// 4. Set up KPIs
await ventureService.createKpi(launched.id, {
  name: 'Monthly Recurring Revenue',
  slug: 'mrr',
  category: 'financial',
  unit: 'USD',
  format: 'currency',
  targetValue: '100000',
  warningThreshold: '60000',
  criticalThreshold: '30000',
  frequency: 'monthly',
  direction: 'higher_is_better',
});

// 5. Create initial strategic objective
await strategyService.createObjective({
  ventureId: launched.id,
  title: 'Reach 50,000 active users by Q4 2026',
  level: 'venture',
  timeframe: '2026',
  priority: 'critical',
});
```

### Example 2: Record Health Snapshot and KPI Update

```typescript
import { ventureService } from '@mcv/portfolio';

// Record a health snapshot
const snapshot = await ventureService.recordHealthSnapshot('betedge-venture-id', {
  overallHealth: 'healthy',
  healthScore: 82,
  dimensions: {
    financial: { score: 85, revenue: 150000, burn: 45000, runway: 18, trend: 'up' },
    product: { score: 72, uptime: 99.9, bugCount: 12, featureVelocity: 8, trend: 'stable' },
    team: { score: 90, headcount: 12, satisfaction: 4.2, turnover: 0.08, trend: 'up' },
    market: { score: 65, userGrowth: 0.15, churnRate: 0.03, nps: 42, trend: 'down' },
    compliance: { score: 95, openIssues: 1, lastAudit: '2026-01-15', trend: 'stable' },
  },
  alerts: [
    { type: 'market_growth_slowing', severity: 'warning', message: 'User growth rate declined 5% MoM' },
  ],
  generatedBy: 'system',
});

// Record a KPI measurement
await ventureService.recordKpi('mrr-kpi-id', {
  period: '2026-01',
  value: '125000',
  previousValue: '110000',
  source: 'api',
  notes: 'Strong month driven by enterprise onboarding',
});

// Get health heatmap across all ventures
const heatmap = await ventureService.getHealthHeatmap();
// Returns: { ventures: [{ slug: 'betedge', health: 'healthy', score: 82 }, ...] }
```

### Example 3: Grant Lifecycle — Discovery to Disbursement

```typescript
import { grantService } from '@mcv/portfolio';

// Discover a grant opportunity
const grant = await grantService.createGrant({
  ventureId: 'betedge-venture-id',
  title: 'NSF SBIR Phase I — AI Sports Analytics Engine',
  fundingSource: 'NSF',
  fundingAgency: 'National Science Foundation',
  program: 'SBIR Phase I',
  category: 'federal',
  requestedAmount: '275000',
  applicationDeadline: new Date('2026-06-15'),
  cfda: '47.084',
});

// Qualify and apply
await grantService.qualifyGrant(grant.id, 'Meets all eligibility criteria');
await grantService.applyForGrant(grant.id);

// Create application
await grantService.createApplication(grant.id, {
  narrativeUrl: 'https://storage.mcv.one/grants/nsf-sbir-narrative.pdf',
  budgetUrl: 'https://storage.mcv.one/grants/nsf-sbir-budget.pdf',
  keyPersonnel: [
    { name: 'Dr. Jane Smith', role: 'PI', percentEffort: 50 },
    { name: 'John Doe', role: 'Co-PI', percentEffort: 25 },
  ],
});

// Record award
await grantService.recordAward(grant.id, '256000', new Date('2026-09-01'));
await grantService.activateGrant(grant.id, new Date('2026-10-01'), new Date('2027-09-30'));

// Create milestones
await grantService.createMilestone(grant.id, {
  title: 'Prototype Complete',
  milestoneNumber: 1,
  targetDate: new Date('2027-01-31'),
  fundingTrigger: true,
  triggerAmount: '85000',
  deliverables: [
    { title: 'Technical Report', type: 'document', required: true },
    { title: 'Working Prototype', type: 'demo', required: true },
  ],
});

// Record disbursement after milestone verification
await grantService.requestDisbursement(grant.id, {
  milestoneId: 'milestone-id',
  amount: '85000',
  disbursementNumber: 'DISB-2027-001',
  paymentMethod: 'ach',
});
```

### Example 4: Quarterly Strategic Review

```typescript
import { strategyService, portfolioAggregationService } from '@mcv/portfolio';

// Score all ventures
const ventures = ['betedge', 'serpspace', 'fullgain', 'mcv-studios'];
for (const slug of ventures) {
  const venture = await ventureService.getVentureBySlug(slug);
  await strategyService.scoreVenture(venture.id, {
    period: '2026-Q1',
    scores: {
      financial: { score: 85, weight: 0.25, details: { revenue: 150000, growth: 0.15, margin: 0.30 } },
      market: { score: 72, weight: 0.20, details: { tam: 5000000000, marketShare: 0.001, nps: 42 } },
      product: { score: 80, weight: 0.20, details: { uptime: 99.9, features: 45, velocity: 8 } },
      team: { score: 90, weight: 0.15, details: { headcount: 12, retention: 0.92, keyHires: 3 } },
      strategic: { score: 78, weight: 0.20, details: { okrProgress: 0.68, pivotRisk: 'low' } },
    },
  });
}

// Get rankings
const rankings = await strategyService.getVentureRankings('2026-Q1');
// Returns: [{ venture: 'betedge', score: 81.1, rank: 1, tier: 'A' }, ...]

// Build portfolio summary
const summary = await portfolioAggregationService.getPortfolioSummary();
// Returns: { totalVentures: 9, activeVentures: 7, totalRevenue: '...', healthDistribution: {...} }

// Check OKR progress
const okrTree = await strategyService.getOkrTree({ timeframe: '2026-Q1' });
```

### Example 5: Entity Compliance Management

```typescript
import { entityService } from '@mcv/portfolio';

// Get full consortium hierarchy
const hierarchy = await entityService.getFullHierarchy();
// Returns: TreeNode { entity: 'MCV Global Holdings Corp', children: [...] }

// Check compliance across all entities
const complianceMatrix = await entityService.getComplianceMatrix();
// Returns: { entities: [{ name: '...', jurisdictions: [{ state: 'DE', status: 'compliant' }] }] }

// Get upcoming deadlines
const deadlines = await entityService.getUpcomingDeadlines(30);
// Returns: [{ entity: 'BetEdge LLC', requirement: 'Annual Report', dueDate: '...', jurisdiction: 'Nevada' }]

// Record a compliance filing
await entityService.recordComplianceCheck('betedge-entity-id', {
  jurisdiction: 'Nevada',
  requirementType: 'annual_report',
  requirementName: 'Nevada Annual Report',
  status: 'compliant',
  completedDate: new Date(),
  confirmationNumber: 'NV-2026-123456',
  cost: '150.00',
  nextDueDate: new Date('2027-01-31'),
});
```

---

## Cron Jobs

| Job | Schedule | Description |
|-----|----------|-------------|
| `portfolio.health_snapshot` | Every 6 hours | Collects automated health snapshots for all active ventures by querying `@mcv/finance` (revenue/burn), deployment health checks, and team allocation data |
| `portfolio.kpi_refresh` | Daily 06:00 UTC | Pulls latest KPI data from integrated sources (Stripe for MRR, analytics platforms for user metrics) and records KPI entries |
| `portfolio.compliance_check` | Weekly (Monday 09:00 UTC) | Checks good standing status for all active entities, flags overdue annual reports, sends compliance alerts |
| `portfolio.grant_deadlines` | Daily 08:00 UTC | Scans all grant deadlines against `reminderDays` arrays, sends notifications via `@mcv/notifications` for approaching deadlines |
| `portfolio.grant_overdue_check` | Daily 10:00 UTC | Identifies overdue milestones, compliance reports, and disbursement requests; escalates to venture leads |
| `portfolio.quarterly_review` | Quarterly (1st of Jan/Apr/Jul/Oct) | Triggers automated venture scoring, generates portfolio summary report, creates OKR check-in reminders |
| `portfolio.competitive_freshness` | Weekly (Friday 14:00 UTC) | Flags competitive analyses older than 90 days for review, sends reminders to venture leads |
| `portfolio.dashboard_cache_refresh` | Every 5 minutes | Refreshes cached widget data for all active dashboards where `cachedAt + refreshInterval < now()` |

---

## Testing

```typescript
// Test file: __tests__/portfolio.test.ts

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { ventureService, entityService, grantService, strategyService } from '@mcv/portfolio';
import { createTestContext, cleanupTestData } from '@mcv/testing';

describe('Portfolio Module', () => {
  let ctx: TestContext;

  beforeEach(async () => {
    ctx = await createTestContext({ module: 'portfolio', seed: true });
  });

  afterEach(async () => {
    await cleanupTestData(ctx);
  });

  describe('Venture Lifecycle', () => {
    it('should enforce valid status transitions', async () => {
      const venture = await ventureService.createVenture({
        slug: 'test-venture',
        name: 'Test Venture',
        industry: 'Testing',
      });

      expect(venture.status).toBe('concept');

      // Valid transition: concept → setup
      const approved = await ventureService.approveVenture(venture.id, ctx.userId);
      expect(approved.status).toBe('setup');

      // Invalid transition: setup → scaling (should throw)
      await expect(
        ventureService.scaleVenture(approved.id)
      ).rejects.toThrow('PORTFOLIO_INVALID_TRANSITION');
    });

    it('should create tenant on approve', async () => {
      const venture = await ventureService.createVenture({
        slug: 'tenant-test',
        name: 'Tenant Test',
        industry: 'Testing',
      });

      const approved = await ventureService.approveVenture(venture.id, ctx.userId);
      expect(approved.tenantId).toBeDefined();
    });

    it('should enforce team allocation limits', async () => {
      const v1 = await ventureService.createVenture({ slug: 'v1', name: 'V1', industry: 'Test' });
      const v2 = await ventureService.createVenture({ slug: 'v2', name: 'V2', industry: 'Test' });

      await ventureService.assignTeamMember({
        ventureId: v1.id,
        userId: ctx.userId,
        role: 'developer',
        allocation: 80,
        startDate: new Date(),
      });

      await expect(
        ventureService.assignTeamMember({
          ventureId: v2.id,
          userId: ctx.userId,
          role: 'developer',
          allocation: 30, // 80 + 30 = 110 > 100
          startDate: new Date(),
        })
      ).rejects.toThrow('PORTFOLIO_ALLOCATION_EXCEEDED');
    });
  });

  describe('Entity Hierarchy', () => {
    it('should prevent circular hierarchies', async () => {
      const parent = await entityService.createEntity({
        name: 'Parent Corp',
        legalName: 'Parent Corp',
        entityType: 'c_corp',
      });

      const child = await entityService.createEntity({
        name: 'Child LLC',
        legalName: 'Child LLC',
        entityType: 'llc',
      });

      await entityService.addChildEntity(parent.id, child.id, {
        relationshipType: 'subsidiary',
        ownershipPercent: '100',
        effectiveDate: new Date(),
      });

      await expect(
        entityService.addChildEntity(child.id, parent.id, {
          relationshipType: 'subsidiary',
          ownershipPercent: '100',
          effectiveDate: new Date(),
        })
      ).rejects.toThrow('PORTFOLIO_CIRCULAR_HIERARCHY');
    });
  });

  describe('Grant Lifecycle', () => {
    it('should enforce valid grant transitions', async () => {
      const grant = await grantService.createGrant({
        title: 'Test Grant',
        fundingSource: 'Test Foundation',
        category: 'private',
      });

      expect(grant.status).toBe('discovered');

      // Cannot skip to applied without qualifying first
      await expect(
        grantService.applyForGrant(grant.id)
      ).rejects.toThrow('PORTFOLIO_INVALID_GRANT_TRANSITION');
    });

    it('should auto-create disbursement on milestone verification', async () => {
      // ... setup grant in active status with milestone ...
      const milestone = await grantService.createMilestone(grantId, {
        title: 'Phase 1',
        milestoneNumber: 1,
        targetDate: new Date('2027-01-31'),
        fundingTrigger: true,
        triggerAmount: '50000',
      });

      await grantService.updateMilestoneStatus(milestone.id, 'completed', [
        { type: 'report', url: 'https://...' },
      ]);

      await grantService.verifyMilestone(milestone.id, ctx.userId);

      const disbursements = await grantService.getDisbursements(grantId);
      expect(disbursements).toHaveLength(1);
      expect(disbursements[0].amount).toBe('50000');
    });
  });

  describe('Strategy — OKR Progress', () => {
    it('should auto-calculate objective progress from key results', async () => {
      const objective = await strategyService.createObjective({
        title: 'Test Objective',
        level: 'venture',
        timeframe: '2026-Q1',
      });

      const kr1 = await strategyService.createKeyResult(objective.id, {
        title: 'KR 1',
        type: 'numeric',
        startValue: '0',
        targetValue: '100',
        weight: '0.6',
      });

      const kr2 = await strategyService.createKeyResult(objective.id, {
        title: 'KR 2',
        type: 'numeric',
        startValue: '0',
        targetValue: '50',
        weight: '0.4',
      });

      await strategyService.checkinKeyResult(kr1.id, { newValue: '50', status: 'on_track' });
      await strategyService.checkinKeyResult(kr2.id, { newValue: '25', status: 'on_track' });

      const updated = await strategyService.getObjective(objective.id);
      // Progress = (50/100 * 0.6) + (25/50 * 0.4) = 0.30 + 0.20 = 50%
      expect(Number(updated!.progress)).toBeCloseTo(50, 0);
    });
  });
});
```

---

## Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| `@mcv/kernel` | workspace | Database connection, schema utilities, shared config |
| `@mcv/identity` | workspace | Tenant management, RBAC, user references |
| `@mcv/fabric` | workspace | Audit logging, event bus, notification dispatch |
| `@mcv/finance` | workspace | Per-venture P&L, budget data, expense tracking |
| `@mcv/treasury` | workspace | Funding flows, wallet management, EDGE token ops |
| `@mcv/documents` | workspace | PDF generation, file storage for corporate docs |
| `@mcv/notifications` | workspace | Email, SMS, push notifications for deadlines and alerts |
| `drizzle-orm` | `^0.38.x` | ORM for PostgreSQL schema and queries |
| `zod` | `^3.x` | Input validation for all service methods |
| `date-fns` | `^3.x` | Date manipulation for deadlines, periods, schedules |

---

## Security Considerations

- **RLS enforcement**: All portfolio tables use Supabase Row-Level Security. Super Admins see all records. Venture Admins see only records for their assigned ventures. Read-only users see only ventures they are team members of.
- **EIN encryption**: Federal EIN fields in `legalEntities` are encrypted at rest using AES-256-GCM via `@mcv/kernel/config/secrets`. Decryption requires `super_admin` or `entity_admin` role.
- **Compensation confidentiality**: Officer compensation details in `entityOfficers.compensationDetails` are encrypted and accessible only to `super_admin` users.
- **Document access levels**: Corporate documents in the vault have configurable `accessLevel` fields. The API enforces access checks before returning document URLs or allowing downloads.
- **Financial data isolation**: Grant budget amounts, disbursement data, and venture financial KPIs are segregated by venture tenant. Cross-venture aggregation is only available to `super_admin` and `portfolio_admin` roles.
- **Audit trail**: All state changes (lifecycle transitions, ownership changes, compliance filings, grant status updates) are logged to `@mcv/fabric` audit system with full before/after snapshots.
- **Input validation**: All service methods validate inputs with Zod schemas before database operations. Numeric fields (amounts, percentages) are validated for range and precision.

---

*@mcv/portfolio — Portfolio Domain Module*