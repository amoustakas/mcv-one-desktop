# @mcv/growth/affiliates

> Affiliate Program Management — Recruitment, tracking, commission calculation, and payouts for partner-driven growth.

**Package:** `@mcv/growth/affiliates`
**Since:** 0.9.0
**Status:** Stable
**Domain:** Growth → Affiliates
**Tier:** 5 (Domain Module)

---

## Table of Contents

- [Purpose](#purpose)
- [Exports](#exports)
- [Architecture](#architecture)
- [Core Interfaces](#core-interfaces)
- [Database Schemas](#database-schemas)
- [Code Examples](#code-examples)
- [Error Codes](#error-codes)
- [Security](#security)
- [Environment Variables](#environment-variables)
- [Dependencies](#dependencies)
- [Testing](#testing)

---

## Purpose

The `@mcv/growth/affiliates` module provides a full-featured affiliate and partner program engine for ventures running on the MCV.ONE platform. It handles every stage of the affiliate lifecycle: recruitment and onboarding, link/code generation, click and conversion tracking, commission calculation, fraud detection, and payout disbursement.

### Why This Module Exists

Affiliate marketing is one of the most cost-effective growth channels available — you only pay for results. But running an affiliate program at scale is operationally complex: tracking must be accurate across devices and sessions, commissions must account for tiered structures and recurring revenue, fraud must be detected before payouts are issued, and affiliates need a self-service portal to stay engaged.

This module solves all of that within the MCV.ONE multi-tenant architecture. Each venture can run one or more affiliate programs, each with its own commission structure, attribution windows, and payout rules. Affiliates can participate in multiple programs, and the platform supports cross-venture affiliate networks for ventures that want to share their affiliate base.

### Core Problems Solved

1. **Attribution Accuracy** — First-click, last-click, and multi-touch attribution with configurable cookie windows (30/60/90/lifetime), fingerprint fallback for cookieless environments, and cross-device reconciliation via authenticated user graphs.

2. **Commission Complexity** — Percentage-based, flat-fee, tiered (volume-based), product-specific, recurring (for SaaS subscriptions), and multi-level (sub-affiliate) commission structures, all composable per program.

3. **Fraud Prevention** — Real-time click fraud detection, self-referral blocking, velocity checks, geographic anomaly detection, conversion pattern analysis, and a manual review queue for edge cases.

4. **Payout Operations** — Automated payout scheduling with configurable thresholds, support for PayPal, bank transfer (ACH/SEPA/Wire), and cryptocurrency payouts, plus tax form (W-9/W-8BEN) collection and 1099 generation.

5. **Affiliate Engagement** — A white-label affiliate portal with real-time dashboards, creative asset libraries, performance leaderboards, and deep-link generators to keep affiliates active and productive.

6. **Multi-Tenancy** — Full Row-Level Security (RLS) isolation ensures affiliates and program data are scoped to their owning venture, while cross-venture networks allow opt-in sharing.

### Design Philosophy

- **Event-Driven Core** — All clicks, conversions, and commission events flow through Redpanda, enabling real-time tracking, async processing, and downstream analytics without blocking the critical path.
- **Composable Commission Rules** — Commission structures are defined as rule sets that can be layered, overridden per product, and versioned over time.
- **Fraud-First** — Every conversion passes through the fraud detection pipeline before a commission is recorded. Suspicious activity is flagged, not silently dropped.
- **Affiliate Autonomy** — Affiliates manage their own links, creatives, and payout methods through the portal, reducing operational overhead for venture operators.

---

## Exports

```typescript
// === Primary Service ===
export { AffiliateService } from './services/affiliate.service';
export { createAffiliateService } from './services/affiliate.service';

// === Sub-Services ===
export { AffiliateRegistrationService } from './services/registration.service';
export { LinkGenerationService } from './services/link-generation.service';
export { TrackingService } from './services/tracking.service';
export { CommissionEngine } from './services/commission-engine.service';
export { PayoutService } from './services/payout.service';
export { FraudDetectionService } from './services/fraud-detection.service';
export { AffiliatePortalService } from './services/portal.service';
export { ProgramAnalyticsService } from './services/analytics.service';

// === Core Types ===
export type {
  Affiliate,
  AffiliateStatus,
  AffiliateTier,
  AffiliateProfile,
  AffiliateApplication,
} from './types/affiliate.types';

export type {
  AffiliateLink,
  AffiliateLinkCreate,
  VanityUrl,
  PromoCode,
  DeepLink,
  QRCodeOptions,
} from './types/link.types';

export type {
  AffiliateClick,
  Conversion,
  ConversionCreate,
  AttributionModel,
  AttributionWindow,
  AttributionResult,
  TrackingPixel,
  FingerprintData,
} from './types/tracking.types';

export type {
  Commission,
  CommissionRule,
  CommissionStructure,
  CommissionType,
  TieredRate,
  RecurringCommission,
  SubAffiliateCommission,
} from './types/commission.types';

export type {
  Payout,
  PayoutSchedule,
  PayoutMethod,
  PayoutStatus,
  PayoutBatch,
  TaxForm,
  PayoutThreshold,
} from './types/payout.types';

export type {
  AffiliateProgram,
  ProgramCreate,
  ProgramUpdate,
  ProgramStatus,
  ProgramTerms,
  ProgramNetwork,
} from './types/program.types';

export type {
  FraudFlag,
  FraudRule,
  FraudScore,
  FraudReviewItem,
  FraudDetectionConfig,
} from './types/fraud.types';

export type {
  AffiliatePortal,
  PortalConfig,
  PortalDashboard,
  CreativeAsset,
  CreativeCategory,
  PerformanceReport,
} from './types/portal.types';

export type {
  ProgramAnalytics,
  AffiliateMetrics,
  EarningsPerClick,
  ConversionFunnel,
  ProgramROI,
  TopAffiliateReport,
} from './types/analytics.types';

// === Database Schemas (Drizzle) ===
export {
  affiliates,
  affiliateLinks,
  affiliateClicks,
  affiliateConversions,
  commissions,
  payouts,
  affiliatePrograms,
  fraudFlags,
  affiliateCreatives,
  payoutMethods,
} from './db/schema';

// === tRPC Router ===
export { affiliateRouter } from './trpc/affiliate.router';

// === Event Types ===
export type {
  AffiliateClickEvent,
  ConversionEvent,
  CommissionCalculatedEvent,
  PayoutIssuedEvent,
  FraudDetectedEvent,
  AffiliateRegisteredEvent,
  AffiliateTierChangedEvent,
} from './events/affiliate.events';

// === Constants ===
export {
  DEFAULT_COOKIE_WINDOW_DAYS,
  DEFAULT_PAYOUT_THRESHOLD,
  MAX_PROMO_CODE_LENGTH,
  COMMISSION_TYPES,
  ATTRIBUTION_MODELS,
  PAYOUT_STATUSES,
  AFFILIATE_STATUSES,
  AFFILIATE_TIERS,
  FRAUD_RULE_TYPES,
} from './constants';

// === Utilities ===
export { generateAffiliateCode } from './utils/code-generator';
export { buildTrackingUrl } from './utils/tracking-url';
export { calculateEPC } from './utils/metrics';
export { validatePromoCode } from './utils/validation';
export { renderCommissionBreakdown } from './utils/commission-display';
```

---

## Architecture

### High-Level Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                        Venture Application                         │
│                    (Storefront / SaaS Product)                     │
└──────────────┬──────────────────────────────────┬──────────────────┘
               │ Tracking Pixel / SDK              │ tRPC API
               ▼                                   ▼
┌──────────────────────────┐       ┌──────────────────────────────────┐
│     Tracking Service     │       │       Affiliate Portal           │
│                          │       │                                  │
│  • Click capture         │       │  • Dashboard                    │
│  • Cookie management     │       │  • Link generator               │
│  • Fingerprinting        │       │  • Creative library             │
│  • Cross-device graph    │       │  • Payout history               │
│  • Attribution resolve   │       │  • Performance reports          │
└──────────┬───────────────┘       └──────────────┬───────────────────┘
           │                                      │
           │  Redpanda Events                     │  tRPC
           ▼                                      ▼
┌──────────────────────────────────────────────────────────────────────┐
│                        AffiliateService                             │
│                                                                     │
│  ┌─────────────────┐  ┌──────────────────┐  ┌───────────────────┐  │
│  │  Registration    │  │  Link & Code     │  │  Commission       │  │
│  │  Service         │  │  Generation      │  │  Engine           │  │
│  │                  │  │                  │  │                   │  │
│  │  • Applications  │  │  • Ref links     │  │  • Rule eval      │  │
│  │  • Approvals     │  │  • Vanity URLs   │  │  • Tiered rates   │  │
│  │  • Tier mgmt     │  │  • Promo codes   │  │  • Recurring      │  │
│  │  • Terms         │  │  • QR codes      │  │  • Sub-affiliate  │  │
│  └─────────────────┘  │  • Deep links    │  │  • Product-spec   │  │
│                        └──────────────────┘  └───────────────────┘  │
│  ┌─────────────────┐  ┌──────────────────┐  ┌───────────────────┐  │
│  │  Fraud           │  │  Payout          │  │  Program          │  │
│  │  Detection       │  │  Service         │  │  Analytics        │  │
│  │                  │  │                  │  │                   │  │
│  │  • Click fraud   │  │  • Scheduling    │  │  • Revenue/aff    │  │
│  │  • Self-referral │  │  • Thresholds    │  │  • Conv rates     │  │
│  │  • Velocity      │  │  • Multi-method  │  │  • EPC            │  │
│  │  • Geo anomaly   │  │  • Tax forms     │  │  • Top affiliates │  │
│  │  • Review queue  │  │  • Batching      │  │  • Program ROI    │  │
│  └─────────────────┘  └──────────────────┘  └───────────────────┘  │
└──────────────────────────────────────┬──────────────────────────────┘
                                       │
                    ┌──────────────────┼──────────────────┐
                    ▼                  ▼                  ▼
          ┌─────────────┐    ┌─────────────┐    ┌──────────────┐
          │  Supabase    │    │  Redpanda    │    │  External    │
          │  PostgreSQL  │    │  (Events)    │    │  Payouts     │
          │              │    │              │    │              │
          │  • RLS       │    │  • Clicks    │    │  • PayPal    │
          │  • Drizzle   │    │  • Converts  │    │  • Stripe    │
          │  • Indexes   │    │  • Commiss.  │    │  • Crypto    │
          └─────────────┘    └─────────────┘    └──────────────┘
```

### Request Flow: Click → Conversion → Commission → Payout

```
1. CLICK CAPTURE
   User clicks affiliate link → Tracking Service
   ├── Extract affiliate_id, link_id, campaign params
   ├── Set tracking cookie (configurable window)
   ├── Generate fingerprint (fallback for cookieless)
   ├── Publish AffiliateClickEvent to Redpanda
   ├── Fraud check (real-time): velocity, geo, bot detection
   └── Redirect to destination URL

2. CONVERSION ATTRIBUTION
   User completes purchase/signup → Conversion webhook
   ├── Look up tracking cookie → affiliate_id
   ├── If no cookie, attempt fingerprint match
   ├── If authenticated, check cross-device graph
   ├── Apply attribution model (first-click / last-click)
   ├── Validate within attribution window
   ├── Publish ConversionEvent to Redpanda
   └── Store conversion record

3. COMMISSION CALCULATION
   ConversionEvent consumed → Commission Engine
   ├── Load program commission rules
   ├── Check product-specific overrides
   ├── Apply affiliate tier multiplier
   ├── Calculate base commission amount
   ├── If recurring: schedule future commissions
   ├── If sub-affiliate: calculate upline commissions
   ├── Run fraud pipeline on conversion
   │   ├── PASS → Commission status = 'approved'
   │   ├── FLAG → Commission status = 'pending_review'
   │   └── REJECT → Commission status = 'rejected'
   ├── Publish CommissionCalculatedEvent
   └── Store commission record

4. PAYOUT DISBURSEMENT
   Payout schedule triggers → Payout Service
   ├── Aggregate approved commissions per affiliate
   ├── Check minimum payout threshold
   ├── Verify tax form on file (W-9/W-8BEN)
   ├── Check payout method configured
   ├── Create payout batch
   ├── Submit to payment provider (PayPal/Stripe/crypto)
   ├── Publish PayoutIssuedEvent
   ├── Update commission records as 'paid'
   └── Send payout notification to affiliate
```

### Event-Driven Architecture

All significant state transitions are published as events to Redpanda topics, enabling:

| Topic | Events | Consumers |
|-------|--------|-----------|
| `affiliate.clicks` | `AffiliateClickEvent` | Tracking Service, Fraud Detection, Analytics |
| `affiliate.conversions` | `ConversionEvent` | Commission Engine, Analytics |
| `affiliate.commissions` | `CommissionCalculatedEvent` | Payout Service, Portal, Analytics |
| `affiliate.payouts` | `PayoutIssuedEvent` | Notification Service, Accounting |
| `affiliate.fraud` | `FraudDetectedEvent` | Review Queue, Analytics, Alerting |
| `affiliate.lifecycle` | `AffiliateRegisteredEvent`, `AffiliateTierChangedEvent` | Portal, CRM, Analytics |

### Multi-Tenant Isolation

Every database table includes a `venture_id` column with RLS policies:

```sql
-- Affiliates can only see their own data
CREATE POLICY affiliate_isolation ON affiliates
  USING (venture_id = current_setting('app.venture_id')::uuid);

-- Program managers see all affiliates in their program
CREATE POLICY program_manager_access ON affiliates
  USING (
    venture_id = current_setting('app.venture_id')::uuid
    AND (
      current_setting('app.role') = 'program_manager'
      OR id = current_setting('app.affiliate_id')::uuid
    )
  );
```

### Module Boundaries

```
@mcv/growth/affiliates
├── services/           # Business logic services
│   ├── affiliate.service.ts        # Primary orchestrator
│   ├── registration.service.ts     # Affiliate onboarding
│   ├── link-generation.service.ts  # Link/code creation
│   ├── tracking.service.ts         # Click & conversion tracking
│   ├── commission-engine.service.ts # Commission calculation
│   ├── payout.service.ts           # Payout management
│   ├── fraud-detection.service.ts  # Fraud pipeline
│   ├── portal.service.ts           # Affiliate portal
│   └── analytics.service.ts        # Program analytics
├── types/              # TypeScript type definitions
│   ├── affiliate.types.ts
│   ├── link.types.ts
│   ├── tracking.types.ts
│   ├── commission.types.ts
│   ├── payout.types.ts
│   ├── program.types.ts
│   ├── fraud.types.ts
│   ├── portal.types.ts
│   └── analytics.types.ts
├── db/                 # Database schemas & migrations
│   ├── schema.ts                   # Drizzle schema definitions
│   └── migrations/                 # SQL migrations
├── trpc/               # tRPC router definitions
│   ├── affiliate.router.ts         # Main router
│   ├── registration.router.ts
│   ├── tracking.router.ts
│   ├── commission.router.ts
│   ├── payout.router.ts
│   ├── portal.router.ts
│   └── analytics.router.ts
├── events/             # Event type definitions & producers
│   └── affiliate.events.ts
├── utils/              # Shared utilities
│   ├── code-generator.ts
│   ├── tracking-url.ts
│   ├── metrics.ts
│   ├── validation.ts
│   └── commission-display.ts
├── constants.ts        # Module constants
└── index.ts            # Public exports
```

---

## Core Interfaces

### AffiliateService

The primary orchestrator that coordinates all sub-services.

```typescript
interface AffiliateService {
  // === Program Management ===

  /**
   * Create a new affiliate program for a venture.
   * Each venture can run multiple programs (e.g., one for products, one for subscriptions).
   */
  createProgram(input: ProgramCreate): Promise<AffiliateProgram>;

  /**
   * Update program settings (commission rates, attribution windows, terms, etc.).
   * Changes apply to new conversions only; existing commissions are not retroactively modified.
   */
  updateProgram(programId: string, updates: ProgramUpdate): Promise<AffiliateProgram>;

  /**
   * Get program details including current commission structure.
   */
  getProgram(programId: string): Promise<AffiliateProgram | null>;

  /**
   * List all programs for the current venture.
   */
  listPrograms(options?: ProgramListOptions): Promise<PaginatedResult<AffiliateProgram>>;

  /**
   * Pause a program (stops new registrations and link generation, but honors existing conversions).
   */
  pauseProgram(programId: string): Promise<AffiliateProgram>;

  /**
   * Archive a program (soft-delete; final payouts are still processed).
   */
  archiveProgram(programId: string): Promise<void>;

  // === Affiliate Lifecycle ===

  /**
   * Submit an affiliate application for review.
   * Returns the application with status 'pending'.
   */
  applyAsAffiliate(input: AffiliateApplication): Promise<Affiliate>;

  /**
   * Approve a pending affiliate application.
   * Triggers welcome email and enables link generation.
   */
  approveAffiliate(affiliateId: string, options?: ApprovalOptions): Promise<Affiliate>;

  /**
   * Reject a pending affiliate application with a reason.
   */
  rejectAffiliate(affiliateId: string, reason: string): Promise<Affiliate>;

  /**
   * Get affiliate details by ID.
   */
  getAffiliate(affiliateId: string): Promise<Affiliate | null>;

  /**
   * Get affiliate by their unique referral code.
   */
  getAffiliateByCode(code: string): Promise<Affiliate | null>;

  /**
   * List affiliates with filtering and pagination.
   */
  listAffiliates(options?: AffiliateListOptions): Promise<PaginatedResult<Affiliate>>;

  /**
   * Update affiliate tier (e.g., promote to Gold after hitting revenue threshold).
   */
  updateAffiliateTier(affiliateId: string, tier: AffiliateTier): Promise<Affiliate>;

  /**
   * Suspend an affiliate (freezes commissions, disables links).
   */
  suspendAffiliate(affiliateId: string, reason: string): Promise<Affiliate>;

  /**
   * Reactivate a suspended affiliate.
   */
  reactivateAffiliate(affiliateId: string): Promise<Affiliate>;

  // === Links & Codes ===

  /**
   * Generate a new affiliate tracking link.
   * Supports custom campaigns, sub-IDs, and deep linking.
   */
  createLink(input: AffiliateLinkCreate): Promise<AffiliateLink>;

  /**
   * Create a vanity URL for an affiliate link (e.g., ref.mcv.one/johndoe).
   */
  createVanityUrl(linkId: string, slug: string): Promise<VanityUrl>;

  /**
   * Generate a promo code tied to an affiliate.
   */
  createPromoCode(input: PromoCodeCreate): Promise<PromoCode>;

  /**
   * Generate a QR code for an affiliate link.
   */
  generateQRCode(linkId: string, options?: QRCodeOptions): Promise<Buffer>;

  /**
   * List all links for an affiliate.
   */
  listLinks(affiliateId: string, options?: LinkListOptions): Promise<PaginatedResult<AffiliateLink>>;

  // === Tracking ===

  /**
   * Record a click on an affiliate link.
   * Called by the tracking pixel/redirect endpoint.
   */
  recordClick(input: ClickInput): Promise<AffiliateClick>;

  /**
   * Record a conversion and trigger commission calculation.
   */
  recordConversion(input: ConversionCreate): Promise<Conversion>;

  /**
   * Resolve attribution for a conversion.
   * Returns the affiliate and link that should receive credit.
   */
  resolveAttribution(input: AttributionInput): Promise<AttributionResult | null>;

  // === Commissions ===

  /**
   * Calculate commission for a conversion using program rules.
   * Automatically handles tiered, recurring, and sub-affiliate commissions.
   */
  calculateCommission(conversion: Conversion): Promise<Commission[]>;

  /**
   * Get commission details by ID.
   */
  getCommission(commissionId: string): Promise<Commission | null>;

  /**
   * List commissions with filtering.
   */
  listCommissions(options?: CommissionListOptions): Promise<PaginatedResult<Commission>>;

  /**
   * Manually approve a commission that was flagged for review.
   */
  approveCommission(commissionId: string): Promise<Commission>;

  /**
   * Manually reject a commission that was flagged for review.
   */
  rejectCommission(commissionId: string, reason: string): Promise<Commission>;

  // === Payouts ===

  /**
   * Process payouts for all eligible affiliates.
   * Typically called by a scheduled job.
   */
  processPayouts(programId: string): Promise<PayoutBatch>;

  /**
   * Get payout details.
   */
  getPayout(payoutId: string): Promise<Payout | null>;

  /**
   * List payouts with filtering.
   */
  listPayouts(options?: PayoutListOptions): Promise<PaginatedResult<Payout>>;

  /**
   * Set or update an affiliate's preferred payout method.
   */
  setPayoutMethod(affiliateId: string, method: PayoutMethodCreate): Promise<PayoutMethod>;

  /**
   * Submit a tax form for an affiliate.
   */
  submitTaxForm(affiliateId: string, form: TaxFormInput): Promise<TaxForm>;

  // === Fraud ===

  /**
   * Run fraud detection on a click or conversion.
   * Returns a fraud score and any triggered rules.
   */
  detectFraud(input: FraudDetectionInput): Promise<FraudScore>;

  /**
   * Get the fraud review queue.
   */
  getFraudReviewQueue(options?: FraudReviewOptions): Promise<PaginatedResult<FraudReviewItem>>;

  /**
   * Resolve a fraud review item (approve or reject).
   */
  resolveFraudReview(itemId: string, resolution: FraudResolution): Promise<FraudReviewItem>;

  // === Analytics ===

  /**
   * Get program-level analytics.
   */
  getProgramAnalytics(programId: string, dateRange: DateRange): Promise<ProgramAnalytics>;

  /**
   * Get per-affiliate performance metrics.
   */
  getAffiliateMetrics(affiliateId: string, dateRange: DateRange): Promise<AffiliateMetrics>;

  /**
   * Get top-performing affiliates.
   */
  getTopAffiliates(programId: string, options?: TopAffiliateOptions): Promise<TopAffiliateReport>;

  /**
   * Get program ROI calculation.
   */
  getProgramROI(programId: string, dateRange: DateRange): Promise<ProgramROI>;
}
```

### Affiliate

```typescript
interface Affiliate {
  /** Unique affiliate identifier (UUID). */
  id: string;

  /** Venture this affiliate belongs to. */
  ventureId: string;

  /** Program this affiliate is enrolled in. */
  programId: string;

  /** User ID from the auth system (if the affiliate has a platform account). */
  userId: string | null;

  /** Affiliate's unique referral code (e.g., "JOHNDOE2024"). */
  referralCode: string;

  /** Current status in the lifecycle. */
  status: AffiliateStatus;

  /** Current tier (determines commission rates and perks). */
  tier: AffiliateTier;

  /** Affiliate's profile information. */
  profile: AffiliateProfile;

  /** Parent affiliate ID (for sub-affiliate / MLM structures). */
  parentAffiliateId: string | null;

  /** Depth in the affiliate tree (0 = direct, 1 = sub-affiliate, etc.). */
  depth: number;

  /** Date the affiliate accepted program terms. */
  termsAcceptedAt: Date | null;

  /** Version of terms accepted. */
  termsVersion: string | null;

  /** Whether tax form is on file. */
  taxFormOnFile: boolean;

  /** Preferred payout method ID. */
  preferredPayoutMethodId: string | null;

  /** Custom metadata (program-specific fields). */
  metadata: Record<string, unknown>;

  /** Lifetime earnings (calculated, cached). */
  lifetimeEarnings: number;

  /** Current unpaid balance. */
  unpaidBalance: number;

  /** Total conversions driven. */
  totalConversions: number;

  /** Account creation timestamp. */
  createdAt: Date;

  /** Last update timestamp. */
  updatedAt: Date;

  /** Suspension reason (if suspended). */
  suspensionReason: string | null;

  /** Date of last activity (click or conversion). */
  lastActivityAt: Date | null;
}

type AffiliateStatus =
  | 'pending'       // Application submitted, awaiting review
  | 'approved'      // Active and can generate links
  | 'rejected'      // Application denied
  | 'suspended'     // Temporarily disabled (fraud, policy violation)
  | 'deactivated';  // Voluntarily left or permanently removed

type AffiliateTier =
  | 'bronze'    // Entry tier (default)
  | 'silver'    // Mid-tier (e.g., >$1k lifetime revenue)
  | 'gold'      // High-tier (e.g., >$10k lifetime revenue)
  | 'platinum'  // Top-tier (e.g., >$50k lifetime revenue)
  | 'diamond';  // Elite (invite-only or >$200k lifetime revenue)

interface AffiliateProfile {
  /** Display name. */
  name: string;

  /** Contact email. */
  email: string;

  /** Company or brand name (optional). */
  company: string | null;

  /** Website URL (for vetting). */
  website: string | null;

  /** Social media profiles. */
  socialProfiles: SocialProfile[];

  /** How they plan to promote (blog, social, email, etc.). */
  promotionMethods: string[];

  /** Estimated monthly audience/reach. */
  estimatedReach: string | null;

  /** Country of residence (for tax purposes). */
  country: string;

  /** Preferred language for communications. */
  language: string;

  /** Phone number (optional). */
  phone: string | null;

  /** Avatar URL. */
  avatarUrl: string | null;

  /** Bio / about text. */
  bio: string | null;
}

interface SocialProfile {
  platform: 'twitter' | 'instagram' | 'youtube' | 'tiktok' | 'linkedin' | 'facebook' | 'other';
  url: string;
  followerCount: number | null;
}

interface AffiliateApplication {
  programId: string;
  profile: AffiliateProfile;
  referredBy: string | null;
  metadata: Record<string, unknown>;
}
```

### AffiliateLink

```typescript
interface AffiliateLink {
  /** Unique link identifier. */
  id: string;

  /** Owning affiliate. */
  affiliateId: string;

  /** Program this link belongs to. */
  programId: string;

  /** Venture ID. */
  ventureId: string;

  /** The full tracking URL. */
  url: string;

  /** Short URL (if generated). */
  shortUrl: string | null;

  /** Vanity slug (e.g., "johndoe" → ref.mcv.one/johndoe). */
  vanitySlug: string | null;

  /** Destination URL (where the user lands after tracking). */
  destinationUrl: string;

  /** Campaign name for grouping. */
  campaign: string | null;

  /** Sub-ID for additional tracking granularity. */
  subId: string | null;

  /** UTM parameters to append. */
  utmParams: UTMParams | null;

  /** Whether this link is active. */
  isActive: boolean;

  /** Total clicks on this link. */
  totalClicks: number;

  /** Unique clicks (deduplicated by IP/fingerprint). */
  uniqueClicks: number;

  /** Total conversions attributed to this link. */
  totalConversions: number;

  /** Creation timestamp. */
  createdAt: Date;

  /** Expiration date (optional). */
  expiresAt: Date | null;
}

interface AffiliateLinkCreate {
  affiliateId: string;
  programId: string;
  destinationUrl: string;
  campaign?: string;
  subId?: string;
  utmParams?: UTMParams;
  vanitySlug?: string;
  expiresAt?: Date;
}

interface UTMParams {
  source?: string;
  medium?: string;
  campaign?: string;
  term?: string;
  content?: string;
}

interface VanityUrl {
  id: string;
  linkId: string;
  slug: string;
  fullUrl: string;
  createdAt: Date;
}

interface PromoCode {
  id: string;
  affiliateId: string;
  programId: string;
  code: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  maxUses: number | null;
  currentUses: number;
  isActive: boolean;
  expiresAt: Date | null;
  createdAt: Date;
}

interface DeepLink {
  id: string;
  linkId: string;
  targetPath: string;
  platform: 'web' | 'ios' | 'android';
  fallbackUrl: string;
}

interface QRCodeOptions {
  size: number;
  format: 'png' | 'svg';
  foregroundColor: string;
  backgroundColor: string;
  logoUrl?: string;
  errorCorrection: 'L' | 'M' | 'Q' | 'H';
}
```

### Commission

```typescript
interface Commission {
  /** Unique commission identifier. */
  id: string;

  /** Affiliate who earned this commission. */
  affiliateId: string;

  /** Program this commission belongs to. */
  programId: string;

  /** Venture ID. */
  ventureId: string;

  /** Conversion that triggered this commission. */
  conversionId: string;

  /** Link that drove the conversion (if attributable). */
  linkId: string | null;

  /** Commission amount in the program's currency. */
  amount: number;

  /** Currency code (ISO 4217). */
  currency: string;

  /** How the commission was calculated. */
  type: CommissionType;

  /** The commission rate applied (percentage or flat). */
  rate: number;

  /** Base amount the commission was calculated on (e.g., order total). */
  baseAmount: number;

  /** Current status. */
  status: CommissionStatus;

  /** Tier at the time of calculation (for audit trail). */
  affiliateTierAtCalculation: AffiliateTier;

  /** Rule that was applied. */
  ruleId: string;

  /** For recurring commissions: which billing cycle this is. */
  recurringCycle: number | null;

  /** For sub-affiliate commissions: the originating affiliate. */
  originatingAffiliateId: string | null;

  /** Sub-affiliate depth level. */
  subAffiliateLevel: number;

  /** Payout ID (set when paid). */
  payoutId: string | null;

  /** Fraud score at time of calculation. */
  fraudScore: number;

  /** Calculation breakdown for transparency. */
  breakdown: CommissionBreakdown;

  /** Creation timestamp. */
  createdAt: Date;

  /** When this commission becomes payable (hold period). */
  payableAt: Date;

  /** When this commission was paid. */
  paidAt: Date | null;
}

type CommissionType =
  | 'percentage'      // Percentage of sale amount
  | 'flat_fee'        // Fixed amount per conversion
  | 'tiered'          // Rate varies by volume
  | 'recurring'       // Recurring commission on subscription renewals
  | 'sub_affiliate';  // Commission from sub-affiliate's conversions

type CommissionStatus =
  | 'pending'          // Calculated, waiting for hold period
  | 'approved'         // Ready for payout
  | 'pending_review'   // Flagged by fraud detection
  | 'rejected'         // Denied (fraud or policy violation)
  | 'paid'             // Disbursed to affiliate
  | 'refunded';        // Clawed back due to refund/chargeback

interface CommissionBreakdown {
  baseAmount: number;
  rate: number;
  tierMultiplier: number;
  productOverride: boolean;
  productRate: number | null;
  calculatedAmount: number;
  adjustments: CommissionAdjustment[];
  finalAmount: number;
}

interface CommissionAdjustment {
  type: 'tier_bonus' | 'volume_bonus' | 'promotional' | 'cap' | 'minimum';
  description: string;
  amount: number;
}

interface CommissionRule {
  id: string;
  programId: string;
  name: string;
  type: CommissionType;
  rate: number;
  currency: string;

  /** For tiered commissions: the tier brackets. */
  tiers: TieredRate[] | null;

  /** Product IDs this rule applies to (null = all products). */
  productIds: string[] | null;

  /** Category IDs this rule applies to (null = all categories). */
  categoryIds: string[] | null;

  /** Affiliate tiers this rule applies to (null = all tiers). */
  affiliateTiers: AffiliateTier[] | null;

  /** Minimum order amount for this rule to apply. */
  minimumOrderAmount: number | null;

  /** Maximum commission amount (cap). */
  maxCommission: number | null;

  /** For recurring: how many cycles to pay. */
  maxRecurringCycles: number | null;

  /** For sub-affiliate: commission rate per level. */
  subAffiliateLevels: SubAffiliateLevel[] | null;

  /** Hold period in days before commission becomes payable. */
  holdPeriodDays: number;

  /** Priority for rule evaluation (higher = evaluated first). */
  priority: number;

  /** Whether this rule is active. */
  isActive: boolean;

  /** Effective date range. */
  effectiveFrom: Date;
  effectiveUntil: Date | null;

  createdAt: Date;
  updatedAt: Date;
}

interface TieredRate {
  /** Minimum conversions in the period. */
  minConversions: number;
  /** Maximum conversions in the period (null = unlimited). */
  maxConversions: number | null;
  /** Commission rate for this tier. */
  rate: number;
  /** Period for counting conversions. */
  period: 'monthly' | 'quarterly' | 'yearly' | 'lifetime';
}

interface SubAffiliateLevel {
  /** Level depth (1 = direct sub-affiliate, 2 = sub-sub-affiliate, etc.). */
  level: number;
  /** Commission rate at this level. */
  rate: number;
  /** Type of commission at this level. */
  type: 'percentage' | 'flat_fee';
}

interface CommissionStructure {
  programId: string;
  defaultRule: CommissionRule;
  productRules: CommissionRule[];
  tierOverrides: CommissionRule[];
  subAffiliateRules: CommissionRule[];
  recurringRules: CommissionRule[];
}
```

### Conversion

```typescript
interface Conversion {
  /** Unique conversion identifier. */
  id: string;

  /** Venture ID. */
  ventureId: string;

  /** Program ID. */
  programId: string;

  /** Attributed affiliate ID. */
  affiliateId: string;

  /** Link that drove this conversion. */
  linkId: string | null;

  /** Original click ID (for click-to-conversion tracking). */
  clickId: string | null;

  /** Type of conversion event. */
  type: ConversionType;

  /** External order/transaction ID. */
  externalId: string;

  /** Conversion amount (order total, subscription price, etc.). */
  amount: number;

  /** Currency code. */
  currency: string;

  /** Product ID (if applicable). */
  productId: string | null;

  /** Product name (denormalized for reporting). */
  productName: string | null;

  /** Customer ID (hashed for privacy). */
  customerHash: string;

  /** Whether this is a new customer or returning. */
  isNewCustomer: boolean;

  /** Attribution model used. */
  attributionModel: AttributionModel;

  /** Attribution confidence score (0-1). */
  attributionConfidence: number;

  /** Status. */
  status: ConversionStatus;

  /** For subscriptions: the billing period. */
  billingPeriod: number | null;

  /** Custom conversion data. */
  metadata: Record<string, unknown>;

  /** Timestamp of the conversion event. */
  convertedAt: Date;

  /** Record creation timestamp. */
  createdAt: Date;
}

type ConversionType =
  | 'sale'           // One-time purchase
  | 'subscription'   // New subscription
  | 'renewal'        // Subscription renewal
  | 'upgrade'        // Plan upgrade
  | 'lead'           // Lead generation (form fill, signup)
  | 'trial'          // Free trial start
  | 'install';       // App install

type ConversionStatus =
  | 'pending'        // Waiting for attribution confirmation
  | 'confirmed'      // Attribution confirmed, commission calculated
  | 'rejected'       // Failed attribution or fraud
  | 'refunded';      // Order was refunded

type AttributionModel =
  | 'first_click'    // Credit goes to the first affiliate click
  | 'last_click'     // Credit goes to the last affiliate click
  | 'linear'         // Equal credit to all touch points
  | 'time_decay'     // More credit to recent touches
  | 'position';      // 40% first, 20% middle, 40% last

interface AttributionWindow {
  /** Window duration in days. */
  days: number;
  /** Whether to use lifetime attribution (overrides days). */
  lifetime: boolean;
  /** Model to use within the window. */
  model: AttributionModel;
}

interface AttributionResult {
  /** Affiliate who receives credit. */
  affiliateId: string;
  /** Link that was attributed. */
  linkId: string;
  /** Click that was attributed. */
  clickId: string;
  /** Attribution model used. */
  model: AttributionModel;
  /** Confidence score (0-1). */
  confidence: number;
  /** Time between click and conversion. */
  timeDeltaMs: number;
  /** How the attribution was resolved. */
  method: 'cookie' | 'fingerprint' | 'cross_device' | 'promo_code';
}

interface ConversionCreate {
  programId: string;
  type: ConversionType;
  externalId: string;
  amount: number;
  currency: string;
  productId?: string;
  productName?: string;
  customerHash: string;
  isNewCustomer: boolean;
  billingPeriod?: number;
  metadata?: Record<string, unknown>;
  /** Tracking cookie value (for attribution). */
  trackingCookie?: string;
  /** Fingerprint data (fallback attribution). */
  fingerprint?: FingerprintData;
  /** Promo code used (for code-based attribution). */
  promoCode?: string;
  /** Authenticated user ID (for cross-device). */
  authenticatedUserId?: string;
}
```

### Payout

```typescript
interface Payout {
  /** Unique payout identifier. */
  id: string;

  /** Venture ID. */
  ventureId: string;

  /** Program ID. */
  programId: string;

  /** Affiliate receiving the payout. */
  affiliateId: string;

  /** Payout batch this belongs to. */
  batchId: string;

  /** Total payout amount. */
  amount: number;

  /** Currency code. */
  currency: string;

  /** Number of commissions included. */
  commissionCount: number;

  /** Payout method used. */
  method: PayoutMethodType;

  /** Payment provider reference (e.g., PayPal transaction ID). */
  providerReference: string | null;

  /** Current status. */
  status: PayoutStatus;

  /** Period start (commissions from). */
  periodStart: Date;

  /** Period end (commissions through). */
  periodEnd: Date;

  /** Processing fee deducted. */
  processingFee: number;

  /** Net amount after fees. */
  netAmount: number;

  /** Failure reason (if failed). */
  failureReason: string | null;

  /** Notes from program manager. */
  notes: string | null;

  /** When the payout was initiated. */
  initiatedAt: Date;

  /** When the payout was completed. */
  completedAt: Date | null;

  /** Creation timestamp. */
  createdAt: Date;
}

type PayoutStatus =
  | 'pending'      // Created, not yet submitted
  | 'processing'   // Submitted to payment provider
  | 'completed'    // Successfully paid
  | 'failed'       // Payment failed
  | 'cancelled'    // Cancelled before processing
  | 'on_hold';     // Held for review (missing tax form, etc.)

type PayoutMethodType =
  | 'paypal'       // PayPal email
  | 'bank_ach'     // US ACH transfer
  | 'bank_sepa'    // EU SEPA transfer
  | 'bank_wire'    // International wire
  | 'stripe'       // Stripe Connect payout
  | 'crypto_btc'   // Bitcoin
  | 'crypto_eth'   // Ethereum
  | 'crypto_usdc'  // USDC stablecoin
  | 'check';       // Physical check (legacy)

interface PayoutMethod {
  id: string;
  affiliateId: string;
  type: PayoutMethodType;
  isDefault: boolean;
  details: PayoutMethodDetails;
  isVerified: boolean;
  verifiedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

type PayoutMethodDetails =
  | PayPalDetails
  | BankACHDetails
  | BankSEPADetails
  | BankWireDetails
  | CryptoDetails
  | StripeDetails;

interface PayPalDetails {
  type: 'paypal';
  email: string;
}

interface BankACHDetails {
  type: 'bank_ach';
  routingNumber: string;
  accountNumber: string;  // Encrypted at rest
  accountType: 'checking' | 'savings';
  accountHolderName: string;
}

interface BankSEPADetails {
  type: 'bank_sepa';
  iban: string;           // Encrypted at rest
  bic: string;
  accountHolderName: string;
}

interface BankWireDetails {
  type: 'bank_wire';
  bankName: string;
  swiftCode: string;
  accountNumber: string;  // Encrypted at rest
  accountHolderName: string;
  bankAddress: string;
  intermediaryBank?: string;
}

interface CryptoDetails {
  type: 'crypto_btc' | 'crypto_eth' | 'crypto_usdc';
  walletAddress: string;
  network: string;
}

interface StripeDetails {
  type: 'stripe';
  stripeAccountId: string;
}

interface PayoutSchedule {
  id: string;
  programId: string;
  frequency: 'weekly' | 'biweekly' | 'monthly' | 'quarterly';
  dayOfWeek: number | null;   // 0-6 for weekly/biweekly
  dayOfMonth: number | null;  // 1-28 for monthly
  minimumThreshold: number;
  currency: string;
  holdPeriodDays: number;
  autoProcess: boolean;
  isActive: boolean;
}

interface PayoutBatch {
  id: string;
  programId: string;
  ventureId: string;
  status: 'pending' | 'processing' | 'completed' | 'partially_failed';
  totalAmount: number;
  totalPayouts: number;
  successfulPayouts: number;
  failedPayouts: number;
  currency: string;
  periodStart: Date;
  periodEnd: Date;
  initiatedBy: string;
  createdAt: Date;
  completedAt: Date | null;
}

interface TaxForm {
  id: string;
  affiliateId: string;
  type: 'w9' | 'w8ben' | 'w8ben_e';
  status: 'pending' | 'verified' | 'rejected' | 'expired';
  legalName: string;
  taxId: string;          // Encrypted at rest
  country: string;
  submittedAt: Date;
  verifiedAt: Date | null;
  expiresAt: Date;
  documentUrl: string | null;
}
```

### AffiliateProgram

```typescript
interface AffiliateProgram {
  /** Unique program identifier. */
  id: string;

  /** Venture ID. */
  ventureId: string;

  /** Program name. */
  name: string;

  /** Program description (shown to potential affiliates). */
  description: string;

  /** URL slug for the program landing page. */
  slug: string;

  /** Current status. */
  status: ProgramStatus;

  /** Default commission structure. */
  commissionStructure: CommissionStructure;

  /** Attribution window configuration. */
  attributionWindow: AttributionWindow;

  /** Cookie settings. */
  cookieSettings: CookieSettings;

  /** Payout schedule. */
  payoutSchedule: PayoutSchedule;

  /** Program terms and conditions. */
  terms: ProgramTerms;

  /** Whether applications require manual approval. */
  requiresApproval: boolean;

  /** Auto-approval criteria (if requiresApproval is false). */
  autoApprovalCriteria: AutoApprovalCriteria | null;

  /** Tier thresholds. */
  tierThresholds: TierThreshold[];

  /** Allowed promotion methods. */
  allowedPromotionMethods: string[];

  /** Restricted keywords (for PPC affiliates). */
  restrictedKeywords: string[];

  /** Custom branding for the affiliate portal. */
  branding: ProgramBranding;

  /** Whether to allow sub-affiliates (MLM). */
  allowSubAffiliates: boolean;

  /** Maximum sub-affiliate depth. */
  maxSubAffiliateDepth: number;

  /** Whether to allow cross-venture participation. */
  crossVentureEnabled: boolean;

  /** Program-specific metadata. */
  metadata: Record<string, unknown>;

  /** Total enrolled affiliates. */
  totalAffiliates: number;

  /** Total active affiliates (had activity in last 30 days). */
  activeAffiliates: number;

  /** Creation timestamp. */
  createdAt: Date;

  /** Last update timestamp. */
  updatedAt: Date;
}

type ProgramStatus =
  | 'draft'      // Not yet launched
  | 'active'     // Accepting affiliates and tracking
  | 'paused'     // Temporarily stopped
  | 'archived';  // Permanently closed

interface CookieSettings {
  /** Cookie name used for tracking. */
  cookieName: string;
  /** Cookie duration in days. */
  durationDays: number;
  /** Whether to use first-party cookies. */
  firstParty: boolean;
  /** SameSite attribute. */
  sameSite: 'strict' | 'lax' | 'none';
  /** Whether to use Secure flag. */
  secure: boolean;
  /** Domain for the cookie (null = auto-detect). */
  domain: string | null;
}

interface ProgramTerms {
  version: string;
  content: string;
  effectiveDate: Date;
  commissionDisclosure: string;
  prohibitedActivities: string[];
  terminationPolicy: string;
}

interface AutoApprovalCriteria {
  /** Minimum website domain age in days. */
  minDomainAge: number | null;
  /** Required social following. */
  minSocialFollowing: number | null;
  /** Required email domain (e.g., no free email providers). */
  requireBusinessEmail: boolean;
  /** Country allowlist (null = all countries). */
  allowedCountries: string[] | null;
  /** Country blocklist. */
  blockedCountries: string[];
}

interface TierThreshold {
  tier: AffiliateTier;
  /** Minimum lifetime revenue to reach this tier. */
  minLifetimeRevenue: number;
  /** Minimum monthly conversions to maintain this tier. */
  minMonthlyConversions: number | null;
  /** Bonus commission rate modifier (e.g., 1.1 = 10% bonus). */
  rateMultiplier: number;
  /** Additional perks description. */
  perks: string[];
}

interface ProgramBranding {
  logoUrl: string | null;
  primaryColor: string;
  accentColor: string;
  customCss: string | null;
  portalDomain: string | null;
}

interface ProgramCreate {
  name: string;
  description: string;
  slug: string;
  commissionStructure: Partial<CommissionStructure>;
  attributionWindow?: Partial<AttributionWindow>;
  cookieSettings?: Partial<CookieSettings>;
  payoutSchedule?: Partial<PayoutSchedule>;
  terms: ProgramTerms;
  requiresApproval?: boolean;
  allowSubAffiliates?: boolean;
  maxSubAffiliateDepth?: number;
  branding?: Partial<ProgramBranding>;
}

interface ProgramUpdate {
  name?: string;
  description?: string;
  status?: ProgramStatus;
  commissionStructure?: Partial<CommissionStructure>;
  attributionWindow?: Partial<AttributionWindow>;
  cookieSettings?: Partial<CookieSettings>;
  payoutSchedule?: Partial<PayoutSchedule>;
  terms?: ProgramTerms;
  requiresApproval?: boolean;
  branding?: Partial<ProgramBranding>;
}

interface ProgramNetwork {
  id: string;
  name: string;
  description: string;
  memberVentureIds: string[];
  sharedAffiliatePool: boolean;
  crossVentureTracking: boolean;
  revenueSharePercentage: number;
  createdAt: Date;
}
```

### FraudDetector

```typescript
interface FraudDetector {
  /**
   * Evaluate a click for potential fraud.
   * Returns a score from 0 (clean) to 100 (definitely fraud).
   */
  evaluateClick(click: AffiliateClick): Promise<FraudScore>;

  /**
   * Evaluate a conversion for potential fraud.
   */
  evaluateConversion(conversion: Conversion): Promise<FraudScore>;

  /**
   * Run a batch fraud review on historical data.
   */
  batchReview(dateRange: DateRange): Promise<FraudReviewItem[]>;

  /**
   * Add a custom fraud rule.
   */
  addRule(rule: FraudRuleCreate): Promise<FraudRule>;

  /**
   * Update a fraud rule.
   */
  updateRule(ruleId: string, updates: Partial<FraudRule>): Promise<FraudRule>;

  /**
   * List all active fraud rules for a program.
   */
  listRules(programId: string): Promise<FraudRule[]>;

  /**
   * Get fraud analytics (flagged rate, common patterns, etc.).
   */
  getAnalytics(programId: string, dateRange: DateRange): Promise<FraudAnalytics>;
}

interface FraudScore {
  /** Score from 0-100 (higher = more suspicious). */
  score: number;

  /** Risk level classification. */
  level: 'low' | 'medium' | 'high' | 'critical';

  /** Rules that were triggered. */
  triggeredRules: TriggeredRule[];

  /** Recommended action. */
  recommendation: 'approve' | 'review' | 'reject';

  /** Explanation of the score. */
  explanation: string;

  /** Timestamp of evaluation. */
  evaluatedAt: Date;
}

interface TriggeredRule {
  ruleId: string;
  ruleName: string;
  ruleType: FraudRuleType;
  severity: number;
  details: string;
}

type FraudRuleType =
  | 'velocity'           // Too many clicks in a short period
  | 'geo_mismatch'       // Click from different country than conversion
  | 'self_referral'      // Affiliate converting their own link
  | 'bot_detection'      // Automated/bot traffic patterns
  | 'duplicate_ip'       // Multiple clicks from same IP
  | 'cookie_stuffing'    // Forced cookie drops without real clicks
  | 'click_injection'    // Mobile click injection (pre-install)
  | 'conversion_pattern' // Unusual conversion timing/amounts
  | 'device_farm'        // Multiple conversions from similar devices
  | 'incentivized'       // Suspected incentivized traffic
  | 'vpn_proxy'          // Traffic through VPN/proxy
  | 'custom';            // Custom rule

interface FraudRule {
  id: string;
  programId: string;
  name: string;
  type: FraudRuleType;
  isActive: boolean;
  severity: number;           // 1-10 (contributes to overall score)

  /** Rule-specific configuration. */
  config: FraudRuleConfig;

  /** Action to take when triggered. */
  action: 'flag' | 'reject' | 'alert';

  /** Cooldown between triggers (prevent alert fatigue). */
  cooldownMinutes: number;

  createdAt: Date;
  updatedAt: Date;
}

type FraudRuleConfig =
  | VelocityRuleConfig
  | GeoMismatchConfig
  | SelfReferralConfig
  | BotDetectionConfig
  | DuplicateIPConfig
  | ConversionPatternConfig
  | VPNProxyConfig
  | CustomRuleConfig;

interface VelocityRuleConfig {
  type: 'velocity';
  /** Maximum clicks per time window. */
  maxClicks: number;
  /** Time window in minutes. */
  windowMinutes: number;
  /** Scope: per-IP, per-affiliate, or per-link. */
  scope: 'ip' | 'affiliate' | 'link';
}

interface GeoMismatchConfig {
  type: 'geo_mismatch';
  /** Maximum allowed distance in km between click and conversion geo. */
  maxDistanceKm: number;
  /** Whether to allow VPN/proxy traffic. */
  allowVPN: boolean;
}

interface SelfReferralConfig {
  type: 'self_referral';
  /** Check email match between affiliate and customer. */
  checkEmail: boolean;
  /** Check IP match between affiliate session and conversion. */
  checkIP: boolean;
  /** Check payment method overlap. */
  checkPayment: boolean;
}

interface BotDetectionConfig {
  type: 'bot_detection';
  /** Minimum time on page before click is valid (seconds). */
  minTimeOnPage: number;
  /** Whether to check JavaScript execution. */
  checkJS: boolean;
  /** Known bot user-agent patterns to block. */
  blockedUserAgents: string[];
}

interface DuplicateIPConfig {
  type: 'duplicate_ip';
  /** Maximum clicks from same IP in window. */
  maxClicksPerIP: number;
  /** Time window in hours. */
  windowHours: number;
}

interface ConversionPatternConfig {
  type: 'conversion_pattern';
  /** Maximum conversion rate (suspicious if too high). */
  maxConversionRate: number;
  /** Minimum time between click and conversion (seconds). */
  minClickToConversion: number;
  /** Maximum time between click and conversion (seconds). */
  maxClickToConversion: number;
}

interface VPNProxyConfig {
  type: 'vpn_proxy';
  /** Block all VPN/proxy traffic. */
  blockAll: boolean;
  /** Allow datacenter IPs. */
  allowDatacenter: boolean;
  /** IP intelligence provider. */
  provider: 'ipinfo' | 'maxmind' | 'ipqs';
}

interface CustomRuleConfig {
  type: 'custom';
  /** Custom evaluation expression. */
  expression: string;
  /** Variables available in the expression. */
  variables: Record<string, string>;
}

interface FraudReviewItem {
  id: string;
  type: 'click' | 'conversion' | 'commission';
  referenceId: string;
  affiliateId: string;
  programId: string;
  fraudScore: FraudScore;
  status: 'pending' | 'approved' | 'rejected';
  reviewedBy: string | null;
  reviewedAt: Date | null;
  reviewNotes: string | null;
  createdAt: Date;
}

type FraudResolution = {
  action: 'approve' | 'reject';
  notes: string;
  banAffiliate?: boolean;
};

interface FraudAnalytics {
  totalFlagged: number;
  flaggedRate: number;
  approvedAfterReview: number;
  rejectedAfterReview: number;
  topFraudRules: { ruleId: string; ruleName: string; triggerCount: number }[];
  topFlaggedAffiliates: { affiliateId: string; flagCount: number }[];
  fraudByType: Record<FraudRuleType, number>;
  estimatedSavings: number;
}
```

### AffiliatePortal

```typescript
interface AffiliatePortal {
  /**
   * Get the portal dashboard data for an affiliate.
   */
  getDashboard(affiliateId: string): Promise<PortalDashboard>;

  /**
   * Get available creative assets for an affiliate.
   */
  getCreatives(programId: string, options?: CreativeListOptions): Promise<PaginatedResult<CreativeAsset>>;

  /**
   * Generate a performance report.
   */
  getPerformanceReport(affiliateId: string, dateRange: DateRange): Promise<PerformanceReport>;

  /**
   * Get payout history.
   */
  getPayoutHistory(affiliateId: string, options?: PayoutListOptions): Promise<PaginatedResult<Payout>>;

  /**
   * Get the affiliate leaderboard.
   */
  getLeaderboard(programId: string, options?: LeaderboardOptions): Promise<LeaderboardEntry[]>;

  /**
   * Get portal configuration for branding.
   */
  getPortalConfig(programId: string): Promise<PortalConfig>;
}

interface PortalDashboard {
  affiliate: Affiliate;
  program: AffiliateProgram;
  currentTier: AffiliateTier;
  nextTier: AffiliateTier | null;
  nextTierProgress: number;  // 0-100 percentage

  /** Earnings summary. */
  earnings: {
    today: number;
    thisWeek: number;
    thisMonth: number;
    lastMonth: number;
    lifetime: number;
    unpaidBalance: number;
    nextPayoutDate: Date | null;
    nextPayoutEstimate: number;
  };

  /** Traffic summary. */
  traffic: {
    clicksToday: number;
    clicksThisWeek: number;
    clicksThisMonth: number;
    uniqueClicksThisMonth: number;
    conversionsThisMonth: number;
    conversionRate: number;
    epc: number;
  };

  /** Recent activity. */
  recentClicks: AffiliateClick[];
  recentConversions: Conversion[];
  recentCommissions: Commission[];

  /** Quick stats. */
  topLinks: { link: AffiliateLink; clicks: number; conversions: number }[];
  topCampaigns: { campaign: string; clicks: number; revenue: number }[];

  /** Announcements from program manager. */
  announcements: Announcement[];

  /** Pending actions. */
  pendingActions: PendingAction[];
}

interface CreativeAsset {
  id: string;
  programId: string;
  name: string;
  description: string;
  type: 'banner' | 'text_link' | 'email_template' | 'social_post' | 'video' | 'landing_page';
  category: string;
  dimensions: { width: number; height: number } | null;
  fileUrl: string;
  thumbnailUrl: string | null;
  htmlCode: string | null;
  isActive: boolean;
  downloads: number;
  createdAt: Date;
  updatedAt: Date;
}

interface PerformanceReport {
  affiliateId: string;
  dateRange: DateRange;
  summary: {
    totalClicks: number;
    uniqueClicks: number;
    totalConversions: number;
    conversionRate: number;
    totalRevenue: number;
    totalCommissions: number;
    averageOrderValue: number;
    epc: number;
  };
  dailyBreakdown: DailyMetrics[];
  linkBreakdown: LinkMetrics[];
  campaignBreakdown: CampaignMetrics[];
  productBreakdown: ProductMetrics[];
  geoBreakdown: GeoMetrics[];
  deviceBreakdown: DeviceMetrics[];
}

interface DailyMetrics {
  date: string;
  clicks: number;
  uniqueClicks: number;
  conversions: number;
  revenue: number;
  commissions: number;
  epc: number;
}

interface LinkMetrics {
  linkId: string;
  url: string;
  campaign: string | null;
  clicks: number;
  conversions: number;
  revenue: number;
  conversionRate: number;
}

interface CampaignMetrics {
  campaign: string;
  clicks: number;
  conversions: number;
  revenue: number;
  epc: number;
}

interface ProductMetrics {
  productId: string;
  productName: string;
  conversions: number;
  revenue: number;
  commissions: number;
}

interface GeoMetrics {
  country: string;
  clicks: number;
  conversions: number;
  revenue: number;
}

interface DeviceMetrics {
  device: 'desktop' | 'mobile' | 'tablet';
  clicks: number;
  conversions: number;
  conversionRate: number;
}

interface PortalConfig {
  programId: string;
  branding: ProgramBranding;
  features: {
    showLeaderboard: boolean;
    showCreativeLibrary: boolean;
    showSubAffiliates: boolean;
    showEarningsBreakdown: boolean;
    allowVanityUrls: boolean;
    allowPromoCodes: boolean;
    allowDeepLinks: boolean;
    allowQRCodes: boolean;
  };
  navigation: NavItem[];
  customPages: CustomPage[];
}

interface NavItem {
  label: string;
  path: string;
  icon: string;
  badge: string | null;
}

interface CustomPage {
  slug: string;
  title: string;
  content: string;  // Markdown
}

interface Announcement {
  id: string;
  title: string;
  content: string;
  priority: 'low' | 'normal' | 'high';
  publishedAt: Date;
  expiresAt: Date | null;
}

interface PendingAction {
  type: 'complete_profile' | 'set_payout_method' | 'submit_tax_form' | 'accept_terms';
  description: string;
  priority: 'required' | 'recommended';
  actionUrl: string;
}

interface LeaderboardEntry {
  rank: number;
  affiliateId: string;
  affiliateName: string;
  avatarUrl: string | null;
  tier: AffiliateTier;
  metric: number;
  change: number;
}

interface LeaderboardOptions {
  metric: 'revenue' | 'conversions' | 'clicks' | 'epc';
  period: 'week' | 'month' | 'quarter' | 'year' | 'alltime';
  limit: number;
}
```

### Analytics Types

```typescript
interface ProgramAnalytics {
  programId: string;
  dateRange: DateRange;

  overview: {
    totalAffiliates: number;
    activeAffiliates: number;
    newAffiliates: number;
    totalClicks: number;
    uniqueClicks: number;
    totalConversions: number;
    conversionRate: number;
    totalRevenue: number;
    totalCommissionsPaid: number;
    averageOrderValue: number;
    averageEPC: number;
    programROI: number;
  };

  trends: {
    daily: DailyProgramMetrics[];
    weekly: WeeklyProgramMetrics[];
    monthly: MonthlyProgramMetrics[];
  };

  affiliateDistribution: {
    byTier: Record<AffiliateTier, number>;
    byStatus: Record<AffiliateStatus, number>;
    byCountry: { country: string; count: number }[];
  };

  conversionFunnel: ConversionFunnel;

  topPerformers: {
    byRevenue: TopAffiliateEntry[];
    byConversions: TopAffiliateEntry[];
    byEPC: TopAffiliateEntry[];
  };

  commissionAnalysis: {
    totalCalculated: number;
    totalApproved: number;
    totalPending: number;
    totalRejected: number;
    averageCommission: number;
    commissionByType: Record<CommissionType, { count: number; amount: number }>;
  };

  fraudSummary: FraudAnalytics;
}

interface ConversionFunnel {
  impressions: number;
  clicks: number;
  uniqueVisitors: number;
  addToCarts: number;
  conversions: number;
  clickThroughRate: number;
  conversionRate: number;
  dropOffRates: {
    impressionToClick: number;
    clickToVisitor: number;
    visitorToCart: number;
    cartToConversion: number;
  };
}

interface EarningsPerClick {
  overall: number;
  byProgram: { programId: string; epc: number }[];
  byAffiliate: { affiliateId: string; epc: number }[];
  byCampaign: { campaign: string; epc: number }[];
  trend: { date: string; epc: number }[];
}

interface ProgramROI {
  programId: string;
  dateRange: DateRange;
  totalRevenue: number;
  totalCommissions: number;
  operatingCosts: number;
  netProfit: number;
  roi: number;
  costPerAcquisition: number;
  revenuePerAffiliate: number;
  lifetimeValuePerCustomer: number;
  paybackPeriodDays: number;
}

interface TopAffiliateReport {
  period: DateRange;
  affiliates: TopAffiliateEntry[];
  totalCount: number;
}

interface TopAffiliateEntry {
  rank: number;
  affiliateId: string;
  affiliateName: string;
  tier: AffiliateTier;
  revenue: number;
  conversions: number;
  clicks: number;
  epc: number;
  conversionRate: number;
  commissionEarned: number;
}

interface DailyProgramMetrics {
  date: string;
  clicks: number;
  conversions: number;
  revenue: number;
  commissions: number;
  newAffiliates: number;
}

interface WeeklyProgramMetrics {
  weekStart: string;
  clicks: number;
  conversions: number;
  revenue: number;
  commissions: number;
}

interface MonthlyProgramMetrics {
  month: string;
  clicks: number;
  conversions: number;
  revenue: number;
  commissions: number;
  activeAffiliates: number;
}
```

---

## Database Schemas

### affiliates

Primary table for affiliate records.

```typescript
import {
  pgTable,
  uuid,
  text,
  varchar,
  timestamp,
  integer,
  numeric,
  boolean,
  jsonb,
  index,
  uniqueIndex,
} from 'drizzle-orm/pg-core';

export const affiliates = pgTable(
  'affiliates',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    ventureId: uuid('venture_id').notNull().references(() => ventures.id),
    programId: uuid('program_id').notNull().references(() => affiliatePrograms.id),
    userId: uuid('user_id').references(() => users.id),
    referralCode: varchar('referral_code', { length: 50 }).notNull(),
    status: varchar('status', { length: 20 }).notNull().default('pending'),
    tier: varchar('tier', { length: 20 }).notNull().default('bronze'),
    profile: jsonb('profile').notNull().$type<AffiliateProfile>(),
    parentAffiliateId: uuid('parent_affiliate_id').references(() => affiliates.id),
    depth: integer('depth').notNull().default(0),
    termsAcceptedAt: timestamp('terms_accepted_at', { withTimezone: true }),
    termsVersion: varchar('terms_version', { length: 20 }),
    taxFormOnFile: boolean('tax_form_on_file').notNull().default(false),
    preferredPayoutMethodId: uuid('preferred_payout_method_id'),
    metadata: jsonb('metadata').notNull().default({}),
    lifetimeEarnings: numeric('lifetime_earnings', { precision: 12, scale: 2 }).notNull().default('0'),
    unpaidBalance: numeric('unpaid_balance', { precision: 12, scale: 2 }).notNull().default('0'),
    totalConversions: integer('total_conversions').notNull().default(0),
    suspensionReason: text('suspension_reason'),
    lastActivityAt: timestamp('last_activity_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    ventureIdx: index('affiliates_venture_id_idx').on(table.ventureId),
    programIdx: index('affiliates_program_id_idx').on(table.programId),
    userIdx: index('affiliates_user_id_idx').on(table.userId),
    statusIdx: index('affiliates_status_idx').on(table.status),
    tierIdx: index('affiliates_tier_idx').on(table.tier),
    parentIdx: index('affiliates_parent_affiliate_id_idx').on(table.parentAffiliateId),
    referralCodeUnique: uniqueIndex('affiliates_referral_code_venture_unique')
      .on(table.ventureId, table.referralCode),
    ventureStatusIdx: index('affiliates_venture_status_idx')
      .on(table.ventureId, table.status),
    lastActivityIdx: index('affiliates_last_activity_at_idx').on(table.lastActivityAt),
  })
);
```

### affiliate_programs

Program configuration and settings.

```typescript
export const affiliatePrograms = pgTable(
  'affiliate_programs',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    ventureId: uuid('venture_id').notNull().references(() => ventures.id),
    name: varchar('name', { length: 200 }).notNull(),
    description: text('description').notNull(),
    slug: varchar('slug', { length: 100 }).notNull(),
    status: varchar('status', { length: 20 }).notNull().default('draft'),
    commissionStructure: jsonb('commission_structure').notNull().$type<CommissionStructure>(),
    attributionWindow: jsonb('attribution_window').notNull().$type<AttributionWindow>(),
    cookieSettings: jsonb('cookie_settings').notNull().$type<CookieSettings>(),
    payoutSchedule: jsonb('payout_schedule').notNull().$type<PayoutSchedule>(),
    terms: jsonb('terms').notNull().$type<ProgramTerms>(),
    requiresApproval: boolean('requires_approval').notNull().default(true),
    autoApprovalCriteria: jsonb('auto_approval_criteria').$type<AutoApprovalCriteria>(),
    tierThresholds: jsonb('tier_thresholds').notNull().$type<TierThreshold[]>().default([]),
    allowedPromotionMethods: jsonb('allowed_promotion_methods').notNull().$type<string[]>().default([]),
    restrictedKeywords: jsonb('restricted_keywords').notNull().$type<string[]>().default([]),
    branding: jsonb('branding').notNull().$type<ProgramBranding>(),
    allowSubAffiliates: boolean('allow_sub_affiliates').notNull().default(false),
    maxSubAffiliateDepth: integer('max_sub_affiliate_depth').notNull().default(0),
    crossVentureEnabled: boolean('cross_venture_enabled').notNull().default(false),
    metadata: jsonb('metadata').notNull().default({}),
    totalAffiliates: integer('total_affiliates').notNull().default(0),
    activeAffiliates: integer('active_affiliates').notNull().default(0),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    ventureIdx: index('affiliate_programs_venture_id_idx').on(table.ventureId),
    slugUnique: uniqueIndex('affiliate_programs_venture_slug_unique')
      .on(table.ventureId, table.slug),
    statusIdx: index('affiliate_programs_status_idx').on(table.status),
  })
);
```

### affiliate_links

Tracking links, vanity URLs, and promo codes.

```typescript
export const affiliateLinks = pgTable(
  'affiliate_links',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    affiliateId: uuid('affiliate_id').notNull().references(() => affiliates.id),
    programId: uuid('program_id').notNull().references(() => affiliatePrograms.id),
    ventureId: uuid('venture_id').notNull().references(() => ventures.id),
    url: text('url').notNull(),
    shortUrl: text('short_url'),
    vanitySlug: varchar('vanity_slug', { length: 100 }),
    destinationUrl: text('destination_url').notNull(),
    campaign: varchar('campaign', { length: 200 }),
    subId: varchar('sub_id', { length: 200 }),
    utmParams: jsonb('utm_params').$type<UTMParams>(),
    isActive: boolean('is_active').notNull().default(true),
    totalClicks: integer('total_clicks').notNull().default(0),
    uniqueClicks: integer('unique_clicks').notNull().default(0),
    totalConversions: integer('total_conversions').notNull().default(0),
    expiresAt: timestamp('expires_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    affiliateIdx: index('affiliate_links_affiliate_id_idx').on(table.affiliateId),
    programIdx: index('affiliate_links_program_id_idx').on(table.programId),
    ventureIdx: index('affiliate_links_venture_id_idx').on(table.ventureId),
    vanitySlugUnique: uniqueIndex('affiliate_links_vanity_slug_unique')
      .on(table.ventureId, table.vanitySlug),
    campaignIdx: index('affiliate_links_campaign_idx').on(table.campaign),
    isActiveIdx: index('affiliate_links_is_active_idx').on(table.isActive),
  })
);
```

### affiliate_clicks

Raw click event storage.

```typescript
export const affiliateClicks = pgTable(
  'affiliate_clicks',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    linkId: uuid('link_id').notNull().references(() => affiliateLinks.id),
    affiliateId: uuid('affiliate_id').notNull().references(() => affiliates.id),
    programId: uuid('program_id').notNull().references(() => affiliatePrograms.id),
    ventureId: uuid('venture_id').notNull().references(() => ventures.id),
    ipAddress: varchar('ip_address', { length: 45 }).notNull(),
    ipCountry: varchar('ip_country', { length: 2 }),
    ipCity: varchar('ip_city', { length: 200 }),
    userAgent: text('user_agent'),
    referer: text('referer'),
    fingerprint: varchar('fingerprint', { length: 64 }),
    isUnique: boolean('is_unique').notNull().default(true),
    isBot: boolean('is_bot').notNull().default(false),
    device: varchar('device', { length: 20 }),
    browser: varchar('browser', { length: 50 }),
    os: varchar('os', { length: 50 }),
    subId: varchar('sub_id', { length: 200 }),
    campaign: varchar('campaign', { length: 200 }),
    fraudScore: integer('fraud_score').notNull().default(0),
    fraudFlags: jsonb('fraud_flags').notNull().default([]).$type<string[]>(),
    convertedAt: timestamp('converted_at', { withTimezone: true }),
    conversionId: uuid('conversion_id'),
    clickedAt: timestamp('clicked_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    linkIdx: index('affiliate_clicks_link_id_idx').on(table.linkId),
    affiliateIdx: index('affiliate_clicks_affiliate_id_idx').on(table.affiliateId),
    ventureIdx: index('affiliate_clicks_venture_id_idx').on(table.ventureId),
    clickedAtIdx: index('affiliate_clicks_clicked_at_idx').on(table.clickedAt),
    fingerprintIdx: index('affiliate_clicks_fingerprint_idx').on(table.fingerprint),
    ipIdx: index('affiliate_clicks_ip_address_idx').on(table.ipAddress),
    conversionIdx: index('affiliate_clicks_conversion_id_idx').on(table.conversionId),
    ventureDateIdx: index('affiliate_clicks_venture_date_idx')
      .on(table.ventureId, table.clickedAt),
  })
);
```

### affiliate_conversions

Conversion events with attribution data.

```typescript
export const affiliateConversions = pgTable(
  'affiliate_conversions',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    ventureId: uuid('venture_id').notNull().references(() => ventures.id),
    programId: uuid('program_id').notNull().references(() => affiliatePrograms.id),
    affiliateId: uuid('affiliate_id').notNull().references(() => affiliates.id),
    linkId: uuid('link_id').references(() => affiliateLinks.id),
    clickId: uuid('click_id').references(() => affiliateClicks.id),
    type: varchar('type', { length: 30 }).notNull(),
    externalId: varchar('external_id', { length: 255 }).notNull(),
    amount: numeric('amount', { precision: 12, scale: 2 }).notNull(),
    currency: varchar('currency', { length: 3 }).notNull().default('USD'),
    productId: varchar('product_id', { length: 255 }),
    productName: varchar('product_name', { length: 500 }),
    customerHash: varchar('customer_hash', { length: 64 }).notNull(),
    isNewCustomer: boolean('is_new_customer').notNull().default(true),
    attributionModel: varchar('attribution_model', { length: 20 }).notNull(),
    attributionConfidence: numeric('attribution_confidence', { precision: 3, scale: 2 }).notNull(),
    status: varchar('status', { length: 20 }).notNull().default('pending'),
    billingPeriod: integer('billing_period'),
    metadata: jsonb('metadata').notNull().default({}),
    convertedAt: timestamp('converted_at', { withTimezone: true }).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    ventureIdx: index('affiliate_conversions_venture_id_idx').on(table.ventureId),
    programIdx: index('affiliate_conversions_program_id_idx').on(table.programId),
    affiliateIdx: index('affiliate_conversions_affiliate_id_idx').on(table.affiliateId),
    externalIdUnique: uniqueIndex('affiliate_conversions_external_id_unique')
      .on(table.ventureId, table.externalId),
    statusIdx: index('affiliate_conversions_status_idx').on(table.status),
    convertedAtIdx: index('affiliate_conversions_converted_at_idx').on(table.convertedAt),
    customerHashIdx: index('affiliate_conversions_customer_hash_idx').on(table.customerHash),
    typeIdx: index('affiliate_conversions_type_idx').on(table.type),
  })
);
```

### commissions

Commission calculations and their statuses.

```typescript
export const commissions = pgTable(
  'commissions',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    affiliateId: uuid('affiliate_id').notNull().references(() => affiliates.id),
    programId: uuid('program_id').notNull().references(() => affiliatePrograms.id),
    ventureId: uuid('venture_id').notNull().references(() => ventures.id),
    conversionId: uuid('conversion_id').notNull().references(() => affiliateConversions.id),
    linkId: uuid('link_id').references(() => affiliateLinks.id),
    amount: numeric('amount', { precision: 12, scale: 2 }).notNull(),
    currency: varchar('currency', { length: 3 }).notNull().default('USD'),
    type: varchar('type', { length: 30 }).notNull(),
    rate: numeric('rate', { precision: 8, scale: 4 }).notNull(),
    baseAmount: numeric('base_amount', { precision: 12, scale: 2 }).notNull(),
    status: varchar('status', { length: 20 }).notNull().default('pending'),
    affiliateTierAtCalculation: varchar('affiliate_tier_at_calculation', { length: 20 }).notNull(),
    ruleId: uuid('rule_id').notNull(),
    recurringCycle: integer('recurring_cycle'),
    originatingAffiliateId: uuid('originating_affiliate_id'),
    subAffiliateLevel: integer('sub_affiliate_level').notNull().default(0),
    payoutId: uuid('payout_id'),
    fraudScore: integer('fraud_score').notNull().default(0),
    breakdown: jsonb('breakdown').notNull().$type<CommissionBreakdown>(),
    payableAt: timestamp('payable_at', { withTimezone: true }).notNull(),
    paidAt: timestamp('paid_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    affiliateIdx: index('commissions_affiliate_id_idx').on(table.affiliateId),
    programIdx: index('commissions_program_id_idx').on(table.programId),
    ventureIdx: index('commissions_venture_id_idx').on(table.ventureId),
    conversionIdx: index('commissions_conversion_id_idx').on(table.conversionId),
    statusIdx: index('commissions_status_idx').on(table.status),
    payoutIdx: index('commissions_payout_id_idx').on(table.payoutId),
    payableAtIdx: index('commissions_payable_at_idx').on(table.payableAt),
    affiliateStatusIdx: index('commissions_affiliate_status_idx')
      .on(table.affiliateId, table.status),
    venturePayableIdx: index('commissions_venture_payable_idx')
      .on(table.ventureId, table.status, table.payableAt),
  })
);
```

### payouts

Payout records and batch processing.

```typescript
export const payouts = pgTable(
  'payouts',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    ventureId: uuid('venture_id').notNull().references(() => ventures.id),
    programId: uuid('program_id').notNull().references(() => affiliatePrograms.id),
    affiliateId: uuid('affiliate_id').notNull().references(() => affiliates.id),
    batchId: uuid('batch_id').notNull(),
    amount: numeric('amount', { precision: 12, scale: 2 }).notNull(),
    currency: varchar('currency', { length: 3 }).notNull().default('USD'),
    commissionCount: integer('commission_count').notNull(),
    method: varchar('method', { length: 30 }).notNull(),
    providerReference: varchar('provider_reference', { length: 255 }),
    status: varchar('status', { length: 20 }).notNull().default('pending'),
    periodStart: timestamp('period_start', { withTimezone: true }).notNull(),
    periodEnd: timestamp('period_end', { withTimezone: true }).notNull(),
    processingFee: numeric('processing_fee', { precision: 8, scale: 2 }).notNull().default('0'),
    netAmount: numeric('net_amount', { precision: 12, scale: 2 }).notNull(),
    failureReason: text('failure_reason'),
    notes: text('notes'),
    initiatedAt: timestamp('initiated_at', { withTimezone: true }).notNull().defaultNow(),
    completedAt: timestamp('completed_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    ventureIdx: index('payouts_venture_id_idx').on(table.ventureId),
    affiliateIdx: index('payouts_affiliate_id_idx').on(table.affiliateId),
    batchIdx: index('payouts_batch_id_idx').on(table.batchId),
    statusIdx: index('payouts_status_idx').on(table.status),
    periodIdx: index('payouts_period_idx').on(table.periodStart, table.periodEnd),
    affiliateStatusIdx: index('payouts_affiliate_status_idx')
      .on(table.affiliateId, table.status),
  })
);
```

### payout_methods

Affiliate payment method details (encrypted sensitive fields).

```typescript
export const payoutMethods = pgTable(
  'payout_methods',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    affiliateId: uuid('affiliate_id').notNull().references(() => affiliates.id),
    ventureId: uuid('venture_id').notNull().references(() => ventures.id),
    type: varchar('type', { length: 30 }).notNull(),
    isDefault: boolean('is_default').notNull().default(false),
    details: jsonb('details').notNull().$type<PayoutMethodDetails>(),  // Encrypted at app layer
    isVerified: boolean('is_verified').notNull().default(false),
    verifiedAt: timestamp('verified_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    affiliateIdx: index('payout_methods_affiliate_id_idx').on(table.affiliateId),
    ventureIdx: index('payout_methods_venture_id_idx').on(table.ventureId),
    defaultIdx: index('payout_methods_default_idx').on(table.affiliateId, table.isDefault),
  })
);
```

### fraud_flags

Fraud detection flags and review items.

```typescript
export const fraudFlags = pgTable(
  'fraud_flags',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    ventureId: uuid('venture_id').notNull().references(() => ventures.id),
    programId: uuid('program_id').notNull().references(() => affiliatePrograms.id),
    affiliateId: uuid('affiliate_id').notNull().references(() => affiliates.id),
    type: varchar('type', { length: 20 }).notNull(),  // 'click' | 'conversion' | 'commission'
    referenceId: uuid('reference_id').notNull(),
    fraudScore: integer('fraud_score').notNull(),
    fraudLevel: varchar('fraud_level', { length: 20 }).notNull(),
    triggeredRules: jsonb('triggered_rules').notNull().$type<TriggeredRule[]>(),
    recommendation: varchar('recommendation', { length: 20 }).notNull(),
    explanation: text('explanation').notNull(),
    status: varchar('status', { length: 20 }).notNull().default('pending'),
    reviewedBy: uuid('reviewed_by'),
    reviewedAt: timestamp('reviewed_at', { withTimezone: true }),
    reviewNotes: text('review_notes'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    ventureIdx: index('fraud_flags_venture_id_idx').on(table.ventureId),
    affiliateIdx: index('fraud_flags_affiliate_id_idx').on(table.affiliateId),
    statusIdx: index('fraud_flags_status_idx').on(table.status),
    referenceIdx: index('fraud_flags_reference_id_idx').on(table.referenceId),
    fraudLevelIdx: index('fraud_flags_fraud_level_idx').on(table.fraudLevel),
    ventureStatusIdx: index('fraud_flags_venture_status_idx')
      .on(table.ventureId, table.status),
  })
);
```

### affiliate_creatives

Creative assets for the affiliate portal.

```typescript
export const affiliateCreatives = pgTable(
  'affiliate_creatives',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    programId: uuid('program_id').notNull().references(() => affiliatePrograms.id),
    ventureId: uuid('venture_id').notNull().references(() => ventures.id),
    name: varchar('name', { length: 200 }).notNull(),
    description: text('description'),
    type: varchar('type', { length: 30 }).notNull(),
    category: varchar('category', { length: 100 }).notNull().default('general'),
    width: integer('width'),
    height: integer('height'),
    fileUrl: text('file_url').notNull(),
    thumbnailUrl: text('thumbnail_url'),
    htmlCode: text('html_code'),
    isActive: boolean('is_active').notNull().default(true),
    downloads: integer('downloads').notNull().default(0),
    sortOrder: integer('sort_order').notNull().default(0),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    programIdx: index('affiliate_creatives_program_id_idx').on(table.programId),
    ventureIdx: index('affiliate_creatives_venture_id_idx').on(table.ventureId),
    typeIdx: index('affiliate_creatives_type_idx').on(table.type),
    categoryIdx: index('affiliate_creatives_category_idx').on(table.category),
    isActiveIdx: index('affiliate_creatives_is_active_idx').on(table.isActive),
  })
);
```

### RLS Policies

```sql
-- ============================================================
-- Row-Level Security Policies for Affiliate Module
-- ============================================================

