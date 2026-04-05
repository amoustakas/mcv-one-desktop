# @mcv/treasury/cash — Cash Nerve Center
## Multi-Venture Cash Management, Liquidity & Forecasting Engine

**Module:** `@mcv/treasury/cash`  
**Parent:** `@mcv/treasury`  
**Classification:** INTERNAL (MCV-Only)  
**Status:** CANONICAL SPECIFICATION  
**Quality Level:** SURGICAL (1000+ lines)

---

## 1. Purpose

The Cash module is the real-time financial nervous system of MCV Global. It provides a unified, multi-venture view of every dollar (and every foreign currency unit) across all bank accounts, crypto wallets, and cash-equivalent instruments held by the consortium's nine ventures.

This module answers the questions a CFO asks every morning:

- **"How much cash do we have right now?"** — Consolidated position across all ventures, currencies, and account types.
- **"What's our runway?"** — Days/months of operating capital remaining at current burn rate, per venture and consolidated.
- **"Which ventures are burning fastest?"** — Comparative burn rate analysis with trend detection.
- **"Do we need to move cash between entities?"** — Sweep account automation and inter-company transfer tracking.
- **"What does our 90-day forecast look like?"** — AI-powered cash flow forecasting with confidence intervals.
- **"What's our FX exposure?"** — Multi-currency position tracking with unrealized gain/loss calculations.

### Why This Exists at the Consortium Level

Individual ventures track their own revenue and expenses via `@mcv/finance`. But the *treasury* view is different — it's about **liquidity management across the entire consortium**. When BetEdge needs $200K for a marketing push but has $50K in its operating account while SerpSpace is sitting on $500K in savings, the treasury module orchestrates that capital flow. When Futurestate earns revenue in CAD but needs to pay US vendors, the FX engine handles the conversion tracking. When the board asks "what's our total runway?", the cash module produces a consolidated answer that accounts for all nine ventures.

---

## 2. Exports

```typescript
// @mcv/treasury/cash — Public API Surface

// ── Services ──────────────────────────────────────────────────────
export { CashService } from './services/cash.service';
export { CashForecastService } from './services/cash-forecast.service';
export { SweepService } from './services/sweep.service';
export { CashPoolingService } from './services/cash-pooling.service';
export { FXService } from './services/fx.service';
export { WireACHService } from './services/wire-ach.service';

// ── Schemas (Drizzle ORM) ─────────────────────────────────────────
export {
  treasuryBankAccounts,
  cashPositions,
  cashMovements,
  cashForecasts,
  cashForecastLines,
  sweepAccounts,
  sweepTransactions,
  cashPools,
  cashPoolAllocations,
  wireTransfers,
  achBatches,
  achTransactions,
  fxPositions,
  fxTransactions,
} from './schemas';

// ── Types ─────────────────────────────────────────────────────────
export type {
  BankAccountType,
  CreateBankAccountInput,
  TreasuryBankAccount,
  BankSyncResult,
  CashPositionSnapshot,
  ConsolidatedCashPosition,
  VentureCashPosition,
  CurrencyBreakdown,
  CashMovementType,
  RecordCashMovementInput,
  CashMovement,
  InterCompanyTransferInput,
  InterCompanyTransferResult,
  CashMovementFilters,
  CategoryBreakdown,
  BurnRateResult,
  RunwayResult,
  RunwayProjection,
  LiquidityRatio,
  CashForecastInput,
  CashForecastResult,
  ForecastComparison,
  BackTestResult,
  ForecastMethod,
  SweepDirection,
  SweepRule,
  SweepRuleInput,
  SweepTransaction,
  CashPoolStructure,
  CashPoolInput,
  CashPoolContributionInput,
  CashPoolBalance,
  InterestAllocation,
  WireStatus,
  WireTransferInput,
  WireTransfer,
  ACHStatus,
  ACHBatchInput,
  ACHBatch,
  ACHTransaction,
  FXRate,
  FXPosition,
  FXConversionInput,
  FXTransaction,
  FXExposureSummary,
  CashConcentration,
} from './types';

// ── Validators (Zod) ─────────────────────────────────────────────
export {
  createBankAccountSchema,
  recordCashMovementSchema,
  interCompanyTransferSchema,
  cashForecastInputSchema,
  sweepRuleInputSchema,
  wireTransferInputSchema,
  achBatchInputSchema,
  fxConversionInputSchema,
} from './validators';

// ── Error Codes ───────────────────────────────────────────────────
export { CashErrorCodes } from './errors';
```

---

## 3. Architecture

```
┌──────────────────────────────────────────────────────────────────────────────────┐
│                         @mcv/treasury/cash                                       │
│                                                                                  │
│  ┌─────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐  │
│  │ CashService  │  │ ForecastSvc  │  │ SweepService │  │ CashPoolingService   │  │
│  │              │  │              │  │              │  │                      │  │
│  │ • positions  │  │ • generate   │  │ • rules      │  │ • pool creation      │  │
│  │ • movements  │  │ • backtest   │  │ • execute    │  │ • allocations        │  │
│  │ • burn rate  │  │ • compare    │  │ • history    │  │ • interest calc      │  │
│  │ • runway     │  │ • accuracy   │  │ • cron sweep │  │ • overdraft mgmt     │  │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘  └──────────┬───────────┘  │
│         │                 │                 │                      │              │
│  ┌──────┴─────────────────┴─────────────────┴──────────────────────┴───────────┐  │
│  │                          Shared Data Layer                                  │  │
│  │  14 PostgreSQL tables · RLS policies · Audit triggers · Decimal.js math     │  │
│  └─────────────────────────────────────────────────────────────────────────────┘  │
│         │                 │                 │                      │              │
│  ┌──────┴───────┐  ┌──────┴───────┐  ┌──────┴───────┐  ┌─────────┴────────────┐  │
│  │ FXService    │  │ WireACHSvc   │  │ @mcv/        │  │ @mcv/web3-core       │  │
│  │              │  │              │  │ connectors   │  │                      │  │
│  │ • positions  │  │ • wires      │  │ (Plaid)      │  │ • SOL wallet balance │  │
│  │ • conversions│  │ • ACH batch  │  │              │  │ • EDGE token value   │  │
│  │ • rates      │  │ • NACHA gen  │  │              │  │                      │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  └──────────────────────┘  │
└──────────────────────────────────────────────────────────────────────────────────┘
```

### Multi-Venture Cash Hierarchy

