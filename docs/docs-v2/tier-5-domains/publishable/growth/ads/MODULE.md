# @mcv/growth/ads

> **Advertising Campaign Management** — Unified multi-platform ad orchestration with campaign lifecycle management, audience targeting, budget optimization, and cross-channel performance analytics.

```
Domain:      growth
Module:      ads
Layer:       tier-5-domains
Runtime:     server + worker
Since:       0.1.0
Status:      stable
Maintainer:  @AugmentedMind
```

---

## Purpose

`@mcv/growth/ads` provides the MCV.ONE platform's complete advertising management layer. It abstracts the complexity of operating campaigns across Google Ads, Meta Ads, TikTok Ads, LinkedIn Ads, and Twitter/X Ads behind a unified API, enabling tenants to create, launch, monitor, and optimize advertising campaigns from a single interface.

Advertising is the primary paid acquisition channel for most businesses, but managing campaigns across five or more platforms introduces operational complexity, fragmented reporting, and inconsistent budget control. This module solves those problems by providing:

- **Unified Campaign Lifecycle** — A single campaign model that maps to platform-specific entities (Google Campaigns, Meta Ad Sets, TikTok Campaign Groups, etc.) with consistent draft → active → paused → completed state transitions.
- **Platform Abstraction Layer** — An adapter pattern (`AdPlatformAdapter`) that normalizes CRUD operations, bid management, and reporting across all supported platforms while preserving platform-specific capabilities via extension points.
- **Centralized Budget Control** — Cross-platform budget allocation with real-time spend pacing, automated alerts, and budget rebalancing that prevents overspend regardless of how individual platforms pace delivery.
- **Audience Orchestration** — Direct integration with `@mcv/growth/cdp` segments to push audiences to ad platforms, build lookalike audiences, and manage retargeting pixels from a single source of truth.
- **Attribution Bridge** — Native integration with `@mcv/growth/attribution` to connect ad clicks, impressions, and spend data to downstream conversions, enabling accurate ROAS calculation and multi-touch attribution.
- **Compliance Automation** — Policy pre-checks, approval workflows, and sensitive-category handling that catch violations before ads are submitted to platform review, reducing rejection rates and account risk.

### Design Philosophy

The module follows three key principles:

1. **Platform-agnostic first, platform-specific when needed.** The unified API handles 90% of use cases. Platform-specific features (e.g., Google's Performance Max, Meta's Advantage+) are accessible via typed extension points rather than separate APIs.

2. **Budget safety is non-negotiable.** Every spend mutation passes through the budget guard, which enforces tenant-level, campaign-level, and daily caps. No ad goes live without a confirmed budget allocation.

3. **Eventual consistency with strong read-after-write.** Platform sync is inherently asynchronous (API calls, webhook delays), but local state is immediately consistent. The sync engine reconciles platform state on a configurable interval with conflict resolution.

### Relationship to Other Modules

| Module | Relationship |
|---|---|
| `@mcv/growth/cdp` | Audience segments → ad platform custom audiences |
| `@mcv/growth/attribution` | Ad click/impression data → conversion attribution |
| `@mcv/growth/analytics` | Performance metrics → unified analytics dashboard |
| `@mcv/growth/campaigns` | Marketing campaigns → ad campaign coordination |
| `@mcv/content/media` | Media assets → ad creative management |
| `@mcv/billing` | Ad spend tracking → billing reconciliation |
| `@mcv/auth` | Tenant/user context, permission checks |
| `@mcv/notifications` | Budget alerts, performance alerts, approval notifications |

---

## Exports

### Services

| Export | Type | Description |
|---|---|---|
| `AdService` | `class` | Primary service — campaign CRUD, ad management, performance queries |
| `CampaignManager` | `class` | Campaign lifecycle management with state machine |
| `AdGroupManager` | `class` | Ad group CRUD within campaigns |
| `AdCreativeManager` | `class` | Creative asset management, A/B variants, DCO |
| `AudienceManager` | `class` | Audience targeting, segment sync, lookalike creation |
| `BudgetManager` | `class` | Budget allocation, spend pacing, alerts |
| `BidManager` | `class` | Bid strategy configuration and optimization |
| `PerformanceTracker` | `class` | Real-time metrics collection and aggregation |
| `AdReporter` | `class` | Report generation, scheduling, cross-platform comparison |
| `ComplianceChecker` | `class` | Policy validation, approval workflows |
| `PlatformSyncEngine` | `class` | Bidirectional platform synchronization |

### Adapters

| Export | Type | Description |
|---|---|---|
| `AdPlatformAdapter` | `interface` | Base adapter contract for ad platform integrations |
| `GoogleAdsAdapter` | `class` | Google Ads API v16 integration |
| `MetaAdsAdapter` | `class` | Meta Marketing API v19 integration |
| `TikTokAdsAdapter` | `class` | TikTok Marketing API v1.3 integration |
| `LinkedInAdsAdapter` | `class` | LinkedIn Marketing API v2 integration |
| `TwitterAdsAdapter` | `class` | Twitter/X Ads API v12 integration |
| `AdPlatformRegistry` | `class` | Adapter registration and lifecycle management |

### Router

| Export | Type | Description |
|---|---|---|
| `adsRouter` | `tRPC router` | Full tRPC router for all advertising operations |
| `campaignRouter` | `tRPC router` | Campaign-specific sub-router |
| `adGroupRouter` | `tRPC router` | Ad group sub-router |
| `creativeRouter` | `tRPC router` | Creative management sub-router |
| `audienceRouter` | `tRPC router` | Audience targeting sub-router |
| `budgetRouter` | `tRPC router` | Budget management sub-router |
| `reportRouter` | `tRPC router` | Reporting and analytics sub-router |

### Schemas (Drizzle)

| Export | Type | Description |
|---|---|---|
| `campaigns` | `PgTable` | Campaign definitions and metadata |
| `adGroups` | `PgTable` | Ad groups within campaigns |
| `ads` | `PgTable` | Individual ad units |
| `adCreatives` | `PgTable` | Creative assets (images, videos, copy) |
| `audienceTargets` | `PgTable` | Audience targeting configurations |
| `budgets` | `PgTable` | Budget allocations and spend tracking |
| `bidConfigs` | `PgTable` | Bid strategy configurations |
| `adPerformance` | `PgTable` | Performance metrics (time-series) |
| `adPlatformConfigs` | `PgTable` | Platform credentials and settings |
| `adApprovals` | `PgTable` | Compliance review and approval records |

### Types

| Export | Type | Description |
|---|---|---|
| `Campaign` | `interface` | Campaign entity with full metadata |
| `CampaignStatus` | `enum` | `draft \| active \| paused \| completed \| archived` |
| `CampaignObjective` | `enum` | `awareness \| traffic \| engagement \| leads \| conversions \| app_installs` |
| `AdGroup` | `interface` | Ad group entity |
| `Ad` | `interface` | Individual ad entity |
| `AdStatus` | `enum` | `draft \| pending_review \| active \| paused \| rejected \| archived` |
| `AdCreative` | `interface` | Creative asset with variants |
| `CreativeType` | `enum` | `image \| video \| carousel \| text \| html5 \| playable` |
| `AudienceTarget` | `interface` | Targeting configuration |
| `TargetingType` | `enum` | `custom \| lookalike \| retargeting \| demographic \| interest \| keyword` |
| `BudgetConfig` | `interface` | Budget allocation settings |
| `BudgetType` | `enum` | `daily \| lifetime \| monthly` |
| `BidStrategy` | `interface` | Bid strategy configuration |
| `BidStrategyType` | `enum` | `manual_cpc \| target_cpa \| target_roas \| max_conversions \| max_clicks \| max_impressions` |
| `AdPerformance` | `interface` | Performance metrics snapshot |
| `AdPlatform` | `enum` | `google \| meta \| tiktok \| linkedin \| twitter` |
| `PlatformSyncStatus` | `enum` | `synced \| pending \| error \| conflict` |
| `AdApproval` | `interface` | Compliance approval record |
| `ApprovalStatus` | `enum` | `pending \| approved \| rejected \| revision_requested` |

### Utilities

| Export | Type | Description |
|---|---|---|
| `calculateROAS` | `function` | Compute return on ad spend from revenue and cost |
| `calculateCPA` | `function` | Compute cost per acquisition |
| `calculateCTR` | `function` | Compute click-through rate |
| `normalizePlatformMetrics` | `function` | Normalize metrics across platform formats |
| `estimateBudgetPacing` | `function` | Project spend rate and remaining budget |
| `validateAdPolicy` | `function` | Pre-check ad content against platform policies |
| `buildPlatformPayload` | `function` | Transform unified ad model to platform-specific format |
| `parsePlatformResponse` | `function` | Transform platform response to unified model |
| `generateUTMParams` | `function` | Generate UTM parameters for ad tracking URLs |
| `createTrackingPixel` | `function` | Generate retargeting pixel snippets |

---

## Architecture

### High-Level Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        tRPC Router Layer                        │
│  campaignRouter · adGroupRouter · creativeRouter · reportRouter │
└──────────────────────────────┬──────────────────────────────────┘
                               │
┌──────────────────────────────▼──────────────────────────────────┐
│                          AdService                              │
│  Orchestrates all advertising operations, enforces business     │
│  rules, coordinates managers and platform adapters              │
└──┬───────────┬───────────┬───────────┬───────────┬─────────────┘
   │           │           │           │           │
┌──▼──┐  ┌────▼────┐ ┌────▼────┐ ┌────▼────┐ ┌───▼──────┐
│Camp.│  │Creative │ │Audience │ │ Budget  │ │  Bid     │
│Mgr  │  │  Mgr    │ │  Mgr    │ │  Mgr    │ │  Mgr     │
└──┬──┘  └────┬────┘ └────┬────┘ └────┬────┘ └───┬──────┘
   │          │           │           │           │
┌──▼──────────▼───────────▼───────────▼───────────▼──────────────┐
│                    Platform Sync Engine                          │
│  Bidirectional sync · Conflict resolution · Rate limiting       │
└──┬──────────┬───────────┬───────────┬───────────┬──────────────┘
   │          │           │           │           │
┌──▼──┐  ┌───▼───┐  ┌────▼───┐  ┌───▼────┐  ┌──▼─────┐
│Goog.│  │ Meta  │  │TikTok  │  │LinkedIn│  │Twitter │
│Adapt│  │ Adapt │  │ Adapt  │  │ Adapt  │  │ Adapt  │
└──┬──┘  └───┬───┘  └────┬───┘  └───┬────┘  └──┬─────┘
   │         │           │          │           │
   ▼         ▼           ▼          ▼           ▼
 Google    Meta       TikTok    LinkedIn    Twitter/X
 Ads API   Marketing  Marketing Marketing   Ads API
           API        API       API
```

### Campaign Lifecycle State Machine

Campaigns follow a strict state machine that enforces valid transitions and triggers side effects (platform sync, budget allocation, notification dispatch):

```
                    ┌──────────────┐
                    │              │
         ┌─────────│    DRAFT     │
         │         │              │
         │         └──────┬───────┘
         │                │ activate()
         │                │ [budget allocated + creatives attached + audience set]
         │         ┌──────▼───────┐
         │         │              │◄──── resume()
    archive()      │    ACTIVE    │
         │         │              │────► pause()
         │         └──────┬───────┘           │
         │                │                   │
         │                │ complete()  ┌─────▼──────┐
         │                │ [end date   │            │
         │                │  reached    │   PAUSED   │
         │                │  or manual] │            │
         │         ┌──────▼───────┐    └────────────┘
         │         │              │
         ├─────────│  COMPLETED   │
         │         │              │
         │         └──────────────┘
         │
  ┌──────▼───────┐
  │              │
  │   ARCHIVED   │
  │              │
  └──────────────┘
