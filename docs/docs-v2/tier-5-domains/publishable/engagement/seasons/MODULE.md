# @mcv/engagement/seasons

> **Seasons & Events** — Time-limited seasonal content, battle passes, and event-driven engagement campaigns for the MCV.ONE platform.

```
Module:       @mcv/engagement/seasons
Layer:        Tier 5 — Domain
Domain:       Engagement
Stability:    Production
Since:        0.9.0
Maintainers:  MCV Platform Team
```

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

The `@mcv/engagement/seasons` module provides a complete framework for managing time-limited seasonal content cycles, battle/season passes, in-season events, and community-driven goals across MCV.ONE ventures. It is the backbone of recurring engagement campaigns — driving retention, monetization, and community participation through structured, time-boxed content delivery.

### What This Module Does

1. **Season Lifecycle Management** — Defines, schedules, activates, transitions, and archives seasons with named themes, branding assets, and configurable durations.
2. **Battle Pass / Season Pass** — Implements a dual-track (free + premium) tier-based progression system with XP-driven advancement, per-tier rewards, and optional skip-tier purchases.
3. **Seasonal Content Gating** — Gates quests, achievements, rewards, cosmetics, and other content items to specific seasons, enabling content rotation and exclusivity windows.
4. **Season XP Engine** — Maintains a season-specific XP pool separate from lifetime XP, with daily/weekly caps, XP boost multipliers, and late-joiner catch-up mechanics.
5. **Event System** — Schedules and orchestrates in-season events (double XP weekends, flash challenges, limited drops) with precise start/end times and automated activation.
6. **Community Goals** — Tracks server-wide or platform-wide collective targets with real-time progress bars, tiered community rewards, and contribution leaderboards.
7. **Season Rewards Pipeline** — Distributes tier rewards, milestone rewards, completion bonuses, and ranking rewards through a unified reward fulfillment pipeline.
8. **Season Analytics** — Tracks pass purchase rates, tier completion distributions, engagement curves, revenue-per-season, and player retention correlations.
9. **Season Transitions** — Manages grace periods, unclaimed reward policies, XP/currency carryover rules, and historical archive access for past seasons.
10. **Cross-Venture Seasons** — Enables platform-wide meta-seasons with venture-specific content tracks and a unified season pass that spans multiple ventures.

### Why This Exists

Seasonal content is the proven engagement model for modern digital platforms — from gaming (Fortnite, Apex Legends) to streaming (Spotify Wrapped) to fitness apps (challenges). MCV.ONE ventures need a battle-tested, configurable seasonal framework that:

- **Drives recurring engagement** through fresh, time-limited content drops
- **Monetizes predictably** via premium pass purchases and skip-tier transactions
- **Creates urgency** with FOMO-driven exclusivity windows and countdown timers
- **Builds community** through shared goals and collective progress
- **Provides data** on engagement patterns, monetization efficiency, and content effectiveness
- **Scales across ventures** with a unified seasonal infrastructure and cross-venture passes

### Design Principles

| Principle | Implementation |
|---|---|
| **Time-boxed by default** | Every season, event, and content item has explicit start/end timestamps |
| **Dual-track fairness** | Free track always provides meaningful rewards; premium enhances, never gates core gameplay |
| **Catch-up friendly** | Late joiners get XP boost multipliers and accelerated progression |
| **Graceful transitions** | Grace periods, reward claiming windows, and carryover policies prevent player frustration |
| **Venture-scoped, platform-aware** | Each venture runs its own seasons but can participate in platform-wide meta-seasons |
| **Event-driven architecture** | All state changes emit domain events via Redpanda for downstream consumption |
| **Analytics-first** | Every interaction is instrumented for season performance analysis |

---

## Exports

### Services

| Export | Type | Description |
|---|---|---|
| `SeasonService` | Class | Core service for season CRUD, lifecycle management, and queries |
| `SeasonPassService` | Class | Battle pass management — purchases, progression, reward claims |
| `SeasonXPService` | Class | Season XP accrual, caps, boosts, and catch-up mechanics |
| `SeasonEventService` | Class | In-season event scheduling, activation, and lifecycle |
| `CommunityGoalService` | Class | Community goal creation, contribution tracking, and reward distribution |
| `SeasonRewardService` | Class | Reward pipeline — tier rewards, milestones, completions, rankings |
| `SeasonAnalyticsService` | Class | Season performance metrics, reports, and data exports |
| `SeasonTransitionService` | Class | Season end-of-life, grace periods, archival, and carryover |
| `SeasonSchedulerService` | Class | Cron-driven automation for season/event start/end triggers |
| `CrossVentureSeasonService` | Class | Platform-wide meta-season coordination and unified pass management |

### Router

| Export | Type | Description |
|---|---|---|
| `seasonRouter` | tRPC Router | Complete tRPC router for all season operations |
| `seasonAdminRouter` | tRPC Router | Admin-only router for season management and analytics |
| `seasonPublicRouter` | tRPC Router | Unauthenticated router for public season metadata |

### Schemas (Drizzle)

| Export | Type | Description |
|---|---|---|
| `seasons` | Table | Season definitions and metadata |
| `seasonPasses` | Table | Pass type definitions (free/premium) per season |
| `seasonTiers` | Table | Tier definitions with XP thresholds and reward slots |
| `seasonTierRewards` | Table | Reward items assigned to specific tiers and tracks |
| `userSeasonProgress` | Table | Per-user season state (current tier, XP, claimed rewards) |
| `seasonEvents` | Table | Scheduled in-season events |
| `communityGoals` | Table | Community goal definitions and progress |
| `communityGoalContributions` | Table | Individual user contributions to community goals |
| `seasonPurchases` | Table | Season pass and skip-tier purchase records |
| `seasonArchives` | Table | Archived season data for historical access |

### Types

| Export | Type | Description |
|---|---|---|
| `Season` | Interface | Complete season definition |
| `SeasonPass` | Interface | Pass configuration (free/premium) |
| `SeasonTier` | Interface | Individual tier within a pass |
| `SeasonTierReward` | Interface | Reward item within a tier |
| `UserSeasonProgress` | Interface | User's progression state within a season |
| `SeasonEvent` | Interface | In-season event definition |
| `CommunityGoal` | Interface | Community goal definition |
| `CommunityGoalContribution` | Interface | Individual contribution record |
| `SeasonReward` | Interface | Generic reward envelope |
| `SeasonAnalytics` | Interface | Season performance metrics |
| `SeasonTransition` | Interface | Transition configuration between seasons |
| `SeasonConfig` | Interface | Runtime configuration for the seasons module |
| `SeasonStatus` | Enum | `draft` · `scheduled` · `active` · `ending` · `ended` · `archived` |
| `PassTrack` | Enum | `free` · `premium` |
| `EventType` | Enum | `xp_boost` · `flash_challenge` · `limited_drop` · `community_goal` · `special` |
| `RewardType` | Enum | `currency` · `cosmetic` · `item` · `title` · `badge` · `lootbox` · `xp_boost` |
| `GoalScope` | Enum | `venture` · `server` · `platform` |

### Utilities

| Export | Type | Description |
|---|---|---|
| `calculateTierForXP` | Function | Resolves the current tier given total season XP |
| `calculateXPForTier` | Function | Returns the cumulative XP required to reach a given tier |
| `calculateCatchUpMultiplier` | Function | Computes XP boost for late-joining users |
| `calculateSeasonProgress` | Function | Returns percentage completion of a season's timeline |
| `isSeasonActive` | Function | Checks if a season is currently in its active window |
| `isInGracePeriod` | Function | Checks if a season is in its post-end grace period |
| `formatSeasonDuration` | Function | Human-readable season duration string |
| `validateSeasonConfig` | Function | Validates a season configuration object |
| `mergeSeasonThemes` | Function | Merges venture-specific themes with platform season themes |

### Events (Redpanda Topics)

| Export | Topic | Description |
|---|---|---|
| `SEASON_CREATED` | `engagement.seasons.created` | New season defined |
| `SEASON_STARTED` | `engagement.seasons.started` | Season activated |
| `SEASON_ENDING` | `engagement.seasons.ending` | Season entering grace period |
| `SEASON_ENDED` | `engagement.seasons.ended` | Season fully concluded |
| `SEASON_ARCHIVED` | `engagement.seasons.archived` | Season moved to archive |
| `PASS_PURCHASED` | `engagement.seasons.pass.purchased` | User purchased premium pass |
| `TIER_UNLOCKED` | `engagement.seasons.tier.unlocked` | User reached a new tier |
| `TIER_REWARD_CLAIMED` | `engagement.seasons.tier.reward_claimed` | User claimed a tier reward |
| `TIER_SKIPPED` | `engagement.seasons.tier.skipped` | User purchased a tier skip |
| `XP_EARNED` | `engagement.seasons.xp.earned` | Season XP accrued |
| `XP_CAP_REACHED` | `engagement.seasons.xp.cap_reached` | User hit daily/weekly XP cap |
| `EVENT_STARTED` | `engagement.seasons.event.started` | In-season event activated |
| `EVENT_ENDED` | `engagement.seasons.event.ended` | In-season event concluded |
| `COMMUNITY_GOAL_CREATED` | `engagement.seasons.community.goal_created` | New community goal |
| `COMMUNITY_GOAL_PROGRESS` | `engagement.seasons.community.progress` | Community goal milestone hit |
| `COMMUNITY_GOAL_COMPLETED` | `engagement.seasons.community.completed` | Community goal fulfilled |
| `SEASON_REWARD_DISTRIBUTED` | `engagement.seasons.reward.distributed` | Reward batch distributed |

---

## Architecture

### System Overview

```
┌──────────────────────────────────────────────────────────────────────┐
│                        Season Lifecycle                              │
│                                                                      │
│  ┌─────────┐   ┌───────────┐   ┌────────┐   ┌────────┐   ┌───────┐ │
│  │  Draft   │──▸│ Scheduled │──▸│ Active │──▸│ Ending │──▸│ Ended │ │
│  └─────────┘   └───────────┘   └────────┘   └────────┘   └───────┘ │
│                                     │                          │     │
│                                     │                     ┌────────┐ │
│                                     │                     │Archived│ │
│                                     │                     └────────┘ │
│                                     ▼                                │
│                          ┌──────────────────┐                        │
│                          │   Active Season   │                        │
│                          │                  │                        │
│                          │  ┌────────────┐  │                        │
│                          │  │ Battle Pass│  │                        │
│                          │  │ Free Track │  │                        │
│                          │  │ Prem Track │  │                        │
│                          │  └────────────┘  │                        │
│                          │                  │                        │
│                          │  ┌────────────┐  │                        │
│                          │  │  Season XP │  │                        │
│                          │  │ Daily Caps │  │                        │
│                          │  │ Catch-up   │  │                        │
│                          │  └────────────┘  │                        │
│                          │                  │                        │
│                          │  ┌────────────┐  │                        │
│                          │  │   Events   │  │                        │
│                          │  │ 2XP / Flash│  │                        │
│                          │  │ Community  │  │                        │
│                          │  └────────────┘  │                        │
│                          └──────────────────┘                        │
└──────────────────────────────────────────────────────────────────────┘
```

### Season Lifecycle

A season progresses through a well-defined state machine:

| State | Description | Duration | Triggers |
|---|---|---|---|
| `draft` | Season is being configured; not visible to users | Indefinite | Manual creation |
| `scheduled` | Season is finalized and announced; countdown visible | Until start date | Admin publishes season |
| `active` | Season is live; users earn XP, progress tiers, events fire | Configured duration (typically 60-90 days) | Start date reached (cron) |
| `ending` | Grace period; no new XP but users can claim unclaimed rewards | Configurable (typically 7-14 days) | End date reached (cron) |
| `ended` | Season is closed; no more interactions | Until archival | Grace period expires |
| `archived` | Season data compressed and moved to archive tables | Permanent | Admin or automated archival |

**State Transition Rules:**

```typescript
const VALID_TRANSITIONS: Record<SeasonStatus, SeasonStatus[]> = {
  draft:     ['scheduled'],
  scheduled: ['active', 'draft'],      // Can revert to draft if issues found
  active:    ['ending'],
  ending:    ['ended'],
  ended:     ['archived'],
  archived:  [],                        // Terminal state
};
```

### Battle Pass Progression Model

```
         FREE TRACK                         PREMIUM TRACK
    ┌─────────────────┐                ┌─────────────────────┐
    │                 │                │                     │
    │  Tier 1: 0 XP   │                │  Tier 1: 0 XP       │
    │  🎁 100 Coins   │                │  🎁 Rare Skin       │
    │                 │                │                     │
    ├─────────────────┤                ├─────────────────────┤
    │  Tier 2: 1000 XP│                │  Tier 2: 1000 XP    │
    │  🎁 XP Boost    │                │  🎁 Epic Emote      │
    │                 │                │                     │
    ├─────────────────┤                ├─────────────────────┤
    │  Tier 3: 2500 XP│                │  Tier 3: 2500 XP    │
    │  🎁 Avatar Frame│                │  🎁 Legendary Crate │
    │                 │                │                     │
    ├─────────────────┤                ├─────────────────────┤
    │       ...       │                │        ...          │
    ├─────────────────┤                ├─────────────────────┤
    │  Tier 100:      │                │  Tier 100:          │
    │  50000 XP       │                │  50000 XP           │
    │  🎁 Season Title│                │  🎁 Mythic Skin     │
    └─────────────────┘                └─────────────────────┘

    XP Sources:
    ├── Daily Quests (capped)
    ├── Weekly Challenges
    ├── Season Missions
    ├── Community Goal Contributions
    ├── Event Bonus XP
    └── XP Boost Items (multiplier)
```

**XP Curve Design:**

The XP required per tier follows a configurable curve. The default uses a soft exponential:

```
XP(tier) = baseCost + (tier - 1) * linearIncrement + floor((tier / curveStart)^exponent * curveFactor)
```

This ensures:
- Early tiers are fast (onboarding, quick gratification)
- Mid tiers require consistent engagement
- Late tiers reward dedicated players without being punishing
- Catch-up multipliers flatten the curve for late joiners

### Data Flow Architecture

```
┌──────────────┐     ┌──────────────┐     ┌──────────────────┐
│   Client     │────▸│   tRPC API   │────▸│  SeasonService   │
│  (Web/App)   │◂────│   Router     │◂────│  + SubServices   │
└──────────────┘     └──────────────┘     └──────────────────┘
                                                   │
                           ┌───────────────────────┼───────────────────┐
                           │                       │                   │
                           ▼                       ▼                   ▼
                    ┌──────────────┐     ┌──────────────┐    ┌──────────────┐
                    │   Supabase   │     │   Redpanda   │    │    Cron      │
                    │  PostgreSQL  │     │   Events     │    │  Scheduler   │
                    │  (Drizzle)   │     │              │    │              │
                    └──────────────┘     └──────────────┘    └──────────────┘
                           │                       │                   │
                           │                       ▼                   │
                           │              ┌──────────────┐             │
                           │              │  Consumers   │             │
                           │              │  - Analytics │             │
                           │              │  - Notifs    │             │
                           │              │  - Rewards   │             │
                           │              │  - Leaderbd  │             │
                           │              └──────────────┘             │
                           │                                           │
                           └───────────────────────────────────────────┘
```

### Multi-Tenant Isolation

All season data is scoped to a `venture_id` via Supabase Row-Level Security (RLS):

```sql
-- Every season table includes venture_id
-- RLS policy ensures ventures only see their own seasons
CREATE POLICY season_venture_isolation ON seasons
  USING (venture_id = current_setting('app.current_venture_id')::uuid);
```

