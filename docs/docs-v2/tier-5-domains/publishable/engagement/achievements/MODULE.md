# @mcv/engagement/achievements

> Achievement and badge system for recognizing and rewarding user accomplishments across all MCV.ONE ventures.

**Package:** `@mcv/engagement/achievements`
**Since:** 0.9.0
**Status:** Stable
**Tier:** 5 — Domain Module
**Parent:** `@mcv/engagement`
**Maintainer:** MCV Platform Team
**License:** Proprietary — MCV.ONE Platform

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

The Achievements module provides a comprehensive, event-driven achievement and badge system that gamifies user interaction across the entire MCV.ONE platform. It enables ventures to define meaningful milestones, track incremental progress, award visual badges, and trigger rewards — all while maintaining cross-venture consistency and tenant-level isolation.

### Why Achievements Matter

Achievements are one of the most effective engagement mechanics available to digital platforms. They provide:

1. **Intrinsic Motivation** — Users feel a sense of accomplishment when they unlock achievements, encouraging continued participation without direct monetary incentives.
2. **Behavioral Guidance** — Achievements subtly direct users toward desired behaviors (completing profiles, exploring features, maintaining streaks) by making those actions visible and rewarding.
3. **Social Proof** — Badge displays on profiles signal experience and dedication, creating aspirational targets for newer users.
4. **Retention Loops** — Progress bars and "almost there" states create powerful retention hooks that bring users back to complete what they started.
5. **Cross-Venture Discovery** — Platform-wide achievements encourage users to explore other MCV ventures, driving cross-pollination and ecosystem growth.

### Design Philosophy

The module follows several core principles:

- **Event-Driven Evaluation** — Achievements are never polled. Every unlock is triggered by domain events flowing through Redpanda, ensuring real-time responsiveness with zero wasted computation.
- **Composable Criteria** — Unlock conditions are built from small, reusable predicates combined with boolean logic (AND/OR/NOT), enabling complex requirements without custom code.
- **Progressive Disclosure** — Users see tiered progress (hidden → discovered → in-progress → unlocked) to maintain curiosity and avoid overwhelming new users with hundreds of locked badges.
- **Venture Autonomy** — Each venture defines its own achievements while the platform provides cross-venture and global achievements. Ventures never see each other's internal achievement data.
- **Scarcity as a Feature** — Limited-edition, time-gated, and first-N-users achievements create genuine scarcity that drives urgency and perceived value.
- **Reward Agnostic** — The achievement system triggers rewards but doesn't implement them. Points, XP, coupons, and physical goods are handled by their respective modules via event dispatch.

### What This Module Does

| Capability | Description |
|---|---|
| Achievement Definitions | Create achievements with criteria, icons, rarity levels, categories, and metadata |
| Unlock Criteria | Rule-based triggers: event counts, streak milestones, first-time actions, compound conditions |
| Progress Tracking | Incremental progress toward achievements with percentage bars and sub-milestones |
| Badge System | Visual badge management (SVG/PNG), profile display, collections, featured badges |
| Rarity & Scarcity | Limited-edition, time-limited, first-N-users, venture-specific exclusive achievements |
| Achievement Groups | Category-based grouping, completion percentages, meta-achievements |
| Notifications | Real-time unlock notifications via WebSocket/push, celebration animations, social sharing |
| Reward Integration | Points/tokens/XP awarded on unlock, coupon generation, physical reward triggers |
| Leaderboards Integration | Achievement count leaderboards, rarity-weighted scoring, achievement hunter rankings |
| Cross-Venture | Platform-wide achievements, venture-specific achievements, cross-venture aggregation |
| Admin Tools | Achievement designer, bulk grant/revoke, unlock analytics, A/B testing |

### What This Module Does NOT Do

- **Implement reward fulfillment** — Reward delivery (point crediting, coupon generation, shipping) is handled by `@mcv/engagement/rewards` and `@mcv/commerce`.
- **Render UI components** — Badge visuals and progress bars are provided by `@mcv/ui/achievements`. This module provides data and logic only.
- **Manage user profiles** — Profile display slots for badges are managed by `@mcv/identity/profiles`. This module provides badge data.
- **Handle push notification delivery** — Notification payloads are emitted as events. Actual delivery is handled by `@mcv/notifications`.
- **Store media assets** — Badge images are stored via `@mcv/storage`. This module stores references (URLs/keys) only.

---

## Exports

### Services

```typescript
export { AchievementService } from './services/achievement.service';
export { AchievementProgressService } from './services/progress.service';
export { AchievementUnlockService } from './services/unlock.service';
export { BadgeService } from './services/badge.service';
export { AchievementGroupService } from './services/group.service';
export { AchievementCriteriaEngine } from './services/criteria-engine.service';
export { AchievementNotificationService } from './services/notification.service';
export { AchievementRewardService } from './services/reward.service';
export { AchievementLeaderboardService } from './services/leaderboard.service';
export { AchievementAdminService } from './services/admin.service';
export { AchievementAnalyticsService } from './services/analytics.service';
export { AchievementMigrationService } from './services/migration.service';
```

### Router

```typescript
export { achievementRouter } from './router';
export type { AchievementRouter } from './router';
```

### Schemas (Drizzle)

```typescript
export {
  achievements,
  achievementProgress,
  achievementUnlocks,
  badges,
  achievementGroups,
  achievementRewards,
  achievementCriteria,
  achievementEvents,
  achievementGroupMembers,
  achievementMilestones,
  achievementShareTokens,
  achievementDisplaySlots,
} from './schema';
```

### Types

```typescript
export type {
  Achievement,
  AchievementInsert,
  AchievementUpdate,
  AchievementProgress,
  AchievementProgressInsert,
  AchievementUnlock,
  AchievementUnlockInsert,
  Badge,
  BadgeInsert,
  BadgeUpdate,
  AchievementGroup,
  AchievementGroupInsert,
  AchievementReward,
  AchievementRewardInsert,
  AchievementCriteria,
  AchievementCriteriaInsert,
  AchievementEvent,
  AchievementEventInsert,
  AchievementMilestone,
  AchievementNotification,
  AchievementLeaderboardEntry,
  AchievementAnalytics,
  AchievementShareToken,
  AchievementDisplaySlot,
} from './types';
```

### Enums

```typescript
export {
  AchievementRarity,
  AchievementStatus,
  AchievementVisibility,
  CriteriaOperator,
  CriteriaType,
  ProgressStatus,
  BadgeFormat,
  RewardType,
  NotificationType,
  UnlockMethod,
  LeaderboardPeriod,
  AchievementScope,
} from './enums';
```

### Validators (Zod)

```typescript
export {
  createAchievementSchema,
  updateAchievementSchema,
  achievementQuerySchema,
  createCriteriaSchema,
  updateProgressSchema,
  createBadgeSchema,
  createGroupSchema,
  createRewardSchema,
  bulkGrantSchema,
  bulkRevokeSchema,
  achievementFilterSchema,
  leaderboardQuerySchema,
  analyticsQuerySchema,
} from './validators';
```

### Events

```typescript
export {
  AchievementUnlockedEvent,
  AchievementProgressUpdatedEvent,
  AchievementCreatedEvent,
  AchievementArchivedEvent,
  AchievementRevokedEvent,
  BadgeAwardedEvent,
  BadgeRevokedEvent,
  GroupCompletedEvent,
  MilestoneReachedEvent,
  RewardTriggeredEvent,
} from './events';
```

### Hooks

```typescript
export {
  useAchievements,
  useAchievementProgress,
  useAchievementUnlocks,
  useBadges,
  useAchievementGroups,
  useAchievementLeaderboard,
  useAchievementNotifications,
  useAchievementShare,
  useFeaturedBadges,
  useAchievementAdmin,
} from './hooks';
```

### Constants

```typescript
export {
  ACHIEVEMENT_RARITY_WEIGHTS,
  MAX_FEATURED_BADGES,
  MAX_ACHIEVEMENT_CRITERIA,
  PROGRESS_PRECISION,
  DEFAULT_CELEBRATION_DURATION_MS,
  ACHIEVEMENT_CACHE_TTL,
  LEADERBOARD_REFRESH_INTERVAL,
  MAX_ACHIEVEMENTS_PER_VENTURE,
  MAX_GROUPS_PER_VENTURE,
  SHARE_TOKEN_EXPIRY_HOURS,
} from './constants';
```

---

## Architecture

### High-Level Overview

```
┌──────────────────────────────────────────────────────────────────────────┐
│                          MCV.ONE Platform                                │
│                                                                          │
│  ┌─────────────┐   ┌─────────────┐   ┌─────────────┐   ┌────────────┐  │
│  │  Commerce    │   │  Identity   │   │  Content    │   │  Social    │  │
│  │  Module      │   │  Module     │   │  Module     │   │  Module    │  │
│  └──────┬───────┘   └──────┬──────┘   └──────┬──────┘   └─────┬──────┘  │
│         │                  │                  │                │          │
│         └──────────────────┼──────────────────┼────────────────┘          │
│                            │ Domain Events    │                           │
│                            ▼                  ▼                           │
│  ┌───────────────────────────────────────────────────────────────────┐   │
│  │                     Redpanda Event Bus                            │   │
│  │  Topics: user.*, commerce.*, content.*, social.*, engagement.*   │   │
│  └───────────────────────────────┬───────────────────────────────────┘   │
│                                  │                                       │
│                                  ▼                                       │
│  ┌───────────────────────────────────────────────────────────────────┐   │
│  │               @mcv/engagement/achievements                        │   │
│  │                                                                   │   │
│  │  ┌─────────────────┐  ┌──────────────────┐  ┌────────────────┐   │   │
│  │  │ Event Consumer  │  │ Criteria Engine   │  │ Progress       │   │   │
│  │  │ (Redpanda)      │──│ (Rule Evaluator)  │──│ Tracker        │   │   │
│  │  └─────────────────┘  └────────┬─────────┘  └───────┬────────┘   │   │
│  │                                │                     │            │   │
│  │                    ┌───────────┴─────────┐           │            │   │
│  │                    ▼                     ▼           ▼            │   │
│  │  ┌─────────────────┐  ┌──────────────┐  ┌────────────────────┐   │   │
│  │  │ Unlock Service  │  │ Badge Service│  │ Notification       │   │   │
│  │  │ (Grant/Revoke)  │  │ (Visuals)    │  │ Service (WS/Push)  │   │   │
│  │  └────────┬────────┘  └──────────────┘  └────────────────────┘   │   │
│  │           │                                                       │   │
│  │           ▼                                                       │   │
│  │  ┌─────────────────┐  ┌──────────────┐  ┌────────────────────┐   │   │
│  │  │ Reward Dispatch │  │ Leaderboard  │  │ Analytics          │   │   │
│  │  │ (Event Emit)    │  │ Service      │  │ Service            │   │   │
│  │  └─────────────────┘  └──────────────┘  └────────────────────┘   │   │
│  └───────────────────────────────────────────────────────────────────┘   │
│                                  │                                       │
│                                  ▼                                       │
│  ┌───────────────────────────────────────────────────────────────────┐   │
│  │                   Supabase PostgreSQL                             │   │
│  │  Tables: achievements, achievement_progress, achievement_unlocks, │   │
│  │          badges, achievement_groups, achievement_rewards, etc.    │   │
│  │  RLS: tenant_id-based row-level security on all tables           │   │
│  └───────────────────────────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────────────────────────┘
```

### Event-Driven Unlock Flow

The achievement system is entirely event-driven. No polling, no cron jobs, no scheduled checks. When something happens anywhere in the MCV platform, an event is emitted to Redpanda. The achievements module consumes relevant events and evaluates them against all active achievement criteria.

```
  User Action (e.g., "user completes 10th purchase")
       │
       ▼
  Domain Module emits event
  ─── commerce.order.completed ───▶ Redpanda
       │
       ▼
  Achievement Event Consumer
  (subscribes to configured event topics)
       │
       ├── 1. Deserialize event payload
       ├── 2. Look up user's tenant context
       ├── 3. Query active achievements matching event type
       │
       ▼
  Criteria Engine (for each matching achievement)
       │
       ├── 4. Load achievement criteria tree
       ├── 5. Load user's current progress
       ├── 6. Evaluate criteria against event + progress
       │
       ├──── Criteria NOT met ──▶ Update progress ──▶ Emit progress.updated
       │                                │
       │                                ▼
       │                         Check milestones
       │                         (25%, 50%, 75%)
       │                                │
       │                                ├── Milestone reached ──▶ Emit milestone.reached
       │                                └── No milestone ──▶ Done
       │
       └──── Criteria MET ──▶ Unlock Service
                                    │
                                    ├── 7. Check scarcity constraints
                                    │      (max unlocks, time window, first-N)
                                    │
                                    ├── 8. Insert achievement_unlocks record
                                    ├── 9. Award badge to user
                                    ├── 10. Emit achievement.unlocked event
                                    │
                                    ▼
                              Post-Unlock Pipeline
                                    │
                                    ├── Notification Service
                                    │   ├── WebSocket push (real-time)
                                    │   ├── Push notification payload
                                    │   └── Celebration trigger (confetti/animation type)
                                    │
                                    ├── Reward Dispatch
                                    │   ├── Emit reward.triggered event
                                    │   ├── Points/XP/tokens payloads
                                    │   └── Coupon/physical reward payloads
                                    │
                                    ├── Leaderboard Update
                                    │   ├── Increment user's achievement count
                                    │   ├── Recalculate rarity-weighted score
                                    │   └── Update rank caches
                                    │
                                    └── Group Completion Check
                                        ├── Update group completion percentage
                                        └── If group complete ──▶ Unlock meta-achievement
```

### Progress Tracking Pipeline

Progress tracking is the bridge between "user did something" and "achievement unlocked." It maintains granular state for every user-achievement pair.

```
  Event Received
       │
       ▼
  ┌─────────────────────────────────────────┐
  │ Progress Tracker                         │
  │                                          │
  │  1. Load or create progress record       │
  │     (user_id + achievement_id)           │
  │                                          │
  │  2. Apply event to progress counters     │
  │     ┌────────────────────────────────┐   │
  │     │ Counter types:                 │   │
  │     │  • count    (e.g., 7 of 10)   │   │
  │     │  • sum      (e.g., $450/$1000) │   │
  │     │  • streak   (e.g., 5 days)    │   │
  │     │  • unique   (e.g., 3/5 items) │   │
  │     │  • boolean  (done or not)     │   │
  │     └────────────────────────────────┘   │
  │                                          │
  │  3. Calculate percentage complete        │
  │     percentage = current / target        │
  │     (clamped to 0.0 – 1.0)              │
  │                                          │
  │  4. Check milestone thresholds           │
  │     [0.25, 0.50, 0.75, 1.00]            │
  │                                          │
  │  5. Persist updated progress             │
  │     (single upsert, idempotent)          │
  │                                          │
  │  6. Return { updated, milestoneReached,  │
  │             completed }                  │
  └─────────────────────────────────────────┘
```

### Criteria Evaluation Engine

The criteria engine evaluates complex, composable conditions using a tree structure. Each node is either a leaf predicate or a boolean combinator.

```
  Achievement: "Power Shopper"
  Criteria Tree:
  
  AND ─┬── event_count("commerce.order.completed") >= 10
       ├── sum("commerce.order.completed", "total") >= 500.00
       └── OR ─┬── event_count("commerce.review.created") >= 3
               └── streak("commerce.order.completed", interval="7d") >= 2

  Evaluation:
  
  ┌─────────────────────────────────────────────┐
  │ CriteriaEngine.evaluate(tree, userProgress) │
  │                                              │
  │  AND node:                                   │
  │    ├── count(orders) = 12 >= 10    ✓         │
  │    ├── sum(order.total) = $623 >= $500  ✓    │
  │    └── OR node:                              │
  │        ├── count(reviews) = 1 >= 3  ✗        │
  │        └── streak(orders, 7d) = 3 >= 2  ✓   │
  │        └── OR result: ✓                      │
  │    └── AND result: ✓ ✓ ✓ = ✓                 │
  │                                              │
  │  Result: CRITERIA_MET                        │
  └─────────────────────────────────────────────┘
```

### Multi-Tenant Data Isolation

All achievement data is tenant-scoped via Supabase Row-Level Security (RLS). Every table includes a `tenant_id` column, and RLS policies ensure that:

1. **Venture-scoped achievements** are only visible within their tenant
2. **Platform-wide achievements** use a special `platform` tenant scope and are readable by all tenants
3. **Cross-venture aggregation** is performed by a privileged service role that bypasses tenant RLS, but results are filtered per-user
4. **Admin operations** require the `achievement:admin` permission scoped to the specific tenant

```sql
-- Example RLS policy on achievements table
CREATE POLICY "tenant_isolation" ON achievements
  USING (
    tenant_id = current_setting('app.tenant_id')::uuid
    OR scope = 'platform'
  );

-- Example RLS policy on achievement_unlocks table
CREATE POLICY "user_own_unlocks" ON achievement_unlocks
  USING (
    user_id = current_setting('app.user_id')::uuid
    AND tenant_id = current_setting('app.tenant_id')::uuid
  );
```

### Caching Strategy

Achievement data is heavily cached to minimize database load during high-traffic periods:

| Data | Cache Layer | TTL | Invalidation |
|---|---|---|---|
| Achievement definitions | Redis | 15 min | On create/update/archive |
| User progress | Redis | 5 min | On progress update |
| User unlocks | Redis | 30 min | On unlock/revoke |
| Badge assets | CDN | 24 hours | On badge update |
| Leaderboard rankings | Redis sorted sets | 5 min | On unlock |
| Group completion % | Redis | 10 min | On member unlock |
| Criteria trees | In-memory (LRU) | 30 min | On criteria update |

### Idempotency

All event processing is idempotent. The system handles duplicate events gracefully:

- **Progress updates** use `upsert` semantics — reprocessing an event produces the same progress state
- **Unlock records** have a unique constraint on `(user_id, achievement_id)` — duplicate unlocks are no-ops
- **Event deduplication** uses Redpanda consumer group offsets and an `achievement_events` log with unique event IDs
- **Reward dispatch** includes an idempotency key derived from the unlock record ID

---

## Core Interfaces

### Achievement

The primary achievement definition. Represents a single achievable goal with its metadata, criteria, and configuration.

```typescript
/**
 * Core achievement definition.
 *
 * Achievements are immutable once published. To modify a published achievement,
 * archive the original and create a new version. Draft achievements can be
 * freely edited.
 */
interface Achievement {
  /** Unique identifier (UUIDv7) */
  id: string;

  /** Tenant that owns this achievement. Null for platform-wide achievements. */
  tenantId: string | null;

  /** URL-safe slug for deep linking (e.g., "power-shopper-2024") */
  slug: string;

  /** Human-readable achievement name */
  name: string;

  /** Rich description with markdown support */
  description: string;

  /** Short flavor text shown on unlock (e.g., "You're a shopping legend!") */
  flavorText: string | null;

  /** Achievement category for grouping and filtering */
  category: string;

  /** Rarity level affecting visual treatment and point value */
  rarity: AchievementRarity;

  /**
   * Visibility controls when users can see this achievement.
   * - 'visible': Always shown, even when locked
   * - 'hidden': Only shown after unlock
   * - 'secret': Existence hidden until specific progress threshold
   * - 'discoverable': Shown after first related event
   */
  visibility: AchievementVisibility;

  /** Scope determines tenant vs platform availability */
  scope: AchievementScope;

  /** Current lifecycle status */
  status: AchievementStatus;

  /** Reference to the primary badge awarded on unlock */
  badgeId: string | null;

  /** Reference to the achievement group this belongs to, if any */
  groupId: string | null;

  /**
   * Ordering weight within a group or category.
   * Lower values appear first.
   */
  sortOrder: number;

  /**
   * Maximum number of users who can unlock this achievement.
   * Null means unlimited.
   */
  maxUnlocks: number | null;

  /**
   * ISO 8601 datetime after which this achievement can no longer be unlocked.
   * Null means no expiration.
   */
  availableUntil: string | null;

  /**
   * ISO 8601 datetime before which this achievement cannot be unlocked.
   * Null means immediately available.
   */
  availableFrom: string | null;

  /** Number of XP points awarded on unlock */
  xpReward: number;

  /**
   * Number of engagement points awarded on unlock.
   * Calculated as base_points * rarity_multiplier.
   */
  pointReward: number;

  /** Criteria tree defining unlock conditions */
  criteria: AchievementCriteriaNode;

  /**
   * Tags for filtering and search.
   * Examples: ["seasonal", "2024", "commerce", "beginner"]
   */
  tags: string[];

  /**
   * Arbitrary metadata for venture-specific extensions.
   * Must be JSON-serializable. Max 10KB.
   */
  metadata: Record<string, unknown>;

  /** Version number, incremented on each update (draft only) */
  version: number;

  /** User ID of the creator */
  createdBy: string;

  /** ISO 8601 creation timestamp */
  createdAt: string;

  /** ISO 8601 last update timestamp */
  updatedAt: string;

  /** ISO 8601 timestamp when this achievement was published (made active) */
  publishedAt: string | null;

  /** ISO 8601 timestamp when this achievement was archived */
  archivedAt: string | null;

  // --- Computed / joined fields (not stored directly) ---

  /** Total number of users who have unlocked this achievement */
  unlockCount?: number;

  /** Percentage of eligible users who have unlocked (0.0 – 1.0) */
  unlockRate?: number;

  /** The badge object, if badgeId is set and joined */
  badge?: Badge;

  /** The group object, if groupId is set and joined */
  group?: AchievementGroup;

  /** Rewards configured for this achievement */
  rewards?: AchievementReward[];
}
```

### AchievementRarity

```typescript
/**
 * Rarity levels determine visual treatment, point multipliers, and scarcity perception.
 *
 * Rarity weights (used in leaderboard scoring):
 * - common:    1x
 * - uncommon:  2x
 * - rare:      4x
 * - epic:      8x
 * - legendary: 16x
 */
enum AchievementRarity {
  /** Easy to obtain. Most users will earn these. */
  COMMON = 'common',

  /** Requires moderate effort or engagement. */
  UNCOMMON = 'uncommon',

  /** Requires significant dedication or skill. */
  RARE = 'rare',

  /** Very difficult or requires sustained effort over time. */
  EPIC = 'epic',

  /** Extremely rare. Reserved for exceptional accomplishments. */
  LEGENDARY = 'legendary',
}
```

### AchievementStatus

```typescript
enum AchievementStatus {
  /** Being configured, not visible to users */
  DRAFT = 'draft',

  /** Active and earnable by users */
  ACTIVE = 'active',

  /** Temporarily disabled, not earnable but previously unlocked badges remain */
  PAUSED = 'paused',

  /** Permanently retired. Existing unlocks preserved but no new unlocks possible. */
  ARCHIVED = 'archived',
}
```

### AchievementVisibility

```typescript
enum AchievementVisibility {
  /** Always visible in achievement lists, even when locked */
  VISIBLE = 'visible',

  /** Only appears after the user unlocks it */
  HIDDEN = 'hidden',

  /**
   * Existence is hidden until the user reaches a discovery threshold
   * (default: 10% progress). Shows as "???" before discovery.
   */
  SECRET = 'secret',

  /**
   * Shown to user after their first event matching any of the
   * achievement's criteria event types.
   */
  DISCOVERABLE = 'discoverable',
}
```

### AchievementScope

```typescript
enum AchievementScope {
  /** Only available within a single venture/tenant */
  VENTURE = 'venture',

  /** Available across all ventures on the platform */
  PLATFORM = 'platform',

  /**
   * Requires actions across multiple specific ventures.
   * The criteria reference specific tenant IDs.
   */
  CROSS_VENTURE = 'cross_venture',
}
```

### AchievementProgress

Tracks a user's incremental progress toward a specific achievement.

```typescript
interface AchievementProgress {
  /** Unique identifier (UUIDv7) */
  id: string;

  /** The user making progress */
  userId: string;

  /** The achievement being progressed */
  achievementId: string;

  /** Tenant context for this progress record */
  tenantId: string;

  /** Current status of progress */
  status: ProgressStatus;

  /**
   * Overall completion percentage (0.0 – 1.0).
   * Calculated from the weighted average of criteria progress.
   */
  percentage: number;

  /**
   * Per-criteria progress counters.
   * Keyed by criteria node ID.
   *
   * Example:
   * {
   *   "criteria_abc": { current: 7, target: 10, type: "count" },
   *   "criteria_def": { current: 450, target: 1000, type: "sum" },
   *   "criteria_ghi": { current: 3, target: 5, type: "streak" }
   * }
   */
  counters: Record<string, ProgressCounter>;

  /**
   * Milestones that have been reached (25%, 50%, 75%).
   * Used to avoid duplicate milestone notifications.
   */
  milestonesReached: number[];

  /**
   * Set of unique values tracked for 'unique' criteria type.
   * Example: Set of product category IDs the user has purchased from.
   */
  uniqueSets: Record<string, string[]>;

  /**
   * Streak tracking data.
   * Includes last event timestamp and current streak count.
   */
  streakData: Record<string, StreakState>;

  /** ISO 8601 timestamp of first progress event */
  startedAt: string;

  /** ISO 8601 timestamp of most recent progress update */
  lastProgressAt: string;

  /** ISO 8601 timestamp when fully completed (criteria met) */
  completedAt: string | null;

  /** ISO 8601 creation timestamp */
  createdAt: string;

  /** ISO 8601 last update timestamp */
  updatedAt: string;
}

interface ProgressCounter {
  /** Current value */
  current: number;

  /** Target value for completion */
  target: number;

  /** Counter type */
  type: 'count' | 'sum' | 'streak' | 'unique' | 'boolean';
}

interface StreakState {
  /** Current streak count */
  currentStreak: number;

  /** Longest streak ever achieved */
  longestStreak: number;

  /** ISO 8601 timestamp of the last event that continued the streak */
  lastEventAt: string;

  /** Interval duration in which events must occur to maintain streak (e.g., "24h", "7d") */
  interval: string;

  /** Whether the streak is currently active (not expired) */
  isActive: boolean;
}

enum ProgressStatus {
  /** No progress yet (record created on first event) */
  NOT_STARTED = 'not_started',

  /** User has made some progress */
  IN_PROGRESS = 'in_progress',

  /** All criteria met, unlock pending or completed */
  COMPLETED = 'completed',

  /** Progress was reset (admin action or achievement redesign) */
  RESET = 'reset',
}
```

### UnlockCriteria (Criteria Tree)

```typescript
/**
 * A criteria tree node. Can be either a leaf (predicate) or a combinator (AND/OR/NOT).
 * Trees are evaluated recursively by the CriteriaEngine.
 */
type AchievementCriteriaNode = CriteriaLeaf | CriteriaCombinator;

/**
 * A leaf node represents a single testable condition.
 */
interface CriteriaLeaf {
  /** Unique ID for this criteria node (used as key in progress counters) */
  id: string;

  /** Discriminator */
  type: 'leaf';

  /** The type of criteria being evaluated */
  criteriaType: CriteriaType;

  /**
   * The event type(s) this criteria listens to.
   * Uses dot-notation matching with wildcards.
   * Examples: "commerce.order.completed", "social.post.*", "user.login"
   */
  eventTypes: string[];

  /**
   * JSONPath expression to extract the value from the event payload.
   * Used for 'sum' and 'unique' criteria types.
   * Example: "$.payload.order.total" for order amount
   */
  valuePath: string | null;

  /** Comparison operator */
  operator: CriteriaOperator;

  /**
   * The target value to compare against.
   * Interpretation depends on criteriaType:
   * - count: number of events
   * - sum: total of extracted values
   * - streak: consecutive interval count
   * - unique: number of distinct values
   * - boolean: 1 (truthy)
   * - first_action: 1 (first occurrence)
   */
  targetValue: number;

  /**
   * For streak criteria: the interval duration.
   * Events must occur within each interval to maintain the streak.
   * Examples: "24h", "7d", "30d"
   */
  streakInterval: string | null;

  /**
   * For time-windowed criteria: only count events within this duration.
   * Example: "30d" means only events in the last 30 days count.
   */
  timeWindow: string | null;

  /**
   * Optional filter on event payload fields.
   * Only events matching all filters are counted.
   * Example: { "payload.category": "electronics" }
   */
  eventFilters: Record<string, unknown> | null;

  /** Weight for percentage calculation (default: 1.0) */
  weight: number;

  /** Human-readable description shown to users */
  description: string;
}

/**
 * A combinator node joins child nodes with boolean logic.
 */
interface CriteriaCombinator {
  /** Unique ID for this criteria node */
  id: string;

  /** Discriminator */
  type: 'combinator';

  /** Boolean operator to apply to children */
  operator: 'AND' | 'OR' | 'NOT';

  /** Child nodes (for NOT, must have exactly one child) */
  children: AchievementCriteriaNode[];

  /** Human-readable description */
  description: string | null;
}

enum CriteriaType {
  /** Count number of matching events */
  COUNT = 'count',

  /** Sum a numeric value extracted from events */
  SUM = 'sum',

  /** Track consecutive events within time intervals */
  STREAK = 'streak',

  /** Count distinct values extracted from events */
  UNIQUE = 'unique',

  /** Simple boolean — met on first matching event */
  BOOLEAN = 'boolean',

  /** First user to trigger the matching event */
  FIRST_ACTION = 'first_action',

  /** Compare a user profile field */
  PROFILE_FIELD = 'profile_field',

  /** Requires another achievement to be unlocked */
  PREREQUISITE = 'prerequisite',
}

enum CriteriaOperator {
  GREATER_THAN_OR_EQUAL = 'gte',
  GREATER_THAN = 'gt',
  EQUAL = 'eq',
  LESS_THAN = 'lt',
  LESS_THAN_OR_EQUAL = 'lte',
}
```

### Badge

```typescript
/**
 * Visual badge awarded when an achievement is unlocked.
 * Badges are the user-facing visual representation of achievements.
 */
interface Badge {
  /** Unique identifier (UUIDv7) */
  id: string;

  /** Tenant that owns this badge. Null for platform badges. */
  tenantId: string | null;

  /** Badge display name */
  name: string;

  /** Badge description */
  description: string;

  /** Image format */
  format: BadgeFormat;

  /**
   * URL to the badge image asset.
   * Stored in @mcv/storage, served via CDN.
   */
  imageUrl: string;

  /**
   * URL to the badge image in its locked/greyscale state.
   * Shown before the achievement is unlocked.
   */
  lockedImageUrl: string | null;

  /**
   * URL to an animated version of the badge (Lottie JSON or GIF).
   * Played during the unlock celebration.
   */
  animatedImageUrl: string | null;

  /** Primary color hex code for UI theming (e.g., "#FFD700") */
  primaryColor: string;

  /** Secondary color hex code for UI theming */
  secondaryColor: string | null;

  /**
   * Badge tier for visual treatment.
   * Maps to border/frame styles in the UI.
   */
  tier: 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond';

  /** Width in pixels of the source image */
  width: number;

  /** Height in pixels of the source image */
  height: number;

  /** File size in bytes */
  fileSizeBytes: number;

  /** ISO 8601 creation timestamp */
  createdAt: string;

  /** ISO 8601 last update timestamp */
  updatedAt: string;
}

enum BadgeFormat {
  SVG = 'svg',
  PNG = 'png',
  WEBP = 'webp',
  LOTTIE = 'lottie',
}
```

### AchievementGroup

```typescript
/**
 * Groups related achievements into categories.
 * Completing all achievements in a group can trigger a meta-achievement.
 */
interface AchievementGroup {
  /** Unique identifier (UUIDv7) */
  id: string;

  /** Tenant that owns this group */
  tenantId: string | null;

  /** Group display name (e.g., "Commerce Master", "Social Butterfly") */
  name: string;

  /** Rich description of the group */
  description: string;

  /** URL-safe slug */
  slug: string;

  /** Icon URL for the group */
  iconUrl: string | null;

  /** Primary color for UI theming */
  primaryColor: string | null;

  /** Sort order within the achievement browser */
  sortOrder: number;

  /**
   * Achievement ID of the meta-achievement awarded when all
   * achievements in this group are unlocked. Null if no meta-achievement.
   */
  metaAchievementId: string | null;

  /**
   * Whether to show completion percentage to users.
   * Some groups may want to hide progress (e.g., secret collections).
   */
  showCompletion: boolean;

  /** ISO 8601 creation timestamp */
  createdAt: string;

  /** ISO 8601 last update timestamp */
  updatedAt: string;

  // --- Computed / joined fields ---

  /** Total achievements in this group */
  totalAchievements?: number;

  /** Number of achievements the current user has unlocked in this group */
  unlockedCount?: number;

  /** Completion percentage for the current user (0.0 – 1.0) */
  completionPercentage?: number;

  /** The meta-achievement object, if metaAchievementId is set */
  metaAchievement?: Achievement;

  /** Member achievements in this group */
  achievements?: Achievement[];
}
```

