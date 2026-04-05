# @mcv/engagement/streaks

> Streak-based engagement mechanics that reward consistent daily and periodic user activity with escalating rewards, freeze protection, social competition, and intelligent recovery systems.

**Package:** `@mcv/engagement/streaks`
**Since:** 0.12.0
**Status:** Stable
**Tier:** 5 (Domain)
**Parent:** `@mcv/engagement`
**License:** Proprietary

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

Streaks are one of the most powerful engagement mechanics in modern applications. They exploit the **endowed progress effect** and **loss aversion** to create habitual product usage — when a user has built a 30-day streak, the psychological cost of breaking it far exceeds the reward of any single day. This module provides the complete infrastructure for defining, tracking, rewarding, protecting, and analyzing streak-based engagement patterns.

### What This Module Does

1. **Defines streak types** — Administrators configure what constitutes a streak: which activities qualify, what frequency is required (daily, weekly, custom windows), when the streak resets, and what grace periods apply.

2. **Tracks per-user streak state** — Every qualifying user action is evaluated against active streak definitions. The module maintains current streak counts, longest-ever records, last activity timestamps, and alive/broken status with full audit trails.

3. **Rewards streak milestones** — Configurable reward schedules deliver escalating rewards at milestone lengths (7-day, 30-day, 100-day, etc.), daily participation rewards with streak multipliers, and special anniversary bonuses.

4. **Protects streaks with freezes and shields** — Users can acquire streak freeze tokens (via points, in-app currency, or subscription perks) that automatically activate when a day is missed, preserving the streak without requiring activity.

5. **Enables streak recovery** — When a streak does break, configurable grace periods and paid recovery options give users a window to restore their streak, reducing frustration while monetizing urgency.

6. **Handles timezone complexity** — Day boundaries are calculated per-user timezone with configurable reset hours. The module gracefully handles timezone changes, daylight saving transitions, and travel scenarios.

7. **Powers social streaks** — Shared streaks require coordinated activity between parties (like Snapchat streaks), team streaks aggregate group behavior, and leaderboards create competitive dynamics.

8. **Delivers streak notifications** — At-risk reminders, milestone celebrations, broken-streak notifications, and social streak nudges are dispatched via configurable channels (push, email, in-app, SMS).

9. **Provides streak analytics** — Distribution of active streak lengths, break patterns by day-of-week, resurrection rates, freeze usage, and cohort-level engagement metrics for product teams.

### Why It Exists

Without a centralized streak system, engagement mechanics fragment across features — login bonuses in one place, activity tracking in another, reward distribution somewhere else. This module provides a **unified streak engine** that:

- **Reduces duplication** — One system handles all streak types across the platform
- **Ensures consistency** — All streaks follow the same timezone, freeze, and recovery rules
- **Enables iteration** — Product teams can create new streak types via configuration, not code
- **Provides analytics** — Cross-streak analytics reveal which mechanics drive real retention
- **Handles edge cases** — Timezone math, freeze mechanics, and recovery windows are notoriously bug-prone; centralizing them prevents per-feature bugs

### Design Principles

| Principle | Implementation |
|-----------|---------------|
| **User-timezone-first** | All day boundaries computed in user's local timezone, never UTC |
| **Configurable, not coded** | Streak definitions are database-driven; new types require no deploys |
| **Fair by default** | Grace periods, freeze tokens, and recovery prevent accidental loss |
| **Event-driven evaluation** | Activity events flow through Redpanda; streak evaluation is decoupled from action handlers |
| **Multi-tenant isolation** | All streak data is tenant-scoped with RLS policies |
| **Audit-complete** | Every streak state change (increment, freeze, break, recover) is logged |
| **Cron-safe** | Daily evaluation is idempotent; running twice produces the same result |

---

## Exports

### Services

| Export | Type | Description |
|--------|------|-------------|
| `StreakService` | Class | Primary service — streak CRUD, recording activity, querying state |
| `StreakDefinitionService` | Class | Admin service — create/update/archive streak definitions |
| `StreakFreezeService` | Class | Freeze token management — grant, consume, inventory |
| `StreakRecoveryService` | Class | Recovery flow — eligibility check, execute recovery, payment integration |
| `StreakRewardService` | Class | Reward distribution — milestone checks, multiplier calculation, reward dispatch |
| `StreakNotificationService` | Class | Notification dispatch — at-risk, milestone, broken, social nudges |
| `StreakLeaderboardService` | Class | Leaderboard queries — ranking, comparison, team aggregation |
| `StreakAnalyticsService` | Class | Analytics queries — distributions, patterns, cohort metrics |
| `StreakEvaluationWorker` | Class | Cron worker — daily streak evaluation pipeline |
| `StreakEventConsumer` | Class | Redpanda consumer — processes activity events for streak qualification |

### Interfaces

| Export | Type | Description |
|--------|------|-------------|
| `Streak` | Interface | Complete streak record with state, metadata, and computed fields |
| `StreakDefinition` | Interface | Streak type configuration — frequency, actions, rewards, reset rules |
| `StreakState` | Interface | Current streak state — count, longest, alive, last activity |
| `StreakFreeze` | Interface | Freeze token record — granted, consumed, expired |
| `StreakRecovery` | Interface | Recovery attempt record — eligibility, cost, outcome |
| `StreakReward` | Interface | Reward record — milestone, multiplier, distributed amount |
| `StreakNotification` | Interface | Notification record — type, channel, delivery status |
| `StreakAnalytics` | Interface | Analytics snapshot — distributions, patterns, rates |
| `StreakMilestone` | Interface | Milestone definition — day threshold, reward type, reward amount |
| `StreakActivity` | Interface | Qualifying activity record — action, timestamp, metadata |
| `StreakLeaderboardEntry` | Interface | Leaderboard position — user, streak length, rank |
| `SocialStreak` | Interface | Shared streak between users — participants, state, last contributions |
| `TeamStreak` | Interface | Team-level streak — team ID, aggregate state, member contributions |

### Schemas (Drizzle)

| Export | Type | Description |
|--------|------|-------------|
| `streakDefinitions` | Table | Streak type configurations |
| `userStreaks` | Table | Per-user streak state |
| `streakActivities` | Table | Activity log for streak qualification |
| `streakFreezes` | Table | Freeze token inventory and usage |
| `streakRecoveries` | Table | Recovery attempt records |
| `streakRewards` | Table | Distributed reward records |
| `streakMilestones` | Table | Milestone definitions per streak type |
| `streakNotifications` | Table | Notification dispatch log |
| `streakLeaderboards` | Table | Materialized leaderboard snapshots |
| `socialStreaks` | Table | Shared/social streak state |
| `teamStreaks` | Table | Team-level streak aggregation |

### tRPC Routers

| Export | Type | Description |
|--------|------|-------------|
| `streakRouter` | tRPC Router | User-facing streak operations — query state, record activity, use freeze |
| `streakAdminRouter` | tRPC Router | Admin operations — manage definitions, grant freezes, view analytics |

### Enums

| Export | Type | Description |
|--------|------|-------------|
| `StreakFrequency` | Enum | `DAILY`, `WEEKLY`, `BIWEEKLY`, `MONTHLY`, `CUSTOM` |
| `StreakStatus` | Enum | `ACTIVE`, `FROZEN`, `BROKEN`, `RECOVERED`, `COMPLETED` |
| `StreakFreezeSource` | Enum | `PURCHASED`, `EARNED`, `GRANTED`, `SUBSCRIPTION` |
| `StreakNotificationType` | Enum | `AT_RISK`, `MILESTONE`, `BROKEN`, `RECOVERED`, `SOCIAL_NUDGE`, `LEADERBOARD` |
| `StreakRewardType` | Enum | `POINTS`, `TOKENS`, `BADGE`, `ITEM`, `MULTIPLIER`, `CUSTOM` |
| `StreakActivityType` | Enum | `LOGIN`, `PURCHASE`, `CONTENT_CREATE`, `EXERCISE`, `LEARNING`, `CUSTOM` |

### Utilities

| Export | Type | Description |
|--------|------|-------------|
| `calculateDayBoundary` | Function | Compute day start/end in user timezone with reset hour offset |
| `isStreakAlive` | Function | Check if streak is still active given last activity and current time |
| `computeStreakMultiplier` | Function | Calculate reward multiplier based on current streak length |
| `getNextMilestone` | Function | Find the next milestone for a given streak length |
| `formatStreakDuration` | Function | Human-readable streak duration ("23 days", "3 weeks, 2 days") |
| `streakHealthScore` | Function | 0-100 score of how "healthy" a user's streak engagement is |

### Constants

| Export | Type | Description |
|--------|------|-------------|
| `DEFAULT_GRACE_PERIOD_HOURS` | number | Default grace period: `6` hours |
| `DEFAULT_RESET_HOUR` | number | Default daily reset hour: `4` (4:00 AM local) |
| `MAX_FREEZE_INVENTORY` | number | Maximum freeze tokens a user can hold: `5` |
| `MAX_RECOVERY_WINDOW_HOURS` | number | Maximum hours after break for recovery: `48` |
| `STREAK_EVALUATION_BATCH_SIZE` | number | Batch size for cron evaluation: `1000` |
| `LEADERBOARD_REFRESH_INTERVAL_MS` | number | Leaderboard refresh interval: `300000` (5 min) |

---

## Architecture

### System Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                        Client Applications                          │
│  (Web App, Mobile App, API Consumers)                               │
└──────────────┬──────────────────────────────────┬───────────────────┘
               │ tRPC calls                        │ tRPC calls
               ▼                                   ▼
┌──────────────────────────┐      ┌────────────────────────────────┐
│     streakRouter         │      │     streakAdminRouter          │
│  (User Operations)       │      │  (Admin Operations)            │
│                          │      │                                │
│  • getMyStreaks()        │      │  • createDefinition()          │
│  • getStreakState()      │      │  • updateDefinition()          │
│  • recordActivity()     │      │  • grantFreezes()              │
│  • useFreeze()          │      │  • viewAnalytics()             │
│  • recoverStreak()      │      │  • manageMilestones()          │
│  • getLeaderboard()     │      │  • configureNotifications()    │
└──────────┬───────────────┘      └────────────┬───────────────────┘
           │                                    │
           ▼                                    ▼
┌─────────────────────────────────────────────────────────────────────┐
│                         StreakService                                │
│                                                                     │
│  ┌─────────────────┐  ┌──────────────────┐  ┌───────────────────┐  │
│  │ StreakDefinition │  │  StreakFreeze     │  │  StreakRecovery   │  │
│  │ Service          │  │  Service          │  │  Service          │  │
│  └─────────────────┘  └──────────────────┘  └───────────────────┘  │
│                                                                     │
│  ┌─────────────────┐  ┌──────────────────┐  ┌───────────────────┐  │
│  │ StreakReward     │  │  StreakNotify     │  │  StreakLeaderboard│  │
│  │ Service          │  │  Service          │  │  Service          │  │
│  └─────────────────┘  └──────────────────┘  └───────────────────┘  │
│                                                                     │
│  ┌─────────────────┐  ┌──────────────────┐                         │
│  │ StreakAnalytics  │  │  Timezone         │                        │
│  │ Service          │  │  Calculator       │                        │
│  └─────────────────┘  └──────────────────┘                         │
└──────────────────────────┬──────────────────────────────────────────┘
                           │
           ┌───────────────┼───────────────────┐
           ▼               ▼                   ▼
┌──────────────────┐ ┌───────────────┐ ┌─────────────────────┐
│  Supabase        │ │  Redpanda     │ │  Notification       │
│  PostgreSQL      │ │  (Events)     │ │  Channels           │
│                  │ │               │ │                     │
│  • streak_*      │ │  • activity   │ │  • Push (FCM/APNs)  │
│    tables        │ │    .recorded  │ │  • Email (SES)      │
│  • RLS policies  │ │  • streak     │ │  • In-App (WS)      │
│  • Functions     │ │    .evaluated │ │  • SMS (Twilio)     │
└──────────────────┘ │  • streak     │ └─────────────────────┘
                     │    .milestone │
                     │  • streak     │
                     │    .broken    │
                     └───────────────┘
                           ▲
                           │
               ┌───────────┴────────────┐
               │                        │
┌──────────────────────┐  ┌─────────────────────────┐
│ StreakEventConsumer   │  │ StreakEvaluationWorker   │
│ (Real-time)          │  │ (Cron: daily)            │
│                      │  │                          │
│ Listens for activity │  │ Evaluates all active     │
│ events, qualifies    │  │ streaks, applies freezes │
│ them against streak  │  │ breaks inactive streaks  │
│ definitions, updates │  │ distributes daily rewards│
│ streak state         │  │ sends notifications      │
└──────────────────────┘  └─────────────────────────┘
```

### Daily Streak Evaluation Pipeline

The daily evaluation pipeline is the core engine of the streak system. It runs as a cron job (typically at 05:00 UTC, after all timezone reset hours have passed) and processes every active streak to determine its current state.

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    Daily Evaluation Pipeline                             │
│                    (StreakEvaluationWorker)                              │
│                                                                         │
│  Phase 1: Load Active Streaks                                           │
│  ┌────────────────────────────────────────────────────────────────────┐ │
│  │  SELECT user_streaks WHERE status IN ('ACTIVE', 'FROZEN')          │ │
│  │  JOIN streak_definitions for frequency/reset rules                 │ │
│  │  JOIN user profiles for timezone                                   │ │
│  │  Process in batches of STREAK_EVALUATION_BATCH_SIZE                │ │
│  └──────────────────────────────┬─────────────────────────────────────┘ │
│                                 │                                       │
│  Phase 2: Per-Streak Evaluation (for each streak in batch)              │
│  ┌──────────────────────────────▼─────────────────────────────────────┐ │
│  │  2a. Calculate Day Boundary                                        │ │
│  │      • Resolve user timezone (America/Toronto, etc.)               │ │
│  │      • Apply reset hour offset (default: 4:00 AM local)           │ │
│  │      • Determine "yesterday" window (the day being evaluated)      │ │
│  │                                                                    │ │
│  │  2b. Check Activity in Window                                      │ │
│  │      • Query streak_activities for qualifying actions              │ │
│  │      • Match against definition's required_actions                 │ │
│  │      • Respect minimum_count if defined                            │ │
│  │                                                                    │ │
│  │  2c. Decision Tree                                                 │ │
│  │      ┌─────────────────┐                                           │ │
│  │      │ Activity Found? │                                           │ │
│  │      └───────┬─────────┘                                           │ │
│  │          YES │          NO                                         │ │
│  │              │          │                                          │ │
│  │              ▼          ▼                                          │ │
│  │      ┌──────────┐  ┌─────────────────┐                            │ │
│  │      │ INCREMENT │  │ In Grace Period?│                            │ │
│  │      │ streak   │  └───────┬─────────┘                            │ │
│  │      │ count    │     YES  │     NO                               │ │
│  │      └──────────┘          │      │                               │ │
│  │                            ▼      ▼                               │ │
│  │                    ┌─────────┐ ┌──────────────────┐               │ │
│  │                    │ WAIT    │ │ Has Freeze Token? │               │ │
│  │                    │ (skip)  │ └───────┬──────────┘               │ │
│  │                    └─────────┘    YES  │     NO                   │ │
│  │                                        │      │                  │ │
│  │                                        ▼      ▼                  │ │
│  │                                ┌──────────┐ ┌──────────┐         │ │
│  │                                │ CONSUME  │ │ BREAK    │         │ │
│  │                                │ freeze   │ │ streak   │         │ │
│  │                                │ token    │ │          │         │ │
│  │                                └──────────┘ └──────────┘         │ │
│  └────────────────────────────────────────────────────────────────────┘ │
│                                                                         │
│  Phase 3: Post-Evaluation Actions                                       │
│  ┌────────────────────────────────────────────────────────────────────┐ │
│  │  3a. Check Milestones — did any streak cross a milestone?          │ │
│  │  3b. Calculate Rewards — daily rewards + multipliers + milestones  │ │
│  │  3c. Update Leaderboards — refresh materialized rankings           │ │
│  │  3d. Send Notifications — milestones, breaks, at-risk warnings     │ │
│  │  3e. Emit Events — streak.evaluated, streak.milestone, streak.broken│ │
│  │  3f. Update Analytics — refresh aggregate metrics                   │ │
│  └────────────────────────────────────────────────────────────────────┘ │
│                                                                         │
│  Phase 4: Cleanup                                                       │
│  ┌────────────────────────────────────────────────────────────────────┐ │
│  │  • Expire old freeze tokens past their expiry date                 │ │
│  │  • Close recovery windows past MAX_RECOVERY_WINDOW_HOURS           │ │
│  │  • Archive streak_activities older than retention period            │ │
│  │  • Log evaluation summary metrics                                  │ │
│  └────────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────┘
```

