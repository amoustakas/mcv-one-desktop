# @mcv/finance — Package Specification
## Tier 5: PUBLISHABLE Domains

**Package:** `@mcv/finance`  
**Classification:** PUBLISHABLE  
**Version:** 1.0.0  
**Last Updated:** February 9, 2026

---

## Executive Summary

`@mcv/finance` provides a comprehensive financial management system for ventures. It encompasses general ledger accounting, expense tracking, budget management, financial reporting, billing/invoicing, and integrations with external accounting platforms. Built for multi-tenant SaaS with full audit trails and compliance support.

**Key Capabilities:**
- Double-entry accounting with full chart of accounts
- Expense management with approval workflows
- Budget planning, tracking, and forecasting
- Financial statements and custom reports
- Billing, invoicing, and recurring charges
- Integrations with QuickBooks, Xero, and more

---

## Strategic Position

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           VENTURE APPLICATIONS                               │
│                                                                              │
│  @mcv/commerce  @mcv/people  @mcv/projects  @mcv/operations  ...            │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      │ financial data
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                              @mcv/finance                                    │
│                                                                              │
│  ┌───────────┐ ┌──────────┐ ┌───────────┐ ┌───────────┐ ┌──────────────┐   │
│  │accounting │ │ expenses │ │ budgeting │ │ reporting │ │   billing    │   │
│  └───────────┘ └──────────┘ └───────────┘ └───────────┘ └──────────────┘   │
│                                                                              │
│                          ┌──────────────┐                                    │
│                          │ integrations │                                    │
│                          └──────────────┘                                    │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      │ depends on
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│            @mcv/kernel  |  @mcv/payments  |  @mcv/documents                 │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Sub-Modules Overview

| Module | Purpose | Key Exports |
|--------|---------|-------------|
| **accounting** | Double-entry ledger, chart of accounts, journal entries | `GeneralLedger`, `ChartOfAccounts`, `JournalEntry` |
| **expenses** | Expense tracking, receipts, approval workflows | `Expense`, `ExpensePolicy`, `ApprovalWorkflow` |
| **budgeting** | Budget planning, allocation, forecasting | `Budget`, `BudgetLine`, `Forecast` |
| **reporting** | Financial statements, custom reports | `IncomeStatement`, `BalanceSheet`, `ReportBuilder` |
| **billing** | Invoicing, subscriptions, recurring charges | `Invoice`, `Subscription`, `PaymentSchedule` |
| **integrations** | External accounting software sync | `QuickBooksSync`, `XeroSync`, `BankFeed` |

---

## Module: accounting

### Purpose

Implements double-entry bookkeeping with a flexible chart of accounts, automated journal entries, multi-currency support, and period management.

### Core Concepts

**Chart of Accounts Structure:**
```
1xxx - Assets
  1000 - Current Assets
    1010 - Cash and Cash Equivalents
    1020 - Accounts Receivable
    1030 - Inventory
  1100 - Fixed Assets
    1110 - Equipment
    1120 - Accumulated Depreciation

2xxx - Liabilities
  2000 - Current Liabilities
    2010 - Accounts Payable
    2020 - Accrued Expenses
    2030 - Unearned Revenue
  2100 - Long-term Liabilities
    2110 - Loans Payable

3xxx - Equity
  3000 - Owner's Equity
    3010 - Retained Earnings
    3020 - Common Stock

4xxx - Revenue
  4000 - Operating Revenue
    4010 - Product Sales
    4020 - Service Revenue
  4100 - Other Revenue
    4110 - Interest Income

5xxx - Expenses
  5000 - Cost of Goods Sold
    5010 - Direct Materials
    5020 - Direct Labor
  5100 - Operating Expenses
    5110 - Salaries & Wages
    5120 - Rent Expense
    5130 - Utilities
```

### Database Schema

```typescript
// @mcv/finance/accounting/schema.ts
import { pgTable, uuid, text, numeric, timestamp, pgEnum, boolean, integer, jsonb } from 'drizzle-orm/pg-core';
import { baseColumns } from '@mcv/kernel/db';

export const accountTypeEnum = pgEnum('account_type', [
  'asset', 'liability', 'equity', 'revenue', 'expense'
]);

export const accountSubtypeEnum = pgEnum('account_subtype', [
  // Assets
  'cash', 'accounts_receivable', 'inventory', 'prepaid', 'fixed_asset', 'intangible',
  // Liabilities
  'accounts_payable', 'accrued', 'deferred_revenue', 'loans', 'notes_payable',
  // Equity
  'owners_equity', 'retained_earnings', 'common_stock', 'additional_paid_in',
  // Revenue
  'operating_revenue', 'other_income', 'interest_income',
  // Expenses
  'cogs', 'operating_expense', 'payroll', 'depreciation', 'interest_expense', 'tax'
]);

export const accounts = pgTable('finance_accounts', {
  ...baseColumns,
  code: text('code').notNull(),                    // e.g., "1010"
  name: text('name').notNull(),                    // e.g., "Cash and Cash Equivalents"
  description: text('description'),
  type: accountTypeEnum('type').notNull(),
  subtype: accountSubtypeEnum('subtype').notNull(),
  parentId: uuid('parent_id').references(() => accounts.id),
  currency: text('currency').default('USD'),
  isActive: boolean('is_active').default(true),
  isSystemAccount: boolean('is_system_account').default(false),
  normalBalance: text('normal_balance').notNull(), // 'debit' | 'credit'
  openingBalance: numeric('opening_balance', { precision: 19, scale: 4 }).default('0'),
  currentBalance: numeric('current_balance', { precision: 19, scale: 4 }).default('0'),
  taxCode: text('tax_code'),
  bankAccountId: uuid('bank_account_id'),
  metadata: jsonb('metadata'),
});

export const fiscalPeriods = pgTable('finance_fiscal_periods', {
  ...baseColumns,
  fiscalYearId: uuid('fiscal_year_id').notNull(),
  periodNumber: integer('period_number').notNull(),   // 1-12 for monthly
  periodName: text('period_name').notNull(),          // "January 2026"
  startDate: timestamp('start_date').notNull(),
  endDate: timestamp('end_date').notNull(),
  status: text('status').default('open'),             // open, closed, locked
  closedAt: timestamp('closed_at'),
  closedBy: uuid('closed_by'),
});

export const fiscalYears = pgTable('finance_fiscal_years', {
  ...baseColumns,
  name: text('name').notNull(),                       // "FY 2026"
  startDate: timestamp('start_date').notNull(),
  endDate: timestamp('end_date').notNull(),
  status: text('status').default('open'),
  isCurrent: boolean('is_current').default(false),
});

export const journalEntries = pgTable('finance_journal_entries', {
  ...baseColumns,
  entryNumber: text('entry_number').notNull(),
  entryDate: timestamp('entry_date').notNull(),
  fiscalPeriodId: uuid('fiscal_period_id').references(() => fiscalPeriods.id),
  description: text('description').notNull(),
  reference: text('reference'),                       // External reference
  sourceType: text('source_type'),                    // 'manual', 'invoice', 'expense', 'payroll'
  sourceId: uuid('source_id'),
  status: text('status').default('draft'),            // draft, posted, reversed
  postedAt: timestamp('posted_at'),
  postedBy: uuid('posted_by'),
  reversalOf: uuid('reversal_of'),
  isAdjusting: boolean('is_adjusting').default(false),
  totalDebit: numeric('total_debit', { precision: 19, scale: 4 }).default('0'),
  totalCredit: numeric('total_credit', { precision: 19, scale: 4 }).default('0'),
  attachments: jsonb('attachments'),
});

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
  dimensions: jsonb('dimensions'),                    // Custom tracking dimensions
});

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

export const recurringJournals = pgTable('finance_recurring_journals', {
  ...baseColumns,
  name: text('name').notNull(),
  description: text('description'),
  templateEntry: jsonb('template_entry').notNull(),   // Journal entry template
  frequency: text('frequency').notNull(),             // daily, weekly, monthly, yearly
  startDate: timestamp('start_date').notNull(),
  endDate: timestamp('end_date'),
  nextRunDate: timestamp('next_run_date'),
  lastRunDate: timestamp('last_run_date'),
  isActive: boolean('is_active').default(true),
  autoPost: boolean('auto_post').default(false),
  totalGenerated: integer('total_generated').default(0),
});
```

### Service Implementation

```typescript
// @mcv/finance/accounting/service.ts
import { db } from '@mcv/kernel';
import { eq, and, sql, between, desc } from 'drizzle-orm';
import { 
  accounts, journalEntries, journalEntryLines, 
  accountBalances, fiscalPeriods 
} from './schema';
import { MCVError, ErrorCode } from '@mcv/kernel/errors';
import { getContext } from '@mcv/kernel/context';
import Decimal from 'decimal.js';

export interface CreateAccountInput {
  code: string;
  name: string;
  description?: string;
  type: 'asset' | 'liability' | 'equity' | 'revenue' | 'expense';
  subtype: string;
  parentId?: string;
  currency?: string;
  openingBalance?: string;
  taxCode?: string;
}

export interface CreateJournalEntryInput {
  entryDate: Date;
  description: string;
  reference?: string;
  sourceType?: string;
  sourceId?: string;
  isAdjusting?: boolean;
  lines: JournalEntryLineInput[];
}

export interface JournalEntryLineInput {
  accountId: string;
  description?: string;
  debitAmount?: string;
  creditAmount?: string;
  currency?: string;
  exchangeRate?: number;
  departmentId?: string;
  projectId?: string;
}

export class AccountingService {
  /**
   * Create a new account in the chart of accounts
   */
  async createAccount(input: CreateAccountInput) {
    const ctx = getContext();
    
    // Validate account code uniqueness
    const existing = await db.query.accounts.findFirst({
      where: and(
        eq(accounts.ventureId, ctx.venture.id),
        eq(accounts.code, input.code)
      ),
    });
    
    if (existing) {
      throw new MCVError('Account code already exists', ErrorCode.ALREADY_EXISTS);
    }
    
    // Determine normal balance based on type
    const normalBalance = ['asset', 'expense'].includes(input.type) ? 'debit' : 'credit';
    
    const [account] = await db.insert(accounts).values({
      ventureId: ctx.venture.id,
      code: input.code,
      name: input.name,
      description: input.description,
      type: input.type,
      subtype: input.subtype,
      parentId: input.parentId,
      currency: input.currency ?? 'USD',
      normalBalance,
      openingBalance: input.openingBalance ?? '0',
      currentBalance: input.openingBalance ?? '0',
      taxCode: input.taxCode,
      createdBy: ctx.user?.id,
    }).returning();
    
    return account;
  }

  /**
   * Get full chart of accounts with hierarchy
   */
  async getChartOfAccounts(options?: { 
    type?: string; 
    includeInactive?: boolean;
  }) {
    const ctx = getContext();
    
    const conditions = [eq(accounts.ventureId, ctx.venture.id)];
    
    if (options?.type) {
      conditions.push(eq(accounts.type, options.type as any));
    }
    
    if (!options?.includeInactive) {
      conditions.push(eq(accounts.isActive, true));
    }
    
    const allAccounts = await db.query.accounts.findMany({
      where: and(...conditions),
      orderBy: accounts.code,
    });
    
    // Build tree structure
    return this.buildAccountTree(allAccounts);
  }

  private buildAccountTree(flatAccounts: typeof accounts.$inferSelect[]) {
    const map = new Map<string, any>();
    const roots: any[] = [];
    
    // First pass: create nodes
    flatAccounts.forEach(acc => {
      map.set(acc.id, { ...acc, children: [] });
    });
    
    // Second pass: build tree
    flatAccounts.forEach(acc => {
      const node = map.get(acc.id);
      if (acc.parentId && map.has(acc.parentId)) {
        map.get(acc.parentId).children.push(node);
      } else {
        roots.push(node);
      }
    });
    
    return roots;
  }

  /**
   * Create a journal entry (double-entry)
   */
  async createJournalEntry(input: CreateJournalEntryInput) {
    const ctx = getContext();
    
    // Validate debits = credits
    let totalDebit = new Decimal(0);
    let totalCredit = new Decimal(0);
    
    input.lines.forEach(line => {
      if (line.debitAmount) totalDebit = totalDebit.plus(line.debitAmount);
      if (line.creditAmount) totalCredit = totalCredit.plus(line.creditAmount);
    });
    
    if (!totalDebit.equals(totalCredit)) {
      throw new MCVError(
        `Journal entry must balance. Debits: ${totalDebit}, Credits: ${totalCredit}`,
        ErrorCode.VALIDATION_ERROR
      );
    }
    
    // Get fiscal period
    const period = await this.getFiscalPeriodForDate(input.entryDate);
    if (period.status === 'closed' || period.status === 'locked') {
      throw new MCVError('Cannot post to closed fiscal period', ErrorCode.BUSINESS_RULE_VIOLATION);
    }
    
    // Generate entry number
    const entryNumber = await this.generateEntryNumber();
    
    return db.transaction(async (tx) => {
      // Create journal entry
      const [entry] = await tx.insert(journalEntries).values({
        ventureId: ctx.venture.id,
        entryNumber,
        entryDate: input.entryDate,
        fiscalPeriodId: period.id,
        description: input.description,
        reference: input.reference,
        sourceType: input.sourceType,
        sourceId: input.sourceId,
        isAdjusting: input.isAdjusting ?? false,
        totalDebit: totalDebit.toString(),
        totalCredit: totalCredit.toString(),
        status: 'draft',
        createdBy: ctx.user?.id,
      }).returning();
      
      // Create lines
      const lines = await Promise.all(
        input.lines.map((line, index) => 
          tx.insert(journalEntryLines).values({
            ventureId: ctx.venture.id,
            journalEntryId: entry.id,
            accountId: line.accountId,
            lineNumber: index + 1,
            description: line.description,
            debitAmount: line.debitAmount,
            creditAmount: line.creditAmount,
            currency: line.currency ?? 'USD',
            exchangeRate: line.exchangeRate?.toString() ?? '1',
            baseCurrencyAmount: line.debitAmount || line.creditAmount,
            departmentId: line.departmentId,
            projectId: line.projectId,
            createdBy: ctx.user?.id,
          }).returning()
        )
      );
      
      return { entry, lines: lines.map(l => l[0]) };
    });
  }

  /**
   * Post a journal entry (make it final and update balances)
   */
  async postJournalEntry(entryId: string) {
    const ctx = getContext();
    
    const entry = await db.query.journalEntries.findFirst({
      where: and(
        eq(journalEntries.id, entryId),
        eq(journalEntries.ventureId, ctx.venture.id)
      ),
      with: { lines: true },
    });
    
    if (!entry) {
      throw new MCVError('Journal entry not found', ErrorCode.NOT_FOUND);
    }
    
    if (entry.status !== 'draft') {
      throw new MCVError('Only draft entries can be posted', ErrorCode.BUSINESS_RULE_VIOLATION);
    }
    
    return db.transaction(async (tx) => {
      // Update account balances
      for (const line of entry.lines) {
        const debitAmount = new Decimal(line.debitAmount ?? 0);
        const creditAmount = new Decimal(line.creditAmount ?? 0);
        
        // Update current balance on account
        const account = await tx.query.accounts.findFirst({
          where: eq(accounts.id, line.accountId),
        });
        
        if (!account) continue;
        
        // Calculate balance change based on normal balance
        let balanceChange: Decimal;
        if (account.normalBalance === 'debit') {
          balanceChange = debitAmount.minus(creditAmount);
        } else {
          balanceChange = creditAmount.minus(debitAmount);
        }
        
        await tx.update(accounts)
          .set({
            currentBalance: sql`${accounts.currentBalance} + ${balanceChange.toString()}`,
            updatedAt: new Date(),
            updatedBy: ctx.user?.id,
          })
          .where(eq(accounts.id, line.accountId));
        
        // Update period balances
        await tx.update(accountBalances)
          .set({
            periodDebit: sql`${accountBalances.periodDebit} + ${debitAmount.toString()}`,
            periodCredit: sql`${accountBalances.periodCredit} + ${creditAmount.toString()}`,
            netChange: sql`${accountBalances.netChange} + ${balanceChange.toString()}`,
            updatedAt: new Date(),
          })
          .where(and(
            eq(accountBalances.accountId, line.accountId),
            eq(accountBalances.fiscalPeriodId, entry.fiscalPeriodId!)
          ));
      }
      
      // Update entry status
      const [updated] = await tx.update(journalEntries)
        .set({
          status: 'posted',
          postedAt: new Date(),
          postedBy: ctx.user?.id,
          updatedAt: new Date(),
          updatedBy: ctx.user?.id,
        })
        .where(eq(journalEntries.id, entryId))
        .returning();
      
      return updated;
    });
  }

  /**
   * Reverse a posted journal entry
   */
  async reverseJournalEntry(entryId: string, reversalDate: Date, reason: string) {
    const ctx = getContext();
    
    const original = await db.query.journalEntries.findFirst({
      where: and(
        eq(journalEntries.id, entryId),
        eq(journalEntries.ventureId, ctx.venture.id)
      ),
      with: { lines: true },
    });
    
    if (!original) {
      throw new MCVError('Journal entry not found', ErrorCode.NOT_FOUND);
    }
    
    if (original.status !== 'posted') {
      throw new MCVError('Only posted entries can be reversed', ErrorCode.BUSINESS_RULE_VIOLATION);
    }
    
    // Create reversal entry with debits and credits swapped
    const reversalLines = original.lines.map(line => ({
      accountId: line.accountId,
      description: `Reversal: ${line.description ?? ''}`,
      debitAmount: line.creditAmount,  // Swap
      creditAmount: line.debitAmount,  // Swap
      currency: line.currency,
      departmentId: line.departmentId,
      projectId: line.projectId,
    }));
    
    const reversal = await this.createJournalEntry({
      entryDate: reversalDate,
      description: `Reversal of ${original.entryNumber}: ${reason}`,
      reference: original.entryNumber,
      sourceType: 'reversal',
      sourceId: original.id,
      lines: reversalLines,
    });
    
    // Mark original as reversed
    await db.update(journalEntries)
      .set({ 
        status: 'reversed',
        updatedAt: new Date(),
        updatedBy: ctx.user?.id,
      })
      .where(eq(journalEntries.id, entryId));
    
    // Post the reversal
    await this.postJournalEntry(reversal.entry.id);
    
    return reversal;
  }

  /**
   * Get trial balance for a period
   */
  async getTrialBalance(fiscalPeriodId: string) {
    const ctx = getContext();
    
    const balances = await db.query.accountBalances.findMany({
      where: and(
        eq(accountBalances.ventureId, ctx.venture.id),
        eq(accountBalances.fiscalPeriodId, fiscalPeriodId)
      ),
      with: { account: true },
      orderBy: (ab, { asc }) => asc(ab.account.code),
    });
    
    let totalDebit = new Decimal(0);
    let totalCredit = new Decimal(0);
    
    const rows = balances.map(b => {
      const debit = new Decimal(b.closingDebit ?? 0);
      const credit = new Decimal(b.closingCredit ?? 0);
      
      totalDebit = totalDebit.plus(debit);
      totalCredit = totalCredit.plus(credit);
      
      return {
        accountCode: b.account.code,
        accountName: b.account.name,
        accountType: b.account.type,
        debit: debit.toString(),
        credit: credit.toString(),
      };
    });
    
    return {
      rows,
      totals: {
        debit: totalDebit.toString(),
        credit: totalCredit.toString(),
        balanced: totalDebit.equals(totalCredit),
      },
    };
  }

  /**
   * Close a fiscal period
   */
  async closeFiscalPeriod(periodId: string) {
    const ctx = getContext();
    
    const period = await db.query.fiscalPeriods.findFirst({
      where: and(
        eq(fiscalPeriods.id, periodId),
        eq(fiscalPeriods.ventureId, ctx.venture.id)
      ),
    });
    
    if (!period) {
      throw new MCVError('Fiscal period not found', ErrorCode.NOT_FOUND);
    }
    
    if (period.status !== 'open') {
      throw new MCVError('Period is already closed', ErrorCode.BUSINESS_RULE_VIOLATION);
    }
    
    // Check for unposted entries
    const unposted = await db.query.journalEntries.findFirst({
      where: and(
        eq(journalEntries.ventureId, ctx.venture.id),
        eq(journalEntries.fiscalPeriodId, periodId),
        eq(journalEntries.status, 'draft')
      ),
    });
    
    if (unposted) {
      throw new MCVError(
        'Cannot close period with unposted journal entries',
        ErrorCode.BUSINESS_RULE_VIOLATION
      );
    }
    
    // Calculate closing balances and carry forward
    await this.calculateClosingBalances(periodId);
    
    // Update period status
    const [closed] = await db.update(fiscalPeriods)
      .set({
        status: 'closed',
        closedAt: new Date(),
        closedBy: ctx.user?.id,
        updatedAt: new Date(),
      })
      .where(eq(fiscalPeriods.id, periodId))
      .returning();
    
    return closed;
  }

  private async getFiscalPeriodForDate(date: Date) {
    const ctx = getContext();
    
    const period = await db.query.fiscalPeriods.findFirst({
      where: and(
        eq(fiscalPeriods.ventureId, ctx.venture.id),
        sql`${fiscalPeriods.startDate} <= ${date}`,
        sql`${fiscalPeriods.endDate} >= ${date}`
      ),
    });
    
    if (!period) {
      throw new MCVError('No fiscal period found for date', ErrorCode.NOT_FOUND);
    }
    
    return period;
  }

  private async generateEntryNumber() {
    const ctx = getContext();
    const year = new Date().getFullYear();
    
    const latest = await db.query.journalEntries.findFirst({
      where: and(
        eq(journalEntries.ventureId, ctx.venture.id),
        sql`${journalEntries.entryNumber} LIKE ${`JE-${year}-%`}`
      ),
      orderBy: desc(journalEntries.entryNumber),
    });
    
    let sequence = 1;
    if (latest) {
      const parts = latest.entryNumber.split('-');
      sequence = parseInt(parts[2]) + 1;
    }
    
    return `JE-${year}-${sequence.toString().padStart(6, '0')}`;
  }

  private async calculateClosingBalances(periodId: string) {
    // Implementation for calculating period-end balances
    // and carrying forward to next period
  }
}

export const accountingService = new AccountingService();
```

