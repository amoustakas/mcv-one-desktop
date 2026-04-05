# @mcv/engagement/leaderboards

> Competitive leaderboard systems with real-time ranking, seasonal competition, cross-venture federation, and anti-cheat enforcement for the MCV.ONE platform.

**Module:** `@mcv/engagement/leaderboards`  
**Domain:** Engagement (Tier 5)  
**Parent:** `@mcv/engagement`  
**Status:** Stable  
**Since:** 0.12.0  
**Maintainers:** MCV Engagement Team  

---

## Table of Contents

- [Purpose](#purpose)
- [Exports](#exports)
- [Architecture](#architecture)
  - [Score Submission Pipeline](#score-submission-pipeline)
  - [Ranking Pipeline](#ranking-pipeline)
  - [Real-Time Update Flow](#real-time-update-flow)
  - [Season Lifecycle](#season-lifecycle)
- [Core Interfaces](#core-interfaces)
  - [LeaderboardService](#leaderboardservice)
  - [Leaderboard](#leaderboard)
  - [LeaderboardEntry](#leaderboardentry)
  - [RankingAlgorithm](#rankingalgorithm)
  - [LeaderboardSeason](#leaderboardseason)
  - [LeaderboardReward](#leaderboardreward)
  - [ScoreValidator](#scorevalidator)
  - [LeaderboardSegment](#leaderboardsegment)
  - [CompositeScoreDefinition](#compositescoredefinition)
  - [TieBreakRule](#tiebreakrule)
  - [LeaderboardBan](#leaderboardban)
  - [RankSnapshot](#ranksnapshot)
  - [LeaderboardDisplay](#leaderboarddisplay)
- [Database Schemas](#database-schemas)
  - [leaderboards](#leaderboards-table)
  - [leaderboard_entries](#leaderboard_entries-table)
  - [leaderboard_seasons](#leaderboard_seasons-table)
  - [leaderboard_rewards](#leaderboard_rewards-table)
  - [score_submissions](#score_submissions-table)
  - [leaderboard_segments](#leaderboard_segments-table)
  - [rank_snapshots](#rank_snapshots-table)
  - [leaderboard_bans](#leaderboard_bans-table)
  - [Row-Level Security Policies](#row-level-security-policies)
- [Code Examples](#code-examples)
  - [1 — Creating a Leaderboard with Seasons](#1--creating-a-leaderboard-with-seasons)
  - [2 — Submitting Scores with Validation](#2--submitting-scores-with-validation)
  - [3 — Querying Rankings with Around-Me](#3--querying-rankings-with-around-me)
  - [4 — Configuring Composite Scores](#4--configuring-composite-scores)
  - [5 — Setting Up Season Rewards](#5--setting-up-season-rewards)
  - [6 — Real-Time WebSocket Subscriptions](#6--real-time-websocket-subscriptions)
  - [7 — Cross-Venture Federation](#7--cross-venture-federation)
  - [8 — Anti-Cheat Score Validation Pipeline](#8--anti-cheat-score-validation-pipeline)
- [Error Codes](#error-codes)
- [Security](#security)
  - [Multi-Tenant Isolation](#multi-tenant-isolation)
  - [Score Integrity](#score-integrity)
  - [Anti-Cheat Architecture](#anti-cheat-architecture)
  - [Privacy Controls](#privacy-controls)
  - [Rate Limiting](#rate-limiting)
  - [Audit Trail](#audit-trail)
- [Environment Variables](#environment-variables)
- [Dependencies](#dependencies)
- [Testing](#testing)
  - [Unit Tests](#unit-tests)
  - [Integration Tests](#integration-tests)
  - [Load Tests](#load-tests)
  - [Anti-Cheat Tests](#anti-cheat-tests)

---

## Purpose

The `@mcv/engagement/leaderboards` module provides a complete competitive ranking infrastructure for ventures on the MCV.ONE platform. Leaderboards are a foundational engagement mechanism — they transform individual actions into shared competition, give users visible progress markers, and create recurring engagement loops through seasonal resets and rewards.

This module addresses several hard problems in leaderboard design:

1. **Real-time ranking at scale** — Maintaining accurate ranks across millions of entries with sub-100ms query times using Redis sorted sets backed by PostgreSQL for durability.

2. **Fair competition** — Multiple ranking algorithms (dense rank, ELO, Glicko-2, TrueSkill) ensure the right algorithm matches the competition type, whether it's a simple high-score board or a head-to-head matchmaking ladder.

3. **Seasonal engagement** — Automated season management with configurable periods, archive snapshots, reward distribution, and clean resets that keep competition fresh while preserving historical achievement.

4. **Cross-venture federation** — Ventures can opt into federated leaderboards that aggregate rankings across multiple ventures, enabling platform-wide competitions while maintaining tenant isolation.

5. **Anti-cheat integrity** — Multi-layer score validation, statistical anomaly detection, manual review queues, and ban management protect competitive integrity without creating false positives that punish legitimate players.

6. **Flexible segmentation** — A single leaderboard definition can be viewed through multiple lenses: global, per-venture, regional, tier-based, friends-only, or arbitrary custom segments.

7. **Composite scoring** — Complex scoring formulas that combine multiple metrics with weights, normalization, and custom functions enable nuanced ranking beyond simple single-metric comparisons.

The module integrates deeply with `@mcv/engagement/rewards` for prize distribution, `@mcv/engagement/achievements` for rank-based achievements, `@mcv/engagement/streaks` for streak bonuses, and `@mcv/identity` for user profiles and privacy controls.

---

## Exports

```typescript
// ─── Core Service ────────────────────────────────────────────────
export { LeaderboardService }          from './services/leaderboard.service';
export { LeaderboardRouter }           from './router';
export { leaderboardsModule }          from './module';

// ─── Domain Types ────────────────────────────────────────────────
export type { Leaderboard }            from './types/leaderboard';
export type { LeaderboardEntry }       from './types/entry';
export type { LeaderboardSeason }      from './types/season';
export type { LeaderboardReward }      from './types/reward';
export type { LeaderboardSegment }     from './types/segment';
export type { LeaderboardBan }         from './types/ban';
export type { RankSnapshot }           from './types/snapshot';
export type { ScoreSubmission }        from './types/submission';
export type { CompositeScoreDefinition } from './types/composite-score';
export type { LeaderboardDisplay }     from './types/display';

// ─── Enums ───────────────────────────────────────────────────────
export { RankingAlgorithm }            from './enums/ranking-algorithm';
export { SortDirection }               from './enums/sort-direction';
export { SeasonStatus }                from './enums/season-status';
export { SubmissionStatus }            from './enums/submission-status';
export { BanType }                     from './enums/ban-type';
export { TimePeriod }                  from './enums/time-period';
export { SegmentType }                 from './enums/segment-type';
export { TieBreakStrategy }           from './enums/tie-break-strategy';
export { LeaderboardVisibility }       from './enums/visibility';

// ─── Validators ──────────────────────────────────────────────────
export type { ScoreValidator }         from './validators/score-validator';
export { createScoreValidator }        from './validators/score-validator';
export { RangeValidator }              from './validators/range';
export { RateValidator }               from './validators/rate';
export { StatisticalValidator }        from './validators/statistical';
export { DeltaValidator }              from './validators/delta';

// ─── Ranking Engines ─────────────────────────────────────────────
export { DenseRankEngine }             from './engines/dense-rank';
export { StandardRankEngine }          from './engines/standard-rank';
export { ModifiedCompetitionEngine }   from './engines/modified-competition';
export { EloEngine }                   from './engines/elo';
export { Glicko2Engine }               from './engines/glicko2';
export { TrueSkillEngine }            from './engines/trueskill';
export { CompositeScoreEngine }        from './engines/composite';

// ─── Redis Layer ─────────────────────────────────────────────────
export { RedisLeaderboardStore }       from './redis/store';
export { RedisRankCache }              from './redis/rank-cache';
export { RedisPubSub }                 from './redis/pubsub';

// ─── WebSocket ───────────────────────────────────────────────────
export { LeaderboardWSHandler }        from './ws/handler';
export { LeaderboardWSEvents }         from './ws/events';

// ─── Database ────────────────────────────────────────────────────
export { leaderboardsSchema }          from './db/schema';
export { leaderboardEntriesSchema }    from './db/schema';
export { leaderboardSeasonsSchema }    from './db/schema';
export { leaderboardRewardsSchema }    from './db/schema';
export { scoreSubmissionsSchema }      from './db/schema';
export { leaderboardSegmentsSchema }   from './db/schema';
export { rankSnapshotsSchema }         from './db/schema';
export { leaderboardBansSchema }       from './db/schema';

// ─── Events ──────────────────────────────────────────────────────
export { LeaderboardEvents }           from './events';
export type {
  ScoreSubmittedEvent,
  RankChangedEvent,
  SeasonStartedEvent,
  SeasonEndedEvent,
  RewardDistributedEvent,
  BanIssuedEvent,
  LeaderboardCreatedEvent,
  LeaderboardArchivedEvent,
} from './events';

// ─── Utilities ───────────────────────────────────────────────────
export { normalizeScore }              from './utils/normalize';
export { formatRank }                  from './utils/format';
export { calculatePercentile }         from './utils/percentile';
export { generateLeaderboardSlug }     from './utils/slug';
```

---

## Architecture

### Score Submission Pipeline

Score submission follows a multi-stage pipeline that validates, processes, and ranks incoming scores before persisting results and broadcasting updates.

```
┌─────────────┐     ┌──────────────┐     ┌───────────────┐     ┌──────────────┐
│   Client     │────▶│  tRPC Router │────▶│  Rate Limiter │────▶│  Auth Check  │
│  (submit)    │     │              │     │               │     │  (RLS + JWT) │
└─────────────┘     └──────────────┘     └───────────────┘     └──────┬───────┘
                                                                       │
                                                                       ▼
┌─────────────┐     ┌──────────────┐     ┌───────────────┐     ┌──────────────┐
│  Broadcast   │◀────│  Rank Engine │◀────│  Score        │◀────│  Validation  │
│  (WS+Redis)  │     │  (recalc)    │     │  Persistence  │     │  Pipeline    │
└──────┬──────┘     └──────┬───────┘     └───────────────┘     └──────────────┘
       │                    │                                          │
       ▼                    ▼                                          ▼
┌─────────────┐     ┌──────────────┐                           ┌──────────────┐
│  WebSocket   │     │  Redis       │                           │  Anti-Cheat  │
│  Clients     │     │  Sorted Set  │                           │  Queue       │
└─────────────┘     └──────────────┘                           └──────────────┘
```

**Pipeline Stages:**

1. **Ingestion** — Score arrives via tRPC mutation or internal event. The submission includes the leaderboard ID, user ID, raw score value, optional metadata, and a submission timestamp.

2. **Rate Limiting** — Per-user, per-leaderboard rate limits prevent spam submissions. Configurable via `maxSubmissionsPerMinute` and `maxSubmissionsPerHour` on the leaderboard definition.

3. **Authentication & Authorization** — JWT verification, venture membership check, and entry criteria evaluation (minimum level, required achievements, registration status).

4. **Validation Pipeline** — Score passes through an ordered chain of validators:
   - **RangeValidator** — Score within configured min/max bounds
   - **DeltaValidator** — Score change from previous submission within acceptable delta
   - **RateValidator** — Score improvement rate within human-achievable bounds
   - **StatisticalValidator** — Score within configured standard deviations of the population mean
   - **Custom validators** — Venture-defined validation functions

5. **Anti-Cheat Analysis** — Flagged submissions enter the review queue. Clear submissions proceed immediately. Configurable thresholds determine automatic rejection vs. manual review.

6. **Score Persistence** — Validated score written to `score_submissions` table. If the score improves the user's best (or the leaderboard accepts all submissions), the `leaderboard_entries` table is updated.

7. **Rank Recalculation** — The appropriate ranking engine recalculates affected ranks. For sorted-set boards, this is O(log N) via Redis. For ELO/Glicko-2/TrueSkill, opponent entries are also updated.

8. **Broadcast** — Rank changes published to Redis Pub/Sub, which fans out to WebSocket connections for real-time UI updates.

### Ranking Pipeline

Different ranking algorithms serve different competition models:

```
┌────────────────────────────────────────────────────────────────┐
│                     Ranking Engine Router                       │
│                                                                │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  High-Score Boards          Competitive Ladders          │  │
│  │                                                          │  │
│  │  ┌─────────────┐          ┌─────────────────────┐       │  │
│  │  │ Dense Rank   │          │ ELO Rating           │       │  │
│  │  │ (1,2,3,4)   │          │ (K-factor adaptive)  │       │  │
│  │  └─────────────┘          └─────────────────────┘       │  │
│  │                                                          │  │
│  │  ┌─────────────┐          ┌─────────────────────┐       │  │
│  │  │ Standard     │          │ Glicko-2             │       │  │
│  │  │ (1,2,2,4)   │          │ (rating+deviation)   │       │  │
│  │  └─────────────┘          └─────────────────────┘       │  │
│  │                                                          │  │
│  │  ┌─────────────┐          ┌─────────────────────┐       │  │
│  │  │ Modified     │          │ TrueSkill            │       │  │
│  │  │ Competition  │          │ (team-based, multi)  │       │  │
│  │  │ (1,2,2,3)   │          │                      │       │  │
│  │  └─────────────┘          └─────────────────────┘       │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Composite Score Engine                                   │  │
│  │  ┌─────────┐  ┌──────────┐  ┌───────────┐               │  │
│  │  │ Weighted │  │ Formula  │  │ Normalized│               │  │
│  │  │ Sum      │  │ Based    │  │ Aggregate │               │  │
│  │  └─────────┘  └──────────┘  └───────────┘               │  │
│  └──────────────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────────┘
```

**High-Score Ranking Algorithms:**

| Algorithm | Tied Scores | Example (scores: 100, 90, 90, 80) | Use Case |
|-----------|-------------|-------------------------------------|----------|
| Dense Rank | Same rank, next rank +1 | 1, 2, 2, 3 | Most leaderboards, clean UX |
| Standard Rank | Same rank, skip next | 1, 2, 2, 4 | Sports standings, traditional |
| Modified Competition | Same rank = highest possible | 1, 2, 2, 3 | When ties should feel rewarding |

**Competitive Rating Algorithms:**

| Algorithm | Best For | Key Properties |
|-----------|----------|----------------|
| ELO | 1v1 matchups | Simple, adaptive K-factor, well-understood |
| Glicko-2 | 1v1 with confidence | Rating deviation decreases with play, volatility tracking |
| TrueSkill | Team & multiplayer | Multi-team support, faster convergence, Bayesian |

### Real-Time Update Flow

```
┌───────────┐   score    ┌──────────────┐   rank_changed   ┌───────────┐
│  User A   │──────────▶│ Leaderboard  │────────────────▶│  Redis    │
│  submits  │           │  Service     │                  │  Pub/Sub  │
└───────────┘           └──────────────┘                  └─────┬─────┘
                                                                │
                              ┌──────────────────────────────────┤
                              │              │                   │
                              ▼              ▼                   ▼
                        ┌──────────┐  ┌──────────┐       ┌──────────┐
                        │  User A  │  │  User B  │       │  User C  │
                        │  (WS)   │  │  (WS)   │       │  (WS)   │
                        │  "You   │  │  "You   │       │  "Player │
                        │  moved  │  │  dropped │       │  A moved │
                        │  to #3" │  │  to #4"  │       │  to #3"  │
                        └──────────┘  └──────────┘       └──────────┘
```

The real-time update system uses Redis Pub/Sub channels scoped to leaderboard + segment combinations. Clients subscribe to specific board channels via WebSocket. When a rank change occurs, the service publishes a lightweight delta event containing only the affected positions (not the full board), minimizing bandwidth.

**WebSocket Events Published:**

| Event | Payload | When |
|-------|---------|------|
| `rank:updated` | `{ userId, oldRank, newRank, score }` | Any rank change |
| `rank:self` | `{ rank, score, delta, percentile }` | User's own rank changes |
| `board:top` | `{ entries: [...top N] }` | Top-N positions change |
| `season:started` | `{ seasonId, name, startsAt, endsAt }` | Season begins |
| `season:ending` | `{ seasonId, endsIn }` | Season ending countdown |
| `season:ended` | `{ seasonId, finalRankings }` | Season concludes |
| `reward:earned` | `{ rewardId, tier, position }` | Reward distributed |

### Season Lifecycle

```
   ┌────────────────────────────────────────────────────────────────┐
   │                        Season Lifecycle                        │
   │                                                                │
   │  ┌──────────┐   ┌──────────┐   ┌──────────┐   ┌──────────┐  │
   │  │ PENDING  │──▶│ ACTIVE   │──▶│ ENDING   │──▶│ CLOSED   │  │
   │  │          │   │          │   │ (grace)  │   │          │  │
   │  └──────────┘   └──────────┘   └──────────┘   └──────────┘  │
   │       │              │              │               │         │
   │       │              │              │               ▼         │
   │       │              │              │         ┌──────────┐   │
   │       │              │              │         │ ARCHIVED │   │
   │       │              │              │         └──────────┘   │
   │       │              │              │                         │
   │  Pre-season     Active play    Score freeze          │       │
   │  registration   & scoring      & review             │       │
   │  period                        period               │       │
   │                                                     │       │
   │       ▼                                              │       │
   │  Next season auto-created ◀──────────────────────────┘       │
   └────────────────────────────────────────────────────────────────┘
```

**Season States:**

| State | Description | Score Submissions | Rank Queries |
|-------|-------------|-------------------|--------------|
| `PENDING` | Season created, not yet started. Registration open if configured. | Rejected | Return empty |
| `ACTIVE` | Season in progress. Scores accepted, ranks updated in real-time. | Accepted | Live data |
| `ENDING` | Grace period before close. Final scores accepted, rewards previewed. | Accepted (grace) | Live data |
| `CLOSED` | Season finished. Final rankings locked, rewards distributed. | Rejected | Frozen final |
| `ARCHIVED` | Moved to cold storage. Queryable but not displayed by default. | Rejected | Archive data |

---

## Core Interfaces

### LeaderboardService

The primary service interface for all leaderboard operations. Injected via the module's dependency container.

```typescript
interface LeaderboardService {
  // ─── Leaderboard CRUD ──────────────────────────────────────────
  
  /**
   * Create a new leaderboard definition.
   * Automatically provisions Redis sorted set and creates initial season if configured.
   */
  create(input: CreateLeaderboardInput): Promise<Leaderboard>;
  
  /**
   * Retrieve a leaderboard by ID with optional relation loading.
   */
  getById(
    leaderboardId: string,
    options?: {
      includeSeason?: boolean;
      includeSegments?: boolean;
      includeRewards?: boolean;
    }
  ): Promise<Leaderboard | null>;
  
  /**
   * Retrieve a leaderboard by its unique slug within a venture.
   */
  getBySlug(ventureId: string, slug: string): Promise<Leaderboard | null>;
  
  /**
   * List leaderboards for a venture with pagination and filtering.
   */
  list(
    ventureId: string,
    options?: {
      status?: LeaderboardStatus[];
      visibility?: LeaderboardVisibility[];
      cursor?: string;
      limit?: number;
    }
  ): Promise<PaginatedResult<Leaderboard>>;
  
  /**
   * Update leaderboard configuration.
   * Some fields (ranking algorithm, sort direction) cannot be changed
   * while a season is active.
   */
  update(
    leaderboardId: string,
    input: UpdateLeaderboardInput
  ): Promise<Leaderboard>;
  
  /**
   * Soft-delete a leaderboard. Archives all data and removes from active queries.
   */
  archive(leaderboardId: string): Promise<void>;

  // ─── Score Submission ──────────────────────────────────────────
  
  /**
   * Submit a score for a user on a leaderboard.
   * Score passes through the full validation pipeline before acceptance.
   * Returns the submission result including new rank if accepted.
   */
  submitScore(input: SubmitScoreInput): Promise<ScoreSubmissionResult>;
  
  /**
   * Submit scores in bulk (admin/system use).
   * Bypasses rate limiting but still runs validation.
   */
  submitScoresBulk(
    leaderboardId: string,
    submissions: BulkScoreSubmission[]
  ): Promise<BulkSubmissionResult>;
  
  /**
   * Increment a user's score by a delta value.
   * Useful for cumulative leaderboards (total points, kills, etc).
   */
  incrementScore(
    leaderboardId: string,
    userId: string,
    delta: number,
    metadata?: Record<string, unknown>
  ): Promise<ScoreSubmissionResult>;

  // ─── Ranking Queries ───────────────────────────────────────────
  
  /**
   * Get the top N entries for a leaderboard, optionally filtered by segment.
   */
  getTopEntries(
    leaderboardId: string,
    options?: {
      limit?: number;
      offset?: number;
      segmentId?: string;
      seasonId?: string;
    }
  ): Promise<PaginatedResult<LeaderboardEntry>>;
  
  /**
   * Get entries surrounding a specific user ("around me" view).
   * Returns N entries above and N entries below the user's position.
   */
  getAroundMe(
    leaderboardId: string,
    userId: string,
    options?: {
      above?: number;   // default: 5
      below?: number;   // default: 5
      segmentId?: string;
      seasonId?: string;
    }
  ): Promise<AroundMeResult>;
  
  /**
   * Get a specific user's entry and rank on a leaderboard.
   */
  getUserEntry(
    leaderboardId: string,
    userId: string,
    options?: {
      segmentId?: string;
      seasonId?: string;
    }
  ): Promise<LeaderboardEntry | null>;
  
  /**
   * Get a user's rank across all leaderboards they participate in.
   */
  getUserRankings(
    userId: string,
    options?: {
      ventureId?: string;
      limit?: number;
      cursor?: string;
    }
  ): Promise<PaginatedResult<UserRankingSummary>>;
  
  /**
   * Get the total number of entries on a leaderboard.
   */
  getEntryCount(
    leaderboardId: string,
    options?: { segmentId?: string; seasonId?: string }
  ): Promise<number>;
  
  /**
   * Calculate a user's percentile rank.
   */
  getPercentile(
    leaderboardId: string,
    userId: string,
    options?: { segmentId?: string; seasonId?: string }
  ): Promise<number>;

  // ─── Seasons ───────────────────────────────────────────────────
  
  /**
   * Create a new season for a leaderboard.
   */
  createSeason(input: CreateSeasonInput): Promise<LeaderboardSeason>;
  
  /**
   * Get the current active season for a leaderboard.
   */
  getActiveSeason(leaderboardId: string): Promise<LeaderboardSeason | null>;
  
  /**
   * List all seasons for a leaderboard with status filtering.
   */
  listSeasons(
    leaderboardId: string,
    options?: { status?: SeasonStatus[]; limit?: number; cursor?: string }
  ): Promise<PaginatedResult<LeaderboardSeason>>;
  
  /**
   * End the current season, triggering reward distribution and archival.
   */
  endSeason(
    leaderboardId: string,
    seasonId: string,
    options?: { distributeRewards?: boolean; autoCreateNext?: boolean }
  ): Promise<SeasonEndResult>;
  
  /**
   * Reset a leaderboard for a new season, optionally preserving user entries
   * with a decay factor applied to existing scores.
   */
  resetForNewSeason(
    leaderboardId: string,
    options?: { decayFactor?: number; preserveEntries?: boolean }
  ): Promise<void>;

  // ─── Segments ──────────────────────────────────────────────────
  
  /**
   * Create a custom segment for filtering leaderboard views.
   */
  createSegment(input: CreateSegmentInput): Promise<LeaderboardSegment>;
  
  /**
   * List segments available for a leaderboard.
   */
  listSegments(leaderboardId: string): Promise<LeaderboardSegment[]>;
  
  /**
   * Get a friends-only view of the leaderboard for a user.
   */
  getFriendsLeaderboard(
    leaderboardId: string,
    userId: string,
    options?: { limit?: number; seasonId?: string }
  ): Promise<LeaderboardEntry[]>;

  // ─── Rewards ───────────────────────────────────────────────────
  
  /**
   * Configure rewards for leaderboard positions/tiers.
   */
  configureRewards(
    leaderboardId: string,
    rewards: ConfigureRewardInput[]
  ): Promise<LeaderboardReward[]>;
  
  /**
   * Preview reward distribution for the current standings.
   * Does not actually distribute — used for UI previews.
   */
  previewRewards(
    leaderboardId: string,
    seasonId?: string
  ): Promise<RewardPreview[]>;
  
  /**
   * Distribute rewards for a completed season.
   * Called automatically on season end if `autoDistributeRewards` is true.
   */
  distributeRewards(
    leaderboardId: string,
    seasonId: string
  ): Promise<RewardDistributionResult>;

  // ─── Anti-Cheat ────────────────────────────────────────────────
  
  /**
   * Get submissions flagged for manual review.
   */
  getReviewQueue(
    leaderboardId: string,
    options?: { limit?: number; cursor?: string }
  ): Promise<PaginatedResult<FlaggedSubmission>>;
  
  /**
   * Approve or reject a flagged submission.
   */
  reviewSubmission(
    submissionId: string,
    decision: ReviewDecision
  ): Promise<void>;
  
  /**
   * Ban a user from a leaderboard.
   */
  banUser(input: BanUserInput): Promise<LeaderboardBan>;
  
  /**
   * Remove a ban for a user.
   */
  unbanUser(leaderboardId: string, userId: string): Promise<void>;
  
  /**
   * Check if a user is banned from a leaderboard.
   */
  isBanned(leaderboardId: string, userId: string): Promise<BanCheckResult>;
  
  /**
   * Process a ban appeal.
   */
  processAppeal(
    banId: string,
    decision: AppealDecision
  ): Promise<void>;

  // ─── Snapshots & History ───────────────────────────────────────
  
  /**
   * Take a point-in-time snapshot of leaderboard rankings.
   */
  takeSnapshot(
    leaderboardId: string,
    options?: { segmentId?: string; topN?: number }
  ): Promise<RankSnapshot>;
  
  /**
   * Get a user's rank history over time.
   */
  getRankHistory(
    leaderboardId: string,
    userId: string,
    options?: {
      from?: Date;
      to?: Date;
      granularity?: 'hour' | 'day' | 'week';
    }
  ): Promise<RankHistoryPoint[]>;

  // ─── Federation ────────────────────────────────────────────────
  
  /**
   * Opt a venture into a federated cross-venture leaderboard.
   */
  joinFederation(
    federatedLeaderboardId: string,
    ventureId: string,
    options?: { scoreMapping?: ScoreMappingConfig }
  ): Promise<void>;
  
  /**
   * Leave a federated leaderboard.
   */
  leaveFederation(
    federatedLeaderboardId: string,
    ventureId: string
  ): Promise<void>;
  
  /**
   * Get federated rankings aggregated across ventures.
   */
  getFederatedRankings(
    federatedLeaderboardId: string,
    options?: { limit?: number; offset?: number }
  ): Promise<PaginatedResult<FederatedEntry>>;
}
```

### Leaderboard

The core leaderboard definition entity.

```typescript
interface Leaderboard {
  /** Unique identifier (ULID). */
  id: string;
  
  /** Owning venture ID. Null for platform-level federated boards. */
  ventureId: string | null;
  
  /** URL-safe slug, unique within a venture. */
  slug: string;
  
  /** Human-readable name. */
  name: string;
  
  /** Optional description displayed in the UI. */
  description: string | null;
  
  /** The metric being tracked (e.g., "points", "kills", "time_seconds"). */
  metric: string;
  
  /** Unit label for display (e.g., "pts", "kills", "seconds"). */
  metricUnit: string | null;
  
  /** Sort direction for ranking. */
  sortDirection: SortDirection;
  
  /** Ranking algorithm to use. */
  rankingAlgorithm: RankingAlgorithm;
  
  /** Composite score definition (if using composite scoring). */
  compositeScore: CompositeScoreDefinition | null;
  
  /** Time period for automatic resets. Null for all-time boards. */
  timePeriod: TimePeriod | null;
  
  /** Cron expression for custom reset schedules (overrides timePeriod). */
  resetSchedule: string | null;
  
  /** Tie-break configuration. */
  tieBreakRules: TieBreakRule[];
  
  /** Entry criteria — who can appear on this leaderboard. */
  entryCriteria: EntryCriteria;
  
  /** Score validation rules. */
  validationRules: ValidationRuleConfig[];
  
  /** Anti-cheat configuration. */
  antiCheatConfig: AntiCheatConfig;
  
  /** Display configuration. */
  display: LeaderboardDisplay;
  
  /** Visibility level. */
  visibility: LeaderboardVisibility;
  
  /** Maximum number of entries to maintain. Null for unlimited. */
  maxEntries: number | null;
  
  /** Rate limiting for score submissions. */
  rateLimit: RateLimitConfig;
  
  /** Whether this is a federated cross-venture board. */
  isFederated: boolean;
  
  /** Currently active season (if seasonal). */
  activeSeason: LeaderboardSeason | null;
  
  /** Tags for categorization. */
  tags: string[];
  
  /** Custom metadata. */
  metadata: Record<string, unknown>;
  
  /** Total number of entries. */
  entryCount: number;
  
  /** Status: active, paused, archived. */
  status: LeaderboardStatus;
  
  /** ISO timestamp of creation. */
  createdAt: string;
  
  /** ISO timestamp of last update. */
  updatedAt: string;
}

enum SortDirection {
  /** Higher scores rank higher (default). */
  DESC = 'desc',
  /** Lower scores rank higher (time trials, golf). */
  ASC = 'asc',
}

enum LeaderboardStatus {
  ACTIVE = 'active',
  PAUSED = 'paused',
  ARCHIVED = 'archived',
}

enum LeaderboardVisibility {
  /** Visible to all users. */
  PUBLIC = 'public',
  /** Visible only to venture members. */
  MEMBERS = 'members',
  /** Visible only to participants. */
  PARTICIPANTS = 'participants',
  /** Hidden, accessible only via direct link. */
  UNLISTED = 'unlisted',
  /** Admin only. */
  PRIVATE = 'private',
}

interface EntryCriteria {
  /** Minimum user level required to enter. */
  minLevel?: number;
  /** Required achievement IDs to enter. */
  requiredAchievements?: string[];
  /** Required venture membership tier. */
  requiredTier?: string;
  /** Whether pre-registration is required (for seasonal). */
  requiresRegistration?: boolean;
  /** Maximum entries allowed (for tournaments). */
  maxParticipants?: number;
  /** Custom criteria evaluated as expressions. */
  customCriteria?: string;
}

interface RateLimitConfig {
  /** Max submissions per minute per user. */
  maxPerMinute: number;
  /** Max submissions per hour per user. */
  maxPerHour: number;
  /** Max submissions per day per user. */
  maxPerDay: number;
  /** Cooldown between submissions in seconds. */
  cooldownSeconds: number;
}

interface AntiCheatConfig {
  /** Enable automatic anomaly detection. */
  anomalyDetectionEnabled: boolean;
  /** Standard deviations from mean to flag. */
  anomalyThreshold: number;
  /** Minimum submissions before statistical analysis kicks in. */
  minSamplesForAnalysis: number;
  /** Maximum allowed score improvement per submission (percentage). */
  maxImprovementPercent: number | null;
  /** Whether flagged scores are held for review (true) or auto-rejected (false). */
  holdForReview: boolean;
  /** Enable shadowban mode (banned users see their own scores but are hidden from others). */
  shadowbanEnabled: boolean;
}
```

### LeaderboardEntry

A single entry on a leaderboard — one per user per leaderboard per season.

```typescript
interface LeaderboardEntry {
  /** Unique entry ID. */
  id: string;
  
  /** Leaderboard this entry belongs to. */
  leaderboardId: string;
  
  /** User who owns this entry. */
  userId: string;
  
  /** Season ID (null for all-time boards). */
  seasonId: string | null;
  
  /** Current score value. */
  score: number;
  
  /** Current rank position (1-indexed). */
  rank: number;
  
  /** Previous rank position (for delta display). */
  previousRank: number | null;
  
  /** Rank change since last calculation (+positive = improved, -negative = dropped). */
  rankDelta: number;
  
  /** Best score ever achieved (may differ from current in decay boards). */
  bestScore: number;
  
  /** Best rank ever achieved. */
  bestRank: number;
  
  /** Number of score submissions. */
  submissionCount: number;
  
  /** Percentile rank (0-100). */
  percentile: number;
  
  /** Tier label based on percentile (e.g., "Diamond", "Gold"). */
  tier: string | null;
  
  /** For competitive algorithms: rating value. */
  rating: number | null;
  
  /** For Glicko-2: rating deviation. */
  ratingDeviation: number | null;
  
  /** For Glicko-2: rating volatility. */
  ratingVolatility: number | null;
  
  /** Timestamp of the score that set the current value. */
  scoreSetAt: string;
  
  /** Timestamp of first submission. */
  firstSubmittedAt: string;
  
  /** Timestamp of most recent submission. */
  lastSubmittedAt: string;
  
  /** Segment memberships for this entry. */
  segments: string[];
  
  /** Custom metadata attached by the submission. */
  metadata: Record<string, unknown>;
  
  /** User profile snapshot for display (name, avatar, etc). */
  userProfile?: LeaderboardUserProfile;
}

interface LeaderboardUserProfile {
  userId: string;
  displayName: string;
  avatarUrl: string | null;
  /** Venture-specific title/flair. */
  title: string | null;
  /** Country code for regional display. */
  countryCode: string | null;
}

interface AroundMeResult {
  /** The requesting user's entry. */
  me: LeaderboardEntry;
  /** Entries ranked above the user. */
  above: LeaderboardEntry[];
  /** Entries ranked below the user. */
  below: LeaderboardEntry[];
  /** Total entries on the board. */
  totalEntries: number;
}

interface UserRankingSummary {
  leaderboardId: string;
  leaderboardName: string;
  leaderboardSlug: string;
  ventureId: string;
  rank: number;
  score: number;
  percentile: number;
  totalEntries: number;
  rankDelta: number;
  seasonName: string | null;
}
```

### RankingAlgorithm

Enum and configuration for ranking algorithms.

```typescript
enum RankingAlgorithm {
  /** Dense ranking: 1, 2, 2, 3, 4 */
  DENSE = 'dense',
  /** Standard competition: 1, 2, 2, 4, 5 */
  STANDARD = 'standard',
  /** Modified competition: tied entries get the highest possible rank */
  MODIFIED_COMPETITION = 'modified_competition',
  /** ELO rating system for 1v1 competition. */
  ELO = 'elo',
  /** Glicko-2 rating with confidence intervals. */
  GLICKO2 = 'glicko2',
  /** Microsoft TrueSkill for team and multiplayer. */
  TRUESKILL = 'trueskill',
}

interface EloConfig {
  /** Initial rating for new players. Default: 1200. */
  initialRating: number;
  /** Base K-factor. Default: 32. */
  kFactor: number;
  /** Use dynamic K-factor that decreases with games played. */
  dynamicKFactor: boolean;
  /** K-factor for players with < provisionalGames games. */
  provisionalKFactor: number;
  /** Number of games considered provisional. Default: 30. */
  provisionalGames: number;
  /** Floor rating (minimum possible). Default: 100. */
  floorRating: number;
}

interface Glicko2Config {
  /** Initial rating. Default: 1500. */
  initialRating: number;
  /** Initial rating deviation. Default: 350. */
  initialDeviation: number;
  /** Initial volatility. Default: 0.06. */
  initialVolatility: number;
  /** System constant (tau). Controls volatility change speed. Default: 0.5. */
  tau: number;
  /** Convergence tolerance for iterative algorithm. Default: 0.000001. */
  convergenceTolerance: number;
  /** Rating period length in hours. Default: 168 (one week). */
  ratingPeriodHours: number;
}

interface TrueSkillConfig {
  /** Initial mean (mu). Default: 25. */
  initialMu: number;
  /** Initial standard deviation (sigma). Default: 25/3. */
  initialSigma: number;
  /** Additive dynamics factor (beta). Default: initialSigma / 2. */
  beta: number;
  /** Draw probability. Default: 0.1. */
  drawProbability: number;
  /** Dynamics factor (tau). Default: initialSigma / 100. */
  tau: number;
}
```

### LeaderboardSeason

Represents a time-bounded competition period.

```typescript
interface LeaderboardSeason {
  /** Unique season ID. */
  id: string;
  
  /** Parent leaderboard ID. */
  leaderboardId: string;
  
  /** Season number (auto-incrementing per leaderboard). */
  seasonNumber: number;
  
  /** Display name (e.g., "Season 3: Winter Championship"). */
  name: string;
  
  /** Optional description. */
  description: string | null;
  
  /** Current status. */
  status: SeasonStatus;
  
  /** Scheduled start time. */
  startsAt: string;
  
  /** Scheduled end time. */
  endsAt: string;
  
  /** Actual start time (may differ from scheduled). */
  actualStartAt: string | null;
  
  /** Actual end time. */
  actualEndAt: string | null;
  
  /** Grace period duration in hours after endsAt before final close. */
  gracePeriodHours: number;
  
  /** Number of entries in this season. */
  entryCount: number;
  
  /** Rewards configured for this season. */
  rewards: LeaderboardReward[];
  
  /** Whether to auto-create the next season on close. */
  autoCreateNext: boolean;
  
  /** Duration for auto-created next season (ISO 8601 duration). */
  nextSeasonDuration: string | null;
  
  /** Score decay factor applied to carried-over scores (0-1). */
  carryOverDecay: number;
  
  /** Whether to preserve entries when transitioning to next season. */
  preserveEntries: boolean;
  
  /** Custom metadata. */
  metadata: Record<string, unknown>;
  
  createdAt: string;
  updatedAt: string;
}

enum SeasonStatus {
  PENDING = 'pending',
  ACTIVE = 'active',
  ENDING = 'ending',
  CLOSED = 'closed',
  ARCHIVED = 'archived',
}
```

### LeaderboardReward

Defines rewards distributed based on leaderboard performance.

```typescript
interface LeaderboardReward {
  /** Unique reward config ID. */
  id: string;
  
  /** Leaderboard this reward belongs to. */
  leaderboardId: string;
  
  /** Season this reward applies to (null for ongoing rewards). */
  seasonId: string | null;
  
  /** Reward distribution type. */
  rewardType: RewardType;
  
  /** For POSITION type: specific positions that receive this reward. */
  positions?: number[];
  
  /** For POSITION_RANGE type: start position (inclusive). */
  positionStart?: number;
  
  /** For POSITION_RANGE type: end position (inclusive). */
  positionEnd?: number;
  
  /** For PERCENTILE type: minimum percentile (e.g., 90 = top 10%). */
  percentileMin?: number;
  
  /** For PERCENTILE type: maximum percentile. */
  percentileMax?: number;
  
  /** For TIER type: tier name. */
  tierName?: string;
  
  /** Reward payload — references to the rewards module. */
  reward: RewardPayload;
  
  /** Display name for this reward tier. */
  displayName: string;
  
  /** Display description. */
  displayDescription: string | null;
  
  /** Icon/badge URL for this reward tier. */
  iconUrl: string | null;
  
  /** Priority for overlapping rewards (higher = takes precedence). */
  priority: number;
  
  /** Whether this reward stacks with other rewards. */
  stackable: boolean;
  
  createdAt: string;
  updatedAt: string;
}

enum RewardType {
  /** Specific positions (1st, 2nd, 3rd). */
  POSITION = 'position',
  /** Position range (top 10, positions 11-25). */
  POSITION_RANGE = 'position_range',
  /** Percentile-based (top 10%, top 25%). */
  PERCENTILE = 'percentile',
  /** Named tier (Diamond, Gold, Silver, Bronze). */
  TIER = 'tier',
  /** Everyone who participated. */
  PARTICIPATION = 'participation',
  /** Streak-based (submitted every day for N days). */
  STREAK = 'streak',
}

interface RewardPayload {
  /** Reference to reward definition in @mcv/engagement/rewards. */
  rewardDefinitionId?: string;
  /** Direct reward specification. */
  points?: number;
  currency?: { amount: number; currencyId: string };
  badge?: { badgeId: string };
  title?: { titleText: string; titleColor: string };
  items?: Array<{ itemId: string; quantity: number }>;
  /** Custom reward data for venture-specific handling. */
  custom?: Record<string, unknown>;
}
```

### ScoreValidator

Interface for implementing custom score validation logic.

```typescript
interface ScoreValidator {
  /** Unique name for this validator. */
  name: string;
  
  /** Human-readable description. */
  description: string;
  
  /**
   * Validate a score submission.
   * Return `{ valid: true }` to pass, or `{ valid: false, reason, severity }` to fail.
   */
  validate(
    submission: ScoreSubmission,
    context: ValidationContext
  ): Promise<ValidationResult>;
}

interface ScoreSubmission {
  id: string;
  leaderboardId: string;
  userId: string;
  score: number;
  previousScore: number | null;
  previousRank: number | null;
  metadata: Record<string, unknown>;
  submittedAt: string;
  ipAddress: string | null;
  userAgent: string | null;
  sessionId: string | null;
}

interface ValidationContext {
  leaderboard: Leaderboard;
  currentEntry: LeaderboardEntry | null;
  /** Population statistics for the leaderboard. */
  stats: LeaderboardStats;
  /** Recent submissions from this user (last 24h). */
  recentSubmissions: ScoreSubmission[];
  /** All submissions from this user for this leaderboard. */
  userSubmissionHistory: {
    count: number;
    firstSubmittedAt: string;
    averageScore: number;
    standardDeviation: number;
    maxScore: number;
    minScore: number;
  };
}

interface LeaderboardStats {
  totalEntries: number;
  meanScore: number;
  medianScore: number;
  standardDeviation: number;
  minScore: number;
  maxScore: number;
  p25: number;
  p75: number;
  p90: number;
  p99: number;
}

interface ValidationResult {
  valid: boolean;
  reason?: string;
  /** Severity determines handling: 'reject' blocks immediately, 'review' queues for manual review. */
  severity?: 'reject' | 'review';
  /** Confidence score for statistical validators (0-1). */
  confidence?: number;
  /** Additional context for review. */
  details?: Record<string, unknown>;
}

/** Configuration for a validation rule on a leaderboard. */
interface ValidationRuleConfig {
  /** Validator type name. */
  type: 'range' | 'delta' | 'rate' | 'statistical' | 'custom';
  /** Whether this rule is enabled. */
  enabled: boolean;
  /** Priority order (lower = runs first). */
  priority: number;
  /** Rule-specific parameters. */
  params: Record<string, unknown>;
}
```

### LeaderboardSegment

Defines a filterable view of a leaderboard.

```typescript
interface LeaderboardSegment {
  /** Unique segment ID. */
  id: string;
  
  /** Parent leaderboard ID. */
  leaderboardId: string;
  
  /** Segment type. */
  type: SegmentType;
  
  /** Display name. */
  name: string;
  
  /** Slug for URL-friendly access. */
  slug: string;
  
  /** Filter criteria for this segment. */
  filter: SegmentFilter;
  
  /** Whether this segment is the default view. */
  isDefault: boolean;
  
  /** Display order. */
  sortOrder: number;
  
  /** Icon URL for segment tab. */
  iconUrl: string | null;
  
  /** Entry count for this segment. */
  entryCount: number;
  
  createdAt: string;
  updatedAt: string;
}

enum SegmentType {
  /** All entries across all ventures. */
  GLOBAL = 'global',
  /** Entries from a specific venture. */
  VENTURE = 'venture',
  /** Entries from a geographic region. */
  REGION = 'region',
  /** Entries from a specific membership tier. */
  TIER = 'tier',
  /** Entries from the user's friends list. */
  FRIENDS = 'friends',
  /** Entries matching a custom filter expression. */
  CUSTOM = 'custom',
}

interface SegmentFilter {
  /** Venture IDs to include. */
  ventureIds?: string[];
  /** Region codes to include. */
  regionCodes?: string[];
  /** Membership tier names to include. */
  tierNames?: string[];
  /** Minimum score threshold. */
  minScore?: number;
  /** Maximum score threshold. */
  maxScore?: number;
  /** Custom filter expression (evaluated server-side). */
  expression?: string;
  /** Tag-based filtering. */
  tags?: string[];
  /** User metadata field matching. */
  userMetadata?: Record<string, unknown>;
}
```

### CompositeScoreDefinition

Defines how multiple metrics combine into a single ranking score.

```typescript
interface CompositeScoreDefinition {
  /** Component metrics that make up the composite score. */
  components: CompositeComponent[];
  
  /** How to combine components. */
  aggregation: CompositeAggregation;
  
  /** Custom formula (JavaScript expression). Used when aggregation is 'formula'. */
  formula?: string;
  
  /** Final score precision (decimal places). */
  precision: number;
}

interface CompositeComponent {
  /** Metric identifier. */
  metricId: string;
  
  /** Display name for this component. */
  name: string;
  
  /** Weight for weighted aggregation (0-1, must sum to 1). */
  weight: number;
  
  /** Normalization strategy. */
  normalization: NormalizationStrategy;
  
  /** Sort direction for this component. */
  sortDirection: SortDirection;
  
  /** Min/max for normalization bounds (if using min-max normalization). */
  normalizationMin?: number;
  normalizationMax?: number;
}

enum CompositeAggregation {
  /** Weighted sum of normalized components. */
  WEIGHTED_SUM = 'weighted_sum',
  /** Weighted average. */
  WEIGHTED_AVERAGE = 'weighted_average',
  /** Custom formula expression. */
  FORMULA = 'formula',
  /** Geometric mean (good for multiplicative metrics). */
  GEOMETRIC_MEAN = 'geometric_mean',
  /** Harmonic mean (penalizes low outliers). */
  HARMONIC_MEAN = 'harmonic_mean',
}

enum NormalizationStrategy {
  /** No normalization, use raw values. */
  NONE = 'none',
  /** Min-max normalization to 0-1 range. */
  MIN_MAX = 'min_max',
  /** Z-score normalization. */
  Z_SCORE = 'z_score',
  /** Percentile rank (0-100). */
  PERCENTILE = 'percentile',
  /** Log transformation. */
  LOG = 'log',
}
```

### TieBreakRule

Configures how ties are resolved.

```typescript
interface TieBreakRule {
  /** Priority order (lower = applied first). */
  priority: number;
  
  /** Tie-break strategy. */
  strategy: TieBreakStrategy;
  
  /** For SECONDARY_METRIC: which metric to use. */
  metricId?: string;
  
  /** Sort direction for the tie-break metric. */
  sortDirection?: SortDirection;
}

enum TieBreakStrategy {
  /** First player to achieve the score ranks higher. */
  TIMESTAMP = 'timestamp',
  /** Use a secondary metric value. */
  SECONDARY_METRIC = 'secondary_metric',
  /** Random (deterministic seed per season). */
  RANDOM = 'random',
  /** More submissions ranks higher (rewards engagement). */
  SUBMISSION_COUNT = 'submission_count',
  /** Higher percentile improvement ranks higher. */
  IMPROVEMENT_RATE = 'improvement_rate',
  /** Allow ties (same rank assigned). */
  ALLOW_TIE = 'allow_tie',
}
```

### LeaderboardBan

Represents a ban on a user from participating in a leaderboard.

```typescript
interface LeaderboardBan {
  /** Unique ban ID. */
  id: string;
  
  /** Leaderboard the ban applies to. Null for platform-wide bans. */
  leaderboardId: string | null;
  
  /** Banned user ID. */
  userId: string;
  
  /** Ban type. */
  type: BanType;
  
  /** Reason for the ban (shown to user). */
  reason: string;
  
  /** Internal notes (admin only). */
  internalNotes: string | null;
  
  /** Evidence references (submission IDs, screenshots, etc). */
  evidence: string[];
  
  /** When the ban was issued. */
  issuedAt: string;
  
  /** When the ban expires (null for permanent). */
  expiresAt: string | null;
  
  /** Admin who issued the ban. */
  issuedBy: string;
  
  /** Whether an appeal has been submitted. */
  appealSubmitted: boolean;
  
  /** Appeal text if submitted. */
  appealText: string | null;
  
  /** Appeal decision. */
  appealDecision: AppealDecision | null;
  
  /** Appeal decided at. */
  appealDecidedAt: string | null;
  
  /** Appeal decided by. */
  appealDecidedBy: string | null;
  
  /** Whether the ban is currently active. */
  isActive: boolean;
  
  createdAt: string;
  updatedAt: string;
}

enum BanType {
  /** Full ban: user removed from board and cannot submit. */
  FULL = 'full',
  /** Shadowban: user can submit but scores are hidden from others. */
  SHADOWBAN = 'shadowban',
  /** Submission ban: user's existing score visible but cannot submit new scores. */
  SUBMISSION_BAN = 'submission_ban',
}

interface AppealDecision {
  /** Whether the appeal was approved (ban lifted) or denied. */
  approved: boolean;
  /** Reason for the decision. */
  reason: string;
  /** Whether to restore the user's scores. */
  restoreScores: boolean;
}
```

### RankSnapshot

Point-in-time capture of leaderboard rankings.

```typescript
interface RankSnapshot {
  /** Unique snapshot ID. */
  id: string;
  
  /** Leaderboard ID. */
  leaderboardId: string;
  
  /** Season ID (if applicable). */
  seasonId: string | null;
  
  /** Segment ID (if applicable). */
  segmentId: string | null;
  
  /** When the snapshot was taken. */
  takenAt: string;
  
  /** What triggered the snapshot (scheduled, manual, season_end). */
  trigger: SnapshotTrigger;
  
  /** Total entries at snapshot time. */
  totalEntries: number;
  
  /** Top entries captured in the snapshot. */
  entries: SnapshotEntry[];
  
  /** Statistics at snapshot time. */
  stats: LeaderboardStats;
}

interface SnapshotEntry {
  userId: string;
  rank: number;
  score: number;
  displayName: string;
}

enum SnapshotTrigger {
  SCHEDULED = 'scheduled',
  MANUAL = 'manual',
  SEASON_END = 'season_end',
  SEASON_START = 'season_start',
}
```

### LeaderboardDisplay

Configuration for how the leaderboard renders in the UI.

```typescript
interface LeaderboardDisplay {
  /** Number of entries per page. Default: 25. */
  pageSize: number;
  
  /** Number of entries to show in the "around me" view above. Default: 5. */
  aroundMeAbove: number;
  
  /** Number of entries to show in the "around me" view below. Default: 5. */
  aroundMeBelow: number;
  
  /** Whether to show rank change indicators (↑↓). */
  showRankDelta: boolean;
  
  /** Whether to show the user's percentile. */
  showPercentile: boolean;
  
  /** Whether to show tier badges. */
  showTierBadge: boolean;
  
  /** Tier definitions for percentile-based tiers. */
  tiers: TierDefinition[];
  
  /** Whether to show the country flag next to usernames. */
  showCountryFlag: boolean;
  
  /** Whether to show the user's avatar. */
  showAvatar: boolean;
  
  /** Whether to anonymize usernames (show "Player #X" instead). */
  anonymize: boolean;
  
  /** Custom columns to display from entry metadata. */
  customColumns: CustomColumn[];
  
  /** Header image URL. */
  headerImageUrl: string | null;
  
  /** Theme color (hex). */
  themeColor: string | null;
  
  /** CSS class override for custom styling. */
  cssClass: string | null;
  
  /** Format string for score display (e.g., "{score} pts", "{minutes}:{seconds}"). */
  scoreFormat: string;
  
  /** Number of decimal places for score display. */
  scoreDecimals: number;
}

interface TierDefinition {
  /** Tier name. */
  name: string;
  /** Minimum percentile for this tier (inclusive). */
  minPercentile: number;
  /** Maximum percentile for this tier (exclusive). */
  maxPercentile: number;
  /** Tier color (hex). */
  color: string;
  /** Tier icon URL. */
  iconUrl: string | null;
}

interface CustomColumn {
  /** Metadata key to display. */
  key: string;
  /** Column header label. */
  label: string;
  /** Display format. */
  format: 'text' | 'number' | 'duration' | 'date' | 'badge';
  /** Column width. */
  width: string;
  /** Sort order in the column list. */
  sortOrder: number;
}
```

---

## Database Schemas

All tables use Supabase PostgreSQL with Drizzle ORM for schema management. Multi-tenant isolation is enforced via Row-Level Security (RLS) policies.

### leaderboards table

```typescript
import { pgTable, text, varchar, integer, boolean, jsonb, timestamp, index } from 'drizzle-orm/pg-core';
import { ulid } from '../utils/ulid';

export const leaderboards = pgTable('leaderboards', {
  id:                  text('id').primaryKey().$defaultFn(ulid),
  ventureId:           text('venture_id').references(() => ventures.id, { onDelete: 'cascade' }),
  slug:                varchar('slug', { length: 128 }).notNull(),
  name:                varchar('name', { length: 256 }).notNull(),
  description:         text('description'),
  metric:              varchar('metric', { length: 64 }).notNull(),
  metricUnit:          varchar('metric_unit', { length: 32 }),
  sortDirection:       varchar('sort_direction', { length: 4 }).notNull().default('desc'),
  rankingAlgorithm:    varchar('ranking_algorithm', { length: 32 }).notNull().default('dense'),
  compositeScore:      jsonb('composite_score'),
  timePeriod:          varchar('time_period', { length: 16 }),
  resetSchedule:       varchar('reset_schedule', { length: 128 }),
  tieBreakRules:       jsonb('tie_break_rules').notNull().default('[]'),
  entryCriteria:       jsonb('entry_criteria').notNull().default('{}'),
  validationRules:     jsonb('validation_rules').notNull().default('[]'),
  antiCheatConfig:     jsonb('anti_cheat_config').notNull().default('{}'),
  display:             jsonb('display').notNull().default('{}'),
  visibility:          varchar('visibility', { length: 16 }).notNull().default('public'),
  maxEntries:          integer('max_entries'),
  rateLimit:           jsonb('rate_limit').notNull().default('{"maxPerMinute":10,"maxPerHour":100,"maxPerDay":1000,"cooldownSeconds":1}'),
  isFederated:         boolean('is_federated').notNull().default(false),
  tags:                jsonb('tags').notNull().default('[]'),
  metadata:            jsonb('metadata').notNull().default('{}'),
  entryCount:          integer('entry_count').notNull().default(0),
  status:              varchar('status', { length: 16 }).notNull().default('active'),
  createdAt:           timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt:           timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  ventureIdx:       index('leaderboards_venture_id_idx').on(table.ventureId),
  ventureSlugIdx:   index('leaderboards_venture_slug_idx').on(table.ventureId, table.slug).unique(),
  statusIdx:        index('leaderboards_status_idx').on(table.status),
  federatedIdx:     index('leaderboards_federated_idx').on(table.isFederated).where(sql`is_federated = true`),
}));
```

### leaderboard_entries table

```typescript
export const leaderboardEntries = pgTable('leaderboard_entries', {
  id:                text('id').primaryKey().$defaultFn(ulid),
  leaderboardId:     text('leaderboard_id').notNull().references(() => leaderboards.id, { onDelete: 'cascade' }),
  userId:            text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  seasonId:          text('season_id').references(() => leaderboardSeasons.id, { onDelete: 'set null' }),
  score:             doublePrecision('score').notNull().default(0),
  rank:              integer('rank').notNull().default(0),
  previousRank:      integer('previous_rank'),
  rankDelta:         integer('rank_delta').notNull().default(0),
  bestScore:         doublePrecision('best_score').notNull().default(0),
  bestRank:          integer('best_rank').notNull().default(0),
  submissionCount:   integer('submission_count').notNull().default(0),
  percentile:        doublePrecision('percentile').notNull().default(0),
  tier:              varchar('tier', { length: 32 }),
  rating:            doublePrecision('rating'),
  ratingDeviation:   doublePrecision('rating_deviation'),
  ratingVolatility:  doublePrecision('rating_volatility'),
  scoreSetAt:        timestamp('score_set_at', { withTimezone: true }).notNull().defaultNow(),
  firstSubmittedAt:  timestamp('first_submitted_at', { withTimezone: true }).notNull().defaultNow(),
  lastSubmittedAt:   timestamp('last_submitted_at', { withTimezone: true }).notNull().defaultNow(),
  segments:          jsonb('segments').notNull().default('[]'),
  metadata:          jsonb('metadata').notNull().default('{}'),
  createdAt:         timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt:         timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  boardUserIdx:      index('lb_entries_board_user_idx')
    .on(table.leaderboardId, table.userId, table.seasonId).unique(),
  boardRankIdx:      index('lb_entries_board_rank_idx')
    .on(table.leaderboardId, table.seasonId, table.rank),
  boardScoreIdx:     index('lb_entries_board_score_idx')
    .on(table.leaderboardId, table.seasonId, table.score),
  userIdx:           index('lb_entries_user_idx').on(table.userId),
  tierIdx:           index('lb_entries_tier_idx').on(table.leaderboardId, table.tier),
}));
```

### leaderboard_seasons table

```typescript
export const leaderboardSeasons = pgTable('leaderboard_seasons', {
  id:                  text('id').primaryKey().$defaultFn(ulid),
  leaderboardId:       text('leaderboard_id').notNull().references(() => leaderboards.id, { onDelete: 'cascade' }),
  seasonNumber:        integer('season_number').notNull(),
  name:                varchar('name', { length: 256 }).notNull(),
  description:         text('description'),
  status:              varchar('status', { length: 16 }).notNull().default('pending'),
  startsAt:            timestamp('starts_at', { withTimezone: true }).notNull(),
  endsAt:              timestamp('ends_at', { withTimezone: true }).notNull(),
  actualStartAt:       timestamp('actual_start_at', { withTimezone: true }),
  actualEndAt:         timestamp('actual_end_at', { withTimezone: true }),
  gracePeriodHours:    integer('grace_period_hours').notNull().default(0),
  entryCount:          integer('entry_count').notNull().default(0),
  autoCreateNext:      boolean('auto_create_next').notNull().default(false),
  nextSeasonDuration:  varchar('next_season_duration', { length: 32 }),
  carryOverDecay:      doublePrecision('carry_over_decay').notNull().default(0),
  preserveEntries:     boolean('preserve_entries').notNull().default(false),
  metadata:            jsonb('metadata').notNull().default('{}'),
  createdAt:           timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt:           timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  boardIdx:            index('lb_seasons_board_idx').on(table.leaderboardId),
  boardStatusIdx:      index('lb_seasons_board_status_idx').on(table.leaderboardId, table.status),
  boardNumberIdx:      index('lb_seasons_board_number_idx')
    .on(table.leaderboardId, table.seasonNumber).unique(),
  startsAtIdx:         index('lb_seasons_starts_at_idx').on(table.startsAt),
  endsAtIdx:           index('lb_seasons_ends_at_idx').on(table.endsAt),
}));
```

### leaderboard_rewards table

```typescript
export const leaderboardRewards = pgTable('leaderboard_rewards', {
  id:                  text('id').primaryKey().$defaultFn(ulid),
  leaderboardId:       text('leaderboard_id').notNull().references(() => leaderboards.id, { onDelete: 'cascade' }),
  seasonId:            text('season_id').references(() => leaderboardSeasons.id, { onDelete: 'set null' }),
  rewardType:          varchar('reward_type', { length: 32 }).notNull(),
  positions:           jsonb('positions'),
  positionStart:       integer('position_start'),
  positionEnd:         integer('position_end'),
  percentileMin:       doublePrecision('percentile_min'),
  percentileMax:       doublePrecision('percentile_max'),
  tierName:            varchar('tier_name', { length: 64 }),
  reward:              jsonb('reward').notNull(),
  displayName:         varchar('display_name', { length: 256 }).notNull(),
  displayDescription:  text('display_description'),
  iconUrl:             text('icon_url'),
  priority:            integer('priority').notNull().default(0),
  stackable:           boolean('stackable').notNull().default(false),
  createdAt:           timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt:           timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  boardIdx:            index('lb_rewards_board_idx').on(table.leaderboardId),
  boardSeasonIdx:      index('lb_rewards_board_season_idx').on(table.leaderboardId, table.seasonId),
  typeIdx:             index('lb_rewards_type_idx').on(table.rewardType),
}));
```

### score_submissions table

```typescript
export const scoreSubmissions = pgTable('score_submissions', {
  id:                text('id').primaryKey().$defaultFn(ulid),
  leaderboardId:     text('leaderboard_id').notNull().references(() => leaderboards.id, { onDelete: 'cascade' }),
  userId:            text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  seasonId:          text('season_id').references(() => leaderboardSeasons.id),
  score:             doublePrecision('score').notNull(),
  previousScore:     doublePrecision('previous_score'),
  scoreDelta:        doublePrecision('score_delta'),
  status:            varchar('status', { length: 16 }).notNull().default('pending'),
  validationResults: jsonb('validation_results').notNull().default('[]'),
  flagReason:        text('flag_reason'),
  reviewedBy:        text('reviewed_by'),
  reviewedAt:        timestamp('reviewed_at', { withTimezone: true }),
  reviewNotes:       text('review_notes'),
  resultRank:        integer('result_rank'),
  resultRankDelta:   integer('result_rank_delta'),
  ipAddress:         varchar('ip_address', { length: 45 }),
  userAgent:         text('user_agent'),
  sessionId:         text('session_id'),
  metadata:          jsonb('metadata').notNull().default('{}'),
  submittedAt:       timestamp('submitted_at', { withTimezone: true }).notNull().defaultNow(),
  processedAt:       timestamp('processed_at', { withTimezone: true }),
  createdAt:         timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  boardUserIdx:      index('score_sub_board_user_idx').on(table.leaderboardId, table.userId),
  boardStatusIdx:    index('score_sub_board_status_idx').on(table.leaderboardId, table.status),
  userIdx:           index('score_sub_user_idx').on(table.userId),
  submittedAtIdx:    index('score_sub_submitted_at_idx').on(table.submittedAt),
  flaggedIdx:        index('score_sub_flagged_idx')
    .on(table.leaderboardId, table.status)
    .where(sql`status = 'flagged'`),
}));

enum SubmissionStatus {
  PENDING = 'pending',
  ACCEPTED = 'accepted',
  REJECTED = 'rejected',
  FLAGGED = 'flagged',
  REVIEWED_ACCEPTED = 'reviewed_accepted',
  REVIEWED_REJECTED = 'reviewed_rejected',
}
```

### leaderboard_segments table

```typescript
export const leaderboardSegments = pgTable('leaderboard_segments', {
  id:              text('id').primaryKey().$defaultFn(ulid),
  leaderboardId:   text('leaderboard_id').notNull().references(() => leaderboards.id, { onDelete: 'cascade' }),
  type:            varchar('type', { length: 16 }).notNull(),
  name:            varchar('name', { length: 128 }).notNull(),
  slug:            varchar('slug', { length: 128 }).notNull(),
  filter:          jsonb('filter').notNull().default('{}'),
  isDefault:       boolean('is_default').notNull().default(false),
  sortOrder:       integer('sort_order').notNull().default(0),
  iconUrl:         text('icon_url'),
  entryCount:      integer('entry_count').notNull().default(0),
  createdAt:       timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt:       timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  boardIdx:        index('lb_segments_board_idx').on(table.leaderboardId),
  boardSlugIdx:    index('lb_segments_board_slug_idx')
    .on(table.leaderboardId, table.slug).unique(),
  typeIdx:         index('lb_segments_type_idx').on(table.type),
}));
```

### rank_snapshots table

```typescript
export const rankSnapshots = pgTable('rank_snapshots', {
  id:              text('id').primaryKey().$defaultFn(ulid),
  leaderboardId:   text('leaderboard_id').notNull().references(() => leaderboards.id, { onDelete: 'cascade' }),
  seasonId:        text('season_id').references(() => leaderboardSeasons.id),
  segmentId:       text('segment_id').references(() => leaderboardSegments.id),
  takenAt:         timestamp('taken_at', { withTimezone: true }).notNull().defaultNow(),
  trigger:         varchar('trigger', { length: 16 }).notNull(),
  totalEntries:    integer('total_entries').notNull(),
  entries:         jsonb('entries').notNull(),
  stats:           jsonb('stats').notNull(),
  createdAt:       timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  boardIdx:        index('rank_snap_board_idx').on(table.leaderboardId),
  boardTakenIdx:   index('rank_snap_board_taken_idx').on(table.leaderboardId, table.takenAt),
  triggerIdx:      index('rank_snap_trigger_idx').on(table.trigger),
}));
```

### leaderboard_bans table

```typescript
export const leaderboardBans = pgTable('leaderboard_bans', {
  id:                text('id').primaryKey().$defaultFn(ulid),
  leaderboardId:     text('leaderboard_id').references(() => leaderboards.id, { onDelete: 'cascade' }),
  userId:            text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  type:              varchar('type', { length: 16 }).notNull().default('full'),
  reason:            text('reason').notNull(),
  internalNotes:     text('internal_notes'),
  evidence:          jsonb('evidence').notNull().default('[]'),
  issuedAt:          timestamp('issued_at', { withTimezone: true }).notNull().defaultNow(),
  expiresAt:         timestamp('expires_at', { withTimezone: true }),
  issuedBy:          text('issued_by').notNull().references(() => users.id),
  appealSubmitted:   boolean('appeal_submitted').notNull().default(false),
  appealText:        text('appeal_text'),
  appealDecision:    jsonb('appeal_decision'),
  appealDecidedAt:   timestamp('appeal_decided_at', { withTimezone: true }),
  appealDecidedBy:   text('appeal_decided_by').references(() => users.id),
  isActive:          boolean('is_active').notNull().default(true),
  createdAt:         timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt:         timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  boardUserIdx:      index('lb_bans_board_user_idx')
    .on(table.leaderboardId, table.userId),
  userIdx:           index('lb_bans_user_idx').on(table.userId),
  activeIdx:         index('lb_bans_active_idx')
    .on(table.leaderboardId, table.isActive)
    .where(sql`is_active = true`),
  expiresIdx:        index('lb_bans_expires_idx').on(table.expiresAt),
}));
```

### Row-Level Security Policies

All tables enforce multi-tenant isolation via Supabase RLS. Key policies:

```sql
-- Leaderboards: users see boards from their ventures + public federated boards
ALTER TABLE leaderboards ENABLE ROW LEVEL SECURITY;

CREATE POLICY "leaderboards_tenant_isolation" ON leaderboards
  FOR SELECT
  USING (
    venture_id IN (
      SELECT venture_id FROM venture_members
      WHERE user_id = auth.uid()
    )
    OR (is_federated = true AND visibility = 'public')
  );

CREATE POLICY "leaderboards_admin_manage" ON leaderboards
  FOR ALL
  USING (
    venture_id IN (
      SELECT venture_id FROM venture_members
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    )
  );

-- Entries: users see entries on boards they can see
ALTER TABLE leaderboard_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "lb_entries_read" ON leaderboard_entries
  FOR SELECT
  USING (
    leaderboard_id IN (
      SELECT id FROM leaderboards
      WHERE venture_id IN (
        SELECT venture_id FROM venture_members
        WHERE user_id = auth.uid()
      )
      OR (is_federated = true AND visibility = 'public')
    )
  );

CREATE POLICY "lb_entries_own" ON leaderboard_entries
  FOR SELECT
  USING (user_id = auth.uid());

-- Score submissions: users see only their own submissions
ALTER TABLE score_submissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "score_sub_own" ON score_submissions
  FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "score_sub_admin" ON score_submissions
  FOR ALL
  USING (
    leaderboard_id IN (
      SELECT l.id FROM leaderboards l
      JOIN venture_members vm ON l.venture_id = vm.venture_id
      WHERE vm.user_id = auth.uid() AND vm.role IN ('owner', 'admin')
    )
  );

-- Bans: banned users can see their own bans; admins see all
ALTER TABLE leaderboard_bans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "lb_bans_own" ON leaderboard_bans
  FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "lb_bans_admin" ON leaderboard_bans
  FOR ALL
  USING (
    leaderboard_id IN (
      SELECT l.id FROM leaderboards l
      JOIN venture_members vm ON l.venture_id = vm.venture_id
      WHERE vm.user_id = auth.uid() AND vm.role IN ('owner', 'admin')
    )
    OR leaderboard_id IS NULL  -- platform-wide bans: platform admins only
  );

-- Shadowban handling: entries from shadowbanned users are hidden from others
CREATE POLICY "lb_entries_shadowban" ON leaderboard_entries
  FOR SELECT
  USING (
    user_id = auth.uid()
    OR NOT EXISTS (
      SELECT 1 FROM leaderboard_bans
      WHERE leaderboard_bans.leaderboard_id = leaderboard_entries.leaderboard_id
        AND leaderboard_bans.user_id = leaderboard_entries.user_id
        AND leaderboard_bans.type = 'shadowban'
        AND leaderboard_bans.is_active = true
    )
  );
```

---

## Code Examples

### 1 — Creating a Leaderboard with Seasons

```typescript
import { LeaderboardService } from '@mcv/engagement/leaderboards';
import {
  RankingAlgorithm,
  SortDirection,
  TimePeriod,
  TieBreakStrategy,
  LeaderboardVisibility,
} from '@mcv/engagement/leaderboards';

// Inject the service (available via module DI container)
const leaderboardService = container.resolve(LeaderboardService);

// Create a seasonal points leaderboard with auto-reset
const leaderboard = await leaderboardService.create({
  ventureId: 'venture_01HXYZ...',
  slug: 'weekly-points',
  name: 'Weekly Points Challenge',
  description: 'Compete for the most points each week. Top performers earn exclusive rewards!',
  metric: 'points',
  metricUnit: 'pts',
  sortDirection: SortDirection.DESC,
  rankingAlgorithm: RankingAlgorithm.DENSE,
  timePeriod: TimePeriod.WEEKLY,
  
  // Tie-break: first to achieve the score wins, then by total submissions
  tieBreakRules: [
    { priority: 1, strategy: TieBreakStrategy.TIMESTAMP },
    { priority: 2, strategy: TieBreakStrategy.SUBMISSION_COUNT },
  ],
  
  // Entry criteria: must be at least level 5
  entryCriteria: {
    minLevel: 5,
  },
  
  // Score validation
  validationRules: [
    {
      type: 'range',
      enabled: true,
      priority: 1,
      params: { min: 0, max: 100000 },
    },
    {
      type: 'rate',
      enabled: true,
      priority: 2,
      params: { maxPerHour: 5000, maxPerDay: 20000 },
    },
    {
      type: 'statistical',
      enabled: true,
      priority: 3,
      params: { maxStdDeviations: 4, minSamples: 50 },
    },
  ],
  
  // Anti-cheat
  antiCheatConfig: {
    anomalyDetectionEnabled: true,
    anomalyThreshold: 3.5,
    minSamplesForAnalysis: 100,
    maxImprovementPercent: 200,
    holdForReview: true,
    shadowbanEnabled: true,
  },
  
  // Display
  display: {
    pageSize: 25,
    aroundMeAbove: 5,
    aroundMeBelow: 5,
    showRankDelta: true,
    showPercentile: true,
    showTierBadge: true,
    showCountryFlag: true,
    showAvatar: true,
    anonymize: false,
    scoreFormat: '{score} pts',
    scoreDecimals: 0,
    tiers: [
      { name: 'Diamond', minPercentile: 99, maxPercentile: 100, color: '#b9f2ff', iconUrl: '/tiers/diamond.svg' },
      { name: 'Platinum', minPercentile: 95, maxPercentile: 99, color: '#e5e4e2', iconUrl: '/tiers/platinum.svg' },
      { name: 'Gold', minPercentile: 85, maxPercentile: 95, color: '#ffd700', iconUrl: '/tiers/gold.svg' },
      { name: 'Silver', minPercentile: 70, maxPercentile: 85, color: '#c0c0c0', iconUrl: '/tiers/silver.svg' },
      { name: 'Bronze', minPercentile: 50, maxPercentile: 70, color: '#cd7f32', iconUrl: '/tiers/bronze.svg' },
    ],
    customColumns: [],
    headerImageUrl: null,
    themeColor: '#6c5ce7',
    cssClass: null,
  },
  
  visibility: LeaderboardVisibility.MEMBERS,
  rateLimit: {
    maxPerMinute: 5,
    maxPerHour: 50,
    maxPerDay: 200,
    cooldownSeconds: 3,
  },
  tags: ['weekly', 'points', 'competitive'],
});

// Create the first season
const season = await leaderboardService.createSeason({
  leaderboardId: leaderboard.id,
  name: 'Season 1: Grand Opening',
  description: 'The inaugural weekly challenge!',
  startsAt: new Date('2026-02-09T00:00:00Z'),
  endsAt: new Date('2026-02-16T00:00:00Z'),
  gracePeriodHours: 2,
  autoCreateNext: true,
  nextSeasonDuration: 'P7D', // ISO 8601: 7 days
  carryOverDecay: 0, // No score carry-over
  preserveEntries: false,
});

console.log(`Created leaderboard: ${leaderboard.name} (${leaderboard.slug})`);
console.log(`Season ${season.seasonNumber}: ${season.name}`);
console.log(`  Starts: ${season.startsAt}`);
console.log(`  Ends: ${season.endsAt}`);
// Created leaderboard: Weekly Points Challenge (weekly-points)
// Season 1: Season 1: Grand Opening
//   Starts: 2026-02-09T00:00:00.000Z
//   Ends: 2026-02-16T00:00:00.000Z
```

### 2 — Submitting Scores with Validation

```typescript
import { LeaderboardService } from '@mcv/engagement/leaderboards';
import { LeaderboardError, ErrorCode } from '@mcv/engagement/leaderboards';

const leaderboardService = container.resolve(LeaderboardService);

// ─── Simple score submission ─────────────────────────────────────
try {
  const result = await leaderboardService.submitScore({
    leaderboardId: 'lb_01HXYZ...',
    userId: 'user_01HABC...',
    score: 4250,
    metadata: {
      source: 'quest_completion',
      questId: 'quest_42',
      bonusMultiplier: 1.5,
    },
  });

  if (result.accepted) {
    console.log(`Score accepted! New rank: #${result.entry.rank}`);
    console.log(`  Score: ${result.entry.score}`);
    console.log(`  Rank change: ${result.entry.rankDelta > 0 ? '+' : ''}${result.entry.rankDelta}`);
    console.log(`  Percentile: ${result.entry.percentile.toFixed(1)}%`);
  } else {
    console.log(`Score rejected: ${result.reason}`);
    console.log(`  Status: ${result.submission.status}`);
  }
} catch (error) {
  if (error instanceof LeaderboardError) {
    switch (error.code) {
      case ErrorCode.RATE_LIMITED:
        console.log(`Rate limited. Try again in ${error.retryAfterSeconds}s`);
        break;
      case ErrorCode.USER_BANNED:
        console.log(`Banned from this leaderboard: ${error.message}`);
        break;
      case ErrorCode.SEASON_NOT_ACTIVE:
        console.log('No active season for this leaderboard');
        break;
      case ErrorCode.ENTRY_CRITERIA_NOT_MET:
        console.log(`Entry criteria not met: ${error.details.criteria}`);
        break;
      default:
        throw error;
    }
  }
}

// ─── Incremental score update ────────────────────────────────────
// For cumulative boards where scores add up over time
const incrementResult = await leaderboardService.incrementScore(
  'lb_01HXYZ...',
  'user_01HABC...',
  150, // Add 150 points
  { source: 'daily_login_bonus' }
);
console.log(`New total: ${incrementResult.entry.score}`);

// ─── Bulk submission (admin/system) ──────────────────────────────
// Import scores from an external system
const bulkResult = await leaderboardService.submitScoresBulk(
  'lb_01HXYZ...',
  [
    { userId: 'user_01A...', score: 1000, metadata: { source: 'import' } },
    { userId: 'user_01B...', score: 2500, metadata: { source: 'import' } },
    { userId: 'user_01C...', score: 1750, metadata: { source: 'import' } },
    // ... hundreds more
  ]
);

console.log(`Bulk results:`);
console.log(`  Accepted: ${bulkResult.accepted}`);
console.log(`  Rejected: ${bulkResult.rejected}`);
console.log(`  Flagged: ${bulkResult.flagged}`);
if (bulkResult.errors.length > 0) {
  console.log(`  Errors:`);
  for (const err of bulkResult.errors) {
    console.log(`    User ${err.userId}: ${err.reason}`);
  }
}
```

### 3 — Querying Rankings with Around-Me

```typescript
import { LeaderboardService } from '@mcv/engagement/leaderboards';

const leaderboardService = container.resolve(LeaderboardService);
const boardId = 'lb_01HXYZ...';

// ─── Top entries (paginated) ─────────────────────────────────────
const top = await leaderboardService.getTopEntries(boardId, {
  limit: 10,
  offset: 0,
});

console.log(`Top 10 of ${top.total}:`);
for (const entry of top.items) {
  const delta = entry.rankDelta > 0 ? `↑${entry.rankDelta}` :
                entry.rankDelta < 0 ? `↓${Math.abs(entry.rankDelta)}` : '—';
  console.log(
    `  #${entry.rank} ${entry.userProfile?.displayName ?? 'Unknown'} — ` +
    `${entry.score.toLocaleString()} pts (${delta}) [${entry.tier ?? 'Unranked'}]`
  );
}
// Top 10 of 15,234:
//   #1 xProGamer — 98,450 pts (—) [Diamond]
//   #2 NightOwl42 — 95,200 pts (↑2) [Diamond]
//   #3 ChallengeKing — 94,800 pts (↓1) [Diamond]
//   ...

// ─── Around-me view ──────────────────────────────────────────────
const aroundMe = await leaderboardService.getAroundMe(
  boardId,
  'user_01HABC...',
  { above: 5, below: 5 }
);

console.log(`\nYour position: #${aroundMe.me.rank} of ${aroundMe.totalEntries}`);
console.log('---');
for (const entry of aroundMe.above) {
  console.log(`  #${entry.rank} ${entry.userProfile?.displayName} — ${entry.score}`);
}
console.log(`→ #${aroundMe.me.rank} YOU — ${aroundMe.me.score}`);
for (const entry of aroundMe.below) {
  console.log(`  #${entry.rank} ${entry.userProfile?.displayName} — ${entry.score}`);
}
// Your position: #1,247 of 15,234
// ---
//   #1242 SpeedRunner — 4,300
//   #1243 QuestHero — 4,290
//   #1244 StarPlayer — 4,275
//   #1245 LuckyDice — 4,260
//   #1246 MidnightWolf — 4,255
// → #1247 YOU — 4,250
//   #1248 CoolBreeze — 4,240
//   #1249 PhoenixRise — 4,230
//   #1250 ThunderBolt — 4,220
//   #1251 OceanWave — 4,210
//   #1252 MountainClimb — 4,200

// ─── User's entry with percentile ───────────────────────────────
const myEntry = await leaderboardService.getUserEntry(
  boardId,
  'user_01HABC...'
);

if (myEntry) {
  console.log(`\nYour stats:`);
  console.log(`  Rank: #${myEntry.rank}`);
  console.log(`  Score: ${myEntry.score}`);
  console.log(`  Best ever: ${myEntry.bestScore} (#${myEntry.bestRank})`);
  console.log(`  Percentile: ${myEntry.percentile.toFixed(1)}%`);
  console.log(`  Tier: ${myEntry.tier}`);
  console.log(`  Submissions: ${myEntry.submissionCount}`);
}

// ─── Friends-only view ───────────────────────────────────────────
const friendsBoard = await leaderboardService.getFriendsLeaderboard(
  boardId,
  'user_01HABC...',
  { limit: 20 }
);

console.log(`\nFriends leaderboard:`);
for (const entry of friendsBoard) {
  console.log(`  #${entry.rank} ${entry.userProfile?.displayName} — ${entry.score}`);
}

// ─── Segmented view (by region) ──────────────────────────────────
const segments = await leaderboardService.listSegments(boardId);
const naSegment = segments.find(s => s.slug === 'north-america');

if (naSegment) {
  const regional = await leaderboardService.getTopEntries(boardId, {
    segmentId: naSegment.id,
    limit: 10,
  });
  console.log(`\nNorth America Top 10 (${regional.total} entries):`);
  for (const entry of regional.items) {
    console.log(`  #${entry.rank} ${entry.userProfile?.displayName} — ${entry.score}`);
  }
}
```

### 4 — Configuring Composite Scores

```typescript
import { LeaderboardService } from '@mcv/engagement/leaderboards';
import {
  CompositeAggregation,
  NormalizationStrategy,
  SortDirection,
  RankingAlgorithm,
} from '@mcv/engagement/leaderboards';

const leaderboardService = container.resolve(LeaderboardService);

// Create a composite leaderboard that ranks players by a combination of:
// - Kill/Death ratio (40% weight)
// - Win rate (35% weight)
// - Average score per match (25% weight)
const compositeBoard = await leaderboardService.create({
  ventureId: 'venture_01HXYZ...',
  slug: 'pvp-overall-rating',
  name: 'PvP Overall Rating',
  description: 'Combined rating based on K/D ratio, win rate, and match score.',
  metric: 'composite_rating',
  metricUnit: 'rating',
  sortDirection: SortDirection.DESC,
  rankingAlgorithm: RankingAlgorithm.DENSE,
  
  compositeScore: {
    components: [
      {
        metricId: 'kd_ratio',
        name: 'Kill/Death Ratio',
        weight: 0.40,
        normalization: NormalizationStrategy.MIN_MAX,
        sortDirection: SortDirection.DESC,
        normalizationMin: 0,
        normalizationMax: 10, // Cap K/D at 10 for normalization
      },
      {
        metricId: 'win_rate',
        name: 'Win Rate',
        weight: 0.35,
        normalization: NormalizationStrategy.NONE, // Already 0-1
        sortDirection: SortDirection.DESC,
      },
      {
        metricId: 'avg_match_score',
        name: 'Avg Match Score',
        weight: 0.25,
        normalization: NormalizationStrategy.Z_SCORE,
        sortDirection: SortDirection.DESC,
      },
    ],
    aggregation: CompositeAggregation.WEIGHTED_SUM,
    precision: 4,
  },
  
  display: {
    pageSize: 25,
    aroundMeAbove: 5,
    aroundMeBelow: 5,
    showRankDelta: true,
    showPercentile: true,
    showTierBadge: true,
    showCountryFlag: false,
    showAvatar: true,
    anonymize: false,
    scoreFormat: '{score}',
    scoreDecimals: 2,
    tiers: [
      { name: 'Grandmaster', minPercentile: 99.5, maxPercentile: 100, color: '#ff4500', iconUrl: '/tiers/grandmaster.svg' },
      { name: 'Master', minPercentile: 97, maxPercentile: 99.5, color: '#9b59b6', iconUrl: '/tiers/master.svg' },
      { name: 'Diamond', minPercentile: 90, maxPercentile: 97, color: '#3498db', iconUrl: '/tiers/diamond.svg' },
      { name: 'Gold', minPercentile: 75, maxPercentile: 90, color: '#f1c40f', iconUrl: '/tiers/gold.svg' },
      { name: 'Silver', minPercentile: 50, maxPercentile: 75, color: '#95a5a6', iconUrl: '/tiers/silver.svg' },
      { name: 'Bronze', minPercentile: 25, maxPercentile: 50, color: '#cd6133', iconUrl: '/tiers/bronze.svg' },
      { name: 'Iron', minPercentile: 0, maxPercentile: 25, color: '#7f8c8d', iconUrl: '/tiers/iron.svg' },
    ],
    customColumns: [
      { key: 'kd_ratio', label: 'K/D', format: 'number', width: '60px', sortOrder: 1 },
      { key: 'win_rate', label: 'Win %', format: 'number', width: '60px', sortOrder: 2 },
      { key: 'matches_played', label: 'Matches', format: 'number', width: '70px', sortOrder: 3 },
    ],
    headerImageUrl: null,
    themeColor: '#e74c3c',
    cssClass: null,
  },
  
  entryCriteria: {
    minLevel: 10,
    customCriteria: 'user.matchesPlayed >= 20', // Minimum 20 matches to rank
  },
  
  validationRules: [],
  antiCheatConfig: {
    anomalyDetectionEnabled: true,
    anomalyThreshold: 4.0,
    minSamplesForAnalysis: 200,
    maxImprovementPercent: null,
    holdForReview: true,
    shadowbanEnabled: true,
  },
  
  visibility: 'public',
  rateLimit: { maxPerMinute: 10, maxPerHour: 60, maxPerDay: 300, cooldownSeconds: 1 },
  tags: ['pvp', 'competitive', 'composite'],
});

// Submit composite score components
// The composite engine calculates the final weighted score
await leaderboardService.submitScore({
  leaderboardId: compositeBoard.id,
  userId: 'user_01HABC...',
  score: 0, // Ignored for composite — calculated from components
  metadata: {
    kd_ratio: 2.5,
    win_rate: 0.62,
    avg_match_score: 1450,
    matches_played: 247,
  },
});

// ─── Formula-based composite scoring ─────────────────────────────
const formulaBoard = await leaderboardService.create({
  ventureId: 'venture_01HXYZ...',
  slug: 'efficiency-rating',
  name: 'Efficiency Rating',
  metric: 'efficiency',
  metricUnit: 'eff',
  sortDirection: SortDirection.DESC,
  rankingAlgorithm: RankingAlgorithm.DENSE,
  
  compositeScore: {
    components: [
      { metricId: 'damage_dealt', name: 'Damage', weight: 1, normalization: NormalizationStrategy.NONE, sortDirection: SortDirection.DESC },
      { metricId: 'time_alive', name: 'Time Alive', weight: 1, normalization: NormalizationStrategy.NONE, sortDirection: SortDirection.DESC },
      { metricId: 'resources_used', name: 'Resources', weight: 1, normalization: NormalizationStrategy.NONE, sortDirection: SortDirection.ASC },
    ],
    aggregation: CompositeAggregation.FORMULA,
    // Custom formula: efficiency = (damage * time_alive) / (resources + 1)
    formula: '(damage_dealt * time_alive) / (resources_used + 1)',
    precision: 2,
  },
  
  display: {
    pageSize: 25,
    aroundMeAbove: 5,
    aroundMeBelow: 5,
    showRankDelta: true,
    showPercentile: false,
    showTierBadge: false,
    showCountryFlag: false,
    showAvatar: true,
    anonymize: false,
    scoreFormat: '{score} eff',
    scoreDecimals: 2,
    tiers: [],
    customColumns: [],
    headerImageUrl: null,
    themeColor: null,
    cssClass: null,
  },
  
  entryCriteria: {},
  validationRules: [],
  antiCheatConfig: {
    anomalyDetectionEnabled: false,
    anomalyThreshold: 3,
    minSamplesForAnalysis: 50,
    maxImprovementPercent: null,
    holdForReview: false,
    shadowbanEnabled: false,
  },
  visibility: 'members',
  rateLimit: { maxPerMinute: 10, maxPerHour: 100, maxPerDay: 500, cooldownSeconds: 1 },
  tags: ['efficiency'],
});
```

### 5 — Setting Up Season Rewards

```typescript
import { LeaderboardService } from '@mcv/engagement/leaderboards';
import { RewardType } from '@mcv/engagement/leaderboards';

const leaderboardService = container.resolve(LeaderboardService);
const boardId = 'lb_01HXYZ...';
const seasonId = 'season_01HABC...';

// Configure tiered rewards for the season
const rewards = await leaderboardService.configureRewards(boardId, [
  // 1st place: Legendary reward package
  {
    rewardType: RewardType.POSITION,
    positions: [1],
    displayName: '🏆 Champion',
    displayDescription: 'The undisputed champion receives legendary rewards.',
    iconUrl: '/rewards/champion-crown.svg',
    priority: 100,
    stackable: false,
    seasonId,
    reward: {
      points: 10000,
      currency: { amount: 500, currencyId: 'gems' },
      badge: { badgeId: 'season_champion' },
      title: { titleText: 'Season Champion', titleColor: '#ffd700' },
      items: [
        { itemId: 'legendary_chest', quantity: 3 },
        { itemId: 'champion_frame', quantity: 1 },
      ],
    },
  },
  
  // 2nd-3rd place: Epic rewards
  {
    rewardType: RewardType.POSITION_RANGE,
    positionStart: 2,
    positionEnd: 3,
    displayName: '🥈🥉 Podium Finish',
    displayDescription: 'Runner-up rewards for the podium finishers.',
    iconUrl: '/rewards/podium.svg',
    priority: 90,
    stackable: false,
    seasonId,
    reward: {
      points: 5000,
      currency: { amount: 250, currencyId: 'gems' },
      badge: { badgeId: 'season_podium' },
      items: [
        { itemId: 'epic_chest', quantity: 2 },
      ],
    },
  },
  
  // Top 10: Rare rewards
  {
    rewardType: RewardType.POSITION_RANGE,
    positionStart: 4,
    positionEnd: 10,
    displayName: '⭐ Top 10 Elite',
    displayDescription: 'Top 10 finishers earn elite rewards.',
    iconUrl: '/rewards/elite-star.svg',
    priority: 80,
    stackable: false,
    seasonId,
    reward: {
      points: 2500,
      currency: { amount: 100, currencyId: 'gems' },
      items: [
        { itemId: 'rare_chest', quantity: 1 },
      ],
    },
  },
  
  // Top 10%: Percentile reward
  {
    rewardType: RewardType.PERCENTILE,
    percentileMin: 90,
    percentileMax: 100,
    displayName: '💎 Diamond Tier',
    displayDescription: 'Top 10% of all competitors.',
    iconUrl: '/rewards/diamond.svg',
    priority: 70,
    stackable: true,
    seasonId,
    reward: {
      points: 1000,
      badge: { badgeId: 'season_diamond' },
    },
  },
  
  // Top 25%: Gold tier
  {
    rewardType: RewardType.PERCENTILE,
    percentileMin: 75,
    percentileMax: 90,
    displayName: '🥇 Gold Tier',
    displayDescription: 'Top 25% of all competitors.',
    iconUrl: '/rewards/gold.svg',
    priority: 60,
    stackable: true,
    seasonId,
    reward: {
      points: 500,
      badge: { badgeId: 'season_gold' },
    },
  },
  
  // Top 50%: Silver tier
  {
    rewardType: RewardType.PERCENTILE,
    percentileMin: 50,
    percentileMax: 75,
    displayName: '🥈 Silver Tier',
    displayDescription: 'Top half of all competitors.',
    iconUrl: '/rewards/silver.svg',
    priority: 50,
    stackable: true,
    seasonId,
    reward: {
      points: 250,
      badge: { badgeId: 'season_silver' },
    },
  },
  
  // Participation reward: everyone who submitted at least once
  {
    rewardType: RewardType.PARTICIPATION,
    displayName: '🎮 Participant',
    displayDescription: 'Thanks for competing this season!',
    iconUrl: '/rewards/participant.svg',
    priority: 10,
    stackable: true,
    seasonId,
    reward: {
      points: 100,
      items: [
        { itemId: 'common_chest', quantity: 1 },
      ],
    },
  },
  
  // Streak bonus: submitted every day of the season
  {
    rewardType: RewardType.STREAK,
    displayName: '🔥 Dedication Award',
    displayDescription: 'Submitted a score every single day of the season.',
    iconUrl: '/rewards/streak-flame.svg',
    priority: 75,
    stackable: true,
    seasonId,
    reward: {
      points: 2000,
      badge: { badgeId: 'season_dedicated' },
      title: { titleText: 'Dedicated', titleColor: '#e74c3c' },
    },
  },
]);

console.log(`Configured ${rewards.length} reward tiers for season.`);

// Preview what the distribution would look like with current standings
const preview = await leaderboardService.previewRewards(boardId, seasonId);
console.log('\nReward distribution preview:');
for (const item of preview) {
  console.log(`  ${item.displayName}: ${item.recipientCount} recipients`);
  console.log(`    Total points: ${item.totalPoints}`);
  console.log(`    Total gems: ${item.totalCurrency}`);
}

// When the season ends, distribute rewards
// (This happens automatically if `autoDistributeRewards` is set on the season,
//  but can also be triggered manually)
const endResult = await leaderboardService.endSeason(boardId, seasonId, {
  distributeRewards: true,
  autoCreateNext: true,
});

console.log(`\nSeason ended:`);
console.log(`  Final entry count: ${endResult.finalEntryCount}`);
console.log(`  Rewards distributed to ${endResult.rewardsDistributed} users`);
console.log(`  Next season created: ${endResult.nextSeason?.name ?? 'none'}`);
```

### 6 — Real-Time WebSocket Subscriptions

```typescript
import { LeaderboardWSEvents } from '@mcv/engagement/leaderboards';

// ─── Server-side: WebSocket handler setup ────────────────────────
import { LeaderboardWSHandler } from '@mcv/engagement/leaderboards';

const wsHandler = container.resolve(LeaderboardWSHandler);

// Register with your WebSocket server (e.g., ws, Socket.IO, etc.)
wss.on('connection', (socket, request) => {
  const userId = authenticateSocket(request); // Your auth logic
  
  socket.on('message', (data) => {
    const message = JSON.parse(data.toString());
    
    switch (message.type) {
      case 'subscribe:leaderboard':
        wsHandler.subscribe(socket, {
          leaderboardId: message.leaderboardId,
          userId,
          segmentId: message.segmentId,
          // Subscribe to specific event types
          events: message.events ?? ['rank:self', 'board:top', 'season:ending'],
        });
        break;
        
      case 'unsubscribe:leaderboard':
        wsHandler.unsubscribe(socket, message.leaderboardId);
        break;
    }
  });
  
  socket.on('close', () => {
    wsHandler.disconnected(socket);
  });
});

// ─── Client-side: Subscribing to real-time updates ───────────────
// (Example using a generic WebSocket client)
const ws = new WebSocket('wss://api.mcv.one/ws');

ws.onopen = () => {
  // Authenticate
  ws.send(JSON.stringify({
    type: 'auth',
    token: 'eyJhbGciOiJIUzI1NiIs...',
  }));
  
  // Subscribe to a leaderboard
  ws.send(JSON.stringify({
    type: 'subscribe:leaderboard',
    leaderboardId: 'lb_01HXYZ...',
    events: ['rank:self', 'board:top', 'season:ending', 'season:ended'],
  }));
};

ws.onmessage = (event) => {
  const message = JSON.parse(event.data);
  
  switch (message.type) {
    case LeaderboardWSEvents.RANK_SELF:
      // Your own rank changed
      console.log(`Your rank: #${message.rank} (was #${message.oldRank})`);
      console.log(`Score: ${message.score}, Percentile: ${message.percentile}%`);
      
      // Update UI
      updateMyRankDisplay({
        rank: message.rank,
        score: message.score,
        delta: message.delta,
        percentile: message.percentile,
      });
      break;
      
    case LeaderboardWSEvents.BOARD_TOP:
      // Top positions changed
      console.log('Top board updated:');
      for (const entry of message.entries) {
        console.log(`  #${entry.rank} ${entry.displayName} — ${entry.score}`);
      }
      
      // Re-render top of leaderboard
      updateTopBoardDisplay(message.entries);
      break;
      
    case LeaderboardWSEvents.RANK_UPDATED:
      // Another player's rank changed (visible in your current view)
      console.log(`${message.displayName} moved to #${message.newRank}`);
      
      // Animate rank change in the visible list
      animateRankChange(message.userId, message.oldRank, message.newRank);
      break;
      
    case LeaderboardWSEvents.SEASON_ENDING:
      // Season is about to end
      console.log(`Season ending in ${message.endsIn}!`);
      showCountdownBanner(message.endsIn);
      break;
      
    case LeaderboardWSEvents.SEASON_ENDED:
      // Season has concluded
      console.log('Season ended! Final rankings:');
      showSeasonEndModal(message.finalRankings);
      break;
      
    case LeaderboardWSEvents.REWARD_EARNED:
      // You earned a reward from the leaderboard
      console.log(`🎉 Reward earned: ${message.displayName}`);
      showRewardNotification(message);
      break;
  }
};

// ─── Server-side: Publishing events (internal) ───────────────────
// The LeaderboardService does this automatically, but you can also publish custom events
import { RedisPubSub } from '@mcv/engagement/leaderboards';

const pubsub = container.resolve(RedisPubSub);

// Publish a custom announcement to all subscribers of a leaderboard
await pubsub.publish(`leaderboard:${boardId}:announcement`, {
  type: 'announcement',
  title: 'Double Points Weekend!',
  message: 'All scores are doubled this weekend. Compete now!',
  expiresAt: new Date('2026-02-10T23:59:59Z').toISOString(),
});
```

### 7 — Cross-Venture Federation

```typescript
import { LeaderboardService } from '@mcv/engagement/leaderboards';
import { RankingAlgorithm, SortDirection, LeaderboardVisibility } from '@mcv/engagement/leaderboards';

const leaderboardService = container.resolve(LeaderboardService);

// ─── Create a platform-level federated leaderboard ───────────────
// This leaderboard aggregates scores across multiple ventures
const federatedBoard = await leaderboardService.create({
  ventureId: null, // Platform-level, not venture-owned
  slug: 'platform-weekly-stars',
  name: 'MCV.ONE Weekly Stars',
  description: 'The best performers across all ventures on the platform.',
  metric: 'stars',
  metricUnit: '⭐',
  sortDirection: SortDirection.DESC,
  rankingAlgorithm: RankingAlgorithm.DENSE,
  isFederated: true,
  visibility: LeaderboardVisibility.PUBLIC,
  
  display: {
    pageSize: 50,
    aroundMeAbove: 5,
    aroundMeBelow: 5,
    showRankDelta: true,
    showPercentile: true,
    showTierBadge: true,
    showCountryFlag: true,
    showAvatar: true,
    anonymize: false,
    scoreFormat: '{score} ⭐',
    scoreDecimals: 0,
    tiers: [
      { name: 'Cosmic', minPercentile: 99, maxPercentile: 100, color: '#9b59b6', iconUrl: '/tiers/cosmic.svg' },
      { name: 'Stellar', minPercentile: 90, maxPercentile: 99, color: '#3498db', iconUrl: '/tiers/stellar.svg' },
      { name: 'Bright', minPercentile: 70, maxPercentile: 90, color: '#f1c40f', iconUrl: '/tiers/bright.svg' },
      { name: 'Rising', minPercentile: 40, maxPercentile: 70, color: '#e67e22', iconUrl: '/tiers/rising.svg' },
    ],
    customColumns: [
      { key: 'venture_name', label: 'Venture', format: 'text', width: '120px', sortOrder: 1 },
    ],
    headerImageUrl: null,
    themeColor: '#9b59b6',
    cssClass: null,
  },
  
  timePeriod: 'weekly',
  entryCriteria: {},
  validationRules: [],
  antiCheatConfig: {
    anomalyDetectionEnabled: true,
    anomalyThreshold: 3.0,
    minSamplesForAnalysis: 500,
    maxImprovementPercent: null,
    holdForReview: true,
    shadowbanEnabled: true,
  },
  rateLimit: { maxPerMinute: 20, maxPerHour: 200, maxPerDay: 2000, cooldownSeconds: 1 },
  tags: ['platform', 'federated', 'weekly'],
});

// ─── Ventures opt-in to the federation ───────────────────────────
// Each venture maps their internal score to the federated metric
await leaderboardService.joinFederation(federatedBoard.id, 'venture_01_gaming', {
  scoreMapping: {
    // Map this venture's "xp" metric to federated "stars"
    sourceMetric: 'xp',
    // Conversion: 100 XP = 1 star
    conversionFormula: 'source_score / 100',
    // Only include users above a threshold
    minimumSourceScore: 500,
  },
});

await leaderboardService.joinFederation(federatedBoard.id, 'venture_02_fitness', {
  scoreMapping: {
    sourceMetric: 'workout_points',
    // Different conversion rate for this venture
    conversionFormula: 'source_score * 2',
    minimumSourceScore: 100,
  },
});

await leaderboardService.joinFederation(federatedBoard.id, 'venture_03_learning', {
  scoreMapping: {
    sourceMetric: 'course_credits',
    conversionFormula: 'source_score * 10',
    minimumSourceScore: 10,
  },
});

// ─── Query federated rankings ────────────────────────────────────
const fedRankings = await leaderboardService.getFederatedRankings(
  federatedBoard.id,
  { limit: 10 }
);

console.log('Platform-wide Top 10:');
for (const entry of fedRankings.items) {
  console.log(
    `  #${entry.rank} ${entry.userProfile?.displayName} ` +
    `(${entry.ventureName}) — ${entry.score} ⭐`
  );
}
// Platform-wide Top 10:
//   #1 xProGamer (GameVerse) — 985 ⭐
//   #2 FitnessFanatic (FitTrack) — 940 ⭐
//   #3 BookWorm99 (LearnHub) — 920 ⭐
//   ...

// Per-venture segment of the federated board
const ventureSegment = await leaderboardService.getTopEntries(
  federatedBoard.id,
  {
    segmentId: 'seg_venture_01_gaming',
    limit: 5,
  }
);

// ─── Leave federation ────────────────────────────────────────────
await leaderboardService.leaveFederation(
  federatedBoard.id,
  'venture_03_learning'
);
```

### 8 — Anti-Cheat Score Validation Pipeline

```typescript
import {
  LeaderboardService,
  createScoreValidator,
  RangeValidator,
  RateValidator,
  StatisticalValidator,
  DeltaValidator,
} from '@mcv/engagement/leaderboards';

const leaderboardService = container.resolve(LeaderboardService);

// ───// Configure multi-layer score validation pipeline
const scoreValidator = createScoreValidator({
  tenantId: 'tenant_gaming_001',
  leaderboardId: 'lb_competitive_fps',
  validators: [
    // Layer 1: Hard range checks â€” reject impossible scores immediately
    new RangeValidator({
      minScore: 0,
      maxScore: 999_999,
      maxScorePerMinute: 50_000, // theoretical maximum for this game mode
      rejectAction: 'block',     // immediately reject out-of-range
    }),

    // Layer 2: Rate limiting â€” prevent score flooding
    new RateValidator({
      maxSubmissionsPerMinute: 10,
      maxSubmissionsPerHour: 120,
      maxSubmissionsPerDay: 500,
      cooldownAfterBurst: 60_000,  // 1 minute cooldown after burst
      rejectAction: 'throttle',     // queue excess submissions
    }),

    // Layer 3: Delta analysis â€” flag suspicious score jumps
    new DeltaValidator({
      maxScoreIncreasePct: 300,    // flag if score jumps >300% from average
      windowSize: 10,              // compare against last 10 submissions
      minSamplesRequired: 5,       // need at least 5 scores before flagging
      rejectAction: 'flag',        // flag for review, don't block
    }),

    // Layer 4: Statistical anomaly detection â€” Z-score analysis
    new StatisticalValidator({
      zScoreThreshold: 3.5,        // flag scores >3.5 std deviations from mean
      populationMinSize: 50,       // need 50+ scores in population for analysis
      rollingWindowHours: 168,     // analyze over 7-day rolling window
      segmentAware: true,          // compare within same segment only
      rejectAction: 'flag',        // flag for manual review
    }),
  ],
});

// â”€â”€ Submit a score through the validation pipeline â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
async function submitValidatedScore(
  userId: string,
  score: number,
  metadata: Record<string, unknown>,
) {
  // Run through all validation layers
  const validation = await scoreValidator.validate({
    userId,
    score,
    metadata,
    timestamp: new Date(),
    clientSignature: metadata.signature as string, // HMAC signature from game client
  });

  if (validation.status === 'blocked') {
    // Hard rejection â€” score is impossible
    throw new LeaderboardError('LB_018', 'Score rejected by anti-cheat validation', {
      reason: validation.reason,
      validator: validation.failedValidator,
    });
  }

  if (validation.status === 'throttled') {
    // Rate limited â€” score queued for later processing
    await leaderboardService.queueScore({
      tenantId: 'tenant_gaming_001',
      leaderboardId: 'lb_competitive_fps',
      userId,
      score,
      metadata,
      processAfter: validation.retryAfter,
    });
    return { queued: true, retryAfter: validation.retryAfter };
  }

  if (validation.status === 'flagged') {
    // Suspicious â€” submit but add to manual review queue
    const entry = await leaderboardService.submitScore({
      tenantId: 'tenant_gaming_001',
      leaderboardId: 'lb_competitive_fps',
      userId,
      score,
      metadata: { ...metadata, flagged: true, flagReasons: validation.flags },
    });

    // Add to review queue for manual inspection
    await leaderboardService.addToReviewQueue({
      tenantId: 'tenant_gaming_001',
      entryId: entry.id,
      userId,
      score,
      flags: validation.flags,
      priority: validation.severity === 'high' ? 'urgent' : 'normal',
      context: {
        previousScores: validation.context.recentScores,
        populationStats: validation.context.populationStats,
        zScore: validation.context.zScore,
      },
    });

    return { submitted: true, flagged: true, entryId: entry.id };
  }

  // Clean submission â€” all validators passed
  const entry = await leaderboardService.submitScore({
    tenantId: 'tenant_gaming_001',
    leaderboardId: 'lb_competitive_fps',
    userId,
    score,
    metadata,
  });

  return { submitted: true, flagged: false, entryId: entry.id };
}

// â”€â”€ Process the manual review queue (admin panel) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
async function processReviewQueue(adminId: string) {
  const pendingReviews = await leaderboardService.getReviewQueue({
    tenantId: 'tenant_gaming_001',
    status: 'pending',
    sortBy: 'priority',
    limit: 50,
  });

  for (const review of pendingReviews.items) {
    console.log(
      `Review #${review.id}: user=${review.userId}, score=${review.score}, ` +
      `flags=[${review.flags.join(', ')}], priority=${review.priority}`,
    );
  }

  // Approve or reject flagged entries
  await leaderboardService.resolveReview({
    tenantId: 'tenant_gaming_001',
    reviewId: pendingReviews.items[0].id,
    decision: 'approve',  // or 'reject' or 'shadowban'
    reviewedBy: adminId,
    notes: 'Verified via replay analysis â€” score is legitimate',
  });
}

// â”€â”€ Shadowban a cheater (they see their scores, nobody else does) â”€â”€â”€
async function shadowbanUser(adminId: string, cheaterUserId: string) {
  await leaderboardService.applyShadowban({
    tenantId: 'tenant_gaming_001',
    userId: cheaterUserId,
    reason: 'Automated anti-cheat detection + manual review confirmation',
    appliedBy: adminId,
    scope: 'all_leaderboards',  // or specific leaderboard IDs
    duration: null,              // permanent until manual lift
  });

  // Shadowbanned user's queries return fake rankings showing their scores
  // Other users' queries silently exclude shadowbanned scores
}
```

---

## Error Codes

All errors extend the base `McvError` from `@mcv/kernel` with the domain prefix `LB_`. Errors include structured metadata for debugging and client-side handling.

| Code | Name | HTTP | Description |
|---|---|---|---|
| `LB_001` | `LEADERBOARD_NOT_FOUND` | 404 | Leaderboard does not exist or is not accessible in this tenant context |
| `LB_002` | `LEADERBOARD_ALREADY_EXISTS` | 409 | A leaderboard with this slug already exists in the tenant |
| `LB_003` | `INVALID_SCORE_VALUE` | 400 | Score value is outside the configured valid range or is not a finite number |
| `LB_004` | `INVALID_SCORE_FORMAT` | 400 | Score submission payload fails schema validation (missing fields, wrong types) |
| `LB_005` | `SEASON_NOT_FOUND` | 404 | Referenced season does not exist or has been archived |
| `LB_006` | `SEASON_EXPIRED` | 410 | Season has ended; no new score submissions are accepted |
| `LB_007` | `SEASON_NOT_STARTED` | 425 | Season has not yet begun; submissions will be accepted after the start date |
| `LB_008` | `SEASON_OVERLAP` | 409 | New season dates overlap with an existing season for this leaderboard |
| `LB_009` | `USER_BANNED` | 403 | User is banned from this leaderboard (hard ban, not shadowban) |
| `LB_010` | `USER_SHADOWBANNED` | 200 | User is shadowbanned â€” returned internally only, never exposed to the client |
| `LB_011` | `RATE_LIMIT_EXCEEDED` | 429 | Too many score submissions in the current time window |
| `LB_012` | `ANTI_CHEAT_BLOCKED` | 403 | Score rejected by anti-cheat range validator (impossible score) |
| `LB_013` | `ANTI_CHEAT_FLAGGED` | 202 | Score accepted but flagged for manual review by anomaly detection |
| `LB_014` | `ANTI_CHEAT_THROTTLED` | 429 | Score queued due to submission rate limiting by anti-cheat |
| `LB_015` | `SEGMENT_NOT_FOUND` | 404 | Referenced segment does not exist on this leaderboard |
| `LB_016` | `SEGMENT_MISMATCH` | 400 | User does not qualify for the target segment based on current criteria |
| `LB_017` | `SEGMENT_CRITERIA_INVALID` | 400 | Segment filter criteria contain invalid fields or operators |
| `LB_018` | `RANKING_ALGORITHM_ERROR` | 500 | Internal error during ranking computation (ELO/Glicko-2/TrueSkill) |
| `LB_019` | `RANKING_CONVERGENCE_FAILED` | 500 | Iterative ranking algorithm failed to converge within max iterations |
| `LB_020` | `TIE_BREAK_FAILED` | 500 | All configured tie-breaking strategies failed to resolve a tie |
| `LB_021` | `INVALID_TIE_BREAK_FIELD` | 400 | Configured tie-break field does not exist in score metadata |
| `LB_022` | `REDIS_CONNECTION_FAILED` | 503 | Cannot connect to Redis for real-time ranking operations |
| `LB_023` | `REDIS_SYNC_FAILED` | 500 | Failed to synchronize ranking data between PostgreSQL and Redis |
| `LB_024` | `WEBSOCKET_BROADCAST_FAILED` | 500 | Failed to broadcast real-time leaderboard update via WebSocket |
| `LB_025` | `INVALID_RANKING_ALGORITHM` | 400 | Specified ranking algorithm is not supported or not configured |
| `LB_026` | `SCORE_SIGNATURE_INVALID` | 403 | Client-side HMAC score signature failed verification |
| `LB_027` | `SCORE_REPLAY_DETECTED` | 403 | Duplicate score submission detected (same nonce/timestamp) |
| `LB_028` | `LEADERBOARD_FROZEN` | 423 | Leaderboard is temporarily frozen (maintenance or season transition) |
| `LB_029` | `MAX_ENTRIES_REACHED` | 409 | Leaderboard has reached its configured maximum entry count |
| `LB_030` | `REVIEW_QUEUE_FULL` | 503 | Manual review queue is at capacity; flagged scores are being auto-held |

### Error Response Structure

```typescript
// All leaderboard errors follow this structure
interface LeaderboardErrorResponse {
  success: false;
  error: {
    code: string;        // e.g., 'LB_003'
    name: string;        // e.g., 'INVALID_SCORE_VALUE'
    message: string;     // Human-readable description
    domain: 'engagement.leaderboards';
    metadata?: {
      leaderboardId?: string;
      seasonId?: string;
      userId?: string;
      score?: number;
      validRange?: { min: number; max: number };
      retryAfter?: number;     // milliseconds until retry (for rate limits)
      flagReasons?: string[];  // anti-cheat flag details
      algorithmName?: string;  // which ranking algorithm failed
    };
    timestamp: string;   // ISO 8601
    requestId: string;   // correlation ID for tracing
  };
}

// Example error thrown in service layer
throw new LeaderboardError('LB_006', 'Season "summer-2025" ended on 2025-08-31T23:59:59Z', {
  seasonId: 'season_summer_2025',
  leaderboardId: 'lb_competitive_fps',
  endedAt: '2025-08-31T23:59:59Z',
});
```

---

## Security

### Access Control Matrix

| Operation | Public (Anon) | Authenticated User | Leaderboard Admin | Tenant Admin |
|---|---|---|---|---|
| View leaderboard rankings | âœ… Read | âœ… Read | âœ… Read | âœ… Read |
| View own rank/score | âŒ | âœ… Own only | âœ… Any user | âœ… Any user |
| Submit score | âŒ | âœ… Own scores | âœ… Any user | âœ… Any user |
| Create leaderboard | âŒ | âŒ | âœ… | âœ… |
| Update leaderboard config | âŒ | âŒ | âœ… Own boards | âœ… Any board |
| Delete leaderboard | âŒ | âŒ | âŒ | âœ… |
| Manage seasons | âŒ | âŒ | âœ… Own boards | âœ… Any board |
| Manage segments | âŒ | âŒ | âœ… Own boards | âœ… Any board |
| View review queue | âŒ | âŒ | âœ… Own boards | âœ… Any board |
| Resolve flagged scores | âŒ | âŒ | âœ… Own boards | âœ… Any board |
| Ban/shadowban users | âŒ | âŒ | âœ… Own boards | âœ… Global |
| View anti-cheat logs | âŒ | âŒ | âœ… Own boards | âœ… Any board |
| Configure anti-cheat rules | âŒ | âŒ | âŒ | âœ… |
| Access analytics/exports | âŒ | âŒ | âœ… Own boards | âœ… Any board |

### Row-Level Security (RLS) Policies

```sql
-- â”€â”€ Tenant isolation â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
-- All leaderboard tables enforce tenant isolation via RLS.
-- The tenant_id is extracted from the JWT claim `x-tenant-id`.

-- Leaderboard visibility: public leaderboards readable by all,
-- private leaderboards restricted to authenticated tenant members
CREATE POLICY "leaderboard_read_public" ON leaderboards
  FOR SELECT
  USING (
    tenant_id = current_setting('app.tenant_id')::uuid
    AND (
      visibility = 'public'
      OR auth.uid() IS NOT NULL
    )
  );

-- Score submissions: authenticated users can insert their own scores
CREATE POLICY "score_insert_own" ON leaderboard_entries
  FOR INSERT
  WITH CHECK (
    tenant_id = current_setting('app.tenant_id')::uuid
    AND user_id = auth.uid()
    AND NOT EXISTS (
      SELECT 1 FROM leaderboard_bans
      WHERE tenant_id = current_setting('app.tenant_id')::uuid
      AND user_id = auth.uid()
      AND leaderboard_id = leaderboard_entries.leaderboard_id
      AND ban_type = 'hard'
      AND (expires_at IS NULL OR expires_at > now())
    )
  );

-- Score reads: exclude shadowbanned users' scores from other users' queries
CREATE POLICY "score_read_filtered" ON leaderboard_entries
  FOR SELECT
  USING (
    tenant_id = current_setting('app.tenant_id')::uuid
    AND (
      -- User can always see their own scores
      user_id = auth.uid()
      -- Other users' scores visible only if not shadowbanned
      OR NOT EXISTS (
        SELECT 1 FROM leaderboard_bans
        WHERE tenant_id = current_setting('app.tenant_id')::uuid
        AND user_id = leaderboard_entries.user_id
        AND leaderboard_id = leaderboard_entries.leaderboard_id
        AND ban_type = 'shadow'
        AND (expires_at IS NULL OR expires_at > now())
      )
    )
  );

-- Admin policies: leaderboard admins can manage their assigned boards
CREATE POLICY "admin_manage_leaderboard" ON leaderboards
  FOR ALL
  USING (
    tenant_id = current_setting('app.tenant_id')::uuid
    AND (
      -- Tenant admins can manage all
      auth.jwt() ->> 'role' = 'tenant_admin'
      -- Leaderboard admins can manage assigned boards
      OR EXISTS (
        SELECT 1 FROM leaderboard_admins
        WHERE tenant_id = current_setting('app.tenant_id')::uuid
        AND user_id = auth.uid()
        AND leaderboard_id = leaderboards.id
      )
    )
  );

-- Review queue: only admins can access flagged entries
CREATE POLICY "review_queue_admin_only" ON leaderboard_review_queue
  FOR ALL
  USING (
    tenant_id = current_setting('app.tenant_id')::uuid
    AND (
      auth.jwt() ->> 'role' = 'tenant_admin'
      OR EXISTS (
        SELECT 1 FROM leaderboard_admins
        WHERE tenant_id = current_setting('app.tenant_id')::uuid
        AND user_id = auth.uid()
        AND leaderboard_id = leaderboard_review_queue.leaderboard_id
      )
    )
  );
```

### Score Integrity â€” Signed Submissions

```typescript
// Client-side: sign score before submission
import { createHmac, randomBytes } from 'crypto';

interface SignedScorePayload {
  userId: string;
  leaderboardId: string;
  score: number;
  nonce: string;          // unique per submission, prevents replay
  timestamp: number;      // Unix ms, server validates freshness
  gameSessionId: string;  // ties score to a specific game session
  signature: string;      // HMAC-SHA256 of payload
}

function signScore(
  payload: Omit<SignedScorePayload, 'signature' | 'nonce'>,
  clientSecret: string,
): SignedScorePayload {
  const nonce = randomBytes(16).toString('hex');
  const message = [
    payload.userId,
    payload.leaderboardId,
    payload.score.toString(),
    nonce,
    payload.timestamp.toString(),
    payload.gameSessionId,
  ].join(':');

  const signature = createHmac('sha256', clientSecret)
    .update(message)
    .digest('hex');

  return { ...payload, nonce, signature };
}

// Server-side: verify signature and check for replay attacks
async function verifyScoreSignature(
  payload: SignedScorePayload,
  clientSecret: string,
): Promise<{ valid: boolean; reason?: string }> {
  // 1. Check timestamp freshness (reject if older than 5 minutes)
  const age = Date.now() - payload.timestamp;
  if (age > 5 * 60 * 1000) {
    return { valid: false, reason: 'Score submission too old (>5 min)' };
  }
  if (age < -30_000) {
    return { valid: false, reason: 'Score timestamp is in the future' };
  }

  // 2. Check nonce uniqueness (prevent replay attacks)
  const nonceKey = `score:nonce:${payload.leaderboardId}:${payload.nonce}`;
  const nonceExists = await redis.exists(nonceKey);
  if (nonceExists) {
    return { valid: false, reason: 'Duplicate nonce â€” replay attack detected' };
  }

  // 3. Verify HMAC signature
  const message = [
    payload.userId,
    payload.leaderboardId,
    payload.score.toString(),
    payload.nonce,
    payload.timestamp.toString(),
    payload.gameSessionId,
  ].join(':');

  const expectedSignature = createHmac('sha256', clientSecret)
    .update(message)
    .digest('hex');

  if (payload.signature !== expectedSignature) {
    return { valid: false, reason: 'Invalid HMAC signature' };
  }

  // 4. Store nonce with TTL to prevent future replays
  await redis.set(nonceKey, '1', 'EX', 600); // 10 minute TTL

  return { valid: true };
}
```

### Rate Limiting

```typescript
// Rate limit configuration per leaderboard
interface RateLimitConfig {
  // Per-user submission limits
  perUser: {
    perMinute: number;    // default: 10
    perHour: number;      // default: 120
    perDay: number;       // default: 500
  };
  // Global leaderboard limits (across all users)
  global: {
    perSecond: number;    // default: 1000
    perMinute: number;    // default: 30000
    burstAllowance: number; // default: 2x per-second limit
  };
  // Penalty escalation
  penalties: {
    softLimitAction: 'queue' | 'reject';     // what to do at 80% capacity
    hardLimitAction: 'reject' | 'block';     // what to do at 100% capacity
    repeatedViolationThreshold: number;       // violations before temp ban
    tempBanDurationMinutes: number;           // default: 30
  };
}

// Redis-based sliding window rate limiter
class LeaderboardRateLimiter {
  async checkLimit(
    tenantId: string,
    userId: string,
    leaderboardId: string,
  ): Promise<RateLimitResult> {
    const key = `rl:${tenantId}:${leaderboardId}:${userId}`;
    const now = Date.now();

    // Sliding window counter using Redis sorted sets
    const pipeline = redis.pipeline();
    pipeline.zremrangebyscore(key, 0, now - 60_000);  // remove entries older than 1 min
    pipeline.zadd(key, now, `${now}:${Math.random()}`);
    pipeline.zcard(key);
    pipeline.expire(key, 120);

    const results = await pipeline.exec();
    const currentCount = results![2][1] as number;

    const config = await this.getConfig(tenantId, leaderboardId);

    if (currentCount > config.perUser.perMinute) {
      return {
        allowed: false,
        reason: 'per_minute_exceeded',
        retryAfter: 60_000,
        currentCount,
        limit: config.perUser.perMinute,
      };
    }

    return {
      allowed: true,
      remaining: config.perUser.perMinute - currentCount,
      resetAt: now + 60_000,
    };
  }
}
```

### Shadowban Mechanics

Shadowbanned users experience the leaderboard as normal from their perspective. Their scores are accepted, they see themselves on the board, and they receive rank change notifications. However, their entries are invisible to all other users.

```typescript
// How shadowban affects queries internally
class LeaderboardQueryService {
  async getRankings(
    tenantId: string,
    leaderboardId: string,
    requestingUserId: string | null,
    options: QueryOptions,
  ): Promise<RankingResult> {
    // Check if the requesting user is shadowbanned
    const isShadowbanned = requestingUserId
      ? await this.banService.isShadowbanned(tenantId, leaderboardId, requestingUserId)
      : false;

    if (isShadowbanned) {
      // Return a fabricated view: real leaderboard + their scores injected at
      // the rank they would have held. Other shadowbanned users are excluded.
      return this.buildShadowbannedView(tenantId, leaderboardId, requestingUserId, options);
    }

    // Normal query: RLS policy automatically excludes shadowbanned entries
    return this.buildStandardView(tenantId, leaderboardId, requestingUserId, options);
  }

  private async buildShadowbannedView(
    tenantId: string,
    leaderboardId: string,
    userId: string,
    options: QueryOptions,
  ): Promise<RankingResult> {
    // Get real rankings (without any shadowbanned users)
    const realRankings = await this.fetchRealRankings(tenantId, leaderboardId, options);

    // Get the shadowbanned user's scores
    const userScores = await this.fetchUserScores(tenantId, leaderboardId, userId);

    // Insert user's scores into the real rankings at the correct position
    // This creates the illusion of normal participation
    return this.mergeUserIntoRankings(realRankings, userScores, options);
  }
}
```

---

## Environment Variables

All environment variables are prefixed with `MCV_LEADERBOARD_` for namespacing. Variables marked **required** must be set in production; others have sensible defaults.

| Variable | Type | Default | Required | Description |
|---|---|---|---|---|
| `MCV_LEADERBOARD_REDIS_URL` | `string` | â€” | **Yes** | Redis connection URL for real-time ranking storage (e.g., `redis://localhost:6379/2`) |
| `MCV_LEADERBOARD_REDIS_CLUSTER_ENABLED` | `boolean` | `false` | No | Enable Redis Cluster mode for horizontal scaling |
| `MCV_LEADERBOARD_REDIS_CLUSTER_NODES` | `string` | â€” | If cluster | Comma-separated list of Redis Cluster node URLs |
| `MCV_LEADERBOARD_REDIS_KEY_PREFIX` | `string` | `mcv:lb:` | No | Prefix for all Redis keys to avoid collisions in shared instances |
| `MCV_LEADERBOARD_REDIS_MAX_RETRIES` | `number` | `3` | No | Maximum Redis operation retry attempts before failing |
| `MCV_LEADERBOARD_REDIS_RETRY_DELAY_MS` | `number` | `1000` | No | Delay between Redis retry attempts (with exponential backoff) |
| `MCV_LEADERBOARD_DEFAULT_ALGORITHM` | `string` | `simple` | No | Default ranking algorithm: `simple`, `elo`, `glicko2`, `trueskill` |
| `MCV_LEADERBOARD_ELO_K_FACTOR` | `number` | `32` | No | ELO K-factor for rating volatility (higher = more volatile) |
| `MCV_LEADERBOARD_ELO_INITIAL_RATING` | `number` | `1200` | No | Starting ELO rating for new players |
| `MCV_LEADERBOARD_GLICKO2_TAU` | `number` | `0.5` | No | Glicko-2 system constant Ï„ â€” constrains volatility change |
| `MCV_LEADERBOARD_GLICKO2_DEFAULT_RD` | `number` | `350` | No | Glicko-2 default rating deviation for new players |
| `MCV_LEADERBOARD_GLICKO2_DEFAULT_VOL` | `number` | `0.06` | No | Glicko-2 default volatility for new players |
| `MCV_LEADERBOARD_TRUESKILL_MU` | `number` | `25` | No | TrueSkill default mean (Î¼) for new players |
| `MCV_LEADERBOARD_TRUESKILL_SIGMA` | `number` | `8.333` | No | TrueSkill default standard deviation (Ïƒ) for new players |
| `MCV_LEADERBOARD_TRUESKILL_BETA` | `number` | `4.167` | No | TrueSkill performance variation parameter (Î²) |
| `MCV_LEADERBOARD_TRUESKILL_TAU` | `number` | `0.083` | No | TrueSkill dynamics factor (Ï„) â€” additive variance per game |
| `MCV_LEADERBOARD_ANTICHEAT_ENABLED` | `boolean` | `true` | No | Enable/disable the anti-cheat validation pipeline |
| `MCV_LEADERBOARD_ANTICHEAT_ZSCORE_THRESHOLD` | `number` | `3.5` | No | Z-score threshold for statistical anomaly detection |
| `MCV_LEADERBOARD_ANTICHEAT_MIN_POPULATION` | `number` | `50` | No | Minimum population size before statistical analysis activates |
| `MCV_LEADERBOARD_ANTICHEAT_MAX_DELTA_PCT` | `number` | `300` | No | Maximum allowed score increase percentage before flagging |
| `MCV_LEADERBOARD_ANTICHEAT_REVIEW_QUEUE_MAX` | `number` | `10000` | No | Maximum entries in the review queue before auto-hold triggers |
| `MCV_LEADERBOARD_SCORE_SIGNATURE_SECRET` | `string` | â€” | **Yes** | HMAC secret for client-side score signature verification |
| `MCV_LEADERBOARD_SCORE_SIGNATURE_ALGORITHM` | `string` | `sha256` | No | HMAC algorithm for score signatures |
| `MCV_LEADERBOARD_SCORE_MAX_AGE_MS` | `number` | `300000` | No | Maximum age of a score submission before rejection (default 5 min) |
| `MCV_LEADERBOARD_SEASON_AUTO_TRANSITION` | `boolean` | `true` | No | Automatically transition seasons at scheduled end dates |
| `MCV_LEADERBOARD_SEASON_FREEZE_DURATION_MS` | `number` | `300000` | No | Duration to freeze leaderboard during season transitions (default 5 min) |
| `MCV_LEADERBOARD_SEASON_ARCHIVE_AFTER_DAYS` | `number` | `365` | No | Days after season end before archiving to cold storage |
| `MCV_LEADERBOARD_WS_ENABLED` | `boolean` | `true` | No | Enable WebSocket real-time leaderboard updates |
| `MCV_LEADERBOARD_WS_PORT` | `number` | `3042` | No | WebSocket server port for real-time subscriptions |
| `MCV_LEADERBOARD_WS_HEARTBEAT_INTERVAL_MS` | `number` | `30000` | No | WebSocket heartbeat interval for connection health |
| `MCV_LEADERBOARD_WS_MAX_CONNECTIONS_PER_TENANT` | `number` | `10000` | No | Maximum concurrent WebSocket connections per tenant |
| `MCV_LEADERBOARD_WS_BROADCAST_DEBOUNCE_MS` | `number` | `500` | No | Debounce interval for batching rank change broadcasts |
| `MCV_LEADERBOARD_CACHE_TTL_SECONDS` | `number` | `30` | No | TTL for cached leaderboard pages (balances freshness vs. load) |
| `MCV_LEADERBOARD_CACHE_STALE_WHILE_REVALIDATE` | `number` | `60` | No | Serve stale cache while revalidating in background (seconds) |
| `MCV_LEADERBOARD_ANALYTICS_ENABLED` | `boolean` | `true` | No | Enable analytics event emission for score submissions and rank changes |
| `MCV_LEADERBOARD_ANALYTICS_SAMPLE_RATE` | `number` | `1.0` | No | Sampling rate for analytics events (0.0 to 1.0, default all) |
| `MCV_LEADERBOARD_MAX_ENTRIES_PER_BOARD` | `number` | `1000000` | No | Maximum entries per leaderboard before requiring archival |
| `MCV_LEADERBOARD_PAGINATION_DEFAULT_LIMIT` | `number` | `50` | No | Default page size for leaderboard queries |
| `MCV_LEADERBOARD_PAGINATION_MAX_LIMIT` | `number` | `200` | No | Maximum allowed page size for leaderboard queries |
| `MCV_LEADERBOARD_RATE_LIMIT_PER_MINUTE` | `number` | `10` | No | Default per-user score submissions per minute |
| `MCV_LEADERBOARD_RATE_LIMIT_PER_HOUR` | `number` | `120` | No | Default per-user score submissions per hour |
| `MCV_LEADERBOARD_RATE_LIMIT_PER_DAY` | `number` | `500` | No | Default per-user score submissions per day |
| `MCV_LEADERBOARD_LOG_LEVEL` | `string` | `info` | No | Logging level: `debug`, `info`, `warn`, `error` |

### Example `.env` Configuration

```bash
# â”€â”€ Redis â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
MCV_LEADERBOARD_REDIS_URL=redis://redis-cluster.internal:6379/2
MCV_LEADERBOARD_REDIS_KEY_PREFIX=mcv:lb:prod:

# â”€â”€ Ranking Algorithms â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
MCV_LEADERBOARD_DEFAULT_ALGORITHM=glicko2
MCV_LEADERBOARD_GLICKO2_TAU=0.5
MCV_LEADERBOARD_GLICKO2_DEFAULT_RD=350

# â”€â”€ Anti-Cheat â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
MCV_LEADERBOARD_ANTICHEAT_ENABLED=true
MCV_LEADERBOARD_ANTICHEAT_ZSCORE_THRESHOLD=3.5
MCV_LEADERBOARD_SCORE_SIGNATURE_SECRET=your-256-bit-secret-here

# â”€â”€ Seasons â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
MCV_LEADERBOARD_SEASON_AUTO_TRANSITION=true
MCV_LEADERBOARD_SEASON_FREEZE_DURATION_MS=300000

# â”€â”€ WebSocket â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
MCV_LEADERBOARD_WS_ENABLED=true
MCV_LEADERBOARD_WS_PORT=3042
MCV_LEADERBOARD_WS_MAX_CONNECTIONS_PER_TENANT=10000

# â”€â”€ Performance â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
MCV_LEADERBOARD_CACHE_TTL_SECONDS=30
MCV_LEADERBOARD_PAGINATION_DEFAULT_LIMIT=50
MCV_LEADERBOARD_ANALYTICS_SAMPLE_RATE=1.0
```

---

## Dependencies

### Internal Dependencies

| Package | Min Version | Purpose |
|---|---|---|
| `@mcv/kernel` | `*` | Base error classes, module lifecycle, configuration, logging, DI container |
| `@mcv/identity` | `*` | User identity resolution, authentication context, JWT validation |
| `@mcv/fabric` | `*` | Multi-tenant context, tenant configuration, RLS helpers |
| `@mcv/engagement/points` | `*` | Point system integration â€” award points on leaderboard milestones |
| `@mcv/engagement/achievements` | `*` | Achievement triggers â€” unlock achievements for rank thresholds |
| `@mcv/analytics` | `*` | Event tracking â€” emit analytics events for score submissions, rank changes |
| `@mcv/notifications` | `*` | Push notifications for rank changes, season starts/ends, milestone alerts |
| `@mcv/storage` | `*` | Cold storage for archived seasons and historical leaderboard data |
| `@mcv/audit` | `*` | Audit logging for admin actions (bans, score removals, config changes) |

### External Dependencies

| Package | Version | Purpose |
|---|---|---|
| `ioredis` | `^5.3.0` | Redis client for sorted sets, pub/sub, and caching |
| `ws` | `^8.16.0` | WebSocket server for real-time leaderboard subscriptions |
| `zod` | `^3.22.0` | Schema validation for score submissions, API inputs, configuration |
| `date-fns` | `^3.0.0` | Date manipulation for season scheduling, time windows, TTL calculations |
| `date-fns-tz` | `^3.0.0` | Timezone-aware season boundaries and scheduled transitions |
| `drizzle-orm` | `^0.29.0` | Type-safe database queries, schema definitions, migrations |
| `uuid` | `^9.0.0` | UUID generation for leaderboard IDs, entry IDs, nonces |
| `pino` | `^8.17.0` | Structured logging for debugging, audit trails, performance metrics |
| `eventemitter3` | `^5.0.0` | Internal event bus for decoupled rank change notifications |
| `lru-cache` | `^10.1.0` | In-memory LRU cache for hot leaderboard pages |

### Peer Dependencies

| Package | Version | Purpose |
|---|---|---|
| `@supabase/supabase-js` | `^2.39.0` | Supabase client for RLS-aware database access |
| `@trpc/server` | `^10.45.0` | tRPC router definitions for type-safe API layer |

---

## Testing

### Test Structure

```
src/
â”œâ”€â”€ __tests__/
â”‚   â”œâ”€â”€ unit/
â”‚   â”‚   â”œâ”€â”€ algorithms/
â”‚   â”‚   â”‚   â”œâ”€â”€ elo.test.ts
â”‚   â”‚   â”‚   â”œâ”€â”€ glicko2.test.ts
â”‚   â”‚   â”‚   â”œâ”€â”€ trueskill.test.ts
â”‚   â”‚   â”‚   â”œâ”€â”€ simple-ranking.test.ts
â”‚   â”‚   â”‚   â””â”€â”€ tie-breaking.test.ts
â”‚   â”‚   â”œâ”€â”€ validators/
â”‚   â”‚   â”‚   â”œâ”€â”€ range-validator.test.ts
â”‚   â”‚   â”‚   â”œâ”€â”€ rate-validator.test.ts
â”‚   â”‚   â”‚   â”œâ”€â”€ delta-validator.test.ts
â”‚   â”‚   â”‚   â”œâ”€â”€ statistical-validator.test.ts
â”‚   â”‚   â”‚   â””â”€â”€ score-signature.test.ts
â”‚   â”‚   â”œâ”€â”€ services/
â”‚   â”‚   â”‚   â”œâ”€â”€ leaderboard-service.test.ts
â”‚   â”‚   â”‚   â”œâ”€â”€ season-service.test.ts
â”‚   â”‚   â”‚   â”œâ”€â”€ segment-service.test.ts
â”‚   â”‚   â”‚   â”œâ”€â”€ ranking-service.test.ts
â”‚   â”‚   â”‚   â””â”€â”€ shadowban-service.test.ts
â”‚   â”‚   â””â”€â”€ utils/
â”‚   â”‚       â”œâ”€â”€ pagination.test.ts
â”‚   â”‚       â””â”€â”€ redis-keys.test.ts
â”‚   â”œâ”€â”€ integration/
â”‚   â”‚   â”œâ”€â”€ season-lifecycle.test.ts
â”‚   â”‚   â”œâ”€â”€ realtime-updates.test.ts
â”‚   â”‚   â”œâ”€â”€ rls-policies.test.ts
â”‚   â”‚   â”œâ”€â”€ multi-tenant-isolation.test.ts
â”‚   â”‚   â”œâ”€â”€ redis-sync.test.ts
â”‚   â”‚   â”œâ”€â”€ anti-cheat-pipeline.test.ts
â”‚   â”‚   â””â”€â”€ websocket-broadcast.test.ts
â”‚   â””â”€â”€ benchmarks/
â”‚       â”œâ”€â”€ ranking-throughput.bench.ts
â”‚       â”œâ”€â”€ redis-sorted-set.bench.ts
â”‚       â””â”€â”€ query-performance.bench.ts
```

### Unit Tests â€” Ranking Algorithms

```typescript
import { describe, it, expect } from 'vitest';
import { EloRanking } from '../algorithms/elo';
import { Glicko2Ranking } from '../algorithms/glicko2';
import { TrueSkillRanking } from '../algorithms/trueskill';

describe('ELO Ranking Algorithm', () => {
  const elo = new EloRanking({ kFactor: 32, initialRating: 1200 });

  it('should initialize new players at default rating', () => {
    const player = elo.createPlayer('player_1');
    expect(player.rating).toBe(1200);
    expect(player.gamesPlayed).toBe(0);
  });

  it('should increase winner rating and decrease loser rating', () => {
    const [winner, loser] = elo.processMatch(
      { id: 'p1', rating: 1200 },
      { id: 'p2', rating: 1200 },
      'p1',
    );
    expect(winner.rating).toBeGreaterThan(1200);
    expect(loser.rating).toBeLessThan(1200);
    // Zero-sum: total rating change should balance
    expect(winner.rating + loser.rating).toBeCloseTo(2400, 5);
  });

  it('should give larger gains for upsets', () => {
    const [upset] = elo.processMatch(
      { id: 'underdog', rating: 1000 },
      { id: 'favorite', rating: 1600 },
      'underdog',
    );
    const [expected] = elo.processMatch(
      { id: 'even1', rating: 1200 },
      { id: 'even2', rating: 1200 },
      'even1',
    );
    // Underdog win should yield larger rating gain than even match
    expect(upset.rating - 1000).toBeGreaterThan(expected.rating - 1200);
  });

  it('should handle draws correctly', () => {
    const [p1, p2] = elo.processMatch(
      { id: 'p1', rating: 1200 },
      { id: 'p2', rating: 1200 },
      'draw',
    );
    // Equal players drawing should have no rating change
    expect(p1.rating).toBeCloseTo(1200, 5);
    expect(p2.rating).toBeCloseTo(1200, 5);
  });
});

describe('Glicko-2 Ranking Algorithm', () => {
  const glicko2 = new Glicko2Ranking({
    tau: 0.5,
    defaultRating: 1500,
    defaultRd: 350,
    defaultVolatility: 0.06,
  });

  it('should reduce rating deviation after matches', () => {
    const player = glicko2.createPlayer('player_1');
    const initialRd = player.rd;

    const updated = glicko2.processRatingPeriod(player, [
      { opponentRating: 1400, opponentRd: 30, outcome: 1 },
      { opponentRating: 1550, opponentRd: 100, outcome: 0 },
      { opponentRating: 1700, opponentRd: 300, outcome: 0 },
    ]);

    // RD should decrease after seeing results (more confident)
    expect(updated.rd).toBeLessThan(initialRd);
  });

  it('should increase rating deviation during inactivity', () => {
    const player = glicko2.createPlayer('player_1');
    player.rd = 50; // very confident

    const afterInactivity = glicko2.applyInactivityDecay(player, 3); // 3 periods idle
    expect(afterInactivity.rd).toBeGreaterThan(50);
  });
});

describe('TrueSkill Ranking Algorithm', () => {
  const trueskill = new TrueSkillRanking({
    mu: 25,
    sigma: 8.333,
    beta: 4.167,
    tau: 0.083,
  });

  it('should support team-based rankings', () => {
    const team1 = [
      trueskill.createPlayer('p1'),
      trueskill.createPlayer('p2'),
    ];
    const team2 = [
      trueskill.createPlayer('p3'),
      trueskill.createPlayer('p4'),
    ];

    const [updated1, updated2] = trueskill.processTeamMatch(team1, team2, 1); // team1 wins

    // Winning team should have increased mu
    for (const p of updated1) {
      expect(p.mu).toBeGreaterThan(25);
      expect(p.sigma).toBeLessThan(8.333);
    }
    // Losing team should have decreased mu
    for (const p of updated2) {
      expect(p.mu).toBeLessThan(25);
    }
  });

  it('should compute conservative skill estimate', () => {
    const player = trueskill.createPlayer('p1');
    // Conservative estimate = mu - 3*sigma
    const estimate = trueskill.getConservativeEstimate(player);
    expect(estimate).toBeCloseTo(25 - 3 * 8.333, 1);
  });
});

describe('Tie-Breaking', () => {
  it('should break ties by earliest submission time', () => {
    const entries = [
      { userId: 'p1', score: 1000, submittedAt: new Date('2025-01-15T10:30:00Z') },
      { userId: 'p2', score: 1000, submittedAt: new Date('2025-01-15T09:15:00Z') },
      { userId: 'p3', score: 1000, submittedAt: new Date('2025-01-15T11:00:00Z') },
    ];

    const ranked = applyTieBreaking(entries, [{ field: 'submittedAt', direction: 'asc' }]);
    expect(ranked.map(e => e.userId)).toEqual(['p2', 'p1', 'p3']);
  });

  it('should apply cascading tie-break fields', () => {
    const entries = [
      { userId: 'p1', score: 1000, gamesPlayed: 50, winRate: 0.65 },
      { userId: 'p2', score: 1000, gamesPlayed: 50, winRate: 0.72 },
      { userId: 'p3', score: 1000, gamesPlayed: 30, winRate: 0.80 },
    ];

    const ranked = applyTieBreaking(entries, [
      { field: 'gamesPlayed', direction: 'desc' },  // more games = higher rank
      { field: 'winRate', direction: 'desc' },       // then by win rate
    ]);
    // p1 and p2 tied on gamesPlayed (50), broken by winRate
    expect(ranked.map(e => e.userId)).toEqual(['p2', 'p1', 'p3']);
  });

  it('should throw LB_020 when all tie-break strategies exhausted', () => {
    const entries = [
      { userId: 'p1', score: 1000, gamesPlayed: 50 },
      { userId: 'p2', score: 1000, gamesPlayed: 50 },
    ];

    expect(() =>
      applyTieBreaking(entries, [
        { field: 'gamesPlayed', direction: 'desc' },
        // No more fields â€” still tied
      ], { strict: true }),
    ).toThrow('LB_020');
  });
});
```

### Integration Tests â€” Season Lifecycle

```typescript
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createTestContext } from '@mcv/testing';

describe('Season Lifecycle (Integration)', () => {
  const ctx = createTestContext({
    modules: ['kernel', 'identity', 'fabric', 'engagement/leaderboards'],
    fixtures: ['tenants', 'users'],
  });

  beforeAll(async () => ctx.setup());
  afterAll(async () => ctx.teardown());

  it('should create, run, freeze, and archive a complete season', async () => {
    const { leaderboardService, tenantId, users } = ctx;

    // 1. Create a leaderboard with seasonal config
    const board = await leaderboardService.create({
      tenantId,
      name: 'Integration Test Board',
      slug: 'integration-test',
      rankingAlgorithm: 'simple',
      sortDirection: 'desc',
    });

    // 2. Create a season
    const season = await leaderboardService.createSeason({
      tenantId,
      leaderboardId: board.id,
      name: 'Test Season 1',
      startsAt: new Date('2025-01-01'),
      endsAt: new Date('2025-03-31'),
    });

    // 3. Submit scores during active season
    for (const user of users.slice(0, 10)) {
      await leaderboardService.submitScore({
        tenantId,
        leaderboardId: board.id,
        seasonId: season.id,
        userId: user.id,
        score: Math.floor(Math.random() * 10000),
      });
    }

    // 4. Verify rankings are computed
    const rankings = await leaderboardService.getRankings({
      tenantId,
      leaderboardId: board.id,
      seasonId: season.id,
      limit: 10,
    });
    expect(rankings.entries).toHaveLength(10);
    expect(rankings.entries[0].rank).toBe(1);
    // Verify descending score order
    for (let i = 1; i < rankings.entries.length; i++) {
      expect(rankings.entries[i].score).toBeLessThanOrEqual(rankings.entries[i - 1].score);
    }

    // 5. End the season (triggers freeze + archival)
    await leaderboardService.endSeason({
      tenantId,
      leaderboardId: board.id,
      seasonId: season.id,
    });

    // 6. Verify season is frozen â€” no new submissions
    await expect(
      leaderboardService.submitScore({
        tenantId,
        leaderboardId: board.id,
        seasonId: season.id,
        userId: users[0].id,
        score: 9999,
      }),
    ).rejects.toThrow('LB_006'); // SEASON_EXPIRED

    // 7. Verify archived rankings are still queryable
    const archivedRankings = await leaderboardService.getRankings({
      tenantId,
      leaderboardId: board.id,
      seasonId: season.id,
    });
    expect(archivedRankings.entries).toHaveLength(10);
    expect(archivedRankings.season.status).toBe('archived');
  });
});
```

### Integration Tests â€” RLS & Multi-Tenant Isolation

```typescript
describe('Multi-Tenant RLS Isolation (Integration)', () => {
  const ctx = createTestContext({
    modules: ['kernel', 'identity', 'fabric', 'engagement/leaderboards'],
    fixtures: ['multi-tenant'],
  });

  beforeAll(async () => ctx.setup());
  afterAll(async () => ctx.teardown());

  it('should prevent cross-tenant data access', async () => {
    const { leaderboardService, tenantA, tenantB } = ctx;

    // Create leaderboards in each tenant
    const boardA = await leaderboardService.create({
      tenantId: tenantA.id,
      name: 'Tenant A Board',
      slug: 'board-a',
    });

    const boardB = await leaderboardService.create({
      tenantId: tenantB.id,
      name: 'Tenant B Board',
      slug: 'board-b',
    });

    // Submit scores in tenant A
    await leaderboardService.submitScore({
      tenantId: tenantA.id,
      leaderboardId: boardA.id,
      userId: tenantA.users[0].id,
      score: 5000,
    });

    // Tenant B should NOT see tenant A's leaderboard
    await expect(
      leaderboardService.getRankings({
        tenantId: tenantB.id,
        leaderboardId: boardA.id,
      }),
    ).rejects.toThrow('LB_001'); // LEADERBOARD_NOT_FOUND

    // Tenant B should NOT be able to submit to tenant A's board
    await expect(
      leaderboardService.submitScore({
        tenantId: tenantB.id,
        leaderboardId: boardA.id,
        userId: tenantB.users[0].id,
        score: 9999,
      }),
    ).rejects.toThrow('LB_001');
  });

  it('should enforce shadowban isolation per tenant', async () => {
    const { leaderboardService, tenantA } = ctx;

    const board = await leaderboardService.create({
      tenantId: tenantA.id,
      name: 'Shadowban Test',
      slug: 'shadowban-test',
    });

    const cheater = tenantA.users[0];
    const honest = tenantA.users[1];

    // Both submit scores
    await leaderboardService.submitScore({
      tenantId: tenantA.id, leaderboardId: board.id,
      userId: cheater.id, score: 10000,
    });
    await leaderboardService.submitScore({
      tenantId: tenantA.id, leaderboardId: board.id,
      userId: honest.id, score: 5000,
    });

    // Shadowban the cheater
    await leaderboardService.applyShadowban({
      tenantId: tenantA.id,
      userId: cheater.id,
      reason: 'test',
      appliedBy: 'admin',
      scope: 'all_leaderboards',
    });

    // Honest user should NOT see cheater's score
    const honestView = await leaderboardService.getRankings({
      tenantId: tenantA.id,
      leaderboardId: board.id,
      requestingUserId: honest.id,
    });
    expect(honestView.entries).toHaveLength(1);
    expect(honestView.entries[0].userId).toBe(honest.id);

    // Cheater should still see their own score (shadowban illusion)
    const cheaterView = await leaderboardService.getRankings({
      tenantId: tenantA.id,
      leaderboardId: board.id,
      requestingUserId: cheater.id,
    });
    expect(cheaterView.entries).toHaveLength(2); // sees both
    expect(cheaterView.entries[0].userId).toBe(cheater.id); // thinks they're #1
  });
});
```

### Performance Benchmarks

```typescript
import { bench, describe } from 'vitest';
import { EloRanking } from '../algorithms/elo';
import { Glicko2Ranking } from '../algorithms/glicko2';
import { TrueSkillRanking } from '../algorithms/trueskill';

describe('Ranking Algorithm Performance', () => {
  const elo = new EloRanking({ kFactor: 32, initialRating: 1200 });
  const glicko2 = new Glicko2Ranking({ tau: 0.5, defaultRating: 1500, defaultRd: 350, defaultVolatility: 0.06 });
  const trueskill = new TrueSkillRanking({ mu: 25, sigma: 8.333, beta: 4.167, tau: 0.083 });

  bench('ELO: 1v1 match processing (10k matches)', () => {
    for (let i = 0; i < 10_000; i++) {
      elo.processMatch(
        { id: 'p1', rating: 1200 + Math.random() * 400 },
        { id: 'p2', rating: 1200 + Math.random() * 400 },
        Math.random() > 0.5 ? 'p1' : 'p2',
      );
    }
  });

  bench('Glicko-2: rating period with 15 matches', () => {
    const player = glicko2.createPlayer('bench_player');
    const matches = Array.from({ length: 15 }, () => ({
      opponentRating: 1400 + Math.random() * 200,
      opponentRd: 30 + Math.random() * 100,
      outcome: Math.random() > 0.5 ? 1 : 0,
    }));
    glicko2.processRatingPeriod(player, matches);
  });

  bench('TrueSkill: 5v5 team match processing', () => {
    const team1 = Array.from({ length: 5 }, (_, i) => trueskill.createPlayer(`t1p${i}`));
    const team2 = Array.from({ length: 5 }, (_, i) => trueskill.createPlayer(`t2p${i}`));
    trueskill.processTeamMatch(team1, team2, 1);
  });

  bench('Redis sorted set: rank lookup for 1M entries', async () => {
    // Benchmark note: requires running Redis with pre-seeded data
    // Target: < 1ms per ZREVRANK lookup
    // Target: < 10ms per ZREVRANGEBYSCORE page (50 entries)
    // See benchmarks/redis-sorted-set.bench.ts for full setup
  });
});
```

### Coverage Targets

| Category | Target | Notes |
|---|---|---|
| **Overall line coverage** | â‰¥ 90% | Measured across all source files |
| **Branch coverage** | â‰¥ 85% | All ranking algorithm branches |
| **Ranking algorithms** | â‰¥ 95% | Critical mathematical correctness |
| **Anti-cheat validators** | â‰¥ 95% | Every validation path tested |
| **Score signature verification** | 100% | Security-critical code |
| **RLS policy tests** | â‰¥ 90% | Every policy permutation tested |
| **Integration tests** | â‰¥ 80% | Season lifecycle, WebSocket, Redis sync |
| **Performance benchmarks** | Pass/Fail | ELO < 1ms/match, Glicko-2 < 5ms/period, Redis ZREVRANK < 1ms |

```bash
# Run all tests
pnpm test --filter=@mcv/engagement-leaderboards

# Run unit tests only
pnpm test --filter=@mcv/engagement-leaderboards -- --dir=unit

# Run integration tests (requires Docker services)
pnpm test:integration --filter=@mcv/engagement-leaderboards

# Run benchmarks
pnpm bench --filter=@mcv/engagement-leaderboards

# Coverage report
pnpm test:coverage --filter=@mcv/engagement-leaderboards
```
