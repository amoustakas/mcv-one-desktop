# @mcv/finance/accounting

> **Double-Entry General Ledger & Accounting Engine**

| Field | Value |
|---|---|
| **Package** | `@mcv/finance/accounting` |
| **Tier** | 5 — Domain |
| **Visibility** | Publishable |
| **Domain** | Finance |
| **Runtime** | Node.js (server-side only) |
| **DB** | Supabase PostgreSQL |
| **API** | tRPC |
| **Status** | Active |
| **Since** | 0.1.0 |

---

## Purpose

The accounting module is the **financial backbone** of every venture in MCV. It implements a complete double-entry bookkeeping system — the same fundamental system that has powered commerce since Luca Pacioli formalized it in 1494. Every dollar that flows through a venture is captured here: every sale, every expense, every transfer, every adjustment.

This module provides:

- **Chart of Accounts (CoA)** — Hierarchical, venture-configurable account trees spanning assets, liabilities, equity, revenue, and expenses
- **Journal Entries** — Double-entry journal entries with automatic debit/credit balancing validation, reversal support, and approval workflows
- **General Ledger (GL)** — The authoritative book of record with posting, period management, and trial balance generation
- **Account Balances** — Real-time balance computation with period-end snapshot caching for performant reporting
- **Fiscal Periods** — Full fiscal year, quarter, and month lifecycle management including open, close, lock, and reopen operations
- **Recurring Journals** — Template-driven recurring entries for rent, depreciation, amortization, and other periodic postings
- **Reconciliation** — Bank reconciliation, inter-account reconciliation, and suspense account clearing workflows
- **Financial Statements** — Automated generation of income statements, balance sheets, and cash flow statements
- **Multi-Currency** — Full multi-currency transaction support with realized/unrealized FX gain/loss tracking and period-end revaluation
- **Audit Trail** — Immutable, append-only audit log of every posting, adjustment, and correction

The accounting module is the **single source of truth** for all financial data. Every other financial module — invoicing, payments, payroll, tax — ultimately feeds into or reads from this ledger. The fundamental accounting equation (**Assets = Liabilities + Equity**) is enforced at the database level, making it impossible to create an unbalanced state.

---

## Exports

```typescript
// === Core Service ===
export { AccountingService }              from './service';
export { createAccountingRouter }         from './router';

// === Chart of Accounts ===
export { ChartOfAccountsService }         from './chart-of-accounts/service';
export { AccountTreeBuilder }             from './chart-of-accounts/tree-builder';
export { DefaultCoATemplates }            from './chart-of-accounts/templates';

// === Journal Entries ===
export { JournalEntryService }            from './journal-entries/service';
export { JournalEntryValidator }          from './journal-entries/validator';
export { JournalEntryPoster }             from './journal-entries/poster';

// === General Ledger ===
export { GeneralLedgerService }           from './general-ledger/service';
export { TrialBalanceGenerator }          from './general-ledger/trial-balance';
export { LedgerQueryBuilder }             from './general-ledger/query-builder';

// === Account Balances ===
export { BalanceService }                 from './balances/service';
export { BalanceSnapshotEngine }          from './balances/snapshot-engine';
export { RealTimeBalanceCalculator }      from './balances/realtime-calculator';

// === Fiscal Periods ===
export { FiscalPeriodService }            from './fiscal-periods/service';
export { PeriodLifecycleManager }         from './fiscal-periods/lifecycle';
export { FiscalCalendarBuilder }          from './fiscal-periods/calendar-builder';

// === Recurring Journals ===
export { RecurringJournalService }        from './recurring-journals/service';
export { RecurrenceScheduler }            from './recurring-journals/scheduler';
export { RecurringTemplateEngine }        from './recurring-journals/template-engine';

// === Reconciliation ===
export { ReconciliationService }          from './reconciliation/service';
export { BankReconciliationEngine }       from './reconciliation/bank-engine';
export { InterAccountReconciler }         from './reconciliation/inter-account';
export { SuspenseAccountClearer }         from './reconciliation/suspense-clearer';

// === Financial Statements ===
export { FinancialStatementService }      from './financial-statements/service';
export { IncomeStatementGenerator }       from './financial-statements/income-statement';
export { BalanceSheetGenerator }          from './financial-statements/balance-sheet';
export { CashFlowStatementGenerator }     from './financial-statements/cash-flow';

// === Multi-Currency ===
export { MultiCurrencyService }           from './multi-currency/service';
export { FxRateProvider }                 from './multi-currency/fx-rate-provider';
export { RevaluationEngine }              from './multi-currency/revaluation-engine';
export { FxGainLossCalculator }           from './multi-currency/gain-loss-calculator';

// === Audit Trail ===
export { AuditTrailService }              from './audit-trail/service';
export { AuditLogWriter }                 from './audit-trail/log-writer';
export { AuditLogQueryEngine }            from './audit-trail/query-engine';

// === Types ===
export type {
  // Core
  Account,
  AccountType,
  AccountSubType,
  AccountNode,
  AccountTree,
  
  // Journal
  JournalEntry,
  JournalEntryLine,
  JournalEntryStatus,
  JournalEntryType,
  JournalTemplate,
  
  // Ledger
  LedgerPosting,
  TrialBalance,
  TrialBalanceLine,
  
  // Balances
  AccountBalance,
  BalanceSnapshot,
  BalancePeriod,
  
  // Fiscal
  FiscalYear,
  FiscalQuarter,
  FiscalMonth,
  FiscalPeriod,
  FiscalPeriodStatus,
  
  // Recurring
  RecurringJournal,
  RecurrenceFrequency,
  RecurrenceSchedule,
  
  // Reconciliation
  ReconciliationSession,
  ReconciliationMatch,
  ReconciliationStatus,
  BankStatement,
  BankStatementLine,
  
  // Financial Statements
  FinancialStatement,
  IncomeStatement,
  BalanceSheet,
  CashFlowStatement,
  StatementLineItem,
  
  // Multi-Currency
  CurrencyCode,
  ExchangeRate,
  FxGainLoss,
  RevaluationResult,
  
  // Audit
  AuditLogEntry,
  AuditAction,
  AuditContext,
  
  // Config
  AccountingConfig,
  VentureAccountingSettings,
} from './types';

// === Errors ===
export {
  AccountingError,
  UnbalancedEntryError,
  PeriodClosedError,
  PeriodLockedError,
  AccountNotFoundError,
  AccountInactiveError,
  DuplicateAccountCodeError,
  InsufficientBalanceError,
  CurrencyMismatchError,
  ReconciliationMismatchError,
  AuditIntegrityError,
  InvalidFiscalPeriodError,
  JournalPostingError,
  StatementGenerationError,
} from './errors';

// === Constants ===
export {
  ACCOUNT_TYPES,
  NORMAL_BALANCES,
  DEFAULT_FISCAL_YEAR_START,
  MAX_JOURNAL_LINES,
  RECONCILIATION_TOLERANCE,
  SUPPORTED_CURRENCIES,
} from './constants';
```

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        tRPC Router Layer                                │
│  accounting.createAccount  │  accounting.postJournal  │  accounting.*   │
└─────────────────────┬───────────────────┬───────────────────┬───────────┘
                      │                   │                   │
┌─────────────────────▼───────────────────▼───────────────────▼───────────┐
│                       AccountingService (Facade)                        │
│                                                                         │
│  Orchestrates all sub-services, enforces venture isolation,             │
│  manages transactions, and coordinates cross-cutting concerns           │
└───┬─────┬──────┬──────┬──────┬──────┬──────┬──────┬──────┬──────┬──────┘
    │     │      │      │      │      │      │      │      │      │
    ▼     ▼      ▼      ▼      ▼      ▼      ▼      ▼      ▼      ▼
┌──────┐┌────┐┌─────┐┌─────┐┌──────┐┌─────┐┌──────┐┌─────┐┌─────┐┌─────┐
│ CoA  ││ JE ││ GL  ││ Bal ││ FP   ││ RJ  ││ Rec  ││ FS  ││ MCY ││ Aud │
│Svc   ││Svc ││Svc  ││Svc  ││Svc   ││Svc  ││Svc   ││Svc  ││Svc  ││Svc  │
└──┬───┘└─┬──┘└──┬──┘└──┬──┘└──┬───┘└──┬──┘└──┬───┘└──┬──┘└──┬──┘└──┬──┘
   │      │      │      │      │       │      │       │      │      │
   ▼      ▼      ▼      ▼      ▼       ▼      ▼       ▼      ▼      ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                     Supabase PostgreSQL                                  │
│                                                                         │
│  accounts │ journal_entries │ journal_entry_lines │ ledger_postings     │
│  account_balances │ fiscal_periods │ recurring_journals                 │
│  reconciliation_sessions │ reconciliation_matches │ bank_statements     │
│  exchange_rates │ fx_gain_losses │ audit_log                            │
│                                                                         │
│  ┌───────────────────────────────────────────────────────────────────┐  │
│  │  RLS Policies: venture_id isolation on ALL tables                 │  │
│  │  CHECK constraints: debit/credit balancing on journal entries     │  │
│  │  Triggers: auto-calculate balances, enforce period locks          │  │
│  │  Partitioning: audit_log by fiscal_year for performance           │  │
│  └───────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────┘

Legend:
  CoA = Chart of Accounts    JE  = Journal Entries     GL  = General Ledger
  Bal = Account Balances     FP  = Fiscal Periods      RJ  = Recurring Journals
  Rec = Reconciliation       FS  = Financial Statements MCY = Multi-Currency
  Aud = Audit Trail
```

### Data Flow: Journal Entry Lifecycle

```
 User/System creates entry
         │
         ▼
 ┌───────────────┐     ┌──────────────────┐
 │  JE Validator  │────▶│  Validation Pass  │
 │                │     │  - Debits = Credits│
 │  Validates:    │     │  - Accounts exist  │
 │  • Balance     │     │  - Period is open  │
 │  • Accounts    │     │  - Currency valid  │
 │  • Period      │     │  - Amounts > 0     │
 │  • Currency    │     └────────┬─────────┘
 │  • Amounts     │              │
 └───────────────┘              │ PASS
                                ▼
                   ┌─────────────────────┐
                   │  Status: DRAFT      │
                   │  (Awaiting approval │
                   │   if required)      │
                   └────────┬────────────┘
                            │ Approve / Auto-post
                            ▼
                   ┌─────────────────────┐
                   │  JE Poster          │
                   │                     │
                   │  BEGIN TRANSACTION  │
                   │  1. Insert postings │
                   │  2. Update balances │
                   │  3. Write audit log │
                   │  4. Update JE status│
                   │  COMMIT             │
                   └────────┬────────────┘
                            │
                   ┌────────▼────────────┐
                   │  Status: POSTED     │
                   │  Ledger updated     │
                   │  Balances current   │
                   │  Audit trail logged │
                   └─────────────────────┘
```

### Double-Entry Invariant

```
For EVERY transaction in the system:

    Σ Debits = Σ Credits

This is enforced at THREE levels:

  1. Application  — JournalEntryValidator checks before save
  2. Database     — CHECK constraint on journal_entries
  3. Audit        — Periodic verification job confirms GL integrity

Normal Balance Rules:
  ┌─────────────┬─────────────────┬──────────────────┐
  │ Account Type│ Normal Balance  │ Increase By      │
  ├─────────────┼─────────────────┼──────────────────┤
  │ Asset       │ Debit           │ Debit            │
  │ Expense     │ Debit           │ Debit            │
  │ Liability   │ Credit          │ Credit           │
  │ Equity      │ Credit          │ Credit           │
  │ Revenue     │ Credit          │ Credit           │
  └─────────────┴─────────────────┴──────────────────┘

  Contra accounts reverse their parent's normal balance.
```

---

## Core Interfaces

### AccountingService

The top-level facade that orchestrates all accounting operations. All interactions with the accounting module flow through this service.

```typescript
interface AccountingService {
  // === Chart of Accounts ===
  
  /** Create a new account in the chart of accounts */
  createAccount(input: CreateAccountInput): Promise<Account>;
  
  /** Update an existing account (name, description, metadata — NOT type) */
  updateAccount(input: UpdateAccountInput): Promise<Account>;
  
  /** Deactivate an account (soft-delete; cannot deactivate if balance ≠ 0) */
  deactivateAccount(accountId: string): Promise<void>;
  
  /** Reactivate a previously deactivated account */
  reactivateAccount(accountId: string): Promise<void>;
  
  /** Get a single account by ID or code */
  getAccount(ventureId: string, identifier: string): Promise<Account>;
  
  /** Get the full chart of accounts as a hierarchical tree */
  getAccountTree(ventureId: string, options?: AccountTreeOptions): Promise<AccountTree>;
  
  /** List accounts with filtering and pagination */
  listAccounts(ventureId: string, options?: ListAccountsOptions): Promise<PaginatedResult<Account>>;
  
  /** Initialize a venture's CoA from a template */
  initializeChartOfAccounts(ventureId: string, template: CoATemplate): Promise<AccountTree>;
  
  // === Journal Entries ===
  
  /** Create a new journal entry (status: DRAFT) */
  createJournalEntry(input: CreateJournalEntryInput): Promise<JournalEntry>;
  
  /** Update a draft journal entry (cannot update posted entries) */
  updateJournalEntry(input: UpdateJournalEntryInput): Promise<JournalEntry>;
  
  /** Post a journal entry to the general ledger */
  postJournalEntry(journalEntryId: string, options?: PostOptions): Promise<JournalEntry>;
  
  /** Post multiple journal entries in a single transaction */
  batchPostJournalEntries(journalEntryIds: string[], options?: PostOptions): Promise<JournalEntry[]>;
  
  /** Reverse a posted journal entry (creates a reversing entry) */
  reverseJournalEntry(journalEntryId: string, options?: ReverseOptions): Promise<JournalEntry>;
  
  /** Void a journal entry (marks as void, creates offsetting entry) */
  voidJournalEntry(journalEntryId: string, reason: string): Promise<JournalEntry>;
  
  /** Get a journal entry by ID with all lines */
  getJournalEntry(journalEntryId: string): Promise<JournalEntry>;
  
  /** List journal entries with filtering */
  listJournalEntries(ventureId: string, options?: ListJournalEntriesOptions): Promise<PaginatedResult<JournalEntry>>;
  
  // === General Ledger ===
  
  /** Get ledger postings for an account within a date range */
  getLedgerPostings(accountId: string, options?: LedgerQueryOptions): Promise<PaginatedResult<LedgerPosting>>;
  
  /** Generate a trial balance for a given date or period */
  generateTrialBalance(ventureId: string, options: TrialBalanceOptions): Promise<TrialBalance>;
  
  /** Verify the integrity of the general ledger (debits = credits for all periods) */
  verifyLedgerIntegrity(ventureId: string): Promise<LedgerIntegrityReport>;
  
  // === Account Balances ===
  
  /** Get the current balance of an account */
  getAccountBalance(accountId: string, options?: BalanceOptions): Promise<AccountBalance>;
  
  /** Get balances for multiple accounts */
  getAccountBalances(accountIds: string[], options?: BalanceOptions): Promise<AccountBalance[]>;
  
  /** Take a period-end balance snapshot for all accounts */
  takeBalanceSnapshot(ventureId: string, periodId: string): Promise<BalanceSnapshot[]>;
  
  /** Get historical balance snapshots for an account */
  getBalanceHistory(accountId: string, options?: BalanceHistoryOptions): Promise<BalanceSnapshot[]>;
  
  // === Fiscal Periods ===
  
  /** Create a fiscal year with auto-generated quarters and months */
  createFiscalYear(input: CreateFiscalYearInput): Promise<FiscalYear>;
  
  /** Open a fiscal period for posting */
  openPeriod(periodId: string): Promise<FiscalPeriod>;
  
  /** Close a fiscal period (prevents new postings, allows adjustments) */
  closePeriod(periodId: string): Promise<FiscalPeriod>;
  
  /** Lock a fiscal period (prevents ALL modifications) */
  lockPeriod(periodId: string): Promise<FiscalPeriod>;
  
  /** Reopen a closed (not locked) period */
  reopenPeriod(periodId: string, reason: string): Promise<FiscalPeriod>;
  
  /** Get the current open period for a venture */
  getCurrentPeriod(ventureId: string): Promise<FiscalPeriod>;
  
  /** List all fiscal periods for a venture */
  listFiscalPeriods(ventureId: string, options?: ListFiscalPeriodsOptions): Promise<FiscalPeriod[]>;
  
  // === Recurring Journals ===
  
  /** Create a recurring journal template */
  createRecurringJournal(input: CreateRecurringJournalInput): Promise<RecurringJournal>;
  
  /** Update a recurring journal template */
  updateRecurringJournal(input: UpdateRecurringJournalInput): Promise<RecurringJournal>;
  
  /** Pause a recurring journal */
  pauseRecurringJournal(recurringJournalId: string): Promise<void>;
  
  /** Resume a paused recurring journal */
  resumeRecurringJournal(recurringJournalId: string): Promise<void>;
  
  /** Generate pending recurring entries (called by scheduler) */
  generateRecurringEntries(ventureId: string, asOfDate: Date): Promise<JournalEntry[]>;
  
  /** Preview what entries would be generated without creating them */
  previewRecurringEntries(ventureId: string, asOfDate: Date): Promise<JournalEntry[]>;
  
  /** List recurring journals for a venture */
  listRecurringJournals(ventureId: string, options?: ListRecurringOptions): Promise<RecurringJournal[]>;
  
