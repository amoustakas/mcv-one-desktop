# @mcv/engagement — Engagement & Gamification Engine

**Parent Package:** @mcv/domains  
**Tier:** 5 (Domain Layer — Publishable)  
**Classification:** PUBLISHABLE  
**Last Updated:** February 8, 2026

---

## Purpose

The `engagement` module is the **Behavioral Operating System** powering gamification, habit loops, and competitive dynamics across every MCV venture. It transforms passive user interactions into sustainable, habit-forming engagement loops through a configurable, multi-tenant infrastructure grounded in rigorous behavioral psychology (Self-Determination Theory, Octalysis Framework, Fogg Behavior Model).

Unlike traditional loyalty programs that bolt on point counters, the Engagement Engine is a high-throughput event-driven reactive system capable of processing thousands of micro-interactions per second while maintaining global consistency for real-time leaderboards, quest tracking, streak protection, seasonal campaigns, and economic balancing.

**This is the single behavioral middleware layer between venture-specific actions and the platform's value/reward layer.**

### 9 Submodules

| Submodule | Responsibility |
|-----------|---------------|
| **achievements** | Badge/trophy system with rarity tiers, NFT minting, and showcase profiles |
| **earn** | Unified earn-action registry — maps venture events to point/XP awards |
| **leaderboards** | Real-time competitive rankings via Redis Sorted Sets with rotation |
| **points** | Multi-currency ledger with ACID transactions, daily caps, and regeneration |
| **progression** | XP curves, leveling, tier advancement, and prestige resets |
| **quests** | Rule-based objective engine with temporal, structural, and chain quests |
| **rewards** | Reward catalog, redemption flow, and token conversion bridge |
| **seasons** | Time-bounded competitive seasons with exclusive reward tracks |
| **streaks** | Habit-loop tracking with grace periods, freezes, and velocity scoring |

### Strategic Targets

| Metric | Target | Mechanism |
|--------|--------|-----------|
| **D1 Retention** | 45%+ | Streak hooks, daily quest refresh, first-day achievements |
| **DAU/MAU Ratio** | 35%+ | Seasonal exclusivity, leaderboard competition, daily earn caps |
| **Viral K-Factor** | 0.8+ | Referral quests, social leaderboards, team achievements |
| **LTV Lift** | +40% | Behavioral sinks, token conversion, prestige progression |

---

## Exports

```typescript
// ═══════════════════════════════════════════════════════════════════════════════
// POINTS & CURRENCY
// ═══════════════════════════════════════════════════════════════════════════════

// Core ledger operations
export {
  awardPoints,               // Award points to a user (with idempotency)
  deductPoints,              // Deduct points (sink operation)
  transferPoints,            // Transfer points between users
  getBalance,                // Get user balance for a point type
  getAllBalances,             // Get all balances across point types
  getTransactionHistory,     // Paginated transaction ledger
  convertToTokens,           // Bridge points → on-chain tokens (EDGE/Solana)
} from './server/services/point-service';

// Point type management
export {
  createPointType,           // Define a new currency (XP, Coins, Energy, etc.)
  updatePointType,           // Update currency settings
  listPointTypes,            // List all currencies for a venture
  getPointType,              // Get single currency config
} from './server/services/point-type-service';

// ═══════════════════════════════════════════════════════════════════════════════
// QUESTS & OBJECTIVES
// ═══════════════════════════════════════════════════════════════════════════════

export {
  createQuest,               // Create a quest definition
  updateQuest,               // Update quest (rules, rewards, schedule)
  listQuests,                // List quest definitions
  getQuest,                  // Get single quest
  activateQuest,             // Move quest from draft → active
  pauseQuest,                // Pause active quest
  archiveQuest,              // Archive completed/expired quest
} from './server/services/quest-admin-service';

export {
  listActiveQuests,          // List quests available to user
  getQuestProgress,          // Get user progress on specific quest
  claimQuestReward,          // Claim completed quest reward
  refreshDailyQuests,        // Reset/regenerate daily objectives
} from './server/services/quest-user-service';

// ═══════════════════════════════════════════════════════════════════════════════
// ACHIEVEMENTS
// ═══════════════════════════════════════════════════════════════════════════════

export {
  createAchievement,         // Define new achievement
  updateAchievement,         // Update achievement config
  listAchievements,          // List achievement definitions
  getAchievement,            // Get single achievement
} from './server/services/achievement-admin-service';

export {
  getUserAchievements,       // Get user's achievement profile
  unlockAchievement,         // Manually unlock an achievement
  claimAchievementReward,    // Claim reward for unlocked achievement
  getAchievementProgress,    // Get progress toward a specific achievement
  setShowcaseAchievements,   // Pin achievements to profile
  mintAchievementNFT,        // Mint achievement as on-chain NFT
} from './server/services/achievement-user-service';

// ═══════════════════════════════════════════════════════════════════════════════
// STREAKS
// ═══════════════════════════════════════════════════════════════════════════════

export {
  getStreakStatus,            // Get current streak state
  recordStreakActivity,       // Record activity to maintain streak
  useStreakFreeze,            // Consume a streak freeze
  purchaseStreakFreeze,       // Buy a freeze with points
  getStreakHistory,           // Get historical streak data
  getStreakVelocity,          // Get 7-day rolling activity velocity
} from './server/services/streak-service';

// ═══════════════════════════════════════════════════════════════════════════════
// LEADERBOARDS
// ═══════════════════════════════════════════════════════════════════════════════

export {
  getRankings,               // Get top N for a leaderboard
  getUserRank,               // Get user's rank + surrounding players
  updateScore,               // Update user's score (internal, event-driven)
  createLeaderboard,         // Define a new leaderboard
  listLeaderboards,          // List available leaderboards
  rotateLeaderboard,         // Archive and reset a leaderboard
  getLeaderboardHistory,     // Get historical snapshots
} from './server/services/leaderboard-service';

// ═══════════════════════════════════════════════════════════════════════════════
// PROGRESSION & LEVELING
// ═══════════════════════════════════════════════════════════════════════════════

export {
  getUserLevel,              // Get user's current level and XP
  addXP,                     // Add XP and check for level-up
  getLevelConfig,            // Get leveling curve config
  updateLevelConfig,         // Update XP curve parameters
  getPrestigeStatus,         // Get prestige level info
  activatePrestige,          // Reset level for permanent bonuses
  getTierStatus,             // Get tier advancement status
  promoteTier,               // Promote user to next tier
} from './server/services/progression-service';

// ═══════════════════════════════════════════════════════════════════════════════
// REWARDS & REDEMPTION
// ═══════════════════════════════════════════════════════════════════════════════

export {
  createReward,              // Create a reward in the catalog
  updateReward,              // Update reward details/stock
  listRewards,               // List available rewards
  getReward,                 // Get single reward
  redeemReward,              // Redeem a reward (deduct points, issue asset)
  getRedemptionHistory,      // User's redemption history
  fulfillRedemption,         // Mark redemption as fulfilled (admin)
  refundRedemption,          // Refund a redemption (admin)
} from './server/services/reward-service';

// ═══════════════════════════════════════════════════════════════════════════════
// SEASONS
// ═══════════════════════════════════════════════════════════════════════════════

export {
  createSeason,              // Create a season definition
  updateSeason,              // Update season config
  getActiveSeason,           // Get currently active season
  listSeasons,               // List all seasons (past, current, future)
  getSeasonProgress,         // Get user progress in current season
  getSeasonRewardTrack,      // Get reward track tiers for a season
  claimSeasonReward,         // Claim a seasonal reward tier
  endSeason,                 // Manually end a season (admin)
} from './server/services/season-service';

// ═══════════════════════════════════════════════════════════════════════════════
// EARN ACTIONS
// ═══════════════════════════════════════════════════════════════════════════════

export {
  registerEarnAction,        // Register a new earn action mapping
  updateEarnAction,          // Update action → reward mapping
  listEarnActions,           // List all earn actions for a venture
  getEarnAction,             // Get single earn action config
  processEarnEvent,          // Process an incoming venture event
  getEarnHistory,            // Get user's earn event history
} from './server/services/earn-service';

// ═══════════════════════════════════════════════════════════════════════════════
// EVENT PROCESSING
// ═══════════════════════════════════════════════════════════════════════════════

export {
  processEngagementEvent,    // Main event processor (Redpanda consumer)
  evaluateRules,             // Evaluate JSON Logic rules against event
  EngagementProcessor,       // Streaming processor class
} from './server/services/event-processor';

// ═══════════════════════════════════════════════════════════════════════════════
// ECONOMIC MONITORING
// ═══════════════════════════════════════════════════════════════════════════════

export {
  getEconomicHealth,         // Get tap/sink balance overview
  getTapSinkReport,          // Detailed inflow/outflow report
  getInflationMetrics,       // Week-over-week inflation tracking
  adjustMultipliers,         // ACS v2.0 automatic multiplier adjustment
  getEconomicHistory,        // Historical economic health snapshots
} from './server/services/economic-service';

// ═══════════════════════════════════════════════════════════════════════════════
// FRAUD DETECTION
// ═══════════════════════════════════════════════════════════════════════════════

export {
  ScoutAgent,                // Anomaly detection agent class
  getAnomalyReport,          // Get detected anomalies
  getFraudAlerts,            // Get active fraud alerts
  resolveAlert,              // Mark alert as resolved
} from './server/services/scout-service';

// ═══════════════════════════════════════════════════════════════════════════════
// CLIENT HOOKS (React)
// ═══════════════════════════════════════════════════════════════════════════════

export { usePoints } from './client/hooks/use-points';
export { useQuests } from './client/hooks/use-quests';
export { useAchievements } from './client/hooks/use-achievements';
export { useStreak } from './client/hooks/use-streak';
export { useLeaderboard } from './client/hooks/use-leaderboard';
export { useProgression } from './client/hooks/use-progression';
export { useRewards } from './client/hooks/use-rewards';
export { useSeason } from './client/hooks/use-season';
export { useEngagementEvents } from './client/hooks/use-engagement-events';

// ═══════════════════════════════════════════════════════════════════════════════
// CLIENT COMPONENTS (React)
// ═══════════════════════════════════════════════════════════════════════════════

export { PointsDisplay } from './client/components/points-display';
export { PointsHistory } from './client/components/points-history';
export { QuestList } from './client/components/quest-list';
export { QuestCard } from './client/components/quest-card';
export { QuestBuilder } from './client/components/quest-builder';
export { AchievementGrid } from './client/components/achievement-grid';
export { AchievementShowcase } from './client/components/achievement-showcase';
export { AchievementToast } from './client/components/achievement-toast';
export { StreakFlame } from './client/components/streak-flame';
export { StreakCalendar } from './client/components/streak-calendar';
export { LeaderboardTable } from './client/components/leaderboard-table';
export { LeaderboardPodium } from './client/components/leaderboard-podium';
export { LevelProgressBar } from './client/components/level-progress-bar';
export { TierBadge } from './client/components/tier-badge';
export { RewardCatalog } from './client/components/reward-catalog';
export { RewardRedemptionModal } from './client/components/reward-redemption-modal';
export { SeasonBanner } from './client/components/season-banner';
export { SeasonRewardTrack } from './client/components/season-reward-track';
export { EconomicDashboard } from './client/components/economic-dashboard';

// ═══════════════════════════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════════════════════════

export {
  POINT_CURRENCY_CLASSES,
  TRANSACTION_TYPES,
  QUEST_TYPES,
  QUEST_STATUSES,
  ACHIEVEMENT_RARITIES,
  LEADERBOARD_PERIODS,
  DEFAULT_XP_CURVE,
  DEFAULT_STREAK_GRACE_HOURS,
  DEFAULT_DAILY_QUEST_SLOTS,
  MAX_ACTIVE_QUESTS_PER_USER,
  ECONOMIC_INFLATION_THRESHOLD,
  FRAUD_VELOCITY_THRESHOLD,
} from './constants';

// ═══════════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════════

export type {
  // Points
  PointType,
  PointBalance,
  PointTransaction,
  PointCurrencyClass,
  PointTransactionType,
  AwardPointsInput,
  DeductPointsInput,
  TransferPointsInput,
  ConvertToTokensInput,

  // Quests
  Quest,
  QuestType,
  QuestStatus,
  QuestRequirement,
  CompoundRequirement,
  QuestReward,
  UserQuest,
  UserQuestStatus,

  // Achievements
  Achievement,
  AchievementRarity,
  AchievementTier,
  UserAchievement,
  AchievementShowcaseConfig,

  // Streaks
  StreakStatus,
  StreakHistory,
  StreakVelocity,
  StreakFreezeConfig,

  // Leaderboards
  LeaderboardConfig,
  LeaderboardEntry,
  LeaderboardPeriod,
  LeaderboardHistory,
  UserRankInfo,

  // Progression
  LevelConfig,
  UserLevel,
  PrestigeConfig,
  PrestigeStatus,
  TierConfig,
  TierStatus,
  XPCurveParams,

  // Rewards
  Reward,
  RewardCategory,
  RewardRedemption,
  RedemptionStatus,
  RewardStock,

  // Seasons
  Season,
  SeasonStatus,
  SeasonRewardTrack,
  SeasonRewardTier,
  UserSeasonProgress,

  // Earn
  EarnAction,
  EarnEvent,
  EarnRule,
  EarnMultiplier,

  // Events
  EngagementEvent,
  ProcessedEventResult,
  RuleEvaluation,

  // Economic
  EconomicHealth,
  TapSinkReport,
  InflationMetrics,
  MultiplierAdjustment,

  // Fraud
  AnomalyReport,
  FraudAlert,
  FraudAlertSeverity,
} from './types';
```

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                        ENGAGEMENT ENGINE ARCHITECTURE                                    │
│                                                                                          │
│  ┌───────────────────────────────────────────────────────────────────────────────────┐   │
│  │                           VENTURE EXPERIENCE LAYER                                │   │
│  │                                                                                   │   │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐         │   │
│  │  │   BETEDGE    │  │ MCV STUDIOS  │  │  FUTURESTATE │  │  CLIENT APP  │         │   │
│  │  │ (Predictions)│  │   (Gaming)   │  │    (RWA)     │  │ (White-Label)│         │   │
│  │  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘         │   │
│  │         │                 │                 │                 │                   │   │
│  │         └─────────────────┴─────────────────┴─────────────────┘                   │   │
│  │                                    │                                               │   │
│  └────────────────────────────────────┼───────────────────────────────────────────────┘   │
│                                       │                                                   │
│                              ┌────────▼────────┐                                         │
│                              │   Event Bus     │                                         │
│                              │  (Redpanda)     │                                         │
│                              │                 │                                         │
│                              │ mcv.engagement  │                                         │
│                              │ .raw topic      │                                         │
│                              └────────┬────────┘                                         │
│                                       │                                                   │
│  ┌────────────────────────────────────▼───────────────────────────────────────────────┐   │
│  │                        EVENT PROCESSING PIPELINE                                    │   │
│  │                                                                                     │   │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐               │   │
│  │  │    1.       │  │    2.       │  │    3.       │  │    4.       │               │   │
│  │  │  Ingest     │─▶│   Match     │─▶│  Evaluate   │─▶│   Award    │               │   │
│  │  │  Event      │  │   Rules     │  │   Logic     │  │  Rewards   │               │   │
│  │  │             │  │             │  │             │  │             │               │   │
│  │  │ • Validate  │  │ • Earn acts │  │ • Quest     │  │ • Points   │               │   │
│  │  │ • Dedup     │  │ • Quest req │  │   progress  │  │ • XP       │               │   │
│  │  │ • Enrich    │  │ • Achieve   │  │ • Streak    │  │ • Achieve  │               │   │
│  │  │ • Buffer    │  │   criteria  │  │   check     │  │ • Items    │               │   │
│  │  └─────────────┘  └─────────────┘  └─────────────┘  └──────┬──────┘               │   │
│  │                                                             │                       │   │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────▼───────┐               │   │
│  │  │    8.       │  │    7.       │  │    6.       │  │    5.       │               │   │
│  │  │   Scout     │◀─│   Notify    │◀─│  Leaderbd  │◀─│  Persist   │               │   │
│  │  │   (Fraud)   │  │   Client    │  │  Update    │  │  Ledger    │               │   │
│  │  │             │  │             │  │             │  │             │               │   │
│  │  │ • Velocity  │  │ • WebSocket │  │ • Redis    │  │ • Postgres │               │   │
│  │  │ • Anomaly   │  │ • Toast     │  │   ZADD     │  │ • ACID txn │               │   │
│  │  │ • Abuse     │  │ • Confetti  │  │ • Rotation │  │ • Idempt   │               │   │
│  │  │ • Alert     │  │ • Push      │  │ • Snapshot │  │ • Audit    │               │   │
│  │  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘               │   │
│  │                                                                                     │   │
│  └─────────────────────────────────────────────────────────────────────────────────────┘   │
│                                                                                           │
│  ┌─────────────────────────────────────────────────────────────────────────────────────┐   │
│  │                        SUBMODULE ENGINES                                             │   │
│  │                                                                                      │   │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐   │   │
│  │  │  POINTS  │ │  QUESTS  │ │ ACHIEVE  │ │  STREAK  │ │PROGRESS  │ │ LEADER-  │   │   │
│  │  │  ENGINE  │ │  ENGINE  │ │  ENGINE  │ │  ENGINE  │ │  ENGINE  │ │  BOARDS  │   │   │
│  │  │          │ │          │ │          │ │          │ │          │ │          │   │   │
│  │  │ Multi-   │ │ JSON     │ │ Rarity   │ │ Grace    │ │ XP Curve │ │ Redis    │   │   │
│  │  │ currency │ │ Logic    │ │ tiers    │ │ periods  │ │ Leveling │ │ ZSET     │   │   │
│  │  │ ACID txn │ │ rules    │ │ NFT mint │ │ Freezes  │ │ Prestige │ │ Real-    │   │   │
│  │  │ Caps     │ │ Chains   │ │ Showcase │ │ Velocity │ │ Tiers    │ │ time     │   │   │
│  │  └──────────┘ └──────────┘ └──────────┘ └──────────┘ └──────────┘ └──────────┘   │   │
│  │                                                                                      │   │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐                                            │   │
│  │  │ REWARDS  │ │ SEASONS  │ │   EARN   │                                            │   │
│  │  │ ENGINE   │ │ ENGINE   │ │  ENGINE  │                                            │   │
│  │  │          │ │          │ │          │                                            │   │
│  │  │ Catalog  │ │ Reward   │ │ Action → │                                            │   │
│  │  │ Redeem   │ │ tracks   │ │ Point    │                                            │   │
│  │  │ Fulfill  │ │ Exclusive│ │ mapping  │                                            │   │
│  │  │ Token    │ │ Time-box │ │ Multipli │                                            │   │
│  │  └──────────┘ └──────────┘ └──────────┘                                            │   │
│  │                                                                                      │   │
│  └──────────────────────────────────────────────────────────────────────────────────────┘   │
│                                                                                           │
│  ┌──────────────────────────────────────────────────────────────────────────────────────┐  │
│  │                        ECONOMIC MONITORING LAYER                                      │  │
│  │                                                                                       │  │
│  │  ┌─────────────────────┐ ┌─────────────────────┐ ┌─────────────────────────────┐    │  │
│  │  │  Tap / Sink         │ │  Inflation Control   │ │  ACS v2.0 (Auto-Calibrate) │    │  │
│  │  │  Dashboard          │ │  (WoW Monitoring)    │ │  Regime Scaling Engine      │    │  │
│  │  │                     │ │                      │ │                             │    │  │
│  │  │  Inflow:  Quests,   │ │  If Net > 15% WoW:  │ │  • Reduce multipliers 0.2x │    │  │
│  │  │  Earn, Referrals    │ │  → Activate ACS      │ │  • Increase sink costs 10% │    │  │
│  │  │  Outflow: Freezes,  │ │  If Net < -5% WoW:  │ │  • Introduce bonus taps    │    │  │
│  │  │  Cosmetics, Convert │ │  → Boost events      │ │  • Recalibrate weekly      │    │  │
│  │  └─────────────────────┘ └─────────────────────┘ └─────────────────────────────┘    │  │
│  │                                                                                       │  │
│  └───────────────────────────────────────────────────────────────────────────────────────┘  │
│                                                                                           │
│  ┌──────────────────────────────────────────────────────────────────────────────────────┐  │
│  │                        STORAGE & INFRASTRUCTURE                                       │  │
│  │                                                                                       │  │
│  │  ┌────────────────┐  ┌────────────────┐  ┌────────────────┐  ┌──────────────────┐   │  │
│  │  │   PostgreSQL   │  │     Redis      │  │   Redpanda     │  │   Solana/EDGE    │   │  │
│  │  │   (Supabase)   │  │   (Upstash)    │  │   (Event Bus)  │  │   (Token Bridge) │   │  │
│  │  │                │  │                │  │                │  │                  │   │  │
│  │  │ Point ledger   │  │ Leaderboard    │  │ Event stream   │  │ Point → Token    │   │  │
│  │  │ Quest state    │  │ ZSET rankings  │  │ Engagement     │  │ NFT minting      │   │  │
│  │  │ Achievements   │  │ Streak cache   │  │ events topic   │  │ Achievement NFT  │   │  │
│  │  │ Seasons        │  │ Rate limits    │  │ Dead letter    │  │ Reward tokens    │   │  │
│  │  └────────────────┘  └────────────────┘  └────────────────┘  └──────────────────┘   │  │
│  │                                                                                       │  │
│  └───────────────────────────────────────────────────────────────────────────────────────┘  │
│                                                                                           │
└───────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## Psychological Foundations

