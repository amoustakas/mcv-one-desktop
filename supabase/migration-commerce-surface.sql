-- supabase/migration-commerce-surface.sql
-- Commerce Surface Layer — MCV Commerce & Financial OS (SPEC-002-B)
-- Cart, Customer, Discount, Fulfillment, Notifications, Inventory,
-- Shipping, Digital Delivery, Reviews, Wishlists, Gift Cards, Analytics

-- ═══════════════════════════════════════════════════════════
-- CART SESSIONS
-- ═══════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS cart_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  venture_id TEXT NOT NULL,
  customer_id TEXT,
  session_id TEXT NOT NULL,
  discount_codes TEXT[] NOT NULL DEFAULT '{}',
  subtotal NUMERIC(20, 4) NOT NULL DEFAULT 0 CHECK (subtotal >= 0),
  discount_total NUMERIC(20, 4) NOT NULL DEFAULT 0 CHECK (discount_total >= 0),
  tax_total NUMERIC(20, 4) NOT NULL DEFAULT 0 CHECK (tax_total >= 0),
  shipping_total NUMERIC(20, 4) NOT NULL DEFAULT 0 CHECK (shipping_total >= 0),
  total NUMERIC(20, 4) NOT NULL DEFAULT 0 CHECK (total >= 0),
  currency TEXT NOT NULL DEFAULT 'USD',
  shipping_address JSONB,
  billing_address JSONB,
  selected_payment_method TEXT,
  selected_shipping_method TEXT,
  abandoned_at TIMESTAMPTZ,
  recovery_email_sent BOOLEAN NOT NULL DEFAULT false,
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + INTERVAL '30 days'),
  metadata JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_cart_sessions_venture ON cart_sessions (venture_id);
CREATE INDEX idx_cart_sessions_customer ON cart_sessions (customer_id) WHERE customer_id IS NOT NULL;
CREATE INDEX idx_cart_sessions_session ON cart_sessions (session_id);
CREATE INDEX idx_cart_sessions_abandoned ON cart_sessions (abandoned_at) WHERE abandoned_at IS NOT NULL AND recovery_email_sent = false;
CREATE INDEX idx_cart_sessions_expires ON cart_sessions (expires_at);

-- ═══════════════════════════════════════════════════════════
-- CART ITEMS
-- ═══════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS cart_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  cart_id UUID NOT NULL REFERENCES cart_sessions(id) ON DELETE CASCADE,
  product_id TEXT NOT NULL,
  variant_id TEXT,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  unit_price NUMERIC(20, 4) NOT NULL CHECK (unit_price >= 0),
  total_price NUMERIC(20, 4) NOT NULL CHECK (total_price >= 0),
  tax_amount NUMERIC(20, 4) NOT NULL DEFAULT 0 CHECK (tax_amount >= 0),
  discount_amount NUMERIC(20, 4) NOT NULL DEFAULT 0 CHECK (discount_amount >= 0),
  metadata JSONB NOT NULL DEFAULT '{}'
);

CREATE INDEX idx_cart_items_cart ON cart_items (cart_id);
CREATE INDEX idx_cart_items_product ON cart_items (product_id);

-- ═══════════════════════════════════════════════════════════
-- CUSTOMERS
-- ═══════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS customers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  venture_id TEXT NOT NULL,
  user_id TEXT,
  email TEXT NOT NULL,
  first_name TEXT NOT NULL DEFAULT '',
  last_name TEXT NOT NULL DEFAULT '',
  phone TEXT,
  tags TEXT[] NOT NULL DEFAULT '{}',
  segments TEXT[] NOT NULL DEFAULT '{}',
  customer_group TEXT,
  total_orders INTEGER NOT NULL DEFAULT 0 CHECK (total_orders >= 0),
  total_spent NUMERIC(20, 4) NOT NULL DEFAULT 0 CHECK (total_spent >= 0),
  average_order_value NUMERIC(20, 4) NOT NULL DEFAULT 0 CHECK (average_order_value >= 0),
  first_order_at TIMESTAMPTZ,
  last_order_at TIMESTAMPTZ,
  ltv NUMERIC(20, 4) NOT NULL DEFAULT 0 CHECK (ltv >= 0),
  comm_email BOOLEAN NOT NULL DEFAULT true,
  comm_sms BOOLEAN NOT NULL DEFAULT false,
  comm_push BOOLEAN NOT NULL DEFAULT true,
  notes TEXT NOT NULL DEFAULT '',
  metadata JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (venture_id, email)
);