### Real-Time Activity Processing

In addition to the daily cron, the system processes activity events in real-time via Redpanda consumers. This enables immediate streak state updates and instant feedback to users.

```
┌──────────────────┐     ┌───────────────────┐     ┌──────────────────────┐
│  User Action     │     │  Feature Module   │     │  Redpanda Topic      │
│  (login, buy,    │────▶│  (auth, commerce, │────▶│  activity.recorded   │
│   create, etc.)  │     │   content, etc.)  │     │                      │
└──────────────────┘     └───────────────────┘     └──────────┬───────────┘
                                                               │
                                                               ▼
                                                   ┌──────────────────────┐
                                                   │  StreakEventConsumer  │
                                                   │                      │
                                                   │  1. Deserialize event│
                                                   │  2. Find matching    │
                                                   │     streak defs      │
                                                   │  3. Record activity  │
                                                   │  4. Update state     │
                                                   │  5. Check milestones │
                                                   │  6. Emit response    │
                                                   │     events           │
                                                   └──────────┬───────────┘
                                                              │
                                              ┌───────────────┼──────────────┐
                                              ▼               ▼              ▼
                                   ┌─────────────┐  ┌──────────────┐ ┌────────────┐
                                   │streak.updated│  │streak.        │ │streak.     │
                                   │              │  │milestone      │ │at_risk     │
                                   │(WebSocket to │  │               │ │            │
                                   │ client for   │  │(trigger       │ │(schedule   │
                                   │ instant UI   │  │ reward        │ │ reminder)  │
                                   │ update)      │  │ distribution) │ │            │
                                   └─────────────┘  └──────────────┘ └────────────┘
```

### Freeze and Recovery Flow

```
┌─────────────────────────────────────────────────────────────────────────┐
│                     Freeze & Recovery Flow                               │
│                                                                         │
│  FREEZE ACQUISITION                                                     │
│  ┌────────────────────────────────────────────────────────────────────┐ │
│  │  Sources:                                                          │ │
│  │  • Purchase with points/tokens (StreakFreezeService.purchase())    │ │
│  │  • Earned via milestone reward (StreakRewardService)               │ │
│  │  • Granted by admin (StreakAdminRouter)                            │ │
│  │  • Subscription perk (auto-grant monthly)                         │ │
│  │                                                                    │ │
│  │  Constraints:                                                      │ │
│  │  • Max inventory: MAX_FREEZE_INVENTORY (5)                        │ │
│  │  • Expiry: configurable per source (30 days default)              │ │
│  │  • Non-transferable between users                                  │ │
│  └────────────────────────────────────────────────────────────────────┘ │
│                                                                         │
│  FREEZE CONSUMPTION (automatic during daily evaluation)                 │
│  ┌────────────────────────────────────────────────────────────────────┐ │
│  │                                                                    │ │
│  │  Missed Day Detected                                               │ │
│  │       │                                                            │ │
│  │       ▼                                                            │ │
│  │  ┌──────────────────────┐     ┌────────────────────────┐           │ │
│  │  │ Check Freeze         │ YES │ Auto-consume oldest    │           │ │
│  │  │ Inventory > 0?       │────▶│ freeze token           │           │ │
│  │  └──────────┬───────────┘     │                        │           │ │
│  │        NO   │                 │ • Mark token consumed   │           │ │
│  │             │                 │ • Set streak FROZEN     │           │ │
│  │             ▼                 │ • Log freeze event      │           │ │
│  │  ┌──────────────────────┐     │ • Notify user           │           │ │
│  │  │ BREAK streak         │     │ • Streak count preserved│           │ │
│  │  │ (see recovery below) │     └────────────────────────┘           │ │
│  │  └──────────────────────┘                                          │ │
│  └────────────────────────────────────────────────────────────────────┘ │
│                                                                         │
│  STREAK RECOVERY (user-initiated after break)                           │
│  ┌────────────────────────────────────────────────────────────────────┐ │
│  │                                                                    │ │
│  │  Streak Broken                                                     │ │
│  │       │                                                            │ │
│  │       ▼                                                            │ │
│  │  ┌──────────────────────────┐                                      │ │
│  │  │ Recovery Window Open?    │                                      │ │
│  │  │ (within N hours of break)│                                      │ │
│  │  └──────────┬───────────────┘                                      │ │
│  │        YES  │       NO                                             │ │
│  │             │        │                                             │ │
│  │             ▼        ▼                                             │ │
│  │  ┌────────────────┐  ┌────────────────┐                            │ │
│  │  │ Calculate Cost │  │ Recovery       │                            │ │
│  │  │                │  │ Unavailable    │                            │ │
│  │  │ Base cost ×    │  │                │                            │ │
│  │  │ streak_length  │  │ Streak resets  │                            │ │
│  │  │ multiplier     │  │ to 0           │                            │ │
│  │  └───────┬────────┘  └────────────────┘                            │ │
│  │          │                                                         │ │
│  │          ▼                                                         │ │
│  │  ┌────────────────────────┐                                        │ │
│  │  │ User Pays Recovery Fee │                                        │ │
│  │  │ (points, tokens, $)    │                                        │ │
│  │  └───────┬────────────────┘                                        │ │
│  │          │                                                         │ │
│  │          ▼                                                         │ │
│  │  ┌────────────────────────┐                                        │ │
│  │  │ Restore Streak         │                                        │ │
│  │  │ • Status → RECOVERED   │                                        │ │
│  │  │ • Count preserved      │                                        │ │
│  │  │ • Recovery logged      │                                        │ │
│  │  │ • Max 3 recoveries/    │                                        │ │
│  │  │   streak lifetime      │                                        │ │
│  │  └────────────────────────┘                                        │ │
│  └────────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────┘
```

### Timezone-Aware Day Boundary Calculation

Correct day boundary calculation is critical. A user in `America/New_York` with a 4:00 AM reset hour should have their "day" run from 4:00 AM ET to 3:59:59 AM ET the next day — regardless of DST transitions.

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    Day Boundary Calculation                              │
│                                                                         │
│  Input: userId, evaluationTimestamp                                     │
│                                                                         │
│  Step 1: Resolve User Timezone                                          │
│  ┌────────────────────────────────────────────────────────────────────┐ │
│  │  user.timezone = "America/New_York"                                │ │
│  │  definition.reset_hour = 4  (4:00 AM local)                       │ │
│  └────────────────────────────────────────────────────────────────────┘ │
│                                                                         │
│  Step 2: Convert to Local Time                                          │
│  ┌────────────────────────────────────────────────────────────────────┐ │
│  │  evaluationLocal = toZonedTime(evaluationTimestamp, "America/NY") │ │
│  │  = 2026-02-08 23:30:00 EST                                        │ │
│  └────────────────────────────────────────────────────────────────────┘ │
│                                                                         │
│  Step 3: Calculate Day Window                                           │
│  ┌────────────────────────────────────────────────────────────────────┐ │
│  │  If localHour >= resetHour:                                        │ │
│  │    dayStart = today @ resetHour                                    │ │
│  │    dayEnd   = tomorrow @ resetHour - 1ms                          │ │
│  │  Else:                                                             │ │
│  │    dayStart = yesterday @ resetHour                                │ │
│  │    dayEnd   = today @ resetHour - 1ms                             │ │
│  │                                                                    │ │
│  │  Result: 2026-02-08 04:00:00 EST → 2026-02-09 03:59:59.999 EST   │ │
│  └────────────────────────────────────────────────────────────────────┘ │
│                                                                         │
│  Step 4: Convert Back to UTC for DB Query                               │
│  ┌────────────────────────────────────────────────────────────────────┐ │
│  │  dayStartUTC = 2026-02-08 09:00:00.000Z                           │ │
│  │  dayEndUTC   = 2026-02-09 08:59:59.999Z                           │ │
│  └────────────────────────────────────────────────────────────────────┘ │
│                                                                         │
│  DST Edge Cases:                                                        │
│  • Spring forward: Day may be 23 hours. Activity window shrinks.        │
│  • Fall back: Day may be 25 hours. Activity window extends.             │
│  • User changes timezone: Re-evaluate from new timezone; preserve       │
│    streak if activity would qualify in either timezone.                  │
└─────────────────────────────────────────────────────────────────────────┘
```

### Event Flow

| Event | Topic | Producer | Consumer | Payload |
|-------|-------|----------|----------|---------|
| Activity recorded | `activity.recorded` | Feature modules | `StreakEventConsumer` | `{ userId, tenantId, activityType, metadata, timestamp }` |
| Streak updated | `streak.updated` | `StreakService` | WebSocket gateway | `{ userId, streakId, newCount, status }` |
| Streak milestone | `streak.milestone` | `StreakEvaluationWorker` | `StreakRewardService`, `StreakNotificationService` | `{ userId, streakId, milestone, rewardType }` |
| Streak broken | `streak.broken` | `StreakEvaluationWorker` | `StreakNotificationService`, `StreakRecoveryService` | `{ userId, streakId, finalCount, recoveryEligible }` |
| Streak frozen | `streak.frozen` | `StreakEvaluationWorker` | `StreakNotificationService` | `{ userId, streakId, freezeTokenId, remainingFreezes }` |
| Streak recovered | `streak.recovered` | `StreakRecoveryService` | `StreakNotificationService`, Analytics | `{ userId, streakId, restoredCount, cost }` |
| Freeze purchased | `streak.freeze.purchased` | `StreakFreezeService` | Analytics | `{ userId, cost, source, newInventory }` |
| Leaderboard updated | `streak.leaderboard.updated` | `StreakLeaderboardService` | WebSocket gateway | `{ streakDefinitionId, topEntries }` |

---

## Core Interfaces

### StreakDefinition

Defines a type of streak that users can participate in. Created by administrators and shared across all users in a tenant.

```typescript
/**
 * Configuration for a streak type.
 *
 * Streak definitions are tenant-scoped and describe what qualifies as
 * streak activity, how frequently it must occur, and what happens when
 * the streak breaks or reaches milestones.
 */
interface StreakDefinition {
  /** Unique identifier */
  id: string;

  /** Tenant this definition belongs to */
  tenantId: string;

  /** Human-readable name ("Daily Login Streak", "Purchase Streak") */
  name: string;

  /** Detailed description shown to users */
  description: string;

  /** URL-safe slug for routing */
  slug: string;

  /** Icon identifier (emoji or icon library reference) */
  icon: string;

  /** Color theme for UI rendering (hex) */
  color: string;

  /**
   * How often the user must act to maintain the streak.
   * DAILY = once per day, WEEKLY = once per week, etc.
   */
  frequency: StreakFrequency;

  /**
   * For CUSTOM frequency: the window size in hours.
   * e.g., 48 = user must act once every 48 hours.
   */
  customWindowHours?: number;

  /**
   * Activity types that qualify for this streak.
   * Multiple types = any of them counts.
   */
  qualifyingActivities: StreakActivityType[];

  /**
   * Optional: specific action identifiers within the activity type.
   * e.g., for CONTENT_CREATE: ["post", "comment", "review"]
   * If empty, any action of the activity type qualifies.
   */
  qualifyingActions?: string[];

  /**
   * Minimum number of qualifying activities per window.
   * Default: 1. Set higher for "do 3 exercises per day" streaks.
   */
  minimumCount: number;

  /**
   * Hour of day (0-23) in user's local timezone when the day resets.
   * Default: 4 (4:00 AM). Most users are asleep, reducing "just missed it" frustration.
   */
  resetHour: number;

  /**
   * Grace period in hours after the reset deadline.
   * Activity within grace period counts for the previous day.
   * Default: 6 hours.
   */
  gracePeriodHours: number;

  /**
   * Whether streak freeze tokens can be used with this streak.
   */
  freezeEnabled: boolean;

  /**
   * Maximum freeze tokens consumable per streak (lifetime).
   * 0 = unlimited. Prevents users from "freeze-walking" indefinitely.
   */
  maxLifetimeFreezes: number;

  /**
   * Whether recovery is available after a break.
   */
  recoveryEnabled: boolean;

  /**
   * Hours after break during which recovery is available.
   */
  recoveryWindowHours: number;

  /**
   * Maximum number of recoveries allowed per streak (lifetime).
   */
  maxLifetimeRecoveries: number;

  /**
   * Base cost for recovery (in points/tokens).
   * Actual cost may scale with streak length.
   */
  recoveryBaseCost: number;

  /**
   * Multiplier applied to recovery cost based on streak length.
   * actualCost = recoveryBaseCost + (currentStreak * recoveryCostMultiplier)
   */
  recoveryCostMultiplier: number;

  /** Milestone definitions for this streak type */
  milestones: StreakMilestone[];

  /**
   * Whether this streak has a maximum length (e.g., 365-day challenge).
   * null = infinite.
   */
  maxLength?: number;

  /**
   * Daily reward configuration.
   * Base reward given each day the streak is maintained.
   */
  dailyReward?: {
    type: StreakRewardType;
    baseAmount: number;
    /** Multiplier curve: amount * (1 + floor(currentStreak / step) * increment) */
    multiplierStep: number;
    multiplierIncrement: number;
    /** Cap on the multiplier to prevent runaway rewards */
    multiplierCap: number;
  };

  /** Whether this is a social/shared streak */
  isSocial: boolean;

  /** For social streaks: minimum participants required */
  socialMinParticipants?: number;

  /** For social streaks: all participants must act (true) or any one (false) */
  socialRequireAll?: boolean;

  /** Whether this streak appears on leaderboards */
  leaderboardEnabled: boolean;

  /** Whether this definition is active and visible to users */
  isActive: boolean;

  /** Sort order for display */
  sortOrder: number;

  /** Creation timestamp */
  createdAt: Date;

  /** Last update timestamp */
  updatedAt: Date;

  /** Soft-delete timestamp */
  archivedAt?: Date;
}
```

### Streak (User Streak)

Represents a specific user's participation in a streak definition.

```typescript
/**
 * A user's streak instance.
 *
 * Created when a user first performs a qualifying activity for a streak
 * definition. Tracks the complete lifecycle of the streak including
 * current count, longest record, freeze usage, and recovery history.
 */
interface Streak {
  /** Unique identifier */
  id: string;

  /** Tenant scope */
  tenantId: string;

  /** User who owns this streak */
  userId: string;

  /** The streak definition this is an instance of */
  definitionId: string;

  /** Resolved definition (populated on read) */
  definition?: StreakDefinition;

  /** Current state of the streak */
  state: StreakState;

  /** Total number of freezes consumed over the streak's lifetime */
  lifetimeFreezeCount: number;

  /** Total number of recoveries used over the streak's lifetime */
  lifetimeRecoveryCount: number;

  /** Timestamp when the user first started this streak */
  firstActivityAt: Date;

  /** Timestamp of the most recent qualifying activity */
  lastActivityAt: Date;

  /** Timestamp of the most recent evaluation */
  lastEvaluatedAt: Date;

  /**
   * Timestamp when the streak was last broken (if ever).
   * Used to calculate recovery window eligibility.
   */
  lastBrokenAt?: Date;

  /**
   * Computed: is this streak currently at risk?
   * True if user hasn't acted today and deadline is within notification window.
   */
  isAtRisk?: boolean;

  /**
   * Computed: next milestone the user will reach.
   */
  nextMilestone?: StreakMilestone;

  /**
   * Computed: current reward multiplier based on streak length.
   */
  currentMultiplier?: number;

  /** Creation timestamp */
  createdAt: Date;

  /** Last update timestamp */
  updatedAt: Date;
}
```

### StreakState

The core state machine for a streak.

```typescript
/**
 * Current state of a user's streak.
 *
 * This is the heart of the streak tracking system. It captures the
 * current count, all-time record, and status in a compact structure
 * that supports the full lifecycle of streak management.
 */
interface StreakState {
  /**
   * Current consecutive count.
   * Incremented daily when activity is recorded.
   * Preserved during freeze. Reset to 0 on break (unless recovered).
   */
  currentCount: number;

  /**
   * Longest streak ever achieved by this user for this definition.
   * Never decreases. Updated whenever currentCount exceeds it.
   */
  longestCount: number;

  /**
   * Total number of days with qualifying activity (including non-consecutive).
   * Useful for "total engagement" metrics separate from streak.
   */
  totalActivityDays: number;

  /**
   * Current status of the streak.
   *
   * ACTIVE    — Streak is alive, user acted within the current window
   * FROZEN    — Streak preserved by freeze token (missed day)
   * BROKEN    — Streak was broken (may be recoverable)
   * RECOVERED — Streak was broken and restored (transitions back to ACTIVE)
   * COMPLETED — Streak reached maxLength and is finished
   */
  status: StreakStatus;

