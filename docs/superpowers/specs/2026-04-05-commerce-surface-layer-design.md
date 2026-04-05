# MCV Commerce Surface Layer — Design Spec

> **Spec ID:** SPEC-002-B
> **Version:** 1.0.0
> **Date:** 2026-04-05
> **Status:** Draft
> **Parent:** SPEC-002 v2.0 (Commerce & Financial OS)
> **Author:** Tony / NAOS

---

## Executive Summary

SPEC-002 built the **engine room** — ledger, payment routing, commerce models, financials, compliance. This spec builds the **surface layer** — everything customers and shop operators actually touch. Cart, checkout, fulfillment, notifications, inventory, discounts, customers, digital delivery, reviews, wishlists, gift cards, analytics, search, and the shop management backend.

**The checkout UX is a hybrid of three paradigms:**
1. **Zero-friction instant buy** — one tap, saved method + address, cheapest rail auto-selected
2. **Smart cart with AI assist** — intelligent cart suggesting bundles, auto-applying best discounts, showing routing savings
3. **Conversational commerce** — buy through NAOS chat ("Buy the Pro plan" → confirm → done)
4. **Traditional checkout** — multi-step fallback for complex orders

All four modes consume the same backend services. The infrastructure ships to ventures and partners via the Platform API.

---

## Section 1: Cart & Checkout System

### Cart Service

```typescript
interface CartSession {
  id: string;
  ventureId: string;
  customerId: string | null;      // null = guest cart
  sessionId: string;               // browser session fallback
  items: CartItem[];
  discountCodes: string[];         // applied discount codes
  appliedDiscounts: AppliedDiscount[];
  subtotal: number;
  discountTotal: number;
  taxTotal: number;
  shippingTotal: number;
  total: number;
  currency: string;
  shippingAddress: Address | null;
  billingAddress: Address | null;
  selectedPaymentMethod: string | null;
  selectedShippingMethod: string | null;
  abandonedAt: string | null;      // set when cart inactive > 1hr
  recoveryEmailSent: boolean;
  expiresAt: string;               // carts expire after 30 days
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

interface CartItem {
  id: string;
  productId: string;
  variantId: string | null;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  taxAmount: number;
  discountAmount: number;
  metadata: Record<string, unknown>;
}

interface Address {
  firstName: string;
  lastName: string;
  company: string | null;
  line1: string;
  line2: string | null;
  city: string;
  state: string;
  postalCode: string;
  country: string;                  // ISO 3166-1 alpha-2
  phone: string | null;
}
```

Operations: addToCart, removeFromCart, updateQuantity, applyDiscount, removeDiscount, setShippingAddress, setBillingAddress, selectPaymentMethod, selectShippingMethod, getCart, mergeGuestCart (when guest logs in), abandonCart, recoverCart.

### Checkout Modes

**Mode 1: Instant Buy (zero-friction)**
```
User taps "Buy Now" on product
  → System checks: has saved payment method? has saved address?
  → YES: Create order immediately, charge via saved method on cheapest rail
  → NO: Fall through to Smart Cart
  → Confirmation toast (not a page) — "Purchased! Order #ORD-001"
```

**Mode 2: Smart Cart (AI-assisted)**
```
User adds items to cart
  → Cart sidebar slides open
  → AI automatically:
    - Applies best available discount
    - Suggests bundle savings ("Add X for 20% off")
    - Shows routing savings ("Paying with Interac saves $4.50")
    - Calculates tax in real-time by shipping address
  → User taps "Checkout"
  → 1-2 step checkout (address if needed → confirm & pay)
  → Order confirmation
```

**Mode 3: Conversational Commerce**
```
User in NAOS chat: "Buy the Pro plan"
  → NAOS: "Pro plan is $49/mo. Your Interac saves $1.12 vs card. Confirm?"
  → User: "Yes"
  → NAOS: "Done! Subscription active. First charge: $49 via Interac."
  → Creates subscription + payment + ledger entries behind the scenes
```

**Mode 4: Traditional Checkout (fallback)**
```
Step 1: Cart review (quantities, remove items, apply coupon)
Step 2: Shipping (address, method selection, rate display)
Step 3: Payment (method selection, routing recommendation)
Step 4: Review & confirm
Step 5: Order confirmation page
```

### Cart Abandonment Recovery

