# @mcv/finance — API Reference
## Tier 5: PUBLISHABLE Domains

**Package:** `@mcv/finance`  
**Classification:** PUBLISHABLE  
**Version:** 1.0.0  
**Last Updated:** February 9, 2026

---

## Table of Contents

1. [API Overview](#api-overview)
2. [Service Methods](#service-methods)
   - [Accounting](#accounting-service)
   - [Billing](#billing-service)
   - [Budgeting](#budgeting-service)
   - [Expenses](#expense-service)
   - [Integrations](#integration-service)
   - [Reporting](#reporting-service)
3. [Types & Interfaces](#types--interfaces)
4. [Zod Schemas](#zod-schemas)
5. [Events](#events)
6. [Error Codes](#error-codes)
7. [Configuration](#configuration)

---

## API Overview

All `@mcv/finance` services are instantiated as singletons and exported from their respective submodule paths. Services operate within the `@mcv/kernel` context system — the current venture and user are resolved automatically from `getContext()`.

### Import Patterns

```typescript
// Service imports
import { accountingService } from '@mcv/finance/accounting/service';
import { billingService } from '@mcv/finance/billing/service';
import { budgetingService } from '@mcv/finance/budgeting/service';
import { expenseService } from '@mcv/finance/expenses/service';
import { integrationService } from '@mcv/finance/integrations/service';
import { reportingService } from '@mcv/finance/reporting/service';

// Schema imports (for direct DB queries)
import { accounts, journalEntries, journalEntryLines } from '@mcv/finance/accounting/schema';
import { invoices, subscriptions } from '@mcv/finance/billing/schema';
import { invoicesV2, proposals, estimates } from '@mcv/finance/billing/invoicing-schema';
import { budgets, budgetLines } from '@mcv/finance/budgeting/schema';
import { expenses, expenseReports } from '@mcv/finance/expenses/schema';
import { bankTransactions, reconciliations } from '@mcv/finance/integrations/schema';
import { financialReports, reportRuns } from '@mcv/finance/reporting/schema';

// Type imports
import type {
  AccountType, JournalEntryStatus, InvoiceStatus,
  ExpenseStatus, BudgetStatus, ReportType,
} from '@mcv/finance/types';

// React hook imports
import { useChartOfAccounts } from '@mcv/finance/client/hooks/use-chart-of-accounts';
import { useInvoices } from '@mcv/finance/client/hooks/use-invoices';
import { useExpenses } from '@mcv/finance/client/hooks/use-expenses';

// React component imports
import { ChartOfAccountsTree } from '@mcv/finance/client/components/chart-of-accounts-tree';
import { InvoiceEditor } from '@mcv/finance/client/components/invoice-editor';
import { FinancialDashboard } from '@mcv/finance/client/components/financial-dashboard';
```

### Authentication & Context

All service methods require a valid kernel context. The context is set by middleware in API routes and Server Actions:

```typescript
import { withContext } from '@mcv/kernel/context';

// In API route
export async function POST(req: Request) {
  return withContext(req, async (ctx) => {
    // ctx.venture.id — current venture
    // ctx.user.id — current user
    // ctx.user.role — user's role in this venture
    const result = await accountingService.createJournalEntry(input);
    return Response.json(result);
  });
}
```

### Error Handling Convention

All service methods throw `MCVError` with a specific error code on failure:

```typescript
import { MCVError, ErrorCode } from '@mcv/kernel/errors';

try {
  await accountingService.postJournalEntry(entryId);
} catch (error) {
  if (error instanceof MCVError) {
    console.error(error.code);    // 'FINANCE_PERIOD_CLOSED'
    console.error(error.message); // 'Cannot post to closed fiscal period'
    console.error(error.details); // { periodId, periodStatus }
  }
}
```

---

## Service Methods

### Accounting Service

**Import:** `import { accountingService } from '@mcv/finance/accounting/service'`

The accounting service implements the core double-entry bookkeeping engine: chart of accounts management, journal entry lifecycle (create → post → reverse), trial balance computation, and fiscal period management.

---

#### `createAccount`

Creates a new account in the venture's chart of accounts.

```typescript
async createAccount(input: CreateAccountInput): Promise<Account>
```

**Parameters:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `code` | `string` | ✅ | Hierarchical account code (e.g., `"1010"`) |
| `name` | `string` | ✅ | Display name (e.g., `"Cash and Cash Equivalents"`) |
| `description` | `string` | ❌ | Detailed description |
| `type` | `AccountType` | ✅ | `'asset' \| 'liability' \| 'equity' \| 'revenue' \| 'expense'` |
| `subtype` | `AccountSubtype` | ✅ | Fine-grained classification (e.g., `'cash'`, `'accounts_receivable'`) |
| `parentId` | `string` | ❌ | UUID of parent account for hierarchy |
| `currency` | `string` | ❌ | ISO 4217 code. Default: `'USD'` |
| `openingBalance` | `string` | ❌ | Opening balance as decimal string. Default: `'0'` |
| `taxCode` | `string` | ❌ | Tax code for tax reporting |

**Returns:** `Account` — The created account record.

**Throws:**

| Error Code | Condition |
|-----------|-----------|
| `ALREADY_EXISTS` | Account code already exists in this venture |
| `VALIDATION_ERROR` | Invalid account type/subtype combination |
| `NOT_FOUND` | Parent account ID does not exist |

**Example:**

```typescript
const cashAccount = await accountingService.createAccount({
  code: '1010',
  name: 'Cash and Cash Equivalents',
  type: 'asset',
  subtype: 'cash',
  currency: 'USD',
  openingBalance: '50000',
});
```

---

#### `getChartOfAccounts`

Retrieves the full chart of accounts as a hierarchical tree.

```typescript
async getChartOfAccounts(options?: {
  type?: AccountType;
  includeInactive?: boolean;
}): Promise<AccountTree>
```

**Parameters:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `type` | `AccountType` | ❌ | Filter by account type |
| `includeInactive` | `boolean` | ❌ | Include deactivated accounts. Default: `false` |

**Returns:** `AccountTree` — Array of root account nodes with nested `children`.

```typescript
type AccountTree = AccountNode[];

interface AccountNode {
  id: string;
  code: string;
  name: string;
  type: AccountType;
  subtype: AccountSubtype;
  normalBalance: 'debit' | 'credit';
  currentBalance: string;
  isActive: boolean;
  children: AccountNode[];
}
```

**Example:**

```typescript
const tree = await accountingService.getChartOfAccounts({ type: 'asset' });
// Returns all asset accounts in a tree structure
```

---

#### `createJournalEntry`

Creates a new journal entry with debit and credit lines. Validates that total debits equal total credits.

```typescript
async createJournalEntry(
  input: CreateJournalEntryInput
): Promise<{ entry: JournalEntry; lines: JournalEntryLine[] }>
```

**Parameters:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `entryDate` | `Date` | ✅ | Date of the journal entry |
| `description` | `string` | ✅ | Description/memo for the entry |
| `reference` | `string` | ❌ | External reference number |
| `sourceType` | `string` | ❌ | `'manual' \| 'invoice' \| 'expense' \| 'payroll' \| 'reversal'` |
| `sourceId` | `string` | ❌ | UUID of the originating record |
| `isAdjusting` | `boolean` | ❌ | Whether this is an adjusting entry. Default: `false` |
| `lines` | `JournalEntryLineInput[]` | ✅ | Array of debit/credit lines (minimum 2) |

**JournalEntryLineInput:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `accountId` | `string` | ✅ | UUID of the GL account |
| `description` | `string` | ❌ | Line-level description |
| `debitAmount` | `string` | ❌ | Debit amount (mutually exclusive with `creditAmount`) |
| `creditAmount` | `string` | ❌ | Credit amount (mutually exclusive with `debitAmount`) |
| `currency` | `string` | ❌ | ISO 4217 code. Default: `'USD'` |
| `exchangeRate` | `number` | ❌ | Exchange rate to base currency. Default: `1` |
| `departmentId` | `string` | ❌ | Department for dimensional tracking |
| `projectId` | `string` | ❌ | Project for dimensional tracking |

**Returns:** `{ entry: JournalEntry, lines: JournalEntryLine[] }` — The created entry with auto-generated entry number (e.g., `JE-2026-000001`).

**Throws:**

| Error Code | Condition |
|-----------|-----------|
| `VALIDATION_ERROR` | Total debits ≠ total credits |
| `VALIDATION_ERROR` | Fewer than 2 lines |
| `NOT_FOUND` | Account ID does not exist |
| `BUSINESS_RULE_VIOLATION` | Fiscal period is closed or locked |

**Example:**

```typescript
const { entry, lines } = await accountingService.createJournalEntry({
  entryDate: new Date('2026-02-01'),
  description: 'Monthly rent payment',
  reference: 'CHK-1042',
  lines: [
    { accountId: rentExpenseId, debitAmount: '3000' },
    { accountId: cashAccountId, creditAmount: '3000' },
  ],
});
// entry.entryNumber === 'JE-2026-000001'
// entry.status === 'draft'
```

---

#### `postJournalEntry`

Posts a draft journal entry, making it final and updating account balances.

```typescript
async postJournalEntry(entryId: string): Promise<JournalEntry>
```

**Parameters:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `entryId` | `string` | ✅ | UUID of the journal entry to post |

**Returns:** `JournalEntry` — The posted entry with `status: 'posted'`, `postedAt`, and `postedBy` set.

**Side Effects:**
- Updates `currentBalance` on all affected accounts
- Updates `periodDebit`/`periodCredit`/`netChange` on `accountBalances`
- Invalidates Redis cache for trial balance and chart of accounts
- Emits `finance.journal_entry.posted` event

**Throws:**

| Error Code | Condition |
|-----------|-----------|
| `NOT_FOUND` | Entry does not exist |
| `BUSINESS_RULE_VIOLATION` | Entry is not in `draft` status |
| `BUSINESS_RULE_VIOLATION` | Fiscal period is closed or locked |

---

#### `reverseJournalEntry`

Reverses a posted journal entry by creating a new entry with debits and credits swapped.

```typescript
async reverseJournalEntry(
  entryId: string,
  reversalDate: Date,
  reason: string
): Promise<{ entry: JournalEntry; lines: JournalEntryLine[] }>
```

**Parameters:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `entryId` | `string` | ✅ | UUID of the posted entry to reverse |
| `reversalDate` | `Date` | ✅ | Date for the reversal entry |
| `reason` | `string` | ✅ | Explanation for the reversal |

**Returns:** The newly created reversal entry (auto-posted).

**Side Effects:**
- Original entry status changes to `'reversed'`
- New reversal entry is automatically posted
- Account balances are updated to reflect the reversal
- Emits `finance.journal_entry.reversed` event

**Throws:**

| Error Code | Condition |
|-----------|-----------|
| `NOT_FOUND` | Entry does not exist |
| `BUSINESS_RULE_VIOLATION` | Entry is not in `posted` status |

---

#### `getTrialBalance`

Computes the trial balance for a fiscal period using pre-computed balance snapshots.

```typescript
async getTrialBalance(fiscalPeriodId: string): Promise<TrialBalance>
```

**Parameters:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `fiscalPeriodId` | `string` | ✅ | UUID of the fiscal period |

**Returns:**

```typescript
interface TrialBalance {
  rows: Array<{
    accountCode: string;
    accountName: string;
    accountType: AccountType;
    debit: string;
    credit: string;
  }>;
  totals: {
    debit: string;
    credit: string;
    balanced: boolean;
  };
}
```

---

#### `closeFiscalPeriod`

Closes a fiscal period, preventing further journal entries from being posted.

```typescript
async closeFiscalPeriod(periodId: string): Promise<FiscalPeriod>
```

**Parameters:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `periodId` | `string` | ✅ | UUID of the fiscal period to close |

**Pre-conditions:**
- Period must be in `'open'` status
- No unposted (draft) journal entries may exist in the period

**Side Effects:**
- Calculates and freezes closing balances
- Carries forward opening balances to next period
- Sets `closedAt` and `closedBy`
- Emits `finance.period.closed` event

**Throws:**

| Error Code | Condition |
|-----------|-----------|
| `NOT_FOUND` | Period does not exist |
| `BUSINESS_RULE_VIOLATION` | Period is already closed |
| `BUSINESS_RULE_VIOLATION` | Unposted journal entries exist in this period |

---

### Billing Service

**Import:** `import { billingService } from '@mcv/finance/billing/service'`

The billing service manages invoicing, subscriptions, payments, proposals, estimates, recurring invoices, credit notes, dunning automation, and platform fee management.

---

#### `createInvoice`

Creates a new invoice for a customer.

```typescript
async createInvoice(input: CreateInvoiceInput): Promise<Invoice>
```

**Parameters:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `customerId` | `string` | ✅ | UUID of the customer |
| `invoiceDate` | `Date` | ✅ | Invoice issue date |
| `dueDate` | `Date` | ✅ | Payment due date |
| `currency` | `string` | ❌ | ISO 4217 code. Default: `'USD'` |
| `paymentTerms` | `string` | ❌ | `'net_15' \| 'net_30' \| 'net_60' \| 'due_on_receipt'`. Default: `'net_30'` |
| `lineItems` | `InvoiceLineItemInput[]` | ✅ | Array of line items |
| `billingAddress` | `object` | ❌ | Billing address |
| `shippingAddress` | `object` | ❌ | Shipping address |
| `memo` | `string` | ❌ | Internal memo |
| `footer` | `string` | ❌ | Invoice footer text |
| `templateId` | `string` | ❌ | Invoice template UUID (V2) |

**InvoiceLineItemInput:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `description` | `string` | ✅ | Line item description |
| `quantity` | `string` | ❌ | Quantity. Default: `'1'` |
| `unitPrice` | `string` | ✅ | Price per unit as decimal string |
| `taxable` | `boolean` | ❌ | Whether item is taxable. Default: `true` |
| `taxRate` | `string` | ❌ | Tax rate as decimal (e.g., `'0.0875'` for 8.75%) |
| `discountPercent` | `string` | ❌ | Line discount percentage |
| `accountId` | `string` | ❌ | GL account for revenue recognition |
| `productId` | `string` | ❌ | Product reference |
| `periodStart` | `Date` | ❌ | Service period start |
| `periodEnd` | `Date` | ❌ | Service period end |

**Returns:** `Invoice` — The created invoice with auto-generated number, calculated subtotal, tax, discount, and total.

**Side Effects:**
- Auto-generates invoice number (`INV-{prefix}-{sequence}`)
- Calculates subtotal, tax amounts, discounts, and total
- Creates journal entry: `DR: Accounts Receivable, CR: Revenue` (when sent)
- Emits `finance.invoice.created` event

**Example:**

```typescript
const invoice = await billingService.createInvoice({
  customerId: 'cust-uuid',
  invoiceDate: new Date('2026-02-01'),
  dueDate: new Date('2026-03-03'),
  paymentTerms: 'net_30',
  lineItems: [
    {
      description: 'Web Development Services — February 2026',
      quantity: '40',
      unitPrice: '150',
      taxable: true,
      taxRate: '0.0875',
      accountId: serviceRevenueAccountId,
    },
  ],
});
// invoice.subtotal = '6000.0000'
// invoice.taxAmount = '525.0000'
// invoice.totalAmount = '6525.0000'
```

---

#### `recordPayment`

Records a payment against an invoice, updating its status and creating GL entries.

```typescript
async recordPayment(input: RecordPaymentInput): Promise<{
  invoice: Invoice;
  journalEntry: JournalEntry;
}>
```

**Parameters:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `invoiceId` | `string` | ✅ | UUID of the invoice |
| `amount` | `string` | ✅ | Payment amount as decimal string |
| `paymentDate` | `Date` | ✅ | Date of payment |
| `paymentMethod` | `string` | ✅ | `'bank_transfer' \| 'credit_card' \| 'check' \| 'cash' \| 'stripe'` |
| `paymentReference` | `string` | ❌ | External payment reference (check number, transaction ID) |

**Returns:** Updated invoice and the payment journal entry.

**Side Effects:**
- Updates `amountPaid` and `amountDue` on the invoice
- Changes status to `'partial'` or `'paid'` based on remaining balance
- Creates journal entry: `DR: Cash, CR: Accounts Receivable`
- If fully paid: sets `paidAt`, emits `finance.invoice.paid`
- Pushes to external accounting platforms if integration active

**Throws:**

| Error Code | Condition |
|-----------|-----------|
| `NOT_FOUND` | Invoice does not exist |
| `FINANCE_INVOICE_ALREADY_PAID` | Invoice is already fully paid |
| `FINANCE_INVOICE_VOIDED` | Invoice has been voided |
| `FINANCE_PAYMENT_EXCEEDS_DUE` | Payment amount exceeds amount due |

---

#### `runDunning`

Executes the dunning process for overdue invoices, triggering appropriate actions based on dunning rules.

```typescript
async runDunning(options?: {
  ventureId?: string;
  dryRun?: boolean;
}): Promise<DunningResult>
```

**Parameters:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `ventureId` | `string` | ❌ | Run for specific venture. Default: all ventures |
| `dryRun` | `boolean` | ❌ | Preview actions without executing. Default: `false` |

**Returns:**

```typescript
interface DunningResult {
  processed: number;          // Total overdue invoices evaluated
  actions: Array<{
    invoiceId: string;
    invoiceNumber: string;
    customerId: string;
    daysOverdue: number;
    action: string;           // 'email', 'sms', 'pause_subscription', 'cancel_subscription'
    template?: string;
    executed: boolean;
  }>;
  errors: Array<{
    invoiceId: string;
    error: string;
  }>;
}
```

**Side Effects (when not dryRun):**
- Sends reminder emails/SMS via `@mcv/notifications`
- Pauses subscriptions if configured
- Cancels subscriptions at final step
- Emits `finance.invoice.dunning_action` events

---

#### `createSubscription`

Creates a new subscription for a customer based on a billing plan.

```typescript
async createSubscription(input: CreateSubscriptionInput): Promise<Subscription>
```

**Parameters:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `customerId` | `string` | ✅ | UUID of the customer |
| `planId` | `string` | ✅ | UUID of the billing plan |
| `quantity` | `number` | ❌ | Number of units. Default: `1` |
| `startDate` | `Date` | ❌ | Subscription start date. Default: now |
| `trialDays` | `number` | ❌ | Trial period days (overrides plan default) |
| `collectionMethod` | `string` | ❌ | `'charge_automatically' \| 'send_invoice'`. Default: `'charge_automatically'` |
| `defaultPaymentMethodId` | `string` | ❌ | Payment method UUID |
| `prorationBehavior` | `string` | ❌ | `'create_prorations' \| 'none'`. Default: `'create_prorations'` |

**Returns:** `Subscription` — The created subscription with computed period dates.

**Side Effects:**
- Generates subscription number
- Computes `currentPeriodStart` and `currentPeriodEnd` based on plan interval
- If trial configured, sets `trialStart` and `trialEnd`
- Emits `finance.subscription.created` event

---

#### `createProposal`

Creates a sales proposal that can be sent for e-signature and converted to an invoice.

```typescript
async createProposal(input: CreateProposalInput): Promise<Proposal>
```

**Parameters:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `title` | `string` | ✅ | Proposal title |
| `contactId` | `string` | ❌ | UUID of the contact |
| `organizationId` | `string` | ❌ | UUID of the organization |
| `content` | `ProposalContentBlock[]` | ✅ | Rich content blocks (text, images, tables) |
| `lineItems` | `InvoiceV2LineItem[]` | ✅ | Pricing line items |
| `validUntil` | `Date` | ❌ | Proposal expiration date |
| `coverImageUrl` | `string` | ❌ | Cover image URL |

**Returns:** `Proposal` — The created proposal with calculated totals.

---

#### `convertProposalToInvoice`

Converts an accepted proposal into an invoice.

```typescript
async convertProposalToInvoice(proposalId: string): Promise<InvoiceV2>
```

**Throws:**

| Error Code | Condition |
|-----------|-----------|
| `NOT_FOUND` | Proposal does not exist |
| `BUSINESS_RULE_VIOLATION` | Proposal has not been accepted |
| `BUSINESS_RULE_VIOLATION` | Proposal already converted |

---

### Budgeting Service

**Import:** `import { budgetingService } from '@mcv/finance/budgeting/service'`

The budgeting service enables budget planning, allocation tracking, forecasting, and scenario analysis.

---

#### `createBudget`

Creates a new budget with line items linked to GL accounts.

```typescript
async createBudget(
  input: CreateBudgetInput
): Promise<{ budget: Budget; lines: BudgetLine[] }>
```

**Parameters:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | `string` | ✅ | Budget name |
| `description` | `string` | ❌ | Description |
| `budgetType` | `string` | ✅ | `'annual' \| 'quarterly' \| 'project' \| 'department'` |
| `fiscalYearId` | `string` | ❌ | UUID of the fiscal year |
| `departmentId` | `string` | ❌ | UUID of the department |
| `projectId` | `string` | ❌ | UUID of the project |
| `startDate` | `Date` | ✅ | Budget period start |
| `endDate` | `Date` | ✅ | Budget period end |
| `currency` | `string` | ❌ | ISO 4217 code. Default: `'USD'` |
| `lines` | `BudgetLineInput[]` | ✅ | Budget line items |

**BudgetLineInput:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `accountId` | `string` | ✅ | GL account UUID |
| `categoryName` | `string` | ✅ | Budget category label |
| `description` | `string` | ❌ | Line description |
| `budgetAmount` | `string` | ✅ | Total budgeted amount |
| `periodAllocations` | `object` | ❌ | Monthly breakdown. Auto-distributed if omitted. |
| `isCapex` | `boolean` | ❌ | Capital expenditure flag. Default: `false` |
| `costCenter` | `string` | ❌ | Cost center code |

**Returns:** `{ budget: Budget, lines: BudgetLine[] }` — The created budget and its line items.

**Side Effects:**
- Computes `totalBudget` from sum of line amounts
- If `periodAllocations` not provided, distributes evenly across months
- Emits `finance.budget.created` event

**Example:**

```typescript
const { budget, lines } = await budgetingService.createBudget({
  name: 'Marketing Budget Q1 2026',
  budgetType: 'quarterly',
  startDate: new Date('2026-01-01'),
  endDate: new Date('2026-03-31'),
  lines: [
    {
      accountId: advertisingAccountId,
      categoryName: 'Digital Advertising',
      budgetAmount: '30000',
      periodAllocations: {
        '2026-01': { budget: 12000 },
        '2026-02': { budget: 10000 },
        '2026-03': { budget: 8000 },
      },
    },
    {
      accountId: eventsAccountId,
      categoryName: 'Events & Conferences',
      budgetAmount: '15000',
      // Auto-distributed: $5,000/month
    },
  ],
});
```

---

#### `trackSpend`

Records actual spending against a budget line and evaluates alert thresholds.

```typescript
async trackSpend(
  budgetLineId: string,
  amount: string,
  period: string
): Promise<BudgetLine>
```

**Parameters:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `budgetLineId` | `string` | ✅ | UUID of the budget line |
| `amount` | `string` | ✅ | Actual spend amount to add |
| `period` | `string` | ✅ | Period key (e.g., `'2026-02'`) |

**Returns:** Updated `BudgetLine` with recalculated `actualAmount`, `variance`, and `variancePercent`.

**Side Effects:**
- Updates `actualAmount` on the budget line
- Recalculates `variance` (budget - actual) and `variancePercent`
- Updates `periodAllocations[period].actual`
- Evaluates alert thresholds, triggers if exceeded
- Emits `finance.budget.spend_recorded` event

---

#### `getVariance`

Gets budget vs. actual comparison data for a budget.

```typescript
async getVariance(budgetId: string): Promise<BudgetComparison>
```

**Parameters:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `budgetId` | `string` | ✅ | UUID of the budget |

**Returns:**

```typescript
interface BudgetComparison {
  budgetId: string;
  budgetName: string;
  totalBudget: string;
  totalActual: string;
  totalVariance: string;
  totalVariancePercent: string;
  utilizationPercent: string;
  lines: Array<{
    lineId: string;
    categoryName: string;
    accountCode: string;
    accountName: string;
    budget: string;
    actual: string;
    committed: string;
    available: string;           // budget - actual - committed
    variance: string;
    variancePercent: string;
    status: 'under' | 'on_track' | 'over';
    periodBreakdown: Array<{
      period: string;
      budget: string;
      actual: string;
      variance: string;
    }>;
  }>;
  alerts: Array<{
    lineId: string;
    severity: 'info' | 'warning' | 'critical';
    message: string;
    triggeredAt: string;
  }>;
}
```

---

#### `generateForecast`

Generates a forecast for remaining budget periods using the specified forecasting method.

```typescript
async generateForecast(
  budgetId: string,
  method?: ForecastMethod
): Promise<BudgetForecast>
```

**Parameters:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `budgetId` | `string` | ✅ | UUID of the budget |
| `method` | `ForecastMethod` | ❌ | `'linear' \| 'seasonal' \| 'ml_based'`. Default: `'linear'` |

**Returns:**

```typescript
interface BudgetForecast {
  budgetId: string;
  forecastDate: string;
  forecastType: ForecastMethod;
  periodForecasts: Array<{
    period: string;
    predicted: string;
    confidence: number;         // 0.0 - 1.0
    range: {
      low: string;
      high: string;
    };
  }>;
  accuracy: string | null;     // Historical accuracy of this method
  modelParameters: object;
}
```

---

#### `createScenario`

Creates a what-if scenario for budget planning.

```typescript
async createScenario(input: ScenarioInput): Promise<BudgetScenario>
```

**Parameters:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `budgetId` | `string` | ✅ | UUID of the budget |
| `name` | `string` | ✅ | Scenario name |
| `description` | `string` | ❌ | Scenario description |
| `scenarioType` | `string` | ✅ | `'best_case' \| 'worst_case' \| 'most_likely' \| 'custom'` |
| `assumptions` | `object` | ✅ | `{ revenueGrowth: 0.15, costInflation: 0.03, headcountChange: 5 }` |
| `lineAdjustments` | `object` | ❌ | Per-line overrides: `{ [lineId]: { factor: 1.1 } }` |

**Returns:** `BudgetScenario` — The created scenario with projected totals.

---

### Expense Service

**Import:** `import { expenseService } from '@mcv/finance/expenses/service'`

The expense service manages expense creation, receipt processing, report submission, approval workflows, and reimbursement.

---

#### `submitExpense`

Creates a single expense and validates it against the employee's applicable expense policy.

```typescript
async submitExpense(input: CreateExpenseInput): Promise<Expense>
```

**Parameters:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `merchantName` | `string` | ✅ | Merchant/vendor name |
| `merchantLocation` | `string` | ❌ | Merchant location |
| `expenseDate` | `Date` | ✅ | Date of the expense |
| `category` | `ExpenseCategory` | ✅ | `'travel' \| 'meals' \| 'lodging' \| 'transportation' \| 'office_supplies' \| 'software' \| 'equipment' \| 'professional_services' \| 'marketing' \| 'entertainment' \| 'utilities' \| 'other'` |
| `subcategory` | `string` | ❌ | More specific category |
| `description` | `string` | ✅ | Expense description |
| `amount` | `string` | ✅ | Amount as decimal string |
| `currency` | `string` | ❌ | ISO 4217 code. Default: `'USD'` |
| `isReimbursable` | `boolean` | ❌ | Whether employee should be reimbursed. Default: `true` |
| `isBillable` | `boolean` | ❌ | Whether expense is billable to a customer. Default: `false` |
| `customerId` | `string` | ❌ | Customer UUID for billable expenses |
| `projectId` | `string` | ❌ | Project UUID |
| `departmentId` | `string` | ❌ | Department UUID |
| `paymentMethod` | `string` | ❌ | `'personal' \| 'corporate_card' \| 'petty_cash'` |
| `mileage` | `number` | ❌ | Miles driven (for transportation) |
| `attendees` | `Array<{ name, company? }>` | ❌ | Meeting/meal attendees |
| `tags` | `string[]` | ❌ | Freeform tags |

**Returns:** `Expense` — The created expense with policy violation flags.

**Side Effects:**
- Validates against applicable expense policy
- Records any policy violations (does not block creation)
- Determines receipt requirement based on policy rules
- If mileage provided, calculates amount as `mileage × mileageRate`
- Emits `finance.expense.created` event

**Example:**

```typescript
const expense = await expenseService.submitExpense({
  merchantName: 'Delta Airlines',
  expenseDate: new Date('2026-02-05'),
  category: 'travel',
  description: 'Flight to NYC for client meeting',
  amount: '450',
  isReimbursable: true,
  isBillable: true,
  customerId: 'client-uuid',
  projectId: 'project-uuid',
});
```

---

#### `approveExpense`

Processes an approval decision on an expense report.

```typescript
async approveExpense(
  reportId: string,
  decision: 'approved' | 'rejected',
  comments?: string
): Promise<ExpenseReport>
```

**Parameters:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `reportId` | `string` | ✅ | UUID of the expense report |
| `decision` | `string` | ✅ | `'approved'` or `'rejected'` |
| `comments` | `string` | ❌ | Approver comments |

**Returns:** `ExpenseReport` — Updated report.

**Side Effects:**

If **approved**:
- Updates approval record for current user
- If more levels remain: activates next level's pending approval
- If final level: sets report status to `'approved'`, creates GL entries (`DR: Expense, CR: AP-Employee`), emits `finance.expense.approved`

If **rejected**:
- Sets report status to `'rejected'`, records reason
- Emits `finance.expense.rejected` event
- Notifies employee of rejection

**Throws:**

| Error Code | Condition |
|-----------|-----------|
| `FINANCE_APPROVAL_NOT_FOUND` | No pending approval for current user |
| `NOT_FOUND` | Report does not exist |

---

#### `reimburse`

Processes reimbursement for an approved expense report.

```typescript
async reimburse(
  reportId: string,
  paymentMethod: string,
  paymentReference: string
): Promise<ExpenseReport>
```

**Parameters:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `reportId` | `string` | ✅ | UUID of the approved expense report |
| `paymentMethod` | `string` | ✅ | `'bank_transfer' \| 'check' \| 'payroll'` |
| `paymentReference` | `string` | ✅ | Payment reference number |

**Returns:** `ExpenseReport` with `status: 'reimbursed'`.

**Side Effects:**
- Creates payment journal entry: `DR: AP-Employee, CR: Cash`
- Sets `paidAt`, `paymentMethod`, `paymentReference`
- Emits `finance.expense.reimbursed` event

---

#### `uploadReceipt`

Uploads a receipt for an expense and processes it with OCR.

```typescript
async uploadReceipt(expenseId: string, receiptUrl: string): Promise<Expense>
```

**Parameters:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `expenseId` | `string` | ✅ | UUID of the expense |
| `receiptUrl` | `string` | ✅ | URL of the uploaded receipt file |

**Returns:** Updated `Expense` with `receiptStatus: 'uploaded'` and OCR data.

**Side Effects:**
- Processes receipt with OpenRouter AI OCR
- Extracts merchant name, date, total, line items, tax
- Auto-fills empty expense fields from OCR data
- Sets `receiptOcrData` with extracted data

---

#### `getExpenseAnalytics`

Retrieves expense analytics for a date range, grouped by a specified dimension.

```typescript
async getExpenseAnalytics(
  startDate: Date,
  endDate: Date,
  groupBy?: 'category' | 'department' | 'employee' | 'month'
): Promise<AnalyticsRow[]>
```

**Returns:**

```typescript
interface AnalyticsRow {
  groupKey: string;
  expenseCount: number;
  totalAmount: string;
  avgAmount: string;
  reimbursableCount: number;
  reimbursableAmount: string;
}
```

---

### Integration Service

**Import:** `import { integrationService } from '@mcv/finance/integrations/service'`

The integration service manages connections to external accounting platforms and bank feeds.

---

#### `syncQuickBooks`

Synchronizes data between MCV Finance and QuickBooks Online.

```typescript
async syncQuickBooks(options?: SyncOptions): Promise<SyncResult>
```

**Parameters:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `direction` | `string` | ❌ | `'push' \| 'pull' \| 'bidirectional'`. Default: `'bidirectional'` |
| `entityTypes` | `string[]` | ❌ | `['accounts', 'invoices', 'payments', 'customers', 'vendors']`. Default: all |
| `since` | `Date` | ❌ | Sync only records modified after this date. Default: last sync time |
| `dryRun` | `boolean` | ❌ | Preview changes without applying. Default: `false` |

**Returns:**

```typescript
interface SyncResult {
  provider: 'quickbooks';
  direction: string;
  startedAt: string;
  completedAt: string;
  duration: number;           // milliseconds
  entities: Record<string, {
    pushed: number;
    pulled: number;
    created: number;
    updated: number;
    skipped: number;
    failed: number;
    errors: Array<{ entityId: string; error: string }>;
  }>;
  summary: {
    totalPushed: number;
    totalPulled: number;
    totalErrors: number;
  };
}
```

**Side Effects:**
- Creates/updates entity mappings in `integration_mappings`
- Logs sync details in `integration_sync_logs`
- Emits `finance.integration.sync_completed` or `finance.integration.sync_failed`

**Throws:**

| Error Code | Condition |
|-----------|-----------|
| `FINANCE_PROVIDER_UNREACHABLE` | Cannot connect to QuickBooks API |
| `FINANCE_TOKEN_EXPIRED` | OAuth2 token expired and refresh failed |
| `FINANCE_SYNC_FAILED` | Unrecoverable sync error |

---

#### `syncXero`

Synchronizes data between MCV Finance and Xero. Same interface as `syncQuickBooks`.

```typescript
async syncXero(options?: SyncOptions): Promise<SyncResult>
```

---

#### `importBankFeed`

Imports bank transactions from a connected bank account via Plaid.

```typescript
async importBankFeed(options?: BankFeedOptions): Promise<BankFeedResult>
```

**Parameters:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `bankConnectionId` | `string` | ❌ | Specific bank connection. Default: all active connections |
| `startDate` | `Date` | ❌ | Fetch transactions from this date. Default: last import date |
| `endDate` | `Date` | ❌ | Fetch transactions through this date. Default: today |
| `autoReconcile` | `boolean` | ❌ | Run auto-matching after import. Default: `true` |

**Returns:**

```typescript
interface BankFeedResult {
  bankConnectionId: string;
  bankName: string;
  accountNumber: string;       // Masked (****1234)
  imported: number;
  duplicatesSkipped: number;
  reconciled: {
    autoMatched: number;
    highConfidence: number;
    lowConfidence: number;
    unmatched: number;
  };
  newBalance: string;
}
```

**Side Effects:**
- Imports transactions to `bank_transactions` table
- Deduplicates by `transactionId` from Plaid
- If `autoReconcile`: runs matching algorithm against GL entries
- Emits `finance.bank.transactions_imported` event

---

#### `reconcile`

Manually reconciles a bank transaction with a journal entry or creates a new entry.

```typescript
async reconcile(input: ReconcileInput): Promise<Reconciliation>
```

**Parameters:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `bankTransactionId` | `string` | ✅ | UUID of the bank transaction |
| `journalEntryId` | `string` | ❌ | UUID of matching journal entry (if exists) |
| `createEntry` | `boolean` | ❌ | Create new journal entry if no match |
| `entryDetails` | `object` | ❌ | Details for new journal entry creation |

**Returns:** `Reconciliation` record with match confirmation.

---

### Reporting Service

**Import:** `import { reportingService } from '@mcv/finance/reporting/service'`

The reporting service generates standard financial statements and custom reports.

---

#### `generatePnL`

Generates an Income Statement (Profit & Loss) report.

```typescript
async generatePnL(options: ReportOptions): Promise<IncomeStatementData>
```

**Parameters (ReportOptions):**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `dateRange` | `ReportDateRange` | ✅ | `{ type: 'period', periodId } \| { type: 'custom', start, end }` |
| `compareWith` | `string` | ❌ | `'prior_period' \| 'prior_year' \| 'budget'` |
| `filters` | `object` | ❌ | `{ departments?: string[], projects?: string[], accounts?: string[] }` |
| `groupBy` | `string[]` | ❌ | Grouping dimensions |
| `showZeroBalances` | `boolean` | ❌ | Include zero-balance accounts. Default: `false` |
| `roundToNearest` | `number` | ❌ | Round amounts. Default: `1` (no rounding) |

**Returns:**

```typescript
interface IncomeStatementData {
  title: 'Income Statement';
  subtitle: string;
  generatedAt: Date;
  sections: Array<{
    title: string;             // 'Revenue', 'Expenses'
    accounts: AccountRow[];
    subsections?: Array<{      // For expenses: COGS, Operating, etc.
      title: string;
      accounts: AccountRow[];
      subtotal: string;
    }>;
    total: string;
    priorTotal: string | null;
    variance: string | null;
  }>;
  summary: {
    grossProfit: string;
    totalExpenses: string;
    netIncome: string;
    netIncomeMargin: string;
    priorNetIncome: string | null;
    netIncomeChange: string | null;
  };
}
```

**Example:**

```typescript
const pnl = await reportingService.generatePnL({
  dateRange: { type: 'period', periodId: januaryPeriodId },
  compareWith: 'prior_year',
  showZeroBalances: false,
});
// pnl.summary.netIncome === '125000.0000'
// pnl.summary.netIncomeChange === '+15.3%'
```

---

#### `generateBalanceSheet`

Generates a Balance Sheet as of a specific date.

```typescript
async generateBalanceSheet(options: ReportOptions): Promise<BalanceSheetData>
```

**Returns:**

```typescript
interface BalanceSheetData {
  title: 'Balance Sheet';
  subtitle: string;              // "As of February 28, 2026"
  generatedAt: Date;
  sections: {
    assets: {
      currentAssets: { accounts: AccountRow[]; total: string };
      fixedAssets: { accounts: AccountRow[]; total: string };
      totalAssets: string;
    };
    liabilities: {
      currentLiabilities: { accounts: AccountRow[]; total: string };
      longTermLiabilities: { accounts: AccountRow[]; total: string };
      totalLiabilities: string;
    };
    equity: {
      accounts: AccountRow[];
      totalEquity: string;
    };
  };
  summary: {
    totalAssets: string;
    totalLiabilitiesAndEquity: string;
    isBalanced: boolean;         // MUST be true; alerts on false
    priorTotalAssets: string | null;
    priorTotalLiabilitiesAndEquity: string | null;
  };
}
```

---

#### `generateCashFlow`

Generates a Cash Flow Statement using the indirect method.

```typescript
async generateCashFlow(options: ReportOptions): Promise<CashFlowData>
```

**Returns:**

```typescript
interface CashFlowData {
  title: 'Cash Flow Statement';
  subtitle: string;
  generatedAt: Date;
  sections: {
    operating: {
      netIncome: string;
      adjustments: Array<{ description: string; amount: string }>;
      workingCapitalChanges: Array<{ description: string; amount: string }>;
      totalOperating: string;
    };
    investing: {
      items: Array<{ description: string; amount: string }>;
      totalInvesting: string;
    };
    financing: {
      items: Array<{ description: string; amount: string }>;
      totalFinancing: string;
    };
  };
  summary: {
    netCashChange: string;
    beginningCash: string;
    endingCash: string;
    priorNetCashChange: string | null;
  };
}
```

---

#### `generateAgedReceivables`

Generates an Aged Receivables (or Payables) report with standard aging buckets.

```typescript
async generateAgedReceivables(
  asOfDate?: Date
): Promise<AgedReceivablesData>
```

**Returns:**

```typescript
interface AgedReceivablesData {
  title: 'Aged Receivables';
  asOfDate: string;
  generatedAt: Date;
  customers: Array<{
    customerId: string;
    customerName: string;
    current: string;             // Not yet due
    days1to30: string;
    days31to60: string;
    days61to90: string;
    days90plus: string;
    total: string;
  }>;
  totals: {
    current: string;
    days1to30: string;
    days31to60: string;
    days61to90: string;
    days90plus: string;
    grandTotal: string;
  };
}
```

---

#### `exportReport`

Exports a report to PDF, Excel, or CSV format.

```typescript
async exportReport(
  reportType: string,
  options: ReportOptions,
  format: 'pdf' | 'excel' | 'csv'
): Promise<ExportResult>
```

**Returns:**

```typescript
interface ExportResult {
  fileUrl: string;              // Signed URL for download
  format: string;
  generatedAt: string;
  expiresAt: string;           // URL expiration
  fileSizeBytes: number;
}
```

---

#### `scheduleReport`

Configures scheduled automatic generation and delivery of a report.

```typescript
async scheduleReport(
  reportId: string,
  schedule: ScheduleConfig
): Promise<FinancialReport>
```

**Parameters (ScheduleConfig):**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `frequency` | `string` | ✅ | `'daily' \| 'weekly' \| 'monthly' \| 'quarterly'` |
| `dayOfWeek` | `number` | ❌ | 0-6 for weekly schedules |
| `dayOfMonth` | `number` | ❌ | 1-28 for monthly schedules |
| `time` | `string` | ✅ | `'HH:MM'` in 24h format |
| `timezone` | `string` | ✅ | IANA timezone (e.g., `'America/New_York'`) |
| `format` | `string` | ✅ | `'pdf' \| 'excel' \| 'csv'` |
| `recipients` | `string[]` | ✅ | Email addresses for delivery |

---

## Types & Interfaces

### Core Enums

```typescript
// Account types
type AccountType = 'asset' | 'liability' | 'equity' | 'revenue' | 'expense';

// Account subtypes
type AccountSubtype = 
  // Assets
  | 'cash' | 'accounts_receivable' | 'inventory' | 'prepaid' | 'fixed_asset' | 'intangible'
  // Liabilities
  | 'accounts_payable' | 'accrued' | 'deferred_revenue' | 'loans' | 'notes_payable'
  // Equity
  | 'owners_equity' | 'retained_earnings' | 'common_stock' | 'additional_paid_in'
  // Revenue
  | 'operating_revenue' | 'other_income' | 'interest_income'
  // Expenses
  | 'cogs' | 'operating_expense' | 'payroll' | 'depreciation' | 'interest_expense' | 'tax';

type NormalBalance = 'debit' | 'credit';

// Journal entry statuses
type JournalEntryStatus = 'draft' | 'posted' | 'reversed';

// Fiscal period statuses
type FiscalPeriodStatus = 'open' | 'closed' | 'locked';

// Invoice statuses
type InvoiceStatus = 'draft' | 'sent' | 'viewed' | 'partial' | 'paid' | 'overdue' | 'void' | 'write_off';

// Subscription statuses
type SubscriptionStatus = 'trialing' | 'active' | 'past_due' | 'cancelled' | 'paused';

// Expense statuses
type ExpenseStatus = 'draft' | 'submitted' | 'pending_approval' | 'approved' | 'rejected' | 'reimbursed' | 'cancelled';

// Expense categories
type ExpenseCategory = 'travel' | 'meals' | 'lodging' | 'transportation' | 'office_supplies' | 'software' | 'equipment' | 'professional_services' | 'marketing' | 'entertainment' | 'utilities' | 'other';

// Budget statuses
type BudgetStatus = 'draft' | 'pending_approval' | 'approved' | 'active' | 'closed';

// Budget types
type BudgetType = 'annual' | 'quarterly' | 'project' | 'department';

// Forecast methods
type ForecastMethod = 'linear' | 'seasonal' | 'ml_based';

// Scenario types
type ScenarioType = 'best_case' | 'worst_case' | 'most_likely' | 'custom';

// Report types
type ReportType = 'income_statement' | 'balance_sheet' | 'cash_flow' | 'aged_receivables' | 'aged_payables' | 'trial_balance' | 'general_ledger' | 'custom';

// Schedule frequencies
type ScheduleFrequency = 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'on_demand';

// Report formats
type ReportFormat = 'pdf' | 'excel' | 'csv';

// Integration providers
type IntegrationProvider = 'quickbooks' | 'xero' | 'stripe' | 'plaid';

// Sync directions
type SyncDirection = 'push_only' | 'pull_only' | 'bidirectional';

// Sync statuses
type SyncStatus = 'pending' | 'in_progress' | 'completed' | 'failed';

// Reconciliation statuses
type ReconciliationStatus = 'unmatched' | 'auto_matched' | 'manually_matched' | 'excluded';

// Match confidence
type MatchConfidence = 'high' | 'medium' | 'low';

// Payment terms
type PaymentTerms = 'due_on_receipt' | 'net_15' | 'net_30' | 'net_60' | 'net_90' | 'custom';

// Collection methods
type CollectionMethod = 'charge_automatically' | 'send_invoice';

// Approval levels
type ApprovalLevel = 'manager' | 'department_head' | 'finance' | 'cfo';

// Alert severities
type BudgetAlertSeverity = 'info' | 'warning' | 'critical';
```

### Entity Interfaces

```typescript
// Account
interface Account {
  id: string;
  ventureId: string;
  code: string;
  name: string;
  description: string | null;
  type: AccountType;
  subtype: AccountSubtype;
  parentId: string | null;
  currency: string;
  isActive: boolean;
  isSystemAccount: boolean;
  normalBalance: NormalBalance;
  openingBalance: string;
  currentBalance: string;
  taxCode: string | null;
  bankAccountId: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: Date;
  updatedAt: Date;
}

// Journal Entry
interface JournalEntry {
  id: string;
  ventureId: string;
  entryNumber: string;
  entryDate: Date;
  fiscalPeriodId: string | null;
  description: string;
  reference: string | null;
  sourceType: string | null;
  sourceId: string | null;
  status: JournalEntryStatus;
  postedAt: Date | null;
  postedBy: string | null;
  reversalOf: string | null;
  isAdjusting: boolean;
  totalDebit: string;
  totalCredit: string;
  attachments: unknown[] | null;
  createdAt: Date;
  updatedAt: Date;
}

// Journal Entry Line
interface JournalEntryLine {
  id: string;
  journalEntryId: string;
  accountId: string;
  lineNumber: number;
  description: string | null;
  debitAmount: string | null;
  creditAmount: string | null;
  currency: string;
  exchangeRate: string;
  baseCurrencyAmount: string | null;
  taxCode: string | null;
  taxAmount: string | null;
  departmentId: string | null;
  projectId: string | null;
  customerId: string | null;
  vendorId: string | null;
  dimensions: Record<string, unknown> | null;
}

// Invoice
interface Invoice {
  id: string;
  ventureId: string;
  invoiceNumber: string;
  customerId: string;
  status: InvoiceStatus;
  invoiceDate: Date;
  dueDate: Date;
  currency: string;
  subtotal: string;
  taxAmount: string;
  discountAmount: string;
  totalAmount: string;
  amountPaid: string;
  amountDue: string | null;
  paymentTerms: string;
  sentAt: Date | null;
  viewedAt: Date | null;
  paidAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

// Expense Report
interface ExpenseReport {
  id: string;
  ventureId: string;
  reportNumber: string;
  title: string;
  employeeId: string;
  status: ExpenseStatus;
  totalAmount: string;
  reimbursableAmount: string | null;
  nonReimbursableAmount: string | null;
  submittedAt: Date | null;
  approvedAt: Date | null;
  paidAt: Date | null;
  policyViolations: unknown[] | null;
  createdAt: Date;
  updatedAt: Date;
}

// Budget
interface Budget {
  id: string;
  ventureId: string;
  name: string;
  budgetType: BudgetType;
  status: BudgetStatus;
  startDate: Date;
  endDate: Date;
  currency: string;
  totalBudget: string;
  totalAllocated: string;
  totalActual: string;
  totalCommitted: string;
  createdAt: Date;
  updatedAt: Date;
}

// Financial Report
interface FinancialReport {
  id: string;
  ventureId: string;
  name: string;
  reportType: ReportType;
  configuration: Record<string, unknown>;
  schedule: ScheduleFrequency;
  lastRunAt: Date | null;
  nextRunAt: Date | null;
  isActive: boolean;
}
```

---

## Zod Schemas

### Input Validation

All service inputs are validated with Zod schemas before processing:

```typescript
import { z } from 'zod';

// ═══════════════════════════════════════════
// ACCOUNTING SCHEMAS
// ═══════════════════════════════════════════

export const createAccountSchema = z.object({
  code: z.string().min(1).max(20).regex(/^[0-9]+$/,
    'Account code must be numeric'),
  name: z.string().min(1).max(200),
  description: z.string().max(500).optional(),
  type: z.enum(['asset', 'liability', 'equity', 'revenue', 'expense']),
  subtype: z.enum([
    'cash', 'accounts_receivable', 'inventory', 'prepaid', 'fixed_asset',
    'intangible', 'accounts_payable', 'accrued', 'deferred_revenue', 'loans',
    'notes_payable', 'owners_equity', 'retained_earnings', 'common_stock',
    'additional_paid_in', 'operating_revenue', 'other_income', 'interest_income',
    'cogs', 'operating_expense', 'payroll', 'depreciation', 'interest_expense', 'tax',
  ]),
  parentId: z.string().uuid().optional(),
  currency: z.string().length(3).default('USD'),
  openingBalance: z.string().regex(/^-?\d+(\.\d{1,4})?$/).default('0'),
  taxCode: z.string().max(20).optional(),
});

export const journalEntryLineSchema = z.object({
  accountId: z.string().uuid(),
  description: z.string().max(500).optional(),
  debitAmount: z.string().regex(/^\d+(\.\d{1,4})?$/).optional(),
  creditAmount: z.string().regex(/^\d+(\.\d{1,4})?$/).optional(),
  currency: z.string().length(3).default('USD'),
  exchangeRate: z.number().positive().default(1),
  departmentId: z.string().uuid().optional(),
  projectId: z.string().uuid().optional(),
}).refine(
  data => (data.debitAmount && !data.creditAmount) || (!data.debitAmount && data.creditAmount),
  { message: 'Each line must have either a debit or credit amount, not both' }
);

export const createJournalEntrySchema = z.object({
  entryDate: z.coerce.date(),
  description: z.string().min(1).max(500),
  reference: z.string().max(100).optional(),
  sourceType: z.enum(['manual', 'invoice', 'expense', 'payroll', 'reversal']).optional(),
  sourceId: z.string().uuid().optional(),
  isAdjusting: z.boolean().default(false),
  lines: z.array(journalEntryLineSchema).min(2,
    'Journal entry must have at least 2 lines'),
});

// ═══════════════════════════════════════════
// BILLING SCHEMAS
// ═══════════════════════════════════════════

export const invoiceLineItemSchema = z.object({
  description: z.string().min(1).max(500),
  quantity: z.string().regex(/^\d+(\.\d{1,4})?$/).default('1'),
  unitPrice: z.string().regex(/^\d+(\.\d{1,4})?$/),
  taxable: z.boolean().default(true),
  taxRate: z.string().regex(/^\d+(\.\d{1,4})?$/).optional(),
  discountPercent: z.string().regex(/^\d+(\.\d{1,4})?$/).optional(),
  accountId: z.string().uuid().optional(),
  productId: z.string().uuid().optional(),
  periodStart: z.coerce.date().optional(),
  periodEnd: z.coerce.date().optional(),
});

export const createInvoiceSchema = z.object({
  customerId: z.string().uuid(),
  invoiceDate: z.coerce.date(),
  dueDate: z.coerce.date(),
  currency: z.string().length(3).default('USD'),
  paymentTerms: z.enum(['due_on_receipt', 'net_15', 'net_30', 'net_60', 'net_90']).default('net_30'),
  lineItems: z.array(invoiceLineItemSchema).min(1),
  billingAddress: z.object({
    line1: z.string(), line2: z.string().optional(),
    city: z.string(), state: z.string(), postalCode: z.string(), country: z.string(),
  }).optional(),
  shippingAddress: z.object({
    line1: z.string(), line2: z.string().optional(),
    city: z.string(), state: z.string(), postalCode: z.string(), country: z.string(),
  }).optional(),
  memo: z.string().max(1000).optional(),
  footer: z.string().max(1000).optional(),
  templateId: z.string().uuid().optional(),
});

export const recordPaymentSchema = z.object({
  invoiceId: z.string().uuid(),
  amount: z.string().regex(/^\d+(\.\d{1,4})?$/),
  paymentDate: z.coerce.date(),
  paymentMethod: z.enum(['bank_transfer', 'credit_card', 'check', 'cash', 'stripe']),
  paymentReference: z.string().max(200).optional(),
});

// ═══════════════════════════════════════════
// EXPENSE SCHEMAS
// ═══════════════════════════════════════════

export const createExpenseSchema = z.object({
  merchantName: z.string().min(1).max(200),
  merchantLocation: z.string().max(500).optional(),
  expenseDate: z.coerce.date(),
  category: z.enum([
    'travel', 'meals', 'lodging', 'transportation', 'office_supplies',
    'software', 'equipment', 'professional_services', 'marketing',
    'entertainment', 'utilities', 'other',
  ]),
  subcategory: z.string().max(100).optional(),
  description: z.string().min(1).max(500),
  amount: z.string().regex(/^\d+(\.\d{1,4})?$/),
  currency: z.string().length(3).default('USD'),
  isReimbursable: z.boolean().default(true),
  isBillable: z.boolean().default(false),
  customerId: z.string().uuid().optional(),
  projectId: z.string().uuid().optional(),
  departmentId: z.string().uuid().optional(),
  paymentMethod: z.enum(['personal', 'corporate_card', 'petty_cash']).optional(),
  mileage: z.number().positive().optional(),
  attendees: z.array(z.object({
    name: z.string(),
    company: z.string().optional(),
  })).optional(),
  tags: z.array(z.string()).optional(),
});

export const createExpenseReportSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(1000).optional(),
  expenseIds: z.array(z.string().uuid()).min(1),
  projectId: z.string().uuid().optional(),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
  purpose: z.string().max(500).optional(),
});

// ═══════════════════════════════════════════
// BUDGETING SCHEMAS
// ═══════════════════════════════════════════

export const budgetLineSchema = z.object({
  accountId: z.string().uuid(),
  categoryName: z.string().min(1).max(200),
  description: z.string().max(500).optional(),
  budgetAmount: z.string().regex(/^\d+(\.\d{1,4})?$/),
  periodAllocations: z.record(z.string(), z.object({
    budget: z.number(),
    actual: z.number().optional(),
  })).optional(),
  isCapex: z.boolean().default(false),
  costCenter: z.string().max(50).optional(),
});

export const createBudgetSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().max(1000).optional(),
  budgetType: z.enum(['annual', 'quarterly', 'project', 'department']),
  fiscalYearId: z.string().uuid().optional(),
  departmentId: z.string().uuid().optional(),
  projectId: z.string().uuid().optional(),
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
  currency: z.string().length(3).default('USD'),
  lines: z.array(budgetLineSchema).min(1),
});

// ═══════════════════════════════════════════
// REPORTING SCHEMAS
// ═══════════════════════════════════════════

export const reportOptionsSchema = z.object({
  dateRange: z.discriminatedUnion('type', [
    z.object({ type: z.literal('period'), periodId: z.string().uuid() }),
    z.object({ type: z.literal('custom'), start: z.coerce.date(), end: z.coerce.date() }),
  ]),
  compareWith: z.enum(['prior_period', 'prior_year', 'budget']).optional(),
  filters: z.object({
    departments: z.array(z.string().uuid()).optional(),
    projects: z.array(z.string().uuid()).optional(),
    accounts: z.array(z.string().uuid()).optional(),
  }).optional(),
  groupBy: z.array(z.enum(['department', 'project', 'customer'])).optional(),
  showZeroBalances: z.boolean().default(false),
  roundToNearest: z.number().positive().default(1),
});

export const scheduleConfigSchema = z.object({
  frequency: z.enum(['daily', 'weekly', 'monthly', 'quarterly']),
  dayOfWeek: z.number().min(0).max(6).optional(),
  dayOfMonth: z.number().min(1).max(28).optional(),
  time: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/),
  timezone: z.string(),
  format: z.enum(['pdf', 'excel', 'csv']),
  recipients: z.array(z.string().email()).min(1),
});
```

---

## Events

### Event Catalog

| Event | Payload | Emitted By |
|-------|---------|------------|
| `finance.journal_entry.created` | `{ entryId, entryNumber, totalDebit, totalCredit, sourceType }` | AccountingService |
| `finance.journal_entry.posted` | `{ entryId, entryNumber, postedBy, accountsAffected[] }` | AccountingService |
| `finance.journal_entry.reversed` | `{ entryId, reversalEntryId, reason }` | AccountingService |
| `finance.period.closed` | `{ periodId, periodName, closedBy }` | AccountingService |
| `finance.invoice.created` | `{ invoiceId, invoiceNumber, customerId, totalAmount }` | BillingService |
| `finance.invoice.sent` | `{ invoiceId, invoiceNumber, customerId, sentAt }` | BillingService |
| `finance.invoice.viewed` | `{ invoiceId, invoiceNumber, viewedAt }` | BillingService |
| `finance.invoice.paid` | `{ invoiceId, invoiceNumber, customerId, amount, journalEntryId }` | BillingService |
| `finance.invoice.overdue` | `{ invoiceId, invoiceNumber, customerId, daysOverdue, amountDue }` | BillingService |
| `finance.invoice.dunning_action` | `{ invoiceId, action, daysOverdue }` | BillingService |
| `finance.subscription.created` | `{ subscriptionId, customerId, planId }` | BillingService |
| `finance.subscription.renewed` | `{ subscriptionId, invoiceId, amount }` | BillingService |
| `finance.subscription.cancelled` | `{ subscriptionId, reason }` | BillingService |
| `finance.expense.created` | `{ expenseId, employeeId, amount, category }` | ExpenseService |
| `finance.expense.submitted` | `{ reportId, reportNumber, employeeId, totalAmount }` | ExpenseService |
| `finance.expense.approved` | `{ reportId, reportNumber, approvedBy, journalEntryId }` | ExpenseService |
| `finance.expense.rejected` | `{ reportId, reportNumber, rejectedBy, reason }` | ExpenseService |
| `finance.expense.reimbursed` | `{ reportId, reportNumber, amount, paymentMethod }` | ExpenseService |
| `finance.budget.created` | `{ budgetId, name, totalBudget }` | BudgetingService |
| `finance.budget.approved` | `{ budgetId, name, approvedBy }` | BudgetingService |
| `finance.budget.spend_recorded` | `{ budgetLineId, amount, period, newUtilization }` | BudgetingService |
| `finance.budget.alert.triggered` | `{ alertId, budgetId, severity, message, threshold }` | BudgetingService |
| `finance.budget.overspend` | `{ budgetLineId, budgetAmount, actualAmount, overageAmount }` | BudgetingService |
| `finance.integration.sync_completed` | `{ provider, direction, pushed, pulled, errors }` | IntegrationService |
| `finance.integration.sync_failed` | `{ provider, error, retryCount }` | IntegrationService |
| `finance.bank.transactions_imported` | `{ bankConnectionId, imported, reconciled }` | IntegrationService |
| `finance.reconciliation.completed` | `{ reconciliationId, matched, unmatched }` | IntegrationService |
| `finance.report.generated` | `{ reportId, reportType, format, fileUrl }` | ReportingService |

### Event Publishing

```typescript
import { eventBus } from '@mcv/kernel/events';

// Publishing an event
await eventBus.publish('finance.invoice.paid', {
  ventureId: ctx.venture.id,
  invoiceId: invoice.id,
  invoiceNumber: invoice.invoiceNumber,
  customerId: invoice.customerId,
  amount: payment.amount,
  currency: invoice.currency,
  paidAt: new Date().toISOString(),
  journalEntryId: journalEntry.id,
});
```

### Event Consumers

```typescript
import { eventBus } from '@mcv/kernel/events';

// Consuming events (in other domains or within finance)
eventBus.subscribe('finance.invoice.paid', async (event) => {
  // Push to QuickBooks/Xero
  await integrationService.syncInvoicePayment(event.data);
});

eventBus.subscribe('finance.expense.approved', async (event) => {
  // Update budget actuals
  await budgetingService.recordActualFromExpense(event.data);
});
```

---

## Error Codes

### Finance-Specific Error Codes

| Code | HTTP | Description |
|------|------|-------------|
| `FINANCE_UNBALANCED_ENTRY` | 400 | Journal entry debits do not equal credits |
| `FINANCE_PERIOD_CLOSED` | 409 | Attempted to post to a closed/locked fiscal period |
| `FINANCE_ACCOUNT_INACTIVE` | 409 | Referenced account is inactive |
| `FINANCE_DUPLICATE_ACCOUNT_CODE` | 409 | Account code already exists in venture |
| `FINANCE_ENTRY_ALREADY_POSTED` | 409 | Attempted to post an already-posted entry |
| `FINANCE_ENTRY_NOT_POSTED` | 409 | Attempted to reverse a non-posted entry |
| `FINANCE_UNPOSTED_ENTRIES_EXIST` | 409 | Attempted to close period with draft entries |
| `FINANCE_INVOICE_ALREADY_PAID` | 409 | Invoice has already been fully paid |
| `FINANCE_INVOICE_VOIDED` | 409 | Invoice has been voided |
| `FINANCE_SUBSCRIPTION_CANCELLED` | 409 | Subscription has been cancelled |
| `FINANCE_PAYMENT_EXCEEDS_DUE` | 400 | Payment amount exceeds invoice amount due |
| `FINANCE_CREDIT_EXCEEDS_BALANCE` | 400 | Credit note exceeds remaining invoice balance |
| `FINANCE_RECEIPT_REQUIRED` | 400 | Expense requires a receipt but none uploaded |
| `FINANCE_POLICY_VIOLATION` | 400 | Expense violates active policy rules |
| `FINANCE_APPROVAL_NOT_FOUND` | 404 | No pending approval for current user |
| `FINANCE_REPORT_SUBMITTED` | 409 | Expense report already submitted |
| `FINANCE_INSUFFICIENT_BUDGET` | 400 | Budget line has insufficient remaining funds |
| `FINANCE_BUDGET_LOCKED` | 409 | Budget is locked and cannot be modified |
| `FINANCE_TRANSFER_EXCEEDS_AVAILABLE` | 400 | Transfer amount exceeds available budget |
| `FINANCE_SYNC_FAILED` | 502 | External sync operation failed |
| `FINANCE_PROVIDER_UNREACHABLE` | 503 | Cannot connect to external provider |
| `FINANCE_MAPPING_NOT_FOUND` | 404 | Entity mapping not found for provider |
| `FINANCE_TOKEN_EXPIRED` | 401 | OAuth token expired and refresh failed |
| `FINANCE_RECONCILIATION_MISMATCH` | 400 | Reconciliation amounts do not match |

### Standard Kernel Error Codes (also used)

| Code | HTTP | Description |
|------|------|-------------|
| `VALIDATION_ERROR` | 400 | Input validation failed (Zod) |
| `NOT_FOUND` | 404 | Requested resource does not exist |
| `ALREADY_EXISTS` | 409 | Resource already exists (duplicate) |
| `BUSINESS_RULE_VIOLATION` | 409 | Business logic constraint violated |
| `UNAUTHORIZED` | 401 | Authentication required |
| `FORBIDDEN` | 403 | Insufficient permissions |

---

## Configuration

### Environment Variables

```bash
# ═══════════════════════════════════════════
# DATABASE
# ═══════════════════════════════════════════
DATABASE_URL=postgresql://user:pass@host:5432/mcv?schema=public
DATABASE_READ_REPLICA_URL=postgresql://user:pass@replica:5432/mcv?schema=public

# ═══════════════════════════════════════════
# REDIS
# ═══════════════════════════════════════════
REDIS_URL=redis://localhost:6379

# ═══════════════════════════════════════════
# STRIPE
# ═══════════════════════════════════════════
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_CONNECT_CLIENT_ID=ca_...

# ═══════════════════════════════════════════
# QUICKBOOKS
# ═══════════════════════════════════════════
QB_CLIENT_ID=AB...
QB_CLIENT_SECRET=...
QB_REDIRECT_URI=https://app.mcv.one/api/integrations/quickbooks/callback
QB_ENVIRONMENT=production                    # 'sandbox' | 'production'

# ═══════════════════════════════════════════
# XERO
# ═══════════════════════════════════════════
XERO_CLIENT_ID=...
XERO_CLIENT_SECRET=...
XERO_REDIRECT_URI=https://app.mcv.one/api/integrations/xero/callback

# ═══════════════════════════════════════════
# PLAID
# ═══════════════════════════════════════════
PLAID_CLIENT_ID=...
PLAID_SECRET=...
PLAID_ENVIRONMENT=production                 # 'sandbox' | 'development' | 'production'

# ═══════════════════════════════════════════
# AI (Receipt OCR, Categorization)
# ═══════════════════════════════════════════
OPENROUTER_API_KEY=sk-or-...

# ═══════════════════════════════════════════
# EVENTS
# ═══════════════════════════════════════════
REDPANDA_BROKERS=localhost:9092
```

### Runtime Configuration Constants

```typescript
// @mcv/finance/constants.ts

export const ACCOUNT_TYPES = ['asset', 'liability', 'equity', 'revenue', 'expense'] as const;

export const ACCOUNT_SUBTYPES = {
  asset: ['cash', 'accounts_receivable', 'inventory', 'prepaid', 'fixed_asset', 'intangible'],
  liability: ['accounts_payable', 'accrued', 'deferred_revenue', 'loans', 'notes_payable'],
  equity: ['owners_equity', 'retained_earnings', 'common_stock', 'additional_paid_in'],
  revenue: ['operating_revenue', 'other_income', 'interest_income'],
  expense: ['cogs', 'operating_expense', 'payroll', 'depreciation', 'interest_expense', 'tax'],
} as const;

export const PAYMENT_TERMS = {
  due_on_receipt: 0,
  net_15: 15,
  net_30: 30,
  net_60: 60,
  net_90: 90,
} as const;

export const SUPPORTED_CURRENCIES = ['USD', 'CAD', 'EUR', 'GBP', 'AUD', 'JPY', 'CHF'] as const;

export const TAX_CODES = {
  EXEMPT: { rate: 0, label: 'Tax Exempt' },
  STANDARD: { rate: 0.0875, label: 'Standard (8.75%)' },
  REDUCED: { rate: 0.05, label: 'Reduced (5%)' },
  ZERO: { rate: 0, label: 'Zero Rated' },
} as const;

export const DEFAULT_MILEAGE_RATE = 0.67; // IRS 2026 rate

export const EXPENSE_CATEGORIES = [
  'travel', 'meals', 'lodging', 'transportation', 'office_supplies',
  'software', 'equipment', 'professional_services', 'marketing',
  'entertainment', 'utilities', 'other',
] as const;

export const FISCAL_PERIOD_STATUSES = ['open', 'closed', 'locked'] as const;

export const INTEGRATION_PROVIDERS = ['quickbooks', 'xero', 'stripe', 'plaid'] as const;

export const DEFAULT_CHART_OF_ACCOUNTS = [
  { code: '1000', name: 'Current Assets', type: 'asset', subtype: 'cash' },
  { code: '1010', name: 'Cash and Cash Equivalents', type: 'asset', subtype: 'cash', parent: '1000' },
  { code: '1020', name: 'Accounts Receivable', type: 'asset', subtype: 'accounts_receivable', parent: '1000' },
  { code: '1030', name: 'Inventory', type: 'asset', subtype: 'inventory', parent: '1000' },
  { code: '2000', name: 'Current Liabilities', type: 'liability', subtype: 'accounts_payable' },
  { code: '2010', name: 'Accounts Payable', type: 'liability', subtype: 'accounts_payable', parent: '2000' },
  { code: '2020', name: 'Accrued Expenses', type: 'liability', subtype: 'accrued', parent: '2000' },
  { code: '3000', name: "Owner's Equity", type: 'equity', subtype: 'owners_equity' },
  { code: '3010', name: 'Retained Earnings', type: 'equity', subtype: 'retained_earnings', parent: '3000' },
  { code: '4000', name: 'Operating Revenue', type: 'revenue', subtype: 'operating_revenue' },
  { code: '4010', name: 'Product Sales', type: 'revenue', subtype: 'operating_revenue', parent: '4000' },
  { code: '4020', name: 'Service Revenue', type: 'revenue', subtype: 'operating_revenue', parent: '4000' },
  { code: '5000', name: 'Cost of Goods Sold', type: 'expense', subtype: 'cogs' },
  { code: '5100', name: 'Operating Expenses', type: 'expense', subtype: 'operating_expense' },
  { code: '5110', name: 'Salaries & Wages', type: 'expense', subtype: 'payroll', parent: '5100' },
  { code: '5120', name: 'Rent Expense', type: 'expense', subtype: 'operating_expense', parent: '5100' },
  { code: '5130', name: 'Utilities', type: 'expense', subtype: 'operating_expense', parent: '5100' },
] as const;
```

---

*@mcv/finance — Financial Management Domain*
