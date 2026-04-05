# @mcv/finance — Finance Domain Module

**Parent Package:** @mcv/finance  
**Tier:** 5 (Domain Layer — Publishable)  
**Classification:** PUBLISHABLE  
**Version:** 1.0.0  
**Last Updated:** February 9, 2026

---

## Purpose

The `finance` module provides a comprehensive financial management system for ventures operating within the MCV ecosystem. It implements full double-entry accounting with a hierarchical chart of accounts, expense tracking with multi-level approval workflows, budget planning and forecasting, financial statement generation, advanced invoicing with branded templates and proposals, and bidirectional integrations with external accounting platforms (QuickBooks, Xero) and bank feeds (Plaid).

**This is the single source of truth for all financial data, transactions, and reporting across every venture.**

Every dollar that flows through an MCV venture — whether from a customer invoice, an employee expense reimbursement, a subscription renewal, or a bank feed import — is captured here as double-entry journal entries, tracked against budgets, and surfaced in real-time financial reports.

---

## Exports

```typescript
// ═══════════════════════════════════════════════════════════════════════════════
// ACCOUNTING
// ═══════════════════════════════════════════════════════════════════════════════

// Core services
export {
  accountingService,               // General ledger operations
} from './accounting/service';

export type {
  CreateAccountInput,              // Create a new GL account
  CreateJournalEntryInput,         // Create a journal entry
  JournalEntryLineInput,           // Individual debit/credit line
} from './accounting/service';

// Schema exports
export {
  accounts,                        // Chart of accounts table
  journalEntries,                  // Journal entries table
  journalEntryLines,               // Journal entry lines table
  accountBalances,                 // Period account balances table
  fiscalPeriods,                   // Fiscal periods table
  fiscalYears,                     // Fiscal years table
  recurringJournals,               // Recurring journal templates
  accountTypeEnum,                 // Account type enum
  accountSubtypeEnum,              // Account subtype enum
} from './accounting/schema';

// ═══════════════════════════════════════════════════════════════════════════════
// EXPENSES
// ═══════════════════════════════════════════════════════════════════════════════

export {
  expenseService,                  // Expense tracking & approval
} from './expenses/service';

export type {
  CreateExpenseInput,              // Create a single expense
  CreateExpenseReportInput,        // Create an expense report
} from './expenses/service';

export {
  expenses,                        // Expenses table
  expenseReports,                  // Expense reports table
  expenseApprovals,                // Approval chain table
  expensePolicies,                 // Expense policy rules
  expenseApprovalWorkflows,        // Multi-level workflows
  corporateCards,                  // Corporate card management
  cardTransactions,                // Card transaction log
  expenseStatusEnum,               // Expense status enum
  expenseCategoryEnum,             // Expense category enum
} from './expenses/schema';

// ═══════════════════════════════════════════════════════════════════════════════
// BUDGETING
// ═══════════════════════════════════════════════════════════════════════════════

export {
  budgetingService,                // Budget planning & tracking
} from './budgeting/service';

export type {
  CreateBudgetInput,               // Create a new budget
  BudgetLineInput,                 // Individual budget line
} from './budgeting/service';

export {
  budgets,                         // Budgets table
  budgetLines,                     // Budget line items table
  budgetTransfers,                 // Inter-line transfers
  budgetForecasts,                 // Forecast data
  budgetScenarios,                 // What-if scenarios
  budgetAlerts,                    // Threshold alerts
  budgetStatusEnum,                // Budget status enum
} from './budgeting/schema';

// ═══════════════════════════════════════════════════════════════════════════════
// REPORTING
// ═══════════════════════════════════════════════════════════════════════════════

export {
  reportingService,                // Financial statement generation
} from './reporting/service';

export type {
  ReportOptions,                   // Report generation options
  ReportDateRange,                 // Date range configuration
} from './reporting/service';

export {
  financialReports,                // Report definitions table
  reportRuns,                      // Report execution log
  reportSubscriptions,             // Report email subscriptions
  customReportDefinitions,         // Custom report builder
  reportTypeEnum,                  // Report type enum
  reportScheduleEnum,              // Report schedule enum
} from './reporting/schema';

// ═══════════════════════════════════════════════════════════════════════════════
// BILLING
// ═══════════════════════════════════════════════════════════════════════════════

export {
  billingService,                  // Invoicing & subscription billing
} from './billing/service';

export type {
  CreateInvoiceInput,              // Create a new invoice
  InvoiceLineItemInput,            // Invoice line item
  CreateSubscriptionInput,         // Create a subscription
} from './billing/service';

export {
  invoices,                        // Invoices table
  invoiceLineItems,                // Invoice line items table
  subscriptions,                   // Subscriptions table
  subscriptionItems,               // Subscription line items
  billingPlans,                    // Billing plan definitions
  paymentSchedules,                // Installment schedules
  scheduledPayments,               // Individual scheduled payments
  creditNotes,                     // Credit notes table
  dunningRules,                    // Dunning/collection rules
  invoiceStatusEnum,               // Invoice status enum
  subscriptionStatusEnum,          // Subscription status enum
} from './billing/schema';

// ═══════════════════════════════════════════════════════════════════════════════
// BILLING — ADVANCED INVOICING (V2)
// ═══════════════════════════════════════════════════════════════════════════════

export {
  invoiceTemplates,                // Branded invoice templates
  invoicesV2,                      // Advanced invoices with templates
  proposals,                       // Sales proposals with e-signatures
  recurringInvoices,               // Scheduled invoice generation
  estimates,                       // Estimates / quotes with versioning
  approvalWorkflows,               // Multi-step approval workflows
  approvalRequests,                // Approval request tracking
  approvalDecisions,               // Individual approval decisions
  platformFeeConfigs,              // Stripe Connect fee configuration
  platformFeeLedger,               // Platform fee audit trail
  paymentReceipts,                 // Payment receipt records
} from './billing/invoicing-schema';

export type {
  InvoiceV2LineItem,               // Line item structure
  InvoiceReminder,                 // Reminder configuration
  InvoiceAddress,                  // Billing address
  InvoiceTaxConfig,                // Tax configuration
  ProposalContentBlock,            // Proposal content blocks
  RecurringTemplateConfig,         // Recurring invoice template
  TieredFeeConfig,                 // Tiered platform fee config
  EstimateVersionEntry,            // Estimate version history
  ApprovalRuleConfig,              // Approval rule definition
} from './billing/invoicing-schema';

// ═══════════════════════════════════════════════════════════════════════════════
// INTEGRATIONS
// ═══════════════════════════════════════════════════════════════════════════════

export {
  integrationService,              // External platform sync
} from './integrations/service';

export {
  accountingIntegrations,          // Integration connections
  integrationMappings,             // Entity ID mappings
  integrationSyncLogs,             // Sync execution logs
  bankConnections,                 // Bank feed connections
  bankTransactions,                // Imported bank transactions
  reconciliations,                 // Bank reconciliation records
  integrationProviderEnum,         // Provider enum
  syncDirectionEnum,               // Sync direction enum
} from './integrations/schema';

// ═══════════════════════════════════════════════════════════════════════════════
// TREASURY (Live Production Schema)
// ═══════════════════════════════════════════════════════════════════════════════

export {
  pnlEntries,                      // Profit & loss entries
  cashOperations,                  // Cash inflow/outflow/transfer
  fundingRounds,                   // Seed, Series A-C, IPO tracking
} from './treasury/schema';

export type {
  PnlEntryRow,                     // P&L entry row type
  CashOperationRow,                // Cash operation row type
  BudgetRow,                       // Budget row type (treasury)
  FundingRoundRow,                 // Funding round row type
  ExpenseRow,                      // Expense row type (treasury)
} from './treasury/schema';

// ═══════════════════════════════════════════════════════════════════════════════
// CLIENT HOOKS (React)
// ═══════════════════════════════════════════════════════════════════════════════

export { useChartOfAccounts } from './client/hooks/use-chart-of-accounts';
export { useJournalEntries } from './client/hooks/use-journal-entries';
export { useExpenses } from './client/hooks/use-expenses';
export { useExpenseApproval } from './client/hooks/use-expense-approval';
export { useBudget } from './client/hooks/use-budget';
export { useBudgetVsActual } from './client/hooks/use-budget-vs-actual';
export { useFinancialReports } from './client/hooks/use-financial-reports';
export { useInvoices } from './client/hooks/use-invoices';
export { useSubscriptions } from './client/hooks/use-subscriptions';
export { useReconciliation } from './client/hooks/use-reconciliation';
export { useBankFeed } from './client/hooks/use-bank-feed';

// ═══════════════════════════════════════════════════════════════════════════════
// CLIENT COMPONENTS (React)
// ═══════════════════════════════════════════════════════════════════════════════

export { ChartOfAccountsTree } from './client/components/chart-of-accounts-tree';
export { JournalEntryForm } from './client/components/journal-entry-form';
export { ExpenseReportBuilder } from './client/components/expense-report-builder';
export { ReceiptUploader } from './client/components/receipt-uploader';
export { ApprovalInbox } from './client/components/approval-inbox';
export { BudgetDashboard } from './client/components/budget-dashboard';
export { BudgetVsActualChart } from './client/components/budget-vs-actual-chart';
export { IncomeStatementView } from './client/components/income-statement-view';
export { BalanceSheetView } from './client/components/balance-sheet-view';
export { CashFlowView } from './client/components/cash-flow-view';
export { InvoiceEditor } from './client/components/invoice-editor';
export { InvoicePreview } from './client/components/invoice-preview';
export { SubscriptionManager } from './client/components/subscription-manager';
export { BankReconciliationPanel } from './client/components/bank-reconciliation-panel';
export { IntegrationSetupWizard } from './client/components/integration-setup-wizard';
export { FinancialDashboard } from './client/components/financial-dashboard';

// ═══════════════════════════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════════════════════════

export {
  ACCOUNT_TYPES,
  ACCOUNT_SUBTYPES,
  DEFAULT_CHART_OF_ACCOUNTS,
  EXPENSE_CATEGORIES,
  PAYMENT_TERMS,
  SUPPORTED_CURRENCIES,
  TAX_CODES,
  DEFAULT_MILEAGE_RATE,
  FISCAL_PERIOD_STATUSES,
  INTEGRATION_PROVIDERS,
} from './constants';

// ═══════════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════════

export type {
  // Accounting types
  AccountType,
  AccountSubtype,
  NormalBalance,
  FiscalPeriodStatus,
  JournalEntryStatus,

  // Expense types
  ExpenseStatus,
  ExpenseCategory,
  ExpensePolicy,
  ApprovalLevel,
  ApprovalDecision,
  ReceiptOcrData,

  // Budget types
  BudgetStatus,
  BudgetType,
  PeriodAllocation,
  ForecastMethod,
  ScenarioType,
  BudgetAlertSeverity,

  // Reporting types
  ReportType,
  ScheduleFrequency,
  ReportFormat,
  FinancialStatement,
  IncomeStatementData,
  BalanceSheetData,
  CashFlowData,
  AgedReceivablesData,

  // Billing types
  InvoiceStatus,
  SubscriptionStatus,
  PaymentTerms,
  CollectionMethod,
  DunningStep,

  // Integration types
  IntegrationProvider,
  SyncDirection,
  SyncStatus,
  ReconciliationStatus,
  MatchConfidence,
} from './types';
```

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────────────────────────┐
│                            @mcv/finance — FINANCE DOMAIN ARCHITECTURE                        │
│                                                                                              │
│  ┌───────────────────────────────────────────────────────────────────────────────────────┐   │
│  │                             ENTRY POINTS                                               │   │
│  │                                                                                        │   │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐              │   │
│  │  │  API Routes  │  │  Cron Jobs   │  │ Webhooks     │  │ NAOS Agents  │              │   │
│  │  │ /api/finance │  │  Renewals    │  │ Stripe/Plaid │  │  CFO Agent   │              │   │
│  │  │ /api/billing │  │  Reminders   │  │ QuickBooks   │  │  Bookkeeper  │              │   │
│  │  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘              │   │
│  │         │                 │                  │                 │                        │   │
│  │         └─────────────────┴──────────────────┴─────────────────┘                        │   │
│  │                                      │                                                  │   │
│  └──────────────────────────────────────┼──────────────────────────────────────────────────┘   │
│                                         │                                                      │
│  ┌──────────────────────────────────────▼──────────────────────────────────────────────────┐   │
│  │                             SERVICE LAYER                                                │   │
│  │                                                                                          │   │
│  │  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐                       │   │
│  │  │   ACCOUNTING     │  │    EXPENSES       │  │    BUDGETING     │                       │   │
│  │  │                  │  │                   │  │                  │                       │   │
│  │  │ • Chart of Accts │  │ • Expense CRUD    │  │ • Budget plans   │                       │   │
│  │  │ • Journal entries│  │ • Receipt OCR     │  │ • Allocations    │                       │   │
│  │  │ • Posting        │  │ • Policy check    │  │ • Forecasting    │                       │   │
│  │  │ • Reversals      │  │ • Approval chain  │  │ • Scenarios      │                       │   │
│  │  │ • Trial balance  │  │ • Reimbursement   │  │ • Transfers      │                       │   │
│  │  │ • Period closing  │  │ • Corporate cards │  │ • Alerts         │                       │   │
│  │  │ • Recurring JEs  │  │ • Analytics       │  │ • BvA compare    │                       │   │
│  │  └────────┬─────────┘  └────────┬──────────┘  └────────┬─────────┘                       │   │
│  │           │                     │                       │                                 │   │
│  │  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐                       │   │
│  │  │   REPORTING      │  │     BILLING       │  │  INTEGRATIONS    │                       │   │
│  │  │                  │  │                   │  │                  │                       │   │
│  │  │ • Income stmt    │  │ • Invoices (V2)   │  │ • QuickBooks     │                       │   │
│  │  │ • Balance sheet  │  │ • Proposals       │  │ • Xero           │                       │   │
│  │  │ • Cash flow      │  │ • Estimates       │  │ • Plaid bank     │                       │   │
│  │  │ • Aged AR/AP     │  │ • Subscriptions   │  │ • Auto-match     │                       │   │
│  │  │ • Custom reports │  │ • Credit notes    │  │ • Reconciliation │                       │   │
│  │  │ • Scheduled runs │  │ • Recurring inv.  │  │ • Entity mapping │                       │   │
│  │  │ • Export (PDF/XL)│  │ • Payment sched.  │  │ • Sync logs      │                       │   │
│  │  │ • Subscriptions  │  │ • Dunning rules   │  │ • Webhooks       │                       │   │
│  │  │                  │  │ • Platform fees   │  │                  │                       │   │
│  │  └────────┬─────────┘  └────────┬──────────┘  └────────┬─────────┘                       │   │
│  │           │                     │                       │                                 │   │
│  └───────────┴─────────────────────┴───────────────────────┴─────────────────────────────────┘   │
│                                         │                                                        │
│  ┌──────────────────────────────────────▼──────────────────────────────────────────────────────┐ │
│  │                            GENERAL LEDGER (Core)                                             │ │
│  │                                                                                              │ │
│  │  Every financial event in the system ultimately produces journal entries here.               │ │
│  │  Billing creates AR entries. Expenses create AP entries. Payments create cash entries.       │ │
│  │  All reporting reads from the ledger. Integrations sync the ledger externally.              │ │
│  │                                                                                              │ │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐                   │ │
│  │  │   Accounts   │  │  JE Headers  │  │   JE Lines   │  │  Balances    │                   │ │
│  │  │   (CoA)      │  │  (Entries)   │  │  (Debits/    │  │  (Period     │                   │ │
│  │  │              │  │              │  │   Credits)   │  │   Snapshots) │                   │ │
│  │  └──────────────┘  └──────────────┘  └──────────────┘  └──────────────┘                   │ │
│  │                                                                                              │ │
│  └──────────────────────────────────────────────────────────────────────────────────────────────┘ │
│                                         │                                                        │
│  ┌──────────────────────────────────────▼──────────────────────────────────────────────────────┐ │
│  │                            DATABASE LAYER (PostgreSQL)                                        │ │
│  │                                                                                              │ │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐            │ │
│  │  │Accounting│ │Expenses  │ │Budgeting │ │Reporting │ │ Billing  │ │Integrate │            │ │
│  │  │ 8 tables │ │ 6 tables │ │ 5 tables │ │ 4 tables │ │18 tables │ │ 5 tables │            │ │
│  │  └──────────┘ └──────────┘ └──────────┘ └──────────┘ └──────────┘ └──────────┘            │ │
│  │                                                                                              │ │
│  │  Treasury (Live):  pnl_entries  |  cash_operations  |  budgets  |  expenses  |  funding     │ │
│  │                                                                                              │ │
│  └──────────────────────────────────────────────────────────────────────────────────────────────┘ │
│                                                                                                    │
│  ┌──────────────────────────────────────────────────────────────────────────────────────────────┐ │
│  │                            EXTERNAL DEPENDENCIES                                              │ │
│  │                                                                                               │ │
│  │  @mcv/kernel          @mcv/payments          @mcv/documents         @mcv/notifications       │ │
│  │  (DB, context,        (Stripe payment        (PDF generation,       (Email, SMS,             │ │
│  │   errors, auth)        processing)            file storage)          push notifications)     │ │
│  │                                                                                               │ │
│  │  Stripe Connect       QuickBooks Online      Xero                   Plaid                    │ │
│  │  (Platform fees,      (GL sync,              (GL sync,              (Bank feeds,             │ │
│  │   payment links)       invoice push)          invoice push)          transactions)           │ │
│  │                                                                                               │ │
│  └──────────────────────────────────────────────────────────────────────────────────────────────┘ │
│                                                                                                    │
└────────────────────────────────────────────────────────────────────────────────────────────────────┘
```

### Data Flow: Invoice → Ledger

```
Customer Invoice Created
        │
        ▼
