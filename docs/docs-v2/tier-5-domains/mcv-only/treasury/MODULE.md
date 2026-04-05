# @mcv/treasury â€” Treasury Domain Module

**Parent Package:** @mcv/treasury  
**Tier:** 5 (Domain Layer â€” MCV-Only)  
**Classification:** MCV-ONLY  
**Version:** 1.0.0  
**Last Updated:** February 8, 2026

---

## Purpose

The `treasury` module is the **consortium-level financial command center** for MCV Global. While `@mcv/finance` handles venture-level accounting, invoicing, and expense management for individual ventures, `@mcv/treasury` operates one layer above â€” aggregating, consolidating, and managing finances **across all nine MCV ventures** as a unified enterprise.

**This is where the CFO lives.** Every dollar of cash across BetEdge, SerpSpace, Full Gain, MCV Studios, Futurestate, and the other four ventures is tracked here. Every funding round, every investor relationship, every inter-company transfer, every consolidated P&L report, every tax jurisdiction, every estimated tax payment â€” it all flows through treasury.

The module is organized into four submodules:

- **`cash`** â€” Multi-venture cash management, bank account tracking across all entities, cash flow forecasting with AI-powered runway projections, liquidity management, sweep accounts, multi-currency positions, cash pooling, and wire/ACH management
- **`funding`** â€” Capital raises and investor lifecycle management, funding rounds (seed through IPO), cap table management with dilution modeling, SAFE/convertible note tracking, investor reporting packages, and distribution waterfall calculations
- **`pnl`** â€” Consolidated profit & loss across all ventures, segment reporting, inter-company elimination engine, variance analysis (budget vs. actual vs. forecast), management reporting, and board-ready financial packages
- **`tax`** â€” Multi-jurisdiction tax compliance (federal, state, international), estimated tax payment scheduling, tax calendar management, transfer pricing documentation, R&D tax credit tracking, withholding tax, consolidated tax return preparation, and tax provision (ASC 740) calculations

**Why is this MCV-Only?** Treasury operations are inherently consortium-level. No single venture needs consolidated P&L elimination or multi-entity tax provisioning. This module exists solely because MCV operates a portfolio of ventures that must report, optimize, and comply as a group.

---

## Exports

```typescript
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
// CASH MANAGEMENT
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•

// Core services
export {
  cashService,                     // Multi-venture cash operations
  cashForecastService,             // AI-powered cash flow forecasting
  sweepService,                    // Automated sweep account management
  cashPoolingService,              // Inter-venture cash pooling
} from './cash/service';

export type {
  CreateBankAccountInput,          // Register a bank account
  RecordCashMovementInput,         // Record inflow/outflow/transfer
  CashForecastInput,               // Forecast configuration
  SweepRuleInput,                  // Sweep automation rule
  CashPoolContributionInput,       // Cash pool contribution
  WireTransferInput,               // Initiate wire transfer
  ACHBatchInput,                   // ACH batch payment
  FXConversionInput,               // Foreign exchange conversion
} from './cash/service';

// Schema exports
export {
  treasuryBankAccounts,            // Bank accounts across all ventures
  cashPositions,                   // Daily cash position snapshots
  cashMovements,                   // All cash inflows/outflows/transfers
  cashForecasts,                   // Forecast models and projections
  cashForecastLines,               // Individual forecast line items
  sweepAccounts,                   // Sweep account configurations
  sweepTransactions,               // Executed sweep transactions
  cashPools,                       // Cash pooling structures
  cashPoolAllocations,             // Pool allocation per venture
  wireTransfers,                   // Wire transfer records
  achBatches,                      // ACH batch payments
  achTransactions,                 // Individual ACH transactions
  fxPositions,                     // Foreign exchange positions
  fxTransactions,                  // FX conversion transactions
  bankAccountTypeEnum,             // Bank account type enum
  cashMovementTypeEnum,            // Cash movement type enum
  sweepDirectionEnum,              // Sweep direction enum
  wireStatusEnum,                  // Wire transfer status enum
} from './cash/schema';

// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
// FUNDING & CAPITAL
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•

export {
  fundingService,                  // Capital raise management
  capTableService,                 // Cap table & dilution modeling
  investorService,                 // Investor relationship management
  waterfallService,                // Distribution waterfall calculations
} from './funding/service';

export type {
  CreateFundingRoundInput,         // Create a new funding round
  InvestorCommitmentInput,         // Record investor commitment
  CreateSAFEInput,                 // Create a SAFE agreement
  CreateConvertibleNoteInput,      // Create a convertible note
  CapTableSnapshotInput,           // Generate cap table snapshot
  DilutionModelInput,              // Run dilution scenario
  InvestorReportInput,             // Generate investor report
  DistributionWaterfallInput,      // Calculate distribution waterfall
  ShareIssuanceInput,              // Issue shares
  VestingScheduleInput,            // Configure vesting schedule
} from './funding/service';

export {
  fundingRoundsV2,                 // Funding rounds (enhanced)
  fundingRoundInvestors,           // Investor participation per round
  investors,                       // Investor registry
  investorEntities,                // Investor legal entities
  safeAgreements,                  // SAFE agreements
  convertibleNotes,                // Convertible note instruments
  capTableEntries,                 // Cap table line items
  capTableSnapshots,               // Point-in-time cap table snapshots
  shareClasses,                    // Share class definitions
  shareIssuances,                  // Share issuance records
  vestingSchedules,                // Vesting schedule configurations
  vestingEvents,                   // Vesting milestone events
  dilutionModels,                  // Dilution scenario models
  distributionWaterfalls,          // Waterfall calculation records
  investorReports,                 // Investor reporting packages
  investorCommunications,          // Investor communication log
  roundTypeEnum,                   // Funding round type enum
  instrumentTypeEnum,              // Financial instrument type enum
  vestingTypeEnum,                 // Vesting type enum
  safeTypeEnum,                    // SAFE variant enum
} from './funding/schema';

// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
// CONSOLIDATED P&L
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•

export {
  pnlService,                     // Consolidated P&L operations
  eliminationService,              // Inter-company elimination engine
  varianceService,                 // Variance analysis (BvA / BvF)
  segmentReportingService,         // Segment & venture-level reporting
  boardReportService,              // Board-ready financial packages
} from './pnl/service';

export type {
  ConsolidatedPnlInput,            // Generate consolidated P&L
  SegmentReportInput,              // Segment report configuration
  EliminationRuleInput,            // Create elimination rule
  InterCompanyTransactionInput,    // Record inter-company transaction
  VarianceAnalysisInput,           // Run variance analysis
  BudgetVsActualInput,             // Budget vs actual comparison
  ManagementReportInput,           // Management report generation
  BoardPackageInput,               // Board package configuration
} from './pnl/service';

export {
  consolidatedPnl,                 // Consolidated P&L records
  consolidatedPnlLines,            // P&L line items by category
  ventureSegments,                 // Venture segment definitions
  segmentResults,                  // Segment financial results
  interCompanyTransactions,        // Inter-company transactions
  eliminationRules,                // Elimination rule definitions
  eliminationEntries,              // Applied elimination entries
  varianceReports,                 // Variance analysis reports
  varianceLines,                   // Variance line items
  managementReports,               // Management report records
  boardPackages,                   // Board package records
  boardPackageItems,               // Board package line items
  consolidationRuns,               // Consolidation execution log
  pnlBudgets,                      // P&L budget allocations
  pnlForecasts,                    // P&L forecast models
  consolidationMethodEnum,         // Consolidation method enum
  eliminationTypeEnum,             // Elimination type enum
  varianceTypeEnum,                // Variance type enum
  reportFrequencyEnum,             // Reporting frequency enum
} from './pnl/schema';

// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
// TAX
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•

export {
  taxService,                      // Tax compliance operations
  taxCalendarService,              // Tax calendar & deadline tracking
  transferPricingService,          // Transfer pricing management
  taxCreditService,                // R&D tax credit tracking
  taxProvisionService,             // ASC 740 tax provision calculations
} from './tax/service';

export type {
  CreateTaxEntityInput,            // Register tax entity
  EstimatedPaymentInput,           // Record estimated tax payment
  TaxCalendarEventInput,           // Create tax calendar event
  TransferPricingStudyInput,       // Create transfer pricing study
  TransferPricingTransactionInput, // Record inter-company transaction for TP
  RDCreditInput,                   // Record R&D tax credit activity
  WithholdingTaxInput,             // Record withholding tax
  TaxProvisionInput,               // Generate tax provision
  TaxReturnInput,                  // Prepare tax return data
  TaxJurisdictionInput,            // Register tax jurisdiction
} from './tax/service';

export {
  taxEntities,                     // Tax entity registrations
  taxJurisdictions,                // Jurisdiction configurations
  taxEntityJurisdictions,          // Entity-jurisdiction mappings
  estimatedTaxPayments,            // Estimated tax payments
  taxCalendarEvents,               // Tax calendar events/deadlines
  transferPricingStudies,          // Transfer pricing studies
  transferPricingTransactions,     // TP inter-company transactions
  transferPricingBenchmarks,       // TP comparable benchmarks
  rdCredits,                       // R&D tax credit records
  rdCreditActivities,              // R&D qualifying activities
  withholdingTaxRecords,           // Withholding tax records
  taxProvisions,                   // Tax provision calculations
  taxProvisionComponents,          // Provision components (current/deferred)
  deferredTaxItems,                // Deferred tax assets/liabilities
  taxReturns,                      // Tax return records
  taxReturnWorkpapers,             // Return workpaper attachments
  consolidatedTaxData,             // Consolidated tax data
  taxAuditTrail,                   // Tax-specific audit trail
  taxEntityTypeEnum,               // Tax entity type enum
  taxTypeEnum,                     // Tax type enum
  filingStatusEnum,                // Filing status enum
  transferPricingMethodEnum,       // TP method enum
  taxCreditTypeEnum,               // Tax credit type enum
} from './tax/schema';

// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
// CLIENT HOOKS (React)
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•

// Cash hooks
export { useCashPositions } from './client/hooks/use-cash-positions';
export { useCashForecast } from './client/hooks/use-cash-forecast';
export { useCashMovements } from './client/hooks/use-cash-movements';
export { useBankAccounts } from './client/hooks/use-bank-accounts';
export { useSweepAccounts } from './client/hooks/use-sweep-accounts';
export { useFXPositions } from './client/hooks/use-fx-positions';
export { useCashPool } from './client/hooks/use-cash-pool';

// Funding hooks
export { useFundingRounds } from './client/hooks/use-funding-rounds';
export { useCapTable } from './client/hooks/use-cap-table';
export { useInvestors } from './client/hooks/use-investors';
export { useDilutionModel } from './client/hooks/use-dilution-model';
export { useDistributionWaterfall } from './client/hooks/use-distribution-waterfall';
export { useSAFEAgreements } from './client/hooks/use-safe-agreements';
export { useVestingSchedules } from './client/hooks/use-vesting-schedules';

// P&L hooks
export { useConsolidatedPnl } from './client/hooks/use-consolidated-pnl';
export { useSegmentResults } from './client/hooks/use-segment-results';
export { useVarianceAnalysis } from './client/hooks/use-variance-analysis';
export { useBudgetVsActual } from './client/hooks/use-budget-vs-actual';
export { useEliminationEntries } from './client/hooks/use-elimination-entries';
export { useBoardPackage } from './client/hooks/use-board-package';
export { useManagementReport } from './client/hooks/use-management-report';

// Tax hooks
export { useTaxCalendar } from './client/hooks/use-tax-calendar';
export { useEstimatedPayments } from './client/hooks/use-estimated-payments';
export { useTaxProvision } from './client/hooks/use-tax-provision';
export { useTransferPricing } from './client/hooks/use-transfer-pricing';
export { useRDCredits } from './client/hooks/use-rd-credits';
export { useTaxReturns } from './client/hooks/use-tax-returns';

// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
// CLIENT COMPONENTS (React)
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•

// Cash components
export { CashDashboard } from './client/components/cash-dashboard';
export { CashPositionChart } from './client/components/cash-position-chart';
export { CashForecastView } from './client/components/cash-forecast-view';
export { RunwayProjection } from './client/components/runway-projection';
export { BankAccountGrid } from './client/components/bank-account-grid';
export { SweepAccountManager } from './client/components/sweep-account-manager';
export { WireTransferForm } from './client/components/wire-transfer-form';
export { FXPositionPanel } from './client/components/fx-position-panel';
export { CashPoolVisualization } from './client/components/cash-pool-visualization';

// Funding components
export { FundingDashboard } from './client/components/funding-dashboard';
export { CapTableView } from './client/components/cap-table-view';
export { DilutionChart } from './client/components/dilution-chart';
export { FundingRoundTimeline } from './client/components/funding-round-timeline';
export { InvestorPortal } from './client/components/investor-portal';
export { WaterfallChart } from './client/components/waterfall-chart';
export { SAFETracker } from './client/components/safe-tracker';
export { VestingScheduleView } from './client/components/vesting-schedule-view';

// P&L components
export { ConsolidatedPnlView } from './client/components/consolidated-pnl-view';
export { SegmentBreakdown } from './client/components/segment-breakdown';
export { VarianceHeatmap } from './client/components/variance-heatmap';
export { BudgetVsActualChart } from './client/components/budget-vs-actual-chart';
export { EliminationJournalView } from './client/components/elimination-journal-view';
export { BoardPackageBuilder } from './client/components/board-package-builder';
export { ManagementReportView } from './client/components/management-report-view';

// Tax components
export { TaxCalendarView } from './client/components/tax-calendar-view';
export { TaxProvisionWorksheet } from './client/components/tax-provision-worksheet';
export { TransferPricingDashboard } from './client/components/transfer-pricing-dashboard';
export { RDCreditTracker } from './client/components/rd-credit-tracker';
export { TaxEntityMap } from './client/components/tax-entity-map';
export { EstimatedPaymentSchedule } from './client/components/estimated-payment-schedule';

// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
// CONSTANTS
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•

export {
  MCV_VENTURES,                    // All 9 MCV ventures with metadata
  VENTURE_ENTITY_MAP,              // Venture â†’ legal entity mapping
  SUPPORTED_CURRENCIES,            // All supported currencies
  BASE_CURRENCY,                   // USD
  CASH_MOVEMENT_CATEGORIES,        // Standardized cash movement categories
  FUNDING_ROUND_TYPES,             // seed | series-a | series-b | ... | ipo
  SHARE_CLASSES,                   // Common | Preferred A | Preferred B | ...
  TAX_JURISDICTIONS,               // Federal | state codes | international
  FEDERAL_TAX_RATES,               // Current federal corporate tax rates
  STATE_TAX_RATES,                 // State corporate tax rate table
  FILING_DEADLINES,                // Standard filing deadline rules
  TRANSFER_PRICING_METHODS,        // CUP | resale price | cost plus | TNMM | profit split
  ELIMINATION_CATEGORIES,          // Revenue | COGS | payables | receivables | ...
  BOARD_REPORT_SECTIONS,           // Standard board package sections
  CASH_FORECAST_HORIZONS,          // 30 | 60 | 90 | 180 | 365 days
  SWEEP_FREQUENCIES,               // daily | weekly | monthly
} from './constants';

// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
// TYPES
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•

export type {
  // Cash types
  BankAccountType,
  CashMovementType,
  CashPositionSnapshot,
  CashForecastResult,
  SweepDirection,
  SweepRule,
  CashPoolStructure,
  WireStatus,
  ACHStatus,
  FXRate,
  FXPosition,
  RunwayProjection,
  LiquidityRatio,
  CashConcentration,

  // Funding types
  RoundType,
  RoundStatus,
  InstrumentType,
  SAFEType,
  SAFEVariant,
  ConvertibleNoteTerms,
  CapTableEntry,
  CapTableSnapshot,
  ShareClass,
  DilutionScenario,
  DilutionResult,
  WaterfallTier,
  WaterfallResult,
  VestingType,
  VestingSchedule,
  InvestorProfile,
  InvestorReport,

  // P&L types
  ConsolidationMethod,
  EliminationType,
  VarianceType,
  VarianceDirection,
  SegmentDefinition,
  SegmentResult,
  ConsolidatedPnlResult,
  EliminationEntry,
  InterCompanyBalance,
  ManagementReportData,
  BoardPackageData,
  ReportFrequency,
  BudgetVariance,
  ForecastAccuracy,

  // Tax types
  TaxEntityType,
  TaxType,
  FilingStatus,
  TaxJurisdiction,
  TransferPricingMethod,
  TaxCreditType,
  EstimatedPayment,
  TaxCalendarEvent,
  TaxProvisionResult,
  DeferredTaxItem,
  EffectiveTaxRate,
  TaxReconciliation,
  TransferPricingStudy,
  RDCreditCalculation,
  WithholdingTaxRecord,
  TaxReturnPackage,
} from './types';
```

---

## Architecture

