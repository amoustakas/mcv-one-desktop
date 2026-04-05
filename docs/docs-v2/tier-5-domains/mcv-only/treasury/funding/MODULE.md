# @mcv/treasury/funding

> **Tier 5 — MCV-Only Domain Module**
> Capital raises, investor management, cap table maintenance, and funding lifecycle orchestration across the MCV consortium.

**Status:** Active
**Since:** 0.1.0
**Maintainer:** Treasury Team
**Depends on:** `@mcv/treasury/pnl`, `@mcv/portfolio`, `@mcv/auth`, `@mcv/db`, `@mcv/notifications`

---

## Purpose

The `@mcv/treasury/funding` module is the nerve center for all capital-raising activities across the MCV consortium's nine ventures. From the earliest pre-seed conversations through Series C+ mega-rounds, this module tracks every dollar committed, every share issued, every SAFE agreement executed, and every investor relationship cultivated. It provides a single, authoritative source of truth for who owns what, under what terms, and what happens when liquidity events occur.

Capital formation is one of the most sensitive and legally consequential activities any organization undertakes. A mismanaged cap table, a miscalculated dilution scenario, or a botched waterfall distribution can destroy relationships, invite litigation, and undermine the entire consortium's credibility. This module treats funding data with the gravity it deserves — enforcing strict access controls, maintaining complete audit trails, encrypting sensitive financial instruments at rest and in transit, and providing real-time visibility into ownership structures that would otherwise live in fragmented spreadsheets across nine different ventures.

Beyond record-keeping, this module is a strategic decision-making engine. Founders and CFOs use its dilution modeling to negotiate from positions of strength. Board members consume its investor reporting pipelines to stay informed without drowning in noise. Legal teams manage due diligence data rooms through its document management subsystem. And when the wire hits the bank account, the closing management workflow ensures every signature is captured, every filing is triggered, and every cap table entry is updated in lockstep — no manual reconciliation, no spreadsheet drift, no "I thought someone else handled that" moments.

---

## Exports

```typescript
// @mcv/treasury/funding — Public API Surface

// ── Core Services ──────────────────────────────────────────────────
export { FundingService } from './services/funding.service';
export { InvestorService } from './services/investor.service';
export { CapTableService } from './services/cap-table.service';
export { SAFEService } from './services/safe.service';
export { ConvertibleNoteService } from './services/convertible-note.service';
export { DilutionModelingService } from './services/dilution-modeling.service';
export { WaterfallService } from './services/waterfall.service';
export { InvestorReportingService } from './services/investor-reporting.service';
export { DueDiligenceService } from './services/due-diligence.service';
export { TermSheetService } from './services/term-sheet.service';
export { ClosingService } from './services/closing.service';

// ── Router ─────────────────────────────────────────────────────────
export { fundingRouter } from './router';
export type { FundingRouter } from './router';

// ── Types & Interfaces ────────────────────────────────────────────
export type {
  FundingRound,
  FundingRoundConfig,
  FundingRoundStage,
  FundingRoundStatus,
  RoundType,
} from './types/funding-round.types';

export type {
  Investor,
  InvestorProfile,
  InvestorContact,
  InvestorType,
  InvestorTier,
  InvestmentRecord,
  CommunicationLogEntry,
} from './types/investor.types';

export type {
  CapTableEntry,
  CapTableSnapshot,
  OwnershipBreakdown,
  FullyDilutedShares,
  ShareClass,
  ShareClassConfig,
} from './types/cap-table.types';

export type {
  SAFEAgreement,
  SAFEType,
  SAFEStatus,
  ConversionTrigger,
  ConversionResult,
  ValuationCap,
  DiscountRate,
} from './types/safe.types';

export type {
  ConvertibleNote,
  ConvertibleNoteTerms,
  ConvertibleNoteStatus,
  InterestAccrual,
  MaturityEvent,
} from './types/convertible-note.types';

export type {
  DilutionScenario,
  DilutionModelInput,
  DilutionModelOutput,
  ScenarioComparison,
  OptionPoolExpansion,
  ProFormaCapTable,
} from './types/dilution.types';

export type {
  DistributionWaterfall,
  WaterfallTier,
  LiquidationPreference,
  ParticipationRight,
  PayoutAllocation,
  ExitScenario,
} from './types/waterfall.types';

export type {
  InvestorReport,
  ReportTemplate,
  ReportDistribution,
  BoardMaterialsPackage,
  KPISnapshot,
} from './types/reporting.types';

export type {
  DueDiligenceItem,
  DataRoom,
  DataRoomAccess,
  DocumentRequest,
  QAThread,
  QAResponse,
} from './types/due-diligence.types';

export type {
  TermSheet,
  TermSheetDraft,
  TermSheetComparison,
  NegotiationTracker,
  TermSheetStatus,
  KeyTerms,
} from './types/term-sheet.types';

export type {
  ClosingChecklist,
  ClosingItem,
  WireInstruction,
  WireTracking,
  DocumentExecution,
  PostCloseTask,
} from './types/closing.types';

// ── Schemas (Drizzle) ──────────────────────────────────────────────
export {
  fundingRounds,
  investors,
  capTableEntries,
  safeAgreements,
  convertibleNotes,
  investorReports,
  termSheets,
  dueDiligenceItems,
  shareClasses,
  investmentRecords,
  communicationLogs,
  dataRooms,
  dataRoomDocuments,
  closingChecklists,
  closingItems,
  wireTrackings,
} from './schema';

// ── Hooks (React) ──────────────────────────────────────────────────
export { useFundingRounds } from './hooks/use-funding-rounds';
export { useCapTable } from './hooks/use-cap-table';
export { useInvestors } from './hooks/use-investors';
export { useDilutionModel } from './hooks/use-dilution-model';
export { useWaterfall } from './hooks/use-waterfall';
export { useDataRoom } from './hooks/use-data-room';
export { useTermSheet } from './hooks/use-term-sheet';
export { useClosing } from './hooks/use-closing';

// ── Constants ──────────────────────────────────────────────────────
export {
  ROUND_TYPES,
  SHARE_CLASSES,
  SAFE_TYPES,
  INVESTOR_TIERS,
  DEFAULT_OPTION_POOL_PERCENT,
  FUNDING_ERROR_CODES,
} from './constants';

// ── Validators ─────────────────────────────────────────────────────
export {
  fundingRoundSchema,
  investorSchema,
  safeAgreementSchema,
  termSheetSchema,
  dilutionScenarioSchema,
  waterfallConfigSchema,
} from './validators';
```

---

## Architecture

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                        @mcv/treasury/funding                                 │
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────────┐  │
│  │                          tRPC Router Layer                              │  │
│  │  fundingRounds.*  │  investors.*  │  capTable.*  │  waterfall.*  │ ...  │  │
│  └────────┬─────────────────┬──────────────┬──────────────┬───────────────┘  │
│           │                 │              │              │                   │
│  ┌────────▼─────────────────▼──────────────▼──────────────▼───────────────┐  │
│  │                        Service Layer                                    │  │
│  │                                                                         │  │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌────────────┐  │  │
│  │  │   Funding    │  │   Investor   │  │   CapTable   │  │    SAFE    │  │  │
│  │  │   Service    │  │   Service    │  │   Service    │  │   Service  │  │  │
│  │  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘  └─────┬──────┘  │  │
│  │         │                 │                  │                │          │  │
│  │  ┌──────┴───────┐  ┌─────┴────────┐  ┌─────┴────────┐  ┌────┴───────┐  │  │
│  │  │  Convertible │  │   Dilution   │  │  Waterfall   │  │  Investor  │  │  │
│  │  │  Note Service│  │   Modeling   │  │  Service     │  │  Reporting │  │  │
│  │  └──────────────┘  └──────────────┘  └──────────────┘  └────────────┘  │  │
│  │                                                                         │  │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐                  │  │
│  │  │  Due         │  │  Term Sheet  │  │   Closing    │                  │  │
│  │  │  Diligence   │  │  Service     │  │   Service    │                  │  │
│  │  └──────────────┘  └──────────────┘  └──────────────┘                  │  │
│  └─────────────────────────────────────────────────────────────────────────┘  │
│           │                 │              │              │                   │
│  ┌────────▼─────────────────▼──────────────▼──────────────▼───────────────┐  │
│  │                     Data Access Layer                                   │  │
│  │                                                                         │  │
│  │  ┌─────────────────────────────────────────────────────────────────┐    │  │
│  │  │                    Drizzle ORM Schemas                          │    │  │
│  │  │                                                                 │    │  │
│  │  │  funding_rounds  │  investors  │  cap_table_entries  │  safes   │    │  │
│  │  │  convertible_notes │ investor_reports │ term_sheets │ dd_items  │    │  │
│  │  │  share_classes │ investment_records │ wire_trackings │ closings │    │  │
│  │  └─────────────────────────────────────────────────────────────────┘    │  │
│  │                              │                                          │  │
│  │  ┌───────────────────────────▼─────────────────────────────────────┐    │  │
│  │  │              Supabase PostgreSQL + RLS                          │    │  │
│  │  │         Multi-tenant isolation per venture                      │    │  │
│  │  └────────────────────────────────────────────────────────────────┘    │  │
│  └─────────────────────────────────────────────────────────────────────────┘  │
│                                                                              │
│  ┌──────────────────────── Integration Points ────────────────────────────┐  │
│  │                                                                         │  │
│  │  @mcv/treasury/pnl ◄── Capital structure, equity values                │  │
│  │  @mcv/portfolio    ◄── Investor relations, venture health              │  │
│  │  @mcv/auth         ◄── RBAC, investor portal access                    │  │
│  │  @mcv/notifications◄── Investor updates, closing alerts               │  │
│  │  @mcv/documents    ◄── Legal docs, SAFE templates, term sheets         │  │
│  │  @mcv/audit        ◄── Financial audit trail, compliance               │  │
│  │                                                                         │  │
│  └─────────────────────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────────────────────┘

┌──────────────────────── Funding Round Lifecycle ─────────────────────────────┐
│                                                                              │
│   PLANNING ──► TERM_SHEET ──► DUE_DILIGENCE ──► NEGOTIATION ──► CLOSING     │
│       │             │               │                │              │        │
│       ▼             ▼               ▼                ▼              ▼        │
│   Set targets   Draft terms    Open data room   Track edits    Wire money    │
│   Model dilution  Compare      Manage Q&A       Final terms    Execute docs  │
│   ID investors    Negotiate     Share docs       Board vote     Update cap    │
│                                                                   table      │
│                                                                     │        │
│                                                              POST_CLOSE      │
│                                                                     │        │
│                                                              Admin tasks     │
│                                                              File filings    │
│                                                              Investor comms  │
└──────────────────────────────────────────────────────────────────────────────┘

┌──────────────────────── Cap Table Flow ──────────────────────────────────────┐
│                                                                              │
│   Share Classes         Ownership              Dilution Modeling             │
│   ┌──────────┐         ┌──────────────┐       ┌──────────────────┐          │
│   │ Common   │────────►│ Founders: 60%│       │ Current state    │          │
│   │ Series A │────────►│ Series A: 20%│──────►│ + New round $5M  │          │
│   │ Series B │────────►│ Options: 10% │       │ + Option pool 15%│          │
│   │ Options  │────────►│ SAFEs: 10%   │       │ = Pro forma table│          │
│   └──────────┘         └──────────────┘       └──────────────────┘          │
│                               │                        │                     │
│                               ▼                        ▼                     │
│                        ┌──────────────┐       ┌──────────────────┐          │
│                        │  Waterfall   │       │  Scenario A vs B │          │
│                        │  Calculator  │       │  Side-by-side    │          │
│                        └──────────────┘       └──────────────────┘          │
└──────────────────────────────────────────────────────────────────────────────┘
```

---

## Core Interfaces

### FundingService

The top-level orchestrator for all funding operations. Coordinates between sub-services and maintains transactional integrity across multi-step funding workflows.

```typescript
interface FundingService {
  // ── Round Management ─────────────────────────────────────────────
  /**
   * Creates a new funding round for a venture. Initializes round configuration,
   * sets target amounts, and transitions the round into PLANNING status.
   * Automatically creates associated cap table snapshot for baseline.
   */
  createRound(input: CreateRoundInput): Promise<FundingRound>;

  /**
   * Retrieves a funding round by ID with full nested data including
   * investors, commitments, documents, and current status.
   */
  getRound(roundId: string): Promise<FundingRound>;

  /**
   * Lists all funding rounds for a venture, optionally filtered by status.
   * Returns summary view with committed vs target amounts.
   */
  listRounds(ventureId: string, filters?: RoundFilters): Promise<FundingRound[]>;

  /**
   * Advances the round through its lifecycle stages. Validates all
   * prerequisites are met before allowing transition.
   * PLANNING → TERM_SHEET → DUE_DILIGENCE → NEGOTIATION → CLOSING → POST_CLOSE → COMPLETED
   */
  advanceRoundStage(
    roundId: string,
    targetStage: FundingRoundStage,
    notes?: string
  ): Promise<FundingRound>;

  /**
   * Updates round configuration (target amount, share price, terms).
   * Restricted once round enters CLOSING stage.
   */
  updateRound(roundId: string, updates: UpdateRoundInput): Promise<FundingRound>;

  /**
   * Cancels a funding round. Only allowed if no wire transfers have been
   * completed. Marks all associated commitments as cancelled.
   */
  cancelRound(roundId: string, reason: string): Promise<void>;

  /**
   * Returns aggregate funding metrics across all ventures.
   * Total raised, average round size, time-to-close, etc.
   */
  getConsortiumFundingMetrics(): Promise<ConsortiumFundingMetrics>;

  // ── Cross-Service Orchestration ──────────────────────────────────
  /**
   * Full round close workflow: validates all commitments, triggers wire
   * confirmations, executes documents, updates cap table atomically.
   */
  executeRoundClose(roundId: string): Promise<ClosingResult>;

  /**
   * Generates a complete funding history for a venture including all
   * rounds, investors, SAFEs, notes, and current cap table state.
   */
  getVentureFundingHistory(ventureId: string): Promise<FundingHistory>;
}

interface CreateRoundInput {
  ventureId: string;
  roundType: RoundType;
  name: string;
  targetAmount: number;
  currency: string;
  preMoneyValuation?: number;
  pricePerShare?: number;
  shareClass?: string;
  leadInvestorId?: string;
  plannedCloseDate?: Date;
  notes?: string;
  terms?: Partial<KeyTerms>;
}

type RoundType =
  | 'pre_seed'
  | 'seed'
  | 'series_a'
  | 'series_b'
  | 'series_c'
  | 'series_d_plus'
  | 'bridge'
  | 'extension'
  | 'secondary'
  | 'debt';

type FundingRoundStage =
  | 'planning'
  | 'term_sheet'
  | 'due_diligence'
  | 'negotiation'
  | 'closing'
  | 'post_close'
  | 'completed'
  | 'cancelled';

type FundingRoundStatus = 'draft' | 'active' | 'paused' | 'completed' | 'cancelled';
```

### FundingRound

```typescript
interface FundingRound {
  id: string;
  ventureId: string;
  consortiumId: string;

  // ── Round Identity ───────────────────────────────────────────────
  roundType: RoundType;
  name: string;                        // e.g., "Series A - Q1 2026"
  description?: string;