---

## Module: expenses

### Purpose

Manages expense tracking, receipt capture, policy enforcement, and multi-level approval workflows.

### Database Schema

```typescript
// @mcv/finance/expenses/schema.ts
import { pgTable, uuid, text, numeric, timestamp, pgEnum, boolean, jsonb, integer } from 'drizzle-orm/pg-core';
import { baseColumns } from '@mcv/kernel/db';

export const expenseStatusEnum = pgEnum('expense_status', [
  'draft', 'submitted', 'pending_approval', 'approved', 'rejected', 
  'reimbursed', 'cancelled'
]);

export const expenseCategoryEnum = pgEnum('expense_category', [
  'travel', 'meals', 'lodging', 'transportation', 'office_supplies',
  'software', 'equipment', 'professional_services', 'marketing',
  'entertainment', 'utilities', 'other'
]);

export const expenseReports = pgTable('finance_expense_reports', {
  ...baseColumns,
  reportNumber: text('report_number').notNull(),
  title: text('title').notNull(),
  description: text('description'),
  employeeId: uuid('employee_id').notNull(),
  departmentId: uuid('department_id'),
  projectId: uuid('project_id'),
  status: expenseStatusEnum('status').default('draft'),
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

export const expenses = pgTable('finance_expenses', {
  ...baseColumns,
  expenseReportId: uuid('expense_report_id').references(() => expenseReports.id),
  employeeId: uuid('employee_id').notNull(),
  merchantName: text('merchant_name').notNull(),
  merchantLocation: text('merchant_location'),
  expenseDate: timestamp('expense_date').notNull(),
  category: expenseCategoryEnum('category').notNull(),
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
  accountId: uuid('account_id'),
  paymentMethod: text('payment_method'),
  cardLastFour: text('card_last_four'),
  receiptStatus: text('receipt_status').default('pending'), // pending, uploaded, missing, exempt
  receiptUrl: text('receipt_url'),
  receiptOcrData: jsonb('receipt_ocr_data'),
  mileage: numeric('mileage', { precision: 10, scale: 2 }),
  mileageRate: numeric('mileage_rate', { precision: 10, scale: 4 }),
  attendees: jsonb('attendees'),
  policyViolations: jsonb('policy_violations'),
  tags: text('tags').array(),
});

export const expensePolicies = pgTable('finance_expense_policies', {
  ...baseColumns,
  name: text('name').notNull(),
  description: text('description'),
  isDefault: boolean('is_default').default(false),
  isActive: boolean('is_active').default(true),
  rules: jsonb('rules').notNull(),
  /*
    rules: {
      maxPerDiem: { meals: 75, lodging: 200, total: 350 },
      requireReceipt: { above: 25, always: ['lodging', 'equipment'] },
      requireApproval: { above: 100 },
      allowedCategories: ['travel', 'meals', 'lodging'],
      blockedMerchants: ['Casino XYZ'],
      mileageRate: 0.67,
      advanceNotice: { international: 14, domestic: 3 },
      maxAdvance: 5000,
    }
  */
  appliesToRoles: text('applies_to_roles').array(),
  appliesToDepartments: uuid('applies_to_departments').array(),
  effectiveFrom: timestamp('effective_from'),
  effectiveTo: timestamp('effective_to'),
});

export const expenseApprovals = pgTable('finance_expense_approvals', {
  ...baseColumns,
  expenseReportId: uuid('expense_report_id').references(() => expenseReports.id).notNull(),
  approverId: uuid('approver_id').notNull(),
  approvalLevel: integer('approval_level').notNull(),
  status: text('status').default('pending'), // pending, approved, rejected, delegated
  decision: text('decision'),
  comments: text('comments'),
  decidedAt: timestamp('decided_at'),
  delegatedTo: uuid('delegated_to'),
  delegatedAt: timestamp('delegated_at'),
  delegationReason: text('delegation_reason'),
  dueDate: timestamp('due_date'),
  reminderSentAt: timestamp('reminder_sent_at'),
});

export const expenseApprovalWorkflows = pgTable('finance_expense_approval_workflows', {
  ...baseColumns,
  name: text('name').notNull(),
  description: text('description'),
  isDefault: boolean('is_default').default(false),
  isActive: boolean('is_active').default(true),
  levels: jsonb('levels').notNull(),
  /*
    levels: [
      { level: 1, type: 'manager', threshold: 0 },
      { level: 2, type: 'department_head', threshold: 1000 },
      { level: 3, type: 'finance', threshold: 5000 },
      { level: 4, type: 'cfo', threshold: 10000 },
    ]
  */
  conditions: jsonb('conditions'),
  /*
    conditions: {
      categories: ['equipment', 'professional_services'],
      departments: ['uuid-1', 'uuid-2'],
      minAmount: 500,
    }
  */
  escalationRules: jsonb('escalation_rules'),
});

export const corporateCards = pgTable('finance_corporate_cards', {
  ...baseColumns,
  employeeId: uuid('employee_id').notNull(),
  cardName: text('card_name').notNull(),
  lastFour: text('last_four').notNull(),
  cardProvider: text('card_provider').notNull(), // visa, mastercard, amex
  cardType: text('card_type').notNull(), // physical, virtual
  status: text('status').default('active'),
  spendLimit: numeric('spend_limit', { precision: 19, scale: 4 }),
  spendLimitPeriod: text('spend_limit_period'), // daily, weekly, monthly
  currentSpend: numeric('current_spend', { precision: 19, scale: 4 }).default('0'),
  allowedCategories: text('allowed_categories').array(),
  blockedMccCodes: text('blocked_mcc_codes').array(),
  expiresAt: timestamp('expires_at'),
  externalCardId: text('external_card_id'),
  metadata: jsonb('metadata'),
});

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
  status: text('status').default('pending'), // pending, posted, declined, reversed
  declineReason: text('decline_reason'),
  isMatched: boolean('is_matched').default(false),
  matchedAt: timestamp('matched_at'),
});
```

### Service Implementation

```typescript
// @mcv/finance/expenses/service.ts
import { db } from '@mcv/kernel';
import { eq, and, sql, desc, inArray, or, gte, lte } from 'drizzle-orm';
import { 
  expenses, expenseReports, expenseApprovals, 
  expensePolicies, expenseApprovalWorkflows 
} from './schema';
import { MCVError, ErrorCode } from '@mcv/kernel/errors';
import { getContext } from '@mcv/kernel/context';
import { accountingService } from '../accounting/service';
import Decimal from 'decimal.js';

export interface CreateExpenseInput {
  merchantName: string;
  merchantLocation?: string;
  expenseDate: Date;
  category: string;
  subcategory?: string;
  description: string;
  amount: string;
  currency?: string;
  isReimbursable?: boolean;
  isBillable?: boolean;
  customerId?: string;
  projectId?: string;
  departmentId?: string;
  paymentMethod?: string;
  mileage?: number;
  attendees?: Array<{ name: string; company?: string }>;
  tags?: string[];
}

export interface CreateExpenseReportInput {
  title: string;
  description?: string;
  expenseIds: string[];
  projectId?: string;
  startDate?: Date;
  endDate?: Date;
  purpose?: string;
}

export class ExpenseService {
  /**
   * Create a single expense
   */
  async createExpense(input: CreateExpenseInput) {
    const ctx = getContext();
    
    // Get employee's expense policy
    const policy = await this.getApplicablePolicy(ctx.user!.id);
    
    // Validate against policy
    const violations = await this.validateAgainstPolicy(input, policy);
    
    // Calculate mileage reimbursement if applicable
    let calculatedAmount = input.amount;
    if (input.mileage && input.category === 'transportation') {
      const mileageRate = policy?.rules?.mileageRate ?? 0.67;
      calculatedAmount = new Decimal(input.mileage).times(mileageRate).toString();
    }
    
    const [expense] = await db.insert(expenses).values({
      ventureId: ctx.venture.id,
      employeeId: ctx.user!.id,
      merchantName: input.merchantName,
      merchantLocation: input.merchantLocation,
      expenseDate: input.expenseDate,
      category: input.category as any,
      subcategory: input.subcategory,
      description: input.description,
      amount: calculatedAmount,
      currency: input.currency ?? 'USD',
      baseCurrencyAmount: calculatedAmount, // TODO: Apply exchange rate
      isReimbursable: input.isReimbursable ?? true,
      isBillable: input.isBillable ?? false,
      customerId: input.customerId,
      projectId: input.projectId,
      departmentId: input.departmentId,
      paymentMethod: input.paymentMethod,
      mileage: input.mileage?.toString(),
      mileageRate: policy?.rules?.mileageRate?.toString(),
      attendees: input.attendees,
      policyViolations: violations.length > 0 ? violations : null,
      tags: input.tags,
      receiptStatus: this.getReceiptRequirement(input, policy),
      createdBy: ctx.user?.id,
    }).returning();
    
    return expense;
  }

  /**
   * Upload and process receipt with OCR
   */
  async uploadReceipt(expenseId: string, receiptUrl: string) {
    const ctx = getContext();
    
    // Process receipt with OCR (integration with document processing)
    const ocrResult = await this.processReceiptOCR(receiptUrl);
    
    const [updated] = await db.update(expenses)
      .set({
        receiptUrl,
        receiptOcrData: ocrResult,
        receiptStatus: 'uploaded',
        updatedAt: new Date(),
        updatedBy: ctx.user?.id,
      })
      .where(and(
        eq(expenses.id, expenseId),
        eq(expenses.ventureId, ctx.venture.id)
      ))
      .returning();
    
    // Auto-fill expense details from OCR if empty
    if (ocrResult?.merchantName && !updated.merchantName) {
      await db.update(expenses)
        .set({
          merchantName: ocrResult.merchantName,
          amount: ocrResult.total?.toString(),
          expenseDate: ocrResult.date,
        })
        .where(eq(expenses.id, expenseId));
    }
    
    return updated;
  }

  /**
   * Create an expense report from multiple expenses
   */
  async createExpenseReport(input: CreateExpenseReportInput) {
    const ctx = getContext();
    
    // Validate expenses belong to user and are not already in a report
    const expenseList = await db.query.expenses.findMany({
      where: and(
        eq(expenses.ventureId, ctx.venture.id),
        eq(expenses.employeeId, ctx.user!.id),
        inArray(expenses.id, input.expenseIds),
        sql`${expenses.expenseReportId} IS NULL`
      ),
    });
    
    if (expenseList.length !== input.expenseIds.length) {
      throw new MCVError(
        'Some expenses are invalid or already in a report',
        ErrorCode.VALIDATION_ERROR
      );
    }
    
    // Calculate totals
    let totalAmount = new Decimal(0);
    let reimbursableAmount = new Decimal(0);
    let nonReimbursableAmount = new Decimal(0);
    const allViolations: any[] = [];
    
    expenseList.forEach(e => {
      totalAmount = totalAmount.plus(e.amount);
      if (e.isReimbursable) {
        reimbursableAmount = reimbursableAmount.plus(e.amount);
      } else {
        nonReimbursableAmount = nonReimbursableAmount.plus(e.amount);
      }
      if (e.policyViolations) {
        allViolations.push(...(e.policyViolations as any[]));
      }
    });
    
    // Generate report number
    const reportNumber = await this.generateReportNumber();
    
    return db.transaction(async (tx) => {
      // Create report
      const [report] = await tx.insert(expenseReports).values({
        ventureId: ctx.venture.id,
        reportNumber,
        title: input.title,
        description: input.description,
        employeeId: ctx.user!.id,
        projectId: input.projectId,
        status: 'draft',
        totalAmount: totalAmount.toString(),
        reimbursableAmount: reimbursableAmount.toString(),
        nonReimbursableAmount: nonReimbursableAmount.toString(),
        startDate: input.startDate,
        endDate: input.endDate,
        purpose: input.purpose,
        policyViolations: allViolations.length > 0 ? allViolations : null,
        createdBy: ctx.user?.id,
      }).returning();
      
      // Link expenses to report
      await tx.update(expenses)
        .set({
          expenseReportId: report.id,
          updatedAt: new Date(),
        })
        .where(inArray(expenses.id, input.expenseIds));
      
      return report;
    });
  }

  /**
   * Submit an expense report for approval
   */
  async submitExpenseReport(reportId: string) {
    const ctx = getContext();
    
    const report = await db.query.expenseReports.findFirst({
      where: and(
        eq(expenseReports.id, reportId),
        eq(expenseReports.ventureId, ctx.venture.id),
        eq(expenseReports.employeeId, ctx.user!.id)
      ),
      with: { expenses: true },
    });
    
    if (!report) {
      throw new MCVError('Expense report not found', ErrorCode.NOT_FOUND);
    }
    
    if (report.status !== 'draft') {
      throw new MCVError('Report has already been submitted', ErrorCode.BUSINESS_RULE_VIOLATION);
    }
    
    // Check all expenses have receipts where required
    const missingReceipts = report.expenses.filter(e => 
      e.receiptStatus === 'pending'
    );
    
    if (missingReceipts.length > 0) {
      throw new MCVError(
        `${missingReceipts.length} expense(s) are missing required receipts`,
        ErrorCode.VALIDATION_ERROR,
        { details: { expenseIds: missingReceipts.map(e => e.id) } }
      );
    }
    
    // Get approval workflow
    const workflow = await this.getApprovalWorkflow(report);
    
    return db.transaction(async (tx) => {
      // Update report status
      await tx.update(expenseReports)
        .set({
          status: 'submitted',
          submittedAt: new Date(),
          updatedAt: new Date(),
          updatedBy: ctx.user?.id,
        })
        .where(eq(expenseReports.id, reportId));
      
      // Create approval chain
      const approvers = await this.determineApprovers(report, workflow);
      
      for (const approver of approvers) {
        await tx.insert(expenseApprovals).values({
          ventureId: ctx.venture.id,
          expenseReportId: reportId,
          approverId: approver.userId,
          approvalLevel: approver.level,
          status: approver.level === 1 ? 'pending' : 'waiting',
          dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
          createdBy: ctx.user?.id,
        });
      }
      
      // Update status to pending approval
      const [updated] = await tx.update(expenseReports)
        .set({ status: 'pending_approval' })
        .where(eq(expenseReports.id, reportId))
        .returning();
      
      // TODO: Send notification to first approver
      
      return updated;
    });
  }

  /**
   * Approve or reject an expense report
   */
  async processApproval(
    reportId: string, 
    decision: 'approved' | 'rejected', 
    comments?: string
  ) {
    const ctx = getContext();
    
    // Find pending approval for this user
    const approval = await db.query.expenseApprovals.findFirst({
      where: and(
        eq(expenseApprovals.expenseReportId, reportId),
        eq(expenseApprovals.approverId, ctx.user!.id),
        eq(expenseApprovals.status, 'pending')
      ),
    });
    
    if (!approval) {
      throw new MCVError(
        'No pending approval found for this user',
        ErrorCode.NOT_FOUND
      );
    }
    
    return db.transaction(async (tx) => {
      // Update approval
      await tx.update(expenseApprovals)
        .set({
          status: decision,
          decision,
          comments,
          decidedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(expenseApprovals.id, approval.id));
      
      if (decision === 'rejected') {
        // Reject the entire report
        const [rejected] = await tx.update(expenseReports)
          .set({
            status: 'rejected',
            rejectedAt: new Date(),
            rejectedBy: ctx.user?.id,
            rejectionReason: comments,
            updatedAt: new Date(),
            updatedBy: ctx.user?.id,
          })
          .where(eq(expenseReports.id, reportId))
          .returning();
        
        return rejected;
      }
      
      // Check if there are more approval levels
      const nextApproval = await tx.query.expenseApprovals.findFirst({
        where: and(
          eq(expenseApprovals.expenseReportId, reportId),
          eq(expenseApprovals.status, 'waiting'),
          sql`${expenseApprovals.approvalLevel} > ${approval.approvalLevel}`
        ),
        orderBy: expenseApprovals.approvalLevel,
      });
      
      if (nextApproval) {
        // Activate next level
        await tx.update(expenseApprovals)
          .set({ status: 'pending' })
          .where(eq(expenseApprovals.id, nextApproval.id));
        
        // TODO: Send notification to next approver
        
        return await tx.query.expenseReports.findFirst({
          where: eq(expenseReports.id, reportId),
        });
      }
      
      // All levels approved - finalize
      const [approved] = await tx.update(expenseReports)
        .set({
          status: 'approved',
          approvedAt: new Date(),
          approvedBy: ctx.user?.id,
          updatedAt: new Date(),
          updatedBy: ctx.user?.id,
        })
        .where(eq(expenseReports.id, reportId))
        .returning();
      
      // Create journal entry for the expense
      await this.createExpenseJournalEntry(approved);
      
      return approved;
    });
  }

  /**
   * Process reimbursement for approved expense report
   */
  async processReimbursement(
    reportId: string, 
    paymentMethod: string,
    paymentReference: string
  ) {
    const ctx = getContext();
    
    const report = await db.query.expenseReports.findFirst({
      where: and(
        eq(expenseReports.id, reportId),
        eq(expenseReports.ventureId, ctx.venture.id),
        eq(expenseReports.status, 'approved')
      ),
    });
    
    if (!report) {
      throw new MCVError('Approved report not found', ErrorCode.NOT_FOUND);
    }
    
    const [reimbursed] = await db.update(expenseReports)
      .set({
        status: 'reimbursed',
        paidAt: new Date(),
        paymentMethod,
        paymentReference,
        updatedAt: new Date(),
        updatedBy: ctx.user?.id,
      })
      .where(eq(expenseReports.id, reportId))
      .returning();
    
    // Create payment journal entry
    await this.createReimbursementJournalEntry(reimbursed);
    
    return reimbursed;
  }

  /**
   * Get expense analytics for a period
   */
  async getExpenseAnalytics(startDate: Date, endDate: Date, groupBy?: string) {
    const ctx = getContext();
    
    const analytics = await db.execute(sql`
      SELECT 
        ${groupBy === 'category' ? sql`category` : 
          groupBy === 'department' ? sql`department_id` :
          groupBy === 'employee' ? sql`employee_id` :
          sql`DATE_TRUNC('month', expense_date)`} as group_key,
        COUNT(*) as expense_count,
        SUM(amount) as total_amount,
        AVG(amount) as avg_amount,
        COUNT(CASE WHEN is_reimbursable THEN 1 END) as reimbursable_count,
        SUM(CASE WHEN is_reimbursable THEN amount ELSE 0 END) as reimbursable_amount
      FROM finance_expenses
      WHERE venture_id = ${ctx.venture.id}
        AND expense_date >= ${startDate}
        AND expense_date <= ${endDate}
        AND deleted_at IS NULL
      GROUP BY group_key
      ORDER BY total_amount DESC
    `);
    
    return analytics.rows;
  }

  private async getApplicablePolicy(employeeId: string) {
    const ctx = getContext();
    
    // Get employee's department and roles
    // Then find matching policy
    return db.query.expensePolicies.findFirst({
      where: and(
        eq(expensePolicies.ventureId, ctx.venture.id),
        eq(expensePolicies.isActive, true),
        or(
          eq(expensePolicies.isDefault, true),
          // TODO: Match by department/role
        )
      ),
    });
  }

  private async validateAgainstPolicy(input: CreateExpenseInput, policy: any) {
    const violations: any[] = [];
    
    if (!policy) return violations;
    
    const rules = policy.rules;
    
    // Check per diem limits
    if (rules.maxPerDiem?.[input.category]) {
      const limit = rules.maxPerDiem[input.category];
      if (new Decimal(input.amount).gt(limit)) {
        violations.push({
          type: 'per_diem_exceeded',
          category: input.category,
          limit,
          amount: input.amount,
        });
      }
    }
    
    // Check allowed categories
    if (rules.allowedCategories && !rules.allowedCategories.includes(input.category)) {
      violations.push({
        type: 'category_not_allowed',
        category: input.category,
      });
    }
    
    // Check blocked merchants
    if (rules.blockedMerchants?.includes(input.merchantName)) {
      violations.push({
        type: 'blocked_merchant',
        merchant: input.merchantName,
      });
    }
    
    return violations;
  }

  private getReceiptRequirement(input: CreateExpenseInput, policy: any): string {
    if (!policy) return 'pending';
    
    const rules = policy.rules;
    
    // Always require receipt for certain categories
    if (rules.requireReceipt?.always?.includes(input.category)) {
      return 'pending';
    }
    
    // Require receipt above threshold
    if (rules.requireReceipt?.above) {
      if (new Decimal(input.amount).gt(rules.requireReceipt.above)) {
        return 'pending';
      }
    }
    
    return 'exempt';
  }

  private async processReceiptOCR(receiptUrl: string) {
    // Integration with document processing service
    // Returns extracted data: merchantName, date, total, items, tax
    return null;
  }

  private async generateReportNumber(): Promise<string> {
    const ctx = getContext();
    const year = new Date().getFullYear();
    const month = (new Date().getMonth() + 1).toString().padStart(2, '0');
    
    const count = await db.execute(sql`
      SELECT COUNT(*) FROM finance_expense_reports
      WHERE venture_id = ${ctx.venture.id}
        AND report_number LIKE ${`EXP-${year}${month}-%`}
    `);
    
    const sequence = parseInt(count.rows[0].count) + 1;
    return `EXP-${year}${month}-${sequence.toString().padStart(4, '0')}`;
  }

  private async getApprovalWorkflow(report: any) {
    const ctx = getContext();
    
    return db.query.expenseApprovalWorkflows.findFirst({
      where: and(
        eq(expenseApprovalWorkflows.ventureId, ctx.venture.id),
        eq(expenseApprovalWorkflows.isActive, true),
        or(
          eq(expenseApprovalWorkflows.isDefault, true),
          // TODO: Match by conditions
        )
      ),
    });
  }

  private async determineApprovers(report: any, workflow: any) {
    // Determine approval chain based on workflow levels and report amount
    const approvers: Array<{ userId: string; level: number }> = [];
    
    if (!workflow) {
      // Default: just manager approval
      const manager = await this.getEmployeeManager(report.employeeId);
      if (manager) {
        approvers.push({ userId: manager.id, level: 1 });
      }
      return approvers;
    }
    
    const amount = new Decimal(report.totalAmount);
    
    for (const level of workflow.levels) {
      if (amount.gte(level.threshold)) {
        const approverId = await this.getApproverForLevel(report.employeeId, level);
        if (approverId) {
          approvers.push({ userId: approverId, level: level.level });
        }
      }
    }
    
    return approvers;
  }

  private async getEmployeeManager(employeeId: string) {
    // Get employee's direct manager
    return null;
  }

  private async getApproverForLevel(employeeId: string, level: any) {
    // Determine approver based on level type
    // manager, department_head, finance, cfo, etc.
    return null;
  }

  private async createExpenseJournalEntry(report: any) {
    // Create journal entry debiting expense accounts and crediting AP
    const ctx = getContext();
    
    const reportWithExpenses = await db.query.expenseReports.findFirst({
      where: eq(expenseReports.id, report.id),
      with: { expenses: true },
    });
    
    if (!reportWithExpenses) return;
    
    const lines: any[] = [];
    
    // Group expenses by account
    const byAccount = new Map<string, Decimal>();
    for (const expense of reportWithExpenses.expenses) {
      const accountId = expense.accountId || await this.getDefaultExpenseAccount(expense.category);
      const current = byAccount.get(accountId) || new Decimal(0);
      byAccount.set(accountId, current.plus(expense.amount));
    }
    
    // Debit expense accounts
    for (const [accountId, amount] of byAccount) {
      lines.push({
        accountId,
        debitAmount: amount.toString(),
        description: `Expense report ${report.reportNumber}`,
      });
    }
    
    // Credit accounts payable (employee reimbursement)
    const apAccountId = await this.getEmployeePayableAccount();
    lines.push({
      accountId: apAccountId,
      creditAmount: report.reimbursableAmount,
      description: `Employee reimbursement - ${report.reportNumber}`,
    });
    
    await accountingService.createJournalEntry({
      entryDate: new Date(),
      description: `Expense report: ${report.title}`,
      reference: report.reportNumber,
      sourceType: 'expense',
      sourceId: report.id,
      lines,
    });
  }

  private async createReimbursementJournalEntry(report: any) {
    // Create journal entry debiting AP and crediting cash
  }

  private async getDefaultExpenseAccount(category: string) {
    // Map expense category to account
    return '';
  }

  private async getEmployeePayableAccount() {
    // Get accounts payable - employee reimbursements account
    return '';
  }
}

export const expenseService = new ExpenseService();
```