```
â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
â”‚                           @mcv/treasury â€” TREASURY DOMAIN ARCHITECTURE                          â”‚
â”‚                           Classification: MCV-ONLY (Consortium-Level)                            â”‚
â”‚                                                                                                  â”‚
â”‚  â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”  â”‚
â”‚  â”‚                              ENTRY POINTS                                                  â”‚  â”‚
â”‚  â”‚                                                                                            â”‚  â”‚
â”‚  â”‚  â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”  â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”  â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”  â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”  â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”  â”‚  â”‚
â”‚  â”‚  â”‚  API Routes  â”‚  â”‚  Cron Jobs   â”‚  â”‚  Webhooks    â”‚  â”‚ NAOS Agents  â”‚  â”‚  Internal  â”‚  â”‚  â”‚
â”‚  â”‚  â”‚ /api/treasuryâ”‚  â”‚  Daily cash  â”‚  â”‚ Bank feeds   â”‚  â”‚  CFO Agent   â”‚  â”‚  Triggers  â”‚  â”‚  â”‚
â”‚  â”‚  â”‚ /api/funding â”‚  â”‚  Tax alerts  â”‚  â”‚ Plaid/Stripe â”‚  â”‚  Tax Agent   â”‚  â”‚  @mcv/     â”‚  â”‚  â”‚
â”‚  â”‚  â”‚ /api/tax     â”‚  â”‚  Forecasts   â”‚  â”‚ ACH/Wire     â”‚  â”‚  IR Agent    â”‚  â”‚  finance   â”‚  â”‚  â”‚
â”‚  â”‚  â””â”€â”€â”€â”€â”€â”€â”¬â”€â”€â”€â”€â”€â”€â”€â”˜  â””â”€â”€â”€â”€â”€â”€â”¬â”€â”€â”€â”€â”€â”€â”€â”˜  â””â”€â”€â”€â”€â”€â”€â”¬â”€â”€â”€â”€â”€â”€â”€â”˜  â””â”€â”€â”€â”€â”€â”€â”¬â”€â”€â”€â”€â”€â”€â”€â”˜  â””â”€â”€â”€â”€â”€â”¬â”€â”€â”€â”€â”€â”€â”˜  â”‚  â”‚
â”‚  â”‚         â”‚                 â”‚                  â”‚                 â”‚                â”‚          â”‚  â”‚
â”‚  â”‚         â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”´â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”´â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”´â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜          â”‚  â”‚
â”‚  â”‚                                       â”‚                                                    â”‚  â”‚
â”‚  â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¼â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜  â”‚
â”‚                                          â”‚                                                       â”‚
â”‚  â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â–¼â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”  â”‚
â”‚  â”‚                              SERVICE LAYER                                                 â”‚  â”‚
â”‚  â”‚                                                                                            â”‚  â”‚
â”‚  â”‚  â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”  â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”                                         â”‚  â”‚
â”‚  â”‚  â”‚       CASH          â”‚  â”‚      FUNDING         â”‚                                         â”‚  â”‚
â”‚  â”‚  â”‚                     â”‚  â”‚                      â”‚                                         â”‚  â”‚
â”‚  â”‚  â”‚ â€¢ Bank accounts     â”‚  â”‚ â€¢ Funding rounds     â”‚                                         â”‚  â”‚
â”‚  â”‚  â”‚ â€¢ Cash positions    â”‚  â”‚ â€¢ Investor registry  â”‚                                         â”‚  â”‚
â”‚  â”‚  â”‚ â€¢ Cash movements    â”‚  â”‚ â€¢ Cap table mgmt     â”‚                                         â”‚  â”‚
â”‚  â”‚  â”‚ â€¢ Cash forecasting  â”‚  â”‚ â€¢ SAFE/conv. notes   â”‚                                         â”‚  â”‚
â”‚  â”‚  â”‚ â€¢ Sweep accounts    â”‚  â”‚ â€¢ Dilution modeling  â”‚                                         â”‚  â”‚
â”‚  â”‚  â”‚ â€¢ Cash pooling      â”‚  â”‚ â€¢ Share issuance     â”‚                                         â”‚  â”‚
â”‚  â”‚  â”‚ â€¢ Wire/ACH mgmt     â”‚  â”‚ â€¢ Vesting schedules  â”‚                                         â”‚  â”‚
â”‚  â”‚  â”‚ â€¢ FX positions      â”‚  â”‚ â€¢ Waterfall calcs    â”‚                                         â”‚  â”‚
â”‚  â”‚  â”‚ â€¢ Multi-currency    â”‚  â”‚ â€¢ Investor reports   â”‚                                         â”‚  â”‚
â”‚  â”‚  â”‚ â€¢ Runway projection â”‚  â”‚ â€¢ Board updates      â”‚                                         â”‚  â”‚
â”‚  â”‚  â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¬â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜  â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¬â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜                                         â”‚  â”‚
â”‚  â”‚            â”‚                         â”‚                                                     â”‚  â”‚
â”‚  â”‚  â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”  â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”                                         â”‚  â”‚
â”‚  â”‚  â”‚        PNL          â”‚  â”‚        TAX           â”‚                                         â”‚  â”‚
â”‚  â”‚  â”‚                     â”‚  â”‚                      â”‚                                         â”‚  â”‚
â”‚  â”‚  â”‚ â€¢ Consolidated P&L  â”‚  â”‚ â€¢ Tax entities       â”‚                                         â”‚  â”‚
â”‚  â”‚  â”‚ â€¢ Segment reporting â”‚  â”‚ â€¢ Jurisdictions      â”‚                                         â”‚  â”‚
â”‚  â”‚  â”‚ â€¢ IC eliminations   â”‚  â”‚ â€¢ Estimated payments â”‚                                         â”‚  â”‚
â”‚  â”‚  â”‚ â€¢ Variance analysis â”‚  â”‚ â€¢ Tax calendar       â”‚                                         â”‚  â”‚
â”‚  â”‚  â”‚ â€¢ Budget vs Actual  â”‚  â”‚ â€¢ Transfer pricing   â”‚                                         â”‚  â”‚
â”‚  â”‚  â”‚ â€¢ Management rpts   â”‚  â”‚ â€¢ R&D tax credits    â”‚                                         â”‚  â”‚
â”‚  â”‚  â”‚ â€¢ Board packages    â”‚  â”‚ â€¢ Withholding tax    â”‚                                         â”‚  â”‚
â”‚  â”‚  â”‚ â€¢ P&L budgets       â”‚  â”‚ â€¢ Tax provisions     â”‚                                         â”‚  â”‚
â”‚  â”‚  â”‚ â€¢ P&L forecasts     â”‚  â”‚ â€¢ Consolidated rtrns â”‚                                         â”‚  â”‚
â”‚  â”‚  â”‚ â€¢ Consolidation     â”‚  â”‚ â€¢ Deferred tax       â”‚                                         â”‚  â”‚
â”‚  â”‚  â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¬â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜  â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¬â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜                                         â”‚  â”‚
â”‚  â”‚            â”‚                         â”‚                                                     â”‚  â”‚
â”‚  â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”´â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”´â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜  â”‚
â”‚                                          â”‚                                                       â”‚
â”‚  â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â–¼â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”  â”‚
â”‚  â”‚                     CONSOLIDATION ENGINE (Core)                                            â”‚  â”‚
â”‚  â”‚                                                                                            â”‚  â”‚
â”‚  â”‚  All 9 MCV ventures feed their financial data upward. The consolidation engine:            â”‚  â”‚
â”‚  â”‚  1. Aggregates venture-level P&L, cash, and balance data                                  â”‚  â”‚
â”‚  â”‚  2. Identifies and eliminates inter-company transactions                                   â”‚  â”‚
â”‚  â”‚  3. Applies currency translations for international entities                               â”‚  â”‚
â”‚  â”‚  4. Produces consolidated financial statements for the consortium                          â”‚  â”‚
â”‚  â”‚                                                                                            â”‚  â”‚
â”‚  â”‚  â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”  â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”  â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”  â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”                   â”‚  â”‚
â”‚  â”‚  â”‚  BetEdge     â”‚  â”‚  SerpSpace   â”‚  â”‚  Full Gain   â”‚  â”‚  MCV Studios â”‚                   â”‚  â”‚
â”‚  â”‚  â”‚  (Betting AI)â”‚  â”‚  (SEO)       â”‚  â”‚  (Grants)    â”‚  â”‚  (Gaming)    â”‚                   â”‚  â”‚
â”‚  â”‚  â””â”€â”€â”€â”€â”€â”€â”¬â”€â”€â”€â”€â”€â”€â”€â”˜  â””â”€â”€â”€â”€â”€â”€â”¬â”€â”€â”€â”€â”€â”€â”€â”˜  â””â”€â”€â”€â”€â”€â”€â”¬â”€â”€â”€â”€â”€â”€â”€â”˜  â””â”€â”€â”€â”€â”€â”€â”¬â”€â”€â”€â”€â”€â”€â”€â”˜                   â”‚  â”‚
â”‚  â”‚         â”‚                 â”‚                  â”‚                 â”‚                            â”‚  â”‚
â”‚  â”‚  â”Œâ”€â”€â”€â”€â”€â”€â”´â”€â”€â”€â”€â”€â”€â”€â”  â”Œâ”€â”€â”€â”€â”€â”€â”´â”€â”€â”€â”€â”€â”€â”€â”  â”Œâ”€â”€â”€â”€â”€â”€â”´â”€â”€â”€â”€â”€â”€â”€â”  â”Œâ”€â”€â”€â”€â”€â”€â”´â”€â”€â”€â”€â”€â”€â”€â”                   â”‚  â”‚
â”‚  â”‚  â”‚ Futurestate  â”‚  â”‚  Venture 6   â”‚  â”‚  Venture 7   â”‚  â”‚  Venture 8   â”‚                   â”‚  â”‚
â”‚  â”‚  â”‚ (Real Estate)â”‚  â”‚              â”‚  â”‚              â”‚  â”‚              â”‚                   â”‚  â”‚
â”‚  â”‚  â””â”€â”€â”€â”€â”€â”€â”¬â”€â”€â”€â”€â”€â”€â”€â”˜  â””â”€â”€â”€â”€â”€â”€â”¬â”€â”€â”€â”€â”€â”€â”€â”˜  â””â”€â”€â”€â”€â”€â”€â”¬â”€â”€â”€â”€â”€â”€â”€â”˜  â””â”€â”€â”€â”€â”€â”€â”¬â”€â”€â”€â”€â”€â”€â”€â”˜                   â”‚  â”‚
â”‚  â”‚         â”‚                 â”‚                  â”‚                 â”‚                            â”‚  â”‚
â”‚  â”‚         â”‚          â”Œâ”€â”€â”€â”€â”€â”€â”´â”€â”€â”€â”€â”€â”€â”€â”          â”‚                 â”‚                            â”‚  â”‚
â”‚  â”‚         â”‚          â”‚  Venture 9   â”‚          â”‚                 â”‚                            â”‚  â”‚
â”‚  â”‚         â”‚          â”‚              â”‚          â”‚                 â”‚                            â”‚  â”‚
â”‚  â”‚         â”‚          â””â”€â”€â”€â”€â”€â”€â”¬â”€â”€â”€â”€â”€â”€â”€â”˜          â”‚                 â”‚                            â”‚  â”‚
â”‚  â”‚         â”‚                 â”‚                  â”‚                 â”‚                            â”‚  â”‚
â”‚  â”‚         â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”´â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”´â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜                            â”‚  â”‚
â”‚  â”‚                                   â”‚                                                        â”‚  â”‚
â”‚  â”‚                    â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â–¼â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”                                         â”‚  â”‚
â”‚  â”‚                    â”‚   CONSOLIDATED VIEW          â”‚                                         â”‚  â”‚
â”‚  â”‚                    â”‚                              â”‚                                         â”‚  â”‚
â”‚  â”‚                    â”‚   â€¢ Total cash: $X.XM       â”‚                                         â”‚  â”‚
â”‚  â”‚                    â”‚   â€¢ Total revenue: $X.XM    â”‚                                         â”‚  â”‚
â”‚  â”‚                    â”‚   â€¢ Net income: $X.XM       â”‚                                         â”‚  â”‚
â”‚  â”‚                    â”‚   â€¢ Runway: XX months       â”‚                                         â”‚  â”‚
â”‚  â”‚                    â”‚   â€¢ Tax liability: $X.XM    â”‚                                         â”‚  â”‚
â”‚  â”‚                    â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜                                         â”‚  â”‚
â”‚  â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜  â”‚
â”‚                                          â”‚                                                       â”‚
â”‚  â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â–¼â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”  â”‚
â”‚  â”‚                         DATABASE LAYER (PostgreSQL + Supabase RLS)                         â”‚  â”‚
â”‚  â”‚                                                                                            â”‚  â”‚
â”‚  â”‚  â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”  â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”  â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”  â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”                           â”‚  â”‚
â”‚  â”‚  â”‚    Cash    â”‚  â”‚  Funding   â”‚  â”‚    PnL     â”‚  â”‚    Tax     â”‚                           â”‚  â”‚
â”‚  â”‚  â”‚  14 tables â”‚  â”‚  16 tables â”‚  â”‚  14 tables â”‚  â”‚  18 tables â”‚                           â”‚  â”‚
â”‚  â”‚  â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜  â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜  â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜  â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜                           â”‚  â”‚
â”‚  â”‚                                                                                            â”‚  â”‚
â”‚  â”‚  Total: 62 tables | RLS policies on all | Audit triggers on financial mutations            â”‚  â”‚
â”‚  â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜  â”‚
â”‚                                                                                                  â”‚
â”‚  â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”  â”‚
â”‚  â”‚                         EXTERNAL DEPENDENCIES                                              â”‚  â”‚
â”‚  â”‚                                                                                            â”‚  â”‚
â”‚  â”‚  @mcv/finance         @mcv/portfolio        @mcv/connectors       @mcv/web3-core          â”‚  â”‚
â”‚  â”‚  (Venture-level       (Venture/entity       (Bank feeds via       (Crypto treasury,       â”‚  â”‚
â”‚  â”‚   accounting,          data, org chart,      Plaid, payment        Solana wallets,         â”‚  â”‚
â”‚  â”‚   invoicing feeds)     legal entities)       processors)           EDGE token)             â”‚  â”‚
â”‚  â”‚                                                                                            â”‚  â”‚
â”‚  â”‚  @mcv/kernel          @mcv/notifications    @mcv/documents        @mcv/payments            â”‚  â”‚
â”‚  â”‚  (DB, context,        (Tax deadline          (PDF generation,     (Stripe Connect,         â”‚  â”‚
â”‚  â”‚   errors, auth,        alerts, investor      board packages,      payment processing,     â”‚  â”‚
â”‚  â”‚   RLS policies)        updates)              tax filings)         wire/ACH)               â”‚  â”‚
â”‚  â”‚                                                                                            â”‚  â”‚
â”‚  â”‚  Plaid                Mercury/SVB            IRS EFTPS             OpenRouter              â”‚  â”‚
â”‚  â”‚  (Bank feeds,         (Banking API,          (Electronic tax       (AI forecasting,        â”‚  â”‚
â”‚  â”‚   balances)           wire/ACH)              payments)             anomaly detection)      â”‚  â”‚
â”‚  â”‚                                                                                            â”‚  â”‚
â”‚  â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜  â”‚
â”‚                                                                                                  â”‚
â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
```

### Data Flow: Venture P&L â†’ Consolidated Board Package

```
Venture-Level (@mcv/finance)                  Consortium-Level (@mcv/treasury)
â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€                 â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
â”‚ BetEdge     â”‚â”€â”€â”€â”€ revenue, expenses â”€â”€â”€â”€â”
â”‚ P&L data    â”‚                           â”‚
â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜                           â”‚     â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
                                          â”œâ”€â”€â”€â”€â–¶â”‚ Consolidation Engine  â”‚
â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”                           â”‚     â”‚                       â”‚
â”‚ SerpSpace   â”‚â”€â”€â”€â”€ revenue, expenses â”€â”€â”€â”€â”¤     â”‚ 1. Aggregate all 9   â”‚
â”‚ P&L data    â”‚                           â”‚     â”‚ 2. Identify IC txns   â”‚
â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜                           â”‚     â”‚ 3. Apply eliminations â”‚
                                          â”‚     â”‚ 4. Currency translate â”‚
â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”                           â”‚     â”‚ 5. Produce consol.   â”‚
â”‚ Full Gain   â”‚â”€â”€â”€â”€ revenue, expenses â”€â”€â”€â”€â”¤     â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¬â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
â”‚ P&L data    â”‚                           â”‚                â”‚
â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜                           â”‚                â–¼
                                          â”‚     â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”                           â”‚     â”‚ Variance Analysis     â”‚
â”‚ MCV Studios â”‚â”€â”€â”€â”€ revenue, expenses â”€â”€â”€â”€â”¤     â”‚                       â”‚
â”‚ P&L data    â”‚                           â”‚     â”‚ â€¢ Budget vs Actual    â”‚
â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜                           â”‚     â”‚ â€¢ Prior period comp   â”‚
                                          â”‚     â”‚ â€¢ Forecast vs Actual  â”‚
â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”                           â”‚     â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¬â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
â”‚ Futurestate â”‚â”€â”€â”€â”€ revenue, expenses â”€â”€â”€â”€â”¤                â”‚
â”‚ P&L data    â”‚                           â”‚                â–¼
â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜                           â”‚     â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
                                          â”‚     â”‚ Board Package         â”‚
â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”                           â”‚     â”‚                       â”‚
â”‚ + 4 more    â”‚â”€â”€â”€â”€ revenue, expenses â”€â”€â”€â”€â”˜     â”‚ â€¢ Executive summary   â”‚
â”‚ ventures    â”‚                                 â”‚ â€¢ Consolidated P&L    â”‚
â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜                                 â”‚ â€¢ Segment breakdown   â”‚
                                                â”‚ â€¢ Cash position       â”‚
                                                â”‚ â€¢ Runway projection   â”‚
                                                â”‚ â€¢ KPI dashboard       â”‚
                                                â”‚ â€¢ Tax status          â”‚
                                                â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
```

### Data Flow: Cash Position Aggregation

```
Bank Accounts (via @mcv/connectors â€” Plaid)     Treasury Cash Engine
â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€     â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
â”‚ BetEdge          â”‚
â”‚ â”œ Chase Checking â”‚â”€â”€â”€â”€ $125,000 â”€â”€â”€â”€â”
â”‚ â”œ Chase Savings  â”‚â”€â”€â”€â”€ $500,000 â”€â”€â”€â”€â”¤
â”‚ â”” Mercury Ops    â”‚â”€â”€â”€â”€ $75,000  â”€â”€â”€â”€â”¤      â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜                  â”œâ”€â”€â”€â”€â”€â–¶â”‚ Cash Position        â”‚
                                      â”‚      â”‚ Aggregator           â”‚
â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”                  â”‚      â”‚                      â”‚
â”‚ SerpSpace        â”‚                  â”‚      â”‚ Total: $2,340,000    â”‚
â”‚ â”œ SVB Checking   â”‚â”€â”€â”€â”€ $340,000 â”€â”€â”€â”€â”¤      â”‚ By venture â”€â”€â”€â”€â”€â”€â”€â”€  â”‚
â”‚ â”” SVB Savings    â”‚â”€â”€â”€â”€ $200,000 â”€â”€â”€â”€â”¤      â”‚ BetEdge:   $700K    â”‚
â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜                  â”‚      â”‚ SerpSpace: $540K    â”‚
                                      â”‚      â”‚ Full Gain: $180K    â”‚
â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”                  â”‚      â”‚ Studios:   $320K    â”‚
â”‚ MCV Studios      â”‚                  â”‚      â”‚ Futurestate:$600K   â”‚
â”‚ â”œ BoA Checking   â”‚â”€â”€â”€â”€ $120,000 â”€â”€â”€â”€â”¤      â”‚                      â”‚
â”‚ â”” BoA Reserve    â”‚â”€â”€â”€â”€ $200,000 â”€â”€â”€â”€â”¤      â”‚ By currency â”€â”€â”€â”€â”€â”€â”€  â”‚
â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜                  â”‚      â”‚ USD: $2,100K         â”‚
                                      â”‚      â”‚ CAD: $140K (â‰ˆ$105K) â”‚
â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”                  â”‚      â”‚ EUR: $85K  (â‰ˆ$92K)  â”‚
â”‚ Crypto Treasury  â”‚                  â”‚      â”‚ SOL: $43K            â”‚
â”‚ (@mcv/web3-core) â”‚                  â”‚      â”‚                      â”‚
â”‚ â”œ SOL Wallet     â”‚â”€â”€â”€â”€ $43,000  â”€â”€â”€â”€â”¤      â”‚ Runway: 18.4 months â”‚
â”‚ â”” EDGE Tokens    â”‚â”€â”€â”€â”€ $0 (util) â”€â”€â”€â”˜      â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
```

---

## Sub-Module Overview

| Module | Purpose | Tables | Key Operations |
|--------|---------|--------|----------------|
| **cash** | Multi-venture cash management, bank tracking, forecasting, FX, pooling | 14 | position snapshot, forecast, sweep, wire/ACH, FX convert |
| **funding** | Capital raises, investors, cap table, SAFEs, dilution, waterfalls | 16 | create round, record commitment, model dilution, waterfall calc |
| **pnl** | Consolidated P&L, segment reporting, IC eliminations, variance, board packages | 14 | consolidate, eliminate IC, variance analysis, board package |
| **tax** | Multi-jurisdiction compliance, estimated payments, TP, R&D credits, provisions | 18 | register entity, estimate payment, TP study, provision calc |

---

## Module: cash

### Purpose

Manages the entire cash lifecycle across all MCV ventures. This is the real-time nervous system for consortium liquidity â€” tracking every bank account, every cash movement, every FX position, and projecting future cash needs with AI-powered forecasting.

The cash module answers the questions a CFO asks every morning:
- "How much cash do we have across all ventures right now?"
- "What's our consolidated runway?"
- "Which ventures are burning fastest?"
- "Do we need to move cash between entities?"
- "What does our 90-day forecast look like?"

### Multi-Venture Cash Architecture

```
                        â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
                        â”‚      MCV GLOBAL CASH HQ         â”‚
                        â”‚                                  â”‚
                        â”‚   Consolidated Position: $2.34M  â”‚
                        â”‚   Weighted Avg Yield: 4.2%       â”‚
                        â”‚   Burn Rate: $127K/mo            â”‚
                        â”‚   Runway: 18.4 months            â”‚
                        â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¬â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
                                     â”‚
            â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¬â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¼â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¬â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
            â”‚            â”‚           â”‚           â”‚            â”‚
     â”Œâ”€â”€â”€â”€â”€â”€â–¼â”€â”€â”€â”€â”€â”€â” â”Œâ”€â”€â–¼â”€â”€â”€â”€â” â”Œâ”€â”€â”€â”€â–¼â”€â”€â”€â” â”Œâ”€â”€â”€â”€â–¼â”€â”€â”€â” â”Œâ”€â”€â”€â”€â”€â”€â–¼â”€â”€â”€â”€â”€â”€â”
     â”‚  BetEdge    â”‚ â”‚Serp   â”‚ â”‚Full    â”‚ â”‚MCV     â”‚ â”‚ Futurestate â”‚
     â”‚  $700K      â”‚ â”‚Space  â”‚ â”‚Gain    â”‚ â”‚Studios â”‚ â”‚ $600K       â”‚
     â”‚             â”‚ â”‚$540K  â”‚ â”‚$180K   â”‚ â”‚$320K   â”‚ â”‚             â”‚
     â”‚ Chase (2)   â”‚ â”‚SVB(2) â”‚ â”‚Merc(1) â”‚ â”‚BoA(2)  â”‚ â”‚ Wells(2)    â”‚
     â”‚ Mercury (1) â”‚ â”‚       â”‚ â”‚        â”‚ â”‚        â”‚ â”‚ EDGE wallet â”‚
     â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜ â””â”€â”€â”€â”€â”€â”€â”€â”˜ â””â”€â”€â”€â”€â”€â”€â”€â”€â”˜ â””â”€â”€â”€â”€â”€â”€â”€â”€â”˜ â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
```