  // ── Financial Terms ──────────────────────────────────────────────
  targetAmount: number;                // Target raise in cents
  minimumAmount?: number;              // Minimum viable raise
  maximumAmount?: number;              // Hard cap
  committedAmount: number;             // Sum of confirmed commitments
  receivedAmount: number;              // Sum of wired funds
  currency: string;                    // ISO 4217

  // ── Valuation ────────────────────────────────────────────────────
  preMoneyValuation?: number;          // Pre-money valuation in cents
  postMoneyValuation?: number;         // Computed: pre-money + round size
  pricePerShare?: number;              // Price per share in cents
  fullyDilutedShares?: number;         // Total shares post-round

  // ── Share Structure ──────────────────────────────────────────────
  shareClassId?: string;               // FK → share_classes
  newSharesIssued?: number;            // Shares created for this round
  optionPoolIncrease?: number;         // Additional option pool shares
  optionPoolPercentPostMoney?: number; // Target option pool % post-money

  // ── Lifecycle ────────────────────────────────────────────────────
  status: FundingRoundStatus;
  stage: FundingRoundStage;
  stageHistory: StageTransition[];

  // ── Key Dates ────────────────────────────────────────────────────
  plannedOpenDate?: Date;
  actualOpenDate?: Date;
  plannedCloseDate?: Date;
  actualCloseDate?: Date;
  boardApprovalDate?: Date;

  // ── Participants ─────────────────────────────────────────────────
  leadInvestorId?: string;
  commitments: InvestorCommitment[];
  totalInvestorCount: number;

  // ── Documents ────────────────────────────────────────────────────
  termSheetId?: string;
  dataRoomId?: string;
  closingChecklistId?: string;

  // ── Metadata ─────────────────────────────────────────────────────
  notes?: string;
  tags: string[];
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

interface StageTransition {
  fromStage: FundingRoundStage;
  toStage: FundingRoundStage;
  transitionedBy: string;
  transitionedAt: Date;
  notes?: string;
}

interface InvestorCommitment {
  id: string;
  roundId: string;
  investorId: string;
  amount: number;                      // Committed amount in cents
  shareCount?: number;                 // Shares allocated
  status: 'verbal' | 'signed' | 'wired' | 'confirmed' | 'cancelled';
  commitmentDate?: Date;
  wireDate?: Date;
  notes?: string;
  sideLetterTerms?: Record<string, unknown>;
}
```

### Investor

```typescript
interface Investor {
  id: string;
  consortiumId: string;

  // ── Identity ─────────────────────────────────────────────────────
  type: InvestorType;
  tier: InvestorTier;
  name: string;                        // Legal entity or individual name
  displayName?: string;                // Friendly display name
  entityType?: 'individual' | 'corporation' | 'llc' | 'lp' | 'trust' | 'fund';

  // ── Contact ──────────────────────────────────────────────────────
  primaryContact: InvestorContact;
  additionalContacts: InvestorContact[];

  // ── Profile ──────────────────────────────────────────────────────
  profile: InvestorProfile;

  // ── Investment History ───────────────────────────────────────────
  investments: InvestmentRecord[];
  totalInvested: number;               // Sum across all ventures
  activeInvestments: number;           // Count of current holdings

  // ── Communication ────────────────────────────────────────────────
  communicationLog: CommunicationLogEntry[];
  preferredCommunicationChannel: 'email' | 'phone' | 'in_person' | 'portal';
  lastContactDate?: Date;

  // ── Portal Access ────────────────────────────────────────────────
  portalEnabled: boolean;
  portalUserId?: string;               // FK → auth users
  lastPortalLogin?: Date;

  // ── Compliance ───────────────────────────────────────────────────
  accreditationStatus: 'verified' | 'pending' | 'expired' | 'not_required';
  accreditationExpiry?: Date;
  kycStatus: 'approved' | 'pending' | 'rejected' | 'not_started';
  kycCompletedAt?: Date;
  amlCheckStatus: 'cleared' | 'pending' | 'flagged';

  // ── Metadata ─────────────────────────────────────────────────────
  tags: string[];
  source?: string;                     // How we found this investor
  referredBy?: string;                 // Referring investor ID
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

type InvestorType =
  | 'angel'
  | 'vc_fund'
  | 'corporate_vc'
  | 'family_office'
  | 'institutional'
  | 'syndicate'
  | 'accelerator'
  | 'government'
  | 'strategic'
  | 'insider';

type InvestorTier = 'lead' | 'major' | 'participating' | 'follow_on' | 'strategic';

interface InvestorContact {
  id: string;
  role: 'primary' | 'legal' | 'finance' | 'operations' | 'board_observer';
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  title?: string;
  linkedinUrl?: string;
  notes?: string;
}

interface InvestorProfile {
  investmentThesis?: string;
  sectors: string[];
  stages: RoundType[];                 // Preferred investment stages
  checkSizeMin?: number;               // Minimum check size in cents
  checkSizeMax?: number;               // Maximum check size in cents
  geographicFocus: string[];
  portfolioCompanies: string[];
  boardSeatRequirement: boolean;
  proRataRights: boolean;
  informationRights: boolean;
  website?: string;
  aum?: number;                        // Assets under management
  fundVintage?: number;                // Fund vintage year
}

interface InvestmentRecord {
  id: string;
  investorId: string;
  ventureId: string;
  roundId: string;
  instrumentType: 'equity' | 'safe' | 'convertible_note' | 'warrant';
  amount: number;
  shareCount?: number;
  shareClass?: string;
  investmentDate: Date;
  currentValue?: number;
  moic?: number;                       // Multiple on invested capital
  status: 'active' | 'converted' | 'exited' | 'written_off';
}

interface CommunicationLogEntry {
  id: string;
  investorId: string;
  type: 'email' | 'call' | 'meeting' | 'portal_message' | 'report_sent' | 'note';
  subject: string;
  summary: string;
  participants: string[];
  date: Date;
  followUpDate?: Date;
  followUpCompleted: boolean;
  attachmentIds: string[];
  createdBy: string;
}
```

### CapTableEntry

```typescript
interface CapTableEntry {
  id: string;
  ventureId: string;
  snapshotId: string;                  // FK → cap_table_snapshots

  // ── Holder ───────────────────────────────────────────────────────
  holderId: string;                    // Investor ID, founder ID, or pool ID
  holderType: 'investor' | 'founder' | 'employee' | 'advisor' | 'option_pool' | 'warrant_pool';
  holderName: string;

  // ── Shares ───────────────────────────────────────────────────────
  shareClassId: string;
  shareClassName: string;
  sharesHeld: number;                  // Outstanding shares held
  sharesFullyDiluted: number;          // Including options, warrants, SAFEs
  vestingScheduleId?: string;

  // ── Ownership ────────────────────────────────────────────────────
  ownershipPercent: number;            // Basic ownership
  fullyDilutedPercent: number;         // Fully diluted ownership
  votingPercent?: number;              // Voting power (may differ from ownership)

  // ── Financial ────────────────────────────────────────────────────
  costBasis: number;                   // Total cost basis in cents
  pricePerShare: number;               // Purchase price per share
  currentValuePerShare?: number;       // Latest valuation per share
  currentTotalValue?: number;          // Shares × current value

  // ── Instruments ──────────────────────────────────────────────────
  instruments: CapTableInstrument[];

  // ── Metadata ─────────────────────────────────────────────────────
  notes?: string;
  lastUpdated: Date;
}

interface CapTableInstrument {
  type: 'common' | 'preferred' | 'safe' | 'convertible_note' | 'option' | 'warrant';
  instrumentId: string;                // FK to respective table
  shares: number;
  conversionRatio?: number;
  exercisePrice?: number;
  expirationDate?: Date;
  vestingPercent?: number;
}

interface CapTableSnapshot {
  id: string;
  ventureId: string;
  name: string;                        // e.g., "Post Series A Close"
  snapshotDate: Date;
  triggerEvent: 'round_close' | 'option_grant' | 'secondary_sale' | 'conversion' | 'manual';
  triggerRoundId?: string;
  entries: CapTableEntry[];
  totalSharesOutstanding: number;
  totalSharesFullyDiluted: number;
  impliedValuation?: number;
  isCurrentSnapshot: boolean;
  createdBy: string;
  createdAt: Date;
}

interface OwnershipBreakdown {
  ventureId: string;
  asOfDate: Date;
  totalSharesOutstanding: number;
  totalSharesFullyDiluted: number;
  categories: {
    founders: { shares: number; percent: number; holders: number };
    investors: { shares: number; percent: number; holders: number };
    employees: { shares: number; percent: number; holders: number };
    advisors: { shares: number; percent: number; holders: number };
    optionPool: { shares: number; percent: number; allocated: number; unallocated: number };
    warrantPool: { shares: number; percent: number };
    safes: { shares: number; percent: number; unconverted: number };
  };
}

interface ShareClass {
  id: string;
  ventureId: string;
  name: string;                        // e.g., "Series A Preferred"
  type: 'common' | 'preferred';
  totalAuthorized: number;             // Authorized shares for this class
  totalIssued: number;                 // Issued and outstanding
  pricePerShare: number;
  originalIssuePrice: number;
  conversionRatio: number;             // To common (usually 1:1)
  liquidationPreference: number;       // Multiple (e.g., 1.0, 1.5, 2.0)
  liquidationParticipating: boolean;
  liquidationCap?: number;             // Participation cap multiple
  dividendRate?: number;               // Annual dividend rate %
  dividendType?: 'cumulative' | 'non_cumulative';
  antidilutionProtection: 'none' | 'broad_weighted_avg' | 'narrow_weighted_avg' | 'full_ratchet';
  votingRightsPerShare: number;        // Usually 1
  boardSeatRights?: string;
  proRataRights: boolean;
  dragAlongRights: boolean;
  tagAlongRights: boolean;
  rightOfFirstRefusal: boolean;
  coSaleRights: boolean;
  redemptionRights?: {
    enabled: boolean;
    startDate?: Date;
    pricePerShare?: number;
  };
  roundId?: string;                    // Originating round
  createdAt: Date;
}
```

### SAFEAgreement

```typescript
interface SAFEAgreement {
  id: string;
  ventureId: string;
  consortiumId: string;
  investorId: string;

  // ── SAFE Terms ───────────────────────────────────────────────────
  safeType: SAFEType;
  principalAmount: number;             // Investment amount in cents
  currency: string;

  // ── Valuation Terms ──────────────────────────────────────────────
  valuationCap?: number;               // Valuation cap in cents
  discountRate?: number;               // Discount rate (e.g., 0.20 = 20%)
  mfnClause: boolean;                  // Most Favored Nation

  // ── Conversion ───────────────────────────────────────────────────
  conversionTriggers: ConversionTrigger[];
  conversionStatus: 'unconverted' | 'pending_conversion' | 'converted' | 'dissolved';
  conversionRoundId?: string;          // Round that triggered conversion
  conversionDate?: Date;
  conversionResult?: ConversionResult;

  // ── Pro Rata ─────────────────────────────────────────────────────
  proRataRights: boolean;
  proRataAmount?: number;              // Max pro rata amount

  // ── Document ─────────────────────────────────────────────────────
  documentId?: string;                 // FK → signed document
  templateVersion: string;             // YC SAFE version, custom, etc.
  executionDate: Date;

  // ── Status ───────────────────────────────────────────────────────
  status: SAFEStatus;
  statusHistory: SAFEStatusChange[];

  // ── Metadata ─────────────────────────────────────────────────────
  boardApprovalDate?: Date;
  notes?: string;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

type SAFEType =
  | 'cap_no_discount'
  | 'discount_no_cap'
  | 'cap_and_discount'
  | 'mfn'
  | 'custom';

type SAFEStatus =
  | 'draft'
  | 'sent'
  | 'negotiating'
  | 'executed'
  | 'converting'
  | 'converted'
  | 'cancelled'
  | 'dissolved';

interface ConversionTrigger {
  type: 'equity_financing' | 'liquidity_event' | 'dissolution' | 'maturity' | 'custom';
  description: string;
  minimumAmount?: number;              // For equity financing trigger
  triggered: boolean;
  triggeredAt?: Date;
  triggeredByRoundId?: string;
}

interface ConversionResult {
  shareClassId: string;
  shareClassName: string;
  sharesIssued: number;
  pricePerShare: number;               // Conversion price
  ownershipPercent: number;            // Post-conversion ownership
  conversionMethod: 'cap' | 'discount' | 'mfn' | 'floor';
  calculationDetails: {
    preMoneyValuation: number;
    postMoneyValuation: number;
    capBasedPrice?: number;
    discountBasedPrice?: number;
    effectivePrice: number;
  };
}

interface SAFEStatusChange {
  fromStatus: SAFEStatus;
  toStatus: SAFEStatus;
  changedBy: string;
  changedAt: Date;
  reason?: string;
}
```

### ConvertibleNote

```typescript
interface ConvertibleNote {
  id: string;
  ventureId: string;
  consortiumId: string;
  investorId: string;

  // ── Note Terms ───────────────────────────────────────────────────
  principalAmount: number;             // Original principal in cents
  currency: string;
  issueDate: Date;
  maturityDate: Date;

  // ── Interest ─────────────────────────────────────────────────────
  interestRate: number;                // Annual rate (e.g., 0.06 = 6%)
  interestType: 'simple' | 'compound';
  compoundingPeriod?: 'monthly' | 'quarterly' | 'annually';
  accruedInterest: number;             // Current accrued interest in cents
  lastInterestCalculation: Date;

  // ── Conversion Terms ─────────────────────────────────────────────
  valuationCap?: number;
  discountRate?: number;
  conversionTriggerAmount?: number;    // Min qualified financing amount
  automaticConversion: boolean;        // Auto-convert on trigger
  optionalConversion: boolean;         // Holder can elect to convert

  // ── Conversion Result ────────────────────────────────────────────
  conversionStatus: ConvertibleNoteStatus;
  conversionRoundId?: string;
  conversionDate?: Date;
  conversionShares?: number;
  conversionPricePerShare?: number;

  // ── Maturity ─────────────────────────────────────────────────────
  maturityAction: 'repay' | 'convert' | 'extend' | 'negotiate';
  extensionDate?: Date;
  extensionTerms?: string;

  // ── Security ─────────────────────────────────────────────────────
  secured: boolean;
  securityDescription?: string;
  subordination: 'senior' | 'pari_passu' | 'subordinated';

  // ── Document ─────────────────────────────────────────────────────
  documentId?: string;
  amendmentIds: string[];

  // ── Status ───────────────────────────────────────────────────────
  status: ConvertibleNoteStatus;
  notes?: string;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

type ConvertibleNoteStatus =
  | 'draft'
  | 'executed'
  | 'accruing'
  | 'converting'
  | 'converted'
  | 'matured'
  | 'repaid'
  | 'defaulted'
  | 'cancelled';

interface InterestAccrual {
  noteId: string;
  calculationDate: Date;
  dayCount: number;
  periodInterest: number;
  cumulativeInterest: number;
  principalPlusInterest: number;
  dayCountConvention: '30_360' | 'actual_360' | 'actual_365' | 'actual_actual';
}
```

### DilutionScenario

```typescript
interface DilutionScenario {
  id: string;
  ventureId: string;
  name: string;
  description?: string;

  // ── Baseline ─────────────────────────────────────────────────────
  baselineCapTableSnapshotId: string;
  baselineTotalShares: number;
  baselineValuation: number;