  // === Reconciliation ===
  
  /** Start a new bank reconciliation session */
  startBankReconciliation(input: StartReconciliationInput): Promise<ReconciliationSession>;
  
  /** Import a bank statement for reconciliation */
  importBankStatement(sessionId: string, statement: BankStatementImport): Promise<BankStatement>;
  
  /** Auto-match bank statement lines to ledger postings */
  autoMatchTransactions(sessionId: string): Promise<ReconciliationMatch[]>;
  
  /** Manually match a bank statement line to ledger postings */
  manualMatch(sessionId: string, input: ManualMatchInput): Promise<ReconciliationMatch>;
  
  /** Unmatch a previously matched pair */
  unmatchTransaction(matchId: string): Promise<void>;
  
  /** Complete the reconciliation session */
  completeReconciliation(sessionId: string): Promise<ReconciliationSession>;
  
  /** Clear suspense account entries */
  clearSuspenseEntries(ventureId: string, entries: SuspenseClearingInput[]): Promise<JournalEntry[]>;
  
  // === Financial Statements ===
  
  /** Generate an income statement for a period */
  generateIncomeStatement(ventureId: string, options: StatementOptions): Promise<IncomeStatement>;
  
  /** Generate a balance sheet as of a specific date */
  generateBalanceSheet(ventureId: string, options: StatementOptions): Promise<BalanceSheet>;
  
  /** Generate a cash flow statement for a period */
  generateCashFlowStatement(ventureId: string, options: StatementOptions): Promise<CashFlowStatement>;
  
  /** Generate a comparative financial statement (period-over-period) */
  generateComparativeStatement(ventureId: string, options: ComparativeOptions): Promise<FinancialStatement>;
  
  // === Multi-Currency ===
  
  /** Record an exchange rate */
  recordExchangeRate(input: RecordExchangeRateInput): Promise<ExchangeRate>;
  
  /** Get the current exchange rate between two currencies */
  getExchangeRate(from: CurrencyCode, to: CurrencyCode, asOfDate?: Date): Promise<ExchangeRate>;
  
  /** Perform period-end currency revaluation */
  performRevaluation(ventureId: string, options: RevaluationOptions): Promise<RevaluationResult>;
  
  /** Calculate realized FX gain/loss for a transaction */
  calculateRealizedGainLoss(input: RealizedGainLossInput): Promise<FxGainLoss>;
  
  // === Audit Trail ===
  
  /** Query the audit trail */
  queryAuditTrail(ventureId: string, options: AuditQueryOptions): Promise<PaginatedResult<AuditLogEntry>>;
  
  /** Get the full audit history for a specific journal entry */
  getJournalEntryAuditHistory(journalEntryId: string): Promise<AuditLogEntry[]>;
  
  /** Verify audit trail integrity (hash chain validation) */
  verifyAuditIntegrity(ventureId: string, options?: AuditIntegrityOptions): Promise<AuditIntegrityReport>;
}
```

### Account

```typescript
/** Classification of account types in double-entry bookkeeping */
type AccountType = 'asset' | 'liability' | 'equity' | 'revenue' | 'expense';

/** Sub-classification within each account type */
type AccountSubType =
  // Assets
  | 'current_asset' | 'fixed_asset' | 'intangible_asset' | 'other_asset'
  // Liabilities
  | 'current_liability' | 'long_term_liability' | 'other_liability'
  // Equity
  | 'owners_equity' | 'retained_earnings' | 'other_equity'
  // Revenue
  | 'operating_revenue' | 'other_revenue'
  // Expenses
  | 'operating_expense' | 'cost_of_goods_sold' | 'other_expense';

/** Normal balance direction for an account */
type NormalBalance = 'debit' | 'credit';

/** A single account in the chart of accounts */
interface Account {
  /** Unique identifier (UUID) */
  id: string;
  
  /** Venture this account belongs to */
  ventureId: string;
  
  /** Unique account code within the venture (e.g., "1000", "1010.01") */
  code: string;
  
  /** Human-readable name (e.g., "Cash and Cash Equivalents") */
  name: string;
  
  /** Optional description of account's purpose */
  description: string | null;
  
  /** Top-level classification */
  type: AccountType;
  
  /** Sub-classification for reporting */
  subType: AccountSubType;
  
  /** Normal balance direction (debit for assets/expenses, credit for liabilities/equity/revenue) */
  normalBalance: NormalBalance;
  
  /** Parent account ID for hierarchical structure (null = top-level) */
  parentId: string | null;
  
  /** Depth in the hierarchy (0 = top-level) */
  depth: number;
  
  /** Full materialized path (e.g., "assets.current.cash") */
  path: string;
  
  /** Whether this is a detail (leaf) account that can receive postings */
  isDetail: boolean;
  
  /** Whether this is a contra account (reverses parent's normal balance) */
  isContra: boolean;
  
  /** Whether the account is currently active */
  isActive: boolean;
  
  /** Whether the account is a system account (cannot be deleted) */
  isSystem: boolean;
  
  /** Default currency for the account (null = venture's base currency) */
  currencyCode: CurrencyCode | null;
  
  /** Whether this account requires multi-currency tracking */
  isMultiCurrency: boolean;
  
  /** Tags for custom categorization and reporting */
  tags: string[];
  
  /** Arbitrary metadata */
  metadata: Record<string, unknown>;
  
  /** Tax code association (if applicable) */
  taxCode: string | null;
  
  /** Bank account number (for bank/cash accounts) */
  bankAccountNumber: string | null;
  
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  updatedBy: string;
}

/** Hierarchical node in the account tree */
interface AccountNode {
  account: Account;
  children: AccountNode[];
  
  /** Aggregated balance (sum of this account + all descendants) */
  aggregatedBalance: number | null;
}

/** Complete account tree for a venture */
interface AccountTree {
  ventureId: string;
  roots: AccountNode[];
  totalAccounts: number;
  generatedAt: Date;
}

/** Options for fetching the account tree */
interface AccountTreeOptions {
  /** Include inactive accounts */
  includeInactive?: boolean;
  
  /** Include balances in the tree */
  includeBalances?: boolean;
  
  /** Balance as-of date */
  balanceAsOf?: Date;
  
  /** Filter to specific account types */
  types?: AccountType[];
  
  /** Maximum depth to return */
  maxDepth?: number;
}
```

### JournalEntry

```typescript
/** Status lifecycle of a journal entry */
type JournalEntryStatus = 
  | 'draft'       // Created, not yet posted
  | 'pending'     // Submitted for approval
  | 'approved'    // Approved, ready to post
  | 'posted'      // Posted to the general ledger
  | 'reversed'    // Reversed by a subsequent entry
  | 'voided';     // Voided (offset entry created)

/** Classification of journal entry types */
type JournalEntryType =
  | 'standard'       // Normal journal entry
  | 'adjusting'      // Period-end adjustment
  | 'closing'        // Period closing entry
  | 'reversing'      // Reversal of another entry
  | 'recurring'      // Generated from a recurring template
  | 'revaluation'    // Currency revaluation entry
  | 'opening'        // Opening balance entry
  | 'system';        // System-generated (auto-posting)

/** A double-entry journal entry */
interface JournalEntry {
  /** Unique identifier (UUID) */
  id: string;
  
  /** Venture this entry belongs to */
  ventureId: string;
  
  /** Sequential entry number within the venture (human-readable) */
  entryNumber: string;
  
  /** Type of journal entry */
  type: JournalEntryType;
  
  /** Current status */
  status: JournalEntryStatus;
  
  /** Date the entry is effective (posting date) */
  entryDate: Date;
  
  /** Fiscal period this entry belongs to */
  fiscalPeriodId: string;
  
  /** Description / memo for the entire entry */
  description: string;
  
  /** Reference number (e.g., invoice number, check number) */
  reference: string | null;
  
  /** Source document or system that created this entry */
  source: string | null;
  
  /** External reference ID (e.g., payment processor transaction ID) */
  externalRef: string | null;
  
  /** Individual debit/credit lines */
  lines: JournalEntryLine[];
  
  /** Total debits (should equal total credits) */
  totalDebits: number;
  
  /** Total credits (should equal total debits) */
  totalCredits: number;
  
  /** Base currency of the entry */
  currencyCode: CurrencyCode;
  
  /** If this is a reversal, the ID of the original entry */
  reversalOfId: string | null;
  
  /** If this entry has been reversed, the ID of the reversing entry */
  reversedById: string | null;
  
  /** If generated from a recurring template, the template ID */
  recurringJournalId: string | null;
  
  /** Approval details */
  approvedBy: string | null;
  approvedAt: Date | null;
  
  /** Posting details */
  postedBy: string | null;
  postedAt: Date | null;
  
  /** Void details */
  voidedBy: string | null;
  voidedAt: Date | null;
  voidReason: string | null;
  
  /** Tags for custom categorization */
  tags: string[];
  
  /** Attachments (references to document storage) */
  attachments: JournalAttachment[];
  
  /** Arbitrary metadata */
  metadata: Record<string, unknown>;
  
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  updatedBy: string;
}

/** A single line (debit or credit) within a journal entry */
interface JournalEntryLine {
  /** Unique identifier */
  id: string;
  
  /** Parent journal entry ID */
  journalEntryId: string;
  
  /** Line number for ordering */
  lineNumber: number;
  
  /** Account being debited or credited */
  accountId: string;
  
  /** Denormalized account code for display */
  accountCode: string;
  
  /** Denormalized account name for display */
  accountName: string;
  
  /** Debit amount (0 if this is a credit line) */
  debitAmount: number;
  
  /** Credit amount (0 if this is a debit line) */
  creditAmount: number;
  
  /** If multi-currency: the amount in the transaction currency */
  foreignAmount: number | null;
  
  /** If multi-currency: the transaction currency */
  foreignCurrencyCode: CurrencyCode | null;
  
  /** If multi-currency: the exchange rate used */
  exchangeRate: number | null;
  
  /** Line-level description/memo */
  description: string | null;
  
  /** Dimension/segment tracking */
  dimensions: JournalLineDimension[];
  
  /** Tax code for this line (if applicable) */
  taxCode: string | null;
  
  /** Tax amount (if applicable) */
  taxAmount: number | null;
  
  /** Project/cost center reference */
  costCenterId: string | null;
  
  /** Arbitrary metadata for this line */
  metadata: Record<string, unknown>;
}

/** Dimensional tagging for a journal line (cost center, project, department, etc.) */
interface JournalLineDimension {
  dimensionType: string;  // e.g., "department", "project", "region"
  dimensionValue: string; // e.g., "engineering", "proj-001", "na-east"
}

/** Attachment reference on a journal entry */
interface JournalAttachment {
  id: string;
  fileName: string;
  fileType: string;
  fileSizeBytes: number;
  storageRef: string;
  uploadedBy: string;
  uploadedAt: Date;
}

/** Input for creating a journal entry */
interface CreateJournalEntryInput {
  ventureId: string;
  type?: JournalEntryType;
  entryDate: Date;
  description: string;
  reference?: string;
  source?: string;
  externalRef?: string;
  currencyCode?: CurrencyCode;
  lines: CreateJournalEntryLineInput[];
  tags?: string[];
  metadata?: Record<string, unknown>;
  
  /** If true, post immediately after creation (skip draft state) */
  autoPost?: boolean;
}

/** Input for a single journal entry line */
interface CreateJournalEntryLineInput {
  accountId: string;
  debitAmount?: number;
  creditAmount?: number;
  foreignAmount?: number;
  foreignCurrencyCode?: CurrencyCode;
  exchangeRate?: number;
  description?: string;
  dimensions?: JournalLineDimension[];
  taxCode?: string;
  costCenterId?: string;
  metadata?: Record<string, unknown>;
}
```

### TrialBalance

```typescript
/** A trial balance report — lists all accounts with their debit/credit balances */
interface TrialBalance {
  /** Venture this trial balance is for */
  ventureId: string;
  
  /** As-of date for the trial balance */
  asOfDate: Date;
  
  /** Fiscal period (if period-specific) */
  fiscalPeriodId: string | null;
  
  /** Whether this is an adjusted trial balance */
  isAdjusted: boolean;
  
  /** Individual account lines */
  lines: TrialBalanceLine[];
  
  /** Sum of all debit balances */
  totalDebits: number;
  
  /** Sum of all credit balances */
  totalCredits: number;
  
  /** Whether the trial balance is in balance (debits = credits) */
  isBalanced: boolean;
  
  /** Difference (should be 0) */
  difference: number;
  
  /** Base currency */
  currencyCode: CurrencyCode;
  
  /** When this report was generated */
  generatedAt: Date;
}

/** A single line in the trial balance */
interface TrialBalanceLine {
  accountId: string;
  accountCode: string;
  accountName: string;
  accountType: AccountType;
  accountSubType: AccountSubType;
  depth: number;
  
  /** Opening balance for the period */
  openingBalance: number;
  
  /** Total debits during the period */
  periodDebits: number;
  
  /** Total credits during the period */
  periodCredits: number;
  
  /** Net movement (debits - credits, adjusted for normal balance) */
  netMovement: number;
  
  /** Closing balance */
  closingBalance: number;
  
  /** Debit balance (if closing is a debit) */
  debitBalance: number;
  
  /** Credit balance (if closing is a credit) */
  creditBalance: number;
}

/** Options for generating a trial balance */
interface TrialBalanceOptions {
  /** Generate as of this date */
  asOfDate: Date;
  
  /** Restrict to a specific fiscal period */
  fiscalPeriodId?: string;
  
  /** Include adjusting entries */
  includeAdjusting?: boolean;
  
  /** Include closing entries */
  includeClosing?: boolean;
  
  /** Include zero-balance accounts */
  includeZeroBalances?: boolean;
  
  /** Filter to specific account types */
  accountTypes?: AccountType[];
  
  /** Include sub-account detail */
  includeDetail?: boolean;
  
  /** Currency for the report */
  currencyCode?: CurrencyCode;
}
```

### FiscalPeriod

```typescript
/** Status of a fiscal period */
type FiscalPeriodStatus =
  | 'future'   // Not yet opened
  | 'open'     // Currently accepting postings
  | 'closed'   // Closed for normal postings (adjustments still allowed)
  | 'locked';  // Fully locked — no modifications allowed

/** Granularity of a fiscal period */
type FiscalPeriodGranularity = 'year' | 'quarter' | 'month';

/** A fiscal period (year, quarter, or month) */
interface FiscalPeriod {
  /** Unique identifier */
  id: string;
  
  /** Venture this period belongs to */
  ventureId: string;
  
  /** Display name (e.g., "FY2025", "Q1 2025", "January 2025") */
  name: string;
  
  /** Period granularity */
  granularity: FiscalPeriodGranularity;
  
  /** Parent period ID (month → quarter → year) */
  parentPeriodId: string | null;
  
  /** Start date (inclusive) */
  startDate: Date;
  
  /** End date (inclusive) */
  endDate: Date;
  
  /** Current status */
  status: FiscalPeriodStatus;
  
  /** Whether adjusting entries are allowed (even when closed) */
  allowAdjustments: boolean;
  
  /** Sequential period number within the fiscal year (1-12 for months) */
  periodNumber: number;
  
  /** Fiscal year this period belongs to */
  fiscalYearId: string;
  
  /** Fiscal year label (e.g., "2025") */
  fiscalYearLabel: string;
  
  /** When the period was opened */
  openedAt: Date | null;
  openedBy: string | null;
  
  /** When the period was closed */
  closedAt: Date | null;
  closedBy: string | null;
  
  /** When the period was locked */
  lockedAt: Date | null;
  lockedBy: string | null;
  
  /** Reason for last status change */
  statusChangeReason: string | null;
  
  createdAt: Date;
  updatedAt: Date;
}

/** A fiscal year containing quarters and months */
interface FiscalYear {
  id: string;
  ventureId: string;
  label: string;
  startDate: Date;
  endDate: Date;
  status: FiscalPeriodStatus;
  quarters: FiscalQuarter[];
  createdAt: Date;
}

/** A fiscal quarter containing months */
interface FiscalQuarter {
  id: string;
  fiscalYearId: string;
  quarterNumber: number;  // 1-4
  startDate: Date;
  endDate: Date;
  status: FiscalPeriodStatus;
  months: FiscalMonth[];
}

/** A fiscal month — the finest granularity for posting */
interface FiscalMonth {
  id: string;
  fiscalQuarterId: string;
  monthNumber: number;  // 1-12
  startDate: Date;
  endDate: Date;
  status: FiscalPeriodStatus;
}

/** Input for creating a fiscal year */
interface CreateFiscalYearInput {
  ventureId: string;
  
  /** Start date of the fiscal year (e.g., 2025-01-01 or 2025-04-01 for April start) */
  startDate: Date;
  
  /** Label for the fiscal year (e.g., "FY2025") */
  label: string;
  
  /** Whether to auto-open the first month */
  autoOpenFirst?: boolean;
}
```

### FinancialStatement

```typescript
/** Types of financial statements */
type StatementType = 'income_statement' | 'balance_sheet' | 'cash_flow';

/** Base interface for all financial statements */
interface FinancialStatement {
  /** Unique identifier for this generated statement */
  id: string;
  
  /** Venture this statement is for */
  ventureId: string;
  
  /** Statement type */
  type: StatementType;
  
  /** Title of the statement */
  title: string;
  
  /** Period start (for income statement / cash flow) */
  periodStart: Date;
  