┌───────────────┐     ┌───────────────┐     ┌───────────────┐
│ billing       │────▶│ accounting    │────▶│ reporting     │
│               │     │               │     │               │
│ Create INV    │     │ Create JE:    │     │ AR shows on   │
│ status=draft  │     │ DR: AR  $1000 │     │ Balance Sheet │
│               │     │ CR: Rev $1000 │     │               │
└───────┬───────┘     └───────────────┘     └───────────────┘
        │ send
        ▼
┌───────────────┐     ┌───────────────┐     ┌───────────────┐
│ billing       │────▶│ accounting    │────▶│ integrations  │
│               │     │               │     │               │
│ Payment recv  │     │ Create JE:    │     │ Push to       │
│ status=paid   │     │ DR: Cash $1000│     │ QuickBooks    │
│               │     │ CR: AR  $1000 │     │ Xero          │
└───────────────┘     └───────────────┘     └───────────────┘
```

---

## Sub-Module Overview

| Module | Purpose | Tables | Key Operations |
|--------|---------|--------|----------------|
| **accounting** | Double-entry ledger, chart of accounts, fiscal periods | 8 | create account, post JE, trial balance, close period |
| **expenses** | Expense tracking, receipts, approval workflows | 6 | create expense, upload receipt, submit report, approve |
| **budgeting** | Budget planning, allocation, forecasting | 5 | create budget, record actual, forecast, scenarios |
| **reporting** | Financial statements, custom reports | 4 | income statement, balance sheet, cash flow, export |
| **billing** | Invoicing, subscriptions, payments, proposals | 18 | create invoice, send, record payment, subscribe |
| **integrations** | External accounting sync, bank feeds | 5 | connect QB/Xero, sync, bank feed, reconcile |

---

## Module: accounting

### Purpose

Implements double-entry bookkeeping with a flexible hierarchical chart of accounts, automated journal entries with multi-currency support, fiscal period management with opening/closing procedures, and a recurring journal engine for automated month-end entries.

Every financial transaction across the entire Finance domain — invoices, expenses, payments, reimbursements — ultimately flows through the general ledger as balanced journal entries (debits = credits). This is the backbone of the financial system.

### Chart of Accounts Structure

```
1xxx — Assets
  1000  Current Assets
    1010  Cash and Cash Equivalents
    1020  Accounts Receivable
    1030  Inventory
  1100  Fixed Assets
    1110  Equipment
    1120  Accumulated Depreciation

2xxx — Liabilities
  2000  Current Liabilities
    2010  Accounts Payable
    2020  Accrued Expenses
    2030  Unearned Revenue
  2100  Long-term Liabilities
    2110  Loans Payable

3xxx — Equity
  3000  Owner's Equity
    3010  Retained Earnings
    3020  Common Stock

4xxx — Revenue
  4000  Operating Revenue
    4010  Product Sales
    4020  Service Revenue
  4100  Other Revenue
    4110  Interest Income

5xxx — Expenses
  5000  Cost of Goods Sold
    5010  Direct Materials
    5020  Direct Labor
  5100  Operating Expenses
    5110  Salaries & Wages
    5120  Rent Expense
    5130  Utilities
```

### Database Schema

```typescript
// finance_accounts — Chart of Accounts
export const accounts = pgTable('finance_accounts', {
  ...baseColumns,                                       // id, ventureId, createdAt, etc.
  code: text('code').notNull(),                         // "1010" — hierarchical code
  name: text('name').notNull(),                         // "Cash and Cash Equivalents"
  description: text('description'),
  type: accountTypeEnum('type').notNull(),              // asset | liability | equity | revenue | expense
  subtype: accountSubtypeEnum('subtype').notNull(),     // cash | accounts_receivable | inventory | ...
  parentId: uuid('parent_id').references(() => accounts.id),
  currency: text('currency').default('USD'),
  isActive: boolean('is_active').default(true),
  isSystemAccount: boolean('is_system_account').default(false),
  normalBalance: text('normal_balance').notNull(),      // 'debit' | 'credit'
  openingBalance: numeric('opening_balance', { precision: 19, scale: 4 }).default('0'),
  currentBalance: numeric('current_balance', { precision: 19, scale: 4 }).default('0'),
  taxCode: text('tax_code'),
  bankAccountId: uuid('bank_account_id'),
  metadata: jsonb('metadata'),
});

// finance_fiscal_years — Fiscal Year Definitions
export const fiscalYears = pgTable('finance_fiscal_years', {
  ...baseColumns,
  name: text('name').notNull(),                         // "FY 2026"
  startDate: timestamp('start_date').notNull(),
  endDate: timestamp('end_date').notNull(),
  status: text('status').default('open'),               // open | closed
  isCurrent: boolean('is_current').default(false),
});

// finance_fiscal_periods — Monthly/Quarterly Periods
export const fiscalPeriods = pgTable('finance_fiscal_periods', {
  ...baseColumns,
  fiscalYearId: uuid('fiscal_year_id').notNull(),
  periodNumber: integer('period_number').notNull(),     // 1-12 for monthly
  periodName: text('period_name').notNull(),            // "January 2026"
  startDate: timestamp('start_date').notNull(),
  endDate: timestamp('end_date').notNull(),
  status: text('status').default('open'),               // open | closed | locked
  closedAt: timestamp('closed_at'),
  closedBy: uuid('closed_by'),
});

// finance_journal_entries — Journal Entry Headers
export const journalEntries = pgTable('finance_journal_entries', {
  ...baseColumns,
  entryNumber: text('entry_number').notNull(),          // "JE-2026-000001"
  entryDate: timestamp('entry_date').notNull(),
  fiscalPeriodId: uuid('fiscal_period_id').references(() => fiscalPeriods.id),
  description: text('description').notNull(),
  reference: text('reference'),                         // External reference
  sourceType: text('source_type'),                      // 'manual' | 'invoice' | 'expense' | 'payroll'
  sourceId: uuid('source_id'),                          // Links to originating record
  status: text('status').default('draft'),              // draft | posted | reversed
  postedAt: timestamp('posted_at'),
  postedBy: uuid('posted_by'),
  reversalOf: uuid('reversal_of'),                      // If this is a reversal entry
  isAdjusting: boolean('is_adjusting').default(false),
  totalDebit: numeric('total_debit', { precision: 19, scale: 4 }).default('0'),
  totalCredit: numeric('total_credit', { precision: 19, scale: 4 }).default('0'),
  attachments: jsonb('attachments'),
});

// finance_journal_entry_lines — Individual Debit/Credit Lines
export const journalEntryLines = pgTable('finance_journal_entry_lines', {
  ...baseColumns,
  journalEntryId: uuid('journal_entry_id').references(() => journalEntries.id).notNull(),
  accountId: uuid('account_id').references(() => accounts.id).notNull(),
  lineNumber: integer('line_number').notNull(),
  description: text('description'),
  debitAmount: numeric('debit_amount', { precision: 19, scale: 4 }),
  creditAmount: numeric('credit_amount', { precision: 19, scale: 4 }),
  currency: text('currency').default('USD'),
  exchangeRate: numeric('exchange_rate', { precision: 12, scale: 6 }).default('1'),
  baseCurrencyAmount: numeric('base_currency_amount', { precision: 19, scale: 4 }),
  taxCode: text('tax_code'),
  taxAmount: numeric('tax_amount', { precision: 19, scale: 4 }),
  departmentId: uuid('department_id'),
  projectId: uuid('project_id'),
  customerId: uuid('customer_id'),
  vendorId: uuid('vendor_id'),
  dimensions: jsonb('dimensions'),                      // Custom tracking dimensions
});

// finance_account_balances — Period Snapshots
export const accountBalances = pgTable('finance_account_balances', {
  ...baseColumns,
  accountId: uuid('account_id').references(() => accounts.id).notNull(),
  fiscalPeriodId: uuid('fiscal_period_id').references(() => fiscalPeriods.id).notNull(),
  openingDebit: numeric('opening_debit', { precision: 19, scale: 4 }).default('0'),
  openingCredit: numeric('opening_credit', { precision: 19, scale: 4 }).default('0'),
  periodDebit: numeric('period_debit', { precision: 19, scale: 4 }).default('0'),
  periodCredit: numeric('period_credit', { precision: 19, scale: 4 }).default('0'),
  closingDebit: numeric('closing_debit', { precision: 19, scale: 4 }).default('0'),
  closingCredit: numeric('closing_credit', { precision: 19, scale: 4 }).default('0'),
  netChange: numeric('net_change', { precision: 19, scale: 4 }).default('0'),
});

