# @mcv/finance/budgeting

> **Tier 5 Domain Module — Publishable**
>
> Budget planning, tracking, forecasting, and variance analysis at venture, department, and project level.

---

## Table of Contents

1. [Purpose](#purpose)
2. [Exports](#exports)
3. [Architecture](#architecture)
4. [Core Interfaces](#core-interfaces)
5. [Database Schema](#database-schema)
6. [Budget Creation](#budget-creation)
7. [Budget Line Items](#budget-line-items)
8. [Forecasting](#forecasting)
9. [Variance Tracking](#variance-tracking)
10. [Approval Workflows](#approval-workflows)
11. [Budget Transfers](#budget-transfers)
12. [Scenario Planning](#scenario-planning)
13. [Capital Budgeting](#capital-budgeting)
14. [Budget Alerts](#budget-alerts)
15. [Consolidation](#consolidation)
16. [Code Examples](#code-examples)
17. [Error Codes](#error-codes)
18. [Security](#security)
19. [Environment Variables](#environment-variables)
20. [Dependencies](#dependencies)
21. [Testing](#testing)
22. [Changelog](#changelog)

---

## Purpose

The `@mcv/finance/budgeting` module provides comprehensive budget lifecycle management across the MCV platform. It enables ventures, departments, and projects to create, approve, track, and forecast budgets with full audit trails and multi-level governance.

### What This Module Does

- **Creates and manages budgets** at three organizational tiers: venture, department, and project
- **Supports top-down and bottom-up** budgeting methodologies with configurable templates
- **Tracks budget vs actual** spending in real time with automated variance alerts
- **Provides rolling forecasts** that adapt to actuals as they flow in from `@mcv/finance/ledger`
- **Enforces approval workflows** with configurable multi-level chains (manager → director → VP → CFO)
- **Enables scenario planning** with optimistic, base, and conservative budget versions
- **Handles capital budgeting** with ROI analysis, depreciation schedules, and CapEx tracking
- **Consolidates budgets** from department → venture → consortium with elimination entries
- **Feeds downstream** into `@mcv/treasury/pnl` for profit-and-loss reporting and cash flow planning

### Design Principles

1. **Hierarchical by default** — Every budget line item maps to the chart of accounts; budgets roll up through organizational hierarchy
2. **Period-aware** — All amounts are bucketed by period (monthly or quarterly) with annual totals computed, never stored
3. **Immutable history** — Budget versions are never overwritten; amendments create new versions with full diff tracking
4. **Multi-currency** — Budgets can be denominated in any currency; consolidation handles FX translation
5. **Event-driven** — Budget state changes emit domain events consumed by alerts, PnL, and audit systems

---

## Exports

```typescript
// Main service
export { BudgetService } from './services/budget.service';
export { ForecastService } from './services/forecast.service';
export { VarianceService } from './services/variance.service';
export { ScenarioService } from './services/scenario.service';
export { ConsolidationService } from './services/consolidation.service';
export { CapitalBudgetService } from './services/capital-budget.service';
export { BudgetAlertService } from './services/budget-alert.service';
export { BudgetTransferService } from './services/budget-transfer.service';
export { BudgetApprovalService } from './services/budget-approval.service';

// tRPC Router
export { budgetRouter } from './router';

// Types
export type {
  Budget,
  BudgetLine,
  BudgetLineItem,
  BudgetPeriod,
  BudgetVersion,
  BudgetStatus,
  BudgetType,
  BudgetMethodology,
  Forecast,
  ForecastEntry,
  ForecastMethod,
  Scenario,
  ScenarioComparison,
  VarianceReport,
  VarianceEntry,
  VarianceAlert,
  BudgetTransfer,
  BudgetApproval,
  ApprovalChain,
  ApprovalStep,
  CapitalBudget,
  CapExItem,
  DepreciationSchedule,
  ConsolidatedBudget,
  BudgetTemplate,
  BudgetAlertRule,
  BudgetAlertThreshold,
} from './types';

// Enums
export {
  BudgetStatusEnum,
  BudgetTypeEnum,
  BudgetMethodologyEnum,
  PeriodGranularity,
  ApprovalStatusEnum,
  ForecastMethodEnum,
  ScenarioTypeEnum,
  AlertSeverityEnum,
  TransferStatusEnum,
  DepreciationMethodEnum,
  ConsolidationStatusEnum,
} from './enums';

// Events
export {
  BudgetCreatedEvent,
  BudgetApprovedEvent,
  BudgetRejectedEvent,
  BudgetAmendedEvent,
  BudgetLockedEvent,
  ForecastUpdatedEvent,
  VarianceThresholdBreachedEvent,
  BudgetTransferRequestedEvent,
  BudgetTransferApprovedEvent,
  BudgetConsolidatedEvent,
  CapExApprovedEvent,
} from './events';

// Validators
export {
  createBudgetSchema,
  updateBudgetLineSchema,
  forecastEntrySchema,
  scenarioSchema,
  transferRequestSchema,
  approvalActionSchema,
  alertRuleSchema,
  capExItemSchema,
  consolidationRequestSchema,
} from './validators';

// Hooks (React)
export { useBudget } from './hooks/useBudget';
export { useBudgetLines } from './hooks/useBudgetLines';
export { useForecast } from './hooks/useForecast';
export { useVariance } from './hooks/useVariance';
export { useScenarios } from './hooks/useScenarios';
export { useBudgetAlerts } from './hooks/useBudgetAlerts';
export { useConsolidation } from './hooks/useConsolidation';
```

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                      @mcv/finance/budgeting                         │
│                                                                     │
│  ┌───────────────────────────────────────────────────────────────┐  │
│  │                       tRPC Router                             │  │
│  │  budget.create  budget.approve  forecast.update  scenario.*   │  │
│  │  variance.get   transfer.request  alert.configure  consol.*   │  │
│  └────────┬──────────────────────────────────────────┬───────────┘  │
│           │                                          │              │
│  ┌────────▼────────┐  ┌──────────────┐  ┌───────────▼──────────┐   │
│  │  BudgetService  │  │ ForecastSvc  │  │  VarianceService     │   │
│  │  - create()     │  │ - generate() │  │  - compute()         │   │
│  │  - amend()      │  │ - rolling()  │  │  - alerts()          │   │
│  │  - lock()       │  │ - whatIf()   │  │  - drillDown()       │   │
│  │  - copyForward()│  │ - reforecast │  │  - report()          │   │
│  └────────┬────────┘  └──────┬───────┘  └───────────┬──────────┘   │
│           │                  │                       │              │
│  ┌────────▼────────┐  ┌─────▼────────┐  ┌──────────▼──────────┐   │
│  │ ApprovalService │  │ ScenarioSvc  │  │   AlertService      │   │
│  │  - submit()     │  │ - create()   │  │  - evaluate()       │   │
│  │  - approve()    │  │ - compare()  │  │  - notify()         │   │
│  │  - reject()     │  │ - merge()    │  │  - configure()      │   │
│  └────────┬────────┘  └─────┬────────┘  └──────────┬──────────┘   │
│           │                  │                       │              │
│  ┌────────▼────────┐  ┌─────▼────────┐  ┌──────────▼──────────┐   │
│  │ TransferService │  │ CapitalSvc   │  │ ConsolidationSvc    │   │
│  │  - request()    │  │ - propose()  │  │  - rollUp()         │   │
│  │  - approve()    │  │ - evaluate() │  │  - eliminate()      │   │
│  │  - execute()    │  │ - depreciate │  │  - translate()      │   │
│  └────────┬────────┘  └─────┬────────┘  └──────────┬──────────┘   │
│           │                  │                       │              │
│  ┌────────▼──────────────────▼───────────────────────▼──────────┐   │
│  │                    Data Access Layer                          │   │
│  │  BudgetRepo │ LineItemRepo │ ForecastRepo │ ScenarioRepo    │   │
│  │  ApprovalRepo │ TransferRepo │ CapExRepo │ ConsolidationRepo│   │
│  └────────┬─────────────────────────────────────────────────────┘   │
└───────────┼─────────────────────────────────────────────────────────┘
            │
            ▼
┌───────────────────────┐  ┌────────────────────┐  ┌─────────────────┐
│  Supabase PostgreSQL  │  │ @mcv/finance/ledger│  │ @mcv/treasury/  │
│                       │  │  (actuals feed)    │  │      pnl        │
│  budget_budgets       │  └────────────────────┘  │  (downstream)   │
│  budget_line_items    │                          └─────────────────┘
│  budget_versions      │  ┌────────────────────┐
│  budget_forecasts     │  │ @mcv/finance/      │  ┌─────────────────┐
│  budget_scenarios     │  │  chart-of-accounts │  │ @mcv/iam        │
│  budget_approvals     │  │  (account mapping) │  │  (permissions)  │
│  budget_transfers     │  └────────────────────┘  └─────────────────┘
│  budget_alerts        │
│  budget_capex         │  ┌────────────────────┐
│  budget_consolidations│  │ @mcv/notifications │
│  budget_templates     │  │  (alert delivery)  │
└───────────────────────┘  └────────────────────┘
```

### Data Flow

```
                    ┌──────────────┐
                    │  Chart of    │
                    │  Accounts    │
                    └──────┬───────┘
                           │ account structure
                           ▼
┌───────────┐    ┌─────────────────┐    ┌──────────────┐
│ Templates │───▶│  Budget Created │───▶│  Line Items  │
│ / Prior   │    │  (Draft)        │    │  Populated   │
│ Period    │    └────────┬────────┘    └──────┬───────┘
└───────────┘             │                    │
                          │ submit             │ amounts entered
                          ▼                    ▼
                 ┌─────────────────┐   ┌─────────────────┐
                 │ Approval Chain  │   │ Period Amounts   │
                 │ (Multi-level)   │   │ (Monthly / Qtr)  │
                 └────────┬────────┘   └─────────────────┘
                          │ approved
                          ▼
              ┌───────────────────────┐
              │  Budget Active/Locked │
              └───────────┬───────────┘
                          │
              ┌───────────┼──────────────┐
              │           │              │
              ▼           ▼              ▼
     ┌──────────┐  ┌──────────┐  ┌────────────┐
     │ Forecast │  │ Variance │  │ Consolidate│
     │ Rolling  │  │ Tracking │  │ Roll-up    │
     └────┬─────┘  └────┬─────┘  └─────┬──────┘
          │             │               │
          ▼             ▼               ▼
     ┌──────────────────────────────────────┐
     │         @mcv/treasury/pnl            │
     │   Budget vs Actual vs Forecast       │
     └──────────────────────────────────────┘
```

### Event Flow

```
BudgetService ──▶ BudgetCreatedEvent ──▶ AlertService (setup defaults)
                                       ──▶ AuditService (log)

ApprovalService ──▶ BudgetApprovedEvent ──▶ BudgetService (activate)
                                          ──▶ PnLService (register)
                                          ──▶ NotificationService

VarianceService ──▶ VarianceThresholdBreachedEvent
                    ──▶ AlertService (notify stakeholders)
                    ──▶ AuditService (log breach)

TransferService ──▶ BudgetTransferApprovedEvent
                    ──▶ BudgetService (update line items)
                    ──▶ AuditService (log transfer)

ConsolidationService ──▶ BudgetConsolidatedEvent
                         ──▶ PnLService (consolidated view)
                         ──▶ TreasuryService (cash planning)
```

---

## Core Interfaces

### BudgetService

```typescript
/**
 * BudgetService — manages the complete budget lifecycle from creation
 * through approval, activation, amendment, and archival.
 */
export interface BudgetService {
  /** Create a new budget in DRAFT status. */
  create(input: CreateBudgetInput): Promise<Budget>;

  /** Copy structure and optionally amounts from a prior period. */
  copyForward(input: CopyForwardInput): Promise<Budget>;

  /** Instantiate a budget from a saved template. */
  createFromTemplate(templateId: string, input: CreateBudgetInput): Promise<Budget>;

  /** Get a budget by ID with optional relation includes. */
  getById(budgetId: string, includes?: BudgetIncludes): Promise<Budget | null>;

  /** List budgets for an entity with filtering and pagination. */
  list(input: ListBudgetsInput): Promise<PaginatedResult<Budget>>;

  /** Get the active budget for an entity and fiscal period. */
  getActive(entityId: string, entityType: BudgetEntityType, fiscalPeriod: string): Promise<Budget | null>;

  /** Get version history for a budget. */
  getVersionHistory(budgetId: string): Promise<BudgetVersion[]>;

  /** Submit a draft budget for approval. Validates completeness first. */
  submit(budgetId: string, submittedBy: string): Promise<Budget>;

  /** Lock an approved budget — only locked budgets feed into PnL. */
  lock(budgetId: string, lockedBy: string): Promise<Budget>;

  /** Unlock a locked budget for amendments (requires CFO role). */
  unlock(budgetId: string, unlockedBy: string, reason: string): Promise<Budget>;

  /** Create an amendment version; snapshots current state. */
  amend(budgetId: string, amendedBy: string, reason: string): Promise<BudgetVersion>;

  /** Archive a budget (read-only, excluded from active queries). */
  archive(budgetId: string, archivedBy: string): Promise<Budget>;

  /** Save the current line-item structure as a reusable template. */
  saveAsTemplate(budgetId: string, name: string, desc?: string): Promise<BudgetTemplate>;

  /** List templates available for an entity type. */
  listTemplates(entityType: BudgetEntityType): Promise<BudgetTemplate[]>;

  /** Bulk-adjust line items by percentage or absolute amount. */
  bulkAdjustLineItems(budgetId: string, input: BulkAdjustInput): Promise<BudgetLine[]>;

  /** Distribute an annual amount across periods using a pattern. */
  distributeAmount(lineItemId: string, input: DistributeInput): Promise<BudgetPeriodAmount[]>;
}
```

### Budget

```typescript
/**
 * Budget — the top-level budget entity containing metadata,
 * lifecycle status, and references to line items and approval chains.
 */
export interface Budget {
  id: string;                          // ULID
  ventureId: string;                   // owning venture
  entityId: string;                    // venture, department, or project ID
  entityType: BudgetEntityType;        // 'venture' | 'department' | 'project'
  name: string;                        // e.g. "Engineering Q1 2026"
  description: string | null;
  fiscalYear: string;                  // e.g. "2026"
  fiscalPeriod: string;                // e.g. "2026-Q1", "2026", "2026-01"
  granularity: PeriodGranularity;      // 'monthly' | 'quarterly' | 'annual'
  methodology: BudgetMethodology;      // 'top_down' | 'bottom_up' | 'hybrid' | 'zero_based'
  currency: string;                    // ISO 4217
  status: BudgetStatus;
  version: number;                     // increments with amendments
  totalAmount: number;                 // computed: sum of line items
  totalActual: number;                 // computed: from ledger
  totalCommitted: number;              // computed: POs, contracts
  totalRemaining: number;              // computed: total - actual - committed
  percentConsumed: number;             // computed: (actual+committed)/total*100
  lineItems?: BudgetLine[];           // included when requested
  approvalChainId: string | null;
  approvalStatus: ApprovalStatus | null;
  scenarioId: string | null;           // null = primary/base budget
  parentBudgetId: string | null;       // for consolidated budgets
  templateId: string | null;
  sourceBudgetId: string | null;       // copy-forward source
  tags: string[];
  createdBy: string;
  updatedBy: string;
  createdAt: Date;
  updatedAt: Date;
  lockedAt: Date | null;
  lockedBy: string | null;
  deletedAt: Date | null;
}

export type BudgetEntityType = 'venture' | 'department' | 'project';

export type BudgetStatus =
  | 'draft'
  | 'pending_approval'
  | 'approved'
  | 'active'
  | 'locked'
  | 'amendment_draft'
  | 'archived';

export type BudgetMethodology = 'top_down' | 'bottom_up' | 'hybrid' | 'zero_based';
export type PeriodGranularity = 'monthly' | 'quarterly' | 'annual';
export type ApprovalStatus = 'pending' | 'approved' | 'rejected' | 'escalated';
```

### BudgetLine

```typescript
/**
 * BudgetLine — a single line item within a budget, mapped to a
 * chart-of-accounts entry with period-level amount breakdowns.
 */
export interface BudgetLine {
  id: string;
  budgetId: string;
  accountId: string;
  accountCode: string;            // denormalized, e.g. "6100"
  accountName: string;            // denormalized, e.g. "Software Subscriptions"
  parentLineId: string | null;    // null = top-level
  sortOrder: number;
  depth: number;                  // 0 = category, 1 = sub-category, etc.
  isSummary: boolean;             // true = rollup row, false = input row
  description: string | null;
  periods: BudgetPeriodAmount[];
  annualTotal: number;            // computed: sum of period amounts
  actualToDate: number;           // computed: from ledger
  committedToDate: number;        // computed: from POs
  remaining: number;              // computed
  variance: number;               // computed: actual - budget for elapsed periods
  variancePercent: number;        // computed
  children?: BudgetLine[];
  tags: string[];
  metadata: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

export interface BudgetPeriodAmount {
  period: string;                  // e.g. "2026-01", "2026-Q1"
  startDate: Date;
  endDate: Date;
  budgetAmount: number;
  actualAmount: number;            // computed from ledger
  committedAmount: number;         // computed from POs
  forecastAmount: number | null;
  notes: string | null;
  isLocked: boolean;               // past periods auto-lock
}
```

### Forecast

```typescript
/**
 * Forecast — a forward-looking projection that can diverge from
 * the original budget based on actuals, trends, and manual adjustments.
 */
export interface Forecast {
  id: string;
  budgetId: string;
  name: string;                    // e.g. "Q2 Reforecast"
  description: string | null;
  method: ForecastMethod;
  entries: ForecastEntry[];
  totalForecast: number;           // computed
  varianceFromBudget: number;      // computed
  variancePercent: number;         // computed
  asOfDate: Date;                  // actuals locked up to this date
  forwardPeriods: number;
  isCurrent: boolean;
  version: number;
  assumptions: ForecastAssumption[];
  createdBy: string;
  updatedBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ForecastEntry {
  forecastId: string;
  lineItemId: string;
  period: string;
  budgetAmount: number;
  actualAmount: number | null;      // for elapsed periods
  forecastAmount: number;
  method: ForecastMethod;
  confidence: number;               // 0-1
  notes: string | null;
  isManualOverride: boolean;
}

export interface ForecastAssumption {
  category: string;                 // e.g. "headcount", "pricing"
  description: string;
  impact: string;
  risk: 'low' | 'medium' | 'high';
}

export type ForecastMethod =
  | 'straight_line'
  | 'trend_linear'
  | 'trend_exponential'
  | 'seasonal'
  | 'manual'
  | 'driver_based'
  | 'hybrid';
```

### ForecastService

```typescript
export interface ForecastService {
  /** Generate a new forecast from a budget using the specified method. */
  generate(budgetId: string, input: GenerateForecastInput): Promise<Forecast>;

  /** Generate a rolling N-period forecast extending beyond budget period. */
  rolling(budgetId: string, periods: number, method: ForecastMethod): Promise<Forecast>;

  /** What-if analysis: apply hypothetical adjustments to see forecast impact. */
  whatIf(forecastId: string, adjustments: WhatIfAdjustment[]): Promise<Forecast>;

  /** Incorporate latest actuals and re-project remaining periods. */
  reforecast(forecastId: string): Promise<Forecast>;

  /** Three-way comparison: forecast vs budget vs actual. */
  getComparison(budgetId: string): Promise<ForecastComparison>;

  /** List all forecasts for a budget. */
  list(budgetId: string): Promise<Forecast[]>;

  /** Mark a forecast as the current active one. */
  setCurrent(forecastId: string): Promise<Forecast>;

  /** Delete a non-current forecast. */
  delete(forecastId: string): Promise<void>;
}

export interface WhatIfAdjustment {
  type: 'percentage' | 'absolute' | 'driver';
  target: string;          // line item ID, account category, or 'all'
  value: number;
  periods: string | string[];
  description: string;
}

export interface ForecastComparison {
  budgetId: string;
  periods: ForecastComparisonPeriod[];
  totals: {
    budget: number;
    forecast: number;
    actual: number;
    budgetVariance: number;
    forecastVariance: number;
  };
}

export interface ForecastComparisonPeriod {
  period: string;
  budget: number;
  forecast: number;
  actual: number;
  budgetVariance: number;
  budgetVariancePercent: number;
  forecastVariance: number;
  forecastVariancePercent: number;
  isElapsed: boolean;
}
```

### Scenario & ScenarioService

```typescript
export interface Scenario {
  id: string;
  ventureId: string;
  entityId: string;
  entityType: BudgetEntityType;
  fiscalPeriod: string;
  name: string;                    // e.g. "Optimistic"
  type: ScenarioType;
  description: string | null;
  assumptions: ScenarioAssumption[];
  probability: number;             // 0-1, for weighted average
  isActive: boolean;
  isBaseline: boolean;
  budgetId: string;
  color: string;                   // hex for UI
  totalAmount: number;             // computed
  varianceFromBaseline: number;    // computed
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export type ScenarioType =
  | 'optimistic' | 'base' | 'conservative'
  | 'best_case' | 'worst_case' | 'stretch' | 'custom';

export interface ScenarioAssumption {
  driver: string;
  value: string;
  baselineValue: string;
  notes: string | null;
}

export interface ScenarioComparison {
  scenarios: Scenario[];
  baselineId: string;
  lineComparisons: ScenarioLineComparison[];
  totals: Record<string, { total: number; varianceFromBaseline: number; variancePercent: number }>;
  weightedAverage: number;
}

export interface ScenarioLineComparison {
  accountId: string;
  accountName: string;
  amounts: Record<string, number>;
  variances: Record<string, number>;
}

export interface ScenarioService {
  create(input: CreateScenarioInput): Promise<Scenario>;
  clone(scenarioId: string, name: string, adjustments?: ScenarioAdjustment[]): Promise<Scenario>;
  compare(scenarioIds: string[]): Promise<ScenarioComparison>;
  merge(scenarioId: string, mergedBy: string): Promise<Budget>;
  updateAssumptions(scenarioId: string, assumptions: ScenarioAssumption[]): Promise<Scenario>;
  weightedAverage(scenarioIds: string[]): Promise<WeightedAverageResult>;
  list(entityId: string, fiscalPeriod: string): Promise<Scenario[]>;
  delete(scenarioId: string): Promise<void>;
}
```

### VarianceReport & VarianceService

```typescript
export interface VarianceReport {
  id: string;
  budgetId: string;
  generatedAt: Date;
  reportingPeriod: string;
  includeForecast: boolean;
  summary: VarianceSummary;
  entries: VarianceEntry[];
  topVariances: VarianceEntry[];
  trends: VarianceTrend[];
  activeAlerts: VarianceAlert[];
}

export interface VarianceSummary {
  totalBudget: number;
  totalActual: number;
  totalCommitted: number;
  totalVariance: number;
  variancePercent: number;
  totalForecast: number | null;
  forecastVariance: number | null;
  overBudgetCount: number;
  alertCount: number;
  utilizationPercent: number;
}

export interface VarianceEntry {
  lineItemId: string;
  accountCode: string;
  accountName: string;
  budgetAmount: number;
  actualAmount: number;
  committedAmount: number;
  variance: number;
  variancePercent: number;
  forecastAmount: number | null;
  forecastVariance: number | null;
  isOverBudget: boolean;
  alertSeverity: AlertSeverity | null;
  explanation: string | null;
  transactions?: VarianceTransaction[];
}

export interface VarianceTransaction {
  transactionId: string;
  date: Date;
  description: string;
  amount: number;
  vendor: string | null;
  reference: string | null;
}

export interface VarianceTrend {
  period: string;
  budget: number;
  actual: number;
  cumulativeBudget: number;
  cumulativeActual: number;
  cumulativeVariance: number;
  trend: 'improving' | 'worsening' | 'stable';
}

export type AlertSeverity = 'info' | 'warning' | 'critical' | 'breach';

export interface VarianceService {
  compute(budgetId: string, options?: VarianceReportOptions): Promise<VarianceReport>;
  drillDown(lineItemId: string, period?: string): Promise<VarianceEntry>;
  trend(budgetId: string, periods?: number): Promise<VarianceTrend[]>;
  activeAlerts(budgetId: string): Promise<VarianceAlert[]>;
  explain(lineItemId: string, period: string, explanation: string, by: string): Promise<void>;
  evaluateAlerts(budgetId: string): Promise<VarianceAlert[]>;
  history(budgetId: string, limit?: number): Promise<VarianceReport[]>;
}

export interface VarianceReportOptions {
  period?: string;
  includeYTD?: boolean;
  includeForecast?: boolean;
  includeTransactions?: boolean;
  minVarianceThreshold?: number;
  overBudgetOnly?: boolean;
  sortBy?: 'variance_abs' | 'variance_pct' | 'account_code';
}
```

### ApprovalChain & BudgetApprovalService

```typescript
export interface ApprovalChain {
  id: string;
  ventureId: string;
  name: string;
  entityType: BudgetEntityType;
  minAmount: number | null;
  maxAmount: number | null;
  steps: ApprovalStep[];
  mode: 'sequential' | 'parallel' | 'highest_authority';
  autoApproveHours: number | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ApprovalStep {
  order: number;
  name: string;                    // e.g. "Manager Review"
  role: string;
  userId: string | null;           // specific user or null for any with role
  minAmount: number | null;        // threshold to trigger this step
  canSkip: boolean;
  status?: ApprovalStepStatus;
  actionedBy?: string;
  actionedAt?: Date;
  comments?: string;
}

export type ApprovalStepStatus = 'pending' | 'approved' | 'rejected' | 'skipped' | 'escalated';

export interface BudgetApproval {
  id: string;
  budgetId: string;
  chainId: string;
  currentStep: number;
  status: ApprovalStatus;
  submittedBy: string;
  submittedAt: Date;
  completedAt: Date | null;
  stepHistory: ApprovalStepHistory[];
  budgetSnapshot: Record<string, unknown>;
}

export interface ApprovalStepHistory {
  step: number;
  stepName: string;
  action: 'approved' | 'rejected' | 'escalated' | 'auto_approved';
  actionedBy: string;
  actionedAt: Date;
  comments: string | null;
}

export interface BudgetApprovalService {
  submit(budgetId: string, submittedBy: string): Promise<BudgetApproval>;
  approve(approvalId: string, approvedBy: string, comments?: string): Promise<BudgetApproval>;
  reject(approvalId: string, rejectedBy: string, comments: string): Promise<BudgetApproval>;
  escalate(approvalId: string, escalatedBy: string, reason: string): Promise<BudgetApproval>;
  recall(approvalId: string, recalledBy: string): Promise<BudgetApproval>;
  getStatus(budgetId: string): Promise<BudgetApproval | null>;
  getPendingForUser(userId: string): Promise<BudgetApproval[]>;
  configureChain(input: ConfigureChainInput): Promise<ApprovalChain>;
  listChains(ventureId: string): Promise<ApprovalChain[]>;
  processAutoApprovals(): Promise<number>;
}
```

### BudgetTransfer & TransferService

```typescript
export interface BudgetTransfer {
  id: string;
  budgetId: string;
  fromLineItemId: string;
  fromAccountCode: string;
  fromAccountName: string;
  toLineItemId: string;
  toAccountCode: string;
  toAccountName: string;
  amount: number;
  period: string | null;
  reason: string;
  status: TransferStatus;
  requestedBy: string;
  requestedAt: Date;
  actionedBy: string | null;
  actionedAt: Date | null;
  comments: string | null;
  isReversed: boolean;
  reversalId: string | null;
}

export type TransferStatus = 'pending' | 'approved' | 'rejected' | 'executed' | 'reversed';

export interface BudgetTransferService {
  request(input: TransferRequestInput): Promise<BudgetTransfer>;
  approve(transferId: string, approvedBy: string, comments?: string): Promise<BudgetTransfer>;
  reject(transferId: string, rejectedBy: string, comments: string): Promise<BudgetTransfer>;
  reverse(transferId: string, reversedBy: string, reason: string): Promise<BudgetTransfer>;
  list(budgetId: string, filters?: TransferFilters): Promise<BudgetTransfer[]>;
  getPendingForUser(userId: string): Promise<BudgetTransfer[]>;
  auditTrail(budgetId: string): Promise<BudgetTransfer[]>;
}
```

### CapExItem & CapitalBudgetService

```typescript
export interface CapExItem {
  id: string;
  budgetId: string;
  lineItemId: string;
  assetName: string;
  category: string;
  acquisitionCost: number;
  installationCost: number;
  totalCost: number;
  usefulLifeMonths: number;
  salvageValue: number;
  depreciationMethod: DepreciationMethod;
  plannedDate: Date;
  actualDate: Date | null;
  roi: ROIAnalysis;
  depreciationSchedule: DepreciationEntry[];
  approvalStatus: ApprovalStatus;
  status: CapExStatus;
  vendor: string | null;
  notes: string | null;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}

export type DepreciationMethod =
  | 'straight_line' | 'declining_balance' | 'double_declining'
  | 'sum_of_years' | 'units_of_production';

export type CapExStatus =
  | 'proposed' | 'approved' | 'ordered'
  | 'received' | 'in_service' | 'disposed' | 'cancelled';

export interface ROIAnalysis {
  annualBenefit: number;
  npv: number;
  irr: number;
  paybackMonths: number;
  discountRate: number;
  cashFlows: CashFlowProjection[];
  qualitativeBenefits: string[];
  risks: string[];
}

export interface CashFlowProjection {
  year: number;
  outflow: number;
  inflow: number;
  netCashFlow: number;
  cumulativeCashFlow: number;
  discountedCashFlow: number;
}

export interface DepreciationEntry {
  period: string;
  beginningValue: number;
  depreciationExpense: number;
  accumulatedDepreciation: number;
  endingValue: number;
}

export interface CapitalBudgetService {
  propose(input: ProposeCapExInput): Promise<CapExItem>;
  evaluate(capExId: string, discountRate: number): Promise<ROIAnalysis>;
  generateDepreciationSchedule(capExId: string): Promise<DepreciationEntry[]>;
  updateStatus(capExId: string, status: CapExStatus, updatedBy: string): Promise<CapExItem>;
  list(budgetId: string, filters?: CapExFilters): Promise<CapExItem[]>;
  summary(budgetId: string): Promise<CapExSummary>;
  dispose(capExId: string, disposalInfo: DisposalInfo): Promise<CapExItem>;
}
```

### ConsolidatedBudget & ConsolidationService

```typescript
export interface ConsolidatedBudget {
  id: string;
  parentEntityId: string;
  parentEntityType: 'venture' | 'consortium';
  fiscalPeriod: string;
  childBudgetIds: string[];
  currency: string;
  lineItems: ConsolidatedLineItem[];
  totalAmount: number;
  eliminations: EliminationEntry[];
  fxAdjustments: FxAdjustment[];
  status: ConsolidationStatus;
  generatedAt: Date;
  generatedBy: string;
  publishedAt: Date | null;
}

export interface ConsolidatedLineItem {
  accountId: string;
  accountCode: string;
  accountName: string;
  childAmounts: Record<string, number>;
  grossTotal: number;
  eliminationAmount: number;
  fxAdjustment: number;
  netTotal: number;
}

export interface EliminationEntry {
  description: string;
  accountId: string;
  amount: number;
  sourceEntityId: string;
  counterpartyEntityId: string;
  type: 'intercompany_revenue' | 'intercompany_expense' | 'intercompany_balance' | 'custom';
}

export interface FxAdjustment {
  entityId: string;
  sourceCurrency: string;
  targetCurrency: string;
  exchangeRate: number;
  rateDate: Date;
  originalAmount: number;
  translatedAmount: number;
  adjustment: number;
}

export type ConsolidationStatus = 'draft' | 'review' | 'published' | 'superseded';

export interface ConsolidationService {
  rollUp(parentEntityId: string, fiscalPeriod: string, options?: ConsolidationOptions): Promise<ConsolidatedBudget>;
  addElimination(consolidationId: string, entry: EliminationEntry): Promise<ConsolidatedBudget>;
  refreshFxRates(consolidationId: string): Promise<ConsolidatedBudget>;
  publish(consolidationId: string, publishedBy: string): Promise<ConsolidatedBudget>;
  getPublished(parentEntityId: string, fiscalPeriod: string): Promise<ConsolidatedBudget | null>;
  list(parentEntityId: string): Promise<ConsolidatedBudget[]>;
  statusOverview(parentEntityId: string, fiscalPeriod: string): Promise<ConsolidationStatusOverview>;
}

export interface ConsolidationOptions {
  currency?: string;
  fxRateDate?: Date;
  carryForwardEliminations?: boolean;
  autoDetectEliminations?: boolean;
}

export interface ConsolidationStatusOverview {
  parentEntityId: string;
  fiscalPeriod: string;
  totalChildren: number;
  readyChildren: number;
  draftChildren: number;
  missingChildren: number;
  children: Array<{
    entityId: string;
    entityName: string;
    budgetId: string | null;
    status: BudgetStatus | null;
    amount: number | null;
    currency: string | null;
  }>;
  canConsolidate: boolean;
  blockers: string[];
}
```

### BudgetAlert & AlertService

```typescript
export interface VarianceAlert {
  id: string;
  budgetId: string;
  lineItemId: string | null;
  ruleId: string;
  severity: AlertSeverity;
  message: string;
  currentPercent: number;
  thresholdPercent: number;
  budgetAmount: number;
  spentAmount: number;
  isAcknowledged: boolean;
  acknowledgedBy: string | null;
  acknowledgedAt: Date | null;
  acknowledgementNotes: string | null;
  triggeredAt: Date;
  notificationSent: boolean;
  notificationSentAt: Date | null;
}

export interface BudgetAlertRule {
  id: string;
  ventureId: string;
  budgetId: string | null;
  lineItemId: string | null;
  accountCodePattern: string | null;
  name: string;
  thresholds: BudgetAlertThreshold[];
  recipients: string[];
  channels: AlertChannel[];
  isActive: boolean;
  scope: 'line_item' | 'budget_total' | 'both';
  checkFrequency: 'real_time' | 'hourly' | 'daily';
  createdAt: Date;
  updatedAt: Date;
}

export interface BudgetAlertThreshold {
  percent: number;
  severity: AlertSeverity;
  notify: boolean;
}

export type AlertChannel = 'in_app' | 'email' | 'slack' | 'webhook';

export interface BudgetAlertService {
  configureRule(input: ConfigureAlertRuleInput): Promise<BudgetAlertRule>;
  updateRule(ruleId: string, input: Partial<ConfigureAlertRuleInput>): Promise<BudgetAlertRule>;
  deleteRule(ruleId: string): Promise<void>;
  listRules(ventureId: string, budgetId?: string): Promise<BudgetAlertRule[]>;
  evaluate(budgetId: string): Promise<VarianceAlert[]>;
  getActive(budgetId: string): Promise<VarianceAlert[]>;
  getForUser(userId: string): Promise<VarianceAlert[]>;
  acknowledge(alertId: string, acknowledgedBy: string, notes?: string): Promise<VarianceAlert>;
  history(budgetId: string, limit?: number): Promise<VarianceAlert[]>;
  setupDefaults(budgetId: string, ventureId: string): Promise<BudgetAlertRule[]>;
}
```

---

## Database Schema

### budget_budgets

```sql
CREATE TABLE budget_budgets (
  id              TEXT PRIMARY KEY DEFAULT generate_ulid(),
  venture_id      TEXT NOT NULL REFERENCES ventures(id),
  entity_id       TEXT NOT NULL,
  entity_type     TEXT NOT NULL CHECK (entity_type IN ('venture', 'department', 'project')),
  name            TEXT NOT NULL,
  description     TEXT,
  fiscal_year     TEXT NOT NULL,
  fiscal_period   TEXT NOT NULL,
  granularity     TEXT NOT NULL DEFAULT 'monthly'
                    CHECK (granularity IN ('monthly', 'quarterly', 'annual')),
  methodology     TEXT NOT NULL DEFAULT 'bottom_up'
                    CHECK (methodology IN ('top_down', 'bottom_up', 'hybrid', 'zero_based')),
  currency        TEXT NOT NULL DEFAULT 'USD',
  status          TEXT NOT NULL DEFAULT 'draft'
                    CHECK (status IN (
                      'draft', 'pending_approval', 'approved', 'active',
                      'locked', 'amendment_draft', 'archived'
                    )),
  version         INTEGER NOT NULL DEFAULT 1,
  approval_chain_id TEXT REFERENCES budget_approval_chains(id),
  scenario_id     TEXT REFERENCES budget_scenarios(id),
  parent_budget_id TEXT REFERENCES budget_budgets(id),
  template_id     TEXT REFERENCES budget_templates(id),
  source_budget_id TEXT REFERENCES budget_budgets(id),
  tags            TEXT[] DEFAULT '{}',
  created_by      TEXT NOT NULL,
  updated_by      TEXT NOT NULL,
  locked_at       TIMESTAMPTZ,
  locked_by       TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at      TIMESTAMPTZ,

  CONSTRAINT uq_budget_entity_period_active
    UNIQUE NULLS NOT DISTINCT (entity_id, entity_type, fiscal_period, scenario_id, deleted_at)
);

CREATE INDEX idx_budget_venture ON budget_budgets(venture_id);
CREATE INDEX idx_budget_entity ON budget_budgets(entity_id, entity_type);
CREATE INDEX idx_budget_period ON budget_budgets(fiscal_year, fiscal_period);
CREATE INDEX idx_budget_status ON budget_budgets(status) WHERE deleted_at IS NULL;
CREATE INDEX idx_budget_scenario ON budget_budgets(scenario_id) WHERE scenario_id IS NOT NULL;

ALTER TABLE budget_budgets ENABLE ROW LEVEL SECURITY;

CREATE POLICY budget_venture_access ON budget_budgets
  USING (venture_id IN (
    SELECT venture_id FROM venture_members WHERE user_id = auth.uid()
  ));

CREATE TRIGGER budget_budgets_updated_at
  BEFORE UPDATE ON budget_budgets
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

### budget_line_items

```sql
CREATE TABLE budget_line_items (
  id              TEXT PRIMARY KEY DEFAULT generate_ulid(),
  budget_id       TEXT NOT NULL REFERENCES budget_budgets(id) ON DELETE CASCADE,
  account_id      TEXT NOT NULL,
  account_code    TEXT NOT NULL,
  account_name    TEXT NOT NULL,
  parent_line_id  TEXT REFERENCES budget_line_items(id),
  sort_order      INTEGER NOT NULL DEFAULT 0,
  depth           INTEGER NOT NULL DEFAULT 0,
  is_summary      BOOLEAN NOT NULL DEFAULT false,
  description     TEXT,
  tags            TEXT[] DEFAULT '{}',
  metadata        JSONB DEFAULT '{}',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT uq_budget_line_account UNIQUE (budget_id, account_id)
);

CREATE INDEX idx_line_items_budget ON budget_line_items(budget_id);
CREATE INDEX idx_line_items_parent ON budget_line_items(parent_line_id);
CREATE INDEX idx_line_items_account ON budget_line_items(account_id);

ALTER TABLE budget_line_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY line_items_access ON budget_line_items
  USING (budget_id IN (
    SELECT id FROM budget_budgets
    WHERE venture_id IN (SELECT venture_id FROM venture_members WHERE user_id = auth.uid())
  ));
```

### budget_period_amounts

```sql
CREATE TABLE budget_period_amounts (
  id              TEXT PRIMARY KEY DEFAULT generate_ulid(),
  line_item_id    TEXT NOT NULL REFERENCES budget_line_items(id) ON DELETE CASCADE,
  budget_id       TEXT NOT NULL REFERENCES budget_budgets(id) ON DELETE CASCADE,
  period          TEXT NOT NULL,
  start_date      DATE NOT NULL,
  end_date        DATE NOT NULL,
  budget_amount   NUMERIC(20,2) NOT NULL DEFAULT 0,
  notes           TEXT,
  is_locked       BOOLEAN NOT NULL DEFAULT false,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT uq_period_amount UNIQUE (line_item_id, period)
);

CREATE INDEX idx_period_amounts_line ON budget_period_amounts(line_item_id);
CREATE INDEX idx_period_amounts_budget ON budget_period_amounts(budget_id);
CREATE INDEX idx_period_amounts_period ON budget_period_amounts(period);

ALTER TABLE budget_period_amounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY period_amounts_access ON budget_period_amounts
  USING (budget_id IN (
    SELECT id FROM budget_budgets
    WHERE venture_id IN (SELECT venture_id FROM venture_members WHERE user_id = auth.uid())
  ));

-- Auto-lock past periods
CREATE OR REPLACE FUNCTION auto_lock_past_periods() RETURNS TRIGGER AS $$
BEGIN
  IF NEW.end_date < CURRENT_DATE AND NOT NEW.is_locked THEN
    NEW.is_locked := true;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER budget_period_auto_lock
  BEFORE INSERT OR UPDATE ON budget_period_amounts
  FOR EACH ROW EXECUTE FUNCTION auto_lock_past_periods();
```

### budget_versions

```sql
CREATE TABLE budget_versions (
  id          TEXT PRIMARY KEY DEFAULT generate_ulid(),
  budget_id   TEXT NOT NULL REFERENCES budget_budgets(id) ON DELETE CASCADE,
  version     INTEGER NOT NULL,
  status      TEXT NOT NULL,
  reason      TEXT,
  snapshot    JSONB NOT NULL,
  diff        JSONB,
  created_by  TEXT NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT uq_budget_version UNIQUE (budget_id, version)
);

CREATE INDEX idx_versions_budget ON budget_versions(budget_id);
```

### budget_forecasts & budget_forecast_entries

```sql
CREATE TABLE budget_forecasts (
  id              TEXT PRIMARY KEY DEFAULT generate_ulid(),
  budget_id       TEXT NOT NULL REFERENCES budget_budgets(id) ON DELETE CASCADE,
  name            TEXT NOT NULL,
  description     TEXT,
  method          TEXT NOT NULL DEFAULT 'straight_line'
                    CHECK (method IN (
                      'straight_line', 'trend_linear', 'trend_exponential',
                      'seasonal', 'manual', 'driver_based', 'hybrid'
                    )),
  as_of_date      DATE NOT NULL,
  forward_periods INTEGER NOT NULL DEFAULT 12,
  is_current      BOOLEAN NOT NULL DEFAULT false,
  version         INTEGER NOT NULL DEFAULT 1,
  assumptions     JSONB DEFAULT '[]',
  created_by      TEXT NOT NULL,
  updated_by      TEXT NOT NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT uq_forecast_current
    EXCLUDE (budget_id WITH =) WHERE (is_current = true)
);

CREATE INDEX idx_forecasts_budget ON budget_forecasts(budget_id);

CREATE TABLE budget_forecast_entries (
  id                 TEXT PRIMARY KEY DEFAULT generate_ulid(),
  forecast_id        TEXT NOT NULL REFERENCES budget_forecasts(id) ON DELETE CASCADE,
  line_item_id       TEXT NOT NULL REFERENCES budget_line_items(id) ON DELETE CASCADE,
  period             TEXT NOT NULL,
  budget_amount      NUMERIC(20,2) NOT NULL DEFAULT 0,
  actual_amount      NUMERIC(20,2),
  forecast_amount    NUMERIC(20,2) NOT NULL DEFAULT 0,
  method             TEXT NOT NULL,
  confidence         NUMERIC(3,2) NOT NULL DEFAULT 0.80,
  notes              TEXT,
  is_manual_override BOOLEAN NOT NULL DEFAULT false,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT uq_forecast_entry UNIQUE (forecast_id, line_item_id, period)
);

CREATE INDEX idx_forecast_entries_forecast ON budget_forecast_entries(forecast_id);
CREATE INDEX idx_forecast_entries_line ON budget_forecast_entries(line_item_id);
```

### budget_scenarios

```sql
CREATE TABLE budget_scenarios (
  id            TEXT PRIMARY KEY DEFAULT generate_ulid(),
  venture_id    TEXT NOT NULL REFERENCES ventures(id),
  entity_id     TEXT NOT NULL,
  entity_type   TEXT NOT NULL CHECK (entity_type IN ('venture', 'department', 'project')),
  fiscal_period TEXT NOT NULL,
  name          TEXT NOT NULL,
  type          TEXT NOT NULL DEFAULT 'custom'
                  CHECK (type IN (
                    'optimistic', 'base', 'conservative',
                    'best_case', 'worst_case', 'stretch', 'custom'
                  )),
  description   TEXT,
  assumptions   JSONB DEFAULT '[]',
  probability   NUMERIC(3,2) NOT NULL DEFAULT 0.50
                  CHECK (probability >= 0 AND probability <= 1),
  is_active     BOOLEAN NOT NULL DEFAULT false,
  is_baseline   BOOLEAN NOT NULL DEFAULT false,
  color         TEXT NOT NULL DEFAULT '#6B7280',
  budget_id     TEXT REFERENCES budget_budgets(id),
  created_by    TEXT NOT NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT uq_scenario_baseline
    EXCLUDE (entity_id WITH =, fiscal_period WITH =) WHERE (is_baseline = true)
);

CREATE INDEX idx_scenarios_venture ON budget_scenarios(venture_id);
CREATE INDEX idx_scenarios_entity ON budget_scenarios(entity_id, entity_type);
```

### budget_approval_chains & budget_approvals

```sql
CREATE TABLE budget_approval_chains (
  id                 TEXT PRIMARY KEY DEFAULT generate_ulid(),
  venture_id         TEXT NOT NULL REFERENCES ventures(id),
  name               TEXT NOT NULL,
  entity_type        TEXT NOT NULL CHECK (entity_type IN ('venture', 'department', 'project')),
  min_amount         NUMERIC(20,2),
  max_amount         NUMERIC(20,2),
  steps              JSONB NOT NULL DEFAULT '[]',
  mode               TEXT NOT NULL DEFAULT 'sequential'
                       CHECK (mode IN ('sequential', 'parallel', 'highest_authority')),
  auto_approve_hours INTEGER,
  is_active          BOOLEAN NOT NULL DEFAULT true,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE budget_approvals (
  id              TEXT PRIMARY KEY DEFAULT generate_ulid(),
  budget_id       TEXT NOT NULL REFERENCES budget_budgets(id),
  chain_id        TEXT NOT NULL REFERENCES budget_approval_chains(id),
  current_step    INTEGER NOT NULL DEFAULT 1,
  status          TEXT NOT NULL DEFAULT 'pending'
                    CHECK (status IN ('pending', 'approved', 'rejected', 'escalated', 'recalled')),
  submitted_by    TEXT NOT NULL,
  submitted_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at    TIMESTAMPTZ,
  step_history    JSONB NOT NULL DEFAULT '[]',
  budget_snapshot JSONB NOT NULL DEFAULT '{}',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_approvals_budget ON budget_approvals(budget_id);
CREATE INDEX idx_approvals_status ON budget_approvals(status) WHERE status = 'pending';
```

### budget_transfers

```sql
CREATE TABLE budget_transfers (
  id                TEXT PRIMARY KEY DEFAULT generate_ulid(),
  budget_id         TEXT NOT NULL REFERENCES budget_budgets(id),
  from_line_item_id TEXT NOT NULL REFERENCES budget_line_items(id),
  from_account_code TEXT NOT NULL,
  from_account_name TEXT NOT NULL,
  to_line_item_id   TEXT NOT NULL REFERENCES budget_line_items(id),
  to_account_code   TEXT NOT NULL,
  to_account_name   TEXT NOT NULL,
  amount            NUMERIC(20,2) NOT NULL CHECK (amount > 0),
  period            TEXT,
  reason            TEXT NOT NULL,
  status            TEXT NOT NULL DEFAULT 'pending'
                      CHECK (status IN ('pending', 'approved', 'rejected', 'executed', 'reversed')),
  requested_by      TEXT NOT NULL,
  requested_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  actioned_by       TEXT,
  actioned_at       TIMESTAMPTZ,
  comments          TEXT,
  is_reversed       BOOLEAN NOT NULL DEFAULT false,
  reversal_id       TEXT REFERENCES budget_transfers(id),
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT chk_different_lines CHECK (from_line_item_id != to_line_item_id)
);

CREATE INDEX idx_transfers_budget ON budget_transfers(budget_id);
CREATE INDEX idx_transfers_status ON budget_transfers(status) WHERE status = 'pending';
```

### budget_alert_rules & budget_alerts

```sql
CREATE TABLE budget_alert_rules (
  id                   TEXT PRIMARY KEY DEFAULT generate_ulid(),
  venture_id           TEXT NOT NULL REFERENCES ventures(id),
  budget_id            TEXT REFERENCES budget_budgets(id),
  line_item_id         TEXT REFERENCES budget_line_items(id),
  account_code_pattern TEXT,
  name                 TEXT NOT NULL,
  thresholds           JSONB NOT NULL DEFAULT '[]',
  recipients           TEXT[] NOT NULL DEFAULT '{}',
  channels             TEXT[] NOT NULL DEFAULT '{in_app}',
  is_active            BOOLEAN NOT NULL DEFAULT true,
  scope                TEXT NOT NULL DEFAULT 'both'
                         CHECK (scope IN ('line_item', 'budget_total', 'both')),
  check_frequency      TEXT NOT NULL DEFAULT 'real_time'
                         CHECK (check_frequency IN ('real_time', 'hourly', 'daily')),
  created_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE budget_alerts (
  id                    TEXT PRIMARY KEY DEFAULT generate_ulid(),
  budget_id             TEXT NOT NULL REFERENCES budget_budgets(id),
  line_item_id          TEXT REFERENCES budget_line_items(id),
  rule_id               TEXT NOT NULL REFERENCES budget_alert_rules(id),
  severity              TEXT NOT NULL CHECK (severity IN ('info', 'warning', 'critical', 'breach')),
  message               TEXT NOT NULL,
  current_percent       NUMERIC(7,2) NOT NULL,
  threshold_percent     NUMERIC(7,2) NOT NULL,
  budget_amount         NUMERIC(20,2) NOT NULL,
  spent_amount          NUMERIC(20,2) NOT NULL,
  is_acknowledged       BOOLEAN NOT NULL DEFAULT false,
  acknowledged_by       TEXT,
  acknowledged_at       TIMESTAMPTZ,
  acknowledgement_notes TEXT,
  triggered_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  notification_sent     BOOLEAN NOT NULL DEFAULT false,
  notification_sent_at  TIMESTAMPTZ,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_alerts_budget ON budget_alerts(budget_id);
CREATE INDEX idx_alerts_unack ON budget_alerts(is_acknowledged) WHERE is_acknowledged = false;
CREATE INDEX idx_alerts_severity ON budget_alerts(severity);
```

### budget_capex

```sql
CREATE TABLE budget_capex (
  id                    TEXT PRIMARY KEY DEFAULT generate_ulid(),
  budget_id             TEXT NOT NULL REFERENCES budget_budgets(id),
  line_item_id          TEXT NOT NULL REFERENCES budget_line_items(id),
  asset_name            TEXT NOT NULL,
  category              TEXT NOT NULL,
  acquisition_cost      NUMERIC(20,2) NOT NULL,
  installation_cost     NUMERIC(20,2) NOT NULL DEFAULT 0,
  total_cost            NUMERIC(20,2) GENERATED ALWAYS AS (acquisition_cost + installation_cost) STORED,
  useful_life_months    INTEGER NOT NULL,
  salvage_value         NUMERIC(20,2) NOT NULL DEFAULT 0,
  depreciation_method   TEXT NOT NULL DEFAULT 'straight_line'
                          CHECK (depreciation_method IN (
                            'straight_line', 'declining_balance',
                            'double_declining', 'sum_of_years', 'units_of_production'
                          )),
  planned_date          DATE NOT NULL,
  actual_date           DATE,
  roi_analysis          JSONB DEFAULT '{}',
  depreciation_schedule JSONB DEFAULT '[]',
  approval_status       TEXT NOT NULL DEFAULT 'pending'
                          CHECK (approval_status IN ('pending', 'approved', 'rejected')),
  status                TEXT NOT NULL DEFAULT 'proposed'
                          CHECK (status IN (
                            'proposed', 'approved', 'ordered',
                            'received', 'in_service', 'disposed', 'cancelled'
                          )),
  vendor                TEXT,
  notes                 TEXT,
  tags                  TEXT[] DEFAULT '{}',
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_capex_budget ON budget_capex(budget_id);
CREATE INDEX idx_capex_status ON budget_capex(status);
```

### budget_consolidations

```sql
CREATE TABLE budget_consolidations (
  id                 TEXT PRIMARY KEY DEFAULT generate_ulid(),
  parent_entity_id   TEXT NOT NULL,
  parent_entity_type TEXT NOT NULL CHECK (parent_entity_type IN ('venture', 'consortium')),
  fiscal_period      TEXT NOT NULL,
  child_budget_ids   TEXT[] NOT NULL DEFAULT '{}',
  currency           TEXT NOT NULL DEFAULT 'USD',
  line_items         JSONB NOT NULL DEFAULT '[]',
  total_amount       NUMERIC(20,2) NOT NULL DEFAULT 0,
  eliminations       JSONB DEFAULT '[]',
  fx_adjustments     JSONB DEFAULT '[]',
  status             TEXT NOT NULL DEFAULT 'draft'
                       CHECK (status IN ('draft', 'review', 'published', 'superseded')),
  generated_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  generated_by       TEXT NOT NULL,
  published_at       TIMESTAMPTZ,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_consolidations_entity ON budget_consolidations(parent_entity_id);
CREATE INDEX idx_consolidations_status ON budget_consolidations(status);
```

### budget_templates

```sql
CREATE TABLE budget_templates (
  id          TEXT PRIMARY KEY DEFAULT generate_ulid(),
  venture_id  TEXT REFERENCES ventures(id),
  name        TEXT NOT NULL,
  description TEXT,
  entity_type TEXT NOT NULL CHECK (entity_type IN ('venture', 'department', 'project')),
  granularity TEXT NOT NULL DEFAULT 'monthly',
  methodology TEXT NOT NULL DEFAULT 'bottom_up',
  line_items  JSONB NOT NULL DEFAULT '[]',
  is_system   BOOLEAN NOT NULL DEFAULT false,
  is_active   BOOLEAN NOT NULL DEFAULT true,
  created_by  TEXT NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_templates_venture ON budget_templates(venture_id);
CREATE INDEX idx_templates_entity_type ON budget_templates(entity_type);
```

---

## Budget Creation

### Top-Down Budgeting

In top-down budgeting, leadership sets an overall budget envelope, then allocates amounts down through the hierarchy.

```typescript
// Top-down: CFO sets departmental budget targets
const topDownBudget = await budgetService.create({
  ventureId: 'venture_01',
  entityId: 'dept_engineering',
  entityType: 'department',
  name: 'Engineering 2026',
  fiscalYear: '2026',
  fiscalPeriod: '2026',
  granularity: 'monthly',
  methodology: 'top_down',
  currency: 'USD',
  createdBy: 'user_cfo',
  topDownTotal: 2_400_000,
  distributionMethod: 'even',
});

// Weighted distribution for seasonal departments
const marketingBudget = await budgetService.create({
  ventureId: 'venture_01',
  entityId: 'dept_marketing',
  entityType: 'department',
  name: 'Marketing 2026',
  fiscalYear: '2026',
  fiscalPeriod: '2026',
  granularity: 'monthly',
  methodology: 'top_down',
  currency: 'USD',
  createdBy: 'user_cfo',
  topDownTotal: 1_800_000,
  distributionMethod: 'weighted',
  periodWeights: {
    '2026-01': 0.10, '2026-02': 0.12, '2026-03': 0.12,
    '2026-04': 0.07, '2026-05': 0.06, '2026-06': 0.06,
    '2026-07': 0.10, '2026-08': 0.10, '2026-09': 0.10,
    '2026-10': 0.07, '2026-11': 0.05, '2026-12': 0.05,
  },
});
```

### Bottom-Up Budgeting

```typescript
// Engineering manager builds detailed budget line by line
const bottomUpBudget = await budgetService.create({
  ventureId: 'venture_01',
  entityId: 'dept_engineering',
  entityType: 'department',
  name: 'Engineering 2026 - Bottom Up',
  fiscalYear: '2026',
  fiscalPeriod: '2026',
  granularity: 'monthly',
  methodology: 'bottom_up',
  currency: 'USD',
  createdBy: 'user_eng_manager',
});

// Populate line items with detailed amounts
await budgetService.updateLineItem(bottomUpBudget.id, {
  accountId: 'acct_salaries',
  periods: [
    { period: '2026-01', budgetAmount: 150_000 },
    { period: '2026-02', budgetAmount: 150_000 },
    { period: '2026-03', budgetAmount: 155_000 },
    { period: '2026-04', budgetAmount: 155_000 },
    { period: '2026-05', budgetAmount: 155_000 },
    { period: '2026-06', budgetAmount: 160_000 },
    { period: '2026-07', budgetAmount: 160_000 },
    { period: '2026-08', budgetAmount: 160_000 },
    { period: '2026-09', budgetAmount: 165_000 },
    { period: '2026-10', budgetAmount: 165_000 },
    { period: '2026-11', budgetAmount: 165_000 },
    { period: '2026-12', budgetAmount: 165_000 },
  ],
  description: 'Engineering salaries — 15 FTEs, +1 in March, +1 in June, +1 in Sep',
});
```

### Copy-Forward from Prior Period

```typescript
// Copy with 5% growth factor applied to all amounts
const budget2026 = await budgetService.copyForward({
  sourceBudgetId: 'budget_2025_eng',
  fiscalYear: '2026',
  fiscalPeriod: '2026',
  name: 'Engineering 2026',
  growthFactor: 1.05,
  copyAmounts: true,
  copyNotes: true,
  createdBy: 'user_eng_manager',
});

// Copy structure only for zero-based budgeting
const zeroBased = await budgetService.copyForward({
  sourceBudgetId: 'budget_2025_eng',
  fiscalYear: '2026',
  fiscalPeriod: '2026',
  name: 'Engineering 2026 - Zero Based',
  copyAmounts: false,
  createdBy: 'user_eng_manager',
});
```

### Template-Based Creation

```typescript
const templateBudget = await budgetService.createFromTemplate(
  'tmpl_department_standard',
  {
    ventureId: 'venture_01',
    entityId: 'dept_sales',
    entityType: 'department',
    name: 'Sales 2026',
    fiscalYear: '2026',
    fiscalPeriod: '2026',
    granularity: 'monthly',
    methodology: 'bottom_up',
    currency: 'USD',
    createdBy: 'user_sales_director',
  }
);
```

---

## Budget Line Items

### Hierarchical Structure

```
Engineering 2026 Budget
├── 5000 - Personnel Costs (Summary)
│   ├── 5100 - Salaries & Wages
│   ├── 5200 - Benefits
│   ├── 5300 - Payroll Taxes
│   └── 5400 - Contract Labor
├── 6000 - Operating Expenses (Summary)
│   ├── 6100 - Software Subscriptions
│   ├── 6200 - Cloud Infrastructure
│   ├── 6300 - Equipment & Hardware
│   └── 6400 - Office Supplies
├── 7000 - Travel & Entertainment (Summary)
│   ├── 7100 - Business Travel
│   ├── 7200 - Team Events
│   └── 7300 - Conference Attendance
└── 8000 - Professional Services (Summary)
    ├── 8100 - Consulting Fees
    ├── 8200 - Legal Fees
    └── 8300 - Audit Fees
```

### Monthly Breakdown Example

```typescript
const cloudLine: BudgetLine = {
  id: 'line_01',
  budgetId: 'budget_2026_eng',
  accountId: 'acct_6200',
  accountCode: '6200',
  accountName: 'Cloud Infrastructure',
  parentLineId: 'line_opex_summary',
  sortOrder: 2,
  depth: 1,
  isSummary: false,
  description: 'AWS, GCP, and Vercel hosting costs',
  periods: [
    { period: '2026-01', startDate: new Date('2026-01-01'), endDate: new Date('2026-01-31'),
      budgetAmount: 45_000, actualAmount: 0, committedAmount: 0,
      forecastAmount: null, notes: null, isLocked: false },
    { period: '2026-02', startDate: new Date('2026-02-01'), endDate: new Date('2026-02-28'),
      budgetAmount: 45_000, actualAmount: 0, committedAmount: 0,
      forecastAmount: null, notes: null, isLocked: false },
    { period: '2026-03', startDate: new Date('2026-03-01'), endDate: new Date('2026-03-31'),
      budgetAmount: 48_000, actualAmount: 0, committedAmount: 0,
      forecastAmount: null, notes: 'Increase from new service launch', isLocked: false },
    // ... remaining months
  ],
  annualTotal: 576_000,
  actualToDate: 0,
  committedToDate: 0,
  remaining: 576_000,
  variance: 0,
  variancePercent: 0,
  tags: ['cloud', 'infrastructure'],
  metadata: { costDriver: 'user_count', costPerUnit: 0.12, expectedUsers: 375_000 },
  createdAt: new Date(),
  updatedAt: new Date(),
};
```

### Bulk Operations

```typescript
// Apply a 3% across-the-board cut to all leaf-level items
await budgetService.bulkAdjustLineItems(budgetId, {
  filter: { depth: 1, isSummary: false },
  adjustment: { type: 'percentage', value: -0.03, periods: 'remaining' },
  reason: 'Q2 cost reduction initiative',
  adjustedBy: 'user_cfo',
});

// Spread annual amount using seasonal pattern
await budgetService.distributeAmount('line_travel', {
  annualAmount: 120_000,
  pattern: 'seasonal',
  seasonalWeights: {
    '2026-01': 0.05, '2026-02': 0.05, '2026-03': 0.10,
    '2026-04': 0.10, '2026-05': 0.10, '2026-06': 0.08,
    '2026-07': 0.05, '2026-08': 0.05, '2026-09': 0.12,
    '2026-10': 0.12, '2026-11': 0.10, '2026-12': 0.08,
  },
});
```

---

## Forecasting

### Rolling Forecast

```typescript
// Rolling 12-month forecast based on linear trend in actuals
const forecast = await forecastService.rolling('budget_2026_eng', 12, 'trend_linear');

// Elapsed periods use actuals; future periods are projected
console.log(forecast.entries[0]);
// { period: '2026-01', budgetAmount: 45000, actualAmount: 47200,
//   forecastAmount: 47200, method: 'actual', confidence: 1.0 }

console.log(forecast.entries[5]);
// { period: '2026-06', budgetAmount: 48000, actualAmount: null,
//   forecastAmount: 51340, method: 'trend_linear', confidence: 0.82 }
```

### What-If Analysis

```typescript
// What if we hire 3 more engineers?
const whatIfResult = await forecastService.whatIf('fc_01', [
  {
    type: 'absolute',
    target: 'line_salaries',
    value: 45_000,
    periods: ['2026-04','2026-05','2026-06','2026-07',
              '2026-08','2026-09','2026-10','2026-11','2026-12'],
    description: 'Hire 3 additional engineers starting April',
  },
  {
    type: 'percentage',
    target: 'line_benefits',
    value: 0.20,
    periods: ['2026-04','2026-05','2026-06','2026-07',
              '2026-08','2026-09','2026-10','2026-11','2026-12'],
    description: 'Benefits for new hires',
  },
  {
    type: 'absolute',
    target: 'line_equipment',
    value: 15_000,
    periods: ['2026-04'],
    description: 'Laptops and equipment for new hires',
  },
]);

console.log(`Impact: +$${whatIfResult.varianceFromBudget.toLocaleString()} vs original budget`);
// Impact: +$435,000 vs original budget
```

### Three-Way Comparison

```typescript
const comparison = await forecastService.getComparison('budget_2026_eng');

console.log(comparison.totals);
// { budget: 2_400_000, forecast: 2_612_000, actual: 482_000,
//   budgetVariance: 82_000, forecastVariance: 212_000 }

comparison.periods.forEach(p => {
  if (p.isElapsed) {
    console.log(`${p.period}: Budget=$${p.budget} | Actual=$${p.actual} | Var=${p.budgetVariancePercent}%`);
  } else {
    console.log(`${p.period}: Budget=$${p.budget} | Forecast=$${p.forecast} | Var=${p.forecastVariancePercent}%`);
  }
});
```

---

## Variance Tracking

### Real-Time Variance Report

```typescript
const report = await varianceService.compute('budget_2026_eng', {
  period: '2026-02',
  includeYTD: true,
  includeForecast: true,
});

console.log(report.summary);
// { totalBudget: 200_000, totalActual: 214_500, totalCommitted: 12_000,
//   totalVariance: 14_500, variancePercent: 7.25, overBudgetCount: 3,
//   alertCount: 1, utilizationPercent: 113.25 }

// Top variances sorted by absolute value
report.topVariances.forEach(v => {
  const icon = v.variance > 0 ? '🔴 OVER' : '🟢 UNDER';
  console.log(`${icon} ${v.accountCode} ${v.accountName}: $${Math.abs(v.variance)} (${v.variancePercent}%)`);
});
// 🔴 OVER 6200 Cloud Infrastructure: $8,200 (18.2%)
// 🔴 OVER 5100 Salaries & Wages: $5,000 (3.3%)
// 🟢 UNDER 7100 Business Travel: $3,200 (-32.0%)
```

### Transaction Drill-Down

```typescript
const detail = await varianceService.drillDown('line_cloud', '2026-02');

console.log(`${detail.accountName}: Budget $${detail.budgetAmount} | Actual $${detail.actualAmount}`);
console.log(`Variance: $${detail.variance} (${detail.variancePercent}%)`);

detail.transactions?.forEach(txn => {
  console.log(`  ${txn.date.toISOString().slice(0,10)} | ${txn.description} | $${txn.amount} | ${txn.vendor}`);
});
// 2026-02-01 | AWS Monthly Invoice   | $32,400 | Amazon Web Services
// 2026-02-01 | GCP Monthly Invoice    | $11,800 | Google Cloud
// 2026-02-15 | Vercel Pro Plan        |  $1,200 | Vercel Inc
// 2026-02-15 | Datadog Monitoring     |  $2,800 | Datadog Inc
```

### Variance Trends

```typescript
const trends = await varianceService.trend('budget_2026_eng', 6);

trends.forEach(t => {
  console.log(
    `${t.period}: Budget=$${t.budget} Actual=$${t.actual} ` +
    `Cumul Var=$${t.cumulativeVariance} (${t.trend})`
  );
});
// 2026-01: Budget=$200,000 Actual=$208,000 Cumul Var=$8,000 (worsening)
// 2026-02: Budget=$200,000 Actual=$214,500 Cumul Var=$22,500 (worsening)
// 2026-03: Budget=$205,000 Actual=$203,200 Cumul Var=$20,700 (improving)
```

---

## Approval Workflows

### Configure a Multi-Level Chain

```typescript
const chain = await approvalService.configureChain({
  ventureId: 'venture_01',
  name: 'Department Budget Approval',
  entityType: 'department',
  mode: 'sequential',
  steps: [
    { order: 1, name: 'Manager Review', role: 'department_manager',
      userId: null, minAmount: null, canSkip: false },
    { order: 2, name: 'Director Approval', role: 'director',
      userId: null, minAmount: 100_000, canSkip: false },
    { order: 3, name: 'VP Approval', role: 'vp_finance',
      userId: null, minAmount: 500_000, canSkip: false },
    { order: 4, name: 'CFO Final Approval', role: 'cfo',
      userId: 'user_cfo_jane', minAmount: 1_000_000, canSkip: false },
  ],
  autoApproveHours: null,
});
```

### Submit and Approve

```typescript
// Manager submits
const approval = await approvalService.submit('budget_2026_eng', 'user_eng_manager');

// Director approves
await approvalService.approve(approval.id, 'user_director', 'Cloud costs justified by growth.');

// VP approves
await approvalService.approve(approval.id, 'user_vp_finance', 'Approved. Monitor quarterly.');

// CFO gives final approval
const final = await approvalService.approve(approval.id, 'user_cfo_jane', 'Approved for FY2026.');
// Budget status → 'approved', BudgetApprovedEvent emitted
```

### Rejection and Recall

```typescript
// VP rejects — budget returns to draft
await approvalService.reject(approval.id, 'user_vp_finance',
  'Cloud costs need detailed justification.');

// Manager recalls before any step is actioned
await approvalService.recall(approval.id, 'user_eng_manager');
```

### Pending Approvals Dashboard

```typescript
const pending = await approvalService.getPendingForUser('user_vp_finance');
pending.forEach(p => {
  console.log(`Budget: ${p.budgetId} | Step: ${p.currentStep} | By: ${p.submittedBy}`);
});
```

---

## Budget Transfers

### Request, Approve, Reverse

```typescript
// Request transfer: Travel → Software
const transfer = await transferService.request({
  budgetId: 'budget_2026_eng',
  fromLineItemId: 'line_travel',
  toLineItemId: 'line_software',
  amount: 15_000,
  period: '2026-Q2',
  reason: 'Travel underutilized; need security tooling licenses.',
  requestedBy: 'user_eng_manager',
});

// Approve and execute
await transferService.approve(transfer.id, 'user_finance_director',
  'Makes sense given remote-first shift.');

// Reverse if needed
await transferService.reverse(transfer.id, 'user_finance_director',
  'Q2 offsite reinstated.');
```

### Audit Trail

```typescript
const trail = await transferService.auditTrail('budget_2026_eng');
trail.forEach(t => {
  console.log(
    `${t.requestedAt.toISOString().slice(0,10)} | ` +
    `${t.fromAccountName} → ${t.toAccountName} | ` +
    `$${t.amount} | ${t.status}`
  );
});
```

---

## Scenario Planning

### Create and Compare Scenarios

```typescript
// Base case
const base = await scenarioService.create({
  ventureId: 'venture_01',
  entityId: 'venture_01',
  entityType: 'venture',
  fiscalPeriod: '2026',
  name: 'Base Case',
  type: 'base',
  probability: 0.50,
  isBaseline: true,
  color: '#3B82F6',
  assumptions: [
    { driver: 'Revenue Growth', value: '15%', baselineValue: '15%', notes: null },
    { driver: 'Headcount', value: '55 FTEs', baselineValue: '55 FTEs', notes: null },
  ],
  createdBy: 'user_cfo',
});

// Optimistic
const optimistic = await scenarioService.create({
  ventureId: 'venture_01',
  entityId: 'venture_01',
  entityType: 'venture',
  fiscalPeriod: '2026',
  name: 'Optimistic',
  type: 'optimistic',
  probability: 0.25,
  isBaseline: false,
  color: '#10B981',
  assumptions: [
    { driver: 'Revenue Growth', value: '25%', baselineValue: '15%', notes: 'New market expansion' },
    { driver: 'Headcount', value: '70 FTEs', baselineValue: '55 FTEs', notes: '+15 hires' },
  ],
  createdBy: 'user_cfo',
});

// Conservative
const conservative = await scenarioService.create({
  ventureId: 'venture_01',
  entityId: 'venture_01',
  entityType: 'venture',
  fiscalPeriod: '2026',
  name: 'Conservative',
  type: 'conservative',
  probability: 0.25,
  isBaseline: false,
  color: '#EF4444',
  assumptions: [
    { driver: 'Revenue Growth', value: '5%', baselineValue: '15%', notes: 'Market slowdown' },
    { driver: 'Headcount', value: '50 FTEs', baselineValue: '55 FTEs', notes: 'Hiring freeze' },
  ],
  createdBy: 'user_cfo',
});

// Side-by-side comparison
const comparison = await scenarioService.compare([base.id, optimistic.id, conservative.id]);
console.log(`Weighted Average: $${comparison.weightedAverage.toLocaleString()}`);
// Base Case: $4,800,000 (baseline)
// Optimistic: $6,240,000 (+30.0% vs baseline)
// Conservative: $3,960,000 (-17.5% vs baseline)
```

### Merge Scenario into Active Budget

```typescript
const activeBudget = await scenarioService.merge(base.id, 'user_cfo');
// Base scenario's budget becomes the primary active budget
```

---

## Capital Budgeting

### Propose and Evaluate CapEx

```typescript
const capex = await capitalBudgetService.propose({
  budgetId: 'budget_2026_eng',
  lineItemId: 'line_equipment',
  assetName: 'Dell PowerEdge R760 Servers (x4)',
  category: 'Equipment',
  acquisitionCost: 120_000,
  installationCost: 8_000,
  usefulLifeMonths: 60,
  salvageValue: 5_000,
  depreciationMethod: 'straight_line',
  plannedDate: new Date('2026-03-15'),
  vendor: 'Dell Technologies',
  notes: 'On-premise ML training compute — more cost-effective than cloud at scale.',
  tags: ['infrastructure', 'ml'],
});

// ROI evaluation
const roi = await capitalBudgetService.evaluate(capex.id, 0.10);
console.log(`NPV: $${roi.npv.toLocaleString()}`);
console.log(`IRR: ${roi.irr}%`);
console.log(`Payback: ${roi.paybackMonths} months`);
// NPV: $58,420  |  IRR: 28.3%  |  Payback: 32 months
```

### Depreciation Schedule

```typescript
const schedule = await capitalBudgetService.generateDepreciationSchedule(capex.id);
schedule.forEach(entry => {
  console.log(
    `${entry.period}: Begin=$${entry.beginningValue} ` +
    `Depr=$${entry.depreciationExpense} ` +
    `End=$${entry.endingValue}`
  );
});
// Year 1: Begin=$128,000 Depr=$24,600 End=$103,400
// Year 2: Begin=$103,400 Depr=$24,600 End=$78,800
// Year 3: Begin=$78,800  Depr=$24,600 End=$54,200
// Year 4: Begin=$54,200  Depr=$24,600 End=$29,600
// Year 5: Begin=$29,600  Depr=$24,600 End=$5,000
```

### CapEx Summary

```typescript
const summary = await capitalBudgetService.summary('budget_2026_eng');
console.log(summary);
// { totalProposed: 450_000, totalApproved: 280_000, totalSpent: 128_000,
//   totalRemaining: 152_000, averageROI: 24.1, averagePaybackMonths: 28,
//   byCategory: { Equipment: { count: 3, total: 320_000 }, Software: { count: 2, total: 130_000 } },
//   byStatus: { proposed: { count: 1, total: 170_000 }, in_service: { count: 4, total: 280_000 } } }
```

---

## Budget Alerts

### Setup Default Thresholds

```typescript
// Automatically set up 75%, 90%, 100% alerts for a new budget
const rules = await alertService.setupDefaults('budget_2026_eng', 'venture_01');
// Creates 3 alert rules:
// 1. 75% → severity: 'info',    notify: true
// 2. 90% → severity: 'warning', notify: true
// 3. 100% → severity: 'breach', notify: true
```

### Custom Alert Rule

```typescript
const rule = await alertService.configureRule({
  ventureId: 'venture_01',
  budgetId: 'budget_2026_eng',
  name: 'Cloud Cost Alert',
  accountCodePattern: '62*',
  thresholds: [
    { percent: 60, severity: 'info', notify: false },
    { percent: 80, severity: 'warning', notify: true },
    { percent: 95, severity: 'critical', notify: true },
    { percent: 100, severity: 'breach', notify: true },
  ],
  recipients: ['user_eng_manager', 'user_cto'],
  channels: ['in_app', 'email', 'slack'],
  scope: 'line_item',
  checkFrequency: 'real_time',
});
```

### Alert Evaluation and Acknowledgement

```typescript
// Triggered when actuals are posted from ledger
const alerts = await alertService.evaluate('budget_2026_eng');
alerts.forEach(a => {
  console.log(`${a.severity.toUpperCase()}: ${a.message} (${a.currentPercent}% of ${a.thresholdPercent}% threshold)`);
});
// WARNING: Cloud Infrastructure at 82.4% of budget (80% threshold)
// BREACH: Software Subscriptions at 101.2% of budget (100% threshold)

// Acknowledge an alert
await alertService.acknowledge('alert_01', 'user_eng_manager',
  'Aware of overspend — approved one-time purchase in February.');
```

---

## Consolidation

### Roll-Up Department → Venture

```typescript
// Check readiness before consolidating
const overview = await consolidationService.statusOverview('venture_01', '2026');
console.log(`Ready: ${overview.readyChildren}/${overview.totalChildren}`);
console.log(`Can consolidate: ${overview.canConsolidate}`);
if (!overview.canConsolidate) {
  console.log('Blockers:', overview.blockers);
}

// Roll up all department budgets into venture budget
const consolidated = await consolidationService.rollUp('venture_01', '2026', {
  currency: 'USD',
  autoDetectEliminations: true,
});

console.log(`Consolidated total: $${consolidated.totalAmount.toLocaleString()}`);
console.log(`Eliminations: ${consolidated.eliminations.length} entries`);
```

### Intercompany Eliminations

```typescript
// Add elimination for intercompany services
await consolidationService.addElimination(consolidated.id, {
  description: 'Engineering services charged to Marketing',
  accountId: 'acct_interco_revenue',
  amount: -50_000,
  sourceEntityId: 'dept_engineering',
  counterpartyEntityId: 'dept_marketing',
  type: 'intercompany_revenue',
});
```

### FX Translation and Publishing

```typescript
// Multi-currency consolidation: refresh rates before publishing
await consolidationService.refreshFxRates(consolidated.id);

// Publish — makes it available to PnL and reports
await consolidationService.publish(consolidated.id, 'user_cfo');
// BudgetConsolidatedEvent emitted → PnL service picks it up
```

---

## Code Examples

### Example 1: Complete Budget Lifecycle

```typescript
import { BudgetService, BudgetApprovalService, BudgetAlertService } from '@mcv/finance/budgeting';

async function fullBudgetLifecycle(
  budgetSvc: BudgetService,
  approvalSvc: BudgetApprovalService,
  alertSvc: BudgetAlertService,
) {
  // 1. Create budget from template
  const budget = await budgetSvc.createFromTemplate('tmpl_dept_standard', {
    ventureId: 'venture_01',
    entityId: 'dept_engineering',
    entityType: 'department',
    name: 'Engineering FY2026',
    fiscalYear: '2026',
    fiscalPeriod: '2026',
    granularity: 'monthly',
    methodology: 'bottom_up',
    currency: 'USD',
    createdBy: 'user_eng_manager',
  });

  // 2. Populate line items (abbreviated)
  await budgetSvc.distributeAmount('line_salaries', {
    annualAmount: 1_920_000,
    pattern: 'even',
  });

  // 3. Setup default alerts
  await alertSvc.setupDefaults(budget.id, budget.ventureId);

  // 4. Submit for approval
  await budgetSvc.submit(budget.id, 'user_eng_manager');

  // 5. Approval chain executes (manager → director → VP → CFO)
  const approval = await approvalSvc.getStatus(budget.id);
  // ... approvers action their steps ...

  // 6. Lock the approved budget
  await budgetSvc.lock(budget.id, 'user_cfo');

  // 7. Budget is now active and feeding into PnL
  return budget;
}
```

### Example 2: tRPC Router Definition

```typescript
import { router, protectedProcedure } from '@mcv/trpc';
import { z } from 'zod';
import { createBudgetSchema, updateBudgetLineSchema } from './validators';

export const budgetRouter = router({
  create: protectedProcedure
    .input(createBudgetSchema)
    .mutation(async ({ ctx, input }) => {
      return ctx.budgetService.create({ ...input, createdBy: ctx.user.id });
    }),

  getById: protectedProcedure
    .input(z.object({
      budgetId: z.string(),
      includeLines: z.boolean().default(false),
      includeForecast: z.boolean().default(false),
    }))
    .query(async ({ ctx, input }) => {
      return ctx.budgetService.getById(input.budgetId, {
        lineItems: input.includeLines,
        forecast: input.includeForecast,
      });
    }),

  list: protectedProcedure
    .input(z.object({
      ventureId: z.string(),
      entityId: z.string().optional(),
      entityType: z.enum(['venture', 'department', 'project']).optional(),
      status: z.enum(['draft','pending_approval','approved','active','locked','archived']).optional(),
      fiscalYear: z.string().optional(),
      limit: z.number().min(1).max(100).default(20),
      cursor: z.string().optional(),
    }))
    .query(async ({ ctx, input }) => {
      return ctx.budgetService.list(input);
    }),

  submit: protectedProcedure
    .input(z.object({ budgetId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      return ctx.budgetService.submit(input.budgetId, ctx.user.id);
    }),

  lock: protectedProcedure
    .input(z.object({ budgetId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      return ctx.budgetService.lock(input.budgetId, ctx.user.id);
    }),

  updateLineItem: protectedProcedure
    .input(updateBudgetLineSchema)
    .mutation(async ({ ctx, input }) => {
      return ctx.budgetService.updateLineItem(input.budgetId, input);
    }),

  variance: protectedProcedure
    .input(z.object({
      budgetId: z.string(),
      period: z.string().optional(),
      includeYTD: z.boolean().default(true),
      includeForecast: z.boolean().default(true),
    }))
    .query(async ({ ctx, input }) => {
      return ctx.varianceService.compute(input.budgetId, input);
    }),

  forecast: router({
    generate: protectedProcedure
      .input(z.object({
        budgetId: z.string(),
        method: z.enum(['straight_line','trend_linear','trend_exponential','seasonal','manual','driver_based','hybrid']),
        periods: z.number().min(1).max(36).default(12),
      }))
      .mutation(async ({ ctx, input }) => {
        return ctx.forecastService.rolling(input.budgetId, input.periods, input.method);
      }),

    comparison: protectedProcedure
      .input(z.object({ budgetId: z.string() }))
      .query(async ({ ctx, input }) => {
        return ctx.forecastService.getComparison(input.budgetId);
      }),
  }),

  transfer: router({
    request: protectedProcedure
      .input(z.object({
        budgetId: z.string(),
        fromLineItemId: z.string(),
        toLineItemId: z.string(),
        amount: z.number().positive(),
        period: z.string().optional(),
        reason: z.string().min(10),
      }))
      .mutation(async ({ ctx, input }) => {
        return ctx.transferService.request({ ...input, requestedBy: ctx.user.id });
      }),
  }),

  scenario: router({
    compare: protectedProcedure
      .input(z.object({ scenarioIds: z.array(z.string()).min(2).max(5) }))
      .query(async ({ ctx, input }) => {
        return ctx.scenarioService.compare(input.scenarioIds);
      }),
  }),

  consolidation: router({
    rollUp: protectedProcedure
      .input(z.object({
        parentEntityId: z.string(),
        fiscalPeriod: z.string(),
        currency: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        return ctx.consolidationService.rollUp(input.parentEntityId, input.fiscalPeriod, input);
      }),
  }),
});
```

### Example 3: React Hook — useBudgetDashboard

```typescript
import { useBudget, useVariance, useForecast, useBudgetAlerts } from '@mcv/finance/budgeting';
import { trpc } from '@/utils/trpc';

export function useBudgetDashboard(budgetId: string) {
  const budget = trpc.budget.getById.useQuery(
    { budgetId, includeLines: true, includeForecast: true },
    { refetchInterval: 30_000 }
  );

  const variance = trpc.budget.variance.useQuery(
    { budgetId, includeYTD: true, includeForecast: true },
    { enabled: !!budget.data, refetchInterval: 60_000 }
  );

  const comparison = trpc.budget.forecast.comparison.useQuery(
    { budgetId },
    { enabled: !!budget.data }
  );

  const alerts = trpc.budget.alerts.active.useQuery(
    { budgetId },
    { refetchInterval: 30_000 }
  );

  return {
    budget: budget.data,
    variance: variance.data,
    comparison: comparison.data,
    alerts: alerts.data,
    isLoading: budget.isLoading,
    error: budget.error || variance.error,
  };
}
```

### Example 4: Event Handler — Post Actuals

```typescript
import { BudgetAlertService, VarianceService } from '@mcv/finance/budgeting';

/**
 * Called when the ledger module posts new actuals that affect a budget.
 * Evaluates alert thresholds and emits events for any breaches.
 */
export async function handleActualsPosted(
  event: ActualsPostedEvent,
  alertService: BudgetAlertService,
  varianceService: VarianceService,
) {
  const { budgetId, lineItemId, amount, period } = event;

  // 1. Re-evaluate alert thresholds
  const newAlerts = await alertService.evaluate(budgetId);

  // 2. Log any new breaches
  for (const alert of newAlerts) {
    console.log(
      `[ALERT] ${alert.severity}: ${alert.message} ` +
      `(${alert.currentPercent}% spent, threshold ${alert.thresholdPercent}%)`
    );
  }

  // 3. Refresh variance cache for real-time dashboards
  await varianceService.evaluateAlerts(budgetId);
}
```

### Example 5: Depreciation Calculation Utility

```typescript
/**
 * Generate straight-line depreciation schedule.
 */
export function straightLineDepreciation(
  totalCost: number,
  salvageValue: number,
  usefulLifeMonths: number,
  startDate: Date,
): DepreciationEntry[] {
  const depreciableAmount = totalCost - salvageValue;
  const monthlyDepreciation = depreciableAmount / usefulLifeMonths;
  const entries: DepreciationEntry[] = [];
  let bookValue = totalCost;
  let accumulatedDep = 0;

  for (let i = 0; i < usefulLifeMonths; i++) {
    const date = new Date(startDate);
    date.setMonth(date.getMonth() + i);
    const period = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

    const expense = i === usefulLifeMonths - 1
      ? bookValue - salvageValue   // Last month: exact remainder
      : Math.round(monthlyDepreciation * 100) / 100;

    accumulatedDep += expense;
    bookValue -= expense;

    entries.push({
      period,
      beginningValue: bookValue + expense,
      depreciationExpense: expense,
      accumulatedDepreciation: accumulatedDep,
      endingValue: bookValue,
    });
  }

  return entries;
}
```

### Example 6: Consolidation with FX Translation

```typescript
import { ConsolidationService } from '@mcv/finance/budgeting';

async function consolidateGlobalVenture(consolidationSvc: ConsolidationService) {
  // Check which departments are ready
  const overview = await consolidationSvc.statusOverview('venture_global', '2026');

  if (!overview.canConsolidate) {
    console.log('Cannot consolidate. Blockers:');
    overview.blockers.forEach(b => console.log(`  - ${b}`));
    return null;
  }

  // Roll up with FX translation to USD
  const consolidated = await consolidationSvc.rollUp('venture_global', '2026', {
    currency: 'USD',
    fxRateDate: new Date(),
    autoDetectEliminations: true,
    carryForwardEliminations: true,
  });

  // Review FX adjustments
  consolidated.fxAdjustments.forEach(fx => {
    console.log(
      `${fx.entityId}: ${fx.sourceCurrency}→${fx.targetCurrency} ` +
      `@ ${fx.exchangeRate} | Adjustment: $${fx.adjustment}`
    );
  });

  // Publish when satisfied
  await consolidationSvc.publish(consolidated.id, 'user_cfo');
  return consolidated;
}
```

---

## Error Codes

| Code | HTTP | Description |
|------|------|-------------|
| `BUDGET_NOT_FOUND` | 404 | Budget ID does not exist or has been deleted |
| `BUDGET_DUPLICATE_PERIOD` | 409 | An active budget already exists for this entity+period combination |
| `BUDGET_INVALID_PERIOD` | 400 | Fiscal period format is malformed (expected `YYYY`, `YYYY-QN`, or `YYYY-MM`) |
| `BUDGET_INVALID_STATUS` | 400 | Operation not allowed in the budget's current lifecycle status |
| `BUDGET_INCOMPLETE` | 400 | Budget has required line items with zero amounts; cannot submit for approval |
| `BUDGET_LOCKED` | 403 | Budget is locked; unlock first to make modifications |
| `BUDGET_NOT_APPROVED` | 403 | Budget must be approved before it can be locked or activated |
| `APPROVAL_CHAIN_NOT_FOUND` | 404 | No approval chain configured for this entity type and amount range |
| `APPROVAL_UNAUTHORIZED` | 403 | User does not have the required role for the current approval step |
| `APPROVAL_ALREADY_ACTIONED` | 409 | This approval step has already been actioned |
| `BUDGET_ALREADY_SUBMITTED` | 409 | Budget is already in the approval workflow |
| `TRANSFER_INSUFFICIENT_BUDGET` | 400 | Source line item has insufficient remaining budget for the transfer amount |
| `TRANSFER_SAME_LINE` | 400 | Cannot transfer to the same line item |
| `TRANSFER_BUDGET_LOCKED` | 403 | Budget transfers not allowed on locked budgets without unlock |
| `FORECAST_IS_CURRENT` | 400 | Cannot delete the current active forecast; set another as current first |
| `FORECAST_NOT_FOUND` | 404 | Forecast ID does not exist |
| `SCENARIO_IS_BASELINE` | 400 | Cannot delete the baseline scenario; assign another first |
| `SCENARIO_NOT_FOUND` | 404 | Scenario ID does not exist |
| `CONSOLIDATION_NOT_READY` | 400 | Not all child budgets are approved/locked; check status overview for blockers |
| `CONSOLIDATION_ALREADY_PUBLISHED` | 409 | This consolidation is already published; create a new one |
| `CAPEX_INVALID_LIFECYCLE` | 400 | CapEx item cannot transition to the requested status from its current state |
| `PERIOD_LOCKED` | 403 | Cannot modify amounts for a locked (past) period |
| `ALERT_RULE_NOT_FOUND` | 404 | Alert rule ID does not exist |
| `LINE_ITEM_NOT_FOUND` | 404 | Budget line item ID does not exist or does not belong to the specified budget |
| `VENTURE_ACCESS_DENIED` | 403 | User is not a member of the venture that owns this budget |

---

## Security

### Row-Level Security (RLS)

All budget tables enforce RLS through Supabase. Users can only access budgets belonging to ventures where they are members.

```sql
-- Pattern used across all budget tables:
CREATE POLICY budget_access ON budget_budgets
  USING (venture_id IN (
    SELECT venture_id FROM venture_members WHERE user_id = auth.uid()
  ));
```

### Role-Based Access

| Action | Required Role |
|--------|--------------|
| View budgets | `budget.read` — any venture member |
| Create/edit draft | `budget.write` — department manager or above |
| Submit for approval | `budget.submit` — budget owner or delegate |
| Approve budget | `budget.approve` — per approval chain step role |
| Lock/unlock budget | `budget.lock` — CFO or VP Finance |
| Transfer between lines | `budget.transfer` — department manager + approval |
| Configure alerts | `budget.alerts` — budget owner or finance team |
| Consolidate budgets | `budget.consolidate` — CFO or controller |
| Delete/archive | `budget.admin` — venture admin or CFO |

### Audit Trail

Every mutation is logged to the `audit_events` table with:
- **Actor**: User ID and role at time of action
- **Action**: Create, update, submit, approve, reject, lock, transfer, etc.
- **Before/After**: JSON diff of changed fields
- **Timestamp**: Server-side UTC timestamp
- **IP/User Agent**: Request metadata

### Data Protection

- Budget amounts are stored as `NUMERIC(20,2)` to avoid floating-point precision issues
- Budget snapshots (in approvals and versions) are immutable JSONB blobs
- Soft deletes only — `deleted_at` column prevents hard deletion
- Sensitive fields (approval comments, rejection reasons) are included in audit but not exposed in public APIs

---

## Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `BUDGET_DATABASE_URL` | Yes | — | Supabase PostgreSQL connection string |
| `BUDGET_SUPABASE_KEY` | Yes | — | Supabase service role key for RLS bypass in server context |
| `BUDGET_DEFAULT_CURRENCY` | No | `USD` | Default currency for new budgets |
| `BUDGET_DEFAULT_GRANULARITY` | No | `monthly` | Default period granularity |
| `BUDGET_AUTO_LOCK_PAST_PERIODS` | No | `true` | Whether past periods are automatically locked |
| `BUDGET_ALERT_CHECK_INTERVAL_MS` | No | `300000` | Interval for periodic alert evaluation (5 min) |
| `BUDGET_ALERT_EMAIL_ENABLED` | No | `true` | Whether to send email notifications for alerts |
| `BUDGET_ALERT_SLACK_WEBHOOK` | No | — | Slack webhook URL for alert notifications |
| `BUDGET_MAX_SCENARIOS_PER_ENTITY` | No | `10` | Maximum number of scenarios per entity+period |
| `BUDGET_MAX_VERSIONS` | No | `50` | Maximum amendment versions before archival warning |
| `BUDGET_FORECAST_DEFAULT_METHOD` | No | `straight_line` | Default forecasting method |
| `BUDGET_CONSOLIDATION_FX_PROVIDER` | No | `ecb` | FX rate provider (`ecb`, `openexchangerates`, `manual`) |
| `BUDGET_CONSOLIDATION_FX_API_KEY` | No | — | API key for the FX rate provider |
| `BUDGET_APPROVAL_REMINDER_HOURS` | No | `24` | Hours before sending approval reminder |
| `BUDGET_DEPRECIATION_PRECISION` | No | `2` | Decimal places for depreciation calculations |
| `BUDGET_EVENT_BUS` | No | `internal` | Event bus provider (`internal`, `redis`, `kafka`) |

---

## Dependencies

### Internal Modules

| Module | Relationship | Purpose |
|--------|-------------|---------|
| `@mcv/finance/ledger` | **Reads from** | Actuals (posted journal entries) for variance computation |
| `@mcv/finance/chart-of-accounts` | **Reads from** | Account hierarchy for line item mapping |
| `@mcv/treasury/pnl` | **Feeds into** | Budget and forecast data for P&L reporting |
| `@mcv/treasury/cash-flow` | **Feeds into** | Budget projections for cash flow planning |
| `@mcv/iam` | **Reads from** | User roles, permissions, venture membership |
| `@mcv/notifications` | **Sends to** | Alert delivery (email, Slack, in-app) |
| `@mcv/audit` | **Sends to** | Audit trail for all budget mutations |
| `@mcv/ventures` | **Reads from** | Venture and department hierarchy |

### External Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| `@supabase/supabase-js` | `^2.x` | Database client with RLS |
| `@trpc/server` | `^10.x` | API router |
| `zod` | `^3.x` | Input validation |
| `date-fns` | `^3.x` | Date/period manipulation |
| `decimal.js` | `^10.x` | Precise financial arithmetic |
| `mathjs` | `^12.x` | Linear regression, statistical forecasting |
| `eventemitter3` | `^5.x` | Domain event bus |

---

## Testing

### Unit Tests

```typescript
describe('BudgetService', () => {
  describe('create', () => {
    it('should create a draft budget with correct defaults', async () => {
      const budget = await budgetService.create({
        ventureId: 'v1', entityId: 'd1', entityType: 'department',
        name: 'Test Budget', fiscalYear: '2026', fiscalPeriod: '2026',
        granularity: 'monthly', methodology: 'bottom_up',
        currency: 'USD', createdBy: 'u1',
      });
      expect(budget.status).toBe('draft');
      expect(budget.version).toBe(1);
      expect(budget.totalAmount).toBe(0);
    });

    it('should reject duplicate entity+period budgets', async () => {
      await budgetService.create({ /* ... same entity+period ... */ });
      await expect(
        budgetService.create({ /* ... same entity+period ... */ })
      ).rejects.toThrow('BUDGET_DUPLICATE_PERIOD');
    });
  });

  describe('submit', () => {
    it('should reject incomplete budgets with zero-amount required lines', async () => {
      const budget = await createDraftBudgetWithEmptyLines();
      await expect(
        budgetService.submit(budget.id, 'u1')
      ).rejects.toThrow('BUDGET_INCOMPLETE');
    });

    it('should transition status from draft to pending_approval', async () => {
      const budget = await createPopulatedDraftBudget();
      const submitted = await budgetService.submit(budget.id, 'u1');
      expect(submitted.status).toBe('pending_approval');
    });
  });

  describe('lock', () => {
    it('should only lock approved budgets', async () => {
      const draft = await createDraftBudget();
      await expect(
        budgetService.lock(draft.id, 'u1')
      ).rejects.toThrow('BUDGET_NOT_APPROVED');
    });
  });
});

describe('VarianceService', () => {
  describe('compute', () => {
    it('should compute correct variance with mixed over/under lines', async () => {
      const report = await varianceService.compute(budgetWithActuals.id, {});
      expect(report.summary.totalVariance).toBe(
        report.summary.totalActual - report.summary.totalBudget
      );
      expect(report.summary.overBudgetCount).toBeGreaterThan(0);
    });

    it('should flag lines exceeding alert thresholds', async () => {
      const report = await varianceService.compute(budgetAt90Percent.id, {});
      expect(report.activeAlerts.length).toBeGreaterThan(0);
      expect(report.activeAlerts[0].severity).toBe('warning');
    });
  });

  describe('drillDown', () => {
    it('should return matching ledger transactions', async () => {
      const detail = await varianceService.drillDown('line_cloud', '2026-02');
      expect(detail.transactions).toBeDefined();
      expect(detail.transactions!.length).toBeGreaterThan(0);
      const txnTotal = detail.transactions!.reduce((s, t) => s + t.amount, 0);
      expect(txnTotal).toBe(detail.actualAmount);
    });
  });
});

describe('ForecastService', () => {
  describe('rolling', () => {
    it('should use actuals for elapsed periods', async () => {
      const forecast = await forecastService.rolling(budgetId, 12, 'trend_linear');
      const elapsed = forecast.entries.filter(e => e.actualAmount !== null);
      elapsed.forEach(e => {
        expect(e.forecastAmount).toBe(e.actualAmount);
        expect(e.confidence).toBe(1.0);
      });
    });
  });

  describe('whatIf', () => {
    it('should apply percentage adjustment to target lines', async () => {
      const base = await forecastService.generate(budgetId, { method: 'straight_line' });
      const adjusted = await forecastService.whatIf(base.id, [{
        type: 'percentage', target: 'all', value: 0.10,
        periods: 'remaining', description: '+10% test',
      }]);
      expect(adjusted.totalForecast).toBeGreaterThan(base.totalForecast);
    });
  });
});

describe('BudgetTransferService', () => {
  it('should reject transfer exceeding source remaining', async () => {
    await expect(
      transferService.request({
        budgetId, fromLineItemId: 'line_small', toLineItemId: 'line_big',
        amount: 999_999, reason: 'Too much', requestedBy: 'u1',
      })
    ).rejects.toThrow('TRANSFER_INSUFFICIENT_BUDGET');
  });

  it('should adjust both line items after approval', async () => {
    const transfer = await transferService.request({
      budgetId, fromLineItemId: 'line_a', toLineItemId: 'line_b',
      amount: 5_000, period: '2026-03', reason: 'Reallocation', requestedBy: 'u1',
    });
    await transferService.approve(transfer.id, 'approver', 'OK');

    const lineA = await getLineItem('line_a');
    const lineB = await getLineItem('line_b');
    expect(lineA.periods.find(p => p.period === '2026-03')!.budgetAmount).toBe(originalA - 5_000);
    expect(lineB.periods.find(p => p.period === '2026-03')!.budgetAmount).toBe(originalB + 5_000);
  });
});

describe('ConsolidationService', () => {
  it('should not consolidate when child budgets are missing', async () => {
    const overview = await consolidationService.statusOverview('venture_01', '2026');
    if (overview.missingChildren > 0) {
      expect(overview.canConsolidate).toBe(false);
    }
  });

  it('should apply FX translation for multi-currency children', async () => {
    const consolidated = await consolidationService.rollUp('venture_global', '2026', {
      currency: 'USD',
    });
    expect(consolidated.fxAdjustments.length).toBeGreaterThan(0);
    consolidated.fxAdjustments.forEach(fx => {
      expect(fx.targetCurrency).toBe('USD');
      expect(fx.translatedAmount).toBeCloseTo(fx.originalAmount * fx.exchangeRate, 2);
    });
  });
});
```

### Integration Tests

```typescript
describe('Budget Integration', () => {
  it('should flow from creation through PnL registration', async () => {
    // Create → populate → submit → approve → lock → verify PnL picks it up
    const budget = await budgetService.create({ /* ... */ });
    await populateBudget(budget.id);
    await budgetService.submit(budget.id, 'u1');
    await approvalService.approve(/* ... */);
    await budgetService.lock(budget.id, 'cfo');

    // Verify PnL received the budget data
    const pnl = await pnlService.getBudgetData(budget.entityId, budget.fiscalPeriod);
    expect(pnl).toBeDefined();
    expect(pnl.totalBudget).toBe(budget.totalAmount);
  });

  it('should trigger alerts when actuals exceed thresholds', async () => {
    await alertService.setupDefaults(budget.id, 'venture_01');
    await postActuals(budget.id, 'line_cloud', 38_000); // 84% of $45K budget
    const alerts = await alertService.getActive(budget.id);
    expect(alerts.some(a => a.severity === 'warning')).toBe(true);
  });
});
```

### Test Fixtures

```typescript
export const testBudgetFixtures = {
  draftBudget: {
    ventureId: 'test_venture',
    entityId: 'test_dept',
    entityType: 'department' as const,
    name: 'Test Budget',
    fiscalYear: '2026',
    fiscalPeriod: '2026',
    granularity: 'monthly' as const,
    methodology: 'bottom_up' as const,
    currency: 'USD',
    status: 'draft' as const,
    version: 1,
  },

  lineItems: [
    { accountCode: '5100', accountName: 'Salaries', annualTotal: 1_800_000, isSummary: false },
    { accountCode: '6100', accountName: 'Software', annualTotal: 240_000, isSummary: false },
    { accountCode: '6200', accountName: 'Cloud', annualTotal: 540_000, isSummary: false },
    { accountCode: '7100', accountName: 'Travel', annualTotal: 120_000, isSummary: false },
  ],

  approvalChain: {
    name: 'Test Chain',
    entityType: 'department' as const,
    mode: 'sequential' as const,
    steps: [
      { order: 1, name: 'Manager', role: 'manager', userId: null, minAmount: null, canSkip: false },
      { order: 2, name: 'Director', role: 'director', userId: null, minAmount: 100_000, canSkip: false },
    ],
  },
};
```

---

## Changelog

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2026-01-15 | Initial release — budget CRUD, line items, basic approval |
| 1.1.0 | 2026-02-01 | Added forecasting (rolling, what-if), variance tracking |
| 1.2.0 | 2026-02-08 | Scenario planning, multi-scenario comparison, weighted average |
| 1.3.0 | TBD | Capital budgeting (CapEx, ROI, depreciation) |
| 1.4.0 | TBD | Consolidation (roll-up, FX translation, eliminations) |
| 1.5.0 | TBD | Budget alerts (configurable thresholds, multi-channel notification) |
| 2.0.0 | TBD | Multi-year budgets, driver-based planning, AI-assisted forecasting |