Cross-venture seasons use a special `platform` venture scope and a join table (`cross_venture_season_participants`) to link ventures into a shared season.

### Event System Architecture

```
┌─────────────────────────────────────────────────────┐
│                  Season Timeline                     │
│                                                     │
│  Season Start                              Season End│
│  ├──────────────────────────────────────────────────┤│
│  │                                                  ││
│  │  ┌──── Event: Double XP Weekend ────┐            ││
│  │  │ Fri 18:00 ──────────── Sun 23:59 │            ││
│  │  └──────────────────────────────────┘            ││
│  │                                                  ││
│  │         ┌── Flash Challenge ──┐                  ││
│  │         │ 24h window         │                  ││
│  │         └────────────────────┘                  ││
│  │                                                  ││
│  │  ┌──────── Community Goal ────────────────────┐  ││
│  │  │ 30-day collective target                   │  ││
│  │  │ ████████████░░░░░░░░░░░ 58% (Tier 2/5)    │  ││
│  │  └────────────────────────────────────────────┘  ││
│  │                                                  ││
│  ├──────────────────────────────────────────────────┤│
│                                                     │
│  ├── Grace Period (7 days) ──┤                      │
│                               ▼                     │
│                          Season Archived             │
└─────────────────────────────────────────────────────┘
```

---

## Core Interfaces

### Season

The root entity representing a single season instance.

```typescript
/**
 * A named, time-boxed season with theming, configuration, and lifecycle state.
 *
 * Seasons are the top-level organizational unit for time-limited content.
 * Each venture can have at most one active season at a time, plus any number
 * of scheduled/draft seasons in preparation.
 */
interface Season {
  /** Unique season identifier (UUID v7) */
  id: string;

  /** Owning venture */
  ventureId: string;

  /** Sequential season number within this venture (1, 2, 3...) */
  seasonNumber: number;

  /**
   * Year this season belongs to, for organizational purposes.
   * A venture may have multiple seasons per year.
   */
  year: number;

  /** Human-readable season name (e.g., "Crimson Eclipse", "Frostfire") */
  name: string;

  /** URL-safe slug derived from name */
  slug: string;

  /** Short tagline displayed in UI (e.g., "Darkness rises. Will you stand?") */
  tagline: string | null;

  /** Rich description with markdown support */
  description: string | null;

  /** Current lifecycle state */
  status: SeasonStatus;

  /** Theme and branding configuration */
  theme: SeasonTheme;

  /** When the season becomes active (UTC) */
  startDate: Date;

  /** When the season stops accepting new XP (UTC) */
  endDate: Date;

  /**
   * Duration in days after endDate during which users can still claim
   * unclaimed rewards. No new XP is earned during this period.
   * @default 7
   */
  gracePeriodDays: number;

  /** Total number of tiers in the battle pass */
  totalTiers: number;

  /** XP curve configuration */
  xpConfig: SeasonXPConfig;

  /** Whether this season is part of a cross-venture platform season */
  crossVentureSeasonId: string | null;

  /** Admin who created this season */
  createdBy: string;

  /** Timestamps */
  createdAt: Date;
  updatedAt: Date;

  /** Soft delete */
  deletedAt: Date | null;
}

/** Season lifecycle states */
enum SeasonStatus {
  /** Being configured; invisible to users */
  DRAFT = 'draft',
  /** Published and announced; countdown visible */
  SCHEDULED = 'scheduled',
  /** Currently live; users earn XP and progress */
  ACTIVE = 'active',
  /** Grace period; claiming only, no new XP */
  ENDING = 'ending',
  /** Fully closed */
  ENDED = 'ended',
  /** Data archived for historical reference */
  ARCHIVED = 'archived',
}

/** Branding and visual theme for a season */
interface SeasonTheme {
  /** Primary accent color (hex) */
  primaryColor: string;

  /** Secondary accent color (hex) */
  secondaryColor: string;

  /** Background gradient or color */
  backgroundColor: string;

  /** URL to season banner image */
  bannerUrl: string | null;

  /** URL to season logo/icon */
  iconUrl: string | null;

  /** URL to season card thumbnail */
  thumbnailUrl: string | null;

  /** URL to background video/animation (optional) */
  backgroundMediaUrl: string | null;

  /** Custom CSS class name for UI theming */
  cssClass: string | null;

  /** Lottie or Rive animation config for season transitions */
  animationConfig: Record<string, unknown> | null;
}

/** XP curve and cap configuration */
interface SeasonXPConfig {
  /** Base XP cost for tier 1 → tier 2 */
  baseCostPerTier: number;

  /** Linear XP increment per tier */
  linearIncrement: number;

  /** Tier at which the exponential curve kicks in */
  curveStartTier: number;

  /** Exponent for the curve (1.0 = linear, 2.0 = quadratic) */
  curveExponent: number;

  /** Multiplier for the curve component */
  curveFactor: number;

  /** Maximum XP earnable in a single day (0 = no cap) */
  dailyXPCap: number;

  /** Maximum XP earnable in a single week (0 = no cap) */
  weeklyXPCap: number;

  /**
   * Whether to enable catch-up mechanics for late joiners.
   * When enabled, users who join after the season midpoint get an
   * XP multiplier proportional to elapsed time.
   */
  catchUpEnabled: boolean;

  /**
   * Maximum catch-up multiplier (e.g., 2.0 = max 2x XP).
   * Only applies when catchUpEnabled is true.
   */
  maxCatchUpMultiplier: number;

  /** Minimum XP per tier (floor, regardless of curve) */
  minXPPerTier: number;

  /** Maximum XP per tier (ceiling, regardless of curve) */
  maxXPPerTier: number;
}
```

### SeasonPass

Defines the pass types available for a season.

```typescript
/**
 * A purchasable (or free) season pass that grants access to a
 * reward track within a season.
 *
 * Every season has exactly one free pass (auto-enrolled) and zero
 * or more premium passes (purchased).
 */
interface SeasonPass {
  /** Unique pass identifier */
  id: string;

  /** Parent season */
  seasonId: string;

  /** Owning venture */
  ventureId: string;

  /** Track type */
  track: PassTrack;

  /** Display name (e.g., "Free Pass", "Premium Pass", "Deluxe Pass") */
  name: string;

  /** Description of what this pass includes */
  description: string | null;

  /**
   * Price in the venture's primary currency (cents/minor units).
   * 0 for free track.
   */
  priceAmount: number;

  /** ISO 4217 currency code (e.g., "USD") */
  priceCurrency: string;

  /**
   * Price in platform tokens (alternative payment method).
   * null if token payment is not supported.
   */
  priceTokens: number | null;

  /** Whether this pass includes bonus starting tiers */
  bonusStartingTiers: number;

  /** Whether purchasing this pass retroactively unlocks premium rewards for already-reached tiers */
  retroactiveRewards: boolean;

  /** URL to pass promotional artwork */
  artworkUrl: string | null;

  /** Whether this pass is currently available for purchase */
  availableForPurchase: boolean;

  /** Maximum number of purchases (null = unlimited) */
  purchaseLimit: number | null;

  /** Current purchase count */
  purchaseCount: number;

  createdAt: Date;
  updatedAt: Date;
}

/** Pass track types */
enum PassTrack {
  /** Free track — all users auto-enrolled */
  FREE = 'free',
  /** Premium track — requires purchase */
  PREMIUM = 'premium',
}
```

### SeasonTier

Individual tiers within a season pass.

```typescript
/**
 * A single tier/level within a season's battle pass.
 *
 * Tiers are shared across tracks — both free and premium tracks
 * share the same tier numbers and XP thresholds. The difference
 * is in the rewards assigned to each track at each tier.
 */
interface SeasonTier {
  /** Unique tier identifier */
  id: string;

  /** Parent season */
  seasonId: string;

  /** Tier number (1-based, sequential) */
  tierNumber: number;

  /** Display name (optional, e.g., "Bronze I", "Silver III") */
  name: string | null;

  /** Cumulative XP required to reach this tier */
  requiredXP: number;

  /** XP required for just this tier (difference from previous tier) */
  tierXP: number;

  /**
   * Whether this tier is a milestone tier (special visual treatment).
   * Milestone tiers (e.g., every 10th tier) often have enhanced rewards.
   */
  isMilestone: boolean;

  /** URL to tier badge/icon */
  badgeUrl: string | null;

  /** Rewards assigned to this tier, keyed by track */
  rewards: {
    free: SeasonTierReward[];
    premium: SeasonTierReward[];
  };

  createdAt: Date;
}

/**
 * A reward item assigned to a specific tier and track.
 */
interface SeasonTierReward {
  /** Unique reward identifier */
  id: string;

  /** Parent tier */
  tierId: string;

  /** Parent season */
  seasonId: string;

  /** Which track this reward belongs to */
  track: PassTrack;

  /** Type of reward */
  rewardType: RewardType;

  /** Reference to the actual reward item (currency ID, cosmetic ID, etc.) */
  rewardRefId: string;

  /** Quantity (e.g., 100 coins, 1 skin) */
  quantity: number;

  /** Display name */
  name: string;

  /** Description */
  description: string | null;

  /** Rarity tier for visual treatment */
  rarity: RewardRarity;

  /** Preview image URL */
  previewUrl: string | null;

  /** Whether this reward is exclusive to this season (cannot be obtained later) */
  isExclusive: boolean;

  createdAt: Date;
}

/** Reward types */
enum RewardType {
  CURRENCY = 'currency',
  COSMETIC = 'cosmetic',
  ITEM = 'item',
  TITLE = 'title',
  BADGE = 'badge',
  LOOTBOX = 'lootbox',
  XP_BOOST = 'xp_boost',
  EMOTE = 'emote',
  AVATAR_FRAME = 'avatar_frame',
  BANNER = 'banner',
  CUSTOM = 'custom',
}

/** Reward rarity tiers */
enum RewardRarity {
  COMMON = 'common',
  UNCOMMON = 'uncommon',
  RARE = 'rare',
  EPIC = 'epic',
  LEGENDARY = 'legendary',
  MYTHIC = 'mythic',
}
```

### UserSeasonProgress

Tracks an individual user's progression within a season.

```typescript
/**
 * A user's progression state within a specific season.
 *
 * Created automatically when a user first interacts with a season
 * (earns XP, views pass, etc.). One record per user per season.
 */
interface UserSeasonProgress {
  /** Unique progress record identifier */
  id: string;

  /** User identifier */
  userId: string;

  /** Season identifier */
  seasonId: string;

  /** Venture identifier */
  ventureId: string;

  /** Current tier (1-based; 0 means no tier reached yet) */
  currentTier: number;

  /** Total season XP earned */
  totalXP: number;

  /** XP earned today (resets daily at midnight UTC) */
  dailyXP: number;

  /** XP earned this week (resets weekly on Monday midnight UTC) */
  weeklyXP: number;

  /** Date of last daily XP reset */
  dailyResetDate: Date;

  /** Date of last weekly XP reset */
  weeklyResetDate: Date;

  /** IDs of tier rewards the user has claimed */
  claimedRewardIds: string[];

  /** IDs of tier rewards available but not yet claimed */
  unclaimedRewardIds: string[];

  /** Which pass tracks the user has access to */
  ownedTracks: PassTrack[];

  /** Active XP boost multiplier (1.0 = no boost) */
  activeXPMultiplier: number;

  /** When the current XP boost expires (null = no active boost) */
  xpBoostExpiresAt: Date | null;

  /** Catch-up multiplier (calculated based on join date vs season midpoint) */
  catchUpMultiplier: number;

  /** When the user first joined/interacted with this season */
  joinedAt: Date;

  /** When the user last earned XP */
  lastXPEarnedAt: Date | null;

  /** Number of tiers the user has purchased (skipped) */
  purchasedTiers: number;

  /** Whether the user has completed the pass (reached max tier) */
  isComplete: boolean;

  /** Completion timestamp */
  completedAt: Date | null;

  createdAt: Date;
  updatedAt: Date;
}
```

### SeasonEvent

In-season events that modify gameplay or offer limited-time activities.

```typescript
/**
 * A time-limited event that runs within a season.
 *
 * Events can modify XP rates, unlock special challenges,
 * offer limited-time rewards, or activate community goals.
 */
interface SeasonEvent {
  /** Unique event identifier */
  id: string;

  /** Parent season */
  seasonId: string;

  /** Venture identifier */
  ventureId: string;

  /** Event type */
  eventType: EventType;

  /** Display name */
  name: string;

  /** Slug for URL routing */
  slug: string;

  /** Rich description */
  description: string | null;

  /** Event start time (UTC) */
  startDate: Date;

  /** Event end time (UTC) */
  endDate: Date;

  /** Current status */
  status: EventStatus;

  /** Event-specific configuration */
  config: EventConfig;

  /** Event branding */
  theme: {
    bannerUrl: string | null;
    iconUrl: string | null;
    accentColor: string | null;
  };

  /** Whether this event is visible before it starts */
  preAnnounce: boolean;

  /** When to show the pre-announcement */
  preAnnounceDate: Date | null;

  /** Whether participation is opt-in */
  requiresOptIn: boolean;

  /** Maximum participants (null = unlimited) */
  maxParticipants: number | null;

  /** Current participant count */
  participantCount: number;

  createdAt: Date;
  updatedAt: Date;
}

/** Event types */
enum EventType {
  /** XP earning rate multiplied during event window */
  XP_BOOST = 'xp_boost',
  /** Short-duration challenge with bonus rewards */
  FLASH_CHALLENGE = 'flash_challenge',
  /** Limited-time item or cosmetic availability */
  LIMITED_DROP = 'limited_drop',
  /** Community-wide collective goal */
  COMMUNITY_GOAL = 'community_goal',
  /** Custom/special event type */
  SPECIAL = 'special',
}

/** Event status */
enum EventStatus {
  SCHEDULED = 'scheduled',
  ACTIVE = 'active',
  ENDED = 'ended',
  CANCELLED = 'cancelled',
}

/** Event-specific configuration (discriminated by eventType) */
type EventConfig =
  | XPBoostEventConfig
  | FlashChallengeEventConfig
  | LimitedDropEventConfig
  | CommunityGoalEventConfig
  | SpecialEventConfig;

interface XPBoostEventConfig {
  type: 'xp_boost';
  /** XP multiplier during event (e.g., 2.0 = double XP) */
  multiplier: number;
  /** Which XP sources are boosted (null = all sources) */
  boostedSources: string[] | null;
  /** Whether the boost stacks with personal XP boosts */
  stacksWithPersonalBoost: boolean;
}

interface FlashChallengeEventConfig {
  type: 'flash_challenge';
  /** Challenge quest/objective IDs */
  challengeIds: string[];
  /** Bonus XP for completing all challenges */
  completionBonusXP: number;
  /** Bonus rewards for completion */
  completionRewards: SeasonTierReward[];
}

interface LimitedDropEventConfig {
  type: 'limited_drop';
  /** Items available during the drop */
  items: Array<{
    rewardRefId: string;
    name: string;
    priceAmount: number;
    priceCurrency: string;
    maxQuantity: number | null;
    currentSold: number;
  }>;
}

interface CommunityGoalEventConfig {
  type: 'community_goal';
  /** Reference to the community goal record */
  communityGoalId: string;
}

interface SpecialEventConfig {
  type: 'special';
  /** Freeform configuration for custom events */
  data: Record<string, unknown>;
}
```

### CommunityGoal

Server-wide or platform-wide collective targets.