-- Enable RLS on all tables
ALTER TABLE affiliates ENABLE ROW LEVEL SECURITY;
ALTER TABLE affiliate_programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE affiliate_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE affiliate_clicks ENABLE ROW LEVEL SECURITY;
ALTER TABLE affiliate_conversions ENABLE ROW LEVEL SECURITY;
ALTER TABLE commissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE payouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE payout_methods ENABLE ROW LEVEL SECURITY;
ALTER TABLE fraud_flags ENABLE ROW LEVEL SECURITY;
ALTER TABLE affiliate_creatives ENABLE ROW LEVEL SECURITY;

-- Venture isolation (all tables follow this pattern)
CREATE POLICY venture_isolation_affiliates ON affiliates
  FOR ALL USING (venture_id = current_setting('app.venture_id')::uuid);

CREATE POLICY venture_isolation_programs ON affiliate_programs
  FOR ALL USING (venture_id = current_setting('app.venture_id')::uuid);

CREATE POLICY venture_isolation_links ON affiliate_links
  FOR ALL USING (venture_id = current_setting('app.venture_id')::uuid);

CREATE POLICY venture_isolation_clicks ON affiliate_clicks
  FOR ALL USING (venture_id = current_setting('app.venture_id')::uuid);

CREATE POLICY venture_isolation_conversions ON affiliate_conversions
  FOR ALL USING (venture_id = current_setting('app.venture_id')::uuid);