// finance_recurring_journals — Automated Recurring Entries
export const recurringJournals = pgTable('finance_recurring_journals', {
  ...baseColumns,
  name: text('name').notNull(),
  description: text('description'),
  templateEntry: jsonb('template_entry').notNull(),     // Journal entry template
  frequency: text('frequency').notNull(),               // daily | weekly | monthly | yearly
  startDate: timestamp('start_date').notNull(),
  endDate: timestamp('end_date'),
  nextRunDate: timestamp('next_run_date'),
  lastRunDate: timestamp('last_run_date'),
  isActive: boolean('is_active').default(true),
  autoPost: boolean('auto_post').default(false),
  totalGenerated: integer('total_generated').default(0),
});
```

### Core Interface

```typescript
export class AccountingService {
  // ── Chart of Accounts ────────────────────────────────────────────────
  createAccount(input: CreateAccountInput): Promise<Account>;
  getChartOfAccounts(options?: { type?: string; includeInactive?: boolean }): Promise<AccountTree>;

  // ── Journal Entries ──────────────────────────────────────────────────
  createJournalEntry(input: CreateJournalEntryInput): Promise<{ entry: JournalEntry; lines: JournalEntryLine[] }>;
  postJournalEntry(entryId: string): Promise<JournalEntry>;
  reverseJournalEntry(entryId: string, reversalDate: Date, reason: string): Promise<{ entry: JournalEntry; lines: JournalEntryLine[] }>;

  // ── Trial Balance & Reporting ────────────────────────────────────────
  getTrialBalance(fiscalPeriodId: string): Promise<TrialBalance>;

  // ── Period Management ────────────────────────────────────────────────
  closeFiscalPeriod(periodId: string): Promise<FiscalPeriod>;
}
```

### Key Behaviors

1. **Balance enforcement**: Every journal entry validates that `totalDebit === totalCredit` before saving. Unbalanced entries throw `VALIDATION_ERROR`.
2. **Normal balance**: Assets and expenses have debit normal balances; liabilities, equity, and revenue have credit normal balances. This determines how account balances are calculated.
3. **Period protection**: Journal entries cannot be posted to closed or locked fiscal periods (`BUSINESS_RULE_VIOLATION`).
4. **Reversal**: Reversing a posted entry creates a new entry with debits and credits swapped, then posts it automatically.
5. **Auto-numbering**: Entry numbers follow the pattern `JE-{year}-{sequence}` with zero-padded 6-digit sequences.

---

## Module: expenses

### Purpose

Manages the full expense lifecycle from initial creation through receipt capture, policy validation, multi-level approval workflows, accounting journal entry generation, and final reimbursement. Includes corporate card management and transaction matching.

### Database Schema

```typescript
// finance_expense_reports — Expense Report Headers
export const expenseReports = pgTable('finance_expense_reports', {
  ...baseColumns,
  reportNumber: text('report_number').notNull(),        // "EXP-202602-0001"
  title: text('title').notNull(),
  description: text('description'),
  employeeId: uuid('employee_id').notNull(),
  departmentId: uuid('department_id'),
  projectId: uuid('project_id'),
  status: expenseStatusEnum('status').default('draft'),  // draft → submitted → pending_approval → approved → reimbursed
  submittedAt: timestamp('submitted_at'),
  approvedAt: timestamp('approved_at'),
  approvedBy: uuid('approved_by'),
  rejectedAt: timestamp('rejected_at'),
  rejectedBy: uuid('rejected_by'),
  rejectionReason: text('rejection_reason'),
  paidAt: timestamp('paid_at'),
  paymentMethod: text('payment_method'),
  paymentReference: text('payment_reference'),
  totalAmount: numeric('total_amount', { precision: 19, scale: 4 }).default('0'),
  currency: text('currency').default('USD'),
  reimbursableAmount: numeric('reimbursable_amount', { precision: 19, scale: 4 }),
  nonReimbursableAmount: numeric('non_reimbursable_amount', { precision: 19, scale: 4 }),
  startDate: timestamp('start_date'),
  endDate: timestamp('end_date'),
  purpose: text('purpose'),
  policyViolations: jsonb('policy_violations'),
});

// finance_expenses — Individual Expense Items
export const expenses = pgTable('finance_expenses', {
  ...baseColumns,
  expenseReportId: uuid('expense_report_id').references(() => expenseReports.id),
  employeeId: uuid('employee_id').notNull(),
  merchantName: text('merchant_name').notNull(),
  merchantLocation: text('merchant_location'),
  expenseDate: timestamp('expense_date').notNull(),
  category: expenseCategoryEnum('category').notNull(),   // travel | meals | lodging | software | equipment | ...
  subcategory: text('subcategory'),
  description: text('description').notNull(),
  amount: numeric('amount', { precision: 19, scale: 4 }).notNull(),
  currency: text('currency').default('USD'),
  exchangeRate: numeric('exchange_rate', { precision: 12, scale: 6 }),
  baseCurrencyAmount: numeric('base_currency_amount', { precision: 19, scale: 4 }),
  isReimbursable: boolean('is_reimbursable').default(true),
  isBillable: boolean('is_billable').default(false),
  customerId: uuid('customer_id'),
  projectId: uuid('project_id'),
  departmentId: uuid('department_id'),
  accountId: uuid('account_id'),                         // GL account override
  paymentMethod: text('payment_method'),
  cardLastFour: text('card_last_four'),
  receiptStatus: text('receipt_status').default('pending'), // pending | uploaded | missing | exempt
  receiptUrl: text('receipt_url'),
  receiptOcrData: jsonb('receipt_ocr_data'),             // Extracted data from receipt OCR
  mileage: numeric('mileage', { precision: 10, scale: 2 }),
  mileageRate: numeric('mileage_rate', { precision: 10, scale: 4 }),
  attendees: jsonb('attendees'),                         // Meeting/meal attendees
  policyViolations: jsonb('policy_violations'),
  tags: text('tags').array(),
});

// finance_expense_policies — Policy Rules
export const expensePolicies = pgTable('finance_expense_policies', {
  ...baseColumns,
  name: text('name').notNull(),
  description: text('description'),
  isDefault: boolean('is_default').default(false),
  isActive: boolean('is_active').default(true),
  rules: jsonb('rules').notNull(),
  // rules: {
  //   maxPerDiem: { meals: 75, lodging: 200, total: 350 },
  //   requireReceipt: { above: 25, always: ['lodging', 'equipment'] },
  //   requireApproval: { above: 100 },
  //   allowedCategories: ['travel', 'meals', 'lodging'],
  //   blockedMerchants: ['Casino XYZ'],
  //   mileageRate: 0.67,
  //   advanceNotice: { international: 14, domestic: 3 },
  //   maxAdvance: 5000,
  // }
  appliesToRoles: text('applies_to_roles').array(),
  appliesToDepartments: uuid('applies_to_departments').array(),
  effectiveFrom: timestamp('effective_from'),
  effectiveTo: timestamp('effective_to'),
});

// finance_expense_approvals — Approval Chain
export const expenseApprovals = pgTable('finance_expense_approvals', {
  ...baseColumns,
  expenseReportId: uuid('expense_report_id').references(() => expenseReports.id).notNull(),
  approverId: uuid('approver_id').notNull(),
  approvalLevel: integer('approval_level').notNull(),
  status: text('status').default('pending'),             // pending | approved | rejected | delegated
  decision: text('decision'),
  comments: text('comments'),
  decidedAt: timestamp('decided_at'),
  delegatedTo: uuid('delegated_to'),
  delegatedAt: timestamp('delegated_at'),
  delegationReason: text('delegation_reason'),
  dueDate: timestamp('due_date'),
  reminderSentAt: timestamp('reminder_sent_at'),
});

// finance_expense_approval_workflows — Multi-Level Workflow Definitions
export const expenseApprovalWorkflows = pgTable('finance_expense_approval_workflows', {
  ...baseColumns,
  name: text('name').notNull(),
  description: text('description'),
  isDefault: boolean('is_default').default(false),
  isActive: boolean('is_active').default(true),
  levels: jsonb('levels').notNull(),
  // levels: [
  //   { level: 1, type: 'manager', threshold: 0 },
  //   { level: 2, type: 'department_head', threshold: 1000 },
  //   { level: 3, type: 'finance', threshold: 5000 },
  //   { level: 4, type: 'cfo', threshold: 10000 },
  // ]
  conditions: jsonb('conditions'),
  escalationRules: jsonb('escalation_rules'),
});

// finance_corporate_cards — Card Management
export const corporateCards = pgTable('finance_corporate_cards', {
  ...baseColumns,
  employeeId: uuid('employee_id').notNull(),
  cardName: text('card_name').notNull(),
  lastFour: text('last_four').notNull(),
  cardProvider: text('card_provider').notNull(),         // visa | mastercard | amex
  cardType: text('card_type').notNull(),                 // physical | virtual
  status: text('status').default('active'),
  spendLimit: numeric('spend_limit', { precision: 19, scale: 4 }),
  spendLimitPeriod: text('spend_limit_period'),          // daily | weekly | monthly
  currentSpend: numeric('current_spend', { precision: 19, scale: 4 }).default('0'),
  allowedCategories: text('allowed_categories').array(),
  blockedMccCodes: text('blocked_mcc_codes').array(),
  expiresAt: timestamp('expires_at'),
  externalCardId: text('external_card_id'),
  metadata: jsonb('metadata'),
});

// finance_card_transactions — Card Transaction Log
export const cardTransactions = pgTable('finance_card_transactions', {
  ...baseColumns,
  corporateCardId: uuid('corporate_card_id').references(() => corporateCards.id).notNull(),
  expenseId: uuid('expense_id').references(() => expenses.id),
  transactionId: text('transaction_id').notNull(),
  merchantName: text('merchant_name').notNull(),
  merchantCategory: text('merchant_category'),
  mccCode: text('mcc_code'),
  amount: numeric('amount', { precision: 19, scale: 4 }).notNull(),
  currency: text('currency').default('USD'),
  transactionDate: timestamp('transaction_date').notNull(),
  postedDate: timestamp('posted_date'),
  status: text('status').default('pending'),             // pending | posted | declined | reversed
  declineReason: text('decline_reason'),
  isMatched: boolean('is_matched').default(false),
  matchedAt: timestamp('matched_at'),
});
```

### Core Interface

```typescript
export class ExpenseService {
  // ── Expense CRUD ─────────────────────────────────────────────────────
  createExpense(input: CreateExpenseInput): Promise<Expense>;
  uploadReceipt(expenseId: string, receiptUrl: string): Promise<Expense>;

  // ── Expense Reports ──────────────────────────────────────────────────
  createExpenseReport(input: CreateExpenseReportInput): Promise<ExpenseReport>;
  submitExpenseReport(reportId: string): Promise<ExpenseReport>;

  // ── Approval Workflow ────────────────────────────────────────────────
  processApproval(reportId: string, decision: 'approved' | 'rejected', comments?: string): Promise<ExpenseReport>;
  processReimbursement(reportId: string, paymentMethod: string, paymentReference: string): Promise<ExpenseReport>;

  // ── Analytics ────────────────────────────────────────────────────────
  getExpenseAnalytics(startDate: Date, endDate: Date, groupBy?: string): Promise<AnalyticsRow[]>;
}
```

### Approval Workflow State Machine

```
┌──────────┐    submit     ┌───────────┐    Level 1    ┌──────────────────┐
│          │──────────────▶│           │──────────────▶│                  │
│  DRAFT   │               │ SUBMITTED │               │ PENDING_APPROVAL │
│          │◀──────────────│           │               │                  │
└──────────┘    recall     └───────────┘               └────────┬─────────┘
                                                                │
                                               ┌────────────────┼────────────────┐
                                               │ approve         │ reject          │
                                               ▼                 │                 ▼
                                    ┌──────────────────┐         │      ┌──────────────┐
                                    │ Next level?       │         │      │              │
                                    │                   │         │      │  REJECTED    │
                                    │ YES → loop back   │         │      │              │
                                    │ NO  → APPROVED    │         │      └──────────────┘
                                    └─────────┬────────┘         │
                                              │ all approved     │
                                              ▼                  │
                                    ┌──────────────────┐         │
                                    │                  │         │
                                    │    APPROVED      │         │
                                    │                  │         │
                                    └─────────┬────────┘         │
                                              │ reimburse        │
                                              ▼                  │
                                    ┌──────────────────┐         │
                                    │                  │         │
                                    │   REIMBURSED     │         │
                                    │                  │         │
                                    └──────────────────┘         │