```

**State Transition Rules:**

| From | To | Guard Conditions |
|---|---|---|
| `draft` | `active` | Budget allocated, ≥1 ad group, ≥1 ad with creative, audience configured, compliance check passed |
| `active` | `paused` | None (always allowed) |
| `paused` | `active` | Budget remaining > 0, no compliance holds |
| `active` | `completed` | End date reached, budget exhausted, or manual completion |
| `draft` | `archived` | None (always allowed) |
| `completed` | `archived` | None (always allowed) |
| `paused` | `archived` | None (always allowed) |

### Platform Abstraction Layer

The adapter pattern enables uniform operations across all supported platforms while accommodating platform-specific features:

```
┌─────────────────────────────────────────────────────────────┐
│                    AdPlatformAdapter                         │
│                                                             │
│  Campaign Operations:                                       │
│    createCampaign(campaign) → PlatformCampaignId            │
│    updateCampaign(id, changes) → void                       │
│    pauseCampaign(id) → void                                 │
│    deleteCampaign(id) → void                                │
│    getCampaign(id) → PlatformCampaign                       │
│                                                             │
│  Ad Group Operations:                                       │
│    createAdGroup(campaignId, adGroup) → PlatformAdGroupId   │
│    updateAdGroup(id, changes) → void                        │
│    getAdGroup(id) → PlatformAdGroup                         │
│                                                             │
│  Ad Operations:                                             │
│    createAd(adGroupId, ad) → PlatformAdId                   │
│    updateAd(id, changes) → void                             │
│    getAd(id) → PlatformAd                                   │
│    getAdReviewStatus(id) → ReviewStatus                     │
│                                                             │
│  Audience Operations:                                       │
│    createAudience(audience) → PlatformAudienceId            │
│    updateAudience(id, members) → void                       │
│    createLookalike(sourceId, config) → PlatformAudienceId   │
│    getAudienceSize(id) → number                             │
│                                                             │
│  Reporting:                                                 │
│    getPerformance(filters, dateRange) → PlatformMetrics[]   │
│    getInsights(campaignId) → PlatformInsights               │
│                                                             │
│  Budget:                                                    │
│    setBudget(campaignId, amount, type) → void               │
│    getSpend(campaignId, dateRange) → SpendData              │
│                                                             │
│  Platform-Specific:                                         │
│    getCapabilities() → PlatformCapabilities                 │
│    executeExtension<T>(name, params) → T                    │
└─────────────────────────────────────────────────────────────┘
```

### Sync Engine Architecture

The `PlatformSyncEngine` maintains consistency between the local database and external ad platforms:

```
┌──────────────────────────────────────────────────────────┐
│                  Platform Sync Engine                      │
│                                                           │
│  ┌─────────────┐  ┌──────────────┐  ┌────────────────┐  │
│  │  Outbound    │  │   Inbound    │  │   Conflict     │  │
│  │  Queue       │  │   Poller     │  │   Resolver     │  │
│  │             │  │              │  │                │  │
│  │ Local→Plat  │  │ Plat→Local   │  │ Last-write     │  │
│  │ changes     │  │ status sync  │  │ wins w/        │  │
│  │ debounced   │  │ on interval  │  │ human review   │  │
│  └──────┬──────┘  └──────┬───────┘  └───────┬────────┘  │
│         │                │                   │           │
│  ┌──────▼────────────────▼───────────────────▼────────┐  │
│  │                  Sync Log                           │  │
│  │  Tracks all sync operations for audit and replay    │  │
│  └────────────────────────────────────────────────────┘  │
│                                                           │
│  Rate Limiting: Per-platform token bucket                 │
│  Retry: Exponential backoff with jitter (max 5 retries)  │
│  Circuit Breaker: Opens after 10 consecutive failures    │
└──────────────────────────────────────────────────────────┘
```

**Sync Modes:**

| Mode | Description | Interval |
|---|---|---|
| `real-time` | Immediate push on local changes | < 1 second |
| `near-real-time` | Batched push every N seconds | 5–30 seconds |
| `periodic` | Scheduled full reconciliation | 5–60 minutes |
| `manual` | User-triggered sync | On demand |

### Budget Guard System

The budget guard is a critical safety layer that prevents overspend:

```
┌────────────────────────────────────────────────┐
│               Budget Guard                      │
│                                                 │
│  Layer 1: Tenant Budget Cap                     │
│  ├─ Total monthly/lifetime spend limit          │
│  ├─ Hard stop — no override                     │
│  └─ Checked on every campaign activation        │
│                                                 │
│  Layer 2: Campaign Budget                       │
│  ├─ Daily or lifetime budget per campaign        │
│  ├─ Spend pacing (even/accelerated/front-load)  │
│  └─ Auto-pause when budget exhausted            │
│                                                 │
│  Layer 3: Platform Budget Sync                  │
│  ├─ Platform budget ≤ campaign budget            │
│  ├─ Platform-side daily caps as safety net       │
│  └─ Reconciliation every sync cycle             │
│                                                 │
│  Layer 4: Real-time Monitoring                  │
│  ├─ Alert at 50%, 75%, 90%, 100% utilization    │
│  ├─ Anomaly detection (>2σ spend spike)         │
│  └─ Emergency pause on anomaly                  │
└────────────────────────────────────────────────┘
```

---

## Core Interfaces

### Campaign

```typescript
/**
 * Represents an advertising campaign across one or more platforms.
 * A campaign is the top-level container that holds ad groups, budgets,
 * targeting configuration, and scheduling parameters.
 */
interface Campaign {
  /** Unique campaign identifier (UUID) */
  id: string;

  /** Tenant ID for multi-tenant isolation */
  tenantId: string;

  /** Human-readable campaign name */
  name: string;

  /** Optional description of the campaign */
  description: string | null;

  /** Campaign objective determining optimization strategy */
  objective: CampaignObjective;

  /** Current lifecycle status */
  status: CampaignStatus;

  /**
   * Platforms this campaign targets.
   * A single campaign can run on multiple platforms simultaneously.
   */
  platforms: AdPlatform[];

  /**
   * Platform-specific external IDs.
   * Populated after the campaign is synced to each platform.
   */
  platformIds: Record<AdPlatform, string | null>;

  /** Scheduled start date (ISO 8601) */
  startDate: string;

  /** Scheduled end date, null for evergreen campaigns */
  endDate: string | null;

  /** Budget configuration for this campaign */
  budget: BudgetConfig;

  /** Bid strategy configuration */
  bidStrategy: BidStrategy;

  /** Tags for organization and filtering */
  tags: string[];

  /**
   * Optional reference to a parent marketing campaign
   * in @mcv/growth/campaigns for coordination.
   */
  parentCampaignId: string | null;

  /** ID of the user who created this campaign */
  createdBy: string;

  /** ISO 8601 creation timestamp */
  createdAt: string;

  /** ISO 8601 last update timestamp */
  updatedAt: string;

  /** Last successful platform sync timestamp */
  lastSyncedAt: string | null;

  /** Current platform sync status */
  syncStatus: PlatformSyncStatus;

  /** Compliance approval status */
  approvalStatus: ApprovalStatus;
}

/** Campaign objectives determining platform optimization */
enum CampaignObjective {
  /** Maximize reach and brand visibility */
  AWARENESS = 'awareness',
  /** Drive clicks and website visits */
  TRAFFIC = 'traffic',
  /** Maximize post engagement (likes, comments, shares) */
  ENGAGEMENT = 'engagement',
  /** Generate leads via forms or sign-ups */
  LEADS = 'leads',
  /** Optimize for purchase or sign-up conversions */
  CONVERSIONS = 'conversions',
  /** Drive mobile app installations */
  APP_INSTALLS = 'app_installs',
}

/** Campaign lifecycle status */
enum CampaignStatus {
  DRAFT = 'draft',
  ACTIVE = 'active',
  PAUSED = 'paused',
  COMPLETED = 'completed',
  ARCHIVED = 'archived',
}
```

### AdGroup

```typescript
/**
 * An ad group contains one or more ads that share targeting,
 * bid configuration, and schedule within a campaign.
 */
interface AdGroup {
  /** Unique ad group identifier */
  id: string;

  /** Parent campaign ID */
  campaignId: string;

  /** Tenant ID for RLS */
  tenantId: string;

  /** Human-readable name */
  name: string;

  /** Ad group status */
  status: AdGroupStatus;

  /** Targeting configuration for this ad group */
  targeting: AudienceTarget;

  /** Optional ad group-level bid override */
  bidOverride: BidOverride | null;

  /** Optional ad group-level daily budget cap */
  dailyBudgetCap: number | null;

  /**
   * Placement configuration — where ads appear.
   * Platform-specific (e.g., Feed, Stories, Search, Display).
   */
  placements: PlacementConfig[];

  /** Schedule overrides (day-parting) */
  schedule: AdSchedule | null;

  /** Platform-specific external IDs */
  platformIds: Record<AdPlatform, string | null>;

  /** Creation timestamp */
  createdAt: string;

  /** Last update timestamp */
  updatedAt: string;
}

enum AdGroupStatus {
  DRAFT = 'draft',
  ACTIVE = 'active',
  PAUSED = 'paused',
  ARCHIVED = 'archived',
}

/** Placement configuration per platform */
interface PlacementConfig {
  platform: AdPlatform;
  /** e.g., 'feed', 'stories', 'reels', 'search', 'display', 'video' */
  placements: string[];
  /** Device targeting for this placement */
  devices: ('mobile' | 'desktop' | 'tablet')[];
}

/** Day-parting schedule */
interface AdSchedule {
  /** Timezone for schedule interpretation */
  timezone: string;
  /**
   * Enabled windows. Each entry specifies day(s) and hour ranges.
   * Empty means "run 24/7".
   */
  windows: ScheduleWindow[];
}

interface ScheduleWindow {
  /** Days of week (0=Sunday, 6=Saturday) */
  days: number[];
  /** Start hour (0-23) */
  startHour: number;
  /** End hour (0-23, exclusive) */
  endHour: number;
  /** Optional bid multiplier during this window */
  bidMultiplier?: number;
}
```

### Ad

```typescript
/**
 * An individual ad unit within an ad group.
 * Each ad combines a creative with optional overrides
 * and tracks its own review/approval status per platform.
 */
interface Ad {
  /** Unique ad identifier */
  id: string;

  /** Parent ad group ID */
  adGroupId: string;

  /** Campaign ID (denormalized for query performance) */
  campaignId: string;

  /** Tenant ID for RLS */
  tenantId: string;

  /** Human-readable name */
  name: string;

  /** Current ad status */
  status: AdStatus;

  /** Reference to the creative used by this ad */
  creativeId: string;

  /** Resolved creative (populated on read) */
  creative?: AdCreative;

  /** Final destination URL */
  destinationUrl: string;

  /** Display URL (shown in ad) */
  displayUrl: string | null;

  /** UTM parameters for tracking */
  utmParams: UTMParams;

  /** Call-to-action button text/type */
  callToAction: CallToAction;

  /** Platform-specific external IDs */
  platformIds: Record<AdPlatform, string | null>;

  /**
   * Platform review status.
   * Each platform reviews ads independently.
   */
  platformReviewStatus: Record<AdPlatform, PlatformReviewStatus>;

  /** A/B test variant identifier (null if not in a test) */
  variantId: string | null;

  /** Whether this ad is the control variant in an A/B test */
  isControl: boolean;

  /** Creation timestamp */
  createdAt: string;

  /** Last update timestamp */
  updatedAt: string;
}

enum AdStatus {
  DRAFT = 'draft',
  PENDING_REVIEW = 'pending_review',
  ACTIVE = 'active',
  PAUSED = 'paused',
  REJECTED = 'rejected',
  ARCHIVED = 'archived',
}

interface UTMParams {
  source: string;
  medium: string;
  campaign: string;
  term?: string;
  content?: string;
}

interface CallToAction {
  type: 'learn_more' | 'shop_now' | 'sign_up' | 'contact_us' | 'download' | 'book_now' | 'get_offer' | 'apply_now' | 'subscribe' | 'custom';
  customText?: string;
}

interface PlatformReviewStatus {
  status: 'pending' | 'approved' | 'rejected' | 'in_review';
  rejectionReasons?: string[];
  reviewedAt?: string;
}
```

### AdCreative

```typescript
/**
 * A creative asset used in ads. Supports multiple formats,
 * A/B variants, and dynamic creative optimization (DCO).
 */
interface AdCreative {
  /** Unique creative identifier */
  id: string;

  /** Tenant ID for RLS */
  tenantId: string;

  /** Human-readable name */
  name: string;

  /** Creative type */
  type: CreativeType;

  /**
   * Media assets. For single-image/video ads, contains one entry.
   * For carousels, contains multiple entries in order.
   */
  media: CreativeMedia[];

  /** Primary text / headline */
  headline: string;

  /** Secondary text / description */
  description: string | null;

  /** Long-form body copy */
  bodyText: string | null;

  /**
   * Dynamic Creative Optimization fields.
   * When enabled, the platform tests combinations of headlines,
   * descriptions, and media to find the best performer.
   */
  dco: DCOConfig | null;

  /** Aspect ratios this creative supports */
  aspectRatios: string[];

  /**
   * Reference to media asset in @mcv/content/media.
   * Used for centralized asset management.
   */
  mediaAssetIds: string[];

  /** Internal compliance tags */
  complianceTags: string[];

  /** Whether this creative has passed internal compliance review */
  complianceChecked: boolean;

  /** Creation timestamp */
  createdAt: string;

  /** Last update timestamp */
  updatedAt: string;
}

enum CreativeType {
  IMAGE = 'image',
  VIDEO = 'video',
  CAROUSEL = 'carousel',
  TEXT = 'text',
  HTML5 = 'html5',
  PLAYABLE = 'playable',
}

interface CreativeMedia {
  /** URL to the media asset */
  url: string;

  /** MIME type */
  mimeType: string;

  /** Width in pixels (for images/video) */
  width: number;

  /** Height in pixels (for images/video) */
  height: number;

  /** Duration in seconds (for video) */
  duration?: number;

  /** File size in bytes */
  fileSize: number;

  /** Alt text for accessibility */
  altText: string;

  /** Thumbnail URL (for video) */
  thumbnailUrl?: string;
}

interface DCOConfig {
  /** Whether DCO is enabled */
  enabled: boolean;

  /** Headline variants for testing */
  headlines: string[];

  /** Description variants for testing */
  descriptions: string[];

  /** Media variants for testing */
  mediaVariants: CreativeMedia[];