  // ── Scenario Parameters ──────────────────────────────────────────
  inputs: DilutionModelInput;

  // ── Results ──────────────────────────────────────────────────────
  output?: DilutionModelOutput;
  proFormaCapTable?: ProFormaCapTable;

  // ── Comparison ───────────────────────────────────────────────────
  comparisonScenarioIds: string[];     // Scenarios to compare against

  // ── Metadata ─────────────────────────────────────────────────────
  status: 'draft' | 'computed' | 'shared' | 'archived';
  createdBy: string;
  sharedWith: string[];
  createdAt: Date;
  updatedAt: Date;
}

interface DilutionModelInput {
  // ── New Round Parameters ─────────────────────────────────────────
  newRoundAmount: number;              // Amount being raised in cents
  preMoneyValuation: number;           // Pre-money valuation
  sharePrice?: number;                 // Derived or set explicitly

  // ── Option Pool ──────────────────────────────────────────────────
  optionPoolExpansion?: OptionPoolExpansion;

  // ── Convertibles ─────────────────────────────────────────────────
  convertingSafes: string[];           // SAFE IDs converting in this round
  convertingNotes: string[];           // Note IDs converting in this round

  // ── Additional Dilution ──────────────────────────────────────────
  additionalShares?: {
    description: string;
    shares: number;
    holderType: string;
  }[];

  // ── Assumptions ──────────────────────────────────────────────────
  includeUnvestedOptions: boolean;
  includeWarrants: boolean;
  roundUpShares: boolean;
}

interface DilutionModelOutput {
  // ── Share Counts ─────────────────────────────────────────────────
  preRoundSharesOutstanding: number;
  preRoundSharesFullyDiluted: number;
  newSharesFromRound: number;
  newSharesFromConversions: number;
  newSharesFromOptionPool: number;
  postRoundSharesFullyDiluted: number;

  // ── Valuations ───────────────────────────────────────────────────
  preMoneyValuation: number;
  postMoneyValuation: number;
  effectivePricePerShare: number;
  impliedFullyDilutedValuation: number;

  // ── Dilution Impact ──────────────────────────────────────────────
  dilutionByHolder: DilutionImpact[];
  overallDilutionPercent: number;
  founderDilutionPercent: number;
  existingInvestorDilutionPercent: number;

  // ── Warnings ─────────────────────────────────────────────────────
  warnings: DilutionWarning[];
}

interface DilutionImpact {
  holderId: string;
  holderName: string;
  holderType: string;
  preRoundPercent: number;
  postRoundPercent: number;
  dilutionPercent: number;             // How much they were diluted
  absoluteDilution: number;            // Percentage points lost
  preRoundValue: number;
  postRoundValue: number;
  valueChange: number;
  valueChangePercent: number;
}

interface DilutionWarning {
  severity: 'info' | 'warning' | 'critical';
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

interface OptionPoolExpansion {
  targetPercentPostMoney: number;      // e.g., 0.15 = 15%
  currentPoolShares: number;
  currentPoolAllocated: number;
  currentPoolUnallocated: number;
  newSharesRequired: number;           // Computed
  expansionFromPreMoney: boolean;      // Standard: expand from pre-money
}

interface ProFormaCapTable {
  scenarioId: string;
  entries: ProFormaEntry[];
  totalSharesFullyDiluted: number;
  impliedValuation: number;
  snapshotDate: Date;
}

interface ProFormaEntry {
  holderId: string;
  holderName: string;
  holderType: string;
  shareClass: string;
  shares: number;
  fullyDilutedPercent: number;
  value: number;
  source: 'existing' | 'new_round' | 'conversion' | 'option_pool';
}

interface ScenarioComparison {
  scenarios: DilutionScenario[];
  comparisonMetrics: {
    scenarioId: string;
    scenarioName: string;
    postMoneyValuation: number;
    founderOwnership: number;
    investorOwnership: number;
    optionPoolPercent: number;
    overallDilution: number;
    pricePerShare: number;
  }[];
  recommendation?: string;
}
```

### DistributionWaterfall

```typescript
interface DistributionWaterfall {
  id: string;
  ventureId: string;
  name: string;
  description?: string;

  // ── Exit Scenario ────────────────────────────────────────────────
  exitScenario: ExitScenario;

  // ── Waterfall Configuration ──────────────────────────────────────
  tiers: WaterfallTier[];

  // ── Results ──────────────────────────────────────────────────────
  allocations: PayoutAllocation[];
  totalDistributed: number;
  remainingProceeds: number;

  // ── Metadata ─────────────────────────────────────────────────────
  status: 'draft' | 'computed' | 'shared' | 'archived';
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

interface ExitScenario {
  type: 'acquisition' | 'ipo' | 'asset_sale' | 'dissolution' | 'secondary';
  totalProceeds: number;               // Total exit proceeds in cents
  transactionCosts: number;            // Legal, banking fees
  escrowAmount?: number;               // Holdback amount
  escrowReleasePeriod?: number;        // Months
  netProceeds: number;                 // Computed: total - costs - escrow
  exitDate: Date;
  acquirerName?: string;               // For acquisition scenarios
  ipoPrice?: number;                   // For IPO scenarios
}

interface WaterfallTier {
  order: number;                       // Execution order (1 = first)
  name: string;                        // e.g., "Series B 1x Liquidation Pref"
  type: 'liquidation_preference' | 'participation' | 'common_distribution' | 'carve_out';

  // ── Liquidation Preference ───────────────────────────────────────
  shareClassId?: string;
  preferenceMultiple?: number;         // e.g., 1.0, 1.5, 2.0
  preferenceAmount?: number;           // Computed total preference
  seniority: 'senior' | 'pari_passu' | 'junior';

  // ── Participation ────────────────────────────────────────────────
  participation?: ParticipationRight;

  // ── Carve-Out ────────────────────────────────────────────────────
  carveOutPercent?: number;            // Management carve-out %
  carveOutRecipients?: string[];       // Employee IDs

  // ── Result ───────────────────────────────────────────────────────
  amountAllocated: number;
  fullyFunded: boolean;                // Was the full preference paid?
  shortfallAmount?: number;            // If not fully funded
}

interface LiquidationPreference {
  shareClassId: string;
  shareClassName: string;
  multiple: number;                    // 1x, 1.5x, 2x, etc.
  totalInvested: number;               // Total capital invested
  totalPreference: number;             // Invested × multiple
  seniority: number;                   // Stack order
  participating: boolean;
  participationCap?: number;           // Cap as multiple of investment
  convertToCommon: boolean;            // Can convert instead of taking pref
}

interface ParticipationRight {
  enabled: boolean;
  capped: boolean;
  capMultiple?: number;                // Max return as multiple (e.g., 3x)
  capAmount?: number;                  // Computed max payout
  asConverted: boolean;                // Participate on as-converted basis
}

interface PayoutAllocation {
  holderId: string;
  holderName: string;
  holderType: string;
  shareClass: string;

  // ── Breakdown ────────────────────────────────────────────────────
  liquidationPreferenceReceived: number;
  participationReceived: number;
  commonDistributionReceived: number;
  carveOutReceived: number;

  // ── Totals ───────────────────────────────────────────────────────
  totalPayout: number;
  payoutPerShare: number;

  // ── Returns ──────────────────────────────────────────────────────
  totalInvested: number;
  returnMultiple: number;              // MOIC
  irr?: number;                        // Internal rate of return

