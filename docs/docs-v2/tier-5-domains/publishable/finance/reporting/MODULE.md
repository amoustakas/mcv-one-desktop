# @mcv/finance/reporting

> **Tier 5 Domain Module** · Finance Reporting  
> **Classification:** PUBLISHABLE  
> **Maintainer:** MCV Finance Platform Team  
> **Since:** 0.1.0  
> **Status:** Production  

---

## Purpose

The `@mcv/finance/reporting` module is the centralized financial report generation, scheduling, and distribution engine for the MCV.ONE platform. It produces every category of financial output required by the MCV Global Consortium — from GAAP/IFRS-compliant financial statements through management dashboards and regulatory filings to ad-hoc custom analyses. The module operates in a multi-tenant, multi-venture environment where each entity in the consortium portfolio may maintain its own chart of accounts, fiscal calendar, and reporting currency, yet all entities must ultimately roll up into a single consolidated view for the parent holding company.

At its core the module treats a "report" as a first-class, versioned, auditable artifact. Every report begins as a `ReportDefinition` — a declarative specification of data sources, filters, groupings, calculated columns, formatting rules, and output targets. Definitions are executed by the report generation pipeline, which resolves accounting data from the ledger, applies consolidation logic (inter-company eliminations, minority interest, FX translation), evaluates formulas, renders output through the export engine (PDF via Puppeteer, Excel via ExcelJS with live formulas, CSV, JSON, HTML), and stores the result as an immutable `ReportVersion`. The entire lifecycle is captured in a tamper-evident audit trail so that any published number can be traced back to the exact parameters, data snapshot, and user who produced it.

Beyond one-off generation, the module provides a full scheduling and distribution subsystem. Reports can be scheduled on cron expressions with date-relative period resolution (MTD, QTD, YTD, trailing-12, custom ranges), automatically distributed via email, Slack, or webhook, and routed through configurable approval workflows before publication. The custom report builder exposes a drag-and-drop designer with a formula engine, conditional formatting, drill-down navigation, and comparative analysis (period-over-period, budget-vs-actual, forecast-vs-actual) with variance highlighting governed by materiality thresholds. Together these capabilities mean that every stakeholder in the consortium — from a venture CFO reviewing a department P&L to a board member scanning an executive summary — receives the right numbers, in the right format, at the right time.

---

## Exports

```typescript
// @mcv/finance/reporting — public export map

// ── Core Services ─────────────────────────────────────────────
export { ReportingService }              from './services/reporting.service';
export { ReportGenerationPipeline }      from './services/generation-pipeline';
export { ReportScheduler }               from './services/report-scheduler';
export { ReportDistributor }             from './services/report-distributor';
export { ConsolidationEngine }           from './services/consolidation-engine';
export { FormulaEngine }                 from './services/formula-engine';
export { ComparativeAnalysisEngine }     from './services/comparative-analysis';
export { ExportEngine }                  from './services/export-engine';
export { ReportVersionManager }          from './services/version-manager';
export { ReportApprovalWorkflow }        from './services/approval-workflow';
export { AuditTrailService }             from './services/audit-trail';

// ── Financial Statement Generators ────────────────────────────
export { IncomeStatementGenerator }      from './generators/income-statement';
export { BalanceSheetGenerator }         from './generators/balance-sheet';
export { CashFlowStatementGenerator }    from './generators/cash-flow-statement';
export { EquityChangesGenerator }        from './generators/equity-changes';
export { TrialBalanceGenerator }         from './generators/trial-balance';

// ── Management Report Generators ──────────────────────────────
export { DepartmentPLGenerator }         from './generators/department-pl';
export { ProjectProfitabilityGenerator } from './generators/project-profitability';
export { VentureDashboardGenerator }     from './generators/venture-dashboard';
export { BoardPackGenerator }            from './generators/board-pack';
export { ExecutiveSummaryGenerator }     from './generators/executive-summary';

// ── Regulatory Report Generators ──────────────────────────────
export { TaxFilingGenerator }            from './generators/tax-filing';
export { AuditScheduleGenerator }        from './generators/audit-schedule';
export { ComplianceReportGenerator }     from './generators/compliance-report';
export { StatutoryFilingGenerator }      from './generators/statutory-filing';

// ── Export Renderers ──────────────────────────────────────────
export { PdfRenderer }                   from './renderers/pdf.renderer';
export { ExcelRenderer }                 from './renderers/excel.renderer';
export { CsvRenderer }                   from './renderers/csv.renderer';
export { JsonRenderer }                  from './renderers/json.renderer';
export { HtmlRenderer }                  from './renderers/html.renderer';

// ── Custom Report Builder ─────────────────────────────────────
export { ReportDesigner }                from './builder/report-designer';
export { ColumnBuilder }                 from './builder/column-builder';
export { FilterBuilder }                 from './builder/filter-builder';
export { FormatBuilder }                 from './builder/format-builder';
export { DrillDownConfig }               from './builder/drill-down-config';

// ── Interfaces ────────────────────────────────────────────────
export type { FinancialStatement }       from './interfaces/financial-statement';
export type { ReportDefinition }         from './interfaces/report-definition';
export type { ReportSchedule }           from './interfaces/report-schedule';
export type { ReportExport }             from './interfaces/report-export';
export type { ConsolidationConfig }      from './interfaces/consolidation-config';
export type { ComparativeAnalysis }      from './interfaces/comparative-analysis';
export type { ReportTemplate }           from './interfaces/report-template';
export type { ReportVersion }            from './interfaces/report-version';
export type { ReportRun }                from './interfaces/report-run';
export type { ReportApproval }           from './interfaces/report-approval';
export type { ReportDistribution }       from './interfaces/report-distribution';
export type { FormulaExpression }        from './interfaces/formula-expression';
export type { ReportColumn }             from './interfaces/report-column';
export type { ReportFilter }             from './interfaces/report-filter';
export type { ConditionalFormat }        from './interfaces/conditional-format';
export type { MaterialityThreshold }     from './interfaces/materiality-threshold';
export type { ExportOptions }            from './interfaces/export-options';
export type { DistributionTarget }       from './interfaces/distribution-target';
export type { AuditEntry }              from './interfaces/audit-entry';
export type { EliminationRule }          from './interfaces/elimination-rule';
export type { ReportPermission }         from './interfaces/report-permission';

// ── Enums ─────────────────────────────────────────────────────
export { ReportType }                    from './enums/report-type';
export { ReportStatus }                  from './enums/report-status';
export { ExportFormat }                  from './enums/export-format';
export { PeriodType }                    from './enums/period-type';
export { AccountingStandard }            from './enums/accounting-standard';
export { FXTranslationMethod }           from './enums/fx-translation-method';
export { ApprovalStatus }               from './enums/approval-status';
export { DistributionChannel }           from './enums/distribution-channel';

// ── Schemas (Drizzle) ─────────────────────────────────────────
export {
  reportDefinitions,
  reportRuns,
  reportExports,
  reportSchedules,
  reportTemplates,
  reportVersions,
  reportParameters,
  consolidationConfigs,
  reportApprovals,
  reportDistributions,
}                                        from './schemas';

// ── tRPC Router ───────────────────────────────────────────────
export { reportingRouter }               from './trpc/reporting.router';

// ── Utilities ─────────────────────────────────────────────────
export { formatCurrency }                from './utils/format-currency';
export { resolvePeriod }                 from './utils/resolve-period';
export { calculateVariance }             from './utils/calculate-variance';
export { buildAccountHierarchy }         from './utils/build-account-hierarchy';
export { hashReportSnapshot }            from './utils/hash-report-snapshot';
export { watermarkPdf }                  from './utils/watermark-pdf';
```

---

## Architecture

### Report Generation Pipeline

```
┌─────────────────────────────────────────────────────────────────────────┐
│                      REPORT GENERATION PIPELINE                         │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ┌──────────────┐    ┌───────────────┐    ┌──────────────────────┐     │
│  │   Trigger     │───▶│  Definition   │───▶│  Parameter           │     │
│  │              │    │  Resolver      │    │  Resolution          │     │
│  │ • Manual     │    │               │    │                      │     │
│  │ • Scheduled  │    │ • Load def    │    │ • Period calc        │     │
│  │ • API call   │    │ • Merge tpl   │    │ • Entity resolve     │     │
│  │ • Webhook    │    │ • Validate    │    │ • FX rates fetch     │     │
│  └──────────────┘    └───────────────┘    └──────────┬───────────┘     │
│                                                       │                 │
│                                                       ▼                 │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │                     DATA ACQUISITION LAYER                       │  │
│  │  ┌──────────────┐  ┌──────────────┐  ┌───────────────────────┐  │  │
│  │  │ GL Balances  │  │ Sub-ledger   │  │ Budget / Forecast     │  │  │
│  │  │ @mcv/finance │  │ Detail       │  │ @mcv/finance/budget   │  │  │
│  │  │ /ledger      │  │ AP/AR/FA     │  │                       │  │  │
│  │  └──────┬───────┘  └──────┬───────┘  └───────────┬───────────┘  │  │
│  │         └────────────┬────┘───────────────────────┘              │  │
│  │                      ▼                                           │  │
│  │              ┌───────────────┐                                   │  │
│  │              │ Data Resolver │ ◄── RLS enforced per tenant       │  │
│  │              └───────┬───────┘                                   │  │
│  └──────────────────────┼───────────────────────────────────────────┘  │
│                         ▼                                               │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │                    PROCESSING LAYER                               │  │
│  │  ┌────────────┐  ┌────────────┐  ┌────────────┐  ┌───────────┐ │  │
│  │  │ Grouping & │  │  Formula   │  │Comparative │  │Conditional│ │  │
│  │  │ Aggregation│─▶│  Engine    │─▶│ Analysis   │─▶│ Formatting│ │  │
│  │  │ • Rollup   │  │ • Calc cols│  │ • PoP      │  │ • Rules   │ │  │
│  │  │ • Pivot    │  │ • Ratios   │  │ • BvA/FvA  │  │ • Colors  │ │  │
│  │  └────────────┘  └────────────┘  └────────────┘  └───────────┘ │  │
│  └──────────────────────────────────────────┬───────────────────────┘  │
│                                              ▼                         │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │                      EXPORT ENGINE                                │  │
│  │  ┌─────────┐ ┌─────────┐ ┌──────┐ ┌──────┐ ┌──────┐           │  │
│  │  │   PDF   │ │  Excel  │ │ CSV  │ │ JSON │ │ HTML │           │  │
│  │  │Puppeteer│ │ ExcelJS │ │      │ │      │ │      │           │  │
│  │  │+branded │ │+formulas│ │      │ │      │ │      │           │  │
│  │  └─────────┘ └─────────┘ └──────┘ └──────┘ └──────┘           │  │
│  └──────────────────────────────────────────┬───────────────────────┘  │
│                                              ▼                         │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │  OUTPUT: Storage (S3/R2) → Version Snapshot → Approval Gate     │  │
│  │          → Distribution (Email / Slack / Webhook / Portal)      │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│                                                                         │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │  AUDIT TRAIL — tamper-evident log (SHA-256 chain)                │  │
│  │  who · when · what · parameters · data hash · result hash        │  │
│  └──────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────┘
```

### Consolidation Flow

```
┌─────────────────────────────────────────────────────────────────────────┐
│                       CONSOLIDATION FLOW                                │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│                    ┌─────────────────────────┐                          │
│                    │  ConsolidationConfig     │                          │
│                    │  • Parent entity        │                          │
│                    │  • Subsidiaries[]       │                          │
│                    │  • Ownership %          │                          │
│                    │  • FX method per sub    │                          │
│                    │  • Elimination rules    │                          │
│                    └────────────┬────────────┘                          │
│           ┌─────────────────────┼─────────────────────┐                 │
│           ▼                     ▼                     ▼                 │
│  ┌────────────────┐  ┌────────────────┐  ┌────────────────┐           │
│  │  Venture A     │  │  Venture B     │  │  Venture C     │           │
│  │  (USD)         │  │  (CAD)         │  │  (EUR)         │           │
│  │  GL → P&L/BS   │  │  GL → P&L/BS   │  │  GL → P&L/BS   │           │
│  └────────┬───────┘  └────────┬───────┘  └────────┬───────┘           │
│           │                   │                   │                     │
│           ▼                   ▼                   ▼                     │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │  FX TRANSLATION:  Current Rate (ASC 830 / IAS 21)               │  │
│  │  Assets/Liab → closing rate  |  Equity → historical rate        │  │
│  │  Revenue/Exp → avg rate      |  CTA → OCI                      │  │
│  │  ─── OR ───  Temporal Method                                    │  │
│  │  Monetary → closing  |  Non-monetary → historical               │  │
│  │  Remeasurement gain/loss → P&L                                  │  │
│  └──────────────────────────────────────┬───────────────────────────┘  │
│                                          ▼                             │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │  INTER-COMPANY ELIMINATIONS                                      │  │
│  │  1. Receivables ↔ Payables    4. Investments ↔ Sub equity       │  │
│  │  2. Revenue ↔ COGS            5. Unrealized inventory profit    │  │
│  │  3. Inter-co dividends        6. Unrealized asset gain          │  │
│  └──────────────────────────────────────┬───────────────────────────┘  │
│                                          ▼                             │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │  MINORITY INTEREST (NCI)                                         │  │
│  │  NCI_equity = sub_equity × (1 - ownership%)                     │  │
│  │  NCI_income = sub_net_income × (1 - ownership%)                 │  │
│  └──────────────────────────────────────┬───────────────────────────┘  │
│                                          ▼                             │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │  OUTPUT: Consolidated BS / P&L / CF / Equity Changes            │  │
│  │  + Elimination schedule + FX schedule + NCI schedule            │  │
│  └──────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Core Interfaces

### Enums

```typescript
export enum ReportType {
  INCOME_STATEMENT      = 'income_statement',
  BALANCE_SHEET         = 'balance_sheet',
  CASH_FLOW_STATEMENT   = 'cash_flow_statement',
  EQUITY_CHANGES        = 'equity_changes',
  TRIAL_BALANCE         = 'trial_balance',
  DEPARTMENT_PL         = 'department_pl',
  PROJECT_PROFITABILITY = 'project_profitability',
  VENTURE_DASHBOARD     = 'venture_dashboard',
  BOARD_PACK            = 'board_pack',
  EXECUTIVE_SUMMARY     = 'executive_summary',
  TAX_FILING            = 'tax_filing',
  AUDIT_SCHEDULE        = 'audit_schedule',
  COMPLIANCE_REPORT     = 'compliance_report',
  STATUTORY_FILING      = 'statutory_filing',
  CUSTOM                = 'custom',
  CONSOLIDATION         = 'consolidation',
}

