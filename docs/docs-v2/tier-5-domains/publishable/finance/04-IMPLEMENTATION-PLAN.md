# @mcv/finance — Implementation Plan

**Package:** `@mcv/finance`
**Tier:** 5 (Domain Layer — Publishable)
**Classification:** PUBLISHABLE
**Submodules:** accounting, billing, budgeting, expenses, integrations, reporting
**Last Updated:** February 9, 2026

---

## 1. Overview

The `@mcv/finance` package implements a comprehensive **Financial Management** system for the MCV.ONE ecosystem. It provides full double-entry accounting with a hierarchical chart of accounts, expense tracking with multi-level approval workflows, budget planning with forecasting and scenario analysis, advanced invoicing with branded templates and proposals, subscription billing with dunning, financial statement generation, and bidirectional integrations with QuickBooks Online, Xero, and Plaid bank feeds.

Every dollar that flows through an MCV venture — customer invoices, employee expense reimbursements, subscription renewals, bank feed imports — is captured as double-entry journal entries, tracked against budgets, and surfaced in real-time financial reports. The module is designed as a publishable package, meaning any Supabase/PostgreSQL project can use it independently.

### Key Deliverables

- **Double-entry accounting engine** with hierarchical chart of accounts and fiscal period management
- **Expense management** with OCR receipt scanning, policy enforcement, and multi-level approval
- **Budget planning** with allocations, forecasting, scenarios, and budget-vs-actual reporting
- **Advanced billing** with invoices, proposals, estimates, subscriptions, and dunning
- **Financial reporting** with income statement, balance sheet, cash flow, and custom reports
- **External integrations** with QuickBooks, Xero, and Plaid for bank reconciliation

### Success Metrics

| Metric | Target |
|--------|--------|
| Journal entry posting latency | < 200ms |
| Trial balance computation (10K accounts) | < 2 seconds |
| Invoice generation (PDF) | < 3 seconds |
| Bank reconciliation matching accuracy | > 90% auto-match |
| Financial report generation | < 5 seconds |
| Budget-vs-actual query | < 500ms |

---

## 2. Prerequisites

### Infrastructure Dependencies

| Dependency | Purpose | Required By |
|-----------|---------|-------------|
| `@mcv/kernel` | Auth context, tenant isolation, error framework | Phase 1 |
| `@mcv/db` | Drizzle ORM, connection pooling, migrations | Phase 1 |
| `@mcv/events` | Event bus for financial event notifications | Phase 1 |
| `@mcv/payments` | Stripe payment processing, Connect platform fees | Phase 2 |
| `@mcv/documents` | PDF generation, file storage for invoices/receipts | Phase 2 |
| `@mcv/notifications` | Email/SMS/push for invoice delivery, approval requests | Phase 2 |
| `@mcv/ai` | OCR receipt scanning, AI expense categorization | Phase 3 |
| PostgreSQL 15+ | Primary data store with RLS | Phase 1 |
| Redis 7+ | Caching for balances, rate limiting | Phase 1 |

### Team Requirements

| Role | Count | Phases |
|------|-------|--------|
| Senior Backend Engineer | 2 | All phases |
| Frontend Engineer | 1 | Phase 2–4 |
| Financial Domain Expert | 0.5 | Phase 1–2 (advisory) |
| QA Engineer | 1 | All phases |

### Pre-Implementation Checklist

- [ ] Supabase project provisioned with RLS policies for `finance_*` tables
- [ ] Drizzle migration pipeline tested with existing schema
- [ ] Default chart of accounts template finalized (assets, liabilities, equity, revenue, expenses)
- [ ] Fiscal year calendar confirmed for each venture (calendar year vs. custom)
- [ ] Currency configuration finalized (USD primary, multi-currency roadmap)
- [ ] Tax code catalog finalized for US operations
- [ ] Stripe Connect integration verified for platform fee collection
- [ ] QuickBooks Online developer account provisioned
- [ ] Xero developer app credentials obtained
- [ ] Plaid API credentials provisioned for bank feed integration

---

## 3. Phase 1 — Foundation (Weeks 1–8)

**Goal:** Establish the double-entry accounting engine with chart of accounts, journal entries, fiscal period management, and trial balance computation. By end of Phase 1, ventures can set up their chart of accounts, post journal entries, and generate a trial balance.

### 3.1 Database Schema & Migrations

**Duration:** Weeks 1–2
**Owner:** Senior Backend Engineer

#### Tasks

- [ ] Create Drizzle schema for `accounts` (chart of accounts) with hierarchical structure
- [ ] Create schema for `journal_entries` (header) and `journal_entry_lines` (debit/credit lines)
- [ ] Create schema for `account_balances` (period balance snapshots for fast reporting)
- [ ] Create schema for `fiscal_periods` and `fiscal_years` with open/closed/locked states
- [ ] Create schema for `recurring_journals` (automated monthly entries)
- [ ] Create schema for `expenses`, `expense_reports`, `expense_approvals`, `expense_policies`
- [ ] Create schema for `budgets`, `budget_lines`, `budget_transfers`, `budget_forecasts`, `budget_scenarios`
- [ ] Create schema for `invoices`, `invoice_line_items`, `subscriptions`, `subscription_items`
- [ ] Create schema for `billing_plans`, `payment_schedules`, `credit_notes`, `dunning_rules`
- [ ] Create schema for `invoices_v2`, `invoice_templates`, `proposals`, `estimates`, `recurring_invoices`
- [ ] Create schema for `accounting_integrations`, `integration_mappings`, `integration_sync_logs`
- [ ] Create schema for `bank_connections`, `bank_transactions`, `reconciliations`
- [ ] Create schema for `financial_reports`, `report_runs`, `report_subscriptions`
- [ ] Implement RLS policies: ventures can only access their own financial data
- [ ] Create indexes for account lookups (venture_id + account_number)
- [ ] Create composite indexes for journal entry queries (venture_id + posted_date + status)
- [ ] Create indexes for balance lookups (venture_id + account_id + period)
- [ ] Write migration scripts with rollback support