  /**
   * Number of consecutive frozen days.
   * Resets when user acts again.
   * Used to determine if streak should break despite freezes (if > max consecutive).
   */
  consecutiveFrozenDays: number;

  /**
   * Whether activity has been recorded for the current window.
   * Reset at the start of each evaluation cycle.
   */
  currentWindowSatisfied: boolean;

  /**
   * The date (in user's local timezone, YYYY-MM-DD) of the current evaluation window.
   * Used to prevent double-counting activities.
   */
  currentWindowDate: string;
}
```

### StreakFreeze

```typescript
/**
 * A freeze token that can protect a streak from breaking on a missed day.
 *
 * Freeze tokens are consumable items with a limited shelf life.
 * When a user misses a day and has freeze tokens available, the oldest
 * non-expired token is automatically consumed to preserve the streak.
 */
interface StreakFreeze {
  /** Unique identifier */
  id: string;

  /** Tenant scope */
  tenantId: string;

  /** User who owns this token */
  userId: string;

  /**
   * Optional: lock this freeze to a specific streak definition.
   * If null, can be used for any streak.
   */
  definitionId?: string;

  /** How the token was acquired */
  source: StreakFreezeSource;

  /** Points/tokens/currency spent to acquire (0 for earned/granted) */
  acquisitionCost: number;

  /** When the token was acquired */
  acquiredAt: Date;

  /** When the token expires if unused */
  expiresAt: Date;

  /** When the token was consumed (null if unused) */
  consumedAt?: Date;

  /** Which streak consumed this token */
  consumedForStreakId?: string;

  /** The date the freeze covered (YYYY-MM-DD in user timezone) */
  consumedForDate?: string;

  /** Whether the token has been used */
  isConsumed: boolean;

  /** Whether the token has expired without use */
  isExpired: boolean;
}
```

### StreakRecovery

```typescript
/**
 * A streak recovery attempt.
 *
 * When a streak breaks, users may have a limited window to pay
 * a recovery fee and restore their streak count. Recovery costs
 * scale with streak length to create meaningful economic decisions.
 */
interface StreakRecovery {
  /** Unique identifier */
  id: string;

  /** Tenant scope */
  tenantId: string;

  /** User who initiated recovery */
  userId: string;

  /** The streak being recovered */
  streakId: string;

  /** Streak count at time of break */
  streakCountAtBreak: number;

  /** Calculated recovery cost */
  cost: number;

  /** Currency/token type used for payment */
  costCurrency: string;

  /** Whether the recovery was successful */
  succeeded: boolean;

  /**
   * Reason for failure if not succeeded.
   * e.g., "INSUFFICIENT_FUNDS", "WINDOW_EXPIRED", "MAX_RECOVERIES_REACHED"
   */
  failureReason?: string;

  /** When the break occurred */
  brokenAt: Date;

  /** Recovery window deadline */
  recoveryDeadline: Date;

  /** When the recovery was attempted */
  attemptedAt: Date;

  /** When the recovery completed (succeeded or failed) */
  resolvedAt: Date;

  /** Reference to the payment transaction if applicable */
  paymentTransactionId?: string;
}
```

### StreakReward

```typescript
/**
 * A reward distributed for streak activity.
 *
 * Rewards come in two flavors:
 * 1. Daily rewards — given each day the streak is maintained, with multipliers
 * 2. Milestone rewards — given when the streak reaches specific lengths
 */
interface StreakReward {
  /** Unique identifier */
  id: string;

  /** Tenant scope */
  tenantId: string;

  /** User receiving the reward */
  userId: string;

  /** The streak that triggered this reward */
  streakId: string;

  /** Streak definition for quick lookups */
  definitionId: string;

  /** Whether this is a daily or milestone reward */
  category: 'DAILY' | 'MILESTONE';

  /** Type of reward distributed */
  rewardType: StreakRewardType;

  /** Base amount before multipliers */
  baseAmount: number;

  /** Multiplier applied (1.0 = no multiplier) */
  multiplier: number;

  /** Final amount distributed (baseAmount × multiplier) */
  finalAmount: number;

  /** Streak count when this reward was distributed */
  streakCountAtReward: number;

  /** For milestone rewards: which milestone was reached */
  milestoneDay?: number;

  /** Whether the reward has been claimed/distributed */
  distributed: boolean;

  /** When the reward was distributed */
  distributedAt?: Date;

  /** Reference to the reward fulfillment system */
  fulfillmentId?: string;

  /** Creation timestamp */
  createdAt: Date;
}
```

### StreakMilestone

```typescript
/**
 * A milestone definition within a streak.
 *
 * Milestones mark significant streak lengths and trigger special rewards.
 * They create "goal posts" that motivate users to keep their streak alive.
 */
interface StreakMilestone {
  /** Unique identifier */
  id: string;

  /** The streak definition this milestone belongs to */
  definitionId: string;

  /** Day count that triggers this milestone */
  dayThreshold: number;

  /** Display name ("One Week Warrior", "Monthly Master") */
  name: string;

  /** Description shown to user */
  description: string;

  /** Icon/badge for the milestone */
  icon: string;

  /** Reward type for reaching this milestone */
  rewardType: StreakRewardType;

  /** Reward amount */
  rewardAmount: number;

  /**
   * Whether this milestone repeats.
   * e.g., every 30 days = milestone at 30, 60, 90, ...
   */
  isRepeating: boolean;

  /** For repeating milestones: the repeat interval */
  repeatInterval?: number;

  /** Whether to send a notification when reached */
  notifyOnReach: boolean;

  /** Whether to show a celebration animation */
  celebrationEnabled: boolean;

  /** Sort order for display */
  sortOrder: number;
}
```

### StreakNotification

```typescript
/**
 * A notification related to streak activity.
 *
 * The system generates notifications for:
 * - At-risk warnings (haven't acted today, deadline approaching)
 * - Milestone celebrations (reached a new milestone)
 * - Streak broken (streak has ended)
 * - Streak recovered (user restored a broken streak)
 * - Social nudges (partner hasn't acted in a shared streak)
 * - Leaderboard changes (moved up/down in rankings)
 */
interface StreakNotification {
  /** Unique identifier */
  id: string;

  /** Tenant scope */
  tenantId: string;

  /** User receiving the notification */
  userId: string;

  /** The streak this notification is about */
  streakId: string;

  /** Type of notification */
  type: StreakNotificationType;

  /** Notification title */
  title: string;

  /** Notification body */
  body: string;

  /** Additional data payload */
  data: Record<string, unknown>;

  /** Channels this was sent through */
  channels: ('push' | 'email' | 'in_app' | 'sms')[];

  /** Delivery status per channel */
  deliveryStatus: Record<string, 'pending' | 'sent' | 'delivered' | 'failed'>;

  /** Whether the user has seen/acknowledged this notification */
  isRead: boolean;

  /** Scheduled send time (for at-risk reminders) */
  scheduledAt?: Date;

  /** Actual send time */
  sentAt?: Date;

  /** When the user read the notification */
  readAt?: Date;

  /** Creation timestamp */
  createdAt: Date;
}
```

### StreakActivity

```typescript
/**
 * A recorded qualifying activity for streak purposes.
 *
 * Every user action that qualifies for a streak is logged here.
 * This provides the audit trail for streak evaluation and enables
 * retroactive analysis if streak rules change.
 */
interface StreakActivity {
  /** Unique identifier */
  id: string;

  /** Tenant scope */
  tenantId: string;

  /** User who performed the activity */
  userId: string;

  /** The streak definition this was evaluated against */
  definitionId: string;

  /** The user streak this contributed to */
  streakId: string;

  /** Activity type */
  activityType: StreakActivityType;

  /** Specific action within the activity type */
  action: string;

  /** Additional context about the activity */
  metadata: Record<string, unknown>;

  /** Original event timestamp (from the source system) */
  eventTimestamp: Date;

  /** User's timezone at time of activity */
  userTimezone: string;

  /** Resolved local date (YYYY-MM-DD) for the activity in user's timezone */
  localDate: string;

  /** Whether this activity was within the grace period */
  wasGracePeriod: boolean;

  /** Whether this activity was the one that satisfied the current window */
  wasSatisfying: boolean;

  /** Source event ID for deduplication */
  sourceEventId: string;

  /** Creation timestamp */
  createdAt: Date;
}
```

### SocialStreak

```typescript
/**
 * A shared streak between multiple users.
 *
 * Social streaks require coordinated activity — similar to Snapchat's
 * streak mechanic. All (or a minimum number of) participants must act
 * within each window to maintain the streak.
 */
interface SocialStreak {
  /** Unique identifier */
  id: string;

  /** Tenant scope */
  tenantId: string;

  /** The streak definition */
  definitionId: string;

  /** Participant user IDs */
  participantIds: string[];

  /** Current state (shared across all participants) */
  state: StreakState;

  /**
   * Per-participant activity status for current window.
   * Maps userId → whether they've acted in the current window.
   */
  participantStatus: Record<string, {
    satisfied: boolean;
    lastActivityAt?: Date;
  }>;

  /** User who initiated/created this social streak */
  createdByUserId: string;

  /** Invite code for adding participants */
  inviteCode: string;

  /** Whether the social streak is accepting new participants */
  isOpen: boolean;

  /** Creation timestamp */
  createdAt: Date;

  /** Last update timestamp */
  updatedAt: Date;
}
```

### TeamStreak

```typescript
/**
 * A team-level streak that aggregates member activity.
 *
 * Team streaks reward collective consistency. The team's streak
 * is maintained when a sufficient percentage of members act within
 * each window. This creates positive peer pressure and social accountability.
 */
interface TeamStreak {
  /** Unique identifier */
  id: string;

  /** Tenant scope */
  tenantId: string;

  /** The streak definition */
  definitionId: string;

  /** Team/group identifier */
  teamId: string;

  /** Current state */
  state: StreakState;

  /** Total team members */
  memberCount: number;

  /**
   * Minimum percentage of members that must act to maintain streak.
   * e.g., 0.8 = 80% of members must act.
   */
  requiredParticipationRate: number;

  /**
   * Members who have acted in the current window.
   */
  currentWindowParticipants: string[];

  /** Current participation rate for the window */
  currentParticipationRate: number;

  /** Creation timestamp */
  createdAt: Date;

  /** Last update timestamp */
  updatedAt: Date;
}
```

### StreakAnalytics

```typescript
/**
 * Analytics snapshot for streak engagement.
 *
 * Provides aggregate metrics that product teams use to evaluate
 * streak effectiveness and tune parameters.
 */
interface StreakAnalytics {
  /** Streak definition these analytics are for */
  definitionId: string;

  /** Time range for the analytics */
  periodStart: Date;
  periodEnd: Date;

  /** Total users with an active streak */
  activeStreakCount: number;

  /** Total users with a broken streak in the period */
  brokenStreakCount: number;

  /** Distribution of active streak lengths */
  streakLengthDistribution: {
    bucket: string;        // "1-7", "8-14", "15-30", "31-60", "61-100", "100+"
    count: number;
    percentage: number;
  }[];

  /** Average current streak length across active users */
  averageStreakLength: number;

  /** Median current streak length */
  medianStreakLength: number;

  /** 90th percentile streak length */
  p90StreakLength: number;

  /** Longest active streak */
  longestActiveStreak: number;

  /** Streak break patterns by day of week */
  breakPatternByDay: {
    dayOfWeek: number;     // 0=Sunday, 6=Saturday
    dayName: string;
    breakCount: number;
    percentage: number;
  }[];

  /** Streak break patterns by hour of day */
  breakPatternByHour: {
    hour: number;
    breakCount: number;
    percentage: number;
  }[];

  /** Freeze usage metrics */
  freezeMetrics: {
    totalConsumed: number;
    totalPurchased: number;
    totalExpired: number;
    averageFreezeInventory: number;
    freezeSaveRate: number;  // % of would-be breaks prevented by freezes
  };

  /** Recovery metrics */
  recoveryMetrics: {
    totalAttempted: number;
    totalSucceeded: number;
    totalFailed: number;
    recoveryRate: number;          // % of broken streaks that were recovered
    averageRecoveryCost: number;
    totalRecoveryRevenue: number;
  };

  /** Engagement correlation */
  engagementMetrics: {
    /** Average activities per user per day among active streak holders */
    avgDailyActivities: number;
    /** Retention rate of users with streaks vs without */
    streakUserRetentionRate: number;
    nonStreakUserRetentionRate: number;
    /** Revenue per user with streak vs without */
    streakUserArpu: number;
    nonStreakUserArpu: number;
  };

  /** Social streak metrics */
  socialMetrics?: {
    activeSocialStreaks: number;
    averageParticipants: number;
    socialStreakBreakRate: number;
    nudgeEffectiveness: number;    // % of nudges that prevented a break
  };

  /** Generated timestamp */
  generatedAt: Date;
}
```

### StreakService

```typescript
/**
 * Primary service for streak operations.
 *
 * Handles the full lifecycle of user streaks: creation, activity recording,
 * state queries, freeze management, and recovery. All operations are
 * tenant-scoped and respect RLS policies.
 */
interface StreakService {
  /**
   * Get all active streaks for a user.
   * Returns streaks with current state, next milestone, and at-risk status.
   */
  getUserStreaks(
    userId: string,
    options?: {
      includeDefinition?: boolean;
      includeNextMilestone?: boolean;
      status?: StreakStatus[];
    }
  ): Promise<Streak[]>;

  /**
   * Get a specific streak by ID.
   */
  getStreak(streakId: string): Promise<Streak | null>;

  /**
   * Get streak state for a user and definition.
   * Creates the streak if it doesn't exist.
   */
  getOrCreateStreak(
    userId: string,
    definitionId: string
  ): Promise<Streak>;

  /**
   * Record a qualifying activity for streak evaluation.
   *
   * This is the primary entry point for streak progression.
   * The activity is evaluated against all matching streak definitions,
   * and streak states are updated accordingly.
   *
   * @returns Updated streaks affected by this activity
   */
  recordActivity(params: {
    userId: string;
    activityType: StreakActivityType;
    action: string;
    metadata?: Record<string, unknown>;
    timestamp?: Date;
    sourceEventId: string;
  }): Promise<{
    affectedStreaks: Streak[];
    milestonesReached: StreakMilestone[];
    rewardsDistributed: StreakReward[];
  }>;

  /**
   * Check if a streak is alive and healthy.
   */
  isStreakAlive(streakId: string): Promise<boolean>;

  /**
   * Get the user's streak history (past streaks including broken ones).
   */
  getStreakHistory(
    userId: string,
    definitionId: string,
    options?: {
      limit?: number;
      offset?: number;
    }
  ): Promise<{
    streaks: Streak[];
    totalBroken: number;
    longestEver: number;
  }>;

  /**
   * Get streak summary for user profile display.
   */
  getStreakSummary(userId: string): Promise<{
    activeStreaks: number;
    longestCurrentStreak: number;
    longestEverStreak: number;
    totalStreakDays: number;
    freezesAvailable: number;
  }>;

  /**
   * Force-evaluate a specific streak (admin use).
   * Triggers the evaluation pipeline for a single streak outside of cron.
   */
  evaluateStreak(streakId: string): Promise<Streak>;

  /**
   * Get streak comparison between two users.
   */
  compareStreaks(
    userId1: string,
    userId2: string,
    definitionId: string
  ): Promise<{
    user1: Streak;
    user2: Streak;
    difference: number;
    leader: string;
  }>;
}
```

---

## Database Schemas

### streak_definitions

```typescript
import {
  pgTable,
  text,
  timestamp,
  boolean,
  integer,
  jsonb,
  real,
  uuid,
  index,
  uniqueIndex,
} from 'drizzle-orm/pg-core';
import { tenantId } from '@mcv/db/columns';

/**
 * Streak type definitions.
 *
 * Each row defines a type of streak that users can participate in.
 * Definitions are tenant-scoped and configurable without code changes.
 *
 * RLS: Tenant-isolated. Admins can CRUD, users can SELECT active definitions.
 */