```typescript
/**
 * A collective goal that requires contributions from many users.
 *
 * Community goals have a target value and track cumulative progress
 * across all participants. They can have multiple reward tiers
 * (e.g., reaching 25%, 50%, 75%, 100% unlocks different rewards).
 */
interface CommunityGoal {
  /** Unique goal identifier */
  id: string;

  /** Parent season (null if standalone) */
  seasonId: string | null;

  /** Associated season event (null if standalone) */
  seasonEventId: string | null;

  /** Venture identifier */
  ventureId: string;

  /** Scope of the goal */
  scope: GoalScope;

  /** For server-scoped goals, the specific server/guild ID */
  serverId: string | null;

  /** Display name */
  name: string;

  /** Rich description */
  description: string | null;

  /** URL to goal banner/artwork */
  bannerUrl: string | null;

  /** The metric being tracked (e.g., "quests_completed", "xp_earned", "items_crafted") */
  metricKey: string;

  /** Human-readable metric label (e.g., "Quests Completed") */
  metricLabel: string;

  /** Target value to reach */
  targetValue: number;

  /** Current cumulative progress */
  currentValue: number;

  /** Number of unique contributors */
  contributorCount: number;

  /** Progress percentage (0-100) */
  progressPercent: number;

  /** Reward tiers — milestones within the goal */
  rewardTiers: CommunityGoalTier[];

  /** Goal start time */
  startDate: Date;

  /** Goal end time */
  endDate: Date;

  /** Whether the goal has been completed */
  isCompleted: boolean;

  /** When the goal was completed (null if not yet) */
  completedAt: Date | null;

  /** Whether rewards have been distributed */
  rewardsDistributed: boolean;

  createdAt: Date;
  updatedAt: Date;
}

/** Scope of a community goal */
enum GoalScope {
  /** Scoped to a single venture */
  VENTURE = 'venture',
  /** Scoped to a specific server/guild within a venture */
  SERVER = 'server',
  /** Platform-wide across all ventures */
  PLATFORM = 'platform',
}

/** A reward tier within a community goal */
interface CommunityGoalTier {
  /** Tier number (1-based) */
  tier: number;

  /** Progress percentage at which this tier unlocks (e.g., 25, 50, 75, 100) */
  thresholdPercent: number;

  /** Absolute value threshold */
  thresholdValue: number;

  /** Whether this tier has been reached */
  isReached: boolean;

  /** Rewards granted when this tier is reached */
  rewards: SeasonTierReward[];

  /** Description of what this tier represents */
  description: string | null;
}

/**
 * An individual user's contribution to a community goal.
 */
interface CommunityGoalContribution {
  /** Unique contribution identifier */
  id: string;

  /** Community goal identifier */
  goalId: string;

  /** Contributing user */
  userId: string;

  /** Venture identifier */
  ventureId: string;

  /** Contribution amount */
  amount: number;

  /** What action generated this contribution */
  sourceAction: string;

  /** Reference to the source action (e.g., quest completion ID) */
  sourceRefId: string | null;

  /** Timestamp of contribution */
  contributedAt: Date;
}
```

### SeasonAnalytics

Aggregated performance metrics for a season.

```typescript
/**
 * Comprehensive analytics for a season's performance.
 *
 * Generated on-demand or via scheduled aggregation.
 * Powers admin dashboards and season retrospectives.
 */
interface SeasonAnalytics {
  /** Season identifier */
  seasonId: string;

  /** Venture identifier */
  ventureId: string;

  /** When this snapshot was generated */
  generatedAt: Date;

  /** Overall engagement metrics */
  engagement: {
    /** Total unique users who participated in the season */
    totalParticipants: number;

    /** Users who earned at least 1 XP */
    activeParticipants: number;

    /** Daily active users (average over season duration) */
    averageDAU: number;

    /** Peak concurrent participants */
    peakConcurrent: number;

    /** Average session duration during season (minutes) */
    averageSessionMinutes: number;

    /** Retention rate (users active in last week / total participants) */
    retentionRate: number;

    /** Churn rate (users who stopped participating before season end) */
    churnRate: number;

    /** Average days active per participant */
    averageDaysActive: number;
  };

  /** Battle pass metrics */
  battlePass: {
    /** Number of premium passes purchased */
    premiumPurchases: number;

    /** Premium pass purchase rate (premium purchasers / total participants) */
    purchaseRate: number;

    /** Total revenue from pass purchases */
    passRevenue: number;

    /** Revenue currency */
    revenueCurrency: string;

    /** Distribution of users across tiers */
    tierDistribution: Array<{
      tier: number;
      userCount: number;
      percentage: number;
    }>;

    /** Average tier reached (all users) */
    averageTier: number;

    /** Average tier reached (premium users only) */
    averagePremiumTier: number;

    /** Percentage of users who completed all tiers */
    completionRate: number;

    /** Premium completion rate */
    premiumCompletionRate: number;

    /** Median tier reached */
    medianTier: number;

    /** Number of tier skips purchased */
    tierSkipsPurchased: number;

    /** Revenue from tier skips */
    tierSkipRevenue: number;
  };

  /** XP metrics */
  xp: {
    /** Total XP earned across all users */
    totalXPEarned: number;

    /** Average XP per user */
    averageXPPerUser: number;

    /** Median XP per user */
    medianXPPerUser: number;

    /** Daily XP cap hit rate (times cap was reached / eligible days) */
    dailyCapHitRate: number;

    /** Weekly XP cap hit rate */
    weeklyCapHitRate: number;

    /** XP earned by source */
    xpBySource: Array<{
      source: string;
      totalXP: number;
      percentage: number;
    }>;

    /** Daily XP earning curve (by day of season) */
    dailyXPCurve: Array<{
      day: number;
      totalXP: number;
      uniqueEarners: number;
    }>;
  };

  /** Event metrics */
  events: {
    /** Total events held during the season */
    totalEvents: number;

    /** Events by type */
    eventsByType: Record<EventType, number>;

    /** Average event participation rate */
    averageParticipationRate: number;

    /** Most popular event */
    mostPopularEvent: {
      eventId: string;
      name: string;
      participantCount: number;
    } | null;
  };

  /** Community goal metrics */
  communityGoals: {
    /** Total community goals during the season */
    totalGoals: number;

    /** Goals that were completed */
    completedGoals: number;

    /** Completion rate */
    completionRate: number;

    /** Average participation rate per goal */
    averageParticipationRate: number;

    /** Total contributions across all goals */
    totalContributions: number;
  };

  /** Revenue summary */
  revenue: {
    /** Total revenue from this season */
    totalRevenue: number;

    /** Revenue currency */
    currency: string;

    /** Revenue breakdown */
    breakdown: {
      passPurchases: number;
      tierSkips: number;
      limitedDrops: number;
      xpBoosts: number;
      other: number;
    };

    /** Revenue per active user (ARPU) */
    revenuePerActiveUser: number;

    /** Revenue per paying user (ARPPU) */
    revenuePerPayingUser: number;

    /** Percentage of users who spent money */
    payerConversionRate: number;
  };
}
```

### SeasonTransition

Configuration for how seasons transition from one to the next.

```typescript
/**
 * Defines the rules and policies for transitioning between seasons.
 *
 * Handles grace periods, unclaimed reward policies, currency/XP
 * carryover, and how the next season is initialized.
 */
interface SeasonTransition {
  /** Unique transition identifier */
  id: string;

  /** The ending season */
  fromSeasonId: string;

  /** The next season (null if no successor is defined yet) */
  toSeasonId: string | null;

  /** Venture identifier */
  ventureId: string;

  /** Grace period configuration */
  gracePeriod: {
    /** Duration in days after season end */
    durationDays: number;

    /** Whether users can still claim unclaimed tier rewards during grace */
    allowRewardClaims: boolean;

    /** Whether the season pass can still be purchased during grace */
    allowPassPurchase: boolean;

    /** Whether users receive a notification when grace period starts */
    notifyOnStart: boolean;

    /** Whether users receive a reminder N days before grace expires */
    reminderDaysBeforeExpiry: number[];
  };

  /** Policy for unclaimed rewards after grace period */
  unclaimedRewardPolicy: UnclaimedRewardPolicy;

  /** Carryover policies */
  carryover: {
    /**
     * Percentage of leftover season XP that carries over to the next season.
     * 0 = no carryover, 100 = full carryover.
     */
    xpCarryoverPercent: number;

    /**
     * Maximum XP that can be carried over (0 = no cap).
     */
    maxXPCarryover: number;

    /**
     * Whether the premium pass ownership carries over to the next season.
     * Typically false — each season requires a new purchase.
     */
    passCarryover: boolean;

    /**
     * Whether earned cosmetics/titles/badges persist after the season.
     * Typically true — earned rewards are permanent.
     */
    cosmeticsRetained: boolean;

    /**
     * Whether season-exclusive items remain usable after the season.
     * If false, they become "legacy" items with a season badge.
     */
    exclusiveItemsUsable: boolean;
  };

  /** Whether to automatically start the next season after the gap */
  autoStartNextSeason: boolean;

  /** Gap in days between end of grace period and start of next season */
  gapDays: number;

  /** Transition status */
  status: TransitionStatus;

  /** When the transition was executed */
  executedAt: Date | null;

  createdAt: Date;
  updatedAt: Date;
}

/** Policy for handling unclaimed rewards */
enum UnclaimedRewardPolicy {
  /** Auto-claim all unclaimed rewards to user inventory */
  AUTO_CLAIM = 'auto_claim',
  /** Convert unclaimed rewards to currency at a defined exchange rate */
  CONVERT_TO_CURRENCY = 'convert_to_currency',
  /** Unclaimed rewards are forfeited (lost) */
  FORFEIT = 'forfeit',
  /** Unclaimed rewards are sent to a holding inbox for 30 days */
  HOLD_INBOX = 'hold_inbox',
}

/** Transition execution status */
enum TransitionStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  FAILED = 'failed',
}
```

### SeasonService

Primary service interface for season operations.

```typescript
/**
 * Core service for season lifecycle management.
 *
 * Handles CRUD, state transitions, and high-level queries
 * for seasons within a venture.
 */
interface SeasonService {
  // ── CRUD ───────────────────────────────────────────────────

  /** Create a new season in draft status */
  createSeason(input: CreateSeasonInput): Promise<Season>;

  /** Get a season by ID */
  getSeason(seasonId: string): Promise<Season | null>;

  /** Get the currently active season for a venture */
  getActiveSeason(ventureId: string): Promise<Season | null>;

  /** List seasons for a venture with filtering and pagination */
  listSeasons(input: ListSeasonsInput): Promise<PaginatedResult<Season>>;

  /** Update season configuration (only allowed in draft/scheduled status) */
  updateSeason(seasonId: string, input: UpdateSeasonInput): Promise<Season>;

  /** Soft-delete a season (only allowed in draft status) */
  deleteSeason(seasonId: string): Promise<void>;

  // ── Lifecycle ──────────────────────────────────────────────

  /** Publish a draft season → scheduled status */
  publishSeason(seasonId: string): Promise<Season>;

  /** Revert a scheduled season → draft status */
  unpublishSeason(seasonId: string): Promise<Season>;

  /** Activate a season (typically called by scheduler) */
  activateSeason(seasonId: string): Promise<Season>;

  /** Begin ending phase (grace period) */
  beginEnding(seasonId: string): Promise<Season>;

  /** Fully end a season */
  endSeason(seasonId: string): Promise<Season>;

  /** Archive a season */
  archiveSeason(seasonId: string): Promise<Season>;

  // ── Queries ────────────────────────────────────────────────

  /** Get season progress for a specific user */
  getUserProgress(seasonId: string, userId: string): Promise<UserSeasonProgress | null>;

  /** Get the full battle pass structure (tiers + rewards) */
  getPassStructure(seasonId: string): Promise<SeasonPassStructure>;

  /** Get season timeline (events, milestones, community goals) */
  getTimeline(seasonId: string): Promise<SeasonTimeline>;

  /** Check if a season is in its grace period */
  isInGracePeriod(seasonId: string): Promise<boolean>;

  /** Get remaining time in the season */
  getRemainingTime(seasonId: string): Promise<SeasonRemainingTime>;

  // ── Validation ─────────────────────────────────────────────

  /** Validate season configuration before publish */
  validateSeason(seasonId: string): Promise<ValidationResult>;

  /** Check for scheduling conflicts with other seasons */
  checkConflicts(ventureId: string, startDate: Date, endDate: Date, excludeSeasonId?: string): Promise<ConflictResult>;
}

/** Input for creating a new season */
interface CreateSeasonInput {
  ventureId: string;
  name: string;
  tagline?: string;
  description?: string;
  theme: SeasonTheme;
  startDate: Date;
  endDate: Date;
  gracePeriodDays?: number;
  totalTiers: number;
  xpConfig: SeasonXPConfig;
}

/** Input for listing seasons */
interface ListSeasonsInput {
  ventureId: string;
  status?: SeasonStatus[];
  year?: number;
  cursor?: string;
  limit?: number;
  orderBy?: 'startDate' | 'seasonNumber' | 'createdAt';
  orderDir?: 'asc' | 'desc';
}

/** Battle pass structure returned to clients */
interface SeasonPassStructure {
  season: Season;
  passes: SeasonPass[];
  tiers: SeasonTier[];
  totalXPRequired: number;
}

/** Season timeline */
interface SeasonTimeline {
  seasonId: string;
  events: SeasonEvent[];
  communityGoals: CommunityGoal[];
  milestones: Array<{
    date: Date;
    type: string;
    description: string;
  }>;
}

/** Remaining time in a season */
interface SeasonRemainingTime {
  seasonId: string;
  status: SeasonStatus;
  /** Remaining time in the active phase */
  activeRemaining: {
    days: number;
    hours: number;
    minutes: number;
    totalSeconds: number;
  } | null;
  /** Remaining time in the grace period */
  graceRemaining: {
    days: number;
    hours: number;
    minutes: number;
    totalSeconds: number;
  } | null;
  /** Estimated time to complete the pass at current XP rate */
  estimatedCompletionDays: number | null;
}
```

---

## Database Schemas

All tables use Supabase PostgreSQL with Drizzle ORM definitions. Every table includes `venture_id` for multi-tenant RLS isolation.

### seasons

Primary season definitions table.

```typescript
import { pgTable, uuid, text, integer, timestamp, jsonb, pgEnum } from 'drizzle-orm/pg-core';

export const seasonStatusEnum = pgEnum('season_status', [
  'draft',
  'scheduled',
  'active',
  'ending',
  'ended',
  'archived',
]);

export const seasons = pgTable('seasons', {
  id: uuid('id').primaryKey().defaultRandom(),
  ventureId: uuid('venture_id').notNull().references(() => ventures.id),
  seasonNumber: integer('season_number').notNull(),
  year: integer('year').notNull(),
  name: text('name').notNull(),
  slug: text('slug').notNull(),
  tagline: text('tagline'),
  description: text('description'),
  status: seasonStatusEnum('status').notNull().default('draft'),
  theme: jsonb('theme').notNull().$type<SeasonTheme>(),
  startDate: timestamp('start_date', { withTimezone: true }).notNull(),
  endDate: timestamp('end_date', { withTimezone: true }).notNull(),
  gracePeriodDays: integer('grace_period_days').notNull().default(7),
  totalTiers: integer('total_tiers').notNull().default(100),
  xpConfig: jsonb('xp_config').notNull().$type<SeasonXPConfig>(),
  crossVentureSeasonId: uuid('cross_venture_season_id'),
  createdBy: uuid('created_by').notNull().references(() => users.id),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  deletedAt: timestamp('deleted_at', { withTimezone: true }),
}, (table) => ({
  ventureIdx: index('seasons_venture_id_idx').on(table.ventureId),
  statusIdx: index('seasons_status_idx').on(table.status),
  ventureStatusIdx: index('seasons_venture_status_idx').on(table.ventureId, table.status),
  ventureSlugUniq: uniqueIndex('seasons_venture_slug_uniq').on(table.ventureId, table.slug),
  ventureNumberUniq: uniqueIndex('seasons_venture_number_uniq').on(table.ventureId, table.seasonNumber),
  startDateIdx: index('seasons_start_date_idx').on(table.startDate),
  endDateIdx: index('seasons_end_date_idx').on(table.endDate),
}));
```