```typescript
// Example: Chart of accounts and journal entry schema
import { pgTable, uuid, text, numeric, timestamp, boolean, jsonb, integer, index, uniqueIndex, pgEnum } from 'drizzle-orm/pg-core';

export const accountTypeEnum = pgEnum('account_type', [
  'asset', 'liability', 'equity', 'revenue', 'expense',
]);

export const accountSubtypeEnum = pgEnum('account_subtype', [
  'current_asset', 'fixed_asset', 'current_liability', 'long_term_liability',
  'owners_equity', 'retained_earnings', 'operating_revenue', 'other_revenue',
  'cost_of_goods', 'operating_expense', 'other_expense',
]);

export const accounts = pgTable('finance_accounts', {
  id: uuid('id').primaryKey().defaultRandom(),
  ventureId: uuid('venture_id').notNull(),
  accountNumber: text('account_number').notNull(),
  name: text('name').notNull(),
  description: text('description'),
  type: accountTypeEnum('type').notNull(),
  subtype: accountSubtypeEnum('subtype'),
  parentId: uuid('parent_id'), // self-referencing for hierarchy
  normalBalance: text('normal_balance').notNull(), // 'debit' | 'credit'
  currency: text('currency').default('USD').notNull(),
  isActive: boolean('is_active').default(true).notNull(),
  isSystemAccount: boolean('is_system_account').default(false).notNull(),
  metadata: jsonb('metadata').$type<Record<string, unknown>>(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  uniqueIndex('account_venture_number_idx').on(table.ventureId, table.accountNumber),
  index('account_venture_type_idx').on(table.ventureId, table.type),
  index('account_parent_idx').on(table.parentId),
]);

export const journalEntries = pgTable('finance_journal_entries', {
  id: uuid('id').primaryKey().defaultRandom(),
  ventureId: uuid('venture_id').notNull(),
  entryNumber: text('entry_number').notNull(), // auto-generated sequential
  description: text('description').notNull(),
  postDate: timestamp('post_date', { withTimezone: true }).notNull(),
  status: text('status').default('draft').notNull(), // 'draft' | 'posted' | 'reversed' | 'void'
  sourceType: text('source_type'), // 'manual' | 'invoice' | 'expense' | 'recurring' | 'import'
  sourceId: text('source_id'), // FK to originating record
  fiscalPeriodId: uuid('fiscal_period_id'),
  reversalOf: uuid('reversal_of'), // if this is a reversal entry
  metadata: jsonb('metadata').$type<Record<string, unknown>>(),
  createdBy: uuid('created_by').notNull(),
  postedBy: uuid('posted_by'),
  postedAt: timestamp('posted_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  uniqueIndex('je_venture_number_idx').on(table.ventureId, table.entryNumber),
  index('je_venture_date_idx').on(table.ventureId, table.postDate),
  index('je_venture_status_idx').on(table.ventureId, table.status),
  index('je_source_idx').on(table.sourceType, table.sourceId),
]);

export const journalEntryLines = pgTable('finance_journal_entry_lines', {
  id: uuid('id').primaryKey().defaultRandom(),
  journalEntryId: uuid('journal_entry_id').notNull(),
  accountId: uuid('account_id').notNull(),
  description: text('description'),
  debitAmount: numeric('debit_amount', { precision: 18, scale: 2 }).default('0'),
  creditAmount: numeric('credit_amount', { precision: 18, scale: 2 }).default('0'),
  currency: text('currency').default('USD').notNull(),
  exchangeRate: numeric('exchange_rate', { precision: 12, scale: 6 }).default('1'),
  dimensionValues: jsonb('dimension_values').$type<Record<string, string>>(),
  lineOrder: integer('line_order').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  index('jel_entry_idx').on(table.journalEntryId),
  index('jel_account_idx').on(table.accountId),
]);
```

### 3.2 Chart of Accounts Management

**Duration:** Weeks 2–3
**Owner:** Senior Backend Engineer

#### Tasks

- [ ] Implement `accountingService.createAccount()` — create GL account with validation
- [ ] Implement hierarchical account structure (parent-child relationships)
- [ ] Implement account number validation (format constraints per account type)
- [ ] Implement normal balance enforcement (assets/expenses = debit normal; liabilities/equity/revenue = credit normal)
- [ ] Implement default chart of accounts provisioning for new ventures:
  - 1xxx: Assets (Cash, AR, Inventory, Fixed Assets)
  - 2xxx: Liabilities (AP, Accrued Expenses, Loans)
  - 3xxx: Equity (Retained Earnings, Common Stock)
  - 4xxx: Revenue (Product Sales, Service Revenue, Other Income)
  - 5xxx: Expenses (COGS, Operating Expenses, Payroll)
- [ ] Implement account activation/deactivation (cannot deactivate accounts with balances)
- [ ] Implement account search and filtering by type, subtype, status
- [ ] Create React hooks: `useChartOfAccounts`
- [ ] Create React component: `ChartOfAccountsTree` (expandable tree view)
- [ ] Protect system accounts from deletion (AR, AP, Cash, Retained Earnings)

