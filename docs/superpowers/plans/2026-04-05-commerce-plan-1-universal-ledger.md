# Universal Ledger — Implementation Plan (Plan 1 of 8)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the Universal Ledger — the double-entry accounting primitive at Tier 2 that every financial operation in MCV writes to. This includes: Supabase tables with balance constraints, TypeScript service layer, credit accounts, wallet binding, chart of accounts auto-provisioning, and bootstrapping the test infrastructure.

**Architecture:** The ledger is a set of Supabase PostgreSQL tables with CHECK constraints enforcing balanced entries (debits = credits). A TypeScript service layer (`src/lib/ledger/`) wraps all DB operations with Zod-validated inputs. Credit accounts are a specialized ledger abstraction for stored-value balances. Wallet binding makes on-chain/off-chain wallets into ledger accounts with sync strategies.

**Tech Stack:** Supabase PostgreSQL 16 (database), Zod 4.3 (validation), decimal.js (precision math), Vitest (testing), TypeScript 5.9 strict, Vercel serverless (API), Zustand 5 (client state).

**Spec Reference:** `docs/superpowers/specs/2026-04-05-commerce-financial-os-design.md` Section 1

---

## Phase 1: Test Infrastructure Bootstrap

### Task 1: Install Vitest and Configure Testing

**Files:**
- Modify: `package.json` (add vitest, scripts)
- Create: `vitest.config.ts`

- [ ] **Step 1: Install test dependencies**

```bash
npm install -D vitest @vitest/coverage-v8
```

- [ ] **Step 2: Create vitest.config.ts**

```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['src/**/__tests__/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      include: ['src/lib/**/*.ts'],
      exclude: ['src/lib/**/__tests__/**', 'src/lib/**/types.ts'],
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
```

- [ ] **Step 3: Add test scripts to package.json**

Add to `"scripts"`:
```json
"test": "vitest run",
"test:watch": "vitest",
"test:coverage": "vitest run --coverage"
```

- [ ] **Step 4: Run vitest to verify configuration**

Run: `npx vitest run`
Expected: "No test files found" (no tests exist yet, but config works)

- [ ] **Step 5: Commit**

```bash
git add vitest.config.ts package.json package-lock.json
git commit -m "chore: bootstrap vitest test infrastructure"
```

---

### Task 2: Install Precision Math Library

**Files:**
- Modify: `package.json`

- [ ] **Step 1: Install decimal.js and date-fns**

```bash
npm install decimal.js date-fns nanoid
npm install -D @types/node
```

- [ ] **Step 2: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: add decimal.js, date-fns, nanoid for financial operations"
```

---

## Phase 2: Ledger Type Definitions

### Task 3: Create Ledger Zod Schemas and TypeScript Types

**Files:**
- Create: `src/lib/ledger/types.ts`

- [ ] **Step 1: Create the types file with Zod schemas**

```typescript
// src/lib/ledger/types.ts

import { z } from 'zod';

// ─────────────────────────────────────────────────────────
// ENUMS
// ─────────────────────────────────────────────────────────

export const AccountType = z.enum(['asset', 'liability', 'equity', 'revenue', 'expense']);
export type AccountType = z.infer<typeof AccountType>;

export const AccountSubtype = z.enum([
  'cash', 'crypto_wallet', 'exchange', 'bank', 'receivable', 'inventory',
  'prepaid', 'equipment', 'investment', 'payable', 'unearned_revenue',
  'tax_payable', 'credit_payable', 'loan', 'equity', 'retained_earnings',
  'treasury', 'revenue', 'cogs', 'operating_expense', 'other',
]);
export type AccountSubtype = z.infer<typeof AccountSubtype>;

export const JournalStatus = z.enum(['draft', 'posted', 'reversed']);
export type JournalStatus = z.infer<typeof JournalStatus>;

export const JournalSourceType = z.enum([
  'payment', 'refund', 'credit_grant', 'credit_consume', 'subscription',
  'invoice', 'loan_disburse', 'loan_repayment', 'overage', 'transfer',
  'yield', 'platform_fee', 'payout', 'tax_remittance', 'wallet_sync',
  'swap', 'royalty', 'escrow_hold', 'escrow_release', 'manual',
]);
export type JournalSourceType = z.infer<typeof JournalSourceType>;

export const CustodyType = z.enum(['self', 'custodial', 'embedded', 'exchange', 'bank']);
export type CustodyType = z.infer<typeof CustodyType>;

export const SyncStrategy = z.enum(['realtime', 'polling', 'webhook', 'manual']);
export type SyncStrategy = z.infer<typeof SyncStrategy>;

export const CreditOwnerType = z.enum(['user', 'organization', 'venture']);
export type CreditOwnerType = z.infer<typeof CreditOwnerType>;

export const FiscalPeriodStatus = z.enum(['open', 'closed', 'locked']);
export type FiscalPeriodStatus = z.infer<typeof FiscalPeriodStatus>;

// ─────────────────────────────────────────────────────────
// WALLET BINDING
// ─────────────────────────────────────────────────────────

export const WalletBindingSchema = z.object({
  chain: z.enum(['solana', 'ethereum', 'bitcoin']).nullable(),
  address: z.string().nullable(),
  provider: z.string().nullable(),
  custodyType: CustodyType,
  lastSyncedAt: z.string().datetime().nullable(),
  syncStrategy: SyncStrategy,
});
export type WalletBinding = z.infer<typeof WalletBindingSchema>;

// ─────────────────────────────────────────────────────────
// LEDGER ACCOUNT
// ─────────────────────────────────────────────────────────

export const LedgerAccountSchema = z.object({
  id: z.string().uuid(),
  ventureId: z.string(),
  code: z.string().regex(/^\d{4}$/),
  name: z.string().min(1).max(200),
  type: AccountType,
  subtype: AccountSubtype,
  currency: z.string().min(2).max(10),
  currentBalance: z.number(),
  isSystem: z.boolean(),
  wallet: WalletBindingSchema.nullable(),
  metadata: z.record(z.unknown()).default({}),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});
export type LedgerAccount = z.infer<typeof LedgerAccountSchema>;

export const CreateAccountInput = z.object({
  ventureId: z.string(),
  code: z.string().regex(/^\d{4}$/),
  name: z.string().min(1).max(200),
  type: AccountType,
  subtype: AccountSubtype,
  currency: z.string().min(2).max(10).default('USD'),
  isSystem: z.boolean().default(false),
  wallet: WalletBindingSchema.nullable().default(null),
  metadata: z.record(z.unknown()).default({}),
});
export type CreateAccountInput = z.infer<typeof CreateAccountInput>;

// ─────────────────────────────────────────────────────────
// JOURNAL ENTRY LINE (dimensions)
// ─────────────────────────────────────────────────────────

export const LineDimensionsSchema = z.object({
  ventureId: z.string().optional(),
  productId: z.string().optional(),
  customerId: z.string().optional(),
  departmentId: z.string().optional(),
  projectId: z.string().optional(),
  rail: z.string().optional(),
  taxJurisdiction: z.string().optional(),
});
export type LineDimensions = z.infer<typeof LineDimensionsSchema>;

export const JournalEntryLineInput = z.object({
  accountId: z.string().uuid(),
  debitAmount: z.number().min(0),
  creditAmount: z.number().min(0),
  currency: z.string().min(2).max(10).default('USD'),
  exchangeRate: z.number().positive().default(1),
  dimensions: LineDimensionsSchema.default({}),
}).refine(
  (line) => (line.debitAmount > 0) !== (line.creditAmount > 0),
  { message: 'Each line must have either a debit OR credit amount, not both or neither' }
);
export type JournalEntryLineInput = z.infer<typeof JournalEntryLineInput>;

// ─────────────────────────────────────────────────────────
// JOURNAL ENTRY
// ─────────────────────────────────────────────────────────

export const CreateJournalEntryInput = z.object({
  ventureId: z.string(),
  entryDate: z.string().datetime(),
  description: z.string().min(1).max(500),
  sourceType: JournalSourceType,
  sourceId: z.string(),
  lines: z.array(JournalEntryLineInput).min(2),
}).refine(
  (entry) => {
    const totalDebits = entry.lines.reduce((sum, l) => sum + l.debitAmount, 0);
    const totalCredits = entry.lines.reduce((sum, l) => sum + l.creditAmount, 0);
    return Math.abs(totalDebits - totalCredits) < 0.001;
  },
  { message: 'Journal entry must balance: total debits must equal total credits' }
);
export type CreateJournalEntryInput = z.infer<typeof CreateJournalEntryInput>;

export interface JournalEntry {
  id: string;
  ventureId: string;
  entryNumber: string;
  entryDate: string;
  description: string;
  sourceType: JournalSourceType;
  sourceId: string;
  status: JournalStatus;
  lines: JournalEntryLine[];
  postedAt: string | null;
  postedBy: string | null;
  reversalOf: string | null;
  createdAt: string;
}

export interface JournalEntryLine {
  id: string;
  entryId: string;
  accountId: string;
  lineNumber: number;
  debitAmount: number;
  creditAmount: number;
  currency: string;
  exchangeRate: number;
  dimensions: LineDimensions;
}

// ─────────────────────────────────────────────────────────
// CREDIT ACCOUNT
// ─────────────────────────────────────────────────────────

export const CreateCreditAccountInput = z.object({
  ventureId: z.string(),
  ownerId: z.string(),
  ownerType: CreditOwnerType,
  currency: z.string().default('credits'),
  creditLimit: z.number().min(0).default(0),
  expiresAt: z.string().datetime().nullable().default(null),
  metadata: z.record(z.unknown()).default({}),
});
export type CreateCreditAccountInput = z.infer<typeof CreateCreditAccountInput>;