```
                        ┌──────────────────────────────────────┐
                        │      MCV GLOBAL CASH HQ              │
                        │                                      │
                        │   Consolidated Position: $2.34M      │
                        │   Weighted Avg Yield: 4.2%           │
                        │   Burn Rate: $127K/mo                │
                        │   Runway: 18.4 months                │
                        └──────────────────┬───────────────────┘
                                           │
            ┌──────────────┬───────────────┼───────────────┬──────────────┐
            │              │               │               │              │
     ┌──────┴──────┐ ┌────┴────┐ ┌────────┴───┐ ┌────────┴───┐ ┌────────┴───────┐
     │  BetEdge    │ │ Serp    │ │ Full Gain  │ │ MCV Studios│ │ Futurestate    │
     │  $700K      │ │ Space   │ │ $180K      │ │ $320K      │ │ $600K          │
     │             │ │ $540K   │ │            │ │            │ │                │
     │ Chase (2)   │ │ SVB (2) │ │ Mercury(1) │ │ BoA (2)   │ │ Wells (2)      │
     │ Mercury (1) │ │         │ │            │ │            │ │ EDGE wallet    │
     └─────────────┘ └─────────┘ └────────────┘ └────────────┘ └────────────────┘
```

---

## 4. Interfaces & Types

### 4.1 Bank Account Types

```typescript
/**
 * Bank account types supported across the consortium.
 * Crypto wallets are tracked as a special account type to unify
 * the cash position view across TradFi and DeFi holdings.
 */
export type BankAccountType =
  | 'checking'
  | 'savings'
  | 'money_market'
  | 'sweep'
  | 'crypto_wallet';

/**
 * Input for registering a new bank account in the treasury system.
 * Bank accounts are always scoped to a venture and optionally to a legal entity.
 */
export interface CreateBankAccountInput {
  ventureId: string;
  entityId?: string;
  accountName: string;
  accountType: BankAccountType;
  bankName: string;
  bankRoutingNumber?: string;
  accountNumberLast4?: string;
  currency: string;
  plaidAccountId?: string;
  plaidItemId?: string;
  isPrimary?: boolean;
  isReserve?: boolean;
  targetBalance?: string;
  minimumBalance?: string;
  interestRate?: string;
  openedAt?: Date;
}

/**
 * Full bank account record as returned from the database.
 */
export interface TreasuryBankAccount extends CreateBankAccountInput {
  id: string;
  currentBalance: string;
  availableBalance: string;
  pendingBalance: string;
  lastSyncedAt: Date | null;
  status: 'active' | 'frozen' | 'closed';
  metadata: Record<string, unknown> | null;
  createdAt: Date;
  updatedAt: Date;
}
```

### 4.2 Cash Position Types

```typescript
/**
 * Consolidated cash position across all ventures.
 * This is the "dashboard view" — the single number the CFO sees first.
 */
export interface ConsolidatedCashPosition {
  asOfDate: Date;
  totalBalance: string;
  totalAvailable: string;
  ventureBreakdown: VentureCashPosition[];
  currencyBreakdown: CurrencyBreakdown[];
  burnRate: string;
  runwayDays: number;
  runwayMonths: number;
  accountCount: number;
  ventureCount: number;
  weightedAvgYield: string;
}

/**
 * Cash position for a single venture.
 */
export interface VentureCashPosition {
  ventureId: string;
  ventureName: string;
  totalBalance: string;
  availableBalance: string;
  accounts: TreasuryBankAccount[];
  burnRate: string;
  runwayDays: number;
  monthOverMonthChange: string;
  monthOverMonthChangePercent: string;
}

/**
 * Currency breakdown within the consolidated position.
 */
export interface CurrencyBreakdown {
  currency: string;
  localBalance: string;
  usdEquivalent: string;
  exchangeRate: string;
  percentOfTotal: string;
  unrealizedGainLoss: string;
}

/**
 * Point-in-time snapshot for a single account.
 */
export interface CashPositionSnapshot {
  id: string;
  snapshotDate: Date;
  ventureId: string | null;
  bankAccountId: string | null;
  currency: string;
  openingBalance: string;
  inflows: string;
  outflows: string;
  netChange: string;
  closingBalance: string;
  closingBalanceUsd: string;
  burnRate: string | null;
  runwayDays: number | null;
}
```

### 4.3 Cash Movement Types

```typescript
export type CashMovementType =
  | 'inflow'
  | 'outflow'
  | 'transfer'
  | 'sweep'
  | 'fx_conversion';

export interface RecordCashMovementInput {
  ventureId: string;
  movementType: CashMovementType;
  category: string;
  subcategory?: string;
  description: string;
  amount: string;
  currency?: string;
  exchangeRate?: string;
  fromAccountId?: string;
  toAccountId?: string;
  counterpartyVentureId?: string;
  transactionDate: Date;
  valueDate?: Date;
  reference?: string;
  sourceType?: 'manual' | 'bank_feed' | 'invoice' | 'payroll' | 'sweep';
  sourceId?: string;
  isInterCompany?: boolean;
  isRecurring?: boolean;
  notes?: string;
  tags?: string[];
}

export interface InterCompanyTransferInput {
  sourceVentureId: string;
  targetVentureId: string;
  sourceAccountId: string;
  targetAccountId: string;
  amount: string;
  currency?: string;
  description: string;
  reference?: string;
  category?: string;
}

export interface InterCompanyTransferResult {
  sourceMovement: CashMovement;
  targetMovement: CashMovement;
  consolidatedNetImpact: string;
}

export interface CashMovementFilters {
  ventureId?: string;
  movementType?: CashMovementType;
  category?: string;
  startDate?: Date;
  endDate?: Date;
  minAmount?: string;
  maxAmount?: string;
  isInterCompany?: boolean;
  status?: 'pending' | 'completed' | 'failed' | 'reversed';
  accountId?: string;
  tags?: string[];
  limit?: number;
  offset?: number;
  orderBy?: 'transaction_date' | 'amount' | 'created_at';
  orderDirection?: 'asc' | 'desc';
}

export interface CategoryBreakdown {
  category: string;
  subcategory?: string;
  totalInflow: string;
  totalOutflow: string;
  netAmount: string;
  transactionCount: number;
  percentOfTotal: string;
}
```

### 4.4 Runway & Burn Rate Types

```typescript
export interface BurnRateResult {
  ventureId: string | null;
  lookbackDays: number;
  dailyBurnRate: string;
  weeklyBurnRate: string;
  monthlyBurnRate: string;
  trend: 'increasing' | 'decreasing' | 'stable';
  trendMagnitude: string;
  topExpenseCategories: CategoryBreakdown[];
}

export interface RunwayResult {
  ventureId: string | null;
  currentCash: string;
  monthlyBurnRate: string;
  runwayDays: number;
  runwayMonths: number;
  projectedZeroDate: Date;
  scenarios: {
    optimistic: { runwayMonths: number; assumptions: string };
    baseline: { runwayMonths: number; assumptions: string };
    pessimistic: { runwayMonths: number; assumptions: string };
  };
}

export interface RunwayProjection {
  ventureId: string | null;
  startDate: Date;
  startingCash: string;
  projectionMonths: number;
  monthlyProjections: MonthlyProjection[];
  zeroRunwayMonth: number | null;
}

export interface MonthlyProjection {
  month: string;
  projectedInflows: string;
  projectedOutflows: string;
  projectedNetBurn: string;
  projectedEndingCash: string;
  cumulativeBurn: string;
  cashRunway: boolean;
}

export interface LiquidityRatio {
  currentRatio: string;
  quickRatio: string;
  cashRatio: string;
  operatingCashFlowRatio: string;
  asOfDate: Date;
}
```