```typescript
// Example: Default chart of accounts provisioning
export const DEFAULT_CHART_OF_ACCOUNTS: CreateAccountInput[] = [
  // Assets
  { accountNumber: '1000', name: 'Current Assets', type: 'asset', subtype: 'current_asset', normalBalance: 'debit' },
  { accountNumber: '1010', name: 'Cash and Cash Equivalents', type: 'asset', subtype: 'current_asset', normalBalance: 'debit', parentNumber: '1000', isSystemAccount: true },
  { accountNumber: '1020', name: 'Accounts Receivable', type: 'asset', subtype: 'current_asset', normalBalance: 'debit', parentNumber: '1000', isSystemAccount: true },
  { accountNumber: '1030', name: 'Inventory', type: 'asset', subtype: 'current_asset', normalBalance: 'debit', parentNumber: '1000' },
  { accountNumber: '1100', name: 'Fixed Assets', type: 'asset', subtype: 'fixed_asset', normalBalance: 'debit' },
  { accountNumber: '1110', name: 'Equipment', type: 'asset', subtype: 'fixed_asset', normalBalance: 'debit', parentNumber: '1100' },
  { accountNumber: '1120', name: 'Accumulated Depreciation', type: 'asset', subtype: 'fixed_asset', normalBalance: 'credit', parentNumber: '1100' },

  // Liabilities
  { accountNumber: '2000', name: 'Current Liabilities', type: 'liability', subtype: 'current_liability', normalBalance: 'credit' },
  { accountNumber: '2010', name: 'Accounts Payable', type: 'liability', subtype: 'current_liability', normalBalance: 'credit', parentNumber: '2000', isSystemAccount: true },
  { accountNumber: '2020', name: 'Accrued Expenses', type: 'liability', subtype: 'current_liability', normalBalance: 'credit', parentNumber: '2000' },
  { accountNumber: '2030', name: 'Unearned Revenue', type: 'liability', subtype: 'current_liability', normalBalance: 'credit', parentNumber: '2000' },

  // Equity
  { accountNumber: '3000', name: 'Owner\'s Equity', type: 'equity', subtype: 'owners_equity', normalBalance: 'credit' },
  { accountNumber: '3010', name: 'Retained Earnings', type: 'equity', subtype: 'retained_earnings', normalBalance: 'credit', parentNumber: '3000', isSystemAccount: true },

  // Revenue
  { accountNumber: '4000', name: 'Operating Revenue', type: 'revenue', subtype: 'operating_revenue', normalBalance: 'credit' },
  { accountNumber: '4010', name: 'Product Sales', type: 'revenue', subtype: 'operating_revenue', normalBalance: 'credit', parentNumber: '4000' },
  { accountNumber: '4020', name: 'Service Revenue', type: 'revenue', subtype: 'operating_revenue', normalBalance: 'credit', parentNumber: '4000' },

  // Expenses
  { accountNumber: '5000', name: 'Cost of Goods Sold', type: 'expense', subtype: 'cost_of_goods', normalBalance: 'debit' },
  { accountNumber: '5100', name: 'Operating Expenses', type: 'expense', subtype: 'operating_expense', normalBalance: 'debit' },
  { accountNumber: '5110', name: 'Salaries & Wages', type: 'expense', subtype: 'operating_expense', normalBalance: 'debit', parentNumber: '5100' },
  { accountNumber: '5120', name: 'Rent', type: 'expense', subtype: 'operating_expense', normalBalance: 'debit', parentNumber: '5100' },
  { accountNumber: '5130', name: 'Marketing', type: 'expense', subtype: 'operating_expense', normalBalance: 'debit', parentNumber: '5100' },
];
```

### 3.3 Journal Entry Engine

**Duration:** Weeks 3–5
**Owner:** Senior Backend Engineer + Financial Domain Expert

#### Tasks

- [ ] Implement `accountingService.createJournalEntry()` — create draft journal entry
- [ ] Implement **double-entry validation**: total debits MUST equal total credits (±0.01 tolerance for rounding)
- [ ] Implement journal entry posting: draft → posted (creates balance impacts)
- [ ] Implement sequential entry numbering per venture (JE-2026-0001, JE-2026-0002, ...)
- [ ] Implement journal entry reversal: create mirror entry with opposite debits/credits
- [ ] Implement void: mark entry as void without creating reversal (for errors)
- [ ] Implement fiscal period validation: cannot post to closed or locked periods
- [ ] Implement account balance computation from journal entry lines
- [ ] Implement `getTrialBalance()` — compute debit/credit totals per account for a period
- [ ] Implement `getAccountLedger()` — chronological list of entries affecting an account
- [ ] Implement recurring journal entries: templates that auto-post monthly/quarterly
- [ ] Create React hooks: `useJournalEntries`
- [ ] Create React component: `JournalEntryForm` (multi-line debit/credit editor)
- [ ] Implement bulk journal entry import (CSV/Excel format)
- [ ] Implement journal entry approval workflow (optional, for large amounts)

```typescript
// Example: Double-entry journal entry creation with validation
export async function createJournalEntry(
  ventureId: string,
  input: CreateJournalEntryInput,
  userId: string,
): Promise<JournalEntry> {
  // Validate debits = credits
  const totalDebits = input.lines.reduce((sum, l) => sum + parseFloat(l.debitAmount ?? '0'), 0);
  const totalCredits = input.lines.reduce((sum, l) => sum + parseFloat(l.creditAmount ?? '0'), 0);

  if (Math.abs(totalDebits - totalCredits) > 0.01) {
    throw new ValidationError(
      `Journal entry is unbalanced: debits (${totalDebits.toFixed(2)}) ≠ credits (${totalCredits.toFixed(2)})`,
    );
  }

  // Validate each line has either debit OR credit, not both
  for (const line of input.lines) {
    const debit = parseFloat(line.debitAmount ?? '0');
    const credit = parseFloat(line.creditAmount ?? '0');
    if (debit > 0 && credit > 0) {
      throw new ValidationError('A journal entry line cannot have both debit and credit amounts');
    }
    if (debit === 0 && credit === 0) {
      throw new ValidationError('A journal entry line must have either a debit or credit amount');
    }
  }

  // Validate fiscal period is open
  const period = await getFiscalPeriodForDate(ventureId, input.postDate);
  if (period.status === 'closed' || period.status === 'locked') {
    throw new ValidationError(`Cannot post to ${period.status} fiscal period: ${period.name}`);
  }

  // Validate all accounts exist and are active
  const accountIds = input.lines.map(l => l.accountId);
  const accounts = await getAccountsByIds(ventureId, accountIds);
  for (const line of input.lines) {
    const account = accounts.find(a => a.id === line.accountId);
    if (!account) throw new NotFoundError(`Account ${line.accountId} not found`);
    if (!account.isActive) throw new ValidationError(`Account ${account.name} is inactive`);
  }

  return await db.transaction(async (tx) => {
    const entryNumber = await getNextEntryNumber(tx, ventureId);

    const [entry] = await tx.insert(journalEntries).values({
      ventureId,
      entryNumber,
      description: input.description,
      postDate: input.postDate,
      status: 'draft',
      sourceType: input.sourceType ?? 'manual',
      sourceId: input.sourceId,
      fiscalPeriodId: period.id,
      createdBy: userId,
    }).returning();

    for (let i = 0; i < input.lines.length; i++) {
      await tx.insert(journalEntryLines).values({
        journalEntryId: entry.id,
        accountId: input.lines[i].accountId,
        description: input.lines[i].description,
        debitAmount: input.lines[i].debitAmount ?? '0',
        creditAmount: input.lines[i].creditAmount ?? '0',
        currency: input.lines[i].currency ?? 'USD',
        exchangeRate: input.lines[i].exchangeRate ?? '1',
        dimensionValues: input.lines[i].dimensionValues,
        lineOrder: i + 1,
      });
    }

    return entry;
  });
}
```

