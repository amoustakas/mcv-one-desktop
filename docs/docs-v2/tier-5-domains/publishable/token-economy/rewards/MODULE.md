# @mcv/token-economy/rewards — Rewards Submodule

**Parent Package:** @mcv/token-economy  
**Submodule:** rewards  
**Tier:** 5 (Domain Layer — Publishable)  
**Classification:** PUBLISHABLE  
**Version:** 1.0.0  
**Last Updated:** February 9, 2026

---

## Purpose

The `rewards` submodule implements the complete token reward lifecycle for the MCV ecosystem. It governs how users earn off-chain points through actions across all nine ventures, how those points are managed through reward programs with budgets and eligibility rules, how they convert to on-chain EDGE tokens through ACS-governed conversion rates, and how tokens are distributed through batched Solana transactions with full audit trails.

**Every EDGE token that reaches a user wallet — whether from betting rewards, SEO contributions, grant milestones, gaming achievements, or referrals — flows through this module.**

The rewards engine bridges two worlds: **off-chain scoring** (fast, cheap, flexible — points, programs, tiers) and **on-chain distribution** (immutable, verifiable, trustless — SPL transfers, vesting claims). The point ledger is append-only and immutable — no updates, no deletes. This is the critical security invariant that makes the entire system auditable and tamper-proof.

### Key Capabilities

- **Point Accrual** — Record points from any venture action with anti-gaming checks on every entry
- **Reward Programs** — Define programs with budgets, eligibility rules, earn rules, and emission schedules
- **Reward Pools** — Token budget management with per-venture allocation percentages
- **Vesting Schedules** — Linear, cliff-linear, graded, and immediate vesting for reward claims
- **Claim Workflows** — Wallet-verified claims with approval thresholds and retry logic
- **Points→Tokens Conversion** — ACS-regime-governed conversion with rate limits and KYC gates
- **Distribution Batching** — Batched Solana transactions (up to 500 recipients per batch)
- **Anti-Gaming Engine** — 8-check composite scoring: rate limits, velocity, device fingerprinting, IP reputation, referral chain analysis, bot detection, Sybil detection, anomalous value detection
- **Cross-Venture Rewards** — Rules that trigger bonus points in Venture B when actions occur in Venture A
- **Tier System** — Lifetime-points-based tiers (Bronze→Diamond) with multipliers and benefits

---

## Exports

```typescript
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// SERVICES
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export {
  rewardsService,                  // Point accrual, balance queries, redemption
  distributionService,             // On-chain token distribution batch management
  conversionService,               // Points-to-tokens conversion engine
  antiGamingService,               // Abuse detection and prevention engine
  rewardPoolService,               // Reward pool management and budget tracking
  vestingRewardService,            // Reward vesting schedules and claims
} from './service';

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// SERVICE INPUT TYPES
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export type {
  AccruePointsInput,               // Record a point entry for a user action
  CreateProgramInput,              // Create a new reward program definition
  UpdateProgramInput,              // Update an existing reward program
  CreateDistributionBatchInput,    // Create a token distribution batch
  ConvertPointsInput,              // Convert user points to EDGE tokens
  CreateRewardPoolInput,           // Create a reward pool with token budget
  CreateVestingScheduleInput,      // Create a vesting schedule for rewards
  ClaimRewardInput,                // Claim vested or available token rewards
  CreateCrossVentureRuleInput,     // Create a cross-venture reward rule
} from './service';

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// SCHEMA EXPORTS (Drizzle ORM)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export {
  pointEntries,                    // Immutable point ledger (append-only)
  pointBalances,                   // Materialized balance snapshots
  rewardPrograms,                  // Reward program definitions
  programParticipants,             // Program enrollment tracking
  rewardPools,                     // Token reward pool budgets
  rewardPoolAllocations,           // Per-venture pool allocations
  rewardVestingSchedules,          // Reward vesting configurations
  rewardClaims,                    // Claim history and status
  distributionBatches,             // On-chain distribution batches
  distributionRecipients,          // Individual distribution records
  conversionRules,                 // Points→tokens conversion rules
  conversionHistory,               // Conversion transaction history
  rewardAbuseFlags,                // Flagged suspicious activity
  crossVentureRewardRules,         // Cross-venture reward mappings
  pointSourceEnum,                 // Point source enum
  programTypeEnum,                 // Program type enum
  programStatusEnum,               // Program status enum
} from './schema';

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// ANTI-GAMING EXPORTS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export {
  AntiGamingEngine,                // Composite abuse detection engine
} from './anti-gaming';

export type {
  AntiGamingCheckParams,           // Input parameters for abuse check
  AntiGamingResult,                // Result with score, flags, action
  AntiGamingDetail,                // Individual check result detail
  RiskProfile,                     // User risk profile summary
  PatternScanResult,               // Batch pattern scan results
} from './anti-gaming';

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// CONSTANTS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export {
  POINT_SOURCES,                   // All valid point source identifiers
  PROGRAM_TYPES,                   // Reward program types
  PROGRAM_STATUSES,                // Program status values
  TIER_THRESHOLDS,                 // Lifetime points required per tier
  TIER_MULTIPLIERS,                // Point earning multipliers per tier
  TIER_BENEFITS,                   // Benefits unlocked per tier
  MAX_BATCH_SIZE,                  // Maximum recipients per distribution batch (500)
  MAX_POINTS_PER_ACTION,           // Safety cap on single point accrual
  EDGE_TOKEN_MINT,                 // EDGE SPL token mint address
  EDGE_TOKEN_DECIMALS,             // EDGE token decimal places (9)
  DEFAULT_ANTI_GAMING_THRESHOLDS,  // Default scoring thresholds
  VENTURE_REWARD_MULTIPLIERS,      // Per-venture base multipliers
  SUPPORTED_PAYMENT_TOKENS,        // Accepted payment tokens for conversions
} from './constants';

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// TYPES
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export type {
  PointSource,
  ProgramType,
  ProgramStatus,
  RewardPoolStatus,
  DistributionStatus,
  ConversionStatus,
  ClaimStatus,
  AbuseAction,
  VestingType,
  RewardTier,
  EarnRule,
  EligibilityRule,
  PointEntry,
  PointBalance,
  RewardProgram,
  ProgramParticipant,
  RewardPool,
  RewardClaim,
  DistributionBatch,
  ConversionRule,
  CrossVentureRewardRule,
} from './types';
```