### 4.5 Forecast Types

```typescript
export type ForecastMethod = 'linear' | 'seasonal' | 'ml_ensemble' | 'scenario';

export interface CashForecastInput {
  name: string;
  ventureId?: string;
  forecastHorizonDays: number;
  method: ForecastMethod;
  assumptions?: {
    revenueGrowth?: number;
    burnRateChange?: number;
    oneTimeItems?: Array<{
      date: Date;
      amount: string;
      type: 'inflow' | 'outflow';
      description: string;
    }>;
    excludeCategories?: string[];
    includeRecurring?: boolean;
  };
}

export interface CashForecastResult {
  id: string;
  name: string;
  ventureId: string | null;
  forecastHorizonDays: number;
  method: ForecastMethod;
  startDate: Date;
  endDate: Date;
  startingCash: string;
  projectedEndCash: string;
  projectedRunwayDays: number;
  confidenceLevel: string;
  confidenceIntervalLow: string;
  confidenceIntervalHigh: string;
  modelAccuracy: string;
  lines: CashForecastLine[];
  status: 'draft' | 'active' | 'superseded' | 'archived';
  generatedBy: string;
}

export interface CashForecastLine {
  forecastDate: Date;
  category: string;
  ventureId?: string;
  projectedInflow: string;
  projectedOutflow: string;
  projectedNet: string;
  cumulativeBalance: string;
  confidenceLow: string;
  confidenceHigh: string;
  isActual: boolean;
  actualAmount?: string;
  variance?: string;
}

export interface ForecastComparison {
  forecastId: string;
  forecastName: string;
  totalProjectedNet: string;
  totalActualNet: string;
  totalVariance: string;
  totalVariancePercent: string;
  mape: string;
  rmse: string;
  lineComparisons: Array<{
    date: Date;
    projected: string;
    actual: string;
    variance: string;
    variancePercent: string;
  }>;
}

export interface BackTestResult {
  forecastId: string;
  periodsBackTested: number;
  averageMAPE: string;
  averageRMSE: string;
  worstPeriod: { date: Date; variance: string };
  bestPeriod: { date: Date; variance: string };
  confidenceCalibration: string;
  recommendation: string;
}
```

### 4.6 Sweep & Cash Pooling Types

```typescript
export type SweepDirection = 'to_target' | 'to_source' | 'bidirectional';

export interface SweepRuleInput {
  ventureId: string;
  name: string;
  sourceAccountId: string;
  targetAccountId: string;
  direction: SweepDirection;
  triggerType: 'balance_threshold' | 'schedule' | 'manual';
  thresholdAmount?: string;
  targetBalanceAmount?: string;
  minimumSweepAmount?: string;
  maximumSweepAmount?: string;
  frequency?: 'daily' | 'weekly' | 'monthly';
  dayOfWeek?: number;
  dayOfMonth?: number;
  executeTime?: string;
}

export interface CashPoolInput {
  name: string;
  description?: string;
  poolType: 'notional' | 'physical' | 'hybrid';
  masterAccountId?: string;
  currency: string;
  interestAllocationMethod: 'pro_rata' | 'tiered' | 'flat_rate';
  interestRate?: string;
}

export interface InterestAllocation {
  ventureId: string;
  ventureName: string;
  contributedBalance: string;
  allocationPercent: string;
  interestEarned: string;
  interestRate: string;
  period: string;
}
```

### 4.7 Wire & ACH Types

```typescript
export type WireStatus = 'pending' | 'approved' | 'sent' | 'completed' | 'failed' | 'cancelled';

export type ACHStatus = 'draft' | 'approved' | 'submitted' | 'processing' | 'completed' | 'failed' | 'returned';

export interface WireTransferInput {
  ventureId: string;
  direction: 'outbound' | 'inbound';
  wireType: 'domestic' | 'international' | 'fedwire' | 'swift';
  fromAccountId: string;
  toAccountId?: string;
  beneficiaryName: string;
  beneficiaryBank?: string;
  beneficiaryAccountLast4?: string;
  beneficiarySwiftCode?: string;
  intermediaryBank?: string;
  intermediarySwiftCode?: string;
  amount: string;
  currency?: string;
  purpose?: string;
  reference?: string;
}

export interface ACHBatchInput {
  ventureId: string;
  batchName: string;
  batchType: 'payroll' | 'vendor' | 'tax' | 'transfer';
  fromAccountId: string;
  effectiveDate: Date;
  transactions: ACHTransactionInput[];
}

export interface ACHTransactionInput {
  recipientName: string;
  recipientRoutingNumber: string;
  recipientAccountLast4: string;
  recipientAccountType: 'checking' | 'savings';
  amount: string;
  transactionCode: string;
  addendaRecord?: string;
}
```

### 4.8 FX Types

```typescript
export interface FXRate {
  fromCurrency: string;
  toCurrency: string;
  rate: string;
  inverseRate: string;
  source: string;
  asOfDate: Date;
}

export interface FXPosition {
  ventureId: string | null;
  currency: string;
  balanceLocal: string;
  balanceUsd: string;
  exchangeRate: string;
  unrealizedGainLoss: string;
  hedged: boolean;
  hedgeInstrument?: string;
  asOfDate: Date;
}

export interface FXConversionInput {
  ventureId: string;
  fromCurrency: string;
  toCurrency: string;
  fromAmount: string;
  exchangeRate: string;
  provider?: string;
  purpose?: string;
}

export interface FXExposureSummary {
  asOfDate: Date;
  baseCurrency: string;
  totalForeignExposureUsd: string;
  percentOfTotalCash: string;
  positions: FXPosition[];
  totalUnrealizedGainLoss: string;
  largestExposure: { currency: string; usdAmount: string; percent: string };
}
```

---

## 5. Database Schemas

### 5.1 treasury_bank_accounts

