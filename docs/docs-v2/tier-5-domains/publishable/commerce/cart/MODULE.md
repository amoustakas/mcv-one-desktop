# @mcv/commerce/cart

> **Tier:** 5 — Domain  
> **Classification:** Publishable  
> **Domain:** Commerce  
> **Module:** Cart  
> **Runtime:** Server (Node.js) + Edge Functions  
> **Status:** Stable  
> **Since:** v0.1.0  

---

## Purpose

The `@mcv/commerce/cart` module is the central shopping cart engine for the MCV.ONE platform, providing a complete, production-grade cart lifecycle management system that operates across every MCV venture. It manages everything from the moment a customer adds their first item through real-time pricing calculations, coupon application, tax and shipping estimation, all the way to the precise instant the cart transitions into the checkout flow. The module supports both anonymous and authenticated carts with seamless merge-on-login, multi-currency display and settlement, and full multi-tenant isolation via Supabase Row-Level Security. It is designed as the single authoritative source for pre-checkout commerce state, ensuring consistency, correctness, and performance regardless of which venture, storefront, or sales channel originated the cart.

At its core, the cart module implements a deterministic pricing pipeline that recalculates totals in real time on every mutation. Each add, remove, quantity change, coupon application, or address update triggers a sequential calculation flow: catalog price lookup → tiered pricing → volume discounts → bundle pricing → coupon/promo evaluation → tax estimation → shipping rate estimation → currency-aware rounding → snapshot persistence. This pipeline is fully auditable — every pricing snapshot is stored with its complete context, enabling dispute resolution, A/B pricing experiments, and conversion analytics. The module integrates with Avalara and TaxJar for jurisdiction-accurate tax previews, with carrier APIs for real-time shipping estimates, and with the platform's own catalog and inventory services for price verification and soft inventory holds. Currency conversion uses locked FX rates captured at checkout initiation, preventing mid-session rate drift from causing price discrepancies between what the customer saw and what they pay.

Beyond transactional correctness, the cart module serves as a rich analytics surface and a critical node in the conversion funnel. It emits granular events to Redpanda for every cart mutation — item additions, removals, coupon attempts, abandonment signals, recovery actions, and checkout transitions. These events feed the platform's real-time analytics pipeline, powering dashboards for cart abandonment rates, average order values, popular item combinations, coupon effectiveness, and funnel drop-off analysis. The abandoned cart detection system monitors cart staleness via configurable TTLs and triggers multi-channel recovery workflows — email campaigns, push notifications, SMS, and retargeting signals — through the platform's notification infrastructure. Multi-tenant isolation is enforced at every layer through Supabase RLS policies, ensuring that cart data belonging to one venture is completely invisible to another, even when sharing the same database cluster. Redis caching provides sub-millisecond cart reads for the hot path, while Redpanda event streaming enables decoupled downstream processing without impacting cart operation latency.

---

## Exports

```typescript
// @mcv/commerce/cart — Public Export Map

// ─── Core Service ────────────────────────────────────────────────
export { CartService }                    from './services/cart.service';
export { createCartService }              from './services/cart.service.factory';

// ─── Cart Domain Models ──────────────────────────────────────────
export type { Cart }                      from './models/cart.model';
export type { CartItem }                  from './models/cart-item.model';
export type { CartSummary }               from './models/cart-summary.model';
export type { CartMetadata }              from './models/cart-metadata.model';
export type { CartStatus }                from './models/cart-status.model';
export type { CartType }                  from './models/cart-type.model';
export type { CartOwner }                 from './models/cart-owner.model';

// ─── Line Item Management ────────────────────────────────────────
export type { LineItemInput }             from './models/line-item-input.model';
export type { LineItemUpdate }            from './models/line-item-update.model';
export type { LineItemValidation }        from './models/line-item-validation.model';
export type { QuantityRule }              from './models/quantity-rule.model';

// ─── Pricing Engine ──────────────────────────────────────────────
export { PricingEngine }                  from './pricing/pricing-engine';
export { createPricingEngine }            from './pricing/pricing-engine.factory';
export type { PricingContext }            from './pricing/pricing-context.model';
export type { PricingResult }             from './pricing/pricing-result.model';
export type { PricingSnapshot }           from './pricing/pricing-snapshot.model';
export type { PricingRule }               from './pricing/pricing-rule.model';
export type { TieredPrice }              from './pricing/tiered-price.model';
export type { VolumeDiscount }            from './pricing/volume-discount.model';
export type { BundlePricing }             from './pricing/bundle-pricing.model';
export type { PromotionalPrice }          from './pricing/promotional-price.model';
export type { PriceBreakdown }            from './pricing/price-breakdown.model';

// ─── Coupon & Promotions ─────────────────────────────────────────
export { CouponService }                  from './coupons/coupon.service';
export { createCouponService }            from './coupons/coupon.service.factory';
export type { Coupon }                    from './coupons/coupon.model';
export type { CouponApplication }         from './coupons/coupon-application.model';
export type { CouponValidation }          from './coupons/coupon-validation.model';
export type { CouponRule }                from './coupons/coupon-rule.model';
export type { CouponType }               from './coupons/coupon-type.model';
export type { CouponStackPolicy }         from './coupons/coupon-stack-policy.model';
export type { PromoCode }                 from './coupons/promo-code.model';

// ─── Tax Calculation ─────────────────────────────────────────────
export { TaxCalculator }                  from './tax/tax-calculator';
export { createTaxCalculator }            from './tax/tax-calculator.factory';
export type { TaxEstimate }               from './tax/tax-estimate.model';
export type { TaxLineItem }              from './tax/tax-line-item.model';
export type { TaxExemption }              from './tax/tax-exemption.model';
export type { TaxJurisdiction }           from './tax/tax-jurisdiction.model';
export type { TaxProvider }              from './tax/tax-provider.model';

// ─── Shipping Estimation ─────────────────────────────────────────
export { ShippingEstimator }              from './shipping/shipping-estimator';
export { createShippingEstimator }        from './shipping/shipping-estimator.factory';
export type { ShippingEstimate }          from './shipping/shipping-estimate.model';
export type { ShippingMethod }            from './shipping/shipping-method.model';
export type { ShippingAddress }           from './shipping/shipping-address.model';
export type { ShippingRate }              from './shipping/shipping-rate.model';
export type { ShippingRestriction }       from './shipping/shipping-restriction.model';

// ─── Cart Persistence & Recovery ─────────────────────────────────
export { CartPersistenceService }         from './persistence/cart-persistence.service';
export { AbandonedCartService }           from './abandoned/abandoned-cart.service';
export { createAbandonedCartService }     from './abandoned/abandoned-cart.service.factory';
export type { AbandonedCartEvent }        from './abandoned/abandoned-cart-event.model';
export type { CartRecoveryAction }        from './abandoned/cart-recovery-action.model';
export type { CartRecoveryConfig }        from './abandoned/cart-recovery-config.model';

// ─── Cart Merge ──────────────────────────────────────────────────
export { CartMergeService }               from './merge/cart-merge.service';
export { createCartMergeService }         from './merge/cart-merge.service.factory';
export type { CartMergeStrategy }         from './merge/cart-merge-strategy.model';
export type { CartMergeResult }           from './merge/cart-merge-result.model';
export type { CartMergeConflict }         from './merge/cart-merge-conflict.model';

// ─── Cart Rules Engine ───────────────────────────────────────────
export { CartRulesEngine }                from './rules/cart-rules-engine';
export { createCartRulesEngine }          from './rules/cart-rules-engine.factory';
export type { CartRule }                  from './rules/cart-rule.model';
export type { CartRuleEvaluation }        from './rules/cart-rule-evaluation.model';
export type { CartConstraint }            from './rules/cart-constraint.model';
export type { GeoRestriction }            from './rules/geo-restriction.model';
export type { ProductRestriction }        from './rules/product-restriction.model';

// ─── Multi-Currency ──────────────────────────────────────────────
export { CurrencyService }               from './currency/currency.service';
export { createCurrencyService }          from './currency/currency.service.factory';
export type { CurrencyContext }           from './currency/currency-context.model';
export type { FxRateLock }               from './currency/fx-rate-lock.model';
export type { CurrencyConversion }        from './currency/currency-conversion.model';
export type { SupportedCurrency }         from './currency/supported-currency.model';

// ─── Cart Analytics ──────────────────────────────────────────────
export { CartAnalyticsService }           from './analytics/cart-analytics.service';
export { createCartAnalyticsService }     from './analytics/cart-analytics.service.factory';
export type { CartAnalyticsEvent }        from './analytics/cart-analytics-event.model';
export type { CartFunnelMetrics }         from './analytics/cart-funnel-metrics.model';
export type { AbandonmentMetrics }        from './analytics/abandonment-metrics.model';
export type { CartValueMetrics }          from './analytics/cart-value-metrics.model';

// ─── Inventory Reservation ───────────────────────────────────────
export { ReservationService }             from './reservation/reservation.service';
export { createReservationService }       from './reservation/reservation.service.factory';
export type { InventoryReservation }      from './reservation/inventory-reservation.model';
export type { ReservationResult }         from './reservation/reservation-result.model';
export type { ReservationPolicy }         from './reservation/reservation-policy.model';

// ─── tRPC Router ─────────────────────────────────────────────────
export { cartRouter }                     from './trpc/cart.router';
export type { CartRouterInputs }          from './trpc/cart.router.types';
export type { CartRouterOutputs }         from './trpc/cart.router.types';

// ─── Database Schema ─────────────────────────────────────────────
export { cartsTable }                     from './db/schema/carts.table';
export { cartItemsTable }                from './db/schema/cart-items.table';
export { cartCouponsTable }               from './db/schema/cart-coupons.table';
export { cartRulesTable }                from './db/schema/cart-rules.table';
export { abandonedCartEventsTable }       from './db/schema/abandoned-cart-events.table';
export { cartItemReservationsTable }      from './db/schema/cart-item-reservations.table';
export { cartPricingSnapshotsTable }      from './db/schema/cart-pricing-snapshots.table';

// ─── Event Schemas ───────────────────────────────────────────────
export type { CartCreatedEvent }          from './events/cart-created.event';
export type { CartUpdatedEvent }          from './events/cart-updated.event';
export type { CartDeletedEvent }          from './events/cart-deleted.event';
export type { ItemAddedEvent }            from './events/item-added.event';
export type { ItemRemovedEvent }          from './events/item-removed.event';
export type { ItemQuantityChangedEvent }  from './events/item-quantity-changed.event';
export type { CouponAppliedEvent }        from './events/coupon-applied.event';
export type { CouponRemovedEvent }        from './events/coupon-removed.event';
export type { CartAbandonedEvent }        from './events/cart-abandoned.event';
export type { CartRecoveredEvent }        from './events/cart-recovered.event';
export type { CheckoutInitiatedEvent }    from './events/checkout-initiated.event';
export type { CartMergedEvent }           from './events/cart-merged.event';
export type { PricingRecalculatedEvent }  from './events/pricing-recalculated.event';

// ─── Errors ──────────────────────────────────────────────────────
export { CartError }                      from './errors/cart.error';
export { CartErrorCode }                  from './errors/cart-error-code.enum';
export {
  CartNotFoundError,
  CartExpiredError,
  CartLockedError,
  CartEmptyError,
  ItemNotFoundError,
  ItemOutOfStockError,
  ItemQuantityExceededError,
  CouponInvalidError,
  CouponExpiredError,
  CouponUsageLimitError,
  CouponNotStackableError,
  CouponMinimumNotMetError,
  PricingCalculationError,
  TaxCalculationError,
  ShippingEstimationError,
  CurrencyNotSupportedError,
  FxRateLockExpiredError,
  CartRuleViolationError,
  GeoRestrictionError,
  MaxItemsExceededError,
  MinOrderValueError,
  ReservationFailedError,
  CartMergeConflictError,
  CheckoutTransitionError,
}                                         from './errors/cart-errors';

// ─── Constants ───────────────────────────────────────────────────
export {
  CART_DEFAULT_TTL_HOURS,
  CART_MAX_ITEMS,
  CART_MAX_COUPONS,
  CART_PRICING_PRECISION,
  CART_FX_RATE_LOCK_MINUTES,
  CART_RESERVATION_HOLD_MINUTES,
  CART_ABANDONED_THRESHOLD_HOURS,
  CART_RECOVERY_MAX_ATTEMPTS,
  CART_CACHE_TTL_SECONDS,
}                                         from './constants';

// ─── Zod Schemas (Validation) ────────────────────────────────────
export {
  createCartSchema,
  addItemSchema,
  updateItemSchema,
  removeItemSchema,
  applyCouponSchema,
  removeCouponSchema,
  updateShippingSchema,
  selectCurrencySchema,
  initiateCheckoutSchema,
  cartQuerySchema,
}                                         from './schemas/cart.schemas';
```

---

## Architecture

### Cart Lifecycle State Machine

```
                         ┌──────────────────────────────────────────────────────┐
                         │                CART LIFECYCLE FSM                     │
                         └──────────────────────────────────────────────────────┘

    ┌──────────┐     create()      ┌──────────┐     addItem()      ┌──────────────┐
    │          │ ─────────────────► │          │ ─────────────────► │              │
    │  (none)  │                    │  EMPTY   │                    │    ACTIVE    │◄──┐
    │          │                    │          │ ◄───────────────── │              │   │
    └──────────┘                    └────┬─────┘   removeAll()      └──────┬───────┘   │
                                        │                                 │            │
                                        │ expire()                        │            │
                                        ▼                                 │            │
                                   ┌──────────┐                          │            │
                                   │ EXPIRED  │                          │            │
                                   │          │                          │            │
                                   └──────────┘                          │            │
                                                                         │            │
                              ┌──────────────────────────────────────────┤            │
                              │                                          │            │
                              │  addItem() / removeItem()                │            │
                              │  updateQty() / applyCoupon()             │ mutate()   │
                              │  removeCoupon() / setAddress()           │            │
                              │  setCurrency()                           └────────────┘
                              │
                              ▼
                   ┌──────────────────┐   initiateCheckout()   ┌──────────────────┐
                   │                  │ ─────────────────────► │                  │
                   │     ACTIVE       │                        │  CHECKING_OUT    │
                   │                  │ ◄───────────────────── │                  │
                   └────────┬─────────┘   cancelCheckout()     └────────┬─────────┘
                            │                                           │
                            │ abandon()                                 │ complete()
                            ▼                                           ▼
                   ┌──────────────────┐                        ┌──────────────────┐
                   │                  │     recover()          │                  │
                   │    ABANDONED     │ ──────────────────────►│   CONVERTED      │
                   │                  │      (reactivate)      │                  │
                   └────────┬─────────┘                        └──────────────────┘
                            │
                            │ expire()
                            ▼
                   ┌──────────────────┐
                   │                  │
                   │    EXPIRED       │
                   │                  │
                   └──────────────────┘
```

### Pricing Calculation Pipeline

```
  ┌───────────────────────────────────────────────────────────────────────────────┐
  │                        PRICING CALCULATION PIPELINE                           │
  │                                                                               │
  │   Every cart mutation triggers this deterministic, sequential pipeline         │
  └───────────────────────────────────────────────────────────────────────────────┘

  Cart Mutation Event
        │
        ▼
  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐    ┌──────────────┐
  │  1. CATALOG   │───►│  2. TIERED   │───►│  3. VOLUME   │───►│  4. BUNDLE   │
  │    LOOKUP     │    │   PRICING    │    │  DISCOUNTS   │    │  PRICING     │
  │               │    │              │    │              │    │              │
  │  Fetch base   │    │  Apply tier  │    │  Apply qty-  │    │  Detect and  │
  │  prices from  │    │  breaks per  │    │  based disc- │    │  apply bundle│
  │  catalog svc  │    │  item config │    │  ount rules  │    │  deals       │
  └──────────────┘    └──────────────┘    └──────────────┘    └──────┬───────┘
                                                                     │
                                                                     ▼
  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐    ┌──────────────┐
  │  8. SNAPSHOT  │◄───│  7. ROUND    │◄───│  6. SHIPPING │◄───│  5. COUPONS  │
  │   PERSIST     │    │   & TOTAL    │    │  ESTIMATE    │    │  & PROMOS    │
  │               │    │              │    │              │    │              │
  │  Store full   │    │  Currency-   │    │  Carrier API │    │  Evaluate &  │
  │  breakdown    │    │  aware round │    │  rate lookup  │    │  apply valid │
  │  for audit    │    │  + grand tot │    │  by address  │    │  coupons     │
  └──────────────┘    └──────────────┘    └──────────────┘    └──────────────┘
                                                                     │
                           ┌──────────────┐                          │
                           │  TAX CALC    │◄─────────────────────────┘
                           │  (parallel)  │        (after coupons,
                           │              │         before shipping)
                           │  Avalara /   │
                           │  TaxJar API  │
                           └──────────────┘
```