CREATE POLICY venture_isolation_commissions ON commissions
  FOR ALL USING (venture_id = current_setting('app.venture_id')::uuid);

CREATE POLICY venture_isolation_payouts ON payouts
  FOR ALL USING (venture_id = current_setting('app.venture_id')::uuid);

CREATE POLICY venture_isolation_payout_methods ON payout_methods
  FOR ALL USING (venture_id = current_setting('app.venture_id')::uuid);

CREATE POLICY venture_isolation_fraud ON fraud_flags
  FOR ALL USING (venture_id = current_setting('app.venture_id')::uuid);

CREATE POLICY venture_isolation_creatives ON affiliate_creatives
  FOR ALL USING (venture_id = current_setting('app.venture_id')::uuid);

-- Affiliate self-access: affiliates can only see their own records
CREATE POLICY affiliate_self_access ON affiliate_links
  FOR SELECT USING (
    affiliate_id = current_setting('app.affiliate_id', true)::uuid
    OR current_setting('app.role') IN ('admin', 'program_manager')
  );

CREATE POLICY affiliate_self_commissions ON commissions
  FOR SELECT USING (
    affiliate_id = current_setting('app.affiliate_id', true)::uuid
    OR current_setting('app.role') IN ('admin', 'program_manager')
  );

CREATE POLICY affiliate_self_payouts ON payouts
  FOR SELECT USING (
    affiliate_id = current_setting('app.affiliate_id', true)::uuid
    OR current_setting('app.role') IN ('admin', 'program_manager')
  );