export const streakDefinitions = pgTable(
  'streak_definitions',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: tenantId(),
    name: text('name').notNull(),
    description: text('description').notNull().default(''),
    slug: text('slug').notNull(),
    icon: text('icon').notNull().default('🔥'),
    color: text('color').notNull().default('#FF6B00'),

    frequency: text('frequency', {
      enum: ['DAILY', 'WEEKLY', 'BIWEEKLY', 'MONTHLY', 'CUSTOM'],
    }).notNull().default('DAILY'),
    customWindowHours: integer('custom_window_hours'),

    qualifyingActivities: jsonb('qualifying_activities')
      .$type<string[]>()
      .notNull()
      .default([]),
    qualifyingActions: jsonb('qualifying_actions')
      .$type<string[]>()
      .default([]),
    minimumCount: integer('minimum_count').notNull().default(1),

    resetHour: integer('reset_hour').notNull().default(4),
    gracePeriodHours: integer('grace_period_hours').notNull().default(6),

    freezeEnabled: boolean('freeze_enabled').notNull().default(true),
    maxLifetimeFreezes: integer('max_lifetime_freezes').notNull().default(0),

    recoveryEnabled: boolean('recovery_enabled').notNull().default(true),
    recoveryWindowHours: integer('recovery_window_hours').notNull().default(48),
    maxLifetimeRecoveries: integer('max_lifetime_recoveries').notNull().default(3),
    recoveryBaseCost: integer('recovery_base_cost').notNull().default(100),
    recoveryCostMultiplier: real('recovery_cost_multiplier').notNull().default(2.0),

    dailyRewardConfig: jsonb('daily_reward_config').$type<{
      type: string;
      baseAmount: number;
      multiplierStep: number;
      multiplierIncrement: number;
      multiplierCap: number;
    }>(),

    maxLength: integer('max_length'),

    isSocial: boolean('is_social').notNull().default(false),
    socialMinParticipants: integer('social_min_participants'),
    socialRequireAll: boolean('social_require_all').default(true),

    leaderboardEnabled: boolean('leaderboard_enabled').notNull().default(true),

    isActive: boolean('is_active').notNull().default(true),
    sortOrder: integer('sort_order').notNull().default(0),

    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    archivedAt: timestamp('archived_at', { withTimezone: true }),
  },
  (table) => ({
    tenantIdx: index('streak_def_tenant_idx').on(table.tenantId),
    slugIdx: uniqueIndex('streak_def_slug_idx').on(table.tenantId, table.slug),
    activeIdx: index('streak_def_active_idx').on(
      table.tenantId,
      table.isActive
    ),
  })
);
```

### user_streaks

```typescript
/**
 * Per-user streak instances.
 *
 * Each row tracks a specific user's participation in a streak definition.
 * Contains the core state (current count, longest, status) and metadata
 * for freeze/recovery tracking.
 *
 * RLS: Users can SELECT/UPDATE their own rows. Admins can SELECT all.
 * INSERT handled by service (on first qualifying activity).
 */
export const userStreaks = pgTable(
  'user_streaks',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: tenantId(),
    userId: uuid('user_id').notNull(),
    definitionId: uuid('definition_id')
      .notNull()
      .references(() => streakDefinitions.id),

    // Core state
    currentCount: integer('current_count').notNull().default(0),
    longestCount: integer('longest_count').notNull().default(0),
    totalActivityDays: integer('total_activity_days').notNull().default(0),
    status: text('status', {
      enum: ['ACTIVE', 'FROZEN', 'BROKEN', 'RECOVERED', 'COMPLETED'],
    }).notNull().default('ACTIVE'),

    consecutiveFrozenDays: integer('consecutive_frozen_days')
      .notNull()
      .default(0),
    currentWindowSatisfied: boolean('current_window_satisfied')
      .notNull()
      .default(false),
    currentWindowDate: text('current_window_date'),

    // Lifetime counters
    lifetimeFreezeCount: integer('lifetime_freeze_count').notNull().default(0),
    lifetimeRecoveryCount: integer('lifetime_recovery_count')
      .notNull()
      .default(0),

    // Timestamps
    firstActivityAt: timestamp('first_activity_at', { withTimezone: true }),
    lastActivityAt: timestamp('last_activity_at', { withTimezone: true }),
    lastEvaluatedAt: timestamp('last_evaluated_at', { withTimezone: true }),
    lastBrokenAt: timestamp('last_broken_at', { withTimezone: true }),

    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    userDefIdx: uniqueIndex('user_streak_user_def_idx').on(
      table.tenantId,
      table.userId,
      table.definitionId
    ),
    userIdx: index('user_streak_user_idx').on(table.tenantId, table.userId),
    statusIdx: index('user_streak_status_idx').on(
      table.tenantId,
      table.status
    ),
    lastActivityIdx: index('user_streak_last_activity_idx').on(
      table.lastActivityAt
    ),
    currentCountIdx: index('user_streak_current_count_idx').on(
      table.tenantId,
      table.definitionId,
      table.currentCount
    ),
  })
);
```

### streak_activities

```typescript
/**
 * Activity log for streak qualification.
 *
 * Every qualifying user action is recorded here with full context.
 * Used for:
 * - Streak evaluation (did the user act within the window?)
 * - Audit trail (prove why a streak was incremented/broken)
 * - Retroactive analysis (if rules change, re-evaluate from history)
 * - Deduplication (sourceEventId prevents double-counting)
 *
 * RLS: Users can SELECT their own. Admins can SELECT all.
 * INSERT only via StreakService (not direct user access).
 *
 * Partitioned by month for performance (high-volume table).
 */
export const streakActivities = pgTable(
  'streak_activities',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: tenantId(),
    userId: uuid('user_id').notNull(),
    definitionId: uuid('definition_id')
      .notNull()
      .references(() => streakDefinitions.id),
    streakId: uuid('streak_id')
      .notNull()
      .references(() => userStreaks.id),

    activityType: text('activity_type').notNull(),
    action: text('action').notNull(),
    metadata: jsonb('metadata').$type<Record<string, unknown>>().default({}),

    eventTimestamp: timestamp('event_timestamp', { withTimezone: true })
      .notNull(),
    userTimezone: text('user_timezone').notNull(),
    localDate: text('local_date').notNull(), // YYYY-MM-DD
    wasGracePeriod: boolean('was_grace_period').notNull().default(false),
    wasSatisfying: boolean('was_satisfying').notNull().default(false),
    sourceEventId: text('source_event_id').notNull(),

    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    userStreakIdx: index('streak_act_user_streak_idx').on(
      table.streakId,
      table.localDate
    ),
    sourceEventIdx: uniqueIndex('streak_act_source_event_idx').on(
      table.tenantId,
      table.sourceEventId
    ),
    dateIdx: index('streak_act_date_idx').on(
      table.tenantId,
      table.definitionId,
      table.localDate
    ),
  })
);
```

### streak_freezes

```typescript
/**
 * Freeze token inventory and usage.
 *
 * Freeze tokens are consumable items that protect streaks.
 * This table tracks acquisition, expiry, and consumption.
 *
 * RLS: Users can SELECT their own. INSERT via service only.
 */
export const streakFreezes = pgTable(
  'streak_freezes',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: tenantId(),
    userId: uuid('user_id').notNull(),
    definitionId: uuid('definition_id').references(
      () => streakDefinitions.id
    ),

    source: text('source', {
      enum: ['PURCHASED', 'EARNED', 'GRANTED', 'SUBSCRIPTION'],
    }).notNull(),
    acquisitionCost: integer('acquisition_cost').notNull().default(0),

    acquiredAt: timestamp('acquired_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),

    consumedAt: timestamp('consumed_at', { withTimezone: true }),
    consumedForStreakId: uuid('consumed_for_streak_id').references(
      () => userStreaks.id
    ),
    consumedForDate: text('consumed_for_date'),

    isConsumed: boolean('is_consumed').notNull().default(false),
    isExpired: boolean('is_expired').notNull().default(false),

    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    userAvailableIdx: index('streak_freeze_user_available_idx').on(
      table.tenantId,
      table.userId,
      table.isConsumed,
      table.isExpired
    ),
    expiryIdx: index('streak_freeze_expiry_idx').on(
      table.expiresAt,
      table.isConsumed,
      table.isExpired
    ),
  })
);
```

### streak_recoveries

```typescript
/**
 * Recovery attempt records.
 *
 * Tracks every recovery attempt (successful or failed) for audit
 * and analytics purposes.
 *
 * RLS: Users can SELECT their own. INSERT via service only.
 */
export const streakRecoveries = pgTable(
  'streak_recoveries',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: tenantId(),
    userId: uuid('user_id').notNull(),
    streakId: uuid('streak_id')
      .notNull()
      .references(() => userStreaks.id),

    streakCountAtBreak: integer('streak_count_at_break').notNull(),
    cost: integer('cost').notNull(),
    costCurrency: text('cost_currency').notNull().default('points'),

    succeeded: boolean('succeeded').notNull(),
    failureReason: text('failure_reason'),

    brokenAt: timestamp('broken_at', { withTimezone: true }).notNull(),
    recoveryDeadline: timestamp('recovery_deadline', { withTimezone: true })
      .notNull(),
    attemptedAt: timestamp('attempted_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    resolvedAt: timestamp('resolved_at', { withTimezone: true })
      .notNull()
      .defaultNow(),

    paymentTransactionId: text('payment_transaction_id'),

    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    streakIdx: index('streak_recovery_streak_idx').on(table.streakId),
    userIdx: index('streak_recovery_user_idx').on(
      table.tenantId,
      table.userId
    ),
  })
);
```

### streak_rewards

```typescript
/**
 * Distributed reward records.
 *
 * Logs every reward given for streak activity. Links back to the
 * streak and milestone that triggered it, and forward to the
 * reward fulfillment system.
 *
 * RLS: Users can SELECT their own. INSERT via service only.
 */
export const streakRewards = pgTable(
  'streak_rewards',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: tenantId(),
    userId: uuid('user_id').notNull(),
    streakId: uuid('streak_id')
      .notNull()
      .references(() => userStreaks.id),
    definitionId: uuid('definition_id')
      .notNull()
      .references(() => streakDefinitions.id),

    category: text('category', { enum: ['DAILY', 'MILESTONE'] }).notNull(),
    rewardType: text('reward_type', {
      enum: ['POINTS', 'TOKENS', 'BADGE', 'ITEM', 'MULTIPLIER', 'CUSTOM'],
    }).notNull(),

    baseAmount: integer('base_amount').notNull(),
    multiplier: real('multiplier').notNull().default(1.0),
    finalAmount: integer('final_amount').notNull(),

    streakCountAtReward: integer('streak_count_at_reward').notNull(),
    milestoneDay: integer('milestone_day'),

    distributed: boolean('distributed').notNull().default(false),
    distributedAt: timestamp('distributed_at', { withTimezone: true }),
    fulfillmentId: text('fulfillment_id'),

    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    userIdx: index('streak_reward_user_idx').on(table.tenantId, table.userId),
    streakIdx: index('streak_reward_streak_idx').on(table.streakId),
    undistributedIdx: index('streak_reward_undistributed_idx').on(
      table.distributed,
      table.createdAt
    ),
  })
);
```

### streak_milestones

```typescript
/**
 * Milestone definitions per streak type.
 *
 * Defines the goal posts within each streak definition.
 * Separated from streak_definitions for flexibility (many milestones per definition).
 *
 * RLS: Same as streak_definitions (tenant-isolated, admin writable).
 */
export const streakMilestones = pgTable(
  'streak_milestones',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    definitionId: uuid('definition_id')
      .notNull()
      .references(() => streakDefinitions.id, { onDelete: 'cascade' }),

    dayThreshold: integer('day_threshold').notNull(),
    name: text('name').notNull(),
    description: text('description').notNull().default(''),
    icon: text('icon').notNull().default('⭐'),

    rewardType: text('reward_type', {
      enum: ['POINTS', 'TOKENS', 'BADGE', 'ITEM', 'MULTIPLIER', 'CUSTOM'],
    }).notNull(),
    rewardAmount: integer('reward_amount').notNull(),

    isRepeating: boolean('is_repeating').notNull().default(false),
    repeatInterval: integer('repeat_interval'),

    notifyOnReach: boolean('notify_on_reach').notNull().default(true),
    celebrationEnabled: boolean('celebration_enabled').notNull().default(true),

    sortOrder: integer('sort_order').notNull().default(0),

    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    definitionIdx: index('streak_milestone_def_idx').on(table.definitionId),
    thresholdIdx: index('streak_milestone_threshold_idx').on(
      table.definitionId,
      table.dayThreshold
    ),
  })
);
```

### streak_notifications

```typescript
/**
 * Notification dispatch log.
 *
 * Tracks all streak-related notifications sent to users.
 * Used for delivery tracking, deduplication, and notification preferences.
 *
 * RLS: Users can SELECT/UPDATE (mark read) their own.
 */
export const streakNotifications = pgTable(
  'streak_notifications',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: tenantId(),
    userId: uuid('user_id').notNull(),
    streakId: uuid('streak_id').references(() => userStreaks.id),

    type: text('type', {
      enum: [
        'AT_RISK',
        'MILESTONE',
        'BROKEN',
        'RECOVERED',
        'SOCIAL_NUDGE',
        'LEADERBOARD',
      ],
    }).notNull(),

    title: text('title').notNull(),
    body: text('body').notNull(),
    data: jsonb('data').$type<Record<string, unknown>>().default({}),

    channels: jsonb('channels').$type<string[]>().notNull().default([]),
    deliveryStatus: jsonb('delivery_status')
      .$type<Record<string, string>>()
      .notNull()
      .default({}),

    isRead: boolean('is_read').notNull().default(false),

    scheduledAt: timestamp('scheduled_at', { withTimezone: true }),
    sentAt: timestamp('sent_at', { withTimezone: true }),
    readAt: timestamp('read_at', { withTimezone: true }),

    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    userIdx: index('streak_notif_user_idx').on(table.tenantId, table.userId),
    unreadIdx: index('streak_notif_unread_idx').on(
      table.tenantId,
      table.userId,
      table.isRead
    ),
    scheduledIdx: index('streak_notif_scheduled_idx').on(
      table.scheduledAt,
      table.sentAt
    ),
  })
);
```

### streak_leaderboards

```typescript
/**
 * Materialized leaderboard snapshots.
 *
 * Pre-computed leaderboard rankings refreshed periodically.
 * This avoids expensive real-time sorting of the user_streaks table
 * and provides stable rankings for display.
 *
 * RLS: All authenticated users in the tenant can SELECT.
 * INSERT/UPDATE via StreakLeaderboardService only.
 */
export const streakLeaderboards = pgTable(
  'streak_leaderboards',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: tenantId(),
    definitionId: uuid('definition_id')
      .notNull()
      .references(() => streakDefinitions.id),

    userId: uuid('user_id').notNull(),
    rank: integer('rank').notNull(),
    currentCount: integer('current_count').notNull(),
    longestCount: integer('longest_count').notNull(),

    /** Percentile (0-100) — what percentage of users this streak beats */
    percentile: real('percentile').notNull(),

    /** Period for time-scoped leaderboards */
    period: text('period', {
      enum: ['ALL_TIME', 'MONTHLY', 'WEEKLY'],
    }).notNull().default('ALL_TIME'),

    /** For periodic leaderboards: the period identifier (e.g., "2026-W06") */
    periodKey: text('period_key'),

    /** When this snapshot was computed */
    computedAt: timestamp('computed_at', { withTimezone: true })
      .notNull()
      .defaultNow(),

    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    rankingIdx: index('streak_lb_ranking_idx').on(
      table.tenantId,
      table.definitionId,
      table.period,
      table.rank
    ),
    userIdx: index('streak_lb_user_idx').on(
      table.tenantId,
      table.userId,
      table.definitionId
    ),
    periodIdx: index('streak_lb_period_idx').on(
      table.definitionId,
      table.period,
      table.periodKey
    ),
  })
);
```

### social_streaks

```typescript
/**
 * Shared/social streak state.
 *
 * Tracks streaks shared between multiple users.
 * Participant status is stored as JSONB for flexibility with
 * varying participant counts.
 *
 * RLS: Participants can SELECT their own social streaks.
 */
export const socialStreaks = pgTable(
  'social_streaks',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: tenantId(),
    definitionId: uuid('definition_id')
      .notNull()
      .references(() => streakDefinitions.id),

    participantIds: jsonb('participant_ids').$type<string[]>().notNull(),
    participantStatus: jsonb('participant_status')
      .$type<Record<string, { satisfied: boolean; lastActivityAt?: string }>>()
      .notNull()
      .default({}),

    // Core state (same fields as user_streaks)
    currentCount: integer('current_count').notNull().default(0),
    longestCount: integer('longest_count').notNull().default(0),
    status: text('status', {
      enum: ['ACTIVE', 'FROZEN', 'BROKEN', 'RECOVERED', 'COMPLETED'],
    }).notNull().default('ACTIVE'),
    currentWindowDate: text('current_window_date'),
    currentWindowSatisfied: boolean('current_window_satisfied')
      .notNull()
      .default(false),

    createdByUserId: uuid('created_by_user_id').notNull(),
    inviteCode: text('invite_code').notNull(),
    isOpen: boolean('is_open').notNull().default(true),

    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    inviteCodeIdx: uniqueIndex('social_streak_invite_idx').on(
      table.inviteCode
    ),
    tenantIdx: index('social_streak_tenant_idx').on(
      table.tenantId,
      table.definitionId
    ),
  })
);
```

### team_streaks

```typescript
/**
 * Team-level streak aggregation.
 *
 * Tracks collective streak progress for teams/groups.
 *
 * RLS: Team members can SELECT their team's streaks.
 */