### System Integration Diagram

```
  ┌─────────────────────────────────────────────────────────────────────────────┐
  │                          CLIENT LAYER                                       │
  │                                                                             │
  │   ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
  │   │  Web Store   │  │  Mobile App  │  │  POS System  │  │  API Client  │  │
  │   └──────┬───────┘  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘  │
  └──────────┼─────────────────┼─────────────────┼─────────────────┼──────────┘
             │                 │                 │                 │
             └─────────────────┴────────┬────────┴─────────────────┘
                                        │
                                   tRPC / REST
                                        │
  ┌─────────────────────────────────────┼───────────────────────────────────────┐
  │                              CART MODULE                                     │
  │                                     │                                       │
  │   ┌─────────────────────────────────▼────────────────────────────────────┐  │
  │   │                         CartService                                  │  │
  │   │  create() │ addItem() │ removeItem() │ updateQuantity()              │  │
  │   │  applyCoupon() │ removeCoupon() │ setShipping() │ setCurrency()      │  │
  │   │  initiateCheckout() │ getCart() │ deleteCart() │ mergeCarts()         │  │
  │   └──────┬──────────┬──────────┬──────────┬──────────┬──────────┬───────┘  │
  │          │          │          │          │          │          │           │
  │   ┌──────▼───┐ ┌────▼─────┐ ┌─▼────────┐ ┌▼────────┐ ┌▼──────┐ ┌▼──────┐ │
  │   │ Pricing  │ │ Coupon   │ │ Rules    │ │ Tax     │ │Ship  │ │Currcy│ │
  │   │ Engine   │ │ Service  │ │ Engine   │ │ Calc    │ │Estim │ │Svc   │ │
  │   └──────┬───┘ └────┬─────┘ └─┬────────┘ └┬────────┘ └┬──────┘ └┬──────┘ │
  │          │          │          │           │           │         │         │
  │   ┌──────▼──────────▼──────────▼───────────▼───────────▼─────────▼───────┐ │
  │   │                    CartPersistenceService                             │ │
  │   └──────────────────────────┬────────────────────────────────────────────┘ │
  │                              │                                              │
  └──────────────────────────────┼──────────────────────────────────────────────┘
                                 │
          ┌──────────────────────┼──────────────────────────┐
          │                      │                          │
  ┌───────▼───────┐    ┌────────▼────────┐      ┌──────────▼──────────┐
  │   Supabase    │    │     Redis       │      │     Redpanda        │
  │  PostgreSQL   │    │   Cart Cache    │      │   Cart Events       │
  │               │    │                 │      │                     │
  │  • carts      │    │  • Active cart  │      │  • cart.created     │
  │  • cart_items │    │    snapshots    │      │  • item.added       │
  │  • cart_coupns│    │  • Pricing      │      │  • item.removed     │
  │  • cart_rules │    │    results      │      │  • coupon.applied   │
  │  • abandoned  │    │  • FX rates     │      │  • cart.abandoned   │
  │  • reservatns │    │  • Rate limits  │      │  • checkout.init    │
  │  • snapshots  │    │  • Session map  │      │  • cart.converted   │
  └───────────────┘    └─────────────────┘      └─────────────────────┘
          │
          │ RLS Policies
          ▼
  ┌───────────────────┐
  │  Tenant Isolation  │
  │  venture_id = ctx  │
  └───────────────────┘
```

### Cart Merge Flow (Anonymous → Authenticated)

```
  User browses anonymously               User logs in
  ┌───────────────────────┐               ┌───────────────────────┐
  │  Anonymous Cart       │               │  Authenticated Cart   │
  │  (session-based)      │               │  (user-based)         │
  │                       │               │                       │
  │  Item A  qty: 2       │               │  Item A  qty: 1       │
  │  Item B  qty: 1       │               │  Item C  qty: 3       │
  │  Coupon: SAVE10       │               │  (no coupon)          │
  └───────────┬───────────┘               └───────────┬───────────┘
              │                                        │
              │             login event                │
              └──────────────┬─────────────────────────┘
                             │
                             ▼
                   ┌─────────────────────┐
                   │  CartMergeService   │
                   │                     │
                   │  Strategy:          │
                   │  • PREFER_AUTH      │  ← Use auth cart values
                   │  • PREFER_ANON      │  ← Use anon cart values
                   │  • SUM_QUANTITIES   │  ← Add quantities together
                   │  • MAX_QUANTITY     │  ← Take the higher qty
                   │  • MANUAL           │  ← Prompt user to resolve
                   └─────────┬───────────┘
                             │
                             ▼
                   ┌─────────────────────┐
                   │  Merged Cart        │
                   │  (authenticated)    │
                   │                     │
                   │  Item A  qty: 3     │  ← SUM strategy
                   │  Item B  qty: 1     │  ← From anonymous
                   │  Item C  qty: 3     │  ← From authenticated
                   │  Coupon: SAVE10     │  ← Preserved from anon
                   └─────────────────────┘
```

---

## Core Interfaces

### Cart

```typescript
/**
 * The root Cart aggregate representing a customer's shopping cart.
 * All monetary values are stored in the smallest currency unit (cents/pence).
 */
interface Cart {
  /** Unique cart identifier (UUIDv7 — time-ordered) */
  id: string;

  /** Venture ID for multi-tenant isolation */
  ventureId: string;

  /** Store/channel that created this cart */
  storeId: string;

  /**
   * Owner of the cart. For anonymous carts, userId is null
   * and sessionId is used for identification.
   */
  owner: CartOwner;

  /** Current cart lifecycle status */
  status: CartStatus;

  /** Type classification for the cart */
  type: CartType;

  /** Line items in the cart */
  items: CartItem[];

  /** Applied coupons/promo codes */
  coupons: CouponApplication[];

  /** Shipping address (if provided) */
  shippingAddress: ShippingAddress | null;

  /** Selected shipping method (if provided) */
  shippingMethod: ShippingMethod | null;

  /** Pricing summary — recalculated on every mutation */
  summary: CartSummary;

  /** Currency configuration */
  currency: CurrencyContext;

  /** Cart-level metadata (custom fields, UTM params, etc.) */
  metadata: CartMetadata;

  /** ISO 8601 timestamp — cart creation */
  createdAt: string;

  /** ISO 8601 timestamp — last mutation */
  updatedAt: string;

  /** ISO 8601 timestamp — cart expiry */
  expiresAt: string;

  /** Version number for optimistic concurrency control */
  version: number;
}

/**
 * Cart owner — either an authenticated user or anonymous session.
 */
interface CartOwner {
  /** User ID (null for anonymous carts) */
  userId: string | null;

  /** Session ID (always present — used for anonymous identification) */
  sessionId: string;

  /** Customer email if collected before auth */
  email: string | null;

  /** IP address at cart creation (for geo-restriction evaluation) */
  ipAddress: string;

  /** ISO country code derived from IP (for geo-restrictions) */
  countryCode: string | null;
}

/**
 * Cart status — represents the lifecycle stage.
 */
type CartStatus =
  | 'empty'
  | 'active'
  | 'checking_out'
  | 'converted'
  | 'abandoned'
  | 'expired'
  | 'merged';

/**
 * Cart type classification.
 */
type CartType =
  | 'standard'       // Normal shopping cart
  | 'wishlist'       // Saved-for-later / wishlist cart
  | 'quote'          // B2B quote request cart
  | 'subscription'   // Subscription recurring cart
  | 'gift_registry'; // Gift registry cart
```

### CartItem

```typescript
/**
 * A single line item within a cart.
 * Tracks the product, variant, quantity, and computed pricing.
 */
interface CartItem {
  /** Unique line item ID */
  id: string;

  /** Parent cart ID */
  cartId: string;

  /** Reference to the product in the catalog */
  productId: string;

  /** Reference to the specific variant (size, color, etc.) */
  variantId: string | null;

  /** SKU for inventory lookup */
  sku: string;

  /** Human-readable product name (denormalized for display) */
  name: string;

  /** Product image URL (denormalized for display) */
  imageUrl: string | null;

  /** Quantity of this item */
  quantity: number;

  /** Unit price at time of addition (smallest currency unit) */
  unitPrice: number;

  /** Original price before any discounts (for strikethrough display) */
  originalPrice: number;

  /** Applied discounts to this line item */
  discounts: LineItemDiscount[];

  /** Computed line total after discounts (unitPrice × quantity − discounts) */
  lineTotal: number;

  /** Tax amount for this line item (preview — finalized at checkout) */
  taxAmount: number;

  /** Tax rate applied (decimal, e.g. 0.13 for 13%) */
  taxRate: number;

  /** Whether this item is tax-exempt */
  taxExempt: boolean;

  /** Weight for shipping calculation (grams) */
  weightGrams: number;

  /** Inventory reservation for this line item */
  reservation: InventoryReservation | null;

  /** Bundle membership (if this item is part of a bundle deal) */
  bundleId: string | null;

  /** Custom fields (gift message, engraving, etc.) */
  customFields: Record<string, string>;

  /** Whether this item is available for purchase */
  isAvailable: boolean;

  /** Reason if item is not available */
  unavailabilityReason: string | null;

  /** ISO 8601 — when item was added */
  addedAt: string;

  /** ISO 8601 — last update */
  updatedAt: string;
}

/**
 * Discount applied to a specific line item.
 */
interface LineItemDiscount {
  /** Source of the discount */
  source: 'tiered_pricing' | 'volume_discount' | 'bundle' | 'coupon' | 'promotion' | 'loyalty';

  /** Human-readable label */
  label: string;

  /** Discount amount in smallest currency unit */
  amount: number;

  /** Percentage discount (if applicable) */
  percentage: number | null;

  /** Reference to the coupon or rule that generated this discount */
  sourceId: string | null;
}

/**
 * Input for adding a new item to the cart.
 */
interface LineItemInput {
  /** Product ID from the catalog */
  productId: string;

  /** Variant ID (optional) */
  variantId?: string;

  /** Desired quantity */
  quantity: number;

  /** Custom fields for this line item */
  customFields?: Record<string, string>;

  /** Override price (for B2B/quote scenarios — requires permission) */
  priceOverride?: number;
}

/**
 * Input for updating an existing line item.
 */
interface LineItemUpdate {
  /** Line item ID to update */
  itemId: string;

  /** New quantity (if changing) */
  quantity?: number;

  /** Updated custom fields */
  customFields?: Record<string, string>;
}
```

### CartSummary

```typescript
/**
 * Computed pricing summary for the entire cart.
 * All amounts are in the smallest currency unit of the cart's display currency.
 * Recalculated on every cart mutation.
 */
interface CartSummary {
  /** Total number of items in the cart */
  itemCount: number;

  /** Total number of unique line items */
  lineItemCount: number;

  /** Subtotal before any discounts */
  subtotalBeforeDiscounts: number;

  /** Total discount amount from all sources */
  totalDiscounts: number;

  /** Subtotal after discounts, before tax and shipping */
  subtotal: number;

  /** Breakdown of discounts by source */
  discountBreakdown: DiscountBreakdownEntry[];

  /** Estimated tax amount */
  taxEstimate: number;

  /** Tax breakdown by jurisdiction */
  taxBreakdown: TaxBreakdownEntry[];

  /** Whether tax has been calculated (requires address) */
  taxCalculated: boolean;

  /** Shipping cost estimate */
  shippingEstimate: number;

  /** Whether shipping has been calculated */
  shippingCalculated: boolean;

  /** Grand total (subtotal + tax + shipping) */
  grandTotal: number;

  /** Display currency code (ISO 4217) */
  displayCurrency: string;

  /** Settlement currency code (ISO 4217) */
  settlementCurrency: string;

  /** FX rate applied (display → settlement) */
  fxRate: number | null;

  /** Grand total in settlement currency */
  grandTotalSettlement: number;

  /** Savings compared to original prices */
  totalSavings: number;

  /** Savings as a percentage of original total */
  savingsPercentage: number;

  /** Free shipping threshold progress */
  freeShippingProgress: FreeShippingProgress | null;

  /** Minimum order value progress */
  minimumOrderProgress: MinimumOrderProgress | null;

  /** Timestamp of this pricing calculation */
  calculatedAt: string;

  /** Hash of the pricing snapshot for cache invalidation */
  pricingHash: string;
}

interface DiscountBreakdownEntry {
  source: 'tiered_pricing' | 'volume_discount' | 'bundle' | 'coupon' | 'promotion' | 'loyalty';
  label: string;
  amount: number;
  percentage: number | null;
  affectedItems: string[];
}

interface TaxBreakdownEntry {
  jurisdiction: string;
  jurisdictionType: 'country' | 'state' | 'county' | 'city' | 'special';
  taxName: string;
  rate: number;
  amount: number;
  taxableAmount: number;
}

interface FreeShippingProgress {
  threshold: number;
  currentAmount: number;
  remainingAmount: number;
  progressPercentage: number;
  qualified: boolean;
}

interface MinimumOrderProgress {
  minimumValue: number;
  currentValue: number;
  remainingAmount: number;
  progressPercentage: number;
  met: boolean;
}
```

### PricingEngine

```typescript
/**
 * The pricing engine computes cart totals through a deterministic pipeline.
 * Each stage transforms the pricing context and passes it forward.
 */
interface PricingEngine {
  /**
   * Execute the full pricing pipeline for a cart.
   * Returns a complete, auditable pricing result.
   */
  calculate(cart: Cart, context: PricingContext): Promise<PricingResult>;

  /**
   * Calculate pricing for a single item (used for display purposes).
   */
  calculateItem(
    item: CartItem,
    context: PricingContext,
  ): Promise<PriceBreakdown>;

  /**
   * Preview pricing with a hypothetical coupon (without applying it).
   */
  previewWithCoupon(
    cart: Cart,
    couponCode: string,
    context: PricingContext,
  ): Promise<PricingResult>;

  /**
   * Get pricing history for a cart (for debugging and audit).
   */
  getPricingHistory(
    cartId: string,
    limit?: number,
  ): Promise<PricingSnapshot[]>;
}

/**
 * Context required for pricing calculation.
 */
interface PricingContext {
  /** Venture-specific pricing configuration */
  ventureId: string;

  /** Customer tier for tiered pricing */
  customerTier: 'standard' | 'silver' | 'gold' | 'platinum' | 'enterprise';

  /** Customer group memberships */
  customerGroups: string[];

  /** Display currency */
  displayCurrency: string;

  /** Settlement currency */
  settlementCurrency: string;

  /** Locked FX rate (if applicable) */
  fxRateLock: FxRateLock | null;

  /** Shipping destination (for tax + shipping calc) */
  shippingAddress: ShippingAddress | null;

  /** Selected shipping method */
  shippingMethod: ShippingMethod | null;

  /** Tax exemption certificate (if applicable) */
  taxExemption: TaxExemption | null;

  /** Current timestamp for time-based promotions */
  evaluationTime: string;

  /** Whether to include tax calculation (requires address) */
  includeTax: boolean;

  /** Whether to include shipping estimation */
  includeShipping: boolean;

  /** A/B test variant IDs for pricing experiments */
  experimentVariants: Record<string, string>;
}

/**
 * Complete pricing result from the pipeline.
 */
interface PricingResult {
  /** Computed cart summary */
  summary: CartSummary;

  /** Per-item price breakdowns */
  itemBreakdowns: Map<string, PriceBreakdown>;

  /** Applied pricing rules (for audit trail) */
  appliedRules: AppliedPricingRule[];

  /** Rejected pricing rules (for debugging) */
  rejectedRules: RejectedPricingRule[];

  /** Warnings (e.g. price changed since item was added) */
  warnings: PricingWarning[];

  /** Snapshot ID for persistence */
  snapshotId: string;

  /** Pipeline execution time in milliseconds */
  calculationTimeMs: number;
}

interface PriceBreakdown {
  itemId: string;
  catalogPrice: number;
  tieredPrice: number | null;
  volumeDiscount: number;
  bundleDiscount: number;
  couponDiscount: number;
  promotionalDiscount: number;
  loyaltyDiscount: number;
  effectiveUnitPrice: number;
  quantity: number;
  lineTotal: number;
  taxAmount: number;
  taxRate: number;
  totalWithTax: number;
}

interface AppliedPricingRule {
  ruleId: string;
  ruleType: string;
  description: string;
  discountAmount: number;
  affectedItems: string[];
  priority: number;
}

interface RejectedPricingRule {
  ruleId: string;
  ruleType: string;
  reason: string;
}

interface PricingWarning {
  code: string;
  message: string;
  itemId?: string;
  severity: 'info' | 'warning' | 'error';
}
```