-- Payout methods: strictly self-access only
CREATE POLICY affiliate_own_payout_methods ON payout_methods
  FOR ALL USING (
    affiliate_id = current_setting('app.affiliate_id', true)::uuid
    OR current_setting('app.role') = 'admin'
  );
```

---

## Code Examples

### Example 1: Creating an Affiliate Program

```typescript
import { createAffiliateService } from '@mcv/growth/affiliates';

const affiliateService = createAffiliateService({ db, redpanda, config });

// Create a new affiliate program for an e-commerce venture
const program = await affiliateService.createProgram({
  name: 'Partner Program 2025',
  description: 'Earn commissions by promoting our products. Up to 30% per sale!',
  slug: 'partner-2025',
  requiresApproval: true,

  commissionStructure: {
    defaultRule: {
      name: 'Standard Commission',
      type: 'percentage',
      rate: 15,             // 15% base commission
      currency: 'USD',
      holdPeriodDays: 30,   // 30-day hold before payable
      priority: 1,
      isActive: true,
      effectiveFrom: new Date(),
      tiers: [
        { minConversions: 0,   maxConversions: 50,   rate: 15, period: 'monthly' },
        { minConversions: 51,  maxConversions: 200,  rate: 20, period: 'monthly' },
        { minConversions: 201, maxConversions: null,  rate: 25, period: 'monthly' },
      ],
    },
  },

  attributionWindow: {
    days: 60,
    lifetime: false,
    model: 'last_click',
  },

  cookieSettings: {
    cookieName: '_mcv_aff',
    durationDays: 60,
    firstParty: true,
    sameSite: 'lax',
    secure: true,
    domain: null,
  },

  payoutSchedule: {
    frequency: 'monthly',
    dayOfMonth: 15,
    minimumThreshold: 50,
    currency: 'USD',
    holdPeriodDays: 30,
    autoProcess: true,
    isActive: true,
  },

  terms: {
    version: '1.0',
    content: 'Full terms and conditions text...',
    effectiveDate: new Date(),
    commissionDisclosure: 'Affiliates earn 15-25% commission on referred sales.',
    prohibitedActivities: [
      'Cookie stuffing',
      'Incentivized clicks',
      'Brand bidding on search engines',
      'Trademark infringement',
      'Spam or unsolicited emails',
    ],
    terminationPolicy: 'Program may be terminated with 30 days notice.',
  },

  allowSubAffiliates: true,
  maxSubAffiliateDepth: 2,

  branding: {
    primaryColor: '#4F46E5',
    accentColor: '#10B981',
  },
});