  // ── Comparison ───────────────────────────────────────────────────
  asConvertedPayout: number;           // What they'd get converting to common
  optimalStrategy: 'preference' | 'convert';  // Which pays more
}
```

---

## Database Schemas

### funding_rounds

```typescript
import { pgTable, text, integer, bigint, timestamp, jsonb, pgEnum, boolean } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

export const roundTypeEnum = pgEnum('round_type', [
  'pre_seed', 'seed', 'series_a', 'series_b', 'series_c',
  'series_d_plus', 'bridge', 'extension', 'secondary', 'debt',
]);

export const roundStatusEnum = pgEnum('round_status', [
  'draft', 'active', 'paused', 'completed', 'cancelled',
]);

export const roundStageEnum = pgEnum('round_stage', [
  'planning', 'term_sheet', 'due_diligence', 'negotiation',
  'closing', 'post_close', 'completed', 'cancelled',
]);

export const fundingRounds = pgTable('funding_rounds', {
  id: text('id').primaryKey().default(sql`gen_random_uuid()`),
  ventureId: text('venture_id').notNull().references(() => ventures.id),
  consortiumId: text('consortium_id').notNull().references(() => consortiums.id),

  // ── Round Identity
  roundType: roundTypeEnum('round_type').notNull(),
  name: text('name').notNull(),
  description: text('description'),

  // ── Financial Terms
  targetAmount: bigint('target_amount', { mode: 'number' }).notNull(),       // cents
  minimumAmount: bigint('minimum_amount', { mode: 'number' }),
  maximumAmount: bigint('maximum_amount', { mode: 'number' }),
  committedAmount: bigint('committed_amount', { mode: 'number' }).default(0),
  receivedAmount: bigint('received_amount', { mode: 'number' }).default(0),
  currency: text('currency').notNull().default('USD'),

  // ── Valuation
  preMoneyValuation: bigint('pre_money_valuation', { mode: 'number' }),
  postMoneyValuation: bigint('post_money_valuation', { mode: 'number' }),
  pricePerShare: bigint('price_per_share', { mode: 'number' }),              // cents
  fullyDilutedShares: bigint('fully_diluted_shares', { mode: 'number' }),

  // ── Share Structure
  shareClassId: text('share_class_id').references(() => shareClasses.id),
  newSharesIssued: bigint('new_shares_issued', { mode: 'number' }),
  optionPoolIncrease: bigint('option_pool_increase', { mode: 'number' }),
  optionPoolPercentPostMoney: integer('option_pool_percent_post_money'),      // basis points

  // ── Lifecycle
  status: roundStatusEnum('status').notNull().default('draft'),
  stage: roundStageEnum('stage').notNull().default('planning'),
  stageHistory: jsonb('stage_history').default('[]'),

  // ── Key Dates
  plannedOpenDate: timestamp('planned_open_date', { withTimezone: true }),
  actualOpenDate: timestamp('actual_open_date', { withTimezone: true }),
  plannedCloseDate: timestamp('planned_close_date', { withTimezone: true }),
  actualCloseDate: timestamp('actual_close_date', { withTimezone: true }),
  boardApprovalDate: timestamp('board_approval_date', { withTimezone: true }),

  // ── Participants
  leadInvestorId: text('lead_investor_id').references(() => investors.id),

  // ── Documents
  termSheetId: text('term_sheet_id'),
  dataRoomId: text('data_room_id'),
  closingChecklistId: text('closing_checklist_id'),

  // ── Metadata
  notes: text('notes'),
  tags: jsonb('tags').default('[]'),
  createdBy: text('created_by').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  ventureIdx: index('funding_rounds_venture_idx').on(table.ventureId),
  consortiumIdx: index('funding_rounds_consortium_idx').on(table.consortiumId),
  statusIdx: index('funding_rounds_status_idx').on(table.status),
  stageIdx: index('funding_rounds_stage_idx').on(table.stage),
  roundTypeIdx: index('funding_rounds_round_type_idx').on(table.roundType),
}));
```

### investors

```typescript
export const investorTypeEnum = pgEnum('investor_type', [
  'angel', 'vc_fund', 'corporate_vc', 'family_office', 'institutional',
  'syndicate', 'accelerator', 'government', 'strategic', 'insider',
]);

export const investorTierEnum = pgEnum('investor_tier', [
  'lead', 'major', 'participating', 'follow_on', 'strategic',
]);

export const accreditationStatusEnum = pgEnum('accreditation_status', [
  'verified', 'pending', 'expired', 'not_required',
]);

export const kycStatusEnum = pgEnum('kyc_status', [
  'approved', 'pending', 'rejected', 'not_started',
]);

export const investors = pgTable('investors', {
  id: text('id').primaryKey().default(sql`gen_random_uuid()`),
  consortiumId: text('consortium_id').notNull().references(() => consortiums.id),

  // ── Identity
  type: investorTypeEnum('type').notNull(),
  tier: investorTierEnum('tier').notNull().default('participating'),
  name: text('name').notNull(),
  displayName: text('display_name'),
  entityType: text('entity_type'),

  // ── Primary Contact (denormalized for fast access)
  primaryContactEmail: text('primary_contact_email'),
  primaryContactPhone: text('primary_contact_phone'),
  primaryContactFirstName: text('primary_contact_first_name'),
  primaryContactLastName: text('primary_contact_last_name'),
  primaryContactTitle: text('primary_contact_title'),

  // ── Profile (JSON for flexibility)
  profile: jsonb('profile').default('{}'),

  // ── Aggregates (denormalized, updated on investment changes)
  totalInvested: bigint('total_invested', { mode: 'number' }).default(0),
  activeInvestments: integer('active_investments').default(0),

  // ── Communication
  preferredChannel: text('preferred_channel').default('email'),
  lastContactDate: timestamp('last_contact_date', { withTimezone: true }),

  // ── Portal Access
  portalEnabled: boolean('portal_enabled').default(false),
  portalUserId: text('portal_user_id'),
  lastPortalLogin: timestamp('last_portal_login', { withTimezone: true }),

  // ── Compliance
  accreditationStatus: accreditationStatusEnum('accreditation_status').default('not_started'),
  accreditationExpiry: timestamp('accreditation_expiry', { withTimezone: true }),
  kycStatus: kycStatusEnum('kyc_status').default('not_started'),
  kycCompletedAt: timestamp('kyc_completed_at', { withTimezone: true }),
  amlCheckStatus: text('aml_check_status').default('pending'),

  // ── Metadata
  tags: jsonb('tags').default('[]'),
  source: text('source'),
  referredBy: text('referred_by'),
  notes: text('notes'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  consortiumIdx: index('investors_consortium_idx').on(table.consortiumId),
  typeIdx: index('investors_type_idx').on(table.type),
  tierIdx: index('investors_tier_idx').on(table.tier),
  nameIdx: index('investors_name_idx').on(table.name),
  emailIdx: index('investors_email_idx').on(table.primaryContactEmail),
  kycIdx: index('investors_kyc_idx').on(table.kycStatus),
}));
```

### cap_table_entries

```typescript
export const capTableEntries = pgTable('cap_table_entries', {
  id: text('id').primaryKey().default(sql`gen_random_uuid()`),
  ventureId: text('venture_id').notNull().references(() => ventures.id),
  snapshotId: text('snapshot_id').notNull().references(() => capTableSnapshots.id),

  // ── Holder
  holderId: text('holder_id').notNull(),
  holderType: text('holder_type').notNull(),   // investor | founder | employee | advisor | option_pool | warrant_pool
  holderName: text('holder_name').notNull(),

  // ── Shares
  shareClassId: text('share_class_id').notNull().references(() => shareClasses.id),
  shareClassName: text('share_class_name').notNull(),
  sharesHeld: bigint('shares_held', { mode: 'number' }).notNull(),
  sharesFullyDiluted: bigint('shares_fully_diluted', { mode: 'number' }).notNull(),
  vestingScheduleId: text('vesting_schedule_id'),

  // ── Ownership
  ownershipPercent: integer('ownership_percent').notNull(),              // basis points (10000 = 100%)
  fullyDilutedPercent: integer('fully_diluted_percent').notNull(),       // basis points
  votingPercent: integer('voting_percent'),                              // basis points

  // ── Financial
  costBasis: bigint('cost_basis', { mode: 'number' }).notNull(),
  pricePerShare: bigint('price_per_share', { mode: 'number' }).notNull(),
  currentValuePerShare: bigint('current_value_per_share', { mode: 'number' }),
  currentTotalValue: bigint('current_total_value', { mode: 'number' }),

  // ── Instruments
  instruments: jsonb('instruments').default('[]'),

  // ── Metadata
  notes: text('notes'),
  lastUpdated: timestamp('last_updated', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  ventureIdx: index('cap_table_entries_venture_idx').on(table.ventureId),
  snapshotIdx: index('cap_table_entries_snapshot_idx').on(table.snapshotId),
  holderIdx: index('cap_table_entries_holder_idx').on(table.holderId),
  holderTypeIdx: index('cap_table_entries_holder_type_idx').on(table.holderType),
  shareClassIdx: index('cap_table_entries_share_class_idx').on(table.shareClassId),
}));

export const capTableSnapshots = pgTable('cap_table_snapshots', {
  id: text('id').primaryKey().default(sql`gen_random_uuid()`),
  ventureId: text('venture_id').notNull().references(() => ventures.id),
  name: text('name').notNull(),
  snapshotDate: timestamp('snapshot_date', { withTimezone: true }).notNull(),
  triggerEvent: text('trigger_event').notNull(),
  triggerRoundId: text('trigger_round_id'),
  totalSharesOutstanding: bigint('total_shares_outstanding', { mode: 'number' }).notNull(),
  totalSharesFullyDiluted: bigint('total_shares_fully_diluted', { mode: 'number' }).notNull(),
  impliedValuation: bigint('implied_valuation', { mode: 'number' }),
  isCurrentSnapshot: boolean('is_current_snapshot').default(false),
  createdBy: text('created_by').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  ventureIdx: index('cap_table_snapshots_venture_idx').on(table.ventureId),
  currentIdx: index('cap_table_snapshots_current_idx').on(table.ventureId, table.isCurrentSnapshot),
  dateIdx: index('cap_table_snapshots_date_idx').on(table.snapshotDate),
}));
```

### safe_agreements

```typescript
export const safeTypeEnum = pgEnum('safe_type', [
  'cap_no_discount', 'discount_no_cap', 'cap_and_discount', 'mfn', 'custom',
]);

export const safeStatusEnum = pgEnum('safe_status', [
  'draft', 'sent', 'negotiating', 'executed', 'converting', 'converted', 'cancelled', 'dissolved',
]);

export const safeAgreements = pgTable('safe_agreements', {
  id: text('id').primaryKey().default(sql`gen_random_uuid()`),
  ventureId: text('venture_id').notNull().references(() => ventures.id),
  consortiumId: text('consortium_id').notNull().references(() => consortiums.id),
  investorId: text('investor_id').notNull().references(() => investors.id),

  // ── SAFE Terms
  safeType: safeTypeEnum('safe_type').notNull(),
  principalAmount: bigint('principal_amount', { mode: 'number' }).notNull(),
  currency: text('currency').notNull().default('USD'),

  // ── Valuation Terms
  valuationCap: bigint('valuation_cap', { mode: 'number' }),
  discountRate: integer('discount_rate'),                // basis points (2000 = 20%)
  mfnClause: boolean('mfn_clause').default(false),

  // ── Conversion
  conversionTriggers: jsonb('conversion_triggers').default('[]'),
  conversionStatus: text('conversion_status').default('unconverted'),
  conversionRoundId: text('conversion_round_id'),
  conversionDate: timestamp('conversion_date', { withTimezone: true }),
  conversionResult: jsonb('conversion_result'),

  // ── Pro Rata
  proRataRights: boolean('pro_rata_rights').default(false),
  proRataAmount: bigint('pro_rata_amount', { mode: 'number' }),

  // ── Document
  documentId: text('document_id'),
  templateVersion: text('template_version').default('yc_safe_2023'),
  executionDate: timestamp('execution_date', { withTimezone: true }),

  // ── Status
  status: safeStatusEnum('status').notNull().default('draft'),
  statusHistory: jsonb('status_history').default('[]'),

  // ── Metadata
  boardApprovalDate: timestamp('board_approval_date', { withTimezone: true }),
  notes: text('notes'),
  createdBy: text('created_by').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  ventureIdx: index('safe_agreements_venture_idx').on(table.ventureId),
  investorIdx: index('safe_agreements_investor_idx').on(table.investorId),
  statusIdx: index('safe_agreements_status_idx').on(table.status),
  conversionIdx: index('safe_agreements_conversion_idx').on(table.conversionStatus),
}));
```

### convertible_notes

```typescript
export const noteStatusEnum = pgEnum('convertible_note_status', [
  'draft', 'executed', 'accruing', 'converting', 'converted',
  'matured', 'repaid', 'defaulted', 'cancelled',
]);

export const convertibleNotes = pgTable('convertible_notes', {
  id: text('id').primaryKey().default(sql`gen_random_uuid()`),
  ventureId: text('venture_id').notNull().references(() => ventures.id),
  consortiumId: text('consortium_id').notNull().references(() => consortiums.id),
  investorId: text('investor_id').notNull().references(() => investors.id),

  // ── Note Terms
  principalAmount: bigint('principal_amount', { mode: 'number' }).notNull(),
  currency: text('currency').notNull().default('USD'),
  issueDate: timestamp('issue_date', { withTimezone: true }).notNull(),
  maturityDate: timestamp('maturity_date', { withTimezone: true }).notNull(),

  // ── Interest
  interestRate: integer('interest_rate').notNull(),              // basis points (600 = 6%)
  interestType: text('interest_type').notNull().default('simple'),
  compoundingPeriod: text('compounding_period'),
  accruedInterest: bigint('accrued_interest', { mode: 'number' }).default(0),
  lastInterestCalculation: timestamp('last_interest_calculation', { withTimezone: true }),

  // ── Conversion Terms
  valuationCap: bigint('valuation_cap', { mode: 'number' }),
  discountRate: integer('discount_rate'),                       // basis points
  conversionTriggerAmount: bigint('conversion_trigger_amount', { mode: 'number' }),
  automaticConversion: boolean('automatic_conversion').default(true),
  optionalConversion: boolean('optional_conversion').default(false),

  // ── Conversion Result
  conversionStatus: text('conversion_status').default('unconverted'),
  conversionRoundId: text('conversion_round_id'),
  conversionDate: timestamp('conversion_date', { withTimezone: true }),
  conversionShares: bigint('conversion_shares', { mode: 'number' }),
  conversionPricePerShare: bigint('conversion_price_per_share', { mode: 'number' }),

  // ── Maturity
  maturityAction: text('maturity_action').default('convert'),
  extensionDate: timestamp('extension_date', { withTimezone: true }),
  extensionTerms: text('extension_terms'),

  // ── Security
  secured: boolean('secured').default(false),
  securityDescription: text('security_description'),
  subordination: text('subordination').default('pari_passu'),

  // ── Document
  documentId: text('document_id'),
  amendmentIds: jsonb('amendment_ids').default('[]'),

  // ── Status
  status: noteStatusEnum('status').notNull().default('draft'),
  notes: text('notes'),
  createdBy: text('created_by').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  ventureIdx: index('convertible_notes_venture_idx').on(table.ventureId),
  investorIdx: index('convertible_notes_investor_idx').on(table.investorId),
  statusIdx: index('convertible_notes_status_idx').on(table.status),
  maturityIdx: index('convertible_notes_maturity_idx').on(table.maturityDate),
}));
```

### investor_reports

```typescript
export const investorReports = pgTable('investor_reports', {
  id: text('id').primaryKey().default(sql`gen_random_uuid()`),
  ventureId: text('venture_id').notNull().references(() => ventures.id),
  consortiumId: text('consortium_id').notNull().references(() => consortiums.id),

  // ── Report Details
  type: text('type').notNull(),          // quarterly_update | annual_report | board_materials | kpi_report | ad_hoc
  title: text('title').notNull(),
  period: text('period'),                // e.g., "Q1 2026", "2025 Annual"
  periodStart: timestamp('period_start', { withTimezone: true }),
  periodEnd: timestamp('period_end', { withTimezone: true }),

  // ── Content
  content: jsonb('content').default('{}'),   // Structured report data
  templateId: text('template_id'),
  documentId: text('document_id'),           // Generated PDF/doc

  // ── KPI Snapshot
  kpiSnapshot: jsonb('kpi_snapshot'),        // Metrics at time of report

  // ── Distribution
  distributionList: jsonb('distribution_list').default('[]'),   // Investor IDs
  sentAt: timestamp('sent_at', { withTimezone: true }),
  sentVia: text('sent_via'),                 // email | portal | both
  openTracking: jsonb('open_tracking').default('{}'),

  // ── Status
  status: text('status').notNull().default('draft'),  // draft | review | approved | sent | archived
  approvedBy: text('approved_by'),
  approvedAt: timestamp('approved_at', { withTimezone: true }),

  // ── Metadata
  createdBy: text('created_by').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  ventureIdx: index('investor_reports_venture_idx').on(table.ventureId),
  typeIdx: index('investor_reports_type_idx').on(table.type),
  statusIdx: index('investor_reports_status_idx').on(table.status),
  periodIdx: index('investor_reports_period_idx').on(table.periodStart, table.periodEnd),
}));
```

### term_sheets

```typescript
export const termSheets = pgTable('term_sheets', {
  id: text('id').primaryKey().default(sql`gen_random_uuid()`),
  ventureId: text('venture_id').notNull().references(() => ventures.id),
  roundId: text('round_id').references(() => fundingRounds.id),
  investorId: text('investor_id').references(() => investors.id),

  // ── Term Sheet Details
  version: integer('version').notNull().default(1),
  title: text('title').notNull(),

  // ── Key Terms (structured for comparison)
  terms: jsonb('terms').notNull(),     // KeyTerms object

  // ── Document
  documentId: text('document_id'),
  isBinding: boolean('is_binding').default(false),
  exclusivityPeriodDays: integer('exclusivity_period_days'),
  exclusivityExpiry: timestamp('exclusivity_expiry', { withTimezone: true }),

  // ── Negotiation
  status: text('status').notNull().default('draft'),
  // draft | sent | counter_received | counter_sent | accepted | rejected | expired | superseded
  negotiationNotes: jsonb('negotiation_notes').default('[]'),
  redlineDocumentId: text('redline_document_id'),

  // ── Comparison
  comparedToIds: jsonb('compared_to_ids').default('[]'),   // Other term sheet IDs
  comparisonNotes: text('comparison_notes'),

  // ── Metadata
  sentAt: timestamp('sent_at', { withTimezone: true }),
  responseDeadline: timestamp('response_deadline', { withTimezone: true }),
  signedAt: timestamp('signed_at', { withTimezone: true }),
  expiredAt: timestamp('expired_at', { withTimezone: true }),
  createdBy: text('created_by').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  ventureIdx: index('term_sheets_venture_idx').on(table.ventureId),
  roundIdx: index('term_sheets_round_idx').on(table.roundId),
  investorIdx: index('term_sheets_investor_idx').on(table.investorId),
  statusIdx: index('term_sheets_status_idx').on(table.status),
}));

// KeyTerms type stored as JSONB
interface KeyTerms {
  preMoneyValuation: number;
  roundSize: number;
  pricePerShare: number;
  shareClass: string;
  liquidationPreference: {
    multiple: number;
    participating: boolean;
    cap?: number;
  };
  antidilutionProtection: string;
  boardComposition: {
    founderSeats: number;
    investorSeats: number;
    independentSeats: number;
    observerSeats: number;
  };
  votingRights: string;
  protectiveProvisions: string[];
  dividends?: {
    rate: number;
    type: 'cumulative' | 'non_cumulative';
  };
  proRataRights: boolean;
  informationRights: boolean;
  registrationRights: boolean;
  rightOfFirstRefusal: boolean;
  coSaleRights: boolean;
  dragAlong: boolean;
  founderVesting?: {
    schedule: string;
    cliff: number;
    acceleration: 'none' | 'single_trigger' | 'double_trigger';
  };
  employeeOptionPool: {
    percentPostMoney: number;
    currentPoolSize?: number;
    newSharesRequired?: number;
  };
  noShopPeriodDays: number;
  closingConditions: string[];
  legalCounsel?: {
    companyFirm: string;
    investorFirm: string;
  };
  governingLaw: string;
  customTerms?: Record<string, unknown>;
}
```

### due_diligence_items

```typescript
export const dueDiligenceItems = pgTable('due_diligence_items', {
  id: text('id').primaryKey().default(sql`gen_random_uuid()`),
  dataRoomId: text('data_room_id').notNull().references(() => dataRooms.id),
  ventureId: text('venture_id').notNull().references(() => ventures.id),
  roundId: text('round_id').references(() => fundingRounds.id),

  // ── Item Details
  category: text('category').notNull(),
  // corporate | financial | legal | ip | commercial | technical | hr | regulatory | tax
  subcategory: text('subcategory'),
  title: text('title').notNull(),
  description: text('description'),

  // ── Document
  documentId: text('document_id'),
  documentType: text('document_type'),
  fileSize: integer('file_size'),
  mimeType: text('mime_type'),

  // ── Request Tracking
  requestedBy: text('requested_by'),
  requestedAt: timestamp('requested_at', { withTimezone: true }),
  dueDate: timestamp('due_date', { withTimezone: true }),
  priority: text('priority').default('normal'),     // low | normal | high | critical

  // ── Status
  status: text('status').notNull().default('pending'),
  // pending | in_progress | uploaded | under_review | approved | rejected | not_applicable
  reviewedBy: text('reviewed_by'),
  reviewedAt: timestamp('reviewed_at', { withTimezone: true }),
  reviewNotes: text('review_notes'),

  // ── Q&A
  qaThreadId: text('qa_thread_id'),
  hasOpenQuestions: boolean('has_open_questions').default(false),
  questionCount: integer('question_count').default(0),
  answeredCount: integer('answered_count').default(0),

  // ── Access Control
  accessLevel: text('access_level').default('investors'),
  // investors | lead_only | board | internal | restricted
  watermarked: boolean('watermarked').default(false),
  downloadable: boolean('downloadable').default(true),
  viewCount: integer('view_count').default(0),
  lastViewedAt: timestamp('last_viewed_at', { withTimezone: true }),
  lastViewedBy: text('last_viewed_by'),

  // ── Metadata
  sortOrder: integer('sort_order').default(0),
  notes: text('notes'),
  createdBy: text('created_by').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  dataRoomIdx: index('dd_items_data_room_idx').on(table.dataRoomId),
  ventureIdx: index('dd_items_venture_idx').on(table.ventureId),
  categoryIdx: index('dd_items_category_idx').on(table.category),
  statusIdx: index('dd_items_status_idx').on(table.status),
  priorityIdx: index('dd_items_priority_idx').on(table.priority),
}));

