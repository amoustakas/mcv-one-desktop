# @mcv/treasury — Implementation Plan

> **Package:** `@mcv/treasury`
> **Classification:** MCV-ONLY
> **Tier:** 5 — Domain Layer
> **Version:** 1.0.0
> **Last Updated:** February 9, 2026

---

## Table of Contents

1. [Overview](#overview)
2. [Prerequisites](#prerequisites)
3. [Phase 1 — Foundation](#phase-1--foundation)
4. [Phase 2 — Core Implementation](#phase-2--core-implementation)
5. [Phase 3 — Advanced Features](#phase-3--advanced-features)
6. [Phase 4 — Polish & Hardening](#phase-4--polish--hardening)
7. [Testing Strategy](#testing-strategy)
8. [Acceptance Criteria](#acceptance-criteria)
9. [Risks & Mitigations](#risks--mitigations)
10. [Timeline](#timeline)

---

## Overview

This plan outlines the phased implementation of `@mcv/treasury`, the consortium-level financial command center for MCV Global. The package manages cash flow, funding rounds, consolidated P&L, and tax compliance across all 9 MCV ventures.

### Implementation Summary

| Phase | Duration | Focus | Tables | Key Deliverables |
|-------|----------|-------|--------|------------------|
| **Phase 1** | 3 weeks | Foundation | 10 | Package scaffolding, base schemas, core types, RLS policies |
| **Phase 2** | 6 weeks | Core Modules | 42 | Cash management, funding lifecycle, P&L consolidation, tax basics |
| **Phase 3** | 4 weeks | Advanced | 10 | AI forecasting, automated reconciliation, cross-venture dashboard |
| **Phase 4** | 2 weeks | Polish | — | Testing, documentation, performance tuning, security audit |
| **Total** | **15 weeks** | | **62 tables** | Full treasury management system |

### Success Metrics

- **Cash position accuracy:** Real-time consolidated position within 5 minutes of bank sync
- **Consolidation speed:** Monthly P&L consolidation across 9 ventures in < 60 seconds
- **Tax compliance:** Zero missed deadlines with 14-day advance reminders
- **Forecast accuracy:** AI cash forecasts within 15% of actuals (90-day horizon)
- **Uptime:** 99.9% availability for read operations, 99.5% for write operations
- **Audit readiness:** Complete SOX-grade audit trail for all financial mutations

---

## Prerequisites

### Required Before Phase 1

| Prerequisite | Package | Status | Notes |
|-------------|---------|--------|-------|
| Database infrastructure | `@mcv/kernel` | ✅ Required | PostgreSQL via Supabase, Drizzle ORM, RLS engine |
| Authentication & roles | `@mcv/identity` | ✅ Required | User auth, role system (`treasury:admin`, `treasury:viewer`) |
| Event bus | `@mcv/fabric` | ✅ Required | Redpanda/Kafka for treasury event publishing |
| Venture registry | `@mcv/portfolio` | ✅ Required | All 9 ventures registered with IDs and metadata |
| Venture-level finance | `@mcv/finance` | ✅ Required | Per-venture P&L data, GL accounts, invoicing feeds |
| Redis cache | Infrastructure | ✅ Required | Upstash Redis for position caching and rate limiting |

### Required Before Phase 2

| Prerequisite | Package | Status | Notes |
|-------------|---------|--------|-------|
| Bank feed connectors | `@mcv/connectors` | 🔶 Phase 2 | Plaid integration for bank balance sync |
| Payment processing | `@mcv/payments` | 🔶 Phase 2 | Wire/ACH execution via Stripe Connect |
| Notification delivery | `@mcv/notifications` | 🔶 Phase 2 | Tax alerts, low-balance warnings, investor updates |
| PDF generation | `@mcv/documents` | 🔶 Phase 2 | Board packages, investor reports, tax filings |

### Required Before Phase 3

| Prerequisite | Package | Status | Notes |
|-------------|---------|--------|-------|
| Crypto treasury | `@mcv/web3-core` | 🔶 Phase 3 | Solana wallet balances, EDGE token positions |
| AI infrastructure | OpenRouter | 🔶 Phase 3 | GPT-4o for forecasting, Claude for narratives |
| Agent framework | `@mcv/agentic-os` | 🔶 Phase 3 | CFO Agent, Tax Agent, IR Agent integration |

### Developer Environment

```bash
# Required tools
node >= 24.x
pnpm >= 9.x
PostgreSQL 15+ (via Supabase)
Redis (via Upstash)

# Initial setup
cd packages/treasury
pnpm install
pnpm db:generate    # Generate Drizzle migrations
pnpm db:migrate     # Apply migrations
pnpm db:seed        # Load development data
pnpm test           # Run test suite
```

---

## Phase 1 — Foundation

**Duration:** 3 weeks
**Goal:** Package scaffolding, base schemas, core types, and development infrastructure.

### Week 1: Package Structure & Core Types

#### 1.1 Package Scaffolding

Create the package structure within the Turborepo monorepo:

```
packages/treasury/
├── src/
│   ├── index.ts                    # Public API exports
│   ├── constants.ts                # MCV ventures, currencies, rates
│   ├── types.ts                    # Shared type definitions
│   ├── errors.ts                   # TreasuryError class and error codes
│   ├── cash/
│   │   ├── schema.ts
│   │   ├── service.ts
│   │   └── validators.ts
│   ├── funding/
│   │   ├── schema.ts
│   │   ├── service.ts
│   │   └── validators.ts
│   ├── pnl/
│   │   ├── schema.ts
│   │   ├── service.ts
│   │   └── validators.ts
│   ├── tax/
│   │   ├── schema.ts
│   │   ├── service.ts
│   │   └── validators.ts
│   └── client/
│       ├── hooks/
│       └── components/
├── drizzle/
│   └── migrations/
├── package.json
├── tsconfig.json
├── drizzle.config.ts
└── vitest.config.ts
```

**Tasks:**
- [ ] Initialize package with `package.json`, `tsconfig.json`, `vitest.config.ts`
- [ ] Configure Drizzle ORM with `drizzle.config.ts` pointing to Supabase
- [ ] Create `constants.ts` with MCV_VENTURES, SUPPORTED_CURRENCIES, tax rates
- [ ] Create `errors.ts` with TreasuryError class and all 21 error codes
- [ ] Create `types.ts` with shared type definitions (BankAccountType, CashMovementType, etc.)
- [ ] Set up `index.ts` barrel export file
- [ ] Configure build pipeline (`tsup` for ESM/CJS output)

#### 1.2 Core Type System

Define all TypeScript interfaces and Zod schemas:

```typescript
// types.ts — Core type definitions
export type BankAccountType = 'checking' | 'savings' | 'money_market' | 'sweep' | 'crypto_wallet';
export type CashMovementType = 'inflow' | 'outflow' | 'transfer' | 'sweep' | 'fx_conversion';
export type RoundType = 'pre_seed' | 'seed' | 'series_a' | 'series_b' | 'series_c' | 'bridge' | 'ipo';
export type ConsolidationMethod = 'full' | 'proportional' | 'equity';
export type TaxEntityType = 'c_corp' | 's_corp' | 'llc' | 'partnership' | 'sole_prop' | 'foreign';
// ... all types from spec
```

**Tasks:**
- [ ] Define all Cash types (15 interfaces)
- [ ] Define all Funding types (18 interfaces)
- [ ] Define all P&L types (16 interfaces)
- [ ] Define all Tax types (20 interfaces)
- [ ] Create Zod validation schemas for all input types
- [ ] Ensure decimal fields use `string` type (not `number`) for precision

### Week 2: Database Schema & Migrations

#### 2.1 Enum Definitions

Create all PostgreSQL enum types:

```typescript
// All 16 enums defined in a shared enums file
export const bankAccountTypeEnum = pgEnum('bank_account_type', [...]);
export const cashMovementTypeEnum = pgEnum('cash_movement_type', [...]);
// ... 14 more enums
```

**Tasks:**
- [ ] Define all 16 PostgreSQL enum types
- [ ] Generate initial migration for enum creation
- [ ] Test migration in development database

#### 2.2 Cash Module Schema (14 tables)

```typescript
// Priority tables for Phase 1 foundation:
export const treasuryBankAccounts = pgTable('treasury_bank_accounts', { ... });
export const cashPositions = pgTable('treasury_cash_positions', { ... });
export const cashMovements = pgTable('treasury_cash_movements', { ... });
```

**Tasks:**
- [ ] Create `cash/schema.ts` with all 14 table definitions
- [ ] Add all foreign key references
- [ ] Add database indexes for common query patterns
- [ ] Generate and test migration

#### 2.3 Funding Module Schema (16 tables)

**Tasks:**
- [ ] Create `funding/schema.ts` with all 16 table definitions
- [ ] Ensure SAFE, convertible note, and cap table relationships
- [ ] Generate and test migration

#### 2.4 P&L Module Schema (14 tables)

**Tasks:**
- [ ] Create `pnl/schema.ts` with all 14 table definitions
- [ ] Include consolidation run tracking tables
- [ ] Generate and test migration

#### 2.5 Tax Module Schema (18 tables)

**Tasks:**
- [ ] Create `tax/schema.ts` with all 18 table definitions
- [ ] Include audit trail table with trigger setup
- [ ] Generate and test migration

### Week 3: RLS Policies, Audit Triggers & Seed Data

#### 3.1 Row-Level Security

Implement the three-tier RLS model:

```sql
-- Tier 1: Venture isolation (most tables)
-- Tier 2: Consolidated access (treasury:admin only)
-- Tier 3: Investor portal isolation
```

**Tasks:**
- [ ] Write RLS policies for all 62 tables
- [ ] Implement venture-scoped policies for per-venture tables
- [ ] Implement admin-only policies for consolidated tables
- [ ] Implement investor-portal policies for investor-facing tables
- [ ] Create service-role bypass function for consolidation operations
- [ ] Test RLS policies with multiple user roles

#### 3.2 Audit Triggers

```sql
-- Financial audit trigger for SOX compliance
CREATE OR REPLACE FUNCTION treasury_audit_trigger() RETURNS TRIGGER AS $$ ... $$;
```

**Tasks:**
- [ ] Create audit trigger function
- [ ] Apply audit triggers to all financial mutation tables
- [ ] Verify trigger fires correctly on INSERT, UPDATE, DELETE
- [ ] Test audit trail records contain actor, IP, before/after values

#### 3.3 Development Seed Data

**Tasks:**
- [ ] Create `seed.ts` with realistic development data
- [ ] Seed 9 ventures with bank accounts and sample balances
- [ ] Seed sample funding rounds (BetEdge Series A, SerpSpace Seed)
- [ ] Seed sample inter-company transactions
- [ ] Seed tax entities and jurisdictions
- [ ] Seed sample investors with KYC status

**Phase 1 Deliverables:**
- ✅ Package scaffolded and building in Turborepo
- ✅ All 62 tables created with migrations
- ✅ All 16 enum types defined
- ✅ RLS policies on all tables
- ✅ Audit triggers on financial tables
- ✅ Core types and Zod schemas complete
- ✅ Development seed data loading

---

## Phase 2 — Core Implementation

**Duration:** 6 weeks
**Goal:** Implement all four submodule services with full CRUD operations.

### Weeks 4-5: Cash Management

#### 4.1 CashService Implementation

**Tasks:**
- [ ] `registerBankAccount()` — Create bank account with validation
- [ ] `updateBankAccount()` — Update account details
- [ ] `closeBankAccount()` — Soft-close with status change
- [ ] `listBankAccounts()` — Filtered listing per venture
- [ ] `syncBankBalance()` — Single account Plaid sync
- [ ] `syncAllBalances()` — Batch sync all accounts (cron handler)
- [ ] `getConsolidatedPosition()` — Aggregate across all ventures with Redis cache
- [ ] `getVenturePosition()` — Single venture position
- [ ] `getPositionHistory()` — Time-series position data
- [ ] `snapshotDailyPositions()` — EOD snapshot cron handler
- [ ] `recordMovement()` — Record inflow/outflow with balance update
- [ ] `recordInterCompanyTransfer()` — Mirror entries on both sides
- [ ] `getMovements()` — Paginated movement query
- [ ] `getMovementsByCategory()` — Category breakdown
- [ ] `calculateBurnRate()` — Rolling 30-day average
- [ ] `calculateRunway()` — Cash ÷ burn rate with scenarios

**Integration:**
- [ ] Connect to `@mcv/connectors` Plaid client for bank sync
- [ ] Wire up Redis caching for consolidated position (5-min TTL)
- [ ] Publish `treasury.cash.*` events to Redpanda
- [ ] Send `treasury.cash.balance.low` alerts via `@mcv/notifications`

#### 4.2 SweepService Implementation

**Tasks:**
- [ ] `createSweepRule()` — Configure automated sweep
- [ ] `updateSweepRule()` — Modify sweep parameters
- [ ] `deactivateSweep()` — Disable sweep rule
- [ ] `executeSweep()` — Execute single sweep transfer
- [ ] `executeAllDueSweeps()` — Nightly cron handler
- [ ] `getSweepHistory()` — Sweep transaction history

#### 4.3 CashPoolingService Implementation

**Tasks:**
- [ ] `createPool()` — Create cash pooling structure
- [ ] `addParticipant()` — Add venture to pool
- [ ] `removeParticipant()` — Remove venture from pool
- [ ] `calculateInterest()` — Pro-rata interest allocation
- [ ] `getPoolBalance()` — Current pool state

#### 4.4 Wire/ACH & FX

**Tasks:**
- [ ] Wire transfer request and approval flow
- [ ] ACH batch creation and processing
- [ ] FX position tracking with daily rate updates
- [ ] FX conversion transaction recording

**Cron Jobs (Cash):**
- [ ] `treasury:cash:snapshot-positions` — Daily 23:59 UTC
- [ ] `treasury:cash:sync-bank-feeds` — Every 6 hours
- [ ] `treasury:cash:execute-sweeps` — Daily 23:00 UTC
- [ ] `treasury:cash:update-fx-rates` — Daily 06:00 UTC

### Weeks 6-7: Funding & Capital

#### 6.1 FundingService Implementation

**Tasks:**
- [ ] `createRound()` — New funding round with terms
- [ ] `updateRound()` — Modify round parameters
- [ ] `openRound()` — Change status to active
- [ ] `closeRound()` — Close with cap table updates (dual approval)
- [ ] `cancelRound()` — Cancel with reason
- [ ] `recordCommitment()` — Investor commitment (KYC check)
- [ ] `recordFunding()` — Wire received confirmation
- [ ] `createSAFE()` — SAFE agreement creation
- [ ] `convertSAFE()` — SAFE-to-equity conversion engine
- [ ] `calculateSAFEConversion()` — Preview conversion math
- [ ] `createConvertibleNote()` — Note creation
- [ ] `accrueInterest()` — Monthly interest accrual (cron)
- [ ] `convertNote()` — Note-to-equity conversion
- [ ] `repayNote()` — Note repayment

#### 6.2 CapTableService Implementation

**Tasks:**
- [ ] `getCapTable()` — Current cap table with ownership %
- [ ] `getFullyDilutedCapTable()` — Include options, SAFEs, notes
- [ ] `snapshotCapTable()` — Point-in-time snapshot
- [ ] `compareSnapshots()` — Diff two snapshots
- [ ] `createShareClass()` — Define share class terms
- [ ] `issueShares()` — Share issuance with cap table update
- [ ] `transferShares()` — Share transfer between holders
- [ ] `modelDilution()` — Dilution scenario modeling
- [ ] `compareDilutionScenarios()` — Side-by-side comparison
- [ ] `createVestingSchedule()` — Vesting configuration
- [ ] `processVestingEvent()` — Process single vest
- [ ] `processAllDueVesting()` — Monthly cron handler
- [ ] `accelerateVesting()` — Trigger acceleration

#### 6.3 InvestorService Implementation

**Tasks:**
- [ ] `registerInvestor()` — Investor registration
- [ ] `updateInvestor()` — Update details
- [ ] `verifyAccreditation()` — Accreditation check
- [ ] `runKYC()` — KYC verification flow
- [ ] `generateReport()` — Investor reporting package
- [ ] `sendReport()` — Distribute to investors
- [ ] `logCommunication()` — Communication tracking

#### 6.4 WaterfallService Implementation

**Tasks:**
- [ ] `calculateWaterfall()` — Distribution waterfall engine
- [ ] `compareExitScenarios()` — Multi-valuation comparison

**Cron Jobs (Funding):**
- [ ] `treasury:funding:accrue-interest` — Monthly 1st
- [ ] `treasury:funding:process-vesting` — Monthly 1st

### Weeks 8-9: P&L Consolidation & Tax

#### 8.1 PnlService Implementation

**Tasks:**
- [ ] `runConsolidation()` — Full monthly consolidation engine
- [ ] `getConsolidatedPnl()` — Retrieve stored consolidation
- [ ] `getConsolidatedPnlLines()` — Line item detail
- [ ] `getPnlHistory()` — Multi-period history
- [ ] `restatePnl()` — Period restatement (dual approval)
- [ ] `getConsolidationRuns()` — Execution history

**Consolidation engine internals:**
- [ ] Venture P&L data aggregation (pull from `@mcv/finance`)
- [ ] Inter-company transaction identification
- [ ] Elimination rule matching and application
- [ ] Currency translation (ASC 830: period-end for balance, average for income)
- [ ] Consolidated figure calculation
- [ ] Segment result computation

#### 8.2 EliminationService Implementation

**Tasks:**
- [ ] `createRule()` — Elimination rule definition
- [ ] `matchAndEliminate()` — Auto-match and eliminate IC transactions
- [ ] `getUnmatchedTransactions()` — Flag unmatched for review
- [ ] `recordInterCompanyTransaction()` — Manual IC recording
- [ ] `reconcileInterCompany()` — IC reconciliation

#### 8.3 VarianceService Implementation

**Tasks:**
- [ ] `runBudgetVsActual()` — BvA analysis with materiality flags
- [ ] `runForecastVsActual()` — FvA analysis
- [ ] `runPeriodOverPeriod()` — Period comparison
- [ ] `getMaterialVariances()` — Material items only
- [ ] Budget and forecast data management

#### 8.4 SegmentReportingService & BoardReportService

**Tasks:**
- [ ] Segment definition and result tracking
- [ ] Board package builder with section assembly
- [ ] PDF generation integration with `@mcv/documents`
- [ ] Management report creation and distribution

#### 8.5 TaxService Implementation

**Tasks:**
- [ ] `registerEntity()` — Tax entity registration
- [ ] `registerJurisdiction()` — Entity-jurisdiction mapping
- [ ] `scheduleEstimatedPayment()` — Payment scheduling
- [ ] `recordPayment()` — Payment confirmation (dual approval)
- [ ] `calculateSafeHarborAmount()` — Safe harbor computation
- [ ] `createTaxReturn()` — Return tracking
- [ ] `fileReturn()` — Filing confirmation (dual approval)

#### 8.6 TaxCalendarService Implementation

**Tasks:**
- [ ] `generateAnnualCalendar()` — Auto-generate all deadlines
- [ ] `getUpcoming()` — Upcoming deadline query
- [ ] `getOverdue()` — Overdue items
- [ ] `sendReminders()` — Daily reminder cron
- [ ] `completeEvent()` — Mark event completed

#### 8.7 TransferPricingService & TaxCreditService

**Tasks:**
- [ ] Transfer pricing study management
- [ ] Benchmark analysis and arm's length range
- [ ] Compliance validation
- [ ] R&D credit activity tracking
- [ ] Credit calculation (regular and alternative simplified)

#### 8.8 TaxProvisionService Implementation

**Tasks:**
- [ ] `generateProvision()` — ASC 740 provision calculation
- [ ] `calculateEffectiveTaxRate()` — ETR with reconciliation
- [ ] `generateRateReconciliation()` — Statutory to effective
- [ ] `addDeferredItem()` — DTA/DTL tracking
- [ ] `approveProvision()` — Lock provision

**Cron Jobs (P&L + Tax):**
- [ ] `treasury:pnl:monthly-consolidation` — Monthly 5th, 06:00
- [ ] `treasury:pnl:variance-analysis` — Monthly 5th, 08:00
- [ ] `treasury:tax:send-reminders` — Daily 08:00
- [ ] `treasury:tax:check-overdue` — Daily 09:00
- [ ] `treasury:tax:quarterly-provision` — Quarterly 10th

**Phase 2 Deliverables:**
- ✅ All 4 submodule services fully implemented
- ✅ 14 service classes with complete CRUD operations
- ✅ 12 cron jobs registered and tested
- ✅ Inter-company elimination engine working
- ✅ SAFE and convertible note conversion mechanics
- ✅ Cap table dilution modeling
- ✅ Tax calendar with automated reminders
- ✅ ASC 740 provision calculations

---

## Phase 3 — Advanced Features

**Duration:** 4 weeks
**Goal:** AI-powered features, automated reconciliation, and cross-venture dashboard.

### Weeks 10-11: AI Forecasting & Automated Reconciliation

#### 10.1 AI-Powered Cash Forecasting

Integrate OpenRouter AI for intelligent cash flow predictions:

```typescript
// CashForecastService.mlEnsembleForecast()
// Uses historical patterns, seasonality, and business context
// to project cash flows with confidence intervals.
```

**Tasks:**
- [ ] Implement `CashForecastService.generateForecast()` with all 4 methods
- [ ] Linear projection from rolling averages
- [ ] Seasonal decomposition using historical patterns
- [ ] ML ensemble forecast via OpenRouter GPT-4o
- [ ] Scenario analysis with user-defined assumptions
- [ ] Confidence interval calculation with back-testing
- [ ] `backTestForecast()` — Historical accuracy measurement
- [ ] `getForecastVsActual()` — Forecast comparison view
- [ ] Weekly auto-forecast cron job

#### 10.2 AI Variance Narratives

```typescript
// VarianceService.generateNarrative()
// Uses Claude 3.5 Sonnet to write CFO-quality
// variance explanation narratives.
```

**Tasks:**
- [ ] Integrate OpenRouter Claude for narrative generation
- [ ] Prompt engineering for CFO-quality output
- [ ] Material variance automatic explanation
- [ ] Narrative review/edit workflow
- [ ] Auto-generate narratives during monthly consolidation

#### 10.3 Automated Bank Reconciliation

**Tasks:**
- [ ] Plaid transaction sync (beyond just balances)
- [ ] Auto-categorize transactions using AI classification
- [ ] Match bank transactions to recorded cash movements
- [ ] Flag unmatched transactions for manual review
- [ ] Reconciliation report generation
- [ ] Exception handling for partial matches

#### 10.4 Anomaly Detection

**Tasks:**
- [ ] Detect unusual cash movements (statistical outliers)
- [ ] Flag duplicate payments across ventures
- [ ] Identify categorization inconsistencies
- [ ] Alert on burn rate spikes
- [ ] Pattern matching for fraud indicators

### Weeks 12-13: Cross-Venture Dashboard & Agent Integration

#### 12.1 Treasury Dashboard Components

Build React components for the treasury management interface:

**Tasks:**
- [ ] `CashDashboard` — Consolidated position with venture breakdown
- [ ] `CashPositionChart` — Time-series balance visualization
- [ ] `CashForecastView` — Forecast vs actual overlay chart
- [ ] `RunwayProjection` — Runway meter with scenarios
- [ ] `BankAccountGrid` — All accounts with sync status
- [ ] `FundingDashboard` — Active rounds, cap tables, investor list
- [ ] `CapTableView` — Interactive cap table with dilution toggle
- [ ] `DilutionChart` — Before/after ownership visualization
- [ ] `WaterfallChart` — Distribution waterfall by exit valuation
- [ ] `ConsolidatedPnlView` — P&L with elimination detail
- [ ] `VarianceHeatmap` — Visual variance by category/venture
- [ ] `BudgetVsActualChart` — BvA bar chart with materiality
- [ ] `TaxCalendarView` — Calendar with deadline indicators
- [ ] `TaxProvisionWorksheet` — Provision with rate reconciliation
- [ ] `BoardPackageBuilder` — Drag-and-drop package assembly

#### 12.2 React Hooks

**Tasks:**
- [ ] `useCashPositions()` — Real-time position with WebSocket updates
- [ ] `useCashForecast()` — Forecast data with confidence intervals
- [ ] `useFundingRounds()` — Active rounds with status indicators
- [ ] `useCapTable()` — Cap table with dilution toggle
- [ ] `useConsolidatedPnl()` — P&L with segment drill-down
- [ ] `useVarianceAnalysis()` — Variance with materiality filters
- [ ] `useTaxCalendar()` — Calendar with upcoming/overdue counts
- [ ] `useTaxProvision()` — Provision with ETR trend

#### 12.3 NAOS Agent Integration

Connect treasury services to the agent framework:

**Tasks:**
- [ ] **CFO Agent Tools:**
  - `get_cash_position` — Consolidated or per-venture position
  - `get_runway` — Runway projection with scenarios
  - `get_pnl` — Consolidated P&L for a period
  - `get_burn_rate` — Current burn rate analysis
  - `compare_ventures` — Side-by-side financial comparison
  - `generate_board_brief` — Quick financial summary

- [ ] **Tax Agent Tools:**
  - `get_upcoming_deadlines` — Tax calendar query
  - `get_overdue_items` — Overdue payments/filings
  - `check_compliance` — Transfer pricing compliance
  - `estimate_tax` — Quick tax estimation

- [ ] **IR Agent Tools:**
  - `get_investor_portfolio` — Investor holdings across ventures
  - `generate_investor_update` — Draft investor communication
  - `get_cap_table` — Current ownership view

#### 12.4 Crypto Treasury Integration

**Tasks:**
- [ ] Connect to `@mcv/web3-core` for Solana wallet positions
- [ ] Track EDGE token positions (utility token, not investment)
- [ ] Include crypto in consolidated cash position
- [ ] Daily SOL price feed for USD conversion
- [ ] Crypto-specific movement categorization

**Phase 3 Deliverables:**
- ✅ AI cash forecasting with 4 methods and confidence intervals
- ✅ AI variance narratives for board-quality explanations
- ✅ Automated bank reconciliation with AI categorization
- ✅ Anomaly detection for unusual financial activity
- ✅ 15+ React dashboard components
- ✅ 8 React hooks for real-time data
- ✅ CFO Agent, Tax Agent, IR Agent tool definitions
- ✅ Crypto treasury position integration

---

## Phase 4 — Polish & Hardening

**Duration:** 2 weeks
**Goal:** Comprehensive testing, performance tuning, security audit, and documentation.

### Week 14: Testing & Performance

#### 14.1 Test Suite Completion

**Tasks:**
- [ ] Unit tests for all service methods (target: 90% coverage)
- [ ] Integration tests for database operations
- [ ] End-to-end tests for critical paths:
  - Cash position → snapshot → forecast → dashboard
  - Funding round → commitment → SAFE conversion → cap table
  - Venture P&L → consolidation → elimination → board package
  - Tax entity → calendar → payment → provision
- [ ] Edge case testing:
  - Zero-balance accounts
  - Multi-currency consolidation
  - Concurrent consolidation attempts
  - Overdue payment cascades
  - SAFE conversion with conflicting terms

#### 14.2 Performance Optimization

**Tasks:**
- [ ] Database query optimization with EXPLAIN ANALYZE
- [ ] Add missing indexes identified by slow query log
- [ ] Implement materialized views for consolidated position
- [ ] Configure Redis cache TTLs based on usage patterns
- [ ] Load test with simulated 9-venture data volume
- [ ] Profile consolidation engine for < 60s target
- [ ] Optimize forecast generation for < 10s target

#### 14.3 Benchmark Results

Target benchmarks to validate:

```
┌──────────────────────────────────┬───────────┬──────────┐
│ Operation                        │ Target    │ Actual   │
├──────────────────────────────────┼───────────┼──────────┤
│ Get consolidated position        │ < 200ms   │ TBD      │
│ Record cash movement             │ < 100ms   │ TBD      │
│ Daily position snapshot          │ < 30s     │ TBD      │
│ Monthly consolidation            │ < 60s     │ TBD      │
│ Cash forecast (90-day, AI)       │ < 10s     │ TBD      │
│ Cap table calculation            │ < 500ms   │ TBD      │
│ Dilution model scenario          │ < 2s      │ TBD      │
│ Waterfall calculation            │ < 1s      │ TBD      │
│ Tax provision calculation        │ < 5s      │ TBD      │
│ Board package PDF generation     │ < 30s     │ TBD      │
│ Bank balance sync (all accounts) │ < 60s     │ TBD      │
└──────────────────────────────────┴───────────┴──────────┘
```

### Week 15: Security Audit & Documentation

#### 15.1 Security Audit

**Tasks:**
- [ ] Verify RLS policies block cross-venture data access
- [ ] Test investor portal isolation (can't see other investors)
- [ ] Verify AES-256-GCM encryption for all sensitive fields
- [ ] Test dual-approval workflow for all high-value operations
- [ ] Audit trail completeness check (every mutation logged)
- [ ] Verify key rotation mechanism works correctly
- [ ] Test TLS 1.3 enforcement on all API endpoints
- [ ] Review HMAC-SHA256 signing for webhook deliveries
- [ ] Penetration test: attempt to bypass RLS via SQL injection
- [ ] Verify service-role elevation only works for authorized operations

#### 15.2 Compliance Checklist

```
SOX Compliance:
  [ ] Complete audit trail for all financial mutations
  [ ] Dual approval for material transactions
  [ ] Separation of duties enforced
  [ ] Period close prevents unauthorized modifications

SOC 2 Type II:
  [ ] Access logs retained for 7 years
  [ ] Quarterly access review automation
  [ ] Encryption at rest and in transit
  [ ] Incident response procedures documented

IRS Compliance:
  [ ] EFTPS confirmation tracking verified
  [ ] E-file confirmation storage working
  [ ] Safe harbor calculations accurate

OECD Transfer Pricing:
  [ ] Studies stored per OECD guidelines
  [ ] 7-year retention policy enforced
  [ ] Arm's length documentation complete
```

#### 15.3 Documentation Finalization

**Tasks:**
- [ ] Review and finalize 01-PACKAGE-SPEC.md
- [ ] Review and finalize 02-TECHNICAL-ARCHITECTURE.md
- [ ] Review and finalize 03-API-REFERENCE.md
- [ ] Review and finalize 04-IMPLEMENTATION-PLAN.md
- [ ] Generate JSDoc for all public APIs
- [ ] Create CHANGELOG.md with version history
- [ ] Write migration guide for @mcv/finance integration
- [ ] Create runbook for common treasury operations

**Phase 4 Deliverables:**
- ✅ 90%+ test coverage across all services
- ✅ All performance benchmarks met
- ✅ Security audit passed with no critical findings
- ✅ SOX/SOC 2/IRS compliance checklist complete
- ✅ Documentation finalized and reviewed
- ✅ Package ready for production deployment

---

## Testing Strategy

### Test Categories

| Category | Count | Framework | Focus |
|----------|-------|-----------|-------|
| Unit | ~200 | Vitest | Service method logic, calculations, validators |
| Integration | ~80 | Vitest + Supabase | Database operations, RLS, transactions |
| E2E | ~30 | Vitest | Full workflow paths, cron jobs |
| Performance | ~15 | Custom benchmarks | Latency, throughput, resource usage |
| Security | ~20 | Custom | RLS bypass, encryption, access control |

### Key Test Scenarios

```typescript
// ── Cash Tests ──────────────────────────────────────────────────

describe('Cash Position Aggregation', () => {
  it('calculates consolidated position across all ventures');
  it('handles multi-currency positions with FX conversion');
  it('caches position in Redis with 5-minute TTL');
  it('invalidates cache on new movement');
  it('handles inter-company transfers as zero-net on consolidated');
});

describe('Burn Rate & Runway', () => {
  it('calculates 30-day rolling average excluding IC transfers');
  it('handles ventures with zero outflows');
  it('projects runway with base/optimistic/pessimistic scenarios');
  it('alerts when runway drops below 6 months');
});

// ── Funding Tests ───────────────────────────────────────────────

describe('SAFE Conversion', () => {
  it('applies valuation cap when cap price < round price');
  it('applies discount when discount price < cap price');
  it('handles post-money SAFE correctly');
  it('handles MFN SAFE by inheriting best prior terms');
  it('converts multiple SAFEs in FIFO order');
  it('blocks conversion of already-converted SAFE');
});

describe('Cap Table', () => {
  it('calculates ownership percentages correctly');
  it('includes fully diluted view with options + SAFEs + notes');
  it('snapshots cap table at round close');
  it('models dilution scenario with round parameters');
});

// ── P&L Tests ───────────────────────────────────────────────────

describe('Consolidation Engine', () => {
  it('aggregates P&L from all 9 ventures');
  it('identifies and eliminates inter-company revenue');
  it('identifies and eliminates inter-company expenses');
  it('net income is correct after eliminations');
  it('prevents concurrent consolidation runs');
  it('rolls back on failure');
});

describe('Variance Analysis', () => {
  it('calculates favorable variance for revenue over budget');
  it('calculates unfavorable variance for expense over budget');
  it('flags material variances exceeding threshold');
  it('generates AI narrative for material items');
});

// ── Tax Tests ───────────────────────────────────────────────────

describe('Tax Calendar', () => {
  it('generates all deadlines for a tax year');
  it('sends reminder 14 days before deadline');
  it('flags overdue events correctly');
  it('handles weekend/holiday adjustment');
});

describe('Tax Provision (ASC 740)', () => {
  it('calculates current tax by jurisdiction');
  it('calculates deferred tax from temporary differences');
  it('applies R&D credits to reduce current tax');
  it('produces effective rate reconciliation');
  it('locks approved provisions from further changes');
});
```

### Test Data Strategy

```typescript
// Test fixtures with realistic MCV data
export const TEST_FIXTURES = {
  ventures: [
    { id: 'test-betedge', name: 'BetEdge', industry: 'Sports AI' },
    { id: 'test-serpspace', name: 'SerpSpace', industry: 'SEO / SaaS' },
    // ... all 9
  ],
  bankAccounts: [
    { ventureId: 'test-betedge', name: 'Chase Checking', balance: '125000' },
    { ventureId: 'test-betedge', name: 'Chase Savings', balance: '500000' },
    // ...
  ],
  investors: [
    { name: 'Sequoia Capital', type: 'institutional', accredited: true },
    { name: 'Angel Investor', type: 'angel', accredited: true },
  ],
};
```

---

## Acceptance Criteria

### Phase 1 — Foundation ✅

- [ ] All 62 tables created and accessible via Drizzle ORM
- [ ] RLS policies prevent cross-venture data access
- [ ] Audit triggers fire on all financial mutations
- [ ] Package builds successfully in Turborepo pipeline
- [ ] Development seed data loads without errors
- [ ] All types compile without TypeScript errors

### Phase 2 — Core Implementation ✅

- [ ] CFO can view consolidated cash position across all ventures
- [ ] Cash movements tracked with inter-company identification
- [ ] Funding round lifecycle works end-to-end (create → commit → close)
- [ ] SAFE converts correctly using lower of cap/discount price
- [ ] Cap table reflects accurate ownership after round close
- [ ] Monthly consolidation produces correct net income after eliminations
- [ ] Variance analysis identifies and explains material differences
- [ ] Tax calendar generates all deadlines with 14-day reminders
- [ ] Estimated payments schedule and track correctly
- [ ] ASC 740 provision produces effective tax rate reconciliation
- [ ] All 12 cron jobs execute on schedule without errors

### Phase 3 — Advanced Features ✅

- [ ] AI forecast accuracy within 15% of actuals (90-day horizon)
- [ ] Variance narratives are CFO-quality (reviewed and approved)
- [ ] Bank reconciliation auto-matches > 85% of transactions
- [ ] Dashboard renders all components under 3 seconds
- [ ] NAOS agents can call all treasury tools successfully
- [ ] Crypto positions included in consolidated view

### Phase 4 — Polish ✅

- [ ] Test coverage ≥ 90% across all service classes
- [ ] All performance benchmarks met (see table above)
- [ ] Security audit passed — no critical or high findings
- [ ] SOX compliance checklist complete
- [ ] All documentation reviewed and accurate
- [ ] Zero known P0 or P1 bugs

---

## Risks & Mitigations

### Technical Risks

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| **Plaid API rate limits** during bank sync | Cash positions stale | Medium | Implement exponential backoff; cache last-known balances; sync in batches |
| **Consolidation timeout** for large data volumes | Monthly close delayed | Low | Optimize queries; implement incremental consolidation; increase timeout |
| **FX rate API outage** | Multi-currency positions inaccurate | Medium | Cache rates with 24h fallback; use multiple rate providers |
| **OpenRouter AI latency** for forecasts | Slow forecast generation | Medium | Queue forecast requests; pre-compute linear forecasts; timeout with fallback |
| **Concurrent consolidation** corruption | Invalid financial data | Low | Database-level locking; consolidation-in-progress check; transaction rollback |
| **SAFE conversion edge cases** | Incorrect share calculations | Medium | Extensive test coverage; decimal.js for precision; manual review for first conversions |

### Business Risks

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| **Tax deadline missed** | Penalties and interest | High impact, Low prob | 14-day reminders; daily overdue checks; CFO escalation; backup manual calendar |
| **Incorrect tax provision** | Audit findings | Medium | Dual review process; CPA validation; quarterly accuracy check |
| **Investor data breach** | Legal liability, trust loss | High impact, Low prob | AES-256-GCM encryption; investor portal isolation; quarterly pen test |
| **Inter-company elimination errors** | Misstated financials | Medium | Automated matching; manual review for unmatched; reconciliation reports |
| **Board package errors** | Credibility damage | Medium | Dual approval before distribution; automated data validation; version history |

### Dependency Risks

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| **@mcv/finance delayed** | Can't pull venture P&L | Medium | Implement mock data layer; use CSV import as fallback |
| **@mcv/connectors Plaid not ready** | No bank sync | Medium | Support manual balance entry; CSV bank statement import |
| **@mcv/documents PDF gen delayed** | No board packages | Low | Generate HTML-based packages; PDF conversion later |
| **Supabase performance** at scale | Slow queries | Low | Monitor query times; add read replicas if needed; optimize indexes |

---

## Timeline

```
Week 1  ▓▓▓▓ Phase 1: Package scaffolding, core types
Week 2  ▓▓▓▓ Phase 1: Database schemas, migrations (62 tables)
Week 3  ▓▓▓▓ Phase 1: RLS policies, audit triggers, seed data
        ────────────────────────────────────────────────────
Week 4  ████ Phase 2: CashService — bank accounts, positions
Week 5  ████ Phase 2: CashService — movements, sweep, pooling, FX
Week 6  ████ Phase 2: FundingService — rounds, SAFEs, notes
Week 7  ████ Phase 2: CapTableService — cap table, dilution, vesting
Week 8  ████ Phase 2: PnlService — consolidation, eliminations
Week 9  ████ Phase 2: TaxService — entities, calendar, provisions
        ────────────────────────────────────────────────────
Week 10 ░░░░ Phase 3: AI forecasting, variance narratives
Week 11 ░░░░ Phase 3: Automated reconciliation, anomaly detection
Week 12 ░░░░ Phase 3: Dashboard components, React hooks
Week 13 ░░░░ Phase 3: NAOS agent integration, crypto treasury
        ────────────────────────────────────────────────────
Week 14 ▒▒▒▒ Phase 4: Testing, performance optimization
Week 15 ▒▒▒▒ Phase 4: Security audit, documentation, release

Legend: ▓ Foundation  █ Core  ░ Advanced  ▒ Polish
```

### Key Milestones

| Milestone | Target Date | Phase | Deliverable |
|-----------|-------------|-------|-------------|
| Schema Complete | Week 3 | 1 | All 62 tables with RLS |
| Cash Management Live | Week 5 | 2 | Position tracking, movements, sweeps |
| Funding Module Live | Week 7 | 2 | Rounds, SAFEs, cap tables |
| First Consolidation | Week 8 | 2 | Monthly P&L across 9 ventures |
| Tax Calendar Live | Week 9 | 2 | Automated reminders, estimated payments |
| AI Forecasting Live | Week 11 | 3 | ML ensemble forecasts with confidence |
| Dashboard Complete | Week 13 | 3 | Full treasury management UI |
| Production Release | Week 15 | 4 | All tests passing, security audit complete |

### Team Requirements

| Role | Allocation | Phase | Focus |
|------|-----------|-------|-------|
| Senior Backend Engineer | Full-time (15 weeks) | All | Core service implementation |
| Database Engineer | Half-time (6 weeks) | 1-2 | Schema design, RLS, optimization |
| Frontend Engineer | Full-time (6 weeks) | 3-4 | Dashboard components, hooks |
| DevOps | Quarter-time (4 weeks) | 2, 4 | Cron jobs, monitoring, deployment |
| Security Reviewer | Quarter-time (2 weeks) | 4 | Audit, compliance verification |
| CPA / Tax Advisor | As-needed (2 weeks) | 2-3 | Tax logic validation, ASC 740 review |

---

*@mcv/treasury — Treasury Management Domain*