console.log(`Program created: ${program.id} (${program.name})`);
// Program created: a1b2c3d4-... (Partner Program 2025)
```

### Example 2: Affiliate Registration and Approval Workflow

```typescript
import { createAffiliateService } from '@mcv/growth/affiliates';

const affiliateService = createAffiliateService({ db, redpanda, config });

// Step 1: Affiliate submits an application
const affiliate = await affiliateService.applyAsAffiliate({
  programId: 'a1b2c3d4-...',
  profile: {
    name: 'Jane Creator',
    email: 'jane@techreviews.com',
    company: 'Tech Reviews Inc.',
    website: 'https://techreviews.com',
    socialProfiles: [
      { platform: 'youtube', url: 'https://youtube.com/@janecreator', followerCount: 125000 },
      { platform: 'twitter', url: 'https://twitter.com/janecreator', followerCount: 45000 },
    ],
    promotionMethods: ['youtube', 'blog', 'email_newsletter'],
    estimatedReach: '200k monthly impressions',
    country: 'US',
    language: 'en',
    phone: null,
    avatarUrl: 'https://techreviews.com/jane-avatar.jpg',
    bio: 'Tech reviewer with 5 years of experience covering SaaS tools and productivity software.',
  },
  referredBy: null,
  metadata: {
    hearAboutUs: 'twitter',
    experience: '5_years_plus',
  },
});

console.log(`Application submitted: ${affiliate.id}, status: ${affiliate.status}`);
// Application submitted: e5f6g7h8-..., status: pending

// Step 2: Program manager reviews and approves
const approvedAffiliate = await affiliateService.approveAffiliate(affiliate.id, {
  customTier: 'silver',  // Start at Silver due to audience size
  welcomeMessage: 'Welcome to the team, Jane! Your audience is a perfect fit.',
  skipTermsAcceptance: false,
});

console.log(`Affiliate approved: ${approvedAffiliate.status}, tier: ${approvedAffiliate.tier}`);
// Affiliate approved: approved, tier: silver

// Step 3: Affiliate accepts terms
// (Handled via portal UI, updates termsAcceptedAt)

// Step 4: Affiliate is now active and can generate links
const link = await affiliateService.createLink({
  affiliateId: approvedAffiliate.id,
  programId: 'a1b2c3d4-...',
  destinationUrl: 'https://myproduct.com/pricing',
  campaign: 'youtube-review-2025',
  utmParams: {
    source: 'youtube',
    medium: 'video',
    campaign: 'jane-review',
  },
});

console.log(`Tracking link created: ${link.url}`);
// Tracking link created: https://ref.mcv.one/t/e5f6g7h8?c=youtube-review-2025&...
```

### Example 3: Click Tracking and Conversion Attribution

```typescript
import { createAffiliateService } from '@mcv/growth/affiliates';

const affiliateService = createAffiliateService({ db, redpanda, config });