---

## Module: budgeting

### Purpose

Enables budget planning, allocation across departments/projects, tracking actuals vs. budget, and forecasting.

### Database Schema

```typescript
// @mcv/finance/budgeting/schema.ts
import { pgTable, uuid, text, numeric, timestamp, boolean, jsonb, integer, pgEnum } from 'drizzle-orm/pg-core';
import { baseColumns } from '@mcv/kernel/db';

export const budgetStatusEnum = pgEnum('budget_status', [
  'draft', 'pending_approval', 'approved', 'active', 'closed', 'revised'
]);

export const budgets = pgTable('finance_budgets', {
  ...baseColumns,
  name: text('name').notNull(),
  description: text('description'),
  budgetType: text('budget_type').notNull(), // annual, quarterly, project, department
  fiscalYearId: uuid('fiscal_year_id'),
  departmentId: uuid('department_id'),
  projectId: uuid('project_id'),
  status: budgetStatusEnum('status').default('draft'),
  version: integer('version').default(1),
  parentBudgetId: uuid('parent_budget_id'), // For revisions
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

export const budgetLines = pgTable('finance_budget_lines', {
  ...baseColumns,
  budgetId: uuid('budget_id').references(() => budgets.id).notNull(),
  accountId: uuid('account_id').notNull(),
  categoryName: text('category_name').notNull(),
  description: text('description'),
  budgetAmount: numeric('budget_amount', { precision: 19, scale: 4 }).notNull(),
  actualAmount: numeric('actual_amount', { precision: 19, scale: 4 }).default('0'),
  committedAmount: numeric('committed_amount', { precision: 19, scale: 4 }).default('0'),
  variance: numeric('variance', { precision: 19, scale: 4 }).default('0'),
  variancePercent: numeric('variance_percent', { precision: 10, scale: 4 }).default('0'),
  periodAllocations: jsonb('period_allocations'), // Monthly breakdown
  /*
    periodAllocations: {
      '2026-01': { budget: 10000, actual: 9500 },
      '2026-02': { budget: 10000, actual: 0 },
      ...
    }
  */
  notes: text('notes'),
  isCapex: boolean('is_capex').default(false),
  costCenter: text('cost_center'),
});

export const budgetTransfers = pgTable('finance_budget_transfers', {
  ...baseColumns,
  fromBudgetLineId: uuid('from_budget_line_id').references(() => budgetLines.id).notNull(),
  toBudgetLineId: uuid('to_budget_line_id').references(() => budgetLines.id).notNull(),
  amount: numeric('amount', { precision: 19, scale: 4 }).notNull(),
  reason: text('reason').notNull(),
  status: text('status').default('pending'), // pending, approved, rejected
  requestedBy: uuid('requested_by').notNull(),
  approvedBy: uuid('approved_by'),
  approvedAt: timestamp('approved_at'),
});

export const budgetForecasts = pgTable('finance_budget_forecasts', {
  ...baseColumns,
  budgetId: uuid('budget_id').references(() => budgets.id).notNull(),
  forecastDate: timestamp('forecast_date').notNull(),
  forecastType: text('forecast_type').notNull(), // linear, seasonal, ml_based
  periodForecasts: jsonb('period_forecasts').notNull(),
  /*
    periodForecasts: [
      { period: '2026-03', predicted: 12000, confidence: 0.85, range: { low: 10000, high: 14000 } },
      { period: '2026-04', predicted: 11500, confidence: 0.80, range: { low: 9500, high: 13500 } },
    ]
  */
  accuracy: numeric('accuracy', { precision: 5, scale: 4 }),
  modelParameters: jsonb('model_parameters'),
  notes: text('notes'),
});

export const budgetScenarios = pgTable('finance_budget_scenarios', {
  ...baseColumns,
  budgetId: uuid('budget_id').references(() => budgets.id).notNull(),
  name: text('name').notNull(),
  description: text('description'),
  scenarioType: text('scenario_type').notNull(), // best_case, worst_case, most_likely, custom
  assumptions: jsonb('assumptions').notNull(),
  /*
    assumptions: {
      revenueGrowth: 0.15,
      costInflation: 0.03,
      headcountChange: 5,
      customFactors: { ... }
    }
  */
  lineAdjustments: jsonb('line_adjustments'),
  /*
    lineAdjustments: {
      'budget_line_id_1': { factor: 1.1, override: null },
      'budget_line_id_2': { factor: null, override: 50000 },
    }
  */
  projectedTotal: numeric('projected_total', { precision: 19, scale: 4 }),
  isActive: boolean('is_active').default(true),
});

export const budgetAlerts = pgTable('finance_budget_alerts', {
  ...baseColumns,
  budgetId: uuid('budget_id').references(() => budgets.id),
  budgetLineId: uuid('budget_line_id').references(() => budgetLines.id),
  alertType: text('alert_type').notNull(), // threshold, overspend, variance, forecast
  threshold: numeric('threshold', { precision: 10, scale: 4 }),
  thresholdType: text('threshold_type'), // percent, absolute
  currentValue: numeric('current_value', { precision: 19, scale: 4 }),
  message: text('message').notNull(),
  severity: text('severity').default('warning'), // info, warning, critical
  status: text('status').default('active'), // active, acknowledged, resolved
  triggeredAt: timestamp('triggered_at').notNull(),
  acknowledgedAt: timestamp('acknowledged_at'),
  acknowledgedBy: uuid('acknowledged_by'),
  notifiedUsers: jsonb('notified_users'),
});
```

### Service Implementation