---

## Architecture

```
┌──────────────────────────────────────────────────────────────────────────────────┐
│                        REWARDS SUBMODULE ARCHITECTURE                            │
│                                                                                  │
│  ┌────────────────────────────────────────────────────────────────────────────┐  │
│  │                           ENTRY POINTS                                     │  │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────────┐  │  │
│  │  │ API Routes  │  │ Fabric      │  │ Cron Jobs   │  │ NAOS Agent      │  │  │
│  │  │ /api/rewards│  │ Events from │  │ Decay calc  │  │ Tokenomics      │  │  │
│  │  │             │  │ all ventures│  │ Balance sync│  │ controller      │  │  │
│  │  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘  └────────┬────────┘  │  │
│  │         └────────────────┴────────────────┴───────────────────┘            │  │
│  └──────────────────────────────────┬────────────────────────────────────────┘  │
│                                     │                                            │
│  ┌──────────────────────────────────▼────────────────────────────────────────┐  │
│  │                          SERVICE LAYER                                     │  │
│  │  ┌──────────────────────┐  ┌───────────────────┐  ┌────────────────────┐  │  │
│  │  │   RewardsService     │  │ DistributionSvc   │  │ ConversionService  │  │  │
│  │  │ • accruePoints()     │  │ • createBatch()   │  │ • convertPoints()  │  │  │
│  │  │ • getBalance()       │  │ • approveBatch()  │  │ • getActiveRules() │  │  │
│  │  │ • getHistory()       │  │ • executeBatch()  │  │ • getCurrentRate() │  │  │
│  │  │ • createProgram()    │  │ • retryFailed()   │  │ • previewConvert() │  │  │
│  │  │ • joinProgram()      │  │ • scheduleBatch() │  │ • getHistory()     │  │  │
│  │  │ • claimReward()      │  │                   │  │                    │  │  │
│  │  └──────────┬───────────┘  └─────────┬─────────┘  └────────┬───────────┘  │  │
│  │  ┌──────────▼───────────┐  ┌─────────▼─────────┐  ┌────────▼───────────┐  │  │
│  │  │  AntiGamingEngine    │  │ RewardPoolService  │  │ VestingRewardSvc   │  │  │
│  │  │ • check()            │  │ • createPool()     │  │ • createSchedule() │  │  │
│  │  │ • scanForPatterns()  │  │ • allocateVenture()│  │ • getVestedAmount()│  │  │
│  │  │ • getUserRisk()      │  │ • getPoolStatus()  │  │ • getClaimable()   │  │  │
│  │  │ • freezeUser()       │  │ • replenishPool()  │  │ • processVesting() │  │  │
│  │  └──────────────────────┘  └────────────────────┘  └────────────────────┘  │  │
│  └───────────────────────────────────────────────────────────────────────────┘  │
│                                                                                  │
│  ┌───────────────────────────────────────────────────────────────────────────┐  │
│  │                         DATA LAYER                                         │  │
│  │  PostgreSQL (16 tables)              Redis                                 │  │
│  │  ├── pointEntries (append-only)      ├── Point balance cache               │  │
│  │  ├── pointBalances                   ├── Rate limit windows                │  │
│  │  ├── rewardPrograms                  ├── Anti-gaming sliding windows       │  │
│  │  ├── programParticipants             ├── Conversion rate cache             │  │
│  │  ├── rewardPools                     ├── Tier computation cache            │  │
│  │  ├── rewardPoolAllocations           └── Distribution batch locks          │  │
│  │  ├── rewardVestingSchedules                                                │  │
│  │  ├── rewardClaims                                                          │  │
│  │  ├── distributionBatches                                                   │  │
│  │  ├── distributionRecipients                                                │  │
│  │  ├── conversionRules                                                       │  │
│  │  ├── conversionHistory                                                     │  │
│  │  ├── rewardAbuseFlags                                                      │  │
│  │  └── crossVentureRewardRules                                               │  │
│  └───────────────────────────────────────────────────────────────────────────┘  │
│                                                                                  │
│  ┌───────────────────────────────────────────────────────────────────────────┐  │
│  │                     EXTERNAL DEPENDENCIES                                  │  │
│  │  @mcv/web3-core    @mcv/engagement    @mcv/identity    @mcv/fabric         │  │
│  │  (SPL transfers,   (Points from       (KYC for         (Event bus,         │  │
│  │   wallet ops)       achievements)      conversions)     audit trail)        │  │
│  └───────────────────────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────────────────────────┘
```

---

## Interfaces & Types

### Core Service Interfaces