  /** CTA variants for testing */
  ctaVariants: CallToAction[];
}
```

### AudienceTarget

```typescript
/**
 * Defines the targeting configuration for an ad group.
 * Combines multiple targeting dimensions with AND logic.
 */
interface AudienceTarget {
  /** Unique targeting configuration ID */
  id: string;

  /** Parent ad group ID */
  adGroupId: string;

  /** Tenant ID for RLS */
  tenantId: string;

  /** Geographic targeting */
  geo: GeoTarget;

  /** Demographic targeting */
  demographics: DemographicTarget;

  /** Interest-based targeting */
  interests: InterestTarget[];

  /** Behavioral targeting */
  behaviors: BehaviorTarget[];

  /**
   * Custom audience references.
   * These are audiences synced from @mcv/growth/cdp segments.
   */
  customAudiences: CustomAudienceRef[];

  /**
   * Lookalike audience configurations.
   * Built from custom audiences via platform APIs.
   */
  lookalikeAudiences: LookalikeConfig[];

  /** Retargeting configurations */
  retargeting: RetargetingConfig[];

  /** Keyword targeting (primarily for Google Search) */
  keywords: KeywordTarget[];

  /** Exclusion audiences — people NOT to target */
  exclusions: AudienceExclusion[];

  /** Estimated audience size (refreshed periodically) */
  estimatedSize: number | null;

  /** Last size estimation timestamp */
  estimatedAt: string | null;
}

interface GeoTarget {
  /** Country codes (ISO 3166-1 alpha-2) */
  countries: string[];

  /** Region/state targeting */
  regions: GeoRegion[];

  /** City targeting */
  cities: GeoCity[];

  /** Radius targeting around a point */
  radiusTargets: RadiusTarget[];

  /** Location exclusions */
  excludedLocations: string[];
}

interface GeoRegion {
  countryCode: string;
  regionCode: string;
  name: string;
}

interface GeoCity {
  countryCode: string;
  cityName: string;
  /** Platform-specific city ID */
  platformCityId?: Record<AdPlatform, string>;
}

interface RadiusTarget {
  latitude: number;
  longitude: number;
  radiusKm: number;
  label: string;
}

interface DemographicTarget {
  ageMin: number | null;
  ageMax: number | null;
  genders: ('male' | 'female' | 'all')[];
  languages: string[];
  /** Household income brackets (platform-specific) */
  incomeRanges?: string[];
  /** Education levels */
  educationLevels?: string[];
  /** Parental status */
  parentalStatus?: ('parent' | 'not_parent' | 'unknown')[];
}

interface InterestTarget {
  /** Platform-specific interest category ID */
  categoryId: string;
  /** Human-readable label */
  label: string;
  /** Platform this interest applies to */
  platform: AdPlatform;
}

interface BehaviorTarget {
  /** Platform-specific behavior ID */
  behaviorId: string;
  label: string;
  platform: AdPlatform;
}

interface CustomAudienceRef {
  /** Local audience ID */
  audienceId: string;
  /** CDP segment ID from @mcv/growth/cdp */
  cdpSegmentId: string;
  /** Platform-specific audience IDs (after sync) */
  platformAudienceIds: Record<AdPlatform, string | null>;
  /** Last sync timestamp */
  lastSyncedAt: string | null;
  /** Current member count */
  memberCount: number;
}

interface LookalikeConfig {
  /** Source custom audience ID */
  sourceAudienceId: string;
  /** Similarity percentage (1-10, where 1 is most similar) */
  similarityPercent: number;
  /** Target country for lookalike */
  country: string;
  /** Platform-specific lookalike audience IDs */
  platformAudienceIds: Record<AdPlatform, string | null>;
}

interface RetargetingConfig {
  /** Retargeting type */
  type: 'website_visitors' | 'app_users' | 'video_viewers' | 'form_submitters' | 'page_engagers';
  /** Lookback window in days */
  lookbackDays: number;
  /** Specific URL patterns to retarget (for website visitors) */
  urlPatterns?: string[];
  /** Pixel ID for tracking */
  pixelId: string;
  /** Platform-specific audience IDs */
  platformAudienceIds: Record<AdPlatform, string | null>;
}

interface KeywordTarget {
  keyword: string;
  matchType: 'broad' | 'phrase' | 'exact';
  /** Max CPC bid for this keyword (in cents) */
  maxCpcCents: number | null;
  /** Negative keyword (exclude this term) */
  isNegative: boolean;
}

interface AudienceExclusion {
  type: 'custom_audience' | 'retargeting' | 'conversion';
  referenceId: string;
  label: string;
}
```

### BudgetConfig

```typescript
/**
 * Budget configuration for a campaign.
 * Controls how much is spent, how it's paced, and when to alert.
 */
interface BudgetConfig {
  /** Unique budget config ID */
  id: string;

  /** Parent campaign ID */
  campaignId: string;

  /** Tenant ID for RLS */
  tenantId: string;

  /** Budget type */
  type: BudgetType;

  /**
   * Total budget amount in cents (smallest currency unit).
   * For daily budgets, this is the daily cap.
   * For lifetime budgets, this is the total cap.
   */
  amountCents: number;

  /** Currency code (ISO 4217) */
  currency: string;

  /**
   * Spend pacing strategy.
   * Controls how the budget is distributed over time.
   */
  pacing: BudgetPacing;

  /** Total amount spent to date (in cents) */
  spentCents: number;

  /** Remaining budget (in cents) */
  remainingCents: number;

  /**
   * Per-platform budget allocation.
   * When a campaign runs on multiple platforms, budget
   * can be split proportionally or by fixed amounts.
   */
  platformAllocations: PlatformBudgetAllocation[];

  /** Alert thresholds as percentages of total budget */
  alertThresholds: number[];

  /** Alerts that have been triggered */
  triggeredAlerts: TriggeredAlert[];

  /** Whether auto-pause is enabled when budget is exhausted */
  autoPauseOnExhaustion: boolean;

  /** Last spend refresh timestamp */
  lastRefreshedAt: string;
}

enum BudgetType {
  DAILY = 'daily',
  LIFETIME = 'lifetime',
  MONTHLY = 'monthly',
}

enum BudgetPacing {
  /** Spend evenly throughout the period */
  EVEN = 'even',
  /** Spend as fast as possible */
  ACCELERATED = 'accelerated',
  /** Spend more at the beginning of the period */
  FRONT_LOADED = 'front_loaded',
  /** Custom pacing curve */
  CUSTOM = 'custom',
}

interface PlatformBudgetAllocation {
  platform: AdPlatform;
  /** Allocation type */
  type: 'percentage' | 'fixed';
  /** Percentage (0-100) or fixed amount in cents */
  value: number;
  /** Actual amount allocated in cents (computed) */
  allocatedCents: number;
  /** Amount spent on this platform in cents */
  spentCents: number;
}

interface TriggeredAlert {
  threshold: number;
  triggeredAt: string;
  notificationSent: boolean;
}
```

### BidStrategy

```typescript
/**
 * Bid strategy configuration for a campaign.
 * Determines how much to bid for ad placements and
 * how bids are adjusted based on signals.
 */
interface BidStrategy {
  /** Unique bid config ID */
  id: string;

  /** Parent campaign ID */
  campaignId: string;

  /** Tenant ID for RLS */
  tenantId: string;

  /** Bid strategy type */
  type: BidStrategyType;

  /**
   * Target value in cents.
   * - For target_cpa: target cost per acquisition
   * - For target_roas: target return percentage (e.g., 400 = 400% ROAS)
   * - For manual_cpc: default max CPC
   */
  targetValueCents: number | null;

  /**
   * Maximum bid cap in cents.
   * Hard limit — platform will never bid above this.
   */
  maxBidCents: number | null;

  /**
   * Minimum bid floor in cents.
   * Platform will never bid below this.
   */
  minBidCents: number | null;

  /** Bid adjustments based on signals */
  adjustments: BidAdjustment[];

  /** Whether enhanced CPC is enabled (platform auto-adjusts bids) */
  enhancedCpc: boolean;

  /** Conversion action IDs for CPA/ROAS optimization */
  conversionActionIds: string[];
}

enum BidStrategyType {
  /** Manual cost-per-click bidding */
  MANUAL_CPC = 'manual_cpc',
  /** Automated bidding to achieve target CPA */
  TARGET_CPA = 'target_cpa',
  /** Automated bidding to achieve target ROAS */
  TARGET_ROAS = 'target_roas',
  /** Maximize the number of conversions within budget */
  MAX_CONVERSIONS = 'max_conversions',
  /** Maximize clicks within budget */
  MAX_CLICKS = 'max_clicks',
  /** Maximize impressions (CPM bidding) */
  MAX_IMPRESSIONS = 'max_impressions',
}

interface BidAdjustment {
  /** Signal type for adjustment */
  type: 'device' | 'location' | 'time' | 'audience' | 'age' | 'gender';

  /** Signal value (e.g., 'mobile', 'US', 'evening') */
  value: string;

  /**
   * Adjustment multiplier.
   * 1.0 = no change, 1.5 = bid 50% more, 0.5 = bid 50% less.
   * 0 = exclude entirely.
   */
  multiplier: number;
}
```

### AdPerformance

```typescript
/**
 * Performance metrics for an ad, ad group, or campaign.
 * Collected at configurable intervals and stored as time-series data.
 */
interface AdPerformance {
  /** Unique record ID */
  id: string;

  /** Tenant ID for RLS */
  tenantId: string;

  /** Reference entity type */
  entityType: 'campaign' | 'ad_group' | 'ad';

  /** Reference entity ID */
  entityId: string;

  /** Platform this data comes from */
  platform: AdPlatform;

  /** Date for this metrics snapshot (YYYY-MM-DD) */
  date: string;

  /** Hour of day (0-23) for hourly granularity, null for daily */
  hour: number | null;

  // --- Delivery Metrics ---

  /** Number of times the ad was shown */
  impressions: number;

  /** Number of unique users who saw the ad */
  reach: number;

  /** Average number of times each user saw the ad */
  frequency: number;

  // --- Engagement Metrics ---

  /** Number of clicks on the ad */
  clicks: number;

  /** Click-through rate (clicks / impressions) */
  ctr: number;

  /** Number of post engagements (likes, comments, shares) */
  engagements: number;

  /** Engagement rate (engagements / impressions) */
  engagementRate: number;

  /** Video views (3-second or platform-defined threshold) */
  videoViews: number | null;

  /** Video view rate (views / impressions) */
  videoViewRate: number | null;

  /** Average video watch time in seconds */
  avgWatchTime: number | null;

  // --- Cost Metrics ---

  /** Total spend in cents */
  spendCents: number;

  /** Cost per click in cents */
  cpcCents: number;

  /** Cost per 1000 impressions in cents */
  cpmCents: number;

  /** Cost per engagement in cents */
  cpeCents: number | null;

  /** Cost per video view in cents */
  cpvCents: number | null;

  // --- Conversion Metrics ---

  /** Number of conversions attributed to this entity */
  conversions: number;

  /** Conversion rate (conversions / clicks) */
  conversionRate: number;

  /** Cost per acquisition in cents */
  cpaCents: number | null;

  /** Revenue attributed to conversions in cents */
  revenueCents: number;

  /** Return on ad spend (revenue / spend) */
  roas: number | null;

  /**
   * Conversion breakdown by type.
   * Enables analysis of which conversion types are performing.
   */
  conversionsByType: Record<string, number>;

  // --- Quality Metrics ---

  /** Quality score (1-10, primarily Google Ads) */
  qualityScore: number | null;

  /** Ad relevance score (platform-specific) */
  relevanceScore: number | null;

  /** Landing page experience score */
  landingPageScore: number | null;

  /** Data collection timestamp */
  collectedAt: string;
}
```

### AdPlatformAdapter

```typescript
/**
 * Interface that all ad platform adapters must implement.
 * Provides a uniform API for managing ads across platforms.
 */
interface AdPlatformAdapter {
  /** Platform identifier */
  readonly platform: AdPlatform;

  /** Platform display name */
  readonly displayName: string;

  /** Whether this adapter is currently connected and authenticated */
  readonly isConnected: boolean;

  // --- Connection ---

  /**
   * Initialize the adapter with platform credentials.
   * Validates credentials and establishes API connection.
   */
  connect(config: PlatformConfig): Promise<void>;

  /**
   * Disconnect and clean up resources.
   */
  disconnect(): Promise<void>;

  /**
   * Verify the connection is still valid.
   * Returns false if re-authentication is needed.
   */
  healthCheck(): Promise<boolean>;

  // --- Campaign Operations ---

  createCampaign(campaign: Campaign): Promise<PlatformEntityResult>;
  updateCampaign(platformId: string, changes: Partial<Campaign>): Promise<void>;
  pauseCampaign(platformId: string): Promise<void>;
  resumeCampaign(platformId: string): Promise<void>;
  deleteCampaign(platformId: string): Promise<void>;
  getCampaign(platformId: string): Promise<PlatformCampaign>;
  listCampaigns(filters?: PlatformListFilters): Promise<PlatformCampaign[]>;

  // --- Ad Group Operations ---