```typescript
// @mcv/finance/budgeting/service.ts
import { db } from '@mcv/kernel';
import { eq, and, sql, desc, between, sum } from 'drizzle-orm';
import { 
  budgets, budgetLines, budgetTransfers, 
  budgetForecasts, budgetScenarios, budgetAlerts 
} from './schema';
import { MCVError, ErrorCode } from '@mcv/kernel/errors';
import { getContext } from '@mcv/kernel/context';
import Decimal from 'decimal.js';

export interface CreateBudgetInput {
  name: string;
  description?: string;
  budgetType: 'annual' | 'quarterly' | 'project' | 'department';
  fiscalYearId?: string;
  departmentId?: string;
  projectId?: string;
  startDate: Date;
  endDate: Date;
  currency?: string;
  lines: BudgetLineInput[];
}

export interface BudgetLineInput {
  accountId: string;
  categoryName: string;
  description?: string;
  budgetAmount: string;
  periodAllocations?: Record<string, { budget: number }>;
  isCapex?: boolean;
  costCenter?: string;
}

export class BudgetingService {
  /**
   * Create a new budget
   */
  async createBudget(input: CreateBudgetInput) {
    const ctx = getContext();
    
    // Calculate total budget from lines
    const totalBudget = input.lines.reduce(
      (sum, line) => sum.plus(line.budgetAmount),
      new Decimal(0)
    );
    
    return db.transaction(async (tx) => {
      const [budget] = await tx.insert(budgets).values({
        ventureId: ctx.venture.id,
        name: input.name,
        description: input.description,
        budgetType: input.budgetType,
        fiscalYearId: input.fiscalYearId,
        departmentId: input.departmentId,
        projectId: input.projectId,
        startDate: input.startDate,
        endDate: input.endDate,
        currency: input.currency ?? 'USD',
        totalBudget: totalBudget.toString(),
        totalAllocated: totalBudget.toString(),
        status: 'draft',
        createdBy: ctx.user?.id,
      }).returning();
      
      // Create budget lines
      const lines = await Promise.all(
        input.lines.map(line => 
          tx.insert(budgetLines).values({
            ventureId: ctx.venture.id,
            budgetId: budget.id,
            accountId: line.accountId,
            categoryName: line.categoryName,
            description: line.description,
            budgetAmount: line.budgetAmount,
            periodAllocations: line.periodAllocations ?? 
              this.distributeEvenly(line.budgetAmount, input.startDate, input.endDate),
            isCapex: line.isCapex ?? false,
            costCenter: line.costCenter,
            createdBy: ctx.user?.id,
          }).returning()
        )
      );
      
      return { budget, lines: lines.map(l => l[0]) };
    });
  }

  /**
   * Submit budget for approval
   */
  async submitBudget(budgetId: string) {
    const ctx = getContext();
    
    const budget = await db.query.budgets.findFirst({
      where: and(
        eq(budgets.id, budgetId),
        eq(budgets.ventureId, ctx.venture.id)
      ),
    });
    
    if (!budget) {
      throw new MCVError('Budget not found', ErrorCode.NOT_FOUND);
    }
    
    if (budget.status !== 'draft') {
      throw new MCVError('Only draft budgets can be submitted', ErrorCode.BUSINESS_RULE_VIOLATION);
    }
    
    const [updated] = await db.update(budgets)
      .set({
        status: 'pending_approval',
        updatedAt: new Date(),
        updatedBy: ctx.user?.id,
      })
      .where(eq(budgets.id, budgetId))
      .returning();
    
    return updated;
  }

  /**
   * Approve and activate a budget
   */
  async approveBudget(budgetId: string) {
    const ctx = getContext();
    
    const budget = await db.query.budgets.findFirst({
      where: and(
        eq(budgets.id, budgetId),
        eq(budgets.ventureId, ctx.venture.id)
      ),
    });
    
    if (!budget) {
      throw new MCVError('Budget not found', ErrorCode.NOT_FOUND);
    }
    
    if (budget.status !== 'pending_approval') {
      throw new MCVError('Budget is not pending approval', ErrorCode.BUSINESS_RULE_VIOLATION);
    }
    
    const [approved] = await db.update(budgets)
      .set({
        status: 'active',
        approvedAt: new Date(),
        approvedBy: ctx.user?.id,
        updatedAt: new Date(),
        updatedBy: ctx.user?.id,
      })
      .where(eq(budgets.id, budgetId))
      .returning();
    
    // Set up budget monitoring alerts
    await this.setupBudgetAlerts(approved);
    
    return approved;
  }

  /**
   * Record actual spending against budget
   */
  async recordActual(budgetLineId: string, amount: string, period: string) {
    const ctx = getContext();
    
    const line = await db.query.budgetLines.findFirst({
      where: and(
        eq(budgetLines.id, budgetLineId),
        eq(budgetLines.ventureId, ctx.venture.id)
      ),
      with: { budget: true },
    });
    
    if (!line) {
      throw new MCVError('Budget line not found', ErrorCode.NOT_FOUND);
    }
    
    if (line.budget.status !== 'active') {
      throw new MCVError('Budget is not active', ErrorCode.BUSINESS_RULE_VIOLATION);
    }
    
    const actualAmount = new Decimal(line.actualAmount ?? 0).plus(amount);
    const variance = new Decimal(line.budgetAmount).minus(actualAmount);
    const variancePercent = variance.div(line.budgetAmount).times(100);
    
    // Update period allocation
    const periodAllocations = { ...(line.periodAllocations as any) };
    if (periodAllocations[period]) {
      periodAllocations[period].actual = (periodAllocations[period].actual ?? 0) + parseFloat(amount);
    }
    
    const [updated] = await db.update(budgetLines)
      .set({
        actualAmount: actualAmount.toString(),
        variance: variance.toString(),
        variancePercent: variancePercent.toString(),
        periodAllocations,
        updatedAt: new Date(),
      })
      .where(eq(budgetLines.id, budgetLineId))
      .returning();
    
    // Update budget totals
    await this.updateBudgetTotals(line.budgetId);
    
    // Check for alerts
    await this.checkBudgetAlerts(line.budgetId, budgetLineId);
    
    return updated;
  }

  /**
   * Request a budget transfer between lines
   */
  async requestTransfer(input: {
    fromBudgetLineId: string;
    toBudgetLineId: string;
    amount: string;
    reason: string;
  }) {
    const ctx = getContext();
    
    // Validate both lines exist and belong to same budget
    const fromLine = await db.query.budgetLines.findFirst({
      where: eq(budgetLines.id, input.fromBudgetLineId),
    });
    
    const toLine = await db.query.budgetLines.findFirst({
      where: eq(budgetLines.id, input.toBudgetLineId),
    });
    
    if (!fromLine || !toLine) {
      throw new MCVError('Budget line not found', ErrorCode.NOT_FOUND);
    }
    
    if (fromLine.budgetId !== toLine.budgetId) {
      throw new MCVError('Lines must belong to the same budget', ErrorCode.VALIDATION_ERROR);
    }
    
    // Check available budget
    const available = new Decimal(fromLine.budgetAmount)
      .minus(fromLine.actualAmount ?? 0)
      .minus(fromLine.committedAmount ?? 0);
    
    if (available.lt(input.amount)) {
      throw new MCVError(
        `Insufficient budget available. Available: ${available}`,
        ErrorCode.BUSINESS_RULE_VIOLATION
      );
    }
    
    const [transfer] = await db.insert(budgetTransfers).values({
      ventureId: ctx.venture.id,
      fromBudgetLineId: input.fromBudgetLineId,
      toBudgetLineId: input.toBudgetLineId,
      amount: input.amount,
      reason: input.reason,
      requestedBy: ctx.user!.id,
      status: 'pending',
      createdBy: ctx.user?.id,
    }).returning();
    
    return transfer;
  }

  /**
   * Approve a budget transfer
   */
  async approveTransfer(transferId: string) {
    const ctx = getContext();
    
    const transfer = await db.query.budgetTransfers.findFirst({
      where: and(
        eq(budgetTransfers.id, transferId),
        eq(budgetTransfers.ventureId, ctx.venture.id),
        eq(budgetTransfers.status, 'pending')
      ),
    });
    
    if (!transfer) {
      throw new MCVError('Transfer not found or already processed', ErrorCode.NOT_FOUND);
    }
    
    return db.transaction(async (tx) => {
      // Reduce from source line
      await tx.update(budgetLines)
        .set({
          budgetAmount: sql`${budgetLines.budgetAmount} - ${transfer.amount}`,
          updatedAt: new Date(),
        })
        .where(eq(budgetLines.id, transfer.fromBudgetLineId));
      
      // Add to destination line
      await tx.update(budgetLines)
        .set({
          budgetAmount: sql`${budgetLines.budgetAmount} + ${transfer.amount}`,
          updatedAt: new Date(),
        })
        .where(eq(budgetLines.id, transfer.toBudgetLineId));
      
      // Update transfer status
      const [approved] = await tx.update(budgetTransfers)
        .set({
          status: 'approved',
          approvedBy: ctx.user?.id,
          approvedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(budgetTransfers.id, transferId))
        .returning();
      
      return approved;
    });
  }

  /**
   * Generate budget forecast
   */
  async generateForecast(budgetId: string, method: 'linear' | 'seasonal' | 'ml_based' = 'linear') {
    const ctx = getContext();
    
    const budget = await db.query.budgets.findFirst({
      where: and(
        eq(budgets.id, budgetId),
        eq(budgets.ventureId, ctx.venture.id)
      ),
      with: { lines: true },
    });
    
    if (!budget) {
      throw new MCVError('Budget not found', ErrorCode.NOT_FOUND);
    }
    
    // Get historical actuals
    const historicalData = await this.getHistoricalSpending(budget);
    
    // Generate period forecasts based on method
    let periodForecasts;
    switch (method) {
      case 'linear':
        periodForecasts = this.linearForecast(budget, historicalData);
        break;
      case 'seasonal':
        periodForecasts = this.seasonalForecast(budget, historicalData);
        break;
      case 'ml_based':
        periodForecasts = await this.mlForecast(budget, historicalData);
        break;
    }
    
    const [forecast] = await db.insert(budgetForecasts).values({
      ventureId: ctx.venture.id,
      budgetId,
      forecastDate: new Date(),
      forecastType: method,
      periodForecasts,
      createdBy: ctx.user?.id,
    }).returning();
    
    return forecast;
  }

  /**
   * Create budget scenario for what-if analysis
   */
  async createScenario(input: {
    budgetId: string;
    name: string;
    description?: string;
    scenarioType: 'best_case' | 'worst_case' | 'most_likely' | 'custom';
    assumptions: Record<string, any>;
    lineAdjustments?: Record<string, { factor?: number; override?: number }>;
  }) {
    const ctx = getContext();
    
    const budget = await db.query.budgets.findFirst({
      where: and(
        eq(budgets.id, input.budgetId),
        eq(budgets.ventureId, ctx.venture.id)
      ),
      with: { lines: true },
    });
    
    if (!budget) {
      throw new MCVError('Budget not found', ErrorCode.NOT_FOUND);
    }
    
    // Calculate projected total based on assumptions and adjustments
    let projectedTotal = new Decimal(0);
    
    for (const line of budget.lines) {
      let lineAmount = new Decimal(line.budgetAmount);
      
      if (input.lineAdjustments?.[line.id]) {
        const adj = input.lineAdjustments[line.id];
        if (adj.override !== undefined) {
          lineAmount = new Decimal(adj.override);
        } else if (adj.factor !== undefined) {
          lineAmount = lineAmount.times(adj.factor);
        }
      } else {
        // Apply global assumptions
        if (input.assumptions.costInflation) {
          lineAmount = lineAmount.times(1 + input.assumptions.costInflation);
        }
      }
      
      projectedTotal = projectedTotal.plus(lineAmount);
    }
    
    const [scenario] = await db.insert(budgetScenarios).values({
      ventureId: ctx.venture.id,
      budgetId: input.budgetId,
      name: input.name,
      description: input.description,
      scenarioType: input.scenarioType,
      assumptions: input.assumptions,
      lineAdjustments: input.lineAdjustments,
      projectedTotal: projectedTotal.toString(),
      createdBy: ctx.user?.id,
    }).returning();
    
    return scenario;
  }

  /**
   * Get budget vs actual comparison
   */
  async getBudgetVsActual(budgetId: string) {
    const ctx = getContext();
    
    const budget = await db.query.budgets.findFirst({
      where: and(
        eq(budgets.id, budgetId),
        eq(budgets.ventureId, ctx.venture.id)
      ),
      with: { lines: true },
    });
    
    if (!budget) {
      throw new MCVError('Budget not found', ErrorCode.NOT_FOUND);
    }
    
    const comparison = budget.lines.map(line => ({
      categoryName: line.categoryName,
      budgetAmount: line.budgetAmount,
      actualAmount: line.actualAmount ?? '0',
      committedAmount: line.committedAmount ?? '0',
      variance: line.variance ?? '0',
      variancePercent: line.variancePercent ?? '0',
      utilizationPercent: new Decimal(line.actualAmount ?? 0)
        .div(line.budgetAmount)
        .times(100)
        .toFixed(2),
      status: this.getLineStatus(line),
      periodBreakdown: line.periodAllocations,
    }));
    
    const totals = {
      totalBudget: budget.totalBudget,
      totalActual: budget.totalActual,
      totalCommitted: budget.totalCommitted,
      totalVariance: new Decimal(budget.totalBudget ?? 0)
        .minus(budget.totalActual ?? 0)
        .toString(),
      utilizationPercent: new Decimal(budget.totalActual ?? 0)
        .div(budget.totalBudget ?? 1)
        .times(100)
        .toFixed(2),
    };
    
    return { budget, lines: comparison, totals };
  }

  private distributeEvenly(totalAmount: string, startDate: Date, endDate: Date) {
    const allocations: Record<string, { budget: number }> = {};
    
    const start = new Date(startDate);
    const end = new Date(endDate);
    const months: string[] = [];
    
    while (start <= end) {
      const period = `${start.getFullYear()}-${(start.getMonth() + 1).toString().padStart(2, '0')}`;
      months.push(period);
      start.setMonth(start.getMonth() + 1);
    }
    
    const monthlyAmount = new Decimal(totalAmount).div(months.length).toNumber();
    
    months.forEach(month => {
      allocations[month] = { budget: monthlyAmount };
    });
    
    return allocations;
  }

  private async updateBudgetTotals(budgetId: string) {
    const result = await db.execute(sql`
      SELECT 
        SUM(actual_amount) as total_actual,
        SUM(committed_amount) as total_committed
      FROM finance_budget_lines
      WHERE budget_id = ${budgetId}
    `);
    
    await db.update(budgets)
      .set({
        totalActual: result.rows[0].total_actual ?? '0',
        totalCommitted: result.rows[0].total_committed ?? '0',
        updatedAt: new Date(),
      })
      .where(eq(budgets.id, budgetId));
  }

  private async setupBudgetAlerts(budget: any) {
    const ctx = getContext();
    
    // Create threshold alerts at 75%, 90%, 100%
    const thresholds = [75, 90, 100];
    
    for (const threshold of thresholds) {
      await db.insert(budgetAlerts).values({
        ventureId: ctx.venture.id,
        budgetId: budget.id,
        alertType: 'threshold',
        threshold: threshold.toString(),
        thresholdType: 'percent',
        message: `Budget ${budget.name} has reached ${threshold}% utilization`,
        severity: threshold === 100 ? 'critical' : threshold === 90 ? 'warning' : 'info',
        status: 'active',
        triggeredAt: new Date(),
        createdBy: ctx.user?.id,
      });
    }
  }

  private async checkBudgetAlerts(budgetId: string, budgetLineId: string) {
    // Check if any alert thresholds have been crossed
  }

  private getLineStatus(line: any): 'on_track' | 'warning' | 'over_budget' {
    const utilization = new Decimal(line.actualAmount ?? 0)
      .div(line.budgetAmount)
      .times(100);
    
    if (utilization.gt(100)) return 'over_budget';
    if (utilization.gt(90)) return 'warning';
    return 'on_track';
  }

  private async getHistoricalSpending(budget: any) {
    // Get historical spending patterns for forecasting
    return [];
  }

  private linearForecast(budget: any, historicalData: any[]) {
    // Simple linear regression forecast
    return [];
  }

  private seasonalForecast(budget: any, historicalData: any[]) {
    // Seasonal decomposition forecast
    return [];
  }

  private async mlForecast(budget: any, historicalData: any[]) {
    // ML-based forecast using historical patterns
    return [];
  }
}

export const budgetingService = new BudgetingService();
```

---

## Module: reporting

### Purpose

Generates standard financial statements (Income Statement, Balance Sheet, Cash Flow) and enables custom report building.

### Database Schema

```typescript
// @mcv/finance/reporting/schema.ts
import { pgTable, uuid, text, timestamp, boolean, jsonb, pgEnum } from 'drizzle-orm/pg-core';
import { baseColumns } from '@mcv/kernel/db';

export const reportTypeEnum = pgEnum('report_type', [
  'income_statement', 'balance_sheet', 'cash_flow', 'trial_balance',
  'aged_receivables', 'aged_payables', 'budget_vs_actual', 'custom'
]);

export const reportScheduleEnum = pgEnum('report_schedule', [
  'daily', 'weekly', 'monthly', 'quarterly', 'yearly', 'on_demand'
]);

export const financialReports = pgTable('finance_reports', {
  ...baseColumns,
  name: text('name').notNull(),
  description: text('description'),
  reportType: reportTypeEnum('report_type').notNull(),
  isTemplate: boolean('is_template').default(false),
  configuration: jsonb('configuration').notNull(),
  /*
    configuration: {
      dateRange: { type: 'period', periodId: 'uuid' } | { type: 'custom', start: Date, end: Date },
      compareWith: { type: 'prior_period' | 'prior_year' | 'budget' },
      filters: { departments: [], projects: [], accounts: [] },
      groupBy: ['department', 'project'],
      columns: ['actual', 'budget', 'variance', 'variance_pct'],
      showZeroBalances: false,
      roundToNearest: 1, // 1, 100, 1000
    }
  */
  schedule: reportScheduleEnum('schedule').default('on_demand'),
  scheduleConfig: jsonb('schedule_config'),
  /*
    scheduleConfig: {
      dayOfWeek: 1, // For weekly
      dayOfMonth: 1, // For monthly
      time: '08:00',
      timezone: 'America/New_York',
      recipients: ['email@example.com'],
      format: 'pdf' | 'excel' | 'csv',
    }
  */
  lastRunAt: timestamp('last_run_at'),
  nextRunAt: timestamp('next_run_at'),
  isActive: boolean('is_active').default(true),
  createdBy: uuid('created_by'),
});

export const reportRuns = pgTable('finance_report_runs', {
  ...baseColumns,
  reportId: uuid('report_id').references(() => financialReports.id).notNull(),
  status: text('status').default('pending'), // pending, running, completed, failed
  startedAt: timestamp('started_at'),
  completedAt: timestamp('completed_at'),
  configuration: jsonb('configuration'), // Snapshot of config at run time
  results: jsonb('results'),
  resultFileUrl: text('result_file_url'),
  resultFormat: text('result_format'),
  errorMessage: text('error_message'),
  triggeredBy: text('triggered_by'), // 'schedule' | 'manual'
  triggeredByUser: uuid('triggered_by_user'),
});

export const reportSubscriptions = pgTable('finance_report_subscriptions', {
  ...baseColumns,
  reportId: uuid('report_id').references(() => financialReports.id).notNull(),
  userId: uuid('user_id').notNull(),
  email: text('email'),
  format: text('format').default('pdf'),
  isActive: boolean('is_active').default(true),
});

export const customReportDefinitions = pgTable('finance_custom_report_definitions', {
  ...baseColumns,
  name: text('name').notNull(),
  description: text('description'),
  baseReportType: text('base_report_type'),
  columns: jsonb('columns').notNull(),
  /*
    columns: [
      { id: 'col1', name: 'Account', type: 'text', source: 'account.name' },
      { id: 'col2', name: 'Period 1', type: 'currency', source: 'balance', period: 'current' },
      { id: 'col3', name: 'Period 2', type: 'currency', source: 'balance', period: 'prior' },
      { id: 'col4', name: 'Change', type: 'currency', formula: 'col2 - col3' },
      { id: 'col5', name: 'Change %', type: 'percent', formula: '(col2 - col3) / col3 * 100' },
    ]
  */
  rows: jsonb('rows').notNull(),
  /*
    rows: [
      { id: 'row1', type: 'header', label: 'ASSETS' },
      { id: 'row2', type: 'account_group', accountTypes: ['asset'], subtypes: ['cash'] },
      { id: 'row3', type: 'subtotal', label: 'Total Cash', sumRows: ['row2'] },
      { id: 'row4', type: 'account_group', accountTypes: ['asset'], subtypes: ['accounts_receivable'] },
      { id: 'row5', type: 'subtotal', label: 'Total Current Assets', sumRows: ['row3', 'row4'] },
    ]
  */
  formatting: jsonb('formatting'),
  isPublic: boolean('is_public').default(false),
});
```

### Service Implementation

