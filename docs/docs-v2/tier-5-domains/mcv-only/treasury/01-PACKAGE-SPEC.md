# @mcv/treasury — Package Specification

> **Package:** `@mcv/treasury`
> **Classification:** MCV-ONLY
> **Tier:** 5 — Domain Layer
> **Version:** 1.0.0
> **Last Updated:** February 9, 2026
> **Status:** Specification Complete

---

## Table of Contents

1. [Overview](#overview)
2. [Purpose & Scope](#purpose--scope)
3. [Module Summary](#module-summary)
4. [Architecture Position](#architecture-position)
5. [Key Interfaces & Types](#key-interfaces--types)
6. [Configuration](#configuration)
7. [Dependencies](#dependencies)
8. [Multi-Tenant Design](#multi-tenant-design)
9. [Security](#security)
10. [Performance](#performance)
11. [Deployment](#deployment)

---

## Overview

`@mcv/treasury` is the **consortium-level financial command center** for MCV Global. It operates one architectural layer above venture-level finance (`@mcv/finance`), aggregating, consolidating, and managing financial operations across all nine MCV ventures as a unified enterprise.

This is an **MCV-Only** package — it exists solely because MCV operates a portfolio of ventures that must report, optimize, and comply as a group. No single venture needs consolidated P&L elimination, multi-entity tax provisioning, or cross-venture cash pooling. Treasury provides these consortium-level capabilities.

### Key Characteristics

| Attribute | Value |
|-----------|-------|
| **Package Name** | `@mcv/treasury` |
| **Classification** | MCV-ONLY (Consortium-Level) |
| **Tier** | 5 — Domain Layer |
| **Submodules** | `cash`, `funding`, `pnl`, `tax` |
| **Total Database Tables** | 62 |
| **Cron Jobs** | 12 scheduled operations |
| **Primary Users** | CFO, Treasury Analysts, Board of Directors |
| **AI Integration** | Cash forecasting, variance narratives, anomaly detection |
| **External Integrations** | Plaid, Mercury/SVB, IRS EFTPS, OpenRouter AI |

### What Treasury Manages

- **$2.34M+** in consolidated cash across all ventures and currencies
- **9 ventures** with independent bank accounts, legal entities, and tax obligations
- **50+ tax deadlines** per year across federal, state, and international jurisdictions
- **16+ quarterly estimated tax payments** (federal + per-state-entity)
- **Inter-company transactions** requiring elimination for accurate consolidation
- **Funding rounds** from seed through IPO with full cap table management
- **Board-ready financial packages** with consolidated P&L and KPI dashboards

---

## Purpose & Scope

### Purpose

`@mcv/treasury` answers the questions a CFO asks every morning:

1. **"How much cash do we have across all ventures right now?"** — The cash module aggregates balances from every bank account across all nine ventures, including crypto wallets, into a single consolidated position with multi-currency support.

2. **"What's our consolidated runway?"** — AI-powered forecasting projects cash burn rates and runway across the portfolio, factoring in revenue seasonality, planned expenses, and funding milestones.

3. **"Which ventures are burning fastest?"** — Segment-level P&L reporting breaks down performance by venture, comparing actual results against budget and forecast with material variance flagging.

4. **"Are we compliant on all tax obligations?"** — The tax calendar tracks every filing deadline, estimated payment, and compliance requirement across all entities and jurisdictions.

5. **"What does the board need to see this quarter?"** — Automated board package generation assembles consolidated financials, cash position, KPIs, and executive narrative into presentation-ready documents.

### Scope

#### In Scope

- Multi-venture cash position management and daily snapshots
- AI-powered cash flow forecasting with confidence intervals
- Automated sweep account management and cash pooling
- Wire transfer and ACH batch payment processing
- Foreign exchange position tracking and conversion
- Funding round lifecycle management (seed → IPO)
- Cap table management with dilution modeling
- SAFE and convertible note tracking with conversion mechanics
- Distribution waterfall calculations
- Investor relationship management and portal access
- Consolidated P&L across all ventures with inter-company eliminations
- Segment reporting per venture with industry classification
- Budget vs. actual vs. forecast variance analysis
- Board package and management report generation
- Multi-jurisdiction tax entity registration and compliance
- Estimated tax payment scheduling and safe harbor calculations
- Tax calendar with automated reminders (14-day lookahead)
- Transfer pricing documentation and arm's length validation
- R&D tax credit tracking and computation (IRC §41)
- ASC 740 tax provision calculations with rate reconciliation
- Deferred tax asset/liability management
- SOX-ready audit trail for all financial mutations

#### Out of Scope

- Venture-level accounting, invoicing, and expense management (→ `@mcv/finance`)
- Payment processing and merchant services (→ `@mcv/payments`)
- Bank feed connectivity and third-party API adapters (→ `@mcv/connectors`)
- Crypto wallet management and blockchain operations (→ `@mcv/web3-core`)
- PDF document generation engine (→ `@mcv/documents`)
- Notification delivery infrastructure (→ `@mcv/notifications`)
- User authentication and session management (→ `@mcv/identity`)

---

## Module Summary

### Submodule: `cash`

**Purpose:** Multi-venture cash management — the real-time nervous system for consortium liquidity.

| Aspect | Detail |
|--------|--------|
| **Tables** | 14 (treasury_bank_accounts, cash_positions, cash_movements, cash_forecasts, cash_forecast_lines, sweep_accounts, sweep_transactions, cash_pools, cash_pool_allocations, wire_transfers, ach_batches, ach_transactions, fx_positions, fx_transactions) |
| **Services** | `cashService`, `cashForecastService`, `sweepService`, `cashPoolingService` |
| **Cron Jobs** | 6 (daily snapshots, bank sync, sweep execution, FX rate updates, weekly forecast, cash reconciliation) |
| **Key Features** | Bank account registry, position snapshots, movement tracking, AI forecasting, sweep automation, cash pooling, wire/ACH management, FX tracking, runway projection |

**Core Operations:**
- Register and track bank accounts across all ventures
- Daily position snapshots with burn rate and runway calculation
- Record cash inflows, outflows, inter-company transfers
- Generate AI-powered forecasts with linear, seasonal, and ML-ensemble methods
- Automate sweep transfers between operating and savings accounts
- Manage cash pools with interest allocation across ventures
- Process wire transfers and ACH batches with dual-approval
- Track foreign exchange positions and unrealized gains/losses

### Submodule: `funding`

**Purpose:** Capital raise lifecycle management — from seed funding through Series rounds to potential IPO.

| Aspect | Detail |
|--------|--------|
| **Tables** | 16 (funding_rounds_v2, investors, investor_entities, funding_round_investors, safe_agreements, convertible_notes, cap_table_entries, cap_table_snapshots, share_classes, share_issuances, vesting_schedules, vesting_events, dilution_models, distribution_waterfalls, investor_reports, investor_communications) |
| **Services** | `fundingService`, `capTableService`, `investorService`, `waterfallService` |
| **Cron Jobs** | 2 (monthly interest accrual, monthly vesting processing) |
| **Key Features** | Round management, investor registry, cap table, SAFEs, convertible notes, dilution modeling, waterfall calculations, investor reporting, vesting schedules |

**Core Operations:**
- Create and manage funding rounds with full lifecycle (planning → active → closing → closed)
- Register investors with KYC/AML verification and accreditation status
- Record commitments and track funding receipt with wire references
- Manage SAFE agreements with post-money/pre-money/MFN variants
- Track convertible notes with automatic interest accrual
- Maintain cap table with share classes, ownership percentages, and fully-diluted views
- Generate point-in-time cap table snapshots for historical comparison
- Model dilution scenarios for fundraising planning
- Calculate distribution waterfalls for exit scenarios (acquisition, IPO, dissolution)
- Generate and distribute investor reporting packages
- Manage vesting schedules with cliff, periodic, and milestone-based vesting

### Submodule: `pnl`

**Purpose:** Consolidated profit & loss across all ventures — the single source of truth for MCV Global's financial performance.

| Aspect | Detail |
|--------|--------|
| **Tables** | 14 (consolidated_pnl, consolidated_pnl_lines, venture_segments, segment_results, inter_company_transactions, elimination_rules, elimination_entries, variance_reports, variance_lines, management_reports, board_packages, board_package_items, consolidation_runs, pnl_budgets, pnl_forecasts) |
| **Services** | `pnlService`, `eliminationService`, `varianceService`, `segmentReportingService`, `boardReportService` |
| **Cron Jobs** | 2 (monthly consolidation, monthly variance analysis) |
| **Key Features** | Consolidation engine, IC elimination, segment reporting, variance analysis, budget vs. actual, management reports, board packages |

**Core Operations:**
- Run monthly/quarterly/annual consolidation across all ventures
- Identify and eliminate inter-company transactions (revenue, expenses, payables, receivables)
- Apply currency translation for international entities (ASC 830)
- Generate segment-level financial results with industry classification
- Perform budget vs. actual vs. forecast variance analysis
- Flag material variances with AI-generated narrative explanations
- Build board-ready financial packages with charts, KPIs, and executive summaries
- Support period restatement with full audit trail

### Submodule: `tax`

**Purpose:** Multi-jurisdiction tax compliance — tracking obligations across federal, state, and international jurisdictions for all MCV entities.

| Aspect | Detail |
|--------|--------|
| **Tables** | 18 (tax_entities, tax_jurisdictions, tax_entity_jurisdictions, estimated_tax_payments, tax_calendar_events, transfer_pricing_studies, transfer_pricing_transactions, transfer_pricing_benchmarks, rd_credits, rd_credit_activities, withholding_tax_records, tax_provisions, tax_provision_components, deferred_tax_items, tax_returns, tax_return_workpapers, consolidated_tax_data, tax_audit_trail) |
| **Services** | `taxService`, `taxCalendarService`, `transferPricingService`, `taxCreditService`, `taxProvisionService` |
| **Cron Jobs** | 3 (daily reminders, daily overdue checks, quarterly provision) |
| **Key Features** | Entity registration, jurisdiction management, estimated payments, tax calendar, transfer pricing, R&D credits, ASC 740 provisions, consolidated returns, audit trail |

**Core Operations:**
- Register tax entities with entity type classification (C-corp, S-corp, LLC, partnership)
- Map entities to jurisdictions with nexus type and apportionment percentages
- Schedule and track estimated tax payments with safe harbor calculations
- Maintain a comprehensive tax calendar with automated 14-day reminders
- Create and manage transfer pricing studies with benchmark analysis
- Track R&D qualifying activities for federal and state credit computation
- Generate quarterly ASC 740 tax provisions with effective rate reconciliation
- Manage deferred tax assets/liabilities with valuation allowances
- Track tax return filing lifecycle with workpaper attachments
- Maintain SOX-compliant tax-specific audit trail

---

## Architecture Position

```
┌─────────────────────────────────────────────────────────────────────┐
│                        MCV.ONE ARCHITECTURE                         │
│                                                                     │
│  ┌───────────────────────────────────────────────────────────────┐  │
│  │ TIER 7 — Application Layer                                    │  │
│  │  @mcv/web  @mcv/mobile  @mcv/admin                           │  │
│  └──────────────────────────┬────────────────────────────────────┘  │
│                             │                                       │
│  ┌──────────────────────────▼────────────────────────────────────┐  │
│  │ TIER 6 — Orchestration Layer                                  │  │
│  │  @mcv/agentic-os  @mcv/naos                                  │  │
│  └──────────────────────────┬────────────────────────────────────┘  │
│                             │                                       │
│  ┌──────────────────────────▼────────────────────────────────────┐  │
│  │ TIER 5 — Domain Layer (MCV-ONLY)          ◀══ YOU ARE HERE    │  │
│  │                                                               │  │
│  │  ┌──────────────────────────────────────────────────────┐     │  │
│  │  │            ★ @mcv/treasury ★                         │     │  │
│  │  │                                                      │     │  │
│  │  │  ┌──────────┐ ┌──────────┐ ┌────────┐ ┌──────────┐  │     │  │
│  │  │  │   cash   │ │ funding  │ │  pnl   │ │   tax    │  │     │  │
│  │  │  │ 14 tables│ │ 16 tables│ │14 tables│ │ 18 tables│  │     │  │
│  │  │  └──────────┘ └──────────┘ └────────┘ └──────────┘  │     │  │
│  │  │          62 tables total │ 12 cron jobs              │     │  │
│  │  └──────────────────────────────────────────────────────┘     │  │
│  │                                                               │  │
│  │  @mcv/portfolio  @mcv/betedge  @mcv/serpspace  ...            │  │
│  └──────────────────────────┬────────────────────────────────────┘  │
│                             │                                       │
│  ┌──────────────────────────▼────────────────────────────────────┐  │
│  │ TIER 4 — Domain Layer (Shared)                                │  │
│  │  @mcv/finance  @mcv/commerce  @mcv/social  @mcv/content       │  │
│  └──────────────────────────┬────────────────────────────────────┘  │
│                             │                                       │
│  ┌──────────────────────────▼────────────────────────────────────┐  │
│  │ TIER 3 — Capability Layer                                     │  │
│  │  @mcv/connectors  @mcv/payments  @mcv/notifications           │  │
│  │  @mcv/documents  @mcv/web3-core                               │  │
│  └──────────────────────────┬────────────────────────────────────┘  │
│                             │                                       │
│  ┌──────────────────────────▼────────────────────────────────────┐  │
│  │ TIER 2 — Infrastructure Layer                                 │  │
│  │  @mcv/fabric  @mcv/identity                                   │  │
│  └──────────────────────────┬────────────────────────────────────┘  │
│                             │                                       │
│  ┌──────────────────────────▼────────────────────────────────────┐  │
│  │ TIER 1 — Foundation Layer                                     │  │
│  │  @mcv/kernel (DB, Context, Errors, Auth, RLS, Config)         │  │
│  └───────────────────────────────────────────────────────────────┘  │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### Dependency Flow

```
UPSTREAM (Treasury Depends On)           DOWNSTREAM (Depends On Treasury)
──────────────────────────────           ────────────────────────────────

@mcv/kernel ──────────────┐              ┌──── @mcv/portfolio
  DB, context, errors,    │              │     Uses treasury data for
  auth, RLS policies      │              │     venture financial views
                          │              │
@mcv/identity ────────────┤              ├──── @mcv/agentic-os
  User auth, roles,       │              │     CFO Agent, Tax Agent,
  permissions             │              │     IR Agent consume
                          │  ┌────────┐  │     treasury services
@mcv/fabric ──────────────┤  │        │  │
  Event bus, messaging,   ├──► TREASURY├──┤
  Redpanda integration    │  │        │  │
                          │  └────────┘  │
@mcv/finance ─────────────┤              ├──── @mcv/web (admin dashboard)
  Venture-level P&L data, │              │     Treasury UI components
  invoicing feeds, GL     │              │
                          │              └──── Board of Directors
@mcv/connectors ──────────┤                    Board packages, investor
  Plaid bank feeds,       │                    reports, tax filings
  payment processors      │
                          │
@mcv/web3-core ───────────┤
  Crypto treasury,        │
  Solana wallets, EDGE    │
                          │
@mcv/notifications ───────┤
  Tax alerts, investor    │
  updates, CFO alerts     │
                          │
@mcv/documents ───────────┤
  PDF generation for      │
  board packages, filings │
                          │
@mcv/payments ────────────┘
  Stripe Connect,
  wire/ACH processing
```

---

## Key Interfaces & Types

### Cash Types

```typescript
// ── Core Cash Types ─────────────────────────────────────────────

export type BankAccountType = 'checking' | 'savings' | 'money_market' | 'sweep' | 'crypto_wallet';
export type CashMovementType = 'inflow' | 'outflow' | 'transfer' | 'sweep' | 'fx_conversion';
export type SweepDirection = 'to_target' | 'to_source' | 'bidirectional';
export type WireStatus = 'pending' | 'approved' | 'sent' | 'completed' | 'failed' | 'cancelled';
export type ACHStatus = 'pending' | 'processed' | 'returned' | 'corrected';

export interface ConsolidatedCashPosition {
  totalBalance: string;
  totalBalanceUsd: string;
  ventureBreakdown: VentureCashBreakdown[];
  currencyBreakdown: CurrencyBreakdown[];
  burnRate: string;            // Rolling 30-day average
  runwayDays: number;
  runwayMonths: number;
  asOfDate: Date;
}

export interface VentureCashBreakdown {
  ventureId: string;
  ventureName: string;
  totalBalance: string;
  accountCount: number;
  burnRate: string;
  runwayDays: number;
}

export interface CurrencyBreakdown {
  currency: string;
  balanceLocal: string;
  balanceUsd: string;
  exchangeRate: string;
  accountCount: number;
}

export interface CashForecastResult {
  forecastId: string;
  startDate: Date;
  endDate: Date;
  horizonDays: number;
  method: 'linear' | 'seasonal' | 'ml_ensemble' | 'scenario';
  startingCash: string;
  projectedEndCash: string;
  projectedRunwayDays: number;
  confidenceLevel: number;
  confidenceIntervalLow: string;
  confidenceIntervalHigh: string;
  dailyProjections: DailyProjection[];
}

export interface RunwayProjection {
  currentCash: string;
  monthlyBurn: string;
  runwayMonths: number;
  zeroDate: Date | null;       // Projected date of zero cash
  scenarios: RunwayScenario[];
}

export interface RunwayScenario {
  name: string;                // "base" | "optimistic" | "pessimistic"
  burnMultiplier: number;
  runwayMonths: number;
  zeroDate: Date | null;
}

// ── Cash Service Input Types ────────────────────────────────────

export interface CreateBankAccountInput {
  ventureId: string;
  entityId?: string;
  accountName: string;
  accountType: BankAccountType;
  bankName: string;
  currency?: string;           // Default: 'USD'
  isPrimary?: boolean;
  isReserve?: boolean;
  targetBalance?: string;
  minimumBalance?: string;
  plaidAccountId?: string;
  plaidItemId?: string;
}

export interface RecordCashMovementInput {
  ventureId: string;
  movementType: CashMovementType;
  category: string;
  subcategory?: string;
  description: string;
  amount: string;
  currency?: string;
  fromAccountId?: string;
  toAccountId?: string;
  transactionDate: Date;
  reference?: string;
  isInterCompany?: boolean;
  counterpartyVentureId?: string;
  tags?: string[];
}

export interface CashForecastInput {
  ventureId?: string;          // null = consolidated
  forecastHorizonDays: number; // 30 | 60 | 90 | 180 | 365
  method: 'linear' | 'seasonal' | 'ml_ensemble' | 'scenario';
  assumptions?: {
    revenueGrowth?: number;
    burnRateChange?: number;
    oneTimeItems?: OneTimeItem[];
    excludeCategories?: string[];
  };
}
```

### Funding Types

```typescript
// ── Core Funding Types ──────────────────────────────────────────

export type RoundType = 'pre_seed' | 'seed' | 'series_a' | 'series_b' | 'series_c' | 'bridge' | 'ipo';
export type RoundStatus = 'planning' | 'active' | 'closing' | 'closed' | 'cancelled';
export type InstrumentType = 'equity' | 'safe' | 'convertible_note' | 'warrant';
export type SAFEType = 'post_money' | 'pre_money' | 'mfn' | 'pro_rata';
export type VestingType = 'time_based' | 'milestone' | 'hybrid';

export interface CapTableView {
  ventureId: string;
  asOfDate: Date;
  totalSharesOutstanding: string;
  totalSharesFullyDiluted: string;
  optionPoolShares: string;
  optionPoolPercent: string;
  entries: CapTableEntry[];
  shareClasses: ShareClassSummary[];
}

export interface CapTableEntry {
  id: string;
  holderName: string;
  holderType: 'founder' | 'investor' | 'employee' | 'advisor' | 'option_pool';
  shareClassName: string;
  sharesOwned: string;
  sharesVested: string;
  ownershipPercent: string;
  fullyDilutedPercent: string;
  costBasis: string;
}

export interface DilutionResult {
  modelId: string;
  preRound: OwnershipTable;
  postRound: OwnershipTable;
  totalDilution: string;
  founderDilution: string;
  newSharesIssued: string;
  optionPoolIncrease: string;
  safeConversions: SAFEConversionDetail[];
  noteConversions: NoteConversionDetail[];
}

export interface WaterfallResult {
  exitValuation: string;
  distributableProceeds: string;
  tiers: WaterfallTier[];
  summaryByHolder: Record<string, {
    total: string;
    multiple: string;
    percentOfProceeds: string;
  }>;
}

export interface WaterfallTier {
  tierName: string;
  shareClass: string;
  amount: string;
  recipients: WaterfallRecipient[];
}

// ── Funding Service Input Types ─────────────────────────────────

export interface CreateFundingRoundInput {
  ventureId: string;
  roundName: string;
  roundType: RoundType;
  targetAmount: string;
  minimumAmount?: string;
  preMoneyValuation?: string;
  pricePerShare?: string;
  shareClass?: string;
  leadInvestor?: string;
  antiDilutionProvision?: 'none' | 'full_ratchet' | 'weighted_average_broad' | 'weighted_average_narrow';
  liquidationPreference?: string;
  participatingPreferred?: boolean;
  proRataRights?: boolean;
}

export interface InvestorCommitmentInput {
  investorId: string;
  commitmentAmount: string;
  instrumentType: InstrumentType;
  proRataRights?: boolean;
  boardSeat?: boolean;
  informationRights?: boolean;
  sideLetterUrl?: string;
}

export interface CreateSAFEInput {
  ventureId: string;
  investorId: string;
  roundId?: string;
  safeType: SAFEType;
  investmentAmount: string;
  valuationCap?: string;
  discountRate?: string;
  mfnProvision?: boolean;
  proRataRights?: boolean;
  issuedAt: Date;
}

export interface DilutionModelInput {
  newShares: string;
  pricePerShare: string;
  optionPoolIncrease?: string;
  safeConversions?: { safeId: string; conversionPrice: string }[];
  noteConversions?: { noteId: string; conversionPrice: string; accruedInterest: string }[];
}
```

### P&L Types

```typescript
// ── Core P&L Types ──────────────────────────────────────────────

export type ConsolidationMethod = 'full' | 'proportional' | 'equity';
export type EliminationType = 'revenue' | 'cogs' | 'payable' | 'receivable' | 'loan' | 'equity';
export type VarianceType = 'budget_vs_actual' | 'forecast_vs_actual' | 'period_over_period';
export type ReportFrequency = 'monthly' | 'quarterly' | 'annual';

export interface ConsolidatedPnlResult {
  period: string;
  periodType: string;
  totalRevenue: string;
  totalRevenuePreElimination: string;
  revenueEliminations: string;
  grossProfit: string;
  grossMargin: string;
  totalExpenses: string;
  totalExpensesPreElimination: string;
  expenseEliminations: string;
  operatingIncome: string;
  ebitda: string;
  preTaxIncome: string;
  taxProvision: string;
  netIncome: string;
  netMargin: string;
  ventureCount: number;
  segmentBreakdown: SegmentResult[];
  eliminationSummary: EliminationSummary;
}

export interface SegmentResult {
  segmentId: string;
  segmentName: string;
  ventureId: string;
  revenue: string;
  grossProfit: string;
  operatingIncome: string;
  netIncome: string;
  marginPercent: string;
  revenueGrowthPercent: string;
  headcount: number;
  revenuePerHead: string;
}

export interface BudgetVariance {
  category: string;
  actualAmount: string;
  budgetAmount: string;
  varianceAmount: string;
  variancePercent: string;
  direction: 'favorable' | 'unfavorable' | 'neutral';
  isMaterial: boolean;
  explanation?: string;
}

export interface BoardPackageData {
  title: string;
  period: string;
  meetingDate: Date;
  sections: BoardPackageSection[];
  consolidatedPnl: ConsolidatedPnlResult;
  cashPosition: ConsolidatedCashPosition;
  runwayProjection: RunwayProjection;
  kpiDashboard: KPIDashboard;
}

// ── P&L Service Input Types ─────────────────────────────────────

export interface ConsolidatedPnlInput {
  period: string;              // "2026-01" | "2026-Q1" | "2026"
  periodType: ReportFrequency;
  consolidationMethod: ConsolidationMethod;
  ventureIds?: string[];       // null = all ventures
}

export interface BudgetVsActualInput {
  period: string;
  ventureId?: string;          // null = consolidated
  materialityThreshold?: string;
  generateNarrative?: boolean;
}

export interface BoardPackageInput {
  period: string;
  meetingDate: Date;
  sections?: string[];         // Specific sections to include
  template?: string;           // Template name
}
```

### Tax Types

```typescript
// ── Core Tax Types ──────────────────────────────────────────────

export type TaxEntityType = 'c_corp' | 's_corp' | 'llc' | 'partnership' | 'sole_prop' | 'foreign';
export type TaxType = 'income' | 'franchise' | 'sales' | 'withholding' | 'estimated';
export type FilingStatus = 'active' | 'exempt' | 'suspended';
export type TransferPricingMethod = 'cup' | 'resale_price' | 'cost_plus' | 'tnmm' | 'profit_split';
export type TaxCreditType = 'federal_rd' | 'state_rd' | 'other';

export interface TaxProvisionResult {
  period: string;
  preTaxBookIncome: string;
  permanentDifferences: string;
  temporaryDifferences: string;
  taxableIncome: string;
  currentTaxExpense: string;
  deferredTaxExpense: string;
  totalTaxProvision: string;
  effectiveTaxRate: string;
  statutoryRate: string;
  rateReconciliation: RateReconciliationItem[];
  componentsByJurisdiction: TaxProvisionComponent[];
}

export interface RateReconciliationItem {
  item: string;                // "Statutory rate" | "State tax, net" | "R&D credit" | ...
  rate: string;                // "21.00%" | "4.20%" | "-1.50%"
  amount: string;
}

export interface EffectiveTaxRate {
  period: string;
  effectiveRate: string;
  statutoryRate: string;
  reconciliation: RateReconciliationItem[];
  trendByQuarter: { period: string; rate: string }[];
}

export interface TaxCalendarEvent {
  id: string;
  entityName: string;
  jurisdictionName: string;
  eventName: string;
  eventType: string;
  dueDate: Date;
  status: 'upcoming' | 'in_progress' | 'completed' | 'overdue' | 'extended';
  priority: 'low' | 'medium' | 'high' | 'critical';
  daysUntilDue: number;
  assignedTo?: string;
}

// ── Tax Service Input Types ─────────────────────────────────────

export interface CreateTaxEntityInput {
  ventureId: string;
  entityName: string;
  entityType: TaxEntityType;
  ein?: string;
  incorporationState?: string;
  fiscalYearEnd?: string;
  taxClassification?: string;
  parentEntityId?: string;
}

export interface EstimatedPaymentInput {
  taxEntityId: string;
  jurisdictionId: string;
  taxYear: number;
  quarter: number;
  estimatedAmount: string;
  dueDate: Date;
}

export interface TaxProvisionInput {
  period: string;
  periodType: 'quarterly' | 'annual';
  preTaxBookIncome: string;
  permanentDifferences?: string;
  temporaryDifferences?: string;
}

export interface TransferPricingStudyInput {
  name: string;
  taxYear: number;
  sourceEntityId: string;
  targetEntityId: string;
  transactionType: 'services' | 'licensing' | 'cost_sharing' | 'financing' | 'tangible_goods';
  method: TransferPricingMethod;
  description?: string;
}

export interface RDCreditInput {
  jurisdictionId: string;
  taxYear: number;
  creditType: TaxCreditType;
  method?: 'regular' | 'alternative_simplified';
}
```

---

## Configuration

### Environment Variables

```typescript
// Treasury Configuration
export interface TreasuryConfig {
  // ── General ─────────────────────────────────────────────────
  TREASURY_ENABLED: boolean;               // Enable treasury module
  TREASURY_BASE_CURRENCY: string;          // Default: 'USD'
  TREASURY_VENTURE_COUNT: number;          // Expected number of ventures (9)

  // ── Cash ────────────────────────────────────────────────────
  TREASURY_CASH_SNAPSHOT_CRON: string;     // Default: '59 23 * * *' (daily 23:59 UTC)
  TREASURY_CASH_SYNC_INTERVAL_HOURS: number; // Default: 6
  TREASURY_CASH_SWEEP_CRON: string;        // Default: '0 23 * * *'
  TREASURY_CASH_FX_UPDATE_CRON: string;    // Default: '0 6 * * *'
  TREASURY_CASH_FORECAST_CRON: string;     // Default: '0 8 * * 1' (Monday 08:00)
  TREASURY_MINIMUM_SWEEP_AMOUNT: string;   // Default: '1000'
  TREASURY_BURN_RATE_LOOKBACK_DAYS: number; // Default: 30

  // ── Funding ─────────────────────────────────────────────────
  TREASURY_INTEREST_ACCRUAL_CRON: string;  // Default: '0 0 1 * *' (1st of month)
  TREASURY_VESTING_PROCESS_CRON: string;   // Default: '0 0 1 * *'
  TREASURY_KYC_REQUIRED: boolean;          // Default: true
  TREASURY_DUAL_APPROVAL_THRESHOLD: string; // Default: '25000'

  // ── P&L ─────────────────────────────────────────────────────
  TREASURY_CONSOLIDATION_CRON: string;     // Default: '0 6 5 * *' (5th at 06:00)
  TREASURY_VARIANCE_CRON: string;          // Default: '0 8 5 * *'
  TREASURY_MATERIALITY_THRESHOLD: string;  // Default: '5000'
  TREASURY_CONSOLIDATION_METHOD: ConsolidationMethod; // Default: 'full'

  // ── Tax ─────────────────────────────────────────────────────
  TREASURY_TAX_REMINDER_DAYS: number;      // Default: 14
  TREASURY_TAX_REMINDER_CRON: string;      // Default: '0 8 * * *'
  TREASURY_TAX_OVERDUE_CRON: string;       // Default: '0 9 * * *'
  TREASURY_TAX_PROVISION_CRON: string;     // Default: '0 0 10 4,7,10,1 *'
  TREASURY_FEDERAL_TAX_RATE: string;       // Default: '0.21' (21%)

  // ── AI ──────────────────────────────────────────────────────
  TREASURY_AI_FORECAST_MODEL: string;      // Default: 'openai/gpt-4o'
  TREASURY_AI_NARRATIVE_MODEL: string;     // Default: 'anthropic/claude-3.5-sonnet'
  TREASURY_AI_CONFIDENCE_THRESHOLD: number; // Default: 0.75

  // ── External Integrations ───────────────────────────────────
  PLAID_CLIENT_ID: string;
  PLAID_SECRET: string;
  PLAID_ENVIRONMENT: 'sandbox' | 'development' | 'production';
  MERCURY_API_KEY: string;
  IRS_EFTPS_ENROLLMENT_NUMBER: string;
  FX_RATE_API_KEY: string;

  // ── Encryption ──────────────────────────────────────────────
  TREASURY_ENCRYPTION_KEY: string;         // AES-256-GCM key for sensitive data
  TREASURY_KEY_ROTATION_DAYS: number;      // Default: 90
}
```

### Default Configuration

```typescript
export const TREASURY_DEFAULTS = {
  baseCurrency: 'USD',
  supportedCurrencies: ['USD', 'CAD', 'EUR', 'GBP', 'SOL'],
  burnRateLookbackDays: 30,
  forecastHorizons: [30, 60, 90, 180, 365],
  sweepFrequencies: ['daily', 'weekly', 'monthly'],
  minimumSweepAmount: '1000',
  dualApprovalThreshold: '25000',
  materialityThreshold: '5000',
  taxReminderDays: 14,
  federalTaxRate: '0.21',
  keyRotationDays: 90,
  auditRetentionYears: 7,
  maxConcurrentConsolidations: 1,
  forecastConfidenceThreshold: 0.75,
} as const;
```

---

## Dependencies

### Upstream Dependencies (Treasury Depends On)

| Package | Tier | Purpose | Critical Path |
|---------|------|---------|---------------|
| `@mcv/kernel` | 1 | Database connection, Drizzle ORM, context propagation, error handling, RLS policies, base configuration | **Yes** — all data access |
| `@mcv/identity` | 2 | User authentication, role-based access control, session management, permission checks | **Yes** — all API endpoints |
| `@mcv/fabric` | 2 | Event bus (Redpanda/Kafka), inter-service messaging, event publishing for treasury events | **Yes** — event-driven architecture |
| `@mcv/finance` | 4 | Venture-level P&L data, invoicing feeds, GL account data, expense categorization | **Yes** — consolidation input |
| `@mcv/connectors` | 3 | Plaid bank feed integration, payment processor adapters | **Yes** — bank balance sync |
| `@mcv/payments` | 3 | Stripe Connect, wire/ACH processing infrastructure | Moderate — payment execution |
| `@mcv/web3-core` | 3 | Crypto treasury wallets, Solana integration, EDGE token positions | Moderate — crypto positions |
| `@mcv/notifications` | 3 | Tax deadline alerts, investor updates, CFO notifications, low-balance warnings | Moderate — alert delivery |
| `@mcv/documents` | 3 | PDF generation for board packages, tax filings, investor reports | Moderate — document output |

### Downstream Dependencies (Depend On Treasury)

| Package | Tier | What It Uses |
|---------|------|-------------|
| `@mcv/portfolio` | 5 | Venture financial summaries, cash positions, funding status for portfolio views |
| `@mcv/agentic-os` | 6 | CFO Agent consumes treasury APIs for financial analysis; Tax Agent monitors compliance; IR Agent manages investor communications |
| `@mcv/web` | 7 | Treasury dashboard UI components — cash charts, cap table views, tax calendars, board package builder |
| `@mcv/admin` | 7 | Admin interface for treasury configuration, manual overrides, audit log review |

### External Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| `drizzle-orm` | ^0.35.x | ORM for PostgreSQL schema and queries |
| `drizzle-orm/pg-core` | ^0.35.x | PostgreSQL column types and table builder |
| `date-fns` | ^3.x | Date manipulation for tax calendars, periods, fiscal years |
| `decimal.js` | ^10.x | Precise decimal arithmetic for financial calculations |
| `plaid` | ^20.x | Bank feed integration (balances, transactions) |
| `openrouter-ai` | ^1.x | AI-powered cash forecasting and variance narratives |
| `zod` | ^3.x | Runtime validation for all input schemas |

---

## Multi-Tenant Design

### Venture-Level Isolation

Treasury operates with a unique multi-tenant model: it must simultaneously **isolate** venture data for per-venture views and **aggregate** data across ventures for consolidated views.

```
┌─────────────────────────────────────────────────────────────┐
│                    RLS POLICY STRUCTURE                       │
│                                                              │
│  Per-Venture Views (venture_id = current_venture())          │
│  ┌───────────┐ ┌───────────┐ ┌───────────┐ ┌───────────┐   │
│  │ BetEdge   │ │ SerpSpace │ │ Full Gain │ │ Studios   │   │
│  │ accounts  │ │ accounts  │ │ accounts  │ │ accounts  │   │
│  │ movements │ │ movements │ │ movements │ │ movements │   │
│  │ funding   │ │ funding   │ │ funding   │ │ funding   │   │
│  └───────────┘ └───────────┘ └───────────┘ └───────────┘   │
│                                                              │
│  Consolidated Views (requires treasury:admin role)           │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  All ventures aggregated                              │   │
│  │  consolidated_pnl, consolidated_tax_data,            │   │
│  │  cash_positions (is_consolidated = true)              │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                              │
│  Investor Portal (investor_id = current_investor())          │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Own holdings, reports, communications only           │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

### RLS Policy Implementation

```typescript
// Venture-scoped tables: treasury_bank_accounts, cash_movements, etc.
// Policy: Users see only their venture's data
CREATE POLICY "treasury_venture_isolation" ON treasury_bank_accounts
  USING (venture_id = current_setting('app.current_venture_id')::uuid)
  WITH CHECK (venture_id = current_setting('app.current_venture_id')::uuid);

// Consolidated tables: consolidated_pnl, consolidated_tax_data
// Policy: Only treasury admins can access
CREATE POLICY "treasury_consolidated_access" ON treasury_consolidated_pnl
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = current_setting('app.current_user_id')::uuid
      AND role IN ('treasury:admin', 'super_admin')
    )
  );

// Investor portal tables: investor_reports, investor_communications
// Policy: Investors see only their own data
CREATE POLICY "treasury_investor_isolation" ON treasury_investor_reports
  USING (
    EXISTS (
      SELECT 1 FROM treasury_funding_round_investors fri
      JOIN treasury_investors i ON i.id = fri.investor_id
      WHERE i.portal_user_id = current_setting('app.current_user_id')::uuid
      AND fri.round_id IN (
        SELECT id FROM treasury_funding_rounds_v2
        WHERE venture_id = treasury_investor_reports.venture_id
      )
    )
  );
```

### Cross-Venture Aggregation

For consolidated operations, the service layer bypasses venture-scoped RLS using a privileged service role:

```typescript
export async function runConsolidation(input: ConsolidatedPnlInput): Promise<ConsolidatedPnlResult> {
  // Use service-level connection with treasury:admin role
  return withServiceRole('treasury:admin', async (db) => {
    // Fetch P&L data from ALL ventures
    const venturePnls = await db
      .select()
      .from(financeVenturePnl)
      .where(eq(financeVenturePnl.period, input.period));

    // Identify inter-company transactions
    const icTransactions = await db
      .select()
      .from(interCompanyTransactions)
      .where(eq(interCompanyTransactions.period, input.period));

    // Apply elimination rules
    const eliminations = await eliminationService.matchAndEliminate(input.period);

    // Produce consolidated result
    return buildConsolidatedPnl(venturePnls, eliminations, input);
  });
}
```

---

## Security

### Access Control Matrix

| Operation | `treasury:viewer` | `treasury:admin` | `super_admin` | Investor Portal |
|-----------|:-----------------:|:-----------------:|:-------------:|:---------------:|
| View cash positions | ✅ | ✅ | ✅ | ❌ |
| Record cash movements | ❌ | ✅ | ✅ | ❌ |
| Initiate wire transfers | ❌ | ✅ (dual approval) | ✅ | ❌ |
| View funding rounds | ✅ | ✅ | ✅ | Own ventures |
| Close funding rounds | ❌ | ✅ (dual approval) | ✅ | ❌ |
| View cap table | ✅ | ✅ | ✅ | Own holdings |
| Run consolidation | ❌ | ✅ | ✅ | ❌ |
| View consolidated P&L | ✅ | ✅ | ✅ | ❌ |
| Modify elimination rules | ❌ | ✅ | ✅ | ❌ |
| File tax returns | ❌ | ✅ (dual approval) | ✅ | ❌ |
| View tax provisions | ✅ | ✅ | ✅ | ❌ |
| Transfer pricing studies | ❌ | ✅ | ✅ | ❌ |
| Investor reports | ❌ | ✅ | ✅ | Own reports |

### Dual Approval Requirements

The following operations require approval from a second authorized user:

- Wire transfers exceeding `$25,000`
- Estimated tax payments
- Funding round closings
- Tax return filings
- Board package distribution
- Period restatements

```typescript
export interface DualApprovalRequest {
  operationType: string;
  requestedBy: string;
  requestedAt: Date;
  approvedBy?: string;
  approvedAt?: Date;
  status: 'pending' | 'approved' | 'rejected';
  metadata: Record<string, unknown>;
}
```

### Data Encryption

| Data Type | Encryption Method | Storage |
|-----------|-------------------|---------|
| Federal EIN | AES-256-GCM | `tax_entities.ein` |
| State Tax IDs | AES-256-GCM | `tax_entities.state_id` |
| Bank Routing Numbers | AES-256-GCM | `treasury_bank_accounts.bank_routing_number` |
| Investor Tax IDs | AES-256-GCM | `investors.tax_id` |
| Investor Bank Details | AES-256-GCM | `investors.bank_details` |
| ACH Routing Numbers | AES-256-GCM | `ach_transactions.recipient_routing_number` |
| SWIFT Codes | AES-256-GCM | `wire_transfers.beneficiary_swift_code` |

### Audit Trail

Every financial mutation generates an audit log entry:

```typescript
export interface TreasuryAuditEntry {
  id: string;
  action: string;              // "payment_submitted" | "return_filed" | "round_closed"
  actorId: string;
  resourceType: string;        // "wire_transfer" | "tax_return" | "funding_round"
  resourceId: string;
  previousValue: Record<string, unknown>;
  newValue: Record<string, unknown>;
  ipAddress: string;
  userAgent: string;
  timestamp: Date;
}
```

### Compliance Standards

| Standard | Coverage |
|----------|----------|
| **SOX** | Complete audit trail for all financial mutations; dual-approval for material transactions; separation of duties |
| **SOC 2 Type II** | Access logs retained 7 years; automated quarterly access reviews; encryption at rest and in transit |
| **IRS Compliance** | EFTPS confirmation tracking; e-file confirmation storage; estimated payment safe harbor calculations |
| **OECD Transfer Pricing** | Studies and benchmarks stored per OECD guidelines; 7-year retention; arm's length documentation |
| **ASC 740** | Quarterly tax provisions; effective rate reconciliation; deferred tax asset/liability tracking |
| **ASC 830** | Currency translation for international entities using period-end and average rates |

---

## Performance

### Performance Targets

| Operation | Target Latency | Throughput |
|-----------|---------------|------------|
| Get consolidated cash position | < 200ms | 100 req/s |
| Record cash movement | < 100ms | 500 req/s |
| Daily position snapshot (all accounts) | < 30s | 1/day |
| Run monthly consolidation | < 60s | 1/month |
| Generate cash forecast (90-day) | < 10s | 10 req/hour |
| Cap table calculation | < 500ms | 50 req/s |
| Dilution model scenario | < 2s | 20 req/min |
| Waterfall calculation | < 1s | 20 req/min |
| Tax provision calculation | < 5s | 10 req/hour |
| Board package PDF generation | < 30s | 5 req/hour |
| Variance analysis report | < 5s | 10 req/hour |
| Bank balance sync (all accounts) | < 60s | 4/day |

### Caching Strategy

```typescript
// Redis caching for frequently-accessed treasury data
const CACHE_CONFIG = {
  'treasury:consolidated_position': { ttl: 300 },     // 5 min
  'treasury:venture_position:{ventureId}': { ttl: 300 },
  'treasury:cap_table:{ventureId}': { ttl: 600 },     // 10 min
  'treasury:latest_forecast:{ventureId}': { ttl: 3600 }, // 1 hour
  'treasury:tax_calendar:upcoming': { ttl: 3600 },
  'treasury:fx_rates': { ttl: 3600 },
  'treasury:consolidation:{period}': { ttl: 86400 },  // 24 hours (immutable after close)
};
```

### Database Indexes

```sql
-- Cash module indexes
CREATE INDEX idx_cash_positions_venture_date ON treasury_cash_positions(venture_id, snapshot_date DESC);
CREATE INDEX idx_cash_movements_venture_date ON treasury_cash_movements(venture_id, transaction_date DESC);
CREATE INDEX idx_cash_movements_category ON treasury_cash_movements(category, transaction_date);
CREATE INDEX idx_bank_accounts_venture ON treasury_bank_accounts(venture_id, status);

-- Funding module indexes
CREATE INDEX idx_funding_rounds_venture ON treasury_funding_rounds_v2(venture_id, status);
CREATE INDEX idx_cap_table_venture ON treasury_cap_table_entries(venture_id, is_active);
CREATE INDEX idx_investors_type ON treasury_investors(type, kyc_status);

-- P&L module indexes
CREATE INDEX idx_consolidated_pnl_period ON treasury_consolidated_pnl(period, period_type);
CREATE INDEX idx_ic_transactions_period ON treasury_inter_company_transactions(period, status);
CREATE INDEX idx_elimination_entries_period ON treasury_elimination_entries(period);

-- Tax module indexes
CREATE INDEX idx_tax_calendar_due ON treasury_tax_calendar_events(due_date, status);
CREATE INDEX idx_estimated_payments_entity ON treasury_estimated_tax_payments(tax_entity_id, tax_year);
CREATE INDEX idx_tax_returns_year ON treasury_tax_returns(tax_year, status);
```

---

## Deployment

### Turborepo Integration

```json
{
  "name": "@mcv/treasury",
  "version": "1.0.0",
  "private": true,
  "main": "./src/index.ts",
  "types": "./src/index.ts",
  "scripts": {
    "build": "tsup src/index.ts --format esm,cjs --dts",
    "dev": "tsup src/index.ts --format esm,cjs --dts --watch",
    "lint": "eslint src/",
    "test": "vitest run",
    "test:watch": "vitest",
    "db:generate": "drizzle-kit generate",
    "db:migrate": "drizzle-kit migrate",
    "db:push": "drizzle-kit push",
    "db:seed": "tsx src/seed.ts"
  },
  "dependencies": {
    "@mcv/kernel": "workspace:*",
    "@mcv/identity": "workspace:*",
    "@mcv/fabric": "workspace:*",
    "@mcv/finance": "workspace:*",
    "drizzle-orm": "^0.35.0",
    "date-fns": "^3.0.0",
    "decimal.js": "^10.4.0",
    "zod": "^3.22.0"
  },
  "devDependencies": {
    "@mcv/tsconfig": "workspace:*",
    "vitest": "^2.0.0",
    "tsup": "^8.0.0",
    "drizzle-kit": "^0.22.0"
  }
}
```

### Module Structure

```
packages/treasury/
├── src/
│   ├── index.ts                    # Public exports
│   ├── constants.ts                # MCV ventures, currencies, rates, etc.
│   ├── types.ts                    # Shared type definitions
│   │
│   ├── cash/
│   │   ├── schema.ts               # Drizzle schema (14 tables)
│   │   ├── service.ts              # CashService, CashForecastService, SweepService, CashPoolingService
│   │   ├── validators.ts           # Zod input schemas
│   │   └── __tests__/
│   │
│   ├── funding/
│   │   ├── schema.ts               # Drizzle schema (16 tables)
│   │   ├── service.ts              # FundingService, CapTableService, InvestorService, WaterfallService
│   │   ├── validators.ts           # Zod input schemas
│   │   └── __tests__/
│   │
│   ├── pnl/
│   │   ├── schema.ts               # Drizzle schema (14 tables)
│   │   ├── service.ts              # PnlService, EliminationService, VarianceService, etc.
│   │   ├── validators.ts           # Zod input schemas
│   │   └── __tests__/
│   │
│   ├── tax/
│   │   ├── schema.ts               # Drizzle schema (18 tables)
│   │   ├── service.ts              # TaxService, TaxCalendarService, TransferPricingService, etc.
│   │   ├── validators.ts           # Zod input schemas
│   │   └── __tests__/
│   │
│   ├── client/
│   │   ├── hooks/                   # React hooks (useCashPositions, useCapTable, etc.)
│   │   └── components/              # UI components (CashDashboard, CapTableView, etc.)
│   │
│   └── seed.ts                      # Development seed data
│
├── drizzle/
│   └── migrations/                  # SQL migrations
│
├── package.json
├── tsconfig.json
├── drizzle.config.ts
└── vitest.config.ts
```

### Migration Strategy

```sql
-- Migration: 001_treasury_initial
-- Creates all 62 tables with RLS policies, indexes, and audit triggers

BEGIN;

-- Enums
CREATE TYPE bank_account_type AS ENUM ('checking', 'savings', 'money_market', 'sweep', 'crypto_wallet');
CREATE TYPE cash_movement_type AS ENUM ('inflow', 'outflow', 'transfer', 'sweep', 'fx_conversion');
CREATE TYPE sweep_direction AS ENUM ('to_target', 'to_source', 'bidirectional');
CREATE TYPE wire_status AS ENUM ('pending', 'approved', 'sent', 'completed', 'failed', 'cancelled');
CREATE TYPE round_type AS ENUM ('pre_seed', 'seed', 'series_a', 'series_b', 'series_c', 'bridge', 'ipo');
CREATE TYPE instrument_type AS ENUM ('equity', 'safe', 'convertible_note', 'warrant');
CREATE TYPE safe_type AS ENUM ('post_money', 'pre_money', 'mfn', 'pro_rata');
CREATE TYPE vesting_type AS ENUM ('time_based', 'milestone', 'hybrid');
CREATE TYPE consolidation_method AS ENUM ('full', 'proportional', 'equity');
CREATE TYPE elimination_type AS ENUM ('revenue', 'cogs', 'payable', 'receivable', 'loan', 'equity');
CREATE TYPE variance_type AS ENUM ('budget_vs_actual', 'forecast_vs_actual', 'period_over_period');
CREATE TYPE report_frequency AS ENUM ('monthly', 'quarterly', 'annual');
CREATE TYPE tax_entity_type AS ENUM ('c_corp', 's_corp', 'llc', 'partnership', 'sole_prop', 'foreign');
CREATE TYPE filing_status AS ENUM ('active', 'exempt', 'suspended');
CREATE TYPE transfer_pricing_method AS ENUM ('cup', 'resale_price', 'cost_plus', 'tnmm', 'profit_split');
CREATE TYPE tax_credit_type AS ENUM ('federal_rd', 'state_rd', 'other');

-- Tables created in dependency order (62 total)
-- RLS enabled on all tables
-- Audit triggers on all financial mutation tables
-- Indexes on all foreign keys and common query patterns

COMMIT;
```

### Cron Job Deployment

All 12 treasury cron jobs are registered through `@mcv/fabric`'s cron scheduler:

| Job ID | Schedule (UTC) | Handler |
|--------|---------------|---------|
| `treasury:cash:snapshot-positions` | `59 23 * * *` | `cashService.snapshotDailyPositions()` |
| `treasury:cash:sync-bank-feeds` | `0 */6 * * *` | `cashService.syncAllBalances()` |
| `treasury:cash:execute-sweeps` | `0 23 * * *` | `sweepService.executeAllDueSweeps()` |
| `treasury:cash:update-fx-rates` | `0 6 * * *` | `fxService.updateAllRates()` |
| `treasury:cash:generate-forecast` | `0 8 * * 1` | `cashForecastService.generateForecast()` |
| `treasury:funding:accrue-interest` | `0 0 1 * *` | `fundingService.accrueAllInterest()` |
| `treasury:funding:process-vesting` | `0 0 1 * *` | `capTableService.processAllDueVesting()` |
| `treasury:pnl:monthly-consolidation` | `0 6 5 * *` | `pnlService.runConsolidation()` |
| `treasury:pnl:variance-analysis` | `0 8 5 * *` | `varianceService.runBudgetVsActual()` |
| `treasury:tax:send-reminders` | `0 8 * * *` | `taxCalendarService.sendReminders()` |
| `treasury:tax:check-overdue` | `0 9 * * *` | `taxService.getOverduePayments()` |
| `treasury:tax:quarterly-provision` | `0 0 10 4,7,10,1 *` | `taxProvisionService.generateProvision()` |

### Health Checks

```typescript
export async function treasuryHealthCheck(): Promise<HealthCheckResult> {
  const checks = {
    database: await checkDatabaseConnection(),
    plaidConnection: await checkPlaidStatus(),
    lastCashSnapshot: await checkLastSnapshotAge(),
    overduePayments: await checkOverduePaymentCount(),
    pendingConsolidation: await checkPendingConsolidation(),
    cacheStatus: await checkRedisConnection(),
  };

  return {
    status: Object.values(checks).every(c => c.healthy) ? 'healthy' : 'degraded',
    checks,
    timestamp: new Date(),
  };
}
```

---

*@mcv/treasury — Treasury Management Domain*
