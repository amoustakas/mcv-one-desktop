# @mcv/treasury — API Reference

> **Package:** `@mcv/treasury`
> **Classification:** MCV-ONLY
> **Tier:** 5 — Domain Layer
> **Version:** 1.0.0
> **Last Updated:** February 9, 2026

---

## Table of Contents

1. [API Overview](#api-overview)
2. [Cash Service Methods](#cash-service-methods)
3. [Cash Forecast Service Methods](#cash-forecast-service-methods)
4. [Sweep Service Methods](#sweep-service-methods)
5. [Cash Pooling Service Methods](#cash-pooling-service-methods)
6. [Funding Service Methods](#funding-service-methods)
7. [Cap Table Service Methods](#cap-table-service-methods)
8. [Investor Service Methods](#investor-service-methods)
9. [Waterfall Service Methods](#waterfall-service-methods)
10. [P&L Service Methods](#pl-service-methods)
11. [Elimination Service Methods](#elimination-service-methods)
12. [Variance Service Methods](#variance-service-methods)
13. [Segment Reporting Service Methods](#segment-reporting-service-methods)
14. [Board Report Service Methods](#board-report-service-methods)
15. [Tax Service Methods](#tax-service-methods)
16. [Tax Calendar Service Methods](#tax-calendar-service-methods)
17. [Transfer Pricing Service Methods](#transfer-pricing-service-methods)
18. [Tax Credit Service Methods](#tax-credit-service-methods)
19. [Tax Provision Service Methods](#tax-provision-service-methods)
20. [Type Definitions](#type-definitions)
21. [Zod Schemas](#zod-schemas)
22. [Event Types](#event-types)
23. [Error Codes](#error-codes)
24. [Config Reference](#config-reference)

---

## API Overview

All treasury APIs are accessed through service classes exported from `@mcv/treasury`. Services are organized by submodule:

```typescript
import {
  // Cash
  cashService,
  cashForecastService,
  sweepService,
  cashPoolingService,

  // Funding
  fundingService,
  capTableService,
  investorService,
  waterfallService,

  // P&L
  pnlService,
  eliminationService,
  varianceService,
  segmentReportingService,
  boardReportService,

  // Tax
  taxService,
  taxCalendarService,
  transferPricingService,
  taxCreditService,
  taxProvisionService,
} from '@mcv/treasury';
```

### Authentication Requirements

| Role | Read Access | Write Access | Notes |
|------|:----------:|:------------:|-------|
| `treasury:viewer` | ✅ | ❌ | Read-only across all treasury data |
| `treasury:admin` | ✅ | ✅ | Full CRUD, consolidation, filings |
| `super_admin` | ✅ | ✅ | All operations including config |
| `investor:portal` | Own data | ❌ | Investor portal isolation |

### Response Conventions

All service methods return typed promises. Errors throw `TreasuryError` with structured error codes.

```typescript
// Success
const position = await cashService.getConsolidatedPosition();
// Returns: ConsolidatedCashPosition

// Error
try {
  await fundingService.closeRound(roundId);
} catch (error) {
  if (error instanceof TreasuryError) {
    console.log(error.code);       // 'TREASURY_ROUND_NOT_ACTIVE'
    console.log(error.statusCode); // 400
  }
}
```

---

## Cash Service Methods

### `cashService.registerBankAccount(input)`

Register a new bank account for a venture in the treasury system.

```typescript
const account = await cashService.registerBankAccount({
  ventureId: 'uuid-betedge',
  entityId: 'uuid-betedge-inc',
  accountName: 'BetEdge Operating — Chase',
  accountType: 'checking',
  bankName: 'JPMorgan Chase',
  currency: 'USD',
  isPrimary: true,
  minimumBalance: '50000',
  plaidAccountId: 'plaid_acc_xxx',
  plaidItemId: 'plaid_item_xxx',
});
```

**Parameters:** `CreateBankAccountInput`
**Returns:** `Promise<TreasuryBankAccount>`
**Errors:** `TREASURY_VENTURE_NOT_FOUND`

---

### `cashService.getConsolidatedPosition(asOfDate?)`

Get the consolidated cash position across all ventures.

```typescript
const position = await cashService.getConsolidatedPosition();

// Returns:
{
  totalBalance: '2340000.0000',
  totalBalanceUsd: '2340000.0000',
  ventureBreakdown: [
    { ventureId: 'uuid', ventureName: 'BetEdge', totalBalance: '700000.0000', accountCount: 3, burnRate: '35000.0000', runwayDays: 600 },
    { ventureId: 'uuid', ventureName: 'SerpSpace', totalBalance: '540000.0000', accountCount: 2, burnRate: '28000.0000', runwayDays: 578 },
    // ... all 9 ventures
  ],
  currencyBreakdown: [
    { currency: 'USD', balanceLocal: '2100000.0000', balanceUsd: '2100000.0000', exchangeRate: '1.000000', accountCount: 15 },
    { currency: 'CAD', balanceLocal: '140000.0000', balanceUsd: '105000.0000', exchangeRate: '0.750000', accountCount: 2 },
    { currency: 'SOL', balanceLocal: '430.0000', balanceUsd: '43000.0000', exchangeRate: '100.000000', accountCount: 1 },
  ],
  burnRate: '127000.0000',
  runwayDays: 552,
  runwayMonths: 18,
  asOfDate: '2026-02-09T00:00:00Z',
}
```

**Parameters:** `asOfDate?: Date` — optional historical date
**Returns:** `Promise<ConsolidatedCashPosition>`
**Cache:** 5-minute TTL in Redis

---

### `cashService.getVenturePosition(ventureId, asOfDate?)`

Get cash position for a single venture.

```typescript
const position = await cashService.getVenturePosition('uuid-betedge');
```

**Parameters:** `ventureId: string`, `asOfDate?: Date`
**Returns:** `Promise<VentureCashPosition>`

---

### `cashService.recordMovement(input)`

Record a cash movement (inflow, outflow, transfer, sweep, or FX conversion).

```typescript
const movement = await cashService.recordMovement({
  ventureId: 'uuid-betedge',
  movementType: 'outflow',
  category: 'vendor',
  subcategory: 'hosting',
  description: 'AWS January invoice',
  amount: '12500.00',
  fromAccountId: 'uuid-chase-checking',
  transactionDate: new Date('2026-02-01'),
  reference: 'INV-2026-001',
  tags: ['infrastructure', 'recurring'],
});
```

**Parameters:** `RecordCashMovementInput`
**Returns:** `Promise<CashMovement>`
**Events:** `treasury.cash.movement.recorded`
**Errors:** `TREASURY_BANK_ACCOUNT_NOT_FOUND`, `TREASURY_INSUFFICIENT_BALANCE`, `TREASURY_DUPLICATE_MOVEMENT`

---

### `cashService.recordInterCompanyTransfer(input)`

Record an inter-company transfer between ventures. Creates mirror entries on both sides.

```typescript
const { sourceMovement, targetMovement } = await cashService.recordInterCompanyTransfer({
  sourceVentureId: 'uuid-betedge',
  targetVentureId: 'uuid-serpspace',
  sourceAccountId: 'uuid-betedge-chase',
  targetAccountId: 'uuid-serpspace-svb',
  amount: '50000.00',
  description: 'SEO services payment — January 2026',
  transactionDate: new Date('2026-02-05'),
});
```

**Parameters:** `InterCompanyTransferInput`
**Returns:** `Promise<{ sourceMovement: CashMovement; targetMovement: CashMovement }>`
**Events:** `treasury.cash.movement.recorded` (x2)

---

### `cashService.calculateBurnRate(ventureId?, lookbackDays?)`

Calculate burn rate from rolling historical outflows, excluding inter-company transfers.

```typescript
const burnRate = await cashService.calculateBurnRate('uuid-betedge', 30);

// Returns:
{
  dailyBurn: '1166.6667',
  weeklyBurn: '8166.6667',
  monthlyBurn: '35000.0000',
  lookbackDays: 30,
  totalOutflow: '35000.0000',
}
```

**Parameters:** `ventureId?: string` (null = consolidated), `lookbackDays?: number` (default: 30)
**Returns:** `Promise<BurnRateResult>`

---

### `cashService.calculateRunway(ventureId?)`

Calculate runway in days and months based on current cash and burn rate.

```typescript
const runway = await cashService.calculateRunway('uuid-betedge');

// Returns:
{
  currentCash: '700000.0000',
  monthlyBurn: '35000.0000',
  runwayMonths: 20,
  zeroDate: '2027-10-09T00:00:00Z',
  scenarios: [
    { name: 'base', burnMultiplier: 1.0, runwayMonths: 20, zeroDate: '2027-10-09' },
    { name: 'optimistic', burnMultiplier: 0.8, runwayMonths: 25, zeroDate: '2028-03-09' },
    { name: 'pessimistic', burnMultiplier: 1.3, runwayMonths: 15, zeroDate: '2027-05-09' },
  ],
}
```

**Parameters:** `ventureId?: string` (null = consolidated)
**Returns:** `Promise<RunwayResult>`

---

### `cashService.snapshotDailyPositions()`

Snapshot all bank account balances and calculate consolidated positions. Cron: daily 23:59 UTC.

```typescript
const snapshots = await cashService.snapshotDailyPositions();
// Returns array of CashPositionSnapshot for every active account
```

**Returns:** `Promise<CashPositionSnapshot[]>`
**Events:** `treasury.cash.position.snapshot`

---

### `cashService.syncAllBalances()`

Sync bank balances from Plaid and other providers. Cron: every 6 hours.

```typescript
const result = await cashService.syncAllBalances();
// Returns: { synced: 15, failed: 0, errors: [] }
```

**Returns:** `Promise<SyncResult>`

---

### `cashService.getMovements(filters)`

Query cash movements with pagination and filtering.

```typescript
const movements = await cashService.getMovements({
  ventureId: 'uuid-betedge',
  startDate: new Date('2026-01-01'),
  endDate: new Date('2026-01-31'),
  category: 'vendor',
  movementType: 'outflow',
  page: 1,
  pageSize: 50,
});

// Returns: PaginatedResult<CashMovement>
```

**Parameters:** `CashMovementFilters`
**Returns:** `Promise<PaginatedResult<CashMovement>>`

---

## Cash Forecast Service Methods

### `cashForecastService.generateForecast(input)`

Generate a cash forecast using the specified method.

```typescript
const forecast = await cashForecastService.generateForecast({
  ventureId: null,  // consolidated
  forecastHorizonDays: 90,
  method: 'ml_ensemble',
  assumptions: {
    revenueGrowth: 0.05,
    burnRateChange: 0.02,
    oneTimeItems: [
      { date: '2026-03-15', amount: '-100000', description: 'Annual insurance' }
    ],
  },
});
```

**Parameters:** `CashForecastInput`
**Returns:** `Promise<CashForecast>`
**Events:** `treasury.cash.forecast.generated`

---

### `cashForecastService.getForecastVsActual(forecastId)`

Compare a forecast's projections against actual results.

```typescript
const comparison = await cashForecastService.getForecastVsActual('uuid-forecast');

// Returns forecast lines with actual amounts and variance
```

**Parameters:** `forecastId: string`
**Returns:** `Promise<ForecastComparison>`

---

### `cashForecastService.getLatestForecast(ventureId?)`

Get the most recent active forecast.

```typescript
const forecast = await cashForecastService.getLatestForecast('uuid-betedge');
```

**Parameters:** `ventureId?: string`
**Returns:** `Promise<CashForecast | null>`
**Cache:** 1-hour TTL

---

### `cashForecastService.backTestForecast(forecastId)`

Back-test a forecast model against historical data for accuracy measurement.

```typescript
const backTest = await cashForecastService.backTestForecast('uuid-forecast');
// Returns: { accuracy: 0.87, meanAbsoluteError: '5200.00', ... }
```

**Parameters:** `forecastId: string`
**Returns:** `Promise<BackTestResult>`

---

## Sweep Service Methods

### `sweepService.createSweepRule(input)`

Create an automated sweep rule between two accounts.

```typescript
const sweep = await sweepService.createSweepRule({
  ventureId: 'uuid-betedge',
  name: 'BetEdge Nightly Sweep',
  sourceAccountId: 'uuid-chase-checking',
  targetAccountId: 'uuid-chase-savings',
  direction: 'to_target',
  triggerType: 'balance_threshold',
  thresholdAmount: '100000',
  targetBalanceAmount: '50000',
  minimumSweepAmount: '5000',
  frequency: 'daily',
  executeTime: '23:00',
});
```

**Parameters:** `SweepRuleInput`
**Returns:** `Promise<SweepAccount>`

---

### `sweepService.executeAllDueSweeps()`

Execute all due sweep transfers. Cron: nightly at 23:00 UTC.

```typescript
const transactions = await sweepService.executeAllDueSweeps();
```

**Returns:** `Promise<SweepTransaction[]>`
**Events:** `treasury.cash.sweep.executed` (per sweep)

---

## Cash Pooling Service Methods

### `cashPoolingService.createPool(input)`

Create a cash pooling structure for inter-venture liquidity management.

```typescript
const pool = await cashPoolingService.createPool({
  name: 'MCV Global Cash Pool',
  poolType: 'notional',
  masterAccountId: 'uuid-master-account',
  currency: 'USD',
  interestAllocationMethod: 'pro_rata',
  interestRate: '0.042',
});
```

**Parameters:** `CashPoolInput`
**Returns:** `Promise<CashPool>`

---

### `cashPoolingService.calculateInterest(poolId, period)`

Calculate and allocate interest to pool participants.

```typescript
const allocations = await cashPoolingService.calculateInterest(
  'uuid-pool',
  '2026-01'
);
```

**Parameters:** `poolId: string`, `period: string`
**Returns:** `Promise<InterestAllocation[]>`

---

## Funding Service Methods

### `fundingService.createRound(input)`

Create a new funding round for a venture.

```typescript
const round = await fundingService.createRound({
  ventureId: 'uuid-betedge',
  roundName: 'BetEdge Series A',
  roundType: 'series_a',
  targetAmount: '5000000',
  minimumAmount: '3000000',
  preMoneyValuation: '15000000',
  pricePerShare: '5.00',
  shareClass: 'Series A Preferred',
  antiDilutionProvision: 'weighted_average_broad',
  liquidationPreference: '1.00',
  participatingPreferred: false,
  proRataRights: true,
});
```

**Parameters:** `CreateFundingRoundInput`
**Returns:** `Promise<FundingRoundV2>`
**Events:** `treasury.funding.round.created`

---

### `fundingService.openRound(roundId)`

Open a round for investor commitments. Changes status from `planning` to `active`.

```typescript
const round = await fundingService.openRound('uuid-round');
```

**Parameters:** `roundId: string`
**Returns:** `Promise<FundingRoundV2>`
**Events:** `treasury.funding.round.opened`
**Errors:** `TREASURY_ROUND_NOT_ACTIVE`

---

### `fundingService.recordCommitment(roundId, input)`

Record an investor commitment to a funding round.

```typescript
const commitment = await fundingService.recordCommitment('uuid-round', {
  investorId: 'uuid-sequoia',
  commitmentAmount: '3000000',
  instrumentType: 'equity',
  proRataRights: true,
  boardSeat: true,
  informationRights: true,
});
```

**Parameters:** `roundId: string`, `InvestorCommitmentInput`
**Returns:** `Promise<FundingRoundInvestor>`
**Events:** `treasury.funding.commitment.recorded`
**Errors:** `TREASURY_ROUND_NOT_ACTIVE`, `TREASURY_ROUND_OVERSUBSCRIBED`, `TREASURY_INVESTOR_KYC_REQUIRED`

---

### `fundingService.closeRound(roundId, closingDate?)`

Close a funding round. Triggers cap table updates, SAFE/note conversions, and share issuances.

```typescript
const closed = await fundingService.closeRound('uuid-round');
```

**Parameters:** `roundId: string`, `closingDate?: Date`
**Returns:** `Promise<FundingRoundV2>`
**Events:** `treasury.funding.round.closed`
**Requires:** Dual approval

---

### `fundingService.createSAFE(input)`

Create a SAFE agreement.

```typescript
const safe = await fundingService.createSAFE({
  ventureId: 'uuid-betedge',
  investorId: 'uuid-angel-investor',
  safeType: 'post_money',
  investmentAmount: '500000',
  valuationCap: '10000000',
  discountRate: '0.20',
  proRataRights: true,
  issuedAt: new Date('2026-01-15'),
});
```

**Parameters:** `CreateSAFEInput`
**Returns:** `Promise<SAFEAgreement>`

---

### `fundingService.convertSAFE(safeId, roundId, conversionPrice)`

Convert a SAFE to equity shares during a priced round. Uses the lower of cap price or discount price.

```typescript
const { safe, shares } = await fundingService.convertSAFE(
  'uuid-safe',
  'uuid-series-a-round',
  '5.00' // Series A price per share
);

// SAFE conversion example:
// Investment: $500,000, Cap: $10M, Discount: 20%
// Cap price: $10M / 2M shares = $5.00
// Discount price: $5.00 × 0.80 = $4.00
// Effective price: min($5.00, $4.00) = $4.00
// Shares: $500,000 / $4.00 = 125,000 shares
```

**Parameters:** `safeId: string`, `roundId: string`, `conversionPrice: string`
**Returns:** `Promise<{ safe: SAFEAgreement; shares: ShareIssuance }>`
**Events:** `treasury.funding.safe.converted`
**Errors:** `TREASURY_SAFE_ALREADY_CONVERTED`

---

### `fundingService.createConvertibleNote(input)`

Create a convertible note instrument.

```typescript
const note = await fundingService.createConvertibleNote({
  ventureId: 'uuid-betedge',
  investorId: 'uuid-angel',
  principalAmount: '250000',
  interestRate: '0.06',
  compoundingFrequency: 'simple',
  valuationCap: '12000000',
  discountRate: '0.20',
  maturityDate: new Date('2028-01-15'),
  qualifiedFinancingThreshold: '1000000',
  autoConvertAtMaturity: true,
  issuedAt: new Date('2026-01-15'),
});
```

**Parameters:** `CreateConvertibleNoteInput`
**Returns:** `Promise<ConvertibleNote>`

---

### `fundingService.convertNote(noteId, roundId, conversionPrice)`

Convert a convertible note to equity. Principal + accrued interest converts at the effective price.

```typescript
const { note, shares } = await fundingService.convertNote(
  'uuid-note',
  'uuid-series-a-round',
  '4.50'
);
```

**Parameters:** `noteId: string`, `roundId: string`, `conversionPrice: string`
**Returns:** `Promise<{ note: ConvertibleNote; shares: ShareIssuance }>`
**Events:** `treasury.funding.note.converted`
**Errors:** `TREASURY_NOTE_MATURED`

---

## Cap Table Service Methods

### `capTableService.getCapTable(ventureId)`

Get the current cap table with ownership percentages.

```typescript
const capTable = await capTableService.getCapTable('uuid-betedge');

// Returns:
{
  ventureId: 'uuid-betedge',
  asOfDate: '2026-02-09T00:00:00Z',
  totalSharesOutstanding: '3000000',
  totalSharesFullyDiluted: '3500000',
  optionPoolShares: '300000',
  optionPoolPercent: '8.571429',
  entries: [
    { holderName: 'Founder A', holderType: 'founder', shareClassName: 'Common', sharesOwned: '1200000', ownershipPercent: '40.000000', fullyDilutedPercent: '34.285714' },
    { holderName: 'Sequoia', holderType: 'investor', shareClassName: 'Series A Preferred', sharesOwned: '600000', ownershipPercent: '20.000000', fullyDilutedPercent: '17.142857' },
    // ...
  ],
  shareClasses: [
    { className: 'Common', issuedShares: '2000000', authorizedShares: '5000000' },
    { className: 'Series A Preferred', issuedShares: '600000', authorizedShares: '1000000' },
  ],
}
```

**Parameters:** `ventureId: string`
**Returns:** `Promise<CapTableView>`
**Cache:** 10-minute TTL

---

### `capTableService.modelDilution(ventureId, input)`

Model dilution from a hypothetical new round.

```typescript
const dilution = await capTableService.modelDilution('uuid-betedge', {
  newShares: '1000000',
  pricePerShare: '5.00',
  optionPoolIncrease: '200000',
  safeConversions: [
    { safeId: 'uuid-safe-1', conversionPrice: '4.00' },
  ],
  noteConversions: [
    { noteId: 'uuid-note-1', conversionPrice: '3.50', accruedInterest: '15000' },
  ],
});

// Returns pre/post ownership tables with dilution percentages
```

**Parameters:** `ventureId: string`, `DilutionModelInput`
**Returns:** `Promise<DilutionResult>`

---

### `capTableService.snapshotCapTable(ventureId, input)`

Take a point-in-time cap table snapshot.

```typescript
const snapshot = await capTableService.snapshotCapTable('uuid-betedge', {
  snapshotName: 'Pre-Series A',
  triggerEvent: 'manual',
});
```

**Parameters:** `ventureId: string`, `CapTableSnapshotInput`
**Returns:** `Promise<CapTableSnapshot>`

---

### `capTableService.issueShares(input)`

Issue new shares to a recipient.

```typescript
const issuance = await capTableService.issueShares({
  ventureId: 'uuid-betedge',
  shareClassId: 'uuid-series-a-preferred',
  roundId: 'uuid-round',
  recipientName: 'Sequoia Capital',
  recipientType: 'investor',
  sharesIssued: '600000',
  pricePerShare: '5.00',
  totalConsideration: '3000000',
  issuanceType: 'purchase',
  boardApprovalDate: new Date('2026-02-01'),
  issuedAt: new Date('2026-02-05'),
});
```

**Parameters:** `ShareIssuanceInput`
**Returns:** `Promise<ShareIssuance>`

---

### `capTableService.createVestingSchedule(input)`

Create a vesting schedule for shares.

```typescript
const schedule = await capTableService.createVestingSchedule({
  ventureId: 'uuid-betedge',
  name: 'Standard 4-Year Vesting — Employee A',
  vestingType: 'time_based',
  totalShares: '100000',
  vestingStartDate: new Date('2026-01-01'),
  cliffMonths: 12,
  cliffPercent: '0.25',
  totalVestingMonths: 48,
  vestingFrequency: 'monthly',
  accelerationOnDoubleTrigger: true,
  accelerationPercent: '1.0',
});
```

**Parameters:** `VestingScheduleInput`
**Returns:** `Promise<VestingSchedule>`

---

## Investor Service Methods

### `investorService.registerInvestor(input)`

Register a new investor in the system.

```typescript
const investor = await investorService.registerInvestor({
  name: 'Sequoia Capital',
  type: 'institutional',
  contactName: 'Partner Name',
  contactEmail: 'partner@sequoia.com',
  entityName: 'Sequoia Capital Operations LLC',
  entityType: 'LLC',
  accreditedStatus: 'qualified_purchaser',
});
```

**Parameters:** `InvestorInput`
**Returns:** `Promise<Investor>`

---

### `investorService.generateReport(input)`

Generate an investor reporting package.

```typescript
const report = await investorService.generateReport({
  ventureId: 'uuid-betedge',
  reportPeriod: '2026-Q1',
  reportType: 'quarterly',
  title: 'BetEdge Q1 2026 Investor Update',
});
```

**Parameters:** `InvestorReportInput`
**Returns:** `Promise<InvestorReport>`

---

### `investorService.sendReport(reportId)`

Distribute an investor report to all relevant investors.

```typescript
const report = await investorService.sendReport('uuid-report');
```

**Parameters:** `reportId: string`
**Returns:** `Promise<InvestorReport>`
**Events:** `treasury.funding.report.sent`

---

## Waterfall Service Methods

### `waterfallService.calculateWaterfall(ventureId, input)`

Calculate distribution waterfall for an exit scenario.

```typescript
const waterfall = await waterfallService.calculateWaterfall('uuid-betedge', {
  exitValuation: '50000000',
  exitType: 'acquisition',
  transactionCosts: '2000000',
  escrowHoldback: '3000000',
});

// Returns:
{
  exitValuation: '50000000.0000',
  distributableProceeds: '45000000.0000',
  tiers: [
    {
      tierName: 'Liquidation Preference — Series A',
      shareClass: 'Series A Preferred',
      amount: '5000000.0000',
      recipients: [
        { name: 'Sequoia', amount: '3000000.0000', percent: '60.00' },
        { name: 'Angel Fund', amount: '2000000.0000', percent: '40.00' },
      ],
    },
    {
      tierName: 'Participation Cap',
      shareClass: 'Series A Preferred',
      amount: '10000000.0000',
      recipients: [/* ... */],
    },
    {
      tierName: 'Remaining to Common',
      shareClass: 'Common',
      amount: '30000000.0000',
      recipients: [
        { name: 'Founder A', amount: '18000000.0000', percent: '60.00' },
        { name: 'Employees', amount: '4500000.0000', percent: '15.00' },
        { name: 'Seed Investors', amount: '7500000.0000', percent: '25.00' },
      ],
    },
  ],
  summaryByHolder: {
    'Sequoia': { total: '8000000.0000', multiple: '2.67', percentOfProceeds: '17.78' },
    'Founder A': { total: '18000000.0000', multiple: 'N/A', percentOfProceeds: '40.00' },
  },
}
```

**Parameters:** `ventureId: string`, `DistributionWaterfallInput`
**Returns:** `Promise<WaterfallResult>`

---

### `waterfallService.compareExitScenarios(ventureId, valuations)`

Compare waterfall results across multiple exit valuations.

```typescript
const comparison = await waterfallService.compareExitScenarios(
  'uuid-betedge',
  ['25000000', '50000000', '100000000']
);
```

**Parameters:** `ventureId: string`, `valuations: string[]`
**Returns:** `Promise<WaterfallComparison>`

---

## P&L Service Methods

### `pnlService.runConsolidation(input)`

Run P&L consolidation for a period across all ventures.

```typescript
const result = await pnlService.runConsolidation({
  period: '2026-01',
  periodType: 'monthly',
  consolidationMethod: 'full',
});

// Returns:
{
  period: '2026-01',
  totalRevenue: '730000.0000',
  totalRevenuePreElimination: '800000.0000',
  revenueEliminations: '70000.0000',
  grossProfit: '450000.0000',
  grossMargin: '61.6438',
  totalExpenses: '530000.0000',
  totalExpensesPreElimination: '600000.0000',
  expenseEliminations: '70000.0000',
  operatingIncome: '200000.0000',
  ebitda: '225000.0000',
  netIncome: '168000.0000',
  netMargin: '23.0137',
  ventureCount: 9,
}
```

**Parameters:** `ConsolidatedPnlInput`
**Returns:** `Promise<ConsolidatedPnlResult>`
**Events:** `treasury.pnl.consolidation.completed`
**Errors:** `TREASURY_CONSOLIDATION_IN_PROGRESS`

---

### `pnlService.getConsolidatedPnl(period)`

Retrieve a stored consolidated P&L for a period.

```typescript
const pnl = await pnlService.getConsolidatedPnl('2026-01');
```

**Parameters:** `period: string`
**Returns:** `Promise<ConsolidatedPnl>`

---

### `pnlService.restatePnl(pnlId, adjustments, reason)`

Restate a previously closed P&L period. Preserves original for audit trail.

```typescript
const restated = await pnlService.restatePnl(
  'uuid-pnl',
  [
    { category: 'SaaS Revenue', adjustment: '15000', reason: 'Deferred revenue correction' },
  ],
  'Revenue recognition adjustment per auditor review'
);
```

**Parameters:** `pnlId: string`, `adjustments: PnlAdjustment[]`, `reason: string`
**Returns:** `Promise<ConsolidatedPnl>`
**Requires:** Dual approval

---

## Elimination Service Methods

### `eliminationService.matchAndEliminate(period)`

Auto-match inter-company transactions and create elimination entries.

```typescript
const entries = await eliminationService.matchAndEliminate('2026-01');
// Returns array of elimination entries created
```

**Parameters:** `period: string`
**Returns:** `Promise<EliminationEntry[]>`

---

### `eliminationService.createRule(input)`

Create a new elimination rule.

```typescript
const rule = await eliminationService.createRule({
  name: 'SerpSpace→BetEdge SEO Revenue',
  eliminationType: 'revenue',
  sourceVentureId: 'uuid-serpspace',
  targetVentureId: 'uuid-betedge',
  matchingStrategy: 'exact',
  autoApply: true,
  priority: 10,
});
```

**Parameters:** `EliminationRuleInput`
**Returns:** `Promise<EliminationRule>`

---

### `eliminationService.getUnmatchedTransactions(period)`

Get IC transactions that couldn't be matched automatically.

```typescript
const unmatched = await eliminationService.getUnmatchedTransactions('2026-01');
```

**Parameters:** `period: string`
**Returns:** `Promise<InterCompanyTransaction[]>`

---

### `eliminationService.recordInterCompanyTransaction(input)`

Record an inter-company transaction for elimination tracking.

```typescript
const transaction = await eliminationService.recordInterCompanyTransaction({
  sourceVentureId: 'uuid-serpspace',
  targetVentureId: 'uuid-betedge',
  transactionType: 'revenue',
  description: 'SEO services — January 2026',
  amount: '50000',
  transactionDate: new Date('2026-01-31'),
  period: '2026-01',
  contractReference: 'IC-AGR-2025-003',
});
```

**Parameters:** `InterCompanyTransactionInput`
**Returns:** `Promise<InterCompanyTransaction>`

---

## Variance Service Methods

### `varianceService.runBudgetVsActual(input)`

Run budget vs actual variance analysis.

```typescript
const report = await varianceService.runBudgetVsActual({
  period: '2026-01',
  ventureId: null, // consolidated
  materialityThreshold: '5000',
  generateNarrative: true,
});
```

**Parameters:** `BudgetVsActualInput`
**Returns:** `Promise<VarianceReport>`
**Events:** `treasury.pnl.variance.material` (if material variances found)

---

### `varianceService.getMaterialVariances(period, threshold?)`

Get all material variances for a period.

```typescript
const material = await varianceService.getMaterialVariances('2026-01', 10000);
```

**Parameters:** `period: string`, `threshold?: number`
**Returns:** `Promise<VarianceLine[]>`

---

### `varianceService.generateNarrative(reportId)`

Generate AI-powered variance explanation narrative.

```typescript
const narrative = await varianceService.generateNarrative('uuid-report');
// Returns: string with professional CFO-style explanation
```

**Parameters:** `reportId: string`
**Returns:** `Promise<string>`

---

## Segment Reporting Service Methods

### `segmentReportingService.getSegmentResults(filters)`

Get financial results broken down by venture segment.

```typescript
const segments = await segmentReportingService.getSegmentResults({
  period: '2026-01',
  periodType: 'monthly',
});
```

**Parameters:** `SegmentReportInput`
**Returns:** `Promise<SegmentResult[]>`

---

### `segmentReportingService.getSegmentComparison(period)`

Compare segment performance side-by-side.

```typescript
const comparison = await segmentReportingService.getSegmentComparison('2026-01');
```

**Parameters:** `period: string`
**Returns:** `Promise<SegmentComparison>`

---

## Board Report Service Methods

### `boardReportService.createBoardPackage(input)`

Create a board-ready financial package.

```typescript
const pkg = await boardReportService.createBoardPackage({
  period: '2026-Q1',
  meetingDate: new Date('2026-04-15'),
  sections: [
    'executive_summary',
    'consolidated_pnl',
    'segment_breakdown',
    'cash_position',
    'runway_projection',
    'kpi_dashboard',
    'funding_status',
    'tax_status',
  ],
});
```

**Parameters:** `BoardPackageInput`
**Returns:** `Promise<BoardPackage>`

---

### `boardReportService.generatePDF(packageId)`

Generate a PDF document from the board package.

```typescript
const pdfUrl = await boardReportService.generatePDF('uuid-package');
// Returns: 'https://storage.supabase.co/treasury/board-packages/2026-Q1.pdf'
```

**Parameters:** `packageId: string`
**Returns:** `Promise<string>` (PDF URL)

---

### `boardReportService.approveBoardPackage(packageId, approvedBy)`

Approve a board package for distribution.

```typescript
const pkg = await boardReportService.approveBoardPackage('uuid-package', 'uuid-cfo');
```

**Parameters:** `packageId: string`, `approvedBy: string`
**Returns:** `Promise<BoardPackage>`
**Events:** `treasury.pnl.board_package.approved`

---

## Tax Service Methods

### `taxService.registerEntity(input)`

Register a tax entity for a venture.

```typescript
const entity = await taxService.registerEntity({
  ventureId: 'uuid-betedge',
  entityName: 'BetEdge Inc.',
  entityType: 'c_corp',
  ein: '12-3456789',          // Encrypted at rest
  incorporationState: 'DE',
  fiscalYearEnd: '12-31',
  taxClassification: 'C-corp',
});
```

**Parameters:** `CreateTaxEntityInput`
**Returns:** `Promise<TaxEntity>`

---

### `taxService.scheduleEstimatedPayment(input)`

Schedule an estimated tax payment.

```typescript
const payment = await taxService.scheduleEstimatedPayment({
  taxEntityId: 'uuid-entity',
  jurisdictionId: 'uuid-us-fed',
  taxYear: 2026,
  quarter: 1,
  estimatedAmount: '125000',
  dueDate: new Date('2026-04-15'),
});
```

**Parameters:** `EstimatedPaymentInput`
**Returns:** `Promise<EstimatedTaxPayment>`

---

### `taxService.recordPayment(paymentId, paidAmount, confirmationNumber)`

Record that an estimated payment has been made.

```typescript
const payment = await taxService.recordPayment(
  'uuid-payment',
  '125000',
  'EFTPS-2026-041500123'
);
```

**Parameters:** `paymentId: string`, `paidAmount: string`, `confirmationNumber: string`
**Returns:** `Promise<EstimatedTaxPayment>`
**Events:** `treasury.tax.payment.recorded`
**Requires:** Dual approval

---

### `taxService.getOverduePayments()`

Get all overdue estimated tax payments.

```typescript
const overdue = await taxService.getOverduePayments();
```

**Returns:** `Promise<EstimatedTaxPayment[]>`

---

### `taxService.calculateSafeHarborAmount(entityId, jurisdictionId, taxYear)`

Calculate the safe harbor amount to avoid underpayment penalties.

```typescript
const safeHarbor = await taxService.calculateSafeHarborAmount(
  'uuid-entity',
  'uuid-us-fed',
  2026
);

// Returns: { amount: '130000', method: '110% prior year', priorYearTax: '118000' }
```

**Parameters:** `entityId: string`, `jurisdictionId: string`, `taxYear: number`
**Returns:** `Promise<SafeHarborResult>`

---

### `taxService.createTaxReturn(input)`

Create a tax return record for tracking.

```typescript
const taxReturn = await taxService.createTaxReturn({
  taxEntityId: 'uuid-entity',
  jurisdictionId: 'uuid-us-fed',
  taxYear: 2025,
  returnType: 'original',
  formNumber: '1120',
  filingDeadline: new Date('2026-04-15'),
});
```

**Parameters:** `TaxReturnInput`
**Returns:** `Promise<TaxReturn>`

---

### `taxService.fileReturn(returnId, filingUrl, confirmationNumber)`

Record that a tax return has been filed.

```typescript
const filed = await taxService.fileReturn(
  'uuid-return',
  'https://storage.supabase.co/treasury/tax-returns/betedge-2025-1120.pdf',
  'IRS-EFILE-2026-00123'
);
```

**Parameters:** `returnId: string`, `filingUrl: string`, `confirmationNumber: string`
**Returns:** `Promise<TaxReturn>`
**Events:** `treasury.tax.return.filed`
**Requires:** Dual approval

---

## Tax Calendar Service Methods

### `taxCalendarService.generateAnnualCalendar(taxYear)`

Auto-generate all tax deadlines for a year.

```typescript
const events = await taxCalendarService.generateAnnualCalendar(2026);
// Generates 50+ events for all entity-jurisdiction combinations
```

**Parameters:** `taxYear: number`
**Returns:** `Promise<TaxCalendarEvent[]>`

---

### `taxCalendarService.getUpcoming(daysAhead?)`

Get upcoming tax deadlines.

```typescript
const upcoming = await taxCalendarService.getUpcoming(30);
```

**Parameters:** `daysAhead?: number` (default: 30)
**Returns:** `Promise<TaxCalendarEvent[]>`

---

### `taxCalendarService.getOverdue()`

Get all overdue tax events.

```typescript
const overdue = await taxCalendarService.getOverdue();
```

**Returns:** `Promise<TaxCalendarEvent[]>`

---

### `taxCalendarService.sendReminders()`

Send reminders for upcoming deadlines (14-day lookahead). Cron: daily 08:00 UTC.

```typescript
await taxCalendarService.sendReminders();
```

**Returns:** `Promise<void>`
**Events:** `treasury.tax.deadline.approaching`

---

## Transfer Pricing Service Methods

### `transferPricingService.createStudy(input)`

Create a transfer pricing study for inter-company transactions.

```typescript
const study = await transferPricingService.createStudy({
  name: '2026 SerpSpace→BetEdge SEO Services TP Study',
  taxYear: 2026,
  sourceEntityId: 'uuid-serpspace-entity',
  targetEntityId: 'uuid-betedge-entity',
  transactionType: 'services',
  method: 'cost_plus',
  description: 'SEO and digital marketing services provided by SerpSpace to BetEdge',
});
```

**Parameters:** `TransferPricingStudyInput`
**Returns:** `Promise<TransferPricingStudy>`

---

### `transferPricingService.calculateArmLengthRange(studyId)`

Calculate the arm's length range from benchmark data.

```typescript
const range = await transferPricingService.calculateArmLengthRange('uuid-study');

// Returns:
{
  low: '3.5%',
  median: '5.2%',
  high: '7.1%',
  interquartileRange: { q1: '4.0%', q3: '6.5%' },
  benchmarkCount: 15,
}
```

**Parameters:** `studyId: string`
**Returns:** `Promise<ArmLengthRange>`

---

### `transferPricingService.validateCompliance(studyId)`

Validate that inter-company transactions fall within the arm's length range.

```typescript
const compliance = await transferPricingService.validateCompliance('uuid-study');

// Returns:
{
  isCompliant: true,
  transactionCount: 12,
  outOfRangeCount: 0,
  appliedRate: '5.0%',
  armLengthRange: { low: '3.5%', high: '7.1%' },
  flaggedTransactions: [],
}
```

**Parameters:** `studyId: string`
**Returns:** `Promise<ComplianceResult>`
**Events:** `treasury.tax.tp.out_of_range` (if non-compliant)

---

## Tax Credit Service Methods

### `taxCreditService.createRDCredit(entityId, taxYear, input)`

Create an R&D tax credit record for a tax entity.

```typescript
const credit = await taxCreditService.createRDCredit(
  'uuid-betedge-entity',
  2026,
  {
    jurisdictionId: 'uuid-us-fed',
    creditType: 'federal_rd',
    method: 'alternative_simplified',
  }
);
```

**Parameters:** `entityId: string`, `taxYear: number`, `RDCreditInput`
**Returns:** `Promise<RDCredit>`

---

### `taxCreditService.addQualifyingActivity(creditId, activity)`

Add a qualifying R&D activity to a credit record.

```typescript
const activity = await taxCreditService.addQualifyingActivity('uuid-credit', {
  ventureId: 'uuid-betedge',
  activityName: 'AI Model Training Pipeline',
  activityDescription: 'Development of novel ML models for sports prediction',
  qualificationBasis: 'Technological uncertainty in model accuracy; systematic experimentation with architectures',
  employeeCount: 5,
  wages: '450000',
  supplies: '25000',
  contractResearch: '50000',
  period: '2026-Q1',
});
```

**Parameters:** `creditId: string`, `RDActivityInput`
**Returns:** `Promise<RDCreditActivity>`

---

### `taxCreditService.calculateCredit(creditId)`

Calculate the R&D tax credit amount based on qualifying activities.

```typescript
const calculation = await taxCreditService.calculateCredit('uuid-credit');

// Returns:
{
  qualifiedResearchExpenses: '525000.0000',
  baseAmount: '262500.0000',
  creditRate: '0.14',
  creditAmount: '36750.0000',
  method: 'alternative_simplified',
}
```

**Parameters:** `creditId: string`
**Returns:** `Promise<RDCreditCalculation>`

---

## Tax Provision Service Methods

### `taxProvisionService.generateProvision(input)`

Generate an ASC 740 tax provision with rate reconciliation.

```typescript
const provision = await taxProvisionService.generateProvision({
  period: '2026-Q1',
  periodType: 'quarterly',
  preTaxBookIncome: '500000',
  permanentDifferences: '15000',
  temporaryDifferences: '30000',
});

// Returns:
{
  period: '2026-Q1',
  preTaxBookIncome: '500000.0000',
  taxableIncome: '545000.0000',
  currentTaxExpense: '114450.0000',
  deferredTaxExpense: '6300.0000',
  totalTaxProvision: '120750.0000',
  effectiveTaxRate: '0.241500',
  statutoryRate: '0.210000',
  rateReconciliation: [
    { item: 'Statutory federal rate', rate: '21.00%', amount: '105000.0000' },
    { item: 'State taxes, net of federal benefit', rate: '4.20%', amount: '21000.0000' },
    { item: 'R&D tax credits', rate: '-1.50%', amount: '-7500.0000' },
    { item: 'Permanent differences', rate: '0.63%', amount: '3150.0000' },
    { item: 'Effective tax rate', rate: '24.15%', amount: '120750.0000' },
  ],
}
```

**Parameters:** `TaxProvisionInput`
**Returns:** `Promise<TaxProvisionResult>`
**Events:** `treasury.tax.provision.generated`

---

### `taxProvisionService.calculateEffectiveTaxRate(period)`

Calculate the effective tax rate with trend analysis.

```typescript
const etr = await taxProvisionService.calculateEffectiveTaxRate('2026-Q1');
```

**Parameters:** `period: string`
**Returns:** `Promise<EffectiveTaxRate>`

---

### `taxProvisionService.approveProvision(provisionId, reviewedBy)`

Approve a tax provision, locking it from further changes.

```typescript
const provision = await taxProvisionService.approveProvision('uuid-provision', 'uuid-cfo');
```

**Parameters:** `provisionId: string`, `reviewedBy: string`
**Returns:** `Promise<TaxProvision>`
**Errors:** `TREASURY_PROVISION_LOCKED` (if already approved)

---

## Type Definitions

### Complete Type Index

```typescript
// Cash Types
export type {
  BankAccountType, CashMovementType, SweepDirection, WireStatus, ACHStatus,
  CashPositionSnapshot, ConsolidatedCashPosition, VentureCashPosition,
  VentureCashBreakdown, CurrencyBreakdown, CashForecastResult,
  RunwayProjection, RunwayScenario, BurnRateResult, LiquidityRatio,
  CashConcentration, FXRate, FXPosition, DailyProjection,
  SyncResult, CategoryBreakdown, SweepRule, CashPoolStructure,
} from '@mcv/treasury';

// Funding Types
export type {
  RoundType, RoundStatus, InstrumentType, SAFEType, SAFEVariant,
  VestingType, ConvertibleNoteTerms, CapTableEntry, CapTableView,
  CapTableSnapshot, ShareClass, ShareClassSummary, DilutionScenario,
  DilutionResult, SAFEConversionDetail, NoteConversionDetail,
  WaterfallTier, WaterfallResult, WaterfallRecipient,
  VestingSchedule, InvestorProfile, InvestorReport,
  FundingRoundSummary, OwnershipTable,
} from '@mcv/treasury';

// P&L Types
export type {
  ConsolidationMethod, EliminationType, VarianceType, VarianceDirection,
  ReportFrequency, SegmentDefinition, SegmentResult, SegmentComparison,
  ConsolidatedPnlResult, EliminationEntry, EliminationSummary,
  InterCompanyBalance, ManagementReportData, BoardPackageData,
  BoardPackageSection, BudgetVariance, ForecastAccuracy,
  KPIDashboard, VarianceLine, VarianceReport,
} from '@mcv/treasury';

// Tax Types
export type {
  TaxEntityType, TaxType, FilingStatus, TransferPricingMethod,
  TaxCreditType, TaxJurisdiction, EstimatedPayment,
  TaxCalendarEvent, TaxProvisionResult, TaxProvisionComponent,
  DeferredTaxItem, EffectiveTaxRate, RateReconciliationItem,
  TaxReconciliation, TransferPricingStudy, ArmLengthRange,
  ComplianceResult, RDCreditCalculation, SafeHarborResult,
  WithholdingTaxRecord, TaxReturnPackage,
} from '@mcv/treasury';
```

---

## Zod Schemas

### Cash Schemas

```typescript
import { z } from 'zod';

export const createBankAccountSchema = z.object({
  ventureId: z.string().uuid(),
  entityId: z.string().uuid().optional(),
  accountName: z.string().min(1).max(255),
  accountType: z.enum(['checking', 'savings', 'money_market', 'sweep', 'crypto_wallet']),
  bankName: z.string().min(1).max(255),
  currency: z.string().length(3).default('USD'),
  isPrimary: z.boolean().default(false),
  isReserve: z.boolean().default(false),
  targetBalance: z.string().regex(/^\d+\.?\d{0,4}$/).optional(),
  minimumBalance: z.string().regex(/^\d+\.?\d{0,4}$/).optional(),
  plaidAccountId: z.string().optional(),
  plaidItemId: z.string().optional(),
});

export const recordCashMovementSchema = z.object({
  ventureId: z.string().uuid(),
  movementType: z.enum(['inflow', 'outflow', 'transfer', 'sweep', 'fx_conversion']),
  category: z.string().min(1).max(100),
  subcategory: z.string().max(100).optional(),
  description: z.string().min(1).max(500),
  amount: z.string().regex(/^\d+\.?\d{0,4}$/),
  currency: z.string().length(3).default('USD'),
  fromAccountId: z.string().uuid().optional(),
  toAccountId: z.string().uuid().optional(),
  transactionDate: z.coerce.date(),
  reference: z.string().max(255).optional(),
  isInterCompany: z.boolean().default(false),
  counterpartyVentureId: z.string().uuid().optional(),
  tags: z.array(z.string()).optional(),
});

export const cashForecastInputSchema = z.object({
  ventureId: z.string().uuid().nullable(),
  forecastHorizonDays: z.number().int().min(7).max(365),
  method: z.enum(['linear', 'seasonal', 'ml_ensemble', 'scenario']),
  assumptions: z.object({
    revenueGrowth: z.number().min(-1).max(10).optional(),
    burnRateChange: z.number().min(-1).max(10).optional(),
    oneTimeItems: z.array(z.object({
      date: z.string(),
      amount: z.string(),
      description: z.string(),
    })).optional(),
    excludeCategories: z.array(z.string()).optional(),
  }).optional(),
});
```

### Funding Schemas

```typescript
export const createFundingRoundSchema = z.object({
  ventureId: z.string().uuid(),
  roundName: z.string().min(1).max(255),
  roundType: z.enum(['pre_seed', 'seed', 'series_a', 'series_b', 'series_c', 'bridge', 'ipo']),
  targetAmount: z.string().regex(/^\d+\.?\d{0,4}$/),
  minimumAmount: z.string().regex(/^\d+\.?\d{0,4}$/).optional(),
  preMoneyValuation: z.string().regex(/^\d+\.?\d{0,4}$/).optional(),
  pricePerShare: z.string().regex(/^\d+\.?\d{0,8}$/).optional(),
  shareClass: z.string().optional(),
  leadInvestor: z.string().optional(),
  antiDilutionProvision: z.enum(['none', 'full_ratchet', 'weighted_average_broad', 'weighted_average_narrow']).optional(),
  liquidationPreference: z.string().regex(/^\d+\.?\d{0,2}$/).default('1.00'),
  participatingPreferred: z.boolean().default(false),
  proRataRights: z.boolean().default(true),
});

export const createSAFESchema = z.object({
  ventureId: z.string().uuid(),
  investorId: z.string().uuid(),
  roundId: z.string().uuid().optional(),
  safeType: z.enum(['post_money', 'pre_money', 'mfn', 'pro_rata']),
  investmentAmount: z.string().regex(/^\d+\.?\d{0,4}$/),
  valuationCap: z.string().regex(/^\d+\.?\d{0,4}$/).optional(),
  discountRate: z.string().regex(/^\d+\.?\d{0,4}$/).optional(),
  mfnProvision: z.boolean().default(false),
  proRataRights: z.boolean().default(false),
  issuedAt: z.coerce.date(),
});

export const dilutionModelInputSchema = z.object({
  newShares: z.string().regex(/^\d+$/),
  pricePerShare: z.string().regex(/^\d+\.?\d{0,8}$/),
  optionPoolIncrease: z.string().regex(/^\d+$/).optional(),
  safeConversions: z.array(z.object({
    safeId: z.string().uuid(),
    conversionPrice: z.string().regex(/^\d+\.?\d{0,8}$/),
  })).optional(),
  noteConversions: z.array(z.object({
    noteId: z.string().uuid(),
    conversionPrice: z.string().regex(/^\d+\.?\d{0,8}$/),
    accruedInterest: z.string().regex(/^\d+\.?\d{0,4}$/),
  })).optional(),
});
```

### Tax Schemas

```typescript
export const createTaxEntitySchema = z.object({
  ventureId: z.string().uuid(),
  entityName: z.string().min(1).max(255),
  entityType: z.enum(['c_corp', 's_corp', 'llc', 'partnership', 'sole_prop', 'foreign']),
  ein: z.string().regex(/^\d{2}-?\d{7}$/).optional(),
  incorporationState: z.string().length(2).optional(),
  fiscalYearEnd: z.string().regex(/^\d{2}-\d{2}$/).default('12-31'),
  taxClassification: z.string().optional(),
  parentEntityId: z.string().uuid().optional(),
});

export const taxProvisionInputSchema = z.object({
  period: z.string().regex(/^\d{4}(-Q[1-4]|-\d{2})?$/),
  periodType: z.enum(['quarterly', 'annual']),
  preTaxBookIncome: z.string().regex(/^-?\d+\.?\d{0,4}$/),
  permanentDifferences: z.string().regex(/^-?\d+\.?\d{0,4}$/).optional(),
  temporaryDifferences: z.string().regex(/^-?\d+\.?\d{0,4}$/).optional(),
});

export const transferPricingStudySchema = z.object({
  name: z.string().min(1).max(255),
  taxYear: z.number().int().min(2020).max(2030),
  sourceEntityId: z.string().uuid(),
  targetEntityId: z.string().uuid(),
  transactionType: z.enum(['services', 'licensing', 'cost_sharing', 'financing', 'tangible_goods']),
  method: z.enum(['cup', 'resale_price', 'cost_plus', 'tnmm', 'profit_split']),
  description: z.string().optional(),
});
```

---

## Event Types

### Event Payloads

```typescript
// Cash Events
export interface CashMovementRecordedEvent {
  movementId: string;
  ventureId: string;
  type: CashMovementType;
  amount: string;
  currency: string;
  isInterCompany: boolean;
}

export interface CashPositionSnapshotEvent {
  snapshotDate: string;
  ventureCount: number;
  consolidatedBalance: string;
  runwayDays: number;
}

export interface CashBalanceLowEvent {
  accountId: string;
  ventureId: string;
  currentBalance: string;
  minimumBalance: string;
  deficit: string;
}

// Funding Events
export interface FundingRoundClosedEvent {
  roundId: string;
  ventureId: string;
  roundName: string;
  roundType: RoundType;
  raisedAmount: string;
  investorCount: number;
}

export interface SAFEConvertedEvent {
  safeId: string;
  roundId: string;
  investorId: string;
  sharesIssued: string;
  conversionPrice: string;
}

// P&L Events
export interface ConsolidationCompletedEvent {
  period: string;
  consolidatedPnlId: string;
  netIncome: string;
  eliminationsApplied: number;
}

export interface MaterialVarianceEvent {
  period: string;
  category: string;
  varianceAmount: string;
  variancePercent: string;
  direction: 'favorable' | 'unfavorable';
}

// Tax Events
export interface TaxDeadlineApproachingEvent {
  eventId: string;
  entityName: string;
  jurisdictionName: string;
  eventName: string;
  dueDate: string;
  daysUntilDue: number;
  priority: string;
}

export interface TaxProvisionGeneratedEvent {
  provisionId: string;
  period: string;
  effectiveTaxRate: string;
  totalProvision: string;
}
```

---

## Error Codes

| Code | HTTP | Description | Resolution |
|------|------|-------------|------------|
| `TREASURY_VENTURE_NOT_FOUND` | 404 | Venture not found in treasury context | Verify venture ID exists |
| `TREASURY_BANK_ACCOUNT_NOT_FOUND` | 404 | Bank account does not exist | Verify account ID |
| `TREASURY_INSUFFICIENT_BALANCE` | 400 | Insufficient balance for operation | Check account balance |
| `TREASURY_SWEEP_BELOW_MINIMUM` | 400 | Sweep amount below minimum threshold | Adjust threshold or wait |
| `TREASURY_DUPLICATE_MOVEMENT` | 409 | Duplicate cash movement detected | Check reference number |
| `TREASURY_FORECAST_OVERLAP` | 409 | Forecast period overlaps existing active | Supersede old forecast |
| `TREASURY_ROUND_NOT_ACTIVE` | 400 | Funding round not in active status | Check round lifecycle |
| `TREASURY_ROUND_OVERSUBSCRIBED` | 400 | Commitment exceeds round target | Reduce amount or increase target |
| `TREASURY_INVESTOR_KYC_REQUIRED` | 403 | Investor must complete KYC | Run KYC verification |
| `TREASURY_INVESTOR_NOT_ACCREDITED` | 403 | Investor accreditation not verified | Verify accreditation |
| `TREASURY_SAFE_ALREADY_CONVERTED` | 400 | SAFE has already been converted | No action needed |
| `TREASURY_NOTE_MATURED` | 400 | Convertible note past maturity | Convert or repay |
| `TREASURY_CONSOLIDATION_IN_PROGRESS` | 409 | Consolidation already running | Wait for completion |
| `TREASURY_PERIOD_ALREADY_CLOSED` | 400 | Cannot modify a closed period | Use restatement |
| `TREASURY_ELIMINATION_MISMATCH` | 400 | IC amounts do not reconcile | Review IC transactions |
| `TREASURY_TAX_ENTITY_NOT_FOUND` | 404 | Tax entity does not exist | Register entity first |
| `TREASURY_TAX_PAYMENT_OVERDUE` | 400 | Estimated payment is past due | Record payment immediately |
| `TREASURY_TP_OUT_OF_RANGE` | 400 | Price outside arm's length range | Adjust pricing or document |
| `TREASURY_PROVISION_LOCKED` | 400 | Tax provision has been finalized | Create amended provision |
| `TREASURY_UNAUTHORIZED` | 403 | Insufficient permissions | Request treasury role |
| `TREASURY_RATE_LIMIT` | 429 | Too many API calls | Implement backoff |

---

## Config Reference

### Environment Variables

| Variable | Type | Default | Description |
|----------|------|---------|-------------|
| `TREASURY_ENABLED` | boolean | `true` | Enable treasury module |
| `TREASURY_BASE_CURRENCY` | string | `'USD'` | Base reporting currency |
| `TREASURY_CASH_SNAPSHOT_CRON` | string | `'59 23 * * *'` | Daily position snapshot |
| `TREASURY_CASH_SYNC_INTERVAL_HOURS` | number | `6` | Bank sync frequency |
| `TREASURY_MINIMUM_SWEEP_AMOUNT` | string | `'1000'` | Min sweep amount |
| `TREASURY_BURN_RATE_LOOKBACK_DAYS` | number | `30` | Burn rate window |
| `TREASURY_KYC_REQUIRED` | boolean | `true` | Require KYC for funding |
| `TREASURY_DUAL_APPROVAL_THRESHOLD` | string | `'25000'` | Dual approval amount |
| `TREASURY_MATERIALITY_THRESHOLD` | string | `'5000'` | Variance materiality |
| `TREASURY_TAX_REMINDER_DAYS` | number | `14` | Reminder lookahead |
| `TREASURY_FEDERAL_TAX_RATE` | string | `'0.21'` | Federal statutory rate |
| `TREASURY_ENCRYPTION_KEY` | string | — | AES-256-GCM key |
| `TREASURY_KEY_ROTATION_DAYS` | number | `90` | Key rotation frequency |
| `PLAID_CLIENT_ID` | string | — | Plaid API client |
| `PLAID_SECRET` | string | — | Plaid API secret |
| `PLAID_ENVIRONMENT` | string | `'production'` | Plaid environment |
| `TREASURY_AI_FORECAST_MODEL` | string | `'openai/gpt-4o'` | Forecast AI model |
| `TREASURY_AI_NARRATIVE_MODEL` | string | `'anthropic/claude-3.5-sonnet'` | Narrative AI model |

### Constants

```typescript
export const MCV_VENTURES = [
  { id: 'betedge', name: 'BetEdge', industry: 'Sports AI / Betting' },
  { id: 'serpspace', name: 'SerpSpace', industry: 'SEO / SaaS' },
  { id: 'fullgain', name: 'Full Gain', industry: 'Grants / Services' },
  { id: 'mcvstudios', name: 'MCV Studios', industry: 'Gaming' },
  { id: 'futurestate', name: 'Futurestate', industry: 'Real Estate' },
  { id: 'venture6', name: 'Venture 6', industry: 'TBD' },
  { id: 'venture7', name: 'Venture 7', industry: 'TBD' },
  { id: 'venture8', name: 'Venture 8', industry: 'TBD' },
  { id: 'venture9', name: 'Venture 9', industry: 'TBD' },
] as const;

export const CASH_FORECAST_HORIZONS = [30, 60, 90, 180, 365] as const;
export const SWEEP_FREQUENCIES = ['daily', 'weekly', 'monthly'] as const;
export const SUPPORTED_CURRENCIES = ['USD', 'CAD', 'EUR', 'GBP', 'SOL'] as const;
export const FUNDING_ROUND_TYPES = ['pre_seed', 'seed', 'series_a', 'series_b', 'series_c', 'bridge', 'ipo'] as const;
export const TRANSFER_PRICING_METHODS = ['cup', 'resale_price', 'cost_plus', 'tnmm', 'profit_split'] as const;
```

---

*@mcv/treasury — Treasury Management Domain*