CREATE INDEX idx_customers_venture ON customers (venture_id);
CREATE INDEX idx_customers_user ON customers (user_id) WHERE user_id IS NOT NULL;
CREATE INDEX idx_customers_email ON customers (venture_id, email);
CREATE INDEX idx_customers_group ON customers (venture_id, customer_group) WHERE customer_group IS NOT NULL;
CREATE INDEX idx_customers_segments ON customers USING GIN (segments);
CREATE INDEX idx_customers_tags ON customers USING GIN (tags);
CREATE INDEX idx_customers_ltv ON customers (venture_id, ltv DESC);

-- ═══════════════════════════════════════════════════════════
-- CUSTOMER ADDRESSES
-- ═══════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS customer_addresses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  first_name TEXT NOT NULL DEFAULT '',
  last_name TEXT NOT NULL DEFAULT '',
  company TEXT,
  line1 TEXT NOT NULL,
  line2 TEXT,
  city TEXT NOT NULL,
  state TEXT NOT NULL DEFAULT '',
  postal_code TEXT NOT NULL DEFAULT '',
  country TEXT NOT NULL CHECK (char_length(country) = 2),
  phone TEXT,
  is_default BOOLEAN NOT NULL DEFAULT false
);

CREATE INDEX idx_customer_addresses_customer ON customer_addresses (customer_id);
CREATE INDEX idx_customer_addresses_default ON customer_addresses (customer_id) WHERE is_default = true;

-- ═══════════════════════════════════════════════════════════
-- SAVED PAYMENT METHODS
-- ═══════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS saved_payment_methods (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  last4 TEXT NOT NULL,
  brand TEXT,
  expiry_month INTEGER CHECK (expiry_month BETWEEN 1 AND 12),
  expiry_year INTEGER,
  is_default BOOLEAN NOT NULL DEFAULT false,
  processor_id TEXT NOT NULL,
  processor_method_id TEXT NOT NULL
);

CREATE INDEX idx_saved_payment_methods_customer ON saved_payment_methods (customer_id);
CREATE INDEX idx_saved_payment_methods_default ON saved_payment_methods (customer_id) WHERE is_default = true;

-- ═══════════════════════════════════════════════════════════
-- DISCOUNTS
-- ═══════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS discounts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  venture_id TEXT NOT NULL,
  code TEXT,
  type TEXT NOT NULL CHECK (type IN ('percentage', 'fixed_amount', 'bxgy', 'free_shipping', 'tiered')),
  value NUMERIC(20, 4) NOT NULL DEFAULT 0 CHECK (value >= 0),
  applies_to TEXT NOT NULL DEFAULT 'all' CHECK (applies_to IN (
    'all', 'specific_products', 'specific_collections', 'specific_customers'
  )),
  product_ids TEXT[] NOT NULL DEFAULT '{}',
  collection_ids TEXT[] NOT NULL DEFAULT '{}',
  customer_group_ids TEXT[] NOT NULL DEFAULT '{}',
  minimum_order_amount NUMERIC(20, 4) CHECK (minimum_order_amount >= 0),
  minimum_quantity INTEGER CHECK (minimum_quantity >= 0),
  max_uses_total INTEGER CHECK (max_uses_total > 0),
  max_uses_per_customer INTEGER CHECK (max_uses_per_customer > 0),
  used_count INTEGER NOT NULL DEFAULT 0 CHECK (used_count >= 0),
  starts_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ends_at TIMESTAMPTZ,
  stackable BOOLEAN NOT NULL DEFAULT false,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'scheduled', 'expired', 'disabled')),
  -- BXGY specific
  buy_quantity INTEGER CHECK (buy_quantity > 0),
  get_quantity INTEGER CHECK (get_quantity > 0),
  get_product_ids TEXT[],
  -- Tiered specific
  tiers JSONB,
  metadata JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_discounts_venture ON discounts (venture_id);
