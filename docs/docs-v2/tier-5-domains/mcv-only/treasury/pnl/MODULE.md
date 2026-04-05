# @mcv/treasury/pnl

> **Tier 5 — MCV-Only Domain**
> Consolidated Profit & Loss across all MCV ventures

**Owner:** Treasury · **Since:** 0.1.0 · **Status:** Stable
**Depends on:** `@mcv/finance`, `@mcv/treasury/core`, `@mcv/auth`, `@mcv/db`

---

## Purpose

The `@mcv/treasury/pnl` module is the financial consolidation engine for the entire MCV ecosystem. It aggregates revenue, cost of goods sold, gross profit, operating expenses, EBITDA, and net income from all nine MCV ventures into a unified, auditable consolidated Profit & Loss statement. This is the single source of truth for understanding the financial performance of MCV as a holding entity — collapsing nine independent businesses into one coherent financial picture that satisfies internal management needs, board governance requirements, and investor reporting obligations.

Consolidation at the MCV level is non-trivial. The nine ventures transact with each other extensively: shared infrastructure costs flow between them, transfer pricing governs inter-company service agreements, and corporate overhead must be allocated fairly. The P&L module handles all of this — performing inter-company eliminations to remove double-counted revenue and expense, allocating shared costs according to configurable methodologies, and applying ASC 606-compliant revenue recognition rules that vary by venture and business line. The result is a set of financial statements that are clean, accurate, and defensible under audit.

Beyond raw consolidation, this module powers the full management reporting stack. The CFO dashboard, board-ready financial packages, segment reporting by venture or geography, variance analysis against budget and forecast — all of it flows through `@mcv/treasury/pnl`. Financial periods are managed with strict close and lock semantics, ensuring that once a period is finalized, no unauthorized adjustments can alter the historical record. Every mutation leaves an audit trail, every elimination is traceable, and every report is reproducible from the underlying journal entries.

---

## Exports

```typescript
// @mcv/treasury/pnl — public API

// ── Core Services ──────────────────────────────────────────────
export { PnLService }                    from './services/pnl.service';
export { ConsolidationEngine }           from './services/consolidation.engine';
export { EliminationService }            from './services/elimination.service';
export { VarianceAnalysisService }       from './services/variance-analysis.service';
export { SegmentReportingService }       from './services/segment-reporting.service';
export { RevenueRecognitionService }     from './services/revenue-recognition.service';
export { CostAllocationService }        from './services/cost-allocation.service';
export { FinancialPeriodService }       from './services/financial-period.service';
export { ManagementReportService }      from './services/management-report.service';
export { AuditService }                 from './services/audit.service';
export { BoardReportService }           from './services/board-report.service';

// ── Types & Interfaces ────────────────────────────────────────
export type {
  ConsolidatedStatement,
  SegmentReport,
  SegmentDimension,
  Elimination,
  EliminationRule,
  EliminationEntry,
  VarianceAnalysis,
  VarianceRecord,
  VarianceDimension,
  FinancialPeriod,
  PeriodStatus,
  PeriodCloseChecklist,
  CostAllocation,
  AllocationMethod,
  AllocationBasis,
  ReportConfig,
  ReportSchedule,
  ReportDistribution,
  BoardPackage,
  IncomeStatement,
  BalanceSheet,
  CashFlowStatement,
  RevenueRecognitionRule,
  RevenueSchedule,
  AuditEntry,
  AdjustmentJournal,
  ReconciliationRecord,
  PnLLineItem,
  PnLCategory,
  VentureFinancials,
  ConsolidationConfig,
} from './types';

// ── Schemas (Drizzle ORM) ─────────────────────────────────────
export {
  consolidatedStatements,
  segmentResults,
  eliminations,
  eliminationRules,
  varianceRecords,
  financialPeriods,
  costAllocations,
  allocationBases,
  reportConfigs,
  reportSchedules,
  reportDistributions,
  revenueRecognitionRules,
  revenueSchedules,
  auditEntries,
  adjustmentJournals,
  reconciliationRecords,
  pnlLineItems,
} from './schemas';

// ── tRPC Router ───────────────────────────────────────────────
export { pnlRouter }                    from './router';

// ── Constants ─────────────────────────────────────────────────
export { PNL_ERROR_CODES }              from './constants/error-codes';
export { LINE_ITEM_TAXONOMY }           from './constants/taxonomy';
export { ALLOCATION_METHODS }           from './constants/allocation';
export { DEFAULT_ELIMINATION_RULES }    from './constants/eliminations';

// ── Utilities ─────────────────────────────────────────────────
export { formatBoardPackage }           from './utils/board-format';
export { calculateVariances }           from './utils/variance';
export { buildConsolidationTree }       from './utils/consolidation-tree';
export { applyEliminations }            from './utils/apply-eliminations';
export { allocateCosts }                from './utils/allocate-costs';
export { recognizeRevenue }             from './utils/recognize-revenue';
```

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        @mcv/treasury/pnl                                    │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │                     VENTURE FINANCIALS INPUT                        │    │
│  │                                                                     │    │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ │    │
│  │  │Venture 1 │ │Venture 2 │ │Venture 3 │ │   ...    │ │Venture 9 │ │    │
│  │  │ Rev/COGS │ │ Rev/COGS │ │ Rev/COGS │ │          │ │ Rev/COGS │ │    │
│  │  │ OpEx/NI  │ │ OpEx/NI  │ │ OpEx/NI  │ │          │ │ OpEx/NI  │ │    │
│  │  └────┬─────┘ └────┬─────┘ └────┬─────┘ └────┬─────┘ └────┬─────┘ │    │
│  └───────┼─────────────┼───────────┼────────────┼────────────┼────────┘    │
│          │             │           │            │            │              │
│          ▼             ▼           ▼            ▼            ▼              │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │                      AGGREGATION LAYER                              │    │
│  │                                                                     │    │
│  │  ┌─────────────────┐  ┌──────────────────┐  ┌───────────────────┐  │    │
│  │  │  Revenue Recog.  │  │  Cost Allocation  │  │  Line Item Map   │  │    │
│  │  │  (ASC 606)       │  │  (Shared Costs)   │  │  (Taxonomy)      │  │    │
│  │  └────────┬─────────┘  └────────┬──────────┘  └────────┬─────────┘  │    │
│  └───────────┼──────────────────────┼──────────────────────┼───────────┘    │
│              │                      │                      │                │
│              ▼                      ▼                      ▼                │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │                    ELIMINATION ENGINE                                │    │
│  │                                                                     │    │
│  │  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐  │    │
│  │  │ Inter-Co Revenue │  │ Transfer Pricing  │  │ Shared Service   │  │    │
│  │  │  Eliminations    │  │  Adjustments      │  │  Eliminations    │  │    │
│  │  └────────┬─────────┘  └────────┬──────────┘  └────────┬─────────┘  │    │
│  └───────────┼──────────────────────┼──────────────────────┼───────────┘    │
│              │                      │                      │                │
│              ▼                      ▼                      ▼                │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │                   CONSOLIDATION ENGINE                               │    │
│  │                                                                     │    │
│  │  ┌──────────────┐  ┌───────────────┐  ┌────────────────────────┐   │    │
│  │  │  Consolidated │  │  Segment      │  │  Variance Analysis     │   │    │
│  │  │  P&L Builder  │  │  Breakdowns   │  │  (Budget vs Actual)    │   │    │
│  │  └──────┬────────┘  └──────┬────────┘  └──────────┬─────────────┘   │    │
│  └─────────┼──────────────────┼──────────────────────┼─────────────────┘    │
│            │                  │                      │                      │
│            ▼                  ▼                      ▼                      │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │                      REPORTING LAYER                                │    │
│  │                                                                     │    │
│  │  ┌────────────┐ ┌──────────────┐ ┌────────────┐ ┌───────────────┐  │    │
│  │  │  Income     │ │  Board       │ │  Mgmt      │ │  Investor     │  │    │
│  │  │  Statement  │ │  Package     │ │  Reports   │ │  Relations    │  │    │
│  │  └────────────┘ └──────────────┘ └────────────┘ └───────────────┘  │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │                      AUDIT & CONTROL                                │    │
│  │                                                                     │    │
│  │  ┌────────────┐ ┌──────────────┐ ┌────────────┐ ┌───────────────┐  │    │
│  │  │  Period     │ │  Audit       │ │  Adjustment│ │  Reconcile    │  │    │
│  │  │  Management │ │  Trail       │ │  Journals  │ │  Helpers      │  │    │
│  │  └────────────┘ └──────────────┘ └────────────┘ └───────────────┘  │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────────────────┘

Data Flow:
  @mcv/finance (GL) ──► Venture Trial Balances ──► Aggregation
       ──► Revenue Recognition ──► Cost Allocation ──► Eliminations
       ──► Consolidation ──► Reports ──► Distribution
```

---

## Core Interfaces

### PnLService

The primary orchestration service that coordinates consolidation, reporting, and period management.

```typescript
interface PnLService {
  // ── Consolidation ───────────────────────────────────────────
  /**
   * Generate a consolidated P&L for the given period.
   * Pulls venture financials, applies revenue recognition,
   * allocates shared costs, eliminates inter-company, and
   * produces the final consolidated statement.
   */
  consolidate(params: {
    periodId: string;
    ventureIds?: string[];          // defaults to all 9
    includeEliminations?: boolean;  // defaults to true
    draft?: boolean;                // draft vs finalized
  }): Promise<ConsolidatedStatement>;

  /**
   * Re-consolidate a period after adjustments.
   * Only works if period is not locked.
   */
  reconsolidate(params: {
    periodId: string;
    reason: string;
  }): Promise<ConsolidatedStatement>;

  // ── Segment Reporting ───────────────────────────────────────
  getSegmentReport(params: {
    periodId: string;
    dimension: SegmentDimension;
    filters?: SegmentFilter[];
  }): Promise<SegmentReport>;

  // ── Variance Analysis ───────────────────────────────────────
  analyzeVariance(params: {
    periodId: string;
    compareTo: VarianceComparison;
    threshold?: number;             // flag variances above this %
    dimensions?: VarianceDimension[];
  }): Promise<VarianceAnalysis>;

  // ── Reporting ───────────────────────────────────────────────
  generateIncomeStatement(params: {
    periodId: string;
    format?: 'summary' | 'detailed' | 'board';
    comparative?: boolean;          // include prior period
  }): Promise<IncomeStatement>;

  generateBoardPackage(params: {
    periodId: string;
    sections?: BoardPackageSection[];
  }): Promise<BoardPackage>;

  // ── Period Management ───────────────────────────────────────
  closePeriod(params: {
    periodId: string;
    closedBy: string;
    checklist: PeriodCloseChecklist;
  }): Promise<FinancialPeriod>;

  lockPeriod(params: {
    periodId: string;
    lockedBy: string;
    reason: string;
  }): Promise<FinancialPeriod>;

  unlockPeriod(params: {
    periodId: string;
    unlockedBy: string;
    reason: string;
    approvedBy: string;             // requires CFO or CEO approval
  }): Promise<FinancialPeriod>;
}
```

### ConsolidatedStatement

```typescript
interface ConsolidatedStatement {
  id: string;
  periodId: string;
  period: FinancialPeriod;
  orgId: string;                    // MCV org

  // ── Header ──────────────────────────────────────────────────
  statementDate: Date;
  generatedAt: Date;
  generatedBy: string;
  status: 'draft' | 'reviewed' | 'approved' | 'finalized';
  version: number;                  // increments on reconsolidation

  // ── Line Items ──────────────────────────────────────────────
  lineItems: PnLLineItem[];

  // ── Summary Totals ──────────────────────────────────────────
  totalRevenue: Decimal;
  totalCOGS: Decimal;
  grossProfit: Decimal;
  grossMargin: Decimal;            // percentage
  totalOpEx: Decimal;
  operatingIncome: Decimal;        // EBIT
  ebitda: Decimal;
  depreciationAmortization: Decimal;
  interestExpense: Decimal;
  interestIncome: Decimal;
  otherIncomeExpense: Decimal;
  preTaxIncome: Decimal;
  taxExpense: Decimal;
  netIncome: Decimal;
  netMargin: Decimal;              // percentage

  // ── Breakdown ───────────────────────────────────────────────
  ventureBreakdown: VentureFinancials[];
  eliminationTotal: Decimal;
  eliminations: EliminationEntry[];
  costAllocations: CostAllocation[];

  // ── Metadata ────────────────────────────────────────────────
  notes: string[];
  adjustments: AdjustmentJournal[];
  auditTrail: AuditEntry[];
}

interface PnLLineItem {
  id: string;
  statementId: string;
  category: PnLCategory;
  subcategory: string;
  lineNumber: number;              // display order
  label: string;
  description?: string;

  // ── Amounts ─────────────────────────────────────────────────
  grossAmount: Decimal;            // before eliminations
  eliminationAmount: Decimal;      // inter-company removed
  allocationAmount: Decimal;       // shared cost allocated
  netAmount: Decimal;              // final consolidated amount

  // ── Venture Detail ──────────────────────────────────────────
  ventureAmounts: Record<string, Decimal>; // ventureId → amount

  // ── Comparatives ────────────────────────────────────────────
  priorPeriodAmount?: Decimal;
  budgetAmount?: Decimal;
  forecastAmount?: Decimal;

  isSubtotal: boolean;
  isTotal: boolean;
  indent: number;                  // nesting level for display
}

type PnLCategory =
  | 'revenue'
  | 'cogs'
  | 'gross_profit'
  | 'opex_sales_marketing'
  | 'opex_research_development'
  | 'opex_general_admin'
  | 'opex_other'
  | 'total_opex'
  | 'operating_income'
  | 'depreciation_amortization'
  | 'ebitda'
  | 'interest_income'
  | 'interest_expense'
  | 'other_income_expense'
  | 'pre_tax_income'
  | 'tax_expense'
  | 'net_income';
```

### SegmentReport

```typescript
type SegmentDimension = 'venture' | 'business_line' | 'geography' | 'product' | 'customer_type';