  /** Period end / as-of date (for balance sheet) */
  periodEnd: Date;
  
  /** Fiscal period ID */
  fiscalPeriodId: string | null;
  
  /** Currency */
  currencyCode: CurrencyCode;
  
  /** When this statement was generated */
  generatedAt: Date;
  
  /** Whether this is a draft or finalized statement */
  isDraft: boolean;
  
  /** Comparative period data (if requested) */
  comparativePeriod: FinancialStatement | null;
}

/** Income Statement (Profit & Loss) */
interface IncomeStatement extends FinancialStatement {
  type: 'income_statement';
  
  /** Revenue section */
  revenue: StatementSection;
  
  /** Cost of goods sold */
  costOfGoodsSold: StatementSection;
  
  /** Gross profit (revenue - COGS) */
  grossProfit: number;
  
  /** Gross profit margin percentage */
  grossProfitMargin: number;
  
  /** Operating expenses section */
  operatingExpenses: StatementSection;
  
  /** Operating income (gross profit - operating expenses) */
  operatingIncome: number;
  
  /** Other income section */
  otherIncome: StatementSection;
  
  /** Other expenses section */
  otherExpenses: StatementSection;
  
  /** Income before tax */
  incomeBeforeTax: number;
  
  /** Tax expense */
  taxExpense: number;
  
  /** Net income (bottom line) */
  netIncome: number;
  
  /** Net income margin percentage */
  netIncomeMargin: number;
}

/** Balance Sheet */
interface BalanceSheet extends FinancialStatement {
  type: 'balance_sheet';
  
  /** Assets section */
  assets: BalanceSheetSection;
  
  /** Liabilities section */
  liabilities: BalanceSheetSection;
  
  /** Equity section */
  equity: BalanceSheetSection;
  
  /** Total assets */
  totalAssets: number;
  
  /** Total liabilities */
  totalLiabilities: number;
  
  /** Total equity */
  totalEquity: number;
  
  /** Total liabilities + equity (should equal total assets) */
  totalLiabilitiesAndEquity: number;
  
  /** Whether the balance sheet balances (assets = liabilities + equity) */
  isBalanced: boolean;
}

/** Cash Flow Statement */
interface CashFlowStatement extends FinancialStatement {
  type: 'cash_flow';
  
  /** Cash flows from operating activities */
  operatingActivities: CashFlowSection;
  
  /** Cash flows from investing activities */
  investingActivities: CashFlowSection;
  
  /** Cash flows from financing activities */
  financingActivities: CashFlowSection;
  
  /** Net increase/decrease in cash */
  netCashChange: number;
  
  /** Cash at beginning of period */
  beginningCash: number;
  
  /** Cash at end of period */
  endingCash: number;
  
  /** Effect of exchange rate changes on cash */
  exchangeRateEffect: number;
}

/** A section within a financial statement */
interface StatementSection {
  title: string;
  lineItems: StatementLineItem[];
  subtotals: StatementSubtotal[];
  total: number;
}

/** A line item in a financial statement */
interface StatementLineItem {
  accountId: string;
  accountCode: string;
  label: string;
  amount: number;
  
  /** Comparative period amount (if requested) */
  comparativeAmount: number | null;
  
  /** Change from comparative period */
  change: number | null;
  
  /** Percentage change from comparative period */
  changePercent: number | null;
  
  /** Sub-items (for hierarchical display) */
  children: StatementLineItem[];
  
  /** Depth in hierarchy */
  depth: number;
  
  /** Whether this is a calculated/total line */
  isCalculated: boolean;
}

/** A subtotal within a statement section */
interface StatementSubtotal {
  label: string;
  amount: number;
  comparativeAmount: number | null;
}

/** Balance sheet specific section with subcategories */
interface BalanceSheetSection extends StatementSection {
  /** Current portion */
  current: StatementSection;
  
  /** Non-current / long-term portion */
  nonCurrent: StatementSection;
}

/** Cash flow section */
interface CashFlowSection extends StatementSection {
  /** Net cash provided/used by this activity category */
  netCash: number;
}

/** Options for generating financial statements */
interface StatementOptions {
  /** Start date of the period */
  periodStart: Date;
  
  /** End date of the period */
  periodEnd: Date;
  
  /** Fiscal period ID (alternative to date range) */
  fiscalPeriodId?: string;
  
  /** Include comparative period */
  includeComparative?: boolean;
  
  /** Comparative period type */
  comparativeType?: 'prior_period' | 'prior_year' | 'budget';
  
  /** Whether to include sub-account detail */
  includeDetail?: boolean;
  
  /** Currency for the report */
  currencyCode?: CurrencyCode;
  
  /** Whether this is a draft */
  isDraft?: boolean;
}

/** Options for comparative statements */
interface ComparativeOptions extends StatementOptions {
  /** Number of periods to compare */
  numberOfPeriods: number;
  
  /** Granularity of comparison */
  granularity: 'month' | 'quarter' | 'year';
}
```

### RecurringJournal

```typescript
/** Frequency for recurring journals */
type RecurrenceFrequency =
  | 'daily'
  | 'weekly'
  | 'biweekly'
  | 'monthly'
  | 'quarterly'
  | 'semiannually'
  | 'annually';

/** Status of a recurring journal */
type RecurringJournalStatus = 'active' | 'paused' | 'completed' | 'expired';

/** A template for recurring journal entries */
interface RecurringJournal {
  /** Unique identifier */
  id: string;
  
  /** Venture this recurring journal belongs to */
  ventureId: string;
  
  /** Template name (e.g., "Monthly Rent", "Depreciation - Equipment") */
  name: string;
  
  /** Description */
  description: string;
  
  /** Current status */
  status: RecurringJournalStatus;
  
  /** Recurrence schedule */
  schedule: RecurrenceSchedule;
  
  /** Template lines to generate on each occurrence */
  templateLines: RecurringJournalTemplateLine[];
  
  /** Journal entry type for generated entries */
  entryType: JournalEntryType;
  
  /** Whether generated entries should auto-post */
  autoPost: boolean;
  
  /** Source identifier stamped on generated entries */
  source: string;
  
  /** Last date an entry was generated */
  lastGeneratedDate: Date | null;
  
  /** Next scheduled generation date */
  nextGenerationDate: Date;
  
  /** Total number of entries generated so far */
  totalGenerated: number;
  
  /** Tags to apply to generated entries */
  tags: string[];
  
  /** Metadata */
  metadata: Record<string, unknown>;
  
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
}

/** Recurrence schedule details */
interface RecurrenceSchedule {
  /** How often to recur */
  frequency: RecurrenceFrequency;
  
  /** Interval (e.g., every 2 months — frequency: monthly, interval: 2) */
  interval: number;
  
  /** Day of month for monthly/quarterly/annual (1-31, "last" for month-end) */
  dayOfMonth: number | 'last';
  
  /** Day of week for weekly/biweekly (0=Sun, 6=Sat) */
  dayOfWeek?: number;
  
  /** Start date (first possible generation date) */
  startDate: Date;
  
  /** End date (null = indefinite) */
  endDate: Date | null;
  
  /** Maximum number of occurrences (null = unlimited) */
  maxOccurrences: number | null;
}

/** A template line for recurring journal generation */
interface RecurringJournalTemplateLine {
  lineNumber: number;
  accountId: string;
  
  /** Fixed debit amount (or null if calculated) */
  debitAmount: number | null;
  
  /** Fixed credit amount (or null if calculated) */
  creditAmount: number | null;
  
  /** Formula for dynamic amount calculation (e.g., for depreciation) */
  amountFormula: string | null;
  
  /** Description template (supports {{date}}, {{period}}, etc.) */
  descriptionTemplate: string;
  
  dimensions: JournalLineDimension[];
  costCenterId: string | null;
}
```

### Reconciliation

```typescript
/** Status of a reconciliation session */
type ReconciliationStatus = 'in_progress' | 'completed' | 'abandoned';

/** Status of a reconciliation match */
type MatchStatus = 'matched' | 'unmatched' | 'partial' | 'disputed';

/** Match confidence level */
type MatchConfidence = 'exact' | 'high' | 'medium' | 'low' | 'manual';

/** A bank reconciliation session */
interface ReconciliationSession {
  /** Unique identifier */
  id: string;
  
  /** Venture this session belongs to */
  ventureId: string;
  
  /** The bank/cash account being reconciled */
  accountId: string;
  
  /** Session status */
  status: ReconciliationStatus;
  
  /** Statement date being reconciled */
  statementDate: Date;
  
  /** Opening balance per bank statement */
  statementOpeningBalance: number;
  
  /** Closing balance per bank statement */
  statementClosingBalance: number;
  
  /** Book balance at statement date */
  bookBalance: number;
  
  /** Reconciled balance (matched items) */
  reconciledBalance: number;
  
  /** Unreconciled difference */
  unreconciledDifference: number;
  
  /** Total matched transactions */
  matchedCount: number;
  
  /** Total unmatched bank statement lines */
  unmatchedBankLines: number;
  
  /** Total unmatched book entries */
  unmatchedBookEntries: number;
  
  /** Import source for the bank statement */
  importSource: string | null;
  
  /** Associated bank statement */
  bankStatementId: string | null;
  
  /** When the session was started */
  startedAt: Date;
  startedBy: string;
  
  /** When the session was completed */
  completedAt: Date | null;
  completedBy: string | null;
  
  /** Notes */
  notes: string | null;
}

/** A match between bank statement line(s) and ledger posting(s) */
interface ReconciliationMatch {
  id: string;
  sessionId: string;
  
  /** Bank statement line IDs in this match */
  bankStatementLineIds: string[];
  
  /** Ledger posting IDs in this match */
  ledgerPostingIds: string[];
  
  /** Match status */
  status: MatchStatus;
  
  /** Confidence level of the match */
  confidence: MatchConfidence;
  
  /** Match method */
  method: 'auto' | 'manual' | 'rule';
  
  /** Bank amount (sum of matched bank lines) */
  bankAmount: number;
  
  /** Book amount (sum of matched ledger postings) */
  bookAmount: number;
  
  /** Difference between bank and book amounts */
  difference: number;
  
  /** Rule that produced this match (if rule-based) */
  matchRule: string | null;
  
  /** Notes */
  notes: string | null;
  
  matchedAt: Date;
  matchedBy: string;
}

/** An imported bank statement */
interface BankStatement {
  id: string;
  sessionId: string;
  ventureId: string;
  accountId: string;
  
  /** Bank name */
  bankName: string;
  
  /** Account number (masked) */
  accountNumber: string;
  
  /** Statement period start */
  periodStart: Date;
  
  /** Statement period end */
  periodEnd: Date;
  
  /** Opening balance */
  openingBalance: number;
  
  /** Closing balance */
  closingBalance: number;
  
  /** Currency */
  currencyCode: CurrencyCode;
  
  /** Individual transaction lines */
  lines: BankStatementLine[];
  
  /** Import format (CSV, OFX, MT940, etc.) */
  importFormat: string;
  
  /** Raw file reference */
  rawFileRef: string | null;
  
  importedAt: Date;
  importedBy: string;
}

/** A single line in a bank statement */
interface BankStatementLine {
  id: string;
  bankStatementId: string;
  lineNumber: number;
  
  /** Transaction date */
  transactionDate: Date;
  
  /** Value date (settlement date) */
  valueDate: Date | null;
  
  /** Description from bank */
  description: string;
  
  /** Bank reference number */
  reference: string | null;
  
  /** Transaction type from bank */
  transactionType: string | null;
  
  /** Amount (positive = deposit, negative = withdrawal) */
  amount: number;
  
  /** Running balance (if provided by bank) */
  runningBalance: number | null;
  
  /** Whether this line has been matched */
  isMatched: boolean;
  
  /** Match ID (if matched) */
  matchId: string | null;
}
```

### Multi-Currency

```typescript
/** ISO 4217 currency code */
type CurrencyCode = string; // e.g., "USD", "EUR", "GBP", "CAD", "JPY"

/** An exchange rate record */
interface ExchangeRate {
  id: string;
  
  /** Source currency */
  fromCurrency: CurrencyCode;
  
  /** Target currency */
  toCurrency: CurrencyCode;
  
  /** Exchange rate (1 unit of fromCurrency = rate units of toCurrency) */
  rate: number;
  
  /** Inverse rate */
  inverseRate: number;
  
  /** Rate effective date */
  effectiveDate: Date;
  
  /** Rate source (e.g., "ecb", "openexchangerates", "manual") */
  source: string;
  
  /** Rate type */
  rateType: 'spot' | 'average' | 'closing' | 'manual';
  
  createdAt: Date;
}

/** FX gain or loss record */
interface FxGainLoss {
  id: string;
  ventureId: string;
  
  /** Type of gain/loss */
  type: 'realized' | 'unrealized';
  
  /** Account that holds the foreign currency */
  accountId: string;
  
  /** Original transaction currency */
  foreignCurrency: CurrencyCode;
  
  /** Base/functional currency */
  baseCurrency: CurrencyCode;
  
  /** Foreign amount */
  foreignAmount: number;
  
  /** Original base amount (at historical rate) */
  originalBaseAmount: number;
  
  /** Current/settlement base amount (at current/settlement rate) */
  currentBaseAmount: number;
  
  /** Gain or loss amount in base currency (positive = gain, negative = loss) */
  gainLossAmount: number;
  
  /** Historical exchange rate */
  historicalRate: number;
  
  /** Current/settlement exchange rate */
  currentRate: number;
  
  /** Associated journal entry ID (if posted) */
  journalEntryId: string | null;
  
  /** Calculation date */
  calculatedAt: Date;
  
  /** Fiscal period */
  fiscalPeriodId: string;
}

/** Result of a currency revaluation run */
interface RevaluationResult {
  ventureId: string;
  fiscalPeriodId: string;
  revaluationDate: Date;
  baseCurrency: CurrencyCode;
  
  /** Individual account revaluation details */
  accountRevaluations: AccountRevaluation[];
  
  /** Total unrealized gain */
  totalUnrealizedGain: number;
  
  /** Total unrealized loss */
  totalUnrealizedLoss: number;
  
  /** Net unrealized gain/loss */
  netUnrealizedGainLoss: number;
  
  /** Journal entry created for the revaluation */
  journalEntryId: string;
  
  /** Exchange rates used */
  ratesUsed: ExchangeRate[];
  
  performedAt: Date;
  performedBy: string;
}

/** Revaluation detail for a single account */
interface AccountRevaluation {
  accountId: string;
  accountCode: string;
  accountName: string;
  foreignCurrency: CurrencyCode;
  foreignBalance: number;
  historicalBaseAmount: number;
  revaluedBaseAmount: number;
  unrealizedGainLoss: number;
  historicalRate: number;
  revaluationRate: number;
}

/** Options for performing revaluation */
interface RevaluationOptions {
  /** Date of revaluation */
  asOfDate: Date;
  
  /** Fiscal period */
  fiscalPeriodId: string;
  
  /** Specific currencies to revalue (null = all) */
  currencies?: CurrencyCode[];
  
  /** Specific accounts to revalue (null = all multi-currency accounts) */
  accountIds?: string[];
  
  /** Account to post unrealized gain/loss to */
  gainLossAccountId: string;
  
  /** Whether to auto-post the revaluation entry */
  autoPost?: boolean;
  
  /** Whether to reverse the previous revaluation first */
  reversePrevious?: boolean;
}
```

### AuditTrail

```typescript
/** Types of auditable actions */
type AuditAction =
  | 'account.created'
  | 'account.updated'
  | 'account.deactivated'
  | 'account.reactivated'
  | 'journal.created'
  | 'journal.updated'
  | 'journal.posted'
  | 'journal.reversed'
  | 'journal.voided'
  | 'journal.approved'
  | 'period.opened'
  | 'period.closed'
  | 'period.locked'
  | 'period.reopened'
  | 'reconciliation.started'
  | 'reconciliation.completed'
  | 'reconciliation.abandoned'
  | 'revaluation.performed'
  | 'statement.generated'
  | 'recurring.created'
  | 'recurring.generated'
  | 'recurring.paused'
  | 'balance.snapshot';

/** An immutable audit log entry */
interface AuditLogEntry {
  /** Unique identifier */
  id: string;
  
  /** Venture this log entry belongs to */
  ventureId: string;
  
  /** Action that was performed */
  action: AuditAction;
  
  /** Entity type (e.g., "journal_entry", "account", "fiscal_period") */
  entityType: string;
  
  /** Entity ID */
  entityId: string;
  
  /** Entity display reference (e.g., journal entry number) */
  entityRef: string | null;
  
  /** Who performed the action */
  actorId: string;
  
  /** Actor type (user, system, api) */
  actorType: 'user' | 'system' | 'api';
  
  /** Human-readable description of what happened */
  description: string;
  
  /** Previous state (for updates) */
  previousState: Record<string, unknown> | null;
  
  /** New state (after the action) */
  newState: Record<string, unknown> | null;
  
  /** Changed fields with before/after values */
  changes: AuditChange[] | null;
  
  /** Contextual information */
  context: AuditContext;
  
  /** Hash of this entry (for integrity verification) */
  entryHash: string;
  
  /** Hash of the previous entry (chain link) */
  previousHash: string | null;
  
  /** Sequence number within the venture (monotonically increasing) */
  sequenceNumber: number;
  
  /** When the action occurred */
  occurredAt: Date;
  