### CouponService

```typescript
/**
 * Service for managing coupon and promotional code application to carts.
 * Handles validation, stacking rules, usage limits, and fraud prevention.
 */
interface CouponService {
  /** Validate and apply a coupon code to a cart. */
  apply(cartId: string, code: string): Promise<CouponApplication>;

  /** Remove a previously applied coupon from a cart. */
  remove(cartId: string, couponId: string): Promise<void>;

  /** Validate a coupon code without applying it (for UI preview). */
  validate(code: string, context: CouponValidationContext): Promise<CouponValidation>;

  /** List all coupons currently applied to a cart. */
  listApplied(cartId: string): Promise<CouponApplication[]>;

  /** Get auto-applicable coupons for a cart (venture-configured promotions). */
  getAutoApplicable(cart: Cart): Promise<Coupon[]>;

  /** Check coupon usage statistics (for admin/reporting). */
  getUsageStats(couponId: string): Promise<CouponUsageStats>;
}

/**
 * Coupon domain model.
 */
interface Coupon {
  id: string;
  ventureId: string;
  code: string;
  type: CouponType;
  value: number;
  minimumOrderValue: number | null;
  maximumDiscountValue: number | null;
  applicableProductIds: string[] | null;
  applicableCategoryIds: string[] | null;
  excludedProductIds: string[];
  excludedCategoryIds: string[];
  stackPolicy: CouponStackPolicy;
  usageLimitTotal: number | null;
  usageLimitPerUser: number | null;
  currentUsageCount: number;
  startsAt: string;
  expiresAt: string | null;
  isActive: boolean;
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

type CouponType =
  | 'percentage'           // e.g., 10% off
  | 'fixed_amount'         // e.g., $5 off
  | 'free_shipping'        // Waive shipping costs
  | 'buy_x_get_y'          // Buy 2 get 1 free
  | 'fixed_price'          // Set items to a fixed price
  | 'tiered_percentage';   // 10% off $50+, 15% off $100+

interface CouponStackPolicy {
  /** Whether this coupon can be combined with others */
  stackable: boolean;
  /** Maximum number of coupons that can be stacked */
  maxStack: number;
  /** Coupon types this cannot stack with */
  exclusiveWith: CouponType[];
  /** Priority for application order (higher = applied first) */
  priority: number;
  /** Whether this coupon applies to original or post-discount price */
  applicationOrder: 'pre' | 'post';
}

interface CouponApplication {
  id: string;
  cartId: string;
  couponId: string;
  code: string;
  type: CouponType;
  discountAmount: number;
  affectedItemIds: string[];
  appliedAt: string;
}

interface CouponValidation {
  valid: boolean;
  coupon: Coupon | null;
  estimatedDiscount: number;
  errors: CouponValidationError[];
  warnings: string[];
}

interface CouponValidationError {
  code: string;
  message: string;
  field?: string;
}

interface CouponValidationContext {
  ventureId: string;
  userId: string | null;
  cartSubtotal: number;
  cartItems: Array<{ productId: string; categoryId: string; quantity: number }>;
  appliedCoupons: string[];
  customerGroups: string[];
}

interface CouponUsageStats {
  couponId: string;
  totalUsage: number;
  totalDiscount: number;
  averageDiscount: number;
  uniqueUsers: number;
  conversionRate: number;
  revenueInfluenced: number;
}
```

### CartRulesEngine

```typescript
/**
 * Engine that evaluates cart-level rules and constraints.
 * Rules can block checkout, display warnings, or modify cart behavior.
 */
interface CartRulesEngine {
  /** Evaluate all applicable rules against the cart. */
  evaluate(cart: Cart): Promise<CartRuleEvaluation[]>;

  /** Check if the cart is valid for checkout (all blocking rules pass). */
  isCheckoutReady(cart: Cart): Promise<CheckoutReadiness>;

  /** Get all rules configured for a venture. */
  getRules(ventureId: string): Promise<CartRule[]>;

  /** Evaluate a single rule (for testing/preview). */
  evaluateRule(rule: CartRule, cart: Cart): Promise<CartRuleEvaluation>;
}

interface CartRule {
  id: string;
  ventureId: string;
  name: string;
  description: string;
  type: CartRuleType;
  condition: CartRuleCondition;
  action: CartRuleAction;
  priority: number;
  isActive: boolean;
  startsAt: string | null;
  expiresAt: string | null;
  metadata: Record<string, unknown>;
}

type CartRuleType =
  | 'minimum_order_value'
  | 'maximum_order_value'
  | 'maximum_items'
  | 'maximum_quantity_per_item'
  | 'product_restriction'
  | 'category_restriction'
  | 'geo_restriction'
  | 'time_restriction'
  | 'customer_group_restriction'
  | 'payment_method_restriction'
  | 'bundle_requirement'
  | 'custom';

interface CartRuleCondition {
  field: string;
  operator: 'eq' | 'neq' | 'gt' | 'gte' | 'lt' | 'lte' | 'in' | 'not_in' | 'contains' | 'matches';
  value: unknown;
  children?: CartRuleCondition[];
  logic?: 'and' | 'or';
}

interface CartRuleAction {
  type: 'block_checkout' | 'warn' | 'info' | 'apply_discount' | 'require_approval';
  message: string;
  messageKey: string;
  params: Record<string, unknown>;
}

interface CartRuleEvaluation {
  ruleId: string;
  ruleName: string;
  ruleType: CartRuleType;
  passed: boolean;
  action: CartRuleAction | null;
  details: string;
  evaluatedAt: string;
}

interface CheckoutReadiness {
  ready: boolean;
  blockingRules: CartRuleEvaluation[];
  warnings: CartRuleEvaluation[];
  info: CartRuleEvaluation[];
}
```

### AbandonedCartService

```typescript
/**
 * Service for detecting, tracking, and recovering abandoned carts.
 * Integrates with notification services for recovery campaigns.
 */
interface AbandonedCartService {
  /** Detect carts that have become abandoned (exceeded idle threshold). */
  detectAbandoned(ventureId: string): Promise<AbandonedCartEvent[]>;

  /** Mark a cart as abandoned and emit the abandonment event. */
  markAbandoned(cartId: string, reason: AbandonmentReason): Promise<void>;

  /** Initiate a recovery workflow for an abandoned cart. */
  initiateRecovery(cartId: string, config: CartRecoveryConfig): Promise<CartRecoveryAction>;

  /** Record that a recovery action was taken. */
  recordRecoveryAction(cartId: string, action: CartRecoveryAction): Promise<void>;

  /** Mark a cart as recovered (customer returned and resumed). */
  markRecovered(cartId: string, recoverySource: string): Promise<void>;

  /** Get abandonment analytics for a venture. */
  getAbandonmentMetrics(ventureId: string, dateRange: DateRange): Promise<AbandonmentMetrics>;

  /** Get recovery campaign performance. */
  getRecoveryMetrics(ventureId: string, dateRange: DateRange): Promise<RecoveryMetrics>;
}

interface AbandonedCartEvent {
  id: string;
  cartId: string;
  ventureId: string;
  userId: string | null;
  email: string | null;
  cartValue: number;
  itemCount: number;
  reason: AbandonmentReason;
  lastActivityAt: string;
  abandonedAt: string;
  recoveryAttempts: number;
  recoveredAt: string | null;
  recoverySource: string | null;
}

type AbandonmentReason =
  | 'idle_timeout'
  | 'session_expired'
  | 'explicit_abandon'
  | 'price_increase'
  | 'out_of_stock'
  | 'checkout_failure'
  | 'unknown';

interface CartRecoveryConfig {
  channels: Array<'email' | 'sms' | 'push_notification' | 'retargeting'>;
  firstAttemptDelayMinutes: number;
  maxAttempts: number;
  attemptIntervals: number[];
  includeIncentive: boolean;
  incentiveCouponCode: string | null;
  emailTemplateId: string | null;
}

interface CartRecoveryAction {
  id: string;
  cartId: string;
  attemptNumber: number;
  channel: 'email' | 'sms' | 'push_notification' | 'retargeting';
  sentAt: string;
  deliveredAt: string | null;
  openedAt: string | null;
  clickedAt: string | null;
  convertedAt: string | null;
  incentiveOffered: string | null;
}

interface AbandonmentMetrics {
  totalCarts: number;
  abandonedCarts: number;
  abandonmentRate: number;
  totalAbandonedValue: number;
  averageAbandonedValue: number;
  topAbandonedProducts: Array<{ productId: string; name: string; count: number }>;
  abandonmentByReason: Record<AbandonmentReason, number>;
  abandonmentByHour: number[];
  abandonmentByDayOfWeek: number[];
}

interface RecoveryMetrics {
  totalAttempts: number;
  emailsSent: number;
  emailsOpened: number;
  emailsClicked: number;
  cartsRecovered: number;
  recoveryRate: number;
  revenueRecovered: number;
  averageRecoveryTimeMinutes: number;
  recoveryByChannel: Record<string, { attempts: number; recoveries: number; revenue: number }>;
}

interface DateRange {
  from: string;
  to: string;
}
```

### CartMergeService

```typescript
/**
 * Service for merging anonymous carts with authenticated carts upon login.
 * Handles conflict resolution, coupon transfer, and data reconciliation.
 */
interface CartMergeService {
  /** Merge an anonymous cart into an authenticated user's cart. */
  merge(
    anonymousCartId: string,
    authenticatedCartId: string,
    strategy: CartMergeStrategy,
  ): Promise<CartMergeResult>;

  /** Preview the result of a merge without executing it. */
  preview(
    anonymousCartId: string,
    authenticatedCartId: string,
    strategy: CartMergeStrategy,
  ): Promise<CartMergePreview>;

  /** Resolve merge conflicts manually (when strategy is MANUAL). */
  resolveConflicts(
    mergeId: string,
    resolutions: ConflictResolution[],
  ): Promise<CartMergeResult>;
}

type CartMergeStrategy =
  | 'prefer_authenticated'
  | 'prefer_anonymous'
  | 'sum_quantities'
  | 'max_quantity'
  | 'manual';

interface CartMergeResult {
  mergedCart: Cart;
  addedItems: CartItem[];
  updatedItems: Array<{ itemId: string; oldQuantity: number; newQuantity: number }>;
  transferredCoupons: CouponApplication[];
  droppedCoupons: Array<{ coupon: CouponApplication; reason: string }>;
  resolvedConflicts: CartMergeConflict[];
  unresolvedConflicts: CartMergeConflict[];
  sourceCartId: string;
  targetCartId: string;
}

interface CartMergeConflict {
  type: 'quantity_conflict' | 'price_change' | 'availability_change' | 'coupon_conflict';
  itemId: string | null;
  description: string;
  anonymousValue: unknown;
  authenticatedValue: unknown;
  resolution: 'auto' | 'manual' | 'pending';
  resolvedValue: unknown | null;
}

interface ConflictResolution {
  conflictIndex: number;
  resolution: 'keep_anonymous' | 'keep_authenticated' | 'custom';
  customValue?: unknown;
}

interface CartMergePreview {
  projectedItemCount: number;
  projectedCartValue: number;
  itemsToAdd: CartItem[];
  itemsToUpdate: Array<{ itemId: string; currentQuantity: number; projectedQuantity: number }>;
  conflicts: CartMergeConflict[];
  couponsToTransfer: CouponApplication[];
  couponsToDrop: Array<{ coupon: CouponApplication; reason: string }>;
}
```

### CartService (Facade)

```typescript
/**
 * The primary service interface for all cart operations.
 * Acts as a facade coordinating the pricing engine, coupon service,
 * rules engine, and persistence layer.
 */
interface CartService {
  // ─── Cart CRUD ────────────────────────────────────────────────

  /** Create a new cart for a customer (anonymous or authenticated). */
  create(input: CreateCartInput): Promise<Cart>;

  /** Get a cart by ID. Checks Redis cache first, falls back to DB. */
  get(cartId: string): Promise<Cart | null>;

  /** Get the active cart for a user or session. */
  getActive(owner: CartOwnerLookup): Promise<Cart | null>;

  /** Delete a cart and release all reservations. */
  delete(cartId: string): Promise<void>;

  /** Extend the TTL of a cart (keep it alive). */
  touch(cartId: string): Promise<void>;

  // ─── Line Item Operations ────────────────────────────────────

  /** Add an item to the cart. Triggers pricing recalculation. */
  addItem(cartId: string, input: LineItemInput): Promise<Cart>;

  /** Remove an item from the cart. Releases its reservation. */
  removeItem(cartId: string, itemId: string): Promise<Cart>;

  /** Update an item's quantity or custom fields. */
  updateItem(cartId: string, update: LineItemUpdate): Promise<Cart>;

  /** Clear all items from the cart. */
  clearItems(cartId: string): Promise<Cart>;

  // ─── Coupons ─────────────────────────────────────────────────

  /** Apply a coupon or promo code to the cart. */
  applyCoupon(cartId: string, code: string): Promise<Cart>;

  /** Remove a coupon from the cart. */
  removeCoupon(cartId: string, couponId: string): Promise<Cart>;

  // ─── Shipping ────────────────────────────────────────────────

  /** Set or update the shipping address. Triggers tax + shipping recalc. */
  setShippingAddress(cartId: string, address: ShippingAddress): Promise<Cart>;

  /** Select a shipping method from available options. */
  selectShippingMethod(cartId: string, methodId: string): Promise<Cart>;

  /** Get available shipping methods for the cart. */
  getShippingMethods(cartId: string): Promise<ShippingMethod[]>;

  // ─── Currency ────────────────────────────────────────────────

  /** Set the display currency. Triggers full pricing recalculation. */
  setCurrency(cartId: string, currencyCode: string): Promise<Cart>;

  /** Lock the FX rate for checkout (prevents rate drift). */
  lockFxRate(cartId: string): Promise<FxRateLock>;

  // ─── Checkout Transition ─────────────────────────────────────

  /** Initiate the checkout process. Validates, locks pricing, transitions status. */
  initiateCheckout(cartId: string): Promise<CheckoutInitiation>;

  /** Cancel an in-progress checkout, return to 'active'. */
  cancelCheckout(cartId: string): Promise<Cart>;

  /** Mark the cart as converted (order placed successfully). */
  markConverted(cartId: string, orderId: string): Promise<void>;

  // ─── Merge ───────────────────────────────────────────────────

  /** Merge an anonymous cart into the authenticated user's cart. */
  mergeCarts(
    anonymousCartId: string,
    userId: string,
    strategy?: CartMergeStrategy,
  ): Promise<CartMergeResult>;

  // ─── Analytics ───────────────────────────────────────────────

  /** Get cart analytics for a venture. */
  getAnalytics(ventureId: string, dateRange: DateRange): Promise<CartAnalyticsSummary>;
}

interface CreateCartInput {
  ventureId: string;
  storeId: string;
  owner: {
    userId?: string;
    sessionId: string;
    email?: string;
    ipAddress: string;
  };
  type?: CartType;
  currency?: string;
  metadata?: Record<string, unknown>;
}

interface CartOwnerLookup {
  ventureId: string;
  userId?: string;
  sessionId?: string;
}

interface CheckoutInitiation {
  cart: Cart;
  checkoutSessionId: string;
  pricingSnapshot: PricingSnapshot;
  fxRateLock: FxRateLock | null;
  expiresAt: string;
  readiness: CheckoutReadiness;
}

interface CartAnalyticsSummary {
  period: DateRange;
  totalCartsCreated: number;
  totalCartsConverted: number;
  totalCartsAbandoned: number;
  conversionRate: number;
  abandonmentRate: number;
  averageCartValue: number;
  medianCartValue: number;
  averageItemsPerCart: number;
  totalRevenue: number;
  totalDiscountsGiven: number;
  couponUsageRate: number;
  topProducts: Array<{ productId: string; name: string; quantity: number; revenue: number }>;
  topCoupons: Array<{ code: string; usage: number; totalDiscount: number }>;
  cartsByStatus: Record<CartStatus, number>;
  cartsByHour: number[];
  cartsByDayOfWeek: number[];
  funnelMetrics: CartFunnelMetrics;
}

interface CartFunnelMetrics {
  cartCreated: number;
  itemAdded: number;
  shippingEntered: number;
  couponApplied: number;
  checkoutInitiated: number;
  orderPlaced: number;
  dropOffRates: Record<string, number>;
}
```

