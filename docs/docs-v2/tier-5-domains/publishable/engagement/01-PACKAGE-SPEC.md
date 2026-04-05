# @mcv/engagement — Engagement Engine
## Platform-Agnostic Behavioral Engagement Infrastructure

**Package:** `@mcv/engagement`  
**Classification:** PUBLISHABLE  
**Status:** CANONICAL SPECIFICATION  
**Quality Level:** SURGICAL (800+ lines)

---

## 1. Executive Summary

The **Engagement Engine** is the behavioral heart of the MCV.ONE ecosystem. It provides a highly configurable, multi-tenant gamification infrastructure designed to transform passive user interactions into sustainable, habit-forming engagement loops. 

Unlike traditional "loyalty programs," the Engagement Engine is built on rigorous psychological research (Self-Determination Theory, Octalysis, Fogg) and handles the high-throughput event processing required for real-time leaderboards, quest tracking, and economic balancing across multiple ventures.

### Key Strategic Targets
- **D1 Retention:** 45%+
- **DAU/MAU Ratio:** 35%+
- **Viral K-Factor:** 0.8+
- **LTV Lift:** +40% via behavioral sinks

---

## 2. Strategic Position

The Engagement Engine acts as a "Behavioral Middleware" between venture-specific actions and the platform's value layer (Tokens/Rewards).

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         VENTURE EXPERIENCE LAYER                            │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐    │
│  │   BETEDGE    │  │ MCV STUDIOS  │  │  FUTURESTATE │  │    CLIENT    │    │
│  │ (Predictions)│  │   (Gaming)   │  │    (RWA)     │  │ (White-Label)│    │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘    │
└─────────┼─────────────────┼─────────────────┼─────────────────┼─────────────┘
          │                 │                 │                 │
          ▼                 ▼                 ▼                 ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                         @mcv/engagement (The SDK)                           │
│                                                                              │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐  ┌────────────┐  ┌─────────┐│
│  │   POINTS   │  │   QUESTS   │  │ACHIEVEMENTS│  │PROGRESSION │  │ SOCIAL  ││
│  │   ENGINE   │  │   ENGINE   │  │   ENGINE   │  │   ENGINE   │  │ ENGINE  ││
│  └────────────┘  └────────────┘  └────────────┘  └────────────┘  └─────────┘│
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────────┐│
│  │                          ECONOMIC MONITORING                            ││
│  │             Inflation Control • Tap/Sink Analysis • Health              ││
│  └─────────────────────────────────────────────────────────────────────────┘│
└──────────────────────┬──────────────────────────────────┬────────────────────┘
                       │                                  │
                       ▼                                  ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│  @mcv/events (Redpanda)  │  @mcv/db (Supabase)  │  @mcv/web3 (Solana/EDGE)  │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Psychological Foundations

The Engagement Engine is not just a point-tracker; it is a **Behavioral Operating System** calibrated to satisfy core human needs.

### 3.1 Self-Determination Theory (SDT)
Every mechanic in the engine must map to one of the three SDT drivers:

| Need | Definition | Engine Implementation |
|------|------------|-----------------------|
| **Autonomy** | Choice & Control | Path-based Quest Chains, Customizable Goals |
| **Competence** | Mastery & Growth | XP Progress Bars, Skill Badges, Tier Levels |
| **Relatedness** | Connection | Team Guilds, Social Leaderboards, Referrals |

### 3.2 Octalysis Core Drive Mapping
The engine balances "White Hat" (long-term meaning) and "Black Hat" (urgency) drives:

- **White Hat (Positive):** Level progression (Drive 2: Accomplishment), Epic mission/Governance (Drive 1: Meaning).
- **Black Hat (Urgency):** Streak protection (Drive 8: Loss Avoidance), Seasonal exclusivity (Drive 6: Scarcity).

### 3.3 Fogg Behavior Model (B = MAT)
The `Trigger Engine` within the module classifies notifications based on the user's current Motivation and Ability:
- **Spark:** High ability, Low motivation -> Inspirational trigger.
- **Facilitator:** High motivation, Low ability -> Single-click completion trigger.
- **Signal:** High motivation, High ability -> Reminder trigger.

---