CREATE INDEX idx_discounts_code ON discounts (venture_id, code) WHERE code IS NOT NULL;
CREATE INDEX idx_discounts_status ON discounts (venture_id, status);
CREATE INDEX idx_discounts_active ON discounts (venture_id, starts_at, ends_at) WHERE status = 'active';

-- ═══════════════════════════════════════════════════════════
-- FULFILLMENTS
-- ═══════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS fulfillments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID NOT NULL REFERENCES orders(id),
  status TEXT NOT NULL DEFAULT 'unfulfilled' CHECK (status IN (
    'unfulfilled', 'partially_fulfilled', 'fulfilled', 'delivered', 'returned', 'canceled'
  )),
  tracking_number TEXT,
  tracking_url TEXT,
  carrier TEXT,
  shipped_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  estimated_delivery TIMESTAMPTZ,
  shipping_label_url TEXT,
  return_label_url TEXT,
  notes TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_fulfillments_order ON fulfillments (order_id);
CREATE INDEX idx_fulfillments_status ON fulfillments (status);
CREATE INDEX idx_fulfillments_tracking ON fulfillments (tracking_number) WHERE tracking_number IS NOT NULL;

-- ═══════════════════════════════════════════════════════════
-- FULFILLMENT ITEMS
-- ═══════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS fulfillment_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  fulfillment_id UUID NOT NULL REFERENCES fulfillments(id) ON DELETE CASCADE,
  order_item_id UUID NOT NULL REFERENCES order_items(id),
  quantity INTEGER NOT NULL CHECK (quantity > 0)
);

CREATE INDEX idx_fulfillment_items_fulfillment ON fulfillment_items (fulfillment_id);
CREATE INDEX idx_fulfillment_items_order_item ON fulfillment_items (order_item_id);

-- ═══════════════════════════════════════════════════════════
-- RETURN REQUESTS
-- ═══════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS return_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID NOT NULL REFERENCES orders(id),
  customer_id UUID NOT NULL REFERENCES customers(id),
  reason TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'requested' CHECK (status IN (
    'requested', 'approved', 'shipped_back', 'received', 'refunded', 'rejected'
  )),
  refund_amount NUMERIC(20, 4) CHECK (refund_amount >= 0),
  return_tracking_number TEXT,
  return_label_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_return_requests_order ON return_requests (order_id);
CREATE INDEX idx_return_requests_customer ON return_requests (customer_id);
CREATE INDEX idx_return_requests_status ON return_requests (status);

-- ═══════════════════════════════════════════════════════════
-- RETURN ITEMS
-- ═══════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS return_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  return_request_id UUID NOT NULL REFERENCES return_requests(id) ON DELETE CASCADE,
  order_item_id UUID NOT NULL REFERENCES order_items(id),
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  reason TEXT NOT NULL DEFAULT ''
);

CREATE INDEX idx_return_items_return_request ON return_items (return_request_id);

-- ═══════════════════════════════════════════════════════════
-- NOTIFICATION TEMPLATES
-- ═══════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS notification_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  venture_id TEXT NOT NULL,
  event TEXT NOT NULL CHECK (event IN (
    'order.confirmed', 'order.shipped', 'order.delivered', 'order.canceled', 'order.refunded',
    'payment.succeeded', 'payment.failed',
    'subscription.created', 'subscription.renewed', 'subscription.canceled', 'subscription.trial_ending',
    'invoice.sent', 'invoice.paid', 'invoice.overdue',
    'cart.abandoned', 'cart.recovery',
    'inventory.low_stock',
    'review.received',
    'wishlist.price_drop',
    'gift_card.received',
    'loan.payment_due', 'loan.overdue',
    'royalty.payout_ready',
    'escrow.milestone_approved', 'escrow.funds_released'
  )),
  channel TEXT NOT NULL CHECK (channel IN ('email', 'sms', 'push', 'in_app', 'webhook')),
  subject TEXT NOT NULL DEFAULT '',
  body TEXT NOT NULL DEFAULT '',
  enabled BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_notification_templates_venture ON notification_templates (venture_id);
CREATE INDEX idx_notification_templates_event ON notification_templates (venture_id, event, channel);
CREATE INDEX idx_notification_templates_enabled ON notification_templates (venture_id, enabled) WHERE enabled = true;