// Step 1: User clicks an affiliate link (handled by tracking endpoint)
const click = await affiliateService.recordClick({
  linkId: 'link-uuid-...',
  ipAddress: '203.0.113.42',
  userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) ...',
  referer: 'https://youtube.com/watch?v=abc123',
  headers: {
    'accept-language': 'en-US,en;q=0.9',
  },
});

console.log(`Click recorded: ${click.id}, unique: ${click.isUnique}, fraud score: ${click.fraudScore}`);
// Click recorded: click-uuid-..., unique: true, fraud score: 5

// Step 2: Days later, user makes a purchase (conversion webhook from e-commerce)
const conversion = await affiliateService.recordConversion({
  programId: 'a1b2c3d4-...',
  type: 'sale',
  externalId: 'order-12345',
  amount: 299.00,
  currency: 'USD',
  productId: 'prod-premium-plan',
  productName: 'Premium Annual Plan',
  customerHash: 'sha256-of-customer-email',
  isNewCustomer: true,
  trackingCookie: '_mcv_aff=e5f6g7h8.link-uuid.click-uuid.1706745600',
  metadata: {
    orderItems: 1,
    couponUsed: false,
  },
});

console.log(`Conversion recorded: ${conversion.id}`);
console.log(`Attributed to: ${conversion.affiliateId}`);
console.log(`Attribution model: ${conversion.attributionModel}`);
console.log(`Confidence: ${conversion.attributionConfidence}`);
// Conversion recorded: conv-uuid-...
// Attributed to: e5f6g7h8-...
// Attribution model: last_click
// Confidence: 0.95

// Step 3: Resolve attribution manually (for debugging or manual attribution)
const attribution = await affiliateService.resolveAttribution({
  trackingCookie: '_mcv_aff=e5f6g7h8.link-uuid.click-uuid.1706745600',
  fingerprint: {
    screenResolution: '2560x1440',
    timezone: 'America/New_York',
    language: 'en-US',
    platform: 'MacIntel',
    colorDepth: 24,
    plugins: ['pdf', 'flash'],
  },
  authenticatedUserId: null,
  promoCode: null,
});

console.log(`Attribution resolved via: ${attribution?.method}`);
// Attribution resolved via: cookie
```

### Example 4: Commission Calculation with Tiered Rates

```typescript
import { CommissionEngine } from '@mcv/growth/affiliates';

const commissionEngine = new CommissionEngine({ db, config });

// Calculate commissions for a conversion
// The engine automatically:
// 1. Loads the program's commission rules
// 2. Checks product-specific overrides
// 3. Applies the affiliate's tier multiplier
// 4. Handles recurring and sub-affiliate commissions

const conversion: Conversion = {
  id: 'conv-uuid-...',
  ventureId: 'venture-uuid-...',
  programId: 'program-uuid-...',
  affiliateId: 'affiliate-uuid-...',
  linkId: 'link-uuid-...',
  clickId: 'click-uuid-...',
  type: 'subscription',
  externalId: 'sub-12345',
  amount: 99.00,
  currency: 'USD',
  productId: 'premium-monthly',
  productName: 'Premium Monthly Plan',
  customerHash: 'sha256...',
  isNewCustomer: true,
  attributionModel: 'last_click',
  attributionConfidence: 0.95,
  status: 'confirmed',
  billingPeriod: 1,
  metadata: {},
  convertedAt: new Date(),
  createdAt: new Date(),
};

const commissions = await commissionEngine.calculate(conversion);

// For a Gold-tier affiliate with a subscription product:
// Base commission: 20% (tiered rate for 51-200 monthly conversions)
// Tier multiplier: 1.15 (Gold tier = 15% bonus)
// Result: $99 × 20% × 1.15 = $22.77

for (const commission of commissions) {
  console.log(`Commission: $${commission.amount} (${commission.type})`);
  console.log(`  Rate: ${commission.rate}%`);
  console.log(`  Tier: ${commission.affiliateTierAtCalculation}`);
  console.log(`  Breakdown:`, JSON.stringify(commission.breakdown, null, 2));
}

// Commission: $22.77 (percentage)
//   Rate: 20
//   Tier: gold
//   Breakdown: {
//     "baseAmount": 99.00,
//     "rate": 20,
//     "tierMultiplier": 1.15,
//     "productOverride": false,
//     "productRate": null,
//     "calculatedAmount": 22.77,
//     "adjustments": [
//       { "type": "tier_bonus", "description": "Gold tier 15% bonus", "amount": 2.97 }
//     ],
//     "finalAmount": 22.77
//   }

// If the affiliate has sub-affiliates, their commissions are also calculated:
// Sub-affiliate level 1: 5% of $99 × 20% = $0.99
// Sub-affiliate level 2: 2% of $99 × 20% = $0.40
```

### Example 5: Fraud Detection Pipeline

```typescript
import { FraudDetectionService } from '@mcv/growth/affiliates';

const fraudService = new FraudDetectionService({ db, config });

// Configure fraud rules for a program
await fraudService.addRule({
  programId: 'program-uuid-...',
  name: 'Click Velocity Limit',
  type: 'velocity',
  severity: 7,
  action: 'flag',
  cooldownMinutes: 60,
  config: {
    type: 'velocity',
    maxClicks: 100,
    windowMinutes: 5,
    scope: 'ip',
  },
});

await fraudService.addRule({
  programId: 'program-uuid-...',
  name: 'Self-Referral Detection',
  type: 'self_referral',
  severity: 10,
  action: 'reject',
  cooldownMinutes: 0,
  config: {
    type: 'self_referral',
    checkEmail: true,
    checkIP: true,
    checkPayment: true,
  },
});

await fraudService.addRule({
  programId: 'program-uuid-...',
  name: 'VPN/Proxy Detection',
  type: 'vpn_proxy',
  severity: 5,
  action: 'flag',
  cooldownMinutes: 30,
  config: {
    type: 'vpn_proxy',
    blockAll: false,
    allowDatacenter: false,
    provider: 'ipqs',
  },
});

await fraudService.addRule({
  programId: 'program-uuid-...',
  name: 'Suspicious Conversion Pattern',
  type: 'conversion_pattern',
  severity: 8,
  action: 'flag',
  cooldownMinutes: 120,
  config: {
    type: 'conversion_pattern',
    maxConversionRate: 0.25,      // Flag if > 25% conversion rate
    minClickToConversion: 30,     // Flag if < 30 seconds
    maxClickToConversion: 86400,  // Flag if > 24 hours
  },
});

// Evaluate a click for fraud
const clickScore = await fraudService.evaluateClick({
  id: 'click-uuid-...',
  linkId: 'link-uuid-...',
  affiliateId: 'affiliate-uuid-...',
  ipAddress: '198.51.100.1',
  userAgent: 'Mozilla/5.0...',
  fingerprint: 'abc123...',
  // ... other click fields
});

console.log(`Click fraud score: ${clickScore.score}/100`);
console.log(`Level: ${clickScore.level}`);
console.log(`Recommendation: ${clickScore.recommendation}`);
console.log(`Triggered rules: ${clickScore.triggeredRules.map(r => r.ruleName).join(', ')}`);
// Click fraud score: 42/100
// Level: medium
// Recommendation: review
// Triggered rules: VPN/Proxy Detection

// Evaluate a conversion
const conversionScore = await fraudService.evaluateConversion(conversion);

if (conversionScore.recommendation === 'reject') {
  console.log(`Conversion rejected: ${conversionScore.explanation}`);
} else if (conversionScore.recommendation === 'review') {
  console.log(`Conversion flagged for manual review`);
  // Commission is created with status 'pending_review'
} else {
  console.log(`Conversion clean, commission approved`);
}

// Review queue management
const reviewQueue = await fraudService.getFraudReviewQueue({
  status: 'pending',
  minScore: 40,
  limit: 20,
});

for (const item of reviewQueue.items) {
  console.log(`[${item.type}] Score: ${item.fraudScore.score} - ${item.fraudScore.explanation}`);
}

// Resolve a flagged item
await affiliateService.resolveFraudReview('review-item-uuid', {
  action: 'approve',
  notes: 'Manually verified — legitimate purchase from VPN user.',
  banAffiliate: false,
});
```

### Example 6: Payout Processing

```typescript
import { PayoutService } from '@mcv/growth/affiliates';

const payoutService = new PayoutService({ db, paymentProviders, config });

// Step 1: Affiliate sets up their payout method
await affiliateService.setPayoutMethod('affiliate-uuid-...', {
  type: 'paypal',
  details: {
    type: 'paypal',
    email: 'jane@techreviews.com',
  },
  isDefault: true,
});

// Alternative: Bank transfer
await affiliateService.setPayoutMethod('affiliate-uuid-...', {
  type: 'bank_ach',
  details: {
    type: 'bank_ach',
    routingNumber: '021000021',
    accountNumber: '123456789',  // Encrypted before storage
    accountType: 'checking',
    accountHolderName: 'Jane Creator',
  },
  isDefault: false,
});

// Alternative: Cryptocurrency
await affiliateService.setPayoutMethod('affiliate-uuid-...', {
  type: 'crypto_usdc',
  details: {
    type: 'crypto_usdc',
    walletAddress: '0x742d35Cc6634C0532925a3b844Bc9e7595f2bD28',
    network: 'ethereum',
  },
  isDefault: false,
});

// Step 2: Submit tax form
await affiliateService.submitTaxForm('affiliate-uuid-...', {
  type: 'w9',
  legalName: 'Jane M. Creator',
  taxId: '123-45-6789',  // Encrypted before storage
  country: 'US',
});

// Step 3: Process payouts (typically called by a cron job)
const batch = await payoutService.processPayouts('program-uuid-...');

console.log(`Payout batch: ${batch.id}`);
console.log(`Total payouts: ${batch.totalPayouts}`);
console.log(`Total amount: $${batch.totalAmount}`);
console.log(`Successful: ${batch.successfulPayouts}`);
console.log(`Failed: ${batch.failedPayouts}`);
// Payout batch: batch-uuid-...
// Total payouts: 47
// Total amount: $12,345.67
// Successful: 45
// Failed: 2

// Step 4: Check individual payout status
const payout = await payoutService.getPayout('payout-uuid-...');
console.log(`Payout to ${payout.affiliateId}: $${payout.netAmount} via ${payout.method}`);
console.log(`Status: ${payout.status}`);
console.log(`Provider ref: ${payout.providerReference}`);
// Payout to affiliate-uuid-...: $187.50 via paypal
// Status: completed
// Provider ref: PP-TXN-ABC123

// Step 5: Handle failed payouts
const failedPayouts = await payoutService.listPayouts({
  status: 'failed',
  programId: 'program-uuid-...',
});

for (const failed of failedPayouts.items) {
  console.log(`Failed payout ${failed.id}: ${failed.failureReason}`);
  // Retry or notify affiliate
}
```

### Example 7: Affiliate Portal Dashboard

```typescript
import { AffiliatePortalService } from '@mcv/growth/affiliates';

const portalService = new AffiliatePortalService({ db, config });

// Get the full dashboard for an affiliate
const dashboard = await portalService.getDashboard('affiliate-uuid-...');

// === Earnings Overview ===
console.log('=== Earnings ===');
console.log(`Today: $${dashboard.earnings.today}`);
console.log(`This week: $${dashboard.earnings.thisWeek}`);
console.log(`This month: $${dashboard.earnings.thisMonth}`);
console.log(`Lifetime: $${dashboard.earnings.lifetime}`);
console.log(`Unpaid balance: $${dashboard.earnings.unpaidBalance}`);
console.log(`Next payout: ${dashboard.earnings.nextPayoutDate?.toLocaleDateString()}`);
console.log(`Estimated: $${dashboard.earnings.nextPayoutEstimate}`);

// === Traffic Stats ===
console.log('\n=== Traffic ===');
console.log(`Clicks this month: ${dashboard.traffic.clicksThisMonth}`);
console.log(`Unique clicks: ${dashboard.traffic.uniqueClicksThisMonth}`);
console.log(`Conversions: ${dashboard.traffic.conversionsThisMonth}`);
console.log(`Conversion rate: ${(dashboard.traffic.conversionRate * 100).toFixed(2)}%`);
console.log(`EPC: $${dashboard.traffic.epc.toFixed(2)}`);

// === Tier Progress ===
console.log('\n=== Tier ===');
console.log(`Current: ${dashboard.currentTier}`);
console.log(`Next: ${dashboard.nextTier}`);
console.log(`Progress: ${dashboard.nextTierProgress}%`);

// === Top Links ===
console.log('\n=== Top Links ===');
for (const { link, clicks, conversions } of dashboard.topLinks) {
  console.log(`${link.campaign}: ${clicks} clicks, ${conversions} conversions`);
}

// === Pending Actions ===
for (const action of dashboard.pendingActions) {
  console.log(`[${action.priority}] ${action.description} → ${action.actionUrl}`);
}

// Get performance report
const report = await portalService.getPerformanceReport('affiliate-uuid-...', {
  start: new Date('2025-01-01'),
  end: new Date('2025-01-31'),
});

console.log('\n=== January Report ===');
console.log(`Total clicks: ${report.summary.totalClicks}`);
console.log(`Conversions: ${report.summary.totalConversions}`);
console.log(`Revenue generated: $${report.summary.totalRevenue}`);
console.log(`Commission earned: $${report.summary.totalCommissions}`);
console.log(`EPC: $${report.summary.epc.toFixed(2)}`);

// Daily breakdown
for (const day of report.dailyBreakdown) {
  console.log(`${day.date}: ${day.clicks} clicks, ${day.conversions} conv, $${day.commissions}`);
}

// Get leaderboard
const leaderboard = await portalService.getLeaderboard('program-uuid-...', {
  metric: 'revenue',
  period: 'month',
  limit: 10,
});

console.log('\n=== Leaderboard (Revenue, This Month) ===');
for (const entry of leaderboard) {
  const arrow = entry.change > 0 ? '↑' : entry.change < 0 ? '↓' : '→';
  console.log(`#${entry.rank} ${entry.affiliateName} (${entry.tier}): $${entry.metric} ${arrow}`);
}
```

### Example 8: Multi-Program and Sub-Affiliate Setup

```typescript
import { createAffiliateService } from '@mcv/growth/affiliates';

const affiliateService = createAffiliateService({ db, redpanda, config });

// Create a SaaS-specific program with recurring commissions
const saasProgram = await affiliateService.createProgram({
  name: 'SaaS Partner Program',
  description: 'Earn recurring commissions for every subscription referral.',
  slug: 'saas-partners',
  requiresApproval: true,

  commissionStructure: {
    defaultRule: {
      name: 'Recurring SaaS Commission',
      type: 'recurring',
      rate: 20,               // 20% recurring
      currency: 'USD',
      holdPeriodDays: 45,     // 45-day hold (covers refund window)
      maxRecurringCycles: 24, // Pay for up to 24 months
      priority: 1,
      isActive: true,
      effectiveFrom: new Date(),
    },
    subAffiliateRules: [
      {
        name: 'Level 1 Sub-Affiliate',
        type: 'sub_affiliate',
        rate: 5,              // 5% of sub-affiliate's commission
        currency: 'USD',
        holdPeriodDays: 45,
        priority: 1,
        isActive: true,
        effectiveFrom: new Date(),
        subAffiliateLevels: [
          { level: 1, rate: 5, type: 'percentage' },
          { level: 2, rate: 2, type: 'percentage' },
        ],
      },
    ],
  },

  attributionWindow: {
    days: 90,
    lifetime: false,
    model: 'first_click',   // First click attribution for SaaS
  },

  allowSubAffiliates: true,
  maxSubAffiliateDepth: 2,

  terms: {
    version: '1.0',
    content: 'SaaS partner terms...',
    effectiveDate: new Date(),
    commissionDisclosure: '20% recurring commission for up to 24 months.',
    prohibitedActivities: ['Spam', 'Cookie stuffing', 'Brand bidding'],
    terminationPolicy: 'Either party may terminate with 30 days notice.',
  },
});

// Register a top-level affiliate
const topAffiliate = await affiliateService.applyAsAffiliate({
  programId: saasProgram.id,
  profile: {
    name: 'Top Affiliate',
    email: 'top@affiliates.com',
    company: 'Affiliate Network Inc.',
    website: 'https://affiliatenetwork.com',
    socialProfiles: [],
    promotionMethods: ['blog', 'email_newsletter', 'paid_ads'],
    estimatedReach: '500k monthly visitors',
    country: 'US',
    language: 'en',
    phone: null,
    avatarUrl: null,
    bio: 'Top affiliate marketer specializing in SaaS products.',
  },
  referredBy: null,
  metadata: {},
});

await affiliateService.approveAffiliate(topAffiliate.id);

// Register a sub-affiliate under the top affiliate
const subAffiliate = await affiliateService.applyAsAffiliate({
  programId: saasProgram.id,
  profile: {
    name: 'Sub Affiliate',
    email: 'sub@affiliates.com',
    company: null,
    website: 'https://subblog.com',
    socialProfiles: [
      { platform: 'twitter', url: 'https://twitter.com/subaffiliate', followerCount: 5000 },
    ],
    promotionMethods: ['blog', 'social_media'],
    estimatedReach: '20k monthly visitors',
    country: 'CA',
    language: 'en',
    phone: null,
    avatarUrl: null,
    bio: 'Blogger covering productivity tools.',
  },
  referredBy: topAffiliate.referralCode, // Links to parent
  metadata: {},
});

await affiliateService.approveAffiliate(subAffiliate.id);

// Now when the sub-affiliate generates a conversion:
// 1. Sub-affiliate gets 20% recurring commission
// 2. Top affiliate gets 5% of the sub-affiliate's commission (level 1)