### 3.4 Fiscal Period Management

**Duration:** Weeks 5–6
**Owner:** Senior Backend Engineer

#### Tasks

- [ ] Implement fiscal year creation (calendar year or custom start/end)
- [ ] Implement fiscal period generation (12 monthly periods per fiscal year)
- [ ] Implement period status lifecycle: open → closed → locked
- [ ] Implement period closing: validate all entries posted, compute closing balances
- [ ] Implement year-end closing: generate closing entries (revenue/expense → retained earnings)
- [ ] Implement account balance snapshots: store beginning/ending balances per period per account
- [ ] Implement period reopening (with audit trail and approval)
- [ ] Implement balance carryforward: opening balances for new period = closing balances of prior period
- [ ] Create React hooks: `useFiscalPeriods`
- [ ] Implement period close validation checklist (unposted drafts, unreconciled items)

### 3.5 Trial Balance & Account Balances

**Duration:** Weeks 6–8
**Owner:** Senior Backend Engineer

#### Tasks

- [ ] Implement `getTrialBalance()` — compute running debit/credit balance per account
- [ ] Implement real-time balance computation from journal entry lines (for current period)
- [ ] Implement cached balance retrieval from `account_balances` table (for closed periods)
- [ ] Implement account balance refresh: recompute and cache balances on demand
- [ ] Implement sub-account aggregation: parent account balances include all children
- [ ] Implement dimensional balance breakdown (e.g., revenue by department, expenses by project)
- [ ] Implement balance sheet equation validation: Assets = Liabilities + Equity
- [ ] Implement balance caching in Redis for real-time dashboard display
- [ ] Create React hooks: `useTrialBalance`, `useAccountBalance`

### 3.6 Phase 1 Acceptance Criteria

| Criterion | Validation Method |
|-----------|-------------------|
| Default chart of accounts provisions 20+ accounts | Integration test |
| Journal entry with unbalanced debits/credits is rejected | Unit test |
| Journal entry posting updates account balances | Integration test |
| Journal entry reversal creates balanced mirror entry | Integration test |
| Cannot post to closed fiscal period | Integration test |
| Trial balance debits = credits | Unit test (golden dataset) |
| Sub-account balances aggregate to parent | Unit test |
| Fiscal year close generates correct closing entries | Integration test |
| Sequential entry numbering is gap-free | Concurrent stress test |
| RLS prevents cross-venture ledger access | Security test |

---

## 4. Phase 2 — Core Features (Weeks 9–18)

**Goal:** Build billing/invoicing, expense management, budgeting, and basic financial reporting. By end of Phase 2, ventures can create invoices, track expenses with approvals, manage budgets, and generate financial statements.

### 4.1 Billing & Invoicing

**Duration:** Weeks 9–12
**Owner:** Senior Backend Engineer + Frontend Engineer

#### Tasks

- [ ] Implement `billingService.createInvoice()` — create invoice with line items
- [ ] Implement invoice lifecycle: draft → sent → viewed → partial → paid → void
- [ ] Implement invoice numbering (INV-2026-0001, configurable prefix)
- [ ] Implement invoice line items with quantity, unit price, tax, discount
- [ ] Implement tax calculation engine (percentage-based, compound taxes)
- [ ] Implement payment terms: Net 15, Net 30, Net 60, Due on Receipt, custom
- [ ] Implement invoice PDF generation with branded templates
- [ ] Implement invoice email delivery with payment link
- [ ] Implement payment recording: mark invoice as paid (partial or full)
- [ ] Implement automatic journal entry creation on invoice events:
  - Invoice sent: DR Accounts Receivable, CR Revenue
  - Payment received: DR Cash, CR Accounts Receivable
  - Void: Reverse the original entry
- [ ] Implement credit notes (partial/full refund linked to invoice)
- [ ] Implement recurring invoices: auto-generate from templates on schedule
- [ ] Implement subscription billing: plans, items, renewal, proration
- [ ] Implement dunning rules: automated payment reminders at configurable intervals
- [ ] Implement payment schedules: installment plans for large invoices
- [ ] Implement proposals: multi-section documents with e-signature workflow
- [ ] Implement estimates/quotes with version tracking and convert-to-invoice
- [ ] Implement Stripe Connect platform fee configuration and ledger
- [ ] Create React components: `InvoiceEditor`, `InvoicePreview`, `SubscriptionManager`
- [ ] Create React hooks: `useInvoices`, `useSubscriptions`