  /** When the log entry was written (may differ slightly) */
  createdAt: Date;
}

/** A single field change within an audit log entry */
interface AuditChange {
  field: string;
  previousValue: unknown;
  newValue: unknown;
}

/** Contextual information for an audit log entry */
interface AuditContext {
  /** IP address of the actor */
  ipAddress: string | null;
  
  /** User agent string */
  userAgent: string | null;
  
  /** API endpoint or tRPC procedure that triggered the action */
  endpoint: string | null;
  
  /** Request/correlation ID for tracing */
  correlationId: string | null;
  
  /** Session ID */
  sessionId: string | null;
  
  /** Fiscal period at time of action */
  fiscalPeriodId: string | null;
  
  /** Additional context */
  extra: Record<string, unknown>;
}

/** Options for querying the audit trail */
interface AuditQueryOptions {
  /** Filter by action type(s) */
  actions?: AuditAction[];
  
  /** Filter by entity type */
  entityType?: string;
  
  /** Filter by entity ID */
  entityId?: string;
  
  /** Filter by actor ID */
  actorId?: string;
  
  /** Date range start */
  from?: Date;
  
  /** Date range end */
  to?: Date;
  
  /** Search in description */
  search?: string;
  
  /** Pagination */
  cursor?: string;
  limit?: number;
  
  /** Sort order */
  sortOrder?: 'asc' | 'desc';
}

/** Result of an audit integrity verification */
interface AuditIntegrityReport {
  ventureId: string;
  totalEntries: number;
  verifiedEntries: number;
  brokenChainAt: number | null;
  isIntact: boolean;
  issues: AuditIntegrityIssue[];
  verifiedAt: Date;
}

/** An integrity issue found during verification */
interface AuditIntegrityIssue {
  sequenceNumber: number;
  entryId: string;
  issue: 'hash_mismatch' | 'chain_break' | 'missing_entry' | 'duplicate_sequence';
  details: string;
}
```

---

## Database Schemas

### accounts

The chart of accounts table stores the hierarchical account structure for each venture.

```sql
CREATE TABLE accounts (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  venture_id      UUID NOT NULL REFERENCES ventures(id),
  
  -- Identity
  code            TEXT NOT NULL,
  name            TEXT NOT NULL,
  description     TEXT,
  
  -- Classification
  type            TEXT NOT NULL CHECK (type IN ('asset', 'liability', 'equity', 'revenue', 'expense')),
  sub_type        TEXT NOT NULL,
  normal_balance  TEXT NOT NULL CHECK (normal_balance IN ('debit', 'credit')),
  
  -- Hierarchy
  parent_id       UUID REFERENCES accounts(id),
  depth           INT NOT NULL DEFAULT 0,
  path            TEXT NOT NULL,  -- Materialized path: "assets.current.cash"
  
  -- Flags
  is_detail       BOOLEAN NOT NULL DEFAULT true,
  is_contra       BOOLEAN NOT NULL DEFAULT false,
  is_active       BOOLEAN NOT NULL DEFAULT true,
  is_system       BOOLEAN NOT NULL DEFAULT false,
  
  -- Currency
  currency_code   TEXT,  -- NULL = venture's base currency
  is_multi_currency BOOLEAN NOT NULL DEFAULT false,
  
  -- References
  tax_code        TEXT,
  bank_account_number TEXT,
  
  -- Metadata
  tags            TEXT[] NOT NULL DEFAULT '{}',
  metadata        JSONB NOT NULL DEFAULT '{}',
  
  -- Timestamps
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by      UUID NOT NULL REFERENCES users(id),
  updated_by      UUID NOT NULL REFERENCES users(id),
  
  -- Constraints
  UNIQUE (venture_id, code),
  CHECK (depth >= 0),
  CHECK (
    (parent_id IS NULL AND depth = 0) OR
    (parent_id IS NOT NULL AND depth > 0)
  )
);

-- Indexes
CREATE INDEX idx_accounts_venture ON accounts(venture_id);
CREATE INDEX idx_accounts_venture_type ON accounts(venture_id, type);
CREATE INDEX idx_accounts_parent ON accounts(parent_id);
CREATE INDEX idx_accounts_path ON accounts(venture_id, path);
CREATE INDEX idx_accounts_code ON accounts(venture_id, code);
CREATE INDEX idx_accounts_active ON accounts(venture_id, is_active) WHERE is_active = true;
CREATE INDEX idx_accounts_tags ON accounts USING GIN(tags);

-- RLS
ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;
CREATE POLICY accounts_venture_isolation ON accounts
  USING (venture_id = current_setting('app.current_venture_id')::UUID);
```

### journal_entries

The master journal entry table. Each entry must have lines that sum to zero (debits = credits).

```sql
CREATE TABLE journal_entries (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  venture_id          UUID NOT NULL REFERENCES ventures(id),
  
  -- Identity
  entry_number        TEXT NOT NULL,  -- Sequential, human-readable: "JE-2025-00001"
  type                TEXT NOT NULL DEFAULT 'standard' CHECK (type IN (
                        'standard', 'adjusting', 'closing', 'reversing',
                        'recurring', 'revaluation', 'opening', 'system'
                      )),
  status              TEXT NOT NULL DEFAULT 'draft' CHECK (status IN (
                        'draft', 'pending', 'approved', 'posted', 'reversed', 'voided'
                      )),
  
  -- Dates
  entry_date          DATE NOT NULL,
  fiscal_period_id    UUID NOT NULL REFERENCES fiscal_periods(id),
  
  -- Description
  description         TEXT NOT NULL,
  reference           TEXT,
  source              TEXT,
  external_ref        TEXT,
  
  -- Totals (denormalized for quick access; enforced by trigger)
  total_debits        NUMERIC(20, 4) NOT NULL DEFAULT 0,
  total_credits       NUMERIC(20, 4) NOT NULL DEFAULT 0,
  
  -- Currency
  currency_code       TEXT NOT NULL DEFAULT 'USD',
  
  -- Reversal chain
  reversal_of_id      UUID REFERENCES journal_entries(id),
  reversed_by_id      UUID REFERENCES journal_entries(id),
  
  -- Recurring
  recurring_journal_id UUID REFERENCES recurring_journals(id),
  
  -- Approval workflow
  approved_by         UUID REFERENCES users(id),
  approved_at         TIMESTAMPTZ,
  
  -- Posting
  posted_by           UUID REFERENCES users(id),
  posted_at           TIMESTAMPTZ,
  
  -- Void
  voided_by           UUID REFERENCES users(id),
  voided_at           TIMESTAMPTZ,
  void_reason         TEXT,
  
  -- Metadata
  tags                TEXT[] NOT NULL DEFAULT '{}',
  attachments         JSONB NOT NULL DEFAULT '[]',
  metadata            JSONB NOT NULL DEFAULT '{}',
  
  -- Timestamps
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by          UUID NOT NULL REFERENCES users(id),
  updated_by          UUID NOT NULL REFERENCES users(id),
  
  -- Constraints
  UNIQUE (venture_id, entry_number),
  CHECK (total_debits = total_credits),
  CHECK (total_debits >= 0)
);

-- Indexes
CREATE INDEX idx_je_venture ON journal_entries(venture_id);
CREATE INDEX idx_je_venture_date ON journal_entries(venture_id, entry_date);
CREATE INDEX idx_je_venture_status ON journal_entries(venture_id, status);
CREATE INDEX idx_je_fiscal_period ON journal_entries(fiscal_period_id);
CREATE INDEX idx_je_entry_number ON journal_entries(venture_id, entry_number);
CREATE INDEX idx_je_reference ON journal_entries(venture_id, reference) WHERE reference IS NOT NULL;
CREATE INDEX idx_je_external_ref ON journal_entries(venture_id, external_ref) WHERE external_ref IS NOT NULL;
CREATE INDEX idx_je_reversal ON journal_entries(reversal_of_id) WHERE reversal_of_id IS NOT NULL;
CREATE INDEX idx_je_recurring ON journal_entries(recurring_journal_id) WHERE recurring_journal_id IS NOT NULL;
CREATE INDEX idx_je_tags ON journal_entries USING GIN(tags);
CREATE INDEX idx_je_posted_date ON journal_entries(venture_id, posted_at) WHERE status = 'posted';

-- RLS
ALTER TABLE journal_entries ENABLE ROW LEVEL SECURITY;
CREATE POLICY je_venture_isolation ON journal_entries
  USING (venture_id = current_setting('app.current_venture_id')::UUID);
```

### journal_entry_lines

Individual debit/credit lines within a journal entry.

```sql
CREATE TABLE journal_entry_lines (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  journal_entry_id    UUID NOT NULL REFERENCES journal_entries(id) ON DELETE CASCADE,
  
  -- Ordering
  line_number         INT NOT NULL,
  
  -- Account
  account_id          UUID NOT NULL REFERENCES accounts(id),
  account_code        TEXT NOT NULL,   -- Denormalized
  account_name        TEXT NOT NULL,   -- Denormalized
  
  -- Amounts (exactly one of debit/credit must be > 0)
  debit_amount        NUMERIC(20, 4) NOT NULL DEFAULT 0,
  credit_amount       NUMERIC(20, 4) NOT NULL DEFAULT 0,
  
  -- Multi-currency
  foreign_amount      NUMERIC(20, 4),
  foreign_currency_code TEXT,
  exchange_rate       NUMERIC(20, 8),
  
  -- Description
  description         TEXT,
  
  -- Dimensions (cost centers, projects, segments)
  dimensions          JSONB NOT NULL DEFAULT '[]',
  
  -- Tax
  tax_code            TEXT,
  tax_amount          NUMERIC(20, 4),
  
  -- References
  cost_center_id      UUID,
  
  -- Metadata
  metadata            JSONB NOT NULL DEFAULT '{}',
  
  -- Constraints
  UNIQUE (journal_entry_id, line_number),
  CHECK (debit_amount >= 0),
  CHECK (credit_amount >= 0),
  CHECK (
    (debit_amount > 0 AND credit_amount = 0) OR
    (debit_amount = 0 AND credit_amount > 0)
  )
);

-- Indexes
CREATE INDEX idx_jel_journal_entry ON journal_entry_lines(journal_entry_id);
CREATE INDEX idx_jel_account ON journal_entry_lines(account_id);
CREATE INDEX idx_jel_cost_center ON journal_entry_lines(cost_center_id) WHERE cost_center_id IS NOT NULL;

-- Trigger to update journal_entries totals
CREATE OR REPLACE FUNCTION update_journal_entry_totals()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE journal_entries
  SET
    total_debits = (SELECT COALESCE(SUM(debit_amount), 0) FROM journal_entry_lines WHERE journal_entry_id = COALESCE(NEW.journal_entry_id, OLD.journal_entry_id)),
    total_credits = (SELECT COALESCE(SUM(credit_amount), 0) FROM journal_entry_lines WHERE journal_entry_id = COALESCE(NEW.journal_entry_id, OLD.journal_entry_id)),
    updated_at = now()
  WHERE id = COALESCE(NEW.journal_entry_id, OLD.journal_entry_id);
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_update_je_totals
  AFTER INSERT OR UPDATE OR DELETE ON journal_entry_lines
  FOR EACH ROW EXECUTE FUNCTION update_journal_entry_totals();
```

### ledger_postings

The actual ledger postings created when a journal entry is posted. This is the general ledger.

```sql
CREATE TABLE ledger_postings (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  venture_id          UUID NOT NULL REFERENCES ventures(id),
  
  -- Source
  journal_entry_id    UUID NOT NULL REFERENCES journal_entries(id),
  journal_entry_line_id UUID NOT NULL REFERENCES journal_entry_lines(id),
  
  -- Account
  account_id          UUID NOT NULL REFERENCES accounts(id),
  
  -- Posting details
  posting_date        DATE NOT NULL,
  fiscal_period_id    UUID NOT NULL REFERENCES fiscal_periods(id),
  
  -- Amounts
  debit_amount        NUMERIC(20, 4) NOT NULL DEFAULT 0,
  credit_amount       NUMERIC(20, 4) NOT NULL DEFAULT 0,
  
  -- Running balance (calculated at posting time)
  running_balance     NUMERIC(20, 4) NOT NULL,
  
  -- Multi-currency
  foreign_amount      NUMERIC(20, 4),
  foreign_currency_code TEXT,
  exchange_rate       NUMERIC(20, 8),
  
  -- Description (denormalized from journal entry)
  description         TEXT NOT NULL,
  reference           TEXT,
  
  -- Metadata
  metadata            JSONB NOT NULL DEFAULT '{}',
  
  -- Timestamps
  posted_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  -- Constraints
  CHECK (debit_amount >= 0),
  CHECK (credit_amount >= 0),
  CHECK (
    (debit_amount > 0 AND credit_amount = 0) OR
    (debit_amount = 0 AND credit_amount > 0)
  )
);

-- Indexes
CREATE INDEX idx_lp_venture ON ledger_postings(venture_id);
CREATE INDEX idx_lp_account ON ledger_postings(account_id);
CREATE INDEX idx_lp_account_date ON ledger_postings(account_id, posting_date);
CREATE INDEX idx_lp_journal_entry ON ledger_postings(journal_entry_id);
CREATE INDEX idx_lp_fiscal_period ON ledger_postings(fiscal_period_id);
CREATE INDEX idx_lp_posting_date ON ledger_postings(venture_id, posting_date);
CREATE INDEX idx_lp_account_period ON ledger_postings(account_id, fiscal_period_id);

-- RLS
ALTER TABLE ledger_postings ENABLE ROW LEVEL SECURITY;
CREATE POLICY lp_venture_isolation ON ledger_postings
  USING (venture_id = current_setting('app.current_venture_id')::UUID);
```

### account_balances

Cached account balances. Updated in real-time by triggers and periodic snapshot jobs.

```sql
CREATE TABLE account_balances (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  venture_id          UUID NOT NULL REFERENCES ventures(id),
  account_id          UUID NOT NULL REFERENCES accounts(id),
  
  -- Period (NULL = current/running balance)
  fiscal_period_id    UUID REFERENCES fiscal_periods(id),
  
  -- Balance type
  balance_type        TEXT NOT NULL CHECK (balance_type IN ('current', 'opening', 'closing', 'snapshot')),
  
  -- Amounts
  debit_total         NUMERIC(20, 4) NOT NULL DEFAULT 0,
  credit_total        NUMERIC(20, 4) NOT NULL DEFAULT 0,
  net_balance         NUMERIC(20, 4) NOT NULL DEFAULT 0,
  
  -- Multi-currency (if applicable)
  foreign_debit_total  NUMERIC(20, 4),
  foreign_credit_total NUMERIC(20, 4),
  foreign_net_balance  NUMERIC(20, 4),
  foreign_currency_code TEXT,
  
  -- Snapshot metadata
  snapshot_date       DATE,
  
  -- Timestamps
  calculated_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  -- Constraints
  UNIQUE (account_id, fiscal_period_id, balance_type)
);

-- Indexes
CREATE INDEX idx_ab_venture ON account_balances(venture_id);
CREATE INDEX idx_ab_account ON account_balances(account_id);
CREATE INDEX idx_ab_account_period ON account_balances(account_id, fiscal_period_id);
CREATE INDEX idx_ab_account_type ON account_balances(account_id, balance_type);
CREATE INDEX idx_ab_snapshot_date ON account_balances(venture_id, snapshot_date) WHERE snapshot_date IS NOT NULL;

-- RLS
ALTER TABLE account_balances ENABLE ROW LEVEL SECURITY;
CREATE POLICY ab_venture_isolation ON account_balances
  USING (venture_id = current_setting('app.current_venture_id')::UUID);

-- Function to update running balance when postings change
CREATE OR REPLACE FUNCTION update_account_balance()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO account_balances (venture_id, account_id, fiscal_period_id, balance_type, debit_total, credit_total, net_balance)
  SELECT
    NEW.venture_id,
    NEW.account_id,
    NEW.fiscal_period_id,
    'current',
    COALESCE(SUM(debit_amount), 0),
    COALESCE(SUM(credit_amount), 0),
    COALESCE(SUM(debit_amount), 0) - COALESCE(SUM(credit_amount), 0)
  FROM ledger_postings
  WHERE account_id = NEW.account_id
    AND fiscal_period_id = NEW.fiscal_period_id
  ON CONFLICT (account_id, fiscal_period_id, balance_type)
  DO UPDATE SET
    debit_total = EXCLUDED.debit_total,
    credit_total = EXCLUDED.credit_total,
    net_balance = EXCLUDED.net_balance,
    calculated_at = now(),
    updated_at = now();
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_update_account_balance
  AFTER INSERT ON ledger_postings
  FOR EACH ROW EXECUTE FUNCTION update_account_balance();