- Cart marked abandoned after 1 hour of inactivity
- Recovery email sent after configurable delay (default: 4 hours)
- Discount incentive on 2nd reminder (24 hours): "Complete your purchase for 10% off"
- Final reminder (72 hours): "Your cart is expiring"
- Analytics: abandonment rate, recovery rate, revenue recovered

---

## Section 2: Customer Management

```typescript
interface Customer {
  id: string;
  ventureId: string;
  userId: string | null;           // linked Clerk user (null = guest)
  email: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  addresses: Address[];
  defaultAddressId: string | null;
  savedPaymentMethods: SavedPaymentMethod[];
  defaultPaymentMethodId: string | null;
  tags: string[];                  // manual tags for segmentation
  segments: string[];              // auto-computed segments
  group: string | null;            // customer group (wholesale, VIP, etc.)
  totalOrders: number;
  totalSpent: number;
  averageOrderValue: number;
  firstOrderAt: string | null;
  lastOrderAt: string | null;
  ltv: number;                     // computed lifetime value
  communicationPreferences: {
    email: boolean;
    sms: boolean;
    push: boolean;
  };
  notes: string;                   // internal notes
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

interface SavedPaymentMethod {
  id: string;
  type: string;                    // "card", "bank_account", "crypto_wallet"
  last4: string;
  brand: string | null;            // "visa", "mastercard", etc.
  expiryMonth: number | null;
  expiryYear: number | null;
  isDefault: boolean;
  processorId: string;             // which processor holds this
  processorMethodId: string;       // processor's reference
}

// Auto-segments (computed from behavior):
// "high_value" — top 10% by LTV
// "at_risk" — no order in 60+ days after being active
// "new" — first order in last 30 days
// "repeat" — 3+ orders
// "whale" — spent > $10K lifetime
// "dormant" — no order in 90+ days
// "subscription_active" — has active subscription
```

---

## Section 3: Discount & Promotion Engine

```typescript
interface Discount {
  id: string;
  ventureId: string;
  code: string | null;             // null = automatic discount
  type: 'percentage' | 'fixed_amount' | 'bxgy' | 'free_shipping' | 'tiered';
  value: number;                   // percentage or fixed amount
  appliesTo: 'all' | 'specific_products' | 'specific_collections' | 'specific_customers';
  productIds: string[];
  collectionIds: string[];
  customerGroupIds: string[];
  minimumOrderAmount: number | null;
  minimumQuantity: number | null;
  maxUsesTotal: number | null;     // null = unlimited
  maxUsesPerCustomer: number | null;
  usedCount: number;
  startsAt: string;
  endsAt: string | null;           // null = no expiry
  stackable: boolean;              // can combine with other discounts
  status: 'active' | 'scheduled' | 'expired' | 'disabled';
  // BXGY specific
  buyQuantity: number | null;
  getQuantity: number | null;
  getProductIds: string[] | null;
  // Tiered specific
  tiers: { minAmount: number; discountPercent: number }[] | null;
  metadata: Record<string, unknown>;
}

// Discount resolution at checkout:
// 1. Collect all applicable discounts (auto + code-applied)
// 2. Filter by eligibility (customer group, min amount, product scope)
// 3. If non-stackable: pick the best single discount
// 4. If stackable: apply in order (percentage first, then fixed)
// 5. Never discount below $0
// 6. Create ledger entry: DR Discount Expense, CR Revenue contra
```

---

## Section 4: Order Fulfillment Pipeline

```typescript
type FulfillmentStatus =
  | 'unfulfilled'       // just placed
  | 'partially_fulfilled' // some items shipped
  | 'fulfilled'         // all items shipped
  | 'delivered'         // confirmed delivery
  | 'returned'          // return received
  | 'canceled';

interface Fulfillment {
  id: string;
  orderId: string;
  status: FulfillmentStatus;
  items: FulfillmentItem[];
  trackingNumber: string | null;
  trackingUrl: string | null;
  carrier: string | null;          // "fedex", "ups", "dhl", "canada_post", "usps"
  shippedAt: string | null;
  deliveredAt: string | null;
  estimatedDelivery: string | null;
  shippingLabelUrl: string | null;
  returnLabelUrl: string | null;
  notes: string;
}

interface ReturnRequest {
  id: string;
  orderId: string;
  customerId: string;
  items: ReturnItem[];
  reason: string;
  status: 'requested' | 'approved' | 'shipped_back' | 'received' | 'refunded' | 'rejected';
  refundAmount: number | null;
  returnTrackingNumber: string | null;
  returnLabelUrl: string | null;
}
```