export const teamStreaks = pgTable(
  'team_streaks',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: tenantId(),
    definitionId: uuid('definition_id')
      .notNull()
      .references(() => streakDefinitions.id),
    teamId: uuid('team_id').notNull(),

    // Core state
    currentCount: integer('current_count').notNull().default(0),
    longestCount: integer('longest_count').notNull().default(0),
    status: text('status', {
      enum: ['ACTIVE', 'FROZEN', 'BROKEN', 'RECOVERED', 'COMPLETED'],
    }).notNull().default('ACTIVE'),
    currentWindowDate: text('current_window_date'),

    memberCount: integer('member_count').notNull().default(0),
    requiredParticipationRate: real('required_participation_rate')
      .notNull()
      .default(0.8),
    currentWindowParticipants: jsonb('current_window_participants')
      .$type<string[]>()
      .notNull()
      .default([]),
    currentParticipationRate: real('current_participation_rate')
      .notNull()
      .default(0),

    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    teamDefIdx: uniqueIndex('team_streak_team_def_idx').on(
      table.tenantId,
      table.teamId,
      table.definitionId
    ),
    teamIdx: index('team_streak_team_idx').on(table.tenantId, table.teamId),
  })
);
```

### RLS Policies

```sql
-- streak_definitions: Tenant-isolated, all authenticated users can read active
ALTER TABLE streak_definitions ENABLE ROW LEVEL SECURITY;

CREATE POLICY streak_definitions_tenant_read ON streak_definitions
  FOR SELECT USING (
    tenant_id = current_setting('app.tenant_id')::uuid
    AND is_active = true
  );

CREATE POLICY streak_definitions_admin_all ON streak_definitions
  FOR ALL USING (
    tenant_id = current_setting('app.tenant_id')::uuid
    AND current_setting('app.user_role') = 'admin'
  );

-- user_streaks: Users see their own, admins see all in tenant
ALTER TABLE user_streaks ENABLE ROW LEVEL SECURITY;

CREATE POLICY user_streaks_own ON user_streaks
  FOR SELECT USING (
    tenant_id = current_setting('app.tenant_id')::uuid
    AND user_id = current_setting('app.user_id')::uuid
  );

CREATE POLICY user_streaks_admin ON user_streaks
  FOR ALL USING (
    tenant_id = current_setting('app.tenant_id')::uuid
    AND current_setting('app.user_role') = 'admin'
  );

-- streak_activities: Users see their own
ALTER TABLE streak_activities ENABLE ROW LEVEL SECURITY;

CREATE POLICY streak_activities_own ON streak_activities
  FOR SELECT USING (
    tenant_id = current_setting('app.tenant_id')::uuid
    AND user_id = current_setting('app.user_id')::uuid
  );

-- streak_freezes: Users see their own
ALTER TABLE streak_freezes ENABLE ROW LEVEL SECURITY;

CREATE POLICY streak_freezes_own ON streak_freezes
  FOR SELECT USING (
    tenant_id = current_setting('app.tenant_id')::uuid
    AND user_id = current_setting('app.user_id')::uuid
  );

-- streak_leaderboards: All authenticated users in tenant can read
ALTER TABLE streak_leaderboards ENABLE ROW LEVEL SECURITY;

CREATE POLICY streak_leaderboards_tenant_read ON streak_leaderboards
  FOR SELECT USING (
    tenant_id = current_setting('app.tenant_id')::uuid
  );

-- social_streaks: Participants can read their own
ALTER TABLE social_streaks ENABLE ROW LEVEL SECURITY;

CREATE POLICY social_streaks_participant ON social_streaks
  FOR SELECT USING (
    tenant_id = current_setting('app.tenant_id')::uuid
    AND participant_ids @> jsonb_build_array(current_setting('app.user_id')::uuid)
  );

-- streak_notifications: Users see their own
ALTER TABLE streak_notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY streak_notifications_own ON streak_notifications
  FOR ALL USING (
    tenant_id = current_setting('app.tenant_id')::uuid
    AND user_id = current_setting('app.user_id')::uuid
  );
```

---

## Code Examples

### Example 1: Creating a Daily Login Streak Definition

```typescript
import { StreakDefinitionService } from '@mcv/engagement/streaks';
import { StreakFrequency, StreakActivityType, StreakRewardType } from '@mcv/engagement/streaks';

/**
 * Create a "Daily Login" streak definition.
 *
 * This is the most common streak type — reward users for logging in
 * every day. Includes milestone rewards at 7, 30, and 100 days,
 * escalating daily point rewards, and freeze/recovery support.
 */
async function createDailyLoginStreak(
  definitionService: StreakDefinitionService,
  tenantId: string
) {
  const definition = await definitionService.create({
    tenantId,
    name: 'Daily Login Streak',
    description:
      'Log in every day to build your streak! Earn escalating rewards and unlock milestone bonuses.',
    slug: 'daily-login',
    icon: '🔥',
    color: '#FF6B00',

    // Frequency and qualifying actions
    frequency: StreakFrequency.DAILY,
    qualifyingActivities: [StreakActivityType.LOGIN],
    minimumCount: 1,

    // Day boundary
    resetHour: 4,           // 4:00 AM local time
    gracePeriodHours: 6,    // Until 10:00 AM local

    // Freeze configuration
    freezeEnabled: true,
    maxLifetimeFreezes: 0,  // Unlimited lifetime freezes

    // Recovery configuration
    recoveryEnabled: true,
    recoveryWindowHours: 48,
    maxLifetimeRecoveries: 3,
    recoveryBaseCost: 50,          // 50 points base
    recoveryCostMultiplier: 1.5,   // +1.5 points per streak day

    // Daily rewards
    dailyRewardConfig: {
      type: StreakRewardType.POINTS,
      baseAmount: 10,
      multiplierStep: 7,        // Every 7 days, multiplier increases
      multiplierIncrement: 0.1, // By 10%
      multiplierCap: 3.0,       // Max 3x multiplier
    },

    // Leaderboard
    leaderboardEnabled: true,
    isActive: true,
    sortOrder: 1,
  });

  // Add milestones
  await definitionService.addMilestones(definition.id, [
    {
      dayThreshold: 3,
      name: 'Getting Started',
      description: 'Logged in 3 days in a row!',
      icon: '🌱',
      rewardType: StreakRewardType.POINTS,
      rewardAmount: 25,
      isRepeating: false,
      notifyOnReach: true,
      celebrationEnabled: false,
    },
    {
      dayThreshold: 7,
      name: 'Week Warrior',
      description: 'A full week of daily logins!',
      icon: '⚔️',
      rewardType: StreakRewardType.POINTS,
      rewardAmount: 100,
      isRepeating: false,
      notifyOnReach: true,
      celebrationEnabled: true,
    },
    {
      dayThreshold: 14,
      name: 'Fortnight Force',
      description: 'Two weeks strong!',
      icon: '🛡️',
      rewardType: StreakRewardType.POINTS,
      rewardAmount: 250,
      isRepeating: false,
      notifyOnReach: true,
      celebrationEnabled: true,
    },
    {
      dayThreshold: 30,
      name: 'Monthly Master',
      description: 'An entire month of dedication!',
      icon: '🏆',
      rewardType: StreakRewardType.BADGE,
      rewardAmount: 1, // Badge ID reference
      isRepeating: false,
      notifyOnReach: true,
      celebrationEnabled: true,
    },
    {
      dayThreshold: 100,
      name: 'Century Club',
      description: '100 days! You are unstoppable!',
      icon: '💎',
      rewardType: StreakRewardType.TOKENS,
      rewardAmount: 500,
      isRepeating: false,
      notifyOnReach: true,
      celebrationEnabled: true,
    },
    {
      dayThreshold: 365,
      name: 'Year of Commitment',
      description: 'A full year. Legendary.',
      icon: '👑',
      rewardType: StreakRewardType.TOKENS,
      rewardAmount: 5000,
      isRepeating: false,
      notifyOnReach: true,
      celebrationEnabled: true,
    },
    {
      // Repeating milestone: bonus every 30 days after the first month
      dayThreshold: 60,
      name: 'Monthly Bonus',
      description: 'Another month of consistency!',
      icon: '🎁',
      rewardType: StreakRewardType.POINTS,
      rewardAmount: 500,
      isRepeating: true,
      repeatInterval: 30,
      notifyOnReach: true,
      celebrationEnabled: true,
    },
  ]);

  return definition;
}
```

### Example 2: Recording Activity and Updating Streak State

```typescript
import { StreakService } from '@mcv/engagement/streaks';
import { StreakActivityType } from '@mcv/engagement/streaks';
import { nanoid } from 'nanoid';

/**
 * Record a user login and update all matching streak states.
 *
 * This is typically called from the authentication module after
 * a successful login, or from a Redpanda consumer processing
 * login events.
 */
async function handleUserLogin(
  streakService: StreakService,
  userId: string,
  loginMetadata: {
    ipAddress: string;
    userAgent: string;
    platform: 'web' | 'mobile' | 'api';
  }
) {
  const result = await streakService.recordActivity({
    userId,
    activityType: StreakActivityType.LOGIN,
    action: 'session_start',
    metadata: {
      platform: loginMetadata.platform,
      ipAddress: loginMetadata.ipAddress,
      userAgent: loginMetadata.userAgent,
    },
    sourceEventId: `login_${userId}_${nanoid()}`,
  });

  // Log results
  console.log(`Streaks updated: ${result.affectedStreaks.length}`);

  for (const streak of result.affectedStreaks) {
    console.log(
      `  ${streak.definition?.name}: day ${streak.state.currentCount} ` +
      `(longest: ${streak.state.longestCount})`
    );
  }

  if (result.milestonesReached.length > 0) {
    console.log(`Milestones reached:`);
    for (const milestone of result.milestonesReached) {
      console.log(`  🎉 ${milestone.name} (day ${milestone.dayThreshold})`);
    }
  }

  if (result.rewardsDistributed.length > 0) {
    console.log(`Rewards distributed:`);
    for (const reward of result.rewardsDistributed) {
      console.log(
        `  ${reward.rewardType}: ${reward.finalAmount} ` +
        `(${reward.baseAmount} × ${reward.multiplier})`
      );
    }
  }

  return result;
}

/**
 * Example output:
 *
 * Streaks updated: 2
 *   Daily Login Streak: day 15 (longest: 15)
 *   Weekly Activity Streak: day 3 (longest: 8)
 * Milestones reached:
 *   🎉 Fortnight Force (day 14)
 * Rewards distributed:
 *   POINTS: 12 (10 × 1.2)
 *   POINTS: 250 (250 × 1.0)
 */
```

### Example 3: Managing Freeze Tokens

```typescript
import {
  StreakFreezeService,
  StreakFreezeSource,
  MAX_FREEZE_INVENTORY,
} from '@mcv/engagement/streaks';

/**
 * Purchase a streak freeze token.
 *
 * Users can buy freeze tokens to protect their streak on days they
 * might miss. The purchase is validated against inventory limits
 * and the user's point balance.
 */
async function purchaseFreeze(
  freezeService: StreakFreezeService,
  userId: string,
  options?: { definitionId?: string }
) {
  // Check current inventory
  const inventory = await freezeService.getInventory(userId);

  if (inventory.available >= MAX_FREEZE_INVENTORY) {
    throw new Error(
      `STREAK_FREEZE_INVENTORY_FULL: Maximum ${MAX_FREEZE_INVENTORY} freeze tokens allowed. ` +
      `You currently have ${inventory.available}.`
    );
  }

  // Purchase with points (cost scales with current inventory)
  const baseCost = 100;
  const scalingFactor = 1.5;
  const cost = Math.floor(baseCost * Math.pow(scalingFactor, inventory.available));

  const freeze = await freezeService.purchase({
    userId,
    definitionId: options?.definitionId,
    cost,
    source: StreakFreezeSource.PURCHASED,
    expiresInDays: 30, // Freeze tokens expire after 30 days
  });

  return {
    freeze,
    cost,
    newInventory: inventory.available + 1,
    maxInventory: MAX_FREEZE_INVENTORY,
  };
}

/**
 * Grant freeze tokens as a subscription perk.
 *
 * Premium subscribers receive freeze tokens monthly as part of
 * their subscription benefits. Called by the subscription renewal handler.
 */
async function grantSubscriptionFreezes(
  freezeService: StreakFreezeService,
  userId: string,
  tier: 'basic' | 'premium' | 'enterprise'
) {
  const freezeCountByTier = {
    basic: 1,
    premium: 3,
    enterprise: 5,
  };

  const count = freezeCountByTier[tier];

  const granted = await freezeService.grantBatch({
    userId,
    count,
    source: StreakFreezeSource.SUBSCRIPTION,
    expiresInDays: 35, // Slightly longer than billing cycle
    respectInventoryLimit: false, // Subscription grants bypass limit
  });

  return {
    granted: granted.length,
    tier,
    message: `Granted ${granted.length} streak freeze tokens for ${tier} subscription.`,
  };
}

/**
 * View freeze token inventory with details.
 */