-- ═══════════════════════════════════════════════════════════
-- NOTIFICATION DELIVERIES
-- ═══════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS notification_deliveries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  venture_id TEXT NOT NULL,
  template_id UUID NOT NULL REFERENCES notification_templates(id),
  customer_id UUID NOT NULL REFERENCES customers(id),
  channel TEXT NOT NULL CHECK (channel IN ('email', 'sms', 'push', 'in_app', 'webhook')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'delivered', 'failed', 'bounced')),
  sent_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  error TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'
);

CREATE INDEX idx_notification_deliveries_venture ON notification_deliveries (venture_id);
CREATE INDEX idx_notification_deliveries_customer ON notification_deliveries (customer_id);
CREATE INDEX idx_notification_deliveries_template ON notification_deliveries (template_id);
CREATE INDEX idx_notification_deliveries_status ON notification_deliveries (venture_id, status);
CREATE INDEX idx_notification_deliveries_pending ON notification_deliveries (status, sent_at) WHERE status = 'pending';

-- ═══════════════════════════════════════════════════════════
-- INVENTORY LOCATIONS
-- ═══════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS inventory_locations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  venture_id TEXT NOT NULL,
  name TEXT NOT NULL,
  address JSONB NOT NULL DEFAULT '{}',
  is_default BOOLEAN NOT NULL DEFAULT false,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive'))
);

CREATE INDEX idx_inventory_locations_venture ON inventory_locations (venture_id);
CREATE INDEX idx_inventory_locations_default ON inventory_locations (venture_id) WHERE is_default = true;

-- ═══════════════════════════════════════════════════════════
-- INVENTORY LEVELS
-- ═══════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS inventory_levels (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id TEXT NOT NULL,
  variant_id TEXT,
  location_id UUID NOT NULL REFERENCES inventory_locations(id),
  available INTEGER NOT NULL DEFAULT 0 CHECK (available >= 0),
  reserved INTEGER NOT NULL DEFAULT 0 CHECK (reserved >= 0),
  committed INTEGER NOT NULL DEFAULT 0 CHECK (committed >= 0),
  incoming INTEGER NOT NULL DEFAULT 0 CHECK (incoming >= 0),
  on_hand INTEGER NOT NULL DEFAULT 0 CHECK (on_hand >= 0),
  low_stock_threshold INTEGER NOT NULL DEFAULT 10 CHECK (low_stock_threshold >= 0),
  backorder_enabled BOOLEAN NOT NULL DEFAULT false,
  UNIQUE (product_id, variant_id, location_id)
);

CREATE INDEX idx_inventory_levels_product ON inventory_levels (product_id);
CREATE INDEX idx_inventory_levels_location ON inventory_levels (location_id);
CREATE INDEX idx_inventory_levels_low_stock ON inventory_levels (product_id, available) WHERE available <= low_stock_threshold;

-- ═══════════════════════════════════════════════════════════
-- INVENTORY MOVEMENTS
-- ═══════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS inventory_movements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id TEXT NOT NULL,
  location_id UUID NOT NULL REFERENCES inventory_locations(id),
  type TEXT NOT NULL CHECK (type IN (
    'purchase', 'sale', 'return', 'adjustment', 'transfer', 'reservation', 'release'
  )),
  quantity INTEGER NOT NULL,
  previous_level INTEGER NOT NULL,
  new_level INTEGER NOT NULL,
  reference_type TEXT,
  reference_id TEXT,
  reason TEXT NOT NULL DEFAULT '',
  created_by TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_inventory_movements_product ON inventory_movements (product_id);
CREATE INDEX idx_inventory_movements_location ON inventory_movements (location_id);
CREATE INDEX idx_inventory_movements_reference ON inventory_movements (reference_type, reference_id)
  WHERE reference_type IS NOT NULL AND reference_id IS NOT NULL;
CREATE INDEX idx_inventory_movements_created ON inventory_movements (product_id, created_at DESC);