export interface CreditAccount {
  id: string;
  ventureId: string;
  ownerId: string;
  ownerType: CreditOwnerType;
  currency: string;
  balance: number;
  creditLimit: number;
  totalGranted: number;
  totalConsumed: number;
  totalExpired: number;
  expiresAt: string | null;
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

// ─────────────────────────────────────────────────────────
// FISCAL PERIODS
// ─────────────────────────────────────────────────────────

export interface FiscalYear {
  id: string;
  ventureId: string;
  name: string;
  startDate: string;
  endDate: string;
  status: FiscalPeriodStatus;
  isCurrent: boolean;
}

export interface FiscalPeriod {
  id: string;
  fiscalYearId: string;
  periodNumber: number;
  periodName: string;
  startDate: string;
  endDate: string;
  status: FiscalPeriodStatus;
}

export interface AccountBalance {
  id: string;
  accountId: string;
  periodId: string;
  openingBalance: number;
  debits: number;
  credits: number;
  closingBalance: number;
  currency: string;
}

// ─────────────────────────────────────────────────────────
// TRIAL BALANCE
// ─────────────────────────────────────────────────────────

export interface TrialBalanceRow {
  accountId: string;
  accountCode: string;
  accountName: string;
  accountType: AccountType;
  debitBalance: number;
  creditBalance: number;
  currency: string;
}
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/ledger/types.ts
git commit -m "feat(ledger): add Zod schemas and TypeScript types for universal ledger"
```

---

## Phase 3: Database Migration

### Task 4: Create Supabase Migration for Ledger Tables

**Files:**
- Create: `supabase/migration-ledger.sql`

- [ ] **Step 1: Write the migration SQL**

```sql
-- supabase/migration-ledger.sql
-- Universal Ledger — MCV Commerce & Financial OS (SPEC-002)
-- Double-entry accounting primitive at Tier 2

-- ═══════════════════════════════════════════════════════════
-- LEDGER ACCOUNTS
-- ═══════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS ledger_accounts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  venture_id TEXT NOT NULL,
  code TEXT NOT NULL CHECK (code ~ '^\d{4}$'),
  name TEXT NOT NULL CHECK (char_length(name) BETWEEN 1 AND 200),
  type TEXT NOT NULL CHECK (type IN ('asset', 'liability', 'equity', 'revenue', 'expense')),
  subtype TEXT NOT NULL,
  currency TEXT NOT NULL DEFAULT 'USD' CHECK (char_length(currency) BETWEEN 2 AND 10),
  current_balance NUMERIC(20, 4) NOT NULL DEFAULT 0,
  is_system BOOLEAN NOT NULL DEFAULT false,
  -- Wallet binding (null for non-wallet accounts)
  wallet_chain TEXT CHECK (wallet_chain IN ('solana', 'ethereum', 'bitcoin')),
  wallet_address TEXT,
  wallet_provider TEXT,
  wallet_custody_type TEXT CHECK (wallet_custody_type IN ('self', 'custodial', 'embedded', 'exchange', 'bank')),
  wallet_last_synced_at TIMESTAMPTZ,
  wallet_sync_strategy TEXT CHECK (wallet_sync_strategy IN ('realtime', 'polling', 'webhook', 'manual')),
  metadata JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  -- Unique code per venture
  UNIQUE (venture_id, code)
);

CREATE INDEX idx_ledger_accounts_venture ON ledger_accounts (venture_id);
CREATE INDEX idx_ledger_accounts_type ON ledger_accounts (venture_id, type);
CREATE INDEX idx_ledger_accounts_wallet ON ledger_accounts (wallet_address) WHERE wallet_address IS NOT NULL;

-- ═══════════════════════════════════════════════════════════
-- JOURNAL ENTRIES
-- ═══════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS journal_entries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  venture_id TEXT NOT NULL,
  entry_number TEXT NOT NULL,
  entry_date TIMESTAMPTZ NOT NULL,
  description TEXT NOT NULL CHECK (char_length(description) BETWEEN 1 AND 500),
  source_type TEXT NOT NULL,
  source_id TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'posted', 'reversed')),
  posted_at TIMESTAMPTZ,
  posted_by TEXT,
  reversal_of UUID REFERENCES journal_entries(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  -- Unique entry number per venture
  UNIQUE (venture_id, entry_number)
);

CREATE INDEX idx_journal_entries_venture ON journal_entries (venture_id);
CREATE INDEX idx_journal_entries_date ON journal_entries (venture_id, entry_date);
CREATE INDEX idx_journal_entries_source ON journal_entries (source_type, source_id);
CREATE INDEX idx_journal_entries_status ON journal_entries (venture_id, status);

-- ═══════════════════════════════════════════════════════════
-- JOURNAL ENTRY LINES
-- ═══════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS journal_entry_lines (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  entry_id UUID NOT NULL REFERENCES journal_entries(id) ON DELETE CASCADE,
  account_id UUID NOT NULL REFERENCES ledger_accounts(id),
  line_number INTEGER NOT NULL,
  debit_amount NUMERIC(20, 4) NOT NULL DEFAULT 0 CHECK (debit_amount >= 0),
  credit_amount NUMERIC(20, 4) NOT NULL DEFAULT 0 CHECK (credit_amount >= 0),
  currency TEXT NOT NULL DEFAULT 'USD',
  exchange_rate NUMERIC(20, 8) NOT NULL DEFAULT 1 CHECK (exchange_rate > 0),
  -- Dimensions for reporting slices
  dim_venture_id TEXT,
  dim_product_id TEXT,
  dim_customer_id TEXT,
  dim_department_id TEXT,
  dim_project_id TEXT,
  dim_rail TEXT,
  dim_tax_jurisdiction TEXT,
  -- Each line must have debit XOR credit (not both, not neither)
  CHECK ((debit_amount > 0 AND credit_amount = 0) OR (debit_amount = 0 AND credit_amount > 0))
);

CREATE INDEX idx_jel_entry ON journal_entry_lines (entry_id);
CREATE INDEX idx_jel_account ON journal_entry_lines (account_id);

-- ═══════════════════════════════════════════════════════════
-- BALANCE CONSTRAINT FUNCTION
-- Ensures every journal entry balances (debits = credits)
-- ═══════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION check_journal_entry_balance()
RETURNS TRIGGER AS $$
DECLARE
  total_debits NUMERIC(20, 4);
  total_credits NUMERIC(20, 4);
BEGIN
  SELECT
    COALESCE(SUM(debit_amount), 0),
    COALESCE(SUM(credit_amount), 0)
  INTO total_debits, total_credits
  FROM journal_entry_lines
  WHERE entry_id = NEW.entry_id;

  IF ABS(total_debits - total_credits) > 0.001 THEN
    RAISE EXCEPTION 'Journal entry does not balance: debits=% credits=%', total_debits, total_credits;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Note: This trigger fires AFTER each line insert.
-- For batch inserts, use a deferred constraint trigger or validate in application code.

-- ═══════════════════════════════════════════════════════════
-- ACCOUNT BALANCE UPDATE TRIGGER
-- Updates ledger_accounts.current_balance when entries are posted
-- ═══════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION update_account_balance()
RETURNS TRIGGER AS $$
BEGIN
  -- Only update balances for posted entries
  IF NEW.status = 'posted' AND (OLD IS NULL OR OLD.status != 'posted') THEN
    UPDATE ledger_accounts
    SET current_balance = current_balance + sub.net_amount,
        updated_at = now()
    FROM (
      SELECT
        account_id,
        SUM(
          CASE
            WHEN la.type IN ('asset', 'expense') THEN debit_amount - credit_amount
            ELSE credit_amount - debit_amount
          END
        ) AS net_amount
      FROM journal_entry_lines jel
      JOIN ledger_accounts la ON la.id = jel.account_id
      WHERE jel.entry_id = NEW.id
      GROUP BY account_id
    ) sub
    WHERE ledger_accounts.id = sub.account_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_update_account_balance
  AFTER UPDATE OF status ON journal_entries
  FOR EACH ROW
  EXECUTE FUNCTION update_account_balance();

-- ═══════════════════════════════════════════════════════════
-- ENTRY NUMBER SEQUENCE FUNCTION
-- Auto-generates entry numbers per venture: JE-000001, JE-000002, etc.
-- ═══════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION generate_entry_number()
RETURNS TRIGGER AS $$
DECLARE
  next_num INTEGER;
BEGIN
  SELECT COALESCE(MAX(
    CAST(SUBSTRING(entry_number FROM 4) AS INTEGER)
  ), 0) + 1
  INTO next_num
  FROM journal_entries
  WHERE venture_id = NEW.venture_id;

  NEW.entry_number := 'JE-' || LPAD(next_num::TEXT, 6, '0');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_generate_entry_number
  BEFORE INSERT ON journal_entries
  FOR EACH ROW
  EXECUTE FUNCTION generate_entry_number();

-- ═══════════════════════════════════════════════════════════
-- CREDIT ACCOUNTS
-- ═══════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS credit_accounts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  venture_id TEXT NOT NULL,
  owner_id TEXT NOT NULL,
  owner_type TEXT NOT NULL CHECK (owner_type IN ('user', 'organization', 'venture')),
  currency TEXT NOT NULL DEFAULT 'credits',
  balance NUMERIC(20, 4) NOT NULL DEFAULT 0,
  credit_limit NUMERIC(20, 4) NOT NULL DEFAULT 0,
  total_granted NUMERIC(20, 4) NOT NULL DEFAULT 0,
  total_consumed NUMERIC(20, 4) NOT NULL DEFAULT 0,
  total_expired NUMERIC(20, 4) NOT NULL DEFAULT 0,
  expires_at TIMESTAMPTZ,
  metadata JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  -- One credit account per owner per venture per currency
  UNIQUE (venture_id, owner_id, currency)
);