export enum ReportStatus {
  DRAFT            = 'draft',
  GENERATING       = 'generating',
  GENERATED        = 'generated',
  PENDING_APPROVAL = 'pending_approval',
  APPROVED         = 'approved',
  REJECTED         = 'rejected',
  PUBLISHED        = 'published',
  DISTRIBUTED      = 'distributed',
  ARCHIVED         = 'archived',
  FAILED           = 'failed',
}

export enum ExportFormat {
  PDF   = 'pdf',
  EXCEL = 'excel',
  CSV   = 'csv',
  JSON  = 'json',
  HTML  = 'html',
}

export enum PeriodType {
  MTD          = 'mtd',
  QTD          = 'qtd',
  YTD          = 'ytd',
  TRAILING_12  = 'trailing_12',
  FULL_YEAR    = 'full_year',
  FULL_QUARTER = 'full_quarter',
  FULL_MONTH   = 'full_month',
  CUSTOM       = 'custom',
  PRIOR_PERIOD = 'prior_period',
}

export enum AccountingStandard {
  US_GAAP = 'us_gaap',
  IFRS    = 'ifrs',
  ASPE    = 'aspe',
  LOCAL   = 'local',
}

export enum FXTranslationMethod {
  CURRENT_RATE = 'current_rate',
  TEMPORAL     = 'temporal',
}

export enum ApprovalStatus {
  PENDING   = 'pending',
  APPROVED  = 'approved',
  REJECTED  = 'rejected',
  ESCALATED = 'escalated',
  EXPIRED   = 'expired',
}

export enum DistributionChannel {
  EMAIL   = 'email',
  SLACK   = 'slack',
  WEBHOOK = 'webhook',
  PORTAL  = 'portal',
  S3      = 's3',
}

export enum FormulaOperator {
  ADD = 'add', SUBTRACT = 'subtract', MULTIPLY = 'multiply',
  DIVIDE = 'divide', PERCENT = 'percent', ABS = 'abs',
  ROUND = 'round', IF = 'if', SUM = 'sum', AVG = 'avg',
  MIN = 'min', MAX = 'max', COALESCE = 'coalesce',
  YOY = 'yoy', MOM = 'mom',
}

export enum ConsolidationType {
  FULL          = 'full',
  PROPORTIONATE = 'proportionate',
  EQUITY_METHOD = 'equity_method',
}

export enum VarianceDirection {
  FAVORABLE   = 'favorable',
  UNFAVORABLE = 'unfavorable',
  NEUTRAL     = 'neutral',
}
```

### Financial Statement

```typescript
export interface FinancialStatement {
  id: string;
  type: ReportType;
  standard: AccountingStandard;
  entityId: string;
  entityName: string;
  currency: string;
  period: ReportPeriod;
  comparativePeriod?: ReportPeriod;
  sections: FinancialStatementSection[];
  totals: Record<string, MonetaryAmount>;
  notes: StatementNote[];
  generatedAt: Date;
  generatedBy: string;
  reportRunId: string;
  snapshotHash: string;
}

export interface FinancialStatementSection {
  key: string;
  label: string;
  depth: number;
  lineItems: FinancialStatementLineItem[];
  subtotal: MonetaryAmount;
  comparativeSubtotal?: MonetaryAmount;
  variance?: VarianceResult;
  children: FinancialStatementSection[];
  formatting?: SectionFormatting;
}

export interface FinancialStatementLineItem {
  accountCode: string;
  accountName: string;
  amount: MonetaryAmount;
  comparativeAmount?: MonetaryAmount;
  variance?: VarianceResult;
  budgetAmount?: MonetaryAmount;
  budgetVariance?: VarianceResult;
  isCalculated: boolean;
  drillDownRef?: string;
  appliedFormats?: AppliedFormat[];
}

export interface MonetaryAmount {
  value: number;
  formatted: string;
  currency: string;
  scale?: number;
}

export interface VarianceResult {
  amount: MonetaryAmount;
  percentage: number;
  direction: VarianceDirection;
  isMaterial: boolean;
  materialityThreshold?: MaterialityThreshold;
}

export interface ReportPeriod {
  startDate: string;       // ISO 8601
  endDate: string;         // ISO 8601
  periodType: PeriodType;
  fiscalYear: number;
  fiscalQuarter?: number;
  fiscalMonth?: number;
  label: string;           // e.g. "Q3 FY2025"
}

export interface StatementNote {
  number: number;
  key: string;
  title: string;
  content: string;         // markdown
  references: string[];
}

export interface SectionFormatting {
  boldSubtotal: boolean;
  topBorder: boolean;
  bottomBorder: 'single' | 'double' | 'none';
  indent: number;
  hideIfZero: boolean;
}
```

### Report Definition

```typescript
export interface ReportDefinition {
  id: string;
  tenantId: string;
  name: string;
  description?: string;
  type: ReportType;
  standard: AccountingStandard;
  templateId?: string;
  entityIds: string[];
  isConsolidation: boolean;
  consolidationConfigId?: string;
  periodConfig: PeriodConfig;
  columns: ReportColumn[];
  filters: ReportFilter[];
  groupings: ReportGrouping[];
  sorting: ReportSorting[];
  sections?: ReportSectionDef[];
  formulas: FormulaExpression[];
  conditionalFormats: ConditionalFormat[];
  comparativeConfig?: ComparativeAnalysisConfig;
  materialityThresholds: MaterialityThreshold[];
  drillDown?: DrillDownDef;
  defaultExportFormats: ExportFormat[];
  parameters: ReportParameterDef[];
  createdBy: string;
  createdAt: Date;
  updatedBy: string;
  updatedAt: Date;
  version: number;
  isActive: boolean;
  tags: string[];
}

export interface PeriodConfig {
  type: PeriodType;
  customStart?: string;
  customEnd?: string;
  includeComparative: boolean;
  comparativeOffset?: { value: number; unit: 'days' | 'months' | 'quarters' | 'years' };
  fiscalCalendarId?: string;
}

export interface ReportColumn {
  key: string;
  header: string;
  sourceField?: string;
  isFormula: boolean;
  formulaId?: string;
  dataType: 'monetary' | 'percentage' | 'number' | 'text' | 'date';
  format?: string;
  width?: number;
  alignment?: 'left' | 'center' | 'right';
  visible: boolean;
  orderIndex: number;
  aggregation?: 'sum' | 'avg' | 'min' | 'max' | 'count' | 'none';
}

export interface ReportFilter {
  field: string;
  operator: 'eq' | 'neq' | 'gt' | 'gte' | 'lt' | 'lte' | 'in' | 'not_in' |
            'contains' | 'starts_with' | 'between' | 'is_null' | 'is_not_null';
  value: unknown;
  isParameter: boolean;
  parameterKey?: string;
}

export interface ReportGrouping {
  field: string;
  label: string;
  showSubtotals: boolean;
  level: number;
  sortDirection?: 'asc' | 'desc';
}

export interface ReportSorting {
  field: string;
  direction: 'asc' | 'desc';
  priority: number;
}

export interface ReportSectionDef {
  key: string;
  label: string;
  accountRange?: { from: string; to: string };
  accountCodes?: string[];
  sectionType: 'header' | 'detail' | 'subtotal' | 'total' | 'separator';
  children?: ReportSectionDef[];
  signConvention?: 'natural' | 'reversed';
  formatting?: SectionFormatting;
}

export interface ReportParameterDef {
  key: string;
  label: string;
  type: 'string' | 'number' | 'date' | 'boolean' | 'select' | 'multi_select' | 'entity';
  required: boolean;
  defaultValue?: unknown;
  options?: Array<{ value: string; label: string }>;
  validation?: { min?: number; max?: number; pattern?: string; message?: string };
}
```

### Report Schedule

```typescript
export interface ReportSchedule {
  id: string;
  tenantId: string;
  reportDefinitionId: string;
  name: string;
  cronExpression: string;
  timezone: string;
  periodType: PeriodType;
  periodOffset?: { value: number; unit: 'days' | 'months' | 'quarters' | 'years'; direction: 'back' | 'forward' };
  entityIds?: string[];
  exportFormats: ExportFormat[];
  distributions: DistributionTarget[];
  requireApproval: boolean;
  approverIds?: string[];
  approvalDeadlineHours?: number;
  parameterOverrides?: Record<string, unknown>;
  skipNonBusinessDays: boolean;
  holidayCalendarId?: string;
  businessDayAdjustment?: 'next' | 'previous' | 'nearest';
  isActive: boolean;
  lastRunAt?: Date;
  nextRunAt?: Date;
  consecutiveErrors: number;
  maxConsecutiveErrors: number;
  createdBy: string;
  createdAt: Date;
  updatedBy: string;
  updatedAt: Date;
}

export interface DistributionTarget {
  channel: DistributionChannel;
  target: string;
  config: Record<string, unknown>;
  formats?: ExportFormat[];
  includePreview: boolean;
  message?: string;
  subject?: string;
}
```

### Report Export & Version

```typescript
export interface ReportExport {
  id: string;
  tenantId: string;
  reportRunId: string;
  format: ExportFormat;
  storagePath: string;
  storageBucket: string;
  downloadUrl?: string;
  downloadUrlExpiry?: Date;
  fileSizeBytes: number;
  mimeType: string;
  contentHash: string;
  pageCount?: number;
  sheetCount?: number;
  rowCount?: number;
  isWatermarked: boolean;
  watermarkText?: string;
  templateId?: string;
  generatedAt: Date;
  metadata: Record<string, unknown>;
}

export interface ReportVersion {
  id: string;
  tenantId: string;
  reportDefinitionId: string;
  reportRunId: string;
  versionNumber: number;
  status: ReportStatus;
  snapshotData: FinancialStatement | Record<string, unknown>;
  snapshotHash: string;
  period: ReportPeriod;
  parameters: Record<string, unknown>;
  exportIds: string[];
  approvals: ReportApproval[];
  isPublished: boolean;
  publishedAt?: Date;
  publishedBy?: string;
  diffFromPrevious?: ReportDiff;
  createdBy: string;
  createdAt: Date;
}

export interface ReportDiff {
  summary: string;
  changedCount: number;
  addedCount: number;
  removedCount: number;
  changes: Array<{
    path: string;
    changeType: 'added' | 'removed' | 'modified';
    oldValue?: unknown;
    newValue?: unknown;
    description: string;
  }>;
}

export interface ReportApproval {
  id: string;
  reportVersionId: string;
  approverId: string;
  approverName: string;
  status: ApprovalStatus;
  comment?: string;
  decidedAt?: Date;
  deadline: Date;
  escalatedTo?: string;
  createdAt: Date;
}

export interface ReportRun {
  id: string;
  tenantId: string;
  reportDefinitionId: string;
  scheduleId?: string;
  status: ReportStatus;
  parameters: Record<string, unknown>;
  period: ReportPeriod;
  entityIds: string[];
  reportVersionId?: string;
  exportIds: string[];
  startedAt: Date;
  completedAt?: Date;
  durationMs?: number;
  errorMessage?: string;
  errorCode?: string;
  triggeredBy: string;
  triggerSource: 'manual' | 'schedule' | 'api' | 'webhook';
  rowCount?: number;
  dataHash?: string;
}
```

### Consolidation Config

```typescript
export interface ConsolidationConfig {
  id: string;
  tenantId: string;
  name: string;
  description?: string;
  parentEntityId: string;
  reportingCurrency: string;
  subsidiaries: SubsidiaryConfig[];
  eliminationRules: EliminationRule[];
  defaultFXMethod: FXTranslationMethod;
  fxRateSource: FXRateSourceConfig;
  generateEliminationSchedule: boolean;
  generateFXSchedule: boolean;
  generateNCISchedule: boolean;
  accountMappings: AccountMapping[];
  isActive: boolean;
  createdBy: string;
  createdAt: Date;
  updatedBy: string;
  updatedAt: Date;
}

export interface SubsidiaryConfig {
  entityId: string;
  entityName: string;
  functionalCurrency: string;
  ownershipPercentage: number;
  consolidationType: ConsolidationType;
  fxMethodOverride?: FXTranslationMethod;
  acquisitionDate?: string;
  disposalDate?: string;
  goodwillAtAcquisition?: number;
  fairValueAdjustments?: Array<{
    accountCode: string;
    amount: number;
    usefulLifeMonths?: number;
    description: string;
  }>;
  hasSubConsolidation: boolean;
  subConsolidationConfigId?: string;
}

export interface EliminationRule {
  id: string;
  name: string;
  description?: string;
  debitAccountCode: string;
  creditAccountCode: string;
  matchKey: string;
  isAutomatic: boolean;
  matchTolerance?: number;
  category: 'receivable_payable' | 'revenue_expense' | 'dividend' |
            'investment_equity' | 'inventory_profit' | 'asset_gain' | 'custom';
  isActive: boolean;
}

export interface FXRateSourceConfig {
  primarySource: 'ecb' | 'fed' | 'custom' | 'manual';
  fallbackSource?: 'ecb' | 'fed' | 'custom' | 'manual';
  customEndpoint?: string;
  closingRateType: 'spot' | 'mid' | 'bid' | 'ask';
  averageRateMethod: 'simple_average' | 'weighted_average' | 'monthly_average';
}

export interface AccountMapping {
  sourceEntityId: string;
  sourceAccountCode: string;
  targetAccountCode: string;
  ratio: number;
}
```

### Comparative Analysis & Formula Engine

```typescript
export interface ComparativeAnalysis {
  id: string;
  type: 'period_over_period' | 'budget_vs_actual' | 'forecast_vs_actual' | 'custom';
  basePeriod: ReportPeriod;
  comparisonSource: ComparisonSource;
  varianceMethod: 'absolute' | 'percentage' | 'both';
  favorableDirection: Record<string, 'positive' | 'negative'>;
  materialityThresholds: MaterialityThreshold[];
  highlightRules: VarianceHighlightRule[];
  showVarianceColumn: boolean;
  showPercentageColumn: boolean;
  showDirectionIndicators: boolean;
}

export interface ComparisonSource {
  type: 'prior_period' | 'budget' | 'forecast' | 'custom_dataset';
  periodOffset?: { value: number; unit: 'months' | 'quarters' | 'years' };
  datasetId?: string;
  datasetVersion?: string;
}

export interface MaterialityThreshold {
  name: string;
  scope: 'all' | 'revenue' | 'expense' | 'asset' | 'liability' | 'equity' | string[];
  absoluteThreshold?: number;
  percentageThreshold?: number;
  logic: 'and' | 'or';
  severity: 'info' | 'warning' | 'critical';
}

