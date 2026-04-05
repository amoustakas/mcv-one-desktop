# @mcv/treasury/tax

> **Tier 5 — Domain Module (MCV-Only)**
> Multi-jurisdiction tax compliance, provision calculations, and regulatory filing management.

---

## Purpose

The `@mcv/treasury/tax` module provides comprehensive tax compliance infrastructure for ventures operating across multiple jurisdictions. Tax obligations are among the most complex operational burdens any multi-entity organization faces — spanning federal, state, local, and international regimes — each with unique rates, filing deadlines, entity classification rules, and reporting requirements. This module centralizes all tax-related computation, tracking, and documentation into a unified system that integrates directly with the general ledger, entity management, and compliance frameworks elsewhere in MCV.

At its core, the tax module maintains a real-time view of estimated tax liabilities per jurisdiction per venture, tracks quarterly estimated payments and underpayment penalty exposure, manages filing calendars with automated reminders, and handles the nuances of transfer pricing documentation, R&D credit substantiation, withholding tax treaty application, and sales tax nexus determination. For ventures with crypto-native operations, the module also tracks token disposition events, staking reward income recognition, airdrop fair-market-value captures, and other digital-asset tax events that traditional accounting software handles poorly or not at all.

The architecture is built for multi-tenant isolation via Supabase Row-Level Security, ensuring that each venture's tax data — including sensitive entity structures, intercompany pricing arrangements, and deferred tax positions — remains strictly segregated. All tax calculations are versioned and auditable, with full change history for every provision adjustment, payment recording, and nexus determination. The module exposes its functionality through tRPC procedures, enabling both programmatic access from other MCV modules and interactive use through treasury dashboards.

---

## Exports

```typescript
// @mcv/treasury/tax — public API surface

// ── Core Services ──────────────────────────────────────────────
export { TaxService }                    from './services/tax.service';
export { TaxProvisionService }           from './services/provision.service';
export { TaxPaymentService }             from './services/payment.service';
export { TaxCalendarService }            from './services/calendar.service';
export { TransferPricingService }        from './services/transfer-pricing.service';
export { RDCreditService }              from './services/rd-credit.service';
export { WithholdingTaxService }         from './services/withholding.service';
export { ConsolidatedReturnService }     from './services/consolidated-return.service';
export { TaxEntityService }              from './services/tax-entity.service';
export { DeferredTaxService }            from './services/deferred-tax.service';
export { SalesTaxNexusService }          from './services/sales-tax-nexus.service';
export { CryptoTaxService }             from './services/crypto-tax.service';

// ── tRPC Router ────────────────────────────────────────────────
export { taxRouter }                     from './trpc/tax.router';
export type { TaxRouter }                from './trpc/tax.router';

// ── Core Types ─────────────────────────────────────────────────
export type {
  TaxProvision,
  TaxProvisionLine,
  ProvisionMethod,
  ProvisionStatus,
} from './types/provision.types';

export type {
  TaxPayment,
  EstimatedPaymentSchedule,
  PaymentStatus,
  UnderpaymentPenalty,
} from './types/payment.types';

export type {
  TaxCalendarEntry,
  FilingDeadline,
  ExtensionRequest,
  CalendarReminder,
  FilingStatus,
} from './types/calendar.types';

export type {
  TransferPricingDoc,
  TransferPricingMethod,
  ComparableAnalysis,
  ArmLengthRange,
  IntercompanyTransaction,
} from './types/transfer-pricing.types';

export type {
  RDCredit,
  QualifyingActivity,
  RDExpenseCategory,
  CreditCalculation,
  FourPartTest,
} from './types/rd-credit.types';

export type {
  WithholdingRate,
  TreatyBenefit,
  W8Form,
  W8FormType,
  WithholdingExemption,
} from './types/withholding.types';

export type {
  ConsolidatedReturn,
  ConsolidatedGroup,
  IntercompanyElimination,
  ReturnStatus,
} from './types/consolidated-return.types';

export type {
  TaxEntity,
  TaxClassification,
  EntityElection,
  CheckTheBoxElection,
} from './types/tax-entity.types';

export type {
  DeferredTaxAsset,
  DeferredTaxLiability,
  TemporaryDifference,
  ValuationAllowance,
  DeferredTaxPosition,
} from './types/deferred-tax.types';

export type {
  SalesTaxNexus,
  NexusType,
  NexusDetermination,
  NexusThreshold,
  CollectionObligation,
} from './types/sales-tax-nexus.types';

export type {
  CryptoTaxEvent,
  CryptoDisposition,
  StakingReward,
  AirdropEvent,
  CostBasisMethod,
  CryptoTaxLot,
} from './types/crypto-tax.types';

export type {
  Jurisdiction,
  JurisdictionType,
  TaxYear,
  TaxPeriod,
  TaxRate,
} from './types/jurisdiction.types';

// ── DB Schema ──────────────────────────────────────────────────
export {
  taxProvisions,
  taxProvisionLines,
  taxPayments,
  taxCalendar,
  transferPricing,
  rdCredits,
  rdActivities,
  withholdingRates,
  w8Forms,
  taxReturns,
  consolidatedGroups,
  taxEntities,
  entityElections,
  deferredTaxPositions,
  temporaryDifferences,
  valuationAllowances,
  nexusDeterminations,
  nexusThresholds,
  cryptoTaxEvents,
  cryptoTaxLots,
} from './db/schema';

// ── Utilities ──────────────────────────────────────────────────
export { TaxRateEngine }                 from './utils/rate-engine';
export { PenaltyCalculator }             from './utils/penalty-calculator';
export { NexusAnalyzer }                 from './utils/nexus-analyzer';
export { CostBasisEngine }              from './utils/cost-basis-engine';
export { TransferPricingValidator }      from './utils/tp-validator';
export { TaxCalendarGenerator }          from './utils/calendar-generator';
export { ProvisionWorksheet }            from './utils/provision-worksheet';

// ── Constants ──────────────────────────────────────────────────
export {
  FEDERAL_TAX_RATES,
  STATE_TAX_RATES,
  SAFE_HARBOR_THRESHOLDS,
  NEXUS_ECONOMIC_THRESHOLDS,
  RD_CREDIT_RATES,
  WITHHOLDING_DEFAULT_RATES,
  CRYPTO_TAX_METHODS,
  FILING_DEADLINES,
} from './constants';
```

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          @mcv/treasury/tax                                  │
│                                                                             │
│  ┌──────────────────────────────────────────────────────────────────────┐   │
│  │                        tRPC Router (taxRouter)                       │   │
│  │  provision.* │ payment.* │ calendar.* │ tp.* │ rd.* │ nexus.* │ ... │   │
│  └──────┬───────┴─────┬─────┴──────┬─────┴───┬──┴───┬──┴────┬───┴─────┘   │
│         │             │            │         │      │       │               │
│  ┌──────▼───────┐ ┌───▼────┐ ┌────▼────┐ ┌──▼──┐ ┌─▼──┐ ┌──▼───┐         │
│  │  Provision   │ │Payment │ │Calendar │ │ TP  │ │R&D │ │Nexus │         │
│  │  Service     │ │Service │ │Service  │ │Svc  │ │Svc │ │Svc   │         │
│  └──────┬───────┘ └───┬────┘ └────┬────┘ └──┬──┘ └─┬──┘ └──┬───┘         │
│         │             │            │         │      │       │               │
│  ┌──────▼─────────────▼────────────▼─────────▼──────▼───────▼──────────┐   │
│  │                       Core Tax Engine                                │   │
│  │                                                                      │   │
│  │  ┌─────────────┐  ┌──────────────┐  ┌─────────────┐                 │   │
│  │  │ Rate Engine  │  │   Penalty    │  │  Cost Basis │                 │   │
│  │  │ (federal,    │  │  Calculator  │  │   Engine    │                 │   │
│  │  │  state, intl)│  │ (§6654/6655) │  │ (FIFO/LIFO/ │                 │   │
│  │  └──────┬──────┘  └──────┬───────┘  │  HIFO/SpecID)│                 │   │
│  │         │                │          └──────┬──────┘                  │   │
│  │  ┌──────▼────────────────▼─────────────────▼──────┐                 │   │
│  │  │            Jurisdiction Registry                │                 │   │
│  │  │  US Federal │ 50 States │ Canada │ EU │ Other   │                 │   │
│  │  └─────────────────────────────────────────────────┘                 │   │
│  └─────────────────────────────┬────────────────────────────────────────┘   │
│                                │                                            │
│  ┌─────────────────────────────▼────────────────────────────────────────┐   │
│  │                        Data Layer (Drizzle ORM)                      │   │
│  │                                                                      │   │
│  │  tax_provisions │ tax_payments │ tax_calendar │ transfer_pricing     │   │
│  │  rd_credits │ withholding_rates │ tax_returns │ nexus_determinations │   │
│  │  crypto_tax_events │ deferred_tax_positions │ tax_entities           │   │
│  └─────────────────────────────┬────────────────────────────────────────┘   │
│                                │                                            │
│                     ┌──────────▼──────────┐                                 │
│                     │   Supabase Postgres  │                                │
│                     │   (RLS per venture)  │                                │
│                     └─────────────────────┘                                 │
│                                                                             │
│  ── External Integrations ──────────────────────────────────────────────    │
│                                                                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐   │
│  │ @mcv/finance  │  │@mcv/web3-core│  │@mcv/compliance│  │@mcv/treasury │   │
│  │ GL balances,  │  │ On-chain tx, │  │ Regulatory    │  │ /entity      │   │
│  │ journal data  │  │ token events │  │ calendars     │  │ Entity data  │   │
│  └──────────────┘  └──────────────┘  └──────────────┘  └──────────────┘   │
└─────────────────────────────────────────────────────────────────────────────┘

Data Flow:

  GL Data ──► Provision Calc ──► Estimated Tax ──► Payment Tracking
                   │                                      │
                   ▼                                      ▼
            Deferred Tax ◄──── Temporary Diffs      Penalty Calc
                   │                                      │
                   ▼                                      ▼
           Financial Stmt ◄──────────────────── Filing Calendar
                                                          │
  On-Chain Tx ──► Crypto Events ──► Cost Basis ──► Tax Return
                                                          │
  Sales Data ──► Nexus Analysis ──► Collection Obligations │
                                                          ▼
  Interco Tx ──► TP Documentation ──► Benchmarking  Consolidated
                                                      Return
  R&D Spend ──► Activity Tracking ──► Credit Calc ──────┘
```

---

## Core Interfaces

### TaxService

The top-level orchestrator that coordinates all tax sub-services and provides a unified API for tax operations across all jurisdictions and entity types.

```typescript
interface TaxService {
  // ── Provision Management ─────────────────────────────────────
  /**
   * Calculate tax provision for a venture in a specific jurisdiction
   * for a given tax period. Pulls GL data from @mcv/finance,
   * applies jurisdiction-specific rates and adjustments.
   */
  calculateProvision(params: {
    ventureId: string;
    jurisdictionId: string;
    taxYear: number;
    taxPeriod: TaxPeriod;        // 'annual' | 'q1' | 'q2' | 'q3' | 'q4'
    method: ProvisionMethod;     // 'actual' | 'annualized' | 'seasonal'
    adjustments?: ProvisionAdjustment[];
    includeDeferred?: boolean;   // default true
  }): Promise<TaxProvision>;

  /**
   * Retrieve all provisions for a venture across jurisdictions,
   * optionally filtered by status or period.
   */
  getProvisions(params: {
    ventureId: string;
    taxYear: number;
    jurisdiction?: string;
    status?: ProvisionStatus[];
    includeLines?: boolean;
  }): Promise<TaxProvision[]>;

  /**
   * Lock a provision — prevents further edits, marks as final
   * for financial statement inclusion.
   */
  lockProvision(provisionId: string, lockedBy: string): Promise<TaxProvision>;

  // ── Payment Tracking ────────────────────────────────────────
  /**
   * Record an estimated tax payment made to a jurisdiction.
   */
  recordPayment(params: {
    ventureId: string;
    jurisdictionId: string;
    taxYear: number;
    quarter: 1 | 2 | 3 | 4;
    amount: number;
    paymentDate: Date;
    confirmationNumber?: string;
    paymentMethod?: 'eftps' | 'check' | 'wire' | 'ach' | 'online';
  }): Promise<TaxPayment>;

  /**
   * Calculate underpayment penalty exposure for a venture
   * based on payments made vs. required amounts.
   */
  calculatePenalty(params: {
    ventureId: string;
    jurisdictionId: string;
    taxYear: number;
    method?: 'regular' | 'annualized_income';
  }): Promise<UnderpaymentPenalty>;

  // ── Calendar & Filing ───────────────────────────────────────
  /**
   * Generate filing calendar for a venture based on its entity
   * types and jurisdiction registrations.
   */
  generateCalendar(params: {
    ventureId: string;
    taxYear: number;
    includeExtensions?: boolean;
  }): Promise<TaxCalendarEntry[]>;

  /**
   * File for a deadline extension in a specific jurisdiction.
   */
  fileExtension(params: {
    calendarEntryId: string;
    extensionDate: Date;
    reason?: string;
    filedBy: string;
  }): Promise<ExtensionRequest>;

  // ── Entity Management ───────────────────────────────────────
  /**
   * Get or set tax classification for an entity within a venture.
   */
  getEntityClassification(entityId: string): Promise<TaxEntity>;

  setEntityClassification(params: {
    entityId: string;
    classification: TaxClassification;
    effectiveDate: Date;
    election?: CheckTheBoxElection;
  }): Promise<TaxEntity>;

  // ── Consolidated Returns ────────────────────────────────────
  /**
   * Build a consolidated return group from eligible entities.
   */
  buildConsolidatedGroup(params: {
    parentEntityId: string;
    taxYear: number;
    memberEntityIds: string[];
  }): Promise<ConsolidatedGroup>;

  /**
   * Generate intercompany eliminations for a consolidated group.
   */
  generateEliminations(groupId: string): Promise<IntercompanyElimination[]>;

  // ── Cross-Cutting ───────────────────────────────────────────
  /**
   * Get total tax exposure across all jurisdictions for a venture.
   */
  getTotalExposure(ventureId: string, taxYear: number): Promise<{
    federal: number;
    state: number;
    international: number;
    total: number;
    byJurisdiction: Record<string, number>;
  }>;

  /**
   * Export tax data package for external CPA/preparer.
   */
  exportTaxPackage(params: {
    ventureId: string;
    taxYear: number;
    format: 'xlsx' | 'csv' | 'pdf';
    sections?: TaxPackageSection[];
  }): Promise<{ url: string; expiresAt: Date }>;
}
```

### TaxProvision

Represents a calculated tax provision for a single jurisdiction and period.

```typescript
interface TaxProvision {
  id: string;
  ventureId: string;
  entityId: string;
  jurisdictionId: string;
  jurisdictionType: JurisdictionType;    // 'federal' | 'state' | 'local' | 'international'
  jurisdictionName: string;               // e.g., 'US Federal', 'California', 'Canada'
  taxYear: number;
  taxPeriod: TaxPeriod;
  method: ProvisionMethod;

  // ── Income Computation ──────────────────────────────────────
  bookIncome: number;                     // Pre-tax book income from GL
  permanentDifferences: number;           // M-1/M-3 permanent adjustments
  temporaryDifferences: number;           // M-1/M-3 temporary adjustments
  taxableIncome: number;                  // Computed taxable income
  apportionmentFactor?: number;           // State apportionment (0-1)
  apportionedIncome?: number;             // Taxable income × apportionment