```

### Key Behaviors

1. **Policy enforcement**: Every expense is validated against the employee's applicable expense policy at creation time. Violations are recorded but don't block creation — they flag the expense for reviewer attention.
2. **Receipt requirements**: Policies define when receipts are required (above $25, always for lodging/equipment). Missing receipts block report submission.
3. **Automatic GL entries**: When an expense report is approved, the system automatically creates journal entries (DR: Expense accounts, CR: Accounts Payable — Employee Reimbursements). Reimbursement creates the follow-up entry (DR: AP, CR: Cash).
4. **Multi-level approval**: Approval levels cascade based on amount thresholds. Level 1 activates on submit; subsequent levels activate only when the prior level approves.
5. **OCR integration**: Receipt uploads are processed with OCR to auto-fill merchant name, amount, and date.

---

## Module: budgeting

### Purpose

Enables budget planning and allocation across departments, projects, and cost centers. Tracks actuals against budgets in real time, generates forecasts using linear/seasonal/ML methods, and supports what-if scenario analysis for strategic planning.

### Database Schema

```typescript
// finance_budgets — Budget Headers
export const budgets = pgTable('finance_budgets', {
  ...baseColumns,
  name: text('name').notNull(),
  description: text('description'),
  budgetType: text('budget_type').notNull(),             // annual | quarterly | project | department
  fiscalYearId: uuid('fiscal_year_id'),
  departmentId: uuid('department_id'),
  projectId: uuid('project_id'),
  status: budgetStatusEnum('status').default('draft'),   // draft → pending_approval → approved → active → closed
  version: integer('version').default(1),
  parentBudgetId: uuid('parent_budget_id'),              // For budget revisions
  startDate: timestamp('start_date').notNull(),
  endDate: timestamp('end_date').notNull(),
  currency: text('currency').default('USD'),
  totalBudget: numeric('total_budget', { precision: 19, scale: 4 }).default('0'),
  totalAllocated: numeric('total_allocated', { precision: 19, scale: 4 }).default('0'),
  totalActual: numeric('total_actual', { precision: 19, scale: 4 }).default('0'),
  totalCommitted: numeric('total_committed', { precision: 19, scale: 4 }).default('0'),
  approvedAt: timestamp('approved_at'),
  approvedBy: uuid('approved_by'),
  lockedAt: timestamp('locked_at'),
  notes: text('notes'),
  metadata: jsonb('metadata'),
});

// finance_budget_lines — Individual Line Items
export const budgetLines = pgTable('finance_budget_lines', {
  ...baseColumns,
  budgetId: uuid('budget_id').references(() => budgets.id).notNull(),
  accountId: uuid('account_id').notNull(),               // Linked GL account
  categoryName: text('category_name').notNull(),
  description: text('description'),
  budgetAmount: numeric('budget_amount', { precision: 19, scale: 4 }).notNull(),
  actualAmount: numeric('actual_amount', { precision: 19, scale: 4 }).default('0'),
  committedAmount: numeric('committed_amount', { precision: 19, scale: 4 }).default('0'),
  variance: numeric('variance', { precision: 19, scale: 4 }).default('0'),
  variancePercent: numeric('variance_percent', { precision: 10, scale: 4 }).default('0'),
  periodAllocations: jsonb('period_allocations'),
  // { '2026-01': { budget: 10000, actual: 9500 }, '2026-02': { budget: 10000, actual: 0 }, ... }
  notes: text('notes'),
  isCapex: boolean('is_capex').default(false),
  costCenter: text('cost_center'),
});

// finance_budget_transfers — Inter-Line Transfers
export const budgetTransfers = pgTable('finance_budget_transfers', {
  ...baseColumns,
  fromBudgetLineId: uuid('from_budget_line_id').references(() => budgetLines.id).notNull(),
  toBudgetLineId: uuid('to_budget_line_id').references(() => budgetLines.id).notNull(),
  amount: numeric('amount', { precision: 19, scale: 4 }).notNull(),
  reason: text('reason').notNull(),
  status: text('status').default('pending'),             // pending | approved | rejected
  requestedBy: uuid('requested_by').notNull(),
  approvedBy: uuid('approved_by'),
  approvedAt: timestamp('approved_at'),
});

// finance_budget_forecasts — Predictive Forecasting
export const budgetForecasts = pgTable('finance_budget_forecasts', {
  ...baseColumns,
  budgetId: uuid('budget_id').references(() => budgets.id).notNull(),
  forecastDate: timestamp('forecast_date').notNull(),
  forecastType: text('forecast_type').notNull(),         // linear | seasonal | ml_based
  periodForecasts: jsonb('period_forecasts').notNull(),
  // [{ period: '2026-03', predicted: 12000, confidence: 0.85, range: { low: 10000, high: 14000 } }]
  accuracy: numeric('accuracy', { precision: 5, scale: 4 }),
  modelParameters: jsonb('model_parameters'),
  notes: text('notes'),
});

// finance_budget_scenarios — What-If Analysis
export const budgetScenarios = pgTable('finance_budget_scenarios', {
  ...baseColumns,
  budgetId: uuid('budget_id').references(() => budgets.id).notNull(),
  name: text('name').notNull(),
  description: text('description'),
  scenarioType: text('scenario_type').notNull(),         // best_case | worst_case | most_likely | custom
  assumptions: jsonb('assumptions').notNull(),
  // { revenueGrowth: 0.15, costInflation: 0.03, headcountChange: 5 }
  lineAdjustments: jsonb('line_adjustments'),
  // { 'budget_line_id_1': { factor: 1.1, override: null } }
  projectedTotal: numeric('projected_total', { precision: 19, scale: 4 }),
  isActive: boolean('is_active').default(true),
});

// finance_budget_alerts — Threshold Monitoring
export const budgetAlerts = pgTable('finance_budget_alerts', {
  ...baseColumns,
  budgetId: uuid('budget_id').references(() => budgets.id),
  budgetLineId: uuid('budget_line_id').references(() => budgetLines.id),
  alertType: text('alert_type').notNull(),               // threshold | overspend | variance | forecast
  threshold: numeric('threshold', { precision: 10, scale: 4 }),
  thresholdType: text('threshold_type'),                 // percent | absolute
  currentValue: numeric('current_value', { precision: 19, scale: 4 }),
  message: text('message').notNull(),
  severity: text('severity').default('warning'),         // info | warning | critical
  status: text('status').default('active'),              // active | acknowledged | resolved
  triggeredAt: timestamp('triggered_at').notNull(),
  acknowledgedAt: timestamp('acknowledged_at'),
  acknowledgedBy: uuid('acknowledged_by'),
  notifiedUsers: jsonb('notified_users'),
});
```

### Core Interface

```typescript
export class BudgetingService {
  // ── Budget CRUD ──────────────────────────────────────────────────────
  createBudget(input: CreateBudgetInput): Promise<{ budget: Budget; lines: BudgetLine[] }>;
  submitBudget(budgetId: string): Promise<Budget>;
  approveBudget(budgetId: string): Promise<Budget>;

  // ── Tracking ─────────────────────────────────────────────────────────
  recordActual(budgetLineId: string, amount: string, period: string): Promise<BudgetLine>;
  requestTransfer(input: TransferInput): Promise<BudgetTransfer>;
  approveTransfer(transferId: string): Promise<BudgetTransfer>;

  // ── Analysis ─────────────────────────────────────────────────────────
  getBudgetVsActual(budgetId: string): Promise<BudgetComparison>;
  generateForecast(budgetId: string, method?: ForecastMethod): Promise<BudgetForecast>;
  createScenario(input: ScenarioInput): Promise<BudgetScenario>;
}
```

### Key Behaviors

1. **Auto-distribution**: When budget lines don't specify period allocations, the system distributes the total amount evenly across all months in the budget range.
2. **Threshold alerts**: On budget approval, the system automatically creates monitoring alerts at 75%, 90%, and 100% utilization. Critical alerts fire at 100%.
3. **Variance tracking**: Every time an actual is recorded, the system recalculates variance (budget − actual) and variance percentage, then checks alert thresholds.
4. **Transfer validation**: Budget transfers validate that the source line has sufficient unspent budget (budget − actual − committed) before allowing the transfer.
5. **Forecast methods**: Linear regression for simple trends, seasonal decomposition for cyclical patterns, ML-based for complex historical analysis.

---

## Module: reporting

### Purpose

Generates standard GAAP financial statements (Income Statement, Balance Sheet, Cash Flow Statement) and aging reports. Supports custom report definitions with formula-based calculated columns, scheduled report generation with email delivery, and export to PDF, Excel, and CSV formats.

### Database Schema

```typescript
// finance_reports — Report Definitions
export const financialReports = pgTable('finance_reports', {
  ...baseColumns,
  name: text('name').notNull(),
  description: text('description'),
  reportType: reportTypeEnum('report_type').notNull(),   // income_statement | balance_sheet | cash_flow | ...
  isTemplate: boolean('is_template').default(false),
  configuration: jsonb('configuration').notNull(),
  // configuration: {
  //   dateRange: { type: 'period', periodId: 'uuid' } | { type: 'custom', start: Date, end: Date },
  //   compareWith: 'prior_period' | 'prior_year' | 'budget',
  //   filters: { departments: [], projects: [], accounts: [] },
  //   groupBy: ['department', 'project'],
  //   columns: ['actual', 'budget', 'variance', 'variance_pct'],
  //   showZeroBalances: false,
  //   roundToNearest: 1,
  // }
  schedule: reportScheduleEnum('schedule').default('on_demand'),
  scheduleConfig: jsonb('schedule_config'),
  // { dayOfWeek: 1, dayOfMonth: 1, time: '08:00', timezone: 'America/New_York', recipients: [...], format: 'pdf' }
  lastRunAt: timestamp('last_run_at'),
  nextRunAt: timestamp('next_run_at'),
  isActive: boolean('is_active').default(true),
  createdBy: uuid('created_by'),
});

// finance_report_runs — Execution Log
export const reportRuns = pgTable('finance_report_runs', {
  ...baseColumns,
  reportId: uuid('report_id').references(() => financialReports.id).notNull(),
  status: text('status').default('pending'),             // pending | running | completed | failed
  startedAt: timestamp('started_at'),
  completedAt: timestamp('completed_at'),
  configuration: jsonb('configuration'),                 // Snapshot of config at run time
  results: jsonb('results'),                             // Cached report output
  resultFileUrl: text('result_file_url'),
  resultFormat: text('result_format'),
  errorMessage: text('error_message'),
  triggeredBy: text('triggered_by'),                     // 'schedule' | 'manual'
  triggeredByUser: uuid('triggered_by_user'),
});

// finance_report_subscriptions — Email Delivery
export const reportSubscriptions = pgTable('finance_report_subscriptions', {
  ...baseColumns,
  reportId: uuid('report_id').references(() => financialReports.id).notNull(),
  userId: uuid('user_id').notNull(),
  email: text('email'),
  format: text('format').default('pdf'),
  isActive: boolean('is_active').default(true),
});

// finance_custom_report_definitions — Report Builder
export const customReportDefinitions = pgTable('finance_custom_report_definitions', {
  ...baseColumns,
  name: text('name').notNull(),
  description: text('description'),
  baseReportType: text('base_report_type'),
  columns: jsonb('columns').notNull(),
  // [{ id: 'col1', name: 'Account', type: 'text', source: 'account.name' },
  //  { id: 'col4', name: 'Change', type: 'currency', formula: 'col2 - col3' }]
  rows: jsonb('rows').notNull(),
  // [{ id: 'row1', type: 'header', label: 'ASSETS' },
  //  { id: 'row2', type: 'account_group', accountTypes: ['asset'], subtypes: ['cash'] },
  //  { id: 'row3', type: 'subtotal', label: 'Total Cash', sumRows: ['row2'] }]
  formatting: jsonb('formatting'),
  isPublic: boolean('is_public').default(false),
});
```

### Core Interface

```typescript
export class ReportingService {
  // ── Standard Statements ──────────────────────────────────────────────
  generateIncomeStatement(options: ReportOptions): Promise<IncomeStatementData>;
  generateBalanceSheet(options: ReportOptions): Promise<BalanceSheetData>;
  generateCashFlowStatement(options: ReportOptions): Promise<CashFlowData>;
  generateAgedReceivables(asOfDate?: Date): Promise<AgedReceivablesData>;

  // ── Custom Reports ───────────────────────────────────────────────────
  createCustomReport(input: CustomReportInput): Promise<CustomReportDefinition>;