export interface VarianceHighlightRule {
  condition: 'exceeds_threshold' | 'favorable' | 'unfavorable' | 'custom';
  expression?: string;
  format: {
    backgroundColor?: string;
    textColor?: string;
    fontWeight?: 'normal' | 'bold';
    icon?: 'arrow_up' | 'arrow_down' | 'warning' | 'check' | 'none';
  };
}

export interface FormulaExpression {
  id: string;
  name: string;
  expression: string;
  resultType: 'monetary' | 'percentage' | 'number';
  formatString?: string;
  description?: string;
  dependencies: string[];
}

export interface ConditionalFormat {
  targetColumn: string;
  rules: VarianceHighlightRule[];
}

export interface ComparativeAnalysisConfig {
  comparisons: ComparativeAnalysis[];
  layout: 'side_by_side' | 'sequential';
  includeGrandTotalComparison: boolean;
}
```

### Report Template

```typescript
export interface ReportTemplate {
  id: string;
  tenantId: string;
  name: string;
  description?: string;
  applicableTypes: ReportType[];
  applicableFormats: ExportFormat[];
  branding: {
    logoUrl: string;
    companyName: string;
    primaryColor: string;
    secondaryColor: string;
    accentColor: string;
    headerBackground: string;
    fontFamily: string;
    headingFontFamily: string;
    footerText: string;
    confidentialityNotice?: string;
  };
  pageLayout: {
    paperSize: 'letter' | 'a4' | 'legal' | 'tabloid';
    orientation: 'portrait' | 'landscape';
    margins: { top: number; right: number; bottom: number; left: number };
    headerHeight: number;
    footerHeight: number;
    scale?: number;
  };
  headerTemplate: string;
  footerTemplate: string;
  coverPageTemplate?: string;
  tocConfig?: { enabled: boolean; maxDepth: number; showPageNumbers: boolean };
  stylesheet: string;
  excelStyles?: {
    freezePanes: { row: number; column: number };
    autoFilter: boolean;
    autoWidth: boolean;
    monetaryFormat: string;
    percentageFormat: string;
    headerStyle: { fill: string; fontColor: string; fontWeight: 'bold' | 'normal'; fontSize: number };
    alternatingRowColors?: { even: string; odd: string };
    preserveFormulas: boolean;
    includePivotTables: boolean;
    includeCharts: boolean;
  };
  isDefault: boolean;
  isActive: boolean;
  createdBy: string;
  createdAt: Date;
  updatedBy: string;
  updatedAt: Date;
}
```

### Audit Entry

```typescript
export interface AuditEntry {
  id: string;
  tenantId: string;
  timestamp: Date;
  actorId: string;
  actorName: string;
  action: AuditAction;
  resourceType: 'report_definition' | 'report_run' | 'report_version' |
                'report_export' | 'report_schedule' | 'report_approval' |
                'report_distribution' | 'consolidation_config' | 'report_template';
  resourceId: string;
  details: Record<string, unknown>;
  parameters?: Record<string, unknown>;
  dataHash?: string;
  previousHash: string;
  entryHash: string;
  ipAddress?: string;
  userAgent?: string;
}

export type AuditAction =
  | 'definition_created' | 'definition_updated' | 'definition_deleted'
  | 'report_generated'   | 'report_exported'    | 'report_viewed'
  | 'report_approved'    | 'report_rejected'    | 'report_published'
  | 'report_distributed' | 'schedule_created'   | 'schedule_updated'
  | 'schedule_deleted'   | 'schedule_executed'  | 'template_created'
  | 'template_updated'   | 'consolidation_executed'
  | 'permission_granted' | 'permission_revoked' | 'export_downloaded';

export interface ReportPermission {
  id: string;
  reportDefinitionId: string;
  granteeType: 'user' | 'role' | 'team' | 'entity';
  granteeId: string;
  permissions: Array<'view' | 'generate' | 'edit_definition' | 'approve' |
                     'publish' | 'distribute' | 'schedule' | 'export' | 'admin'>;
  entityScope: string[] | '*';
  grantedBy: string;
  grantedAt: Date;
  expiresAt?: Date;
}
```

---

## Database Schemas

```typescript
import {
  pgTable, uuid, text, varchar, integer, bigint,
  boolean, timestamp, jsonb, index, uniqueIndex,
} from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

// ── report_definitions ────────────────────────────────────────

export const reportDefinitions = pgTable(
  'report_definitions',
  {
    id:                    uuid('id').defaultRandom().primaryKey(),
    tenantId:              uuid('tenant_id').notNull(),
    name:                  varchar('name', { length: 255 }).notNull(),
    description:           text('description'),
    type:                  varchar('type', { length: 50 }).notNull(),
    standard:              varchar('standard', { length: 20 }).notNull().default('us_gaap'),
    templateId:            uuid('template_id'),
    entityIds:             jsonb('entity_ids').notNull().default(sql`'[]'::jsonb`),
    isConsolidation:       boolean('is_consolidation').notNull().default(false),
    consolidationConfigId: uuid('consolidation_config_id'),
    periodConfig:          jsonb('period_config').notNull(),
    columns:               jsonb('columns').notNull().default(sql`'[]'::jsonb`),
    filters:               jsonb('filters').notNull().default(sql`'[]'::jsonb`),
    groupings:             jsonb('groupings').notNull().default(sql`'[]'::jsonb`),
    sorting:               jsonb('sorting').notNull().default(sql`'[]'::jsonb`),
    sections:              jsonb('sections'),
    formulas:              jsonb('formulas').notNull().default(sql`'[]'::jsonb`),
    conditionalFormats:    jsonb('conditional_formats').notNull().default(sql`'[]'::jsonb`),
    comparativeConfig:     jsonb('comparative_config'),
    materialityThresholds: jsonb('materiality_thresholds').notNull().default(sql`'[]'::jsonb`),
    drillDown:             jsonb('drill_down'),
    defaultExportFormats:  jsonb('default_export_formats').notNull().default(sql`'["pdf"]'::jsonb`),
    parameters:            jsonb('parameters').notNull().default(sql`'[]'::jsonb`),
    tags:                  jsonb('tags').notNull().default(sql`'[]'::jsonb`),
    version:               integer('version').notNull().default(1),
    isActive:              boolean('is_active').notNull().default(true),
    createdBy:             uuid('created_by').notNull(),
    createdAt:             timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedBy:             uuid('updated_by').notNull(),
    updatedAt:             timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    tenantIdx: index('idx_report_defs_tenant').on(table.tenantId),
    typeIdx:   index('idx_report_defs_type').on(table.tenantId, table.type),
    nameIdx:   uniqueIndex('idx_report_defs_name').on(table.tenantId, table.name),
  }),
);

// ── report_runs ───────────────────────────────────────────────

export const reportRuns = pgTable(
  'report_runs',
  {
    id:                 uuid('id').defaultRandom().primaryKey(),
    tenantId:           uuid('tenant_id').notNull(),
    reportDefinitionId: uuid('report_definition_id').notNull()
                          .references(() => reportDefinitions.id),
    scheduleId:         uuid('schedule_id'),
    status:             varchar('status', { length: 30 }).notNull().default('generating'),
    parameters:         jsonb('parameters').notNull().default(sql`'{}'::jsonb`),
    period:             jsonb('period').notNull(),
    entityIds:          jsonb('entity_ids').notNull().default(sql`'[]'::jsonb`),
    reportVersionId:    uuid('report_version_id'),
    exportIds:          jsonb('export_ids').notNull().default(sql`'[]'::jsonb`),
    startedAt:          timestamp('started_at', { withTimezone: true }).notNull().defaultNow(),
    completedAt:        timestamp('completed_at', { withTimezone: true }),
    durationMs:         integer('duration_ms'),
    errorMessage:       text('error_message'),
    errorCode:          varchar('error_code', { length: 50 }),
    triggeredBy:        uuid('triggered_by').notNull(),
    triggerSource:      varchar('trigger_source', { length: 20 }).notNull().default('manual'),
    rowCount:           integer('row_count'),
    dataHash:           varchar('data_hash', { length: 64 }),
  },
  (table) => ({
    tenantIdx:     index('idx_report_runs_tenant').on(table.tenantId),
    definitionIdx: index('idx_report_runs_def').on(table.tenantId, table.reportDefinitionId),
    statusIdx:     index('idx_report_runs_status').on(table.tenantId, table.status),
    startedIdx:    index('idx_report_runs_started').on(table.tenantId, table.startedAt),
  }),
);

// ── report_exports ────────────────────────────────────────────

export const reportExports = pgTable(
  'report_exports',
  {
    id:            uuid('id').defaultRandom().primaryKey(),
    tenantId:      uuid('tenant_id').notNull(),
    reportRunId:   uuid('report_run_id').notNull().references(() => reportRuns.id),
    format:        varchar('format', { length: 20 }).notNull(),
    storagePath:   text('storage_path').notNull(),
    storageBucket: varchar('storage_bucket', { length: 100 }).notNull(),
    fileSizeBytes: bigint('file_size_bytes', { mode: 'number' }).notNull(),
    mimeType:      varchar('mime_type', { length: 100 }).notNull(),
    contentHash:   varchar('content_hash', { length: 64 }).notNull(),
    pageCount:     integer('page_count'),
    sheetCount:    integer('sheet_count'),
    rowCount:      integer('row_count'),
    isWatermarked: boolean('is_watermarked').notNull().default(false),
    watermarkText: text('watermark_text'),
    templateId:    uuid('template_id'),
    metadata:      jsonb('metadata').notNull().default(sql`'{}'::jsonb`),
    generatedAt:   timestamp('generated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    tenantIdx: index('idx_report_exports_tenant').on(table.tenantId),
    runIdx:    index('idx_report_exports_run').on(table.reportRunId),
  }),
);

// ── report_schedules ──────────────────────────────────────────

export const reportSchedules = pgTable(
  'report_schedules',
  {
    id:                    uuid('id').defaultRandom().primaryKey(),
    tenantId:              uuid('tenant_id').notNull(),
    reportDefinitionId:    uuid('report_definition_id').notNull()
                             .references(() => reportDefinitions.id),
    name:                  varchar('name', { length: 255 }).notNull(),
    cronExpression:        varchar('cron_expression', { length: 100 }).notNull(),
    timezone:              varchar('timezone', { length: 50 }).notNull().default('UTC'),
    periodType:            varchar('period_type', { length: 30 }).notNull(),
    periodOffset:          jsonb('period_offset'),
    entityIds:             jsonb('entity_ids'),
    exportFormats:         jsonb('export_formats').notNull().default(sql`'["pdf"]'::jsonb`),
    distributions:         jsonb('distributions').notNull().default(sql`'[]'::jsonb`),
    requireApproval:       boolean('require_approval').notNull().default(false),
    approverIds:           jsonb('approver_ids'),
    approvalDeadlineHours: integer('approval_deadline_hours'),
    parameterOverrides:    jsonb('parameter_overrides'),
    skipNonBusinessDays:   boolean('skip_non_business_days').notNull().default(false),
    holidayCalendarId:     uuid('holiday_calendar_id'),
    businessDayAdjustment: varchar('business_day_adjustment', { length: 20 }),
    isActive:              boolean('is_active').notNull().default(true),
    lastRunAt:             timestamp('last_run_at', { withTimezone: true }),
    nextRunAt:             timestamp('next_run_at', { withTimezone: true }),
    consecutiveErrors:     integer('consecutive_errors').notNull().default(0),
    maxConsecutiveErrors:  integer('max_consecutive_errors').notNull().default(5),
    createdBy:             uuid('created_by').notNull(),
    createdAt:             timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedBy:             uuid('updated_by').notNull(),
    updatedAt:             timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    tenantIdx:  index('idx_report_schedules_tenant').on(table.tenantId),
    activeIdx:  index('idx_report_schedules_active').on(table.tenantId, table.isActive),
    nextRunIdx: index('idx_report_schedules_next').on(table.isActive, table.nextRunAt),
  }),
);

// ── report_templates ──────────────────────────────────────────

export const reportTemplates = pgTable(
  'report_templates',
  {
    id:                uuid('id').defaultRandom().primaryKey(),
    tenantId:          uuid('tenant_id').notNull(),
    name:              varchar('name', { length: 255 }).notNull(),
    description:       text('description'),
    applicableTypes:   jsonb('applicable_types').notNull().default(sql`'[]'::jsonb`),
    applicableFormats: jsonb('applicable_formats').notNull().default(sql`'[]'::jsonb`),
    branding:          jsonb('branding').notNull(),
    pageLayout:        jsonb('page_layout').notNull(),
    headerTemplate:    text('header_template').notNull(),
    footerTemplate:    text('footer_template').notNull(),
    coverPageTemplate: text('cover_page_template'),
    tocConfig:         jsonb('toc_config'),
    stylesheet:        text('stylesheet').notNull(),
    excelStyles:       jsonb('excel_styles'),
    isDefault:         boolean('is_default').notNull().default(false),
    isActive:          boolean('is_active').notNull().default(true),
    createdBy:         uuid('created_by').notNull(),
    createdAt:         timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedBy:         uuid('updated_by').notNull(),
    updatedAt:         timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    tenantIdx:  index('idx_report_templates_tenant').on(table.tenantId),
    defaultIdx: index('idx_report_templates_default').on(table.tenantId, table.isDefault),
  }),
);

// ── report_versions ───────────────────────────────────────────

export const reportVersions = pgTable(
  'report_versions',
  {
    id:                 uuid('id').defaultRandom().primaryKey(),
    tenantId:           uuid('tenant_id').notNull(),
    reportDefinitionId: uuid('report_definition_id').notNull()
                          .references(() => reportDefinitions.id),
    reportRunId:        uuid('report_run_id').notNull()
                          .references(() => reportRuns.id),
    versionNumber:      integer('version_number').notNull(),
    status:             varchar('status', { length: 30 }).notNull().default('generated'),
    snapshotData:       jsonb('snapshot_data').notNull(),
    snapshotHash:       varchar('snapshot_hash', { length: 64 }).notNull(),
    period:             jsonb('period').notNull(),
    parameters:         jsonb('parameters').notNull().default(sql`'{}'::jsonb`),
    exportIds:          jsonb('export_ids').notNull().default(sql`'[]'::jsonb`),
    isPublished:        boolean('is_published').notNull().default(false),
    publishedAt:        timestamp('published_at', { withTimezone: true }),
    publishedBy:        uuid('published_by'),
    diffFromPrevious:   jsonb('diff_from_previous'),
    createdBy:          uuid('created_by').notNull(),
    createdAt:          timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    tenantIdx:   index('idx_report_versions_tenant').on(table.tenantId),
    defIdx:      index('idx_report_versions_def').on(table.tenantId, table.reportDefinitionId),
    versionIdx:  uniqueIndex('idx_report_versions_unique').on(table.reportDefinitionId, table.versionNumber),
    publishedIdx: index('idx_report_versions_pub').on(table.tenantId, table.isPublished),
    hashIdx:     index('idx_report_versions_hash').on(table.snapshotHash),
  }),
);