```

### fiscal_periods

Fiscal period hierarchy: years → quarters → months.

```sql
CREATE TABLE fiscal_periods (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  venture_id          UUID NOT NULL REFERENCES ventures(id),
  
  -- Identity
  name                TEXT NOT NULL,       -- "FY2025", "Q1 2025", "January 2025"
  granularity         TEXT NOT NULL CHECK (granularity IN ('year', 'quarter', 'month')),
  
  -- Hierarchy
  parent_period_id    UUID REFERENCES fiscal_periods(id),
  fiscal_year_id      UUID NOT NULL,       -- Self-reference for year, FK for sub-periods
  fiscal_year_label   TEXT NOT NULL,
  
  -- Dates
  start_date          DATE NOT NULL,
  end_date            DATE NOT NULL,
  
  -- Status
  status              TEXT NOT NULL DEFAULT 'future' CHECK (status IN ('future', 'open', 'closed', 'locked')),
  allow_adjustments   BOOLEAN NOT NULL DEFAULT true,
  
  -- Ordering
  period_number       INT NOT NULL,  -- 1-4 for quarters, 1-12 for months
  
  -- Status change tracking
  opened_at           TIMESTAMPTZ,
  opened_by           UUID REFERENCES users(id),
  closed_at           TIMESTAMPTZ,
  closed_by           UUID REFERENCES users(id),
  locked_at           TIMESTAMPTZ,
  locked_by           UUID REFERENCES users(id),
  status_change_reason TEXT,
  
  -- Timestamps
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  -- Constraints
  UNIQUE (venture_id, name),
  CHECK (start_date <= end_date),
  CHECK (period_number > 0)
);

-- Indexes
CREATE INDEX idx_fp_venture ON fiscal_periods(venture_id);
CREATE INDEX idx_fp_venture_dates ON fiscal_periods(venture_id, start_date, end_date);
CREATE INDEX idx_fp_venture_status ON fiscal_periods(venture_id, status);
CREATE INDEX idx_fp_parent ON fiscal_periods(parent_period_id);
CREATE INDEX idx_fp_fiscal_year ON fiscal_periods(fiscal_year_id);
CREATE INDEX idx_fp_venture_granularity ON fiscal_periods(venture_id, granularity);

-- RLS
ALTER TABLE fiscal_periods ENABLE ROW LEVEL SECURITY;
CREATE POLICY fp_venture_isolation ON fiscal_periods
  USING (venture_id = current_setting('app.current_venture_id')::UUID);

-- Trigger to prevent posting to closed/locked periods
CREATE OR REPLACE FUNCTION check_period_open()
RETURNS TRIGGER AS $$
DECLARE
  period_status TEXT;
  period_adjustable BOOLEAN;
BEGIN
  SELECT status, allow_adjustments
  INTO period_status, period_adjustable
  FROM fiscal_periods
  WHERE id = NEW.fiscal_period_id;
  
  IF period_status = 'locked' THEN
    RAISE EXCEPTION 'Cannot post to locked fiscal period'
      USING ERRCODE = 'P0001';
  END IF;
  
  IF period_status = 'closed' AND NOT period_adjustable THEN
    RAISE EXCEPTION 'Cannot post to closed fiscal period (adjustments not allowed)'
      USING ERRCODE = 'P0002';
  END IF;
  
  IF period_status = 'future' THEN
    RAISE EXCEPTION 'Cannot post to a future fiscal period that has not been opened'
      USING ERRCODE = 'P0003';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_check_period_open
  BEFORE INSERT ON ledger_postings
  FOR EACH ROW EXECUTE FUNCTION check_period_open();
```

### recurring_journals

Templates for recurring journal entries.

```sql
CREATE TABLE recurring_journals (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  venture_id          UUID NOT NULL REFERENCES ventures(id),
  
  -- Identity
  name                TEXT NOT NULL,
  description         TEXT,
  
  -- Status
  status              TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused', 'completed', 'expired')),
  
  -- Schedule
  frequency           TEXT NOT NULL CHECK (frequency IN (
                        'daily', 'weekly', 'biweekly', 'monthly',
                        'quarterly', 'semiannually', 'annually'
                      )),
  interval            INT NOT NULL DEFAULT 1,
  day_of_month        TEXT,   -- "1"-"31" or "last"
  day_of_week         INT,    -- 0-6 (Sun-Sat)
  start_date          DATE NOT NULL,
  end_date            DATE,
  max_occurrences     INT,
  
  -- Template
  template_lines      JSONB NOT NULL,   -- Array of template line definitions
  entry_type          TEXT NOT NULL DEFAULT 'recurring',
  auto_post           BOOLEAN NOT NULL DEFAULT false,
  source              TEXT NOT NULL DEFAULT 'recurring',
  
  -- State
  last_generated_date DATE,
  next_generation_date DATE NOT NULL,
  total_generated     INT NOT NULL DEFAULT 0,
  
  -- Metadata
  tags                TEXT[] NOT NULL DEFAULT '{}',
  metadata            JSONB NOT NULL DEFAULT '{}',
  
  -- Timestamps
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by          UUID NOT NULL REFERENCES users(id),
  
  -- Constraints
  CHECK (interval > 0),
  CHECK (max_occurrences IS NULL OR max_occurrences > 0)
);

-- Indexes
CREATE INDEX idx_rj_venture ON recurring_journals(venture_id);
CREATE INDEX idx_rj_venture_status ON recurring_journals(venture_id, status);
CREATE INDEX idx_rj_next_gen ON recurring_journals(next_generation_date) WHERE status = 'active';

-- RLS
ALTER TABLE recurring_journals ENABLE ROW LEVEL SECURITY;
CREATE POLICY rj_venture_isolation ON recurring_journals
  USING (venture_id = current_setting('app.current_venture_id')::UUID);