### Inventory Reservation

```typescript
/**
 * Service for managing soft inventory holds on cart items.
 * Reservations prevent overselling by temporarily holding stock.
 */
interface ReservationService {
  /** Create a soft reservation for a cart item. */
  reserve(
    cartId: string,
    itemId: string,
    sku: string,
    quantity: number,
    policy: ReservationPolicy,
  ): Promise<ReservationResult>;

  /** Release a reservation (item removed or cart expired). */
  release(reservationId: string): Promise<void>;

  /** Release all reservations for a cart. */
  releaseAll(cartId: string): Promise<void>;

  /** Extend a reservation's hold time. */
  extend(reservationId: string, additionalMinutes: number): Promise<void>;

  /** Convert a soft reservation to a hard reservation (at checkout). */
  harden(reservationId: string): Promise<void>;

  /** Check if a reservation is still valid. */
  isValid(reservationId: string): Promise<boolean>;

  /** Clean up expired reservations (scheduled job). */
  cleanupExpired(): Promise<number>;
}

interface InventoryReservation {
  id: string;
  cartId: string;
  cartItemId: string;
  sku: string;
  quantity: number;
  type: 'soft' | 'hard';
  status: 'active' | 'released' | 'expired' | 'converted';
  expiresAt: string;
  createdAt: string;
  releasedAt: string | null;
}

interface ReservationResult {
  success: boolean;
  reservation: InventoryReservation | null;
  availableQuantity: number;
  requestedQuantity: number;
  reason: string | null;
}

interface ReservationPolicy {
  holdDurationMinutes: number;
  autoExtend: boolean;
  maxExtensions: number;
  allowPartial: boolean;
  priority: 'low' | 'normal' | 'high' | 'critical';
}
```

### Tax & Shipping

```typescript
/**
 * Tax calculator service — wraps external tax providers.
 */
interface TaxCalculator {
  /** Estimate taxes for a cart (preview — not committed). */
  estimate(cart: Cart, address: ShippingAddress): Promise<TaxEstimate>;

  /** Commit a tax transaction (called at checkout completion). */
  commit(transactionId: string): Promise<void>;

  /** Void a committed tax transaction (for cancellation). */
  void(transactionId: string): Promise<void>;

  /** Check if an address qualifies for tax exemption. */
  checkExemption(exemption: TaxExemption, address: ShippingAddress): Promise<boolean>;
}

interface TaxEstimate {
  transactionId: string;
  totalTax: number;
  lineItems: TaxLineItem[];
  jurisdictions: TaxJurisdiction[];
  provider: 'avalara' | 'taxjar' | 'internal';
  calculatedAt: string;
  expiresAt: string;
}

interface TaxLineItem {
  cartItemId: string;
  taxableAmount: number;
  taxAmount: number;
  effectiveRate: number;
  exempt: boolean;
  exemptionReason: string | null;
}

interface TaxJurisdiction {
  name: string;
  type: 'country' | 'state' | 'county' | 'city' | 'special';
  rate: number;
  amount: number;
  code: string;
}

interface TaxExemption {
  certificateId: string;
  type: 'resale' | 'government' | 'nonprofit' | 'other';
  jurisdictions: string[];
  expiresAt: string | null;
  verified: boolean;
}

/**
 * Shipping estimator service.
 */
interface ShippingEstimator {
  /** Get available shipping methods and rates for a cart. */
  estimate(cart: Cart, address: ShippingAddress): Promise<ShippingEstimate[]>;

  /** Validate a shipping address. */
  validateAddress(address: ShippingAddress): Promise<AddressValidation>;
}

interface ShippingEstimate {
  methodId: string;
  carrier: string;
  serviceName: string;
  displayName: string;
  rate: number;
  currency: string;
  estimatedDeliveryDays: { min: number; max: number };
  estimatedDeliveryDate: { earliest: string; latest: string };
  guaranteedDelivery: boolean;
  trackable: boolean;
  requiresSignature: boolean;
  restrictions: ShippingRestriction[];
}

interface ShippingAddress {
  firstName: string;
  lastName: string;
  company: string | null;
  addressLine1: string;
  addressLine2: string | null;
  city: string;
  state: string;
  postalCode: string;
  countryCode: string;
  phone: string | null;
  isResidential: boolean;
}

interface ShippingMethod {
  id: string;
  carrier: string;
  serviceName: string;
  displayName: string;
  rate: number;
  estimatedDeliveryDays: { min: number; max: number };
}

interface ShippingRestriction {
  type: 'hazmat' | 'oversize' | 'fragile' | 'temperature_controlled' | 'country_block';
  description: string;
  affectedItemIds: string[];
}

interface AddressValidation {
  valid: boolean;
  normalized: ShippingAddress | null;
  suggestions: ShippingAddress[];
  errors: Array<{ field: string; message: string }>;
}
```

### Multi-Currency

```typescript
/**
 * Service for managing multi-currency cart operations.
 */
interface CurrencyService {
  /** Get supported currencies for a venture. */
  getSupportedCurrencies(ventureId: string): Promise<SupportedCurrency[]>;

  /** Get the current FX rate between two currencies. */
  getRate(from: string, to: string): Promise<number>;

  /** Lock an FX rate for a cart session. */
  lockRate(cartId: string, from: string, to: string): Promise<FxRateLock>;

  /** Convert an amount between currencies. */
  convert(amount: number, from: string, to: string, lock?: FxRateLock): Promise<CurrencyConversion>;

  /** Check if an FX rate lock is still valid. */
  isLockValid(lock: FxRateLock): boolean;

  /** Refresh an expired FX rate lock. */
  refreshLock(lockId: string): Promise<FxRateLock>;
}

interface SupportedCurrency {
  code: string;
  name: string;
  symbol: string;
  decimalPlaces: number;
  isDefault: boolean;
  isSettlement: boolean;
  minOrderValue: number;
  maxOrderValue: number;
}

interface FxRateLock {
  id: string;
  cartId: string;
  fromCurrency: string;
  toCurrency: string;
  rate: number;
  inverseRate: number;
  lockedAt: string;
  expiresAt: string;
  source: string;
}

interface CurrencyConversion {
  fromCurrency: string;
  toCurrency: string;
  fromAmount: number;
  toAmount: number;
  rate: number;
  lockId: string | null;
  convertedAt: string;
}
```

---

## Database Schemas

### carts

```typescript
import { pgTable, uuid, varchar, text, timestamp, integer, jsonb, index, pgPolicy } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

export const cartsTable = pgTable(
  'commerce_carts',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    ventureId: uuid('venture_id').notNull().references(() => venturesTable.id),
    storeId: uuid('store_id').notNull().references(() => storesTable.id),

    // Owner
    userId: uuid('user_id').references(() => usersTable.id),
    sessionId: varchar('session_id', { length: 128 }).notNull(),
    email: varchar('email', { length: 320 }),
    ipAddress: varchar('ip_address', { length: 45 }),
    countryCode: varchar('country_code', { length: 2 }),

    // Status & Type
    status: varchar('status', { length: 20 }).notNull().default('empty'),
    type: varchar('type', { length: 20 }).notNull().default('standard'),

    // Currency
    displayCurrency: varchar('display_currency', { length: 3 }).notNull().default('USD'),
    settlementCurrency: varchar('settlement_currency', { length: 3 }).notNull().default('USD'),
    fxRateLockId: uuid('fx_rate_lock_id'),

    // Summary (denormalized for fast reads)
    itemCount: integer('item_count').notNull().default(0),
    subtotal: integer('subtotal').notNull().default(0),
    totalDiscounts: integer('total_discounts').notNull().default(0),
    taxEstimate: integer('tax_estimate').notNull().default(0),
    shippingEstimate: integer('shipping_estimate').notNull().default(0),
    grandTotal: integer('grand_total').notNull().default(0),

    // Shipping
    shippingAddress: jsonb('shipping_address'),
    shippingMethodId: varchar('shipping_method_id', { length: 64 }),
    shippingMethodData: jsonb('shipping_method_data'),

    // Metadata
    metadata: jsonb('metadata').notNull().default({}),
    pricingHash: varchar('pricing_hash', { length: 64 }),
    lastPricingSnapshotId: uuid('last_pricing_snapshot_id'),

    // Checkout
    checkoutSessionId: uuid('checkout_session_id'),
    convertedOrderId: uuid('converted_order_id'),

    // Timestamps
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
    lastActivityAt: timestamp('last_activity_at', { withTimezone: true }).notNull().defaultNow(),
    abandonedAt: timestamp('abandoned_at', { withTimezone: true }),
    convertedAt: timestamp('converted_at', { withTimezone: true }),

    // Concurrency
    version: integer('version').notNull().default(1),
  },
  (table) => ({
    ventureStatusIdx: index('idx_carts_venture_status')
      .on(table.ventureId, table.status),
    userActiveIdx: index('idx_carts_user_active')
      .on(table.ventureId, table.userId, table.status)
      .where(sql`status IN ('empty', 'active', 'checking_out')`),
    sessionIdx: index('idx_carts_session')
      .on(table.ventureId, table.sessionId),
    expiresIdx: index('idx_carts_expires')
      .on(table.expiresAt)
      .where(sql`status NOT IN ('converted', 'expired', 'merged')`),
    abandonedIdx: index('idx_carts_abandoned')
      .on(table.ventureId, table.lastActivityAt)
      .where(sql`status = 'active'`),
    checkoutIdx: index('idx_carts_checkout')
      .on(table.checkoutSessionId)
      .where(sql`checkout_session_id IS NOT NULL`),

    // RLS Policy — tenant isolation
    tenantIsolation: pgPolicy('carts_tenant_isolation', {
      as: 'restrictive',
      for: 'all',
      using: sql`venture_id = current_setting('app.venture_id')::uuid`,
      withCheck: sql`venture_id = current_setting('app.venture_id')::uuid`,
    }),
  }),
);
```

### cart_items

```typescript
export const cartItemsTable = pgTable(
  'commerce_cart_items',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    cartId: uuid('cart_id').notNull().references(() => cartsTable.id, { onDelete: 'cascade' }),
    ventureId: uuid('venture_id').notNull().references(() => venturesTable.id),

    // Product reference
    productId: uuid('product_id').notNull(),
    variantId: uuid('variant_id'),
    sku: varchar('sku', { length: 128 }).notNull(),

    // Denormalized product data (snapshot at addition time)
    name: varchar('name', { length: 512 }).notNull(),
    imageUrl: text('image_url'),
    weightGrams: integer('weight_grams').notNull().default(0),

    // Quantity
    quantity: integer('quantity').notNull().default(1),

    // Pricing (smallest currency unit)
    unitPrice: integer('unit_price').notNull(),
    originalPrice: integer('original_price').notNull(),
    lineTotal: integer('line_total').notNull(),
    taxAmount: integer('tax_amount').notNull().default(0),
    taxRateBps: integer('tax_rate_bps').notNull().default(0), // basis points (1300 = 13%)
    taxExempt: integer('tax_exempt').notNull().default(0),

    // Discounts
    discounts: jsonb('discounts').notNull().default('[]'),

    // Bundle membership
    bundleId: uuid('bundle_id'),

    // Reservation
    reservationId: uuid('reservation_id'),

    // Custom fields
    customFields: jsonb('custom_fields').notNull().default('{}'),

    // Availability
    isAvailable: integer('is_available').notNull().default(1),
    unavailabilityReason: text('unavailability_reason'),

    // Timestamps
    addedAt: timestamp('added_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    cartIdx: index('idx_cart_items_cart').on(table.cartId),
    cartProductIdx: index('idx_cart_items_cart_product')
      .on(table.cartId, table.productId, table.variantId),
    skuIdx: index('idx_cart_items_sku').on(table.sku),
    bundleIdx: index('idx_cart_items_bundle')
      .on(table.bundleId)
      .where(sql`bundle_id IS NOT NULL`),

    tenantIsolation: pgPolicy('cart_items_tenant_isolation', {
      as: 'restrictive',
      for: 'all',
      using: sql`venture_id = current_setting('app.venture_id')::uuid`,
      withCheck: sql`venture_id = current_setting('app.venture_id')::uuid`,
    }),
  }),
);
```

### cart_coupons

```typescript
export const cartCouponsTable = pgTable(
  'commerce_cart_coupons',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    cartId: uuid('cart_id').notNull().references(() => cartsTable.id, { onDelete: 'cascade' }),
    ventureId: uuid('venture_id').notNull().references(() => venturesTable.id),
    couponId: uuid('coupon_id').notNull(),

    code: varchar('code', { length: 64 }).notNull(),
    type: varchar('type', { length: 32 }).notNull(),
    value: integer('value').notNull(),

    discountAmount: integer('discount_amount').notNull(),
    affectedItemIds: jsonb('affected_item_ids').notNull().default('[]'),

    stackPosition: integer('stack_position').notNull().default(0),

    appliedByUserId: uuid('applied_by_user_id'),
    appliedAt: timestamp('applied_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    cartIdx: index('idx_cart_coupons_cart').on(table.cartId),
    couponIdx: index('idx_cart_coupons_coupon').on(table.couponId),
    cartCodeUniq: index('idx_cart_coupons_cart_code')
      .on(table.cartId, table.code),

    tenantIsolation: pgPolicy('cart_coupons_tenant_isolation', {
      as: 'restrictive',
      for: 'all',
      using: sql`venture_id = current_setting('app.venture_id')::uuid`,
      withCheck: sql`venture_id = current_setting('app.venture_id')::uuid`,
    }),
  }),
);
```

### cart_rules

```typescript
export const cartRulesTable = pgTable(
  'commerce_cart_rules',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    ventureId: uuid('venture_id').notNull().references(() => venturesTable.id),

    name: varchar('name', { length: 256 }).notNull(),
    description: text('description'),
    type: varchar('type', { length: 64 }).notNull(),

    condition: jsonb('condition').notNull(),
    action: jsonb('action').notNull(),

    priority: integer('priority').notNull().default(100),

    isActive: integer('is_active').notNull().default(1),
    startsAt: timestamp('starts_at', { withTimezone: true }),
    expiresAt: timestamp('expires_at', { withTimezone: true }),

    metadata: jsonb('metadata').notNull().default('{}'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
    createdBy: uuid('created_by'),
  },
  (table) => ({
    ventureActiveIdx: index('idx_cart_rules_venture_active')
      .on(table.ventureId, table.isActive, table.priority),
    typeIdx: index('idx_cart_rules_type')
      .on(table.ventureId, table.type),

    tenantIsolation: pgPolicy('cart_rules_tenant_isolation', {
      as: 'restrictive',
      for: 'all',
      using: sql`venture_id = current_setting('app.venture_id')::uuid`,
      withCheck: sql`venture_id = current_setting('app.venture_id')::uuid`,
    }),
  }),
);
```

### abandoned_cart_events