```typescript
import { pgTable, pgEnum, uuid, text, numeric, boolean, timestamp, integer, jsonb } from 'drizzle-orm/pg-core';

export const bankAccountTypeEnum = pgEnum('bank_account_type', [
  'checking', 'savings', 'money_market', 'sweep', 'crypto_wallet'
]);

export const treasuryBankAccounts = pgTable('treasury_bank_accounts', {
  id: uuid('id').primaryKey().defaultRandom(),
  ventureId: uuid('venture_id').notNull().references(() => ventures.id, { onDelete: 'cascade' }),
  entityId: uuid('entity_id').references(() => legalEntities.id),
  accountName: text('account_name').notNull(),
  accountType: bankAccountTypeEnum('account_type').notNull(),
  bankName: text('bank_name').notNull(),
  bankRoutingNumber: text('bank_routing_number'),       // AES-256-GCM encrypted
  accountNumberLast4: text('account_number_last4'),
  currency: text('currency').notNull().default('USD'),
  currentBalance: numeric('current_balance', { precision: 19, scale: 4 }).default('0'),
  availableBalance: numeric('available_balance', { precision: 19, scale: 4 }).default('0'),
  pendingBalance: numeric('pending_balance', { precision: 19, scale: 4 }).default('0'),
  lastSyncedAt: timestamp('last_synced_at', { withTimezone: true }),
  plaidAccountId: text('plaid_account_id'),
  plaidItemId: text('plaid_item_id'),
  isPrimary: boolean('is_primary').default(false),
  isReserve: boolean('is_reserve').default(false),
  targetBalance: numeric('target_balance', { precision: 19, scale: 4 }),
  minimumBalance: numeric('minimum_balance', { precision: 19, scale: 4 }),
  interestRate: numeric('interest_rate', { precision: 6, scale: 4 }),
  status: text('status', { enum: ['active', 'frozen', 'closed'] }).notNull().default('active'),
  openedAt: timestamp('opened_at', { withTimezone: true }),
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});
```

### 5.2 treasury_cash_positions

```typescript
export const cashPositions = pgTable('treasury_cash_positions', {
  id: uuid('id').primaryKey().defaultRandom(),
  snapshotDate: timestamp('snapshot_date', { withTimezone: true }).notNull(),
  ventureId: uuid('venture_id').references(() => ventures.id),
  bankAccountId: uuid('bank_account_id').references(() => treasuryBankAccounts.id),
  currency: text('currency').notNull().default('USD'),
  openingBalance: numeric('opening_balance', { precision: 19, scale: 4 }).notNull(),
  inflows: numeric('inflows', { precision: 19, scale: 4 }).default('0'),
  outflows: numeric('outflows', { precision: 19, scale: 4 }).default('0'),
  netChange: numeric('net_change', { precision: 19, scale: 4 }).default('0'),
  closingBalance: numeric('closing_balance', { precision: 19, scale: 4 }).notNull(),
  closingBalanceUsd: numeric('closing_balance_usd', { precision: 19, scale: 4 }),
  exchangeRate: numeric('exchange_rate', { precision: 12, scale: 6 }).default('1'),
  burnRate: numeric('burn_rate', { precision: 19, scale: 4 }),
  runwayDays: integer('runway_days'),
  isConsolidated: boolean('is_consolidated').default(false),
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});
```

### 5.3 treasury_cash_movements

```typescript
export const cashMovementTypeEnum = pgEnum('cash_movement_type', [
  'inflow', 'outflow', 'transfer', 'sweep', 'fx_conversion'
]);

export const cashMovements = pgTable('treasury_cash_movements', {
  id: uuid('id').primaryKey().defaultRandom(),
  ventureId: uuid('venture_id').notNull().references(() => ventures.id, { onDelete: 'cascade' }),
  movementType: cashMovementTypeEnum('movement_type').notNull(),
  category: text('category').notNull(),
  subcategory: text('subcategory'),
  description: text('description').notNull(),
  amount: numeric('amount', { precision: 19, scale: 4 }).notNull(),
  currency: text('currency').notNull().default('USD'),
  amountUsd: numeric('amount_usd', { precision: 19, scale: 4 }),
  exchangeRate: numeric('exchange_rate', { precision: 12, scale: 6 }).default('1'),
  fromAccountId: uuid('from_account_id').references(() => treasuryBankAccounts.id),
  toAccountId: uuid('to_account_id').references(() => treasuryBankAccounts.id),
  counterpartyVentureId: uuid('counterparty_venture_id').references(() => ventures.id),
  transactionDate: timestamp('transaction_date', { withTimezone: true }).notNull(),
  valueDate: timestamp('value_date', { withTimezone: true }),
  reference: text('reference'),
  sourceType: text('source_type'),
  sourceId: uuid('source_id'),
  isInterCompany: boolean('is_inter_company').default(false),
  isRecurring: boolean('is_recurring').default(false),
  status: text('status', { enum: ['pending', 'completed', 'failed', 'reversed'] }).notNull().default('pending'),
  approvedBy: uuid('approved_by'),
  approvedAt: timestamp('approved_at', { withTimezone: true }),
  notes: text('notes'),
  tags: text('tags').array(),
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});
```

### 5.4 treasury_cash_forecasts & lines

```typescript
export const cashForecasts = pgTable('treasury_cash_forecasts', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  ventureId: uuid('venture_id').references(() => ventures.id),
  forecastHorizonDays: integer('forecast_horizon_days').notNull(),
  startDate: timestamp('start_date', { withTimezone: true }).notNull(),
  endDate: timestamp('end_date', { withTimezone: true }).notNull(),
  method: text('method', { enum: ['linear', 'seasonal', 'ml_ensemble', 'scenario'] }).notNull(),
  assumptions: jsonb('assumptions'),
  startingCash: numeric('starting_cash', { precision: 19, scale: 4 }).notNull(),
  projectedEndCash: numeric('projected_end_cash', { precision: 19, scale: 4 }),
  projectedRunwayDays: integer('projected_runway_days'),
  confidenceLevel: numeric('confidence_level', { precision: 5, scale: 4 }),
  confidenceIntervalLow: numeric('confidence_interval_low', { precision: 19, scale: 4 }),
  confidenceIntervalHigh: numeric('confidence_interval_high', { precision: 19, scale: 4 }),
  modelAccuracy: numeric('model_accuracy', { precision: 5, scale: 4 }),
  status: text('status', { enum: ['draft', 'active', 'superseded', 'archived'] }).notNull().default('draft'),
  generatedBy: text('generated_by'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export const cashForecastLines = pgTable('treasury_cash_forecast_lines', {
  id: uuid('id').primaryKey().defaultRandom(),
  forecastId: uuid('forecast_id').notNull().references(() => cashForecasts.id, { onDelete: 'cascade' }),
  forecastDate: timestamp('forecast_date', { withTimezone: true }).notNull(),
  category: text('category').notNull(),
  ventureId: uuid('venture_id').references(() => ventures.id),
  projectedInflow: numeric('projected_inflow', { precision: 19, scale: 4 }).default('0'),
  projectedOutflow: numeric('projected_outflow', { precision: 19, scale: 4 }).default('0'),
  projectedNet: numeric('projected_net', { precision: 19, scale: 4 }).default('0'),
  cumulativeBalance: numeric('cumulative_balance', { precision: 19, scale: 4 }),
  confidenceLow: numeric('confidence_low', { precision: 19, scale: 4 }),
  confidenceHigh: numeric('confidence_high', { precision: 19, scale: 4 }),
  isActual: boolean('is_actual').default(false),
  actualAmount: numeric('actual_amount', { precision: 19, scale: 4 }),
  variance: numeric('variance', { precision: 19, scale: 4 }),
  notes: text('notes'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});
```

