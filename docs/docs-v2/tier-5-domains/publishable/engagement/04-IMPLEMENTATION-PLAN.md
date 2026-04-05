# @mcv/engagement — Implementation Plan

**Module:** @mcv/engagement  
**Tier:** 5 (Domain Layer — Publishable)  
**Classification:** PUBLISHABLE  
**Last Updated:** February 9, 2026

---

## Table of Contents

1. [Overview](#overview)
2. [Prerequisites](#prerequisites)
3. [Phase 1 — Foundation](#phase-1--foundation)
4. [Phase 2 — Core](#phase-2--core)
5. [Phase 3 — Advanced](#phase-3--advanced)
6. [Phase 4 — Polish & Optimization](#phase-4--polish--optimization)
7. [Testing Strategy](#testing-strategy)
8. [Acceptance Criteria](#acceptance-criteria)
9. [Risk Assessment](#risk-assessment)
10. [Timeline & Milestones](#timeline--milestones)

---

## Overview

The `@mcv/engagement` module is the **Behavioral Operating System** powering gamification across all nine MCV ventures. This implementation plan breaks the full module build into four progressive phases, each delivering independently valuable functionality while building toward the complete engagement platform.

### Strategic Goals

| Goal | Metric | Target |
|------|--------|--------|
| **D1 Retention** | Day-1 return rate | 45%+ |
| **DAU/MAU Ratio** | Stickiness | 35%+ |
| **Viral K-Factor** | Organic growth | 0.8+ |
| **LTV Lift** | Revenue per user | +40% |
| **Quest Completion** | Daily quest finish rate | 60%+ |
| **Streak Survival** | 7-day streak retention | 40%+ |

### Phase Summary

| Phase | Focus | Duration | Deliverables |
|-------|-------|----------|-------------|
| **Phase 1 — Foundation** | Points, basic achievements, streaks | 4 weeks | Multi-currency ledger, achievement engine, streak tracking |
| **Phase 2 — Core** | Leaderboards, quests, progression, earn rules | 5 weeks | Redis leaderboards, quest engine, XP/leveling, earn pipeline |
| **Phase 3 — Advanced** | Seasons, AI personalization, cross-venture, rewards | 5 weeks | Battle passes, AI quests, reward marketplace, token bridge |
| **Phase 4 — Polish** | Optimization, fraud detection, economic monitoring | 3 weeks | Scout agent, ACS v2.0, performance tuning, dashboards |

**Total estimated duration: 17 weeks**

---

## Prerequisites

### Infrastructure Requirements

Before development begins, the following infrastructure must be provisioned and configured:

| Dependency | Status Required | Owner | Notes |
|-----------|----------------|-------|-------|
| **Supabase PostgreSQL** | Provisioned | Platform team | With `engagement` schema created, RLS enabled |
| **Redis (Upstash)** | Provisioned | Platform team | Serverless Redis with sorted set support |
| **Redpanda cluster** | Provisioned | Platform team | Kafka-compatible event bus, topics pre-created |
| **Drizzle ORM** | Configured | Platform team | Migration tooling, schema generation pipeline |
| **Supabase Auth** | Operational | Auth domain | JWT validation, role-based access |
| **Supabase Realtime** | Operational | Platform team | WebSocket channels for live updates |

### Domain Dependencies

| Domain | Required For | Integration Type |
|--------|-------------|------------------|
| **@mcv/auth** | User authentication, JWT validation | Direct import |
| **@mcv/analytics** | Event tracking, metric dashboards | Event emission (Redpanda) |
| **@mcv/cdp** | User segmentation for quest targeting | API call (Phase 3) |
| **@mcv/commerce** | Physical reward fulfillment | API call (Phase 3) |
| **@mcv/token-economy** | Point ↔ token conversion, NFT minting | API call (Phase 3) |

### Development Environment

| Tool | Version | Purpose |
|------|---------|---------|
| Node.js | 22+ | Runtime |
| Next.js | 15 | Framework (App Router) |
| TypeScript | 5.5+ | Type safety |
| Drizzle ORM | Latest | Database schema & queries |
| Zod | 3.x | Runtime validation |
| Vitest | Latest | Unit & integration testing |
| Playwright | Latest | E2E testing |

### Team & Skills

| Role | Count | Skills |
|------|-------|--------|
| Senior Backend Engineer | 2 | PostgreSQL, Redis, event streaming, Drizzle ORM |
| Full-Stack Engineer | 1 | Next.js 15, React, Supabase Realtime |
| Frontend Engineer | 1 | React components, animations (Lottie/Rive), Tailwind |
| QA Engineer | 1 | Load testing, integration testing, fraud scenario testing |

---

## Phase 1 — Foundation

**Duration:** 4 weeks  
**Goal:** Establish the core point ledger, basic achievement system, and streak tracking — the three primitives that every other engagement feature builds upon.

### Week 1: Database Schema & Point System Core

#### 1.1 Database Schema Setup

**Objective:** Create the foundational `engagement` PostgreSQL schema with all Phase 1 tables.

**Tasks:**

- [ ] Create `engagement` schema in Supabase PostgreSQL
- [ ] Define Drizzle ORM enum types:
  - `point_currency_class_enum` (soft, hard, medium, energy, social, event, token)
  - `point_transaction_type_enum` (earn, spend, transfer_in, transfer_out, convert, expire, adjustment, lock, unlock)
  - `achievement_rarity_enum` (common, uncommon, rare, epic, legendary, mythic)
- [ ] Create `engagement.point_types` table (currency definitions)
- [ ] Create `engagement.point_balances` table (user balances)
- [ ] Create `engagement.point_transactions` table (audit trail)
- [ ] Create `engagement.achievements` table (achievement definitions)
- [ ] Create `engagement.user_achievements` table (per-user state)
- [ ] Create `engagement.streaks` table (current streak state)
- [ ] Create `engagement.streak_history` table (daily snapshots)
- [ ] Set up indexes: unique constraints, composite indexes for common queries
- [ ] Generate and run initial Drizzle migration
- [ ] Verify schema in Supabase dashboard

**Deliverables:**
- Drizzle schema file (`server/db/schema.ts`) with all Phase 1 tables
- Migration file applied to development database
- Schema documentation matching the Technical Architecture spec

#### 1.2 Point Service — Core Ledger

**Objective:** Implement the multi-currency point ledger with ACID transactions, idempotency, and daily cap enforcement.

**Tasks:**

- [ ] Implement `point-type-service.ts`:
  - `createPointType()` — define new currencies
  - `updatePointType()` — update currency settings
  - `listPointTypes()` — list currencies per venture
  - `getPointType()` — get single currency config
- [ ] Implement `point-service.ts`:
  - `awardPoints()` — credit points with ACID transaction
    - `SELECT ... FOR UPDATE` row lock on `point_balances`
    - Daily cap enforcement against `daily_earn_cap`
    - Max balance enforcement against `max_balance`
    - Idempotency via unique `idempotency_key` constraint
    - Balance-before / balance-after snapshot in `point_transactions`
  - `deductPoints()` — debit points (sink operation)
    - Insufficient balance check
    - Negative balance prevention
  - `transferPoints()` — move points between users
    - Atomic sender debit + receiver credit in single transaction
  - `getBalance()` — get user balance for a currency
  - `getAllBalances()` — get all balances across currencies
  - `getTransactionHistory()` — paginated audit trail
- [ ] Implement daily cap reset worker (cron: midnight UTC per user timezone)
- [ ] Write Zod validation schemas for all inputs
- [ ] Write comprehensive unit tests (target: 95% coverage)

**Key Implementation Detail — ACID Transaction:**

```typescript
// Simplified awardPoints flow
async function awardPoints(input: AwardPointsInput) {
  const validated = awardPointsSchema.parse(input);

  return await db.transaction(async (tx) => {
    // 1. Lock balance row
    const [balance] = await tx
      .select()
      .from(pointBalances)
      .where(and(
        eq(pointBalances.userId, validated.userId),
        eq(pointBalances.pointTypeId, pointType.id),
      ))
      .for('update');

    // 2. Check daily cap
    const newDaily = Number(balance.dailyEarned) + validated.amount;
    if (pointType.dailyEarnCap && newDaily > Number(pointType.dailyEarnCap)) {
      throw new DailyCapExceededError(validated.userId, pointType.slug);
    }

    // 3. Update balance
    await tx.update(pointBalances).set({
      available: sql`${pointBalances.available} + ${validated.amount}`,
      dailyEarned: sql`${pointBalances.dailyEarned} + ${validated.amount}`,
      lifetimeEarned: sql`${pointBalances.lifetimeEarned} + ${validated.amount}`,
      lastTransactionAt: new Date(),
    }).where(eq(pointBalances.id, balance.id));

    // 4. Insert audit trail
    const [transaction] = await tx.insert(pointTransactions).values({
      balanceId: balance.id,
      userId: validated.userId,
      pointTypeId: pointType.id,
      transactionType: 'earn',
      amount: String(validated.amount),
      balanceBefore: balance.available,
      balanceAfter: String(Number(balance.available) + validated.amount),
      sourceType: validated.sourceType,
      sourceId: validated.sourceId,
      idempotencyKey: validated.idempotencyKey,
    }).returning();

    return { transaction, balance: { ...balance, available: String(Number(balance.available) + validated.amount) } };
  });
}
```

**Deliverables:**
- `point-service.ts` and `point-type-service.ts` with full CRUD
- Zod schemas for all point operations
- 30+ unit tests covering happy paths, edge cases, and concurrency

### Week 2: Achievement System

#### 2.1 Achievement Admin Service

**Objective:** Build the achievement definition CRUD with JSON Logic requirements and multi-tier support.

**Tasks:**

- [ ] Implement `achievement-admin-service.ts`:
  - `createAchievement()` — create achievement definition with JSON Logic requirements
  - `updateAchievement()` — update achievement config
  - `listAchievements()` — list with filters (category, rarity, tenant)
  - `getAchievement()` — get by ID or slug
- [ ] Implement JSON Logic evaluator (`server/rules/json-logic.ts`)
  - Support comparison operators: `==`, `===`, `!=`, `>`, `>=`, `<`, `<=`
  - Support logic operators: `and`, `or`, `not`, `!`
  - Support data access: `var`, array operations
  - Support arithmetic: `+`, `-`, `*`, `/`, `%`
- [ ] Add achievement seeding script with default achievements per venture
- [ ] Write Zod schemas for achievement creation/update
- [ ] Write unit tests for JSON Logic evaluator (critical: edge cases)

#### 2.2 Achievement User Service

**Objective:** Build user-facing achievement operations including progress tracking, unlocking, and reward claiming.

**Tasks:**

- [ ] Implement `achievement-user-service.ts`:
  - `getUserAchievements()` — get user's full achievement profile with stats
  - `unlockAchievement()` — manually unlock (admin/event-driven)
  - `claimAchievementReward()` — claim reward bundle for unlocked achievement
  - `getAchievementProgress()` — get progress toward specific achievement
  - `setShowcaseAchievements()` — pin up to 5 achievements on profile
- [ ] Implement automatic achievement evaluation on point transactions:
  - After each `awardPoints()`, check relevant achievements
  - Evaluate JSON Logic requirements against accumulated user data
  - Trigger unlock if criteria met
- [ ] Implement multi-tier achievement progression (Bronze → Silver → Gold)
- [ ] Implement supply-limited achievements (decrement `currentHolders`, check `totalSupply`)
- [ ] Write unit tests (30+ tests)

**Deliverables:**
- Complete achievement system (admin + user services)
- JSON Logic evaluation engine
- Achievement auto-evaluation on point awards

### Week 3: Streak Tracking

#### 3.1 Streak Service

**Objective:** Implement daily streak tracking with grace periods, freeze tokens, and velocity scoring.

**Tasks:**

- [ ] Implement `streak-service.ts`:
  - `getStreakStatus()` — get current streak state
  - `recordStreakActivity()` — record qualifying activity
    - Check if within grace period → increment streak
    - Check if grace expired → check freeze tokens → consume or reset
    - Update `longestStreak` if new record
    - Calculate new `expiresAt` (now + grace hours)
  - `useStreakFreeze()` — manually consume a freeze token
  - `purchaseStreakFreeze()` — buy freeze with points (calls `deductPoints()`)
  - `getStreakHistory()` — historical daily snapshots
  - `getStreakVelocity()` — 7-day rolling activity analysis
- [ ] Implement streak expiration checker (cron: every 30 minutes)
  - Identify streaks where `expiresAt < now`
  - Check for available freeze tokens → auto-consume
  - If no freeze → emit `streak.broken` event, reset streak
- [ ] Implement at-risk detector (cron: every 30 minutes)
  - Identify streaks where `expiresAt - now < 4 hours`
  - Set `isAtRisk = true`
  - Emit `streak.at_risk` notification event
- [ ] Implement velocity tracker:
  - 7-day rolling activity window
  - Trend detection: accelerating / stable / decelerating
  - Days since peak activity
- [ ] Write unit tests covering all streak state transitions (40+ tests)

**Grace Period State Machine:**

```
┌─────────────────────────────────────────────────────────────┐
│                  Streak State Machine                        │
│                                                             │
│  Activity Recorded ──┐                                      │
│                      ▼                                      │
│  ┌──────────────────────────────────┐                      │
│  │  Within Grace Period?             │                      │
│  │  (lastActivityAt + graceHours     │                      │
│  │   > now)                          │                      │
│  └──────┬───────────────┬────────────┘                      │
│     YES │               │ NO                                │
│         ▼               ▼                                   │
│  ┌──────────┐  ┌─────────────────┐                         │
│  │ Increment │  │ Freeze Available?│                         │
│  │ streak    │  └───┬──────────┬──┘                         │
│  │           │   YES│          │ NO                          │
│  └──────────┘      ▼          ▼                             │
│                ┌─────────┐ ┌──────────┐                     │
│                │ Consume  │ │  RESET   │                     │
│                │ freeze,  │ │ streak=1 │                     │
│                │ maintain │ │ emit     │                     │
│                │ streak   │ │ broken   │                     │
│                └─────────┘ └──────────┘                     │
│                                                             │
│  In all cases:                                              │
│  → Update expiresAt = now + graceHours                      │
│  → Update lastActivityAt = now                              │
│  → Recalculate velocity                                     │
│  → Check if longestStreak broken                            │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**Deliverables:**
- Complete streak service with grace periods and freezes
- Streak expiration and at-risk cron workers
- Velocity tracking with trend analysis

### Week 4: RLS Policies, Error System & Client Hooks

#### 4.1 Row-Level Security

**Objective:** Implement Supabase RLS policies for all Phase 1 tables.

**Tasks:**

- [ ] Define RLS policies for `point_balances`:
  - Users SELECT own balances only (`auth.uid() = user_id`)
  - INSERT/UPDATE only via service role
- [ ] Define RLS policies for `point_transactions`:
  - Users SELECT own transactions only
  - INSERT only via service role (no UPDATE, no DELETE ever)
- [ ] Define RLS policies for `achievements`:
  - All authenticated users can SELECT (read catalog)
  - INSERT/UPDATE/DELETE only for `engagement_admin` role
- [ ] Define RLS policies for `user_achievements`:
  - Users SELECT own achievements only
  - INSERT/UPDATE via service role
- [ ] Define RLS policies for `streaks`:
  - Users SELECT own streak only
  - UPDATE via service role
- [ ] Define tenant isolation policy:
  - All queries filtered by `tenant_id` matching user's current venture
- [ ] Write RLS integration tests (verify unauthorized access is blocked)

#### 4.2 Error Handling System

**Objective:** Implement the typed error hierarchy for engagement operations.

**Tasks:**

- [ ] Create base `EngagementError` class with error code and HTTP status mapping
- [ ] Implement Phase 1 error classes:
  - `InsufficientBalanceError`
  - `DailyCapExceededError`
  - `MaxBalanceExceededError`
  - `InvalidTransactionError`
  - `AchievementNotFoundError`
  - `AchievementAlreadyUnlockedError`
  - `AchievementSupplyExhaustedError`
  - `StreakAlreadyRecordedError`
  - `NoFreezeAvailableError`
  - `StreakExpiredError`
- [ ] Implement error serialization for client consumption
- [ ] Write error handling middleware for consistent error responses

#### 4.3 Client Hooks (Phase 1)

**Objective:** Build React hooks for points, achievements, and streaks.

**Tasks:**

- [ ] Implement `usePoints` hook:
  - Fetch balance and recent transactions
  - Subscribe to Supabase Realtime for balance updates
  - Expose `refetch()` for manual refresh
- [ ] Implement `useAchievements` hook:
  - Fetch user achievement profile with stats
  - Real-time unlock notifications via Supabase Realtime
  - Filter by category, rarity, status
- [ ] Implement `useStreak` hook:
  - Fetch current streak status
  - Expose `checkIn()` action for recording activity
  - Expose `purchaseFreeze()` action
  - Real-time at-risk warnings
- [ ] Build Phase 1 client components:
  - `PointsDisplay` — balance display with currency icon
  - `PointsHistory` — transaction list with infinite scroll
  - `AchievementGrid` — achievement collection grid
  - `AchievementToast` — unlock notification toast
  - `StreakFlame` — streak counter with flame animation
  - `StreakCalendar` — activity calendar heatmap

**Deliverables:**
- 3 React hooks with real-time subscriptions
- 6 client components with Tailwind styling
- RLS policies for all Phase 1 tables
- Typed error hierarchy

### Phase 1 Exit Criteria

- [ ] Point ledger supports create/award/deduct/transfer with ACID guarantees
- [ ] Multiple currency types (soft, hard, energy) can be created per venture
- [ ] Daily cap enforcement prevents over-earning
- [ ] Idempotency prevents duplicate point awards
- [ ] Achievement system supports JSON Logic-based unlock conditions
- [ ] Multi-tier achievements (Bronze/Silver/Gold) track progress
- [ ] Streak tracking with 36-hour grace period and freeze tokens
- [ ] Velocity scoring detects engagement trend changes
- [ ] All tables have RLS policies enforced
- [ ] Client hooks provide real-time updates via Supabase Realtime
- [ ] 90%+ test coverage on all services
- [ ] All Zod schemas validate inputs with helpful error messages

---

## Phase 2 — Core

**Duration:** 5 weeks  
**Goal:** Build the competitive and progressive engagement systems — leaderboards, quests, progression/leveling, and the event-driven earn rules engine.

### Week 5: Leaderboard System

#### 5.1 Redis Integration & Leaderboard Service

**Objective:** Implement real-time leaderboards using Redis Sorted Sets.

**Tasks:**

- [ ] Set up Redis client (Upstash) with connection pooling
- [ ] Define Redis key schema:
  - `lb:{slug}:{period}:{ventureId}` — sorted set
  - `lb:{slug}:{period}:{ventureId}:meta` — hash (metadata)
- [ ] Create `engagement.leaderboards` table (Drizzle ORM) for definitions
- [ ] Create `engagement.leaderboard_snapshots` table for historical data
- [ ] Implement `leaderboard-service.ts`:
  - `createLeaderboard()` — define leaderboard with scoring config
  - `listLeaderboards()` — list available leaderboards
  - `getRankings()` — get top N via `ZREVRANGE` (O(log N + M))
  - `getUserRank()` — get rank via `ZREVRANK` + surrounding via `ZREVRANGE`
  - `updateScore()` — update via `ZADD` (O(log N))
    - Support cumulative (ZINCRBY), snapshot (ZADD), max (ZADD GT)
  - `rotateLeaderboard()` — archive + reset
    1. Snapshot all entries to PostgreSQL
    2. Calculate reward tiers
    3. Enqueue reward distribution
    4. DEL sorted set + recreate
  - `getLeaderboardHistory()` — fetch historical snapshots
- [ ] Implement rotation cron scheduler:
  - Parse cron expressions from `rotation_schedule`
  - Execute rotation at schedule boundary
- [ ] Implement score update listener:
  - Subscribe to `points.awarded` events
  - Map point awards to relevant leaderboards
  - Issue ZADD commands
- [ ] Write integration tests with Redis (use test containers or mock)

**Redis Performance Benchmarks (Required):**

| Operation | Target Latency | Redis Command |
|-----------|---------------|---------------|
| Score update | < 1ms | `ZADD` / `ZINCRBY` |
| Rank lookup | < 1ms | `ZREVRANK` |
| Top 100 | < 2ms | `ZREVRANGE 0 99 WITHSCORES` |
| Surrounding ±5 | < 1ms | `ZREVRANGE rank-5 rank+5` |
| Total count | < 0.5ms | `ZCARD` |

#### 5.2 Leaderboard Client Components

**Tasks:**

- [ ] Implement `useLeaderboard` hook with real-time rank updates
- [ ] Build `LeaderboardTable` component — sortable, paginated table
- [ ] Build `LeaderboardPodium` component — top 3 visual display
- [ ] Implement rank change indicators (↑ ↓ arrows, green/red colors)
- [ ] Implement anonymization for players outside top N

**Deliverables:**
- Leaderboard service with Redis Sorted Set backend
- Rotation system with historical snapshots
- Real-time score updates from point transactions
- Client hook and 2 display components

### Week 6: Quest System

#### 6.1 Quest Admin Service

**Objective:** Build the quest definition system with 9 quest types and JSON Logic requirements.

**Tasks:**

- [ ] Create `engagement.quests` table (Drizzle ORM) — already defined in schema
- [ ] Create `engagement.user_quests` table — per-user progress tracking
- [ ] Implement `quest-admin-service.ts`:
  - `createQuest()` — create quest with type, requirements, rewards
  - `updateQuest()` — update quest configuration
  - `listQuests()` — list with filters (type, status, category, tenant)
  - `getQuest()` — get single quest
  - `activateQuest()` — move draft → active
  - `pauseQuest()` — temporarily disable
  - `archiveQuest()` — archive completed/expired
- [ ] Implement quest lifecycle state machine:
  - `draft → scheduled → active → paused → completed → expired → archived`
- [ ] Implement quest chain support:
  - `parentQuestId` — chain parent
  - `prerequisiteQuestIds` — must complete before starting
  - `sequenceOrder` — ordering within a chain
- [ ] Implement compound requirements:
  - AND/OR logic trees (recursive evaluation)
  - Nested compound requirements
- [ ] Write quest seeding script with default quests per venture

#### 6.2 Quest User Service

**Objective:** Build user-facing quest operations with progress tracking and reward claiming.

**Tasks:**

- [ ] Implement `quest-user-service.ts`:
  - `listActiveQuests()` — quests available to user (filtered by tier, segment)
  - `getQuestProgress()` — current progress on specific quest
  - `claimQuestReward()` — claim rewards for completed quest
  - `refreshDailyQuests()` — reset daily objectives
    - Expire old daily quests
    - Select new quests from pool (random or AI-personalized in Phase 3)
    - Create fresh `user_quests` entries
    - Respect `MAX_ACTIVE_QUESTS_PER_USER` (default: 10)
- [ ] Implement quest progress updater (event-driven):
  - On each `EngagementEvent`, check matching quest requirements
  - Increment `current_progress` on matching `user_quests`
  - For compound requirements, update `compound_progress` JSON
  - If `current_progress >= target_progress` → mark completed
  - Emit `quest.progress` and `quest.completed` events
- [ ] Implement completion limit enforcement:
  - `maxCompletionsPerUser` — per-user limit
  - `maxCompletionsGlobal` — global supply (limited quests)
  - `cooldownHours` — minimum time between completions
- [ ] Implement daily/weekly quest refresh cron
- [ ] RLS policies for `quests` and `user_quests` tables
- [ ] Write 40+ unit tests for quest progress evaluation

**Deliverables:**
- Complete quest system (admin + user services)
- Compound requirement evaluation
- Quest chain support with prerequisites
- Daily/weekly auto-refresh

### Week 7: Progression & Leveling

#### 7.1 Progression Service

**Objective:** Build the XP/leveling system with configurable curves, tier advancement, and prestige.

**Tasks:**

- [ ] Create `engagement.levels` table (user level state)
- [ ] Create `engagement.level_configs` table (XP curve configurations)
- [ ] Implement `progression-service.ts`:
  - `getUserLevel()` — get current level, XP, tier, prestige
  - `addXP()` — add XP and check for level-up
    - Calculate new level from accumulated XP using curve function
    - If level changed → emit `level.up` event, award level-up rewards
    - If tier changed → emit `tier.promoted` event
  - `getLevelConfig()` — get XP curve config
  - `updateLevelConfig()` — update curve parameters (admin)
  - `getPrestigeStatus()` — get prestige level and bonuses
  - `activatePrestige()` — reset level for permanent bonus
    - Verify user is at max level
    - Reset level to 1, increment prestige counter
    - Apply permanent earn bonus (+5% per prestige)
  - `getTierStatus()` — get tier advancement progress
  - `promoteTier()` — promote user to next tier
- [ ] Implement XP curve calculator:
  - Linear: `xp = base * level`
  - Polynomial: `xp = base * level^exponent` (default)
  - Exponential: `xp = base * growth^level`
  - Custom: `xp = lookupTable[level]`
- [ ] Implement tier thresholds:
  - Bronze: levels 1–10
  - Silver: levels 11–25
  - Gold: levels 26–50
  - Platinum: levels 51–75
  - Diamond: levels 76–100
- [ ] Hook XP awards into earn pipeline (earn action → points + XP)
- [ ] Write unit tests for all curve types and edge cases

**XP Curve Verification Test:**

```typescript
// Ensure polynomial curve (base=100, exp=1.5) produces expected values
test('polynomial XP curve', () => {
  const curve = { type: 'polynomial', base: 100, exponent: 1.5, maxLevel: 100 };
  expect(xpForLevel(curve, 1)).toBe(100);
  expect(xpForLevel(curve, 10)).toBeCloseTo(3162, 0);
  expect(xpForLevel(curve, 50)).toBeCloseTo(35355, 0);
  expect(xpForLevel(curve, 100)).toBeCloseTo(100000, 0);
});
```

#### 7.2 Progression Client Components

**Tasks:**

- [ ] Implement `useProgression` hook with real-time level-up notifications
- [ ] Build `LevelProgressBar` component — animated XP progress bar
- [ ] Build `TierBadge` component — tier display with icon and color

**Deliverables:**
- Progression service with 4 curve types
- Tier advancement and prestige systems
- XP integration with earn pipeline

### Week 8: Earn Rules Engine

#### 8.1 Earn Service

**Objective:** Build the earn action registry that maps venture events to point/XP awards.

**Tasks:**

- [ ] Create `engagement.earn_actions` table (Drizzle ORM)
- [ ] Create `engagement.earn_history` table (earn event log)
- [ ] Implement `earn-service.ts`:
  - `registerEarnAction()` — register event → reward mapping
  - `updateEarnAction()` — update mapping
  - `listEarnActions()` — list per venture
  - `getEarnAction()` — get single action
  - `processEarnEvent()` — process incoming event
    1. Match `event.type` against registered earn actions
    2. Evaluate JSON Logic filters
    3. Check daily/weekly caps and cooldown
    4. Calculate multiplier stack (base × Π(multipliers))
    5. Call `awardPoints()` and `addXP()`
    6. Log to `earn_history`
  - `getEarnHistory()` — user's earn event history
- [ ] Implement multiplier stack evaluation:
  - Load all applicable `EarnMultiplier` rules
  - Evaluate each JSON Logic condition against event context
  - Multiply matching multipliers together
  - Apply ACS adjustment multiplier (from economic-service, Phase 4)
- [ ] Implement cooldown tracking (Redis-backed):
  - Key: `earn:cooldown:{userId}:{actionSlug}`
  - TTL: `cooldownMinutes * 60`
  - Check before awarding; if exists, skip
- [ ] Seed default earn actions for each venture

#### 8.2 Event Processing Pipeline

**Objective:** Build the central `EngagementProcessor` that consumes Redpanda events and orchestrates all submodule evaluations.

**Tasks:**

- [ ] Implement `event-processor.ts`:
  - `processEngagementEvent()` — orchestrate full pipeline
    1. Validate event (Zod)
    2. Check idempotency (Redis)
    3. Process earn rules → award points/XP
    4. Evaluate quest requirements → update progress
    5. Check achievement criteria → unlock if met
    6. Record streak activity
    7. Update leaderboard scores
    8. Persist all changes in ACID transaction
    9. Emit output events to `mcv.engagement.processed`
    10. Push WebSocket notifications
  - `evaluateRules()` — JSON Logic evaluation utility
  - `EngagementProcessor` class — streaming Redpanda consumer
    - Configurable concurrency (one consumer per partition)
    - Graceful shutdown with offset commit
    - Error handling with DLQ routing
- [ ] Set up Redpanda topic creation:
  - `mcv.engagement.raw` (12 partitions)
  - `mcv.engagement.processed` (12 partitions)
  - `mcv.engagement.dlq` (3 partitions)
- [ ] Implement dead letter queue routing:
  - Transient errors → retry with exponential backoff (3 attempts)
  - Validation errors → DLQ immediately
  - Fraud detection → DLQ + alert
- [ ] Write integration tests for full pipeline (mock Redpanda or use testcontainers)

**Deliverables:**
- Earn rules engine with multiplier stacks and cooldowns
- Central event processor consuming from Redpanda
- Dead letter queue for failed events
- Full pipeline integration tests

### Week 9: Phase 2 Client Components & Integration

#### 9.1 Quest and Earn Client Components

**Tasks:**

- [ ] Implement `useQuests` hook with daily refresh detection
- [ ] Build `QuestList` component — active quest overview
- [ ] Build `QuestCard` component — individual quest with progress bar
- [ ] Implement `useEngagementEvents` hook — real-time event subscription

#### 9.2 Integration Testing

**Tasks:**

- [ ] End-to-end integration test: venture event → earn → points → quest progress → achievement unlock
- [ ] Load test: simulate 1,000 concurrent events/second through pipeline
- [ ] Leaderboard stress test: 100,000 concurrent users, verify latency targets
- [ ] Verify all RLS policies for Phase 2 tables

### Phase 2 Exit Criteria

- [ ] Leaderboards update in real-time via Redis Sorted Sets (< 2ms p99)
- [ ] Leaderboard rotation archives snapshots and distributes rewards
- [ ] Quest system supports all 9 quest types with compound requirements
- [ ] Quest chains enforce prerequisite ordering
- [ ] Daily/weekly quests auto-refresh on schedule
- [ ] Progression system calculates levels from XP using configurable curves
- [ ] Tier advancement triggers at correct level thresholds
- [ ] Prestige reset works correctly (level reset + permanent bonus)
- [ ] Earn rules engine matches events to actions with multiplier stacks
- [ ] Event processor handles 5,000+ events/sec with < 150ms p50 latency
- [ ] Dead letter queue captures failed events without data loss
- [ ] All Phase 2 tables have RLS policies
- [ ] 90%+ test coverage on all new services

---

## Phase 3 — Advanced

**Duration:** 5 weeks  
**Goal:** Build the premium engagement features — seasonal battle passes, AI-personalized challenges, cross-venture engagement, and the reward marketplace.

### Week 10: Seasons & Battle Passes

#### 10.1 Season Service

**Objective:** Implement time-bounded competitive seasons with tiered reward tracks.

**Tasks:**

- [ ] Create `engagement.seasons` table (Drizzle ORM)
- [ ] Create `engagement.season_progress` table (per-user season state)
- [ ] Implement `season-service.ts`:
  - `createSeason()` — define season with reward track
  - `updateSeason()` — update season config
  - `getActiveSeason()` — get current active season
  - `listSeasons()` — list all seasons (past, current, future)
  - `getSeasonProgress()` — user's XP and tier in current season
  - `getSeasonRewardTrack()` — full reward track tiers
  - `claimSeasonReward()` — claim a tier reward
    - Verify user has enough season XP
    - Verify tier not already claimed
    - Distribute reward bundle
  - `endSeason()` — manual season end (admin)
- [ ] Implement season lifecycle manager:
  - Cron: check `startsAt` / `endsAt` for transitions
  - `upcoming → active → ending_soon (72h before end) → ended → archived`
- [ ] Implement season XP tracking:
  - Hook into earn pipeline: when season active, add season XP proportional to earned points
  - Apply season `xpMultiplier` to all earn actions
- [ ] Implement exclusive achievements:
  - Season-only achievements that can only be unlocked during active season
  - Mark as permanently locked when season ends
- [ ] Implement optional entry fee (battle pass purchase):
  - Premium reward track unlocked on payment
  - Free track available to all users
- [ ] Implement `useSeason` hook and `SeasonBanner` / `SeasonRewardTrack` components

**Deliverables:**
- Complete season/battle pass system
- Lifecycle manager with automatic transitions
- Season XP tracking integrated with earn pipeline
- Client components for season display

### Week 11: AI-Personalized Challenges

#### 11.1 AI Quest Generation

**Objective:** Use OpenRouter AI to generate personalized quests tailored to individual user behavior patterns.

**Tasks:**

- [ ] Integrate OpenRouter AI client
- [ ] Build user behavior profile aggregator:
  - Most common actions (from earn history)
  - Preferred quest types (from completion history)
  - Engagement level (from velocity scoring)
  - Skill level (from tier and level)
  - Active time patterns (from activity timestamps)
- [ ] Implement AI quest generator:
  - Input: user behavior profile + available quest templates
  - Output: personalized quest selection with difficulty calibration
  - Prompt engineering for consistent, balanced quest generation
  - Fallback to random selection if AI unavailable
- [ ] Implement difficulty auto-calibration:
  - Track quest completion rates per difficulty level
  - If completion rate > 80% → suggest harder quests
  - If completion rate < 30% → suggest easier quests
  - Aim for 50-70% completion "flow state" zone
- [ ] Integrate AI quest selection into `refreshDailyQuests()`:
  - Replace random selection with AI-personalized selection
  - A/B test AI vs random to measure engagement lift
- [ ] Write tests with mocked AI responses

**AI Quest Personalization Flow:**

```
User Behavior Profile:
  - Frequent bettor (avg 5 bets/day)
  - Prefers sports markets
  - Level 23, Silver tier
  - 12-day streak, accelerating velocity
  - Completes 65% of daily quests

AI generates personalized daily quests:
  1. "Place 3 NFL bets today" (easy, aligned with preference)
  2. "Try an esports bet" (stretch goal, new category)
  3. "Win 2 consecutive bets" (skill challenge, moderate difficulty)
```

### Week 12: Cross-Venture Engagement

#### 12.1 Platform-Wide Engagement

**Objective:** Enable engagement features that span multiple ventures, creating a unified platform experience.

**Tasks:**

- [ ] Implement platform-wide currencies (tenant_id = null):
  - Platform XP that accumulates across all ventures
  - Universal reputation score
- [ ] Implement cross-venture achievements:
  - "Use 3 different MCV ventures in one week"
  - "Earn 1,000 points across any combination of ventures"
- [ ] Implement cross-venture leaderboards:
  - Global leaderboard aggregating scores from all ventures
  - Platform-level seasonal rankings
- [ ] Implement referral quest system:
  - Quest: "Invite a friend to BetEdge"
  - Track referral completion across ventures
  - Award both referrer and referee
- [ ] Implement team/guild system (foundation):
  - Create teams with member management
  - Team-based leaderboards
  - Collaborative quests (community type)
- [ ] Integration with CDP for cross-venture user profiles

### Week 13: Reward Marketplace

#### 13.1 Reward Service

**Objective:** Build the full reward catalog with redemption, fulfillment, and token conversion.

**Tasks:**

- [ ] Create `engagement.rewards` table (Drizzle ORM)
- [ ] Create `engagement.redemptions` table (redemption records)
- [ ] Implement `reward-service.ts`:
  - `createReward()` — add to catalog with stock tracking
  - `updateReward()` — update details, restock
  - `listRewards()` — catalog with filters (category, price range, availability)
  - `getReward()` — single reward detail
  - `redeemReward()` — full redemption flow:
    1. Validate reward availability and stock
    2. Check per-user limit and cooldown
    3. Deduct points (via `deductPoints()`)
    4. Reserve stock (decrement `stock_available`, increment `stock_reserved`)
    5. Create redemption record (status: 'pending')
    6. Trigger fulfillment (digital: instant, physical: webhook to commerce)
    7. Emit `reward.redeemed` event
  - `getRedemptionHistory()` — user's redemption log
  - `fulfillRedemption()` — mark as fulfilled (admin)
  - `refundRedemption()` — refund points and restore stock (admin)
- [ ] Implement reward categories:
  - **Digital** — instant fulfillment (badges, cosmetics, multipliers)
  - **Physical** — webhook to @mcv/commerce for shipping
  - **Experience** — access/privilege grants
  - **Token** — bridge to @mcv/token-economy for on-chain tokens
- [ ] Implement token conversion bridge:
  - Call `token-economy.mintTokens()` for token rewards
  - Handle saga compensation on failure (refund points)
- [ ] Implement NFT minting for achievements:
  - Call `token-economy.mintNFT()` via Solana
  - Track mint address on `user_achievements`
- [ ] Build `useRewards` hook, `RewardCatalog` and `RewardRedemptionModal` components

### Week 14: Phase 3 Integration & Client Polish

**Tasks:**

- [ ] Build `QuestBuilder` component (no-code quest creation for admins)
- [ ] Build `AchievementShowcase` component (profile display)
- [ ] Build `EconomicDashboard` component (admin view)
- [ ] Integration test: full season lifecycle (create → active → end → archive)
- [ ] Integration test: reward redemption → commerce fulfillment → status update
- [ ] Integration test: token conversion → Solana transaction → confirmation
- [ ] Cross-venture integration tests

### Phase 3 Exit Criteria

- [ ] Seasons support full lifecycle with automatic state transitions
- [ ] Reward tracks distribute exclusive season rewards correctly
- [ ] AI generates personalized daily quests based on user behavior
- [ ] AI difficulty calibration targets 50-70% completion rate
- [ ] Cross-venture currencies and achievements function correctly
- [ ] Referral quests track completions across ventures
- [ ] Reward marketplace supports 4 categories with stock management
- [ ] Token conversion bridges to Solana via token-economy domain
- [ ] NFT achievement minting works end-to-end
- [ ] Saga compensation refunds points on fulfillment failure
- [ ] All Phase 3 client components are styled and responsive

---

## Phase 4 — Polish & Optimization

**Duration:** 3 weeks  
**Goal:** Harden the system with fraud detection, economic monitoring, performance optimization, and production-ready observability.

### Week 15: Fraud Detection & Economic Monitoring

#### 15.1 Scout Agent (Fraud Detection)

**Objective:** Build the anomaly detection agent that monitors for abusive patterns.

**Tasks:**

- [ ] Create `engagement.fraud_alerts` table
- [ ] Implement `scout-service.ts`:
  - `ScoutAgent` class — continuous monitoring
    - **Velocity analysis** — detect users exceeding events/minute threshold
    - **Pattern detection** — identical actions at regular intervals (bot behavior)
    - **Burst detection** — sudden spikes in earn rate
    - **Collusion detection** — coordinated transfers between accounts
  - `getAnomalyReport()` — aggregated anomaly data
  - `getFraudAlerts()` — active alert list
  - `resolveAlert()` — mark alert as resolved with notes
- [ ] Integrate Scout into event processing pipeline:
  - Run analysis on every processed event
  - If velocity exceeds threshold → block event + raise alert
  - If anomaly score > threshold → raise alert (don't block)
- [ ] Implement alert severity classification:
  - Low: unusual pattern, no action needed
  - Medium: suspicious, review required
  - High: likely abuse, temporary block
  - Critical: confirmed abuse, immediate block
- [ ] Set up Slack/webhook notifications for high/critical alerts

#### 15.2 Economic Monitoring (ACS v2.0)

**Objective:** Build the Auto-Calibration System that monitors point economy health and adjusts multipliers automatically.

**Tasks:**

- [ ] Create `engagement.economic_snapshots` table
- [ ] Implement `economic-service.ts`:
  - `getEconomicHealth()` — compute current health metrics
    - Total inflow (taps): earn, quests, referrals, admin grants
    - Total outflow (sinks): freezes, cosmetics, conversions, expirations
    - Net inflation: `(inflow - outflow) / total_supply`
    - Week-over-week change
    - Health score (0-100 composite)
    - Regime: healthy / inflationary / deflationary / critical
  - `getTapSinkReport()` — detailed inflow/outflow breakdown
  - `getInflationMetrics()` — WoW inflation tracking
  - `adjustMultipliers()` — manual or automatic adjustment
  - `getEconomicHistory()` — historical snapshots
- [ ] Implement ACS v2.0 automatic adjustment:
  - If net inflation > 15% WoW → activate ACS:
    - Reduce earn multipliers by 0.2x
    - Increase sink costs by 10%
  - If net inflation < -5% WoW → boost mode:
    - Increase earn multipliers by 0.2x
    - Introduce bonus earn events
  - Recalibrate weekly
- [ ] Implement daily economic snapshot cron
- [ ] Build `EconomicDashboard` admin component

### Week 16: Performance Optimization

#### 16.1 Query Optimization

**Tasks:**

- [ ] Analyze slow queries with `EXPLAIN ANALYZE`
- [ ] Add missing indexes based on query patterns
- [ ] Implement `point_transactions` table partitioning (by month)
- [ ] Set up PostgreSQL read replica for heavy read queries (analytics)
- [ ] Optimize Drizzle ORM queries:
  - Batch inserts for multi-reward distributions
  - Reduce N+1 queries in quest progress evaluation
  - Use prepared statements for hot-path queries

#### 16.2 Caching Optimization

**Tasks:**

- [ ] Implement Redis caching for hot data:
  - Earn action rules (5 min TTL, pub/sub invalidation)
  - Quest definitions (5 min TTL, pub/sub invalidation)
  - Achievement definitions (10 min TTL)
  - Streak status (30 min TTL)
- [ ] Implement cache warming on deployment
- [ ] Add cache hit/miss metrics to observability

#### 16.3 Event Pipeline Optimization

**Tasks:**

- [ ] Optimize Redpanda consumer throughput:
  - Batch processing (process 10 events per batch)
  - Parallel submodule evaluation within single event
  - Pipeline Redis commands (MULTI/EXEC for multiple ZADD)
- [ ] Implement backpressure handling:
  - If consumer lag > 10,000 messages, scale consumers
  - Alert on sustained lag

#### 16.4 Load Testing

**Tasks:**

- [ ] Benchmark event processing throughput:
  - Target: 5,000+ events/sec sustained
  - Measure p50, p95, p99 latency
- [ ] Benchmark leaderboard operations:
  - Target: < 2ms for rank lookup with 100K+ entries
- [ ] Benchmark point transactions:
  - Target: 1,000+ ACID transactions/sec
- [ ] Stress test concurrent streak operations:
  - Simulate 10,000 concurrent streak check-ins
- [ ] Document performance baseline

### Week 17: Observability & Production Readiness

#### 17.1 Metrics & Monitoring

**Tasks:**

- [ ] Implement OpenTelemetry metrics:
  - `engagement.events.processed` (counter)
  - `engagement.events.latency_ms` (histogram)
  - `engagement.points.awarded` / `points.spent` (counters)
  - `engagement.quests.completed` (counter)
  - `engagement.achievements.unlocked` (counter)
  - `engagement.streaks.maintained` / `broken` (counters)
  - `engagement.economic.inflation` (gauge)
  - `engagement.economic.health_score` (gauge)
  - `engagement.fraud.alerts` (counter)
  - `engagement.redis.latency_ms` (histogram)
  - `engagement.db.query_latency_ms` (histogram)
- [ ] Implement structured JSON logging for all operations
- [ ] Set up alerting rules:
  - Event processing lag > 10K messages → Critical
  - Redis unavailable → Critical
  - Economic inflation > 15% → Warning
  - Health score < 30 → Critical
  - Fraud alerts > 50/hour → Critical
  - DLQ > 100 messages → Warning

#### 17.2 Documentation & Deployment

**Tasks:**

- [ ] Final pass on API documentation
- [ ] Create operational runbook:
  - How to investigate failed events (DLQ)
  - How to manually adjust economy (ACS override)
  - How to resolve fraud alerts
  - How to rotate leaderboards manually
  - How to roll back a problematic season
- [ ] Create venture onboarding guide:
  - How to register earn actions for your venture
  - How to create venture-specific quests and achievements
  - How to configure currencies
  - How to set up leaderboards
- [ ] Production deployment checklist
- [ ] Rollback plan documentation

### Phase 4 Exit Criteria

- [ ] Scout agent detects velocity abuse with < 1% false positive rate
- [ ] ACS automatically adjusts multipliers when inflation exceeds threshold
- [ ] Economic dashboard provides real-time health visibility
- [ ] Event processing sustains 5,000+ events/sec
- [ ] All latency targets met (see Performance Architecture in Technical Architecture doc)
- [ ] OpenTelemetry metrics flowing to monitoring system
- [ ] Alerting rules trigger correctly on threshold breach
- [ ] Operational runbook covers all critical scenarios
- [ ] Venture onboarding guide enables self-service configuration

---

## Testing Strategy

### Test Pyramid

```
        ┌───────────────┐
        │    E2E Tests   │  ← 10% (critical user journeys)
        │   (Playwright)  │
        ├───────────────┤
        │  Integration    │  ← 30% (service interactions, Redis, DB)
        │  Tests (Vitest) │
        ├───────────────┤
        │   Unit Tests    │  ← 60% (business logic, pure functions)
        │   (Vitest)      │
        └───────────────┘
```

### Unit Tests

| Service | Min Tests | Focus |
|---------|-----------|-------|
| `point-service` | 30 | ACID transactions, daily caps, idempotency, concurrency |
| `achievement-admin-service` | 15 | CRUD, validation, JSON Logic storage |
| `achievement-user-service` | 25 | Unlock logic, progress tracking, supply limits, NFT minting |
| `streak-service` | 40 | State machine transitions, grace periods, freezes, velocity |
| `leaderboard-service` | 25 | Redis operations, rotation, snapshots, surrounding players |
| `quest-admin-service` | 15 | CRUD, lifecycle state machine, chain validation |
| `quest-user-service` | 35 | Progress tracking, compound requirements, completion limits |
| `progression-service` | 20 | XP curves (all 4 types), level-up detection, prestige, tiers |
| `earn-service` | 25 | Action matching, multiplier stacks, caps, cooldowns |
| `event-processor` | 30 | Full pipeline, error handling, DLQ routing, idempotency |
| `reward-service` | 25 | Catalog, stock management, redemption lifecycle, refunds |
| `season-service` | 20 | Lifecycle transitions, reward tracks, exclusive content |
| `economic-service` | 15 | Health calculation, ACS thresholds, snapshots |
| `scout-service` | 15 | Velocity detection, anomaly scoring, alert generation |
| JSON Logic evaluator | 20 | All operators, edge cases, malformed rules |

**Total target: 355+ unit tests, 90%+ coverage**

### Integration Tests

| Scenario | Components |
|----------|-----------|
| Event → earn → points → leaderboard | Earn, Points, Leaderboard, Redis |
| Event → quest progress → completion → rewards | Quest, Points, Progression |
| Event → achievement unlock → NFT mint | Achievement, Token-Economy (mock) |
| Streak check-in → freeze consumption → reset | Streak, Points |
| Season start → XP tracking → reward claim | Season, Earn, Points |
| Reward redemption → commerce fulfillment | Reward, Commerce (mock) |
| Leaderboard rotation → snapshot → reward distribution | Leaderboard, Redis, Points |
| Concurrent point awards → no overdraft | Points (concurrency) |
| Daily cap → rejection → error response | Points, Earn |
| Fraud detection → event block → alert | Scout, Event Processor |

### E2E Tests (Playwright)

| Journey | Steps |
|---------|-------|
| **New user onboarding** | Sign up → complete onboarding quests → earn first points → unlock first achievement |
| **Daily engagement loop** | Login → check streak → view daily quests → complete quest → claim reward → view leaderboard |
| **Achievement unlock** | Perform qualifying actions → achievement toast appears → view in profile → mint NFT |
| **Reward redemption** | Browse catalog → select reward → confirm redemption → points deducted → status shown |
| **Season participation** | View season banner → earn season XP → reach tier → claim tier reward |
| **Leaderboard competition** | Earn points → rank updates → view surrounding players → period end → rewards received |

### Load Tests

| Scenario | Target | Tool |
|----------|--------|------|
| Event throughput | 5,000 events/sec sustained for 10 min | k6 / Artillery |
| Leaderboard read | 10,000 concurrent rank lookups | k6 |
| Point transaction | 1,000 concurrent award operations | k6 |
| Streak check-in burst | 10,000 concurrent check-ins at midnight | k6 |
| Mixed workload | 70% reads / 30% writes, 5,000 req/sec | k6 |

---

## Acceptance Criteria

### Functional Requirements

| ID | Requirement | Phase |
|----|-------------|-------|
| F01 | Multiple currency types can be created per venture (soft, hard, energy, etc.) | 1 |
| F02 | Points are awarded atomically with ACID transaction guarantees | 1 |
| F03 | Idempotency keys prevent duplicate point awards | 1 |
| F04 | Daily earn caps are enforced per currency type | 1 |
| F05 | Point transfers between users are atomic (sender debit + receiver credit) | 1 |
| F06 | Achievements unlock based on JSON Logic conditions | 1 |
| F07 | Multi-tier achievements track progress through Bronze → Gold | 1 |
| F08 | Supply-limited achievements enforce total supply cap | 1 |
| F09 | Streaks track consecutive days with configurable grace period | 1 |
| F10 | Streak freeze tokens can be purchased and consumed | 1 |
| F11 | Velocity scoring detects engagement trend changes | 1 |
| F12 | Leaderboards update in real-time via Redis Sorted Sets | 2 |
| F13 | Leaderboards rotate on schedule with snapshot archival | 2 |
| F14 | Leaderboard rewards distribute to top-ranked players | 2 |
| F15 | 9 quest types are supported (daily, weekly, milestone, chain, etc.) | 2 |
| F16 | Compound quest requirements (AND/OR trees) evaluate correctly | 2 |
| F17 | Quest chains enforce prerequisite ordering | 2 |
| F18 | Daily quests auto-refresh on schedule | 2 |
| F19 | XP curves calculate levels correctly for all 4 curve types | 2 |
| F20 | Tier advancement triggers at correct level thresholds | 2 |
| F21 | Prestige resets level and grants permanent bonus | 2 |
| F22 | Earn actions match events with multiplier stacks | 2 |
| F23 | Event processor handles full pipeline in < 150ms (p50) | 2 |
| F24 | Seasons support full lifecycle with reward tracks | 3 |
| F25 | AI generates personalized quests based on user behavior | 3 |
| F26 | Cross-venture achievements and leaderboards function | 3 |
| F27 | Reward marketplace supports 4 categories with stock management | 3 |
| F28 | Token conversion bridges to Solana via token-economy | 3 |
| F29 | NFT achievement minting works end-to-end | 3 |
| F30 | Scout agent detects velocity abuse | 4 |
| F31 | ACS automatically adjusts earn multipliers for economic balance | 4 |
| F32 | Economic dashboard provides real-time health visibility | 4 |

### Non-Functional Requirements

| ID | Requirement | Target |
|----|-------------|--------|
| NF01 | Event processing throughput | ≥ 5,000 events/sec |
| NF02 | Event processing latency (p50) | ≤ 150ms |
| NF03 | Event processing latency (p99) | ≤ 400ms |
| NF04 | Leaderboard rank lookup latency | ≤ 2ms |
| NF05 | Point transaction throughput | ≥ 1,000 txn/sec |
| NF06 | Test coverage | ≥ 90% |
| NF07 | Availability | 99.9% |
| NF08 | Fraud false positive rate | ≤ 1% |
| NF09 | Data consistency | Zero balance discrepancies |
| NF10 | RLS enforcement | 100% of tables covered |

---

## Risk Assessment

### High Risk

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| **Point economy inflation** | Users accumulate worthless points, engagement drops | Medium | ACS v2.0 auto-calibration, weekly economic reviews, daily cap enforcement |
| **Redis failure** | Leaderboards unavailable, rankings stale | Low | Fallback to PostgreSQL-based ranking (slower but functional), Upstash SLA |
| **Redpanda partition lag** | Events processed late, user experience degraded | Medium | Consumer auto-scaling, alert at 10K lag, horizontal partition expansion |
| **Concurrent balance manipulation** | Race conditions causing incorrect balances | Low | `SELECT ... FOR UPDATE` row locks, ACID transactions, idempotency keys |
| **Token bridge failure** | Points deducted but tokens not minted | Medium | Saga compensation pattern: auto-refund on bridge failure, retry queue |

### Medium Risk

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| **AI quest generation quality** | Irrelevant quests, poor user experience | Medium | Fallback to curated quest pool, A/B testing, human review pipeline |
| **Cross-venture data leakage** | User data from one venture visible in another | Low | Strict tenant_id isolation via RLS + service layer + middleware |
| **Streak freeze abuse** | Users purchase unlimited freezes, streaks become meaningless | Medium | Max freezes per period (default: 3), increasing cost per freeze |
| **Achievement requirement changes** | Changing criteria invalidates existing progress | Medium | Version achievement requirements, grandfather existing progress |
| **Season timing conflicts** | Multiple active seasons causing confusion | Low | Enforce single active season per venture, admin approval required |

### Low Risk

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| **NFT minting gas costs** | Unexpected Solana gas cost spikes | Low | Gas estimation before minting, user confirmation, gas fund monitoring |
| **JSON Logic injection** | Malicious rules causing unexpected evaluation | Low | Sandboxed evaluator, no access to filesystem/network, input size limits |
| **Leaderboard gaming** | Users creating alt accounts to dominate | Medium | Phone verification requirement, Scout agent pattern detection |

### Dependencies & Blockers

| Dependency | Risk Level | Contingency |
|-----------|-----------|-------------|
| Supabase PostgreSQL provisioning | Low | Can use local PostgreSQL for development |
| Redis (Upstash) provisioning | Low | Can use local Redis for development |
| Redpanda cluster setup | Medium | Can use in-memory event queue for development |
| Token-economy domain readiness (Phase 3) | Medium | Mock token bridge; implement actual bridge when available |
| Commerce domain readiness (Phase 3) | Low | Mock fulfillment webhook; implement when available |
| CDP domain readiness (Phase 3) | Low | Fall back to static segments if CDP unavailable |

---

## Timeline & Milestones

### Gantt Overview

```
Week  1  2  3  4  5  6  7  8  9  10 11 12 13 14 15 16 17
      ├──┼──┼──┼──┼──┼──┼──┼──┼──┼──┼──┼──┼──┼──┼──┼──┤
P1    ████████████████                                       Foundation
      │Schema+Points│
      │  Achieve    │
      │  Streaks    │
      │  RLS+Hooks  │
                    │
P2                  ████████████████████                     Core
                    │Leaderboards    │
                    │  Quests        │
                    │  Progression   │
                    │  Earn+Pipeline │
                    │  Integration   │
                                    │
P3                                  ████████████████████     Advanced
                                    │Seasons         │
                                    │  AI Quests     │
                                    │  Cross-Venture │
                                    │  Rewards       │
                                    │  Integration   │
                                                    │
P4                                                  ████████████ Polish
                                                    │Fraud+Econ│
                                                    │  Perf    │
                                                    │  Observe │
```

### Milestones

| Milestone | Date (Relative) | Deliverables |
|-----------|----------------|-------------|
| **M1: Foundation Complete** | Week 4 | Point ledger, achievements, streaks, client hooks |
| **M2: Core Complete** | Week 9 | Leaderboards, quests, progression, earn pipeline |
| **M3: Advanced Complete** | Week 14 | Seasons, AI quests, rewards, token bridge |
| **M4: Production Ready** | Week 17 | Fraud detection, ACS, performance verified, monitoring live |

### Review Checkpoints

| Checkpoint | When | Reviewers | Focus |
|-----------|------|-----------|-------|
| **Architecture Review** | Before Week 1 | Tech Lead, Staff Engineer | Schema design, Redis key schema, event topology |
| **Phase 1 Demo** | End of Week 4 | Product, Design, Engineering | Point flows, achievement unlocks, streak UX |
| **Phase 2 Demo** | End of Week 9 | Product, Design, Engineering | Leaderboard competition, quest engagement, leveling |
| **Security Review** | Week 10 | Security team | RLS policies, fraud detection, input validation |
| **Phase 3 Demo** | End of Week 14 | Product, Design, Business | Season launch, AI personalization, reward catalog |
| **Load Test Review** | Week 16 | SRE, Engineering | Performance benchmarks, scaling limits |
| **Production Readiness Review** | Week 17 | All stakeholders | Final sign-off, deployment plan, rollback strategy |

### Post-Launch (Ongoing)

| Activity | Frequency | Owner |
|----------|-----------|-------|
| Economic health review | Weekly | Product + Engineering |
| Fraud alert triage | Daily | Operations |
| Quest performance analysis | Weekly | Product |
| Achievement rarity recalculation | Weekly (automated) | System |
| Leaderboard rotation verification | Per rotation (automated) | System |
| Season planning | Monthly | Product + Design |
| Performance benchmark | Monthly | SRE |

---

*@mcv/engagement — Engagement & Gamification Domain*