```typescript
export const abandonedCartEventsTable = pgTable(
  'commerce_abandoned_cart_events',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    cartId: uuid('cart_id').notNull().references(() => cartsTable.id),
    ventureId: uuid('venture_id').notNull().references(() => venturesTable.id),

    userId: uuid('user_id'),
    email: varchar('email', { length: 320 }),

    cartValue: integer('cart_value').notNull(),
    itemCount: integer('item_count').notNull(),
    itemSnapshot: jsonb('item_snapshot').notNull(),

    reason: varchar('reason', { length: 32 }).notNull(),
    lastActivityAt: timestamp('last_activity_at', { withTimezone: true }).notNull(),
    abandonedAt: timestamp('abandoned_at', { withTimezone: true }).notNull().defaultNow(),

    recoveryAttempts: integer('recovery_attempts').notNull().default(0),
    lastRecoveryAt: timestamp('last_recovery_at', { withTimezone: true }),
    recoveredAt: timestamp('recovered_at', { withTimezone: true }),
    recoverySource: varchar('recovery_source', { length: 64 }),
    recoveryActions: jsonb('recovery_actions').notNull().default('[]'),

    metadata: jsonb('metadata').notNull().default('{}'),
  },
  (table) => ({
    ventureIdx: index('idx_abandoned_venture')
      .on(table.ventureId, table.abandonedAt),
    cartIdx: index('idx_abandoned_cart').on(table.cartId),
    emailIdx: index('idx_abandoned_email')
      .on(table.ventureId, table.email)
      .where(sql`email IS NOT NULL`),
    unrecoveredIdx: index('idx_abandoned_unrecovered')
      .on(table.ventureId, table.recoveryAttempts)
      .where(sql`recovered_at IS NULL`),

    tenantIsolation: pgPolicy('abandoned_cart_events_tenant_isolation', {
      as: 'restrictive',
      for: 'all',
      using: sql`venture_id = current_setting('app.venture_id')::uuid`,
      withCheck: sql`venture_id = current_setting('app.venture_id')::uuid`,
    }),
  }),
);
```

### cart_item_reservations

```typescript
export const cartItemReservationsTable = pgTable(
  'commerce_cart_item_reservations',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    cartId: uuid('cart_id').notNull().references(() => cartsTable.id, { onDelete: 'cascade' }),
    cartItemId: uuid('cart_item_id').notNull().references(() => cartItemsTable.id, { onDelete: 'cascade' }),
    ventureId: uuid('venture_id').notNull().references(() => venturesTable.id),

    sku: varchar('sku', { length: 128 }).notNull(),
    quantity: integer('quantity').notNull(),

    type: varchar('type', { length: 10 }).notNull().default('soft'),
    status: varchar('status', { length: 16 }).notNull().default('active'),

    priority: varchar('priority', { length: 10 }).notNull().default('normal'),

    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
    extensionCount: integer('extension_count').notNull().default(0),
    maxExtensions: integer('max_extensions').notNull().default(3),

    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    releasedAt: timestamp('released_at', { withTimezone: true }),
    convertedAt: timestamp('converted_at', { withTimezone: true }),
  },
  (table) => ({
    skuActiveIdx: index('idx_reservations_sku_active')
      .on(table.sku, table.status)
      .where(sql`status = 'active'`),
    cartIdx: index('idx_reservations_cart').on(table.cartId),
    expiresIdx: index('idx_reservations_expires')
      .on(table.expiresAt)
      .where(sql`status = 'active'`),

    tenantIsolation: pgPolicy('cart_item_reservations_tenant_isolation', {
      as: 'restrictive',
      for: 'all',
      using: sql`venture_id = current_setting('app.venture_id')::uuid`,
      withCheck: sql`venture_id = current_setting('app.venture_id')::uuid`,
    }),
  }),
);
```

### cart_pricing_snapshots

```typescript
export const cartPricingSnapshotsTable = pgTable(
  'commerce_cart_pricing_snapshots',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    cartId: uuid('cart_id').notNull().references(() => cartsTable.id, { onDelete: 'cascade' }),
    ventureId: uuid('venture_id').notNull().references(() => venturesTable.id),

    summary: jsonb('summary').notNull(),
    itemBreakdowns: jsonb('item_breakdowns').notNull(),
    appliedRules: jsonb('applied_rules').notNull().default('[]'),
    rejectedRules: jsonb('rejected_rules').notNull().default('[]'),
    warnings: jsonb('warnings').notNull().default('[]'),

    pricingContext: jsonb('pricing_context').notNull(),
    cartVersion: integer('cart_version').notNull(),

    fxRateBps: integer('fx_rate_bps'),
    fxRateLockId: uuid('fx_rate_lock_id'),

    trigger: varchar('trigger', { length: 32 }).notNull(),

    calculationTimeMs: integer('calculation_time_ms').notNull(),
    pricingHash: varchar('pricing_hash', { length: 64 }).notNull(),

    calculatedAt: timestamp('calculated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    cartIdx: index('idx_pricing_snapshots_cart')
      .on(table.cartId, table.calculatedAt),
    hashIdx: index('idx_pricing_snapshots_hash')
      .on(table.pricingHash),

    tenantIsolation: pgPolicy('cart_pricing_snapshots_tenant_isolation', {
      as: 'restrictive',
      for: 'all',
      using: sql`venture_id = current_setting('app.venture_id')::uuid`,
      withCheck: sql`venture_id = current_setting('app.venture_id')::uuid`,
    }),
  }),
);
```

---

## Code Examples

### 1. Create a Cart

```typescript
import { createCartService } from '@mcv/commerce/cart';

const cartService = createCartService({
  db,
  redis,
  eventBus,
  catalogService,
  inventoryService,
});

// ─── Anonymous Cart ────────────────────────────────────────────

const cart = await cartService.create({
  ventureId: 'venture_abc123',
  storeId: 'store_web_main',
  owner: {
    sessionId: 'sess_k8j2m9x1p4',
    ipAddress: '203.0.113.42',
  },
  currency: 'CAD',
  metadata: {
    utmSource: 'google',
    utmMedium: 'cpc',
    utmCampaign: 'summer_sale_2025',
    landingPage: '/collections/new-arrivals',
    userAgent: 'Mozilla/5.0 ...',
  },
});

console.log(cart);
// {
//   id: '01936f8c-...',
//   ventureId: 'venture_abc123',
//   storeId: 'store_web_main',
//   owner: {
//     userId: null,
//     sessionId: 'sess_k8j2m9x1p4',
//     email: null,
//     ipAddress: '203.0.113.42',
//     countryCode: 'CA',
//   },
//   status: 'empty',
//   type: 'standard',
//   items: [],
//   coupons: [],
//   shippingAddress: null,
//   shippingMethod: null,
//   summary: {
//     itemCount: 0,
//     lineItemCount: 0,
//     subtotalBeforeDiscounts: 0,
//     totalDiscounts: 0,
//     subtotal: 0,
//     discountBreakdown: [],
//     taxEstimate: 0,
//     taxBreakdown: [],
//     taxCalculated: false,
//     shippingEstimate: 0,
//     shippingCalculated: false,
//     grandTotal: 0,
//     displayCurrency: 'CAD',
//     settlementCurrency: 'USD',
//     fxRate: null,
//     grandTotalSettlement: 0,
//     totalSavings: 0,
//     savingsPercentage: 0,
//     freeShippingProgress: {
//       threshold: 7500, currentAmount: 0, remainingAmount: 7500,
//       progressPercentage: 0, qualified: false,
//     },
//     minimumOrderProgress: null,
//     calculatedAt: '2025-07-15T14:30:00Z',
//     pricingHash: 'e3b0c44298fc...',
//   },
//   currency: { displayCurrency: 'CAD', settlementCurrency: 'USD', fxRate: null },
//   metadata: { utmSource: 'google', ... },
//   createdAt: '2025-07-15T14:30:00Z',
//   updatedAt: '2025-07-15T14:30:00Z',
//   expiresAt: '2025-07-22T14:30:00Z',
//   version: 1,
// }

// ─── Authenticated Cart ────────────────────────────────────────

const authCart = await cartService.create({
  ventureId: 'venture_abc123',
  storeId: 'store_web_main',
  owner: {
    userId: 'user_9k3m1p',
    sessionId: 'sess_authenticated_xyz',
    email: 'customer@example.com',
    ipAddress: '198.51.100.7',
  },
  type: 'standard',
  currency: 'USD',
});
```

### 2. Add Items to Cart

```typescript
// ─── Add a single item ────────────────────────────────────────

const cartWithItem = await cartService.addItem(cart.id, {
  productId: 'prod_wireless_headphones',
  variantId: 'var_black_large',
  quantity: 1,
});

console.log(cartWithItem.items[0]);
// {
//   id: 'li_01936f8d...',
//   cartId: '01936f8c-...',
//   productId: 'prod_wireless_headphones',
//   variantId: 'var_black_large',
//   sku: 'WH-BLK-LG-001',
//   name: 'ProSound Wireless Headphones — Black / Large',
//   imageUrl: 'https://cdn.mcv.one/products/wh-blk-lg.webp',
//   quantity: 1,
//   unitPrice: 12999,      // $129.99 in cents
//   originalPrice: 14999,  // $149.99 — on sale
//   discounts: [
//     { source: 'promotion', label: 'Summer Sale -$20',
//       amount: 2000, percentage: 13.33, sourceId: 'promo_summer2025' },
//   ],
//   lineTotal: 12999,
//   taxAmount: 0,           // Not calculated yet (no address)
//   taxRate: 0,
//   taxExempt: false,
//   weightGrams: 340,
//   reservation: {
//     id: 'res_01936f8d...',
//     sku: 'WH-BLK-LG-001',
//     quantity: 1,
//     type: 'soft',
//     status: 'active',
//     expiresAt: '2025-07-15T15:00:00Z',
//   },
//   bundleId: null,
//   customFields: {},
//   isAvailable: true,
//   unavailabilityReason: null,
//   addedAt: '2025-07-15T14:31:00Z',
//   updatedAt: '2025-07-15T14:31:00Z',
// }

// ─── Add item with custom fields ──────────────────────────────

const cartWith2Items = await cartService.addItem(cart.id, {
  productId: 'prod_leather_case',
  quantity: 2,
  customFields: {
    engraving: 'J.D.',
    giftWrap: 'true',
    giftMessage: 'Happy Birthday!',
  },
});

// ─── Update quantity ──────────────────────────────────────────

const updatedCart = await cartService.updateItem(cart.id, {
  itemId: cartWith2Items.items[0].id,
  quantity: 3,
});

// Pricing engine recalculates automatically
console.log(updatedCart.summary);
// {
//   itemCount: 5,                          // 3 headphones + 2 cases
//   lineItemCount: 2,
//   subtotalBeforeDiscounts: 49997,        // (3 × $149.99) + (2 × $24.99)
//   totalDiscounts: 6000,                  // 3 × $20 summer sale
//   subtotal: 43997,
//   grandTotal: 43997,                     // No tax/shipping yet
//   ...
// }

// ─── Quantity validation ──────────────────────────────────────

try {
  await cartService.addItem(cart.id, {
    productId: 'prod_limited_edition',
    quantity: 50,  // Exceeds max
  });
} catch (error) {
  console.error(error.code);    // 'ITEM_QUANTITY_EXCEEDED'
  console.error(error.message); // 'Maximum quantity for this item is 5 per customer'
}
```

### 3. Apply Coupon / Promo Code

```typescript
// ─── Apply a percentage discount coupon ───────────────────────

const cartWithCoupon = await cartService.applyCoupon(cart.id, 'SUMMER15');

console.log(cartWithCoupon.coupons[0]);
// {
//   id: 'cc_01936f8e...',
//   cartId: '01936f8c-...',
//   couponId: 'coupon_summer15_2025',
//   code: 'SUMMER15',
//   type: 'percentage',
//   discountAmount: 6599,                  // 15% of $43,997
//   affectedItemIds: ['li_01936f8d...', 'li_01936f8e...'],
//   appliedAt: '2025-07-15T14:33:00Z',
// }

console.log(cartWithCoupon.summary.discountBreakdown);
// [
//   { source: 'promotion', label: 'Summer Sale', amount: 6000, ... },
//   { source: 'coupon', label: 'SUMMER15 — 15% off', amount: 6599, percentage: 15, ... },
// ]
// totalSavings: 12599, savingsPercentage: 25.2

// ─── Stacking rejected ───────────────────────────────────────

try {
  await cartService.applyCoupon(cart.id, 'EXTRA10');
} catch (error) {
  console.error(error.code);    // 'COUPON_NOT_STACKABLE'
  console.error(error.message); // 'SUMMER15 cannot be combined with other percentage discounts'
}

// ─── Free shipping coupon (stackable by default) ──────────────

await cartService.applyCoupon(cart.id, 'FREESHIP');
// ✓ Free shipping coupons are stackable by default

// ─── Validate without applying ────────────────────────────────

const validation = await couponService.validate('EXPIRED2024', {
  ventureId: 'venture_abc123',
  userId: null,
  cartSubtotal: 37398,
  cartItems: [
    { productId: 'prod_wireless_headphones', categoryId: 'cat_audio', quantity: 3 },
    { productId: 'prod_leather_case', categoryId: 'cat_accessories', quantity: 2 },
  ],
  appliedCoupons: ['SUMMER15', 'FREESHIP'],
  customerGroups: [],
});

console.log(validation);
// {
//   valid: false,
//   coupon: null,
//   estimatedDiscount: 0,
//   errors: [
//     { code: 'COUPON_EXPIRED', message: 'This coupon expired on 2024-12-31' },
//   ],
//   warnings: [],
// }

// ─── Remove a coupon ──────────────────────────────────────────

await cartService.removeCoupon(cart.id, 'cc_01936f8e...');
```

### 4. Pricing Calculation Deep Dive

```typescript
import { createPricingEngine } from '@mcv/commerce/cart';

const pricingEngine = createPricingEngine({
  catalogService,
  couponService,
  taxCalculator,
  shippingEstimator,
  currencyService,
});

// ─── Full pipeline execution ──────────────────────────────────

const pricingResult = await pricingEngine.calculate(cart, {
  ventureId: 'venture_abc123',
  customerTier: 'gold',
  customerGroups: ['loyalty_program', 'early_adopter'],
  displayCurrency: 'CAD',
  settlementCurrency: 'USD',
  fxRateLock: null,
  shippingAddress: {
    firstName: 'Jane',
    lastName: 'Doe',
    company: null,
    addressLine1: '123 Queen St W',
    addressLine2: 'Suite 400',
    city: 'Toronto',
    state: 'ON',
    postalCode: 'M5H 2M9',
    countryCode: 'CA',
    phone: '+14165551234',
    isResidential: false,
  },
  shippingMethod: {
    id: 'method_standard',
    carrier: 'canada_post',
    serviceName: 'Regular Parcel',
    displayName: 'Standard Shipping (5–8 business days)',
    rate: 999,
    estimatedDeliveryDays: { min: 5, max: 8 },
  },
  taxExemption: null,
  evaluationTime: '2025-07-15T14:35:00Z',
  includeTax: true,
  includeShipping: true,
  experimentVariants: { pricing_test_001: 'variant_b' },
});

console.log(pricingResult.summary);
// {
//   itemCount: 5,
//   subtotalBeforeDiscounts: 49997,
//   totalDiscounts: 12599,
//   subtotal: 37398,
//   taxEstimate: 4862,                       // 13% HST (Ontario)
//   taxBreakdown: [
//     { jurisdiction: 'Canada', jurisdictionType: 'country',
//       taxName: 'GST', rate: 0.05, amount: 1870, taxableAmount: 37398 },
//     { jurisdiction: 'Ontario', jurisdictionType: 'state',
//       taxName: 'PST', rate: 0.08, amount: 2992, taxableAmount: 37398 },
//   ],
//   taxCalculated: true,
//   shippingEstimate: 999,
//   shippingCalculated: true,
//   grandTotal: 43259,                       // subtotal + tax + shipping
//   displayCurrency: 'CAD',
//   settlementCurrency: 'USD',
//   fxRate: 0.7342,
//   grandTotalSettlement: 31757,             // CAD 432.59 → USD 317.57
//   totalSavings: 12599,
//   savingsPercentage: 25.2,
// }

// ─── Per-item breakdown ───────────────────────────────────────

const headphonesBreakdown = pricingResult.itemBreakdowns.get('li_01936f8d...');
console.log(headphonesBreakdown);
// {
//   itemId: 'li_01936f8d...',
//   catalogPrice: 14999,                    // $149.99 catalog
//   tieredPrice: 14499,                     // $144.99 gold tier
//   volumeDiscount: 1000,                   // $10.00 — 3+ units
//   bundleDiscount: 0,
//   couponDiscount: 5549,                   // 15% SUMMER15
//   promotionalDiscount: 2000,              // $20 summer sale/unit
//   loyaltyDiscount: 0,
//   effectiveUnitPrice: 10450,              // $104.50 final/unit
//   quantity: 3,
//   lineTotal: 31350,                       // $313.50
//   taxAmount: 4076,                        // 13% HST
//   taxRate: 0.13,
//   totalWithTax: 35426,
// }

// ─── Applied and rejected rules ───────────────────────────────

console.log(pricingResult.appliedRules);
// [
//   { ruleId: 'rule_gold_tier', ruleType: 'tiered_pricing',
//     description: 'Gold tier 3% discount', discountAmount: 1500 },
//   { ruleId: 'rule_vol_3plus', ruleType: 'volume_discount',
//     description: '3+ units $10 off each', discountAmount: 3000 },
//   { ruleId: 'promo_summer25', ruleType: 'promotion',
//     description: 'Summer Sale $20 off headphones', discountAmount: 6000 },
//   { ruleId: 'coupon_summer15', ruleType: 'coupon',
//     description: 'SUMMER15 15% off', discountAmount: 6599 },
// ]

console.log(pricingResult.rejectedRules);
// [
//   { ruleId: 'rule_bundle_audio', ruleType: 'bundle',
//     reason: 'Bundle requires headphones + speaker (missing speaker)' },
//   { ruleId: 'rule_loyalty_5pct', ruleType: 'loyalty',
//     reason: 'Not stackable with coupon SUMMER15' },
// ]

console.log(pricingResult.warnings);
// [
//   { code: 'PRICE_CHANGED', severity: 'info',
//     message: 'Price of "Leather Case" changed from $27.99 to $24.99 since added',
//     itemId: 'li_01936f8e...' },
// ]

console.log(`Pricing calculated in ${pricingResult.calculationTimeMs}ms`);
// Pricing calculated in 47ms
```