```typescript
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// REWARDS SERVICE
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export interface AccruePointsInput {
  ventureId: string;
  userId: string;
  source: PointSource;
  amount: number;
  sourceId?: string;
  sourceVentureId?: string;
  programId?: string;
  campaignId?: string;
  poolId?: string;
  deviceFingerprint?: string;
  ipAddress?: string;
  userAgent?: string;
  metadata?: Record<string, unknown>;
}

export interface AccruePointsResult {
  entry: PointEntry;
  balance: PointBalance;
  antiGaming: AntiGamingResult;
  held: boolean;
  multiplierApplied: number;
  crossVentureBonuses: PointEntry[];
}

export interface PointHistoryOptions {
  source?: PointSource;
  ventureId?: string;
  programId?: string;
  startDate?: Date;
  endDate?: Date;
  flaggedOnly?: boolean;
  cursor?: string;
  limit?: number;
}

export interface CreateProgramInput {
  ventureId: string;
  name: string;
  slug: string;
  description?: string;
  imageUrl?: string;
  type: ProgramType;
  budget?: string;
  budgetType?: 'tokens' | 'points' | 'usd';
  budgetAlertThreshold?: number;
  emissionRate?: string;
  emissionInterval?: 'daily' | 'weekly' | 'monthly';
  decayFactor?: string;
  eligibilityRules?: EligibilityRule[];
  earnRules?: EarnRule[];
  startsAt?: Date;
  endsAt?: Date;
  maxParticipants?: number;
  isCrossVenture?: boolean;
  participatingVentures?: string[];
  metadata?: Record<string, unknown>;
}

export interface CreateDistributionBatchInput {
  ventureId: string;
  programId?: string;
  poolId?: string;
  name?: string;
  description?: string;
  recipients: Array<{
    userId?: string;
    walletAddress: string;
    amount: string;
  }>;
  tokenMint: string;
  tokenSymbol?: string;
  treasuryAddress?: string;
  requiresApproval?: boolean;
  scheduledFor?: Date;
}

export interface ConvertPointsInput {
  userId: string;
  ventureId: string;
  ruleId: string;
  points: number;
  walletAddress: string;
}

export interface ConversionPreview {
  pointsRequired: number;
  tokensReceived: string;
  currentRate: string;
  regime: string;
  eligible: boolean;
  ineligibilityReasons: string[];
  estimatedFeeLamports: number;
}

export interface ClaimRewardInput {
  userId: string;
  ventureId: string;
  claimType: 'instant' | 'vested' | 'conversion' | 'airdrop';
  vestingScheduleId?: string;
  walletAddress: string;
}

export interface ClaimableInfo {
  totalClaimable: string;
  breakdown: Array<{
    source: 'instant' | 'vested' | 'conversion' | 'airdrop';
    amount: string;
    vestingScheduleId?: string;
    programId?: string;
  }>;
  nextUnlock?: {
    date: Date;
    amount: string;
    vestingScheduleId: string;
  };
}

export interface CreateRewardPoolInput {
  ventureId: string;
  name: string;
  description?: string;
  tokenMint: string;
  tokenSymbol?: string;
  totalBudget: string;
  fundingSource: 'treasury' | 'emission' | 'buyback' | 'partner';
  fundingTxSignature?: string;
  treasuryAddress: string;
  emissionRate?: string;
  emissionCap?: string;
  emissionPeriod?: 'daily' | 'weekly' | 'monthly';
  startsAt?: Date;
  endsAt?: Date;
  metadata?: Record<string, unknown>;
}

export interface CreateVestingScheduleInput {
  ventureId: string;
  programId?: string;
  poolId?: string;
  name: string;
  description?: string;
  vestingType: VestingType;
  totalAmount: string;
  tgeUnlockPercent?: number;
  cliffDurationSec?: number;
  vestingDurationSec: number;
  vestingIntervalSec?: number;
  startDate: Date;
  metadata?: Record<string, unknown>;
}
```

### Distribution Service

```typescript
export interface BatchStatusDetail {
  batch: DistributionBatch;
  recipients: Array<{
    userId?: string;
    walletAddress: string;
    amount: string;
    status: 'pending' | 'sent' | 'confirmed' | 'failed';
    txSignature?: string;
    errorMessage?: string;
  }>;
  progress: {
    total: number;
    processed: number;
    confirmed: number;
    failed: number;
    percentComplete: number;
  };
}
```

### Anti-Gaming Engine Types

```typescript
export interface AntiGamingCheckParams {
  userId: string;
  ventureId: string;
  source: PointSource;
  amount: number;
  sourceId?: string;
  deviceFingerprint?: string;
  ipAddress?: string;
  userAgent?: string;
  metadata?: Record<string, unknown>;
}

export interface AntiGamingResult {
  passed: boolean;
  score: number;          // 0.0 (clean) → 1.0 (abuse)
  flags: string[];
  action: AbuseAction;    // 'allow' | 'flag' | 'hold' | 'block'
  holdAmount?: number;
  details: AntiGamingDetail[];
}

export interface AntiGamingDetail {
  check: string;
  passed: boolean;
  score: number;
  evidence?: Record<string, unknown>;
}

export interface RiskProfile {
  userId: string;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  riskScore: number;
  totalFlags: number;
  openFlags: number;
  heldPoints: number;
  isFrozen: boolean;
  knownDevices: number;
  knownIPs: number;
  relatedUsers: string[];
  lastActivity: Date | null;
}

export interface PatternScanResult {
  scannedAt: Date;
  windowHours: number;
  patternsFound: number;
  patterns: PatternMatch[];
  autoActions: number;
}

export interface PatternMatch {
  type: 'farming_ring' | 'wash_trading' | 'sybil_network' | 'geo_anomaly' | 'referral_ring';
  severity: 'low' | 'medium' | 'high' | 'critical';
  affectedUserIds: string[];
  confidence: number;
  evidence: Record<string, unknown>;
  autoActionTaken: boolean;
  actionDescription?: string;
}
```