  // ── Tax Computation ─────────────────────────────────────────
  statutoryRate: number;                  // Applicable statutory tax rate
  grossTax: number;                       // Taxable income × rate
  credits: number;                        // Total credits applied
  netTax: number;                         // Gross tax minus credits

  // ── Current vs Deferred ─────────────────────────────────────
  currentProvision: number;               // Current period tax expense
  deferredProvision: number;              // Deferred tax expense/(benefit)
  totalProvision: number;                 // Current + Deferred

  // ── Effective Rate ──────────────────────────────────────────
  effectiveTaxRate: number;               // Total provision / book income
  rateReconciliation: RateReconciliationItem[];

  // ── Detail Lines ────────────────────────────────────────────
  lines: TaxProvisionLine[];

  // ── Status & Audit ──────────────────────────────────────────
  status: ProvisionStatus;                // 'draft' | 'review' | 'approved' | 'locked'
  preparedBy: string;
  reviewedBy?: string;
  approvedBy?: string;
  lockedAt?: Date;
  notes?: string;

  createdAt: Date;
  updatedAt: Date;
  version: number;
}

interface TaxProvisionLine {
  id: string;
  provisionId: string;
  lineType: 'permanent_difference' | 'temporary_difference' | 'credit' | 'nol' | 'other';
  description: string;
  bookAmount: number;
  taxAmount: number;
  difference: number;
  taxEffect: number;
  glAccountId?: string;
  referenceCode?: string;                 // e.g., M-1 line reference
  sortOrder: number;
}

type ProvisionMethod = 'actual' | 'annualized' | 'seasonal';

type ProvisionStatus = 'draft' | 'review' | 'approved' | 'locked';

interface ProvisionAdjustment {
  description: string;
  amount: number;
  type: 'permanent' | 'temporary';
  category: string;
}

interface RateReconciliationItem {
  description: string;
  rate: number;                            // Percentage impact on ETR
  amount: number;                          // Dollar impact
}
```

### TaxPayment

Tracks estimated and final tax payments to jurisdictions.

```typescript
interface TaxPayment {
  id: string;
  ventureId: string;
  entityId: string;
  jurisdictionId: string;
  jurisdictionName: string;
  taxYear: number;
  quarter: 1 | 2 | 3 | 4 | null;         // null for final/extension payments
  paymentType: 'estimated' | 'final' | 'extension' | 'amended' | 'penalty';

  // ── Payment Details ─────────────────────────────────────────
  amount: number;
  currency: string;                        // ISO 4217
  paymentDate: Date;
  dueDate: Date;
  paymentMethod: 'eftps' | 'check' | 'wire' | 'ach' | 'online';
  confirmationNumber?: string;
  checkNumber?: string;
  bankAccountId?: string;

  // ── Safe Harbor Tracking ────────────────────────────────────
  requiredPayment: number;                 // Amount required to meet safe harbor
  cumulativePaid: number;                  // Total paid through this quarter
  cumulativeRequired: number;              // Total required through this quarter
  safeHarborMet: boolean;                  // Whether safe harbor is satisfied

  // ── Status ──────────────────────────────────────────────────
  status: PaymentStatus;
  reconciledAt?: Date;
  reconciledBy?: string;

  createdAt: Date;
  updatedAt: Date;
}

type PaymentStatus =
  | 'scheduled'
  | 'pending'
  | 'submitted'
  | 'confirmed'
  | 'reconciled'
  | 'failed'
  | 'cancelled';

interface EstimatedPaymentSchedule {
  ventureId: string;
  jurisdictionId: string;
  taxYear: number;
  annualLiability: number;
  priorYearLiability: number;

  quarters: {
    quarter: 1 | 2 | 3 | 4;
    dueDate: Date;
    requiredAmount: number;               // Safe harbor minimum
    paidAmount: number;
    remainingDue: number;
    status: 'upcoming' | 'due' | 'paid' | 'overdue' | 'partial';
  }[];

  safeHarborMethod: 'current_year_100' | 'prior_year_100' | 'prior_year_110';
  totalRequired: number;
  totalPaid: number;
  totalRemaining: number;
}

interface UnderpaymentPenalty {
  ventureId: string;
  jurisdictionId: string;
  taxYear: number;
  penaltyApplicable: boolean;
  penaltyAmount: number;
  annualizedRate: number;                  // IRS underpayment rate

  quarterlyDetail: {
    quarter: 1 | 2 | 3 | 4;
    requiredPayment: number;
    actualPayment: number;
    underpayment: number;
    daysLate: number;
    penaltyForQuarter: number;
  }[];

  waiverEligible: boolean;
  waiverReason?: string;
}
```

### TaxCalendar

Filing deadlines, reminders, and extension management.

```typescript
interface TaxCalendarEntry {
  id: string;
  ventureId: string;
  entityId: string;
  jurisdictionId: string;
  jurisdictionName: string;
  taxYear: number;

  // ── Filing Details ──────────────────────────────────────────
  filingType: FilingType;
  formNumber: string;                      // e.g., '1120', '1065', 'CT-3'
  formName: string;                        // e.g., 'U.S. Corporation Income Tax Return'
  description: string;

  // ── Dates ───────────────────────────────────────────────────
  originalDueDate: Date;
  extendedDueDate?: Date;
  effectiveDueDate: Date;                  // Extended if applicable, else original
  filedDate?: Date;

  // ── Extension ───────────────────────────────────────────────
  extensionFiled: boolean;
  extensionRequest?: ExtensionRequest;

  // ── Reminders ───────────────────────────────────────────────
  reminders: CalendarReminder[];

  // ── Status ──────────────────────────────────────────────────
  status: FilingStatus;
  assignedTo?: string;
  preparerId?: string;
  reviewerId?: string;
  notes?: string;

  createdAt: Date;
  updatedAt: Date;
}

type FilingType =
  | 'income_tax'
  | 'estimated_payment'
  | 'franchise_tax'
  | 'sales_tax'
  | 'payroll_tax'
  | 'information_return'
  | 'withholding'
  | 'annual_report'
  | 'extension';

type FilingStatus =
  | 'not_started'
  | 'in_progress'
  | 'in_review'
  | 'approved'
  | 'filed'
  | 'accepted'
  | 'rejected'
  | 'amended'
  | 'extended';

interface ExtensionRequest {
  id: string;
  calendarEntryId: string;
  formNumber: string;                      // e.g., '7004' for federal corporate extension
  originalDueDate: Date;
  extendedDueDate: Date;
  filedDate: Date;
  filedBy: string;
  confirmationNumber?: string;
  paymentWithExtension?: number;           // Estimated tax paid with extension
  status: 'filed' | 'accepted' | 'rejected';
  notes?: string;
}

interface CalendarReminder {
  id: string;
  calendarEntryId: string;
  reminderDate: Date;
  daysBefore: number;                      // Days before due date
  channel: 'email' | 'slack' | 'in_app' | 'sms';
  recipients: string[];
  sent: boolean;
  sentAt?: Date;
  acknowledged: boolean;
  acknowledgedBy?: string;
}

interface FilingDeadline {
  filingType: FilingType;
  formNumber: string;
  entityType: TaxClassification;
  jurisdictionId: string;
  fiscalYearEnd: number;                   // Month (1-12)
  originalDueMonth: number;               // Month offset from FYE
  originalDueDay: number;
  extensionMonths: number;                // Additional months if extended
  paymentRequiredWithExtension: boolean;
}
```

### TransferPricingDoc

Intercompany transaction documentation and arm's length pricing analysis.

```typescript
interface TransferPricingDoc {
  id: string;
  ventureId: string;
  taxYear: number;
  documentType: 'master_file' | 'local_file' | 'country_by_country' | 'benchmarking_study';

  // ── Transaction Details ─────────────────────────────────────
  transactions: IntercompanyTransaction[];

  // ── Method & Analysis ───────────────────────────────────────
  method: TransferPricingMethod;
  testedParty: string;                     // Entity being tested
  profitLevelIndicator?: string;           // e.g., 'operating_margin', 'berry_ratio'
  armLengthRange: ArmLengthRange;
  comparableAnalysis?: ComparableAnalysis;

  // ── Conclusions ─────────────────────────────────────────────
  conclusion: 'within_range' | 'adjustment_required' | 'pending';
  adjustmentAmount?: number;
  adjustmentDirection?: 'increase' | 'decrease';

  // ── Documentation ───────────────────────────────────────────
  narrative: string;
  functionalAnalysis: string;
  economicAnalysis: string;
  industryAnalysis?: string;
  attachments: { name: string; url: string; type: string }[];

  // ── Status ──────────────────────────────────────────────────
  status: 'draft' | 'review' | 'final' | 'filed';
  preparedBy: string;
  reviewedBy?: string;
  approvedBy?: string;
  approvedAt?: Date;

  createdAt: Date;
  updatedAt: Date;
}

interface IntercompanyTransaction {
  id: string;
  documentId: string;
  fromEntityId: string;
  fromEntityName: string;
  fromJurisdiction: string;
  toEntityId: string;
  toEntityName: string;
  toJurisdiction: string;

  transactionType: 'service' | 'tangible_goods' | 'intangible_license'
    | 'loan' | 'cost_sharing' | 'management_fee' | 'royalty';
  description: string;
  amount: number;
  currency: string;
  frequency: 'one_time' | 'monthly' | 'quarterly' | 'annual';
  startDate: Date;
  endDate?: Date;
}

type TransferPricingMethod =
  | 'cup'                                  // Comparable Uncontrolled Price
  | 'resale_price'                         // Resale Price Method
  | 'cost_plus'                            // Cost Plus Method
  | 'tnmm'                                // Transactional Net Margin Method
  | 'profit_split'                         // Profit Split Method
  | 'specified_method';                    // Specified method (e.g., for services)

interface ArmLengthRange {
  lowerQuartile: number;
  median: number;
  upperQuartile: number;
  minimum: number;
  maximum: number;
  testedPartyResult: number;
  withinRange: boolean;
}

interface ComparableAnalysis {
  searchStrategy: string;
  databases: string[];                     // e.g., ['S&P Capital IQ', 'Bureau van Dijk']
  initialResults: number;
  screeningCriteria: string[];
  finalComparables: {
    companyName: string;
    sicCode: string;
    country: string;
    revenue: number;
    profitIndicator: number;
    yearsUsed: string;
  }[];
  rejectedComparables: {
    companyName: string;
    rejectionReason: string;
  }[];
}
```

### RDCredit

R&D tax credit qualification, computation, and audit-ready documentation.

```typescript
interface RDCredit {
  id: string;
  ventureId: string;
  entityId: string;
  taxYear: number;
  jurisdictionId: string;

  // ── Credit Calculation ──────────────────────────────────────
  calculationMethod: 'regular' | 'alternative_simplified' | 'startup';
  qualifyingExpenses: {
    wages: number;
    supplies: number;
    contractResearch: number;               // 65% of payments to third parties
    basicResearchPayments: number;
    totalQREs: number;                       // Total Qualified Research Expenses
  };

  // ── Regular Method ──────────────────────────────────────────
  fixedBasePercentage?: number;
  baseAmount?: number;
  excessOverBase?: number;
  creditRate: number;
  grossCredit: number;

  // ── ASC (Alternative Simplified) ────────────────────────────
  averagePriorYearQREs?: number;
  fiftyPercentOfAverage?: number;
  excessOverFiftyPercent?: number;

  // ── Adjustments ─────────────────────────────────────────────
  section280CReduction?: number;           // Reduced credit for not reducing deductions
  netCredit: number;
  carryforward?: number;
  carryforwardExpiration?: Date;

  // ── Activities ──────────────────────────────────────────────
  activities: QualifyingActivity[];

  // ── Documentation ───────────────────────────────────────────
  contemporaneousDocumentation: boolean;
  fourPartTestDocumented: boolean;

  // ── Status ──────────────────────────────────────────────────
  status: 'draft' | 'calculated' | 'reviewed' | 'claimed' | 'audited';
  preparedBy: string;
  reviewedBy?: string;

  createdAt: Date;
  updatedAt: Date;
}

interface QualifyingActivity {
  id: string;
  creditId: string;
  projectName: string;
  projectDescription: string;
  businessComponent: string;               // What was being developed/improved

  // ── Four-Part Test ──────────────────────────────────────────
  fourPartTest: FourPartTest;

  // ── Expense Allocation ──────────────────────────────────────
  personnel: {
    employeeId: string;
    employeeName: string;
    title: string;
    percentQualifying: number;             // % of time on qualifying activities
    wages: number;
    qualifyingWages: number;
  }[];

  supplies: {
    description: string;
    amount: number;
    qualifyingAmount: number;
  }[];

  contractResearch: {
    vendorName: string;
    description: string;
    totalPayment: number;
    qualifyingAmount: number;              // 65% of total
  }[];

  totalQREs: number;
  startDate: Date;
  endDate?: Date;
  status: 'active' | 'completed' | 'abandoned';
}

interface FourPartTest {
  /**
   * 1. Permitted Purpose — developing new or improved
   *    function, performance, reliability, or quality
   */
  permittedPurpose: {
    met: boolean;
    explanation: string;
  };

  /**
   * 2. Technological in Nature — relies on principles of
   *    physical/biological science, engineering, or computer science
   */
  technologicalInNature: {
    met: boolean;
    explanation: string;
    disciplines: string[];
  };

  /**
   * 3. Elimination of Uncertainty — uncertainty exists regarding
   *    capability, method, or design
   */
  eliminationOfUncertainty: {
    met: boolean;
    explanation: string;
    uncertaintyType: 'capability' | 'method' | 'design';
  };

  /**
   * 4. Process of Experimentation — systematic process to
   *    evaluate alternatives
   */
  processOfExperimentation: {
    met: boolean;
    explanation: string;
    experimentationType: 'modeling' | 'simulation' | 'systematic_trial_and_error' | 'other';
  };
}
```

### WithholdingRate

International withholding tax rates, treaty benefits, and form management.

```typescript
interface WithholdingRate {
  id: string;
  sourceCountry: string;                   // ISO 3166-1 alpha-2
  recipientCountry: string;               // ISO 3166-1 alpha-2
  incomeType: WithholdingIncomeType;

  // ── Rates ───────────────────────────────────────────────────
  statutoryRate: number;                   // Default withholding rate (0-1)
  treatyRate?: number;                     // Reduced rate under applicable treaty
  effectiveRate: number;                   // Applied rate (treaty if available)

  // ── Treaty Details ──────────────────────────────────────────
  treatyApplicable: boolean;
  treatyName?: string;                     // e.g., 'US-Canada Income Tax Convention'
  treatyArticle?: string;                  // e.g., 'Article XII'
  limitationOnBenefits?: boolean;          // LOB clause applicable

  // ── Conditions ──────────────────────────────────────────────
  conditions?: string;                     // Special conditions for reduced rate
  minimumHolding?: number;                 // Minimum ownership % for reduced dividend rate
  effectiveFrom: Date;
  effectiveTo?: Date;

  updatedAt: Date;
}

type WithholdingIncomeType =
  | 'dividends'
  | 'interest'
  | 'royalties'
  | 'services'
  | 'rent'
  | 'capital_gains'
  | 'pensions'
  | 'other';

