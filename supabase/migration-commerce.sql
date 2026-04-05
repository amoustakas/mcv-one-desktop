-- supabase/migration-commerce.sql
-- Commerce Layer — MCV Commerce & Financial OS (SPEC-002)
-- Tier 5: consumes ledger (Tier 2) and payment router (Tier 3)

-- ═══════════════════════════════════════════════════════════
-- PRODUCTS
-- ═══════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  venture_id TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN (
    'physical_good', 'physical_rental',
    'digital_download', 'digital_access', 'digital_license',
    'subscription', 'metered',
    'credit_pack', 'token', 'investment', 'loan',
    'service', 'service_retainer',
    'creator_content', 'creator_membership',
    'marketplace_listing', 'marketplace_escrow'
  )),
  name TEXT NOT NULL CHECK (char_length(name) BETWEEN 1 AND 500),
  description TEXT,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'archived')),
  sku TEXT,
  -- Pricing (PricingConfig: default price point + optional volume/wholesale tiers)
  pricing JSONB NOT NULL DEFAULT '{"default":{"amount":0,"currency":"USD","compareAtPrice":null,"costBasis":null},"volumeTiers":[],"wholesaleTiers":[]}',
  -- Type-specific nullable config objects
  physical_config JSONB,
  digital_config JSONB,
  subscription_config JSONB,
  metered_config JSONB,
  credit_config JSONB,
  loan_config JSONB,
  investment_config JSONB,
  gift_config JSONB,
  transfer_config JSONB,
  -- Classification
  category_ids TEXT[] NOT NULL DEFAULT '{}',
  tags TEXT[] NOT NULL DEFAULT '{}',
  -- Inventory
  track_inventory BOOLEAN NOT NULL DEFAULT false,
  inventory_count INTEGER CHECK (inventory_count >= 0),
  -- Tax
  tax_category_id TEXT,
  tax_exempt BOOLEAN NOT NULL DEFAULT false,
  -- Compliance
  requires_kyc BOOLEAN NOT NULL DEFAULT false,
  minimum_compliance_tier TEXT,
  geo_restrictions TEXT[] NOT NULL DEFAULT '{}',
  -- Common
  metadata JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_products_venture ON products (venture_id);
CREATE INDEX idx_products_type ON products (venture_id, type);
CREATE INDEX idx_products_status ON products (venture_id, status);
CREATE INDEX idx_products_sku ON products (venture_id, sku) WHERE sku IS NOT NULL;

-- ═══════════════════════════════════════════════════════════
-- ORDERS
-- ═══════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  venture_id TEXT NOT NULL,
  customer_id TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN (
    'pending', 'confirmed', 'processing', 'shipped', 'delivered', 'canceled', 'refunded'
  )),
  total_amount NUMERIC(20, 4) NOT NULL DEFAULT 0 CHECK (total_amount >= 0),
  currency TEXT NOT NULL DEFAULT 'USD' CHECK (char_length(currency) BETWEEN 2 AND 10),
  -- FK to payment_intents (Tier 3 table) — soft reference to avoid cross-migration dependency
  payment_intent_id UUID,
  shipping_address JSONB,
  metadata JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_orders_venture ON orders (venture_id);
CREATE INDEX idx_orders_customer ON orders (venture_id, customer_id);
CREATE INDEX idx_orders_status ON orders (venture_id, status);
CREATE INDEX idx_orders_payment_intent ON orders (payment_intent_id) WHERE payment_intent_id IS NOT NULL;

-- ═══════════════════════════════════════════════════════════
-- ORDER ITEMS
-- ═══════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS order_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id),
  variant_id TEXT,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  unit_price NUMERIC(20, 4) NOT NULL CHECK (unit_price >= 0),
  total_price NUMERIC(20, 4) NOT NULL CHECK (total_price >= 0),
  metadata JSONB NOT NULL DEFAULT '{}'
);

CREATE INDEX idx_order_items_order ON order_items (order_id);
CREATE INDEX idx_order_items_product ON order_items (product_id) WHERE product_id IS NOT NULL;

-- ═══════════════════════════════════════════════════════════
-- SUBSCRIPTIONS
-- ═══════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  venture_id TEXT NOT NULL,
  customer_id TEXT NOT NULL,
  plan_id TEXT NOT NULL,
  product_id UUID REFERENCES products(id),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN (
    'trialing', 'active', 'paused', 'past_due', 'canceled', 'unpaid'
  )),
  current_period_start TIMESTAMPTZ NOT NULL,
  current_period_end TIMESTAMPTZ NOT NULL,
  trial_end TIMESTAMPTZ,
  cancel_at_period_end BOOLEAN NOT NULL DEFAULT false,
  quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
  metadata JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_subscriptions_venture ON subscriptions (venture_id);