Pipeline: Order placed → Payment confirmed → Inventory reserved → Pick list generated → Packed → Shipping label created → Shipped (tracking) → Delivered → (Return if needed)

---

## Section 5: Notification System

Event-driven notification bus. Every commerce event can trigger notifications across channels.

```typescript
interface NotificationTemplate {
  id: string;
  ventureId: string;
  event: NotificationEvent;
  channel: 'email' | 'sms' | 'push' | 'in_app' | 'webhook';
  subject: string;                 // supports {{variables}}
  body: string;                    // supports {{variables}} + HTML for email
  enabled: boolean;
}

type NotificationEvent =
  | 'order.confirmed'
  | 'order.shipped'
  | 'order.delivered'
  | 'order.canceled'
  | 'order.refunded'
  | 'payment.succeeded'
  | 'payment.failed'
  | 'subscription.created'
  | 'subscription.renewed'
  | 'subscription.canceled'
  | 'subscription.trial_ending'    // 3 days before
  | 'invoice.sent'
  | 'invoice.paid'
  | 'invoice.overdue'
  | 'cart.abandoned'
  | 'cart.recovery'
  | 'inventory.low_stock'
  | 'review.received'
  | 'wishlist.price_drop'
  | 'gift_card.received'
  | 'loan.payment_due'
  | 'loan.overdue'
  | 'royalty.payout_ready'
  | 'escrow.milestone_approved'
  | 'escrow.funds_released';
```

Delivery: email via SendGrid/Resend (existing kits), SMS via Twilio (existing kit), push via web push API, in-app via Supabase realtime.

---

## Section 6: Inventory Management

```typescript
interface InventoryLocation {
  id: string;
  ventureId: string;
  name: string;                    // "Main Warehouse", "Fulfillment Center 2"
  address: Address;
  isDefault: boolean;
  status: 'active' | 'inactive';
}

interface InventoryLevel {
  id: string;
  productId: string;
  variantId: string | null;
  locationId: string;
  available: number;               // sellable stock
  reserved: number;                // held for pending orders
  committed: number;               // allocated to confirmed orders
  incoming: number;                // expected from purchase orders
  onHand: number;                  // physical count (available + reserved + committed)
  lowStockThreshold: number;
  backorderEnabled: boolean;
}

interface InventoryMovement {
  id: string;
  productId: string;
  locationId: string;
  type: 'purchase' | 'sale' | 'return' | 'adjustment' | 'transfer' | 'reservation' | 'release';
  quantity: number;                // positive = in, negative = out
  previousLevel: number;
  newLevel: number;
  referenceType: string | null;    // "order", "return", "transfer"
  referenceId: string | null;
  reason: string;
  createdBy: string;
  createdAt: string;
}
```

Stock reservation flow: Cart add → reserve stock → Checkout timeout → release reservation. Order confirmed → commit stock. Ship → deduct stock.

---

## Section 7: Shipping Integration

```typescript
interface ShippingRate {
  id: string;
  carrier: string;
  service: string;                 // "ground", "express", "overnight"
  amount: number;
  currency: string;
  estimatedDays: number;
  guaranteedDelivery: boolean;
}

interface ShippingZone {
  id: string;
  ventureId: string;
  name: string;
  countries: string[];
  rates: ShippingZoneRate[];
}

// Carrier abstraction (same pattern as PaymentProcessor):
interface ShippingCarrier {
  id: string;
  name: string;
  getRates(origin: Address, destination: Address, packages: Package[]): Promise<ShippingRate[]>;
  createLabel(shipment: ShipmentRequest): Promise<ShippingLabel>;
  getTracking(trackingNumber: string): Promise<TrackingInfo>;
}
```

Day 1 carriers (stubs): Canada Post, USPS, FedEx, UPS. Same adapter pattern as payment processors.

---

## Section 8: Digital Delivery

```typescript
interface DigitalFulfillment {
  id: string;
  orderId: string;
  productId: string;
  deliveryMethod: 'download' | 'license_key' | 'access_grant' | 'drip_content';
  // Download
  downloadUrl: string | null;      // signed, time-limited
  downloadCount: number;
  maxDownloads: number;
  expiresAt: string | null;
  // License key
  licenseKey: string | null;
  activations: number;
  maxActivations: number;
  // Access grant
  accessToken: string | null;
  accessExpiresAt: string | null;
  // Drip content
  contentSchedule: DripScheduleItem[] | null;
}
```

