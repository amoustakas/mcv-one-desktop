# @mcv/engagement — Technical Architecture

**Module:** @mcv/engagement  
**Tier:** 5 (Domain Layer — Publishable)  
**Classification:** PUBLISHABLE  
**Last Updated:** February 9, 2026

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [System Diagram](#system-diagram)
3. [Module Architecture](#module-architecture)
   - [achievements](#achievements)
   - [earn](#earn)
   - [leaderboards](#leaderboards)
   - [points](#points)
   - [progression](#progression)
   - [quests](#quests)
   - [rewards](#rewards)
   - [seasons](#seasons)
   - [streaks](#streaks)
4. [Data Models](#data-models)
5. [Data Flow & Events](#data-flow--events)
6. [Integration Points](#integration-points)
7. [Performance Architecture](#performance-architecture)
8. [Scalability](#scalability)
9. [Error Handling](#error-handling)
10. [Observability](#observability)
11. [Security](#security)

---

## Architecture Overview

The `@mcv/engagement` module is a **Behavioral Operating System** — an event-driven, multi-tenant gamification engine that transforms passive user interactions into sustained, habit-forming engagement loops across all nine MCV ventures. Grounded in Self-Determination Theory, the Octalysis Framework, and the Fogg Behavior Model, the engine processes thousands of micro-interactions per second while maintaining global consistency for real-time leaderboards, quest tracking, streak protection, seasonal campaigns, and economic balancing.

### Design Philosophy

| Principle | Description |
|-----------|-------------|
| **Event-Sourced** | Every user action is captured as an immutable `EngagementEvent` on Redpanda; all state is derivable from the event stream |
| **Multi-Tenant** | Every entity carries an optional `tenantId`, enabling per-venture currencies, quests, achievements, and leaderboards while sharing the same infrastructure |
| **Economically Balanced** | A built-in ACS (Auto-Calibration System) monitors tap/sink ratios and adjusts multipliers automatically to prevent hyperinflation or deflation |
| **Psychologically Grounded** | Every mechanic maps to SDT drivers (Autonomy, Competence, Relatedness) and Octalysis core drives |
| **Real-Time First** | Leaderboards are powered by Redis Sorted Sets with O(log N) updates; achievement unlocks, streak warnings, and quest completions are pushed via WebSocket within milliseconds |
| **Fraud-Resistant** | A dedicated Scout agent performs velocity analysis, anomaly detection, and abuse-pattern matching on every earn event |

### Technology Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Runtime** | Next.js 15 (App Router) | Server Actions, API routes, React Server Components |
| **Database** | Supabase PostgreSQL + RLS | ACID transactions, row-level security, multi-tenant isolation |
| **ORM** | Drizzle ORM | Type-safe schema definitions, migrations, query building |
| **Validation** | Zod | Runtime schema validation for all inputs and events |
| **Event Bus** | Redpanda (Kafka-compatible) | High-throughput event streaming for engagement events |
| **Cache / Rankings** | Redis (Upstash) | Sorted sets for leaderboards, streak caching, rate limiting |
| **AI** | OpenRouter | AI-personalized quest generation, difficulty calibration, anomaly detection |
| **Blockchain** | Solana / EDGE Token | Point-to-token conversion, NFT achievement minting |

### Behavioral Psychology Mapping

The engine doesn't just track points — it orchestrates behavior change:

| Framework | Need / Drive | Engine Implementation |
|-----------|-------------|----------------------|
| **SDT — Autonomy** | Choice & control | Path-based quest chains, customizable goals, reward catalog selection |
| **SDT — Competence** | Mastery & growth | XP progress bars, skill badges, tier levels, prestige resets |
| **SDT — Relatedness** | Connection | Team guilds, social leaderboards, referral quests, community achievements |
| **Octalysis Drive 2** | Accomplishment | Level progression, achievement unlocks, tier advancement |
| **Octalysis Drive 6** | Scarcity | Seasonal exclusivity, limited-supply achievements, time-limited quests |
| **Octalysis Drive 8** | Loss avoidance | Streak protection, expiring points, season end countdowns |
| **Fogg — Spark** | High ability, low motivation | "Your streak is about to break! Tap to save it." |
| **Fogg — Facilitator** | High motivation, low ability | "One-tap daily check-in — no action required!" |

---

## System Diagram

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                           VENTURE EXPERIENCE LAYER                              │
│                                                                                 │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐        │
│  │ BETEDGE  │  │  STUDIOS │  │ FUTURE-  │  │  CLIENT  │  │   ...    │        │
│  │Prediction│  │  Gaming  │  │  STATE   │  │White-Lbl │  │ Ventures │        │
│  └─────┬────┘  └─────┬────┘  └─────┬────┘  └─────┬────┘  └─────┬────┘        │
│        │             │             │             │             │               │
│        └─────────────┴──────┬──────┴─────────────┴─────────────┘               │
│                             │                                                   │
│                    ┌────────▼────────┐                                          │
│                    │EngagementEvent  │  Zod-validated, UUID v7                  │
│                    │  { type, userId │  idempotency-keyed                       │
│                    │    payload }    │                                          │
│                    └────────┬────────┘                                          │
└─────────────────────────────┼───────────────────────────────────────────────────┘
                              │
                     ┌────────▼────────┐
                     │   Redpanda      │
                     │  Event Bus      │
                     │                 │
                     │ mcv.engagement  │
                     │   .raw          │
                     └────────┬────────┘
                              │
┌─────────────────────────────┼───────────────────────────────────────────────────┐
│                    EVENT PROCESSING PIPELINE                                    │
│                              │                                                  │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐                       │
│  │ 1.INGEST │→ │ 2.MATCH  │→ │3.EVALUATE│→ │ 4.AWARD  │                       │
│  │          │  │          │  │          │  │          │                       │
│  │ Validate │  │ Earn     │  │ Quest    │  │ Points   │                       │
│  │ Dedup    │  │ actions  │  │ progress │  │ XP       │                       │
│  │ Enrich   │  │ Quest    │  │ Streak   │  │ Achieve  │                       │
│  │ Buffer   │  │ reqs     │  │ check    │  │ Items    │                       │
│  └──────────┘  │ Achieve  │  └──────────┘  └────┬─────┘                       │
│                │ criteria │                      │                              │
│                └──────────┘                      │                              │
│                                                  │                              │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌────▼─────┐                       │
│  │ 8.SCOUT  │← │7.NOTIFY  │← │6.LEADER- │← │5.PERSIST │                       │
│  │ (Fraud)  │  │          │  │  BOARD   │  │          │                       │
│  │          │  │ WebSocket│  │          │  │ Postgres │                       │
│  │ Velocity │  │ Toast    │  │ Redis    │  │ ACID txn │                       │
│  │ Anomaly  │  │ Confetti │  │ ZADD     │  │ Idempt   │                       │
│  │ Abuse    │  │ Push     │  │ Rotation │  │ Audit    │                       │
│  │ Alert    │  │          │  │ Snapshot │  │          │                       │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘                       │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
                              │
┌─────────────────────────────┼───────────────────────────────────────────────────┐
│                    SUBMODULE ENGINES                                            │
│                                                                                 │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐    │
│  │ POINTS  │ │ QUESTS  │ │ ACHIEVE │ │ STREAK  │ │PROGRESS │ │ LEADER  │    │
│  │ ENGINE  │ │ ENGINE  │ │ ENGINE  │ │ ENGINE  │ │ ENGINE  │ │ BOARDS  │    │
│  │         │ │         │ │         │ │         │ │         │ │         │    │
│  │ Multi-  │ │ JSON    │ │ Rarity  │ │ Grace   │ │ XP Crv  │ │ Redis   │    │
│  │ currency│ │ Logic   │ │ tiers   │ │ periods │ │ Level   │ │ ZSET    │    │
│  │ ACID    │ │ rules   │ │ NFT     │ │ Freezes │ │ Prestig │ │ Real-   │    │
│  │ Caps    │ │ Chains  │ │ Showcse │ │ Velocty │ │ Tiers   │ │ time    │    │
│  └─────────┘ └─────────┘ └─────────┘ └─────────┘ └─────────┘ └─────────┘    │
│                                                                                 │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐                                          │
│  │ REWARDS │ │ SEASONS │ │  EARN   │                                          │
│  │ ENGINE  │ │ ENGINE  │ │ ENGINE  │                                          │
│  │         │ │         │ │         │                                          │
│  │ Catalog │ │ Reward  │ │ Action→ │                                          │
│  │ Redeem  │ │ tracks  │ │ Point   │                                          │
│  │ Fulfill │ │ Exclusv │ │ mapping │                                          │
│  │ Token   │ │ Timebox │ │ Multplr │                                          │
│  └─────────┘ └─────────┘ └─────────┘                                          │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
                              │
┌─────────────────────────────┼───────────────────────────────────────────────────┐
│                    ECONOMIC MONITORING LAYER                                    │
│                                                                                 │
│  ┌──────────────────┐ ┌──────────────────┐ ┌──────────────────────────┐        │
│  │ Tap / Sink       │ │ Inflation Control│ │ ACS v2.0                 │        │
│  │ Dashboard        │ │ (WoW Monitoring) │ │ Auto-Calibrate System    │        │
│  │                  │ │                  │ │                          │        │
│  │ Inflow:  Quests, │ │ If Net > 15%:   │ │ Reduce multipliers 0.2x │        │
│  │ Earn, Referrals  │ │  Activate ACS   │ │ Increase sink costs 10%  │        │
│  │ Outflow: Freezes,│ │ If Net < -5%:   │ │ Introduce bonus taps     │        │
│  │ Cosmetics, Conv. │ │  Boost events   │ │ Recalibrate weekly       │        │
│  └──────────────────┘ └──────────────────┘ └──────────────────────────┘        │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
                              │
┌─────────────────────────────┼───────────────────────────────────────────────────┐
│                    STORAGE & INFRASTRUCTURE                                     │
│                                                                                 │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌────────────────┐     │
│  │  PostgreSQL   │  │    Redis     │  │   Redpanda   │  │ Solana / EDGE  │     │
│  │  (Supabase)   │  │  (Upstash)   │  │  (Event Bus) │  │ (Token Bridge) │     │
│  │               │  │              │  │              │  │                │     │
│  │ Point ledger  │  │ Leaderboard  │  │ Event stream │  │ Point → Token  │     │
│  │ Quest state   │  │ ZSET ranks   │  │ Engagement   │  │ NFT minting    │     │
│  │ Achievements  │  │ Streak cache │  │ events topic │  │ Achievement NFT│     │
│  │ Seasons       │  │ Rate limits  │  │ Dead letter  │  │ Reward tokens  │     │
│  └──────────────┘  └──────────────┘  └──────────────┘  └────────────────┘     │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### Request Lifecycle

A single user action (e.g., "Place a bet on BetEdge") triggers the following pipeline:

1. **Venture emits event** → `EngagementEvent` published to `mcv.engagement.raw` on Redpanda
2. **Ingest stage** → Validates against Zod schema, deduplicates via `idempotencyKey`, enriches with user context from CDP
3. **Match stage** → Checks event against all registered earn actions, quest requirements, and achievement criteria using JSON Logic
4. **Evaluate stage** → Computes quest progress increments, streak validity, and achievement tier checks
5. **Award stage** → Awards points (with daily cap enforcement), XP, achievement unlocks
6. **Persist stage** → Writes to PostgreSQL within a single ACID transaction (idempotent via unique constraints)
7. **Leaderboard stage** → Issues `ZADD` to Redis sorted sets for all affected leaderboards
8. **Notify stage** → Pushes real-time updates via WebSocket (toasts, confetti animations, progress bars)
9. **Scout stage** → Runs velocity analysis and anomaly detection; raises fraud alerts if thresholds breached

**Average end-to-end latency:** < 150ms (p50), < 400ms (p99)

---

## Module Architecture

The engagement domain comprises **9 specialized submodules**, each responsible for a distinct gamification mechanic. All submodules share the same event pipeline, multi-tenant infrastructure, and economic monitoring layer.

### Directory Structure

```
packages/modules/engagement/
├── client/
│   ├── components/          # React components (PointsDisplay, QuestCard, etc.)
│   └── hooks/               # React hooks (usePoints, useQuests, etc.)
├── server/
│   ├── services/            # Business logic per submodule
│   │   ├── point-service.ts
│   │   ├── point-type-service.ts
│   │   ├── quest-admin-service.ts
│   │   ├── quest-user-service.ts
│   │   ├── achievement-admin-service.ts
│   │   ├── achievement-user-service.ts
│   │   ├── streak-service.ts
│   │   ├── leaderboard-service.ts
│   │   ├── progression-service.ts
│   │   ├── reward-service.ts
│   │   ├── season-service.ts
│   │   ├── earn-service.ts
│   │   ├── event-processor.ts
│   │   ├── economic-service.ts
│   │   └── scout-service.ts
│   ├── db/
│   │   ├── schema.ts        # Drizzle ORM table definitions
│   │   └── migrations/      # Database migrations
│   └── rules/
│       └── json-logic.ts    # JSON Logic evaluation engine
├── types.ts                 # Shared TypeScript types
├── constants.ts             # Constants and enums
├── config.ts                # Module configuration
└── index.ts                 # Public exports
```

---

### achievements

**Purpose:** Badge/trophy/achievement system with rarity tiers, multi-tier progression, NFT minting, and profile showcase.

**Core Responsibilities:**
- Define achievements with JSON Logic-based unlock conditions
- Support multi-tier achievements (Bronze → Silver → Gold → Platinum)
- Assign rarity levels (Common → Uncommon → Rare → Epic → Legendary → Mythic) based on unlock percentages
- Mint achievements as on-chain NFTs (Solana) for permanence and portability
- Allow users to showcase pinned achievements on their profile
- Track progress toward locked achievements with optional progress bars
- Support hidden and secret achievements for surprise delight moments

**Architecture:**

```
┌──────────────────────────────────────────────┐
│            Achievement Engine                 │
│                                              │
│  ┌──────────────────┐  ┌──────────────────┐  │
│  │ Admin Service     │  │ User Service      │  │
│  │                  │  │                  │  │
│  │ createAchievement│  │ getUserAchieve..  │  │
│  │ updateAchievement│  │ unlockAchieve..   │  │
│  │ listAchievements │  │ claimReward       │  │
│  │                  │  │ getProgress       │  │
│  │                  │  │ setShowcase       │  │
│  │                  │  │ mintNFT           │  │
│  └────────┬─────────┘  └────────┬─────────┘  │
│           │                     │             │
│  ┌────────▼─────────────────────▼─────────┐  │
│  │         JSON Logic Evaluator           │  │
│  │  requirements: {                       │  │
│  │    ">=": [{"var":"bets_placed"}, 100]  │  │
│  │  }                                     │  │
│  └────────────────────────────────────────┘  │
│                                              │
│  ┌────────────────────────────────────────┐  │
│  │         NFT Minting Bridge             │  │
│  │  Solana → Metaplex → Achievement NFT   │  │
│  └────────────────────────────────────────┘  │
│                                              │
└──────────────────────────────────────────────┘
```

**Key Design Decisions:**
- **JSON Logic for unlock conditions** — Allows non-engineer teams to define complex, composable achievement criteria without code deployments. Conditions are stored as JSONB in PostgreSQL and evaluated at runtime.
- **Rarity auto-calculation** — Rarity tiers are dynamically recalculated weekly based on actual unlock percentages across the user base, ensuring that "Legendary" always means < 3% of users.
- **NFT minting is opt-in** — Achievement NFTs are minted only when the user explicitly requests it (gas cost awareness), using the Solana/EDGE token bridge.
- **Supply-limited achievements** — Some achievements have a `totalSupply` cap (e.g., "First 100 Users"), creating FOMO-driven urgency.

**Rarity Classification:**

| Rarity | Unlock % | Visual Treatment |
|--------|----------|------------------|
| Common | 60%+ | Gray border, no animation |
| Uncommon | 30–60% | Green border, subtle glow |
| Rare | 10–30% | Blue border, shimmer effect |
| Epic | 3–10% | Purple border, particle burst |
| Legendary | < 3% | Gold border, full animation |
| Mythic | < 0.5% | Holographic, custom animation |

---

### earn

**Purpose:** Unified earn-action registry that maps venture events to point/XP awards with conditional multipliers, daily caps, and cooldown enforcement.

**Core Responsibilities:**
- Register earn actions that map Redpanda event types to point awards
- Apply conditional multipliers (weekend bonus, first-of-day, streak bonus, season multiplier)
- Enforce per-user daily/weekly earn caps to prevent economic inflation
- Enforce cooldown periods between repeat awards
- Track earn history for analytics and fraud detection
- Support time-bounded earn actions (limited-time events)

**Architecture:**

```
┌──────────────────────────────────────────────────────────────┐
│                     Earn Engine                               │
│                                                              │
│  Incoming Event                                              │
│       │                                                      │
│       ▼                                                      │
│  ┌─────────────────┐                                         │
│  │ Action Matcher   │  Match event.type against registered    │
│  │                 │  earn actions (eventType + filters)      │
│  └────────┬────────┘                                         │
│           │                                                   │
│           ▼                                                   │
│  ┌─────────────────┐                                         │
│  │ Cap Checker      │  dailyEarned < dailyEarnCap?           │
│  │                 │  cooldown elapsed?                       │
│  │                 │  maxPerDay / maxPerWeek?                 │
│  └────────┬────────┘                                         │
│           │                                                   │
│           ▼                                                   │
│  ┌─────────────────┐                                         │
│  │ Multiplier Stack │  Evaluate multiplier rules:             │
│  │                 │  • Base: 1.0x                            │
│  │                 │  • Weekend: 1.5x                         │
│  │                 │  • First of day: 2.0x                    │
│  │                 │  • Season bonus: 1.25x                   │
│  │                 │  • ACS adjustment: 0.8x                  │
│  │                 │  Final = base × Π(multipliers)           │
│  └────────┬────────┘                                         │
│           │                                                   │
│           ▼                                                   │
│  ┌─────────────────┐                                         │
│  │ Award Dispatcher │  → point-service.awardPoints()          │
│  │                 │  → progression-service.addXP()           │
│  └─────────────────┘                                         │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

**Multiplier Stack Example:**

```typescript
// EarnAction for "bet.placed" on BetEdge
{
  slug: 'betedge-bet-placed',
  eventType: 'bet.placed',
  pointTypeSlug: 'edge_points',
  baseAmount: 10,
  multiplierRules: [
    {
      condition: { "===": [{ "var": "dayOfWeek" }, "saturday"] },
      multiplier: 1.5,
      label: "Weekend Bonus"
    },
    {
      condition: { "===": [{ "var": "isFirstOfDay" }, true] },
      multiplier: 2.0,
      label: "First of Day"
    },
    {
      condition: { ">=": [{ "var": "streak.current" }, 7] },
      multiplier: 1.25,
      label: "7-Day Streak Bonus"
    }
  ],
  maxPerDay: 50,
  cooldownMinutes: 5
}
```

---

### leaderboards

**Purpose:** Real-time competitive ranking system powered by Redis Sorted Sets with automatic rotation, historical snapshots, and reward distribution.

**Core Responsibilities:**
- Maintain real-time leaderboards with O(log N) score updates via Redis `ZADD`
- Support multiple scoring strategies: cumulative, snapshot, average, and max
- Support time-based rotation: daily, weekly, monthly, seasonal, and all-time
- Generate historical snapshots before rotation for archival and rewards
- Distribute rewards to top-ranked players at rotation boundaries
- Provide surrounding-player context (players ranked above and below the user)
- Support team-based leaderboards for collaborative competition
- Anonymize players outside the top N for privacy

**Architecture:**

```
┌──────────────────────────────────────────────────────────────┐
│                   Leaderboard Engine                          │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐    │
│  │                Redis Sorted Sets                      │    │
│  │                                                      │    │
│  │  Key: lb:{slug}:{period}:{ventureId}                 │    │
│  │  Score: cumulative / snapshot / avg / max             │    │
│  │  Member: userId                                       │    │
│  │                                                      │    │
│  │  ZADD  → O(log N) insert/update                      │    │
│  │  ZREVRANK → O(log N) rank lookup                     │    │
│  │  ZREVRANGE → O(log N + M) top-N retrieval            │    │
│  │  ZREVRANGEBYSCORE → score-range queries               │    │
│  └──────────────────────────────────────────────────────┘    │
│                                                              │
│  ┌────────────────────┐  ┌────────────────────┐             │
│  │  Score Updater      │  │  Rotation Engine   │             │
│  │                    │  │                    │             │
│  │  Listens to point  │  │  Cron-scheduled:   │             │
│  │  transactions and  │  │  1. Snapshot to PG │             │
│  │  issues ZADD to    │  │  2. Distribute     │             │
│  │  relevant boards   │  │     rewards         │             │
│  │                    │  │  3. DEL + recreate  │             │
│  └────────────────────┘  └────────────────────┘             │
│                                                              │
│  ┌────────────────────┐  ┌────────────────────┐             │
│  │  Rank Resolver      │  │  History Archive   │             │
│  │                    │  │                    │             │
│  │  getUserRank()     │  │  leaderboard_      │             │
│  │  + percentile      │  │  snapshots table   │             │
│  │  + surrounding ±5  │  │  (PostgreSQL)      │             │
│  └────────────────────┘  └────────────────────┘             │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

**Redis Key Schema:**

```
lb:top-winners:weekly:betedge        → Sorted set (userId → score)
lb:top-winners:weekly:betedge:meta   → Hash (startedAt, endsAt, totalEntries)
lb:xp-grinders:monthly:global        → Sorted set (userId → score)
lb:season-3:seasonal:global           → Sorted set (userId → score)
```

**Rotation Flow:**

1. Cron job fires at period boundary (e.g., Monday 00:00 UTC for weekly boards)
2. `ZREVRANGE 0 -1 WITHSCORES` → Snapshot all entries
3. Insert snapshot into `leaderboard_snapshots` table in PostgreSQL
4. Calculate reward tiers and enqueue reward distribution jobs
5. `DEL lb:{slug}:{period}:{ventureId}` → Clear the sorted set
6. Optionally seed with active users to maintain warm cache

---

### points

**Purpose:** Multi-currency point ledger with ACID transactions, daily caps, regeneration mechanics, and token bridge.

**Core Responsibilities:**
- Support multiple currency classes: soft, hard, medium, energy, social, event, and token
- Execute all balance mutations within ACID PostgreSQL transactions
- Enforce daily earn caps per currency type
- Implement energy-style regeneration (automatic balance recovery over time)
- Track lifetime metrics (earned, spent, expired) for economic analysis
- Support point locking (escrow, staking) and unlocking
- Bridge points to on-chain EDGE tokens via the token-economy domain
- Maintain full transaction audit trail with balance-before/after snapshots
- Enforce idempotency via unique `idempotencyKey` on all write operations

**Architecture:**

```
┌──────────────────────────────────────────────────────────────────┐
│                       Points Engine                               │
│                                                                  │
│  ┌──────────────────────────┐  ┌──────────────────────────┐     │
│  │    Point Type Registry    │  │    Balance Manager         │     │
│  │                          │  │                          │     │
│  │  7 currency classes:     │  │  available / pending /   │     │
│  │  soft, hard, medium,     │  │  locked partitions       │     │
│  │  energy, social, event,  │  │                          │     │
│  │  token                   │  │  Daily cap enforcement   │     │
│  │                          │  │  Regeneration timer      │     │
│  │  Per-venture or global   │  │  Max balance cap         │     │
│  └──────────────────────────┘  └──────────────────────────┘     │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │              Transaction Processor                        │   │
│  │                                                          │   │
│  │  1. Validate input (Zod)                                 │   │
│  │  2. Check idempotency key (UNIQUE constraint)            │   │
│  │  3. BEGIN transaction                                     │   │
│  │  4. SELECT ... FOR UPDATE (row lock on point_balances)   │   │
│  │  5. Check daily cap, max balance, sufficient funds        │   │
│  │  6. UPDATE point_balances (available, daily_earned, etc.) │   │
│  │  7. INSERT point_transactions (audit trail)               │   │
│  │  8. COMMIT                                                │   │
│  │  9. Emit 'points.awarded' / 'points.spent' event         │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                  │
│  ┌──────────────────────────┐  ┌──────────────────────────┐     │
│  │    Token Bridge           │  │  Regeneration Worker      │     │
│  │                          │  │                          │     │
│  │  convertToTokens() →     │  │  Cron: every 15 minutes  │     │
│  │  token-economy domain    │  │  For energy-class points: │     │
│  │  Solana/EDGE integration │  │  balance += regen_rate    │     │
│  │                          │  │  cap at max_regeneration  │     │
│  └──────────────────────────┘  └──────────────────────────┘     │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

**Transaction Isolation:**

All point mutations use `SELECT ... FOR UPDATE` to acquire a row-level lock on the `point_balances` row before mutation. This prevents race conditions where concurrent events could overdraw a balance or exceed daily caps.

```typescript
// Simplified transaction flow
await db.transaction(async (tx) => {
  // 1. Lock the balance row
  const balance = await tx
    .select()
    .from(pointBalances)
    .where(and(
      eq(pointBalances.userId, input.userId),
      eq(pointBalances.pointTypeId, input.pointTypeId),
    ))
    .for('update')
    .limit(1);

  // 2. Validate caps
  const newDailyEarned = Number(balance.dailyEarned) + input.amount;
  if (pointType.dailyEarnCap && newDailyEarned > Number(pointType.dailyEarnCap)) {
    throw new DailyCapExceededError(input.userId, pointType.slug);
  }

  // 3. Update balance
  await tx.update(pointBalances)
    .set({
      available: sql`${pointBalances.available} + ${input.amount}`,
      dailyEarned: sql`${pointBalances.dailyEarned} + ${input.amount}`,
      lifetimeEarned: sql`${pointBalances.lifetimeEarned} + ${input.amount}`,
      lastTransactionAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(pointBalances.id, balance.id));

  // 4. Insert audit trail
  await tx.insert(pointTransactions).values({
    balanceId: balance.id,
    userId: input.userId,
    pointTypeId: input.pointTypeId,
    transactionType: 'earn',
    amount: String(input.amount),
    balanceBefore: balance.available,
    balanceAfter: String(Number(balance.available) + input.amount),
    sourceType: input.sourceType,
    sourceId: input.sourceId,
    idempotencyKey: input.idempotencyKey,
  });
});
```

---

### progression

**Purpose:** Leveling system with configurable XP curves, tier advancement, and prestige resets for long-term engagement loops.

**Core Responsibilities:**
- Calculate user level from accumulated XP using configurable curve functions
- Support multiple XP curve types: linear, polynomial, exponential, and custom lookup tables
- Detect level-up events and trigger associated rewards and notifications
- Implement tier advancement (e.g., Bronze → Silver → Gold → Platinum → Diamond)
- Support prestige resets — voluntary level reset in exchange for permanent bonuses
- Track level history for analytics

**Architecture:**

```
┌──────────────────────────────────────────────────────────────┐
│                   Progression Engine                          │
│                                                              │
│  ┌────────────────────────────────────────────────────┐      │
│  │               XP Curve Calculator                   │      │
│  │                                                    │      │
│  │  Linear:       xp = base * level                   │      │
│  │  Polynomial:   xp = base * level^exponent          │      │
│  │  Exponential:  xp = base * growth^level            │      │
│  │  Custom:       xp = lookupTable[level]             │      │
│  │                                                    │      │
│  │  Default: xp = 100 * level^1.5                     │      │
│  │  Level 1 → 100 XP, Level 10 → 3,162 XP            │      │
│  │  Level 50 → 35,355 XP, Level 100 → 100,000 XP     │      │
│  └──────────────────────────────────────────────────────┘      │
│                                                              │
│  ┌──────────────────────┐  ┌──────────────────────┐         │
│  │  Level-Up Detector    │  │  Tier Advancement     │         │
│  │                      │  │                      │         │
│  │  On addXP():         │  │  Level thresholds:   │         │
│  │  1. Add XP to total  │  │  Bronze:  1–10       │         │
│  │  2. Recalculate lvl  │  │  Silver:  11–25      │         │
│  │  3. If lvl changed:  │  │  Gold:    26–50      │         │
│  │     → emit level.up  │  │  Platinum: 51–75     │         │
│  │     → award rewards  │  │  Diamond:  76–100    │         │
│  │     → check tier     │  │                      │         │
│  └──────────────────────┘  └──────────────────────┘         │
│                                                              │
│  ┌────────────────────────────────────────────────────┐      │
│  │              Prestige System                        │      │
│  │                                                    │      │
│  │  At max level (100), user may "prestige":          │      │
│  │  • Reset to level 1                                │      │
│  │  • Keep permanent bonus (+5% earn per prestige)    │      │
│  │  • Earn prestige badge (displayed on profile)      │      │
│  │  • Prestige counter increments (max 10)            │      │
│  │  • Exclusive prestige achievements unlock          │      │
│  └────────────────────────────────────────────────────┘      │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

**XP Curve Configuration:**

```typescript
interface XPCurveParams {
  type: 'linear' | 'polynomial' | 'exponential' | 'custom';
  base: number;           // Base XP for level 1
  exponent?: number;      // For polynomial curves
  growthRate?: number;     // For exponential curves
  lookupTable?: number[]; // For custom curves
  maxLevel: number;        // Level cap
}

// Default curve: polynomial with exponent 1.5
const DEFAULT_XP_CURVE: XPCurveParams = {
  type: 'polynomial',
  base: 100,
  exponent: 1.5,
  maxLevel: 100,
};
```

---

### quests

**Purpose:** Rule-based objective engine supporting daily, weekly, seasonal, milestone, chain, hidden, community, and onboarding quest types with compound requirements.

**Core Responsibilities:**
- Define quests with single or compound requirements (AND/OR logic trees)
- Support 9 quest types: daily, weekly, monthly, seasonal, milestone, chain, hidden, community, onboarding
- Track per-user quest progress with real-time updates
- Enforce completion limits (per-user, global supply, cooldown)
- Support quest chains — sequential multi-step quests with prerequisites
- Auto-refresh daily/weekly quests on schedule via recurrence rules (iCal RRULE)
- Target quests by user tier, segment, or venture
- Award multi-reward bundles on completion (points, XP, achievements, items, multipliers)

**Architecture:**

```
┌──────────────────────────────────────────────────────────────────┐
│                        Quest Engine                               │
│                                                                  │
│  ┌──────────────────────────────────────────┐                   │
│  │           Quest Definition Store          │                   │
│  │                                          │                   │
│  │  engagement.quests table (PostgreSQL)     │                   │
│  │  JSON Logic requirements stored as JSONB  │                   │
│  │  Compound AND/OR requirement trees        │                   │
│  └────────────────┬─────────────────────────┘                   │
│                   │                                              │
│  ┌────────────────▼─────────────────────────┐                   │
│  │          Requirement Matcher              │                   │
│  │                                          │                   │
│  │  For each incoming EngagementEvent:       │                   │
│  │  1. Load active quests for user's tier    │                   │
│  │  2. Match event.type against quest reqs   │                   │
│  │  3. Evaluate JSON Logic filters           │                   │
│  │  4. Increment progress on matching quests │                   │
│  └────────────────┬─────────────────────────┘                   │
│                   │                                              │
│  ┌────────────────▼─────────────────────────┐                   │
│  │          Progress Tracker                 │                   │
│  │                                          │                   │
│  │  engagement.user_quests table            │                   │
│  │  currentProgress / targetProgress         │                   │
│  │  compoundProgress (nested JSON tracker)   │                   │
│  │                                          │                   │
│  │  If progress >= target:                   │                   │
│  │    → Mark quest completed                 │                   │
│  │    → Enqueue reward distribution          │                   │
│  │    → Check chain: unlock next quest?      │                   │
│  │    → Emit 'quest.completed' event         │                   │
│  └──────────────────────────────────────────┘                   │
│                                                                  │
│  ┌──────────────────────────────────────────┐                   │
│  │          Daily/Weekly Refresh             │                   │
│  │                                          │                   │
│  │  Cron: refreshDailyQuests()              │                   │
│  │  1. Expire old daily/weekly quests        │                   │
│  │  2. Select new quests (AI-personalized    │                   │
│  │     or random from pool)                  │                   │
│  │  3. Create fresh user_quests entries      │                   │
│  │  Respects MAX_ACTIVE_QUESTS_PER_USER      │                   │
│  └──────────────────────────────────────────┘                   │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

**Compound Requirement Example:**

```typescript
// "Win 3 bets AND place bets in 2 different categories"
const compoundReq: CompoundRequirement = {
  operator: 'and',
  conditions: [
    { action: 'bet.won', target: 3 },
    {
      operator: 'or',
      conditions: [
        { action: 'bet.placed', target: 1, filters: { category: 'sports' } },
        { action: 'bet.placed', target: 1, filters: { category: 'esports' } },
      ]
    }
  ]
};
```

---

### rewards

**Purpose:** Reward catalog with inventory management, point-based redemption, fulfillment tracking, and token conversion bridge.

**Core Responsibilities:**
- Maintain a categorized reward catalog with stock tracking
- Process reward redemptions (deduct points, issue reward, track fulfillment)
- Support digital rewards (badges, cosmetics, multipliers) and physical rewards (merchandise)
- Track redemption lifecycle: pending → processing → fulfilled / refunded
- Bridge high-value rewards to token-economy domain for on-chain fulfillment
- Enforce per-user redemption limits and cooldowns
- Support admin fulfillment and refund workflows

**Architecture:**

```
┌──────────────────────────────────────────────────────────────┐
│                     Rewards Engine                            │
│                                                              │
│  ┌─────────────────────┐  ┌─────────────────────┐           │
│  │  Reward Catalog      │  │  Redemption Engine   │           │
│  │                     │  │                     │           │
│  │  Categories:        │  │  1. Validate stock   │           │
│  │  • Digital (instant)│  │  2. Check user limit │           │
│  │  • Physical (ship)  │  │  3. Deduct points    │           │
│  │  • Experience       │  │  4. Create redemption│           │
│  │  • Token conversion │  │  5. Trigger fulfillmn│           │
│  │                     │  │  6. Emit event       │           │
│  │  Stock tracking:    │  │                     │           │
│  │  available / total  │  │  Status machine:     │           │
│  │  / reserved         │  │  pending → processing│           │
│  │                     │  │  → fulfilled/refunded│           │
│  └─────────────────────┘  └─────────────────────┘           │
│                                                              │
│  ┌─────────────────────┐  ┌─────────────────────┐           │
│  │  Fulfillment Worker  │  │  Token Bridge        │           │
│  │                     │  │                     │           │
│  │  Digital: instant   │  │  High-value rewards  │           │
│  │  Physical: webhook  │  │  → token-economy     │           │
│  │  to commerce domain │  │  → Solana/EDGE       │           │
│  └─────────────────────┘  └─────────────────────┘           │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

---

### seasons

**Purpose:** Time-bounded competitive seasons with exclusive reward tracks, XP multipliers, and seasonal achievements — modeled after battle passes.

**Core Responsibilities:**
- Define seasons with start/end dates, themes, and reward tracks
- Manage season lifecycle: upcoming → active → ending_soon → ended → archived
- Track per-user season XP and reward tier progression
- Distribute exclusive seasonal rewards (unavailable after season ends)
- Apply season-wide XP multipliers to all earn actions
- Support optional entry fees (battle pass purchase)
- Generate seasonal leaderboards integrated with the leaderboard engine
- Include season-exclusive achievements

**Architecture:**

```
┌──────────────────────────────────────────────────────────────┐
│                     Seasons Engine                            │
│                                                              │
│  ┌──────────────────────────────────────────────────┐       │
│  │              Season Lifecycle Manager              │       │
│  │                                                  │       │
│  │  upcoming ──→ active ──→ ending_soon ──→ ended   │       │
│  │                                          │       │       │
│  │  Transitions triggered by:               ▼       │       │
│  │  • Cron at startsAt/endsAt          archived     │       │
│  │  • Admin manual override                         │       │
│  └──────────────────────────────────────────────────┘       │
│                                                              │
│  ┌──────────────────────────────────────────────────┐       │
│  │              Reward Track Engine                   │       │
│  │                                                  │       │
│  │  Tier 1: Bronze   → 0 XP    → 100 Edge Points   │       │
│  │  Tier 2: Silver   → 500 XP  → 250 Edge Points   │       │
│  │  Tier 3: Gold     → 1500 XP → Exclusive Badge    │       │
│  │  Tier 4: Platinum → 3000 XP → Legendary Skin     │       │
│  │  Tier 5: Diamond  → 5000 XP → NFT Trophy         │       │
│  │                                                  │       │
│  │  Users claim rewards as they cross XP thresholds │       │
│  │  Unclaimed rewards available until season archive │       │
│  └──────────────────────────────────────────────────┘       │
│                                                              │
│  ┌──────────────────────┐  ┌──────────────────────┐        │
│  │  XP Multiplier       │  │  Season Achievements  │        │
│  │                     │  │                      │        │
│  │  During active:      │  │  Season-exclusive     │        │
│  │  All earn XP × 1.5  │  │  achievements that    │        │
│  │  (configurable)      │  │  can only be unlocked │        │
│  │                     │  │  while season active   │        │
│  └──────────────────────┘  └──────────────────────┘        │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

---

### streaks

**Purpose:** Daily/weekly streak tracking with grace periods, freeze tokens, velocity scoring, and habit-loop reinforcement.

**Core Responsibilities:**
- Track consecutive activity days (or weeks) per user
- Enforce configurable grace periods (default: 36 hours from last activity)
- Support streak freeze tokens (purchased with points) that preserve streaks through missed days
- Calculate velocity scores — 7-day rolling activity patterns for churn prediction
- Detect at-risk streaks (< 4 hours remaining) and trigger push notifications
- Maintain streak history for analytics and achievement tracking
- Track longest-ever streak as a lifetime metric

**Architecture:**

```
┌──────────────────────────────────────────────────────────────┐
│                     Streak Engine                             │
│                                                              │
│  ┌─────────────────────────────────────────────────────┐    │
│  │              Streak State Machine                     │    │
│  │                                                     │    │
│  │  recordStreakActivity():                              │    │
│  │  1. Load current streak status                       │    │
│  │  2. Check if within grace period:                    │    │
│  │     YES → increment currentStreak                    │    │
│  │     NO  → check freeze tokens:                       │    │
│  │            Has freeze → consume freeze, maintain      │    │
│  │            No freeze  → reset to 1                    │    │
│  │  3. Update longestStreak if new record                │    │
│  │  4. Set new expiresAt (now + grace hours)             │    │
│  │  5. Update velocity metrics                           │    │
│  │  6. Emit 'streak.maintained' or 'streak.broken'      │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                              │
│  ┌─────────────────────┐  ┌─────────────────────────┐      │
│  │  Velocity Tracker    │  │  At-Risk Detector        │      │
│  │                     │  │                         │      │
│  │  7-day rolling avg  │  │  Cron: every 30 min     │      │
│  │  Trend analysis:    │  │  If expiresAt - now     │      │
│  │  • accelerating     │  │    < 4 hours:           │      │
│  │  • stable           │  │  → Push notification    │      │
│  │  • decelerating     │  │  → "Streak at risk!"    │      │
│  │                     │  │  → isAtRisk = true      │      │
│  │  Used for churn     │  │                         │      │
│  │  prediction in CDP  │  │                         │      │
│  └─────────────────────┘  └─────────────────────────┘      │
│                                                              │
│  ┌─────────────────────────────────────────────────────┐    │
│  │              Streak Freeze System                     │    │
│  │                                                     │    │
│  │  Purchase: points → freeze token (configurable cost) │    │
│  │  Max freezes: 3 per period (configurable)            │    │
│  │  Auto-consume: if grace period expires, freeze used  │    │
│  │  Freeze history tracked for analytics                │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

**Streak Grace Period Logic:**

```
Last Activity: Monday 14:00 UTC
Grace Period: 36 hours
Expires At: Wednesday 02:00 UTC

Timeline:
  Mon 14:00 ─── Activity recorded ─── Streak = 5
  Tue 10:00 ─── Activity recorded ─── Streak = 6 (within grace)
  Wed 01:00 ─── No activity ──── isAtRisk = true (< 4h remaining)
  Wed 02:00 ─── Grace expires ──── Check freeze → consume or reset
```

---

## Data Models

All data models are defined using **Drizzle ORM** with the `engagement` PostgreSQL schema. Tables use UUID v4 primary keys (via `defaultRandom()`), timestamptz columns for all dates, and JSONB for flexible structured data.

### Schema Overview

```
engagement schema
├── point_types              # Currency definitions (XP, Coins, Energy, etc.)
├── point_balances           # User balances per currency
├── point_transactions       # Full transaction audit trail
├── quests                   # Quest definitions
├── user_quests              # Per-user quest progress
├── achievements             # Achievement definitions
├── user_achievements        # Per-user achievement state
├── streaks                  # Streak tracking per user
├── streak_history           # Historical streak records
├── leaderboards             # Leaderboard definitions
├── leaderboard_entries      # PostgreSQL backup of leaderboard entries
├── leaderboard_snapshots    # Historical rotation snapshots
├── levels                   # User level/XP state
├── level_configs            # XP curve configurations
├── rewards                  # Reward catalog
├── redemptions              # Reward redemption records
├── seasons                  # Season definitions
├── season_progress          # Per-user season progress
├── earn_actions             # Earn action → point mappings
├── earn_history             # Earn event log
├── economic_snapshots       # Economic health snapshots
└── fraud_alerts             # Scout agent fraud alerts
```

### Core Tables

#### engagement.point_types

Defines the currencies available in the system. Each venture can define its own currencies or use platform-wide currencies.

| Column | Type | Description |
|--------|------|-------------|
| `id` | `uuid` PK | Unique identifier |
| `slug` | `text` | URL-safe identifier (e.g., 'xp', 'edge_points') |
| `name` | `text` | Display name |
| `description` | `text` | Optional description |
| `currency_class` | `enum` | soft / hard / medium / energy / social / event / token |
| `decimals` | `integer` | Decimal places (0 for integers) |
| `max_balance` | `decimal(20,4)` | Maximum balance cap |
| `daily_earn_cap` | `decimal(20,4)` | Maximum earnable per day |
| `regeneration_rate` | `decimal(10,4)` | Auto-regeneration per hour (energy systems) |
| `max_regeneration` | `decimal(20,4)` | Max regeneration cap |
| `economy_id` | `uuid` FK | Link to token-economy domain |
| `conversion_rate` | `decimal(20,9)` | Points per on-chain token |
| `is_convertible` | `boolean` | Can bridge to blockchain tokens |
| `icon_url` | `text` | Currency icon URL |
| `color` | `text` | Hex color for UI |
| `tenant_id` | `uuid` FK | Venture scope (null = platform-wide) |
| `created_at` | `timestamptz` | Creation timestamp |
| `updated_at` | `timestamptz` | Last update timestamp |

**Indexes:** `UNIQUE (slug, tenant_id)`

#### engagement.point_balances

Stores the current balance state for each user × currency combination.

| Column | Type | Description |
|--------|------|-------------|
| `id` | `uuid` PK | Unique identifier |
| `user_id` | `uuid` FK | User reference |
| `point_type_id` | `uuid` FK | Currency type reference |
| `tenant_id` | `uuid` FK | Venture scope |
| `available` | `decimal(20,4)` | Spendable balance |
| `pending` | `decimal(20,4)` | Awaiting confirmation |
| `locked` | `decimal(20,4)` | Locked (staking/escrow) |
| `lifetime_earned` | `decimal(20,4)` | Total ever earned |
| `lifetime_spent` | `decimal(20,4)` | Total ever spent |
| `lifetime_expired` | `decimal(20,4)` | Total expired |
| `daily_earned` | `decimal(20,4)` | Earned today (resets daily) |
| `daily_reset_at` | `timestamptz` | Next daily cap reset |
| `last_regeneration_at` | `timestamptz` | Last energy regen tick |
| `last_transaction_at` | `timestamptz` | Last balance change |

**Indexes:** `UNIQUE (user_id, point_type_id, tenant_id)`

#### engagement.point_transactions

Immutable audit trail for every point mutation.

| Column | Type | Description |
|--------|------|-------------|
| `id` | `uuid` PK | Unique identifier |
| `balance_id` | `uuid` FK | Balance reference |
| `user_id` | `uuid` FK | User reference |
| `point_type_id` | `uuid` FK | Currency type |
| `tenant_id` | `uuid` FK | Venture scope |
| `transaction_type` | `enum` | earn / spend / transfer_in / transfer_out / convert / expire / adjustment / lock / unlock |
| `amount` | `decimal(20,4)` | Signed amount (+credit / -debit) |
| `balance_before` | `decimal(20,4)` | Balance before transaction |
| `balance_after` | `decimal(20,4)` | Balance after transaction |
| `source_type` | `text` | Origin: quest, achievement, earn, purchase, admin |
| `source_id` | `uuid` | Origin entity ID |
| `source_metadata` | `jsonb` | Additional context |
| `description` | `text` | Internal description |
| `display_message` | `text` | User-facing message |
| `expires_at` | `timestamptz` | Point expiration date |
| `idempotency_key` | `text` UNIQUE | Prevents duplicate processing |

**Indexes:** `(user_id, created_at)`, `(source_type, source_id)`, `UNIQUE (idempotency_key)`

#### engagement.quests

Quest definitions with JSON Logic requirements and reward bundles.

| Column | Type | Description |
|--------|------|-------------|
| `id` | `uuid` PK | Unique identifier |
| `slug` | `text` | URL-safe identifier |
| `name` | `text` | Display name |
| `description` | `text` | Quest description |
| `quest_type` | `enum` | daily / weekly / monthly / seasonal / milestone / chain / hidden / community / onboarding |
| `category` | `text` | Grouping category |
| `tags` | `text[]` | Searchable tags |
| `status` | `enum` | draft / scheduled / active / paused / completed / expired / archived |
| `starts_at` | `timestamptz` | Activation date |
| `ends_at` | `timestamptz` | Expiration date |
| `recurrence_rule` | `text` | iCal RRULE for recurring quests |
| `requirements` | `jsonb` | JSON Logic unlock conditions |
| `compound_requirements` | `jsonb` | AND/OR requirement trees |
| `rewards` | `jsonb` | Reward bundle on completion |
| `difficulty_level` | `integer` | 1–5 difficulty rating |
| `xp_value` | `integer` | XP awarded on completion |
| `tier_requirement` | `integer` | Minimum user tier |
| `parent_quest_id` | `uuid` FK | Chain parent |
| `prerequisite_quest_ids` | `uuid[]` | Must complete first |
| `max_completions_per_user` | `integer` | Per-user limit |
| `max_completions_global` | `integer` | Global supply |
| `cooldown_hours` | `integer` | Cooldown between completions |
| `tenant_id` | `uuid` FK | Venture scope |

**Indexes:** `UNIQUE (slug, tenant_id)`, `(starts_at, ends_at)`

#### engagement.user_quests

Per-user quest progress tracking.

| Column | Type | Description |
|--------|------|-------------|
| `id` | `uuid` PK | Unique identifier |
| `user_id` | `uuid` FK | User reference |
| `quest_id` | `uuid` FK | Quest definition reference |
| `status` | `text` | active / completed / claimed / expired / abandoned |
| `current_progress` | `decimal(20,4)` | Current progress value |
| `target_progress` | `decimal(20,4)` | Target to complete |
| `compound_progress` | `jsonb` | Progress for compound requirements |
| `started_at` | `timestamptz` | When user started quest |
| `completed_at` | `timestamptz` | When quest completed |
| `claimed_at` | `timestamptz` | When rewards claimed |
| `expires_at` | `timestamptz` | When quest expires for this user |
| `rewards_claimed` | `jsonb` | Actual rewards distributed |
| `completion_count` | `integer` | Times completed (repeatable quests) |

**Indexes:** `(user_id, status)`

#### engagement.achievements

Achievement definitions with rarity, tiers, and NFT integration.

| Column | Type | Description |
|--------|------|-------------|
| `id` | `uuid` PK | Unique identifier |
| `slug` | `text` | URL-safe identifier |
| `name` | `text` | Display name |
| `description` | `text` | Achievement description |
| `flavor_text` | `text` | Lore/narrative text |
| `category` | `text` | explorer, social, mastery, etc. |
| `subcategory` | `text` | Sub-grouping |
| `rarity` | `enum` | common / uncommon / rare / epic / legendary / mythic |
| `requirements` | `jsonb` | JSON Logic unlock criteria |
| `tiers` | `jsonb` | Multi-tier progression (Bronze → Gold) |
| `rewards` | `jsonb` | Reward bundle on unlock |
| `xp_value` | `integer` | XP awarded |
| `nft_enabled` | `boolean` | Can mint as NFT |
| `nft_collection_id` | `text` | Solana collection address |
| `is_hidden` | `boolean` | Hidden until discovered |
| `is_secret` | `boolean` | Never shown in lists |
| `show_progress` | `boolean` | Show progress bar before unlock |
| `total_supply` | `integer` | Limited supply (null = unlimited) |
| `current_holders` | `integer` | Current unlock count |
| `prerequisite_achievements` | `text[]` | Must unlock first |
| `tenant_id` | `uuid` FK | Venture scope |

**Indexes:** `UNIQUE (slug, tenant_id)`, `(category, rarity)`

#### engagement.user_achievements

Per-user achievement state including progress, unlock, and NFT minting.

| Column | Type | Description |
|--------|------|-------------|
| `id` | `uuid` PK | Unique identifier |
| `user_id` | `uuid` FK | User reference |
| `achievement_id` | `uuid` FK | Achievement definition |
| `is_unlocked` | `boolean` | Whether fully unlocked |
| `current_tier` | `integer` | Current tier (0 = not started) |
| `current_progress` | `decimal` | Progress toward next tier |
| `target_progress` | `decimal` | Target for current tier |
| `unlocked_at` | `timestamptz` | Unlock timestamp |
| `rewards_claimed` | `boolean` | Whether rewards collected |
| `nft_minted` | `boolean` | Whether NFT minted |
| `nft_mint_address` | `text` | Solana mint address |
| `is_showcased` | `boolean` | Pinned to profile |
| `showcase_order` | `integer` | Display position |

**Indexes:** `UNIQUE (user_id, achievement_id)`

#### engagement.streaks

Current streak state per user.

| Column | Type | Description |
|--------|------|-------------|
| `id` | `uuid` PK | Unique identifier |
| `user_id` | `uuid` FK UNIQUE | One streak per user |
| `current_streak` | `integer` | Consecutive days |
| `longest_streak` | `integer` | All-time record |
| `last_activity_at` | `timestamptz` | Last qualifying activity |
| `expires_at` | `timestamptz` | Grace period expiration |
| `freezes_available` | `integer` | Freeze tokens remaining |
| `freezes_used` | `integer` | Freezes used this period |
| `is_at_risk` | `boolean` | < 4 hours remaining |
| `velocity_data` | `jsonb` | 7-day rolling velocity |
| `tenant_id` | `uuid` FK | Venture scope |

#### engagement.leaderboards

Leaderboard definitions — the actual rankings live in Redis.

| Column | Type | Description |
|--------|------|-------------|
| `id` | `uuid` PK | Unique identifier |
| `slug` | `text` | URL-safe identifier |
| `name` | `text` | Display name |
| `score_type` | `text` | cumulative / snapshot / average / max |
| `score_source` | `text` | Point type slug or computed metric |
| `period` | `enum` | daily / weekly / monthly / seasonal / all-time |
| `rotation_schedule` | `text` | Cron expression for rotation |
| `venture_id` | `uuid` FK | Venture scope (null = global) |
| `team_based` | `boolean` | Individual vs team |
| `display_limit` | `integer` | Max entries shown (default: 100) |
| `show_percentile` | `boolean` | Show user percentile |
| `reward_tiers` | `jsonb` | Reward distribution config |
| `tenant_id` | `uuid` FK | Multi-tenant scope |

#### engagement.rewards

Reward catalog entries.

| Column | Type | Description |
|--------|------|-------------|
| `id` | `uuid` PK | Unique identifier |
| `slug` | `text` | URL-safe identifier |
| `name` | `text` | Display name |
| `description` | `text` | Reward description |
| `category` | `text` | digital / physical / experience / token |
| `point_type_slug` | `text` | Currency required |
| `cost` | `decimal(20,4)` | Points required to redeem |
| `stock_total` | `integer` | Total supply (null = unlimited) |
| `stock_available` | `integer` | Currently available |
| `stock_reserved` | `integer` | Reserved for pending redemptions |
| `max_per_user` | `integer` | Per-user limit |
| `cooldown_hours` | `integer` | Cooldown between redemptions |
| `is_active` | `boolean` | Available for redemption |
| `image_url` | `text` | Reward image |
| `tenant_id` | `uuid` FK | Venture scope |

#### engagement.seasons

Season definitions with reward tracks.

| Column | Type | Description |
|--------|------|-------------|
| `id` | `uuid` PK | Unique identifier |
| `slug` | `text` | URL-safe identifier |
| `name` | `text` | "Season 3: Rise of the Phoenix" |
| `description` | `text` | Season description |
| `starts_at` | `timestamptz` | Season start |
| `ends_at` | `timestamptz` | Season end |
| `status` | `enum` | upcoming / active / ending_soon / ended / archived |
| `reward_track` | `jsonb` | Tiered reward definitions |
| `exclusive_achievements` | `text[]` | Season-only achievement slugs |
| `xp_multiplier` | `decimal` | Earn XP multiplier (e.g., 1.5) |
| `entry_fee` | `jsonb` | Optional battle pass cost |
| `minimum_tier` | `integer` | Tier requirement |
| `tenant_id` | `uuid` FK | Venture scope |

#### engagement.earn_actions

Maps venture events to point awards.

| Column | Type | Description |
|--------|------|-------------|
| `id` | `uuid` PK | Unique identifier |
| `slug` | `text` | URL-safe identifier |
| `name` | `text` | Display name |
| `event_type` | `text` | Redpanda event type to match |
| `filters` | `jsonb` | Additional matching filters |
| `point_type_slug` | `text` | Currency to award |
| `base_amount` | `decimal` | Base points per trigger |
| `multiplier_rules` | `jsonb` | Conditional multiplier stack |
| `max_per_day` | `integer` | Per-user daily cap |
| `max_per_week` | `integer` | Per-user weekly cap |
| `cooldown_minutes` | `integer` | Cooldown between awards |
| `is_active` | `boolean` | Currently active |
| `starts_at` | `timestamptz` | Activation date |
| `ends_at` | `timestamptz` | Deactivation date |
| `tenant_id` | `uuid` FK | Venture scope |

### Row-Level Security (RLS)

All tables enforce Supabase RLS policies:

| Policy | Rule |
|--------|------|
| **User isolation** | Users can only read/write their own `user_quests`, `user_achievements`, `point_balances`, `streaks`, `season_progress`, `redemptions` |
| **Admin access** | Users with `admin` or `engagement_admin` role can CRUD definitions (quests, achievements, rewards, seasons, earn_actions) |
| **Tenant isolation** | All queries automatically filter by `tenant_id` matching the user's current venture |
| **Read-only definitions** | Non-admin users can read quest/achievement/reward definitions but not modify them |
| **Transaction immutability** | `point_transactions` are INSERT-only — no UPDATE or DELETE allowed |

---

## Data Flow & Events

### Event-Driven Architecture

The engagement engine is fully event-driven. All user actions flow through Redpanda as `EngagementEvent` messages, processed by the `EngagementProcessor` streaming consumer.

#### Event Topics

| Topic | Purpose | Partitions |
|-------|---------|------------|
| `mcv.engagement.raw` | Raw venture events (input) | 12 |
| `mcv.engagement.processed` | Processed results (output) | 12 |
| `mcv.engagement.achievements` | Achievement unlock events | 6 |
| `mcv.engagement.leaderboard` | Leaderboard update events | 6 |
| `mcv.engagement.notifications` | Client notification events | 6 |
| `mcv.engagement.dlq` | Dead letter queue (failed events) | 3 |

#### Event Flow Sequence

```
Venture Action (e.g., "bet.placed")
       │
       ▼
┌──────────────────┐
│ mcv.engagement   │  Published by venture backend
│ .raw             │  Partitioned by userId for ordering
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│ EngagementProcessor │
│                  │
│ 1. Deserialize   │
│ 2. Zod validate  │
│ 3. Idempotency   │  Check idempotencyKey in Redis
│    check         │
│ 4. User context  │  Fetch from CDP cache
│    enrichment    │
└────────┬─────────┘
         │
    ┌────┴─────┬──────────┬───────────┬──────────┐
    ▼          ▼          ▼           ▼          ▼
┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐
│ Earn   │ │ Quest  │ │Achieve │ │ Streak │ │ Season │
│ Engine │ │ Engine │ │ Engine │ │ Engine │ │ Engine │
│        │ │        │ │        │ │        │ │        │
│ Match  │ │ Update │ │ Check  │ │ Record │ │ Add    │
│ rules  │ │ progrs │ │ unlock │ │ activ  │ │ season │
│ Award  │ │ Compl? │ │ condtn │ │ Check  │ │ XP     │
│ points │ │ Claim  │ │ Notify │ │ grace  │ │        │
└───┬────┘ └───┬────┘ └───┬────┘ └───┬────┘ └───┬────┘
    │          │          │          │          │
    └──────────┴──────┬───┴──────────┴──────────┘
                      │
                      ▼
              ┌───────────────┐
              │  Aggregated   │
              │  Results      │
              │               │
              │  points: +15  │
              │  xp: +50      │
              │  quest: 3/5   │
              │  achieve: 🔓  │
              │  streak: 7    │
              └───────┬───────┘
                      │
        ┌─────────────┼─────────────┐
        ▼             ▼             ▼
┌──────────────┐ ┌─────────┐ ┌──────────┐
│  PostgreSQL  │ │  Redis  │ │ WebSocket│
│  ACID commit │ │  ZADD   │ │  Notify  │
│              │ │  boards │ │  Toast   │
│  Balances    │ │         │ │  Confetti│
│  Transactions│ │  Streak │ │  Progress│
│  Quest prog  │ │  cache  │ │  bar     │
│  Achievements│ │         │ │          │
└──────────────┘ └─────────┘ └──────────┘
```

#### Key Events Emitted

| Event | Trigger | Payload |
|-------|---------|---------|
| `points.awarded` | Points earned via any source | `{ userId, pointType, amount, source, balanceAfter }` |
| `points.spent` | Points deducted (reward, transfer, convert) | `{ userId, pointType, amount, source, balanceAfter }` |
| `quest.progress` | Quest progress incremented | `{ userId, questId, current, target, percentComplete }` |
| `quest.completed` | Quest requirements met | `{ userId, questId, rewards }` |
| `achievement.unlocked` | Achievement criteria met | `{ userId, achievementId, rarity, tier }` |
| `achievement.tier_up` | Multi-tier achievement advanced | `{ userId, achievementId, fromTier, toTier }` |
| `streak.maintained` | Streak successfully continued | `{ userId, currentStreak, longestStreak }` |
| `streak.broken` | Streak reset (no freeze available) | `{ userId, brokenStreak, wasLongest }` |
| `streak.at_risk` | < 4 hours remaining on grace | `{ userId, currentStreak, hoursRemaining }` |
| `level.up` | User leveled up | `{ userId, fromLevel, toLevel, totalXP }` |
| `tier.promoted` | User advanced to next tier | `{ userId, fromTier, toTier }` |
| `season.tier_claimed` | Season reward tier claimed | `{ userId, seasonId, tier, rewards }` |
| `leaderboard.updated` | User rank changed | `{ userId, leaderboardSlug, newRank, oldRank, score }` |
| `reward.redeemed` | Reward redemption processed | `{ userId, rewardId, pointsSpent, status }` |
| `fraud.alert` | Scout detected anomaly | `{ userId, alertType, severity, details }` |

### Real-Time Client Updates

The notification pipeline pushes updates to connected clients via Supabase Realtime (WebSocket):

```typescript
// Client-side subscription (React hook)
const { data: events } = useEngagementEvents({
  userId: currentUser.id,
  eventTypes: ['achievement.unlocked', 'level.up', 'streak.at_risk'],
});

// Server-side broadcast
await supabase.channel(`user:${userId}:engagement`).send({
  type: 'broadcast',
  event: 'achievement.unlocked',
  payload: {
    achievementId: achievement.id,
    name: achievement.name,
    rarity: achievement.rarity,
    animationUrl: achievement.animationUrl,
  },
});
```

---

## Integration Points

The engagement module integrates with multiple platform domains to form a cohesive behavioral system.

### Domain Integration Map

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│                    @mcv/engagement                          │
│                                                             │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐  │
│  │ analytics │  │   cdp    │  │ commerce │  │ token-   │  │
│  │          │  │          │  │          │  │ economy  │  │
│  └─────┬────┘  └─────┬────┘  └─────┬────┘  └─────┬────┘  │
│        │             │             │             │         │
└────────┼─────────────┼─────────────┼─────────────┼─────────┘
         │             │             │             │
         ▼             ▼             ▼             ▼
  Engagement     User segment    Reward         Point ↔
  metrics &      targeting &     fulfillment    Token
  dashboards     personalization & purchases    conversion
```

### @mcv/analytics — Engagement Metrics

| Direction | Integration |
|-----------|-------------|
| **engagement → analytics** | Emit all engagement events for tracking: points earned/spent, quests completed, achievements unlocked, streaks maintained/broken, leaderboard rank changes |
| **analytics → engagement** | Provide A/B test results for quest/reward optimization; funnel data for conversion analysis |

**Key Metrics Tracked:**
- DAU/MAU ratio per venture
- D1/D7/D30 retention correlated with engagement features
- Quest completion rates by type and difficulty
- Achievement unlock distribution (rarity validation)
- Streak survival curves
- Points velocity (earn rate vs spend rate)
- Leaderboard participation rates

### @mcv/cdp — User Segmentation & Personalization

| Direction | Integration |
|-----------|-------------|
| **engagement → cdp** | Push engagement profile data: level, tier, streak, active quests, achievement count, total points, velocity score |
| **cdp → engagement** | Provide user segments for quest targeting, achievement visibility, and personalized quest selection |

**Use Cases:**
- Target "at-risk churners" (declining velocity score) with re-engagement quests
- Offer "whale" users (high LTV) exclusive achievements and season rewards
- Personalize daily quest selection based on user behavior patterns
- Exclude "new users" from advanced quests until onboarding complete

### @mcv/commerce — Reward Fulfillment

| Direction | Integration |
|-----------|-------------|
| **engagement → commerce** | Trigger product/merchandise fulfillment for physical rewards; create discount codes for commerce-based rewards |
| **commerce → engagement** | Confirm fulfillment status updates (shipped, delivered, returned); purchase events as engagement triggers |

**Flow:**
1. User redeems physical reward in engagement → calls `commerce.createFulfillment()`
2. Commerce processes order, ships item
3. Commerce emits `fulfillment.shipped` / `fulfillment.delivered`
4. Engagement updates redemption status accordingly

### @mcv/token-economy — Point ↔ Token Conversion

| Direction | Integration |
|-----------|-------------|
| **engagement → token-economy** | `convertToTokens()` — bridge points to on-chain EDGE tokens; `mintAchievementNFT()` — mint achievement as Solana NFT |
| **token-economy → engagement** | Confirm on-chain transaction completion; token balance syncs for display |

**Conversion Flow:**
1. User requests conversion: 10,000 Edge Points → 10 EDGE tokens
2. Engagement deducts points via ACID transaction
3. Calls `token-economy.mintTokens({ amount: 10, wallet: user.walletAddress })`
4. Token-economy executes Solana transaction
5. On confirmation, engagement marks conversion as complete
6. On failure, engagement reverses point deduction (saga compensation)

---

## Performance Architecture

### Real-Time Leaderboard Ranking

Leaderboards are the most latency-sensitive component. All ranking operations use **Redis Sorted Sets**:

| Operation | Redis Command | Complexity | Typical Latency |
|-----------|---------------|------------|-----------------|
| Update score | `ZADD lb:key score userId` | O(log N) | < 1ms |
| Get rank | `ZREVRANK lb:key userId` | O(log N) | < 1ms |
| Get top 100 | `ZREVRANGE lb:key 0 99 WITHSCORES` | O(log N + 100) | < 2ms |
| Get surrounding | `ZREVRANGE lb:key rank-5 rank+5` | O(log N + 10) | < 1ms |
| Get percentile | `ZREVRANK / ZCARD` | O(log N) + O(1) | < 2ms |
| Total entries | `ZCARD lb:key` | O(1) | < 0.5ms |

**Consistency Model:**
- Redis is the **source of truth** for current rankings (write-through)
- PostgreSQL `leaderboard_snapshots` stores historical data (write-behind)
- On Redis failure, the system degrades to PostgreSQL-based ranking (slower but correct)

### Event Processing Throughput

| Metric | Target | Design |
|--------|--------|--------|
| **Throughput** | 5,000+ events/sec | 12-partition Redpanda topic, parallel consumer group |
| **Latency (p50)** | < 150ms | In-memory rule matching, Redis caching |
| **Latency (p99)** | < 400ms | PostgreSQL ACID commits, complex compound evaluations |
| **Deduplication** | 100% | Redis-backed idempotency key cache (24h TTL) |

### Caching Strategy

| Data | Cache Layer | TTL | Invalidation |
|------|-------------|-----|--------------|
| Earn action rules | Redis hash | 5 min | On rule update (pub/sub) |
| Quest definitions | Redis hash | 5 min | On quest update (pub/sub) |
| Achievement definitions | Redis hash | 10 min | On achievement update |
| User streak status | Redis hash | 30 min | On streak activity |
| Leaderboard rankings | Redis sorted set | Permanent | Continuous ZADD updates |
| User point balances | Not cached | — | Always read from PostgreSQL (ACID) |
| User quest progress | Not cached | — | Always read from PostgreSQL (consistency) |

**Balance and progress are intentionally NOT cached** — the cost of serving stale balance data (double-spend, over-award) outweighs the latency benefit.

### Connection Pooling

| Resource | Pool Size | Strategy |
|----------|-----------|----------|
| PostgreSQL (Supabase) | 20 connections | PgBouncer transaction mode |
| Redis (Upstash) | 100 connections | Persistent connections, pipelining |
| Redpanda | 12 consumers | Consumer group, one per partition |

---

## Scalability

### Horizontal Scaling

| Component | Scaling Strategy |
|-----------|-----------------|
| **Event consumers** | Add consumer instances to the Redpanda consumer group; each consumer handles a partition subset |
| **API servers** | Stateless Next.js instances behind load balancer; scale based on CPU/memory |
| **Redis** | Upstash serverless Redis auto-scales; for extreme load, shard by venture/leaderboard |
| **PostgreSQL** | Supabase read replicas for read-heavy queries; partition `point_transactions` by month for archival |

### Partition Strategy

**point_transactions** — The highest-volume table. Partitioned by `created_at` (monthly):

```sql
CREATE TABLE engagement.point_transactions (
  ...
) PARTITION BY RANGE (created_at);

CREATE TABLE engagement.point_transactions_2026_01
  PARTITION OF engagement.point_transactions
  FOR VALUES FROM ('2026-01-01') TO ('2026-02-01');

CREATE TABLE engagement.point_transactions_2026_02
  PARTITION OF engagement.point_transactions
  FOR VALUES FROM ('2026-02-01') TO ('2026-03-01');
```

Benefits:
- Old months can be moved to cold storage
- Index maintenance is per-partition (faster)
- Queries scoped to recent data skip old partitions

### Multi-Tenant Isolation

All queries include `tenant_id` filtering, enforced at three levels:

1. **RLS policies** — Database-level, cannot be bypassed
2. **Service layer** — Every service function accepts `tenantId` and includes it in all queries
3. **API middleware** — `tenantId` extracted from authenticated session, injected automatically

---

## Error Handling

### Error Hierarchy

```
EngagementError (base)
├── PointError
│   ├── InsufficientBalanceError
│   ├── DailyCapExceededError
│   ├── MaxBalanceExceededError
│   ├── InvalidTransactionError
│   └── ConversionFailedError
├── QuestError
│   ├── QuestNotFoundError
│   ├── QuestNotActiveError
│   ├── QuestAlreadyCompletedError
│   ├── QuestCooldownError
│   ├── QuestRequirementNotMetError
│   └── MaxCompletionsReachedError
├── AchievementError
│   ├── AchievementNotFoundError
│   ├── AchievementAlreadyUnlockedError
│   ├── AchievementSupplyExhaustedError
│   └── NFTMintingFailedError
├── StreakError
│   ├── StreakAlreadyRecordedError
│   ├── NoFreezeAvailableError
│   └── StreakExpiredError
├── LeaderboardError
│   ├── LeaderboardNotFoundError
│   └── LeaderboardRotationError
├── RewardError
│   ├── RewardNotFoundError
│   ├── RewardOutOfStockError
│   ├── RewardCooldownError
│   ├── RedemptionNotFoundError
│   └── FulfillmentFailedError
├── SeasonError
│   ├── SeasonNotActiveError
│   ├── SeasonTierAlreadyClaimedError
│   └── SeasonTierNotReachedError
└── FraudError
    ├── VelocityThresholdExceededError
    └── AnomalyDetectedError
```

### Retry & Dead Letter Strategy

| Error Type | Strategy |
|-----------|----------|
| **Transient** (DB timeout, Redis unavailable) | Exponential backoff: 3 retries (1s, 4s, 16s) |
| **Idempotency conflict** | Skip (already processed) — not an error |
| **Validation failure** | Send to DLQ immediately — no retry |
| **Business logic** (cap exceeded, not found) | Send to DLQ with classification — no retry |
| **Fraud detected** | Send to DLQ + raise fraud alert — block user action |

Dead letter queue: `mcv.engagement.dlq` — monitored via alerting, reviewed by operations team.

### Saga Compensation

For multi-step operations (e.g., reward redemption involving point deduction + commerce fulfillment):

```
1. Deduct points (PostgreSQL ACID) ────────► Success
2. Create fulfillment (commerce API) ──────► Failure!
3. Compensate: Refund points ──────────────► Restore balance
4. Log compensation event ─────────────────► Audit trail
```

---

## Observability

### Metrics (OpenTelemetry)

| Metric | Type | Labels |
|--------|------|--------|
| `engagement.events.processed` | Counter | `venture_id`, `event_type`, `status` |
| `engagement.events.latency_ms` | Histogram | `venture_id`, `event_type` |
| `engagement.points.awarded` | Counter | `venture_id`, `point_type`, `source` |
| `engagement.points.spent` | Counter | `venture_id`, `point_type`, `sink` |
| `engagement.quests.completed` | Counter | `venture_id`, `quest_type` |
| `engagement.achievements.unlocked` | Counter | `venture_id`, `rarity` |
| `engagement.streaks.maintained` | Counter | `venture_id` |
| `engagement.streaks.broken` | Counter | `venture_id` |
| `engagement.leaderboard.updates` | Counter | `leaderboard_slug`, `venture_id` |
| `engagement.rewards.redeemed` | Counter | `venture_id`, `category` |
| `engagement.economic.inflation` | Gauge | `venture_id` |
| `engagement.economic.health_score` | Gauge | `venture_id` |
| `engagement.fraud.alerts` | Counter | `venture_id`, `severity` |
| `engagement.redis.latency_ms` | Histogram | `operation` |
| `engagement.db.query_latency_ms` | Histogram | `table`, `operation` |

### Structured Logging

All engagement operations emit structured JSON logs:

```json
{
  "level": "info",
  "module": "engagement",
  "submodule": "earn",
  "action": "award_points",
  "userId": "uuid",
  "ventureId": "betedge",
  "pointType": "edge_points",
  "amount": 15,
  "multipliers": ["weekend_bonus:1.5", "streak_7:1.25"],
  "finalAmount": 28,
  "dailyEarned": 245,
  "dailyCap": 500,
  "latencyMs": 42,
  "traceId": "abc123",
  "spanId": "def456",
  "timestamp": "2026-02-09T12:00:00Z"
}
```

### Alerting Rules

| Alert | Condition | Severity |
|-------|-----------|----------|
| **Event processing lag** | Consumer lag > 10,000 messages | Critical |
| **Redis unavailable** | Connection failures > 5/min | Critical |
| **Economic inflation** | Net inflation > 15% WoW | Warning |
| **Economic crisis** | Health score < 30 | Critical |
| **Fraud spike** | Fraud alerts > 50/hour | Critical |
| **Streak at-risk unprocessed** | At-risk notifications delayed > 30 min | Warning |
| **DLQ accumulation** | DLQ messages > 100 unresolved | Warning |
| **Leaderboard rotation failure** | Rotation job failed | Critical |

### Dashboards

| Dashboard | Contents |
|-----------|----------|
| **Engagement Overview** | DAU/MAU, active quests, points velocity, streak survival rate |
| **Economic Health** | Tap/sink balance, inflation rate, ACS status, multiplier history |
| **Quest Performance** | Completion rates by type, difficulty distribution, reward efficiency |
| **Achievement Analytics** | Unlock rates by rarity, most/least unlocked, NFT minting rate |
| **Leaderboard Activity** | Participation rates, score distributions, rotation success |
| **Fraud Monitor** | Alert timeline, velocity anomalies, blocked actions |

---

## Security

### Authentication & Authorization

| Layer | Mechanism |
|-------|-----------|
| **API Authentication** | Supabase Auth JWT — all requests require valid session |
| **Role-Based Access** | Admin operations (create quest, manage rewards) require `engagement_admin` role |
| **User Isolation** | RLS policies ensure users can only access their own data |
| **Tenant Isolation** | All queries scoped by `tenant_id` at database level |
| **Service-to-Service** | Internal service calls use signed JWT with `service_role` |

### Anti-Fraud Measures

| Measure | Implementation |
|---------|---------------|
| **Velocity limiting** | Max events per user per minute (configurable per action type) |
| **Idempotency enforcement** | Unique `idempotencyKey` on all write operations — duplicates silently rejected |
| **Daily earn caps** | Per-currency daily limits prevent runaway point accumulation |
| **Scout agent** | ML-based anomaly detection on earn patterns, login patterns, and score submissions |
| **Rate limiting** | Redis-backed rate limits on all API endpoints (100 req/min per user) |
| **Cooldown enforcement** | Per-action cooldowns prevent rapid-fire exploit loops |
| **Balance integrity** | `SELECT ... FOR UPDATE` row locks prevent race conditions |
| **Transaction immutability** | `point_transactions` table is INSERT-only — no UPDATE/DELETE via RLS |

### Data Protection

| Concern | Approach |
|---------|----------|
| **PII minimization** | Engagement tables store only `user_id` (UUID) — no PII in engagement schema |
| **Leaderboard anonymization** | Players outside top N are anonymized (configurable) |
| **Encryption at rest** | Supabase PostgreSQL encryption; Redis TLS |
| **Encryption in transit** | All connections use TLS 1.3 |
| **Audit trail** | Full transaction history with `created_by`, balance snapshots, and idempotency keys |
| **GDPR compliance** | User deletion cascades through all engagement tables via `ON DELETE CASCADE` |

### Input Validation

All inputs are validated using Zod schemas before any database operation:

```typescript
const awardPointsSchema = z.object({
  userId: z.string().uuid(),
  pointTypeSlug: z.string().min(1).max(50),
  amount: z.number().positive().max(1_000_000),
  sourceType: z.enum(['quest', 'achievement', 'earn', 'purchase', 'admin', 'referral']),
  sourceId: z.string().uuid().optional(),
  idempotencyKey: z.string().min(1).max(255),
  tenantId: z.string().uuid().optional(),
});
```

---

*@mcv/engagement — Engagement & Gamification Domain*