// ── report_parameters ─────────────────────────────────────────

export const reportParameters = pgTable(
  'report_parameters',
  {
    id:                 uuid('id').defaultRandom().primaryKey(),
    tenantId:           uuid('tenant_id').notNull(),
    reportDefinitionId: uuid('report_definition_id').notNull()
                          .references(() => reportDefinitions.id),
    key:                varchar('key', { length: 100 }).notNull(),
    label:              varchar('label', { length: 255 }).notNull(),
    type:               varchar('type', { length: 30 }).notNull(),
    required:           boolean('required').notNull().default(false),
    defaultValue:       jsonb('default_value'),
    options:            jsonb('options'),
    validation:         jsonb('validation'),
    orderIndex:         integer('order_index').notNull().default(0),
    createdAt:          timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt:          timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    defIdx: index('idx_report_params_def').on(table.reportDefinitionId),
    keyIdx: uniqueIndex('idx_report_params_key').on(table.reportDefinitionId, table.key),
  }),
);

// ── consolidation_configs ─────────────────────────────────────

export const consolidationConfigs = pgTable(
  'consolidation_configs',
  {
    id:                          uuid('id').defaultRandom().primaryKey(),
    tenantId:                    uuid('tenant_id').notNull(),
    name:                        varchar('name', { length: 255 }).notNull(),
    description:                 text('description'),
    parentEntityId:              uuid('parent_entity_id').notNull(),
    reportingCurrency:           varchar('reporting_currency', { length: 3 }).notNull(),
    subsidiaries:                jsonb('subsidiaries').notNull().default(sql`'[]'::jsonb`),
    eliminationRules:            jsonb('elimination_rules').notNull().default(sql`'[]'::jsonb`),
    defaultFXMethod:             varchar('default_fx_method', { length: 30 }).notNull().default('current_rate'),
    fxRateSource:                jsonb('fx_rate_source').notNull(),
    generateEliminationSchedule: boolean('generate_elimination_schedule').notNull().default(true),
    generateFXSchedule:          boolean('generate_fx_schedule').notNull().default(true),
    generateNCISchedule:         boolean('generate_nci_schedule').notNull().default(true),
    accountMappings:             jsonb('account_mappings').notNull().default(sql`'[]'::jsonb`),
    isActive:                    boolean('is_active').notNull().default(true),
    createdBy:                   uuid('created_by').notNull(),
    createdAt:                   timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedBy:                   uuid('updated_by').notNull(),
    updatedAt:                   timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    tenantIdx: index('idx_consol_configs_tenant').on(table.tenantId),
    parentIdx: index('idx_consol_configs_parent').on(table.tenantId, table.parentEntityId),
    nameIdx:   uniqueIndex('idx_consol_configs_name').on(table.tenantId, table.name),
  }),
);

// ── report_approvals ──────────────────────────────────────────

export const reportApprovals = pgTable(
  'report_approvals',
  {
    id:              uuid('id').defaultRandom().primaryKey(),
    tenantId:        uuid('tenant_id').notNull(),
    reportVersionId: uuid('report_version_id').notNull()
                       .references(() => reportVersions.id),
    approverId:      uuid('approver_id').notNull(),
    approverName:    varchar('approver_name', { length: 255 }).notNull(),
    status:          varchar('status', { length: 20 }).notNull().default('pending'),
    comment:         text('comment'),
    decidedAt:       timestamp('decided_at', { withTimezone: true }),
    deadline:        timestamp('deadline', { withTimezone: true }).notNull(),
    escalatedTo:     uuid('escalated_to'),
    createdAt:       timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    versionIdx:  index('idx_report_approvals_version').on(table.reportVersionId),
    approverIdx: index('idx_report_approvals_approver').on(table.approverId, table.status),
    deadlineIdx: index('idx_report_approvals_deadline').on(table.status, table.deadline),
  }),
);

// ── report_distributions ──────────────────────────────────────

export const reportDistributions = pgTable(
  'report_distributions',
  {
    id:             uuid('id').defaultRandom().primaryKey(),
    tenantId:       uuid('tenant_id').notNull(),
    reportRunId:    uuid('report_run_id').notNull().references(() => reportRuns.id),
    reportExportId: uuid('report_export_id').notNull().references(() => reportExports.id),
    channel:        varchar('channel', { length: 20 }).notNull(),
    target:         text('target').notNull(),
    status:         varchar('status', { length: 20 }).notNull().default('pending'),
    sentAt:         timestamp('sent_at', { withTimezone: true }),
    deliveredAt:    timestamp('delivered_at', { withTimezone: true }),
    errorMessage:   text('error_message'),
    retryCount:     integer('retry_count').notNull().default(0),
    maxRetries:     integer('max_retries').notNull().default(3),
    nextRetryAt:    timestamp('next_retry_at', { withTimezone: true }),
    createdAt:      timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    tenantIdx: index('idx_report_dist_tenant').on(table.tenantId),
    runIdx:    index('idx_report_dist_run').on(table.reportRunId),
    statusIdx: index('idx_report_dist_status').on(table.status),
    retryIdx:  index('idx_report_dist_retry').on(table.status, table.nextRetryAt),
  }),
);

// ── report_audit_log (append-only) ────────────────────────────

export const reportAuditLog = pgTable(
  'report_audit_log',
  {
    id:           uuid('id').defaultRandom().primaryKey(),
    tenantId:     uuid('tenant_id').notNull(),
    timestamp:    timestamp('timestamp', { withTimezone: true }).notNull().defaultNow(),
    actorId:      uuid('actor_id').notNull(),
    actorName:    varchar('actor_name', { length: 255 }).notNull(),
    action:       varchar('action', { length: 50 }).notNull(),
    resourceType: varchar('resource_type', { length: 50 }).notNull(),
    resourceId:   uuid('resource_id').notNull(),
    details:      jsonb('details').notNull().default(sql`'{}'::jsonb`),
    parameters:   jsonb('parameters'),
    dataHash:     varchar('data_hash', { length: 64 }),
    previousHash: varchar('previous_hash', { length: 64 }).notNull(),
    entryHash:    varchar('entry_hash', { length: 64 }).notNull(),
    ipAddress:    varchar('ip_address', { length: 45 }),
    userAgent:    text('user_agent'),
  },
  (table) => ({
    tenantIdx:    index('idx_audit_log_tenant').on(table.tenantId),
    timestampIdx: index('idx_audit_log_ts').on(table.tenantId, table.timestamp),
    resourceIdx:  index('idx_audit_log_resource').on(table.resourceType, table.resourceId),
    hashIdx:      index('idx_audit_log_hash').on(table.entryHash),
    chainIdx:     index('idx_audit_log_chain').on(table.previousHash),
  }),
);
```

### RLS Policies (applied via migration)

```sql
-- Tenant isolation on all tables
ALTER TABLE report_definitions ENABLE ROW LEVEL SECURITY;
CREATE POLICY report_definitions_tenant ON report_definitions
  USING (tenant_id = current_setting('app.current_tenant_id')::uuid);
CREATE POLICY report_definitions_insert ON report_definitions
  FOR INSERT WITH CHECK (tenant_id = current_setting('app.current_tenant_id')::uuid);

-- Same pattern for: report_runs, report_exports, report_schedules,
-- report_templates, report_versions, report_parameters,
-- consolidation_configs, report_approvals, report_distributions,
-- report_audit_log

-- Published versions are immutable
CREATE POLICY report_versions_immutable ON report_versions
  FOR UPDATE USING (is_published = false);

-- Only approvers can update their own approval records
CREATE POLICY report_approvals_approver ON report_approvals
  FOR UPDATE USING (approver_id = current_setting('app.current_user_id')::uuid);

-- Audit log: append-only (revoke UPDATE/DELETE from app role)
REVOKE UPDATE, DELETE ON report_audit_log FROM app_role;
```

---

## Code Examples

### Example 1: Generate an Income Statement (P&L)

```typescript
import {
  ReportingService, ReportType, AccountingStandard,
  PeriodType, ExportFormat,
} from '@mcv/finance/reporting';
import type { FinancialStatement } from '@mcv/finance/reporting';

async function generateMonthlyPL() {
  const reporting = new ReportingService();

  const result = await reporting.generate({
    type: ReportType.INCOME_STATEMENT,
    standard: AccountingStandard.US_GAAP,
    entityIds: ['venture-alpha-uuid'],
    periodConfig: {
      type: PeriodType.FULL_MONTH,
      includeComparative: true,
      comparativeOffset: { value: 1, unit: 'years' },
    },
    comparativeConfig: {
      comparisons: [
        {
          id: 'yoy',
          type: 'period_over_period',
          basePeriod: null!, // Auto-resolved
          comparisonSource: {
            type: 'prior_period',
            periodOffset: { value: 1, unit: 'years' },
          },
          varianceMethod: 'both',
          favorableDirection: { revenue: 'positive', expense: 'negative' },
          materialityThresholds: [{
            name: 'standard',
            scope: 'all',
            absoluteThreshold: 10_000,
            percentageThreshold: 5,
            logic: 'or',
            severity: 'warning',
          }],
          highlightRules: [
            {
              condition: 'unfavorable',
              format: { textColor: '#DC2626', fontWeight: 'bold', icon: 'arrow_down' },
            },
            {
              condition: 'favorable',
              format: { textColor: '#16A34A', icon: 'arrow_up' },
            },
          ],
          showVarianceColumn: true,
          showPercentageColumn: true,
          showDirectionIndicators: true,
        },
        {
          id: 'budget',
          type: 'budget_vs_actual',
          basePeriod: null!,
          comparisonSource: {
            type: 'budget',
            datasetId: 'fy2025-operating-budget',
            datasetVersion: 'approved',
          },
          varianceMethod: 'both',
          favorableDirection: { revenue: 'positive', expense: 'negative' },
          materialityThresholds: [{
            name: 'budget-threshold',
            scope: 'all',
            absoluteThreshold: 5_000,
            percentageThreshold: 10,
            logic: 'and',
            severity: 'critical',
          }],
          highlightRules: [],
          showVarianceColumn: true,
          showPercentageColumn: true,
          showDirectionIndicators: true,
        },
      ],
      layout: 'side_by_side',
      includeGrandTotalComparison: true,
    },
    materialityThresholds: [{
      name: 'default', scope: 'all',
      absoluteThreshold: 10_000, percentageThreshold: 5,
      logic: 'or', severity: 'warning',
    }],
    defaultExportFormats: [ExportFormat.PDF, ExportFormat.EXCEL],
  });

  const statement = result.version.snapshotData as FinancialStatement;

  // Print revenue section
  const revenueSection = statement.sections.find(s => s.key === 'revenue');
  console.log(`Revenue: ${revenueSection?.subtotal.formatted}`);

  for (const item of revenueSection?.lineItems ?? []) {
    const v = item.variance;
    const arrow = v?.direction === 'favorable' ? '▲' : '▼';
    console.log(`  ${item.accountName}: ${item.amount.formatted}` +
      (v ? ` (${arrow} ${v.percentage.toFixed(1)}%)` : ''));
  }

  console.log(`Net Income: ${statement.totals['net_income']?.formatted}`);

  for (const exp of result.exports) {
    console.log(`Export: ${exp.format} → ${exp.storagePath} (${(exp.fileSizeBytes / 1024).toFixed(1)} KB)`);
  }

  return result;
}
```

### Example 2: Generate a Balance Sheet

```typescript
import {
  ReportingService, ReportType, AccountingStandard,
  PeriodType, ExportFormat,
} from '@mcv/finance/reporting';
import type { FinancialStatement } from '@mcv/finance/reporting';

async function generateBalanceSheet() {
  const reporting = new ReportingService();

  const result = await reporting.generate({
    type: ReportType.BALANCE_SHEET,
    standard: AccountingStandard.US_GAAP,
    entityIds: ['venture-alpha-uuid'],
    periodConfig: {
      type: PeriodType.CUSTOM,
      customStart: '2025-01-01',
      customEnd: '2025-01-31',
      includeComparative: true,
      comparativeOffset: { value: 1, unit: 'years' },
    },
    drillDown: {
      enabled: true,
      maxDepth: 3,
      levels: [
        { field: 'account_group', label: 'Account Group' },
        { field: 'account_code', label: 'Account' },
        { field: 'transaction_id', label: 'Transaction' },
      ],
    },
    sections: [
      { key: 'current_assets', label: 'Current Assets',
        accountRange: { from: '1000', to: '1499' }, sectionType: 'detail',
        signConvention: 'natural',
        formatting: { boldSubtotal: true, topBorder: false, bottomBorder: 'single', indent: 0, hideIfZero: false } },
      { key: 'non_current_assets', label: 'Non-Current Assets',
        accountRange: { from: '1500', to: '1999' }, sectionType: 'detail',
        signConvention: 'natural',
        formatting: { boldSubtotal: true, topBorder: false, bottomBorder: 'single', indent: 0, hideIfZero: false } },
      { key: 'total_assets', label: 'Total Assets',
        sectionType: 'total',
        formatting: { boldSubtotal: true, topBorder: true, bottomBorder: 'double', indent: 0, hideIfZero: false } },
      { key: 'current_liabilities', label: 'Current Liabilities',
        accountRange: { from: '2000', to: '2499' }, sectionType: 'detail',
        signConvention: 'natural',
        formatting: { boldSubtotal: true, topBorder: false, bottomBorder: 'single', indent: 0, hideIfZero: false } },
      { key: 'non_current_liabilities', label: 'Non-Current Liabilities',
        accountRange: { from: '2500', to: '2999' }, sectionType: 'detail',
        signConvention: 'natural',
        formatting: { boldSubtotal: true, topBorder: false, bottomBorder: 'single', indent: 0, hideIfZero: false } },
      { key: 'equity', label: "Stockholders' Equity",
        accountRange: { from: '3000', to: '3999' }, sectionType: 'detail',
        signConvention: 'natural',
        formatting: { boldSubtotal: true, topBorder: false, bottomBorder: 'single', indent: 0, hideIfZero: false } },
      { key: 'total_liabilities_equity', label: 'Total Liabilities & Equity',
        sectionType: 'total',
        formatting: { boldSubtotal: true, topBorder: true, bottomBorder: 'double', indent: 0, hideIfZero: false } },
    ],
    defaultExportFormats: [ExportFormat.PDF],
  });

  const statement = result.version.snapshotData as FinancialStatement;

  // Verify accounting equation: Assets = Liabilities + Equity
  const totalAssets = statement.totals['total_assets']?.value ?? 0;
  const totalLE = statement.totals['total_liabilities_equity']?.value ?? 0;

  if (Math.abs(totalAssets - totalLE) > 0.01) {
    throw new Error(`Balance sheet does not balance! Assets: ${totalAssets}, L+E: ${totalLE}`);
  }

  console.log('✓ Balance sheet balances');
  console.log(`Total Assets: ${statement.totals['total_assets']?.formatted}`);
  console.log(`Total L&E:    ${statement.totals['total_liabilities_equity']?.formatted}`);

  // Drill down into Cash
  const cashItem = statement.sections.flatMap(s => s.lineItems).find(li => li.accountCode === '1010');
  if (cashItem?.drillDownRef) {
    const detail = await reporting.drillDown(result.reportRun.id, cashItem.drillDownRef, { depth: 1 });
    console.log(`\nCash detail (${detail.rows.length} entries):`);
    for (const row of detail.rows.slice(0, 5)) {
      console.log(`  ${row.date} | ${row.description} | ${row.amount.formatted}`);
    }
  }

  return result;
}
```

### Example 3: Generate a Cash Flow Statement

```typescript
import {
  ReportingService, ReportType, AccountingStandard,
  PeriodType, ExportFormat,
} from '@mcv/finance/reporting';
import type { FinancialStatement } from '@mcv/finance/reporting';

