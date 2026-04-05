# @mcv/people/org

> Organization Structure — Departments, positions, org charts, headcount planning, restructuring, and job architecture for the MCV.ONE platform.

**Module:** `@mcv/people/org`  
**Domain:** `people`  
**Tier:** 5 (Domain Module)  
**Status:** Stable  
**Since:** 0.9.0  
**Updated:** 2026-02-09

---

## Table of Contents

1. [Purpose](#purpose)
2. [Exports](#exports)
3. [Architecture](#architecture)
4. [Core Interfaces](#core-interfaces)
5. [Database Schemas](#database-schemas)
6. [Code Examples](#code-examples)
7. [Error Codes](#error-codes)
8. [Security](#security)
9. [Environment Variables](#environment-variables)
10. [Dependencies](#dependencies)
11. [Testing](#testing)

---

## Purpose

`@mcv/people/org` is the foundational organizational structure module within the MCV.ONE People domain. It models the complete organizational hierarchy—departments, divisions, business units, cost centers—and maps people into positions within that hierarchy. This module answers the fundamental question: *"How is this organization structured, and where does everyone fit?"*

### What This Module Does

- **Defines Organizational Units** — Create and manage departments, divisions, business units, cost centers, teams, and any custom unit type. Units nest to unlimited depth via PostgreSQL `ltree` paths, enabling efficient subtree queries across even the deepest hierarchies.

- **Manages Positions & Roles** — Define job positions within org units, assign grade/band levels, attach compensation ranges, and map employees to positions. Positions are the structural "slots" in the org; people fill them. A single position can be shared (job-sharing) or held by one person. Vacant positions drive headcount planning and recruiting workflows.

- **Renders Org Charts** — Generate interactive, traversable org charts from live data. Support primary and dotted-line (secondary) reporting relationships, matrix organization overlays, and multiple chart views (hierarchical, functional, geographic). Charts can be exported as SVG, PNG, or PDF.

- **Plans Headcount** — Create headcount plans that define target staffing levels per org unit, per period. Compare budgeted vs. actual headcount. Model scenarios ("what if we add 10 engineers to Platform?") and simulate cost impacts. Track open positions, planned hires, and pipeline alignment.

- **Orchestrates Restructuring** — Propose org changes (merges, splits, transfers, eliminations) through structured workflows. Every proposal includes impact analysis (affected employees, cost changes, reporting line shifts). Proposals route through configurable approval chains and apply on effective dates with full historical tracking.

- **Defines Job Architecture** — Build job families, career tracks, and competency models. Define progression criteria from junior to senior levels. Link competency requirements to positions. Enable career pathing—employees can see exactly what skills and experience they need to advance.

- **Supports Multi-Venture Structures** — Each venture in MCV.ONE has its own org structure, but shared services (HR, Finance, IT) can span ventures. Cross-venture roles and consolidated views let holding-company operators see the complete picture.

- **Analyzes Organizational Health** — Compute and track metrics: span of control per manager, org depth (layers from CEO to leaf), vacancy rates, diversity distribution by org level, headcount trends over time, and cost per org unit.

- **Integrates with Everything** — Sync with external HRIS systems, align with payroll structures, provision identity and access based on org position. When someone changes position, their access rights, benefits eligibility, and payroll configuration update automatically.

### Why It Matters

Organization structure is not just an HR concern—it is the backbone of access control, cost allocation, reporting hierarchies, and operational workflows across the entire platform. Every module that asks "who manages this person?" or "which department owns this budget?" depends on `@mcv/people/org`.

---

## Exports

```typescript
// === Core Services ===
export { OrgService } from './services/org.service';
export { PositionService } from './services/position.service';
export { OrgChartService } from './services/org-chart.service';
export { HeadcountService } from './services/headcount.service';
export { RestructuringService } from './services/restructuring.service';
export { JobArchitectureService } from './services/job-architecture.service';
export { OrgAnalyticsService } from './services/org-analytics.service';
export { OrgSyncService } from './services/org-sync.service';

// === tRPC Routers ===
export { orgRouter } from './routers/org.router';
export { positionRouter } from './routers/position.router';
export { orgChartRouter } from './routers/org-chart.router';
export { headcountRouter } from './routers/headcount.router';
export { restructuringRouter } from './routers/restructuring.router';
export { jobArchitectureRouter } from './routers/job-architecture.router';
export { orgAnalyticsRouter } from './routers/org-analytics.router';

// === Core Types ===
export type {
  OrgUnit,
  OrgUnitType,
  OrgUnitStatus,
  OrgUnitCreateInput,
  OrgUnitUpdateInput,
  OrgUnitTree,
  OrgUnitPath,
  OrgUnitMoveInput,
} from './types/org-unit.types';

export type {
  Position,
  PositionStatus,
  PositionType,
  PositionCreateInput,
  PositionUpdateInput,
  PositionAssignment,
  PositionAssignmentCreateInput,
  PositionVacancy,
} from './types/position.types';

export type {
  OrgChart,
  OrgChartNode,
  OrgChartEdge,
  OrgChartLayout,
  OrgChartExportFormat,
  OrgChartFilter,
  ReportingLine,
  ReportingLineType,
} from './types/org-chart.types';

export type {
  HeadcountPlan,
  HeadcountPlanStatus,
  HeadcountPlanEntry,
  HeadcountScenario,
  HeadcountVariance,
  HeadcountForecast,
} from './types/headcount.types';

export type {
  RestructuringProposal,
  RestructuringProposalStatus,
  RestructuringAction,
  RestructuringActionType,
  RestructuringImpact,
  RestructuringApproval,
  RestructuringTimeline,
} from './types/restructuring.types';

export type {
  JobFamily,
  JobFamilyGroup,
  CareerTrack,
  CareerLevel,
  CompetencyModel,
  Competency,
  CompetencyRating,
  ProgressionCriteria,
  GradeBand,
  CompensationRange,
} from './types/job-architecture.types';

export type {
  OrgAnalytics,
  SpanOfControlMetric,
  OrgDepthMetric,
  HeadcountTrend,
  VacancyRate,
  DiversityByLevel,
  OrgHealthScore,
  CostPerUnit,
} from './types/org-analytics.types';

// === Schemas (Drizzle) ===
export {
  orgUnits,
  positions,
  positionAssignments,
  orgRelationships,
  headcountPlans,
  headcountPlanEntries,
  restructuringProposals,
  restructuringActions,
  jobFamilies,
  jobFamilyGroups,
  careerTracks,
  careerLevels,
  gradeBands,
  competencyModels,
  competencies,
  orgChangeHistory,
} from './schemas';

// === Hooks (React) ===
export { useOrgUnit, useOrgUnits, useOrgUnitTree } from './hooks/use-org-unit';
export { usePosition, usePositions, usePositionVacancies } from './hooks/use-position';
export { useOrgChart } from './hooks/use-org-chart';
export { useHeadcountPlan, useHeadcountVariance } from './hooks/use-headcount';
export { useRestructuringProposal } from './hooks/use-restructuring';
export { useJobFamily, useCareerTrack } from './hooks/use-job-architecture';
export { useOrgAnalytics, useSpanOfControl } from './hooks/use-org-analytics';

// === Components (React) ===
export { OrgChartViewer } from './components/OrgChartViewer';
export { OrgUnitPicker } from './components/OrgUnitPicker';
export { PositionCard } from './components/PositionCard';
export { HeadcountDashboard } from './components/HeadcountDashboard';
export { RestructuringWizard } from './components/RestructuringWizard';
export { CareerPathViewer } from './components/CareerPathViewer';
export { OrgAnalyticsDashboard } from './components/OrgAnalyticsDashboard';

// === Constants ===
export {
  ORG_UNIT_TYPES,
  POSITION_STATUSES,
  RESTRUCTURING_ACTION_TYPES,
  DEFAULT_GRADE_BANDS,
  MAX_ORG_DEPTH,
  MAX_SPAN_OF_CONTROL_WARNING,
} from './constants';

// === Utilities ===
export { buildOrgTree } from './utils/tree-builder';
export { computeOrgPath } from './utils/path-utils';
export { validateOrgMove } from './utils/move-validator';
export { calculateSpanOfControl } from './utils/span-calculator';
export { flattenOrgTree } from './utils/tree-flatten';
export { diffOrgStructures } from './utils/org-diff';
```

---

## Architecture

### High-Level Overview

```
┌──────────────────────────────────────────────────────────────┐
│                      Client Layer                            │
│  OrgChartViewer · HeadcountDashboard · RestructuringWizard   │
│  OrgUnitPicker  · CareerPathViewer   · OrgAnalyticsDashboard │
└──────────────────────────┬───────────────────────────────────┘
                           │ React Hooks (tRPC)
┌──────────────────────────┼───────────────────────────────────┐
│                      tRPC Routers                            │
│  orgRouter · positionRouter · orgChartRouter                 │
│  headcountRouter · restructuringRouter · jobArchRouter       │
└──────────────────────────┬───────────────────────────────────┘
                           │
┌──────────────────────────┼───────────────────────────────────┐
│                    Service Layer                              │
│  OrgService · PositionService · OrgChartService              │
│  HeadcountService · RestructuringService                     │
│  JobArchitectureService · OrgAnalyticsService · OrgSyncSvc   │
└──────────────────────────┬───────────────────────────────────┘
                           │
┌──────────────────────────┼───────────────────────────────────┐
│                 Data Access Layer                             │
│  Drizzle ORM · ltree Queries · Change History Tracking       │
└──────────────────────────┬───────────────────────────────────┘
                           │
┌──────────────────────────┼───────────────────────────────────┐
│              Supabase PostgreSQL + RLS                        │
│  org_units · positions · position_assignments                │
│  org_relationships · headcount_plans · headcount_plan_entries│
│  restructuring_proposals · restructuring_actions             │
│  job_families · career_tracks · career_levels · grade_bands  │
│  competency_models · competencies · org_change_history       │
└──────────────────────────────────────────────────────────────┘
```

### Hierarchical Data Model (ltree)

The org unit hierarchy uses PostgreSQL's `ltree` extension for efficient hierarchical queries. Each org unit stores a materialized path:

```
                        Company (root)
                     path: "company"
                      /           \
              Engineering          Sales
        path: "company.eng"   path: "company.sales"
            /        \                    \
       Platform    Product           North America
  "company.eng.    "company.eng.   "company.sales.
   platform"        product"        na"
      /     \
  Backend   Frontend
"company.   "company.
 eng.        eng.
 platform.   platform.
 backend"    frontend"
```

**Why ltree?**

- `@>` ancestor queries: "Get all units under Engineering" in O(1) with a GiST index
- `<@` descendant queries: "What is the path to root?" in O(1)
- `nlevel()`: Compute depth instantly
- `subpath()`: Extract path segments efficiently
- GiST index support for fast hierarchical queries
- No recursive CTEs needed for most operations

### Event-Driven Architecture

Org structure changes emit domain events that other modules consume:

```typescript
type OrgEvents = {
  'org.unit.created':        { unitId: string; parentId: string | null; ventureId: string };
  'org.unit.updated':        { unitId: string; changes: Partial<OrgUnit>; ventureId: string };
  'org.unit.moved':          { unitId: string; fromParentId: string; toParentId: string };
  'org.unit.archived':       { unitId: string; reason: string; effectiveDate: string };
  'org.unit.merged':         { sourceId: string; targetId: string; effectiveDate: string };
  'org.position.created':    { positionId: string; unitId: string; ventureId: string };
  'org.position.filled':     { positionId: string; employeeId: string; effectiveDate: string };
  'org.position.vacated':    { positionId: string; employeeId: string; reason: string };
  'org.position.eliminated': { positionId: string; reason: string; effectiveDate: string };
  'org.reporting.changed':   { employeeId: string; oldManagerId: string; newManagerId: string };
  'org.restructuring.proposed': { proposalId: string; proposedBy: string };
  'org.restructuring.approved': { proposalId: string; approvedBy: string };
  'org.restructuring.applied':  { proposalId: string; effectiveDate: string };
  'org.headcount.plan.created': { planId: string; fiscalYear: string };
  'org.headcount.variance':     { unitId: string; budgeted: number; actual: number };
};
```

### Multi-Tenant Isolation

Every table includes a `venture_id` column enforced by Row-Level Security (RLS). Users can only see and modify org structures within their authorized ventures. Cross-venture views are explicitly granted to holding-company administrators.

### Effective Dating

All significant org changes support effective dating. Changes can be scheduled for a future date and automatically apply when that date arrives (via a cron-triggered worker). Historical states are preserved in `org_change_history` for auditing and time-travel queries.

---

## Core Interfaces

### OrgUnit

```typescript
interface OrgUnit {
  id: string;
  ventureId: string;
  parentId: string | null;
  path: string;                          // ltree materialized path
  name: string;
  slug: string;
  description: string | null;
  type: OrgUnitType;
  status: OrgUnitStatus;
  costCenterCode: string | null;
  externalId: string | null;
  headId: string | null;                 // Employee who leads this unit
  depth: number;
  sortOrder: number;
  metadata: Record<string, unknown>;
  effectiveDate: string;
  expiryDate: string | null;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  updatedBy: string;
}

type OrgUnitType =
  | 'company'
  | 'division'
  | 'department'
  | 'team'
  | 'group'
  | 'business_unit'
  | 'cost_center'
  | 'project'
  | 'committee'
  | 'shared_service'
  | 'custom';

type OrgUnitStatus =
  | 'draft'
  | 'active'
  | 'restructuring'
  | 'frozen'
  | 'archived';

interface OrgUnitCreateInput {
  ventureId: string;
  parentId: string | null;
  name: string;
  slug?: string;
  description?: string;
  type: OrgUnitType;
  costCenterCode?: string;
  externalId?: string;
  headId?: string;
  sortOrder?: number;
  metadata?: Record<string, unknown>;
  effectiveDate?: string;
}

interface OrgUnitUpdateInput {
  name?: string;
  slug?: string;
  description?: string | null;
  type?: OrgUnitType;
  status?: OrgUnitStatus;
  costCenterCode?: string | null;
  externalId?: string | null;
  headId?: string | null;
  sortOrder?: number;
  metadata?: Record<string, unknown>;
  effectiveDate?: string;
}

interface OrgUnitTree extends OrgUnit {
  children: OrgUnitTree[];
  positionCount: number;
  filledPositionCount: number;
  totalHeadcount: number;
  directHeadcount: number;
}

interface OrgUnitMoveInput {
  unitId: string;
  newParentId: string | null;
  sortOrder?: number;
  effectiveDate?: string;
  reason: string;
}
```

### Position

```typescript
interface Position {
  id: string;
  ventureId: string;
  orgUnitId: string;
  title: string;
  positionCode: string;
  description: string | null;
  positionType: PositionType;
  status: PositionStatus;
  jobFamilyId: string | null;
  careerLevelId: string | null;
  gradeBandId: string | null;
  reportsToPositionId: string | null;
  headcount: number;
  isManager: boolean;
  isCritical: boolean;
  requiredCompetencies: PositionCompetency[];
  locationId: string | null;
  workArrangement: 'onsite' | 'remote' | 'hybrid' | 'flexible';
  fte: number;
  externalId: string | null;
  metadata: Record<string, unknown>;
  effectiveDate: string;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  updatedBy: string;
}

type PositionType =
  | 'permanent'
  | 'contract'
  | 'temporary'
  | 'intern'
  | 'consultant'
  | 'volunteer';

type PositionStatus =
  | 'draft'
  | 'approved'
  | 'open'
  | 'filled'
  | 'on_hold'
  | 'eliminated'
  | 'frozen';

interface PositionAssignment {
  id: string;
  positionId: string;
  employeeId: string;
  ventureId: string;
  assignmentType: 'primary' | 'secondary' | 'acting' | 'interim';
  startDate: string;
  endDate: string | null;
  fte: number;
  status: 'active' | 'pending' | 'ended';
  reason: string | null;
  createdAt: string;
  updatedAt: string;
}

interface PositionVacancy {
  positionId: string;
  position: Position;
  orgUnit: OrgUnit;
  vacantSince: string;
  daysVacant: number;
  approvedHeadcount: number;
  currentHeadcount: number;
  openSlots: number;
  recruitingStatus: 'not_started' | 'sourcing' | 'interviewing' | 'offer_pending' | 'filled';
}

interface PositionCompetency {
  competencyId: string;
  requiredLevel: 1 | 2 | 3 | 4 | 5;
  isRequired: boolean;
  weight: number;
}
```

### OrgChart

```typescript
interface OrgChart {
  ventureId: string;
  roots: OrgChartNode[];
  edges: OrgChartEdge[];
  generatedAt: string;
  totalNodes: number;
  maxDepth: number;
  layout: OrgChartLayout;
}

interface OrgChartNode {
  id: string;
  type: 'org_unit' | 'position' | 'person';
  label: string;
  subtitle: string | null;
  avatarUrl: string | null;
  orgUnitId: string;
  positionId: string | null;
  employeeId: string | null;
  directReports: number;
  totalReports: number;
  depth: number;
  isExpanded: boolean;
  isManager: boolean;
  isVacant: boolean;
  data: Record<string, unknown>;
  children: OrgChartNode[];
}

interface OrgChartEdge {
  sourceId: string;
  targetId: string;
  type: ReportingLineType;
  label: string | null;
}

type ReportingLineType =
  | 'direct'
  | 'dotted'
  | 'matrix'
  | 'project'
  | 'mentoring';

interface OrgChartLayout {
  direction: 'top-down' | 'left-right' | 'bottom-up';
  nodeSpacing: number;
  levelSpacing: number;
  compactMode: boolean;
  showVacancies: boolean;
  showHeadcount: boolean;
  maxDepth: number | null;
  collapseThreshold: number;
}

interface OrgChartFilter {
  rootUnitId?: string;
  maxDepth?: number;
  unitTypes?: OrgUnitType[];
  includeVacancies?: boolean;
  includeInactive?: boolean;
  searchQuery?: string;
  asOfDate?: string;
}
```

### HeadcountPlan

```typescript
interface HeadcountPlan {
  id: string;
  ventureId: string;
  name: string;
  description: string | null;
  fiscalYear: string;
  status: HeadcountPlanStatus;
  startDate: string;
  endDate: string;
  totalBudgetedHeadcount: number;
  totalActualHeadcount: number;
  totalBudgetedCost: number;
  totalActualCost: number;
  currency: string;
  entries: HeadcountPlanEntry[];
  scenarios: HeadcountScenario[];
  approvedBy: string | null;
  approvedAt: string | null;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  updatedBy: string;
}

type HeadcountPlanStatus =
  | 'draft'
  | 'in_review'
  | 'approved'
  | 'active'
  | 'closed'
  | 'superseded';

interface HeadcountPlanEntry {
  id: string;
  planId: string;
  orgUnitId: string;
  periodStart: string;
  periodEnd: string;
  budgetedHeadcount: number;
  budgetedFte: number;
  budgetedCost: number;
  actualHeadcount: number;
  actualFte: number;
  actualCost: number;
  openPositions: number;
  plannedHires: number;
  plannedDepartures: number;
  headcountVariance: number;
  costVariance: number;
  notes: string | null;
}

interface HeadcountScenario {
  id: string;
  planId: string;
  name: string;
  description: string | null;
  type: 'baseline' | 'growth' | 'reduction' | 'restructuring' | 'custom';
  probability: number;
  adjustments: HeadcountAdjustment[];
  totalHeadcount: number;
  totalCost: number;
  costDelta: number;
  headcountDelta: number;
  createdAt: string;
  createdBy: string;
}

interface HeadcountAdjustment {
  orgUnitId: string;
  adjustmentType: 'add' | 'remove' | 'transfer';
  headcountChange: number;
  fteChange: number;
  costImpact: number;
  rationale: string;
  effectiveDate: string;
  targetOrgUnitId?: string;
}

interface HeadcountVariance {
  orgUnitId: string;
  orgUnitName: string;
  period: string;
  budgetedHeadcount: number;
  actualHeadcount: number;
  variance: number;
  variancePercent: number;
  budgetedCost: number;
  actualCost: number;
  costVariance: number;
  status: 'on_track' | 'over' | 'under' | 'critical';
}

interface HeadcountForecast {
  orgUnitId: string;
  periods: {
    date: string;
    projected: number;
    lower: number;
    upper: number;
    hires: number;
    departures: number;
    transfers: number;
  }[];
  confidenceLevel: number;
  methodology: string;
}
```

### RestructuringProposal

```typescript
interface RestructuringProposal {
  id: string;
  ventureId: string;
  title: string;
  description: string;
  rationale: string;
  status: RestructuringProposalStatus;
  proposedEffectiveDate: string;
  actualEffectiveDate: string | null;
  actions: RestructuringAction[];
  impact: RestructuringImpact;
  approvals: RestructuringApproval[];
  timeline: RestructuringTimeline;
  attachmentIds: string[];
  version: number;
  previousVersionId: string | null;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  updatedBy: string;
}

type RestructuringProposalStatus =
  | 'draft'
  | 'submitted'
  | 'in_review'
  | 'revision_requested'
  | 'approved'
  | 'scheduled'
  | 'in_progress'
  | 'completed'
  | 'rolled_back'
  | 'rejected'
  | 'cancelled';

interface RestructuringAction {
  id: string;
  proposalId: string;
  actionType: RestructuringActionType;
  sequenceOrder: number;
  subjectType: 'org_unit' | 'position' | 'employee';
  subjectId: string;
  parameters: Record<string, unknown>;
  status: 'pending' | 'in_progress' | 'completed' | 'failed' | 'rolled_back';
  errorMessage: string | null;
  executedAt: string | null;
  executedBy: string | null;
}

type RestructuringActionType =
  | 'create_unit'
  | 'archive_unit'
  | 'merge_units'
  | 'split_unit'
  | 'move_unit'
  | 'rename_unit'
  | 'retype_unit'
  | 'create_position'
  | 'eliminate_position'
  | 'transfer_position'
  | 'regrade_position'
  | 'transfer_employee'
  | 'change_reporting'
  | 'update_head'
  | 'custom';

interface RestructuringImpact {
  affectedEmployeeCount: number;
  employeesTransferred: number;
  employeesReportingChanged: number;
  positionsEliminated: number;
  positionsCreated: number;
  netHeadcountChange: number;
  unitsCreated: number;
  unitsArchived: number;
  unitsMerged: number;
  unitsSplit: number;
  unitsMoved: number;
  estimatedCostSavings: number;
  estimatedImplementationCost: number;
  netAnnualImpact: number;
  currency: string;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  riskFactors: string[];
  employeeImpacts: {
    employeeId: string;
    employeeName: string;
    currentPositionId: string;
    currentUnitId: string;
    newPositionId: string | null;
    newUnitId: string | null;
    impactType: string;
    details: string;
  }[];
}

interface RestructuringApproval {
  id: string;
  proposalId: string;
  approverId: string;
  approverName: string;
  role: string;
  sequenceOrder: number;
  status: 'pending' | 'approved' | 'rejected' | 'skipped';
  decision: string | null;
  comments: string | null;
  decidedAt: string | null;
}

interface RestructuringTimeline {
  proposedDate: string;
  reviewDeadline: string;
  approvalDeadline: string;
  communicationDate: string;
  effectiveDate: string;
  completionDeadline: string;
  milestones: {
    name: string;
    date: string;
    status: 'pending' | 'completed' | 'overdue';
    assigneeId: string | null;
  }[];
}
```

### JobFamily & CareerTrack

```typescript
interface JobFamily {
  id: string;
  ventureId: string;
  groupId: string | null;
  name: string;
  slug: string;
  description: string | null;
  careerTracks: CareerTrack[];
  positionCount: number;
  isShared: boolean;
  status: 'active' | 'deprecated' | 'draft';
  createdAt: string;
  updatedAt: string;
}

interface JobFamilyGroup {
  id: string;
  ventureId: string;
  name: string;
  slug: string;
  description: string | null;
  families: JobFamily[];
  status: 'active' | 'deprecated' | 'draft';
  createdAt: string;
  updatedAt: string;
}

interface CareerTrack {
  id: string;
  jobFamilyId: string;
  ventureId: string;
  name: string;
  slug: string;
  description: string | null;
  trackType: 'individual_contributor' | 'management' | 'specialist' | 'hybrid';
  levels: CareerLevel[];
  transitions: {
    fromLevelId: string;
    toTrackId: string;
    toLevelId: string;
    description: string;
  }[];
  status: 'active' | 'deprecated' | 'draft';
  createdAt: string;
  updatedAt: string;
}

interface CareerLevel {
  id: string;
  careerTrackId: string;
  ventureId: string;
  name: string;
  code: string;
  sequence: number;
  gradeBandId: string | null;
  criteria: ProgressionCriteria;
  competencies: { competencyId: string; requiredLevel: 1 | 2 | 3 | 4 | 5 }[];
  typicalTenureMonths: number | null;
  minimumTenureMonths: number | null;
  isTerminal: boolean;
  createdAt: string;
  updatedAt: string;
}

interface ProgressionCriteria {
  minExperienceYears: number | null;
  requiredCertifications: string[];
  minEducationLevel: string | null;
  minPerformanceRating: number | null;
  consecutiveHighPerformanceReviews: number | null;
  scopeDescription: string;
  impactDescription: string;
  leadershipDescription: string | null;
  customCriteria: {
    name: string;
    description: string;
    isMandatory: boolean;
  }[];
}

interface GradeBand {
  id: string;
  ventureId: string;
  name: string;
  code: string;
  sequence: number;
  compensationRanges: CompensationRange[];
  careerLevelIds: string[];
  status: 'active' | 'deprecated';
  effectiveDate: string;
  createdAt: string;
  updatedAt: string;
}

interface CompensationRange {
  currency: string;
  annualSalaryMin: number;
  annualSalaryMid: number;
  annualSalaryMax: number;
  totalCompMin: number;
  totalCompMid: number;
  totalCompMax: number;
  region: string | null;
}

interface CompetencyModel {
  id: string;
  ventureId: string;
  name: string;
  description: string | null;
  scope: 'organization' | 'job_family';
  jobFamilyId: string | null;
  competencies: Competency[];
  status: 'active' | 'deprecated' | 'draft';
  createdAt: string;
  updatedAt: string;
}

interface Competency {
  id: string;
  modelId: string;
  name: string;
  category: string;
  description: string;
  levels: {
    level: 1 | 2 | 3 | 4 | 5;
    name: string;
    description: string;
    behaviors: string[];
  }[];
  isCore: boolean;
  sortOrder: number;
}
```

### OrgAnalytics

```typescript
interface OrgAnalytics {
  ventureId: string;
  generatedAt: string;
  period: { start: string; end: string };
  totalHeadcount: number;
  totalFte: number;
  totalOrgUnits: number;
  totalPositions: number;
  filledPositions: number;
  vacantPositions: number;
  vacancyRate: number;
  spanOfControl: SpanOfControlMetric;
  orgDepth: OrgDepthMetric;
  headcountTrends: HeadcountTrend[];
  vacancyAnalysis: VacancyRate[];
  diversityByLevel: DiversityByLevel[];
  healthScore: OrgHealthScore;
  costPerUnit: CostPerUnit[];
}

interface SpanOfControlMetric {
  average: number;
  median: number;
  min: number;
  max: number;
  standardDeviation: number;
  distribution: { range: string; count: number; percentage: number }[];
  overSpanManagers: {
    managerId: string;
    managerName: string;
    orgUnitId: string;
    directReports: number;
  }[];
  underSpanManagers: {
    managerId: string;
    managerName: string;
    orgUnitId: string;
    directReports: number;
  }[];
  recommendedMin: number;
  recommendedMax: number;
}

interface OrgDepthMetric {
  maxDepth: number;
  averageDepth: number;
  depthDistribution: {
    depth: number;
    employeeCount: number;
    percentage: number;
    orgUnits: string[];
  }[];
  deepestPaths: { path: string; depth: number; leafUnit: string }[];
  benchmarkDepth: number | null;
}

interface HeadcountTrend {
  date: string;
  totalHeadcount: number;
  totalFte: number;
  hires: number;
  departures: number;
  transfers: number;
  netChange: number;
  byUnit?: { orgUnitId: string; orgUnitName: string; headcount: number; change: number }[];
}

interface VacancyRate {
  orgUnitId: string;
  orgUnitName: string;
  totalPositions: number;
  filledPositions: number;
  vacantPositions: number;
  vacancyRate: number;
  averageDaysToFill: number;
  oldestVacancy: {
    positionId: string;
    positionTitle: string;
    vacantSince: string;
    daysVacant: number;
  } | null;
}

interface DiversityByLevel {
  level: number;
  levelLabel: string;
  totalCount: number;
  gender: { category: string; count: number; percentage: number }[];
  ethnicity: { category: string; count: number; percentage: number }[];
  ageDistribution: { range: string; count: number; percentage: number }[];
  tenureDistribution: { range: string; count: number; percentage: number }[];
}

interface OrgHealthScore {
  overall: number;
  components: {
    spanOfControl: number;
    orgDepth: number;
    vacancyManagement: number;
    structuralBalance: number;
    leadershipCoverage: number;
    careerPathCoverage: number;
  };
  recommendations: {
    area: string;
    severity: 'info' | 'warning' | 'critical';
    message: string;
    affectedUnits: string[];
  }[];
}

interface CostPerUnit {
  orgUnitId: string;
  orgUnitName: string;
  headcount: number;
  totalCompensation: number;
  averageCompensation: number;
  medianCompensation: number;
  costPerFte: number;
  percentageOfTotal: number;
  currency: string;
  budgeted: number;
  variance: number;
  variancePercent: number;
}
```

### OrgService

```typescript
interface OrgService {
  // --- Org Unit CRUD ---
  createOrgUnit(input: OrgUnitCreateInput): Promise<OrgUnit>;
  getOrgUnit(id: string): Promise<OrgUnit>;
  getOrgUnitBySlug(ventureId: string, slug: string): Promise<OrgUnit | null>;
  updateOrgUnit(id: string, input: OrgUnitUpdateInput): Promise<OrgUnit>;
  archiveOrgUnit(id: string, reason: string, effectiveDate?: string): Promise<OrgUnit>;
  listOrgUnits(params: {
    ventureId: string;
    parentId?: string | null;
    types?: OrgUnitType[];
    statuses?: OrgUnitStatus[];
    search?: string;
    page?: number;
    pageSize?: number;
    sortBy?: 'name' | 'sortOrder' | 'createdAt' | 'headcount';
    sortDirection?: 'asc' | 'desc';
  }): Promise<{ items: OrgUnit[]; total: number; page: number; pageSize: number }>;

  // --- Tree Operations ---
  getOrgUnitTree(params: {
    ventureId: string;
    rootUnitId?: string;
    maxDepth?: number;
    includeHeadcount?: boolean;
    includeInactive?: boolean;
    asOfDate?: string;
  }): Promise<OrgUnitTree[]>;
  getAncestors(unitId: string): Promise<OrgUnit[]>;
  getDescendants(unitId: string, maxDepth?: number): Promise<OrgUnit[]>;
  getChildren(unitId: string): Promise<OrgUnit[]>;
  getSiblings(unitId: string): Promise<OrgUnit[]>;

  // --- Move & Restructure ---
  moveOrgUnit(input: OrgUnitMoveInput): Promise<OrgUnit>;
  mergeOrgUnits(params: {
    sourceUnitIds: string[];
    targetUnitId: string;
    effectiveDate?: string;
    reason: string;
  }): Promise<OrgUnit>;
  splitOrgUnit(params: {
    sourceUnitId: string;
    splits: { name: string; type: OrgUnitType; positionIds: string[] }[];
    archiveSource: boolean;
    effectiveDate?: string;
    reason: string;
  }): Promise<OrgUnit[]>;

  // --- Snapshot & History ---
  getOrgSnapshot(ventureId: string, asOfDate: string): Promise<OrgUnitTree[]>;
  getOrgHistory(unitId: string, params?: {
    startDate?: string;
    endDate?: string;
    changeTypes?: string[];
    page?: number;
    pageSize?: number;
  }): Promise<{ items: OrgChangeRecord[]; total: number }>;
  diffOrgStructures(params: {
    ventureId: string;
    beforeDate: string;
    afterDate: string;
  }): Promise<OrgDiff>;
}
```

---

## Database Schemas

### org_units

```typescript
import { pgTable, uuid, text, varchar, integer, boolean, timestamp, jsonb, index, uniqueIndex, date } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

export const orgUnits = pgTable(
  'org_units',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    ventureId: uuid('venture_id').notNull().references(() => ventures.id),
    parentId: uuid('parent_id').references(() => orgUnits.id),
    path: text('path').notNull(),
    name: varchar('name', { length: 255 }).notNull(),
    slug: varchar('slug', { length: 255 }).notNull(),
    description: text('description'),
    type: varchar('type', { length: 50 }).notNull().default('department'),
    status: varchar('status', { length: 50 }).notNull().default('active'),
    costCenterCode: varchar('cost_center_code', { length: 50 }),
    externalId: varchar('external_id', { length: 255 }),
    headId: uuid('head_id'),
    depth: integer('depth').notNull().default(0),
    sortOrder: integer('sort_order').notNull().default(0),
    metadata: jsonb('metadata').notNull().default({}),
    effectiveDate: date('effective_date').notNull().default(sql`CURRENT_DATE`),
    expiryDate: date('expiry_date'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
    createdBy: uuid('created_by').notNull(),
    updatedBy: uuid('updated_by').notNull(),
  },
  (table) => ({
    slugVentureIdx: uniqueIndex('org_units_slug_venture_idx').on(table.ventureId, table.slug),
    pathIdx: index('org_units_path_idx').using('gist', sql`${table.path}::ltree`),
    ventureIdx: index('org_units_venture_idx').on(table.ventureId),
    parentIdx: index('org_units_parent_idx').on(table.parentId),
    typeIdx: index('org_units_type_idx').on(table.ventureId, table.type),
    statusIdx: index('org_units_status_idx').on(table.ventureId, table.status),
    externalIdIdx: index('org_units_external_id_idx').on(table.ventureId, table.externalId),
    headIdx: index('org_units_head_idx').on(table.headId),
  })
);
```

**Raw SQL for ltree setup:**

```sql
CREATE EXTENSION IF NOT EXISTS ltree;
CREATE INDEX org_units_path_gist_idx ON org_units USING GIST (path::ltree);

-- All descendants of Engineering
SELECT * FROM org_units WHERE path::ltree <@ 'company.eng'::ltree AND venture_id = $1;

-- All ancestors of a unit
SELECT * FROM org_units WHERE 'company.eng.platform.backend'::ltree <@ path::ltree
  AND venture_id = $1 ORDER BY nlevel(path::ltree);

-- RLS policy
ALTER TABLE org_units ENABLE ROW LEVEL SECURITY;
CREATE POLICY org_units_venture_isolation ON org_units
  USING (venture_id = current_setting('app.current_venture_id')::uuid)
  WITH CHECK (venture_id = current_setting('app.current_venture_id')::uuid);
```

### positions

```typescript
export const positions = pgTable(
  'positions',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    ventureId: uuid('venture_id').notNull().references(() => ventures.id),
    orgUnitId: uuid('org_unit_id').notNull().references(() => orgUnits.id),
    title: varchar('title', { length: 255 }).notNull(),
    positionCode: varchar('position_code', { length: 100 }).notNull(),
    description: text('description'),
    positionType: varchar('position_type', { length: 50 }).notNull().default('permanent'),
    status: varchar('status', { length: 50 }).notNull().default('draft'),
    jobFamilyId: uuid('job_family_id').references(() => jobFamilies.id),
    careerLevelId: uuid('career_level_id').references(() => careerLevels.id),
    gradeBandId: uuid('grade_band_id').references(() => gradeBands.id),
    reportsToPositionId: uuid('reports_to_position_id').references(() => positions.id),
    headcount: integer('headcount').notNull().default(1),
    isManager: boolean('is_manager').notNull().default(false),
    isCritical: boolean('is_critical').notNull().default(false),
    requiredCompetencies: jsonb('required_competencies').notNull().default([]),
    locationId: uuid('location_id'),
    workArrangement: varchar('work_arrangement', { length: 50 }).notNull().default('onsite'),
    fte: integer('fte').notNull().default(100),
    externalId: varchar('external_id', { length: 255 }),
    metadata: jsonb('metadata').notNull().default({}),
    effectiveDate: date('effective_date').notNull().default(sql`CURRENT_DATE`),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
    createdBy: uuid('created_by').notNull(),
    updatedBy: uuid('updated_by').notNull(),
  },
  (table) => ({
    codeVentureIdx: uniqueIndex('positions_code_venture_idx').on(table.ventureId, table.positionCode),
    orgUnitIdx: index('positions_org_unit_idx').on(table.orgUnitId),
    statusIdx: index('positions_status_idx').on(table.ventureId, table.status),
    jobFamilyIdx: index('positions_job_family_idx').on(table.jobFamilyId),
    gradeBandIdx: index('positions_grade_band_idx').on(table.gradeBandId),
    reportsToIdx: index('positions_reports_to_idx').on(table.reportsToPositionId),
    managerIdx: index('positions_manager_idx').on(table.ventureId, table.isManager),
    criticalIdx: index('positions_critical_idx').on(table.ventureId, table.isCritical),
  })
);
```

### position_assignments

```typescript
export const positionAssignments = pgTable(
  'position_assignments',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    positionId: uuid('position_id').notNull().references(() => positions.id),
    employeeId: uuid('employee_id').notNull(),
    ventureId: uuid('venture_id').notNull().references(() => ventures.id),
    assignmentType: varchar('assignment_type', { length: 50 }).notNull().default('primary'),
    startDate: date('start_date').notNull(),
    endDate: date('end_date'),
    fte: integer('fte').notNull().default(100),
    status: varchar('status', { length: 50 }).notNull().default('active'),
    reason: text('reason'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
    createdBy: uuid('created_by').notNull(),
    updatedBy: uuid('updated_by').notNull(),
  },
  (table) => ({
    positionIdx: index('position_assignments_position_idx').on(table.positionId),
    employeeIdx: index('position_assignments_employee_idx').on(table.employeeId),
    ventureIdx: index('position_assignments_venture_idx').on(table.ventureId),
    statusIdx: index('position_assignments_status_idx').on(table.status),
    dateRangeIdx: index('position_assignments_date_range_idx').on(table.startDate, table.endDate),
    activePrimaryIdx: uniqueIndex('position_assignments_active_primary_idx')
      .on(table.employeeId, table.assignmentType)
      .where(sql`status = 'active' AND assignment_type = 'primary'`),
  })
);
```

### org_relationships

```typescript
export const orgRelationships = pgTable(
  'org_relationships',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    ventureId: uuid('venture_id').notNull().references(() => ventures.id),
    sourceType: varchar('source_type', { length: 50 }).notNull(),
    sourceId: uuid('source_id').notNull(),
    targetType: varchar('target_type', { length: 50 }).notNull(),
    targetId: uuid('target_id').notNull(),
    relationshipType: varchar('relationship_type', { length: 50 }).notNull(),
    label: varchar('label', { length: 255 }),
    weight: integer('weight').notNull().default(50),
    startDate: date('start_date').notNull(),
    endDate: date('end_date'),
    status: varchar('status', { length: 50 }).notNull().default('active'),
    metadata: jsonb('metadata').notNull().default({}),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
    createdBy: uuid('created_by').notNull(),
    updatedBy: uuid('updated_by').notNull(),
  },
  (table) => ({
    sourceIdx: index('org_relationships_source_idx').on(table.sourceType, table.sourceId),
    targetIdx: index('org_relationships_target_idx').on(table.targetType, table.targetId),
    typeIdx: index('org_relationships_type_idx').on(table.ventureId, table.relationshipType),
    ventureIdx: index('org_relationships_venture_idx').on(table.ventureId),
  })
);
```

### headcount_plans

```typescript
export const headcountPlans = pgTable(
  'headcount_plans',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    ventureId: uuid('venture_id').notNull().references(() => ventures.id),
    name: varchar('name', { length: 255 }).notNull(),
    description: text('description'),
    fiscalYear: varchar('fiscal_year', { length: 10 }).notNull(),
    status: varchar('status', { length: 50 }).notNull().default('draft'),
    startDate: date('start_date').notNull(),
    endDate: date('end_date').notNull(),
    totalBudgetedHeadcount: integer('total_budgeted_headcount').notNull().default(0),
    totalBudgetedCost: integer('total_budgeted_cost').notNull().default(0),
    currency: varchar('currency', { length: 3 }).notNull().default('USD'),
    approvedBy: uuid('approved_by'),
    approvedAt: timestamp('approved_at', { withTimezone: true }),
    metadata: jsonb('metadata').notNull().default({}),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
    createdBy: uuid('created_by').notNull(),
    updatedBy: uuid('updated_by').notNull(),
  },
  (table) => ({
    ventureIdx: index('headcount_plans_venture_idx').on(table.ventureId),
    fiscalYearIdx: index('headcount_plans_fy_idx').on(table.ventureId, table.fiscalYear),
    statusIdx: index('headcount_plans_status_idx').on(table.ventureId, table.status),
  })
);

export const headcountPlanEntries = pgTable(
  'headcount_plan_entries',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    planId: uuid('plan_id').notNull().references(() => headcountPlans.id, { onDelete: 'cascade' }),
    orgUnitId: uuid('org_unit_id').notNull().references(() => orgUnits.id),
    periodStart: date('period_start').notNull(),
    periodEnd: date('period_end').notNull(),
    budgetedHeadcount: integer('budgeted_headcount').notNull().default(0),
    budgetedFte: integer('budgeted_fte').notNull().default(0),
    budgetedCost: integer('budgeted_cost').notNull().default(0),
    openPositions: integer('open_positions').notNull().default(0),
    plannedHires: integer('planned_hires').notNull().default(0),
    plannedDepartures: integer('planned_departures').notNull().default(0),
    notes: text('notes'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    planIdx: index('hc_entries_plan_idx').on(table.planId),
    orgUnitIdx: index('hc_entries_org_unit_idx').on(table.orgUnitId),
    periodIdx: index('hc_entries_period_idx').on(table.planId, table.periodStart, table.periodEnd),
  })
);
```

### restructuring_proposals

```typescript
export const restructuringProposals = pgTable(
  'restructuring_proposals',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    ventureId: uuid('venture_id').notNull().references(() => ventures.id),
    title: varchar('title', { length: 500 }).notNull(),
    description: text('description').notNull(),
    rationale: text('rationale').notNull(),
    status: varchar('status', { length: 50 }).notNull().default('draft'),
    proposedEffectiveDate: date('proposed_effective_date').notNull(),
    actualEffectiveDate: date('actual_effective_date'),
    impact: jsonb('impact').notNull().default({}),
    approvals: jsonb('approvals').notNull().default([]),
    timeline: jsonb('timeline').notNull().default({}),
    attachmentIds: jsonb('attachment_ids').notNull().default([]),
    version: integer('version').notNull().default(1),
    previousVersionId: uuid('previous_version_id').references(() => restructuringProposals.id),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
    createdBy: uuid('created_by').notNull(),
    updatedBy: uuid('updated_by').notNull(),
  },
  (table) => ({
    ventureIdx: index('restructuring_proposals_venture_idx').on(table.ventureId),
    statusIdx: index('restructuring_proposals_status_idx').on(table.ventureId, table.status),
    effectiveDateIdx: index('restructuring_proposals_date_idx').on(table.proposedEffectiveDate),
  })
);

export const restructuringActions = pgTable(
  'restructuring_actions',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    proposalId: uuid('proposal_id').notNull()
      .references(() => restructuringProposals.id, { onDelete: 'cascade' }),
    actionType: varchar('action_type', { length: 50 }).notNull(),
    sequenceOrder: integer('sequence_order').notNull(),
    subjectType: varchar('subject_type', { length: 50 }).notNull(),
    subjectId: uuid('subject_id').notNull(),
    parameters: jsonb('parameters').notNull().default({}),
    status: varchar('status', { length: 50 }).notNull().default('pending'),
    errorMessage: text('error_message'),
    executedAt: timestamp('executed_at', { withTimezone: true }),
    executedBy: uuid('executed_by'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    proposalIdx: index('restructuring_actions_proposal_idx').on(table.proposalId),
    sequenceIdx: index('restructuring_actions_seq_idx').on(table.proposalId, table.sequenceOrder),
  })
);
```

### job_families, career_tracks, grade_bands

```typescript
export const jobFamilyGroups = pgTable(
  'job_family_groups',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    ventureId: uuid('venture_id').notNull().references(() => ventures.id),
    name: varchar('name', { length: 255 }).notNull(),
    slug: varchar('slug', { length: 255 }).notNull(),
    description: text('description'),
    status: varchar('status', { length: 50 }).notNull().default('active'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    ventureSlugIdx: uniqueIndex('jfg_venture_slug_idx').on(table.ventureId, table.slug),
  })
);

export const jobFamilies = pgTable(
  'job_families',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    ventureId: uuid('venture_id').notNull().references(() => ventures.id),
    groupId: uuid('group_id').references(() => jobFamilyGroups.id),
    name: varchar('name', { length: 255 }).notNull(),
    slug: varchar('slug', { length: 255 }).notNull(),
    description: text('description'),
    isShared: boolean('is_shared').notNull().default(false),
    status: varchar('status', { length: 50 }).notNull().default('active'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    ventureSlugIdx: uniqueIndex('jf_venture_slug_idx').on(table.ventureId, table.slug),
    groupIdx: index('jf_group_idx').on(table.groupId),
  })
);

export const careerTracks = pgTable(
  'career_tracks',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    jobFamilyId: uuid('job_family_id').notNull().references(() => jobFamilies.id),
    ventureId: uuid('venture_id').notNull().references(() => ventures.id),
    name: varchar('name', { length: 255 }).notNull(),
    slug: varchar('slug', { length: 255 }).notNull(),
    description: text('description'),
    trackType: varchar('track_type', { length: 50 }).notNull().default('individual_contributor'),
    transitions: jsonb('transitions').notNull().default([]),
    status: varchar('status', { length: 50 }).notNull().default('active'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    jobFamilyIdx: index('ct_job_family_idx').on(table.jobFamilyId),
    ventureSlugIdx: uniqueIndex('ct_venture_slug_idx').on(table.ventureId, table.slug),
  })
);

export const careerLevels = pgTable(
  'career_levels',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    careerTrackId: uuid('career_track_id').notNull()
      .references(() => careerTracks.id, { onDelete: 'cascade' }),
    ventureId: uuid('venture_id').notNull().references(() => ventures.id),
    name: varchar('name', { length: 255 }).notNull(),
    code: varchar('code', { length: 20 }).notNull(),
    sequence: integer('sequence').notNull(),
    gradeBandId: uuid('grade_band_id').references(() => gradeBands.id),
    criteria: jsonb('criteria').notNull().default({}),
    competencies: jsonb('competencies').notNull().default([]),
    typicalTenureMonths: integer('typical_tenure_months'),
    minimumTenureMonths: integer('minimum_tenure_months'),
    isTerminal: boolean('is_terminal').notNull().default(false),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    trackIdx: index('cl_track_idx').on(table.careerTrackId),
    sequenceIdx: uniqueIndex('cl_track_seq_idx').on(table.careerTrackId, table.sequence),
    codeIdx: uniqueIndex('cl_venture_code_idx').on(table.ventureId, table.code),
  })
);

export const gradeBands = pgTable(
  'grade_bands',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    ventureId: uuid('venture_id').notNull().references(() => ventures.id),
    name: varchar('name', { length: 255 }).notNull(),
    code: varchar('code', { length: 20 }).notNull(),
    sequence: integer('sequence').notNull(),
    compensationRanges: jsonb('compensation_ranges').notNull().default([]),
    status: varchar('status', { length: 50 }).notNull().default('active'),
    effectiveDate: date('effective_date').notNull().default(sql`CURRENT_DATE`),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    ventureCodeIdx: uniqueIndex('gb_venture_code_idx').on(table.ventureId, table.code),
    sequenceIdx: index('gb_sequence_idx').on(table.ventureId, table.sequence),
  })
);
```

### competency_models, competencies

```typescript
export const competencyModels = pgTable(
  'competency_models',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    ventureId: uuid('venture_id').notNull().references(() => ventures.id),
    name: varchar('name', { length: 255 }).notNull(),
    description: text('description'),
    scope: varchar('scope', { length: 50 }).notNull().default('organization'),
    jobFamilyId: uuid('job_family_id').references(() => jobFamilies.id),
    status: varchar('status', { length: 50 }).notNull().default('active'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    ventureIdx: index('cm_venture_idx').on(table.ventureId),
    jobFamilyIdx: index('cm_job_family_idx').on(table.jobFamilyId),
  })
);

export const competencies = pgTable(
  'competencies',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    modelId: uuid('model_id').notNull()
      .references(() => competencyModels.id, { onDelete: 'cascade' }),
    name: varchar('name', { length: 255 }).notNull(),
    category: varchar('category', { length: 100 }).notNull(),
    description: text('description').notNull(),
    levels: jsonb('levels').notNull().default([]),
    isCore: boolean('is_core').notNull().default(false),
    sortOrder: integer('sort_order').notNull().default(0),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    modelIdx: index('comp_model_idx').on(table.modelId),
    categoryIdx: index('comp_category_idx').on(table.modelId, table.category),
  })
);
```

### org_change_history

```typescript
export const orgChangeHistory = pgTable(
  'org_change_history',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    ventureId: uuid('venture_id').notNull().references(() => ventures.id),
    entityType: varchar('entity_type', { length: 50 }).notNull(),
    entityId: uuid('entity_id').notNull(),
    changeType: varchar('change_type', { length: 100 }).notNull(),
    previousState: jsonb('previous_state'),
    newState: jsonb('new_state'),
    changedBy: uuid('changed_by').notNull(),
    changedAt: timestamp('changed_at', { withTimezone: true }).notNull().defaultNow(),
    effectiveDate: date('effective_date').notNull(),
    reason: text('reason'),
    proposalId: uuid('proposal_id').references(() => restructuringProposals.id),
    metadata: jsonb('metadata').notNull().default({}),
  },
  (table) => ({
    entityIdx: index('och_entity_idx').on(table.entityType, table.entityId),
    ventureIdx: index('och_venture_idx').on(table.ventureId),
    changedAtIdx: index('och_changed_at_idx').on(table.changedAt),
    effectiveDateIdx: index('och_effective_date_idx').on(table.effectiveDate),
    proposalIdx: index('och_proposal_idx').on(table.proposalId),
    changeTypeIdx: index('och_change_type_idx').on(table.ventureId, table.changeType),
  })
);
```

---

## Code Examples

### Example 1: Building an Org Hierarchy

```typescript
import { OrgService } from '@mcv/people/org';

async function buildOrgStructure(orgService: OrgService) {
  const ventureId = 'venture-abc-123';

  // Create root company node
  const company = await orgService.createOrgUnit({
    ventureId,
    parentId: null,
    name: 'Acme Corporation',
    type: 'company',
    costCenterCode: 'CC-0000',
    metadata: { legalName: 'Acme Corporation Inc.', jurisdiction: 'US-DE' },
  });
  // path: "acme_corporation"

  // Create divisions
  const engineering = await orgService.createOrgUnit({
    ventureId,
    parentId: company.id,
    name: 'Engineering',
    type: 'division',
    costCenterCode: 'CC-1000',
  });
  // path: "acme_corporation.engineering"

  const sales = await orgService.createOrgUnit({
    ventureId,
    parentId: company.id,
    name: 'Sales',
    type: 'division',
    costCenterCode: 'CC-2000',
  });

  // Create departments under Engineering
  const platform = await orgService.createOrgUnit({
    ventureId,
    parentId: engineering.id,
    name: 'Platform Engineering',
    type: 'department',
    costCenterCode: 'CC-1100',
  });
  // path: "acme_corporation.engineering.platform_engineering"

  // Create teams under Platform Engineering
  const backend = await orgService.createOrgUnit({
    ventureId,
    parentId: platform.id,
    name: 'Backend Team',
    type: 'team',
    costCenterCode: 'CC-1110',
  });
  // path: "acme_corporation.engineering.platform_engineering.backend_team"

  const frontend = await orgService.createOrgUnit({
    ventureId,
    parentId: platform.id,
    name: 'Frontend Team',
    type: 'team',
  });

  // Verify the tree
  const tree = await orgService.getOrgUnitTree({ ventureId, includeHeadcount: true });
  console.log(`Root: ${tree[0].name}, Total units: ${countNodes(tree[0])}`);
  // Root: Acme Corporation, Total units: 6
}

function countNodes(node: OrgUnitTree): number {
  return 1 + node.children.reduce((sum, child) => sum + countNodes(child), 0);
}
```

### Example 2: Managing Positions and Assignments

```typescript
import { PositionService } from '@mcv/people/org';

async function managePositions(positionService: PositionService) {
  const ventureId = 'venture-abc-123';
  const platformUnitId = 'unit-platform-456';

  // Create a senior engineer position
  const seniorPos = await positionService.createPosition({
    ventureId,
    orgUnitId: platformUnitId,
    title: 'Senior Software Engineer',
    positionCode: 'ENG-SWE-SR-001',
    description: 'Senior engineer for backend platform systems',
    positionType: 'permanent',
    jobFamilyId: 'jf-software-eng',
    careerLevelId: 'cl-ic4',
    gradeBandId: 'gb-l5',
    headcount: 1,
    isManager: false,
    isCritical: false,
    workArrangement: 'hybrid',
    fte: 100,
    requiredCompetencies: [
      { competencyId: 'comp-system-design', requiredLevel: 4, isRequired: true, weight: 30 },
      { competencyId: 'comp-coding', requiredLevel: 5, isRequired: true, weight: 25 },
      { competencyId: 'comp-communication', requiredLevel: 3, isRequired: true, weight: 20 },
    ],
  });

  // Create a team lead position (manager)
  const teamLeadPos = await positionService.createPosition({
    ventureId,
    orgUnitId: platformUnitId,
    title: 'Platform Team Lead',
    positionCode: 'ENG-SWE-TL-001',
    positionType: 'permanent',
    gradeBandId: 'gb-l6',
    headcount: 1,
    isManager: true,
    isCritical: true,
    workArrangement: 'hybrid',
    fte: 100,
  });

  // Set reporting relationship
  await positionService.updatePosition(seniorPos.id, {
    reportsToPositionId: teamLeadPos.id,
  });

  // Assign employee to position
  const assignment = await positionService.assignEmployee({
    positionId: seniorPos.id,
    employeeId: 'emp-jane-doe-789',
    ventureId,
    assignmentType: 'primary',
    startDate: '2026-02-10',
    fte: 100,
    reason: 'New hire',
  });
  console.log(`Assigned: ${assignment.id}`);

  // Check vacancies
  const vacancies = await positionService.getVacancies({
    ventureId,
    orgUnitId: platformUnitId,
  });
  for (const v of vacancies) {
    console.log(`${v.position.title}: ${v.openSlots} open, vacant ${v.daysVacant}d`);
  }
}
```

### Example 3: Generating Org Charts

```typescript
import { OrgChartService } from '@mcv/people/org';

async function generateOrgCharts(chartService: OrgChartService) {
  const ventureId = 'venture-abc-123';

  // Full org chart
  const fullChart = await chartService.generateChart({
    ventureId,
    layout: {
      direction: 'top-down',
      nodeSpacing: 40,
      levelSpacing: 80,
      compactMode: false,
      showVacancies: true,
      showHeadcount: true,
      maxDepth: null,
      collapseThreshold: 10,
    },
  });
  console.log(`Chart: ${fullChart.totalNodes} nodes, depth ${fullChart.maxDepth}`);

  // Subtree chart starting from Engineering
  const engChart = await chartService.generateChart({
    ventureId,
    filter: {
      rootUnitId: 'unit-engineering-123',
      maxDepth: 3,
      includeVacancies: true,
    },
    layout: {
      direction: 'left-right',
      nodeSpacing: 30,
      levelSpacing: 60,
      compactMode: true,
      showVacancies: true,
      showHeadcount: true,
      maxDepth: 3,
      collapseThreshold: 8,
    },
  });

  // Chart with matrix relationships
  const matrixChart = await chartService.generateChart({
    ventureId,
    includeRelationshipTypes: ['direct', 'dotted', 'matrix'],
    layout: {
      direction: 'top-down',
      nodeSpacing: 50,
      levelSpacing: 100,
      compactMode: false,
      showVacancies: false,
      showHeadcount: false,
      maxDepth: null,
      collapseThreshold: 15,
    },
  });

  const directEdges = matrixChart.edges.filter(e => e.type === 'direct').length;
  const dottedEdges = matrixChart.edges.filter(e => e.type === 'dotted').length;
  console.log(`Edges: ${directEdges} direct, ${dottedEdges} dotted`);

  // Export as SVG
  const svg = await chartService.exportChart(fullChart, 'svg');
  // { data: '<svg>...</svg>', mimeType: 'image/svg+xml' }

  // Export as PDF
  const pdf = await chartService.exportChart(fullChart, 'pdf', {
    pageSize: 'A3',
    orientation: 'landscape',
    title: 'Acme Corp — Org Chart, February 2026',
  });

  // Reporting chain (employee → CEO)
  const chain = await chartService.getReportingChain({
    ventureId,
    employeeId: 'emp-jane-doe-789',
    direction: 'up',
  });
  console.log('Chain:', chain.map(n => n.label).join(' → '));
  // Jane Doe → Bob Manager → Alice VP → Carol CEO

  // Historical chart
  const historicalChart = await chartService.generateChart({
    ventureId,
    filter: { asOfDate: '2025-06-01' },
    layout: {
      direction: 'top-down',
      nodeSpacing: 40,
      levelSpacing: 80,
      compactMode: false,
      showVacancies: false,
      showHeadcount: true,
      maxDepth: null,
      collapseThreshold: 10,
    },
  });
}
```

### Example 4: Headcount Planning and Scenarios

```typescript
import { HeadcountService } from '@mcv/people/org';

async function planHeadcount(hcService: HeadcountService) {
  const ventureId = 'venture-abc-123';

  // Create FY2026 headcount plan
  const plan = await hcService.createPlan({
    ventureId,
    name: 'FY2026 Headcount Plan',
    description: 'Annual headcount plan for fiscal year 2026',
    fiscalYear: '2026',
    startDate: '2026-01-01',
    endDate: '2026-12-31',
    currency: 'USD',
  });

  // Add quarterly entries for Engineering
  await hcService.addPlanEntry({
    planId: plan.id,
    orgUnitId: 'unit-engineering-123',
    periodStart: '2026-01-01',
    periodEnd: '2026-03-31',
    budgetedHeadcount: 45,
    budgetedFte: 4400,
    budgetedCost: 1_350_000_00,
    plannedHires: 5,
    plannedDepartures: 2,
    notes: 'Q1: Ramp up for Project Phoenix',
  });

  await hcService.addPlanEntry({
    planId: plan.id,
    orgUnitId: 'unit-engineering-123',
    periodStart: '2026-04-01',
    periodEnd: '2026-06-30',
    budgetedHeadcount: 50,
    budgetedFte: 4900,
    budgetedCost: 1_500_000_00,
    plannedHires: 7,
    plannedDepartures: 2,
  });

  // Create growth scenario
  const growthScenario = await hcService.createScenario({
    planId: plan.id,
    name: 'Aggressive Growth',
    description: 'Double engineering for Series B expansion',
    type: 'growth',
    probability: 30,
    adjustments: [
      {
        orgUnitId: 'unit-engineering-123',
        adjustmentType: 'add',
        headcountChange: 25,
        fteChange: 2500,
        costImpact: 750_000_00,
        rationale: 'Double platform team for new product',
        effectiveDate: '2026-04-01',
      },
    ],
  });

  // Create reduction scenario
  const reductionScenario = await hcService.createScenario({
    planId: plan.id,
    name: 'Efficiency Mode',
    description: 'Reduce headcount if revenue targets missed',
    type: 'reduction',
    probability: 15,
    adjustments: [
      {
        orgUnitId: 'unit-engineering-123',
        adjustmentType: 'remove',
        headcountChange: -8,
        fteChange: -800,
        costImpact: -240_000_00,
        rationale: 'Consolidate overlapping teams',
        effectiveDate: '2026-07-01',
      },
    ],
  });

  // Compare scenarios
  const comparison = await hcService.compareScenarios({
    planId: plan.id,
    scenarioIds: [growthScenario.id, reductionScenario.id],
  });
  for (const sc of comparison) {
    console.log(`${sc.name}: ${sc.totalHeadcount} HC, delta ${sc.headcountDelta}`);
  }

  // Analyze variance after time passes
  const variance = await hcService.getVariance({ planId: plan.id, period: '2026-Q1' });
  for (const v of variance) {
    const icon = v.variancePercent > 10 ? '⚠️' : '✅';
    console.log(`${icon} ${v.orgUnitName}: budget ${v.budgetedHeadcount}, actual ${v.actualHeadcount}`);
  }

  // Forecast
  const forecast = await hcService.forecast({
    ventureId,
    orgUnitId: 'unit-engineering-123',
    horizonMonths: 12,
    confidenceLevel: 0.95,
  });
  for (const p of forecast.periods) {
    console.log(`${p.date}: ${p.projected} (${p.lower}–${p.upper})`);
  }
}
```

### Example 5: Restructuring Proposal Workflow

```typescript
import { RestructuringService, OrgService } from '@mcv/people/org';

async function executeRestructuring(
  restructService: RestructuringService,
  orgService: OrgService,
) {
  const ventureId = 'venture-abc-123';

  // Create proposal
  const proposal = await restructService.createProposal({
    ventureId,
    title: 'Engineering Reorg — Platform & Product Merge',
    description: 'Merge Platform and Product Engineering into unified department.',
    rationale: 'Eliminate silos, reduce hand-offs, accelerate delivery.',
    proposedEffectiveDate: '2026-04-01',
    timeline: {
      proposedDate: '2026-02-10',
      reviewDeadline: '2026-02-20',
      approvalDeadline: '2026-03-01',
      communicationDate: '2026-03-15',
      effectiveDate: '2026-04-01',
      completionDeadline: '2026-04-15',
      milestones: [
        { name: 'HR Review', date: '2026-02-15', status: 'pending', assigneeId: 'emp-hr-lead' },
        { name: 'Finance Review', date: '2026-02-18', status: 'pending', assigneeId: 'emp-cfo' },
        { name: 'Town Hall', date: '2026-03-15', status: 'pending', assigneeId: 'emp-vp-eng' },
      ],
    },
  });

  // Add actions
  await restructService.addAction({
    proposalId: proposal.id,
    actionType: 'create_unit',
    sequenceOrder: 1,
    subjectType: 'org_unit',
    subjectId: 'unit-engineering-123',
    parameters: { name: 'Unified Engineering', type: 'department', costCenterCode: 'CC-1000' },
  });

  await restructService.addAction({
    proposalId: proposal.id,
    actionType: 'merge_units',
    sequenceOrder: 2,
    subjectType: 'org_unit',
    subjectId: 'unit-platform-eng',
    parameters: {
      sourceUnitIds: ['unit-platform-eng', 'unit-product-eng'],
      targetUnitId: '__new_unit_1__',
      transferPositions: true,
    },
  });

  await restructService.addAction({
    proposalId: proposal.id,
    actionType: 'change_reporting',
    sequenceOrder: 3,
    subjectType: 'employee',
    subjectId: 'emp-product-lead',
    parameters: { newManagerId: 'emp-vp-eng', reason: 'Post-merge reporting' },
  });

  // Impact analysis
  const impact = await restructService.analyzeImpact(proposal.id);
  console.log(`Affected: ${impact.affectedEmployeeCount} employees`);
  console.log(`Risk: ${impact.riskLevel}`);
  console.log(`Net savings: $${impact.netAnnualImpact / 100}/year`);

  // Submit → Approve → Execute
  await restructService.submit(proposal.id);

  await restructService.approve({
    proposalId: proposal.id,
    approverId: 'emp-hr-lead',
    comments: 'No involuntary separations. Approved.',
  });
  await restructService.approve({
    proposalId: proposal.id,
    approverId: 'emp-cfo',
    comments: 'Budget neutral. Approved.',
  });
  await restructService.approve({
    proposalId: proposal.id,
    approverId: 'emp-ceo',
    comments: 'Execute on April 1.',
  });

  // Execute on effective date
  const result = await restructService.execute(proposal.id);
  for (const action of result.executedActions) {
    console.log(`[${action.status}] ${action.actionType}`);
  }

  // Compare before/after
  const diff = await orgService.diffOrgStructures({
    ventureId,
    beforeDate: '2026-03-31',
    afterDate: '2026-04-01',
  });
  console.log(`+${diff.unitsAdded.length} -${diff.unitsRemoved.length} ~${diff.unitsModified.length}`);
}
```

### Example 6: Job Architecture and Career Pathing

```typescript
import { JobArchitectureService } from '@mcv/people/org';

async function buildJobArchitecture(jobArchService: JobArchitectureService) {
  const ventureId = 'venture-abc-123';

  // Create job family group
  const techGroup = await jobArchService.createJobFamilyGroup({
    ventureId,
    name: 'Technology',
    slug: 'technology',
    description: 'All technology and engineering job families',
  });

  // Create job family
  const swEngFamily = await jobArchService.createJobFamily({
    ventureId,
    groupId: techGroup.id,
    name: 'Software Engineering',
    slug: 'software-engineering',
    description: 'Design, develop, test, and maintain software systems',
  });

  // Create grade bands
  const g3 = await jobArchService.createGradeBand({
    ventureId,
    name: 'Grade 3',
    code: 'G3',
    sequence: 3,
    compensationRanges: [
      {
        currency: 'USD', region: 'US-SF',
        annualSalaryMin: 80_000, annualSalaryMid: 100_000, annualSalaryMax: 120_000,
        totalCompMin: 95_000, totalCompMid: 125_000, totalCompMax: 155_000,
      },
    ],
  });
  const g4 = await jobArchService.createGradeBand({
    ventureId, name: 'Grade 4', code: 'G4', sequence: 4,
    compensationRanges: [{
      currency: 'USD', region: 'US-SF',
      annualSalaryMin: 120_000, annualSalaryMid: 150_000, annualSalaryMax: 180_000,
      totalCompMin: 150_000, totalCompMid: 200_000, totalCompMax: 250_000,
    }],
  });
  const g5 = await jobArchService.createGradeBand({
    ventureId, name: 'Grade 5', code: 'G5', sequence: 5,
    compensationRanges: [{
      currency: 'USD', region: 'US-SF',
      annualSalaryMin: 170_000, annualSalaryMid: 210_000, annualSalaryMax: 260_000,
      totalCompMin: 220_000, totalCompMid: 300_000, totalCompMax: 400_000,
    }],
  });

  // Create IC career track
  const icTrack = await jobArchService.createCareerTrack({
    ventureId,
    jobFamilyId: swEngFamily.id,
    name: 'Individual Contributor',
    slug: 'ic-track',
    trackType: 'individual_contributor',
  });

  // Create management track
  const mgmtTrack = await jobArchService.createCareerTrack({
    ventureId,
    jobFamilyId: swEngFamily.id,
    name: 'Engineering Management',
    slug: 'mgmt-track',
    trackType: 'management',
  });

  // Add levels to IC track
  await jobArchService.addCareerLevel({
    careerTrackId: icTrack.id,
    ventureId,
    name: 'Software Engineer',
    code: 'IC3',
    sequence: 1,
    gradeBandId: g3.id,
    criteria: {
      minExperienceYears: 0,
      requiredCertifications: [],
      minEducationLevel: 'bachelors',
      minPerformanceRating: null,
      consecutiveHighPerformanceReviews: null,
      scopeDescription: 'Completes well-defined tasks within a team.',
      impactDescription: 'Delivers assigned features on time.',
      leadershipDescription: null,
      customCriteria: [],
    },
    typicalTenureMonths: 24,
    minimumTenureMonths: null,
    isTerminal: false,
  });

  await jobArchService.addCareerLevel({
    careerTrackId: icTrack.id,
    ventureId,
    name: 'Senior Software Engineer',
    code: 'IC4',
    sequence: 2,
    gradeBandId: g4.id,
    criteria: {
      minExperienceYears: 3,
      requiredCertifications: [],
      minEducationLevel: null,
      minPerformanceRating: 3.5,
      consecutiveHighPerformanceReviews: 2,
      scopeDescription: 'Owns significant components or systems.',
      impactDescription: 'Drives technical decisions that affect the team.',
      leadershipDescription: 'Mentors junior engineers.',
      customCriteria: [],
    },
    typicalTenureMonths: 36,
    minimumTenureMonths: 18,
    isTerminal: false,
  });

  await jobArchService.addCareerLevel({
    careerTrackId: icTrack.id,
    ventureId,
    name: 'Staff Software Engineer',
    code: 'IC5',
    sequence: 3,
    gradeBandId: g5.id,
    criteria: {
      minExperienceYears: 7,
      requiredCertifications: [],
      minEducationLevel: null,
      minPerformanceRating: 4.0,
      consecutiveHighPerformanceReviews: 2,
      scopeDescription: 'Owns architecture across multiple teams.',
      impactDescription: 'Drives org-wide technical strategy.',
      leadershipDescription: 'Sets technical direction, influences roadmap.',
      customCriteria: [
        { name: 'RFC authorship', description: 'Authored 2+ accepted RFCs', isMandatory: true },
      ],
    },
    typicalTenureMonths: null,
    minimumTenureMonths: 24,
    isTerminal: false,
  });

  // Add transition from IC4 to Management track
  await jobArchService.addTransition({
    careerTrackId: icTrack.id,
    fromLevelCode: 'IC4',
    toTrackId: mgmtTrack.id,
    toLevelCode: 'M1',
    description: 'Transition from Senior IC to Team Lead',
  });

  // View career path for an employee
  const careerPath = await jobArchService.getCareerPath({
    ventureId,
    employeeId: 'emp-jane-doe-789',
  });
  console.log(`Current: ${careerPath.currentLevel.name} (${careerPath.currentLevel.code})`);
  console.log('Next levels:');
  for (const next of careerPath.nextLevels) {
    console.log(`  → ${next.level.name} (${next.level.code}): ${next.readiness}% ready`);
    for (const gap of next.gaps) {
      console.log(`    Gap: ${gap.competencyName} — need ${gap.required}, have ${gap.current}`);
    }
  }
}
```

### Example 7: Org Analytics and Health Metrics

```typescript
import { OrgAnalyticsService } from '@mcv/people/org';

async function analyzeOrg(analyticsService: OrgAnalyticsService) {
  const ventureId = 'venture-abc-123';

  // Full analytics snapshot
  const analytics = await analyticsService.getAnalytics({
    ventureId,
    period: { start: '2026-01-01', end: '2026-02-09' },
  });

  console.log('=== Org Overview ===');
  console.log(`Headcount: ${analytics.totalHeadcount} (${analytics.totalFte} FTE)`);
  console.log(`Units: ${analytics.totalOrgUnits}`);
  console.log(`Positions: ${analytics.filledPositions}/${analytics.totalPositions} filled`);
  console.log(`Vacancy rate: ${(analytics.vacancyRate * 100).toFixed(1)}%`);

  // Span of control analysis
  const span = analytics.spanOfControl;
  console.log('\n=== Span of Control ===');
  console.log(`Average: ${span.average.toFixed(1)}, Median: ${span.median}`);
  console.log(`Range: ${span.min}–${span.max}`);
  console.log(`Recommended: ${span.recommendedMin}–${span.recommendedMax}`);

  if (span.overSpanManagers.length > 0) {
    console.log('⚠️ Over-span managers:');
    for (const m of span.overSpanManagers) {
      console.log(`  ${m.managerName}: ${m.directReports} reports`);
    }
  }

  // Org depth
  console.log('\n=== Org Depth ===');
  console.log(`Max depth: ${analytics.orgDepth.maxDepth}`);
  console.log(`Average: ${analytics.orgDepth.averageDepth.toFixed(1)}`);
  for (const d of analytics.orgDepth.depthDistribution) {
    const bar = '█'.repeat(Math.round(d.percentage / 5));
    console.log(`  Level ${d.depth}: ${d.employeeCount} (${d.percentage.toFixed(0)}%) ${bar}`);
  }

  // Vacancy analysis
  console.log('\n=== Vacancies by Unit ===');
  const highVacancy = analytics.vacancyAnalysis
    .filter(v => v.vacancyRate > 0.15)
    .sort((a, b) => b.vacancyRate - a.vacancyRate);
  for (const v of highVacancy) {
    console.log(`  ⚠️ ${v.orgUnitName}: ${(v.vacancyRate * 100).toFixed(0)}% vacant, avg ${v.averageDaysToFill}d to fill`);
  }

  // Headcount trend
  console.log('\n=== Headcount Trend (last 6 months) ===');
  for (const t of analytics.headcountTrends.slice(-6)) {
    console.log(`  ${t.date}: ${t.totalHeadcount} (+${t.hires} -${t.departures} = ${t.netChange > 0 ? '+' : ''}${t.netChange})`);
  }

  // Health score
  const health = analytics.healthScore;
  console.log('\n=== Org Health Score ===');
  console.log(`Overall: ${health.overall}/100`);
  console.log(`  Span of Control:    ${health.components.spanOfControl}/100`);
  console.log(`  Org Depth:          ${health.components.orgDepth}/100`);
  console.log(`  Vacancy Mgmt:       ${health.components.vacancyManagement}/100`);
  console.log(`  Structural Balance: ${health.components.structuralBalance}/100`);
  console.log(`  Leadership:         ${health.components.leadershipCoverage}/100`);
  console.log(`  Career Paths:       ${health.components.careerPathCoverage}/100`);

  for (const rec of health.recommendations) {
    const icon = rec.severity === 'critical' ? '🔴' : rec.severity === 'warning' ? '🟡' : 'ℹ️';
    console.log(`${icon} ${rec.area}: ${rec.message}`);
  }
}
```

### Example 8: Multi-Venture and HRIS Sync

```typescript
import { OrgService, OrgSyncService } from '@mcv/people/org';

async function multiVentureAndSync(
  orgService: OrgService,
  syncService: OrgSyncService,
) {
  // --- Multi-Venture: Shared Services ---

  // Create a shared service unit visible to multiple ventures
  const sharedHR = await orgService.createOrgUnit({
    ventureId: 'venture-holding-001',
    parentId: 'unit-holding-root',
    name: 'Shared HR Services',
    type: 'shared_service',
    metadata: {
      sharedWith: ['venture-abc-123', 'venture-xyz-456'],
      costAllocation: {
        'venture-abc-123': 60,
        'venture-xyz-456': 40,
      },
    },
  });

  // Consolidated view across ventures (holding company admin only)
  const consolidatedTree = await orgService.getConsolidatedTree({
    ventureIds: ['venture-abc-123', 'venture-xyz-456', 'venture-holding-001'],
    includeHeadcount: true,
    includeSharedServices: true,
  });

  console.log('Consolidated structure:');
  for (const root of consolidatedTree) {
    console.log(`  ${root.name} (${root.ventureId}): ${root.totalHeadcount} people`);
  }

  // Cross-venture position: person in Venture A, dotted-line to Venture B
  await orgService.createRelationship({
    ventureId: 'venture-abc-123',
    sourceType: 'employee',
    sourceId: 'emp-cross-venture-lead',
    targetType: 'position',
    targetId: 'pos-venture-b-advisor',
    relationshipType: 'dotted',
    label: 'Cross-venture advisory role',
    startDate: '2026-01-01',
    weight: 20,
  });

  // --- HRIS Sync ---

  // Configure sync with BambooHR
  const syncConfig = await syncService.configure({
    ventureId: 'venture-abc-123',
    provider: 'bamboohr',
    config: {
      apiUrl: 'https://api.bamboohr.com/api/gateway.php/acme/v1',
      apiKeyEnvVar: 'BAMBOOHR_API_KEY',
      syncDirection: 'bidirectional',
      conflictResolution: 'mcv_wins',
      syncSchedule: '0 2 * * *',  // 2 AM daily
      fieldMappings: {
        department: 'org_unit',
        division: 'org_unit_parent',
        jobTitle: 'position_title',
        reportsTo: 'reporting_line',
        location: 'location_id',
      },
    },
  });

  // Run manual sync
  const syncResult = await syncService.sync({
    ventureId: 'venture-abc-123',
    configId: syncConfig.id,
    dryRun: false,
  });

  console.log('Sync results:');
  console.log(`  Created: ${syncResult.created} units/positions`);
  console.log(`  Updated: ${syncResult.updated}`);
  console.log(`  Deleted: ${syncResult.deleted}`);
  console.log(`  Skipped: ${syncResult.skipped}`);
  console.log(`  Conflicts: ${syncResult.conflicts.length}`);

  // Handle conflicts
  for (const conflict of syncResult.conflicts) {
    console.log(`  Conflict on ${conflict.entityType} ${conflict.entityId}:`);
    console.log(`    MCV value: ${JSON.stringify(conflict.mcvValue)}`);
    console.log(`    HRIS value: ${JSON.stringify(conflict.hrisValue)}`);
    console.log(`    Resolution: ${conflict.resolution}`);
  }

  // Sync also provisions IAM based on position
  // When an employee changes org unit, their access groups update automatically
  // Event: 'org.position.filled' → IAM provisioning handler
  // Event: 'org.reporting.changed' → Approval chain update handler
}
```

---

## Error Codes

| Code | HTTP | Description |
|------|------|-------------|
| `ORG_UNIT_NOT_FOUND` | 404 | Org unit with the specified ID does not exist or is not accessible in the current venture. |
| `ORG_UNIT_SLUG_EXISTS` | 409 | An org unit with this slug already exists within the venture. |
| `ORG_UNIT_CIRCULAR_REFERENCE` | 400 | Moving this unit would create a circular reference in the hierarchy (unit cannot be its own ancestor). |
| `ORG_UNIT_MOVE_CROSS_VENTURE` | 400 | Cannot move an org unit to a parent in a different venture. Use cross-venture relationships instead. |
| `ORG_UNIT_HAS_ACTIVE_CHILDREN` | 400 | Cannot archive this unit because it has active child units. Archive or move children first. |
| `ORG_UNIT_HAS_FILLED_POSITIONS` | 400 | Cannot archive this unit because it has filled positions. Transfer or vacate positions first. |
| `ORG_UNIT_FROZEN` | 403 | This org unit is in a frozen state and cannot be modified. Unfreeze via admin action first. |
| `ORG_UNIT_MAX_DEPTH_EXCEEDED` | 400 | Moving or creating this unit would exceed the maximum configured org depth (`MAX_ORG_DEPTH`). |
| `POSITION_NOT_FOUND` | 404 | Position with the specified ID does not exist. |
| `POSITION_CODE_EXISTS` | 409 | A position with this code already exists within the venture. |
| `POSITION_ALREADY_FILLED` | 409 | This position is already filled to its maximum headcount. No open slots remain. |
| `POSITION_ELIMINATED` | 400 | Cannot assign to or modify an eliminated position. |
| `POSITION_FROZEN` | 403 | This position is frozen (budget freeze) and cannot be filled or modified. |
| `ASSIGNMENT_OVERLAP` | 409 | Employee already has an active primary assignment. End the current assignment first, or use 'secondary' type. |
| `ASSIGNMENT_NOT_FOUND` | 404 | Position assignment with the specified ID does not exist. |
| `ASSIGNMENT_INVALID_FTE` | 400 | Employee's total FTE across all assignments would exceed 100% (1.0 FTE). |
| `HEADCOUNT_PLAN_NOT_FOUND` | 404 | Headcount plan with the specified ID does not exist. |
| `HEADCOUNT_PLAN_LOCKED` | 403 | This plan is approved/active and cannot be modified. Create a new version or revision instead. |
| `HEADCOUNT_PERIOD_OVERLAP` | 409 | Plan entry period overlaps with an existing entry for the same org unit. |
| `RESTRUCTURING_NOT_FOUND` | 404 | Restructuring proposal with the specified ID does not exist. |
| `RESTRUCTURING_INVALID_STATUS` | 400 | This action is not valid for the current proposal status (e.g., cannot execute a draft proposal). |
| `RESTRUCTURING_APPROVAL_REQUIRED` | 403 | All required approvals must be granted before execution. |
| `RESTRUCTURING_ACTION_FAILED` | 500 | A restructuring action failed during execution. See `errorMessage` on the failed action for details. |
| `RESTRUCTURING_ROLLBACK_FAILED` | 500 | Attempted rollback of a failed restructuring also failed. Manual intervention required. |
| `JOB_FAMILY_NOT_FOUND` | 404 | Job family with the specified ID does not exist. |
| `CAREER_TRACK_NOT_FOUND` | 404 | Career track with the specified ID does not exist. |
| `GRADE_BAND_NOT_FOUND` | 404 | Grade band with the specified ID does not exist. |
| `GRADE_BAND_CODE_EXISTS` | 409 | A grade band with this code already exists within the venture. |
| `COMPETENCY_MODEL_NOT_FOUND` | 404 | Competency model with the specified ID does not exist. |
| `ORG_SYNC_CONFIG_INVALID` | 400 | The HRIS sync configuration is invalid. Check provider credentials and field mappings. |
| `ORG_SYNC_PROVIDER_ERROR` | 502 | External HRIS provider returned an error during sync. Check provider status and credentials. |
| `ORG_SYNC_CONFLICT_UNRESOLVED` | 409 | Sync completed with unresolved conflicts that require manual resolution. |
| `VENTURE_ACCESS_DENIED` | 403 | User does not have access to the specified venture's org structure. |
| `CROSS_VENTURE_NOT_ALLOWED` | 403 | Cross-venture operations require holding-company administrator privileges. |
| `EFFECTIVE_DATE_IN_PAST` | 400 | Effective date cannot be in the past for new changes. Use historical corrections for backdated adjustments. |
| `ORG_CHART_EXPORT_FAILED` | 500 | Failed to export org chart to the requested format. Chart may be too large for the selected format. |
| `ORG_ANALYTICS_TIMEOUT` | 504 | Analytics computation timed out. Try a smaller date range or fewer org units. |

---

## Security

### Row-Level Security (RLS)

All tables use Supabase RLS to enforce tenant isolation. The `venture_id` is set in the session context at the start of each request:

```sql
-- Set at request start by middleware
SET LOCAL app.current_venture_id = 'venture-abc-123';

-- RLS policy applied to every table
CREATE POLICY venture_isolation ON org_units
  USING (venture_id = current_setting('app.current_venture_id')::uuid)
  WITH CHECK (venture_id = current_setting('app.current_venture_id')::uuid);
```

### Permission Model

| Permission | Description | Default Roles |
|---|---|---|
| `org.unit.read` | View org units and hierarchy | All authenticated users |
| `org.unit.create` | Create new org units | HR Admin, Org Admin |
| `org.unit.update` | Modify org unit properties | HR Admin, Org Admin |
| `org.unit.archive` | Archive org units | HR Admin, Org Admin |
| `org.unit.move` | Move org units in hierarchy | Org Admin |
| `org.position.read` | View positions and assignments | All authenticated users |
| `org.position.create` | Create new positions | HR Admin, Hiring Manager |
| `org.position.assign` | Assign/unassign employees to positions | HR Admin |
| `org.position.eliminate` | Eliminate positions | Org Admin |
| `org.chart.read` | View org charts | All authenticated users |
| `org.chart.export` | Export org charts (PDF, SVG) | HR Admin, Manager |
| `org.headcount.read` | View headcount plans | HR Admin, Finance, Manager |
| `org.headcount.create` | Create/modify headcount plans | HR Admin, Finance |
| `org.headcount.approve` | Approve headcount plans | VP+, Finance Director |
| `org.restructuring.read` | View restructuring proposals | HR Admin, Org Admin |
| `org.restructuring.create` | Create proposals | HR Admin, Org Admin, VP+ |
| `org.restructuring.approve` | Approve restructuring proposals | C-Suite, HR Director |
| `org.restructuring.execute` | Execute approved proposals | Org Admin (system) |
| `org.job_arch.read` | View job families, career tracks | All authenticated users |
| `org.job_arch.manage` | Create/modify job architecture | HR Admin, Compensation |
| `org.analytics.read` | View org analytics | HR Admin, Manager, Finance |
| `org.analytics.sensitive` | View compensation and diversity data | HR Admin, C-Suite |
| `org.sync.manage` | Configure and run HRIS sync | Org Admin, IT Admin |
| `org.cross_venture` | Access cross-venture views | Holding company admin |

### Data Classification

| Data Category | Classification | Encryption | Access |
|---|---|---|---|
| Org unit names/hierarchy | Internal | At rest | All authenticated |
| Position titles & codes | Internal | At rest | All authenticated |
| Compensation ranges | Confidential | At rest + in transit | HR Admin, Compensation |
| Employee assignments | Confidential | At rest + in transit | HR Admin, Direct manager |
| Restructuring proposals | Highly Confidential | At rest + in transit | Named approvers only |
| Diversity metrics | Highly Confidential | At rest + in transit | HR Admin, C-Suite |
| HRIS sync credentials | Secret | Vault (env var) | System only |

### Audit Trail

Every mutation is recorded in `org_change_history` with:

- **Who** changed it (`changed_by`)
- **What** changed (`previous_state`, `new_state`)
- **When** (`changed_at`, `effective_date`)
- **Why** (`reason`, `proposal_id`)

Audit records are immutable and cannot be deleted except through regulatory data-purge workflows.

### Sensitive Operation Safeguards

- **Restructuring execution** requires all approval chain signatures before actions run.
- **Position elimination** triggers a 72-hour hold period before finalization (configurable).
- **Cross-venture access** is logged separately and reviewed in monthly access audits.
- **Bulk operations** (moving 10+ units, eliminating 5+ positions) require additional confirmation and are rate-limited.
- **Compensation data** is masked in API responses unless the caller has `org.analytics.sensitive`.

---

## Environment Variables

| Variable | Required | Default | Description |
|---|---|---|---|
| `DATABASE_URL` | Yes | — | Supabase PostgreSQL connection string. |
| `ORG_MAX_DEPTH` | No | `15` | Maximum allowed depth for org unit hierarchy. |
| `ORG_MAX_SPAN_WARNING` | No | `12` | Span of control threshold that triggers a warning. |
| `ORG_MAX_SPAN_CRITICAL` | No | `20` | Span of control threshold that triggers a critical alert. |
| `ORG_POSITION_ELIMINATION_HOLD_HOURS` | No | `72` | Hours to wait before finalizing a position elimination. |
| `ORG_RESTRUCTURING_MAX_ACTIONS` | No | `100` | Maximum number of actions in a single restructuring proposal. |
| `ORG_CHART_MAX_NODES` | No | `5000` | Maximum nodes rendered in a single org chart export. |
| `ORG_CHART_EXPORT_TIMEOUT_MS` | No | `30000` | Timeout for org chart PDF/SVG export operations. |
| `ORG_ANALYTICS_TIMEOUT_MS` | No | `60000` | Timeout for analytics computation queries. |
| `ORG_ANALYTICS_CACHE_TTL_S` | No | `300` | Cache TTL for analytics snapshots (seconds). |
| `ORG_SYNC_ENABLED` | No | `false` | Enable HRIS sync functionality. |
| `ORG_SYNC_SCHEDULE` | No | `0 2 * * *` | Default cron schedule for automated HRIS sync. |
| `ORG_SYNC_MAX_BATCH_SIZE` | No | `500` | Maximum records processed per sync batch. |
| `ORG_SYNC_CONFLICT_MODE` | No | `mcv_wins` | Default conflict resolution: `mcv_wins`, `hris_wins`, `manual`. |
| `BAMBOOHR_API_KEY` | No | — | BambooHR API key (if using BambooHR provider). |
| `WORKDAY_CLIENT_ID` | No | — | Workday integration client ID. |
| `WORKDAY_CLIENT_SECRET` | No | — | Workday integration client secret. |
| `ORG_EVENT_BUS_URL` | No | — | Event bus URL for publishing org domain events. |
| `ORG_EFFECTIVE_DATE_WORKER_ENABLED` | No | `true` | Enable the worker that applies future-dated changes. |
| `ORG_EFFECTIVE_DATE_WORKER_INTERVAL_MS` | No | `60000` | How often the effective-date worker checks for pending changes. |

---

## Dependencies

### Internal Dependencies

| Module | Relationship | Purpose |
|---|---|---|
| `@mcv/core/db` | Required | Drizzle ORM, database connection, migrations |
| `@mcv/core/auth` | Required | Authentication context, permission checks |
| `@mcv/core/rls` | Required | Row-level security middleware, venture context |
| `@mcv/core/events` | Required | Domain event bus for publishing org events |
| `@mcv/core/audit` | Required | Audit trail recording |
| `@mcv/core/trpc` | Required | tRPC router and procedure definitions |
| `@mcv/core/cache` | Optional | Caching for analytics and org tree queries |
| `@mcv/core/jobs` | Optional | Background job scheduling for sync and effective-date workers |
| `@mcv/core/storage` | Optional | Attachment storage for restructuring proposal documents |
| `@mcv/people/employee` | Peer | Employee records referenced by position assignments |
| `@mcv/people/identity` | Peer | IAM provisioning based on org position changes |
| `@mcv/finance/budget` | Peer | Budget alignment for headcount planning |
| `@mcv/finance/payroll` | Peer | Payroll structure alignment with positions |

### External Dependencies

| Package | Version | Purpose |
|---|---|---|
| `drizzle-orm` | `^0.30.0` | Type-safe ORM for PostgreSQL |
| `@trpc/server` | `^10.0.0` | tRPC server for API layer |
| `zod` | `^3.22.0` | Input validation for all tRPC procedures |
| `date-fns` | `^3.0.0` | Date manipulation for effective dating, periods |
| `slugify` | `^1.6.0` | Slug generation for org unit names |
| `nanoid` | `^5.0.0` | Short ID generation for position codes |

### PostgreSQL Extensions

| Extension | Purpose |
|---|---|
| `ltree` | Hierarchical queries on org unit paths |
| `uuid-ossp` | UUID generation for primary keys |
| `pg_trgm` | Trigram indexing for org unit name search |

---

## Testing

### Test Strategy

The module uses a layered testing approach:

1. **Unit tests** — Service logic, tree operations, validation
2. **Integration tests** — Database queries, RLS enforcement, ltree operations
3. **E2E tests** — Full tRPC procedure flows, restructuring workflows

### Running Tests

```bash
# All org module tests
pnpm test --filter=@mcv/people/org

# Unit tests only
pnpm test --filter=@mcv/people/org -- --grep "unit"

# Integration tests (requires database)
pnpm test:integration --filter=@mcv/people/org

# Specific test file
pnpm test --filter=@mcv/people/org -- org.service.test.ts
```

### Test Fixtures

```typescript
import { createTestContext } from '@mcv/core/testing';
import { OrgService, PositionService } from '@mcv/people/org';

describe('OrgService', () => {
  let ctx: TestContext;
  let orgService: OrgService;

  beforeEach(async () => {
    ctx = await createTestContext({
      modules: ['@mcv/people/org'],
      seed: 'org-test-seed',
    });
    orgService = ctx.get(OrgService);
  });

  afterEach(async () => {
    await ctx.cleanup();
  });

  describe('createOrgUnit', () => {
    it('creates a root unit with correct ltree path', async () => {
      const unit = await orgService.createOrgUnit({
        ventureId: ctx.ventureId,
        parentId: null,
        name: 'Test Company',
        type: 'company',
      });

      expect(unit.path).toBe('test_company');
      expect(unit.depth).toBe(0);
      expect(unit.parentId).toBeNull();
      expect(unit.status).toBe('active');
    });

    it('creates a child unit with parent path prefix', async () => {
      const parent = await orgService.createOrgUnit({
        ventureId: ctx.ventureId,
        parentId: null,
        name: 'Parent Co',
        type: 'company',
      });

      const child = await orgService.createOrgUnit({
        ventureId: ctx.ventureId,
        parentId: parent.id,
        name: 'Engineering',
        type: 'division',
      });

      expect(child.path).toBe('parent_co.engineering');
      expect(child.depth).toBe(1);
      expect(child.parentId).toBe(parent.id);
    });

    it('rejects duplicate slugs within a venture', async () => {
      await orgService.createOrgUnit({
        ventureId: ctx.ventureId,
        parentId: null,
        name: 'Engineering',
        type: 'division',
      });

      await expect(
        orgService.createOrgUnit({
          ventureId: ctx.ventureId,
          parentId: null,
          name: 'Engineering',
          type: 'division',
        }),
      ).rejects.toThrow('ORG_UNIT_SLUG_EXISTS');
    });
  });

  describe('moveOrgUnit', () => {
    it('updates ltree paths for unit and all descendants', async () => {
      const root = await createTestTree(orgService, ctx.ventureId);
      // root → eng → platform → backend

      const sales = await orgService.createOrgUnit({
        ventureId: ctx.ventureId,
        parentId: root.id,
        name: 'Sales',
        type: 'division',
      });

      // Move platform from engineering to sales
      await orgService.moveOrgUnit({
        unitId: root.children.eng.children.platform.id,
        newParentId: sales.id,
        reason: 'Reorg test',
      });

      const moved = await orgService.getOrgUnit(root.children.eng.children.platform.id);
      expect(moved.path).toContain('sales.platform');

      // Backend should also have updated path
      const backend = await orgService.getOrgUnit(
        root.children.eng.children.platform.children.backend.id,
      );
      expect(backend.path).toContain('sales.platform.backend');
    });

    it('prevents circular references', async () => {
      const root = await createTestTree(orgService, ctx.ventureId);
      // Try to move root under its own descendant
      await expect(
        orgService.moveOrgUnit({
          unitId: root.id,
          newParentId: root.children.eng.id,
          reason: 'Circular test',
        }),
      ).rejects.toThrow('ORG_UNIT_CIRCULAR_REFERENCE');
    });
  });

  describe('getOrgUnitTree', () => {
    it('returns complete tree with headcount', async () => {
      await createTestTree(orgService, ctx.ventureId);

      const tree = await orgService.getOrgUnitTree({
        ventureId: ctx.ventureId,
        includeHeadcount: true,
      });

      expect(tree).toHaveLength(1);
      expect(tree[0].children.length).toBeGreaterThan(0);
      expect(tree[0].totalHeadcount).toBeGreaterThanOrEqual(0);
    });

    it('respects maxDepth parameter', async () => {
      await createTestTree(orgService, ctx.ventureId);

      const shallow = await orgService.getOrgUnitTree({
        ventureId: ctx.ventureId,
        maxDepth: 1,
      });

      // Root children should have no children populated
      for (const child of shallow[0].children) {
        expect(child.children).toHaveLength(0);
      }
    });

    it('returns historical snapshot with asOfDate', async () => {
      await createTestTree(orgService, ctx.ventureId);

      // Get snapshot from before the tree existed
      const empty = await orgService.getOrgUnitTree({
        ventureId: ctx.ventureId,
        asOfDate: '2020-01-01',
      });
      expect(empty).toHaveLength(0);
    });
  });
});

describe('PositionService', () => {
  let ctx: TestContext;
  let positionService: PositionService;

  beforeEach(async () => {
    ctx = await createTestContext({ modules: ['@mcv/people/org'] });
    positionService = ctx.get(PositionService);
  });

  afterEach(() => ctx.cleanup());

  it('creates a position and assigns an employee', async () => {
    const position = await positionService.createPosition({
      ventureId: ctx.ventureId,
      orgUnitId: ctx.fixtures.orgUnit.id,
      title: 'Test Engineer',
      positionCode: 'TEST-001',
      positionType: 'permanent',
      headcount: 1,
      isManager: false,
      fte: 100,
    });
    expect(position.status).toBe('draft');

    // Open the position
    await positionService.updatePosition(position.id, { status: 'open' });

    // Assign
    const assignment = await positionService.assignEmployee({
      positionId: position.id,
      employeeId: ctx.fixtures.employee.id,
      ventureId: ctx.ventureId,
      assignmentType: 'primary',
      startDate: '2026-02-10',
      fte: 100,
    });
    expect(assignment.status).toBe('active');

    // Position should now be filled
    const updated = await positionService.getPosition(position.id);
    expect(updated.status).toBe('filled');
  });

  it('prevents overlapping primary assignments', async () => {
    const pos1 = await createTestPosition(positionService, ctx);
    const pos2 = await createTestPosition(positionService, ctx, 'TEST-002');

    await positionService.assignEmployee({
      positionId: pos1.id,
      employeeId: ctx.fixtures.employee.id,
      ventureId: ctx.ventureId,
      assignmentType: 'primary',
      startDate: '2026-02-10',
      fte: 100,
    });

    // Second primary assignment should fail
    await expect(
      positionService.assignEmployee({
        positionId: pos2.id,
        employeeId: ctx.fixtures.employee.id,
        ventureId: ctx.ventureId,
        assignmentType: 'primary',
        startDate: '2026-02-10',
        fte: 100,
      }),
    ).rejects.toThrow('ASSIGNMENT_OVERLAP');
  });

  it('allows secondary assignments alongside primary', async () => {
    const pos1 = await createTestPosition(positionService, ctx);
    const pos2 = await createTestPosition(positionService, ctx, 'TEST-002');

    await positionService.assignEmployee({
      positionId: pos1.id,
      employeeId: ctx.fixtures.employee.id,
      ventureId: ctx.ventureId,
      assignmentType: 'primary',
      startDate: '2026-02-10',
      fte: 80,
    });

    const secondary = await positionService.assignEmployee({
      positionId: pos2.id,
      employeeId: ctx.fixtures.employee.id,
      ventureId: ctx.ventureId,
      assignmentType: 'secondary',
      startDate: '2026-02-10',
      fte: 20,
    });
    expect(secondary.status).toBe('active');
  });
});

describe('RestructuringService', () => {
  let ctx: TestContext;
  let restructService: RestructuringService;

  beforeEach(async () => {
    ctx = await createTestContext({ modules: ['@mcv/people/org'] });
    restructService = ctx.get(RestructuringService);
  });

  afterEach(() => ctx.cleanup());

  it('full proposal lifecycle: draft → submit → approve → execute', async () => {
    const proposal = await restructService.createProposal({
      ventureId: ctx.ventureId,
      title: 'Test Reorg',
      description: 'Test restructuring',
      rationale: 'Testing',
      proposedEffectiveDate: '2026-04-01',
    });
    expect(proposal.status).toBe('draft');

    await restructService.addAction({
      proposalId: proposal.id,
      actionType: 'rename_unit',
      sequenceOrder: 1,
      subjectType: 'org_unit',
      subjectId: ctx.fixtures.orgUnit.id,
      parameters: { newName: 'Renamed Unit' },
    });

    // Submit
    await restructService.submit(proposal.id);
    const submitted = await restructService.getProposal(proposal.id);
    expect(submitted.status).toBe('submitted');

    // Approve
    await restructService.approve({
      proposalId: proposal.id,
      approverId: ctx.fixtures.adminUser.id,
      comments: 'Approved for testing',
    });

    // Execute
    const result = await restructService.execute(proposal.id);
    expect(result.executedActions).toHaveLength(1);
    expect(result.executedActions[0].status).toBe('completed');

    // Verify the rename happened
    const unit = await ctx.get(OrgService).getOrgUnit(ctx.fixtures.orgUnit.id);
    expect(unit.name).toBe('Renamed Unit');
  });

  it('rejects execution without required approvals', async () => {
    const proposal = await restructService.createProposal({
      ventureId: ctx.ventureId,
      title: 'Unapproved Reorg',
      description: 'Should fail',
      rationale: 'Testing',
      proposedEffectiveDate: '2026-04-01',
    });

    await restructService.submit(proposal.id);

    await expect(
      restructService.execute(proposal.id),
    ).rejects.toThrow('RESTRUCTURING_APPROVAL_REQUIRED');
  });

  it('computes impact analysis correctly', async () => {
    const proposal = await restructService.createProposal({
      ventureId: ctx.ventureId,
      title: 'Impact Test',
      description: 'Test impact analysis',
      rationale: 'Testing',
      proposedEffectiveDate: '2026-04-01',
    });

    await restructService.addAction({
      proposalId: proposal.id,
      actionType: 'eliminate_position',
      sequenceOrder: 1,
      subjectType: 'position',
      subjectId: ctx.fixtures.position.id,
      parameters: {},
    });

    const impact = await restructService.analyzeImpact(proposal.id);
    expect(impact.positionsEliminated).toBe(1);
    expect(impact.affectedEmployeeCount).toBeGreaterThanOrEqual(0);
    expect(impact.riskLevel).toBeDefined();
  });
});

describe('RLS Enforcement', () => {
  it('prevents cross-venture org unit access', async () => {
    const ctxA = await createTestContext({ ventureId: 'venture-a' });
    const ctxB = await createTestContext({ ventureId: 'venture-b' });

    const unitA = await ctxA.get(OrgService).createOrgUnit({
      ventureId: 'venture-a',
      parentId: null,
      name: 'Venture A Unit',
      type: 'company',
    });

    // Venture B should not see Venture A's units
    await expect(
      ctxB.get(OrgService).getOrgUnit(unitA.id),
    ).rejects.toThrow('ORG_UNIT_NOT_FOUND');

    await ctxA.cleanup();
    await ctxB.cleanup();
  });
});
```

### Test Coverage Targets

| Area | Target | Notes |
|---|---|---|
| OrgService (CRUD) | 95% | Core operations, tree manipulation |
| OrgService (move/merge/split) | 90% | Complex operations with edge cases |
| PositionService | 90% | Assignments, vacancies, FTE validation |
| OrgChartService | 85% | Chart generation, export, filtering |
| HeadcountService | 90% | Plans, entries, scenarios, variance |
| RestructuringService | 95% | Critical workflow — full lifecycle |
| JobArchitectureService | 85% | Families, tracks, levels, transitions |
| OrgAnalyticsService | 80% | Metrics computation, caching |
| OrgSyncService | 85% | Provider integration, conflict handling |
| RLS enforcement | 100% | Every table must have cross-venture isolation test |
| ltree operations | 95% | Path computation, ancestor/descendant queries |

---

*Last updated: 2026-02-09 — @mcv/people/org v0.9.0*