interface SegmentReport {
  id: string;
  periodId: string;
  dimension: SegmentDimension;
  generatedAt: Date;

  segments: Segment[];
  totalRevenue: Decimal;
  totalNetIncome: Decimal;

  // ── Cross-segment comparison ────────────────────────────────
  revenueConcentration: ConcentrationMetric[];  // HHI, top-N %
  profitabilityRanking: SegmentRanking[];
}

interface Segment {
  segmentId: string;
  segmentName: string;
  dimension: SegmentDimension;

  revenue: Decimal;
  cogs: Decimal;
  grossProfit: Decimal;
  grossMargin: Decimal;
  opex: Decimal;
  operatingIncome: Decimal;
  netIncome: Decimal;
  netMargin: Decimal;

  // ── Contribution ────────────────────────────────────────────
  revenueShare: Decimal;           // % of total revenue
  profitContribution: Decimal;     // % of total net income

  // ── Trend ───────────────────────────────────────────────────
  revenueGrowth?: Decimal;         // vs prior period
  marginTrend?: Decimal;           // vs prior period

  lineItems: PnLLineItem[];
}

interface ConcentrationMetric {
  metricName: string;              // 'hhi', 'top_3_revenue_pct', etc.
  value: Decimal;
  threshold: Decimal;
  status: 'healthy' | 'warning' | 'critical';
}

interface SegmentRanking {
  segmentId: string;
  segmentName: string;
  rank: number;
  metric: string;
  value: Decimal;
}
```

### Elimination

```typescript
interface Elimination {
  id: string;
  periodId: string;
  ruleId: string;
  rule: EliminationRule;

  // ── Parties ─────────────────────────────────────────────────
  sourceVentureId: string;         // venture recognizing revenue
  targetVentureId: string;         // venture recording expense
  description: string;

  // ── Amounts ─────────────────────────────────────────────────
  revenueEliminated: Decimal;
  expenseEliminated: Decimal;
  netImpact: Decimal;              // should be zero for balanced elim

  // ── Detail ──────────────────────────────────────────────────
  entries: EliminationEntry[];
  status: 'pending' | 'applied' | 'reversed' | 'disputed';
  appliedAt?: Date;
  appliedBy?: string;

  // ── Audit ───────────────────────────────────────────────────
  sourceTransactionIds: string[];  // original GL entries
  notes?: string;
}

interface EliminationRule {
  id: string;
  orgId: string;
  name: string;
  description: string;
  type: EliminationType;

  // ── Matching Criteria ───────────────────────────────────────
  sourceVentureId?: string;        // null = any venture
  targetVentureId?: string;        // null = any venture
  accountPattern: string;          // regex or GL account range
  minAmount?: Decimal;             // only eliminate above threshold
  autoApply: boolean;              // auto-apply during consolidation

  // ── Scheduling ──────────────────────────────────────────────
  effectiveFrom: Date;
  effectiveTo?: Date;
  isActive: boolean;

  createdAt: Date;
  updatedAt: Date;
}

type EliminationType =
  | 'inter_company_revenue'        // A sells to B → remove from consolidated
  | 'inter_company_expense'        // corresponding expense side
  | 'transfer_pricing'             // markup adjustments between ventures
  | 'shared_services'              // corporate services charged to ventures
  | 'inter_company_loan'           // interest on inter-company loans
  | 'dividend_elimination'         // dividends between parent/subsidiary
  | 'unrealized_profit';           // profit on inter-company inventory

interface EliminationEntry {
  id: string;
  eliminationId: string;
  accountCode: string;
  accountName: string;
  debit: Decimal;
  credit: Decimal;
  ventureId: string;
  description: string;
}
```

### VarianceAnalysis

```typescript
type VarianceComparison =
  | { type: 'budget_vs_actual' }
  | { type: 'forecast_vs_actual' }
  | { type: 'period_over_period'; priorPeriodId: string }
  | { type: 'plan_vs_forecast' }
  | { type: 'year_over_year'; priorYearPeriodId: string };

type VarianceDimension = 'line_item' | 'venture' | 'department' | 'geography';

interface VarianceAnalysis {
  id: string;
  periodId: string;
  comparison: VarianceComparison;
  generatedAt: Date;

  // ── Summary ─────────────────────────────────────────────────
  totalVariance: Decimal;
  totalVariancePercent: Decimal;
  favorableCount: number;
  unfavorableCount: number;
  materialVarianceCount: number;   // above threshold

  // ── Detail ──────────────────────────────────────────────────
  records: VarianceRecord[];
  topFavorable: VarianceRecord[];  // top 5 favorable
  topUnfavorable: VarianceRecord[]; // top 5 unfavorable

  // ── Waterfall ───────────────────────────────────────────────
  waterfallData: WaterfallStep[];  // for visualization
}

interface VarianceRecord {
  id: string;
  analysisId: string;
  dimension: VarianceDimension;
  dimensionId: string;             // ventureId, line item id, etc.
  dimensionLabel: string;

  // ── Amounts ─────────────────────────────────────────────────
  baseAmount: Decimal;             // budget/forecast/prior
  actualAmount: Decimal;
  varianceAmount: Decimal;
  variancePercent: Decimal;

  // ── Classification ──────────────────────────────────────────
  direction: 'favorable' | 'unfavorable' | 'neutral';
  isMaterial: boolean;             // exceeds threshold
  category: PnLCategory;

  // ── Explanation ─────────────────────────────────────────────
  explanation?: string;            // management commentary
  driverAnalysis?: VarianceDriver[];
  actionRequired: boolean;
  assignedTo?: string;
}

interface VarianceDriver {
  driver: string;                  // 'volume', 'price', 'mix', 'timing', 'one_time'
  impact: Decimal;
  description: string;
}

interface WaterfallStep {
  label: string;
  startValue: Decimal;
  endValue: Decimal;
  delta: Decimal;
  type: 'increase' | 'decrease' | 'subtotal';
}
```

### FinancialPeriod

```typescript
type PeriodType = 'month' | 'quarter' | 'half_year' | 'year';
type PeriodStatus = 'future' | 'open' | 'soft_close' | 'hard_close' | 'locked';

interface FinancialPeriod {
  id: string;
  orgId: string;

  // ── Period Identity ─────────────────────────────────────────
  fiscalYear: number;              // e.g., 2026
  fiscalQuarter: number;           // 1-4
  fiscalMonth: number;             // 1-12
  periodType: PeriodType;
  periodLabel: string;             // "FY2026 Q1", "Jan 2026"
  startDate: Date;
  endDate: Date;

  // ── Status ──────────────────────────────────────────────────
  status: PeriodStatus;
  openedAt?: Date;
  softClosedAt?: Date;
  hardClosedAt?: Date;
  lockedAt?: Date;

  // ── Close Process ───────────────────────────────────────────
  closeChecklist: PeriodCloseChecklist;
  closedBy?: string;
  lockApprovedBy?: string;

  // ── Consolidation ───────────────────────────────────────────
  consolidatedStatementId?: string;
  isConsolidated: boolean;
  consolidatedAt?: Date;

  createdAt: Date;
  updatedAt: Date;
}

interface PeriodCloseChecklist {
  allVenturesReported: boolean;
  revenueRecognized: boolean;
  costsAllocated: boolean;
  eliminationsApplied: boolean;
  varianceReviewed: boolean;
  adjustmentsPosted: boolean;
  reconciliationComplete: boolean;
  managementReviewComplete: boolean;
  approverSignoff: boolean;

  items: PeriodCloseItem[];
}

interface PeriodCloseItem {
  id: string;
  task: string;
  description: string;
  assignedTo: string;
  status: 'pending' | 'in_progress' | 'complete' | 'blocked' | 'not_applicable';
  completedAt?: Date;
  completedBy?: string;
  notes?: string;
  isRequired: boolean;
  order: number;
}
```

### RevenueRecognitionRule

```typescript
interface RevenueRecognitionRule {
  id: string;
  orgId: string;
  ventureId: string;
  name: string;
  description: string;

  // ── ASC 606 Five-Step Model ─────────────────────────────────
  contractIdentification: {
    criteria: string[];             // how to identify the contract
    accountPatterns: string[];      // GL accounts that trigger this rule
  };

  performanceObligations: {
    obligations: PerformanceObligation[];
    bundledArrangement: boolean;    // multiple deliverables?
  };

  transactionPrice: {
    fixedAmount?: Decimal;
    variableConsideration?: VariableConsideration;
    significantFinancingComponent: boolean;
  };

  allocationMethod: 'standalone_selling_price' | 'residual' | 'adjusted_market';

  recognitionTiming: 'point_in_time' | 'over_time';
  recognitionMethod?: 'output' | 'input' | 'straight_line' | 'milestone';

  // ── Scheduling ──────────────────────────────────────────────
  effectiveFrom: Date;
  effectiveTo?: Date;
  isActive: boolean;

  createdAt: Date;
  updatedAt: Date;
}

interface PerformanceObligation {
  id: string;
  description: string;
  standaloneSellingPrice: Decimal;
  isDistinct: boolean;
  satisfactionCriteria: string;
  timing: 'point_in_time' | 'over_time';
}

interface VariableConsideration {
  estimationMethod: 'expected_value' | 'most_likely_amount';
  constraint: boolean;              // apply constraint?
  minEstimate: Decimal;
  maxEstimate: Decimal;
  bestEstimate: Decimal;
}

interface RevenueSchedule {
  id: string;
  ruleId: string;
  contractId: string;
  ventureId: string;

  totalContractValue: Decimal;
  recognizedToDate: Decimal;
  deferredRevenue: Decimal;
  unbilledRevenue: Decimal;

  schedule: RevenueScheduleEntry[];
}

interface RevenueScheduleEntry {
  periodId: string;
  amount: Decimal;
  cumulativeAmount: Decimal;
  percentComplete: Decimal;
  status: 'scheduled' | 'recognized' | 'adjusted' | 'reversed';
  recognizedAt?: Date;
}
```

### CostAllocation

```typescript
type AllocationMethod =
  | 'headcount'                    // proportional to venture headcount
  | 'revenue'                      // proportional to venture revenue
  | 'direct_usage'                 // metered usage (compute, storage, etc.)
  | 'equal_split'                  // evenly across ventures
  | 'custom_weight'               // manually defined weights
  | 'activity_based'              // ABC costing
  | 'square_footage';             // physical space usage

interface CostAllocation {
  id: string;
  periodId: string;
  orgId: string;

  // ── What's Being Allocated ──────────────────────────────────
  costPoolId: string;
  costPoolName: string;            // "Corporate Overhead", "Infrastructure"
  totalAmount: Decimal;
  currency: string;

  // ── Method ──────────────────────────────────────────────────
  method: AllocationMethod;
  basis: AllocationBasis;

  // ── Distribution ────────────────────────────────────────────
  allocations: VentureAllocation[];

  // ── Metadata ────────────────────────────────────────────────
  status: 'draft' | 'applied' | 'reversed';
  appliedAt?: Date;
  appliedBy?: string;
  notes?: string;

  createdAt: Date;
  updatedAt: Date;
}

interface AllocationBasis {
  id: string;
  method: AllocationMethod;
  periodId: string;

  // ── Basis Data ──────────────────────────────────────────────
  ventureWeights: Record<string, Decimal>; // ventureId → weight/metric
  totalWeight: Decimal;

  // ── Source ──────────────────────────────────────────────────
  dataSource: string;              // where the basis data came from
  asOfDate: Date;
  isVerified: boolean;
  verifiedBy?: string;
}

interface VentureAllocation {
  ventureId: string;
  ventureName: string;
  weight: Decimal;
  weightPercent: Decimal;
  allocatedAmount: Decimal;
  priorPeriodAmount?: Decimal;     // for comparison
}
```

### AuditSupport

```typescript
interface AuditEntry {
  id: string;
  orgId: string;
  entityType: 'statement' | 'elimination' | 'allocation' | 'period' | 'adjustment' | 'report';
  entityId: string;

  action: 'create' | 'update' | 'delete' | 'approve' | 'reject' | 'lock' | 'unlock' | 'close' | 'reopen';
  performedBy: string;
  performedAt: Date;

  previousValue?: Record<string, unknown>;
  newValue?: Record<string, unknown>;
  changeDescription: string;
  reason?: string;

  ipAddress?: string;
  userAgent?: string;
  sessionId?: string;
}

interface AdjustmentJournal {
  id: string;
  periodId: string;
  orgId: string;
  statementId: string;

  // ── Adjustment Detail ───────────────────────────────────────
  adjustmentType: 'top_side' | 'reclassification' | 'correction' | 'accrual' | 'reversal';
  description: string;
  justification: string;

  entries: AdjustmentEntry[];
  totalDebits: Decimal;
  totalCredits: Decimal;
  isBalanced: boolean;             // debits === credits

  // ── Approval ────────────────────────────────────────────────
  status: 'draft' | 'pending_approval' | 'approved' | 'rejected' | 'posted' | 'reversed';
  requestedBy: string;
  requestedAt: Date;
  approvedBy?: string;
  approvedAt?: Date;
  postedAt?: Date;

  // ── Reversal ────────────────────────────────────────────────
  isAutoReversing: boolean;
  reversalPeriodId?: string;
  reversalJournalId?: string;
}

interface AdjustmentEntry {
  id: string;
  journalId: string;
  accountCode: string;
  accountName: string;
  ventureId: string;
  debit: Decimal;
  credit: Decimal;
  description: string;
}

interface ReconciliationRecord {
  id: string;
  periodId: string;
  orgId: string;

  reconType: 'inter_company' | 'bank' | 'revenue' | 'expense' | 'balance_sheet';
  description: string;

  sourceSystem: string;
  sourceBalance: Decimal;
  targetSystem: string;
  targetBalance: Decimal;
  difference: Decimal;

  status: 'unreconciled' | 'in_progress' | 'reconciled' | 'exception';
  reconciledBy?: string;
  reconciledAt?: Date;

  items: ReconciliationItem[];
  exceptions: ReconciliationException[];
}

