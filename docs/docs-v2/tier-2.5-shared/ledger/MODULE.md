# @mcv/shared/ledger — Universal Double-Entry Ledger

**Parent Package:** @mcv/shared
**Tier:** 2.5 (Shared Utilities)
**Classification:** PUBLISHABLE (Phase 1: Q2 2026)
**Last Updated:** April 5, 2026
**Spec Reference:** `docs/superpowers/specs/2026-04-05-commerce-financial-os-design.md` (Section 1)

---

## Purpose

The `ledger` module is the **single source of truth for all financial state** in the MCV ecosystem. Every monetary movement — payments, refunds, credit grants, subscription charges, loan disbursements, yield distributions, overage fees, platform fees, crypto transfers, wallet balance syncs — creates balanced debit/credit journal entries in this ledger.

This is not an application feature. It is a **platform primitive** at the infrastructure layer that Commerce (`@mcv/commerce`), Finance (`@mcv/finance`), Billing, and all venture apps write to and read from.

**Key innovation:** Every wallet — on-chain (Solana, Ethereum, Bitcoin) or off-chain (Stripe, bank, exchange) — IS a ledger account. This unifies fiat, crypto, and platform credits into a single balance tracking system.

---

## Dependencies

| Package | Why |
|---------|-----|
| `@mcv/kernel/db` | Supabase PostgreSQL access |
| `@mcv/kernel/context` | Venture context (ventureId scoping) |
| `@mcv/kernel/events` | Event emission for real-time updates |
| `@mcv/shared/calculations` | Precision-safe money arithmetic |
| `@mcv/identity` | User/org resolution for account ownership |

---

## Exports

```typescript
// ═══════════════════════════════════════════════════════════
// CORE LEDGER OPERATIONS
// ═══════════════════════════════════════════════════════════

export {
  // Account management
  createAccount,              // Create a new ledger account
  getAccount,                 // Get account by ID
  getAccountByCode,           // Get account by code within venture
  listAccounts,               // List accounts (filtered by type, subtype, venture)
  updateAccount,              // Update account metadata
  getChartOfAccounts,         // Full chart of accounts for venture
  provisionVentureAccounts,   // Auto-create default accounts for new venture

  // Journal entries
  createJournalEntry,         // Create balanced journal entry (enforces debits = credits)
  postJournalEntry,           // Post a draft entry (makes it permanent)
  reverseJournalEntry,        // Create reversal entry for a posted entry
  getJournalEntry,            // Get entry with all lines
  listJournalEntries,         // List entries (filtered, paginated)
  searchJournalEntries,       // Full-text search across entries

  // Balance queries
  getAccountBalance,          // Current balance for an account
  getTrialBalance,            // Trial balance at a date
  getBalancesByPeriod,        // Period-end balance snapshots

  // Credit accounts
  createCreditAccount,        // Create stored-value account
  grantCredits,               // Add credits (creates journal entry)
  consumeCredits,             // Spend credits (creates journal entry)
  transferCredits,            // Move credits between users
  expireCredits,              // Process credit expiration
  getCreditBalance,           // Get credit account balance

  // Fiscal periods
  createFiscalYear,           // Define accounting year
  closePeriod,                // Close a fiscal period
  lockPeriod,                 // Lock period (no more entries)

  // Wallet integration
  bindWalletToAccount,        // Link on-chain/off-chain wallet to ledger account
  syncWalletBalance,          // Sync external balance and create adjustment entry
  getWalletAccounts,          // List all wallet-bound accounts

  // Recurring journals
  createRecurringJournal,     // Template for auto-posted entries
  processRecurringJournals,   // Execute due recurring entries (cron)
}

// ═══════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════

export type {
  LedgerAccount,
  WalletBinding,
  JournalEntry,
  JournalEntryLine,
  JournalSourceType,
  LineDimensions,
  CreditAccount,
  FiscalYear,
  FiscalPeriod,
  AccountBalance,
  TrialBalanceRow,
  RecurringJournal,
}
```

---

## Database Tables

| Table | Rows (est.) | Purpose |
|-------|-------------|---------|
| `ledger_accounts` | ~200/venture | Every entity that holds value |
| `journal_entries` | ~10K/venture/mo | Atomic financial movements |
| `journal_entry_lines` | ~25K/venture/mo | Debit/credit lines per entry |
| `credit_accounts` | ~1/user/venture | Stored-value balances |
| `fiscal_years` | ~1/year/venture | Accounting year definitions |
| `fiscal_periods` | ~12/year/venture | Monthly periods |
| `account_balances` | ~200*12/venture | Period-end snapshots |
| `recurring_journals` | ~10/venture | Auto-posted templates |

---

## Key Invariants

1. **Balance rule:** Every journal entry must balance — `SUM(debits) = SUM(credits)`. Enforced by database CHECK constraint.
2. **Immutability:** Posted entries are never modified. Corrections are new reversal entries.
3. **Venture isolation:** All queries scoped by `ventureId`. No cross-venture data leakage.
4. **Multi-currency:** Each line carries `currency` + `exchangeRate`. Base currency defined per venture.
5. **Audit trail:** Every entry has `createdAt`, `postedBy`, `sourceType`, `sourceId` for full traceability.

---

## Chart of Accounts — Default Template

Auto-provisioned for each venture via `provisionVentureAccounts()`:

```
1xxx  ASSETS
  1010  Cash - Stripe Balance
  1011  Cash - Bank (Primary)
  1050  Crypto - USDC Wallet
  1051  Crypto - SOL Wallet
  1052  Crypto - EDGE Wallet
  1020  Accounts Receivable
  1060  Platform Credits Receivable
  1070  Loans Receivable

2xxx  LIABILITIES
  2010  Accounts Payable
  2020  Credits Payable
  2030  Unearned Revenue
  2050  Platform Fees Payable
  2060  Tax Payable

3xxx  EQUITY
  3010  Owner's Equity
  3020  Retained Earnings
  3030  Token Treasury

4xxx  REVENUE
  4010  Revenue - Subscriptions
  4020  Revenue - Sales
  4050  Revenue - Platform Fees
  4080  Revenue - Interest
  4100  Revenue - Commissions

5xxx  EXPENSES
  5030  Payment Processing Fees
  5040  Refunds & Chargebacks
  5050  Credit Grants
```

Ventures can add custom accounts. System accounts (isSystem=true) cannot be deleted.

---

## Integration Points

| Consumer | How it uses the ledger |
|----------|----------------------|
| `@mcv/payments` | Creates entries for every payment, refund, payout |
| `@mcv/commerce` | Creates entries for orders, subscriptions, credits, loans |
| `@mcv/finance/accounting` | Reads entries for financial statements |
| `@mcv/finance/reporting` | Reads balances for dashboards and metrics |
| `@mcv/finance/billing` | Creates entries for invoice payments, revenue recognition |
| `@mcv/finance/consolidation` | Reads all venture ledgers for holding company rollup |
| MCV Desktop UI | Reads for ledger viewer, trial balance, journal search |

---

## Event Emissions

```typescript
// Events emitted for real-time updates
'ledger.account.created'          // New account provisioned
'ledger.entry.created'            // Entry created (draft)
'ledger.entry.posted'             // Entry posted (permanent)
'ledger.entry.reversed'           // Entry reversed
'ledger.credits.granted'          // Credits added to account
'ledger.credits.consumed'         // Credits spent
'ledger.credits.expired'          // Credits expired
'ledger.credits.transferred'      // Credits moved between users
'ledger.wallet.synced'            // External wallet balance reconciled
'ledger.period.closed'            // Fiscal period closed
```