  createAdGroup(campaignPlatformId: string, adGroup: AdGroup): Promise<PlatformEntityResult>;
  updateAdGroup(platformId: string, changes: Partial<AdGroup>): Promise<void>;
  pauseAdGroup(platformId: string): Promise<void>;
  deleteAdGroup(platformId: string): Promise<void>;
  getAdGroup(platformId: string): Promise<PlatformAdGroup>;

  // --- Ad Operations ---

  createAd(adGroupPlatformId: string, ad: Ad, creative: AdCreative): Promise<PlatformEntityResult>;
  updateAd(platformId: string, changes: Partial<Ad>): Promise<void>;
  pauseAd(platformId: string): Promise<void>;
  deleteAd(platformId: string): Promise<void>;
  getAd(platformId: string): Promise<PlatformAd>;
  getAdReviewStatus(platformId: string): Promise<PlatformReviewStatus>;

  // --- Audience Operations ---

  createCustomAudience(audience: CustomAudienceRef): Promise<PlatformEntityResult>;
  updateAudienceMembers(platformAudienceId: string, members: AudienceMember[]): Promise<void>;
  removeAudienceMembers(platformAudienceId: string, members: AudienceMember[]): Promise<void>;
  createLookalikeAudience(config: LookalikeConfig): Promise<PlatformEntityResult>;
  getAudienceSize(platformAudienceId: string): Promise<number>;
  deleteAudience(platformAudienceId: string): Promise<void>;

  // --- Creative Operations ---

  uploadCreative(creative: AdCreative): Promise<PlatformCreativeResult>;
  getCreativePreview(platformCreativeId: string): Promise<CreativePreview>;

  // --- Budget Operations ---

  setCampaignBudget(platformCampaignId: string, amount: number, type: BudgetType): Promise<void>;
  getCampaignSpend(platformCampaignId: string, dateRange: DateRange): Promise<SpendData>;

  // --- Reporting ---

  getPerformanceMetrics(
    filters: PerformanceFilters,
    dateRange: DateRange,
    granularity: 'hourly' | 'daily' | 'weekly'
  ): Promise<PlatformMetrics[]>;

  getInsights(platformCampaignId: string): Promise<PlatformInsights>;

  // --- Platform-Specific Extensions ---

  /**
   * Get platform capabilities and supported features.
   * Used to conditionally enable platform-specific UI/logic.
   */
  getCapabilities(): PlatformCapabilities;

  /**
   * Execute a platform-specific operation not covered by the standard API.
   * Type-safe via generics and platform-specific type maps.
   */
  executeExtension<T = unknown>(
    extensionName: string,
    params: Record<string, unknown>
  ): Promise<T>;
}

/** Result from creating an entity on a platform */
interface PlatformEntityResult {
  platformId: string;
  platformUrl?: string;
  status: string;
  metadata?: Record<string, unknown>;
}

/** Platform connection configuration */
interface PlatformConfig {
  platform: AdPlatform;
  /** OAuth access token or API key */
  accessToken: string;
  /** OAuth refresh token */
  refreshToken?: string;
  /** Token expiry timestamp */
  tokenExpiresAt?: string;
  /** Platform-specific account/ad account ID */
  accountId: string;
  /** Additional platform-specific config */
  extra?: Record<string, unknown>;
}

/** Platform capabilities declaration */
interface PlatformCapabilities {
  supportedObjectives: CampaignObjective[];
  supportedCreativeTypes: CreativeType[];
  supportedBidStrategies: BidStrategyType[];
  supportsDCO: boolean;
  supportsLookalikeAudiences: boolean;
  supportsDayParting: boolean;
  supportsDeviceBidAdjustments: boolean;
  maxHeadlineLength: number;
  maxDescriptionLength: number;
  maxImageSizeBytes: number;
  maxVideoLengthSeconds: number;
  supportedPlacements: string[];
  customExtensions: string[];
}
```

---

## Database Schemas

### campaigns

```typescript
import { pgTable, text, uuid, timestamp, jsonb, pgEnum } from 'drizzle-orm/pg-core';

export const campaignStatusEnum = pgEnum('campaign_status', [
  'draft', 'active', 'paused', 'completed', 'archived'
]);

export const campaignObjectiveEnum = pgEnum('campaign_objective', [
  'awareness', 'traffic', 'engagement', 'leads', 'conversions', 'app_installs'
]);

export const campaigns = pgTable('ads_campaigns', {
  id: uuid('id').defaultRandom().primaryKey(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id),
  name: text('name').notNull(),
  description: text('description'),
  objective: campaignObjectiveEnum('objective').notNull(),
  status: campaignStatusEnum('status').notNull().default('draft'),
  platforms: jsonb('platforms').notNull().$type<AdPlatform[]>(),
  platformIds: jsonb('platform_ids').notNull().$type<Record<string, string | null>>().default({}),
  startDate: timestamp('start_date', { withTimezone: true }).notNull(),
  endDate: timestamp('end_date', { withTimezone: true }),
  tags: jsonb('tags').notNull().$type<string[]>().default([]),
  parentCampaignId: uuid('parent_campaign_id'),
  syncStatus: text('sync_status').notNull().default('pending'),
  approvalStatus: text('approval_status').notNull().default('pending'),
  createdBy: uuid('created_by').notNull().references(() => users.id),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  lastSyncedAt: timestamp('last_synced_at', { withTimezone: true }),
});

// RLS Policy: tenant isolation
// CREATE POLICY "tenant_isolation" ON "ads_campaigns"
//   USING (tenant_id = current_setting('app.tenant_id')::uuid);
```

### ad_groups

```typescript
export const adGroups = pgTable('ads_ad_groups', {
  id: uuid('id').defaultRandom().primaryKey(),
  campaignId: uuid('campaign_id').notNull().references(() => campaigns.id, { onDelete: 'cascade' }),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id),
  name: text('name').notNull(),
  status: text('status').notNull().default('draft'),
  targeting: jsonb('targeting').$type<AudienceTarget>(),
  bidOverride: jsonb('bid_override').$type<BidOverride | null>(),
  dailyBudgetCap: integer('daily_budget_cap'),
  placements: jsonb('placements').notNull().$type<PlacementConfig[]>().default([]),
  schedule: jsonb('schedule').$type<AdSchedule | null>(),
  platformIds: jsonb('platform_ids').notNull().$type<Record<string, string | null>>().default({}),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});
```

### ads

```typescript
export const adStatusEnum = pgEnum('ad_status', [
  'draft', 'pending_review', 'active', 'paused', 'rejected', 'archived'
]);

export const ads = pgTable('ads_ads', {
  id: uuid('id').defaultRandom().primaryKey(),
  adGroupId: uuid('ad_group_id').notNull().references(() => adGroups.id, { onDelete: 'cascade' }),
  campaignId: uuid('campaign_id').notNull().references(() => campaigns.id),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id),
  name: text('name').notNull(),
  status: adStatusEnum('status').notNull().default('draft'),
  creativeId: uuid('creative_id').notNull().references(() => adCreatives.id),
  destinationUrl: text('destination_url').notNull(),
  displayUrl: text('display_url'),
  utmParams: jsonb('utm_params').notNull().$type<UTMParams>(),
  callToAction: jsonb('call_to_action').notNull().$type<CallToAction>(),
  platformIds: jsonb('platform_ids').notNull().$type<Record<string, string | null>>().default({}),
  platformReviewStatus: jsonb('platform_review_status')
    .notNull()
    .$type<Record<string, PlatformReviewStatus>>()
    .default({}),
  variantId: text('variant_id'),
  isControl: boolean('is_control').notNull().default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});
```

### ad_creatives

```typescript
export const creativeTypeEnum = pgEnum('creative_type', [
  'image', 'video', 'carousel', 'text', 'html5', 'playable'
]);

export const adCreatives = pgTable('ads_ad_creatives', {
  id: uuid('id').defaultRandom().primaryKey(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id),
  name: text('name').notNull(),
  type: creativeTypeEnum('type').notNull(),
  media: jsonb('media').notNull().$type<CreativeMedia[]>(),
  headline: text('headline').notNull(),
  description: text('description'),
  bodyText: text('body_text'),
  dco: jsonb('dco').$type<DCOConfig | null>(),
  aspectRatios: jsonb('aspect_ratios').notNull().$type<string[]>().default([]),
  mediaAssetIds: jsonb('media_asset_ids').notNull().$type<string[]>().default([]),
  complianceTags: jsonb('compliance_tags').notNull().$type<string[]>().default([]),
  complianceChecked: boolean('compliance_checked').notNull().default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});