-- ═══════════════════════════════════════════════════════════
-- DIGITAL FULFILLMENTS
-- ═══════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS digital_fulfillments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID NOT NULL REFERENCES orders(id),
  product_id TEXT NOT NULL,
  delivery_method TEXT NOT NULL CHECK (delivery_method IN (
    'download', 'license_key', 'access_grant', 'drip_content'
  )),
  -- Download
  download_url TEXT,
  download_count INTEGER NOT NULL DEFAULT 0 CHECK (download_count >= 0),
  max_downloads INTEGER,
  expires_at TIMESTAMPTZ,
  -- License key
  license_key TEXT,
  activations INTEGER NOT NULL DEFAULT 0 CHECK (activations >= 0),
  max_activations INTEGER,
  -- Access grant
  access_token TEXT,
  access_expires_at TIMESTAMPTZ,
  -- Drip content (stored as JSONB array of DripScheduleItem)
  content_schedule JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_digital_fulfillments_order ON digital_fulfillments (order_id);
CREATE INDEX idx_digital_fulfillments_product ON digital_fulfillments (product_id);
CREATE INDEX idx_digital_fulfillments_access_token ON digital_fulfillments (access_token)
  WHERE access_token IS NOT NULL;
CREATE INDEX idx_digital_fulfillments_expires ON digital_fulfillments (expires_at)
  WHERE expires_at IS NOT NULL;

-- ═══════════════════════════════════════════════════════════
-- REVIEWS
-- ═══════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  venture_id TEXT NOT NULL,
  product_id TEXT NOT NULL,
  customer_id UUID NOT NULL REFERENCES customers(id),
  order_id UUID REFERENCES orders(id),
  rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  title TEXT NOT NULL DEFAULT '',
  body TEXT NOT NULL DEFAULT '',
  pros TEXT[] NOT NULL DEFAULT '{}',
  cons TEXT[] NOT NULL DEFAULT '{}',
  images TEXT[] NOT NULL DEFAULT '{}',
  is_verified_purchase BOOLEAN NOT NULL DEFAULT false,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'flagged')),
  helpful_count INTEGER NOT NULL DEFAULT 0 CHECK (helpful_count >= 0),
  report_count INTEGER NOT NULL DEFAULT 0 CHECK (report_count >= 0),
  vendor_response TEXT,
  responded_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_reviews_venture ON reviews (venture_id);
CREATE INDEX idx_reviews_product ON reviews (product_id);
CREATE INDEX idx_reviews_customer ON reviews (customer_id);
CREATE INDEX idx_reviews_status ON reviews (venture_id, status);
CREATE INDEX idx_reviews_product_approved ON reviews (product_id, rating) WHERE status = 'approved';

-- ═══════════════════════════════════════════════════════════
-- PRODUCT RATINGS (materialized aggregate)
-- ═══════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS product_ratings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id TEXT NOT NULL UNIQUE,
  average_rating NUMERIC(3, 2) NOT NULL DEFAULT 0 CHECK (average_rating BETWEEN 0 AND 5),
  total_reviews INTEGER NOT NULL DEFAULT 0 CHECK (total_reviews >= 0),
  dist_1 INTEGER NOT NULL DEFAULT 0 CHECK (dist_1 >= 0),
  dist_2 INTEGER NOT NULL DEFAULT 0 CHECK (dist_2 >= 0),
  dist_3 INTEGER NOT NULL DEFAULT 0 CHECK (dist_3 >= 0),
  dist_4 INTEGER NOT NULL DEFAULT 0 CHECK (dist_4 >= 0),
  dist_5 INTEGER NOT NULL DEFAULT 0 CHECK (dist_5 >= 0)
);

CREATE INDEX idx_product_ratings_product ON product_ratings (product_id);
CREATE INDEX idx_product_ratings_avg ON product_ratings (average_rating DESC);

-- ═══════════════════════════════════════════════════════════
-- WISHLISTS
-- ═══════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS wishlists (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  venture_id TEXT NOT NULL,
  name TEXT NOT NULL DEFAULT 'My Wishlist',
  is_public BOOLEAN NOT NULL DEFAULT false,
  share_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_wishlists_customer ON wishlists (customer_id);
CREATE INDEX idx_wishlists_venture ON wishlists (venture_id);
CREATE INDEX idx_wishlists_public ON wishlists (venture_id) WHERE is_public = true;

-- ═══════════════════════════════════════════════════════════
-- WISHLIST ITEMS
-- ═══════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS wishlist_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  wishlist_id UUID NOT NULL REFERENCES wishlists(id) ON DELETE CASCADE,
  product_id TEXT NOT NULL,
  variant_id TEXT,
  added_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  price_when_added NUMERIC(20, 4) NOT NULL DEFAULT 0 CHECK (price_when_added >= 0),
  notify_on_price_drop BOOLEAN NOT NULL DEFAULT false
);