async function generateCashFlowStatement() {
  const reporting = new ReportingService();

  const result = await reporting.generate({
    type: ReportType.CASH_FLOW_STATEMENT,
    standard: AccountingStandard.US_GAAP,
    entityIds: ['venture-alpha-uuid'],
    periodConfig: {
      type: PeriodType.YTD,
      includeComparative: true,
      comparativeOffset: { value: 1, unit: 'years' },
      fiscalCalendarId: 'calendar-jan-dec',
    },
    parameters: [{
      key: 'method', label: 'Cash Flow Method', type: 'select',
      required: true, defaultValue: 'indirect',
      options: [
        { value: 'indirect', label: 'Indirect Method' },
        { value: 'direct', label: 'Direct Method' },
      ],
    }],
    sections: [
      { key: 'operating_activities', label: 'Cash Flows from Operating Activities',
        sectionType: 'detail',
        children: [
          { key: 'net_income_start', label: 'Net Income', sectionType: 'header', signConvention: 'natural' },
          { key: 'adjustments', label: 'Adjustments for Non-Cash Items', sectionType: 'detail',
            signConvention: 'natural',
            children: [
              { key: 'depreciation', label: 'Depreciation & Amortization', sectionType: 'detail', signConvention: 'natural' },
              { key: 'stock_comp', label: 'Stock-Based Compensation', sectionType: 'detail', signConvention: 'natural' },
            ] },
          { key: 'working_capital', label: 'Changes in Working Capital', sectionType: 'detail',
            signConvention: 'natural',
            children: [
              { key: 'ar_change', label: 'Accounts Receivable', sectionType: 'detail', signConvention: 'reversed' },
              { key: 'ap_change', label: 'Accounts Payable', sectionType: 'detail', signConvention: 'natural' },
            ] },
        ],
        formatting: { boldSubtotal: true, topBorder: false, bottomBorder: 'single', indent: 0, hideIfZero: false } },
      { key: 'investing_activities', label: 'Cash Flows from Investing Activities',
        sectionType: 'detail',
        formatting: { boldSubtotal: true, topBorder: false, bottomBorder: 'single', indent: 0, hideIfZero: false } },
      { key: 'financing_activities', label: 'Cash Flows from Financing Activities',
        sectionType: 'detail',
        formatting: { boldSubtotal: true, topBorder: false, bottomBorder: 'single', indent: 0, hideIfZero: false } },
      { key: 'net_change', label: 'Net Change in Cash', sectionType: 'total',
        formatting: { boldSubtotal: true, topBorder: true, bottomBorder: 'double', indent: 0, hideIfZero: false } },
      { key: 'beginning_cash', label: 'Cash at Beginning of Period', sectionType: 'detail',
        formatting: { boldSubtotal: false, topBorder: false, bottomBorder: 'none', indent: 0, hideIfZero: false } },
      { key: 'ending_cash', label: 'Cash at End of Period', sectionType: 'total',
        formatting: { boldSubtotal: true, topBorder: true, bottomBorder: 'double', indent: 0, hideIfZero: false } },
    ],
    defaultExportFormats: [ExportFormat.PDF, ExportFormat.EXCEL],
  });

  const statement = result.version.snapshotData as FinancialStatement;

  // Verify reconciliation: beginning + net change = ending
  const beginning = statement.totals['beginning_cash']?.value ?? 0;
  const netChange = statement.totals['net_change']?.value ?? 0;
  const ending = statement.totals['ending_cash']?.value ?? 0;

  if (Math.abs((beginning + netChange) - ending) > 0.01) {
    throw new Error('Cash flow statement does not reconcile!');
  }

  console.log('✓ Cash flow reconciles');
  console.log(`Operating:  ${statement.sections.find(s => s.key === 'operating_activities')?.subtotal.formatted}`);
  console.log(`Investing:  ${statement.sections.find(s => s.key === 'investing_activities')?.subtotal.formatted}`);
  console.log(`Financing:  ${statement.sections.find(s => s.key === 'financing_activities')?.subtotal.formatted}`);
  console.log(`Net Change: ${statement.totals['net_change']?.formatted}`);
  console.log(`Ending:     ${statement.totals['ending_cash']?.formatted}`);

  return result;
}
```

### Example 4: Build a Custom Report with Formula Engine

```typescript
import {
  ReportingService, ReportDesigner, ColumnBuilder, FormulaEngine,
  ReportType, PeriodType, ExportFormat,
} from '@mcv/finance/reporting';

async function buildCustomProfitabilityReport() {
  const designer = new ReportDesigner();

  const definition = designer
    .create('Monthly Profitability by Department')
    .type(ReportType.CUSTOM)
    .description('Department-level profitability with margin analysis')
    .entities(['venture-alpha-uuid'])
    .period({
      type: PeriodType.FULL_MONTH,
      includeComparative: true,
      comparativeOffset: { value: 1, unit: 'months' },
    })
    .addColumn(new ColumnBuilder('department').header('Department')
      .sourceField('cost_center.name').dataType('text').alignment('left').width(200).build())
    .addColumn(new ColumnBuilder('revenue').header('Revenue')
      .sourceField('sum(amount) WHERE account_type = revenue')
      .dataType('monetary').format('#,##0.00').aggregation('sum').build())
    .addColumn(new ColumnBuilder('direct_costs').header('Direct Costs')
      .sourceField('sum(amount) WHERE account_type = cogs')
      .dataType('monetary').format('#,##0.00').aggregation('sum').build())
    .addColumn(new ColumnBuilder('overhead').header('Allocated Overhead')
      .sourceField('sum(amount) WHERE account_type = overhead')
      .dataType('monetary').format('#,##0.00').aggregation('sum').build())
    .addFormulaColumn({
      id: 'gross_profit', name: 'Gross Profit',
      expression: 'revenue - direct_costs',
      resultType: 'monetary', formatString: '#,##0.00',
      dependencies: ['revenue', 'direct_costs'],
    })
    .addFormulaColumn({
      id: 'gross_margin', name: 'Gross Margin %',
      expression: 'IF(revenue != 0, (revenue - direct_costs) / revenue * 100, 0)',
      resultType: 'percentage', formatString: '0.0%',
      dependencies: ['revenue', 'direct_costs'],
    })
    .addFormulaColumn({
      id: 'net_profit', name: 'Net Profit',
      expression: 'revenue - direct_costs - overhead',
      resultType: 'monetary', formatString: '#,##0.00',
      dependencies: ['revenue', 'direct_costs', 'overhead'],
    })
    .addFormulaColumn({
      id: 'net_margin', name: 'Net Margin %',
      expression: 'IF(revenue != 0, (revenue - direct_costs - overhead) / revenue * 100, 0)',
      resultType: 'percentage', formatString: '0.0%',
      dependencies: ['revenue', 'direct_costs', 'overhead'],
    })
    .groupBy('department', { showSubtotals: true, level: 0 })
    .sortBy('net_profit', 'desc')
    .addConditionalFormat({
      targetColumn: 'gross_margin',
      rules: [
        { condition: 'custom', expression: 'gross_margin < 20',
          format: { backgroundColor: '#FEF2F2', textColor: '#DC2626', fontWeight: 'bold', icon: 'warning' } },
        { condition: 'custom', expression: 'gross_margin >= 50',
          format: { backgroundColor: '#F0FDF4', textColor: '#16A34A', icon: 'check' } },
      ],
    })
    .addConditionalFormat({
      targetColumn: 'net_margin',
      rules: [
        { condition: 'custom', expression: 'net_margin < 0',
          format: { backgroundColor: '#FEF2F2', textColor: '#DC2626', fontWeight: 'bold', icon: 'arrow_down' } },
      ],
    })
    .addMaterialityThreshold({
      name: 'significant_variance', scope: 'all',
      absoluteThreshold: 25_000, percentageThreshold: 15,
      logic: 'or', severity: 'warning',
    })
    .exportFormats([ExportFormat.PDF, ExportFormat.EXCEL, ExportFormat.CSV])
    .tags(['profitability', 'management', 'monthly'])
    .build();

  const reporting = new ReportingService();
  const savedDef = await reporting.saveDefinition(definition);
  const result = await reporting.generate({ definitionId: savedDef.id, parameterValues: {} });

  console.log('Custom report generated:', result.reportRun.id);
  console.log('Rows:', result.reportRun.rowCount);

  // Validate formula engine
  const formula = new FormulaEngine();
  const testRow = { revenue: 100_000, direct_costs: 60_000, overhead: 20_000 };
  const gm = formula.evaluate('IF(revenue != 0, (revenue - direct_costs) / revenue * 100, 0)', testRow);
  console.log(`Formula test — Gross Margin: ${gm}%`); // 40%

  return result;
}
```

### Example 5: Schedule a Monthly Report with Auto-Distribution

```typescript
import {
  ReportScheduler, PeriodType, ExportFormat, DistributionChannel,
} from '@mcv/finance/reporting';

async function scheduleMonthlyPLDistribution() {
  const scheduler = new ReportScheduler();

  const created = await scheduler.create({
    tenantId: 'tenant-mcv-global',
    reportDefinitionId: 'def-monthly-pl-uuid',
    name: 'Monthly P&L — Venture Alpha',
    cronExpression: '0 6 5 * *',          // 5th of every month, 6 AM
    timezone: 'America/New_York',
    periodType: PeriodType.FULL_MONTH,
    periodOffset: { value: 1, unit: 'months', direction: 'back' },
    entityIds: ['venture-alpha-uuid'],
    exportFormats: [ExportFormat.PDF, ExportFormat.EXCEL],

    // CFO approval before distribution
    requireApproval: true,
    approverIds: ['cfo-user-uuid', 'controller-user-uuid'],
    approvalDeadlineHours: 48,

    // Business-day aware
    skipNonBusinessDays: true,
    holidayCalendarId: 'calendar-us-federal',
    businessDayAdjustment: 'next',

    distributions: [
      {
        channel: DistributionChannel.EMAIL,
        target: 'finance-team@mcv.one',
        config: { from: 'reports@mcv.one' },
        formats: [ExportFormat.PDF, ExportFormat.EXCEL],
        includePreview: true,
        subject: 'Monthly P&L — {{period.label}} — {{entity.name}}',
        message: [
          'Hi Finance Team,',
          '',
          'The monthly P&L for {{period.label}} is attached.',
          '',
          '• Revenue: {{totals.revenue.formatted}}',
          '• Net Income: {{totals.net_income.formatted}}',
          '',
          'View: {{report.portalUrl}}',
        ].join('\n'),
      },
      {
        channel: DistributionChannel.SLACK,
        target: '#finance-reports',
        config: { botToken: '{{env.SLACK_BOT_TOKEN}}' },
        formats: [ExportFormat.PDF],
        includePreview: true,
        message: ':bar_chart: Monthly P&L for *{{period.label}}* is ready!\n' +
                 'Revenue: `{{totals.revenue.formatted}}` | Net Income: `{{totals.net_income.formatted}}`\n' +
                 '<{{report.portalUrl}}|View Full Report>',
      },
      {
        channel: DistributionChannel.WEBHOOK,
        target: 'https://warehouse.mcv.one/api/ingest/financial-reports',
        config: {
          method: 'POST',
          headers: { Authorization: 'Bearer {{env.WAREHOUSE_API_KEY}}' },
          signPayload: true,
        },
        formats: [ExportFormat.JSON],
        includePreview: false,
      },
    ],

    parameterOverrides: { include_budget_comparison: true, include_yoy_comparison: true },
    maxConsecutiveErrors: 5,
    isActive: true,
    createdBy: 'admin-user-uuid',
    updatedBy: 'admin-user-uuid',
  });

  console.log('Schedule created:', created.id);
  console.log('Next run:', created.nextRunAt);

  // Preview next 5 execution times
  const nextRuns = await scheduler.previewNextRuns(created.id, 5);
  for (const run of nextRuns) {
    console.log(`  ${run.scheduledAt} → Period: ${run.resolvedPeriod.label}`);
  }

  return created;
}
```

### Example 6: Multi-Venture Consolidation

```typescript
import {
  ReportingService, ConsolidationEngine, ReportType, PeriodType,
  FXTranslationMethod, ConsolidationType, ExportFormat,
} from '@mcv/finance/reporting';
import type { ConsolidationConfig } from '@mcv/finance/reporting';