### AchievementReward

```typescript
/**
 * Defines a reward triggered when an achievement is unlocked.
 * Rewards are dispatched as events — fulfillment is handled by other modules.
 */
interface AchievementReward {
  /** Unique identifier (UUIDv7) */
  id: string;

  /** The achievement that triggers this reward */
  achievementId: string;

  /** Type of reward */
  rewardType: RewardType;

  /**
   * Reward-type-specific configuration.
   *
   * For POINTS:   { amount: 100, currency: "engagement_points" }
   * For XP:       { amount: 50 }
   * For COUPON:   { discountPercent: 15, validDays: 30, applicableTo: "all" }
   * For TOKEN:    { amount: 10, tokenType: "platform_token" }
   * For PHYSICAL: { itemSku: "TSHIRT-001", fulfillmentType: "shipping" }
   * For BADGE:    { badgeId: "...", slot: "featured" }
   * For UNLOCK:   { featureKey: "premium_theme_dark", durationDays: 30 }
   */
  config: Record<string, unknown>;

  /** Human-readable reward description shown to users */
  description: string;

  /** Sort order when multiple rewards exist */
  sortOrder: number;

  /** Whether this reward is currently active */
  isActive: boolean;

  /** ISO 8601 creation timestamp */
  createdAt: string;

  /** ISO 8601 last update timestamp */
  updatedAt: string;
}

enum RewardType {
  /** Engagement points */
  POINTS = 'points',

  /** Experience points */
  XP = 'xp',

  /** Coupon or discount code */
  COUPON = 'coupon',

  /** Platform tokens / cryptocurrency */
  TOKEN = 'token',

  /** Physical merchandise */
  PHYSICAL = 'physical',

  /** Additional badge (separate from the achievement's primary badge) */
  BADGE = 'badge',

  /** Feature unlock (premium features, themes, etc.) */
  UNLOCK = 'unlock',

  /** Custom reward handled by venture-specific logic */
  CUSTOM = 'custom',
}
```

### AchievementNotification

```typescript
/**
 * Notification payload emitted when an achievement-related event occurs.
 * Consumed by @mcv/notifications for delivery.
 */
interface AchievementNotification {
  /** Unique notification ID (UUIDv7) */
  id: string;

  /** Notification type */
  type: NotificationType;

  /** Target user ID */
  userId: string;

  /** Tenant context */
  tenantId: string;

  /** The achievement this notification relates to */
  achievementId: string;

  /** Achievement name (denormalized for notification rendering) */
  achievementName: string;

  /** Achievement description (denormalized) */
  achievementDescription: string;

  /** Badge image URL (denormalized for notification rendering) */
  badgeImageUrl: string | null;

  /** Rarity level (for visual treatment in notification) */
  rarity: AchievementRarity;

  /**
   * Celebration type determines the client-side animation.
   * - 'none': No animation
   * - 'confetti': Confetti burst
   * - 'fireworks': Firework animation
   * - 'glow': Badge glow effect
   * - 'shake': Screen shake
   * - 'custom': Venture-defined animation
   */
  celebrationType: 'none' | 'confetti' | 'fireworks' | 'glow' | 'shake' | 'custom';

  /**
   * Duration in milliseconds for the celebration animation.
   * Default: 3000ms
   */
  celebrationDurationMs: number;

  /** Rewards included in this notification (for display) */
  rewards: Array<{
    type: RewardType;
    description: string;
    amount: number | null;
  }>;

  /**
   * For progress notifications: current and target values.
   */
  progress: {
    current: number;
    target: number;
    percentage: number;
    milestoneReached: number | null;
  } | null;

  /**
   * Share URL for social sharing.
   * Generated by AchievementShareService.
   */
  shareUrl: string | null;

  /** ISO 8601 timestamp */
  createdAt: string;
}

enum NotificationType {
  /** Achievement unlocked */
  UNLOCK = 'unlock',

  /** Progress milestone reached (25%, 50%, 75%) */
  MILESTONE = 'milestone',

  /** Achievement is close to being unlocked (>90% progress) */
  ALMOST_THERE = 'almost_there',

  /** New achievement became available */
  NEW_AVAILABLE = 'new_available',

  /** Achievement is expiring soon (time-limited) */
  EXPIRING_SOON = 'expiring_soon',

  /** Achievement group completed */
  GROUP_COMPLETED = 'group_completed',

  /** Achievement revoked (admin action) */
  REVOKED = 'revoked',
}
```

### AchievementService

The primary service interface for achievement operations.

```typescript
interface AchievementService {
  // --- CRUD ---

  /**
   * Create a new achievement definition.
   * Starts in DRAFT status. Must be published to become active.
   */
  create(input: AchievementInsert): Promise<Achievement>;

  /**
   * Update a draft achievement. Published achievements cannot be updated.
   * @throws ACHIEVEMENT_ALREADY_PUBLISHED if status is not DRAFT
   */
  update(id: string, input: AchievementUpdate): Promise<Achievement>;

  /**
   * Publish a draft achievement, making it active and earnable.
   * Validates criteria tree, badge reference, and reward configuration.
   * @throws ACHIEVEMENT_INVALID_CRITERIA if criteria tree is malformed
   */
  publish(id: string): Promise<Achievement>;

  /**
   * Pause an active achievement. No new unlocks, but existing unlocks preserved.
   */
  pause(id: string): Promise<Achievement>;

  /**
   * Resume a paused achievement. New unlocks become possible again.
   */
  resume(id: string): Promise<Achievement>;

  /**
   * Archive an achievement permanently. Cannot be unarchived.
   * Existing unlocks and badges are preserved.
   */
  archive(id: string): Promise<Achievement>;

  /**
   * Get a single achievement by ID.
   * Includes badge, group, and rewards if options.include is specified.
   */
  getById(id: string, options?: AchievementGetOptions): Promise<Achievement | null>;

  /**
   * Get a single achievement by slug.
   */
  getBySlug(slug: string, options?: AchievementGetOptions): Promise<Achievement | null>;

  /**
   * List achievements with filtering, pagination, and sorting.
   */
  list(query: AchievementQuery): Promise<PaginatedResult<Achievement>>;

  /**
   * List achievements available to a specific user.
   * Respects visibility rules, time windows, and scarcity limits.
   */
  listForUser(userId: string, query: AchievementQuery): Promise<PaginatedResult<Achievement & {
    progress: AchievementProgress | null;
    isUnlocked: boolean;
    unlockedAt: string | null;
  }>>;

  // --- Progress ---

  /**
   * Get a user's progress toward a specific achievement.
   */
  getProgress(userId: string, achievementId: string): Promise<AchievementProgress | null>;

  /**
   * Get a user's progress across all achievements.
   */
  getAllProgress(userId: string, query?: ProgressQuery): Promise<PaginatedResult<AchievementProgress>>;

  /**
   * Manually update progress (admin operation).
   * @throws ACHIEVEMENT_ALREADY_UNLOCKED if achievement is already unlocked
   */
  updateProgress(userId: string, achievementId: string, counters: Record<string, number>): Promise<AchievementProgress>;

  /**
   * Reset a user's progress for a specific achievement.
   */
  resetProgress(userId: string, achievementId: string): Promise<void>;

  // --- Unlocks ---

  /**
   * Get all achievements unlocked by a user.
   */
  getUnlocks(userId: string, query?: UnlockQuery): Promise<PaginatedResult<AchievementUnlock>>;

  /**
   * Check if a user has unlocked a specific achievement.
   */
  isUnlocked(userId: string, achievementId: string): Promise<boolean>;

  /**
   * Manually grant an achievement to a user (admin operation).
   * Bypasses criteria evaluation. Triggers rewards and notifications.
   */
  grant(userId: string, achievementId: string, reason: string): Promise<AchievementUnlock>;

  /**
   * Revoke an achievement from a user (admin operation).
   * Removes the unlock record and revokes the badge.
   * Does NOT reverse rewards (handled separately).
   */
  revoke(userId: string, achievementId: string, reason: string): Promise<void>;

  /**
   * Bulk grant an achievement to multiple users.
   * Returns a summary of successes and failures.
   */
  bulkGrant(achievementId: string, userIds: string[], reason: string): Promise<BulkOperationResult>;

  /**
   * Bulk revoke an achievement from multiple users.
   */
  bulkRevoke(achievementId: string, userIds: string[], reason: string): Promise<BulkOperationResult>;

  // --- Groups ---

  /**
   * Get group completion status for a user.
   */
  getGroupCompletion(userId: string, groupId: string): Promise<{
    group: AchievementGroup;
    achievements: Array<Achievement & { isUnlocked: boolean }>;
    completionPercentage: number;
    isComplete: boolean;
  }>;

  // --- Leaderboard ---

  /**
   * Get the achievement leaderboard.
   * Supports different scoring methods and time periods.
   */
  getLeaderboard(query: LeaderboardQuery): Promise<PaginatedResult<AchievementLeaderboardEntry>>;

  /**
   * Get a user's rank on the achievement leaderboard.
   */
  getUserRank(userId: string, query?: LeaderboardQuery): Promise<AchievementLeaderboardEntry | null>;

  // --- Analytics ---

  /**
   * Get analytics for a specific achievement.
   */
  getAnalytics(achievementId: string): Promise<AchievementAnalytics>;

  /**
   * Get aggregate analytics across all achievements.
   */
  getOverviewAnalytics(query?: AnalyticsQuery): Promise<AchievementOverviewAnalytics>;
}

interface AchievementGetOptions {
  include?: Array<'badge' | 'group' | 'rewards' | 'unlockCount'>;
}

interface AchievementQuery {
  /** Filter by status */
  status?: AchievementStatus[];
  /** Filter by rarity */
  rarity?: AchievementRarity[];
  /** Filter by category */
  category?: string[];
  /** Filter by scope */
  scope?: AchievementScope[];
  /** Filter by group ID */
  groupId?: string;
  /** Filter by tags (any match) */
  tags?: string[];
  /** Text search across name and description */
  search?: string;
  /** Include related data */
  include?: Array<'badge' | 'group' | 'rewards' | 'unlockCount'>;
  /** Sort field */
  sortBy?: 'name' | 'createdAt' | 'rarity' | 'unlockCount' | 'sortOrder';
  /** Sort direction */
  sortDir?: 'asc' | 'desc';
  /** Pagination cursor */
  cursor?: string;
  /** Page size (default: 20, max: 100) */
  limit?: number;
}

interface AchievementLeaderboardEntry {
  /** User ID */
  userId: string;

  /** Display name (denormalized) */
  displayName: string;

  /** Avatar URL (denormalized) */
  avatarUrl: string | null;

  /** Rank position (1-indexed) */
  rank: number;

  /** Total achievements unlocked */
  totalUnlocks: number;

  /** Rarity-weighted score */
  weightedScore: number;

  /** Count by rarity */
  rarityBreakdown: Record<AchievementRarity, number>;

  /** Most recently unlocked achievement */
  latestUnlock: {
    achievementId: string;
    achievementName: string;
    badgeImageUrl: string | null;
    unlockedAt: string;
  } | null;
}

interface AchievementAnalytics {
  /** Achievement ID */
  achievementId: string;

  /** Total users who have unlocked */
  totalUnlocks: number;

  /** Percentage of all users who have unlocked (0.0 – 1.0) */
  unlockRate: number;

  /** Median time from first progress to unlock (in seconds) */
  medianTimeToUnlock: number;

  /** Average time from first progress to unlock (in seconds) */
  averageTimeToUnlock: number;

  /** Fastest time from first progress to unlock (in seconds) */
  fastestTimeToUnlock: number;

  /** Number of users currently in progress */
  usersInProgress: number;

  /** Distribution of progress percentages for in-progress users */
  progressDistribution: {
    bucket: string;
    count: number;
  }[];

  /** Unlock trend over time (daily counts for the last 30 days) */
  unlockTrend: {
    date: string;
    count: number;
  }[];

  /** Top drop-off points (where users stop progressing) */
  dropOffPoints: {
    criteriaId: string;
    criteriaDescription: string;
    dropOffRate: number;
  }[];
}
```

### AchievementCriteriaEngine

```typescript
/**
 * The criteria engine evaluates achievement criteria trees against
 * user progress and incoming events.
 */
interface AchievementCriteriaEngine {
  /**
   * Evaluate a criteria tree against a user's current progress.
   * Returns whether all criteria are met and the overall percentage.
   */
  evaluate(
    criteria: AchievementCriteriaNode,
    progress: AchievementProgress,
  ): CriteriaEvaluationResult;

  /**
   * Process an incoming event against a criteria tree.
   * Updates progress counters and returns the new state.
   */
  processEvent(
    criteria: AchievementCriteriaNode,
    progress: AchievementProgress,
    event: AchievementEvent,
  ): ProgressUpdateResult;

  /**
   * Validate a criteria tree structure.
   * Checks for circular references, valid operators, and completeness.
   */
  validate(criteria: AchievementCriteriaNode): CriteriaValidationResult;

  /**
   * Calculate the theoretical maximum progress percentage breakdown
   * for display in UI progress bars.
   */
  getProgressBreakdown(
    criteria: AchievementCriteriaNode,
    progress: AchievementProgress,
  ): CriteriaProgressBreakdown[];
}

interface CriteriaEvaluationResult {
  /** Whether all criteria are satisfied */
  isMet: boolean;

  /** Overall completion percentage (0.0 – 1.0) */
  percentage: number;

  /** Per-node evaluation results */
  nodeResults: Map<string, {
    isMet: boolean;
    percentage: number;
    current: number;
    target: number;
  }>;
}

interface ProgressUpdateResult {
  /** Updated progress record */
  progress: AchievementProgress;

  /** Whether any counters changed */
  hasChanges: boolean;

  /** Whether all criteria are now met */
  isComplete: boolean;

  /** Milestones newly reached in this update */
  newMilestones: number[];

  /** Per-node changes */
  changes: Array<{
    criteriaId: string;
    previousValue: number;
    newValue: number;
    target: number;
  }>;
}

interface CriteriaValidationResult {
  /** Whether the criteria tree is valid */
  isValid: boolean;

  /** Validation errors, if any */
  errors: Array<{
    path: string;
    message: string;
    code: string;
  }>;

  /** Validation warnings (non-blocking) */
  warnings: Array<{
    path: string;
    message: string;
    code: string;
  }>;
}

interface CriteriaProgressBreakdown {
  /** Criteria node ID */
  criteriaId: string;

  /** Human-readable description */
  description: string;

  /** Weight of this criteria in overall percentage */
  weight: number;

  /** Current value */
  current: number;

  /** Target value */
  target: number;

  /** This criteria's contribution to overall percentage */
  percentage: number;

  /** Criteria type */
  type: CriteriaType;
}
```

### AchievementEvent

```typescript
/**
 * Represents a domain event consumed by the achievement system.
 * Events are received from Redpanda and logged for audit and replay.
 */
interface AchievementEvent {
  /** Unique event ID (from the source system) */
  id: string;

  /** Event type using dot-notation (e.g., "commerce.order.completed") */
  eventType: string;

  /** User who triggered the event */
  userId: string;

  /** Tenant context of the event */
  tenantId: string;

  /** Event payload (domain-specific data) */
  payload: Record<string, unknown>;

  /** ISO 8601 timestamp when the event originally occurred */
  occurredAt: string;

  /** ISO 8601 timestamp when the achievement system received the event */
  receivedAt: string;

  /**
   * Processing status.
   * - 'pending': Received but not yet processed
   * - 'processed': Successfully evaluated against all matching achievements
   * - 'failed': Processing failed (will be retried)
   * - 'skipped': Event type has no matching achievement criteria
   */
  status: 'pending' | 'processed' | 'failed' | 'skipped';

  /** Number of achievements this event was evaluated against */
  evaluationCount: number;

  /** Number of unlocks triggered by this event */
  unlockCount: number;

  /** Error message if processing failed */
  errorMessage: string | null;
}
```