export const dataRooms = pgTable('data_rooms', {
  id: text('id').primaryKey().default(sql`gen_random_uuid()`),
  ventureId: text('venture_id').notNull().references(() => ventures.id),
  roundId: text('round_id').references(() => fundingRounds.id),
  name: text('name').notNull(),
  description: text('description'),
  status: text('status').notNull().default('setup'),     // setup | open | restricted | closed | archived
  totalItems: integer('total_items').default(0),
  completedItems: integer('completed_items').default(0),
  completionPercent: integer('completion_percent').default(0),
  openedAt: timestamp('opened_at', { withTimezone: true }),
  closedAt: timestamp('closed_at', { withTimezone: true }),
  accessLog: jsonb('access_log').default('[]'),
  createdBy: text('created_by').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  ventureIdx: index('data_rooms_venture_idx').on(table.ventureId),
  roundIdx: index('data_rooms_round_idx').on(table.roundId),
  statusIdx: index('data_rooms_status_idx').on(table.status),
}));

export const dataRoomAccess = pgTable('data_room_access', {
  id: text('id').primaryKey().default(sql`gen_random_uuid()`),
  dataRoomId: text('data_room_id').notNull().references(() => dataRooms.id),
  investorId: text('investor_id').notNull().references(() => investors.id),
  accessLevel: text('access_level').notNull().default('view'),  // view | download | upload
  grantedBy: text('granted_by').notNull(),
  grantedAt: timestamp('granted_at', { withTimezone: true }).defaultNow().notNull(),
  revokedAt: timestamp('revoked_at', { withTimezone: true }),
  ndaSigned: boolean('nda_signed').default(false),
  ndaDocumentId: text('nda_document_id'),
  lastAccessAt: timestamp('last_access_at', { withTimezone: true }),
  accessCount: integer('access_count').default(0),
});
```

### Additional Supporting Tables

```typescript
// ── Share Classes ──────────────────────────────────────────────────
export const shareClasses = pgTable('share_classes', {
  id: text('id').primaryKey().default(sql`gen_random_uuid()`),
  ventureId: text('venture_id').notNull().references(() => ventures.id),
  name: text('name').notNull(),
  type: text('type').notNull(),                   // common | preferred
  totalAuthorized: bigint('total_authorized', { mode: 'number' }).notNull(),
  totalIssued: bigint('total_issued', { mode: 'number' }).default(0),
  pricePerShare: bigint('price_per_share', { mode: 'number' }).notNull(),
  originalIssuePrice: bigint('original_issue_price', { mode: 'number' }).notNull(),
  conversionRatio: integer('conversion_ratio').default(10000),   // basis points (10000 = 1:1)
  liquidationPreference: integer('liquidation_preference').default(10000), // basis points (10000 = 1x)
  liquidationParticipating: boolean('liquidation_participating').default(false),
  liquidationCap: integer('liquidation_cap'),
  dividendRate: integer('dividend_rate'),
  dividendType: text('dividend_type'),
  antidilutionProtection: text('antidilution_protection').default('broad_weighted_avg'),
  votingRightsPerShare: integer('voting_rights_per_share').default(1),
  boardSeatRights: text('board_seat_rights'),
  proRataRights: boolean('pro_rata_rights').default(true),
  dragAlongRights: boolean('drag_along_rights').default(true),
  tagAlongRights: boolean('tag_along_rights').default(true),
  rightOfFirstRefusal: boolean('right_of_first_refusal').default(true),
  coSaleRights: boolean('co_sale_rights').default(true),
  roundId: text('round_id'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  ventureIdx: index('share_classes_venture_idx').on(table.ventureId),
  typeIdx: index('share_classes_type_idx').on(table.type),
}));

// ── Investment Records ─────────────────────────────────────────────
export const investmentRecords = pgTable('investment_records', {
  id: text('id').primaryKey().default(sql`gen_random_uuid()`),
  investorId: text('investor_id').notNull().references(() => investors.id),
  ventureId: text('venture_id').notNull().references(() => ventures.id),
  roundId: text('round_id').notNull().references(() => fundingRounds.id),
  instrumentType: text('instrument_type').notNull(),   // equity | safe | convertible_note | warrant
  amount: bigint('amount', { mode: 'number' }).notNull(),
  shareCount: bigint('share_count', { mode: 'number' }),
  shareClass: text('share_class'),
  investmentDate: timestamp('investment_date', { withTimezone: true }).notNull(),
  currentValue: bigint('current_value', { mode: 'number' }),
  moic: integer('moic'),                               // basis points (10000 = 1.0x)
  status: text('status').notNull().default('active'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  investorIdx: index('investment_records_investor_idx').on(table.investorId),
  ventureIdx: index('investment_records_venture_idx').on(table.ventureId),
  roundIdx: index('investment_records_round_idx').on(table.roundId),
  statusIdx: index('investment_records_status_idx').on(table.status),
}));

// ── Communication Logs ─────────────────────────────────────────────
export const communicationLogs = pgTable('communication_logs', {
  id: text('id').primaryKey().default(sql`gen_random_uuid()`),
  investorId: text('investor_id').notNull().references(() => investors.id),
  type: text('type').notNull(),         // email | call | meeting | portal_message | report_sent | note
  subject: text('subject').notNull(),
  summary: text('summary'),
  participants: jsonb('participants').default('[]'),
  date: timestamp('date', { withTimezone: true }).notNull(),
  followUpDate: timestamp('follow_up_date', { withTimezone: true }),
  followUpCompleted: boolean('follow_up_completed').default(false),
  attachmentIds: jsonb('attachment_ids').default('[]'),
  createdBy: text('created_by').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  investorIdx: index('comm_logs_investor_idx').on(table.investorId),
  typeIdx: index('comm_logs_type_idx').on(table.type),
  dateIdx: index('comm_logs_date_idx').on(table.date),
  followUpIdx: index('comm_logs_follow_up_idx').on(table.followUpDate, table.followUpCompleted),
}));