interface TreatyBenefit {
  id: string;
  ventureId: string;
  entityId: string;
  payeeEntityId: string;
  withholdingRateId: string;

  // ── Benefit Claim ───────────────────────────────────────────
  incomeType: WithholdingIncomeType;
  claimedRate: number;
  w8FormId?: string;
  certificateOfResidency?: string;

  // ── Validation ──────────────────────────────────────────────
  beneficialOwnerConfirmed: boolean;
  lobSatisfied?: boolean;
  derivativeBenefitsTest?: boolean;

  status: 'pending' | 'approved' | 'denied' | 'expired';
  approvedBy?: string;
  approvedAt?: Date;
  expiresAt?: Date;
}

interface W8Form {
  id: string;
  ventureId: string;
  payeeEntityId: string;
  payeeEntityName: string;

  // ── Form Details ────────────────────────────────────────────
  formType: W8FormType;
  countryOfIncorporation: string;
  countryOfResidence: string;
  taxIdentificationNumber?: string;
  foreignTaxIdentificationNumber?: string;

  // ── Treaty Claim ────────────────────────────────────────────
  claimsTreatyBenefits: boolean;
  treatyCountry?: string;
  treatyArticle?: string;
  treatyRate?: number;
  specialRatesConditions?: string;

  // ── FATCA ───────────────────────────────────────────────────
  fatcaStatus?: string;
  giin?: string;                           // Global Intermediary Identification Number

  // ── Validity ────────────────────────────────────────────────
  signedDate: Date;
  expirationDate: Date;                    // Generally 3 years from signing
  isValid: boolean;
  renewalReminderSent: boolean;

  // ── Document ────────────────────────────────────────────────
  documentUrl?: string;
  fileName?: string;

  createdAt: Date;
  updatedAt: Date;
}

type W8FormType =
  | 'W-8BEN'                               // Foreign individuals
  | 'W-8BEN-E'                             // Foreign entities
  | 'W-8ECI'                               // Income connected to US trade/business
  | 'W-8EXP'                               // Foreign government/tax-exempt
  | 'W-8IMY';                              // Foreign intermediary
```

### SalesTaxNexus

Economic and physical nexus determination for state sales tax obligations.

```typescript
interface SalesTaxNexus {
  id: string;
  ventureId: string;
  entityId: string;
  stateCode: string;                       // US state abbreviation
  stateName: string;
  taxYear: number;

  // ── Nexus Determination ─────────────────────────────────────
  nexusType: NexusType;
  hasNexus: boolean;
  determinationDate: Date;
  effectiveDate?: Date;                    // When nexus was established

  // ── Economic Nexus Metrics ──────────────────────────────────
  economicNexus: {
    revenueThreshold: number;              // State's revenue threshold
    transactionThreshold: number;          // State's transaction threshold
    actualRevenue: number;                 // Venture's revenue in state
    actualTransactions: number;            // Venture's transaction count
    revenueExceeded: boolean;
    transactionsExceeded: boolean;
    measurementPeriod: 'current_year' | 'prior_year' | 'trailing_12_months';
  };

  // ── Physical Nexus ──────────────────────────────────────────
  physicalPresence: {
    hasOffice: boolean;
    hasEmployees: boolean;
    hasInventory: boolean;
    hasAffiliatePresence: boolean;
    details?: string;
  };

  // ── Registration & Collection ───────────────────────────────
  registered: boolean;
  registrationDate?: Date;
  permitNumber?: string;
  filingFrequency?: 'monthly' | 'quarterly' | 'annually' | 'semi_annually';
  collectionStartDate?: Date;

  // ── Marketplace Facilitator ─────────────────────────────────
  marketplaceFacilitatorApplies: boolean;
  marketplacePlatforms?: string[];

  // ── Status ──────────────────────────────────────────────────
  status: 'no_nexus' | 'approaching_threshold' | 'nexus_established'
    | 'registered' | 'collecting' | 'exempt' | 'review_needed';

  lastReviewDate: Date;
  nextReviewDate: Date;
  reviewedBy?: string;
  notes?: string;

  createdAt: Date;
  updatedAt: Date;
}

type NexusType = 'economic' | 'physical' | 'both' | 'none';

interface NexusDetermination {
  ventureId: string;
  stateCode: string;
  determinationDate: Date;
  priorDetermination?: SalesTaxNexus;
  currentDetermination: SalesTaxNexus;
  changed: boolean;
  changeType?: 'gained_nexus' | 'lost_nexus' | 'no_change';
  actionRequired?: string;
}

interface NexusThreshold {
  stateCode: string;
  stateName: string;
  revenueThreshold: number;               // e.g., 100000 for most states
  transactionThreshold: number;            // e.g., 200 for most states
  measurementPeriod: 'current_year' | 'prior_year' | 'trailing_12_months';
  effectiveDate: Date;
  notes?: string;
  sourceUrl?: string;
}

interface CollectionObligation {
  ventureId: string;
  entityId: string;
  stateCode: string;
  stateName: string;
  registrationRequired: boolean;
  currentlyRegistered: boolean;
  collectingTax: boolean;
  remittingTax: boolean;
  filingFrequency: 'monthly' | 'quarterly' | 'annually';
  nextFilingDate: Date;
  nextPaymentDate: Date;
  estimatedLiability: number;
  actionItems: string[];
}
```

### CryptoTaxEvent & Related Types

```typescript
interface CryptoTaxEvent {
  id: string;
  ventureId: string;
  entityId: string;
  taxYear: number;
  walletAddress: string;
  chainId: string;

  // ── Event Classification ────────────────────────────────────
  eventType: CryptoEventType;
  eventDate: Date;
  blockNumber?: number;
  transactionHash: string;

  // ── Asset Details ───────────────────────────────────────────
  tokenSymbol: string;
  tokenAddress: string;
  tokenName: string;
  amount: number;                          // Quantity of tokens
  decimals: number;

  // ── Valuation ───────────────────────────────────────────────
  fairMarketValue: number;                 // FMV at time of event (USD)
  fmvSource: 'coingecko' | 'chainlink' | 'exchange_rate' | 'manual' | 'twap';
  fmvTimestamp: Date;
  costBasis?: number;                      // For dispositions
  gainLoss?: number;                       // For dispositions
  holdingPeriod?: 'short_term' | 'long_term'; // < 1 year vs >= 1 year

  // ── Tax Treatment ───────────────────────────────────────────
  incomeType?: 'ordinary' | 'capital_gain' | 'capital_loss';
  taxableAmount: number;                   // Amount reportable
  reportingForm?: string;                  // e.g., '8949', 'Schedule D'
  costBasisMethod?: CostBasisMethod;

  // ── Lot Tracking ────────────────────────────────────────────
  acquiredLotId?: string;                  // For dispositions — which lot was sold
  resultingLotId?: string;                 // For acquisitions — lot created

  // ── Status ──────────────────────────────────────────────────
  status: 'pending' | 'classified' | 'reviewed' | 'reported';
  reviewedBy?: string;
  notes?: string;

  createdAt: Date;
  updatedAt: Date;
}

type CryptoEventType =
  | 'purchase'                              // Bought with fiat
  | 'sale'                                  // Sold for fiat
  | 'trade'                                 // Crypto-to-crypto swap
  | 'staking_reward'                        // Staking yield received
  | 'airdrop'                               // Token airdrop received
  | 'mining_reward'                         // Mining/validation reward
  | 'defi_yield'                            // DeFi farming/lending yield
  | 'nft_sale'                              // NFT disposition
  | 'nft_purchase'                          // NFT acquisition
  | 'bridge'                                // Cross-chain bridge
  | 'wrap'                                  // Token wrapping (e.g., ETH→WETH)
  | 'unwrap'                                // Token unwrapping
  | 'liquidity_add'                         // LP provision
  | 'liquidity_remove'                      // LP withdrawal
  | 'gas_fee'                               // Network fee paid
  | 'gift_sent'                             // Token gift outbound
  | 'gift_received'                         // Token gift inbound
  | 'donation'                              // Charitable contribution
  | 'hard_fork'                             // Hard fork receipt
  | 'lost_stolen';                          // Loss/theft event

type CostBasisMethod =
  | 'fifo'                                  // First In, First Out
  | 'lifo'                                  // Last In, First Out
  | 'hifo'                                  // Highest In, First Out
  | 'specific_id'                           // Specific identification
  | 'average_cost';                         // Average cost (limited applicability)

interface CryptoTaxLot {
  id: string;
  ventureId: string;
  entityId: string;
  walletAddress: string;
  tokenSymbol: string;
  tokenAddress: string;
  chainId: string;

  // ── Lot Details ─────────────────────────────────────────────
  acquiredDate: Date;
  acquiredAmount: number;
  remainingAmount: number;
  costBasis: number;                       // Total cost basis for acquired amount
  costBasisPerUnit: number;
  acquisitionType: CryptoEventType;
  acquisitionTxHash: string;

  // ── Disposition ─────────────────────────────────────────────
  fullyDisposed: boolean;
  dispositions: {
    eventId: string;
    date: Date;
    amount: number;
    proceeds: number;
    costBasisUsed: number;
    gainLoss: number;
    holdingPeriod: 'short_term' | 'long_term';
  }[];

  createdAt: Date;
  updatedAt: Date;
}
```

---

## Database Schemas

All schemas use Drizzle ORM with Supabase PostgreSQL. Row-Level Security (RLS) is applied on `venture_id` to enforce multi-tenant data isolation.

### tax_provisions

```typescript
import {
  pgTable, uuid, text, numeric, integer,
  timestamp, jsonb, pgEnum, index, check,
} from 'drizzle-orm/pg-core';

export const provisionStatusEnum = pgEnum('provision_status', [
  'draft', 'review', 'approved', 'locked',
]);

export const provisionMethodEnum = pgEnum('provision_method', [
  'actual', 'annualized', 'seasonal',
]);

export const jurisdictionTypeEnum = pgEnum('jurisdiction_type', [
  'federal', 'state', 'local', 'international',
]);

export const taxPeriodEnum = pgEnum('tax_period', [
  'annual', 'q1', 'q2', 'q3', 'q4',
]);

export const taxProvisions = pgTable('tax_provisions', {
  id: uuid('id').defaultRandom().primaryKey(),
  ventureId: uuid('venture_id').notNull().references(() => ventures.id),
  entityId: uuid('entity_id').notNull().references(() => entities.id),
  jurisdictionId: text('jurisdiction_id').notNull(),
  jurisdictionType: jurisdictionTypeEnum('jurisdiction_type').notNull(),
  jurisdictionName: text('jurisdiction_name').notNull(),
  taxYear: integer('tax_year').notNull(),
  taxPeriod: taxPeriodEnum('tax_period').notNull().default('annual'),
  method: provisionMethodEnum('method').notNull().default('actual'),

  // Income computation
  bookIncome: numeric('book_income', { precision: 18, scale: 2 }).notNull(),
  permanentDifferences: numeric('permanent_differences', { precision: 18, scale: 2 }).notNull().default('0'),
  temporaryDifferences: numeric('temporary_differences', { precision: 18, scale: 2 }).notNull().default('0'),
  taxableIncome: numeric('taxable_income', { precision: 18, scale: 2 }).notNull(),
  apportionmentFactor: numeric('apportionment_factor', { precision: 10, scale: 8 }),
  apportionedIncome: numeric('apportioned_income', { precision: 18, scale: 2 }),

  // Tax computation
  statutoryRate: numeric('statutory_rate', { precision: 8, scale: 6 }).notNull(),
  grossTax: numeric('gross_tax', { precision: 18, scale: 2 }).notNull(),
  credits: numeric('credits', { precision: 18, scale: 2 }).notNull().default('0'),
  netTax: numeric('net_tax', { precision: 18, scale: 2 }).notNull(),

  // Current vs deferred
  currentProvision: numeric('current_provision', { precision: 18, scale: 2 }).notNull(),
  deferredProvision: numeric('deferred_provision', { precision: 18, scale: 2 }).notNull().default('0'),
  totalProvision: numeric('total_provision', { precision: 18, scale: 2 }).notNull(),

  // Effective rate
  effectiveTaxRate: numeric('effective_tax_rate', { precision: 8, scale: 6 }),
  rateReconciliation: jsonb('rate_reconciliation').$type<RateReconciliationItem[]>(),

  // Status
  status: provisionStatusEnum('status').notNull().default('draft'),
  preparedBy: uuid('prepared_by').notNull(),
  reviewedBy: uuid('reviewed_by'),
  approvedBy: uuid('approved_by'),
  lockedAt: timestamp('locked_at', { withTimezone: true }),
  notes: text('notes'),

  version: integer('version').notNull().default(1),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  ventureYearIdx: index('tax_prov_venture_year_idx')
    .on(table.ventureId, table.taxYear),
  jurisdictionIdx: index('tax_prov_jurisdiction_idx')
    .on(table.ventureId, table.jurisdictionId, table.taxYear),
  statusIdx: index('tax_prov_status_idx')
    .on(table.ventureId, table.status),
}));

export const taxProvisionLines = pgTable('tax_provision_lines', {
  id: uuid('id').defaultRandom().primaryKey(),
  provisionId: uuid('provision_id').notNull().references(() => taxProvisions.id, { onDelete: 'cascade' }),
  lineType: text('line_type').notNull(),    // 'permanent_difference', 'temporary_difference', etc.
  description: text('description').notNull(),
  bookAmount: numeric('book_amount', { precision: 18, scale: 2 }).notNull(),
  taxAmount: numeric('tax_amount', { precision: 18, scale: 2 }).notNull(),
  difference: numeric('difference', { precision: 18, scale: 2 }).notNull(),
  taxEffect: numeric('tax_effect', { precision: 18, scale: 2 }).notNull(),
  glAccountId: uuid('gl_account_id'),
  referenceCode: text('reference_code'),
  sortOrder: integer('sort_order').notNull().default(0),

  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  provisionIdx: index('tax_prov_line_provision_idx').on(table.provisionId),
}));
```

### tax_payments

```typescript
export const paymentStatusEnum = pgEnum('payment_status', [
  'scheduled', 'pending', 'submitted', 'confirmed',
  'reconciled', 'failed', 'cancelled',
]);

export const paymentTypeEnum = pgEnum('payment_type', [
  'estimated', 'final', 'extension', 'amended', 'penalty',
]);

export const paymentMethodEnum = pgEnum('payment_method', [
  'eftps', 'check', 'wire', 'ach', 'online',
]);