### 5. Cart Merge on Login

```typescript
import { CartMergeService } from '@mcv/commerce/cart';

// Scenario: User browsed anonymously, added items, then logs in.
// They already have items in their authenticated cart from a previous session.

// ─── Preview the merge ────────────────────────────────────────

const preview = await cartMergeService.preview(
  'cart_anonymous_sess123',     // Anonymous cart: 3 headphones + 2 cases + SUMMER15
  'cart_auth_user456',          // Auth cart: 1 headphone + 3 speakers
  'sum_quantities',
);

console.log(preview);
// {
//   projectedItemCount: 9,
//   projectedCartValue: 52496,
//   itemsToAdd: [
//     { productId: 'prod_leather_case', quantity: 2, ... },   // Only in anon
//   ],
//   itemsToUpdate: [
//     { itemId: 'li_auth_hp...', currentQuantity: 1, projectedQuantity: 4 },
//   ],
//   conflicts: [
//     {
//       type: 'price_change',
//       itemId: 'li_auth_hp...',
//       description: 'Headphones price differs: $129.99 (anon) vs $149.99 (auth)',
//       anonymousValue: 12999,
//       authenticatedValue: 14999,
//       resolution: 'auto',
//       resolvedValue: 12999,      // Summer sale still active
//     },
//   ],
//   couponsToTransfer: [{ code: 'SUMMER15', ... }],
//   couponsToDrop: [],
// }

// ─── Execute the merge ────────────────────────────────────────

const mergeResult = await cartService.mergeCarts(
  'cart_anonymous_sess123',
  'user_456',
  'sum_quantities',
);

console.log(mergeResult);
// {
//   mergedCart: { id: 'cart_auth_user456', status: 'active', items: [...], ... },
//   addedItems: [{ name: 'Leather Case', quantity: 2, ... }],
//   updatedItems: [{ itemId: 'li_auth_hp...', oldQuantity: 1, newQuantity: 4 }],
//   transferredCoupons: [{ code: 'SUMMER15', ... }],
//   droppedCoupons: [],
//   resolvedConflicts: [{ type: 'price_change', resolution: 'auto', ... }],
//   unresolvedConflicts: [],
//   sourceCartId: 'cart_anonymous_sess123',  // Now status: 'merged'
//   targetCartId: 'cart_auth_user456',
// }

// ─── Manual merge with user-resolved conflicts ────────────────

const manualMerge = await cartService.mergeCarts(
  'cart_anon_2',
  'user_789',
  'manual',
);

if (manualMerge.unresolvedConflicts.length > 0) {
  // Present conflicts to user in UI, then resolve:
  const resolved = await cartMergeService.resolveConflicts(
    manualMerge.mergedCart.id,
    [
      { conflictIndex: 0, resolution: 'keep_anonymous' },
      { conflictIndex: 1, resolution: 'custom', customValue: 5 },
    ],
  );
}
```

### 6. Abandoned Cart Detection & Recovery

```typescript
import { createAbandonedCartService } from '@mcv/commerce/cart';

const abandonedCartService = createAbandonedCartService({
  db,
  eventBus,
  notificationService,
  cartService,
});

// ─── Detection (scheduled job, every 15 minutes) ──────────────

const abandonedCarts = await abandonedCartService.detectAbandoned('venture_abc123');
// Finds carts with no activity for > CART_ABANDONED_THRESHOLD_HOURS (default: 1h)

console.log(abandonedCarts[0]);
// {
//   id: 'ae_01936f90...',
//   cartId: 'cart_01936f8c...',
//   ventureId: 'venture_abc123',
//   userId: null,
//   email: 'visitor@example.com',
//   cartValue: 43259,
//   itemCount: 5,
//   reason: 'idle_timeout',
//   lastActivityAt: '2025-07-15T13:15:00Z',
//   abandonedAt: '2025-07-15T14:45:00Z',
//   recoveryAttempts: 0,
//   recoveredAt: null,
//   recoverySource: null,
// }

// ─── Recovery workflow ────────────────────────────────────────

for (const event of abandonedCarts) {
  if (event.email && event.recoveryAttempts === 0) {
    await abandonedCartService.initiateRecovery(event.cartId, {
      channels: ['email'],
      firstAttemptDelayMinutes: 30,
      maxAttempts: 3,
      attemptIntervals: [30, 120, 1440],     // 30min, 2hrs, 24hrs
      includeIncentive: event.cartValue > 5000,
      incentiveCouponCode: event.cartValue > 10000 ? 'COMEBACK15' : 'COMEBACK10',
      emailTemplateId: 'tmpl_abandoned_cart_v2',
    });
  }
}

// Recovery email sequence:
// Email 1 (30 min):  "You left something behind!" — cart items, no discount
// Email 2 (2 hrs):   "Still thinking about it?"   — items + social proof
// Email 3 (24 hrs):  "Here's 10% off your cart"   — items + COMEBACK10 coupon

// ─── Customer returns via recovery link ───────────────────────

await abandonedCartService.markRecovered('cart_01936f8c...', 'email_campaign_1');
// Cart status: 'abandoned' → 'active'
// Emits CartRecoveredEvent to Redpanda

// ─── Abandonment analytics ────────────────────────────────────

const metrics = await abandonedCartService.getAbandonmentMetrics(
  'venture_abc123',
  { from: '2025-07-01', to: '2025-07-15' },
);

console.log(metrics);
// {
//   totalCarts: 12450,
//   abandonedCarts: 8714,
//   abandonmentRate: 0.6998,                 // ~70% — industry standard
//   totalAbandonedValue: 4357000,            // $43,570.00
//   averageAbandonedValue: 5000,             // $50.00
//   topAbandonedProducts: [
//     { productId: 'prod_wireless_headphones', name: 'ProSound Wireless', count: 3241 },
//     { productId: 'prod_leather_case', name: 'Premium Leather Case', count: 2156 },
//   ],
//   abandonmentByReason: {
//     idle_timeout: 6100, session_expired: 1500, checkout_failure: 714,
//     price_increase: 200, out_of_stock: 150, explicit_abandon: 50,
//   },
//   abandonmentByHour: [120, 95, 70, ...],
//   abandonmentByDayOfWeek: [1200, 1300, ...],
// }

const recoveryMetrics = await abandonedCartService.getRecoveryMetrics(
  'venture_abc123',
  { from: '2025-07-01', to: '2025-07-15' },
);

console.log(recoveryMetrics);
// {
//   totalAttempts: 15200,
//   emailsSent: 12100,
//   emailsOpened: 4840,                      // 40% open rate
//   emailsClicked: 1936,                     // 16% click rate
//   cartsRecovered: 871,
//   recoveryRate: 0.10,                      // 10%
//   revenueRecovered: 435700,                // $4,357.00
//   averageRecoveryTimeMinutes: 180,         // 3 hours
//   recoveryByChannel: {
//     email: { attempts: 12100, recoveries: 750, revenue: 375000 },
//     push_notification: { attempts: 2100, recoveries: 84, revenue: 42000 },
//     retargeting: { attempts: 1000, recoveries: 37, revenue: 18700 },
//   },
// }
```

### 7. Checkout Transition

```typescript
// ─── Initiate Checkout ────────────────────────────────────────

try {
  const checkout = await cartService.initiateCheckout(cart.id);

  console.log(checkout);
  // {
  //   cart: { id: 'cart_01936f8c...', status: 'checking_out', ... },
  //   checkoutSessionId: 'cs_01936f92...',
  //   pricingSnapshot: {
  //     id: 'ps_01936f92...',
  //     summary: { ... },
  //     itemBreakdowns: { ... },
  //     appliedRules: [...],
  //     calculatedAt: '2025-07-15T14:45:00Z',
  //   },
  //   fxRateLock: {
  //     id: 'fxl_01936f92...',
  //     fromCurrency: 'CAD',
  //     toCurrency: 'USD',
  //     rate: 0.7342,
  //     inverseRate: 1.3620,
  //     lockedAt: '2025-07-15T14:45:00Z',
  //     expiresAt: '2025-07-15T15:15:00Z',   // 30 minute lock
  //     source: 'ecb_realtime',
  //   },
  //   expiresAt: '2025-07-15T15:15:00Z',
  //   readiness: {
  //     ready: true,
  //     blockingRules: [],
  //     warnings: [
  //       { ruleName: 'loyalty_upsell', action: {
  //           message: 'Add $6.02 more to earn 500 loyalty points!' } },
  //     ],
  //     info: [],
  //   },
  // }

  // Pass to checkout/order module — snapshot ensures price consistency
  const order = await orderService.createFromCheckout({
    checkoutSessionId: checkout.checkoutSessionId,
    pricingSnapshotId: checkout.pricingSnapshot.id,
    fxRateLockId: checkout.fxRateLock?.id,
    paymentMethodId: 'pm_visa_ending_4242',
    billingAddress: { /* ... */ },
  });

  // Mark converted after successful payment
  await cartService.markConverted(cart.id, order.id);
  // Cart status: 'checking_out' → 'converted'
  // Reservations converted to committed inventory deductions
  // Emits CheckoutInitiatedEvent + CartConvertedEvent

} catch (error) {
  if (error.code === 'CART_EMPTY') {
    // Cannot checkout empty cart
  } else if (error.code === 'CART_RULE_VIOLATION') {
    console.log(error.violations);
    // [
    //   { rule: 'minimum_order_value',
    //     message: 'Minimum order is $25.00. Cart total: $18.50.' },
    //   { rule: 'geo_restriction',
    //     message: 'Product "X" cannot be shipped to your country.' },
    // ]
  } else if (error.code === 'ITEM_OUT_OF_STOCK') {
    console.log(error.affectedItems);
  }
}

// ─── Cancel checkout ──────────────────────────────────────────

const reactivatedCart = await cartService.cancelCheckout(cart.id);
// Cart status: 'checking_out' → 'active'
// FX rate lock released; soft reservations maintained

// ─── Readiness check without transitioning ────────────────────

const readiness = await cartRulesEngine.isCheckoutReady(cart);
console.log(readiness);
// {
//   ready: false,
//   blockingRules: [
//     { ruleName: 'min_order_value', ruleType: 'minimum_order_value',
//       passed: false, action: { message: 'Minimum order is $25.00' } },
//   ],
//   warnings: [
//     { ruleName: 'low_stock_warning', ruleType: 'info',
//       passed: true, action: { message: '2 items have low stock' } },
//   ],
//   info: [],
// }
```

### 8. Multi-Currency Cart

```typescript
import { createCurrencyService } from '@mcv/commerce/cart';

const currencyService = createCurrencyService({
  fxRateProvider: 'ecb',
  redis,
  db,
});

// ─── Supported currencies ─────────────────────────────────────

const currencies = await currencyService.getSupportedCurrencies('venture_abc123');
console.log(currencies);
// [
//   { code: 'USD', name: 'US Dollar', symbol: '$', decimalPlaces: 2,
//     isDefault: true, isSettlement: true, minOrderValue: 100, maxOrderValue: 99999900 },
//   { code: 'CAD', name: 'Canadian Dollar', symbol: 'CA$', decimalPlaces: 2, ... },
//   { code: 'EUR', name: 'Euro', symbol: '€', decimalPlaces: 2, ... },
//   { code: 'GBP', name: 'British Pound', symbol: '£', decimalPlaces: 2, ... },
//   { code: 'JPY', name: 'Japanese Yen', symbol: '¥', decimalPlaces: 0, ... },
// ]

// ─── Change cart currency ─────────────────────────────────────

const euroCart = await cartService.setCurrency(cart.id, 'EUR');
console.log(euroCart.summary);
// {
//   grandTotal: 39850,                       // €398.50
//   displayCurrency: 'EUR',
//   settlementCurrency: 'USD',
//   fxRate: 1.0846,                          // 1 EUR = 1.0846 USD
//   grandTotalSettlement: 43259,             // $432.59 (unchanged)
// }

// ─── Lock FX rate before checkout ─────────────────────────────

const fxLock = await cartService.lockFxRate(cart.id);
console.log(fxLock);
// {
//   id: 'fxl_01936f95...',
//   cartId: 'cart_01936f8c...',
//   fromCurrency: 'EUR',
//   toCurrency: 'USD',
//   rate: 1.0846,
//   inverseRate: 0.9220,
//   lockedAt: '2025-07-15T14:50:00Z',
//   expiresAt: '2025-07-15T15:20:00Z',      // 30 min lock
//   source: 'ecb_realtime',
// }
// FX rate is now locked — customer pays the locked rate even if rates change

// ─── Direct currency conversion ───────────────────────────────

const conversion = await currencyService.convert(10000, 'USD', 'JPY');
console.log(conversion);
// {
//   fromCurrency: 'USD',
//   toCurrency: 'JPY',
//   fromAmount: 10000,
//   toAmount: 15623,                         // ¥15,623 (no decimals for JPY)
//   rate: 156.23,
//   lockId: null,
//   convertedAt: '2025-07-15T14:50:30Z',
// }

// ─── Handle expired FX lock ───────────────────────────────────

try {
  await cartService.initiateCheckout(cart.id);
} catch (error) {
  if (error.code === 'FX_RATE_LOCK_EXPIRED') {
    const newLock = await cartService.lockFxRate(cart.id);
    const checkout = await cartService.initiateCheckout(cart.id);
  }
}
```

---

## Error Codes