### Earn Rules & Eligibility

```typescript
export interface EarnRule {
  source: PointSource;
  pointsPerUnit?: number;
  unit?: string;
  pointsFlat?: number;
  maxPerDay?: number;
  maxPerWeek?: number;
  maxPerMonth?: number;
  minValue?: number;
  cooldownMs?: number;
  isActive?: boolean;
}

export interface EligibilityRule {
  type: 'min_tier' | 'kyc_verified' | 'min_age_days' | 'venture_active' | 'min_balance' | 'max_participants' | 'geo_allowed' | 'geo_blocked';
  value: unknown;
}
```

### Tier System Types

```typescript
export type RewardTier = 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond';

export interface TierInfo {
  tier: RewardTier;
  threshold: number;
  multiplier: number;
  benefits: TierBenefits;
  nextTier?: {
    tier: RewardTier;
    pointsRequired: number;
    pointsRemaining: number;
    progressPercent: number;
  };
}

export interface TierBenefits {
  conversionBonus: number;
  priorityClaim: boolean;
  exclusivePrograms: boolean;
  reducedFees?: boolean;
  earlyAccess?: boolean;
}
```

---

## Database Schema

### Point Entries — Immutable Append-Only Ledger

**This is the most critical table in the rewards system.** No UPDATE or DELETE operations are ever permitted. Corrections are recorded as new entries with negative amounts referencing the original.

```typescript
import { pgTable, text, jsonb, timestamp, numeric, boolean, integer, index, pgEnum } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { createId } from '@paralleldrive/cuid2';

export const pointSourceEnum = pgEnum('reward_point_source', [
  'bet_placed', 'bet_won', 'referral_signup', 'referral_deposit',
  'quest_completed', 'streak_bonus', 'daily_login', 'social_share',
  'content_created', 'governance_vote', 'staking_deposit', 'liquidity_provided',
  'marketplace_trade', 'education_completed', 'feedback_given',
  'community_moderation', 'achievement_unlocked', 'tournament_placement',
  'property_listed', 'deal_closed', 'grant_milestone',
  'early_adopter', 'vip_bonus', 'promotional', 'manual_adjustment',
  'cross_venture_bonus', 'tier_bonus', 'conversion_deduction',
  'expiration', 'reversal',
]);

export const pointEntries = pgTable('reward_point_entries', {
  id: text('id').$defaultFn(() => createId()).primaryKey(),
  ventureId: text('venture_id').notNull(),
  userId: text('user_id').notNull(),

  source: pointSourceEnum('source').notNull(),
  sourceId: text('source_id'),
  sourceVentureId: text('source_venture_id'),

  amount: integer('amount').notNull(),
  multiplier: numeric('multiplier', { precision: 5, scale: 4 }).default('1'),
  finalAmount: integer('final_amount').notNull(),

  programId: text('program_id'),
  campaignId: text('campaign_id'),
  poolId: text('pool_id'),

  sybilScore: numeric('sybil_score', { precision: 5, scale: 4 }),
  deviceFingerprint: text('device_fingerprint'),
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
  flagged: boolean('flagged').default(false),
  flagReason: text('flag_reason'),
  reviewStatus: text('review_status').default('auto_approved'),

  metadata: jsonb('metadata').$type<Record<string, unknown>>(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  // NOTE: No updatedAt — this table is immutable
}, (table) => ({
  userIdx: index('pe_user_idx').on(table.userId),
  ventureUserIdx: index('pe_venture_user_idx').on(table.ventureId, table.userId),
  sourceIdx: index('pe_source_idx').on(table.source),
  createdIdx: index('pe_created_idx').on(table.createdAt),
  flaggedIdx: index('pe_flagged_idx').on(table.flagged).where(sql`flagged = true`),
  programIdx: index('pe_program_idx').on(table.programId),
  poolIdx: index('pe_pool_idx').on(table.poolId),
}));
```

### Point Balances — Materialized Balance Snapshots

```typescript
export const pointBalances = pgTable('reward_point_balances', {
  id: text('id').$defaultFn(() => createId()).primaryKey(),
  ventureId: text('venture_id').notNull(),
  userId: text('user_id').notNull(),

  totalEarned: integer('total_earned').default(0),
  totalRedeemed: integer('total_redeemed').default(0),
  totalConverted: integer('total_converted').default(0),
  totalExpired: integer('total_expired').default(0),
  totalFlagged: integer('total_flagged').default(0),
  currentBalance: integer('current_balance').default(0),

  breakdown: jsonb('breakdown').$type<Record<string, number>>(),

  lifetimePoints: integer('lifetime_points').default(0),
  currentTier: text('current_tier'),
  tierExpiresAt: timestamp('tier_expires_at'),
  tierMultiplier: numeric('tier_multiplier', { precision: 3, scale: 2 }).default('1.00'),

  lastActivity: timestamp('last_activity'),
  updatedAt: timestamp('updated_at').defaultNow().$onUpdate(() => new Date()),
}, (table) => ({
  ventureUserIdx: index('pb_venture_user_idx').on(table.ventureId, table.userId).unique(),
  tierIdx: index('pb_tier_idx').on(table.currentTier),
}));
```

### Reward Programs