### Database Schema

```typescript
// treasury_bank_accounts â€” Bank Accounts Across All Ventures
export const treasuryBankAccounts = pgTable('treasury_bank_accounts', {
  id: uuid('id').primaryKey().defaultRandom(),
  ventureId: uuid('venture_id').notNull().references(() => ventures.id, { onDelete: 'cascade' }),
  entityId: uuid('entity_id').references(() => legalEntities.id),          // Legal entity that owns account
  accountName: text('account_name').notNull(),                             // "BetEdge Operating â€” Chase"
  accountType: bankAccountTypeEnum('account_type').notNull(),              // checking | savings | money_market | sweep | crypto_wallet
  bankName: text('bank_name').notNull(),                                   // "JPMorgan Chase"
  bankRoutingNumber: text('bank_routing_number'),                          // ABA routing (encrypted)
  accountNumberLast4: text('account_number_last4'),                        // Last 4 digits only
  currency: text('currency').notNull().default('USD'),
  currentBalance: numeric('current_balance', { precision: 19, scale: 4 }).default('0'),
  availableBalance: numeric('available_balance', { precision: 19, scale: 4 }).default('0'),
  pendingBalance: numeric('pending_balance', { precision: 19, scale: 4 }).default('0'),
  lastSyncedAt: timestamp('last_synced_at', { withTimezone: true }),
  plaidAccountId: text('plaid_account_id'),                                // Plaid integration ID
  plaidItemId: text('plaid_item_id'),
  isPrimary: boolean('is_primary').default(false),                         // Primary operating account
  isReserve: boolean('is_reserve').default(false),                         // Reserve/rainy-day account
  targetBalance: numeric('target_balance', { precision: 19, scale: 4 }),   // Target for sweep operations
  minimumBalance: numeric('minimum_balance', { precision: 19, scale: 4 }), // Minimum before alert
  interestRate: numeric('interest_rate', { precision: 6, scale: 4 }),      // APY for savings/MM
  status: text('status', { enum: ['active', 'frozen', 'closed'] }).notNull().default('active'),
  openedAt: timestamp('opened_at', { withTimezone: true }),
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

// treasury_cash_positions â€” Daily Cash Position Snapshots
export const cashPositions = pgTable('treasury_cash_positions', {
  id: uuid('id').primaryKey().defaultRandom(),
  snapshotDate: timestamp('snapshot_date', { withTimezone: true }).notNull(),
  ventureId: uuid('venture_id').references(() => ventures.id),              // NULL = consolidated
  bankAccountId: uuid('bank_account_id').references(() => treasuryBankAccounts.id),
  currency: text('currency').notNull().default('USD'),
  openingBalance: numeric('opening_balance', { precision: 19, scale: 4 }).notNull(),
  inflows: numeric('inflows', { precision: 19, scale: 4 }).default('0'),
  outflows: numeric('outflows', { precision: 19, scale: 4 }).default('0'),
  netChange: numeric('net_change', { precision: 19, scale: 4 }).default('0'),
  closingBalance: numeric('closing_balance', { precision: 19, scale: 4 }).notNull(),
  closingBalanceUsd: numeric('closing_balance_usd', { precision: 19, scale: 4 }),  // USD equivalent
  exchangeRate: numeric('exchange_rate', { precision: 12, scale: 6 }).default('1'),
  burnRate: numeric('burn_rate', { precision: 19, scale: 4 }),             // Rolling 30-day avg burn
  runwayDays: integer('runway_days'),                                       // Days of runway at current burn
  isConsolidated: boolean('is_consolidated').default(false),
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

// treasury_cash_movements â€” All Cash Inflows/Outflows/Transfers
export const cashMovements = pgTable('treasury_cash_movements', {
  id: uuid('id').primaryKey().defaultRandom(),
  ventureId: uuid('venture_id').notNull().references(() => ventures.id, { onDelete: 'cascade' }),
  movementType: cashMovementTypeEnum('movement_type').notNull(),            // inflow | outflow | transfer | sweep | fx_conversion
  category: text('category').notNull(),                                     // revenue | payroll | vendor | capex | intercompany | tax | ...
  subcategory: text('subcategory'),                                         // ads | hosting | salary | ...
  description: text('description').notNull(),
  amount: numeric('amount', { precision: 19, scale: 4 }).notNull(),
  currency: text('currency').notNull().default('USD'),
  amountUsd: numeric('amount_usd', { precision: 19, scale: 4 }),           // USD equivalent
  exchangeRate: numeric('exchange_rate', { precision: 12, scale: 6 }).default('1'),
  fromAccountId: uuid('from_account_id').references(() => treasuryBankAccounts.id),
  toAccountId: uuid('to_account_id').references(() => treasuryBankAccounts.id),
  counterpartyVentureId: uuid('counterparty_venture_id').references(() => ventures.id), // For IC transfers
  transactionDate: timestamp('transaction_date', { withTimezone: true }).notNull(),
  valueDate: timestamp('value_date', { withTimezone: true }),               // When funds actually settle
  reference: text('reference'),                                             // Wire ref, ACH trace, etc.
  sourceType: text('source_type'),                                          // manual | bank_feed | invoice | payroll | sweep
  sourceId: uuid('source_id'),                                              // Links to originating record
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

// treasury_cash_forecasts â€” Forecast Models and Projections
export const cashForecasts = pgTable('treasury_cash_forecasts', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),                                             // "Q1 2026 â€” 90-Day Forecast"
  ventureId: uuid('venture_id').references(() => ventures.id),              // NULL = consolidated
  forecastHorizonDays: integer('forecast_horizon_days').notNull(),           // 30 | 60 | 90 | 180 | 365
  startDate: timestamp('start_date', { withTimezone: true }).notNull(),
  endDate: timestamp('end_date', { withTimezone: true }).notNull(),
  method: text('method', { enum: ['linear', 'seasonal', 'ml_ensemble', 'scenario'] }).notNull(),
  assumptions: jsonb('assumptions'),
  // { revenueGrowth: 0.05, burnRateChange: 0.02, oneTimeItems: [...], excludeCategories: [...] }
  startingCash: numeric('starting_cash', { precision: 19, scale: 4 }).notNull(),
  projectedEndCash: numeric('projected_end_cash', { precision: 19, scale: 4 }),
  projectedRunwayDays: integer('projected_runway_days'),
  confidenceLevel: numeric('confidence_level', { precision: 5, scale: 4 }),  // 0.0 - 1.0
  confidenceIntervalLow: numeric('confidence_interval_low', { precision: 19, scale: 4 }),
  confidenceIntervalHigh: numeric('confidence_interval_high', { precision: 19, scale: 4 }),
  modelAccuracy: numeric('model_accuracy', { precision: 5, scale: 4 }),     // Back-tested accuracy
  status: text('status', { enum: ['draft', 'active', 'superseded', 'archived'] }).notNull().default('draft'),
  generatedBy: text('generated_by'),                                         // manual | cron | ai_agent
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

// treasury_cash_forecast_lines â€” Individual Forecast Line Items
export const cashForecastLines = pgTable('treasury_cash_forecast_lines', {
  id: uuid('id').primaryKey().defaultRandom(),
  forecastId: uuid('forecast_id').notNull().references(() => cashForecasts.id, { onDelete: 'cascade' }),
  forecastDate: timestamp('forecast_date', { withTimezone: true }).notNull(),
  category: text('category').notNull(),                                      // revenue | payroll | vendor | ...
  ventureId: uuid('venture_id').references(() => ventures.id),
  projectedInflow: numeric('projected_inflow', { precision: 19, scale: 4 }).default('0'),
  projectedOutflow: numeric('projected_outflow', { precision: 19, scale: 4 }).default('0'),
  projectedNet: numeric('projected_net', { precision: 19, scale: 4 }).default('0'),
  cumulativeBalance: numeric('cumulative_balance', { precision: 19, scale: 4 }),
  confidenceLow: numeric('confidence_low', { precision: 19, scale: 4 }),
  confidenceHigh: numeric('confidence_high', { precision: 19, scale: 4 }),
  isActual: boolean('is_actual').default(false),                             // True once actual data replaces forecast
  actualAmount: numeric('actual_amount', { precision: 19, scale: 4 }),
  variance: numeric('variance', { precision: 19, scale: 4 }),               // actual - projected
  notes: text('notes'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

// treasury_sweep_accounts â€” Sweep Account Configurations
export const sweepAccounts = pgTable('treasury_sweep_accounts', {
  id: uuid('id').primaryKey().defaultRandom(),
  ventureId: uuid('venture_id').notNull().references(() => ventures.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),                                              // "BetEdge Nightly Sweep"
  sourceAccountId: uuid('source_account_id').notNull().references(() => treasuryBankAccounts.id),
  targetAccountId: uuid('target_account_id').notNull().references(() => treasuryBankAccounts.id),
  direction: sweepDirectionEnum('direction').notNull(),                      // to_target | to_source | bidirectional
  triggerType: text('trigger_type', { enum: ['balance_threshold', 'schedule', 'manual'] }).notNull(),
  thresholdAmount: numeric('threshold_amount', { precision: 19, scale: 4 }), // Sweep when source exceeds this
  targetBalanceAmount: numeric('target_balance_amount', { precision: 19, scale: 4 }), // Keep source at this level
  minimumSweepAmount: numeric('minimum_sweep_amount', { precision: 19, scale: 4 }).default('1000'),
  maximumSweepAmount: numeric('maximum_sweep_amount', { precision: 19, scale: 4 }),
  frequency: text('frequency', { enum: ['daily', 'weekly', 'monthly'] }),
  dayOfWeek: integer('day_of_week'),                                         // 0-6 for weekly
  dayOfMonth: integer('day_of_month'),                                       // 1-28 for monthly
  executeTime: text('execute_time').default('23:00'),                        // UTC time
  isActive: boolean('is_active').default(true),
  lastExecutedAt: timestamp('last_executed_at', { withTimezone: true }),
  totalSwept: numeric('total_swept', { precision: 19, scale: 4 }).default('0'),
  sweepCount: integer('sweep_count').default(0),
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

// treasury_sweep_transactions â€” Executed Sweep Transactions
export const sweepTransactions = pgTable('treasury_sweep_transactions', {
  id: uuid('id').primaryKey().defaultRandom(),
  sweepAccountId: uuid('sweep_account_id').notNull().references(() => sweepAccounts.id),
  cashMovementId: uuid('cash_movement_id').references(() => cashMovements.id), // Links to cash movement
  amount: numeric('amount', { precision: 19, scale: 4 }).notNull(),
  sourceBalanceBefore: numeric('source_balance_before', { precision: 19, scale: 4 }),
  sourceBalanceAfter: numeric('source_balance_after', { precision: 19, scale: 4 }),
  targetBalanceBefore: numeric('target_balance_before', { precision: 19, scale: 4 }),
  targetBalanceAfter: numeric('target_balance_after', { precision: 19, scale: 4 }),
  triggerReason: text('trigger_reason').notNull(),                            // "Balance exceeded $100K threshold"
  status: text('status', { enum: ['pending', 'executed', 'failed', 'reversed'] }).notNull().default('pending'),
  executedAt: timestamp('executed_at', { withTimezone: true }),
  failureReason: text('failure_reason'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

// treasury_cash_pools â€” Cash Pooling Structures
export const cashPools = pgTable('treasury_cash_pools', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),                                              // "MCV Global Cash Pool"
  description: text('description'),
  poolType: text('pool_type', { enum: ['notional', 'physical', 'hybrid'] }).notNull(), // notional | physical | hybrid
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

// treasury_cash_pool_allocations â€” Pool Allocation Per Venture
export const cashPoolAllocations = pgTable('treasury_cash_pool_allocations', {
  id: uuid('id').primaryKey().defaultRandom(),
  poolId: uuid('pool_id').notNull().references(() => cashPools.id, { onDelete: 'cascade' }),
  ventureId: uuid('venture_id').notNull().references(() => ventures.id),
  participantAccountId: uuid('participant_account_id').references(() => treasuryBankAccounts.id),
  contributedBalance: numeric('contributed_balance', { precision: 19, scale: 4 }).default('0'),
  allocationPercent: numeric('allocation_percent', { precision: 6, scale: 4 }),   // Share of pool
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

// treasury_wire_transfers â€” Wire Transfer Records
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
  reference: text('reference'),                                              // Wire reference number
  purpose: text('purpose'),                                                  // Payment purpose/memo
  status: wireStatusEnum('status').notNull().default('pending'),             // pending | approved | sent | completed | failed | cancelled
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

// treasury_ach_batches â€” ACH Batch Payments
export const achBatches = pgTable('treasury_ach_batches', {
  id: uuid('id').primaryKey().defaultRandom(),
  ventureId: uuid('venture_id').notNull().references(() => ventures.id, { onDelete: 'cascade' }),
  batchName: text('batch_name').notNull(),                                   // "February 2026 Payroll"
  batchType: text('batch_type', { enum: ['payroll', 'vendor', 'tax', 'transfer'] }).notNull(),
  fromAccountId: uuid('from_account_id').notNull().references(() => treasuryBankAccounts.id),
  totalAmount: numeric('total_amount', { precision: 19, scale: 4 }).notNull(),
  transactionCount: integer('transaction_count').notNull(),
  effectiveDate: timestamp('effective_date', { withTimezone: true }).notNull(),
  status: text('status', { enum: ['draft', 'approved', 'submitted', 'processing', 'completed', 'failed', 'returned'] }).notNull().default('draft'),
  nachaFileUrl: text('nacha_file_url'),                                      // Generated NACHA file
  submittedAt: timestamp('submitted_at', { withTimezone: true }),
  completedAt: timestamp('completed_at', { withTimezone: true }),
  approvedBy: uuid('approved_by'),
  returnCount: integer('return_count').default(0),
  returnAmount: numeric('return_amount', { precision: 19, scale: 4 }).default('0'),
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

// treasury_ach_transactions â€” Individual ACH Transactions within a Batch
export const achTransactions = pgTable('treasury_ach_transactions', {
  id: uuid('id').primaryKey().defaultRandom(),
  batchId: uuid('batch_id').notNull().references(() => achBatches.id, { onDelete: 'cascade' }),
  cashMovementId: uuid('cash_movement_id').references(() => cashMovements.id),
  recipientName: text('recipient_name').notNull(),
  recipientRoutingNumber: text('recipient_routing_number').notNull(),         // Encrypted
  recipientAccountLast4: text('recipient_account_last4'),
  recipientAccountType: text('recipient_account_type', { enum: ['checking', 'savings'] }),
  amount: numeric('amount', { precision: 19, scale: 4 }).notNull(),
  transactionCode: text('transaction_code').notNull(),                        // NACHA SEC code
  traceNumber: text('trace_number'),
  addendaRecord: text('addenda_record'),
  status: text('status', { enum: ['pending', 'processed', 'returned', 'corrected'] }).notNull().default('pending'),
  returnCode: text('return_code'),                                            // R01, R02, etc.
  returnReason: text('return_reason'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

// treasury_fx_positions â€” Foreign Exchange Positions
export const fxPositions = pgTable('treasury_fx_positions', {
  id: uuid('id').primaryKey().defaultRandom(),
  ventureId: uuid('venture_id').references(() => ventures.id),              // NULL = consolidated
  currency: text('currency').notNull(),                                      // ISO 4217: CAD, EUR, GBP, etc.
  balanceLocal: numeric('balance_local', { precision: 19, scale: 4 }).notNull(), // Balance in local currency
  balanceUsd: numeric('balance_usd', { precision: 19, scale: 4 }).notNull(),     // USD equivalent
  exchangeRate: numeric('exchange_rate', { precision: 12, scale: 6 }).notNull(),
  unrealizedGainLoss: numeric('unrealized_gain_loss', { precision: 19, scale: 4 }).default('0'),
  hedged: boolean('hedged').default(false),
  hedgeInstrument: text('hedge_instrument'),                                 // Forward contract ID, etc.
  asOfDate: timestamp('as_of_date', { withTimezone: true }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

// treasury_fx_transactions â€” FX Conversion Transactions
export const fxTransactions = pgTable('treasury_fx_transactions', {
  id: uuid('id').primaryKey().defaultRandom(),
  ventureId: uuid('venture_id').notNull().references(() => ventures.id, { onDelete: 'cascade' }),
  cashMovementId: uuid('cash_movement_id').references(() => cashMovements.id),
  fromCurrency: text('from_currency').notNull(),
  toCurrency: text('to_currency').notNull(),
  fromAmount: numeric('from_amount', { precision: 19, scale: 4 }).notNull(),
  toAmount: numeric('to_amount', { precision: 19, scale: 4 }).notNull(),
  exchangeRate: numeric('exchange_rate', { precision: 12, scale: 6 }).notNull(),
  spotRate: numeric('spot_rate', { precision: 12, scale: 6 }),              // Market spot rate at time
  spreadBps: numeric('spread_bps', { precision: 8, scale: 2 }),            // Bank spread in basis points
  feeAmount: numeric('fee_amount', { precision: 19, scale: 4 }).default('0'),
  realizedGainLoss: numeric('realized_gain_loss', { precision: 19, scale: 4 }).default('0'),
  purpose: text('purpose'),
  provider: text('provider'),                                                // Bank, Wise, OFX, etc.
  executedAt: timestamp('executed_at', { withTimezone: true }).notNull(),
  settledAt: timestamp('settled_at', { withTimezone: true }),
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});
```

### Core Interface

```typescript
export class CashService {
  // â”€â”€ Bank Account Management â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  registerBankAccount(input: CreateBankAccountInput): Promise<TreasuryBankAccount>;
  updateBankAccount(accountId: string, input: Partial<CreateBankAccountInput>): Promise<TreasuryBankAccount>;
  closeBankAccount(accountId: string, reason: string): Promise<TreasuryBankAccount>;
  listBankAccounts(filters?: { ventureId?: string; accountType?: string; status?: string }): Promise<TreasuryBankAccount[]>;
  syncBankBalance(accountId: string): Promise<TreasuryBankAccount>;
  syncAllBalances(): Promise<SyncResult>;

  // â”€â”€ Cash Position â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  getConsolidatedPosition(asOfDate?: Date): Promise<ConsolidatedCashPosition>;
  getVenturePosition(ventureId: string, asOfDate?: Date): Promise<VentureCashPosition>;
  getPositionHistory(filters: { ventureId?: string; startDate: Date; endDate: Date }): Promise<CashPosition[]>;
  snapshotDailyPositions(): Promise<CashPosition[]>;  // Cron: runs at EOD

  // â”€â”€ Cash Movements â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  recordMovement(input: RecordCashMovementInput): Promise<CashMovement>;
  recordInterCompanyTransfer(input: InterCompanyTransferInput): Promise<{ sourceMovement: CashMovement; targetMovement: CashMovement }>;
  getMovements(filters: CashMovementFilters): Promise<PaginatedResult<CashMovement>>;
  getMovementsByCategory(ventureId: string, startDate: Date, endDate: Date): Promise<CategoryBreakdown[]>;

  // â”€â”€ Runway & Burn Rate â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  calculateBurnRate(ventureId?: string, lookbackDays?: number): Promise<BurnRateResult>;
  calculateRunway(ventureId?: string): Promise<RunwayResult>;
  getRunwayProjection(months: number): Promise<RunwayProjection>;
}

export class CashForecastService {
  // â”€â”€ Forecasting â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  generateForecast(input: CashForecastInput): Promise<CashForecast>;
  getForecastVsActual(forecastId: string): Promise<ForecastComparison>;
  listForecasts(filters?: { ventureId?: string; status?: string }): Promise<CashForecast[]>;
  supersedesForecast(forecastId: string, newForecastId: string): Promise<void>;
  getLatestForecast(ventureId?: string): Promise<CashForecast | null>;
  backTestForecast(forecastId: string): Promise<BackTestResult>;
}

export class SweepService {
  // â”€â”€ Sweep Account Management â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  createSweepRule(input: SweepRuleInput): Promise<SweepAccount>;
  updateSweepRule(sweepId: string, input: Partial<SweepRuleInput>): Promise<SweepAccount>;
  deactivateSweep(sweepId: string): Promise<SweepAccount>;
  executeSweep(sweepId: string): Promise<SweepTransaction>;
  executeAllDueSweeps(): Promise<SweepTransaction[]>;  // Cron: runs nightly
  getSweepHistory(sweepId: string): Promise<SweepTransaction[]>;
}

export class CashPoolingService {
  // â”€â”€ Cash Pool Management â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  createPool(input: CashPoolInput): Promise<CashPool>;
  addParticipant(poolId: string, input: CashPoolContributionInput): Promise<CashPoolAllocation>;
  removeParticipant(poolId: string, ventureId: string): Promise<void>;
  calculateInterest(poolId: string, period: string): Promise<InterestAllocation[]>;
  getPoolBalance(poolId: string): Promise<CashPoolBalance>;
}
```