| Code | HTTP | Description | Recovery |
|------|------|-------------|----------|
| `CART_NOT_FOUND` | 404 | Cart does not exist or has been deleted | Create a new cart |
| `CART_EXPIRED` | 410 | Cart TTL has elapsed | Create a new cart; items may be re-added |
| `CART_LOCKED` | 423 | Cart is in `checking_out` state and cannot be modified | Cancel checkout first or wait for timeout |
| `CART_EMPTY` | 422 | Attempted checkout on an empty cart | Add items before checkout |
| `CART_VERSION_CONFLICT` | 409 | Optimistic concurrency conflict — cart was modified concurrently | Re-fetch cart and retry operation |
| `ITEM_NOT_FOUND` | 404 | Line item does not exist in the cart | Verify item ID |
| `ITEM_OUT_OF_STOCK` | 422 | Product is out of stock; cannot be added or reserved | Remove item or wait for restock |
| `ITEM_QUANTITY_EXCEEDED` | 422 | Requested quantity exceeds per-customer or per-order max | Reduce quantity to allowed maximum |
| `ITEM_NOT_AVAILABLE` | 422 | Product is discontinued, unpublished, or restricted | Remove item from cart |
| `ITEM_PRICE_CHANGED` | 409 | Product price changed since added to cart | Acknowledge change and re-confirm |
| `COUPON_INVALID` | 422 | Coupon code does not exist or is not recognized | Verify coupon code spelling |
| `COUPON_EXPIRED` | 422 | Coupon has passed its expiration date | Use a different coupon |
| `COUPON_USAGE_LIMIT` | 422 | Coupon has reached its total usage limit | Coupon is no longer available |
| `COUPON_USER_LIMIT` | 422 | User has reached their per-user limit for this coupon | Cannot reuse this coupon |
| `COUPON_NOT_STACKABLE` | 422 | Coupon cannot be combined with already-applied coupons | Remove existing coupon first |
| `COUPON_MINIMUM_NOT_MET` | 422 | Cart subtotal does not meet coupon's minimum requirement | Add more items to meet minimum |
| `COUPON_PRODUCT_EXCLUSION` | 422 | Coupon does not apply to the items in the cart | Add eligible products |
| `COUPON_MAX_REACHED` | 422 | Maximum number of coupons already applied | Remove a coupon before adding another |
| `PRICING_CALCULATION_ERROR` | 500 | Internal error during pricing pipeline execution | Retry; if persistent, contact support |
| `TAX_CALCULATION_ERROR` | 502 | External tax provider returned an error | Retry; tax may be estimated |
| `SHIPPING_ESTIMATION_ERROR` | 502 | Shipping carrier API returned an error | Retry or select a different method |
| `CURRENCY_NOT_SUPPORTED` | 422 | Requested currency is not enabled for this venture | Select a supported currency |
| `FX_RATE_LOCK_EXPIRED` | 422 | FX rate lock expired before checkout completion | Re-lock the FX rate |
| `FX_RATE_UNAVAILABLE` | 502 | Unable to fetch current FX rates from provider | Retry or use default currency |
| `CART_RULE_VIOLATION` | 422 | One or more cart rules block the requested operation | Address violations (see `violations` array) |
| `GEO_RESTRICTION` | 403 | Product or operation is restricted in customer's region | Remove restricted items or change address |
| `MAX_ITEMS_EXCEEDED` | 422 | Cart has reached the maximum number of line items | Remove items before adding more |
| `MIN_ORDER_VALUE` | 422 | Cart value is below venture's minimum order threshold | Add more items to meet minimum |
| `RESERVATION_FAILED` | 422 | Unable to create inventory reservation | Reduce quantity or try again later |
| `RESERVATION_EXPIRED` | 422 | Inventory reservation expired — stock was released | Re-add item to create new reservation |
| `CART_MERGE_CONFLICT` | 409 | Unresolvable conflict during merge (manual strategy) | Resolve via merge resolution API |
| `CHECKOUT_TRANSITION_ERROR` | 500 | Internal error during cart-to-checkout transition | Retry; if persistent, contact support |
| `RATE_LIMIT_EXCEEDED` | 429 | Too many cart operations in a short period | Wait and retry with exponential backoff |

### Error Response Format

```typescript
interface CartErrorResponse {
  error: {
    code: CartErrorCode;
    message: string;
    details?: Record<string, unknown>;
    violations?: CartRuleEvaluation[];
    affectedItems?: string[];
    retryable: boolean;
    retryAfterMs?: number;
  };
  requestId: string;
  timestamp: string;
}

// Example:
// {
//   "error": {
//     "code": "COUPON_MINIMUM_NOT_MET",
//     "message": "Coupon SUMMER15 requires minimum order of $50.00. Cart subtotal: $37.40.",
//     "details": {
//       "couponCode": "SUMMER15",
//       "minimumRequired": 5000,
//       "currentSubtotal": 3740,
//       "shortfall": 1260
//     },
//     "retryable": false
//   },
//   "requestId": "req_01936f8e...",
//   "timestamp": "2025-07-15T14:33:00Z"
// }
```

---

## Security

### Cart Isolation (Multi-Tenant)

All cart data is isolated per venture through Supabase Row-Level Security (RLS) policies. Every table in the cart module includes a `venture_id` column that is enforced at the database level:

```sql
-- Applied to ALL cart tables
CREATE POLICY tenant_isolation ON commerce_carts
  AS RESTRICTIVE
  FOR ALL
  USING (venture_id = current_setting('app.venture_id')::uuid)
  WITH CHECK (venture_id = current_setting('app.venture_id')::uuid);
```

**Key security properties:**

- **Venture isolation:** A venture can never read, write, or modify another venture's cart data, even through SQL injection or application bugs. RLS is enforced at the PostgreSQL level.
- **User isolation:** Within a venture, carts are isolated to their owner. Authenticated carts require `userId` match; anonymous carts require `sessionId` match. The application layer enforces this through middleware.
- **Session binding:** Anonymous carts are bound to a session ID that is cryptographically tied to the user's browser session (signed JWT in `HttpOnly` cookie). Session IDs cannot be guessed or enumerated.
- **Cart access control:** Cart read/write operations validate ownership before proceeding. Admin-level cart access (for support agents) requires explicit `cart:admin` permission and generates audit log entries.

```typescript
// Ownership validation middleware
async function validateCartOwnership(
  cartId: string,
  ctx: RequestContext,
): Promise<void> {
  const cart = await cartRepo.findById(cartId);

  if (!cart) throw new CartNotFoundError(cartId);

  const isOwner = cart.owner.userId
    ? cart.owner.userId === ctx.userId
    : cart.owner.sessionId === ctx.sessionId;

  const isAdmin = ctx.permissions.includes('cart:admin');

  if (!isOwner && !isAdmin) {
    throw new CartNotFoundError(cartId); // Intentionally 404, not 403
  }

  if (isAdmin && !isOwner) {
    await auditLog.record({
      action: 'cart_admin_access',
      actorId: ctx.userId,
      cartId,
      cartOwnerId: cart.owner.userId,
      ventureId: ctx.ventureId,
    });
  }
}
```

### Coupon Fraud Prevention

The coupon system implements multiple layers of fraud prevention:

| Measure | Description |
|---------|-------------|
| **Per-user limits** | Each coupon tracks usage per `userId` and per `email` to prevent reuse across accounts |
| **Per-session limits** | Anonymous coupons are tracked by `sessionId` + `ipAddress` fingerprint |
| **Velocity detection** | Rapid coupon application attempts (>5 in 60s) trigger rate limiting |
| **Code enumeration prevention** | Invalid codes return the same error regardless of whether the code exists, is expired, or is restricted |
| **Abuse pattern detection** | Flags accounts that consistently create carts with high-value coupons then abandon |
| **IP-based limiting** | Maximum 10 unique coupon applications per IP per hour |
| **Device fingerprinting** | Optional integration with device fingerprinting to detect multi-account abuse |
| **Code entropy** | Generated codes use cryptographically random strings (min 8 chars, alphanumeric) to prevent brute-force |

```typescript
// Coupon fraud detection pipeline
async function validateCouponApplication(
  coupon: Coupon,
  cart: Cart,
  ctx: RequestContext,
): Promise<void> {
  // 1. Rate limiting
  const recentAttempts = await rateLimiter.count(
    `coupon:apply:${ctx.ipAddress}`,
    { windowMs: 60_000 },
  );
  if (recentAttempts > 5) {
    throw new RateLimitExceededError('Too many coupon attempts');
  }

  // 2. Per-user usage check
  if (coupon.usageLimitPerUser && ctx.userId) {
    const userUsage = await couponRepo.countUserUsage(coupon.id, ctx.userId);
    if (userUsage >= coupon.usageLimitPerUser) {
      throw new CouponUserLimitError(coupon.code);
    }
  }

  // 3. Per-email usage check (catches multi-account abuse)
  if (coupon.usageLimitPerUser && cart.owner.email) {
    const emailUsage = await couponRepo.countEmailUsage(coupon.id, cart.owner.email);
    if (emailUsage >= coupon.usageLimitPerUser) {
      throw new CouponUserLimitError(coupon.code);
    }
  }

  // 4. IP-based hourly limit
  const ipUsage = await rateLimiter.count(
    `coupon:ip:${ctx.ipAddress}`,
    { windowMs: 3_600_000 },
  );
  if (ipUsage > 10) {
    throw new RateLimitExceededError('Too many coupon applications from this address');
  }

  // 5. Abuse pattern detection
  const abuseScore = await fraudDetector.scoreCouponApplication({
    userId: ctx.userId,
    ipAddress: ctx.ipAddress,
    sessionId: ctx.sessionId,
    couponValue: coupon.value,
    cartValue: cart.summary.subtotal,
    couponCode: coupon.code,
  });

  if (abuseScore > 0.85) {
    await alertService.notify('coupon_abuse_detected', {
      userId: ctx.userId,
      couponCode: coupon.code,
      abuseScore,
    });
    // Don't throw — flag for review but allow the operation
    // to avoid false-positive customer friction
  }
}
```

### Rate Limiting

Cart operations are rate-limited to prevent abuse, bot attacks, and accidental infinite loops:

| Operation | Limit | Window | Scope |
|-----------|-------|--------|-------|
| `create` | 5 | 1 minute | Per IP |
| `addItem` | 30 | 1 minute | Per cart |
| `removeItem` | 30 | 1 minute | Per cart |
| `updateItem` | 30 | 1 minute | Per cart |
| `applyCoupon` | 5 | 1 minute | Per cart |
| `applyCoupon` | 10 | 1 hour | Per IP |
| `getCart` | 120 | 1 minute | Per cart |
| `initiateCheckout` | 3 | 5 minutes | Per cart |
| `mergeCarts` | 3 | 5 minutes | Per user |
| All mutations | 100 | 1 minute | Per session |

Rate limiting is implemented via Redis sliding window counters:

```typescript
const CART_RATE_LIMITS: Record<string, RateLimitConfig> = {
  'cart:create':      { limit: 5,   windowMs: 60_000,   scope: 'ip' },
  'cart:addItem':     { limit: 30,  windowMs: 60_000,   scope: 'cart' },
  'cart:applyCoupon': { limit: 5,   windowMs: 60_000,   scope: 'cart' },
  'cart:checkout':    { limit: 3,   windowMs: 300_000,  scope: 'cart' },
  'cart:mutations':   { limit: 100, windowMs: 60_000,   scope: 'session' },
};
```

### Data Protection

- **PII handling:** Cart data may contain emails, shipping addresses, and IP addresses. These are encrypted at rest via Supabase column-level encryption for `email`, `shipping_address`, and `ip_address` columns.
- **Cart expiry:** Expired carts are soft-deleted after 30 days and hard-deleted after 90 days, in compliance with data retention policies.
- **Pricing snapshots:** Retained for 1 year for audit and dispute resolution, then anonymized (PII stripped).
- **Event data:** Cart events in Redpanda are retained per venture's configured retention policy (default: 30 days raw, 1 year aggregated).
- **GDPR/CCPA:** The `CartService.deleteUserData(userId)` method permanently removes all cart data for a user, including pricing snapshots and abandoned cart events, for right-to-deletion compliance.

---

## Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `CART_DATABASE_URL` | Yes | — | Supabase PostgreSQL connection string |
| `CART_REDIS_URL` | Yes | — | Redis connection string for cart caching |
| `CART_REDPANDA_BROKERS` | Yes | — | Comma-separated Redpanda broker addresses |
| `CART_REDPANDA_TOPIC_PREFIX` | No | `commerce.cart` | Prefix for Redpanda event topics |
| `CART_DEFAULT_TTL_HOURS` | No | `168` (7 days) | Default cart TTL in hours |
| `CART_ABANDONED_THRESHOLD_HOURS` | No | `1` | Hours of inactivity before cart is abandoned |
| `CART_MAX_ITEMS` | No | `100` | Maximum line items per cart |
| `CART_MAX_COUPONS` | No | `5` | Maximum coupons per cart |
| `CART_RESERVATION_HOLD_MINUTES` | No | `30` | Duration of soft inventory hold |
| `CART_RESERVATION_MAX_EXTENSIONS` | No | `3` | Maximum reservation extensions |
| `CART_FX_RATE_LOCK_MINUTES` | No | `30` | Duration of FX rate lock |
| `CART_CACHE_TTL_SECONDS` | No | `300` (5 min) | Redis cache TTL for cart objects |
| `CART_PRICING_PRECISION` | No | `2` | Decimal places for rounding (currency-aware) |
| `CART_RECOVERY_MAX_ATTEMPTS` | No | `3` | Maximum abandoned cart recovery attempts |
| `CART_RECOVERY_FIRST_DELAY_MIN` | No | `30` | Minutes before first recovery attempt |
| `TAX_PROVIDER` | No | `internal` | Tax provider: `avalara`, `taxjar`, or `internal` |
| `TAX_AVALARA_ACCOUNT_ID` | Cond. | — | Avalara account ID (if `TAX_PROVIDER=avalara`) |
| `TAX_AVALARA_LICENSE_KEY` | Cond. | — | Avalara license key |
| `TAX_AVALARA_ENVIRONMENT` | No | `sandbox` | Avalara environment: `sandbox` or `production` |
| `TAX_TAXJAR_API_KEY` | Cond. | — | TaxJar API key (if `TAX_PROVIDER=taxjar`) |
| `SHIPPING_RATE_CACHE_TTL_SECONDS` | No | `900` (15 min) | Cache TTL for shipping rate responses |
| `FX_RATE_PROVIDER` | No | `ecb` | FX provider: `ecb`, `openexchangerates`, `currencylayer` |
| `FX_RATE_REFRESH_INTERVAL_SECONDS` | No | `3600` (1 hr) | How often to refresh cached FX rates |
| `FX_OPENEXCHANGERATES_APP_ID` | Cond. | — | OpenExchangeRates app ID (if using that provider) |
| `CART_RATE_LIMIT_ENABLED` | No | `true` | Enable/disable rate limiting |
| `CART_FRAUD_DETECTION_ENABLED` | No | `true` | Enable/disable coupon fraud detection |
| `CART_ENCRYPTION_KEY` | Yes | — | AES-256 key for encrypting PII columns |

---

## Dependencies

### Internal (MCV Platform)

| Package | Purpose |
|---------|---------|
| `@mcv/core/context` | Request context, tenant resolution, auth |
| `@mcv/core/errors` | Base error classes, error handling patterns |
| `@mcv/core/events` | Redpanda event bus abstraction |
| `@mcv/core/cache` | Redis cache abstraction |
| `@mcv/core/db` | Drizzle ORM setup, connection pooling, RLS context |
| `@mcv/core/logging` | Structured logging (Pino) |
| `@mcv/core/validation` | Zod schema utilities |
| `@mcv/core/rate-limit` | Redis-based rate limiting |
| `@mcv/core/crypto` | Encryption utilities for PII |
| `@mcv/commerce/catalog` | Product/variant lookup, pricing tiers |
| `@mcv/commerce/inventory` | Inventory levels, reservation coordination |
| `@mcv/commerce/promotions` | Promotion rules, active promotions lookup |
| `@mcv/notifications` | Email/push notification dispatch for recovery |

### External (NPM)

| Package | Version | Purpose |
|---------|---------|---------|
| `drizzle-orm` | `^0.34.x` | Type-safe SQL ORM |
| `zod` | `^3.23.x` | Runtime schema validation |
| `ioredis` | `^5.4.x` | Redis client for caching and rate limiting |
| `@trpc/server` | `^11.x` | Type-safe API layer |
| `decimal.js` | `^10.4.x` | Arbitrary-precision decimal arithmetic for pricing |
| `currency.js` | `^2.0.x` | Currency formatting and rounding |
| `uuid` | `^10.x` | UUIDv7 generation for time-ordered IDs |
| `murmurhash` | `^2.0.x` | Fast hashing for pricing snapshot fingerprints |
| `node-cron` | `^3.0.x` | Scheduled job for abandoned cart detection |
| `pino` | `^9.x` | Structured logging |