```

### audience_targets

```typescript
export const audienceTargets = pgTable('ads_audience_targets', {
  id: uuid('id').defaultRandom().primaryKey(),
  adGroupId: uuid('ad_group_id').notNull().references(() => adGroups.id, { onDelete: 'cascade' }),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id),
  geo: jsonb('geo').notNull().$type<GeoTarget>(),
  demographics: jsonb('demographics').notNull().$type<DemographicTarget>(),
  interests: jsonb('interests').notNull().$type<InterestTarget[]>().default([]),
  behaviors: jsonb('behaviors').notNull().$type<BehaviorTarget[]>().default([]),
  customAudiences: jsonb('custom_audiences').notNull().$type<CustomAudienceRef[]>().default([]),
  lookalikeAudiences: jsonb('lookalike_audiences').notNull().$type<LookalikeConfig[]>().default([]),
  retargeting: jsonb('retargeting').notNull().$type<RetargetingConfig[]>().default([]),
  keywords: jsonb('keywords').notNull().$type<KeywordTarget[]>().default([]),
  exclusions: jsonb('exclusions').notNull().$type<AudienceExclusion[]>().default([]),
  estimatedSize: integer('estimated_size'),
  estimatedAt: timestamp('estimated_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});
```

### budgets

```typescript
export const budgetTypeEnum = pgEnum('budget_type', ['daily', 'lifetime', 'monthly']);
export const budgetPacingEnum = pgEnum('budget_pacing', ['even', 'accelerated', 'front_loaded', 'custom']);

export const budgets = pgTable('ads_budgets', {
  id: uuid('id').defaultRandom().primaryKey(),
  campaignId: uuid('campaign_id').notNull().references(() => campaigns.id, { onDelete: 'cascade' }),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id),
  type: budgetTypeEnum('type').notNull(),
  amountCents: integer('amount_cents').notNull(),
  currency: text('currency').notNull().default('USD'),
  pacing: budgetPacingEnum('pacing').notNull().default('even'),
  spentCents: integer('spent_cents').notNull().default(0),
  remainingCents: integer('remaining_cents').notNull(),
  platformAllocations: jsonb('platform_allocations')
    .notNull()
    .$type<PlatformBudgetAllocation[]>()
    .default([]),
  alertThresholds: jsonb('alert_thresholds').notNull().$type<number[]>().default([50, 75, 90, 100]),
  triggeredAlerts: jsonb('triggered_alerts').notNull().$type<TriggeredAlert[]>().default([]),
  autoPauseOnExhaustion: boolean('auto_pause_on_exhaustion').notNull().default(true),
  lastRefreshedAt: timestamp('last_refreshed_at', { withTimezone: true }).notNull().defaultNow(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});
```

### bid_configs

```typescript
export const bidStrategyTypeEnum = pgEnum('bid_strategy_type', [
  'manual_cpc', 'target_cpa', 'target_roas', 'max_conversions', 'max_clicks', 'max_impressions'
]);

export const bidConfigs = pgTable('ads_bid_configs', {
  id: uuid('id').defaultRandom().primaryKey(),
  campaignId: uuid('campaign_id').notNull().references(() => campaigns.id, { onDelete: 'cascade' }),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id),
  type: bidStrategyTypeEnum('type').notNull(),
  targetValueCents: integer('target_value_cents'),
  maxBidCents: integer('max_bid_cents'),
  minBidCents: integer('min_bid_cents'),
  adjustments: jsonb('adjustments').notNull().$type<BidAdjustment[]>().default([]),
  enhancedCpc: boolean('enhanced_cpc').notNull().default(false),
  conversionActionIds: jsonb('conversion_action_ids').notNull().$type<string[]>().default([]),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});
```

### ad_performance

```typescript
export const adPerformance = pgTable('ads_performance', {
  id: uuid('id').defaultRandom().primaryKey(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id),
  entityType: text('entity_type').notNull(), // 'campaign' | 'ad_group' | 'ad'
  entityId: uuid('entity_id').notNull(),
  platform: text('platform').notNull(),
  date: date('date').notNull(),
  hour: integer('hour'),
  impressions: integer('impressions').notNull().default(0),
  reach: integer('reach').notNull().default(0),
  frequency: real('frequency').notNull().default(0),
  clicks: integer('clicks').notNull().default(0),
  ctr: real('ctr').notNull().default(0),
  engagements: integer('engagements').notNull().default(0),
  engagementRate: real('engagement_rate').notNull().default(0),
  videoViews: integer('video_views'),
  videoViewRate: real('video_view_rate'),
  avgWatchTime: real('avg_watch_time'),
  spendCents: integer('spend_cents').notNull().default(0),
  cpcCents: integer('cpc_cents').notNull().default(0),
  cpmCents: integer('cpm_cents').notNull().default(0),
  cpeCents: integer('cpe_cents'),
  cpvCents: integer('cpv_cents'),
  conversions: integer('conversions').notNull().default(0),
  conversionRate: real('conversion_rate').notNull().default(0),
  cpaCents: integer('cpa_cents'),
  revenueCents: integer('revenue_cents').notNull().default(0),
  roas: real('roas'),
  conversionsByType: jsonb('conversions_by_type').notNull().$type<Record<string, number>>().default({}),
  qualityScore: integer('quality_score'),
  relevanceScore: real('relevance_score'),
  landingPageScore: real('landing_page_score'),
  collectedAt: timestamp('collected_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  // Composite index for time-series queries
  perfDateIdx: index('ads_perf_date_idx').on(table.tenantId, table.entityType, table.entityId, table.date),
  // Platform filter index
  perfPlatformIdx: index('ads_perf_platform_idx').on(table.tenantId, table.platform, table.date),
  // Partition by month for large-scale deployments (configured at DB level)
}));
```

### ad_platform_configs

```typescript
export const adPlatformConfigs = pgTable('ads_platform_configs', {
  id: uuid('id').defaultRandom().primaryKey(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id),
  platform: text('platform').notNull(),
  accountId: text('account_id').notNull(),
  accountName: text('account_name'),
  /** Encrypted access token (encrypted at rest via pgcrypto) */
  accessTokenEncrypted: text('access_token_encrypted').notNull(),
  /** Encrypted refresh token */
  refreshTokenEncrypted: text('refresh_token_encrypted'),
  tokenExpiresAt: timestamp('token_expires_at', { withTimezone: true }),
  /** Platform-specific configuration (e.g., conversion pixel IDs) */
  config: jsonb('config').notNull().$type<Record<string, unknown>>().default({}),
  isActive: boolean('is_active').notNull().default(true),
  lastHealthCheck: timestamp('last_health_check', { withTimezone: true }),
  healthStatus: text('health_status').default('unknown'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  uniquePlatformAccount: uniqueIndex('ads_platform_unique_idx').on(table.tenantId, table.platform, table.accountId),
}));
```

### ad_approvals

```typescript
export const approvalStatusEnum = pgEnum('approval_status', [
  'pending', 'approved', 'rejected', 'revision_requested'
]);

export const adApprovals = pgTable('ads_approvals', {
  id: uuid('id').defaultRandom().primaryKey(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id),
  /** Entity being approved (campaign, ad group, or ad) */
  entityType: text('entity_type').notNull(),
  entityId: uuid('entity_id').notNull(),
  status: approvalStatusEnum('status').notNull().default('pending'),
  /** ID of the user who submitted for approval */
  submittedBy: uuid('submitted_by').notNull().references(() => users.id),
  /** ID of the user who reviewed */
  reviewedBy: uuid('reviewed_by').references(() => users.id),
  /** Review notes / rejection reason */
  reviewNotes: text('review_notes'),
  /** Automated policy check results */
  policyCheckResults: jsonb('policy_check_results').$type<PolicyCheckResult[]>(),
  /** Compliance flags detected */
  complianceFlags: jsonb('compliance_flags').$type<string[]>().default([]),
  submittedAt: timestamp('submitted_at', { withTimezone: true }).notNull().defaultNow(),
  reviewedAt: timestamp('reviewed_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

interface PolicyCheckResult {
  rule: string;
  passed: boolean;
  message: string;
  severity: 'error' | 'warning' | 'info';
}
```

### Database Indexes and Partitioning

```sql
-- Performance-critical indexes
CREATE INDEX ads_campaigns_tenant_status_idx ON ads_campaigns (tenant_id, status);
CREATE INDEX ads_campaigns_tenant_dates_idx ON ads_campaigns (tenant_id, start_date, end_date);
CREATE INDEX ads_ad_groups_campaign_idx ON ads_ad_groups (campaign_id, status);
CREATE INDEX ads_ads_ad_group_idx ON ads_ads (ad_group_id, status);
CREATE INDEX ads_ads_campaign_idx ON ads_ads (campaign_id, status);
CREATE INDEX ads_performance_entity_date_idx ON ads_performance (tenant_id, entity_type, entity_id, date DESC);
CREATE INDEX ads_performance_platform_date_idx ON ads_performance (tenant_id, platform, date DESC);
CREATE INDEX ads_approvals_entity_idx ON ads_approvals (entity_type, entity_id, status);

-- Partitioning for performance data (high-volume time-series)
-- Implemented at the infrastructure level; the application uses the parent table.
-- Monthly partitions recommended for >1M rows/month.
-- Example:
-- CREATE TABLE ads_performance_2026_01 PARTITION OF ads_performance
--   FOR VALUES FROM ('2026-01-01') TO ('2026-02-01');

-- RLS policies (applied to all tables)
ALTER TABLE ads_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE ads_ad_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE ads_ads ENABLE ROW LEVEL SECURITY;
ALTER TABLE ads_ad_creatives ENABLE ROW LEVEL SECURITY;
ALTER TABLE ads_audience_targets ENABLE ROW LEVEL SECURITY;
ALTER TABLE ads_budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE ads_bid_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE ads_performance ENABLE ROW LEVEL SECURITY;
ALTER TABLE ads_platform_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE ads_approvals ENABLE ROW LEVEL SECURITY;

-- Standard tenant isolation policy (repeat for each table)
CREATE POLICY tenant_isolation ON ads_campaigns
  USING (tenant_id = current_setting('app.tenant_id')::uuid)
  WITH CHECK (tenant_id = current_setting('app.tenant_id')::uuid);
```

---

## Code Examples

### 1. Creating a Campaign with Budget and Targeting

```typescript
import { AdService } from '@mcv/growth/ads';
import { CampaignObjective, BudgetType, BidStrategyType, BudgetPacing } from '@mcv/growth/ads';

const adService = container.resolve(AdService);

// Create a conversion-optimized campaign on Google and Meta
const campaign = await adService.createCampaign({
  name: 'Summer Sale 2026 - Conversions',
  description: 'Drive purchases for the summer clearance event',
  objective: CampaignObjective.CONVERSIONS,
  platforms: ['google', 'meta'],
  startDate: '2026-06-01T00:00:00Z',
  endDate: '2026-06-30T23:59:59Z',
  tags: ['summer-sale', 'conversions', '2026'],
  budget: {
    type: BudgetType.LIFETIME,
    amountCents: 500000, // $5,000
    currency: 'USD',
    pacing: BudgetPacing.EVEN,
    platformAllocations: [
      { platform: 'google', type: 'percentage', value: 60 },
      { platform: 'meta', type: 'percentage', value: 40 },
    ],
    alertThresholds: [50, 75, 90, 100],
    autoPauseOnExhaustion: true,
  },
  bidStrategy: {
    type: BidStrategyType.TARGET_CPA,
    targetValueCents: 1500, // $15 target CPA
    maxBidCents: 500,       // $5 max bid
    enhancedCpc: true,
    adjustments: [
      { type: 'device', value: 'mobile', multiplier: 1.2 },
      { type: 'time', value: 'evening', multiplier: 1.3 },
    ],
  },
});

console.log(`Campaign created: ${campaign.id} (status: ${campaign.status})`);
// → Campaign created: a1b2c3d4-... (status: draft)
```

### 2. Setting Up Ad Groups with Audience Targeting

```typescript
import { AdGroupManager, AudienceManager } from '@mcv/growth/ads';

const adGroupManager = container.resolve(AdGroupManager);
const audienceManager = container.resolve(AudienceManager);

// Sync a CDP segment to ad platforms as a custom audience
const customAudience = await audienceManager.syncFromCDP({
  cdpSegmentId: 'seg_high_value_customers',
  platforms: ['google', 'meta'],
  name: 'High-Value Customers (LTV > $500)',
});

// Create a lookalike audience on Meta
const lookalikeAudience = await audienceManager.createLookalike({
  sourceAudienceId: customAudience.id,
  platform: 'meta',
  similarityPercent: 3, // Top 3% similarity
  country: 'US',
});

// Create an ad group with targeting
const adGroup = await adGroupManager.create({
  campaignId: campaign.id,
  name: 'Lookalike - US - 25-54',
  targeting: {
    geo: {
      countries: ['US'],
      regions: [],
      cities: [],
      radiusTargets: [],
      excludedLocations: [],
    },
    demographics: {
      ageMin: 25,
      ageMax: 54,
      genders: ['all'],
      languages: ['en'],
    },
    interests: [
      { categoryId: '6003', label: 'Online Shopping', platform: 'meta' },
    ],
    behaviors: [],
    customAudiences: [],
    lookalikeAudiences: [
      {
        sourceAudienceId: customAudience.id,
        similarityPercent: 3,
        country: 'US',
        platformAudienceIds: lookalikeAudience.platformAudienceIds,
      },
    ],
    retargeting: [],
    keywords: [],
    exclusions: [
      {
        type: 'custom_audience',
        referenceId: customAudience.id,
        label: 'Exclude existing customers',
      },
    ],
  },
  placements: [
    {
      platform: 'meta',
      placements: ['feed', 'stories', 'reels'],
      devices: ['mobile', 'desktop'],
    },
  ],
  schedule: {
    timezone: 'America/New_York',
    windows: [
      { days: [1, 2, 3, 4, 5], startHour: 8, endHour: 22, bidMultiplier: 1.0 },
      { days: [0, 6], startHour: 10, endHour: 20, bidMultiplier: 0.8 },
    ],
  },
});

console.log(`Ad group created: ${adGroup.id}`);
console.log(`Estimated audience size: ${adGroup.targeting.estimatedSize}`);
```

### 3. Creating Ads with Creative Variants for A/B Testing

```typescript
import { AdCreativeManager, AdService } from '@mcv/growth/ads';
import { CreativeType } from '@mcv/growth/ads';

const creativeManager = container.resolve(AdCreativeManager);

// Create two creative variants for A/B testing
const creativeA = await creativeManager.create({
  name: 'Summer Sale - Lifestyle Image',
  type: CreativeType.IMAGE,
  media: [{
    url: 'https://cdn.example.com/ads/summer-sale-lifestyle.jpg',
    mimeType: 'image/jpeg',
    width: 1200,
    height: 628,
    fileSize: 245000,
    altText: 'Happy customers enjoying summer products',
  }],
  headline: 'Summer Sale — Up to 50% Off',
  description: 'Shop our biggest sale of the year. Free shipping on orders over $50.',
  bodyText: 'Don\'t miss out on incredible deals across our entire summer collection.',
  aspectRatios: ['1.91:1'],
  complianceTags: ['promotional', 'discount'],
});

const creativeB = await creativeManager.create({
  name: 'Summer Sale - Product Focus',
  type: CreativeType.IMAGE,
  media: [{
    url: 'https://cdn.example.com/ads/summer-sale-products.jpg',
    mimeType: 'image/jpeg',
    width: 1200,
    height: 628,
    fileSize: 198000,
    altText: 'Featured summer products on sale',
  }],
  headline: 'Flash Sale: 50% Off Summer Favorites',
  description: 'Limited time only. Shop now before they\'re gone.',
  bodyText: 'Our most popular summer items are now half price.',
  aspectRatios: ['1.91:1'],
  complianceTags: ['promotional', 'discount', 'urgency'],
});

// Create ads with both variants
const adControl = await adService.createAd({
  adGroupId: adGroup.id,
  name: 'Summer Sale - Variant A (Control)',
  creativeId: creativeA.id,
  destinationUrl: 'https://shop.example.com/summer-sale',
  utmParams: {
    source: 'meta',
    medium: 'paid_social',
    campaign: 'summer_sale_2026',
    content: 'variant_a',
  },
  callToAction: { type: 'shop_now' },
  isControl: true,
  variantId: 'summer-sale-ab-test-001',
});

const adVariant = await adService.createAd({
  adGroupId: adGroup.id,
  name: 'Summer Sale - Variant B',
  creativeId: creativeB.id,
  destinationUrl: 'https://shop.example.com/summer-sale',
  utmParams: {
    source: 'meta',
    medium: 'paid_social',
    campaign: 'summer_sale_2026',
    content: 'variant_b',
  },
  callToAction: { type: 'shop_now' },
  isControl: false,
  variantId: 'summer-sale-ab-test-001',
});

console.log(`A/B test created: variant A (${adControl.id}) vs variant B (${adVariant.id})`);
```

### 4. Activating a Campaign with Compliance Check

```typescript
import { CampaignManager, ComplianceChecker } from '@mcv/growth/ads';

const campaignManager = container.resolve(CampaignManager);
const complianceChecker = container.resolve(ComplianceChecker);

// Run compliance checks before activation
const complianceResult = await complianceChecker.checkCampaign(campaign.id);

if (!complianceResult.passed) {
  console.error('Compliance check failed:');
  for (const issue of complianceResult.issues) {
    console.error(`  [${issue.severity}] ${issue.rule}: ${issue.message}`);
  }
  // Example output:
  // [error] max_discount_claim: Discount claims must include terms and conditions
  // [warning] image_text_ratio: Image contains >20% text (Meta policy)
  throw new Error('Campaign cannot be activated — compliance issues found');
}

// Submit for approval (if approval workflow is enabled)
const approval = await complianceChecker.submitForApproval({
  entityType: 'campaign',
  entityId: campaign.id,
  policyCheckResults: complianceResult.checks,
});

// If auto-approved or after manual approval:
if (approval.status === 'approved') {
  // Activate the campaign — this triggers platform sync
  const activatedCampaign = await campaignManager.activate(campaign.id);

  console.log(`Campaign activated: ${activatedCampaign.id}`);
  console.log(`Sync status: ${activatedCampaign.syncStatus}`);
  // → Campaign activated: a1b2c3d4-...
  // → Sync status: pending
  // The PlatformSyncEngine will push to Google/Meta in the background.
}
```

### 5. Real-time Budget Monitoring and Alerts

```typescript
import { BudgetManager } from '@mcv/growth/ads';

const budgetManager = container.resolve(BudgetManager);

// Get current budget status for a campaign
const budgetStatus = await budgetManager.getStatus(campaign.id);

console.log(`Budget: $${(budgetStatus.amountCents / 100).toFixed(2)}`);
console.log(`Spent: $${(budgetStatus.spentCents / 100).toFixed(2)}`);
console.log(`Remaining: $${(budgetStatus.remainingCents / 100).toFixed(2)}`);
console.log(`Utilization: ${budgetStatus.utilizationPercent.toFixed(1)}%`);
console.log(`Pacing: ${budgetStatus.pacingStatus}`); // 'on_track' | 'under_pacing' | 'over_pacing'

// Platform-level breakdown
for (const alloc of budgetStatus.platformAllocations) {
  console.log(`  ${alloc.platform}: $${(alloc.spentCents / 100).toFixed(2)} / $${(alloc.allocatedCents / 100).toFixed(2)}`);
}

// Set up a budget alert callback
budgetManager.onAlert(campaign.id, async (alert) => {
  console.log(`⚠️ Budget alert: ${alert.threshold}% threshold reached`);
  console.log(`  Campaign: ${alert.campaignName}`);
  console.log(`  Spent: $${(alert.spentCents / 100).toFixed(2)}`);

  if (alert.threshold >= 100) {
    // Auto-pause is handled by BudgetManager if configured
    console.log('  Campaign auto-paused due to budget exhaustion');
  }
});

// Manually adjust budget (e.g., increase mid-campaign)
await budgetManager.adjustBudget(campaign.id, {
  newAmountCents: 750000, // Increase to $7,500
  reason: 'Campaign performing well — ROAS exceeds target',
});

// Rebalance allocation across platforms based on performance
await budgetManager.rebalanceAllocations(campaign.id, {
  strategy: 'performance_weighted',
  metric: 'roas',
  lookbackDays: 7,
});
// Shifts budget toward the platform with better ROAS
```

### 6. Cross-Platform Performance Reporting

```typescript
import { PerformanceTracker, AdReporter } from '@mcv/growth/ads';

const tracker = container.resolve(PerformanceTracker);
const reporter = container.resolve(AdReporter);

// Get campaign performance across all platforms
const performance = await tracker.getCampaignPerformance({
  campaignId: campaign.id,
  dateRange: {
    start: '2026-06-01',
    end: '2026-06-15',
  },
  granularity: 'daily',
  breakdownBy: ['platform'],
});

// Aggregate metrics
console.log('=== Campaign Performance (Jun 1-15) ===');
console.log(`Total Impressions: ${performance.totals.impressions.toLocaleString()}`);
console.log(`Total Clicks: ${performance.totals.clicks.toLocaleString()}`);
console.log(`Overall CTR: ${(performance.totals.ctr * 100).toFixed(2)}%`);
console.log(`Total Spend: $${(performance.totals.spendCents / 100).toFixed(2)}`);
console.log(`Total Conversions: ${performance.totals.conversions}`);
console.log(`CPA: $${(performance.totals.cpaCents! / 100).toFixed(2)}`);
console.log(`ROAS: ${performance.totals.roas!.toFixed(2)}x`);

// Platform breakdown
for (const [platform, metrics] of Object.entries(performance.byPlatform)) {
  console.log(`\n--- ${platform} ---`);
  console.log(`  Impressions: ${metrics.impressions.toLocaleString()}`);
  console.log(`  Clicks: ${metrics.clicks.toLocaleString()}`);
  console.log(`  CTR: ${(metrics.ctr * 100).toFixed(2)}%`);
  console.log(`  Spend: $${(metrics.spendCents / 100).toFixed(2)}`);
  console.log(`  Conversions: ${metrics.conversions}`);
  console.log(`  ROAS: ${metrics.roas?.toFixed(2) ?? 'N/A'}x`);
}

// Generate a formatted report
const report = await reporter.generateReport({
  campaignIds: [campaign.id],
  dateRange: { start: '2026-06-01', end: '2026-06-15' },
  sections: [
    'executive_summary',
    'platform_comparison',
    'creative_performance',
    'audience_insights',
    'budget_utilization',
    'recommendations',
  ],
  format: 'pdf',
});

console.log(`Report generated: ${report.url}`);
// Reports can also be scheduled for automatic delivery
await reporter.scheduleReport({
  campaignIds: [campaign.id],
  frequency: 'weekly',
  dayOfWeek: 1, // Monday
  recipients: ['marketing-team@example.com'],
  format: 'pdf',
});
```

### 7. Platform Adapter Usage — Google Ads

```typescript
import { AdPlatformRegistry, GoogleAdsAdapter } from '@mcv/growth/ads';

const registry = container.resolve(AdPlatformRegistry);

// Get the Google Ads adapter (automatically connected via stored credentials)
const googleAdapter = await registry.getAdapter('google', tenantId);

// Check platform capabilities
const capabilities = googleAdapter.getCapabilities();
console.log('Google Ads capabilities:');
console.log(`  Objectives: ${capabilities.supportedObjectives.join(', ')}`);
console.log(`  Bid strategies: ${capabilities.supportedBidStrategies.join(', ')}`);
console.log(`  DCO: ${capabilities.supportsDCO}`);
console.log(`  Max headline: ${capabilities.maxHeadlineLength} chars`);
console.log(`  Extensions: ${capabilities.customExtensions.join(', ')}`);
// → Extensions: performance_max, responsive_search_ads, sitelinks, callouts

// Use a Google-specific extension (Performance Max campaign)
const pMaxResult = await googleAdapter.executeExtension<PMaxResult>(
  'performance_max',
  {
    campaignId: 'google-campaign-123',
    assetGroups: [
      {
        name: 'Summer Sale Assets',
        headlines: ['Summer Sale', 'Up to 50% Off', 'Shop Now'],
        descriptions: ['Free shipping over $50', 'Limited time offer'],
        images: ['https://cdn.example.com/ads/pmax-1.jpg'],
        logos: ['https://cdn.example.com/logo.png'],
        finalUrl: 'https://shop.example.com/summer-sale',
      },
    ],
    audienceSignals: [
      { type: 'custom_segment', id: 'google-segment-456' },
    ],
  }
);

console.log(`Performance Max campaign created: ${pMaxResult.platformId}`);

// Manual sync trigger (usually automatic via PlatformSyncEngine)
const syncResult = await registry.syncCampaign(campaign.id, 'google');
console.log(`Sync result: ${syncResult.status}`);
if (syncResult.conflicts.length > 0) {
  console.log('Conflicts detected:');
  for (const conflict of syncResult.conflicts) {
    console.log(`  ${conflict.field}: local="${conflict.localValue}" vs platform="${conflict.platformValue}"`);
  }
}
```

### 8. Dynamic Creative Optimization (DCO) Setup

```typescript
import { AdCreativeManager, AdService } from '@mcv/growth/ads';

const creativeManager = container.resolve(AdCreativeManager);

// Create a DCO-enabled creative
// The platform will automatically test combinations to find the best performer
const dcoCreative = await creativeManager.create({
  name: 'Summer Sale - DCO',
  type: CreativeType.IMAGE,
  media: [{
    url: 'https://cdn.example.com/ads/summer-main.jpg',
    mimeType: 'image/jpeg',
    width: 1200,
    height: 628,
    fileSize: 220000,
    altText: 'Summer sale promotional image',
  }],
  headline: 'Summer Sale — Up to 50% Off', // Default headline
  description: 'Shop our biggest sale of the year.',
  dco: {
    enabled: true,
    headlines: [
      'Summer Sale — Up to 50% Off',
      'Flash Sale: Save Big This Summer',
      '50% Off Summer Favorites',
      'Don\'t Miss Our Summer Clearance',
      'Summer Deals You Can\'t Resist',
    ],
    descriptions: [
      'Shop our biggest sale of the year. Free shipping on orders over $50.',
      'Limited time only — save up to 50% on thousands of items.',
      'Your summer wardrobe awaits. Incredible deals on top brands.',
    ],
    mediaVariants: [
      {
        url: 'https://cdn.example.com/ads/summer-main.jpg',
        mimeType: 'image/jpeg',
        width: 1200, height: 628, fileSize: 220000,
        altText: 'Summer sale - lifestyle',
      },
      {
        url: 'https://cdn.example.com/ads/summer-products.jpg',
        mimeType: 'image/jpeg',
        width: 1200, height: 628, fileSize: 195000,
        altText: 'Summer sale - products',
      },
      {
        url: 'https://cdn.example.com/ads/summer-beach.jpg',
        mimeType: 'image/jpeg',
        width: 1200, height: 628, fileSize: 280000,
        altText: 'Summer sale - beach theme',
      },
    ],
    ctaVariants: [
      { type: 'shop_now' },
      { type: 'get_offer' },
      { type: 'learn_more' },
    ],
  },
  aspectRatios: ['1.91:1'],
});

// Create an ad using the DCO creative
const dcoAd = await adService.createAd({
  adGroupId: adGroup.id,
  name: 'Summer Sale - DCO Ad',
  creativeId: dcoCreative.id,
  destinationUrl: 'https://shop.example.com/summer-sale',
  utmParams: {
    source: '{{platform}}', // Dynamic UTM — resolved per-platform
    medium: 'paid',
    campaign: 'summer_sale_2026',
    content: 'dco',
  },
  callToAction: { type: 'shop_now' }, // Default CTA; DCO may override
});

// After campaign runs, check DCO performance
const dcoInsights = await creativeManager.getDCOInsights(dcoCreative.id, {
  dateRange: { start: '2026-06-01', end: '2026-06-15' },
});

console.log('DCO Insights:');
console.log(`Total combinations tested: ${dcoInsights.combinationsTested}`);
console.log('\nTop 3 headline + description combinations:');
for (const combo of dcoInsights.topCombinations.slice(0, 3)) {
  console.log(`  "${combo.headline}" + "${combo.description}"`);
  console.log(`    CTR: ${(combo.ctr * 100).toFixed(2)}% | Conv Rate: ${(combo.conversionRate * 100).toFixed(2)}% | ROAS: ${combo.roas.toFixed(2)}x`);
}

console.log('\nBest performing media:');
for (const media of dcoInsights.mediaRanking) {
  console.log(`  ${media.altText}: CTR ${(media.ctr * 100).toFixed(2)}%, ROAS ${media.roas.toFixed(2)}x`);
}
```

---

## Error Codes

All errors follow the MCV.ONE error format with the `ADS_` prefix.

| Code | HTTP | Message | Description |
|---|---|---|---|
| `ADS_CAMPAIGN_NOT_FOUND` | 404 | Campaign not found | No campaign exists with the given ID for this tenant |
| `ADS_CAMPAIGN_INVALID_TRANSITION` | 400 | Invalid campaign status transition | Attempted an invalid state transition (e.g., `completed` → `active`) |
| `ADS_CAMPAIGN_NOT_READY` | 400 | Campaign not ready for activation | Missing required components (budget, ads, targeting) |
| `ADS_AD_GROUP_NOT_FOUND` | 404 | Ad group not found | No ad group exists with the given ID |
| `ADS_AD_NOT_FOUND` | 404 | Ad not found | No ad exists with the given ID |
| `ADS_CREATIVE_NOT_FOUND` | 404 | Creative not found | No creative exists with the given ID |
| `ADS_CREATIVE_INVALID_FORMAT` | 400 | Invalid creative format | Media file format not supported or dimensions invalid |
| `ADS_CREATIVE_TOO_LARGE` | 400 | Creative file too large | Media file exceeds platform size limits |
| `ADS_BUDGET_EXCEEDED` | 400 | Budget limit exceeded | Operation would exceed the campaign or tenant budget |
| `ADS_BUDGET_NOT_ALLOCATED` | 400 | Budget not allocated | Campaign has no budget configuration |
| `ADS_BUDGET_INSUFFICIENT` | 400 | Insufficient budget remaining | Not enough remaining budget for the requested operation |
| `ADS_BID_INVALID` | 400 | Invalid bid configuration | Bid values are outside platform-accepted ranges |
| `ADS_BID_EXCEEDS_BUDGET` | 400 | Bid exceeds daily budget | Maximum bid is higher than the daily budget cap |
| `ADS_AUDIENCE_TOO_SMALL` | 400 | Audience too small | Target audience size is below platform minimum |
| `ADS_AUDIENCE_SYNC_FAILED` | 500 | Audience sync failed | Failed to push audience to ad platform |
| `ADS_PLATFORM_NOT_CONFIGURED` | 400 | Platform not configured | No credentials configured for the requested platform |
| `ADS_PLATFORM_AUTH_EXPIRED` | 401 | Platform authentication expired | OAuth token expired; re-authentication required |
| `ADS_PLATFORM_AUTH_FAILED` | 401 | Platform authentication failed | Invalid or revoked credentials |
| `ADS_PLATFORM_RATE_LIMITED` | 429 | Platform rate limit exceeded | Too many requests to the ad platform API |
| `ADS_PLATFORM_API_ERROR` | 502 | Platform API error | The ad platform returned an unexpected error |
| `ADS_PLATFORM_UNAVAILABLE` | 503 | Platform temporarily unavailable | The ad platform is experiencing an outage |
| `ADS_SYNC_CONFLICT` | 409 | Sync conflict detected | Local and platform states diverged; manual resolution needed |
| `ADS_SYNC_IN_PROGRESS` | 409 | Sync already in progress | Another sync operation is running for this entity |
| `ADS_COMPLIANCE_FAILED` | 400 | Compliance check failed | Ad content violates platform or internal policies |
| `ADS_APPROVAL_REQUIRED` | 403 | Approval required | Campaign requires approval before activation |
| `ADS_APPROVAL_REJECTED` | 403 | Campaign approval rejected | Campaign was rejected during compliance review |
| `ADS_PLATFORM_AD_REJECTED` | 400 | Ad rejected by platform | The ad platform rejected the ad during review |
| `ADS_DUPLICATE_CAMPAIGN` | 409 | Duplicate campaign name | A campaign with this name already exists |
| `ADS_INVALID_DATE_RANGE` | 400 | Invalid date range | Start date is after end date, or dates are in the past |
| `ADS_TENANT_BUDGET_CAP` | 400 | Tenant budget cap reached | Total ad spend across all campaigns has hit the tenant cap |
| `ADS_UTM_INVALID` | 400 | Invalid UTM parameters | UTM source, medium, or campaign contains invalid characters |
| `ADS_PIXEL_NOT_FOUND` | 404 | Tracking pixel not found | Referenced retargeting pixel does not exist |

### Error Response Format

```typescript
{
  "error": {
    "code": "ADS_BUDGET_EXCEEDED",
    "message": "Budget limit exceeded",
    "details": {
      "campaignId": "a1b2c3d4-...",
      "currentSpendCents": 480000,
      "budgetLimitCents": 500000,
      "requestedSpendCents": 30000,
      "shortfallCents": 10000
    },
    "suggestion": "Increase the campaign budget or pause lower-performing ad groups to redistribute spend."
  }
}
```

---

## Security

### Authentication & Authorization

All advertising operations require authenticated tenant context. Permissions are enforced at the tRPC router layer using middleware:

```typescript
// Permission model
const ADS_PERMISSIONS = {
  // Campaign permissions
  'ads.campaigns.read':    'View campaigns and their configuration',
  'ads.campaigns.create':  'Create new campaigns',
  'ads.campaigns.update':  'Modify existing campaigns',
  'ads.campaigns.delete':  'Delete/archive campaigns',
  'ads.campaigns.activate': 'Activate campaigns (trigger spend)',

  // Budget permissions (high-privilege)
  'ads.budgets.read':      'View budget allocations and spend',
  'ads.budgets.manage':    'Create, modify, and reallocate budgets',
  'ads.budgets.override':  'Override budget caps (admin only)',

  // Creative permissions
  'ads.creatives.read':    'View ad creatives',
  'ads.creatives.manage':  'Create, edit, and delete creatives',

  // Audience permissions
  'ads.audiences.read':    'View audience targeting',
  'ads.audiences.manage':  'Create and modify audiences',
  'ads.audiences.sync':    'Sync audiences to platforms',

  // Platform permissions (high-privilege)
  'ads.platforms.read':    'View platform configurations',
  'ads.platforms.manage':  'Configure platform credentials',

  // Reporting
  'ads.reports.read':      'View performance reports',
  'ads.reports.export':    'Export and schedule reports',

  // Compliance
  'ads.compliance.review': 'Review and approve/reject campaigns',
  'ads.compliance.bypass': 'Bypass compliance checks (super-admin)',

  // Admin
  'ads.admin':             'Full administrative access',
} as const;
```

### Multi-Tenant Isolation

- **Row-Level Security (RLS):** Every table enforces `tenant_id` matching via Supabase RLS policies. No cross-tenant data access is possible at the database level.
- **Service-Level Checks:** All service methods accept `tenantId` from the authenticated context and pass it through to queries. Even if RLS were bypassed, service-layer checks prevent cross-tenant operations.
- **Platform Credentials:** OAuth tokens and API keys are encrypted at rest using AES-256 via `pgcrypto`. Decryption occurs only in-memory within the adapter layer. Tokens are never logged or included in error responses.

### Credential Security

```typescript
// Platform credentials are encrypted before storage
interface EncryptedPlatformConfig {
  // These are stored encrypted (pgcrypto aes-256)
  accessTokenEncrypted: string;
  refreshTokenEncrypted: string;

  // Decryption happens only in the adapter connection flow
  // SELECT pgp_sym_decrypt(access_token_encrypted::bytea, $key) ...
}

// Token refresh is handled automatically
// Refresh tokens are rotated on each refresh (where supported)
// Failed refreshes trigger re-authentication notifications
```

### Budget Safety

- **Atomic Budget Operations:** All spend mutations use database transactions with `SELECT ... FOR UPDATE` to prevent race conditions.
- **Double-Check Pattern:** Budget availability is checked both before and after platform API calls. If a platform call succeeds but budget was concurrently exhausted, a compensating action (platform pause) is triggered.
- **Audit Trail:** Every budget modification is logged with the actor, reason, previous value, and new value.

### Data Handling

- **PII in Audiences:** Customer data sent to ad platforms (email, phone) is hashed (SHA-256) before upload per platform requirements. Raw PII is never stored in the ads module.
- **Creative Content:** Ad copy and images are subject to content policy scanning before upload. Sensitive categories (alcohol, gambling, pharmaceuticals) trigger additional approval workflows.
- **Performance Data:** Aggregated metrics only; no individual user-level tracking data is stored in this module. User-level attribution is handled by `@mcv/growth/attribution`.

### API Rate Limiting

```typescript
// Per-platform rate limits (enforced by token bucket)
const PLATFORM_RATE_LIMITS: Record<AdPlatform, RateLimitConfig> = {
  google: { requestsPerSecond: 10, burstSize: 50, dailyCap: 15000 },
  meta: { requestsPerSecond: 200, burstSize: 500, dailyCap: null },
  tiktok: { requestsPerSecond: 10, burstSize: 30, dailyCap: 10000 },
  linkedin: { requestsPerSecond: 5, burstSize: 20, dailyCap: 5000 },
  twitter: { requestsPerSecond: 10, burstSize: 30, dailyCap: null },
};
```

---

## Environment Variables

| Variable | Required | Default | Description |
|---|---|---|---|
| `ADS_ENCRYPTION_KEY` | ✅ | — | AES-256 key for encrypting platform credentials at rest |
| `ADS_SYNC_INTERVAL_MS` | ❌ | `300000` | Platform sync interval in milliseconds (default: 5 minutes) |
| `ADS_SYNC_MODE` | ❌ | `near-real-time` | Sync mode: `real-time`, `near-real-time`, `periodic`, `manual` |
| `ADS_BUDGET_REFRESH_INTERVAL_MS` | ❌ | `60000` | How often to refresh spend data from platforms (default: 1 minute) |
| `ADS_BUDGET_ANOMALY_THRESHOLD` | ❌ | `2.0` | Standard deviations for spend anomaly detection |
| `ADS_COMPLIANCE_AUTO_APPROVE` | ❌ | `false` | If `true`, auto-approve campaigns that pass all policy checks |
| `ADS_MAX_CAMPAIGNS_PER_TENANT` | ❌ | `500` | Maximum active campaigns per tenant |
| `ADS_MAX_AD_GROUPS_PER_CAMPAIGN` | ❌ | `100` | Maximum ad groups per campaign |
| `ADS_MAX_ADS_PER_AD_GROUP` | ❌ | `50` | Maximum ads per ad group |
| `ADS_PERFORMANCE_RETENTION_DAYS` | ❌ | `730` | How long to retain hourly performance data (default: 2 years) |
| `ADS_DAILY_REPORT_HOUR` | ❌ | `8` | Hour (UTC) to send daily performance reports |
| `GOOGLE_ADS_DEVELOPER_TOKEN` | ❌* | — | Google Ads API developer token (*required if Google Ads enabled) |
| `GOOGLE_ADS_CLIENT_ID` | ❌* | — | Google OAuth client ID |
| `GOOGLE_ADS_CLIENT_SECRET` | ❌* | — | Google OAuth client secret |
| `GOOGLE_ADS_LOGIN_CUSTOMER_ID` | ❌* | — | Google Ads MCC (manager) account ID |
| `META_ADS_APP_ID` | ❌* | — | Meta (Facebook) App ID (*required if Meta Ads enabled) |
| `META_ADS_APP_SECRET` | ❌* | — | Meta App Secret |
| `META_ADS_API_VERSION` | ❌ | `v19.0` | Meta Marketing API version |
| `TIKTOK_ADS_APP_ID` | ❌* | — | TikTok Marketing API App ID |
| `TIKTOK_ADS_APP_SECRET` | ❌* | — | TikTok Marketing API App Secret |
| `LINKEDIN_ADS_CLIENT_ID` | ❌* | — | LinkedIn Marketing API client ID |
| `LINKEDIN_ADS_CLIENT_SECRET` | ❌* | — | LinkedIn Marketing API client secret |
| `TWITTER_ADS_API_KEY` | ❌* | — | Twitter/X Ads API key |
| `TWITTER_ADS_API_SECRET` | ❌* | — | Twitter/X Ads API secret |
| `TWITTER_ADS_BEARER_TOKEN` | ❌* | — | Twitter/X Ads bearer token |

> **Note:** Platform-specific credentials marked `❌*` are required only if that platform is enabled for the tenant. The module operates with any subset of platforms configured.

---

## Dependencies

### Internal Dependencies

| Package | Purpose |
|---|---|
| `@mcv/auth` | Tenant context, user authentication, permission enforcement |
| `@mcv/db` | Supabase client, Drizzle ORM configuration, RLS helpers |
| `@mcv/trpc` | tRPC router factory, middleware, error handling |
| `@mcv/notifications` | Budget alerts, approval notifications, report delivery |
| `@mcv/growth/cdp` | CDP segment access for custom audience sync |
| `@mcv/growth/attribution` | Attribution data for ROAS calculation and conversion tracking |
| `@mcv/growth/analytics` | Unified analytics pipeline for cross-module dashboards |
| `@mcv/growth/campaigns` | Parent marketing campaign coordination |
| `@mcv/content/media` | Media asset management for ad creatives |
| `@mcv/billing` | Ad spend tracking and tenant billing reconciliation |
| `@mcv/jobs` | Background job scheduling for sync, reports, and budget refresh |
| `@mcv/cache` | Redis caching for platform rate limiters and frequently-read config |
| `@mcv/crypto` | Encryption utilities for credential storage |
| `@mcv/logging` | Structured logging with tenant context |

### External Dependencies

| Package | Version | Purpose |
|---|---|---|
| `google-ads-api` | `^14.0.0` | Google Ads API v16 client |
| `facebook-nodejs-business-sdk` | `^19.0.0` | Meta Marketing API client |
| `tiktok-business-api` | `^1.3.0` | TikTok Marketing API client |
| `linkedin-api-client` | `^2.0.0` | LinkedIn Marketing API client |
| `twitter-api-v2` | `^1.17.0` | Twitter/X API v2 client (including Ads) |
| `drizzle-orm` | `^0.34.0` | SQL query builder and ORM |
| `zod` | `^3.23.0` | Runtime schema validation |
| `@trpc/server` | `^11.0.0` | tRPC server framework |
| `bullmq` | `^5.0.0` | Job queue for background processing (sync, reports) |
| `ioredis` | `^5.4.0` | Redis client for rate limiting and caching |
| `date-fns` | `^3.6.0` | Date manipulation for scheduling, reporting |
| `decimal.js` | `^10.4.0` | Precise financial calculations (budget, bids, ROAS) |
| `p-queue` | `^8.0.0` | Concurrency-limited promise queue for platform API calls |
| `p-retry` | `^6.0.0` | Retry logic with exponential backoff for platform calls |

---

## Testing

### Test Structure

```
src/growth/ads/
├── __tests__/
│   ├── unit/
│   │   ├── campaign-manager.test.ts
│   │   ├── budget-manager.test.ts
│   │   ├── bid-manager.test.ts
│   │   ├── audience-manager.test.ts
│   │   ├── creative-manager.test.ts
│   │   ├── compliance-checker.test.ts
│   │   ├── performance-tracker.test.ts
│   │   ├── platform-sync-engine.test.ts
│   │   └── utils/
│   │       ├── calculate-roas.test.ts
│   │       ├── calculate-cpa.test.ts
│   │       ├── calculate-ctr.test.ts
│   │       ├── budget-pacing.test.ts
│   │       ├── utm-params.test.ts
│   │       └── policy-validator.test.ts
│   ├── integration/
│   │   ├── campaign-lifecycle.test.ts
│   │   ├── budget-enforcement.test.ts
│   │   ├── audience-sync.test.ts
│   │   ├── platform-sync.test.ts
│   │   ├── cross-platform-reporting.test.ts
│   │   ├── approval-workflow.test.ts
│   │   └── ab-testing.test.ts
│   ├── adapters/
│   │   ├── google-ads-adapter.test.ts
│   │   ├── meta-ads-adapter.test.ts
│   │   ├── tiktok-ads-adapter.test.ts
│   │   ├── linkedin-ads-adapter.test.ts
│   │   └── twitter-ads-adapter.test.ts
│   └── e2e/
│       ├── campaign-create-to-activate.test.ts
│       ├── budget-alert-flow.test.ts
│       ├── creative-upload-to-review.test.ts
│       └── report-generation.test.ts
```

### Unit Test Example — Budget Manager

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BudgetManager } from '../budget-manager';
import { createMockDb, createMockCache } from '@mcv/testing';

describe('BudgetManager', () => {
  let budgetManager: BudgetManager;
  let mockDb: ReturnType<typeof createMockDb>;
  let mockCache: ReturnType<typeof createMockCache>;

  beforeEach(() => {
    mockDb = createMockDb();
    mockCache = createMockCache();
    budgetManager = new BudgetManager(mockDb, mockCache);
  });

  describe('allocateBudget', () => {
    it('should allocate budget and compute platform splits', async () => {
      const result = await budgetManager.allocateBudget({
        campaignId: 'camp-1',
        tenantId: 'tenant-1',
        type: 'lifetime',
        amountCents: 500000,
        currency: 'USD',
        pacing: 'even',
        platformAllocations: [
          { platform: 'google', type: 'percentage', value: 60 },
          { platform: 'meta', type: 'percentage', value: 40 },
        ],
      });

      expect(result.amountCents).toBe(500000);
      expect(result.remainingCents).toBe(500000);
      expect(result.spentCents).toBe(0);
      expect(result.platformAllocations[0].allocatedCents).toBe(300000); // 60% of $5000
      expect(result.platformAllocations[1].allocatedCents).toBe(200000); // 40% of $5000
    });

    it('should reject allocation exceeding tenant budget cap', async () => {
      mockDb.query.mockResolvedValueOnce({
        totalAllocated: 9500000, // $95,000 already allocated
        tenantCap: 10000000,    // $100,000 tenant cap
      });

      await expect(
        budgetManager.allocateBudget({
          campaignId: 'camp-2',
          tenantId: 'tenant-1',
          type: 'lifetime',
          amountCents: 600000, // $6,000 would exceed cap
          currency: 'USD',
          pacing: 'even',
          platformAllocations: [],
        })
      ).rejects.toThrow('ADS_TENANT_BUDGET_CAP');
    });

    it('should enforce platform allocation totals equal 100%', async () => {
      await expect(
        budgetManager.allocateBudget({
          campaignId: 'camp-3',
          tenantId: 'tenant-1',
          type: 'lifetime',
          amountCents: 500000,
          currency: 'USD',
          pacing: 'even',
          platformAllocations: [
            { platform: 'google', type: 'percentage', value: 60 },
            { platform: 'meta', type: 'percentage', value: 30 },
            // Missing 10%
          ],
        })
      ).rejects.toThrow('Platform allocation percentages must sum to 100');
    });
  });

  describe('checkBudgetAlerts', () => {
    it('should trigger alert when threshold is crossed', async () => {
      const notifySpy = vi.fn();
      budgetManager.onAlert('camp-1', notifySpy);

      mockDb.query.mockResolvedValueOnce({
        amountCents: 500000,
        spentCents: 380000, // 76% utilized
        alertThresholds: [50, 75, 90, 100],
        triggeredAlerts: [
          { threshold: 50, triggeredAt: '2026-06-05T00:00:00Z', notificationSent: true },
        ],
      });

      await budgetManager.checkBudgetAlerts('camp-1');

      // 75% threshold should be triggered (76% > 75%)
      expect(notifySpy).toHaveBeenCalledWith(
        expect.objectContaining({
          threshold: 75,
          spentCents: 380000,
        })
      );

      // 90% should NOT be triggered yet
      expect(notifySpy).not.toHaveBeenCalledWith(
        expect.objectContaining({ threshold: 90 })
      );
    });

    it('should auto-pause campaign when budget exhausted', async () => {
      const pauseSpy = vi.fn();

      mockDb.query.mockResolvedValueOnce({
        amountCents: 500000,
        spentCents: 500000, // 100% utilized
        alertThresholds: [100],
        triggeredAlerts: [],
        autoPauseOnExhaustion: true,
      });

      budgetManager.setCampaignPauser(pauseSpy);
      await budgetManager.checkBudgetAlerts('camp-1');

      expect(pauseSpy).toHaveBeenCalledWith('camp-1', 'Budget exhausted');
    });
  });

  describe('estimatePacing', () => {
    it('should detect over-pacing and return warning', async () => {
      const pacing = await budgetManager.estimatePacing({
        amountCents: 500000,
        spentCents: 300000, // 60% spent
        startDate: '2026-06-01',
        endDate: '2026-06-30',
        currentDate: '2026-06-10', // 33% of time elapsed
      });

      expect(pacing.status).toBe('over_pacing');
      expect(pacing.projectedTotalSpendCents).toBeGreaterThan(500000);
      expect(pacing.projectedExhaustionDate).toBeDefined();
      expect(pacing.recommendation).toContain('reduce');
    });

    it('should detect under-pacing', async () => {
      const pacing = await budgetManager.estimatePacing({
        amountCents: 500000,
        spentCents: 50000, // 10% spent
        startDate: '2026-06-01',
        endDate: '2026-06-30',
        currentDate: '2026-06-15', // 50% of time elapsed
      });

      expect(pacing.status).toBe('under_pacing');
      expect(pacing.projectedTotalSpendCents).toBeLessThan(500000);
      expect(pacing.recommendation).toContain('increase');
    });
  });
});
```

### Integration Test Example — Campaign Lifecycle

```typescript
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createTestContext, seedTestTenant } from '@mcv/testing';
import { AdService, CampaignManager, BudgetManager, ComplianceChecker } from '@mcv/growth/ads';

describe('Campaign Lifecycle (Integration)', () => {
  let ctx: TestContext;
  let adService: AdService;
  let campaignManager: CampaignManager;
  let budgetManager: BudgetManager;

  beforeAll(async () => {
    ctx = await createTestContext();
    await seedTestTenant(ctx);
    adService = ctx.resolve(AdService);
    campaignManager = ctx.resolve(CampaignManager);
    budgetManager = ctx.resolve(BudgetManager);
  });

  afterAll(async () => {
    await ctx.cleanup();
  });

  it('should complete full campaign lifecycle: draft → active → paused → completed → archived', async () => {
    // 1. Create campaign (starts in draft)
    const campaign = await adService.createCampaign({
      name: 'Integration Test Campaign',
      objective: 'conversions',
      platforms: ['google'],
      startDate: new Date(Date.now() + 86400000).toISOString(), // Tomorrow
      budget: {
        type: 'lifetime',
        amountCents: 100000,
        currency: 'USD',
        pacing: 'even',
        platformAllocations: [
          { platform: 'google', type: 'percentage', value: 100 },
        ],
      },
      bidStrategy: {
        type: 'target_cpa',
        targetValueCents: 1000,
      },
    });
    expect(campaign.status).toBe('draft');

    // 2. Add required components (ad group, ad, creative, targeting)
    const creative = await adService.createCreative({
      name: 'Test Creative',
      type: 'image',
      media: [{ url: 'https://test.example.com/image.jpg', mimeType: 'image/jpeg', width: 1200, height: 628, fileSize: 100000, altText: 'Test' }],
      headline: 'Test Headline',
    });

    const adGroup = await adService.createAdGroup({
      campaignId: campaign.id,
      name: 'Test Ad Group',
      targeting: {
        geo: { countries: ['US'], regions: [], cities: [], radiusTargets: [], excludedLocations: [] },
        demographics: { ageMin: 18, ageMax: 65, genders: ['all'], languages: ['en'] },
        interests: [], behaviors: [], customAudiences: [], lookalikeAudiences: [],
        retargeting: [], keywords: [], exclusions: [],
      },
      placements: [{ platform: 'google', placements: ['search'], devices: ['mobile', 'desktop'] }],
    });

    await adService.createAd({
      adGroupId: adGroup.id,
      name: 'Test Ad',
      creativeId: creative.id,
      destinationUrl: 'https://test.example.com',
      utmParams: { source: 'google', medium: 'cpc', campaign: 'test' },
      callToAction: { type: 'learn_more' },
    });

    // 3. Activate (transitions draft → active)
    const activated = await campaignManager.activate(campaign.id);
    expect(activated.status).toBe('active');
    expect(activated.syncStatus).toBe('pending');

    // 4. Pause (transitions active → paused)
    const paused = await campaignManager.pause(campaign.id);
    expect(paused.status).toBe('paused');

    // 5. Resume (transitions paused → active)
    const resumed = await campaignManager.resume(campaign.id);
    expect(resumed.status).toBe('active');

    // 6. Complete (transitions active → completed)
    const completed = await campaignManager.complete(campaign.id);
    expect(completed.status).toBe('completed');

    // 7. Archive (transitions completed → archived)
    const archived = await campaignManager.archive(campaign.id);
    expect(archived.status).toBe('archived');
  });

  it('should reject invalid state transitions', async () => {
    const campaign = await adService.createCampaign({
      name: 'Invalid Transition Test',
      objective: 'traffic',
      platforms: ['meta'],
      startDate: new Date(Date.now() + 86400000).toISOString(),
      budget: { type: 'daily', amountCents: 5000, currency: 'USD', pacing: 'even', platformAllocations: [{ platform: 'meta', type: 'percentage', value: 100 }] },
      bidStrategy: { type: 'max_clicks' },
    });

    // Cannot activate without ads
    await expect(campaignManager.activate(campaign.id))
      .rejects.toThrow('ADS_CAMPAIGN_NOT_READY');

    // Cannot complete a draft
    await expect(campaignManager.complete(campaign.id))
      .rejects.toThrow('ADS_CAMPAIGN_INVALID_TRANSITION');
  });
});
```

### Adapter Test Example — Mock Platform

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GoogleAdsAdapter } from '../adapters/google-ads-adapter';
import { createMockGoogleAdsClient } from './__mocks__/google-ads-client';

describe('GoogleAdsAdapter', () => {
  let adapter: GoogleAdsAdapter;
  let mockClient: ReturnType<typeof createMockGoogleAdsClient>;

  beforeEach(async () => {
    mockClient = createMockGoogleAdsClient();
    adapter = new GoogleAdsAdapter();
    await adapter.connect({
      platform: 'google',
      accessToken: 'test-token',
      refreshToken: 'test-refresh',
      accountId: '123-456-7890',
    });
    // Inject mock client
    (adapter as any).client = mockClient;
  });

  it('should create a campaign and return platform ID', async () => {
    mockClient.campaigns.create.mockResolvedValue({
      resourceName: 'customers/1234567890/campaigns/9876543210',
    });

    const result = await adapter.createCampaign({
      id: 'local-camp-1',
      name: 'Test Campaign',
      objective: 'conversions',
      status: 'draft',
      platforms: ['google'],
      startDate: '2026-06-01T00:00:00Z',
      budget: { type: 'daily', amountCents: 5000, currency: 'USD' },
      bidStrategy: { type: 'target_cpa', targetValueCents: 1000 },
    } as any);

    expect(result.platformId).toBe('9876543210');
    expect(mockClient.campaigns.create).toHaveBeenCalledTimes(1);
  });

  it('should handle rate limiting with retry', async () => {
    mockClient.campaigns.list
      .mockRejectedValueOnce(new Error('RATE_LIMIT_EXCEEDED'))
      .mockResolvedValueOnce([{ id: '1', name: 'Campaign 1' }]);

    const campaigns = await adapter.listCampaigns();
    expect(campaigns).toHaveLength(1);
    expect(mockClient.campaigns.list).toHaveBeenCalledTimes(2);
  });

  it('should map Google objectives to MCV objectives', () => {
    const capabilities = adapter.getCapabilities();
    expect(capabilities.supportedObjectives).toContain('conversions');
    expect(capabilities.supportedObjectives).toContain('awareness');
    expect(capabilities.supportedObjectives).toContain('traffic');
    expect(capabilities.supportedBidStrategies).toContain('target_cpa');
    expect(capabilities.supportedBidStrategies).toContain('target_roas');
    expect(capabilities.customExtensions).toContain('performance_max');
    expect(capabilities.custom