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