```typescript
export const rewardPrograms = pgTable('reward_programs', {
  id: text('id').$defaultFn(() => createId()).primaryKey(),
  ventureId: text('venture_id').notNull(),
  name: text('name').notNull(),
  slug: text('slug').notNull(),
  description: text('description'),
  imageUrl: text('image_url'),
  type: programTypeEnum('type').notNull(),
  status: programStatusEnum('status').default('draft'),
  budget: numeric('budget', { precision: 24, scale: 8 }),
  budgetType: text('budget_type').default('tokens'),
  spent: numeric('spent', { precision: 24, scale: 8 }).default('0'),
  budgetAlertThreshold: numeric('budget_alert_threshold', { precision: 5, scale: 4 }).default('0.80'),
  emissionRate: numeric('emission_rate', { precision: 18, scale: 8 }),
  emissionInterval: text('emission_interval'),
  decayFactor: numeric('decay_factor', { precision: 5, scale: 4 }),
  eligibilityRules: jsonb('eligibility_rules').$type<EligibilityRule[]>(),
  earnRules: jsonb('earn_rules').$type<EarnRule[]>(),
  startsAt: timestamp('starts_at'),
  endsAt: timestamp('ends_at'),
  participantCount: integer('participant_count').default(0),
  maxParticipants: integer('max_participants'),
  isCrossVenture: boolean('is_cross_venture').default(false),
  participatingVentures: jsonb('participating_ventures').$type<string[]>(),
  metadata: jsonb('metadata').$type<Record<string, unknown>>(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().$onUpdate(() => new Date()),
}, (table) => ({
  ventureIdx: index('rp_venture_idx').on(table.ventureId),
  statusIdx: index('rp_status_idx').on(table.status),
  slugIdx: index('rp_slug_idx').on(table.ventureId, table.slug).unique(),
  typeIdx: index('rp_type_idx').on(table.type),
}));
```

### Reward Pools, Vesting, Claims, Distributions, Conversions, Abuse Flags, Cross-Venture Rules

```typescript
// See parent MODULE.md for full schema definitions of:
// - rewardPools
// - rewardPoolAllocations
// - rewardVestingSchedules
// - rewardClaims
// - distributionBatches
// - distributionRecipients
// - conversionRules
// - conversionHistory
// - rewardAbuseFlags
// - crossVentureRewardRules
//
// All schemas are re-exported from this submodule and defined in ./schema.ts
```

### Database Immutability Trigger

```sql
-- PostgreSQL trigger to enforce append-only on point_entries
CREATE OR REPLACE FUNCTION prevent_point_entry_modification()
RETURNS TRIGGER AS $$
BEGIN
  RAISE EXCEPTION 'reward_point_entries is append-only. Modifications are not allowed.';
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER point_entries_immutable
BEFORE UPDATE OR DELETE ON reward_point_entries
FOR EACH ROW EXECUTE FUNCTION prevent_point_entry_modification();
```

---

## Code Examples

### Example 1: Accruing Points from a BetEdge Bet

```typescript
import { rewardsService } from '@mcv/token-economy/rewards';

async function handleBetPlaced(betEvent: {
  userId: string;
  betId: string;
  amount: number;
  ventureId: string;
  deviceFingerprint?: string;
  ipAddress?: string;
  userAgent?: string;
}) {
  const result = await rewardsService.accruePoints({
    ventureId: betEvent.ventureId,
    userId: betEvent.userId,
    source: 'bet_placed',
    amount: Math.floor(betEvent.amount),  // 1 point per $1 wagered
    sourceId: betEvent.betId,
    sourceVentureId: 'betedge',
    deviceFingerprint: betEvent.deviceFingerprint,
    ipAddress: betEvent.ipAddress,
    userAgent: betEvent.userAgent,
    metadata: { betAmount: betEvent.amount, currency: 'USD' },
  });

  if (result.antiGaming.action === 'block') {
    console.warn(`Points blocked for user ${betEvent.userId}: ${result.antiGaming.flags}`);
    return;
  }

  if (result.held) {
    console.info(`Points held for review: ${result.entry.finalAmount} pts`);
  } else {
    console.info(`Accrued ${result.entry.finalAmount} pts (${result.multiplierApplied}x tier)`);
  }

  if (result.crossVentureBonuses.length > 0) {
    console.info(`Cross-venture bonuses: ${result.crossVentureBonuses.length} entries`);
  }

  return result;
}
```

### Example 2: Creating a Referral Reward Program

```typescript
import { rewardsService } from '@mcv/token-economy/rewards';

async function createReferralProgram() {
  const program = await rewardsService.createProgram({
    ventureId: 'betedge',
    name: 'BetEdge Referral Sprint Q1 2026',
    slug: 'referral-sprint-q1-2026',
    description: 'Earn bonus points for every friend you bring to BetEdge',
    type: 'referral',
    budget: '500000',
    budgetType: 'tokens',
    budgetAlertThreshold: 0.80,
    earnRules: [
      { source: 'referral_signup', pointsFlat: 100, maxPerDay: 10, maxPerMonth: 50 },
      { source: 'referral_deposit', pointsFlat: 200, maxPerDay: 10, maxPerMonth: 50, minValue: 10 },
    ],
    eligibilityRules: [
      { type: 'kyc_verified', value: true },
      { type: 'min_age_days', value: 7 },
      { type: 'min_tier', value: 'bronze' },
    ],
    startsAt: new Date('2026-01-01T00:00:00Z'),
    endsAt: new Date('2026-03-31T23:59:59Z'),
    maxParticipants: 10000,
  });

  await rewardsService.activateProgram(program.id);
  return program;
}
```

### Example 3: Converting Points to EDGE Tokens

```typescript
import { conversionService } from '@mcv/token-economy/rewards';

async function convertUserPoints(userId: string, ventureId: string) {
  // 1. Get available conversion rules
  const rules = await conversionService.getActiveRules(ventureId);
  const rule = rules[0];

  // 2. Preview the conversion
  const preview = await conversionService.previewConversion(rule.id, 1000);
  console.log(`Converting 1000 pts → ${preview.tokensReceived} EDGE (regime: ${preview.regime})`);

  if (!preview.eligible) {
    console.error('Not eligible:', preview.ineligibilityReasons);
    return;
  }

  // 3. Execute conversion
  try {
    const result = await conversionService.convertPoints({
      userId,
      ventureId,
      ruleId: rule.id,
      points: 1000,
      walletAddress: 'Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnS',
    });
    console.log(`Converted: ${result.pointsConverted} pts → ${result.tokensReceived} EDGE`);
    console.log(`TX: ${result.txSignature}`);
  } catch (error) {
    if (error.code === 'REWARD_INSUFFICIENT_BALANCE') console.error('Not enough points');
    else if (error.code === 'REWARD_KYC_REQUIRED') console.error('KYC verification required');
    else if (error.code === 'REWARD_CONVERSION_LIMIT') console.error('Daily limit reached');
    throw error;
  }
}
```

### Example 4: Creating and Executing a Distribution Batch

```typescript
import { distributionService } from '@mcv/token-economy/rewards';

async function distributeWeeklyRewards(ventureId: string) {
  const batch = await distributionService.createBatch({
    ventureId,
    name: 'Weekly Rewards — Week 6 2026',
    poolId: 'pool_main_betedge',
    recipients: [
      { userId: 'user_001', walletAddress: 'Fg6Pa...', amount: '150.50' },
      { userId: 'user_002', walletAddress: 'Hk9Qr...', amount: '275.00' },
      { userId: 'user_003', walletAddress: 'Jm2Ws...', amount: '89.25' },
    ],
    tokenMint: 'EDGE_MINT_ADDRESS',
    requiresApproval: true,
  });

  // Approve and execute
  await distributionService.approveBatch(batch.id, 'admin_alice');
  await distributionService.executeBatch(batch.id);

  // Poll for completion
  let status = await distributionService.getBatchStatus(batch.id);
  while (status.progress.percentComplete < 100) {
    await new Promise(r => setTimeout(r, 5000));
    status = await distributionService.getBatchStatus(batch.id);
  }

  // Retry failures
  if (status.progress.failed > 0) {
    await distributionService.retryFailed(batch.id);
  }
}
```

### Example 5: Anti-Gaming Pattern Scan

```typescript
import { antiGamingService } from '@mcv/token-economy/rewards';

async function runAntiGamingScan(ventureId: string) {
  const result = await antiGamingService.scanForPatterns(ventureId, { hours: 24 });
  console.log(`Patterns found: ${result.patternsFound}, Auto-actions: ${result.autoActions}`);

  for (const pattern of result.patterns) {
    console.log(`[${pattern.severity}] ${pattern.type} — ${pattern.affectedUserIds.length} users`);
    if (pattern.severity === 'critical') {
      for (const userId of pattern.affectedUserIds) {
        await antiGamingService.freezeUser(userId, `Critical: ${pattern.type}`);
      }
    }
  }
}
```

### Example 6: Claiming Vested Rewards

```typescript
import { rewardsService, vestingRewardService } from '@mcv/token-economy/rewards';

async function claimVestedRewards(userId: string, ventureId: string) {
  const claimable = await vestingRewardService.getClaimableAmount(userId);
  if (Number(claimable.totalClaimable) === 0) return;

  const claim = await rewardsService.claimReward({
    userId,
    ventureId,
    claimType: 'vested',
    vestingScheduleId: claimable.breakdown[0].vestingScheduleId,
    walletAddress: 'Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnS',
  });

  console.log(`Claim ${claim.id}: ${claim.tokenAmount} EDGE (${claim.status})`);
}
```

### Example 7: Setting Up Cross-Venture Rewards

```typescript
import { rewardsService } from '@mcv/token-economy/rewards';

async function setupCrossVentureRewards() {
  await rewardsService.createCrossVentureRule({
    name: 'BetEdge → SerpSpace Cross-Play Bonus',
    description: 'Earn SerpSpace points when betting on BetEdge',
    sourceVentureId: 'betedge',
    sourceAction: 'bet_placed',
    targetVentureId: 'serpspace',
    multiplier: 0.1,        // 10% of BetEdge points as SerpSpace bonus
    bonusPoints: 5,
    conditions: {
      minAmount: 10,
      maxPerDay: 100,
      requireBothVentureActive: true,
      minTier: 'silver',
    },
  });
}
```

---

## Venture Earn Rules Reference

| Venture | Action | Points | Limits |
|---------|--------|--------|--------|
| **BetEdge** | bet_placed | 1 pt/$1 wagered | max 500/day |
| | bet_won | 2 pts/$1 won | — |
| | streak_bonus | 50 pts/7-day streak | — |
| | referral_signup | 100 pts/referral | max 10/day |
| | referral_deposit | 200 pts/first deposit | max 10/day |
| **SerpSpace** | content_created | 25 pts/article | max 20/day |
| | marketplace_trade | 10 pts/order | max 50/day |
| | feedback_given | 15 pts/review | max 10/day |
| | education_completed | 50 pts/course | — |
| **Full Gain** | grant_milestone | 500 pts/milestone | — |
| | education_completed | 50 pts/course | — |
| | community_moderation | 25 pts/action | — |
| **MCV Studios** | achievement_unlocked | 10-100 pts | varies |
| | daily_login | 5 pts/day | 1/day |
| | quest_completed | 25 pts/quest | max 50/day |
| | tournament_placement | 100-1000 pts | varies |
| **Futurestate** | property_listed | 50 pts/listing | — |
| | deal_closed | 500 pts/transaction | — |
| | referral_signup | 100 pts/referral | max 10/day |
| **Cross-Venture** | governance_vote | 10 pts/vote | max 10/day |
| | staking_deposit | 1 pt/$1/day | max 5/hr |
| | liquidity_provided | 2 pts/$1/day | max 5/hr |
| | social_share | 5 pts/share | max 5/hr |
| | early_adopter | 1000 pts (one-time) | once |

---

## Tier System

```typescript
export const TIER_THRESHOLDS = {
  bronze:   0,
  silver:   10_000,
  gold:     50_000,
  platinum: 200_000,
  diamond:  1_000_000,
} as const;

export const TIER_MULTIPLIERS = {
  bronze:   1.00,
  silver:   1.10,   // +10%
  gold:     1.25,   // +25%
  platinum: 1.50,   // +50%
  diamond:  2.00,   // +100%
} as const;

export const TIER_BENEFITS = {
  bronze:   { conversionBonus: 0,    priorityClaim: false, exclusivePrograms: false },
  silver:   { conversionBonus: 0.05, priorityClaim: false, exclusivePrograms: false },
  gold:     { conversionBonus: 0.10, priorityClaim: true,  exclusivePrograms: false },
  platinum: { conversionBonus: 0.15, priorityClaim: true,  exclusivePrograms: true  },
  diamond:  { conversionBonus: 0.25, priorityClaim: true,  exclusivePrograms: true  },
} as const;
```

**Tier Rules:**
- Tier computed from `lifetimePoints` (all-time earned, never decreases)
- Upgrades are **immediate** when threshold is crossed
- Downgrades only happen when `tierExpiresAt` passes (90-day rolling window)
- Tier multiplier applied to all subsequent point accruals
- Conversion bonuses applied on top of ACS-governed conversion rate

---

## Anti-Gaming Engine — Deep Dive

### Check Pipeline

| # | Check | Weight | Description |
|---|-------|--------|-------------|
| 1 | Rate Limit | 0.30 | Per-source rate limits (configurable per venture) |
| 2 | Velocity Anomaly | 0.25 | Compare current rate to user's 30-day baseline |
| 3 | Device Fingerprint | 0.25 | Detect multiple accounts sharing the same device |
| 4 | IP Reputation | 0.15 | VPN/proxy/datacenter/tor/bad actor lists |
| 5 | Referral Chain | 0.40 | Self-referral rings, circular chains, mass farms |
| 6 | Bot Detection | 0.35 | User agent analysis, timing patterns, mouse entropy |
| 7 | Sybil Detection | 0.35 | Cross-account correlation (IP + timing patterns) |
| 8 | Anomalous Value | 0.20 | Unusually large amounts for the source type |

### Scoring Thresholds

| Score Range | Action | Description |
|------------|--------|-------------|
| 0.00–0.29 | `allow` | Clean — points accrued normally |
| 0.30–0.49 | `flag` | Suspicious — points accrued but flagged for review |
| 0.50–0.79 | `hold` | Likely abuse — points accrued but held (excluded from balance) |
| 0.80–1.00 | `block` | Definite abuse — points NOT accrued, entry rejected |

### Batch Pattern Scanner

Runs every 6 hours, detects patterns invisible to real-time checks:

1. **Farming Rings** — Groups of users who always act in sync
2. **Wash Trading** — Marketplace trades between related accounts
3. **Referral Sybil Networks** — Chains of fake referrals between Sybil accounts
4. **Geographic Anomalies** — Impossible travel patterns
5. **Referral Rings** — Circular referral chains (A→B→C→A)

---

## Reward Pool Lifecycle

```
Treasury ──fund──→ Pool (total_budget)
                    │
                    ├── allocate 40% → BetEdge rewards
                    ├── allocate 25% → SerpSpace rewards
                    ├── allocate 15% → Full Gain rewards
                    ├── allocate 10% → MCV Studios rewards
                    └── allocate 10% → Cross-venture

Emission Rate (ACS-governed):
├── Launch:      100,000 EDGE/day
├── Growth:       75,000 EDGE/day
├── Mature:       50,000 EDGE/day
├── Contraction:  25,000 EDGE/day
└── Emergency:    10,000 EDGE/day

Pool Status: active → warning (< 10%) → depleted (= 0)
```

---

## Claim Workflow State Machine

```
PENDING → SIG_VERIFIED → ID_VERIFIED → PROCESSING → CONFIRMED
                                     → NEEDS_APPROVAL → PROCESSING → CONFIRMED
                                                                   → FAILED → PROCESSING (retry ≤ 3x)
```

- Claims under threshold: auto-processed
- Claims over threshold: require admin approval
- Failed claims: auto-retry up to 3 times
- Approver cannot be the batch creator (two-person rule)

---

## Error Codes

| Code | HTTP | Description |
|------|------|-------------|
| `REWARD_INSUFFICIENT_BALANCE` | 400 | Not enough points to convert or redeem |
| `REWARD_RATE_LIMITED` | 429 | Too many accrual requests for this source |
| `REWARD_BLOCKED_ABUSE` | 403 | Anti-gaming engine blocked the accrual |
| `REWARD_HELD_FOR_REVIEW` | 202 | Points accrued but held for abuse review |
| `REWARD_PROGRAM_NOT_FOUND` | 404 | Program ID does not exist |
| `REWARD_PROGRAM_INACTIVE` | 409 | Program is not in active status |
| `REWARD_PROGRAM_FULL` | 409 | Program has reached max participants |
| `REWARD_NOT_ELIGIBLE` | 403 | User does not meet program eligibility rules |
| `REWARD_POOL_DEPLETED` | 409 | Reward pool has no remaining budget |
| `REWARD_POOL_NOT_FOUND` | 404 | Pool ID does not exist |
| `REWARD_CLAIM_FAILED` | 500 | On-chain claim transaction failed |
| `REWARD_CLAIM_NOTHING` | 400 | No claimable amount available |
| `REWARD_CLAIM_PROCESSING` | 409 | A claim is already being processed |
| `REWARD_CONVERSION_LIMIT` | 429 | Daily conversion limit reached |
| `REWARD_CONVERSION_BUDGET_EXHAUSTED` | 409 | Conversion rule budget depleted |
| `REWARD_KYC_REQUIRED` | 403 | KYC verification needed |
| `REWARD_WALLET_REQUIRED` | 400 | Must connect a Solana wallet |
| `REWARD_WALLET_MISMATCH` | 403 | Wallet does not match claim address |
| `REWARD_BATCH_NOT_FOUND` | 404 | Distribution batch not found |
| `REWARD_BATCH_NOT_APPROVED` | 409 | Batch requires approval |
| `REWARD_BATCH_ALREADY_EXECUTED` | 409 | Batch already executed |
| `REWARD_BATCH_SIZE_EXCEEDED` | 400 | Exceeds max 500 recipients |
| `REWARD_CROSS_VENTURE_CIRCULAR` | 400 | Cross-venture circular dependency |
| `REWARD_USER_FROZEN` | 403 | User frozen due to abuse |
| `REWARD_INVALID_AMOUNT` | 400 | Invalid amount (zero, negative, or exceeds max) |
| `REWARD_DUPLICATE_ENTRY` | 409 | Duplicate accrual for same sourceId |

---

## Security Considerations

### Immutability Enforcement

Point ledger immutability enforced at three levels:
1. **Application** — Service never issues UPDATE/DELETE on `pointEntries`
2. **Database** — PostgreSQL trigger rejects UPDATE/DELETE attempts
3. **Audit** — All entries replicated to audit log via `@mcv/fabric`

### Distribution Approval

- Batches > $10,000 USD require explicit admin approval
- Two-person rule: approver ≠ creator
- All approvals/rejections logged with reason

### Rate Limiting

| Operation | Rate Limit |
|-----------|-----------|
| Point accrual (per user, per source) | Configurable per source |
| Conversion requests | 5/hour per user |
| Claim requests | 3/hour per user |
| Batch creation | 10/hour per admin |

---

## Performance Characteristics

| Operation | Target Latency | Strategy |
|-----------|---------------|----------|
| Point accrual | < 10ms | Sync write, async balance update |
| Balance query | < 5ms | Redis-cached |
| Conversion preview | < 20ms | Redis-cached ACS rate |
| Distribution batch (500) | < 30s | 10 concurrent Solana TXs |
| Anti-gaming check | < 15ms | Redis sliding windows |
| Pattern scan (24h) | < 60s | PostgreSQL aggregation |

---

## Dependencies

### Internal

| Package | Purpose |
|---------|---------|
| `@mcv/web3-core` | SPL transfers, wallet verification, Solana RPC |
| `@mcv/engagement` | Achievement/quest events triggering rewards |
| `@mcv/identity` | KYC status, wallet ownership verification |
| `@mcv/fabric` | Event bus, audit trail |
| `@mcv/db` | PostgreSQL connection, Drizzle ORM |

### External

| Package | Version | Purpose |
|---------|---------|---------|
| `@solana/web3.js` | ^1.95.x | Solana transactions |
| `ioredis` | ^5.x | Caching, rate limiting, queues |
| `zod` | ^3.x | Input validation |
| `drizzle-orm` | ^0.36.x | Database ORM |

---

## Audit Events

| Event | Severity | Data |
|-------|----------|------|
| `rewards.points.accrued` | info | userId, source, amount, finalAmount, balance |
| `rewards.points.blocked` | warning | userId, source, amount, reason, abuseScore |
| `rewards.points.held` | warning | userId, source, amount, flags |
| `rewards.points.reversed` | info | userId, originalEntryId, reversalAmount |
| `rewards.program.created` | info | programId, name, type, budget |
| `rewards.program.activated` | info | programId |
| `rewards.program.paused` | warning | programId, reason |
| `rewards.pool.created` | info | poolId, budget, fundingSource |
| `rewards.pool.depleted` | warning | poolId, totalDistributed |
| `rewards.claim.initiated` | info | userId, claimType, amount, walletAddress |
| `rewards.claim.confirmed` | info | claimId, txSignature, amount |
| `rewards.claim.failed` | error | claimId, error, retryCount |
| `rewards.distribution.created` | info | batchId, recipientCount, totalAmount |
| `rewards.distribution.approved` | info | batchId, approvedBy |
| `rewards.distribution.completed` | info | batchId, confirmedCount, totalAmount |
| `rewards.conversion.completed` | info | userId, points, tokens, rate, regime |
| `rewards.abuse.flagged` | warning | userId, flagType, severity, score |
| `rewards.abuse.resolved` | info | flagId, resolution, action |
| `rewards.abuse.user_frozen` | warning | userId, reason |
| `rewards.abuse.pattern_detected` | warning | patternType, affectedUsers, severity |
| `rewards.tier.upgraded` | info | userId, fromTier, toTier |
| `rewards.cross_venture.bonus` | info | userId, sourceVenture, targetVenture, bonusPoints |

---

*@mcv/token-economy/rewards — The Earning Engine of the EDGE Token Economy*