### 5.5 Sweep Accounts & Transactions

```typescript
export const sweepDirectionEnum = pgEnum('sweep_direction', ['to_target', 'to_source', 'bidirectional']);

export const sweepAccounts = pgTable('treasury_sweep_accounts', {
  id: uuid('id').primaryKey().defaultRandom(),
  ventureId: uuid('venture_id').notNull().references(() => ventures.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  sourceAccountId: uuid('source_account_id').notNull().references(() => treasuryBankAccounts.id),
  targetAccountId: uuid('target_account_id').notNull().references(() => treasuryBankAccounts.id),
  direction: sweepDirectionEnum('direction').notNull(),
  triggerType: text('trigger_type', { enum: ['balance_threshold', 'schedule', 'manual'] }).notNull(),
  thresholdAmount: numeric('threshold_amount', { precision: 19, scale: 4 }),
  targetBalanceAmount: numeric('target_balance_amount', { precision: 19, scale: 4 }),
  minimumSweepAmount: numeric('minimum_sweep_amount', { precision: 19, scale: 4 }).default('1000'),
  maximumSweepAmount: numeric('maximum_sweep_amount', { precision: 19, scale: 4 }),
  frequency: text('frequency', { enum: ['daily', 'weekly', 'monthly'] }),
  dayOfWeek: integer('day_of_week'),
  dayOfMonth: integer('day_of_month'),
  executeTime: text('execute_time').default('23:00'),
  isActive: boolean('is_active').default(true),
  lastExecutedAt: timestamp('last_executed_at', { withTimezone: true }),
  totalSwept: numeric('total_swept', { precision: 19, scale: 4 }).default('0'),
  sweepCount: integer('sweep_count').default(0),
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export const sweepTransactions = pgTable('treasury_sweep_transactions', {
  id: uuid('id').primaryKey().defaultRandom(),
  sweepAccountId: uuid('sweep_account_id').notNull().references(() => sweepAccounts.id),
  cashMovementId: uuid('cash_movement_id').references(() => cashMovements.id),
  amount: numeric('amount', { precision: 19, scale: 4 }).notNull(),
  sourceBalanceBefore: numeric('source_balance_before', { precision: 19, scale: 4 }),
  sourceBalanceAfter: numeric('source_balance_after', { precision: 19, scale: 4 }),
  targetBalanceBefore: numeric('target_balance_before', { precision: 19, scale: 4 }),
  targetBalanceAfter: numeric('target_balance_after', { precision: 19, scale: 4 }),
  triggerReason: text('trigger_reason').notNull(),
  status: text('status', { enum: ['pending', 'executed', 'failed', 'reversed'] }).notNull().default('pending'),
  executedAt: timestamp('executed_at', { withTimezone: true }),
  failureReason: text('failure_reason'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});
```

### 5.6 Cash Pools & Allocations

```typescript
export const cashPools = pgTable('treasury_cash_pools', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  description: text('description'),
  poolType: text('pool_type', { enum: ['notional', 'physical', 'hybrid'] }).notNull(),
  masterAccountId: uuid('master_account_id').references(() => treasuryBankAccounts.id),
  currency: text('currency').notNull().default('USD'),
  totalPoolBalance: numeric('total_pool_balance', { precision: 19, scale: 4 }).default('0'),
  interestAllocationMethod: text('interest_allocation_method', {
    enum: ['pro_rata', 'tiered', 'flat_rate']
  }).default('pro_rata'),
  interestRate: numeric('interest_rate', { precision: 6, scale: 4 }),
  isActive: boolean('is_active').default(true),
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export const cashPoolAllocations = pgTable('treasury_cash_pool_allocations', {
  id: uuid('id').primaryKey().defaultRandom(),
  poolId: uuid('pool_id').notNull().references(() => cashPools.id, { onDelete: 'cascade' }),
  ventureId: uuid('venture_id').notNull().references(() => ventures.id),
  participantAccountId: uuid('participant_account_id').references(() => treasuryBankAccounts.id),
  contributedBalance: numeric('contributed_balance', { precision: 19, scale: 4 }).default('0'),
  allocationPercent: numeric('allocation_percent', { precision: 6, scale: 4 }),
  interestEarned: numeric('interest_earned', { precision: 19, scale: 4 }).default('0'),
  interestPaid: numeric('interest_paid', { precision: 19, scale: 4 }).default('0'),
  overdraftLimit: numeric('overdraft_limit', { precision: 19, scale: 4 }),
  currentOverdraft: numeric('current_overdraft', { precision: 19, scale: 4 }).default('0'),
  isActive: boolean('is_active').default(true),
  joinedAt: timestamp('joined_at', { withTimezone: true }).defaultNow(),
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});
```

### 5.7 Wire Transfers & ACH