### Key Behaviors

1. **Daily position snapshots**: A cron job at 23:59 UTC snapshots every bank account's balance and calculates consolidated positions per venture and globally. This creates the time-series data that powers the cash position chart.
2. **Burn rate calculation**: Rolling 30-day average of all outflows (excluding transfers and one-time items) divided by 30. Runway = current cash Ã· daily burn rate.
3. **Sweep execution**: When a sweep rule triggers (balance threshold exceeded or on schedule), the system creates a `cashMovement` record of type `sweep`, executes the bank transfer via `@mcv/connectors`, and records the result in `sweepTransactions`.
4. **Inter-company transfer tracking**: Every transfer between ventures creates two mirror `cashMovement` records â€” one outflow from the source venture, one inflow to the target. Both are tagged `isInterCompany: true` with cross-references via `counterpartyVentureId`. These feed into the elimination engine in the P&L module.
5. **FX position management**: Non-USD balances are tracked with daily exchange rate snapshots. Unrealized gains/losses are calculated daily. FX conversions record the realized gain/loss based on the difference between the historical rate (when the position was acquired) and the conversion rate.
6. **Cash pooling interest**: Interest earned on the pool is allocated to participants based on the configured method (pro rata by contribution, tiered rates, or flat rate). Interest allocations create `cashMovement` records.
7. **Minimum balance alerts**: When any account drops below its configured `minimumBalance`, a notification is sent to the CFO and the venture's finance lead via `@mcv/notifications`.

---

## Module: funding

### Purpose

Manages the capital lifecycle for MCV ventures â€” from seed funding through Series rounds to potential IPO. This module is the single source of truth for who owns what, how much has been raised, what instruments are outstanding, and how distributions flow through the waterfall.

For a multi-venture consortium, funding complexity is real: different ventures may be at different stages (BetEdge at Series A, SerpSpace bootstrapped, Futurestate seeking seed), each with its own cap table, investor base, and instrument mix. The treasury funding module unifies this under one roof while maintaining venture-level isolation.

### Database Schema

```typescript
// treasury_funding_rounds_v2 â€” Funding Rounds (Enhanced)
export const fundingRoundsV2 = pgTable('treasury_funding_rounds_v2', {
  id: uuid('id').primaryKey().defaultRandom(),
  ventureId: uuid('venture_id').notNull().references(() => ventures.id, { onDelete: 'cascade' }),
  roundName: text('round_name').notNull(),                                   // "BetEdge Series A"
  roundType: roundTypeEnum('round_type').notNull(),                          // pre_seed | seed | series_a | series_b | series_c | bridge | ipo
  status: text('status', { enum: ['planning', 'active', 'closing', 'closed', 'cancelled'] }).notNull().default('planning'),
  targetAmount: numeric('target_amount', { precision: 19, scale: 4 }).notNull(),
  minimumAmount: numeric('minimum_amount', { precision: 19, scale: 4 }),     // Minimum viable raise
  raisedAmount: numeric('raised_amount', { precision: 19, scale: 4 }).default('0'),
  currency: text('currency').notNull().default('USD'),
  preMoneyValuation: numeric('pre_money_valuation', { precision: 19, scale: 4 }),
  postMoneyValuation: numeric('post_money_valuation', { precision: 19, scale: 4 }),
  pricePerShare: numeric('price_per_share', { precision: 19, scale: 8 }),
  shareClass: text('share_class'),                                           // "Series A Preferred"
  sharesAuthorized: numeric('shares_authorized', { precision: 19, scale: 0 }),
  sharesIssued: numeric('shares_issued', { precision: 19, scale: 0 }).default('0'),
  leadInvestor: text('lead_investor'),
  leadInvestorId: uuid('lead_investor_id').references(() => investors.id),
  termSheetUrl: text('term_sheet_url'),
  termSheetSignedAt: timestamp('term_sheet_signed_at', { withTimezone: true }),
  closingDate: timestamp('closing_date', { withTimezone: true }),
  legalCounsel: text('legal_counsel'),
  boardSeatsOffered: integer('board_seats_offered').default(0),
  antiDilutionProvision: text('anti_dilution_provision', { enum: ['none', 'full_ratchet', 'weighted_average_broad', 'weighted_average_narrow'] }),
  liquidationPreference: numeric('liquidation_preference', { precision: 6, scale: 2 }).default('1.00'), // 1x, 2x, etc.
  participatingPreferred: boolean('participating_preferred').default(false),
  dividendRate: numeric('dividend_rate', { precision: 6, scale: 4 }),
  proRataRights: boolean('pro_rata_rights').default(true),
  dragAlongThreshold: numeric('drag_along_threshold', { precision: 5, scale: 2 }), // % required
  notes: text('notes'),
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

// treasury_investors â€” Investor Registry
export const investors = pgTable('treasury_investors', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),                                              // "Sequoia Capital" or "John Doe"
  type: text('type', { enum: ['institutional', 'corporate', 'angel', 'family_office', 'strategic', 'employee', 'founder'] }).notNull(),
  contactName: text('contact_name'),
  contactEmail: text('contact_email'),
  contactPhone: text('contact_phone'),
  entityName: text('entity_name'),                                           // Legal entity name
  entityType: text('entity_type'),                                           // LLC, LP, Corp, Trust, Individual
  taxId: text('tax_id'),                                                     // Encrypted EIN/SSN
  accreditedStatus: text('accredited_status', { enum: ['accredited', 'qualified_purchaser', 'non_accredited', 'pending_verification'] }),
  accreditedVerifiedAt: timestamp('accredited_verified_at', { withTimezone: true }),
  address: jsonb('address'),
  bankDetails: jsonb('bank_details'),                                        // Encrypted wire instructions
  kycStatus: text('kyc_status', { enum: ['pending', 'approved', 'rejected', 'expired'] }).default('pending'),
  kycCompletedAt: timestamp('kyc_completed_at', { withTimezone: true }),
  kycExpiresAt: timestamp('kyc_expires_at', { withTimezone: true }),
  amlCheckStatus: text('aml_check_status', { enum: ['pending', 'cleared', 'flagged'] }).default('pending'),
  totalInvested: numeric('total_invested', { precision: 19, scale: 4 }).default('0'),
  totalDistributed: numeric('total_distributed', { precision: 19, scale: 4 }).default('0'),
  portalAccessEnabled: boolean('portal_access_enabled').default(false),
  portalUserId: uuid('portal_user_id'),
  tags: text('tags').array(),
  notes: text('notes'),
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

// treasury_investor_entities â€” Investor Legal Entities (one investor may have multiple)
export const investorEntities = pgTable('treasury_investor_entities', {
  id: uuid('id').primaryKey().defaultRandom(),
  investorId: uuid('investor_id').notNull().references(() => investors.id, { onDelete: 'cascade' }),
  entityName: text('entity_name').notNull(),
  entityType: text('entity_type').notNull(),
  jurisdiction: text('jurisdiction'),
  taxId: text('tax_id'),                                                     // Encrypted
  isPrimary: boolean('is_primary').default(false),
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

// treasury_funding_round_investors â€” Investor Participation Per Round
export const fundingRoundInvestors = pgTable('treasury_funding_round_investors', {
  id: uuid('id').primaryKey().defaultRandom(),
  roundId: uuid('round_id').notNull().references(() => fundingRoundsV2.id, { onDelete: 'cascade' }),
  investorId: uuid('investor_id').notNull().references(() => investors.id),
  investorEntityId: uuid('investor_entity_id').references(() => investorEntities.id),
  commitmentAmount: numeric('commitment_amount', { precision: 19, scale: 4 }).notNull(),
  fundedAmount: numeric('funded_amount', { precision: 19, scale: 4 }).default('0'),
  sharesIssued: numeric('shares_issued', { precision: 19, scale: 0 }).default('0'),
  instrumentType: instrumentTypeEnum('instrument_type').notNull(),           // equity | safe | convertible_note | warrant
  instrumentId: uuid('instrument_id'),                                       // Links to SAFE or convertible note
  sideLetterUrl: text('side_letter_url'),
  proRataRights: boolean('pro_rata_rights').default(false),
  boardSeat: boolean('board_seat').default(false),
  informationRights: boolean('information_rights').default(true),
  status: text('status', { enum: ['committed', 'funded', 'partially_funded', 'cancelled'] }).notNull().default('committed'),
  fundedAt: timestamp('funded_at', { withTimezone: true }),
  notes: text('notes'),
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

// treasury_safe_agreements â€” SAFE (Simple Agreement for Future Equity) Agreements
export const safeAgreements = pgTable('treasury_safe_agreements', {
  id: uuid('id').primaryKey().defaultRandom(),
  ventureId: uuid('venture_id').notNull().references(() => ventures.id, { onDelete: 'cascade' }),
  investorId: uuid('investor_id').notNull().references(() => investors.id),
  roundId: uuid('round_id').references(() => fundingRoundsV2.id),
  safeType: safeTypeEnum('safe_type').notNull(),                             // post_money | pre_money | mfn | pro_rata
  investmentAmount: numeric('investment_amount', { precision: 19, scale: 4 }).notNull(),
  valuationCap: numeric('valuation_cap', { precision: 19, scale: 4 }),
  discountRate: numeric('discount_rate', { precision: 6, scale: 4 }),        // e.g., 0.20 for 20% discount
  mfnProvision: boolean('mfn_provision').default(false),                     // Most Favored Nation
  proRataRights: boolean('pro_rata_rights').default(false),
  conversionTrigger: text('conversion_trigger', { enum: ['equity_financing', 'liquidity_event', 'dissolution', 'maturity'] }),
  status: text('status', { enum: ['active', 'converted', 'cancelled', 'expired'] }).notNull().default('active'),
  issuedAt: timestamp('issued_at', { withTimezone: true }).notNull(),
  convertedAt: timestamp('converted_at', { withTimezone: true }),
  conversionRoundId: uuid('conversion_round_id').references(() => fundingRoundsV2.id),
  conversionShares: numeric('conversion_shares', { precision: 19, scale: 0 }),
  conversionPricePerShare: numeric('conversion_price_per_share', { precision: 19, scale: 8 }),
  documentUrl: text('document_url'),
  notes: text('notes'),
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

// treasury_convertible_notes â€” Convertible Note Instruments
export const convertibleNotes = pgTable('treasury_convertible_notes', {
  id: uuid('id').primaryKey().defaultRandom(),
  ventureId: uuid('venture_id').notNull().references(() => ventures.id, { onDelete: 'cascade' }),
  investorId: uuid('investor_id').notNull().references(() => investors.id),
  roundId: uuid('round_id').references(() => fundingRoundsV2.id),
  principalAmount: numeric('principal_amount', { precision: 19, scale: 4 }).notNull(),
  interestRate: numeric('interest_rate', { precision: 6, scale: 4 }).notNull(),   // Annual rate
  interestAccrued: numeric('interest_accrued', { precision: 19, scale: 4 }).default('0'),
  compoundingFrequency: text('compounding_frequency', { enum: ['simple', 'monthly', 'quarterly', 'annually'] }).default('simple'),
  valuationCap: numeric('valuation_cap', { precision: 19, scale: 4 }),
  discountRate: numeric('discount_rate', { precision: 6, scale: 4 }),
  maturityDate: timestamp('maturity_date', { withTimezone: true }).notNull(),
  qualifiedFinancingThreshold: numeric('qualified_financing_threshold', { precision: 19, scale: 4 }),
  autoConvertAtMaturity: boolean('auto_convert_at_maturity').default(false),
  maturityConversionCap: numeric('maturity_conversion_cap', { precision: 19, scale: 4 }),
  status: text('status', { enum: ['active', 'converted', 'repaid', 'defaulted', 'extended'] }).notNull().default('active'),
  issuedAt: timestamp('issued_at', { withTimezone: true }).notNull(),
  convertedAt: timestamp('converted_at', { withTimezone: true }),
  conversionRoundId: uuid('conversion_round_id').references(() => fundingRoundsV2.id),
  conversionShares: numeric('conversion_shares', { precision: 19, scale: 0 }),
  conversionPricePerShare: numeric('conversion_price_per_share', { precision: 19, scale: 8 }),
  repaidAt: timestamp('repaid_at', { withTimezone: true }),
  repaidAmount: numeric('repaid_amount', { precision: 19, scale: 4 }),
  documentUrl: text('document_url'),
  notes: text('notes'),
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

// treasury_cap_table_entries â€” Cap Table Line Items
export const capTableEntries = pgTable('treasury_cap_table_entries', {
  id: uuid('id').primaryKey().defaultRandom(),
  ventureId: uuid('venture_id').notNull().references(() => ventures.id, { onDelete: 'cascade' }),
  investorId: uuid('investor_id').references(() => investors.id),
  holderName: text('holder_name').notNull(),                                 // May be non-investor (founder, employee)
  holderType: text('holder_type', { enum: ['founder', 'investor', 'employee', 'advisor', 'option_pool'] }).notNull(),
  shareClassId: uuid('share_class_id').references(() => shareClasses.id),
  sharesOwned: numeric('shares_owned', { precision: 19, scale: 0 }).notNull(),
  sharesVested: numeric('shares_vested', { precision: 19, scale: 0 }).default('0'),
  sharesUnvested: numeric('shares_unvested', { precision: 19, scale: 0 }).default('0'),
  ownershipPercent: numeric('ownership_percent', { precision: 8, scale: 6 }),    // Calculated
  fullyDilutedPercent: numeric('fully_diluted_percent', { precision: 8, scale: 6 }),
  costBasis: numeric('cost_basis', { precision: 19, scale: 4 }).default('0'),
  pricePerShare: numeric('price_per_share', { precision: 19, scale: 8 }),
  vestingScheduleId: uuid('vesting_schedule_id').references(() => vestingSchedules.id),
  roundId: uuid('round_id').references(() => fundingRoundsV2.id),
  grantDate: timestamp('grant_date', { withTimezone: true }),
  exercisePrice: numeric('exercise_price', { precision: 19, scale: 8 }),     // For options
  expirationDate: timestamp('expiration_date', { withTimezone: true }),       // For options
  isActive: boolean('is_active').default(true),
  notes: text('notes'),
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

// treasury_cap_table_snapshots â€” Point-in-Time Cap Table Snapshots
export const capTableSnapshots = pgTable('treasury_cap_table_snapshots', {
  id: uuid('id').primaryKey().defaultRandom(),
  ventureId: uuid('venture_id').notNull().references(() => ventures.id, { onDelete: 'cascade' }),
  snapshotDate: timestamp('snapshot_date', { withTimezone: true }).notNull(),
  snapshotName: text('snapshot_name').notNull(),                              // "Pre-Series A" or "2026-02-01"
  triggerEvent: text('trigger_event'),                                        // round_close | year_end | manual
  totalSharesOutstanding: numeric('total_shares_outstanding', { precision: 19, scale: 0 }).notNull(),
  totalSharesFullyDiluted: numeric('total_shares_fully_diluted', { precision: 19, scale: 0 }).notNull(),
  optionPoolShares: numeric('option_pool_shares', { precision: 19, scale: 0 }).default('0'),
  optionPoolPercent: numeric('option_pool_percent', { precision: 8, scale: 6 }),
  impliedValuation: numeric('implied_valuation', { precision: 19, scale: 4 }),
  entries: jsonb('entries'),                                                  // Serialized cap table at that point
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

// treasury_share_classes â€” Share Class Definitions
export const shareClasses = pgTable('treasury_share_classes', {
  id: uuid('id').primaryKey().defaultRandom(),
  ventureId: uuid('venture_id').notNull().references(() => ventures.id, { onDelete: 'cascade' }),
  className: text('class_name').notNull(),                                   // "Common" | "Series A Preferred"
  classType: text('class_type', { enum: ['common', 'preferred', 'restricted'] }).notNull(),
  votesPerShare: numeric('votes_per_share', { precision: 6, scale: 2 }).default('1'),
  liquidationPreference: numeric('liquidation_preference', { precision: 6, scale: 2 }).default('0'),
  participationCap: numeric('participation_cap', { precision: 6, scale: 2 }),
  dividendRate: numeric('dividend_rate', { precision: 6, scale: 4 }),
  dividendType: text('dividend_type', { enum: ['cumulative', 'non_cumulative', 'none'] }).default('none'),
  conversionRatio: numeric('conversion_ratio', { precision: 10, scale: 6 }).default('1'),
  antiDilutionType: text('anti_dilution_type', { enum: ['none', 'full_ratchet', 'weighted_average'] }).default('none'),
  authorizedShares: numeric('authorized_shares', { precision: 19, scale: 0 }).notNull(),
  issuedShares: numeric('issued_shares', { precision: 19, scale: 0 }).default('0'),
  parValue: numeric('par_value', { precision: 19, scale: 8 }).default('0.0001'),
  seniorityRank: integer('seniority_rank').default(0),                       // Higher = more senior in waterfall
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

// treasury_share_issuances â€” Share Issuance Records
export const shareIssuances = pgTable('treasury_share_issuances', {
  id: uuid('id').primaryKey().defaultRandom(),
  ventureId: uuid('venture_id').notNull().references(() => ventures.id, { onDelete: 'cascade' }),
  capTableEntryId: uuid('cap_table_entry_id').references(() => capTableEntries.id),
  shareClassId: uuid('share_class_id').notNull().references(() => shareClasses.id),
  roundId: uuid('round_id').references(() => fundingRoundsV2.id),
  recipientName: text('recipient_name').notNull(),
  recipientType: text('recipient_type', { enum: ['founder', 'investor', 'employee', 'advisor'] }).notNull(),
  sharesIssued: numeric('shares_issued', { precision: 19, scale: 0 }).notNull(),
  pricePerShare: numeric('price_per_share', { precision: 19, scale: 8 }).notNull(),
  totalConsideration: numeric('total_consideration', { precision: 19, scale: 4 }),
  issuanceType: text('issuance_type', { enum: ['purchase', 'grant', 'conversion', 'exercise', 'bonus'] }).notNull(),
  boardApprovalDate: timestamp('board_approval_date', { withTimezone: true }),
  issuedAt: timestamp('issued_at', { withTimezone: true }).notNull(),
  certificateNumber: text('certificate_number'),
  restrictionLegend: text('restriction_legend'),
  section83bFiled: boolean('section_83b_filed').default(false),
  section83bFiledAt: timestamp('section_83b_filed_at', { withTimezone: true }),
  notes: text('notes'),
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

// treasury_vesting_schedules â€” Vesting Schedule Configurations
export const vestingSchedules = pgTable('treasury_vesting_schedules', {
  id: uuid('id').primaryKey().defaultRandom(),
  ventureId: uuid('venture_id').notNull().references(() => ventures.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),                                              // "Standard 4-Year Vesting"
  vestingType: vestingTypeEnum('vesting_type').notNull(),                     // time_based | milestone | hybrid
  totalShares: numeric('total_shares', { precision: 19, scale: 0 }).notNull(),
  vestingStartDate: timestamp('vesting_start_date', { withTimezone: true }).notNull(),
  cliffMonths: integer('cliff_months').default(12),                          // 12-month cliff standard
  cliffPercent: numeric('cliff_percent', { precision: 6, scale: 4 }).default('0.25'), // 25% at cliff
  totalVestingMonths: integer('total_vesting_months').default(48),           // 4 years standard
  vestingFrequency: text('vesting_frequency', { enum: ['monthly', 'quarterly', 'annually'] }).default('monthly'),
  accelerationOnSingleTrigger: boolean('acceleration_on_single_trigger').default(false),
  accelerationOnDoubleTrigger: boolean('acceleration_on_double_trigger').default(true),
  accelerationPercent: numeric('acceleration_percent', { precision: 6, scale: 4 }),
  milestones: jsonb('milestones'),                                           // For milestone-based vesting
  // [{ name: 'MVP Launch', percent: 0.10, completedAt: null }, ...]
  currentVestedPercent: numeric('current_vested_percent', { precision: 6, scale: 4 }).default('0'),
  nextVestDate: timestamp('next_vest_date', { withTimezone: true }),
  fullyVestedAt: timestamp('fully_vested_at', { withTimezone: true }),
  status: text('status', { enum: ['active', 'completed', 'terminated', 'accelerated'] }).notNull().default('active'),
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

// treasury_vesting_events â€” Vesting Milestone Events
export const vestingEvents = pgTable('treasury_vesting_events', {
  id: uuid('id').primaryKey().defaultRandom(),
  vestingScheduleId: uuid('vesting_schedule_id').notNull().references(() => vestingSchedules.id, { onDelete: 'cascade' }),
  eventDate: timestamp('event_date', { withTimezone: true }).notNull(),
  eventType: text('event_type', { enum: ['cliff', 'periodic', 'milestone', 'acceleration', 'termination'] }).notNull(),
  sharesVested: numeric('shares_vested', { precision: 19, scale: 0 }).notNull(),
  cumulativeVested: numeric('cumulative_vested', { precision: 19, scale: 0 }).notNull(),
  vestedPercent: numeric('vested_percent', { precision: 6, scale: 4 }).notNull(),
  milestoneName: text('milestone_name'),
  isProjected: boolean('is_projected').default(false),                       // True for future events
  notes: text('notes'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

// treasury_dilution_models â€” Dilution Scenario Models
export const dilutionModels = pgTable('treasury_dilution_models', {
  id: uuid('id').primaryKey().defaultRandom(),
  ventureId: uuid('venture_id').notNull().references(() => ventures.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),                                              // "Series A Impact Analysis"
  baseCapTableSnapshotId: uuid('base_cap_table_snapshot_id').references(() => capTableSnapshots.id),
  assumptions: jsonb('assumptions').notNull(),
  // { newShares: 1000000, pricePerShare: 5.00, optionPoolIncrease: 200000,
  //   safeConversions: [{ safeId: 'uuid', conversionPrice: 4.00 }],
  //   noteConversions: [{ noteId: 'uuid', conversionPrice: 3.50, accruedInterest: 25000 }] }
  results: jsonb('results'),
  // { preMoneyOwnership: { founders: 60%, seed: 15%, pool: 10%, ... },
  //   postMoneyOwnership: { founders: 45%, seed: 11%, seriesA: 25%, pool: 12%, ... },
  //   founderDilution: 25%, totalDilution: 40% }
  isActive: boolean('is_active').default(true),
  createdBy: uuid('created_by'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

// treasury_distribution_waterfalls â€” Waterfall Calculation Records
export const distributionWaterfalls = pgTable('treasury_distribution_waterfalls', {
  id: uuid('id').primaryKey().defaultRandom(),
  ventureId: uuid('venture_id').notNull().references(() => ventures.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),                                              // "Acquisition at $50M"
  exitValuation: numeric('exit_valuation', { precision: 19, scale: 4 }).notNull(),
  exitType: text('exit_type', { enum: ['acquisition', 'ipo', 'dissolution', 'secondary'] }).notNull(),
  transactionCosts: numeric('transaction_costs', { precision: 19, scale: 4 }).default('0'),
  escrowHoldback: numeric('escrow_holdback', { precision: 19, scale: 4 }).default('0'),
  distributableProceeds: numeric('distributable_proceeds', { precision: 19, scale: 4 }),
  tiers: jsonb('tiers').notNull(),
  // [{ tierName: 'Liquidation Preference â€” Series A', shareClass: 'Series A Preferred',
  //    amount: 5000000, recipients: [{ name: 'Sequoia', amount: 3000000, percent: 60 }, ...] },
  //  { tierName: 'Participation', shareClass: 'Series A Preferred', amount: 2000000, ... },
  //  { tierName: 'Remaining to Common', shareClass: 'Common', amount: 43000000, ... }]
  summaryByHolder: jsonb('summary_by_holder'),                               // { 'Sequoia': { total: 8M, multiple: 2.67x } }
  capTableSnapshotId: uuid('cap_table_snapshot_id').references(() => capTableSnapshots.id),
  createdBy: uuid('created_by'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

// treasury_investor_reports â€” Investor Reporting Packages
export const investorReports = pgTable('treasury_investor_reports', {
  id: uuid('id').primaryKey().defaultRandom(),
  ventureId: uuid('venture_id').references(() => ventures.id),               // NULL = consortium-level
  reportPeriod: text('report_period').notNull(),                             // "2026-Q1" or "2026-01"
  reportType: text('report_type', { enum: ['monthly', 'quarterly', 'annual', 'ad_hoc'] }).notNull(),
  title: text('title').notNull(),
  status: text('status', { enum: ['draft', 'review', 'approved', 'sent'] }).notNull().default('draft'),
  content: jsonb('content'),
  // { executiveSummary: '...', financialHighlights: { revenue: X, burn: X, runway: X },
  //   kpis: [...], milestones: [...], askItems: [...] }
  pdfUrl: text('pdf_url'),
  sentAt: timestamp('sent_at', { withTimezone: true }),
  sentTo: jsonb('sent_to'),                                                  // [{ investorId, email, openedAt }]
  approvedBy: uuid('approved_by'),
  approvedAt: timestamp('approved_at', { withTimezone: true }),
  createdBy: uuid('created_by'),
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

// treasury_investor_communications â€” Investor Communication Log
export const investorCommunications = pgTable('treasury_investor_communications', {
  id: uuid('id').primaryKey().defaultRandom(),
  investorId: uuid('investor_id').notNull().references(() => investors.id),
  ventureId: uuid('venture_id').references(() => ventures.id),
  communicationType: text('communication_type', { enum: ['email', 'meeting', 'call', 'report', 'document'] }).notNull(),
  subject: text('subject').notNull(),
  content: text('content'),
  direction: text('direction', { enum: ['outbound', 'inbound'] }).notNull(),
  attachments: jsonb('attachments'),
  sentBy: uuid('sent_by'),
  sentAt: timestamp('sent_at', { withTimezone: true }),
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});
```