The Engagement Engine is not just a point tracker — it is a **Behavioral Operating System** calibrated to satisfy core human psychological needs.

### Self-Determination Theory (SDT)

Every mechanic in the engine must map to one of the three SDT drivers:

| Need | Definition | Engine Implementation |
|------|------------|-----------------------|
| **Autonomy** | Choice & Control | Path-based Quest Chains, Customizable Goals, Reward Catalog selection |
| **Competence** | Mastery & Growth | XP Progress Bars, Skill Badges, Tier Levels, Prestige resets |
| **Relatedness** | Connection | Team Guilds, Social Leaderboards, Referral quests, Community achievements |

### Octalysis Core Drive Mapping

The engine balances "White Hat" (long-term meaning) and "Black Hat" (urgency) drives:

| Drive | Type | Engine Feature |
|-------|------|----------------|
| Drive 1: Epic Meaning | White Hat | Governance participation, Community milestones |
| Drive 2: Accomplishment | White Hat | Level progression, Achievement unlocks, Tier advancement |
| Drive 3: Empowerment | White Hat | Quest Builder (no-code), Custom goals, Season strategy |
| Drive 5: Social Influence | — | Leaderboards, Team achievements, Referral chains |
| Drive 6: Scarcity | Black Hat | Seasonal exclusivity, Limited-supply achievements, Time-limited quests |
| Drive 7: Unpredictability | Black Hat | Hidden achievements, Random bonus multipliers, Mystery rewards |
| Drive 8: Loss Avoidance | Black Hat | Streak protection, Expiring points, Season end countdowns |

### Fogg Behavior Model (B = MAT)

The `Trigger Engine` classifies notifications based on the user's current Motivation and Ability:

| Trigger Type | Condition | Example |
|-------------|-----------|---------|
| **Spark** | High ability, Low motivation | "Your streak is about to break! Tap to save it." |
| **Facilitator** | High motivation, Low ability | "One-tap daily check-in — no action required!" |
| **Signal** | High motivation, High ability | "New weekly quest available: Place 3 predictions." |

---

## Core Interfaces

### EngagementEvent

The universal event schema consumed by the engagement pipeline from all ventures:

```typescript
interface EngagementEvent {
  // ═══════════════════════════════════════════════════════════════════════════
  // IDENTITY
  // ═══════════════════════════════════════════════════════════════════════════

  /** Unique event ID (UUID v7 for time-ordered sorting) */
  id: string;

  /** Venture that emitted the event */
  ventureId: string;

  /** User who performed the action */
  userId: string;

  // ═══════════════════════════════════════════════════════════════════════════
  // EVENT DATA
  // ═══════════════════════════════════════════════════════════════════════════

  /** Event type identifier (e.g., 'bet.placed', 'game.finish', 'doc.signed') */
  type: string;

  /** Event payload */
  payload: {
    /** Numeric value associated with the action (bet amount, score, etc.) */
    amount?: number;

    /** Sub-category for filtering */
    category?: string;

    /** Tags for quest matching */
    tags: string[];

    /** Arbitrary venture-specific metadata */
    metadata: Record<string, unknown>;
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // TIMING
  // ═══════════════════════════════════════════════════════════════════════════

  /** ISO-8601 timestamp */
  timestamp: string;

  /** Idempotency key (prevents duplicate processing) */
  idempotencyKey: string;
}
```

### PointType

```typescript
interface PointType {
  id: string;
  slug: string;                         // 'xp', 'edge_points', 'energy', 'coins'
  name: string;                         // Display name
  description: string | null;

  // Currency classification
  currencyClass: PointCurrencyClass;    // 'soft' | 'hard' | 'medium' | 'energy' | 'social' | 'event' | 'token'
  decimals: number;                     // Decimal places (0 for integers)

  // Limits
  maxBalance: string | null;            // Maximum balance cap
  dailyEarnCap: string | null;          // Daily earn limit
  regenerationRate: string | null;      // Auto-regen per hour (energy systems)
  maxRegeneration: string | null;       // Max regen cap

  // Token bridge
  economyId: string | null;             // Link to token economy
  conversionRate: string | null;        // Points per token
  isConvertible: boolean;               // Can convert to on-chain tokens

  // Display
  iconUrl: string | null;
  color: string | null;

  // Multi-tenant
  tenantId: string | null;             // null = platform-wide currency

  createdAt: Date;
  updatedAt: Date;
}

type PointCurrencyClass =
  | 'soft'      // Freely earned, freely spent (XP, Coins)
  | 'hard'      // Premium / purchased (Gems, Crystals)
  | 'medium'    // Earned slowly, spent on premium items
  | 'energy'    // Regenerating resource (Stamina, Action Points)
  | 'social'    // Earned through social actions (Reputation, Karma)
  | 'event'     // Event-specific, temporary currencies
  | 'token';    // Blockchain-backed (EDGE tokens)
```

### PointBalance

```typescript
interface PointBalance {
  id: string;
  userId: string;
  pointTypeId: string;
  tenantId: string | null;

  // Current state
  available: string;                    // Spendable balance (decimal string)
  pending: string;                      // Awaiting confirmation
  locked: string;                       // Locked (staking, escrow)

  // Lifetime metrics
  lifetimeEarned: string;
  lifetimeSpent: string;
  lifetimeExpired: string;

  // Daily tracking
  dailyEarned: string;
  dailyResetAt: Date | null;

  // Regeneration
  lastRegenerationAt: Date | null;
  lastTransactionAt: Date | null;

  createdAt: Date;
  updatedAt: Date;
}
```

### PointTransaction

```typescript
interface PointTransaction {
  id: string;
  balanceId: string;
  userId: string;
  pointTypeId: string;
  tenantId: string | null;

  // Transaction details
  transactionType: PointTransactionType;
  amount: string;                       // Positive = credit, Negative = debit

  // Balance snapshot
  balanceBefore: string;
  balanceAfter: string;

  // Source attribution
  sourceType: string;                   // 'quest', 'achievement', 'earn', 'purchase', 'admin', etc.
  sourceId: string | null;
  sourceMetadata: Record<string, unknown> | null;

  // Display
  description: string | null;
  displayMessage: string | null;

  // Expiration
  expiresAt: Date | null;

  // Idempotency
  idempotencyKey: string | null;

  createdAt: Date;
  createdBy: string | null;
}

type PointTransactionType =
  | 'earn'           // Points earned from action
  | 'spend'          // Points spent on reward/item
  | 'transfer_in'    // Received from another user
  | 'transfer_out'   // Sent to another user
  | 'convert'        // Converted to/from tokens
  | 'expire'         // Expired points removed
  | 'adjustment'     // Admin adjustment
  | 'lock'           // Points locked (escrow/staking)
  | 'unlock';        // Points unlocked
```

### Quest

```typescript
interface Quest {
  id: string;
  slug: string;
  name: string;
  description: string | null;

  // Classification
  questType: QuestType;
  category: string | null;
  tags: string[];

  // Lifecycle
  status: QuestStatus;
  startsAt: Date | null;
  endsAt: Date | null;
  recurrenceRule: string | null;         // iCal RRULE for recurring quests

  // Requirements (JSON Logic)
  requirements: QuestRequirement;
  compoundRequirements: CompoundRequirement | null;

  // Rewards on completion
  rewards: QuestReward;

  // Display
  iconUrl: string | null;
  bannerUrl: string | null;
  color: string | null;
  displayOrder: number | null;

  // Difficulty
  difficultyLevel: number;              // 1-5 difficulty rating
  estimatedDurationMinutes: number | null;
  xpValue: number | null;

  // Targeting
  tierRequirement: number | null;       // Minimum user tier to see this quest
  segmentFilters: Record<string, unknown> | null;

  // Chain / Sequence
  parentQuestId: string | null;          // Parent in quest chain
  prerequisiteQuestIds: string[];        // Must complete these first
  sequenceOrder: number | null;

  // Completion limits
  maxCompletionsPerUser: number | null;  // null = unlimited
  maxCompletionsGlobal: number | null;   // Limited supply quests
  cooldownHours: number | null;          // Cooldown between completions

  // Multi-tenant
  tenantId: string | null;
  metadata: Record<string, unknown> | null;

  createdAt: Date;
  updatedAt: Date;
  createdBy: string | null;
}

type QuestType =
  | 'daily'          // Resets every 24 hours
  | 'weekly'         // Resets every 7 days
  | 'monthly'        // Resets every 30 days
  | 'seasonal'       // Active only during a season
  | 'milestone'      // One-time permanent achievement
  | 'chain'          // Multi-step sequential quest
  | 'hidden'         // Discovered through gameplay
  | 'community'      // Collaborative group objective
  | 'onboarding';    // New user tutorial quests

type QuestStatus =
  | 'draft'          // Being authored
  | 'scheduled'      // Waiting for startsAt
  | 'active'         // Live and available
  | 'paused'         // Temporarily disabled
  | 'completed'      // All slots filled
  | 'expired'        // Past endsAt
  | 'archived';      // No longer visible

interface QuestRequirement {
  action: string;                       // Event type to match (e.g., 'bet.placed')
  target: number;                       // Count required for completion
  filters?: Record<string, unknown>;    // Additional matching criteria
}

interface CompoundRequirement {
  operator: 'and' | 'or';
  conditions: Array<QuestRequirement | CompoundRequirement>;
}

interface QuestReward {
  points: Array<{ type: string; amount: number }>;
  achievements?: string[];              // Achievement slugs to unlock
  items?: Array<{ itemId: string; quantity: number }>;
  xp?: number;
  multiplier?: { type: string; value: number; durationHours: number };
}
```

### Achievement

```typescript
interface Achievement {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  flavorText: string | null;             // Lore/narrative text

  // Classification
  category: string;                      // 'explorer', 'social', 'mastery', etc.
  subcategory: string | null;
  rarity: AchievementRarity;

  // Requirements
  requirements: Record<string, unknown>;  // JSON Logic criteria
  tiers: AchievementTier[] | null;       // Multi-tier (Bronze → Silver → Gold)
  rewards: QuestReward;
  xpValue: number;

  // Display
  iconUrl: string | null;
  lockedIconUrl: string | null;
  animationUrl: string | null;           // Unlock animation (Lottie/Rive)
  color: string | null;

  // NFT integration
  nftEnabled: boolean;
  nftCollectionId: string | null;
  nftMetadata: Record<string, unknown> | null;

  // Visibility
  isHidden: boolean;                     // Hidden until discovered
  isSecret: boolean;                     // Never shown in list (surprise)
  displayOrder: number | null;
  showProgress: boolean;                 // Show progress bar before unlock

  // Supply
  prerequisiteAchievements: string[];    // Must unlock these first
  totalSupply: number | null;            // Limited supply (FOMO)
  currentHolders: number;

  // Multi-tenant
  tenantId: string | null;
  metadata: Record<string, unknown> | null;

  createdAt: Date;
  updatedAt: Date;
}

type AchievementRarity =
  | 'common'       // 60%+ of users earn it
  | 'uncommon'     // 30-60% of users
  | 'rare'         // 10-30% of users
  | 'epic'         // 3-10% of users
  | 'legendary'    // <3% of users
  | 'mythic';      // <0.5% — near impossible

interface AchievementTier {
  tier: number;                          // 1 = Bronze, 2 = Silver, 3 = Gold
  name: string;
  target: number;
  rewards: QuestReward;
  iconUrl?: string;
}
```

### UserAchievement

```typescript
interface UserAchievement {
  id: string;
  userId: string;
  achievementId: string;

  // Progress
  isUnlocked: boolean;
  currentTier: number;                   // Current tier level (0 = not started)
  currentProgress: string;
  targetProgress: string | null;

  // Timestamps
  unlockedAt: Date | null;
  progressStartedAt: Date;

  // Rewards
  rewardsClaimed: boolean;
  rewardsClaimedAt: Date | null;

  // NFT
  nftMinted: boolean;
  nftMintAddress: string | null;
  nftMintedAt: Date | null;

  // Profile showcase
  isShowcased: boolean;
  showcaseOrder: number | null;

  tenantId: string | null;
  createdAt: Date;
  updatedAt: Date;
}
```

### StreakStatus

```typescript
interface StreakStatus {
  currentStreak: number;                 // Current consecutive days
  longestStreak: number;                 // All-time record
  lastActivityAt: Date;                  // Most recent qualifying activity
  expiresAt: Date;                       // When current streak expires
  freezesAvailable: number;              // Freeze tokens remaining
  freezesUsed: number;                   // Freezes used this period
  isAtRisk: boolean;                     // True if <4 hours remaining
  graceHoursRemaining: number;           // Grace period hours left
  velocity: StreakVelocity;              // 7-day activity pattern
}

interface StreakVelocity {
  /** Rolling 7-day activity count */
  activeDaysLast7: number;

  /** Average activities per day (7-day window) */
  avgActivitiesPerDay: number;

  /** Velocity trend: accelerating, stable, decelerating */
  trend: 'accelerating' | 'stable' | 'decelerating';

  /** Days since velocity peak */
  daysSincePeak: number;
}
```

### LeaderboardConfig

```typescript
interface LeaderboardConfig {
  id: string;
  slug: string;                          // 'top-winners', 'xp-grinders', etc.
  name: string;
  description: string | null;

  // Scoring
  scoreType: 'cumulative' | 'snapshot' | 'average' | 'max';
  scoreSource: string;                   // Point type slug or computed metric

  // Time periods
  period: LeaderboardPeriod;
  rotationSchedule: string | null;       // Cron expression

  // Scope
  ventureId: string | null;              // null = global
  teamBased: boolean;                    // Individual vs team

  // Display
  displayLimit: number;                  // Max entries shown (default: 100)
  showPercentile: boolean;
  anonymizeOutsideTop: number | null;    // Anonymize ranks below N

  // Rewards
  rewardTiers: Array<{
    rankFrom: number;
    rankTo: number;
    rewards: QuestReward;
  }> | null;

  tenantId: string | null;
  createdAt: Date;
  updatedAt: Date;
}

type LeaderboardPeriod = 'daily' | 'weekly' | 'monthly' | 'seasonal' | 'all-time';

interface LeaderboardEntry {
  rank: number;
  userId: string;
  displayName: string;
  avatarUrl: string | null;
  score: number;
  previousRank: number | null;          // For rank change indicators
  meta: Record<string, unknown>;
}

interface UserRankInfo {
  rank: number;
  score: number;
  percentile: number;                   // 0-100
  totalParticipants: number;
  surrounding: LeaderboardEntry[];      // Players around user's rank
}
```