CREATE INDEX idx_wishlist_items_wishlist ON wishlist_items (wishlist_id);
CREATE INDEX idx_wishlist_items_product ON wishlist_items (product_id);
CREATE INDEX idx_wishlist_items_price_drop ON wishlist_items (product_id) WHERE notify_on_price_drop = true;

-- ═══════════════════════════════════════════════════════════
-- GIFT CARDS
-- ═══════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS gift_cards (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  venture_id TEXT NOT NULL,
  code TEXT NOT NULL UNIQUE,
  initial_balance NUMERIC(20, 4) NOT NULL CHECK (initial_balance > 0),
  current_balance NUMERIC(20, 4) NOT NULL DEFAULT 0 CHECK (current_balance >= 0),
  currency TEXT NOT NULL DEFAULT 'USD',
  purchased_by TEXT,
  recipient_email TEXT,
  recipient_message TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'redeemed', 'expired', 'disabled')),
  expires_at TIMESTAMPTZ,
  redeemed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_gift_cards_venture ON gift_cards (venture_id);
CREATE INDEX idx_gift_cards_code ON gift_cards (code);
CREATE INDEX idx_gift_cards_status ON gift_cards (venture_id, status);
CREATE INDEX idx_gift_cards_recipient ON gift_cards (recipient_email) WHERE recipient_email IS NOT NULL;