### Core Interface

```typescript
export class FundingService {
  // â”€â”€ Funding Rounds â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  createRound(input: CreateFundingRoundInput): Promise<FundingRoundV2>;
  updateRound(roundId: string, input: Partial<CreateFundingRoundInput>): Promise<FundingRoundV2>;
  openRound(roundId: string): Promise<FundingRoundV2>;
  closeRound(roundId: string, closingDate?: Date): Promise<FundingRoundV2>;
  cancelRound(roundId: string, reason: string): Promise<FundingRoundV2>;
  getRound(roundId: string): Promise<FundingRoundV2>;
  listRounds(filters?: { ventureId?: string; status?: string; roundType?: string }): Promise<FundingRoundV2[]>;
  getRoundSummary(roundId: string): Promise<FundingRoundSummary>;

  // â”€â”€ Investor Commitments â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  recordCommitment(roundId: string, input: InvestorCommitmentInput): Promise<FundingRoundInvestor>;
  recordFunding(commitmentId: string, amount: string, wireReference: string): Promise<FundingRoundInvestor>;
  getCommitments(roundId: string): Promise<FundingRoundInvestor[]>;

  // â”€â”€ SAFE Agreements â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  createSAFE(input: CreateSAFEInput): Promise<SAFEAgreement>;
  convertSAFE(safeId: string, roundId: string, conversionPrice: string): Promise<{ safe: SAFEAgreement; shares: ShareIssuance }>;
  getActiveSAFEs(ventureId: string): Promise<SAFEAgreement[]>;
  calculateSAFEConversion(safeId: string, pricePerShare: string, preMoneyValuation: string): Promise<SAFEConversionResult>;

  // â”€â”€ Convertible Notes â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  createConvertibleNote(input: CreateConvertibleNoteInput): Promise<ConvertibleNote>;
  accrueInterest(noteId: string, asOfDate?: Date): Promise<ConvertibleNote>;
  convertNote(noteId: string, roundId: string, conversionPrice: string): Promise<{ note: ConvertibleNote; shares: ShareIssuance }>;
  repayNote(noteId: string, amount: string, reference: string): Promise<ConvertibleNote>;
  getActiveNotes(ventureId: string): Promise<ConvertibleNote[]>;
}

export class CapTableService {
  // â”€â”€ Cap Table â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  getCapTable(ventureId: string): Promise<CapTableView>;
  getFullyDilutedCapTable(ventureId: string): Promise<CapTableView>;
  snapshotCapTable(ventureId: string, input: CapTableSnapshotInput): Promise<CapTableSnapshot>;
  getSnapshotHistory(ventureId: string): Promise<CapTableSnapshot[]>;
  compareSnapshots(snapshotId1: string, snapshotId2: string): Promise<SnapshotComparison>;

  // â”€â”€ Share Management â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  createShareClass(ventureId: string, input: ShareClassInput): Promise<ShareClass>;
  issueShares(input: ShareIssuanceInput): Promise<ShareIssuance>;
  transferShares(input: ShareTransferInput): Promise<{ from: CapTableEntry; to: CapTableEntry }>;
  cancelShares(entryId: string, sharesCount: string, reason: string): Promise<CapTableEntry>;

  // â”€â”€ Dilution Modeling â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  modelDilution(ventureId: string, input: DilutionModelInput): Promise<DilutionResult>;
  compareDilutionScenarios(modelIds: string[]): Promise<DilutionComparison>;

  // â”€â”€ Vesting â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  createVestingSchedule(input: VestingScheduleInput): Promise<VestingSchedule>;
  processVestingEvent(scheduleId: string): Promise<VestingEvent>;
  processAllDueVesting(): Promise<VestingEvent[]>;  // Cron: runs monthly
  getVestingTimeline(scheduleId: string): Promise<VestingEvent[]>;
  accelerateVesting(scheduleId: string, reason: string): Promise<VestingSchedule>;
}

export class InvestorService {
  // â”€â”€ Investor Management â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  registerInvestor(input: InvestorInput): Promise<Investor>;
  updateInvestor(investorId: string, input: Partial<InvestorInput>): Promise<Investor>;
  getInvestor(investorId: string): Promise<InvestorProfile>;
  listInvestors(filters?: { type?: string; ventureId?: string }): Promise<Investor[]>;
  verifyAccreditation(investorId: string, evidence: AccreditationEvidence): Promise<Investor>;
  runKYC(investorId: string): Promise<KYCResult>;

  // â”€â”€ Investor Reporting â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  generateReport(input: InvestorReportInput): Promise<InvestorReport>;
  sendReport(reportId: string): Promise<InvestorReport>;
  getReportHistory(ventureId?: string): Promise<InvestorReport[]>;
  logCommunication(input: CommunicationInput): Promise<InvestorCommunication>;
}

export class WaterfallService {
  // â”€â”€ Distribution Waterfall â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  calculateWaterfall(ventureId: string, input: DistributionWaterfallInput): Promise<WaterfallResult>;
  compareExitScenarios(ventureId: string, valuations: string[]): Promise<WaterfallComparison>;
  getWaterfallHistory(ventureId: string): Promise<DistributionWaterfall[]>;
}
```

### SAFE Conversion Mechanics

```
SAFE Conversion at Equity Financing (Post-Money SAFE):
â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

Given:
  Investment Amount:    $500,000
  Valuation Cap:        $10,000,000
  Discount Rate:        20%
  Series A Price:       $5.00 per share
  Pre-Money Valuation:  $15,000,000

Step 1: Calculate Cap Price
  Cap Price = Valuation Cap Ã· Fully Diluted Shares (pre-round)
  Cap Price = $10,000,000 Ã· 2,000,000 = $5.00

Step 2: Calculate Discount Price
  Discount Price = Series A Price Ã— (1 - Discount Rate)
  Discount Price = $5.00 Ã— 0.80 = $4.00

Step 3: Use Lower Price (better for investor)
  Conversion Price = min($5.00, $4.00) = $4.00

Step 4: Calculate Shares
  Shares = Investment Amount Ã· Conversion Price
  Shares = $500,000 Ã· $4.00 = 125,000 shares
```

### Distribution Waterfall Structure

```
Exit Proceeds: $50,000,000
Transaction Costs: ($2,000,000)
Escrow Holdback: ($3,000,000)
â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
Distributable: $45,000,000

â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
â”‚ Tier 1: Liquidation Preference (Series A Preferred)      â”‚
â”‚                                                          â”‚
â”‚ Series A investors get 1x liquidation preference first   â”‚
â”‚ Total invested: $5,000,000 â†’ Pay out: $5,000,000        â”‚
â”‚                                                          â”‚
â”‚ Remaining: $40,000,000                                   â”‚
â”œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¤
â”‚ Tier 2: Participation (if participating preferred)       â”‚
â”‚                                                          â”‚
â”‚ Series A participates pro-rata in remaining proceeds     â”‚
â”‚ Series A owns 25% â†’ $40M Ã— 25% = $10,000,000           â”‚
â”‚ Cap at 3x â†’ min($10M, $15M cap) = $10,000,000          â”‚
â”‚                                                          â”‚
â”‚ Remaining: $30,000,000                                   â”‚
â”œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¤
â”‚ Tier 3: Remaining to Common                              â”‚
â”‚                                                          â”‚
â”‚ All remaining proceeds distributed to common shares      â”‚
â”‚ Founders (60% of common): $18,000,000                   â”‚
â”‚ Employees (15% of common): $4,500,000                   â”‚
â”‚ Seed investors (25% of common): $7,500,000              â”‚
â”‚                                                          â”‚
â”‚ Total: $30,000,000                                       â”‚
â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
```

### Key Behaviors

1. **Round lifecycle**: Planning â†’ Active â†’ Closing â†’ Closed. Opening a round creates an investor tracking structure. Closing a round triggers cap table updates, SAFE/note conversions, and share issuances automatically.
2. **SAFE conversion priority**: When multiple SAFEs convert in the same round, the system applies conversions in order of issuance date (FIFO). MFN-eligible SAFEs inherit the best terms of any subsequent SAFE before conversion.
3. **Interest accrual**: Convertible notes accrue interest automatically via a monthly cron job. The accrued interest is added to the principal for conversion calculations.
4. **Cap table snapshots**: Automatic snapshots are taken at round close, year-end, and on demand. Snapshots store a complete serialized cap table for historical comparison.
5. **Dilution modeling**: The dilution model takes the current cap table, applies hypothetical round parameters (new shares, option pool increase, SAFE/note conversions), and produces before/after ownership percentages for every holder.
6. **Investor portal**: Investors with `portalAccessEnabled` can view their holdings, historical returns, reports, and documents through the investor portal UI.
7. **KYC/AML compliance**: Before an investor can be funded, their KYC status must be `approved` and AML check must be `cleared`. The system blocks funding operations for non-compliant investors.

---

## Module: pnl

### Purpose

Produces the consolidated financial picture of MCV Global â€” aggregating revenue, expenses, and net income across all nine ventures, eliminating inter-company transactions, and generating the reports that the CFO presents to the board.

This is not simply adding up venture P&Ls. Real consolidation requires identifying and eliminating inter-company transactions (when SerpSpace does SEO work for BetEdge, that revenue and expense must cancel out), handling currency translation for international entities, applying proper segment reporting standards, and producing variance analysis that explains *why* numbers differ from budget.

### Inter-Company Elimination Flow

```
Before Elimination:
â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

BetEdge P&L:                         SerpSpace P&L:
  Revenue: $500,000                    Revenue: $300,000
    â”œ External: $480,000                 â”œ External: $250,000
    â”” From SerpSpace: $20,000            â”” From BetEdge: $50,000
  Expenses: $400,000                   Expenses: $200,000
    â”œ External: $350,000                 â”œ External: $180,000
    â”” To SerpSpace: $50,000              â”” To BetEdge: $20,000

Simple Sum (WRONG):
  Revenue: $800,000
  Expenses: $600,000
  Net: $200,000  â† OVERSTATED

After Elimination:
â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

Eliminate inter-company:
  Revenue elimination: -$70,000 (SerpSpaceâ†’BetEdge $50K + BetEdgeâ†’SerpSpace $20K)
  Expense elimination: -$70,000 (BetEdgeâ†’SerpSpace $50K + SerpSpaceâ†’BetEdge $20K)

Consolidated P&L (CORRECT):
  Revenue: $730,000  ($800K - $70K IC)
  Expenses: $530,000 ($600K - $70K IC)
  Net: $200,000  â† Same net, but accurate gross figures
```

### Database Schema