### Season

```typescript
interface Season {
  id: string;
  slug: string;
  name: string;                          // "Season 3: Rise of the Phoenix"
  description: string | null;
  themeColor: string | null;
  bannerUrl: string | null;

  // Duration
  startsAt: Date;
  endsAt: Date;
  status: SeasonStatus;

  // Reward track
  rewardTrack: SeasonRewardTier[];
  exclusiveAchievements: string[];       // Season-only achievements

  // XP multiplier during season
  xpMultiplier: number;                  // e.g., 1.5x during season

  // Requirements
  entryFee: { pointType: string; amount: number } | null;  // Optional buy-in
  minimumTier: number | null;

  // Multi-tenant
  tenantId: string | null;
  metadata: Record<string, unknown> | null;

  createdAt: Date;
  updatedAt: Date;
}

type SeasonStatus = 'upcoming' | 'active' | 'ending_soon' | 'ended' | 'archived';

interface SeasonRewardTier {
  tier: number;                          // 1, 2, 3, ... N
  name: string;                          // "Bronze", "Silver", "Gold"
  xpRequired: number;                   // XP threshold for this tier
  rewards: QuestReward;
  isExclusive: boolean;                  // Only available during this season
}

interface UserSeasonProgress {
  seasonId: string;
  userId: string;
  currentXP: number;
  currentTier: number;
  claimedTiers: number[];               // Tiers already claimed
  rank: number;
  isActive: boolean;
}
```

### EarnAction

```typescript
interface EarnAction {
  id: string;
  slug: string;
  name: string;                          // Display name: "Daily Login", "Place a Bet"
  description: string | null;

  // Event matching
  eventType: string;                     // Redpanda event type to match
  filters: Record<string, unknown>;      // Additional filters

  // Reward mapping
  pointTypeSlug: string;                 // Which currency to award
  baseAmount: number;                    // Base points awarded
  multiplierRules: EarnMultiplier[];     // Conditional multipliers

  // Limits
  maxPerDay: number | null;              // Max awards per day per user
  maxPerWeek: number | null;
  cooldownMinutes: number | null;        // Minimum time between awards

  // Status
  isActive: boolean;
  startsAt: Date | null;
  endsAt: Date | null;

  tenantId: string | null;
  createdAt: Date;
  updatedAt: Date;
}

interface EarnMultiplier {
  condition: Record<string, unknown>;    // JSON Logic condition
  multiplier: number;                    // e.g., 2.0 for double points
  label: string;                         // "Weekend Bonus", "First of Day"
}
```

### EconomicHealth

```typescript
interface EconomicHealth {
  ventureId: string;
  period: string;                        // 'daily' | 'weekly' | 'monthly'

  // Inflows (Taps)
  totalInflow: number;                   // Total points created
  inflowBreakdown: Array<{
    source: string;                      // 'quest', 'earn', 'referral', 'admin'
    amount: number;
    count: number;
  }>;

  // Outflows (Sinks)
  totalOutflow: number;                  // Total points destroyed
  outflowBreakdown: Array<{
    sink: string;                        // 'freeze', 'cosmetic', 'convert', 'expire'
    amount: number;
    count: number;
  }>;

  // Health metrics
  netInflation: number;                  // (inflow - outflow) / total_supply
  weekOverWeekChange: number;            // WoW inflation change %
  healthScore: number;                   // 0-100 composite score
  regime: 'healthy' | 'inflationary' | 'deflationary' | 'critical';

  // ACS status
  acsActive: boolean;                    // Auto-Calibration System active
  currentMultiplier: number;             // Active earn multiplier (1.0 = normal)
  sinkCostAdjustment: number;            // Sink cost modifier (1.0 = normal)

  timestamp: Date;
}
```

---

## Database Schema

### engagement.point_types Table

```typescript
export const pointTypes = engagementSchema.table(
  'point_types',
  {
    // ═══════════════════════════════════════════════════════════════════════════
    // PRIMARY KEY
    // ═══════════════════════════════════════════════════════════════════════════

    id: uuid('id').primaryKey().defaultRandom(),

    // ═══════════════════════════════════════════════════════════════════════════
    // IDENTITY
    // ═══════════════════════════════════════════════════════════════════════════

    slug: text('slug').notNull(),
    name: text('name').notNull(),
    description: text('description'),
    currencyClass: pointCurrencyClassEnum('currency_class').notNull(),
    decimals: integer('decimals').default(0),

    // ═══════════════════════════════════════════════════════════════════════════
    // LIMITS & REGENERATION
    // ═══════════════════════════════════════════════════════════════════════════

    maxBalance: decimal('max_balance', { precision: 20, scale: 4 }),
    dailyEarnCap: decimal('daily_earn_cap', { precision: 20, scale: 4 }),
    regenerationRate: decimal('regeneration_rate', { precision: 10, scale: 4 }),
    maxRegeneration: decimal('max_regeneration', { precision: 20, scale: 4 }),

    // ═══════════════════════════════════════════════════════════════════════════
    // TOKEN BRIDGE
    // ═══════════════════════════════════════════════════════════════════════════

    economyId: uuid('economy_id').references(() => tokenEconomies.id),
    conversionRate: decimal('conversion_rate', { precision: 20, scale: 9 }),
    isConvertible: boolean('is_convertible').default(false),

    // ═══════════════════════════════════════════════════════════════════════════
    // DISPLAY
    // ═══════════════════════════════════════════════════════════════════════════

    iconUrl: text('icon_url'),
    color: text('color'),

    // ═══════════════════════════════════════════════════════════════════════════
    // MULTI-TENANT
    // ═══════════════════════════════════════════════════════════════════════════

    tenantId: uuid('tenant_id').references(() => ventures.id),

    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex('idx_point_types_slug_tenant').on(table.slug, table.tenantId),
  ]
);
```

### engagement.point_balances Table

```typescript
export const pointBalances = engagementSchema.table(
  'point_balances',
  {
    id: uuid('id').primaryKey().defaultRandom(),

    // ═══════════════════════════════════════════════════════════════════════════
    // OWNERSHIP
    // ═══════════════════════════════════════════════════════════════════════════

    userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    pointTypeId: uuid('point_type_id').notNull().references(() => pointTypes.id, { onDelete: 'cascade' }),
    tenantId: uuid('tenant_id').references(() => ventures.id),

    // ═══════════════════════════════════════════════════════════════════════════
    // CURRENT BALANCE
    // ═══════════════════════════════════════════════════════════════════════════

    available: decimal('available', { precision: 20, scale: 4 }).notNull().default('0'),
    pending: decimal('pending', { precision: 20, scale: 4 }).notNull().default('0'),
    locked: decimal('locked', { precision: 20, scale: 4 }).notNull().default('0'),

    // ═══════════════════════════════════════════════════════════════════════════
    // LIFETIME METRICS
    // ═══════════════════════════════════════════════════════════════════════════

    lifetimeEarned: decimal('lifetime_earned', { precision: 20, scale: 4 }).default('0'),
    lifetimeSpent: decimal('lifetime_spent', { precision: 20, scale: 4 }).default('0'),
    lifetimeExpired: decimal('lifetime_expired', { precision: 20, scale: 4 }).default('0'),

    // ═══════════════════════════════════════════════════════════════════════════
    // DAILY TRACKING
    // ═══════════════════════════════════════════════════════════════════════════

    dailyEarned: decimal('daily_earned', { precision: 20, scale: 4 }).default('0'),
    dailyResetAt: timestamp('daily_reset_at', { withTimezone: true }),

    // ═══════════════════════════════════════════════════════════════════════════
    // ACTIVITY TRACKING
    // ═══════════════════════════════════════════════════════════════════════════

    lastRegenerationAt: timestamp('last_regeneration_at', { withTimezone: true }),
    lastTransactionAt: timestamp('last_transaction_at', { withTimezone: true }),

    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex('idx_point_balances_user_type_tenant').on(
      table.userId, table.pointTypeId, table.tenantId
    ),
  ]
);
```

### engagement.point_transactions Table

```typescript
export const pointTransactions = engagementSchema.table(
  'point_transactions',
  {
    id: uuid('id').primaryKey().defaultRandom(),

    // ═══════════════════════════════════════════════════════════════════════════
    // REFERENCES
    // ═══════════════════════════════════════════════════════════════════════════

    balanceId: uuid('balance_id').notNull().references(() => pointBalances.id, { onDelete: 'cascade' }),
    userId: uuid('user_id').notNull().references(() => users.id),
    pointTypeId: uuid('point_type_id').notNull().references(() => pointTypes.id),
    tenantId: uuid('tenant_id').references(() => ventures.id),

    // ═══════════════════════════════════════════════════════════════════════════
    // TRANSACTION DATA
    // ═══════════════════════════════════════════════════════════════════════════

    transactionType: pointTransactionTypeEnum('transaction_type').notNull(),
    amount: decimal('amount', { precision: 20, scale: 4 }).notNull(),

    // Balance snapshot (for audit trail)
    balanceBefore: decimal('balance_before', { precision: 20, scale: 4 }).notNull(),
    balanceAfter: decimal('balance_after', { precision: 20, scale: 4 }).notNull(),

    // ═══════════════════════════════════════════════════════════════════════════
    // SOURCE ATTRIBUTION
    // ═══════════════════════════════════════════════════════════════════════════

    sourceType: text('source_type').notNull(),   // 'quest', 'achievement', 'earn', etc.
    sourceId: uuid('source_id'),
    sourceMetadata: jsonb('source_metadata'),

    // Display
    description: text('description'),
    displayMessage: text('display_message'),

    // ═══════════════════════════════════════════════════════════════════════════
    // EXPIRATION & IDEMPOTENCY
    // ═══════════════════════════════════════════════════════════════════════════

    expiresAt: timestamp('expires_at', { withTimezone: true }),
    idempotencyKey: text('idempotency_key').unique(),

    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    createdBy: uuid('created_by').references(() => users.id),
  },
  (table) => [
    index('idx_point_txn_user_created').on(table.userId, table.createdAt),
    index('idx_point_txn_source').on(table.sourceType, table.sourceId),
  ]
);
```

### engagement.quests Table

```typescript
export const quests = engagementSchema.table(
  'quests',
  {
    id: uuid('id').primaryKey().defaultRandom(),

    // ═══════════════════════════════════════════════════════════════════════════
    // IDENTITY
    // ═══════════════════════════════════════════════════════════════════════════

    slug: text('slug').notNull(),
    name: text('name').notNull(),
    description: text('description'),
    questType: questTypeEnum('quest_type').notNull(),
    category: text('category'),
    tags: text('tags').array(),

    // ═══════════════════════════════════════════════════════════════════════════
    // LIFECYCLE
    // ═══════════════════════════════════════════════════════════════════════════

    status: questStatusEnum('status').default('draft'),
    startsAt: timestamp('starts_at', { withTimezone: true }),
    endsAt: timestamp('ends_at', { withTimezone: true }),
    recurrenceRule: text('recurrence_rule'),

    // ═══════════════════════════════════════════════════════════════════════════
    // REQUIREMENTS & REWARDS
    // ═══════════════════════════════════════════════════════════════════════════

    requirements: jsonb('requirements').notNull().default({}),
    compoundRequirements: jsonb('compound_requirements'),
    rewards: jsonb('rewards').notNull().default({}),

    // ═══════════════════════════════════════════════════════════════════════════
    // DISPLAY
    // ═══════════════════════════════════════════════════════════════════════════

    iconUrl: text('icon_url'),
    bannerUrl: text('banner_url'),
    color: text('color'),
    displayOrder: integer('display_order'),

    // ═══════════════════════════════════════════════════════════════════════════
    // DIFFICULTY & TARGETING
    // ═══════════════════════════════════════════════════════════════════════════

    difficultyLevel: integer('difficulty_level').default(1),
    estimatedDurationMinutes: integer('estimated_duration_minutes'),
    xpValue: integer('xp_value'),
    tierRequirement: integer('tier_requirement'),
    segmentFilters: jsonb('segment_filters'),

    // ═══════════════════════════════════════════════════════════════════════════
    // QUEST CHAINS
    // ═══════════════════════════════════════════════════════════════════════════

    parentQuestId: uuid('parent_quest_id'),
    prerequisiteQuestIds: uuid('prerequisite_quest_ids').array(),
    sequenceOrder: integer('sequence_order'),

    // ═══════════════════════════════════════════════════════════════════════════
    // COMPLETION LIMITS
    // ═══════════════════════════════════════════════════════════════════════════

    maxCompletionsPerUser: integer('max_completions_per_user'),
    maxCompletionsGlobal: integer('max_completions_global'),
    cooldownHours: integer('cooldown_hours'),

    // ═══════════════════════════════════════════════════════════════════════════
    // TENANT & METADATA
    // ═══════════════════════════════════════════════════════════════════════════

    tenantId: uuid('tenant_id').references(() => ventures.id),
    metadata: jsonb('metadata'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
    createdBy: uuid('created_by').references(() => users.id),
  },
  (table) => [
    uniqueIndex('idx_quests_slug_tenant').on(table.slug, table.tenantId),
    index('idx_quests_active').on(table.startsAt, table.endsAt),
  ]
);
```