async function viewFreezeInventory(
  freezeService: StreakFreezeService,
  userId: string
) {
  const inventory = await freezeService.getInventory(userId);
  const history = await freezeService.getHistory(userId, { limit: 20 });

  return {
    available: inventory.available,
    maxCapacity: MAX_FREEZE_INVENTORY,
    tokens: inventory.tokens.map((token) => ({
      id: token.id,
      source: token.source,
      acquiredAt: token.acquiredAt,
      expiresAt: token.expiresAt,
      daysUntilExpiry: Math.ceil(
        (token.expiresAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
      ),
      lockedToStreak: token.definitionId ?? 'any',
    })),
    recentHistory: history.map((entry) => ({
      action: entry.isConsumed ? 'consumed' : entry.isExpired ? 'expired' : 'active',
      date: entry.consumedAt ?? entry.expiresAt,
      streakProtected: entry.consumedForDate,
    })),
  };
}
```

### Example 4: Streak Recovery Flow

```typescript
import { StreakRecoveryService, StreakService } from '@mcv/engagement/streaks';

/**
 * Check recovery eligibility and present options to user.
 *
 * When a streak breaks, the user has a limited window to pay
 * a fee and restore it. This function checks eligibility and
 * calculates the cost.
 */
async function checkRecoveryOptions(
  recoveryService: StreakRecoveryService,
  streakService: StreakService,
  streakId: string,
  userId: string
) {
  const streak = await streakService.getStreak(streakId);

  if (!streak) {
    throw new Error('STREAK_NOT_FOUND');
  }

  if (streak.state.status !== 'BROKEN') {
    return {
      eligible: false,
      reason: 'Streak is not broken',
    };
  }

  const eligibility = await recoveryService.checkEligibility(streakId);

  if (!eligibility.eligible) {
    return {
      eligible: false,
      reason: eligibility.reason,
      details: {
        windowExpired: eligibility.reason === 'WINDOW_EXPIRED',
        maxRecoveriesReached: eligibility.reason === 'MAX_RECOVERIES_REACHED',
        recoveryDisabled: eligibility.reason === 'RECOVERY_DISABLED',
      },
    };
  }

  return {
    eligible: true,
    streakLength: streak.state.currentCount,
    longestEver: streak.state.longestCount,
    brokenAt: streak.lastBrokenAt,
    recoveryDeadline: eligibility.deadline,
    timeRemaining: eligibility.deadline
      ? Math.max(0, eligibility.deadline.getTime() - Date.now())
      : 0,
    cost: eligibility.cost,
    costCurrency: eligibility.costCurrency,
    lifetimeRecoveriesUsed: streak.lifetimeRecoveryCount,
    maxLifetimeRecoveries: streak.definition?.maxLifetimeRecoveries ?? 3,
  };
}

/**
 * Execute streak recovery.
 *
 * Deducts the recovery cost from the user's balance and restores
 * the streak to its pre-break state.
 */
async function executeRecovery(
  recoveryService: StreakRecoveryService,
  streakId: string,
  userId: string,
  paymentMethod: {
    type: 'points' | 'tokens' | 'iap';
    transactionId?: string;
  }
) {
  try {
    const result = await recoveryService.recover({
      streakId,
      userId,
      paymentMethod: paymentMethod.type,
      paymentTransactionId: paymentMethod.transactionId,
    });

    return {
      success: true,
      restoredCount: result.restoredCount,
      costCharged: result.costCharged,
      recoveriesRemaining:
        result.maxLifetimeRecoveries - result.lifetimeRecoveryCount,
      message: `Your ${result.restoredCount}-day streak has been restored! 🎉`,
    };
  } catch (error) {
    if (error instanceof StreakRecoveryError) {
      return {
        success: false,
        error: error.code,
        message: error.userMessage,
      };
    }
    throw error;
  }
}
```

### Example 5: Daily Streak Evaluation Worker

```typescript
import {
  StreakEvaluationWorker,
  STREAK_EVALUATION_BATCH_SIZE,
} from '@mcv/engagement/streaks';
import { logger } from '@mcv/observability';

/**
 * Configure and run the daily streak evaluation worker.
 *
 * This worker runs as a cron job, typically at 05:00 UTC (after all
 * timezone reset hours have passed). It evaluates every active streak
 * to determine if it should be incremented, frozen, or broken.
 *
 * The evaluation is idempotent — running it twice produces the same result.
 */
async function runDailyEvaluation(worker: StreakEvaluationWorker) {
  const startTime = Date.now();

  logger.info('Starting daily streak evaluation');

  const summary = await worker.evaluate({
    batchSize: STREAK_EVALUATION_BATCH_SIZE,
    concurrency: 4, // Process 4 batches in parallel

    // Callbacks for monitoring
    onBatchComplete: (batch) => {
      logger.info(`Batch ${batch.batchNumber}/${batch.totalBatches} complete`, {
        processed: batch.processed,
        incremented: batch.incremented,
        frozen: batch.frozen,
        broken: batch.broken,
        errors: batch.errors,
      });
    },

    onError: (error, streakId) => {
      logger.error(`Error evaluating streak ${streakId}`, { error });
    },
  });

  const duration = Date.now() - startTime;

  logger.info('Daily streak evaluation complete', {
    duration: `${duration}ms`,
    totalEvaluated: summary.totalEvaluated,
    incremented: summary.incremented,
    frozen: summary.frozen,
    broken: summary.broken,
    completed: summary.completed,
    errors: summary.errors,
    milestonesTriggered: summary.milestonesTriggered,
    rewardsDistributed: summary.rewardsDistributed,
    notificationsSent: summary.notificationsSent,
    freezesExpired: summary.freezesExpired,
    recoveryWindowsClosed: summary.recoveryWindowsClosed,
  });

  return summary;
}

/**
 * Example cron configuration (using node-cron or similar):
 *
 * ```typescript
 * import cron from 'node-cron';
 *
 * // Run at 05:00 UTC daily
 * cron.schedule('0 5 * * *', async () => {
 *   const worker = container.resolve(StreakEvaluationWorker);
 *   await runDailyEvaluation(worker);
 * }, {
 *   timezone: 'UTC',
 * });
 * ```
 *
 * For distributed deployments, use a distributed lock to prevent
 * concurrent evaluations:
 *
 * ```typescript
 * import { acquireLock } from '@mcv/distributed';
 *
 * const lock = await acquireLock('streak-daily-evaluation', {
 *   ttlMs: 30 * 60 * 1000, // 30 minutes max
 * });
 *
 * if (lock) {
 *   try {
 *     await runDailyEvaluation(worker);
 *   } finally {
 *     await lock.release();
 *   }
 * }
 * ```
 */
```

### Example 6: Real-Time Event Consumer

```typescript
import {
  StreakEventConsumer,
  StreakService,
  StreakActivityType,
} from '@mcv/engagement/streaks';
import { RedpandaConsumer } from '@mcv/events';
import { logger } from '@mcv/observability';

/**
 * Set up the Redpanda consumer that processes activity events
 * and updates streak state in real-time.
 *
 * This runs as a long-lived consumer alongside the application.
 * It supplements the daily cron by providing immediate feedback
 * when users perform qualifying activities.
 */
async function setupStreakEventConsumer(
  consumer: StreakEventConsumer,
  redpanda: RedpandaConsumer
) {
  // Subscribe to activity events
  await redpanda.subscribe('activity.recorded', {
    groupId: 'streak-evaluator',
    fromBeginning: false,

    handler: async (event) => {
      const {
        userId,
        tenantId,
        activityType,
        action,
        metadata,
        timestamp,
        eventId,
      } = event.payload;

      try {
        // Map external activity types to streak activity types
        const streakActivityType = mapActivityType(activityType);

        if (!streakActivityType) {
          // Activity type not relevant to any streak
          return;
        }

        const result = await consumer.processActivity({
          userId,
          tenantId,
          activityType: streakActivityType,
          action,
          metadata,
          timestamp: new Date(timestamp),
          sourceEventId: eventId,
        });

        if (result.streaksUpdated > 0) {
          logger.debug('Streak activity processed', {
            userId,
            activityType,
            streaksUpdated: result.streaksUpdated,
            milestonesReached: result.milestonesReached,
          });
        }

        // Emit streak update events for WebSocket delivery
        for (const update of result.updates) {
          await redpanda.produce('streak.updated', {
            userId,
            tenantId,
            streakId: update.streakId,
            newCount: update.newCount,
            status: update.status,
            milestone: update.milestone,
          });
        }
      } catch (error) {
        logger.error('Failed to process streak activity', {
          eventId,
          userId,
          activityType,
          error,
        });
        // Don't throw — we don't want to block the consumer.
        // Failed events will be retried by the daily evaluation.
      }
    },
  });

  logger.info('Streak event consumer started');
}

/**
 * Map external activity types to streak-recognized types.
 */
function mapActivityType(
  externalType: string
): StreakActivityType | null {
  const mapping: Record<string, StreakActivityType> = {
    'auth.login': StreakActivityType.LOGIN,
    'auth.session_start': StreakActivityType.LOGIN,
    'commerce.purchase': StreakActivityType.PURCHASE,
    'commerce.subscription_renewal': StreakActivityType.PURCHASE,
    'content.post_created': StreakActivityType.CONTENT_CREATE,
    'content.comment_created': StreakActivityType.CONTENT_CREATE,
    'content.review_submitted': StreakActivityType.CONTENT_CREATE,
    'fitness.workout_completed': StreakActivityType.EXERCISE,
    'fitness.steps_goal_met': StreakActivityType.EXERCISE,
    'learning.lesson_completed': StreakActivityType.LEARNING,
    'learning.quiz_passed': StreakActivityType.LEARNING,
  };

  return mapping[externalType] ?? null;
}
```

### Example 7: Social Streak Management

```typescript
import {
  StreakService,
  SocialStreak,
  StreakNotificationService,
  StreakNotificationType,
} from '@mcv/engagement/streaks';

/**
 * Create a social streak between two users.
 *
 * Social streaks require both parties to act within each window.
 * Similar to Snapchat's streak mechanic, they create mutual
 * accountability and social engagement.
 */
async function createSocialStreak(
  streakService: StreakService,
  creatorUserId: string,
  partnerUserId: string,
  definitionId: string
): Promise<SocialStreak> {
  // Validate the definition supports social streaks
  const definition = await streakService.getDefinition(definitionId);

  if (!definition) {
    throw new Error('STREAK_DEFINITION_NOT_FOUND');
  }

  if (!definition.isSocial) {
    throw new Error('STREAK_NOT_SOCIAL: This streak type does not support social streaks.');
  }

  // Check if a social streak already exists between these users
  const existing = await streakService.findSocialStreak({
    participantIds: [creatorUserId, partnerUserId],
    definitionId,
  });

  if (existing) {
    throw new Error('STREAK_SOCIAL_ALREADY_EXISTS: A social streak already exists between these users.');
  }

  const socialStreak = await streakService.createSocialStreak({
    definitionId,
    createdByUserId: creatorUserId,
    participantIds: [creatorUserId, partnerUserId],
  });

  // Notify the partner
  const notificationService = streakService.getNotificationService();
  await notificationService.send({
    userId: partnerUserId,
    streakId: socialStreak.id,
    type: StreakNotificationType.SOCIAL_NUDGE,
    title: 'New Streak Invitation! 🔥',
    body: `Someone started a streak with you! Keep it alive by participating daily.`,
    channels: ['push', 'in_app'],
    data: {
      socialStreakId: socialStreak.id,
      inviteCode: socialStreak.inviteCode,
      creatorUserId,
    },
  });

  return socialStreak;
}

/**
 * Record activity for a social streak.
 *
 * When one participant acts, check if the streak is now satisfied
 * for the current window (all participants have acted).
 */
async function recordSocialActivity(
  streakService: StreakService,
  socialStreakId: string,
  userId: string
): Promise<{
  socialStreak: SocialStreak;
  allSatisfied: boolean;
  waitingOn: string[];
}> {
  const result = await streakService.recordSocialActivity({
    socialStreakId,
    userId,
    activityType: StreakActivityType.CUSTOM,
    action: 'social_interaction',
    sourceEventId: `social_${socialStreakId}_${userId}_${Date.now()}`,
  });

  if (result.allSatisfied) {
    // Both/all participants have acted — streak increments!
    console.log(`Social streak ${socialStreakId} incremented to day ${result.socialStreak.currentCount}`);
  } else {
    // Waiting on other participants
    console.log(`Waiting on ${result.waitingOn.length} participant(s) for social streak`);

    // Send nudge to participants who haven't acted
    const notificationService = streakService.getNotificationService();
    for (const waitingUserId of result.waitingOn) {
      await notificationService.send({
        userId: waitingUserId,
        streakId: socialStreakId,
        type: StreakNotificationType.SOCIAL_NUDGE,
        title: 'Your streak partner is waiting! ⏰',
        body: `Don't let your ${result.socialStreak.currentCount}-day streak die!`,
        channels: ['push'],
        data: { socialStreakId, actingUserId: userId },
      });
    }
  }

  return result;
}
```

### Example 8: Streak Analytics Dashboard Query

```typescript
import {
  StreakAnalyticsService,
  StreakLeaderboardService,
  StreakAnalytics,
} from '@mcv/engagement/streaks';

/**
 * Build a comprehensive analytics dashboard for streak engagement.
 *
 * This function aggregates metrics across all streak types for the
 * admin dashboard, providing insights into engagement patterns,
 * freeze/recovery usage, and the business impact of streaks.
 */
async function buildStreakDashboard(
  analyticsService: StreakAnalyticsService,
  leaderboardService: StreakLeaderboardService,
  tenantId: string,
  options: {
    definitionId?: string; // Filter to specific streak type
    periodDays: number;    // Lookback period
  }
) {
  const periodEnd = new Date();
  const periodStart = new Date(
    periodEnd.getTime() - options.periodDays * 24 * 60 * 60 * 1000
  );

  // Core engagement metrics
  const analytics = await analyticsService.getAnalytics({
    tenantId,
    definitionId: options.definitionId,
    periodStart,
    periodEnd,
  });

  // Streak health overview
  const healthOverview = {
    totalActiveStreaks: analytics.activeStreakCount,
    totalBrokenInPeriod: analytics.brokenStreakCount,
    breakRate: analytics.brokenStreakCount /
      (analytics.activeStreakCount + analytics.brokenStreakCount) || 0,
    averageLength: analytics.averageStreakLength,
    medianLength: analytics.medianStreakLength,
    longestActive: analytics.longestActiveStreak,
  };

  // Distribution breakdown
  const distribution = analytics.streakLengthDistribution.map((bucket) => ({
    range: bucket.bucket,
    users: bucket.count,
    share: `${(bucket.percentage * 100).toFixed(1)}%`,
  }));

  // Break pattern analysis — which days are most dangerous?
  const dangerDays = analytics.breakPatternByDay
    .sort((a, b) => b.breakCount - a.breakCount)
    .map((day) => ({
      day: day.dayName,
      breaks: day.breakCount,
      share: `${(day.percentage * 100).toFixed(1)}%`,
    }));

  // Freeze effectiveness
  const freezeAnalysis = {
    totalConsumed: analytics.freezeMetrics.totalConsumed,
    totalPurchased: analytics.freezeMetrics.totalPurchased,
    totalExpired: analytics.freezeMetrics.totalExpired,
    saveRate: `${(analytics.freezeMetrics.freezeSaveRate * 100).toFixed(1)}%`,
    averageInventory: analytics.freezeMetrics.averageFreezeInventory.toFixed(1),
    wastedRate: analytics.freezeMetrics.totalExpired /
      (analytics.freezeMetrics.totalPurchased || 1),
  };

  // Recovery economics
  const recoveryAnalysis = {
    attemptRate: analytics.recoveryMetrics.totalAttempted /
      (analytics.brokenStreakCount || 1),
    successRate: `${(analytics.recoveryMetrics.recoveryRate * 100).toFixed(1)}%`,
    averageCost: analytics.recoveryMetrics.averageRecoveryCost.toFixed(0),
    totalRevenue: analytics.recoveryMetrics.totalRecoveryRevenue,
  };

  // Business impact
  const businessImpact = {
    streakUserRetention: `${(analytics.engagementMetrics.streakUserRetentionRate * 100).toFixed(1)}%`,
    nonStreakRetention: `${(analytics.engagementMetrics.nonStreakUserRetentionRate * 100).toFixed(1)}%`,
    retentionLift: `${(
      ((analytics.engagementMetrics.streakUserRetentionRate -
        analytics.engagementMetrics.nonStreakUserRetentionRate) /
        analytics.engagementMetrics.nonStreakUserRetentionRate) *
      100
    ).toFixed(1)}%`,
    streakArpu: `$${analytics.engagementMetrics.streakUserArpu.toFixed(2)}`,
    nonStreakArpu: `$${analytics.engagementMetrics.nonStreakUserArpu.toFixed(2)}`,
    arpuLift: `${(
      ((analytics.engagementMetrics.streakUserArpu -
        analytics.engagementMetrics.nonStreakUserArpu) /
        analytics.engagementMetrics.nonStreakUserArpu) *
      100
    ).toFixed(1)}%`,
  };

  // Top streakers leaderboard
  const topStreakers = await leaderboardService.getTopEntries({
    tenantId,
    definitionId: options.definitionId,
    period: 'ALL_TIME',
    limit: 10,
  });

  return {
    period: {
      start: periodStart.toISOString(),
      end: periodEnd.toISOString(),
      days: options.periodDays,
    },
    healthOverview,
    distribution,
    dangerDays,
    freezeAnalysis,
    recoveryAnalysis,
    businessImpact,
    topStreakers: topStreakers.map((entry) => ({
      rank: entry.rank,
      userId: entry.userId,
      currentStreak: entry.currentCount,
      longestEver: entry.longestCount,
      percentile: `Top ${(100 - entry.percentile).toFixed(1)}%`,
    })),
    generatedAt: new Date().toISOString(),
  };
}

/**
 * Example dashboard output:
 *
 * {
 *   healthOverview: {
 *     totalActiveStreaks: 12847,
 *     totalBrokenInPeriod: 3291,
 *     breakRate: 0.204,
 *     averageLength: 18.3,
 *     medianLength: 12,
 *     longestActive: 423,
 *   },
 *   distribution: [
 *     { range: '1-7', users: 4521, share: '35.2%' },
 *     { range: '8-14', users: 3102, share: '24.1%' },
 *     { range: '15-30', users: 2854, share: '22.2%' },
 *     { range: '31-60', users: 1489, share: '11.6%' },
 *     { range: '61-100', users: 612, share: '4.8%' },
 *     { range: '100+', users: 269, share: '2.1%' },
 *   ],
 *   dangerDays: [
 *     { day: 'Saturday', breaks: 823, share: '25.0%' },
 *     { day: 'Sunday', breaks: 712, share: '21.6%' },
 *     { day: 'Friday', breaks: 498, share: '15.1%' },
 *     ...
 *   ],
 *   businessImpact: {
 *     streakUserRetention: '78.4%',
 *     nonStreakRetention: '34.2%',
 *     retentionLift: '129.2%',
 *     streakArpu: '$12.47',
 *     nonStreakArpu: '$4.21',
 *     arpuLift: '196.2%',
 *   },
 * }
 */
```

---

## Error Codes

| Code | HTTP | Description | Resolution |
|------|------|-------------|------------|
| `STREAK_DEFINITION_NOT_FOUND` | 404 | Streak definition does not exist or is archived | Verify definition ID; check if it was archived |
| `STREAK_DEFINITION_INACTIVE` | 400 | Streak definition exists but is not active | Admin must activate the definition |
| `STREAK_DEFINITION_SLUG_CONFLICT` | 409 | Another definition with this slug exists in the tenant | Choose a different slug |
| `STREAK_NOT_FOUND` | 404 | User streak record does not exist | Record activity first to create the streak, or verify streak ID |
| `STREAK_ALREADY_SATISFIED` | 200 | Activity recorded but streak window was already satisfied | No action needed; duplicate activity is logged but doesn't double-count |
| `STREAK_ALREADY_BROKEN` | 400 | Attempted operation on a broken streak that requires active status | Use recovery flow to restore the streak first |
| `STREAK_ALREADY_COMPLETED` | 400 | Streak has reached its maxLength and is finished | No further progression possible; create a new streak if applicable |
| `STREAK_FREEZE_INVENTORY_FULL` | 400 | User has reached MAX_FREEZE_INVENTORY tokens | Use or wait for existing tokens to expire before acquiring more |
| `STREAK_FREEZE_NOT_FOUND` | 404 | Freeze token does not exist | Verify freeze token ID |
| `STREAK_FREEZE_ALREADY_CONSUMED` | 400 | Freeze token has already been used | Token cannot be reused; acquire a new one |
| `STREAK_FREEZE_EXPIRED` | 400 | Freeze token has expired | Acquire a new freeze token |
| `STREAK_FREEZE_DISABLED` | 400 | Streak definition does not allow freeze tokens | Freeze is not available for this streak type |
| `STREAK_FREEZE_LIMIT_REACHED` | 400 | Lifetime freeze limit reached for this streak | No more freezes can be consumed for this streak instance |
| `STREAK_RECOVERY_WINDOW_EXPIRED` | 400 | Recovery window has closed (past recoveryWindowHours) | Streak cannot be recovered; must start fresh |
| `STREAK_RECOVERY_DISABLED` | 400 | Streak definition does not allow recovery | Recovery is not configured for this streak type |
| `STREAK_RECOVERY_LIMIT_REACHED` | 400 | Maximum lifetime recoveries used for this streak | No more recoveries available; must start fresh |
| `STREAK_RECOVERY_INSUFFICIENT_FUNDS` | 402 | User doesn't have enough points/tokens to pay recovery cost | Earn or purchase more points/tokens before recovering |
| `STREAK_RECOVERY_PAYMENT_FAILED` | 502 | Payment processing failed during recovery | Retry the recovery; check payment method |
| `STREAK_ACTIVITY_DUPLICATE` | 409 | Activity with this sourceEventId already processed | Idempotency check prevented double-processing; no action needed |
| `STREAK_ACTIVITY_INVALID_TYPE` | 400 | Activity type doesn't match any qualifying activities for the definition | Check streak definition's qualifyingActivities configuration |
| `STREAK_ACTIVITY_FUTURE_TIMESTAMP` | 400 | Activity timestamp is in the future | Verify system clocks; timestamps must be ≤ now + 5 minutes |
| `STREAK_SOCIAL_NOT_FOUND` | 404 | Social streak does not exist | Verify social streak ID or invite code |
| `STREAK_SOCIAL_ALREADY_EXISTS` | 409 | Social streak already exists between these participants for this definition | Only one social streak per participant set per definition |
| `STREAK_SOCIAL_NOT_PARTICIPANT` | 403 | User is not a participant in this social streak | Only participants can record activity or view social streak state |
| `STREAK_SOCIAL_FULL` | 400 | Social streak has reached maximum participants | Remove a participant or create a new social streak |
| `STREAK_SOCIAL_INVITE_EXPIRED` | 400 | Social streak invite code has expired or streak is closed | Request a new invite from the streak creator |
| `STREAK_TEAM_NOT_FOUND` | 404 | Team streak does not exist | Verify team streak ID |
| `STREAK_TEAM_NOT_MEMBER` | 403 | User is not a member of the team | Only team members can contribute to team streaks |
| `STREAK_LEADERBOARD_NOT_ENABLED` | 400 | Leaderboard is not enabled for this streak definition | Admin must enable leaderboardEnabled on the definition |
| `STREAK_EVALUATION_IN_PROGRESS` | 409 | Daily evaluation is already running (distributed lock held) | Wait for current evaluation to complete; check logs for errors |
| `STREAK_EVALUATION_FAILED` | 500 | Daily evaluation encountered fatal errors | Check evaluation logs; individual streak errors don't cause this |
| `STREAK_TIMEZONE_INVALID` | 400 | User's timezone is not a valid IANA timezone identifier | Update user profile with valid timezone (e.g., "America/New_York") |
| `STREAK_TENANT_MISMATCH` | 403 | Operation attempted across tenant boundaries | Ensure all referenced entities belong to the same tenant |
| `STREAK_NOTIFICATION_FAILED` | 500 | Failed to send streak notification | Check notification channel configuration; notification will be retried |

---

## Security

### Authentication & Authorization

All streak operations require authenticated users. The module enforces authorization at multiple levels:

| Operation | Required Role | RLS Policy |
|-----------|--------------|------------|
| View own streaks | `user` | `user_streaks.user_id = current_user` |
| Record activity | `user` (via service) | Service validates userId matches authenticated user |
| Use freeze token | `user` | `streak_freezes.user_id = current_user` |
| Recover streak | `user` | Service validates ownership |
| View leaderboard | `user` | Tenant-scoped, all users can view |
| Create definition | `admin` | Admin RLS policy |
| Grant freezes | `admin` | Admin-only service method |
| View analytics | `admin` | Admin-only service method |
| Force evaluate | `admin` | Admin-only service method |

### Data Protection

| Concern | Mitigation |
|---------|-----------|
| **Multi-tenant isolation** | All tables use `tenantId` with RLS policies enforced at the database level. No cross-tenant data access is possible even through service bugs. |
| **Activity metadata** | Activity metadata (IP addresses, user agents) is stored encrypted at rest. PII is redacted after the retention period (default: 90 days). |
| **Leaderboard privacy** | Leaderboard entries show user IDs, not personal information. Display names are resolved client-side with appropriate privacy settings. |
| **Social streak consent** | Social streaks require explicit opt-in from all participants. Invite codes expire after 7 days. Users can leave social streaks at any time. |
| **Recovery payment data** | Payment transaction IDs are stored as references; actual payment details are handled by the payment module and never stored in streak tables. |
| **Notification content** | Notification bodies do not contain sensitive streak data beyond counts. Push notifications use generic titles; detailed data is in-app only. |

### Rate Limiting

| Endpoint | Rate Limit | Window |
|----------|-----------|--------|
| `recordActivity` | 60 requests | Per minute per user |
| `useFreeze` | 5 requests | Per minute per user |
| `recoverStreak` | 3 requests | Per minute per user |
| `purchaseFreeze` | 10 requests | Per minute per user |
| `getLeaderboard` | 30 requests | Per minute per user |
| `getAnalytics` | 10 requests | Per minute per admin |
| `createDefinition` | 5 requests | Per minute per admin |
| `evaluateStreak` (force) | 1 request | Per minute per admin |

### Anti-Abuse Protections

| Attack Vector | Protection |
|---------------|-----------|
| **Streak farming via bots** | Activity must originate from verified sessions; suspicious patterns (identical timestamps, no UI interaction) trigger fraud flags |
| **Clock manipulation** | All timestamps are server-generated; client-provided timestamps are validated within a 5-minute tolerance |
| **Recovery exploitation** | Recovery costs scale with streak length; lifetime recovery limits prevent infinite recovery loops |
| **Freeze hoarding** | MAX_FREEZE_INVENTORY caps storage; freeze tokens expire; escalating purchase costs discourage stockpiling |
| **Leaderboard manipulation** | Leaderboard snapshots are computed server-side; direct table manipulation is blocked by RLS |
| **Social streak abuse** | Rate limits on social streak creation; maximum participant count; activity deduplication per window |
| **Event replay attacks** | `sourceEventId` uniqueness constraint prevents duplicate event processing |

### Audit Trail

Every streak state change is recorded with full context:

```typescript
// Audit events emitted for all state changes
type StreakAuditEvent = {
  eventType:
    | 'streak.created'
    | 'streak.incremented'
    | 'streak.frozen'
    | 'streak.broken'
    | 'streak.recovered'
    | 'streak.completed'
    | 'freeze.purchased'
    | 'freeze.granted'
    | 'freeze.consumed'
    | 'freeze.expired'
    | 'recovery.attempted'
    | 'recovery.succeeded'
    | 'recovery.failed'
    | 'reward.distributed'
    | 'milestone.reached'
    | 'definition.created'
    | 'definition.updated'
    | 'definition.archived';
  tenantId: string;
  userId: string;
  streakId?: string;
  previousState?: StreakState;
  newState?: StreakState;
  metadata: Record<string, unknown>;
  timestamp: Date;
  requestId: string;
};
```

---

## Environment Variables

| Variable | Type | Default | Description |
|----------|------|---------|-------------|
| `STREAK_DEFAULT_RESET_HOUR` | `number` | `4` | Default reset hour (0-23) for new streak definitions. Applied when no reset hour is specified. |
| `STREAK_DEFAULT_GRACE_PERIOD_HOURS` | `number` | `6` | Default grace period in hours for new streak definitions. |
| `STREAK_MAX_FREEZE_INVENTORY` | `number` | `5` | Maximum freeze tokens a user can hold at once. |
| `STREAK_MAX_RECOVERY_WINDOW_HOURS` | `number` | `48` | Maximum hours after break during which recovery is available. |
| `STREAK_EVALUATION_BATCH_SIZE` | `number` | `1000` | Number of streaks processed per batch during daily evaluation. |
| `STREAK_EVALUATION_CONCURRENCY` | `number` | `4` | Number of parallel batches during daily evaluation. |
| `STREAK_EVALUATION_CRON` | `string` | `0 5 * * *` | Cron expression for daily evaluation schedule (UTC). |
| `STREAK_LEADERBOARD_REFRESH_INTERVAL_MS` | `number` | `300000` | How often leaderboard snapshots are refreshed (milliseconds). |
| `STREAK_LEADERBOARD_TOP_N` | `number` | `100` | Number of top entries stored in leaderboard snapshots. |
| `STREAK_ACTIVITY_RETENTION_DAYS` | `number` | `365` | How long streak activity records are retained before archival. |
| `STREAK_NOTIFICATION_AT_RISK_HOURS` | `number` | `4` | Hours before deadline to send at-risk reminder notifications. |
| `STREAK_NOTIFICATION_CHANNELS` | `string` | `push,in_app` | Comma-separated default notification channels. |
| `STREAK_FREEZE_DEFAULT_EXPIRY_DAYS` | `number` | `30` | Default expiry period for freeze tokens in days. |
| `STREAK_FREEZE_BASE_COST` | `number` | `100` | Base point cost for purchasing a freeze token. |
| `STREAK_FREEZE_COST_SCALING` | `number` | `1.5` | Cost scaling factor per existing token in inventory. |
| `STREAK_RECOVERY_BASE_COST` | `number` | `100` | Default base cost for streak recovery. |
| `STREAK_RECOVERY_COST_MULTIPLIER` | `number` | `2.0` | Default multiplier applied to recovery cost per streak day. |
| `STREAK_SOCIAL_INVITE_EXPIRY_DAYS` | `number` | `7` | Days before social streak invite codes expire. |
| `STREAK_SOCIAL_MAX_PARTICIPANTS` | `number` | `10` | Maximum participants in a social streak. |
| `STREAK_EVENT_TOPIC_PREFIX` | `string` | `streak` | Redpanda topic prefix for streak events. |
| `STREAK_EVENT_CONSUMER_GROUP` | `string` | `streak-evaluator` | Redpanda consumer group ID for streak event processing. |
| `STREAK_ANALYTICS_CACHE_TTL_MS` | `number` | `600000` | Cache TTL for analytics queries (10 minutes). |
| `STREAK_TIMESTAMP_TOLERANCE_MS` | `number` | `300000` | Maximum tolerance for client-provided timestamps (5 minutes). |

---

## Dependencies

### Internal Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| `@mcv/db` | `workspace:*` | Database connection, Drizzle ORM setup, tenant column helpers |
| `@mcv/auth` | `workspace:*` | Authentication context, user ID resolution, role checking |
| `@mcv/events` | `workspace:*` | Redpanda producer/consumer for activity events and streak events |
| `@mcv/notifications` | `workspace:*` | Push, email, in-app, SMS notification dispatch |
| `@mcv/points` | `workspace:*` | Point balance queries and deductions for freeze purchases and recovery |
| `@mcv/tokens` | `workspace:*` | Token balance management for token-based rewards and payments |
| `@mcv/rewards` | `workspace:*` | Reward fulfillment system integration for milestone rewards |
| `@mcv/badges` | `workspace:*` | Badge granting for milestone badge rewards |
| `@mcv/observability` | `workspace:*` | Structured logging, metrics, tracing |
| `@mcv/cron` | `workspace:*` | Cron job scheduling and distributed locking |
| `@mcv/cache` | `workspace:*` | Redis caching for leaderboards and analytics |
| `@mcv/tenant` | `workspace:*` | Multi-tenant context and RLS session variable management |
| `@mcv/trpc` | `workspace:*` | tRPC router and procedure helpers |

### External Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| `drizzle-orm` | `^0.36.x` | SQL query builder and schema definitions |
| `date-fns` | `^4.x` | Date arithmetic and formatting |
| `date-fns-tz` | `^3.x` | Timezone-aware date operations (day boundary calculation) |
| `zod` | `^3.x` | Input validation for tRPC procedures and service methods |
| `nanoid` | `^5.x` | Unique ID generation for invite codes |
| `@trpc/server` | `^11.x` | tRPC server for API exposure |
| `ioredis` | `^5.x` | Redis client for caching and distributed locks |

### Peer Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| `@supabase/supabase-js` | `^2.x` | Supabase client (provided by host application) |

---

## Testing

### Test Strategy

The streak module requires thorough testing due to its time-sensitive nature, complex state machine, and multi-timezone behavior. The testing strategy covers five layers:

1. **Unit Tests** — Pure logic: day boundary calculation, multiplier computation, state transitions
2. **Integration Tests** — Service methods with real database (Supabase local)
3. **Evaluation Tests** — Full daily evaluation pipeline with crafted scenarios
4. **Timezone Tests** — Comprehensive timezone and DST edge case coverage
5. **Load Tests** — Evaluation pipeline performance at scale

### Test Utilities

```typescript
import { createTestContext, TestContext } from '@mcv/testing';
import { StreakService, StreakDefinitionService } from '@mcv/engagement/streaks';

/**
 * Test helper: create a streak definition and advance time.
 */
async function setupStreakTest(ctx: TestContext) {
  const defService = ctx.resolve(StreakDefinitionService);
  const streakService = ctx.resolve(StreakService);

  // Create a daily login streak for testing
  const definition = await defService.create({
    tenantId: ctx.tenantId,
    name: 'Test Daily Streak',
    slug: 'test-daily',
    frequency: 'DAILY',
    qualifyingActivities: ['LOGIN'],
    minimumCount: 1,
    resetHour: 4,
    gracePeriodHours: 6,
    freezeEnabled: true,
    maxLifetimeFreezes: 0,
    recoveryEnabled: true,
    recoveryWindowHours: 48,
    maxLifetimeRecoveries: 3,
    recoveryBaseCost: 100,
    recoveryCostMultiplier: 2.0,
    leaderboardEnabled: false,
    isActive: true,
    sortOrder: 0,
  });

  return { definition, defService, streakService };
}

/**
 * Test helper: simulate N days of streak activity.
 */
async function simulateStreakDays(
  streakService: StreakService,
  userId: string,
  days: number,
  options?: {
    startDate?: Date;
    skipDays?: number[]; // Day numbers to skip (1-indexed)
    timezone?: string;
  }
) {
  const startDate = options?.startDate ?? new Date('2026-01-01T12:00:00Z');
  const skipDays = new Set(options?.skipDays ?? []);

  const results = [];

  for (let day = 1; day <= days; day++) {
    const dayDate = new Date(startDate.getTime() + (day - 1) * 24 * 60 * 60 * 1000);

    if (skipDays.has(day)) {
      results.push({ day, skipped: true });
      continue;
    }

    const result = await streakService.recordActivity({
      userId,
      activityType: 'LOGIN',
      action: 'test_login',
      timestamp: dayDate,
      sourceEventId: `test_${userId}_day${day}_${dayDate.getTime()}`,
    });

    results.push({ day, skipped: false, result });
  }

  return results;
}
```

### Unit Tests

```typescript
import { describe, it, expect } from 'vitest';
import {
  calculateDayBoundary,
  isStreakAlive,
  computeStreakMultiplier,
  getNextMilestone,
} from '@mcv/engagement/streaks';

describe('calculateDayBoundary', () => {
  it('should calculate correct day boundary for standard case', () => {
    // User in America/New_York, reset hour 4, checking at 2:00 PM
    const boundary = calculateDayBoundary({
      timestamp: new Date('2026-02-08T19:00:00Z'), // 2:00 PM EST
      timezone: 'America/New_York',
      resetHour: 4,
    });

    // Day should be Feb 8, 4:00 AM EST → Feb 9, 3:59:59 AM EST
    expect(boundary.dayStart.toISOString()).toBe('2026-02-08T09:00:00.000Z');
    expect(boundary.dayEnd.toISOString()).toBe('2026-02-09T08:59:59.999Z');
    expect(boundary.localDate).toBe('2026-02-08');
  });

  it('should handle pre-reset-hour times (belongs to previous day)', () => {
    // 2:00 AM EST is before 4:00 AM reset — belongs to Feb 7's streak day
    const boundary = calculateDayBoundary({
      timestamp: new Date('2026-02-08T07:00:00Z'), // 2:00 AM EST
      timezone: 'America/New_York',
      resetHour: 4,
    });

    expect(boundary.localDate).toBe('2026-02-07');
    expect(boundary.dayStart.toISOString()).toBe('2026-02-07T09:00:00.000Z');
  });

  it('should handle DST spring forward (23-hour day)', () => {
    // March 8, 2026: DST starts in America/New_York (clocks spring forward)
    const boundary = calculateDayBoundary({
      timestamp: new Date('2026-03-08T18:00:00Z'), // 2:00 PM EDT
      timezone: 'America/New_York',
      resetHour: 4,
    });

    // Day is 23 hours long due to DST transition
    const dayLengthHours =
      (boundary.dayEnd.getTime() - boundary.dayStart.getTime()) / (1000 * 60 * 60);
    expect(dayLengthHours).toBeCloseTo(23, 0);
  });

  it('should handle DST fall back (25-hour day)', () => {
    // November 1, 2026: DST ends in America/New_York (clocks fall back)
    const boundary = calculateDayBoundary({
      timestamp: new Date('2026-11-01T18:00:00Z'), // 1:00 PM EST
      timezone: 'America/New_York',
      resetHour: 4,
    });

    const dayLengthHours =
      (boundary.dayEnd.getTime() - boundary.dayStart.getTime()) / (1000 * 60 * 60);
    expect(dayLengthHours).toBeCloseTo(25, 0);
  });

  it('should handle midnight reset hour', () => {
    const boundary = calculateDayBoundary({
      timestamp: new Date('2026-02-08T06:00:00Z'), // 1:00 AM EST
      timezone: 'America/New_York',
      resetHour: 0,
    });

    // 1:00 AM is after midnight reset, so this is Feb 8's day
    expect(boundary.localDate).toBe('2026-02-08');
  });

  it('should handle UTC+13 timezone (Samoa)', () => {
    const boundary = calculateDayBoundary({
      timestamp: new Date('2026-02-08T00:00:00Z'), // 1:00 PM WSST (Feb 8)
      timezone: 'Pacific/Apia',
      resetHour: 4,
    });

    expect(boundary.localDate).toBe('2026-02-08');
  });
});

describe('isStreakAlive', () => {
  it('should return true when activity is within current window', () => {
    const alive = isStreakAlive({
      lastActivityAt: new Date('2026-02-08T15:00:00Z'),
      currentTime: new Date('2026-02-08T20:00:00Z'),
      timezone: 'America/New_York',
      resetHour: 4,
      gracePeriodHours: 6,
    });

    expect(alive).toBe(true);
  });

  it('should return true within grace period', () => {
    // Last activity was yesterday. Current time is 8:00 AM (within 6h grace of 4 AM reset)
    const alive = isStreakAlive({
      lastActivityAt: new Date('2026-02-07T20:00:00Z'), // 3:00 PM EST Feb 7
      currentTime: new Date('2026-02-08T13:00:00Z'),    // 8:00 AM EST Feb 8
      timezone: 'America/New_York',
      resetHour: 4,
      gracePeriodHours: 6,
    });

    expect(alive).toBe(true);
  });

  it('should return false when grace period has passed', () => {
    const alive = isStreakAlive({
      lastActivityAt: new Date('2026-02-07T20:00:00Z'),
      currentTime: new Date('2026-02-08T16:00:00Z'),    // 11:00 AM EST (past 10 AM grace)
      timezone: 'America/New_York',
      resetHour: 4,
      gracePeriodHours: 6,
    });

    expect(alive).toBe(false);
  });
});

describe('computeStreakMultiplier', () => {
  it('should return 1.0 for streak under first step', () => {
    const multiplier = computeStreakMultiplier({
      currentCount: 3,
      multiplierStep: 7,
      multiplierIncrement: 0.1,
      multiplierCap: 3.0,
    });

    expect(multiplier).toBe(1.0);
  });

  it('should increase at each step', () => {
    const multiplier = computeStreakMultiplier({
      currentCount: 14,
      multiplierStep: 7,
      multiplierIncrement: 0.1,
      multiplierCap: 3.0,
    });

    // floor(14/7) = 2 steps → 1.0 + 2 * 0.1 = 1.2
    expect(multiplier).toBe(1.2);
  });

  it('should cap at multiplierCap', () => {
    const multiplier = computeStreakMultiplier({
      currentCount: 500,
      multiplierStep: 7,
      multiplierIncrement: 0.1,
      multiplierCap: 3.0,
    });

    expect(multiplier).toBe(3.0);
  });
});

describe('getNextMilestone', () => {
  const milestones = [
    { dayThreshold: 7, name: 'Week', isRepeating: false },
    { dayThreshold: 30, name: 'Month', isRepeating: false },
    { dayThreshold: 100, name: 'Century', isRepeating: false },
    { dayThreshold: 60, name: 'Bimonthly', isRepeating: true, repeatInterval: 30 },
  ];

  it('should return first milestone for new streak', () => {
    const next = getNextMilestone(1, milestones);
    expect(next?.name).toBe('Week');
    expect(next?.dayThreshold).toBe(7);
  });

  it('should skip passed milestones', () => {
    const next = getNextMilestone(8, milestones);
    expect(next?.name).toBe('Month');
  });

  it('should handle repeating milestones', () => {
    // At day 91, next repeating milestone is at 90 (60 + 30) — already passed
    // Next is 100 (Century) or 120 (60 + 2*30)
    const next = getNextMilestone(91, milestones);
    expect(next?.dayThreshold).toBe(100);
  });
});
```

### Integration Tests

```typescript
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createTestContext, TestContext } from '@mcv/testing';
import {
  StreakService,
  StreakFreezeService,
  StreakRecoveryService,
  StreakEvaluationWorker,
} from '@mcv/engagement/streaks';