```typescript
// treasury_consolidated_pnl â€” Consolidated P&L Records
export const consolidatedPnl = pgTable('treasury_consolidated_pnl', {
  id: uuid('id').primaryKey().defaultRandom(),
  period: text('period').notNull(),                                          // "2026-01" | "2026-Q1" | "2026"
  periodType: text('period_type', { enum: ['monthly', 'quarterly', 'annual'] }).notNull(),
  consolidationMethod: consolidationMethodEnum('consolidation_method').notNull(), // full | proportional | equity
  status: text('status', { enum: ['draft', 'preliminary', 'final', 'restated'] }).notNull().default('draft'),
  totalRevenue: numeric('total_revenue', { precision: 19, scale: 4 }).notNull(),
  totalRevenuePreElimination: numeric('total_revenue_pre_elimination', { precision: 19, scale: 4 }),
  revenueEliminations: numeric('revenue_eliminations', { precision: 19, scale: 4 }).default('0'),
  totalCogs: numeric('total_cogs', { precision: 19, scale: 4 }).default('0'),
  grossProfit: numeric('gross_profit', { precision: 19, scale: 4 }),
  grossMargin: numeric('gross_margin', { precision: 8, scale: 4 }),          // Percentage
  totalOpex: numeric('total_opex', { precision: 19, scale: 4 }).default('0'),
  totalExpenses: numeric('total_expenses', { precision: 19, scale: 4 }).notNull(),
  totalExpensesPreElimination: numeric('total_expenses_pre_elimination', { precision: 19, scale: 4 }),
  expenseEliminations: numeric('expense_eliminations', { precision: 19, scale: 4 }).default('0'),
  operatingIncome: numeric('operating_income', { precision: 19, scale: 4 }),
  otherIncome: numeric('other_income', { precision: 19, scale: 4 }).default('0'),
  otherExpenses: numeric('other_expenses', { precision: 19, scale: 4 }).default('0'),
  interestExpense: numeric('interest_expense', { precision: 19, scale: 4 }).default('0'),
  ebitda: numeric('ebitda', { precision: 19, scale: 4 }),
  depreciation: numeric('depreciation', { precision: 19, scale: 4 }).default('0'),
  amortization: numeric('amortization', { precision: 19, scale: 4 }).default('0'),
  preTaxIncome: numeric('pre_tax_income', { precision: 19, scale: 4 }),
  taxProvision: numeric('tax_provision', { precision: 19, scale: 4 }).default('0'),
  netIncome: numeric('net_income', { precision: 19, scale: 4 }).notNull(),
  netMargin: numeric('net_margin', { precision: 8, scale: 4 }),              // Percentage
  currency: text('currency').notNull().default('USD'),
  ventureCount: integer('venture_count').notNull(),                           // Number of ventures included
  consolidationRunId: uuid('consolidation_run_id').references(() => consolidationRuns.id),
  approvedBy: uuid('approved_by'),
  approvedAt: timestamp('approved_at', { withTimezone: true }),
  notes: text('notes'),
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

// treasury_consolidated_pnl_lines â€” P&L Line Items by Category
export const consolidatedPnlLines = pgTable('treasury_consolidated_pnl_lines', {
  id: uuid('id').primaryKey().defaultRandom(),
  consolidatedPnlId: uuid('consolidated_pnl_id').notNull().references(() => consolidatedPnl.id, { onDelete: 'cascade' }),
  lineType: text('line_type', { enum: ['revenue', 'cogs', 'opex', 'other_income', 'other_expense', 'tax'] }).notNull(),
  category: text('category').notNull(),                                      // "SaaS Revenue", "Payroll", "Hosting", etc.
  subcategory: text('subcategory'),
  amount: numeric('amount', { precision: 19, scale: 4 }).notNull(),
  amountPreElimination: numeric('amount_pre_elimination', { precision: 19, scale: 4 }),
  eliminationAmount: numeric('elimination_amount', { precision: 19, scale: 4 }).default('0'),
  priorPeriodAmount: numeric('prior_period_amount', { precision: 19, scale: 4 }),
  budgetAmount: numeric('budget_amount', { precision: 19, scale: 4 }),
  varianceAmount: numeric('variance_amount', { precision: 19, scale: 4 }),
  variancePercent: numeric('variance_percent', { precision: 8, scale: 4 }),
  ventureBreakdown: jsonb('venture_breakdown'),                              // { betedge: 100K, serpspace: 50K, ... }
  sortOrder: integer('sort_order').default(0),
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

// treasury_venture_segments â€” Venture Segment Definitions
export const ventureSegments = pgTable('treasury_venture_segments', {
  id: uuid('id').primaryKey().defaultRandom(),
  ventureId: uuid('venture_id').notNull().references(() => ventures.id, { onDelete: 'cascade' }),
  segmentName: text('segment_name').notNull(),                               // "Sports AI" | "SaaS" | "Services" | ...
  segmentCode: text('segment_code').notNull(),                               // "SAI" | "SAS" | "SRV"
  description: text('description'),
  revenueType: text('revenue_type', { enum: ['recurring', 'transactional', 'project', 'mixed'] }),
  industryCode: text('industry_code'),                                       // NAICS code
  reportingCurrency: text('reporting_currency').default('USD'),
  isActive: boolean('is_active').default(true),
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

// treasury_segment_results â€” Segment Financial Results
export const segmentResults = pgTable('treasury_segment_results', {
  id: uuid('id').primaryKey().defaultRandom(),
  segmentId: uuid('segment_id').notNull().references(() => ventureSegments.id, { onDelete: 'cascade' }),
  consolidatedPnlId: uuid('consolidated_pnl_id').references(() => consolidatedPnl.id),
  period: text('period').notNull(),                                          // "2026-01" | "2026-Q1"
  periodType: text('period_type', { enum: ['monthly', 'quarterly', 'annual'] }).notNull(),
  revenue: numeric('revenue', { precision: 19, scale: 4 }).default('0'),
  cogs: numeric('cogs', { precision: 19, scale: 4 }).default('0'),
  grossProfit: numeric('gross_profit', { precision: 19, scale: 4 }).default('0'),
  opex: numeric('opex', { precision: 19, scale: 4 }).default('0'),
  operatingIncome: numeric('operating_income', { precision: 19, scale: 4 }).default('0'),
  netIncome: numeric('net_income', { precision: 19, scale: 4 }).default('0'),
  revenueGrowthPercent: numeric('revenue_growth_percent', { precision: 8, scale: 4 }),
  marginPercent: numeric('margin_percent', { precision: 8, scale: 4 }),
  headcount: integer('headcount'),
  revenuePerHead: numeric('revenue_per_head', { precision: 19, scale: 4 }),
  interCompanyRevenue: numeric('inter_company_revenue', { precision: 19, scale: 4 }).default('0'),
  interCompanyExpense: numeric('inter_company_expense', { precision: 19, scale: 4 }).default('0'),
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

// treasury_inter_company_transactions â€” Inter-Company Transactions
export const interCompanyTransactions = pgTable('treasury_inter_company_transactions', {
  id: uuid('id').primaryKey().defaultRandom(),
  sourceVentureId: uuid('source_venture_id').notNull().references(() => ventures.id),
  targetVentureId: uuid('target_venture_id').notNull().references(() => ventures.id),
  transactionType: text('transaction_type', { enum: ['revenue', 'expense', 'loan', 'management_fee', 'license', 'cost_allocation'] }).notNull(),
  description: text('description').notNull(),
  amount: numeric('amount', { precision: 19, scale: 4 }).notNull(),
  currency: text('currency').notNull().default('USD'),
  transactionDate: timestamp('transaction_date', { withTimezone: true }).notNull(),
  period: text('period').notNull(),                                          // "2026-01"
  sourceAccountCode: text('source_account_code'),                            // GL account on source side
  targetAccountCode: text('target_account_code'),                            // GL account on target side
  isEliminated: boolean('is_eliminated').default(false),
  eliminationEntryId: uuid('elimination_entry_id'),
  contractReference: text('contract_reference'),                             // Inter-company agreement ref
  approvedBy: uuid('approved_by'),
  approvedAt: timestamp('approved_at', { withTimezone: true }),
  status: text('status', { enum: ['pending', 'confirmed', 'eliminated', 'disputed'] }).notNull().default('pending'),
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

// treasury_elimination_rules â€” Elimination Rule Definitions
export const eliminationRules = pgTable('treasury_elimination_rules', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),                                              // "SerpSpaceâ†’BetEdge SEO Revenue"
  eliminationType: eliminationTypeEnum('elimination_type').notNull(),         // revenue | cogs | payable | receivable | loan | equity
  sourceVentureId: uuid('source_venture_id').references(() => ventures.id),  // NULL = applies to all
  targetVentureId: uuid('target_venture_id').references(() => ventures.id),
  sourceAccountPattern: text('source_account_pattern'),                      // GL account pattern match
  targetAccountPattern: text('target_account_pattern'),
  matchingStrategy: text('matching_strategy', { enum: ['exact', 'threshold', 'manual'] }).default('exact'),
  thresholdAmount: numeric('threshold_amount', { precision: 19, scale: 4 }),  // For threshold matching
  autoApply: boolean('auto_apply').default(true),
  isActive: boolean('is_active').default(true),
  priority: integer('priority').default(0),                                   // Higher = applied first
  description: text('description'),
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

// treasury_elimination_entries â€” Applied Elimination Entries
export const eliminationEntries = pgTable('treasury_elimination_entries', {
  id: uuid('id').primaryKey().defaultRandom(),
  consolidationRunId: uuid('consolidation_run_id').references(() => consolidationRuns.id),
  eliminationRuleId: uuid('elimination_rule_id').references(() => eliminationRules.id),
  period: text('period').notNull(),
  sourceVentureId: uuid('source_venture_id').notNull().references(() => ventures.id),
  targetVentureId: uuid('target_venture_id').notNull().references(() => ventures.id),
  eliminationType: eliminationTypeEnum('elimination_type').notNull(),
  debitAccount: text('debit_account').notNull(),
  creditAccount: text('credit_account').notNull(),
  amount: numeric('amount', { precision: 19, scale: 4 }).notNull(),
  interCompanyTransactionId: uuid('inter_company_transaction_id').references(() => interCompanyTransactions.id),
  description: text('description'),
  status: text('status', { enum: ['applied', 'reversed', 'manual_override'] }).notNull().default('applied'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

// treasury_variance_reports â€” Variance Analysis Reports
export const varianceReports = pgTable('treasury_variance_reports', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),                                              // "January 2026 BvA Analysis"
  period: text('period').notNull(),
  varianceType: varianceTypeEnum('variance_type').notNull(),                  // budget_vs_actual | forecast_vs_actual | period_over_period
  ventureId: uuid('venture_id').references(() => ventures.id),               // NULL = consolidated
  consolidatedPnlId: uuid('consolidated_pnl_id').references(() => consolidatedPnl.id),
  totalFavorableVariance: numeric('total_favorable_variance', { precision: 19, scale: 4 }),
  totalUnfavorableVariance: numeric('total_unfavorable_variance', { precision: 19, scale: 4 }),
  netVariance: numeric('net_variance', { precision: 19, scale: 4 }),
  materialityThreshold: numeric('materiality_threshold', { precision: 19, scale: 4 }).default('5000'),
  materialItems: jsonb('material_items'),                                    // Items exceeding threshold
  narrative: text('narrative'),                                              // AI-generated variance explanation
  status: text('status', { enum: ['draft', 'review', 'final'] }).notNull().default('draft'),
  createdBy: uuid('created_by'),
  approvedBy: uuid('approved_by'),
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

// treasury_variance_lines â€” Variance Line Items
export const varianceLines = pgTable('treasury_variance_lines', {
  id: uuid('id').primaryKey().defaultRandom(),
  varianceReportId: uuid('variance_report_id').notNull().references(() => varianceReports.id, { onDelete: 'cascade' }),
  category: text('category').notNull(),
  subcategory: text('subcategory'),
  ventureId: uuid('venture_id').references(() => ventures.id),
  actualAmount: numeric('actual_amount', { precision: 19, scale: 4 }).notNull(),
  budgetAmount: numeric('budget_amount', { precision: 19, scale: 4 }),
  forecastAmount: numeric('forecast_amount', { precision: 19, scale: 4 }),
  priorPeriodAmount: numeric('prior_period_amount', { precision: 19, scale: 4 }),
  varianceAmount: numeric('variance_amount', { precision: 19, scale: 4 }).notNull(),
  variancePercent: numeric('variance_percent', { precision: 8, scale: 4 }),
  direction: text('direction', { enum: ['favorable', 'unfavorable', 'neutral'] }).notNull(),
  isMaterial: boolean('is_material').default(false),
  explanation: text('explanation'),
  sortOrder: integer('sort_order').default(0),
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

// treasury_management_reports â€” Management Report Records
export const managementReports = pgTable('treasury_management_reports', {
  id: uuid('id').primaryKey().defaultRandom(),
  title: text('title').notNull(),                                            // "January 2026 Management Report"
  period: text('period').notNull(),
  reportType: reportFrequencyEnum('report_type').notNull(),                   // monthly | quarterly | annual
  ventureId: uuid('venture_id').references(() => ventures.id),               // NULL = consortium
  consolidatedPnlId: uuid('consolidated_pnl_id').references(() => consolidatedPnl.id),
  content: jsonb('content'),                                                 // Structured report sections
  executiveSummary: text('executive_summary'),
  kpiDashboard: jsonb('kpi_dashboard'),
  pdfUrl: text('pdf_url'),
  status: text('status', { enum: ['draft', 'review', 'final', 'distributed'] }).notNull().default('draft'),
  distributedTo: jsonb('distributed_to'),                                    // [{ name, email, sentAt }]
  createdBy: uuid('created_by'),
  approvedBy: uuid('approved_by'),
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

// treasury_board_packages â€” Board Package Records
export const boardPackages = pgTable('treasury_board_packages', {
  id: uuid('id').primaryKey().defaultRandom(),
  title: text('title').notNull(),                                            // "Q1 2026 Board Package"
  period: text('period').notNull(),
  meetingDate: timestamp('meeting_date', { withTimezone: true }),
  consolidatedPnlId: uuid('consolidated_pnl_id').references(() => consolidatedPnl.id),
  sections: jsonb('sections'),                                               // Ordered list of package sections
  status: text('status', { enum: ['draft', 'review', 'approved', 'presented'] }).notNull().default('draft'),
  pdfUrl: text('pdf_url'),
  presentedAt: timestamp('presented_at', { withTimezone: true }),
  createdBy: uuid('created_by'),
  approvedBy: uuid('approved_by'),
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

// treasury_board_package_items â€” Board Package Line Items
export const boardPackageItems = pgTable('treasury_board_package_items', {
  id: uuid('id').primaryKey().defaultRandom(),
  boardPackageId: uuid('board_package_id').notNull().references(() => boardPackages.id, { onDelete: 'cascade' }),
  sectionName: text('section_name').notNull(),                               // "Financial Overview" | "Cash Position" | ...
  sectionType: text('section_type', { enum: ['narrative', 'table', 'chart', 'kpi', 'custom'] }).notNull(),
  content: jsonb('content'),
  sortOrder: integer('sort_order').default(0),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

// treasury_consolidation_runs â€” Consolidation Execution Log
export const consolidationRuns = pgTable('treasury_consolidation_runs', {
  id: uuid('id').primaryKey().defaultRandom(),
  period: text('period').notNull(),
  periodType: text('period_type', { enum: ['monthly', 'quarterly', 'annual'] }).notNull(),
  startedAt: timestamp('started_at', { withTimezone: true }).notNull(),
  completedAt: timestamp('completed_at', { withTimezone: true }),
  venturesIncluded: jsonb('ventures_included'),                              // [{ ventureId, name }]
  ventureCount: integer('venture_count').notNull(),
  eliminationsApplied: integer('eliminations_applied').default(0),
  eliminationTotal: numeric('elimination_total', { precision: 19, scale: 4 }).default('0'),
  currencyTranslations: jsonb('currency_translations'),                      // [{ currency, rate }]
  status: text('status', { enum: ['running', 'completed', 'failed', 'rolled_back'] }).notNull().default('running'),
  errorLog: text('error_log'),
  triggeredBy: text('triggered_by'),                                         // manual | cron | api
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

// treasury_pnl_budgets â€” P&L Budget Allocations
export const pnlBudgets = pgTable('treasury_pnl_budgets', {
  id: uuid('id').primaryKey().defaultRandom(),
  ventureId: uuid('venture_id').references(() => ventures.id),               // NULL = consolidated
  period: text('period').notNull(),
  periodType: text('period_type', { enum: ['monthly', 'quarterly', 'annual'] }).notNull(),
  category: text('category').notNull(),
  subcategory: text('subcategory'),
  budgetAmount: numeric('budget_amount', { precision: 19, scale: 4 }).notNull(),
  notes: text('notes'),
  approvedBy: uuid('approved_by'),
  approvedAt: timestamp('approved_at', { withTimezone: true }),
  version: integer('version').default(1),
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

// treasury_pnl_forecasts â€” P&L Forecast Models
export const pnlForecasts = pgTable('treasury_pnl_forecasts', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  ventureId: uuid('venture_id').references(() => ventures.id),               // NULL = consolidated
  period: text('period').notNull(),
  periodType: text('period_type', { enum: ['monthly', 'quarterly', 'annual'] }).notNull(),
  forecastRevenue: numeric('forecast_revenue', { precision: 19, scale: 4 }),
  forecastExpenses: numeric('forecast_expenses', { precision: 19, scale: 4 }),
  forecastNetIncome: numeric('forecast_net_income', { precision: 19, scale: 4 }),
  assumptions: jsonb('assumptions'),
  method: text('method', { enum: ['linear', 'seasonal', 'ml_ensemble', 'manual'] }).notNull(),
  confidenceLevel: numeric('confidence_level', { precision: 5, scale: 4 }),
  status: text('status', { enum: ['draft', 'active', 'superseded'] }).notNull().default('draft'),
  createdBy: uuid('created_by'),
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});
```

### Core Interface

```typescript
export class PnlService {
  // â”€â”€ Consolidation â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  runConsolidation(input: ConsolidatedPnlInput): Promise<ConsolidatedPnlResult>;
  getConsolidatedPnl(period: string): Promise<ConsolidatedPnl>;
  getConsolidatedPnlLines(pnlId: string): Promise<ConsolidatedPnlLine[]>;
  getPnlHistory(filters: { startPeriod: string; endPeriod: string; periodType?: string }): Promise<ConsolidatedPnl[]>;
  restatePnl(pnlId: string, adjustments: PnlAdjustment[], reason: string): Promise<ConsolidatedPnl>;
  getConsolidationRuns(filters?: { period?: string; status?: string }): Promise<ConsolidationRun[]>;
}

export class EliminationService {
  // â”€â”€ Inter-Company Eliminations â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  createRule(input: EliminationRuleInput): Promise<EliminationRule>;
  updateRule(ruleId: string, input: Partial<EliminationRuleInput>): Promise<EliminationRule>;
  deactivateRule(ruleId: string): Promise<EliminationRule>;
  listRules(filters?: { ventureId?: string; isActive?: boolean }): Promise<EliminationRule[]>;
  recordInterCompanyTransaction(input: InterCompanyTransactionInput): Promise<InterCompanyTransaction>;
  matchAndEliminate(period: string): Promise<EliminationEntry[]>;  // Auto-match and eliminate
  getEliminationEntries(period: string): Promise<EliminationEntry[]>;
  getUnmatchedTransactions(period: string): Promise<InterCompanyTransaction[]>;
  reconcileInterCompany(period: string): Promise<ReconciliationResult>;
}

export class VarianceService {
  // â”€â”€ Variance Analysis â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  runBudgetVsActual(input: BudgetVsActualInput): Promise<VarianceReport>;
  runForecastVsActual(input: VarianceAnalysisInput): Promise<VarianceReport>;
  runPeriodOverPeriod(input: VarianceAnalysisInput): Promise<VarianceReport>;
  getVarianceReport(reportId: string): Promise<VarianceReport>;
  getMaterialVariances(period: string, threshold?: number): Promise<VarianceLine[]>;
  generateNarrative(reportId: string): Promise<string>;  // AI-powered explanation
}

export class SegmentReportingService {
  // â”€â”€ Segment Reporting â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  defineSegment(input: SegmentDefinition): Promise<VentureSegment>;
  updateSegment(segmentId: string, input: Partial<SegmentDefinition>): Promise<VentureSegment>;
  getSegmentResults(filters: SegmentReportInput): Promise<SegmentResult[]>;
  getSegmentComparison(period: string): Promise<SegmentComparison>;
  getSegmentTrend(segmentId: string, periods: number): Promise<SegmentTrend>;
}

export class BoardReportService {
  // â”€â”€ Board Packages â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  createBoardPackage(input: BoardPackageInput): Promise<BoardPackage>;
  addSection(packageId: string, section: BoardPackageItemInput): Promise<BoardPackageItem>;
  generatePDF(packageId: string): Promise<string>;  // Returns PDF URL
  approveBoardPackage(packageId: string, approvedBy: string): Promise<BoardPackage>;
  createManagementReport(input: ManagementReportInput): Promise<ManagementReport>;
  distributeReport(reportId: string, recipients: string[]): Promise<ManagementReport>;
}
```

### Budget vs. Actual Variance Analysis Flow

```
Budget (set at start of year)           Actual (from consolidation)
â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€              â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

Revenue Budget: $800K                   Actual Revenue: $850K
â”œ SaaS: $500K                           â”œ SaaS: $520K (+$20K âœ“)
â”œ Services: $200K                       â”œ Services: $180K (-$20K âœ—)
â”” Licensing: $100K                      â”” Licensing: $150K (+$50K âœ“)

Expense Budget: $600K                   Actual Expenses: $620K
â”œ Payroll: $350K                        â”œ Payroll: $360K (-$10K âœ—)
â”œ Hosting: $100K                        â”œ Hosting: $90K (+$10K âœ“)
â”œ Marketing: $80K                       â”œ Marketing: $95K (-$15K âœ—)
â”” Other: $70K                           â”” Other: $75K (-$5K âœ—)

Budget Net: $200K                       Actual Net: $230K (+$30K âœ“)

Variance Summary:
  Revenue: +$50K favorable (6.25% over budget)
  Expenses: -$20K unfavorable (3.33% over budget)
  Net: +$30K favorable (15% over budget)
  Material items: Licensing (+$50K), Marketing (-$15K)
```

### Key Behaviors