### AchievementUnlock

```typescript
/**
 * Record of a user unlocking an achievement.
 * Immutable once created (revocations create a separate record).
 */
interface AchievementUnlock {
  /** Unique identifier (UUIDv7) */
  id: string;

  /** The user who unlocked the achievement */
  userId: string;

  /** The achievement that was unlocked */
  achievementId: string;

  /** Tenant context */
  tenantId: string;

  /** How the achievement was unlocked */
  method: UnlockMethod;

  /**
   * The event that triggered the unlock (for EVENT method).
   * Null for manual grants.
   */
  triggerEventId: string | null;

  /**
   * Admin user ID (for MANUAL_GRANT method).
   * Null for event-triggered unlocks.
   */
  grantedBy: string | null;

  /** Reason for manual grant/revoke (audit trail) */
  reason: string | null;

  /** Whether this unlock has been revoked */
  isRevoked: boolean;

  /** ISO 8601 timestamp of revocation, if applicable */
  revokedAt: string | null;

  /** User ID of admin who revoked, if applicable */
  revokedBy: string | null;

  /** Revocation reason */
  revokeReason: string | null;

  /** ISO 8601 unlock timestamp */
  unlockedAt: string;

  /** ISO 8601 creation timestamp */
  createdAt: string;

  // --- Joined fields ---

  /** The achievement, if joined */
  achievement?: Achievement;

  /** The badge, if joined */
  badge?: Badge;
}

enum UnlockMethod {
  /** Unlocked via event-driven criteria evaluation */
  EVENT = 'event',

  /** Manually granted by an admin */
  MANUAL_GRANT = 'manual_grant',

  /** Granted via bulk operation */
  BULK_GRANT = 'bulk_grant',

  /** Unlocked via meta-achievement (group completion) */
  META_ACHIEVEMENT = 'meta_achievement',

  /** Unlocked via migration from legacy system */
  MIGRATION = 'migration',
}
```

### AchievementDisplaySlot

```typescript
/**
 * Represents a user's badge display configuration on their profile.
 * Users can choose which badges to showcase in their display slots.
 */
interface AchievementDisplaySlot {
  /** Unique identifier */
  id: string;

  /** User who owns this display */
  userId: string;

  /** Tenant context */
  tenantId: string;

  /**
   * Slot type:
   * - 'featured': Large showcase badge (1 slot)
   * - 'collection': Standard display grid (up to 8 slots)
   * - 'title': Achievement title displayed near username (1 slot)
   */
  slotType: 'featured' | 'collection' | 'title';

  /** Position within the slot type (0-indexed) */
  position: number;

  /** The unlock record being displayed */
  unlockId: string;

  /** ISO 8601 timestamp */
  createdAt: string;

  /** ISO 8601 last update timestamp */
  updatedAt: string;

  // --- Joined ---
  unlock?: AchievementUnlock;
  badge?: Badge;
  achievement?: Achievement;
}
```

### AchievementShareToken

```typescript
/**
 * Short-lived token for sharing achievement unlocks publicly.
 * Generates a shareable URL that shows the badge without requiring login.
 */
interface AchievementShareToken {
  /** Unique identifier */
  id: string;

  /** The unlock being shared */
  unlockId: string;

  /** User who created the share */
  userId: string;

  /** Tenant context */
  tenantId: string;

  /** Short token for the shareable URL */
  token: string;

  /** Number of times the share link has been viewed */
  viewCount: number;

  /** ISO 8601 expiration timestamp */
  expiresAt: string;

  /** ISO 8601 creation timestamp */
  createdAt: string;
}
```

---

## Database Schemas

### achievements

Primary table for achievement definitions.

```typescript
import { pgTable, uuid, text, integer, timestamp, jsonb, boolean, pgEnum, uniqueIndex, index } from 'drizzle-orm/pg-core';

export const achievementRarityEnum = pgEnum('achievement_rarity', [
  'common', 'uncommon', 'rare', 'epic', 'legendary',
]);

export const achievementStatusEnum = pgEnum('achievement_status', [
  'draft', 'active', 'paused', 'archived',
]);

export const achievementVisibilityEnum = pgEnum('achievement_visibility', [
  'visible', 'hidden', 'secret', 'discoverable',
]);

export const achievementScopeEnum = pgEnum('achievement_scope', [
  'venture', 'platform', 'cross_venture',
]);

export const achievements = pgTable('achievements', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').references(() => tenants.id),
  slug: text('slug').notNull(),
  name: text('name').notNull(),
  description: text('description').notNull(),
  flavorText: text('flavor_text'),
  category: text('category').notNull(),
  rarity: achievementRarityEnum('rarity').notNull().default('common'),
  visibility: achievementVisibilityEnum('visibility').notNull().default('visible'),
  scope: achievementScopeEnum('scope').notNull().default('venture'),
  status: achievementStatusEnum('status').notNull().default('draft'),
  badgeId: uuid('badge_id').references(() => badges.id),
  groupId: uuid('group_id').references(() => achievementGroups.id),
  sortOrder: integer('sort_order').notNull().default(0),
  maxUnlocks: integer('max_unlocks'),
  availableFrom: timestamp('available_from', { withTimezone: true }),
  availableUntil: timestamp('available_until', { withTimezone: true }),
  xpReward: integer('xp_reward').notNull().default(0),
  pointReward: integer('point_reward').notNull().default(0),
  criteria: jsonb('criteria').notNull(),
  tags: text('tags').array().notNull().default([]),
  metadata: jsonb('metadata').notNull().default({}),
  version: integer('version').notNull().default(1),
  createdBy: uuid('created_by').notNull().references(() => users.id),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  publishedAt: timestamp('published_at', { withTimezone: true }),
  archivedAt: timestamp('archived_at', { withTimezone: true }),
}, (table) => ({
  slugTenantIdx: uniqueIndex('achievements_slug_tenant_idx').on(table.slug, table.tenantId),
  tenantStatusIdx: index('achievements_tenant_status_idx').on(table.tenantId, table.status),
  categoryIdx: index('achievements_category_idx').on(table.category),
  rarityIdx: index('achievements_rarity_idx').on(table.rarity),
  groupIdx: index('achievements_group_idx').on(table.groupId),
  tagsIdx: index('achievements_tags_idx').using('gin', table.tags),
  scopeIdx: index('achievements_scope_idx').on(table.scope),
}));
```

### achievement_progress

Tracks per-user progress toward each achievement.

```typescript
export const progressStatusEnum = pgEnum('progress_status', [
  'not_started', 'in_progress', 'completed', 'reset',
]);

export const achievementProgress = pgTable('achievement_progress', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id),
  achievementId: uuid('achievement_id').notNull().references(() => achievements.id, { onDelete: 'cascade' }),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id),
  status: progressStatusEnum('status').notNull().default('not_started'),
  percentage: integer('percentage').notNull().default(0), // stored as 0-10000 for precision (basis points)
  counters: jsonb('counters').notNull().default({}),
  milestonesReached: integer('milestones_reached').array().notNull().default([]),
  uniqueSets: jsonb('unique_sets').notNull().default({}),
  streakData: jsonb('streak_data').notNull().default({}),
  startedAt: timestamp('started_at', { withTimezone: true }),
  lastProgressAt: timestamp('last_progress_at', { withTimezone: true }),
  completedAt: timestamp('completed_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  userAchievementIdx: uniqueIndex('progress_user_achievement_idx').on(table.userId, table.achievementId),
  tenantUserIdx: index('progress_tenant_user_idx').on(table.tenantId, table.userId),
  statusIdx: index('progress_status_idx').on(table.status),
  percentageIdx: index('progress_percentage_idx').on(table.percentage),
}));
```

### achievement_unlocks

Immutable log of achievement unlocks (and revocations).

```typescript
export const unlockMethodEnum = pgEnum('unlock_method', [
  'event', 'manual_grant', 'bulk_grant', 'meta_achievement', 'migration',
]);

export const achievementUnlocks = pgTable('achievement_unlocks', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id),
  achievementId: uuid('achievement_id').notNull().references(() => achievements.id),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id),
  method: unlockMethodEnum('method').notNull(),
  triggerEventId: uuid('trigger_event_id'),
  grantedBy: uuid('granted_by').references(() => users.id),
  reason: text('reason'),
  isRevoked: boolean('is_revoked').notNull().default(false),
  revokedAt: timestamp('revoked_at', { withTimezone: true }),
  revokedBy: uuid('revoked_by').references(() => users.id),
  revokeReason: text('revoke_reason'),
  unlockedAt: timestamp('unlocked_at', { withTimezone: true }).notNull().defaultNow(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  userAchievementIdx: uniqueIndex('unlocks_user_achievement_idx')
    .on(table.userId, table.achievementId)
    .where(sql`is_revoked = false`),
  tenantUserIdx: index('unlocks_tenant_user_idx').on(table.tenantId, table.userId),
  achievementIdx: index('unlocks_achievement_idx').on(table.achievementId),
  unlockedAtIdx: index('unlocks_unlocked_at_idx').on(table.unlockedAt),
  methodIdx: index('unlocks_method_idx').on(table.method),
}));
```

### badges

Visual badge assets.

```typescript
export const badgeFormatEnum = pgEnum('badge_format', [
  'svg', 'png', 'webp', 'lottie',
]);

export const badges = pgTable('badges', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').references(() => tenants.id),
  name: text('name').notNull(),
  description: text('description').notNull(),
  format: badgeFormatEnum('format').notNull(),
  imageUrl: text('image_url').notNull(),
  lockedImageUrl: text('locked_image_url'),
  animatedImageUrl: text('animated_image_url'),
  primaryColor: text('primary_color').notNull().default('#6366F1'),
  secondaryColor: text('secondary_color'),
  tier: text('tier').notNull().default('bronze'),
  width: integer('width').notNull(),
  height: integer('height').notNull(),
  fileSizeBytes: integer('file_size_bytes').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  tenantIdx: index('badges_tenant_idx').on(table.tenantId),
  tierIdx: index('badges_tier_idx').on(table.tier),
}));
```

### achievement_groups

Groups of related achievements.

```typescript
export const achievementGroups = pgTable('achievement_groups', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').references(() => tenants.id),
  name: text('name').notNull(),
  description: text('description').notNull(),
  slug: text('slug').notNull(),
  iconUrl: text('icon_url'),
  primaryColor: text('primary_color'),
  sortOrder: integer('sort_order').notNull().default(0),
  metaAchievementId: uuid('meta_achievement_id'),
  showCompletion: boolean('show_completion').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  slugTenantIdx: uniqueIndex('groups_slug_tenant_idx').on(table.slug, table.tenantId),
  tenantIdx: index('groups_tenant_idx').on(table.tenantId),
  sortOrderIdx: index('groups_sort_order_idx').on(table.sortOrder),
}));
```

### achievement_rewards

Reward definitions attached to achievements.

```typescript
export const rewardTypeEnum = pgEnum('reward_type', [
  'points', 'xp', 'coupon', 'token', 'physical', 'badge', 'unlock', 'custom',
]);

export const achievementRewards = pgTable('achievement_rewards', {
  id: uuid('id').primaryKey().defaultRandom(),
  achievementId: uuid('achievement_id').notNull().references(() => achievements.id, { onDelete: 'cascade' }),
  rewardType: rewardTypeEnum('reward_type').notNull(),
  config: jsonb('config').notNull(),
  description: text('description').notNull(),
  sortOrder: integer('sort_order').notNull().default(0),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  achievementIdx: index('rewards_achievement_idx').on(table.achievementId),
  rewardTypeIdx: index('rewards_type_idx').on(table.rewardType),
}));
```

### achievement_criteria

Flattened criteria records for querying which achievements match a given event type.

```typescript
export const achievementCriteria = pgTable('achievement_criteria', {
  id: uuid('id').primaryKey().defaultRandom(),
  achievementId: uuid('achievement_id').notNull().references(() => achievements.id, { onDelete: 'cascade' }),
  criteriaNodeId: text('criteria_node_id').notNull(),
  eventType: text('event_type').notNull(),
  criteriaType: text('criteria_type').notNull(),
  targetValue: integer('target_value').notNull(),
  valuePath: text('value_path'),
  streakInterval: text('streak_interval'),
  timeWindow: text('time_window'),
  eventFilters: jsonb('event_filters'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  achievementIdx: index('criteria_achievement_idx').on(table.achievementId),
  eventTypeIdx: index('criteria_event_type_idx').on(table.eventType),
  achievementEventIdx: index('criteria_achievement_event_idx').on(table.achievementId, table.eventType),
}));
```

### achievement_events

Event log for audit, replay, and debugging.

```typescript
export const achievementEvents = pgTable('achievement_events', {
  id: uuid('id').primaryKey(),
  eventType: text('event_type').notNull(),
  userId: uuid('user_id').notNull().references(() => users.id),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id),
  payload: jsonb('payload').notNull(),
  occurredAt: timestamp('occurred_at', { withTimezone: true }).notNull(),
  receivedAt: timestamp('received_at', { withTimezone: true }).notNull().defaultNow(),
  status: text('status').notNull().default('pending'),
  evaluationCount: integer('evaluation_count').notNull().default(0),
  unlockCount: integer('unlock_count').notNull().default(0),
  errorMessage: text('error_message'),
  processedAt: timestamp('processed_at', { withTimezone: true }),
}, (table) => ({
  eventTypeIdx: index('events_event_type_idx').on(table.eventType),
  userIdx: index('events_user_idx').on(table.userId),
  tenantIdx: index('events_tenant_idx').on(table.tenantId),
  statusIdx: index('events_status_idx').on(table.status),
  occurredAtIdx: index('events_occurred_at_idx').on(table.occurredAt),
  receivedAtIdx: index('events_received_at_idx').on(table.receivedAt),
}));
```

### achievement_milestones

Milestone definitions for achievements (optional sub-milestones beyond the default 25/50/75%).

```typescript
export const achievementMilestones = pgTable('achievement_milestones', {
  id: uuid('id').primaryKey().defaultRandom(),
  achievementId: uuid('achievement_id').notNull().references(() => achievements.id, { onDelete: 'cascade' }),
  percentage: integer('percentage').notNull(), // basis points (0-10000)
  name: text('name').notNull(),
  description: text('description'),
  rewardId: uuid('reward_id').references(() => achievementRewards.id),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  achievementIdx: index('milestones_achievement_idx').on(table.achievementId),
  achievementPercentageIdx: uniqueIndex('milestones_achievement_percentage_idx')
    .on(table.achievementId, table.percentage),
}));
```

### achievement_display_slots

User badge display configuration.

```typescript
export const achievementDisplaySlots = pgTable('achievement_display_slots', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id),
  slotType: text('slot_type').notNull(), // 'featured', 'collection', 'title'
  position: integer('position').notNull(),
  unlockId: uuid('unlock_id').notNull().references(() => achievementUnlocks.id),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  userSlotIdx: uniqueIndex('display_user_slot_idx').on(table.userId, table.slotType, table.position),
  tenantUserIdx: index('display_tenant_user_idx').on(table.tenantId, table.userId),
}));
```

### achievement_share_tokens

Short-lived share tokens for public achievement sharing.

```typescript
export const achievementShareTokens = pgTable('achievement_share_tokens', {
  id: uuid('id').primaryKey().defaultRandom(),
  unlockId: uuid('unlock_id').notNull().references(() => achievementUnlocks.id),
  userId: uuid('user_id').notNull().references(() => users.id),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id),
  token: text('token').notNull().unique(),
  viewCount: integer('view_count').notNull().default(0),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  tokenIdx: uniqueIndex('share_token_idx').on(table.token),
  userIdx: index('share_user_idx').on(table.userId),
  expiresAtIdx: index('share_expires_at_idx').on(table.expiresAt),
}));
```

### Row-Level Security Policies

All tables have RLS policies enforcing tenant isolation:

```sql
-- Enable RLS on all achievement tables
ALTER TABLE achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE achievement_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE achievement_unlocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE achievement_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE achievement_rewards ENABLE ROW LEVEL SECURITY;
ALTER TABLE achievement_criteria ENABLE ROW LEVEL SECURITY;
ALTER TABLE achievement_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE achievement_milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE achievement_display_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE achievement_share_tokens ENABLE ROW LEVEL SECURITY;

-- Achievements: tenant isolation + platform scope visibility
CREATE POLICY "achievements_tenant_read" ON achievements
  FOR SELECT USING (
    tenant_id = current_setting('app.tenant_id')::uuid
    OR scope = 'platform'
  );

CREATE POLICY "achievements_tenant_write" ON achievements
  FOR ALL USING (
    tenant_id = current_setting('app.tenant_id')::uuid
  );

-- Progress: user can read own progress, tenant admins can read all
CREATE POLICY "progress_user_read" ON achievement_progress
  FOR SELECT USING (
    user_id = current_setting('app.user_id')::uuid
    AND tenant_id = current_setting('app.tenant_id')::uuid
  );

CREATE POLICY "progress_admin_read" ON achievement_progress
  FOR SELECT USING (
    tenant_id = current_setting('app.tenant_id')::uuid
    AND current_setting('app.role') = 'admin'
  );

-- Service role bypasses RLS for cross-tenant operations
CREATE POLICY "service_role_bypass" ON achievements
  FOR ALL USING (
    current_setting('app.role') = 'service'
  );

-- Unlocks: user can read own, admin can read all within tenant
CREATE POLICY "unlocks_user_read" ON achievement_unlocks
  FOR SELECT USING (
    user_id = current_setting('app.user_id')::uuid
    AND tenant_id = current_setting('app.tenant_id')::uuid
  );

CREATE POLICY "unlocks_admin_all" ON achievement_unlocks
  FOR ALL USING (
    tenant_id = current_setting('app.tenant_id')::uuid
    AND current_setting('app.role') = 'admin'
  );

-- Display slots: user manages own slots
CREATE POLICY "display_user_manage" ON achievement_display_slots
  FOR ALL USING (
    user_id = current_setting('app.user_id')::uuid
    AND tenant_id = current_setting('app.tenant_id')::uuid
  );

-- Share tokens: user creates own, anyone can read by token
CREATE POLICY "share_user_manage" ON achievement_share_tokens
  FOR ALL USING (
    user_id = current_setting('app.user_id')::uuid
    AND tenant_id = current_setting('app.tenant_id')::uuid
  );

CREATE POLICY "share_public_read" ON achievement_share_tokens
  FOR SELECT USING (
    expires_at > now()
  );
```

---

## Code Examples

### Example 1: Creating an Achievement Definition

```typescript
import { AchievementService } from '@mcv/engagement/achievements';
import { AchievementRarity, AchievementVisibility, AchievementScope } from '@mcv/engagement/achievements';

const achievementService = container.resolve(AchievementService);

// Create a multi-criteria achievement
const achievement = await achievementService.create({
  slug: 'power-shopper-2024',
  name: 'Power Shopper 2024',
  description: 'Complete 10 purchases totaling $500+ with at least 3 reviews in 2024.',
  flavorText: 'Your wallet fears you — but the deals love you! 🛍️',
  category: 'commerce',
  rarity: AchievementRarity.EPIC,
  visibility: AchievementVisibility.VISIBLE,
  scope: AchievementScope.VENTURE,
  xpReward: 500,
  pointReward: 200,
  tags: ['commerce', '2024', 'seasonal', 'shopping'],
  availableFrom: '2024-01-01T00:00:00Z',
  availableUntil: '2024-12-31T23:59:59Z',
  criteria: {
    id: 'root',
    type: 'combinator',
    operator: 'AND',
    description: 'Complete all shopping objectives',
    children: [
      {
        id: 'purchase_count',
        type: 'leaf',
        criteriaType: 'count',
        eventTypes: ['commerce.order.completed'],
        valuePath: null,
        operator: 'gte',
        targetValue: 10,
        streakInterval: null,
        timeWindow: null,
        eventFilters: null,
        weight: 1.0,
        description: 'Complete 10 purchases',
      },
      {
        id: 'purchase_total',
        type: 'leaf',
        criteriaType: 'sum',
        eventTypes: ['commerce.order.completed'],
        valuePath: '$.payload.order.total',
        operator: 'gte',
        targetValue: 500,
        streakInterval: null,
        timeWindow: null,
        eventFilters: null,
        weight: 1.0,
        description: 'Spend $500+ total',
      },
      {
        id: 'review_count',
        type: 'leaf',
        criteriaType: 'count',
        eventTypes: ['commerce.review.created'],
        valuePath: null,
        operator: 'gte',
        targetValue: 3,
        streakInterval: null,
        timeWindow: null,
        eventFilters: null,
        weight: 0.5,
        description: 'Write at least 3 reviews',
      },
    ],
  },
  metadata: {
    seasonalEvent: '2024-holiday',
    designedBy: 'marketing-team',
  },
});

console.log(`Created achievement: ${achievement.id} (${achievement.status})`);
// Created achievement: 01914a2b-... (draft)

// Publish the achievement to make it earnable
const published = await achievementService.publish(achievement.id);
console.log(`Published at: ${published.publishedAt}`);
```

### Example 2: Processing Events and Tracking Progress

```typescript
import { AchievementProgressService, AchievementCriteriaEngine } from '@mcv/engagement/achievements';
import type { AchievementEvent } from '@mcv/engagement/achievements';

const progressService = container.resolve(AchievementProgressService);
const criteriaEngine = container.resolve(AchievementCriteriaEngine);

// This runs inside the Redpanda consumer handler
async function handleDomainEvent(event: AchievementEvent): Promise<void> {
  // 1. Find all active achievements with criteria matching this event type
  const matchingAchievements = await achievementCriteriaRepo.findByEventType(
    event.eventType,
    event.tenantId,
  );

  for (const achievement of matchingAchievements) {
    // 2. Skip if user already unlocked this achievement
    const alreadyUnlocked = await unlockRepo.exists(event.userId, achievement.id);
    if (alreadyUnlocked) continue;

    // 3. Load or create progress record
    const progress = await progressService.getOrCreate(event.userId, achievement.id);

    // 4. Process event through the criteria engine
    const result = criteriaEngine.processEvent(
      achievement.criteria,
      progress,
      event,
    );

    if (!result.hasChanges) continue;

    // 5. Persist updated progress
    await progressService.update(progress.id, result.progress);

    // 6. Emit progress update event
    await eventBus.emit(new AchievementProgressUpdatedEvent({
      userId: event.userId,
      achievementId: achievement.id,
      percentage: result.progress.percentage,
      changes: result.changes,
    }));

    // 7. Handle milestone notifications
    for (const milestone of result.newMilestones) {
      await notificationService.sendMilestone(event.userId, achievement, milestone);
    }

    // 8. If criteria fully met, trigger unlock
    if (result.isComplete) {
      await unlockService.unlock({
        userId: event.userId,
        achievementId: achievement.id,
        method: 'event',
        triggerEventId: event.id,
      });
    }
  }
}
```

### Example 3: Configuring Badges and Display Slots

```typescript
import { BadgeService, AchievementService } from '@mcv/engagement/achievements';

const badgeService = container.resolve(BadgeService);
const achievementService = container.resolve(AchievementService);

// Create a badge
const badge = await badgeService.create({
  name: 'Power Shopper 2024',
  description: 'Awarded for mastering the art of shopping in 2024',
  format: 'svg',
  imageUrl: 'https://cdn.mcv.one/badges/power-shopper-2024.svg',
  lockedImageUrl: 'https://cdn.mcv.one/badges/power-shopper-2024-locked.svg',
  animatedImageUrl: 'https://cdn.mcv.one/badges/power-shopper-2024.lottie.json',
  primaryColor: '#FFD700',
  secondaryColor: '#FFA500',
  tier: 'gold',
  width: 256,
  height: 256,
  fileSizeBytes: 4820,
});

// Attach badge to achievement
await achievementService.update(achievementId, {
  badgeId: badge.id,
});

// --- User configures their display slots ---

import { useAchievementDisplaySlots } from '@mcv/engagement/achievements';

function BadgeDisplayManager() {
  const { slots, setFeatured, addToCollection, removeFromCollection, reorder } = useAchievementDisplaySlots();

  // Set a featured badge (prominent profile display)
  const handleSetFeatured = async (unlockId: string) => {
    await setFeatured(unlockId);
  };

  // Add a badge to the collection grid (up to 8)
  const handleAddToCollection = async (unlockId: string) => {
    await addToCollection(unlockId);
  };

  // Reorder collection badges
  const handleReorder = async (unlockIds: string[]) => {
    await reorder(unlockIds);
  };

  return (
    <div>
      <h2>Featured Badge</h2>
      {slots.featured && (
        <BadgeDisplay badge={slots.featured.badge} size="large" animated />
      )}

      <h2>Badge Collection</h2>
      <div className="badge-grid">
        {slots.collection.map((slot) => (
          <BadgeDisplay
            key={slot.id}
            badge={slot.badge}
            size="medium"
            onRemove={() => removeFromCollection(slot.id)}
          />
        ))}
      </div>
    </div>
  );
}
```

### Example 4: Achievement Groups and Meta-Achievements

```typescript
import { AchievementGroupService, AchievementService } from '@mcv/engagement/achievements';

const groupService = container.resolve(AchievementGroupService);
const achievementService = container.resolve(AchievementService);

// Create a group
const group = await groupService.create({
  name: 'Commerce Master',
  description: 'Complete all commerce-related achievements to prove your shopping mastery.',
  slug: 'commerce-master',
  iconUrl: 'https://cdn.mcv.one/groups/commerce-master.svg',
  primaryColor: '#10B981',
  showCompletion: true,
});

// Create the meta-achievement (awarded when all group members are unlocked)
const metaAchievement = await achievementService.create({
  slug: 'commerce-master-complete',
  name: 'Commerce Master',
  description: 'Unlocked all achievements in the Commerce Master collection.',
  flavorText: 'You have mastered the art of commerce. Respect. 👑',
  category: 'meta',
  rarity: 'legendary',
  visibility: 'hidden', // Only shown after unlock
  scope: 'venture',
  xpReward: 2000,
  pointReward: 1000,
  criteria: {
    id: 'root',
    type: 'combinator',
    operator: 'AND',
    description: 'Complete all Commerce Master achievements',
    children: [], // Auto-populated based on group membership
  },
  tags: ['meta', 'commerce', 'collection'],
});

// Link meta-achievement to group
await groupService.update(group.id, {
  metaAchievementId: metaAchievement.id,
});

// Add achievements to the group
await groupService.addAchievements(group.id, [
  'power-shopper-achievement-id',
  'first-purchase-achievement-id',
  'review-writer-achievement-id',
  'loyalty-member-achievement-id',
  'referral-king-achievement-id',
]);

// Check a user's group completion
const completion = await achievementService.getGroupCompletion(userId, group.id);
console.log(`Group: ${completion.group.name}`);
console.log(`Progress: ${(completion.completionPercentage * 100).toFixed(0)}%`);
console.log(`Unlocked: ${completion.achievements.filter(a => a.isUnlocked).length}/${completion.achievements.length}`);
// Group: Commerce Master
// Progress: 60%
// Unlocked: 3/5
```

### Example 5: Real-Time Notifications and Celebrations

```typescript
import { AchievementNotificationService } from '@mcv/engagement/achievements';

const notificationService = container.resolve(AchievementNotificationService);

// --- Server-side: Send unlock notification ---

async function onAchievementUnlocked(unlock: AchievementUnlock): Promise<void> {
  const achievement = await achievementService.getById(unlock.achievementId, {
    include: ['badge', 'rewards'],
  });

  // Determine celebration type based on rarity
  const celebrationType = getCelebrationForRarity(achievement.rarity);

  const notification: AchievementNotification = {
    id: generateId(),
    type: 'unlock',
    userId: unlock.userId,
    tenantId: unlock.tenantId,
    achievementId: achievement.id,
    achievementName: achievement.name,
    achievementDescription: achievement.flavorText ?? achievement.description,
    badgeImageUrl: achievement.badge?.imageUrl ?? null,
    rarity: achievement.rarity,
    celebrationType,
    celebrationDurationMs: celebrationType === 'fireworks' ? 5000 : 3000,
    rewards: achievement.rewards?.map(r => ({
      type: r.rewardType,
      description: r.description,
      amount: r.config.amount ?? null,
    })) ?? [],
    progress: null,
    shareUrl: null,
    createdAt: new Date().toISOString(),
  };

  // Send via WebSocket for real-time delivery
  await wsService.sendToUser(unlock.userId, 'achievement:unlocked', notification);

  // Also queue for push notification (if user is offline)
  await pushQueue.enqueue({
    userId: unlock.userId,
    title: '🏆 Achievement Unlocked!',
    body: `${achievement.name} — ${achievement.flavorText ?? achievement.description}`,
    imageUrl: achievement.badge?.imageUrl,
    data: { achievementId: achievement.id, type: 'achievement_unlock' },
  });
}

function getCelebrationForRarity(rarity: AchievementRarity): string {
  switch (rarity) {
    case 'common': return 'glow';
    case 'uncommon': return 'confetti';
    case 'rare': return 'confetti';
    case 'epic': return 'fireworks';
    case 'legendary': return 'fireworks';
    default: return 'none';
  }
}

// --- Client-side: Listen for notifications ---

import { useAchievementNotifications } from '@mcv/engagement/achievements';

function AchievementNotificationListener() {
  const { latestNotification, dismiss } = useAchievementNotifications({
    onUnlock: (notification) => {
      // Trigger celebration animation
      showCelebration(notification.celebrationType, notification.celebrationDurationMs);
    },
    onMilestone: (notification) => {
      // Show progress toast
      showToast(`${notification.achievementName}: ${(notification.progress!.percentage * 100).toFixed(0)}% complete!`);
    },
    onAlmostThere: (notification) => {
      // Show encouraging toast
      showToast(`Almost there! ${notification.achievementName} is ${(notification.progress!.percentage * 100).toFixed(0)}% complete.`);
    },
  });

  if (!latestNotification) return null;

  return (
    <AchievementUnlockOverlay
      notification={latestNotification}
      onDismiss={dismiss}
      onShare={() => handleShare(latestNotification.achievementId)}
    />
  );
}
```

### Example 6: Leaderboards and Ranking

```typescript
import { AchievementLeaderboardService } from '@mcv/engagement/achievements';
import { LeaderboardPeriod } from '@mcv/engagement/achievements';

const leaderboardService = container.resolve(AchievementLeaderboardService);

// Get the all-time leaderboard with rarity-weighted scoring
const leaderboard = await leaderboardService.getLeaderboard({
  period: LeaderboardPeriod.ALL_TIME,
  scoringMethod: 'rarity_weighted', // Uses ACHIEVEMENT_RARITY_WEIGHTS
  limit: 50,
});

for (const entry of leaderboard.items) {
  console.log(
    `#${entry.rank} ${entry.displayName} — ` +
    `Score: ${entry.weightedScore} | ` +
    `Total: ${entry.totalUnlocks} | ` +
    `Legendary: ${entry.rarityBreakdown.legendary}`
  );
}
// #1 AliceX — Score: 1284 | Total: 47 | Legendary: 3
// #2 BobTheBuilder — Score: 1156 | Total: 52 | Legendary: 2
// #3 CharlieSheen — Score: 998 | Total: 41 | Legendary: 2

// Get a specific user's rank
const myRank = await leaderboardService.getUserRank(userId, {
  period: LeaderboardPeriod.MONTHLY,
  scoringMethod: 'rarity_weighted',
});

if (myRank) {
  console.log(`Your rank: #${myRank.rank} with score ${myRank.weightedScore}`);
}

// --- Monthly leaderboard with simple count scoring ---

const monthlyBoard = await leaderboardService.getLeaderboard({
  period: LeaderboardPeriod.MONTHLY,
  scoringMethod: 'count', // Simple achievement count
  limit: 10,
});

// --- Venture-specific leaderboard ---

const ventureBoard = await leaderboardService.getLeaderboard({
  period: LeaderboardPeriod.ALL_TIME,
  scoringMethod: 'rarity_weighted',
  scope: 'venture', // Only achievements from current tenant
  limit: 25,
});
```

### Example 7: Cross-Venture Achievements

```typescript
import { AchievementService } from '@mcv/engagement/achievements';
import { AchievementScope } from '@mcv/engagement/achievements';