interface ReconciliationItem {
  id: string;
  recordId: string;
  sourceRef: string;
  targetRef: string;
  amount: Decimal;
  matchType: 'exact' | 'partial' | 'manual';
  status: 'matched' | 'unmatched' | 'exception';
}

interface ReconciliationException {
  id: string;
  recordId: string;
  description: string;
  amount: Decimal;
  resolution?: string;
  resolvedBy?: string;
  resolvedAt?: Date;
}
```

### Management Reporting

```typescript
interface ReportConfig {
  id: string;
  orgId: string;
  name: string;
  description: string;
  reportType: ReportType;

  // ── Structure ───────────────────────────────────────────────
  columns: ReportColumn[];
  filters: ReportFilter[];
  groupBy: SegmentDimension[];
  sortBy: ReportSort[];

  // ── Formatting ──────────────────────────────────────────────
  format: 'pdf' | 'xlsx' | 'csv' | 'html';
  template?: string;               // custom template reference
  includeCharts: boolean;
  chartConfigs?: ChartConfig[];

  // ── Access ──────────────────────────────────────────────────
  visibility: 'private' | 'team' | 'executives' | 'board';
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

type ReportType =
  | 'income_statement'
  | 'balance_sheet'
  | 'cash_flow'
  | 'segment_analysis'
  | 'variance_report'
  | 'kpi_dashboard'
  | 'board_package'
  | 'investor_update'
  | 'custom';

interface ReportSchedule {
  id: string;
  reportConfigId: string;
  name: string;

  // ── Timing ──────────────────────────────────────────────────
  frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'annually' | 'on_period_close';
  dayOfWeek?: number;              // 0-6 for weekly
  dayOfMonth?: number;             // 1-31 for monthly
  time: string;                    // HH:mm UTC
  timezone: string;

  // ── Distribution ────────────────────────────────────────────
  distributionId: string;
  distribution: ReportDistribution;

  isActive: boolean;
  lastRunAt?: Date;
  nextRunAt?: Date;

  createdAt: Date;
  updatedAt: Date;
}

interface ReportDistribution {
  id: string;
  name: string;
  description?: string;

  recipients: DistributionRecipient[];
  channels: DistributionChannel[];
}

interface DistributionRecipient {
  userId: string;
  name: string;
  email: string;
  role: string;
  includeInCc: boolean;
}

type DistributionChannel =
  | { type: 'email'; subject: string; body?: string }
  | { type: 'slack'; channelId: string }
  | { type: 'dashboard'; widgetId: string }
  | { type: 'file_storage'; path: string };

interface ReportColumn {
  field: string;
  label: string;
  type: 'currency' | 'percent' | 'number' | 'text' | 'date';
  width?: number;
  aggregation?: 'sum' | 'avg' | 'min' | 'max' | 'count';
  conditional?: ConditionalFormat[];
}

interface ReportFilter {
  field: string;
  operator: 'eq' | 'neq' | 'gt' | 'gte' | 'lt' | 'lte' | 'in' | 'between';
  value: unknown;
}

interface ReportSort {
  field: string;
  direction: 'asc' | 'desc';
}

interface ChartConfig {
  type: 'bar' | 'line' | 'pie' | 'waterfall' | 'stacked_bar' | 'area';
  title: string;
  xAxis: string;
  yAxis: string[];
  colors?: string[];
}

interface ConditionalFormat {
  condition: 'positive' | 'negative' | 'above_threshold' | 'below_threshold';
  threshold?: number;
  style: { color?: string; bold?: boolean; icon?: string };
}
```

### BoardPackage

```typescript
interface BoardPackage {
  id: string;
  periodId: string;
  orgId: string;
  title: string;                   // "MCV Holdings — Q1 2026 Board Package"

  generatedAt: Date;
  generatedBy: string;
  status: 'draft' | 'review' | 'approved' | 'distributed';

  // ── Sections ────────────────────────────────────────────────
  sections: BoardPackageSection[];

  // ── Attachments ─────────────────────────────────────────────
  incomeStatement: IncomeStatement;
  balanceSheet: BalanceSheet;
  cashFlowStatement: CashFlowStatement;
  segmentReports: SegmentReport[];
  varianceAnalysis: VarianceAnalysis;

  // ── Commentary ──────────────────────────────────────────────
  executiveSummary: string;
  cfoCommentary: string;
  outlook: string;
  risks: RiskItem[];
  keyMetrics: KeyMetric[];

  // ── Distribution ────────────────────────────────────────────
  distributedAt?: Date;
  distributedTo: string[];
}

type BoardPackageSection =
  | 'executive_summary'
  | 'income_statement'
  | 'balance_sheet'
  | 'cash_flow'
  | 'segment_performance'
  | 'variance_analysis'
  | 'kpi_dashboard'
  | 'outlook_risks'
  | 'appendix';

interface IncomeStatement {
  periodId: string;
  periodLabel: string;
  comparative: boolean;            // includes prior period
  format: 'summary' | 'detailed' | 'board';

  currentPeriod: IncomeStatementData;
  priorPeriod?: IncomeStatementData;
  yearToDate?: IncomeStatementData;
  priorYearToDate?: IncomeStatementData;

  lineItems: PnLLineItem[];
}

interface IncomeStatementData {
  revenue: Decimal;
  cogs: Decimal;
  grossProfit: Decimal;
  grossMargin: Decimal;
  totalOpEx: Decimal;
  operatingIncome: Decimal;
  ebitda: Decimal;
  netIncome: Decimal;
  netMargin: Decimal;
  eps?: Decimal;
}

interface BalanceSheet {
  periodId: string;
  asOfDate: Date;

  totalAssets: Decimal;
  totalLiabilities: Decimal;
  totalEquity: Decimal;

  currentAssets: BalanceSheetSection;
  nonCurrentAssets: BalanceSheetSection;
  currentLiabilities: BalanceSheetSection;
  nonCurrentLiabilities: BalanceSheetSection;
  equity: BalanceSheetSection;
}

interface BalanceSheetSection {
  label: string;
  total: Decimal;
  lineItems: { label: string; amount: Decimal; priorAmount?: Decimal }[];
}

interface CashFlowStatement {
  periodId: string;
  periodLabel: string;

  operatingActivities: CashFlowSection;
  investingActivities: CashFlowSection;
  financingActivities: CashFlowSection;