1. **Monthly consolidation**: A cron job on the 5th of each month triggers consolidation for the prior month. It aggregates all venture P&L data, identifies inter-company transactions, applies elimination rules, and produces the consolidated P&L.
2. **Elimination matching**: The engine matches inter-company transactions between venture pairs. For exact matches, elimination is automatic. For threshold matches (within a configurable tolerance), the system suggests eliminations for manual review.
3. **Currency translation**: International ventures report in local currency. The consolidation engine translates to USD using the period-end exchange rate for balance sheet items and average rate for income statement items (per ASC 830).
4. **Variance thresholds**: Material variances (exceeding the configured threshold, default $5,000) are flagged and require explanation. The AI narrative generator provides initial explanations that the CFO can edit.
5. **Segment reporting**: Ventures can define multiple business segments (e.g., BetEdge has "Sports AI" and "Casino"). Segment results are reported independently and roll up to the venture total, then to the consolidated total.
6. **Board packages**: The board package builder assembles sections from multiple data sources (consolidated P&L, cash position, runway, KPIs) into a single PDF with charts and narrative. Packages follow a configurable template.
7. **Restatement support**: If errors are discovered after a period is closed, the `restatePnl` method creates a restated version while preserving the original for audit trail.

---

## Module: tax

### Purpose

Manages the complex tax compliance landscape for a multi-entity, multi-jurisdiction consortium. MCV Global has entities in multiple states (and potentially countries), each with their own tax obligations, filing deadlines, and payment schedules.

This module tracks everything from quarterly estimated tax payments to the IRS, to state-level franchise taxes, to international transfer pricing documentation required when one venture charges another for services across borders.

### Tax Architecture

```
â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
â”‚                     MCV GLOBAL TAX ARCHITECTURE                              â”‚
â”‚                                                                              â”‚
â”‚  â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”  â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”  â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”  â”‚
â”‚  â”‚   FEDERAL (IRS)       â”‚  â”‚   STATE              â”‚  â”‚  INTERNATIONAL    â”‚  â”‚
â”‚  â”‚                        â”‚  â”‚                      â”‚  â”‚                   â”‚  â”‚
â”‚  â”‚ â€¢ Corp income tax      â”‚  â”‚ â€¢ Delaware franchise â”‚  â”‚ â€¢ Transfer pricingâ”‚  â”‚
â”‚  â”‚ â€¢ Estimated payments   â”‚  â”‚ â€¢ CA corp tax        â”‚  â”‚ â€¢ Withholding tax â”‚  â”‚
â”‚  â”‚ â€¢ R&D credits          â”‚  â”‚ â€¢ NY corp tax        â”‚  â”‚ â€¢ Tax treaties    â”‚  â”‚
â”‚  â”‚ â€¢ AMT                  â”‚  â”‚ â€¢ FL (no corp tax)   â”‚  â”‚ â€¢ Permanent est.  â”‚  â”‚
â”‚  â”‚ â€¢ Form 1120            â”‚  â”‚ â€¢ Sales tax nexus    â”‚  â”‚ â€¢ GILTI/BEAT      â”‚  â”‚
â”‚  â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¬â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜  â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¬â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜  â””â”€â”€â”€â”€â”€â”€â”€â”€â”¬â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜  â”‚
â”‚             â”‚                           â”‚                       â”‚              â”‚
â”‚             â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¼â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜              â”‚
â”‚                                         â”‚                                     â”‚
â”‚                              â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â–¼â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”                          â”‚
â”‚                              â”‚   TAX PROVISION      â”‚                          â”‚
â”‚                              â”‚   (ASC 740)          â”‚                          â”‚
â”‚                              â”‚                      â”‚                          â”‚
â”‚                              â”‚ Current tax expense  â”‚                          â”‚
â”‚                              â”‚ Deferred tax assets  â”‚                          â”‚
â”‚                              â”‚ Deferred tax liabs   â”‚                          â”‚
â”‚                              â”‚ Effective tax rate    â”‚                          â”‚
â”‚                              â”‚ Rate reconciliation  â”‚                          â”‚
â”‚                              â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜                          â”‚
â”‚                                                                               â”‚
â”‚  Tax Calendar: 50+ deadlines/year across all jurisdictions                    â”‚
â”‚  Estimated Payments: 16+ quarterly payments (4 federal + 4 per state entity)  â”‚
â”‚  Transfer Pricing: Documentation for all inter-company transactions           â”‚
â”‚  R&D Credits: Activity tracking across ventures for federal/state credits     â”‚
â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
```

### Database Schema

```typescript
// treasury_tax_entities â€” Tax Entity Registrations
export const taxEntities = pgTable('treasury_tax_entities', {
  id: uuid('id').primaryKey().defaultRandom(),
  ventureId: uuid('venture_id').notNull().references(() => ventures.id, { onDelete: 'cascade' }),
  entityName: text('entity_name').notNull(),                                 // "BetEdge Inc." | "MCV Global Holdings LLC"
  entityType: taxEntityTypeEnum('entity_type').notNull(),                     // c_corp | s_corp | llc | partnership | sole_prop | foreign
  ein: text('ein'),                                                          // Encrypted â€” Federal EIN
  stateId: text('state_id'),                                                 // Encrypted â€” State tax ID
  incorporationState: text('incorporation_state'),                           // Delaware, etc.
  incorporationDate: timestamp('incorporation_date', { withTimezone: true }),
  fiscalYearEnd: text('fiscal_year_end').default('12-31'),                   // MM-DD
  taxClassification: text('tax_classification'),                             // Disregarded, partnership, C-corp, etc.
  parentEntityId: uuid('parent_entity_id').references(() => taxEntities.id), // For consolidated groups
  isConsolidatedParent: boolean('is_consolidated_parent').default(false),
  registeredAgent: text('registered_agent'),
  status: text('status', { enum: ['active', 'dissolved', 'merged', 'suspended'] }).notNull().default('active'),
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

// treasury_tax_jurisdictions â€” Jurisdiction Configurations
export const taxJurisdictions = pgTable('treasury_tax_jurisdictions', {
  id: uuid('id').primaryKey().defaultRandom(),
  jurisdictionCode: text('jurisdiction_code').notNull().unique(),             // "US-FED" | "US-DE" | "US-CA" | "CA-FED"
  jurisdictionName: text('jurisdiction_name').notNull(),                      // "United States â€” Federal" | "Delaware"
  jurisdictionType: text('jurisdiction_type', { enum: ['federal', 'state', 'local', 'international'] }).notNull(),
  country: text('country').notNull().default('US'),
  stateCode: text('state_code'),                                             // 2-letter state code
  corporateTaxRate: numeric('corporate_tax_rate', { precision: 8, scale: 6 }),
  hasFranchiseTax: boolean('has_franchise_tax').default(false),
  franchiseTaxRate: numeric('franchise_tax_rate', { precision: 8, scale: 6 }),
  hasSalesTax: boolean('has_sales_tax').default(false),
  salesTaxRate: numeric('sales_tax_rate', { precision: 8, scale: 6 }),
  filingDeadlines: jsonb('filing_deadlines'),                                // { annual: 'MM-DD', quarterly: ['MM-DD', ...] }
  estimatedPaymentDates: jsonb('estimated_payment_dates'),                   // ['04-15', '06-15', '09-15', '01-15']
  extensions: jsonb('extensions'),                                           // { duration: '6 months', deadlineWithExtension: 'MM-DD' }
  notes: text('notes'),
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

// treasury_tax_entity_jurisdictions â€” Entity-Jurisdiction Mappings
export const taxEntityJurisdictions = pgTable('treasury_tax_entity_jurisdictions', {
  id: uuid('id').primaryKey().defaultRandom(),
  taxEntityId: uuid('tax_entity_id').notNull().references(() => taxEntities.id, { onDelete: 'cascade' }),
  jurisdictionId: uuid('jurisdiction_id').notNull().references(() => taxJurisdictions.id),
  nexusType: text('nexus_type', { enum: ['physical', 'economic', 'voluntary', 'statutory'] }),
  registrationDate: timestamp('registration_date', { withTimezone: true }),
  filingStatus: filingStatusEnum('filing_status').notNull().default('active'), // active | exempt | suspended
  exemptionReason: text('exemption_reason'),
  apportionmentPercent: numeric('apportionment_percent', { precision: 8, scale: 6 }),
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

// treasury_estimated_tax_payments â€” Estimated Tax Payments
export const estimatedTaxPayments = pgTable('treasury_estimated_tax_payments', {
  id: uuid('id').primaryKey().defaultRandom(),
  taxEntityId: uuid('tax_entity_id').notNull().references(() => taxEntities.id, { onDelete: 'cascade' }),
  jurisdictionId: uuid('jurisdiction_id').notNull().references(() => taxJurisdictions.id),
  taxYear: integer('tax_year').notNull(),
  quarter: integer('quarter').notNull(),                                     // 1-4
  dueDate: timestamp('due_date', { withTimezone: true }).notNull(),
  estimatedAmount: numeric('estimated_amount', { precision: 19, scale: 4 }).notNull(),
  paidAmount: numeric('paid_amount', { precision: 19, scale: 4 }).default('0'),
  paymentDate: timestamp('payment_date', { withTimezone: true }),
  paymentMethod: text('payment_method', { enum: ['eftps', 'check', 'ach', 'wire', 'online'] }),
  confirmationNumber: text('confirmation_number'),
  underpaymentPenalty: numeric('underpayment_penalty', { precision: 19, scale: 4 }).default('0'),
  status: text('status', { enum: ['scheduled', 'paid', 'overdue', 'waived'] }).notNull().default('scheduled'),
  notes: text('notes'),
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

// treasury_tax_calendar_events â€” Tax Calendar Events/Deadlines
export const taxCalendarEvents = pgTable('treasury_tax_calendar_events', {
  id: uuid('id').primaryKey().defaultRandom(),
  taxEntityId: uuid('tax_entity_id').references(() => taxEntities.id),       // NULL = consortium-level
  jurisdictionId: uuid('jurisdiction_id').references(() => taxJurisdictions.id),
  eventName: text('event_name').notNull(),                                   // "Q1 Federal Estimated Payment"
  eventType: text('event_type', { enum: ['filing_deadline', 'payment_deadline', 'extension_deadline', 'compliance_deadline', 'meeting', 'review'] }).notNull(),
  dueDate: timestamp('due_date', { withTimezone: true }).notNull(),
  reminderDays: integer('reminder_days').default(14),                        // Days before due to alert
  reminderSent: boolean('reminder_sent').default(false),
  isRecurring: boolean('is_recurring').default(false),
  recurrenceRule: text('recurrence_rule'),                                    // iCal RRULE format
  status: text('status', { enum: ['upcoming', 'in_progress', 'completed', 'overdue', 'extended'] }).notNull().default('upcoming'),
  completedAt: timestamp('completed_at', { withTimezone: true }),
  completedBy: uuid('completed_by'),
  assignedTo: uuid('assigned_to'),
  priority: text('priority', { enum: ['low', 'medium', 'high', 'critical'] }).default('medium'),
  notes: text('notes'),
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

// treasury_transfer_pricing_studies â€” Transfer Pricing Studies
export const transferPricingStudies = pgTable('treasury_transfer_pricing_studies', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),                                              // "2026 SerpSpaceâ†’BetEdge SEO Services TP Study"
  taxYear: integer('tax_year').notNull(),
  sourceEntityId: uuid('source_entity_id').notNull().references(() => taxEntities.id),
  targetEntityId: uuid('target_entity_id').notNull().references(() => taxEntities.id),
  transactionType: text('transaction_type', { enum: ['services', 'licensing', 'cost_sharing', 'financing', 'tangible_goods'] }).notNull(),
  method: transferPricingMethodEnum('method').notNull(),                      // cup | resale_price | cost_plus | tnmm | profit_split
  description: text('description'),
  totalTransactionValue: numeric('total_transaction_value', { precision: 19, scale: 4 }),
  armLengthRange: jsonb('arm_length_range'),                                 // { low: 3.5%, median: 5.2%, high: 7.1% }
  appliedRate: numeric('applied_rate', { precision: 8, scale: 4 }),
  benchmarkStudyUrl: text('benchmark_study_url'),
  documentationUrl: text('documentation_url'),
  status: text('status', { enum: ['draft', 'in_progress', 'completed', 'reviewed'] }).notNull().default('draft'),
  reviewedBy: uuid('reviewed_by'),
  reviewedAt: timestamp('reviewed_at', { withTimezone: true }),
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

// treasury_transfer_pricing_transactions â€” TP Inter-Company Transactions
export const transferPricingTransactions = pgTable('treasury_transfer_pricing_transactions', {
  id: uuid('id').primaryKey().defaultRandom(),
  studyId: uuid('study_id').notNull().references(() => transferPricingStudies.id, { onDelete: 'cascade' }),
  interCompanyTransactionId: uuid('inter_company_transaction_id').references(() => interCompanyTransactions.id),
  transactionDate: timestamp('transaction_date', { withTimezone: true }).notNull(),
  description: text('description').notNull(),
  amount: numeric('amount', { precision: 19, scale: 4 }).notNull(),
  currency: text('currency').notNull().default('USD'),
  appliedMarkup: numeric('applied_markup', { precision: 8, scale: 4 }),
  armLengthAmount: numeric('arm_length_amount', { precision: 19, scale: 4 }),
  adjustmentRequired: boolean('adjustment_required').default(false),
  adjustmentAmount: numeric('adjustment_amount', { precision: 19, scale: 4 }),
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

// treasury_transfer_pricing_benchmarks â€” TP Comparable Benchmarks
export const transferPricingBenchmarks = pgTable('treasury_transfer_pricing_benchmarks', {
  id: uuid('id').primaryKey().defaultRandom(),
  studyId: uuid('study_id').notNull().references(() => transferPricingStudies.id, { onDelete: 'cascade' }),
  comparableName: text('comparable_name').notNull(),                          // Company or transaction name
  industry: text('industry'),
  profitMargin: numeric('profit_margin', { precision: 8, scale: 4 }),
  operatingMargin: numeric('operating_margin', { precision: 8, scale: 4 }),
  netMargin: numeric('net_margin', { precision: 8, scale: 4 }),
  dataSource: text('data_source'),                                           // "BvD Orbis" | "S&P Capital IQ"
  dataYear: integer('data_year'),
  isSelected: boolean('is_selected').default(false),                         // Included in final range
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

// treasury_rd_credits â€” R&D Tax Credit Records
export const rdCredits = pgTable('treasury_rd_credits', {
  id: uuid('id').primaryKey().defaultRandom(),
  taxEntityId: uuid('tax_entity_id').notNull().references(() => taxEntities.id, { onDelete: 'cascade' }),
  jurisdictionId: uuid('jurisdiction_id').notNull().references(() => taxJurisdictions.id),
  taxYear: integer('tax_year').notNull(),
  creditType: taxCreditTypeEnum('credit_type').notNull(),                     // federal_rd | state_rd | other
  qualifiedResearchExpenses: numeric('qualified_research_expenses', { precision: 19, scale: 4 }),
  baseAmount: numeric('base_amount', { precision: 19, scale: 4 }),
  creditRate: numeric('credit_rate', { precision: 8, scale: 6 }),
  creditAmount: numeric('credit_amount', { precision: 19, scale: 4 }),
  method: text('method', { enum: ['regular', 'alternative_simplified'] }).default('alternative_simplified'),
  status: text('status', { enum: ['draft', 'calculated', 'claimed', 'audited'] }).notNull().default('draft'),
  form6765Url: text('form_6765_url'),                                        // IRS Form 6765
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

// treasury_rd_credit_activities â€” R&D Qualifying Activities
export const rdCreditActivities = pgTable('treasury_rd_credit_activities', {
  id: uuid('id').primaryKey().defaultRandom(),
  rdCreditId: uuid('rd_credit_id').notNull().references(() => rdCredits.id, { onDelete: 'cascade' }),
  ventureId: uuid('venture_id').notNull().references(() => ventures.id),
  activityName: text('activity_name').notNull(),                             // "AI Model Training Pipeline"
  activityDescription: text('activity_description'),
  qualificationBasis: text('qualification_basis'),                           // Why this qualifies as R&D
  employeeCount: integer('employee_count'),
  wages: numeric('wages', { precision: 19, scale: 4 }),
  supplies: numeric('supplies', { precision: 19, scale: 4 }),
  contractResearch: numeric('contract_research', { precision: 19, scale: 4 }),
  totalExpense: numeric('total_expense', { precision: 19, scale: 4 }),
  period: text('period').notNull(),
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

// treasury_withholding_tax_records â€” Withholding Tax Records
export const withholdingTaxRecords = pgTable('treasury_withholding_tax_records', {
  id: uuid('id').primaryKey().defaultRandom(),
  taxEntityId: uuid('tax_entity_id').notNull().references(() => taxEntities.id),
  payeeType: text('payee_type', { enum: ['employee', 'contractor', 'investor', 'foreign_entity'] }).notNull(),
  payeeName: text('payee_name').notNull(),
  payeeTaxId: text('payee_tax_id'),                                          // Encrypted
  paymentType: text('payment_type', { enum: ['salary', 'dividend', 'interest', 'royalty', 'service_fee'] }).notNull(),
  grossAmount: numeric('gross_amount', { precision: 19, scale: 4 }).notNull(),
  withholdingRate: numeric('withholding_rate', { precision: 8, scale: 6 }).notNull(),
  withholdingAmount: numeric('withholding_amount', { precision: 19, scale: 4 }).notNull(),
  treatyBenefitApplied: boolean('treaty_benefit_applied').default(false),
  treatyCountry: text('treaty_country'),
  formType: text('form_type'),                                               // W-2, 1099-NEC, 1099-DIV, 1042-S
  reportedAt: timestamp('reported_at', { withTimezone: true }),
  period: text('period').notNull(),
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

// treasury_tax_provisions â€” Tax Provision Calculations (ASC 740)
export const taxProvisions = pgTable('treasury_tax_provisions', {
  id: uuid('id').primaryKey().defaultRandom(),
  period: text('period').notNull(),                                          // "2026-Q1"
  periodType: text('period_type', { enum: ['quarterly', 'annual'] }).notNull(),
  preTaxBookIncome: numeric('pre_tax_book_income', { precision: 19, scale: 4 }).notNull(),
  permanentDifferences: numeric('permanent_differences', { precision: 19, scale: 4 }).default('0'),
  temporaryDifferences: numeric('temporary_differences', { precision: 19, scale: 4 }).default('0'),
  taxableIncome: numeric('taxable_income', { precision: 19, scale: 4 }),
  currentTaxExpense: numeric('current_tax_expense', { precision: 19, scale: 4 }),
  deferredTaxExpense: numeric('deferred_tax_expense', { precision: 19, scale: 4 }),
  totalTaxProvision: numeric('total_tax_provision', { precision: 19, scale: 4 }),
  effectiveTaxRate: numeric('effective_tax_rate', { precision: 8, scale: 6 }),
  statutoryRate: numeric('statutory_rate', { precision: 8, scale: 6 }).default('0.21'), // 21% federal
  rateReconciliation: jsonb('rate_reconciliation'),
  // { statutory: 21%, stateNet: 4.2%, rdCredit: -1.5%, permanentDiffs: 0.3%, effective: 24% }
  valuationAllowance: numeric('valuation_allowance', { precision: 19, scale: 4 }).default('0'),
  status: text('status', { enum: ['draft', 'review', 'final'] }).notNull().default('draft'),
  reviewedBy: uuid('reviewed_by'),
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

// treasury_tax_provision_components â€” Provision Components (Current/Deferred)
export const taxProvisionComponents = pgTable('treasury_tax_provision_components', {
  id: uuid('id').primaryKey().defaultRandom(),
  provisionId: uuid('provision_id').notNull().references(() => taxProvisions.id, { onDelete: 'cascade' }),
  jurisdictionId: uuid('jurisdiction_id').notNull().references(() => taxJurisdictions.id),
  componentType: text('component_type', { enum: ['current', 'deferred'] }).notNull(),
  taxableIncome: numeric('taxable_income', { precision: 19, scale: 4 }),
  taxRate: numeric('tax_rate', { precision: 8, scale: 6 }),
  taxAmount: numeric('tax_amount', { precision: 19, scale: 4 }).notNull(),
  credits: numeric('credits', { precision: 19, scale: 4 }).default('0'),
  netTax: numeric('net_tax', { precision: 19, scale: 4 }),
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

// treasury_deferred_tax_items â€” Deferred Tax Assets/Liabilities
export const deferredTaxItems = pgTable('treasury_deferred_tax_items', {
  id: uuid('id').primaryKey().defaultRandom(),
  provisionId: uuid('provision_id').references(() => taxProvisions.id),
  taxEntityId: uuid('tax_entity_id').notNull().references(() => taxEntities.id),
  itemName: text('item_name').notNull(),                                     // "Depreciation" | "NOL Carryforward" | "Stock Comp"
  itemType: text('item_type', { enum: ['asset', 'liability'] }).notNull(),
  bookBasis: numeric('book_basis', { precision: 19, scale: 4 }),
  taxBasis: numeric('tax_basis', { precision: 19, scale: 4 }),
  temporaryDifference: numeric('temporary_difference', { precision: 19, scale: 4 }).notNull(),
  taxRate: numeric('tax_rate', { precision: 8, scale: 6 }),
  deferredTaxAmount: numeric('deferred_tax_amount', { precision: 19, scale: 4 }).notNull(),
  valuationAllowance: numeric('valuation_allowance', { precision: 19, scale: 4 }).default('0'),
  netAmount: numeric('net_amount', { precision: 19, scale: 4 }),
  reversalPeriod: text('reversal_period'),                                   // Expected reversal timing
  period: text('period').notNull(),
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

// treasury_tax_returns â€” Tax Return Records
export const taxReturns = pgTable('treasury_tax_returns', {
  id: uuid('id').primaryKey().defaultRandom(),
  taxEntityId: uuid('tax_entity_id').notNull().references(() => taxEntities.id),
  jurisdictionId: uuid('jurisdiction_id').notNull().references(() => taxJurisdictions.id),
  taxYear: integer('tax_year').notNull(),
  returnType: text('return_type', { enum: ['original', 'amended', 'extension'] }).notNull(),
  formNumber: text('form_number'),                                           // "1120" | "1065" | "CT-3"
  filingDeadline: timestamp('filing_deadline', { withTimezone: true }).notNull(),
  extendedDeadline: timestamp('extended_deadline', { withTimezone: true }),
  filedAt: timestamp('filed_at', { withTimezone: true }),
  taxableIncome: numeric('taxable_income', { precision: 19, scale: 4 }),
  taxLiability: numeric('tax_liability', { precision: 19, scale: 4 }),
  taxPaid: numeric('tax_paid', { precision: 19, scale: 4 }),
  refundDue: numeric('refund_due', { precision: 19, scale: 4 }),
  status: text('status', { enum: ['not_started', 'in_progress', 'review', 'filed', 'accepted', 'rejected'] }).notNull().default('not_started'),
  preparedBy: text('prepared_by'),
  reviewedBy: uuid('reviewed_by'),
  filingUrl: text('filing_url'),                                             // Signed return PDF
  confirmationNumber: text('confirmation_number'),
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

// treasury_tax_return_workpapers â€” Return Workpaper Attachments
export const taxReturnWorkpapers = pgTable('treasury_tax_return_workpapers', {
  id: uuid('id').primaryKey().defaultRandom(),
  taxReturnId: uuid('tax_return_id').notNull().references(() => taxReturns.id, { onDelete: 'cascade' }),
  workpaperName: text('workpaper_name').notNull(),
  workpaperType: text('workpaper_type', { enum: ['schedule', 'supporting', 'reconciliation', 'election'] }).notNull(),
  fileUrl: text('file_url'),
  notes: text('notes'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

// treasury_consolidated_tax_data â€” Consolidated Tax Data
export const consolidatedTaxData = pgTable('treasury_consolidated_tax_data', {
  id: uuid('id').primaryKey().defaultRandom(),
  taxYear: integer('tax_year').notNull(),
  period: text('period'),                                                    // "2026-Q1" or "2026"
  consolidatedTaxableIncome: numeric('consolidated_taxable_income', { precision: 19, scale: 4 }),
  totalFederalTax: numeric('total_federal_tax', { precision: 19, scale: 4 }),
  totalStateTax: numeric('total_state_tax', { precision: 19, scale: 4 }),
  totalInternationalTax: numeric('total_international_tax', { precision: 19, scale: 4 }),
  totalTaxLiability: numeric('total_tax_liability', { precision: 19, scale: 4 }),
  totalTaxPaid: numeric('total_tax_paid', { precision: 19, scale: 4 }),
  totalTaxCredits: numeric('total_tax_credits', { precision: 19, scale: 4 }),
  effectiveTaxRate: numeric('effective_tax_rate', { precision: 8, scale: 6 }),
  ventureBreakdown: jsonb('venture_breakdown'),                              // { betedge: { taxable: X, tax: Y }, ... }
  jurisdictionBreakdown: jsonb('jurisdiction_breakdown'),                     // { 'US-FED': X, 'US-DE': Y, ... }
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

// treasury_tax_audit_trail â€” Tax-Specific Audit Trail
export const taxAuditTrail = pgTable('treasury_tax_audit_trail', {
  id: uuid('id').primaryKey().defaultRandom(),
  taxEntityId: uuid('tax_entity_id').references(() => taxEntities.id),
  action: text('action').notNull(),                                          // "payment_submitted" | "return_filed" | "provision_approved"
  actorId: uuid('actor_id'),
  resourceType: text('resource_type').notNull(),
  resourceId: uuid('resource_id').notNull(),
  previousValue: jsonb('previous_value'),
  newValue: jsonb('new_value'),
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});
```