export const taxPayments = pgTable('tax_payments', {
  id: uuid('id').defaultRandom().primaryKey(),
  ventureId: uuid('venture_id').notNull().references(() => ventures.id),
  entityId: uuid('entity_id').notNull().references(() => entities.id),
  jurisdictionId: text('jurisdiction_id').notNull(),
  jurisdictionName: text('jurisdiction_name').notNull(),
  taxYear: integer('tax_year').notNull(),
  quarter: integer('quarter'),              // 1-4 or null for final
  paymentType: paymentTypeEnum('payment_type').notNull(),

  // Payment details
  amount: numeric('amount', { precision: 18, scale: 2 }).notNull(),
  currency: text('currency').notNull().default('USD'),
  paymentDate: timestamp('payment_date', { withTimezone: true }).notNull(),
  dueDate: timestamp('due_date', { withTimezone: true }).notNull(),
  paymentMethod: paymentMethodEnum('payment_method'),
  confirmationNumber: text('confirmation_number'),
  checkNumber: text('check_number'),
  bankAccountId: uuid('bank_account_id'),

  // Safe harbor tracking
  requiredPayment: numeric('required_payment', { precision: 18, scale: 2 }),
  cumulativePaid: numeric('cumulative_paid', { precision: 18, scale: 2 }),
  cumulativeRequired: numeric('cumulative_required', { precision: 18, scale: 2 }),
  safeHarborMet: integer('safe_harbor_met'),  // boolean as int (0/1)

  // Status
  status: paymentStatusEnum('status').notNull().default('scheduled'),
  reconciledAt: timestamp('reconciled_at', { withTimezone: true }),
  reconciledBy: uuid('reconciled_by'),

  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  ventureYearIdx: index('tax_pay_venture_year_idx')
    .on(table.ventureId, table.taxYear),
  jurisdictionIdx: index('tax_pay_jurisdiction_idx')
    .on(table.ventureId, table.jurisdictionId, table.taxYear),
  dueDateIdx: index('tax_pay_due_date_idx')
    .on(table.ventureId, table.dueDate),
  statusIdx: index('tax_pay_status_idx')
    .on(table.ventureId, table.status),
}));
```

### tax_calendar

```typescript
export const filingTypeEnum = pgEnum('filing_type', [
  'income_tax', 'estimated_payment', 'franchise_tax', 'sales_tax',
  'payroll_tax', 'information_return', 'withholding', 'annual_report', 'extension',
]);

export const filingStatusEnum = pgEnum('filing_status', [
  'not_started', 'in_progress', 'in_review', 'approved',
  'filed', 'accepted', 'rejected', 'amended', 'extended',
]);

export const taxCalendar = pgTable('tax_calendar', {
  id: uuid('id').defaultRandom().primaryKey(),
  ventureId: uuid('venture_id').notNull().references(() => ventures.id),
  entityId: uuid('entity_id').notNull().references(() => entities.id),
  jurisdictionId: text('jurisdiction_id').notNull(),
  jurisdictionName: text('jurisdiction_name').notNull(),
  taxYear: integer('tax_year').notNull(),

  // Filing details
  filingType: filingTypeEnum('filing_type').notNull(),
  formNumber: text('form_number').notNull(),
  formName: text('form_name').notNull(),
  description: text('description'),

  // Dates
  originalDueDate: timestamp('original_due_date', { withTimezone: true }).notNull(),
  extendedDueDate: timestamp('extended_due_date', { withTimezone: true }),
  effectiveDueDate: timestamp('effective_due_date', { withTimezone: true }).notNull(),
  filedDate: timestamp('filed_date', { withTimezone: true }),

  // Extension
  extensionFiled: integer('extension_filed').notNull().default(0),  // boolean
  extensionFormNumber: text('extension_form_number'),
  extensionConfirmation: text('extension_confirmation'),
  paymentWithExtension: numeric('payment_with_extension', { precision: 18, scale: 2 }),

  // Status
  status: filingStatusEnum('status').notNull().default('not_started'),
  assignedTo: uuid('assigned_to'),
  preparerId: uuid('preparer_id'),
  reviewerId: uuid('reviewer_id'),
  notes: text('notes'),

  // Reminders
  reminders: jsonb('reminders').$type<CalendarReminder[]>(),

  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  ventureYearIdx: index('tax_cal_venture_year_idx')
    .on(table.ventureId, table.taxYear),
  dueDateIdx: index('tax_cal_due_date_idx')
    .on(table.ventureId, table.effectiveDueDate),
  statusIdx: index('tax_cal_status_idx')
    .on(table.ventureId, table.status),
  upcomingIdx: index('tax_cal_upcoming_idx')
    .on(table.ventureId, table.effectiveDueDate, table.status),
}));
```

### transfer_pricing

```typescript
export const tpMethodEnum = pgEnum('tp_method', [
  'cup', 'resale_price', 'cost_plus', 'tnmm', 'profit_split', 'specified_method',
]);

export const tpDocTypeEnum = pgEnum('tp_doc_type', [
  'master_file', 'local_file', 'country_by_country', 'benchmarking_study',
]);

export const transferPricing = pgTable('transfer_pricing', {
  id: uuid('id').defaultRandom().primaryKey(),
  ventureId: uuid('venture_id').notNull().references(() => ventures.id),
  taxYear: integer('tax_year').notNull(),
  documentType: tpDocTypeEnum('document_type').notNull(),

  // Method & Analysis
  method: tpMethodEnum('method').notNull(),
  testedParty: text('tested_party').notNull(),
  profitLevelIndicator: text('profit_level_indicator'),

  // Arm's length range
  armLengthRange: jsonb('arm_length_range').$type<ArmLengthRange>(),
  comparableAnalysis: jsonb('comparable_analysis').$type<ComparableAnalysis>(),

  // Transactions (stored as JSONB for flexibility)
  transactions: jsonb('transactions').$type<IntercompanyTransaction[]>().notNull(),
  totalTransactionValue: numeric('total_transaction_value', { precision: 18, scale: 2 }),

  // Conclusions
  conclusion: text('conclusion').notNull().default('pending'),
  adjustmentAmount: numeric('adjustment_amount', { precision: 18, scale: 2 }),
  adjustmentDirection: text('adjustment_direction'),

  // Documentation narratives
  narrative: text('narrative'),
  functionalAnalysis: text('functional_analysis'),
  economicAnalysis: text('economic_analysis'),
  industryAnalysis: text('industry_analysis'),
  attachments: jsonb('attachments').$type<{ name: string; url: string; type: string }[]>(),

  // Status
  status: text('status').notNull().default('draft'),
  preparedBy: uuid('prepared_by').notNull(),
  reviewedBy: uuid('reviewed_by'),
  approvedBy: uuid('approved_by'),
  approvedAt: timestamp('approved_at', { withTimezone: true }),

  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  ventureYearIdx: index('tp_venture_year_idx')
    .on(table.ventureId, table.taxYear),
  methodIdx: index('tp_method_idx')
    .on(table.ventureId, table.method),
}));
```

### rd_credits

```typescript
export const rdMethodEnum = pgEnum('rd_method', [
  'regular', 'alternative_simplified', 'startup',
]);

export const rdCredits = pgTable('rd_credits', {
  id: uuid('id').defaultRandom().primaryKey(),
  ventureId: uuid('venture_id').notNull().references(() => ventures.id),
  entityId: uuid('entity_id').notNull().references(() => entities.id),
  taxYear: integer('tax_year').notNull(),
  jurisdictionId: text('jurisdiction_id').notNull(),

  // Calculation
  calculationMethod: rdMethodEnum('calculation_method').notNull(),
  qualifyingWages: numeric('qualifying_wages', { precision: 18, scale: 2 }).notNull().default('0'),
  qualifyingSupplies: numeric('qualifying_supplies', { precision: 18, scale: 2 }).notNull().default('0'),
  qualifyingContractResearch: numeric('qualifying_contract_research', { precision: 18, scale: 2 }).notNull().default('0'),
  basicResearchPayments: numeric('basic_research_payments', { precision: 18, scale: 2 }).notNull().default('0'),
  totalQREs: numeric('total_qres', { precision: 18, scale: 2 }).notNull(),

  // Regular method
  fixedBasePercentage: numeric('fixed_base_percentage', { precision: 8, scale: 6 }),
  baseAmount: numeric('base_amount', { precision: 18, scale: 2 }),
  excessOverBase: numeric('excess_over_base', { precision: 18, scale: 2 }),

  // ASC method
  averagePriorYearQREs: numeric('average_prior_year_qres', { precision: 18, scale: 2 }),
  fiftyPercentOfAverage: numeric('fifty_percent_of_average', { precision: 18, scale: 2 }),
  excessOverFiftyPercent: numeric('excess_over_fifty_percent', { precision: 18, scale: 2 }),

  // Credits
  creditRate: numeric('credit_rate', { precision: 8, scale: 6 }).notNull(),
  grossCredit: numeric('gross_credit', { precision: 18, scale: 2 }).notNull(),
  section280CReduction: numeric('section_280c_reduction', { precision: 18, scale: 2 }),
  netCredit: numeric('net_credit', { precision: 18, scale: 2 }).notNull(),
  carryforward: numeric('carryforward', { precision: 18, scale: 2 }),
  carryforwardExpiration: timestamp('carryforward_expiration', { withTimezone: true }),

  // Documentation
  contemporaneousDocumentation: integer('contemporaneous_documentation').notNull().default(0),
  fourPartTestDocumented: integer('four_part_test_documented').notNull().default(0),

  // Status
  status: text('status').notNull().default('draft'),
  preparedBy: uuid('prepared_by').notNull(),
  reviewedBy: uuid('reviewed_by'),

  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  ventureYearIdx: index('rd_venture_year_idx')
    .on(table.ventureId, table.taxYear),
  entityIdx: index('rd_entity_idx')
    .on(table.entityId, table.taxYear),
}));

export const rdActivities = pgTable('rd_activities', {
  id: uuid('id').defaultRandom().primaryKey(),
  creditId: uuid('credit_id').notNull().references(() => rdCredits.id, { onDelete: 'cascade' }),
  projectName: text('project_name').notNull(),
  projectDescription: text('project_description').notNull(),
  businessComponent: text('business_component').notNull(),

  // Four-Part Test
  fourPartTest: jsonb('four_part_test').$type<FourPartTest>().notNull(),

  // Expenses
  personnel: jsonb('personnel').$type<QualifyingActivity['personnel']>(),
  supplies: jsonb('supplies').$type<QualifyingActivity['supplies']>(),
  contractResearch: jsonb('contract_research').$type<QualifyingActivity['contractResearch']>(),
  totalQREs: numeric('total_qres', { precision: 18, scale: 2 }).notNull(),

  startDate: timestamp('start_date', { withTimezone: true }).notNull(),
  endDate: timestamp('end_date', { withTimezone: true }),
  status: text('status').notNull().default('active'),

  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  creditIdx: index('rd_act_credit_idx').on(table.creditId),
}));
```

### withholding_rates

```typescript
export const withholdingIncomeTypeEnum = pgEnum('withholding_income_type', [
  'dividends', 'interest', 'royalties', 'services',
  'rent', 'capital_gains', 'pensions', 'other',
]);

export const w8FormTypeEnum = pgEnum('w8_form_type', [
  'W-8BEN', 'W-8BEN-E', 'W-8ECI', 'W-8EXP', 'W-8IMY',
]);

export const withholdingRates = pgTable('withholding_rates', {
  id: uuid('id').defaultRandom().primaryKey(),
  sourceCountry: text('source_country').notNull(),
  recipientCountry: text('recipient_country').notNull(),
  incomeType: withholdingIncomeTypeEnum('income_type').notNull(),

  statutoryRate: numeric('statutory_rate', { precision: 8, scale: 6 }).notNull(),
  treatyRate: numeric('treaty_rate', { precision: 8, scale: 6 }),
  effectiveRate: numeric('effective_rate', { precision: 8, scale: 6 }).notNull(),

  treatyApplicable: integer('treaty_applicable').notNull().default(0),
  treatyName: text('treaty_name'),
  treatyArticle: text('treaty_article'),
  limitationOnBenefits: integer('limitation_on_benefits'),

  conditions: text('conditions'),
  minimumHolding: numeric('minimum_holding', { precision: 8, scale: 4 }),
  effectiveFrom: timestamp('effective_from', { withTimezone: true }).notNull(),
  effectiveTo: timestamp('effective_to', { withTimezone: true }),

  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  countryPairIdx: index('wh_country_pair_idx')
    .on(table.sourceCountry, table.recipientCountry),
  incomeTypeIdx: index('wh_income_type_idx')
    .on(table.sourceCountry, table.recipientCountry, table.incomeType),
}));

export const w8Forms = pgTable('w8_forms', {
  id: uuid('id').defaultRandom().primaryKey(),
  ventureId: uuid('venture_id').notNull().references(() => ventures.id),
  payeeEntityId: uuid('payee_entity_id').notNull(),
  payeeEntityName: text('payee_entity_name').notNull(),

  formType: w8FormTypeEnum('form_type').notNull(),
  countryOfIncorporation: text('country_of_incorporation').notNull(),
  countryOfResidence: text('country_of_residence').notNull(),
  taxIdentificationNumber: text('tax_identification_number'),
  foreignTaxIdentificationNumber: text('foreign_tax_identification_number'),

  claimsTreatyBenefits: integer('claims_treaty_benefits').notNull().default(0),
  treatyCountry: text('treaty_country'),
  treatyArticle: text('treaty_article'),
  treatyRate: numeric('treaty_rate', { precision: 8, scale: 6 }),
  specialRatesConditions: text('special_rates_conditions'),

  fatcaStatus: text('fatca_status'),
  giin: text('giin'),

  signedDate: timestamp('signed_date', { withTimezone: true }).notNull(),
  expirationDate: timestamp('expiration_date', { withTimezone: true }).notNull(),
  isValid: integer('is_valid').notNull().default(1),
  renewalReminderSent: integer('renewal_reminder_sent').notNull().default(0),

  documentUrl: text('document_url'),
  fileName: text('file_name'),

  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  ventureIdx: index('w8_venture_idx').on(table.ventureId),
  payeeIdx: index('w8_payee_idx').on(table.payeeEntityId),
  expirationIdx: index('w8_expiration_idx').on(table.expirationDate),
}));
```

### tax_returns

```typescript
export const returnStatusEnum = pgEnum('return_status', [
  'not_started', 'in_progress', 'in_review', 'approved',
  'filed', 'accepted', 'rejected', 'amended',
]);

export const taxReturns = pgTable('tax_returns', {
  id: uuid('id').defaultRandom().primaryKey(),
  ventureId: uuid('venture_id').notNull().references(() => ventures.id),
  entityId: uuid('entity_id').notNull().references(() => entities.id),
  jurisdictionId: text('jurisdiction_id').notNull(),
  jurisdictionName: text('jurisdiction_name').notNull(),
  taxYear: integer('tax_year').notNull(),

  returnType: text('return_type').notNull(),           // e.g., '1120', '1065', '1120-S'
  consolidatedGroupId: uuid('consolidated_group_id'),

  // Financial data
  grossReceipts: numeric('gross_receipts', { precision: 18, scale: 2 }),
  totalDeductions: numeric('total_deductions', { precision: 18, scale: 2 }),
  taxableIncome: numeric('taxable_income', { precision: 18, scale: 2 }),
  totalTax: numeric('total_tax', { precision: 18, scale: 2 }),
  paymentsMade: numeric('payments_made', { precision: 18, scale: 2 }),
  balanceDue: numeric('balance_due', { precision: 18, scale: 2 }),
  overpayment: numeric('overpayment', { precision: 18, scale: 2 }),
  overpaymentApplied: numeric('overpayment_applied', { precision: 18, scale: 2 }),
  refundRequested: numeric('refund_requested', { precision: 18, scale: 2 }),

  // Filing details
  filedDate: timestamp('filed_date', { withTimezone: true }),
  acceptedDate: timestamp('accepted_date', { withTimezone: true }),
  efileConfirmation: text('efile_confirmation'),

  // Status
  status: returnStatusEnum('status').notNull().default('not_started'),
  preparedBy: uuid('prepared_by'),
  reviewedBy: uuid('reviewed_by'),
  approvedBy: uuid('approved_by'),

  // Amendments
  isAmended: integer('is_amended').notNull().default(0),
  originalReturnId: uuid('original_return_id'),
  amendmentReason: text('amendment_reason'),

  // Documents
  returnDocumentUrl: text('return_document_url'),
  supportingDocuments: jsonb('supporting_documents').$type<{ name: string; url: string }[]>(),

  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  ventureYearIdx: index('tax_ret_venture_year_idx')
    .on(table.ventureId, table.taxYear),
  entityIdx: index('tax_ret_entity_idx')
    .on(table.entityId, table.taxYear),
  statusIdx: index('tax_ret_status_idx')
    .on(table.ventureId, table.status),
  consolidatedIdx: index('tax_ret_consolidated_idx')
    .on(table.consolidatedGroupId),
}));