```typescript
export const wireStatusEnum = pgEnum('wire_status', [
  'pending', 'approved', 'sent', 'completed', 'failed', 'cancelled'
]);

export const wireTransfers = pgTable('treasury_wire_transfers', {
  id: uuid('id').primaryKey().defaultRandom(),
  ventureId: uuid('venture_id').notNull().references(() => ventures.id, { onDelete: 'cascade' }),
  cashMovementId: uuid('cash_movement_id').references(() => cashMovements.id),
  direction: text('direction', { enum: ['outbound', 'inbound'] }).notNull(),
  wireType: text('wire_type', { enum: ['domestic', 'international', 'fedwire', 'swift'] }).notNull(),
  fromAccountId: uuid('from_account_id').references(() => treasuryBankAccounts.id),
  toAccountId: uuid('to_account_id').references(() => treasuryBankAccounts.id),
  beneficiaryName: text('beneficiary_name').notNull(),
  beneficiaryBank: text('beneficiary_bank'),
  beneficiaryAccountLast4: text('beneficiary_account_last4'),
  beneficiarySwiftCode: text('beneficiary_swift_code'),
  intermediaryBank: text('intermediary_bank'),
  intermediarySwiftCode: text('intermediary_swift_code'),
  amount: numeric('amount', { precision: 19, scale: 4 }).notNull(),
  currency: text('currency').notNull().default('USD'),
  fee: numeric('fee', { precision: 19, scale: 4 }).default('0'),
  exchangeRate: numeric('exchange_rate', { precision: 12, scale: 6 }),
  reference: text('reference'),
  purpose: text('purpose'),
  status: wireStatusEnum('status').notNull().default('pending'),
  requestedBy: uuid('requested_by'),
  approvedBy: uuid('approved_by'),
  approvedAt: timestamp('approved_at', { withTimezone: true }),
  sentAt: timestamp('sent_at', { withTimezone: true }),
  completedAt: timestamp('completed_at', { withTimezone: true }),
  failureReason: text('failure_reason'),
  confirmationNumber: text('confirmation_number'),
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export const achBatches = pgTable('treasury_ach_batches', {
  id: uuid('id').primaryKey().defaultRandom(),
  ventureId: uuid('venture_id').notNull().references(() => ventures.id, { onDelete: 'cascade' }),
  batchName: text('batch_name').notNull(),
  batchType: text('batch_type', { enum: ['payroll', 'vendor', 'tax', 'transfer'] }).notNull(),
  fromAccountId: uuid('from_account_id').notNull().references(() => treasuryBankAccounts.id),
  totalAmount: numeric('total_amount', { precision: 19, scale: 4 }).notNull(),
  transactionCount: integer('transaction_count').notNull(),
  effectiveDate: timestamp('effective_date', { withTimezone: true }).notNull(),
  status: text('status', { enum: ['draft', 'approved', 'submitted', 'processing', 'completed', 'failed', 'returned'] }).notNull().default('draft'),
  nachaFileUrl: text('nacha_file_url'),
  submittedAt: timestamp('submitted_at', { withTimezone: true }),
  completedAt: timestamp('completed_at', { withTimezone: true }),
  approvedBy: uuid('approved_by'),
  returnCount: integer('return_count').default(0),
  returnAmount: numeric('return_amount', { precision: 19, scale: 4 }).default('0'),
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export const achTransactions = pgTable('treasury_ach_transactions', {
  id: uuid('id').primaryKey().defaultRandom(),
  batchId: uuid('batch_id').notNull().references(() => achBatches.id, { onDelete: 'cascade' }),
  cashMovementId: uuid('cash_movement_id').references(() => cashMovements.id),
  recipientName: text('recipient_name').notNull(),
  recipientRoutingNumber: text('recipient_routing_number').notNull(),
  recipientAccountLast4: text('recipient_account_last4'),
  recipientAccountType: text('recipient_account_type', { enum: ['checking', 'savings'] }),
  amount: numeric('amount', { precision: 19, scale: 4 }).notNull(),
  transactionCode: text('transaction_code').notNull(),
  traceNumber: text('trace_number'),
  addendaRecord: text('addenda_record'),
  status: text('status', { enum: ['pending', 'processed', 'returned', 'corrected'] }).notNull().default('pending'),
  returnCode: text('return_code'),
  returnReason: text('return_reason'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});
```

### 5.8 FX Positions & Transactions

```typescript
export const fxPositions = pgTable('treasury_fx_positions', {
  id: uuid('id').primaryKey().defaultRandom(),
  ventureId: uuid('venture_id').references(() => ventures.id),
  currency: text('currency').notNull(),
  balanceLocal: numeric('balance_local', { precision: 19, scale: 4 }).notNull(),
  balanceUsd: numeric('balance_usd', { precision: 19, scale: 4 }).notNull(),
  exchangeRate: numeric('exchange_rate', { precision: 12, scale: 6 }).notNull(),
  unrealizedGainLoss: numeric('unrealized_gain_loss', { precision: 19, scale: 4 }).default('0'),
  hedged: boolean('hedged').default(false),
  hedgeInstrument: text('hedge_instrument'),
  asOfDate: timestamp('as_of_date', { withTimezone: true }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const fxTransactions = pgTable('treasury_fx_transactions', {
  id: uuid('id').primaryKey().defaultRandom(),
  ventureId: uuid('venture_id').notNull().references(() => ventures.id, { onDelete: 'cascade' }),
  cashMovementId: uuid('cash_movement_id').references(() => cashMovements.id),
  fromCurrency: text('from_currency').notNull(),
  toCurrency: text('to_currency').notNull(),
  fromAmount: numeric('from_amount', { precision: 19, scale: 4 }).notNull(),
  toAmount: numeric('to_amount', { precision: 19, scale: 4 }).notNull(),
  exchangeRate: numeric('exchange_rate', { precision: 12, scale: 6 }).notNull(),
  spotRate: numeric('spot_rate', { precision: 12, scale: 6 }),
  spreadBps: numeric('spread_bps', { precision: 8, scale: 2 }),
  feeAmount: numeric('fee_amount', { precision: 19, scale: 4 }).default('0'),
  realizedGainLoss: numeric('realized_gain_loss', { precision: 19, scale: 4 }).default('0'),
  purpose: text('purpose'),
  provider: text('provider'),
  executedAt: timestamp('executed_at', { withTimezone: true }).notNull(),
  settledAt: timestamp('settled_at', { withTimezone: true }),
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});
```

---

## 6. Service API

### 6.1 CashService

```typescript
export class CashService {
  constructor(
    private db: DrizzleDB,
    private connectors: ConnectorsService,
    private notifications: NotificationsService,
    private web3: Web3CoreService,
  ) {}

  // ── Bank Account Management ─────────────────────────────
  async registerBankAccount(input: CreateBankAccountInput): Promise<TreasuryBankAccount>;
  async updateBankAccount(accountId: string, input: Partial<CreateBankAccountInput>): Promise<TreasuryBankAccount>;
  async closeBankAccount(accountId: string, reason: string): Promise<TreasuryBankAccount>;
  async listBankAccounts(filters?: { ventureId?: string; accountType?: BankAccountType; status?: string }): Promise<TreasuryBankAccount[]>;
  async syncBankBalance(accountId: string): Promise<TreasuryBankAccount>;
  async syncAllBalances(): Promise<BankSyncResult>;

  // ── Cash Position ───────────────────────────────────────
  async getConsolidatedPosition(asOfDate?: Date): Promise<ConsolidatedCashPosition>;
  async getVenturePosition(ventureId: string, asOfDate?: Date): Promise<VentureCashPosition>;
  async getPositionHistory(filters: { ventureId?: string; startDate: Date; endDate: Date }): Promise<CashPositionSnapshot[]>;
  async snapshotDailyPositions(): Promise<CashPositionSnapshot[]>;

  // ── Cash Movements ──────────────────────────────────────
  async recordMovement(input: RecordCashMovementInput): Promise<CashMovement>;
  async recordInterCompanyTransfer(input: InterCompanyTransferInput): Promise<InterCompanyTransferResult>;
  async getMovements(filters: CashMovementFilters): Promise<PaginatedResult<CashMovement>>;
  async getMovementsByCategory(ventureId: string, startDate: Date, endDate: Date): Promise<CategoryBreakdown[]>;

  // ── Runway & Burn Rate ──────────────────────────────────
  async calculateBurnRate(ventureId?: string, lookbackDays?: number): Promise<BurnRateResult>;
  async calculateRunway(ventureId?: string): Promise<RunwayResult>;
  async getRunwayProjection(months: number, ventureId?: string): Promise<RunwayProjection>;
}
```

### 6.2 CashForecastService