-- ═══════════════════════════════════════════════════════════
-- GIFT CARD TRANSACTIONS
-- ═══════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS gift_card_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  gift_card_id UUID NOT NULL REFERENCES gift_cards(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('purchase', 'redemption', 'refund')),
  amount NUMERIC(20, 4) NOT NULL,
  order_id TEXT,
  balance_after NUMERIC(20, 4) NOT NULL CHECK (balance_after >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_gift_card_transactions_gift_card ON gift_card_transactions (gift_card_id);
CREATE INDEX idx_gift_card_transactions_order ON gift_card_transactions (order_id) WHERE order_id IS NOT NULL;

-- ═══════════════════════════════════════════════════════════
-- SEARCH ANALYTICS
-- ═══════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS search_analytics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  venture_id TEXT NOT NULL,
  query TEXT NOT NULL,
  results_count INTEGER NOT NULL DEFAULT 0 CHECK (results_count >= 0),
  clicked_product_id TEXT,
  converted BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_search_analytics_venture ON search_analytics (venture_id);
CREATE INDEX idx_search_analytics_query ON search_analytics (venture_id, query);
CREATE INDEX idx_search_analytics_created ON search_analytics (venture_id, created_at DESC);
CREATE INDEX idx_search_analytics_popular ON search_analytics (venture_id, query, created_at DESC)
  WHERE converted = true;

-- ═══════════════════════════════════════════════════════════
-- UPDATED_AT TRIGGER FUNCTION (surface layer)
-- ═══════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION update_surface_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_cart_sessions_updated_at
  BEFORE UPDATE ON cart_sessions
  FOR EACH ROW EXECUTE FUNCTION update_surface_updated_at();

CREATE TRIGGER trg_customers_updated_at
  BEFORE UPDATE ON customers
  FOR EACH ROW EXECUTE FUNCTION update_surface_updated_at();

CREATE TRIGGER trg_return_requests_updated_at
  BEFORE UPDATE ON return_requests
  FOR EACH ROW EXECUTE FUNCTION update_surface_updated_at();

-- ═══════════════════════════════════════════════════════════
-- PRODUCT RATINGS UPDATE TRIGGER
-- Auto-maintains product_ratings aggregate when reviews are inserted/updated/deleted
-- ═══════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION refresh_product_rating()
RETURNS TRIGGER AS $$
DECLARE
  v_product_id TEXT;
BEGIN
  IF TG_OP = 'DELETE' THEN
    v_product_id := OLD.product_id;
  ELSE
    v_product_id := NEW.product_id;
  END IF;

  INSERT INTO product_ratings (product_id, average_rating, total_reviews, dist_1, dist_2, dist_3, dist_4, dist_5)
  SELECT
    v_product_id,
    COALESCE(AVG(rating), 0),
    COUNT(*),
    COUNT(*) FILTER (WHERE rating = 1),
    COUNT(*) FILTER (WHERE rating = 2),
    COUNT(*) FILTER (WHERE rating = 3),
    COUNT(*) FILTER (WHERE rating = 4),
    COUNT(*) FILTER (WHERE rating = 5)
  FROM reviews
  WHERE product_id = v_product_id AND status = 'approved'
  ON CONFLICT (product_id) DO UPDATE SET
    average_rating = EXCLUDED.average_rating,
    total_reviews  = EXCLUDED.total_reviews,
    dist_1         = EXCLUDED.dist_1,
    dist_2         = EXCLUDED.dist_2,
    dist_3         = EXCLUDED.dist_3,
    dist_4         = EXCLUDED.dist_4,
    dist_5         = EXCLUDED.dist_5;

  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_refresh_product_rating
  AFTER INSERT OR UPDATE OR DELETE ON reviews
  FOR EACH ROW EXECUTE FUNCTION refresh_product_rating();

-- ═══════════════════════════════════════════════════════════
-- ROW LEVEL SECURITY
-- ═══════════════════════════════════════════════════════════

ALTER TABLE cart_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE cart_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_payment_methods ENABLE ROW LEVEL SECURITY;
ALTER TABLE discounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE fulfillments ENABLE ROW LEVEL SECURITY;
ALTER TABLE fulfillment_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE return_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE return_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_deliveries ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_levels ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE digital_fulfillments ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE wishlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE wishlist_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE gift_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE gift_card_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE search_analytics ENABLE ROW LEVEL SECURITY;

-- Permissive policies (tighten in production per venture_id scoping)
CREATE POLICY "Allow all for authenticated users" ON cart_sessions FOR ALL USING (true);
CREATE POLICY "Allow all for authenticated users" ON cart_items FOR ALL USING (true);
CREATE POLICY "Allow all for authenticated users" ON customers FOR ALL USING (true);
CREATE POLICY "Allow all for authenticated users" ON customer_addresses FOR ALL USING (true);
CREATE POLICY "Allow all for authenticated users" ON saved_payment_methods FOR ALL USING (true);
CREATE POLICY "Allow all for authenticated users" ON discounts FOR ALL USING (true);
CREATE POLICY "Allow all for authenticated users" ON fulfillments FOR ALL USING (true);
CREATE POLICY "Allow all for authenticated users" ON fulfillment_items FOR ALL USING (true);
CREATE POLICY "Allow all for authenticated users" ON return_requests FOR ALL USING (true);
CREATE POLICY "Allow all for authenticated users" ON return_items FOR ALL USING (true);
CREATE POLICY "Allow all for authenticated users" ON notification_templates FOR ALL USING (true);
CREATE POLICY "Allow all for authenticated users" ON notification_deliveries FOR ALL USING (true);
CREATE POLICY "Allow all for authenticated users" ON inventory_locations FOR ALL USING (true);
CREATE POLICY "Allow all for authenticated users" ON inventory_levels FOR ALL USING (true);
CREATE POLICY "Allow all for authenticated users" ON inventory_movements FOR ALL USING (true);
CREATE POLICY "Allow all for authenticated users" ON digital_fulfillments FOR ALL USING (true);
CREATE POLICY "Allow all for authenticated users" ON reviews FOR ALL USING (true);
CREATE POLICY "Allow all for authenticated users" ON product_ratings FOR ALL USING (true);
CREATE POLICY "Allow all for authenticated users" ON wishlists FOR ALL USING (true);
CREATE POLICY "Allow all for authenticated users" ON wishlist_items FOR ALL USING (true);
CREATE POLICY "Allow all for authenticated users" ON gift_cards FOR ALL USING (true);
CREATE POLICY "Allow all for authenticated users" ON gift_card_transactions FOR ALL USING (true);
CREATE POLICY "Allow all for authenticated users" ON search_analytics FOR ALL USING (true);