// Check the affiliate tree
const affiliate = await affiliateService.getAffiliate(subAffiliate.id);
console.log(`Parent: ${affiliate.parentAffiliateId}`); // topAffiliate.id
console.log(`Depth: ${affiliate.depth}`);               // 1

// Get program analytics showing sub-affiliate network value
const analytics = await affiliateService.getProgramAnalytics(saasProgram.id, {
  start: new Date('2025-01-01'),
  end: new Date('2025-12-31'),
});

console.log(`Total affiliates: ${analytics.overview.totalAffiliates}`);
console.log(`Active affiliates: ${analytics.overview.activeAffiliates}`);
console.log(`Total revenue: $${analytics.overview.totalRevenue}`);
console.log(`Total commissions: $${analytics.overview.totalCommissionsPaid}`);
console.log(`Program ROI: ${analytics.overview.programROI}x`);
```

---

## Error Codes

All errors in this module extend `AffiliateError` and follow the pattern `AFFILIATE_<CATEGORY>_<SPECIFIC>`.

| Code | HTTP | Description | Resolution |
|------|------|-------------|------------|
| `AFFILIATE_PROGRAM_NOT_FOUND` | 404 | The specified affiliate program does not exist or is not accessible in the current venture context. | Verify the program ID and ensure it belongs to the current venture. |
| `AFFILIATE_PROGRAM_INACTIVE` | 409 | The program is paused or archived and cannot accept new registrations or link generation. | Check program status; reactivate if paused. |
| `AFFILIATE_PROGRAM_SLUG_TAKEN` | 409 | The program slug is already in use within this venture. | Choose a different slug for the program. |
| `AFFILIATE_NOT_FOUND` | 404 | The specified affiliate does not exist or is not accessible. | Verify the affiliate ID. |
| `AFFILIATE_ALREADY_EXISTS` | 409 | An affiliate with this email or user ID already exists in this program. | Check for existing applications; consider re-activation instead. |
| `AFFILIATE_NOT_APPROVED` | 403 | The affiliate's application has not been approved yet. | Wait for approval or contact the program manager. |
| `AFFILIATE_SUSPENDED` | 403 | The affiliate account is suspended and cannot perform actions. | Contact the program manager for reinstatement. |
| `AFFILIATE_TERMS_NOT_ACCEPTED` | 403 | The affiliate has not accepted the current version of program terms. | Accept the latest terms through the affiliate portal. |
| `AFFILIATE_REFERRAL_CODE_TAKEN` | 409 | The requested referral code is already in use. | Choose a different referral code. |
| `AFFILIATE_LINK_NOT_FOUND` | 404 | The specified tracking link does not exist. | Verify the link ID. |
| `AFFILIATE_LINK_EXPIRED` | 410 | The tracking link has passed its expiration date. | Generate a new tracking link. |
| `AFFILIATE_LINK_INACTIVE` | 409 | The tracking link has been deactivated. | Reactivate the link or create a new one. |
| `AFFILIATE_VANITY_SLUG_TAKEN` | 409 | The vanity URL slug is already in use. | Choose a different vanity slug. |
| `AFFILIATE_PROMO_CODE_TAKEN` | 409 | The promo code is already in use. | Choose a different promo code string. |
| `AFFILIATE_PROMO_CODE_EXPIRED` | 410 | The promo code has expired. | Generate a new promo code with a future expiration. |
| `AFFILIATE_PROMO_CODE_MAX_USES` | 409 | The promo code has reached its maximum usage count. | Increase the max uses or create a new code. |
| `AFFILIATE_CONVERSION_DUPLICATE` | 409 | A conversion with this external ID already exists. | Verify the external ID; this may be a duplicate webhook delivery. |
| `AFFILIATE_CONVERSION_NO_ATTRIBUTION` | 422 | No affiliate could be attributed for this conversion. | Check tracking cookie/fingerprint/promo code; the attribution window may have expired. |
| `AFFILIATE_COMMISSION_NOT_FOUND` | 404 | The specified commission does not exist. | Verify the commission ID. |
| `AFFILIATE_COMMISSION_ALREADY_PAID` | 409 | This commission has already been paid and cannot be modified. | Cannot modify paid commissions; contact support for adjustments. |
| `AFFILIATE_COMMISSION_REJECTED` | 409 | This commission was rejected and cannot be approved. | Review the rejection reason; create a manual adjustment if needed. |
| `AFFILIATE_PAYOUT_BELOW_THRESHOLD` | 422 | The affiliate's unpaid balance is below the minimum payout threshold. | Wait until the balance exceeds the threshold, or lower the program threshold. |
| `AFFILIATE_PAYOUT_NO_METHOD` | 422 | The affiliate has not configured a payout method. | Set up a payout method through the affiliate portal. |
| `AFFILIATE_PAYOUT_NO_TAX_FORM` | 422 | A tax form is required but not on file for this affiliate. | Submit a W-9 (US) or W-8BEN (non-US) form. |
| `AFFILIATE_PAYOUT_FAILED` | 502 | The payment provider rejected the payout. | Check the failure reason; verify payout method details. |
| `AFFILIATE_PAYOUT_METHOD_INVALID` | 422 | The payout method details are invalid or unverifiable. | Double-check account numbers, email addresses, or wallet addresses. |
| `AFFILIATE_FRAUD_HIGH_RISK` | 403 | The action was blocked due to a high fraud risk score. | Review the fraud flags; submit for manual review if legitimate. |
| `AFFILIATE_FRAUD_SELF_REFERRAL` | 403 | Self-referral detected: the affiliate and customer appear to be the same entity. | Self-referrals are not eligible for commission. |
| `AFFILIATE_SELF_REFERRAL_BLOCKED` | 403 | Self-referral attempt blocked before commission calculation. | Affiliates cannot earn commissions on their own purchases. |
| `AFFILIATE_SUB_DEPTH_EXCEEDED` | 422 | The sub-affiliate depth exceeds the program's maximum allowed depth. | Cannot register as a sub-affiliate at this depth level. |
| `AFFILIATE_ATTRIBUTION_WINDOW_EXPIRED` | 422 | The conversion occurred outside the attribution window. | Conversion is not eligible for commission; no active attribution exists. |
| `AFFILIATE_RATE_LIMITED` | 429 | Too many requests from this affiliate or IP address. | Wait before retrying; check for automated/bot traffic. |
| `AFFILIATE_CREATIVE_NOT_FOUND` | 404 | The specified creative asset does not exist. | Verify the creative ID. |
| `AFFILIATE_TAX_FORM_INVALID` | 422 | The submitted tax form contains invalid information. | Verify legal name, tax ID, and country; resubmit. |
| `AFFILIATE_TAX_FORM_EXPIRED` | 410 | The tax form on file has expired and needs renewal. | Submit an updated tax form. |

### Error Response Format

```typescript
interface AffiliateError {
  code: string;
  message: string;
  statusCode: number;
  details?: Record<string, unknown>;
}

// Example error response:
{
  "code": "AFFILIATE_CONVERSION_NO_ATTRIBUTION",
  "message": "No affiliate could be attributed for this conversion. The tracking cookie was not found and fingerprint matching returned no results.",
  "statusCode": 422,
  "details": {
    "externalId": "order-12345",
    "trackingCookie": null,
    "fingerprintMatch": false,
    "promoCode": null,
    "attributionWindowExpired": true,
    "lastClickAge": "75 days (window: 60 days)"
  }
}
```

---

## Security

### Authentication & Authorization

| Role | Access Level | Description |
|------|-------------|-------------|
| `admin` | Full | Platform administrators with unrestricted access to all affiliate data. |
| `program_manager` | Program-scoped | Can manage affiliates, review fraud, process payouts within their assigned programs. |
| `affiliate` | Self-scoped | Can view their own data, generate links, access portal, manage payout methods. |
| `api_consumer` | Webhook-scoped | External systems (e-commerce, billing) that send conversion events via API keys. |
| `readonly` | Read-only | View-only access for reporting and analytics dashboards. |

### Data Protection

#### Sensitive Field Encryption

The following fields are encrypted at the application layer before database storage using AES-256-GCM:

| Table | Field | Encryption |
|-------|-------|------------|
| `payout_methods` | `details.accountNumber` | AES-256-GCM |
| `payout_methods` | `details.iban` | AES-256-GCM |
| `payout_methods` | `details.routingNumber` | AES-256-GCM |
| `payout_methods` | `details.walletAddress` | AES-256-GCM |
| `affiliates` | `profile.phone` | AES-256-GCM |
| Tax forms | `taxId` | AES-256-GCM |

```typescript
// Encryption is handled transparently by the service layer
const method = await affiliateService.setPayoutMethod(affiliateId, {
  type: 'bank_ach',
  details: {
    type: 'bank_ach',
    routingNumber: '021000021',        // Plain text in
    accountNumber: '123456789',        // Plain text in
    accountType: 'checking',
    accountHolderName: 'Jane Creator',
  },
});

// Stored in DB as:
// {
//   "type": "bank_ach",
//   "routingNumber": "enc:v1:aes256gcm:...",
//   "accountNumber": "enc:v1:aes256gcm:...",
//   "accountType": "checking",
//   "accountHolderName": "Jane Creator"
// }
```

#### Customer Data Privacy

- Customer emails are never stored — only a one-way SHA-256 hash (`customerHash`) is kept for deduplication and attribution.
- IP addresses in click records are retained for fraud detection but can be anonymized after a configurable retention period (default: 90 days).
- Fingerprint data is hashed and cannot be reverse-engineered to identify individuals.

#### Data Retention

```typescript
const retentionConfig = {
  clickData: {
    fullRetention: 90,        // Days: keep full IP/UA data
    anonymizedRetention: 365, // Days: keep anonymized click stats
    deletion: 730,            // Days: permanent deletion
  },
  conversionData: {
    retention: 2555,          // 7 years (tax/legal compliance)
  },
  commissionData: {
    retention: 2555,          // 7 years
  },
  payoutData: {
    retention: 2555,          // 7 years
  },
  fraudFlags: {
    retention: 1095,          // 3 years
  },
};
```

### Tracking Security

#### Cookie Security

- All tracking cookies use `HttpOnly`, `Secure`, and `SameSite=Lax` attributes by default.
- First-party cookies are preferred over third-party to survive browser privacy controls (ITP, ETP).
- Cookie values are signed with HMAC-SHA256 to prevent tampering.

```typescript
// Cookie format: affiliate_id.link_id.click_id.timestamp.signature
const cookieValue = `${affiliateId}.${linkId}.${clickId}.${timestamp}.${hmacSig}`;

// Validation on conversion:
const isValid = verifyHMAC(cookieParts.slice(0, 4).join('.'), cookieParts[4], secret);
```

#### Tracking Endpoint Rate Limiting

| Endpoint | Rate Limit | Window |
|----------|-----------|--------|
| Click redirect | 100 req/IP/min | 1 minute |
| Conversion webhook | 50 req/API key/min | 1 minute |
| Portal API | 200 req/affiliate/min | 1 minute |
| Link generation | 20 req/affiliate/min | 1 minute |

#### Anti-Fraud Measures

1. **HMAC-signed tracking cookies** — Prevents cookie stuffing and tampering.
2. **Click fingerprinting** — Canvas, WebGL, and audio fingerprinting for cookieless attribution.
3. **IP intelligence** — Integration with IPQualityScore/MaxMind for VPN/proxy/bot detection.
4. **Velocity limits** — Configurable per-IP, per-affiliate, and per-link click limits.
5. **Self-referral detection** — Cross-references affiliate email, IP, payment methods, and device fingerprints against customer data.
6. **Conversion timing analysis** — Flags suspiciously fast (<30s) or slow (>attribution window) conversions.
7. **Geographic consistency** — Validates that click and conversion locations are geographically plausible.

### API Key Security

Conversion webhook endpoints use API keys scoped to specific programs:

```typescript
// API key format: mcv_aff_live_<random_32_chars>
// Keys are hashed (SHA-256) before storage
// Each key has:
// - Program scope (can only submit conversions for specific programs)
// - IP allowlist (optional)
// - Rate limits
// - Expiration date

const apiKey = await affiliateService.createAPIKey({
  programId: 'program-uuid-...',
  name: 'E-commerce Webhook',
  allowedIPs: ['203.0.113.0/24'],
  expiresAt: new Date('2026-01-01'),
});
```

### Audit Logging

All sensitive operations are logged to the platform audit trail:

- Affiliate approval/rejection/suspension
- Commission approval/rejection
- Payout processing
- Fraud review resolutions
- Payout method changes
- Tax form submissions
- API key creation/revocation
- Program setting changes

---

## Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `AFFILIATE_DATABASE_URL` | Yes | — | Supabase PostgreSQL connection string for affiliate data. |
| `AFFILIATE_REDPANDA_BROKERS` | Yes | — | Comma-separated Redpanda broker addresses for event streaming. |
| `AFFILIATE_ENCRYPTION_KEY` | Yes | — | AES-256 key for encrypting sensitive payout method details (base64). |
| `AFFILIATE_HMAC_SECRET` | Yes | — | HMAC-SHA256 secret for signing tracking cookies. |
| `AFFILIATE_COOKIE_DOMAIN` | No | Auto-detect | Domain for tracking cookies. Null uses the request domain. |
| `AFFILIATE_DEFAULT_COOKIE_DAYS` | No | `60` | Default cookie/attribution window in days. |
| `AFFILIATE_DEFAULT_PAYOUT_THRESHOLD` | No | `50` | Default minimum payout threshold in USD. |
| `AFFILIATE_DEFAULT_HOLD_DAYS` | No | `30` | Default commission hold period in days before payable. |
| `AFFILIATE_TRACKING_BASE_URL` | No | `https://ref.mcv.one` | Base URL for affiliate tracking links. |
| `AFFILIATE_PORTAL_BASE_URL` | No | `https://partners.mcv.one` | Base URL for the affiliate portal. |
| `AFFILIATE_PAYPAL_CLIENT_ID` | No* | — | PayPal API client ID for processing PayPal payouts. |
| `AFFILIATE_PAYPAL_CLIENT_SECRET` | No* | — | PayPal API client secret. |
| `AFFILIATE_PAYPAL_ENVIRONMENT` | No | `sandbox` | PayPal environment (`sandbox` or `live`). |
| `AFFILIATE_STRIPE_SECRET_KEY` | No* | — | Stripe secret key for processing Stripe Connect payouts. |
| `AFFILIATE_STRIPE_WEBHOOK_SECRET` | No* | — | Stripe webhook signing secret for payout status updates. |
| `AFFILIATE_IPQS_API_KEY` | No | — | IPQualityScore API key for IP intelligence (fraud detection). |
| `AFFILIATE_MAXMIND_LICENSE_KEY` | No | — | MaxMind GeoIP2 license key for geolocation. |
| `AFFILIATE_MAXMIND_ACCOUNT_ID` | No | — | MaxMind account ID. |
| `AFFILIATE_QR_CODE_LOGO_URL` | No | — | Default logo URL to embed in generated QR codes. |
| `AFFILIATE_CLICK_RETENTION_DAYS` | No | `90` | Days to retain full click data before anonymization. |
| `AFFILIATE_FRAUD_THRESHOLD_REJECT` | No | `80` | Fraud score threshold for automatic rejection (0-100). |
| `AFFILIATE_FRAUD_THRESHOLD_REVIEW` | No | `40` | Fraud score threshold for manual review (0-100). |
| `AFFILIATE_MAX_LINKS_PER_AFFILIATE` | No | `100` | Maximum tracking links an affiliate can create. |
| `AFFILIATE_MAX_PROMO_CODES_PER_AFFILIATE` | No | `10` | Maximum promo codes an affiliate can create. |
| `AFFILIATE_RATE_LIMIT_CLICKS` | No | `100` | Click endpoint rate limit per IP per minute. |
| `AFFILIATE_RATE_LIMIT_API` | No | `200` | Portal API rate limit per affiliate per minute. |
| `AFFILIATE_WEBHOOK_TIMEOUT_MS` | No | `10000` | Timeout for conversion webhook processing in milliseconds. |
| `AFFILIATE_ENABLE_FINGERPRINTING` | No | `true` | Whether to enable browser fingerprinting as attribution fallback. |
| `AFFILIATE_ENABLE_CROSS_DEVICE` | No | `true` | Whether to enable cross-device attribution via user graphs. |
| `AFFILIATE_LOG_LEVEL` | No | `info` | Logging level (`debug`, `info`, `warn`, `error`). |

> \* Required if the corresponding payout method is enabled for any program.

---

## Dependencies

### Internal Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| `@mcv/core` | `^0.9.0` | Base service interfaces, error classes, pagination types. |
| `@mcv/db` | `^0.9.0` | Drizzle ORM setup, connection pooling, migration utilities. |
| `@mcv/auth` | `^0.9.0` | Authentication context, role verification, RLS session setup. |
| `@mcv/events` | `^0.9.0` | Redpanda event producer/consumer abstractions. |
| `@mcv/billing` | `^0.9.0` | Subscription data for recurring commission calculation. |
| `@mcv/notifications` | `^0.9.0` | Email/push notifications for affiliate lifecycle events. |
| `@mcv/storage` | `^0.9.0` | File storage for creative assets and tax forms. |
| `@mcv/audit` | `^0.9.0` | Audit logging for sensitive operations. |
| `@mcv/crypto` | `^0.9.0` | AES-256-GCM encryption/decryption for sensitive fields. |