```typescript
export class CashForecastService {
  constructor(private db: DrizzleDB, private ai: OpenRouterService) {}

  async generateForecast(input: CashForecastInput): Promise<CashForecastResult>;
  async getForecastVsActual(forecastId: string): Promise<ForecastComparison>;
  async listForecasts(filters?: { ventureId?: string; status?: string }): Promise<CashForecastResult[]>;
  async supersedeForecast(forecastId: string, newForecastId: string): Promise<void>;
  async getLatestForecast(ventureId?: string): Promise<CashForecastResult | null>;
  async backTestForecast(forecastId: string): Promise<BackTestResult>;
}
```

### 6.3 SweepService

```typescript
export class SweepService {
  constructor(private db: DrizzleDB, private cashService: CashService, private connectors: ConnectorsService) {}

  async createSweepRule(input: SweepRuleInput): Promise<SweepAccount>;
  async updateSweepRule(sweepId: string, input: Partial<SweepRuleInput>): Promise<SweepAccount>;
  async deactivateSweep(sweepId: string): Promise<SweepAccount>;
  async executeSweep(sweepId: string): Promise<SweepTransaction>;
  async executeAllDueSweeps(): Promise<SweepTransaction[]>;
  async getSweepHistory(sweepId: string): Promise<SweepTransaction[]>;
}
```

### 6.4 CashPoolingService, FXService, WireACHService

```typescript
export class CashPoolingService {
  async createPool(input: CashPoolInput): Promise<CashPool>;
  async addParticipant(poolId: string, input: CashPoolContributionInput): Promise<CashPoolAllocation>;
  async removeParticipant(poolId: string, ventureId: string): Promise<void>;
  async calculateInterest(poolId: string, period: string): Promise<InterestAllocation[]>;
  async getPoolBalance(poolId: string): Promise<CashPoolBalance>;
}

export class FXService {
  async getCurrentRates(currencies?: string[]): Promise<FXRate[]>;
  async updateFXPositions(): Promise<FXPosition[]>;
  async recordConversion(input: FXConversionInput): Promise<FXTransaction>;
  async getExposureSummary(): Promise<FXExposureSummary>;
  async getPositionHistory(currency: string, days?: number): Promise<FXPosition[]>;
  async calculateUnrealizedGainLoss(): Promise<Array<{ currency: string; amount: string }>>;
}

export class WireACHService {
  async initiateWire(input: WireTransferInput): Promise<WireTransfer>;
  async approveWire(wireId: string, approvedBy: string): Promise<WireTransfer>;
  async cancelWire(wireId: string, reason: string): Promise<WireTransfer>;
  async getWireStatus(wireId: string): Promise<WireTransfer>;
  async listWires(filters?: { ventureId?: string; status?: WireStatus }): Promise<WireTransfer[]>;
  async createACHBatch(input: ACHBatchInput): Promise<ACHBatch>;
  async submitACHBatch(batchId: string): Promise<ACHBatch>;
  async processACHReturn(batchId: string, transactionId: string, returnCode: string, reason: string): Promise<ACHTransaction>;
  async getACHBatch(batchId: string): Promise<ACHBatch & { transactions: ACHTransaction[] }>;
}
```

---

## 7. Code Examples

### Example 1: Get Consolidated Cash Position

```typescript
import { CashService } from '@mcv/treasury/cash';

const cashService = new CashService(db, connectors, notifications, web3);
const position = await cashService.getConsolidatedPosition();

console.log(`Total Cash: $${Number(position.totalBalance).toLocaleString()}`);
console.log(`Runway: ${position.runwayMonths} months`);
console.log(`Burn Rate: $${Number(position.burnRate).toLocaleString()}/month`);

for (const venture of position.ventureBreakdown) {
  console.log(`  ${venture.ventureName}: $${Number(venture.totalBalance).toLocaleString()} (${venture.runwayDays} days)`);
}

for (const currency of position.currencyBreakdown) {
  console.log(`  ${currency.currency}: ${currency.localBalance} (≈$${Number(currency.usdEquivalent).toLocaleString()})`);
}
```

### Example 2: Record an Inter-Company Transfer

```typescript
// BetEdge pays SerpSpace for SEO services
const result = await cashService.recordInterCompanyTransfer({
  sourceVentureId: 'betedge-uuid',
  targetVentureId: 'serpspace-uuid',
  sourceAccountId: 'betedge-chase-checking-uuid',
  targetAccountId: 'serpspace-svb-checking-uuid',
  amount: '50000',
  description: 'February 2026 SEO services per IC agreement #IC-2025-003',
  category: 'intercompany',
});

console.log('Source movement:', result.sourceMovement.id);
console.log('Target movement:', result.targetMovement.id);
console.log('Consolidated net impact:', result.consolidatedNetImpact); // "0"
// Both movements tagged isInterCompany=true for P&L elimination
```

### Example 3: Generate a 90-Day Cash Forecast

```typescript
import { CashForecastService } from '@mcv/treasury/cash';

const forecastService = new CashForecastService(db, aiService);
const forecast = await forecastService.generateForecast({
  name: 'Q1 2026 — 90-Day Consolidated Forecast',
  forecastHorizonDays: 90,
  method: 'ml_ensemble',
  assumptions: {
    revenueGrowth: 0.05,
    burnRateChange: 0.02,
    oneTimeItems: [
      { date: new Date('2026-03-15'), amount: '200000', type: 'inflow', description: 'Series A tranche 2' },
      { date: new Date('2026-04-15'), amount: '45000', type: 'outflow', description: 'Q1 estimated tax' },
    ],
    includeRecurring: true,
  },
});

console.log(`Starting Cash: $${Number(forecast.startingCash).toLocaleString()}`);
console.log(`Projected End: $${Number(forecast.projectedEndCash).toLocaleString()}`);
console.log(`Confidence: ${(Number(forecast.confidenceLevel) * 100).toFixed(1)}%`);
console.log(`Runway: ${forecast.projectedRunwayDays} days`);
```

### Example 4: Configure and Execute a Sweep Rule

```typescript
import { SweepService } from '@mcv/treasury/cash';

const sweepService = new SweepService(db, cashService, connectors);

const sweep = await sweepService.createSweepRule({
  ventureId: 'betedge-uuid',
  name: 'BetEdge Nightly Sweep to Savings',
  sourceAccountId: 'betedge-chase-checking-uuid',
  targetAccountId: 'betedge-chase-savings-uuid',
  direction: 'to_target',
  triggerType: 'balance_threshold',
  thresholdAmount: '150000',
  targetBalanceAmount: '100000',
  minimumSweepAmount: '5000',
  maximumSweepAmount: '500000',
});

const transaction = await sweepService.executeSweep(sweep.id);
console.log(`Swept: $${Number(transaction.amount).toLocaleString()}`);
console.log(`Source: $${transaction.sourceBalanceBefore} → $${transaction.sourceBalanceAfter}`);
console.log(`Target: $${transaction.targetBalanceBefore} → $${transaction.targetBalanceAfter}`);
```

### Example 5: FX Exposure Analysis

