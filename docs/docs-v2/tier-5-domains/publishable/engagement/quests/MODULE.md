# @mcv/engagement/quests

> **Quests & Missions** — Structured task sequences that guide users through objectives with meaningful rewards, powering daily engagement loops, narrative progression, and collaborative group challenges.

**Package:** `@mcv/engagement/quests`
**Layer:** Tier 5 — Domain Module
**Parent:** `@mcv/engagement`
**Since:** 0.12.0
**Status:** Stable
**Maintainer:** MCV Platform Team

---

## Table of Contents

- [Purpose](#purpose)
- [Exports](#exports)
- [Architecture](#architecture)
  - [Quest State Machine](#quest-state-machine)
  - [Objective Evaluation Pipeline](#objective-evaluation-pipeline)
  - [Event-Driven Tracking](#event-driven-tracking)
  - [Reset Scheduler](#reset-scheduler)
  - [Quest Recommendation Engine](#quest-recommendation-engine)
- [Core Interfaces](#core-interfaces)
  - [Quest](#quest)
  - [QuestObjective](#questobjective)
  - [QuestChain](#questchain)
  - [QuestProgress](#questprogress)
  - [QuestReward](#questreward)
  - [QuestBoard](#questboard)
  - [DailyQuestPool](#dailyquestpool)
  - [PartyQuest](#partyquest)
  - [QuestService](#questservice)
- [Database Schemas](#database-schemas)
  - [quests](#quests)
  - [quest_objectives](#quest_objectives)
  - [quest_chains](#quest_chains)
  - [quest_progress](#quest_progress)
  - [quest_objective_progress](#quest_objective_progress)
  - [quest_rewards](#quest_rewards)
  - [quest_claims](#quest_claims)
  - [daily_quest_pools](#daily_quest_pools)
  - [daily_quest_assignments](#daily_quest_assignments)
  - [party_quests](#party_quests)
  - [party_quest_contributions](#party_quest_contributions)
- [Code Examples](#code-examples)
  - [Example 1 — Creating a Quest with Objectives](#example-1--creating-a-quest-with-objectives)
  - [Example 2 — Processing Objective Progress via Events](#example-2--processing-objective-progress-via-events)
  - [Example 3 — Quest Chain with Branching Paths](#example-3--quest-chain-with-branching-paths)
  - [Example 4 — Daily Quest Pool & Auto-Assignment](#example-4--daily-quest-pool--auto-assignment)
  - [Example 5 — Claiming Rewards with Bonus Modifiers](#example-5--claiming-rewards-with-bonus-modifiers)
  - [Example 6 — Party Quest with Contribution Tracking](#example-6--party-quest-with-contribution-tracking)
  - [Example 7 — Quest Board with ML Recommendations](#example-7--quest-board-with-ml-recommendations)
  - [Example 8 — Quest Analytics Dashboard Query](#example-8--quest-analytics-dashboard-query)
- [Error Codes](#error-codes)
- [Security](#security)
  - [Row-Level Security Policies](#row-level-security-policies)
  - [Anti-Cheat Measures](#anti-cheat-measures)
  - [Reward Economy Protection](#reward-economy-protection)
  - [Input Validation](#input-validation)
- [Environment Variables](#environment-variables)
- [Dependencies](#dependencies)
- [Testing](#testing)
  - [Unit Tests](#unit-tests)
  - [Integration Tests](#integration-tests)
  - [Load Tests](#load-tests)
  - [Quest Simulation Framework](#quest-simulation-framework)

---

## Purpose

The Quests & Missions module provides a complete quest management system for the MCV.ONE platform. Quests are the primary mechanism for guiding user behavior, rewarding engagement, and creating compelling progression loops. The module handles the full lifecycle of quests — from definition and assignment through tracking, completion, and reward distribution.

### What This Module Does

1. **Quest Definition & Management** — Content creators define quests with structured objectives, prerequisite chains, difficulty ratings, and reward tables. Quests follow a `draft → active → archived` lifecycle managed through admin tooling or programmatic APIs.

2. **Multi-Type Quest System** — Supports daily quests (auto-reset at midnight per timezone), weekly challenges (Monday resets), story quests (linear narrative progression), side quests (optional one-time tasks), and event quests (time-bounded to campaigns or promotions).

3. **Objective Tracking** — Each quest contains one or more objectives evaluated against user actions. Objectives support six core types: event count (perform action N times), threshold reach (achieve a score/value), collection (gather N distinct items), exploration (visit N pages/areas), social (invite/interact with N users), and custom (arbitrary predicate evaluation).

4. **Event-Driven Progress** — User actions flow through Redpanda event streams. The objective evaluation pipeline consumes these events in real-time, matching them against active quest objectives and updating progress counters atomically. This decouples quest logic from feature implementations — any system that emits events can drive quest progress.

5. **Quest Chains & Narrative** — Quests can be organized into chains with sequential progression, branching narrative paths (player choices unlock different subsequent quests), prerequisite graphs (quest B requires completing quest A), and parallel objectives (complete objectives in any order).

6. **Reward Distribution** — Completed quests grant configurable rewards: points, XP, tokens, virtual items, achievements, and titles. The system supports bonus multipliers for speed completion, difficulty modifiers, first-completion bonuses, and streak rewards for consecutive daily quest completion.

7. **Quest Board & Discovery** — Users discover quests through the Quest Board, which presents available quests filtered by category, difficulty, and estimated completion time. An ML-based recommendation engine surfaces quests most likely to engage each user based on their play style, history, and peer behavior.

8. **Daily/Weekly Rotation** — Automated schedulers select quests from rotating pools, assign them to users, and handle reset logic. Streak tracking incentivizes daily return with escalating bonus multipliers.

9. **Party/Group Quests** — Group quests allow guilds or ad-hoc parties to collaborate on shared objectives. Individual contributions are tracked per member, with rewards distributed based on participation level or equally.

10. **Analytics & Economy** — Comprehensive analytics track completion rates, drop-off points (which objectives cause abandonment), average completion times, and reward economy impact. This data feeds into quest design iteration and economy balancing.

### Why Not Just Use Achievements?

Achievements (see `@mcv/engagement/achievements`) are passive recognitions of past behavior. Quests are active directives — they tell users what to do next, create urgency through deadlines and daily resets, and form narrative arcs. Quests drive behavior; achievements recognize it. Many quests *grant* achievements as rewards, bridging both systems.

### Design Philosophy

- **Event-sourced progress** — Quest progress is never calculated by polling. Events flow in, progress updates flow out. This gives us exactly-once semantics and real-time responsiveness.
- **Tenant-isolated quest catalogs** — Each tenant defines their own quests. Shared/template quests can be cloned from a platform catalog but are always owned by the tenant.
- **Economy-safe rewards** — All reward grants pass through the rewards service with rate limiting, duplicate detection, and economy impact checks before minting.
- **Stateless evaluation** — The objective evaluation pipeline is stateless and horizontally scalable. State lives in PostgreSQL; evaluation workers can be scaled independently.

---

## Exports

```typescript
// ── Services ──────────────────────────────────────────────
export { QuestService }              from './services/quest.service';
export { QuestProgressService }      from './services/quest-progress.service';
export { QuestRewardService }        from './services/quest-reward.service';
export { QuestBoardService }         from './services/quest-board.service';
export { QuestChainService }         from './services/quest-chain.service';
export { DailyQuestService }         from './services/daily-quest.service';
export { WeeklyQuestService }        from './services/weekly-quest.service';
export { PartyQuestService }         from './services/party-quest.service';
export { QuestAnalyticsService }     from './services/quest-analytics.service';
export { QuestRecommendationService } from './services/quest-recommendation.service';
export { ObjectiveEvaluator }        from './services/objective-evaluator.service';

// ── Router ────────────────────────────────────────────────
export { questRouter }               from './router';
export type { QuestRouter }          from './router';

// ── Schemas (Drizzle) ─────────────────────────────────────
export {
  quests,
  questObjectives,
  questChains,
  questProgress,
  questObjectiveProgress,
  questRewards,
  questClaims,
  dailyQuestPools,
  dailyQuestAssignments,
  partyQuests,
  partyQuestContributions,
} from './schemas';

// ── Types & Interfaces ───────────────────────────────────
export type { Quest }                from './types/quest';
export type { QuestObjective }       from './types/quest-objective';
export type { QuestChain }           from './types/quest-chain';
export type { QuestProgress }        from './types/quest-progress';
export type { QuestReward }          from './types/quest-reward';
export type { QuestBoard }           from './types/quest-board';
export type { QuestBoardEntry }      from './types/quest-board';
export type { DailyQuestPool }       from './types/daily-quest-pool';
export type { DailyQuestAssignment } from './types/daily-quest-assignment';
export type { PartyQuest }           from './types/party-quest';
export type { PartyQuestContribution } from './types/party-quest';
export type { QuestClaim }           from './types/quest-claim';
export type { ObjectiveType }        from './types/objective-type';
export type { QuestType }            from './types/quest-type';
export type { QuestStatus }          from './types/quest-status';
export type { QuestDifficulty }      from './types/quest-difficulty';
export type { QuestProgressState }   from './types/quest-progress-state';
export type { QuestFilter }          from './types/quest-filter';
export type { QuestAnalytics }       from './types/quest-analytics';
export type { QuestRecommendation }  from './types/quest-recommendation';

// ── Enums ─────────────────────────────────────────────────
export {
  QuestTypeEnum,
  QuestStatusEnum,
  QuestDifficultyEnum,
  QuestProgressStateEnum,
  ObjectiveTypeEnum,
  RewardTypeEnum,
} from './enums';

// ── Validators (Zod) ─────────────────────────────────────
export {
  createQuestSchema,
  updateQuestSchema,
  createObjectiveSchema,
  createQuestChainSchema,
  claimRewardSchema,
  questFilterSchema,
  partyQuestCreateSchema,
  dailyQuestPoolSchema,
} from './validators';

// ── Events ────────────────────────────────────────────────
export {
  QuestStartedEvent,
  QuestCompletedEvent,
  QuestAbandonedEvent,
  ObjectiveProgressEvent,
  ObjectiveCompletedEvent,
  RewardClaimedEvent,
  DailyQuestAssignedEvent,
  PartyQuestCompletedEvent,
  QuestStreakEvent,
} from './events';

// ── Consumer (Redpanda) ──────────────────────────────────
export { QuestEventConsumer }        from './consumers/quest-event.consumer';
export { ObjectiveTrackingConsumer } from './consumers/objective-tracking.consumer';

// ── Scheduler ─────────────────────────────────────────────
export { DailyQuestScheduler }       from './schedulers/daily-quest.scheduler';
export { WeeklyQuestScheduler }      from './schedulers/weekly-quest.scheduler';
export { QuestExpirationScheduler }  from './schedulers/quest-expiration.scheduler';

// ── Constants ─────────────────────────────────────────────
export {
  QUEST_MAX_OBJECTIVES,
  QUEST_MAX_REWARDS,
  QUEST_MAX_CHAIN_LENGTH,
  QUEST_MAX_DAILY_POOL_SIZE,
  QUEST_MAX_PARTY_SIZE,
  QUEST_STREAK_BONUS_TABLE,
  QUEST_DIFFICULTY_XP_MULTIPLIERS,
  QUEST_SPEED_BONUS_THRESHOLDS,
} from './constants';

// ── Errors ────────────────────────────────────────────────
export {
  QuestError,
  QuestNotFoundError,
  QuestNotActiveError,
  QuestAlreadyCompletedError,
  QuestPrerequisiteNotMetError,
  QuestAlreadyStartedError,
  ObjectiveNotFoundError,
  ObjectiveAlreadyCompleteError,
  RewardAlreadyClaimedError,
  RewardGrantFailedError,
  QuestChainBrokenError,
  DailyQuestAlreadyAssignedError,
  PartyQuestFullError,
  PartyQuestNotMemberError,
  QuestExpiredError,
  QuestDraftNotPublishableError,
  InvalidObjectiveConfigError,
  QuestCooldownActiveError,
  MaxActiveQuestsExceededError,
  QuestEconomyLimitError,
  InsufficientContributionError,
  QuestVersionConflictError,
} from './errors';
```

---

## Architecture

### System Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                          Quest System                               │
│                                                                     │
│  ┌──────────────┐   ┌──────────────┐   ┌────────────────────────┐  │
│  │  Quest Admin  │   │  Quest Board │   │  Party Quest Manager   │  │
│  │  (CRUD, lifecycle) │ (discovery) │   │  (group coordination)  │  │
│  └──────┬───────┘   └──────┬───────┘   └───────────┬────────────┘  │
│         │                  │                        │               │
│  ┌──────▼──────────────────▼────────────────────────▼────────────┐  │
│  │                     QuestService                              │  │
│  │  (orchestrates quest lifecycle, delegates to sub-services)    │  │
│  └──────┬──────────────────┬────────────────────────┬────────────┘  │
│         │                  │                        │               │
│  ┌──────▼───────┐  ┌──────▼───────────┐  ┌────────▼────────────┐  │
│  │  Quest        │  │  Objective       │  │  Reward             │  │
│  │  Progress     │  │  Evaluator       │  │  Service            │  │
│  │  Service      │  │  Pipeline        │  │  (grant, validate)  │  │
│  └──────┬───────┘  └──────┬───────────┘  └────────┬────────────┘  │
│         │                  │                        │               │
│  ┌──────▼──────────────────▼────────────────────────▼────────────┐  │
│  │                   PostgreSQL (Supabase)                        │  │
│  │  quests │ objectives │ progress │ rewards │ claims │ parties  │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                                                                     │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │                    Redpanda Event Bus                         │  │
│  │  topics: user.actions │ quest.progress │ quest.completed      │  │
│  │          quest.rewards │ quest.daily │ quest.party            │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                                                                     │
│  ┌──────────────┐   ┌──────────────┐   ┌────────────────────────┐  │
│  │  Daily/Weekly │   │  Expiration  │   │  Recommendation        │  │
│  │  Scheduler    │   │  Scheduler   │   │  Engine (ML)           │  │
│  └──────────────┘   └──────────────┘   └────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘
```

### Quest State Machine

Every quest has a lifecycle status, and every user-quest pair has a progress state. These two state machines are independent but interact.

#### Quest Lifecycle (Admin-Managed)

```
                    publish()
  ┌───────┐     ┌───────────┐     archive()     ┌──────────┐
  │ DRAFT │────▶│  ACTIVE   │────────────────▶  │ ARCHIVED │
  └───────┘     └───────────┘                    └──────────┘
      │              │  ▲                             ▲
      │              │  │ reactivate()                │
      │              │  └─────────────────────────────┘
      │              │        unarchive()
      │              │
      │              ▼
      │         ┌───────────┐
      └────────▶│ SCHEDULED │  (future start_date)
                └───────────┘
                     │
                     │  start_date reached
                     ▼
                ┌───────────┐
                │  ACTIVE   │
                └───────────┘
```

**States:**
- **DRAFT** — Quest is being designed. Not visible to users. Can be edited freely.
- **SCHEDULED** — Quest has a future `start_date`. Automatically transitions to ACTIVE when the date arrives.
- **ACTIVE** — Quest is live and available to users. Edits are restricted (only metadata, not objectives/rewards).
- **ARCHIVED** — Quest is no longer available for new starts. Users with in-progress instances can still complete them (grace period configurable).

#### User Quest Progress State Machine

```
                    start()
  ┌─────────────┐     ┌──────────────┐     all objectives met
  │ NOT_STARTED │────▶│ IN_PROGRESS  │──────────────────────┐
  └─────────────┘     └──────────────┘                      │
                           │    ▲                            ▼
                           │    │                     ┌──────────┐
                abandon()  │    │ resume()             │ COMPLETED│
                           │    │                     └──────┬───┘
                           ▼    │                            │
                      ┌──────────┐                    claim()│
                      │ABANDONED │                           ▼
                      └──────────┘                    ┌──────────┐
                                                      │ CLAIMED  │
                           ┌──────────┐               └──────────┘
                           │ EXPIRED  │
                           └──────────┘
                             ▲
                             │ deadline passed
                             │ (from IN_PROGRESS)
```

**States:**
- **NOT_STARTED** — User is aware of the quest but hasn't begun. Default state when a quest appears on the board.
- **IN_PROGRESS** — User has started the quest. Objectives are being tracked.
- **COMPLETED** — All objectives are met. User can claim rewards.
- **CLAIMED** — Rewards have been distributed. Terminal state for successful quests.
- **ABANDONED** — User voluntarily abandoned the quest. Can resume within a cooldown window.
- **EXPIRED** — Quest deadline passed while in progress. Cannot be completed.

**Transitions are atomic** — state changes and progress updates are wrapped in database transactions to prevent race conditions from concurrent event processing.

### Objective Evaluation Pipeline

The objective evaluation pipeline is the core engine that converts raw user events into quest progress. It runs as a stateless consumer on the Redpanda event bus.

```
┌──────────────┐     ┌──────────────┐     ┌──────────────────┐
│  User Action  │     │  Redpanda    │     │  Objective       │
│  (any system) │────▶│  Topic:      │────▶│  Tracking        │
│               │     │  user.actions│     │  Consumer         │
└──────────────┘     └──────────────┘     └────────┬─────────┘
                                                    │
                                          ┌─────────▼──────────┐
                                          │  Event Router       │
                                          │  (match event type  │
                                          │   to active         │
                                          │   objectives)       │
                                          └─────────┬──────────┘
                                                    │
                              ┌──────────────────────┼──────────────────────┐
                              │                      │                      │
                    ┌─────────▼──────┐    ┌──────────▼─────┐    ┌──────────▼─────┐
                    │  Event Count   │    │  Threshold     │    │  Collection    │
                    │  Evaluator     │    │  Evaluator     │    │  Evaluator     │
                    │  (increment)   │    │  (compare)     │    │  (add to set)  │
                    └─────────┬──────┘    └──────────┬─────┘    └──────────┬─────┘
                              │                      │                      │
                              └──────────────────────┼──────────────────────┘
                                                     │
                                           ┌─────────▼──────────┐
                                           │  Progress Updater  │
                                           │  (atomic DB write) │
                                           └─────────┬──────────┘
                                                     │
                                           ┌─────────▼──────────┐
                                           │  Completion Check  │
                                           │  (all objectives   │
                                           │   met → transition │
                                           │   to COMPLETED)    │
                                           └─────────┬──────────┘
                                                     │
                                           ┌─────────▼──────────┐
                                           │  Emit Events       │
                                           │  quest.progress    │
                                           │  quest.completed   │
                                           └────────────────────┘
```

#### Objective Types and Evaluation Logic

| Type | Description | Evaluation | Progress Representation |
|------|-------------|------------|------------------------|
| `EVENT_COUNT` | Perform action N times | Increment counter on matching event | `current: 7, target: 10` |
| `THRESHOLD` | Reach a value/score | Compare latest value against threshold | `current: 2450, target: 3000` |
| `COLLECTION` | Gather N distinct items | Add item ID to set, count unique | `collected: ['a','b'], target: 5` |
| `EXPLORATION` | Visit N pages/areas | Add location to visited set | `visited: ['/p1','/p2'], target: 4` |
| `SOCIAL` | Interact with N users | Add user ID to interaction set | `interacted: ['u1'], target: 3` |
| `CUSTOM` | Arbitrary predicate | Evaluate custom function/expression | `result: boolean` |

#### Event Matching

Events are matched to objectives using a **subscription key** system:

```typescript
// Objective defines what events it cares about
{
  objectiveType: 'EVENT_COUNT',
  eventType: 'post.created',          // Primary event type
  eventFilter: {                       // Optional filter predicates
    'payload.category': 'tutorial',
    'payload.wordCount': { $gte: 100 }
  },
  targetValue: 5
}

// Incoming event
{
  type: 'post.created',
  userId: 'user_123',
  tenantId: 'tenant_abc',
  payload: {
    category: 'tutorial',
    wordCount: 350
  }
}
```

The consumer maintains an in-memory index of `eventType → active objectives` per tenant, refreshed periodically from the database. When an event arrives, lookup is O(1) on event type, then O(n) on filter predicates (where n is typically small — usually 1-5 matching objectives).

### Event-Driven Tracking

The quest system is fully event-driven. It both consumes and produces events through Redpanda.

#### Consumed Topics

| Topic | Purpose |
|-------|---------|
| `user.actions` | Raw user actions from any system — the primary input for objective tracking |
| `user.sessions` | Session start/end events for exploration-type objectives |
| `social.interactions` | Friend requests, invites, messages for social objectives |
| `economy.transactions` | Purchase/spend events for economy-related objectives |

#### Produced Topics

| Topic | Purpose |
|-------|---------|
| `quest.progress` | Objective progress updates (consumed by real-time notification service) |
| `quest.completed` | Quest completion events (consumed by reward service, analytics, achievements) |
| `quest.started` | Quest start events (consumed by analytics, recommendation engine) |
| `quest.abandoned` | Quest abandonment events (consumed by analytics, re-engagement) |
| `quest.rewards.claimed` | Reward claim events (consumed by economy service, analytics) |
| `quest.daily.assigned` | Daily quest assignment events (consumed by notification service) |
| `quest.party.progress` | Party quest contribution events (consumed by group notification) |
| `quest.streak` | Streak milestone events (consumed by achievements, notifications) |

### Reset Scheduler

Daily and weekly quest resets are handled by dedicated schedulers that run as cron-like processes.

```
┌──────────────────────────────────────────────────────────────┐
│                    Reset Scheduler                            │
│                                                              │
│  ┌────────────────┐  Runs every minute, checks:             │
│  │  Cron Trigger   │  - Current UTC time                     │
│  │  (* * * * *)    │  - Tenant timezone offsets              │
│  └───────┬────────┘  - Which tenants need reset              │
│          │                                                    │
│          ▼                                                    │
│  ┌────────────────┐                                          │
│  │  Tenant Clock   │  Groups tenants by timezone             │
│  │  Resolution     │  Identifies whose "midnight" it is      │
│  └───────┬────────┘                                          │
│          │                                                    │
│          ▼                                                    │
│  ┌────────────────┐                                          │
│  │  Reset Tasks    │  For each tenant at midnight:           │
│  │                 │  1. Archive yesterday's daily quests    │
│  │                 │  2. Select new dailies from pool        │
│  │                 │  3. Reset daily progress states         │
│  │                 │  4. Update streak counters              │
│  │                 │  5. Emit assignment events              │
│  └───────┬────────┘                                          │
│          │                                                    │
│          ▼  (Monday only)                                    │
│  ┌────────────────┐                                          │
│  │  Weekly Reset   │  Same as daily but for weekly quests    │
│  │  Tasks          │  + weekly streak tracking               │
│  └────────────────┘                                          │
└──────────────────────────────────────────────────────────────┘
```

#### Streak Bonus Calculation

Daily quest completion streaks grant escalating bonuses:

| Streak Days | Bonus Multiplier | Extra Reward |
|-------------|-----------------|--------------|
| 1-2 | 1.0x | None |
| 3-6 | 1.1x | None |
| 7-13 | 1.25x | Streak badge (bronze) |
| 14-29 | 1.5x | Streak badge (silver) |
| 30-59 | 1.75x | Streak badge (gold) |
| 60-89 | 2.0x | Streak badge (platinum) |
| 90+ | 2.5x | Streak badge (diamond) + title |

Streak breaks reset to day 1. A **streak freeze** item (from the rewards shop) preserves the streak for one missed day.

### Quest Recommendation Engine

The recommendation engine uses collaborative filtering and content-based signals to surface the most engaging quests for each user.

```
┌──────────────────────────────────────────────────────────────┐
│                 Recommendation Engine                         │
│                                                              │
│  Input Signals:                                              │
│  ┌─────────────────┐  ┌──────────────────┐                  │
│  │ User Profile     │  │ Quest Metadata    │                  │
│  │ - Level          │  │ - Difficulty      │                  │
│  │ - Play style     │  │ - Category        │                  │
│  │ - History        │  │ - Est. duration   │                  │
│  │ - Preferences    │  │ - Popularity      │                  │
│  └────────┬────────┘  └────────┬─────────┘                  │
│           │                     │                             │
│           ▼                     ▼                             │
│  ┌─────────────────────────────────────────┐                 │
│  │         Feature Vector Builder           │                 │
│  └────────────────────┬────────────────────┘                 │
│                       │                                       │
│           ┌───────────┼───────────┐                          │
│           ▼           ▼           ▼                          │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐                   │
│  │Collab.   │  │Content   │  │Contextual│                   │
│  │Filtering │  │Based     │  │(time,    │                   │
│  │(similar  │  │(quest    │  │ season,  │                   │
│  │ users)   │  │ traits)  │  │ events)  │                   │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘                   │
│       │              │              │                         │
│       ▼              ▼              ▼                         │
│  ┌─────────────────────────────────────────┐                 │
│  │         Score Fusion & Ranking           │                 │
│  │  (weighted blend, diversity injection)   │                 │
│  └────────────────────┬────────────────────┘                 │
│                       │                                       │
│                       ▼                                       │
│  ┌─────────────────────────────────────────┐                 │
│  │         Personalized Quest Board         │                 │
│  └─────────────────────────────────────────┘                 │
└──────────────────────────────────────────────────────────────┘
```

**Scoring factors:**
- **Completion probability** — Based on similar users' completion rates for this quest
- **Engagement lift** — Expected increase in session time from quest pursuit
- **Difficulty match** — Distance between quest difficulty and user skill level (flow zone targeting)
- **Freshness** — Recency of quest creation (prefer newer content)
- **Diversity** — Penalize quests similar to recently completed ones (prevent monotony)
- **Urgency** — Boost time-limited quests approaching their deadline

---

## Core Interfaces

### Quest

```typescript
/**
 * Represents a quest definition — the template from which user instances are created.
 * Quests are tenant-scoped and follow a draft → active → archived lifecycle.
 */
interface Quest {
  /** Unique quest identifier (ULID) */
  id: string;

  /** Owning tenant */
  tenantId: string;

  /** Human-readable quest slug (unique per tenant) */
  slug: string;

  /** Display title */
  title: string;

  /** Detailed description (supports markdown) */
  description: string;

  /** Short summary for quest board cards */
  summary: string;

  /** Quest type classification */
  type: QuestType;

  /** Lifecycle status */
  status: QuestStatus;

  /** Difficulty rating */
  difficulty: QuestDifficulty;

  /** Category for filtering (e.g., 'combat', 'social', 'creative') */
  category: string;

  /** Tags for additional classification */
  tags: string[];

  /** Icon URL or icon identifier */
  icon: string | null;

  /** Banner image URL for quest detail view */
  bannerImage: string | null;

  /** Estimated completion time in minutes */
  estimatedMinutes: number | null;

  /** Quest chain this quest belongs to (null if standalone) */
  chainId: string | null;

  /** Position within the quest chain (0-indexed) */
  chainPosition: number | null;

  /** Prerequisite quest IDs that must be CLAIMED before this quest is available */
  prerequisiteQuestIds: string[];

  /** Minimum user level required to see/start this quest */
  minLevel: number | null;

  /** Maximum user level (quest hidden above this level) */
  maxLevel: number | null;

  /** When the quest becomes available (null = immediately upon publish) */
  startDate: Date | null;

  /** When the quest expires (null = no expiration) */
  endDate: Date | null;

  /** Maximum number of users who can complete this quest (null = unlimited) */
  maxCompletions: number | null;

  /** Current completion count (for limited quests) */
  completionCount: number;

  /** Whether this quest can be repeated after claiming */
  repeatable: boolean;

  /** Cooldown between repeats in seconds (for repeatable quests) */
  repeatCooldownSeconds: number | null;

  /** Maximum number of times a user can complete this quest (null = unlimited) */
  maxRepeats: number | null;

  /** Deadline in seconds after starting (null = no per-user deadline) */
  deadlineSeconds: number | null;

  /** Whether objectives must be completed in order */
  orderedObjectives: boolean;

  /** Version number for optimistic concurrency */
  version: number;

  /** Quest creator user ID */
  createdBy: string;

  /** Timestamps */
  createdAt: Date;
  updatedAt: Date;
  publishedAt: Date | null;
  archivedAt: Date | null;

  /** Soft delete */
  deletedAt: Date | null;

  /** Arbitrary metadata for custom integrations */
  metadata: Record<string, unknown>;
}

/** Quest types */
type QuestType =
  | 'daily'       // Auto-reset, selected from daily pool
  | 'weekly'      // Auto-reset weekly, selected from weekly pool
  | 'story'       // Part of a narrative chain
  | 'side'        // One-time optional quest
  | 'event'       // Time-limited, tied to an event/campaign
  | 'tutorial'    // Onboarding quests, cannot be abandoned
  | 'achievement' // Passive tracking quests (bridge to achievements)
  | 'party';      // Requires a group

/** Quest lifecycle status */
type QuestStatus = 'draft' | 'scheduled' | 'active' | 'archived';

/** Difficulty levels */
type QuestDifficulty = 'trivial' | 'easy' | 'medium' | 'hard' | 'epic' | 'legendary';
```

### QuestObjective

```typescript
/**
 * Represents a single objective within a quest.
 * Quests have 1 to N objectives, all of which must be completed to finish the quest.
 */
interface QuestObjective {
  /** Unique objective identifier (ULID) */
  id: string;

  /** Parent quest */
  questId: string;

  /** Owning tenant */
  tenantId: string;

  /** Display title */
  title: string;

  /** Detailed description */
  description: string;

  /** Objective evaluation type */
  objectiveType: ObjectiveType;

  /** Position/order within the quest (for ordered quests) */
  position: number;

  /** The event type this objective subscribes to */
  eventType: string;

  /**
   * Filter predicates applied to event payload.
   * Only events matching ALL filters contribute to progress.
   *
   * Supports:
   * - Equality: { "payload.category": "tutorial" }
   * - Comparison: { "payload.score": { "$gte": 100 } }
   * - Inclusion: { "payload.type": { "$in": ["a", "b"] } }
   * - Regex: { "payload.name": { "$regex": "^quest_" } }
   */
  eventFilter: Record<string, unknown> | null;

  /** Target value for completion (e.g., count=10, threshold=5000) */
  targetValue: number;

  /**
   * For COLLECTION/EXPLORATION/SOCIAL types:
   * The field path in the event payload that contains the item/location/user ID.
   */
  trackingField: string | null;

  /**
   * For CUSTOM type: the evaluation expression or function identifier.
   * Evaluated server-side in a sandboxed context.
   */
  customEvaluator: string | null;

  /** Whether this objective is optional (bonus objective) */
  optional: boolean;

  /** Whether progress is hidden from the user until completion */
  hidden: boolean;

  /** Hints shown at various progress thresholds */
  hints: ObjectiveHint[];

  /** Timestamps */
  createdAt: Date;
  updatedAt: Date;

  /** Arbitrary metadata */
  metadata: Record<string, unknown>;
}

/** Objective type classification */
type ObjectiveType =
  | 'EVENT_COUNT'   // Perform action N times
  | 'THRESHOLD'     // Reach a value/score
  | 'COLLECTION'    // Gather N distinct items
  | 'EXPLORATION'   // Visit N pages/areas
  | 'SOCIAL'        // Interact with N users
  | 'CUSTOM';       // Arbitrary predicate

/** Hint shown at a progress milestone */
interface ObjectiveHint {
  /** Progress percentage at which to reveal this hint (0-100) */
  atPercent: number;
  /** Hint text */
  text: string;
}
```

### QuestChain

```typescript
/**
 * Represents a chain of quests that form a narrative arc or progression sequence.
 * Chains can be linear (A → B → C) or branching (A → B1 | B2 → C).
 */
interface QuestChain {
  /** Unique chain identifier (ULID) */
  id: string;

  /** Owning tenant */
  tenantId: string;

  /** Display name */
  name: string;

  /** Description of the chain/storyline */
  description: string;

  /** Category for grouping */
  category: string;

  /** Icon or badge for the chain */
  icon: string | null;

  /** Banner image for chain overview */
  bannerImage: string | null;

  /**
   * Chain structure definition.
   * Nodes represent quests; edges represent progression paths.
   * Supports linear, branching, and converging structures.
   */
  structure: ChainStructure;

  /** Total number of quests in the chain */
  totalQuests: number;

  /** Whether the chain is visible before any quest is started */
  previewable: boolean;

  /** Bonus reward granted upon completing the entire chain */
  chainCompletionReward: QuestReward | null;

  /** Timestamps */
  createdAt: Date;
  updatedAt: Date;
}

/** DAG structure for quest chains */
interface ChainStructure {
  /** Starting quest node IDs */
  entryPoints: string[];

  /** Node definitions */
  nodes: ChainNode[];

  /** Edges connecting nodes */
  edges: ChainEdge[];
}

/** A node in the chain DAG */
interface ChainNode {
  /** Quest ID */
  questId: string;

  /** Position for UI layout */
  position: { x: number; y: number };

  /** Whether this is a terminal node */
  isTerminal: boolean;
}

/** An edge connecting two quests in the chain */
interface ChainEdge {
  /** Source quest ID */
  fromQuestId: string;

  /** Target quest ID */
  toQuestId: string;

  /**
   * Condition for this edge (for branching paths).
   * If null, the edge is unconditional (always available after source completion).
   * Otherwise, evaluated against the source quest's completion context.
   */
  condition: EdgeCondition | null;

  /** Label shown in UI for branching choices */
  label: string | null;
}

/** Condition for a chain edge */
interface EdgeCondition {
  /** Type of condition */
  type: 'choice' | 'objective_state' | 'metadata';

  /** Condition parameters */
  params: Record<string, unknown>;
}
```

### QuestProgress

```typescript
/**
 * Tracks a specific user's progress on a specific quest.
 * One record per user-quest pair. For repeatable quests, a new record is created
 * for each attempt (previous records are retained with state CLAIMED).
 */
interface QuestProgress {
  /** Unique progress record identifier (ULID) */
  id: string;

  /** The quest being tracked */
  questId: string;

  /** The user whose progress this is */
  userId: string;

  /** Owning tenant */
  tenantId: string;

  /** Current progress state */
  state: QuestProgressState;

  /** When the user started this quest */
  startedAt: Date | null;

  /** When all objectives were completed */
  completedAt: Date | null;

  /** When rewards were claimed */
  claimedAt: Date | null;

  /** When the quest was abandoned (if applicable) */
  abandonedAt: Date | null;

  /** When the quest expired (if applicable) */
  expiredAt: Date | null;

  /** Per-user deadline (calculated from quest.deadlineSeconds + startedAt) */
  deadline: Date | null;

  /** For repeatable quests: which attempt number this is (1-indexed) */
  attemptNumber: number;

  /** Completion time in seconds (completedAt - startedAt) */
  completionTimeSeconds: number | null;

  /** Party quest ID if this progress is part of a party quest */
  partyQuestId: string | null;

  /** Checkpoint data for resumable quests (arbitrary JSON) */
  checkpoint: Record<string, unknown> | null;

  /** Timestamps */
  createdAt: Date;
  updatedAt: Date;
}

/** User quest progress states */
type QuestProgressState =
  | 'not_started'
  | 'in_progress'
  | 'completed'
  | 'claimed'
  | 'abandoned'
  | 'expired';
```

### QuestReward

```typescript
/**
 * Defines a reward granted upon quest completion.
 * Each quest can have multiple rewards, plus conditional bonus rewards.
 */
interface QuestReward {
  /** Unique reward identifier (ULID) */
  id: string;

  /** Parent quest */
  questId: string;

  /** Owning tenant */
  tenantId: string;

  /** Reward type */
  rewardType: RewardType;

  /** Base amount for numeric rewards (points, XP, tokens) */
  amount: number | null;

  /**
   * For ITEM type: the item definition ID.
   * For ACHIEVEMENT type: the achievement ID.
   * For TITLE type: the title slug.
   */
  referenceId: string | null;

  /** Display name for this reward (overrides default from referenced entity) */
  displayName: string | null;

  /** Icon for this reward */
  icon: string | null;

  /** Whether this is a bonus reward (not guaranteed) */
  isBonus: boolean;

  /**
   * Condition for bonus rewards.
   * e.g., "speed_bonus" (completed under par time), "difficulty_bonus", "first_completion"
   */
  bonusCondition: BonusCondition | null;

  /** Multiplier applied to amount (stacks with streak multipliers) */
  multiplier: number;

  /** Position for display ordering */
  position: number;

  /** Timestamps */
  createdAt: Date;
  updatedAt: Date;
}

/** Reward types */
type RewardType =
  | 'POINTS'       // Platform currency points
  | 'XP'           // Experience points
  | 'TOKENS'       // Premium/blockchain tokens
  | 'ITEM'         // Virtual item from inventory system
  | 'ACHIEVEMENT'  // Unlocks an achievement
  | 'TITLE'        // Grants a user title
  | 'BADGE'        // Visual badge/flair
  | 'LOOTBOX'      // Random reward container
  | 'CUSTOM';      // Arbitrary reward (handled by callback)

/** Bonus reward conditions */
interface BonusCondition {
  /** Condition type */
  type: 'speed' | 'difficulty' | 'first_completion' | 'streak' | 'no_hints' | 'perfect' | 'custom';

  /** Parameters for the condition */
  params: Record<string, unknown>;

  /**
   * For speed bonus: the par time in seconds.
   * Completing under this time triggers the bonus.
   */
  parTimeSeconds?: number;
}
```

### QuestBoard

```typescript
/**
 * Represents the quest board — the primary UI for quest discovery.
 * The board is dynamically generated per user based on available quests,
 * user state, and recommendation scores.
 */
interface QuestBoard {
  /** User this board is generated for */
  userId: string;

  /** Tenant context */
  tenantId: string;

  /** Active quests (in progress) */
  activeQuests: QuestBoardEntry[];

  /** Available quests (not yet started) */
  availableQuests: QuestBoardEntry[];

  /** Completed quests (rewards unclaimed) */
  completedQuests: QuestBoardEntry[];

  /** Featured/promoted quests */
  featuredQuests: QuestBoardEntry[];

  /** Daily quest assignments */
  dailyQuests: QuestBoardEntry[];

  /** Weekly quest assignments */
  weeklyQuests: QuestBoardEntry[];

  /** Chain progress summaries */
  chains: QuestChainSummary[];

  /** Party quests the user is participating in */
  partyQuests: QuestBoardEntry[];

  /** Daily quest streak info */
  dailyStreak: StreakInfo;

  /** Weekly quest streak info */
  weeklyStreak: StreakInfo;

  /** Board generation timestamp */
  generatedAt: Date;
}

/** A single entry on the quest board */
interface QuestBoardEntry {
  /** Quest definition */
  quest: Quest;

  /** User's progress on this quest (null if not started) */
  progress: QuestProgress | null;

  /** Objective summaries with progress */
  objectives: ObjectiveProgressSummary[];

  /** Rewards preview */
  rewards: QuestReward[];

  /** ML recommendation score (0-1, higher = more recommended) */
  recommendationScore: number | null;

  /** Recommendation explanation for UI */
  recommendationReason: string | null;

  /** Whether the quest is new (first time on the user's board) */
  isNew: boolean;

  /** Time remaining for time-limited quests (seconds, null if no limit) */
  timeRemainingSeconds: number | null;
}

/** Objective progress summary for board display */
interface ObjectiveProgressSummary {
  /** Objective definition */
  objective: QuestObjective;

  /** Current progress value */
  currentValue: number;

  /** Target value for completion */
  targetValue: number;

  /** Completion percentage (0-100) */
  percentComplete: number;

  /** Whether this objective is complete */
  isComplete: boolean;

  /** Currently revealed hint (if any) */
  currentHint: string | null;
}

/** Streak information */
interface StreakInfo {
  /** Current streak count (days or weeks) */
  currentStreak: number;

  /** Longest streak ever achieved */
  longestStreak: number;

  /** Current bonus multiplier */
  bonusMultiplier: number;

  /** Whether today's/this week's quest is completed */
  currentPeriodCompleted: boolean;

  /** Whether a streak freeze is active */
  freezeActive: boolean;

  /** Number of streak freezes remaining */
  freezesRemaining: number;
}

/** Chain progress summary for board display */
interface QuestChainSummary {
  /** Chain definition */
  chain: QuestChain;

  /** Number of quests completed in this chain */
  completedQuests: number;

  /** Total quests in the chain */
  totalQuests: number;

  /** Percentage complete */
  percentComplete: number;

  /** Next available quest in the chain */
  nextQuest: Quest | null;

  /** Whether the chain is fully completed */
  isComplete: boolean;
}
```

### DailyQuestPool

```typescript
/**
 * Defines a pool of quests from which daily assignments are selected.
 * Each tenant can have multiple pools (e.g., by difficulty, category).
 * The scheduler selects N quests from each pool daily.
 */
interface DailyQuestPool {
  /** Unique pool identifier (ULID) */
  id: string;

  /** Owning tenant */
  tenantId: string;

  /** Pool name (e.g., "Easy Dailies", "Combat Dailies") */
  name: string;

  /** Description */
  description: string;

  /** Quest IDs available in this pool */
  questIds: string[];

  /** Number of quests to select from this pool each day */
  selectCount: number;

  /** Selection strategy */
  selectionStrategy: 'random' | 'weighted' | 'round_robin' | 'adaptive';

  /**
   * For weighted strategy: weights per quest ID.
   * Higher weight = more likely to be selected.
   */
  weights: Record<string, number> | null;

  /**
   * For adaptive strategy: quest selection is influenced by
   * recent completion rates (low completion = less likely to be selected again).
   */
  adaptiveConfig: AdaptivePoolConfig | null;

  /** Whether this pool is active */
  active: boolean;

  /** Minimum user level to receive quests from this pool */
  minLevel: number | null;

  /** Maximum user level */
  maxLevel: number | null;

  /** Timestamps */
  createdAt: Date;
  updatedAt: Date;
}

/** Configuration for adaptive pool selection */
interface AdaptivePoolConfig {
  /** Weight boost for quests with high completion rates (0-1 range) */
  completionRateWeight: number;

  /** Weight reduction for recently assigned quests (decay factor) */
  recencyDecay: number;

  /** Minimum days between re-assigning the same quest */
  minRepeatDays: number;
}

/** A daily quest assignment record */
interface DailyQuestAssignment {
  /** Unique assignment identifier (ULID) */
  id: string;

  /** Tenant */
  tenantId: string;

  /** Assigned user (null for tenant-wide assignments) */
  userId: string | null;

  /** Pool this quest was selected from */
  poolId: string;

  /** The assigned quest */
  questId: string;

  /** Assignment date (date component only, no time) */
  assignmentDate: string; // YYYY-MM-DD

  /** Whether the user completed this daily quest */
  completed: boolean;

  /** Whether the user claimed rewards for this daily quest */
  claimed: boolean;

  /** Timestamps */
  createdAt: Date;
  updatedAt: Date;
}
```

### PartyQuest

```typescript
/**
 * Represents a group quest that requires multiple users to collaborate.
 * Party quests track individual contributions and distribute rewards
 * based on participation level.
 */
interface PartyQuest {
  /** Unique party quest instance identifier (ULID) */
  id: string;

  /** The quest template this party quest is based on */
  questId: string;

  /** Owning tenant */
  tenantId: string;

  /** User who initiated the party quest */
  leaderId: string;

  /** Guild/group ID if this is a guild quest */
  guildId: string | null;

  /** Party name (optional, for ad-hoc parties) */
  partyName: string | null;

  /** Current members */
  memberIds: string[];

  /** Maximum party size */
  maxMembers: number;

  /** Minimum party size required to start */
  minMembers: number;

  /** Current state */
  state: PartyQuestState;

  /** When the party quest was started (enough members joined) */
  startedAt: Date | null;

  /** When the party quest was completed */
  completedAt: Date | null;

  /** Reward distribution strategy */
  rewardDistribution: RewardDistribution;

  /** Per-user deadline to join before the quest auto-starts */
  joinDeadline: Date | null;

  /** Timestamps */
  createdAt: Date;
  updatedAt: Date;
}

/** Party quest states */
type PartyQuestState =
  | 'recruiting'    // Waiting for enough members
  | 'in_progress'   // Active, tracking contributions
  | 'completed'     // All objectives met
  | 'failed'        // Deadline passed without completion
  | 'disbanded';    // Leader disbanded the party

/** How rewards are split among party members */
type RewardDistribution =
  | 'equal'            // All members get full rewards
  | 'proportional'     // Proportional to contribution
  | 'threshold'        // Must contribute X% to receive rewards
  | 'tiered';          // Top contributors get bonus rewards

/**
 * Tracks an individual member's contribution to a party quest.
 */
interface PartyQuestContribution {
  /** Unique contribution record identifier (ULID) */
  id: string;

  /** Parent party quest */
  partyQuestId: string;

  /** Contributing user */
  userId: string;

  /** Owning tenant */
  tenantId: string;

  /** Objective-level contribution totals */
  objectiveContributions: Record<string, number>;

  /** Total contribution score (normalized across objectives) */
  totalContribution: number;

  /** Contribution percentage (0-100) */
  contributionPercent: number;

  /** Whether this member has claimed their reward share */
  rewardClaimed: boolean;

  /** Timestamps */
  createdAt: Date;
  updatedAt: Date;
}
```

### QuestService

```typescript
/**
 * Primary service for quest management.
 * Orchestrates quest CRUD, lifecycle transitions, and delegates to sub-services.
 */
interface QuestService {
  // ── Quest CRUD ──────────────────────────────────────────

  /** Create a new quest in DRAFT status */
  createQuest(input: CreateQuestInput): Promise<Quest>;

  /** Update a quest (restricted fields when ACTIVE) */
  updateQuest(questId: string, input: UpdateQuestInput): Promise<Quest>;

  /** Get a quest by ID */
  getQuest(questId: string): Promise<Quest | null>;

  /** Get a quest by slug */
  getQuestBySlug(slug: string): Promise<Quest | null>;

  /** List quests with filtering and pagination */
  listQuests(filter: QuestFilter): Promise<PaginatedResult<Quest>>;

  /** Soft-delete a quest (only DRAFT or ARCHIVED) */
  deleteQuest(questId: string): Promise<void>;

  // ── Lifecycle ───────────────────────────────────────────

  /** Publish a DRAFT quest to ACTIVE (validates completeness) */
  publishQuest(questId: string): Promise<Quest>;

  /** Schedule a DRAFT quest for future activation */
  scheduleQuest(questId: string, startDate: Date): Promise<Quest>;

  /** Archive an ACTIVE quest */
  archiveQuest(questId: string): Promise<Quest>;

  /** Reactivate an ARCHIVED quest */
  reactivateQuest(questId: string): Promise<Quest>;

  // ── Objectives ──────────────────────────────────────────

  /** Add an objective to a quest (DRAFT only) */
  addObjective(questId: string, input: CreateObjectiveInput): Promise<QuestObjective>;

  /** Update an objective */
  updateObjective(objectiveId: string, input: UpdateObjectiveInput): Promise<QuestObjective>;

  /** Remove an objective from a quest (DRAFT only) */
  removeObjective(objectiveId: string): Promise<void>;

  /** Reorder objectives within a quest */
  reorderObjectives(questId: string, objectiveIds: string[]): Promise<void>;

  // ── Rewards ─────────────────────────────────────────────

  /** Add a reward to a quest */
  addReward(questId: string, input: CreateRewardInput): Promise<QuestReward>;

  /** Update a reward */
  updateReward(rewardId: string, input: UpdateRewardInput): Promise<QuestReward>;

  /** Remove a reward from a quest */
  removeReward(rewardId: string): Promise<void>;

  // ── User Progress ───────────────────────────────────────

  /** Start a quest for a user (transitions to IN_PROGRESS) */
  startQuest(questId: string, userId: string): Promise<QuestProgress>;

  /** Abandon a quest */
  abandonQuest(progressId: string): Promise<QuestProgress>;

  /** Resume an abandoned quest (within cooldown) */
  resumeQuest(progressId: string): Promise<QuestProgress>;

  /** Claim rewards for a completed quest */
  claimRewards(progressId: string): Promise<QuestClaim>;

  /** Get user's progress on a specific quest */
  getProgress(questId: string, userId: string): Promise<QuestProgress | null>;

  /** Get all active quests for a user */
  getActiveQuests(userId: string): Promise<QuestProgress[]>;

  // ── Quest Board ─────────────────────────────────────────

  /** Generate personalized quest board for a user */
  getQuestBoard(userId: string, options?: QuestBoardOptions): Promise<QuestBoard>;

  // ── Quest Chains ────────────────────────────────────────

  /** Create a quest chain */
  createChain(input: CreateQuestChainInput): Promise<QuestChain>;

  /** Update a quest chain */
  updateChain(chainId: string, input: UpdateQuestChainInput): Promise<QuestChain>;

  /** Get chain progress for a user */
  getChainProgress(chainId: string, userId: string): Promise<QuestChainSummary>;

  // ── Daily/Weekly ────────────────────────────────────────

  /** Get today's daily quests for a user */
  getDailyQuests(userId: string): Promise<DailyQuestAssignment[]>;

  /** Get this week's weekly quests for a user */
  getWeeklyQuests(userId: string): Promise<DailyQuestAssignment[]>;

  /** Get streak info for a user */
  getStreakInfo(userId: string): Promise<{ daily: StreakInfo; weekly: StreakInfo }>;

  // ── Party Quests ────────────────────────────────────────

  /** Create a party quest instance */
  createPartyQuest(questId: string, leaderId: string, options?: PartyQuestOptions): Promise<PartyQuest>;

  /** Join a party quest */
  joinPartyQuest(partyQuestId: string, userId: string): Promise<PartyQuest>;

  /** Leave a party quest */
  leavePartyQuest(partyQuestId: string, userId: string): Promise<PartyQuest>;

  /** Get party quest with contributions */
  getPartyQuest(partyQuestId: string): Promise<PartyQuest & { contributions: PartyQuestContribution[] }>;

  // ── Analytics ───────────────────────────────────────────

  /** Get analytics for a specific quest */
  getQuestAnalytics(questId: string, dateRange?: DateRange): Promise<QuestAnalytics>;

  /** Get aggregate analytics across all quests */
  getGlobalAnalytics(dateRange?: DateRange): Promise<GlobalQuestAnalytics>;

  /** Get drop-off analysis for a quest */
  getDropOffAnalysis(questId: string): Promise<DropOffAnalysis>;

  /** Get reward economy impact report */
  getRewardEconomyReport(dateRange?: DateRange): Promise<RewardEconomyReport>;
}
```

---

## Database Schemas

All tables are tenant-scoped with Row-Level Security (RLS) policies. The schemas below are defined using Drizzle ORM syntax.

### quests

```typescript
import { pgTable, text, timestamp, integer, boolean, jsonb, index, uniqueIndex } from 'drizzle-orm/pg-core';
import { ulid } from '../utils/ulid';

export const quests = pgTable('quests', {
  id:                   text('id').primaryKey().$defaultFn(ulid),
  tenantId:             text('tenant_id').notNull().references(() => tenants.id),
  slug:                 text('slug').notNull(),
  title:                text('title').notNull(),
  description:          text('description').notNull().default(''),
  summary:              text('summary').notNull().default(''),
  type:                 text('type').notNull().default('side'),
    // 'daily' | 'weekly' | 'story' | 'side' | 'event' | 'tutorial' | 'achievement' | 'party'
  status:               text('status').notNull().default('draft'),
    // 'draft' | 'scheduled' | 'active' | 'archived'
  difficulty:           text('difficulty').notNull().default('medium'),
    // 'trivial' | 'easy' | 'medium' | 'hard' | 'epic' | 'legendary'
  category:             text('category').notNull().default('general'),
  tags:                 jsonb('tags').notNull().default([]),
  icon:                 text('icon'),
  bannerImage:          text('banner_image'),
  estimatedMinutes:     integer('estimated_minutes'),
  chainId:              text('chain_id').references(() => questChains.id),
  chainPosition:        integer('chain_position'),
  prerequisiteQuestIds: jsonb('prerequisite_quest_ids').notNull().default([]),
  minLevel:             integer('min_level'),
  maxLevel:             integer('max_level'),
  startDate:            timestamp('start_date', { withTimezone: true }),
  endDate:              timestamp('end_date', { withTimezone: true }),
  maxCompletions:       integer('max_completions'),
  completionCount:      integer('completion_count').notNull().default(0),
  repeatable:           boolean('repeatable').notNull().default(false),
  repeatCooldownSeconds: integer('repeat_cooldown_seconds'),
  maxRepeats:           integer('max_repeats'),
  deadlineSeconds:      integer('deadline_seconds'),
  orderedObjectives:    boolean('ordered_objectives').notNull().default(false),
  version:              integer('version').notNull().default(1),
  createdBy:            text('created_by').notNull(),
  createdAt:            timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt:            timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  publishedAt:          timestamp('published_at', { withTimezone: true }),
  archivedAt:           timestamp('archived_at', { withTimezone: true }),
  deletedAt:            timestamp('deleted_at', { withTimezone: true }),
  metadata:             jsonb('metadata').notNull().default({}),
}, (table) => ({
  tenantSlugIdx:   uniqueIndex('quests_tenant_slug_idx').on(table.tenantId, table.slug)
                     .where(sql`deleted_at IS NULL`),
  tenantStatusIdx: index('quests_tenant_status_idx').on(table.tenantId, table.status),
  tenantTypeIdx:   index('quests_tenant_type_idx').on(table.tenantId, table.type),
  chainIdx:        index('quests_chain_idx').on(table.chainId, table.chainPosition),
  startDateIdx:    index('quests_start_date_idx').on(table.startDate)
                     .where(sql`status = 'scheduled'`),
  endDateIdx:      index('quests_end_date_idx').on(table.endDate)
                     .where(sql`end_date IS NOT NULL AND status = 'active'`),
}));
```

### quest_objectives

```typescript
export const questObjectives = pgTable('quest_objectives', {
  id:              text('id').primaryKey().$defaultFn(ulid),
  questId:         text('quest_id').notNull().references(() => quests.id, { onDelete: 'cascade' }),
  tenantId:        text('tenant_id').notNull().references(() => tenants.id),
  title:           text('title').notNull(),
  description:     text('description').notNull().default(''),
  objectiveType:   text('objective_type').notNull(),
    // 'EVENT_COUNT' | 'THRESHOLD' | 'COLLECTION' | 'EXPLORATION' | 'SOCIAL' | 'CUSTOM'
  position:        integer('position').notNull().default(0),
  eventType:       text('event_type').notNull(),
  eventFilter:     jsonb('event_filter'),
  targetValue:     integer('target_value').notNull(),
  trackingField:   text('tracking_field'),
  customEvaluator: text('custom_evaluator'),
  optional:        boolean('optional').notNull().default(false),
  hidden:          boolean('hidden').notNull().default(false),
  hints:           jsonb('hints').notNull().default([]),
  createdAt:       timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt:       timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  metadata:        jsonb('metadata').notNull().default({}),
}, (table) => ({
  questIdx:     index('quest_objectives_quest_idx').on(table.questId, table.position),
  eventTypeIdx: index('quest_objectives_event_type_idx').on(table.tenantId, table.eventType),
}));
```

### quest_chains

```typescript
export const questChains = pgTable('quest_chains', {
  id:                    text('id').primaryKey().$defaultFn(ulid),
  tenantId:              text('tenant_id').notNull().references(() => tenants.id),
  name:                  text('name').notNull(),
  description:           text('description').notNull().default(''),
  category:              text('category').notNull().default('general'),
  icon:                  text('icon'),
  bannerImage:           text('banner_image'),
  structure:             jsonb('structure').notNull(),
  totalQuests:           integer('total_quests').notNull().default(0),
  previewable:           boolean('previewable').notNull().default(true),
  chainCompletionReward: jsonb('chain_completion_reward'),
  createdAt:             timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt:             timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  tenantIdx:    index('quest_chains_tenant_idx').on(table.tenantId),
  categoryIdx:  index('quest_chains_category_idx').on(table.tenantId, table.category),
}));
```

### quest_progress

```typescript
export const questProgress = pgTable('quest_progress', {
  id:                    text('id').primaryKey().$defaultFn(ulid),
  questId:               text('quest_id').notNull().references(() => quests.id),
  userId:                text('user_id').notNull(),
  tenantId:              text('tenant_id').notNull().references(() => tenants.id),
  state:                 text('state').notNull().default('not_started'),
    // 'not_started' | 'in_progress' | 'completed' | 'claimed' | 'abandoned' | 'expired'
  startedAt:             timestamp('started_at', { withTimezone: true }),
  completedAt:           timestamp('completed_at', { withTimezone: true }),
  claimedAt:             timestamp('claimed_at', { withTimezone: true }),
  abandonedAt:           timestamp('abandoned_at', { withTimezone: true }),
  expiredAt:             timestamp('expired_at', { withTimezone: true }),
  deadline:              timestamp('deadline', { withTimezone: true }),
  attemptNumber:         integer('attempt_number').notNull().default(1),
  completionTimeSeconds: integer('completion_time_seconds'),
  partyQuestId:          text('party_quest_id').references(() => partyQuests.id),
  checkpoint:            jsonb('checkpoint'),
  createdAt:             timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt:             timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  userQuestIdx:  uniqueIndex('quest_progress_user_quest_idx')
                   .on(table.userId, table.questId, table.attemptNumber),
  userStateIdx:  index('quest_progress_user_state_idx')
                   .on(table.userId, table.state),
  tenantUserIdx: index('quest_progress_tenant_user_idx')
                   .on(table.tenantId, table.userId),
  deadlineIdx:   index('quest_progress_deadline_idx')
                   .on(table.deadline)
                   .where(sql`state = 'in_progress' AND deadline IS NOT NULL`),
  partyIdx:      index('quest_progress_party_idx')
                   .on(table.partyQuestId)
                   .where(sql`party_quest_id IS NOT NULL`),
}));
```

### quest_objective_progress

```typescript
export const questObjectiveProgress = pgTable('quest_objective_progress', {
  id:            text('id').primaryKey().$defaultFn(ulid),
  progressId:    text('progress_id').notNull().references(() => questProgress.id, { onDelete: 'cascade' }),
  objectiveId:   text('objective_id').notNull().references(() => questObjectives.id),
  tenantId:      text('tenant_id').notNull().references(() => tenants.id),
  userId:        text('user_id').notNull(),
  currentValue:  integer('current_value').notNull().default(0),
  targetValue:   integer('target_value').notNull(),
  isComplete:    boolean('is_complete').notNull().default(false),
  completedAt:   timestamp('completed_at', { withTimezone: true }),
  /**
   * For COLLECTION/EXPLORATION/SOCIAL types:
   * Array of collected item IDs / visited locations / interacted users.
   */
  collectedItems: jsonb('collected_items').notNull().default([]),
  /**
   * For THRESHOLD type:
   * Historical value snapshots for trend analysis.
   */
  valueHistory:  jsonb('value_history').notNull().default([]),
  createdAt:     timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt:     timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  progressIdx:      index('quest_obj_progress_progress_idx').on(table.progressId),
  objectiveIdx:     index('quest_obj_progress_objective_idx').on(table.objectiveId),
  userObjectiveIdx: uniqueIndex('quest_obj_progress_user_obj_idx')
                      .on(table.userId, table.progressId, table.objectiveId),
}));
```

### quest_rewards

```typescript
export const questRewards = pgTable('quest_rewards', {
  id:             text('id').primaryKey().$defaultFn(ulid),
  questId:        text('quest_id').notNull().references(() => quests.id, { onDelete: 'cascade' }),
  tenantId:       text('tenant_id').notNull().references(() => tenants.id),
  rewardType:     text('reward_type').notNull(),
    // 'POINTS' | 'XP' | 'TOKENS' | 'ITEM' | 'ACHIEVEMENT' | 'TITLE' | 'BADGE' | 'LOOTBOX' | 'CUSTOM'
  amount:         integer('amount'),
  referenceId:    text('reference_id'),
  displayName:    text('display_name'),
  icon:           text('icon'),
  isBonus:        boolean('is_bonus').notNull().default(false),
  bonusCondition: jsonb('bonus_condition'),
  multiplier:     integer('multiplier').notNull().default(1),
  position:       integer('position').notNull().default(0),
  createdAt:      timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt:      timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  questIdx: index('quest_rewards_quest_idx').on(table.questId, table.position),
}));
```

### quest_claims

```typescript
export const questClaims = pgTable('quest_claims', {
  id:                text('id').primaryKey().$defaultFn(ulid),
  progressId:        text('progress_id').notNull().references(() => questProgress.id),
  questId:           text('quest_id').notNull().references(() => quests.id),
  userId:            text('user_id').notNull(),
  tenantId:          text('tenant_id').notNull().references(() => tenants.id),
  /** Snapshot of rewards granted (includes calculated bonuses and multipliers) */
  grantedRewards:    jsonb('granted_rewards').notNull(),
  /** Total points value of all rewards (for economy tracking) */
  totalPointsValue:  integer('total_points_value').notNull().default(0),
  /** Streak multiplier applied */
  streakMultiplier:  integer('streak_multiplier').notNull().default(1),
  /** Speed bonus applied */
  speedBonusApplied: boolean('speed_bonus_applied').notNull().default(false),
  /** First completion bonus applied */
  firstCompletion:   boolean('first_completion').notNull().default(false),
  /** Whether the reward grant was confirmed by the economy service */
  confirmed:         boolean('confirmed').notNull().default(false),
  /** If grant failed, the error message */
  grantError:        text('grant_error'),
  claimedAt:         timestamp('claimed_at', { withTimezone: true }).notNull().defaultNow(),
  confirmedAt:       timestamp('confirmed_at', { withTimezone: true }),
}, (table) => ({
  progressIdx:  uniqueIndex('quest_claims_progress_idx').on(table.progressId),
  userIdx:      index('quest_claims_user_idx').on(table.userId, table.tenantId),
  questIdx:     index('quest_claims_quest_idx').on(table.questId),
  confirmedIdx: index('quest_claims_confirmed_idx')
                  .on(table.confirmed)
                  .where(sql`confirmed = false`),
}));
```

### daily_quest_pools

```typescript
export const dailyQuestPools = pgTable('daily_quest_pools', {
  id:                text('id').primaryKey().$defaultFn(ulid),
  tenantId:          text('tenant_id').notNull().references(() => tenants.id),
  name:              text('name').notNull(),
  description:       text('description').notNull().default(''),
  questIds:          jsonb('quest_ids').notNull().default([]),
  selectCount:       integer('select_count').notNull().default(3),
  selectionStrategy: text('selection_strategy').notNull().default('random'),
    // 'random' | 'weighted' | 'round_robin' | 'adaptive'
  weights:           jsonb('weights'),
  adaptiveConfig:    jsonb('adaptive_config'),
  active:            boolean('active').notNull().default(true),
  minLevel:          integer('min_level'),
  maxLevel:          integer('max_level'),
  /** Whether this is a weekly pool (vs daily) */
  isWeekly:          boolean('is_weekly').notNull().default(false),
  createdAt:         timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt:         timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  tenantIdx:  index('daily_quest_pools_tenant_idx').on(table.tenantId, table.active),
}));
```

### daily_quest_assignments

```typescript
export const dailyQuestAssignments = pgTable('daily_quest_assignments', {
  id:              text('id').primaryKey().$defaultFn(ulid),
  tenantId:        text('tenant_id').notNull().references(() => tenants.id),
  userId:          text('user_id'),
  poolId:          text('pool_id').notNull().references(() => dailyQuestPools.id),
  questId:         text('quest_id').notNull().references(() => quests.id),
  assignmentDate:  text('assignment_date').notNull(), // YYYY-MM-DD
  completed:       boolean('completed').notNull().default(false),
  claimed:         boolean('claimed').notNull().default(false),
  createdAt:       timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt:       timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  tenantDateIdx: index('daily_quest_assign_tenant_date_idx')
                   .on(table.tenantId, table.assignmentDate),
  userDateIdx:   index('daily_quest_assign_user_date_idx')
                   .on(table.userId, table.assignmentDate),
  uniqueAssign:  uniqueIndex('daily_quest_assign_unique_idx')
                   .on(table.tenantId, table.userId, table.questId, table.assignmentDate),
}));
```

### party_quests

```typescript
export const partyQuests = pgTable('party_quests', {
  id:                  text('id').primaryKey().$defaultFn(ulid),
  questId:             text('quest_id').notNull().references(() => quests.id),
  tenantId:            text('tenant_id').notNull().references(() => tenants.id),
  leaderId:            text('leader_id').notNull(),
  guildId:             text('guild_id'),
  partyName:           text('party_name'),
  memberIds:           jsonb('member_ids').notNull().default([]),
  maxMembers:          integer('max_members').notNull().default(5),
  minMembers:          integer('min_members').notNull().default(2),
  state:               text('state').notNull().default('recruiting'),
    // 'recruiting' | 'in_progress' | 'completed' | 'failed' | 'disbanded'
  rewardDistribution:  text('reward_distribution').notNull().default('equal'),
    // 'equal' | 'proportional' | 'threshold' | 'tiered'
  startedAt:           timestamp('started_at', { withTimezone: true }),
  completedAt:         timestamp('completed_at', { withTimezone: true }),
  joinDeadline:        timestamp('join_deadline', { withTimezone: true }),
  createdAt:           timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt:           timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  questIdx:   index('party_quests_quest_idx').on(table.questId),
  tenantIdx:  index('party_quests_tenant_idx').on(table.tenantId, table.state),
  leaderIdx:  index('party_quests_leader_idx').on(table.leaderId),
  guildIdx:   index('party_quests_guild_idx').on(table.guildId)
                .where(sql`guild_id IS NOT NULL`),
}));
```

### party_quest_contributions

```typescript
export const partyQuestContributions = pgTable('party_quest_contributions', {
  id:                      text('id').primaryKey().$defaultFn(ulid),
  partyQuestId:            text('party_quest_id').notNull()
                             .references(() => partyQuests.id, { onDelete: 'cascade' }),
  userId:                  text('user_id').notNull(),
  tenantId:                text('tenant_id').notNull().references(() => tenants.id),
  objectiveContributions:  jsonb('objective_contributions').notNull().default({}),
  totalContribution:       integer('total_contribution').notNull().default(0),
  contributionPercent:     integer('contribution_percent').notNull().default(0),
  rewardClaimed:           boolean('reward_claimed').notNull().default(false),
  createdAt:               timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt:               timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  partyIdx:    index('party_contributions_party_idx').on(table.partyQuestId),
  userIdx:     uniqueIndex('party_contributions_user_idx')
                 .on(table.partyQuestId, table.userId),
}));
```

### RLS Policies (Applied Across All Tables)

```sql
-- Enable RLS on all quest tables
ALTER TABLE quests ENABLE ROW LEVEL SECURITY;
ALTER TABLE quest_objectives ENABLE ROW LEVEL SECURITY;
ALTER TABLE quest_chains ENABLE ROW LEVEL SECURITY;
ALTER TABLE quest_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE quest_objective_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE quest_rewards ENABLE ROW LEVEL SECURITY;
ALTER TABLE quest_claims ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_quest_pools ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_quest_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE party_quests ENABLE ROW LEVEL SECURITY;
ALTER TABLE party_quest_contributions ENABLE ROW LEVEL SECURITY;

-- Tenant isolation: users can only see data within their tenant
CREATE POLICY tenant_isolation ON quests
  USING (tenant_id = current_setting('app.tenant_id')::text);

CREATE POLICY tenant_isolation ON quest_objectives
  USING (tenant_id = current_setting('app.tenant_id')::text);

CREATE POLICY tenant_isolation ON quest_chains
  USING (tenant_id = current_setting('app.tenant_id')::text);

-- Progress is further scoped: users can only see their own progress
CREATE POLICY user_progress_isolation ON quest_progress
  USING (
    tenant_id = current_setting('app.tenant_id')::text
    AND (
      user_id = current_setting('app.user_id')::text
      OR current_setting('app.role')::text IN ('admin', 'service')
    )
  );

CREATE POLICY user_objective_progress_isolation ON quest_objective_progress
  USING (
    tenant_id = current_setting('app.tenant_id')::text
    AND (
      user_id = current_setting('app.user_id')::text
      OR current_setting('app.role')::text IN ('admin', 'service')
    )
  );

-- Claims: users see their own, admins see all
CREATE POLICY user_claims_isolation ON quest_claims
  USING (
    tenant_id = current_setting('app.tenant_id')::text
    AND (
      user_id = current_setting('app.user_id')::text
      OR current_setting('app.role')::text IN ('admin', 'service')
    )
  );

-- Party quests: visible to all tenant members (for recruitment)
CREATE POLICY party_quest_visibility ON party_quests
  USING (tenant_id = current_setting('app.tenant_id')::text);

-- Party contributions: visible to party members + admins
CREATE POLICY party_contribution_visibility ON party_quest_contributions
  USING (
    tenant_id = current_setting('app.tenant_id')::text
    AND (
      user_id = current_setting('app.user_id')::text
      OR party_quest_id IN (
        SELECT id FROM party_quests
        WHERE member_ids ? current_setting('app.user_id')::text
      )
      OR current_setting('app.role')::text IN ('admin', 'service')
    )
  );
```

---

## Code Examples

### Example 1 — Creating a Quest with Objectives

Create a multi-objective quest through the admin API, adding objectives and rewards before publishing.

```typescript
import { QuestService } from '@mcv/engagement/quests';
import { createTRPCContext } from '@mcv/core/trpc';

async function createTutorialQuest(ctx: TRPCContext) {
  const questService = new QuestService(ctx);

  // Step 1: Create the quest in DRAFT status
  const quest = await questService.createQuest({
    slug: 'welcome-to-the-platform',
    title: 'Welcome to the Platform!',
    description: `
      Complete this introductory quest to learn the basics of our platform.
      You'll set up your profile, make your first post, and connect with
      another community member.
    `,
    summary: 'Learn the basics and earn your first rewards',
    type: 'tutorial',
    difficulty: 'trivial',
    category: 'onboarding',
    tags: ['tutorial', 'beginner', 'onboarding'],
    estimatedMinutes: 10,
    orderedObjectives: true, // Must complete in order
  });

  // Step 2: Add objectives
  const obj1 = await questService.addObjective(quest.id, {
    title: 'Complete Your Profile',
    description: 'Fill in your display name, bio, and upload an avatar',
    objectiveType: 'EVENT_COUNT',
    eventType: 'profile.completed',
    targetValue: 1,
    position: 0,
    hints: [
      { atPercent: 0, text: 'Click on your avatar in the top-right to access your profile settings' },
    ],
  });

  const obj2 = await questService.addObjective(quest.id, {
    title: 'Create Your First Post',
    description: 'Share something with the community — it can be anything!',
    objectiveType: 'EVENT_COUNT',
    eventType: 'post.created',
    targetValue: 1,
    position: 1,
    hints: [
      { atPercent: 0, text: 'Click the "+" button at the bottom of the feed' },
    ],
  });

  const obj3 = await questService.addObjective(quest.id, {
    title: 'Follow 3 Community Members',
    description: 'Find interesting people to follow and build your network',
    objectiveType: 'SOCIAL',
    eventType: 'social.followed',
    trackingField: 'payload.targetUserId',
    targetValue: 3,
    position: 2,
    hints: [
      { atPercent: 33, text: 'Check the "Discover" tab for suggested people to follow' },
      { atPercent: 66, text: 'Almost there! One more follow to go' },
    ],
  });

  // Step 3: Add rewards
  await questService.addReward(quest.id, {
    rewardType: 'XP',
    amount: 100,
    displayName: '100 XP',
    position: 0,
  });

  await questService.addReward(quest.id, {
    rewardType: 'POINTS',
    amount: 50,
    displayName: '50 Coins',
    position: 1,
  });

  await questService.addReward(quest.id, {
    rewardType: 'TITLE',
    referenceId: 'newcomer',
    displayName: 'Newcomer Title',
    position: 2,
  });

  // Bonus reward for completing under 5 minutes
  await questService.addReward(quest.id, {
    rewardType: 'BADGE',
    referenceId: 'speed-demon-onboarding',
    displayName: 'Speed Demon Badge',
    isBonus: true,
    bonusCondition: {
      type: 'speed',
      parTimeSeconds: 300, // 5 minutes
      params: {},
    },
    position: 3,
  });

  // Step 4: Publish the quest
  const publishedQuest = await questService.publishQuest(quest.id);

  console.log(`Quest published: ${publishedQuest.title} (${publishedQuest.id})`);
  // Quest published: Welcome to the Platform! (01HQXYZ...)

  return publishedQuest;
}
```

### Example 2 — Processing Objective Progress via Events

Demonstrates how the event consumer processes incoming user action events and updates quest objective progress.

```typescript
import { ObjectiveTrackingConsumer } from '@mcv/engagement/quests';
import { RedpandaConsumer } from '@mcv/infra/redpanda';
import { db } from '@mcv/core/db';
import { eq, and, sql } from 'drizzle-orm';
import {
  questProgress,
  questObjectiveProgress,
  questObjectives,
} from '@mcv/engagement/quests/schemas';

/**
 * The ObjectiveTrackingConsumer processes user action events
 * and updates quest progress in real-time.
 */
class ObjectiveTrackingConsumer {
  private objectiveIndex: Map<string, Map<string, QuestObjective[]>> = new Map();
  // Map<tenantId, Map<eventType, QuestObjective[]>>

  constructor(
    private consumer: RedpandaConsumer,
    private database: typeof db,
  ) {}

  async start() {
    // Build in-memory index of active objectives
    await this.refreshObjectiveIndex();

    // Subscribe to user action events
    await this.consumer.subscribe('user.actions', async (event) => {
      await this.processEvent(event);
    });

    // Refresh index periodically (every 60 seconds)
    setInterval(() => this.refreshObjectiveIndex(), 60_000);
  }

  private async processEvent(event: UserActionEvent) {
    const { tenantId, userId, type: eventType, payload } = event;

    // Look up objectives that care about this event type
    const tenantObjectives = this.objectiveIndex.get(tenantId);
    if (!tenantObjectives) return;

    const matchingObjectives = tenantObjectives.get(eventType);
    if (!matchingObjectives?.length) return;

    // For each matching objective, check if the user has an active quest
    for (const objective of matchingObjectives) {
      await this.evaluateObjective(objective, userId, tenantId, payload);
    }
  }

  private async evaluateObjective(
    objective: QuestObjective,
    userId: string,
    tenantId: string,
    payload: Record<string, unknown>,
  ) {
    // Check event filter match
    if (objective.eventFilter && !this.matchesFilter(payload, objective.eventFilter)) {
      return;
    }

    // Find active progress record for this user and quest
    const progress = await this.database
      .select()
      .from(questProgress)
      .where(and(
        eq(questProgress.questId, objective.questId),
        eq(questProgress.userId, userId),
        eq(questProgress.state, 'in_progress'),
      ))
      .limit(1);

    if (!progress.length) return;

    const progressRecord = progress[0];

    // Atomic progress update within a transaction
    await this.database.transaction(async (tx) => {
      // Get current objective progress (with row lock)
      const [objProgress] = await tx
        .select()
        .from(questObjectiveProgress)
        .where(and(
          eq(questObjectiveProgress.progressId, progressRecord.id),
          eq(questObjectiveProgress.objectiveId, objective.id),
        ))
        .for('update');

      if (!objProgress || objProgress.isComplete) return;

      // Evaluate based on objective type
      const update = this.calculateProgressUpdate(
        objective,
        objProgress,
        payload,
      );

      if (!update) return;

      // Apply the update
      await tx
        .update(questObjectiveProgress)
        .set({
          currentValue: update.newValue,
          collectedItems: update.collectedItems ?? objProgress.collectedItems,
          isComplete: update.isComplete,
          completedAt: update.isComplete ? new Date() : null,
          updatedAt: new Date(),
        })
        .where(eq(questObjectiveProgress.id, objProgress.id));

      // If objective is now complete, check if ALL required objectives are done
      if (update.isComplete) {
        await this.checkQuestCompletion(tx, progressRecord);
      }

      // Emit progress event
      await this.emitProgressEvent({
        questId: objective.questId,
        objectiveId: objective.id,
        userId,
        tenantId,
        currentValue: update.newValue,
        targetValue: objective.targetValue,
        isComplete: update.isComplete,
      });
    });
  }

  private calculateProgressUpdate(
    objective: QuestObjective,
    current: ObjectiveProgressRecord,
    payload: Record<string, unknown>,
  ): ProgressUpdate | null {
    switch (objective.objectiveType) {
      case 'EVENT_COUNT': {
        const newValue = current.currentValue + 1;
        return {
          newValue,
          isComplete: newValue >= objective.targetValue,
        };
      }

      case 'THRESHOLD': {
        const value = this.extractValue(payload, objective.trackingField ?? 'value');
        if (typeof value !== 'number') return null;
        const newValue = Math.max(current.currentValue, value);
        return {
          newValue,
          isComplete: newValue >= objective.targetValue,
        };
      }

      case 'COLLECTION':
      case 'EXPLORATION':
      case 'SOCIAL': {
        const itemId = this.extractValue(payload, objective.trackingField!);
        if (!itemId) return null;
        const items = current.collectedItems as string[];
        if (items.includes(String(itemId))) return null; // Already collected
        const newItems = [...items, String(itemId)];
        return {
          newValue: newItems.length,
          collectedItems: newItems,
          isComplete: newItems.length >= objective.targetValue,
        };
      }

      case 'CUSTOM': {
        // Custom evaluators are sandboxed functions
        const result = this.runCustomEvaluator(objective.customEvaluator!, payload, current);
        return result;
      }

      default:
        return null;
    }
  }

  private async checkQuestCompletion(
    tx: Transaction,
    progressRecord: QuestProgressRecord,
  ) {
    // Count incomplete required objectives
    const incompleteCount = await tx
      .select({ count: sql<number>`count(*)` })
      .from(questObjectiveProgress)
      .innerJoin(questObjectives, eq(questObjectiveProgress.objectiveId, questObjectives.id))
      .where(and(
        eq(questObjectiveProgress.progressId, progressRecord.id),
        eq(questObjectiveProgress.isComplete, false),
        eq(questObjectives.optional, false), // Only required objectives
      ));

    if (incompleteCount[0].count === 0) {
      // All required objectives complete — transition quest to COMPLETED
      await tx
        .update(questProgress)
        .set({
          state: 'completed',
          completedAt: new Date(),
          completionTimeSeconds: sql`EXTRACT(EPOCH FROM (now() - started_at))::integer`,
          updatedAt: new Date(),
        })
        .where(eq(questProgress.id, progressRecord.id));

      // Emit quest completed event
      await this.emitQuestCompletedEvent(progressRecord);
    }
  }
}
```

### Example 3 — Quest Chain with Branching Paths

Create a story quest chain where player choices determine which quests they encounter next.

```typescript
import { QuestChainService, QuestService } from '@mcv/engagement/quests';

async function createMysteryStoryline(ctx: TRPCContext) {
  const questService = new QuestService(ctx);
  const chainService = new QuestChainService(ctx);

  // Create the individual quests first
  const chapter1 = await questService.createQuest({
    slug: 'mystery-ch1-arrival',
    title: 'Chapter 1: The Arrival',
    description: 'You arrive at the mysterious village. Something feels off...',
    type: 'story',
    difficulty: 'easy',
    category: 'mystery-storyline',
  });

  const chapter2a = await questService.createQuest({
    slug: 'mystery-ch2-investigate',
    title: 'Chapter 2A: Investigate the Manor',
    description: 'You chose to investigate the old manor on the hill.',
    type: 'story',
    difficulty: 'medium',
    category: 'mystery-storyline',
  });

  const chapter2b = await questService.createQuest({
    slug: 'mystery-ch2-tavern',
    title: 'Chapter 2B: Visit the Tavern',
    description: 'You chose to gather information at the local tavern.',
    type: 'story',
    difficulty: 'medium',
    category: 'mystery-storyline',
  });

  const chapter3 = await questService.createQuest({
    slug: 'mystery-ch3-revelation',
    title: 'Chapter 3: The Revelation',
    description: 'Both paths converge as the truth is revealed...',
    type: 'story',
    difficulty: 'hard',
    category: 'mystery-storyline',
  });

  // Create the chain with branching structure
  const chain = await chainService.createChain({
    name: 'The Village Mystery',
    description: 'Uncover the dark secret hidden in the remote village.',
    category: 'mystery-storyline',
    bannerImage: '/images/quests/mystery-banner.jpg',
    previewable: true,

    structure: {
      entryPoints: [chapter1.id],
      nodes: [
        { questId: chapter1.id, position: { x: 300, y: 100 }, isTerminal: false },
        { questId: chapter2a.id, position: { x: 150, y: 300 }, isTerminal: false },
        { questId: chapter2b.id, position: { x: 450, y: 300 }, isTerminal: false },
        { questId: chapter3.id, position: { x: 300, y: 500 }, isTerminal: true },
      ],
      edges: [
        // Chapter 1 → Chapter 2A (if user chose "investigate")
        {
          fromQuestId: chapter1.id,
          toQuestId: chapter2a.id,
          label: 'Investigate the Manor',
          condition: {
            type: 'choice',
            params: { choiceId: 'investigate_manor' },
          },
        },
        // Chapter 1 → Chapter 2B (if user chose "tavern")
        {
          fromQuestId: chapter1.id,
          toQuestId: chapter2b.id,
          label: 'Visit the Tavern',
          condition: {
            type: 'choice',
            params: { choiceId: 'visit_tavern' },
          },
        },
        // Both chapter 2s → Chapter 3 (unconditional)
        {
          fromQuestId: chapter2a.id,
          toQuestId: chapter3.id,
          label: null,
          condition: null,
        },
        {
          fromQuestId: chapter2b.id,
          toQuestId: chapter3.id,
          label: null,
          condition: null,
        },
      ],
    },

    // Bonus reward for completing the entire chain
    chainCompletionReward: {
      rewardType: 'ACHIEVEMENT',
      referenceId: 'mystery-solver',
      displayName: 'Mystery Solver Achievement',
      amount: null,
      isBonus: false,
    },
  });

  // Link quests to the chain
  await questService.updateQuest(chapter1.id, { chainId: chain.id, chainPosition: 0 });
  await questService.updateQuest(chapter2a.id, { chainId: chain.id, chainPosition: 1 });
  await questService.updateQuest(chapter2b.id, { chainId: chain.id, chainPosition: 1 });
  await questService.updateQuest(chapter3.id, {
    chainId: chain.id,
    chainPosition: 2,
    prerequisiteQuestIds: [chapter2a.id, chapter2b.id], // Either prerequisite satisfies
  });

  // Publish all quests
  for (const quest of [chapter1, chapter2a, chapter2b, chapter3]) {
    await questService.publishQuest(quest.id);
  }

  return chain;
}
```

### Example 4 — Daily Quest Pool & Auto-Assignment

Configure a daily quest pool and demonstrate the scheduler's selection and assignment process.

```typescript
import {
  DailyQuestService,
  DailyQuestScheduler,
} from '@mcv/engagement/quests';

// ── Step 1: Create a daily quest pool ─────────────────────────

async function setupDailyPool(ctx: TRPCContext) {
  const dailyService = new DailyQuestService(ctx);

  // First, create several daily-type quests (abbreviated)
  const questIds = [
    'quest_daily_post_3',      // Make 3 posts
    'quest_daily_comment_5',   // Leave 5 comments
    'quest_daily_like_10',     // Like 10 things
    'quest_daily_share_2',     // Share 2 posts
    'quest_daily_react_15',    // React to 15 posts
    'quest_daily_visit_3',     // Visit 3 different sections
    'quest_daily_follow_1',    // Follow 1 new person
    'quest_daily_streak_login', // Log in (streak builder)
    'quest_daily_create_poll', // Create a poll
    'quest_daily_read_5',      // Read 5 articles
  ];

  const pool = await dailyService.createPool({
    name: 'Standard Dailies',
    description: 'General-purpose daily quests for all users',
    questIds,
    selectCount: 3, // Pick 3 quests each day
    selectionStrategy: 'adaptive',
    adaptiveConfig: {
      completionRateWeight: 0.6,    // Favor quests people complete
      recencyDecay: 0.3,            // Reduce weight for recently assigned
      minRepeatDays: 3,             // Don't repeat a quest within 3 days
    },
    minLevel: null,   // Available to all levels
    maxLevel: null,
  });

  console.log(`Created daily pool "${pool.name}" with ${questIds.length} quests`);
  return pool;
}

// ── Step 2: Scheduler runs at midnight per tenant timezone ────

class DailyQuestSchedulerImpl {
  constructor(
    private dailyService: DailyQuestService,
    private db: Database,
  ) {}

  /**
   * Called by the cron trigger for each tenant whose midnight has arrived.
   */
  async runForTenant(tenantId: string) {
    console.log(`[DailyReset] Running for tenant ${tenantId}`);

    // 1. Get active pools for this tenant
    const pools = await this.dailyService.getActivePools(tenantId);

    for (const pool of pools) {
      // 2. Select quests using the pool's strategy
      const selectedQuestIds = await this.selectQuests(pool);

      console.log(`[DailyReset] Pool "${pool.name}": selected ${selectedQuestIds.join(', ')}`);

      // 3. Create tenant-wide assignments (all users get the same dailies)
      const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

      for (const questId of selectedQuestIds) {
        await this.dailyService.createAssignment({
          tenantId,
          userId: null, // Tenant-wide
          poolId: pool.id,
          questId,
          assignmentDate: today,
        });
      }

      // 4. Emit assignment events for push notifications
      await this.dailyService.emitAssignmentEvents(tenantId, selectedQuestIds);
    }

    // 5. Update streak data
    await this.updateStreaks(tenantId);

    console.log(`[DailyReset] Completed for tenant ${tenantId}`);
  }

  private async selectQuests(pool: DailyQuestPool): Promise<string[]> {
    switch (pool.selectionStrategy) {
      case 'random':
        return this.selectRandom(pool.questIds, pool.selectCount);

      case 'weighted':
        return this.selectWeighted(pool.questIds, pool.weights!, pool.selectCount);

      case 'round_robin':
        return this.selectRoundRobin(pool);

      case 'adaptive':
        return this.selectAdaptive(pool);

      default:
        return this.selectRandom(pool.questIds, pool.selectCount);
    }
  }

  private async selectAdaptive(pool: DailyQuestPool): Promise<string[]> {
    const config = pool.adaptiveConfig!;

    // Get completion rates for each quest in the pool (last 30 days)
    const completionRates = await this.dailyService.getCompletionRates(
      pool.id,
      pool.questIds,
      30,
    );

    // Get recent assignment history
    const recentAssignments = await this.dailyService.getRecentAssignments(
      pool.id,
      config.minRepeatDays,
    );

    // Score each quest
    const scores = pool.questIds.map((questId) => {
      let score = 1.0;

      // Boost quests with high completion rates
      const rate = completionRates.get(questId) ?? 0.5;
      score += rate * config.completionRateWeight;

      // Penalize recently assigned quests
      const daysSinceAssigned = recentAssignments.get(questId) ?? Infinity;
      if (daysSinceAssigned < config.minRepeatDays) {
        score = 0; // Exclude entirely
      } else {
        score *= (1 - config.recencyDecay / daysSinceAssigned);
      }

      return { questId, score };
    });

    // Weighted random selection from scored quests
    return this.weightedSample(
      scores.filter((s) => s.score > 0),
      pool.selectCount,
    );
  }

  private async updateStreaks(tenantId: string) {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    // Find users who completed all daily quests yesterday
    const completers = await this.dailyService.getCompleters(tenantId, yesterdayStr);

    for (const userId of completers) {
      await this.dailyService.incrementStreak(tenantId, userId, 'daily');
    }

    // Find users who did NOT complete — break their streak
    const nonCompleters = await this.dailyService.getNonCompleters(tenantId, yesterdayStr);

    for (const userId of nonCompleters) {
      // Check for active streak freeze
      const hasFrozen = await this.dailyService.consumeStreakFreeze(tenantId, userId);
      if (!hasFrozen) {
        await this.dailyService.resetStreak(tenantId, userId, 'daily');
      }
    }
  }
}
```

### Example 5 — Claiming Rewards with Bonus Modifiers

Complete flow from quest completion through reward calculation and distribution.

```typescript
import {
  QuestRewardService,
  QuestProgressService,
  QUEST_STREAK_BONUS_TABLE,
  QUEST_DIFFICULTY_XP_MULTIPLIERS,
} from '@mcv/engagement/quests';
import { EconomyService } from '@mcv/engagement/economy';

class QuestRewardServiceImpl implements QuestRewardService {
  constructor(
    private db: Database,
    private economyService: EconomyService,
    private progressService: QuestProgressService,
  ) {}

  /**
   * Claim rewards for a completed quest.
   * Calculates bonus multipliers and distributes through economy service.
   */
  async claimRewards(progressId: string, userId: string): Promise<QuestClaim> {
    return this.db.transaction(async (tx) => {
      // 1. Validate progress state
      const progress = await this.progressService.getById(progressId);

      if (!progress) {
        throw new QuestNotFoundError(progressId);
      }
      if (progress.userId !== userId) {
        throw new QuestNotFoundError(progressId); // Don't leak existence
      }
      if (progress.state !== 'completed') {
        throw new QuestNotActiveError(
          `Quest is in state '${progress.state}', expected 'completed'`,
        );
      }

      // Check for existing claim (idempotency)
      const existingClaim = await tx
        .select()
        .from(questClaims)
        .where(eq(questClaims.progressId, progressId))
        .limit(1);

      if (existingClaim.length > 0) {
        throw new RewardAlreadyClaimedError(progressId);
      }

      // 2. Load quest and rewards
      const quest = await this.getQuest(progress.questId);
      const rewards = await this.getRewards(progress.questId);

      // 3. Calculate bonus modifiers
      const modifiers = await this.calculateModifiers(progress, quest, userId);

      // 4. Build granted rewards list
      const grantedRewards: GrantedReward[] = [];
      let totalPointsValue = 0;

      for (const reward of rewards) {
        // Check bonus condition
        if (reward.isBonus && !this.evaluateBonusCondition(reward, progress, modifiers)) {
          continue; // Bonus condition not met — skip
        }

        // Apply multipliers
        let effectiveAmount = reward.amount ?? 0;

        if (reward.rewardType === 'XP') {
          effectiveAmount = Math.floor(
            effectiveAmount
            * modifiers.difficultyMultiplier
            * modifiers.streakMultiplier,
          );
        } else if (reward.rewardType === 'POINTS' || reward.rewardType === 'TOKENS') {
          effectiveAmount = Math.floor(
            effectiveAmount * modifiers.streakMultiplier,
          );
        }

        grantedRewards.push({
          rewardId: reward.id,
          rewardType: reward.rewardType,
          amount: effectiveAmount,
          referenceId: reward.referenceId,
          displayName: reward.displayName,
          wasBonus: reward.isBonus,
          multiplierApplied: modifiers.streakMultiplier,
        });

        totalPointsValue += effectiveAmount;
      }

      // 5. Create the claim record
      const [claim] = await tx
        .insert(questClaims)
        .values({
          progressId,
          questId: progress.questId,
          userId,
          tenantId: progress.tenantId,
          grantedRewards,
          totalPointsValue,
          streakMultiplier: modifiers.streakMultiplier,
          speedBonusApplied: modifiers.speedBonusApplied,
          firstCompletion: modifiers.isFirstCompletion,
          confirmed: false, // Will be confirmed after economy service processes
        })
        .returning();

      // 6. Transition progress to CLAIMED
      await tx
        .update(questProgress)
        .set({
          state: 'claimed',
          claimedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(questProgress.id, progressId));

      // 7. Increment quest completion count
      await tx
        .update(quests)
        .set({
          completionCount: sql`completion_count + 1`,
          updatedAt: new Date(),
        })
        .where(eq(quests.id, progress.questId));

      // 8. Dispatch reward grants to economy service (async)
      await this.dispatchRewardGrants(claim, grantedRewards);

      // 9. Emit reward claimed event
      await this.emitRewardClaimedEvent({
        claimId: claim.id,
        questId: progress.questId,
        userId,
        tenantId: progress.tenantId,
        totalPointsValue,
        grantedRewards,
      });

      return claim;
    });
  }

  private async calculateModifiers(
    progress: QuestProgress,
    quest: Quest,
    userId: string,
  ): Promise<RewardModifiers> {
    // Streak multiplier
    const streakInfo = await this.progressService.getStreakInfo(userId);
    const streakMultiplier = this.getStreakMultiplier(streakInfo.daily.currentStreak);

    // Difficulty XP multiplier
    const difficultyMultiplier = QUEST_DIFFICULTY_XP_MULTIPLIERS[quest.difficulty] ?? 1.0;
    // { trivial: 0.5, easy: 0.75, medium: 1.0, hard: 1.5, epic: 2.0, legendary: 3.0 }

    // Speed bonus check
    const completionTime = progress.completionTimeSeconds ?? Infinity;
    const speedBonusApplied = completionTime < (quest.estimatedMinutes ?? Infinity) * 30;
    // Under 50% of estimated time = speed bonus

    // First completion check
    const previousClaims = await this.db
      .select({ count: sql<number>`count(*)` })
      .from(questClaims)
      .where(and(
        eq(questClaims.questId, quest.id),
        eq(questClaims.userId, userId),
      ));
    const isFirstCompletion = previousClaims[0].count === 0;

    return {
      streakMultiplier,
      difficultyMultiplier,
      speedBonusApplied,
      isFirstCompletion,
    };
  }

  private getStreakMultiplier(streakDays: number): number {
    // Binary search through streak bonus table
    for (let i = QUEST_STREAK_BONUS_TABLE.length - 1; i >= 0; i--) {
      if (streakDays >= QUEST_STREAK_BONUS_TABLE[i].minDays) {
        return QUEST_STREAK_BONUS_TABLE[i].multiplier;
      }
    }
    return 1.0;
  }

  private evaluateBonusCondition(
    reward: QuestReward,
    progress: QuestProgress,
    modifiers: RewardModifiers,
  ): boolean {
    const condition = reward.bonusCondition;
    if (!condition) return true;

    switch (condition.type) {
      case 'speed':
        return (progress.completionTimeSeconds ?? Infinity) < (condition.parTimeSeconds ?? Infinity);
      case 'first_completion':
        return modifiers.isFirstCompletion;
      case 'difficulty':
        return true; // Always granted for difficulty bonus type
      case 'streak':
        return modifiers.streakMultiplier >= (condition.params.minMultiplier as number ?? 1.5);
      case 'no_hints':
        return !(progress.checkpoint as any)?.hintsUsed;
      case 'perfect':
        // All optional objectives also completed
        return this.allObjectivesComplete(progress);
      default:
        return false;
    }
  }
}
```

### Example 6 — Party Quest with Contribution Tracking

Create and manage a party quest where guild members collaborate on shared objectives.

```typescript
import {
  PartyQuestService,
  QuestService,
} from '@mcv/engagement/quests';

async function runPartyQuestFlow(ctx: TRPCContext) {
  const questService = new QuestService(ctx);
  const partyService = new PartyQuestService(ctx);

  // ── Step 1: Create a party-type quest ──────────────────────

  const quest = await questService.createQuest({
    slug: 'guild-dungeon-raid',
    title: 'Dungeon Raid: The Crystal Caverns',
    description: 'Your guild must work together to conquer the Crystal Caverns. Each member contributes to shared objectives.',
    type: 'party',
    difficulty: 'epic',
    category: 'guild-raids',
    estimatedMinutes: 120,
    deadlineSeconds: 7 * 24 * 60 * 60, // 7-day deadline
  });

  // Add shared objectives
  await questService.addObjective(quest.id, {
    title: 'Defeat 100 Crystal Golems',
    description: 'The guild collectively must defeat 100 golems',
    objectiveType: 'EVENT_COUNT',
    eventType: 'combat.enemy_defeated',
    eventFilter: { 'payload.enemyType': 'crystal_golem' },
    targetValue: 100,
    position: 0,
  });

  await questService.addObjective(quest.id, {
    title: 'Collect 50 Crystal Shards',
    description: 'Gather crystal shards dropped throughout the caverns',
    objectiveType: 'COLLECTION',
    eventType: 'inventory.item_collected',
    eventFilter: { 'payload.itemType': 'crystal_shard' },
    trackingField: 'payload.itemId',
    targetValue: 50,
    position: 1,
  });

  await questService.addObjective(quest.id, {
    title: 'Explore All 5 Cavern Chambers',
    description: 'At least one member must visit each chamber',
    objectiveType: 'EXPLORATION',
    eventType: 'exploration.area_visited',
    eventFilter: { 'payload.area': { $regex: '^crystal_cavern_' } },
    trackingField: 'payload.area',
    targetValue: 5,
    position: 2,
  });

  // Rewards with proportional distribution
  await questService.addReward(quest.id, {
    rewardType: 'XP',
    amount: 1000,
    displayName: '1000 XP',
    position: 0,
  });

  await questService.addReward(quest.id, {
    rewardType: 'ITEM',
    referenceId: 'crystal_cavern_trophy',
    displayName: 'Crystal Cavern Trophy',
    position: 1,
  });

  await questService.publishQuest(quest.id);

  // ── Step 2: Guild leader creates the party quest instance ──

  const partyQuest = await partyService.createPartyQuest(quest.id, 'user_leader', {
    guildId: 'guild_alpha',
    partyName: 'Alpha Raiders',
    maxMembers: 10,
    minMembers: 3,
    rewardDistribution: 'proportional',
    joinDeadline: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24h to join
  });

  console.log(`Party quest created: ${partyQuest.id} (state: ${partyQuest.state})`);
  // Party quest created: 01HQXYZ... (state: recruiting)

  // ── Step 3: Members join ───────────────────────────────────

  await partyService.joinPartyQuest(partyQuest.id, 'user_member_1');
  await partyService.joinPartyQuest(partyQuest.id, 'user_member_2');
  await partyService.joinPartyQuest(partyQuest.id, 'user_member_3');

  // With 4 members (including leader), min requirement met
  // Party quest auto-transitions to 'in_progress'
  const updatedParty = await partyService.getPartyQuest(partyQuest.id);
  console.log(`Party state: ${updatedParty.state}, members: ${updatedParty.memberIds.length}`);
  // Party state: in_progress, members: 4

  // ── Step 4: Members contribute through normal gameplay ─────

  // Events flow in through Redpanda. The objective tracking consumer
  // recognizes these events belong to a party quest and updates
  // both individual contributions and shared progress.

  // After some gameplay, check contributions:
  const contributions = updatedParty.contributions;

  for (const contrib of contributions) {
    console.log(
      `User ${contrib.userId}: ${contrib.contributionPercent}% ` +
      `(${JSON.stringify(contrib.objectiveContributions)})`,
    );
  }
  // User user_leader: 35% ({golem_kills: 40, shards: 15, chambers: 3})
  // User user_member_1: 25% ({golem_kills: 25, shards: 12, chambers: 2})
  // User user_member_2: 22% ({golem_kills: 20, shards: 13, chambers: 4})
  // User user_member_3: 18% ({golem_kills: 15, shards: 10, chambers: 1})

  // ── Step 5: Quest completes, rewards distributed ───────────

  // When all shared objectives are met, the party quest transitions to 'completed'.
  // Each member claims their proportional share:

  const leaderClaim = await partyService.claimPartyReward(partyQuest.id, 'user_leader');
  console.log(`Leader reward: ${leaderClaim.grantedRewards[0].amount} XP (35% of 1000)`);
  // Leader reward: 350 XP (35% of 1000)

  // For non-numeric rewards (items, achievements), all members receive them
  // regardless of contribution percentage (configurable per quest).
}
```

### Example 7 — Quest Board with ML Recommendations

Generate a personalized quest board with ML-driven recommendations.

```typescript
import {
  QuestBoardService,
  QuestRecommendationService,
  QuestService,
  QuestProgressService,
  DailyQuestService,
} from '@mcv/engagement/quests';

class QuestBoardServiceImpl implements QuestBoardService {
  constructor(
    private questService: QuestService,
    private progressService: QuestProgressService,
    private dailyService: DailyQuestService,
    private recommendationService: QuestRecommendationService,
    private db: Database,
  ) {}

  /**
   * Generate a personalized quest board for a user.
   * Combines active quests, available quests, recommendations,
   * and streak information.
   */
  async getQuestBoard(
    userId: string,
    options: QuestBoardOptions = {},
  ): Promise<QuestBoard> {
    const tenantId = this.getTenantId();

    // Run queries in parallel for performance
    const [
      activeProgress,
      completedProgress,
      availableQuests,
      dailyAssignments,
      weeklyAssignments,
      chainSummaries,
      partyQuestsRaw,
      streakInfo,
      recommendations,
    ] = await Promise.all([
      // Active quests (in_progress)
      this.progressService.getByState(userId, 'in_progress'),
      // Completed but unclaimed
      this.progressService.getByState(userId, 'completed'),
      // All active quests the user hasn't started
      this.questService.getAvailableForUser(userId, {
        category: options.category,
        difficulty: options.difficulty,
        limit: options.limit ?? 50,
      }),
      // Today's daily assignments
      this.dailyService.getDailyAssignments(userId),
      // This week's weekly assignments
      this.dailyService.getWeeklyAssignments(userId),
      // Chain progress summaries
      this.getChainSummaries(userId),
      // Party quests
      this.getPartyQuests(userId),
      // Streak info
      this.progressService.getStreakInfo(userId),
      // ML recommendations
      this.recommendationService.getRecommendations(userId, 20),
    ]);

    // Build recommendation score map
    const recScoreMap = new Map(
      recommendations.map((r) => [r.questId, r]),
    );

    // Build board entries for available quests
    const availableEntries: QuestBoardEntry[] = availableQuests.map((quest) => {
      const rec = recScoreMap.get(quest.id);
      return {
        quest,
        progress: null,
        objectives: quest.objectives.map((obj) => ({
          objective: obj,
          currentValue: 0,
          targetValue: obj.targetValue,
          percentComplete: 0,
          isComplete: false,
          currentHint: null,
        })),
        rewards: quest.rewards,
        recommendationScore: rec?.score ?? null,
        recommendationReason: rec?.reason ?? null,
        isNew: this.isNewQuest(quest, userId),
        timeRemainingSeconds: quest.endDate
          ? Math.max(0, (quest.endDate.getTime() - Date.now()) / 1000)
          : null,
      };
    });

    // Sort available quests: recommended first, then by difficulty
    availableEntries.sort((a, b) => {
      const scoreA = a.recommendationScore ?? 0;
      const scoreB = b.recommendationScore ?? 0;
      return scoreB - scoreA;
    });

    // Build active quest entries with live progress
    const activeEntries = await Promise.all(
      activeProgress.map(async (progress) => {
        const quest = await this.questService.getQuest(progress.questId);
        const objProgress = await this.progressService.getObjectiveProgress(progress.id);
        return this.buildBoardEntry(quest!, progress, objProgress);
      }),
    );

    // Featured quests: top recommendations the user hasn't started
    const featuredEntries = availableEntries
      .filter((e) => (e.recommendationScore ?? 0) > 0.7)
      .slice(0, 3);

    return {
      userId,
      tenantId,
      activeQuests: activeEntries,
      availableQuests: availableEntries,
      completedQuests: await this.buildCompletedEntries(completedProgress),
      featuredQuests: featuredEntries,
      dailyQuests: await this.buildDailyEntries(dailyAssignments, userId),
      weeklyQuests: await this.buildDailyEntries(weeklyAssignments, userId),
      chains: chainSummaries,
      partyQuests: partyQuestsRaw,
      dailyStreak: streakInfo.daily,
      weeklyStreak: streakInfo.weekly,
      generatedAt: new Date(),
    };
  }

  private buildBoardEntry(
    quest: Quest,
    progress: QuestProgress,
    objProgress: ObjectiveProgressRecord[],
  ): QuestBoardEntry {
    return {
      quest,
      progress,
      objectives: objProgress.map((op) => {
        const pct = Math.min(100, Math.floor((op.currentValue / op.targetValue) * 100));
        const hint = this.getHintForProgress(op.objective, pct);
        return {
          objective: op.objective,
          currentValue: op.currentValue,
          targetValue: op.targetValue,
          percentComplete: pct,
          isComplete: op.isComplete,
          currentHint: hint,
        };
      }),
      rewards: quest.rewards,
      recommendationScore: null,
      recommendationReason: null,
      isNew: false,
      timeRemainingSeconds: progress.deadline
        ? Math.max(0, (progress.deadline.getTime() - Date.now()) / 1000)
        : null,
    };
  }
}
```
### Example 8 - Quest Analytics — Completion Rates & Drop-Off Analysis

Analyzing quest completion funnels, identifying where players abandon quests, and surfacing actionable insights for quest designers.

```typescript
// ============================================================
// Quest Analytics — Completion Rates & Drop-Off Analysis
// ============================================================
import { db } from '@mcv/kernel';
import {
  quests,
  questProgress,
  objectiveProgress,
  questObjectives,
} from '../schema';
import { eq, and, gte, lte, sql, count, avg, desc } from 'drizzle-orm';
import { TenantContext } from '@mcv/kernel';
import { subDays, startOfDay, endOfDay, format } from 'date-fns';

// ---- Types ----------------------------------------------------------------

interface QuestCompletionStats {
  questId: string;
  questTitle: string;
  questType: string;
  totalStarted: number;
  totalCompleted: number;
  totalAbandoned: number;
  totalExpired: number;
  completionRate: number;
  avgCompletionTimeMs: number | null;
  medianCompletionTimeMs: number | null;
}

interface ObjectiveDropOff {
  questId: string;
  objectiveId: string;
  objectiveTitle: string;
  orderIndex: number;
  playersReached: number;
  playersCompleted: number;
  dropOffRate: number;
  avgTimeSpentMs: number | null;
}

interface QuestFunnelReport {
  quest: QuestCompletionStats;
  objectiveDropOffs: ObjectiveDropOff[];
  bottleneckObjectiveId: string | null;
  recommendations: string[];
}

interface AnalyticsDateRange {
  from: Date;
  to: Date;
}

// ---- Completion Rate Calculator -------------------------------------------

export class QuestAnalyticsService {
  constructor(private readonly tenantContext: TenantContext) {}

  /**
   * Get completion statistics for all quests in a date range.
   */
  async getCompletionStats(
    range: AnalyticsDateRange,
    options?: { questType?: string; minStarted?: number },
  ): Promise<QuestCompletionStats[]> {
    const { tenantId } = this.tenantContext;
    const minStarted = options?.minStarted ?? 10;

    const results = await db
      .select({
        questId: questProgress.questId,
        questTitle: quests.title,
        questType: quests.questType,
        totalStarted: count().as('total_started'),
        totalCompleted: sql<number>
          COUNT(*) FILTER (WHERE ${questProgress.status} = 'completed')
        .as('total_completed'),
        totalAbandoned: sql<number>
          COUNT(*) FILTER (WHERE ${questProgress.status} = 'abandoned')
        .as('total_abandoned'),
        totalExpired: sql<number>
          COUNT(*) FILTER (WHERE ${questProgress.status} = 'expired')
        .as('total_expired'),
        avgCompletionTimeMs: sql<number | null>
          AVG(
            EXTRACT(EPOCH FROM (${questProgress.completedAt} - ${questProgress.startedAt})) * 1000
          ) FILTER (WHERE ${questProgress.status} = 'completed')
        .as('avg_completion_time'),
      })
      .from(questProgress)
      .innerJoin(quests, eq(quests.id, questProgress.questId))
      .where(
        and(
          eq(questProgress.tenantId, tenantId),
          gte(questProgress.startedAt, range.from),
          lte(questProgress.startedAt, range.to),
          options?.questType ? eq(quests.questType, options.questType) : undefined,
        ),
      )
      .groupBy(questProgress.questId, quests.title, quests.questType)
      .having(sqlCOUNT(*) >= ${minStarted}`)
      .orderBy(desc(sql	otal_started));

    return results.map((r) => ({
      ...r,
      completionRate:
        r.totalStarted > 0
          ? Math.round((r.totalCompleted / r.totalStarted) * 10000) / 100
          : 0,
      medianCompletionTimeMs: null, // Computed separately for performance
    }));
  }

  /**
   * Build a drop-off funnel for a specific quest's objectives.
   */
  async getObjectiveDropOff(
    questId: string,
    range: AnalyticsDateRange,
  ): Promise<ObjectiveDropOff[]> {
    const { tenantId } = this.tenantContext;

    // Get all objectives for this quest in order
    const objectives = await db
      .select()
      .from(questObjectives)
      .where(
        and(
          eq(questObjectives.tenantId, tenantId),
          eq(questObjectives.questId, questId),
        ),
      )
      .orderBy(questObjectives.orderIndex);

    if (objectives.length === 0) return [];

    // Get player counts at each objective stage
    const progressData = await db
      .select({
        objectiveId: objectiveProgress.objectiveId,
        playersReached: count().as('players_reached'),
        playersCompleted: sql<number>
          COUNT(*) FILTER (WHERE ${objectiveProgress.isComplete} = true)
        .as('players_completed'),
        avgTimeSpentMs: sql<number | null>
          AVG(
            EXTRACT(EPOCH FROM (${objectiveProgress.completedAt} - ${objectiveProgress.startedAt})) * 1000
          ) FILTER (WHERE ${objectiveProgress.isComplete} = true)
        .as('avg_time_spent'),
      })
      .from(objectiveProgress)
      .innerJoin(
        questProgress,
        and(
          eq(questProgress.id, objectiveProgress.questProgressId),
          eq(questProgress.tenantId, tenantId),
          gte(questProgress.startedAt, range.from),
          lte(questProgress.startedAt, range.to),
        ),
      )
      .where(eq(objectiveProgress.questId, questId))
      .groupBy(objectiveProgress.objectiveId);

    const progressMap = new Map(progressData.map((p) => [p.objectiveId, p]));

    return objectives.map((obj, idx) => {
      const data = progressMap.get(obj.id);
      const reached = data?.playersReached ?? 0;
      const completed = data?.playersCompleted ?? 0;

      return {
        questId,
        objectiveId: obj.id,
        objectiveTitle: obj.title,
        orderIndex: idx,
        playersReached: reached,
        playersCompleted: completed,
        dropOffRate: reached > 0
          ? Math.round(((reached - completed) / reached) * 10000) / 100
          : 0,
        avgTimeSpentMs: data?.avgTimeSpentMs ?? null,
      };
    });
  }

  /**
   * Generate a full funnel report with bottleneck detection and recommendations.
   */
  async generateFunnelReport(
    questId: string,
    range: AnalyticsDateRange,
  ): Promise<QuestFunnelReport> {
    const [statsArray, dropOffs] = await Promise.all([
      this.getCompletionStats(range, { minStarted: 1 }),
      this.getObjectiveDropOff(questId, range),
    ]);

    const quest = statsArray.find((s) => s.questId === questId);
    if (!quest) {
      throw new Error('Quest not found or no data in range');
    }

    // Find the biggest bottleneck — objective with highest drop-off
    let bottleneckObjectiveId: string | null = null;
    let maxDropOff = 0;
    for (const obj of dropOffs) {
      if (obj.dropOffRate > maxDropOff && obj.playersReached >= 5) {
        maxDropOff = obj.dropOffRate;
        bottleneckObjectiveId = obj.objectiveId;
      }
    }

    // Generate recommendations
    const recommendations = this.generateRecommendations(quest, dropOffs, bottleneckObjectiveId);

    return {
      quest,
      objectiveDropOffs: dropOffs,
      bottleneckObjectiveId,
      recommendations,
    };
  }

  /**
   * Auto-generate improvement recommendations based on analytics.
   */
  private generateRecommendations(
    stats: QuestCompletionStats,
    dropOffs: ObjectiveDropOff[],
    bottleneckId: string | null,
  ): string[] {
    const recs: string[] = [];

    // Low completion rate
    if (stats.completionRate < 20) {
      recs.push(
        'CRITICAL: Completion rate below 20%. Consider reducing difficulty or number of objectives.',
      );
    } else if (stats.completionRate < 50) {
      recs.push(
        'WARNING: Completion rate below 50%. Review objective difficulty curve.',
      );
    }

    // High abandonment
    const abandonRate =
      stats.totalStarted > 0
        ? (stats.totalAbandoned / stats.totalStarted) * 100
        : 0;
    if (abandonRate > 30) {
      recs.push(
        High abandonment rate (${abandonRate.toFixed(1)}%). Players may find the quest unengaging or too long.,
      );
    }

    // High expiration
    const expireRate =
      stats.totalStarted > 0
        ? (stats.totalExpired / stats.totalStarted) * 100
        : 0;
    if (expireRate > 25) {
      recs.push(
        High expiration rate (${expireRate.toFixed(1)}%). Consider extending the time limit.,
      );
    }

    // Bottleneck-specific
    if (bottleneckId) {
      const bottleneck = dropOffs.find((d) => d.objectiveId === bottleneckId);
      if (bottleneck) {
        recs.push(
          Bottleneck at objective "${bottleneck.objectiveTitle}" (step ${bottleneck.orderIndex + 1}): ${bottleneck.dropOffRate}% drop-off. Consider adding hints or reducing target value.,
        );
      }
    }

    // First-objective drop-off (onboarding issue)
    if (dropOffs.length > 0 && dropOffs[0].dropOffRate > 40) {
      recs.push(
        'High first-objective drop-off. Players may not understand what to do. Add a tutorial hint or clearer description.',
      );
    }

    // Avg completion time too high
    if (
      stats.avgCompletionTimeMs &&
      stats.questType === 'daily' &&
      stats.avgCompletionTimeMs > 3600000
    ) {
      recs.push(
        'Daily quest average completion time exceeds 1 hour. Daily quests should be completable in 15-30 minutes.',
      );
    }

    if (recs.length === 0) {
      recs.push('Quest is performing well. No immediate action needed.');
    }

    return recs;
  }

  /**
   * Get trending quests — highest engagement in recent period.
   */
  async getTrendingQuests(
    days: number = 7,
    limit: number = 10,
  ): Promise<Array<{ questId: string; title: string; starts: number; completionRate: number }>> {
    const range: AnalyticsDateRange = {
      from: startOfDay(subDays(new Date(), days)),
      to: endOfDay(new Date()),
    };

    const stats = await this.getCompletionStats(range, { minStarted: 5 });
    return stats
      .sort((a, b) => b.totalStarted - a.totalStarted)
      .slice(0, limit)
      .map((s) => ({
        questId: s.questId,
        title: s.questTitle,
        starts: s.totalStarted,
        completionRate: s.completionRate,
      }));
  }
}

// ---- Usage ----------------------------------------------------------------

const analytics = new QuestAnalyticsService(tenantContext);

// Get completion stats for all daily quests last 30 days
const dailyStats = await analytics.getCompletionStats(
  { from: subDays(new Date(), 30), to: new Date() },
  { questType: 'daily', minStarted: 20 },
);
console.log('Daily quest stats:', dailyStats);

// Full funnel report for a specific quest
const report = await analytics.generateFunnelReport(
  'quest_abc123',
  { from: subDays(new Date(), 14), to: new Date() },
);
console.log('Funnel report:', report);
console.log('Bottleneck:', report.bottleneckObjectiveId);
console.log('Recommendations:', report.recommendations);

// Trending quests this week
const trending = await analytics.getTrendingQuests(7, 5);
console.log('Trending:', trending);
```

---

## Error Codes

All errors in @mcv/engagement/quests use the QST_ prefix and extend the base DomainError class from @mcv/kernel. Error codes are grouped by functional area for easy diagnosis.

### Quest Lifecycle Errors (QST_001 — QST_008)

| Code | Name | HTTP | Description |
|------|------|------|-------------|
| QST_001 | QUEST_NOT_FOUND | 404 | Quest does not exist or is not visible in the current tenant. Verify the quest ID and tenant context. |
| QST_002 | QUEST_ALREADY_STARTED | 409 | Player has already started this quest. Use the existing progress record instead of starting again. |
| QST_003 | QUEST_ALREADY_COMPLETED | 409 | Quest has already been completed by this player. Repeated completions are not allowed unless the quest is repeatable. |
| QST_004 | QUEST_NOT_ACTIVE | 400 | Quest is not in an active state (may be draft, archived, or disabled). Only published quests can be started. |
| QST_005 | QUEST_EXPIRED | 410 | Quest deadline has passed. The player can no longer make progress or claim rewards for this quest instance. |
| QST_006 | QUEST_NOT_STARTED | 400 | Cannot update progress on a quest that hasn't been started. Player must accept/start the quest first. |
| QST_007 | QUEST_PROGRESS_NOT_FOUND | 404 | No progress record found for the given player-quest combination. The quest may not have been started. |
| QST_008 | QUEST_VERSION_CONFLICT | 409 | Optimistic concurrency conflict — the quest or progress was modified by another process. Retry the operation. |

### Objective Errors (QST_009 — QST_013)

| Code | Name | HTTP | Description |
|------|------|------|-------------|
| QST_009 | OBJECTIVE_NOT_FOUND | 404 | Objective does not exist on the specified quest. Verify the objective ID belongs to the correct quest. |
| QST_010 | OBJECTIVE_ALREADY_COMPLETE | 409 | This objective has already been fulfilled. No further progress updates will be applied. |
| QST_011 | OBJECTIVE_INVALID_VALUE | 400 | Progress value is invalid (negative, exceeds maximum, or wrong type for the objective kind). |
| QST_012 | OBJECTIVE_PREREQUISITE_NOT_MET | 403 | A prerequisite objective must be completed before this one can receive progress. Check objective ordering. |
| QST_013 | OBJECTIVE_TYPE_MISMATCH | 400 | The event type does not match the objective's expected trigger. A kill event cannot progress a collect objective. |

### Prerequisite & Chain Errors (QST_014 — QST_017)

| Code | Name | HTTP | Description |
|------|------|------|-------------|
| QST_014 | PREREQUISITE_NOT_MET | 403 | One or more prerequisite quests have not been completed. The player must finish required quests first. |
| QST_015 | CHAIN_NOT_FOUND | 404 | Quest chain does not exist or is not published in the current tenant. |
| QST_016 | CHAIN_STEP_INVALID | 400 | Attempted to start a chain step out of order. Chain quests must be completed sequentially (or per branching rules). |
| QST_017 | CHAIN_BROKEN | 500 | Quest chain integrity error — a step references a quest that no longer exists or has been archived. Requires admin repair. |

### Daily/Weekly & Limit Errors (QST_018 — QST_020)

| Code | Name | HTTP | Description |
|------|------|------|-------------|
| QST_018 | DAILY_LIMIT_REACHED | 429 | Player has reached the maximum number of daily quests for this reset period. Resets at the configured daily reset time. |
| QST_019 | WEEKLY_LIMIT_REACHED | 429 | Player has reached the maximum number of weekly quests for this reset period. |
| QST_020 | COOLDOWN_ACTIVE | 429 | Quest is on cooldown for this player. Repeatable quests enforce a minimum interval between completions. |

### Reward Errors (QST_021 — QST_023)

| Code | Name | HTTP | Description |
|------|------|------|-------------|
| QST_021 | REWARD_ALREADY_CLAIMED | 409 | Rewards for this quest have already been claimed. Each quest completion can only be redeemed once. |
| QST_022 | REWARD_CLAIM_FAILED | 500 | Failed to distribute one or more rewards. This is typically a transient error — check downstream services (points, items, achievements). |
| QST_023 | QUEST_NOT_COMPLETE | 400 | Cannot claim rewards — not all required objectives have been completed. Check quest progress before claiming. |

### Party Quest Errors (QST_024 — QST_028)

| Code | Name | HTTP | Description |
|------|------|------|-------------|
| QST_024 | PARTY_FULL | 400 | The party quest has reached its maximum participant count. No additional players can join. |
| QST_025 | PARTY_NOT_FOUND | 404 | Party instance does not exist or the player is not a member. |
| QST_026 | PARTY_ALREADY_JOINED | 409 | Player is already a member of this party quest instance. |
| QST_027 | PARTY_MINIMUM_NOT_MET | 400 | Party does not meet the minimum player requirement to start or complete this quest. |
| QST_028 | PARTY_CONTRIBUTION_INVALID | 400 | Contribution value is invalid or exceeds the remaining quota for this player in the party quest. |

### Quest Board & Admin Errors (QST_029 — QST_032)

| Code | Name | HTTP | Description |
|------|------|------|-------------|
| QST_029 | BOARD_NOT_FOUND | 404 | Quest board does not exist or is not configured for the current tenant. |
| QST_030 | BOARD_SLOT_LIMIT_REACHED | 400 | Quest board has reached the maximum number of active quest slots. Complete or abandon a quest to free a slot. |
| QST_031 | QUEST_PUBLISH_INVALID | 400 | Quest cannot be published — missing required fields (objectives, rewards, or configuration). Validate the quest definition. |
| QST_032 | ADMIN_OVERRIDE_REQUIRED | 403 | This operation requires admin privileges. Player and quest-designer roles cannot perform this action. |

### Error Usage Example

```typescript
import { QuestError, QST_ERROR } from '@mcv/engagement/quests';

// Throwing a quest error
throw new QuestError(QST_ERROR.QUEST_NOT_FOUND, {
  questId: 'quest_abc123',
  tenantId: ctx.tenantId,
});

// Catching and handling
try {
  await questService.startQuest(playerId, questId);
} catch (error) {
  if (error instanceof QuestError) {
    switch (error.code) {
      case 'QST_002':
        // Already started — resume instead
        return questService.getProgress(playerId, questId);
      case 'QST_014':
        // Prerequisite not met — show requirements
        return { error: 'prerequisites', required: error.meta.requiredQuests };
      case 'QST_018':
        // Daily limit — show reset time
        return { error: 'daily_limit', resetsAt: error.meta.nextResetAt };
      default:
        throw error;
    }
  }
  throw error;
}
```

---

## Security

### Access Control

The quests module enforces role-based access control at the tRPC router level. Three primary roles interact with the system:

| Role | Capabilities |
|------|-------------|
| **Player** | Start quests, submit progress, view own progress, claim rewards, join/leave party quests, view quest board |
| **Quest Designer** | Create/edit quest definitions, configure objectives and rewards, view analytics, manage quest chains, publish/unpublish quests |
| **Admin** | All designer capabilities plus: force-complete quests, reset player progress, override limits, manage tenant quest config, bulk operations, impersonate players for debugging |

```typescript
// Role enforcement at the router level
export const questRouter = router({
  // Player endpoints
  startQuest: protectedProcedure
    .input(startQuestSchema)
    .mutation(({ ctx, input }) => {
      requireRole(ctx, ['player', 'quest_designer', 'admin']);
      return questService.startQuest(ctx.tenantId, ctx.userId, input.questId);
    }),

  // Designer endpoints
  createQuest: protectedProcedure
    .input(createQuestSchema)
    .mutation(({ ctx, input }) => {
      requireRole(ctx, ['quest_designer', 'admin']);
      return questService.createQuest(ctx.tenantId, ctx.userId, input);
    }),

  // Admin endpoints
  forceComplete: protectedProcedure
    .input(forceCompleteSchema)
    .mutation(({ ctx, input }) => {
      requireRole(ctx, ['admin']);
      auditLog(ctx, 'quest.force_complete', input);
      return questService.forceComplete(ctx.tenantId, input.playerId, input.questId);
    }),
});
```

### Quest Manipulation Prevention

All objective progress is validated server-side. The module employs multiple strategies to prevent illegitimate quest advancement:

1. **Server-Side Validation**: Progress updates are validated against objective definitions. The client cannot self-report completion — only qualified events from trusted services (or admin overrides) advance objectives.

2. **Event Source Verification**: Objective progress events consumed from Redpanda include a source service identifier. The quest module validates that the event source is authorized to trigger each objective type:

```typescript
const AUTHORIZED_SOURCES: Record<ObjectiveType, string[]> = {
  'action_count':    ['game-server', 'activity-tracker'],
  'item_collect':    ['inventory-service', 'game-server'],
  'score_reach':     ['leaderboard-service', 'game-server'],
  'social_interact': ['social-service', 'chat-service'],
  'login_streak':    ['auth-service'],
  'purchase':        ['commerce-service'],
  'custom':          ['game-server', 'admin-service'],
};
```

3. **Idempotency**: Each progress event carries a unique event ID. Duplicate events are detected and discarded to prevent double-counting.

4. **Rate Limiting**: Progress update endpoints are rate-limited per player to prevent abuse:
   - Objective progress: **60 requests/minute** per player
   - Quest start: **10 requests/minute** per player
   - Reward claim: **5 requests/minute** per player

5. **Value Bounds Checking**: Progress increments are validated against configurable bounds. Suspiciously large increments (e.g., +10000 kills in one event) are flagged and rejected.

### Row-Level Security (RLS)

All quest tables enforce tenant isolation via Supabase RLS policies:

```sql
-- Quest progress: players can only read their own progress
CREATE POLICY "quest_progress_player_read" ON quest_progress
  FOR SELECT
  USING (
    tenant_id = current_setting('app.tenant_id')::uuid
    AND player_id = current_setting('app.user_id')::uuid
  );

-- Quest progress: only the service role can insert/update
CREATE POLICY "quest_progress_service_write" ON quest_progress
  FOR ALL
  USING (tenant_id = current_setting('app.tenant_id')::uuid)
  WITH CHECK (tenant_id = current_setting('app.tenant_id')::uuid);

-- Quest definitions: all authenticated users can read published quests
CREATE POLICY "quests_read_published" ON quests
  FOR SELECT
  USING (
    tenant_id = current_setting('app.tenant_id')::uuid
    AND status = 'published'
  );

-- Quest definitions: only designers and admins can write
CREATE POLICY "quests_designer_write" ON quests
  FOR ALL
  USING (
    tenant_id = current_setting('app.tenant_id')::uuid
    AND current_setting('app.user_role') IN ('quest_designer', 'admin')
  )
  WITH CHECK (
    tenant_id = current_setting('app.tenant_id')::uuid
  );

-- Party quest members: players can only see parties they belong to
CREATE POLICY "party_members_read" ON party_quest_members
  FOR SELECT
  USING (
    tenant_id = current_setting('app.tenant_id')::uuid
    AND player_id = current_setting('app.user_id')::uuid
  );

-- Objective progress: scoped to player's own quest progress
CREATE POLICY "objective_progress_player_read" ON objective_progress
  FOR SELECT
  USING (
    tenant_id = current_setting('app.tenant_id')::uuid
    AND quest_progress_id IN (
      SELECT id FROM quest_progress
      WHERE player_id = current_setting('app.user_id')::uuid
    )
  );
```

### Objective Verification

For high-value quests, the module supports multi-layer verification:

```typescript
interface ObjectiveVerification {
  /** Basic: trust the event source */
  level: 'basic' | 'enhanced' | 'strict';
  /** Enhanced: cross-reference with a second service */
  crossReferenceService?: string;
  /** Strict: require admin approval before marking complete */
  requiresAdminApproval?: boolean;
  /** Anti-cheat: flag for server-side anti-cheat validation */
  antiCheatCheck?: boolean;
}

// High-value quest objectives use strict verification
const storyQuestObjective: QuestObjective = {
  id: 'obj_final_boss',
  type: 'action_count',
  targetValue: 1,
  verification: {
    level: 'strict',
    crossReferenceService: 'game-server',
    antiCheatCheck: true,
  },
};
```

### Party Quest Isolation

Party quests enforce strict isolation between party instances:

- Each party instance has its own progress tracking — contributions from one party cannot affect another
- Party membership is validated on every contribution update
- Party join/leave operations are atomic and use row-level locks to prevent race conditions
- Disbanded parties have their progress frozen (not deleted) for audit purposes
- Cross-party communication is prohibited at the data layer through RLS

### Audit Logging

All sensitive operations are recorded to the tenant audit log:

```typescript
const AUDITED_OPERATIONS = [
  'quest.force_complete',
  'quest.reset_progress',
  'quest.override_limit',
  'quest.publish',
  'quest.unpublish',
  'quest.delete',
  'quest.bulk_assign',
  'party.force_disband',
  'reward.manual_grant',
  'config.update',
] as const;
```

---

## Environment Variables

The quests module reads configuration from environment variables, all prefixed with QUEST_ for namespace isolation. Defaults are tuned for development; production deployments should explicitly set all values.

### Quest Limits

| Variable | Type | Default | Description |
|----------|------|---------|-------------|
| QUEST_MAX_ACTIVE_PER_PLAYER | 
umber | 25 | Maximum number of simultaneously active quests per player. Prevents quest hoarding. |
| QUEST_MAX_DAILY_STARTS | 
umber | 10 | Maximum number of new quests a player can start per day. Resets at QUEST_DAILY_RESET_HOUR. |
| QUEST_MAX_WEEKLY_STARTS | 
umber | 30 | Maximum number of new quests a player can start per week. Resets on QUEST_WEEKLY_RESET_DAY. |
| QUEST_MAX_OBJECTIVES_PER_QUEST | 
umber | 20 | Maximum number of objectives allowed on a single quest definition. |
| QUEST_MAX_CHAIN_LENGTH | 
umber | 50 | Maximum number of steps in a quest chain. Prevents excessively long chains. |
| QUEST_MAX_REWARDS_PER_QUEST | 
umber | 10 | Maximum number of reward entries per quest completion. |

### Daily/Weekly Reset Configuration

| Variable | Type | Default | Description |
|----------|------|---------|-------------|
| QUEST_DAILY_RESET_HOUR | 
umber |   | Hour (0-23) in UTC when daily quest counters reset. |
| QUEST_DAILY_RESET_MINUTE | 
umber |   | Minute (0-59) for daily reset precision. |
| QUEST_WEEKLY_RESET_DAY | 
umber | 1 | Day of week (0=Sunday, 1=Monday) when weekly quests reset. |
| QUEST_DAILY_POOL_SIZE | 
umber | 5 | Number of daily quests to select from the pool and present to each player. |
| QUEST_DAILY_POOL_STRATEGY | string | 'weighted_random' | Strategy for selecting daily quests: andom, weighted_random, ound_robin, personalized. |

### Party Quest Configuration

| Variable | Type | Default | Description |
|----------|------|---------|-------------|
| QUEST_PARTY_MAX_SIZE | 
umber | 8 | Maximum number of players in a party quest instance. |
| QUEST_PARTY_MIN_SIZE | 
umber | 2 | Minimum number of players required to start a party quest. |
| QUEST_PARTY_JOIN_TIMEOUT_MS | 
umber | 300000 | Time in milliseconds for players to join a party before it expires (default: 5 minutes). |
| QUEST_PARTY_IDLE_TIMEOUT_MS | 
umber | 3600000 | Time in milliseconds before an idle party is automatically disbanded (default: 1 hour). |

### Objective Tracking

| Variable | Type | Default | Description |
|----------|------|---------|-------------|
| QUEST_OBJECTIVE_BATCH_SIZE | 
umber | 100 | Number of objective progress events to process in a single batch from Redpanda. |
| QUEST_OBJECTIVE_BATCH_INTERVAL_MS | 
umber | 1000 | Interval in milliseconds between objective progress batch flushes. |
| QUEST_OBJECTIVE_MAX_INCREMENT | 
umber | 1000 | Maximum allowed single-event increment for objective progress. Values above this are flagged and rejected. |
| QUEST_EVENT_CONSUMER_GROUP | string | 'quest-objective-tracker' | Redpanda consumer group ID for the objective tracking consumer. |
| QUEST_EVENT_TOPIC | string | 'game.events' | Redpanda topic to consume for objective-relevant events. |

### Reward Configuration

| Variable | Type | Default | Description |
|----------|------|---------|-------------|
| QUEST_REWARD_CLAIM_TIMEOUT_MS | 
umber | 30000 | Timeout for the reward distribution transaction. If any downstream reward service fails within this window, the entire claim is rolled back. |
| QUEST_REWARD_RETRY_ATTEMPTS | 
umber | 3 | Number of retry attempts for failed reward distributions before marking the claim as failed. |
| QUEST_REWARD_RETRY_DELAY_MS | 
umber | 5000 | Delay between reward distribution retry attempts (with exponential backoff multiplier). |

### Caching & Performance

| Variable | Type | Default | Description |
|----------|------|---------|-------------|
| QUEST_CACHE_TTL_SECONDS | 
umber | 300 | TTL for cached quest definitions. Quest definitions change infrequently and are safe to cache aggressively. |
| QUEST_PROGRESS_CACHE_TTL_SECONDS | 
umber | 30 | TTL for cached quest progress. Shorter TTL ensures near-real-time progress visibility. |
| QUEST_BOARD_CACHE_TTL_SECONDS | 
umber | 60 | TTL for cached quest board listings. Balances freshness with read performance. |
| QUEST_ANALYTICS_SAMPLE_RATE | 
umber | 1.0 | Sampling rate (0.0-1.0) for analytics event emission. Set below 1.0 in high-traffic environments. |

### Configuration Loading

```typescript
import { z } from 'zod';

export const questConfigSchema = z.object({
  maxActivePerPlayer: z.coerce.number().int().min(1).default(25),
  maxDailyStarts: z.coerce.number().int().min(1).default(10),
  maxWeeklyStarts: z.coerce.number().int().min(1).default(30),
  maxObjectivesPerQuest: z.coerce.number().int().min(1).default(20),
  maxChainLength: z.coerce.number().int().min(1).default(50),
  maxRewardsPerQuest: z.coerce.number().int().min(1).default(10),
  dailyResetHour: z.coerce.number().int().min(0).max(23).default(0),
  dailyResetMinute: z.coerce.number().int().min(0).max(59).default(0),
  weeklyResetDay: z.coerce.number().int().min(0).max(6).default(1),
  dailyPoolSize: z.coerce.number().int().min(1).default(5),
  dailyPoolStrategy: z.enum(['random', 'weighted_random', 'round_robin', 'personalized']).default('weighted_random'),
  partyMaxSize: z.coerce.number().int().min(2).default(8),
  partyMinSize: z.coerce.number().int().min(2).default(2),
  partyJoinTimeoutMs: z.coerce.number().int().min(1000).default(300000),
  partyIdleTimeoutMs: z.coerce.number().int().min(1000).default(3600000),
  objectiveBatchSize: z.coerce.number().int().min(1).default(100),
  objectiveBatchIntervalMs: z.coerce.number().int().min(100).default(1000),
  objectiveMaxIncrement: z.coerce.number().int().min(1).default(1000),
  eventConsumerGroup: z.string().default('quest-objective-tracker'),
  eventTopic: z.string().default('game.events'),
  rewardClaimTimeoutMs: z.coerce.number().int().min(1000).default(30000),
  rewardRetryAttempts: z.coerce.number().int().min(0).default(3),
  rewardRetryDelayMs: z.coerce.number().int().min(100).default(5000),
  cacheTtlSeconds: z.coerce.number().int().min(0).default(300),
  progressCacheTtlSeconds: z.coerce.number().int().min(0).default(30),
  boardCacheTtlSeconds: z.coerce.number().int().min(0).default(60),
  analyticsSampleRate: z.coerce.number().min(0).max(1).default(1.0),
});

export type QuestConfig = z.infer<typeof questConfigSchema>;

export function loadQuestConfig(): QuestConfig {
  return questConfigSchema.parse({
    maxActivePerPlayer: process.env.QUEST_MAX_ACTIVE_PER_PLAYER,
    maxDailyStarts: process.env.QUEST_MAX_DAILY_STARTS,
    maxWeeklyStarts: process.env.QUEST_MAX_WEEKLY_STARTS,
    maxObjectivesPerQuest: process.env.QUEST_MAX_OBJECTIVES_PER_QUEST,
    maxChainLength: process.env.QUEST_MAX_CHAIN_LENGTH,
    maxRewardsPerQuest: process.env.QUEST_MAX_REWARDS_PER_QUEST,
    dailyResetHour: process.env.QUEST_DAILY_RESET_HOUR,
    dailyResetMinute: process.env.QUEST_DAILY_RESET_MINUTE,
    weeklyResetDay: process.env.QUEST_WEEKLY_RESET_DAY,
    dailyPoolSize: process.env.QUEST_DAILY_POOL_SIZE,
    dailyPoolStrategy: process.env.QUEST_DAILY_POOL_STRATEGY,
    partyMaxSize: process.env.QUEST_PARTY_MAX_SIZE,
    partyMinSize: process.env.QUEST_PARTY_MIN_SIZE,
    partyJoinTimeoutMs: process.env.QUEST_PARTY_JOIN_TIMEOUT_MS,
    partyIdleTimeoutMs: process.env.QUEST_PARTY_IDLE_TIMEOUT_MS,
    objectiveBatchSize: process.env.QUEST_OBJECTIVE_BATCH_SIZE,
    objectiveBatchIntervalMs: process.env.QUEST_OBJECTIVE_BATCH_INTERVAL_MS,
    objectiveMaxIncrement: process.env.QUEST_OBJECTIVE_MAX_INCREMENT,
    eventConsumerGroup: process.env.QUEST_EVENT_CONSUMER_GROUP,
    eventTopic: process.env.QUEST_EVENT_TOPIC,
    rewardClaimTimeoutMs: process.env.QUEST_REWARD_CLAIM_TIMEOUT_MS,
    rewardRetryAttempts: process.env.QUEST_REWARD_RETRY_ATTEMPTS,
    rewardRetryDelayMs: process.env.QUEST_REWARD_RETRY_DELAY_MS,
    cacheTtlSeconds: process.env.QUEST_CACHE_TTL_SECONDS,
    progressCacheTtlSeconds: process.env.QUEST_PROGRESS_CACHE_TTL_SECONDS,
    boardCacheTtlSeconds: process.env.QUEST_BOARD_CACHE_TTL_SECONDS,
    analyticsSampleRate: process.env.QUEST_ANALYTICS_SAMPLE_RATE,
  });
}
```

---

## Dependencies

### Internal Dependencies

| Package | Role | Usage |
|---------|------|-------|
| @mcv/kernel | Core infrastructure | Database access (db), tenant context (TenantContext), base error classes (DomainError), audit logging, caching utilities, configuration loading, event bus interfaces |
| @mcv/identity | Player identity | Player ID resolution, profile lookup for quest board personalization, session validation, role/permission checks |
| @mcv/fabric | Multi-tenant fabric | Tenant configuration, feature flags (e.g., quests.party_enabled, quests.ml_recommendations), tenant-specific quest limits, A/B test variant assignment |
| @mcv/engagement/points | Points system | Point reward distribution on quest completion, point balance queries for point-threshold objectives, point transaction creation |
| @mcv/engagement/earn | Earn mechanics | XP reward distribution, earn rule evaluation, multiplier application for quest reward bonuses |
| @mcv/engagement/achievements | Achievement system | Achievement unlock triggers on quest/chain completion, achievement-based quest prerequisites, progress cross-referencing |
| @mcv/engagement/rewards | Reward orchestration | Centralized reward distribution pipeline, reward template resolution, inventory item grants, reward rollback on failure |
| @mcv/engagement/streaks | Streak tracking | Login streak data for streak-based quest objectives, streak milestone triggers for bonus quest unlocks |
| @mcv/engagement/leaderboards | Leaderboards | Score submission on quest completion, leaderboard-position objectives, competitive quest rankings |

### Dependency Flow

```
┌─────────────────────────────────────────────────────────┐
│                    @mcv/kernel                          │
│         (db, tenantContext, errors, cache, events)      │
└──────────────┬──────────────────────────────────────────┘
               │
       ┌───────┴───────┐
       │               │
  @mcv/identity    @mcv/fabric
  (players)        (tenants, flags)
       │               │
       └───────┬───────┘
               │
    ┌──────────┴──────────┐
    │  @mcv/engagement/   │
    │      quests         │◄── THIS MODULE
    └──────────┬──────────┘
               │
    ┌──────────┼──────────────────┐──────────────┐
    │          │                  │              │
    ▼          ▼                  ▼              ▼
 /points    /earn          /achievements    /rewards
 /streaks   /leaderboards
```

### External Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| zod | ^3.22 | Runtime schema validation for all inputs (quest definitions, progress updates, configuration). Every tRPC endpoint validates inputs through Zod schemas. |
| date-fns | ^3.0 | Date manipulation for quest deadlines, daily/weekly reset calculations, time-remaining computations, analytics date ranges. |
| cron-parser | ^4.9 | Parsing cron expressions for scheduled quest availability windows and recurring quest pool refresh schedules. |
| drizzle-orm | ^0.29 | Type-safe SQL query builder for all database operations. Provides the schema definitions and query interface. |
| 
anoid | ^5.0 | Generating unique IDs for quest instances, progress records, party instances, and objective progress entries. |
| superjson | ^2.2 | Serialization for tRPC — handles Date objects, BigInt, and other non-JSON-native types in quest API responses. |
| eventemitter3 | ^5.0 | Local event emission for intra-process quest lifecycle events (used alongside Redpanda for cross-service events). |
| p-queue | ^8.0 | Concurrency-limited queue for batch reward distribution. Prevents overwhelming downstream services during bulk quest completions. |
| lru-cache | ^10.0 | In-memory LRU cache for quest definitions and board listings. Configurable via QUEST_CACHE_TTL_SECONDS. |
| ioredis | ^5.3 | Redis client for distributed caching and rate limiting across multiple service instances. |

### Peer Dependencies

These are expected to be provided by the host application:

```json
{
  "peerDependencies": {
    "@supabase/supabase-js": "^2.39",
    "drizzle-orm": "^0.29",
    "@trpc/server": "^10.45"
  }
}
```

---

## Testing

### Test Strategy

The quests module uses a layered testing approach with **Vitest** as the test runner:

| Layer | Coverage Target | Focus |
|-------|----------------|-------|
| **Unit Tests** | ≥ 90% | Pure logic: objective evaluation, quest state machine, chain validation, reward calculation, analytics |
| **Integration Tests** | ≥ 80% | Full quest lifecycle with database, Redpanda event consumption, RLS policy enforcement, multi-tenant isolation |
| **E2E Tests** | Key flows | Quest start → progress → complete → claim flow via tRPC, party quest full lifecycle |

### Unit Tests

#### Objective Evaluation

```typescript
import { describe, it, expect } from 'vitest';
import { evaluateObjectiveProgress, ObjectiveType } from '../objective-evaluator';

describe('evaluateObjectiveProgress', () => {
  it('should increment counter-type objectives', () => {
    const result = evaluateObjectiveProgress({
      objective: { type: 'action_count', targetValue: 10 },
      currentValue: 3,
      event: { type: 'action', value: 2 },
    });

    expect(result.newValue).toBe(5);
    expect(result.isComplete).toBe(false);
    expect(result.percentComplete).toBe(50);
  });

  it('should cap progress at target value', () => {
    const result = evaluateObjectiveProgress({
      objective: { type: 'action_count', targetValue: 10 },
      currentValue: 9,
      event: { type: 'action', value: 5 },
    });

    expect(result.newValue).toBe(10);
    expect(result.isComplete).toBe(true);
    expect(result.percentComplete).toBe(100);
  });

  it('should handle threshold-type objectives (score_reach)', () => {
    const result = evaluateObjectiveProgress({
      objective: { type: 'score_reach', targetValue: 1000 },
      currentValue: 800,
      event: { type: 'score_update', value: 1050 },
    });

    // Threshold objectives use the absolute value, not increment
    expect(result.newValue).toBe(1050);
    expect(result.isComplete).toBe(true);
  });

  it('should reject invalid event types for objective', () => {
    expect(() =>
      evaluateObjectiveProgress({
        objective: { type: 'item_collect', targetValue: 5 },
        currentValue: 2,
        event: { type: 'action', value: 1 },
      }),
    ).toThrow('QST_013');
  });

  it('should reject negative progress values', () => {
    expect(() =>
      evaluateObjectiveProgress({
        objective: { type: 'action_count', targetValue: 10 },
        currentValue: 5,
        event: { type: 'action', value: -3 },
      }),
    ).toThrow('QST_011');
  });

  it('should reject increments exceeding max threshold', () => {
    expect(() =>
      evaluateObjectiveProgress({
        objective: { type: 'action_count', targetValue: 100 },
        currentValue: 0,
        event: { type: 'action', value: 99999 },
        config: { objectiveMaxIncrement: 1000 },
      }),
    ).toThrow('QST_011');
  });
});
```

#### Quest State Machine

```typescript
import { describe, it, expect } from 'vitest';
import { QuestStateMachine, QuestStatus } from '../quest-state-machine';

describe('QuestStateMachine', () => {
  const sm = new QuestStateMachine();

  it('should allow valid transitions', () => {
    expect(sm.canTransition('available', 'in_progress')).toBe(true);
    expect(sm.canTransition('in_progress', 'completed')).toBe(true);
    expect(sm.canTransition('in_progress', 'abandoned')).toBe(true);
    expect(sm.canTransition('in_progress', 'expired')).toBe(true);
    expect(sm.canTransition('completed', 'rewards_claimed')).toBe(true);
  });

  it('should reject invalid transitions', () => {
    expect(sm.canTransition('completed', 'in_progress')).toBe(false);
    expect(sm.canTransition('abandoned', 'completed')).toBe(false);
    expect(sm.canTransition('rewards_claimed', 'available')).toBe(false);
    expect(sm.canTransition('expired', 'in_progress')).toBe(false);
  });

  it('should execute transition and return new state', () => {
    const result = sm.transition('available', 'start');
    expect(result.status).toBe('in_progress');
    expect(result.timestamp).toBeInstanceOf(Date);
  });

  it('should throw on invalid transition action', () => {
    expect(() => sm.transition('completed', 'start')).toThrow('QST_008');
  });

  it('should handle repeatable quest reset', () => {
    const result = sm.transition('rewards_claimed', 'reset', { repeatable: true });
    expect(result.status).toBe('available');
  });

  it('should reject reset for non-repeatable quests', () => {
    expect(() =>
      sm.transition('rewards_claimed', 'reset', { repeatable: false }),
    ).toThrow();
  });
});
```

#### Chain Validation

```typescript
import { describe, it, expect } from 'vitest';
import { validateQuestChain, detectChainCycles } from '../chain-validator';

describe('validateQuestChain', () => {
  it('should accept a valid linear chain', () => {
    const chain = {
      steps: [
        { questId: 'q1', order: 0, nextSteps: ['q2'] },
        { questId: 'q2', order: 1, nextSteps: ['q3'] },
        { questId: 'q3', order: 2, nextSteps: [] },
      ],
    };

    const result = validateQuestChain(chain);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('should accept a branching chain', () => {
    const chain = {
      steps: [
        { questId: 'q1', order: 0, nextSteps: ['q2a', 'q2b'] },
        { questId: 'q2a', order: 1, nextSteps: ['q3'], branch: 'path_a' },
        { questId: 'q2b', order: 1, nextSteps: ['q3'], branch: 'path_b' },
        { questId: 'q3', order: 2, nextSteps: [] },
      ],
    };

    const result = validateQuestChain(chain);
    expect(result.valid).toBe(true);
  });

  it('should detect circular references', () => {
    const chain = {
      steps: [
        { questId: 'q1', order: 0, nextSteps: ['q2'] },
        { questId: 'q2', order: 1, nextSteps: ['q3'] },
        { questId: 'q3', order: 2, nextSteps: ['q1'] }, // Cycle!
      ],
    };

    const result = validateQuestChain(chain);
    expect(result.valid).toBe(false);
    expect(result.errors).toContainEqual(
      expect.objectContaining({ code: 'CYCLE_DETECTED' }),
    );
  });

  it('should detect orphaned steps', () => {
    const chain = {
      steps: [
        { questId: 'q1', order: 0, nextSteps: ['q2'] },
        { questId: 'q2', order: 1, nextSteps: [] },
        { questId: 'q3', order: 2, nextSteps: [] }, // Orphan — not reachable
      ],
    };

    const result = validateQuestChain(chain);
    expect(result.valid).toBe(false);
    expect(result.errors).toContainEqual(
      expect.objectContaining({ code: 'ORPHANED_STEP', questId: 'q3' }),
    );
  });

  it('should reject chains exceeding max length', () => {
    const steps = Array.from({ length: 51 }, (_, i) => ({
      questId: q${i}`,
      order: i,
      nextSteps: i < 50 ? [q${i + 1}] : [],
    }));

    const result = validateQuestChain({ steps }, { maxChainLength: 50 });
    expect(result.valid).toBe(false);
    expect(result.errors[0].code).toBe('CHAIN_TOO_LONG');
  });

  it('should detect missing quest references', () => {
    const chain = {
      steps: [
        { questId: 'q1', order: 0, nextSteps: ['q2'] },
        { questId: 'q2', order: 1, nextSteps: ['q_missing'] },
      ],
    };

    const result = validateQuestChain(chain);
    expect(result.valid).toBe(false);
    expect(result.errors).toContainEqual(
      expect.objectContaining({ code: 'MISSING_REFERENCE', reference: 'q_missing' }),
    );
  });
});

describe('detectChainCycles', () => {
  it('should return empty array for acyclic graph', () => {
    const cycles = detectChainCycles({
      q1: ['q2'],
      q2: ['q3'],
      q3: [],
    });
    expect(cycles).toHaveLength(0);
  });

  it('should return cycle path for cyclic graph', () => {
    const cycles = detectChainCycles({
      q1: ['q2'],
      q2: ['q3'],
      q3: ['q1'],
    });
    expect(cycles.length).toBeGreaterThan(0);
    expect(cycles[0]).toContain('q1');
  });
});
```

### Integration Tests

#### Quest Lifecycle

```typescript
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createTestContext, cleanupTestData } from '@mcv/kernel/testing';
import { QuestService } from '../quest-service';
import { QuestRewardService } from '../quest-reward-service';

describe('Quest Lifecycle (integration)', () => {
  let ctx: TestContext;
  let questService: QuestService;
  let rewardService: QuestRewardService;
  let testQuestId: string;

  beforeEach(async () => {
    ctx = await createTestContext({ modules: ['quests', 'points', 'rewards'] });
    questService = new QuestService(ctx.tenant);
    rewardService = new QuestRewardService(ctx.tenant);

    // Seed a test quest with 3 objectives
    testQuestId = await questService.createQuest(ctx.tenantId, ctx.adminId, {
      title: 'Integration Test Quest',
      description: 'A quest for testing the full lifecycle',
      questType: 'story',
      objectives: [
        { title: 'Collect 5 items', type: 'item_collect', targetValue: 5, orderIndex: 0 },
        { title: 'Reach score 100', type: 'score_reach', targetValue: 100, orderIndex: 1 },
        { title: 'Complete 3 actions', type: 'action_count', targetValue: 3, orderIndex: 2 },
      ],
      rewards: [
        { type: 'points', amount: 500 },
        { type: 'xp', amount: 200 },
      ],
      status: 'published',
    });
  });

  afterEach(async () => {
    await cleanupTestData(ctx);
  });

  it('should complete full quest lifecycle: start → progress → complete → claim', async () => {
    const playerId = ctx.testPlayerId;

    // 1. Start quest
    const progress = await questService.startQuest(ctx.tenantId, playerId, testQuestId);
    expect(progress.status).toBe('in_progress');
    expect(progress.objectives).toHaveLength(3);

    // 2. Progress objective 1 (item_collect)
    await questService.updateObjectiveProgress(ctx.tenantId, playerId, testQuestId, {
      objectiveIndex: 0,
      event: { type: 'item_collect', value: 3 },
    });
    await questService.updateObjectiveProgress(ctx.tenantId, playerId, testQuestId, {
      objectiveIndex: 0,
      event: { type: 'item_collect', value: 2 },
    });

    // 3. Progress objective 2 (score_reach)
    await questService.updateObjectiveProgress(ctx.tenantId, playerId, testQuestId, {
      objectiveIndex: 1,
      event: { type: 'score_update', value: 150 },
    });

    // 4. Progress objective 3 (action_count)
    for (let i = 0; i < 3; i++) {
      await questService.updateObjectiveProgress(ctx.tenantId, playerId, testQuestId, {
        objectiveIndex: 2,
        event: { type: 'action', value: 1 },
      });
    }

    // 5. Verify quest auto-completed
    const finalProgress = await questService.getProgress(ctx.tenantId, playerId, testQuestId);
    expect(finalProgress.status).toBe('completed');
    expect(finalProgress.completedAt).toBeInstanceOf(Date);

    // 6. Claim rewards
    const rewards = await rewardService.claimRewards(ctx.tenantId, playerId, testQuestId);
    expect(rewards.claimed).toBe(true);
    expect(rewards.distributions).toHaveLength(2);
    expect(rewards.distributions).toContainEqual(
      expect.objectContaining({ type: 'points', amount: 500 }),
    );
  });

  it('should prevent starting a quest with unmet prerequisites', async () => {
    // Create a quest that requires testQuestId as prerequisite
    const advancedQuestId = await questService.createQuest(ctx.tenantId, ctx.adminId, {
      title: 'Advanced Quest',
      questType: 'story',
      prerequisites: [testQuestId],
      objectives: [{ title: 'Do thing', type: 'action_count', targetValue: 1, orderIndex: 0 }],
      rewards: [{ type: 'points', amount: 100 }],
      status: 'published',
    });

    await expect(
      questService.startQuest(ctx.tenantId, ctx.testPlayerId, advancedQuestId),
    ).rejects.toThrow('QST_014');
  });

  it('should prevent double reward claims', async () => {
    // Complete the quest (fast-track)
    await questService.startQuest(ctx.tenantId, ctx.testPlayerId, testQuestId);
    await questService.forceComplete(ctx.tenantId, ctx.testPlayerId, testQuestId);

    // First claim succeeds
    await rewardService.claimRewards(ctx.tenantId, ctx.testPlayerId, testQuestId);

    // Second claim fails
    await expect(
      rewardService.claimRewards(ctx.tenantId, ctx.testPlayerId, testQuestId),
    ).rejects.toThrow('QST_021');
  });
});
```

#### Party Quest Integration

```typescript
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createTestContext, cleanupTestData } from '@mcv/kernel/testing';
import { PartyQuestService } from '../party-quest-service';

describe('Party Quest (integration)', () => {
  let ctx: TestContext;
  let partyService: PartyQuestService;
  let partyQuestId: string;

  beforeEach(async () => {
    ctx = await createTestContext({ modules: ['quests'] });
    partyService = new PartyQuestService(ctx.tenant);

    partyQuestId = await ctx.seedPartyQuest({
      title: 'Team Challenge',
      minPlayers: 2,
      maxPlayers: 4,
      objectives: [
        { title: 'Collect 100 total', type: 'item_collect', targetValue: 100, shared: true },
      ],
    });
  });

  afterEach(async () => {
    await cleanupTestData(ctx);
  });

  it('should track shared contributions from multiple players', async () => {
    const [player1, player2] = [ctx.testPlayerId, ctx.testPlayer2Id];

    // Create and join party
    const party = await partyService.createParty(ctx.tenantId, player1, partyQuestId);
    await partyService.joinParty(ctx.tenantId, player2, party.id);
    await partyService.startPartyQuest(ctx.tenantId, party.id);

    // Both players contribute
    await partyService.contribute(ctx.tenantId, player1, party.id, {
      objectiveIndex: 0,
      value: 40,
    });
    await partyService.contribute(ctx.tenantId, player2, party.id, {
      objectiveIndex: 0,
      value: 60,
    });

    // Check shared progress
    const progress = await partyService.getPartyProgress(ctx.tenantId, party.id);
    expect(progress.objectives[0].currentValue).toBe(100);
    expect(progress.objectives[0].isComplete).toBe(true);
    expect(progress.status).toBe('completed');

    // Verify individual contributions
    expect(progress.contributions.get(player1)).toBe(40);
    expect(progress.contributions.get(player2)).toBe(60);
  });

  it('should enforce party size limits', async () => {
    const party = await partyService.createParty(ctx.tenantId, ctx.testPlayerId, partyQuestId);

    // Fill to max (4 players)
    for (const playerId of [ctx.testPlayer2Id, ctx.testPlayer3Id, ctx.testPlayer4Id]) {
      await partyService.joinParty(ctx.tenantId, playerId, party.id);
    }

    // 5th player should be rejected
    await expect(
      partyService.joinParty(ctx.tenantId, 'player_5', party.id),
    ).rejects.toThrow('QST_024');
  });
});
```

#### RLS Policy Tests

```typescript
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createTestContext, cleanupTestData, setRLSContext } from '@mcv/kernel/testing';

describe('Quest RLS Policies (integration)', () => {
  let ctx: TestContext;

  beforeEach(async () => {
    ctx = await createTestContext({ modules: ['quests'], useRLS: true });
  });

  afterEach(async () => {
    await cleanupTestData(ctx);
  });

  it('should isolate quest progress between tenants', async () => {
    const tenant1 = await ctx.createTenant('Tenant 1');
    const tenant2 = await ctx.createTenant('Tenant 2');
    const questId = await ctx.seedQuest(tenant1.id, { title: 'Tenant 1 Quest' });

    // Start quest in tenant 1
    await setRLSContext(ctx.db, { tenantId: tenant1.id, userId: ctx.testPlayerId });
    await ctx.db.insert(questProgress).values({
      tenantId: tenant1.id,
      playerId: ctx.testPlayerId,
      questId,
      status: 'in_progress',
    });

    // Tenant 2 should not see tenant 1's progress
    await setRLSContext(ctx.db, { tenantId: tenant2.id, userId: ctx.testPlayerId });
    const results = await ctx.db.select().from(questProgress);
    expect(results).toHaveLength(0);
  });

  it('should prevent players from reading other players progress', async () => {
    const questId = await ctx.seedQuest(ctx.tenantId, { title: 'Private Quest' });

    // Player 1 starts quest
    await setRLSContext(ctx.db, { tenantId: ctx.tenantId, userId: 'player_1' });
    await ctx.db.insert(questProgress).values({
      tenantId: ctx.tenantId,
      playerId: 'player_1',
      questId,
      status: 'in_progress',
    });

    // Player 2 should not see player 1's progress
    await setRLSContext(ctx.db, { tenantId: ctx.tenantId, userId: 'player_2' });
    const results = await ctx.db.select().from(questProgress);
    expect(results).toHaveLength(0);
  });

  it('should allow all players to read published quests', async () => {
    await ctx.seedQuest(ctx.tenantId, { title: 'Public Quest', status: 'published' });
    await ctx.seedQuest(ctx.tenantId, { title: 'Draft Quest', status: 'draft' });

    await setRLSContext(ctx.db, { tenantId: ctx.tenantId, userId: ctx.testPlayerId, role: 'player' });
    const results = await ctx.db.select().from(quests);

    // Player should only see the published quest
    expect(results).toHaveLength(1);
    expect(results[0].title).toBe('Public Quest');
  });
});
```

### Test Utilities

```typescript
// packages/engagement/quests/src/testing/quest-test-utils.ts
import { db } from '@mcv/kernel';
import { quests, questObjectives, questProgress, objectiveProgress } from '../schema';
import { nanoid } from 'nanoid';

/**
 * Create a test quest with objectives and optional rewards.
 */
export async function seedTestQuest(
  tenantId: string,
  overrides?: Partial<QuestDefinition>,
): Promise<{ questId: string; objectiveIds: string[] }> {
  const questId = quest_test_${nanoid(8)}`;
  const objectives = overrides?.objectives ?? [
    { title: 'Default objective', type: 'action_count' as const, targetValue: 5, orderIndex: 0 },
  ];

  await db.insert(quests).values({
    id: questId,
    tenantId,
    title: overrides?.title ?? 'Test Quest',
    description: overrides?.description ?? 'A test quest',
    questType: overrides?.questType ?? 'story',
    status: overrides?.status ?? 'published',
    rewards: overrides?.rewards ?? [{ type: 'points', amount: 100 }],
    ...overrides,
  });

  const objectiveIds: string[] = [];
  for (const obj of objectives) {
    const objId = obj_test_${nanoid(8)}`;
    objectiveIds.push(objId);
    await db.insert(questObjectives).values({
      id: objId,
      tenantId,
      questId,
      title: obj.title,
      objectiveType: obj.type,
      targetValue: obj.targetValue,
      orderIndex: obj.orderIndex,
    });
  }

  return { questId, objectiveIds };
}

/**
 * Fast-track a quest to completed state (bypasses objective evaluation).
 */
export async function fastCompleteQuest(
  tenantId: string,
  playerId: string,
  questId: string,
): Promise<void> {
  await db
    .update(questProgress)
    .set({
      status: 'completed',
      completedAt: new Date(),
    })
    .where(
      and(
        eq(questProgress.tenantId, tenantId),
        eq(questProgress.playerId, playerId),
        eq(questProgress.questId, questId),
      ),
    );
}

/**
 * Create a mock Redpanda event for objective progress testing.
 */
export function createMockObjectiveEvent(
  type: string,
  value: number,
  overrides?: Partial<ObjectiveEvent>,
): ObjectiveEvent {
  return {
    eventId: evt_test_${nanoid(8)}`,
    type,
    value,
    source: 'test-harness',
    timestamp: new Date(),
    playerId: 'test_player',
    tenantId: 'test_tenant',
    ...overrides,
  };
}
```

### Coverage Targets

```yaml
# vitest.config.ts coverage configuration
coverage:
  provider: v8
  include:
    - src/**/*.ts
  exclude:
    - src/**/*.test.ts
    - src/**/*.spec.ts
    - src/testing/**
    - src/**/*.d.ts
  thresholds:
    statements: 85
    branches: 80
    functions: 85
    lines: 85
  watermarks:
    statements: [80, 90]
    branches: [75, 85]
    functions: [80, 90]
    lines: [80, 90]
```

### Running Tests

```bash
# All quest module tests
pnpm --filter @mcv/engagement-quests test

# Unit tests only
pnpm --filter @mcv/engagement-quests test:unit

# Integration tests (requires database)
pnpm --filter @mcv/engagement-quests test:integration

# Watch mode during development
pnpm --filter @mcv/engagement-quests test:watch

# Coverage report
pnpm --filter @mcv/engagement-quests test:coverage
```