**RLS Policy:**

```sql
ALTER TABLE seasons ENABLE ROW LEVEL SECURITY;

-- Venture members can read their venture's seasons
CREATE POLICY seasons_select ON seasons
  FOR SELECT USING (
    venture_id = current_setting('app.current_venture_id')::uuid
  );

-- Only admins can insert/update/delete
CREATE POLICY seasons_admin_insert ON seasons
  FOR INSERT WITH CHECK (
    venture_id = current_setting('app.current_venture_id')::uuid
    AND current_setting('app.current_user_role') IN ('admin', 'owner')
  );

CREATE POLICY seasons_admin_update ON seasons
  FOR UPDATE USING (
    venture_id = current_setting('app.current_venture_id')::uuid
    AND current_setting('app.current_user_role') IN ('admin', 'owner')
  );

CREATE POLICY seasons_admin_delete ON seasons
  FOR DELETE USING (
    venture_id = current_setting('app.current_venture_id')::uuid
    AND current_setting('app.current_user_role') IN ('admin', 'owner')
  );
```

### season_passes

Pass type definitions per season.

```typescript
export const passTrackEnum = pgEnum('pass_track', ['free', 'premium']);

export const seasonPasses = pgTable('season_passes', {
  id: uuid('id').primaryKey().defaultRandom(),
  seasonId: uuid('season_id').notNull().references(() => seasons.id, { onDelete: 'cascade' }),
  ventureId: uuid('venture_id').notNull().references(() => ventures.id),
  track: passTrackEnum('track').notNull(),
  name: text('name').notNull(),
  description: text('description'),
  priceAmount: integer('price_amount').notNull().default(0),
  priceCurrency: text('price_currency').notNull().default('USD'),
  priceTokens: integer('price_tokens'),
  bonusStartingTiers: integer('bonus_starting_tiers').notNull().default(0),
  retroactiveRewards: boolean('retroactive_rewards').notNull().default(true),
  artworkUrl: text('artwork_url'),
  availableForPurchase: boolean('available_for_purchase').notNull().default(true),
  purchaseLimit: integer('purchase_limit'),
  purchaseCount: integer('purchase_count').notNull().default(0),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  seasonIdx: index('season_passes_season_id_idx').on(table.seasonId),
  ventureIdx: index('season_passes_venture_id_idx').on(table.ventureId),
  seasonTrackUniq: uniqueIndex('season_passes_season_track_uniq').on(table.seasonId, table.track),
}));
```

### season_tiers

Individual tier definitions with XP thresholds.

```typescript
export const seasonTiers = pgTable('season_tiers', {
  id: uuid('id').primaryKey().defaultRandom(),
  seasonId: uuid('season_id').notNull().references(() => seasons.id, { onDelete: 'cascade' }),
  ventureId: uuid('venture_id').notNull().references(() => ventures.id),
  tierNumber: integer('tier_number').notNull(),
  name: text('name'),
  requiredXP: integer('required_xp').notNull(),
  tierXP: integer('tier_xp').notNull(),
  isMilestone: boolean('is_milestone').notNull().default(false),
  badgeUrl: text('badge_url'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  seasonIdx: index('season_tiers_season_id_idx').on(table.seasonId),
  seasonTierUniq: uniqueIndex('season_tiers_season_tier_uniq').on(table.seasonId, table.tierNumber),
  requiredXPIdx: index('season_tiers_required_xp_idx').on(table.seasonId, table.requiredXP),
}));
```

### season_tier_rewards

Reward items assigned to tiers, scoped by track.

```typescript
export const rewardTypeEnum = pgEnum('reward_type', [
  'currency', 'cosmetic', 'item', 'title', 'badge',
  'lootbox', 'xp_boost', 'emote', 'avatar_frame', 'banner', 'custom',
]);

export const rewardRarityEnum = pgEnum('reward_rarity', [
  'common', 'uncommon', 'rare', 'epic', 'legendary', 'mythic',
]);

export const seasonTierRewards = pgTable('season_tier_rewards', {
  id: uuid('id').primaryKey().defaultRandom(),
  tierId: uuid('tier_id').notNull().references(() => seasonTiers.id, { onDelete: 'cascade' }),
  seasonId: uuid('season_id').notNull().references(() => seasons.id, { onDelete: 'cascade' }),
  ventureId: uuid('venture_id').notNull().references(() => ventures.id),
  track: passTrackEnum('track').notNull(),
  rewardType: rewardTypeEnum('reward_type').notNull(),
  rewardRefId: text('reward_ref_id').notNull(),
  quantity: integer('quantity').notNull().default(1),
  name: text('name').notNull(),
  description: text('description'),
  rarity: rewardRarityEnum('rarity').notNull().default('common'),
  previewUrl: text('preview_url'),
  isExclusive: boolean('is_exclusive').notNull().default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  tierIdx: index('season_tier_rewards_tier_id_idx').on(table.tierId),
  seasonIdx: index('season_tier_rewards_season_id_idx').on(table.seasonId),
  seasonTrackIdx: index('season_tier_rewards_season_track_idx').on(table.seasonId, table.track),
}));
```

### user_season_progress

Per-user progression state within a season.

```typescript
export const userSeasonProgress = pgTable('user_season_progress', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id),
  seasonId: uuid('season_id').notNull().references(() => seasons.id, { onDelete: 'cascade' }),
  ventureId: uuid('venture_id').notNull().references(() => ventures.id),
  currentTier: integer('current_tier').notNull().default(0),
  totalXP: integer('total_xp').notNull().default(0),
  dailyXP: integer('daily_xp').notNull().default(0),
  weeklyXP: integer('weekly_xp').notNull().default(0),
  dailyResetDate: timestamp('daily_reset_date', { withTimezone: true }).notNull(),
  weeklyResetDate: timestamp('weekly_reset_date', { withTimezone: true }).notNull(),
  claimedRewardIds: jsonb('claimed_reward_ids').notNull().default([]).$type<string[]>(),
  unclaimedRewardIds: jsonb('unclaimed_reward_ids').notNull().default([]).$type<string[]>(),
  ownedTracks: jsonb('owned_tracks').notNull().default(['free']).$type<PassTrack[]>(),
  activeXPMultiplier: real('active_xp_multiplier').notNull().default(1.0),
  xpBoostExpiresAt: timestamp('xp_boost_expires_at', { withTimezone: true }),
  catchUpMultiplier: real('catch_up_multiplier').notNull().default(1.0),
  joinedAt: timestamp('joined_at', { withTimezone: true }).notNull().defaultNow(),
  lastXPEarnedAt: timestamp('last_xp_earned_at', { withTimezone: true }),
  purchasedTiers: integer('purchased_tiers').notNull().default(0),
  isComplete: boolean('is_complete').notNull().default(false),
  completedAt: timestamp('completed_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  userSeasonUniq: uniqueIndex('user_season_progress_user_season_uniq').on(table.userId, table.seasonId),
  seasonIdx: index('user_season_progress_season_id_idx').on(table.seasonId),
  ventureIdx: index('user_season_progress_venture_id_idx').on(table.ventureId),
  tierIdx: index('user_season_progress_current_tier_idx').on(table.seasonId, table.currentTier),
  totalXPIdx: index('user_season_progress_total_xp_idx').on(table.seasonId, table.totalXP),
  isCompleteIdx: index('user_season_progress_is_complete_idx').on(table.seasonId, table.isComplete),
}));
```

**RLS Policy:**

```sql
ALTER TABLE user_season_progress ENABLE ROW LEVEL SECURITY;

-- Users can read their own progress
CREATE POLICY user_season_progress_select_own ON user_season_progress
  FOR SELECT USING (
    user_id = current_setting('app.current_user_id')::uuid
    AND venture_id = current_setting('app.current_venture_id')::uuid
  );

-- Admins can read all progress in their venture
CREATE POLICY user_season_progress_select_admin ON user_season_progress
  FOR SELECT USING (
    venture_id = current_setting('app.current_venture_id')::uuid
    AND current_setting('app.current_user_role') IN ('admin', 'owner')
  );

-- System can insert/update (via service role, bypasses RLS)
-- Individual user updates go through the SeasonXPService which uses service role
```

### season_events

Scheduled events within seasons.

```typescript
export const eventTypeEnum = pgEnum('event_type', [
  'xp_boost', 'flash_challenge', 'limited_drop', 'community_goal', 'special',
]);

export const eventStatusEnum = pgEnum('event_status', [
  'scheduled', 'active', 'ended', 'cancelled',
]);

export const seasonEvents = pgTable('season_events', {
  id: uuid('id').primaryKey().defaultRandom(),
  seasonId: uuid('season_id').notNull().references(() => seasons.id, { onDelete: 'cascade' }),
  ventureId: uuid('venture_id').notNull().references(() => ventures.id),
  eventType: eventTypeEnum('event_type').notNull(),
  name: text('name').notNull(),
  slug: text('slug').notNull(),
  description: text('description'),
  startDate: timestamp('start_date', { withTimezone: true }).notNull(),
  endDate: timestamp('end_date', { withTimezone: true }).notNull(),
  status: eventStatusEnum('status').notNull().default('scheduled'),
  config: jsonb('config').notNull().$type<EventConfig>(),
  theme: jsonb('theme').notNull().default({}).$type<{
    bannerUrl: string | null;
    iconUrl: string | null;
    accentColor: string | null;
  }>(),
  preAnnounce: boolean('pre_announce').notNull().default(false),
  preAnnounceDate: timestamp('pre_announce_date', { withTimezone: true }),
  requiresOptIn: boolean('requires_opt_in').notNull().default(false),
  maxParticipants: integer('max_participants'),
  participantCount: integer('participant_count').notNull().default(0),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  seasonIdx: index('season_events_season_id_idx').on(table.seasonId),
  ventureIdx: index('season_events_venture_id_idx').on(table.ventureId),
  statusIdx: index('season_events_status_idx').on(table.status),
  startDateIdx: index('season_events_start_date_idx').on(table.startDate),
  endDateIdx: index('season_events_end_date_idx').on(table.endDate),
  seasonSlugUniq: uniqueIndex('season_events_season_slug_uniq').on(table.seasonId, table.slug),
}));
```

### community_goals

Community-wide collective targets.

```typescript
export const goalScopeEnum = pgEnum('goal_scope', ['venture', 'server', 'platform']);

export const communityGoals = pgTable('community_goals', {
  id: uuid('id').primaryKey().defaultRandom(),
  seasonId: uuid('season_id').references(() => seasons.id, { onDelete: 'set null' }),
  seasonEventId: uuid('season_event_id').references(() => seasonEvents.id, { onDelete: 'set null' }),
  ventureId: uuid('venture_id').notNull().references(() => ventures.id),
  scope: goalScopeEnum('scope').notNull().default('venture'),
  serverId: text('server_id'),
  name: text('name').notNull(),
  description: text('description'),
  bannerUrl: text('banner_url'),
  metricKey: text('metric_key').notNull(),
  metricLabel: text('metric_label').notNull(),
  targetValue: bigint('target_value', { mode: 'number' }).notNull(),
  currentValue: bigint('current_value', { mode: 'number' }).notNull().default(0),
  contributorCount: integer('contributor_count').notNull().default(0),
  rewardTiers: jsonb('reward_tiers').notNull().default([]).$type<CommunityGoalTier[]>(),
  startDate: timestamp('start_date', { withTimezone: true }).notNull(),
  endDate: timestamp('end_date', { withTimezone: true }).notNull(),
  isCompleted: boolean('is_completed').notNull().default(false),
  completedAt: timestamp('completed_at', { withTimezone: true }),
  rewardsDistributed: boolean('rewards_distributed').notNull().default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  seasonIdx: index('community_goals_season_id_idx').on(table.seasonId),
  ventureIdx: index('community_goals_venture_id_idx').on(table.ventureId),
  scopeIdx: index('community_goals_scope_idx').on(table.scope),
  isCompletedIdx: index('community_goals_is_completed_idx').on(table.isCompleted),
  startDateIdx: index('community_goals_start_date_idx').on(table.startDate),
}));
```

### community_goal_contributions

Individual user contributions to community goals.

```typescript
export const communityGoalContributions = pgTable('community_goal_contributions', {
  id: uuid('id').primaryKey().defaultRandom(),
  goalId: uuid('goal_id').notNull().references(() => communityGoals.id, { onDelete: 'cascade' }),
  userId: uuid('user_id').notNull().references(() => users.id),
  ventureId: uuid('venture_id').notNull().references(() => ventures.id),
  amount: bigint('amount', { mode: 'number' }).notNull(),
  sourceAction: text('source_action').notNull(),
  sourceRefId: text('source_ref_id'),
  contributedAt: timestamp('contributed_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  goalIdx: index('community_goal_contributions_goal_id_idx').on(table.goalId),
  userIdx: index('community_goal_contributions_user_id_idx').on(table.userId),
  goalUserIdx: index('community_goal_contributions_goal_user_idx').on(table.goalId, table.userId),
  contributedAtIdx: index('community_goal_contributions_contributed_at_idx').on(table.contributedAt),
}));
```

### season_purchases

Records of all monetary transactions within a season.

```typescript
export const purchaseTypeEnum = pgEnum('season_purchase_type', [
  'pass', 'tier_skip', 'xp_boost', 'limited_drop', 'bundle',
]);

export const seasonPurchases = pgTable('season_purchases', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id),
  seasonId: uuid('season_id').notNull().references(() => seasons.id),
  ventureId: uuid('venture_id').notNull().references(() => ventures.id),
  purchaseType: purchaseTypeEnum('purchase_type').notNull(),
  /** Reference to the purchased item (pass ID, tier ID, etc.) */
  itemRefId: text('item_ref_id').notNull(),
  /** Amount charged in currency (minor units) */
  amount: integer('amount').notNull(),
  /** ISO 4217 currency code */
  currency: text('currency').notNull().default('USD'),
  /** Amount charged in platform tokens (if applicable) */
  tokenAmount: integer('token_amount'),
  /** External payment provider transaction ID */
  externalTransactionId: text('external_transaction_id'),
  /** Payment provider (stripe, platform_tokens, etc.) */
  paymentProvider: text('payment_provider').notNull(),
  /** Additional purchase metadata */
  metadata: jsonb('metadata').default({}),
  /** Refund status */
  refundedAt: timestamp('refunded_at', { withTimezone: true }),
  refundAmount: integer('refund_amount'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  userIdx: index('season_purchases_user_id_idx').on(table.userId),
  seasonIdx: index('season_purchases_season_id_idx').on(table.seasonId),
  ventureIdx: index('season_purchases_venture_id_idx').on(table.ventureId),
  purchaseTypeIdx: index('season_purchases_purchase_type_idx').on(table.purchaseType),
  externalTxIdx: uniqueIndex('season_purchases_external_tx_uniq').on(table.externalTransactionId),
}));
```