CREATE INDEX idx_subscriptions_customer ON subscriptions (venture_id, customer_id);
CREATE INDEX idx_subscriptions_status ON subscriptions (venture_id, status);
CREATE INDEX idx_subscriptions_product ON subscriptions (product_id) WHERE product_id IS NOT NULL;
CREATE INDEX idx_subscriptions_period_end ON subscriptions (current_period_end) WHERE status IN ('active', 'trialing');

-- ═══════════════════════════════════════════════════════════
-- USAGE RECORDS (metered billing)
-- ═══════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS usage_records (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  subscription_id UUID NOT NULL REFERENCES subscriptions(id) ON DELETE CASCADE,
  meter_id TEXT NOT NULL,
  quantity NUMERIC(20, 4) NOT NULL CHECK (quantity >= 0),
  timestamp TIMESTAMPTZ NOT NULL DEFAULT now(),
  idempotency_key TEXT NOT NULL UNIQUE,
  action TEXT NOT NULL DEFAULT 'increment' CHECK (action IN ('increment', 'set'))
);

CREATE INDEX idx_usage_records_subscription ON usage_records (subscription_id);
CREATE INDEX idx_usage_records_meter ON usage_records (subscription_id, meter_id);
CREATE INDEX idx_usage_records_timestamp ON usage_records (subscription_id, timestamp);

-- ═══════════════════════════════════════════════════════════
-- INVOICES
-- ═══════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS invoices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  venture_id TEXT NOT NULL,
  customer_id TEXT NOT NULL,
  invoice_number TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN (
    'draft', 'sent', 'viewed', 'partial', 'paid', 'overdue', 'voided'
  )),
  subtotal NUMERIC(20, 4) NOT NULL DEFAULT 0 CHECK (subtotal >= 0),
  tax NUMERIC(20, 4) NOT NULL DEFAULT 0 CHECK (tax >= 0),
  discount_amount NUMERIC(20, 4) NOT NULL DEFAULT 0 CHECK (discount_amount >= 0),
  total NUMERIC(20, 4) NOT NULL DEFAULT 0 CHECK (total >= 0),
  amount_due NUMERIC(20, 4) NOT NULL DEFAULT 0 CHECK (amount_due >= 0),
  amount_paid NUMERIC(20, 4) NOT NULL DEFAULT 0 CHECK (amount_paid >= 0),
  due_date DATE NOT NULL,
  payment_terms TEXT NOT NULL DEFAULT 'net_30' CHECK (payment_terms IN (
    'net_7', 'net_15', 'net_30', 'net_60', 'net_90', 'due_on_receipt'
  )),
  sent_at TIMESTAMPTZ,
  viewed_at TIMESTAMPTZ,
  paid_at TIMESTAMPTZ,
  metadata JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  -- Unique invoice number per venture
  UNIQUE (venture_id, invoice_number)
);

CREATE INDEX idx_invoices_venture ON invoices (venture_id);
CREATE INDEX idx_invoices_customer ON invoices (venture_id, customer_id);
CREATE INDEX idx_invoices_status ON invoices (venture_id, status);
CREATE INDEX idx_invoices_due_date ON invoices (due_date) WHERE status IN ('sent', 'viewed', 'partial', 'overdue');

-- ═══════════════════════════════════════════════════════════
-- INVOICE LINE ITEMS
-- ═══════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS invoice_line_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  quantity NUMERIC(20, 4) NOT NULL DEFAULT 1 CHECK (quantity >= 0),
  unit_price NUMERIC(20, 4) NOT NULL DEFAULT 0 CHECK (unit_price >= 0),
  total NUMERIC(20, 4) NOT NULL DEFAULT 0 CHECK (total >= 0),
  product_id UUID REFERENCES products(id),
  tax_amount NUMERIC(20, 4) NOT NULL DEFAULT 0 CHECK (tax_amount >= 0)
);

CREATE INDEX idx_invoice_line_items_invoice ON invoice_line_items (invoice_id);
CREATE INDEX idx_invoice_line_items_product ON invoice_line_items (product_id) WHERE product_id IS NOT NULL;

-- ═══════════════════════════════════════════════════════════
-- LOANS
-- ═══════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS loans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  venture_id TEXT NOT NULL,
  customer_id TEXT NOT NULL,
  product_id UUID REFERENCES products(id),
  principal NUMERIC(20, 4) NOT NULL CHECK (principal > 0),
  interest_rate NUMERIC(10, 6) NOT NULL DEFAULT 0 CHECK (interest_rate >= 0),
  interest_type TEXT NOT NULL DEFAULT 'simple' CHECK (interest_type IN ('simple', 'compound')),
  term_months INTEGER NOT NULL CHECK (term_months > 0),
  status TEXT NOT NULL DEFAULT 'application' CHECK (status IN (
    'application', 'approved', 'disbursed', 'repaying', 'paid_off', 'defaulted'
  )),
  outstanding_balance NUMERIC(20, 4) NOT NULL DEFAULT 0 CHECK (outstanding_balance >= 0),
  next_payment_date DATE,
  disbursed_at TIMESTAMPTZ,
  metadata JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_loans_venture ON loans (venture_id);
