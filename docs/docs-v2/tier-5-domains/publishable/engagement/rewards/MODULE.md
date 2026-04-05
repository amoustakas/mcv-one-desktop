# @mcv/engagement/rewards

> **Rewards Catalog & Fulfillment** — Manage reward catalogs, redemption workflows, inventory, and multi-channel fulfillment across all MCV.ONE ventures.

**Package:** `@mcv/engagement/rewards`
**Layer:** Tier 5 — Domain Module (Engagement)
**Status:** Stable
**Since:** 0.12.0
**Maintainer:** MCV Platform Team
**License:** PROPRIETARY

---

## Table of Contents

- [Purpose](#purpose)
- [Exports](#exports)
- [Architecture](#architecture)
  - [Redemption Flow](#redemption-flow)
  - [Fulfillment Pipeline](#fulfillment-pipeline)
  - [Catalog Resolution](#catalog-resolution)
- [Core Interfaces](#core-interfaces)
  - [Reward](#reward)
  - [RewardCategory](#rewardcategory)
  - [RewardType & RewardSubtype](#rewardtype--rewardsubtype)
  - [Redemption](#redemption)
  - [RedemptionCart](#redemptioncart)
  - [RewardInventory](#rewardinventory)
  - [FulfillmentJob](#fulfillmentjob)
  - [RewardTier](#rewardtier)
  - [PartnerReward](#partnerreward)
  - [RewardPricing](#rewardpricing)
  - [RewardFavorite](#rewardfavorite)
  - [RewardRecommendation](#rewardrecommendation)
  - [RewardAnalytics](#rewardanalytics)
  - [RewardService](#rewardservice)
- [Database Schemas](#database-schemas)
  - [rewards](#rewards-table)
  - [reward_categories](#reward_categories-table)
  - [redemptions](#redemptions-table)
  - [reward_inventory](#reward_inventory-table)
  - [fulfillment_jobs](#fulfillment_jobs-table)
  - [reward_tiers](#reward_tiers-table)
  - [partner_rewards](#partner_rewards-table)
  - [reward_favorites](#reward_favorites-table)
  - [reward_recommendations](#reward_recommendations-table)
  - [reward_pricing_rules](#reward_pricing_rules-table)
  - [reward_waitlists](#reward_waitlists-table)
  - [reward_bundles](#reward_bundles-table)
- [Code Examples](#code-examples)
  - [1. Browse the Reward Catalog](#1-browse-the-reward-catalog)
  - [2. Redeem a Single Reward](#2-redeem-a-single-reward)
  - [3. Cart-Based Multi-Reward Redemption](#3-cart-based-multi-reward-redemption)
  - [4. Manage Reward Inventory](#4-manage-reward-inventory)
  - [5. Configure Tier-Gated Rewards](#5-configure-tier-gated-rewards)
  - [6. Flash Sale Pricing](#6-flash-sale-pricing)
  - [7. Partner Reward Integration](#7-partner-reward-integration)
  - [8. Reward Analytics Dashboard](#8-reward-analytics-dashboard)
- [Error Codes](#error-codes)
- [Security](#security)
  - [Row-Level Security](#row-level-security)
  - [Redemption Security](#redemption-security)
  - [Fulfillment Security](#fulfillment-security)
  - [Partner Security](#partner-security)
- [Environment Variables](#environment-variables)
- [Dependencies](#dependencies)
- [Testing](#testing)
  - [Unit Tests](#unit-tests)
  - [Integration Tests](#integration-tests)
  - [Fulfillment Tests](#fulfillment-tests)
  - [Load & Stress Tests](#load--stress-tests)

---

## Purpose

The `@mcv/engagement/rewards` module is the **reward catalog and fulfillment engine** for the MCV.ONE loyalty and engagement platform. It answers the fundamental question every loyalty program must solve: *"What can I spend my points on, and how do I get it?"*

### What It Does

1. **Reward Catalog Management** — Maintains a browseable, searchable, filterable catalog of rewards organized by categories, types, and venture. Supports featured rewards, new arrivals, trending picks, and personalized recommendations.

2. **Multi-Type Rewards** — Handles digital rewards (coupon codes, in-app items, premium subscriptions, downloadable content), physical rewards (merchandise, gift cards shipped to the member), experiential rewards (event access, VIP experiences, meet-and-greets), and token-based rewards (EDGE token grants, crypto conversions).

3. **Redemption Workflows** — Orchestrates the complete point-to-reward lifecycle: eligibility verification → point balance check → inventory reservation → point deduction → fulfillment trigger → delivery confirmation. Supports both single-item and cart-based multi-reward redemptions.

4. **Inventory Management** — Tracks reward stock levels with support for unlimited supply (digital codes generated on-demand), limited editions (countdown + urgency), pre-orders, waitlists for out-of-stock items, and automatic low-stock alerts for catalog managers.

5. **Fulfillment Pipeline** — Event-driven fulfillment system that routes rewards to the appropriate delivery mechanism: instant digital delivery (email/in-app), physical shipping (address collection → label generation → tracking), partner API calls (gift card provisioning), or manual fulfillment queues for bespoke rewards.

6. **Tier & Access Gating** — Rewards can be restricted by loyalty tier (Gold, Platinum, Diamond), member level, achievement completion, audience segment, or venture membership. Gates are composable with AND/OR logic.

7. **Dynamic Pricing** — Point costs can be static, demand-based (price increases with redemption velocity), time-limited flash sales, bundle discounts, or multi-currency (different point types accepted).

8. **Partner Ecosystem** — Integrates third-party reward providers (gift card APIs like Tango Card, partner catalogs), manages revenue sharing, and provides a partner portal for catalog contribution and fulfillment tracking.

9. **Personalization** — Favorite rewards, redemption history, re-order shortcuts, and a recommendation engine that suggests rewards based on member behavior, tier, and segment affinity.

10. **Analytics** — Comprehensive metrics covering popular rewards, redemption rates, point sink effectiveness, reward ROI, breakage tracking (points earned but never redeemed), and catalog health monitoring.

### Why It Exists

A loyalty program without compelling rewards is just a scoreboard. This module transforms accumulated points from an abstract number into tangible value — the moment a member redeems points for something they want is the moment the loyalty loop closes. `@mcv/engagement/rewards` ensures that moment is seamless, reliable, and delightful.

### Design Philosophy

- **Catalog-first UX** — Rewards are browseable like a storefront; discovery drives engagement
- **Atomic redemption** — Every redemption is an all-or-nothing transaction; no partial failures
- **Async fulfillment** — Redemption completes instantly; fulfillment happens asynchronously via events
- **Composable gates** — Access restrictions are declarative rules, not hardcoded conditions
- **Venture isolation** — Each venture has its own catalog slice with shared infrastructure
- **Fail-safe inventory** — Optimistic locking prevents overselling; waitlists handle overflow gracefully

---

## Exports

```typescript
// === Core Service ===
export { RewardService }              from './services/reward.service';
export { RewardCatalogService }       from './services/catalog.service';
export { RedemptionService }          from './services/redemption.service';
export { FulfillmentService }         from './services/fulfillment.service';
export { RewardInventoryService }     from './services/inventory.service';
export { RewardPricingService }       from './services/pricing.service';
export { PartnerRewardService }       from './services/partner-reward.service';
export { RewardRecommendationService } from './services/recommendation.service';
export { RewardAnalyticsService }     from './services/analytics.service';

// === tRPC Router ===
export { rewardsRouter }              from './router';
export type { RewardsRouter }         from './router';

// === Types & Interfaces ===
export type {
  Reward,
  RewardCreate,
  RewardUpdate,
  RewardCategory,
  RewardCategoryCreate,
  RewardType,
  RewardSubtype,
  RewardStatus,
  RewardVisibility,
  Redemption,
  RedemptionCreate,
  RedemptionStatus,
  RedemptionCart,
  RedemptionCartItem,
  RewardInventory,
  InventoryAdjustment,
  InventoryAlert,
  FulfillmentJob,
  FulfillmentStatus,
  FulfillmentType,
  FulfillmentResult,
  RewardTier,
  RewardGate,
  GateCondition,
  GateOperator,
  PartnerReward,
  PartnerConfig,
  PartnerFulfillmentRequest,
  PartnerFulfillmentResponse,
  RewardPricing,
  PricingRule,
  FlashSale,
  BundlePricing,
  RewardFavorite,
  RewardRecommendation,
  RecommendationStrategy,
  RewardAnalytics,
  CatalogHealthMetrics,
  RedemptionMetrics,
  BreakageReport,
  RewardROI,
} from './types';

// === Schemas (Drizzle) ===
export {
  rewards,
  rewardCategories,
  redemptions,
  rewardInventory,
  fulfillmentJobs,
  rewardTiers,
  partnerRewards,
  rewardFavorites,
  rewardRecommendations,
  rewardPricingRules,
  rewardWaitlists,
  rewardBundles,
} from './schema';

// === Validators (Zod) ===
export {
  rewardSchema,
  rewardCreateSchema,
  rewardUpdateSchema,
  redemptionCreateSchema,
  redemptionCartSchema,
  inventoryAdjustmentSchema,
  fulfillmentJobSchema,
  rewardTierSchema,
  rewardGateSchema,
  pricingRuleSchema,
  flashSaleSchema,
  partnerRewardSchema,
  catalogQuerySchema,
  analyticsQuerySchema,
} from './validators';

// === Events ===
export {
  REWARD_CREATED,
  REWARD_UPDATED,
  REWARD_ARCHIVED,
  REDEMPTION_INITIATED,
  REDEMPTION_COMPLETED,
  REDEMPTION_FAILED,
  REDEMPTION_REFUNDED,
  FULFILLMENT_STARTED,
  FULFILLMENT_COMPLETED,
  FULFILLMENT_FAILED,
  FULFILLMENT_RETRY,
  INVENTORY_LOW,
  INVENTORY_DEPLETED,
  INVENTORY_RESTOCKED,
  FLASH_SALE_STARTED,
  FLASH_SALE_ENDED,
  WAITLIST_NOTIFIED,
} from './events';

// === Constants ===
export {
  REWARD_TYPES,
  REWARD_SUBTYPES,
  FULFILLMENT_TYPES,
  DEFAULT_LOW_STOCK_THRESHOLD,
  MAX_CART_ITEMS,
  MAX_REDEMPTIONS_PER_HOUR,
  REDEMPTION_LOCK_TTL_MS,
  FULFILLMENT_MAX_RETRIES,
  FULFILLMENT_RETRY_BACKOFF_MS,
} from './constants';

// === Handlers (Redpanda consumers) ===
export { fulfillmentWorker }          from './workers/fulfillment.worker';
export { inventoryAlertWorker }       from './workers/inventory-alert.worker';
export { waitlistNotificationWorker } from './workers/waitlist-notification.worker';
export { analyticsAggregationWorker } from './workers/analytics-aggregation.worker';
```

---

## Architecture

### High-Level Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                        Client Applications                          │
│             (Web App, Mobile App, Partner Portal, Admin)             │
└──────────────┬──────────────────────────────────────┬───────────────┘
               │ tRPC / REST                          │
               ▼                                      ▼
┌──────────────────────────┐         ┌──────────────────────────────┐
│     Catalog Service      │         │     Redemption Service       │
│  ┌────────────────────┐  │         │  ┌────────────────────────┐  │
│  │ Browse / Search    │  │         │  │ Eligibility Check      │  │
│  │ Filter / Sort      │  │         │  │ Balance Verification   │  │
│  │ Recommendations    │  │         │  │ Inventory Reservation  │  │
│  │ Featured / Trending│  │         │  │ Point Deduction        │  │
│  └────────────────────┘  │         │  │ Fulfillment Dispatch   │  │
└──────────┬───────────────┘         │  └────────────────────────┘  │
           │                         └──────────────┬───────────────┘
           │                                        │
           ▼                                        ▼
┌──────────────────────────────────────────────────────────────────┐
│                       Supabase PostgreSQL                        │
│  ┌──────────┐ ┌────────────┐ ┌─────────────┐ ┌───────────────┐  │
│  │ rewards  │ │ redemptions│ │  inventory   │ │fulfillment_   │  │
│  │          │ │            │ │              │ │    jobs        │  │
│  └──────────┘ └────────────┘ └─────────────┘ └───────────────┘  │
│  ┌──────────┐ ┌────────────┐ ┌─────────────┐ ┌───────────────┐  │
│  │categories│ │ reward_    │ │  partner_    │ │  waitlists    │  │
│  │          │ │   tiers    │ │   rewards    │ │               │  │
│  └──────────┘ └────────────┘ └─────────────┘ └───────────────┘  │
│                     Multi-Tenant RLS                             │
└──────────────────────────┬───────────────────────────────────────┘
                           │
                           ▼
┌──────────────────────────────────────────────────────────────────┐
│                     Redpanda Event Bus                           │
│                                                                  │
│  Topics:                                                         │
│  ┌──────────────────┐  ┌──────────────────┐  ┌───────────────┐  │
│  │ rewards.         │  │ rewards.         │  │ rewards.      │  │
│  │  redemptions     │  │  fulfillment     │  │  inventory    │  │
│  └────────┬─────────┘  └────────┬─────────┘  └──────┬────────┘  │
└───────────┼─────────────────────┼────────────────────┼───────────┘
            │                     │                    │
            ▼                     ▼                    ▼
┌────────────────┐  ┌──────────────────┐  ┌──────────────────────┐
│  Analytics     │  │  Fulfillment     │  │  Inventory Alert     │
│  Aggregation   │  │  Worker          │  │  Worker              │
│  Worker        │  │                  │  │                      │
└────────────────┘  │  ┌────────────┐  │  └──────────────────────┘
                    │  │ Digital    │  │
                    │  │ Delivery   │  │
                    │  ├────────────┤  │
                    │  │ Shipping   │  │
                    │  │ Integration│  │
                    │  ├────────────┤  │
                    │  │ Partner    │  │
                    │  │ API Call   │  │
                    │  ├────────────┤  │
                    │  │ Manual     │  │
                    │  │ Queue      │  │
                    │  └────────────┘  │
                    └──────────────────┘
```

### Redemption Flow

The redemption flow is the core transaction path — the moment a member exchanges points for a reward. It is designed as an **atomic, fail-safe pipeline** with compensating actions for every step.

```
Member clicks "Redeem"
        │
        ▼
┌───────────────────┐
│ 1. ELIGIBILITY    │─── Check tier gate, level gate, achievement gate,
│    CHECK          │    segment gate, venture membership, age verification
└───────┬───────────┘
        │ ✓ Eligible
        ▼
┌───────────────────┐
│ 2. BALANCE        │─── Verify sufficient point balance across
│    VERIFICATION   │    required point currencies
└───────┬───────────┘
        │ ✓ Sufficient
        ▼
┌───────────────────┐
│ 3. INVENTORY      │─── Optimistic lock → check stock → reserve unit
│    RESERVATION    │    (SELECT ... FOR UPDATE SKIP LOCKED)
└───────┬───────────┘
        │ ✓ Reserved
        ▼
┌───────────────────┐
│ 4. POINT          │─── Deduct points via @mcv/engagement/points
│    DEDUCTION      │    (transactional, idempotent)
└───────┬───────────┘
        │ ✓ Deducted
        ▼
┌───────────────────┐
│ 5. REDEMPTION     │─── Write redemption record with status='completed'
│    RECORD         │    Generate redemption_id, timestamp, receipt
└───────┬───────────┘
        │ ✓ Recorded
        ▼
┌───────────────────┐
│ 6. FULFILLMENT    │─── Emit 'rewards.fulfillment' event to Redpanda
│    DISPATCH       │    Include reward type, member details, delivery info
└───────┬───────────┘
        │ ✓ Dispatched
        ▼
   Redemption Complete
   (Member sees confirmation)
```

**Failure handling at each step:**

| Step | Failure | Compensating Action |
|------|---------|---------------------|
| 1. Eligibility | Not eligible | Return error with reason; no state change |
| 2. Balance | Insufficient points | Return error with current balance; no state change |
| 3. Inventory | Out of stock | Offer waitlist; release any held state |
| 4. Point Deduction | Ledger error | Release inventory reservation; return error |
| 5. Record Write | DB error | Refund points; release inventory; return error |
| 6. Fulfillment | Event publish failure | Record redemption anyway; retry fulfillment via cron |

**Idempotency:** Every redemption request includes a client-generated `idempotency_key`. Duplicate requests within the TTL window return the original result without re-executing the pipeline.

### Fulfillment Pipeline

Fulfillment is **asynchronous by design** — the member gets immediate redemption confirmation, and fulfillment happens in the background via Redpanda consumers.

```
┌─────────────────────────────────────────────────────────────┐
│                   Fulfillment Worker                        │
│                                                             │
│   Event: rewards.fulfillment                                │
│   ┌─────────────────────────────────────┐                   │
│   │ Route by fulfillment_type           │                   │
│   └──────┬──────┬──────┬──────┬─────────┘                   │
│          │      │      │      │                             │
│          ▼      ▼      ▼      ▼                             │
│   ┌──────┐ ┌───┐ ┌────┐ ┌──────┐                           │
│   │DIGITAL│ │SHIP│ │ API│ │MANUAL│                          │
│   └──┬───┘ └─┬─┘ └─┬──┘ └──┬───┘                           │
│      │       │     │       │                                │
│      ▼       ▼     ▼       ▼                                │
│   ┌──────────────────────────────────┐                      │
│   │ DIGITAL:                         │                      │
│   │  • Generate/fetch code           │                      │
│   │  • Send email with code          │                      │
│   │  • Activate in-app item          │                      │
│   │  • Grant premium access          │                      │
│   │  • Deliver download link         │                      │
│   ├──────────────────────────────────┤                      │
│   │ SHIPPING:                        │                      │
│   │  • Validate shipping address     │                      │
│   │  • Create shipment order         │                      │
│   │  • Generate shipping label       │                      │
│   │  • Push to warehouse queue       │                      │
│   │  • Provide tracking number       │                      │
│   ├──────────────────────────────────┤                      │
│   │ PARTNER_API:                     │                      │
│   │  • Authenticate with partner     │                      │
│   │  • Call provisioning endpoint    │                      │
│   │  • Receive fulfillment token     │                      │
│   │  • Store delivery details        │                      │
│   ├──────────────────────────────────┤                      │
│   │ MANUAL:                          │                      │
│   │  • Create manual fulfillment     │                      │
│   │    ticket in admin queue         │                      │
│   │  • Notify fulfillment team       │                      │
│   │  • Await manual confirmation     │                      │
│   └──────────────────────────────────┘                      │
│                      │                                      │
│                      ▼                                      │
│   ┌──────────────────────────────────┐                      │
│   │ Update fulfillment_jobs record   │                      │
│   │ Emit rewards.fulfillment.result  │                      │
│   │ Notify member (push / email)     │                      │
│   └──────────────────────────────────┘                      │
│                                                             │
│   Retry policy:                                             │
│   • Max 5 retries with exponential backoff                  │
│   • 1s → 4s → 16s → 64s → 256s                             │
│   • Dead-letter after max retries                           │
│   • Alert ops team on DLQ entry                             │
└─────────────────────────────────────────────────────────────┘
```

### Catalog Resolution

Catalog resolution determines which rewards a member sees, factoring in venture context, tier eligibility, segment targeting, inventory status, and personalization signals.

```
Member opens Rewards Catalog
        │
        ▼
┌───────────────────────────┐
│ 1. VENTURE FILTER         │─── Only rewards published to member's venture(s)
└───────────┬───────────────┘
            ▼
┌───────────────────────────┐
│ 2. STATUS FILTER          │─── Only 'active' rewards; exclude archived/draft
└───────────┬───────────────┘
            ▼
┌───────────────────────────┐
│ 3. VISIBILITY FILTER      │─── Public, tier-specific, segment-specific
└───────────┬───────────────┘
            ▼
┌───────────────────────────┐
│ 4. GATE EVALUATION        │─── Evaluate all gates for the requesting member
│   (tier, level, achievement,│   Mark non-eligible rewards with lock icon
│    segment, time-window)   │   + unlock requirements
└───────────┬───────────────┘
            ▼
┌───────────────────────────┐
│ 5. INVENTORY OVERLAY      │─── Annotate with stock status:
│                           │    in-stock / low-stock / out-of-stock / unlimited
└───────────┬───────────────┘
            ▼
┌───────────────────────────┐
│ 6. PRICING RESOLUTION     │─── Apply active pricing rules:
│                           │    flash sales, bundles, dynamic adjustments
└───────────┬───────────────┘
            ▼
┌───────────────────────────┐
│ 7. PERSONALIZATION        │─── Boost favorites, recent categories,
│                           │    recommendation engine scores
└───────────┬───────────────┘
            ▼
   Rendered Catalog Page
```

---

## Core Interfaces

### Reward

The central entity representing a redeemable item in the catalog.

```typescript
/**
 * A reward available for redemption in the catalog.
 */
interface Reward {
  /** Unique reward identifier (ULID). */
  id: string;

  /** Owning venture identifier. */
  ventureId: string;

  /** Human-readable reward name. */
  name: string;

  /** URL-safe slug for deep-linking. */
  slug: string;

  /** Short description (displayed in catalog cards). */
  shortDescription: string;

  /** Full description (displayed on reward detail page, supports Markdown). */
  fullDescription: string;

  /** Primary reward type. */
  type: RewardType;

  /** Specific subtype within the primary type. */
  subtype: RewardSubtype;

  /** Category this reward belongs to. */
  categoryId: string;

  /** Base point cost for redemption. */
  pointCost: number;

  /** Point currency identifier (for multi-currency programs). */
  pointCurrencyId: string;

  /** Current lifecycle status. */
  status: RewardStatus;

  /** Visibility setting for catalog display. */
  visibility: RewardVisibility;

  /** Featured flag — appears in featured/hero sections. */
  featured: boolean;

  /** Sort priority within category (lower = higher priority). */
  sortOrder: number;

  /** Primary image URL. */
  imageUrl: string;

  /** Gallery image URLs. */
  galleryUrls: string[];

  /** Thumbnail image URL (for catalog grid). */
  thumbnailUrl: string;

  /** Fulfillment type that determines delivery mechanism. */
  fulfillmentType: FulfillmentType;

  /** Fulfillment configuration (type-specific). */
  fulfillmentConfig: Record<string, unknown>;

  /** Maximum redemptions per member (null = unlimited). */
  maxPerMember: number | null;

  /** Maximum total redemptions (null = unlimited). */
  maxTotal: number | null;

  /** Start date for availability window (null = immediately available). */
  availableFrom: Date | null;

  /** End date for availability window (null = no expiration). */
  availableUntil: Date | null;

  /** Terms and conditions text. */
  termsAndConditions: string;

  /** Fine print / disclaimers. */
  finePrint: string | null;

  /** Estimated delivery time description (e.g., "Instant", "3-5 business days"). */
  estimatedDelivery: string;

  /** Tags for search and filtering. */
  tags: string[];

  /** Arbitrary metadata for venture-specific extensions. */
  metadata: Record<string, unknown>;

  /** Total redemption count (denormalized for display). */
  totalRedemptions: number;

  /** Average rating (1-5 scale, null if unrated). */
  averageRating: number | null;

  /** Number of ratings received. */
  ratingCount: number;

  /** Whether this reward is from a partner. */
  isPartnerReward: boolean;

  /** Partner reward ID if applicable. */
  partnerRewardId: string | null;

  /** Record creation timestamp. */
  createdAt: Date;

  /** Last update timestamp. */
  updatedAt: Date;

  /** Soft-delete timestamp. */
  archivedAt: Date | null;
}
```

### RewardType & RewardSubtype

```typescript
/**
 * Primary reward classification.
 */
type RewardType = 'digital' | 'physical' | 'experiential' | 'token';

/**
 * Granular subtype within each primary type.
 */
type RewardSubtype =
  // Digital
  | 'coupon_code'
  | 'discount_code'
  | 'digital_download'
  | 'in_app_item'
  | 'premium_access'
  | 'subscription_extension'
  | 'virtual_currency'
  | 'nft'
  // Physical
  | 'merchandise'
  | 'gift_card'
  | 'printed_material'
  | 'custom_product'
  // Experiential
  | 'event_ticket'
  | 'vip_access'
  | 'meet_and_greet'
  | 'workshop'
  | 'travel_experience'
  | 'backstage_pass'
  // Token
  | 'edge_token_grant'
  | 'token_swap'
  | 'staking_bonus';

/**
 * Reward lifecycle status.
 */
type RewardStatus = 'draft' | 'active' | 'paused' | 'archived' | 'expired';

/**
 * Catalog visibility options.
 */
type RewardVisibility =
  | 'public'           // Visible to all members
  | 'tier_restricted'  // Only visible to qualifying tiers
  | 'segment_only'     // Only visible to targeted segments
  | 'hidden'           // Not in catalog; accessible via direct link only
  | 'internal';        // Admin/testing only
```

### RewardCategory

```typescript
/**
 * Hierarchical category for organizing rewards in the catalog.
 */
interface RewardCategory {
  /** Unique category identifier (ULID). */
  id: string;

  /** Owning venture identifier. */
  ventureId: string;

  /** Display name. */
  name: string;

  /** URL-safe slug. */
  slug: string;

  /** Category description. */
  description: string;

  /** Parent category ID for hierarchy (null = root category). */
  parentId: string | null;

  /** Icon identifier or URL. */
  icon: string;

  /** Hero image URL for category landing pages. */
  heroImageUrl: string | null;

  /** Sort order within parent (lower = higher priority). */
  sortOrder: number;

  /** Whether this category is currently active. */
  active: boolean;

  /** Number of active rewards in this category (denormalized). */
  rewardCount: number;

  /** Metadata for venture-specific extensions. */
  metadata: Record<string, unknown>;

  createdAt: Date;
  updatedAt: Date;
}
```

### Redemption

```typescript
/**
 * A record of a member redeeming a reward.
 */
interface Redemption {
  /** Unique redemption identifier (ULID). */
  id: string;

  /** Venture context. */
  ventureId: string;

  /** Member who redeemed. */
  memberId: string;

  /** Reward that was redeemed. */
  rewardId: string;

  /** Number of units redeemed in this transaction. */
  quantity: number;

  /** Point cost per unit at time of redemption. */
  pointCostPerUnit: number;

  /** Total points spent. */
  totalPointCost: number;

  /** Point currency used. */
  pointCurrencyId: string;

  /** Current status. */
  status: RedemptionStatus;

  /** Client-provided idempotency key. */
  idempotencyKey: string;

  /** Fulfillment job ID (created after successful redemption). */
  fulfillmentJobId: string | null;

  /** Shipping address for physical rewards. */
  shippingAddress: ShippingAddress | null;

  /** Email for digital delivery (defaults to member's email). */
  deliveryEmail: string | null;

  /** Additional delivery instructions or notes. */
  deliveryNotes: string | null;

  /** Redemption receipt data (confirmation details). */
  receipt: RedemptionReceipt;

  /** If refunded, reason for refund. */
  refundReason: string | null;

  /** If refunded, timestamp of refund. */
  refundedAt: Date | null;

  /** Cart ID if this was part of a multi-item cart redemption. */
  cartId: string | null;

  /** Pricing rule ID that was active at time of redemption. */
  pricingRuleId: string | null;

  /** Snapshot of the reward at redemption time (for historical accuracy). */
  rewardSnapshot: Record<string, unknown>;

  /** IP address of the redeeming client (for fraud detection). */
  ipAddress: string;

  /** User agent of the redeeming client. */
  userAgent: string;

  createdAt: Date;
  updatedAt: Date;
}

type RedemptionStatus =
  | 'pending'      // Initiated, not yet completed
  | 'processing'   // In the redemption pipeline
  | 'completed'    // Successfully redeemed
  | 'failed'       // Pipeline failure (points refunded)
  | 'refunded'     // Manually or automatically refunded
  | 'cancelled';   // Cancelled by member before fulfillment

interface ShippingAddress {
  fullName: string;
  line1: string;
  line2: string | null;
  city: string;
  state: string;
  postalCode: string;
  country: string;   // ISO 3166-1 alpha-2
  phone: string | null;
}

interface RedemptionReceipt {
  redemptionId: string;
  rewardName: string;
  quantity: number;
  pointCost: number;
  redeemedAt: string;   // ISO 8601
  estimatedDelivery: string;
  confirmationCode: string;
}
```

### RedemptionCart

```typescript
/**
 * Cart for multi-reward redemptions.
 * Members can add multiple rewards, review totals, and redeem in a single transaction.
 */
interface RedemptionCart {
  /** Unique cart identifier (ULID). */
  id: string;

  /** Venture context. */
  ventureId: string;

  /** Owning member. */
  memberId: string;

  /** Cart items. */
  items: RedemptionCartItem[];

  /** Total point cost across all items. */
  totalPointCost: number;

  /** Cart status. */
  status: 'open' | 'checked_out' | 'expired' | 'abandoned';

  /** Expiration time (carts auto-expire after inactivity). */
  expiresAt: Date;

  /** Shipping address (shared across physical items in cart). */
  shippingAddress: ShippingAddress | null;

  createdAt: Date;
  updatedAt: Date;
}

interface RedemptionCartItem {
  /** Cart item identifier. */
  id: string;

  /** Reward being added. */
  rewardId: string;

  /** Quantity of this reward. */
  quantity: number;

  /** Resolved point cost per unit (including any active pricing rules). */
  resolvedPointCost: number;

  /** Line total (quantity × resolvedPointCost). */
  lineTotal: number;

  /** Eligibility status at time of adding. */
  eligible: boolean;

  /** If not eligible, the reason. */
  ineligibleReason: string | null;

  addedAt: Date;
}
```

### RewardInventory

```typescript
/**
 * Inventory tracking for a reward.
 * Each reward has exactly one inventory record.
 */
interface RewardInventory {
  /** Unique inventory record identifier. */
  id: string;

  /** Associated reward. */
  rewardId: string;

  /** Venture context. */
  ventureId: string;

  /** Whether this reward has unlimited supply. */
  unlimited: boolean;

  /** Total stock (initial + restocks). Only meaningful if unlimited=false. */
  totalStock: number;

  /** Currently available stock. */
  availableStock: number;

  /** Currently reserved (in active redemption pipelines). */
  reservedStock: number;

  /** Total redeemed (lifetime). */
  redeemedStock: number;

  /** Low stock threshold — triggers alert when availableStock <= threshold. */
  lowStockThreshold: number;

  /** Whether low-stock alert has been sent (resets on restock). */
  lowStockAlertSent: boolean;

  /** Whether this item is currently waitlistable when out of stock. */
  waitlistEnabled: boolean;

  /** Number of members on the waitlist. */
  waitlistCount: number;

  /** Last restock timestamp. */
  lastRestockedAt: Date | null;

  /** Optimistic lock version for concurrent reservation safety. */
  version: number;

  updatedAt: Date;
}

/**
 * An inventory adjustment event (restock, manual correction, etc.).
 */
interface InventoryAdjustment {
  id: string;
  rewardId: string;
  ventureId: string;
  adjustmentType: 'restock' | 'correction' | 'write_off' | 'reservation' | 'release' | 'redemption';
  quantityChange: number;   // Positive = add, negative = remove
  previousStock: number;
  newStock: number;
  reason: string;
  performedBy: string;      // Admin user ID or 'system'
  createdAt: Date;
}

/**
 * Inventory alert configuration and state.
 */
interface InventoryAlert {
  rewardId: string;
  rewardName: string;
  availableStock: number;
  lowStockThreshold: number;
  alertType: 'low_stock' | 'out_of_stock' | 'restock_needed';
  notifyChannels: ('email' | 'slack' | 'webhook')[];
  lastAlertedAt: Date | null;
}
```

### FulfillmentJob

```typescript
/**
 * A fulfillment job tracks the delivery of a redeemed reward.
 * Created after successful redemption; processed asynchronously.
 */
interface FulfillmentJob {
  /** Unique job identifier (ULID). */
  id: string;

  /** Associated redemption. */
  redemptionId: string;

  /** Reward being fulfilled. */
  rewardId: string;

  /** Member receiving the reward. */
  memberId: string;

  /** Venture context. */
  ventureId: string;

  /** Fulfillment mechanism. */
  type: FulfillmentType;

  /** Current job status. */
  status: FulfillmentStatus;

  /** Type-specific fulfillment configuration. */
  config: FulfillmentConfig;

  /** Fulfillment result data (populated on completion). */
  result: FulfillmentResult | null;

  /** Number of attempts made. */
  attemptCount: number;

  /** Maximum retry attempts. */
  maxAttempts: number;

  /** Next scheduled retry time (null if not retrying). */
  nextRetryAt: Date | null;

  /** Last error message if failed. */
  lastError: string | null;

  /** Error history for debugging. */
  errorLog: FulfillmentErrorEntry[];

  /** Processing started timestamp. */
  startedAt: Date | null;

  /** Processing completed timestamp. */
  completedAt: Date | null;

  /** Processing timeout deadline. */
  timeoutAt: Date;

  /** Assigned processor/worker ID. */
  processorId: string | null;

  /** Priority level (1 = highest, 10 = lowest). */
  priority: number;

  createdAt: Date;
  updatedAt: Date;
}

type FulfillmentType =
  | 'digital_instant'    // Immediate code/link delivery
  | 'digital_email'      // Email-based digital delivery
  | 'digital_in_app'     // In-app item activation
  | 'physical_shipping'  // Ship physical item
  | 'partner_api'        // Call partner fulfillment API
  | 'token_transfer'     // EDGE token or crypto transfer
  | 'manual';            // Human-handled fulfillment

type FulfillmentStatus =
  | 'queued'         // In the fulfillment queue
  | 'processing'     // Currently being fulfilled
  | 'completed'      // Successfully delivered
  | 'failed'         // Failed after all retries
  | 'retrying'       // Awaiting retry
  | 'cancelled'      // Cancelled (e.g., due to refund)
  | 'timeout'        // Exceeded processing deadline
  | 'manual_review'; // Escalated to human review

/**
 * Type-specific fulfillment configuration.
 */
type FulfillmentConfig =
  | DigitalInstantConfig
  | DigitalEmailConfig
  | DigitalInAppConfig
  | PhysicalShippingConfig
  | PartnerApiConfig
  | TokenTransferConfig
  | ManualConfig;

interface DigitalInstantConfig {
  type: 'digital_instant';
  codePool: string;           // Code pool identifier
  codeFormat: string;         // e.g., 'XXXX-XXXX-XXXX'
  deliveryMethod: 'in_app' | 'email' | 'both';
}

interface DigitalEmailConfig {
  type: 'digital_email';
  templateId: string;         // Email template ID
  attachmentUrl: string | null;
  expirationHours: number | null;
}

interface DigitalInAppConfig {
  type: 'digital_in_app';
  itemType: string;           // In-app item type identifier
  itemId: string;             // Specific item to grant
  duration: number | null;    // Duration in days (for premium access)
}

interface PhysicalShippingConfig {
  type: 'physical_shipping';
  warehouseId: string;
  sku: string;
  weight: number;             // grams
  dimensions: { length: number; width: number; height: number };
  shippingClass: 'standard' | 'express' | 'overnight';
  carrierId: string | null;   // Preferred carrier
}

interface PartnerApiConfig {
  type: 'partner_api';
  partnerId: string;
  endpointUrl: string;
  authMethod: 'api_key' | 'oauth2' | 'hmac';
  requestTemplate: Record<string, unknown>;
  responseMapping: Record<string, string>;
}

interface TokenTransferConfig {
  type: 'token_transfer';
  tokenType: 'edge' | 'custom';
  amount: string;             // BigNumber string
  destinationWallet: string | null;   // null = use member's default wallet
  chainId: number;
}

interface ManualConfig {
  type: 'manual';
  instructions: string;
  assigneeTeam: string;
  estimatedDays: number;
}

/**
 * Result of a completed fulfillment.
 */
interface FulfillmentResult {
  /** Type of result. */
  type: FulfillmentType;

  /** Whether fulfillment was successful. */
  success: boolean;

  /** Digital code (for code-based rewards). */
  code: string | null;

  /** Download URL (for digital downloads). */
  downloadUrl: string | null;

  /** Shipping tracking number (for physical). */
  trackingNumber: string | null;

  /** Shipping carrier name. */
  carrier: string | null;

  /** Estimated delivery date. */
  estimatedDeliveryDate: Date | null;

  /** Partner fulfillment reference ID. */
  partnerReferenceId: string | null;

  /** Token transaction hash (for token transfers). */
  transactionHash: string | null;

  /** Human-readable delivery summary for the member. */
  deliverySummary: string;

  /** Raw response from fulfillment provider. */
  rawResponse: Record<string, unknown> | null;

  completedAt: Date;
}

interface FulfillmentErrorEntry {
  attemptNumber: number;
  error: string;
  errorCode: string | null;
  occurredAt: Date;
}
```

### RewardTier

```typescript
/**
 * Defines access gates for a reward — what conditions a member must meet to redeem.
 * Gates are composable: a reward can have multiple gates combined with AND/OR logic.
 */
interface RewardTier {
  /** Unique gate configuration identifier. */
  id: string;

  /** The reward this gate applies to. */
  rewardId: string;

  /** Venture context. */
  ventureId: string;

  /** Gate combination operator for multiple gates on the same reward. */
  operator: GateOperator;

  /** Individual gate conditions. */
  conditions: GateCondition[];

  /** Human-readable description of who can access this reward. */
  displayText: string;

  /** Whether to show locked rewards in catalog with unlock hints. */
  showWhenLocked: boolean;

  createdAt: Date;
  updatedAt: Date;
}

type GateOperator = 'AND' | 'OR';

/**
 * A single gate condition.
 */
type GateCondition =
  | TierGate
  | LevelGate
  | AchievementGate
  | SegmentGate
  | TimeWindowGate
  | RedemptionCountGate
  | VentureMembershipGate;

interface TierGate {
  type: 'tier';
  /** Minimum tier required (member's tier must be >= this). */
  minimumTier: string;
  /** Or specific tier IDs allowed. */
  allowedTierIds: string[] | null;
}

interface LevelGate {
  type: 'level';
  /** Minimum level required. */
  minimumLevel: number;
}

interface AchievementGate {
  type: 'achievement';
  /** Achievement IDs that must be completed. */
  requiredAchievementIds: string[];
  /** Whether ALL or ANY of the achievements are required. */
  requireAll: boolean;
}

interface SegmentGate {
  type: 'segment';
  /** Segment IDs the member must belong to. */
  allowedSegmentIds: string[];
}

interface TimeWindowGate {
  type: 'time_window';
  /** Available only during this window. */
  startTime: Date;
  endTime: Date;
  /** Timezone for the window. */
  timezone: string;
  /** Recurring pattern (e.g., 'weekly:monday-friday'). */
  recurrence: string | null;
}

interface RedemptionCountGate {
  type: 'redemption_count';
  /** Maximum redemptions of this reward per member. */
  maxPerMember: number;
  /** Time window for the count (null = lifetime). */
  windowDays: number | null;
}

interface VentureMembershipGate {
  type: 'venture_membership';
  /** Required venture memberships. */
  requiredVentureIds: string[];
  /** Minimum membership duration in days. */
  minimumDurationDays: number | null;
}
```

### PartnerReward

```typescript
/**
 * Configuration for a third-party reward provider.
 */
interface PartnerReward {
  /** Unique partner reward configuration identifier. */
  id: string;

  /** Venture context. */
  ventureId: string;

  /** Associated reward in our catalog. */
  rewardId: string;

  /** Partner identifier. */
  partnerId: string;

  /** Partner's name for display. */
  partnerName: string;

  /** Partner's catalog item identifier. */
  partnerItemId: string;

  /** Partner's category for this item. */
  partnerCategory: string;

  /** Cost to us from the partner (in cents). */
  partnerCostCents: number;

  /** Currency of the partner cost. */
  partnerCostCurrency: string;

  /** Revenue share percentage (0-100). */
  revenueSharePercent: number;

  /** Partner API configuration. */
  apiConfig: PartnerApiConfig;

  /** Whether partner inventory is synced automatically. */
  inventorySyncEnabled: boolean;

  /** Last successful inventory sync. */
  lastInventorySyncAt: Date | null;

  /** Partner-provided terms of service URL. */
  partnerTermsUrl: string | null;

  /** Whether this partner integration is active. */
  active: boolean;

  /** Error count in recent period (for circuit-breaker logic). */
  recentErrorCount: number;

  /** Circuit breaker state. */
  circuitBreakerState: 'closed' | 'open' | 'half_open';

  /** When the circuit breaker was last tripped. */
  circuitBreakerOpenedAt: Date | null;

  createdAt: Date;
  updatedAt: Date;
}

interface PartnerConfig {
  partnerId: string;
  partnerName: string;
  apiBaseUrl: string;
  authMethod: 'api_key' | 'oauth2' | 'hmac';
  credentials: {
    apiKey?: string;
    clientId?: string;
    clientSecret?: string;
    hmacSecret?: string;
  };
  rateLimitPerMinute: number;
  timeoutMs: number;
  retryConfig: {
    maxRetries: number;
    backoffMultiplier: number;
    initialDelayMs: number;
  };
  webhookUrl: string | null;
  webhookSecret: string | null;
}

interface PartnerFulfillmentRequest {
  partnerItemId: string;
  quantity: number;
  recipientEmail: string;
  recipientName: string;
  metadata: Record<string, unknown>;
}

interface PartnerFulfillmentResponse {
  success: boolean;
  referenceId: string;
  codes: string[] | null;
  downloadUrls: string[] | null;
  estimatedDelivery: string | null;
  expiresAt: string | null;
  rawResponse: Record<string, unknown>;
}
```

### RewardPricing

```typescript
/**
 * Dynamic pricing configuration for rewards.
 */
interface RewardPricing {
  /** Unique pricing rule identifier. */
  id: string;

  /** Associated reward (null = applies to category/all). */
  rewardId: string | null;

  /** Associated category (for category-wide rules). */
  categoryId: string | null;

  /** Venture context. */
  ventureId: string;

  /** Pricing rule type. */
  ruleType: PricingRuleType;

  /** Rule configuration. */
  config: PricingRuleConfig;

  /** Priority (lower = evaluated first). */
  priority: number;

  /** Whether this rule is currently active. */
  active: boolean;

  /** Start time for this pricing rule. */
  startsAt: Date;

  /** End time (null = no expiration). */
  endsAt: Date | null;

  createdAt: Date;
  updatedAt: Date;
}

type PricingRuleType =
  | 'static'           // Fixed point cost override
  | 'percentage_off'   // Percentage discount on base cost
  | 'fixed_off'        // Fixed point reduction
  | 'flash_sale'       // Time-limited deep discount
  | 'demand_based'     // Price adjusts based on redemption velocity
  | 'bundle'           // Discounted when redeemed with other items
  | 'tier_discount'    // Tier-specific pricing
  | 'first_redemption' // Special price for first-time redeemers
  | 'quantity_break';  // Volume discount

type PricingRuleConfig =
  | StaticPricingConfig
  | PercentageOffConfig
  | FixedOffConfig
  | FlashSaleConfig
  | DemandBasedConfig
  | BundlePricingConfig
  | TierDiscountConfig
  | FirstRedemptionConfig
  | QuantityBreakConfig;

interface StaticPricingConfig {
  type: 'static';
  overridePointCost: number;
}

interface PercentageOffConfig {
  type: 'percentage_off';
  percentOff: number;           // 0-100
  maxDiscountPoints: number | null;   // Cap the discount
}

interface FixedOffConfig {
  type: 'fixed_off';
  pointsOff: number;
  minimumBaseCost: number;      // Don't apply if base < this
}

interface FlashSaleConfig {
  type: 'flash_sale';
  salePrice: number;            // Discounted point cost
  originalPrice: number;        // For strike-through display
  maxRedemptions: number | null;  // Sale ends when reached
  currentRedemptions: number;
  bannerText: string;           // e.g., "⚡ Flash Sale — 50% off!"
  countdownEnabled: boolean;
}

interface DemandBasedConfig {
  type: 'demand_based';
  basePrice: number;
  minPrice: number;
  maxPrice: number;
  priceIncrementPerRedemption: number;
  windowHours: number;          // Rolling window for velocity calculation
  redemptionThreshold: number;  // Redemptions in window that trigger increase
}

interface BundlePricingConfig {
  type: 'bundle';
  bundleId: string;
  bundleRewardIds: string[];
  bundlePrice: number;          // Total price when all items redeemed together
  individualTotal: number;      // Sum of individual prices (for savings display)
  savingsDisplay: string;       // e.g., "Save 2,000 points!"
}

interface TierDiscountConfig {
  type: 'tier_discount';
  tierDiscounts: Array<{
    tierId: string;
    tierName: string;
    percentOff: number;
  }>;
}

interface FirstRedemptionConfig {
  type: 'first_redemption';
  firstTimePrice: number;
  normalPrice: number;
  perReward: boolean;           // Per-reward or per-catalog first redemption
}

interface QuantityBreakConfig {
  type: 'quantity_break';
  breaks: Array<{
    minQuantity: number;
    pricePerUnit: number;
  }>;
}

/**
 * A flash sale event.
 */
interface FlashSale {
  id: string;
  ventureId: string;
  name: string;
  description: string;
  rewardIds: string[];
  discountPercent: number;
  maxRedemptionsPerReward: number | null;
  startsAt: Date;
  endsAt: Date;
  bannerImageUrl: string | null;
  active: boolean;
  createdAt: Date;
}
```

### RewardFavorite

```typescript
/**
 * A member's favorited reward for quick access.
 */
interface RewardFavorite {
  id: string;
  ventureId: string;
  memberId: string;
  rewardId: string;
  createdAt: Date;
}
```

### RewardRecommendation

```typescript
/**
 * A personalized reward recommendation for a member.
 */
interface RewardRecommendation {
  id: string;
  ventureId: string;
  memberId: string;
  rewardId: string;

  /** Recommendation strategy that generated this. */
  strategy: RecommendationStrategy;

  /** Confidence score (0.0 - 1.0). */
  score: number;

  /** Human-readable reason for recommendation. */
  reason: string;

  /** Whether the member has dismissed this recommendation. */
  dismissed: boolean;

  /** Whether the member redeemed the recommended reward. */
  converted: boolean;

  /** Expiration (recommendations refresh periodically). */
  expiresAt: Date;

  createdAt: Date;
}

type RecommendationStrategy =
  | 'collaborative_filtering'   // "Members like you also redeemed..."
  | 'category_affinity'         // Based on member's category preferences
  | 'tier_popular'              // Popular among member's tier
  | 'trending'                  // Currently trending rewards
  | 'restock_alert'             // Previously waitlisted item back in stock
  | 'price_drop'                // Reward the member viewed is now cheaper
  | 'new_arrival'               // New reward in a category the member likes
  | 'complete_collection'       // "You've redeemed 3/5 in this set"
  | 'seasonal'                  // Season/holiday-themed recommendations
  | 'editorial';                // Manually curated staff picks
```

### RewardAnalytics

```typescript
/**
 * Aggregated analytics for the reward catalog and redemption activity.
 */
interface RewardAnalytics {
  /** Time period for these metrics. */
  period: {
    start: Date;
    end: Date;
    granularity: 'hour' | 'day' | 'week' | 'month';
  };

  /** Venture context. */
  ventureId: string;

  /** Top-level redemption metrics. */
  redemptions: RedemptionMetrics;

  /** Catalog health metrics. */
  catalogHealth: CatalogHealthMetrics;

  /** Point economy metrics. */
  pointEconomy: PointEconomyMetrics;

  /** Top performing rewards. */
  topRewards: TopRewardEntry[];

  /** Category performance. */
  categoryPerformance: CategoryPerformanceEntry[];

  /** Fulfillment performance. */
  fulfillmentPerformance: FulfillmentPerformanceMetrics;

  /** Partner performance. */
  partnerPerformance: PartnerPerformanceEntry[];

  /** Breakage report. */
  breakage: BreakageReport;

  generatedAt: Date;
}

interface RedemptionMetrics {
  /** Total redemptions in period. */
  totalRedemptions: number;
  /** Unique members who redeemed. */
  uniqueRedeemers: number;
  /** Total points spent on redemptions. */
  totalPointsSpent: number;
  /** Average point cost per redemption. */
  averagePointCost: number;
  /** Redemption success rate. */
  successRate: number;
  /** Refund rate. */
  refundRate: number;
  /** Redemptions by type. */
  byType: Record<RewardType, number>;
  /** Redemptions by fulfillment type. */
  byFulfillmentType: Record<FulfillmentType, number>;
  /** Day-over-day trend. */
  trend: Array<{ date: string; count: number; points: number }>;
}

interface CatalogHealthMetrics {
  /** Total active rewards. */
  totalActiveRewards: number;
  /** Rewards by status. */
  byStatus: Record<RewardStatus, number>;
  /** Rewards with zero redemptions in period. */
  zeroRedemptionRewards: number;
  /** Percentage of catalog that was redeemed at least once. */
  catalogUtilizationRate: number;
  /** Average reward rating. */
  averageRating: number;
  /** Rewards currently out of stock. */
  outOfStockCount: number;
  /** Rewards approaching low stock. */
  lowStockCount: number;
  /** Rewards expiring soon (within 30 days). */
  expiringSoonCount: number;
  /** New rewards added in period. */
  newRewardsAdded: number;
  /** Rewards archived in period. */
  rewardsArchived: number;
}

interface PointEconomyMetrics {
  /** Total points issued (from @mcv/engagement/points). */
  totalPointsIssued: number;
  /** Total points redeemed through rewards. */
  totalPointsRedeemed: number;
  /** Redemption rate (redeemed / issued). */
  redemptionRate: number;
  /** Average time from earn to redeem (days). */
  averageTimeToRedeem: number;
  /** Points currently in circulation (issued - redeemed - expired). */
  pointsInCirculation: number;
  /** Estimated future liability (points × estimated cost per point). */
  estimatedLiability: number;
}

interface TopRewardEntry {
  rewardId: string;
  rewardName: string;
  type: RewardType;
  redemptionCount: number;
  totalPointsSpent: number;
  averageRating: number | null;
  rank: number;
}

interface CategoryPerformanceEntry {
  categoryId: string;
  categoryName: string;
  rewardCount: number;
  redemptionCount: number;
  totalPointsSpent: number;
  utilizationRate: number;
}

interface FulfillmentPerformanceMetrics {
  /** Average time from redemption to fulfillment completion. */
  averageFulfillmentTime: Record<FulfillmentType, number>;
  /** Fulfillment success rate by type. */
  successRate: Record<FulfillmentType, number>;
  /** Jobs currently in queue. */
  queueDepth: number;
  /** Jobs in retry state. */
  retryingCount: number;
  /** Jobs in manual review. */
  manualReviewCount: number;
  /** Dead-letter queue size. */
  dlqSize: number;
}

interface PartnerPerformanceEntry {
  partnerId: string;
  partnerName: string;
  totalFulfillments: number;
  successRate: number;
  averageResponseTime: number;
  totalCost: number;
  costCurrency: string;
  circuitBreakerState: string;
}

interface BreakageReport {
  /** Total points that were never redeemed (expired or inactive). */
  totalBreakagePoints: number;
  /** Breakage rate (expired / total issued). */
  breakageRate: number;
  /** Estimated revenue impact of breakage. */
  estimatedBreakageValue: number;
  /** Points at risk of expiring in next 30/60/90 days. */
  expiringPoints: {
    next30Days: number;
    next60Days: number;
    next90Days: number;
  };
  /** Segments with highest breakage. */
  highBreakageSegments: Array<{
    segmentId: string;
    segmentName: string;
    breakageRate: number;
  }>;
}

interface RewardROI {
  rewardId: string;
  rewardName: string;
  /** Cost to provide this reward (partner cost, COGS, etc.). */
  costPerUnit: number;
  /** Point value redeemed per unit (points × cost-per-point). */
  pointValuePerUnit: number;
  /** Number of subsequent engagements after redemption. */
  postRedemptionEngagement: number;
  /** Member retention rate among redeemers vs non-redeemers. */
  redeemberRetentionRate: number;
  /** ROI = (lifetime value uplift - cost) / cost. */
  roi: number;
}
```

### RewardService

```typescript
/**
 * Primary service facade for all reward operations.
 * Delegates to specialized sub-services.
 */
interface RewardService {
  // === Catalog Operations ===

  /** Browse the catalog with filters, pagination, and personalization. */
  browseCatalog(params: CatalogBrowseParams): Promise<PaginatedResult<RewardCatalogEntry>>;

  /** Get a single reward by ID or slug. */
  getReward(params: { rewardId?: string; slug?: string; ventureId: string }): Promise<Reward | null>;

  /** Search rewards by text query. */
  searchRewards(params: CatalogSearchParams): Promise<PaginatedResult<RewardCatalogEntry>>;

  /** Get featured rewards for the catalog hero section. */
  getFeaturedRewards(params: { ventureId: string; limit?: number }): Promise<RewardCatalogEntry[]>;

  /** Get trending rewards based on recent redemption velocity. */
  getTrendingRewards(params: { ventureId: string; limit?: number }): Promise<RewardCatalogEntry[]>;

  /** Get categories for the catalog navigation. */
  getCategories(params: { ventureId: string; parentId?: string }): Promise<RewardCategory[]>;

  // === CRUD (Admin) ===

  /** Create a new reward in the catalog. */
  createReward(params: RewardCreate): Promise<Reward>;

  /** Update an existing reward. */
  updateReward(params: RewardUpdate): Promise<Reward>;

  /** Archive a reward (soft delete). */
  archiveReward(params: { rewardId: string; ventureId: string }): Promise<void>;

  /** Create a reward category. */
  createCategory(params: RewardCategoryCreate): Promise<RewardCategory>;

  /** Update a reward category. */
  updateCategory(params: { id: string; ventureId: string } & Partial<RewardCategoryCreate>): Promise<RewardCategory>;

  // === Redemption ===

  /** Check if a member is eligible to redeem a specific reward. */
  checkEligibility(params: { rewardId: string; memberId: string; ventureId: string }): Promise<EligibilityResult>;

  /** Redeem a single reward. */
  redeem(params: RedemptionCreate): Promise<Redemption>;

  /** Create a redemption cart. */
  createCart(params: { memberId: string; ventureId: string }): Promise<RedemptionCart>;

  /** Add item to cart. */
  addToCart(params: { cartId: string; rewardId: string; quantity: number }): Promise<RedemptionCart>;

  /** Remove item from cart. */
  removeFromCart(params: { cartId: string; itemId: string }): Promise<RedemptionCart>;

  /** Checkout (redeem) entire cart. */
  checkoutCart(params: { cartId: string; shippingAddress?: ShippingAddress; idempotencyKey: string }): Promise<Redemption[]>;

  /** Get redemption history for a member. */
  getRedemptionHistory(params: { memberId: string; ventureId: string; limit?: number; cursor?: string }): Promise<PaginatedResult<Redemption>>;

  /** Request a refund for a redemption. */
  requestRefund(params: { redemptionId: string; reason: string }): Promise<Redemption>;

  // === Inventory ===

  /** Get inventory status for a reward. */
  getInventory(params: { rewardId: string }): Promise<RewardInventory>;

  /** Restock a reward. */
  restock(params: { rewardId: string; quantity: number; reason: string }): Promise<RewardInventory>;

  /** Join the waitlist for an out-of-stock reward. */
  joinWaitlist(params: { rewardId: string; memberId: string; ventureId: string }): Promise<void>;

  /** Leave the waitlist. */
  leaveWaitlist(params: { rewardId: string; memberId: string; ventureId: string }): Promise<void>;

  // === Fulfillment ===

  /** Get fulfillment status for a redemption. */
  getFulfillmentStatus(params: { redemptionId: string }): Promise<FulfillmentJob>;

  /** Retry a failed fulfillment. */
  retryFulfillment(params: { jobId: string }): Promise<FulfillmentJob>;

  /** Manually complete a fulfillment (admin). */
  completeFulfillment(params: { jobId: string; result: FulfillmentResult }): Promise<FulfillmentJob>;

  /** Cancel a queued fulfillment. */
  cancelFulfillment(params: { jobId: string; reason: string }): Promise<FulfillmentJob>;

  // === Favorites & Recommendations ===

  /** Toggle favorite status for a reward. */
  toggleFavorite(params: { rewardId: string; memberId: string; ventureId: string }): Promise<{ favorited: boolean }>;

  /** Get member's favorite rewards. */
  getFavorites(params: { memberId: string; ventureId: string }): Promise<RewardCatalogEntry[]>;

  /** Get personalized recommendations for a member. */
  getRecommendations(params: { memberId: string; ventureId: string; limit?: number }): Promise<RewardRecommendation[]>;

  /** Dismiss a recommendation. */
  dismissRecommendation(params: { recommendationId: string; memberId: string }): Promise<void>;

  // === Pricing ===

  /** Resolve the effective price for a reward given current context. */
  resolvePrice(params: { rewardId: string; memberId: string; ventureId: string; quantity?: number }): Promise<ResolvedPrice>;

  /** Get active flash sales. */
  getActiveFlashSales(params: { ventureId: string }): Promise<FlashSale[]>;

  /** Create a flash sale (admin). */
  createFlashSale(params: Omit<FlashSale, 'id' | 'createdAt'>): Promise<FlashSale>;

  // === Analytics ===

  /** Get reward analytics for a period. */
  getAnalytics(params: AnalyticsQuery): Promise<RewardAnalytics>;

  /** Get breakage report. */
  getBreakageReport(params: { ventureId: string; period: DateRange }): Promise<BreakageReport>;

  /** Get reward ROI analysis. */
  getRewardROI(params: { rewardId: string; ventureId: string; period: DateRange }): Promise<RewardROI>;
}

interface CatalogBrowseParams {
  ventureId: string;
  memberId?: string;           // For personalization + eligibility
  categoryId?: string;
  type?: RewardType;
  subtype?: RewardSubtype;
  minPoints?: number;
  maxPoints?: number;
  tags?: string[];
  inStockOnly?: boolean;
  eligibleOnly?: boolean;
  sortBy?: 'popular' | 'newest' | 'price_asc' | 'price_desc' | 'rating' | 'featured';
  limit?: number;
  cursor?: string;
}

interface CatalogSearchParams extends CatalogBrowseParams {
  query: string;
}

interface RewardCatalogEntry extends Reward {
  /** Resolved effective price (after pricing rules). */
  effectivePointCost: number;
  /** Original price (for strike-through). */
  originalPointCost: number | null;
  /** Whether the requesting member is eligible. */
  eligible: boolean;
  /** If not eligible, why. */
  eligibilityReason: string | null;
  /** Inventory status. */
  stockStatus: 'in_stock' | 'low_stock' | 'out_of_stock' | 'unlimited';
  /** Whether the member has favorited this reward. */
  favorited: boolean;
  /** Active pricing badge (e.g., "Flash Sale!", "20% off for Gold members"). */
  pricingBadge: string | null;
  /** Whether the member is on the waitlist. */
  onWaitlist: boolean;
}

interface EligibilityResult {
  eligible: boolean;
  reasons: Array<{
    gate: string;
    passed: boolean;
    message: string;
    unlockHint: string | null;
  }>;
  balanceSufficient: boolean;
  currentBalance: number;
  requiredBalance: number;
  inStock: boolean;
}

interface ResolvedPrice {
  basePrice: number;
  effectivePrice: number;
  discount: number;
  appliedRules: Array<{
    ruleId: string;
    ruleType: PricingRuleType;
    discountAmount: number;
    description: string;
  }>;
  savingsDisplay: string | null;
}

interface AnalyticsQuery {
  ventureId: string;
  startDate: Date;
  endDate: Date;
  granularity: 'hour' | 'day' | 'week' | 'month';
  rewardId?: string;
  categoryId?: string;
  type?: RewardType;
}
```

---

## Database Schemas

All tables enforce multi-tenant isolation via Row-Level Security (RLS) policies keyed on `venture_id`. The `venture_id` is extracted from the authenticated session's JWT claims.

### rewards table

```typescript
import { pgTable, text, integer, boolean, timestamp, jsonb, pgEnum } from 'drizzle-orm/pg-core';
import { ulid } from '@mcv/ids';

export const rewardTypeEnum = pgEnum('reward_type', ['digital', 'physical', 'experiential', 'token']);
export const rewardStatusEnum = pgEnum('reward_status', ['draft', 'active', 'paused', 'archived', 'expired']);
export const rewardVisibilityEnum = pgEnum('reward_visibility', [
  'public', 'tier_restricted', 'segment_only', 'hidden', 'internal',
]);
export const fulfillmentTypeEnum = pgEnum('fulfillment_type', [
  'digital_instant', 'digital_email', 'digital_in_app',
  'physical_shipping', 'partner_api', 'token_transfer', 'manual',
]);

export const rewards = pgTable('rewards', {
  id:                 text('id').primaryKey().$defaultFn(() => ulid()),
  ventureId:          text('venture_id').notNull().references(() => ventures.id),
  name:               text('name').notNull(),
  slug:               text('slug').notNull(),
  shortDescription:   text('short_description').notNull(),
  fullDescription:    text('full_description').notNull(),
  type:               rewardTypeEnum('type').notNull(),
  subtype:            text('subtype').notNull(),
  categoryId:         text('category_id').notNull().references(() => rewardCategories.id),
  pointCost:          integer('point_cost').notNull(),
  pointCurrencyId:    text('point_currency_id').notNull(),
  status:             rewardStatusEnum('status').notNull().default('draft'),
  visibility:         rewardVisibilityEnum('visibility').notNull().default('public'),
  featured:           boolean('featured').notNull().default(false),
  sortOrder:          integer('sort_order').notNull().default(0),
  imageUrl:           text('image_url').notNull(),
  galleryUrls:        jsonb('gallery_urls').$type<string[]>().notNull().default([]),
  thumbnailUrl:       text('thumbnail_url').notNull(),
  fulfillmentType:    fulfillmentTypeEnum('fulfillment_type').notNull(),
  fulfillmentConfig:  jsonb('fulfillment_config').$type<Record<string, unknown>>().notNull().default({}),
  maxPerMember:       integer('max_per_member'),
  maxTotal:           integer('max_total'),
  availableFrom:      timestamp('available_from', { withTimezone: true }),
  availableUntil:     timestamp('available_until', { withTimezone: true }),
  termsAndConditions: text('terms_and_conditions').notNull().default(''),
  finePrint:          text('fine_print'),
  estimatedDelivery:  text('estimated_delivery').notNull().default('Instant'),
  tags:               jsonb('tags').$type<string[]>().notNull().default([]),
  metadata:           jsonb('metadata').$type<Record<string, unknown>>().notNull().default({}),
  totalRedemptions:   integer('total_redemptions').notNull().default(0),
  averageRating:      integer('average_rating'),
  ratingCount:        integer('rating_count').notNull().default(0),
  isPartnerReward:    boolean('is_partner_reward').notNull().default(false),
  partnerRewardId:    text('partner_reward_id'),
  createdAt:          timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt:          timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  archivedAt:         timestamp('archived_at', { withTimezone: true }),
}, (table) => ({
  ventureIdx:    index('rewards_venture_idx').on(table.ventureId),
  categoryIdx:   index('rewards_category_idx').on(table.ventureId, table.categoryId),
  statusIdx:     index('rewards_status_idx').on(table.ventureId, table.status),
  typeIdx:       index('rewards_type_idx').on(table.ventureId, table.type),
  slugIdx:       uniqueIndex('rewards_slug_idx').on(table.ventureId, table.slug),
  featuredIdx:   index('rewards_featured_idx').on(table.ventureId, table.featured).where(eq(table.status, 'active')),
  searchIdx:     index('rewards_search_idx').using('gin', sql`to_tsvector('english', ${table.name} || ' ' || ${table.shortDescription})`),
}));
```

### reward_categories table

```typescript
export const rewardCategories = pgTable('reward_categories', {
  id:           text('id').primaryKey().$defaultFn(() => ulid()),
  ventureId:    text('venture_id').notNull().references(() => ventures.id),
  name:         text('name').notNull(),
  slug:         text('slug').notNull(),
  description:  text('description').notNull().default(''),
  parentId:     text('parent_id').references(() => rewardCategories.id),
  icon:         text('icon').notNull().default('gift'),
  heroImageUrl: text('hero_image_url'),
  sortOrder:    integer('sort_order').notNull().default(0),
  active:       boolean('active').notNull().default(true),
  rewardCount:  integer('reward_count').notNull().default(0),
  metadata:     jsonb('metadata').$type<Record<string, unknown>>().notNull().default({}),
  createdAt:    timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt:    timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  ventureIdx:  index('reward_categories_venture_idx').on(table.ventureId),
  slugIdx:     uniqueIndex('reward_categories_slug_idx').on(table.ventureId, table.slug),
  parentIdx:   index('reward_categories_parent_idx').on(table.ventureId, table.parentId),
}));
```

### redemptions table

```typescript
export const redemptionStatusEnum = pgEnum('redemption_status', [
  'pending', 'processing', 'completed', 'failed', 'refunded', 'cancelled',
]);

export const redemptions = pgTable('redemptions', {
  id:                 text('id').primaryKey().$defaultFn(() => ulid()),
  ventureId:          text('venture_id').notNull().references(() => ventures.id),
  memberId:           text('member_id').notNull().references(() => members.id),
  rewardId:           text('reward_id').notNull().references(() => rewards.id),
  quantity:           integer('quantity').notNull().default(1),
  pointCostPerUnit:   integer('point_cost_per_unit').notNull(),
  totalPointCost:     integer('total_point_cost').notNull(),
  pointCurrencyId:    text('point_currency_id').notNull(),
  status:             redemptionStatusEnum('status').notNull().default('pending'),
  idempotencyKey:     text('idempotency_key').notNull(),
  fulfillmentJobId:   text('fulfillment_job_id'),
  shippingAddress:    jsonb('shipping_address').$type<ShippingAddress | null>(),
  deliveryEmail:      text('delivery_email'),
  deliveryNotes:      text('delivery_notes'),
  receipt:            jsonb('receipt').$type<RedemptionReceipt>().notNull(),
  refundReason:       text('refund_reason'),
  refundedAt:         timestamp('refunded_at', { withTimezone: true }),
  cartId:             text('cart_id'),
  pricingRuleId:      text('pricing_rule_id'),
  rewardSnapshot:     jsonb('reward_snapshot').$type<Record<string, unknown>>().notNull(),
  ipAddress:          text('ip_address').notNull(),
  userAgent:          text('user_agent').notNull(),
  createdAt:          timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt:          timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  ventureIdx:       index('redemptions_venture_idx').on(table.ventureId),
  memberIdx:        index('redemptions_member_idx').on(table.ventureId, table.memberId),
  rewardIdx:        index('redemptions_reward_idx').on(table.ventureId, table.rewardId),
  statusIdx:        index('redemptions_status_idx').on(table.ventureId, table.status),
  idempotencyIdx:   uniqueIndex('redemptions_idempotency_idx').on(table.ventureId, table.idempotencyKey),
  cartIdx:          index('redemptions_cart_idx').on(table.cartId),
  createdAtIdx:     index('redemptions_created_at_idx').on(table.ventureId, table.createdAt),
}));
```

### reward_inventory table

```typescript
export const rewardInventory = pgTable('reward_inventory', {
  id:                 text('id').primaryKey().$defaultFn(() => ulid()),
  rewardId:           text('reward_id').notNull().references(() => rewards.id).unique(),
  ventureId:          text('venture_id').notNull().references(() => ventures.id),
  unlimited:          boolean('unlimited').notNull().default(false),
  totalStock:         integer('total_stock').notNull().default(0),
  availableStock:     integer('available_stock').notNull().default(0),
  reservedStock:      integer('reserved_stock').notNull().default(0),
  redeemedStock:      integer('redeemed_stock').notNull().default(0),
  lowStockThreshold:  integer('low_stock_threshold').notNull().default(10),
  lowStockAlertSent:  boolean('low_stock_alert_sent').notNull().default(false),
  waitlistEnabled:    boolean('waitlist_enabled').notNull().default(true),
  waitlistCount:      integer('waitlist_count').notNull().default(0),
  lastRestockedAt:    timestamp('last_restocked_at', { withTimezone: true }),
  version:            integer('version').notNull().default(0),
  updatedAt:          timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  rewardIdx:   index('reward_inventory_reward_idx').on(table.rewardId),
  ventureIdx:  index('reward_inventory_venture_idx').on(table.ventureId),
  lowStockIdx: index('reward_inventory_low_stock_idx')
    .on(table.ventureId, table.availableStock)
    .where(sql`${table.unlimited} = false`),
}));
```

### fulfillment_jobs table

```typescript
export const fulfillmentStatusEnum = pgEnum('fulfillment_status', [
  'queued', 'processing', 'completed', 'failed', 'retrying', 'cancelled', 'timeout', 'manual_review',
]);

export const fulfillmentJobs = pgTable('fulfillment_jobs', {
  id:              text('id').primaryKey().$defaultFn(() => ulid()),
  redemptionId:    text('redemption_id').notNull().references(() => redemptions.id),
  rewardId:        text('reward_id').notNull().references(() => rewards.id),
  memberId:        text('member_id').notNull().references(() => members.id),
  ventureId:       text('venture_id').notNull().references(() => ventures.id),
  type:            fulfillmentTypeEnum('type').notNull(),
  status:          fulfillmentStatusEnum('status').notNull().default('queued'),
  config:          jsonb('config').$type<FulfillmentConfig>().notNull(),
  result:          jsonb('result').$type<FulfillmentResult | null>(),
  attemptCount:    integer('attempt_count').notNull().default(0),
  maxAttempts:     integer('max_attempts').notNull().default(5),
  nextRetryAt:     timestamp('next_retry_at', { withTimezone: true }),
  lastError:       text('last_error'),
  errorLog:        jsonb('error_log').$type<FulfillmentErrorEntry[]>().notNull().default([]),
  startedAt:       timestamp('started_at', { withTimezone: true }),
  completedAt:     timestamp('completed_at', { withTimezone: true }),
  timeoutAt:       timestamp('timeout_at', { withTimezone: true }).notNull(),
  processorId:     text('processor_id'),
  priority:        integer('priority').notNull().default(5),
  createdAt:       timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt:       timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  ventureIdx:     index('fulfillment_jobs_venture_idx').on(table.ventureId),
  redemptionIdx:  index('fulfillment_jobs_redemption_idx').on(table.redemptionId),
  statusIdx:      index('fulfillment_jobs_status_idx').on(table.status),
  queueIdx:       index('fulfillment_jobs_queue_idx')
    .on(table.status, table.priority, table.createdAt)
    .where(sql`${table.status} IN ('queued', 'retrying')`),
  retryIdx:       index('fulfillment_jobs_retry_idx')
    .on(table.nextRetryAt)
    .where(sql`${table.status} = 'retrying'`),
  processorIdx:   index('fulfillment_jobs_processor_idx').on(table.processorId, table.status),
}));
```

### reward_tiers table

```typescript
export const rewardTiers = pgTable('reward_tiers', {
  id:            text('id').primaryKey().$defaultFn(() => ulid()),
  rewardId:      text('reward_id').notNull().references(() => rewards.id),
  ventureId:     text('venture_id').notNull().references(() => ventures.id),
  operator:      text('operator').$type<GateOperator>().notNull().default('AND'),
  conditions:    jsonb('conditions').$type<GateCondition[]>().notNull(),
  displayText:   text('display_text').notNull(),
  showWhenLocked: boolean('show_when_locked').notNull().default(true),
  createdAt:     timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt:     timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  rewardIdx:  index('reward_tiers_reward_idx').on(table.rewardId),
  ventureIdx: index('reward_tiers_venture_idx').on(table.ventureId),
}));
```

### partner_rewards table

```typescript
export const partnerRewards = pgTable('partner_rewards', {
  id:                    text('id').primaryKey().$defaultFn(() => ulid()),
  ventureId:             text('venture_id').notNull().references(() => ventures.id),
  rewardId:              text('reward_id').notNull().references(() => rewards.id),
  partnerId:             text('partner_id').notNull(),
  partnerName:           text('partner_name').notNull(),
  partnerItemId:         text('partner_item_id').notNull(),
  partnerCategory:       text('partner_category').notNull().default(''),
  partnerCostCents:      integer('partner_cost_cents').notNull(),
  partnerCostCurrency:   text('partner_cost_currency').notNull().default('USD'),
  revenueSharePercent:   integer('revenue_share_percent').notNull().default(0),
  apiConfig:             jsonb('api_config').$type<PartnerApiConfig>().notNull(),
  inventorySyncEnabled:  boolean('inventory_sync_enabled').notNull().default(false),
  lastInventorySyncAt:   timestamp('last_inventory_sync_at', { withTimezone: true }),
  partnerTermsUrl:       text('partner_terms_url'),
  active:                boolean('active').notNull().default(true),
  recentErrorCount:      integer('recent_error_count').notNull().default(0),
  circuitBreakerState:   text('circuit_breaker_state').notNull().default('closed'),
  circuitBreakerOpenedAt: timestamp('circuit_breaker_opened_at', { withTimezone: true }),
  createdAt:             timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt:             timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  ventureIdx:  index('partner_rewards_venture_idx').on(table.ventureId),
  rewardIdx:   index('partner_rewards_reward_idx').on(table.rewardId),
  partnerIdx:  index('partner_rewards_partner_idx').on(table.partnerId),
}));
```

### reward_favorites table

```typescript
export const rewardFavorites = pgTable('reward_favorites', {
  id:        text('id').primaryKey().$defaultFn(() => ulid()),
  ventureId: text('venture_id').notNull().references(() => ventures.id),
  memberId:  text('member_id').notNull().references(() => members.id),
  rewardId:  text('reward_id').notNull().references(() => rewards.id),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  memberIdx:  index('reward_favorites_member_idx').on(table.ventureId, table.memberId),
  uniqueIdx:  uniqueIndex('reward_favorites_unique_idx').on(table.ventureId, table.memberId, table.rewardId),
}));
```

### reward_recommendations table

```typescript
export const rewardRecommendations = pgTable('reward_recommendations', {
  id:        text('id').primaryKey().$defaultFn(() => ulid()),
  ventureId: text('venture_id').notNull().references(() => ventures.id),
  memberId:  text('member_id').notNull().references(() => members.id),
  rewardId:  text('reward_id').notNull().references(() => rewards.id),
  strategy:  text('strategy').$type<RecommendationStrategy>().notNull(),
  score:     integer('score').notNull(),   // Stored as integer 0-1000 for precision
  reason:    text('reason').notNull(),
  dismissed: boolean('dismissed').notNull().default(false),
  converted: boolean('converted').notNull().default(false),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  memberIdx:    index('reward_recommendations_member_idx').on(table.ventureId, table.memberId),
  expiresIdx:   index('reward_recommendations_expires_idx').on(table.expiresAt),
  strategyIdx:  index('reward_recommendations_strategy_idx').on(table.ventureId, table.strategy),
}));
```

### reward_pricing_rules table

```typescript
export const rewardPricingRules = pgTable('reward_pricing_rules', {
  id:          text('id').primaryKey().$defaultFn(() => ulid()),
  rewardId:    text('reward_id').references(() => rewards.id),
  categoryId:  text('category_id').references(() => rewardCategories.id),
  ventureId:   text('venture_id').notNull().references(() => ventures.id),
  ruleType:    text('rule_type').$type<PricingRuleType>().notNull(),
  config:      jsonb('config').$type<PricingRuleConfig>().notNull(),
  priority:    integer('priority').notNull().default(0),
  active:      boolean('active').notNull().default(true),
  startsAt:    timestamp('starts_at', { withTimezone: true }).notNull(),
  endsAt:      timestamp('ends_at', { withTimezone: true }),
  createdAt:   timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt:   timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  ventureIdx:  index('reward_pricing_rules_venture_idx').on(table.ventureId),
  rewardIdx:   index('reward_pricing_rules_reward_idx').on(table.rewardId),
  activeIdx:   index('reward_pricing_rules_active_idx')
    .on(table.ventureId, table.active, table.startsAt, table.endsAt),
}));
```

### reward_waitlists table

```typescript
export const rewardWaitlists = pgTable('reward_waitlists', {
  id:         text('id').primaryKey().$defaultFn(() => ulid()),
  ventureId:  text('venture_id').notNull().references(() => ventures.id),
  rewardId:   text('reward_id').notNull().references(() => rewards.id),
  memberId:   text('member_id').notNull().references(() => members.id),
  position:   integer('position').notNull(),
  notified:   boolean('notified').notNull().default(false),
  notifiedAt: timestamp('notified_at', { withTimezone: true }),
  redeemedAt: timestamp('redeemed_at', { withTimezone: true }),
  createdAt:  timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  rewardIdx:   index('reward_waitlists_reward_idx').on(table.rewardId, table.position),
  memberIdx:   index('reward_waitlists_member_idx').on(table.ventureId, table.memberId),
  uniqueIdx:   uniqueIndex('reward_waitlists_unique_idx').on(table.rewardId, table.memberId),
}));
```

### reward_bundles table

```typescript
export const rewardBundles = pgTable('reward_bundles', {
  id:           text('id').primaryKey().$defaultFn(() => ulid()),
  ventureId:    text('venture_id').notNull().references(() => ventures.id),
  name:         text('name').notNull(),
  description:  text('description').notNull(),
  rewardIds:    jsonb('reward_ids').$type<string[]>().notNull(),
  bundlePrice:  integer('bundle_price').notNull(),
  active:       boolean('active').notNull().default(true),
  imageUrl:     text('image_url'),
  startsAt:     timestamp('starts_at', { withTimezone: true }),
  endsAt:       timestamp('ends_at', { withTimezone: true }),
  maxRedemptions: integer('max_redemptions'),
  currentRedemptions: integer('current_redemptions').notNull().default(0),
  createdAt:    timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt:    timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  ventureIdx: index('reward_bundles_venture_idx').on(table.ventureId),
  activeIdx:  index('reward_bundles_active_idx').on(table.ventureId, table.active),
}));
```

---

## Code Examples

### 1. Browse the Reward Catalog

Browse the catalog with filtering, sorting, and personalization for the requesting member.

```typescript
import { createTRPCClient } from '@trpc/client';
import type { RewardsRouter } from '@mcv/engagement/rewards';

const trpc = createTRPCClient<RewardsRouter>({ /* ... */ });

// Browse all active digital rewards, sorted by popularity
const catalog = await trpc.rewards.browseCatalog.query({
  ventureId: 'venture_edgerunners',
  memberId: 'member_abc123',          // For personalization + eligibility
  type: 'digital',
  sortBy: 'popular',
  inStockOnly: true,
  eligibleOnly: false,                // Show all, but mark ineligible ones
  limit: 20,
});

console.log(`Showing ${catalog.items.length} of ${catalog.total} rewards`);

for (const reward of catalog.items) {
  console.log(`
    ${reward.name} — ${reward.effectivePointCost} pts
    ${reward.originalPointCost ? `Was: ${reward.originalPointCost} pts` : ''}
    ${reward.pricingBadge ?? ''}
    Status: ${reward.stockStatus}
    Eligible: ${reward.eligible ? '✓' : `✗ (${reward.eligibilityReason})`}
    ${reward.favorited ? '❤️ Favorited' : ''}
  `);
}

// Browse by category
const merchRewards = await trpc.rewards.browseCatalog.query({
  ventureId: 'venture_edgerunners',
  categoryId: 'cat_merchandise',
  sortBy: 'newest',
  limit: 12,
});

// Get featured rewards for the hero carousel
const featured = await trpc.rewards.getFeaturedRewards.query({
  ventureId: 'venture_edgerunners',
  limit: 5,
});

// Search by text
const searchResults = await trpc.rewards.searchRewards.query({
  ventureId: 'venture_edgerunners',
  query: 'premium hoodie',
  type: 'physical',
  limit: 10,
});

// Get category tree for navigation
const categories = await trpc.rewards.getCategories.query({
  ventureId: 'venture_edgerunners',
});

for (const cat of categories) {
  console.log(`${cat.icon} ${cat.name} (${cat.rewardCount} rewards)`);
}
```

### 2. Redeem a Single Reward

Execute a single-reward redemption with full eligibility check, balance verification, and fulfillment dispatch.

```typescript
import { RewardService } from '@mcv/engagement/rewards';
import { v4 as uuid } from 'uuid';

const rewardService = container.resolve(RewardService);

const memberId = 'member_abc123';
const rewardId = 'reward_premium_hoodie';
const ventureId = 'venture_edgerunners';

// Step 1: Check eligibility before showing the "Redeem" button
const eligibility = await rewardService.checkEligibility({
  rewardId,
  memberId,
  ventureId,
});

if (!eligibility.eligible) {
  for (const reason of eligibility.reasons.filter(r => !r.passed)) {
    console.log(`❌ ${reason.message}`);
    if (reason.unlockHint) {
      console.log(`   💡 ${reason.unlockHint}`);
    }
  }
  return;
}

if (!eligibility.balanceSufficient) {
  console.log(`Insufficient points: ${eligibility.currentBalance} / ${eligibility.requiredBalance}`);
  return;
}

// Step 2: Resolve effective price (may differ from base due to flash sales, tier discounts, etc.)
const pricing = await rewardService.resolvePrice({
  rewardId,
  memberId,
  ventureId,
  quantity: 1,
});

console.log(`Price: ${pricing.effectivePrice} pts`);
if (pricing.savingsDisplay) {
  console.log(`💰 ${pricing.savingsDisplay}`);
}
for (const rule of pricing.appliedRules) {
  console.log(`  Applied: ${rule.description} (-${rule.discountAmount} pts)`);
}

// Step 3: Redeem
const idempotencyKey = uuid(); // Client generates, prevents double-redemption

try {
  const redemption = await rewardService.redeem({
    rewardId,
    memberId,
    ventureId,
    quantity: 1,
    idempotencyKey,
    shippingAddress: {
      fullName: 'Jane Doe',
      line1: '123 Main St',
      line2: 'Apt 4B',
      city: 'Toronto',
      state: 'ON',
      postalCode: 'M5V 2A8',
      country: 'CA',
      phone: '+1-416-555-0123',
    },
    deliveryNotes: 'Please leave at the front desk',
  });

  console.log(`✅ Redemption successful!`);
  console.log(`   ID: ${redemption.id}`);
  console.log(`   Confirmation: ${redemption.receipt.confirmationCode}`);
  console.log(`   Points spent: ${redemption.totalPointCost}`);
  console.log(`   Estimated delivery: ${redemption.receipt.estimatedDelivery}`);
  console.log(`   Fulfillment job: ${redemption.fulfillmentJobId}`);

} catch (error) {
  if (error.code === 'REWARD_OUT_OF_STOCK') {
    // Offer to join waitlist
    await rewardService.joinWaitlist({ rewardId, memberId, ventureId });
    console.log('Added to waitlist — we\'ll notify you when it\'s back!');
  } else if (error.code === 'INSUFFICIENT_POINTS') {
    console.log(`Need ${error.data.required - error.data.current} more points`);
  } else {
    throw error;
  }
}
```

### 3. Cart-Based Multi-Reward Redemption

Use the cart system for multi-item redemption in a single transaction.

```typescript
import { RewardService } from '@mcv/engagement/rewards';

const rewardService = container.resolve(RewardService);
const memberId = 'member_abc123';
const ventureId = 'venture_edgerunners';

// Create a cart
const cart = await rewardService.createCart({ memberId, ventureId });
console.log(`Cart created: ${cart.id} (expires: ${cart.expiresAt})`);

// Add items
let updatedCart = await rewardService.addToCart({
  cartId: cart.id,
  rewardId: 'reward_premium_hoodie',
  quantity: 1,
});

updatedCart = await rewardService.addToCart({
  cartId: cart.id,
  rewardId: 'reward_sticker_pack',
  quantity: 3,
});

updatedCart = await rewardService.addToCart({
  cartId: cart.id,
  rewardId: 'reward_discord_role',
  quantity: 1,
});

// Review cart
console.log(`Cart summary (${updatedCart.items.length} items):`);
for (const item of updatedCart.items) {
  const status = item.eligible ? '✓' : `✗ ${item.ineligibleReason}`;
  console.log(`  ${item.rewardId} × ${item.quantity} = ${item.lineTotal} pts [${status}]`);
}
console.log(`Total: ${updatedCart.totalPointCost} pts`);

// Check for ineligible items
const ineligibleItems = updatedCart.items.filter(i => !i.eligible);
if (ineligibleItems.length > 0) {
  console.log('Removing ineligible items...');
  for (const item of ineligibleItems) {
    updatedCart = await rewardService.removeFromCart({
      cartId: cart.id,
      itemId: item.id,
    });
  }
}

// Checkout — atomically redeems all items
try {
  const redemptions = await rewardService.checkoutCart({
    cartId: cart.id,
    shippingAddress: {
      fullName: 'Jane Doe',
      line1: '123 Main St',
      line2: null,
      city: 'Toronto',
      state: 'ON',
      postalCode: 'M5V 2A8',
      country: 'CA',
      phone: null,
    },
    idempotencyKey: crypto.randomUUID(),
  });

  console.log(`✅ ${redemptions.length} redemptions completed!`);
  for (const r of redemptions) {
    console.log(`  ${r.id}: ${r.rewardSnapshot.name} — ${r.totalPointCost} pts`);
  }
} catch (error) {
  if (error.code === 'CART_PARTIAL_FAILURE') {
    // Cart redemption is atomic — if any item fails, ALL are rolled back
    console.log('Cart checkout failed — no points were deducted.');
    console.log(`Reason: ${error.message}`);
    console.log(`Failed item: ${error.data.failedRewardId}`);
  }
}
```

### 4. Manage Reward Inventory

Inventory operations for catalog managers: restocking, threshold alerts, and waitlist management.

```typescript
import { RewardInventoryService } from '@mcv/engagement/rewards';

const inventoryService = container.resolve(RewardInventoryService);

// Check inventory for a reward
const inventory = await inventoryService.getInventory({
  rewardId: 'reward_limited_edition_pin',
});

console.log(`
  Reward: Limited Edition Pin
  Unlimited: ${inventory.unlimited}
  Total stock: ${inventory.totalStock}
  Available: ${inventory.availableStock}
  Reserved: ${inventory.reservedStock}
  Redeemed: ${inventory.redeemedStock}
  Low stock threshold: ${inventory.lowStockThreshold}
  Alert sent: ${inventory.lowStockAlertSent}
  Waitlist: ${inventory.waitlistCount} members waiting
`);

// Restock
const restocked = await inventoryService.restock({
  rewardId: 'reward_limited_edition_pin',
  quantity: 500,
  reason: 'Q1 2026 production run delivered',
});

console.log(`Restocked! New available: ${restocked.availableStock}`);
// Low stock alert is automatically reset on restock
// Waitlisted members are automatically notified

// Configure low stock alert
await inventoryService.updateAlertConfig({
  rewardId: 'reward_limited_edition_pin',
  lowStockThreshold: 25,
  notifyChannels: ['email', 'slack'],
});

// Bulk inventory check — identify rewards needing attention
const alerts = await inventoryService.getInventoryAlerts({
  ventureId: 'venture_edgerunners',
});

for (const alert of alerts) {
  console.log(`⚠️ ${alert.rewardName}: ${alert.alertType}`);
  console.log(`   Stock: ${alert.availableStock} / threshold: ${alert.lowStockThreshold}`);
}

// Manual inventory adjustment (correction)
await inventoryService.adjust({
  rewardId: 'reward_limited_edition_pin',
  adjustmentType: 'correction',
  quantityChange: -3,   // Found 3 damaged units
  reason: 'Damaged in transit — 3 units written off',
  performedBy: 'admin_user_456',
});

// Inventory audit log
const adjustments = await inventoryService.getAdjustmentHistory({
  rewardId: 'reward_limited_edition_pin',
  limit: 50,
});

for (const adj of adjustments) {
  console.log(`${adj.createdAt}: ${adj.adjustmentType} ${adj.quantityChange > 0 ? '+' : ''}${adj.quantityChange} by ${adj.performedBy} — ${adj.reason}`);
}
```

### 5. Configure Tier-Gated Rewards

Set up access gates so certain rewards are only available to qualifying members.

```typescript
import { RewardService } from '@mcv/engagement/rewards';

const rewardService = container.resolve(RewardService);

// Create a Platinum-only reward
const platinumReward = await rewardService.createReward({
  ventureId: 'venture_edgerunners',
  name: 'VIP Backstage Experience',
  slug: 'vip-backstage-experience',
  shortDescription: 'Exclusive backstage access at our next major event.',
  fullDescription: `
    ## VIP Backstage Experience

    Go behind the scenes at our next flagship event. Meet the team, see how the
    magic happens, and enjoy exclusive refreshments in the green room.

    **Includes:**
    - Backstage tour (1 hour)
    - Meet & greet with speakers
    - Exclusive swag bag
    - Priority seating at the main event

    *Limited to 20 members per event.*
  `,
  type: 'experiential',
  subtype: 'backstage_pass',
  categoryId: 'cat_experiences',
  pointCost: 50000,
  pointCurrencyId: 'edge_points',
  visibility: 'tier_restricted',
  fulfillmentType: 'manual',
  fulfillmentConfig: {
    type: 'manual',
    instructions: 'Send confirmation email with event details and QR code.',
    assigneeTeam: 'events-team',
    estimatedDays: 3,
  },
  imageUrl: 'https://cdn.mcv.one/rewards/backstage-experience.jpg',
  thumbnailUrl: 'https://cdn.mcv.one/rewards/backstage-experience-thumb.jpg',
  galleryUrls: [],
  maxPerMember: 1,
  maxTotal: 20,
  estimatedDelivery: 'Confirmation within 3 business days',
  termsAndConditions: 'Non-transferable. Valid for one event only.',
  tags: ['vip', 'exclusive', 'experience', 'event'],
});

// Add tier gate — Platinum or Diamond only
await rewardService.createGate({
  rewardId: platinumReward.id,
  ventureId: 'venture_edgerunners',
  operator: 'AND',
  conditions: [
    {
      type: 'tier',
      minimumTier: 'platinum',
      allowedTierIds: ['tier_platinum', 'tier_diamond'],
    },
    {
      type: 'redemption_count',
      maxPerMember: 1,
      windowDays: null,   // Lifetime limit
    },
  ],
  displayText: 'Available to Platinum and Diamond members only',
  showWhenLocked: true,   // Show in catalog with lock icon for non-qualifying members
});

// Create a reward that requires specific achievements
await rewardService.createGate({
  rewardId: 'reward_collectors_edition',
  ventureId: 'venture_edgerunners',
  operator: 'AND',
  conditions: [
    {
      type: 'achievement',
      requiredAchievementIds: [
        'achievement_first_purchase',
        'achievement_10_referrals',
        'achievement_community_contributor',
      ],
      requireAll: true,   // Must have ALL three achievements
    },
    {
      type: 'level',
      minimumLevel: 25,
    },
  ],
  displayText: 'Unlock by reaching Level 25 and completing the Community Trifecta achievements',
  showWhenLocked: true,
});

// Time-windowed reward (only available on weekends)
await rewardService.createGate({
  rewardId: 'reward_weekend_bonus',
  ventureId: 'venture_edgerunners',
  operator: 'AND',
  conditions: [
    {
      type: 'time_window',
      startTime: new Date('2026-01-01T00:00:00Z'),
      endTime: new Date('2026-12-31T23:59:59Z'),
      timezone: 'America/Toronto',
      recurrence: 'weekly:saturday-sunday',
    },
  ],
  displayText: 'Weekend-only reward! Available Saturday and Sunday.',
  showWhenLocked: true,
});
```

### 6. Flash Sale Pricing

Create and manage flash sales with time-limited pricing, urgency counters, and redemption caps.

```typescript
import { RewardPricingService } from '@mcv/engagement/rewards';

const pricingService = container.resolve(RewardPricingService);

// Create a flash sale — 50% off select rewards for 24 hours
const flashSale = await pricingService.createFlashSale({
  ventureId: 'venture_edgerunners',
  name: 'Weekend Flash Sale ⚡',
  description: 'Massive discounts on fan-favorite rewards!',
  rewardIds: [
    'reward_premium_hoodie',
    'reward_sticker_pack',
    'reward_digital_art_bundle',
  ],
  discountPercent: 50,
  maxRedemptionsPerReward: 100,   // First 100 per reward
  startsAt: new Date('2026-02-14T00:00:00-05:00'),
  endsAt: new Date('2026-02-15T00:00:00-05:00'),
  bannerImageUrl: 'https://cdn.mcv.one/sales/weekend-flash-feb.jpg',
  active: true,
});

console.log(`Flash sale created: ${flashSale.id}`);

// The pricing service automatically applies flash sale pricing:
const price = await pricingService.resolvePrice({
  rewardId: 'reward_premium_hoodie',
  memberId: 'member_abc123',
  ventureId: 'venture_edgerunners',
});

// Output during sale:
// {
//   basePrice: 5000,
//   effectivePrice: 2500,
//   discount: 2500,
//   appliedRules: [{
//     ruleId: 'flash_abc',
//     ruleType: 'flash_sale',
//     discountAmount: 2500,
//     description: '⚡ Weekend Flash Sale — 50% off!'
//   }],
//   savingsDisplay: 'Save 2,500 pts!'
// }

// Create demand-based pricing (price increases as more people redeem)
await pricingService.createPricingRule({
  rewardId: 'reward_limited_nft',
  ventureId: 'venture_edgerunners',
  ruleType: 'demand_based',
  config: {
    type: 'demand_based',
    basePrice: 10000,
    minPrice: 10000,
    maxPrice: 50000,
    priceIncrementPerRedemption: 500,   // +500 pts for each redemption
    windowHours: 24,
    redemptionThreshold: 5,             // Starts increasing after 5 in window
  },
  priority: 1,
  active: true,
  startsAt: new Date(),
});

// Create tier-specific discounts
await pricingService.createPricingRule({
  ventureId: 'venture_edgerunners',
  categoryId: 'cat_merchandise',   // Applies to all merch
  ruleType: 'tier_discount',
  config: {
    type: 'tier_discount',
    tierDiscounts: [
      { tierId: 'tier_gold', tierName: 'Gold', percentOff: 10 },
      { tierId: 'tier_platinum', tierName: 'Platinum', percentOff: 20 },
      { tierId: 'tier_diamond', tierName: 'Diamond', percentOff: 30 },
    ],
  },
  priority: 5,
  active: true,
  startsAt: new Date(),
});

// Get all active flash sales (for displaying on the catalog page)
const activeSales = await pricingService.getActiveFlashSales({
  ventureId: 'venture_edgerunners',
});

for (const sale of activeSales) {
  const timeLeft = sale.endsAt.getTime() - Date.now();
  const hoursLeft = Math.floor(timeLeft / (1000 * 60 * 60));
  console.log(`⚡ ${sale.name} — ${hoursLeft}h remaining — ${sale.discountPercent}% off`);
}
```

### 7. Partner Reward Integration

Integrate third-party reward providers (e.g., gift card APIs) into the catalog.

```typescript
import { PartnerRewardService } from '@mcv/engagement/rewards';

const partnerService = container.resolve(PartnerRewardService);

// Register a new partner (e.g., Tango Card for gift cards)
const partnerConfig = await partnerService.registerPartner({
  partnerId: 'tango_card',
  partnerName: 'Tango Card',
  apiBaseUrl: 'https://integration-api.tangocard.com/raas/v2',
  authMethod: 'api_key',
  credentials: {
    apiKey: process.env.TANGO_CARD_API_KEY!,
  },
  rateLimitPerMinute: 60,
  timeoutMs: 10000,
  retryConfig: {
    maxRetries: 3,
    backoffMultiplier: 2,
    initialDelayMs: 1000,
  },
  webhookUrl: 'https://api.mcv.one/webhooks/tango-card',
  webhookSecret: process.env.TANGO_CARD_WEBHOOK_SECRET!,
});

// Import a gift card into the catalog
const giftCardReward = await partnerService.importPartnerReward({
  ventureId: 'venture_edgerunners',
  partnerId: 'tango_card',
  partnerItemId: 'amazon_gift_card_25',
  partnerCategory: 'Gift Cards',
  partnerCostCents: 2500,         // $25 wholesale cost
  partnerCostCurrency: 'USD',
  revenueSharePercent: 5,
  reward: {
    name: 'Amazon Gift Card ($25)',
    slug: 'amazon-gift-card-25',
    shortDescription: 'A $25 Amazon.com gift card delivered instantly to your email.',
    fullDescription: 'Redeem for a $25 Amazon.com electronic gift card. Delivered instantly via email. Valid for purchases on Amazon.com (US only).',
    type: 'digital',
    subtype: 'gift_card',
    categoryId: 'cat_gift_cards',
    pointCost: 25000,
    pointCurrencyId: 'edge_points',
    fulfillmentType: 'partner_api',
    imageUrl: 'https://cdn.mcv.one/rewards/amazon-gc-25.jpg',
    thumbnailUrl: 'https://cdn.mcv.one/rewards/amazon-gc-25-thumb.jpg',
    estimatedDelivery: 'Instant (email delivery)',
    termsAndConditions: 'Issued by Amazon. Subject to Amazon Gift Card Terms and Conditions.',
    tags: ['gift-card', 'amazon', 'instant'],
  },
  inventorySyncEnabled: true,     // Sync inventory from Tango
});

console.log(`Partner reward imported: ${giftCardReward.id}`);

// Sync partner inventory (runs on schedule, but can be triggered manually)
await partnerService.syncInventory({ partnerId: 'tango_card' });

// Check partner health
const partnerHealth = await partnerService.getPartnerHealth({
  partnerId: 'tango_card',
});

console.log(`
  Partner: ${partnerHealth.partnerName}
  Status: ${partnerHealth.circuitBreakerState}
  Recent errors: ${partnerHealth.recentErrorCount}
  Success rate (24h): ${partnerHealth.successRate24h}%
  Avg response time: ${partnerHealth.avgResponseTimeMs}ms
`);

// If circuit breaker is open, the partner's rewards are temporarily
// marked as unavailable in the catalog (graceful degradation).

// Manual circuit breaker reset (after investigating the issue)
if (partnerHealth.circuitBreakerState === 'open') {
  await partnerService.resetCircuitBreaker({ partnerId: 'tango_card' });
}
```

### 8. Reward Analytics Dashboard

Pull comprehensive analytics for the rewards program.

```typescript
import { RewardAnalyticsService } from '@mcv/engagement/rewards';

const analyticsService = container.resolve(RewardAnalyticsService);

// Get full analytics for the last 30 days
const analytics = await analyticsService.getAnalytics({
  ventureId: 'venture_edgerunners',
  startDate: new Date('2026-01-09'),
  endDate: new Date('2026-02-08'),
  granularity: 'day',
});

// Redemption overview
const { redemptions } = analytics;
console.log(`
  === Redemption Overview ===
  Total redemptions: ${redemptions.totalRedemptions}
  Unique redeemers: ${redemptions.uniqueRedeemers}
  Points spent: ${redemptions.totalPointsSpent.toLocaleString()}
  Avg cost: ${redemptions.averagePointCost.toLocaleString()} pts
  Success rate: ${(redemptions.successRate * 100).toFixed(1)}%
  Refund rate: ${(redemptions.refundRate * 100).toFixed(1)}%

  By type:
    Digital: ${redemptions.byType.digital}
    Physical: ${redemptions.byType.physical}
    Experiential: ${redemptions.byType.experiential}
    Token: ${redemptions.byType.token}
`);

// Catalog health
const { catalogHealth } = analytics;
console.log(`
  === Catalog Health ===
  Active rewards: ${catalogHealth.totalActiveRewards}
  Zero-redemption rewards: ${catalogHealth.zeroRedemptionRewards}
  Catalog utilization: ${(catalogHealth.catalogUtilizationRate * 100).toFixed(1)}%
  Average rating: ${catalogHealth.averageRating.toFixed(2)}/5
  Out of stock: ${catalogHealth.outOfStockCount}
  Low stock: ${catalogHealth.lowStockCount}
  Expiring soon: ${catalogHealth.expiringSoonCount}
`);

// Top rewards
console.log(`\n  === Top Rewards ===`);
for (const reward of analytics.topRewards.slice(0, 10)) {
  console.log(`  #${reward.rank} ${reward.rewardName} (${reward.type})`);
  console.log(`     Redemptions: ${reward.redemptionCount} | Points: ${reward.totalPointsSpent.toLocaleString()}`);
}

// Breakage analysis
const { breakage } = analytics;
console.log(`
  === Breakage Report ===
  Total breakage: ${breakage.totalBreakagePoints.toLocaleString()} pts
  Breakage rate: ${(breakage.breakageRate * 100).toFixed(1)}%
  Est. value: $${breakage.estimatedBreakageValue.toLocaleString()}

  Points expiring:
    Next 30 days: ${breakage.expiringPoints.next30Days.toLocaleString()}
    Next 60 days: ${breakage.expiringPoints.next60Days.toLocaleString()}
    Next 90 days: ${breakage.expiringPoints.next90Days.toLocaleString()}
`);

// Fulfillment performance
const { fulfillmentPerformance } = analytics;
console.log(`
  === Fulfillment ===
  Queue depth: ${fulfillmentPerformance.queueDepth}
  Retrying: ${fulfillmentPerformance.retryingCount}
  Manual review: ${fulfillmentPerformance.manualReviewCount}
  Dead-letter queue: ${fulfillmentPerformance.dlqSize}
`);

// ROI analysis for a specific reward
const roi = await analyticsService.getRewardROI({
  rewardId: 'reward_premium_hoodie',
  ventureId: 'venture_edgerunners',
  period: {
    start: new Date('2025-08-01'),
    end: new Date('2026-02-08'),
  },
});

console.log(`
  === Reward ROI: ${roi.rewardName} ===
  Cost per unit: $${roi.costPerUnit.toFixed(2)}
  Point value redeemed: $${roi.pointValuePerUnit.toFixed(2)}
  Post-redemption engagement: ${roi.postRedemptionEngagement} actions/member
  Redeemer retention: ${(roi.redeemberRetentionRate * 100).toFixed(1)}%
  ROI: ${(roi.roi * 100).toFixed(1)}%
`);

// Trend visualization data
for (const point of analytics.redemptions.trend) {
  const bar = '█'.repeat(Math.ceil(point.count / 10));
  console.log(`  ${point.date}: ${bar} ${point.count} redemptions (${point.points.toLocaleString()} pts)`);
}
```

---

## Error Codes

All errors thrown by `@mcv/engagement/rewards` follow the MCV standard error format with structured error codes, HTTP-compatible status codes, and machine-readable data payloads.

| Code | HTTP | Description | Data Payload |
|------|------|-------------|--------------|
| `REWARD_NOT_FOUND` | 404 | Reward ID or slug does not exist or is not accessible in this venture. | `{ rewardId, ventureId }` |
| `REWARD_INACTIVE` | 410 | Reward exists but is not in `active` status (draft, paused, archived, expired). | `{ rewardId, currentStatus }` |
| `REWARD_NOT_AVAILABLE` | 409 | Reward is outside its availability window (`availableFrom` / `availableUntil`). | `{ rewardId, availableFrom, availableUntil, now }` |
| `CATEGORY_NOT_FOUND` | 404 | Reward category does not exist. | `{ categoryId, ventureId }` |
| `INSUFFICIENT_POINTS` | 402 | Member does not have enough points to redeem. | `{ required, current, currencyId, shortfall }` |
| `REWARD_OUT_OF_STOCK` | 409 | Reward inventory is depleted. | `{ rewardId, waitlistEnabled, waitlistCount }` |
| `INVENTORY_RESERVATION_FAILED` | 409 | Could not reserve inventory (concurrent depletion). | `{ rewardId, requestedQuantity, availableStock }` |
| `REDEMPTION_LIMIT_REACHED` | 429 | Member has reached the per-member redemption limit for this reward. | `{ rewardId, memberId, limit, currentCount }` |
| `REDEMPTION_RATE_LIMITED` | 429 | Member has exceeded the maximum redemptions per hour. | `{ memberId, limit, windowMinutes, retryAfter }` |
| `GATE_NOT_SATISFIED` | 403 | Member does not meet one or more access gates for this reward. | `{ rewardId, failedGates: [{ type, message, unlockHint }] }` |
| `TIER_GATE_FAILED` | 403 | Member's loyalty tier does not qualify. | `{ currentTier, requiredTier, requiredTierIds }` |
| `LEVEL_GATE_FAILED` | 403 | Member's level is too low. | `{ currentLevel, requiredLevel }` |
| `ACHIEVEMENT_GATE_FAILED` | 403 | Member is missing required achievements. | `{ missingAchievements: string[] }` |
| `SEGMENT_GATE_FAILED` | 403 | Member is not in a required segment. | `{ memberSegments, requiredSegments }` |
| `IDEMPOTENCY_CONFLICT` | 409 | A redemption with this idempotency key already exists. | `{ idempotencyKey, existingRedemptionId }` |
| `CART_NOT_FOUND` | 404 | Redemption cart does not exist. | `{ cartId }` |
| `CART_EXPIRED` | 410 | Cart has expired due to inactivity. | `{ cartId, expiredAt }` |
| `CART_ALREADY_CHECKED_OUT` | 409 | Cart has already been checked out. | `{ cartId, checkedOutAt }` |
| `CART_EMPTY` | 400 | Cannot checkout an empty cart. | `{ cartId }` |
| `CART_MAX_ITEMS_EXCEEDED` | 400 | Cart has exceeded the maximum number of items. | `{ cartId, maxItems, currentItems }` |
| `CART_PARTIAL_FAILURE` | 409 | One or more cart items failed validation during checkout (entire cart rolled back). | `{ cartId, failedRewardId, reason }` |
| `FULFILLMENT_NOT_FOUND` | 404 | Fulfillment job does not exist. | `{ jobId }` |
| `FULFILLMENT_ALREADY_COMPLETED` | 409 | Cannot retry or cancel a completed fulfillment. | `{ jobId, status }` |
| `FULFILLMENT_MAX_RETRIES` | 500 | Fulfillment has exhausted all retry attempts. | `{ jobId, attemptCount, maxAttempts, lastError }` |
| `FULFILLMENT_TIMEOUT` | 504 | Fulfillment job exceeded its processing deadline. | `{ jobId, timeoutAt }` |
| `PARTNER_API_ERROR` | 502 | Partner API returned an error during fulfillment. | `{ partnerId, statusCode, errorMessage }` |
| `PARTNER_CIRCUIT_OPEN` | 503 | Partner circuit breaker is open; partner rewards temporarily unavailable. | `{ partnerId, partnerName, openedAt }` |
| `PARTNER_RATE_LIMITED` | 429 | Partner API rate limit exceeded. | `{ partnerId, retryAfterMs }` |
| `PRICING_RULE_CONFLICT` | 409 | Conflicting pricing rules detected for the same reward/period. | `{ ruleIds, conflictType }` |
| `FLASH_SALE_EXHAUSTED` | 410 | Flash sale redemption cap has been reached. | `{ flashSaleId, maxRedemptions }` |
| `SHIPPING_ADDRESS_REQUIRED` | 400 | Physical reward requires a shipping address. | `{ rewardId, fulfillmentType }` |
| `SHIPPING_ADDRESS_INVALID` | 400 | Shipping address failed validation. | `{ field, message }` |
| `REFUND_NOT_ELIGIBLE` | 409 | Redemption is not eligible for refund (already fulfilled, already refunded, etc.). | `{ redemptionId, status, reason }` |
| `REWARD_SLUG_TAKEN` | 409 | Another reward in this venture already uses this slug. | `{ slug, ventureId }` |
| `WAITLIST_ALREADY_JOINED` | 409 | Member is already on the waitlist for this reward. | `{ rewardId, memberId, position }` |
| `WAITLIST_NOT_ENABLED` | 400 | Waitlist is not enabled for this reward. | `{ rewardId }` |

### Error Response Format

```typescript
interface RewardError {
  code: string;            // Machine-readable error code (e.g., 'INSUFFICIENT_POINTS')
  message: string;         // Human-readable description
  statusCode: number;      // HTTP status code
  data: Record<string, unknown>;  // Structured error context
  timestamp: string;       // ISO 8601 timestamp
  requestId: string;       // Trace ID for debugging
}

// Example error response:
{
  code: 'INSUFFICIENT_POINTS',
  message: 'You need 3,000 more points to redeem this reward.',
  statusCode: 402,
  data: {
    required: 5000,
    current: 2000,
    currencyId: 'edge_points',
    shortfall: 3000,
  },
  timestamp: '2026-02-08T23:18:00.000Z',
  requestId: 'req_01JKWX9QZ3'
}
```

---

## Security

### Row-Level Security

All database tables enforce multi-tenant isolation via Supabase RLS policies. The `venture_id` is extracted from the authenticated user's JWT claims and automatically scoped in every query.

```sql
-- Example RLS policy for rewards table
CREATE POLICY "Rewards are scoped to venture" ON rewards
  USING (venture_id = current_setting('app.venture_id')::text);

CREATE POLICY "Admins can manage rewards" ON rewards
  FOR ALL
  USING (
    venture_id = current_setting('app.venture_id')::text
    AND current_setting('app.user_role')::text IN ('admin', 'catalog_manager')
  );

-- Members can only read active, public rewards
CREATE POLICY "Members can view active rewards" ON rewards
  FOR SELECT
  USING (
    venture_id = current_setting('app.venture_id')::text
    AND status = 'active'
    AND (visibility = 'public' OR visibility = 'tier_restricted')
  );

-- Redemptions are private to the member
CREATE POLICY "Members see own redemptions" ON redemptions
  FOR SELECT
  USING (
    venture_id = current_setting('app.venture_id')::text
    AND member_id = current_setting('app.user_id')::text
  );

-- Fulfillment jobs: only admins and the member can view
CREATE POLICY "Fulfillment visible to member and admin" ON fulfillment_jobs
  FOR SELECT
  USING (
    venture_id = current_setting('app.venture_id')::text
    AND (
      member_id = current_setting('app.user_id')::text
      OR current_setting('app.user_role')::text IN ('admin', 'fulfillment_manager')
    )
  );
```

### Redemption Security

- **Idempotency keys** — Every redemption requires a unique idempotency key. Duplicate submissions within the TTL window (default: 24 hours) return the original result without re-executing.
- **Rate limiting** — Members are rate-limited to `MAX_REDEMPTIONS_PER_HOUR` (default: 20) redemptions per rolling hour to prevent abuse and automated draining.
- **Distributed locking** — Inventory reservation uses `SELECT ... FOR UPDATE SKIP LOCKED` to prevent overselling under concurrent load. A Redis-based distributed lock provides an additional layer for cross-instance coordination.
- **Balance atomicity** — Point deduction is wrapped in a database transaction with the redemption record write. If either fails, both are rolled back.
- **Fraud signals** — IP address, user agent, and redemption velocity are captured on every redemption for downstream fraud analysis.
- **Reward snapshots** — A snapshot of the reward at redemption time is stored in the redemption record, ensuring historical accuracy even if the reward is later modified or archived.

### Fulfillment Security

- **Encrypted credentials** — Partner API credentials and gift card codes are encrypted at rest using AES-256-GCM. Decryption keys are stored in a separate secrets manager.
- **Code isolation** — Digital fulfillment codes are generated/fetched at fulfillment time and delivered directly to the member. Codes are never stored in plaintext in the main database; they are encrypted immediately after generation and decrypted only during the delivery step.
- **Audit logging** — Every fulfillment state transition is logged with the processor ID, timestamp, and outcome. The full error log is retained for debugging.
- **Dead-letter queue** — Failed fulfillments that exhaust all retries are moved to a dead-letter queue. The DLQ triggers an alert to the operations team and requires manual intervention to resolve.
- **Token transfer safety** — EDGE token transfers require a secondary confirmation step and are subject to daily transfer limits per member. Large transfers (above configurable threshold) require admin approval.

### Partner Security

- **Circuit breaker** — Each partner integration has a circuit breaker that opens after a configurable number of consecutive failures (default: 5). When open, the partner's rewards are temporarily marked as unavailable rather than failing redemptions.
- **HMAC validation** — Partner webhook payloads are validated using HMAC-SHA256 signatures to prevent tampering.
- **Rate limiting** — Outbound partner API calls are rate-limited per the partner's documented limits, with a configurable safety margin.
- **Credential rotation** — Partner API credentials are rotated on a configurable schedule. Old credentials are revoked after a grace period.
- **IP allowlisting** — Partner webhook endpoints can be configured to only accept requests from MCV's outbound IP ranges.

### Input Validation

```typescript
// All inputs are validated with Zod schemas before processing
const redemptionCreateSchema = z.object({
  rewardId: z.string().ulid(),
  memberId: z.string().ulid(),
  ventureId: z.string().min(1),
  quantity: z.number().int().min(1).max(100),
  idempotencyKey: z.string().uuid(),
  shippingAddress: shippingAddressSchema.optional(),
  deliveryEmail: z.string().email().optional(),
  deliveryNotes: z.string().max(500).optional(),
});

const shippingAddressSchema = z.object({
  fullName: z.string().min(1).max(200),
  line1: z.string().min(1).max(200),
  line2: z.string().max(200).nullable(),
  city: z.string().min(1).max(100),
  state: z.string().min(1).max(100),
  postalCode: z.string().min(1).max(20),
  country: z.string().length(2),    // ISO 3166-1 alpha-2
  phone: z.string().max(20).nullable(),
});
```

---

## Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `SUPABASE_URL` | ✅ | — | Supabase project URL for database and auth. |
| `SUPABASE_SERVICE_ROLE_KEY` | ✅ | — | Service role key for server-side operations (bypasses RLS for admin tasks). |
| `DATABASE_URL` | ✅ | — | Direct PostgreSQL connection string for Drizzle ORM. |
| `REDPANDA_BROKERS` | ✅ | — | Comma-separated Redpanda broker addresses. |
| `REDPANDA_SASL_USERNAME` | ❌ | — | SASL username for Redpanda authentication. |
| `REDPANDA_SASL_PASSWORD` | ❌ | — | SASL password for Redpanda authentication. |
| `REDIS_URL` | ✅ | — | Redis connection string for distributed locks and rate limiting. |
| `REWARDS_ENCRYPTION_KEY` | ✅ | — | AES-256 encryption key for partner credentials and fulfillment codes (base64). |
| `REWARDS_IDEMPOTENCY_TTL_MS` | ❌ | `86400000` | Idempotency key TTL in milliseconds (default: 24 hours). |
| `REWARDS_MAX_CART_ITEMS` | ❌ | `20` | Maximum items per redemption cart. |
| `REWARDS_MAX_REDEMPTIONS_PER_HOUR` | ❌ | `20` | Rate limit: max redemptions per member per rolling hour. |
| `REWARDS_REDEMPTION_LOCK_TTL_MS` | ❌ | `30000` | Distributed lock TTL for inventory reservation (default: 30s). |
| `REWARDS_FULFILLMENT_MAX_RETRIES` | ❌ | `5` | Maximum fulfillment retry attempts before dead-letter. |
| `REWARDS_FULFILLMENT_RETRY_BACKOFF_MS` | ❌ | `1000` | Initial retry backoff in milliseconds (multiplied exponentially). |
| `REWARDS_FULFILLMENT_TIMEOUT_MS` | ❌ | `3600000` | Fulfillment job timeout (default: 1 hour). |
| `REWARDS_LOW_STOCK_THRESHOLD` | ❌ | `10` | Default low-stock alert threshold for new rewards. |
| `REWARDS_CART_EXPIRY_MINUTES` | ❌ | `30` | Cart auto-expiration time in minutes. |
| `REWARDS_RECOMMENDATION_REFRESH_HOURS` | ❌ | `24` | How often to refresh member recommendations. |
| `REWARDS_CIRCUIT_BREAKER_THRESHOLD` | ❌ | `5` | Consecutive partner failures before circuit opens. |
| `REWARDS_CIRCUIT_BREAKER_TIMEOUT_MS` | ❌ | `60000` | Time before circuit breaker transitions to half-open. |
| `TANGO_CARD_API_KEY` | ❌ | — | Tango Card API key (for gift card partner integration). |
| `TANGO_CARD_WEBHOOK_SECRET` | ❌ | — | HMAC secret for Tango Card webhook validation. |
| `SHIPPING_PROVIDER_API_KEY` | ❌ | — | API key for shipping label generation provider. |
| `SHIPPING_PROVIDER_WEBHOOK_SECRET` | ❌ | — | HMAC secret for shipping provider webhook validation. |
| `CDN_BASE_URL` | ❌ | `https://cdn.mcv.one` | Base URL for reward images and assets. |
| `EMAIL_SERVICE_URL` | ❌ | — | URL for the email delivery service (for digital fulfillment). |
| `REWARDS_TOKEN_TRANSFER_DAILY_LIMIT` | ❌ | `100000` | Daily EDGE token transfer limit per member. |
| `REWARDS_TOKEN_TRANSFER_ADMIN_THRESHOLD` | ❌ | `50000` | Token transfer amount requiring admin approval. |

---

## Dependencies

### Internal Dependencies

| Package | Purpose |
|---------|---------|
| `@mcv/core` | Base types, error classes, logging, configuration |
| `@mcv/auth` | Authentication context, JWT claims extraction, role verification |
| `@mcv/db` | Drizzle ORM instance, transaction helpers, migration utilities |
| `@mcv/events` | Redpanda producer/consumer wrappers, event serialization |
| `@mcv/ids` | ULID generation for primary keys |
| `@mcv/engagement/points` | Point balance queries and deductions (used during redemption) |
| `@mcv/engagement/tiers` | Tier lookup for gate evaluation |
| `@mcv/engagement/achievements` | Achievement completion check for gate evaluation |
| `@mcv/engagement/segments` | Segment membership check for gate evaluation |
| `@mcv/notifications` | Push/email notifications for fulfillment updates and waitlist alerts |
| `@mcv/email` | Email template rendering and delivery for digital fulfillment |
| `@mcv/crypto` | AES-256-GCM encryption/decryption for credentials and codes |
| `@mcv/cache` | Redis-based caching for catalog queries and pricing resolution |
| `@mcv/rate-limit` | Rate limiting for redemption endpoints |

### External Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| `drizzle-orm` | `^0.34` | Type-safe SQL query builder and ORM |
| `@trpc/server` | `^11` | Type-safe API layer |
| `zod` | `^3.23` | Runtime schema validation |
| `ioredis` | `^5.4` | Redis client for distributed locks and caching |
| `kafkajs` | `^2.2` | Redpanda/Kafka client for event streaming |
| `luxon` | `^3.5` | Date/time handling for time-window gates and scheduling |
| `nanoid` | `^5` | Short ID generation for confirmation codes |
| `p-queue` | `^8` | Concurrency-limited promise queue for fulfillment workers |
| `p-retry` | `^6` | Retry logic with exponential backoff |
| `circuit-breaker-js` | `^0.5` | Circuit breaker pattern for partner integrations |

---

## Testing

### Unit Tests

Unit tests cover individual service methods with mocked dependencies. They verify business logic without database or event bus connectivity.

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { RedemptionService } from '../services/redemption.service';
import { RewardInventoryService } from '../services/inventory.service';
import { RewardPricingService } from '../services/pricing.service';

describe('RedemptionService', () => {
  let redemptionService: RedemptionService;
  let mockInventory: ReturnType<typeof vi.mocked<RewardInventoryService>>;
  let mockPricing: ReturnType<typeof vi.mocked<RewardPricingService>>;
  let mockPointsService: any;
  let mockEventProducer: any;
  let mockDb: any;

  beforeEach(() => {
    mockInventory = {
      reserve: vi.fn().mockResolvedValue({ success: true, version: 1 }),
      release: vi.fn().mockResolvedValue(undefined),
    } as any;

    mockPricing = {
      resolvePrice: vi.fn().mockResolvedValue({
        basePrice: 5000,
        effectivePrice: 5000,
        discount: 0,
        appliedRules: [],
        savingsDisplay: null,
      }),
    } as any;

    mockPointsService = {
      getBalance: vi.fn().mockResolvedValue({ available: 10000 }),
      deduct: vi.fn().mockResolvedValue({ success: true, newBalance: 5000 }),
      refund: vi.fn().mockResolvedValue({ success: true }),
    };

    mockEventProducer = {
      emit: vi.fn().mockResolvedValue(undefined),
    };

    mockDb = createMockDb();

    redemptionService = new RedemptionService(
      mockDb,
      mockInventory,
      mockPricing,
      mockPointsService,
      mockEventProducer,
    );
  });

  describe('redeem', () => {
    it('should complete a successful redemption', async () => {
      const result = await redemptionService.redeem({
        rewardId: 'reward_abc',
        memberId: 'member_123',
        ventureId: 'venture_test',
        quantity: 1,
        idempotencyKey: 'test-key-123',
      });

      expect(result.status).toBe('completed');
      expect(result.totalPointCost).toBe(5000);
      expect(mockInventory.reserve).toHaveBeenCalledWith({
        rewardId: 'reward_abc',
        quantity: 1,
      });
      expect(mockPointsService.deduct).toHaveBeenCalledWith({
        memberId: 'member_123',
        amount: 5000,
        reason: expect.stringContaining('Redemption'),
      });
      expect(mockEventProducer.emit).toHaveBeenCalledWith(
        'rewards.fulfillment',
        expect.objectContaining({ rewardId: 'reward_abc' }),
      );
    });

    it('should release inventory on point deduction failure', async () => {
      mockPointsService.deduct.mockRejectedValue(new Error('Ledger unavailable'));

      await expect(
        redemptionService.redeem({
          rewardId: 'reward_abc',
          memberId: 'member_123',
          ventureId: 'venture_test',
          quantity: 1,
          idempotencyKey: 'test-key-456',
        }),
      ).rejects.toThrow();

      expect(mockInventory.release).toHaveBeenCalledWith({
        rewardId: 'reward_abc',
        quantity: 1,
        version: 1,
      });
    });

    it('should return existing redemption on duplicate idempotency key', async () => {
      // First call succeeds
      const first = await redemptionService.redeem({
        rewardId: 'reward_abc',
        memberId: 'member_123',
        ventureId: 'venture_test',
        quantity: 1,
        idempotencyKey: 'duplicate-key',
      });

      // Second call with same key returns same result without re-executing
      const second = await redemptionService.redeem({
        rewardId: 'reward_abc',
        memberId: 'member_123',
        ventureId: 'venture_test',
        quantity: 1,
        idempotencyKey: 'duplicate-key',
      });

      expect(second.id).toBe(first.id);
      expect(mockPointsService.deduct).toHaveBeenCalledTimes(1); // Only once
    });

    it('should reject when member exceeds rate limit', async () => {
      // Simulate 20 recent redemptions
      mockDb.redemptions.countRecent.mockResolvedValue(20);

      await expect(
        redemptionService.redeem({
          rewardId: 'reward_abc',
          memberId: 'member_123',
          ventureId: 'venture_test',
          quantity: 1,
          idempotencyKey: 'rate-limited-key',
        }),
      ).rejects.toMatchObject({
        code: 'REDEMPTION_RATE_LIMITED',
      });
    });

    it('should reject when reward is out of stock', async () => {
      mockInventory.reserve.mockResolvedValue({ success: false, reason: 'out_of_stock' });

      await expect(
        redemptionService.redeem({
          rewardId: 'reward_abc',
          memberId: 'member_123',
          ventureId: 'venture_test',
          quantity: 1,
          idempotencyKey: 'oos-key',
        }),
      ).rejects.toMatchObject({
        code: 'REWARD_OUT_OF_STOCK',
      });
    });
  });

  describe('checkEligibility', () => {
    it('should return eligible when all gates pass', async () => {
      const result = await redemptionService.checkEligibility({
        rewardId: 'reward_no_gates',
        memberId: 'member_123',
        ventureId: 'venture_test',
      });

      expect(result.eligible).toBe(true);
      expect(result.balanceSufficient).toBe(true);
      expect(result.inStock).toBe(true);
    });

    it('should return ineligible with detailed gate reasons', async () => {
      mockDb.rewardTiers.findByRewardId.mockResolvedValue([{
        operator: 'AND',
        conditions: [
          { type: 'tier', minimumTier: 'platinum', allowedTierIds: ['tier_platinum'] },
          { type: 'level', minimumLevel: 50 },
        ],
      }]);

      const result = await redemptionService.checkEligibility({
        rewardId: 'reward_gated',
        memberId: 'member_bronze',
        ventureId: 'venture_test',
      });

      expect(result.eligible).toBe(false);
      expect(result.reasons).toContainEqual(
        expect.objectContaining({ gate: 'tier', passed: false }),
      );
    });
  });
});
```

### Integration Tests

Integration tests run against a real database (test Supabase instance) and verify the complete redemption pipeline including RLS policies.

```typescript
import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest';
import { createTestContext } from '@mcv/testing';
import { RewardService } from '../services/reward.service';

describe('Rewards Integration', () => {
  let ctx: TestContext;
  let rewardService: RewardService;

  beforeAll(async () => {
    ctx = await createTestContext({
      modules: ['engagement/rewards', 'engagement/points'],
      seedData: 'rewards-test-seed',
    });
    rewardService = ctx.resolve(RewardService);
  });

  afterAll(() => ctx.cleanup());
  afterEach(() => ctx.resetData());

  it('should complete end-to-end redemption with RLS isolation', async () => {
    // Create reward as admin of venture A
    const reward = await ctx.asAdmin('venture_a', async () => {
      return rewardService.createReward({
        ventureId: 'venture_a',
        name: 'Test Reward',
        slug: 'test-reward',
        shortDescription: 'A test reward',
        fullDescription: 'Full description of test reward',
        type: 'digital',
        subtype: 'coupon_code',
        categoryId: ctx.seedData.categoryId,
        pointCost: 1000,
        pointCurrencyId: 'edge_points',
        fulfillmentType: 'digital_instant',
        fulfillmentConfig: { type: 'digital_instant', codePool: 'test', codeFormat: 'XXXX-XXXX', deliveryMethod: 'email' },
        imageUrl: 'https://test.com/img.jpg',
        thumbnailUrl: 'https://test.com/thumb.jpg',
        estimatedDelivery: 'Instant',
        termsAndConditions: 'Test terms',
        tags: ['test'],
      });
    });

    // Verify venture B cannot see venture A's reward
    const fromVentureB = await ctx.asMember('venture_b', 'member_b1', async () => {
      return rewardService.getReward({ rewardId: reward.id, ventureId: 'venture_b' });
    });
    expect(fromVentureB).toBeNull();

    // Redeem as member of venture A
    const redemption = await ctx.asMember('venture_a', 'member_a1', async () => {
      return rewardService.redeem({
        rewardId: reward.id,
        memberId: 'member_a1',
        ventureId: 'venture_a',
        quantity: 1,
        idempotencyKey: 'int-test-key-1',
      });
    });

    expect(redemption.status).toBe('completed');
    expect(redemption.totalPointCost).toBe(1000);

    // Verify fulfillment job was created
    const fulfillment = await ctx.asAdmin('venture_a', async () => {
      return rewardService.getFulfillmentStatus({ redemptionId: redemption.id });
    });
    expect(fulfillment.status).toBe('queued');
    expect(fulfillment.type).toBe('digital_instant');
  });

  it('should enforce inventory limits under concurrent load', async () => {
    // Create a reward with 5 stock
    const reward = await ctx.asAdmin('venture_a', async () => {
      const r = await rewardService.createReward({
        ventureId: 'venture_a',
        name: 'Limited Stock',
        slug: 'limited-stock',
        shortDescription: 'Only 5 available',
        fullDescription: 'Limited edition test reward',
        type: 'digital',
        subtype: 'digital_download',
        categoryId: ctx.seedData.categoryId,
        pointCost: 100,
        pointCurrencyId: 'edge_points',
        fulfillmentType: 'digital_instant',
        fulfillmentConfig: { type: 'digital_instant', codePool: 'limited', codeFormat: 'XXXX', deliveryMethod: 'in_app' },
        imageUrl: 'https://test.com/img.jpg',
        thumbnailUrl: 'https://test.com/thumb.jpg',
        estimatedDelivery: 'Instant',
        termsAndConditions: 'Test',
        tags: [],
      });
      await rewardService.restock({ rewardId: r.id, quantity: 5, reason: 'Test' });
      return r;
    });

    // Attempt 10 concurrent redemptions — only 5 should succeed
    const results = await Promise.allSettled(
      Array.from({ length: 10 }, (_, i) =>
        ctx.asMember('venture_a', `member_${i}`, () =>
          rewardService.redeem({
            rewardId: reward.id,
            memberId: `member_${i}`,
            ventureId: 'venture_a',
            quantity: 1,
            idempotencyKey: `concurrent-key-${i}`,
          }),
        ),
      ),
    );

    const succeeded = results.filter(r => r.status === 'fulfilled').length;
    const failed = results.filter(r => r.status === 'rejected').length;

    expect(succeeded).toBe(5);
    expect(failed).toBe(5);

    // Verify inventory is at 0
    const inv = await ctx.asAdmin('venture_a', () =>
      rewardService.getInventory({ rewardId: reward.id }),
    );
    expect(inv.availableStock).toBe(0);
  });
});
```

### Fulfillment Tests

Fulfillment tests verify the async worker pipeline, retry logic, and dead-letter behavior.

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { FulfillmentWorker } from '../workers/fulfillment.worker';
import { FulfillmentService } from '../services/fulfillment.service';

describe('FulfillmentWorker', () => {
  let worker: FulfillmentWorker;
  let mockFulfillmentService: ReturnType<typeof vi.mocked<FulfillmentService>>;

  beforeEach(() => {
    mockFulfillmentService = {
      processDigitalInstant: vi.fn().mockResolvedValue({ success: true, code: 'ABCD-EFGH' }),
      processPhysicalShipping: vi.fn().mockResolvedValue({ success: true, trackingNumber: 'TRK123' }),
      processPartnerApi: vi.fn().mockResolvedValue({ success: true, referenceId: 'partner-ref' }),
      processManual: vi.fn().mockResolvedValue({ success: true }),
      markCompleted: vi.fn().mockResolvedValue(undefined),
      markFailed: vi.fn().mockResolvedValue(undefined),
      scheduleRetry: vi.fn().mockResolvedValue(undefined),
      moveToDLQ: vi.fn().mockResolvedValue(undefined),
    } as any;

    worker = new FulfillmentWorker(mockFulfillmentService);
  });

  it('should route digital_instant to correct handler', async () => {
    await worker.process({
      jobId: 'job_1',
      type: 'digital_instant',
      config: { type: 'digital_instant', codePool: 'promo', codeFormat: 'XXXX-XXXX', deliveryMethod: 'email' },
      memberId: 'member_123',
      redemptionId: 'red_1',
    });

    expect(mockFulfillmentService.processDigitalInstant).toHaveBeenCalled();
    expect(mockFulfillmentService.markCompleted).toHaveBeenCalledWith(
      'job_1',
      expect.objectContaining({ code: 'ABCD-EFGH' }),
    );
  });

  it('should retry on transient failure', async () => {
    mockFulfillmentService.processPartnerApi.mockRejectedValueOnce(
      new Error('Connection timeout'),
    );

    await worker.process({
      jobId: 'job_2',
      type: 'partner_api',
      config: { type: 'partner_api', partnerId: 'tango', endpointUrl: 'https://api.tango.com', authMethod: 'api_key', requestTemplate: {}, responseMapping: {} },
      memberId: 'member_123',
      redemptionId: 'red_2',
      attemptCount: 1,
      maxAttempts: 5,
    });

    expect(mockFulfillmentService.scheduleRetry).toHaveBeenCalledWith(
      'job_2',
      expect.any(Date),   // Next retry time
    );
    expect(mockFulfillmentService.markCompleted).not.toHaveBeenCalled();
  });

  it('should dead-letter after max retries', async () => {
    mockFulfillmentService.processPartnerApi.mockRejectedValue(
      new Error('Persistent failure'),
    );

    await worker.process({
      jobId: 'job_3',
      type: 'partner_api',
      config: { type: 'partner_api', partnerId: 'tango', endpointUrl: 'https://api.tango.com', authMethod: 'api_key', requestTemplate: {}, responseMapping: {} },
      memberId: 'member_123',
      redemptionId: 'red_3',
      attemptCount: 5,
      maxAttempts: 5,
    });

    expect(mockFulfillmentService.moveToDLQ).toHaveBeenCalledWith(
      'job_3',
      expect.stringContaining('Persistent failure'),
    );
  });
});
```

### Load & Stress Tests

Load tests validate system behavior under concurrent redemption pressure, verifying inventory integrity and throughput.

```typescript
import { describe, it, expect } from 'vitest';
import { createLoadTestContext } from '@mcv/testing/load';

describe('Rewards Load Tests', { timeout: 120_000 }, () => {
  it('should maintain inventory integrity under 1000 concurrent redemptions', async () => {
    const ctx = await createLoadTestContext({
      modules: ['engagement/rewards', 'engagement/points'],
      concurrency: 100,
    });

    // Seed: 1 reward with 500 stock, 1000 members with 10000 points each
    const { rewardId } = await ctx.seed({
      reward: { stockQuantity: 500, pointCost: 100 },
      members: { count: 1000, pointBalance: 10000 },
    });

    // Fire 1000 concurrent redemptions
    const results = await ctx.bombardRedemptions({
      rewardId,
      count: 1000,
      concurrency: 100,
    });

    // Exactly 500 should succeed (matching stock)
    expect(results.succeeded).toBe(500);
    expect(results.failed).toBe(500);
    expect(results.failedReasons.REWARD_OUT_OF_STOCK).toBe(500);

    // Inventory should be exactly 0
    const inventory = await ctx.getInventory(rewardId);
    expect(inventory.availableStock).toBe(0);
    expect(inventory.redeemedStock).toBe(500);

    // No double-deductions: total points deducted should be exactly 500 × 100
    const totalDeducted = await ctx.getTotalPointsDeducted();
    expect(totalDeducted).toBe(50000);

    // Throughput
    console.log(`Throughput: ${results.throughputPerSecond.toFixed(1)} redemptions/sec`);
    console.log(`P50 latency: ${results.p50Ms}ms`);
    console.log(`P99 latency: ${results.p99Ms}ms`);

    await ctx.cleanup();
  });

  it('should handle flash sale spike without inventory corruption', async () => {
    const ctx = await createLoadTestContext({
      modules: ['engagement/rewards', 'engagement/points'],
      concurrency: 200,
    });

    const { rewardId } = await ctx.seed({
      reward: { stockQuantity: 100, pointCost: 5000 },
      members: { count: 5000, pointBalance: 50000 },
      flashSale: { discountPercent: 50, maxRedemptions: 100 },
    });

    // Simulate flash sale start: 5000 members hitting the catalog simultaneously
    const results = await ctx.bombardRedemptions({
      rewardId,
      count: 5000,
      concurrency: 200,
      rampUpMs: 5000,   // All 5000 within 5 seconds
    });

    expect(results.succeeded).toBe(100);
    expect(results.failedReasons.REWARD_OUT_OF_STOCK + results.failedReasons.FLASH_SALE_EXHAUSTED).toBe(4900);

    // Verify all 100 redemptions were at the flash sale price
    const redemptions = await ctx.getSuccessfulRedemptions();
    for (const r of redemptions) {
      expect(r.pointCostPerUnit).toBe(2500);   // 50% off 5000
    }

    await ctx.cleanup();
  });
});
```

### Test Coverage Targets

| Area | Target | Notes |
|------|--------|-------|
| Service methods | ≥ 95% | All business logic paths including error cases |
| Gate evaluation | 100% | Every gate type and operator combination |
| Inventory locking | ≥ 90% | Concurrent reservation edge cases |
| Fulfillment routing | 100% | Every fulfillment type handler |
| Pricing resolution | ≥ 95% | All pricing rule types and priority ordering |
| RLS policies | 100% | Tenant isolation verified in integration tests |
| Error codes | 100% | Every error code is triggered in at least one test |
| Cart operations | ≥ 90% | Add/remove/checkout/expiry/atomic rollback |

### Running Tests

```bash
# Unit tests
pnpm test:unit --filter=@mcv/engagement/rewards

# Integration tests (requires test database)
pnpm test:integration --filter=@mcv/engagement/rewards

# Load tests (resource-intensive, CI-only)
pnpm test:load --filter=@mcv/engagement/rewards

# Full suite with coverage
pnpm test:coverage --filter=@mcv/engagement/rewards

# Watch mode for development
pnpm test:watch --filter=@mcv/engagement/rewards
```

---

*Built for the MCV.ONE platform. This module closes the loyalty loop — turning points into value, and value into lasting engagement.*