```typescript
// @mcv/finance/reporting/service.ts
import { db } from '@mcv/kernel';
import { eq, and, sql, between, inArray } from 'drizzle-orm';
import { 
  financialReports, reportRuns, customReportDefinitions,
  accounts, journalEntryLines, accountBalances, fiscalPeriods
} from '../schema';
import { MCVError, ErrorCode } from '@mcv/kernel/errors';
import { getContext } from '@mcv/kernel/context';
import Decimal from 'decimal.js';

export interface ReportDateRange {
  type: 'period' | 'custom';
  periodId?: string;
  startDate?: Date;
  endDate?: Date;
}

export interface ReportOptions {
  dateRange: ReportDateRange;
  compareWith?: 'prior_period' | 'prior_year' | 'budget';
  departmentIds?: string[];
  projectIds?: string[];
  showZeroBalances?: boolean;
  roundToNearest?: number;
}

export class ReportingService {
  /**
   * Generate Income Statement (P&L)
   */
  async generateIncomeStatement(options: ReportOptions) {
    const ctx = getContext();
    
    const { startDate, endDate } = await this.resolveDateRange(options.dateRange);
    
    // Get revenue accounts
    const revenueAccounts = await this.getAccountBalances({
      ventureId: ctx.venture.id,
      accountTypes: ['revenue'],
      startDate,
      endDate,
      departmentIds: options.departmentIds,
    });
    
    // Get expense accounts
    const expenseAccounts = await this.getAccountBalances({
      ventureId: ctx.venture.id,
      accountTypes: ['expense'],
      startDate,
      endDate,
      departmentIds: options.departmentIds,
    });
    
    // Calculate totals
    const totalRevenue = revenueAccounts.reduce(
      (sum, acc) => sum.plus(acc.balance), new Decimal(0)
    );
    
    const totalExpenses = expenseAccounts.reduce(
      (sum, acc) => sum.plus(acc.balance), new Decimal(0)
    );
    
    const netIncome = totalRevenue.minus(totalExpenses);
    
    // Get comparison data if requested
    let comparison = null;
    if (options.compareWith) {
      comparison = await this.getComparisonData(options, 'income_statement');
    }
    
    const report = {
      title: 'Income Statement',
      subtitle: `For the period ${startDate.toISOString().split('T')[0]} to ${endDate.toISOString().split('T')[0]}`,
      generatedAt: new Date(),
      sections: [
        {
          title: 'Revenue',
          accounts: this.formatAccountRows(revenueAccounts, options, comparison?.revenue),
          total: this.formatAmount(totalRevenue, options),
          priorTotal: comparison?.totalRevenue,
          variance: comparison ? totalRevenue.minus(comparison.totalRevenue).toString() : null,
        },
        {
          title: 'Expenses',
          subsections: this.groupExpensesBySubtype(expenseAccounts, options, comparison?.expenses),
          total: this.formatAmount(totalExpenses, options),
          priorTotal: comparison?.totalExpenses,
          variance: comparison ? totalExpenses.minus(comparison.totalExpenses).toString() : null,
        },
      ],
      summary: {
        grossProfit: totalRevenue.toString(),
        totalExpenses: totalExpenses.toString(),
        netIncome: netIncome.toString(),
        netIncomeMargin: totalRevenue.gt(0) 
          ? netIncome.div(totalRevenue).times(100).toFixed(2) 
          : '0',
        priorNetIncome: comparison?.netIncome,
        netIncomeChange: comparison 
          ? netIncome.minus(comparison.netIncome).toString() 
          : null,
      },
    };
    
    return report;
  }

  /**
   * Generate Balance Sheet
   */
  async generateBalanceSheet(options: ReportOptions) {
    const ctx = getContext();
    
    const { endDate } = await this.resolveDateRange(options.dateRange);
    
    // Get asset accounts
    const assetAccounts = await this.getAccountBalances({
      ventureId: ctx.venture.id,
      accountTypes: ['asset'],
      asOfDate: endDate,
    });
    
    // Get liability accounts
    const liabilityAccounts = await this.getAccountBalances({
      ventureId: ctx.venture.id,
      accountTypes: ['liability'],
      asOfDate: endDate,
    });
    
    // Get equity accounts
    const equityAccounts = await this.getAccountBalances({
      ventureId: ctx.venture.id,
      accountTypes: ['equity'],
      asOfDate: endDate,
    });
    
    // Calculate totals
    const totalAssets = assetAccounts.reduce(
      (sum, acc) => sum.plus(acc.balance), new Decimal(0)
    );
    
    const totalLiabilities = liabilityAccounts.reduce(
      (sum, acc) => sum.plus(acc.balance), new Decimal(0)
    );
    
    const totalEquity = equityAccounts.reduce(
      (sum, acc) => sum.plus(acc.balance), new Decimal(0)
    );
    
    // Calculate retained earnings (Net Income for the period)
    const retainedEarnings = await this.calculateRetainedEarnings(ctx.venture.id, endDate);
    
    const totalEquityWithRetained = totalEquity.plus(retainedEarnings);
    const totalLiabilitiesAndEquity = totalLiabilities.plus(totalEquityWithRetained);
    
    // Verify balance
    const isBalanced = totalAssets.equals(totalLiabilitiesAndEquity);
    
    let comparison = null;
    if (options.compareWith) {
      comparison = await this.getComparisonData(options, 'balance_sheet');
    }
    
    const report = {
      title: 'Balance Sheet',
      subtitle: `As of ${endDate.toISOString().split('T')[0]}`,
      generatedAt: new Date(),
      sections: [
        {
          title: 'Assets',
          subsections: [
            {
              title: 'Current Assets',
              accounts: this.formatAccountRows(
                assetAccounts.filter(a => this.isCurrentAsset(a)),
                options
              ),
              subtotal: this.calculateSubtotal(assetAccounts.filter(a => this.isCurrentAsset(a))),
            },
            {
              title: 'Fixed Assets',
              accounts: this.formatAccountRows(
                assetAccounts.filter(a => !this.isCurrentAsset(a)),
                options
              ),
              subtotal: this.calculateSubtotal(assetAccounts.filter(a => !this.isCurrentAsset(a))),
            },
          ],
          total: this.formatAmount(totalAssets, options),
        },
        {
          title: 'Liabilities',
          subsections: [
            {
              title: 'Current Liabilities',
              accounts: this.formatAccountRows(
                liabilityAccounts.filter(a => this.isCurrentLiability(a)),
                options
              ),
              subtotal: this.calculateSubtotal(liabilityAccounts.filter(a => this.isCurrentLiability(a))),
            },
            {
              title: 'Long-term Liabilities',
              accounts: this.formatAccountRows(
                liabilityAccounts.filter(a => !this.isCurrentLiability(a)),
                options
              ),
              subtotal: this.calculateSubtotal(liabilityAccounts.filter(a => !this.isCurrentLiability(a))),
            },
          ],
          total: this.formatAmount(totalLiabilities, options),
        },
        {
          title: "Shareholders' Equity",
          accounts: [
            ...this.formatAccountRows(equityAccounts, options),
            {
              code: '',
              name: 'Retained Earnings (Current Period)',
              balance: retainedEarnings.toString(),
            },
          ],
          total: this.formatAmount(totalEquityWithRetained, options),
        },
      ],
      summary: {
        totalAssets: totalAssets.toString(),
        totalLiabilities: totalLiabilities.toString(),
        totalEquity: totalEquityWithRetained.toString(),
        totalLiabilitiesAndEquity: totalLiabilitiesAndEquity.toString(),
        isBalanced,
        difference: isBalanced ? '0' : totalAssets.minus(totalLiabilitiesAndEquity).toString(),
      },
    };
    
    return report;
  }

  /**
   * Generate Cash Flow Statement
   */
  async generateCashFlowStatement(options: ReportOptions) {
    const ctx = getContext();
    
    const { startDate, endDate } = await this.resolveDateRange(options.dateRange);
    
    // Get cash account transactions
    const cashTransactions = await this.getCashTransactions(
      ctx.venture.id,
      startDate,
      endDate
    );
    
    // Categorize by activity type
    const operating = this.categorizeOperatingActivities(cashTransactions);
    const investing = this.categorizeInvestingActivities(cashTransactions);
    const financing = this.categorizeFinancingActivities(cashTransactions);
    
    // Calculate totals
    const netOperating = operating.reduce((sum, t) => sum.plus(t.amount), new Decimal(0));
    const netInvesting = investing.reduce((sum, t) => sum.plus(t.amount), new Decimal(0));
    const netFinancing = financing.reduce((sum, t) => sum.plus(t.amount), new Decimal(0));
    const netChange = netOperating.plus(netInvesting).plus(netFinancing);
    
    // Get beginning and ending cash
    const beginningCash = await this.getCashBalance(ctx.venture.id, startDate);
    const endingCash = beginningCash.plus(netChange);
    
    const report = {
      title: 'Statement of Cash Flows',
      subtitle: `For the period ${startDate.toISOString().split('T')[0]} to ${endDate.toISOString().split('T')[0]}`,
      generatedAt: new Date(),
      sections: [
        {
          title: 'Cash Flows from Operating Activities',
          items: operating.map(t => ({
            description: t.description,
            amount: t.amount,
          })),
          netCash: netOperating.toString(),
        },
        {
          title: 'Cash Flows from Investing Activities',
          items: investing.map(t => ({
            description: t.description,
            amount: t.amount,
          })),
          netCash: netInvesting.toString(),
        },
        {
          title: 'Cash Flows from Financing Activities',
          items: financing.map(t => ({
            description: t.description,
            amount: t.amount,
          })),
          netCash: netFinancing.toString(),
        },
      ],
      summary: {
        netOperating: netOperating.toString(),
        netInvesting: netInvesting.toString(),
        netFinancing: netFinancing.toString(),
        netChangeInCash: netChange.toString(),
        beginningCash: beginningCash.toString(),
        endingCash: endingCash.toString(),
      },
    };
    
    return report;
  }

  /**
   * Generate Aged Receivables Report
   */
  async generateAgedReceivables(asOfDate: Date = new Date()) {
    const ctx = getContext();
    
    const receivables = await db.execute(sql`
      SELECT 
        c.id as customer_id,
        c.name as customer_name,
        i.id as invoice_id,
        i.invoice_number,
        i.invoice_date,
        i.due_date,
        i.total_amount,
        i.amount_paid,
        (i.total_amount - i.amount_paid) as balance_due,
        ${asOfDate}::date - i.due_date::date as days_overdue
      FROM finance_invoices i
      JOIN customers c ON i.customer_id = c.id
      WHERE i.venture_id = ${ctx.venture.id}
        AND i.status IN ('sent', 'partial', 'overdue')
        AND (i.total_amount - i.amount_paid) > 0
      ORDER BY c.name, days_overdue DESC
    `);
    
    // Age buckets: Current, 1-30, 31-60, 61-90, 90+
    const aged = {
      current: new Decimal(0),
      days1to30: new Decimal(0),
      days31to60: new Decimal(0),
      days61to90: new Decimal(0),
      over90: new Decimal(0),
    };
    
    const byCustomer = new Map<string, any>();
    
    for (const row of receivables.rows) {
      const balance = new Decimal(row.balance_due);
      const daysOverdue = parseInt(row.days_overdue);
      
      // Update totals
      if (daysOverdue <= 0) {
        aged.current = aged.current.plus(balance);
      } else if (daysOverdue <= 30) {
        aged.days1to30 = aged.days1to30.plus(balance);
      } else if (daysOverdue <= 60) {
        aged.days31to60 = aged.days31to60.plus(balance);
      } else if (daysOverdue <= 90) {
        aged.days61to90 = aged.days61to90.plus(balance);
      } else {
        aged.over90 = aged.over90.plus(balance);
      }
      
      // Group by customer
      if (!byCustomer.has(row.customer_id)) {
        byCustomer.set(row.customer_id, {
          customerId: row.customer_id,
          customerName: row.customer_name,
          invoices: [],
          totals: { current: 0, days1to30: 0, days31to60: 0, days61to90: 0, over90: 0 },
        });
      }
      
      const customer = byCustomer.get(row.customer_id);
      customer.invoices.push(row);
      
      // Update customer totals by bucket
      if (daysOverdue <= 0) customer.totals.current += parseFloat(row.balance_due);
      else if (daysOverdue <= 30) customer.totals.days1to30 += parseFloat(row.balance_due);
      else if (daysOverdue <= 60) customer.totals.days31to60 += parseFloat(row.balance_due);
      else if (daysOverdue <= 90) customer.totals.days61to90 += parseFloat(row.balance_due);
      else customer.totals.over90 += parseFloat(row.balance_due);
    }
    
    const total = aged.current
      .plus(aged.days1to30)
      .plus(aged.days31to60)
      .plus(aged.days61to90)
      .plus(aged.over90);
    
    return {
      title: 'Aged Receivables Report',
      asOfDate,
      generatedAt: new Date(),
      customers: Array.from(byCustomer.values()),
      summary: {
        current: aged.current.toString(),
        days1to30: aged.days1to30.toString(),
        days31to60: aged.days31to60.toString(),
        days61to90: aged.days61to90.toString(),
        over90: aged.over90.toString(),
        total: total.toString(),
      },
      percentages: {
        current: total.gt(0) ? aged.current.div(total).times(100).toFixed(1) : '0',
        days1to30: total.gt(0) ? aged.days1to30.div(total).times(100).toFixed(1) : '0',
        days31to60: total.gt(0) ? aged.days31to60.div(total).times(100).toFixed(1) : '0',
        days61to90: total.gt(0) ? aged.days61to90.div(total).times(100).toFixed(1) : '0',
        over90: total.gt(0) ? aged.over90.div(total).times(100).toFixed(1) : '0',
      },
    };
  }

  /**
   * Create a custom report definition
   */
  async createCustomReport(input: {
    name: string;
    description?: string;
    columns: any[];
    rows: any[];
    formatting?: any;
  }) {
    const ctx = getContext();
    
    const [report] = await db.insert(customReportDefinitions).values({
      ventureId: ctx.venture.id,
      name: input.name,
      description: input.description,
      columns: input.columns,
      rows: input.rows,
      formatting: input.formatting,
      createdBy: ctx.user?.id,
    }).returning();
    
    return report;
  }

  /**
   * Schedule a report for recurring generation
   */
  async scheduleReport(reportId: string, schedule: {
    frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';
    dayOfWeek?: number;
    dayOfMonth?: number;
    time: string;
    timezone: string;
    recipients: string[];
    format: 'pdf' | 'excel' | 'csv';
  }) {
    const ctx = getContext();
    
    const nextRun = this.calculateNextRun(schedule);
    
    const [updated] = await db.update(financialReports)
      .set({
        schedule: schedule.frequency,
        scheduleConfig: schedule,
        nextRunAt: nextRun,
        updatedAt: new Date(),
        updatedBy: ctx.user?.id,
      })
      .where(and(
        eq(financialReports.id, reportId),
        eq(financialReports.ventureId, ctx.venture.id)
      ))
      .returning();
    
    return updated;
  }

  /**
   * Export report to various formats
   */
  async exportReport(
    reportType: string, 
    options: ReportOptions, 
    format: 'pdf' | 'excel' | 'csv'
  ) {
    // Generate the report
    let reportData;
    switch (reportType) {
      case 'income_statement':
        reportData = await this.generateIncomeStatement(options);
        break;
      case 'balance_sheet':
        reportData = await this.generateBalanceSheet(options);
        break;
      case 'cash_flow':
        reportData = await this.generateCashFlowStatement(options);
        break;
      default:
        throw new MCVError('Unknown report type', ErrorCode.VALIDATION_ERROR);
    }
    
    // Convert to requested format
    switch (format) {
      case 'pdf':
        return this.renderToPDF(reportData);
      case 'excel':
        return this.renderToExcel(reportData);
      case 'csv':
        return this.renderToCSV(reportData);
    }
  }

  // Helper methods
  private async resolveDateRange(dateRange: ReportDateRange) {
    if (dateRange.type === 'custom') {
      return {
        startDate: dateRange.startDate!,
        endDate: dateRange.endDate!,
      };
    }
    
    const period = await db.query.fiscalPeriods.findFirst({
      where: eq(fiscalPeriods.id, dateRange.periodId!),
    });
    
    if (!period) {
      throw new MCVError('Fiscal period not found', ErrorCode.NOT_FOUND);
    }
    
    return {
      startDate: period.startDate,
      endDate: period.endDate,
    };
  }

  private async getAccountBalances(params: {
    ventureId: string;
    accountTypes: string[];
    startDate?: Date;
    endDate?: Date;
    asOfDate?: Date;
    departmentIds?: string[];
  }) {
    // Query account balances based on parameters
    return [];
  }

  private formatAccountRows(accounts: any[], options: ReportOptions, comparison?: any) {
    return accounts
      .filter(acc => options.showZeroBalances || !new Decimal(acc.balance).isZero())
      .map(acc => ({
        code: acc.code,
        name: acc.name,
        balance: this.formatAmount(new Decimal(acc.balance), options),
        priorBalance: comparison?.[acc.id]?.balance,
        variance: comparison 
          ? new Decimal(acc.balance).minus(comparison[acc.id]?.balance ?? 0).toString()
          : null,
      }));
  }

  private formatAmount(amount: Decimal, options: ReportOptions) {
    if (options.roundToNearest && options.roundToNearest > 1) {
      return amount.div(options.roundToNearest).round().times(options.roundToNearest).toString();
    }
    return amount.toString();
  }

  private calculateSubtotal(accounts: any[]) {
    return accounts.reduce((sum, acc) => sum.plus(acc.balance), new Decimal(0)).toString();
  }

  private groupExpensesBySubtype(accounts: any[], options: ReportOptions, comparison?: any) {
    const groups = new Map<string, any[]>();
    
    for (const acc of accounts) {
      const subtype = acc.subtype || 'Other';
      if (!groups.has(subtype)) {
        groups.set(subtype, []);
      }
      groups.get(subtype)!.push(acc);
    }
    
    return Array.from(groups.entries()).map(([subtype, accs]) => ({
      title: this.formatSubtypeTitle(subtype),
      accounts: this.formatAccountRows(accs, options, comparison),
      subtotal: this.calculateSubtotal(accs),
    }));
  }

  private formatSubtypeTitle(subtype: string) {
    return subtype.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  }

  private isCurrentAsset(account: any) {
    return ['cash', 'accounts_receivable', 'inventory', 'prepaid'].includes(account.subtype);
  }

  private isCurrentLiability(account: any) {
    return ['accounts_payable', 'accrued', 'deferred_revenue'].includes(account.subtype);
  }

  private async calculateRetainedEarnings(ventureId: string, asOfDate: Date) {
    // Calculate cumulative net income
    return new Decimal(0);
  }

  private async getCashTransactions(ventureId: string, startDate: Date, endDate: Date) {
    return [];
  }

  private async getCashBalance(ventureId: string, date: Date) {
    return new Decimal(0);
  }

  private categorizeOperatingActivities(transactions: any[]) {
    return [];
  }

  private categorizeInvestingActivities(transactions: any[]) {
    return [];
  }

  private categorizeFinancingActivities(transactions: any[]) {
    return [];
  }

  private async getComparisonData(options: ReportOptions, reportType: string) {
    return null;
  }

  private calculateNextRun(schedule: any) {
    return new Date();
  }

  private async renderToPDF(data: any) {
    // PDF generation
    return null;
  }

  private async renderToExcel(data: any) {
    // Excel generation
    return null;
  }

  private async renderToCSV(data: any) {
    // CSV generation
    return null;
  }
}

export const reportingService = new ReportingService();
```

---

## Module: billing

### Purpose

Manages customer invoicing, subscription billing, recurring charges, and payment collection.

### Database Schema