  // ── Scheduling & Export ──────────────────────────────────────────────
  scheduleReport(reportId: string, schedule: ScheduleConfig): Promise<FinancialReport>;
  exportReport(reportType: string, options: ReportOptions, format: 'pdf' | 'excel' | 'csv'): Promise<ExportResult>;
}
```

### Report Output Structure: Income Statement

```typescript
interface IncomeStatementData {
  title: 'Income Statement';
  subtitle: string;                                     // "For the period 2026-01-01 to 2026-12-31"
  generatedAt: Date;
  sections: [
    {
      title: 'Revenue';
      accounts: AccountRow[];                            // Each with code, name, balance, prior, variance
      total: string;
      priorTotal: string | null;
      variance: string | null;
    },
    {
      title: 'Expenses';
      subsections: Array<{                               // Grouped by subtype (COGS, Operating, Payroll, etc.)
        title: string;
        accounts: AccountRow[];
        subtotal: string;
      }>;
      total: string;
      priorTotal: string | null;
      variance: string | null;
    },
  ];
  summary: {
    grossProfit: string;
    totalExpenses: string;
    netIncome: string;
    netIncomeMargin: string;                             // Percentage
    priorNetIncome: string | null;
    netIncomeChange: string | null;
  };
}
```

### Key Behaviors

1. **Comparison modes**: Every report supports comparison with prior period, prior year, or budget values. Comparison data is fetched in parallel.
2. **Balance sheet validation**: The balance sheet verifies that `Total Assets === Total Liabilities + Total Equity`. Any imbalance is flagged with `isBalanced: false`.
3. **Aging buckets**: Aged receivables/payables use standard buckets: Current, 1–30 days, 31–60 days, 61–90 days, 90+ days. Results are grouped by customer/vendor.
4. **Custom formulas**: Custom report columns support arithmetic formulas referencing other columns by ID (e.g., `'col2 - col3'`).
5. **Scheduled delivery**: Reports can be scheduled daily/weekly/monthly/quarterly with email delivery in PDF/Excel/CSV formats.

---

## Module: billing

### Purpose

Manages the full billing lifecycle including customer invoice creation with branded templates, proposals with e-signatures, estimates with versioning, recurring invoice generation, subscription management, credit notes, payment schedules, dunning automation, and platform fee management for the Stripe Connect ecosystem.

This module encompasses two schema layers:
- **Core billing** (`finance_invoices`, `finance_subscriptions`, etc.) — The full-featured accounting-integrated billing system
- **Advanced invoicing V2** (`invoices_v2`, `proposals`, `estimates`, etc.) — The production invoicing schema with branded templates, Stripe payment links, approval workflows, and platform fees

### Database Schema — Core Billing

```typescript
// finance_invoices — Invoice Headers
export const invoices = pgTable('finance_invoices', {
  ...baseColumns,
  invoiceNumber: text('invoice_number').notNull(),
  customerId: uuid('customer_id').notNull(),
  subscriptionId: uuid('subscription_id'),
  status: invoiceStatusEnum('status').default('draft'),  // draft → sent → viewed → partial → paid
  invoiceDate: timestamp('invoice_date').notNull(),
  dueDate: timestamp('due_date').notNull(),
  currency: text('currency').default('USD'),
  subtotal: numeric('subtotal', { precision: 19, scale: 4 }).default('0'),
  taxAmount: numeric('tax_amount', { precision: 19, scale: 4 }).default('0'),
  discountAmount: numeric('discount_amount', { precision: 19, scale: 4 }).default('0'),
  totalAmount: numeric('total_amount', { precision: 19, scale: 4 }).notNull(),
  amountPaid: numeric('amount_paid', { precision: 19, scale: 4 }).default('0'),
  amountDue: numeric('amount_due', { precision: 19, scale: 4 }),
  billingAddress: jsonb('billing_address'),
  shippingAddress: jsonb('shipping_address'),
  paymentTerms: text('payment_terms').default('net_30'),
  memo: text('memo'),
  footer: text('footer'),
  sentAt: timestamp('sent_at'),
  viewedAt: timestamp('viewed_at'),
  paidAt: timestamp('paid_at'),
  voidedAt: timestamp('voided_at'),
  voidReason: text('void_reason'),
  externalInvoiceId: text('external_invoice_id'),
  pdfUrl: text('pdf_url'),
  metadata: jsonb('metadata'),
});

// finance_invoice_line_items — Line Items
export const invoiceLineItems = pgTable('finance_invoice_line_items', {
  ...baseColumns,
  invoiceId: uuid('invoice_id').references(() => invoices.id).notNull(),
  lineNumber: integer('line_number').notNull(),
  productId: uuid('product_id'),
  description: text('description').notNull(),
  quantity: numeric('quantity', { precision: 15, scale: 4 }).default('1'),
  unitPrice: numeric('unit_price', { precision: 19, scale: 4 }).notNull(),
  amount: numeric('amount', { precision: 19, scale: 4 }).notNull(),
  taxable: boolean('taxable').default(true),
  taxRate: numeric('tax_rate', { precision: 6, scale: 4 }),
  taxAmount: numeric('tax_amount', { precision: 19, scale: 4 }),
  discountPercent: numeric('discount_percent', { precision: 6, scale: 4 }),
  discountAmount: numeric('discount_amount', { precision: 19, scale: 4 }),
  accountId: uuid('account_id'),                         // GL account for revenue recognition
  periodStart: timestamp('period_start'),
  periodEnd: timestamp('period_end'),
  metadata: jsonb('metadata'),
});

// finance_subscriptions — Recurring Billing
export const subscriptions = pgTable('finance_subscriptions', {
  ...baseColumns,
  subscriptionNumber: text('subscription_number').notNull(),
  customerId: uuid('customer_id').notNull(),
  planId: uuid('plan_id').notNull(),
  status: subscriptionStatusEnum('status').default('active'), // trialing → active → past_due → cancelled
  currency: text('currency').default('USD'),
  quantity: integer('quantity').default(1),
  unitAmount: numeric('unit_amount', { precision: 19, scale: 4 }).notNull(),
  totalAmount: numeric('total_amount', { precision: 19, scale: 4 }).notNull(),
  interval: text('interval').notNull(),                  // day | week | month | year
  intervalCount: integer('interval_count').default(1),
  anchorDate: timestamp('anchor_date').notNull(),
  currentPeriodStart: timestamp('current_period_start').notNull(),
  currentPeriodEnd: timestamp('current_period_end').notNull(),
  trialStart: timestamp('trial_start'),
  trialEnd: timestamp('trial_end'),
  cancelAtPeriodEnd: boolean('cancel_at_period_end').default(false),
  cancelledAt: timestamp('cancelled_at'),
  cancellationReason: text('cancellation_reason'),
  pausedAt: timestamp('paused_at'),
  resumeAt: timestamp('resume_at'),
  defaultPaymentMethodId: uuid('default_payment_method_id'),
  collectionMethod: text('collection_method').default('charge_automatically'),
  daysUntilDue: integer('days_until_due'),
  prorationBehavior: text('proration_behavior').default('create_prorations'),
  metadata: jsonb('metadata'),
});

// finance_billing_plans — Plan Definitions
export const billingPlans = pgTable('finance_billing_plans', {
  ...baseColumns,
  name: text('name').notNull(),
  description: text('description'),
  productId: uuid('product_id'),
  isActive: boolean('is_active').default(true),
  currency: text('currency').default('USD'),
  amount: numeric('amount', { precision: 19, scale: 4 }).notNull(),
  interval: text('interval').notNull(),
  intervalCount: integer('interval_count').default(1),
  trialPeriodDays: integer('trial_period_days'),
  features: jsonb('features'),
  limits: jsonb('limits'),
  metadata: jsonb('metadata'),
});

// finance_payment_schedules — Installment Plans
export const paymentSchedules = pgTable('finance_payment_schedules', {
  ...baseColumns,
  invoiceId: uuid('invoice_id').references(() => invoices.id),
  subscriptionId: uuid('subscription_id').references(() => subscriptions.id),
  customerId: uuid('customer_id').notNull(),
  totalAmount: numeric('total_amount', { precision: 19, scale: 4 }).notNull(),
  paidAmount: numeric('paid_amount', { precision: 19, scale: 4 }).default('0'),
  remainingAmount: numeric('remaining_amount', { precision: 19, scale: 4 }),
  numberOfPayments: integer('number_of_payments').notNull(),
  completedPayments: integer('completed_payments').default(0),
  frequency: text('frequency').notNull(),                // weekly | biweekly | monthly
  startDate: timestamp('start_date').notNull(),
  nextPaymentDate: timestamp('next_payment_date'),
  status: text('status').default('active'),
  metadata: jsonb('metadata'),
});

// finance_credit_notes — Credit/Refund Notes
export const creditNotes = pgTable('finance_credit_notes', {
  ...baseColumns,
  creditNoteNumber: text('credit_note_number').notNull(),
  invoiceId: uuid('invoice_id').references(() => invoices.id),
  customerId: uuid('customer_id').notNull(),
  status: text('status').default('issued'),              // issued | applied | void
  amount: numeric('amount', { precision: 19, scale: 4 }).notNull(),
  remainingAmount: numeric('remaining_amount', { precision: 19, scale: 4 }),
  reason: text('reason').notNull(),
  memo: text('memo'),
  issuedAt: timestamp('issued_at').notNull(),
  appliedAt: timestamp('applied_at'),
  voidedAt: timestamp('voided_at'),
  metadata: jsonb('metadata'),
});