export const consolidatedGroups = pgTable('consolidated_groups', {
  id: uuid('id').defaultRandom().primaryKey(),
  ventureId: uuid('venture_id').notNull().references(() => ventures.id),
  parentEntityId: uuid('parent_entity_id').notNull().references(() => entities.id),
  taxYear: integer('tax_year').notNull(),
  groupName: text('group_name').notNull(),

  // Members
  memberEntityIds: jsonb('member_entity_ids').$type<string[]>().notNull(),
  memberCount: integer('member_count').notNull(),

  // Eliminations
  intercompanyEliminations: jsonb('intercompany_eliminations').$type<IntercompanyElimination[]>(),
  totalEliminationAmount: numeric('total_elimination_amount', { precision: 18, scale: 2 }),

  // Consolidated figures
  consolidatedTaxableIncome: numeric('consolidated_taxable_income', { precision: 18, scale: 2 }),
  consolidatedTax: numeric('consolidated_tax', { precision: 18, scale: 2 }),

  status: text('status').notNull().default('draft'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  ventureYearIdx: index('cg_venture_year_idx')
    .on(table.ventureId, table.taxYear),
}));
```

### tax_entities

```typescript
export const taxClassificationEnum = pgEnum('tax_classification', [
  'c_corp', 's_corp', 'llc_partnership', 'llc_sole_prop',
  'llc_c_corp', 'llc_s_corp', 'partnership', 'sole_proprietorship',
  'disregarded_entity', 'foreign_corporation', 'branch',
]);

export const taxEntities = pgTable('tax_entities', {
  id: uuid('id').defaultRandom().primaryKey(),
  ventureId: uuid('venture_id').notNull().references(() => ventures.id),
  entityId: uuid('entity_id').notNull().references(() => entities.id).unique(),
  entityName: text('entity_name').notNull(),

  // Tax classification
  classification: taxClassificationEnum('classification').notNull(),
  effectiveDate: timestamp('effective_date', { withTimezone: true }).notNull(),

  // Identifiers
  ein: text('ein'),                          // Employer Identification Number
  stateIds: jsonb('state_ids').$type<Record<string, string>>(), // state → ID number

  // Fiscal year
  fiscalYearEnd: integer('fiscal_year_end').notNull().default(12), // Month (1-12)
  shortYearStart?: timestamp('short_year_start', { withTimezone: true }),
  shortYearEnd?: timestamp('short_year_end', { withTimezone: true }),

  // Ownership
  parentEntityId: uuid('parent_entity_id'),
  ownershipPercentage: numeric('ownership_percentage', { precision: 8, scale: 4 }),

  // Jurisdiction registrations
  registeredJurisdictions: jsonb('registered_jurisdictions').$type<string[]>(),

  // Status
  active: integer('active').notNull().default(1),
  dissolutionDate: timestamp('dissolution_date', { withTimezone: true }),

  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  ventureIdx: index('tax_ent_venture_idx').on(table.ventureId),
  entityIdx: index('tax_ent_entity_idx').on(table.entityId),
  classificationIdx: index('tax_ent_class_idx')
    .on(table.ventureId, table.classification),
}));

export const entityElections = pgTable('entity_elections', {
  id: uuid('id').defaultRandom().primaryKey(),
  taxEntityId: uuid('tax_entity_id').notNull().references(() => taxEntities.id),
  electionType: text('election_type').notNull(),  // 'check_the_box', 's_election', etc.
  fromClassification: text('from_classification'),
  toClassification: text('to_classification').notNull(),
  effectiveDate: timestamp('effective_date', { withTimezone: true }).notNull(),
  filedDate: timestamp('filed_date', { withTimezone: true }),
  formNumber: text('form_number'),                 // e.g., '8832', '2553'
  confirmationNumber: text('confirmation_number'),
  status: text('status').notNull().default('pending'), // 'pending', 'filed', 'accepted', 'rejected'
  documentUrl: text('document_url'),

  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  taxEntityIdx: index('elect_tax_entity_idx').on(table.taxEntityId),
}));
```

### deferred_tax_positions

```typescript
export const deferredTaxPositions = pgTable('deferred_tax_positions', {
  id: uuid('id').defaultRandom().primaryKey(),
  ventureId: uuid('venture_id').notNull().references(() => ventures.id),
  entityId: uuid('entity_id').notNull().references(() => entities.id),
  jurisdictionId: text('jurisdiction_id').notNull(),
  taxYear: integer('tax_year').notNull(),

  // Summary
  totalDTA: numeric('total_dta', { precision: 18, scale: 2 }).notNull().default('0'),
  totalDTL: numeric('total_dtl', { precision: 18, scale: 2 }).notNull().default('0'),
  netPosition: numeric('net_position', { precision: 18, scale: 2 }).notNull(), // DTA - DTL
  valuationAllowance: numeric('valuation_allowance', { precision: 18, scale: 2 }).notNull().default('0'),
  netDTAAfterVA: numeric('net_dta_after_va', { precision: 18, scale: 2 }).notNull(),

  // Rate used
  enactedRate: numeric('enacted_rate', { precision: 8, scale: 6 }).notNull(),
  rateChangeImpact: numeric('rate_change_impact', { precision: 18, scale: 2 }),

  status: text('status').notNull().default('draft'),
  preparedBy: uuid('prepared_by').notNull(),
  reviewedBy: uuid('reviewed_by'),

  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  ventureYearIdx: index('dtp_venture_year_idx')
    .on(table.ventureId, table.taxYear),
  entityIdx: index('dtp_entity_idx')
    .on(table.entityId, table.jurisdictionId, table.taxYear),
}));

export const temporaryDifferences = pgTable('temporary_differences', {
  id: uuid('id').defaultRandom().primaryKey(),
  positionId: uuid('position_id').notNull().references(() => deferredTaxPositions.id, { onDelete: 'cascade' }),
  description: text('description').notNull(),
  category: text('category').notNull(),     // e.g., 'depreciation', 'bad_debts', 'nol', 'stock_comp'

  bookBasis: numeric('book_basis', { precision: 18, scale: 2 }).notNull(),
  taxBasis: numeric('tax_basis', { precision: 18, scale: 2 }).notNull(),
  difference: numeric('difference', { precision: 18, scale: 2 }).notNull(),
  taxEffect: numeric('tax_effect', { precision: 18, scale: 2 }).notNull(),

  type: text('type').notNull(),             // 'dta' (Deferred Tax Asset) or 'dtl' (Deferred Tax Liability)
  reversalPattern: text('reversal_pattern'), // 'current' | '1_year' | '2_5_years' | 'indefinite'
  expectedReversalDate: timestamp('expected_reversal_date', { withTimezone: true }),

  glAccountId: uuid('gl_account_id'),
  sortOrder: integer('sort_order').notNull().default(0),

  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  positionIdx: index('td_position_idx').on(table.positionId),
  categoryIdx: index('td_category_idx').on(table.positionId, table.category),
}));

export const valuationAllowances = pgTable('valuation_allowances', {
  id: uuid('id').defaultRandom().primaryKey(),
  positionId: uuid('position_id').notNull().references(() => deferredTaxPositions.id, { onDelete: 'cascade' }),
  dtaId: uuid('dta_id'),                    // Specific DTA this allowance applies to
  amount: numeric('amount', { precision: 18, scale: 2 }).notNull(),
  reason: text('reason').notNull(),
  assessment: text('assessment').notNull(),  // 'positive' | 'negative' evidence
  evidenceType: text('evidence_type').notNull(), // e.g., 'cumulative_losses', 'tax_planning_strategy', etc.

  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  positionIdx: index('va_position_idx').on(table.positionId),
}));
```

### nexus_determinations

```typescript
export const nexusTypeEnum = pgEnum('nexus_type', [
  'economic', 'physical', 'both', 'none',
]);

export const nexusStatusEnum = pgEnum('nexus_status', [
  'no_nexus', 'approaching_threshold', 'nexus_established',
  'registered', 'collecting', 'exempt', 'review_needed',
]);

export const nexusDeterminations = pgTable('nexus_determinations', {
  id: uuid('id').defaultRandom().primaryKey(),
  ventureId: uuid('venture_id').notNull().references(() => ventures.id),
  entityId: uuid('entity_id').notNull().references(() => entities.id),
  stateCode: text('state_code').notNull(),
  stateName: text('state_name').notNull(),
  taxYear: integer('tax_year').notNull(),

  // Nexus determination
  nexusType: nexusTypeEnum('nexus_type').notNull().default('none'),
  hasNexus: integer('has_nexus').notNull().default(0),
  determinationDate: timestamp('determination_date', { withTimezone: true }).notNull(),
  effectiveDate: timestamp('effective_date', { withTimezone: true }),

  // Economic nexus metrics
  revenueThreshold: numeric('revenue_threshold', { precision: 18, scale: 2 }).notNull(),
  transactionThreshold: integer('transaction_threshold').notNull(),
  actualRevenue: numeric('actual_revenue', { precision: 18, scale: 2 }).notNull(),
  actualTransactions: integer('actual_transactions').notNull(),
  revenueExceeded: integer('revenue_exceeded').notNull().default(0),
  transactionsExceeded: integer('transactions_exceeded').notNull().default(0),
  measurementPeriod: text('measurement_period').notNull().default('trailing_12_months'),

  // Physical presence
  physicalPresence: jsonb('physical_presence').$type<SalesTaxNexus['physicalPresence']>(),

  // Registration & collection
  registered: integer('registered').notNull().default(0),
  registrationDate: timestamp('registration_date', { withTimezone: true }),
  permitNumber: text('permit_number'),
  filingFrequency: text('filing_frequency'),
  collectionStartDate: timestamp('collection_start_date', { withTimezone: true }),

  // Marketplace
  marketplaceFacilitatorApplies: integer('marketplace_facilitator_applies').notNull().default(0),
  marketplacePlatforms: jsonb('marketplace_platforms').$type<string[]>(),

  // Status
  status: nexusStatusEnum('status').notNull().default('no_nexus'),
  lastReviewDate: timestamp('last_review_date', { withTimezone: true }).notNull(),
  nextReviewDate: timestamp('next_review_date', { withTimezone: true }).notNull(),
  reviewedBy: uuid('reviewed_by'),
  notes: text('notes'),

  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  ventureStateIdx: index('nexus_venture_state_idx')
    .on(table.ventureId, table.stateCode, table.taxYear),
  statusIdx: index('nexus_status_idx')
    .on(table.ventureId, table.status),
  reviewIdx: index('nexus_review_idx')
    .on(table.nextReviewDate),
}));

export const nexusThresholds = pgTable('nexus_thresholds', {
  id: uuid('id').defaultRandom().primaryKey(),
  stateCode: text('state_code').notNull(),
  stateName: text('state_name').notNull(),
  revenueThreshold: numeric('revenue_threshold', { precision: 18, scale: 2 }).notNull(),
  transactionThreshold: integer('transaction_threshold').notNull(),
  measurementPeriod: text('measurement_period').notNull(),
  effectiveDate: timestamp('effective_date', { withTimezone: true }).notNull(),
  notes: text('notes'),
  sourceUrl: text('source_url'),

  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  stateIdx: index('nt_state_idx').on(table.stateCode),
}));
```

### crypto_tax_events

```typescript
export const cryptoEventTypeEnum = pgEnum('crypto_event_type', [
  'purchase', 'sale', 'trade', 'staking_reward', 'airdrop',
  'mining_reward', 'defi_yield', 'nft_sale', 'nft_purchase',
  'bridge', 'wrap', 'unwrap', 'liquidity_add', 'liquidity_remove',
  'gas_fee', 'gift_sent', 'gift_received', 'donation',
  'hard_fork', 'lost_stolen',
]);

export const costBasisMethodEnum = pgEnum('cost_basis_method', [
  'fifo', 'lifo', 'hifo', 'specific_id', 'average_cost',
]);

export const cryptoTaxEvents = pgTable('crypto_tax_events', {
  id: uuid('id').defaultRandom().primaryKey(),
  ventureId: uuid('venture_id').notNull().references(() => ventures.id),
  entityId: uuid('entity_id').notNull().references(() => entities.id),
  taxYear: integer('tax_year').notNull(),
  walletAddress: text('wallet_address').notNull(),
  chainId: text('chain_id').notNull(),

  // Event classification
  eventType: cryptoEventTypeEnum('event_type').notNull(),
  eventDate: timestamp('event_date', { withTimezone: true }).notNull(),
  blockNumber: integer('block_number'),
  transactionHash: text('transaction_hash').notNull(),

  // Asset details
  tokenSymbol: text('token_symbol').notNull(),
  tokenAddress: text('token_address').notNull(),
  tokenName: text('token_name').notNull(),
  amount: numeric('amount', { precision: 36, scale: 18 }).notNull(),
  decimals: integer('decimals').notNull(),

  // Valuation
  fairMarketValue: numeric('fair_market_value', { precision: 18, scale: 2 }).notNull(),
  fmvSource: text('fmv_source').notNull(),
  fmvTimestamp: timestamp('fmv_timestamp', { withTimezone: true }).notNull(),
  costBasis: numeric('cost_basis', { precision: 18, scale: 2 }),
  gainLoss: numeric('gain_loss', { precision: 18, scale: 2 }),
  holdingPeriod: text('holding_period'),     // 'short_term' | 'long_term'

  // Tax treatment
  incomeType: text('income_type'),           // 'ordinary' | 'capital_gain' | 'capital_loss'
  taxableAmount: numeric('taxable_amount', { precision: 18, scale: 2 }).notNull(),
  reportingForm: text('reporting_form'),
  costBasisMethod: costBasisMethodEnum('cost_basis_method'),

  // Lot tracking
  acquiredLotId: uuid('acquired_lot_id'),
  resultingLotId: uuid('resulting_lot_id'),

  // Status
  status: text('status').notNull().default('pending'),
  reviewedBy: uuid('reviewed_by'),
  notes: text('notes'),

  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  ventureYearIdx: index('cte_venture_year_idx')
    .on(table.ventureId, table.taxYear),
  walletIdx: index('cte_wallet_idx')
    .on(table.ventureId, table.walletAddress),
  eventTypeIdx: index('cte_event_type_idx')
    .on(table.ventureId, table.eventType, table.taxYear),
  txHashIdx: index('cte_tx_hash_idx')
    .on(table.transactionHash),
  eventDateIdx: index('cte_event_date_idx')
    .on(table.ventureId, table.eventDate),
}));