### engagement.user_quests Table

```typescript
export const userQuests = engagementSchema.table(
  'user_quests',
  {
    id: uuid('id').primaryKey().defaultRandom(),

    // ═══════════════════════════════════════════════════════════════════════════
    // REFERENCES
    // ═══════════════════════════════════════════════════════════════════════════

    userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    questId: uuid('quest_id').notNull().references(() => quests.id, { onDelete: 'cascade' }),

    // ═══════════════════════════════════════════════════════════════════════════
    // PROGRESS
    // ═══════════════════════════════════════════════════════════════════════════

    status: text('status').default('active'),
    currentProgress: decimal('current_progress', { precision: 20, scale: 4 }).default('0'),
    targetProgress: decimal('target_progress', { precision: 20, scale: 4 }).notNull(),
    compoundProgress: jsonb('compound_progress'),

    // ═══════════════════════════════════════════════════════════════════════════
    // LIFECYCLE
    // ═══════════════════════════════════════════════════════════════════════════

    startedAt: timestamp('started_at', { withTimezone: true }).defaultNow(),
    completedAt: timestamp('completed_at', { withTimezone: true }),
    claimedAt: timestamp('claimed_at', { withTimezone: true }),
    expiresAt: timestamp('expires_at', { withTimezone: true }),

    // ═══════════════════════════════════════════════════════════════════════════
    // REWARDS
    // ═══════════════════════════════════════════════════════════════════════════

    rewardsClaimed: jsonb('rewards_claimed'),
    bonusApplied: jsonb('bonus_applied'),
    completionCount: integer('completion_count').default(0),

    tenantId: uuid('tenant_id').references(() => ventures.id),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index('idx_user_quests_active').on(table.userId, table.status),
  ]
);
```

### engagement.achievements Table

```typescript
export const achievements = engagementSchema.table(
  'achievements',
  {
    id: uuid('id').primaryKey().defaultRandom(),

    // ═══════════════════════════════════════════════════════════════════════════
    // IDENTITY
    // ═══════════════════════════════════════════════════════════════════════════

    slug: text('slug').notNull(),
    name: text('name').notNull(),
    description: text('description'),
    flavorText: text('flavor_text'),
    category: text('category').notNull(),
    subcategory: text('subcategory'),
    rarity: achievementRarityEnum('rarity').default('common'),

    // ═══════════════════════════════════════════════════════════════════════════
    // REQUIREMENTS & REWARDS
    // ═══════════════════════════════════════════════════════════════════════════

    requirements: jsonb('requirements').notNull().default({}),
    tiers: jsonb('tiers'),
    rewards: jsonb('rewards').notNull().default({}),
    xpValue: integer('xp_value').default(0),

    // ═══════════════════════════════════════════════════════════════════════════
    // DISPLAY
    // ═══════════════════════════════════════════════════════════════════════════

    iconUrl: text('icon_url'),
    lockedIconUrl: text('locked_icon_url'),
    animationUrl: text('animation_url'),
    color: text('color'),

    // ═══════════════════════════════════════════════════════════════════════════
    // NFT INTEGRATION
    // ═══════════════════════════════════════════════════════════════════════════

    nftEnabled: boolean('nft_enabled').default(false),
    nftCollectionId: uuid('nft_collection_id').references(() => nftCollections.id),
    nftMetadata: jsonb('nft_metadata'),

    // ═══════════════════════════════════════════════════════════════════════════
    // VISIBILITY & SUPPLY
    // ═══════════════════════════════════════════════════════════════════════════

    isHidden: boolean('is_hidden').default(false),
    isSecret: boolean('is_secret').default(false),
    displayOrder: integer('display_order'),
    showProgress: boolean('show_progress').default(true),
    prerequisiteAchievements: uuid('prerequisite_achievements').array(),
    totalSupply: integer('total_supply'),
    currentHolders: integer('current_holders').default(0),

    // ═══════════════════════════════════════════════════════════════════════════
    // TENANT
    // ═══════════════════════════════════════════════════════════════════════════

    tenantId: uuid('tenant_id').references(() => ventures.id),
    metadata: jsonb('metadata'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex('idx_achievements_slug_tenant').on(table.slug, table.tenantId),
  ]
);
```

### engagement.user_achievements Table

```typescript
export const userAchievements = engagementSchema.table(
  'user_achievements',
  {
    id: uuid('id').primaryKey().defaultRandom(),

    // ═══════════════════════════════════════════════════════════════════════════
    // REFERENCES
    // ═══════════════════════════════════════════════════════════════════════════

    userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    achievementId: uuid('achievement_id').notNull().references(() => achievements.id, { onDelete: 'cascade' }),

    // ═══════════════════════════════════════════════════════════════════════════
    // PROGRESS & UNLOCK
    // ═══════════════════════════════════════════════════════════════════════════

    isUnlocked: boolean('is_unlocked').default(false),
    currentTier: integer('current_tier').default(0),
    currentProgress: decimal('current_progress', { precision: 20, scale: 4 }).default('0'),
    targetProgress: decimal('target_progress', { precision: 20, scale: 4 }),
    unlockedAt: timestamp('unlocked_at', { withTimezone: true }),
    progressStartedAt: timestamp('progress_started_at', { withTimezone: true }).defaultNow(),

    // ═══════════════════════════════════════════════════════════════════════════
    // REWARDS & NFT
    // ═══════════════════════════════════════════════════════════════════════════

    rewardsClaimed: boolean('rewards_claimed').default(false),
    rewardsClaimedAt: timestamp('rewards_claimed_at', { withTimezone: true }),
    nftMinted: boolean('nft_minted').default(false),
    nftMintAddress: text('nft_mint_address'),
    nftMintedAt: timestamp('nft_minted_at', { withTimezone: true }),

    // ═══════════════════════════════════════════════════════════════════════════
    // SHOWCASE
    // ═══════════════════════════════════════════════════════════════════════════

    isShowcased: boolean('is_showcased').default(false),
    showcaseOrder: integer('showcase_order'),

    tenantId: uuid('tenant_id').references(() => ventures.id),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex('idx_user_achievements_user_achievement').on(table.userId, table.achievementId),
    index('idx_user_achievements_unlocked').on(table.userId, table.isUnlocked),
  ]
);
```

### Document Engagement Tables (engagement.ts)

The document engagement schema tracks view events, engagement scores, interactive pricing, and client notifications for invoices, proposals, and estimates:

```typescript
// ═══════════════════════════════════════════════════════════════════════════════
// DOCUMENT VIEW EVENTS — tracks per-view analytics
// ═══════════════════════════════════════════════════════════════════════════════

export const documentViewEvents = pgTable('document_view_events', {
  id: uuid('id').primaryKey().defaultRandom(),
  ventureId: uuid('venture_id').references(() => ventures.id, { onDelete: 'cascade' }).notNull(),
  entityType: engagementEntityTypeEnum('entity_type').notNull(),   // 'invoice' | 'proposal' | 'estimate'
  entityId: uuid('entity_id').notNull(),
  viewerEmail: text('viewer_email'),
  viewerIp: text('viewer_ip'),
  viewerUserAgent: text('viewer_user_agent'),
  sessionId: text('session_id'),
  sections: jsonb('sections').$type<ViewSectionData[]>(),         // Per-section dwell time
  totalDurationMs: integer('total_duration_ms').default(0),
  pageCount: integer('page_count').default(1),
  pagesViewed: integer('pages_viewed').default(1),
  deviceType: viewerDeviceTypeEnum('device_type'),                // 'desktop' | 'tablet' | 'mobile'
  location: jsonb('location').$type<ViewerLocation>(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
}, (table) => [
  index('doc_view_venture_idx').on(table.ventureId),
  index('doc_view_entity_idx').on(table.entityType, table.entityId),
  index('doc_view_email_idx').on(table.viewerEmail),
  index('doc_view_session_idx').on(table.sessionId),
  index('doc_view_created_idx').on(table.createdAt),
]);

// ═══════════════════════════════════════════════════════════════════════════════
// ENGAGEMENT SCORES — aggregated engagement per document
// ═══════════════════════════════════════════════════════════════════════════════

export const engagementScores = pgTable('engagement_scores', {
  id: uuid('id').primaryKey().defaultRandom(),
  ventureId: uuid('venture_id').references(() => ventures.id, { onDelete: 'cascade' }).notNull(),
  entityType: engagementEntityTypeEnum('entity_type').notNull(),
  entityId: uuid('entity_id').notNull(),
  totalViews: integer('total_views').default(0),
  uniqueViewers: integer('unique_viewers').default(0),
  totalDurationMs: integer('total_duration_ms').default(0),
  avgDurationMs: integer('avg_duration_ms').default(0),
  maxDurationMs: integer('max_duration_ms').default(0),
  mostViewedSection: text('most_viewed_section'),
  leastViewedSection: text('least_viewed_section'),
  score: integer('score').default(0),          // Composite 0-100 engagement score
  firstViewedAt: timestamp('first_viewed_at', { withTimezone: true }),
  lastViewedAt: timestamp('last_viewed_at', { withTimezone: true }),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
}, (table) => [
  index('engagement_score_venture_idx').on(table.ventureId),
  uniqueIndex('engagement_score_entity_idx').on(table.entityType, table.entityId),
  index('engagement_score_score_idx').on(table.score),
]);

// ═══════════════════════════════════════════════════════════════════════════════
// CLIENT NOTIFICATIONS — engagement-triggered notifications
// ═══════════════════════════════════════════════════════════════════════════════

export const clientNotifications = pgTable('client_notifications', {
  id: uuid('id').primaryKey().defaultRandom(),
  ventureId: uuid('venture_id').references(() => ventures.id, { onDelete: 'cascade' }).notNull(),
  entityType: engagementEntityTypeEnum('entity_type').notNull(),
  entityId: uuid('entity_id').notNull(),
  type: clientNotificationTypeEnum('type').notNull(),
  // Types: 'first_view' | 'repeat_view' | 'high_engagement' | 'low_engagement' |
  //        'selection_made' | 'signature_started' | 'link_clicked'
  recipientUserId: uuid('recipient_user_id').notNull(),
  message: text('message').notNull(),
  metadata: jsonb('metadata').$type<Record<string, unknown>>(),
  readAt: timestamp('read_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
}, (table) => [
  index('client_notif_venture_idx').on(table.ventureId),
  index('client_notif_recipient_idx').on(table.recipientUserId),
  index('client_notif_read_idx').on(table.readAt),
  index('client_notif_created_idx').on(table.createdAt),
]);
```

### Reputation Management Tables (reputation.ts)

The reputation schema handles review platform connections, synced reviews, AI-generated responses, embeddable widgets, competitor tracking, and analytics snapshots:

```typescript
// ═══════════════════════════════════════════════════════════════════════════════
// REVIEW PLATFORM CONNECTIONS
// ═══════════════════════════════════════════════════════════════════════════════

export const reviewPlatformConnections = pgTable('review_platforms', {
  id: uuid('id').primaryKey().defaultRandom(),
  ventureId: uuid('venture_id').notNull().references(() => ventures.id, { onDelete: 'cascade' }),
  platform: text('platform', { enum: reviewPlatforms }).notNull(),
  // Platforms: 'google' | 'facebook' | 'yelp' | 'trustpilot' | 'g2' | 'capterra' | 'custom'
  accountId: text('account_id').notNull(),
  accessToken: text('access_token').notNull(),
  refreshToken: text('refresh_token'),
  businessName: text('business_name').notNull(),
  businessUrl: text('business_url'),
  placeId: text('place_id'),
  isActive: boolean('is_active').default(true).notNull(),
  lastSyncAt: timestamp('last_sync_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  index('idx_review_platforms_venture').on(table.ventureId),
  uniqueIndex('idx_review_platforms_venture_account').on(table.ventureId, table.platform, table.accountId),
]);

// ═══════════════════════════════════════════════════════════════════════════════
// REVIEWS — synced reviews from all platforms
// ═══════════════════════════════════════════════════════════════════════════════

export const reviews = pgTable('reviews', {
  id: uuid('id').primaryKey().defaultRandom(),
  ventureId: uuid('venture_id').notNull().references(() => ventures.id, { onDelete: 'cascade' }),
  platformId: uuid('platform_id').notNull().references(() => reviewPlatformConnections.id, { onDelete: 'cascade' }),
  externalId: text('external_id').notNull(),
  platform: text('platform', { enum: reviewPlatforms }).notNull(),
  reviewerName: text('reviewer_name'),
  reviewerAvatarUrl: text('reviewer_avatar_url'),
  rating: integer('rating').notNull(),
  title: text('title'),
  body: text('body'),
  response: text('response'),
  responseDate: timestamp('response_date', { withTimezone: true }),
  respondedBy: uuid('responded_by').references(() => users.id, { onDelete: 'set null' }),
  sentiment: text('sentiment', { enum: reviewSentiments }).notNull(),
  // Sentiments: 'positive' | 'neutral' | 'negative'
  sentimentScore: real('sentiment_score'),
  keywords: jsonb('keywords').$type<string[]>().default([]),
  isVerified: boolean('is_verified').default(false).notNull(),
  isFeatured: boolean('is_featured').default(false).notNull(),
  contactId: uuid('contact_id').references(() => contacts.id, { onDelete: 'set null' }),
  publishedAt: timestamp('published_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  index('idx_reviews_venture').on(table.ventureId),
  index('idx_reviews_rating').on(table.rating),
  index('idx_reviews_sentiment').on(table.sentiment),
  uniqueIndex('idx_reviews_external').on(table.platformId, table.externalId),
]);

// ═══════════════════════════════════════════════════════════════════════════════
// REVIEW ANALYTICS SNAPSHOTS — daily historical metrics
// ═══════════════════════════════════════════════════════════════════════════════

export const reviewAnalyticsSnapshots = pgTable('review_analytics_snapshots', {
  id: uuid('id').primaryKey().defaultRandom(),
  ventureId: uuid('venture_id').notNull().references(() => ventures.id, { onDelete: 'cascade' }),
  date: date('date').notNull(),
  platform: text('platform').notNull(),
  avgRating: real('avg_rating').notNull(),
  totalReviews: integer('total_reviews').notNull(),
  newReviews: integer('new_reviews').notNull(),
  responseRate: real('response_rate').notNull(),
  avgResponseTime: real('avg_response_time').notNull(),   // Hours
  sentimentBreakdown: jsonb('sentiment_breakdown').$type<SentimentBreakdown>().notNull(),
  ratingDistribution: jsonb('rating_distribution').$type<RatingDistribution>().notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  uniqueIndex('idx_review_snapshots_venture_date_platform').on(table.ventureId, table.date, table.platform),
]);
```

### Schema Enums Summary

```typescript
// Points & Currency
type PointCurrencyClass = 'soft' | 'hard' | 'medium' | 'energy' | 'social' | 'event' | 'token';
type PointTransactionType = 'earn' | 'spend' | 'transfer_in' | 'transfer_out' | 'convert' | 'expire' | 'adjustment' | 'lock' | 'unlock';

// Quests
type QuestType = 'daily' | 'weekly' | 'monthly' | 'seasonal' | 'milestone' | 'chain' | 'hidden' | 'community' | 'onboarding';
type QuestStatus = 'draft' | 'scheduled' | 'active' | 'paused' | 'completed' | 'expired' | 'archived';

// Achievements
type AchievementRarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary' | 'mythic';

// Document Engagement
type EngagementEntityType = 'invoice' | 'proposal' | 'estimate';
type ViewerDeviceType = 'desktop' | 'tablet' | 'mobile';
type ClientNotificationType = 'first_view' | 'repeat_view' | 'high_engagement' | 'low_engagement' | 'selection_made' | 'signature_started' | 'link_clicked';

// Reviews
type ReviewPlatform = 'google' | 'facebook' | 'yelp' | 'trustpilot' | 'g2' | 'capterra' | 'custom';
type ReviewSentiment = 'positive' | 'neutral' | 'negative';
type RequestChannel = 'email' | 'sms';
type RequestStatus = 'pending' | 'sent' | 'opened' | 'completed' | 'expired';
type ResponseStatus = 'draft' | 'approved' | 'published' | 'rejected';
```

---

## Usage Examples

### Points & Currency Management

```typescript
import { awardPoints, getBalance, getAllBalances, deductPoints, convertToTokens } from '@mcv/engagement';

// ═══════════════════════════════════════════════════════════════════════════════
// EXAMPLE 1: Award points with idempotency
// ═══════════════════════════════════════════════════════════════════════════════

const txn = await awardPoints({
  userId: 'user-uuid-123',
  ventureId: 'betedge-uuid',
  pointTypeSlug: 'xp',
  amount: 100,
  sourceType: 'quest',
  sourceId: 'quest-uuid-456',
  idempotencyKey: `quest:${questId}:${userId}:${completionId}`,
  displayMessage: '🎯 Quest completed: Place 5 Predictions',
});

console.log(`Awarded: ${txn.amount} XP`);
console.log(`New balance: ${txn.balanceAfter}`);
console.log(`Lifetime earned: ${txn.balance.lifetimeEarned}`);

// ═══════════════════════════════════════════════════════════════════════════════
// EXAMPLE 2: Get all balances for a user
// ═══════════════════════════════════════════════════════════════════════════════

const balances = await getAllBalances({
  userId: 'user-uuid-123',
  ventureId: 'betedge-uuid',
});

for (const balance of balances) {
  console.log(`${balance.pointType.name}: ${balance.available} (lifetime: ${balance.lifetimeEarned})`);
}
// Output:
// "XP: 2,450 (lifetime: 12,300)"
// "EDGE Points: 850 (lifetime: 3,200)"
// "Energy: 5/10 (regenerates 1/hr)"

// ═══════════════════════════════════════════════════════════════════════════════
// EXAMPLE 3: Deduct points (sink operation)
// ═══════════════════════════════════════════════════════════════════════════════

try {
  const deduction = await deductPoints({
    userId: 'user-uuid-123',
    ventureId: 'betedge-uuid',
    pointTypeSlug: 'edge_points',
    amount: 100,
    sourceType: 'streak_freeze',
    displayMessage: '❄️ Streak freeze purchased',
  });
  console.log(`Deducted: ${deduction.amount} EDGE Points`);
} catch (error) {
  if (error.code === 'ENG_002') {
    console.error('Insufficient points for streak freeze');
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// EXAMPLE 4: Convert points to on-chain tokens
// ═══════════════════════════════════════════════════════════════════════════════

const conversion = await convertToTokens({
  userId: 'user-uuid-123',
  ventureId: 'betedge-uuid',
  pointTypeSlug: 'edge_points',
  amount: 1000,
  targetWallet: 'So1anaWa11etAddr3ss...',
});

console.log(`Converted: ${conversion.pointsSpent} EDGE Points → ${conversion.tokensReceived} EDGE tokens`);
console.log(`Solana TX: ${conversion.transactionSignature}`);
```

### Quest Engine

```typescript
import { createQuest, listActiveQuests, claimQuestReward } from '@mcv/engagement';

// ═══════════════════════════════════════════════════════════════════════════════
// EXAMPLE 5: Create a quest with JSON Logic rules
// ═══════════════════════════════════════════════════════════════════════════════

const quest = await createQuest({
  ventureId: 'betedge-uuid',
  slug: 'daily-predictor',
  name: 'Daily Predictor',
  description: 'Place 5 predictions today to earn bonus XP',
  questType: 'daily',
  category: 'predictions',
  tags: ['daily', 'predictions', 'beginner'],
  difficultyLevel: 1,
  estimatedDurationMinutes: 30,
  xpValue: 50,

  requirements: {
    action: 'bet.placed',
    target: 5,
    filters: { category: 'prediction' },
  },

  rewards: {
    points: [
      { type: 'xp', amount: 50 },
      { type: 'edge_points', amount: 25 },
    ],
    achievements: ['daily-grinder'],
  },

  status: 'active',
  startsAt: new Date(),
  recurrenceRule: 'FREQ=DAILY;BYHOUR=0;BYMINUTE=0',
});

console.log(`Created quest: ${quest.name} (${quest.slug})`);

// ═══════════════════════════════════════════════════════════════════════════════
// EXAMPLE 6: Create a compound quest chain
// ═══════════════════════════════════════════════════════════════════════════════

// Step 1: Place your first bet
const step1 = await createQuest({
  ventureId: 'betedge-uuid',
  slug: 'onboarding-first-bet',
  name: 'The First Move',
  questType: 'chain',
  sequenceOrder: 1,
  requirements: { action: 'bet.placed', target: 1 },
  rewards: { points: [{ type: 'xp', amount: 100 }] },
  status: 'active',
});

// Step 2: Win a bet
const step2 = await createQuest({
  ventureId: 'betedge-uuid',
  slug: 'onboarding-first-win',
  name: 'Winners Circle',
  questType: 'chain',
  sequenceOrder: 2,
  parentQuestId: step1.id,
  prerequisiteQuestIds: [step1.id],
  requirements: { action: 'bet.won', target: 1 },
  rewards: {
    points: [{ type: 'xp', amount: 250 }],
    achievements: ['first-blood'],
  },
  status: 'active',
});

// ═══════════════════════════════════════════════════════════════════════════════
// EXAMPLE 7: List active quests with progress
// ═══════════════════════════════════════════════════════════════════════════════

const quests = await listActiveQuests({
  userId: 'user-uuid-123',
  ventureId: 'betedge-uuid',
  type: 'daily',
  includeCompleted: false,
});

for (const q of quests) {
  const pct = Math.round((q.current / q.target) * 100);
  console.log(`${q.title}: ${q.current}/${q.target} (${pct}%) — ${q.status}`);
  if (q.status === 'completed' && !q.claimedAt) {
    console.log(`  → Ready to claim: ${q.rewards.map(r => `${r.amount} ${r.type}`).join(', ')}`);
  }
}
// Output:
// "Daily Predictor: 3/5 (60%) — active"
// "Share a Prediction: 1/1 (100%) — completed"
//   "→ Ready to claim: 25 xp, 10 edge_points"
```

### Achievement System

```typescript
import { getUserAchievements, mintAchievementNFT, setShowcaseAchievements } from '@mcv/engagement';

// ═══════════════════════════════════════════════════════════════════════════════
// EXAMPLE 8: Get user achievement profile
// ═══════════════════════════════════════════════════════════════════════════════

const profile = await getUserAchievements({
  userId: 'user-uuid-123',
  ventureId: 'betedge-uuid',
  includeProgress: true,
});

console.log(`Unlocked: ${profile.unlocked.length} / ${profile.total}`);
console.log(`Rarity breakdown:`);
console.log(`  Common: ${profile.rarityBreakdown.common}`);
console.log(`  Rare: ${profile.rarityBreakdown.rare}`);
console.log(`  Legendary: ${profile.rarityBreakdown.legendary}`);
console.log(`  Mythic: ${profile.rarityBreakdown.mythic}`);

for (const ach of profile.inProgress) {
  console.log(`🔓 ${ach.name} (${ach.rarity}): ${ach.currentProgress}/${ach.targetProgress}`);
}
// Output:
// "🔓 Sharp Eye (epic): 3/5 correct NBA predictions in 48h"
// "🔓 Iron Streak (legendary): 25/30 day streak"

// ═══════════════════════════════════════════════════════════════════════════════
// EXAMPLE 9: Mint achievement as NFT
// ═══════════════════════════════════════════════════════════════════════════════

const nft = await mintAchievementNFT({
  userId: 'user-uuid-123',
  achievementId: 'ach-uuid-456',
  targetWallet: 'So1anaWa11etAddr3ss...',
});

console.log(`NFT minted: ${nft.mintAddress}`);
console.log(`Collection: ${nft.collectionName}`);
console.log(`Metadata URI: ${nft.metadataUri}`);
```

### Streaks & Habit Loops

```typescript
import { getStreakStatus, recordStreakActivity, useStreakFreeze } from '@mcv/engagement';

// ═══════════════════════════════════════════════════════════════════════════════
// EXAMPLE 10: Check streak status with velocity
// ═══════════════════════════════════════════════════════════════════════════════

const streak = await getStreakStatus({
  userId: 'user-uuid-123',
  ventureId: 'betedge-uuid',
  streakType: 'daily-login',
});

console.log(`🔥 Current streak: ${streak.currentStreak} days`);
console.log(`📈 Longest streak: ${streak.longestStreak} days`);
console.log(`⏰ Expires at: ${streak.expiresAt.toLocaleString()}`);
console.log(`❄️ Freezes available: ${streak.freezesAvailable}`);
console.log(`⚠️ At risk: ${streak.isAtRisk}`);
console.log(`📊 Velocity: ${streak.velocity.avgActivitiesPerDay}/day (${streak.velocity.trend})`);

if (streak.isAtRisk) {
  console.log(`⚡ Only ${streak.graceHoursRemaining}h left! Complete an activity or use a freeze.`);
}

// ═══════════════════════════════════════════════════════════════════════════════
// EXAMPLE 11: Record activity and use freeze
// ═══════════════════════════════════════════════════════════════════════════════

// Record daily activity to maintain streak
const result = await recordStreakActivity({
  userId: 'user-uuid-123',
  ventureId: 'betedge-uuid',
  streakType: 'daily-login',
  activityType: 'app_open',
});

console.log(`Streak extended to: ${result.newStreak} days`);
if (result.milestoneReached) {
  console.log(`🎉 Milestone: ${result.milestoneReached.name}! +${result.milestoneReached.bonusXP} XP`);
}

// Use a streak freeze when you can't play
const freeze = await useStreakFreeze({
  userId: 'user-uuid-123',
  ventureId: 'betedge-uuid',
  streakType: 'daily-login',
});

console.log(`❄️ Freeze activated. Streak protected for 24h.`);
console.log(`Freezes remaining: ${freeze.freezesRemaining}`);
```

### Leaderboards & Competition

```typescript
import { getRankings, getUserRank, createLeaderboard } from '@mcv/engagement';

// ═══════════════════════════════════════════════════════════════════════════════
// EXAMPLE 12: Real-time leaderboard with Redis
// ═══════════════════════════════════════════════════════════════════════════════

const topPlayers = await getRankings({
  slug: 'top-predictors',
  ventureId: 'betedge-uuid',
  period: 'weekly',
  limit: 10,
  offset: 0,
});

console.log('🏆 Weekly Top Predictors:');
for (const entry of topPlayers) {
  const change = entry.previousRank
    ? (entry.previousRank > entry.rank ? '↑' : entry.previousRank < entry.rank ? '↓' : '—')
    : '🆕';
  console.log(`  #${entry.rank} ${change} ${entry.displayName}: ${entry.score} pts`);
}

// Get user's position
const myRank = await getUserRank({
  slug: 'top-predictors',
  ventureId: 'betedge-uuid',
  userId: 'user-uuid-123',
  period: 'weekly',
});

console.log(`\nYour rank: #${myRank.rank} (top ${myRank.percentile}%)`);
console.log(`Score: ${myRank.score}`);
console.log(`Players around you:`);
for (const neighbor of myRank.surrounding) {
  console.log(`  #${neighbor.rank} ${neighbor.displayName}: ${neighbor.score}`);
}
```

### Seasons & Reward Tracks

```typescript
import { createSeason, getSeasonProgress, claimSeasonReward } from '@mcv/engagement';

// ═══════════════════════════════════════════════════════════════════════════════
// EXAMPLE 13: Create a season with reward track
// ═══════════════════════════════════════════════════════════════════════════════

const season = await createSeason({
  ventureId: 'betedge-uuid',
  slug: 'season-3-phoenix',
  name: 'Season 3: Rise of the Phoenix',
  description: 'Compete for exclusive rewards and the Phoenix Crown achievement.',
  themeColor: '#FF6B35',
  bannerUrl: 'https://cdn.mcv.one/seasons/s3-banner.webp',
  startsAt: new Date('2026-03-01T00:00:00Z'),
  endsAt: new Date('2026-05-31T23:59:59Z'),
  xpMultiplier: 1.5,
  rewardTrack: [
    { tier: 1, name: 'Bronze',   xpRequired: 500,   rewards: { points: [{ type: 'edge_points', amount: 100 }] }, isExclusive: false },
    { tier: 2, name: 'Silver',   xpRequired: 2000,  rewards: { points: [{ type: 'edge_points', amount: 500 }] }, isExclusive: false },
    { tier: 3, name: 'Gold',     xpRequired: 5000,  rewards: { points: [{ type: 'edge_points', amount: 1500 }], achievements: ['season-3-gold'] }, isExclusive: true },
    { tier: 4, name: 'Platinum', xpRequired: 10000, rewards: { points: [{ type: 'edge_points', amount: 5000 }], achievements: ['phoenix-crown'] }, isExclusive: true },
  ],
  exclusiveAchievements: ['season-3-gold', 'phoenix-crown'],
});

console.log(`Season created: ${season.name}`);
console.log(`Duration: ${season.startsAt.toDateString()} → ${season.endsAt.toDateString()}`);

// ═══════════════════════════════════════════════════════════════════════════════
// EXAMPLE 14: Get user's season progress
// ═══════════════════════════════════════════════════════════════════════════════

const progress = await getSeasonProgress({
  userId: 'user-uuid-123',
  ventureId: 'betedge-uuid',
});

console.log(`Season: ${progress.seasonName}`);
console.log(`XP: ${progress.currentXP} / ${progress.nextTierXP}`);
console.log(`Current tier: ${progress.currentTierName} (Tier ${progress.currentTier})`);
console.log(`Rank: #${progress.rank}`);
console.log(`Days remaining: ${progress.daysRemaining}`);
console.log(`Unclaimed tiers: ${progress.unclaimedTiers.length}`);
```

### Event Processing Pipeline

```typescript
import { processEngagementEvent, evaluateRules, EngagementProcessor } from '@mcv/engagement';

// ═══════════════════════════════════════════════════════════════════════════════
// EXAMPLE 15: Process an engagement event through the pipeline
// ═══════════════════════════════════════════════════════════════════════════════

const result = await processEngagementEvent({
  id: 'evt-uuid-789',
  ventureId: 'betedge-uuid',
  userId: 'user-uuid-123',
  type: 'bet.placed',
  payload: {
    amount: 50,
    category: 'nba',
    tags: ['prediction', 'nba', 'live'],
    metadata: {
      matchId: 'match-uuid',
      team: 'Lakers',
      odds: 2.5,
    },
  },
  timestamp: new Date().toISOString(),
  idempotencyKey: 'bet:bet-uuid-abc:placed',
});

console.log('Event processing results:');
console.log(`  Points awarded: ${result.pointsAwarded.map(p => `${p.amount} ${p.type}`).join(', ')}`);
console.log(`  XP gained: ${result.xpGained}`);
console.log(`  Quests progressed: ${result.questsProgressed.length}`);
console.log(`  Quests completed: ${result.questsCompleted.length}`);
console.log(`  Achievements unlocked: ${result.achievementsUnlocked.length}`);
console.log(`  Streak maintained: ${result.streakMaintained}`);
console.log(`  Leaderboards updated: ${result.leaderboardsUpdated.length}`);

for (const quest of result.questsProgressed) {
  console.log(`  📋 ${quest.name}: ${quest.currentProgress}/${quest.targetProgress}`);
}
for (const achievement of result.achievementsUnlocked) {
  console.log(`  🏆 Achievement unlocked: ${achievement.name} (${achievement.rarity})`);
}
```

### Client-Side Usage (React)

```tsx
import {
  usePoints,
  useQuests,
  useStreak,
  useLeaderboard,
  useProgression,
} from '@mcv/engagement/client';

import {
  PointsDisplay,
  QuestList,
  StreakFlame,
  LeaderboardTable,
  LevelProgressBar,
  AchievementToast,
} from '@mcv/engagement/client';

// ═══════════════════════════════════════════════════════════════════════════════
// EXAMPLE 16: Engagement dashboard page
// ═══════════════════════════════════════════════════════════════════════════════