CREATE INDEX idx_credit_accounts_venture ON credit_accounts (venture_id);
CREATE INDEX idx_credit_accounts_owner ON credit_accounts (owner_id);

-- ═══════════════════════════════════════════════════════════
-- FISCAL YEARS & PERIODS
-- ═══════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS fiscal_years (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  venture_id TEXT NOT NULL,
  name TEXT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'closed', 'locked')),
  is_current BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (end_date > start_date)
);

CREATE TABLE IF NOT EXISTS fiscal_periods (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  fiscal_year_id UUID NOT NULL REFERENCES fiscal_years(id) ON DELETE CASCADE,
  period_number INTEGER NOT NULL CHECK (period_number BETWEEN 1 AND 13),
  period_name TEXT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'closed', 'locked')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (end_date > start_date)
);

-- ═══════════════════════════════════════════════════════════
-- ACCOUNT BALANCE SNAPSHOTS
-- ═══════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS account_balances (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  account_id UUID NOT NULL REFERENCES ledger_accounts(id),
  period_id UUID NOT NULL REFERENCES fiscal_periods(id),
  opening_balance NUMERIC(20, 4) NOT NULL DEFAULT 0,
  debits NUMERIC(20, 4) NOT NULL DEFAULT 0,
  credits NUMERIC(20, 4) NOT NULL DEFAULT 0,
  closing_balance NUMERIC(20, 4) NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'USD',
  UNIQUE (account_id, period_id)
);

-- ═══════════════════════════════════════════════════════════
-- RECURRING JOURNALS
-- ═══════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS recurring_journals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  venture_id TEXT NOT NULL,
  template_name TEXT NOT NULL,
  description TEXT NOT NULL,
  frequency TEXT NOT NULL CHECK (frequency IN ('daily', 'weekly', 'monthly', 'quarterly', 'annually')),
  next_run_date DATE NOT NULL,
  lines JSONB NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused', 'completed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ═══════════════════════════════════════════════════════════
-- ROW LEVEL SECURITY
-- ═══════════════════════════════════════════════════════════

ALTER TABLE ledger_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE journal_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE journal_entry_lines ENABLE ROW LEVEL SECURITY;
ALTER TABLE credit_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE fiscal_years ENABLE ROW LEVEL SECURITY;
ALTER TABLE fiscal_periods ENABLE ROW LEVEL SECURITY;
ALTER TABLE account_balances ENABLE ROW LEVEL SECURITY;
ALTER TABLE recurring_journals ENABLE ROW LEVEL SECURITY;

-- Permissive policies (tighten in production)
CREATE POLICY "Allow all for authenticated users" ON ledger_accounts FOR ALL USING (true);
CREATE POLICY "Allow all for authenticated users" ON journal_entries FOR ALL USING (true);
CREATE POLICY "Allow all for authenticated users" ON journal_entry_lines FOR ALL USING (true);
CREATE POLICY "Allow all for authenticated users" ON credit_accounts FOR ALL USING (true);
CREATE POLICY "Allow all for authenticated users" ON fiscal_years FOR ALL USING (true);
CREATE POLICY "Allow all for authenticated users" ON fiscal_periods FOR ALL USING (true);
CREATE POLICY "Allow all for authenticated users" ON account_balances FOR ALL USING (true);
CREATE POLICY "Allow all for authenticated users" ON recurring_journals FOR ALL USING (true);
```

- [ ] **Step 2: Commit**

```bash
git add supabase/migration-ledger.sql
git commit -m "feat(ledger): add Supabase migration for 8 ledger tables with balance constraints"
```

---

## Phase 4: Chart of Accounts

### Task 5: Create Chart of Accounts Provisioning

**Files:**
- Create: `src/lib/ledger/chart-of-accounts.ts`
- Create: `src/lib/ledger/__tests__/chart-of-accounts.test.ts`

- [ ] **Step 1: Write the failing test**

```typescript
// src/lib/ledger/__tests__/chart-of-accounts.test.ts
import { describe, it, expect } from 'vitest';
import { DEFAULT_CHART_OF_ACCOUNTS, getAccountsByType } from '../chart-of-accounts';