export const cryptoTaxLots = pgTable('crypto_tax_lots', {
  id: uuid('id').defaultRandom().primaryKey(),
  ventureId: uuid('venture_id').notNull().references(() => ventures.id),
  entityId: uuid('entity_id').notNull().references(() => entities.id),
  walletAddress: text('wallet_address').notNull(),
  tokenSymbol: text('token_symbol').notNull(),
  tokenAddress: text('token_address').notNull(),
  chainId: text('chain_id').notNull(),

  // Lot details
  acquiredDate: timestamp('acquired_date', { withTimezone: true }).notNull(),
  acquiredAmount: numeric('acquired_amount', { precision: 36, scale: 18 }).notNull(),
  remainingAmount: numeric('remaining_amount', { precision: 36, scale: 18 }).notNull(),
  costBasis: numeric('cost_basis', { precision: 18, scale: 2 }).notNull(),
  costBasisPerUnit: numeric('cost_basis_per_unit', { precision: 18, scale: 8 }).notNull(),
  acquisitionType: cryptoEventTypeEnum('acquisition_type').notNull(),
  acquisitionTxHash: text('acquisition_tx_hash').notNull(),

  // Disposition
  fullyDisposed: integer('fully_disposed').notNull().default(0),
  dispositions: jsonb('dispositions').$type<CryptoTaxLot['dispositions']>(),

  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  ventureTokenIdx: index('ctl_venture_token_idx')
    .on(table.ventureId, table.tokenSymbol),
  walletTokenIdx: index('ctl_wallet_token_idx')
    .on(table.walletAddress, table.tokenSymbol),
  acquiredDateIdx: index('ctl_acquired_date_idx')
    .on(table.ventureId, table.acquiredDate),
  activeLotsIdx: index('ctl_active_lots_idx')
    .on(table.ventureId, table.tokenSymbol, table.fullyDisposed),
}));
```

---

## Code Examples

### Example 1: Calculate Tax Provision for a Jurisdiction

```typescript
import { TaxService } from '@mcv/treasury/tax';
import { financeService } from '@mcv/finance';

async function calculateFederalProvision(ventureId: string, taxYear: number) {
  const taxService = new TaxService();

  // Pull book income from GL
  const glData = await financeService.getPreTaxIncome({
    ventureId,
    periodStart: new Date(`${taxYear}-01-01`),
    periodEnd: new Date(`${taxYear}-12-31`),
  });

  // Calculate provision with permanent and temporary differences
  const provision = await taxService.calculateProvision({
    ventureId,
    jurisdictionId: 'US-FED',
    taxYear,
    taxPeriod: 'annual',
    method: 'actual',
    adjustments: [
      {
        description: 'Meals & entertainment (50% disallowed)',
        amount: 15_000,
        type: 'permanent',
        category: 'meals_entertainment',
      },
      {
        description: 'Stock-based compensation timing difference',
        amount: -85_000,
        type: 'temporary',
        category: 'stock_compensation',
      },
      {
        description: 'Depreciation timing difference (§179)',
        amount: -120_000,
        type: 'temporary',
        category: 'depreciation',
      },
      {
        description: 'Tax-exempt municipal bond interest',
        amount: -10_000,
        type: 'permanent',
        category: 'tax_exempt_income',
      },
    ],
    includeDeferred: true,
  });

  console.log('Federal Tax Provision:');
  console.log(`  Book Income:           $${provision.bookIncome.toLocaleString()}`);
  console.log(`  Permanent Diffs:       $${provision.permanentDifferences.toLocaleString()}`);
  console.log(`  Temporary Diffs:       $${provision.temporaryDifferences.toLocaleString()}`);
  console.log(`  Taxable Income:        $${provision.taxableIncome.toLocaleString()}`);
  console.log(`  Statutory Rate:        ${(provision.statutoryRate * 100).toFixed(1)}%`);
  console.log(`  Current Provision:     $${provision.currentProvision.toLocaleString()}`);
  console.log(`  Deferred Provision:    $${provision.deferredProvision.toLocaleString()}`);
  console.log(`  Total Provision:       $${provision.totalProvision.toLocaleString()}`);
  console.log(`  Effective Tax Rate:    ${(provision.effectiveTaxRate * 100).toFixed(2)}%`);

  // Review rate reconciliation
  for (const item of provision.rateReconciliation) {
    console.log(`    ${item.description}: ${(item.rate * 100).toFixed(2)}%`);
  }

  return provision;
}

// Multi-state provision with apportionment
async function calculateStateProvisions(ventureId: string, taxYear: number) {
  const taxService = new TaxService();

  // Get all states where the venture has nexus
  const nexusStates = await taxService.getNexusStates(ventureId, taxYear);

  const provisions: TaxProvision[] = [];

  for (const state of nexusStates) {
    const provision = await taxService.calculateProvision({
      ventureId,
      jurisdictionId: `US-${state.stateCode}`,
      taxYear,
      taxPeriod: 'annual',
      method: 'actual',
      adjustments: [
        {
          description: `${state.stateName} apportionment`,
          amount: 0, // Handled by apportionment factor
          type: 'permanent',
          category: 'apportionment',
        },
      ],
    });

    provisions.push(provision);
    console.log(`${state.stateName}: $${provision.totalProvision.toLocaleString()} (ETR: ${(provision.effectiveTaxRate * 100).toFixed(2)}%)`);
  }

  // Summarize total state exposure
  const totalState = provisions.reduce((sum, p) => sum + p.totalProvision, 0);
  console.log(`\nTotal State Tax Provision: $${totalState.toLocaleString()}`);

  return provisions;
}
```

### Example 2: Track Estimated Payments and Penalty Exposure

```typescript
import { TaxPaymentService, PenaltyCalculator } from '@mcv/treasury/tax';

async function manageEstimatedPayments(ventureId: string, taxYear: number) {
  const paymentService = new TaxPaymentService();

  // Generate payment schedule based on estimated annual liability
  const schedule = await paymentService.generateSchedule({
    ventureId,
    jurisdictionId: 'US-FED',
    taxYear,
    estimatedAnnualLiability: 500_000,
    priorYearLiability: 420_000,
    safeHarborMethod: 'prior_year_110',   // 110% of PY for AGI > $150K
  });

  console.log('Estimated Payment Schedule:');
  for (const q of schedule.quarters) {
    console.log(`  Q${q.quarter}: Due ${q.dueDate.toLocaleDateString()}`);
    console.log(`    Required: $${q.requiredAmount.toLocaleString()}`);
    console.log(`    Paid:     $${q.paidAmount.toLocaleString()}`);
    console.log(`    Status:   ${q.status}`);
  }

  // Record a payment
  const payment = await paymentService.recordPayment({
    ventureId,
    jurisdictionId: 'US-FED',
    taxYear,
    quarter: 1,
    amount: 125_000,
    paymentDate: new Date(`${taxYear}-04-15`),
    paymentMethod: 'eftps',
    confirmationNumber: 'EFTPS-2025-Q1-001234',
  });

  console.log(`Payment recorded: $${payment.amount} on ${payment.paymentDate.toLocaleDateString()}`);
  console.log(`Confirmation: ${payment.confirmationNumber}`);
  console.log(`Safe harbor met: ${payment.safeHarborMet ? 'Yes' : 'No'}`);

  // Check penalty exposure
  const penalty = await paymentService.calculatePenalty({
    ventureId,
    jurisdictionId: 'US-FED',
    taxYear,
    method: 'regular',
  });

  if (penalty.penaltyApplicable) {
    console.log(`\n⚠️ Underpayment Penalty Exposure: $${penalty.penaltyAmount.toLocaleString()}`);
    console.log(`Annualized Rate: ${(penalty.annualizedRate * 100).toFixed(1)}%`);

    for (const q of penalty.quarterlyDetail) {
      if (q.underpayment > 0) {
        console.log(`  Q${q.quarter}: Underpaid by $${q.underpayment.toLocaleString()} (${q.daysLate} days late)`);
        console.log(`    Penalty: $${q.penaltyForQuarter.toLocaleString()}`);
      }
    }

    if (penalty.waiverEligible) {
      console.log(`Waiver may be available: ${penalty.waiverReason}`);
    }
  } else {
    console.log('\n✅ No underpayment penalty exposure — safe harbor satisfied.');
  }
}

// Track payments across all jurisdictions
async function getPaymentDashboard(ventureId: string, taxYear: number) {
  const paymentService = new TaxPaymentService();

  const allSchedules = await paymentService.getAllSchedules(ventureId, taxYear);

  let totalRequired = 0;
  let totalPaid = 0;

  for (const schedule of allSchedules) {
    totalRequired += schedule.totalRequired;
    totalPaid += schedule.totalPaid;

    const status = schedule.totalPaid >= schedule.totalRequired ? '✅' : '⚠️';
    console.log(`${status} ${schedule.jurisdictionId}: Paid $${schedule.totalPaid.toLocaleString()} / $${schedule.totalRequired.toLocaleString()}`);
  }

  console.log(`\nTotal across all jurisdictions:`);
  console.log(`  Required: $${totalRequired.toLocaleString()}`);
  console.log(`  Paid:     $${totalPaid.toLocaleString()}`);
  console.log(`  Remaining: $${(totalRequired - totalPaid).toLocaleString()}`);
}
```

### Example 3: Create Transfer Pricing Documentation

```typescript
import { TransferPricingService } from '@mcv/treasury/tax';

async function createTPDocumentation(ventureId: string, taxYear: number) {
  const tpService = new TransferPricingService();

  // Document an intercompany software licensing arrangement
  const doc = await tpService.createDocument({
    ventureId,
    taxYear,
    documentType: 'local_file',
    method: 'tnmm',
    testedParty: 'MCV Canada Ltd.',
    profitLevelIndicator: 'operating_margin',

    transactions: [
      {
        fromEntityId: 'entity-us-parent',
        fromEntityName: 'MCV Corp (US)',
        fromJurisdiction: 'US',
        toEntityId: 'entity-ca-sub',
        toEntityName: 'MCV Canada Ltd.',
        toJurisdiction: 'CA',
        transactionType: 'intangible_license',
        description: 'License of proprietary SaaS platform technology',
        amount: 2_400_000,
        currency: 'USD',
        frequency: 'annual',
        startDate: new Date(`${taxYear}-01-01`),
      },
      {
        fromEntityId: 'entity-us-parent',
        fromEntityName: 'MCV Corp (US)',
        fromJurisdiction: 'US',
        toEntityId: 'entity-ca-sub',
        toEntityName: 'MCV Canada Ltd.',
        toJurisdiction: 'CA',
        transactionType: 'management_fee',
        description: 'Centralized management and administrative services',
        amount: 600_000,
        currency: 'USD',
        frequency: 'annual',
        startDate: new Date(`${taxYear}-01-01`),
      },
    ],

    comparableAnalysis: {
      searchStrategy: 'Functional analysis-driven search for comparable independent licensees',
      databases: ['S&P Capital IQ', 'Bureau van Dijk ORBIS'],
      initialResults: 847,
      screeningCriteria: [
        'SIC codes 7371-7379 (Computer Programming, Services)',
        'Revenue $5M-$100M',
        'Publicly available financial data for 3+ years',
        'No recent M&A activity',
        'Positive operating income in majority of years',
        'Software/technology licensing as primary business',
      ],
      finalComparables: [
        {
          companyName: 'TechLicense Corp',
          sicCode: '7372',
          country: 'US',
          revenue: 45_000_000,
          profitIndicator: 0.12,
          yearsUsed: `${taxYear - 2}-${taxYear}`,
        },
        {
          companyName: 'SoftDistribute Inc',
          sicCode: '7371',
          country: 'CA',
          revenue: 28_000_000,
          profitIndicator: 0.09,
          yearsUsed: `${taxYear - 2}-${taxYear}`,
        },
        {
          companyName: 'CloudPlatform Services',
          sicCode: '7374',
          country: 'US',
          revenue: 62_000_000,
          profitIndicator: 0.15,
          yearsUsed: `${taxYear - 2}-${taxYear}`,
        },
        {
          companyName: 'Digital Solutions Ltd',
          sicCode: '7372',
          country: 'UK',
          revenue: 31_000_000,
          profitIndicator: 0.11,
          yearsUsed: `${taxYear - 2}-${taxYear}`,
        },
      ],
      rejectedComparables: [
        {
          companyName: 'MegaSoft International',
          rejectionReason: 'Revenue exceeds $500M, not functionally comparable',
        },
        {
          companyName: 'StartupTech LLC',
          rejectionReason: 'Less than 3 years of financial data available',
        },
      ],
    },

    armLengthRange: {
      lowerQuartile: 0.09,
      median: 0.115,
      upperQuartile: 0.14,
      minimum: 0.07,
      maximum: 0.18,
      testedPartyResult: 0.11,
      withinRange: true,
    },

    narrative: `MCV Canada Ltd. operates as a limited-risk distributor of the MCV SaaS platform
in the Canadian market. The Canadian entity performs routine sales, marketing, and
customer support functions, utilizing intangible property licensed from the US parent.
The TNMM was selected as the most appropriate method given the availability of
comparable independent companies performing similar functions.`,

    functionalAnalysis: `Functions performed: Local sales and marketing, customer onboarding,
Tier 1 customer support, local regulatory compliance.
Assets used: Office lease, computer equipment, customer lists (limited).
Risks assumed: Limited market risk, no technology risk, minimal credit risk.
The Canadian entity bears routine risks commensurate with its limited functions.`,

    economicAnalysis: `The tested party's operating margin of 11.0% falls within the
interquartile range of 9.0% to 14.0% established by the comparable companies.
No adjustment to the intercompany pricing is required.`,

    preparedBy: 'user-tax-analyst-1',
  });

  console.log(`Transfer Pricing Doc created: ${doc.id}`);
  console.log(`Method: ${doc.method}`);
  console.log(`Conclusion: ${doc.conclusion}`);
  console.log(`Tested party result: ${(doc.armLengthRange.testedPartyResult * 100).toFixed(1)}%`);
  console.log(`IQR: ${(doc.armLengthRange.lowerQuartile * 100).toFixed(1)}% - ${(doc.armLengthRange.upperQuartile * 100).toFixed(1)}%`);
  console.log(`Within range: ${doc.armLengthRange.withinRange ? '✅ Yes' : '❌ No'}`);

  return doc;
}
```

### Example 4: Track R&D Tax Credits

```typescript
import { RDCreditService } from '@mcv/treasury/tax';