## 4. Sub-Modules Overview

### 4.1 points (The Ledger)
Multi-currency, multi-tenant point management with sub-second ACID transactions.
- **Taps:** Earning sources (Daily check-in, Quest completion).
- **Sinks:** Value destruction (Streak freezes, cosmetics, token conversion).

### 4.2 quests (The Objective Engine)
Flexible rule-based objective system supporting temporal (Daily/Weekly) and structural (Chain/Hidden) classifications.
- **Rule Syntax:** JSON-based predicate logic (e.g., `IF user.action == "bet.placed" AND amount > 10 THEN progress++`).

### 4.3 progression (The Identity Layer)
XP Curves and Leveling systems.
- **Polynomial Curve:** `XP = base * level^1.8 + (level * linear_inc)`.
- **Prestige:** Resetting levels for permanent attribute boosts.

### 4.4 streaks (The Habit Loop)
Sophisticated streak tracking with grace periods and "Freezes."
- **Velocity:** Tracks the user's activity tempo over a 7-day rolling window.

### 4.5 leaderboards (The Social Layer)
Real-time competitive rankings using Redis Sorted Sets.
- **Instances:** Support for Global, Venture-specific, and Team-specific boards.

---

## 5. Core Database Schema (Drizzle ORM)

The schema is designed for multi-tenant isolation using the `venture_id` field.

```typescript
// packages/@mcv/db/src/schema/engagement/index.ts

import { pgTable, uuid, text, timestamp, jsonb, integer, numeric } from 'drizzle-orm/pg-core';
import { ventures, users } from '../core';

/**
 * Point Definitions: Defines currencies like XP, EDGE Points, Energy.
 */
export const pointTypes = pgTable('eng_point_types', {
  id: uuid('id').primaryKey().defaultRandom(),
  ventureId: uuid('venture_id').references(() => ventures.id), // null = platform wide
  slug: text('slug').notNull(), // 'xp', 'edge_points', 'reputation'
  name: text('name').notNull(),
  currencyClass: text('currency_class', { enum: ['soft', 'hard', 'energy', 'token'] }).default('soft'),
  dailyEarnCap: numeric('daily_earn_cap', { precision: 20, scale: 4 }),
  decimals: integer('decimals').default(0),
  iconUrl: text('icon_url'),
});

/**
 * User Balances: Real-time point tallies.
 */
export const pointBalances = pgTable('eng_point_balances', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id),
  pointTypeId: uuid('point_type_id').notNull().references(() => pointTypes.id),
  available: numeric('available', { precision: 20, scale: 4 }).default('0'),
  lifetimeEarned: numeric('lifetime_earned', { precision: 20, scale: 4 }).default('0'),
  lastTransactionAt: timestamp('last_transaction_at', { withTimezone: true }),
});

/**
 * Quest Definitions: The blueprints for user objectives.
 */
export const quests = pgTable('eng_quests', {
  id: uuid('id').primaryKey().defaultRandom(),
  ventureId: uuid('venture_id').references(() => ventures.id).notNull(),
  slug: text('slug').notNull(),
  title: text('title').notNull(),
  description: text('description'),
  type: text('type', { enum: ['daily', 'weekly', 'milestone', 'chain', 'seasonal'] }).notNull(),
  
  // Logic
  requirements: jsonb('requirements').$type<{
    action: string;
    target: number;
    filters?: Record<string, any>;
  }>().notNull(),
  
  // Rewards
  rewards: jsonb('rewards').$type<{
    points: { type: string; amount: number }[];
    achievements?: string[];
  }>().notNull(),
  
  endsAt: timestamp('ends_at', { withTimezone: true }),
});

/**
 * User Quest Progress: Current state of active objectives.
 */
export const userQuests = pgTable('eng_user_quests', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id),
  questId: uuid('quest_id').notNull().references(() => quests.id),
  status: text('status', { enum: ['active', 'completed', 'claimed', 'expired'] }).default('active'),
  currentProgress: numeric('current_progress', { precision: 20, scale: 4 }).default('0'),
  completedAt: timestamp('completed_at', { withTimezone: true }),
});
```

---

## 6. Logic Flow: Quest Progression