const achievementService = container.resolve(AchievementService);

// Create a platform-wide achievement that tracks across all ventures
const platformAchievement = await achievementService.create({
  slug: 'ecosystem-explorer',
  name: 'Ecosystem Explorer',
  description: 'Make a purchase in 3 different MCV ventures.',
  flavorText: 'You really get around! The MCV ecosystem is your playground. 🌍',
  category: 'platform',
  rarity: 'rare',
  visibility: 'visible',
  scope: AchievementScope.CROSS_VENTURE,
  xpReward: 300,
  pointReward: 150,
  tags: ['platform', 'cross-venture', 'exploration'],
  criteria: {
    id: 'root',
    type: 'leaf',
    criteriaType: 'unique',
    eventTypes: ['commerce.order.completed'],
    valuePath: '$.metadata.tenantId',
    operator: 'gte',
    targetValue: 3,
    streakInterval: null,
    timeWindow: null,
    eventFilters: null,
    weight: 1.0,
    description: 'Purchase from 3 different ventures',
  },
  metadata: {
    crossVenture: true,
    minimumVentures: 3,
  },
});

// Create a cross-venture achievement referencing specific tenants
const crossVentureAchievement = await achievementService.create({
  slug: 'triple-threat',
  name: 'Triple Threat',
  description: 'Complete your profile on MCV Commerce, MCV Social, and MCV Learn.',
  category: 'platform',
  rarity: 'epic',
  scope: AchievementScope.CROSS_VENTURE,
  xpReward: 750,
  pointReward: 400,
  criteria: {
    id: 'root',
    type: 'combinator',
    operator: 'AND',
    description: 'Complete profiles on all three ventures',
    children: [
      {
        id: 'commerce_profile',
        type: 'leaf',
        criteriaType: 'boolean',
        eventTypes: ['user.profile.completed'],
        valuePath: null,
        operator: 'gte',
        targetValue: 1,
        eventFilters: { '$.metadata.tenantSlug': 'mcv-commerce' },
        weight: 1.0,
        description: 'Complete MCV Commerce profile',
        streakInterval: null,
        timeWindow: null,
      },
      {
        id: 'social_profile',
        type: 'leaf',
        criteriaType: 'boolean',
        eventTypes: ['user.profile.completed'],
        valuePath: null,
        operator: 'gte',
        targetValue: 1,
        eventFilters: { '$.metadata.tenantSlug': 'mcv-social' },
        weight: 1.0,
        description: 'Complete MCV Social profile',
        streakInterval: null,
        timeWindow: null,
      },
      {
        id: 'learn_profile',
        type: 'leaf',
        criteriaType: 'boolean',
        eventTypes: ['user.profile.completed'],
        valuePath: null,
        operator: 'gte',
        targetValue: 1,
        eventFilters: { '$.metadata.tenantSlug': 'mcv-learn' },
        weight: 1.0,
        description: 'Complete MCV Learn profile',
        streakInterval: null,
        timeWindow: null,
      },
    ],
  },
  tags: ['platform', 'cross-venture', 'profiles'],
});

// Query all platform achievements available to a user
const platformAchievements = await achievementService.listForUser(userId, {
  scope: [AchievementScope.PLATFORM, AchievementScope.CROSS_VENTURE],
  status: ['active'],
  sortBy: 'rarity',
  sortDir: 'desc',
  limit: 50,
});

for (const achievement of platformAchievements.items) {
  const progressStr = achievement.isUnlocked
    ? `✅ Unlocked ${achievement.unlockedAt}`
    : `${(achievement.progress?.percentage ?? 0) * 100}% complete`;
  console.log(`[${achievement.rarity.toUpperCase()}] ${achievement.name} — ${progressStr}`);
}
```

### Example 8: Admin Tools — Analytics and Bulk Operations

```typescript
import { AchievementAdminService, AchievementAnalyticsService } from '@mcv/engagement/achievements';

const adminService = container.resolve(AchievementAdminService);
const analyticsService = container.resolve(AchievementAnalyticsService);

// --- Analytics ---

// Get detailed analytics for a specific achievement
const analytics = await analyticsService.getAnalytics(achievementId);

console.log(`Achievement: ${analytics.achievementId}`);
console.log(`Total Unlocks: ${analytics.totalUnlocks}`);
console.log(`Unlock Rate: ${(analytics.unlockRate * 100).toFixed(1)}%`);
console.log(`Median Time to Unlock: ${formatDuration(analytics.medianTimeToUnlock)}`);
console.log(`Users In Progress: ${analytics.usersInProgress}`);
console.log('\nProgress Distribution:');
for (const bucket of analytics.progressDistribution) {
  console.log(`  ${bucket.bucket}: ${bucket.count} users`);
}
console.log('\nDrop-off Points:');
for (const point of analytics.dropOffPoints) {
  console.log(`  ${point.criteriaDescription}: ${(point.dropOffRate * 100).toFixed(1)}% drop off`);
}

// Get overview analytics across all achievements
const overview = await analyticsService.getOverviewAnalytics({
  period: 'last_30_days',
  groupBy: 'rarity',
});

// --- Bulk Operations ---

// Grant an achievement to a segment of users (e.g., early adopters)
const earlyAdopterUserIds = await userService.getByJoinDateBefore('2024-01-01');

const grantResult = await adminService.bulkGrant(
  achievementId,
  earlyAdopterUserIds,
  'Retroactive grant for early adopters (2023 cohort)',
);

console.log(`Bulk grant results:`);
console.log(`  Succeeded: ${grantResult.succeeded}`);
console.log(`  Failed: ${grantResult.failed}`);
console.log(`  Skipped (already unlocked): ${grantResult.skipped}`);
if (grantResult.errors.length > 0) {
  console.log(`  Errors:`);
  for (const error of grantResult.errors) {
    console.log(`    User ${error.userId}: ${error.message}`);
  }
}

// Revoke an achievement due to criteria change
const revokeResult = await adminService.bulkRevoke(
  achievementId,
  affectedUserIds,
  'Achievement criteria updated — re-evaluation required',
);

// --- Achievement Designer (Admin API) ---

// Clone an existing achievement as a template
const cloned = await adminService.cloneAchievement(achievementId, {
  newSlug: 'power-shopper-2025',
  newName: 'Power Shopper 2025',
  modifications: {
    availableFrom: '2025-01-01T00:00:00Z',
    availableUntil: '2025-12-31T23:59:59Z',
    tags: ['commerce', '2025', 'seasonal', 'shopping'],
  },
});

// Export achievement definitions for backup or migration
const exported = await adminService.exportAchievements({
  status: ['active', 'paused'],
  includeRewards: true,
  includeBadges: true,
  format: 'json',
});

// Import achievement definitions
const importResult = await adminService.importAchievements(exported, {
  mode: 'create_only', // 'create_only' | 'upsert' | 'dry_run'
  skipExisting: true,
});

console.log(`Import results: ${importResult.created} created, ${importResult.skipped} skipped`);
```

---

## Error Codes

All errors thrown by this module extend `AchievementError` and include a machine-readable `code` field, a human-readable `message`, and optional `details`.

| Code | HTTP Status | Description |
|---|---|---|
| `ACHIEVEMENT_NOT_FOUND` | 404 | Achievement with the specified ID or slug does not exist or is not accessible in the current tenant context. |
| `ACHIEVEMENT_ALREADY_EXISTS` | 409 | An achievement with the same slug already exists in this tenant. |
| `ACHIEVEMENT_ALREADY_PUBLISHED` | 409 | Cannot modify an achievement that has been published. Archive it and create a new version instead. |
| `ACHIEVEMENT_ALREADY_ARCHIVED` | 409 | Cannot perform this operation on an archived achievement. Archived achievements are permanently retired. |
| `ACHIEVEMENT_ALREADY_UNLOCKED` | 409 | The user has already unlocked this achievement. Duplicate unlocks are prevented. |
| `ACHIEVEMENT_NOT_ACTIVE` | 400 | The achievement is not in `active` status. Only active achievements can be unlocked. |
| `ACHIEVEMENT_EXPIRED` | 400 | The achievement's `availableUntil` date has passed. This achievement can no longer be unlocked. |
| `ACHIEVEMENT_NOT_YET_AVAILABLE` | 400 | The achievement's `availableFrom` date has not been reached. This achievement is not yet earnable. |
| `ACHIEVEMENT_MAX_UNLOCKS_REACHED` | 400 | The achievement has reached its `maxUnlocks` limit. No more users can unlock this achievement. |
| `ACHIEVEMENT_INVALID_CRITERIA` | 422 | The criteria tree is malformed. Possible issues: circular references, invalid operators, missing required fields, NOT node with multiple children. |
| `ACHIEVEMENT_CRITERIA_TOO_DEEP` | 422 | The criteria tree exceeds the maximum nesting depth (default: 10 levels). Simplify the criteria structure. |
| `ACHIEVEMENT_CRITERIA_TOO_MANY` | 422 | The criteria tree contains more than `MAX_ACHIEVEMENT_CRITERIA` (default: 50) leaf nodes. Reduce complexity. |
| `BADGE_NOT_FOUND` | 404 | Badge with the specified ID does not exist or is not accessible in the current tenant context. |
| `BADGE_INVALID_FORMAT` | 422 | The badge image format is not supported. Supported formats: SVG, PNG, WEBP, Lottie JSON. |
| `BADGE_TOO_LARGE` | 413 | The badge image exceeds the maximum file size (default: 2MB for raster, 500KB for SVG). |
| `GROUP_NOT_FOUND` | 404 | Achievement group with the specified ID does not exist or is not accessible in the current tenant context. |
| `GROUP_ALREADY_EXISTS` | 409 | An achievement group with the same slug already exists in this tenant. |
| `GROUP_META_CIRCULAR` | 422 | Cannot set a meta-achievement that is itself a member of this group. Circular meta-achievements are not allowed. |
| `PROGRESS_NOT_FOUND` | 404 | No progress record exists for this user-achievement pair. Progress is created on first relevant event. |
| `PROGRESS_ALREADY_COMPLETED` | 409 | Cannot update progress for an achievement that has already been completed by this user. |
| `DISPLAY_SLOT_FULL` | 400 | The requested display slot type has reached its maximum capacity. Remove a badge before adding a new one. |
| `DISPLAY_SLOT_NOT_UNLOCKED` | 403 | Cannot display a badge for an achievement that the user has not unlocked. |
| `SHARE_TOKEN_EXPIRED` | 410 | The share token has expired. Share tokens are valid for `SHARE_TOKEN_EXPIRY_HOURS` (default: 72 hours). |
| `SHARE_TOKEN_NOT_FOUND` | 404 | The share token does not exist. It may have expired and been cleaned up. |
| `REWARD_CONFIG_INVALID` | 422 | The reward configuration is invalid for the specified reward type. Check the required config fields. |
| `LEADERBOARD_PERIOD_INVALID` | 400 | The specified leaderboard period is not supported. Supported: daily, weekly, monthly, all_time. |
| `BULK_OPERATION_PARTIAL_FAILURE` | 207 | The bulk operation completed with some failures. Check the `errors` array in the response for details. |
| `BULK_OPERATION_TOO_LARGE` | 413 | The bulk operation exceeds the maximum batch size (default: 10,000 users per operation). |
| `TENANT_ACHIEVEMENT_LIMIT_REACHED` | 429 | The tenant has reached the maximum number of achievements (`MAX_ACHIEVEMENTS_PER_VENTURE`, default: 1000). Archive unused achievements to make room. |
| `TENANT_GROUP_LIMIT_REACHED` | 429 | The tenant has reached the maximum number of achievement groups (`MAX_GROUPS_PER_VENTURE`, default: 100). |
| `EVENT_PROCESSING_FAILED` | 500 | Failed to process the domain event against achievement criteria. The event will be retried. |
| `CRITERIA_EVALUATION_TIMEOUT` | 504 | Criteria evaluation timed out. The criteria tree may be too complex or the database query too slow. |

### Error Response Format

```typescript
interface AchievementError {
  /** Machine-readable error code */
  code: string;

  /** Human-readable error message */
  message: string;

  /** HTTP status code */
  statusCode: number;

  /** Additional context (varies by error) */
  details?: Record<string, unknown>;
}

// Example error response:
{
  "code": "ACHIEVEMENT_MAX_UNLOCKS_REACHED",
  "message": "Achievement 'First 100 Users' has reached its maximum unlock limit of 100.",
  "statusCode": 400,
  "details": {
    "achievementId": "01914a2b-...",
    "achievementName": "First 100 Users",
    "maxUnlocks": 100,
    "currentUnlocks": 100
  }
}
```

---

## Security

### Authentication & Authorization

All achievement endpoints require authentication via the MCV identity system. Authorization is enforced at multiple levels:

| Operation | Required Permission | Scope |
|---|---|---|
| List achievements | `achievement:read` | Tenant |
| View own progress | `achievement:read` | User (own data) |
| View own unlocks | `achievement:read` | User (own data) |
| Manage display slots | `achievement:read` | User (own data) |
| Create share tokens | `achievement:share` | User (own data) |
| View leaderboards | `achievement:read` | Tenant |
| Create achievement | `achievement:admin` | Tenant |
| Update achievement | `achievement:admin` | Tenant |
| Publish achievement | `achievement:admin` | Tenant |
| Archive achievement | `achievement:admin` | Tenant |
| Manual grant/revoke | `achievement:admin` | Tenant |
| Bulk operations | `achievement:admin` | Tenant |
| View analytics | `achievement:analytics` | Tenant |
| Create/update badges | `achievement:admin` | Tenant |
| Create/update groups | `achievement:admin` | Tenant |
| Platform achievements | `achievement:platform_admin` | Platform |

### Row-Level Security (RLS)

All database operations pass through Supabase RLS policies. The application sets `app.tenant_id`, `app.user_id`, and `app.role` via `SET LOCAL` before each query:

```typescript
// Middleware that sets RLS context before each request
async function setRLSContext(ctx: RequestContext): Promise<void> {
  await ctx.db.execute(sql`
    SELECT set_config('app.tenant_id', ${ctx.tenantId}, true);
    SELECT set_config('app.user_id', ${ctx.userId}, true);
    SELECT set_config('app.role', ${ctx.role}, true);
  `);
}
```

### Data Protection

1. **Progress data is user-private** — Users can only view their own progress. Admins can view aggregate analytics but not individual user progress without explicit permission.

2. **Unlock records are tamper-proof** — Achievement unlocks are append-only. Revocations create a separate audit record rather than deleting the original unlock.

3. **Event payload sanitization** — Event payloads are sanitized before storage in `achievement_events`. PII fields are stripped or hashed according to the tenant's data retention policy.

4. **Badge asset validation** — Uploaded badge images are scanned for embedded scripts (SVG), malware, and excessive dimensions before storage.

5. **Share token security** — Share tokens are cryptographically random (128-bit), short-lived (default: 72 hours), and rate-limited (max 10 shares per user per hour).

### Rate Limiting

| Endpoint | Rate Limit | Window |
|---|---|---|
| List achievements | 100 req | 1 minute |
| Get progress | 60 req | 1 minute |
| Get unlocks | 60 req | 1 minute |
| Create share token | 10 req | 1 hour |
| Admin: create/update | 30 req | 1 minute |
| Admin: bulk operations | 5 req | 1 hour |
| Admin: analytics | 20 req | 1 minute |
| Leaderboard | 30 req | 1 minute |

### Input Validation

All inputs are validated using Zod schemas before processing:

```typescript
import { createAchievementSchema } from '@mcv/engagement/achievements';