```

### reconciliation_sessions

Bank reconciliation tracking.

```sql
CREATE TABLE reconciliation_sessions (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  venture_id              UUID NOT NULL REFERENCES ventures(id),
  account_id              UUID NOT NULL REFERENCES accounts(id),
  
  -- Status
  status                  TEXT NOT NULL DEFAULT 'in_progress' CHECK (status IN (
                            'in_progress', 'completed', 'abandoned'
                          )),
  
  -- Statement info
  statement_date          DATE NOT NULL,
  statement_opening_balance NUMERIC(20, 4) NOT NULL,
  statement_closing_balance NUMERIC(20, 4) NOT NULL,
  
  -- Book vs bank
  book_balance            NUMERIC(20, 4) NOT NULL,
  reconciled_balance      NUMERIC(20, 4) NOT NULL DEFAULT 0,
  unreconciled_difference NUMERIC(20, 4) NOT NULL DEFAULT 0,
  
  -- Match statistics
  matched_count           INT NOT NULL DEFAULT 0,
  unmatched_bank_lines    INT NOT NULL DEFAULT 0,
  unmatched_book_entries  INT NOT NULL DEFAULT 0,
  
  -- Import
  import_source           TEXT,
  bank_statement_id       UUID,
  
  -- Lifecycle
  started_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
  started_by              UUID NOT NULL REFERENCES users(id),
  completed_at            TIMESTAMPTZ,
  completed_by            UUID REFERENCES users(id),
  
  -- Notes
  notes                   TEXT,
  
  -- Timestamps
  created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_rs_venture ON reconciliation_sessions(venture_id);
CREATE INDEX idx_rs_account ON reconciliation_sessions(account_id);
CREATE INDEX idx_rs_status ON reconciliation_sessions(venture_id, status);
CREATE INDEX idx_rs_statement_date ON reconciliation_sessions(account_id, statement_date);

-- RLS
ALTER TABLE reconciliation_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY rs_venture_isolation ON reconciliation_sessions
  USING (venture_id = current_setting('app.current_venture_id')::UUID);
```

### bank_statements

Imported bank statements for reconciliation.

```sql
CREATE TABLE bank_statements (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id          UUID NOT NULL REFERENCES reconciliation_sessions(id),
  venture_id          UUID NOT NULL REFERENCES ventures(id),
  account_id          UUID NOT NULL REFERENCES accounts(id),
  
  -- Bank info
  bank_name           TEXT NOT NULL,
  account_number      TEXT NOT NULL,  -- Masked
  
  -- Period
  period_start        DATE NOT NULL,
  period_end          DATE NOT NULL,
  
  -- Balances
  opening_balance     NUMERIC(20, 4) NOT NULL,
  closing_balance     NUMERIC(20, 4) NOT NULL,
  
  -- Currency
  currency_code       TEXT NOT NULL,
  
  -- Import
  import_format       TEXT NOT NULL,  -- 'csv', 'ofx', 'mt940', 'qfx', 'camt053'
  raw_file_ref        TEXT,
  
  -- Timestamps
  imported_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
  imported_by         UUID NOT NULL REFERENCES users(id)
);

CREATE TABLE bank_statement_lines (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bank_statement_id   UUID NOT NULL REFERENCES bank_statements(id) ON DELETE CASCADE,
  line_number         INT NOT NULL,
  
  -- Transaction
  transaction_date    DATE NOT NULL,
  value_date          DATE,
  description         TEXT NOT NULL,
  reference           TEXT,
  transaction_type    TEXT,
  
  -- Amount
  amount              NUMERIC(20, 4) NOT NULL,  -- Positive = deposit, negative = withdrawal
  running_balance     NUMERIC(20, 4),
  
  -- Match status
  is_matched          BOOLEAN NOT NULL DEFAULT false,
  match_id            UUID,
  
  -- Constraints
  UNIQUE (bank_statement_id, line_number)
);

-- Indexes
CREATE INDEX idx_bsl_statement ON bank_statement_lines(bank_statement_id);
CREATE INDEX idx_bsl_date ON bank_statement_lines(transaction_date);
CREATE INDEX idx_bsl_matched ON bank_statement_lines(is_matched);
CREATE INDEX idx_bsl_match ON bank_statement_lines(match_id) WHERE match_id IS NOT NULL;
```

### reconciliation_matches

Matched pairs between bank statement lines and ledger postings.

```sql
CREATE TABLE reconciliation_matches (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id          UUID NOT NULL REFERENCES reconciliation_sessions(id),
  
  -- Matched entities (stored as arrays for many-to-many matching)
  bank_statement_line_ids UUID[] NOT NULL,
  ledger_posting_ids      UUID[] NOT NULL,
  
  -- Match info
  status              TEXT NOT NULL DEFAULT 'matched' CHECK (status IN (
                        'matched', 'unmatched', 'partial', 'disputed'
                      )),
  confidence          TEXT NOT NULL CHECK (confidence IN (
                        'exact', 'high', 'medium', 'low', 'manual'
                      )),
  method              TEXT NOT NULL CHECK (method IN ('auto', 'manual', 'rule')),
  
  -- Amounts
  bank_amount         NUMERIC(20, 4) NOT NULL,
  book_amount         NUMERIC(20, 4) NOT NULL,
  difference          NUMERIC(20, 4) NOT NULL DEFAULT 0,
  
  -- Rule
  match_rule          TEXT,
  
  -- Notes
  notes               TEXT,
  
  -- Timestamps
  matched_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  matched_by          UUID NOT NULL REFERENCES users(id)
);

-- Indexes
CREATE INDEX idx_rm_session ON reconciliation_matches(session_id);
CREATE INDEX idx_rm_status ON reconciliation_matches(session_id, status);
CREATE INDEX idx_rm_bank_lines ON reconciliation_matches USING GIN(bank_statement_line_ids);
CREATE INDEX idx_rm_ledger_postings ON reconciliation_matches USING GIN(ledger_posting_ids);
```

### exchange_rates

Historical exchange rate storage for multi-currency accounting.

```sql
CREATE TABLE exchange_rates (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Currency pair
  from_currency       TEXT NOT NULL,
  to_currency         TEXT NOT NULL,
  
  -- Rate
  rate                NUMERIC(20, 8) NOT NULL,
  inverse_rate        NUMERIC(20, 8) NOT NULL,
  
  -- Effective
  effective_date      DATE NOT NULL,
  
  -- Source
  source              TEXT NOT NULL DEFAULT 'manual',  -- 'ecb', 'openexchangerates', 'manual'
  rate_type           TEXT NOT NULL DEFAULT 'spot' CHECK (rate_type IN ('spot', 'average', 'closing', 'manual')),
  
  -- Timestamps
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  -- Constraints
  UNIQUE (from_currency, to_currency, effective_date, rate_type),
  CHECK (rate > 0),
  CHECK (inverse_rate > 0)
);

-- Indexes
CREATE INDEX idx_er_pair_date ON exchange_rates(from_currency, to_currency, effective_date DESC);
CREATE INDEX idx_er_effective ON exchange_rates(effective_date);
CREATE INDEX idx_er_source ON exchange_rates(source);
```

### fx_gain_losses

Realized and unrealized foreign exchange gains and losses.

```sql
CREATE TABLE fx_gain_losses (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  venture_id          UUID NOT NULL REFERENCES ventures(id),
  
  -- Type
  type                TEXT NOT NULL CHECK (type IN ('realized', 'unrealized')),
  
  -- Account
  account_id          UUID NOT NULL REFERENCES accounts(id),
  
  -- Currencies
  foreign_currency    TEXT NOT NULL,
  base_currency       TEXT NOT NULL,
  
  -- Amounts
  foreign_amount      NUMERIC(20, 4) NOT NULL,
  original_base_amount NUMERIC(20, 4) NOT NULL,
  current_base_amount NUMERIC(20, 4) NOT NULL,
  gain_loss_amount    NUMERIC(20, 4) NOT NULL,
  
  -- Rates
  historical_rate     NUMERIC(20, 8) NOT NULL,
  current_rate        NUMERIC(20, 8) NOT NULL,
  
  -- Reference
  journal_entry_id    UUID REFERENCES journal_entries(id),
  fiscal_period_id    UUID NOT NULL REFERENCES fiscal_periods(id),
  
  -- Timestamps
  calculated_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  -- Constraints
  CHECK (gain_loss_amount = current_base_amount - original_base_amount)
);

-- Indexes
CREATE INDEX idx_fxgl_venture ON fx_gain_losses(venture_id);
CREATE INDEX idx_fxgl_account ON fx_gain_losses(account_id);
CREATE INDEX idx_fxgl_type ON fx_gain_losses(venture_id, type);
CREATE INDEX idx_fxgl_period ON fx_gain_losses(fiscal_period_id);
CREATE INDEX idx_fxgl_journal ON fx_gain_losses(journal_entry_id) WHERE journal_entry_id IS NOT NULL;

-- RLS
ALTER TABLE fx_gain_losses ENABLE ROW LEVEL SECURITY;
CREATE POLICY fxgl_venture_isolation ON fx_gain_losses
  USING (venture_id = current_setting('app.current_venture_id')::UUID);
```

### audit_log

Immutable, append-only audit trail with hash chain for integrity verification.

```sql
CREATE TABLE audit_log (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  venture_id          UUID NOT NULL REFERENCES ventures(id),
  
  -- Action
  action              TEXT NOT NULL,
  entity_type         TEXT NOT NULL,
  entity_id           UUID NOT NULL,
  entity_ref          TEXT,
  
  -- Actor
  actor_id            UUID NOT NULL,
  actor_type          TEXT NOT NULL CHECK (actor_type IN ('user', 'system', 'api')),
  
  -- Description
  description         TEXT NOT NULL,
  
  -- State
  previous_state      JSONB,
  new_state           JSONB,
  changes             JSONB,
  
  -- Context
  context             JSONB NOT NULL DEFAULT '{}',
  
  -- Integrity chain
  entry_hash          TEXT NOT NULL,
  previous_hash       TEXT,
  sequence_number     BIGINT NOT NULL,
  
  -- Timestamps
  occurred_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  -- Constraints
  UNIQUE (venture_id, sequence_number)
) PARTITION BY RANGE (occurred_at);

-- Create yearly partitions
CREATE TABLE audit_log_2024 PARTITION OF audit_log
  FOR VALUES FROM ('2024-01-01') TO ('2025-01-01');
CREATE TABLE audit_log_2025 PARTITION OF audit_log
  FOR VALUES FROM ('2025-01-01') TO ('2026-01-01');
CREATE TABLE audit_log_2026 PARTITION OF audit_log
  FOR VALUES FROM ('2026-01-01') TO ('2027-01-01');

-- Indexes
CREATE INDEX idx_al_venture ON audit_log(venture_id);
CREATE INDEX idx_al_venture_action ON audit_log(venture_id, action);
CREATE INDEX idx_al_entity ON audit_log(entity_type, entity_id);
CREATE INDEX idx_al_actor ON audit_log(actor_id);
CREATE INDEX idx_al_occurred ON audit_log(venture_id, occurred_at DESC);
CREATE INDEX idx_al_sequence ON audit_log(venture_id, sequence_number);
CREATE INDEX idx_al_description ON audit_log USING GIN(to_tsvector('english', description));

-- RLS
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY al_venture_isolation ON audit_log
  USING (venture_id = current_setting('app.current_venture_id')::UUID);

-- Prevent updates and deletes on audit_log (append-only)
CREATE OR REPLACE FUNCTION prevent_audit_modification()
RETURNS TRIGGER AS $$
BEGIN
  RAISE EXCEPTION 'Audit log entries cannot be modified or deleted'
    USING ERRCODE = 'P0010';
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_prevent_audit_update
  BEFORE UPDATE ON audit_log
  FOR EACH ROW EXECUTE FUNCTION prevent_audit_modification();

CREATE TRIGGER trg_prevent_audit_delete
  BEFORE DELETE ON audit_log
  FOR EACH ROW EXECUTE FUNCTION prevent_audit_modification();

-- Function to calculate hash chain
CREATE OR REPLACE FUNCTION calculate_audit_hash()
RETURNS TRIGGER AS $$
DECLARE
  prev_hash TEXT;
BEGIN
  SELECT entry_hash INTO prev_hash
  FROM audit_log
  WHERE venture_id = NEW.venture_id
  ORDER BY sequence_number DESC
  LIMIT 1;
  
  NEW.previous_hash := prev_hash;
  NEW.entry_hash := encode(
    sha256(
      (COALESCE(prev_hash, '') || NEW.venture_id || NEW.action || NEW.entity_id || NEW.actor_id || NEW.occurred_at::TEXT || NEW.sequence_number::TEXT)::bytea
    ),
    'hex'
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_calculate_audit_hash
  BEFORE INSERT ON audit_log
  FOR EACH ROW EXECUTE FUNCTION calculate_audit_hash();
```

---

## Code Examples

### 1. Initialize Chart of Accounts for a New Venture

```typescript
import { AccountingService } from '@mcv/finance/accounting';

const accounting = new AccountingService({ supabase, ventureId });

// Initialize from a standard template
const accountTree = await accounting.initializeChartOfAccounts(ventureId, 'standard-business');

console.log(`Created ${accountTree.totalAccounts} accounts`);
// Created 47 accounts

// The standard-business template creates:
// 1000-1999: Assets
//   1000 Cash and Cash Equivalents
//   1010 Accounts Receivable
//   1020 Inventory
//   1100 Prepaid Expenses
//   1500 Property, Plant & Equipment
//   1510 Accumulated Depreciation (contra)
// 2000-2999: Liabilities
//   2000 Accounts Payable
//   2010 Accrued Expenses
//   2020 Sales Tax Payable
//   2100 Notes Payable
//   2500 Long-Term Debt
// 3000-3999: Equity
//   3000 Owner's Equity / Common Stock
//   3100 Retained Earnings
//   3200 Owner's Draws / Dividends
// 4000-4999: Revenue
//   4000 Sales Revenue
//   4100 Service Revenue
//   4200 Interest Income
//   4900 Other Income
// 5000-5999: Cost of Goods Sold
//   5000 Cost of Goods Sold
//   5100 Direct Labor
//   5200 Manufacturing Overhead
// 6000-6999: Operating Expenses
//   6000 Salaries & Wages
//   6010 Payroll Taxes
//   6100 Rent Expense
//   6200 Utilities Expense
//   6300 Office Supplies
//   6400 Depreciation Expense
//   6500 Insurance Expense
//   6600 Professional Fees
//   6700 Marketing & Advertising
//   6800 Travel & Entertainment
//   6900 Miscellaneous Expense

// Add a custom account for this venture
const customAccount = await accounting.createAccount({
  ventureId,
  code: '6750',
  name: 'Software Subscriptions',
  type: 'expense',
  subType: 'operating_expense',
  parentId: null, // Top-level within expenses
  description: 'Monthly SaaS subscriptions and software licenses',
  tags: ['tech', 'recurring'],
});

console.log(`Created account: ${customAccount.code} — ${customAccount.name}`);
// Created account: 6750 — Software Subscriptions
```

### 2. Create and Post a Journal Entry

```typescript
import { AccountingService, UnbalancedEntryError } from '@mcv/finance/accounting';

const accounting = new AccountingService({ supabase, ventureId });

// Record a sale: $5,000 revenue, customer pays $4,750 (5% discount)
const journalEntry = await accounting.createJournalEntry({
  ventureId,
  entryDate: new Date('2025-01-15'),
  description: 'Invoice #INV-2025-042 — Widget order for Acme Corp',
  reference: 'INV-2025-042',
  source: 'invoicing',
  lines: [
    {
      accountId: accountsReceivable.id,  // 1010 Accounts Receivable
      debitAmount: 4750,
      description: 'Acme Corp — Invoice #INV-2025-042',
    },
    {
      accountId: salesDiscounts.id,       // 4010 Sales Discounts (contra revenue)
      debitAmount: 250,
      description: '5% early payment discount',
    },
    {
      accountId: salesRevenue.id,         // 4000 Sales Revenue
      creditAmount: 5000,
      description: 'Widget sales — 100 units @ $50',
    },
  ],
  tags: ['sales', 'acme-corp'],
  autoPost: false,  // Create as draft first
});

console.log(`Created JE: ${journalEntry.entryNumber}`);
// Created JE: JE-2025-00042
console.log(`Status: ${journalEntry.status}`);
// Status: draft
console.log(`Balanced: ${journalEntry.totalDebits === journalEntry.totalCredits}`);
// Balanced: true (5000 = 5000)

// Post the entry to the general ledger
const posted = await accounting.postJournalEntry(journalEntry.id);

console.log(`Status: ${posted.status}, Posted at: ${posted.postedAt}`);
// Status: posted, Posted at: 2025-01-15T14:30:00.000Z

// Verify the balance updated
const arBalance = await accounting.getAccountBalance(accountsReceivable.id);
console.log(`AR Balance: $${arBalance.net_balance}`);
// AR Balance: $4750

// Attempting an unbalanced entry throws immediately
try {
  await accounting.createJournalEntry({
    ventureId,
    entryDate: new Date('2025-01-15'),
    description: 'This will fail',
    lines: [
      { accountId: cashAccount.id, debitAmount: 1000 },
      { accountId: salesRevenue.id, creditAmount: 999 }, // Off by $1!
    ],
  });
} catch (error) {
  if (error instanceof UnbalancedEntryError) {
    console.error(`Unbalanced: debits=$${error.totalDebits}, credits=$${error.totalCredits}, diff=$${error.difference}`);
    // Unbalanced: debits=$1000, credits=$999, diff=$1
  }
}
```

### 3. Generate Financial Statements

```typescript
import { AccountingService } from '@mcv/finance/accounting';

const accounting = new AccountingService({ supabase, ventureId });

// Generate an Income Statement for Q1 2025
const incomeStatement = await accounting.generateIncomeStatement(ventureId, {
  periodStart: new Date('2025-01-01'),
  periodEnd: new Date('2025-03-31'),
  includeComparative: true,
  comparativeType: 'prior_year',
  includeDetail: true,
});

console.log(`=== ${incomeStatement.title} ===`);
console.log(`Period: ${incomeStatement.periodStart} to ${incomeStatement.periodEnd}`);
console.log();
console.log('Revenue');
for (const item of incomeStatement.revenue.lineItems) {
  const change = item.changePercent ? ` (${item.changePercent > 0 ? '+' : ''}${item.changePercent.toFixed(1)}%)` : '';
  console.log(`  ${item.label}: $${item.amount.toLocaleString()}${change}`);
}
console.log(`  Total Revenue: $${incomeStatement.revenue.total.toLocaleString()}`);
console.log();
console.log(`Gross Profit: $${incomeStatement.grossProfit.toLocaleString()} (${incomeStatement.grossProfitMargin.toFixed(1)}%)`);
console.log(`Operating Income: $${incomeStatement.operatingIncome.toLocaleString()}`);
console.log(`Net Income: $${incomeStatement.netIncome.toLocaleString()} (${incomeStatement.netIncomeMargin.toFixed(1)}%)`);

// Output:
// === Income Statement ===
// Period: 2025-01-01 to 2025-03-31
//
// Revenue
//   Sales Revenue: $125,000 (+12.3%)
//   Service Revenue: $45,000 (+8.7%)
//   Interest Income: $1,200 (-2.1%)
//   Total Revenue: $171,200
//
// Gross Profit: $102,720 (60.0%)
// Operating Income: $52,720
// Net Income: $39,540 (23.1%)

// Generate a Balance Sheet as of March 31, 2025
const balanceSheet = await accounting.generateBalanceSheet(ventureId, {
  periodStart: new Date('2025-01-01'),
  periodEnd: new Date('2025-03-31'),
});

console.log(`Total Assets: $${balanceSheet.totalAssets.toLocaleString()}`);
console.log(`Total Liabilities: $${balanceSheet.totalLiabilities.toLocaleString()}`);
console.log(`Total Equity: $${balanceSheet.totalEquity.toLocaleString()}`);
console.log(`Balanced: ${balanceSheet.isBalanced}`);
// Total Assets: $450,000
// Total Liabilities: $180,000
// Total Equity: $270,000
// Balanced: true

// Generate Cash Flow Statement
const cashFlow = await accounting.generateCashFlowStatement(ventureId, {
  periodStart: new Date('2025-01-01'),
  periodEnd: new Date('2025-03-31'),
});

console.log(`Operating: $${cashFlow.operatingActivities.netCash.toLocaleString()}`);
console.log(`Investing: $${cashFlow.investingActivities.netCash.toLocaleString()}`);
console.log(`Financing: $${cashFlow.financingActivities.netCash.toLocaleString()}`);
console.log(`Net Change: $${cashFlow.netCashChange.toLocaleString()}`);
console.log(`Ending Cash: $${cashFlow.endingCash.toLocaleString()}`);
```

### 4. Multi-Currency Transaction with FX Gain/Loss

```typescript
import { AccountingService } from '@mcv/finance/accounting';

const accounting = new AccountingService({ supabase, ventureId });

// Record exchange rate
await accounting.recordExchangeRate({
  fromCurrency: 'EUR',
  toCurrency: 'USD',
  rate: 1.0850,
  effectiveDate: new Date('2025-01-10'),
  source: 'ecb',
  rateType: 'spot',
});

// Record a purchase in EUR (venture's base currency is USD)
// Buy €10,000 of goods at 1.0850 EUR/USD = $10,850
const purchaseEntry = await accounting.createJournalEntry({
  ventureId,
  entryDate: new Date('2025-01-10'),
  description: 'Purchase from European supplier — PO-2025-015',
  reference: 'PO-2025-015',
  currencyCode: 'USD',  // Base currency
  lines: [
    {
      accountId: inventory.id,              // 1020 Inventory
      debitAmount: 10850,                   // USD amount
      foreignAmount: 10000,                 // EUR amount
      foreignCurrencyCode: 'EUR',
      exchangeRate: 1.0850,
      description: 'Widget components from EU supplier',
    },
    {
      accountId: accountsPayable.id,        // 2000 Accounts Payable
      creditAmount: 10850,
      foreignAmount: 10000,
      foreignCurrencyCode: 'EUR',
      exchangeRate: 1.0850,
      description: 'EU Supplier — payable in EUR',
    },
  ],
  autoPost: true,
});

// Later: EUR strengthens to 1.1050 when we pay
await accounting.recordExchangeRate({
  fromCurrency: 'EUR',
  toCurrency: 'USD',
  rate: 1.1050,
  effectiveDate: new Date('2025-02-10'),
  source: 'ecb',
  rateType: 'spot',
});

// Pay the €10,000 at the new rate: $11,050
// Realized FX loss: $11,050 - $10,850 = $200 loss
const paymentEntry = await accounting.createJournalEntry({
  ventureId,
  entryDate: new Date('2025-02-10'),
  description: 'Payment to European supplier — PO-2025-015',
  reference: 'PAY-2025-015',
  lines: [
    {
      accountId: accountsPayable.id,        // 2000 AP — clear the liability
      debitAmount: 10850,                   // Original USD amount
      foreignAmount: 10000,
      foreignCurrencyCode: 'EUR',
      exchangeRate: 1.0850,
    },
    {
      accountId: fxLossAccount.id,          // 6850 Foreign Exchange Loss
      debitAmount: 200,                     // Realized loss
      description: 'Realized FX loss on EUR payment',
    },
    {
      accountId: bankAccount.id,            // 1000 Bank
      creditAmount: 11050,                  // Actual USD paid
      foreignAmount: 10000,
      foreignCurrencyCode: 'EUR',
      exchangeRate: 1.1050,
    },
  ],
  autoPost: true,
});

// Calculate the realized gain/loss formally
const gainLoss = await accounting.calculateRealizedGainLoss({
  accountId: accountsPayable.id,
  foreignCurrency: 'EUR',
  foreignAmount: 10000,
  historicalRate: 1.0850,
  settlementRate: 1.1050,
  fiscalPeriodId: currentPeriod.id,
});

console.log(`FX ${gainLoss.gainLossAmount < 0 ? 'Loss' : 'Gain'}: $${Math.abs(gainLoss.gainLossAmount)}`);
// FX Loss: $200

// Period-end revaluation for remaining foreign currency balances
const revaluation = await accounting.performRevaluation(ventureId, {
  asOfDate: new Date('2025-03-31'),
  fiscalPeriodId: q1Period.id,
  gainLossAccountId: unrealizedGainLossAccount.id,
  autoPost: true,
  reversePrevious: true,
});

console.log(`Revaluation — Net unrealized: $${revaluation.netUnrealizedGainLoss}`);
console.log(`Accounts revalued: ${revaluation.accountRevaluations.length}`);
for (const acctReval of revaluation.accountRevaluations) {
  console.log(`  ${acctReval.accountCode} ${acctReval.accountName}: ${acctReval.foreignCurrency} ${acctReval.foreignBalance} → $${acctReval.unrealizedGainLoss}`);
}
```

### 5. Bank Reconciliation Workflow

```typescript
import { AccountingService } from '@mcv/finance/accounting';

const accounting = new AccountingService({ supabase, ventureId });

// Start a reconciliation session for the checking account
const session = await accounting.startBankReconciliation({
  ventureId,
  accountId: checkingAccount.id,
  statementDate: new Date('2025-01-31'),
  statementOpeningBalance: 50000,
  statementClosingBalance: 62350,
});

console.log(`Reconciliation session: ${session.id}`);
console.log(`Book balance: $${session.bookBalance}`);
// Book balance: $63100

// Import the bank statement (CSV format)
const bankStatement = await accounting.importBankStatement(session.id, {
  format: 'csv',
  bankName: 'First National Bank',
  accountNumber: '****4521',
  data: bankStatementCsvBuffer,
});

console.log(`Imported ${bankStatement.lines.length} bank transactions`);
// Imported 47 bank transactions

// Run auto-matching
const autoMatches = await accounting.autoMatchTransactions(session.id);

console.log(`Auto-matched: ${autoMatches.length} transactions`);
console.log(`By confidence:`);
const byConfidence = autoMatches.reduce((acc, m) => {
  acc[m.confidence] = (acc[m.confidence] || 0) + 1;
  return acc;
}, {} as Record<string, number>);
console.log(byConfidence);
// Auto-matched: 42 transactions
// { exact: 35, high: 5, medium: 2 }

// Manually match remaining items
await accounting.manualMatch(session.id, {
  bankStatementLineIds: ['bsl-001'],
  ledgerPostingIds: ['lp-055', 'lp-056'],  // Two book entries match one bank transaction
  notes: 'Split deposit — two invoices paid together',
});

// After matching everything, check the status
const updatedSession = await accounting.completeReconciliation(session.id);

console.log(`Status: ${updatedSession.status}`);
console.log(`Matched: ${updatedSession.matchedCount}`);
console.log(`Unreconciled difference: $${updatedSession.unreconciledDifference}`);
// Status: completed
// Matched: 47
// Unreconciled difference: $0
```

### 6. Recurring Journal Entries

```typescript
import { AccountingService } from '@mcv/finance/accounting';

const accounting = new AccountingService({ supabase, ventureId });

// Set up monthly rent expense
const rentRecurring = await accounting.createRecurringJournal({
  ventureId,
  name: 'Monthly Office Rent',
  description: 'Monthly rent for office space at 123 Main St',
  schedule: {
    frequency: 'monthly',
    interval: 1,
    dayOfMonth: 1,
    startDate: new Date('2025-01-01'),
    endDate: new Date('2025-12-31'),
    maxOccurrences: 12,
  },
  templateLines: [
    {
      lineNumber: 1,
      accountId: rentExpense.id,        // 6100 Rent Expense
      debitAmount: 5000,
      creditAmount: null,
      amountFormula: null,
      descriptionTemplate: 'Office rent — {{month}} {{year}}',
      dimensions: [{ dimensionType: 'location', dimensionValue: '123-main-st' }],
      costCenterId: null,
    },
    {
      lineNumber: 2,
      accountId: bankAccount.id,        // 1000 Bank
      debitAmount: null,
      creditAmount: 5000,
      amountFormula: null,
      descriptionTemplate: 'Office rent payment — {{month}} {{year}}',
      dimensions: [],
      costCenterId: null,
    },
  ],
  entryType: 'recurring',
  autoPost: true,
  tags: ['rent', 'monthly', 'office'],
});

// Set up straight-line depreciation for equipment
const depreciationRecurring = await accounting.createRecurringJournal({
  ventureId,
  name: 'Equipment Depreciation',
  description: 'Monthly straight-line depreciation for office equipment ($60,000 over 5 years)',
  schedule: {
    frequency: 'monthly',
    interval: 1,
    dayOfMonth: 'last',  // Last day of each month
    startDate: new Date('2025-01-01'),
    endDate: new Date('2029-12-31'),
    maxOccurrences: 60,
  },
  templateLines: [
    {
      lineNumber: 1,
      accountId: depreciationExpense.id,    // 6400 Depreciation Expense
      debitAmount: 1000,                    // $60,000 / 60 months
      creditAmount: null,
      amountFormula: null,
      descriptionTemplate: 'Depreciation — Office equipment — {{month}} {{year}}',
      dimensions: [],
      costCenterId: null,
    },
    {
      lineNumber: 2,
      accountId: accumulatedDepreciation.id,  // 1510 Accumulated Depreciation
      debitAmount: null,
      creditAmount: 1000,
      amountFormula: null,
      descriptionTemplate: 'Accumulated depreciation — Office equipment',
      dimensions: [],
      costCenterId: null,
    },
  ],
  entryType: 'recurring',
  autoPost: true,
  tags: ['depreciation', 'equipment'],
});

// Preview what would be generated
const preview = await accounting.previewRecurringEntries(ventureId, new Date('2025-02-01'));
console.log(`Would generate ${preview.length} entries:`);
for (const entry of preview) {
  console.log(`  ${entry.description} — $${entry.totalDebits}`);
}
// Would generate 2 entries:
//   Office rent — February 2025 — $5000
//   Depreciation — Office equipment — January 2025 — $1000

// Actually generate them
const generated = await accounting.generateRecurringEntries(ventureId, new Date('2025-02-01'));
console.log(`Generated and posted ${generated.length} entries`);
```

### 7. Fiscal Period Management and Year-End Close

```typescript
import { AccountingService } from '@mcv/finance/accounting';

const accounting = new AccountingService({ supabase, ventureId });

// Create fiscal year 2025 (calendar year)
const fy2025 = await accounting.createFiscalYear({
  ventureId,
  startDate: new Date('2025-01-01'),
  label: 'FY2025',
  autoOpenFirst: true,
});

console.log(`Created ${fy2025.label} with ${fy2025.quarters.length} quarters`);
// Created FY2025 with 4 quarters

// Quarters and months are auto-generated:
// Q1: Jan, Feb, Mar
// Q2: Apr, May, Jun
// Q3: Jul, Aug, Sep
// Q4: Oct, Nov, Dec

// January is auto-opened
const currentPeriod = await accounting.getCurrentPeriod(ventureId);
console.log(`Current period: ${currentPeriod.name} (${currentPeriod.status})`);
// Current period: January 2025 (open)

// At month-end, close the period
await accounting.closePeriod(januaryPeriod.id);
console.log('January closed — no more normal postings');

// Open February
await accounting.openPeriod(februaryPeriod.id);
console.log('February opened');

// At year-end, generate closing entries
// 1. Close revenue accounts to Income Summary
// 2. Close expense accounts to Income Summary
// 3. Close Income Summary to Retained Earnings
const closingEntries = await accounting.createJournalEntry({
  ventureId,
  type: 'closing',
  entryDate: new Date('2025-12-31'),
  description: 'Year-end closing entries — FY2025',
  lines: [
    // Close revenue ($500,000 credit balance → debit to close)
    { accountId: salesRevenue.id, debitAmount: 500000 },
    // Close expenses ($350,000 debit balance → credit to close)
    { accountId: totalExpenses.id, creditAmount: 350000 },
    // Net income to retained earnings ($150,000)
    { accountId: retainedEarnings.id, creditAmount: 150000 },
  ],
  autoPost: true,
});

// Lock the fiscal year
for (const quarter of fy2025.quarters) {
  for (const month of quarter.months) {
    await accounting.lockPeriod(month.id);
  }
}
console.log('FY2025 fully locked — immutable');

// Generate trial balance to verify
const trialBalance = await accounting.generateTrialBalance(ventureId, {
  asOfDate: new Date('2025-12-31'),
  includeClosing: true,
});

console.log(`Trial Balance: Debits=$${trialBalance.totalDebits}, Credits=$${trialBalance.totalCredits}`);
console.log(`Balanced: ${trialBalance.isBalanced}`);
// Trial Balance: Debits=$1,250,000, Credits=$1,250,000
// Balanced: true
```

### 8. Audit Trail and Integrity Verification

```typescript
import { AccountingService, AuditIntegrityError } from '@mcv/finance/accounting';

const accounting = new AccountingService({ supabase, ventureId });

// Query the audit trail for a specific journal entry
const jeAudit = await accounting.getJournalEntryAuditHistory('je-uuid-here');

for (const entry of jeAudit) {
  console.log(`[${entry.occurredAt.toISOString()}] ${entry.action} by ${entry.actorId}`);
  console.log(`  ${entry.description}`);
  if (entry.changes) {
    for (const change of entry.changes) {
      console.log(`  Δ ${change.field}: ${JSON.stringify(change.previousValue)} → ${JSON.stringify(change.newValue)}`);
    }
  }
}
// [2025-01-15T10:00:00.000Z] journal.created by user-001
//   Created journal entry JE-2025-00042: Invoice #INV-2025-042
// [2025-01-15T10:05:00.000Z] journal.approved by user-002
//   Approved journal entry JE-2025-00042
//   Δ status: "draft" → "approved"
// [2025-01-15T14:30:00.000Z] journal.posted by user-002
//   Posted journal entry JE-2025-00042 to general ledger
//   Δ status: "approved" → "posted"

// Query audit trail with filters
const recentAudit = await accounting.queryAuditTrail(ventureId, {
  actions: ['journal.posted', 'journal.reversed', 'journal.voided'],
  from: new Date('2025-01-01'),
  to: new Date('2025-01-31'),
  sortOrder: 'desc',
  limit: 50,
});

console.log(`Found ${recentAudit.items.length} audit entries for January postings`);

// Verify audit trail integrity (hash chain)
const integrityReport = await accounting.verifyAuditIntegrity(ventureId);

if (integrityReport.isIntact) {
  console.log(`✅ Audit trail intact — ${integrityReport.verifiedEntries} entries verified`);
} else {
  console.error(`❌ Audit trail COMPROMISED at sequence #${integrityReport.brokenChainAt}`);
  for (const issue of integrityReport.issues) {
    console.error(`  Issue at seq #${issue.sequenceNumber}: ${issue.issue} — ${issue.details}`);
  }
  // This should NEVER happen in production — investigate immediately
}

// Verify ledger integrity (debits = credits across all periods)
const ledgerIntegrity = await accounting.verifyLedgerIntegrity(ventureId);
console.log(`Ledger integrity: ${ledgerIntegrity.isBalanced ? '✅ Balanced' : '❌ UNBALANCED'}`);
```

---

## Error Codes

All errors extend the base `AccountingError` class and include a machine-readable `code`, human-readable `message`, and optional `details` object.

| Code | Error Class | HTTP | Description |
|---|---|---|---|
| `ACCT_UNBALANCED_ENTRY` | `UnbalancedEntryError` | 422 | Journal entry debits do not equal credits. Includes `totalDebits`, `totalCredits`, and `difference` in details. |
| `ACCT_PERIOD_CLOSED` | `PeriodClosedError` | 409 | Attempted to post to a closed fiscal period. Includes `periodId`, `periodName`, `status`. |
| `ACCT_PERIOD_LOCKED` | `PeriodLockedError` | 409 | Attempted to modify data in a locked fiscal period. Locked periods are fully immutable. |
| `ACCT_ACCOUNT_NOT_FOUND` | `AccountNotFoundError` | 404 | Referenced account does not exist or belongs to a different venture. |
| `ACCT_ACCOUNT_INACTIVE` | `AccountInactiveError` | 422 | Attempted to post to a deactivated account. Reactivate the account first. |
| `ACCT_DUPLICATE_CODE` | `DuplicateAccountCodeError` | 409 | Account code already exists within this venture's chart of accounts. |
| `ACCT_INSUFFICIENT_BALANCE` | `InsufficientBalanceError` | 422 | Operation would result in a negative balance on an account that doesn't allow it. |
| `ACCT_CURRENCY_MISMATCH` | `CurrencyMismatchError` | 422 | Transaction currency doesn't match account currency, or mixed currencies without proper FX handling. |
| `ACCT_RECON_MISMATCH` | `ReconciliationMismatchError` | 422 | Reconciliation cannot be completed — unreconciled difference exceeds tolerance. |
| `ACCT_AUDIT_INTEGRITY` | `AuditIntegrityError` | 500 | Audit trail hash chain is broken. This is a critical error requiring immediate investigation. |
| `ACCT_INVALID_PERIOD` | `InvalidFiscalPeriodError` | 422 | Invalid fiscal period configuration (overlapping dates, invalid hierarchy, etc.). |
| `ACCT_POSTING_FAILED` | `JournalPostingError` | 500 | Failed to post journal entry to the ledger. Transaction rolled back. |
| `ACCT_STATEMENT_FAILED` | `StatementGenerationError` | 500 | Failed to generate a financial statement. May indicate data inconsistency. |
| `ACCT_ENTRY_NOT_DRAFT` | `JournalEntryStatusError` | 409 | Attempted to modify a journal entry that is not in draft status. |
| `ACCT_ENTRY_ALREADY_POSTED` | `JournalEntryStatusError` | 409 | Attempted to post an already-posted journal entry. Use reversal instead. |
| `ACCT_CANNOT_DELETE_SYSTEM` | `SystemAccountError` | 403 | Cannot deactivate or delete a system-managed account. |
| `ACCT_HAS_BALANCE` | `AccountHasBalanceError` | 422 | Cannot deactivate an account with a non-zero balance. Transfer or write off the balance first. |
| `ACCT_EXCHANGE_RATE_MISSING` | `ExchangeRateMissingError` | 422 | No exchange rate found for the given currency pair and date. Record the rate first. |
| `ACCT_MAX_LINES_EXCEEDED` | `MaxLinesExceededError` | 422 | Journal entry exceeds the maximum number of lines (default: 500). |
| `ACCT_RECON_ALREADY_MATCHED` | `AlreadyMatchedError` | 409 | Bank statement line or ledger posting is already matched in this reconciliation session. |

### Error Hierarchy

```typescript
class AccountingError extends Error {
  code: string;
  statusCode: number;
  details: Record<string, unknown>;
  
  constructor(code: string, message: string, statusCode: number, details?: Record<string, unknown>) {
    super(message);
    this.code = code;
    this.statusCode = statusCode;
    this.details = details ?? {};
    this.name = 'AccountingError';
  }
}

class UnbalancedEntryError extends AccountingError {
  totalDebits: number;
  totalCredits: number;
  difference: number;
  
  constructor(totalDebits: number, totalCredits: number) {
    const diff = Math.abs(totalDebits - totalCredits);
    super(
      'ACCT_UNBALANCED_ENTRY',
      `Journal entry is unbalanced: debits=${totalDebits}, credits=${totalCredits}, difference=${diff}`,
      422,
      { totalDebits, totalCredits, difference: diff }
    );
    this.totalDebits = totalDebits;
    this.totalCredits = totalCredits;
    this.difference = diff;
  }
}

class PeriodClosedError extends AccountingError {
  constructor(periodId: string, periodName: string) {
    super(
      'ACCT_PERIOD_CLOSED',
      `Fiscal period "${periodName}" is closed and does not accept new postings`,
      409,
      { periodId, periodName, status: 'closed' }
    );
  }
}

class PeriodLockedError extends AccountingError {
  constructor(periodId: string, periodName: string) {
    super(
      'ACCT_PERIOD_LOCKED',
      `Fiscal period "${periodName}" is locked — no modifications allowed`,
      409,
      { periodId, periodName, status: 'locked' }
    );
  }
}

// ... additional error classes follow the same pattern
```

---

## Security

### Access Control

The accounting module enforces strict access control at multiple levels:

| Permission | Role(s) | Description |
|---|---|---|
| `accounting.accounts.read` | Bookkeeper, Accountant, CFO, Admin | View chart of accounts and balances |
| `accounting.accounts.write` | Accountant, CFO, Admin | Create, update, deactivate accounts |
| `accounting.journal.create` | Bookkeeper, Accountant, CFO, Admin | Create draft journal entries |
| `accounting.journal.approve` | Accountant, CFO, Admin | Approve journal entries for posting |
| `accounting.journal.post` | Accountant, CFO, Admin | Post entries to the general ledger |
| `accounting.journal.reverse` | CFO, Admin | Reverse posted journal entries |
| `accounting.journal.void` | CFO, Admin | Void journal entries |
| `accounting.period.manage` | CFO, Admin | Open, close, lock fiscal periods |
| `accounting.period.reopen` | Admin | Reopen a closed fiscal period |
| `accounting.reconciliation.manage` | Bookkeeper, Accountant, CFO, Admin | Perform bank reconciliation |
| `accounting.statements.generate` | Accountant, CFO, Admin | Generate financial statements |
| `accounting.audit.read` | Accountant, CFO, Admin, Auditor | Query the audit trail |
| `accounting.settings.manage` | CFO, Admin | Configure accounting settings |
| `accounting.fx.manage` | Accountant, CFO, Admin | Manage exchange rates and revaluation |

### Data Isolation

- **Row-Level Security (RLS)**: Every table has RLS policies enforcing `venture_id` isolation. A user from Venture A can never see or modify data belonging to Venture B.
- **Venture context**: The current venture ID is set via `app.current_venture_id` PostgreSQL session variable at the start of every request.
- **Service-level validation**: Even without RLS, the service layer validates venture ownership before every operation.

### Audit Immutability

- The `audit_log` table has triggers that **prevent UPDATE and DELETE** operations at the database level.
- Each audit entry contains a **SHA-256 hash chain** linking it to the previous entry, making tampering detectable.
- Periodic integrity checks verify the hash chain is unbroken.
- Audit logs are **partitioned by year** for performance and archival purposes.

### Financial Data Protection

- All monetary amounts use `NUMERIC(20, 4)` — no floating-point arithmetic. This prevents rounding errors that plague IEEE 754 double-precision.
- Exchange rates use `NUMERIC(20, 8)` for sub-cent precision.
- The double-entry constraint (`total_debits = total_credits`) is enforced at both application and database levels.
- Journal entries cannot be modified after posting — only reversed or voided, creating a full paper trail.
- Posted entries are immutable: status transitions are one-way (draft → posted → reversed/voided).

### Sensitive Data

- Bank account numbers are stored **masked** (e.g., `****4521`).
- Full bank account numbers, if needed for payment processing, are stored in the separate `@mcv/finance/payments` module with additional encryption.
- No PII (names, SSNs, etc.) is stored directly in accounting tables — only reference IDs to the relevant entity modules.

---

## Environment Variables

| Variable | Required | Default | Description |
|---|---|---|---|
| `ACCOUNTING_DEFAULT_CURRENCY` | No | `USD` | Default base currency for new ventures |
| `ACCOUNTING_MAX_JOURNAL_LINES` | No | `500` | Maximum number of lines per journal entry |
| `ACCOUNTING_RECON_TOLERANCE` | No | `0.01` | Reconciliation tolerance (max acceptable difference) |
| `ACCOUNTING_AUTO_POST_RECURRING` | No | `false` | Whether recurring entries auto-post by default |
| `ACCOUNTING_REQUIRE_APPROVAL` | No | `true` | Whether journal entries require approval before posting |
| `ACCOUNTING_APPROVAL_THRESHOLD` | No | `10000` | Amount above which manual approval is required (even if auto-post) |
| `ACCOUNTING_FX_RATE_PROVIDER` | No | `manual` | Exchange rate provider (`manual`, `ecb`, `openexchangerates`) |
| `ACCOUNTING_FX_RATE_API_KEY` | Cond. | — | API key for the exchange rate provider (required if not `manual`) |
| `ACCOUNTING_FX_AUTO_FETCH` | No | `false` | Whether to auto-fetch daily exchange rates |
| `ACCOUNTING_AUDIT_HASH_ALGO` | No | `sha256` | Hash algorithm for audit trail integrity chain |
| `ACCOUNTING_AUDIT_VERIFY_INTERVAL` | No | `24h` | How often to auto-verify audit trail integrity |
| `ACCOUNTING_BALANCE_SNAPSHOT_CRON` | No | `0 2 * * *` | Cron expression for nightly balance snapshot |
| `ACCOUNTING_STATEMENT_CACHE_TTL` | No | `3600` | Cache TTL for generated financial statements (seconds) |
| `ACCOUNTING_FISCAL_YEAR_START_MONTH` | No | `1` | Default fiscal year start month (1=Jan, 4=Apr, 7=Jul, 10=Oct) |

---

## Dependencies

### Internal Dependencies

| Package | Purpose |
|---|---|
| `@mcv/core` | Base service class, error handling, configuration, logging |
| `@mcv/db` | Supabase client, connection management, transaction helpers |
| `@mcv/auth` | Authentication context, permission checking, venture context |
| `@mcv/events` | Domain event publishing (journal.posted, period.closed, etc.) |
| `@mcv/jobs` | Background job scheduling (recurring entries, balance snapshots) |

### External Dependencies

| Package | Version | Purpose |
|---|---|---|
| `@supabase/supabase-js` | `^2.x` | Database client |
| `@trpc/server` | `^10.x` | API router definitions |
| `zod` | `^3.x` | Input validation and schema definitions |
| `decimal.js` | `^10.x` | Arbitrary-precision decimal arithmetic (avoids floating-point errors) |
| `date-fns` | `^3.x` | Date manipulation for fiscal periods and scheduling |
| `uuid` | `^9.x` | UUID generation |
| `csv-parse` | `^5.x` | Bank statement CSV import parsing |
| `ofx-js` | `^0.x` | OFX/QFX bank statement parsing |

### Peer Dependencies

| Package | Purpose |
|---|---|
| `@mcv/finance/invoicing` | Optional — auto-create journal entries from invoices |
| `@mcv/finance/payments` | Optional — auto-create journal entries from payments |
| `@mcv/finance/payroll` | Optional — auto-create journal entries from payroll runs |
| `@mcv/finance/tax` | Optional — tax code validation, tax liability account mapping |

---

## Testing

### Test Strategy

The accounting module requires rigorous testing given its role as the financial backbone. We employ a multi-layered testing strategy:

```
┌─────────────────────────────────────────────┐
│           E2E Tests (Playwright)            │
│  Full accounting workflows via API/UI       │
├─────────────────────────────────────────────┤
│         Integration Tests (Vitest)          │
│  Service → DB round-trips, RLS policies,   │
│  trigger behavior, constraint enforcement   │
├─────────────────────────────────────────────┤
│           Unit Tests (Vitest)               │
│  Validators, calculators, formatters,       │
│  balance logic, FX math, hash chains        │
└─────────────────────────────────────────────┘
```

### Unit Tests

```typescript
import { describe, it, expect } from 'vitest';
import { JournalEntryValidator } from '../journal-entries/validator';
import { FxGainLossCalculator } from '../multi-currency/gain-loss-calculator';
import { TrialBalanceGenerator } from '../general-ledger/trial-balance';

describe('JournalEntryValidator', () => {
  const validator = new JournalEntryValidator();
  
  it('should accept a balanced journal entry', () => {
    const input = {
      lines: [
        { accountId: 'acc-1', debitAmount: 1000, creditAmount: 0 },
        { accountId: 'acc-2', debitAmount: 0, creditAmount: 1000 },
      ],
    };
    
    const result = validator.validate(input);
    expect(result.isValid).toBe(true);
    expect(result.totalDebits).toBe(1000);
    expect(result.totalCredits).toBe(1000);
  });
  
  it('should reject an unbalanced journal entry', () => {
    const input = {
      lines: [
        { accountId: 'acc-1', debitAmount: 1000, creditAmount: 0 },
        { accountId: 'acc-2', debitAmount: 0, creditAmount: 999.99 },
      ],
    };
    
    const result = validator.validate(input);
    expect(result.isValid).toBe(false);
    expect(result.errors).toContainEqual(
      expect.objectContaining({ code: 'ACCT_UNBALANCED_ENTRY' })
    );
  });
  
  it('should reject a line with both debit and credit', () => {
    const input = {
      lines: [
        { accountId: 'acc-1', debitAmount: 500, creditAmount: 500 },
      ],
    };
    
    const result = validator.validate(input);
    expect(result.isValid).toBe(false);
    expect(result.errors).toContainEqual(
      expect.objectContaining({ code: 'ACCT_INVALID_LINE' })
    );
  });
  
  it('should reject zero-amount lines', () => {
    const input = {
      lines: [
        { accountId: 'acc-1', debitAmount: 0, creditAmount: 0 },
        { accountId: 'acc-2', debitAmount: 1000, creditAmount: 0 },
        { accountId: 'acc-3', debitAmount: 0, creditAmount: 1000 },
      ],
    };
    
    const result = validator.validate(input);
    expect(result.isValid).toBe(false);
    expect(result.errors).toContainEqual(
      expect.objectContaining({ code: 'ACCT_ZERO_AMOUNT_LINE' })
    );
  });
  
  it('should reject negative amounts', () => {
    const input = {
      lines: [
        { accountId: 'acc-1', debitAmount: -500, creditAmount: 0 },
        { accountId: 'acc-2', debitAmount: 0, creditAmount: -500 },
      ],
    };
    
    const result = validator.validate(input);
    expect(result.isValid).toBe(false);
  });
  
  it('should accept multi-line compound entries', () => {
    const input = {
      lines: [
        { accountId: 'acc-1', debitAmount: 500, creditAmount: 0 },
        { accountId: 'acc-2', debitAmount: 300, creditAmount: 0 },
        { accountId: 'acc-3', debitAmount: 200, creditAmount: 0 },
        { accountId: 'acc-4', debitAmount: 0, creditAmount: 1000 },
      ],
    };
    
    const result = validator.validate(input);
    expect(result.isValid).toBe(true);
  });
  
  it('should enforce maximum line count', () => {
    const lines = Array.from({ length: 501 }, (_, i) => ({
      accountId: `acc-${i}`,
      debitAmount: i < 250 ? 1 : 0,
      creditAmount: i >= 250 ? 1 : 0,
    }));
    
    const result = validator.validate({ lines });
    expect(result.isValid).toBe(false);
    expect(result.errors).toContainEqual(
      expect.objectContaining({ code: 'ACCT_MAX_LINES_EXCEEDED' })
    );
  });
});

describe('FxGainLossCalculator', () => {
  const calculator = new FxGainLossCalculator();
  
  it('should calculate realized FX loss when foreign currency strengthens', () => {
    const result = calculator.calculateRealized({
      foreignAmount: 10000,
      historicalRate: 1.0850,  // EUR → USD
      settlementRate: 1.1050,  // EUR strengthened
      baseCurrency: 'USD',
      foreignCurrency: 'EUR',
    });
    
    expect(result.originalBaseAmount).toBe(10850);   // 10000 * 1.0850
    expect(result.currentBaseAmount).toBe(11050);     // 10000 * 1.1050
    expect(result.gainLossAmount).toBe(-200);         // Loss (paid more USD)
    expect(result.type).toBe('realized');
  });
  
  it('should calculate realized FX gain when foreign currency weakens', () => {
    const result = calculator.calculateRealized({
      foreignAmount: 10000,
      historicalRate: 1.1050,
      settlementRate: 1.0850,  // EUR weakened
      baseCurrency: 'USD',
      foreignCurrency: 'EUR',
    });
    
    expect(result.gainLossAmount).toBe(200);  // Gain (paid fewer USD)
  });
  
  it('should calculate unrealized FX gain/loss for period-end revaluation', () => {
    const result = calculator.calculateUnrealized({
      foreignBalance: 50000,
      historicalRate: 1.3200,  // GBP → USD
      currentRate: 1.3500,
      baseCurrency: 'USD',
      foreignCurrency: 'GBP',
    });
    
    expect(result.originalBaseAmount).toBe(66000);  // 50000 * 1.32
    expect(result.currentBaseAmount).toBe(67500);   // 50000 * 1.35
    expect(result.gainLossAmount).toBe(1500);       // Unrealized gain
    expect(result.type).toBe('unrealized');
  });
  
  it('should handle zero foreign amount', () => {
    const result = calculator.calculateRealized({
      foreignAmount: 0,
      historicalRate: 1.0850,
      settlementRate: 1.1050,
      baseCurrency: 'USD',
      foreignCurrency: 'EUR',
    });
    
    expect(result.gainLossAmount).toBe(0);
  });
});

describe('TrialBalanceGenerator', () => {
  it('should produce a balanced trial balance', () => {
    // Given a set of account balances
    const accounts = [
      { id: '1', code: '1000', name: 'Cash', type: 'asset', debitTotal: 50000, creditTotal: 20000 },
      { id: '2', code: '1010', name: 'AR', type: 'asset', debitTotal: 30000, creditTotal: 5000 },
      { id: '3', code: '2000', name: 'AP', type: 'liability', debitTotal: 10000, creditTotal: 25000 },
      { id: '4', code: '3100', name: 'Retained Earnings', type: 'equity', debitTotal: 0, creditTotal: 20000 },
      { id: '5', code: '4000', name: 'Revenue', type: 'revenue', debitTotal: 0, creditTotal: 50000 },
      { id: '6', code: '6000', name: 'Expenses', type: 'expense', debitTotal: 30000, creditTotal: 0 },
    ];
    
    const tb = TrialBalanceGenerator.fromAccountBalances(accounts);
    
    // Assets & Expenses have debit normal balance
    // Liabilities, Equity, Revenue have credit normal balance
    expect(tb.isBalanced).toBe(true);
    expect(tb.totalDebits).toBe(tb.totalCredits);
    expect(tb.difference).toBe(0);
  });
});
```

### Integration Tests

```typescript
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createTestSupabase, cleanupTestData } from '@mcv/test-utils';
import { AccountingService } from '../service';

describe('AccountingService Integration', () => {
  let supabase: SupabaseClient;
  let accounting: AccountingService;
  let ventureId: string;
  
  beforeAll(async () => {
    supabase = createTestSupabase();
    ventureId = await createTestVenture(supabase);
    accounting = new AccountingService({ supabase, ventureId });
    
    // Initialize CoA and fiscal year for tests
    await accounting.initializeChartOfAccounts(ventureId, 'standard-business');
    await accounting.createFiscalYear({
      ventureId,
      startDate: new Date('2025-01-01'),
      label: 'FY2025',
      autoOpenFirst: true,
    });
  });
  
  afterAll(async () => {
    await cleanupTestData(supabase, ventureId);
  });
  
  it('should enforce double-entry balancing at database level', async () => {
    // Even if we bypass the application validator, the DB CHECK constraint catches it
    const { error } = await supabase.rpc('test_insert_unbalanced_je', {
      p_venture_id: ventureId,
      p_total_debits: 1000,
      p_total_credits: 999,
    });
    
    expect(error).toBeTruthy();
    expect(error!.message).toContain('check');
  });
  
  it('should prevent posting to a closed period', async () => {
    const period = await accounting.getCurrentPeriod(ventureId);
    await accounting.closePeriod(period.id);
    
    await expect(
      accounting.createJournalEntry({
        ventureId,
        entryDate: period.startDate,
        description: 'Should fail',
        lines: [
          { accountId: cashAccount.id, debitAmount: 100 },
          { accountId: revenueAccount.id, creditAmount: 100 },
        ],
        autoPost: true,
      })
    ).rejects.toThrow('PeriodClosedError');
    
    // Reopen for subsequent tests
    await accounting.reopenPeriod(period.id, 'Test cleanup');
  });
  
  it('should enforce RLS venture isolation', async () => {
    // Create entry in venture A
    const entryA = await accounting.createJournalEntry({
      ventureId,
      entryDate: new Date('2025-01-15'),
      description: 'Venture A entry',
      lines: [
        { accountId: cashAccount.id, debitAmount: 500 },
        { accountId: revenueAccount.id, creditAmount: 500 },
      ],
    });
    
    // Switch to venture B context
    const accountingB = new AccountingService({ supabase, ventureId: ventureBId });
    
    // Venture B should NOT see Venture A's entry
    await expect(
      accountingB.getJournalEntry(entryA.id)
    ).rejects.toThrow();
  });
  
  it('should create audit trail entries for all operations', async () => {
    const entry = await accounting.createJournalEntry({
      ventureId,
      entryDate: new Date('2025-01-15'),
      description: 'Audit test entry',
      lines: [
        { accountId: cashAccount.id, debitAmount: 100 },
        { accountId: revenueAccount.id, creditAmount: 100 },
      ],
    });
    
    await accounting.postJournalEntry(entry.id);
    
    const audit = await accounting.getJournalEntryAuditHistory(entry.id);
    
    expect(audit.length).toBe(2);
    expect(audit[0].action).toBe('journal.created');
    expect(audit[1].action).toBe('journal.posted');
  });
  
  it('should update account balances after posting', async () => {
    const balanceBefore = await accounting.getAccountBalance(cashAccount.id);
    
    const entry = await accounting.createJournalEntry({
      ventureId,
      entryDate: new Date('2025-01-15'),
      description: 'Balance test',
      lines: [
        { accountId: cashAccount.id, debitAmount: 1000 },
        { accountId: revenueAccount.id, creditAmount: 1000 },
      ],
      autoPost: true,
    });
    
    const balanceAfter = await accounting.getAccountBalance(cashAccount.id);
    
    // Cash is a debit-normal account, so debit increases the balance
    expect(balanceAfter.net_balance - balanceBefore.net_balance).toBe(1000);
  });
  
  it('should generate a correct trial balance', async () => {
    const tb = await accounting.generateTrialBalance(ventureId, {
      asOfDate: new Date('2025-01-31'),
    });
    
    expect(tb.isBalanced).toBe(true);
    expect(tb.totalDebits).toBe(tb.totalCredits);
    expect(tb.difference).toBe(0);
  });
  
  it('should correctly reverse a posted entry', async () => {
    const original = await accounting.createJournalEntry({
      ventureId,
      entryDate: new Date('2025-01-20'),
      description: 'Entry to be reversed',
      lines: [
        { accountId: cashAccount.id, debitAmount: 2000 },
        { accountId: revenueAccount.id, creditAmount: 2000 },
      ],
      autoPost: true,
    });
    
    const reversal = await accounting.reverseJournalEntry(original.id);
    
    expect(reversal.type).toBe('reversing');
    expect(reversal.reversalOfId).toBe(original.id);
    
    // Check original is marked as reversed
    const updatedOriginal = await accounting.getJournalEntry(original.id);
    expect(updatedOriginal.status).toBe('reversed');
    expect(updatedOriginal.reversedById).toBe(reversal.id);
    
    // Net effect on balances should be zero
    const tb = await accounting.generateTrialBalance(ventureId, {
      asOfDate: new Date('2025-01-31'),
    });
    expect(tb.isBalanced).toBe(true);
  });
});
```

### Test Coverage Targets

| Area | Target | Notes |
|---|---|---|
| Journal Entry Validator | 100% | Core invariant — zero tolerance for bugs |
| Balance Calculator | 100% | Financial accuracy is non-negotiable |
| FX Gain/Loss Calculator | 100% | Currency math must be exact |
| Audit Trail Hash Chain | 100% | Integrity verification must be bulletproof |
| Chart of Accounts Service | 95%+ | CRUD + hierarchy operations |
| Journal Entry Service | 95%+ | Full lifecycle: create → post → reverse/void |
| General Ledger Service | 95%+ | Posting, querying, trial balance |
| Fiscal Period Service | 95%+ | Lifecycle state machine transitions |
| Reconciliation Service | 90%+ | Auto-matching, manual matching, completion |
| Financial Statement Gen. | 90%+ | Income statement, balance sheet, cash flow |
| Recurring Journals | 90%+ | Scheduling, generation, preview |
| Multi-Currency Service | 95%+ | Rate management, revaluation |
| RLS Policies | 100% | Venture isolation must be absolute |
| DB Constraints | 100% | All CHECK, UNIQUE, FK constraints verified |
| DB Triggers | 100% | Balance updates, period checks, audit hash |

### Running Tests

```bash
# All accounting tests
pnpm test packages/finance/accounting

# Unit tests only (fast)
pnpm test packages/finance/accounting/src --run

# Integration tests (requires DB)
pnpm test packages/finance/accounting/tests/integration --run

# With coverage report
pnpm test packages/finance/accounting --coverage

# Watch mode during development
pnpm test packages/finance/accounting --watch
```

---

## Appendix: Chart of Accounts Templates

### Standard Business Template (`standard-business`)

```
1000  Cash and Cash Equivalents         Asset / Current Asset
1010  Accounts Receivable               Asset / Current Asset
1020  Inventory                         Asset / Current Asset
1030  Prepaid Expenses                  Asset / Current Asset
1040  Short-Term Investments            Asset / Current Asset
1050  Other Current Assets              Asset / Current Asset
1500  Property, Plant & Equipment       Asset / Fixed Asset
1510  Accumulated Depreciation          Asset / Fixed Asset (Contra)
1600  Intangible Assets                 Asset / Intangible Asset
1610  Accumulated Amortization          Asset / Intangible Asset (Contra)
1700  Other Non-Current Assets          Asset / Other Asset

2000  Accounts Payable                  Liability / Current Liability
2010  Accrued Expenses                  Liability / Current Liability
2020  Sales Tax Payable                 Liability / Current Liability
2030  Payroll Taxes Payable             Liability / Current Liability
2040  Short-Term Notes Payable          Liability / Current Liability
2050  Current Portion of LTD            Liability / Current Liability
2060  Unearned Revenue                  Liability / Current Liability
2070  Other Current Liabilities         Liability / Current Liability
2500  Long-Term Debt                    Liability / Long-Term Liability
2510  Bonds Payable                     Liability / Long-Term Liability
2520  Other Long-Term Liabilities       Liability / Long-Term Liability

3000  Common Stock / Owner's Equity     Equity / Owners Equity
3010  Additional Paid-In Capital        Equity / Owners Equity
3100  Retained Earnings                 Equity / Retained Earnings
3200  Owner's Draws / Dividends         Equity / Other Equity
3300  Other Comprehensive Income        Equity / Other Equity

4000  Sales Revenue                     Revenue / Operating Revenue
4010  Sales Discounts                   Revenue / Operating Revenue (Contra)
4020  Sales Returns & Allowances        Revenue / Operating Revenue (Contra)
4100  Service Revenue                   Revenue / Operating Revenue
4200  Interest Income                   Revenue / Other Revenue
4300  Rental Income                     Revenue / Other Revenue
4900  Other Income                      Revenue / Other Revenue

5000  Cost of Goods Sold                Expense / COGS
5100  Direct Labor                      Expense / COGS
5200  Manufacturing Overhead            Expense / COGS
5300  Freight & Shipping                Expense / COGS

6000  Salaries & Wages                  Expense / Operating Expense
6010  Payroll Taxes                     Expense / Operating Expense
6020  Employee Benefits                 Expense / Operating Expense
6100  Rent Expense                      Expense / Operating Expense
6200  Utilities Expense                 Expense / Operating Expense
6300  Office Supplies                   Expense / Operating Expense
6400  Depreciation Expense              Expense / Operating Expense
6410  Amortization Expense              Expense / Operating Expense
6500  Insurance Expense                 Expense / Operating Expense
6600  Professional Fees                 Expense / Operating Expense
6700  Marketing & Advertising           Expense / Operating Expense
6800  Travel & Entertainment            Expense / Operating Expense
6850  Foreign Exchange Loss             Expense / Other Expense
6860  Foreign Exchange Gain             Expense / Other Expense (Contra)
6900  Miscellaneous Expense             Expense / Other Expense
6950  Interest Expense                  Expense / Other Expense
6990  Income Tax Expense                Expense / Other Expense
```

---

*Last updated: 2025-01-15*