```typescript
// Example: Invoice creation with automatic journal entry
export async function createInvoice(
  ventureId: string,
  input: CreateInvoiceInput,
  userId: string,
): Promise<Invoice> {
  return await db.transaction(async (tx) => {
    // Calculate totals
    const subtotal = input.lineItems.reduce(
      (sum, item) => sum + item.quantity * item.unitPrice, 0,
    );
    const taxAmount = input.lineItems.reduce(
      (sum, item) => sum + (item.quantity * item.unitPrice * (item.taxRate ?? 0)), 0,
    );
    const totalAmount = subtotal + taxAmount - (input.discountAmount ?? 0);

    const invoiceNumber = await getNextInvoiceNumber(tx, ventureId);

    const [invoice] = await tx.insert(invoices).values({
      ventureId,
      invoiceNumber,
      customerId: input.customerId,
      status: 'draft',
      issueDate: input.issueDate ?? new Date(),
      dueDate: computeDueDate(input.issueDate ?? new Date(), input.paymentTerms ?? 'net_30'),
      subtotalCents: Math.round(subtotal * 100),
      taxCents: Math.round(taxAmount * 100),
      totalCents: Math.round(totalAmount * 100),
      balanceDueCents: Math.round(totalAmount * 100),
      currency: input.currency ?? 'USD',
      paymentTerms: input.paymentTerms ?? 'net_30',
      notes: input.notes,
      createdBy: userId,
    }).returning();

    // Insert line items
    for (let i = 0; i < input.lineItems.length; i++) {
      const item = input.lineItems[i];
      await tx.insert(invoiceLineItems).values({
        invoiceId: invoice.id,
        description: item.description,
        quantity: item.quantity,
        unitPriceCents: Math.round(item.unitPrice * 100),
        taxRate: item.taxRate ?? 0,
        accountId: item.revenueAccountId,
        lineOrder: i + 1,
      });
    }

    return invoice;
  });
}

// When invoice is sent → create AR journal entry
export async function sendInvoice(ventureId: string, invoiceId: string, userId: string) {
  const invoice = await getInvoice(ventureId, invoiceId);
  if (invoice.status !== 'draft') throw new ValidationError('Can only send draft invoices');

  await db.transaction(async (tx) => {
    // Update invoice status
    await tx.update(invoices)
      .set({ status: 'sent', sentAt: new Date() })
      .where(eq(invoices.id, invoiceId));

    // Create AR journal entry
    await createJournalEntry(ventureId, {
      description: `Invoice ${invoice.invoiceNumber} — ${invoice.customerName}`,
      postDate: invoice.issueDate,
      sourceType: 'invoice',
      sourceId: invoiceId,
      lines: [
        { accountId: getSystemAccountId(ventureId, 'accounts_receivable'), debitAmount: (invoice.totalCents / 100).toFixed(2) },
        { accountId: invoice.revenueAccountId, creditAmount: (invoice.totalCents / 100).toFixed(2) },
      ],
    }, userId);
  });
}
```

### 4.2 Expense Management

**Duration:** Weeks 12–14
**Owner:** Senior Backend Engineer

#### Tasks

- [ ] Implement `expenseService.createExpense()` — create single expense with receipt
- [ ] Implement expense categories: travel, meals, supplies, software, equipment, other
- [ ] Implement receipt upload with file storage integration
- [ ] Implement expense report creation: group multiple expenses into submission
- [ ] Implement expense policy engine: per-category spending limits, per-diem rates, mileage rates
- [ ] Implement policy validation: auto-flag expenses that exceed policy limits
- [ ] Implement multi-level approval workflow:
  - Manager approval (for expenses up to $500)
  - Director approval ($500–$5000)
  - VP/CFO approval (> $5000)
  - Custom configurable thresholds per venture
- [ ] Implement approval routing: auto-assign approver based on org hierarchy
- [ ] Implement approval actions: approve, reject (with reason), request more info
- [ ] Implement automatic journal entry on approval:
  - DR Expense account (category-mapped), CR Accounts Payable
- [ ] Implement reimbursement tracking: approved → paid
- [ ] Implement corporate card management: link cards, auto-import transactions
- [ ] Implement card transaction → expense auto-matching
- [ ] Implement expense analytics: spending by category, department, venture, trend
- [ ] Create React components: `ExpenseReportBuilder`, `ReceiptUploader`, `ApprovalInbox`
- [ ] Create React hooks: `useExpenses`, `useExpenseApproval`

### 4.3 Budget Planning

**Duration:** Weeks 14–16
**Owner:** Senior Backend Engineer + Frontend Engineer

#### Tasks

- [ ] Implement `budgetingService.createBudget()` — create budget with line items
- [ ] Implement budget types: annual, quarterly, project-based
- [ ] Implement budget line items mapped to chart of accounts
- [ ] Implement period allocation: distribute annual budget across months (equal, seasonal, custom)
- [ ] Implement budget-vs-actual computation: compare budget amounts to actual journal entry totals
- [ ] Implement variance analysis: dollar and percentage variance per line item
- [ ] Implement budget transfers: move allocation between budget lines with approval
- [ ] Implement budget alerts: configurable thresholds (80%, 90%, 100% of budget consumed)
- [ ] Implement budget forecasting: project end-of-period actual based on current run rate
- [ ] Implement scenario planning: create "what-if" budget scenarios
  - Best case / worst case / expected
  - Model impact of hiring decisions, revenue changes, cost cuts
- [ ] Implement budget approval workflow: draft → submitted → approved → active
- [ ] Create React components: `BudgetDashboard`, `BudgetVsActualChart`
- [ ] Create React hooks: `useBudget`, `useBudgetVsActual`
- [ ] Implement budget rollover: carry unused budget to next period (configurable)

```typescript
// Example: Budget vs actual computation
export async function getBudgetVsActual(
  ventureId: string,
  budgetId: string,
  periodStart: Date,
  periodEnd: Date,
): Promise<BudgetVsActualReport> {
  const budget = await getBudget(ventureId, budgetId);
  const budgetLines = await getBudgetLines(budgetId);

  const report: BudgetVsActualReport = {
    budgetId,
    budgetName: budget.name,
    period: { start: periodStart, end: periodEnd },
    lines: [],
    totals: { budgeted: 0, actual: 0, variance: 0, variancePercent: 0 },
  };

  for (const line of budgetLines) {
    // Get budgeted amount for period
    const budgeted = await getBudgetedAmountForPeriod(line.id, periodStart, periodEnd);

    // Get actual from journal entries
    const actual = await getActualSpendForAccount(
      ventureId, line.accountId, periodStart, periodEnd,
    );

    const variance = budgeted - actual;
    const variancePercent = budgeted > 0 ? (variance / budgeted) * 100 : 0;

    report.lines.push({
      accountId: line.accountId,
      accountName: line.accountName,
      accountNumber: line.accountNumber,
      budgeted,
      actual,
      variance,
      variancePercent,
      status: actual > budgeted ? 'over_budget' : actual > budgeted * 0.9 ? 'warning' : 'on_track',
    });

    report.totals.budgeted += budgeted;
    report.totals.actual += actual;
  }

  report.totals.variance = report.totals.budgeted - report.totals.actual;
  report.totals.variancePercent = report.totals.budgeted > 0
    ? (report.totals.variance / report.totals.budgeted) * 100 : 0;

  return report;
}
```