```typescript
// @mcv/finance/billing/schema.ts
import { pgTable, uuid, text, numeric, timestamp, boolean, jsonb, integer, pgEnum } from 'drizzle-orm/pg-core';
import { baseColumns } from '@mcv/kernel/db';

export const invoiceStatusEnum = pgEnum('invoice_status', [
  'draft', 'sent', 'viewed', 'partial', 'paid', 'overdue', 'void', 'uncollectible'
]);

export const subscriptionStatusEnum = pgEnum('subscription_status', [
  'trialing', 'active', 'past_due', 'paused', 'cancelled', 'expired'
]);

export const invoices = pgTable('finance_invoices', {
  ...baseColumns,
  invoiceNumber: text('invoice_number').notNull(),
  customerId: uuid('customer_id').notNull(),
  subscriptionId: uuid('subscription_id'),
  status: invoiceStatusEnum('status').default('draft'),
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
  accountId: uuid('account_id'),
  periodStart: timestamp('period_start'),
  periodEnd: timestamp('period_end'),
  metadata: jsonb('metadata'),
});

export const subscriptions = pgTable('finance_subscriptions', {
  ...baseColumns,
  subscriptionNumber: text('subscription_number').notNull(),
  customerId: uuid('customer_id').notNull(),
  planId: uuid('plan_id').notNull(),
  status: subscriptionStatusEnum('status').default('active'),
  currency: text('currency').default('USD'),
  quantity: integer('quantity').default(1),
  unitAmount: numeric('unit_amount', { precision: 19, scale: 4 }).notNull(),
  totalAmount: numeric('total_amount', { precision: 19, scale: 4 }).notNull(),
  interval: text('interval').notNull(), // day, week, month, year
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
  billingCycleAnchor: integer('billing_cycle_anchor'),
  collectionMethod: text('collection_method').default('charge_automatically'),
  daysUntilDue: integer('days_until_due'),
  prorationBehavior: text('proration_behavior').default('create_prorations'),
  metadata: jsonb('metadata'),
});

export const subscriptionItems = pgTable('finance_subscription_items', {
  ...baseColumns,
  subscriptionId: uuid('subscription_id').references(() => subscriptions.id).notNull(),
  priceId: uuid('price_id').notNull(),
  productId: uuid('product_id'),
  quantity: integer('quantity').default(1),
  unitAmount: numeric('unit_amount', { precision: 19, scale: 4 }).notNull(),
  metadata: jsonb('metadata'),
});

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
  frequency: text('frequency').notNull(), // weekly, biweekly, monthly
  startDate: timestamp('start_date').notNull(),
  nextPaymentDate: timestamp('next_payment_date'),
  status: text('status').default('active'),
  metadata: jsonb('metadata'),
});

export const scheduledPayments = pgTable('finance_scheduled_payments', {
  ...baseColumns,
  scheduleId: uuid('schedule_id').references(() => paymentSchedules.id).notNull(),
  paymentNumber: integer('payment_number').notNull(),
  amount: numeric('amount', { precision: 19, scale: 4 }).notNull(),
  dueDate: timestamp('due_date').notNull(),
  status: text('status').default('scheduled'), // scheduled, pending, paid, failed, skipped
  paidAt: timestamp('paid_at'),
  paymentId: uuid('payment_id'),
  retryCount: integer('retry_count').default(0),
  lastRetryAt: timestamp('last_retry_at'),
  failureReason: text('failure_reason'),
});

export const creditNotes = pgTable('finance_credit_notes', {
  ...baseColumns,
  creditNoteNumber: text('credit_note_number').notNull(),
  invoiceId: uuid('invoice_id').references(() => invoices.id),
  customerId: uuid('customer_id').notNull(),
  status: text('status').default('issued'), // issued, applied, void
  amount: numeric('amount', { precision: 19, scale: 4 }).notNull(),
  remainingAmount: numeric('remaining_amount', { precision: 19, scale: 4 }),
  reason: text('reason').notNull(),
  memo: text('memo'),
  issuedAt: timestamp('issued_at').notNull(),
  appliedAt: timestamp('applied_at'),
  voidedAt: timestamp('voided_at'),
  metadata: jsonb('metadata'),
});

export const dunningRules = pgTable('finance_dunning_rules', {
  ...baseColumns,
  name: text('name').notNull(),
  description: text('description'),
  isDefault: boolean('is_default').default(false),
  isActive: boolean('is_active').default(true),
  steps: jsonb('steps').notNull(),
  /*
    steps: [
      { daysOverdue: 1, action: 'email', template: 'payment_reminder' },
      { daysOverdue: 7, action: 'email', template: 'payment_reminder_2' },
      { daysOverdue: 14, action: 'sms', template: 'payment_urgent' },
      { daysOverdue: 30, action: 'pause_subscription' },
      { daysOverdue: 60, action: 'cancel_subscription' },
    ]
  */
  maxRetries: integer('max_retries').default(4),
  retrySchedule: jsonb('retry_schedule'),
});
```

### Service Implementation

```typescript
// @mcv/finance/billing/service.ts
import { db } from '@mcv/kernel';
import { eq, and, sql, desc, lte, isNull, or } from 'drizzle-orm';
import { 
  invoices, invoiceLineItems, subscriptions, subscriptionItems,
  billingPlans, paymentSchedules, scheduledPayments, creditNotes
} from './schema';
import { MCVError, ErrorCode } from '@mcv/kernel/errors';
import { getContext } from '@mcv/kernel/context';
import { accountingService } from '../accounting/service';
import Decimal from 'decimal.js';

export interface CreateInvoiceInput {
  customerId: string;
  invoiceDate?: Date;
  dueDate?: Date;
  paymentTerms?: string;
  currency?: string;
  lineItems: InvoiceLineItemInput[];
  memo?: string;
  footer?: string;
  billingAddress?: any;
  shippingAddress?: any;
}

export interface InvoiceLineItemInput {
  productId?: string;
  description: string;
  quantity?: number;
  unitPrice: string;
  taxable?: boolean;
  taxRate?: number;
  discountPercent?: number;
  accountId?: string;
  periodStart?: Date;
  periodEnd?: Date;
}

export interface CreateSubscriptionInput {
  customerId: string;
  planId: string;
  quantity?: number;
  startDate?: Date;
  trialDays?: number;
  couponCode?: string;
  paymentMethodId?: string;
  collectionMethod?: 'charge_automatically' | 'send_invoice';
}

export class BillingService {
  /**
   * Create a new invoice
   */
  async createInvoice(input: CreateInvoiceInput) {
    const ctx = getContext();
    
    // Calculate line items
    let subtotal = new Decimal(0);
    let totalTax = new Decimal(0);
    let totalDiscount = new Decimal(0);
    
    const processedLines = input.lineItems.map((item, index) => {
      const quantity = new Decimal(item.quantity ?? 1);
      const unitPrice = new Decimal(item.unitPrice);
      let lineAmount = quantity.times(unitPrice);
      
      // Apply discount
      let discountAmount = new Decimal(0);
      if (item.discountPercent) {
        discountAmount = lineAmount.times(item.discountPercent).div(100);
        lineAmount = lineAmount.minus(discountAmount);
        totalDiscount = totalDiscount.plus(discountAmount);
      }
      
      // Calculate tax
      let taxAmount = new Decimal(0);
      if (item.taxable !== false && item.taxRate) {
        taxAmount = lineAmount.times(item.taxRate).div(100);
        totalTax = totalTax.plus(taxAmount);
      }
      
      subtotal = subtotal.plus(lineAmount);
      
      return {
        lineNumber: index + 1,
        productId: item.productId,
        description: item.description,
        quantity: quantity.toString(),
        unitPrice: item.unitPrice,
        amount: lineAmount.toString(),
        taxable: item.taxable ?? true,
        taxRate: item.taxRate?.toString(),
        taxAmount: taxAmount.toString(),
        discountPercent: item.discountPercent?.toString(),
        discountAmount: discountAmount.toString(),
        accountId: item.accountId,
        periodStart: item.periodStart,
        periodEnd: item.periodEnd,
      };
    });
    
    const totalAmount = subtotal.plus(totalTax);
    
    // Calculate due date from payment terms
    const invoiceDate = input.invoiceDate ?? new Date();
    const dueDate = input.dueDate ?? this.calculateDueDate(invoiceDate, input.paymentTerms);
    
    // Generate invoice number
    const invoiceNumber = await this.generateInvoiceNumber();
    
    return db.transaction(async (tx) => {
      const [invoice] = await tx.insert(invoices).values({
        ventureId: ctx.venture.id,
        invoiceNumber,
        customerId: input.customerId,
        status: 'draft',
        invoiceDate,
        dueDate,
        currency: input.currency ?? 'USD',
        subtotal: subtotal.toString(),
        taxAmount: totalTax.toString(),
        discountAmount: totalDiscount.toString(),
        totalAmount: totalAmount.toString(),
        amountDue: totalAmount.toString(),
        billingAddress: input.billingAddress,
        shippingAddress: input.shippingAddress,
        paymentTerms: input.paymentTerms ?? 'net_30',
        memo: input.memo,
        footer: input.footer,
        createdBy: ctx.user?.id,
      }).returning();
      
      // Create line items
      const lines = await Promise.all(
        processedLines.map(line =>
          tx.insert(invoiceLineItems).values({
            ventureId: ctx.venture.id,
            invoiceId: invoice.id,
            ...line,
            createdBy: ctx.user?.id,
          }).returning()
        )
      );
      
      return { invoice, lineItems: lines.map(l => l[0]) };
    });
  }

  /**
   * Send an invoice to customer
   */
  async sendInvoice(invoiceId: string) {
    const ctx = getContext();
    
    const invoice = await db.query.invoices.findFirst({
      where: and(
        eq(invoices.id, invoiceId),
        eq(invoices.ventureId, ctx.venture.id)
      ),
      with: { lineItems: true, customer: true },
    });
    
    if (!invoice) {
      throw new MCVError('Invoice not found', ErrorCode.NOT_FOUND);
    }
    
    if (invoice.status !== 'draft') {
      throw new MCVError('Invoice has already been sent', ErrorCode.BUSINESS_RULE_VIOLATION);
    }
    
    // Generate PDF
    const pdfUrl = await this.generateInvoicePDF(invoice);
    
    // Send email to customer
    await this.sendInvoiceEmail(invoice, pdfUrl);
    
    const [updated] = await db.update(invoices)
      .set({
        status: 'sent',
        sentAt: new Date(),
        pdfUrl,
        updatedAt: new Date(),
        updatedBy: ctx.user?.id,
      })
      .where(eq(invoices.id, invoiceId))
      .returning();
    
    // Create journal entry (Debit AR, Credit Revenue)
    await this.createInvoiceJournalEntry(updated);
    
    return updated;
  }

  /**
   * Record a payment against an invoice
   */
  async recordPayment(invoiceId: string, input: {
    amount: string;
    paymentDate?: Date;
    paymentMethod: string;
    reference?: string;
    notes?: string;
  }) {
    const ctx = getContext();
    
    const invoice = await db.query.invoices.findFirst({
      where: and(
        eq(invoices.id, invoiceId),
        eq(invoices.ventureId, ctx.venture.id)
      ),
    });
    
    if (!invoice) {
      throw new MCVError('Invoice not found', ErrorCode.NOT_FOUND);
    }
    
    const paymentAmount = new Decimal(input.amount);
    const currentPaid = new Decimal(invoice.amountPaid ?? 0);
    const amountDue = new Decimal(invoice.totalAmount).minus(currentPaid);
    
    if (paymentAmount.gt(amountDue)) {
      throw new MCVError(
        `Payment amount exceeds amount due. Due: ${amountDue}`,
        ErrorCode.VALIDATION_ERROR
      );
    }
    
    const newAmountPaid = currentPaid.plus(paymentAmount);
    const newAmountDue = new Decimal(invoice.totalAmount).minus(newAmountPaid);
    const isPaidInFull = newAmountDue.lte(0);
    
    const [updated] = await db.update(invoices)
      .set({
        amountPaid: newAmountPaid.toString(),
        amountDue: newAmountDue.toString(),
        status: isPaidInFull ? 'paid' : 'partial',
        paidAt: isPaidInFull ? new Date() : null,
        updatedAt: new Date(),
        updatedBy: ctx.user?.id,
      })
      .where(eq(invoices.id, invoiceId))
      .returning();
    
    // Create payment journal entry (Debit Cash, Credit AR)
    await this.createPaymentJournalEntry(updated, input);
    
    return updated;
  }

  /**
   * Create a subscription
   */
  async createSubscription(input: CreateSubscriptionInput) {
    const ctx = getContext();
    
    // Get plan details
    const plan = await db.query.billingPlans.findFirst({
      where: and(
        eq(billingPlans.id, input.planId),
        eq(billingPlans.ventureId, ctx.venture.id),
        eq(billingPlans.isActive, true)
      ),
    });
    
    if (!plan) {
      throw new MCVError('Billing plan not found', ErrorCode.NOT_FOUND);
    }
    
    const quantity = input.quantity ?? 1;
    const startDate = input.startDate ?? new Date();
    const unitAmount = new Decimal(plan.amount);
    const totalAmount = unitAmount.times(quantity);
    
    // Calculate trial period
    let trialStart = null;
    let trialEnd = null;
    const trialDays = input.trialDays ?? plan.trialPeriodDays;
    
    if (trialDays && trialDays > 0) {
      trialStart = startDate;
      trialEnd = new Date(startDate.getTime() + trialDays * 24 * 60 * 60 * 1000);
    }
    
    // Calculate billing period
    const periodStart = trialEnd ?? startDate;
    const periodEnd = this.addInterval(periodStart, plan.interval, plan.intervalCount ?? 1);
    
    // Generate subscription number
    const subscriptionNumber = await this.generateSubscriptionNumber();
    
    return db.transaction(async (tx) => {
      const [subscription] = await tx.insert(subscriptions).values({
        ventureId: ctx.venture.id,
        subscriptionNumber,
        customerId: input.customerId,
        planId: input.planId,
        status: trialDays ? 'trialing' : 'active',
        currency: plan.currency,
        quantity,
        unitAmount: unitAmount.toString(),
        totalAmount: totalAmount.toString(),
        interval: plan.interval,
        intervalCount: plan.intervalCount ?? 1,
        anchorDate: startDate,
        currentPeriodStart: periodStart,
        currentPeriodEnd: periodEnd,
        trialStart,
        trialEnd,
        defaultPaymentMethodId: input.paymentMethodId,
        collectionMethod: input.collectionMethod ?? 'charge_automatically',
        createdBy: ctx.user?.id,
      }).returning();
      
      // Create subscription item
      await tx.insert(subscriptionItems).values({
        ventureId: ctx.venture.id,
        subscriptionId: subscription.id,
        priceId: plan.id,
        productId: plan.productId,
        quantity,
        unitAmount: unitAmount.toString(),
        createdBy: ctx.user?.id,
      });
      
      // If no trial, create first invoice
      if (!trialDays && input.collectionMethod !== 'send_invoice') {
        await this.createSubscriptionInvoice(subscription);
      }
      
      return subscription;
    });
  }

  /**
   * Update subscription (change plan or quantity)
   */
  async updateSubscription(subscriptionId: string, input: {
    planId?: string;
    quantity?: number;
    prorationBehavior?: 'create_prorations' | 'none' | 'always_invoice';
  }) {
    const ctx = getContext();
    
    const subscription = await db.query.subscriptions.findFirst({
      where: and(
        eq(subscriptions.id, subscriptionId),
        eq(subscriptions.ventureId, ctx.venture.id)
      ),
      with: { items: true },
    });
    
    if (!subscription) {
      throw new MCVError('Subscription not found', ErrorCode.NOT_FOUND);
    }
    
    if (!['active', 'trialing'].includes(subscription.status)) {
      throw new MCVError('Subscription is not active', ErrorCode.BUSINESS_RULE_VIOLATION);
    }
    
    const updates: any = {};
    let proration = null;
    
    if (input.quantity !== undefined && input.quantity !== subscription.quantity) {
      // Calculate proration for quantity change
      if (input.prorationBehavior !== 'none') {
        proration = this.calculateProration(
          subscription,
          subscription.unitAmount,
          input.quantity
        );
      }
      
      updates.quantity = input.quantity;
      updates.totalAmount = new Decimal(subscription.unitAmount).times(input.quantity).toString();
    }
    
    if (input.planId && input.planId !== subscription.planId) {
      const newPlan = await db.query.billingPlans.findFirst({
        where: eq(billingPlans.id, input.planId),
      });
      
      if (!newPlan) {
        throw new MCVError('Plan not found', ErrorCode.NOT_FOUND);
      }
      
      // Calculate proration for plan change
      if (input.prorationBehavior !== 'none') {
        proration = this.calculateProration(
          subscription,
          newPlan.amount,
          input.quantity ?? subscription.quantity
        );
      }
      
      updates.planId = input.planId;
      updates.unitAmount = newPlan.amount;
      updates.totalAmount = new Decimal(newPlan.amount).times(input.quantity ?? subscription.quantity).toString();
      updates.interval = newPlan.interval;
      updates.intervalCount = newPlan.intervalCount;
    }
    
    if (Object.keys(updates).length === 0) {
      return subscription;
    }
    
    updates.updatedAt = new Date();
    updates.updatedBy = ctx.user?.id;
    
    const [updated] = await db.update(subscriptions)
      .set(updates)
      .where(eq(subscriptions.id, subscriptionId))
      .returning();
    
    // Create proration invoice if needed
    if (proration && input.prorationBehavior === 'always_invoice') {
      await this.createProrationInvoice(subscription, proration);
    }
    
    return updated;
  }

  /**
   * Cancel a subscription
   */
  async cancelSubscription(subscriptionId: string, input: {
    cancelAtPeriodEnd?: boolean;
    reason?: string;
  }) {
    const ctx = getContext();
    
    const subscription = await db.query.subscriptions.findFirst({
      where: and(
        eq(subscriptions.id, subscriptionId),
        eq(subscriptions.ventureId, ctx.venture.id)
      ),
    });
    
    if (!subscription) {
      throw new MCVError('Subscription not found', ErrorCode.NOT_FOUND);
    }
    
    if (subscription.status === 'cancelled') {
      throw new MCVError('Subscription is already cancelled', ErrorCode.BUSINESS_RULE_VIOLATION);
    }
    
    const updates: any = {
      cancellationReason: input.reason,
      updatedAt: new Date(),
      updatedBy: ctx.user?.id,
    };
    
    if (input.cancelAtPeriodEnd) {
      updates.cancelAtPeriodEnd = true;
    } else {
      updates.status = 'cancelled';
      updates.cancelledAt = new Date();
    }
    
    const [updated] = await db.update(subscriptions)
      .set(updates)
      .where(eq(subscriptions.id, subscriptionId))
      .returning();
    
    return updated;
  }

  /**
   * Process subscription renewals (run by cron job)
   */
  async processRenewals() {
    const ctx = getContext();
    
    // Find subscriptions that need renewal
    const dueForRenewal = await db.query.subscriptions.findMany({
      where: and(
        eq(subscriptions.ventureId, ctx.venture.id),
        eq(subscriptions.status, 'active'),
        lte(subscriptions.currentPeriodEnd, new Date()),
        or(
          eq(subscriptions.cancelAtPeriodEnd, false),
          isNull(subscriptions.cancelAtPeriodEnd)
        )
      ),
    });
    
    const results = {
      processed: 0,
      succeeded: 0,
      failed: 0,
      cancelled: 0,
    };
    
    for (const subscription of dueForRenewal) {
      results.processed++;
      
      try {
        if (subscription.cancelAtPeriodEnd) {
          // Cancel the subscription
          await this.cancelSubscription(subscription.id, { reason: 'End of period' });
          results.cancelled++;
          continue;
        }
        
        // Create renewal invoice
        const invoice = await this.createSubscriptionInvoice(subscription);
        
        // Attempt payment if auto-charge
        if (subscription.collectionMethod === 'charge_automatically') {
          await this.chargeInvoice(invoice.id);
        }
        
        // Update subscription period
        const newPeriodStart = subscription.currentPeriodEnd;
        const newPeriodEnd = this.addInterval(
          newPeriodStart, 
          subscription.interval, 
          subscription.intervalCount
        );
        
        await db.update(subscriptions)
          .set({
            currentPeriodStart: newPeriodStart,
            currentPeriodEnd: newPeriodEnd,
            updatedAt: new Date(),
          })
          .where(eq(subscriptions.id, subscription.id));
        
        results.succeeded++;
      } catch (error) {
        results.failed++;
        // Handle failed payment - trigger dunning
        await this.handleFailedPayment(subscription);
      }
    }
    
    return results;
  }

  /**
   * Issue a credit note
   */
  async issueCreditNote(input: {
    invoiceId?: string;
    customerId: string;
    amount: string;
    reason: string;
    memo?: string;
  }) {
    const ctx = getContext();
    
    const creditNoteNumber = await this.generateCreditNoteNumber();
    
    const [creditNote] = await db.insert(creditNotes).values({
      ventureId: ctx.venture.id,
      creditNoteNumber,
      invoiceId: input.invoiceId,
      customerId: input.customerId,
      status: 'issued',
      amount: input.amount,
      remainingAmount: input.amount,
      reason: input.reason,
      memo: input.memo,
      issuedAt: new Date(),
      createdBy: ctx.user?.id,
    }).returning();
    
    // Create journal entry (Debit Revenue, Credit AR)
    await this.createCreditNoteJournalEntry(creditNote);
    
    return creditNote;
  }

  /**
   * Apply credit note to an invoice
   */
  async applyCreditNote(creditNoteId: string, invoiceId: string, amount?: string) {
    const ctx = getContext();
    
    const creditNote = await db.query.creditNotes.findFirst({
      where: and(
        eq(creditNotes.id, creditNoteId),
        eq(creditNotes.ventureId, ctx.venture.id),
        eq(creditNotes.status, 'issued')
      ),
    });
    
    if (!creditNote) {
      throw new MCVError('Credit note not found or already applied', ErrorCode.NOT_FOUND);
    }
    
    const invoice = await db.query.invoices.findFirst({
      where: and(
        eq(invoices.id, invoiceId),
        eq(invoices.customerId, creditNote.customerId)
      ),
    });
    
    if (!invoice) {
      throw new MCVError('Invoice not found', ErrorCode.NOT_FOUND);
    }
    
    const applyAmount = amount 
      ? new Decimal(amount) 
      : Decimal.min(creditNote.remainingAmount ?? 0, invoice.amountDue ?? 0);
    
    if (applyAmount.gt(creditNote.remainingAmount ?? 0)) {
      throw new MCVError('Amount exceeds credit note balance', ErrorCode.VALIDATION_ERROR);
    }
    
    return db.transaction(async (tx) => {
      // Update credit note
      const newRemainingAmount = new Decimal(creditNote.remainingAmount ?? 0).minus(applyAmount);
      await tx.update(creditNotes)
        .set({
          remainingAmount: newRemainingAmount.toString(),
          status: newRemainingAmount.lte(0) ? 'applied' : 'issued',
          appliedAt: newRemainingAmount.lte(0) ? new Date() : null,
          updatedAt: new Date(),
        })
        .where(eq(creditNotes.id, creditNoteId));
      
      // Apply to invoice
      await this.recordPayment(invoiceId, {
        amount: applyAmount.toString(),
        paymentMethod: 'credit_note',
        reference: creditNote.creditNoteNumber,
        notes: `Applied credit note ${creditNote.creditNoteNumber}`,
      });
      
      return { creditNote, invoice, appliedAmount: applyAmount.toString() };
    });
  }

  /**
   * Create payment schedule for an invoice
   */
  async createPaymentSchedule(invoiceId: string, input: {
    numberOfPayments: number;
    frequency: 'weekly' | 'biweekly' | 'monthly';
    startDate: Date;
  }) {
    const ctx = getContext();
    
    const invoice = await db.query.invoices.findFirst({
      where: and(
        eq(invoices.id, invoiceId),
        eq(invoices.ventureId, ctx.venture.id)
      ),
    });
    
    if (!invoice) {
      throw new MCVError('Invoice not found', ErrorCode.NOT_FOUND);
    }
    
    const totalAmount = new Decimal(invoice.amountDue ?? invoice.totalAmount);
    const paymentAmount = totalAmount.div(input.numberOfPayments).toDecimalPlaces(2);
    
    return db.transaction(async (tx) => {
      const [schedule] = await tx.insert(paymentSchedules).values({
        ventureId: ctx.venture.id,
        invoiceId,
        customerId: invoice.customerId,
        totalAmount: totalAmount.toString(),
        remainingAmount: totalAmount.toString(),
        numberOfPayments: input.numberOfPayments,
        frequency: input.frequency,
        startDate: input.startDate,
        nextPaymentDate: input.startDate,
        status: 'active',
        createdBy: ctx.user?.id,
      }).returning();
      
      // Create scheduled payments
      let currentDate = new Date(input.startDate);
      
      for (let i = 1; i <= input.numberOfPayments; i++) {
        // Last payment gets any rounding difference
        const amount = i === input.numberOfPayments
          ? totalAmount.minus(paymentAmount.times(input.numberOfPayments - 1))
          : paymentAmount;
        
        await tx.insert(scheduledPayments).values({
          ventureId: ctx.venture.id,
          scheduleId: schedule.id,
          paymentNumber: i,
          amount: amount.toString(),
          dueDate: currentDate,
          status: 'scheduled',
          createdBy: ctx.user?.id,
        });
        
        // Calculate next date
        currentDate = this.addScheduleInterval(currentDate, input.frequency);
      }
      
      return schedule;
    });
  }

  // Helper methods
  private calculateDueDate(invoiceDate: Date, paymentTerms?: string): Date {
    const terms = paymentTerms ?? 'net_30';
    const days = parseInt(terms.replace('net_', '')) || 30;
    return new Date(invoiceDate.getTime() + days * 24 * 60 * 60 * 1000);
  }

  private addInterval(date: Date, interval: string, count: number): Date {
    const result = new Date(date);
    switch (interval) {
      case 'day':
        result.setDate(result.getDate() + count);
        break;
      case 'week':
        result.setDate(result.getDate() + count * 7);
        break;
      case 'month':
        result.setMonth(result.getMonth() + count);
        break;
      case 'year':
        result.setFullYear(result.getFullYear() + count);
        break;
    }
    return result;
  }

  private addScheduleInterval(date: Date, frequency: string): Date {
    const result = new Date(date);
    switch (frequency) {
      case 'weekly':
        result.setDate(result.getDate() + 7);
        break;
      case 'biweekly':
        result.setDate(result.getDate() + 14);
        break;
      case 'monthly':
        result.setMonth(result.getMonth() + 1);
        break;
    }
    return result;
  }

  private calculateProration(subscription: any, newUnitAmount: string, newQuantity: number) {
    const now = new Date();
    const periodStart = new Date(subscription.currentPeriodStart);
    const periodEnd = new Date(subscription.currentPeriodEnd);
    
    const totalDays = Math.ceil((periodEnd.getTime() - periodStart.getTime()) / (24 * 60 * 60 * 1000));
    const remainingDays = Math.ceil((periodEnd.getTime() - now.getTime()) / (24 * 60 * 60 * 1000));
    
    const oldDailyRate = new Decimal(subscription.totalAmount).div(totalDays);
    const newDailyRate = new Decimal(newUnitAmount).times(newQuantity).div(totalDays);
    
    const creditAmount = oldDailyRate.times(remainingDays);
    const chargeAmount = newDailyRate.times(remainingDays);
    const netAmount = chargeAmount.minus(creditAmount);
    
    return {
      creditAmount: creditAmount.toString(),
      chargeAmount: chargeAmount.toString(),
      netAmount: netAmount.toString(),
      remainingDays,
    };
  }

  private async generateInvoiceNumber(): Promise<string> {
    const ctx = getContext();
    const year = new Date().getFullYear();
    
    const count = await db.execute(sql`
      SELECT COUNT(*) FROM finance_invoices
      WHERE venture_id = ${ctx.venture.id}
        AND invoice_number LIKE ${`INV-${year}-%`}
    `);
    
    const sequence = parseInt(count.rows[0].count) + 1;
    return `INV-${year}-${sequence.toString().padStart(6, '0')}`;
  }

  private async generateSubscriptionNumber(): Promise<string> {
    const ctx = getContext();
    const count = await db.execute(sql`
      SELECT COUNT(*) FROM finance_subscriptions
      WHERE venture_id = ${ctx.venture.id}
    `);
    
    const sequence = parseInt(count.rows[0].count) + 1;
    return `SUB-${sequence.toString().padStart(8, '0')}`;
  }

  private async generateCreditNoteNumber(): Promise<string> {
    const ctx = getContext();
    const year = new Date().getFullYear();
    
    const count = await db.execute(sql`
      SELECT COUNT(*) FROM finance_credit_notes
      WHERE venture_id = ${ctx.venture.id}
        AND credit_note_number LIKE ${`CN-${year}-%`}
    `);
    
    const sequence = parseInt(count.rows[0].count) + 1;
    return `CN-${year}-${sequence.toString().padStart(6, '0')}`;
  }

  private async generateInvoicePDF(invoice: any): Promise<string> {
    // PDF generation logic
    return '';
  }

  private async sendInvoiceEmail(invoice: any, pdfUrl: string) {
    // Email sending logic
  }

  private async createInvoiceJournalEntry(invoice: any) {
    // Create accounting entry
  }

  private async createPaymentJournalEntry(invoice: any, payment: any) {
    // Create accounting entry for payment
  }

  private async createCreditNoteJournalEntry(creditNote: any) {
    // Create accounting entry for credit note
  }

  private async createSubscriptionInvoice(subscription: any) {
    // Create invoice for subscription period
    return {} as any;
  }

  private async createProrationInvoice(subscription: any, proration: any) {
    // Create invoice for proration
  }

  private async chargeInvoice(invoiceId: string) {
    // Charge customer's payment method
  }

  private async handleFailedPayment(subscription: any) {
    // Trigger dunning process
  }
}

export const billingService = new BillingService();
```