The Quest Engine uses an event-driven model to ensure high performance.

### 6.1 Event Ingestion
When a venture emits an event (e.g., `bet.placed`), the Engagement Engine listens via Redpanda.

### 6.2 Processing Step (Simplified)
```typescript
// @mcv/engagement/quests/processor.ts

export async function processEvent(event: VentureEvent) {
  // 1. Find all active quests for this event type
  const activeQuests = await db.query.quests.findMany({
    where: eq(quests.requirements.action, event.type)
  });

  for (const quest of activeQuests) {
    // 2. Check user progress
    const progress = await db.query.userQuests.findFirst({
      where: and(eq(userQuests.userId, event.userId), eq(userQuests.questId, quest.id))
    });

    if (!progress || progress.status !== 'active') continue;

    // 3. Update Progress
    const newCount = Number(progress.currentProgress) + 1;
    await db.update(userQuests)
      .set({ currentProgress: newCount.toString() })
      .where(eq(userQuests.id, progress.id));

    // 4. Trigger Completion if target reached
    if (newCount >= quest.requirements.target) {
      await completeQuest(progress.id);
    }
  }
}
```

---

## 7. Economic Balancing (Taps & Sinks)

A critical function of the Engagement Engine is maintaining the "Economic Health" of the ecosystem.

### 7.1 The Tap/Sink Dashboard
| Tap (Inflow) | Avg XP / Day | Sink (Outflow) | Avg Cost |
|--------------|--------------|----------------|----------|
| Daily Login | 10 XP | Streak Freeze | 100 Points |
| Bet Prediction | 30 XP | Cosmetic Badge | 500 Points |
| Referral | 500 XP | Token Convert | 1000 Points |

### 7.2 Inflation Control
If `Net Inflation > 15% WoW`, the engine automatically activates **Regime Scale** (ACS v2.0):
- Reduces quest multipliers by 0.2x.
- Increases sink costs by 10%.

---

## 8. Venture-Specific Experience Layers

### 8.1 BetEdge AI Implementation
- **Mechanic:** "Prediction Accuracy Streak."
- **Rule:** Unlock "Sharp Eye" achievement after 5 correct NBA predictions in 48 hours.
- **SDT Driver:** Competence.

### 8.2 MCV Studios Implementation
- **Mechanic:** "Guild War Participation."
- **Rule:** Award 500 Guild XP for every hour of play during "War Time."
- **SDT Driver:** Relatedness.

---

## 9. API Contracts (tRPC)

```typescript
// @mcv/api/src/routers/engagement.ts

export const engagementRouter = createTRPCRouter({
  // POINTS
  getBalance: protectedProcedure.query(({ ctx }) => {
    return PointService.getBalance(ctx.userId, ctx.ventureId);
  }),

  // QUESTS
  listActiveQuests: protectedProcedure.query(({ ctx }) => {
    return QuestService.getActive(ctx.userId, ctx.ventureId);
  }),

  claimReward: protectedProcedure
    .input(z.object({ userQuestId: z.string().uuid() }))
    .mutation(({ input, ctx }) => {
      return QuestService.claim(input.userQuestId, ctx.userId);
    }),

  // LEADERBOARDS
  getLeaderboard: publicProcedure
    .input(z.object({ slug: z.string(), limit: z.number().default(50) }))
    .query(({ input }) => {
      return LeaderboardService.get(input.slug, input.limit);
    }),
});
```

---

## 10. Audit & Performance Targets

### 10.1 Event Processing Latency
- **Event -> Progress Update:** < 100ms (p95).
- **Leaderboard Refresh:** < 500ms (Global async).

### 10.2 Security
- **Idempotency:** Every point transaction requires a unique `idempotency_key` derived from the source event to prevent double-counting.
- **Isolation:** RLS policies strictly enforce `venture_id` scoping at the Postgres layer.

---

## 11. Dependencies

| Package | Purpose |
|---------|---------|
| `@mcv/kernel` | Database client & common types |
| `@mcv/events` | Event bus connection (Redpanda) |
| `decimal.js` | Precise point calculations |
| `ioredis` | Real-time leaderboard persistence |

---

*MCV Global Consortium — Engagement Engine Specification v3.2*