### 4.4 Basic Financial Reporting

**Duration:** Weeks 16–18
**Owner:** Senior Backend Engineer

#### Tasks

- [ ] Implement `reportingService.generateIncomeStatement()`:
  - Revenue accounts minus expense accounts for a period
  - Grouped by account type/subtype
  - Comparative (current period vs prior period vs budget)
- [ ] Implement `reportingService.generateBalanceSheet()`:
  - Assets, Liabilities, Equity as of a specific date
  - Hierarchical grouping by account subtype
  - Balance validation: Assets = Liabilities + Equity
- [ ] Implement `reportingService.generateCashFlow()`:
  - Operating, Investing, Financing activities
  - Indirect method: start with net income, adjust for non-cash items
  - Beginning and ending cash balance
- [ ] Implement `reportingService.generateAgedReceivables()`:
  - Current, 1–30, 31–60, 61–90, 90+ day aging buckets
  - By customer, with total and percentage distribution
- [ ] Implement `reportingService.generateAgedPayables()`:
  - Same aging structure for accounts payable
- [ ] Implement report export: PDF, Excel, CSV formats
- [ ] Implement report subscriptions: auto-email reports on schedule
- [ ] Implement report history: track all generated reports
- [ ] Create React components: `IncomeStatementView`, `BalanceSheetView`, `CashFlowView`
- [ ] Create React hooks: `useFinancialReports`
- [ ] Implement custom report builder: user-defined report layouts

### 4.5 Phase 2 Acceptance Criteria

| Criterion | Validation Method |
|-----------|-------------------|
| Invoice creation generates correct line item totals | Unit test |
| Sending invoice creates balanced AR journal entry | Integration test |
| Payment recording creates balanced Cash/AR journal entry | Integration test |
| Credit note correctly reverses invoice entries | Integration test |
| Recurring invoice auto-generates on schedule | Cron test |
| Expense exceeding policy flagged automatically | Unit test |
| Approval workflow routes to correct approver by amount | Integration test |
| Approved expense creates correct journal entry | Integration test |
| Budget-vs-actual matches manually computed values | Unit test (golden dataset) |
| Budget alert fires at 90% threshold | Integration test |
| Income statement revenue - expenses = net income | Unit test |
| Balance sheet balances: Assets = Liabilities + Equity | Unit test |
| PDF report renders correctly with all sections | Snapshot test |
| Report subscription delivers email on schedule | E2E test |

---

## 5. Phase 3 — Advanced Features (Weeks 19–26)

**Goal:** Add QuickBooks/Xero integration, Plaid bank reconciliation, AI-powered expense categorization, and multi-venture financial consolidation.

### 5.1 QuickBooks Online Integration

**Duration:** Weeks 19–21
**Owner:** Senior Backend Engineer

#### Tasks

- [ ] Implement OAuth 2.0 connection flow for QuickBooks Online
- [ ] Implement chart of accounts sync: MCV accounts ↔ QBO accounts
- [ ] Implement entity ID mapping: store MCV ID ↔ QBO ID for all synced entities
- [ ] Implement journal entry push: post MCV journal entries to QBO
- [ ] Implement invoice sync: push MCV invoices to QBO (bidirectional)
- [ ] Implement customer/vendor sync
- [ ] Implement sync direction configuration: MCV→QBO, QBO→MCV, or bidirectional
- [ ] Implement sync scheduling: configurable interval (hourly, daily, manual)
- [ ] Implement sync conflict resolution: last-write-wins with audit trail
- [ ] Implement sync error handling: retry with exponential backoff, dead-letter for unrecoverable
- [ ] Implement sync log: detailed record of every entity synced with status
- [ ] Implement disconnect flow: cleanly unlink without data loss
- [ ] Create React component: `IntegrationSetupWizard` (step-by-step OAuth + mapping)

### 5.2 Xero Integration

**Duration:** Weeks 21–22
**Owner:** Senior Backend Engineer

#### Tasks

- [ ] Implement OAuth 2.0 connection flow for Xero
- [ ] Implement chart of accounts sync (Xero uses different account structure)
- [ ] Implement journal entry push to Xero
- [ ] Implement invoice sync (Xero invoices ↔ MCV invoices)
- [ ] Implement payment sync
- [ ] Implement tenant selection (Xero supports multi-org per connection)
- [ ] Reuse sync infrastructure from QuickBooks (sync scheduler, error handling, logging)
- [ ] Implement Xero-specific field mappings and transformations

### 5.3 Plaid Bank Reconciliation

**Duration:** Weeks 22–24
**Owner:** Senior Backend Engineer + Data Engineer

#### Tasks

- [ ] Implement Plaid Link integration for bank account connection
- [ ] Implement bank transaction import: pull transactions via Plaid API
- [ ] Implement automatic transaction categorization: match bank transactions to GL accounts
- [ ] Implement transaction matching engine:
  - Exact match: amount + date + description → journal entry
  - Fuzzy match: similar amount ± 1 day → suggest match
  - Multi-to-one: multiple bank transactions → single journal entry
  - One-to-multi: single bank transaction → multiple journal entries
- [ ] Implement confidence scoring for auto-matches (high/medium/low/no match)
- [ ] Implement manual match/unmatch interface
- [ ] Implement reconciliation workflow: review matches → confirm → mark reconciled
- [ ] Implement reconciliation status tracking per bank account per period
- [ ] Implement bank rule engine: user-defined rules for recurring categorization
  - "If description contains 'AMZN' → categorize as Office Supplies"
  - "If amount = $99.99 and vendor = 'Slack' → categorize as Software"
- [ ] Implement unreconciled items report
- [ ] Create React components: `BankReconciliationPanel`, `BankFeedView`
- [ ] Create React hooks: `useReconciliation`, `useBankFeed`