---

## Section 9: Reviews & Ratings

```typescript
interface Review {
  id: string;
  ventureId: string;
  productId: string;
  customerId: string;
  orderId: string | null;          // verified purchase
  rating: number;                  // 1-5
  title: string;
  body: string;
  pros: string[];
  cons: string[];
  images: string[];
  isVerifiedPurchase: boolean;
  status: 'pending' | 'approved' | 'rejected' | 'flagged';
  helpfulCount: number;
  reportCount: number;
  vendorResponse: string | null;
  respondedAt: string | null;
  createdAt: string;
}

// Product rating aggregation (materialized):
interface ProductRating {
  productId: string;
  averageRating: number;
  totalReviews: number;
  distribution: { [stars: number]: number }; // { 5: 120, 4: 45, 3: 12, 2: 3, 1: 1 }
}
```

---

## Section 10: Wishlist / Save for Later

```typescript
interface Wishlist {
  id: string;
  customerId: string;
  ventureId: string;
  name: string;                    // "My Wishlist", "Gift Ideas", etc.
  isPublic: boolean;               // shareable link
  items: WishlistItem[];
  shareUrl: string | null;
}

interface WishlistItem {
  id: string;
  productId: string;
  variantId: string | null;
  addedAt: string;
  priceWhenAdded: number;          // for price-drop notifications
  notifyOnPriceDrop: boolean;
}
```

---

## Section 11: Gift Cards

```typescript
interface GiftCard {
  id: string;
  ventureId: string;
  code: string;                    // "GIFT-XXXX-XXXX-XXXX"
  initialBalance: number;
  currentBalance: number;
  currency: string;
  purchasedBy: string | null;
  recipientEmail: string | null;
  recipientMessage: string | null;
  status: 'active' | 'redeemed' | 'expired' | 'disabled';
  expiresAt: string | null;
  redeemedAt: string | null;
  transactions: GiftCardTransaction[];
}
```

Gift cards are a credit system variant — they create a CreditAccount entry in the ledger when purchased, and consume credits at checkout.

---

## Section 12: Commerce Analytics

```typescript
interface CommerceAnalytics {
  // Conversion funnel
  funnel: {
    visitors: number;
    productViews: number;
    addedToCart: number;
    reachedCheckout: number;
    completed: number;
    conversionRate: number;
  };
  // Cart analytics
  cartAbandonment: {
    rate: number;
    recoveryRate: number;
    revenueRecovered: number;
    topAbandonedProducts: { productId: string; count: number }[];
  };
  // Product analytics
  topProducts: { productId: string; revenue: number; unitsSold: number }[];
  // Customer analytics
  customerAcquisitionCost: number;
  repeatPurchaseRate: number;
  averageOrderValue: number;
  // Cohort analysis
  cohorts: CohortData[];
}
```

---

## Section 13: Product Search & Discovery

```typescript
interface SearchEngine {
  search(ventureId: string, query: string, filters: SearchFilters): Promise<SearchResult>;
  suggest(ventureId: string, query: string): Promise<string[]>;        // autocomplete
  getPopular(ventureId: string): Promise<string[]>;                     // trending searches
  trackSearch(ventureId: string, query: string, results: number): void; // analytics
}

interface SearchFilters {
  categories?: string[];
  priceRange?: { min: number; max: number };
  rating?: number;                 // minimum rating
  inStock?: boolean;
  productType?: string[];
  tags?: string[];
  sortBy?: 'relevance' | 'price_asc' | 'price_desc' | 'newest' | 'rating' | 'popularity';
}
```

Uses Supabase full-text search (tsvector) with trigram similarity for typo tolerance.

---

## Section 14: Shop Management Backend

This is the **operator view** — not the Super Admin view (which we built in Plan 7), but the view that each venture's shop operators use to manage their store day-to-day.

Views:
- **Shop Dashboard** — today's orders, revenue, pending fulfillments, low stock alerts
- **Product Manager** — bulk import/export, quick edit, inventory management per product
- **Order Processing** — new orders queue, fulfillment workflow, print pick lists/packing slips
- **Customer Manager** — customer list with search, segments, purchase history, communication
- **Discount Manager** — create/edit discounts, usage tracking, A/B testing
- **Reviews Manager** — moderation queue, respond to reviews
- **Analytics** — conversion funnel, top products, customer cohorts, revenue by channel
- **Store Settings** — branding, checkout config, notification templates, shipping zones, tax settings