async function runConsolidation() {
  const consolidation = new ConsolidationEngine();

  // Define the consolidation structure
  const config: ConsolidationConfig = {
    id: 'consol-mcv-global',
    tenantId: 'tenant-mcv-global',
    name: 'MCV Global Consolidated',
    parentEntityId: 'mcv-holding-uuid',
    reportingCurrency: 'USD',
    subsidiaries: [
      {
        entityId: 'venture-alpha-uuid',
        entityName: 'Venture Alpha (US)',
        functionalCurrency: 'USD',
        ownershipPercentage: 100,
        consolidationType: ConsolidationType.FULL,
        hasSubConsolidation: false,
      },
      {
        entityId: 'venture-beta-uuid',
        entityName: 'Venture Beta (Canada)',
        functionalCurrency: 'CAD',
        ownershipPercentage: 80,
        consolidationType: ConsolidationType.FULL,
        fxMethodOverride: FXTranslationMethod.CURRENT_RATE,
        acquisitionDate: '2022-03-15',
        goodwillAtAcquisition: 2_500_000,
        hasSubConsolidation: false,
      },
      {
        entityId: 'venture-gamma-uuid',
        entityName: 'Venture Gamma (EU)',
        functionalCurrency: 'EUR',
        ownershipPercentage: 60,
        consolidationType: ConsolidationType.FULL,
        fxMethodOverride: FXTranslationMethod.CURRENT_RATE,
        acquisitionDate: '2023-01-01',
        goodwillAtAcquisition: 5_000_000,
        fairValueAdjustments: [
          { accountCode: '1800', amount: 1_200_000, usefulLifeMonths: 120, description: 'Customer relationships' },
          { accountCode: '1850', amount: 800_000, usefulLifeMonths: 60, description: 'Technology IP' },
        ],
        hasSubConsolidation: false,
      },
      {
        entityId: 'venture-delta-uuid',
        entityName: 'Venture Delta (JV)',
        functionalCurrency: 'GBP',
        ownershipPercentage: 30,
        consolidationType: ConsolidationType.EQUITY_METHOD,
        hasSubConsolidation: false,
      },
    ],
    eliminationRules: [
      {
        id: 'elim-ic-ar-ap', name: 'IC Receivables/Payables',
        debitAccountCode: '2100', creditAccountCode: '1200',
        matchKey: 'intercompany_id', isAutomatic: true,
        matchTolerance: 100, category: 'receivable_payable', isActive: true,
      },
      {
        id: 'elim-ic-rev-exp', name: 'IC Revenue/COGS',
        debitAccountCode: '4000', creditAccountCode: '5000',
        matchKey: 'intercompany_invoice', isAutomatic: true,
        category: 'revenue_expense', isActive: true,
      },
      {
        id: 'elim-ic-invest', name: 'IC Investment/Equity',
        debitAccountCode: '3000', creditAccountCode: '1600',
        matchKey: 'subsidiary_id', isAutomatic: true,
        category: 'investment_equity', isActive: true,
      },
    ],
    defaultFXMethod: FXTranslationMethod.CURRENT_RATE,
    fxRateSource: {
      primarySource: 'ecb',
      fallbackSource: 'fed',
      closingRateType: 'mid',
      averageRateMethod: 'monthly_average',
    },
    generateEliminationSchedule: true,
    generateFXSchedule: true,
    generateNCISchedule: true,
    accountMappings: [
      // Map Venture Beta's Canadian GAAP accounts to consolidated chart
      { sourceEntityId: 'venture-beta-uuid', sourceAccountCode: 'CA-1010', targetAccountCode: '1010', ratio: 1 },
      { sourceEntityId: 'venture-beta-uuid', sourceAccountCode: 'CA-4010', targetAccountCode: '4010', ratio: 1 },
    ],
    isActive: true,
    createdBy: 'admin-uuid',
    createdAt: new Date(),
    updatedBy: 'admin-uuid',
    updatedAt: new Date(),
  };

  // Execute consolidation
  const reporting = new ReportingService();
  const result = await reporting.generate({
    type: ReportType.CONSOLIDATION,
    entityIds: ['mcv-holding-uuid'],
    consolidationConfigId: config.id,
    periodConfig: {
      type: PeriodType.FULL_QUARTER,
      includeComparative: true,
      comparativeOffset: { value: 1, unit: 'years' },
    },
    defaultExportFormats: [ExportFormat.PDF, ExportFormat.EXCEL],
  });

  console.log('Consolidation complete:', result.reportRun.id);
  console.log(`Duration: ${result.reportRun.durationMs}ms`);

  // Access supporting schedules
  const data = result.version.snapshotData as Record<string, unknown>;
  const elimSchedule = data['elimination_schedule'] as Array<{
    rule: string; debitAmount: number; creditAmount: number; matched: boolean;
  }>;
  console.log(`\nEliminations: ${elimSchedule.length} entries`);
  console.log(`  Matched: ${elimSchedule.filter(e => e.matched).length}`);
  console.log(`  Unmatched: ${elimSchedule.filter(e => !e.matched).length}`);

  const fxSchedule = data['fx_translation_schedule'] as Array<{
    entity: string; closingRate: number; avgRate: number; ctaAmount: number;
  }>;
  console.log(`\nFX Translations:`);
  for (const fx of fxSchedule) {
    console.log(`  ${fx.entity}: closing=${fx.closingRate}, avg=${fx.avgRate}, CTA=${fx.ctaAmount}`);
  }

  const nciSchedule = data['nci_schedule'] as Array<{
    entity: string; nciEquity: number; nciIncome: number;
  }>;
  console.log(`\nMinority Interest:`);
  for (const nci of nciSchedule) {
    console.log(`  ${nci.entity}: Equity NCI=${nci.nciEquity}, Income NCI=${nci.nciIncome}`);
  }

  return result;
}
```

### Example 7: Comparative Analysis (Budget vs Actual)

```typescript
import {
  ReportingService, ComparativeAnalysisEngine,
  ReportType, PeriodType, ExportFormat,
} from '@mcv/finance/reporting';

async function runBudgetVsActualAnalysis() {
  const analysis = new ComparativeAnalysisEngine();

  const result = await analysis.execute({
    reportType: ReportType.INCOME_STATEMENT,
    entityIds: ['venture-alpha-uuid'],
    period: {
      type: PeriodType.QTD,
      fiscalCalendarId: 'calendar-jan-dec',
    },
    comparisons: [
      {
        id: 'bva',
        type: 'budget_vs_actual',
        basePeriod: null!, // Auto-resolved from period config
        comparisonSource: {
          type: 'budget',
          datasetId: 'fy2025-operating-budget',
          datasetVersion: 'approved',
        },
        varianceMethod: 'both',
        favorableDirection: {
          revenue: 'positive',
          expense: 'negative',
        },
        materialityThresholds: [
          {
            name: 'executive-review',
            scope: 'all',
            absoluteThreshold: 50_000,
            percentageThreshold: 10,
            logic: 'or',
            severity: 'critical',
          },
          {
            name: 'management-review',
            scope: 'all',
            absoluteThreshold: 10_000,
            percentageThreshold: 5,
            logic: 'or',
            severity: 'warning',
          },
        ],
        highlightRules: [
          {
            condition: 'exceeds_threshold',
            format: {
              backgroundColor: '#FEF2F2',
              textColor: '#DC2626',
              fontWeight: 'bold',
              icon: 'warning',
            },
          },
          {
            condition: 'favorable',
            format: {
              textColor: '#16A34A',
              icon: 'arrow_up',
            },
          },
          {
            condition: 'unfavorable',
            format: {
              textColor: '#DC2626',
              icon: 'arrow_down',
            },
          },
        ],
        showVarianceColumn: true,
        showPercentageColumn: true,
        showDirectionIndicators: true,
      },
      {
        id: 'fva',
        type: 'forecast_vs_actual',
        basePeriod: null!,
        comparisonSource: {
          type: 'forecast',
          datasetId: 'q3-2025-reforecast',
          datasetVersion: 'latest',
        },
        varianceMethod: 'both',
        favorableDirection: { revenue: 'positive', expense: 'negative' },
        materialityThresholds: [{
          name: 'forecast-threshold',
          scope: 'all',
          absoluteThreshold: 25_000,
          percentageThreshold: 5,
          logic: 'or',
          severity: 'warning',
        }],
        highlightRules: [],
        showVarianceColumn: true,
        showPercentageColumn: true,
        showDirectionIndicators: true,
      },
    ],
    layout: 'side_by_side',
    exportFormats: [ExportFormat.PDF, ExportFormat.EXCEL],
  });

  // Summarize material variances
  const materialItems = result.variances.filter(v => v.isMaterial);
  console.log(`\n⚠️  Material variances: ${materialItems.length}`);

  for (const item of materialItems) {
    const arrow = item.direction === 'favorable' ? '✅' : '❌';
    console.log(
      `  ${arrow} ${item.accountName}: ` +
      `Actual ${item.actual.formatted} vs Budget ${item.budget.formatted} ` +
      `(${item.variancePercent > 0 ? '+' : ''}${item.variancePercent.toFixed(1)}%)`,
    );
  }

  // Top 5 unfavorable variances
  const unfavorable = result.variances
    .filter(v => v.direction === 'unfavorable')
    .sort((a, b) => Math.abs(b.varianceAmount) - Math.abs(a.varianceAmount))
    .slice(0, 5);

  console.log('\nTop 5 Unfavorable Variances:');
  for (const item of unfavorable) {
    console.log(`  ${item.accountName}: ${item.variance.formatted} (${item.variancePercent.toFixed(1)}%)`);
  }

  return result;
}
```

### Example 8: Excel Export with Preserved Formulas

```typescript
import {
  ReportingService, ExportEngine, ExcelRenderer,
  ReportType, PeriodType, ExportFormat,
} from '@mcv/finance/reporting';
import type { ReportTemplate, ExportOptions } from '@mcv/finance/reporting';