```typescript
// Example: Bank transaction matching engine
export async function matchBankTransactions(
  ventureId: string,
  bankAccountId: string,
): Promise<MatchResult[]> {
  const unmatchedTxns = await getUnmatchedBankTransactions(ventureId, bankAccountId);
  const results: MatchResult[] = [];

  for (const txn of unmatchedTxns) {
    // Try exact match first
    const exactMatch = await findExactMatch(ventureId, txn);
    if (exactMatch) {
      results.push({ bankTransaction: txn, match: exactMatch, confidence: 'high', action: 'auto_match' });
      continue;
    }

    // Try fuzzy match
    const fuzzyMatches = await findFuzzyMatches(ventureId, txn);
    if (fuzzyMatches.length === 1) {
      results.push({ bankTransaction: txn, match: fuzzyMatches[0], confidence: 'medium', action: 'suggest' });
      continue;
    }

    // Try bank rules
    const ruleMatch = await applyBankRules(ventureId, txn);
    if (ruleMatch) {
      results.push({ bankTransaction: txn, match: ruleMatch, confidence: 'medium', action: 'create_entry' });
      continue;
    }

    results.push({ bankTransaction: txn, match: null, confidence: 'none', action: 'manual' });
  }

  return results;
}

async function findExactMatch(ventureId: string, txn: BankTransaction) {
  return await db.select()
    .from(journalEntryLines)
    .innerJoin(journalEntries, eq(journalEntries.id, journalEntryLines.journalEntryId))
    .where(and(
      eq(journalEntries.ventureId, ventureId),
      eq(journalEntries.status, 'posted'),
      eq(journalEntryLines.debitAmount, Math.abs(txn.amount).toFixed(2)),
      between(journalEntries.postDate,
        subDays(txn.date, 1),
        addDays(txn.date, 1),
      ),
    ))
    .limit(1);
}
```

### 5.4 AI-Powered Expense Categorization

**Duration:** Weeks 24–25
**Owner:** Senior Backend Engineer + ML integration

#### Tasks

- [ ] Integrate `@mcv/ai` for receipt OCR: extract vendor, amount, date, line items from photos
- [ ] Implement AI expense categorization: predict GL account from description/vendor
- [ ] Train categorization model on historical expense data per venture
- [ ] Implement confidence scoring: auto-categorize when confidence > 90%, suggest when 60–90%
- [ ] Implement feedback loop: user corrections improve future predictions
- [ ] Implement duplicate expense detection (same amount + date + vendor)
- [ ] Implement mileage calculation: compute reimbursement from trip start/end addresses
- [ ] Implement per-diem automation: auto-calculate meal/lodging allowances based on location

### 5.5 Multi-Venture Financial Consolidation

**Duration:** Weeks 25–26
**Owner:** Senior Backend Engineer

#### Tasks

- [ ] Implement consolidated financial statements across multiple ventures
- [ ] Implement inter-venture elimination entries (transactions between ventures)
- [ ] Implement currency conversion for ventures operating in different currencies
- [ ] Implement consolidation adjustments (minority interests, goodwill)
- [ ] Implement consortium-level P&L, balance sheet, and cash flow
- [ ] Implement venture-level contribution analysis (% of consortium revenue/expense)
- [ ] Implement drill-down: consolidated → venture → account → journal entry
- [ ] Create consortium financial dashboard

### 5.6 Phase 3 Acceptance Criteria

| Criterion | Validation Method |
|-----------|-------------------|
| QuickBooks OAuth connection establishes successfully | E2E test |
| Chart of accounts maps correctly between MCV and QBO | Integration test |
| Invoice pushed to QBO matches original amounts | Integration test |
| Sync retry recovers from transient QBO API failures | Chaos test |
| Xero connection and basic sync operational | E2E test |
| Plaid bank feed imports transactions correctly | Integration test |
| Auto-matching correctly links 90%+ of known matches | Backtesting |
| Bank rules auto-categorize recurring transactions | Integration test |
| Reconciliation workflow marks transactions as reconciled | E2E test |
| OCR extracts vendor, amount, date from receipt photo | Integration test |
| AI categorization accuracy > 85% on test dataset | ML evaluation |
| Consolidated income statement sums all ventures correctly | Unit test |
| Inter-venture eliminations net to zero | Unit test |

---

## 6. Phase 4 — Polish & Hardening (Weeks 27–30)

**Goal:** Production hardening, performance optimization, comprehensive documentation, and operational readiness.

### 6.1 Performance Optimization

- [ ] Optimize trial balance computation for ventures with 10K+ accounts
- [ ] Implement materialized views for common report queries
- [ ] Cache account balances in Redis with invalidation on journal entry post
- [ ] Optimize reconciliation matching with database-level fuzzy matching functions
- [ ] Implement batch processing for bulk invoice generation
- [ ] Optimize integration sync with batch API calls (QuickBooks/Xero batch endpoints)
- [ ] Implement pagination for large ledger views and transaction lists

### 6.2 Observability & Monitoring

- [ ] Instrument all services with OpenTelemetry tracing
- [ ] Create Grafana dashboards: journal entry volume, sync status, reconciliation rates
- [ ] Set up PagerDuty alerts: sync failures, balance discrepancies, period close errors
- [ ] Implement health check endpoints for all finance services
- [ ] Create operational runbooks for common financial operations
- [ ] Implement audit trail for all financial mutations (who changed what, when)

### 6.3 Documentation & Developer Experience

- [ ] Write chart of accounts setup guide per industry (SaaS, e-commerce, marketplace)
- [ ] Create journal entry patterns cookbook (common business transactions)
- [ ] Write invoice customization guide (templates, branding)
- [ ] Create expense policy configuration tutorial
- [ ] Document integration setup for QuickBooks, Xero, and Plaid
- [ ] Write API reference with OpenAPI/Swagger specification
- [ ] Create financial domain glossary for developers
- [ ] Write data model guide explaining double-entry accounting concepts

### 6.4 Security & Compliance

- [ ] Penetration test all finance API endpoints
- [ ] Validate RLS policy coverage for all 46 finance tables
- [ ] Implement financial data encryption at rest for sensitive fields
- [ ] Validate SOX compliance requirements (audit trail, access controls, separation of duties)
- [ ] Implement API rate limiting per venture
- [ ] Validate PCI compliance for any stored payment data
- [ ] Implement financial data retention policies

### 6.5 Phase 4 Acceptance Criteria