### season_archives

Compressed season data for historical access.

```typescript
export const seasonArchives = pgTable('season_archives', {
  id: uuid('id').primaryKey().defaultRandom(),
  seasonId: uuid('season_id').notNull().references(() => seasons.id),
  ventureId: uuid('venture_id').notNull().references(() => ventures.id),
  /** Snapshot of the season configuration at time of archival */
  seasonSnapshot: jsonb('season_snapshot').notNull().$type<Season>(),
  /** Aggregated analytics at time of archival */
  analyticsSnapshot: jsonb('analytics_snapshot').notNull().$type<SeasonAnalytics>(),
  /** Pass structure snapshot */
  passStructure: jsonb('pass_structure').notNull().$type<SeasonPassStructure>(),
  /** Top N leaderboard snapshot */
  leaderboardSnapshot: jsonb('leaderboard_snapshot').notNull().$type<LeaderboardEntry[]>(),
  /** Total participants at end of season */
  totalParticipants: integer('total_participants').notNull(),
  /** Total premium purchasers */
  totalPremiumUsers: integer('total_premium_users').notNull(),
  /** Total revenue */
  totalRevenue: integer('total_revenue').notNull(),
  revenueCurrency: text('revenue_currency').notNull().default('USD'),
  archivedAt: timestamp('archived_at', { withTimezone: true }).notNull().defaultNow(),
  archivedBy: uuid('archived_by').notNull().references(() => users.id),
}, (table) => ({
  seasonUniq: uniqueIndex('season_archives_season_uniq').on(table.seasonId),
  ventureIdx: index('season_archives_venture_id_idx').on(table.ventureId),
  archivedAtIdx: index('season_archives_archived_at_idx').on(table.archivedAt),
}));

interface LeaderboardEntry {
  userId: string;
  username: string;
  totalXP: number;
  tier: number;
  rank: number;
  isComplete: boolean;
}
```

### Cross-Venture Season Tables

```typescript
/** Platform-wide meta-seasons that span multiple ventures */
export const crossVentureSeasons = pgTable('cross_venture_seasons', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  slug: text('slug').notNull().unique(),
  description: text('description'),
  theme: jsonb('theme').notNull().$type<SeasonTheme>(),
  startDate: timestamp('start_date', { withTimezone: true }).notNull(),
  endDate: timestamp('end_date', { withTimezone: true }).notNull(),
  status: seasonStatusEnum('status').notNull().default('draft'),
  createdBy: uuid('created_by').notNull().references(() => users.id),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

/** Join table linking ventures to a cross-venture season */
export const crossVentureSeasonParticipants = pgTable('cross_venture_season_participants', {
  id: uuid('id').primaryKey().defaultRandom(),
  crossVentureSeasonId: uuid('cross_venture_season_id')
    .notNull()
    .references(() => crossVentureSeasons.id, { onDelete: 'cascade' }),
  ventureId: uuid('venture_id').notNull().references(() => ventures.id),
  /** The venture's local season linked to this cross-venture season */
  localSeasonId: uuid('local_season_id').notNull().references(() => seasons.id),
  joinedAt: timestamp('joined_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  crossVentureUniq: uniqueIndex('cross_venture_season_participants_uniq')
    .on(table.crossVentureSeasonId, table.ventureId),
}));
```

---

## Code Examples

### Example 1: Creating a New Season