  netCashFlow: Decimal;
  beginningCash: Decimal;
  endingCash: Decimal;
  fxImpact: Decimal;
}

interface CashFlowSection {
  label: string;
  total: Decimal;
  lineItems: { label: string; amount: Decimal }[];
}

interface RiskItem {
  category: string;
  description: string;
  likelihood: 'low' | 'medium' | 'high';
  impact: 'low' | 'medium' | 'high';
  mitigation: string;
}

interface KeyMetric {
  name: string;
  value: Decimal;
  unit: string;
  trend: 'up' | 'down' | 'flat';
  status: 'green' | 'yellow' | 'red';
  target?: Decimal;
  priorValue?: Decimal;
}
```

---

## Database Schemas

### consolidated_statements

```typescript
import { pgTable, text, timestamp, decimal, integer, jsonb, boolean, uuid } from 'drizzle-orm/pg-core';

export const consolidatedStatements = pgTable('pnl_consolidated_statements', {
  id:               uuid('id').defaultRandom().primaryKey(),
  orgId:            uuid('org_id').notNull().references(() => organizations.id),
  periodId:         uuid('period_id').notNull().references(() => financialPeriods.id),

  // ── Header ──────────────────────────────────────────────────
  statementDate:    timestamp('statement_date').notNull(),
  status:           text('status', { enum: ['draft', 'reviewed', 'approved', 'finalized'] }).notNull().default('draft'),
  version:          integer('version').notNull().default(1),

  // ── Summary Totals ──────────────────────────────────────────
  totalRevenue:             decimal('total_revenue', { precision: 20, scale: 2 }).notNull(),
  totalCogs:                decimal('total_cogs', { precision: 20, scale: 2 }).notNull(),
  grossProfit:              decimal('gross_profit', { precision: 20, scale: 2 }).notNull(),
  grossMargin:              decimal('gross_margin', { precision: 8, scale: 4 }).notNull(),
  totalOpex:                decimal('total_opex', { precision: 20, scale: 2 }).notNull(),
  operatingIncome:          decimal('operating_income', { precision: 20, scale: 2 }).notNull(),
  ebitda:                   decimal('ebitda', { precision: 20, scale: 2 }).notNull(),
  depreciationAmort:        decimal('depreciation_amort', { precision: 20, scale: 2 }).notNull(),
  interestExpense:          decimal('interest_expense', { precision: 20, scale: 2 }).notNull(),
  interestIncome:           decimal('interest_income', { precision: 20, scale: 2 }).notNull(),
  otherIncomeExpense:       decimal('other_income_expense', { precision: 20, scale: 2 }).notNull(),
  preTaxIncome:             decimal('pre_tax_income', { precision: 20, scale: 2 }).notNull(),
  taxExpense:               decimal('tax_expense', { precision: 20, scale: 2 }).notNull(),
  netIncome:                decimal('net_income', { precision: 20, scale: 2 }).notNull(),
  netMargin:                decimal('net_margin', { precision: 8, scale: 4 }).notNull(),
  eliminationTotal:         decimal('elimination_total', { precision: 20, scale: 2 }).notNull().default('0'),

  // ── Metadata ────────────────────────────────────────────────
  notes:            jsonb('notes').$type<string[]>().default([]),
  generatedBy:      text('generated_by').notNull(),
  generatedAt:      timestamp('generated_at').notNull().defaultNow(),

  createdAt:        timestamp('created_at').notNull().defaultNow(),
  updatedAt:        timestamp('updated_at').notNull().defaultNow(),
}, (table) => ({
  orgIdx:           index('pnl_cs_org_idx').on(table.orgId),
  periodIdx:        index('pnl_cs_period_idx').on(table.periodId),
  statusIdx:        index('pnl_cs_status_idx').on(table.status),
  uniquePeriod:     unique('pnl_cs_org_period_uniq').on(table.orgId, table.periodId, table.version),
}));
```

### pnl_line_items

```typescript
export const pnlLineItems = pgTable('pnl_line_items', {
  id:               uuid('id').defaultRandom().primaryKey(),
  statementId:      uuid('statement_id').notNull().references(() => consolidatedStatements.id, { onDelete: 'cascade' }),

  category:         text('category').notNull(),
  subcategory:      text('subcategory').notNull(),
  lineNumber:       integer('line_number').notNull(),
  label:            text('label').notNull(),
  description:      text('description'),

  // ── Amounts ─────────────────────────────────────────────────
  grossAmount:        decimal('gross_amount', { precision: 20, scale: 2 }).notNull(),
  eliminationAmount:  decimal('elimination_amount', { precision: 20, scale: 2 }).notNull().default('0'),
  allocationAmount:   decimal('allocation_amount', { precision: 20, scale: 2 }).notNull().default('0'),
  netAmount:          decimal('net_amount', { precision: 20, scale: 2 }).notNull(),

  // ── Venture Breakdown ───────────────────────────────────────
  ventureAmounts:   jsonb('venture_amounts').$type<Record<string, string>>().default({}),

  // ── Comparatives ────────────────────────────────────────────
  priorPeriodAmount:  decimal('prior_period_amount', { precision: 20, scale: 2 }),
  budgetAmount:       decimal('budget_amount', { precision: 20, scale: 2 }),
  forecastAmount:     decimal('forecast_amount', { precision: 20, scale: 2 }),

  // ── Display ─────────────────────────────────────────────────
  isSubtotal:       boolean('is_subtotal').notNull().default(false),
  isTotal:          boolean('is_total').notNull().default(false),
  indent:           integer('indent').notNull().default(0),

  createdAt:        timestamp('created_at').notNull().defaultNow(),
}, (table) => ({
  statementIdx:     index('pnl_li_statement_idx').on(table.statementId),
  categoryIdx:      index('pnl_li_category_idx').on(table.category),
  lineNumberIdx:    index('pnl_li_line_number_idx').on(table.statementId, table.lineNumber),
}));
```

### segment_results

```typescript
export const segmentResults = pgTable('pnl_segment_results', {
  id:               uuid('id').defaultRandom().primaryKey(),
  orgId:            uuid('org_id').notNull(),
  periodId:         uuid('period_id').notNull().references(() => financialPeriods.id),
  statementId:      uuid('statement_id').references(() => consolidatedStatements.id),

  // ── Segment Identity ────────────────────────────────────────
  dimension:        text('dimension', { enum: ['venture', 'business_line', 'geography', 'product', 'customer_type'] }).notNull(),
  segmentId:        text('segment_id').notNull(),
  segmentName:      text('segment_name').notNull(),

  // ── Financials ──────────────────────────────────────────────
  revenue:          decimal('revenue', { precision: 20, scale: 2 }).notNull(),
  cogs:             decimal('cogs', { precision: 20, scale: 2 }).notNull(),
  grossProfit:      decimal('gross_profit', { precision: 20, scale: 2 }).notNull(),
  grossMargin:      decimal('gross_margin', { precision: 8, scale: 4 }).notNull(),
  opex:             decimal('opex', { precision: 20, scale: 2 }).notNull(),
  operatingIncome:  decimal('operating_income', { precision: 20, scale: 2 }).notNull(),
  netIncome:        decimal('net_income', { precision: 20, scale: 2 }).notNull(),
  netMargin:        decimal('net_margin', { precision: 8, scale: 4 }).notNull(),

  // ── Contribution ────────────────────────────────────────────
  revenueShare:     decimal('revenue_share', { precision: 8, scale: 4 }).notNull(),
  profitContrib:    decimal('profit_contribution', { precision: 8, scale: 4 }).notNull(),

  // ── Trend ───────────────────────────────────────────────────
  revenueGrowth:    decimal('revenue_growth', { precision: 8, scale: 4 }),
  marginTrend:      decimal('margin_trend', { precision: 8, scale: 4 }),

  createdAt:        timestamp('created_at').notNull().defaultNow(),
  updatedAt:        timestamp('updated_at').notNull().defaultNow(),
}, (table) => ({
  orgPeriodIdx:     index('pnl_sr_org_period_idx').on(table.orgId, table.periodId),
  dimensionIdx:     index('pnl_sr_dimension_idx').on(table.dimension, table.segmentId),
  uniqueSegment:    unique('pnl_sr_unique').on(table.orgId, table.periodId, table.dimension, table.segmentId),
}));
```

### eliminations

```typescript
export const eliminations = pgTable('pnl_eliminations', {
  id:                 uuid('id').defaultRandom().primaryKey(),
  orgId:              uuid('org_id').notNull(),
  periodId:           uuid('period_id').notNull().references(() => financialPeriods.id),
  statementId:        uuid('statement_id').references(() => consolidatedStatements.id),
  ruleId:             uuid('rule_id').notNull().references(() => eliminationRules.id),

  // ── Parties ─────────────────────────────────────────────────
  sourceVentureId:    uuid('source_venture_id').notNull(),
  targetVentureId:    uuid('target_venture_id').notNull(),
  description:        text('description').notNull(),

  // ── Amounts ─────────────────────────────────────────────────
  revenueEliminated:  decimal('revenue_eliminated', { precision: 20, scale: 2 }).notNull(),
  expenseEliminated:  decimal('expense_eliminated', { precision: 20, scale: 2 }).notNull(),
  netImpact:          decimal('net_impact', { precision: 20, scale: 2 }).notNull(),

  // ── Status ──────────────────────────────────────────────────
  status:             text('status', { enum: ['pending', 'applied', 'reversed', 'disputed'] }).notNull().default('pending'),
  appliedAt:          timestamp('applied_at'),
  appliedBy:          text('applied_by'),

  // ── Audit ───────────────────────────────────────────────────
  sourceTransactionIds: jsonb('source_transaction_ids').$type<string[]>().default([]),
  notes:              text('notes'),

  createdAt:          timestamp('created_at').notNull().defaultNow(),
  updatedAt:          timestamp('updated_at').notNull().defaultNow(),
}, (table) => ({
  orgPeriodIdx:       index('pnl_elim_org_period_idx').on(table.orgId, table.periodId),
  sourceIdx:          index('pnl_elim_source_idx').on(table.sourceVentureId),
  targetIdx:          index('pnl_elim_target_idx').on(table.targetVentureId),
  statusIdx:          index('pnl_elim_status_idx').on(table.status),
}));

export const eliminationRules = pgTable('pnl_elimination_rules', {
  id:                 uuid('id').defaultRandom().primaryKey(),
  orgId:              uuid('org_id').notNull(),
  name:               text('name').notNull(),
  description:        text('description').notNull(),
  type:               text('type', {
    enum: [
      'inter_company_revenue',
      'inter_company_expense',
      'transfer_pricing',
      'shared_services',
      'inter_company_loan',
      'dividend_elimination',
      'unrealized_profit',
    ],
  }).notNull(),

  // ── Matching ────────────────────────────────────────────────
  sourceVentureId:    uuid('source_venture_id'),
  targetVentureId:    uuid('target_venture_id'),
  accountPattern:     text('account_pattern').notNull(),
  minAmount:          decimal('min_amount', { precision: 20, scale: 2 }),
  autoApply:          boolean('auto_apply').notNull().default(true),

  // ── Scheduling ──────────────────────────────────────────────
  effectiveFrom:      timestamp('effective_from').notNull(),
  effectiveTo:        timestamp('effective_to'),
  isActive:           boolean('is_active').notNull().default(true),

  createdAt:          timestamp('created_at').notNull().defaultNow(),
  updatedAt:          timestamp('updated_at').notNull().defaultNow(),
}, (table) => ({
  orgIdx:             index('pnl_er_org_idx').on(table.orgId),
  typeIdx:            index('pnl_er_type_idx').on(table.type),
  activeIdx:          index('pnl_er_active_idx').on(table.isActive),
}));

export const eliminationEntries = pgTable('pnl_elimination_entries', {
  id:                 uuid('id').defaultRandom().primaryKey(),
  eliminationId:      uuid('elimination_id').notNull().references(() => eliminations.id, { onDelete: 'cascade' }),

  accountCode:        text('account_code').notNull(),
  accountName:        text('account_name').notNull(),
  debit:              decimal('debit', { precision: 20, scale: 2 }).notNull().default('0'),
  credit:             decimal('credit', { precision: 20, scale: 2 }).notNull().default('0'),
  ventureId:          uuid('venture_id').notNull(),
  description:        text('description').notNull(),

  createdAt:          timestamp('created_at').notNull().defaultNow(),
}, (table) => ({
  elimIdx:            index('pnl_ee_elim_idx').on(table.eliminationId),
  accountIdx:         index('pnl_ee_account_idx').on(table.accountCode),
}));
```

### variance_records

```typescript
export const varianceRecords = pgTable('pnl_variance_records', {
  id:                 uuid('id').defaultRandom().primaryKey(),
  orgId:              uuid('org_id').notNull(),
  periodId:           uuid('period_id').notNull().references(() => financialPeriods.id),
  analysisId:         uuid('analysis_id').notNull(),

  // ── Comparison ──────────────────────────────────────────────
  comparisonType:     text('comparison_type', {
    enum: ['budget_vs_actual', 'forecast_vs_actual', 'period_over_period', 'plan_vs_forecast', 'year_over_year'],
  }).notNull(),
  comparePeriodId:    uuid('compare_period_id'),

  // ── Dimension ───────────────────────────────────────────────
  dimension:          text('dimension', { enum: ['line_item', 'venture', 'department', 'geography'] }).notNull(),
  dimensionId:        text('dimension_id').notNull(),
  dimensionLabel:     text('dimension_label').notNull(),
  category:           text('category').notNull(),

  // ── Amounts ─────────────────────────────────────────────────
  baseAmount:         decimal('base_amount', { precision: 20, scale: 2 }).notNull(),
  actualAmount:       decimal('actual_amount', { precision: 20, scale: 2 }).notNull(),
  varianceAmount:     decimal('variance_amount', { precision: 20, scale: 2 }).notNull(),
  variancePercent:    decimal('variance_percent', { precision: 10, scale: 4 }).notNull(),

  // ── Classification ──────────────────────────────────────────
  direction:          text('direction', { enum: ['favorable', 'unfavorable', 'neutral'] }).notNull(),
  isMaterial:         boolean('is_material').notNull().default(false),

  // ── Explanation ─────────────────────────────────────────────
  explanation:        text('explanation'),
  driverAnalysis:     jsonb('driver_analysis').$type<VarianceDriver[]>(),
  actionRequired:     boolean('action_required').notNull().default(false),
  assignedTo:         text('assigned_to'),

  createdAt:          timestamp('created_at').notNull().defaultNow(),
  updatedAt:          timestamp('updated_at').notNull().defaultNow(),
}, (table) => ({
  orgPeriodIdx:       index('pnl_vr_org_period_idx').on(table.orgId, table.periodId),
  analysisIdx:        index('pnl_vr_analysis_idx').on(table.analysisId),
  materialIdx:        index('pnl_vr_material_idx').on(table.isMaterial),
  directionIdx:       index('pnl_vr_direction_idx').on(table.direction),
  dimensionIdx:       index('pnl_vr_dimension_idx').on(table.dimension, table.dimensionId),
}));
```

### financial_periods

```typescript
export const financialPeriods = pgTable('pnl_financial_periods', {
  id:                 uuid('id').defaultRandom().primaryKey(),
  orgId:              uuid('org_id').notNull(),

  // ── Period Identity ─────────────────────────────────────────
  fiscalYear:         integer('fiscal_year').notNull(),
  fiscalQuarter:      integer('fiscal_quarter').notNull(),
  fiscalMonth:        integer('fiscal_month').notNull(),
  periodType:         text('period_type', { enum: ['month', 'quarter', 'half_year', 'year'] }).notNull(),
  periodLabel:        text('period_label').notNull(),
  startDate:          timestamp('start_date').notNull(),
  endDate:            timestamp('end_date').notNull(),

  // ── Status ──────────────────────────────────────────────────
  status:             text('status', { enum: ['future', 'open', 'soft_close', 'hard_close', 'locked'] }).notNull().default('future'),
  openedAt:           timestamp('opened_at'),
  softClosedAt:       timestamp('soft_closed_at'),
  hardClosedAt:       timestamp('hard_closed_at'),
  lockedAt:           timestamp('locked_at'),

  // ── Close Process ───────────────────────────────────────────
  closeChecklist:     jsonb('close_checklist').$type<PeriodCloseChecklist>(),
  closedBy:           text('closed_by'),
  lockApprovedBy:     text('lock_approved_by'),

  // ── Consolidation ───────────────────────────────────────────
  consolidatedStatementId: uuid('consolidated_statement_id'),
  isConsolidated:     boolean('is_consolidated').notNull().default(false),
  consolidatedAt:     timestamp('consolidated_at'),

  createdAt:          timestamp('created_at').notNull().defaultNow(),
  updatedAt:          timestamp('updated_at').notNull().defaultNow(),
}, (table) => ({
  orgIdx:             index('pnl_fp_org_idx').on(table.orgId),
  yearIdx:            index('pnl_fp_year_idx').on(table.fiscalYear),
  statusIdx:          index('pnl_fp_status_idx').on(table.status),
  uniquePeriod:       unique('pnl_fp_unique').on(table.orgId, table.fiscalYear, table.fiscalMonth, table.periodType),
  dateRangeIdx:       index('pnl_fp_date_range_idx').on(table.startDate, table.endDate),
}));
```

### cost_allocations

```typescript
export const costAllocations = pgTable('pnl_cost_allocations', {
  id:                 uuid('id').defaultRandom().primaryKey(),
  orgId:              uuid('org_id').notNull(),
  periodId:           uuid('period_id').notNull().references(() => financialPeriods.id),

  // ── Cost Pool ───────────────────────────────────────────────
  costPoolId:         text('cost_pool_id').notNull(),
  costPoolName:       text('cost_pool_name').notNull(),
  totalAmount:        decimal('total_amount', { precision: 20, scale: 2 }).notNull(),
  currency:           text('currency').notNull().default('USD'),

  // ── Method ──────────────────────────────────────────────────
  method:             text('method', {
    enum: ['headcount', 'revenue', 'direct_usage', 'equal_split', 'custom_weight', 'activity_based', 'square_footage'],
  }).notNull(),
  basisId:            uuid('basis_id').references(() => allocationBases.id),

  // ── Distribution ────────────────────────────────────────────
  allocations:        jsonb('allocations').$type<VentureAllocation[]>().notNull(),

  // ── Status ──────────────────────────────────────────────────
  status:             text('status', { enum: ['draft', 'applied', 'reversed'] }).notNull().default('draft'),
  appliedAt:          timestamp('applied_at'),
  appliedBy:          text('applied_by'),
  notes:              text('notes'),

  createdAt:          timestamp('created_at').notNull().defaultNow(),
  updatedAt:          timestamp('updated_at').notNull().defaultNow(),
}, (table) => ({
  orgPeriodIdx:       index('pnl_ca_org_period_idx').on(table.orgId, table.periodId),
  costPoolIdx:        index('pnl_ca_cost_pool_idx').on(table.costPoolId),
  statusIdx:          index('pnl_ca_status_idx').on(table.status),
  methodIdx:          index('pnl_ca_method_idx').on(table.method),
}));

export const allocationBases = pgTable('pnl_allocation_bases', {
  id:                 uuid('id').defaultRandom().primaryKey(),
  orgId:              uuid('org_id').notNull(),
  periodId:           uuid('period_id').notNull().references(() => financialPeriods.id),

  method:             text('method').notNull(),
  ventureWeights:     jsonb('venture_weights').$type<Record<string, string>>().notNull(),
  totalWeight:        decimal('total_weight', { precision: 20, scale: 4 }).notNull(),

  dataSource:         text('data_source').notNull(),
  asOfDate:           timestamp('as_of_date').notNull(),
  isVerified:         boolean('is_verified').notNull().default(false),
  verifiedBy:         text('verified_by'),

  createdAt:          timestamp('created_at').notNull().defaultNow(),
  updatedAt:          timestamp('updated_at').notNull().defaultNow(),
}, (table) => ({
  orgPeriodIdx:       index('pnl_ab_org_period_idx').on(table.orgId, table.periodId),
  methodIdx:          index('pnl_ab_method_idx').on(table.method),
}));
```

### report_configs

```typescript
export const reportConfigs = pgTable('pnl_report_configs', {
  id:                 uuid('id').defaultRandom().primaryKey(),
  orgId:              uuid('org_id').notNull(),
  name:               text('name').notNull(),
  description:        text('description'),
  reportType:         text('report_type', {
    enum: ['income_statement', 'balance_sheet', 'cash_flow', 'segment_analysis', 'variance_report', 'kpi_dashboard', 'board_package', 'investor_update', 'custom'],
  }).notNull(),

  // ── Structure ───────────────────────────────────────────────
  columns:            jsonb('columns').$type<ReportColumn[]>().notNull(),
  filters:            jsonb('filters').$type<ReportFilter[]>().default([]),
  groupBy:            jsonb('group_by').$type<SegmentDimension[]>().default([]),
  sortBy:             jsonb('sort_by').$type<ReportSort[]>().default([]),

  // ── Formatting ──────────────────────────────────────────────
  format:             text('format', { enum: ['pdf', 'xlsx', 'csv', 'html'] }).notNull().default('pdf'),
  template:           text('template'),
  includeCharts:      boolean('include_charts').notNull().default(false),
  chartConfigs:       jsonb('chart_configs').$type<ChartConfig[]>(),

  // ── Access ──────────────────────────────────────────────────
  visibility:         text('visibility', { enum: ['private', 'team', 'executives', 'board'] }).notNull().default('private'),
  createdBy:          text('created_by').notNull(),

  createdAt:          timestamp('created_at').notNull().defaultNow(),
  updatedAt:          timestamp('updated_at').notNull().defaultNow(),
}, (table) => ({
  orgIdx:             index('pnl_rc_org_idx').on(table.orgId),
  typeIdx:            index('pnl_rc_type_idx').on(table.reportType),
  visibilityIdx:      index('pnl_rc_visibility_idx').on(table.visibility),
}));

export const reportSchedules = pgTable('pnl_report_schedules', {
  id:                 uuid('id').defaultRandom().primaryKey(),
  reportConfigId:     uuid('report_config_id').notNull().references(() => reportConfigs.id, { onDelete: 'cascade' }),
  name:               text('name').notNull(),

  frequency:          text('frequency', { enum: ['daily', 'weekly', 'monthly', 'quarterly', 'annually', 'on_period_close'] }).notNull(),
  dayOfWeek:          integer('day_of_week'),
  dayOfMonth:         integer('day_of_month'),
  time:               text('time').notNull(),
  timezone:           text('timezone').notNull().default('UTC'),

  distributionId:     uuid('distribution_id').notNull().references(() => reportDistributions.id),
  isActive:           boolean('is_active').notNull().default(true),
  lastRunAt:          timestamp('last_run_at'),
  nextRunAt:          timestamp('next_run_at'),

  createdAt:          timestamp('created_at').notNull().defaultNow(),
  updatedAt:          timestamp('updated_at').notNull().defaultNow(),
}, (table) => ({
  configIdx:          index('pnl_rs_config_idx').on(table.reportConfigId),
  nextRunIdx:         index('pnl_rs_next_run_idx').on(table.nextRunAt),
  activeIdx:          index('pnl_rs_active_idx').on(table.isActive),
}));

export const reportDistributions = pgTable('pnl_report_distributions', {
  id:                 uuid('id').defaultRandom().primaryKey(),
  orgId:              uuid('org_id').notNull(),
  name:               text('name').notNull(),
  description:        text('description'),

  recipients:         jsonb('recipients').$type<DistributionRecipient[]>().notNull(),
  channels:           jsonb('channels').$type<DistributionChannel[]>().notNull(),

  createdAt:          timestamp('created_at').notNull().defaultNow(),
  updatedAt:          timestamp('updated_at').notNull().defaultNow(),
}, (table) => ({
  orgIdx:             index('pnl_rd_org_idx').on(table.orgId),
}));
```

### revenue_recognition_rules

```typescript
export const revenueRecognitionRules = pgTable('pnl_revenue_recognition_rules', {
  id:                 uuid('id').defaultRandom().primaryKey(),
  orgId:              uuid('org_id').notNull(),
  ventureId:          uuid('venture_id').notNull(),
  name:               text('name').notNull(),
  description:        text('description').notNull(),

  // ── ASC 606 Configuration ──────────────────────────────────
  contractIdentification: jsonb('contract_identification').notNull(),
  performanceObligations: jsonb('performance_obligations').notNull(),
  transactionPrice:       jsonb('transaction_price').notNull(),
  allocationMethod:       text('allocation_method', {
    enum: ['standalone_selling_price', 'residual', 'adjusted_market'],
  }).notNull(),
  recognitionTiming:      text('recognition_timing', { enum: ['point_in_time', 'over_time'] }).notNull(),
  recognitionMethod:      text('recognition_method', { enum: ['output', 'input', 'straight_line', 'milestone'] }),

  // ── Scheduling ──────────────────────────────────────────────
  effectiveFrom:      timestamp('effective_from').notNull(),
  effectiveTo:        timestamp('effective_to'),
  isActive:           boolean('is_active').notNull().default(true),

  createdAt:          timestamp('created_at').notNull().defaultNow(),
  updatedAt:          timestamp('updated_at').notNull().defaultNow(),
}, (table) => ({
  orgIdx:             index('pnl_rrr_org_idx').on(table.orgId),
  ventureIdx:         index('pnl_rrr_venture_idx').on(table.ventureId),
  activeIdx:          index('pnl_rrr_active_idx').on(table.isActive),
}));

export const revenueSchedules = pgTable('pnl_revenue_schedules', {
  id:                 uuid('id').defaultRandom().primaryKey(),
  ruleId:             uuid('rule_id').notNull().references(() => revenueRecognitionRules.id),
  contractId:         text('contract_id').notNull(),
  ventureId:          uuid('venture_id').notNull(),

  totalContractValue: decimal('total_contract_value', { precision: 20, scale: 2 }).notNull(),
  recognizedToDate:   decimal('recognized_to_date', { precision: 20, scale: 2 }).notNull().default('0'),
  deferredRevenue:    decimal('deferred_revenue', { precision: 20, scale: 2 }).notNull().default('0'),
  unbilledRevenue:    decimal('unbilled_revenue', { precision: 20, scale: 2 }).notNull().default('0'),

  schedule:           jsonb('schedule').$type<RevenueScheduleEntry[]>().notNull(),

  createdAt:          timestamp('created_at').notNull().defaultNow(),
  updatedAt:          timestamp('updated_at').notNull().defaultNow(),
}, (table) => ({
  ruleIdx:            index('pnl_rsch_rule_idx').on(table.ruleId),
  contractIdx:        index('pnl_rsch_contract_idx').on(table.contractId),
  ventureIdx:         index('pnl_rsch_venture_idx').on(table.ventureId),
}));
```

### audit_entries

```typescript
export const auditEntries = pgTable('pnl_audit_entries', {
  id:                 uuid('id').defaultRandom().primaryKey(),
  orgId:              uuid('org_id').notNull(),

  entityType:         text('entity_type', {
    enum: ['statement', 'elimination', 'allocation', 'period', 'adjustment', 'report'],
  }).notNull(),
  entityId:           uuid('entity_id').notNull(),

  action:             text('action', {
    enum: ['create', 'update', 'delete', 'approve', 'reject', 'lock', 'unlock', 'close', 'reopen'],
  }).notNull(),
  performedBy:        text('performed_by').notNull(),
  performedAt:        timestamp('performed_at').notNull().defaultNow(),

  previousValue:      jsonb('previous_value'),
  newValue:           jsonb('new_value'),
  changeDescription:  text('change_description').notNull(),
  reason:             text('reason'),

  ipAddress:          text('ip_address'),
  userAgent:          text('user_agent'),
  sessionId:          text('session_id'),

  createdAt:          timestamp('created_at').notNull().defaultNow(),
}, (table) => ({
  orgIdx:             index('pnl_ae_org_idx').on(table.orgId),
  entityIdx:          index('pnl_ae_entity_idx').on(table.entityType, table.entityId),
  performedByIdx:     index('pnl_ae_performed_by_idx').on(table.performedBy),
  performedAtIdx:     index('pnl_ae_performed_at_idx').on(table.performedAt),
}));

export const adjustmentJournals = pgTable('pnl_adjustment_journals', {
  id:                 uuid('id').defaultRandom().primaryKey(),
  orgId:              uuid('org_id').notNull(),
  periodId:           uuid('period_id').notNull().references(() => financialPeriods.id),
  statementId:        uuid('statement_id').references(() => consolidatedStatements.id),

  adjustmentType:     text('adjustment_type', {
    enum: ['top_side', 'reclassification', 'correction', 'accrual', 'reversal'],
  }).notNull(),
  description:        text('description').notNull(),
  justification:      text('justification').notNull(),

  entries:            jsonb('entries').$type<AdjustmentEntry[]>().notNull(),
  totalDebits:        decimal('total_debits', { precision: 20, scale: 2 }).notNull(),
  totalCredits:       decimal('total_credits', { precision: 20, scale: 2 }).notNull(),
  isBalanced:         boolean('is_balanced').notNull(),

  status:             text('status', {
    enum: ['draft', 'pending_approval', 'approved', 'rejected', 'posted', 'reversed'],
  }).notNull().default('draft'),
  requestedBy:        text('requested_by').notNull(),
  requestedAt:        timestamp('requested_at').notNull().defaultNow(),
  approvedBy:         text('approved_by'),
  approvedAt:         timestamp('approved_at'),
  postedAt:           timestamp('posted_at'),

  isAutoReversing:    boolean('is_auto_reversing').notNull().default(false),
  reversalPeriodId:   uuid('reversal_period_id'),
  reversalJournalId:  uuid('reversal_journal_id'),

  createdAt:          timestamp('created_at').notNull().defaultNow(),
  updatedAt:          timestamp('updated_at').notNull().defaultNow(),
}, (table) => ({
  orgPeriodIdx:       index('pnl_aj_org_period_idx').on(table.orgId, table.periodId),
  statusIdx:          index('pnl_aj_status_idx').on(table.status),
  typeIdx:            index('pnl_aj_type_idx').on(table.adjustmentType),
  requestedByIdx:     index('pnl_aj_requested_by_idx').on(table.requestedBy),
}));

export const reconciliationRecords = pgTable('pnl_reconciliation_records', {
  id:                 uuid('id').defaultRandom().primaryKey(),
  orgId:              uuid('org_id').notNull(),
  periodId:           uuid('period_id').notNull().references(() => financialPeriods.id),

  reconType:          text('recon_type', {
    enum: ['inter_company', 'bank', 'revenue', 'expense', 'balance_sheet'],
  }).notNull(),
  description:        text('description').notNull(),

  sourceSystem:       text('source_system').notNull(),
  sourceBalance:      decimal('source_balance', { precision: 20, scale: 2 }).notNull(),
  targetSystem:       text('target_system').notNull(),
  targetBalance:      decimal('target_balance', { precision: 20, scale: 2 }).notNull(),
  difference:         decimal('difference', { precision: 20, scale: 2 }).notNull(),

  status:             text('status', { enum: ['unreconciled', 'in_progress', 'reconciled', 'exception'] }).notNull().default('unreconciled'),
  reconciledBy:       text('reconciled_by'),
  reconciledAt:       timestamp('reconciled_at'),

  items:              jsonb('items').$type<ReconciliationItem[]>().default([]),
  exceptions:         jsonb('exceptions').$type<ReconciliationException[]>().default([]),

  createdAt:          timestamp('created_at').notNull().defaultNow(),
  updatedAt:          timestamp('updated_at').notNull().defaultNow(),
}, (table) => ({
  orgPeriodIdx:       index('pnl_rr_org_period_idx').on(table.orgId, table.periodId),
  typeIdx:            index('pnl_rr_type_idx').on(table.reconType),
  statusIdx:          index('pnl_rr_status_idx').on(table.status),
}));
```

---

## Code Examples

### 1. Consolidate P&L for a Period

Full consolidation flow: pull venture financials, apply revenue recognition, allocate costs, eliminate inter-company transactions, and produce the final consolidated statement.

```typescript
import { PnLService, ConsolidationEngine, EliminationService, CostAllocationService } from '@mcv/treasury/pnl';
import { FinanceService } from '@mcv/finance';

async function consolidatePnL(periodId: string) {
  const pnl = new PnLService();
  const finance = new FinanceService();
  const consolidation = new ConsolidationEngine();
  const eliminations = new EliminationService();
  const allocations = new CostAllocationService();

  // ── Step 1: Pull venture-level financials ───────────────────
  const ventures = await finance.getAllVentureIds();
  const ventureFinancials = await Promise.all(
    ventures.map(async (ventureId) => {
      const trialBalance = await finance.getTrialBalance({
        ventureId,
        periodId,
      });
      return consolidation.mapToStandardTaxonomy({
        ventureId,
        trialBalance,
      });
    }),
  );

  console.log(`Pulled financials for ${ventureFinancials.length} ventures`);

  // ── Step 2: Apply revenue recognition adjustments ───────────
  const revRecService = new RevenueRecognitionService();
  const revAdjustments = await Promise.all(
    ventureFinancials.map(async (vf) => {
      const rules = await revRecService.getActiveRules({
        ventureId: vf.ventureId,
        periodId,
      });
      return revRecService.applyRules({
        ventureFinancials: vf,
        rules,
        periodId,
      });
    }),
  );

  // ── Step 3: Allocate shared costs ───────────────────────────
  const costPools = await allocations.getCostPools({ periodId });
  const allocationResults = await Promise.all(
    costPools.map(async (pool) => {
      const basis = await allocations.getBasis({
        method: pool.method,
        periodId,
      });
      return allocations.allocate({
        costPoolId: pool.id,
        totalAmount: pool.totalAmount,
        method: pool.method,
        basis,
        periodId,
      });
    }),
  );

  console.log(`Allocated ${costPools.length} cost pools across ventures`);

  // ── Step 4: Aggregate into raw consolidated totals ──────────
  const rawConsolidation = consolidation.aggregate({
    ventureFinancials: revAdjustments,
    costAllocations: allocationResults,
  });

  // ── Step 5: Apply inter-company eliminations ────────────────
  const eliminationRules = await eliminations.getActiveRules({ periodId });
  const eliminationResults = await eliminations.applyAll({
    rawConsolidation,
    rules: eliminationRules,
    periodId,
  });

  console.log(
    `Applied ${eliminationResults.entries.length} elimination entries, ` +
    `total eliminated: $${eliminationResults.totalEliminated}`,
  );

  // ── Step 6: Produce final consolidated statement ────────────
  const statement = await pnl.consolidate({
    periodId,
    includeEliminations: true,
    draft: false,
  });

  console.log(`Consolidated P&L generated:`);
  console.log(`  Revenue:     $${statement.totalRevenue}`);
  console.log(`  COGS:        $${statement.totalCOGS}`);
  console.log(`  Gross Profit:$${statement.grossProfit} (${statement.grossMargin}%)`);
  console.log(`  OpEx:        $${statement.totalOpEx}`);
  console.log(`  EBITDA:      $${statement.ebitda}`);
  console.log(`  Net Income:  $${statement.netIncome} (${statement.netMargin}%)`);
  console.log(`  Eliminations:$${statement.eliminationTotal}`);

  return statement;
}
```

### 2. Eliminate Inter-Company Transactions

Identify and eliminate revenue/expense that occurs between MCV ventures so the consolidated view reflects only external activity.

```typescript
import { EliminationService, type EliminationRule } from '@mcv/treasury/pnl';

async function eliminateInterCompany(periodId: string) {
  const elimService = new EliminationService();

  // ── Fetch all inter-company transactions for the period ─────
  const interCoTransactions = await elimService.detectInterCompanyTransactions({
    periodId,
    minAmount: 100, // ignore trivial amounts
  });

  console.log(`Found ${interCoTransactions.length} inter-company transaction pairs`);

  // ── Auto-apply rules ────────────────────────────────────────
  const rules = await elimService.getActiveRules({ periodId });
  const autoRules = rules.filter((r) => r.autoApply);

  const results = [];
  for (const rule of autoRules) {
    const matchingTransactions = interCoTransactions.filter((tx) =>
      elimService.matchesRule(tx, rule),
    );

    for (const tx of matchingTransactions) {
      const elimination = await elimService.createElimination({
        periodId,
        ruleId: rule.id,
        sourceVentureId: tx.sourceVentureId,
        targetVentureId: tx.targetVentureId,
        description: `Auto-elimination: ${rule.name} — ${tx.description}`,
        revenueEliminated: tx.revenueAmount,
        expenseEliminated: tx.expenseAmount,
        sourceTransactionIds: [tx.sourceGlEntryId, tx.targetGlEntryId],
        entries: [
          // Debit revenue (reduce source venture revenue)
          {
            accountCode: tx.sourceRevenueAccount,
            accountName: 'Inter-company Revenue',
            debit: tx.revenueAmount,
            credit: '0',
            ventureId: tx.sourceVentureId,
            description: `Eliminate inter-co revenue from ${tx.sourceVentureName}`,
          },
          // Credit expense (reduce target venture expense)
          {
            accountCode: tx.targetExpenseAccount,
            accountName: 'Inter-company Expense',
            debit: '0',
            credit: tx.expenseAmount,
            ventureId: tx.targetVentureId,
            description: `Eliminate inter-co expense from ${tx.targetVentureName}`,
          },
        ],
      });

      results.push(elimination);
    }
  }

  // ── Flag unmatched transactions for manual review ───────────
  const autoMatchedIds = new Set(
    results.flatMap((r) => r.sourceTransactionIds),
  );
  const unmatchedTransactions = interCoTransactions.filter(
    (tx) => !autoMatchedIds.has(tx.sourceGlEntryId),
  );

  if (unmatchedTransactions.length > 0) {
    console.warn(
      `${unmatchedTransactions.length} inter-company transactions require manual elimination`,
    );
    for (const tx of unmatchedTransactions) {
      await elimService.flagForReview({
        transactionId: tx.sourceGlEntryId,
        reason: 'No matching elimination rule',
        periodId,
      });
    }
  }

  // ── Summary ─────────────────────────────────────────────────
  const totalRevElim = results.reduce(
    (sum, r) => sum + parseFloat(r.revenueEliminated),
    0,
  );
  const totalExpElim = results.reduce(
    (sum, r) => sum + parseFloat(r.expenseEliminated),
    0,
  );

  console.log(`Elimination summary:`);
  console.log(`  Auto-applied:     ${results.length} eliminations`);
  console.log(`  Revenue removed:  $${totalRevElim.toLocaleString()}`);
  console.log(`  Expense removed:  $${totalExpElim.toLocaleString()}`);
  console.log(`  Manual review:    ${unmatchedTransactions.length} transactions`);

  return { applied: results, unmatched: unmatchedTransactions };
}
```

### 3. Variance Analysis — Budget vs Actual

Compute variances between budget and actual performance, classify them as favorable/unfavorable, and identify material items that need management attention.

```typescript
import { VarianceAnalysisService, type VarianceRecord } from '@mcv/treasury/pnl';

async function analyzeBudgetVariance(periodId: string) {
  const varianceService = new VarianceAnalysisService();

  // ── Run full budget vs actual analysis ──────────────────────
  const analysis = await varianceService.analyze({
    periodId,
    comparison: { type: 'budget_vs_actual' },
    threshold: 10, // flag variances > 10%
    dimensions: ['line_item', 'venture'],
  });

  console.log(`Variance Analysis — Budget vs Actual`);
  console.log(`  Total Variance:    $${analysis.totalVariance} (${analysis.totalVariancePercent}%)`);
  console.log(`  Favorable:         ${analysis.favorableCount} items`);
  console.log(`  Unfavorable:       ${analysis.unfavorableCount} items`);
  console.log(`  Material (>10%):   ${analysis.materialVarianceCount} items`);

  // ── Top unfavorable variances (need attention) ──────────────
  console.log(`\nTop 5 Unfavorable Variances:`);
  for (const record of analysis.topUnfavorable) {
    console.log(
      `  ${record.dimensionLabel}: ` +
      `Budget $${record.baseAmount} → Actual $${record.actualAmount} ` +
      `(${record.variancePercent}% ${record.direction})`,
    );
  }

  // ── Drill into a specific material variance ─────────────────
  const materialItems = analysis.records.filter((r) => r.isMaterial && r.direction === 'unfavorable');

  for (const item of materialItems) {
    // Request driver analysis
    const drivers = await varianceService.analyzeDrivers({
      varianceRecordId: item.id,
      periodId,
    });

    console.log(`\nDriver analysis for: ${item.dimensionLabel}`);
    for (const driver of drivers) {
      console.log(`  ${driver.driver}: $${driver.impact} — ${driver.description}`);
    }

    // Assign for follow-up if action required
    if (item.actionRequired) {
      await varianceService.assignFollowUp({
        varianceRecordId: item.id,
        assignedTo: 'cfo@mcv.dev',
        explanation: `Material unfavorable variance of ${item.variancePercent}% requires investigation`,
      });
    }
  }

  // ── Generate waterfall data for visualization ───────────────
  const waterfall = await varianceService.buildWaterfall({
    analysisId: analysis.id,
    level: 'category', // revenue, cogs, opex, etc.
  });

  console.log(`\nVariance Waterfall:`);
  for (const step of waterfall) {
    const arrow = step.type === 'increase' ? '↑' : step.type === 'decrease' ? '↓' : '═';
    console.log(`  ${arrow} ${step.label}: $${step.delta} (${step.startValue} → ${step.endValue})`);
  }

  return analysis;
}

// ── Period-over-period comparison ─────────────────────────────
async function analyzeSequentialVariance(currentPeriodId: string, priorPeriodId: string) {
  const varianceService = new VarianceAnalysisService();

  const analysis = await varianceService.analyze({
    periodId: currentPeriodId,
    comparison: {
      type: 'period_over_period',
      priorPeriodId,
    },
    threshold: 15,
    dimensions: ['venture', 'line_item'],
  });

  // Focus on venture-level changes
  const ventureVariances = analysis.records.filter(
    (r) => r.dimension === 'venture',
  );

  console.log(`\nVenture Performance Changes (Period over Period):`);
  for (const v of ventureVariances.sort((a, b) => parseFloat(b.varianceAmount) - parseFloat(a.varianceAmount))) {
    const emoji = v.direction === 'favorable' ? '🟢' : v.direction === 'unfavorable' ? '🔴' : '⚪';
    console.log(
      `  ${emoji} ${v.dimensionLabel}: $${v.varianceAmount} (${v.variancePercent}%)`,
    );
  }

  return analysis;
}
```

### 4. Generate Board-Ready Financial Package

Produce the complete board package with formatted income statement, balance sheet, cash flow, segment analysis, KPIs, and executive commentary.

```typescript
import { BoardReportService, PnLService, SegmentReportingService } from '@mcv/treasury/pnl';

async function generateBoardPackage(periodId: string) {
  const boardService = new BoardReportService();
  const pnl = new PnLService();
  const segments = new SegmentReportingService();

  // ── Generate full board package ─────────────────────────────
  const boardPackage = await pnl.generateBoardPackage({
    periodId,
    sections: [
      'executive_summary',
      'income_statement',
      'balance_sheet',
      'cash_flow',
      'segment_performance',
      'variance_analysis',
      'kpi_dashboard',
      'outlook_risks',
      'appendix',
    ],
  });

  // ── Customize the income statement format ───────────────────
  const incomeStatement = await pnl.generateIncomeStatement({
    periodId,
    format: 'board',
    comparative: true, // include prior period comparison
  });

  // ── Add segment analysis ────────────────────────────────────
  const ventureSegments = await segments.getReport({
    periodId,
    dimension: 'venture',
  });

  const geoSegments = await segments.getReport({
    periodId,
    dimension: 'geography',
  });

  // ── Add KPIs ────────────────────────────────────────────────
  const kpis: KeyMetric[] = [
    {
      name: 'Total Revenue',
      value: boardPackage.incomeStatement.currentPeriod.revenue,
      unit: 'USD',
      trend: 'up',
      status: 'green',
      target: '15000000',
      priorValue: boardPackage.incomeStatement.priorPeriod?.revenue,
    },
    {
      name: 'Gross Margin',
      value: boardPackage.incomeStatement.currentPeriod.grossMargin,
      unit: '%',
      trend: 'up',
      status: 'green',
      target: '65',
    },
    {
      name: 'EBITDA',
      value: boardPackage.incomeStatement.currentPeriod.ebitda,
      unit: 'USD',
      trend: 'up',
      status: 'yellow',
      target: '5000000',
    },
    {
      name: 'Net Income',
      value: boardPackage.incomeStatement.currentPeriod.netIncome,
      unit: 'USD',
      trend: 'down',
      status: 'red',
    },
    {
      name: 'Revenue Concentration (Top 3)',
      value: ventureSegments.revenueConcentration.find(
        (m) => m.metricName === 'top_3_revenue_pct',
      )!.value,
      unit: '%',
      trend: 'flat',
      status: ventureSegments.revenueConcentration.find(
        (m) => m.metricName === 'top_3_revenue_pct',
      )!.status === 'healthy' ? 'green' : 'yellow',
    },
  ];

  // ── Format for PDF output ───────────────────────────────────
  const formattedPackage = await boardService.format({
    boardPackage: {
      ...boardPackage,
      keyMetrics: kpis,
      segmentReports: [ventureSegments, geoSegments],
    },
    format: 'pdf',
    template: 'mcv_board_standard',
    includeCharts: true,
    chartConfigs: [
      {
        type: 'waterfall',
        title: 'Revenue Bridge — Prior Period to Current',
        xAxis: 'category',
        yAxis: ['amount'],
      },
      {
        type: 'stacked_bar',
        title: 'Revenue by Venture',
        xAxis: 'venture',
        yAxis: ['revenue'],
      },
      {
        type: 'line',
        title: 'Margin Trends (12-Month)',
        xAxis: 'period',
        yAxis: ['grossMargin', 'netMargin'],
      },
    ],
  });

  // ── Distribute to board members ─────────────────────────────
  await boardService.distribute({
    packageId: formattedPackage.id,
    distributionId: 'board-distribution-list',
    channels: [
      {
        type: 'email',
        subject: `MCV Holdings — ${boardPackage.title}`,
        body: `Please find attached the financial package for your review ahead of the upcoming board meeting.`,
      },
      {
        type: 'dashboard',
        widgetId: 'board-financials-widget',
      },
    ],
  });

  console.log(`Board package generated and distributed:`);
  console.log(`  Title: ${boardPackage.title}`);
  console.log(`  Sections: ${boardPackage.sections.length}`);
  console.log(`  Status: ${formattedPackage.status}`);
  console.log(`  Distributed to: ${boardPackage.distributedTo.length} recipients`);

  return formattedPackage;
}
```

### 5. Period Close Process

Execute the full month-end close workflow: verify all ventures have reported, run consolidation, review variances, post adjustments, and lock the period.

```typescript
import {
  FinancialPeriodService,
  PnLService,
  EliminationService,
  CostAllocationService,
  VarianceAnalysisService,
  AuditService,
} from '@mcv/treasury/pnl';

async function closePeriod(periodId: string, closedBy: string) {
  const periodService = new FinancialPeriodService();
  const pnl = new PnLService();
  const elimService = new EliminationService();
  const allocService = new CostAllocationService();
  const varianceService = new VarianceAnalysisService();
  const auditService = new AuditService();

  // ── Step 1: Verify period is open ──────────────────────────
  const period = await periodService.get(periodId);
  if (period.status !== 'open' && period.status !== 'soft_close') {
    throw new Error(`Period ${period.periodLabel} is ${period.status}, cannot close`);
  }

  console.log(`Starting close process for ${period.periodLabel}`);

  // ── Step 2: Check all ventures have reported ────────────────
  const ventureStatuses = await periodService.checkVentureReporting({ periodId });
  const unreported = ventureStatuses.filter((v) => !v.reported);
  if (unreported.length > 0) {
    throw new Error(
      `${unreported.length} ventures have not reported: ` +
      unreported.map((v) => v.ventureName).join(', '),
    );
  }

  // ── Step 3: Apply cost allocations ──────────────────────────
  const costPools = await allocService.getCostPools({ periodId });
  for (const pool of costPools) {
    if (pool.status === 'draft') {
      await allocService.apply({
        allocationId: pool.id,
        appliedBy: closedBy,
      });
    }
  }
  console.log(`  ✓ Cost allocations applied (${costPools.length} pools)`);

  // ── Step 4: Apply eliminations ──────────────────────────────
  const pendingElims = await elimService.getPending({ periodId });
  for (const elim of pendingElims) {
    await elimService.apply({
      eliminationId: elim.id,
      appliedBy: closedBy,
    });
  }
  console.log(`  ✓ Eliminations applied (${pendingElims.length} entries)`);

  // ── Step 5: Run consolidation ───────────────────────────────
  const statement = await pnl.consolidate({
    periodId,
    includeEliminations: true,
    draft: false,
  });
  console.log(`  ✓ Consolidation complete (Net Income: $${statement.netIncome})`);

  // ── Step 6: Run variance analysis ──────────────────────────
  const variance = await varianceService.analyze({
    periodId,
    comparison: { type: 'budget_vs_actual' },
    threshold: 10,
    dimensions: ['line_item', 'venture'],
  });
  console.log(`  ✓ Variance analysis complete (${variance.materialVarianceCount} material items)`);

  // ── Step 7: Verify reconciliations ──────────────────────────
  const recons = await auditService.getReconciliations({ periodId });
  const unreconciledCount = recons.filter((r) => r.status !== 'reconciled').length;
  if (unreconciledCount > 0) {
    console.warn(`  ⚠ ${unreconciledCount} reconciliations still open`);
  } else {
    console.log(`  ✓ All reconciliations complete`);
  }

  // ── Step 8: Build close checklist ───────────────────────────
  const checklist: PeriodCloseChecklist = {
    allVenturesReported: true,
    revenueRecognized: true,
    costsAllocated: true,
    eliminationsApplied: true,
    varianceReviewed: variance.materialVarianceCount === 0 || true, // reviewed even if material
    adjustmentsPosted: true,
    reconciliationComplete: unreconciledCount === 0,
    managementReviewComplete: false, // needs manual sign-off
    approverSignoff: false,          // needs CFO approval
    items: [
      {
        id: 'ck-001', task: 'Venture Reporting', description: 'All 9 ventures submitted trial balances',
        assignedTo: closedBy, status: 'complete', completedAt: new Date(), completedBy: closedBy,
        isRequired: true, order: 1,
      },
      {
        id: 'ck-002', task: 'Revenue Recognition', description: 'ASC 606 rules applied to all ventures',
        assignedTo: closedBy, status: 'complete', completedAt: new Date(), completedBy: closedBy,
        isRequired: true, order: 2,
      },
      {
        id: 'ck-003', task: 'Cost Allocations', description: `${costPools.length} cost pools allocated`,
        assignedTo: closedBy, status: 'complete', completedAt: new Date(), completedBy: closedBy,
        isRequired: true, order: 3,
      },
      {
        id: 'ck-004', task: 'Inter-company Eliminations', description: `${pendingElims.length} eliminations applied`,
        assignedTo: closedBy, status: 'complete', completedAt: new Date(), completedBy: closedBy,
        isRequired: true, order: 4,
      },
      {
        id: 'ck-005', task: 'Variance Review', description: `${variance.materialVarianceCount} material variances reviewed`,
        assignedTo: closedBy, status: 'complete', completedAt: new Date(), completedBy: closedBy,
        isRequired: true, order: 5,
      },
      {
        id: 'ck-006', task: 'Reconciliations', description: `${recons.length} reconciliations`,
        assignedTo: closedBy, status: unreconciledCount === 0 ? 'complete' : 'in_progress',
        completedAt: unreconciledCount === 0 ? new Date() : undefined,
        isRequired: true, order: 6,
      },
      {
        id: 'ck-007', task: 'Management Review', description: 'CFO review of consolidated financials',
        assignedTo: 'cfo@mcv.dev', status: 'pending',
        isRequired: true, order: 7,
      },
      {
        id: 'ck-008', task: 'Approver Sign-off', description: 'Final approval to close period',
        assignedTo: 'cfo@mcv.dev', status: 'pending',
        isRequired: true, order: 8,
      },
    ],
  };

  // ── Step 9: Soft-close the period ───────────────────────────
  const closedPeriod = await pnl.closePeriod({
    periodId,
    closedBy,
    checklist,
  });

  console.log(`\n  Period ${closedPeriod.periodLabel} soft-closed`);
  console.log(`  Status: ${closedPeriod.status}`);
  console.log(`  Awaiting: Management review & approver sign-off`);
  console.log(`  Statement ID: ${closedPeriod.consolidatedStatementId}`);

  return closedPeriod;
}

// ── Lock period (after management approval) ───────────────────
async function lockPeriodAfterApproval(
  periodId: string,
  lockedBy: string,
  approvedBy: string,
) {
  const pnl = new PnLService();

  // Verify the approver has CFO or CEO role
  const period = await pnl.lockPeriod({
    periodId,
    lockedBy,
    reason: 'Monthly close — all checklist items complete',
    approvedBy,
  });

  console.log(`Period ${period.periodLabel} LOCKED`);
  console.log(`  Locked by: ${lockedBy}`);
  console.log(`  Approved by: ${approvedBy}`);
  console.log(`  No further modifications allowed without unlock`);

  return period;
}
```

### 6. Cost Allocation Across Ventures

Allocate shared corporate costs (infrastructure, overhead, shared services) across the nine ventures using configurable methodologies.

```typescript
import { CostAllocationService, type AllocationMethod } from '@mcv/treasury/pnl';

async function allocateSharedCosts(periodId: string) {
  const allocService = new CostAllocationService();

  // ── Define cost pools with their allocation methods ─────────
  const costPools = [
    {
      costPoolId: 'corp-overhead',
      costPoolName: 'Corporate Overhead',
      totalAmount: '450000',
      method: 'revenue' as AllocationMethod,
      description: 'Executive salaries, legal, compliance, finance team',
    },
    {
      costPoolId: 'infrastructure',
      costPoolName: 'Shared Infrastructure',
      totalAmount: '280000',
      method: 'direct_usage' as AllocationMethod,
      description: 'Cloud compute, storage, networking, DevOps',
    },
    {
      costPoolId: 'office-space',
      costPoolName: 'Office & Facilities',
      totalAmount: '120000',
      method: 'headcount' as AllocationMethod,
      description: 'Rent, utilities, office supplies, maintenance',
    },
    {
      costPoolId: 'shared-marketing',
      costPoolName: 'Brand & Shared Marketing',
      totalAmount: '180000',
      method: 'custom_weight' as AllocationMethod,
      description: 'MCV brand campaigns, events, PR',
    },
  ];

  const results = [];

  for (const pool of costPools) {
    // ── Get or create allocation basis ────────────────────────
    let basis;

    switch (pool.method) {
      case 'revenue':
        // Pull revenue figures from each venture for the period
        basis = await allocService.buildRevenueBasis({ periodId });
        break;

      case 'direct_usage':
        // Pull infrastructure usage metrics
        basis = await allocService.buildUsageBasis({
          periodId,
          dataSource: 'infrastructure-metering',
        });
        break;

      case 'headcount':
        // Pull headcount from HR
        basis = await allocService.buildHeadcountBasis({ periodId });
        break;

      case 'custom_weight':
        // Use manually defined weights
        basis = await allocService.createBasis({
          method: 'custom_weight',
          periodId,
          ventureWeights: {
            'venture-alpha': '0.25',
            'venture-beta': '0.20',
            'venture-gamma': '0.15',
            'venture-delta': '0.12',
            'venture-epsilon': '0.10',
            'venture-zeta': '0.08',
            'venture-eta': '0.05',
            'venture-theta': '0.03',
            'venture-iota': '0.02',
          },
          dataSource: 'manual — CFO allocation decision Q1-2026',
          asOfDate: new Date(),
        });
        break;
    }

    // ── Run the allocation ────────────────────────────────────
    const allocation = await allocService.allocate({
      costPoolId: pool.costPoolId,
      costPoolName: pool.costPoolName,
      totalAmount: pool.totalAmount,
      method: pool.method,
      basis,
      periodId,
    });

    console.log(`\n${pool.costPoolName} ($${pool.totalAmount}) — ${pool.method}:`);
    for (const va of allocation.allocations) {
      console.log(
        `  ${va.ventureName}: $${va.allocatedAmount} (${va.weightPercent}%)`,
      );
    }

    results.push(allocation);
  }

  // ── Summary ─────────────────────────────────────────────────
  const totalAllocated = results.reduce(
    (sum, r) => sum + parseFloat(r.totalAmount),
    0,
  );
  console.log(`\nTotal shared costs allocated: $${totalAllocated.toLocaleString()}`);

  return results;
}
```

### 7. Revenue Recognition — ASC 606

Apply ASC 606 five-step model to recognize revenue appropriately per venture and contract type.

```typescript
import { RevenueRecognitionService, type RevenueRecognitionRule } from '@mcv/treasury/pnl';

async function recognizeRevenueForPeriod(periodId: string) {
  const revRecService = new RevenueRecognitionService();

  // ── Get all active recognition rules across ventures ────────
  const allRules = await revRecService.getAllActiveRules({ periodId });
  console.log(`Processing ${allRules.length} active revenue recognition rules`);

  const results = {
    totalRecognized: 0,
    totalDeferred: 0,
    totalUnbilled: 0,
    byVenture: new Map<string, number>(),
  };

  for (const rule of allRules) {
    // ── Find contracts matching this rule ──────────────────────
    const contracts = await revRecService.getMatchingContracts({
      ruleId: rule.id,
      ventureId: rule.ventureId,
      periodId,
    });

    for (const contract of contracts) {
      // ── Get or create revenue schedule ──────────────────────
      let schedule = await revRecService.getSchedule({
        contractId: contract.id,
        ruleId: rule.id,
      });

      if (!schedule) {
        // Build new schedule based on the rule
        schedule = await revRecService.createSchedule({
          ruleId: rule.id,
          contractId: contract.id,
          ventureId: rule.ventureId,
          totalContractValue: contract.totalValue,
          startDate: contract.startDate,
          endDate: contract.endDate,
          recognitionTiming: rule.recognitionTiming,
          recognitionMethod: rule.recognitionMethod,
        });
      }

      // ── Recognize revenue for this period ───────────────────
      const recognition = await revRecService.recognizeForPeriod({
        scheduleId: schedule.id,
        periodId,
      });

      if (recognition.recognized > 0) {
        results.totalRecognized += parseFloat(recognition.recognized);
        results.totalDeferred += parseFloat(recognition.deferredRemaining);
        results.totalUnbilled += parseFloat(recognition.unbilledRemaining);

        const ventureTotal = results.byVenture.get(rule.ventureId) || 0;
        results.byVenture.set(rule.ventureId, ventureTotal + parseFloat(recognition.recognized));

        console.log(
          `  Contract ${contract.id}: Recognized $${recognition.recognized} ` +
          `(${recognition.percentComplete}% complete, $${recognition.deferredRemaining} deferred)`,
        );
      }
    }
  }

  console.log(`\nRevenue Recognition Summary:`);
  console.log(`  Recognized this period: $${results.totalRecognized.toLocaleString()}`);
  console.log(`  Deferred balance:       $${results.totalDeferred.toLocaleString()}`);
  console.log(`  Unbilled balance:       $${results.totalUnbilled.toLocaleString()}`);

  return results;
}
```

---

## Error Codes

All error codes are prefixed with `PNL_` and follow the MCV error convention.

| Code | Name | Description |
|------|------|-------------|
| `PNL_PERIOD_NOT_OPEN` | Period Not Open | Attempted to modify a period that is not in `open` or `soft_close` status. The period may be `locked`, `hard_close`, or `future`. |
| `PNL_PERIOD_LOCKED` | Period Locked | Attempted to modify a locked period. Requires explicit unlock with CFO/CEO approval before any changes. |
| `PNL_PERIOD_ALREADY_CLOSED` | Period Already Closed | Attempted to close a period that is already in `hard_close` or `locked` status. |
| `PNL_VENTURES_NOT_REPORTED` | Ventures Not Reported | Cannot consolidate because one or more ventures have not submitted their trial balance for the period. |
| `PNL_UNBALANCED_ELIMINATION` | Unbalanced Elimination | An elimination entry has unbalanced debits and credits. Total debits must equal total credits. |
| `PNL_ELIMINATION_RULE_CONFLICT` | Elimination Rule Conflict | Two or more elimination rules match the same transaction, creating ambiguity. Resolve by making rules more specific or deactivating conflicting rules. |
| `PNL_ALLOCATION_BASIS_MISSING` | Allocation Basis Missing | No allocation basis data available for the specified method and period. Ensure basis data (headcount, revenue, usage) has been loaded. |
| `PNL_ALLOCATION_WEIGHTS_INVALID` | Allocation Weights Invalid | Custom allocation weights do not sum to 1.0 (100%). Adjust weights to ensure they total exactly 1.0. |
| `PNL_VARIANCE_THRESHOLD_EXCEEDED` | Material Variance Threshold | One or more line items exceed the configured material variance threshold. Management review and explanation required before period close. |
| `PNL_RECON_INCOMPLETE` | Reconciliation Incomplete | Cannot hard-close period with outstanding unreconciled items. Resolve all reconciliation exceptions first. |
| `PNL_ADJUSTMENT_UNBALANCED` | Adjustment Unbalanced | Adjustment journal entry has unbalanced debits and credits. All journal entries must balance (debits = credits). |
| `PNL_ADJUSTMENT_UNAPPROVED` | Adjustment Not Approved | Attempted to post an adjustment journal that has not been approved. All adjustments require approval before posting. |
| `PNL_REVENUE_SCHEDULE_CONFLICT` | Revenue Schedule Conflict | Multiple revenue recognition schedules exist for the same contract. Each contract must have exactly one active schedule. |
| `PNL_CONSOLIDATION_STALE` | Consolidation Stale | The consolidated statement is stale — underlying data has changed since the last consolidation. Re-run consolidation to refresh. |
| `PNL_REPORT_TEMPLATE_NOT_FOUND` | Report Template Not Found | The specified report template does not exist or is not accessible to the current user. |
| `PNL_UNAUTHORIZED_PERIOD_UNLOCK` | Unauthorized Period Unlock | Only users with CFO or CEO role can approve period unlocks. The requesting user does not have sufficient permissions. |
| `PNL_DUPLICATE_PERIOD` | Duplicate Period | A financial period with the same org, fiscal year, fiscal month, and type already exists. |
| `PNL_CHECKLIST_INCOMPLETE` | Checklist Incomplete | Cannot close period — required checklist items are not complete. Review the close checklist and complete all required tasks. |

```typescript
export const PNL_ERROR_CODES = {
  PERIOD_NOT_OPEN:              { code: 'PNL_PERIOD_NOT_OPEN',              status: 409 },
  PERIOD_LOCKED:                { code: 'PNL_PERIOD_LOCKED',                status: 423 },
  PERIOD_ALREADY_CLOSED:        { code: 'PNL_PERIOD_ALREADY_CLOSED',        status: 409 },
  VENTURES_NOT_REPORTED:        { code: 'PNL_VENTURES_NOT_REPORTED',        status: 422 },
  UNBALANCED_ELIMINATION:       { code: 'PNL_UNBALANCED_ELIMINATION',       status: 422 },
  ELIMINATION_RULE_CONFLICT:    { code: 'PNL_ELIMINATION_RULE_CONFLICT',    status: 409 },
  ALLOCATION_BASIS_MISSING:     { code: 'PNL_ALLOCATION_BASIS_MISSING',     status: 404 },
  ALLOCATION_WEIGHTS_INVALID:   { code: 'PNL_ALLOCATION_WEIGHTS_INVALID',   status: 422 },
  VARIANCE_THRESHOLD_EXCEEDED:  { code: 'PNL_VARIANCE_THRESHOLD_EXCEEDED',  status: 422 },
  RECON_INCOMPLETE:             { code: 'PNL_RECON_INCOMPLETE',             status: 422 },
  ADJUSTMENT_UNBALANCED:        { code: 'PNL_ADJUSTMENT_UNBALANCED',        status: 422 },
  ADJUSTMENT_UNAPPROVED:        { code: 'PNL_ADJUSTMENT_UNAPPROVED',        status: 403 },
  REVENUE_SCHEDULE_CONFLICT:    { code: 'PNL_REVENUE_SCHEDULE_CONFLICT',    status: 409 },
  CONSOLIDATION_STALE:          { code: 'PNL_CONSOLIDATION_STALE',          status: 409 },
  REPORT_TEMPLATE_NOT_FOUND:    { code: 'PNL_REPORT_TEMPLATE_NOT_FOUND',    status: 404 },
  UNAUTHORIZED_PERIOD_UNLOCK:   { code: 'PNL_UNAUTHORIZED_PERIOD_UNLOCK',   status: 403 },
  DUPLICATE_PERIOD:             { code: 'PNL_DUPLICATE_PERIOD',             status: 409 },
  CHECKLIST_INCOMPLETE:         { code: 'PNL_CHECKLIST_INCOMPLETE',         status: 422 },
} as const;
```

---

## Security

### Row-Level Security (RLS)

All P&L tables enforce multi-tenant RLS at the Supabase level. Users can only access financial data for organizations they belong to.

```sql
-- Example RLS policy for consolidated_statements
CREATE POLICY "pnl_cs_org_isolation" ON pnl_consolidated_statements
  USING (org_id = auth.jwt() ->> 'org_id');

-- Period management requires elevated roles
CREATE POLICY "pnl_period_manage" ON pnl_financial_periods
  FOR UPDATE
  USING (
    org_id = auth.jwt() ->> 'org_id'
    AND (auth.jwt() ->> 'role') IN ('cfo', 'controller', 'admin')
  );

-- Locked periods require CFO/CEO to unlock
CREATE POLICY "pnl_period_unlock" ON pnl_financial_periods
  FOR UPDATE
  USING (
    org_id = auth.jwt() ->> 'org_id'
    AND (auth.jwt() ->> 'role') IN ('cfo', 'ceo')
    AND status = 'locked'
  );

-- Audit entries are append-only (no updates or deletes)
CREATE POLICY "pnl_audit_insert_only" ON pnl_audit_entries
  FOR INSERT
  WITH CHECK (org_id = auth.jwt() ->> 'org_id');

CREATE POLICY "pnl_audit_read_only" ON pnl_audit_entries
  FOR SELECT
  USING (org_id = auth.jwt() ->> 'org_id');

-- No UPDATE or DELETE policies on audit — immutable log

-- Board packages restricted to executives/board
CREATE POLICY "pnl_board_access" ON pnl_report_configs
  FOR SELECT
  USING (
    org_id = auth.jwt() ->> 'org_id'
    AND (
      visibility != 'board'
      OR (auth.jwt() ->> 'role') IN ('cfo', 'ceo', 'board_member')
    )
  );
```

### Role-Based Access

| Role | Consolidate | Eliminate | Allocate | Close Period | Lock Period | Unlock Period | View Reports | Board Package |
|------|:-----------:|:---------:|:--------:|:------------:|:-----------:|:-------------:|:------------:|:-------------:|
| Analyst | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ |
| Accountant | ✅ (draft) | ✅ | ✅ | ❌ | ❌ | ❌ | ✅ | ❌ |
| Controller | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ✅ | ✅ |
| CFO | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| CEO | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ | ✅ | ✅ |
| Board Member | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ (board) | ✅ |

### Data Sensitivity

- All financial data is classified as **Confidential** within MCV
- Board packages are classified as **Restricted** — only board members, CFO, and CEO
- Audit logs are **immutable** — no update or delete operations permitted
- Financial periods, once locked, require dual-approval (requester + CFO/CEO) to unlock
- All monetary values use `decimal(20,2)` to avoid floating-point errors
- Export operations (PDF, XLSX) are logged in the audit trail

---

## Environment Variables

| Variable | Required | Description | Example |
|----------|:--------:|-------------|---------|
| `PNL_DATABASE_URL` | ✅ | Supabase PostgreSQL connection string | `postgresql://...` |
| `PNL_SUPABASE_URL` | ✅ | Supabase project URL | `https://xxx.supabase.co` |
| `PNL_SUPABASE_SERVICE_KEY` | ✅ | Supabase service role key (server-side only) | `eyJ...` |
| `PNL_FINANCE_API_URL` | ✅ | URL for @mcv/finance service (venture-level GL) | `https://finance.mcv.dev/api` |
| `PNL_ENCRYPTION_KEY` | ✅ | AES-256 key for encrypting sensitive financial data at rest | `base64:...` |
| `PNL_REPORT_STORAGE_BUCKET` | ✅ | Supabase storage bucket for generated reports | `pnl-reports` |
| `PNL_SMTP_HOST` | ❌ | SMTP server for report distribution emails | `smtp.sendgrid.net` |
| `PNL_SMTP_PORT` | ❌ | SMTP port | `587` |
| `PNL_SMTP_USER` | ❌ | SMTP username | `apikey` |
| `PNL_SMTP_PASSWORD` | ❌ | SMTP password | `SG.xxx` |
| `PNL_FROM_EMAIL` | ❌ | Sender email for report distribution | `treasury@mcv.dev` |
| `PNL_SLACK_WEBHOOK_URL` | ❌ | Slack webhook for report distribution | `https://example.com/webhook/slack-placeholder |
| `PNL_VARIANCE_THRESHOLD_DEFAULT` | ❌ | Default material variance threshold (%) | `10` |
| `PNL_MAX_OPEN_PERIODS` | ❌ | Maximum number of simultaneously open periods | `3` |
| `PNL_AUDIT_RETENTION_DAYS` | ❌ | Days to retain audit entries (0 = forever) | `2555` (7 years) |
| `PNL_CONSOLIDATION_TIMEOUT_MS` | ❌ | Timeout for consolidation operations | `120000` |

---

## Dependencies

### Internal MCV Packages

| Package | Usage |
|---------|-------|
| `@mcv/finance` | Venture-level trial balances, GL entries, chart of accounts |
| `@mcv/treasury/core` | Treasury shared types, currency handling, FX rates |
| `@mcv/auth` | Authentication, role verification, JWT validation |
| `@mcv/db` | Shared Drizzle ORM setup, migration utilities, connection pooling |
| `@mcv/observability` | Logging, metrics, tracing for consolidation pipeline |
| `@mcv/notifications` | Email, Slack, dashboard notification delivery |

### External Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| `drizzle-orm` | `^0.30.x` | ORM for PostgreSQL schema and queries |
| `@supabase/supabase-js` | `^2.x` | Supabase client for RLS-aware queries |
| `@trpc/server` | `^10.x` | Type-safe API router |
| `decimal.js` | `^10.x` | Arbitrary-precision decimal arithmetic (no floating-point errors) |
| `zod` | `^3.x` | Runtime validation for all inputs |
| `date-fns` | `^3.x` | Fiscal period date calculations |
| `pdfkit` | `^0.14.x` | PDF generation for board packages |
| `exceljs` | `^4.x` | XLSX generation for management reports |
| `handlebars` | `^4.x` | Report template rendering |
| `bull` | `^4.x` | Job queue for scheduled report generation |

---

## Testing Notes

### Unit Tests

```typescript
// Test consolidation math
describe('ConsolidationEngine', () => {
  it('should sum venture revenues correctly', () => {
    const ventures = [
      { ventureId: 'v1', revenue: new Decimal('1000000') },
      { ventureId: 'v2', revenue: new Decimal('2500000') },
      { ventureId: 'v3', revenue: new Decimal('750000') },
    ];
    const result = engine.aggregate({ ventureFinancials: ventures });
    expect(result.totalRevenue.toString()).toBe('4250000');
  });

  it('should apply eliminations to reduce consolidated totals', () => {
    const raw = { totalRevenue: new Decimal('10000000') };
    const eliminations = [
      { revenueEliminated: new Decimal('500000') },
      { revenueEliminated: new Decimal('200000') },
    ];
    const result = engine.applyEliminations(raw, eliminations);
    expect(result.totalRevenue.toString()).toBe('9300000');
  });

  it('should reject unbalanced elimination entries', () => {
    const entry = { debit: new Decimal('1000'), credit: new Decimal('999') };
    expect(() => engine.validateElimination(entry)).toThrow('PNL_UNBALANCED_ELIMINATION');
  });
});

// Test variance calculation
describe('VarianceAnalysisService', () => {
  it('should classify favorable revenue variance correctly', () => {
    const record = service.calculateVariance({
      baseAmount: new Decimal('1000000'),
      actualAmount: new Decimal('1150000'),
      category: 'revenue',
    });
    expect(record.direction).toBe('favorable');
    expect(record.variancePercent.toString()).toBe('15');
  });

  it('should classify unfavorable expense variance correctly', () => {
    const record = service.calculateVariance({
      baseAmount: new Decimal('500000'),
      actualAmount: new Decimal('600000'),
      category: 'opex_general_admin',
    });
    expect(record.direction).toBe('unfavorable');
    expect(record.variancePercent.toString()).toBe('20');
  });

  it('should flag material variances above threshold', () => {
    const record = service.calculateVariance({
      baseAmount: new Decimal('100000'),
      actualAmount: new Decimal('115000'),
      category: 'revenue',
      threshold: 10,
    });
    expect(record.isMaterial).toBe(true);
  });
});

// Test cost allocation weights
describe('CostAllocationService', () => {
  it('should reject weights that do not sum to 1.0', () => {
    const weights = { v1: '0.5', v2: '0.3' }; // sum = 0.8
    expect(() => service.validateWeights(weights)).toThrow('PNL_ALLOCATION_WEIGHTS_INVALID');
  });

  it('should allocate proportionally to revenue', () => {
    const basis = {
      ventureWeights: { v1: '7000000', v2: '3000000' },
      totalWeight: new Decimal('10000000'),
    };
    const result = service.allocate({
      totalAmount: '100000',
      method: 'revenue',
      basis,
    });
    expect(result.allocations[0].allocatedAmount.toString()).toBe('70000');
    expect(result.allocations[1].allocatedAmount.toString()).toBe('30000');
  });
});
```

### Integration Tests

```typescript
describe('Period Close (Integration)', () => {
  it('should complete full close workflow', async () => {
    // Setup: create period, load venture data, create eliminations
    const period = await createTestPeriod('2026-01');
    await loadTestVentureData(period.id);
    await createTestEliminations(period.id);

    // Execute close
    const closed = await closePeriod(period.id, 'test-user');

    // Verify
    expect(closed.status).toBe('soft_close');
    expect(closed.isConsolidated).toBe(true);
    expect(closed.consolidatedStatementId).toBeDefined();

    // Verify audit trail
    const auditEntries = await getAuditEntries(period.id);
    expect(auditEntries.length).toBeGreaterThan(0);
    expect(auditEntries.some((e) => e.action === 'close')).toBe(true);
  });

  it('should prevent modifications to locked period', async () => {
    const period = await createAndLockTestPeriod('2026-01');

    await expect(
      pnl.reconsolidate({ periodId: period.id, reason: 'test' }),
    ).rejects.toThrow('PNL_PERIOD_LOCKED');
  });

  it('should enforce RLS — user cannot see other org data', async () => {
    const otherOrgStatement = await createTestStatement('other-org');
    const result = await pnl.getStatement(otherOrgStatement.id);
    expect(result).toBeNull(); // RLS blocks access
  });
});
```

### Performance Benchmarks

| Operation | Target | Notes |
|-----------|--------|-------|
| Consolidate 9 ventures | < 5s | Parallel venture data fetch |
| Apply eliminations (100 rules) | < 2s | Batch processing |
| Variance analysis (full) | < 3s | Pre-computed base amounts |
| Board package generation (PDF) | < 10s | Including charts |
| Period close (full workflow) | < 30s | End-to-end with all steps |

### Test Data Fixtures

Test fixtures are maintained in `test/fixtures/` and include:
- `ventures.json` — 9 mock venture trial balances
- `eliminations.json` — Sample inter-company transactions
- `budgets.json` — Budget data for variance testing
- `periods.json` — Financial period configurations
- `allocations.json` — Cost pool and basis data

---

## Related Modules

| Module | Relationship |
|--------|-------------|
| `@mcv/finance` | **Upstream** — provides venture-level GL data, trial balances |
| `@mcv/treasury/core` | **Sibling** — shared treasury types, FX rates |
| `@mcv/treasury/forecasting` | **Consumer** — uses actuals for forecast models |
| `@mcv/treasury/budgets` | **Consumer** — provides budget data for variance analysis |
| `@mcv/treasury/tax` | **Consumer** — uses consolidated income for tax calculations |
| `@mcv/dashboard` | **Consumer** — CFO dashboard pulls consolidated KPIs |