---

## Module: integrations

### Purpose

Provides bidirectional sync with external accounting platforms like QuickBooks, Xero, and bank feeds for automatic reconciliation.

### Database Schema

```typescript
// @mcv/finance/integrations/schema.ts
import { pgTable, uuid, text, timestamp, boolean, jsonb, pgEnum } from 'drizzle-orm/pg-core';
import { baseColumns } from '@mcv/kernel/db';

export const integrationProviderEnum = pgEnum('integration_provider', [
  'quickbooks_online', 'quickbooks_desktop', 'xero', 'sage', 
  'freshbooks', 'wave', 'plaid', 'yodlee', 'stripe', 'paypal'
]);

export const syncDirectionEnum = pgEnum('sync_direction', [
  'push', 'pull', 'bidirectional'
]);

export const accountingIntegrations = pgTable('finance_integrations', {
  ...baseColumns,
  name: text('name').notNull(),
  provider: integrationProviderEnum('provider').notNull(),
  status: text('status').default('disconnected'), // disconnected, connected, error, syncing
  connectionData: jsonb('connection_data'),       // Encrypted OAuth tokens, etc.
  settings: jsonb('settings'),
  /*
    settings: {
      syncDirection: 'bidirectional',
      syncFrequency: 'hourly',
      autoSync: true,
      syncEntities: ['accounts', 'invoices', 'bills', 'payments'],
      mappings: {
        accounts: { 'local_id': 'external_id' },
      },
      defaultAccounts: {
        income: 'external_account_id',
        expense: 'external_account_id',
      }
    }
  */
  lastSyncAt: timestamp('last_sync_at'),
  lastSyncStatus: text('last_sync_status'),
  lastError: text('last_error'),
  connectedAt: timestamp('connected_at'),
  connectedBy: uuid('connected_by'),
  externalCompanyId: text('external_company_id'),
  externalCompanyName: text('external_company_name'),
});

export const integrationMappings = pgTable('finance_integration_mappings', {
  ...baseColumns,
  integrationId: uuid('integration_id').references(() => accountingIntegrations.id).notNull(),
  entityType: text('entity_type').notNull(),       // account, customer, vendor, item, tax_code
  localId: uuid('local_id').notNull(),
  externalId: text('external_id').notNull(),
  externalData: jsonb('external_data'),
  lastSyncedAt: timestamp('last_synced_at'),
  syncStatus: text('sync_status').default('synced'), // synced, pending, error
  syncError: text('sync_error'),
});

export const integrationSyncLogs = pgTable('finance_integration_sync_logs', {
  ...baseColumns,
  integrationId: uuid('integration_id').references(() => accountingIntegrations.id).notNull(),
  syncType: text('sync_type').notNull(),           // full, incremental, entity
  direction: syncDirectionEnum('direction').notNull(),
  status: text('status').default('pending'),       // pending, running, completed, failed
  startedAt: timestamp('started_at'),
  completedAt: timestamp('completed_at'),
  entitiesProcessed: jsonb('entities_processed'),
  /*
    entitiesProcessed: {
      accounts: { created: 5, updated: 10, failed: 0 },
      invoices: { created: 20, updated: 5, failed: 1 },
    }
  */
  errors: jsonb('errors'),
  triggeredBy: text('triggered_by'),               // auto, manual, webhook
});

export const bankConnections = pgTable('finance_bank_connections', {
  ...baseColumns,
  name: text('name').notNull(),
  provider: text('provider').notNull(),            // plaid, yodlee, mx
  institutionId: text('institution_id').notNull(),
  institutionName: text('institution_name').notNull(),
  status: text('status').default('connected'),
  accessToken: text('access_token'),               // Encrypted
  itemId: text('item_id'),
  lastRefreshedAt: timestamp('last_refreshed_at'),
  consentExpiresAt: timestamp('consent_expires_at'),
  accounts: jsonb('accounts'),
  /*
    accounts: [
      { 
        accountId: 'plaid_account_id',
        name: 'Checking',
        mask: '1234',
        type: 'depository',
        subtype: 'checking',
        linkedAccountId: 'local_account_id',
      }
    ]
  */
  metadata: jsonb('metadata'),
});

export const bankTransactions = pgTable('finance_bank_transactions', {
  ...baseColumns,
  bankConnectionId: uuid('bank_connection_id').references(() => bankConnections.id).notNull(),
  externalTransactionId: text('external_transaction_id').notNull(),
  accountId: uuid('account_id'),                   // Linked local account
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
  matchConfidence: text('match_confidence'),
  metadata: jsonb('metadata'),
});

export const reconciliations = pgTable('finance_reconciliations', {
  ...baseColumns,
  accountId: uuid('account_id').notNull(),
  statementDate: timestamp('statement_date').notNull(),
  statementBalance: text('statement_balance').notNull(),
  startingBalance: text('starting_balance').notNull(),
  endingBalance: text('ending_balance').notNull(),
  clearedBalance: text('cleared_balance'),
  difference: text('difference'),
  status: text('status').default('in_progress'),  // in_progress, reconciled, discrepancy
  reconciledAt: timestamp('reconciled_at'),
  reconciledBy: uuid('reconciled_by'),
  clearedTransactions: jsonb('cleared_transactions'),
  adjustingEntries: jsonb('adjusting_entries'),
  notes: text('notes'),
});
```

### Service Implementation