| Criterion | Validation Method |
|-----------|-------------------|
| Trial balance computes in < 2s for 10K accounts | Performance test |
| All financial API endpoints traced in OpenTelemetry | Trace inspection |
| PagerDuty fires on balance discrepancy detection | Chaos test |
| Complete audit trail for all journal entries | Manual review |
| RLS blocks cross-venture financial data access | Automated security scan |
| API reference covers all public methods | Doc review |
| Published package installs cleanly in standalone project | Package test |

---

## 7. Testing Strategy

### Unit Tests

| Area | Coverage Target | Key Test Cases |
|------|-----------------|----------------|
| Double-entry validation | 100% | Balanced/unbalanced, zero lines, multi-currency, rounding |
| Account hierarchy | 95% | Parent-child aggregation, depth limits, circular reference prevention |
| Invoice calculations | 100% | Tax, discounts, multi-line, partial payments, credit notes |
| Expense policies | 95% | Category limits, per-diem, mileage, multi-level thresholds |
| Budget vs actual | 95% | All allocation methods, variance calculation, rollover |
| Report generation | 90% | Income statement, balance sheet, cash flow, aged AR/AP |
| Reconciliation matching | 95% | Exact match, fuzzy match, multi-match, no match |

### Integration Tests

| Scenario | Description |
|----------|-------------|
| Invoice lifecycle | Create → send (creates JE) → pay (creates JE) → verify balances |
| Expense flow | Create → submit report → approve → reimburse → verify JE |
| Budget flow | Create budget → record actuals → verify BvA report |
| Period close | Post entries → close period → verify balances carried forward |
| Year-end close | Close all periods → generate closing entries → verify retained earnings |
| QBO sync | Connect → map accounts → sync invoice → verify in QBO |
| Reconciliation | Import bank txns → auto-match → manual match → reconcile |
| Consolidation | Generate venture reports → consolidate → verify eliminations |

### Performance Tests

| Test | Target | Tool |
|------|--------|------|
| Journal entry posting | < 200ms | k6 |
| Trial balance (10K accounts) | < 2s | Custom benchmark |
| Invoice PDF generation | < 3s | Custom benchmark |
| Budget vs actual query | < 500ms | k6 |
| Bank reconciliation matching (1000 txns) | < 10s | Custom benchmark |
| QBO sync (100 invoices) | < 60s | E2E test |

### Security Tests

- RLS policy validation for all 46 finance tables
- Separation of duties enforcement (creator ≠ approver)
- Financial data encryption at rest
- Cross-venture isolation verification
- Rate limiting enforcement
- SQL injection prevention

---

## 8. Risk Matrix

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| **Double-entry bugs causing imbalanced ledger** | Low | Critical | 100% unit test coverage; database-level constraint; balance validation on every report |
| **QuickBooks/Xero API breaking changes** | High | Medium | Version-pinned API clients; integration health monitoring; degradation to manual sync |
| **Bank reconciliation false matches** | Medium | High | Conservative auto-match thresholds; human review for medium-confidence; undo capability |
| **Fiscal period close errors** | Low | High | Pre-close validation checklist; period reopen capability; comprehensive testing |
| **PII in financial data** | Medium | High | Encryption at rest; RLS policies; PCI compliance review; access audit logging |
| **Currency conversion errors** | Medium | Medium | Use established exchange rate APIs; lock rates at transaction time; reconciliation checks |
| **Integration sync data loss** | Low | High | Idempotent sync operations; comprehensive sync logging; manual retry; data comparison |
| **Expense policy bypass** | Low | Medium | Server-side policy enforcement; approval workflow cannot be skipped; audit trail |
| **Report calculation errors** | Low | Critical | Golden dataset testing; comparison against manual calculations; multiple report engines |
| **Scale issues with large ledgers** | Medium | Medium | Materialized views; cached balances; pagination; archival for old periods |

---

## 9. Timeline Summary

```
Week  1-2   ████ Schema & Migrations
Week  2-3   ██ Chart of Accounts
Week  3-5   ████ Journal Entry Engine
Week  5-6   ██ Fiscal Period Management
Week  6-8   ████ Trial Balance & Balances
            ────── Phase 1 Gate Review ──────
Week  9-12  ████████ Billing & Invoicing
Week 12-14  ████ Expense Management
Week 14-16  ████ Budget Planning
Week 16-18  ████ Basic Financial Reporting
            ────── Phase 2 Gate Review ──────
Week 19-21  ██████ QuickBooks Integration
Week 21-22  ██ Xero Integration
Week 22-24  ████ Plaid Bank Reconciliation
Week 24-25  ██ AI Expense Categorization
Week 25-26  ██ Multi-Venture Consolidation
            ────── Phase 3 Gate Review ──────
Week 27-28  ████ Performance & Observability
Week 28-29  ████ Documentation & DX
Week 29-30  ██ Security & Compliance
            ────── Phase 4 Final Review ──────
```

**Total Duration:** 30 weeks (7.5 months)

### Phase Gate Reviews

| Gate | Week | Go/No-Go Criteria |
|------|------|-------------------|
| Phase 1 → 2 | Week 8 | Chart of accounts provisioned, journal entries posting, trial balance balancing |
| Phase 2 → 3 | Week 18 | Invoices generating, expenses approving, budgets tracking, reports rendering |
| Phase 3 → 4 | Week 26 | QBO/Xero connected, bank reconciliation working, consolidation computing |
| Production Release | Week 30 | All acceptance criteria met, security audit passed, docs complete |

### Dependencies & Critical Path

```
Schema (P1) → Chart of Accounts (P1) → Journal Entries (P1) → Trial Balance (P1)
Journal Entries (P1) → Invoicing (P2) → QBO Sync (P3)
Journal Entries (P1) → Expenses (P2) → AI Categorization (P3)
Journal Entries (P1) → Budgeting (P2)
Trial Balance (P1) → Financial Reporting (P2) → Consolidation (P3)
Invoicing (P2) → Plaid Reconciliation (P3)
```

The critical path runs: **Schema → Chart of Accounts → Journal Entries → Trial Balance → Financial Reporting → Consolidation → Polish**.

---

*@mcv/finance — Financial Management Domain*