async function generateExcelWithFormulas() {
  const reporting = new ReportingService();
  const exporter = new ExportEngine();

  // First, generate the report data
  const result = await reporting.generate({
    type: ReportType.INCOME_STATEMENT,
    entityIds: ['venture-alpha-uuid'],
    periodConfig: { type: PeriodType.FULL_YEAR, includeComparative: true,
      comparativeOffset: { value: 1, unit: 'years' } },
    defaultExportFormats: [ExportFormat.EXCEL],
  });

  // Configure Excel-specific export options
  const excelOptions: ExportOptions = {
    format: ExportFormat.EXCEL,
    templateId: 'tpl-mcv-branded',
    filename: 'Venture_Alpha_PL_FY2025.xlsx',

    excelConfig: {
      // Multi-sheet layout
      sheets: [
        {
          name: 'Income Statement',
          type: 'financial_statement',
          data: result.version.snapshotData,
        },
        {
          name: 'Monthly Detail',
          type: 'monthly_breakdown',
          columns: [
            'month', 'revenue', 'cogs', 'gross_profit',
            'opex', 'ebitda', 'depreciation', 'ebit',
            'interest', 'tax', 'net_income',
          ],
        },
        {
          name: 'Variance Analysis',
          type: 'comparative',
          comparisons: ['yoy', 'budget'],
        },
        {
          name: 'Charts',
          type: 'charts',
          charts: [
            { type: 'bar', title: 'Revenue by Month', dataSheet: 'Monthly Detail', dataRange: 'A:B' },
            { type: 'line', title: 'Net Income Trend', dataSheet: 'Monthly Detail', dataRange: 'A:K' },
            { type: 'waterfall', title: 'P&L Waterfall', dataSheet: 'Income Statement' },
          ],
        },
      ],

      // Preserve live Excel formulas (not just static values)
      preserveFormulas: true,
      formulaMappings: {
        'gross_profit': '=B{row}-C{row}',         // Revenue - COGS
        'gross_margin': '=IF(B{row}<>0,D{row}/B{row},0)',
        'ebitda': '=D{row}-E{row}',               // Gross profit - Opex
        'ebit': '=F{row}-G{row}',
        'net_income': '=H{row}-I{row}-J{row}',
        'yoy_variance': '=B{row}-L{row}',
        'yoy_pct': '=IF(L{row}<>0,(B{row}-L{row})/L{row},0)',
      },

      // Formatting
      freezePanes: { row: 2, column: 1 },
      autoFilter: true,
      autoWidth: true,
      monetaryFormat: '#,##0.00',
      percentageFormat: '0.0%',

      headerStyle: {
        fill: '#1E3A5F',
        fontColor: '#FFFFFF',
        fontWeight: 'bold',
        fontSize: 11,
      },

      alternatingRowColors: {
        even: '#F8FAFC',
        odd: '#FFFFFF',
      },

      // Pivot tables
      includePivotTables: true,
      pivotTables: [
        {
          name: 'Revenue by Department',
          sourceSheet: 'Monthly Detail',
          rows: ['department'],
          columns: ['month'],
          values: [{ field: 'revenue', aggregation: 'sum' }],
        },
      ],

      // Named ranges for easy reference
      namedRanges: [
        { name: 'TotalRevenue', sheet: 'Income Statement', range: 'B5' },
        { name: 'NetIncome', sheet: 'Income Statement', range: 'B45' },
        { name: 'GrossMargin', sheet: 'Income Statement', range: 'C15' },
      ],

      // Print setup
      printArea: 'A1:M50',
      printTitles: { rows: '1:2' },
      pageSetup: {
        orientation: 'landscape',
        paperSize: 'letter',
        fitToWidth: 1,
        fitToHeight: 0,
      },
    },

    // Branding
    watermark: {
      enabled: true,
      text: 'CONFIDENTIAL — MCV Global Consortium',
      opacity: 0.08,
    },
  };

  // Generate the Excel export
  const excelExport = await exporter.export(result.version, excelOptions);

  console.log('Excel generated:', excelExport.storagePath);
  console.log(`Size: ${(excelExport.fileSizeBytes / 1024).toFixed(1)} KB`);
  console.log(`Sheets: ${excelExport.sheetCount}`);
  console.log(`Hash: ${excelExport.contentHash}`);

  // Get a signed download URL (valid 1 hour)
  const url = await exporter.getDownloadUrl(excelExport.id, { expiresInSeconds: 3600 });
  console.log(`Download: ${url}`);

  return excelExport;
}
```

---

## Error Codes

| Code | Constant | HTTP | Description |
|------|----------|------|-------------|
| `RPT_DEF_NOT_FOUND` | `REPORT_DEFINITION_NOT_FOUND` | 404 | Report definition does not exist or is not accessible |
| `RPT_DEF_INACTIVE` | `REPORT_DEFINITION_INACTIVE` | 409 | Report definition is deactivated |
| `RPT_DEF_NAME_EXISTS` | `REPORT_DEFINITION_NAME_EXISTS` | 409 | A report definition with this name already exists in the tenant |
| `RPT_INVALID_PERIOD` | `INVALID_PERIOD_CONFIG` | 400 | Period configuration is invalid (e.g., start > end, unsupported type) |
| `RPT_PERIOD_NO_DATA` | `PERIOD_NO_DATA` | 404 | No ledger data exists for the requested period |
| `RPT_ENTITY_NOT_FOUND` | `ENTITY_NOT_FOUND` | 404 | One or more entity IDs do not exist |
| `RPT_ENTITY_NO_ACCESS` | `ENTITY_ACCESS_DENIED` | 403 | User does not have reporting access to the requested entity |
| `RPT_TEMPLATE_NOT_FOUND` | `TEMPLATE_NOT_FOUND` | 404 | Report template does not exist |
| `RPT_TEMPLATE_INCOMPATIBLE` | `TEMPLATE_INCOMPATIBLE` | 400 | Template does not support the requested report type or export format |
| `RPT_FORMULA_SYNTAX` | `FORMULA_SYNTAX_ERROR` | 400 | Formula expression contains a syntax error |
| `RPT_FORMULA_CIRCULAR` | `FORMULA_CIRCULAR_DEPENDENCY` | 400 | Circular dependency detected in formula definitions |
| `RPT_FORMULA_DIV_ZERO` | `FORMULA_DIVISION_BY_ZERO` | 422 | Division by zero encountered during formula evaluation |
| `RPT_FORMULA_REF_INVALID` | `FORMULA_INVALID_REFERENCE` | 400 | Formula references a column that does not exist |
| `RPT_EXPORT_FAILED` | `EXPORT_GENERATION_FAILED` | 500 | Export renderer failed (Puppeteer crash, ExcelJS error, etc.) |
| `RPT_EXPORT_TOO_LARGE` | `EXPORT_SIZE_EXCEEDED` | 413 | Generated export exceeds the maximum allowed file size |
| `RPT_PDF_TIMEOUT` | `PDF_RENDER_TIMEOUT` | 504 | Puppeteer PDF rendering timed out |
| `RPT_SCHEDULE_INVALID_CRON` | `INVALID_CRON_EXPRESSION` | 400 | The cron expression is syntactically invalid |
| `RPT_SCHEDULE_MAX_ERRORS` | `SCHEDULE_MAX_ERRORS_EXCEEDED` | 409 | Schedule auto-disabled after exceeding max consecutive errors |
| `RPT_DIST_FAILED` | `DISTRIBUTION_FAILED` | 500 | Failed to deliver report to one or more distribution targets |
| `RPT_DIST_MAX_RETRIES` | `DISTRIBUTION_MAX_RETRIES` | 500 | Distribution exhausted all retry attempts |
| `RPT_APPROVAL_NOT_FOUND` | `APPROVAL_NOT_FOUND` | 404 | Approval record not found |
| `RPT_APPROVAL_NOT_AUTHORIZED` | `APPROVAL_NOT_AUTHORIZED` | 403 | User is not an authorized approver for this report |
| `RPT_APPROVAL_EXPIRED` | `APPROVAL_DEADLINE_EXPIRED` | 410 | The approval deadline has passed |
| `RPT_VERSION_IMMUTABLE` | `VERSION_IMMUTABLE` | 409 | Cannot modify a published report version |
| `RPT_VERSION_HASH_MISMATCH` | `VERSION_HASH_MISMATCH` | 409 | Snapshot hash verification failed (possible tampering) |
| `RPT_CONSOL_CONFIG_NOT_FOUND` | `CONSOLIDATION_CONFIG_NOT_FOUND` | 404 | Consolidation configuration does not exist |
| `RPT_CONSOL_FX_MISSING` | `FX_RATE_NOT_AVAILABLE` | 422 | Required FX rate not available for the reporting period |
| `RPT_CONSOL_ELIM_MISMATCH` | `ELIMINATION_MISMATCH` | 422 | Inter-company balances do not match within tolerance |
| `RPT_CONSOL_CIRCULAR` | `CONSOLIDATION_CIRCULAR_STRUCTURE` | 400 | Circular reference in consolidation hierarchy |
| `RPT_AUDIT_CHAIN_BROKEN` | `AUDIT_CHAIN_INTEGRITY_FAILURE` | 500 | Tamper-evident audit chain integrity check failed |
| `RPT_BALANCE_SHEET_UNBALANCED` | `BALANCE_SHEET_DOES_NOT_BALANCE` | 422 | Generated balance sheet does not satisfy A = L + E |
| `RPT_CASH_FLOW_UNRECONCILED` | `CASH_FLOW_DOES_NOT_RECONCILE` | 422 | Cash flow statement does not reconcile |
| `RPT_CONCURRENT_GENERATION` | `CONCURRENT_GENERATION_CONFLICT` | 409 | Another generation for the same definition is already in progress |
| `RPT_PERMISSION_DENIED` | `REPORT_PERMISSION_DENIED` | 403 | User lacks required permission for this report operation |

---

## Security

### Data Access Controls

All report data access is governed by Supabase Row-Level Security (RLS). The `tenant_id` on every table ensures complete tenant isolation — a user in Venture Alpha cannot query, generate, or view reports belonging to Venture Beta, even through the consolidation engine.

```
┌─────────────────────────────────────────────────────┐
│              SECURITY ENFORCEMENT LAYERS             │
├─────────────────────────────────────────────────────┤
│                                                     │
│  1. AUTHENTICATION (Supabase Auth / JWT)            │
│     └── Identity verified, tenant_id extracted      │
│                                                     │
│  2. ROW-LEVEL SECURITY (PostgreSQL)                 │
│     └── tenant_id = current_setting('...')          │
│     └── All 10+ tables have RLS policies            │
│                                                     │
│  3. REPORT-LEVEL PERMISSIONS                        │
│     └── ReportPermission checks:                    │
│         • view / generate / edit / approve          │
│         • publish / distribute / schedule / export  │
│     └── Entity scope restricts venture access       │
│                                                     │
│  4. FIELD-LEVEL SECURITY                            │
│     └── Sensitive fields (SSN, bank accounts)       │
│         redacted based on user role                 │
│     └── Configurable per report definition          │
│                                                     │
│  5. EXPORT SECURITY                                 │
│     └── Watermarking (see below)                    │
│     └── Time-limited signed download URLs           │
│     └── Content hash verification                   │
│                                                     │
└─────────────────────────────────────────────────────┘
```

### Report-Level Permissions

Permissions are granular and additive. A user must hold the appropriate permission level on a report definition to perform an action:

| Permission | Allows |
|-----------|--------|
| `view` | View generated report versions and exports |
| `generate` | Trigger report generation (manual or via API) |
| `edit_definition` | Modify report definitions (columns, filters, formulas, etc.) |
| `approve` | Approve or reject reports in the approval workflow |
| `publish` | Mark a report version as published (immutable) |
| `distribute` | Trigger distribution to email/Slack/webhook targets |
| `schedule` | Create, edit, or delete report schedules |
| `export` | Download export artifacts (PDF, Excel, etc.) |
| `admin` | All of the above + manage permissions, delete definitions |

Permissions include an **entity scope** — a user with `view` permission on report X might only see data for Venture Alpha, not Venture Beta. The consolidation engine respects this: if a user lacks access to a subsidiary, that subsidiary's data is excluded from their consolidated view (or the request is denied entirely, depending on policy).

### Export Watermarking

All exported reports can be watermarked to deter unauthorized redistribution and provide traceability:

```typescript
interface WatermarkConfig {
  /** Enable watermarking */
  enabled: boolean;

  /** Watermark text (supports template variables) */
  text: string;
  // e.g., "CONFIDENTIAL — {{user.name}} — {{export.generatedAt}}"

  /** Opacity (0.0–1.0, typically 0.05–0.15) */
  opacity: number;

  /** Placement */
  placement: 'diagonal' | 'header' | 'footer' | 'background';

  /** Font size */
  fontSize: number;

  /** Color */
  color: string;

  /** For PDF: applied via Puppeteer CSS overlay */
  /** For Excel: applied as a background image on each sheet */
  /** For CSV/JSON: metadata header comment */
}
```

**PDF watermarks** are rendered as a CSS overlay during Puppeteer generation — they are part of the PDF content, not metadata-only. **Excel watermarks** use sheet background images. Both include the generating user's name, timestamp, and a unique export ID for forensic traceability.

### Audit Trail Integrity

The audit trail uses a **hash chain** (similar to a blockchain) where each entry's `entryHash` is computed as:

```
entryHash = SHA-256(previousHash + tenantId + actorId + action + resourceId + timestamp + dataHash)
```

This makes it impossible to insert, delete, or modify entries without breaking the chain. A background job periodically verifies chain integrity and raises `RPT_AUDIT_CHAIN_BROKEN` alerts if tampering is detected.

The `report_audit_log` table has `UPDATE` and `DELETE` privileges revoked for the application role — it is truly append-only at the database level.

---

## Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `REPORTING_DATABASE_URL` | Yes | — | Supabase PostgreSQL connection string |
| `REPORTING_STORAGE_BUCKET` | Yes | — | S3/R2 bucket name for export storage |
| `REPORTING_STORAGE_ENDPOINT` | No | AWS default | S3-compatible endpoint URL (for R2, MinIO, etc.) |
| `REPORTING_STORAGE_ACCESS_KEY` | Yes | — | S3/R2 access key |
| `REPORTING_STORAGE_SECRET_KEY` | Yes | — | S3/R2 secret key |
| `REPORTING_STORAGE_REGION` | No | `us-east-1` | S3 region |
| `REPORTING_PUPPETEER_ENDPOINT` | No | local | Puppeteer browser WebSocket endpoint (for remote browser) |
| `REPORTING_PUPPETEER_TIMEOUT_MS` | No | `30000` | PDF render timeout in milliseconds |
| `REPORTING_MAX_EXPORT_SIZE_MB` | No | `50` | Maximum export file size in MB |
| `REPORTING_MAX_CONCURRENT_RUNS` | No | `10` | Maximum concurrent report generation jobs |
| `REPORTING_SMTP_HOST` | Cond. | — | SMTP host for email distribution |
| `REPORTING_SMTP_PORT` | Cond. | `587` | SMTP port |
| `REPORTING_SMTP_USER` | Cond. | — | SMTP username |
| `REPORTING_SMTP_PASS` | Cond. | — | SMTP password |
| `REPORTING_SMTP_FROM` | Cond. | — | Default "From" address for email distribution |
| `REPORTING_SLACK_BOT_TOKEN` | Cond. | — | Slack bot token for Slack distribution |
| `REPORTING_WEBHOOK_SIGNING_SECRET` | No | — | HMAC secret for signing webhook payloads |
| `REPORTING_FX_RATE_API_KEY` | Cond. | — | API key for external FX rate provider |
| `REPORTING_FX_RATE_ENDPOINT` | No | ECB | Custom FX rate endpoint URL |
| `REPORTING_AUDIT_CHAIN_VERIFY_INTERVAL_MS` | No | `3600000` | Interval for audit chain integrity checks (ms) |
| `REPORTING_WATERMARK_ENABLED` | No | `true` | Enable watermarking on exports by default |
| `REPORTING_WATERMARK_TEXT` | No | `CONFIDENTIAL` | Default watermark text |
| `REPORTING_APPROVAL_REMINDER_HOURS` | No | `24` | Hours before deadline to send approval reminder |
| `REPORTING_DISTRIBUTION_MAX_RETRIES` | No | `3` | Max retry attempts for failed distributions |
| `REPORTING_DISTRIBUTION_RETRY_DELAY_MS` | No | `300000` | Delay between distribution retries (ms) |
| `REPORTING_LOG_LEVEL` | No | `info` | Logging level (debug, info, warn, error) |

> **Cond.** = Required if using the corresponding feature (email distribution requires SMTP vars, etc.)

---

## Dependencies

### Internal Dependencies

| Module | Purpose |
|--------|---------|
| `@mcv/finance/ledger` | GL balances, account hierarchy, journal entries — primary data source |
| `@mcv/finance/chart-of-accounts` | Account structure, account types, sign conventions |
| `@mcv/finance/budget` | Budget and forecast datasets for comparative analysis |
| `@mcv/finance/fx-rates` | FX rates for consolidation translation |
| `@mcv/finance/fiscal-calendar` | Fiscal year/quarter/month boundaries, holiday calendars |
| `@mcv/finance/accounts-payable` | AP sub-ledger detail for drill-down |
| `@mcv/finance/accounts-receivable` | AR sub-ledger detail for drill-down |
| `@mcv/finance/fixed-assets` | FA sub-ledger, depreciation schedules |
| `@mcv/platform/auth` | Authentication, user identity, JWT validation |
| `@mcv/platform/tenancy` | Tenant context, RLS session variables |
| `@mcv/platform/storage` | S3/R2 abstraction for export file storage |
| `@mcv/platform/notifications` | Email/Slack delivery primitives |
| `@mcv/platform/cron` | Cron scheduler infrastructure for report scheduling |
| `@mcv/platform/audit` | Base audit trail infrastructure, hash chain utilities |

### External Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| `drizzle-orm` | `^0.30` | ORM for PostgreSQL schema and queries |
| `@trpc/server` | `^10.0` | tRPC router definitions |
| `puppeteer` | `^22.0` | Headless Chrome for PDF rendering |
| `exceljs` | `^4.4` | Excel workbook generation with formula preservation |
| `croner` | `^8.0` | Cron expression parsing and scheduling |
| `handlebars` | `^4.7` | Template rendering for branded reports, email bodies |
| `date-fns` | `^3.0` | Date arithmetic for period resolution |
| `date-fns-tz` | `^3.0` | Timezone-aware date operations |
| `decimal.js` | `^10.4` | Precise decimal arithmetic for monetary calculations |
| `zod` | `^3.22` | Runtime validation of report definitions and parameters |
| `csv-stringify` | `^6.0` | CSV export generation |
| `jsonwebtoken` | `^9.0` | JWT signing for webhook payloads and download URLs |
| `node:crypto` | built-in | SHA-256 hashing for audit trail, content hashes |
| `pino` | `^8.0` | Structured logging |

---

## Testing

### Test Strategy

The reporting module uses a four-tier testing approach:

1. **Unit Tests** — Formula engine, period resolver, variance calculator, format utilities
2. **Integration Tests** — Report generation pipeline with test database, export rendering
3. **Snapshot Tests** — Golden-file comparison of generated financial statements
4. **E2E Tests** — Full schedule → generate → approve → distribute flow

### Unit Tests

```typescript
import { describe, it, expect } from 'vitest';
import { FormulaEngine } from '../services/formula-engine';
import { resolvePeriod } from '../utils/resolve-period';
import { calculateVariance } from '../utils/calculate-variance';
import { formatCurrency } from '../utils/format-currency';
import { PeriodType, VarianceDirection } from '../enums';