describe('StreakService Integration', () => {
  let ctx: TestContext;
  let streakService: StreakService;
  let freezeService: StreakFreezeService;

  beforeEach(async () => {
    ctx = await createTestContext({ modules: ['engagement/streaks'] });
    streakService = ctx.resolve(StreakService);
    freezeService = ctx.resolve(StreakFreezeService);
  });

  afterEach(async () => {
    await ctx.cleanup();
  });

  it('should create streak on first activity', async () => {
    const { definition } = await setupStreakTest(ctx);

    const result = await streakService.recordActivity({
      userId: ctx.userId,
      activityType: 'LOGIN',
      action: 'session_start',
      sourceEventId: 'test-login-1',
    });

    expect(result.affectedStreaks).toHaveLength(1);
    expect(result.affectedStreaks[0].state.currentCount).toBe(1);
    expect(result.affectedStreaks[0].state.status).toBe('ACTIVE');
  });

  it('should increment streak on consecutive days', async () => {
    const { definition } = await setupStreakTest(ctx);

    await simulateStreakDays(streakService, ctx.userId, 5);

    const streaks = await streakService.getUserStreaks(ctx.userId);
    expect(streaks[0].state.currentCount).toBe(5);
    expect(streaks[0].state.longestCount).toBe(5);
    expect(streaks[0].state.totalActivityDays).toBe(5);
  });

  it('should break streak when day is missed without freeze', async () => {
    const { definition } = await setupStreakTest(ctx);

    // Build a 5-day streak, skip day 6
    await simulateStreakDays(streakService, ctx.userId, 7, {
      skipDays: [6],
    });

    // Trigger evaluation for the missed day
    const worker = ctx.resolve(StreakEvaluationWorker);
    await worker.evaluateForDate(new Date('2026-01-06T12:00:00Z'));

    const streaks = await streakService.getUserStreaks(ctx.userId, {
      status: ['BROKEN'],
    });

    expect(streaks).toHaveLength(1);
    expect(streaks[0].state.status).toBe('BROKEN');
    expect(streaks[0].state.currentCount).toBe(5); // Preserved for recovery
  });

  it('should auto-consume freeze when day is missed', async () => {
    const { definition } = await setupStreakTest(ctx);

    // Build a 5-day streak
    await simulateStreakDays(streakService, ctx.userId, 5);

    // Grant a freeze token
    await freezeService.grant({
      userId: ctx.userId,
      source: 'GRANTED',
      expiresInDays: 30,
    });

    // Trigger evaluation for a missed day
    const worker = ctx.resolve(StreakEvaluationWorker);
    await worker.evaluateForDate(new Date('2026-01-06T12:00:00Z'));

    const streaks = await streakService.getUserStreaks(ctx.userId);
    expect(streaks[0].state.status).toBe('FROZEN');
    expect(streaks[0].state.currentCount).toBe(5); // Count preserved
    expect(streaks[0].state.consecutiveFrozenDays).toBe(1);

    // Freeze should be consumed
    const inventory = await freezeService.getInventory(ctx.userId);
    expect(inventory.available).toBe(0);
  });

  it('should recover broken streak within window', async () => {
    const { definition } = await setupStreakTest(ctx);
    const recoveryService = ctx.resolve(StreakRecoveryService);

    // Build a 10-day streak and let it break
    await simulateStreakDays(streakService, ctx.userId, 10);

    const worker = ctx.resolve(StreakEvaluationWorker);
    await worker.evaluateForDate(new Date('2026-01-11T12:00:00Z'));

    const brokenStreaks = await streakService.getUserStreaks(ctx.userId, {
      status: ['BROKEN'],
    });
    const brokenStreak = brokenStreaks[0];

    // Check eligibility
    const eligibility = await recoveryService.checkEligibility(brokenStreak.id);
    expect(eligibility.eligible).toBe(true);
    expect(eligibility.cost).toBe(120); // 100 base + 10 * 2.0

    // Recover
    const result = await recoveryService.recover({
      streakId: brokenStreak.id,
      userId: ctx.userId,
      paymentMethod: 'points',
    });

    expect(result.restoredCount).toBe(10);

    // Verify streak is restored
    const restored = await streakService.getStreak(brokenStreak.id);
    expect(restored?.state.status).toBe('ACTIVE');
    expect(restored?.state.currentCount).toBe(10);
    expect(restored?.lifetimeRecoveryCount).toBe(1);
  });

  it('should deduplicate activities by sourceEventId', async () => {
    const { definition } = await setupStreakTest(ctx);

    // Record same activity twice
    await streakService.recordActivity({
      userId: ctx.userId,
      activityType: 'LOGIN',
      action: 'session_start',
      sourceEventId: 'duplicate-event-1',
    });

    await streakService.recordActivity({
      userId: ctx.userId,
      activityType: 'LOGIN',
      action: 'session_start',
      sourceEventId: 'duplicate-event-1',
    });

    const streaks = await streakService.getUserStreaks(ctx.userId);
    expect(streaks[0].state.currentCount).toBe(1); // Not double-counted
  });

  it('should handle multiple streak definitions for same activity', async () => {
    const defService = ctx.resolve(StreakDefinitionService);

    // Create two definitions that both match LOGIN
    await defService.create({
      tenantId: ctx.tenantId,
      name: 'Daily Login',
      slug: 'daily-login',
      frequency: 'DAILY',
      qualifyingActivities: ['LOGIN'],
      isActive: true,
    });

    await defService.create({
      tenantId: ctx.tenantId,
      name: 'Weekly Login',
      slug: 'weekly-login',
      frequency: 'WEEKLY',
      qualifyingActivities: ['LOGIN'],
      isActive: true,
    });

    const result = await streakService.recordActivity({
      userId: ctx.userId,
      activityType: 'LOGIN',
      action: 'session_start',
      sourceEventId: 'multi-def-test-1',
    });

    expect(result.affectedStreaks).toHaveLength(2);
  });
});
```

### Evaluation Pipeline Tests

```typescript
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createTestContext, TestContext, advanceTime } from '@mcv/testing';
import { StreakEvaluationWorker } from '@mcv/engagement/streaks';