async function calculateRDCredit(ventureId: string, entityId: string, taxYear: number) {
  const rdService = new RDCreditService();

  // Create R&D credit calculation with qualifying activities
  const credit = await rdService.createCredit({
    ventureId,
    entityId,
    taxYear,
    jurisdictionId: 'US-FED',
    calculationMethod: 'alternative_simplified',

    activities: [
      {
        projectName: 'Next-Gen Smart Contract Engine',
        projectDescription: 'Development of a novel smart contract execution engine with formal verification capabilities for the MCV platform.',
        businessComponent: 'Smart contract processing module',
        fourPartTest: {
          permittedPurpose: {
            met: true,
            explanation: 'Developing new functionality for automated contract verification that does not exist in current platform, improving reliability and security of smart contract execution.',
          },
          technologicalInNature: {
            met: true,
            explanation: 'Relies on computer science principles including formal methods, abstract interpretation, and symbolic execution for contract verification.',
            disciplines: ['computer_science', 'cryptography', 'formal_methods'],
          },
          eliminationOfUncertainty: {
            met: true,
            explanation: 'Uncertainty existed regarding whether formal verification could be performed in real-time on Solidity contracts without prohibitive computational overhead.',
            uncertaintyType: 'capability',
          },
          processOfExperimentation: {
            met: true,
            explanation: 'Systematic evaluation of multiple verification approaches including model checking, theorem proving, and abstract interpretation. Conducted benchmark testing across 500+ contract patterns.',
            experimentationType: 'systematic_trial_and_error',
          },
        },
        personnel: [
          {
            employeeId: 'emp-001',
            employeeName: 'Alice Chen',
            title: 'Senior Blockchain Engineer',
            percentQualifying: 0.80,
            wages: 185_000,
            qualifyingWages: 148_000,
          },
          {
            employeeId: 'emp-002',
            employeeName: 'Bob Martinez',
            title: 'Formal Verification Researcher',
            percentQualifying: 1.00,
            wages: 165_000,
            qualifyingWages: 165_000,
          },
          {
            employeeId: 'emp-003',
            employeeName: 'Carol Kim',
            title: 'Software Engineer',
            percentQualifying: 0.50,
            wages: 145_000,
            qualifyingWages: 72_500,
          },
        ],
        supplies: [
          {
            description: 'Cloud compute for verification testing (GPU instances)',
            amount: 45_000,
            qualifyingAmount: 45_000,
          },
        ],
        contractResearch: [
          {
            vendorName: 'University of Waterloo - Formal Methods Lab',
            description: 'Contracted research on abstract interpretation techniques for EVM bytecode',
            totalPayment: 120_000,
            qualifyingAmount: 78_000,    // 65% of total
          },
        ],
        totalQREs: 508_500,
        startDate: new Date(`${taxYear}-01-15`),
        status: 'active',
      },
      {
        projectName: 'Adaptive Gas Optimization',
        projectDescription: 'Research into novel gas estimation and optimization algorithms for cross-chain transactions.',
        businessComponent: 'Transaction processing gas module',
        fourPartTest: {
          permittedPurpose: {
            met: true,
            explanation: 'Developing new algorithm to improve performance of gas estimation across heterogeneous blockchain networks.',
          },
          technologicalInNature: {
            met: true,
            explanation: 'Utilizes machine learning, graph theory, and distributed systems principles for gas prediction models.',
            disciplines: ['computer_science', 'machine_learning'],
          },
          eliminationOfUncertainty: {
            met: true,
            explanation: 'Uncertainty existed regarding whether ML models could achieve sub-5% prediction accuracy for gas costs across chains with different fee mechanisms.',
            uncertaintyType: 'method',
          },
          processOfExperimentation: {
            met: true,
            explanation: 'Evaluated LSTM, transformer, and ensemble approaches against historical gas data from 8 chains. Conducted A/B testing of prediction models in production.',
            experimentationType: 'modeling',
          },
        },
        personnel: [
          {
            employeeId: 'emp-004',
            employeeName: 'David Park',
            title: 'ML Engineer',
            percentQualifying: 0.70,
            wages: 175_000,
            qualifyingWages: 122_500,
          },
        ],
        supplies: [
          {
            description: 'ML training compute (TPU v4 instances)',
            amount: 32_000,
            qualifyingAmount: 32_000,
          },
        ],
        contractResearch: [],
        totalQREs: 154_500,
        startDate: new Date(`${taxYear}-03-01`),
        status: 'completed',
      },
    ],
  });

  console.log('R&D Tax Credit Calculation:');
  console.log(`  Method: ${credit.calculationMethod}`);
  console.log(`  Total QREs: $${credit.qualifyingExpenses.totalQREs.toLocaleString()}`);
  console.log(`    Wages:    $${credit.qualifyingExpenses.wages.toLocaleString()}`);
  console.log(`    Supplies: $${credit.qualifyingExpenses.supplies.toLocaleString()}`);
  console.log(`    Contract: $${credit.qualifyingExpenses.contractResearch.toLocaleString()}`);
  console.log(`  Gross Credit: $${credit.grossCredit.toLocaleString()}`);
  console.log(`  §280C Reduction: $${(credit.section280CReduction ?? 0).toLocaleString()}`);
  console.log(`  Net Credit: $${credit.netCredit.toLocaleString()}`);
  console.log(`  Activities: ${credit.activities.length}`);
  console.log(`  Four-Part Test Documented: ${credit.fourPartTestDocumented ? '✅' : '❌'}`);
  console.log(`  Contemporaneous Documentation: ${credit.contemporaneousDocumentation ? '✅' : '❌'}`);

  return credit;
}
```

### Example 5: Determine Sales Tax Nexus

```typescript
import { SalesTaxNexusService, NexusAnalyzer } from '@mcv/treasury/tax';

async function analyzeNexusAllStates(ventureId: string, entityId: string, taxYear: number) {
  const nexusService = new SalesTaxNexusService();
  const analyzer = new NexusAnalyzer();

  // Pull revenue data by state (from sales/billing module)
  const stateRevenue = await nexusService.getRevenueByState(ventureId, taxYear);

  // Analyze nexus for all states
  const results = await analyzer.analyzeAllStates({
    ventureId,
    entityId,
    taxYear,
    stateRevenue,
    physicalPresence: {
      offices: ['CA', 'NY'],              // States with physical offices
      employees: ['CA', 'NY', 'TX', 'WA'], // States with employees
      inventory: [],                       // No physical inventory
    },
  });

  console.log('Sales Tax Nexus Analysis:');
  console.log('═══════════════════════════════════════════════════════');

  const nexusStates = results.filter(r => r.hasNexus);
  const approachingStates = results.filter(r =>
    !r.hasNexus && r.status === 'approaching_threshold'
  );

  console.log(`\n🔴 Nexus Established (${nexusStates.length} states):`);
  for (const state of nexusStates) {
    const pctRevenue = state.economicNexus.actualRevenue / state.economicNexus.revenueThreshold * 100;
    console.log(`  ${state.stateCode} (${state.stateName}): ${state.nexusType}`);
    console.log(`    Revenue: $${state.economicNexus.actualRevenue.toLocaleString()} / $${state.economicNexus.revenueThreshold.toLocaleString()} (${pctRevenue.toFixed(0)}%)`);
    console.log(`    Transactions: ${state.economicNexus.actualTransactions} / ${state.economicNexus.transactionThreshold}`);
    console.log(`    Registered: ${state.registered ? '✅' : '❌ ACTION REQUIRED'}`);
  }

  console.log(`\n🟡 Approaching Threshold (${approachingStates.length} states):`);
  for (const state of approachingStates) {
    const pctRevenue = state.economicNexus.actualRevenue / state.economicNexus.revenueThreshold * 100;
    console.log(`  ${state.stateCode} (${state.stateName}): ${pctRevenue.toFixed(0)}% of revenue threshold`);
    console.log(`    Revenue: $${state.economicNexus.actualRevenue.toLocaleString()} / $${state.economicNexus.revenueThreshold.toLocaleString()}`);
  }

  // Record determinations
  for (const result of results) {
    await nexusService.recordDetermination({
      ventureId,
      entityId,
      stateCode: result.stateCode,
      stateName: result.stateName,
      taxYear,
      nexusType: result.nexusType,
      hasNexus: result.hasNexus,
      determinationDate: new Date(),
      economicNexus: result.economicNexus,
      physicalPresence: result.physicalPresence,
      status: result.status,
      reviewedBy: 'user-tax-analyst-1',
      nextReviewDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90 days
    });
  }

  // Generate collection obligation summary
  const obligations = await nexusService.getCollectionObligations(ventureId);
  console.log(`\n📋 Collection Obligations:`);
  for (const ob of obligations) {
    const status = ob.collectingTax ? '✅ Collecting' : '❌ Not collecting';
    console.log(`  ${ob.stateCode}: ${status} | Filing: ${ob.filingFrequency} | Next: ${ob.nextFilingDate.toLocaleDateString()}`);
    if (ob.actionItems.length > 0) {
      for (const action of ob.actionItems) {
        console.log(`    → ${action}`);
      }
    }
  }

  return results;
}
```

### Example 6: Classify Crypto Tax Events

```typescript
import { CryptoTaxService, CostBasisEngine } from '@mcv/treasury/tax';

async function processCryptoTaxEvents(ventureId: string, entityId: string, taxYear: number) {
  const cryptoService = new CryptoTaxService();
  const costBasisEngine = new CostBasisEngine();

  // Import on-chain events from @mcv/web3-core
  const onChainEvents = await cryptoService.importFromWeb3Core({
    ventureId,
    entityId,
    taxYear,
    chains: ['ethereum', 'solana', 'polygon'],
    walletAddresses: [
      '0x1234...abcd',
      '0x5678...efgh',
    ],
    fmvSource: 'coingecko',
  });

  console.log(`Imported ${onChainEvents.length} on-chain events`);

  // Classify events automatically
  const classified = await cryptoService.classifyEvents(onChainEvents);

  // Summary by event type
  const summary: Record<string, { count: number; totalFmv: number }> = {};
  for (const event of classified) {
    if (!summary[event.eventType]) {
      summary[event.eventType] = { count: 0, totalFmv: 0 };
    }
    summary[event.eventType].count++;
    summary[event.eventType].totalFmv += event.fairMarketValue;
  }

  console.log('\nEvent Classification Summary:');
  for (const [type, data] of Object.entries(summary)) {
    console.log(`  ${type}: ${data.count} events, $${data.totalFmv.toLocaleString()} total FMV`);
  }

  // Calculate cost basis for dispositions using HIFO method
  const dispositions = classified.filter(e =>
    ['sale', 'trade', 'nft_sale'].includes(e.eventType)
  );

  const gainLossReport = await costBasisEngine.calculateGainLoss({
    ventureId,
    entityId,
    taxYear,
    events: dispositions,
    method: 'hifo',          // Highest In, First Out — minimizes gains
  });

  console.log('\nCapital Gains/Losses:');
  console.log(`  Short-term gains:  $${gainLossReport.shortTermGain.toLocaleString()}`);
  console.log(`  Short-term losses: $${gainLossReport.shortTermLoss.toLocaleString()}`);
  console.log(`  Long-term gains:   $${gainLossReport.longTermGain.toLocaleString()}`);
  console.log(`  Long-term losses:  $${gainLossReport.longTermLoss.toLocaleString()}`);
  console.log(`  Net gain/(loss):   $${gainLossReport.netGainLoss.toLocaleString()}`);

  // Handle staking rewards as ordinary income
  const stakingRewards = classified.filter(e => e.eventType === 'staking_reward');
  const totalStakingIncome = stakingRewards.reduce((sum, e) => sum + e.fairMarketValue, 0);
  console.log(`\nStaking Rewards (ordinary income): $${totalStakingIncome.toLocaleString()}`);
  console.log(`  Events: ${stakingRewards.length}`);

  // Handle airdrops — taxable at FMV on receipt
  const airdrops = classified.filter(e => e.eventType === 'airdrop');
  const totalAirdropIncome = airdrops.reduce((sum, e) => sum + e.fairMarketValue, 0);
  console.log(`\nAirdrops (ordinary income): $${totalAirdropIncome.toLocaleString()}`);
  console.log(`  Events: ${airdrops.length}`);

  // Generate Form 8949 data
  const form8949 = await cryptoService.generateForm8949({
    ventureId,
    entityId,
    taxYear,
    method: 'hifo',
  });

  console.log(`\nForm 8949 generated: ${form8949.partI.length} short-term, ${form8949.partII.length} long-term transactions`);

  return {
    classified,
    gainLossReport,
    stakingIncome: totalStakingIncome,
    airdropIncome: totalAirdropIncome,
    form8949,
  };
}
```

### Example 7: Manage Tax Filing Calendar

```typescript
import { TaxCalendarService } from '@mcv/treasury/tax';

