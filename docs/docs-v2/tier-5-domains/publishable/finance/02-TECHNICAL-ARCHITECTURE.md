# @mcv/finance — Technical Architecture
## Tier 5: PUBLISHABLE Domains

**Package:** `@mcv/finance`  
**Classification:** PUBLISHABLE  
**Version:** 1.0.0  
**Last Updated:** February 9, 2026

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [System Diagram](#system-diagram)
3. [Module Architecture](#module-architecture)
   - [Accounting](#module-accounting)
   - [Billing](#module-billing)
   - [Budgeting](#module-budgeting)
   - [Expenses](#module-expenses)
   - [Integrations](#module-integrations)
   - [Reporting](#module-reporting)
4. [Data Models](#data-models)
5. [Data Flow & Events](#data-flow--events)
6. [Integration Points](#integration-points)
7. [Performance](#performance)
8. [Scalability](#scalability)
9. [Error Handling](#error-handling)
10. [Observability](#observability)
11. [Security](#security)

---

## Architecture Overview

`@mcv/finance` is the comprehensive financial management domain for the MCV.ONE platform. It implements venture-level accounting, billing, budgeting, expense management, external integrations, and financial reporting — all anchored around a fully GAAP-compliant double-entry general ledger.

### Design Principles

1. **Double-Entry Invariant** — Every financial transaction across the entire system ultimately flows through the general ledger as balanced journal entries. `totalDebit === totalCredit` is enforced at the database level. No exceptions.

2. **Venture Isolation** — All financial data is partitioned by `ventureId`. Row-Level Security (RLS) policies in Supabase/PostgreSQL guarantee that ventures can never see each other's financial records, even in shared queries.

3. **Event-Driven Propagation** — Financial events (invoice created, expense approved, payment received) are published to Redpanda/Kafka topics, allowing downstream consumers (reporting, integrations, treasury) to react asynchronously without coupling.

4. **Audit Everything** — Every mutation to financial data is tracked with `createdBy`, `updatedBy`, timestamps, and soft-delete (`deletedAt`). Critical operations (posting, period closing, reversals) maintain explicit audit fields and cannot be undone — only reversed.

5. **Separation from Treasury** — `@mcv/finance` operates at the venture level. `@mcv/treasury` operates at the consortium level (cross-venture cash management, funding rounds, consolidated reporting). Finance feeds data upstream to Treasury; Treasury does not modify Finance data.

6. **Precision Arithmetic** — All monetary values use `numeric(19, 4)` in PostgreSQL and `Decimal.js` in TypeScript. No floating-point math is ever applied to financial calculations.

### Technology Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Runtime** | Next.js 15 (App Router) | Server Actions, API routes, React Server Components |
| **Monorepo** | Turborepo | Build orchestration, dependency graph |
| **Database** | Supabase/PostgreSQL | Primary datastore with RLS, JSONB, full-text search |
| **ORM** | Drizzle ORM | Type-safe schema definitions, migrations, query builder |
| **Validation** | Zod | Runtime schema validation for all inputs |
| **Events** | Redpanda/Kafka | Async event streaming for cross-domain communication |
| **AI** | OpenRouter | Receipt OCR, expense categorization, anomaly detection |
| **Cache** | Redis | Computed balance caching, rate limiting, session state |
| **Payments** | Stripe Connect | Payment processing, payment links, platform fees |
| **Banking** | Plaid | Bank feed connections, transaction import |
| **External Sync** | QuickBooks Online, Xero | Bidirectional accounting data synchronization |

### Package Dependencies

```
@mcv/finance
├── @mcv/kernel          # Database, context, auth, errors, base columns
├── @mcv/payments        # Stripe payment processing, Connect integration
├── @mcv/documents       # PDF generation (invoices, reports), file storage
├── @mcv/notifications   # Email, SMS, push notification delivery
├── @mcv/people          # Employee data for expense management, payroll
├── @mcv/commerce        # Revenue events for automatic invoice generation
└── @mcv/treasury        # Upstream: consolidated reporting, cash management
```

---

## System Diagram

```
┌──────────────────────────────────────────────────────────────────────────────────────┐
│                          @mcv/finance — SYSTEM ARCHITECTURE                          │
│                                                                                      │
│  ┌────────────────────────────────────────────────────────────────────────────────┐  │
│  │                              ENTRY POINTS                                      │  │
│  │                                                                                │  │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │  │
│  │  │  API Routes   │  │  Cron Jobs   │  │  Webhooks    │  │ NAOS Agents  │      │  │
│  │  │ /api/finance  │  │  Renewals    │  │ Stripe/Plaid │  │  CFO Agent   │      │  │
│  │  │ /api/billing  │  │  Reminders   │  │ QuickBooks   │  │  Bookkeeper  │      │  │
│  │  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘      │  │
│  │         └─────────────────┴─────────────────┴─────────────────┘                │  │
│  │                                    │                                            │  │
│  └────────────────────────────────────┼────────────────────────────────────────────┘  │
│                                       ▼                                                │
│  ┌────────────────────────────────────────────────────────────────────────────────┐  │
│  │                           SERVICE LAYER (6 Submodules)                          │  │
│  │                                                                                │  │
│  │  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐               │  │
│  │  │   ACCOUNTING     │  │    BILLING       │  │    BUDGETING     │               │  │
│  │  │                  │  │                  │  │                  │               │  │
│  │  │ Chart of Accts   │  │ Invoices (V2)    │  │ Budget plans     │               │  │
│  │  │ Journal entries  │  │ Proposals        │  │ Allocations      │               │  │
│  │  │ Posting/Reversal │  │ Estimates        │  │ Forecasting      │               │  │
│  │  │ Trial balance    │  │ Subscriptions    │  │ Scenarios        │               │  │
│  │  │ Period closing   │  │ Credit notes     │  │ Transfers        │               │  │
│  │  │ Recurring JEs    │  │ Recurring inv.   │  │ Alerts           │               │  │
│  │  │                  │  │ Platform fees    │  │ BvA compare      │               │  │
│  │  │                  │  │ Dunning rules    │  │                  │               │  │
│  │  └────────┬─────────┘  └────────┬─────────┘  └────────┬─────────┘               │  │
│  │           │                     │                      │                         │  │
│  │  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐               │  │
│  │  │   EXPENSES       │  │   INTEGRATIONS   │  │    REPORTING     │               │  │
│  │  │                  │  │                  │  │                  │               │  │
│  │  │ Expense CRUD     │  │ QuickBooks sync  │  │ Income stmt      │               │  │
│  │  │ Receipt OCR      │  │ Xero sync        │  │ Balance sheet    │               │  │
│  │  │ Policy check     │  │ Plaid bank feeds │  │ Cash flow        │               │  │
│  │  │ Approval chain   │  │ Auto-matching    │  │ Aged AR/AP       │               │  │
│  │  │ Reimbursement    │  │ Reconciliation   │  │ Custom reports   │               │  │
│  │  │ Corporate cards  │  │ Entity mapping   │  │ Scheduled runs   │               │  │
│  │  │ Analytics        │  │ Sync logs        │  │ Export PDF/XL    │               │  │
│  │  └────────┬─────────┘  └────────┬─────────┘  └────────┬─────────┘               │  │
│  │           │                     │                      │                         │  │
│  └───────────┴─────────────────────┴──────────────────────┴─────────────────────────┘  │
│                                       │                                                │
│                                       ▼                                                │
│  ┌────────────────────────────────────────────────────────────────────────────────┐  │
│  │                      GENERAL LEDGER (Accounting Core)                          │  │
│  │                                                                                │  │
│  │  Every financial event produces journal entries here.                           │  │
│  │  Billing → AR entries. Expenses → AP entries. Payments → Cash entries.         │  │
│  │  All reporting reads from the ledger. Integrations sync the ledger.            │  │
│  │                                                                                │  │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐       │  │
│  │  │ Accounts │  │ JE Hdrs  │  │ JE Lines │  │ Balances │  │ Periods  │       │  │
│  │  │  (CoA)   │  │(Entries) │  │(Dr / Cr) │  │(Snapshot)│  │ (Fiscal) │       │  │
│  │  └──────────┘  └──────────┘  └──────────┘  └──────────┘  └──────────┘       │  │
│  └────────────────────────────────────────────────────────────────────────────────┘  │
│                                       │                                                │
│                                       ▼                                                │
│  ┌────────────────────────────────────────────────────────────────────────────────┐  │
│  │                      DATABASE LAYER (PostgreSQL + RLS)                          │  │
│  │                                                                                │  │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌────────┐│  │
│  │  │Accounting│ │ Expenses │ │Budgeting │ │Reporting │ │ Billing  │ │Integr. ││  │
│  │  │ 8 tables │ │ 6 tables │ │ 5 tables │ │ 4 tables │ │18 tables │ │5 tables││  │
│  │  └──────────┘ └──────────┘ └──────────┘ └──────────┘ └──────────┘ └────────┘│  │
│  │                                                                                │  │
│  │  Treasury (Live): pnl_entries | cash_operations | budgets | expenses | funding │  │
│  └────────────────────────────────────────────────────────────────────────────────┘  │
│                                       │                                                │
│                                       ▼                                                │
│  ┌────────────────────────────────────────────────────────────────────────────────┐  │
│  │                        EXTERNAL DEPENDENCIES                                    │  │
│  │                                                                                │  │
│  │  @mcv/kernel        @mcv/payments       @mcv/documents     @mcv/notifications  │  │
│  │  (DB, context,      (Stripe payment     (PDF generation,   (Email, SMS,        │  │
│  │   errors, auth)      processing)         file storage)      push alerts)       │  │
│  │                                                                                │  │
│  │  Stripe Connect     QuickBooks Online   Xero               Plaid               │  │
│  │  (Platform fees,    (GL sync,           (GL sync,          (Bank feeds,         │  │
│  │   payment links)     invoice push)       invoice push)      transactions)      │  │
│  └────────────────────────────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────────────────────────────┘
```

### Layered Architecture Summary

| Layer | Responsibility | Components |
|-------|---------------|------------|
| **Entry Points** | Receive requests from users, cron schedulers, external webhooks, and NAOS AI agents | API Routes, Server Actions, Cron Jobs, Webhooks |
| **Service Layer** | Business logic, validation, orchestration across 6 submodules | AccountingService, BillingService, BudgetingService, ExpenseService, IntegrationService, ReportingService |
| **General Ledger** | Core double-entry engine, single source of truth | Accounts, Journal Entries, Lines, Balances, Fiscal Periods |
| **Database Layer** | Persistence, RLS enforcement, indexing, full-text search | 46 tables across 6 submodules + Treasury live tables |
| **External Layer** | Platform dependencies and third-party integrations | Kernel, Payments, Documents, Notifications, Stripe, QB, Xero, Plaid |

---

## Module Architecture

### Module: Accounting

**Path:** `@mcv/finance/accounting`  
**Tables:** 8 (`finance_accounts`, `finance_fiscal_years`, `finance_fiscal_periods`, `finance_journal_entries`, `finance_journal_entry_lines`, `finance_account_balances`, `finance_recurring_journals`, plus `accountTypeEnum` / `accountSubtypeEnum` as pg enums)  
**Service:** `AccountingService` → exported as `accountingService`

#### Purpose

Implements the foundational double-entry bookkeeping system with a hierarchical chart of accounts (CoA), automated journal entry lifecycle (draft → posted → reversed), multi-currency support with exchange rate tracking, fiscal period management with opening/closing procedures, and a recurring journal engine for month-end automation.

Every financial transaction across the entire Finance domain — invoices, expenses, payments, reimbursements — ultimately flows through the general ledger as balanced journal entries. This is the backbone.

#### Internal Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     ACCOUNTING MODULE                            │
│                                                                  │
│  ┌──────────────────────┐    ┌──────────────────────┐          │
│  │  Chart of Accounts   │    │  Fiscal Periods       │          │
│  │  ─────────────────   │    │  ──────────────────   │          │
│  │  • Hierarchical tree │    │  • Year → Months      │          │
│  │  • 5 account types   │    │  • open/closed/locked │          │
│  │  • Subtypes + codes  │    │  • Balance snapshots   │          │
│  │  • Parent-child refs │    │  • Carry-forward       │          │
│  │  • Normal balance    │    │                        │          │
│  └──────────┬───────────┘    └──────────┬─────────────┘          │
│             │                           │                        │
│             ▼                           ▼                        │
│  ┌─────────────────────────────────────────────────────┐       │
│  │              JOURNAL ENTRY ENGINE                    │       │
│  │  ─────────────────────────────────────────────────   │       │
│  │  • Create (validate balance: DR = CR)                │       │
│  │  • Post (update account balances, lock entry)        │       │
│  │  • Reverse (create mirror entry, post automatically) │       │
│  │  • Auto-number: JE-{year}-{000001}                   │       │
│  │  • Source tracking (invoice, expense, payroll, etc.) │       │
│  └──────────┬──────────────────────────────┬────────────┘       │
│             │                              │                     │
│             ▼                              ▼                     │
│  ┌──────────────────────┐    ┌──────────────────────┐          │
│  │  Account Balances    │    │  Recurring Journals   │          │
│  │  ─────────────────   │    │  ──────────────────   │          │
│  │  • Period snapshots  │    │  • Template entries    │          │
│  │  • Opening/Closing   │    │  • Frequency config    │          │
│  │  • Net change calc   │    │  • Auto-post option    │          │
│  │  • Carry-forward     │    │  • Next run tracking   │          │
│  └──────────────────────┘    └──────────────────────┘          │
│                                                                  │
│  ┌─────────────────────────────────────────────────────┐       │
│  │              TRIAL BALANCE                           │       │
│  │  Aggregates all account closing balances for a       │       │
│  │  given fiscal period. Validates DR total = CR total. │       │
│  └─────────────────────────────────────────────────────┘       │
└─────────────────────────────────────────────────────────────────┘
```

#### Chart of Accounts Structure

The CoA follows a standardized hierarchical numbering scheme:

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

Accounts are stored as a self-referential tree (`parentId → accounts.id`). The `code` field determines sort order. The `type` field (asset/liability/equity/revenue/expense) determines normal balance behavior. The `subtype` provides finer classification for reporting grouping.

#### Journal Entry Lifecycle

```
                    ┌──────────┐
                    │  CREATE   │  Validate DR = CR, assign entry number
                    │  (draft)  │  Link to fiscal period, attach source
                    └─────┬────┘
                          │
                          ▼
                    ┌──────────┐
                    │   POST    │  Update account.currentBalance
                    │ (posted)  │  Update accountBalances per period
                    └─────┬────┘  Set postedAt, postedBy, lock entry
                          │
                    ┌─────┴─────────────────────┐
                    │                             │
                    ▼                             ▼
             ┌──────────┐                 ┌──────────────┐
             │  REVERSE  │                 │  (immutable)  │
             │(reversed) │                 │  Entry stays  │
             └─────┬────┘                 │  in ledger    │
                   │                       └──────────────┘
                   ▼
             ┌──────────────────┐
             │  NEW REVERSAL JE  │
             │  (auto-posted)    │
             │  DR↔CR swapped    │
             └──────────────────┘
```

#### Key Behaviors

| Behavior | Detail |
|----------|--------|
| **Balance enforcement** | Every journal entry validates `totalDebit === totalCredit` before saving. Unbalanced entries throw `VALIDATION_ERROR`. Enforced in both application layer and via database CHECK constraint. |
| **Normal balance** | Assets and Expenses have debit normal balances; Liabilities, Equity, and Revenue have credit normal balances. This determines how `currentBalance` is calculated on each account. |
| **Period protection** | Journal entries cannot be posted to closed or locked fiscal periods. Throws `BUSINESS_RULE_VIOLATION`. |
| **Reversal semantics** | Reversing a posted entry creates a new entry with debits and credits swapped, then auto-posts it. Original entry status changes to `reversed`. Original entry is never modified or deleted. |
| **Auto-numbering** | Entry numbers follow `JE-{year}-{sequence}` with zero-padded 6-digit sequences (e.g., `JE-2026-000042`). Sequence is per-venture per-year. |
| **Multi-currency** | Each journal entry line supports an independent currency with an exchange rate. The `baseCurrencyAmount` is computed as `amount × exchangeRate` for reporting in the venture's base currency. |
| **Dimensional tracking** | Lines can be tagged with `departmentId`, `projectId`, `customerId`, `vendorId`, and freeform `dimensions` JSONB for multi-dimensional reporting. |
| **Source linking** | Every JE tracks its `sourceType` (manual, invoice, expense, payroll, reversal) and `sourceId` for full traceability back to the originating business event. |

#### Precision & Arithmetic

All monetary columns use `numeric(19, 4)` — supporting values up to ±999,999,999,999,999.9999. All TypeScript calculations use `Decimal.js` to avoid IEEE 754 floating-point errors:

```typescript
import Decimal from 'decimal.js';

// CORRECT: Precise arithmetic
const totalDebit = new Decimal('100.10').plus('200.20'); // "300.30"

// WRONG: Floating-point
const bad = 100.10 + 200.20; // 300.30000000000004
```

---

### Module: Billing

**Path:** `@mcv/finance/billing`  
**Tables:** 18 (core: `finance_invoices`, `finance_invoice_line_items`, `finance_subscriptions`, `finance_billing_plans`, `finance_payment_schedules`, `finance_scheduled_payments`, `finance_credit_notes`, `finance_dunning_rules`; V2: `invoice_templates`, `invoices_v2`, `proposals`, `recurring_invoices`, `estimates`, `approval_workflows`, `approval_requests`, `approval_decisions`, `platform_fee_configs`, `platform_fee_ledger`, `payment_receipts`)  
**Service:** `BillingService` → exported as `billingService`

#### Purpose

Manages the full billing lifecycle: customer invoice creation with branded templates, sales proposals with e-signatures, estimates with versioning and progress invoicing, recurring invoice generation, subscription management with plan definitions, credit notes, installment payment schedules, dunning automation, and Stripe Connect platform fee management.

Two schema layers coexist:
- **Core Billing** — Full-featured accounting-integrated billing system (`finance_invoices`, `finance_subscriptions`)
- **Advanced Invoicing V2** — Production invoicing with branded templates, Stripe payment links, approval workflows, and platform fees (`invoices_v2`, `proposals`, `estimates`)

#### Internal Architecture

```
┌──────────────────────────────────────────────────────────────────────────┐
│                          BILLING MODULE                                   │
│                                                                           │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐         │
│  │  INVOICES (V2)   │  │   PROPOSALS      │  │   ESTIMATES      │         │
│  │                  │  │                  │  │                  │         │
│  │  • Draft→Sent→   │  │  • Content blocks│  │  • Versioning    │         │
│  │    Viewed→Paid   │  │  • E-signatures  │  │  • Progress inv. │         │
│  │  • Branded tmpl  │  │  • Convert to    │  │  • Convert to    │         │
│  │  • Stripe links  │  │    invoice       │  │    invoice       │         │
│  │  • Reminders     │  │  • Expiration    │  │  • Acceptance     │         │
│  └────────┬─────────┘  └────────┬─────────┘  └────────┬─────────┘         │
│           │                     │                      │                   │
│           └─────────────────────┴──────────────────────┘                   │
│                                 │                                          │
│                                 ▼                                          │
│  ┌──────────────────────────────────────────────────────────────┐        │
│  │                    INVOICE TEMPLATES                          │        │
│  │  • Logo, colors, header/footer HTML                          │        │
│  │  • Tax config (rates, labels, inclusive/exclusive)            │        │
│  │  • Number prefix + auto-increment                            │        │
│  │  • Default payment terms and notes                           │        │
│  └──────────────────────────────────────────────────────────────┘        │
│                                                                           │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐         │
│  │  SUBSCRIPTIONS   │  │  RECURRING INV.  │  │  CREDIT NOTES   │         │
│  │                  │  │                  │  │                  │         │
│  │  • Plan-based    │  │  • Schedule gen  │  │  • Full/partial  │         │
│  │  • Trial periods │  │  • Auto-send     │  │  • Apply to inv. │         │
│  │  • Proration     │  │  • Revenue track │  │  • Void support  │         │
│  │  • Pause/Resume  │  │  • Template cfg  │  │  • GL reversal   │         │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘         │
│                                                                           │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐         │
│  │  PAYMENT SCHED.  │  │  DUNNING RULES   │  │  PLATFORM FEES   │         │
│  │                  │  │                  │  │                  │         │
│  │  • Installments  │  │  • Step-based    │  │  • % / flat /    │         │
│  │  • Auto-charge   │  │  • Email→SMS→    │  │    tiered        │         │
│  │  • Tracking      │  │    pause→cancel  │  │  • Per-venture   │         │
│  │                  │  │  • Retry logic   │  │  • Fee ledger    │         │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘         │
│                                                                           │
│  ┌──────────────────────────────────────────────────────────────┐        │
│  │                  APPROVAL WORKFLOWS (V2)                      │        │
│  │  • Multi-step approval chains for high-value invoices         │        │
│  │  • Rule-based routing (amount thresholds, venture, customer) │        │
│  │  • Decision tracking with timestamps and comments             │        │
│  └──────────────────────────────────────────────────────────────┘        │
└──────────────────────────────────────────────────────────────────────────┘
```

#### Invoice Lifecycle (V2)

```
  ┌─────────┐   send    ┌─────────┐   view    ┌─────────┐
  │  DRAFT   │─────────▶│  SENT    │─────────▶│  VIEWED  │
  └─────────┘           └─────────┘           └────┬────┘
                                                    │
                                        ┌───────────┼───────────┐
                                        ▼           │           ▼
                                 ┌──────────┐       │    ┌──────────┐
                                 │ PARTIAL   │       │    │  PAID     │
                                 │ (payment  │       │    │ (full     │
                                 │  applied) │───────┘    │  payment) │
                                 └──────────┘             └──────────┘
                                        │
                         past due        ▼
                                 ┌──────────┐
                                 │ OVERDUE   │──── dunning steps activate
                                 └──────────┘
                                        │
                              ┌─────────┼─────────┐
                              ▼                   ▼
                       ┌──────────┐        ┌──────────┐
                       │  VOID     │        │WRITE_OFF │
                       └──────────┘        └──────────┘
```

#### Invoice → Ledger Data Flow

When an invoice is created and sent, the billing module automatically creates journal entries in the accounting module:

```
Invoice Created (status: sent)
    │
    ▼
┌─────────────────────────────────────────────┐
│  Journal Entry: Revenue Recognition          │
│  DR: Accounts Receivable (1020)    $1,000   │
│  CR: Revenue - Product Sales (4010) $1,000  │
│  sourceType: 'invoice'                       │
│  sourceId: invoice.id                        │
└─────────────────────────────────────────────┘
    │
    ▼  (customer pays)
┌─────────────────────────────────────────────┐
│  Journal Entry: Payment Receipt              │
│  DR: Cash (1010)                    $1,000   │
│  CR: Accounts Receivable (1020)     $1,000  │
│  sourceType: 'payment'                       │
│  sourceId: payment.id                        │
└─────────────────────────────────────────────┘
```

#### Dunning Automation

Dunning rules define a step-based escalation sequence for overdue invoices:

```typescript
// Example dunning rule configuration
{
  steps: [
    { daysOverdue: 1,  action: 'email', template: 'payment_reminder' },
    { daysOverdue: 7,  action: 'email', template: 'payment_reminder_2' },
    { daysOverdue: 14, action: 'sms',   template: 'payment_urgent' },
    { daysOverdue: 30, action: 'pause_subscription' },
    { daysOverdue: 60, action: 'cancel_subscription' },
  ],
  maxRetries: 4,
  retrySchedule: [1, 3, 7, 14]  // days between payment retries
}
```

A cron job runs daily to evaluate all overdue invoices against their venture's dunning rules, triggering the appropriate action at each step.

#### Platform Fee Management (Stripe Connect)

For ventures using Stripe Connect, the platform can configure per-venture fee structures:

| Fee Type | Configuration | Example |
|----------|--------------|---------|
| **Percentage** | `feePercent: 2.50` | 2.5% of every payment |
| **Flat** | `flatFeeCents: 50` | $0.50 per transaction |
| **Tiered** | Volume brackets | 3% up to $10K, 2% $10K-$50K, 1.5% above |
| **Capped** | `cappedAt: 5000` | Max $50.00 per transaction |

The `platform_fee_ledger` table provides a complete audit trail of every fee charged, enabling reconciliation and reporting.

---

### Module: Budgeting

**Path:** `@mcv/finance/budgeting`  
**Tables:** 5 (`finance_budgets`, `finance_budget_lines`, `finance_budget_transfers`, `finance_budget_forecasts`, `finance_budget_scenarios`, `finance_budget_alerts`)  
**Service:** `BudgetingService` → exported as `budgetingService`

#### Purpose

Enables budget planning and allocation across departments, projects, and cost centers. Tracks actuals against budgets in real time, generates forecasts using multiple methods (linear, seasonal, ML-based), and supports what-if scenario analysis for strategic planning.

#### Internal Architecture

```
┌────────────────────────────────────────────────────────────────────────┐
│                         BUDGETING MODULE                                │
│                                                                         │
│  ┌──────────────────────────────────────────────────────────────┐     │
│  │                    BUDGET MANAGEMENT                          │     │
│  │                                                               │     │
│  │  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐   │     │
│  │  │  Budget       │    │ Budget Lines  │    │  Transfers    │   │     │
│  │  │  Headers      │───▶│ (GL-linked)  │◀──▶│ (Inter-line)  │   │     │
│  │  │              │    │              │    │              │   │     │
│  │  │ annual/qtr/  │    │ account_id   │    │ from → to    │   │     │
│  │  │ project/dept │    │ allocations  │    │ approval req │   │     │
│  │  └──────────────┘    └──────┬───────┘    └──────────────┘   │     │
│  │                              │                                │     │
│  └──────────────────────────────┼────────────────────────────────┘     │
│                                 │                                       │
│  ┌──────────────────────────────┼────────────────────────────────┐     │
│  │                    ANALYTICS ENGINE                            │     │
│  │                              │                                 │     │
│  │  ┌──────────────┐    ┌──────┴───────┐    ┌──────────────┐   │     │
│  │  │  Forecasting  │    │ Budget vs    │    │  Scenarios    │   │     │
│  │  │              │    │ Actual       │    │              │   │     │
│  │  │ Linear       │    │              │    │ Best case     │   │     │
│  │  │ Seasonal     │    │ Variance     │    │ Worst case    │   │     │
│  │  │ ML-based     │    │ % deviation  │    │ Most likely   │   │     │
│  │  │ Confidence   │    │ Period drill │    │ Custom        │   │     │
│  │  └──────────────┘    └──────────────┘    └──────────────┘   │     │
│  │                                                               │     │
│  └───────────────────────────────────────────────────────────────┘     │
│                                                                         │
│  ┌──────────────────────────────────────────────────────────────┐     │
│  │                    ALERT SYSTEM                                │     │
│  │                                                               │     │
│  │  Threshold monitoring: 75% → warning, 90% → warning,         │     │
│  │  100% → critical. Auto-created on budget approval.           │     │
│  │  Real-time evaluation on every actual recording.             │     │
│  │                                                               │     │
│  └──────────────────────────────────────────────────────────────┘     │
└────────────────────────────────────────────────────────────────────────┘
```

#### Budget Lifecycle

```
  ┌─────────┐  submit   ┌───────────────────┐  approve  ┌──────────┐
  │  DRAFT   │─────────▶│ PENDING_APPROVAL   │─────────▶│ APPROVED  │
  └─────────┘           └───────────────────┘           └────┬─────┘
                                                              │
                                                    activate  │
                                                              ▼
                                                       ┌──────────┐
                                                       │  ACTIVE   │
                                                       │           │
                                                       │ Tracking  │
                                                       │ actuals   │
                                                       └────┬─────┘
                                                              │
                                                     close    │
                                                              ▼
                                                       ┌──────────┐
                                                       │  CLOSED   │
                                                       └──────────┘
```

#### Key Behaviors

| Behavior | Detail |
|----------|--------|
| **Auto-distribution** | When budget lines don't specify period allocations, the total is distributed evenly across all months in range. |
| **Threshold alerts** | On approval, the system creates monitoring alerts at 75%, 90%, and 100% utilization. Critical severity at 100%. |
| **Variance tracking** | Every actual recording recalculates `variance = budget - actual` and `variancePercent`, then evaluates alert thresholds. |
| **Transfer validation** | Budget transfers validate `available = budget - actual - committed` on the source line before allowing. |
| **Forecast methods** | Linear regression for simple trends, seasonal decomposition for cyclical patterns, ML-based (via OpenRouter) for complex historical analysis. |
| **GL linkage** | Every budget line is linked to a GL account via `accountId`, enabling automatic actual tracking from posted journal entries. |
| **Scenario analysis** | Scenarios apply percentage factors or absolute overrides to budget lines, projecting adjusted totals without modifying the approved budget. |

#### Period Allocations

Budget lines support granular monthly allocation via the `periodAllocations` JSONB field:

```typescript
{
  '2026-01': { budget: 12000, actual: 11500 },
  '2026-02': { budget: 10000, actual: 9800 },
  '2026-03': { budget: 15000, actual: 0 },
  // ...
}
```

This enables month-over-month variance analysis and period-specific forecasting.

---

### Module: Expenses

**Path:** `@mcv/finance/expenses`  
**Tables:** 6 (`finance_expense_reports`, `finance_expenses`, `finance_expense_policies`, `finance_expense_approvals`, `finance_expense_approval_workflows`, `finance_corporate_cards`, `finance_card_transactions`)  
**Service:** `ExpenseService` → exported as `expenseService`

#### Purpose

Manages the full expense lifecycle: creation, receipt capture with OCR, policy validation, multi-level approval workflows, automatic GL entry generation, and reimbursement processing. Includes corporate card management and transaction matching.

#### Internal Architecture

```
┌───────────────────────────────────────────────────────────────────────────────┐
│                            EXPENSES MODULE                                     │
│                                                                                │
│  ┌──────────────────┐    ┌──────────────────┐    ┌──────────────────┐        │
│  │  EXPENSE CRUD     │    │  RECEIPT ENGINE   │    │  POLICY ENGINE   │        │
│  │                   │    │                   │    │                  │        │
│  │  • Create expense │    │  • Upload receipt │    │  • Per-diem      │        │
│  │  • Edit/Delete    │    │  • OCR extraction │    │  • Categories    │        │
│  │  • Mileage calc   │    │  • Auto-fill data │    │  • Merchants     │        │
│  │  • Multi-currency │    │  • Status tracking│    │  • Receipt rules │        │
│  │  • Categorization │    │  • AI categorize  │    │  • Role/Dept     │        │
│  └────────┬─────────┘    └────────┬─────────┘    └────────┬─────────┘        │
│           │                       │                        │                   │
│           └───────────────────────┴────────────────────────┘                   │
│                                   │                                            │
│                                   ▼                                            │
│  ┌──────────────────────────────────────────────────────────────────┐         │
│  │                    EXPENSE REPORTS                                │         │
│  │                                                                   │         │
│  │  Group expenses → validate receipts → submit → approval chain    │         │
│  │                                                                   │         │
│  └──────────────────────────────┬────────────────────────────────────┘         │
│                                 │                                              │
│                                 ▼                                              │
│  ┌──────────────────────────────────────────────────────────────────┐         │
│  │                    APPROVAL WORKFLOW ENGINE                       │         │
│  │                                                                   │         │
│  │  Level 1: Direct Manager (any amount)                            │         │
│  │  Level 2: Department Head ($1,000+)                              │         │
│  │  Level 3: Finance Team ($5,000+)                                 │         │
│  │  Level 4: CFO ($10,000+)                                        │         │
│  │                                                                   │         │
│  │  Features: delegation, escalation, reminders, SLA tracking       │         │
│  └──────────────────────────────┬────────────────────────────────────┘         │
│                                 │                                              │
│                    ┌────────────┼────────────┐                                │
│                    ▼                         ▼                                 │
│  ┌──────────────────────┐   ┌──────────────────────┐                         │
│  │  GL ENTRY CREATION   │   │  REIMBURSEMENT        │                         │
│  │                      │   │                        │                         │
│  │  DR: Expense accounts│   │  DR: AP Employee       │                         │
│  │  CR: AP Employee     │   │  CR: Cash              │                         │
│  │  (auto on approval)  │   │  (manual trigger)      │                         │
│  └──────────────────────┘   └──────────────────────┘                         │
│                                                                                │
│  ┌──────────────────────────────────────────────────────────────────┐         │
│  │                    CORPORATE CARD MANAGEMENT                      │         │
│  │                                                                   │         │
│  │  • Card issuance (physical/virtual)                              │         │
│  │  • Spend limits (daily/weekly/monthly)                           │         │
│  │  • MCC-based blocking                                            │         │
│  │  • Transaction import & auto-matching to expenses                │         │
│  └──────────────────────────────────────────────────────────────────┘         │
└───────────────────────────────────────────────────────────────────────────────┘
```

#### Approval Workflow State Machine

```
┌──────────┐   submit    ┌───────────┐   Level 1    ┌──────────────────┐
│          │────────────▶│           │──────────────▶│                  │
│  DRAFT   │             │ SUBMITTED │              │ PENDING_APPROVAL │
│          │◀────────────│           │              │                  │
└──────────┘   recall    └───────────┘              └────────┬─────────┘
                                                              │
                                              ┌───────────────┴───────────────┐
                                              │ approve                reject │
                                              ▼                               ▼
                                    ┌──────────────────┐           ┌──────────┐
                                    │ Next level?       │           │ REJECTED │
                                    │                   │           └──────────┘
                                    │ YES → loop back   │
                                    │ NO  → APPROVED    │
                                    └──────────┬───────┘
                                               │ all approved
                                               ▼
                                    ┌──────────────────┐
                                    │    APPROVED       │
                                    │ (GL entry auto-   │
                                    │  created here)    │
                                    └──────────┬───────┘
                                               │ reimburse
                                               ▼
                                    ┌──────────────────┐
                                    │   REIMBURSED      │
                                    │ (payment entry    │
                                    │  auto-created)    │
                                    └──────────────────┘
```

#### Key Behaviors

| Behavior | Detail |
|----------|--------|
| **Policy enforcement** | Every expense is validated at creation against the employee's applicable policy. Violations are recorded but don't block creation — they flag the expense for reviewer attention. |
| **Receipt requirements** | Policies define when receipts are required (e.g., above $25, always for lodging/equipment). Missing receipts block report submission. |
| **Automatic GL entries** | On approval: `DR: Expense accounts, CR: AP - Employee Reimbursements`. On reimbursement: `DR: AP, CR: Cash`. |
| **Multi-level approval** | Levels cascade based on amount thresholds. Level 1 activates on submit; subsequent levels activate only after prior level approves. |
| **OCR integration** | Receipt uploads are processed via OpenRouter AI to auto-fill merchant name, amount, date, and category. |
| **Mileage calculation** | Transportation expenses with mileage data auto-calculate reimbursement: `mileage × mileageRate` (default $0.67/mi). |
| **Corporate cards** | Card transactions are imported and auto-matched to expenses by amount, merchant, and date. Unmatched transactions are flagged for manual review. |

---

### Module: Integrations

**Path:** `@mcv/finance/integrations`  
**Tables:** 5 (`finance_accounting_integrations`, `finance_integration_mappings`, `finance_integration_sync_logs`, `finance_bank_connections`, `finance_bank_transactions`, `finance_reconciliations`)  
**Service:** `IntegrationService` → exported as `integrationService`

#### Purpose

Provides bidirectional synchronization with external accounting platforms (QuickBooks Online, Xero), bank feed connections via Plaid for transaction import, and automated bank reconciliation with intelligent matching.

#### Internal Architecture

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                         INTEGRATIONS MODULE                                   │
│                                                                               │
│  ┌──────────────────────────────────────────────────────────────────┐       │
│  │                  PROVIDER CONNECTORS                              │       │
│  │                                                                   │       │
│  │  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐  │       │
│  │  │  QUICKBOOKS      │  │     XERO         │  │     PLAID       │  │       │
│  │  │                  │  │                  │  │                  │  │       │
│  │  │  OAuth2 connect  │  │  OAuth2 connect  │  │  Link connect   │  │       │
│  │  │  Push invoices   │  │  Push invoices   │  │  Import txns    │  │       │
│  │  │  Pull GL data    │  │  Pull GL data    │  │  Real-time feed │  │       │
│  │  │  Sync customers  │  │  Sync contacts   │  │  Multi-bank     │  │       │
│  │  │  Bidirectional   │  │  Bidirectional   │  │  Auto-categorize│  │       │
│  │  └─────────────────┘  └─────────────────┘  └─────────────────┘  │       │
│  └──────────────────────────────┬────────────────────────────────────┘       │
│                                 │                                            │
│  ┌──────────────────────────────┼────────────────────────────────────┐       │
│  │                  ENTITY MAPPING ENGINE                             │       │
│  │                                                                   │       │
│  │  Maps MCV entity IDs to external IDs for each provider:          │       │
│  │  • Account → QB Account / Xero Account                          │       │
│  │  • Invoice → QB Invoice / Xero Invoice                          │       │
│  │  • Customer → QB Customer / Xero Contact                        │       │
│  │  • Vendor → QB Vendor / Xero Contact                            │       │
│  │                                                                   │       │
│  │  Supports: push_only, pull_only, bidirectional sync directions   │       │
│  └──────────────────────────────┬────────────────────────────────────┘       │
│                                 │                                            │
│  ┌──────────────────────────────┼────────────────────────────────────┐       │
│  │                  BANK RECONCILIATION ENGINE                       │       │
│  │                                                                   │       │
│  │  ┌──────────────────┐    ┌──────────────────┐                   │       │
│  │  │ AUTO-MATCHING     │    │ MANUAL REVIEW    │                   │       │
│  │  │                   │    │                   │                   │       │
│  │  │ Exact amount      │    │ Suggested matches │                   │       │
│  │  │ Date proximity    │    │ Split matching    │                   │       │
│  │  │ Reference match   │    │ Create new JE     │                   │       │
│  │  │ Payee matching    │    │ Flag as anomaly   │                   │       │
│  │  │ Confidence score  │    │                   │                   │       │
│  │  └──────────────────┘    └──────────────────┘                   │       │
│  │                                                                   │       │
│  │  Confidence levels: high (>0.95), medium (0.7-0.95), low (<0.7) │       │
│  └──────────────────────────────┬────────────────────────────────────┘       │
│                                 │                                            │
│  ┌──────────────────────────────┼────────────────────────────────────┐       │
│  │                  SYNC LOG & MONITORING                            │       │
│  │                                                                   │       │
│  │  Every sync operation is logged with:                            │       │
│  │  • Direction (push/pull), provider, entity type                  │       │
│  │  • Records synced, created, updated, failed                      │       │
│  │  • Error details with full stack traces                          │       │
│  │  • Duration and performance metrics                              │       │
│  └──────────────────────────────────────────────────────────────────┘       │
└──────────────────────────────────────────────────────────────────────────────┘
```

#### Sync Architecture

```
                    ┌─────────────┐
                    │   MCV.ONE    │
                    │   Finance    │
                    └──────┬──────┘
                           │
              ┌────────────┼────────────┐
              ▼            ▼            ▼
     ┌──────────────┐ ┌──────────┐ ┌──────────┐
     │  QuickBooks   │ │   Xero   │ │  Plaid   │
     │  Online API   │ │   API    │ │   API    │
     └──────────────┘ └──────────┘ └──────────┘

Sync Flow:
  1. Trigger: cron (hourly), webhook, or manual
  2. Fetch changed records since last sync (delta)
  3. Map MCV entities ↔ external entities via mapping table
  4. Push/pull changes with conflict resolution (last-write-wins or manual)
  5. Log sync results, flag errors for manual review
  6. Emit events: finance.integration.sync_completed
```

#### Bank Reconciliation Flow

```
  Bank Transactions (Plaid)          Ledger Entries (GL)
  ─────────────────────              ─────────────────
  $500 — Acme Corp                   JE: $500 — Invoice #42
  $125 — Office Depot                JE: $125 — Expense Report #18
  $89.50 — Unknown vendor            ???
  $1,200 — Payroll                   JE: $1,200 — Payroll Run #6

         │                                   │
         └───────────────┬───────────────────┘
                         │
                    AUTO-MATCHER
                    ─────────────
                    Exact: $500 ↔ Invoice #42 (confidence: 0.98)
                    Exact: $125 ↔ Expense #18 (confidence: 0.95)
                    Fuzzy: $1,200 ↔ Payroll #6 (confidence: 0.92)
                    None:  $89.50 → flagged for manual review
```

#### Key Behaviors

| Behavior | Detail |
|----------|--------|
| **OAuth2 connections** | QuickBooks and Xero use OAuth2 refresh token flow. Tokens are encrypted at rest and refreshed proactively before expiry. |
| **Entity mapping** | Every synced entity maintains a mapping record linking MCV ID to external ID. Mappings are per-venture, per-provider. |
| **Delta sync** | Only changed records since `lastSyncAt` are fetched, minimizing API calls and processing time. |
| **Conflict resolution** | Default: last-write-wins based on `updatedAt`. Configurable: manual review queue for conflicts. |
| **Auto-matching** | Bank reconciliation uses a multi-factor scoring algorithm: exact amount match (0.4), date proximity (0.2), reference/payee match (0.3), historical pattern (0.1). |
| **Plaid webhooks** | Real-time bank transaction updates via Plaid webhooks, processed asynchronously through Redpanda. |

---

### Module: Reporting

**Path:** `@mcv/finance/reporting`  
**Tables:** 4 (`finance_reports`, `finance_report_runs`, `finance_report_subscriptions`, `finance_custom_report_definitions`)  
**Service:** `ReportingService` → exported as `reportingService`

#### Purpose

Generates standard GAAP financial statements (Income Statement, Balance Sheet, Cash Flow Statement) and aging reports (Aged AR/AP). Supports custom report definitions with formula-based calculated columns, scheduled report generation with email delivery, and export to PDF, Excel, and CSV formats.

#### Internal Architecture

```
┌────────────────────────────────────────────────────────────────────────────┐
│                          REPORTING MODULE                                   │
│                                                                             │
│  ┌──────────────────────────────────────────────────────────────────┐     │
│  │                STANDARD FINANCIAL STATEMENTS                      │     │
│  │                                                                   │     │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │     │
│  │  │  Income       │  │  Balance      │  │  Cash Flow    │          │     │
│  │  │  Statement    │  │  Sheet        │  │  Statement    │          │     │
│  │  │              │  │              │  │              │          │     │
│  │  │ Revenue      │  │ Assets =     │  │ Operating   │          │     │
│  │  │ - COGS       │  │ Liabilities +│  │ Investing   │          │     │
│  │  │ = Gross      │  │ Equity       │  │ Financing   │          │     │
│  │  │ - OpEx       │  │              │  │              │          │     │
│  │  │ = Net Income │  │ Validates!   │  │ Indirect    │          │     │
│  │  └──────────────┘  └──────────────┘  └──────────────┘          │     │
│  │                                                                   │     │
│  │  ┌──────────────┐  ┌──────────────┐                             │     │
│  │  │  Aged         │  │  Trial        │                             │     │
│  │  │  Receivables  │  │  Balance      │                             │     │
│  │  │  / Payables   │  │              │                             │     │
│  │  │              │  │ DR = CR      │                             │     │
│  │  │ Current,     │  │ validation   │                             │     │
│  │  │ 1-30, 31-60, │  │              │                             │     │
│  │  │ 61-90, 90+   │  │              │                             │     │
│  │  └──────────────┘  └──────────────┘                             │     │
│  └──────────────────────────────────────────────────────────────────┘     │
│                                                                             │
│  ┌──────────────────────────────────────────────────────────────────┐     │
│  │                COMPARISON ENGINE                                   │     │
│  │                                                                   │     │
│  │  Every report supports:                                          │     │
│  │  • Prior period comparison  (e.g., Jan vs Feb)                   │     │
│  │  • Prior year comparison    (e.g., 2026 vs 2025)                 │     │
│  │  • Budget comparison        (actual vs budgeted)                 │     │
│  │  • Variance calculation     (absolute and percentage)            │     │
│  │                                                                   │     │
│  │  Comparison data is fetched in parallel for performance.         │     │
│  └──────────────────────────────────────────────────────────────────┘     │
│                                                                             │
│  ┌──────────────────────────────────────────────────────────────────┐     │
│  │                CUSTOM REPORT BUILDER                               │     │
│  │                                                                   │     │
│  │  Column definitions with formula support:                        │     │
│  │  [{ id: 'col1', name: 'Account', type: 'text',                  │     │
│  │     source: 'account.name' },                                    │     │
│  │   { id: 'col4', name: 'Change', type: 'currency',               │     │
│  │     formula: 'col2 - col3' }]                                    │     │
│  │                                                                   │     │
│  │  Row definitions with grouping and subtotals:                    │     │
│  │  [{ type: 'header', label: 'ASSETS' },                          │     │
│  │   { type: 'account_group', accountTypes: ['asset'] },           │     │
│  │   { type: 'subtotal', sumRows: ['row2'] }]                      │     │
│  └──────────────────────────────────────────────────────────────────┘     │
│                                                                             │
│  ┌──────────────────────────────────────────────────────────────────┐     │
│  │                SCHEDULING & EXPORT                                 │     │
│  │                                                                   │     │
│  │  • Schedule: daily, weekly, monthly, quarterly, on_demand        │     │
│  │  • Delivery: email with attachment (PDF/Excel/CSV)               │     │
│  │  • Subscriptions: per-user format preferences                    │     │
│  │  • Caching: report results cached in reportRuns for re-download  │     │
│  └──────────────────────────────────────────────────────────────────┘     │
└────────────────────────────────────────────────────────────────────────────┘
```

#### Report Output Structure: Income Statement

```typescript
interface IncomeStatementData {
  title: 'Income Statement';
  subtitle: string;                    // "For the period 2026-01-01 to 2026-12-31"
  generatedAt: Date;
  sections: [
    {
      title: 'Revenue';
      accounts: AccountRow[];          // code, name, balance, prior, variance
      total: string;
      priorTotal: string | null;
      variance: string | null;
    },
    {
      title: 'Expenses';
      subsections: Array<{             // Grouped by subtype
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
    netIncomeMargin: string;           // Percentage
    priorNetIncome: string | null;
    netIncomeChange: string | null;
  };
}
```

#### Key Behaviors

| Behavior | Detail |
|----------|--------|
| **Balance sheet validation** | Verifies `Total Assets === Total Liabilities + Total Equity`. Any imbalance is flagged with `isBalanced: false`. |
| **Aging buckets** | Aged AR/AP uses standard buckets: Current, 1-30 days, 31-60 days, 61-90 days, 90+ days. Grouped by customer/vendor. |
| **Custom formulas** | Custom report columns support arithmetic referencing other columns by ID (e.g., `'col2 - col3'`). |
| **Scheduled delivery** | Reports can be scheduled daily/weekly/monthly/quarterly with email delivery in PDF/Excel/CSV. |
| **Result caching** | Every report run stores its output in `reportRuns.results` JSONB for instant re-download without regeneration. |
| **Parallel comparison** | When comparison mode is enabled, base and comparison data are fetched in parallel using `Promise.all`. |

---

## Data Models

### Complete Table Inventory

| Module | Table | Rows (est.) | Key Indexes |
|--------|-------|-------------|-------------|
| **Accounting** | `finance_accounts` | ~200/venture | `(venture_id, code)` UNIQUE, `(venture_id, type)` |
| | `finance_fiscal_years` | ~5/venture | `(venture_id, is_current)` |
| | `finance_fiscal_periods` | ~60/venture | `(venture_id, fiscal_year_id, status)` |
| | `finance_journal_entries` | ~100K/venture/yr | `(venture_id, entry_date)`, `(venture_id, status)`, `(source_type, source_id)` |
| | `finance_journal_entry_lines` | ~300K/venture/yr | `(journal_entry_id)`, `(account_id)`, `(department_id)` |
| | `finance_account_balances` | ~2.4K/venture/yr | `(account_id, fiscal_period_id)` UNIQUE |
| | `finance_recurring_journals` | ~20/venture | `(venture_id, is_active, next_run_date)` |
| **Expenses** | `finance_expense_reports` | ~500/venture/yr | `(venture_id, employee_id, status)` |
| | `finance_expenses` | ~5K/venture/yr | `(venture_id, expense_date)`, `(employee_id, category)` |
| | `finance_expense_policies` | ~5/venture | `(venture_id, is_default, is_active)` |
| | `finance_expense_approvals` | ~1K/venture/yr | `(expense_report_id, status)`, `(approver_id, status)` |
| | `finance_expense_approval_workflows` | ~3/venture | `(venture_id, is_active)` |
| | `finance_corporate_cards` | ~50/venture | `(venture_id, employee_id, status)` |
| | `finance_card_transactions` | ~10K/venture/yr | `(corporate_card_id, transaction_date)`, `(is_matched)` |
| **Budgeting** | `finance_budgets` | ~20/venture/yr | `(venture_id, fiscal_year_id, status)` |
| | `finance_budget_lines` | ~400/venture/yr | `(budget_id, account_id)` |
| | `finance_budget_transfers` | ~50/venture/yr | `(from_budget_line_id)`, `(status)` |
| | `finance_budget_forecasts` | ~100/venture/yr | `(budget_id, forecast_date)` |
| | `finance_budget_scenarios` | ~50/venture/yr | `(budget_id, is_active)` |
| | `finance_budget_alerts` | ~200/venture/yr | `(budget_id, status, severity)` |
| **Reporting** | `finance_reports` | ~50/venture | `(venture_id, report_type)` |
| | `finance_report_runs` | ~2K/venture/yr | `(report_id, status)`, `(created_at)` |
| | `finance_report_subscriptions` | ~100/venture | `(report_id, user_id)` |
| | `finance_custom_report_definitions` | ~20/venture | `(venture_id, is_public)` |
| **Billing** | `finance_invoices` | ~5K/venture/yr | `(venture_id, customer_id, status)`, `(due_date)` |
| | `finance_invoice_line_items` | ~15K/venture/yr | `(invoice_id)` |
| | `finance_subscriptions` | ~500/venture | `(venture_id, customer_id, status)`, `(current_period_end)` |
| | `finance_billing_plans` | ~20/venture | `(venture_id, is_active)` |
| | `finance_payment_schedules` | ~200/venture | `(customer_id, status)` |
| | `finance_credit_notes` | ~200/venture/yr | `(invoice_id)`, `(customer_id)` |
| | `finance_dunning_rules` | ~3/venture | `(venture_id, is_active)` |
| | `invoice_templates` | ~10/venture | `(venture_id, is_default)` |
| | `invoices_v2` | ~5K/venture/yr | `(venture_id, contact_id, status)`, `(due_date)` |
| | `proposals` | ~500/venture/yr | `(venture_id, status)` |
| | `estimates` | ~500/venture/yr | `(venture_id, status)` |
| | `recurring_invoices` | ~50/venture | `(venture_id, status, next_date)` |
| | `approval_workflows` | ~5/venture | `(venture_id)` |
| | `approval_requests` | ~500/venture/yr | `(workflow_id, status)` |
| | `approval_decisions` | ~1K/venture/yr | `(approval_request_id)` |
| | `platform_fee_configs` | 1/venture | `(venture_id)` UNIQUE |
| | `platform_fee_ledger` | ~5K/venture/yr | `(venture_id, invoice_id)` |
| | `payment_receipts` | ~5K/venture/yr | `(invoice_id)` |
| **Integrations** | `finance_accounting_integrations` | ~3/venture | `(venture_id, provider)` |
| | `finance_integration_mappings` | ~1K/venture | `(integration_id, entity_type, internal_id)` |
| | `finance_integration_sync_logs` | ~10K/venture/yr | `(integration_id, started_at)` |
| | `finance_bank_connections` | ~5/venture | `(venture_id, status)` |
| | `finance_bank_transactions` | ~50K/venture/yr | `(bank_connection_id, transaction_date)`, `(is_reconciled)` |
| | `finance_reconciliations` | ~500/venture/yr | `(venture_id, status)` |

### Drizzle ORM Schema Conventions

All tables follow the standard `@mcv/kernel` base column pattern:

```typescript
import { pgTable, uuid, timestamp } from 'drizzle-orm/pg-core';

// Applied via spread: ...baseColumns
const baseColumns = {
  id: uuid('id').primaryKey().defaultRandom(),
  ventureId: uuid('venture_id').notNull(),        // RLS partition key
  createdAt: timestamp('created_at').defaultNow(),
  createdBy: uuid('created_by'),
  updatedAt: timestamp('updated_at').defaultNow(),
  updatedBy: uuid('updated_by'),
  deletedAt: timestamp('deleted_at'),              // Soft delete
  deletedBy: uuid('deleted_by'),
};
```

### Key Data Relationships

```
                    finance_accounts
                         │
          ┌──────────────┼──────────────┐
          ▼              ▼              ▼
  journal_entry_lines  budget_lines  account_balances
          │
          ▼
  finance_journal_entries ◀─── finance_expenses (via sourceId)
          │                    finance_invoices (via sourceId)
          ▼                    finance_subscriptions (via sourceId)
  finance_fiscal_periods
          │
          ▼
  finance_fiscal_years

  finance_expense_reports ──▶ finance_expenses (1:N)
          │
          ▼
  finance_expense_approvals (1:N, multi-level)

  finance_invoices ──▶ finance_invoice_line_items (1:N)
          │
          ├──▶ finance_payment_schedules
          ├──▶ finance_credit_notes
          └──▶ finance_dunning_rules (via venture config)

  invoices_v2 ──▶ invoice_templates (M:1)
          │
          ├──▶ recurring_invoices (source)
          └──▶ platform_fee_ledger (1:N)

  proposals ──▶ invoices_v2 (converts to)
  estimates ──▶ invoices_v2 (converts to)

  finance_bank_connections ──▶ finance_bank_transactions (1:N)
          │
          └──▶ finance_reconciliations (1:N)
```

### Row-Level Security (RLS)

All tables enforce venture isolation via Supabase RLS:

```sql
-- Example RLS policy for finance_journal_entries
CREATE POLICY "venture_isolation" ON finance_journal_entries
  USING (venture_id = current_setting('app.current_venture_id')::uuid)
  WITH CHECK (venture_id = current_setting('app.current_venture_id')::uuid);

-- Additional role-based policies
CREATE POLICY "finance_team_can_post" ON finance_journal_entries
  FOR UPDATE
  USING (
    venture_id = current_setting('app.current_venture_id')::uuid
    AND current_setting('app.user_role') IN ('finance', 'admin', 'cfo')
  );
```

---

## Data Flow & Events

### Event-Driven Architecture

All financial events are published to Redpanda/Kafka topics for asynchronous processing by downstream consumers:

```
┌──────────────────┐     ┌──────────────────────────────────┐
│ Finance Domain   │     │         Redpanda/Kafka             │
│                  │     │                                     │
│ AccountingService├────▶│ finance.journal_entry.posted        │
│                  ├────▶│ finance.journal_entry.reversed      │
│                  ├────▶│ finance.period.closed               │
│                  │     │                                     │
│ BillingService   ├────▶│ finance.invoice.created             │
│                  ├────▶│ finance.invoice.sent                │
│                  ├────▶│ finance.invoice.paid                │
│                  ├────▶│ finance.invoice.overdue             │
│                  ├────▶│ finance.subscription.renewed        │
│                  ├────▶│ finance.subscription.cancelled      │
│                  │     │                                     │
│ ExpenseService   ├────▶│ finance.expense.submitted           │
│                  ├────▶│ finance.expense.approved            │
│                  ├────▶│ finance.expense.rejected            │
│                  ├────▶│ finance.expense.reimbursed          │
│                  │     │                                     │
│ BudgetingService ├────▶│ finance.budget.approved             │
│                  ├────▶│ finance.budget.alert.triggered      │
│                  ├────▶│ finance.budget.overspend            │
│                  │     │                                     │
│ IntegrationServ. ├────▶│ finance.integration.sync_completed  │
│                  ├────▶│ finance.integration.sync_failed     │
│                  ├────▶│ finance.bank.transactions_imported  │
│                  ├────▶│ finance.reconciliation.completed    │
│                  │     │                                     │
│ ReportingService ├────▶│ finance.report.generated            │
│                  │     │                                     │
└──────────────────┘     └──────────────────────────────────┘
```

### Event Schema

```typescript
interface FinanceEvent<T = unknown> {
  id: string;                    // UUID
  type: string;                  // e.g., 'finance.invoice.paid'
  ventureId: string;             // Partition key
  timestamp: string;             // ISO 8601
  version: '1.0';
  source: '@mcv/finance';
  data: T;
  metadata: {
    userId?: string;
    correlationId?: string;
    causationId?: string;
  };
}

// Example: Invoice Paid Event
interface InvoicePaidEvent {
  invoiceId: string;
  invoiceNumber: string;
  customerId: string;
  amount: string;
  currency: string;
  paidAt: string;
  paymentMethod: string;
  journalEntryId: string;
}
```

### Core Data Flows

#### Flow 1: Invoice → Payment → Ledger

```
Customer Invoice Created
        │
        ▼
┌───────────────┐     ┌───────────────┐     ┌───────────────┐
│ billing        │────▶│ accounting     │────▶│ reporting      │
│                │     │                │     │                │
│ Create INV     │     │ Create JE:     │     │ AR shows on    │
│ status=draft   │     │ DR: AR  $1000  │     │ Balance Sheet  │
│                │     │ CR: Rev $1000  │     │                │
└───────────────┘     └───────────────┘     └───────────────┘
        │ send
        ▼
┌───────────────┐     ┌───────────────┐     ┌───────────────┐
│ billing        │────▶│ accounting     │────▶│ integrations   │
│                │     │                │     │                │
│ Payment recv   │     │ Create JE:     │     │ Push to        │
│ status=paid    │     │ DR: Cash $1000 │     │ QuickBooks /   │
│                │     │ CR: AR   $1000 │     │ Xero           │
└───────────────┘     └───────────────┘     └───────────────┘
```

#### Flow 2: Expense → Approval → Reimbursement → Ledger

```
Employee Submits Expense Report ($2,500)
        │
        ▼
┌───────────────┐     ┌───────────────┐     ┌───────────────┐
│ expenses       │────▶│ expenses       │────▶│ expenses       │
│                │     │                │     │                │
│ Submit report  │     │ L1: Manager    │     │ L2: Dept Head  │
│ status=        │     │ ✓ approved     │     │ ✓ approved     │
│ submitted      │     │                │     │                │
└───────────────┘     └───────────────┘     └───────────────┘
                                                     │
                                                     ▼
                                            ┌───────────────┐
                                            │ accounting     │
                                            │                │
                                            │ Auto-create JE:│
                                            │ DR: Expense    │
                                            │   $2,500       │
                                            │ CR: AP-Employee│
                                            │   $2,500       │
                                            └───────┬───────┘
                                                     │
                                                     ▼ (reimburse)
                                            ┌───────────────┐
                                            │ accounting     │
                                            │                │
                                            │ Payment JE:    │
                                            │ DR: AP-Employee│
                                            │   $2,500       │
                                            │ CR: Cash       │
                                            │   $2,500       │
                                            └───────────────┘
```

#### Flow 3: Budget → Actuals → Alerts

```
Budget Approved ($120,000 annual)
        │
        ▼
┌───────────────┐                    ┌───────────────┐
│ budgeting      │◀── JE posted ────│ accounting     │
│                │    (auto-track)   │                │
│ Record actual  │                   │ $85,000 spent  │
│ Update variance│                   │ so far         │
│ Check alerts   │                   │                │
└───────┬───────┘                    └───────────────┘
        │
        ▼ (if threshold exceeded)
┌───────────────┐     ┌───────────────┐
│ budgeting      │────▶│ notifications  │
│                │     │                │
│ Trigger alert: │     │ Email/push:    │
│ 90% utilization│     │ "Marketing     │
│ severity=warn  │     │  budget at 90%"│
└───────────────┘     └───────────────┘
```

#### Flow 4: Bank Feed → Reconciliation → Ledger

```
Plaid Webhook: New Transactions
        │
        ▼
┌───────────────┐     ┌───────────────┐     ┌───────────────┐
│ integrations   │────▶│ integrations   │────▶│ accounting     │
│                │     │                │     │                │
│ Import 50 txns │     │ Auto-match:    │     │ Confirm matched│
│ from bank feed │     │ 45 matched     │     │ JEs are correct│
│                │     │ 5 unmatched    │     │                │
└───────────────┘     └───────────────┘     └───────────────┘
                              │
                              ▼ (for unmatched)
                       ┌───────────────┐
                       │ Manual review  │
                       │                │
                       │ Match, create  │
                       │ new JE, or     │
                       │ flag anomaly   │
                       └───────────────┘
```

---

## Integration Points

### Cross-Domain Dependencies

| Domain | Direction | Data Exchanged | Mechanism |
|--------|-----------|---------------|-----------|
| **@mcv/kernel** | Finance ← Kernel | Database connection, context, auth, errors, base columns | Direct import |
| **@mcv/payments** | Finance ↔ Payments | Payment processing for invoices, Stripe Connect integration | Service calls + webhooks |
| **@mcv/documents** | Finance → Documents | PDF generation for invoices/reports, receipt file storage | Service calls |
| **@mcv/notifications** | Finance → Notifications | Invoice reminders, approval requests, budget alerts, dunning emails | Event-driven |
| **@mcv/people** | Finance ← People | Employee data for expense management (manager hierarchy, departments) | Service calls |
| **@mcv/commerce** | Finance ← Commerce | Revenue events triggering automatic invoice generation | Events (Redpanda) |
| **@mcv/treasury** | Finance → Treasury | Venture-level P&L, cash flow data for consortium consolidation | Events + shared schema |

### External Integration Matrix

| Provider | Protocol | Auth | Data Synced | Frequency |
|----------|----------|------|-------------|-----------|
| **QuickBooks Online** | REST API v3 | OAuth2 | Chart of accounts, invoices, payments, customers, vendors | Hourly + webhook |
| **Xero** | REST API v2 | OAuth2 | Chart of accounts, invoices, payments, contacts | Hourly + webhook |
| **Stripe Connect** | REST API + Webhooks | API key + Connect | Payments, refunds, subscriptions, platform fees | Real-time (webhooks) |
| **Plaid** | REST API + Webhooks | Link token | Bank accounts, transactions, balances | Real-time (webhooks) + daily pull |

### Webhook Processing

```typescript
// Webhook handler architecture
// All webhooks are received, validated, and queued for async processing

// POST /api/webhooks/stripe
async function handleStripeWebhook(req: Request) {
  const sig = req.headers['stripe-signature'];
  const event = stripe.webhooks.constructEvent(body, sig, secret);
  
  await redpanda.produce('finance.webhooks.stripe', {
    eventType: event.type,
    data: event.data.object,
    ventureId: resolveVentureFromStripeAccount(event.account),
  });
  
  return new Response('OK', { status: 200 });
}

// POST /api/webhooks/plaid
async function handlePlaidWebhook(req: Request) {
  const { webhook_type, webhook_code, item_id } = req.body;
  
  await redpanda.produce('finance.webhooks.plaid', {
    webhookType: webhook_type,
    webhookCode: webhook_code,
    itemId: item_id,
    ventureId: resolveVentureFromPlaidItem(item_id),
  });
  
  return new Response('OK', { status: 200 });
}
```

---

## Performance

### Optimization Strategies

#### 1. Indexed Queries

All high-frequency query patterns have composite indexes:

```sql
-- Journal entry lookups (most common)
CREATE INDEX idx_je_venture_date ON finance_journal_entries (venture_id, entry_date);
CREATE INDEX idx_je_venture_status ON finance_journal_entries (venture_id, status);
CREATE INDEX idx_je_source ON finance_journal_entries (source_type, source_id);

-- Account balance lookups
CREATE UNIQUE INDEX idx_ab_account_period 
  ON finance_account_balances (account_id, fiscal_period_id);

-- Invoice queries
CREATE INDEX idx_inv_venture_customer_status 
  ON finance_invoices (venture_id, customer_id, status);
CREATE INDEX idx_inv_due_date ON finance_invoices (due_date) 
  WHERE status IN ('sent', 'viewed', 'partial');

-- Bank transaction reconciliation
CREATE INDEX idx_btx_unreconciled 
  ON finance_bank_transactions (bank_connection_id, is_reconciled) 
  WHERE is_reconciled = false;
```

#### 2. Materialized Balance Caching

Account balances are maintained as materialized snapshots in `finance_account_balances` rather than computed from journal entry lines on every query:

- **On JE post**: Update `currentBalance` on the affected accounts and `periodDebit`/`periodCredit`/`netChange` on the period balance record.
- **On period close**: Calculate and freeze closing balances. Carry forward to next period's opening balances.
- **Benefit**: Balance sheet and trial balance queries read from pre-computed rows instead of aggregating millions of JE lines.

#### 3. Redis Caching

```typescript
// Cached computed values with TTL
const cacheKeys = {
  trialBalance: (ventureId, periodId) => `fin:tb:${ventureId}:${periodId}`,    // 5 min TTL
  chartOfAccounts: (ventureId) => `fin:coa:${ventureId}`,                      // 15 min TTL
  budgetSummary: (budgetId) => `fin:budget:${budgetId}`,                       // 5 min TTL
  reportResult: (reportRunId) => `fin:report:${reportRunId}`,                  // 1 hour TTL
  integrationMapping: (integrationId) => `fin:map:${integrationId}`,           // 30 min TTL
};
```

Cache invalidation is event-driven: when a journal entry is posted, the trial balance and chart of accounts caches for that venture are invalidated.

#### 4. Parallel Query Execution

Reports with comparison modes execute data fetches in parallel:

```typescript
const [currentData, priorData, budgetData] = await Promise.all([
  this.fetchPeriodData(currentPeriodId),
  this.fetchPeriodData(priorPeriodId),
  this.fetchBudgetData(budgetId),
]);
```

### Performance Targets

| Operation | Target | Mechanism |
|-----------|--------|-----------|
| Create journal entry (with validation) | < 50ms | Single transaction, pre-validated |
| Post journal entry (with balance updates) | < 100ms | Batch balance updates in transaction |
| Trial balance query | < 200ms | Pre-computed balances + Redis cache |
| Income statement generation | < 500ms | Parallel comparison data fetch |
| Balance sheet generation | < 500ms | Parallel + materialized balances |
| Invoice creation | < 100ms | Template-based generation |
| Expense report submission | < 200ms | Async approval chain creation |
| Bank reconciliation (50 txns) | < 2s | Parallel matching + scoring |
| QuickBooks full sync (1000 entities) | < 30s | Batched API calls, parallel processing |

---

## Scalability

### Horizontal Scaling Strategies

#### 1. Venture-Based Partitioning

All tables are naturally partitioned by `ventureId`. For high-volume ventures, PostgreSQL table partitioning can be applied:

```sql
-- Example: Partition journal entries by venture
CREATE TABLE finance_journal_entries (
  -- ... columns ...
) PARTITION BY LIST (venture_id);

CREATE TABLE finance_journal_entries_v1 
  PARTITION OF finance_journal_entries 
  FOR VALUES IN ('venture-uuid-1');
```

#### 2. Read Replicas

Financial reporting queries can be routed to read replicas to avoid impacting transactional workloads:

```typescript
const reportingDb = createDrizzleClient(process.env.DATABASE_READ_REPLICA_URL);
```

#### 3. Event Processing Scaling

Redpanda/Kafka consumers can be scaled independently per topic:

- `finance.journal_entry.*` — High volume, 3+ consumer instances
- `finance.invoice.*` — Medium volume, 2 consumer instances
- `finance.integration.*` — Low volume, 1 consumer instance

#### 4. Report Generation Offloading

Heavy report generation (PDF/Excel export, custom reports with large datasets) is offloaded to background workers:

```typescript
// Report generation is queued, not synchronous
const reportRun = await reportingService.queueReportGeneration({
  reportId,
  format: 'pdf',
  deliverTo: user.email,
});
// Returns immediately with reportRun.id for status polling
```

### Scale Targets

| Metric | Target |
|--------|--------|
| Ventures supported | 1,000+ |
| Journal entries per venture per year | 500,000+ |
| Concurrent report generations | 50+ |
| Bank transactions imported per day | 100,000+ |
| External sync operations per hour | 1,000+ |

---

## Error Handling

### Error Classification

```typescript
// Finance-specific error codes (extending @mcv/kernel ErrorCode)
enum FinanceErrorCode {
  // Accounting errors
  UNBALANCED_ENTRY = 'FINANCE_UNBALANCED_ENTRY',
  PERIOD_CLOSED = 'FINANCE_PERIOD_CLOSED',
  ACCOUNT_INACTIVE = 'FINANCE_ACCOUNT_INACTIVE',
  DUPLICATE_ACCOUNT_CODE = 'FINANCE_DUPLICATE_ACCOUNT_CODE',
  ENTRY_ALREADY_POSTED = 'FINANCE_ENTRY_ALREADY_POSTED',
  ENTRY_NOT_POSTED = 'FINANCE_ENTRY_NOT_POSTED',
  UNPOSTED_ENTRIES_EXIST = 'FINANCE_UNPOSTED_ENTRIES_EXIST',
  
  // Billing errors
  INVOICE_ALREADY_PAID = 'FINANCE_INVOICE_ALREADY_PAID',
  INVOICE_VOIDED = 'FINANCE_INVOICE_VOIDED',
  SUBSCRIPTION_CANCELLED = 'FINANCE_SUBSCRIPTION_CANCELLED',
  PAYMENT_EXCEEDS_AMOUNT_DUE = 'FINANCE_PAYMENT_EXCEEDS_DUE',
  CREDIT_NOTE_EXCEEDS_BALANCE = 'FINANCE_CREDIT_EXCEEDS_BALANCE',
  
  // Expense errors
  RECEIPT_REQUIRED = 'FINANCE_RECEIPT_REQUIRED',
  POLICY_VIOLATION = 'FINANCE_POLICY_VIOLATION',
  APPROVAL_NOT_FOUND = 'FINANCE_APPROVAL_NOT_FOUND',
  REPORT_ALREADY_SUBMITTED = 'FINANCE_REPORT_SUBMITTED',
  
  // Budget errors
  INSUFFICIENT_BUDGET = 'FINANCE_INSUFFICIENT_BUDGET',
  BUDGET_LOCKED = 'FINANCE_BUDGET_LOCKED',
  TRANSFER_EXCEEDS_AVAILABLE = 'FINANCE_TRANSFER_EXCEEDS_AVAILABLE',
  
  // Integration errors
  SYNC_FAILED = 'FINANCE_SYNC_FAILED',
  PROVIDER_UNREACHABLE = 'FINANCE_PROVIDER_UNREACHABLE',
  MAPPING_NOT_FOUND = 'FINANCE_MAPPING_NOT_FOUND',
  TOKEN_EXPIRED = 'FINANCE_TOKEN_EXPIRED',
  RECONCILIATION_MISMATCH = 'FINANCE_RECONCILIATION_MISMATCH',
}
```

### Error Handling Patterns

#### 1. Transaction Rollback

All multi-table operations use database transactions. If any step fails, the entire operation rolls back:

```typescript
return db.transaction(async (tx) => {
  const entry = await tx.insert(journalEntries).values(/* ... */).returning();
  const lines = await tx.insert(journalEntryLines).values(/* ... */).returning();
  
  // If balance update fails, entry + lines are rolled back
  await updateAccountBalances(tx, lines);
  
  return { entry, lines };
});
```

#### 2. Idempotent Operations

External integration operations use idempotency keys to prevent duplicate processing:

```typescript
async function processWebhook(event: StripeEvent) {
  const idempotencyKey = `stripe:${event.id}`;
  
  if (await redis.get(idempotencyKey)) {
    return; // Already processed
  }
  
  await processPayment(event.data);
  await redis.set(idempotencyKey, '1', 'EX', 86400); // 24h TTL
}
```

#### 3. Dead Letter Queue

Failed event processing is routed to a DLQ for manual review:

```typescript
try {
  await processEvent(event);
} catch (error) {
  await redpanda.produce('finance.dlq', {
    originalTopic: event.topic,
    originalEvent: event,
    error: error.message,
    stack: error.stack,
    failedAt: new Date().toISOString(),
    retryCount: event.metadata.retryCount ?? 0,
  });
}
```

#### 4. Retry Strategies

| Operation | Retry Strategy | Max Retries |
|-----------|---------------|-------------|
| External API calls (QB, Xero) | Exponential backoff (1s, 2s, 4s, 8s) | 4 |
| Plaid API calls | Exponential backoff (2s, 4s, 8s, 16s) | 3 |
| Stripe webhook processing | Linear backoff (60s) | 3 |
| Report generation | No retry (idempotent re-trigger) | 0 |
| Event publishing | Immediate retry | 3 |

---

## Observability

### Structured Logging

All finance operations emit structured logs with consistent context:

```typescript
import { logger } from '@mcv/kernel/logger';

const log = logger.child({
  domain: 'finance',
  module: 'accounting',
});

// On journal entry post
log.info({
  action: 'journal_entry.posted',
  entryId: entry.id,
  entryNumber: entry.entryNumber,
  ventureId: entry.ventureId,
  totalDebit: entry.totalDebit,
  totalCredit: entry.totalCredit,
  lineCount: lines.length,
  duration: Date.now() - startTime,
}, 'Journal entry posted successfully');

// On error
log.error({
  action: 'journal_entry.post_failed',
  entryId: entry.id,
  error: error.message,
  errorCode: error.code,
  stack: error.stack,
}, 'Failed to post journal entry');
```

### Metrics

Key metrics exposed for monitoring dashboards:

| Metric | Type | Labels |
|--------|------|--------|
| `finance.journal_entries.created` | Counter | `venture_id`, `source_type` |
| `finance.journal_entries.posted` | Counter | `venture_id` |
| `finance.journal_entries.post_duration_ms` | Histogram | `venture_id` |
| `finance.invoices.created` | Counter | `venture_id`, `status` |
| `finance.invoices.paid` | Counter | `venture_id` |
| `finance.invoices.paid_amount` | Counter | `venture_id`, `currency` |
| `finance.invoices.overdue` | Gauge | `venture_id` |
| `finance.expenses.submitted` | Counter | `venture_id` |
| `finance.expenses.approval_duration_ms` | Histogram | `venture_id`, `level` |
| `finance.budgets.utilization_pct` | Gauge | `venture_id`, `budget_id` |
| `finance.budgets.alerts_triggered` | Counter | `venture_id`, `severity` |
| `finance.integration.sync_duration_ms` | Histogram | `venture_id`, `provider` |
| `finance.integration.sync_failures` | Counter | `venture_id`, `provider` |
| `finance.reconciliation.match_rate` | Gauge | `venture_id` |
| `finance.reports.generation_duration_ms` | Histogram | `venture_id`, `report_type` |

### Health Checks

```typescript
// GET /api/finance/health
{
  status: 'healthy',
  modules: {
    accounting: { status: 'ok', lastJEPosted: '2026-02-09T04:30:00Z' },
    billing: { status: 'ok', overdueInvoices: 3 },
    budgeting: { status: 'ok', activeAlerts: 7 },
    expenses: { status: 'ok', pendingApprovals: 12 },
    integrations: {
      quickbooks: { status: 'ok', lastSync: '2026-02-09T04:00:00Z' },
      xero: { status: 'ok', lastSync: '2026-02-09T04:00:00Z' },
      plaid: { status: 'ok', lastWebhook: '2026-02-09T04:25:00Z' },
    },
    reporting: { status: 'ok', lastReportGenerated: '2026-02-09T03:00:00Z' },
  },
  database: { status: 'ok', connectionPool: { active: 5, idle: 15, max: 20 } },
  redis: { status: 'ok', memoryUsage: '128MB' },
  events: { status: 'ok', lagMs: 150 },
}
```

### Alerting Rules

| Alert | Condition | Severity |
|-------|-----------|----------|
| Unbalanced trial balance | DR total ≠ CR total for any period | Critical |
| Integration sync failure | 3+ consecutive sync failures | High |
| Overdue invoice spike | 50%+ increase in overdue invoices vs prior week | Medium |
| Budget overspend | Any budget line exceeds 100% | High |
| Approval SLA breach | Expense approval pending > 7 days | Medium |
| Reconciliation gap | Unreconciled bank transactions > 30 days old | High |
| Report generation failure | Report run status = 'failed' | Medium |

---

## Security

### Financial Data Protection

#### 1. Encryption

| Data | At Rest | In Transit |
|------|---------|-----------|
| Financial records (all tables) | AES-256 (Supabase managed) | TLS 1.3 |
| OAuth tokens (QB, Xero) | AES-256 + application-level encryption | TLS 1.3 |
| Bank credentials (Plaid) | Never stored (Link token flow) | TLS 1.3 |
| Receipt files | AES-256 (S3 server-side encryption) | TLS 1.3 |
| API keys (Stripe) | Vault-managed, never in codebase | TLS 1.3 |

#### 2. Access Control

```typescript
// Role-based access matrix
const financePermissions = {
  // Accounting
  'accounting.view':      ['viewer', 'accountant', 'finance', 'cfo', 'admin'],
  'accounting.create_je': ['accountant', 'finance', 'cfo', 'admin'],
  'accounting.post_je':   ['finance', 'cfo', 'admin'],
  'accounting.reverse_je': ['cfo', 'admin'],
  'accounting.close_period': ['cfo', 'admin'],
  
  // Billing
  'billing.view':          ['viewer', 'sales', 'finance', 'cfo', 'admin'],
  'billing.create_invoice': ['sales', 'finance', 'cfo', 'admin'],
  'billing.void_invoice':  ['finance', 'cfo', 'admin'],
  'billing.manage_subscriptions': ['finance', 'cfo', 'admin'],
  
  // Expenses
  'expenses.create':       ['employee', 'manager', 'finance', 'cfo', 'admin'],
  'expenses.approve':      ['manager', 'department_head', 'finance', 'cfo', 'admin'],
  'expenses.reimburse':    ['finance', 'cfo', 'admin'],
  'expenses.manage_policies': ['cfo', 'admin'],
  
  // Budgets
  'budgets.view':          ['viewer', 'manager', 'finance', 'cfo', 'admin'],
  'budgets.create':        ['finance', 'cfo', 'admin'],
  'budgets.approve':       ['cfo', 'admin'],
  'budgets.transfer':      ['finance', 'cfo', 'admin'],
  
  // Integrations
  'integrations.connect':  ['cfo', 'admin'],
  'integrations.sync':     ['finance', 'cfo', 'admin'],
  'integrations.reconcile': ['accountant', 'finance', 'cfo', 'admin'],
  
  // Reporting
  'reporting.view':        ['viewer', 'manager', 'finance', 'cfo', 'admin'],
  'reporting.create_custom': ['finance', 'cfo', 'admin'],
  'reporting.export':      ['finance', 'cfo', 'admin'],
};
```

#### 3. Audit Trail

Every financial operation is fully auditable:

```typescript
// Audit fields on every record
{
  createdAt: timestamp,      // When created
  createdBy: uuid,           // Who created it
  updatedAt: timestamp,      // Last modification
  updatedBy: uuid,           // Who modified it
  deletedAt: timestamp,      // Soft delete timestamp
  deletedBy: uuid,           // Who deleted it
}

// Additional audit for critical operations
{
  postedAt: timestamp,       // When journal entry was posted
  postedBy: uuid,            // Who posted it
  closedAt: timestamp,       // When period was closed
  closedBy: uuid,            // Who closed it
  approvedAt: timestamp,     // When approved
  approvedBy: uuid,          // Who approved
  reversalOf: uuid,          // Links reversal to original entry
}
```

All audit data is immutable — updates create new records or update timestamps; original data is never overwritten for financial records.

#### 4. Data Retention

| Data Type | Retention | Reason |
|-----------|-----------|--------|
| Journal entries | 7 years minimum | Tax/regulatory compliance |
| Invoices | 7 years minimum | Tax/regulatory compliance |
| Expense reports + receipts | 7 years minimum | Tax/regulatory compliance |
| Audit logs | 7 years minimum | Compliance |
| Bank transactions | 7 years minimum | Reconciliation audit trail |
| Sync logs | 1 year | Operational debugging |
| Report run results | 90 days | Storage optimization |
| Redis cache | TTL-based (5min–1hr) | Performance |

#### 5. Compliance Considerations

- **SOC 2 Type II** — All financial data access is logged and auditable
- **PCI DSS** — No credit card numbers stored; delegated to Stripe
- **GAAP compliance** — Double-entry bookkeeping with proper period handling
- **Multi-currency** — ISO 4217 currency codes with exchange rate tracking
- **Tax compliance** — Tax codes, rates, and configurable tax rules per jurisdiction

#### 6. Sensitive Data Handling

```typescript
// Financial amounts are never logged in plaintext at INFO level
log.info({
  action: 'payment.received',
  invoiceId: invoice.id,
  // Amount logged only at DEBUG level
}, 'Payment received for invoice');

log.debug({
  action: 'payment.received',
  invoiceId: invoice.id,
  amount: payment.amount,
  currency: payment.currency,
}, 'Payment details');

// Bank account numbers are always masked
function maskBankAccount(accountNumber: string): string {
  return `****${accountNumber.slice(-4)}`;
}

// OAuth tokens are never logged
function logIntegrationSync(integration: Integration) {
  const { accessToken, refreshToken, ...safe } = integration;
  log.info({ integration: safe }, 'Starting sync');
}
```

---

*@mcv/finance — Financial Management Domain*