```typescript
import { SeasonService } from '@mcv/engagement/seasons';
import { db } from '@mcv/db';

const seasonService = new SeasonService(db);

// Create a new season in draft status
const season = await seasonService.createSeason({
  ventureId: 'venture_abc123',
  name: 'Crimson Eclipse',
  tagline: 'Darkness rises. Will you stand?',
  description: `
    Season 3 brings a dark fantasy theme with new exclusive cosmetics,
    challenging weekly quests, and community-driven world events.
    Complete the battle pass to earn the Legendary Eclipse Knight armor set.
  `,
  theme: {
    primaryColor: '#DC143C',
    secondaryColor: '#1a1a2e',
    backgroundColor: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
    bannerUrl: 'https://cdn.mcv.one/seasons/s3/banner.webp',
    iconUrl: 'https://cdn.mcv.one/seasons/s3/icon.svg',
    thumbnailUrl: 'https://cdn.mcv.one/seasons/s3/thumb.webp',
    backgroundMediaUrl: 'https://cdn.mcv.one/seasons/s3/bg-anim.mp4',
    cssClass: 'season-crimson-eclipse',
    animationConfig: {
      type: 'lottie',
      url: 'https://cdn.mcv.one/seasons/s3/transition.json',
    },
  },
  startDate: new Date('2026-03-01T00:00:00Z'),
  endDate: new Date('2026-05-31T23:59:59Z'),
  gracePeriodDays: 14,
  totalTiers: 100,
  xpConfig: {
    baseCostPerTier: 1000,
    linearIncrement: 50,
    curveStartTier: 30,
    curveExponent: 1.5,
    curveFactor: 10,
    dailyXPCap: 5000,
    weeklyXPCap: 25000,
    catchUpEnabled: true,
    maxCatchUpMultiplier: 2.0,
    minXPPerTier: 500,
    maxXPPerTier: 3000,
  },
});

console.log(`Created season: ${season.name} (#${season.seasonNumber})`);
// => Created season: Crimson Eclipse (#3)

// Validate before publishing
const validation = await seasonService.validateSeason(season.id);
if (!validation.isValid) {
  console.error('Validation errors:', validation.errors);
  // Fix issues before publishing
}

// Publish the season (draft → scheduled)
const publishedSeason = await seasonService.publishSeason(season.id);
console.log(`Season status: ${publishedSeason.status}`);
// => Season status: scheduled
```

### Example 2: Setting Up Battle Pass Tiers and Rewards

```typescript
import { SeasonPassService } from '@mcv/engagement/seasons';
import { db } from '@mcv/db';

const passService = new SeasonPassService(db);

// Create the free pass (auto-created, but we can customize)
const freePass = await passService.createPass({
  seasonId: season.id,
  ventureId: 'venture_abc123',
  track: 'free',
  name: 'Free Pass',
  description: 'Earn rewards just by playing. No purchase required.',
  priceAmount: 0,
  priceCurrency: 'USD',
});

// Create the premium pass
const premiumPass = await passService.createPass({
  seasonId: season.id,
  ventureId: 'venture_abc123',
  track: 'premium',
  name: 'Eclipse Premium Pass',
  description: 'Unlock exclusive Eclipse-themed cosmetics, bonus XP, and more.',
  priceAmount: 999, // $9.99
  priceCurrency: 'USD',
  priceTokens: 1000, // Alternative: 1000 platform tokens
  bonusStartingTiers: 5, // Start at tier 5 when purchased
  retroactiveRewards: true, // Unlock premium rewards for tiers already reached
  artworkUrl: 'https://cdn.mcv.one/seasons/s3/premium-pass.webp',
});

// Generate tiers based on the season's XP config
const tiers = await passService.generateTiers(season.id);
console.log(`Generated ${tiers.length} tiers`);
// => Generated 100 tiers

// Assign rewards to specific tiers
await passService.assignReward({
  tierId: tiers[0].id, // Tier 1
  seasonId: season.id,
  ventureId: 'venture_abc123',
  track: 'free',
  rewardType: 'currency',
  rewardRefId: 'coins',
  quantity: 100,
  name: '100 Coins',
  rarity: 'common',
});

await passService.assignReward({
  tierId: tiers[0].id, // Tier 1
  seasonId: season.id,
  ventureId: 'venture_abc123',
  track: 'premium',
  rewardType: 'cosmetic',
  rewardRefId: 'skin_eclipse_scout',
  quantity: 1,
  name: 'Eclipse Scout Skin',
  rarity: 'rare',
  isExclusive: true,
  previewUrl: 'https://cdn.mcv.one/seasons/s3/rewards/eclipse-scout.webp',
});

// Bulk assign rewards from a template
await passService.bulkAssignRewards(season.id, [
  // Tier 10 (milestone)
  { tierNumber: 10, track: 'free', rewardType: 'xp_boost', rewardRefId: 'xp_boost_2x_1h', quantity: 1, name: '2x XP Boost (1 hour)', rarity: 'uncommon' },
  { tierNumber: 10, track: 'premium', rewardType: 'cosmetic', rewardRefId: 'emote_eclipse_dance', quantity: 1, name: 'Eclipse Dance Emote', rarity: 'epic', isExclusive: true },

  // Tier 50 (milestone)
  { tierNumber: 50, track: 'free', rewardType: 'currency', rewardRefId: 'coins', quantity: 1000, name: '1,000 Coins', rarity: 'rare' },
  { tierNumber: 50, track: 'premium', rewardType: 'cosmetic', rewardRefId: 'skin_eclipse_commander', quantity: 1, name: 'Eclipse Commander Skin', rarity: 'legendary', isExclusive: true },

  // Tier 100 (final)
  { tierNumber: 100, track: 'free', rewardType: 'title', rewardRefId: 'title_eclipse_survivor', quantity: 1, name: 'Eclipse Survivor Title', rarity: 'epic' },
  { tierNumber: 100, track: 'premium', rewardType: 'cosmetic', rewardRefId: 'skin_eclipse_knight', quantity: 1, name: 'Legendary Eclipse Knight', rarity: 'mythic', isExclusive: true },
]);

// Get the full pass structure
const structure = await passService.getPassStructure(season.id);
console.log(`Pass has ${structure.tiers.length} tiers, total XP required: ${structure.totalXPRequired}`);
// => Pass has 100 tiers, total XP required: 147500
```

### Example 3: Earning Season XP

```typescript
import { SeasonXPService } from '@mcv/engagement/seasons';
import { db } from '@mcv/db';

const xpService = new SeasonXPService(db);

// Award XP for completing a quest
const result = await xpService.awardXP({
  userId: 'user_xyz789',
  seasonId: season.id,
  ventureId: 'venture_abc123',
  amount: 250,
  source: 'quest_completion',
  sourceRefId: 'quest_daily_001',
  metadata: {
    questName: 'Daily: Win 3 Matches',
    questType: 'daily',
  },
});

console.log({
  xpAwarded: result.xpAwarded,       // 250 (before multipliers)
  effectiveXP: result.effectiveXP,   // 375 (with 1.5x catch-up)
  newTotalXP: result.newTotalXP,     // 12875
  previousTier: result.previousTier, // 12
  currentTier: result.currentTier,   // 13
  tierUnlocked: result.tierUnlocked, // true
  dailyXP: result.dailyXP,          // 3750
  dailyCapHit: result.dailyCapHit,  // false (cap: 5000)
  weeklyXP: result.weeklyXP,        // 18750
  weeklyCapHit: result.weeklyCapHit, // false (cap: 25000)
  newUnclaimedRewards: result.newUnclaimedRewards, // ['reward_tier13_free']
});

// Check XP caps before awarding
const canEarn = await xpService.canEarnXP({
  userId: 'user_xyz789',
  seasonId: season.id,
  ventureId: 'venture_abc123',
});

console.log({
  canEarnDaily: canEarn.dailyRemaining > 0,   // true
  dailyRemaining: canEarn.dailyRemaining,      // 1250
  canEarnWeekly: canEarn.weeklyRemaining > 0,  // true
  weeklyRemaining: canEarn.weeklyRemaining,    // 6250
  activeMultiplier: canEarn.activeMultiplier,   // 1.5 (catch-up)
  resetsIn: canEarn.dailyResetsIn,             // "4h 23m"
});

// Apply an XP boost item
await xpService.applyXPBoost({
  userId: 'user_xyz789',
  seasonId: season.id,
  ventureId: 'venture_abc123',
  multiplier: 2.0,
  durationMinutes: 60,
  sourceItemId: 'item_xp_boost_2x_1h',
  stackWithCatchUp: true, // Stacks: 2.0 * 1.5 = 3.0x total
});

// Get user's catch-up multiplier
const catchUp = await xpService.getCatchUpMultiplier({
  userId: 'user_xyz789',
  seasonId: season.id,
});

console.log({
  multiplier: catchUp.multiplier,        // 1.5
  reason: catchUp.reason,                // "Joined 45 days into 90-day season"
  seasonProgress: catchUp.seasonProgress, // 50% elapsed
  maxMultiplier: catchUp.maxMultiplier,  // 2.0
});
```

### Example 4: Purchasing a Premium Pass

```typescript
import { SeasonPassService } from '@mcv/engagement/seasons';
import { db } from '@mcv/db';

const passService = new SeasonPassService(db);

// Purchase premium pass with real currency
const purchase = await passService.purchasePass({
  userId: 'user_xyz789',
  seasonId: season.id,
  ventureId: 'venture_abc123',
  passId: premiumPass.id,
  paymentMethod: 'stripe',
  paymentToken: 'pi_3abc123def456', // Stripe PaymentIntent
});

console.log({
  purchaseId: purchase.id,
  track: purchase.track,                    // 'premium'
  bonusTiers: purchase.bonusTiersGranted,   // 5
  retroactiveRewards: purchase.retroactiveRewards, // ['reward_t1_prem', 'reward_t5_prem', ...]
  totalPaid: `${purchase.amount / 100} ${purchase.currency}`, // "9.99 USD"
});

// Purchase with platform tokens instead
const tokenPurchase = await passService.purchasePass({
  userId: 'user_xyz789',
  seasonId: season.id,
  ventureId: 'venture_abc123',
  passId: premiumPass.id,
  paymentMethod: 'platform_tokens',
  tokenAmount: 1000,
});

// Skip tiers (pay to advance)
const skipResult = await passService.skipTiers({
  userId: 'user_xyz789',
  seasonId: season.id,
  ventureId: 'venture_abc123',
  tiersToSkip: 5,
  paymentMethod: 'stripe',
  paymentToken: 'pi_4def789ghi012',
  pricePerTier: 150, // $1.50 per tier
});

console.log({
  tiersSkipped: skipResult.tiersSkipped,   // 5
  newTier: skipResult.newTier,             // 18
  totalPaid: skipResult.totalPaid,         // 750 ($7.50)
  newUnclaimedRewards: skipResult.newUnclaimedRewards.length, // 5
});
```

### Example 5: Managing Season Events

```typescript
import { SeasonEventService } from '@mcv/engagement/seasons';
import { db } from '@mcv/db';

const eventService = new SeasonEventService(db);

// Create a Double XP Weekend event
const doubleXPEvent = await eventService.createEvent({
  seasonId: season.id,
  ventureId: 'venture_abc123',
  eventType: 'xp_boost',
  name: 'Double XP Weekend',
  slug: 'double-xp-weekend-w3',
  description: 'Earn double XP on all activities this weekend!',
  startDate: new Date('2026-03-14T18:00:00Z'), // Friday 6 PM UTC
  endDate: new Date('2026-03-16T23:59:59Z'),   // Sunday midnight UTC
  config: {
    type: 'xp_boost',
    multiplier: 2.0,
    boostedSources: null, // All sources
    stacksWithPersonalBoost: true,
  },
  theme: {
    bannerUrl: 'https://cdn.mcv.one/events/double-xp-banner.webp',
    iconUrl: 'https://cdn.mcv.one/events/double-xp-icon.svg',
    accentColor: '#FFD700',
  },
  preAnnounce: true,
  preAnnounceDate: new Date('2026-03-12T12:00:00Z'), // Announce 2 days early
});

// Create a Flash Challenge event
const flashChallenge = await eventService.createEvent({
  seasonId: season.id,
  ventureId: 'venture_abc123',
  eventType: 'flash_challenge',
  name: 'Eclipse Rush',
  slug: 'eclipse-rush',
  description: 'Complete 3 special challenges in 24 hours for bonus rewards!',
  startDate: new Date('2026-03-20T12:00:00Z'),
  endDate: new Date('2026-03-21T12:00:00Z'),
  config: {
    type: 'flash_challenge',
    challengeIds: ['challenge_eclipse_1', 'challenge_eclipse_2', 'challenge_eclipse_3'],
    completionBonusXP: 2000,
    completionRewards: [
      {
        id: 'flash_reward_1',
        tierId: '',
        seasonId: season.id,
        track: 'free' as const,
        rewardType: 'badge' as const,
        rewardRefId: 'badge_eclipse_rush',
        quantity: 1,
        name: 'Eclipse Rush Badge',
        description: 'Completed the Eclipse Rush flash challenge',
        rarity: 'epic' as const,
        previewUrl: 'https://cdn.mcv.one/events/eclipse-rush-badge.webp',
        isExclusive: true,
        createdAt: new Date(),
      },
    ],
  },
  requiresOptIn: false,
});

// List active and upcoming events
const events = await eventService.listEvents({
  seasonId: season.id,
  status: ['scheduled', 'active'],
  orderBy: 'startDate',
  orderDir: 'asc',
});

console.log(`Upcoming/active events: ${events.length}`);
events.forEach(e => {
  console.log(`  ${e.name} (${e.eventType}) — ${e.status} — ${e.startDate.toISOString()}`);
});

// The scheduler automatically activates/ends events based on their dates
// But manual activation is also possible:
await eventService.activateEvent(doubleXPEvent.id);
await eventService.endEvent(doubleXPEvent.id);
```

### Example 6: Community Goals

```typescript
import { CommunityGoalService } from '@mcv/engagement/seasons';
import { db } from '@mcv/db';

const goalService = new CommunityGoalService(db);

// Create a venture-wide community goal
const communityGoal = await goalService.createGoal({
  seasonId: season.id,
  ventureId: 'venture_abc123',
  scope: 'venture',
  name: 'Eclipse Defense',
  description: 'The Eclipse army approaches! Collectively complete 100,000 quests to defend our realm.',
  bannerUrl: 'https://cdn.mcv.one/seasons/s3/community-goal-banner.webp',
  metricKey: 'quests_completed',
  metricLabel: 'Quests Completed',
  targetValue: 100_000,
  startDate: new Date('2026-03-15T00:00:00Z'),
  endDate: new Date('2026-04-15T00:00:00Z'),
  rewardTiers: [
    {
      tier: 1,
      thresholdPercent: 25,
      thresholdValue: 25_000,
      isReached: false,
      rewards: [
        { rewardType: 'currency', rewardRefId: 'coins', quantity: 500, name: '500 Coins', rarity: 'common' },
      ],
      description: 'The outer walls hold. Defenders receive 500 coins.',
    },
    {
      tier: 2,
      thresholdPercent: 50,
      thresholdValue: 50_000,
      isReached: false,
      rewards: [
        { rewardType: 'xp_boost', rewardRefId: 'xp_boost_1.5x_2h', quantity: 1, name: '1.5x XP Boost (2h)', rarity: 'uncommon' },
      ],
      description: 'The Eclipse army falters. All defenders gain an XP boost.',
    },
    {
      tier: 3,
      thresholdPercent: 75,
      thresholdValue: 75_000,
      isReached: false,
      rewards: [
        { rewardType: 'cosmetic', rewardRefId: 'avatar_frame_eclipse_defender', quantity: 1, name: 'Eclipse Defender Frame', rarity: 'rare' },
      ],
      description: 'Victory draws near. Earn the Eclipse Defender avatar frame.',
    },
    {
      tier: 4,
      thresholdPercent: 100,
      thresholdValue: 100_000,
      isReached: false,
      rewards: [
        { rewardType: 'title', rewardRefId: 'title_eclipse_champion', quantity: 1, name: 'Eclipse Champion Title', rarity: 'legendary' },
        { rewardType: 'cosmetic', rewardRefId: 'banner_eclipse_victory', quantity: 1, name: 'Eclipse Victory Banner', rarity: 'legendary' },
      ],
      description: 'Total victory! The Eclipse is defeated. Champions receive legendary rewards.',
    },
  ],
});

// Record a user's contribution (called by quest completion handler)
const contribution = await goalService.contribute({
  goalId: communityGoal.id,
  userId: 'user_xyz789',
  ventureId: 'venture_abc123',
  amount: 1,
  sourceAction: 'quest_completed',
  sourceRefId: 'quest_daily_001',
});

console.log({
  goalProgress: contribution.goalProgress,         // 45,231
  goalPercentage: contribution.goalPercentage,      // 45.23%
  tiersReached: contribution.newTiersReached,       // [1] (tier 1 was just reached)
  userTotalContributions: contribution.userTotal,   // 127
  contributorRank: contribution.contributorRank,    // #42
});

// Get community goal leaderboard
const leaderboard = await goalService.getLeaderboard({
  goalId: communityGoal.id,
  limit: 10,
});

leaderboard.entries.forEach((entry, i) => {
  console.log(`  #${i + 1}: ${entry.username} — ${entry.totalContributions} contributions`);
});

// Get goal progress with real-time updates
const progress = await goalService.getProgress(communityGoal.id);
console.log({
  name: progress.name,                    // "Eclipse Defense"
  currentValue: progress.currentValue,    // 45,231
  targetValue: progress.targetValue,      // 100,000
  progressPercent: progress.progressPercent, // 45.23
  contributorCount: progress.contributorCount, // 8,432
  currentTier: progress.currentTierReached,    // 1
  nextTierAt: progress.nextTierThreshold,      // 50,000 (50%)
  estimatedCompletionDate: progress.estimatedCompletionDate, // "2026-04-08"
  daysRemaining: progress.daysRemaining, // 22
  onTrack: progress.onTrack,             // true
});
```

### Example 7: Season Transitions and Grace Periods

```typescript
import { SeasonTransitionService } from '@mcv/engagement/seasons';
import { db } from '@mcv/db';

const transitionService = new SeasonTransitionService(db);

// Configure transition from Season 3 → Season 4
const transition = await transitionService.createTransition({
  fromSeasonId: season.id,
  toSeasonId: nextSeason.id, // Season 4
  ventureId: 'venture_abc123',
  gracePeriod: {
    durationDays: 14,
    allowRewardClaims: true,
    allowPassPurchase: true, // Allow late pass purchases during grace
    notifyOnStart: true,
    reminderDaysBeforeExpiry: [7, 3, 1], // Reminders at 7, 3, and 1 day before grace ends
  },
  unclaimedRewardPolicy: 'auto_claim', // Auto-claim unclaimed rewards to inventory
  carryover: {
    xpCarryoverPercent: 10,  // 10% of leftover XP carries to next season
    maxXPCarryover: 5000,     // Cap at 5000 XP carryover
    passCarryover: false,     // Must buy new pass for Season 4
    cosmeticsRetained: true,  // Keep earned cosmetics forever
    exclusiveItemsUsable: true, // Season-exclusive items stay usable
  },
  autoStartNextSeason: true,
  gapDays: 3, // 3-day gap between grace end and Season 4 start
});

// Execute the transition (called by scheduler when season ends)
const result = await transitionService.executeTransition(transition.id);

console.log({
  status: result.status,                       // 'completed'
  usersProcessed: result.usersProcessed,       // 15,432
  rewardsAutoClaimed: result.rewardsAutoClaimed, // 28,901
  xpCarriedOver: result.xpCarriedOver,         // { totalUsers: 12,100, totalXP: 48,500,000 }
  notificationsSent: result.notificationsSent, // 15,432
  nextSeasonScheduled: result.nextSeasonStartDate, // "2026-06-17T00:00:00Z"
  executionTimeMs: result.executionTimeMs,     // 45230
});

// Users can check their transition status
const userTransition = await transitionService.getUserTransitionStatus({
  userId: 'user_xyz789',
  transitionId: transition.id,
});

console.log({
  unclaimedRewards: userTransition.unclaimedRewards.length, // 3
  autoClaimedRewards: userTransition.autoClaimedRewards.length, // 3
  xpCarriedOver: userTransition.xpCarriedOver, // 1500
  graceEndsAt: userTransition.graceEndsAt,     // "2026-06-14T23:59:59Z"
  daysRemaining: userTransition.graceDaysRemaining, // 5
});
```

### Example 8: Season Analytics and Reporting

```typescript
import { SeasonAnalyticsService } from '@mcv/engagement/seasons';
import { db } from '@mcv/db';

const analyticsService = new SeasonAnalyticsService(db);

// Generate a real-time analytics snapshot
const analytics = await analyticsService.generateSnapshot({
  seasonId: season.id,
  ventureId: 'venture_abc123',
});

// Engagement overview
console.log('=== ENGAGEMENT ===');
console.log(`Total participants: ${analytics.engagement.totalParticipants.toLocaleString()}`);
console.log(`Active participants: ${analytics.engagement.activeParticipants.toLocaleString()}`);
console.log(`Avg DAU: ${analytics.engagement.averageDAU.toLocaleString()}`);
console.log(`Retention: ${(analytics.engagement.retentionRate * 100).toFixed(1)}%`);
console.log(`Churn: ${(analytics.engagement.churnRate * 100).toFixed(1)}%`);

// Battle pass performance
console.log('\n=== BATTLE PASS ===');
console.log(`Premium purchases: ${analytics.battlePass.premiumPurchases.toLocaleString()}`);
console.log(`Purchase rate: ${(analytics.battlePass.purchaseRate * 100).toFixed(1)}%`);
console.log(`Avg tier (all): ${analytics.battlePass.averageTier.toFixed(1)}`);
console.log(`Avg tier (premium): ${analytics.battlePass.averagePremiumTier.toFixed(1)}`);
console.log(`Completion rate: ${(analytics.battlePass.completionRate * 100).toFixed(1)}%`);
console.log(`Tier skips purchased: ${analytics.battlePass.tierSkipsPurchased.toLocaleString()}`);

// Revenue breakdown
console.log('\n=== REVENUE ===');
console.log(`Total: $${(analytics.revenue.totalRevenue / 100).toLocaleString()}`);
console.log(`  Pass sales: $${(analytics.revenue.breakdown.passPurchases / 100).toLocaleString()}`);
console.log(`  Tier skips: $${(analytics.revenue.breakdown.tierSkips / 100).toLocaleString()}`);
console.log(`  Limited drops: $${(analytics.revenue.breakdown.limitedDrops / 100).toLocaleString()}`);
console.log(`ARPU: $${(analytics.revenue.revenuePerActiveUser / 100).toFixed(2)}`);
console.log(`ARPPU: $${(analytics.revenue.revenuePerPayingUser / 100).toFixed(2)}`);
console.log(`Payer conversion: ${(analytics.revenue.payerConversionRate * 100).toFixed(1)}%`);

// Tier distribution histogram
console.log('\n=== TIER DISTRIBUTION ===');
const tiers = analytics.battlePass.tierDistribution;
const maxCount = Math.max(...tiers.map(t => t.userCount));
for (const tier of tiers.filter(t => t.tier % 10 === 0 || t.tier === 1)) {
  const barLength = Math.round((tier.userCount / maxCount) * 40);
  const bar = '█'.repeat(barLength);
  console.log(`  Tier ${String(tier.tier).padStart(3)}: ${bar} ${tier.userCount.toLocaleString()} (${tier.percentage.toFixed(1)}%)`);
}

// Compare with previous seasons
const comparison = await analyticsService.compareSeasons({
  seasonIds: [previousSeason.id, season.id],
  ventureId: 'venture_abc123',
  metrics: ['purchaseRate', 'completionRate', 'averageTier', 'totalRevenue', 'retentionRate'],
});

console.log('\n=== SEASON COMPARISON ===');
comparison.metrics.forEach(metric => {
  const prev = metric.values[0];
  const current = metric.values[1];
  const change = ((current - prev) / prev * 100).toFixed(1);
  const arrow = current > prev ? '↑' : current < prev ? '↓' : '→';
  console.log(`  ${metric.label}: ${prev} → ${current} (${arrow} ${change}%)`);
});

// Export analytics to CSV for further analysis
const csvExport = await analyticsService.exportToCSV({
  seasonId: season.id,
  ventureId: 'venture_abc123',
  includeUserLevel: true, // Per-user tier/XP data
  includeDaily: true,     // Daily engagement breakdown
});

console.log(`Exported to: ${csvExport.filePath}`);
// => Exported to: /exports/season_s3_analytics_2026-05-31.csv
```

---

## Error Codes

All errors follow the MCV error envelope format with the `SEASON_` prefix.

| Code | HTTP | Description | Resolution |
|---|---|---|---|
| `SEASON_NOT_FOUND` | 404 | Season with the given ID does not exist or is not accessible | Verify the season ID and venture context |
| `SEASON_INVALID_STATUS` | 400 | Operation not allowed in the current season status | Check `VALID_TRANSITIONS` for allowed state changes |
| `SEASON_ALREADY_ACTIVE` | 409 | Venture already has an active season; cannot activate another | End or archive the current active season first |
| `SEASON_DATE_CONFLICT` | 409 | Season dates overlap with another season in the same venture | Adjust start/end dates to avoid overlap |
| `SEASON_VALIDATION_FAILED` | 400 | Season configuration failed validation (missing tiers, rewards, etc.) | Check the `errors` array in the response for specifics |
| `SEASON_NOT_ACTIVE` | 400 | Operation requires an active season but the season is not active | Wait for the season to start or check the season status |
| `SEASON_ENDED` | 410 | Season has ended and the grace period has expired | No further interactions possible with this season |
| `SEASON_IN_GRACE_PERIOD` | 400 | Season is in grace period; only reward claims are allowed | Claim rewards before the grace period expires |
| `PASS_NOT_FOUND` | 404 | Season pass with the given ID does not exist | Verify the pass ID |
| `PASS_ALREADY_OWNED` | 409 | User already owns this pass track for this season | No action needed; user already has access |
| `PASS_NOT_AVAILABLE` | 400 | Pass is not currently available for purchase | Check `availableForPurchase` flag and season status |
| `PASS_PURCHASE_LIMIT` | 429 | Pass has reached its maximum purchase limit | No more passes available for this tier |
| `PASS_PAYMENT_FAILED` | 402 | Payment processing failed for pass purchase | Verify payment method and retry |
| `TIER_NOT_FOUND` | 404 | Tier with the given number does not exist in this season | Verify tier number is within range (1 to totalTiers) |
| `TIER_NOT_REACHED` | 400 | User has not reached the required tier to claim this reward | Earn more XP to reach the required tier |
| `TIER_REWARD_ALREADY_CLAIMED` | 409 | User has already claimed this tier reward | No action needed; reward already in inventory |
| `TIER_SKIP_LIMIT` | 400 | Cannot skip beyond the maximum tier | User is already at or near the maximum tier |
| `XP_DAILY_CAP_REACHED` | 429 | User has reached the daily XP earning cap | Try again after the daily reset (midnight UTC) |
| `XP_WEEKLY_CAP_REACHED` | 429 | User has reached the weekly XP earning cap | Try again after the weekly reset (Monday midnight UTC) |
| `XP_INVALID_AMOUNT` | 400 | XP amount must be a positive integer | Provide a valid positive integer XP amount |
| `XP_SOURCE_INVALID` | 400 | Unknown XP source identifier | Use a registered XP source key |
| `XP_BOOST_ALREADY_ACTIVE` | 409 | User already has an active XP boost | Wait for the current boost to expire or stack if allowed |
| `EVENT_NOT_FOUND` | 404 | Season event with the given ID does not exist | Verify the event ID |
| `EVENT_NOT_ACTIVE` | 400 | Event is not currently active | Check the event schedule |
| `EVENT_DATE_INVALID` | 400 | Event dates are outside the parent season's date range | Ensure event dates fall within the season window |
| `EVENT_CANCELLED` | 410 | Event has been cancelled | No further participation possible |
| `EVENT_FULL` | 409 | Event has reached its maximum participant limit | Event is at capacity; try the next one |
| `COMMUNITY_GOAL_NOT_FOUND` | 404 | Community goal with the given ID does not exist | Verify the goal ID |
| `COMMUNITY_GOAL_COMPLETED` | 409 | Community goal has already been completed | Goal reached its target; rewards are being distributed |
| `COMMUNITY_GOAL_ENDED` | 410 | Community goal has ended without reaching its target | Goal window has closed |
| `COMMUNITY_GOAL_INVALID_CONTRIBUTION` | 400 | Contribution amount must be a positive number | Provide a valid positive contribution amount |
| `REWARD_NOT_FOUND` | 404 | Reward with the given ID does not exist | Verify the reward ID |
| `REWARD_DISTRIBUTION_FAILED` | 500 | Failed to distribute reward to user inventory | Check reward service connectivity; will be retried |
| `TRANSITION_NOT_FOUND` | 404 | Season transition record not found | Verify the transition ID |
| `TRANSITION_ALREADY_EXECUTED` | 409 | Season transition has already been executed | Transition is a one-time operation per season pair |
| `TRANSITION_IN_PROGRESS` | 409 | Season transition is currently being executed | Wait for the current execution to complete |
| `CROSS_VENTURE_SEASON_NOT_FOUND` | 404 | Cross-venture season not found | Verify the cross-venture season ID |
| `CROSS_VENTURE_ALREADY_JOINED` | 409 | Venture is already participating in this cross-venture season | No action needed |
| `INSUFFICIENT_PERMISSIONS` | 403 | User does not have permission for this season operation | Requires admin or owner role |

### Error Response Format

```typescript
interface SeasonError {
  code: string;          // e.g., "SEASON_NOT_FOUND"
  message: string;       // Human-readable message
  statusCode: number;    // HTTP status code
  details?: {
    seasonId?: string;
    ventureId?: string;
    currentStatus?: SeasonStatus;
    allowedStatuses?: SeasonStatus[];
    field?: string;
    constraint?: string;
    [key: string]: unknown;
  };
}

// Example error response
{
  "code": "SEASON_ALREADY_ACTIVE",
  "message": "Venture 'venture_abc123' already has an active season 'Neon Uprising' (season_456). End or archive it before activating another.",
  "statusCode": 409,
  "details": {
    "ventureId": "venture_abc123",
    "activeSeasonId": "season_456",
    "activeSeasonName": "Neon Uprising",
    "requestedSeasonId": "season_789"
  }
}
```

---

## Security

### Authentication & Authorization

All season endpoints require authentication. Administrative operations require elevated roles.

| Operation | Required Role | Notes |
|---|---|---|
| View season metadata | `member` | Public season info (name, theme, dates) |
| View own progress | `member` | Users can only see their own progress |
| Earn XP | `member` | Via authenticated gameplay actions |
| Claim rewards | `member` | Only for tiers the user has reached |
| Purchase pass | `member` | Requires valid payment method |
| Skip tiers | `member` | Requires valid payment method |
| Contribute to goals | `member` | Via authenticated actions |
| Create/edit season | `admin` | Full season management |
| Publish/activate season | `admin` | Lifecycle state transitions |
| Create events | `admin` | Event scheduling and management |
| Create community goals | `admin` | Goal creation and configuration |
| View all user progress | `admin` | For moderation and support |
| View analytics | `admin` | Season performance data |
| Configure transitions | `admin` | End-of-season policies |
| Execute transitions | `owner` | Destructive operation (archives data) |
| Manage cross-venture seasons | `platform_admin` | Platform-level operation |

### Row-Level Security (RLS)

All tables enforce RLS to ensure multi-tenant isolation:

```sql
-- Standard venture isolation pattern applied to all season tables
-- Users can only see data for their current venture context

-- Set via Supabase auth context:
SET app.current_venture_id = '<venture_uuid>';
SET app.current_user_id = '<user_uuid>';
SET app.current_user_role = '<role>';
```

**Critical RLS rules:**

1. **Season data**: Venture-scoped read for all members; write restricted to admins
2. **User progress**: Users can only read their own progress; admins can read all within their venture
3. **Purchases**: Users can only see their own purchases; admins can see all within their venture
4. **Community goals**: Venture-scoped read; contributions write requires authenticated user context
5. **Archives**: Read-only for all venture members; creation restricted to admin/system

### Input Validation

All inputs are validated using Zod schemas before processing:

```typescript
import { z } from 'zod';

const createSeasonSchema = z.object({
  ventureId: z.string().uuid(),
  name: z.string().min(1).max(100).trim(),
  tagline: z.string().max(200).optional(),
  description: z.string().max(10000).optional(),
  theme: seasonThemeSchema,
  startDate: z.date().min(new Date(), 'Start date must be in the future'),
  endDate: z.date(),
  gracePeriodDays: z.number().int().min(0).max(30).default(7),
  totalTiers: z.number().int().min(10).max(500).default(100),
  xpConfig: xpConfigSchema,
}).refine(
  data => data.endDate > data.startDate,
  { message: 'End date must be after start date', path: ['endDate'] }
).refine(
  data => {
    const durationDays = (data.endDate.getTime() - data.startDate.getTime()) / (1000 * 60 * 60 * 24);
    return durationDays >= 14 && durationDays <= 365;
  },
  { message: 'Season duration must be between 14 and 365 days', path: ['endDate'] }
);

const xpAmountSchema = z.number()
  .int()
  .positive('XP amount must be positive')
  .max(100000, 'XP amount cannot exceed 100,000 per action');
```

### Rate Limiting

| Endpoint | Rate Limit | Window |
|---|---|---|
| XP accrual | 60 requests | Per minute per user |
| Reward claims | 30 requests | Per minute per user |
| Pass purchases | 5 requests | Per minute per user |
| Tier skips | 10 requests | Per minute per user |
| Community contributions | 120 requests | Per minute per user |
| Analytics queries | 10 requests | Per minute per admin |

### Anti-Cheat Measures

```typescript
/**
 * XP award requests go through server-side validation:
 *
 * 1. Source verification — XP can only come from registered sources
 *    (quest system, event system, etc.). Direct XP injection is not possible.
 *
 * 2. Cap enforcement — Daily and weekly caps are enforced server-side.
 *    Client-reported XP is never trusted.
 *
 * 3. Velocity checks — Sudden spikes in XP earning rate trigger
 *    automatic review flags for admin investigation.
 *
 * 4. Idempotency — Each XP award is tied to a sourceRefId. Duplicate
 *    source refs for the same user are rejected (no double-counting).
 *
 * 5. Audit trail — All XP transactions are logged with full provenance
 *    (source, timestamp, multipliers applied, pre/post state).
 */
```

### Payment Security

- All monetary transactions go through Stripe (or configured payment provider)
- Payment tokens are never stored in season tables — only external transaction IDs
- Purchases are idempotent: duplicate payment intents are detected and rejected
- Refunds are tracked in `season_purchases.refundedAt` with the refund amount
- Token payments are validated against the platform wallet service before processing
- All purchase operations use database transactions with serializable isolation

---

## Environment Variables

| Variable | Type | Default | Description |
|---|---|---|---|
| `SEASON_MAX_ACTIVE_PER_VENTURE` | `number` | `1` | Maximum concurrent active seasons per venture |
| `SEASON_DEFAULT_GRACE_PERIOD_DAYS` | `number` | `7` | Default grace period when not specified |
| `SEASON_DEFAULT_TOTAL_TIERS` | `number` | `100` | Default number of tiers when not specified |
| `SEASON_MAX_TIERS` | `number` | `500` | Maximum allowed tiers per season |
| `SEASON_MIN_DURATION_DAYS` | `number` | `14` | Minimum season duration in days |
| `SEASON_MAX_DURATION_DAYS` | `number` | `365` | Maximum season duration in days |
| `SEASON_DEFAULT_DAILY_XP_CAP` | `number` | `5000` | Default daily XP cap |
| `SEASON_DEFAULT_WEEKLY_XP_CAP` | `number` | `25000` | Default weekly XP cap |
| `SEASON_MAX_XP_PER_ACTION` | `number` | `100000` | Maximum XP awardable in a single action |
| `SEASON_CATCHUP_ENABLED` | `boolean` | `true` | Whether catch-up mechanics are enabled by default |
| `SEASON_MAX_CATCHUP_MULTIPLIER` | `number` | `2.0` | Maximum catch-up XP multiplier |
| `SEASON_XP_BOOST_MAX_STACK` | `number` | `3.0` | Maximum combined XP multiplier (all boosts) |
| `SEASON_TIER_SKIP_PRICE_CENTS` | `number` | `150` | Default price per tier skip in cents |
| `SEASON_TIER_SKIP_MAX_BATCH` | `number` | `25` | Maximum tiers skippable in a single purchase |
| `SEASON_EVENT_MAX_PER_SEASON` | `number` | `50` | Maximum events per season |
| `SEASON_COMMUNITY_GOAL_MAX_PER_SEASON` | `number` | `10` | Maximum community goals per season |
| `SEASON_ARCHIVE_RETENTION_DAYS` | `number` | `730` | Days to retain archived season data (2 years) |
| `SEASON_SCHEDULER_CRON` | `string` | `*/5 * * * *` | Cron expression for the season scheduler (every 5 min) |
| `SEASON_ANALYTICS_CACHE_TTL` | `number` | `300` | Analytics cache TTL in seconds |
| `SEASON_REDPANDA_TOPIC_PREFIX` | `string` | `engagement.seasons` | Redpanda topic prefix for season events |
| `SEASON_CDN_BASE_URL` | `string` | — | Base URL for season asset CDN |
| `SEASON_PAYMENT_PROVIDER` | `string` | `stripe` | Payment provider for pass/skip purchases |
| `STRIPE_SECRET_KEY` | `string` | — | Stripe API secret key (for payment processing) |
| `SEASON_TRANSITION_BATCH_SIZE` | `number` | `1000` | Batch size for processing users during season transitions |
| `SEASON_TRANSITION_CONCURRENCY` | `number` | `5` | Number of concurrent batch workers during transitions |

---

## Dependencies

### Internal Dependencies

| Package | Version | Purpose |
|---|---|---|
| `@mcv/db` | `workspace:*` | Drizzle ORM database client, schema definitions, migrations |
| `@mcv/auth` | `workspace:*` | Authentication context, session management, role checks |
| `@mcv/rpc` | `workspace:*` | tRPC router setup, middleware, error handling |
| `@mcv/events` | `workspace:*` | Redpanda event producer/consumer, topic management |
| `@mcv/scheduler` | `workspace:*` | Cron job registration, scheduling infrastructure |
| `@mcv/payments` | `workspace:*` | Stripe integration, payment processing, refund handling |
| `@mcv/inventory` | `workspace:*` | User inventory service for reward distribution |
| `@mcv/notifications` | `workspace:*` | Push/email notifications for season events and transitions |
| `@mcv/analytics` | `workspace:*` | Analytics pipeline, metric aggregation, data export |
| `@mcv/cache` | `workspace:*` | Redis/Upstash caching for hot season data |
| `@mcv/config` | `workspace:*` | Environment variable validation and typed config |
| `@mcv/errors` | `workspace:*` | Standardized error envelope, error codes, HTTP mapping |
| `@mcv/logger` | `workspace:*` | Structured logging with context propagation |
| `@mcv/validation` | `workspace:*` | Zod schema utilities, shared validation patterns |
| `@mcv/engagement/xp` | `workspace:*` | Base XP system (lifetime XP, level calculation) |
| `@mcv/engagement/quests` | `workspace:*` | Quest completion events that feed season XP |
| `@mcv/engagement/achievements` | `workspace:*` | Achievement triggers from season milestones |
| `@mcv/engagement/rewards` | `workspace:*` | Reward catalog, reward fulfillment pipeline |
| `@mcv/engagement/leaderboards` | `workspace:*` | Leaderboard service for season rankings |

### External Dependencies

| Package | Version | Purpose |
|---|---|---|
| `drizzle-orm` | `^0.36.x` | PostgreSQL ORM for type-safe database queries |
| `@trpc/server` | `^11.x` | tRPC server framework for API endpoints |
| `zod` | `^3.23.x` | Runtime schema validation for all inputs |
| `date-fns` | `^4.x` | Date manipulation, formatting, and timezone handling |
| `cron-parser` | `^4.x` | Cron expression parsing for scheduler validation |
| `stripe` | `^17.x` | Stripe SDK for payment processing |
| `kafkajs` | `^2.x` | Redpanda/Kafka client for event production/consumption |
| `ioredis` | `^5.x` | Redis client for caching season state |
| `nanoid` | `^5.x` | Compact unique ID generation for slugs |
| `p-queue` | `^8.x` | Promise queue for controlled concurrency in batch operations |
| `csv-stringify` | `^6.x` | CSV generation for analytics exports |

### Peer Dependencies

| Package | Version | Notes |
|---|---|---|
| `@supabase/supabase-js` | `^2.x` | Supabase client (provided by host application) |
| `typescript` | `^5.5.x` | TypeScript compiler (development only) |

---

## Testing

### Test Structure

```
tests/
├── unit/
│   ├── season-service.test.ts         # Season CRUD and lifecycle
│   ├── season-pass-service.test.ts    # Pass management and purchases
│   ├── season-xp-service.test.ts      # XP accrual, caps, boosts
│   ├── season-event-service.test.ts   # Event scheduling and lifecycle
│   ├── community-goal-service.test.ts # Community goals and contributions
│   ├── season-reward-service.test.ts  # Reward distribution pipeline
│   ├── season-transition-service.test.ts # Transition execution
│   ├── season-analytics-service.test.ts  # Analytics generation
│   ├── xp-curve.test.ts              # XP curve calculation utilities
│   ├── catch-up.test.ts              # Catch-up multiplier calculations
│   └── validators.test.ts            # Zod schema validation
├── integration/
│   ├── season-lifecycle.test.ts       # Full lifecycle: draft → archived
│   ├── battle-pass-flow.test.ts       # Purchase → progress → claim → complete
│   ├── xp-flow.test.ts               # XP earning with caps, boosts, catch-up
│   ├── event-flow.test.ts            # Event creation → activation → end
│   ├── community-goal-flow.test.ts   # Goal creation → contributions → completion
│   ├── transition-flow.test.ts       # Season end → grace → transition → archive
│   ├── cross-venture-flow.test.ts    # Cross-venture season participation
│   ├── payment-flow.test.ts          # Pass purchase with Stripe mock
│   └── rls-isolation.test.ts         # Multi-tenant data isolation
├── e2e/
│   ├── season-api.test.ts            # Full API flow via tRPC client
│   ├── scheduler.test.ts             # Cron-triggered season activations
│   └── concurrent-xp.test.ts         # Race conditions in XP accrual
└── fixtures/
    ├── seasons.ts                     # Test season configurations
    ├── passes.ts                      # Test pass/tier/reward templates
    ├── users.ts                       # Test user profiles
    └── events.ts                      # Test event configurations
```

### Running Tests

```bash
# Run all season tests
pnpm test --filter @mcv/engagement/seasons

# Run unit tests only
pnpm test --filter @mcv/engagement/seasons -- --testPathPattern=unit

# Run integration tests (requires test database)
pnpm test --filter @mcv/engagement/seasons -- --testPathPattern=integration

# Run e2e tests (requires full stack)
pnpm test:e2e --filter @mcv/engagement/seasons

# Run with coverage
pnpm test --filter @mcv/engagement/seasons -- --coverage

# Run a specific test file
pnpm test --filter @mcv/engagement/seasons -- season-xp-service.test.ts
```

### Key Test Scenarios

#### Season Lifecycle Tests

```typescript
describe('SeasonService', () => {
  describe('lifecycle', () => {
    it('should create a season in draft status', async () => {
      const season = await seasonService.createSeason(testSeasonInput);
      expect(season.status).toBe('draft');
      expect(season.seasonNumber).toBe(1);
    });

    it('should auto-increment season number within a venture', async () => {
      await seasonService.createSeason({ ...testSeasonInput, name: 'Season 1' });
      const s2 = await seasonService.createSeason({ ...testSeasonInput, name: 'Season 2' });
      expect(s2.seasonNumber).toBe(2);
    });

    it('should transition draft → scheduled on publish', async () => {
      const season = await seasonService.createSeason(testSeasonInput);
      const published = await seasonService.publishSeason(season.id);
      expect(published.status).toBe('scheduled');
    });

    it('should reject publishing a season with no tiers configured', async () => {
      const season = await seasonService.createSeason({ ...testSeasonInput, totalTiers: 0 });
      await expect(seasonService.publishSeason(season.id))
        .rejects.toThrow('SEASON_VALIDATION_FAILED');
    });

    it('should reject activating a second season in the same venture', async () => {
      await activateTestSeason(); // First season active
      const s2 = await seasonService.createSeason(testSeasonInput2);
      await seasonService.publishSeason(s2.id);
      await expect(seasonService.activateSeason(s2.id))
        .rejects.toThrow('SEASON_ALREADY_ACTIVE');
    });

    it('should emit SEASON_STARTED event on activation', async () => {
      const season = await createAndPublishSeason();
      await seasonService.activateSeason(season.id);
      expect(mockEventProducer.publish).toHaveBeenCalledWith(
        'engagement.seasons.started',
        expect.objectContaining({ seasonId: season.id })
      );
    });

    it('should enforce valid state transitions', async () => {
      const season = await seasonService.createSeason(testSeasonInput);
      // Cannot go directly from draft to active
      await expect(seasonService.activateSeason(season.id))
        .rejects.toThrow('SEASON_INVALID_STATUS');
    });

    it('should prevent date overlap between seasons', async () => {
      await createSeasonWithDates('2026-03-01', '2026-05-31');
      await expect(
        seasonService.createSeason({
          ...testSeasonInput,
          startDate: new Date('2026-04-01'),
          endDate: new Date('2026-06-30'),
        })
      ).rejects.toThrow('SEASON_DATE_CONFLICT');
    });
  });
});
```

#### XP System Tests

```typescript
describe('SeasonXPService', () => {
  describe('awardXP', () => {
    it('should award XP and update progress', async () => {
      const result = await xpService.awardXP({
        userId: testUser.id,
        seasonId: testSeason.id,
        ventureId: testVenture.id,
        amount: 500,
        source: 'quest_completion',
        sourceRefId: 'quest_1',
      });

      expect(result.effectiveXP).toBe(500);
      expect(result.newTotalXP).toBe(500);
      expect(result.currentTier).toBe(1);
    });

    it('should apply catch-up multiplier for late joiners', async () => {
      // Simulate joining halfway through the season
      await setSeasonProgress(50); // 50% elapsed
      const result = await xpService.awardXP({
        userId: lateJoiner.id,
        seasonId: testSeason.id,
        ventureId: testVenture.id,
        amount: 500,
        source: 'quest_completion',
        sourceRefId: 'quest_2',
      });

      // 500 * 1.5 catch-up = 750 effective XP
      expect(result.effectiveXP).toBe(750);
    });

    it('should enforce daily XP cap', async () => {
      // Earn up to the daily cap
      await earnXP(4800); // Close to 5000 cap
      const result = await xpService.awardXP({
        userId: testUser.id,
        seasonId: testSeason.id,
        ventureId: testVenture.id,
        amount: 500,
        source: 'quest_completion',
        sourceRefId: 'quest_capped',
      });

      // Only 200 of the 500 should be awarded (cap at 5000)
      expect(result.effectiveXP).toBe(200);
      expect(result.dailyCapHit).toBe(true);
    });

    it('should reject duplicate sourceRefId for same user', async () => {
      await xpService.awardXP({
        userId: testUser.id,
        seasonId: testSeason.id,
        ventureId: testVenture.id,
        amount: 100,
        source: 'quest_completion',
        sourceRefId: 'quest_duplicate',
      });

      // Same sourceRefId should be rejected
      await expect(
        xpService.awardXP({
          userId: testUser.id,
          seasonId: testSeason.id,
          ventureId: testVenture.id,
          amount: 100,
          source: 'quest_completion',
          sourceRefId: 'quest_duplicate',
        })
      ).rejects.toThrow('XP_SOURCE_INVALID');
    });

    it('should stack XP boost with catch-up multiplier', async () => {
      await setSeasonProgress(50); // 1.5x catch-up
      await xpService.applyXPBoost({
        userId: testUser.id,
        seasonId: testSeason.id,
        ventureId: testVenture.id,
        multiplier: 2.0,
        durationMinutes: 60,
        sourceItemId: 'boost_item_1',
        stackWithCatchUp: true,
      });

      const result = await xpService.awardXP({
        userId: testUser.id,
        seasonId: testSeason.id,
        ventureId: testVenture.id,
        amount: 100,
        source: 'quest_completion',
        sourceRefId: 'quest_boosted',
      });

      // 100 * 2.0 (boost) * 1.5 (catch-up) = 300
      expect(result.effectiveXP).toBe(300);
    });

    it('should cap total multiplier at SEASON_XP_BOOST_MAX_STACK', async () => {
      // Even if multipliers would stack to 4.5x, cap at 3.0x
      await setSeasonProgress(75); // 1.75x catch-up
      await xpService.applyXPBoost({
        userId: testUser.id,
        seasonId: testSeason.id,
        ventureId: testVenture.id,
        multiplier: 2.0,
        durationMinutes: 60,
        sourceItemId: 'boost_item_2',
        stackWithCatchUp: true,
      });

      const result = await xpService.awardXP({
        userId: testUser.id,
        seasonId: testSeason.id,
        ventureId: testVenture.id,
        amount: 100,
        source: 'quest_completion',
        sourceRefId: 'quest_max_stack',
      });

      // 2.0 * 1.75 = 3.5 → capped at 3.0 → 100 * 3.0 = 300
      expect(result.effectiveXP).toBe(300);
    });
  });

  describe('tier progression', () => {
    it('should unlock tier and mark rewards as unclaimed', async () => {
      // Tier 2 requires 1000 XP
      const result = await xpService.awardXP({
        userId: testUser.id,
        seasonId: testSeason.id,
        ventureId: testVenture.id,
        amount: 1200,
        source: 'quest_completion',
        sourceRefId: 'quest_tier_up',
      });

      expect(result.currentTier).toBe(2);
      expect(result.tierUnlocked).toBe(true);
      expect(result.newUnclaimedRewards.length).toBeGreaterThan(0);
    });

    it('should emit TIER_UNLOCKED event', async () => {
      await xpService.awardXP({
        userId: testUser.id,
        seasonId: testSeason.id,
        ventureId: testVenture.id,
        amount: 1200,
        source: 'quest_completion',
        sourceRefId: 'quest_tier_event',
      });

      expect(mockEventProducer.publish).toHaveBeenCalledWith(
        'engagement.seasons.tier.unlocked',
        expect.objectContaining({
          userId: testUser.id,
          tier: 2,
        })
      );
    });

    it('should skip multiple tiers if XP is sufficient', async () => {
      // Award enough XP to jump from tier 0 to tier 5
      const result = await xpService.awardXP({
        userId: testUser.id,
        seasonId: testSeason.id,
        ventureId: testVenture.id,
        amount: 10000,
        source: 'bonus',
        sourceRefId: 'big_bonus',
      });

      expect(result.currentTier).toBeGreaterThanOrEqual(5);
      expect(result.newUnclaimedRewards.length).toBeGreaterThan(1);
    });
  });
});
```

#### Community Goal Tests

```typescript
describe('CommunityGoalService', () => {
  it('should track contributions and update goal progress', async () => {
    const goal = await goalService.createGoal(testGoalInput);

    await goalService.contribute({
      goalId: goal.id,
      userId: testUser.id,
      ventureId: testVenture.id,
      amount: 5,
      sourceAction: 'quest_completed',
    });

    const progress = await goalService.getProgress(goal.id);
    expect(progress.currentValue).toBe(5);
    expect(progress.contributorCount).toBe(1);
  });

  it('should trigger tier rewards when thresholds are crossed', async () => {
    const goal = await goalService.createGoal({
      ...testGoalInput,
      targetValue: 100,
      rewardTiers: [
        { tier: 1, thresholdPercent: 50, thresholdValue: 50, isReached: false, rewards: [testReward], description: null },
      ],
    });

    // Contribute past the 50% threshold
    await contributeAmount(goal.id, 55);

    const progress = await goalService.getProgress(goal.id);
    expect(progress.currentTierReached).toBe(1);
    expect(mockEventProducer.publish).toHaveBeenCalledWith(
      'engagement.seasons.community.progress',
      expect.objectContaining({ tier: 1 })
    );
  });

  it('should mark goal as completed at 100%', async () => {
    const goal = await goalService.createGoal({
      ...testGoalInput,
      targetValue: 100,
    });

    await contributeAmount(goal.id, 100);

    const progress = await goalService.getProgress(goal.id);
    expect(progress.isCompleted).toBe(true);
    expect(progress.completedAt).not.toBeNull();
    expect(mockEventProducer.publish).toHaveBeenCalledWith(
      'engagement.seasons.community.completed',
      expect.objectContaining({ goalId: goal.id })
    );
  });

  it('should not accept contributions after goal ends', async () => {
    const goal = await createExpiredGoal();
    await expect(
      goalService.contribute({
        goalId: goal.id,
        userId: testUser.id,
        ventureId: testVenture.id,
        amount: 1,
        sourceAction: 'quest_completed',
      })
    ).rejects.toThrow('COMMUNITY_GOAL_ENDED');
  });

  it('should generate an accurate leaderboard', async () => {
    const goal = await goalService.createGoal(testGoalInput);

    await goalService.contribute({ goalId: goal.id, userId: 'user_a', ventureId: testVenture.id, amount: 50, sourceAction: 'quest' });
    await goalService.contribute({ goalId: goal.id, userId: 'user_b', ventureId: testVenture.id, amount: 30, sourceAction: 'quest' });
    await goalService.contribute({ goalId: goal.id, userId: 'user_c', ventureId: testVenture.id, amount: 75, sourceAction: 'quest' });

    const leaderboard = await goalService.getLeaderboard({ goalId: goal.id, limit: 10 });

    expect(leaderboard.entries[0].userId).toBe('user_c');
    expect(leaderboard.entries[0].totalContributions).toBe(75);
    expect(leaderboard.entries[1].userId).toBe('user_a');
    expect(leaderboard.entries[2].userId).toBe('user_b');
  });
});
```

#### Multi-Tenant Isolation Tests

```typescript
describe('RLS Isolation', () => {
  it('should prevent cross-venture season access', async () => {
    const seasonA = await createSeasonForVenture('venture_a');
    await setVentureContext('venture_b');

    const result = await seasonService.getSeason(seasonA.id);
    expect(result).toBeNull(); // Not visible from venture_b
  });

  it('should prevent cross-venture progress access', async () => {
    await setVentureContext('venture_a');
    await xpService.awardXP({
      userId: testUser.id,
      seasonId: seasonA.id,
      ventureId: 'venture_a',
      amount: 100,
      source: 'test',
      sourceRefId: 'test_1',
    });

    await setVentureContext('venture_b');
    const progress = await seasonService.getUserProgress(seasonA.id, testUser.id);
    expect(progress).toBeNull();
  });

  it('should isolate purchase records between ventures', async () => {
    await setVentureContext('venture_a');
    await purchasePassForUser(testUser.id, seasonA.id);

    await setVentureContext('venture_b');
    const purchases = await db.select().from(seasonPurchases).where(
      eq(seasonPurchases.userId, testUser.id)
    );
    expect(purchases).toHaveLength(0);
  });
});
```

### Coverage Requirements

| Area | Minimum Coverage | Notes |
|---|---|---|
| Season lifecycle | 95% | Critical business logic |
| XP accrual | 95% | Financial implications (affects pass value) |
| Payment flows | 95% | Monetary transactions |
| Reward distribution | 90% | Must not lose or duplicate rewards |
| Community goals | 90% | High-visibility feature |
| Event system | 85% | Scheduling and activation |
| Analytics | 80% | Aggregation correctness |
| Transition logic | 90% | Data integrity during migration |
| RLS policies | 100% | Security-critical |
| Validators | 90% | Input sanitization |

---

## Appendix

### XP Curve Visualization

For the default configuration (`baseCost=1000, linearIncrement=50, curveStart=30, exponent=1.5, factor=10`):

```
Tier    XP Required (cumulative)    XP This Tier
 1            0                       1,000
 5        4,400                       1,200
10        9,750                       1,450
20       23,500                       1,950
30       42,250                       2,000
40       64,192                       2,319
50       90,754                       2,656
60      122,521                       3,000 (capped)
70      159,521                       3,000 (capped)
80      196,521                       3,000 (capped)
90      226,521                       3,000 (capped)
100     256,521                       3,000 (capped)
```

The `maxXPPerTier` cap ensures late-tier progression remains achievable.

### Season Pass Revenue Model

```
Revenue per season ≈
  (Total Users × Premium Conversion Rate × Pass Price)
  + (Premium Users × Avg Tier Skips × Skip Price)
  + (Total Users × Limited Drop Conversion × Avg Drop Price)

Example:
  10,000 users × 15% × $9.99 = $14,985 (pass sales)
  1,500 users × 3.2 skips × $1.50 = $7,200 (tier skips)
  10,000 users × 5% × $4.99 = $2,495 (limited drops)
  ────────────────────────────────────────────
  Total: ~$24,680 per season
```

### Migration Guide

When upgrading from a previous version, run:

```bash
# Generate and apply migrations
pnpm drizzle-kit generate:pg --schema=src/schema.ts
pnpm drizzle-kit push:pg

# Backfill new columns (if applicable)
pnpm run migrate:seasons:backfill
```

### Related Modules

- [`@mcv/engagement/xp`](../xp/MODULE.md) — Base XP and leveling system
- [`@mcv/engagement/quests`](../quests/MODULE.md) — Quest system (primary XP source)
- [`@mcv/engagement/achievements`](../achievements/MODULE.md) — Achievement triggers
- [`@mcv/engagement/rewards`](../rewards/MODULE.md) — Reward catalog and fulfillment
- [`@mcv/engagement/leaderboards`](../leaderboards/MODULE.md) — Ranking and leaderboards
- [`@mcv/commerce/payments`](../../commerce/payments/MODULE.md) — Payment processing
- [`@mcv/commerce/inventory`](../../commerce/inventory/MODULE.md) — User inventory management