### Core Interface

```typescript
export class TaxService {
  // â”€â”€ Tax Entity Management â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  registerEntity(input: CreateTaxEntityInput): Promise<TaxEntity>;
  updateEntity(entityId: string, input: Partial<CreateTaxEntityInput>): Promise<TaxEntity>;
  getEntity(entityId: string): Promise<TaxEntity>;
  listEntities(filters?: { ventureId?: string; status?: string }): Promise<TaxEntity[]>;
  registerJurisdiction(entityId: string, input: TaxJurisdictionInput): Promise<TaxEntityJurisdiction>;

  // â”€â”€ Estimated Tax Payments â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  scheduleEstimatedPayment(input: EstimatedPaymentInput): Promise<EstimatedTaxPayment>;
  recordPayment(paymentId: string, paidAmount: string, confirmationNumber: string): Promise<EstimatedTaxPayment>;
  getPaymentSchedule(entityId: string, taxYear: number): Promise<EstimatedTaxPayment[]>;
  getOverduePayments(): Promise<EstimatedTaxPayment[]>;
  calculateSafeHarborAmount(entityId: string, jurisdictionId: string, taxYear: number): Promise<SafeHarborResult>;

  // â”€â”€ Tax Returns â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  createTaxReturn(input: TaxReturnInput): Promise<TaxReturn>;
  updateReturnStatus(returnId: string, status: string): Promise<TaxReturn>;
  fileReturn(returnId: string, filingUrl: string, confirmationNumber: string): Promise<TaxReturn>;
  getReturnsByYear(taxYear: number): Promise<TaxReturn[]>;
  getPendingReturns(): Promise<TaxReturn[]>;
}

export class TaxCalendarService {
  // â”€â”€ Calendar Management â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  createEvent(input: TaxCalendarEventInput): Promise<TaxCalendarEvent>;
  updateEvent(eventId: string, input: Partial<TaxCalendarEventInput>): Promise<TaxCalendarEvent>;
  completeEvent(eventId: string, completedBy: string): Promise<TaxCalendarEvent>;
  getUpcoming(daysAhead?: number): Promise<TaxCalendarEvent[]>;
  getOverdue(): Promise<TaxCalendarEvent[]>;
  generateAnnualCalendar(taxYear: number): Promise<TaxCalendarEvent[]>;  // Auto-populate standard deadlines
  sendReminders(): Promise<void>;  // Cron: runs daily
}

export class TransferPricingService {
  // â”€â”€ Transfer Pricing â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  createStudy(input: TransferPricingStudyInput): Promise<TransferPricingStudy>;
  updateStudy(studyId: string, input: Partial<TransferPricingStudyInput>): Promise<TransferPricingStudy>;
  recordTransaction(input: TransferPricingTransactionInput): Promise<TransferPricingTransaction>;
  addBenchmark(studyId: string, benchmark: BenchmarkInput): Promise<TransferPricingBenchmark>;
  calculateArmLengthRange(studyId: string): Promise<ArmLengthRange>;
  getStudiesByYear(taxYear: number): Promise<TransferPricingStudy[]>;
  validateCompliance(studyId: string): Promise<ComplianceResult>;
}

export class TaxCreditService {
  // â”€â”€ R&D Tax Credits â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  createRDCredit(entityId: string, taxYear: number, input: RDCreditInput): Promise<RDCredit>;
  addQualifyingActivity(creditId: string, activity: RDActivityInput): Promise<RDCreditActivity>;
  calculateCredit(creditId: string): Promise<RDCreditCalculation>;
  getCredits(entityId: string, taxYear?: number): Promise<RDCredit[]>;
  getTotalCredits(taxYear: number): Promise<TotalCreditSummary>;
}

export class TaxProvisionService {
  // â”€â”€ ASC 740 Tax Provision â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  generateProvision(input: TaxProvisionInput): Promise<TaxProvision>;
  updateProvision(provisionId: string, input: Partial<TaxProvisionInput>): Promise<TaxProvision>;
  addDeferredItem(input: DeferredTaxItemInput): Promise<DeferredTaxItem>;
  calculateEffectiveTaxRate(period: string): Promise<EffectiveTaxRate>;
  generateRateReconciliation(provisionId: string): Promise<TaxReconciliation>;
  getProvisionHistory(filters?: { startPeriod: string; endPeriod: string }): Promise<TaxProvision[]>;
  approveProvision(provisionId: string, reviewedBy: string): Promise<TaxProvision>;
  recordWithholding(input: WithholdingTaxInput): Promise<WithholdingTaxRecord>;
}
```

### Key Behaviors

1. **Annual calendar generation**: At the start of each tax year, the system auto-generates all known filing deadlines and estimated payment dates for every entity-jurisdiction combination. Reminders fire 14 days before each deadline.
2. **Safe harbor calculations**: For estimated tax payments, the system calculates the safe harbor amount (100% or 110% of prior year tax, depending on income level) to ensure entities avoid underpayment penalties.
3. **Transfer pricing documentation**: Every inter-company transaction recorded in the P&L module is cross-referenced with transfer pricing studies. Transactions outside the arm's length range are flagged for review.
4. **R&D credit computation**: Uses either the regular or alternative simplified credit method per IRC Â§41. Qualifying activities across all ventures are aggregated per tax entity.
5. **Tax provision (ASC 740)**: Quarterly provisions calculate current and deferred tax expense by jurisdiction, apply R&D credits, and reconcile the effective tax rate to the statutory rate with detailed reconciliation items.
6. **Consolidated returns**: For entities filing consolidated returns, the system aggregates income, applies intercompany eliminations (from the P&L module), and allocates tax liability to member entities.
7. **Audit trail**: Every tax-related action (payments, filings, provision changes) is logged with actor, timestamp, and before/after values. This is separate from the general audit log to ensure SOX compliance readiness.

---

## Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `TREASURY_VENTURE_NOT_FOUND` | 404 | Venture not found in treasury context |
| `TREASURY_BANK_ACCOUNT_NOT_FOUND` | 404 | Bank account does not exist |
| `TREASURY_INSUFFICIENT_BALANCE` | 400 | Insufficient balance for operation |
| `TREASURY_SWEEP_BELOW_MINIMUM` | 400 | Sweep amount below minimum threshold |
| `TREASURY_DUPLICATE_MOVEMENT` | 409 | Duplicate cash movement detected |
| `TREASURY_FORECAST_OVERLAP` | 409 | Forecast period overlaps existing active forecast |
| `TREASURY_ROUND_NOT_ACTIVE` | 400 | Funding round is not in active status |
| `TREASURY_ROUND_OVERSUBSCRIBED` | 400 | Commitment would exceed round target |
| `TREASURY_INVESTOR_KYC_REQUIRED` | 403 | Investor must complete KYC before funding |
| `TREASURY_INVESTOR_NOT_ACCREDITED` | 403 | Investor accreditation not verified |
| `TREASURY_SAFE_ALREADY_CONVERTED` | 400 | SAFE has already been converted |
| `TREASURY_NOTE_MATURED` | 400 | Convertible note has passed maturity |
| `TREASURY_CONSOLIDATION_IN_PROGRESS` | 409 | Consolidation already running for period |
| `TREASURY_PERIOD_ALREADY_CLOSED` | 400 | Cannot modify a closed period |
| `TREASURY_ELIMINATION_MISMATCH` | 400 | Inter-company amounts do not reconcile |
| `TREASURY_TAX_ENTITY_NOT_FOUND` | 404 | Tax entity does not exist |
| `TREASURY_TAX_PAYMENT_OVERDUE` | 400 | Estimated payment is past due |
| `TREASURY_TP_OUT_OF_RANGE` | 400 | Transaction price outside arm's length range |
| `TREASURY_PROVISION_LOCKED` | 400 | Tax provision has been finalized |
| `TREASURY_UNAUTHORIZED` | 403 | Insufficient permissions for treasury operation |
| `TREASURY_RATE_LIMIT` | 429 | Too many treasury API calls |

---

## Security Considerations

### Access Control

1. **Role-based access**: Treasury operations require `treasury:admin` or `treasury:viewer` roles. Write operations (record payments, close rounds, file returns) require `treasury:admin`.
2. **Super-admin only**: Cross-venture consolidation, tax provisioning, and transfer pricing are restricted to MCV super-admins with explicit `treasury:*` scope.
3. **Dual approval**: Wire transfers above $25,000, estimated tax payments, and funding round closings require dual approval (requested + approved by different users).
4. **Investor data isolation**: Investor portal users can only see their own holdings, reports, and communications. They cannot access other investors' data or internal treasury operations.

### Data Encryption

1. **At rest**: All tax IDs (EIN, SSN), bank routing numbers, and investor bank details are encrypted using AES-256-GCM before storage.
2. **In transit**: All API calls require TLS 1.3. Webhook deliveries use HMAC-SHA256 signing.
3. **Key rotation**: Encryption keys rotate quarterly. Old keys are retained for decryption of historical data.

### Compliance

1. **SOX readiness**: Complete audit trail for all financial mutations with actor, timestamp, IP, and before/after values.
2. **SOC 2 Type II**: Access logs retained for 7 years. Automated access reviews quarterly.
3. **IRS compliance**: Estimated payment records include EFTPS confirmation numbers. Tax return filings include e-file confirmation.
4. **Transfer pricing documentation**: Studies and benchmarks stored per OECD guidelines with 7-year retention.

---

## Cron Jobs

| Job | Schedule | Description |
|-----|----------|-------------|
| `treasury:cash:snapshot-positions` | Daily 23:59 UTC | Snapshot all bank account balances and calculate consolidated positions |
| `treasury:cash:sync-bank-feeds` | Every 6 hours | Sync bank balances via Plaid and record new transactions |
| `treasury:cash:execute-sweeps` | Daily 23:00 UTC | Execute all due sweep account transfers |
| `treasury:cash:update-fx-rates` | Daily 06:00 UTC | Fetch latest FX rates and update positions |
| `treasury:cash:generate-forecast` | Weekly Monday 08:00 UTC | Auto-generate weekly cash forecast |
| `treasury:funding:accrue-interest` | Monthly 1st 00:00 UTC | Accrue interest on all active convertible notes |
| `treasury:funding:process-vesting` | Monthly 1st 00:00 UTC | Process all due vesting events |
| `treasury:pnl:monthly-consolidation` | Monthly 5th 06:00 UTC | Run consolidation for prior month |
| `treasury:pnl:variance-analysis` | Monthly 5th 08:00 UTC | Auto-generate variance reports after consolidation |
| `treasury:tax:send-reminders` | Daily 08:00 UTC | Send reminders for upcoming tax deadlines (14-day lookahead) |
| `treasury:tax:check-overdue` | Daily 09:00 UTC | Flag overdue payments and filings, alert CFO |
| `treasury:tax:quarterly-provision` | Quarterly (Apr/Jul/Oct/Jan 10th) | Generate quarterly tax provision |

---

## Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| @mcv/kernel | workspace | Core database, utilities, config, RLS |
| @mcv/finance | workspace | Venture-level P&L data, invoicing feeds |
| @mcv/portfolio | workspace | Venture/entity data, org chart, legal entities |
| @mcv/connectors | workspace | Bank feeds (Plaid), payment processors |
| @mcv/web3-core | workspace | Crypto treasury, Solana wallets, EDGE token |
| @mcv/notifications | workspace | Tax deadline alerts, investor updates, CFO notifications |
| @mcv/documents | workspace | PDF generation (board packages, tax filings, investor reports) |
| @mcv/payments | workspace | Stripe Connect, wire/ACH processing |
| drizzle-orm | ^0.35.x | ORM for PostgreSQL |
| drizzle-orm/pg-core | ^0.35.x | PostgreSQL column types and table builder |
| date-fns | ^3.x | Date manipulation for tax calendars and periods |
| decimal.js | ^10.x | Precise decimal arithmetic for financial calculations |
| plaid | ^20.x | Bank feed integration |
| openrouter-ai | ^1.x | AI-powered cash forecasting and variance narratives |

---

## Testing

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { cashService, fundingService, pnlService, taxService } from '@mcv/treasury';

describe('Cash Position Aggregation', () => {
  it('calculates consolidated position across all ventures', async () => {
    const position = await cashService.getConsolidatedPosition();

    expect(position.totalBalance).toBeDefined();
    expect(position.ventureBreakdown).toHaveLength(9);
    expect(position.currencyBreakdown).toContainKey('USD');
    expect(position.runwayDays).toBeGreaterThan(0);
  });

  it('handles inter-company transfers as zero-net', async () => {
    const before = await cashService.getConsolidatedPosition();

    await cashService.recordInterCompanyTransfer({
      sourceVentureId: betedgeId,
      targetVentureId: serpspaceId,
      amount: '50000',
      description: 'SEO services payment',
    });

    const after = await cashService.getConsolidatedPosition();
    expect(after.totalBalance).toBe(before.totalBalance); // Zero net impact
  });
});

describe('Funding Round Lifecycle', () => {
  it('creates and closes a Series A round', async () => {
    const round = await fundingService.createRound({
      ventureId: betedgeId,
      roundName: 'BetEdge Series A',
      roundType: 'series_a',
      targetAmount: '5000000',
      preMoneyValuation: '15000000',
    });

    expect(round.status).toBe('planning');

    await fundingService.openRound(round.id);
    await fundingService.recordCommitment(round.id, {
      investorId: sequoiaId,
      commitmentAmount: '3000000',
      instrumentType: 'equity',
    });

    const closed = await fundingService.closeRound(round.id);
    expect(closed.status).toBe('closed');
    expect(closed.raisedAmount).toBe('3000000');
  });
});

describe('P&L Consolidation', () => {
  it('eliminates inter-company transactions', async () => {
    const result = await pnlService.runConsolidation({
      period: '2026-01',
      periodType: 'monthly',
      consolidationMethod: 'full',
    });

    expect(result.revenueEliminations).not.toBe('0');
    expect(result.expenseEliminations).not.toBe('0');
    expect(result.totalRevenue).toBeLessThan(Number(result.totalRevenuePreElimination));
  });
});

describe('Tax Estimated Payments', () => {
  it('schedules quarterly estimated payments', async () => {
    const payments = await taxService.getPaymentSchedule(mcvHoldingsEntityId, 2026);
    expect(payments).toHaveLength(4); // Q1-Q4

    const q1 = payments.find(p => p.quarter === 1);
    expect(q1!.status).toBe('scheduled');
    expect(new Date(q1!.dueDate).getMonth()).toBe(3); // April
  });

  it('flags overdue payments', async () => {
    const overdue = await taxService.getOverduePayments();
    for (const payment of overdue) {
      expect(new Date(payment.dueDate)).toBeBefore(new Date());
      expect(payment.status).toBe('overdue');
    }
  });
});
```

---

*@mcv/treasury â€” Treasury Domain Module*