CREATE INDEX idx_loans_customer ON loans (venture_id, customer_id);
CREATE INDEX idx_loans_status ON loans (venture_id, status);
CREATE INDEX idx_loans_next_payment ON loans (next_payment_date) WHERE status IN ('disbursed', 'repaying');

-- ═══════════════════════════════════════════════════════════
-- LOAN REPAYMENTS
-- ═══════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS loan_repayments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  loan_id UUID NOT NULL REFERENCES loans(id) ON DELETE CASCADE,
  amount NUMERIC(20, 4) NOT NULL CHECK (amount > 0),
  principal_portion NUMERIC(20, 4) NOT NULL DEFAULT 0 CHECK (principal_portion >= 0),
  interest_portion NUMERIC(20, 4) NOT NULL DEFAULT 0 CHECK (interest_portion >= 0),
  payment_date TIMESTAMPTZ NOT NULL DEFAULT now(),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed'))
);

CREATE INDEX idx_loan_repayments_loan ON loan_repayments (loan_id);
CREATE INDEX idx_loan_repayments_date ON loan_repayments (loan_id, payment_date);

-- ═══════════════════════════════════════════════════════════
-- UPDATED_AT TRIGGER FUNCTION (shared pattern)
-- ═══════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION update_commerce_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_products_updated_at
  BEFORE UPDATE ON products
  FOR EACH ROW EXECUTE FUNCTION update_commerce_updated_at();

CREATE TRIGGER trg_orders_updated_at
  BEFORE UPDATE ON orders
  FOR EACH ROW EXECUTE FUNCTION update_commerce_updated_at();

CREATE TRIGGER trg_subscriptions_updated_at
  BEFORE UPDATE ON subscriptions
  FOR EACH ROW EXECUTE FUNCTION update_commerce_updated_at();

CREATE TRIGGER trg_invoices_updated_at
  BEFORE UPDATE ON invoices
  FOR EACH ROW EXECUTE FUNCTION update_commerce_updated_at();

CREATE TRIGGER trg_loans_updated_at
  BEFORE UPDATE ON loans
  FOR EACH ROW EXECUTE FUNCTION update_commerce_updated_at();

-- ═══════════════════════════════════════════════════════════
-- INVOICE NUMBER SEQUENCE FUNCTION
-- Auto-generates invoice numbers per venture: INV-000001, INV-000002, etc.
-- ═══════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION generate_invoice_number()
RETURNS TRIGGER AS $$
DECLARE
  next_num INTEGER;
BEGIN
  SELECT COALESCE(MAX(
    CAST(SUBSTRING(invoice_number FROM 5) AS INTEGER)
  ), 0) + 1
  INTO next_num
  FROM invoices
  WHERE venture_id = NEW.venture_id;

  NEW.invoice_number := 'INV-' || LPAD(next_num::TEXT, 6, '0');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_generate_invoice_number
  BEFORE INSERT ON invoices
  FOR EACH ROW
  WHEN (NEW.invoice_number IS NULL OR NEW.invoice_number = '')
  EXECUTE FUNCTION generate_invoice_number();

-- ═══════════════════════════════════════════════════════════
-- ROW LEVEL SECURITY
-- ═══════════════════════════════════════════════════════════

ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE usage_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_line_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE loans ENABLE ROW LEVEL SECURITY;
ALTER TABLE loan_repayments ENABLE ROW LEVEL SECURITY;

-- Permissive policies (tighten in production per venture_id scoping)
CREATE POLICY "Allow all for authenticated users" ON products FOR ALL USING (true);
CREATE POLICY "Allow all for authenticated users" ON orders FOR ALL USING (true);
CREATE POLICY "Allow all for authenticated users" ON order_items FOR ALL USING (true);
CREATE POLICY "Allow all for authenticated users" ON subscriptions FOR ALL USING (true);
CREATE POLICY "Allow all for authenticated users" ON usage_records FOR ALL USING (true);
CREATE POLICY "Allow all for authenticated users" ON invoices FOR ALL USING (true);
CREATE POLICY "Allow all for authenticated users" ON invoice_line_items FOR ALL USING (true);
CREATE POLICY "Allow all for authenticated users" ON loans FOR ALL USING (true);
CREATE POLICY "Allow all for authenticated users" ON loan_repayments FOR ALL USING (true);