describe('FormulaEngine', () => {
  const engine = new FormulaEngine();

  it('evaluates simple arithmetic', () => {
    const row = { revenue: 100_000, cogs: 60_000 };
    expect(engine.evaluate('revenue - cogs', row)).toBe(40_000);
  });

  it('evaluates IF expressions', () => {
    const row = { revenue: 100_000, cogs: 60_000 };
    const expr = 'IF(revenue != 0, (revenue - cogs) / revenue * 100, 0)';
    expect(engine.evaluate(expr, row)).toBeCloseTo(40.0);
  });

  it('handles division by zero gracefully', () => {
    const row = { revenue: 0, cogs: 60_000 };
    const expr = 'IF(revenue != 0, cogs / revenue, 0)';
    expect(engine.evaluate(expr, row)).toBe(0);
  });

  it('detects circular dependencies', () => {
    const formulas = [
      { id: 'a', expression: 'b + 1', dependencies: ['b'] },
      { id: 'b', expression: 'a + 1', dependencies: ['a'] },
    ];
    expect(() => engine.validateDependencies(formulas)).toThrow('FORMULA_CIRCULAR_DEPENDENCY');
  });

  it('evaluates nested functions', () => {
    const row = { a: -50, b: 30, c: 10 };
    expect(engine.evaluate('ABS(a) + MAX(b, c)', row)).toBe(80);
  });
});

describe('resolvePeriod', () => {
  it('resolves MTD correctly', () => {
    const period = resolvePeriod(PeriodType.MTD, { asOf: new Date('2025-06-15') });
    expect(period.startDate).toBe('2025-06-01');
    expect(period.endDate).toBe('2025-06-15');
    expect(period.label).toContain('June');
  });

  it('resolves QTD for fiscal calendar', () => {
    const period = resolvePeriod(PeriodType.QTD, {
      asOf: new Date('2025-08-20'),
      fiscalYearStartMonth: 4, // April fiscal year
    });
    expect(period.startDate).toBe('2025-07-01'); // Q2 of April FY starts July
    expect(period.endDate).toBe('2025-08-20');
    expect(period.fiscalQuarter).toBe(2);
  });

  it('resolves FULL_YEAR with comparative', () => {
    const period = resolvePeriod(PeriodType.FULL_YEAR, {
      asOf: new Date('2025-12-31'),
      comparativeOffset: { value: 1, unit: 'years' },
    });
    expect(period.startDate).toBe('2025-01-01');
    expect(period.endDate).toBe('2025-12-31');
    expect(period.comparative?.startDate).toBe('2024-01-01');
    expect(period.comparative?.endDate).toBe('2024-12-31');
  });
});

describe('calculateVariance', () => {
  it('identifies favorable revenue variance', () => {
    const result = calculateVariance(120_000, 100_000, {
      favorableDirection: 'positive',
      thresholds: [{ name: 't', scope: 'all', absoluteThreshold: 10_000,
        percentageThreshold: 5, logic: 'or', severity: 'warning' }],
    });
    expect(result.direction).toBe(VarianceDirection.FAVORABLE);
    expect(result.percentage).toBeCloseTo(20.0);
    expect(result.isMaterial).toBe(true);
  });

  it('identifies unfavorable expense variance', () => {
    const result = calculateVariance(90_000, 80_000, {
      favorableDirection: 'negative',
      thresholds: [{ name: 't', scope: 'all', absoluteThreshold: 5_000,
        percentageThreshold: 5, logic: 'and', severity: 'warning' }],
    });
    expect(result.direction).toBe(VarianceDirection.UNFAVORABLE);
    expect(result.isMaterial).toBe(true); // 12.5% > 5% AND $10K > $5K
  });

  it('handles zero base gracefully', () => {
    const result = calculateVariance(5_000, 0, { favorableDirection: 'positive', thresholds: [] });
    expect(result.percentage).toBe(Infinity);
    expect(result.direction).toBe(VarianceDirection.FAVORABLE);
  });
});

describe('formatCurrency', () => {
  it('formats USD', () => {
    expect(formatCurrency(1234567.89, 'USD')).toBe('$1,234,567.89');
  });

  it('formats EUR', () => {
    expect(formatCurrency(1234567.89, 'EUR')).toBe('€1,234,567.89');
  });

  it('formats negative values in parentheses (accounting)', () => {
    expect(formatCurrency(-5000, 'USD', { accountingNotation: true })).toBe('($5,000.00)');
  });

  it('formats in thousands', () => {
    expect(formatCurrency(1234567, 'USD', { scale: 1000 })).toBe('$1,234.57');
  });
});
```

### Integration Tests

```typescript
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { ReportingService } from '../services/reporting.service';
import { ReportType, AccountingStandard, PeriodType, ExportFormat } from '../enums';
import { setupTestDatabase, teardownTestDatabase, seedFinancialData } from './helpers';
import type { FinancialStatement } from '../interfaces/financial-statement';

describe('ReportGenerationPipeline', () => {
  let reporting: ReportingService;

  beforeAll(async () => {
    await setupTestDatabase();
    await seedFinancialData('test-tenant', 'test-entity', {
      fiscalYear: 2025,
      months: 12,
      accountCount: 50,
      transactionCount: 5000,
    });
    reporting = new ReportingService();
  });

  afterAll(async () => {
    await teardownTestDatabase();
  });

  it('generates a complete income statement', async () => {
    const result = await reporting.generate({
      type: ReportType.INCOME_STATEMENT,
      standard: AccountingStandard.US_GAAP,
      entityIds: ['test-entity'],
      periodConfig: { type: PeriodType.FULL_YEAR, includeComparative: false },
      defaultExportFormats: [],
    });

    expect(result.reportRun.status).toBe('generated');
    const stmt = result.version.snapshotData as FinancialStatement;

    // Must have standard P&L sections
    const sectionKeys = stmt.sections.map(s => s.key);
    expect(sectionKeys).toContain('revenue');
    expect(sectionKeys).toContain('cost_of_goods_sold');
    expect(sectionKeys).toContain('operating_expenses');

    // Net income must be computable
    expect(stmt.totals['net_income']).toBeDefined();
    expect(typeof stmt.totals['net_income'].value).toBe('number');

    // Snapshot hash must be set
    expect(stmt.snapshotHash).toMatch(/^[a-f0-9]{64}$/);
  });

  it('generates a balance sheet that balances', async () => {
    const result = await reporting.generate({
      type: ReportType.BALANCE_SHEET,
      standard: AccountingStandard.US_GAAP,
      entityIds: ['test-entity'],
      periodConfig: { type: PeriodType.FULL_YEAR, includeComparative: false },
      defaultExportFormats: [],
    });

    const stmt = result.version.snapshotData as FinancialStatement;
    const assets = stmt.totals['total_assets']?.value ?? 0;
    const liabEquity = stmt.totals['total_liabilities_equity']?.value ?? 0;
    expect(Math.abs(assets - liabEquity)).toBeLessThan(0.01);
  });

  it('exports to PDF within timeout', async () => {
    const result = await reporting.generate({
      type: ReportType.INCOME_STATEMENT,
      entityIds: ['test-entity'],
      periodConfig: { type: PeriodType.FULL_YEAR, includeComparative: false },
      defaultExportFormats: [ExportFormat.PDF],
    });

    expect(result.exports).toHaveLength(1);
    expect(result.exports[0].format).toBe('pdf');
    expect(result.exports[0].mimeType).toBe('application/pdf');
    expect(result.exports[0].fileSizeBytes).toBeGreaterThan(0);
    expect(result.exports[0].contentHash).toMatch(/^[a-f0-9]{64}$/);
  });

  it('exports to Excel with preserved formulas', async () => {
    const result = await reporting.generate({
      type: ReportType.INCOME_STATEMENT,
      entityIds: ['test-entity'],
      periodConfig: { type: PeriodType.FULL_YEAR, includeComparative: false },
      defaultExportFormats: [ExportFormat.EXCEL],
    });

    expect(result.exports).toHaveLength(1);
    expect(result.exports[0].format).toBe('excel');
    expect(result.exports[0].sheetCount).toBeGreaterThanOrEqual(1);
  });

  it('creates an immutable version with correct hash', async () => {
    const result = await reporting.generate({
      type: ReportType.INCOME_STATEMENT,
      entityIds: ['test-entity'],
      periodConfig: { type: PeriodType.FULL_YEAR, includeComparative: false },
      defaultExportFormats: [],
    });

    // Verify hash integrity
    const { hashReportSnapshot } = await import('../utils/hash-report-snapshot');
    const expectedHash = hashReportSnapshot(result.version.snapshotData);
    expect(result.version.snapshotHash).toBe(expectedHash);
  });

  it('records audit trail entries', async () => {
    const result = await reporting.generate({
      type: ReportType.INCOME_STATEMENT,
      entityIds: ['test-entity'],
      periodConfig: { type: PeriodType.FULL_YEAR, includeComparative: false },
      defaultExportFormats: [ExportFormat.PDF],
    });

    const auditEntries = await reporting.getAuditTrail(result.reportRun.id);
    expect(auditEntries.length).toBeGreaterThanOrEqual(2); // generated + exported

    // Verify chain integrity
    for (let i = 1; i < auditEntries.length; i++) {
      expect(auditEntries[i].previousHash).toBe(auditEntries[i - 1].entryHash);
    }
  });
});
```

### Snapshot Tests

```typescript
import { describe, it, expect } from 'vitest';
import { ReportingService } from '../services/reporting.service';
import { ReportType, PeriodType } from '../enums';

describe('Financial Statement Snapshots', () => {
  it('income statement matches golden file', async () => {
    const reporting = new ReportingService();
    const result = await reporting.generate({
      type: ReportType.INCOME_STATEMENT,
      entityIds: ['snapshot-test-entity'],
      periodConfig: {
        type: PeriodType.CUSTOM,
        customStart: '2025-01-01',
        customEnd: '2025-12-31',
        includeComparative: false,
      },
      defaultExportFormats: [],
    });

    // Snapshot comparison (structure + values)
    expect(result.version.snapshotData).toMatchSnapshot();
  });

  it('consolidation output matches golden file', async () => {
    const reporting = new ReportingService();
    const result = await reporting.generate({
      type: ReportType.CONSOLIDATION,
      entityIds: ['snapshot-parent-entity'],
      consolidationConfigId: 'snapshot-consol-config',
      periodConfig: {
        type: PeriodType.CUSTOM,
        customStart: '2025-01-01',
        customEnd: '2025-12-31',
        includeComparative: false,
      },
      defaultExportFormats: [],
    });

    expect(result.version.snapshotData).toMatchSnapshot();
  });
});
```

### E2E Tests

```typescript
import { describe, it, expect } from 'vitest';
import { ReportingService, ReportScheduler, ReportApprovalWorkflow } from '@mcv/finance/reporting';
import { ReportType, PeriodType, ExportFormat, ApprovalStatus } from '@mcv/finance/reporting';

describe('Full Report Lifecycle (E2E)', () => {
  it('schedule → generate → approve → distribute', async () => {
    const scheduler = new ReportScheduler();
    const reporting = new ReportingService();
    const approval = new ReportApprovalWorkflow();

    // 1. Create schedule
    const schedule = await scheduler.create({
      tenantId: 'e2e-tenant',
      reportDefinitionId: 'e2e-pl-definition',
      name: 'E2E Test Schedule',
      cronExpression: '0 6 1 * *',
      timezone: 'UTC',
      periodType: PeriodType.FULL_MONTH,
      periodOffset: { value: 1, unit: 'months', direction: 'back' },
      exportFormats: [ExportFormat.PDF],
      distributions: [{
        channel: 'email' as any,
        target: 'e2e-test@mcv.one',
        config: {},
        includePreview: false,
        message: 'E2E test',
      }],
      requireApproval: true,
      approverIds: ['e2e-approver-uuid'],
      approvalDeadlineHours: 48,
      skipNonBusinessDays: false,
      maxConsecutiveErrors: 3,
      isActive: true,
      createdBy: 'e2e-user',
      updatedBy: 'e2e-user',
    });
    expect(schedule.id).toBeDefined();

    // 2. Trigger the schedule manually
    const run = await scheduler.triggerNow(schedule.id);
    expect(run.status).toBe('pending_approval');

    // 3. Approve the report
    const approvalResult = await approval.approve({
      reportVersionId: run.reportVersionId!,
      approverId: 'e2e-approver-uuid',
      comment: 'Looks good — approved for distribution.',
    });
    expect(approvalResult.status).toBe(ApprovalStatus.APPROVED);

    // 4. Verify distribution was triggered
    const distributions = await reporting.getDistributions(run.id);
    expect(distributions.length).toBeGreaterThan(0);
    expect(distributions[0].status).toBe('sent');

    // 5. Verify audit trail completeness
    const audit = await reporting.getAuditTrail(run.id);
    const actions = audit.map(e => e.action);
    expect(actions).toContain('report_generated');
    expect(actions).toContain('report_exported');
    expect(actions).toContain('report_approved');
    expect(actions).toContain('report_distributed');
  });
});
```

### Test Utilities

```typescript
// test/helpers.ts

import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from '../schemas';

const TEST_DB_URL = process.env.TEST_DATABASE_URL ?? 'postgresql://localhost:5432/mcv_reporting_test';

let pool: Pool;

export async function setupTestDatabase() {
  pool = new Pool({ connectionString: TEST_DB_URL });
  const db = drizzle(pool, { schema });

  // Run migrations
  await db.execute(sql`SELECT 1`); // Verify connection
  // Migrations applied via drizzle-kit push in CI

  return db;
}

export async function teardownTestDatabase() {
  await pool?.end();
}

export async function seedFinancialData(
  tenantId: string,
  entityId: string,
  options: {
    fiscalYear: number;
    months: number;
    accountCount: number;
    transactionCount: number;
  },
) {
  // Seeds GL balances, journal entries, budget data, etc.
  // for deterministic test scenarios.
  // Uses @mcv/finance/ledger test helpers internally.
}
```

### Running Tests

```bash
# Unit tests (fast, no database)
pnpm test:unit --filter=@mcv/finance/reporting

# Integration tests (requires test database)
pnpm test:integration --filter=@mcv/finance/reporting

# Snapshot tests (update with --update flag)
pnpm test:snapshot --filter=@mcv/finance/reporting
pnpm test:snapshot --filter=@mcv/finance/reporting --update

# E2E tests (requires full service stack)
pnpm test:e2e --filter=@mcv/finance/reporting

# All tests with coverage
pnpm test --filter=@mcv/finance/reporting --coverage

# CI pipeline
pnpm test:ci --filter=@mcv/finance/reporting
```

### Coverage Targets

| Category | Target | Notes |
|----------|--------|-------|
| Statements | ≥ 90% | Core pipeline, formula engine, export renderers |
| Branches | ≥ 85% | Especially consolidation logic, FX translation paths |
| Functions | ≥ 90% | All public API methods |
| Lines | ≥ 90% | Overall |
| E2E Scenarios | 100% | All happy paths + critical error paths |

---

*Module documentation generated for `@mcv/finance/reporting` v0.1.0. For questions, contact the MCV Finance Platform Team.*