// finance_dunning_rules — Collection Automation
export const dunningRules = pgTable('finance_dunning_rules', {
  ...baseColumns,
  name: text('name').notNull(),
  description: text('description'),
  isDefault: boolean('is_default').default(false),
  isActive: boolean('is_active').default(true),
  steps: jsonb('steps').notNull(),
  // [{ daysOverdue: 1, action: 'email', template: 'payment_reminder' },
  //  { daysOverdue: 7, action: 'email', template: 'payment_reminder_2' },
  //  { daysOverdue: 14, action: 'sms', template: 'payment_urgent' },
  //  { daysOverdue: 30, action: 'pause_subscription' },
  //  { daysOverdue: 60, action: 'cancel_subscription' }]
  maxRetries: integer('max_retries').default(4),
  retrySchedule: jsonb('retry_schedule'),
});
```

### Database Schema — Advanced Invoicing V2 (Production)

```typescript
// invoice_templates — Branded Invoice Templates
export const invoiceTemplates = pgTable('invoice_templates', {
  id: uuid('id').primaryKey().defaultRandom(),
  ventureId: uuid('venture_id').references(() => ventures.id, { onDelete: 'cascade' }).notNull(),
  name: text('name').notNull(),
  isDefault: boolean('is_default').default(false),
  headerHtml: text('header_html'),
  footerHtml: text('footer_html'),
  logoUrl: text('logo_url'),
  colors: jsonb('colors').$type<InvoiceTemplateColors>(),     // { primary, accent, background?, textColor? }
  defaultPaymentTerms: integer('default_payment_terms').default(30),
  defaultNotes: text('default_notes'),
  taxConfig: jsonb('tax_config').$type<InvoiceTaxConfig>(),   // Tax rates, labels, inclusive/exclusive
  numberPrefix: text('number_prefix').default('INV'),
  nextNumber: integer('next_number').default(1001),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

// invoices_v2 — Advanced Invoices with Template Support
export const invoicesV2 = pgTable('invoices_v2', {
  id: uuid('id').primaryKey().defaultRandom(),
  ventureId: uuid('venture_id').references(() => ventures.id, { onDelete: 'cascade' }).notNull(),
  contactId: uuid('contact_id').references(() => contacts.id),
  organizationId: uuid('organization_id').references(() => organizations.id),
  templateId: uuid('template_id').references(() => invoiceTemplates.id),
  recurringInvoiceId: uuid('recurring_invoice_id'),
  number: text('number').notNull(),
  status: invoiceV2StatusEnum('status').notNull().default('draft'), // draft|sent|viewed|partial|paid|overdue|void|write_off
  issueDate: timestamp('issue_date', { withTimezone: true }).defaultNow(),
  dueDate: timestamp('due_date', { withTimezone: true }),
  lineItems: jsonb('line_items').$type<InvoiceV2LineItem[]>().notNull().default([]),
  subtotal: integer('subtotal').notNull().default(0),           // cents
  taxAmount: integer('tax_amount').default(0),
  discountAmount: integer('discount_amount').default(0),
  total: integer('total').notNull().default(0),
  amountPaid: integer('amount_paid').default(0),
  amountDue: integer('amount_due').default(0),
  currency: text('currency').notNull().default('usd'),
  notes: text('notes'),
  terms: text('terms'),
  paymentLink: text('payment_link'),                           // Stripe-generated payment link
  stripeInvoiceId: text('stripe_invoice_id'),
  sentAt: timestamp('sent_at', { withTimezone: true }),
  viewedAt: timestamp('viewed_at', { withTimezone: true }),
  paidAt: timestamp('paid_at', { withTimezone: true }),
  reminders: jsonb('reminders').$type<InvoiceReminder[]>(),
  customFields: jsonb('custom_fields').$type<Record<string, string>>(),
  billingAddress: jsonb('billing_address').$type<InvoiceAddress>(),
  createdBy: uuid('created_by'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

// proposals — Sales Proposals with E-Signatures
export const proposals = pgTable('proposals', {
  id: uuid('id').primaryKey().defaultRandom(),
  ventureId: uuid('venture_id').references(() => ventures.id, { onDelete: 'cascade' }).notNull(),
  contactId: uuid('contact_id').references(() => contacts.id),
  organizationId: uuid('organization_id').references(() => organizations.id),
  title: text('title').notNull(),
  proposalNumber: text('proposal_number'),
  status: proposalStatusEnum('status').notNull().default('draft'), // draft|sent|viewed|accepted|declined|expired
  content: jsonb('content').$type<ProposalContentBlock[]>().notNull().default([]),
  lineItems: jsonb('line_items').$type<InvoiceV2LineItem[]>().notNull().default([]),
  subtotal: integer('subtotal').default(0),
  taxAmount: integer('tax_amount').default(0),
  discountAmount: integer('discount_amount').default(0),
  total: integer('total').notNull().default(0),
  currency: text('currency').notNull().default('usd'),
  validUntil: timestamp('valid_until', { withTimezone: true }),
  acceptedAt: timestamp('accepted_at', { withTimezone: true }),
  signatureUrl: text('signature_url'),
  signatureIp: text('signature_ip'),
  coverImageUrl: text('cover_image_url'),
  convertedInvoiceId: uuid('converted_invoice_id'),
  createdBy: uuid('created_by'),
});

// estimates — Quotes with Versioning & Progress Invoicing
export const estimates = pgTable('estimates', {
  id: uuid('id').primaryKey().defaultRandom(),
  ventureId: uuid('venture_id').references(() => ventures.id, { onDelete: 'cascade' }).notNull(),
  contactId: uuid('contact_id').references(() => contacts.id),
  organizationId: uuid('organization_id').references(() => organizations.id),
  templateId: uuid('template_id').references(() => invoiceTemplates.id),
  estimateNumber: text('estimate_number').notNull(),
  title: text('title').notNull(),
  status: estimateStatusEnum('status').notNull().default('draft'), // draft|sent|viewed|accepted|declined|expired|converted
  lineItems: jsonb('line_items').$type<InvoiceV2LineItem[]>().notNull().default([]),
  subtotal: integer('subtotal').notNull().default(0),
  total: integer('total').notNull().default(0),
  currency: text('currency').notNull().default('usd'),
  validUntil: timestamp('valid_until', { withTimezone: true }),
  versions: jsonb('versions').$type<EstimateVersionEntry[]>().default([]),
  currentVersion: integer('current_version').default(1),
  convertedInvoiceId: uuid('converted_invoice_id'),
  progressInvoicing: jsonb('progress_invoicing').$type<ProgressInvoicing>(),
  signatureUrl: text('signature_url'),
  signatureIp: text('signature_ip'),
  createdBy: uuid('created_by'),
});

// recurring_invoices — Scheduled Invoice Generation
export const recurringInvoices = pgTable('recurring_invoices', {
  id: uuid('id').primaryKey().defaultRandom(),
  ventureId: uuid('venture_id').references(() => ventures.id, { onDelete: 'cascade' }).notNull(),
  contactId: uuid('contact_id').references(() => contacts.id),
  organizationId: uuid('organization_id').references(() => organizations.id),
  templateId: uuid('template_id').references(() => invoiceTemplates.id),
  name: text('name').notNull(),
  templateConfig: jsonb('template_config').$type<RecurringTemplateConfig>().notNull(),
  interval: recurringInvoiceIntervalEnum('interval').notNull().default('monthly'),
  dayOfMonth: integer('day_of_month').default(1),
  dayOfWeek: integer('day_of_week'),
  startDate: timestamp('start_date', { withTimezone: true }).notNull(),
  endDate: timestamp('end_date', { withTimezone: true }),
  nextDate: timestamp('next_date', { withTimezone: true }).notNull(),
  lastGeneratedAt: timestamp('last_generated_at', { withTimezone: true }),
  status: recurringInvoiceStatusEnum('status').notNull().default('active'), // active|paused|cancelled|completed
  autoSend: boolean('auto_send').default(false),
  totalGenerated: integer('total_generated').default(0),
  totalRevenue: integer('total_revenue').default(0),
  createdBy: uuid('created_by'),
});

// platform_fee_configs — Stripe Connect Fee Structure (Super Admin)
export const platformFeeConfigs = pgTable('platform_fee_configs', {
  id: uuid('id').primaryKey().defaultRandom(),
  ventureId: uuid('venture_id').references(() => ventures.id, { onDelete: 'cascade' }).notNull().unique(),
  feeType: platformFeeTypeEnum('fee_type').notNull().default('percentage'), // percentage|flat|tiered
  feePercent: numeric('fee_percent', { precision: 5, scale: 2 }).default('2.50'),
  flatFeeCents: integer('flat_fee_cents').default(0),
  tieredConfig: jsonb('tiered_config').$type<TieredFeeConfig>(),
  invoiceFeePercent: numeric('invoice_fee_percent', { precision: 5, scale: 2 }).default('1.00'),
  proposalConversionFee: integer('proposal_conversion_fee').default(0),
  cappedAt: integer('capped_at'),                       // Max fee per transaction (cents)
  minimumFee: integer('minimum_fee').default(0),
  isActive: boolean('is_active').default(true),
  effectiveFrom: timestamp('effective_from', { withTimezone: true }).defaultNow(),
  effectiveUntil: timestamp('effective_until', { withTimezone: true }),
  notes: text('notes'),
});

// platform_fee_ledger — Fee Audit Trail
export const platformFeeLedger = pgTable('platform_fee_ledger', {
  id: uuid('id').primaryKey().defaultRandom(),
  ventureId: uuid('venture_id').references(() => ventures.id, { onDelete: 'cascade' }).notNull(),
  invoiceId: uuid('invoice_id').references(() => invoicesV2.id),
  feeConfigId: uuid('fee_config_id').references(() => platformFeeConfigs.id),
  transactionAmount: integer('transaction_amount').notNull(),
  feeAmount: integer('fee_amount').notNull(),
  feePercent: numeric('fee_percent', { precision: 5, scale: 2 }),
  description: text('description'),
  stripeTransferId: text('stripe_transfer_id'),
  period: text('period'),                                // '2026-01' for monthly aggregation
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

// approval_workflows — Multi-Step Approval Workflows
export const approvalWorkflows = pgTable('approval_workflows', {
  id: uuid('id').primaryKey().defaultRandom(),
  ventureId: uuid('venture_id').references(() => ventures.id, { onDelete: 'cascade' }).notNull(),
  name: text('name').notNull(),
  entityType: approvalEntityTypeEnum('entity_type').notNull(), // invoice|proposal|estimate|credit_note|discount
  isActive: boolean('is_active').default(true),
  rules: jsonb('rules').$type<ApprovalRuleConfig[]>().notNull().default([]),
  // [{ step: 1, approverRoleId: 'uuid', condition: { field: 'total', operator: 'gt', value: 1000 } }]
  createdBy: uuid('created_by'),
});
```

### Core Interface

```typescript
export class BillingService {
  // ── Invoice CRUD ─────────────────────────────────────────────────────
  createInvoice(input: CreateInvoiceInput): Promise<{ invoice: Invoice; lineItems: InvoiceLineItem[] }>;
  sendInvoice(invoiceId: string): Promise<Invoice>;
  recordPayment(invoiceId: string, input: PaymentInput): Promise<Invoice>;

  // ── Subscriptions ────────────────────────────────────────────────────
  createSubscription(input: CreateSubscriptionInput): Promise<Subscription>;
  updateSubscription(subscriptionId: string, input: UpdateSubscriptionInput): Promise<Subscription>;
  cancelSubscription(subscriptionId: string, input: CancelInput): Promise<Subscription>;
  processRenewals(): Promise<RenewalResults>;

  // ── Credit Notes ─────────────────────────────────────────────────────
  issueCreditNote(input: CreditNoteInput): Promise<CreditNote>;
  applyCreditNote(creditNoteId: string, invoiceId: string, amount?: string): Promise<ApplyResult>;

  // ── Payment Schedules ────────────────────────────────────────────────
  createPaymentSchedule(invoiceId: string, input: ScheduleInput): Promise<PaymentSchedule>;
}
```

### Invoice V2 Service (Production)

```typescript
export class InvoiceV2Service {
  // ── CRUD ─────────────────────────────────────────────────────────────
  create(ventureId: string, input: CreateInvoiceV2Input, createdBy?: string): Promise<InvoiceV2>;
  update(ventureId: string, invoiceId: string, input: UpdateInvoiceV2Input): Promise<InvoiceV2>;
  delete(ventureId: string, invoiceId: string): Promise<void>;  // Draft only
  getById(ventureId: string, invoiceId: string): Promise<InvoiceV2 | null>;
  list(ventureId: string, filter: ListInvoicesV2Filter): Promise<PaginatedResult<InvoiceV2>>;

  // ── Lifecycle ────────────────────────────────────────────────────────
  send(ventureId: string, invoiceId: string): Promise<InvoiceV2>;     // Generates Stripe payment link
  markViewed(ventureId: string, invoiceId: string): Promise<InvoiceV2>;
  recordPayment(ventureId: string, invoiceId: string, input: RecordPaymentInput, createdBy?: string): Promise<{ invoice: InvoiceV2; receipt: PaymentReceipt }>;
  applyCredit(ventureId: string, invoiceId: string, creditNoteId: string): Promise<void>;
  voidInvoice(ventureId: string, invoiceId: string, reason: string): Promise<InvoiceV2>;
  duplicate(ventureId: string, invoiceId: string): Promise<InvoiceV2>;

  // ── Bulk Operations ──────────────────────────────────────────────────
  getSummary(ventureId: string): Promise<InvoicingSummary>;
  checkOverdue(ventureId: string): Promise<InvoiceV2[]>;
}
```

### Key Behaviors

1. **Auto-numbering**: Invoice numbers use the template's prefix and auto-incrementing number (e.g., `INV-01001`). The template's `nextNumber` is atomically incremented.
2. **Total calculation**: Line item totals are calculated server-side: `amount = quantity × unitPrice`, then `subtotal = Σ(amounts)`, `total = subtotal + tax - discounts`.
3. **Payment link generation**: When an invoice is sent, a Stripe payment link is automatically generated if not already present.
4. **Proration**: Subscription plan changes mid-period calculate proportional credits/charges based on remaining days.
5. **Dunning automation**: Failed subscription payments trigger a multi-step dunning process: Day 1 email → Day 7 email → Day 14 SMS → Day 30 pause → Day 60 cancel.
6. **Recurring vs. Subscriptions**: Recurring invoices (this module) generate invoices on schedule for manual payment. Subscriptions (via `@mcv/payments`) use Stripe auto-charge.
7. **Platform fees**: Super admin can configure per-venture percentage/flat/tiered fees on all transactions. Fees are recorded in `platform_fee_ledger` for auditing.

---

## Module: integrations

### Purpose

Provides bidirectional synchronization with external accounting platforms (QuickBooks Online, Xero, Sage, FreshBooks) and bank feed connectivity via Plaid for automatic transaction import and reconciliation.

### Database Schema

```typescript
// finance_integrations — External Platform Connections
export const accountingIntegrations = pgTable('finance_integrations', {
  ...baseColumns,
  name: text('name').notNull(),                          // "QuickBooks - Acme Corp"
  provider: integrationProviderEnum('provider').notNull(), // quickbooks_online|xero|sage|plaid|stripe|...
  status: text('status').default('disconnected'),        // disconnected|connected|error|syncing
  connectionData: jsonb('connection_data'),              // Encrypted OAuth tokens
  settings: jsonb('settings'),
  // { syncDirection: 'bidirectional', syncFrequency: 'hourly', autoSync: true,
  //   syncEntities: ['accounts', 'invoices', 'bills', 'payments'],
  //   mappings: { accounts: { 'local_id': 'external_id' } } }
  lastSyncAt: timestamp('last_sync_at'),
  lastSyncStatus: text('last_sync_status'),
  lastError: text('last_error'),
  connectedAt: timestamp('connected_at'),
  connectedBy: uuid('connected_by'),
  externalCompanyId: text('external_company_id'),
  externalCompanyName: text('external_company_name'),
});

// finance_integration_mappings — Entity ID Mappings
export const integrationMappings = pgTable('finance_integration_mappings', {
  ...baseColumns,
  integrationId: uuid('integration_id').references(() => accountingIntegrations.id).notNull(),
  entityType: text('entity_type').notNull(),             // account|customer|vendor|item|tax_code
  localId: uuid('local_id').notNull(),
  externalId: text('external_id').notNull(),
  externalData: jsonb('external_data'),
  lastSyncedAt: timestamp('last_synced_at'),
  syncStatus: text('sync_status').default('synced'),     // synced|pending|error
  syncError: text('sync_error'),
});

// finance_integration_sync_logs — Sync Execution History
export const integrationSyncLogs = pgTable('finance_integration_sync_logs', {
  ...baseColumns,
  integrationId: uuid('integration_id').references(() => accountingIntegrations.id).notNull(),
  syncType: text('sync_type').notNull(),                 // full|incremental|entity
  direction: syncDirectionEnum('direction').notNull(),   // push|pull|bidirectional
  status: text('status').default('pending'),             // pending|running|completed|failed
  startedAt: timestamp('started_at'),
  completedAt: timestamp('completed_at'),
  entitiesProcessed: jsonb('entities_processed'),
  // { accounts: { created: 5, updated: 10, failed: 0 }, invoices: { created: 20, updated: 5, failed: 1 } }
  errors: jsonb('errors'),
  triggeredBy: text('triggered_by'),                     // auto|manual|webhook
});

// finance_bank_connections — Bank Feed Connections (Plaid)
export const bankConnections = pgTable('finance_bank_connections', {
  ...baseColumns,
  name: text('name').notNull(),
  provider: text('provider').notNull(),                  // plaid|yodlee|mx
  institutionId: text('institution_id').notNull(),
  institutionName: text('institution_name').notNull(),
  status: text('status').default('connected'),
  accessToken: text('access_token'),                     // Encrypted
  itemId: text('item_id'),
  lastRefreshedAt: timestamp('last_refreshed_at'),
  consentExpiresAt: timestamp('consent_expires_at'),
  accounts: jsonb('accounts'),
  // [{ accountId: 'plaid_id', name: 'Checking', mask: '1234', type: 'depository',
  //    subtype: 'checking', linkedAccountId: 'local_gl_account_id' }]
  metadata: jsonb('metadata'),
});

// finance_bank_transactions — Imported Bank Transactions
export const bankTransactions = pgTable('finance_bank_transactions', {
  ...baseColumns,
  bankConnectionId: uuid('bank_connection_id').references(() => bankConnections.id).notNull(),
  externalTransactionId: text('external_transaction_id').notNull(),
  accountId: uuid('account_id'),                         // Linked local GL account
  transactionDate: timestamp('transaction_date').notNull(),
  postedDate: timestamp('posted_date'),
  amount: text('amount').notNull(),
  currency: text('currency').default('USD'),
  name: text('name').notNull(),
  merchantName: text('merchant_name'),
  category: text('category'),
  categoryId: text('category_id'),
  pending: boolean('pending').default(false),
  transactionType: text('transaction_type'),
  paymentChannel: text('payment_channel'),
  location: jsonb('location'),
  isReconciled: boolean('is_reconciled').default(false),
  reconciledAt: timestamp('reconciled_at'),
  matchedTransactionId: uuid('matched_transaction_id'),
  matchConfidence: text('match_confidence'),              // high|medium|low
  metadata: jsonb('metadata'),
});

// finance_reconciliations — Bank Statement Reconciliation
export const reconciliations = pgTable('finance_reconciliations', {
  ...baseColumns,
  accountId: uuid('account_id').notNull(),
  statementDate: timestamp('statement_date').notNull(),
  statementBalance: text('statement_balance').notNull(),
  startingBalance: text('starting_balance').notNull(),
  endingBalance: text('ending_balance').notNull(),
  clearedBalance: text('cleared_balance'),
  difference: text('difference'),
  status: text('status').default('in_progress'),         // in_progress|reconciled|discrepancy
  reconciledAt: timestamp('reconciled_at'),
  reconciledBy: uuid('reconciled_by'),
  clearedTransactions: jsonb('cleared_transactions'),
  adjustingEntries: jsonb('adjusting_entries'),
  notes: text('notes'),
});
```

### Core Interface

```typescript
export class IntegrationService {
  // ── Platform Connections ─────────────────────────────────────────────
  connectQuickBooks(authCode: string, realmId: string): Promise<Integration>;
  connectXero(authCode: string): Promise<Integration>;

  // ── Sync Operations ──────────────────────────────────────────────────
  syncAccounts(integrationId: string): Promise<SyncResult>;
  pushInvoice(integrationId: string, invoiceId: string): Promise<ExternalInvoice>;
  runFullSync(integrationId: string): Promise<FullSyncResult>;
  scheduleSync(integrationId: string, frequency: SyncFrequency): Promise<Integration>;

  // ── Bank Feeds ───────────────────────────────────────────────────────
  connectBankWithPlaid(publicToken: string, institutionId: string): Promise<BankConnection>;
  linkBankAccount(connectionId: string, externalAccountId: string, localAccountId: string): Promise<BankConnection>;
  fetchBankTransactions(connectionId: string, startDate: Date, endDate: Date): Promise<BankTransaction[]>;

  // ── Reconciliation ───────────────────────────────────────────────────
  autoMatchTransactions(accountId: string): Promise<MatchResult[]>;
  reconcile(accountId: string, input: ReconciliationInput): Promise<Reconciliation>;
}
```

### Auto-Match Algorithm

```
For each unreconciled, non-pending bank transaction:
  1. Query posted journal entry lines where:
     - Same GL account
     - Amount matches within ±$0.01
     - Entry date within ±7 days of transaction date
     - Not already matched to another bank transaction
  2. If exactly 1 match → HIGH confidence (auto-match)
  3. If 2+ matches → LOW confidence (needs manual review)
  4. If 0 matches → Unmatched (may need manual journal entry)
```

### Key Behaviors

1. **Token encryption**: OAuth access/refresh tokens are encrypted at rest using `@mcv/kernel/config/secrets`. Decryption uses `ENCRYPTION_KEY` from env.
2. **Auto-sync**: When connected, integrations can run hourly/daily/weekly incremental syncs. Full syncs can be triggered manually.
3. **Entity mapping**: Every synced entity maintains a bidirectional mapping (local UUID ↔ external ID) in `integrationMappings`.
4. **Deduplication**: Bank transaction imports check for existing `externalTransactionId` to avoid duplicates. Pending → posted transitions update in place.
5. **Reconciliation tolerance**: Bank reconciliation considers the account reconciled when the difference between statement balance and cleared balance is less than $0.01.

---

## Treasury Schema (Live Production)

The treasury schema represents the current production database schema used for financial data tracking. It provides simpler, lightweight tables compared to the full @mcv/finance spec.

```typescript
// pnl_entries — Profit & Loss Tracking
export const pnlEntries = pgTable('pnl_entries', {
  id: uuid('id').primaryKey().defaultRandom(),
  ventureId: uuid('venture_id').notNull().references(() => ventures.id, { onDelete: 'cascade' }),
  period: text('period').notNull(),                      // "2026-Q1", "2026-01"
  revenue: doublePrecision('revenue').notNull(),
  expenses: doublePrecision('expenses').notNull(),
  netIncome: doublePrecision('net_income').notNull(),
  margin: doublePrecision('margin').notNull(),           // Net income / revenue
  currency: text('currency').notNull().default('USD'),
  category: text('category'),
  notes: text('notes'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

// cash_operations — Cash Flow Tracking
export const cashOperations = pgTable('cash_operations', {
  id: uuid('id').primaryKey().defaultRandom(),
  type: text('type', { enum: ['inflow', 'outflow', 'transfer'] }).notNull(),
  amount: doublePrecision('amount').notNull(),
  currency: text('currency').notNull().default('USD'),
  fromAccount: text('from_account'),
  toAccount: text('to_account'),
  ventureId: uuid('venture_id').references(() => ventures.id, { onDelete: 'set null' }),
  description: text('description').notNull(),
  category: text('category'),
  timestamp: timestamp('timestamp', { withTimezone: true }).notNull().defaultNow(),
  status: text('status', { enum: ['pending', 'completed', 'failed'] }).notNull().default('pending'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

// budgets — Simple Budget Tracking
export const budgets = pgTable('budgets', {
  id: uuid('id').primaryKey().defaultRandom(),
  ventureId: uuid('venture_id').notNull().references(() => ventures.id, { onDelete: 'cascade' }),
  period: text('period').notNull(),
  category: text('category').notNull(),
  budgetedAmount: doublePrecision('budgeted_amount').notNull(),
  actualAmount: doublePrecision('actual_amount').notNull().default(0),
  currency: text('currency').notNull().default('USD'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

// expenses — Simple Expense Tracking
export const expenses = pgTable('expenses', {
  id: uuid('id').primaryKey().defaultRandom(),
  ventureId: uuid('venture_id').notNull().references(() => ventures.id, { onDelete: 'cascade' }),
  category: text('category').notNull(),
  description: text('description').notNull(),
  amount: doublePrecision('amount').notNull(),
  currency: text('currency').notNull().default('USD'),
  date: timestamp('date', { withTimezone: true }).notNull(),
  vendor: text('vendor'),
  status: text('status', { enum: ['pending', 'approved', 'paid'] }).notNull().default('pending'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

// funding_rounds — Investment Tracking
export const fundingRounds = pgTable('funding_rounds', {
  id: uuid('id').primaryKey().defaultRandom(),
  ventureId: uuid('venture_id').notNull().references(() => ventures.id, { onDelete: 'cascade' }),
  roundType: text('round_type', {
    enum: ['seed', 'series-a', 'series-b', 'series-c', 'bridge', 'ipo'],
  }).notNull(),
  targetAmount: doublePrecision('target_amount').notNull(),
  raisedAmount: doublePrecision('raised_amount').notNull().default(0),
  currency: text('currency').notNull().default('USD'),
  status: text('status', { enum: ['planning', 'active', 'closed'] }).notNull().default('planning'),
  investors: jsonb('investors').$type<string[]>().default([]),
  closingDate: timestamp('closing_date', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});
```

---

## Code Examples

### Example 1: Create Chart of Accounts and Post a Sales Journal Entry

```typescript
import { accountingService } from '@mcv/finance';

// Create accounts
const cashAccount = await accountingService.createAccount({
  code: '1010',
  name: 'Cash and Cash Equivalents',
  type: 'asset',
  subtype: 'cash',
  currency: 'USD',
  openingBalance: '50000',
});

const revenueAccount = await accountingService.createAccount({
  code: '4010',
  name: 'Product Sales',
  type: 'revenue',
  subtype: 'operating_revenue',
});

const arAccount = await accountingService.createAccount({
  code: '1020',
  name: 'Accounts Receivable',
  type: 'asset',
  subtype: 'accounts_receivable',
});

// Record a sale: DR AR $5,000, CR Revenue $5,000
const { entry, lines } = await accountingService.createJournalEntry({
  entryDate: new Date('2026-02-01'),
  description: 'Sale to Customer ABC — Invoice INV-2026-000042',
  reference: 'INV-2026-000042',
  sourceType: 'invoice',
  lines: [
    { accountId: arAccount.id, debitAmount: '5000', description: 'Accounts receivable' },
    { accountId: revenueAccount.id, creditAmount: '5000', description: 'Product sales revenue' },
  ],
});

console.log(`Created JE ${entry.entryNumber}: ${entry.totalDebit} debit = ${entry.totalCredit} credit`);
// Created JE JE-2026-000001: 5000 debit = 5000 credit

// Post the entry to update account balances
const posted = await accountingService.postJournalEntry(entry.id);
console.log(`Posted at ${posted.postedAt} — status: ${posted.status}`);
```

### Example 2: Reverse a Posted Journal Entry

```typescript
import { accountingService } from '@mcv/finance';

// Reverse a previously posted entry (e.g., erroneous sale)
const reversal = await accountingService.reverseJournalEntry(
  originalEntryId,
  new Date('2026-02-05'),
  'Sale was duplicated in error'
);

console.log(`Reversal entry: ${reversal.entry.entryNumber}`);
// Reversal entry: JE-2026-000002
// Lines will have debits/credits swapped from the original
```

### Example 3: Create Expense with Policy Validation

```typescript
import { expenseService } from '@mcv/finance';

const expense = await expenseService.createExpense({
  merchantName: 'Hilton Hotels',
  merchantLocation: 'New York, NY',
  expenseDate: new Date('2026-02-03'),
  category: 'lodging',
  description: 'Client meeting — 2 nights',
  amount: '450.00',
  currency: 'USD',
  isReimbursable: true,
  isBillable: true,
  customerId: clientUuid,
  projectId: projectUuid,
  attendees: [
    { name: 'John Smith', company: 'Acme Corp' },
  ],
  tags: ['client-meeting', 'Q1-2026'],
});

// Policy violations are recorded but don't block creation
if (expense.policyViolations) {
  console.warn('Policy violations:', expense.policyViolations);
  // [{ type: 'per_diem_exceeded', category: 'lodging', limit: 200, amount: '450.00' }]
}
```

### Example 4: Submit Expense Report with Approval Workflow

```typescript
import { expenseService } from '@mcv/finance';

// Create expense report grouping multiple expenses
const report = await expenseService.createExpenseReport({
  title: 'NYC Client Trip — February 2026',
  description: 'On-site client meetings and team dinner',
  expenseIds: [expense1.id, expense2.id, expense3.id],
  projectId: projectUuid,
  startDate: new Date('2026-02-01'),
  endDate: new Date('2026-02-05'),
  purpose: 'Quarterly business review with Acme Corp',
});

console.log(`Report ${report.reportNumber}: $${report.totalAmount}`);
// Report EXP-202602-0001: $1,250.00

// Submit for approval — triggers multi-level workflow
const submitted = await expenseService.submitExpenseReport(report.id);
// Level 1 approver is notified automatically

// Manager approves
const approved = await expenseService.processApproval(
  report.id,
  'approved',
  'Looks good. Within budget for Q1.'
);

// Finance processes reimbursement
const reimbursed = await expenseService.processReimbursement(
  report.id,
  'bank_transfer',
  'ACH-2026-02-10-0042'
);
// Creates: DR Expense $1,250 / CR AP $1,250
// Then:    DR AP $1,250 / CR Cash $1,250
```

### Example 5: Create Annual Budget with Monthly Allocations

```typescript
import { budgetingService } from '@mcv/finance';

const { budget, lines } = await budgetingService.createBudget({
  name: 'FY 2026 Marketing Budget',
  description: 'Annual marketing department budget',
  budgetType: 'annual',
  fiscalYearId: fy2026Id,
  departmentId: marketingDeptId,
  startDate: new Date('2026-01-01'),
  endDate: new Date('2026-12-31'),
  currency: 'USD',
  lines: [
    {
      accountId: advertisingAccountId,
      categoryName: 'Digital Advertising',
      budgetAmount: '120000',
      periodAllocations: {
        '2026-01': { budget: 8000 },   // Lower in Q1
        '2026-02': { budget: 8000 },
        '2026-03': { budget: 8000 },
        '2026-04': { budget: 12000 },  // Ramp up in Q2
        '2026-05': { budget: 12000 },
        '2026-06': { budget: 12000 },
        '2026-07': { budget: 10000 },
        '2026-08': { budget: 10000 },
        '2026-09': { budget: 10000 },
        '2026-10': { budget: 12000 },  // Holiday push
        '2026-11': { budget: 12000 },
        '2026-12': { budget: 6000 },   // Wind down
      },
    },
    {
      accountId: eventsAccountId,
      categoryName: 'Events & Conferences',
      budgetAmount: '50000',
      // No periodAllocations → auto-distributed evenly ($4,166.67/month)
    },
    {
      accountId: contentAccountId,
      categoryName: 'Content Production',
      budgetAmount: '30000',
      isCapex: false,
      costCenter: 'MKT-001',
    },
  ],
});

console.log(`Budget "${budget.name}": $${budget.totalBudget} across ${lines.length} lines`);
// Budget "FY 2026 Marketing Budget": $200,000 across 3 lines
```

### Example 6: Budget vs. Actual Comparison

```typescript
import { budgetingService } from '@mcv/finance';

// Record actual spending
await budgetingService.recordActual(advertisingLineId, '9500', '2026-01');
await budgetingService.recordActual(advertisingLineId, '7200', '2026-02');

// Get comparison
const comparison = await budgetingService.getBudgetVsActual(budget.id);

for (const line of comparison.lines) {
  console.log(`${line.categoryName}:`);
  console.log(`  Budget: $${line.budgetAmount}`);
  console.log(`  Actual: $${line.actualAmount}`);
  console.log(`  Variance: $${line.variance} (${line.variancePercent}%)`);
  console.log(`  Status: ${line.status}`);
}
// Digital Advertising:
//   Budget: $120,000
//   Actual: $16,700
//   Variance: $103,300 (86.08%)
//   Status: on_track

console.log(`\nTotal utilization: ${comparison.totals.utilizationPercent}%`);
```

### Example 7: Generate Budget Forecast with Scenario

```typescript
import { budgetingService } from '@mcv/finance';

// Generate linear forecast based on historical spending
const forecast = await budgetingService.generateForecast(budget.id, 'seasonal');

for (const period of forecast.periodForecasts) {
  console.log(`${period.period}: $${period.predicted} (confidence: ${period.confidence})`);
  console.log(`  Range: $${period.range.low} – $${period.range.high}`);
}

// Create what-if scenario
const worstCase = await budgetingService.createScenario({
  budgetId: budget.id,
  name: 'Recession Scenario',
  scenarioType: 'worst_case',
  assumptions: {
    revenueGrowth: -0.10,
    costInflation: 0.05,
    headcountChange: -3,
  },
  lineAdjustments: {
    [advertisingLineId]: { factor: 0.70 },   // Cut ads by 30%
    [eventsLineId]: { factor: 0.50 },         // Cut events by 50%
  },
});

console.log(`Worst case total: $${worstCase.projectedTotal}`);
```

### Example 8: Generate Income Statement with Prior Year Comparison

```typescript
import { reportingService } from '@mcv/finance';

const incomeStatement = await reportingService.generateIncomeStatement({
  dateRange: { type: 'period', periodId: januaryPeriodId },
  compareWith: 'prior_year',
  showZeroBalances: false,
  roundToNearest: 100,
});

console.log(incomeStatement.title);
console.log(incomeStatement.subtitle);
console.log('');

for (const section of incomeStatement.sections) {
  console.log(`=== ${section.title} ===`);
  if ('accounts' in section) {
    for (const acc of section.accounts) {
      console.log(`  ${acc.code} ${acc.name}: $${acc.balance} (prior: $${acc.priorBalance ?? 'N/A'})`);
    }
  }
  console.log(`  TOTAL: $${section.total}`);
}

console.log('');
console.log(`Net Income: $${incomeStatement.summary.netIncome}`);
console.log(`Margin: ${incomeStatement.summary.netIncomeMargin}%`);
console.log(`YoY Change: $${incomeStatement.summary.netIncomeChange}`);
```

### Example 9: Create and Send an Invoice (V2) with Stripe Payment Link

```typescript
import { invoiceV2Service } from '@mcv/finance';

// Create invoice using branded template
const invoice = await invoiceV2Service.create(ventureId, {
  contactId: clientContactId,
  organizationId: clientOrgId,
  templateId: brandedTemplateId,
  lineItems: [
    {
      id: crypto.randomUUID(),
      description: 'Website Redesign — Phase 1',
      quantity: 1,
      unitPrice: 750000,      // $7,500.00 in cents
      amount: 750000,
      taxRate: 8.5,
      taxAmount: 63750,
      sortOrder: 1,
    },
    {
      id: crypto.randomUUID(),
      description: 'SEO Audit & Optimization',
      quantity: 1,
      unitPrice: 250000,      // $2,500.00 in cents
      amount: 250000,
      taxRate: 8.5,
      taxAmount: 21250,
      sortOrder: 2,
    },
  ],
  notes: 'Thank you for your business!',
  terms: 'Payment due within 30 days.',
  currency: 'usd',
}, currentUserId);

console.log(`Invoice ${invoice.number}: $${(invoice.total / 100).toFixed(2)}`);
// Invoice INV-01001: $10,850.00

// Send invoice — generates Stripe payment link and sends email
const sent = await invoiceV2Service.send(ventureId, invoice.id);
console.log(`Payment link: ${sent.paymentLink}`);

// Record manual payment
const { invoice: paid, receipt } = await invoiceV2Service.recordPayment(
  ventureId, invoice.id,
  { amount: 1085000, method: 'bank_transfer', reference: 'Wire-2026-02-15' },
  currentUserId
);
console.log(`Status: ${paid.status}`); // "paid"
```

### Example 10: Create Proposal and Convert to Invoice

```typescript
import { proposalService, invoiceV2Service } from '@mcv/finance';

const proposal = await proposalService.create(ventureId, {
  contactId: prospectContactId,
  title: 'Brand Identity Package',
  content: [
    { id: '1', type: 'heading', content: 'Brand Identity Package', sortOrder: 1 },
    { id: '2', type: 'paragraph', content: 'Complete brand identity redesign including...', sortOrder: 2 },
    { id: '3', type: 'pricing', content: '', sortOrder: 3 },
    { id: '4', type: 'terms', content: 'Standard terms and conditions apply.', sortOrder: 4 },
    { id: '5', type: 'signature', content: '', sortOrder: 5 },
  ],
  lineItems: [
    { id: '1', description: 'Logo Design', quantity: 1, unitPrice: 300000, amount: 300000, sortOrder: 1 },
    { id: '2', description: 'Brand Guidelines', quantity: 1, unitPrice: 200000, amount: 200000, sortOrder: 2 },
    { id: '3', description: 'Business Cards', quantity: 500, unitPrice: 200, amount: 100000, sortOrder: 3 },
  ],
  validUntil: new Date('2026-03-15'),
});

// Send to prospect
await proposalService.send(ventureId, proposal.id);

// Prospect accepts with e-signature
await proposalService.accept(ventureId, proposal.id, {
  signatureUrl: 'https://storage.mcv.one/signatures/abc123.png',
  signatureIp: '203.0.113.42',
});

// Convert accepted proposal to invoice
const invoice = await proposalService.convertToInvoice(ventureId, proposal.id);
console.log(`Proposal → Invoice ${invoice.number}`);
```

### Example 11: Set Up Recurring Invoice

```typescript
import { recurringInvoiceService } from '@mcv/finance';

const recurring = await recurringInvoiceService.create(ventureId, {
  contactId: retainerClientId,
  name: 'Monthly Retainer — Acme Corp',
  templateConfig: {
    lineItems: [
      { id: '1', description: 'Monthly consulting retainer', quantity: 1, unitPrice: 500000, amount: 500000, sortOrder: 1 },
    ],
    notes: 'Recurring monthly retainer per agreement dated Jan 2026.',
    currency: 'usd',
    paymentTermsDays: 15,
  },
  interval: 'monthly',
  dayOfMonth: 1,
  startDate: new Date('2026-03-01'),
  autoSend: true,
}, currentUserId);

console.log(`Recurring invoice "${recurring.name}" — next: ${recurring.nextDate}`);
// Recurring invoice "Monthly Retainer — Acme Corp" — next: 2026-03-01

// Process all due recurring invoices (run by cron)
const generated = await recurringInvoiceService.processAll(ventureId);
console.log(`Generated ${generated.length} invoices`);
```

### Example 12: Create Subscription with Trial

```typescript
import { billingService } from '@mcv/finance';

const subscription = await billingService.createSubscription({
  customerId: customerUuid,
  planId: proPlanId,
  quantity: 5,             // 5 seats
  trialDays: 14,
  paymentMethodId: pmUuid,
  collectionMethod: 'charge_automatically',
});

console.log(`Subscription ${subscription.subscriptionNumber}`);
console.log(`Status: ${subscription.status}`);          // "trialing"
console.log(`Trial ends: ${subscription.trialEnd}`);
console.log(`First charge: ${subscription.currentPeriodStart}`);

// Later: upgrade plan mid-cycle
const upgraded = await billingService.updateSubscription(subscription.id, {
  planId: enterprisePlanId,
  quantity: 10,
  prorationBehavior: 'always_invoice',
});

// Cancel at end of billing period
await billingService.cancelSubscription(subscription.id, {
  cancelAtPeriodEnd: true,
  reason: 'Customer switching to competitor',
});
```

### Example 13: Connect QuickBooks and Sync

```typescript
import { integrationService } from '@mcv/finance';

// After OAuth flow returns authCode
const integration = await integrationService.connectQuickBooks(authCode, realmId);
console.log(`Connected to ${integration.externalCompanyName}`);

// Push an invoice to QuickBooks
const externalInvoice = await integrationService.pushInvoice(integration.id, localInvoiceId);
console.log(`Pushed as QuickBooks invoice ${externalInvoice.Id}`);

// Run full sync
const results = await integrationService.runFullSync(integration.id);
console.log(`Sync results:`);
console.log(`  Accounts: ${results.accounts.created} created, ${results.accounts.updated} updated`);
console.log(`  Customers: ${results.customers.created} created`);
console.log(`  Invoices: ${results.invoices.created} created, ${results.invoices.failed} failed`);
```

### Example 14: Connect Bank via Plaid and Auto-Match Transactions

```typescript
import { integrationService } from '@mcv/finance';

// After Plaid Link returns publicToken
const connection = await integrationService.connectBankWithPlaid(publicToken, institutionId);
console.log(`Connected to ${connection.institutionName}`);

// Link bank account to GL account
await integrationService.linkBankAccount(
  connection.id,
  connection.accounts[0].accountId,    // Plaid checking account
  cashAccountId                        // Local GL cash account
);

// Fetch last 30 days of transactions
const transactions = await integrationService.fetchBankTransactions(
  connection.id,
  new Date('2026-01-08'),
  new Date('2026-02-08')
);
console.log(`Imported ${transactions.length} bank transactions`);

// Auto-match against journal entries
const matches = await integrationService.autoMatchTransactions(cashAccountId);
console.log(`Matched: ${matches.filter(m => m.confidence === 'high').length} high confidence`);
console.log(`Needs review: ${matches.filter(m => m.confidence === 'low').length} multiple matches`);
```

### Example 15: Bank Reconciliation

```typescript
import { integrationService } from '@mcv/finance';

const reconciliation = await integrationService.reconcile(cashAccountId, {
  statementDate: new Date('2026-01-31'),
  statementBalance: '47523.45',
  clearedTransactionIds: [
    txn1Id, txn2Id, txn3Id, txn4Id,   // Selected cleared transactions
  ],
});

if (reconciliation.status === 'reconciled') {
  console.log('✓ Account reconciled successfully');
  console.log(`  Starting balance: $${reconciliation.startingBalance}`);
  console.log(`  Ending balance:   $${reconciliation.endingBalance}`);
} else {
  console.log('✗ Discrepancy found');
  console.log(`  Difference: