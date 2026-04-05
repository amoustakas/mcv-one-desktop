# @mcv/token-economy/acs — Automated Contribution Scoring

> **Tier 5 Domain Module** · Publishable · Token Economy
>
> Tracks, scores, and rewards user contributions across the MCV ecosystem with configurable algorithms, decay functions, anti-gaming protections, and transparent score-to-token conversion.

---

## Purpose

The Automated Contribution Scoring (ACS) module is the backbone of MCV's meritocratic token economy. Every meaningful action a user takes — writing code, creating content, referring new members, filing bug reports, helping others in community channels — is captured as a **contribution**, scored against configurable rules, and converted into EDGE token rewards. ACS replaces opaque, subjective reward systems with a fully transparent, auditable scoring engine where every user can see exactly how their score was calculated and why.

ACS is designed to incentivize **sustained, high-quality participation** rather than one-time bursts. Through decay functions, contributions lose value over time, ensuring that leaderboards reflect active contributors rather than historical ones. Streak multipliers reward consistency, while quality gates and peer review prevent gaming. The system is intentionally hostile to Sybil attacks, spam contributions, and any form of score manipulation — because if the scoring system can be gamed, the entire token economy loses credibility.

The module operates at both the global platform level and the per-venture level. Each venture can define its own scoring rules, multipliers, and conversion rates while inheriting sensible defaults from the platform configuration. This allows a developer-focused venture to weight code contributions heavily while a content-focused venture emphasizes articles and tutorials — all within the same unified scoring infrastructure. Leaderboards, score breakdowns, and conversion histories are available through both the API and real-time event streams.

---

## Exports

```typescript
// @mcv/token-economy/acs

// ── Core Service ────────────────────────────────────────────────────────────
export { ACSService } from './services/acs.service';
export { ScoringEngine } from './services/scoring-engine.service';
export { DecayEngine } from './services/decay-engine.service';
export { LeaderboardService } from './services/leaderboard.service';
export { ConversionService } from './services/conversion.service';
export { AppealService } from './services/appeal.service';
export { AntiGamingService } from './services/anti-gaming.service';
export { ContributionIngestionService } from './services/contribution-ingestion.service';

// ── Interfaces ──────────────────────────────────────────────────────────────
export type {
  Contribution,
  ContributionInput,
  ContributionCategory,
  ContributionType,
  ContributionMetadata,
  ContributionSource,
  ContributionStatus,
} from './interfaces/contribution.interface';

export type {
  ScoringRule,
  ScoringRuleInput,
  ScoringFormula,
  WeightConfig,
  CategoryWeights,
  QualityGate,
} from './interfaces/scoring-rule.interface';

export type {
  Score,
  ScoreBreakdown,
  ScoreComponent,
  ScoreSnapshot,
  UserScore,
  CategoryScore,
} from './interfaces/score.interface';

export type {
  Leaderboard,
  LeaderboardEntry,
  LeaderboardQuery,
  LeaderboardWindow,
  LeaderboardScope,
} from './interfaces/leaderboard.interface';

export type {
  DecayFunction,
  DecayConfig,
  DecayType,
  DecayApplication,
  DecaySchedule,
} from './interfaces/decay.interface';

export type {
  ConversionRate,
  ConversionRequest,
  ConversionResult,
  ConversionHistory,
  ConversionBatch,
} from './interfaces/conversion.interface';

export type {
  Multiplier,
  MultiplierType,
  MultiplierConfig,
  StreakConfig,
  BonusConfig,
} from './interfaces/multiplier.interface';

export type {
  Appeal,
  AppealInput,
  AppealStatus,
  AppealResolution,
  ManualAdjustment,
} from './interfaces/appeal.interface';

export type {
  AntiGamingConfig,
  VelocityLimit,
  SybilCheckResult,
  QualityGateResult,
  FraudSignal,
} from './interfaces/anti-gaming.interface';

// ── Schemas (Drizzle ORM) ───────────────────────────────────────────────────
export {
  contributions,
  scoringRules,
  userScores,
  leaderboardSnapshots,
  scoreConversions,
  appeals,
  contributionCategories,
  multiplierConfigs,
  decayConfigs,
  velocityLimits,
  fraudSignals,
} from './schemas';

// ── Events ──────────────────────────────────────────────────────────────────
export {
  ACS_EVENTS,
  ContributionRecordedEvent,
  ScoreCalculatedEvent,
  ScoreDecayedEvent,
  LeaderboardUpdatedEvent,
  ConversionCompletedEvent,
  AppealFiledEvent,
  AppealResolvedEvent,
  FraudDetectedEvent,
  MultiplierAppliedEvent,
} from './events';

// ── Error Codes ─────────────────────────────────────────────────────────────
export { ACS_ERRORS } from './errors';

// ── Constants ───────────────────────────────────────────────────────────────
export {
  DEFAULT_SCORING_RULES,
  DEFAULT_DECAY_CONFIG,
  DEFAULT_VELOCITY_LIMITS,
  DEFAULT_MULTIPLIERS,
  CONTRIBUTION_CATEGORIES,
  LEADERBOARD_WINDOWS,
} from './constants';

// ── Utilities ───────────────────────────────────────────────────────────────
export { calculateScore } from './utils/score-calculator';
export { applyDecay } from './utils/decay-applicator';
export { validateContribution } from './utils/contribution-validator';
export { buildLeaderboardQuery } from './utils/leaderboard-query-builder';
export { formatScoreBreakdown } from './utils/score-formatter';
```

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        CONTRIBUTION SOURCES                                  │
│                                                                              │
│   ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐    │
│   │  GitHub   │  │  CMS /   │  │ Referral │  │Community │  │  Manual  │    │
│   │ Webhooks  │  │ Content  │  │  Links   │  │  Events  │  │  Admin   │    │
│   └─────┬────┘  └─────┬────┘  └─────┬────┘  └─────┬────┘  └─────┬────┘    │
│         │              │              │              │              │         │
└─────────┼──────────────┼──────────────┼──────────────┼──────────────┼────────┘
          │              │              │              │              │
          ▼              ▼              ▼              ▼              ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                     CONTRIBUTION INGESTION LAYER                             │
│                                                                              │
│   ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────────────┐    │
│   │   Validation &   │  │   Deduplication  │  │   Anti-Gaming Filter    │    │
│   │   Normalization  │──│   & Idempotency  │──│   (Velocity + Sybil)    │    │
│   └─────────────────┘  └─────────────────┘  └────────────┬────────────┘    │
│                                                            │                 │
└────────────────────────────────────────────────────────────┼─────────────────┘
                                                             │
                                                             ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                          SCORING ENGINE                                      │
│                                                                              │
│   ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│   │  Base Score   │  │   Quality    │  │  Multiplier  │  │   Category   │  │
│   │  Calculation  │──│   Gates      │──│   Engine     │──│   Weights    │  │
│   │              │  │              │  │              │  │              │  │
│   │ rule.formula │  │ min_quality  │  │ streak, bonus│  │ per-venture  │  │
│   │ (points)     │  │ peer_review  │  │ first-time   │  │ adjustable   │  │
│   └──────────────┘  └──────────────┘  └──────────────┘  └──────┬───────┘  │
│                                                                  │          │
└──────────────────────────────────────────────────────────────────┼──────────┘
                                                                   │
                                                                   ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                           SCORE STORAGE                                      │
│                                                                              │
│   ┌────────────────────┐  ┌─────────────────────┐  ┌────────────────────┐  │
│   │   user_scores       │  │  score_breakdowns    │  │  score_history     │  │
│   │   (current state)   │  │  (per-category)      │  │  (audit trail)     │  │
│   └─────────┬──────────┘  └──────────┬──────────┘  └─────────┬──────────┘  │
│             │                        │                        │              │
└─────────────┼────────────────────────┼────────────────────────┼──────────────┘
              │                        │                        │
              ▼                        ▼                        ▼
┌─────────────────────────────┐  ┌─────────────────────────────────────────────┐
│       DECAY ENGINE          │  │              LEADERBOARD ENGINE              │
│                             │  │                                              │
│  ┌───────────┐              │  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  │
│  │Exponential│  Scheduled   │  │  │  Weekly   │  │ Monthly  │  │All-Time  │  │
│  │ Linear    │  cron-based  │  │  │  Window   │  │  Window  │  │  Window  │  │
│  │ Step      │  decay runs  │  │  └──────────┘  └──────────┘  └──────────┘  │
│  └───────────┘              │  │                                              │
│                             │  │  ┌──────────┐  ┌──────────┐                │
└──────────────┬──────────────┘  │  │  Global   │  │Per-Venture│                │
               │                 │  │  Scope    │  │  Scope   │                │
               │                 │  └──────────┘  └──────────┘                │
               │                 └──────────────────────┬──────────────────────┘
               │                                        │
               ▼                                        ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                      TOKEN CONVERSION ENGINE                                 │
│                                                                              │
│   ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────────────┐ │
│   │  Conversion Rate  │  │  Batch Processing │  │  Ledger Integration     │ │
│   │  (configurable    │  │  (scheduled or    │  │  (@mcv/token-economy/   │ │
│   │   per-venture)    │──│   on-demand)      │──│   ledger)               │ │
│   └──────────────────┘  └──────────────────┘  └──────────────────────────┘ │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘
```

### Data Flow Summary

1. **Ingest** — Contributions arrive from external sources (GitHub webhooks, CMS events, referral tracking, community platforms) or manual admin entry. Each is validated, deduplicated, and checked against anti-gaming filters.
2. **Score** — The scoring engine applies the matching `ScoringRule` for the contribution type, runs quality gates, applies multipliers (streak, first-contribution, venture-specific), and applies category weights to produce a final score.
3. **Store** — Scores are persisted to `user_scores` with full breakdown by category. Every score change is logged to the audit trail for transparency.
4. **Decay** — A scheduled process applies decay functions to all active scores. Decay type (exponential, linear, step) and parameters are configurable per venture.
5. **Leaderboard** — Leaderboard snapshots are computed from current scores, filtered by time window (weekly, monthly, all-time) and scope (global, per-venture).
6. **Convert** — Accumulated scores are converted to EDGE tokens at configurable rates, either on-demand or via scheduled batch processing. Conversion records are written to the token ledger.

---

## Core Interfaces

### Contribution

```typescript
/**
 * Represents a single user contribution to the ecosystem.
 * Contributions are the atomic inputs to the scoring system.
 */
interface Contribution {
  /** Unique contribution identifier (ULID) */
  id: string;

  /** User who made the contribution */
  userId: string;

  /** Venture context (null for platform-level contributions) */
  ventureId: string | null;

  /** Top-level category */
  category: ContributionCategory;

  /** Specific contribution type within the category */
  type: ContributionType;

  /** Human-readable title/summary */
  title: string;

  /** Optional longer description */
  description: string | null;

  /** Source system that reported this contribution */
  source: ContributionSource;

  /** External identifier in the source system (e.g., PR number, commit SHA) */
  externalId: string | null;

  /** External URL for verification */
  externalUrl: string | null;

  /** Arbitrary metadata from the source system */
  metadata: ContributionMetadata;

  /** Current processing status */
  status: ContributionStatus;

  /** Quality score assigned by quality gates (0-100, null if not yet assessed) */
  qualityScore: number | null;

  /** Whether peer review is required for this contribution */
  peerReviewRequired: boolean;

  /** ID of peer reviewer (if reviewed) */
  reviewedBy: string | null;

  /** Timestamp of peer review */
  reviewedAt: Date | null;

  /** Final computed score (null until scored) */
  computedScore: number | null;

  /** Idempotency key for deduplication */
  idempotencyKey: string;

  /** When the contribution actually occurred (may differ from creation time) */
  occurredAt: Date;

  /** When the record was created in ACS */
  createdAt: Date;

  /** When the record was last updated */
  updatedAt: Date;
}

type ContributionCategory =
  | 'code'
  | 'content'
  | 'community'
  | 'growth'
  | 'data';

type ContributionType =
  // Code
  | 'pull_request_merged'
  | 'pull_request_reviewed'
  | 'commit'
  | 'issue_opened'
  | 'issue_resolved'
  | 'code_review_comment'
  // Content
  | 'article_published'
  | 'tutorial_created'
  | 'video_published'
  | 'documentation_updated'
  | 'translation_submitted'
  // Community
  | 'question_answered'
  | 'forum_post'
  | 'moderation_action'
  | 'event_organized'
  | 'mentoring_session'
  | 'community_support'
  // Growth
  | 'referral_signup'
  | 'referral_conversion'
  | 'social_share'
  | 'ambassador_activity'
  // Data
  | 'bug_report'
  | 'feature_request'
  | 'feedback_submitted'
  | 'survey_completed'
  | 'beta_testing';

type ContributionSource =
  | 'github'
  | 'gitlab'
  | 'cms'
  | 'forum'
  | 'discord'
  | 'referral_system'
  | 'manual'
  | 'api'
  | 'webhook';

type ContributionStatus =
  | 'pending'         // Received, not yet scored
  | 'validating'      // Passing through anti-gaming checks
  | 'peer_review'     // Awaiting peer review
  | 'scoring'         // Being scored by the engine
  | 'scored'          // Successfully scored
  | 'rejected'        // Failed anti-gaming or quality checks
  | 'appealed'        // Under appeal
  | 'voided';         // Manually voided by admin

interface ContributionMetadata {
  /** Lines of code changed (for code contributions) */
  linesChanged?: number;
  /** Number of files touched */
  filesChanged?: number;
  /** Word count (for content contributions) */
  wordCount?: number;
  /** Engagement metrics (views, likes, shares) */
  engagement?: {
    views?: number;
    likes?: number;
    shares?: number;
    comments?: number;
  };
  /** Referral chain depth */
  referralDepth?: number;
  /** Bug severity (for bug reports) */
  severity?: 'critical' | 'high' | 'medium' | 'low';
  /** Whether this was a first-time contribution for the user */
  isFirstContribution?: boolean;
  /** Tags for additional categorization */
  tags?: string[];
  /** Raw payload from source system */
  sourcePayload?: Record<string, unknown>;
}

interface ContributionInput {
  userId: string;
  ventureId?: string;
  category: ContributionCategory;
  type: ContributionType;
  title: string;
  description?: string;
  source: ContributionSource;
  externalId?: string;
  externalUrl?: string;
  metadata?: Partial<ContributionMetadata>;
  occurredAt?: Date;
  idempotencyKey: string;
}
```

### ScoringRule

```typescript
/**
 * Defines how a particular contribution type is scored.
 * Ventures can override platform defaults with their own rules.
 */
interface ScoringRule {
  /** Unique rule identifier */
  id: string;

  /** Venture this rule applies to (null = platform default) */
  ventureId: string | null;

  /** Contribution type this rule applies to */
  contributionType: ContributionType;

  /** Human-readable rule name */
  name: string;

  /** Description of what this rule does */
  description: string;

  /** Scoring formula configuration */
  formula: ScoringFormula;

  /** Quality gate requirements (must pass to be scored) */
  qualityGate: QualityGate | null;

  /** Whether peer review is required */
  requiresPeerReview: boolean;

  /** Minimum quality score to pass (0-100) */
  minimumQualityScore: number;

  /** Maximum score cap (prevents outlier scores) */
  maxScore: number;

  /** Whether this rule is currently active */
  isActive: boolean;

  /** Priority for rule resolution (higher = takes precedence) */
  priority: number;

  createdAt: Date;
  updatedAt: Date;
}

interface ScoringFormula {
  /** Base points awarded for the contribution */
  basePoints: number;

  /** Calculation mode */
  mode: 'fixed' | 'scaled' | 'formula';

  /**
   * For 'scaled' mode: which metadata field to scale by.
   * e.g., 'linesChanged' for code, 'wordCount' for content
   */
  scaleField?: string;

  /** For 'scaled' mode: points per unit of the scale field */
  pointsPerUnit?: number;

  /** For 'scaled' mode: minimum units to count */
  scaleMin?: number;

  /** For 'scaled' mode: maximum units to count (prevents gaming via inflated numbers) */
  scaleMax?: number;

  /**
   * For 'formula' mode: custom formula expression.
   * Available variables: base, metadata.*, quality, streak, daysSinceFirst
   * Example: "base * (1 + metadata.engagement.likes * 0.1) * quality / 100"
   */
  expression?: string;

  /** Bonus points for specific conditions */
  bonuses?: Array<{
    condition: string;       // Expression that evaluates to boolean
    points: number;          // Bonus points to add
    description: string;     // Why this bonus exists
  }>;
}

interface QualityGate {
  /** Automated quality checks */
  checks: Array<{
    field: string;           // Metadata field to check
    operator: 'gt' | 'gte' | 'lt' | 'lte' | 'eq' | 'exists' | 'regex';
    value: string | number | boolean;
    failMessage: string;
  }>;

  /** Minimum automated quality score (0-100) */
  minAutoScore: number;

  /** Whether manual review can override failed automated checks */
  allowManualOverride: boolean;
}

interface WeightConfig {
  /** Category weights — must sum to 1.0 within a venture */
  categoryWeights: CategoryWeights;

  /** Venture-specific adjustment multiplier (0.5 - 2.0) */
  ventureMultiplier: number;
}

interface CategoryWeights {
  code: number;
  content: number;
  community: number;
  growth: number;
  data: number;
}
```

### Score

```typescript
/**
 * A user's current score state, including full breakdown.
 */
interface Score {
  /** User ID */
  userId: string;

  /** Venture ID (null for platform-level) */
  ventureId: string | null;

  /** Total current score (after decay) */
  totalScore: number;

  /** Score before any decay was applied */
  rawScore: number;

  /** Total decay amount subtracted */
  totalDecay: number;

  /** Breakdown by category */
  categoryScores: Record<ContributionCategory, CategoryScore>;

  /** Total contributions counted */
  contributionCount: number;

  /** Current streak length (consecutive active days/weeks) */
  currentStreak: number;

  /** Longest streak ever */
  longestStreak: number;

  /** Active multipliers */
  activeMultipliers: Multiplier[];

  /** Total tokens earned through conversion */
  totalTokensEarned: number;

  /** Score available for conversion (not yet converted) */
  convertibleScore: number;

  /** Last contribution date */
  lastContributionAt: Date | null;

  /** Last decay application date */
  lastDecayAt: Date | null;

  /** When this score record was created */
  createdAt: Date;

  /** When this score record was last updated */
  updatedAt: Date;
}

interface CategoryScore {
  /** Score in this category */
  score: number;

  /** Raw score before decay */
  rawScore: number;

  /** Number of contributions in this category */
  contributionCount: number;

  /** Percentage of total score */
  percentage: number;
}

interface ScoreBreakdown {
  /** The contribution being scored */
  contributionId: string;

  /** Scoring rule that was applied */
  ruleId: string;

  /** Step-by-step breakdown */
  steps: ScoreComponent[];

  /** Final score after all steps */
  finalScore: number;

  /** Timestamp of calculation */
  calculatedAt: Date;
}

interface ScoreComponent {
  /** Step name (e.g., "Base Points", "Quality Multiplier", "Streak Bonus") */
  name: string;

  /** Description of this step */
  description: string;

  /** Input value to this step */
  inputValue: number;

  /** Multiplier or adjustment applied */
  adjustment: number;

  /** Output value after this step */
  outputValue: number;

  /** Calculation expression (for transparency) */
  expression: string;
}

interface ScoreSnapshot {
  /** Snapshot ID */
  id: string;

  /** User ID */
  userId: string;

  /** Venture ID */
  ventureId: string | null;

  /** Total score at snapshot time */
  totalScore: number;

  /** Category breakdown at snapshot time */
  categoryScores: Record<ContributionCategory, number>;

  /** Global rank at snapshot time */
  globalRank: number;

  /** Venture rank at snapshot time */
  ventureRank: number | null;

  /** Snapshot timestamp */
  snapshotAt: Date;
}

interface UserScore {
  userId: string;
  displayName: string;
  avatarUrl: string | null;
  score: Score;
  rank: number;
  rankChange: number;  // Positive = moved up, negative = moved down
}
```

### Leaderboard

```typescript
/**
 * Leaderboard configuration and query interfaces.
 */
interface Leaderboard {
  /** Leaderboard identifier */
  id: string;

  /** Display name */
  name: string;

  /** Scope: global or per-venture */
  scope: LeaderboardScope;

  /** Venture ID if scope is 'venture' */
  ventureId: string | null;

  /** Time window */
  window: LeaderboardWindow;

  /** Category filter (null = all categories) */
  category: ContributionCategory | null;

  /** Current entries (paginated) */
  entries: LeaderboardEntry[];

  /** Total participants */
  totalParticipants: number;

  /** When this leaderboard was last computed */
  lastComputedAt: Date;

  /** Next scheduled computation */
  nextComputeAt: Date;
}

interface LeaderboardEntry {
  /** Rank position (1-indexed) */
  rank: number;

  /** User ID */
  userId: string;

  /** User display name */
  displayName: string;

  /** User avatar URL */
  avatarUrl: string | null;

  /** Score in this leaderboard context */
  score: number;

  /** Number of contributions in the window */
  contributionCount: number;

  /** Rank change since last snapshot (+1 = moved up one) */
  rankChange: number;

  /** Top contribution category for this user */
  topCategory: ContributionCategory;

  /** Current streak length */
  streakLength: number;
}

interface LeaderboardQuery {
  /** Scope filter */
  scope?: LeaderboardScope;

  /** Venture ID filter */
  ventureId?: string;

  /** Time window */
  window?: LeaderboardWindow;

  /** Category filter */
  category?: ContributionCategory;

  /** Pagination: page number (1-indexed) */
  page?: number;

  /** Pagination: entries per page (default 25, max 100) */
  pageSize?: number;

  /** Include the requesting user's position even if not on current page */
  includeCurrentUser?: string;

  /** Minimum score to appear on leaderboard */
  minScore?: number;

  /** Sort order */
  sortBy?: 'score' | 'contributions' | 'streak';

  sortDirection?: 'asc' | 'desc';
}

type LeaderboardWindow = 'weekly' | 'monthly' | 'quarterly' | 'yearly' | 'all_time';

type LeaderboardScope = 'global' | 'venture';
```

### DecayFunction

```typescript
/**
 * Decay functions reduce scores over time to incentivize
 * continuous participation.
 */
interface DecayFunction {
  /** Decay function identifier */
  id: string;

  /** Venture ID (null = platform default) */
  ventureId: string | null;

  /** Decay algorithm type */
  type: DecayType;

  /** Configuration parameters */
  config: DecayConfig;

  /** Schedule for applying decay */
  schedule: DecaySchedule;

  /** Whether this function is active */
  isActive: boolean;

  /** Category-specific overrides (some categories may decay differently) */
  categoryOverrides: Partial<Record<ContributionCategory, DecayConfig>> | null;

  createdAt: Date;
  updatedAt: Date;
}

type DecayType = 'exponential' | 'linear' | 'step' | 'none';

interface DecayConfig {
  /**
   * For exponential: half-life in days (score halves every N days)
   * For linear: points lost per day
   * For step: see stepConfig
   */
  rate: number;

  /** Minimum score floor (decay never reduces below this) */
  floor: number;

  /** Days after last contribution before decay begins (grace period) */
  gracePeriodDays: number;

  /** For step decay: configuration of step boundaries */
  stepConfig?: {
    steps: Array<{
      afterDays: number;       // Days since last contribution
      decayPercent: number;    // Percentage of score to remove
    }>;
  };

  /** Maximum decay per application (percentage, 0-100) */
  maxDecayPerApplication: number;

  /** Whether to apply decay to already-converted scores */
  decayConvertedScores: boolean;
}

interface DecaySchedule {
  /** How often to apply decay */
  frequency: 'daily' | 'weekly' | 'monthly';

  /** For weekly: day of week (0=Sunday, 6=Saturday) */
  dayOfWeek?: number;

  /** For monthly: day of month (1-28) */
  dayOfMonth?: number;

  /** Hour of day to run (0-23, UTC) */
  hourUtc: number;
}

interface DecayApplication {
  /** Application ID */
  id: string;

  /** User ID affected */
  userId: string;

  /** Venture ID */
  ventureId: string | null;

  /** Decay function that was applied */
  decayFunctionId: string;

  /** Score before decay */
  scoreBefore: number;

  /** Score after decay */
  scoreAfter: number;

  /** Amount decayed */
  decayAmount: number;

  /** Decay percentage applied */
  decayPercent: number;

  /** Days since user's last contribution at time of decay */
  daysSinceLastContribution: number;

  /** When decay was applied */
  appliedAt: Date;
}
```

### ConversionRate

```typescript
/**
 * Score-to-token conversion configuration and results.
 */
interface ConversionRate {
  /** Rate configuration ID */
  id: string;

  /** Venture ID (null = platform default) */
  ventureId: string | null;

  /** EDGE tokens per score point */
  tokensPerPoint: number;

  /** Minimum score required to convert */
  minimumScore: number;

  /** Maximum tokens per conversion (anti-abuse) */
  maxTokensPerConversion: number;

  /** Maximum tokens per user per period */
  maxTokensPerPeriod: number;

  /** Period for max tokens limit */
  periodDays: number;

  /** Whether conversion is currently enabled */
  isEnabled: boolean;

  /** Category-specific rate overrides */
  categoryRates: Partial<Record<ContributionCategory, number>> | null;

  /** Effective date range */
  effectiveFrom: Date;
  effectiveTo: Date | null;

  createdAt: Date;
  updatedAt: Date;
}

interface ConversionRequest {
  /** User requesting conversion */
  userId: string;

  /** Venture context */
  ventureId: string | null;

  /** Score amount to convert (null = convert all available) */
  scoreAmount: number | null;

  /** Specific categories to convert from (null = all) */
  categories: ContributionCategory[] | null;

  /** Idempotency key */
  idempotencyKey: string;
}

interface ConversionResult {
  /** Conversion record ID */
  id: string;

  /** User ID */
  userId: string;

  /** Venture ID */
  ventureId: string | null;

  /** Score amount converted */
  scoreConverted: number;

  /** Tokens awarded */
  tokensAwarded: number;

  /** Conversion rate used */
  rateUsed: number;

  /** Breakdown by category */
  categoryBreakdown: Array<{
    category: ContributionCategory;
    scoreConverted: number;
    tokensAwarded: number;
    rateUsed: number;
  }>;

  /** Ledger transaction ID */
  ledgerTransactionId: string;

  /** Remaining convertible score after this conversion */
  remainingConvertibleScore: number;

  /** Conversion timestamp */
  convertedAt: Date;
}

interface ConversionHistory {
  /** User ID */
  userId: string;

  /** Total conversions */
  totalConversions: number;

  /** Total score ever converted */
  totalScoreConverted: number;

  /** Total tokens ever earned */
  totalTokensEarned: number;

  /** Conversion records (paginated) */
  conversions: ConversionResult[];

  /** Current period usage */
  periodUsage: {
    tokensThisPeriod: number;
    maxTokensThisPeriod: number;
    periodResetsAt: Date;
  };
}

interface ConversionBatch {
  /** Batch ID */
  id: string;

  /** Number of users processed */
  usersProcessed: number;

  /** Total score converted in batch */
  totalScoreConverted: number;

  /** Total tokens distributed */
  totalTokensDistributed: number;

  /** Individual results */
  results: ConversionResult[];

  /** Errors during processing */
  errors: Array<{
    userId: string;
    error: string;
    code: string;
  }>;

  /** Batch processing timestamps */
  startedAt: Date;
  completedAt: Date;
}
```

### Multiplier

```typescript
/**
 * Multipliers boost scores based on user behavior patterns.
 */
interface Multiplier {
  /** Multiplier identifier */
  id: string;

  /** Venture ID (null = platform-level) */
  ventureId: string | null;

  /** Multiplier type */
  type: MultiplierType;

  /** Display name */
  name: string;

  /** Description shown to users */
  description: string;

  /** Multiplier value (e.g., 1.5 = 50% bonus) */
  value: number;

  /** Configuration specific to the multiplier type */
  config: MultiplierConfig;

  /** Whether currently active */
  isActive: boolean;

  /** Stacks with other multipliers? */
  stackable: boolean;

  /** Maximum combined multiplier when stacking */
  maxStackValue: number;

  /** Priority for non-stackable resolution */
  priority: number;

  createdAt: Date;
  updatedAt: Date;
}

type MultiplierType =
  | 'streak'              // Consecutive active periods
  | 'first_contribution'  // First time contributing
  | 'venture_specific'    // Venture-defined bonus
  | 'category_boost'      // Temporary category multiplier
  | 'event'               // Time-limited events (hackathons, etc.)
  | 'quality'             // High-quality contribution bonus
  | 'early_adopter';      // Early platform participant

interface MultiplierConfig {
  /** For streak type: required consecutive periods */
  streakConfig?: StreakConfig;

  /** For first_contribution: applies to first N contributions */
  firstContributionCount?: number;

  /** For category_boost: which category */
  targetCategory?: ContributionCategory;

  /** For event: time window */
  eventWindow?: {
    startsAt: Date;
    endsAt: Date;
  };

  /** For quality: minimum quality score to trigger */
  minQualityScore?: number;

  /** Conditions expressed as rules */
  conditions?: Array<{
    field: string;
    operator: string;
    value: string | number | boolean;
  }>;
}

interface StreakConfig {
  /** Period type for streak counting */
  periodType: 'daily' | 'weekly';

  /** Multiplier tiers based on streak length */
  tiers: Array<{
    minStreak: number;     // Minimum streak to qualify
    multiplier: number;    // Multiplier value at this tier
  }>;

  /** Grace periods (missed periods) allowed before streak resets */
  gracePeriods: number;

  /** Maximum multiplier value */
  maxMultiplier: number;
}

interface BonusConfig {
  /** Bonus type */
  type: 'fixed_points' | 'percentage';

  /** Value (points or percentage) */
  value: number;

  /** One-time or recurring */
  oneTime: boolean;
}
```

### Appeal

```typescript
/**
 * Appeal system for score disputes and manual adjustments.
 */
interface Appeal {
  /** Appeal identifier */
  id: string;

  /** User who filed the appeal */
  userId: string;

  /** Contribution being appealed (null for general score appeals) */
  contributionId: string | null;

  /** Venture context */
  ventureId: string | null;

  /** Appeal type */
  type: 'score_dispute' | 'rejection_appeal' | 'missing_contribution' | 'decay_dispute';

  /** User's stated reason */
  reason: string;

  /** Supporting evidence (URLs, screenshots, etc.) */
  evidence: Array<{
    type: 'url' | 'text' | 'image';
    value: string;
    description: string;
  }>;

  /** Current status */
  status: AppealStatus;

  /** Admin assigned to review */
  assignedTo: string | null;

  /** Resolution details */
  resolution: AppealResolution | null;

  /** Admin notes (internal) */
  adminNotes: string[];

  createdAt: Date;
  updatedAt: Date;
  resolvedAt: Date | null;
}

type AppealStatus =
  | 'open'
  | 'under_review'
  | 'awaiting_info'    // Waiting for user to provide more info
  | 'approved'
  | 'partially_approved'
  | 'denied'
  | 'withdrawn';

interface AppealResolution {
  /** Outcome of the appeal */
  outcome: 'approved' | 'partially_approved' | 'denied';

  /** Explanation provided to the user */
  explanation: string;

  /** Score adjustment (if any) */
  adjustment: ManualAdjustment | null;

  /** Resolved by (admin user ID) */
  resolvedBy: string;

  /** Resolved at */
  resolvedAt: Date;
}

interface ManualAdjustment {
  /** Adjustment ID */
  id: string;

  /** User affected */
  userId: string;

  /** Venture context */
  ventureId: string | null;

  /** Appeal that triggered this (null for admin-initiated) */
  appealId: string | null;

  /** Type of adjustment */
  type: 'add' | 'subtract' | 'set' | 'void_contribution';

  /** Category affected */
  category: ContributionCategory | null;

  /** Amount of adjustment */
  amount: number;

  /** Reason for adjustment */
  reason: string;

  /** Admin who made the adjustment */
  adjustedBy: string;

  /** Score before adjustment */
  scoreBefore: number;

  /** Score after adjustment */
  scoreAfter: number;

  createdAt: Date;
}

interface AppealInput {
  userId: string;
  contributionId?: string;
  ventureId?: string;
  type: Appeal['type'];
  reason: string;
  evidence?: Appeal['evidence'];
}
```

### AntiGaming

```typescript
/**
 * Anti-gaming interfaces for Sybil resistance and fraud detection.
 */
interface AntiGamingConfig {
  /** Venture ID (null = platform default) */
  ventureId: string | null;

  /** Velocity limit configurations */
  velocityLimits: VelocityLimit[];

  /** Sybil detection configuration */
  sybilDetection: {
    enabled: boolean;
    /** Minimum account age (days) to contribute */
    minAccountAgeDays: number;
    /** Minimum platform actions before contributions count */
    minPlatformActions: number;
    /** IP overlap threshold for flagging */
    ipOverlapThreshold: number;
    /** Behavioral similarity threshold (0-1) */
    behaviorSimilarityThreshold: number;
    /** Device fingerprint matching */
    fingerprintMatching: boolean;
  };

  /** Quality gate defaults */
  qualityDefaults: {
    /** Auto-reject contributions with quality score below this */
    autoRejectBelow: number;
    /** Auto-approve contributions with quality score above this */
    autoApproveAbove: number;
    /** Require peer review for scores in between */
    peerReviewRange: [number, number];
  };

  /** Global score caps */
  scoreCaps: {
    /** Maximum score a user can earn per day */
    maxPerDay: number;
    /** Maximum score per category per day */
    maxPerCategoryPerDay: number;
    /** Maximum score from a single contribution */
    maxPerContribution: number;
  };
}

interface VelocityLimit {
  /** Contribution type this limit applies to */
  contributionType: ContributionType | '*';

  /** Maximum contributions in the time window */
  maxCount: number;

  /** Time window in seconds */
  windowSeconds: number;

  /** Action to take when limit is exceeded */
  action: 'reject' | 'queue_review' | 'score_zero' | 'flag';

  /** Cooldown period after limit is hit (seconds) */
  cooldownSeconds: number;

  /** Human-readable description */
  description: string;
}

interface SybilCheckResult {
  /** Whether the check passed */
  passed: boolean;

  /** Risk score (0-100, higher = more suspicious) */
  riskScore: number;

  /** Specific signals that were detected */
  signals: FraudSignal[];

  /** Recommended action */
  recommendedAction: 'allow' | 'flag' | 'block' | 'manual_review';

  /** Human-readable explanation */
  explanation: string;
}

interface QualityGateResult {
  /** Whether the contribution passed quality gates */
  passed: boolean;

  /** Automated quality score (0-100) */
  autoScore: number;

  /** Individual check results */
  checks: Array<{
    name: string;
    passed: boolean;
    message: string;
    score: number;
  }>;

  /** Whether peer review is required */
  requiresPeerReview: boolean;

  /** Reasons for failure (if failed) */
  failureReasons: string[];
}

interface FraudSignal {
  /** Signal type */
  type:
    | 'velocity_exceeded'
    | 'sybil_suspected'
    | 'ip_overlap'
    | 'device_overlap'
    | 'behavioral_anomaly'
    | 'quality_pattern'
    | 'self_referral'
    | 'coordinated_activity'
    | 'timing_anomaly'
    | 'content_duplication';

  /** Severity */
  severity: 'low' | 'medium' | 'high' | 'critical';

  /** Confidence (0-1) */
  confidence: number;

  /** Details about the signal */
  details: string;

  /** Related user IDs (for coordinated activity detection) */
  relatedUserIds?: string[];

  /** Evidence data */
  evidence?: Record<string, unknown>;

  /** When the signal was detected */
  detectedAt: Date;
}
```

---

## ACSService

```typescript
/**
 * Primary service for Automated Contribution Scoring.
 * Orchestrates contribution tracking, scoring, decay, leaderboards, and conversion.
 */
interface ACSService {
  // ── Contribution Management ──────────────────────────────────────────────

  /**
   * Submit a new contribution for scoring.
   * Runs through validation, anti-gaming checks, and scoring pipeline.
   */
  submitContribution(input: ContributionInput): Promise<Contribution>;

  /**
   * Submit multiple contributions in a batch.
   * Each contribution is independently validated and scored.
   */
  submitContributionBatch(inputs: ContributionInput[]): Promise<{
    succeeded: Contribution[];
    failed: Array<{ input: ContributionInput; error: string; code: string }>;
  }>;

  /**
   * Get a contribution by ID.
   */
  getContribution(id: string): Promise<Contribution | null>;

  /**
   * List contributions for a user, with filtering.
   */
  listContributions(params: {
    userId: string;
    ventureId?: string;
    category?: ContributionCategory;
    type?: ContributionType;
    status?: ContributionStatus;
    fromDate?: Date;
    toDate?: Date;
    page?: number;
    pageSize?: number;
  }): Promise<{
    contributions: Contribution[];
    total: number;
    page: number;
    pageSize: number;
  }>;

  /**
   * Void a contribution (admin action).
   * Recalculates the user's score excluding this contribution.
   */
  voidContribution(id: string, reason: string, adminUserId: string): Promise<void>;

  // ── Score Management ─────────────────────────────────────────────────────

  /**
   * Get a user's current score.
   */
  getScore(userId: string, ventureId?: string): Promise<Score>;

  /**
   * Get detailed score breakdown for a specific contribution.
   * Shows exactly how the score was calculated, step by step.
   */
  getScoreBreakdown(contributionId: string): Promise<ScoreBreakdown>;

  /**
   * Get score history (snapshots) for a user over time.
   */
  getScoreHistory(params: {
    userId: string;
    ventureId?: string;
    fromDate: Date;
    toDate: Date;
    granularity: 'daily' | 'weekly' | 'monthly';
  }): Promise<ScoreSnapshot[]>;

  /**
   * Recalculate a user's entire score from scratch.
   * Used after rule changes or manual adjustments.
   */
  recalculateScore(userId: string, ventureId?: string): Promise<Score>;

  // ── Leaderboard ──────────────────────────────────────────────────────────

  /**
   * Query a leaderboard.
   */
  getLeaderboard(query: LeaderboardQuery): Promise<Leaderboard>;

  /**
   * Get a user's position across all leaderboards.
   */
  getUserRankings(userId: string): Promise<Array<{
    leaderboard: string;
    rank: number;
    score: number;
    totalParticipants: number;
  }>>;

  /**
   * Force recomputation of leaderboard snapshots.
   */
  recomputeLeaderboards(scope?: LeaderboardScope, ventureId?: string): Promise<void>;

  // ── Decay ────────────────────────────────────────────────────────────────

  /**
   * Manually trigger decay for a specific user (admin/testing).
   */
  applyDecay(userId: string, ventureId?: string): Promise<DecayApplication>;

  /**
   * Run decay for all users in a venture (or globally).
   * Normally called by the scheduled job.
   */
  runDecayBatch(ventureId?: string): Promise<{
    usersProcessed: number;
    totalDecayApplied: number;
    errors: Array<{ userId: string; error: string }>;
  }>;

  /**
   * Preview what decay would look like without applying it.
   */
  previewDecay(userId: string, ventureId?: string): Promise<{
    currentScore: number;
    projectedScore: number;
    decayAmount: number;
    daysSinceLastContribution: number;
    decayFunction: DecayType;
  }>;

  // ── Conversion ───────────────────────────────────────────────────────────

  /**
   * Convert accumulated score to EDGE tokens.
   */
  convertScore(request: ConversionRequest): Promise<ConversionResult>;

  /**
   * Get conversion history for a user.
   */
  getConversionHistory(userId: string, params?: {
    ventureId?: string;
    page?: number;
    pageSize?: number;
  }): Promise<ConversionHistory>;

  /**
   * Preview a conversion without executing it.
   * Shows how many tokens the user would receive.
   */
  previewConversion(request: ConversionRequest): Promise<{
    scoreToConvert: number;
    tokensToReceive: number;
    rateUsed: number;
    categoryBreakdown: Array<{
      category: ContributionCategory;
      score: number;
      tokens: number;
      rate: number;
    }>;
  }>;

  /**
   * Run batch conversion for all eligible users (scheduled).
   */
  runConversionBatch(ventureId?: string): Promise<ConversionBatch>;

  // ── Appeals ──────────────────────────────────────────────────────────────

  /**
   * File an appeal.
   */
  fileAppeal(input: AppealInput): Promise<Appeal>;

  /**
   * Resolve an appeal (admin action).
   */
  resolveAppeal(
    appealId: string,
    resolution: Omit<AppealResolution, 'resolvedAt'>,
  ): Promise<Appeal>;

  /**
   * List appeals with filtering.
   */
  listAppeals(params: {
    userId?: string;
    ventureId?: string;
    status?: AppealStatus;
    type?: Appeal['type'];
    page?: number;
    pageSize?: number;
  }): Promise<{ appeals: Appeal[]; total: number }>;

  /**
   * Apply a manual score adjustment (admin action).
   */
  manualAdjustment(adjustment: Omit<ManualAdjustment, 'id' | 'scoreBefore' | 'scoreAfter' | 'createdAt'>): Promise<ManualAdjustment>;

  // ── Configuration ────────────────────────────────────────────────────────

  /**
   * Get or update scoring rules for a venture.
   */
  getScoringRules(ventureId?: string): Promise<ScoringRule[]>;
  upsertScoringRule(rule: Omit<ScoringRule, 'id' | 'createdAt' | 'updatedAt'>): Promise<ScoringRule>;
  deleteScoringRule(ruleId: string): Promise<void>;

  /**
   * Get or update decay configuration.
   */
  getDecayConfig(ventureId?: string): Promise<DecayFunction>;
  upsertDecayConfig(config: Omit<DecayFunction, 'id' | 'createdAt' | 'updatedAt'>): Promise<DecayFunction>;

  /**
   * Get or update conversion rates.
   */
  getConversionRate(ventureId?: string): Promise<ConversionRate>;
  upsertConversionRate(rate: Omit<ConversionRate, 'id' | 'createdAt' | 'updatedAt'>): Promise<ConversionRate>;

  /**
   * Get or update anti-gaming configuration.
   */
  getAntiGamingConfig(ventureId?: string): Promise<AntiGamingConfig>;
  upsertAntiGamingConfig(config: AntiGamingConfig): Promise<AntiGamingConfig>;

  /**
   * Get or update multiplier configuration.
   */
  getMultipliers(ventureId?: string): Promise<Multiplier[]>;
  upsertMultiplier(multiplier: Omit<Multiplier, 'id' | 'createdAt' | 'updatedAt'>): Promise<Multiplier>;
  deleteMultiplier(multiplierId: string): Promise<void>;
}
```

---

## Database Schemas

### contributions

```typescript
import { pgTable, text, timestamp, integer, jsonb, boolean, index, uniqueIndex } from 'drizzle-orm/pg-core';
import { ulid } from '@mcv/ids';

export const contributions = pgTable('acs_contributions', {
  id: text('id').primaryKey().$defaultFn(() => ulid()),

  userId: text('user_id').notNull(),
  ventureId: text('venture_id'),

  category: text('category', {
    enum: ['code', 'content', 'community', 'growth', 'data'],
  }).notNull(),

  type: text('type').notNull(), // ContributionType enum value

  title: text('title').notNull(),
  description: text('description'),

  source: text('source', {
    enum: ['github', 'gitlab', 'cms', 'forum', 'discord', 'referral_system', 'manual', 'api', 'webhook'],
  }).notNull(),

  externalId: text('external_id'),
  externalUrl: text('external_url'),

  metadata: jsonb('metadata').$type<ContributionMetadata>().default({}),

  status: text('status', {
    enum: ['pending', 'validating', 'peer_review', 'scoring', 'scored', 'rejected', 'appealed', 'voided'],
  }).notNull().default('pending'),

  qualityScore: integer('quality_score'),  // 0-100
  peerReviewRequired: boolean('peer_review_required').notNull().default(false),
  reviewedBy: text('reviewed_by'),
  reviewedAt: timestamp('reviewed_at', { withTimezone: true }),

  computedScore: integer('computed_score'),  // Final score from scoring engine

  idempotencyKey: text('idempotency_key').notNull(),

  occurredAt: timestamp('occurred_at', { withTimezone: true }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  userIdIdx: index('acs_contributions_user_id_idx').on(table.userId),
  ventureIdIdx: index('acs_contributions_venture_id_idx').on(table.ventureId),
  categoryIdx: index('acs_contributions_category_idx').on(table.category),
  typeIdx: index('acs_contributions_type_idx').on(table.type),
  statusIdx: index('acs_contributions_status_idx').on(table.status),
  occurredAtIdx: index('acs_contributions_occurred_at_idx').on(table.occurredAt),
  userVentureIdx: index('acs_contributions_user_venture_idx').on(table.userId, table.ventureId),
  idempotencyIdx: uniqueIndex('acs_contributions_idempotency_idx').on(table.idempotencyKey),
  userCategoryIdx: index('acs_contributions_user_category_idx').on(table.userId, table.category),
}));
```

### scoring_rules

```typescript
export const scoringRules = pgTable('acs_scoring_rules', {
  id: text('id').primaryKey().$defaultFn(() => ulid()),

  ventureId: text('venture_id'),  // null = platform default

  contributionType: text('contribution_type').notNull(),

  name: text('name').notNull(),
  description: text('description').notNull(),

  formula: jsonb('formula').$type<ScoringFormula>().notNull(),

  qualityGate: jsonb('quality_gate').$type<QualityGate>(),

  requiresPeerReview: boolean('requires_peer_review').notNull().default(false),
  minimumQualityScore: integer('minimum_quality_score').notNull().default(0),
  maxScore: integer('max_score').notNull().default(1000),

  isActive: boolean('is_active').notNull().default(true),
  priority: integer('priority').notNull().default(0),

  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  ventureTypeIdx: index('acs_scoring_rules_venture_type_idx').on(table.ventureId, table.contributionType),
  activeIdx: index('acs_scoring_rules_active_idx').on(table.isActive),
  priorityIdx: index('acs_scoring_rules_priority_idx').on(table.priority),
}));
```

### user_scores

```typescript
export const userScores = pgTable('acs_user_scores', {
  id: text('id').primaryKey().$defaultFn(() => ulid()),

  userId: text('user_id').notNull(),
  ventureId: text('venture_id'),  // null = global score

  totalScore: integer('total_score').notNull().default(0),
  rawScore: integer('raw_score').notNull().default(0),
  totalDecay: integer('total_decay').notNull().default(0),

  // Category breakdown
  codeScore: integer('code_score').notNull().default(0),
  contentScore: integer('content_score').notNull().default(0),
  communityScore: integer('community_score').notNull().default(0),
  growthScore: integer('growth_score').notNull().default(0),
  dataScore: integer('data_score').notNull().default(0),

  codeRawScore: integer('code_raw_score').notNull().default(0),
  contentRawScore: integer('content_raw_score').notNull().default(0),
  communityRawScore: integer('community_raw_score').notNull().default(0),
  growthRawScore: integer('growth_raw_score').notNull().default(0),
  dataRawScore: integer('data_raw_score').notNull().default(0),

  contributionCount: integer('contribution_count').notNull().default(0),

  // Contribution counts per category
  codeContributions: integer('code_contributions').notNull().default(0),
  contentContributions: integer('content_contributions').notNull().default(0),
  communityContributions: integer('community_contributions').notNull().default(0),
  growthContributions: integer('growth_contributions').notNull().default(0),
  dataContributions: integer('data_contributions').notNull().default(0),

  currentStreak: integer('current_streak').notNull().default(0),
  longestStreak: integer('longest_streak').notNull().default(0),
  lastStreakDate: timestamp('last_streak_date', { withTimezone: true }),

  totalTokensEarned: integer('total_tokens_earned').notNull().default(0),
  convertibleScore: integer('convertible_score').notNull().default(0),

  lastContributionAt: timestamp('last_contribution_at', { withTimezone: true }),
  lastDecayAt: timestamp('last_decay_at', { withTimezone: true }),

  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  userVentureIdx: uniqueIndex('acs_user_scores_user_venture_idx').on(table.userId, table.ventureId),
  totalScoreIdx: index('acs_user_scores_total_score_idx').on(table.totalScore),
  ventureScoreIdx: index('acs_user_scores_venture_score_idx').on(table.ventureId, table.totalScore),
  convertibleIdx: index('acs_user_scores_convertible_idx').on(table.convertibleScore),
  lastContributionIdx: index('acs_user_scores_last_contribution_idx').on(table.lastContributionAt),
  streakIdx: index('acs_user_scores_streak_idx').on(table.currentStreak),
}));
```

### leaderboard_snapshots

```typescript
export const leaderboardSnapshots = pgTable('acs_leaderboard_snapshots', {
  id: text('id').primaryKey().$defaultFn(() => ulid()),

  userId: text('user_id').notNull(),
  ventureId: text('venture_id'),  // null = global leaderboard

  window: text('window', {
    enum: ['weekly', 'monthly', 'quarterly', 'yearly', 'all_time'],
  }).notNull(),

  category: text('category', {
    enum: ['code', 'content', 'community', 'growth', 'data'],
  }),  // null = overall

  score: integer('score').notNull(),
  rank: integer('rank').notNull(),
  contributionCount: integer('contribution_count').notNull().default(0),
  streakLength: integer('streak_length').notNull().default(0),
  topCategory: text('top_category'),

  // Change tracking
  previousRank: integer('previous_rank'),
  rankChange: integer('rank_change').notNull().default(0),
  scoreChange: integer('score_change').notNull().default(0),

  // Window boundaries
  windowStart: timestamp('window_start', { withTimezone: true }).notNull(),
  windowEnd: timestamp('window_end', { withTimezone: true }).notNull(),

  snapshotAt: timestamp('snapshot_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  leaderboardQueryIdx: index('acs_leaderboard_query_idx').on(
    table.ventureId, table.window, table.category, table.rank,
  ),
  userSnapshotIdx: index('acs_leaderboard_user_snapshot_idx').on(
    table.userId, table.window, table.snapshotAt,
  ),
  windowIdx: index('acs_leaderboard_window_idx').on(table.window, table.snapshotAt),
  scoreIdx: index('acs_leaderboard_score_idx').on(table.score),
  rankIdx: index('acs_leaderboard_rank_idx').on(table.rank),
}));
```

### score_conversions

```typescript
export const scoreConversions = pgTable('acs_score_conversions', {
  id: text('id').primaryKey().$defaultFn(() => ulid()),

  userId: text('user_id').notNull(),
  ventureId: text('venture_id'),

  scoreConverted: integer('score_converted').notNull(),
  tokensAwarded: integer('tokens_awarded').notNull(),

  rateUsed: text('rate_used').notNull(),  // Stored as string for decimal precision
  rateConfigId: text('rate_config_id').notNull(),

  categoryBreakdown: jsonb('category_breakdown').$type<Array<{
    category: ContributionCategory;
    scoreConverted: number;
    tokensAwarded: number;
    rateUsed: number;
  }>>().notNull(),

  ledgerTransactionId: text('ledger_transaction_id').notNull(),

  idempotencyKey: text('idempotency_key').notNull(),

  // Batch tracking
  batchId: text('batch_id'),  // null = manual conversion

  convertedAt: timestamp('converted_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  userIdx: index('acs_conversions_user_idx').on(table.userId),
  ventureIdx: index('acs_conversions_venture_idx').on(table.ventureId),
  batchIdx: index('acs_conversions_batch_idx').on(table.batchId),
  convertedAtIdx: index('acs_conversions_converted_at_idx').on(table.convertedAt),
  idempotencyIdx: uniqueIndex('acs_conversions_idempotency_idx').on(table.idempotencyKey),
  userPeriodIdx: index('acs_conversions_user_period_idx').on(table.userId, table.convertedAt),
}));
```

### appeals

```typescript
export const appeals = pgTable('acs_appeals', {
  id: text('id').primaryKey().$defaultFn(() => ulid()),

  userId: text('user_id').notNull(),
  contributionId: text('contribution_id'),
  ventureId: text('venture_id'),

  type: text('type', {
    enum: ['score_dispute', 'rejection_appeal', 'missing_contribution', 'decay_dispute'],
  }).notNull(),

  reason: text('reason').notNull(),

  evidence: jsonb('evidence').$type<Array<{
    type: 'url' | 'text' | 'image';
    value: string;
    description: string;
  }>>().default([]),

  status: text('status', {
    enum: ['open', 'under_review', 'awaiting_info', 'approved', 'partially_approved', 'denied', 'withdrawn'],
  }).notNull().default('open'),

  assignedTo: text('assigned_to'),

  resolution: jsonb('resolution').$type<AppealResolution>(),

  adminNotes: jsonb('admin_notes').$type<string[]>().default([]),

  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  resolvedAt: timestamp('resolved_at', { withTimezone: true }),
}, (table) => ({
  userIdx: index('acs_appeals_user_idx').on(table.userId),
  statusIdx: index('acs_appeals_status_idx').on(table.status),
  typeIdx: index('acs_appeals_type_idx').on(table.type),
  assignedIdx: index('acs_appeals_assigned_idx').on(table.assignedTo),
  contributionIdx: index('acs_appeals_contribution_idx').on(table.contributionId),
  ventureIdx: index('acs_appeals_venture_idx').on(table.ventureId),
}));
```

### Supporting Tables

```typescript
// ── Contribution Score Breakdowns (audit trail) ─────────────────────────────

export const scoreBreakdowns = pgTable('acs_score_breakdowns', {
  id: text('id').primaryKey().$defaultFn(() => ulid()),

  contributionId: text('contribution_id').notNull(),
  ruleId: text('rule_id').notNull(),
  userId: text('user_id').notNull(),

  steps: jsonb('steps').$type<ScoreComponent[]>().notNull(),

  finalScore: integer('final_score').notNull(),

  calculatedAt: timestamp('calculated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  contributionIdx: uniqueIndex('acs_breakdowns_contribution_idx').on(table.contributionId),
  userIdx: index('acs_breakdowns_user_idx').on(table.userId),
}));

// ── Decay Applications Log ──────────────────────────────────────────────────

export const decayApplications = pgTable('acs_decay_applications', {
  id: text('id').primaryKey().$defaultFn(() => ulid()),

  userId: text('user_id').notNull(),
  ventureId: text('venture_id'),
  decayFunctionId: text('decay_function_id').notNull(),

  scoreBefore: integer('score_before').notNull(),
  scoreAfter: integer('score_after').notNull(),
  decayAmount: integer('decay_amount').notNull(),
  decayPercent: text('decay_percent').notNull(),  // Stored as string for precision

  daysSinceLastContribution: integer('days_since_last_contribution').notNull(),

  appliedAt: timestamp('applied_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  userIdx: index('acs_decay_apps_user_idx').on(table.userId),
  appliedAtIdx: index('acs_decay_apps_applied_at_idx').on(table.appliedAt),
  functionIdx: index('acs_decay_apps_function_idx').on(table.decayFunctionId),
}));

// ── Manual Adjustments Log ──────────────────────────────────────────────────

export const manualAdjustments = pgTable('acs_manual_adjustments', {
  id: text('id').primaryKey().$defaultFn(() => ulid()),

  userId: text('user_id').notNull(),
  ventureId: text('venture_id'),
  appealId: text('appeal_id'),

  type: text('type', { enum: ['add', 'subtract', 'set', 'void_contribution'] }).notNull(),
  category: text('category', {
    enum: ['code', 'content', 'community', 'growth', 'data'],
  }),

  amount: integer('amount').notNull(),
  reason: text('reason').notNull(),
  adjustedBy: text('adjusted_by').notNull(),

  scoreBefore: integer('score_before').notNull(),
  scoreAfter: integer('score_after').notNull(),

  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  userIdx: index('acs_adjustments_user_idx').on(table.userId),
  appealIdx: index('acs_adjustments_appeal_idx').on(table.appealId),
  adjustedByIdx: index('acs_adjustments_adjusted_by_idx').on(table.adjustedBy),
}));

// ── Fraud Signals Log ───────────────────────────────────────────────────────

export const fraudSignals = pgTable('acs_fraud_signals', {
  id: text('id').primaryKey().$defaultFn(() => ulid()),

  userId: text('user_id').notNull(),
  contributionId: text('contribution_id'),

  type: text('type').notNull(),  // FraudSignal type
  severity: text('severity', { enum: ['low', 'medium', 'high', 'critical'] }).notNull(),
  confidence: text('confidence').notNull(),  // 0-1 as string

  details: text('details').notNull(),
  relatedUserIds: jsonb('related_user_ids').$type<string[]>().default([]),
  evidence: jsonb('evidence').$type<Record<string, unknown>>(),

  actionTaken: text('action_taken', { enum: ['none', 'flagged', 'blocked', 'manual_review'] }).notNull(),
  resolvedBy: text('resolved_by'),
  resolvedAt: timestamp('resolved_at', { withTimezone: true }),

  detectedAt: timestamp('detected_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  userIdx: index('acs_fraud_signals_user_idx').on(table.userId),
  typeIdx: index('acs_fraud_signals_type_idx').on(table.type),
  severityIdx: index('acs_fraud_signals_severity_idx').on(table.severity),
  detectedAtIdx: index('acs_fraud_signals_detected_at_idx').on(table.detectedAt),
  unresolvedIdx: index('acs_fraud_signals_unresolved_idx').on(table.resolvedAt),
}));

// ── Multiplier Configurations ───────────────────────────────────────────────

export const multiplierConfigs = pgTable('acs_multiplier_configs', {
  id: text('id').primaryKey().$defaultFn(() => ulid()),

  ventureId: text('venture_id'),

  type: text('type').notNull(),
  name: text('name').notNull(),
  description: text('description').notNull(),

  value: text('value').notNull(),  // Stored as string for decimal precision
  config: jsonb('config').$type<MultiplierConfig>().notNull(),

  isActive: boolean('is_active').notNull().default(true),
  stackable: boolean('stackable').notNull().default(true),
  maxStackValue: text('max_stack_value').notNull().default('3.0'),
  priority: integer('priority').notNull().default(0),

  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  ventureIdx: index('acs_multiplier_venture_idx').on(table.ventureId),
  typeIdx: index('acs_multiplier_type_idx').on(table.type),
  activeIdx: index('acs_multiplier_active_idx').on(table.isActive),
}));

// ── Decay Configurations ────────────────────────────────────────────────────

export const decayConfigs = pgTable('acs_decay_configs', {
  id: text('id').primaryKey().$defaultFn(() => ulid()),

  ventureId: text('venture_id'),  // null = platform default

  type: text('type', { enum: ['exponential', 'linear', 'step', 'none'] }).notNull(),

  config: jsonb('config').$type<DecayConfig>().notNull(),
  schedule: jsonb('schedule').$type<DecaySchedule>().notNull(),

  categoryOverrides: jsonb('category_overrides').$type<
    Partial<Record<ContributionCategory, DecayConfig>>
  >(),

  isActive: boolean('is_active').notNull().default(true),

  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  ventureIdx: uniqueIndex('acs_decay_configs_venture_idx').on(table.ventureId),
  activeIdx: index('acs_decay_configs_active_idx').on(table.isActive),
}));

// ── Velocity Limit Configurations ───────────────────────────────────────────

export const velocityLimits = pgTable('acs_velocity_limits', {
  id: text('id').primaryKey().$defaultFn(() => ulid()),

  ventureId: text('venture_id'),

  contributionType: text('contribution_type').notNull(),  // '*' for all types
  maxCount: integer('max_count').notNull(),
  windowSeconds: integer('window_seconds').notNull(),
  action: text('action', { enum: ['reject', 'queue_review', 'score_zero', 'flag'] }).notNull(),
  cooldownSeconds: integer('cooldown_seconds').notNull().default(0),
  description: text('description').notNull(),

  isActive: boolean('is_active').notNull().default(true),

  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  ventureTypeIdx: index('acs_velocity_venture_type_idx').on(table.ventureId, table.contributionType),
  activeIdx: index('acs_velocity_active_idx').on(table.isActive),
}));
```

---

## Code Examples

### 1. Submit a Contribution

```typescript
import { ACSService } from '@mcv/token-economy/acs';

const acs = inject(ACSService);

// Submit a code contribution (merged PR)
const contribution = await acs.submitContribution({
  userId: 'user_01HX9G3K7RMQNPV8FJSTZWEP4D',
  ventureId: 'venture_01HX9G4BMTNQ8PJK2RWXYZ1234',
  category: 'code',
  type: 'pull_request_merged',
  title: 'feat: add OAuth2 provider support',
  description: 'Implemented OAuth2 provider abstraction with Google and GitHub adapters',
  source: 'github',
  externalId: 'PR-1247',
  externalUrl: 'https://github.com/org/repo/pull/1247',
  metadata: {
    linesChanged: 342,
    filesChanged: 12,
    tags: ['feature', 'auth', 'oauth2'],
  },
  occurredAt: new Date('2026-02-08T15:30:00Z'),
  idempotencyKey: 'github:org/repo:pr:1247:merged',
});

console.log(contribution.id);            // "01HX9G5..."
console.log(contribution.status);        // "scored" (or "peer_review" if required)
console.log(contribution.computedScore); // 87

// Submit a content contribution
const article = await acs.submitContribution({
  userId: 'user_01HX9G3K7RMQNPV8FJSTZWEP4D',
  category: 'content',
  type: 'article_published',
  title: 'Getting Started with MCV Token Economy',
  source: 'cms',
  externalId: 'article-2024-0142',
  externalUrl: 'https://blog.mcv.dev/getting-started-token-economy',
  metadata: {
    wordCount: 2400,
    engagement: { views: 0, likes: 0, shares: 0 },
    tags: ['tutorial', 'token-economy', 'beginner'],
  },
  idempotencyKey: 'cms:article:2024-0142:published',
});

// Submit a referral
const referral = await acs.submitContribution({
  userId: 'user_01HX9G3K7RMQNPV8FJSTZWEP4D',
  category: 'growth',
  type: 'referral_conversion',
  title: 'Referred user completed onboarding',
  source: 'referral_system',
  externalId: 'ref-chain-8821',
  metadata: {
    referralDepth: 1,
    isFirstContribution: false,
  },
  idempotencyKey: 'referral:8821:conversion',
});

// Batch submission
const batchResult = await acs.submitContributionBatch([
  {
    userId: 'user_01HX9G3K7RMQNPV8FJSTZWEP4D',
    category: 'community',
    type: 'question_answered',
    title: 'Helped user with deployment issue',
    source: 'discord',
    externalId: 'discord:msg:1234567890',
    idempotencyKey: 'discord:answer:1234567890',
  },
  {
    userId: 'user_01HX9G3K7RMQNPV8FJSTZWEP4D',
    category: 'data',
    type: 'bug_report',
    title: 'Found race condition in scoring engine',
    source: 'api',
    metadata: { severity: 'high' },
    idempotencyKey: 'bugreport:2024-0088',
  },
]);

console.log(batchResult.succeeded.length); // 2
console.log(batchResult.failed.length);    // 0
```

### 2. Calculate Score and View Breakdown

```typescript
import { ACSService } from '@mcv/token-economy/acs';

const acs = inject(ACSService);
const userId = 'user_01HX9G3K7RMQNPV8FJSTZWEP4D';

// Get current score
const score = await acs.getScore(userId);

console.log(score.totalScore);         // 4,230
console.log(score.rawScore);           // 5,100 (before decay)
console.log(score.totalDecay);         // 870
console.log(score.contributionCount);  // 47
console.log(score.currentStreak);      // 12 (consecutive weeks)
console.log(score.convertibleScore);   // 2,100

// Category breakdown
console.log(score.categoryScores);
// {
//   code:      { score: 2115, rawScore: 2600, contributionCount: 18, percentage: 50 },
//   content:   { score: 846,  rawScore: 1020, contributionCount: 8,  percentage: 20 },
//   community: { score: 634,  rawScore: 765,  contributionCount: 12, percentage: 15 },
//   growth:    { score: 423,  rawScore: 510,  contributionCount: 5,  percentage: 10 },
//   data:      { score: 212,  rawScore: 205,  contributionCount: 4,  percentage: 5  },
// }

// Active multipliers
console.log(score.activeMultipliers);
// [
//   { type: 'streak', name: '12-Week Streak', value: 1.3 },
//   { type: 'quality', name: 'High Quality Contributor', value: 1.1 },
// ]

// Get detailed breakdown for a specific contribution
const breakdown = await acs.getScoreBreakdown('contribution_01HX9G5...');

console.log(breakdown.steps);
// [
//   {
//     name: 'Base Points',
//     description: 'PR merged base score',
//     inputValue: 0,
//     adjustment: 50,
//     outputValue: 50,
//     expression: 'basePoints = 50',
//   },
//   {
//     name: 'Lines Changed Scaling',
//     description: 'Scaled by lines changed (342 lines, capped at 500)',
//     inputValue: 50,
//     adjustment: 34.2,
//     outputValue: 84.2,
//     expression: 'base + min(linesChanged, 500) * 0.1 = 50 + 342 * 0.1',
//   },
//   {
//     name: 'Quality Gate',
//     description: 'Quality score: 85/100',
//     inputValue: 84.2,
//     adjustment: 0.85,
//     outputValue: 71.57,
//     expression: 'score * (qualityScore / 100) = 84.2 * 0.85',
//   },
//   {
//     name: 'Streak Multiplier',
//     description: '12-week streak (tier 3: 1.3x)',
//     inputValue: 71.57,
//     adjustment: 1.3,
//     outputValue: 93.04,
//     expression: 'score * streakMultiplier = 71.57 * 1.3',
//   },
//   {
//     name: 'Score Cap',
//     description: 'Capped at max score for contribution type',
//     inputValue: 93.04,
//     adjustment: 1,
//     outputValue: 87,  // Rounded, within cap
//     expression: 'min(score, maxScore) = min(93.04, 1000) → round(93.04) = 93',
//   },
// ]

// Score history over time
const history = await acs.getScoreHistory({
  userId,
  fromDate: new Date('2026-01-01'),
  toDate: new Date('2026-02-08'),
  granularity: 'weekly',
});

// Returns snapshots for each week, showing score progression
```

### 3. Query Leaderboards

```typescript
import { ACSService } from '@mcv/token-economy/acs';

const acs = inject(ACSService);

// Get global weekly leaderboard, top 25
const weeklyLeaderboard = await acs.getLeaderboard({
  scope: 'global',
  window: 'weekly',
  page: 1,
  pageSize: 25,
});

console.log(weeklyLeaderboard.name);              // "Global Weekly Leaderboard"
console.log(weeklyLeaderboard.totalParticipants);  // 1,247

weeklyLeaderboard.entries.forEach((entry) => {
  console.log(
    `#${entry.rank} ${entry.displayName}: ${entry.score} pts ` +
    `(${entry.contributionCount} contributions, ` +
    `${entry.streakLength}-week streak, ` +
    `${entry.rankChange > 0 ? '↑' : entry.rankChange < 0 ? '↓' : '–'}${Math.abs(entry.rankChange)})`
  );
});
// #1 alice_dev: 1,240 pts (23 contributions, 16-week streak, ↑2)
// #2 bob_builder: 1,180 pts (19 contributions, 12-week streak, ↓1)
// #3 carol_content: 1,050 pts (31 contributions, 8-week streak, ↑5)
// ...

// Get venture-specific leaderboard for code contributions
const ventureCodeLeaderboard = await acs.getLeaderboard({
  scope: 'venture',
  ventureId: 'venture_01HX9G4BMTNQ8PJK2RWXYZ1234',
  window: 'monthly',
  category: 'code',
  page: 1,
  pageSize: 10,
});

// Include current user's position (even if they're not in top 25)
const myLeaderboard = await acs.getLeaderboard({
  scope: 'global',
  window: 'all_time',
  page: 1,
  pageSize: 25,
  includeCurrentUser: 'user_01HX9G3K7RMQNPV8FJSTZWEP4D',
});

// The response includes the user's entry even if they're ranked #342
// myLeaderboard.entries will include their entry with rank: 342

// Get all rankings for a user
const myRankings = await acs.getUserRankings('user_01HX9G3K7RMQNPV8FJSTZWEP4D');

console.log(myRankings);
// [
//   { leaderboard: 'Global Weekly', rank: 15, score: 230, totalParticipants: 1247 },
//   { leaderboard: 'Global Monthly', rank: 28, score: 890, totalParticipants: 2340 },
//   { leaderboard: 'Global All-Time', rank: 342, score: 4230, totalParticipants: 8912 },
//   { leaderboard: 'Venture Alpha Weekly', rank: 3, score: 180, totalParticipants: 45 },
//   ...
// ]
```

### 4. Apply and Preview Decay

```typescript
import { ACSService } from '@mcv/token-economy/acs';

const acs = inject(ACSService);
const userId = 'user_01HX9G3K7RMQNPV8FJSTZWEP4D';

// Preview decay without applying it
const preview = await acs.previewDecay(userId);

console.log(preview);
// {
//   currentScore: 4230,
//   projectedScore: 4102,
//   decayAmount: 128,
//   daysSinceLastContribution: 3,
//   decayFunction: 'exponential',
// }

// Manually trigger decay for a user (admin/testing)
const decayResult = await acs.applyDecay(userId);

console.log(decayResult);
// {
//   id: '01HX9G8...',
//   userId: 'user_01HX9G3...',
//   decayFunctionId: '01HX9G7...',
//   scoreBefore: 4230,
//   scoreAfter: 4102,
//   decayAmount: 128,
//   decayPercent: '3.03',
//   daysSinceLastContribution: 3,
//   appliedAt: '2026-02-08T22:00:00.000Z',
// }

// Run batch decay for all users (normally scheduled)
const batchDecay = await acs.runDecayBatch();

console.log(batchDecay);
// {
//   usersProcessed: 3421,
//   totalDecayApplied: 185230,
//   errors: [],
// }

// Configure decay for a venture
await acs.upsertDecayConfig({
  ventureId: 'venture_01HX9G4BMTNQ8PJK2RWXYZ1234',
  type: 'exponential',
  config: {
    rate: 14,                    // Half-life of 14 days
    floor: 0,                   // Decay all the way to 0
    gracePeriodDays: 7,         // No decay for 7 days after last contribution
    maxDecayPerApplication: 10, // Max 10% decay per cycle
    decayConvertedScores: false, // Don't decay already-converted scores
  },
  schedule: {
    frequency: 'daily',
    hourUtc: 4,  // Run at 4 AM UTC
  },
  categoryOverrides: {
    // Community contributions decay slower (people build reputation)
    community: {
      rate: 28,  // 28-day half-life
      floor: 100,
      gracePeriodDays: 14,
      maxDecayPerApplication: 5,
      decayConvertedScores: false,
    },
  },
  isActive: true,
});
```

### 5. Convert Score to Tokens

```typescript
import { ACSService } from '@mcv/token-economy/acs';

const acs = inject(ACSService);
const userId = 'user_01HX9G3K7RMQNPV8FJSTZWEP4D';

// Preview conversion first
const preview = await acs.previewConversion({
  userId,
  ventureId: null,  // Global conversion
  scoreAmount: null, // Convert all available
  categories: null,  // All categories
  idempotencyKey: 'preview', // Not used for preview
});

console.log(preview);
// {
//   scoreToConvert: 2100,
//   tokensToReceive: 210,
//   rateUsed: 0.1,
//   categoryBreakdown: [
//     { category: 'code', score: 1050, tokens: 115.5, rate: 0.11 },
//     { category: 'content', score: 420, tokens: 42, rate: 0.10 },
//     { category: 'community', score: 315, tokens: 28.35, rate: 0.09 },
//     { category: 'growth', score: 210, tokens: 16.8, rate: 0.08 },
//     { category: 'data', score: 105, tokens: 7.35, rate: 0.07 },
//   ],
// }

// Execute conversion
const result = await acs.convertScore({
  userId,
  ventureId: null,
  scoreAmount: 1000,   // Convert 1000 points
  categories: ['code', 'content'],  // Only from these categories
  idempotencyKey: `convert:${userId}:${Date.now()}`,
});

console.log(result);
// {
//   id: '01HX9GA...',
//   userId: 'user_01HX9G3...',
//   scoreConverted: 1000,
//   tokensAwarded: 106,
//   rateUsed: 0.106,  // Blended rate
//   categoryBreakdown: [
//     { category: 'code', scoreConverted: 600, tokensAwarded: 66, rateUsed: 0.11 },
//     { category: 'content', scoreConverted: 400, tokensAwarded: 40, rateUsed: 0.10 },
//   ],
//   ledgerTransactionId: 'tx_01HX9GB...',
//   remainingConvertibleScore: 1100,
//   convertedAt: '2026-02-08T22:15:00.000Z',
// }

// Get conversion history
const history = await acs.getConversionHistory(userId);

console.log(history.totalTokensEarned);   // 316
console.log(history.periodUsage);
// {
//   tokensThisPeriod: 106,
//   maxTokensThisPeriod: 1000,
//   periodResetsAt: '2026-03-01T00:00:00.000Z',
// }

// Configure conversion rates for a venture
await acs.upsertConversionRate({
  ventureId: 'venture_01HX9G4BMTNQ8PJK2RWXYZ1234',
  tokensPerPoint: 0.15,           // Higher rate for this venture
  minimumScore: 100,              // Must have at least 100 points
  maxTokensPerConversion: 500,    // Cap per single conversion
  maxTokensPerPeriod: 2000,       // Cap per 30-day period
  periodDays: 30,
  isEnabled: true,
  categoryRates: {
    code: 0.20,                   // Premium rate for code in this venture
    content: 0.15,
    community: 0.12,
    growth: 0.10,
    data: 0.08,
  },
  effectiveFrom: new Date('2026-02-01'),
  effectiveTo: null,              // No end date
});
```

### 6. Anti-Gaming: Sybil Detection and Velocity Limits

```typescript
import { AntiGamingService } from '@mcv/token-economy/acs';

const antiGaming = inject(AntiGamingService);

// The anti-gaming service runs automatically during contribution ingestion,
// but can also be invoked directly for investigation.

// Check a specific user for Sybil indicators
const sybilCheck = await antiGaming.checkSybil('user_01HX9SUSPICIOUS');

console.log(sybilCheck);
// {
//   passed: false,
//   riskScore: 78,
//   signals: [
//     {
//       type: 'ip_overlap',
//       severity: 'high',
//       confidence: 0.92,
//       details: 'Shares IP 203.0.113.42 with 3 other accounts',
//       relatedUserIds: ['user_01HX...A', 'user_01HX...B', 'user_01HX...C'],
//     },
//     {
//       type: 'behavioral_anomaly',
//       severity: 'medium',
//       confidence: 0.71,
//       details: 'Contribution pattern matches coordinated activity (same times, similar content)',
//     },
//     {
//       type: 'timing_anomaly',
//       severity: 'medium',
//       confidence: 0.68,
//       details: 'All contributions within 2-minute windows across 5 consecutive days',
//     },
//   ],
//   recommendedAction: 'manual_review',
//   explanation: 'Multiple high-confidence fraud signals detected. Account shares infrastructure with 3 other accounts and exhibits coordinated contribution patterns.',
// }

// Check velocity for a contribution type
const velocityOk = await antiGaming.checkVelocity(
  'user_01HX9G3K7RMQNPV8FJSTZWEP4D',
  'pull_request_merged',
);

console.log(velocityOk);
// { allowed: true, remaining: 8, windowResetsAt: '2026-02-08T23:00:00Z' }

// Configure anti-gaming rules
await acs.upsertAntiGamingConfig({
  ventureId: null,  // Platform defaults
  velocityLimits: [
    {
      contributionType: 'pull_request_merged',
      maxCount: 10,
      windowSeconds: 86400,    // 10 PRs per day
      action: 'queue_review',
      cooldownSeconds: 3600,
      description: 'Max 10 merged PRs per day',
    },
    {
      contributionType: 'referral_signup',
      maxCount: 5,
      windowSeconds: 86400,    // 5 referrals per day
      action: 'reject',
      cooldownSeconds: 7200,
      description: 'Max 5 referral signups per day',
    },
    {
      contributionType: '*',
      maxCount: 50,
      windowSeconds: 86400,    // 50 total contributions per day
      action: 'flag',
      cooldownSeconds: 0,
      description: 'Flag accounts exceeding 50 daily contributions',
    },
  ],
  sybilDetection: {
    enabled: true,
    minAccountAgeDays: 7,
    minPlatformActions: 10,
    ipOverlapThreshold: 3,
    behaviorSimilarityThreshold: 0.75,
    fingerprintMatching: true,
  },
  qualityDefaults: {
    autoRejectBelow: 20,
    autoApproveAbove: 80,
    peerReviewRange: [20, 80],
  },
  scoreCaps: {
    maxPerDay: 500,
    maxPerCategoryPerDay: 250,
    maxPerContribution: 200,
  },
});
```

### 7. File and Resolve Appeals

```typescript
import { ACSService } from '@mcv/token-economy/acs';

const acs = inject(ACSService);

// User files an appeal for a rejected contribution
const appeal = await acs.fileAppeal({
  userId: 'user_01HX9G3K7RMQNPV8FJSTZWEP4D',
  contributionId: 'contribution_01HX9REJECTED',
  type: 'rejection_appeal',
  reason: 'My PR was rejected by the quality gate but it was a legitimate fix for issue #892. The low quality score is due to the PR only changing 3 lines, but those 3 lines fix a critical security vulnerability.',
  evidence: [
    {
      type: 'url',
      value: 'https://github.com/org/repo/pull/1250',
      description: 'Link to the PR showing the security fix',
    },
    {
      type: 'url',
      value: 'https://github.com/org/repo/issues/892',
      description: 'Original issue describing the vulnerability',
    },
    {
      type: 'text',
      value: 'CVE-2026-1234 — SQL injection in user search endpoint',
      description: 'The CVE this PR fixes',
    },
  ],
});

console.log(appeal.id);      // "01HX9GC..."
console.log(appeal.status);  // "open"

// Admin resolves the appeal
const resolved = await acs.resolveAppeal(appeal.id, {
  outcome: 'approved',
  explanation: 'The contribution was correctly identified as a critical security fix. The quality gate\'s line-count heuristic does not account for the severity of changes. Score has been manually adjusted to reflect the high-impact nature of this fix.',
  adjustment: {
    userId: 'user_01HX9G3K7RMQNPV8FJSTZWEP4D',
    ventureId: null,
    appealId: appeal.id,
    type: 'add',
    category: 'code',
    amount: 150,  // Premium score for critical security fix
    reason: 'Appeal approved: Critical security vulnerability fix (CVE-2026-1234)',
    adjustedBy: 'admin_01HX9ADMIN',
  },
  resolvedBy: 'admin_01HX9ADMIN',
});

console.log(resolved.status);                     // "approved"
console.log(resolved.resolution?.adjustment?.scoreAfter); // Previous + 150

// List open appeals for admin dashboard
const openAppeals = await acs.listAppeals({
  status: 'open',
  page: 1,
  pageSize: 20,
});

console.log(openAppeals.total);    // 7
console.log(openAppeals.appeals);  // Array of 7 open appeals
```

### 8. Configure Scoring Rules

```typescript
import { ACSService, DEFAULT_SCORING_RULES } from '@mcv/token-economy/acs';

const acs = inject(ACSService);

// View current rules
const currentRules = await acs.getScoringRules();
console.log(currentRules.length);  // 25 (default rules for all contribution types)

// Create a venture-specific rule that overrides the platform default
await acs.upsertScoringRule({
  ventureId: 'venture_01HX9G4BMTNQ8PJK2RWXYZ1234',
  contributionType: 'pull_request_merged',
  name: 'Premium PR Scoring',
  description: 'Higher base score for merged PRs in this developer-focused venture',
  formula: {
    basePoints: 75,  // Higher than platform default of 50
    mode: 'scaled',
    scaleField: 'linesChanged',
    pointsPerUnit: 0.15,       // More generous per-line scaling
    scaleMin: 10,              // Minimum 10 lines to count scaling
    scaleMax: 1000,            // Cap at 1000 lines
    bonuses: [
      {
        condition: 'metadata.filesChanged > 5',
        points: 20,
        description: 'Multi-file change bonus',
      },
      {
        condition: 'metadata.tags.includes("security")',
        points: 50,
        description: 'Security-related PR bonus',
      },
    ],
  },
  qualityGate: {
    checks: [
      {
        field: 'metadata.linesChanged',
        operator: 'gt',
        value: 0,
        failMessage: 'PR must have at least 1 line changed',
      },
    ],
    minAutoScore: 30,
    allowManualOverride: true,
  },
  requiresPeerReview: false,
  minimumQualityScore: 30,
  maxScore: 500,
  isActive: true,
  priority: 10,  // Higher than platform default (0)
});

// Configure multipliers
await acs.upsertMultiplier({
  ventureId: 'venture_01HX9G4BMTNQ8PJK2RWXYZ1234',
  type: 'streak',
  name: 'Weekly Streak Bonus',
  description: 'Bonus for consecutive weeks of contribution',
  value: 1.0,  // Base (tiers defined in config)
  config: {
    streakConfig: {
      periodType: 'weekly',
      tiers: [
        { minStreak: 2, multiplier: 1.1 },    // 2 weeks: 10% bonus
        { minStreak: 4, multiplier: 1.2 },    // 4 weeks: 20% bonus
        { minStreak: 8, multiplier: 1.3 },    // 8 weeks: 30% bonus
        { minStreak: 16, multiplier: 1.5 },   // 16 weeks: 50% bonus
        { minStreak: 52, multiplier: 2.0 },   // 1 year: 100% bonus
      ],
      gracePeriods: 1,  // Can miss 1 week without losing streak
      maxMultiplier: 2.0,
    },
  },
  isActive: true,
  stackable: true,
  maxStackValue: 3.0,
  priority: 0,
});

// Configure a time-limited event multiplier (e.g., hackathon)
await acs.upsertMultiplier({
  ventureId: 'venture_01HX9G4BMTNQ8PJK2RWXYZ1234',
  type: 'event',
  name: 'February Hackathon 2x',
  description: 'Double points for all contributions during the February hackathon',
  value: 2.0,
  config: {
    eventWindow: {
      startsAt: new Date('2026-02-15T00:00:00Z'),
      endsAt: new Date('2026-02-17T23:59:59Z'),
    },
  },
  isActive: true,
  stackable: true,
  maxStackValue: 4.0,
  priority: 5,
});
```

---

## Error Codes

| Code | Constant | HTTP | Description |
|------|----------|------|-------------|
| `ACS_CONTRIBUTION_NOT_FOUND` | `ACS_ERRORS.CONTRIBUTION_NOT_FOUND` | 404 | Contribution with the given ID does not exist |
| `ACS_DUPLICATE_CONTRIBUTION` | `ACS_ERRORS.DUPLICATE_CONTRIBUTION` | 409 | A contribution with this idempotency key already exists |
| `ACS_VELOCITY_EXCEEDED` | `ACS_ERRORS.VELOCITY_EXCEEDED` | 429 | User has exceeded the contribution rate limit for this type |
| `ACS_SYBIL_DETECTED` | `ACS_ERRORS.SYBIL_DETECTED` | 403 | Contribution rejected due to Sybil detection signals |
| `ACS_QUALITY_GATE_FAILED` | `ACS_ERRORS.QUALITY_GATE_FAILED` | 422 | Contribution did not pass quality gate requirements |
| `ACS_SCORE_NOT_FOUND` | `ACS_ERRORS.SCORE_NOT_FOUND` | 404 | No score record exists for this user/venture combination |
| `ACS_INSUFFICIENT_SCORE` | `ACS_ERRORS.INSUFFICIENT_SCORE` | 422 | User does not have enough convertible score for this conversion |
| `ACS_CONVERSION_LIMIT_EXCEEDED` | `ACS_ERRORS.CONVERSION_LIMIT_EXCEEDED` | 429 | User has exceeded the token conversion limit for this period |
| `ACS_CONVERSION_DISABLED` | `ACS_ERRORS.CONVERSION_DISABLED` | 503 | Token conversion is currently disabled for this venture |
| `ACS_APPEAL_NOT_FOUND` | `ACS_ERRORS.APPEAL_NOT_FOUND` | 404 | Appeal with the given ID does not exist |
| `ACS_APPEAL_ALREADY_RESOLVED` | `ACS_ERRORS.APPEAL_ALREADY_RESOLVED` | 409 | This appeal has already been resolved and cannot be modified |
| `ACS_APPEAL_LIMIT_EXCEEDED` | `ACS_ERRORS.APPEAL_LIMIT_EXCEEDED` | 429 | User has filed too many appeals in the current period |
| `ACS_SCORING_RULE_NOT_FOUND` | `ACS_ERRORS.SCORING_RULE_NOT_FOUND` | 404 | No scoring rule matches this contribution type/venture |
| `ACS_INVALID_FORMULA` | `ACS_ERRORS.INVALID_FORMULA` | 422 | Scoring formula expression is invalid or references unknown variables |
| `ACS_DECAY_CONFIG_NOT_FOUND` | `ACS_ERRORS.DECAY_CONFIG_NOT_FOUND` | 404 | No decay configuration found for this venture |
| `ACS_SCORE_CAP_REACHED` | `ACS_ERRORS.SCORE_CAP_REACHED` | 422 | User has reached the daily or per-contribution score cap |
| `ACS_ACCOUNT_TOO_NEW` | `ACS_ERRORS.ACCOUNT_TOO_NEW` | 403 | Account does not meet the minimum age requirement for contributions |
| `ACS_PEER_REVIEW_REQUIRED` | `ACS_ERRORS.PEER_REVIEW_REQUIRED` | 202 | Contribution accepted but requires peer review before scoring |
| `ACS_LEDGER_UNAVAILABLE` | `ACS_ERRORS.LEDGER_UNAVAILABLE` | 503 | Token ledger is unavailable; conversion cannot be completed |
| `ACS_INVALID_CATEGORY` | `ACS_ERRORS.INVALID_CATEGORY` | 422 | The specified contribution category is not valid |

### Error Response Format

```typescript
import { ACS_ERRORS } from '@mcv/token-economy/acs';

// All ACS errors follow the standard MCV error format
interface ACSError {
  code: string;           // e.g., "ACS_VELOCITY_EXCEEDED"
  message: string;        // Human-readable description
  statusCode: number;     // HTTP status code
  details?: {
    userId?: string;
    contributionType?: string;
    limit?: number;
    windowSeconds?: number;
    cooldownSeconds?: number;
    resetsAt?: string;     // ISO timestamp
    signals?: FraudSignal[];
    failedChecks?: string[];
    [key: string]: unknown;
  };
}

// Example error handling
try {
  await acs.submitContribution(input);
} catch (error) {
  if (error.code === ACS_ERRORS.VELOCITY_EXCEEDED) {
    console.log(`Rate limited. Try again after ${error.details.resetsAt}`);
  } else if (error.code === ACS_ERRORS.SYBIL_DETECTED) {
    console.log(`Blocked: ${error.details.signals?.map(s => s.type).join(', ')}`);
  } else if (error.code === ACS_ERRORS.QUALITY_GATE_FAILED) {
    console.log(`Quality issues: ${error.details.failedChecks?.join(', ')}`);
  }
}
```

---

## Events

ACS emits events for all significant state changes, enabling real-time dashboards, notifications, and downstream processing.

```typescript
export const ACS_EVENTS = {
  CONTRIBUTION_RECORDED: 'acs.contribution.recorded',
  CONTRIBUTION_SCORED: 'acs.contribution.scored',
  CONTRIBUTION_REJECTED: 'acs.contribution.rejected',
  CONTRIBUTION_VOIDED: 'acs.contribution.voided',

  SCORE_CALCULATED: 'acs.score.calculated',
  SCORE_UPDATED: 'acs.score.updated',
  SCORE_DECAYED: 'acs.score.decayed',
  SCORE_RECALCULATED: 'acs.score.recalculated',

  LEADERBOARD_UPDATED: 'acs.leaderboard.updated',
  RANK_CHANGED: 'acs.rank.changed',

  CONVERSION_COMPLETED: 'acs.conversion.completed',
  CONVERSION_BATCH_COMPLETED: 'acs.conversion.batch_completed',

  APPEAL_FILED: 'acs.appeal.filed',
  APPEAL_RESOLVED: 'acs.appeal.resolved',

  FRAUD_DETECTED: 'acs.fraud.detected',
  FRAUD_RESOLVED: 'acs.fraud.resolved',

  MULTIPLIER_APPLIED: 'acs.multiplier.applied',
  STREAK_UPDATED: 'acs.streak.updated',
  STREAK_BROKEN: 'acs.streak.broken',

  MANUAL_ADJUSTMENT: 'acs.adjustment.manual',
} as const;

// Event payload types
interface ContributionRecordedEvent {
  contributionId: string;
  userId: string;
  ventureId: string | null;
  category: ContributionCategory;
  type: ContributionType;
  title: string;
  source: ContributionSource;
  occurredAt: string;
}

interface ScoreCalculatedEvent {
  contributionId: string;
  userId: string;
  ventureId: string | null;
  score: number;
  breakdown: ScoreComponent[];
  newTotalScore: number;
  previousTotalScore: number;
}

interface ScoreDecayedEvent {
  userId: string;
  ventureId: string | null;
  scoreBefore: number;
  scoreAfter: number;
  decayAmount: number;
  decayType: DecayType;
  daysSinceLastContribution: number;
}

interface LeaderboardUpdatedEvent {
  scope: LeaderboardScope;
  ventureId: string | null;
  window: LeaderboardWindow;
  category: ContributionCategory | null;
  topEntries: Array<{ userId: string; rank: number; score: number }>;
  totalParticipants: number;
}

interface ConversionCompletedEvent {
  conversionId: string;
  userId: string;
  ventureId: string | null;
  scoreConverted: number;
  tokensAwarded: number;
  ledgerTransactionId: string;
}

interface AppealFiledEvent {
  appealId: string;
  userId: string;
  contributionId: string | null;
  type: Appeal['type'];
  reason: string;
}

interface AppealResolvedEvent {
  appealId: string;
  userId: string;
  outcome: AppealResolution['outcome'];
  adjustmentAmount: number | null;
  resolvedBy: string;
}

interface FraudDetectedEvent {
  userId: string;
  contributionId: string | null;
  signals: FraudSignal[];
  actionTaken: string;
  riskScore: number;
}

interface MultiplierAppliedEvent {
  userId: string;
  contributionId: string;
  multiplierType: MultiplierType;
  multiplierName: string;
  multiplierValue: number;
  scoreBefore: number;
  scoreAfter: number;
}
```

### Event Subscription Example

```typescript
import { EventBus } from '@mcv/events';
import { ACS_EVENTS, type ScoreCalculatedEvent } from '@mcv/token-economy/acs';

const events = inject(EventBus);

// React to score calculations for real-time dashboard
events.on(ACS_EVENTS.SCORE_CALCULATED, (event: ScoreCalculatedEvent) => {
  console.log(`User ${event.userId} earned ${event.score} points for contribution ${event.contributionId}`);
  console.log(`New total: ${event.newTotalScore} (was ${event.previousTotalScore})`);
});

// Alert on fraud detection
events.on(ACS_EVENTS.FRAUD_DETECTED, (event: FraudDetectedEvent) => {
  if (event.signals.some(s => s.severity === 'critical')) {
    alertAdmins(`Critical fraud signal for user ${event.userId}: ${event.signals.map(s => s.type).join(', ')}`);
  }
});

// Celebrate streak milestones
events.on(ACS_EVENTS.STREAK_UPDATED, (event) => {
  if ([4, 8, 16, 52].includes(event.newStreak)) {
    notifyUser(event.userId, `🔥 ${event.newStreak}-week contribution streak! Your multiplier is now ${event.newMultiplier}x`);
  }
});

// Notify when rank changes significantly
events.on(ACS_EVENTS.RANK_CHANGED, (event) => {
  if (event.change >= 10) {
    notifyUser(event.userId, `📈 You climbed ${event.change} spots on the leaderboard! Now #${event.newRank}`);
  }
});
```

---

## Security

### Anti-Gaming Strategy

Anti-gaming is the most critical security concern for ACS. If the scoring system can be gamed, the entire token economy's integrity collapses. ACS employs multiple overlapping defense layers:

#### Layer 1: Input Validation & Rate Limiting

- **Velocity limits** — Per-type and global contribution rate limits prevent flood attacks. A user cannot submit more than N contributions of type X within Y seconds. Limits are configurable per venture and per contribution type.
- **Idempotency keys** — Every contribution requires a unique idempotency key, preventing duplicate submissions. The ingestion layer rejects duplicates with a 409 response.
- **Account age requirements** — New accounts must be at least N days old (default: 7) with at least M platform actions (default: 10) before contributions are scored.

#### Layer 2: Sybil Detection

- **IP clustering** — Tracks IP addresses across accounts. When multiple accounts share IPs beyond a configurable threshold, all are flagged for review. Uses IP ranges and VPN detection heuristics.
- **Device fingerprinting** — Browser and device fingerprints are collected during contribution events. Similar fingerprints across accounts trigger fraud signals.
- **Behavioral analysis** — Machine learning models detect coordinated contribution patterns: same timing windows, similar content, synchronized activity bursts.
- **Social graph analysis** — Referral chains are monitored for closed loops (A refers B refers C refers A). Self-referral detection blocks circular reward farming.

#### Layer 3: Quality Gates

- **Automated quality scoring** — Each contribution type has automated quality heuristics. Code contributions are assessed by diff complexity, test coverage changes, and CI results. Content is assessed by word count, originality, and engagement signals over time.
- **Peer review** — High-value contributions (above configurable thresholds) require peer review before scoring. Reviewers are randomly selected from qualified contributors to prevent collusion.
- **Score caps** — No single contribution can exceed `maxPerContribution` points. No user can earn more than `maxPerDay` points in 24 hours. These hard caps prevent outlier gaming.

#### Layer 4: Post-Hoc Detection

- **Score velocity analysis** — Rapid score increases trigger alerts. The system tracks score growth rate and flags anomalies.
- **Cross-account correlation** — Periodic batch jobs analyze contribution patterns across all accounts for coordinated gaming that individual checks might miss.
- **Content duplication** — Text contributions are checked for duplication across the platform. Copy-paste farming of articles, tutorials, or forum posts is detected and penalized.
- **Retroactive penalties** — When a Sybil cluster is identified, all accounts in the cluster have their scores voided retroactively.

#### Layer 5: Human Oversight

- **Admin dashboard** — Real-time fraud signal monitoring with severity-based prioritization.
- **Manual review queue** — Flagged contributions and accounts are queued for human review.
- **Appeal system** — Users can dispute rejections, providing a safety valve for false positives.
- **Audit trail** — Every score calculation, decay application, and adjustment is logged immutably for forensic analysis.

### Authentication & Authorization

```
ACS endpoints require valid session tokens. Contribution submission requires authenticated users.
Admin operations (void, manual adjustment, appeal resolution) require `acs:admin` permission.
Scoring rule management requires `acs:config` permission.
Read-only leaderboard and score queries are available to all authenticated users.
Users can only view their own detailed score breakdowns; aggregate leaderboards are public.
```

### Data Protection

- Score breakdowns are visible only to the contributing user and admins
- Fraud signals and admin notes are never exposed to end users
- IP addresses and device fingerprints are stored encrypted at rest
- Contribution metadata from external systems is sanitized before storage
- Personal identifiers are pseudonymized in leaderboard entries unless the user opts in to display

---

## Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `ACS_DATABASE_URL` | Yes | — | PostgreSQL connection string for ACS tables |
| `ACS_REDIS_URL` | Yes | — | Redis connection string for velocity limit counters and leaderboard caching |
| `ACS_DECAY_ENABLED` | No | `true` | Enable/disable automatic decay processing |
| `ACS_DECAY_CRON` | No | `0 4 * * *` | Cron schedule for decay processing (default: 4 AM UTC daily) |
| `ACS_LEADERBOARD_CRON` | No | `*/15 * * * *` | Cron schedule for leaderboard recomputation (default: every 15 minutes) |
| `ACS_CONVERSION_ENABLED` | No | `true` | Enable/disable score-to-token conversion |
| `ACS_BATCH_CONVERSION_CRON` | No | `0 0 1 * *` | Cron schedule for batch conversions (default: 1st of each month) |
| `ACS_SYBIL_DETECTION_ENABLED` | No | `true` | Enable/disable Sybil detection checks |
| `ACS_MAX_BATCH_SIZE` | No | `1000` | Maximum contributions per batch submission |
| `ACS_SCORE_CACHE_TTL_SECONDS` | No | `300` | TTL for cached user scores (5 minutes) |
| `ACS_LEADERBOARD_CACHE_TTL_SECONDS` | No | `60` | TTL for cached leaderboard data (1 minute) |
| `ACS_FRAUD_ALERT_WEBHOOK` | No | — | Webhook URL for critical fraud alerts |
| `ACS_QUALITY_SERVICE_URL` | No | — | External quality assessment service URL (for advanced quality scoring) |
| `ACS_GITHUB_WEBHOOK_SECRET` | No | — | Secret for validating GitHub webhook payloads |
| `ACS_PEER_REVIEW_TIMEOUT_HOURS` | No | `72` | Hours before peer review times out and auto-approves |
| `ACS_APPEAL_MAX_PER_MONTH` | No | `5` | Maximum appeals a user can file per month |
| `ACS_LOG_LEVEL` | No | `info` | Log level for ACS services |

---

## Dependencies

### Internal Dependencies

| Package | Purpose |
|---------|---------|
| `@mcv/token-economy/ledger` | Token ledger integration for score-to-EDGE conversions |
| `@mcv/token-economy/treasury` | Treasury balance checks for conversion funding |
| `@mcv/auth` | Authentication and authorization for API endpoints |
| `@mcv/events` | Event bus for publishing ACS events |
| `@mcv/ids` | ULID generation for entity identifiers |
| `@mcv/db` | Shared database utilities, connection pooling, migration runner |
| `@mcv/cache` | Redis-backed caching for scores and leaderboards |
| `@mcv/jobs` | Job queue for scheduled decay, leaderboard computation, batch conversion |
| `@mcv/logging` | Structured logging with correlation IDs |
| `@mcv/errors` | Standard error types and error handling utilities |

### External Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| `drizzle-orm` | `^0.35.x` | Database ORM for schema definitions and queries |
| `ioredis` | `^5.x` | Redis client for velocity counters and caching |
| `mathjs` | `^13.x` | Safe expression evaluation for custom scoring formulas |
| `cron-parser` | `^5.x` | Cron expression parsing for scheduled jobs |
| `murmurhash` | `^2.x` | Fast hashing for idempotency key deduplication |
| `zod` | `^3.x` | Runtime validation for contribution inputs and configuration |

---

## Testing

### Unit Tests

```bash
# Run all ACS unit tests
pnpm test --filter=@mcv/token-economy/acs

# Run specific test suites
pnpm test --filter=@mcv/token-economy/acs -- --grep "ScoringEngine"
pnpm test --filter=@mcv/token-economy/acs -- --grep "DecayEngine"
pnpm test --filter=@mcv/token-economy/acs -- --grep "AntiGaming"
pnpm test --filter=@mcv/token-economy/acs -- --grep "Leaderboard"
pnpm test --filter=@mcv/token-economy/acs -- --grep "Conversion"
```

### Test Coverage Requirements

| Area | Minimum Coverage | Notes |
|------|-----------------|-------|
| Scoring Engine | 95% | Core business logic, must be thoroughly tested |
| Anti-Gaming | 95% | Security-critical, false negatives have real cost |
| Decay Engine | 90% | Mathematical functions must be precise |
| Conversion | 90% | Financial operations require high confidence |
| Leaderboard | 85% | Query logic, ranking, pagination |
| Appeals | 80% | Workflow state machine |
| Contribution Ingestion | 90% | Validation and deduplication |

### Key Test Scenarios

```typescript
describe('ScoringEngine', () => {
  // Fixed mode scoring
  it('should calculate fixed base points correctly');
  it('should calculate scaled scoring with linesChanged');
  it('should respect scaleMin and scaleMax bounds');
  it('should evaluate custom formula expressions safely');
  it('should reject unsafe formula expressions (no code injection)');
  it('should apply quality gate multiplier');
  it('should apply bonuses when conditions are met');
  it('should not apply bonuses when conditions fail');
  it('should cap score at maxScore');
  it('should apply venture-specific rules over platform defaults');
  it('should resolve rules by priority when multiple match');
  it('should return zero for contributions that fail quality gate');
});

describe('MultiplierEngine', () => {
  it('should apply streak multiplier based on tier');
  it('should apply first-contribution bonus');
  it('should stack stackable multipliers');
  it('should not stack non-stackable multipliers (use highest priority)');
  it('should cap combined multiplier at maxStackValue');
  it('should apply event multipliers only within event window');
  it('should apply quality multiplier for high-quality contributions');
  it('should reset streak after grace period expires');
  it('should maintain streak through grace period');
});

describe('DecayEngine', () => {
  it('should apply exponential decay correctly (half-life)');
  it('should apply linear decay correctly (fixed points per day)');
  it('should apply step decay at correct boundaries');
  it('should respect grace period (no decay within grace)');
  it('should respect floor (never decay below floor)');
  it('should respect maxDecayPerApplication');
  it('should not decay during grace period');
  it('should apply category-specific overrides');
  it('should not decay already-converted scores when configured');
  it('should handle users with no contributions (no decay needed)');
  it('should log decay application for audit trail');
});

describe('AntiGamingService', () => {
  it('should enforce velocity limits per contribution type');
  it('should enforce global velocity limits');
  it('should apply cooldown after velocity limit is hit');
  it('should detect IP overlap between accounts');
  it('should detect device fingerprint overlap');
  it('should flag coordinated contribution patterns');
  it('should detect self-referral loops');
  it('should detect content duplication');
  it('should reject accounts below minimum age');
  it('should reject accounts with insufficient platform actions');
  it('should enforce daily score caps');
  it('should enforce per-contribution score caps');
  it('should enforce per-category daily caps');
  it('should produce actionable fraud signals with evidence');
});

describe('LeaderboardService', () => {
  it('should compute global weekly leaderboard correctly');
  it('should compute venture-specific leaderboard');
  it('should filter leaderboard by category');
  it('should paginate leaderboard results');
  it('should include requested user even if not on current page');
  it('should track rank changes between snapshots');
  it('should handle ties in score (stable sort by userId)');
  it('should respect minScore filter');
  it('should compute all time windows correctly');
});

describe('ConversionService', () => {
  it('should convert score to tokens at correct rate');
  it('should apply category-specific rates when configured');
  it('should enforce minimum score requirement');
  it('should enforce maxTokensPerConversion');
  it('should enforce maxTokensPerPeriod across multiple conversions');
  it('should create ledger transaction on successful conversion');
  it('should reduce convertibleScore after conversion');
  it('should handle partial category conversion');
  it('should reject conversion when conversion is disabled');
  it('should handle idempotent conversion requests');
  it('should roll back on ledger failure');
});

describe('AppealService', () => {
  it('should create appeal with valid input');
  it('should enforce appeal limit per month');
  it('should transition through status workflow correctly');
  it('should apply manual adjustment on appeal approval');
  it('should not allow resolving already-resolved appeals');
  it('should track admin notes internally');
  it('should filter appeals by status, type, user, venture');
});

describe('ContributionIngestion', () => {
  it('should validate all required fields');
  it('should reject duplicate idempotency keys');
  it('should normalize metadata from different sources');
  it('should route contributions through anti-gaming pipeline');
  it('should set status to peer_review when required');
  it('should handle batch submissions with partial failures');
  it('should emit ContributionRecorded event on success');
  it('should emit FraudDetected event on rejection');
});
```

### Integration Tests

```typescript
describe('ACS Integration', () => {
  it('should process a contribution end-to-end: submit → score → leaderboard');
  it('should apply decay and reflect in leaderboard rankings');
  it('should convert score and create ledger entry');
  it('should handle concurrent submissions from the same user');
  it('should handle webhook replay (idempotency)');
  it('should recalculate scores after rule change');
  it('should void contribution and recalculate affected scores');
  it('should process appeal → approve → adjust → recalculate');
});
```

### Load Tests

```typescript
describe('ACS Load', () => {
  it('should handle 1000 concurrent contribution submissions');
  it('should compute leaderboard for 100k users within 5 seconds');
  it('should apply batch decay for 50k users within 30 seconds');
  it('should handle batch conversion for 10k users within 60 seconds');
});
```

### Seed Data

For development and testing, use the seeder to populate realistic contribution data:

```bash
# Seed 1000 users with random contributions over 90 days
pnpm exec acs-seed --users 1000 --days 90 --contributions-per-user 50

# Seed with Sybil clusters for anti-gaming testing
pnpm exec acs-seed --users 100 --sybil-clusters 5 --cluster-size 3

# Seed with specific venture context
pnpm exec acs-seed --venture venture_01HX9G4BMTNQ8PJK2RWXYZ1234 --users 200
```

---

## Default Scoring Rules Reference

The platform ships with default scoring rules for all contribution types. Ventures can override any of these.

| Contribution Type | Base Points | Mode | Scale Field | Points/Unit | Max Score |
|---|---|---|---|---|---|
| `pull_request_merged` | 50 | scaled | linesChanged | 0.10 | 500 |
| `pull_request_reviewed` | 25 | fixed | — | — | 200 |
| `commit` | 10 | scaled | linesChanged | 0.05 | 100 |
| `issue_opened` | 15 | fixed | — | — | 100 |
| `issue_resolved` | 30 | fixed | — | — | 200 |
| `code_review_comment` | 10 | fixed | — | — | 50 |
| `article_published` | 40 | scaled | wordCount | 0.01 | 300 |
| `tutorial_created` | 60 | scaled | wordCount | 0.015 | 400 |
| `video_published` | 50 | fixed | — | — | 300 |
| `documentation_updated` | 20 | scaled | wordCount | 0.008 | 150 |
| `translation_submitted` | 30 | scaled | wordCount | 0.012 | 200 |
| `question_answered` | 15 | fixed | — | — | 100 |
| `forum_post` | 10 | fixed | — | — | 75 |
| `moderation_action` | 5 | fixed | — | — | 50 |
| `event_organized` | 100 | fixed | — | — | 500 |
| `mentoring_session` | 40 | fixed | — | — | 200 |
| `community_support` | 10 | fixed | — | — | 75 |
| `referral_signup` | 20 | fixed | — | — | 100 |
| `referral_conversion` | 50 | fixed | — | — | 200 |
| `social_share` | 5 | fixed | — | — | 25 |
| `ambassador_activity` | 30 | fixed | — | — | 150 |
| `bug_report` | 20 | fixed | — | — | 200 |
| `feature_request` | 10 | fixed | — | — | 75 |
| `feedback_submitted` | 10 | fixed | — | — | 50 |
| `survey_completed` | 15 | fixed | — | — | 50 |
| `beta_testing` | 25 | fixed | — | — | 150 |

**Severity bonuses** (applied to bug reports):
- Critical: +100 points
- High: +50 points
- Medium: +20 points
- Low: +0 points

---

## Glossary

| Term | Definition |
|------|-----------|
| **Contribution** | Any tracked user action that can earn score points |
| **Scoring Rule** | Configuration defining how a contribution type maps to points |
| **Quality Gate** | Automated checks that contributions must pass before scoring |
| **Decay** | Scheduled reduction of scores over time to incentivize ongoing participation |
| **Grace Period** | Days after last contribution during which no decay is applied |
| **Half-Life** | For exponential decay, the number of days for score to halve |
| **Velocity Limit** | Rate limit on contribution submissions per time window |
| **Sybil Attack** | Creating fake accounts to earn illegitimate rewards |
| **Multiplier** | Bonus factor applied to scores (streak, event, quality, etc.) |
| **Streak** | Consecutive active periods (days or weeks) of contribution |
| **Conversion** | Process of exchanging accumulated score points for EDGE tokens |
| **Convertible Score** | Score points available for token conversion (not yet converted) |
| **Leaderboard Window** | Time period for leaderboard computation (weekly, monthly, all-time) |
| **Appeal** | User-initiated dispute of a scoring decision or rejection |
| **Manual Adjustment** | Admin-initiated score change, typically from appeal resolution |
| **Fraud Signal** | Detected indicator of gaming, Sybil, or abuse behavior |

---

*Last updated: 2026-02-08*