```typescript
import { FXService } from '@mcv/treasury/cash';

const fxService = new FXService(db, cashService);
const exposure = await fxService.getExposureSummary();

console.log(`Total Foreign Exposure: $${Number(exposure.totalForeignExposureUsd).toLocaleString()}`);
console.log(`Percent of Total Cash: ${exposure.percentOfTotalCash}%`);
console.log(`Unrealized FX G/L: $${Number(exposure.totalUnrealizedGainLoss).toLocaleString()}`);

for (const pos of exposure.positions) {
  const hedge = pos.hedged ? ' [HEDGED]' : '';
  console.log(`  ${pos.currency}: ${pos.balanceLocal} (≈$${Number(pos.balanceUsd).toLocaleString()})${hedge}`);
}

// Convert CAD → USD
const conversion = await fxService.recordConversion({
  ventureId: 'futurestate-uuid',
  fromCurrency: 'CAD',
  toCurrency: 'USD',
  fromAmount: '50000',
  exchangeRate: '0.7500',
  provider: 'Wise',
  purpose: 'Convert CAD revenue for US vendor payments',
});
```

### Example 6: Create ACH Payroll Batch

```typescript
import { WireACHService } from '@mcv/treasury/cash';

const wireACHService = new WireACHService(db, cashService, connectors, notifications);

const batch = await wireACHService.createACHBatch({
  ventureId: 'betedge-uuid',
  batchName: 'February 2026 Payroll',
  batchType: 'payroll',
  fromAccountId: 'betedge-chase-checking-uuid',
  effectiveDate: new Date('2026-02-28'),
  transactions: [
    { recipientName: 'John Smith', recipientRoutingNumber: '021000021', recipientAccountLast4: '4567', recipientAccountType: 'checking', amount: '8500.00', transactionCode: '22' },
    { recipientName: 'Jane Doe', recipientRoutingNumber: '011401533', recipientAccountLast4: '8901', recipientAccountType: 'checking', amount: '9200.00', transactionCode: '22' },
  ],
});

console.log(`Batch: ${batch.batchName} — $${Number(batch.totalAmount).toLocaleString()} (${batch.transactionCount} txns)`);
const submitted = await wireACHService.submitACHBatch(batch.id);
console.log(`NACHA file: ${submitted.nachaFileUrl}`);
```

---

## 8. Error Codes

| Code | HTTP | Description |
|------|------|-------------|
| `CASH_BANK_ACCOUNT_NOT_FOUND` | 404 | Bank account ID does not exist |
| `CASH_INSUFFICIENT_BALANCE` | 400 | Account balance insufficient for operation |
| `CASH_ACCOUNT_FROZEN` | 400 | Account is frozen and cannot transact |
| `CASH_ACCOUNT_CLOSED` | 400 | Account is closed |
| `CASH_ACCOUNT_HAS_BALANCE` | 400 | Cannot close account with non-zero balance |
| `CASH_DUPLICATE_MOVEMENT` | 409 | Duplicate movement detected (same ref/date/amount) |
| `CASH_SWEEP_BELOW_MINIMUM` | 400 | Calculated sweep amount below minimum threshold |
| `CASH_SWEEP_RULE_INACTIVE` | 400 | Sweep rule is deactivated |
| `CASH_FORECAST_OVERLAP` | 409 | Forecast period overlaps existing active forecast |
| `CASH_FORECAST_METHOD_UNAVAILABLE` | 400 | ML model unavailable for forecasting |
| `CASH_FX_RATE_UNAVAILABLE` | 503 | Exchange rate data unavailable |
| `CASH_FX_CONVERSION_SELF` | 400 | Cannot convert currency to itself |
| `CASH_WIRE_APPROVAL_REQUIRED` | 403 | Wire > $25K requires dual approval |
| `CASH_WIRE_ALREADY_SENT` | 400 | Wire has already been sent |
| `CASH_ACH_BATCH_SUBMITTED` | 400 | ACH batch already submitted |
| `CASH_ACH_INVALID_NACHA` | 400 | NACHA file generation failed |
| `CASH_POOL_OVERDRAFT_LIMIT` | 400 | Venture overdraft limit exceeded in cash pool |
| `CASH_PLAID_SYNC_FAILED` | 503 | Plaid bank feed sync failed |
| `CASH_SYNC_RATE_LIMITED` | 429 | Too many sync requests |

---

## 9. Security

### Access Control

| Operation | Required Role | Notes |
|-----------|--------------|-------|
| View bank accounts | `treasury:viewer` | Venture-scoped via RLS |
| View consolidated positions | `treasury:admin` | Cross-venture data |
| Register bank account | `treasury:admin` | Must have venture access |
| Record cash movement | `treasury:admin` | Audit logged |
| Initiate wire > $25K | `treasury:admin` | Requires dual approval |
| Approve wire | `treasury:approver` | Different user than initiator |
| Create sweep rule | `treasury:admin` | |
| Manage cash pool | `treasury:super_admin` | Cross-venture operation |
| Close bank account | `treasury:super_admin` | Irreversible |

### Data Protection

- **Routing numbers**: AES-256-GCM encrypted at rest. Never logged. Never in API responses.
- **Account numbers**: Only last 4 digits stored. Full numbers never persist.
- **Plaid tokens**: Encrypted. Rotated on connection refresh.
- **Wire details**: Beneficiary bank details encrypted. treasury:admin only.
- **All financial mutations**: Produce audit trail entries with before/after values.

---

## 10. Cron Jobs

| Job | Schedule | Description |
|-----|----------|-------------|
| `treasury:cash:snapshot-positions` | Daily 23:59 UTC | Snapshot all bank balances, calculate consolidated positions |
| `treasury:cash:sync-bank-feeds` | Every 6 hours | Sync Plaid + crypto wallet balances |
| `treasury:cash:execute-sweeps` | Daily 23:00 UTC | Execute all due sweep rules |
| `treasury:cash:update-fx-rates` | Daily 06:00 UTC | Fetch FX rates, update positions, calc unrealized G/L |
| `treasury:cash:generate-forecast` | Weekly Mon 08:00 UTC | Auto-generate 90-day forecast |
| `treasury:cash:low-balance-check` | Every 4 hours | Check accounts vs minimumBalance, alert if needed |

---

## 11. Dependencies

| Package | Purpose |
|---------|---------|
| `@mcv/kernel` | DB, context, errors, auth, RLS |
| `@mcv/connectors` | Plaid bank feed integration |
| `@mcv/web3-core` | Crypto wallet balances (SOL, EDGE) |
| `@mcv/notifications` | Low-balance alerts, wire approvals |
| `@mcv/payments` | Wire/ACH processing |
| `drizzle-orm` | PostgreSQL ORM (14 tables) |
| `decimal.js` | Precise financial arithmetic |
| `date-fns` | Date manipulation |
| `plaid` | Bank feed API client |

---

*@mcv/treasury/cash — Cash Nerve Center*