// Schema enforces:
// - slug: 3-128 chars, URL-safe, lowercase alphanumeric + hyphens
// - name: 1-256 chars
// - description: 1-4096 chars
// - flavorText: optional, max 512 chars
// - category: 1-64 chars
// - rarity: valid enum value
// - criteria: valid criteria tree structure (recursive validation)
// - tags: max 20 tags, each 1-64 chars
// - metadata: max 10KB JSON
// - maxUnlocks: optional, min 1
// - xpReward: min 0, max 100000
// - pointReward: min 0, max 100000
```

### Audit Logging

All admin operations are logged to the platform audit system:

```typescript
// Every admin action generates an audit log entry
{
  action: 'achievement.grant',
  actorId: adminUserId,
  targetId: userId,
  resourceType: 'achievement',
  resourceId: achievementId,
  tenantId: tenantId,
  details: {
    method: 'manual_grant',
    reason: 'Customer support compensation',
  },
  timestamp: '2024-06-15T14:30:00Z',
}
```

### Cross-Venture Data Isolation

Cross-venture and platform achievements operate under special security rules:

1. **Cross-venture events** are processed by the platform service role, which has read access across all tenants.
2. **Cross-venture progress** is stored with the platform's tenant ID, not individual venture tenant IDs.
3. **Users can see their own cross-venture progress** regardless of which venture they're currently accessing.
4. **Venture admins cannot see cross-venture progress** — only platform admins have this access.
5. **Event routing** for cross-venture achievements uses a dedicated Redpanda consumer group separate from venture-specific processing.

---

## Environment Variables

| Variable | Required | Default | Description |
|---|---|---|---|
| `ACHIEVEMENT_DATABASE_URL` | Yes | — | PostgreSQL connection string for the achievement tables. Typically the main Supabase connection string. |
| `ACHIEVEMENT_REDIS_URL` | Yes | — | Redis connection string for caching and leaderboard sorted sets. |
| `ACHIEVEMENT_REDPANDA_BROKERS` | Yes | — | Comma-separated list of Redpanda broker addresses for event consumption. |
| `ACHIEVEMENT_REDPANDA_GROUP_ID` | No | `mcv-achievements` | Redpanda consumer group ID for achievement event processing. |
| `ACHIEVEMENT_REDPANDA_TOPICS` | No | `user.*,commerce.*,content.*,social.*,engagement.*` | Comma-separated list of Redpanda topic patterns to subscribe to. |
| `ACHIEVEMENT_EVENT_BATCH_SIZE` | No | `100` | Maximum number of events to process in a single batch from Redpanda. |
| `ACHIEVEMENT_EVENT_BATCH_TIMEOUT_MS` | No | `5000` | Maximum time to wait for a batch to fill before processing. |
| `ACHIEVEMENT_CACHE_TTL_SECONDS` | No | `900` | Default TTL for cached achievement definitions (in seconds). |
| `ACHIEVEMENT_PROGRESS_CACHE_TTL_SECONDS` | No | `300` | TTL for cached progress records (in seconds). |
| `ACHIEVEMENT_LEADERBOARD_REFRESH_SECONDS` | No | `300` | How often leaderboard caches are refreshed (in seconds). |
| `ACHIEVEMENT_MAX_CRITERIA_DEPTH` | No | `10` | Maximum nesting depth for criteria trees. |
| `ACHIEVEMENT_MAX_CRITERIA_LEAVES` | No | `50` | Maximum number of leaf nodes in a criteria tree. |
| `ACHIEVEMENT_MAX_PER_VENTURE` | No | `1000` | Maximum number of achievements a single venture can create. |
| `ACHIEVEMENT_MAX_GROUPS_PER_VENTURE` | No | `100` | Maximum number of achievement groups a single venture can create. |
| `ACHIEVEMENT_MAX_FEATURED_BADGES` | No | `1` | Maximum number of featured badge slots per user. |
| `ACHIEVEMENT_MAX_COLLECTION_BADGES` | No | `8` | Maximum number of collection badge slots per user. |
| `ACHIEVEMENT_SHARE_TOKEN_EXPIRY_HOURS` | No | `72` | How long share tokens remain valid (in hours). |
| `ACHIEVEMENT_SHARE_RATE_LIMIT` | No | `10` | Maximum share tokens a user can create per hour. |
| `ACHIEVEMENT_BADGE_MAX_SIZE_BYTES` | No | `2097152` | Maximum badge image file size in bytes (default: 2MB). |
| `ACHIEVEMENT_BADGE_SVG_MAX_SIZE_BYTES` | No | `524288` | Maximum SVG badge file size in bytes (default: 512KB). |
| `ACHIEVEMENT_CRITERIA_EVAL_TIMEOUT_MS` | No | `5000` | Maximum time allowed for criteria evaluation before timeout. |
| `ACHIEVEMENT_WEBSOCKET_ENABLED` | No | `true` | Whether to send real-time unlock notifications via WebSocket. |
| `ACHIEVEMENT_PUSH_ENABLED` | No | `true` | Whether to queue push notifications for achievement events. |
| `ACHIEVEMENT_CELEBRATION_ENABLED` | No | `true` | Whether to include celebration animation data in notifications. |
| `ACHIEVEMENT_CDN_BASE_URL` | No | — | Base URL for CDN-hosted badge assets. If not set, `imageUrl` is used as-is. |
| `ACHIEVEMENT_ANALYTICS_RETENTION_DAYS` | No | `365` | How long to retain detailed analytics data before aggregation. |
| `ACHIEVEMENT_EVENT_LOG_RETENTION_DAYS` | No | `90` | How long to retain raw event log entries in `achievement_events`. |
| `ACHIEVEMENT_DEAD_LETTER_TOPIC` | No | `achievements.dead_letter` | Redpanda topic for events that failed processing after all retries. |
| `ACHIEVEMENT_MAX_EVENT_RETRIES` | No | `3` | Maximum number of times to retry a failed event before sending to dead letter. |

### Example `.env` Configuration

```env
# Database
ACHIEVEMENT_DATABASE_URL=postgresql://user:pass@db.supabase.co:5432/postgres

# Redis
ACHIEVEMENT_REDIS_URL=redis://redis.internal:6379/2

# Redpanda
ACHIEVEMENT_REDPANDA_BROKERS=redpanda-0:9092,redpanda-1:9092,redpanda-2:9092
ACHIEVEMENT_REDPANDA_GROUP_ID=mcv-achievements-prod
ACHIEVEMENT_REDPANDA_TOPICS=user.*,commerce.*,content.*,social.*,engagement.*

# Caching
ACHIEVEMENT_CACHE_TTL_SECONDS=900
ACHIEVEMENT_PROGRESS_CACHE_TTL_SECONDS=300
ACHIEVEMENT_LEADERBOARD_REFRESH_SECONDS=300

# Limits
ACHIEVEMENT_MAX_PER_VENTURE=1000
ACHIEVEMENT_MAX_GROUPS_PER_VENTURE=100
ACHIEVEMENT_MAX_CRITERIA_DEPTH=10
ACHIEVEMENT_MAX_CRITERIA_LEAVES=50

# Badges
ACHIEVEMENT_CDN_BASE_URL=https://cdn.mcv.one/badges
ACHIEVEMENT_BADGE_MAX_SIZE_BYTES=2097152

# Notifications
ACHIEVEMENT_WEBSOCKET_ENABLED=true
ACHIEVEMENT_PUSH_ENABLED=true
ACHIEVEMENT_CELEBRATION_ENABLED=true

# Data Retention
ACHIEVEMENT_ANALYTICS_RETENTION_DAYS=365
ACHIEVEMENT_EVENT_LOG_RETENTION_DAYS=90

# Error Handling
ACHIEVEMENT_DEAD_LETTER_TOPIC=achievements.dead_letter
ACHIEVEMENT_MAX_EVENT_RETRIES=3
```

---

## Dependencies

### Runtime Dependencies

| Package | Version | Purpose |
|---|---|---|
| `@mcv/core` | `workspace:*` | Base utilities, error classes, ID generation, logging |
| `@mcv/db` | `workspace:*` | Drizzle ORM setup, connection pooling, migration runner |
| `@mcv/auth` | `workspace:*` | Authentication context, permission checking, RLS context setting |
| `@mcv/events` | `workspace:*` | Redpanda producer/consumer, event schema registry, dead letter handling |
| `@mcv/cache` | `workspace:*` | Redis client wrapper, cache invalidation, distributed locks |
| `@mcv/storage` | `workspace:*` | Badge image storage, CDN URL generation, image validation |
| `@mcv/notifications` | `workspace:*` | WebSocket push, push notification queue, notification templates |
| `drizzle-orm` | `^0.34.0` | SQL query builder and ORM |
| `zod` | `^3.23.0` | Input validation and schema definition |
| `@trpc/server` | `^11.0.0` | API router and procedure definitions |
| `ioredis` | `^5.4.0` | Redis client for caching and leaderboard sorted sets |
| `kafkajs` | `^2.2.0` | Redpanda/Kafka consumer for event processing |
| `jsonpath-plus` | `^9.0.0` | JSONPath evaluation for extracting values from event payloads |
| `nanoid` | `^5.0.0` | Short, URL-safe unique ID generation for share tokens |
| `ms` | `^2.1.0` | Duration string parsing (e.g., "24h", "7d", "30d") |

### Peer Dependencies

| Package | Version | Purpose |
|---|---|---|
| `@mcv/engagement/rewards` | `workspace:*` | Reward fulfillment (points, XP, coupons) triggered on unlock |
| `@mcv/engagement/leaderboards` | `workspace:*` | Shared leaderboard infrastructure |
| `@mcv/identity/profiles` | `workspace:*` | User profile data for leaderboard display names and avatars |
| `@mcv/ui/achievements` | `workspace:*` | React components for badges, progress bars, unlock celebrations |

### Dev Dependencies

| Package | Version | Purpose |
|---|---|---|
| `vitest` | `^2.1.0` | Test runner |
| `@testing-library/react` | `^16.0.0` | React hook testing |
| `testcontainers` | `^10.13.0` | PostgreSQL and Redis containers for integration tests |
| `@faker-js/faker` | `^9.0.0` | Test data generation |
| `msw` | `^2.4.0` | API mocking for notification and storage service tests |
| `drizzle-kit` | `^0.28.0` | Schema migrations and introspection |

### Internal Module Dependencies

```
@mcv/engagement/achievements
├── @mcv/core (utilities, errors, logging)
├── @mcv/db (database connection, Drizzle setup)
├── @mcv/auth (authentication, permissions, RLS)
├── @mcv/events (Redpanda producer/consumer)
├── @mcv/cache (Redis caching)
├── @mcv/storage (badge image storage)
├── @mcv/notifications (WebSocket, push)
│
├── [peer] @mcv/engagement/rewards (reward fulfillment)
├── [peer] @mcv/engagement/leaderboards (shared leaderboard infra)
├── [peer] @mcv/identity/profiles (user display data)
└── [peer] @mcv/ui/achievements (React components)
```

---

## Testing

### Test Structure

```
src/
├── __tests__/
│   ├── unit/
│   │   ├── criteria-engine.test.ts
│   │   ├── progress-tracker.test.ts
│   │   ├── rarity-weights.test.ts
│   │   ├── criteria-validator.test.ts
│   │   ├── streak-calculator.test.ts
│   │   ├── milestone-detector.test.ts
│   │   ├── share-token.test.ts
│   │   └── validators.test.ts
│   ├── integration/
│   │   ├── achievement-service.test.ts
│   │   ├── unlock-service.test.ts
│   │   ├── progress-service.test.ts
│   │   ├── badge-service.test.ts
│   │   ├── group-service.test.ts
│   │   ├── leaderboard-service.test.ts
│   │   ├── notification-service.test.ts
│   │   ├── admin-service.test.ts
│   │   ├── analytics-service.test.ts
│   │   └── event-consumer.test.ts
│   ├── e2e/
│   │   ├── achievement-lifecycle.test.ts
│   │   ├── event-to-unlock-flow.test.ts
│   │   ├── cross-venture.test.ts
│   │   ├── bulk-operations.test.ts
│   │   └── rls-isolation.test.ts
│   └── fixtures/
│       ├── achievements.ts
│       ├── badges.ts
│       ├── criteria-trees.ts
│       ├── events.ts
│       └── users.ts
```

### Running Tests

```bash
# Run all tests
pnpm test --filter=@mcv/engagement/achievements

# Run unit tests only
pnpm test --filter=@mcv/engagement/achievements -- --dir=unit

# Run integration tests (requires Docker for testcontainers)
pnpm test --filter=@mcv/engagement/achievements -- --dir=integration

# Run e2e tests
pnpm test --filter=@mcv/engagement/achievements -- --dir=e2e

# Run with coverage
pnpm test --filter=@mcv/engagement/achievements -- --coverage

# Run a specific test file
pnpm test --filter=@mcv/engagement/achievements -- criteria-engine
```

### Unit Test Example: Criteria Engine

```typescript
import { describe, it, expect } from 'vitest';
import { AchievementCriteriaEngine } from '../services/criteria-engine.service';
import { makeCriteriaTree, makeProgress, makeEvent } from '../__tests__/fixtures';