describe('Chart of Accounts', () => {
  it('has at least one account per type', () => {
    const types = ['asset', 'liability', 'equity', 'revenue', 'expense'] as const;
    for (const type of types) {
      const accounts = getAccountsByType(type);
      expect(accounts.length).toBeGreaterThan(0);
    }
  });

  it('has unique codes across all accounts', () => {
    const codes = DEFAULT_CHART_OF_ACCOUNTS.map((a) => a.code);
    expect(new Set(codes).size).toBe(codes.length);
  });

  it('all codes are 4-digit strings', () => {
    for (const account of DEFAULT_CHART_OF_ACCOUNTS) {
      expect(account.code).toMatch(/^\d{4}$/);
    }
  });

  it('asset codes start with 1', () => {
    const assets = getAccountsByType('asset');
    for (const a of assets) {
      expect(a.code[0]).toBe('1');
    }
  });

  it('liability codes start with 2', () => {
    const liabilities = getAccountsByType('liability');
    for (const a of liabilities) {
      expect(a.code[0]).toBe('2');
    }
  });

  it('revenue codes start with 4', () => {
    const revenue = getAccountsByType('revenue');
    for (const a of revenue) {
      expect(a.code[0]).toBe('4');
    }
  });

  it('expense codes start with 5', () => {
    const expenses = getAccountsByType('expense');
    for (const a of expenses) {
      expect(a.code[0]).toBe('5');
    }
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/lib/ledger/__tests__/chart-of-accounts.test.ts`
Expected: FAIL — module not found

- [ ] **Step 3: Implement chart-of-accounts.ts**

```typescript
// src/lib/ledger/chart-of-accounts.ts

import type { AccountType, AccountSubtype } from './types';

export interface ChartOfAccountsEntry {
  code: string;
  name: string;
  type: AccountType;
  subtype: AccountSubtype;
  currency: string;
  isSystem: boolean;
}

export const DEFAULT_CHART_OF_ACCOUNTS: ChartOfAccountsEntry[] = [
  // ── ASSETS (1xxx) ──────────────────────────────────────
  { code: '1010', name: 'Cash - Stripe Balance',       type: 'asset', subtype: 'cash',          currency: 'USD', isSystem: true },
  { code: '1011', name: 'Cash - Bank (Primary)',        type: 'asset', subtype: 'bank',          currency: 'USD', isSystem: true },
  { code: '1012', name: 'Cash - Bank (Secondary)',      type: 'asset', subtype: 'bank',          currency: 'USD', isSystem: false },
  { code: '1013', name: 'Cash - PayPal Balance',        type: 'asset', subtype: 'cash',          currency: 'USD', isSystem: false },
  { code: '1014', name: 'Cash - Square Balance',        type: 'asset', subtype: 'cash',          currency: 'USD', isSystem: false },
  { code: '1020', name: 'Accounts Receivable',          type: 'asset', subtype: 'receivable',    currency: 'USD', isSystem: true },
  { code: '1025', name: 'Accounts Receivable - Invoiced', type: 'asset', subtype: 'receivable',  currency: 'USD', isSystem: true },
  { code: '1030', name: 'Inventory - Physical Goods',   type: 'asset', subtype: 'inventory',     currency: 'USD', isSystem: false },
  { code: '1040', name: 'Prepaid Expenses',             type: 'asset', subtype: 'prepaid',       currency: 'USD', isSystem: false },
  { code: '1050', name: 'Crypto - USDC Wallet',         type: 'asset', subtype: 'crypto_wallet', currency: 'USDC', isSystem: true },
  { code: '1051', name: 'Crypto - SOL Wallet',          type: 'asset', subtype: 'crypto_wallet', currency: 'SOL', isSystem: true },
  { code: '1052', name: 'Crypto - EDGE Wallet',         type: 'asset', subtype: 'crypto_wallet', currency: 'EDGE', isSystem: true },
  { code: '1055', name: 'Crypto - Exchange (Coinbase)', type: 'asset', subtype: 'exchange',      currency: 'USD', isSystem: false },
  { code: '1060', name: 'Platform Credits Receivable',  type: 'asset', subtype: 'receivable',    currency: 'USD', isSystem: true },
  { code: '1070', name: 'Loans Receivable - Short Term', type: 'asset', subtype: 'receivable',   currency: 'USD', isSystem: true },
  { code: '1071', name: 'Loans Receivable - Long Term', type: 'asset', subtype: 'receivable',    currency: 'USD', isSystem: false },
  { code: '1095', name: 'Escrow Holding',               type: 'asset', subtype: 'cash',          currency: 'USD', isSystem: true },

  // ── LIABILITIES (2xxx) ─────────────────────────────────
  { code: '2010', name: 'Accounts Payable',             type: 'liability', subtype: 'payable',           currency: 'USD', isSystem: true },
  { code: '2020', name: 'Credits Payable',              type: 'liability', subtype: 'credit_payable',    currency: 'USD', isSystem: true },
  { code: '2030', name: 'Unearned Revenue',             type: 'liability', subtype: 'unearned_revenue',  currency: 'USD', isSystem: true },
  { code: '2040', name: 'Loans Payable - Short Term',   type: 'liability', subtype: 'loan',              currency: 'USD', isSystem: false },
  { code: '2050', name: 'Platform Fees Payable',        type: 'liability', subtype: 'payable',           currency: 'USD', isSystem: true },
  { code: '2060', name: 'Tax Payable - Sales Tax',      type: 'liability', subtype: 'tax_payable',       currency: 'USD', isSystem: true },
  { code: '2070', name: 'Refunds Payable',              type: 'liability', subtype: 'payable',           currency: 'USD', isSystem: true },
  { code: '2080', name: 'Customer Deposits',            type: 'liability', subtype: 'payable',           currency: 'USD', isSystem: false },

  // ── EQUITY (3xxx) ──────────────────────────────────────
  { code: '3010', name: "Owner's Equity",               type: 'equity', subtype: 'equity',              currency: 'USD', isSystem: true },
  { code: '3020', name: 'Retained Earnings',            type: 'equity', subtype: 'retained_earnings',   currency: 'USD', isSystem: true },
  { code: '3030', name: 'Token Treasury',               type: 'equity', subtype: 'treasury',            currency: 'EDGE', isSystem: true },

  // ── REVENUE (4xxx) ─────────────────────────────────────
  { code: '4010', name: 'Revenue - Subscriptions',      type: 'revenue', subtype: 'revenue', currency: 'USD', isSystem: true },
  { code: '4020', name: 'Revenue - One-Time Sales',     type: 'revenue', subtype: 'revenue', currency: 'USD', isSystem: true },
  { code: '4030', name: 'Revenue - Digital Products',   type: 'revenue', subtype: 'revenue', currency: 'USD', isSystem: true },
  { code: '4040', name: 'Revenue - Physical Goods',     type: 'revenue', subtype: 'revenue', currency: 'USD', isSystem: true },
  { code: '4050', name: 'Revenue - Platform Fees',      type: 'revenue', subtype: 'revenue', currency: 'USD', isSystem: true },
  { code: '4060', name: 'Revenue - Transaction Fees',   type: 'revenue', subtype: 'revenue', currency: 'USD', isSystem: true },
  { code: '4070', name: 'Revenue - Credit Sales',       type: 'revenue', subtype: 'revenue', currency: 'USD', isSystem: true },
  { code: '4080', name: 'Revenue - Interest (Loans)',   type: 'revenue', subtype: 'revenue', currency: 'USD', isSystem: true },
  { code: '4090', name: 'Revenue - Yield Distributions', type: 'revenue', subtype: 'revenue', currency: 'USD', isSystem: true },
  { code: '4100', name: 'Revenue - Marketplace Commissions', type: 'revenue', subtype: 'revenue', currency: 'USD', isSystem: true },
  { code: '4110', name: 'Revenue - Services',           type: 'revenue', subtype: 'revenue', currency: 'USD', isSystem: true },
  { code: '4120', name: 'Revenue - Metered Usage',      type: 'revenue', subtype: 'revenue', currency: 'USD', isSystem: true },
  { code: '4130', name: 'Revenue - Royalties',          type: 'revenue', subtype: 'revenue', currency: 'USD', isSystem: true },

  // ── EXPENSES (5xxx) ────────────────────────────────────
  { code: '5010', name: 'COGS - Physical Goods',        type: 'expense', subtype: 'cogs',              currency: 'USD', isSystem: true },
  { code: '5020', name: 'COGS - Digital Delivery',      type: 'expense', subtype: 'cogs',              currency: 'USD', isSystem: true },
  { code: '5030', name: 'Payment Processing Fees',      type: 'expense', subtype: 'operating_expense', currency: 'USD', isSystem: true },
  { code: '5040', name: 'Refunds & Chargebacks',        type: 'expense', subtype: 'operating_expense', currency: 'USD', isSystem: true },
  { code: '5050', name: 'Credit Grants (Promotional)',  type: 'expense', subtype: 'operating_expense', currency: 'USD', isSystem: true },
  { code: '5060', name: 'Loan Write-offs',              type: 'expense', subtype: 'operating_expense', currency: 'USD', isSystem: true },
  { code: '5070', name: 'Infrastructure Costs',         type: 'expense', subtype: 'operating_expense', currency: 'USD', isSystem: false },
  { code: '5080', name: 'Third-Party Service Fees',     type: 'expense', subtype: 'operating_expense', currency: 'USD', isSystem: false },
  { code: '5090', name: 'FX Gains/Losses',              type: 'expense', subtype: 'other',             currency: 'USD', isSystem: true },
];

export function getAccountsByType(type: AccountType): ChartOfAccountsEntry[] {
  return DEFAULT_CHART_OF_ACCOUNTS.filter((a) => a.type === type);
}

export function getAccountByCode(code: string): ChartOfAccountsEntry | undefined {
  return DEFAULT_CHART_OF_ACCOUNTS.find((a) => a.code === code);
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/lib/ledger/__tests__/chart-of-accounts.test.ts`
Expected: All 7 tests PASS

- [ ] **Step 5: Commit**

```bash
git add src/lib/ledger/chart-of-accounts.ts src/lib/ledger/__tests__/chart-of-accounts.test.ts
git commit -m "feat(ledger): add default chart of accounts with 48 accounts across 5 types"
```

---

## Phase 5: Core Ledger Service

### Task 6: Create Ledger Service — Account Operations

**Files:**
- Create: `src/lib/ledger/service.ts`
- Create: `src/lib/ledger/__tests__/service.test.ts`

- [ ] **Step 1: Write the failing tests for account operations**

```typescript
// src/lib/ledger/__tests__/service.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createAccount, getAccountByCode, listAccounts, provisionVentureAccounts } from '../service';
import { DEFAULT_CHART_OF_ACCOUNTS } from '../chart-of-accounts';

// Mock Supabase client
const mockFrom = vi.fn();
const mockSupabase = { from: mockFrom };

vi.mock('@/lib/supabase', () => ({
  supabase: { from: (...args: unknown[]) => mockFrom(...args) },
}));

describe('Ledger Service — Accounts', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('createAccount validates input with Zod', async () => {
    await expect(
      createAccount({ ventureId: '', code: '999', name: '', type: 'asset' as any, subtype: 'cash' as any, currency: 'USD' })
    ).rejects.toThrow();
  });

  it('createAccount calls supabase insert with correct shape', async () => {
    const insertMock = vi.fn().mockReturnValue({ select: vi.fn().mockReturnValue({ single: vi.fn().mockResolvedValue({ data: { id: 'test-id' }, error: null }) }) });
    mockFrom.mockReturnValue({ insert: insertMock });

    const result = await createAccount({
      ventureId: 'mcv',
      code: '1010',
      name: 'Test Cash',
      type: 'asset',
      subtype: 'cash',
      currency: 'USD',
    });

    expect(mockFrom).toHaveBeenCalledWith('ledger_accounts');
    expect(insertMock).toHaveBeenCalled();
  });

  it('provisionVentureAccounts creates all default accounts', async () => {
    const insertMock = vi.fn().mockResolvedValue({ data: [], error: null });
    mockFrom.mockReturnValue({ insert: insertMock });

    await provisionVentureAccounts('test-venture');

    expect(insertMock).toHaveBeenCalledTimes(1);
    const insertedRows = insertMock.mock.calls[0][0];
    expect(insertedRows.length).toBe(DEFAULT_CHART_OF_ACCOUNTS.length);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/lib/ledger/__tests__/service.test.ts`
Expected: FAIL — module '../service' not found

- [ ] **Step 3: Implement service.ts — account operations**

```typescript
// src/lib/ledger/service.ts

import { supabase } from '@/lib/supabase';
import { CreateAccountInput, CreateJournalEntryInput, JournalEntry, JournalEntryLine, LedgerAccount, TrialBalanceRow } from './types';
import { DEFAULT_CHART_OF_ACCOUNTS } from './chart-of-accounts';

// ─────────────────────────────────────────────────────────
// ACCOUNT OPERATIONS
// ─────────────────────────────────────────────────────────

export async function createAccount(input: {
  ventureId: string;
  code: string;
  name: string;
  type: string;
  subtype: string;
  currency?: string;
  isSystem?: boolean;
  wallet?: Record<string, unknown> | null;
  metadata?: Record<string, unknown>;
}): Promise<LedgerAccount> {
  const validated = CreateAccountInput.parse(input);

  const row = {
    venture_id: validated.ventureId,
    code: validated.code,
    name: validated.name,
    type: validated.type,
    subtype: validated.subtype,
    currency: validated.currency,
    is_system: validated.isSystem,
    wallet_chain: validated.wallet?.chain ?? null,
    wallet_address: validated.wallet?.address ?? null,
    wallet_provider: validated.wallet?.provider ?? null,
    wallet_custody_type: validated.wallet?.custodyType ?? null,
    wallet_sync_strategy: validated.wallet?.syncStrategy ?? null,
    metadata: validated.metadata,
  };

  const { data, error } = await supabase
    .from('ledger_accounts')
    .insert(row)
    .select()
    .single();

  if (error) throw new Error(`Failed to create account: ${error.message}`);
  return mapAccountRow(data);
}

export async function getAccountByCode(ventureId: string, code: string): Promise<LedgerAccount | null> {
  const { data, error } = await supabase
    .from('ledger_accounts')
    .select()
    .eq('venture_id', ventureId)
    .eq('code', code)
    .single();

  if (error?.code === 'PGRST116') return null; // not found
  if (error) throw new Error(`Failed to get account: ${error.message}`);
  return mapAccountRow(data);
}

export async function listAccounts(ventureId: string, filters?: {
  type?: string;
  subtype?: string;
}): Promise<LedgerAccount[]> {
  let query = supabase
    .from('ledger_accounts')
    .select()
    .eq('venture_id', ventureId)
    .order('code', { ascending: true });

  if (filters?.type) query = query.eq('type', filters.type);
  if (filters?.subtype) query = query.eq('subtype', filters.subtype);

  const { data, error } = await query;
  if (error) throw new Error(`Failed to list accounts: ${error.message}`);
  return (data ?? []).map(mapAccountRow);
}

export async function provisionVentureAccounts(ventureId: string): Promise<void> {
  const rows = DEFAULT_CHART_OF_ACCOUNTS.map((a) => ({
    venture_id: ventureId,
    code: a.code,
    name: a.name,
    type: a.type,
    subtype: a.subtype,
    currency: a.currency,
    is_system: a.isSystem,
    metadata: {},
  }));

  const { error } = await supabase
    .from('ledger_accounts')
    .insert(rows);

  if (error) throw new Error(`Failed to provision accounts: ${error.message}`);
}

// ─────────────────────────────────────────────────────────
// JOURNAL ENTRY OPERATIONS
// ─────────────────────────────────────────────────────────

export async function createJournalEntry(input: {
  ventureId: string;
  entryDate: string;
  description: string;
  sourceType: string;
  sourceId: string;
  lines: Array<{
    accountId: string;
    debitAmount: number;
    creditAmount: number;
    currency?: string;
    exchangeRate?: number;
    dimensions?: Record<string, string | undefined>;
  }>;
}): Promise<JournalEntry> {
  const validated = CreateJournalEntryInput.parse(input);

  // Insert entry (entry_number auto-generated by trigger)
  const { data: entry, error: entryError } = await supabase
    .from('journal_entries')
    .insert({
      venture_id: validated.ventureId,
      entry_number: 'TEMP', // overwritten by trigger
      entry_date: validated.entryDate,
      description: validated.description,
      source_type: validated.sourceType,
      source_id: validated.sourceId,
      status: 'draft',
    })
    .select()
    .single();

  if (entryError) throw new Error(`Failed to create journal entry: ${entryError.message}`);

  // Insert lines
  const lineRows = validated.lines.map((line, i) => ({
    entry_id: entry.id,
    account_id: line.accountId,
    line_number: i + 1,
    debit_amount: line.debitAmount,
    credit_amount: line.creditAmount,
    currency: line.currency,
    exchange_rate: line.exchangeRate,
    dim_venture_id: line.dimensions?.ventureId ?? null,
    dim_product_id: line.dimensions?.productId ?? null,
    dim_customer_id: line.dimensions?.customerId ?? null,
    dim_department_id: line.dimensions?.departmentId ?? null,
    dim_project_id: line.dimensions?.projectId ?? null,
    dim_rail: line.dimensions?.rail ?? null,
    dim_tax_jurisdiction: line.dimensions?.taxJurisdiction ?? null,
  }));

  const { error: linesError } = await supabase
    .from('journal_entry_lines')
    .insert(lineRows);

  if (linesError) throw new Error(`Failed to create journal entry lines: ${linesError.message}`);

  return getJournalEntry(entry.id);
}

export async function postJournalEntry(entryId: string, postedBy: string): Promise<JournalEntry> {
  const { data, error } = await supabase
    .from('journal_entries')
    .update({ status: 'posted', posted_at: new Date().toISOString(), posted_by: postedBy })
    .eq('id', entryId)
    .eq('status', 'draft')
    .select()
    .single();

  if (error) throw new Error(`Failed to post journal entry: ${error.message}`);
  return getJournalEntry(data.id);
}

export async function reverseJournalEntry(entryId: string, postedBy: string): Promise<JournalEntry> {
  const original = await getJournalEntry(entryId);
  if (original.status !== 'posted') throw new Error('Can only reverse posted entries');

  // Create reversal: swap debits and credits
  const reversalLines = original.lines.map((line) => ({
    accountId: line.accountId,
    debitAmount: line.creditAmount,
    creditAmount: line.debitAmount,
    currency: line.currency,
    exchangeRate: line.exchangeRate,
    dimensions: line.dimensions,
  }));

  const reversal = await createJournalEntry({
    ventureId: original.ventureId,
    entryDate: new Date().toISOString(),
    description: `Reversal of ${original.entryNumber}: ${original.description}`,
    sourceType: original.sourceType,
    sourceId: original.sourceId,
    lines: reversalLines,
  });

  // Mark original as reversed
  await supabase
    .from('journal_entries')
    .update({ status: 'reversed' })
    .eq('id', entryId);

  // Post the reversal immediately
  return postJournalEntry(reversal.id, postedBy);
}

export async function getJournalEntry(entryId: string): Promise<JournalEntry> {
  const { data: entry, error: entryError } = await supabase
    .from('journal_entries')
    .select()
    .eq('id', entryId)
    .single();

  if (entryError) throw new Error(`Failed to get journal entry: ${entryError.message}`);

  const { data: lines, error: linesError } = await supabase
    .from('journal_entry_lines')
    .select()
    .eq('entry_id', entryId)
    .order('line_number', { ascending: true });

  if (linesError) throw new Error(`Failed to get journal entry lines: ${linesError.message}`);

  return mapEntryRow(entry, lines ?? []);
}

export async function getTrialBalance(ventureId: string, asOfDate?: string): Promise<TrialBalanceRow[]> {
  // Sum all posted entry lines grouped by account
  let query = supabase
    .from('journal_entry_lines')
    .select(`
      account_id,
      debit_amount,
      credit_amount,
      journal_entries!inner(venture_id, status, entry_date)
    `)
    .eq('journal_entries.venture_id', ventureId)
    .eq('journal_entries.status', 'posted');

  if (asOfDate) {
    query = query.lte('journal_entries.entry_date', asOfDate);
  }

  const { data, error } = await query;
  if (error) throw new Error(`Failed to get trial balance: ${error.message}`);

  // Aggregate by account
  const accountTotals = new Map<string, { debits: number; credits: number }>();
  for (const line of data ?? []) {
    const existing = accountTotals.get(line.account_id) ?? { debits: 0, credits: 0 };
    existing.debits += Number(line.debit_amount);
    existing.credits += Number(line.credit_amount);
    accountTotals.set(line.account_id, existing);
  }

  // Fetch account details
  const accountIds = Array.from(accountTotals.keys());
  if (accountIds.length === 0) return [];

  const { data: accounts } = await supabase
    .from('ledger_accounts')
    .select('id, code, name, type, currency')
    .in('id', accountIds);

  return (accounts ?? []).map((acc) => {
    const totals = accountTotals.get(acc.id)!;
    const isDebitNormal = acc.type === 'asset' || acc.type === 'expense';
    const netBalance = totals.debits - totals.credits;
    return {
      accountId: acc.id,
      accountCode: acc.code,
      accountName: acc.name,
      accountType: acc.type,
      debitBalance: isDebitNormal ? Math.max(netBalance, 0) : Math.max(-netBalance, 0),
      creditBalance: isDebitNormal ? Math.max(-netBalance, 0) : Math.max(netBalance, 0),
      currency: acc.currency,
    };
  }).sort((a, b) => a.accountCode.localeCompare(b.accountCode));
}

// ─────────────────────────────────────────────────────────
// ROW MAPPERS (snake_case → camelCase)
// ─────────────────────────────────────────────────────────

function mapAccountRow(row: Record<string, unknown>): LedgerAccount {
  return {
    id: row.id as string,
    ventureId: row.venture_id as string,
    code: row.code as string,
    name: row.name as string,
    type: row.type as LedgerAccount['type'],
    subtype: row.subtype as LedgerAccount['subtype'],
    currency: row.currency as string,
    currentBalance: Number(row.current_balance),
    isSystem: row.is_system as boolean,
    wallet: row.wallet_chain ? {
      chain: row.wallet_chain as WalletBinding['chain'],
      address: row.wallet_address as string | null,
      provider: row.wallet_provider as string | null,
      custodyType: row.wallet_custody_type as CustodyType,
      lastSyncedAt: row.wallet_last_synced_at as string | null,
      syncStrategy: row.wallet_sync_strategy as SyncStrategy,
    } : null,
    metadata: (row.metadata as Record<string, unknown>) ?? {},
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

function mapEntryRow(entry: Record<string, unknown>, lines: Record<string, unknown>[]): JournalEntry {
  return {
    id: entry.id as string,
    ventureId: entry.venture_id as string,
    entryNumber: entry.entry_number as string,
    entryDate: entry.entry_date as string,
    description: entry.description as string,
    sourceType: entry.source_type as JournalEntry['sourceType'],
    sourceId: entry.source_id as string,
    status: entry.status as JournalEntry['status'],
    lines: lines.map(mapLineRow),
    postedAt: entry.posted_at as string | null,
    postedBy: entry.posted_by as string | null,
    reversalOf: entry.reversal_of as string | null,
    createdAt: entry.created_at as string,
  };
}

function mapLineRow(row: Record<string, unknown>): JournalEntryLine {
  return {
    id: row.id as string,
    entryId: row.entry_id as string,
    accountId: row.account_id as string,
    lineNumber: row.line_number as number,
    debitAmount: Number(row.debit_amount),
    creditAmount: Number(row.credit_amount),
    currency: row.currency as string,
    exchangeRate: Number(row.exchange_rate),
    dimensions: {
      ventureId: row.dim_venture_id as string | undefined,
      productId: row.dim_product_id as string | undefined,
      customerId: row.dim_customer_id as string | undefined,
      departmentId: row.dim_department_id as string | undefined,
      projectId: row.dim_project_id as string | undefined,
      rail: row.dim_rail as string | undefined,
      taxJurisdiction: row.dim_tax_jurisdiction as string | undefined,
    },
  };
}

// Re-export needed types for imports
import type { WalletBinding, CustodyType, SyncStrategy } from './types';
```

- [ ] **Step 4: Run tests**

Run: `npx vitest run src/lib/ledger/__tests__/service.test.ts`
Expected: All 3 tests PASS

- [ ] **Step 5: Commit**

```bash
git add src/lib/ledger/service.ts src/lib/ledger/__tests__/service.test.ts
git commit -m "feat(ledger): add core ledger service with account + journal entry operations"
```

---

### Task 7: Create Credit Account Service

**Files:**
- Create: `src/lib/ledger/credit-service.ts`
- Create: `src/lib/ledger/__tests__/credit-service.test.ts`

- [ ] **Step 1: Write the failing tests**

```typescript
// src/lib/ledger/__tests__/credit-service.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { grantCredits, consumeCredits, getCreditBalance } from '../credit-service';

const mockFrom = vi.fn();
vi.mock('@/lib/supabase', () => ({
  supabase: { from: (...args: unknown[]) => mockFrom(...args) },
}));

// Mock the ledger service for journal entries
vi.mock('../service', () => ({
  createJournalEntry: vi.fn().mockResolvedValue({ id: 'je-1' }),
  postJournalEntry: vi.fn().mockResolvedValue({ id: 'je-1', status: 'posted' }),
  getAccountByCode: vi.fn().mockResolvedValue({ id: 'acct-2020' }),
}));

describe('Credit Service', () => {
  beforeEach(() => vi.clearAllMocks());

  it('grantCredits rejects negative amounts', async () => {
    await expect(
      grantCredits({ ventureId: 'v1', ownerId: 'u1', amount: -10, reason: 'test' })
    ).rejects.toThrow();
  });

  it('consumeCredits rejects amounts exceeding balance', async () => {
    // Mock: credit account with balance = 50
    const selectMock = vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({ data: { balance: 50 }, error: null })
        })
      })
    });
    mockFrom.mockReturnValue({ select: selectMock });

    await expect(
      consumeCredits({ ventureId: 'v1', ownerId: 'u1', amount: 100, reason: 'purchase' })
    ).rejects.toThrow('Insufficient credits');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/lib/ledger/__tests__/credit-service.test.ts`
Expected: FAIL — module '../credit-service' not found

- [ ] **Step 3: Implement credit-service.ts**

```typescript
// src/lib/ledger/credit-service.ts

import { supabase } from '@/lib/supabase';
import { CreateCreditAccountInput, type CreditAccount } from './types';
import { createJournalEntry, postJournalEntry, getAccountByCode } from './service';

export async function createCreditAccount(input: {
  ventureId: string;
  ownerId: string;
  ownerType?: string;
  currency?: string;
  creditLimit?: number;
  expiresAt?: string | null;
  metadata?: Record<string, unknown>;
}): Promise<CreditAccount> {
  const validated = CreateCreditAccountInput.parse(input);

  const row = {
    venture_id: validated.ventureId,
    owner_id: validated.ownerId,
    owner_type: validated.ownerType,
    currency: validated.currency,
    credit_limit: validated.creditLimit,
    expires_at: validated.expiresAt,
    metadata: validated.metadata,
  };

  const { data, error } = await supabase
    .from('credit_accounts')
    .insert(row)
    .select()
    .single();

  if (error) throw new Error(`Failed to create credit account: ${error.message}`);
  return mapCreditRow(data);
}

export async function grantCredits(input: {
  ventureId: string;
  ownerId: string;
  amount: number;
  reason: string;
  currency?: string;
}): Promise<CreditAccount> {
  if (input.amount <= 0) throw new Error('Grant amount must be positive');
  const currency = input.currency ?? 'credits';

  // Upsert credit account (create if not exists)
  const { data: existing } = await supabase
    .from('credit_accounts')
    .select()
    .eq('venture_id', input.ventureId)
    .eq('owner_id', input.ownerId)
    .eq('currency', currency)
    .single();

  if (!existing) {
    await createCreditAccount({
      ventureId: input.ventureId,
      ownerId: input.ownerId,
      currency,
    });
  }

  // Update balance
  const { data, error } = await supabase.rpc('grant_credits', {
    p_venture_id: input.ventureId,
    p_owner_id: input.ownerId,
    p_currency: currency,
    p_amount: input.amount,
  });

  if (error) {
    // Fallback: direct update if RPC not available
    const { error: updateError } = await supabase
      .from('credit_accounts')
      .update({
        balance: (existing?.balance ?? 0) + input.amount,
        total_granted: (existing?.total_granted ?? 0) + input.amount,
        updated_at: new Date().toISOString(),
      })
      .eq('venture_id', input.ventureId)
      .eq('owner_id', input.ownerId)
      .eq('currency', currency);

    if (updateError) throw new Error(`Failed to grant credits: ${updateError.message}`);
  }

  // Create ledger journal entry
  const creditPayableAccount = await getAccountByCode(input.ventureId, '2020');
  const creditExpenseAccount = await getAccountByCode(input.ventureId, '5050');

  if (creditPayableAccount && creditExpenseAccount) {
    const entry = await createJournalEntry({
      ventureId: input.ventureId,
      entryDate: new Date().toISOString(),
      description: `Credit grant: ${input.reason}`,
      sourceType: 'credit_grant',
      sourceId: input.ownerId,
      lines: [
        { accountId: creditExpenseAccount.id, debitAmount: input.amount, creditAmount: 0 },
        { accountId: creditPayableAccount.id, debitAmount: 0, creditAmount: input.amount },
      ],
    });
    await postJournalEntry(entry.id, 'system');
  }

  return getCreditBalance(input.ventureId, input.ownerId, currency);
}

export async function consumeCredits(input: {
  ventureId: string;
  ownerId: string;
  amount: number;
  reason: string;
  currency?: string;
}): Promise<CreditAccount> {
  if (input.amount <= 0) throw new Error('Consume amount must be positive');
  const currency = input.currency ?? 'credits';

  // Check balance
  const account = await getCreditBalance(input.ventureId, input.ownerId, currency);
  if (account.balance < input.amount) {
    throw new Error(`Insufficient credits: have ${account.balance}, need ${input.amount}`);
  }

  // Update balance
  const { error } = await supabase
    .from('credit_accounts')
    .update({
      balance: account.balance - input.amount,
      total_consumed: account.totalConsumed + input.amount,
      updated_at: new Date().toISOString(),
    })
    .eq('id', account.id);

  if (error) throw new Error(`Failed to consume credits: ${error.message}`);

  // Create ledger journal entry (recognize revenue)
  const creditPayableAccount = await getAccountByCode(input.ventureId, '2020');
  const revenueAccount = await getAccountByCode(input.ventureId, '4070');

  if (creditPayableAccount && revenueAccount) {
    const entry = await createJournalEntry({
      ventureId: input.ventureId,
      entryDate: new Date().toISOString(),
      description: `Credit consumption: ${input.reason}`,
      sourceType: 'credit_consume',
      sourceId: input.ownerId,
      lines: [
        { accountId: creditPayableAccount.id, debitAmount: input.amount, creditAmount: 0 },
        { accountId: revenueAccount.id, debitAmount: 0, creditAmount: input.amount },
      ],
    });
    await postJournalEntry(entry.id, 'system');
  }

  return getCreditBalance(input.ventureId, input.ownerId, currency);
}

export async function getCreditBalance(
  ventureId: string,
  ownerId: string,
  currency = 'credits'
): Promise<CreditAccount> {
  const { data, error } = await supabase
    .from('credit_accounts')
    .select()
    .eq('venture_id', ventureId)
    .eq('owner_id', ownerId)
    .eq('currency', currency)
    .single();

  if (error) throw new Error(`Credit account not found: ${error.message}`);
  return mapCreditRow(data);
}

export async function transferCredits(input: {
  ventureId: string;
  fromOwnerId: string;
  toOwnerId: string;
  amount: number;
  currency?: string;
}): Promise<void> {
  await consumeCredits({
    ventureId: input.ventureId,
    ownerId: input.fromOwnerId,
    amount: input.amount,
    reason: `Transfer to ${input.toOwnerId}`,
    currency: input.currency,
  });
  await grantCredits({
    ventureId: input.ventureId,
    ownerId: input.toOwnerId,
    amount: input.amount,
    reason: `Transfer from ${input.fromOwnerId}`,
    currency: input.currency,
  });
}

function mapCreditRow(row: Record<string, unknown>): CreditAccount {
  return {
    id: row.id as string,
    ventureId: row.venture_id as string,
    ownerId: row.owner_id as string,
    ownerType: row.owner_type as CreditAccount['ownerType'],
    currency: row.currency as string,
    balance: Number(row.balance),
    creditLimit: Number(row.credit_limit),
    totalGranted: Number(row.total_granted),
    totalConsumed: Number(row.total_consumed),
    totalExpired: Number(row.total_expired),
    expiresAt: row.expires_at as string | null,
    metadata: (row.metadata as Record<string, unknown>) ?? {},
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}
```

- [ ] **Step 4: Run tests**

Run: `npx vitest run src/lib/ledger/__tests__/credit-service.test.ts`
Expected: Both tests PASS

- [ ] **Step 5: Commit**

```bash
git add src/lib/ledger/credit-service.ts src/lib/ledger/__tests__/credit-service.test.ts
git commit -m "feat(ledger): add credit account service with grant, consume, transfer, balance check"
```

---

## Phase 6: API Route & Store

### Task 8: Create Ledger API Endpoint

**Files:**
- Create: `api/ledger.ts`

- [ ] **Step 1: Create the Vercel serverless function**

```typescript
// api/ledger.ts
import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Auth check (reuse existing pattern from api/_auth.ts)
  let userId: string | null = null;
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader?.replace('Bearer ', '') ?? req.cookies?.['__session'];
    if (token) {
      const { verifyToken } = await import('@clerk/backend');
      const secretKey = process.env.CLERK_SECRET_KEY;
      if (secretKey) {
        const payload = await verifyToken(token, { secretKey });
        userId = payload.sub;
      }
    }
  } catch {
    // Auth optional for now
  }

  const { createClient } = await import('@supabase/supabase-js');
  const supabase = createClient(
    process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL ?? '',
    process.env.SUPABASE_SERVICE_KEY ?? process.env.VITE_SUPABASE_ANON_KEY ?? ''
  );

  const action = (req.query.action as string) ?? req.body?.action;
  const ventureId = (req.query.ventureId as string) ?? req.body?.ventureId;

  if (!ventureId) {
    return res.status(400).json({ error: 'ventureId is required' });
  }

  try {
    switch (action) {
      case 'list-accounts': {
        const { data, error } = await supabase
          .from('ledger_accounts')
          .select()
          .eq('venture_id', ventureId)
          .order('code');
        if (error) throw error;
        return res.json({ data });
      }

      case 'get-trial-balance': {
        const asOfDate = req.query.asOfDate as string;
        // Aggregate posted entry lines by account
        const { data, error } = await supabase
          .from('journal_entry_lines')
          .select(`
            account_id,
            debit_amount,
            credit_amount,
            journal_entries!inner(venture_id, status)
          `)
          .eq('journal_entries.venture_id', ventureId)
          .eq('journal_entries.status', 'posted');
        if (error) throw error;

        // Aggregate in JS (Supabase doesn't support GROUP BY in PostgREST)
        const totals = new Map<string, { debits: number; credits: number }>();
        for (const row of data ?? []) {
          const existing = totals.get(row.account_id) ?? { debits: 0, credits: 0 };
          existing.debits += Number(row.debit_amount);
          existing.credits += Number(row.credit_amount);
          totals.set(row.account_id, existing);
        }

        const accountIds = Array.from(totals.keys());
        const { data: accounts } = await supabase
          .from('ledger_accounts')
          .select('id, code, name, type, currency')
          .in('id', accountIds);

        const trialBalance = (accounts ?? []).map((acc) => {
          const t = totals.get(acc.id)!;
          const net = t.debits - t.credits;
          const isDebitNormal = acc.type === 'asset' || acc.type === 'expense';
          return {
            accountId: acc.id,
            accountCode: acc.code,
            accountName: acc.name,
            accountType: acc.type,
            debitBalance: isDebitNormal ? Math.max(net, 0) : Math.max(-net, 0),
            creditBalance: isDebitNormal ? Math.max(-net, 0) : Math.max(net, 0),
            currency: acc.currency,
          };
        }).sort((a, b) => a.accountCode.localeCompare(b.accountCode));

        return res.json({ data: trialBalance });
      }

      case 'create-entry': {
        if (req.method !== 'POST') return res.status(405).json({ error: 'POST required' });
        const { entryDate, description, sourceType, sourceId, lines } = req.body;

        // Insert entry
        const { data: entry, error: entryErr } = await supabase
          .from('journal_entries')
          .insert({
            venture_id: ventureId,
            entry_number: 'TEMP',
            entry_date: entryDate,
            description,
            source_type: sourceType,
            source_id: sourceId,
          })
          .select()
          .single();
        if (entryErr) throw entryErr;

        // Insert lines
        const lineRows = lines.map((l: Record<string, unknown>, i: number) => ({
          entry_id: entry.id,
          account_id: l.accountId,
          line_number: i + 1,
          debit_amount: l.debitAmount ?? 0,
          credit_amount: l.creditAmount ?? 0,
          currency: l.currency ?? 'USD',
          exchange_rate: l.exchangeRate ?? 1,
        }));
        const { error: linesErr } = await supabase
          .from('journal_entry_lines')
          .insert(lineRows);
        if (linesErr) throw linesErr;

        return res.json({ data: entry });
      }

      case 'post-entry': {
        if (req.method !== 'POST') return res.status(405).json({ error: 'POST required' });
        const { entryId } = req.body;
        const { data, error } = await supabase
          .from('journal_entries')
          .update({ status: 'posted', posted_at: new Date().toISOString(), posted_by: userId })
          .eq('id', entryId)
          .eq('status', 'draft')
          .select()
          .single();
        if (error) throw error;
        return res.json({ data });
      }

      case 'list-entries': {
        const limit = Number(req.query.limit) || 50;
        const offset = Number(req.query.offset) || 0;
        const { data, error } = await supabase
          .from('journal_entries')
          .select('*, journal_entry_lines(*)')
          .eq('venture_id', ventureId)
          .order('created_at', { ascending: false })
          .range(offset, offset + limit - 1);
        if (error) throw error;
        return res.json({ data });
      }

      case 'provision-accounts': {
        if (req.method !== 'POST') return res.status(405).json({ error: 'POST required' });
        // Dynamic import to avoid bundling issues
        const { DEFAULT_CHART_OF_ACCOUNTS } = await import('../src/lib/ledger/chart-of-accounts');
        const rows = DEFAULT_CHART_OF_ACCOUNTS.map((a) => ({
          venture_id: ventureId,
          code: a.code,
          name: a.name,
          type: a.type,
          subtype: a.subtype,
          currency: a.currency,
          is_system: a.isSystem,
          metadata: {},
        }));
        const { error } = await supabase.from('ledger_accounts').insert(rows);
        if (error) throw error;
        return res.json({ data: { provisioned: rows.length } });
      }

      default:
        return res.status(400).json({ error: `Unknown action: ${action}` });
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return res.status(500).json({ error: message });
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add api/ledger.ts
git commit -m "feat(ledger): add Vercel serverless API endpoint with 6 actions"
```

---

### Task 9: Create Ledger Zustand Store

**Files:**
- Create: `src/stores/ledger.ts`

- [ ] **Step 1: Create the store**

```typescript
// src/stores/ledger.ts

import { create } from 'zustand';
import type { LedgerAccount, JournalEntry, TrialBalanceRow, CreditAccount } from '@/lib/ledger/types';

interface LedgerState {
  // Accounts
  accounts: LedgerAccount[];
  accountsLoading: boolean;

  // Journal entries
  entries: JournalEntry[];
  entriesLoading: boolean;

  // Trial balance
  trialBalance: TrialBalanceRow[];
  trialBalanceLoading: boolean;

  // Credit accounts
  creditAccounts: Map<string, CreditAccount>;

  // Actions
  fetchAccounts: (ventureId: string) => Promise<void>;
  fetchEntries: (ventureId: string) => Promise<void>;
  fetchTrialBalance: (ventureId: string) => Promise<void>;
  provisionAccounts: (ventureId: string) => Promise<void>;
  createEntry: (ventureId: string, entry: {
    entryDate: string;
    description: string;
    sourceType: string;
    sourceId: string;
    lines: Array<{ accountId: string; debitAmount: number; creditAmount: number }>;
  }) => Promise<void>;
  postEntry: (ventureId: string, entryId: string) => Promise<void>;

  // Derived
  getAccountByCode: (code: string) => LedgerAccount | undefined;
  getTotalAssets: () => number;
  getTotalLiabilities: () => number;
  getTotalEquity: () => number;
}

const API_BASE = '/api/ledger';

export const useLedgerStore = create<LedgerState>((set, get) => ({
  accounts: [],
  accountsLoading: false,
  entries: [],
  entriesLoading: false,
  trialBalance: [],
  trialBalanceLoading: false,
  creditAccounts: new Map(),

  fetchAccounts: async (ventureId) => {
    set({ accountsLoading: true });
    try {
      const res = await fetch(`${API_BASE}?action=list-accounts&ventureId=${ventureId}`);
      const { data } = await res.json();
      set({ accounts: data ?? [] });
    } finally {
      set({ accountsLoading: false });
    }
  },

  fetchEntries: async (ventureId) => {
    set({ entriesLoading: true });
    try {
      const res = await fetch(`${API_BASE}?action=list-entries&ventureId=${ventureId}`);
      const { data } = await res.json();
      set({ entries: data ?? [] });
    } finally {
      set({ entriesLoading: false });
    }
  },

  fetchTrialBalance: async (ventureId) => {
    set({ trialBalanceLoading: true });
    try {
      const res = await fetch(`${API_BASE}?action=get-trial-balance&ventureId=${ventureId}`);
      const { data } = await res.json();
      set({ trialBalance: data ?? [] });
    } finally {
      set({ trialBalanceLoading: false });
    }
  },

  provisionAccounts: async (ventureId) => {
    await fetch(API_BASE, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'provision-accounts', ventureId }),
    });
    await get().fetchAccounts(ventureId);
  },

  createEntry: async (ventureId, entry) => {
    await fetch(API_BASE, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'create-entry', ventureId, ...entry }),
    });
    await get().fetchEntries(ventureId);
  },

  postEntry: async (ventureId, entryId) => {
    await fetch(API_BASE, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'post-entry', ventureId, entryId }),
    });
    await get().fetchEntries(ventureId);
    await get().fetchTrialBalance(ventureId);
  },

  getAccountByCode: (code) => {
    return get().accounts.find((a) => a.code === code);
  },

  getTotalAssets: () => {
    return get().trialBalance
      .filter((r) => r.accountType === 'asset')
      .reduce((sum, r) => sum + r.debitBalance - r.creditBalance, 0);
  },

  getTotalLiabilities: () => {
    return get().trialBalance
      .filter((r) => r.accountType === 'liability')
      .reduce((sum, r) => sum + r.creditBalance - r.debitBalance, 0);
  },

  getTotalEquity: () => {
    return get().trialBalance
      .filter((r) => r.accountType === 'equity')
      .reduce((sum, r) => sum + r.creditBalance - r.debitBalance, 0);
  },
}));
```

- [ ] **Step 2: Commit**

```bash
git add src/stores/ledger.ts
git commit -m "feat(ledger): add Zustand store with account, entry, trial balance operations"
```

---

### Task 10: Create Ledger Kit for Agent Integration

**Files:**
- Create: `src/lib/kits/builtin/ledger-kit.ts`
- Modify: `src/lib/kits/loader.ts` (register the kit)

- [ ] **Step 1: Create the kit manifest + handlers**

```typescript
// src/lib/kits/builtin/ledger-kit.ts

import type { KitManifest, KitToolSchema, ToolCallResult, KitExecutionContext } from '../types';

const tools: KitToolSchema[] = [
  {
    name: 'ledger_list_accounts',
    description: 'List all ledger accounts (chart of accounts) for a venture. Returns account code, name, type, subtype, currency, and current balance.',
    input_schema: {
      type: 'object' as const,
      properties: {
        type: { type: 'string', description: 'Filter by account type: asset, liability, equity, revenue, expense', enum: ['asset', 'liability', 'equity', 'revenue', 'expense'] },
      },
      required: [],
    },
  },
  {
    name: 'ledger_trial_balance',
    description: 'Get the trial balance for a venture — shows debit and credit balances for all accounts with posted journal entries. Useful for verifying books balance.',
    input_schema: {
      type: 'object' as const,
      properties: {},
      required: [],
    },
  },
  {
    name: 'ledger_list_entries',
    description: 'List recent journal entries for a venture. Each entry shows the description, source, status, and all debit/credit lines.',
    input_schema: {
      type: 'object' as const,
      properties: {
        limit: { type: 'number', description: 'Number of entries to return (default 20, max 100)' },
      },
      required: [],
    },
  },
  {
    name: 'ledger_credit_balance',
    description: 'Check a user\'s credit balance for a venture.',
    input_schema: {
      type: 'object' as const,
      properties: {
        ownerId: { type: 'string', description: 'User ID to check balance for' },
        currency: { type: 'string', description: 'Credit currency (default: "credits")' },
      },
      required: ['ownerId'],
    },
  },
];

export const manifest: KitManifest = {
  id: 'ledger-finance',
  name: 'Universal Ledger',
  version: '1.0.0',
  description: 'Double-entry accounting ledger — chart of accounts, journal entries, trial balance, credit accounts. The financial foundation of MCV.',
  author: 'MCV',
  capabilities: ['network', 'supabase'],
  runtime: 'inline',
  ventureScope: '*',
  instructions: 'Use ledger tools to inspect financial state: account balances, journal entries, trial balance, and credit balances. All monetary operations in MCV create journal entries in this ledger.',
  tools,
};

export const handlers: Record<string, (input: Record<string, unknown>, ctx: KitExecutionContext) => Promise<ToolCallResult>> = {
  ledger_list_accounts: async (input, ctx) => {
    const params = new URLSearchParams({ action: 'list-accounts', ventureId: ctx.ventureId });
    if (input.type) params.set('type', input.type as string);
    const res = await ctx.fetch(`/api/ledger?${params}`);
    const json = await res.json();
    if (!res.ok) return { success: false, error: json.error };
    const accounts = json.data ?? [];
    const summary = accounts.map((a: Record<string, unknown>) =>
      `${a.code} | ${a.name} | ${a.type} | ${a.currency} | Balance: ${a.current_balance}`
    ).join('\n');
    return { success: true, data: accounts, displayMarkdown: `**Chart of Accounts (${accounts.length})**\n\`\`\`\n${summary}\n\`\`\`` };
  },

  ledger_trial_balance: async (_input, ctx) => {
    const res = await ctx.fetch(`/api/ledger?action=get-trial-balance&ventureId=${ctx.ventureId}`);
    const json = await res.json();
    if (!res.ok) return { success: false, error: json.error };
    const rows = json.data ?? [];
    const header = 'Code  | Account                          | Debit     | Credit';
    const separator = '------+----------------------------------+-----------+---------';
    const lines = rows.map((r: Record<string, unknown>) =>
      `${r.accountCode} | ${(r.accountName as string).padEnd(32)} | $${(r.debitBalance as number).toFixed(2).padStart(8)} | $${(r.creditBalance as number).toFixed(2).padStart(8)}`
    ).join('\n');
    const totalDebits = rows.reduce((s: number, r: Record<string, unknown>) => s + (r.debitBalance as number), 0);
    const totalCredits = rows.reduce((s: number, r: Record<string, unknown>) => s + (r.creditBalance as number), 0);
    const footer = `TOTAL |                                  | $${totalDebits.toFixed(2).padStart(8)} | $${totalCredits.toFixed(2).padStart(8)}`;
    return {
      success: true,
      data: rows,
      displayMarkdown: `**Trial Balance**\n\`\`\`\n${header}\n${separator}\n${lines}\n${separator}\n${footer}\n\`\`\``,
    };
  },

  ledger_list_entries: async (input, ctx) => {
    const limit = Math.min(Number(input.limit) || 20, 100);
    const res = await ctx.fetch(`/api/ledger?action=list-entries&ventureId=${ctx.ventureId}&limit=${limit}`);
    const json = await res.json();
    if (!res.ok) return { success: false, error: json.error };
    return { success: true, data: json.data };
  },

  ledger_credit_balance: async (input, ctx) => {
    const currency = (input.currency as string) || 'credits';
    const res = await ctx.fetch(`/api/ledger?action=credit-balance&ventureId=${ctx.ventureId}&ownerId=${input.ownerId}&currency=${currency}`);
    const json = await res.json();
    if (!res.ok) return { success: false, error: json.error };
    return { success: true, data: json.data };
  },
};
```

- [ ] **Step 2: Register in loader.ts**

Add to the imports section of `src/lib/kits/loader.ts`:
```typescript
import { manifest as ledgerManifest, handlers as ledgerHandlers } from './builtin/ledger-kit';
```

Add to the `getBuiltinKits()` function's kit array:
```typescript
{ manifest: ledgerManifest, handlers: ledgerHandlers, status: 'loaded' as const, source: 'builtin' as const, loadedAt: Date.now() },
```

- [ ] **Step 3: Commit**

```bash
git add src/lib/kits/builtin/ledger-kit.ts src/lib/kits/loader.ts
git commit -m "feat(ledger): add ledger kit with 4 tools for agent integration"
```

---

## Phase 7: Module Index

### Task 11: Create Module Index and Export Barrel

**Files:**
- Create: `src/lib/ledger/index.ts`

- [ ] **Step 1: Create the barrel export**

```typescript
// src/lib/ledger/index.ts

// Types
export type {
  LedgerAccount,
  JournalEntry,
  JournalEntryLine,
  JournalSourceType,
  JournalStatus,
  CreditAccount,
  FiscalYear,
  FiscalPeriod,
  AccountBalance,
  TrialBalanceRow,
  WalletBinding,
  LineDimensions,
  CreateAccountInput,
  CreateJournalEntryInput,
  CreateCreditAccountInput,
} from './types';

// Schemas (for validation in other modules)
export {
  LedgerAccountSchema,
  CreateAccountInput as CreateAccountInputSchema,
  CreateJournalEntryInput as CreateJournalEntryInputSchema,
  JournalEntryLineInput as JournalEntryLineInputSchema,
  AccountType,
  JournalSourceType as JournalSourceTypeEnum,
} from './types';

// Account operations
export {
  createAccount,
  getAccountByCode,
  listAccounts,
  provisionVentureAccounts,
} from './service';

// Journal entry operations
export {
  createJournalEntry,
  postJournalEntry,
  reverseJournalEntry,
  getJournalEntry,
  getTrialBalance,
} from './service';

// Credit operations
export {
  createCreditAccount,
  grantCredits,
  consumeCredits,
  getCreditBalance,
  transferCredits,
} from './credit-service';

// Chart of accounts
export {
  DEFAULT_CHART_OF_ACCOUNTS,
  getAccountsByType,
  getAccountByCode as getDefaultAccountByCode,
} from './chart-of-accounts';
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/ledger/index.ts
git commit -m "feat(ledger): add barrel export index for clean module imports"
```

---

### Task 12: Final Verification

- [ ] **Step 1: Run all tests**

Run: `npx vitest run`
Expected: All tests pass (chart-of-accounts + service + credit-service)

- [ ] **Step 2: Run type check**

Run: `npx tsc -b --noEmit`
Expected: No type errors

- [ ] **Step 3: Run lint**

Run: `npm run lint`
Expected: No errors (warnings acceptable)

- [ ] **Step 4: Run build**

Run: `npm run build`
Expected: Build succeeds

- [ ] **Step 5: Final commit if any fixes needed**

```bash
git add -A
git commit -m "fix(ledger): address any type/lint issues from verification"
```

---

## Summary

| Phase | Tasks | What it produces |
|-------|-------|-----------------|
| 1: Test Bootstrap | 1-2 | Vitest configured, decimal.js installed |
| 2: Types | 3 | Zod schemas for all ledger entities |
| 3: Database | 4 | 8 Supabase tables with balance constraints |
| 4: Chart of Accounts | 5 | 48-account default template with provisioning |
| 5: Core Service | 6-7 | Account CRUD, journal entries, credit system |
| 6: API + Store | 8-10 | Vercel endpoint, Zustand store, agent kit |
| 7: Finalize | 11-12 | Barrel exports, full verification |

**Files created:** 11 new files
**Files modified:** 2 (package.json, loader.ts)
**Database tables:** 8
**Tests:** 3 test files with ~12 test cases
**Kit tools:** 4 agent-accessible tools