async function setupAndMonitorCalendar(ventureId: string, taxYear: number) {
  const calendarService = new TaxCalendarService();

  // Auto-generate calendar based on entity registrations
  const entries = await calendarService.generateCalendar({
    ventureId,
    taxYear,
    includeExtensions: true,
  });

  console.log(`Generated ${entries.length} calendar entries for TY${taxYear}`);

  // Get upcoming deadlines (next 30 days)
  const upcoming = await calendarService.getUpcoming({
    ventureId,
    daysAhead: 30,
    statuses: ['not_started', 'in_progress'],
  });

  console.log(`\n📅 Upcoming Deadlines (next 30 days):`);
  for (const entry of upcoming) {
    const daysUntil = Math.ceil(
      (entry.effectiveDueDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
    );
    const urgency = daysUntil <= 7 ? '🔴' : daysUntil <= 14 ? '🟡' : '🟢';
    console.log(`  ${urgency} ${entry.formNumber} (${entry.jurisdictionName}) — ${entry.effectiveDueDate.toLocaleDateString()} (${daysUntil} days)`);
    console.log(`     Status: ${entry.status} | Assigned: ${entry.assignedTo ?? 'Unassigned'}`);
  }

  // File an extension for federal return
  const federalEntry = entries.find(
    e => e.jurisdictionId === 'US-FED' && e.filingType === 'income_tax'
  );

  if (federalEntry) {
    const extension = await calendarService.fileExtension({
      calendarEntryId: federalEntry.id,
      extensionDate: new Date(`${taxYear + 1}-10-15`),
      reason: 'Additional time needed for consolidated return preparation',
      filedBy: 'user-tax-manager-1',
    });

    console.log(`\n📋 Extension filed for ${federalEntry.formNumber}:`);
    console.log(`  Original due: ${federalEntry.originalDueDate.toLocaleDateString()}`);
    console.log(`  Extended to:  ${extension.extendedDueDate.toLocaleDateString()}`);
    console.log(`  Status: ${extension.status}`);
  }

  // Set up reminders
  await calendarService.configureReminders({
    ventureId,
    defaultReminders: [
      { daysBefore: 30, channel: 'email' },
      { daysBefore: 14, channel: 'slack' },
      { daysBefore: 7, channel: 'slack' },
      { daysBefore: 3, channel: 'email' },
      { daysBefore: 1, channel: 'sms' },
    ],
    recipients: ['tax-team@mcv.com', 'cfo@mcv.com'],
  });

  return entries;
}
```

---

## Error Codes

| Code | Name | Description | HTTP Status |
|------|------|-------------|-------------|
| `TAX_PROVISION_NOT_FOUND` | Provision Not Found | The requested tax provision does not exist or is not accessible to the current venture. | 404 |
| `TAX_PROVISION_LOCKED` | Provision Locked | Cannot modify a provision that has been locked for financial statement inclusion. Unlock first or create a new version. | 409 |
| `TAX_PROVISION_INVALID_PERIOD` | Invalid Tax Period | The specified tax period is invalid or does not match the entity's fiscal year configuration. | 400 |
| `TAX_PAYMENT_DUPLICATE` | Duplicate Payment | A payment with the same jurisdiction, quarter, and confirmation number already exists. | 409 |
| `TAX_PAYMENT_EXCEEDS_LIABILITY` | Payment Exceeds Liability | The payment amount exceeds the estimated total tax liability for this jurisdiction and year. Review and confirm if intentional. | 422 |
| `TAX_CALENDAR_PAST_DUE` | Filing Past Due | The filing deadline has passed. File immediately or record a late filing with potential penalty exposure. | 422 |
| `TAX_CALENDAR_EXTENSION_EXPIRED` | Extension Already Expired | Cannot file an extension for a deadline whose extension period has already passed. | 422 |
| `TAX_ENTITY_INVALID_CLASSIFICATION` | Invalid Entity Classification | The specified tax classification is not valid for the entity's legal structure or jurisdiction. | 400 |
| `TAX_ENTITY_ELECTION_CONFLICT` | Election Conflict | The requested entity election conflicts with an existing election. Only one classification change per 60-month period is allowed (Check-the-Box). | 409 |
| `TAX_TP_NO_COMPARABLES` | No Comparables Found | The transfer pricing benchmarking analysis found no qualifying comparable companies. Broaden screening criteria. | 422 |
| `TAX_TP_OUTSIDE_RANGE` | Result Outside Arm's Length Range | The tested party's result falls outside the interquartile range. An adjustment may be required. | 422 |
| `TAX_RD_FOUR_PART_INCOMPLETE` | Four-Part Test Incomplete | All four parts of the R&D qualification test must be documented before the credit can be calculated. | 400 |
| `TAX_RD_NO_QRES` | No Qualifying Research Expenses | No qualifying research expenses were identified for the specified tax year and entity. | 422 |
| `TAX_NEXUS_THRESHOLD_MISSING` | Nexus Threshold Missing | No nexus threshold data is available for the specified state. Update the nexus_thresholds table. | 404 |
| `TAX_NEXUS_ALREADY_REGISTERED` | Already Registered | The entity is already registered for sales tax collection in this state. | 409 |
| `TAX_WITHHOLDING_NO_TREATY` | No Treaty Available | No tax treaty exists between the specified source and recipient countries for this income type. Statutory rate applies. | 404 |
| `TAX_W8_EXPIRED` | W-8 Form Expired | The W-8 form on file has expired. A new form must be collected before treaty benefits can be applied. | 422 |
| `TAX_CRYPTO_FMV_UNAVAILABLE` | FMV Not Available | Fair market value could not be determined for the specified token at the event timestamp. Manual valuation required. | 422 |
| `TAX_CRYPTO_LOT_EXHAUSTED` | Cost Basis Lot Exhausted | The specified tax lot has been fully disposed. No remaining amount available for additional dispositions. | 409 |
| `TAX_CRYPTO_DUPLICATE_TX` | Duplicate Transaction | A crypto tax event with this transaction hash already exists for this venture. | 409 |
| `TAX_CONSOLIDATED_INELIGIBLE` | Ineligible for Consolidation | One or more entities do not meet the ownership threshold (80%+) required for consolidated return filing. | 422 |
| `TAX_DEFERRED_RATE_MISMATCH` | Enacted Rate Mismatch | The enacted tax rate used for deferred tax calculation does not match the current rate for this jurisdiction. Review for rate change impact. | 422 |
| `TAX_JURISDICTION_NOT_SUPPORTED` | Jurisdiction Not Supported | The specified jurisdiction is not currently supported by the tax module. | 400 |
| `TAX_VENTURE_ACCESS_DENIED` | Access Denied | The current user does not have permission to access tax data for this venture. | 403 |

---

## Security

### Data Protection

- **Row-Level Security (RLS):** All tax tables enforce RLS on `venture_id`. Users can only access tax data for ventures they are authorized members of. RLS policies are defined at the Supabase level and cannot be bypassed through the application layer.
- **Sensitive Data Classification:** Tax identification numbers (EINs, FTINs), W-8 form contents, and entity election documents are classified as PII/sensitive. These fields are encrypted at rest using Supabase Vault and redacted in API responses unless the caller has the `tax:sensitive:read` permission.
- **Audit Logging:** Every tax provision creation, modification, lock, payment recording, and filing action is logged to an immutable audit trail. Logs include the actor, timestamp, previous values, and new values. Tax auditors can request complete audit trails for any tax year.
- **Document Storage:** Tax returns, W-8 forms, transfer pricing studies, and R&D credit documentation are stored in encrypted object storage (Supabase Storage) with access controlled by venture-scoped policies. Documents are versioned; deletions are soft-deletes.

### Access Control

| Permission | Description |
|---|---|
| `tax:provision:read` | View tax provisions and provision lines |
| `tax:provision:write` | Create and edit draft provisions |
| `tax:provision:approve` | Approve provisions for financial statements |
| `tax:provision:lock` | Lock/unlock provisions |
| `tax:payment:read` | View payment records and schedules |
| `tax:payment:write` | Record and modify payments |
| `tax:calendar:read` | View filing calendar and deadlines |
| `tax:calendar:manage` | File extensions, update statuses, configure reminders |
| `tax:tp:read` | View transfer pricing documentation |
| `tax:tp:write` | Create and edit TP documents |
| `tax:tp:approve` | Approve final TP documentation |
| `tax:rd:read` | View R&D credit data |
| `tax:rd:write` | Create and edit R&D credits and activities |
| `tax:nexus:read` | View nexus determinations |
| `tax:nexus:write` | Create and update nexus records |
| `tax:withholding:read` | View withholding rates and W-8 forms |
| `tax:withholding:manage` | Manage W-8 forms and treaty claims |
| `tax:crypto:read` | View crypto tax events and lots |
| `tax:crypto:write` | Create and classify crypto events |
| `tax:entity:read` | View tax entity classifications |
| `tax:entity:manage` | Modify classifications and file elections |
| `tax:sensitive:read` | Access EINs, TINs, and unredacted sensitive data |
| `tax:export` | Export tax data packages |
| `tax:admin` | Full administrative access to all tax functions |

### Compliance Considerations

- **SOX Compliance:** Provision lock mechanism ensures that financial statement-impacting tax data cannot be altered after approval. All changes require a new version.
- **Transfer Pricing Documentation:** Maintained per OECD Transfer Pricing Guidelines and IRC §482 regulations. Master File, Local File, and Country-by-Country reporting templates follow BEPS Action 13 requirements.
- **R&D Credit Audit Defense:** Four-part test documentation is structured to satisfy IRS examination standards. Contemporaneous documentation flags alert users when real-time record-keeping requirements are not met.
- **FATCA Compliance:** W-8 form management ensures withholding agents have valid forms on file. Automatic expiration tracking and renewal reminders prevent inadvertent compliance failures.

---

## Environment Variables

| Variable | Description | Required | Default |
|---|---|---|---|
| `TAX_DATABASE_URL` | PostgreSQL connection string for tax schema | Yes | — |
| `TAX_SUPABASE_URL` | Supabase project URL | Yes | — |
| `TAX_SUPABASE_SERVICE_KEY` | Supabase service role key (server-side only) | Yes | — |
| `TAX_ENCRYPTION_KEY` | AES-256 key for encrypting sensitive tax data (EINs, TINs) | Yes | — |
| `TAX_COINGECKO_API_KEY` | CoinGecko API key for crypto FMV lookups | No | — |
| `TAX_CHAINLINK_NODE_URL` | Chainlink price oracle endpoint for on-chain FMV | No | — |
| `TAX_REMINDER_EMAIL_FROM` | Sender address for calendar reminder emails | No | `tax@mcv.app` |
| `TAX_REMINDER_SLACK_WEBHOOK` | Slack webhook URL for calendar reminders | No | — |
| `TAX_REMINDER_SMS_PROVIDER` | SMS provider for urgent deadline reminders (`twilio` / `aws_sns`) | No | — |
| `TAX_DOCUMENT_STORAGE_BUCKET` | Supabase Storage bucket for tax documents | No | `tax-documents` |
| `TAX_SAFE_HARBOR_AUTO_CALC` | Automatically calculate safe harbor thresholds on payment recording | No | `true` |
| `TAX_NEXUS_AUTO_REVIEW_DAYS` | Days between automatic nexus re-evaluation | No | `90` |
| `TAX_CRYPTO_FMV_CACHE_TTL` | Cache TTL (seconds) for crypto price lookups | No | `300` |
| `TAX_RATE_UPDATE_SOURCE` | Source for automatic tax rate updates (`manual` / `api`) | No | `manual` |
| `TAX_LOG_LEVEL` | Logging verbosity (`debug` / `info` / `warn` / `error`) | No | `info` |

---

## Dependencies

### Internal Dependencies

| Package | Usage |
|---|---|
| `@mcv/finance` | GL account balances, journal entry data for provision calculations, pre-tax income retrieval |
| `@mcv/treasury/entity` | Legal entity structure, ownership hierarchy, jurisdiction registrations |
| `@mcv/web3-core` | On-chain transaction data, token transfer events, wallet monitoring for crypto tax events |
| `@mcv/compliance` | Regulatory calendar integration, compliance status checks, audit trail infrastructure |
| `@mcv/auth` | User authentication, venture membership verification, permission checking |
| `@mcv/notifications` | Email, Slack, SMS delivery for calendar reminders and deadline alerts |
| `@mcv/documents` | Document storage, versioning, and retrieval for tax returns and supporting docs |

### External Dependencies

| Package | Version | Usage |
|---|---|---|
| `drizzle-orm` | `^0.30.x` | Database ORM for all tax table operations |
| `@supabase/supabase-js` | `^2.x` | Supabase client for RLS-enforced database access and storage |
| `@trpc/server` | `^10.x` | tRPC router definition for tax API procedures |
| `zod` | `^3.x` | Input validation for all tRPC procedures and service methods |
| `date-fns` | `^3.x` | Date arithmetic for deadline calculations, fiscal year handling, penalty day counting |
| `decimal.js` | `^10.x` | Precise decimal arithmetic for tax calculations (avoids floating-point issues) |
| `rrule` | `^2.x` | Recurrence rules for recurring filing deadlines and payment schedules |
| `node-cron` | `^3.x` | Scheduled jobs for reminder dispatch and nexus re-evaluation |
| `csv-stringify` | `^6.x` | CSV generation for tax data exports |
| `exceljs` | `^4.x` | Excel workbook generation for provision worksheets and tax packages |
| `pdfkit` | `^0.14.x` | PDF generation for transfer pricing reports and R&D credit summaries |

---

## Testing

### Unit Tests

```bash
# Run all tax module unit tests
pnpm test --filter=@mcv/treasury/tax

# Run specific sub-module tests
pnpm test --filter=@mcv/treasury/tax -- --grep "provision"
pnpm test --filter=@mcv/treasury/tax -- --grep "penalty"
pnpm test --filter=@mcv/treasury/tax -- --grep "nexus"
pnpm test --filter=@mcv/treasury/tax -- --grep "crypto"
pnpm test --filter=@mcv/treasury/tax -- --grep "transfer-pricing"
```

### Key Test Categories

| Category | Test Count | Coverage Focus |
|---|---|---|
| Provision Calculations | ~45 tests | Rate application, apportionment, permanent/temporary differences, multi-jurisdiction, ETR reconciliation |
| Estimated Payments | ~30 tests | Safe harbor methods (100%/110% PY, 100% CY), quarterly allocation, penalty calculation per §6654/§6655 |
| Tax Calendar | ~25 tests | Deadline generation by entity type, weekend/holiday adjustments, extension filing, reminder scheduling |
| Transfer Pricing | ~35 tests | All 5 TP methods, arm's length range computation, comparable screening, TNMM margin analysis |
| R&D Credits | ~40 tests | Four-part test validation, QRE aggregation, regular vs ASC method, §280C reduction, carryforward |
| Withholding Tax | ~20 tests | Treaty rate lookup, W-8 form validation/expiration, FATCA status checks |
| Sales Tax Nexus | ~30 tests | Economic nexus thresholds (all 50 states), physical presence, marketplace facilitator rules |
| Crypto Tax | ~50 tests | All 20 event types, FIFO/LIFO/HIFO/SpecID cost basis, lot tracking, Form 8949 generation |
| Deferred Tax | ~25 tests | Temporary difference identification, DTA/DTL calculation, valuation allowance, rate change impact |
| Consolidated Returns | ~20 tests | Group eligibility (80% ownership), intercompany eliminations, consolidated income computation |
| Entity Classification | ~15 tests | Check-the-box elections, 60-month rule, classification change impact |

### Integration Tests

```typescript
// test/integration/provision-pipeline.test.ts
describe('Provision Pipeline Integration', () => {
  it('should calculate provision from GL data through to locked state', async () => {
    // 1. Seed GL data in @mcv/finance
    // 2. Calculate provision
    // 3. Review and approve
    // 4. Lock for financial statements
    // 5. Verify locked provision cannot be modified
    // 6. Verify audit trail is complete
  });

  it('should correctly handle multi-state apportionment', async () => {
    // 1. Set up entity with nexus in CA, NY, TX
    // 2. Calculate provisions for all 3 states
    // 3. Verify apportionment factors sum correctly
    // 4. Verify combined state + federal provision
  });
});

// test/integration/crypto-pipeline.test.ts
describe('Crypto Tax Pipeline Integration', () => {
  it('should process on-chain events end-to-end', async () => {
    // 1. Import events from web3-core mock
    // 2. Classify all events
    // 3. Create tax lots for acquisitions
    // 4. Calculate cost basis for dispositions
    // 5. Generate Form 8949 report
    // 6. Verify gain/loss totals
  });
});

// test/integration/nexus-monitoring.test.ts
describe('Nexus Monitoring Integration', () => {
  it('should detect nexus threshold crossing and trigger registration action', async () => {
    // 1. Seed revenue data below threshold
    // 2. Run nexus analysis — should be 'no_nexus'
    // 3. Add revenue pushing over threshold
    // 4. Run analysis again — should be 'nexus_established'
    // 5. Verify action items generated
  });
});
```

### Test Data & Fixtures

The tax module includes comprehensive test fixtures:

- **`fixtures/federal-rates.json`** — US federal tax rate tables (current + historical)
- **`fixtures/state-rates.json`** — All 50 state corporate income tax rates
- **`fixtures/nexus-thresholds.json`** — Economic nexus thresholds for all 50 states
- **`fixtures/treaty-rates.json`** — US treaty withholding rates for top 30 trading partners
- **`fixtures/crypto-events.json`** — 200+ sample on-chain events across multiple chains/tokens
- **`fixtures/provision-scenarios.json`** — 10 provision calculation scenarios with expected outputs
- **`fixtures/penalty-scenarios.json`** — 8 underpayment penalty scenarios (regular + annualized)
- **`fixtures/tp-comparables.json`** — Sample comparable company data for transfer pricing tests

### Performance Benchmarks

| Operation | Target | Notes |
|---|---|---|
| Single provision calculation | < 200ms | Includes GL data fetch and rate lookup |
| 50-state nexus analysis | < 2s | Full economic nexus evaluation all states |
| Crypto event classification (1,000 events) | < 5s | Bulk classification with FMV lookup |
| Cost basis calculation (10,000 lots, HIFO) | < 3s | Lot sorting and matching |
| Calendar generation (full year, 10 entities) | < 1s | All jurisdictions, all filing types |
| Form 8949 generation (500 dispositions) | < 2s | Including PDF rendering |

---

## Related Modules

| Module | Relationship |
|---|---|
| `@mcv/treasury/entity` | Provides legal entity data, ownership structures, and jurisdiction registrations consumed by tax classification and consolidated return logic |
| `@mcv/finance` | Source of general ledger balances, journal entries, and pre-tax income used in provision calculations |
| `@mcv/web3-core` | Feeds on-chain transaction events for crypto tax classification and cost basis tracking |
| `@mcv/compliance` | Shares regulatory calendar infrastructure and audit trail mechanisms |
| `@mcv/treasury/payments` | Payment execution layer for estimated tax payments via EFTPS, ACH, or wire |
| `@mcv/analytics` | Consumes tax exposure data for venture-level financial dashboards and forecasting |