describe('AchievementCriteriaEngine', () => {
  const engine = new AchievementCriteriaEngine();

  describe('evaluate', () => {
    it('should evaluate a simple count criteria as met', () => {
      const criteria = makeCriteriaTree({
        id: 'purchase_count',
        type: 'leaf',
        criteriaType: 'count',
        eventTypes: ['commerce.order.completed'],
        operator: 'gte',
        targetValue: 10,
      });

      const progress = makeProgress({
        counters: {
          purchase_count: { current: 12, target: 10, type: 'count' },
        },
      });

      const result = engine.evaluate(criteria, progress);

      expect(result.isMet).toBe(true);
      expect(result.percentage).toBe(1.0);
      expect(result.nodeResults.get('purchase_count')?.isMet).toBe(true);
    });

    it('should evaluate a compound AND criteria correctly', () => {
      const criteria = makeCriteriaTree({
        id: 'root',
        type: 'combinator',
        operator: 'AND',
        children: [
          {
            id: 'count_criteria',
            type: 'leaf',
            criteriaType: 'count',
            eventTypes: ['commerce.order.completed'],
            operator: 'gte',
            targetValue: 10,
          },
          {
            id: 'sum_criteria',
            type: 'leaf',
            criteriaType: 'sum',
            eventTypes: ['commerce.order.completed'],
            operator: 'gte',
            targetValue: 500,
          },
        ],
      });

      const progress = makeProgress({
        counters: {
          count_criteria: { current: 12, target: 10, type: 'count' },
          sum_criteria: { current: 350, target: 500, type: 'sum' },
        },
      });

      const result = engine.evaluate(criteria, progress);

      expect(result.isMet).toBe(false);
      expect(result.percentage).toBeCloseTo(0.85, 1); // (1.0 + 0.7) / 2
      expect(result.nodeResults.get('count_criteria')?.isMet).toBe(true);
      expect(result.nodeResults.get('sum_criteria')?.isMet).toBe(false);
    });

    it('should evaluate OR criteria as met when any child is met', () => {
      const criteria = makeCriteriaTree({
        id: 'root',
        type: 'combinator',
        operator: 'OR',
        children: [
          {
            id: 'path_a',
            type: 'leaf',
            criteriaType: 'count',
            eventTypes: ['commerce.order.completed'],
            operator: 'gte',
            targetValue: 50,
          },
          {
            id: 'path_b',
            type: 'leaf',
            criteriaType: 'boolean',
            eventTypes: ['user.premium.activated'],
            operator: 'gte',
            targetValue: 1,
          },
        ],
      });

      const progress = makeProgress({
        counters: {
          path_a: { current: 5, target: 50, type: 'count' },
          path_b: { current: 1, target: 1, type: 'boolean' },
        },
      });

      const result = engine.evaluate(criteria, progress);

      expect(result.isMet).toBe(true);
      expect(result.percentage).toBe(1.0);
    });

    it('should detect milestone thresholds correctly', () => {
      const criteria = makeCriteriaTree({
        id: 'purchase_count',
        type: 'leaf',
        criteriaType: 'count',
        eventTypes: ['commerce.order.completed'],
        operator: 'gte',
        targetValue: 100,
      });

      // Progress at 50%
      const progress = makeProgress({
        counters: {
          purchase_count: { current: 50, target: 100, type: 'count' },
        },
        milestonesReached: [2500], // 25% already reached
      });

      const result = engine.evaluate(criteria, progress);

      expect(result.percentage).toBe(0.5);
    });
  });

  describe('processEvent', () => {
    it('should increment count on matching event', () => {
      const criteria = makeCriteriaTree({
        id: 'purchase_count',
        type: 'leaf',
        criteriaType: 'count',
        eventTypes: ['commerce.order.completed'],
        operator: 'gte',
        targetValue: 10,
      });

      const progress = makeProgress({
        counters: {
          purchase_count: { current: 7, target: 10, type: 'count' },
        },
      });

      const event = makeEvent({
        eventType: 'commerce.order.completed',
        payload: { order: { id: 'order-123', total: 49.99 } },
      });

      const result = engine.processEvent(criteria, progress, event);

      expect(result.hasChanges).toBe(true);
      expect(result.progress.counters.purchase_count.current).toBe(8);
      expect(result.isComplete).toBe(false);
      expect(result.changes).toHaveLength(1);
      expect(result.changes[0]).toEqual({
        criteriaId: 'purchase_count',
        previousValue: 7,
        newValue: 8,
        target: 10,
      });
    });

    it('should accumulate sum values from event payload', () => {
      const criteria = makeCriteriaTree({
        id: 'spend_total',
        type: 'leaf',
        criteriaType: 'sum',
        eventTypes: ['commerce.order.completed'],
        valuePath: '$.payload.order.total',
        operator: 'gte',
        targetValue: 500,
      });

      const progress = makeProgress({
        counters: {
          spend_total: { current: 350, target: 500, type: 'sum' },
        },
      });

      const event = makeEvent({
        eventType: 'commerce.order.completed',
        payload: { order: { id: 'order-456', total: 175.50 } },
      });

      const result = engine.processEvent(criteria, progress, event);

      expect(result.hasChanges).toBe(true);
      expect(result.progress.counters.spend_total.current).toBe(525.5);
      expect(result.isComplete).toBe(true);
    });

    it('should track streak intervals correctly', () => {
      const criteria = makeCriteriaTree({
        id: 'daily_login',
        type: 'leaf',
        criteriaType: 'streak',
        eventTypes: ['user.login'],
        operator: 'gte',
        targetValue: 7,
        streakInterval: '24h',
      });

      const progress = makeProgress({
        counters: {
          daily_login: { current: 5, target: 7, type: 'streak' },
        },
        streakData: {
          daily_login: {
            currentStreak: 5,
            longestStreak: 5,
            lastEventAt: new Date(Date.now() - 23 * 60 * 60 * 1000).toISOString(), // 23h ago
            interval: '24h',
            isActive: true,
          },
        },
      });

      const event = makeEvent({
        eventType: 'user.login',
        occurredAt: new Date().toISOString(),
      });

      const result = engine.processEvent(criteria, progress, event);

      expect(result.hasChanges).toBe(true);
      expect(result.progress.counters.daily_login.current).toBe(6);
      expect(result.progress.streakData.daily_login.currentStreak).toBe(6);
    });

    it('should reset streak when interval is exceeded', () => {
      const criteria = makeCriteriaTree({
        id: 'daily_login',
        type: 'leaf',
        criteriaType: 'streak',
        eventTypes: ['user.login'],
        operator: 'gte',
        targetValue: 7,
        streakInterval: '24h',
      });

      const progress = makeProgress({
        counters: {
          daily_login: { current: 5, target: 7, type: 'streak' },
        },
        streakData: {
          daily_login: {
            currentStreak: 5,
            longestStreak: 5,
            lastEventAt: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(), // 48h ago
            interval: '24h',
            isActive: true,
          },
        },
      });

      const event = makeEvent({
        eventType: 'user.login',
        occurredAt: new Date().toISOString(),
      });

      const result = engine.processEvent(criteria, progress, event);

      expect(result.hasChanges).toBe(true);
      expect(result.progress.counters.daily_login.current).toBe(1); // Reset to 1
      expect(result.progress.streakData.daily_login.currentStreak).toBe(1);
      expect(result.progress.streakData.daily_login.longestStreak).toBe(5); // Preserved
    });

    it('should not change progress for non-matching event types', () => {
      const criteria = makeCriteriaTree({
        id: 'purchase_count',
        type: 'leaf',
        criteriaType: 'count',
        eventTypes: ['commerce.order.completed'],
        operator: 'gte',
        targetValue: 10,
      });

      const progress = makeProgress({
        counters: {
          purchase_count: { current: 7, target: 10, type: 'count' },
        },
      });

      const event = makeEvent({
        eventType: 'social.post.created', // Non-matching
        payload: {},
      });

      const result = engine.processEvent(criteria, progress, event);

      expect(result.hasChanges).toBe(false);
      expect(result.progress.counters.purchase_count.current).toBe(7);
    });

    it('should detect new milestones on progress update', () => {
      const criteria = makeCriteriaTree({
        id: 'purchase_count',
        type: 'leaf',
        criteriaType: 'count',
        eventTypes: ['commerce.order.completed'],
        operator: 'gte',
        targetValue: 4,
      });

      const progress = makeProgress({
        counters: {
          purchase_count: { current: 2, target: 4, type: 'count' },
        },
        milestonesReached: [2500], // 25% already reached
      });

      const event = makeEvent({
        eventType: 'commerce.order.completed',
        payload: { order: { id: 'order-789' } },
      });

      const result = engine.processEvent(criteria, progress, event);

      expect(result.hasChanges).toBe(true);
      expect(result.progress.counters.purchase_count.current).toBe(3);
      expect(result.newMilestones).toContain(7500); // 75% milestone (3/4 = 75%)
    });
  });

  describe('validate', () => {
    it('should reject criteria trees with circular references', () => {
      // Construct a tree that references itself (simulated)
      const criteria: any = {
        id: 'root',
        type: 'combinator',
        operator: 'AND',
        children: [],
      };
      criteria.children.push(criteria); // Circular!

      const result = engine.validate(criteria);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({ code: 'CIRCULAR_REFERENCE' })
      );
    });

    it('should reject NOT combinator with multiple children', () => {
      const criteria = makeCriteriaTree({
        id: 'root',
        type: 'combinator',
        operator: 'NOT',
        children: [
          { id: 'a', type: 'leaf', criteriaType: 'count', eventTypes: ['x'], operator: 'gte', targetValue: 1 },
          { id: 'b', type: 'leaf', criteriaType: 'count', eventTypes: ['y'], operator: 'gte', targetValue: 1 },
        ],
      });

      const result = engine.validate(criteria);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({ code: 'NOT_SINGLE_CHILD' })
      );
    });

    it('should warn about unreachable criteria', () => {
      const criteria = makeCriteriaTree({
        id: 'root',
        type: 'combinator',
        operator: 'AND',
        children: [
          {
            id: 'impossible',
            type: 'leaf',
            criteriaType: 'count',
            eventTypes: ['commerce.order.completed'],
            operator: 'gte',
            targetValue: 1000000, // Unrealistically high
          },
        ],
      });

      const result = engine.validate(criteria);

      expect(result.isValid).toBe(true); // Valid structure, just impractical
      expect(result.warnings).toContainEqual(
        expect.objectContaining({ code: 'HIGH_TARGET_VALUE' })
      );
    });
  });
});
```

### Integration Test Example: Achievement Unlock Flow

```typescript
import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { PostgreSqlContainer, StartedPostgreSqlContainer } from '@testcontainers/postgresql';
import { GenericContainer, StartedTestContainer } from 'testcontainers';
import { AchievementService } from '../services/achievement.service';
import { AchievementUnlockService } from '../services/unlock.service';
import { AchievementProgressService } from '../services/progress.service';
import { setupTestDb, seedTestData, createTestContainer } from '../__tests__/fixtures';

describe('Achievement Unlock Flow (Integration)', () => {
  let pgContainer: StartedPostgreSqlContainer;
  let redisContainer: StartedTestContainer;
  let achievementService: AchievementService;
  let unlockService: AchievementUnlockService;
  let progressService: AchievementProgressService;

  beforeAll(async () => {
    pgContainer = await new PostgreSqlContainer('postgres:16')
      .withDatabase('test_achievements')
      .start();

    redisContainer = await new GenericContainer('redis:7')
      .withExposedPorts(6379)
      .start();

    const container = await createTestContainer({
      databaseUrl: pgContainer.getConnectionUri(),
      redisUrl: `redis://${redisContainer.getHost()}:${redisContainer.getMappedPort(6379)}`,
    });

    achievementService = container.resolve(AchievementService);
    unlockService = container.resolve(AchievementUnlockService);
    progressService = container.resolve(AchievementProgressService);

    await setupTestDb(pgContainer.getConnectionUri());
  }, 60_000);

  afterAll(async () => {
    await pgContainer?.stop();
    await redisContainer?.stop();
  });

  beforeEach(async () => {
    await seedTestData();
  });

  it('should unlock achievement when all criteria are met via events', async () => {
    // 1. Create a simple count-based achievement
    const achievement = await achievementService.create({
      slug: 'test-first-three-purchases',
      name: 'First Three Purchases',
      description: 'Make your first 3 purchases',
      category: 'commerce',
      rarity: 'common',
      visibility: 'visible',
      scope: 'venture',
      xpReward: 50,
      pointReward: 25,
      criteria: {
        id: 'root',
        type: 'leaf',
        criteriaType: 'count',
        eventTypes: ['commerce.order.completed'],
        operator: 'gte',
        targetValue: 3,
        valuePath: null,
        streakInterval: null,
        timeWindow: null,
        eventFilters: null,
        weight: 1.0,
        description: 'Complete 3 purchases',
      },
      tags: ['test'],
    });

    await achievementService.publish(achievement.id);

    const userId = 'test-user-001';

    // 2. Process 3 purchase events
    for (let i = 1; i <= 3; i++) {
      await unlockService.processEvent({
        id: `event-${i}`,
        eventType: 'commerce.order.completed',
        userId,
        tenantId: 'test-tenant',
        payload: { order: { id: `order-${i}`, total: 29.99 } },
        occurredAt: new Date().toISOString(),
        receivedAt: new Date().toISOString(),
        status: 'pending',
        evaluationCount: 0,
        unlockCount: 0,
        errorMessage: null,
      });
    }

    // 3. Verify the achievement is unlocked
    const isUnlocked = await achievementService.isUnlocked(userId, achievement.id);
    expect(isUnlocked).toBe(true);

    // 4. Verify progress shows 100%
    const progress = await achievementService.getProgress(userId, achievement.id);
    expect(progress?.percentage).toBe(10000); // basis points
    expect(progress?.status).toBe('completed');

    // 5. Verify unlock record exists
    const unlocks = await achievementService.getUnlocks(userId);
    const unlock = unlocks.items.find(u => u.achievementId === achievement.id);
    expect(unlock).toBeDefined();
    expect(unlock?.method).toBe('event');
    expect(unlock?.isRevoked).toBe(false);
  });

  it('should enforce max_unlocks scarcity constraint', async () => {
    const achievement = await achievementService.create({
      slug: 'test-first-two-only',
      name: 'First Two Only',
      description: 'Only the first 2 users can unlock this',
      category: 'exclusive',
      rarity: 'legendary',
      visibility: 'visible',
      scope: 'venture',
      maxUnlocks: 2,
      xpReward: 1000,
      pointReward: 500,
      criteria: {
        id: 'root',
        type: 'leaf',
        criteriaType: 'boolean',
        eventTypes: ['user.action.special'],
        operator: 'gte',
        targetValue: 1,
        valuePath: null,
        streakInterval: null,
        timeWindow: null,
        eventFilters: null,
        weight: 1.0,
        description: 'Perform the special action',
      },
      tags: ['test', 'scarcity'],
    });

    await achievementService.publish(achievement.id);

    // First two users unlock successfully
    await achievementService.grant('user-1', achievement.id, 'test');
    await achievementService.grant('user-2', achievement.id, 'test');

    // Third user should be rejected
    await expect(
      achievementService.grant('user-3', achievement.id, 'test')
    ).rejects.toThrow('ACHIEVEMENT_MAX_UNLOCKS_REACHED');
  });

  it('should isolate achievements between tenants via RLS', async () => {
    // Create achievement in tenant A
    const achievementA = await achievementService.create({
      slug: 'tenant-a-exclusive',
      name: 'Tenant A Exclusive',
      description: 'Only for tenant A',
      category: 'exclusive',
      rarity: 'rare',
      visibility: 'visible',
      scope: 'venture',
      xpReward: 100,
      pointReward: 50,
      criteria: {
        id: 'root',
        type: 'leaf',
        criteriaType: 'boolean',
        eventTypes: ['user.action'],
        operator: 'gte',
        targetValue: 1,
        valuePath: null,
        streakInterval: null,
        timeWindow: null,
        eventFilters: null,
        weight: 1.0,
        description: 'Any action',
      },
      tags: ['test'],
    });

    // Switch to tenant B context
    await switchTenantContext('tenant-b');

    // Tenant B should not see tenant A's achievement
    const result = await achievementService.getById(achievementA.id);
    expect(result).toBeNull();

    // Tenant B should not see it in listings
    const list = await achievementService.list({ status: ['draft', 'active'] });
    const found = list.items.find(a => a.id === achievementA.id);
    expect(found).toBeUndefined();
  });

  it('should track group completion and trigger meta-achievement', async () => {
    // Create a group with 3 achievements
    const group = await groupService.create({
      name: 'Test Group',
      description: 'Test group for integration tests',
      slug: 'test-group',
      showCompletion: true,
    });

    const achievements = [];
    for (let i = 1; i <= 3; i++) {
      const a = await achievementService.create({
        slug: `test-group-member-${i}`,
        name: `Group Member ${i}`,
        description: `Achievement ${i} in test group`,
        category: 'test',
        rarity: 'common',
        visibility: 'visible',
        scope: 'venture',
        groupId: group.id,
        xpReward: 50,
        pointReward: 25,
        criteria: {
          id: 'root',
          type: 'leaf',
          criteriaType: 'boolean',
          eventTypes: [`test.action.${i}`],
          operator: 'gte',
          targetValue: 1,
          valuePath: null,
          streakInterval: null,
          timeWindow: null,
          eventFilters: null,
          weight: 1.0,
          description: `Test action ${i}`,
        },
        tags: ['test'],
      });
      await achievementService.publish(a.id);
      achievements.push(a);
    }

    const userId = 'test-user-group';

    // Unlock 2 of 3 achievements
    await achievementService.grant(userId, achievements[0].id, 'test');
    await achievementService.grant(userId, achievements[1].id, 'test');

    // Check group completion: should be 66%
    const completion = await achievementService.getGroupCompletion(userId, group.id);
    expect(completion.completionPercentage).toBeCloseTo(0.666, 2);
    expect(completion.isComplete).toBe(false);

    // Unlock the final achievement
    await achievementService.grant(userId, achievements[2].id, 'test');

    // Group should now be 100% complete
    const finalCompletion = await achievementService.getGroupCompletion(userId, group.id);
    expect(finalCompletion.completionPercentage).toBe(1.0);
    expect(finalCompletion.isComplete).toBe(true);
  });
});
```

### Test Coverage Requirements

| Area | Minimum Coverage | Notes |
|---|---|---|
| Criteria Engine | 95% | Core business logic — every operator and type combination |
| Progress Tracker | 90% | All counter types, milestone detection, streak edge cases |
| Unlock Service | 90% | Happy path, scarcity, idempotency, error cases |
| Achievement Service | 85% | CRUD, lifecycle transitions, validation |
| Badge Service | 85% | CRUD, format validation, size limits |
| Group Service | 85% | Membership, completion, meta-achievements |
| Leaderboard Service | 80% | Scoring methods, periods, pagination |
| Notification Service | 80% | All notification types, celebration mapping |
| Admin Service | 80% | Bulk operations, cloning, import/export |
| Analytics Service | 75% | Aggregations, time series, distributions |
| Validators (Zod) | 90% | All schemas, edge cases, error messages |
| RLS Policies | 100% | Tenant isolation must be verified for every table |

### Testing Conventions

1. **Unit tests** use no external dependencies. All I/O is mocked.
2. **Integration tests** use testcontainers for PostgreSQL and Redis. No shared state between tests.
3. **E2E tests** exercise the full pipeline from event ingestion to unlock notification.
4. **Fixtures** are defined in `__tests__/fixtures/` and provide factory functions (`makeAchievement()`, `makeEvent()`, `makeProgress()`) with sensible defaults and override support.
5. **RLS tests** explicitly switch tenant contexts and verify isolation. Every table must have at least one RLS isolation test.
6. **Idempotency tests** process the same event twice and verify no duplicate side effects.
7. **Race condition tests** use parallel processing to verify correct behavior under concurrency (e.g., two events triggering the same unlock simultaneously).

---

*Last updated: 2025-02-08*
*Module version: 0.9.0*
*Documentation version: 1.0.0*