```typescript
// @mcv/finance/integrations/service.ts
import { db } from '@mcv/kernel';
import { eq, and, sql, desc, isNull, inArray } from 'drizzle-orm';
import { 
  accountingIntegrations, integrationMappings, integrationSyncLogs,
  bankConnections, bankTransactions, reconciliations
} from './schema';
import { MCVError, ErrorCode } from '@mcv/kernel/errors';
import { getContext } from '@mcv/kernel/context';
import { encrypt, decrypt } from '@mcv/kernel/config/secrets';
import Decimal from 'decimal.js';

export class IntegrationService {
  /**
   * Connect to QuickBooks Online
   */
  async connectQuickBooks(authCode: string, realmId: string) {
    const ctx = getContext();
    
    // Exchange auth code for tokens
    const tokens = await this.exchangeQuickBooksToken(authCode, realmId);
    
    // Get company info
    const companyInfo = await this.getQuickBooksCompanyInfo(tokens.access_token, realmId);
    
    const [integration] = await db.insert(accountingIntegrations).values({
      ventureId: ctx.venture.id,
      name: `QuickBooks - ${companyInfo.CompanyName}`,
      provider: 'quickbooks_online',
      status: 'connected',
      connectionData: {
        accessToken: encrypt(tokens.access_token, this.getEncryptionKey()),
        refreshToken: encrypt(tokens.refresh_token, this.getEncryptionKey()),
        expiresAt: new Date(Date.now() + tokens.expires_in * 1000),
        realmId,
      },
      settings: {
        syncDirection: 'bidirectional',
        syncFrequency: 'hourly',
        autoSync: true,
        syncEntities: ['accounts', 'customers', 'vendors', 'invoices', 'bills', 'payments'],
      },
      connectedAt: new Date(),
      connectedBy: ctx.user?.id,
      externalCompanyId: realmId,
      externalCompanyName: companyInfo.CompanyName,
      createdBy: ctx.user?.id,
    }).returning();
    
    // Initial sync of accounts
    await this.syncQuickBooksAccounts(integration.id);
    
    return integration;
  }

  /**
   * Connect to Xero
   */
  async connectXero(authCode: string) {
    const ctx = getContext();
    
    // Exchange auth code for tokens
    const tokens = await this.exchangeXeroToken(authCode);
    
    // Get tenant (organization)
    const tenants = await this.getXeroTenants(tokens.access_token);
    const tenant = tenants[0]; // Use first tenant
    
    // Get organization info
    const orgInfo = await this.getXeroOrganization(tokens.access_token, tenant.tenantId);
    
    const [integration] = await db.insert(accountingIntegrations).values({
      ventureId: ctx.venture.id,
      name: `Xero - ${orgInfo.Name}`,
      provider: 'xero',
      status: 'connected',
      connectionData: {
        accessToken: encrypt(tokens.access_token, this.getEncryptionKey()),
        refreshToken: encrypt(tokens.refresh_token, this.getEncryptionKey()),
        expiresAt: new Date(Date.now() + tokens.expires_in * 1000),
        tenantId: tenant.tenantId,
      },
      settings: {
        syncDirection: 'bidirectional',
        syncFrequency: 'hourly',
        autoSync: true,
        syncEntities: ['accounts', 'contacts', 'invoices', 'bills', 'payments'],
      },
      connectedAt: new Date(),
      connectedBy: ctx.user?.id,
      externalCompanyId: tenant.tenantId,
      externalCompanyName: orgInfo.Name,
      createdBy: ctx.user?.id,
    }).returning();
    
    // Initial sync
    await this.syncXeroAccounts(integration.id);
    
    return integration;
  }

  /**
   * Sync accounts from external system
   */
  async syncAccounts(integrationId: string) {
    const ctx = getContext();
    
    const integration = await this.getIntegration(integrationId);
    
    switch (integration.provider) {
      case 'quickbooks_online':
        return this.syncQuickBooksAccounts(integrationId);
      case 'xero':
        return this.syncXeroAccounts(integrationId);
      default:
        throw new MCVError('Unsupported provider', ErrorCode.VALIDATION_ERROR);
    }
  }

  /**
   * Push invoice to external system
   */
  async pushInvoice(integrationId: string, invoiceId: string) {
    const ctx = getContext();
    
    const integration = await this.getIntegration(integrationId);
    const invoice = await db.query.invoices.findFirst({
      where: eq(invoices.id, invoiceId),
      with: { lineItems: true, customer: true },
    });
    
    if (!invoice) {
      throw new MCVError('Invoice not found', ErrorCode.NOT_FOUND);
    }
    
    // Check if customer is mapped
    const customerMapping = await this.getMapping(integrationId, 'customer', invoice.customerId);
    if (!customerMapping) {
      // Create customer in external system first
      await this.pushCustomer(integrationId, invoice.customerId);
    }
    
    let externalInvoice;
    switch (integration.provider) {
      case 'quickbooks_online':
        externalInvoice = await this.pushQuickBooksInvoice(integration, invoice);
        break;
      case 'xero':
        externalInvoice = await this.pushXeroInvoice(integration, invoice);
        break;
      default:
        throw new MCVError('Unsupported provider', ErrorCode.VALIDATION_ERROR);
    }
    
    // Save mapping
    await this.createMapping(integrationId, 'invoice', invoiceId, externalInvoice.Id);
    
    return externalInvoice;
  }

  /**
   * Connect bank account via Plaid
   */
  async connectBankWithPlaid(publicToken: string, institutionId: string) {
    const ctx = getContext();
    
    // Exchange public token for access token
    const { access_token, item_id } = await this.exchangePlaidToken(publicToken);
    
    // Get accounts
    const { accounts, institution } = await this.getPlaidAccounts(access_token);
    
    const [connection] = await db.insert(bankConnections).values({
      ventureId: ctx.venture.id,
      name: institution.name,
      provider: 'plaid',
      institutionId,
      institutionName: institution.name,
      status: 'connected',
      accessToken: encrypt(access_token, this.getEncryptionKey()),
      itemId: item_id,
      lastRefreshedAt: new Date(),
      accounts: accounts.map(a => ({
        accountId: a.account_id,
        name: a.name,
        mask: a.mask,
        type: a.type,
        subtype: a.subtype,
        linkedAccountId: null,
      })),
      createdBy: ctx.user?.id,
    }).returning();
    
    return connection;
  }

  /**
   * Link bank account to local GL account
   */
  async linkBankAccount(connectionId: string, externalAccountId: string, localAccountId: string) {
    const ctx = getContext();
    
    const connection = await db.query.bankConnections.findFirst({
      where: and(
        eq(bankConnections.id, connectionId),
        eq(bankConnections.ventureId, ctx.venture.id)
      ),
    });
    
    if (!connection) {
      throw new MCVError('Bank connection not found', ErrorCode.NOT_FOUND);
    }
    
    // Update accounts array with link
    const accounts = (connection.accounts as any[]).map(a => {
      if (a.accountId === externalAccountId) {
        return { ...a, linkedAccountId: localAccountId };
      }
      return a;
    });
    
    const [updated] = await db.update(bankConnections)
      .set({
        accounts,
        updatedAt: new Date(),
        updatedBy: ctx.user?.id,
      })
      .where(eq(bankConnections.id, connectionId))
      .returning();
    
    return updated;
  }

  /**
   * Fetch bank transactions
   */
  async fetchBankTransactions(connectionId: string, startDate: Date, endDate: Date) {
    const ctx = getContext();
    
    const connection = await db.query.bankConnections.findFirst({
      where: and(
        eq(bankConnections.id, connectionId),
        eq(bankConnections.ventureId, ctx.venture.id)
      ),
    });
    
    if (!connection) {
      throw new MCVError('Bank connection not found', ErrorCode.NOT_FOUND);
    }
    
    const accessToken = decrypt(connection.accessToken!, this.getEncryptionKey());
    
    // Fetch transactions from Plaid
    const { transactions } = await this.getPlaidTransactions(
      accessToken,
      startDate,
      endDate
    );
    
    // Store transactions
    const storedTransactions = [];
    
    for (const txn of transactions) {
      // Find linked account
      const linkedAccount = (connection.accounts as any[]).find(
        a => a.accountId === txn.account_id
      );
      
      // Check if transaction already exists
      const existing = await db.query.bankTransactions.findFirst({
        where: and(
          eq(bankTransactions.bankConnectionId, connectionId),
          eq(bankTransactions.externalTransactionId, txn.transaction_id)
        ),
      });
      
      if (existing) {
        // Update pending status if changed
        if (existing.pending !== txn.pending) {
          await db.update(bankTransactions)
            .set({ pending: txn.pending, updatedAt: new Date() })
            .where(eq(bankTransactions.id, existing.id));
        }
        continue;
      }
      
      const [stored] = await db.insert(bankTransactions).values({
        ventureId: ctx.venture.id,
        bankConnectionId: connectionId,
        externalTransactionId: txn.transaction_id,
        accountId: linkedAccount?.linkedAccountId,
        transactionDate: new Date(txn.date),
        postedDate: txn.authorized_date ? new Date(txn.authorized_date) : null,
        amount: txn.amount.toString(),
        currency: txn.iso_currency_code || 'USD',
        name: txn.name,
        merchantName: txn.merchant_name,
        category: txn.category?.join(' > '),
        categoryId: txn.category_id,
        pending: txn.pending,
        transactionType: txn.transaction_type,
        paymentChannel: txn.payment_channel,
        location: txn.location,
        createdBy: ctx.user?.id,
      }).returning();
      
      storedTransactions.push(stored);
    }
    
    // Update last refreshed
    await db.update(bankConnections)
      .set({ lastRefreshedAt: new Date() })
      .where(eq(bankConnections.id, connectionId));
    
    return storedTransactions;
  }

  /**
   * Auto-match bank transactions with GL transactions
   */
  async autoMatchTransactions(accountId: string) {
    const ctx = getContext();
    
    // Get unreconciled bank transactions
    const bankTxns = await db.query.bankTransactions.findMany({
      where: and(
        eq(bankTransactions.ventureId, ctx.venture.id),
        eq(bankTransactions.accountId, accountId),
        eq(bankTransactions.isReconciled, false),
        eq(bankTransactions.pending, false)
      ),
    });
    
    const matches = [];
    
    for (const bankTxn of bankTxns) {
      // Find potential matches in journal entry lines
      const potentialMatches = await db.execute(sql`
        SELECT jel.*, je.entry_date, je.description as entry_description
        FROM finance_journal_entry_lines jel
        JOIN finance_journal_entries je ON jel.journal_entry_id = je.id
        WHERE jel.account_id = ${accountId}
          AND je.status = 'posted'
          AND ABS(
            CASE 
              WHEN jel.debit_amount IS NOT NULL THEN jel.debit_amount
              ELSE -jel.credit_amount
            END - ${bankTxn.amount}
          ) < 0.01
          AND je.entry_date BETWEEN ${new Date(bankTxn.transactionDate.getTime() - 7 * 24 * 60 * 60 * 1000)} 
                                AND ${new Date(bankTxn.transactionDate.getTime() + 7 * 24 * 60 * 60 * 1000)}
          AND NOT EXISTS (
            SELECT 1 FROM finance_bank_transactions bt 
            WHERE bt.matched_transaction_id = jel.id
          )
      `);
      
      if (potentialMatches.rows.length === 1) {
        // High confidence match
        const match = potentialMatches.rows[0];
        
        await db.update(bankTransactions)
          .set({
            matchedTransactionId: match.id,
            matchConfidence: 'high',
            updatedAt: new Date(),
          })
          .where(eq(bankTransactions.id, bankTxn.id));
        
        matches.push({
          bankTransactionId: bankTxn.id,
          matchedLineId: match.id,
          confidence: 'high',
        });
      } else if (potentialMatches.rows.length > 1) {
        // Multiple potential matches - needs manual review
        matches.push({
          bankTransactionId: bankTxn.id,
          potentialMatches: potentialMatches.rows.map(m => m.id),
          confidence: 'low',
        });
      }
    }
    
    return matches;
  }

  /**
   * Reconcile bank transactions
   */
  async reconcile(accountId: string, input: {
    statementDate: Date;
    statementBalance: string;
    clearedTransactionIds: string[];
  }) {
    const ctx = getContext();
    
    // Get starting balance
    const lastReconciliation = await db.query.reconciliations.findFirst({
      where: and(
        eq(reconciliations.ventureId, ctx.venture.id),
        eq(reconciliations.accountId, accountId),
        eq(reconciliations.status, 'reconciled')
      ),
      orderBy: desc(reconciliations.statementDate),
    });
    
    const startingBalance = lastReconciliation?.endingBalance ?? '0';
    
    // Calculate cleared balance
    const clearedTxns = await db.query.bankTransactions.findMany({
      where: inArray(bankTransactions.id, input.clearedTransactionIds),
    });
    
    let clearedBalance = new Decimal(startingBalance);
    for (const txn of clearedTxns) {
      clearedBalance = clearedBalance.plus(txn.amount);
    }
    
    const difference = new Decimal(input.statementBalance).minus(clearedBalance);
    
    return db.transaction(async (tx) => {
      // Create reconciliation record
      const [reconciliation] = await tx.insert(reconciliations).values({
        ventureId: ctx.venture.id,
        accountId,
        statementDate: input.statementDate,
        statementBalance: input.statementBalance,
        startingBalance,
        endingBalance: input.statementBalance,
        clearedBalance: clearedBalance.toString(),
        difference: difference.toString(),
        status: difference.abs().lt(0.01) ? 'reconciled' : 'discrepancy',
        reconciledAt: difference.abs().lt(0.01) ? new Date() : null,
        reconciledBy: difference.abs().lt(0.01) ? ctx.user?.id : null,
        clearedTransactions: input.clearedTransactionIds,
        createdBy: ctx.user?.id,
      }).returning();
      
      // Mark transactions as reconciled
      await tx.update(bankTransactions)
        .set({
          isReconciled: true,
          reconciledAt: new Date(),
          updatedAt: new Date(),
        })
        .where(inArray(bankTransactions.id, input.clearedTransactionIds));
      
      return reconciliation;
    });
  }

  /**
   * Schedule automatic sync
   */
  async scheduleSync(integrationId: string, frequency: 'hourly' | 'daily' | 'weekly') {
    const ctx = getContext();
    
    const [updated] = await db.update(accountingIntegrations)
      .set({
        settings: sql`jsonb_set(${accountingIntegrations.settings}, '{syncFrequency}', ${JSON.stringify(frequency)})`,
        updatedAt: new Date(),
        updatedBy: ctx.user?.id,
      })
      .where(and(
        eq(accountingIntegrations.id, integrationId),
        eq(accountingIntegrations.ventureId, ctx.venture.id)
      ))
      .returning();
    
    return updated;
  }

  /**
   * Run full sync for an integration
   */
  async runFullSync(integrationId: string) {
    const ctx = getContext();
    
    const integration = await this.getIntegration(integrationId);
    
    // Create sync log
    const [syncLog] = await db.insert(integrationSyncLogs).values({
      ventureId: ctx.venture.id,
      integrationId,
      syncType: 'full',
      direction: 'bidirectional',
      status: 'running',
      startedAt: new Date(),
      triggeredBy: 'manual',
      createdBy: ctx.user?.id,
    }).returning();
    
    try {
      const results = {
        accounts: { created: 0, updated: 0, failed: 0 },
        customers: { created: 0, updated: 0, failed: 0 },
        invoices: { created: 0, updated: 0, failed: 0 },
      };
      
      // Sync accounts
      const accountResults = await this.syncAccounts(integrationId);
      results.accounts = accountResults;
      
      // Sync customers/contacts
      const customerResults = await this.syncCustomers(integrationId);
      results.customers = customerResults;
      
      // Sync invoices
      const invoiceResults = await this.syncInvoices(integrationId);
      results.invoices = invoiceResults;
      
      // Update sync log
      await db.update(integrationSyncLogs)
        .set({
          status: 'completed',
          completedAt: new Date(),
          entitiesProcessed: results,
          updatedAt: new Date(),
        })
        .where(eq(integrationSyncLogs.id, syncLog.id));
      
      // Update integration status
      await db.update(accountingIntegrations)
        .set({
          lastSyncAt: new Date(),
          lastSyncStatus: 'success',
          updatedAt: new Date(),
        })
        .where(eq(accountingIntegrations.id, integrationId));
      
      return results;
    } catch (error) {
      // Update sync log with error
      await db.update(integrationSyncLogs)
        .set({
          status: 'failed',
          completedAt: new Date(),
          errors: [{ message: error.message, stack: error.stack }],
          updatedAt: new Date(),
        })
        .where(eq(integrationSyncLogs.id, syncLog.id));
      
      // Update integration status
      await db.update(accountingIntegrations)
        .set({
          lastSyncAt: new Date(),
          lastSyncStatus: 'failed',
          lastError: error.message,
          updatedAt: new Date(),
        })
        .where(eq(accountingIntegrations.id, integrationId));
      
      throw error;
    }
  }

  // Helper methods
  private async getIntegration(integrationId: string) {
    const ctx = getContext();
    
    const integration = await db.query.accountingIntegrations.findFirst({
      where: and(
        eq(accountingIntegrations.id, integrationId),
        eq(accountingIntegrations.ventureId, ctx.venture.id)
      ),
    });
    
    if (!integration) {
      throw new MCVError('Integration not found', ErrorCode.NOT_FOUND);
    }
    
    return integration;
  }

  private async getMapping(integrationId: string, entityType: string, localId: string) {
    return db.query.integrationMappings.findFirst({
      where: and(
        eq(integrationMappings.integrationId, integrationId),
        eq(integrationMappings.entityType, entityType),
        eq(integrationMappings.localId, localId)
      ),
    });
  }

  private async createMapping(integrationId: string, entityType: string, localId: string, externalId: string) {
    const ctx = getContext();
    
    return db.insert(integrationMappings).values({
      ventureId: ctx.venture.id,
      integrationId,
      entityType,
      localId,
      externalId,
      lastSyncedAt: new Date(),
      syncStatus: 'synced',
      createdBy: ctx.user?.id,
    }).returning();
  }

  private getEncryptionKey(): Buffer {
    return Buffer.from(process.env.ENCRYPTION_KEY!, 'hex');
  }

  // External API methods (implementations would call actual APIs)
  private async exchangeQuickBooksToken(authCode: string, realmId: string) {
    // OAuth token exchange
    return { access_token: '', refresh_token: '', expires_in: 3600 };
  }

  private async getQuickBooksCompanyInfo(accessToken: string, realmId: string) {
    return { CompanyName: '' };
  }

  private async syncQuickBooksAccounts(integrationId: string) {
    return { created: 0, updated: 0, failed: 0 };
  }

  private async pushQuickBooksInvoice(integration: any, invoice: any) {
    return { Id: '' };
  }

  private async exchangeXeroToken(authCode: string) {
    return { access_token: '', refresh_token: '', expires_in: 1800 };
  }

  private async getXeroTenants(accessToken: string) {
    return [{ tenantId: '' }];
  }

  private async getXeroOrganization(accessToken: string, tenantId: string) {
    return { Name: '' };
  }

  private async syncXeroAccounts(integrationId: string) {
    return { created: 0, updated: 0, failed: 0 };
  }

  private async pushXeroInvoice(integration: any, invoice: any) {
    return { Id: '' };
  }

  private async pushCustomer(integrationId: string, customerId: string) {
    // Push customer to external system
  }

  private async syncCustomers(integrationId: string) {
    return { created: 0, updated: 0, failed: 0 };
  }

  private async syncInvoices(integrationId: string) {
    return { created: 0, updated: 0, failed: 0 };
  }

  private async exchangePlaidToken(publicToken: string) {
    return { access_token: '', item_id: '' };
  }

  private async getPlaidAccounts(accessToken: string) {
    return { accounts: [], institution: { name: '' } };
  }

  private async getPlaidTransactions(accessToken: string, startDate: Date, endDate: Date) {
    return { transactions: [] };
  }
}

export const integrationService = new IntegrationService();
```

---

## Dependencies

### External Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| `@mcv/kernel` | workspace:* | Core utilities, database, context |
| `@mcv/payments` | workspace:* | Payment processing integration |
| `@mcv/documents` | workspace:* | PDF generation, file storage |
| `decimal.js` | ^10.x | Precise decimal arithmetic |
| `date-fns` | ^3.x | Date manipulation |
| `plaid` | ^12.x | Bank connection (Plaid API) |
| `intuit-oauth` | ^4.x | QuickBooks OAuth |
| `xero-node` | ^4.x | Xero API client |

### Peer Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| `typescript` | ^5.3.x | TypeScript |

---

## Package Exports

```typescript
// @mcv/finance/index.ts

// Accounting
export { accountingService } from './accounting/service';
export type { CreateAccountInput, CreateJournalEntryInput } from './accounting/service';
export * from './accounting/schema';

// Expenses
export { expenseService } from './expenses/service';
export type { CreateExpenseInput, CreateExpenseReportInput } from './expenses/service';
export * from './expenses/schema';

// Budgeting
export { budgetingService } from './budgeting/service';
export type { CreateBudgetInput, BudgetLineInput } from './budgeting/service';
export * from './budgeting/schema';

// Reporting
export { reportingService } from './reporting/service';
export type { ReportOptions, ReportDateRange } from './reporting/service';
export * from './reporting/schema';

// Billing
export { billingService } from './billing/service';
export type { CreateInvoiceInput, CreateSubscriptionInput } from './billing/service';
export * from './billing/schema';

// Integrations
export { integrationService } from './integrations/service';
export * from './integrations/schema';
```

---

## Testing

### Test Examples

```typescript
// @mcv/finance/__tests__/accounting.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { accountingService } from '../accounting/service';
import { withContext, createContext } from '@mcv/kernel/context';

describe('AccountingService', () => {
  describe('createJournalEntry', () => {
    it('should reject unbalanced entries', async () => {
      const ctx = createContext({ venture: testVenture, user: testUser });
      
      await expect(
        withContext(ctx, () => 
          accountingService.createJournalEntry({
            entryDate: new Date(),
            description: 'Test entry',
            lines: [
              { accountId: cashAccountId, debitAmount: '1000' },
              { accountId: revenueAccountId, creditAmount: '900' },
            ],
          })
        )
      ).rejects.toThrow('Journal entry must balance');
    });

    it('should create balanced journal entry', async () => {
      const ctx = createContext({ venture: testVenture, user: testUser });
      
      const result = await withContext(ctx, () =>
        accountingService.createJournalEntry({
          entryDate: new Date(),
          description: 'Sale transaction',
          lines: [
            { accountId: cashAccountId, debitAmount: '1000' },
            { accountId: revenueAccountId, creditAmount: '1000' },
          ],
        })
      );
      
      expect(result.entry.status).toBe('draft');
      expect(result.lines).toHaveLength(2);
    });
  });

  describe('getTrialBalance', () => {
    it('should return balanced trial balance', async () => {
      const ctx = createContext({ venture: testVenture });
      
      const result = await withContext(ctx, () =>
        accountingService.getTrialBalance(fiscalPeriodId)
      );
      
      expect(result.totals.balanced).toBe(true);
    });
  });
});
```

---

## Related Documentation

- [accounting Module Details](./accounting/MODULE.md)
- [expenses Module Details](./expenses/MODULE.md)
- [budgeting Module Details](./budgeting/MODULE.md)
- [reporting Module Details](./reporting/MODULE.md)
- [billing Module Details](./billing/MODULE.md)
- [integrations Module Details](./integrations/MODULE.md)

---

*@mcv/finance — Complete Financial Management for Ventures*