### External Services (APIs)

| Service | Purpose | Required |
|---------|---------|----------|
| Avalara AvaTax | Tax calculation and compliance | Optional (`TAX_PROVIDER=avalara`) |
| TaxJar | Tax calculation and reporting | Optional (`TAX_PROVIDER=taxjar`) |
| ECB Exchange Rates | Free FX rates (daily refresh) | Default FX provider |
| OpenExchangeRates | Real-time FX rates | Optional (`FX_RATE_PROVIDER=openexchangerates`) |
| Carrier APIs | Real-time shipping rate estimation | Configured per venture |

---

## Testing

### Unit Tests

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createCartService } from '../services/cart.service.factory';
import { createMockDb, createMockRedis, createMockEventBus } from '@mcv/testing';

describe('CartService', () => {
  let cartService: CartService;
  let mockDb: MockDb;
  let mockRedis: MockRedis;

  beforeEach(() => {
    mockDb = createMockDb();
    mockRedis = createMockRedis();
    cartService = createCartService({
      db: mockDb,
      redis: mockRedis,
      eventBus: createMockEventBus(),
      catalogService: createMockCatalogService(),
      inventoryService: createMockInventoryService(),
    });
  });

  describe('create()', () => {
    it('creates an empty cart with correct defaults', async () => {
      const cart = await cartService.create({
        ventureId: 'v1',
        storeId: 's1',
        owner: { sessionId: 'sess1', ipAddress: '127.0.0.1' },
      });

      expect(cart.status).toBe('empty');
      expect(cart.type).toBe('standard');
      expect(cart.items).toHaveLength(0);
      expect(cart.summary.grandTotal).toBe(0);
      expect(cart.currency.displayCurrency).toBe('USD');
    });

    it('sets TTL based on environment config', async () => {
      const cart = await cartService.create({
        ventureId: 'v1',
        storeId: 's1',
        owner: { sessionId: 'sess1', ipAddress: '127.0.0.1' },
      });

      const ttlHours = 168;
      const expectedExpiry = new Date(Date.now() + ttlHours * 60 * 60 * 1000);
      expect(new Date(cart.expiresAt).getTime())
        .toBeCloseTo(expectedExpiry.getTime(), -3);
    });

    it('detects country from IP address', async () => {
      const cart = await cartService.create({
        ventureId: 'v1',
        storeId: 's1',
        owner: { sessionId: 'sess1', ipAddress: '203.0.113.42' },
      });

      expect(cart.owner.countryCode).toBe('CA');
    });
  });

  describe('addItem()', () => {
    it('adds item and transitions cart to active', async () => {
      const cart = await cartService.create({
        ventureId: 'v1', storeId: 's1',
        owner: { sessionId: 'sess1', ipAddress: '127.0.0.1' },
      });
      const updated = await cartService.addItem(cart.id, {
        productId: 'p1',
        quantity: 1,
      });

      expect(updated.status).toBe('active');
      expect(updated.items).toHaveLength(1);
      expect(updated.items[0].quantity).toBe(1);
    });

    it('increments quantity for duplicate product+variant', async () => {
      const cart = await cartService.create({
        ventureId: 'v1', storeId: 's1',
        owner: { sessionId: 'sess1', ipAddress: '127.0.0.1' },
      });
      await cartService.addItem(cart.id, { productId: 'p1', quantity: 2 });
      const updated = await cartService.addItem(cart.id, {
        productId: 'p1',
        quantity: 3,
      });

      expect(updated.items).toHaveLength(1);
      expect(updated.items[0].quantity).toBe(5);
    });

    it('throws ITEM_QUANTITY_EXCEEDED for over-limit', async () => {
      const cart = await cartService.create({
        ventureId: 'v1', storeId: 's1',
        owner: { sessionId: 'sess1', ipAddress: '127.0.0.1' },
      });

      await expect(
        cartService.addItem(cart.id, { productId: 'limited_p1', quantity: 100 }),
      ).rejects.toThrow(ItemQuantityExceededError);
    });

    it('creates a soft inventory reservation', async () => {
      const cart = await cartService.create({
        ventureId: 'v1', storeId: 's1',
        owner: { sessionId: 'sess1', ipAddress: '127.0.0.1' },
      });
      const updated = await cartService.addItem(cart.id, {
        productId: 'p1',
        quantity: 2,
      });

      expect(updated.items[0].reservation).not.toBeNull();
      expect(updated.items[0].reservation!.type).toBe('soft');
      expect(updated.items[0].reservation!.quantity).toBe(2);
    });

    it('triggers pricing recalculation', async () => {
      const cart = await cartService.create({
        ventureId: 'v1', storeId: 's1',
        owner: { sessionId: 'sess1', ipAddress: '127.0.0.1' },
      });
      const updated = await cartService.addItem(cart.id, {
        productId: 'p1',
        quantity: 1,
      });

      expect(updated.summary.subtotal).toBeGreaterThan(0);
      expect(updated.summary.calculatedAt).toBeDefined();
    });
  });

  describe('applyCoupon()', () => {
    it('applies a valid percentage coupon', async () => {
      const cart = await createCartWithItems(cartService, 10000);
      const updated = await cartService.applyCoupon(cart.id, 'SAVE10');

      expect(updated.coupons).toHaveLength(1);
      expect(updated.summary.totalDiscounts).toBe(1000); // 10% of $100
    });

    it('rejects expired coupons', async () => {
      const cart = await createCartWithItems(cartService, 10000);

      await expect(
        cartService.applyCoupon(cart.id, 'EXPIRED2024'),
      ).rejects.toThrow(CouponExpiredError);
    });

    it('enforces stacking rules', async () => {
      const cart = await createCartWithItems(cartService, 10000);
      await cartService.applyCoupon(cart.id, 'EXCLUSIVE20');

      await expect(
        cartService.applyCoupon(cart.id, 'ANOTHER10'),
      ).rejects.toThrow(CouponNotStackableError);
    });
  });
});

describe('PricingEngine', () => {
  describe('calculate()', () => {
    it('applies tiered pricing for gold-tier customers', async () => {
      const result = await pricingEngine.calculate(cart, {
        ...defaultContext,
        customerTier: 'gold',
      });

      const bd = result.itemBreakdowns.get(cart.items[0].id)!;
      expect(bd.tieredPrice).toBeLessThan(bd.catalogPrice);
    });

    it('applies volume discounts for 3+ units', async () => {
      cart.items[0].quantity = 5;
      const result = await pricingEngine.calculate(cart, defaultContext);

      const bd = result.itemBreakdowns.get(cart.items[0].id)!;
      expect(bd.volumeDiscount).toBeGreaterThan(0);
    });

    it('calculates tax correctly for Ontario HST', async () => {
      const result = await pricingEngine.calculate(cart, {
        ...defaultContext,
        shippingAddress: ontarioAddress,
        includeTax: true,
      });

      expect(result.summary.taxCalculated).toBe(true);
      expect(result.summary.taxBreakdown).toHaveLength(2); // GST + PST
      const totalRate = result.summary.taxBreakdown
        .reduce((sum, t) => sum + t.rate, 0);
      expect(totalRate).toBeCloseTo(0.13);
    });

    it('persists pricing snapshot for audit', async () => {
      const result = await pricingEngine.calculate(cart, defaultContext);

      expect(result.snapshotId).toBeDefined();
      const snapshot = await pricingSnapshotRepo.findById(result.snapshotId);
      expect(snapshot).not.toBeNull();
      expect(snapshot!.pricingHash).toBe(result.summary.pricingHash);
    });

    it('is deterministic — same inputs produce same outputs', async () => {
      const result1 = await pricingEngine.calculate(cart, defaultContext);
      const result2 = await pricingEngine.calculate(cart, defaultContext);

      expect(result1.summary.grandTotal).toBe(result2.summary.grandTotal);
      expect(result1.summary.pricingHash).toBe(result2.summary.pricingHash);
    });
  });
});
```

### Integration Tests

```typescript
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { setupTestDatabase, teardownTestDatabase } from '@mcv/testing/db';
import { setupTestRedis, teardownTestRedis } from '@mcv/testing/redis';

describe('Cart Module Integration', () => {
  let db: TestDatabase;
  let redis: TestRedis;
  let cartService: CartService;

  beforeAll(async () => {
    db = await setupTestDatabase({ migrate: true, seed: true });
    redis = await setupTestRedis();
    cartService = createCartService({ db, redis, /* ... */ });
  });

  afterAll(async () => {
    await teardownTestDatabase(db);
    await teardownTestRedis(redis);
  });

  it('full lifecycle: create → add → coupon → checkout → convert', async () => {
    // 1. Create cart
    const cart = await cartService.create({
      ventureId: testVenture.id,
      storeId: testStore.id,
      owner: { sessionId: 'integration-test', ipAddress: '127.0.0.1' },
    });

    // 2. Add items
    let updated = await cartService.addItem(cart.id, {
      productId: testProduct.id,
      quantity: 2,
    });
    expect(updated.status).toBe('active');
    expect(updated.summary.itemCount).toBe(2);

    // 3. Apply coupon
    updated = await cartService.applyCoupon(cart.id, 'TESTCOUPON10');
    expect(updated.coupons).toHaveLength(1);
    expect(updated.summary.totalDiscounts).toBeGreaterThan(0);

    // 4. Set shipping
    updated = await cartService.setShippingAddress(cart.id, testAddress);
    expect(updated.summary.taxCalculated).toBe(true);

    // 5. Initiate checkout
    const checkout = await cartService.initiateCheckout(cart.id);
    expect(checkout.cart.status).toBe('checking_out');
    expect(checkout.pricingSnapshot).toBeDefined();

    // 6. Convert
    await cartService.markConverted(cart.id, 'test-order-id');
    const converted = await cartService.get(cart.id);
    expect(converted!.status).toBe('converted');
  });

  it('cart merge preserves coupons and resolves conflicts', async () => {
    // Create anonymous cart with items + coupon
    const anonCart = await cartService.create({
      ventureId: testVenture.id, storeId: testStore.id,
      owner: { sessionId: 'anon-sess', ipAddress: '127.0.0.1' },
    });
    await cartService.addItem(anonCart.id, { productId: 'p1', quantity: 2 });
    await cartService.applyCoupon(anonCart.id, 'SAVE10');

    // Create authenticated cart with overlapping item
    const authCart = await cartService.create({
      ventureId: testVenture.id, storeId: testStore.id,
      owner: { userId: 'u1', sessionId: 'auth-sess', ipAddress: '127.0.0.1' },
    });
    await cartService.addItem(authCart.id, { productId: 'p1', quantity: 1 });

    // Merge
    const result = await cartService.mergeCarts(
      anonCart.id, 'u1', 'sum_quantities',
    );

    expect(result.mergedCart.items[0].quantity).toBe(3); // 2 + 1
    expect(result.transferredCoupons).toHaveLength(1);
    expect(result.transferredCoupons[0].code).toBe('SAVE10');
  });

  it('enforces RLS — venture A cannot access venture B carts', async () => {
    const cartA = await withVenture('venture_a', () =>
      cartService.create({
        ventureId: 'venture_a', storeId: 's1',
        owner: { sessionId: 'rls-test', ipAddress: '127.0.0.1' },
      }),
    );

    const cartFromB = await withVenture('venture_b', () =>
      cartService.get(cartA.id),
    );

    expect(cartFromB).toBeNull(); // RLS blocks access
  });

  it('handles concurrent modifications with optimistic locking', async () => {
    const cart = await cartService.create({
      ventureId: testVenture.id, storeId: testStore.id,
      owner: { sessionId: 'concurrency-test', ipAddress: '127.0.0.1' },
    });
    const withItem = await cartService.addItem(cart.id, {
      productId: 'p1', quantity: 1,
    });

    // Simulate concurrent updates
    const [result1, result2] = await Promise.allSettled([
      cartService.updateItem(cart.id, {
        itemId: withItem.items[0].id, quantity: 5,
      }),
      cartService.updateItem(cart.id, {
        itemId: withItem.items[0].id, quantity: 3,
      }),
    ]);

    const successes = [result1, result2].filter(r => r.status === 'fulfilled');
    const failures = [result1, result2].filter(r => r.status === 'rejected');

    expect(successes).toHaveLength(1);
    expect(failures).toHaveLength(1);
    expect(
      (failures[0] as PromiseRejectedResult).reason.code,
    ).toBe('CART_VERSION_CONFLICT');
  });
});
```

### Load Tests

```typescript
// k6 load test configuration
import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '2m', target: 100 },    // Ramp to 100 VUs
    { duration: '5m', target: 100 },    // Hold
    { duration: '2m', target: 500 },    // Ramp to 500 VUs
    { duration: '5m', target: 500 },    // Hold
    { duration: '2m', target: 0 },      // Ramp down
  ],
  thresholds: {
    'http_req_duration{operation:create_cart}':   ['p95<200'],
    'http_req_duration{operation:add_item}':      ['p95<300'],
    'http_req_duration{operation:apply_coupon}':  ['p95<250'],
    'http_req_duration{operation:get_cart}':      ['p95<100'],
    'http_req_duration{operation:checkout}':      ['p95<500'],
    'http_req_failed':                            ['rate<0.01'],
  },
};

export default function () {
  // 1. Create cart
  const createRes = http.post(
    `${BASE_URL}/cart`,
    JSON.stringify({
      ventureId: VENTURE_ID,
      storeId: STORE_ID,
      owner: {
        sessionId: `k6-${__VU}-${__ITER}`,
        ipAddress: '10.0.0.1',
      },
    }),
    { tags: { operation: 'create_cart' } },
  );
  check(createRes, { 'cart created': (r) => r.status === 201 });
  const cartId = createRes.json('id');

  // 2. Add items (3 items)
  for (let i = 0; i < 3; i++) {
    const addRes = http.post(
      `${BASE_URL}/cart/${cartId}/items`,
      JSON.stringify({
        productId: SAMPLE_PRODUCTS[i],
        quantity: Math.floor(Math.random() * 5) + 1,
      }),
      { tags: { operation: 'add_item' } },
    );
    check(addRes, { 'item added': (r) => r.status === 200 });
  }

  // 3. Apply coupon (50% of VUs)
  if (Math.random() > 0.5) {
    const couponRes = http.post(
      `${BASE_URL}/cart/${cartId}/coupons`,
      JSON.stringify({ code: 'LOADTEST10' }),
      { tags: { operation: 'apply_coupon' } },
    );
    check(couponRes, {
      'coupon applied': (r) => r.status === 200 || r.status === 422,
    });
  }

  // 4. Read cart (read-heavy)
  for (let i = 0; i < 5; i++) {
    const getRes = http.get(
      `${BASE_URL}/cart/${cartId}`,
      { tags: { operation: 'get_cart' } },
    );
    check(getRes, { 'cart retrieved': (r) => r.status === 200 });
    sleep(0.5);
  }

  // 5. Checkout (20% conversion rate)
  if (Math.random() > 0.8) {
    const checkoutRes = http.post(
      `${BASE_URL}/cart/${cartId}/checkout`,
      null,
      { tags: { operation: 'checkout' } },
    );
    check(checkoutRes, {
      'checkout initiated': (r) => r.status === 200,
    });
  }

  sleep(1);
}
```

### Test Coverage Requirements

| Area | Minimum Coverage | Notes |
|------|-----------------|-------|
| CartService | 95% | Critical business logic |
| PricingEngine | 98% | Financial calculations must be exhaustively tested |
| CouponService | 95% | Fraud prevention paths must be covered |
| CartRulesEngine | 90% | Rule evaluation logic |
| CartMergeService | 90% | Conflict resolution paths |
| AbandonedCartService | 85% | Detection and recovery workflows |
| ReservationService | 90% | Inventory hold lifecycle |
| CurrencyService | 90% | FX calculations and rounding |
| tRPC Router | 85% | Input validation and authorization |
| Database Schemas | 80% | Migration and RLS policy verification |

---

*Last updated: 2025-07-15 — @mcv/commerce/cart v0.1.0*