describe('StreakEvaluationWorker', () => {
  let ctx: TestContext;
  let worker: StreakEvaluationWorker;

  beforeEach(async () => {
    ctx = await createTestContext({ modules: ['engagement/streaks'] });
    worker = ctx.resolve(StreakEvaluationWorker);
  });

  afterEach(async () => {
    await ctx.cleanup();
  });

  it('should be idempotent — running twice produces same result', async () => {
    const { definition, streakService } = await setupStreakTest(ctx);
    await simulateStreakDays(streakService, ctx.userId, 3);

    const evalDate = new Date('2026-01-04T12:00:00Z');

    const result1 = await worker.evaluateForDate(evalDate);
    const result2 = await worker.evaluateForDate(evalDate);

    expect(result1.incremented).toBe(result2.incremented);
    expect(result1.broken).toBe(result2.broken);
    expect(result1.frozen).toBe(result2.frozen);
  });

  it('should handle mixed timezones in same batch', async () => {
    const { definition, streakService } = await setupStreakTest(ctx);

    // Create users in different timezones
    const userNY = await ctx.createUser({ timezone: 'America/New_York' });
    const userTokyo = await ctx.createUser({ timezone: 'Asia/Tokyo' });
    const userLondon = await ctx.createUser({ timezone: 'Europe/London' });

    // All users active at their local 2 PM
    for (const user of [userNY, userTokyo, userLondon]) {
      await streakService.recordActivity({
        userId: user.id,
        activityType: 'LOGIN',
        action: 'session_start',
        sourceEventId: `tz-test-${user.id}`,
      });
    }

    const summary = await worker.evaluate({
      batchSize: 100,
      concurrency: 1,
    });

    // All should be evaluated without errors
    expect(summary.errors).toBe(0);
  });

  it('should process streaks in correct priority order', async () => {
    const { definition, streakService } = await setupStreakTest(ctx);

    // Create 50 test users with varying streak lengths
    const users = await Promise.all(
      Array.from({ length: 50 }, (_, i) =>
        ctx.createUser({ timezone: 'America/New_York' })
      )
    );

    // Record activity for all
    for (const user of users) {
      await streakService.recordActivity({
        userId: user.id,
        activityType: 'LOGIN',
        action: 'session_start',
        sourceEventId: `batch-test-${user.id}`,
      });
    }

    const summary = await worker.evaluate({
      batchSize: 10, // Force multiple batches
      concurrency: 2,
    });

    expect(summary.totalEvaluated).toBe(50);
    expect(summary.errors).toBe(0);
  });
});
```

### Running Tests

```bash
# Run all streak tests
pnpm test --filter=@mcv/engagement/streaks

# Run unit tests only
pnpm test --filter=@mcv/engagement/streaks -- --grep="unit"

# Run integration tests (requires local Supabase)
pnpm test:integration --filter=@mcv/engagement/streaks

# Run with coverage
pnpm test:coverage --filter=@mcv/engagement/streaks

# Run timezone-specific tests
pnpm test --filter=@mcv/engagement/streaks -- --grep="timezone|DST|boundary"

# Run evaluation pipeline tests
pnpm test --filter=@mcv/engagement/streaks -- --grep="EvaluationWorker"

# Load test the evaluation pipeline
pnpm test:load --filter=@mcv/engagement/streaks -- --users=10000 --streaks=5
```

### Test Coverage Requirements

| Area | Minimum Coverage | Notes |
|------|-----------------|-------|
| Day boundary calculation | 100% | Critical correctness — every timezone edge case must be covered |
| State machine transitions | 100% | All status transitions (ACTIVE→FROZEN→ACTIVE, ACTIVE→BROKEN→RECOVERED→ACTIVE, etc.) |
| Freeze consumption logic | 95% | Auto-consumption, expiry, inventory limits |
| Recovery flow | 95% | Eligibility checks, cost calculation, payment handling, lifetime limits |
| Multiplier computation | 100% | Step function, cap, edge cases |
| Event deduplication | 100% | sourceEventId uniqueness, idempotent processing |
| Evaluation worker | 90% | Batch processing, error handling, idempotency |
| Notification dispatch | 85% | Channel selection, scheduling, deduplication |
| Leaderboard refresh | 85% | Ranking calculation, period handling |
| Analytics aggregation | 80% | Distribution buckets, rate calculations |
| tRPC routers | 90% | Input validation, authorization, error responses |
| RLS policies | 100% | Tenant isolation must be verified with multi-tenant test scenarios |

---

*Last updated: 2026-02-08*
*Module version: 0.12.0*
*Documentation version: 2.0*