// ── Closing Checklists ─────────────────────────────────────────────
export const closingChecklists = pgTable('closing_checklists', {
  id: text('id').primaryKey().default(sql`gen_random_uuid()`),
  roundId: text('round_id').notNull().references(() => fundingRounds.id),
  ventureId: text('venture_id').notNull().references(() => ventures.id),
  name: text('name').notNull(),
  totalItems: integer('total_items').default(0),
  completedItems: integer('completed_items').default(0),
  status: text('status').notNull().default('draft'),  // draft | active | completed
  targetCloseDate: timestamp('target_close_date', { withTimezone: true }),
  actualCloseDate: timestamp('actual_close_date', { withTimezone: true }),
  createdBy: text('created_by').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export const closingItems = pgTable('closing_items', {
  id: text('id').primaryKey().default(sql`gen_random_uuid()`),
  checklistId: text('checklist_id').notNull().references(() => closingChecklists.id),
  category: text('category').notNull(),     // legal | financial | regulatory | administrative
  title: text('title').notNull(),
  description: text('description'),
  assignedTo: text('assigned_to'),
  dueDate: timestamp('due_date', { withTimezone: true }),
  status: text('status').notNull().default('pending'),
  // pending | in_progress | completed | blocked | not_applicable
  completedAt: timestamp('completed_at', { withTimezone: true }),
  completedBy: text('completed_by'),
  documentId: text('document_id'),
  sortOrder: integer('sort_order').default(0),
  notes: text('notes'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

// ── Wire Trackings ─────────────────────────────────────────────────
export const wireTrackings = pgTable('wire_trackings', {
  id: text('id').primaryKey().default(sql`gen_random_uuid()`),
  roundId: text('round_id').notNull().references(() => fundingRounds.id),
  investorId: text('investor_id').notNull().references(() => investors.id),
  commitmentId: text('commitment_id'),

  // ── Wire Details
  amount: bigint('amount', { mode: 'number' }).notNull(),
  currency: text('currency').notNull().default('USD'),
  wireDate: timestamp('wire_date', { withTimezone: true }),
  expectedDate: timestamp('expected_date', { withTimezone: true }),
  confirmedDate: timestamp('confirmed_date', { withTimezone: true }),

  // ── Bank Details (encrypted reference)
  bankReference: text('bank_reference'),
  senderBank: text('sender_bank'),
  receiverBank: text('receiver_bank'),
  wireConfirmationNumber: text('wire_confirmation_number'),

  // ── Status
  status: text('status').notNull().default('pending'),
  // pending | instructions_sent | initiated | in_transit | received | confirmed | failed | returned
  failureReason: text('failure_reason'),

  // ── Metadata
  notes: text('notes'),
  createdBy: text('created_by').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  roundIdx: index('wire_trackings_round_idx').on(table.roundId),
  investorIdx: index('wire_trackings_investor_idx').on(table.investorId),
  statusIdx: index('wire_trackings_status_idx').on(table.status),
}));
```

### Row-Level Security Policies

```sql
-- All funding tables enforce consortium-level and venture-level isolation.
-- Users see only data for ventures they have access to within their consortium.

-- Example: funding_rounds RLS
ALTER TABLE funding_rounds ENABLE ROW LEVEL SECURITY;

CREATE POLICY funding_rounds_consortium_isolation ON funding_rounds
  FOR ALL
  USING (
    consortium_id = current_setting('app.consortium_id')::text
    AND venture_id IN (
      SELECT venture_id FROM user_venture_access
      WHERE user_id = current_setting('app.user_id')::text
      AND access_level >= 'read'
    )
  );

-- Investor data is consortium-wide (investors may invest across ventures)
CREATE POLICY investors_consortium_isolation ON investors
  FOR ALL
  USING (
    consortium_id = current_setting('app.consortium_id')::text
  );

-- Cap table entries restricted by venture access
CREATE POLICY cap_table_venture_isolation ON cap_table_entries
  FOR ALL
  USING (
    venture_id IN (
      SELECT venture_id FROM user_venture_access
      WHERE user_id = current_setting('app.user_id')::text
      AND access_level >= 'read'
    )
  );

-- SAFE agreements: venture-level access required
CREATE POLICY safe_agreements_isolation ON safe_agreements
  FOR ALL
  USING (
    consortium_id = current_setting('app.consortium_id')::text
    AND venture_id IN (
      SELECT venture_id FROM user_venture_access
      WHERE user_id = current_setting('app.user_id')::text
      AND access_level >= 'finance_read'
    )
  );

-- Data room access: investor-specific filtering
CREATE POLICY data_room_investor_access ON due_diligence_items
  FOR SELECT
  USING (
    data_room_id IN (
      SELECT data_room_id FROM data_room_access
      WHERE investor_id = current_setting('app.investor_id')::text
      AND revoked_at IS NULL
    )
    OR venture_id IN (
      SELECT venture_id FROM user_venture_access
      WHERE user_id = current_setting('app.user_id')::text
      AND access_level >= 'finance_read'
    )
  );

-- Wire tracking: restricted to finance roles
CREATE POLICY wire_trackings_finance_only ON wire_trackings
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_venture_access
      WHERE user_id = current_setting('app.user_id')::text
      AND venture_id = (
        SELECT venture_id FROM funding_rounds WHERE id = wire_trackings.round_id
      )
      AND access_level >= 'finance_write'
    )
  );
```

---

## Code Examples

### 1. Create a Funding Round

```typescript
import { FundingService } from '@mcv/treasury/funding';

const fundingService = new FundingService(db, ctx);

// Create a Series A round for a venture
const seriesA = await fundingService.createRound({
  ventureId: 'venture_sparkhealth',
  roundType: 'series_a',
  name: 'Series A - Q1 2026',
  targetAmount: 800_000_000,          // $8M in cents
  minimumAmount: 500_000_000,         // $5M minimum
  maximumAmount: 1_000_000_000,       // $10M hard cap
  currency: 'USD',
  preMoneyValuation: 3_200_000_000,   // $32M pre-money
  plannedCloseDate: new Date('2026-06-30'),
  terms: {
    liquidationPreference: { multiple: 1.0, participating: false },
    antidilutionProtection: 'broad_weighted_avg',
    boardComposition: {
      founderSeats: 2,
      investorSeats: 1,
      independentSeats: 1,
      observerSeats: 1,
    },
    employeeOptionPool: { percentPostMoney: 0.12 },
    proRataRights: true,
    informationRights: true,
    dragAlong: true,
    noShopPeriodDays: 45,
    governingLaw: 'Delaware',
  },
  notes: 'Primary goal: expand clinical trial program and hire VP Engineering',
});

console.log(`Round created: ${seriesA.id}`);
console.log(`Stage: ${seriesA.stage}`);           // 'planning'
console.log(`Target: $${seriesA.targetAmount / 100}`);

// Advance to term sheet stage
const advanced = await fundingService.advanceRoundStage(
  seriesA.id,
  'term_sheet',
  'Board approved proceeding with fundraise on 2026-01-15'
);

console.log(`New stage: ${advanced.stage}`);      // 'term_sheet'
```

### 2. Add and Manage Investors

```typescript
import { InvestorService } from '@mcv/treasury/funding';

const investorService = new InvestorService(db, ctx);

// Create a new VC fund investor
const investor = await investorService.createInvestor({
  type: 'vc_fund',
  tier: 'lead',
  name: 'Sequoia Capital Fund XVIII',
  displayName: 'Sequoia Capital',
  entityType: 'lp',
  primaryContact: {
    firstName: 'Alex',
    lastName: 'Thompson',
    email: 'athompson@sequoia.com',
    phone: '+1-650-555-0100',
    title: 'Partner',
    role: 'primary',
    linkedinUrl: 'https://linkedin.com/in/alexthompson',
  },
  profile: {
    investmentThesis: 'Early-stage healthcare and enterprise SaaS',
    sectors: ['healthcare', 'enterprise_saas', 'fintech'],
    stages: ['seed', 'series_a', 'series_b'],
    checkSizeMin: 200_000_000,        // $2M
    checkSizeMax: 2_500_000_000,      // $25M
    geographicFocus: ['North America', 'Europe'],
    boardSeatRequirement: true,
    proRataRights: true,
    informationRights: true,
    aum: 850_000_000_000,             // $8.5B
    fundVintage: 2024,
  },
  source: 'warm_intro',
  referredBy: 'investor_jane_doe_angel',
  tags: ['tier_1', 'healthcare_focus', 'board_ready'],
});

// Add additional contacts
await investorService.addContact(investor.id, {
  role: 'legal',
  firstName: 'Sarah',
  lastName: 'Chen',
  email: 'schen@sequoia.com',
  title: 'General Counsel',
});

// Log a communication
await investorService.logCommunication(investor.id, {
  type: 'meeting',
  subject: 'Introductory Meeting - SparkHealth',
  summary: 'Presented deck and early traction metrics. Strong interest in clinical trial platform. Wants to see Q4 data before term sheet discussions.',
  participants: ['alex.thompson@sequoia.com', 'founder@sparkhealth.io'],
  date: new Date(),
  followUpDate: new Date('2026-02-15'),
});

// Search investors by criteria
const healthcareInvestors = await investorService.searchInvestors({
  sectors: ['healthcare'],
  stages: ['series_a'],
  checkSizeMin: 100_000_000,          // $1M+
  accreditationStatus: 'verified',
  tier: ['lead', 'major'],
});

console.log(`Found ${healthcareInvestors.length} matching investors`);

// Enable investor portal access
await investorService.enablePortalAccess(investor.id, {
  email: 'athompson@sequoia.com',
  ventures: ['venture_sparkhealth'],
  accessLevel: 'full',
});
```

### 3. Model Dilution Scenarios

```typescript
import { DilutionModelingService, CapTableService } from '@mcv/treasury/funding';

const dilutionService = new DilutionModelingService(db, ctx);
const capTableService = new CapTableService(db, ctx);

// Get current cap table as baseline
const currentCapTable = await capTableService.getCurrentSnapshot('venture_sparkhealth');

// Create dilution scenario: $8M Series A at $32M pre-money
const scenario = await dilutionService.createScenario({
  ventureId: 'venture_sparkhealth',
  name: 'Series A - Base Case',
  description: '$8M at $32M pre-money with 12% option pool',
  baselineCapTableSnapshotId: currentCapTable.id,
  inputs: {
    newRoundAmount: 800_000_000,       // $8M
    preMoneyValuation: 3_200_000_000,  // $32M
    optionPoolExpansion: {
      targetPercentPostMoney: 0.12,    // 12% post-money
      currentPoolShares: 500_000,
      currentPoolAllocated: 200_000,
      currentPoolUnallocated: 300_000,
      newSharesRequired: 0,            // Will be computed
      expansionFromPreMoney: true,
    },
    convertingSafes: [
      'safe_yc_pre_seed',             // $500K YC SAFE
      'safe_angel_round',             // $250K angel SAFE
    ],
    convertingNotes: [],
    includeUnvestedOptions: true,
    includeWarrants: false,
    roundUpShares: true,
  },
});

// Compute the model
const result = await dilutionService.computeScenario(scenario.id);

console.log('=== Dilution Analysis ===');
console.log(`Pre-money: $${result.output.preMoneyValuation / 100}`);
console.log(`Post-money: $${result.output.postMoneyValuation / 100}`);
console.log(`Price/share: $${(result.output.effectivePricePerShare / 100).toFixed(4)}`);
console.log(`Overall dilution: ${(result.output.overallDilutionPercent * 100).toFixed(1)}%`);
console.log(`Founder dilution: ${(result.output.founderDilutionPercent * 100).toFixed(1)}%`);
console.log('');

for (const impact of result.output.dilutionByHolder) {
  console.log(
    `${impact.holderName}: ${(impact.preRoundPercent * 100).toFixed(1)}% → ` +
    `${(impact.postRoundPercent * 100).toFixed(1)}% ` +
    `(diluted ${(impact.dilutionPercent * 100).toFixed(1)}%)`
  );
}

// Create alternative scenario for comparison
const aggressiveScenario = await dilutionService.createScenario({
  ventureId: 'venture_sparkhealth',
  name: 'Series A - Aggressive',
  description: '$12M at $40M pre-money with 15% option pool',
  baselineCapTableSnapshotId: currentCapTable.id,
  inputs: {
    newRoundAmount: 1_200_000_000,     // $12M
    preMoneyValuation: 4_000_000_000,  // $40M
    optionPoolExpansion: {
      targetPercentPostMoney: 0.15,
      currentPoolShares: 500_000,
      currentPoolAllocated: 200_000,
      currentPoolUnallocated: 300_000,
      newSharesRequired: 0,
      expansionFromPreMoney: true,
    },
    convertingSafes: ['safe_yc_pre_seed', 'safe_angel_round'],
    convertingNotes: [],
    includeUnvestedOptions: true,
    includeWarrants: false,
    roundUpShares: true,
  },
});

await dilutionService.computeScenario(aggressiveScenario.id);

// Compare scenarios side-by-side
const comparison = await dilutionService.compareScenarios([
  scenario.id,
  aggressiveScenario.id,
]);

console.log('\n=== Scenario Comparison ===');
for (const metric of comparison.comparisonMetrics) {
  console.log(`\n${metric.scenarioName}:`);
  console.log(`  Post-money: $${metric.postMoneyValuation / 100}`);
  console.log(`  Founder ownership: ${(metric.founderOwnership * 100).toFixed(1)}%`);
  console.log(`  Investor ownership: ${(metric.investorOwnership * 100).toFixed(1)}%`);
  console.log(`  Option pool: ${(metric.optionPoolPercent * 100).toFixed(1)}%`);
  console.log(`  Price/share: $${(metric.pricePerShare / 100).toFixed(4)}`);
}
```

### 4. Generate and Snapshot Cap Table

```typescript
import { CapTableService } from '@mcv/treasury/funding';

const capTableService = new CapTableService(db, ctx);

// Generate current cap table from all recorded instruments
const capTable = await capTableService.generateCapTable('venture_sparkhealth');

console.log('=== Cap Table - SparkHealth ===');
console.log(`Total shares outstanding: ${capTable.totalSharesOutstanding.toLocaleString()}`);
console.log(`Total shares (fully diluted): ${capTable.totalSharesFullyDiluted.toLocaleString()}`);
console.log(`Implied valuation: $${(capTable.impliedValuation / 100).toLocaleString()}`);
console.log('');

// Print by share class
const byClass = capTableService.groupByShareClass(capTable.entries);
for (const [className, entries] of Object.entries(byClass)) {
  const totalShares = entries.reduce((sum, e) => sum + e.sharesHeld, 0);
  const totalPercent = entries.reduce((sum, e) => sum + e.fullyDilutedPercent, 0);
  console.log(`\n${className}:`);
  for (const entry of entries) {
    console.log(
      `  ${entry.holderName.padEnd(30)} ` +
      `${entry.sharesHeld.toLocaleString().padStart(12)} shares  ` +
      `${(entry.fullyDilutedPercent / 100).toFixed(2).padStart(6)}%`
    );
  }
  console.log(
    `  ${'SUBTOTAL'.padEnd(30)} ` +
    `${totalShares.toLocaleString().padStart(12)} shares  ` +
    `${(totalPercent / 100).toFixed(2).padStart(6)}%`
  );
}

// Get ownership breakdown summary
const breakdown = await capTableService.getOwnershipBreakdown('venture_sparkhealth');
console.log('\n=== Ownership Breakdown ===');
console.log(`Founders:    ${(breakdown.categories.founders.percent / 100).toFixed(1)}%`);
console.log(`Investors:   ${(breakdown.categories.investors.percent / 100).toFixed(1)}%`);
console.log(`Employees:   ${(breakdown.categories.employees.percent / 100).toFixed(1)}%`);
console.log(`Advisors:    ${(breakdown.categories.advisors.percent / 100).toFixed(1)}%`);
console.log(`Option Pool: ${(breakdown.categories.optionPool.percent / 100).toFixed(1)}%`);
console.log(`  Allocated:   ${breakdown.categories.optionPool.allocated.toLocaleString()}`);
console.log(`  Unallocated: ${breakdown.categories.optionPool.unallocated.toLocaleString()}`);
console.log(`SAFEs:       ${(breakdown.categories.safes.percent / 100).toFixed(1)}%`);

// Create a snapshot (e.g., after a round closes)
const snapshot = await capTableService.createSnapshot('venture_sparkhealth', {
  name: 'Post Series A Close',
  triggerEvent: 'round_close',
  triggerRoundId: 'round_series_a_2026',
});

console.log(`\nSnapshot created: ${snapshot.id}`);
console.log(`Snapshot date: ${snapshot.snapshotDate.toISOString()}`);

// Compare two snapshots
const diff = await capTableService.compareSnapshots(
  'snapshot_pre_series_a',
  snapshot.id
);

console.log('\n=== Cap Table Changes ===');
for (const change of diff.changes) {
  console.log(
    `${change.holderName}: ${(change.beforePercent / 100).toFixed(2)}% → ` +
    `${(change.afterPercent / 100).toFixed(2)}% ` +
    `(${change.changeType})`
  );
}
```

### 5. Distribution Waterfall Calculation

```typescript
import { WaterfallService } from '@mcv/treasury/funding';

const waterfallService = new WaterfallService(db, ctx);

// Model an acquisition exit at $150M
const waterfall = await waterfallService.createWaterfall({
  ventureId: 'venture_sparkhealth',
  name: '$150M Acquisition Scenario',
  description: 'Modeling payout distribution for a $150M acquisition offer',
  exitScenario: {
    type: 'acquisition',
    totalProceeds: 15_000_000_000,     // $150M in cents
    transactionCosts: 750_000_000,     // $7.5M (5% of proceeds)
    escrowAmount: 1_500_000_000,       // $15M holdback (10%)
    escrowReleasePeriod: 18,           // 18 months
    netProceeds: 12_750_000_000,       // $127.5M net
    exitDate: new Date('2028-06-30'),
    acquirerName: 'MedTech Corp',
  },
});

// Compute the waterfall distribution
const result = await waterfallService.computeWaterfall(waterfall.id);

console.log('=== Distribution Waterfall - $150M Acquisition ===');
console.log(`Total proceeds:     $${(result.exitScenario.totalProceeds / 100).toLocaleString()}`);
console.log(`Transaction costs:  $${(result.exitScenario.transactionCosts / 100).toLocaleString()}`);
console.log(`Escrow holdback:    $${(result.exitScenario.escrowAmount / 100).toLocaleString()}`);
console.log(`Net distributable:  $${(result.exitScenario.netProceeds / 100).toLocaleString()}`);
console.log('');

// Show tier-by-tier distribution
for (const tier of result.tiers) {
  console.log(`\nTier ${tier.order}: ${tier.name}`);
  console.log(`  Allocated: $${(tier.amountAllocated / 100).toLocaleString()}`);
  console.log(`  Fully funded: ${tier.fullyFunded ? 'Yes' : 'No'}`);
  if (!tier.fullyFunded && tier.shortfallAmount) {
    console.log(`  Shortfall: $${(tier.shortfallAmount / 100).toLocaleString()}`);
  }
}

// Show per-investor payouts
console.log('\n=== Investor Payouts ===');
console.log(
  'Holder'.padEnd(30) +
  'Invested'.padStart(15) +
  'Payout'.padStart(15) +
  'MOIC'.padStart(8) +
  'Strategy'.padStart(12)
);
console.log('-'.repeat(80));

for (const alloc of result.allocations) {
  console.log(
    alloc.holderName.padEnd(30) +
    `$${(alloc.totalInvested / 100).toLocaleString()}`.padStart(15) +
    `$${(alloc.totalPayout / 100).toLocaleString()}`.padStart(15) +
    `${alloc.returnMultiple.toFixed(2)}x`.padStart(8) +
    alloc.optimalStrategy.padStart(12)
  );
}

// Run sensitivity analysis: what if exit is $50M, $100M, $200M?
const sensitivity = await waterfallService.sensitivityAnalysis({
  ventureId: 'venture_sparkhealth',
  exitAmounts: [
    5_000_000_000,    // $50M
    10_000_000_000,   // $100M
    15_000_000_000,   // $150M
    20_000_000_000,   // $200M
    30_000_000_000,   // $300M
  ],
  transactionCostPercent: 0.05,
  escrowPercent: 0.10,
});

console.log('\n=== Sensitivity Analysis ===');
console.log('Exit Amount'.padEnd(15) + 'Founders'.padStart(12) + 'Series A'.padStart(12) + 'SAFEs'.padStart(12));
for (const point of sensitivity.dataPoints) {
  const exitLabel = `$${(point.exitAmount / 100_000_000).toFixed(0)}M`;
  const founders = `$${(point.founderPayout / 100_000_000).toFixed(1)}M`;
  const seriesA = `$${(point.seriesAPayout / 100_000_000).toFixed(1)}M`;
  const safes = `$${(point.safePayout / 100_000_000).toFixed(1)}M`;
  console.log(exitLabel.padEnd(15) + founders.padStart(12) + seriesA.padStart(12) + safes.padStart(12));
}
```

### 6. SAFE Agreement Management

```typescript
import { SAFEService } from '@mcv/treasury/funding';

const safeService = new SAFEService(db, ctx);

// Create a new SAFE agreement
const safe = await safeService.createSAFE({
  ventureId: 'venture_sparkhealth',
  investorId: 'investor_yc',
  safeType: 'cap_and_discount',
  principalAmount: 50_000_000,         // $500K
  currency: 'USD',
  valuationCap: 1_500_000_000,        // $15M cap
  discountRate: 2000,                  // 20% discount (basis points)
  mfnClause: false,
  proRataRights: true,
  templateVersion: 'yc_safe_2024',
  executionDate: new Date('2025-06-15'),
  conversionTriggers: [
    {
      type: 'equity_financing',
      description: 'Qualified equity financing of at least $1M',
      minimumAmount: 100_000_000,      // $1M minimum
      triggered: false,
    },
    {
      type: 'liquidity_event',
      description: 'Change of control or IPO',
      triggered: false,
    },
    {
      type: 'dissolution',
      description: 'Company dissolution',
      triggered: false,
    },
  ],
});

// Execute the SAFE (all signatures collected)
await safeService.executeSAFE(safe.id, {
  documentId: 'doc_safe_yc_signed_v1',
  boardApprovalDate: new Date('2025-06-10'),
});

// Later: trigger conversion during Series A
const conversionPreview = await safeService.previewConversion(safe.id, {
  triggerType: 'equity_financing',
  roundId: 'round_series_a_2026',
  preMoneyValuation: 3_200_000_000,    // $32M pre-money
  pricePerShare: 320,                   // $3.20 per share
});

console.log('=== SAFE Conversion Preview ===');
console.log(`SAFE Amount: $${safe.principalAmount / 100}`);
console.log(`Valuation Cap: $${safe.valuationCap / 100}`);
console.log(`Discount Rate: ${safe.discountRate / 100}%`);
console.log(`Cap-based price: $${(conversionPreview.capBasedPrice / 100).toFixed(4)}`);
console.log(`Discount-based price: $${(conversionPreview.discountBasedPrice / 100).toFixed(4)}`);
console.log(`Effective price (lower): $${(conversionPreview.effectivePrice / 100).toFixed(4)}`);
console.log(`Shares to be issued: ${conversionPreview.sharesIssued.toLocaleString()}`);
console.log(`Post-conversion ownership: ${(conversionPreview.ownershipPercent * 100).toFixed(2)}%`);

// Execute the conversion
const conversionResult = await safeService.convertSAFE(safe.id, {
  roundId: 'round_series_a_2026',
  shareClassId: 'share_class_series_a_preferred',
});

console.log(`\nConversion completed. ${conversionResult.sharesIssued} shares issued.`);
```

### 7. Due Diligence Data Room

```typescript
import { DueDiligenceService } from '@mcv/treasury/funding';

const ddService = new DueDiligenceService(db, ctx);

// Create a data room for the Series A
const dataRoom = await ddService.createDataRoom({
  ventureId: 'venture_sparkhealth',
  roundId: 'round_series_a_2026',
  name: 'SparkHealth Series A Data Room',
  description: 'Comprehensive DD materials for Series A due diligence',
});

// Populate with standard DD checklist
await ddService.populateStandardChecklist(dataRoom.id, {
  categories: [
    'corporate',     // Articles, bylaws, board minutes
    'financial',     // Audited financials, projections
    'legal',         // Material contracts, litigation
    'ip',            // Patents, trademarks, licenses
    'commercial',    // Customer contracts, pipeline
    'technical',     // Architecture, security audits
    'hr',            // Key employees, compensation
    'regulatory',    // Compliance, certifications
    'tax',           // Tax returns, structure
  ],
});

// Upload a specific document
await ddService.uploadDocument(dataRoom.id, {
  category: 'financial',
  subcategory: 'audited_financials',
  title: 'FY2025 Audited Financial Statements',
  documentId: 'doc_fy2025_audited_financials',
  accessLevel: 'investors',
  watermarked: true,
  downloadable: false,           // View-only for now
});

// Grant investor access to data room
await ddService.grantAccess(dataRoom.id, {
  investorId: 'investor_sequoia',
  accessLevel: 'download',
  ndaRequired: true,
  ndaDocumentId: 'doc_nda_sequoia_signed',
});

// Track a Q&A thread
const qaThread = await ddService.createQAThread(dataRoom.id, {
  itemId: 'dd_item_revenue_recognition',
  question: 'Can you provide details on the revenue recognition policy for multi-year SaaS contracts?',
  askedBy: 'investor_sequoia',
  priority: 'high',
});

await ddService.respondToQuestion(qaThread.id, {
  response: 'Revenue for multi-year SaaS contracts is recognized ratably over the contract term per ASC 606. See attached policy document and sample contract schedule.',
  respondedBy: 'cfo@sparkhealth.io',
  attachmentIds: ['doc_rev_rec_policy', 'doc_sample_contract'],
});

// Get data room completion status
const status = await ddService.getDataRoomStatus(dataRoom.id);
console.log(`Data Room: ${status.name}`);
console.log(`Completion: ${status.completionPercent}% (${status.completedItems}/${status.totalItems})`);
console.log(`Open questions: ${status.openQuestions}`);
console.log(`Investor access: ${status.investorsWithAccess} investors`);
```

### 8. Term Sheet Comparison

```typescript
import { TermSheetService } from '@mcv/treasury/funding';

const termSheetService = new TermSheetService(db, ctx);

// Draft a term sheet
const termSheet = await termSheetService.draftTermSheet({
  ventureId: 'venture_sparkhealth',
  roundId: 'round_series_a_2026',
  investorId: 'investor_sequoia',
  title: 'Series A Term Sheet - Sequoia Capital',
  terms: {
    preMoneyValuation: 3_200_000_000,
    roundSize: 800_000_000,
    pricePerShare: 320,
    shareClass: 'Series A Preferred',
    liquidationPreference: { multiple: 1.0, participating: false },
    antidilutionProtection: 'broad_weighted_avg',
    boardComposition: {
      founderSeats: 2,
      investorSeats: 1,
      independentSeats: 1,
      observerSeats: 1,
    },
    votingRights: 'One vote per share on as-converted basis',
    protectiveProvisions: [
      'Issue new shares or change authorized shares',
      'Declare or pay dividends',
      'Create debt exceeding $500K',
      'Change company charter or bylaws',
      'Sell, merge, or liquidate the company',
    ],
    proRataRights: true,
    informationRights: true,
    registrationRights: true,
    rightOfFirstRefusal: true,
    coSaleRights: true,
    dragAlong: true,
    founderVesting: {
      schedule: '4 years monthly',
      cliff: 12,
      acceleration: 'double_trigger',
    },
    employeeOptionPool: { percentPostMoney: 0.12 },
    noShopPeriodDays: 45,
    closingConditions: [
      'Completion of satisfactory due diligence',
      'Board approval',
      'Execution of definitive agreements',
      'Legal opinion',
    ],
    governingLaw: 'Delaware',
  },
});

// Receive and log a competing term sheet
const competingTermSheet = await termSheetService.draftTermSheet({
  ventureId: 'venture_sparkhealth',
  roundId: 'round_series_a_2026',
  investorId: 'investor_a16z',
  title: 'Series A Term Sheet - a16z',
  terms: {
    preMoneyValuation: 3_500_000_000,
    roundSize: 1_000_000_000,
    pricePerShare: 350,
    shareClass: 'Series A Preferred',
    liquidationPreference: { multiple: 1.0, participating: true, cap: 3.0 },
    antidilutionProtection: 'broad_weighted_avg',
    boardComposition: {
      founderSeats: 2,
      investorSeats: 1,
      independentSeats: 0,
      observerSeats: 2,
    },
    votingRights: 'One vote per share on as-converted basis',
    protectiveProvisions: [
      'Issue new shares',
      'Create debt exceeding $250K',
      'Change charter',
      'Sell or merge',
      'Change board size',
      'Approve annual budget',
    ],
    proRataRights: true,
    informationRights: true,
    registrationRights: true,
    rightOfFirstRefusal: true,
    coSaleRights: true,
    dragAlong: true,
    founderVesting: {
      schedule: '4 years monthly',
      cliff: 12,
      acceleration: 'single_trigger',
    },
    employeeOptionPool: { percentPostMoney: 0.15 },
    noShopPeriodDays: 60,
    closingConditions: [
      'Completion of due diligence',
      'Board approval',
      'Definitive agreements',
      'Key person employment agreements',
    ],
    governingLaw: 'Delaware',
  },
});

// Compare term sheets side by side
const comparison = await termSheetService.compareTermSheets([
  termSheet.id,
  competingTermSheet.id,
]);

console.log('=== Term Sheet Comparison ===\n');
for (const diff of comparison.differences) {
  console.log(`${diff.term}:`);
  for (const variant of diff.variants) {
    console.log(`  ${variant.investorName}: ${variant.value}`);
  }
  if (diff.analysis) {
    console.log(`  → Analysis: ${diff.analysis}`);
  }
  console.log('');
}
```

---

## Error Codes

| Code | Name | HTTP | Description |
|------|------|------|-------------|
| `FUND_001` | `ROUND_NOT_FOUND` | 404 | Funding round with the specified ID does not exist or is not accessible |
| `FUND_002` | `INVALID_STAGE_TRANSITION` | 400 | Cannot transition to the requested stage from the current stage |
| `FUND_003` | `ROUND_ALREADY_CLOSED` | 409 | Cannot modify a funding round that has been completed or cancelled |
| `FUND_004` | `INVESTOR_NOT_FOUND` | 404 | Investor with the specified ID does not exist in this consortium |
| `FUND_005` | `DUPLICATE_INVESTOR` | 409 | An investor with this name or primary email already exists |
| `FUND_006` | `INVALID_COMMITMENT` | 400 | Commitment amount exceeds round maximum or is below minimum threshold |
| `FUND_007` | `CAP_TABLE_CONFLICT` | 409 | Cap table modification conflicts with concurrent update; retry with fresh snapshot |
| `FUND_008` | `SAFE_ALREADY_CONVERTED` | 409 | SAFE agreement has already been converted and cannot be modified |
| `FUND_009` | `SAFE_CONVERSION_FAILED` | 422 | SAFE conversion calculation failed — check valuation cap and discount parameters |
| `FUND_010` | `NOTE_MATURED` | 410 | Convertible note has matured and requires explicit maturity action |
| `FUND_011` | `INSUFFICIENT_AUTHORIZED_SHARES` | 422 | Not enough authorized shares in the share class to complete this issuance |
| `FUND_012` | `WATERFALL_EXCEEDS_PROCEEDS` | 422 | Waterfall allocations exceed available net proceeds |
| `FUND_013` | `DATA_ROOM_ACCESS_DENIED` | 403 | Investor does not have access to this data room or document |
| `FUND_014` | `NDA_REQUIRED` | 403 | Investor must sign an NDA before accessing data room materials |
| `FUND_015` | `TERM_SHEET_EXPIRED` | 410 | Term sheet has expired and is no longer valid for acceptance |
| `FUND_016` | `WIRE_ALREADY_CONFIRMED` | 409 | This wire transfer has already been confirmed and cannot be modified |
| `FUND_017` | `ACCREDITATION_EXPIRED` | 403 | Investor's accreditation status has expired; re-verification required |
| `FUND_018` | `KYC_NOT_APPROVED` | 403 | Investor has not completed KYC/AML verification |
| `FUND_019` | `CLOSING_PREREQUISITES_NOT_MET` | 422 | Round cannot be closed — outstanding items in closing checklist |
| `FUND_020` | `INTEREST_CALCULATION_ERROR` | 500 | Error calculating accrued interest on convertible note |

---

## Security

### Financial Data Encryption

All financial data in the funding module is treated as **highly sensitive** and protected with defense-in-depth:

```typescript
// Encryption configuration for funding data
const FUNDING_ENCRYPTION_CONFIG = {
  // ── At-Rest Encryption ─────────────────────────────────────────
  database: {
    // Supabase PostgreSQL uses AES-256 transparent data encryption (TDE)
    tde: true,
    // Column-level encryption for ultra-sensitive fields
    encryptedColumns: [
      'wire_trackings.bank_reference',
      'wire_trackings.wire_confirmation_number',
      'wire_trackings.sender_bank',
      'wire_trackings.receiver_bank',
      'investors.primary_contact_phone',
      'safe_agreements.conversion_result',
    ],
    encryptionAlgorithm: 'aes-256-gcm',
    keyRotationIntervalDays: 90,
  },

  // ── In-Transit Encryption ──────────────────────────────────────
  transport: {
    minimumTlsVersion: '1.3',
    certificatePinning: true,
    mutualTls: true,                  // For inter-service communication
  },

  // ── Document Encryption ────────────────────────────────────────
  documents: {
    // SAFE agreements, term sheets, and legal docs
    encryptionAtRest: true,
    encryptionAlgorithm: 'aes-256-gcm',
    keyPerDocument: true,             // Unique DEK per document
    keyWrapping: 'aws-kms',           // KEK managed by KMS
  },

  // ── Backup Encryption ─────────────────────────────────────────
  backups: {
    encrypted: true,
    algorithm: 'aes-256-cbc',
    keyManagedBy: 'infrastructure',
  },
};
```

### Investor Portal Access Control

The investor portal provides external investors with controlled access to their investment data, reports, and data room materials:

```typescript
// Access control matrix for investor portal
const INVESTOR_PORTAL_PERMISSIONS = {
  roles: {
    investor_admin: {
      description: 'Primary investor contact with full access',
      permissions: [
        'view_own_investments',
        'view_cap_table_summary',
        'view_reports',
        'download_reports',
        'access_data_room',
        'download_data_room_docs',
        'submit_questions',
        'view_round_status',
        'manage_contacts',
        'update_wire_info',
        'sign_documents',
        'view_communication_log',
      ],
    },
    investor_viewer: {
      description: 'Read-only access for additional investor contacts',
      permissions: [
        'view_own_investments',
        'view_cap_table_summary',
        'view_reports',
        'access_data_room',
        'view_round_status',
        'view_communication_log',
      ],
    },
    investor_legal: {
      description: 'Legal counsel access for document review',
      permissions: [
        'access_data_room',
        'download_data_room_docs',
        'submit_questions',
        'view_term_sheets',
        'sign_documents',
        'view_closing_checklist',
      ],
    },
    board_observer: {
      description: 'Board observer with expanded reporting access',
      permissions: [
        'view_own_investments',
        'view_cap_table_full',
        'view_reports',
        'download_reports',
        'view_board_materials',
        'access_data_room',
        'view_round_status',
        'view_financials_summary',
      ],
    },
  },

  // ── Data Scoping ─────────────────────────────────────────────────
  dataScoping: {
    // Investors can only see their own investment data
    investmentData: 'own_only',
    // Cap table visibility depends on information rights
    capTable: 'summary_unless_info_rights',
    // Reports are sent per distribution list
    reports: 'distribution_list_only',
    // Data room access is per-room, per-investor
    dataRoom: 'explicit_grant_required',
  },

  // ── Session Management ───────────────────────────────────────────
  session: {
    maxSessionDurationHours: 8,
    inactivityTimeoutMinutes: 30,
    requireMfa: true,
    mfaMethods: ['totp', 'sms', 'email'],
    ipWhitelist: false,               // Optional per-investor
    concurrentSessions: 2,
  },

  // ── Audit ────────────────────────────────────────────────────────
  audit: {
    logAllAccess: true,
    logDocumentViews: true,
    logDownloads: true,
    logSearchQueries: true,
    retentionDays: 2555,              // 7 years for financial records
    alertOnSuspiciousActivity: true,
    suspiciousPatterns: [
      'bulk_download',
      'after_hours_access',
      'new_ip_address',
      'rapid_document_cycling',
    ],
  },
};
```

### Internal Access Control

```typescript
// Internal staff access levels for funding operations
const INTERNAL_ACCESS_LEVELS = {
  consortium_admin: {
    description: 'Full access to all funding data across all ventures',
    capabilities: [
      'manage_rounds', 'manage_investors', 'manage_cap_table',
      'manage_safes', 'manage_notes', 'run_dilution_models',
      'configure_waterfalls', 'manage_data_rooms', 'manage_term_sheets',
      'execute_closings', 'send_reports', 'view_wire_details',
      'export_data', 'manage_access',
    ],
  },
  venture_cfo: {
    description: 'Full funding access for a specific venture',
    scopedTo: 'venture',
    capabilities: [
      'manage_rounds', 'manage_investors', 'manage_cap_table',
      'manage_safes', 'manage_notes', 'run_dilution_models',
      'configure_waterfalls', 'manage_data_rooms', 'manage_term_sheets',
      'execute_closings', 'send_reports', 'view_wire_details',
    ],
  },
  venture_finance: {
    description: 'Operational funding access, no closing authority',
    scopedTo: 'venture',
    capabilities: [
      'view_rounds', 'manage_investors', 'view_cap_table',
      'manage_safes', 'manage_notes', 'run_dilution_models',
      'configure_waterfalls', 'manage_data_rooms',
      'send_reports', 'view_wire_details',
    ],
  },
  venture_legal: {
    description: 'Legal document and term sheet management',
    scopedTo: 'venture',
    capabilities: [
      'view_rounds', 'view_investors', 'view_cap_table',
      'manage_term_sheets', 'manage_data_rooms',
      'view_safes', 'view_notes', 'view_closing_checklist',
    ],
  },
  read_only: {
    description: 'View-only access to funding data',
    scopedTo: 'venture',
    capabilities: [
      'view_rounds', 'view_investors', 'view_cap_table',
      'view_safes', 'view_notes', 'view_reports',
    ],
  },
};
```

### Data Room Security

```typescript
// Data room specific security controls
const DATA_ROOM_SECURITY = {
  // ── Document Watermarking ────────────────────────────────────────
  watermarking: {
    enabled: true,
    format: 'diagonal_text',
    content: '{investor_name} | {access_date} | Confidential',
    opacity: 0.15,
    applyTo: ['pdf', 'docx', 'xlsx'],
    preventScreenshot: false,          // Not technically enforceable
  },

  // ── Access Controls ──────────────────────────────────────────────
  accessControls: {
    ndaRequiredBeforeAccess: true,
    downloadRestrictions: 'per_document',
    printRestrictions: true,
    copyPasteRestrictions: false,      // Not enforceable in web
    linkExpiration: true,
    linkExpirationHours: 24,
    maxConcurrentViewers: 5,
  },

  // ── Forensic Tracking ───────────────────────────────────────────
  forensicTracking: {
    uniqueDocumentIds: true,           // Each investor gets unique copy ID
    viewDurationTracking: true,
    pageViewTracking: true,
    downloadTracking: true,
    ipLogging: true,
    deviceFingerprinting: false,
  },
};
```

---

## Environment Variables

```bash
# ── Database ────────────────────────────────────────────────────────
FUNDING_DATABASE_URL=postgresql://user:pass@host:5432/mcv    # Supabase PostgreSQL connection
FUNDING_DATABASE_POOL_SIZE=10                                 # Connection pool size

# ── Encryption ──────────────────────────────────────────────────────
FUNDING_ENCRYPTION_KEY_ID=arn:aws:kms:...                    # KMS key for document encryption
FUNDING_COLUMN_ENCRYPTION_KEY=base64_encoded_key              # Column-level encryption key
FUNDING_ENCRYPTION_KEY_ROTATION_DAYS=90                       # Key rotation interval

# ── Investor Portal ────────────────────────────────────────────────
FUNDING_PORTAL_URL=https://portal.mcv.ventures                # Investor portal URL
FUNDING_PORTAL_SESSION_TIMEOUT_MINUTES=30                     # Session inactivity timeout
FUNDING_PORTAL_MFA_REQUIRED=true                              # Require MFA for portal access
FUNDING_PORTAL_MAX_SESSIONS=2                                 # Max concurrent sessions per investor

# ── Notifications ──────────────────────────────────────────────────
FUNDING_NOTIFICATION_EMAIL_FROM=funding@mcv.ventures          # Sender email for funding notifications
FUNDING_NOTIFICATION_WEBHOOK_URL=https://hooks.mcv.ventures   # Webhook for real-time alerts
FUNDING_REPORT_DISTRIBUTION_ENABLED=true                      # Enable automated report distribution

# ── Data Room ──────────────────────────────────────────────────────
FUNDING_DATA_ROOM_STORAGE_BUCKET=mcv-data-rooms               # S3/Supabase storage bucket
FUNDING_DATA_ROOM_MAX_FILE_SIZE_MB=250                        # Maximum file upload size
FUNDING_DATA_ROOM_WATERMARK_ENABLED=true                      # Enable document watermarking
FUNDING_DATA_ROOM_LINK_EXPIRY_HOURS=24                        # Document link expiration

# ── Wire Tracking ──────────────────────────────────────────────────
FUNDING_WIRE_ALERT_THRESHOLD=100000                           # Alert threshold for wires (in cents)
FUNDING_WIRE_CONFIRMATION_REQUIRED=true                       # Require manual wire confirmation
FUNDING_WIRE_BANK_API_ENABLED=false                           # Enable bank API integration

# ── Interest Calculation ───────────────────────────────────────────
FUNDING_INTEREST_CALCULATION_CRON=0 2 * * *                   # Daily interest accrual schedule
FUNDING_INTEREST_DAY_COUNT_CONVENTION=actual_365              # Default day count convention

# ── Audit ───────────────────────────────────────────────────────────
FUNDING_AUDIT_LOG_RETENTION_DAYS=2555                         # 7-year retention for financial audits
FUNDING_AUDIT_ALERT_EMAIL=compliance@mcv.ventures             # Alert email for suspicious activity

# ── Feature Flags ──────────────────────────────────────────────────
FUNDING_FEATURE_AUTO_SAFE_CONVERSION=false                    # Auto-convert SAFEs on qualifying round
FUNDING_FEATURE_WATERFALL_SENSITIVITY=true                    # Enable sensitivity analysis
FUNDING_FEATURE_TERM_SHEET_AI_COMPARISON=false                # AI-powered term sheet analysis
```

---

## Dependencies

```json
{
  "internal": {
    "@mcv/db": "workspace:*",
    "@mcv/auth": "workspace:*",
    "@mcv/notifications": "workspace:*",
    "@mcv/documents": "workspace:*",
    "@mcv/audit": "workspace:*",
    "@mcv/treasury/pnl": "workspace:*",
    "@mcv/portfolio": "workspace:*"
  },
  "external": {
    "drizzle-orm": "^0.30.0",
    "@trpc/server": "^11.0.0",
    "zod": "^3.23.0",
    "decimal.js": "^10.4.0",
    "date-fns": "^3.6.0",
    "ioredis": "^5.3.0",
    "pdfkit": "^0.14.0",
    "node-forge": "^1.3.0",
    "bullmq": "^5.0.0"
  },
  "devDependencies": {
    "vitest": "^1.6.0",
    "@faker-js/faker": "^8.4.0",
    "testcontainers": "^10.7.0",
    "supertest": "^7.0.0"
  }
}
```

### Key Dependency Notes

| Package | Purpose |
|---------|---------|
| `decimal.js` | Arbitrary-precision decimal arithmetic for financial calculations — avoids floating-point errors in share prices, dilution math, and waterfall distributions |
| `date-fns` | Date manipulation for interest accrual calculations, vesting schedules, and maturity date tracking |
| `pdfkit` | Generate investor reports, cap table exports, and waterfall summaries as PDF documents |
| `node-forge` | Cryptographic operations for document watermarking and column-level encryption |
| `bullmq` | Background job processing for interest accrual cron jobs, report distribution, and async waterfall calculations |
| `ioredis` | Caching layer for cap table snapshots, dilution model results, and frequently-accessed investor data |

---

## Testing

### Test Strategy

```typescript
// Test file structure
// src/
//   __tests__/
//     services/
//       funding.service.test.ts
//       investor.service.test.ts
//       cap-table.service.test.ts
//       safe.service.test.ts
//       convertible-note.service.test.ts
//       dilution-modeling.service.test.ts
//       waterfall.service.test.ts
//       due-diligence.service.test.ts
//       term-sheet.service.test.ts
//       closing.service.test.ts
//     integration/
//       funding-round-lifecycle.test.ts
//       safe-conversion-flow.test.ts
//       cap-table-consistency.test.ts
//       waterfall-accuracy.test.ts
//       data-room-access.test.ts
//     fixtures/
//       seed-cap-table.ts
//       sample-investors.ts
//       sample-safes.ts
//       sample-rounds.ts
```

### Critical Test Scenarios

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { DilutionModelingService } from '../services/dilution-modeling.service';
import { WaterfallService } from '../services/waterfall.service';
import { CapTableService } from '../services/cap-table.service';
import { createTestDb, seedCapTable } from './fixtures';
import Decimal from 'decimal.js';

describe('Cap Table Consistency', () => {
  let capTableService: CapTableService;

  beforeEach(async () => {
    const db = await createTestDb();
    capTableService = new CapTableService(db, mockCtx);
    await seedCapTable(db);
  });

  it('ownership percentages always sum to 100%', async () => {
    const snapshot = await capTableService.getCurrentSnapshot('venture_test');
    const totalPercent = snapshot.entries.reduce(
      (sum, e) => sum.plus(e.fullyDilutedPercent),
      new Decimal(0)
    );
    // Allow for rounding: should be within 1 basis point of 10000
    expect(totalPercent.toNumber()).toBeGreaterThanOrEqual(9999);
    expect(totalPercent.toNumber()).toBeLessThanOrEqual(10001);
  });

  it('fully diluted shares match sum of all entries', async () => {
    const snapshot = await capTableService.getCurrentSnapshot('venture_test');
    const sumShares = snapshot.entries.reduce(
      (sum, e) => sum + e.sharesFullyDiluted, 0
    );
    expect(sumShares).toBe(snapshot.totalSharesFullyDiluted);
  });

  it('snapshot is immutable after creation', async () => {
    const snapshot = await capTableService.createSnapshot('venture_test', {
      name: 'Test Snapshot',
      triggerEvent: 'manual',
    });

    await expect(
      capTableService.modifySnapshot(snapshot.id, { name: 'Modified' })
    ).rejects.toThrow('SNAPSHOT_IMMUTABLE');
  });
});

describe('SAFE Conversion Accuracy', () => {
  it('cap-based conversion uses correct formula', async () => {
    // $500K SAFE with $10M cap, round at $20M pre-money
    const result = await safeService.previewConversion('safe_test', {
      triggerType: 'equity_financing',
      roundId: 'round_test',
      preMoneyValuation: 2_000_000_000,  // $20M
      pricePerShare: 200,                 // $2.00
    });

    // Cap-based price = Cap / Fully Diluted Shares = $10M / shares
    // Should be lower than round price of $2.00
    expect(result.effectivePrice).toBeLessThan(200);
    expect(result.conversionMethod).toBe('cap');
  });

  it('discount-based conversion applies correctly', async () => {
    // $250K SAFE with 20% discount, no cap
    const result = await safeService.previewConversion('safe_discount_only', {
      triggerType: 'equity_financing',
      roundId: 'round_test',
      preMoneyValuation: 2_000_000_000,
      pricePerShare: 200,
    });

    // Discount price = $2.00 × (1 - 0.20) = $1.60
    expect(result.effectivePrice).toBe(160);
    expect(result.conversionMethod).toBe('discount');
  });

  it('cap-and-discount uses the lower price', async () => {
    const result = await safeService.previewConversion('safe_both', {
      triggerType: 'equity_financing',
      roundId: 'round_test',
      preMoneyValuation: 2_000_000_000,
      pricePerShare: 200,
    });

    expect(result.effectivePrice).toBe(
      Math.min(result.capBasedPrice, result.discountBasedPrice)
    );
  });
});

describe('Waterfall Distribution', () => {
  it('1x non-participating preferred gets correct payout', async () => {
    // $8M invested, 1x non-participating, $50M exit
    const result = await waterfallService.computeWaterfall('waterfall_simple');

    const seriesAAlloc = result.allocations.find(
      a => a.shareClass === 'Series A Preferred'
    );
    // Should convert to common because common payout > 1x preference
    expect(seriesAAlloc.optimalStrategy).toBe('convert');
    expect(seriesAAlloc.totalPayout).toBeGreaterThan(800_000_000);
  });

  it('liquidation preferences are paid in seniority order', async () => {
    const result = await waterfallService.computeWaterfall('waterfall_stacked');

    const tierOrders = result.tiers.map(t => t.order);
    expect(tierOrders).toEqual([...tierOrders].sort((a, b) => a - b));

    // Senior preference should be fully funded before junior
    const senior = result.tiers.find(t => t.seniority === 'senior');
    const junior = result.tiers.find(t => t.seniority === 'junior');
    if (senior && !senior.fullyFunded) {
      expect(junior.amountAllocated).toBe(0);
    }
  });

  it('participation cap is enforced', async () => {
    // 1x participating with 3x cap
    const result = await waterfallService.computeWaterfall('waterfall_capped');

    const participatingAlloc = result.allocations.find(
      a => a.shareClass === 'Series B Preferred'
    );
    const invested = participatingAlloc.totalInvested;
    const maxPayout = invested * 3; // 3x cap

    expect(participatingAlloc.totalPayout).toBeLessThanOrEqual(maxPayout);
  });

  it('total allocations never exceed net proceeds', async () => {
    const result = await waterfallService.computeWaterfall('waterfall_test');

    const totalAllocated = result.allocations.reduce(
      (sum, a) => sum + a.totalPayout, 0
    );
    expect(totalAllocated).toBeLessThanOrEqual(result.exitScenario.netProceeds);
  });
});

describe('Dilution Modeling', () => {
  it('option pool shuffle increases effective dilution from pre-money', async () => {
    const result = await dilutionService.computeScenario('scenario_with_pool');

    // Option pool expansion from pre-money means founders bear the dilution,
    // not the new investors
    expect(result.output.founderDilutionPercent).toBeGreaterThan(
      result.output.existingInvestorDilutionPercent
    );
  });

  it('post-money valuation equals pre-money plus round size', async () => {
    const result = await dilutionService.computeScenario('scenario_basic');

    expect(result.output.postMoneyValuation).toBe(
      result.output.preMoneyValuation + 800_000_000 // $8M round
    );
  });
});

describe('Interest Accrual', () => {
  it('simple interest calculates correctly', async () => {
    // $500K note, 6% annual, 180 days
    const accrual = await noteService.calculateInterest('note_simple', {
      asOfDate: new Date('2026-06-15'),
      dayCountConvention: 'actual_365',
    });

    // Expected: $500,000 × 0.06 × (180/365) = $14,794.52
    const expected = Math.round(50_000_000 * 0.06 * (180 / 365));
    expect(accrual.periodInterest).toBeCloseTo(expected, -2); // Within $1
  });

  it('compound interest calculates correctly over multiple periods', async () => {
    const accrual = await noteService.calculateInterest('note_compound', {
      asOfDate: new Date('2027-01-01'),
      dayCountConvention: 'actual_365',
    });

    // Compound should always be >= simple for same principal/rate/time
    const simpleInterest = 50_000_000 * 0.08 * 1; // 1 year, 8%
    expect(accrual.cumulativeInterest).toBeGreaterThanOrEqual(simpleInterest);
  });
});
```

### Running Tests

```bash
# Run all funding module tests
pnpm --filter @mcv/treasury/funding test

# Run with coverage
pnpm --filter @mcv/treasury/funding test:coverage

# Run specific test suite
pnpm --filter @mcv/treasury/funding test -- --grep "Waterfall"

# Run integration tests (requires PostgreSQL)
pnpm --filter @mcv/treasury/funding test:integration

# Run financial accuracy tests (extended precision checks)
pnpm --filter @mcv/treasury/funding test:financial
```

### Financial Calculation Verification

All financial calculations in this module are verified against:
- **Manual spreadsheet calculations** — Each formula has a corresponding Excel verification workbook in `test/verification/`
- **Known test vectors** — Standard SAFE conversion scenarios from YC documentation
- **Cross-validation** — Dilution outputs are verified against waterfall inputs for consistency
- **Decimal precision** — All monetary calculations use `decimal.js` to avoid IEEE 754 floating-point errors. Never use native `number` for currency math.

---

## Integration Points

### Feeds Into

| Module | Data Flow | Description |
|--------|-----------|-------------|
| `@mcv/treasury/pnl` | Capital structure, equity values | PnL module uses cap table data to calculate equity-based compensation expense, report capital structure on balance sheet, and track fair market value of equity positions |
| `@mcv/portfolio` | Investor relations, venture health | Portfolio module consumes investor data for relationship management, tracks investment performance metrics (MOIC, IRR), and surfaces funding status in venture health dashboards |
| `@mcv/audit` | Financial audit trail | Every funding transaction (round creation, SAFE execution, cap table change, wire confirmation) generates an immutable audit log entry for compliance |
| `@mcv/notifications` | Investor updates, alerts | Closing milestones, report publications, data room updates, and wire confirmations trigger notifications to relevant stakeholders |

### Receives From

| Module | Data Flow | Description |
|--------|-----------|-------------|
| `@mcv/auth` | User identity, RBAC | Authentication context for all operations; role-based access control for internal staff and investor portal users |
| `@mcv/documents` | Legal templates, signed docs | Document management for SAFE templates, term sheet drafts, and signed legal instruments |
| `@mcv/db` | Database connection, migrations | Shared database infrastructure, connection pooling, and schema migration tooling |

---

## Changelog

| Version | Date | Changes |
|---------|------|---------|
| 0.1.0 | 2025-09-01 | Initial release — funding rounds, investors, basic cap table |
| 0.2.0 | 2025-10-15 | Added SAFE agreement management and conversion engine |
| 0.3.0 | 2025-11-20 | Convertible note support with interest accrual |
| 0.4.0 | 2025-12-10 | Dilution modeling with scenario comparison |
| 0.5.0 | 2026-01-15 | Distribution waterfall calculator |
| 0.6.0 | 2026-02-01 | Investor portal, data room management, term sheet comparison |
| 0.7.0 | 2026-02-08 | Closing management, wire tracking, investor reporting |