### External Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| `drizzle-orm` | `^0.30.0` | Type-safe SQL query builder and ORM. |
| `@trpc/server` | `^10.0.0` | Type-safe API layer for affiliate portal endpoints. |
| `zod` | `^3.22.0` | Input validation and schema definition. |
| `nanoid` | `^5.0.0` | Unique ID generation for referral codes and tracking IDs. |
| `qrcode` | `^1.5.0` | QR code generation for affiliate links. |
| `ua-parser-js` | `^1.0.0` | User-agent parsing for device/browser/OS detection. |
| `@paypal/payouts-sdk` | `^1.1.0` | PayPal Payouts API integration. |
| `stripe` | `^14.0.0` | Stripe Connect payouts integration. |
| `ioredis` | `^5.3.0` | Redis for rate limiting and click deduplication caching. |
| `kafkajs` | `^2.2.0` | Redpanda/Kafka client for event streaming. |
| `maxmind` | `^4.3.0` | GeoIP lookup for click geolocation and fraud detection. |
| `murmurhash` | `^2.0.0` | Fast hashing for fingerprint generation. |
| `decimal.js` | `^10.4.0` | Precise decimal arithmetic for commission calculations. |

### Peer Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| `@supabase/supabase-js` | `^2.39.0` | Supabase client for RLS-aware database access. |
| `next` | `^14.0.0` | Next.js for portal SSR (if using integrated portal). |

---

## Testing

### Test Structure

```
tests/
├── unit/
│   ├── commission-engine.test.ts       # Commission calculation logic
│   ├── fraud-detection.test.ts         # Fraud rule evaluation
│   ├── attribution.test.ts             # Attribution resolution
│   ├── code-generator.test.ts          # Referral code generation
│   ├── tracking-url.test.ts            # URL building & parsing
│   ├── validation.test.ts              # Input validation
│   └── metrics.test.ts                 # EPC, conversion rate calculations
├── integration/
│   ├── affiliate-lifecycle.test.ts     # Full registration → approval → link → click → convert → commission → payout
│   ├── commission-rules.test.ts        # Rule evaluation with DB
│   ├── payout-processing.test.ts       # Payout batch processing
│   ├── fraud-pipeline.test.ts          # End-to-end fraud detection
│   ├── attribution-resolution.test.ts  # Cookie/fingerprint/cross-device attribution
│   ├── sub-affiliate.test.ts           # Multi-level commission chains
│   └── multi-program.test.ts           # Cross-program affiliate management
├── e2e/
│   ├── portal-dashboard.test.ts        # Portal UI flows
│   ├── tracking-endpoint.test.ts       # Click redirect endpoint
│   └── conversion-webhook.test.ts      # Conversion API endpoint
└── fixtures/
    ├── programs.ts                     # Test program configurations
    ├── affiliates.ts                   # Test affiliate profiles
    ├── conversions.ts                  # Test conversion events
    └── fraud-scenarios.ts              # Fraud test scenarios
```

### Running Tests

```bash
# Run all affiliate module tests
pnpm test --filter=@mcv/growth/affiliates

# Run unit tests only
pnpm test:unit --filter=@mcv/growth/affiliates

# Run integration tests (requires database)
pnpm test:integration --filter=@mcv/growth/affiliates

# Run with coverage
pnpm test:coverage --filter=@mcv/growth/affiliates

# Run specific test file
pnpm vitest run tests/unit/commission-engine.test.ts

# Run tests in watch mode
pnpm vitest watch tests/unit/
```

### Unit Test Example: Commission Engine

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { CommissionEngine } from '../services/commission-engine.service';

describe('CommissionEngine', () => {
  let engine: CommissionEngine;

  beforeEach(() => {
    engine = new CommissionEngine({
      db: mockDb,
      config: {
        defaultHoldDays: 30,
        maxCommissionCap: 10000,
      },
    });
  });

  describe('percentage commission', () => {
    it('should calculate basic percentage commission', async () => {
      const conversion = createMockConversion({
        amount: 100,
        currency: 'USD',
      });

      const rules = [
        createMockRule({ type: 'percentage', rate: 20 }),
      ];

      mockDb.getCommissionRules.mockResolvedValue(rules);
      mockDb.getAffiliate.mockResolvedValue(createMockAffiliate({ tier: 'bronze' }));
      mockDb.getTierThresholds.mockResolvedValue([
        { tier: 'bronze', rateMultiplier: 1.0 },
      ]);

      const commissions = await engine.calculate(conversion);

      expect(commissions).toHaveLength(1);
      expect(commissions[0].amount).toBe(20);
      expect(commissions[0].type).toBe('percentage');
      expect(commissions[0].rate).toBe(20);
      expect(commissions[0].breakdown.tierMultiplier).toBe(1.0);
    });

    it('should apply tier multiplier for Gold affiliates', async () => {
      const conversion = createMockConversion({ amount: 100 });
      const rules = [createMockRule({ type: 'percentage', rate: 20 })];

      mockDb.getCommissionRules.mockResolvedValue(rules);
      mockDb.getAffiliate.mockResolvedValue(createMockAffiliate({ tier: 'gold' }));
      mockDb.getTierThresholds.mockResolvedValue([
        { tier: 'gold', rateMultiplier: 1.15 },
      ]);

      const commissions = await engine.calculate(conversion);

      expect(commissions[0].amount).toBe(23); // 100 × 20% × 1.15
      expect(commissions[0].breakdown.tierMultiplier).toBe(1.15);
    });

    it('should apply commission cap', async () => {
      const conversion = createMockConversion({ amount: 100000 });
      const rules = [
        createMockRule({ type: 'percentage', rate: 20, maxCommission: 500 }),
      ];

      mockDb.getCommissionRules.mockResolvedValue(rules);
      mockDb.getAffiliate.mockResolvedValue(createMockAffiliate({ tier: 'bronze' }));
      mockDb.getTierThresholds.mockResolvedValue([
        { tier: 'bronze', rateMultiplier: 1.0 },
      ]);

      const commissions = await engine.calculate(conversion);

      expect(commissions[0].amount).toBe(500); // Capped at $500
      expect(commissions[0].breakdown.adjustments).toContainEqual(
        expect.objectContaining({ type: 'cap' })
      );
    });
  });

  describe('tiered commission', () => {
    it('should select correct tier based on monthly conversions', async () => {
      const conversion = createMockConversion({ amount: 100 });
      const rules = [
        createMockRule({
          type: 'percentage',
          rate: 15,
          tiers: [
            { minConversions: 0, maxConversions: 50, rate: 15, period: 'monthly' },
            { minConversions: 51, maxConversions: 200, rate: 20, period: 'monthly' },
            { minConversions: 201, maxConversions: null, rate: 25, period: 'monthly' },
          ],
        }),
      ];

      mockDb.getCommissionRules.mockResolvedValue(rules);
      mockDb.getAffiliate.mockResolvedValue(createMockAffiliate({ tier: 'bronze' }));
      mockDb.getMonthlyConversions.mockResolvedValue(75); // In the 51-200 tier
      mockDb.getTierThresholds.mockResolvedValue([
        { tier: 'bronze', rateMultiplier: 1.0 },
      ]);

      const commissions = await engine.calculate(conversion);

      expect(commissions[0].rate).toBe(20); // 51-200 tier rate
      expect(commissions[0].amount).toBe(20);
    });
  });

  describe('recurring commission', () => {
    it('should create recurring commission for subscription renewal', async () => {
      const conversion = createMockConversion({
        amount: 49.99,
        type: 'renewal',
        billingPeriod: 3,
      });

      const rules = [
        createMockRule({
          type: 'recurring',
          rate: 20,
          maxRecurringCycles: 12,
        }),
      ];

      mockDb.getCommissionRules.mockResolvedValue(rules);
      mockDb.getAffiliate.mockResolvedValue(createMockAffiliate({ tier: 'silver' }));
      mockDb.getTierThresholds.mockResolvedValue([
        { tier: 'silver', rateMultiplier: 1.1 },
      ]);

      const commissions = await engine.calculate(conversion);

      expect(commissions[0].amount).toBeCloseTo(11.00); // 49.99 × 20% × 1.1
      expect(commissions[0].recurringCycle).toBe(3);
    });

    it('should stop recurring commissions after max cycles', async () => {
      const conversion = createMockConversion({
        amount: 49.99,
        type: 'renewal',
        billingPeriod: 13, // Beyond max
      });

      const rules = [
        createMockRule({ type: 'recurring', rate: 20, maxRecurringCycles: 12 }),
      ];

      mockDb.getCommissionRules.mockResolvedValue(rules);
      mockDb.getAffiliate.mockResolvedValue(createMockAffiliate({ tier: 'bronze' }));
      mockDb.getTierThresholds.mockResolvedValue([
        { tier: 'bronze', rateMultiplier: 1.0 },
      ]);

      const commissions = await engine.calculate(conversion);

      expect(commissions).toHaveLength(0); // No commission after cycle 12
    });
  });

  describe('sub-affiliate commission', () => {
    it('should calculate upline commissions', async () => {
      const conversion = createMockConversion({ amount: 200 });

      const rules = [
        createMockRule({ type: 'percentage', rate: 20 }),
      ];

      const subAffiliateRules = [
        createMockRule({
          type: 'sub_affiliate',
          subAffiliateLevels: [
            { level: 1, rate: 5, type: 'percentage' },
            { level: 2, rate: 2, type: 'percentage' },
          ],
        }),
      ];

      const affiliate = createMockAffiliate({
        tier: 'bronze',
        parentAffiliateId: 'parent-uuid',
        depth: 1,
      });

      const parentAffiliate = createMockAffiliate({
        id: 'parent-uuid',
        parentAffiliateId: 'grandparent-uuid',
        depth: 0,
      });

      const grandparentAffiliate = createMockAffiliate({
        id: 'grandparent-uuid',
        parentAffiliateId: null,
        depth: 0,
      });

      mockDb.getCommissionRules.mockResolvedValue(rules);
      mockDb.getSubAffiliateRules.mockResolvedValue(subAffiliateRules);
      mockDb.getAffiliate.mockResolvedValueOnce(affiliate);
      mockDb.getAffiliate.mockResolvedValueOnce(parentAffiliate);
      mockDb.getAffiliate.mockResolvedValueOnce(grandparentAffiliate);
      mockDb.getTierThresholds.mockResolvedValue([
        { tier: 'bronze', rateMultiplier: 1.0 },
      ]);

      const commissions = await engine.calculate(conversion);

      // Direct commission: $200 × 20% = $40
      expect(commissions[0].amount).toBe(40);
      expect(commissions[0].subAffiliateLevel).toBe(0);

      // Level 1 parent: $40 × 5% = $2
      expect(commissions[1].amount).toBe(2);
      expect(commissions[1].subAffiliateLevel).toBe(1);
      expect(commissions[1].affiliateId).toBe('parent-uuid');

      // Level 2 grandparent: $40 × 2% = $0.80
      expect(commissions[2].amount).toBeCloseTo(0.80);
      expect(commissions[2].subAffiliateLevel).toBe(2);
      expect(commissions[2].affiliateId).toBe('grandparent-uuid');
    });
  });
});
```

### Integration Test Example: Full Lifecycle

```typescript
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createTestDatabase, cleanupTestDatabase } from '@mcv/test-utils';
import { createAffiliateService } from '../services/affiliate.service';

describe('Affiliate Lifecycle (Integration)', () => {
  let db: TestDatabase;
  let service: AffiliateService;

  beforeAll(async () => {
    db = await createTestDatabase();
    service = createAffiliateService({
      db: db.client,
      redpanda: mockRedpanda,
      config: testConfig,
    });
  });

  afterAll(async () => {
    await cleanupTestDatabase(db);
  });

  it('should complete full lifecycle: register → approve → link → click → convert → commission → payout', async () => {
    // 1. Create program
    const program = await service.createProgram(testProgramConfig);
    expect(program.status).toBe('active');

    // 2. Register affiliate
    const affiliate = await service.applyAsAffiliate({
      programId: program.id,
      profile: testAffiliateProfile,
      referredBy: null,
      metadata: {},
    });
    expect(affiliate.status).toBe('pending');

    // 3. Approve affiliate
    const approved = await service.approveAffiliate(affiliate.id);
    expect(approved.status).toBe('approved');
    expect(approved.referralCode).toBeDefined();

    // 4. Create link
    const link = await service.createLink({
      affiliateId: approved.id,
      programId: program.id,
      destinationUrl: 'https://example.com/product',
      campaign: 'test-campaign',
    });
    expect(link.url).toContain(approved.id);

    // 5. Record click
    const click = await service.recordClick({
      linkId: link.id,
      ipAddress: '203.0.113.1',
      userAgent: 'TestAgent/1.0',
      referer: 'https://blog.example.com',
      headers: {},
    });
    expect(click.isUnique).toBe(true);

    // 6. Record conversion
    const conversion = await service.recordConversion({
      programId: program.id,
      type: 'sale',
      externalId: 'test-order-1',
      amount: 150,
      currency: 'USD',
      customerHash: 'test-hash-123',
      isNewCustomer: true,
      trackingCookie: `${approved.id}.${link.id}.${click.id}.${Date.now()}`,
    });
    expect(conversion.affiliateId).toBe(approved.id);
    expect(conversion.status).toBe('confirmed');

    // 7. Verify commission was created
    const commissions = await service.listCommissions({
      affiliateId: approved.id,
      conversionId: conversion.id,
    });
    expect(commissions.items).toHaveLength(1);
    expect(commissions.items[0].amount).toBe(30); // 20% of $150

    // 8. Set payout method
    await service.setPayoutMethod(approved.id, {
      type: 'paypal',
      details: { type: 'paypal', email: 'test@example.com' },
      isDefault: true,
    });

    // 9. Submit tax form
    await service.submitTaxForm(approved.id, {
      type: 'w9',
      legalName: 'Test Affiliate',
      taxId: '123-45-6789',
      country: 'US',
    });

    // 10. Fast-forward past hold period and process payout
    await db.client.execute(
      sql`UPDATE commissions SET payable_at = NOW() - INTERVAL '1 day' WHERE affiliate_id = ${approved.id}`
    );

    const batch = await service.processPayouts(program.id);
    expect(batch.totalPayouts).toBeGreaterThanOrEqual(1);
    expect(batch.totalAmount).toBeGreaterThanOrEqual(30);

    // 11. Verify affiliate balance updated
    const updatedAffiliate = await service.getAffiliate(approved.id);
    expect(updatedAffiliate!.unpaidBalance).toBe(0);
    expect(updatedAffiliate!.lifetimeEarnings).toBe(30);
  });
});
```

### Test Fixtures

```typescript
// fixtures/programs.ts
export const testProgramConfig: ProgramCreate = {
  name: 'Test Program',
  description: 'Test affiliate program for unit tests',
  slug: 'test-program',
  requiresApproval: false,
  commissionStructure: {
    defaultRule: {
      name: 'Default',
      type: 'percentage',
      rate: 20,
      currency: 'USD',
      holdPeriodDays: 0,
      priority: 1,
      isActive: true,
      effectiveFrom: new Date(),
    },
  },
  attributionWindow: { days: 30, lifetime: false, model: 'last_click' },
  terms: {
    version: '1.0',
    content: 'Test terms',
    effectiveDate: new Date(),
    commissionDisclosure: 'Test disclosure',
    prohibitedActivities: [],
    terminationPolicy: 'Test policy',
  },
};

// fixtures/affiliates.ts
export const testAffiliateProfile: AffiliateProfile = {
  name: 'Test Affiliate',
  email: 'test@example.com',
  company: null,
  website: 'https://test.example.com',
  socialProfiles: [],
  promotionMethods: ['blog'],
  estimatedReach: '1k',
  country: 'US',
  language: 'en',
  phone: null,
  avatarUrl: null,
  bio: 'Test affiliate',
};

// fixtures/fraud-scenarios.ts
export const fraudScenarios = {
  clickVelocity: {
    description: 'Rapid-fire clicks from same IP',
    clicks: Array.from({ length: 200 }, (_, i) => ({
      ipAddress: '198.51.100.1',
      clickedAt: new Date(Date.now() - i * 100), // 100ms apart
    })),
    expectedScore: 85,
    expectedLevel: 'critical',
  },
  selfReferral: {
    description: 'Affiliate purchasing through own link',
    affiliateEmail: 'affiliate@example.com',
    customerEmail: 'affiliate@example.com',
    expectedScore: 100,
    expectedLevel: 'critical',
  },
  vpnTraffic: {
    description: 'Click through known VPN provider',
    ipAddress: '185.220.101.1', // Known Tor exit node
    expectedScore: 45,
    expectedLevel: 'medium',
  },
};
```

### Coverage Requirements

| Area | Minimum Coverage |
|------|-----------------|
| Commission Engine | 95% |
| Fraud Detection | 90% |
| Attribution Resolution | 90% |
| Payout Processing | 85% |
| Registration Service | 80% |
| Link Generation | 80% |
| Portal Service | 75% |
| Analytics Service | 70% |
| **Overall Module** | **85%** |

---

## Changelog

### 0.9.0 (Initial Release)

- Full affiliate lifecycle management (registration, approval, tiers)
- Link and promo code generation with vanity URLs
- Cookie-based click tracking with fingerprint fallback
- Commission engine with percentage, flat-fee, tiered, recurring, and sub-affiliate support
- Fraud detection pipeline with configurable rules
- Payout processing with PayPal, bank, and crypto support
- Affiliate portal with dashboard, creatives, and performance reports
- Program analytics with ROI calculation
- Multi-tenant RLS isolation
- Event-driven architecture with Redpanda

---

*For questions or contributions, see the [MCV.ONE Contributing Guide](../../CONTRIBUTING.md) or reach out to the Growth team.*