function EngagementDashboard({ ventureId }: { ventureId: string }) {
  const { balances, isLoading: pointsLoading } = usePoints(ventureId);
  const { quests, claim, isLoading: questsLoading } = useQuests(ventureId, 'daily');
  const { streak } = useStreak(ventureId, 'daily-login');
  const { level, xp, nextLevelXP } = useProgression(ventureId);

  return (
    <div className="space-y-6">
      {/* Level & XP */}
      <div className="flex items-center gap-4">
        <LevelProgressBar level={level} xp={xp} nextLevelXP={nextLevelXP} />
        <StreakFlame
          currentStreak={streak?.currentStreak ?? 0}
          isAtRisk={streak?.isAtRisk ?? false}
          freezesAvailable={streak?.freezesAvailable ?? 0}
        />
      </div>

      {/* Point Balances */}
      <div className="grid grid-cols-3 gap-4">
        {balances.map((b) => (
          <PointsDisplay
            key={b.pointType.slug}
            name={b.pointType.name}
            amount={b.available}
            icon={b.pointType.iconUrl}
            color={b.pointType.color}
          />
        ))}
      </div>

      {/* Daily Quests */}
      <QuestList
        quests={quests}
        onClaim={(questId) => claim(questId)}
        isLoading={questsLoading}
      />

      {/* Achievement toast (auto-shows on unlock via WebSocket) */}
      <AchievementToast ventureId={ventureId} />
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// EXAMPLE 17: Leaderboard page with real-time updates
// ═══════════════════════════════════════════════════════════════════════════════

function LeaderboardPage({ ventureId }: { ventureId: string }) {
  const [period, setPeriod] = useState<'daily' | 'weekly' | 'all-time'>('weekly');
  const { rankings, myRank, isLoading } = useLeaderboard(ventureId, 'top-predictors', period);

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        {(['daily', 'weekly', 'all-time'] as const).map((p) => (
          <Button
            key={p}
            variant={period === p ? 'default' : 'outline'}
            onClick={() => setPeriod(p)}
          >
            {p.charAt(0).toUpperCase() + p.slice(1)}
          </Button>
        ))}
      </div>

      {myRank && (
        <Card className="bg-primary/5 border-primary">
          <CardContent className="flex items-center justify-between p-4">
            <span>Your Rank: #{myRank.rank}</span>
            <span>Score: {myRank.score.toLocaleString()}</span>
            <span>Top {myRank.percentile}%</span>
          </CardContent>
        </Card>
      )}

      <LeaderboardTable
        entries={rankings}
        highlightUserId={myRank?.userId}
        isLoading={isLoading}
      />
    </div>
  );
}
```

### Economic Monitoring

```typescript
import { getEconomicHealth, getTapSinkReport, adjustMultipliers } from '@mcv/engagement';

// ═══════════════════════════════════════════════════════════════════════════════
// EXAMPLE 18: Monitor economic health and auto-calibrate
// ═══════════════════════════════════════════════════════════════════════════════

const health = await getEconomicHealth({
  ventureId: 'betedge-uuid',
  period: 'weekly',
});

console.log(`Economic Health Score: ${health.healthScore}/100 (${health.regime})`);
console.log(`Net Inflation: ${(health.netInflation * 100).toFixed(1)}%`);
console.log(`WoW Change: ${(health.weekOverWeekChange * 100).toFixed(1)}%`);
console.log(`ACS Active: ${health.acsActive}`);
console.log(`Current Multiplier: ${health.currentMultiplier}x`);

// Tap/Sink breakdown
console.log('\nInflows (Taps):');
for (const tap of health.inflowBreakdown) {
  console.log(`  ${tap.source}: ${tap.amount.toLocaleString()} pts (${tap.count} events)`);
}
console.log('\nOutflows (Sinks):');
for (const sink of health.outflowBreakdown) {
  console.log(`  ${sink.sink}: ${sink.amount.toLocaleString()} pts (${sink.count} events)`);
}

// Auto-calibrate if inflationary
if (health.regime === 'inflationary') {
  const adjustment = await adjustMultipliers({
    ventureId: 'betedge-uuid',
    strategy: 'auto',   // ACS v2.0 algorithm
  });
  console.log(`\n⚠️ ACS activated: multiplier reduced to ${adjustment.newMultiplier}x`);
  console.log(`Sink costs increased by ${adjustment.sinkCostIncrease}%`);
}
```

---

## Real-Time Subscriptions (WebSockets)

Ventures can subscribe to real-time updates to trigger UI animations without polling:

### onProgressUpdate

```typescript
interface ProgressUpdate {
  type: 'quest_progress' | 'point_earned' | 'achievement_unlocked' | 'level_up' | 'streak_extended' | 'season_tier_reached';
  id: string;
  message: string;
  payload: {
    newProgress?: number;
    amountAdded?: number;
    newTotal: number;
    achievementRarity?: AchievementRarity;
    newLevel?: number;
    newStreak?: number;
    seasonTier?: number;
  };
  animation?: 'confetti' | 'fireworks' | 'glow' | 'shake' | 'none';
  sound?: 'achievement' | 'levelup' | 'coins' | 'streak' | 'none';
}
```

### Event Subscription Example

```typescript
// Server-side WebSocket handler
engagement.onProgressUpdate(userId, ventureId, (update) => {
  switch (update.type) {
    case 'achievement_unlocked':
      ws.send(JSON.stringify({
        type: 'toast',
        title: '🏆 Achievement Unlocked!',
        message: update.message,
        animation: update.animation,
        sound: update.sound,
      }));
      break;

    case 'level_up':
      ws.send(JSON.stringify({
        type: 'modal',
        title: `Level ${update.payload.newLevel}!`,
        message: update.message,
        animation: 'fireworks',
      }));
      break;

    case 'quest_progress':
      ws.send(JSON.stringify({
        type: 'progress',
        questId: update.id,
        progress: update.payload.newProgress,
      }));
      break;
  }
});
```

---

## Rule Engine (JSON Logic)

Quest and achievement logic is defined using serializable JSON Logic predicates, allowing product managers to update mechanics without code changes.

### Rule Structure

```typescript
interface RuleDefinition {
  rule: JsonLogicRule;
  action: {
    increment?: string;          // Point type slug to increment
    value?: number;              // Amount
    setProgress?: number;        // Set quest progress directly
    unlockAchievement?: string;  // Achievement slug to unlock
    awardMultiplier?: {
      type: string;
      value: number;
      durationHours: number;
    };
  };
}
```

### Example Rules

```json
// Rule: "The High Roller" — Award 500 XP for bets over $1000
{
  "rule": {
    "and": [
      { "==": [{ "var": "type" }, "bet.placed"] },
      { ">": [{ "var": "payload.amount" }, 1000] },
      { "==": [{ "var": "ventureId" }, "uuid-betedge"] }
    ]
  },
  "action": {
    "increment": "xp",
    "value": 500
  }
}

// Rule: "Weekend Warrior" — 2x multiplier on weekends
{
  "rule": {
    "and": [
      { "in": [{ "var": "dayOfWeek" }, [0, 6]] },
      { "==": [{ "var": "type" }, "bet.placed"] }
    ]
  },
  "action": {
    "awardMultiplier": {
      "type": "xp",
      "value": 2.0,
      "durationHours": 24
    }
  }
}

// Rule: "Sharp Eye" — Unlock achievement after 5 correct NBA predictions
{
  "rule": {
    "and": [
      { "==": [{ "var": "type" }, "bet.won"] },
      { "==": [{ "var": "payload.category" }, "nba"] },
      { ">=": [{ "var": "aggregated.nba_wins_48h" }, 5] }
    ]
  },
  "action": {
    "unlockAchievement": "sharp-eye"
  }
}
```

---

## Leaderboard Implementation (Redis)

### Sorted Set Architecture

Rankings are stored in Redis **Sorted Sets (ZSETs)** for sub-50ms ranking updates:

```
Key format: lb:{ventureId}:{slug}:{period}

Example:  lb:betedge-uuid:top-predictors:weekly
          lb:betedge-uuid:xp-grinders:daily
          lb:mcv:global-reputation:all-time
```

### Redis Operations

```bash
# Add/Update a user's score
ZADD lb:betedge-uuid:top-predictors:weekly 1500 "user-uuid-123"

# Get user's rank (0-indexed, lowest = best for ZRANK, so use ZREVRANK)
ZREVRANK lb:betedge-uuid:top-predictors:weekly "user-uuid-123"

# Get top 10
ZREVRANGE lb:betedge-uuid:top-predictors:weekly 0 9 WITHSCORES

# Get total participants
ZCARD lb:betedge-uuid:top-predictors:weekly

# Get user's percentile
ZRANK lb:betedge-uuid:top-predictors:weekly "user-uuid-123"
# Percentile = 100 - (rank / ZCARD * 100)
```

### Rotation & Archival

| Period | TTL | Rotation Schedule |
|--------|-----|-------------------|
| Daily | 24h | 00:00 UTC daily |
| Weekly | 7d | Sunday 23:59 UTC |
| Monthly | 31d | Last day of month 23:59 UTC |
| Seasonal | Season duration | Season end timestamp |
| All-Time | None | Never rotated |

Before rotation, final scores are snapshotted to the `eng_leaderboard_history` Postgres table for historical lookup and season reward distribution.

---

## Progression System

### XP Curve

The leveling system uses a polynomial curve for exponential difficulty scaling:

```
XP Required = base × level^exponent + (level × linear_increment)

Default parameters:
  base = 100
  exponent = 1.8
  linear_increment = 50
```

| Level | XP Required | Cumulative XP | Approx. Time |
|-------|------------|---------------|-------------|
| 1 | 150 | 150 | Day 1 |
| 5 | 650 | 2,150 | Week 1 |
| 10 | 1,800 | 7,950 | Week 2-3 |
| 25 | 8,300 | 58,500 | Month 2 |
| 50 | 27,200 | 310,000 | Month 6 |
| 100 | 92,000 | 2,100,000 | Year 1+ |

### Prestige System

When a user reaches max level (100), they can **Prestige** — resetting to level 1 in exchange for permanent bonuses:

| Prestige | Bonus | Badge |
|----------|-------|-------|
| ⭐ P1 | +5% XP earn rate | Bronze Star |
| ⭐⭐ P2 | +10% XP, +1 daily quest slot | Silver Star |
| ⭐⭐⭐ P3 | +15% XP, +1 freeze, exclusive avatar | Gold Star |
| 🌟 P5 | +25% XP, exclusive title, NFT badge | Diamond Star |
| 💎 P10 | +50% XP, governance weight bonus | Mythic Crown |

### Tier System

Separate from levels, tiers represent long-term engagement milestones:

| Tier | Name | Requirement | Perks |
|------|------|-------------|-------|
| 1 | Newcomer | Account created | Basic access |
| 2 | Regular | 7-day streak + Level 5 | Daily quest slots: 5 |
| 3 | Veteran | 30-day streak + Level 15 | Priority support, 8 quest slots |
| 4 | Elite | Level 30 + 3 Epic achievements | Custom profile, 12 quest slots |
| 5 | Legend | Level 50 + Prestige 1 | All perks, governance voting |

---

## Venture-Specific Configurations

### BetEdge AI

| Mechanic | Implementation |
|----------|---------------|
| Prediction Accuracy Streak | Track consecutive correct predictions per sport |
| Sharp Eye Achievement | 5 correct NBA picks in 48h → Epic badge + NFT |
| High Roller Quest | Place bets totaling $1000+ in a day |
| Tournament Leaderboard | Weekly prediction accuracy rankings |
| SDT Driver | Competence (mastery of prediction skill) |

### MCV Studios

| Mechanic | Implementation |
|----------|---------------|
| Guild War XP | 500 Guild XP per hour during war events |
| Play-to-Earn | EDGE tokens from ranked match performance |
| Season Battle Pass | 90-day season with 50-tier reward track |
| Achievement NFTs | Mint rare gameplay achievements on Solana |
| SDT Driver | Relatedness (team competition & cooperation) |

### FutureState

| Mechanic | Implementation |
|----------|---------------|
| Due Diligence XP | Points for completing RWA research tasks |
| Investor Level | Tier progression based on portfolio activity |
| Community Quests | Collaborative property funding milestones |
| Governance Rewards | Points for DAO vote participation |
| SDT Driver | Autonomy (investment decisions & governance) |

---

## Economic Balancing (Taps & Sinks)

### Tap/Sink Reference Table

| Tap (Inflow) | Avg Points/Day | Sink (Outflow) | Avg Cost |
|--------------|---------------|----------------|----------|
| Daily Login | 10 XP | Streak Freeze | 100 Points |
| Quest Completion | 25-250 XP | Cosmetic Badge | 500 Points |
| Bet Placed | 30 XP | Avatar Frame | 1,000 Points |
| Referral Bonus | 500 XP | Token Convert | 1,000 Points |
| Achievement | 50-1000 XP | Name Color | 2,500 Points |
| Season Tier | 100-5000 XP | Profile Effect | 5,000 Points |
| Event Bonus | Varies | Lootbox | 250 Points |

### Inflation Control (ACS v2.0)

If `Net Inflation > 15% WoW`, the Auto-Calibration System activates:

1. **Reduce earn multipliers** by 0.2x (e.g., 1.0x → 0.8x)
2. **Increase sink costs** by 10%
3. **Introduce bonus sinks** (limited-time cosmetics, flash sales)
4. **Recalibrate weekly** based on rolling 7-day metrics

If `Net Deflation > 5% WoW`, the ACS boosts engagement:

1. **Increase earn multipliers** by 0.1x
2. **Launch bonus events** (double XP weekends)
3. **Reduce entry barriers** (lower quest difficulty)

---

## Performance Considerations

### Latency Targets

| Operation | Target | P95 | P99 |
|-----------|--------|-----|-----|
| Event → Progress Update | < 100ms | < 150ms | < 250ms |
| Point Balance Query | < 50ms | < 80ms | < 120ms |
| Leaderboard Top-N | < 30ms | < 50ms | < 80ms |
| Leaderboard Rank Lookup | < 20ms | < 30ms | < 50ms |
| Quest List (Active) | < 80ms | < 120ms | < 200ms |
| Achievement Unlock | < 100ms | < 150ms | < 250ms |
| Streak Status | < 30ms | < 50ms | < 80ms |
| Token Conversion | < 2s | < 3s | < 5s |

### Throughput

| Metric | Standard | High-Load | Peak (Events) |
|--------|----------|-----------|---------------|
| Events/sec | 1,000 | 5,000 | 10,000 |
| API requests/min | 5,000 | 20,000 | 50,000 |
| Concurrent users | 10,000 | 50,000 | 200,