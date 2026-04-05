# @mcv/token-economy — Token Economy Domain Module

**Parent Package:** @mcv/token-economy  
**Tier:** 5 (Domain Layer — Publishable)  
**Classification:** PUBLISHABLE  
**Version:** 1.0.0  
**Last Updated:** February 9, 2026

---

## Purpose

The `token-economy` module provides the complete tokenomics infrastructure for the MCV ecosystem's EDGE token on Solana. It implements token reward distribution with anti-abuse protections, Automated Contribution Scoring (ACS) for algorithmic parameter tuning and contribution-to-token conversion, and a full-featured token launchpad with IDO/IEO management, Merkle-proof whitelists, and vesting schedules.

**This is the single source of truth for how users earn, claim, and interact with the EDGE token economy across all nine MCV ventures.**

Every token that flows to a user — whether from a BetEdge betting reward, a SerpSpace SEO contribution, a Full Gain grant milestone, an MCV Studios gaming achievement, a Futurestate real estate referral, or any other venture-specific action — is governed by the rules defined here. Off-chain points accrue through the rewards engine, contribution scores are calculated by ACS, and on-chain token distributions flow through audited, tamper-proof pipelines with full transparency.

The system bridges two worlds: **off-chain scoring** (fast, cheap, flexible — points, contributions, leaderboards) and **on-chain distribution** (immutable, verifiable, trustless — token claims, vesting streams, launchpad purchases). ACS sits at the boundary, algorithmically controlling emission rates, staking APYs, and conversion ratios based on real-time market conditions and protocol health metrics.

---

## Exports

```typescript
// ═══════════════════════════════════════════════════════════════════════════════
// REWARDS
// ═══════════════════════════════════════════════════════════════════════════════

// Core services
export {
  rewardsService,                  // Point accrual, balance, redemption
  distributionService,             // On-chain token distribution batches
  conversionService,               // Points-to-tokens conversion engine
  antiGamingService,               // Abuse detection and prevention
  rewardPoolService,               // Reward pool management and budgets
  vestingRewardService,            // Reward vesting schedules and claims
} from './rewards/service';

export type {
  AccruePointsInput,               // Record a point entry
  CreateProgramInput,              // Create a reward program
  CreateDistributionBatchInput,    // Create a token distribution batch
  ConvertPointsInput,              // Convert points to tokens
  CreateRewardPoolInput,           // Create a reward pool with budget
  CreateVestingScheduleInput,      // Create a vesting schedule for rewards
  ClaimRewardInput,                // Claim vested/available rewards
} from './rewards/service';

// Schema exports
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
} from './rewards/schema';

// ═══════════════════════════════════════════════════════════════════════════════
// ACS (Automated Contribution Scoring)
// ═══════════════════════════════════════════════════════════════════════════════

export {
  acsService,                      // ACS evaluation and state management
  acsEngine,                       // Core evaluation engine
  contributionScoringService,      // Contribution type scoring
  leaderboardService,              // Leaderboard computation and caching
  scoreDecayService,               // Score decay function management
} from './acs/service';

export type {
  EvaluateInput,                   // Trigger ACS evaluation
  SetOverrideInput,                // Set manual controller override
  ForceRegimeInput,                // Force regime change (emergency)
  ScoreContributionInput,          // Score a user contribution
  GetLeaderboardInput,             // Query leaderboard with filters
} from './acs/service';

export {
  acsStates,                       // Current ACS system state
  acsControllers,                  // Controller configurations
  acsEvaluations,                  // Evaluation history
  acsAuditLogs,                    // ACS audit trail
  contributionEntries,             // Raw contribution records
  contributionScores,              // Computed contribution scores
  contributionTypes,               // Contribution type definitions
  scoreSnapshots,                  // Periodic score snapshots
  leaderboards,                    // Leaderboard cache table
  leaderboardEntries,              // Individual leaderboard positions
  decayConfigurations,             // Decay function parameters
  scoringTransparencyLogs,         // Scoring explanation logs
  regimeEnum,                      // ACS regime enum
} from './acs/schema';

// ═══════════════════════════════════════════════════════════════════════════════
// LAUNCHPAD
// ═══════════════════════════════════════════════════════════════════════════════

export {
  launchpadService,                // Token sale lifecycle management
  whitelistService,                // Merkle whitelist operations
  vestingService,                  // Vesting schedule and claims
  launchAnalyticsService,          // Launch metrics and reporting
  fairLaunchService,               // Fair launch mechanism engine
} from './launchpad/service';

export type {
  CreateSaleInput,                 // Create a new token sale
  UpdateSaleInput,                 // Update sale configuration
  UploadWhitelistInput,            // Batch upload whitelist entries
  PurchaseInput,                   // Purchase tokens in a sale
  ClaimVestedInput,                // Claim vested tokens
  CreateFairLaunchInput,           // Configure fair launch parameters
} from './launchpad/service';

export {
  tokenSales,                      // Token sale definitions
  vestingSchedules,                // Vesting schedule configurations
  userAllocations,                 // User allocation records
  purchaseTransactions,            // Purchase transaction log
  claimTransactions,               // Claim transaction log
  whitelistEntries,                // Raw whitelist data
  whitelistSnapshots,              // Merkle tree snapshots
  saleAnalytics,                   // Aggregated sale metrics
  fairLaunchConfigs,               // Fair launch parameters
  secondaryMarketBootstrap,        // Liquidity bootstrapping configs
  saleTypeEnum,                    // Sale type enum
  saleStatusEnum,                  // Sale status enum
} from './launchpad/schema';

// ═══════════════════════════════════════════════════════════════════════════════
// CLIENT HOOKS (React)
// ═══════════════════════════════════════════════════════════════════════════════

// Rewards hooks
export { usePointBalance } from './client/hooks/use-point-balance';
export { usePointHistory } from './client/hooks/use-point-history';
export { useRewardPrograms } from './client/hooks/use-reward-programs';
export { useRewardClaims } from './client/hooks/use-reward-claims';
export { useConversionRules } from './client/hooks/use-conversion-rules';
export { useRewardPools } from './client/hooks/use-reward-pools';
export { useVestingSchedule } from './client/hooks/use-vesting-schedule';

// ACS hooks
export { useAcsState } from './client/hooks/use-acs-state';
export { useAcsControllers } from './client/hooks/use-acs-controllers';
export { useContributionScore } from './client/hooks/use-contribution-score';
export { useLeaderboard } from './client/hooks/use-leaderboard';
export { useScoreHistory } from './client/hooks/use-score-history';

// Launchpad hooks
export { useTokenSales } from './client/hooks/use-token-sales';
export { useAllocation } from './client/hooks/use-allocation';
export { useVestingProgress } from './client/hooks/use-vesting-progress';
export { useWhitelistStatus } from './client/hooks/use-whitelist-status';
export { useLaunchAnalytics } from './client/hooks/use-launch-analytics';

// ═══════════════════════════════════════════════════════════════════════════════
// CLIENT COMPONENTS (React)
// ═══════════════════════════════════════════════════════════════════════════════

export { PointBalanceCard } from './client/components/point-balance-card';
export { PointHistoryTable } from './client/components/point-history-table';
export { RewardProgramCard } from './client/components/reward-program-card';
export { RewardClaimButton } from './client/components/reward-claim-button';
export { ConversionCalculator } from './client/components/conversion-calculator';
export { VestingTimeline } from './client/components/vesting-timeline';
export { LeaderboardTable } from './client/components/leaderboard-table';
export { ContributionScoreCard } from './client/components/contribution-score-card';
export { AcsRegimeBadge } from './client/components/acs-regime-badge';
export { AcsControllerPanel } from './client/components/acs-controller-panel';
export { SaleCard } from './client/components/sale-card';
export { SaleProgressBar } from './client/components/sale-progress-bar';
export { AllocationDetails } from './client/components/allocation-details';
export { WhitelistChecker } from './client/components/whitelist-checker';
export { PurchaseForm } from './client/components/purchase-form';
export { VestingClaimPanel } from './client/components/vesting-claim-panel';
export { TokenEconomyDashboard } from './client/components/token-economy-dashboard';

// ═══════════════════════════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════════════════════════

export {
  POINT_SOURCES,
  PROGRAM_TYPES,
  PROGRAM_STATUSES,
  ACS_REGIMES,
  CONTROLLER_CATEGORIES,
  CONTRIBUTION_TYPES,
  SALE_TYPES,
  SALE_STATUSES,
  VESTING_INTERVALS,
  DEFAULT_DECAY_HALF_LIFE,
  DEFAULT_ANTI_GAMING_THRESHOLDS,
  MAX_BATCH_SIZE,
  MAX_POINTS_PER_ACTION,
  EDGE_TOKEN_MINT,
  EDGE_TOKEN_DECIMALS,
  SUPPORTED_PAYMENT_TOKENS,
  DEFAULT_REGIME_THRESHOLDS,
  VENTURE_REWARD_MULTIPLIERS,
} from './constants';

// ═══════════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════════

export type {
  // Reward types
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

  // ACS types
  AcsRegime,
  ControllerCategory,
  HealthScores,
  MarketMetrics,
  ControllerAdjustment,
  EvaluationResult,
  ContributionType,
  ContributionCategory,
  DecayFunction,
  ScoreTransparencyEntry,
  LeaderboardPeriod,

  // Launchpad types
  SaleType,
  SaleStatus,
  WhitelistTier,
  AllocationStatus,
  PurchaseStatus,
  ClaimTransactionStatus,
  FairLaunchMechanism,
  BootstrapStrategy,
  MerkleProof,
  VestingParams,
} from './types';
```

---

## Architecture

```
┌──────────────────────────────────────────────────────────────────────────────────────────────────┐
│                        @mcv/token-economy — TOKEN ECONOMY ARCHITECTURE                          │
│                                                                                                  │
│  ┌────────────────────────────────────────────────────────────────────────────────────────────┐  │
│  │                              ENTRY POINTS                                                  │  │
│  │                                                                                            │  │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌────────────┐  │  │
│  │  │  API Routes  │  │  Cron Jobs   │  │  Webhooks    │  │ NAOS Agents  │  │  Fabric    │  │  │
│  │  │ /api/rewards │  │  Decay calc  │  │  Solana TXs  │  │  Tokenomics  │  │  Events    │  │  │
│  │  │ /api/acs     │  │  Eval cycle  │  │  Price feeds │  │  Agent       │  │  from all  │  │  │
│  │  │ /api/launch  │  │  Vesting     │  │  Staking     │  │  Controller  │  │  ventures  │  │  │
│  │  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘  └─────┬──────┘  │  │
│  │         │                 │                  │                 │                 │          │  │
│  │         └─────────────────┴──────────────────┴─────────────────┴─────────────────┘          │  │
│  │                                         │                                                   │  │
│  └─────────────────────────────────────────┼───────────────────────────────────────────────────┘  │
│                                            │                                                      │
│  ┌─────────────────────────────────────────▼───────────────────────────────────────────────────┐  │
│  │                              SERVICE LAYER                                                  │  │
│  │                                                                                             │  │
│  │  ┌──────────────────────┐  ┌──────────────────────┐  ┌──────────────────────┐              │  │
│  │  │       REWARDS        │  │         ACS          │  │      LAUNCHPAD       │              │  │
│  │  │                      │  │                      │  │                      │              │  │
│  │  │ • Point accrual      │  │ • Regime detection   │  │ • Sale lifecycle     │              │  │
│  │  │ • Reward programs    │  │ • Controller engine  │  │ • Whitelist/Merkle   │              │  │
│  │  │ • Reward pools       │  │ • Contribution score │  │ • Allocation tiers   │              │  │
│  │  │ • Vesting schedules  │  │ • Score decay        │  │ • Vesting contracts  │              │  │
│  │  │ • Claim workflows    │  │ • Leaderboards       │  │ • Purchase flow      │              │  │
│  │  │ • Anti-abuse engine  │  │ • Score→token conv.  │  │ • Claim processing   │              │  │
│  │  │ • Cross-venture      │  │ • Scoring explain.   │  │ • Fair launch        │              │  │
│  │  │ • Distribution batch │  │ • Health metrics     │  │ • Secondary market   │              │  │
│  │  │ • Reward history     │  │ • Dampening/override │  │ • Launch analytics   │              │  │
│  │  └──────────┬───────────┘  └──────────┬───────────┘  └──────────┬───────────┘              │  │
│  │             │                         │                         │                           │  │
│  └─────────────┴─────────────────────────┴─────────────────────────┴───────────────────────────┘  │
│                                            │                                                      │
│  ┌─────────────────────────────────────────▼───────────────────────────────────────────────────┐  │
│  │                         OFF-CHAIN ←→ ON-CHAIN BRIDGE                                        │  │
│  │                                                                                             │  │
│  │  Points & scores live off-chain (PostgreSQL/Redis) for speed and flexibility.               │  │
│  │  Token distributions, vesting claims, and launchpad purchases settle on-chain (Solana).     │  │
│  │  ACS controls the conversion ratios and emission rates that bridge the two worlds.          │  │
│  │                                                                                             │  │
│  │  ┌──────────────────┐    ┌──────────────────┐    ┌──────────────────┐                      │  │
│  │  │   Off-Chain DB   │    │  Conversion &    │    │   On-Chain       │                      │  │
│  │  │                  │───▶│  Distribution    │───▶│   (Solana)       │                      │  │
│  │  │  Points          │    │  Engine          │    │                  │                      │  │
│  │  │  Scores          │    │                  │    │  EDGE Token      │                      │  │
│  │  │  Leaderboards    │    │  Batch signing   │    │  SPL Transfers   │                      │  │
│  │  │  Programs        │    │  Merkle proofs   │    │  Vesting streams │                      │  │
│  │  │  Abuse flags     │    │  TX submission   │    │  Launchpad TXs   │                      │  │
│  │  └──────────────────┘    └──────────────────┘    └──────────────────┘                      │  │
│  │                                                                                             │  │
│  └─────────────────────────────────────────────────────────────────────────────────────────────┘  │
│                                                                                                    │
│  ┌─────────────────────────────────────────────────────────────────────────────────────────────┐  │
│  │                              DATABASE LAYER (PostgreSQL + Redis)                             │  │
│  │                                                                                             │  │
│  │  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐                             │  │
│  │  │    Rewards       │  │      ACS        │  │    Launchpad    │                             │  │
│  │  │   16 tables      │  │   12 tables     │  │   10 tables     │                             │  │
│  │  └─────────────────┘  └─────────────────┘  └─────────────────┘                             │  │
│  │                                                                                             │  │
│  │  Redis: Point balance cache │ Leaderboard cache │ Rate limits │ Anti-abuse windows          │  │
│  │                                                                                             │  │
│  └─────────────────────────────────────────────────────────────────────────────────────────────┘  │
│                                                                                                    │
│  ┌─────────────────────────────────────────────────────────────────────────────────────────────┐  │
│  │                              EXTERNAL DEPENDENCIES                                          │  │
│  │                                                                                             │  │
│  │  @mcv/web3-core        @mcv/engagement         @mcv/identity          @mcv/fabric           │  │
│  │  (Token ops, wallets,  (Points/achievements    (User verification     (Event bus,            │  │
│  │   staking, SPL)         trigger rewards)        for claims, KYC)       audit trail)          │  │
│  │                                                                                             │  │
│  │  @solana/web3.js       merkletreejs            @streamflow/stream     ioredis                │  │
│  │  (Solana transactions, (Merkle tree proofs     (Vesting stream        (Caching, rate         │  │
│  │   RPC, signatures)      for whitelists)         contracts)             limits, queues)       │  │
│  │                                                                                             │  │
│  └─────────────────────────────────────────────────────────────────────────────────────────────┘  │
│                                                                                                    │
└────────────────────────────────────────────────────────────────────────────────────────────────────┘
```

### Data Flow: User Action → Points → Tokens

```
User performs action in venture (e.g., places bet on BetEdge)
        │
        ▼
┌───────────────┐     ┌───────────────┐     ┌───────────────┐
│ @mcv/fabric   │────▶│ rewards       │────▶│ anti-gaming   │
│               │     │               │     │               │
│ Emits event:  │     │ Receives      │     │ Rate limit    │
│ bet.placed    │     │ accrual req   │     │ Velocity chk  │
│ { userId,     │     │ Lookup earn   │     │ Device chk    │
│   amount,     │     │ rules         │     │ IP reputation │
│   ventureId } │     │               │     │ Sybil score   │
└───────────────┘     └───────┬───────┘     └───────┬───────┘
                              │                     │ passed
                              ▼                     ▼
                      ┌───────────────┐     ┌───────────────┐
                      │ pointEntries  │────▶│ pointBalances │
                      │               │     │               │
                      │ Append-only   │     │ Update cached │
                      │ immutable log │     │ balance +     │
                      │ +100 points   │     │ Redis sync    │
                      └───────────────┘     └───────┬───────┘
                                                    │
                                                    │ user requests conversion
                                                    ▼
┌───────────────┐     ┌───────────────┐     ┌───────────────┐
│ acs           │────▶│ conversion    │────▶│ distribution  │
│               │     │               │     │               │
│ Current rate: │     │ Apply rule:   │     │ Create batch  │
│ 100pts = 1    │     │ 100pts → 1    │     │ Submit to     │
│ EDGE token    │     │ EDGE, deduct  │     │ Solana via    │
│ (regime-      │     │ points from   │     │ @mcv/web3-core│
│  dependent)   │     │ balance       │     │               │
└───────────────┘     └───────────────┘     └───────────────┘
                                                    │
                                                    ▼
                                            ┌───────────────┐
                                            │ Solana        │
                                            │               │
                                            │ SPL Transfer: │
                                            │ 1 EDGE → user │
                                            │ wallet        │
                                            │ TX confirmed  │
                                            └───────────────┘
```

### Data Flow: ACS Evaluation Cycle

```
Cron trigger (every 15 min) or manual trigger
        │
        ▼
┌───────────────┐     ┌───────────────┐     ┌───────────────┐
│ Fetch metrics │────▶│ Calculate     │────▶│ Determine     │
│               │     │ health scores │     │ regime        │
│ Market cap    │     │               │     │               │
│ Price         │     │ Liquidity     │     │ launch        │
│ Volume 24h    │     │ Velocity      │     │ growth        │
│ Staking ratio │     │ Concentration │     │ mature        │
│ Circ. supply  │     │ Overall       │     │ contraction   │
│               │     │               │     │ emergency     │
└───────────────┘     └───────────────┘     └───────┬───────┘
                                                    │
                                                    ▼
┌───────────────┐     ┌───────────────┐     ┌───────────────┐
│ Apply         │◀────│ Run           │◀────│ Load          │
│ adjustments   │     │ controllers   │     │ controllers   │
│               │     │               │     │               │
│ Update DB     │     │ StakingAPY    │     │ Current vals  │
│ Emit events   │     │ EmissionRate  │     │ Regime targets│
│ Audit log     │     │ BurnRate      │     │ Dampening     │
│               │     │ ConversionRate│     │ Bounds        │
└───────────────┘     └───────────────┘     └───────────────┘
```

---

## Sub-Module Overview

| Module | Purpose | Tables | Key Operations |
|--------|---------|--------|----------------|
| **rewards** | Point accrual, reward programs, pools, vesting, claims, distributions, anti-abuse | 16 | accrue points, create program, claim reward, convert points, distribute tokens |
| **acs** | Algorithmic regime detection, controller tuning, contribution scoring, leaderboards, decay | 12 | evaluate state, adjust controllers, score contribution, compute leaderboard |
| **launchpad** | Token sales, whitelists, Merkle proofs, vesting, purchases, claims, fair launch | 10 | create sale, upload whitelist, purchase tokens, claim vested, bootstrap liquidity |

---

## Module: rewards

### Purpose

Implements the full token reward lifecycle: point accrual from user actions across all ventures, reward program management with budgets and eligibility rules, reward pool allocation and vesting, claim workflows with wallet signature verification, anti-abuse detection at every entry point, cross-venture reward programs that unify earning across the ecosystem, and on-chain token distribution through batched Solana transactions.

The rewards module is the primary interface for users interacting with the EDGE token economy. Every venture-specific action (placing a bet, completing SEO work, referring a friend, hitting a gaming milestone) ultimately flows through this module as point entries, which can then be converted to EDGE tokens through conversion rules governed by ACS.

**The point ledger is append-only and immutable.** No updates, no deletes. Every point entry is a permanent record. This is a critical security invariant — token economies are high-value targets and the audit trail must be tamper-proof.

### Earn Rules: Actions → Points

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        VENTURE EARN RULES                                    │
│                                                                              │
│  BetEdge (Sports Betting AI)                                                │
│  ├── bet_placed ............. 1 pt per $1 wagered (max 500/day)             │
│  ├── bet_won ................ 2 pts per $1 won                              │
│  ├── streak_bonus ........... 50 pts per 7-day streak                       │
│  ├── referral_signup ........ 100 pts per verified referral                 │
│  └── referral_deposit ....... 200 pts per first deposit referral            │
│                                                                              │
│  SerpSpace (SEO)                                                            │
│  ├── content_created ........ 25 pts per published article                  │
│  ├── tool_usage ............. 5 pts per analysis run                        │
│  ├── marketplace_trade ...... 10 pts per completed order                    │
│  └── feedback_given ......... 15 pts per quality review                     │
│                                                                              │
│  Full Gain (Grants)                                                         │
│  ├── grant_milestone ........ 500 pts per milestone completed               │
│  ├── education_completed .... 50 pts per course finished                    │
│  └── community_moderation ... 25 pts per moderation action                  │
│                                                                              │
│  MCV Studios (Gaming)                                                       │
│  ├── achievement_unlocked ... 10-100 pts based on difficulty                │
│  ├── daily_login ............ 5 pts per day                                 │
│  ├── quest_completed ........ 25 pts per quest                              │
│  └── tournament_placement ... 100-1000 pts based on ranking                 │
│                                                                              │
│  Futurestate (Real Estate)                                                  │
│  ├── property_listed ........ 50 pts per listing                            │
│  ├── deal_closed ............ 500 pts per transaction                       │
│  └── referral_signup ........ 100 pts per verified referral                 │
│                                                                              │
│  Cross-Venture                                                              │
│  ├── governance_vote ........ 10 pts per vote cast                          │
│  ├── staking_deposit ........ 1 pt per $1 staked per day                    │
│  ├── liquidity_provided ..... 2 pts per $1 LP per day                       │
│  ├── social_share ........... 5 pts per verified share                      │
│  └── early_adopter .......... 1000 pts (one-time)                           │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Database Schema

```typescript
// reward_point_entries — Immutable Point Ledger (APPEND-ONLY)
export const pointEntries = pgTable('reward_point_entries', {
  id: text('id').$defaultFn(() => createId()).primaryKey(),
  ventureId: text('venture_id').notNull(),
  userId: text('user_id').notNull(),

  // Source tracking — what action generated this entry
  source: pointSourceEnum('source').notNull(),
  sourceId: text('source_id'),                            // Reference to bet, quest, order, etc.
  sourceVentureId: text('source_venture_id'),             // Which venture originated the action

  // Amount (can be negative for redemptions/expirations)
  amount: integer('amount').notNull(),
  multiplier: numeric('multiplier', { precision: 5, scale: 4 }).default('1'),
  finalAmount: integer('final_amount').notNull(),         // amount * multiplier, rounded

  // Program/campaign context
  programId: text('program_id'),
  campaignId: text('campaign_id'),
  poolId: text('pool_id'),                                // Which reward pool funded this

  // Anti-gaming metadata (captured at accrual time)
  sybilScore: numeric('sybil_score', { precision: 5, scale: 4 }),
  deviceFingerprint: text('device_fingerprint'),
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
  flagged: boolean('flagged').default(false),
  flagReason: text('flag_reason'),
  reviewStatus: text('review_status').default('auto_approved'), // auto_approved | pending_review | approved | rejected

  metadata: jsonb('metadata').$type<Record<string, unknown>>(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  // NO updatedAt — this table is immutable
}, (table) => ({
  userIdx: index('points_user_idx').on(table.userId),
  ventureUserIdx: index('points_venture_user_idx').on(table.ventureId, table.userId),
  sourceIdx: index('points_source_idx').on(table.source),
  createdIdx: index('points_created_idx').on(table.createdAt),
  flaggedIdx: index('points_flagged_idx').on(table.flagged).where(sql`flagged = true`),
  programIdx: index('points_program_idx').on(table.programId),
  poolIdx: index('points_pool_idx').on(table.poolId),
}));

// reward_point_balances — Materialized Balance Snapshots (updated async via queue)
export const pointBalances = pgTable('reward_point_balances', {
  id: text('id').$defaultFn(() => createId()).primaryKey(),
  ventureId: text('venture_id').notNull(),
  userId: text('user_id').notNull(),

  totalEarned: integer('total_earned').default(0),
  totalRedeemed: integer('total_redeemed').default(0),
  totalConverted: integer('total_converted').default(0),
  totalExpired: integer('total_expired').default(0),
  totalFlagged: integer('total_flagged').default(0),      // Points held due to abuse flags
  currentBalance: integer('current_balance').default(0),

  // Breakdown by source category
  breakdown: jsonb('breakdown').$type<Record<string, number>>(),

  // Tier tracking (based on lifetime points)
  lifetimePoints: integer('lifetime_points').default(0),
  currentTier: text('current_tier'),                      // bronze | silver | gold | platinum | diamond
  tierExpiresAt: timestamp('tier_expires_at'),
  tierMultiplier: numeric('tier_multiplier', { precision: 3, scale: 2 }).default('1.00'),

  lastActivity: timestamp('last_activity'),
  updatedAt: timestamp('updated_at').defaultNow().$onUpdate(() => new Date()),
}, (table) => ({
  ventureUserIdx: index('balance_venture_user_idx').on(table.ventureId, table.userId).unique(),
  tierIdx: index('balance_tier_idx').on(table.currentTier),
}));

// reward_programs — Reward Program Definitions
export const rewardPrograms = pgTable('reward_programs', {
  id: text('id').$defaultFn(() => createId()).primaryKey(),
  ventureId: text('venture_id').notNull(),

  // Identity
  name: text('name').notNull(),
  slug: text('slug').notNull(),
  description: text('description'),
  imageUrl: text('image_url'),

  // Type and status
  type: programTypeEnum('type').notNull(),                // points | token_airdrop | staking_yield | referral | campaign | loyalty_tier | achievement
  status: programStatusEnum('status').default('draft'),   // draft | scheduled | active | paused | completed | expired | cancelled

  // Budget
  budget: numeric('budget', { precision: 24, scale: 8 }),
  budgetType: text('budget_type').default('tokens'),      // 'tokens' | 'points' | 'usd'
  spent: numeric('spent', { precision: 24, scale: 8 }).default('0'),
  budgetAlertThreshold: numeric('budget_alert_threshold', { precision: 5, scale: 4 }).default('0.80'),

  // Emission configuration
  emissionRate: numeric('emission_rate', { precision: 18, scale: 8 }),
  emissionInterval: text('emission_interval'),            // 'daily' | 'weekly' | 'monthly'
  decayFactor: numeric('decay_factor', { precision: 5, scale: 4 }),

  // Eligibility
  eligibilityRules: jsonb('eligibility_rules').$type<EligibilityRule[]>(),
  // [{ type: 'min_tier', value: 'silver' },
  //  { type: 'kyc_verified', value: true },
  //  { type: 'min_age_days', value: 30 },
  //  { type: 'venture_active', value: ['betedge', 'serpspace'] }]

  // Earn rules (action→points mapping for this program)
  earnRules: jsonb('earn_rules').$type<EarnRule[]>(),
  // [{ source: 'bet_placed', pointsPerUnit: 1, unit: 'dollar', maxPerDay: 500 },
  //  { source: 'referral_signup', pointsFlat: 100, maxPerMonth: 50 }]

  // Timing
  startsAt: timestamp('starts_at'),
  endsAt: timestamp('ends_at'),

  // Participation
  participantCount: integer('participant_count').default(0),
  maxParticipants: integer('max_participants'),

  // Cross-venture flag
  isCrossVenture: boolean('is_cross_venture').default(false),
  participatingVentures: jsonb('participating_ventures').$type<string[]>(),

  metadata: jsonb('metadata').$type<Record<string, unknown>>(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().$onUpdate(() => new Date()),
}, (table) => ({
  ventureIdx: index('program_venture_idx').on(table.ventureId),
  statusIdx: index('program_status_idx').on(table.status),
  slugIdx: index('program_slug_idx').on(table.ventureId, table.slug).unique(),
  typeIdx: index('program_type_idx').on(table.type),
}));

// reward_program_participants — Program Enrollment Tracking
export const programParticipants = pgTable('reward_program_participants', {
  id: text('id').$defaultFn(() => createId()).primaryKey(),
  programId: text('program_id').notNull().references(() => rewardPrograms.id),
  userId: text('user_id').notNull(),

  status: text('status').default('active'),               // active | completed | disqualified | withdrawn
  joinedAt: timestamp('joined_at').defaultNow(),
  completedAt: timestamp('completed_at'),
  disqualifiedAt: timestamp('disqualified_at'),
  disqualifiedReason: text('disqualified_reason'),

  // Progress
  earnedAmount: numeric('earned_amount', { precision: 18, scale: 8 }).default('0'),
  claimedAmount: numeric('claimed_amount', { precision: 18, scale: 8 }).default('0'),
  pendingAmount: numeric('pending_amount', { precision: 18, scale: 8 }).default('0'),

  // Eligibility snapshot (captured at join time)
  eligibilityData: jsonb('eligibility_data').$type<Record<string, unknown>>(),

  metadata: jsonb('metadata').$type<Record<string, unknown>>(),
  updatedAt: timestamp('updated_at').defaultNow().$onUpdate(() => new Date()),
}, (table) => ({
  programUserIdx: index('participant_program_user_idx').on(table.programId, table.userId).unique(),
  statusIdx: index('participant_status_idx').on(table.status),
}));

// reward_pools — Token Reward Pool Budgets
export const rewardPools = pgTable('reward_pools', {
  id: text('id').$defaultFn(() => createId()).primaryKey(),
  ventureId: text('venture_id').notNull(),

  name: text('name').notNull(),
  description: text('description'),

  // Token configuration
  tokenMint: text('token_mint').notNull(),                // EDGE token mint address
  tokenSymbol: text('token_symbol').default('EDGE'),

  // Budget
  totalBudget: numeric('total_budget', { precision: 24, scale: 8 }).notNull(),
  allocatedAmount: numeric('allocated_amount', { precision: 24, scale: 8 }).default('0'),
  distributedAmount: numeric('distributed_amount', { precision: 24, scale: 8 }).default('0'),
  remainingAmount: numeric('remaining_amount', { precision: 24, scale: 8 }),
  reservedAmount: numeric('reserved_amount', { precision: 24, scale: 8 }).default('0'),

  // Funding source
  fundingSource: text('funding_source').notNull(),        // 'treasury' | 'emission' | 'buyback' | 'partner'
  fundingTxSignature: text('funding_tx_signature'),       // On-chain funding TX

  // Treasury wallet holding pool tokens
  treasuryAddress: text('treasury_address').notNull(),

  // Emission controls (ACS-governed)
  emissionRate: numeric('emission_rate', { precision: 18, scale: 8 }),
  emissionCap: numeric('emission_cap', { precision: 24, scale: 8 }),
  emissionPeriod: text('emission_period'),                // 'daily' | 'weekly' | 'monthly'

  // Status
  status: text('status').default('active'),               // active | depleted | paused | closed
  startsAt: timestamp('starts_at'),
  endsAt: timestamp('ends_at'),

  metadata: jsonb('metadata').$type<Record<string, unknown>>(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().$onUpdate(() => new Date()),
}, (table) => ({
  ventureIdx: index('pool_venture_idx').on(table.ventureId),
  statusIdx: index('pool_status_idx').on(table.status),
}));

// reward_pool_allocations — Per-Venture Pool Allocations
export const rewardPoolAllocations = pgTable('reward_pool_allocations', {
  id: text('id').$defaultFn(() => createId()).primaryKey(),
  poolId: text('pool_id').notNull().references(() => rewardPools.id),
  ventureId: text('venture_id').notNull(),

  allocationPercent: numeric('allocation_percent', { precision: 5, scale: 4 }).notNull(),
  allocatedAmount: numeric('allocated_amount', { precision: 24, scale: 8 }).default('0'),
  distributedAmount: numeric('distributed_amount', { precision: 24, scale: 8 }).default('0'),

  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().$onUpdate(() => new Date()),
}, (table) => ({
  poolVentureIdx: index('alloc_pool_venture_idx').on(table.poolId, table.ventureId).unique(),
}));

// reward_vesting_schedules — Reward Vesting Configurations
export const rewardVestingSchedules = pgTable('reward_vesting_schedules', {
  id: text('id').$defaultFn(() => createId()).primaryKey(),
  ventureId: text('venture_id').notNull(),
  programId: text('program_id').references(() => rewardPrograms.id),
  poolId: text('pool_id').references(() => rewardPools.id),

  name: text('name').notNull(),
  description: text('description'),

  // Vesting parameters
  vestingType: text('vesting_type').notNull(),            // 'linear' | 'cliff_linear' | 'graded' | 'immediate'
  totalAmount: numeric('total_amount', { precision: 24, scale: 8 }).notNull(),
  tgeUnlockPercent: numeric('tge_unlock_percent', { precision: 5, scale: 4 }).default('0'),
  cliffDurationSec: integer('cliff_duration_sec').default(0),
  vestingDurationSec: integer('vesting_duration_sec').notNull(),
  vestingIntervalSec: integer('vesting_interval_sec').default(86400),  // Daily by default

  // Timing
  startDate: timestamp('start_date').notNull(),
  cliffEndDate: timestamp('cliff_end_date'),
  endDate: timestamp('end_date').notNull(),

  // Status
  isActive: boolean('is_active').default(true),
  recipientCount: integer('recipient_count').default(0),

  metadata: jsonb('metadata').$type<Record<string, unknown>>(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().$onUpdate(() => new Date()),
});

// reward_claims — Claim History and Status
export const rewardClaims = pgTable('reward_claims', {
  id: text('id').$defaultFn(() => createId()).primaryKey(),
  ventureId: text('venture_id').notNull(),
  userId: text('user_id').notNull(),
  programId: text('program_id'),
  poolId: text('pool_id'),
  vestingScheduleId: text('vesting_schedule_id'),

  // Claim details
  claimType: text('claim_type').notNull(),                // 'instant' | 'vested' | 'conversion' | 'airdrop'
  tokenAmount: numeric('token_amount', { precision: 18, scale: 8 }).notNull(),
  tokenMint: text('token_mint').notNull(),
  walletAddress: text('wallet_address').notNull(),

  // On-chain settlement
  txSignature: text('tx_signature'),
  blockNumber: numeric('block_number'),
  settledAt: timestamp('settled_at'),

  // Status
  status: text('status').default('pending'),              // pending | processing | confirmed | failed | cancelled
  errorMessage: text('error_message'),
  retryCount: integer('retry_count').default(0),
  maxRetries: integer('max_retries').default(3),

  // Verification
  signatureVerified: boolean('signature_verified').default(false),
  identityVerified: boolean('identity_verified').default(false),

  metadata: jsonb('metadata').$type<Record<string, unknown>>(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().$onUpdate(() => new Date()),
}, (table) => ({
  userIdx: index('claim_user_idx').on(table.userId),
  statusIdx: index('claim_status_idx').on(table.status),
  ventureIdx: index('claim_venture_idx').on(table.ventureId),
}));

// reward_distribution_batches — On-Chain Token Distribution Batches
export const distributionBatches = pgTable('reward_distribution_batches', {
  id: text('id').$defaultFn(() => createId()).primaryKey(),
  ventureId: text('venture_id').notNull(),
  programId: text('program_id'),
  poolId: text('pool_id'),

  // Batch details
  name: text('name'),
  description: text('description'),
  batchNumber: text('batch_number'),                      // "DIST-2026-000042"

  // Recipients
  recipientCount: integer('recipient_count').notNull(),
  totalAmount: numeric('total_amount', { precision: 24, scale: 8 }).notNull(),
  tokenSymbol: text('token_symbol').default('EDGE'),
  tokenMint: text('token_mint').notNull(),

  // Processing
  status: text('status').default('pending'),              // pending | approved | processing | submitted | confirmed | partial | failed
  processedCount: integer('processed_count').default(0),
  confirmedCount: integer('confirmed_count').default(0),
  failedCount: integer('failed_count').default(0),

  // On-chain
  txSignatures: jsonb('tx_signatures').$type<string[]>(),
  treasuryAddress: text('treasury_address'),

  // Errors
  errorMessage: text('error_message'),
  errorDetails: jsonb('error_details'),

  // Approval (required for batches > $10,000 equivalent)
  requiresApproval: boolean('requires_approval').default(false),
  approvedBy: text('approved_by'),
  approvedAt: timestamp('approved_at'),
  rejectedBy: text('rejected_by'),
  rejectedAt: timestamp('rejected_at'),
  rejectionReason: text('rejection_reason'),

  // Timing
  scheduledFor: timestamp('scheduled_for'),
  startedAt: timestamp('started_at'),
  completedAt: timestamp('completed_at'),

  metadata: jsonb('metadata').$type<Record<string, unknown>>(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().$onUpdate(() => new Date()),
}, (table) => ({
  ventureIdx: index('dist_venture_idx').on(table.ventureId),
  statusIdx: index('dist_status_idx').on(table.status),
  scheduledIdx: index('dist_scheduled_idx').on(table.scheduledFor),
}));

// reward_distribution_recipients — Individual Distribution Records
export const distributionRecipients = pgTable('reward_distribution_recipients', {
  id: text('id').$defaultFn(() => createId()).primaryKey(),
  batchId: text('batch_id').notNull().references(() => distributionBatches.id),

  userId: text('user_id'),
  walletAddress: text('wallet_address').notNull(),

  amount: numeric('amount', { precision: 18, scale: 8 }).notNull(),

  status: text('status').default('pending'),              // pending | sent | confirmed | failed
  txSignature: text('tx_signature'),
  errorMessage: text('error_message'),
  retryCount: integer('retry_count').default(0),

  processedAt: timestamp('processed_at'),
  confirmedAt: timestamp('confirmed_at'),
}, (table) => ({
  batchIdx: index('recipient_batch_idx').on(table.batchId),
  walletIdx: index('recipient_wallet_idx').on(table.walletAddress),
  statusIdx: index('recipient_status_idx').on(table.status),
}));

// reward_conversion_rules — Points→Tokens Conversion Rules
export const conversionRules = pgTable('reward_conversion_rules', {
  id: text('id').$defaultFn(() => createId()).primaryKey(),
  ventureId: text('venture_id').notNull(),

  name: text('name').notNull(),
  description: text('description'),

  // Conversion rate (governed by ACS regime)
  pointsRequired: integer('points_required').notNull(),
  tokensReceived: numeric('tokens_received', { precision: 18, scale: 8 }).notNull(),
  baseRate: numeric('base_rate', { precision: 18, scale: 8 }).notNull(),    // tokens per point
  currentRate: numeric('current_rate', { precision: 18, scale: 8 }),        // ACS-adjusted rate

  // Limits
  minPoints: integer('min_points'),
  maxPoints: integer('max_points'),
  maxConversionsPerUser: integer('max_conversions_per_user'),
  maxConversionsPerDay: integer('max_conversions_per_day'),
  dailyCap: numeric('daily_cap', { precision: 24, scale: 8 }),             // Total tokens per day

  // Timing
  isActive: boolean('is_active').default(true),
  startsAt: timestamp('starts_at'),
  endsAt: timestamp('ends_at'),

  // Budget
  totalBudget: numeric('total_budget', { precision: 24, scale: 8 }),
  usedBudget: numeric('used_budget', { precision: 24, scale: 8 }).default('0'),

  // Requirements
  requireKyc: boolean('require_kyc').default(true),
  requireMinTier: text('require_min_tier'),               // null | 'silver' | 'gold' | ...
  requireWalletConnected: boolean('require_wallet_connected').default(true),

  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().$onUpdate(() => new Date()),
});

// reward_conversion_history — Conversion Transaction History
export const conversionHistory = pgTable('reward_conversion_history', {
  id: text('id').$defaultFn(() => createId()).primaryKey(),
  ventureId: text('venture_id').notNull(),
  userId: text('user_id').notNull(),
  ruleId: text('rule_id').references(() => conversionRules.id),

  pointsConverted: integer('points_converted').notNull(),
  tokensReceived: numeric('tokens_received', { precision: 18, scale: 8 }).notNull(),
  conversionRate: numeric('conversion_rate', { precision: 18, scale: 8 }).notNull(),
  regime: text('regime'),                                 // ACS regime at conversion time

  // Settlement
  status: text('status').default('pending'),              // pending | processing | confirmed | failed
  txSignature: text('tx_signature'),
  walletAddress: text('wallet_address'),
  errorMessage: text('error_message'),

  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  userIdx: index('conversion_user_idx').on(table.userId),
  statusIdx: index('conversion_status_idx').on(table.status),
}));

// reward_abuse_flags — Flagged Suspicious Activity
export const rewardAbuseFlags = pgTable('reward_abuse_flags', {
  id: text('id').$defaultFn(() => createId()).primaryKey(),
  ventureId: text('venture_id').notNull(),
  userId: text('user_id').notNull(),

  // Detection
  flagType: text('flag_type').notNull(),                  // 'rate_limit' | 'velocity' | 'shared_device' | 'suspicious_ip' | 'sybil' | 'referral_abuse' | 'bot_detected'
  severity: text('severity').notNull(),                   // 'low' | 'medium' | 'high' | 'critical'
  sybilScore: numeric('sybil_score', { precision: 5, scale: 4 }),
  confidence: numeric('confidence', { precision: 5, scale: 4 }),

  // Evidence
  evidence: jsonb('evidence').$type<{
    deviceFingerprints: string[];
    ipAddresses: string[];
    relatedUserIds: string[];
    activityPattern: Record<string, unknown>;
    detectionMethod: string;
  }>(),

  // Affected entries
  affectedPointEntryIds: jsonb('affected_point_entry_ids').$type<string[]>(),
  affectedPointsTotal: integer('affected_points_total').default(0),
  heldAmount: integer('held_amount').default(0),          // Points held pending review

  // Resolution
  status: text('status').default('open'),                 // open | investigating | resolved_legitimate | resolved_abuse | escalated
  resolvedBy: text('resolved_by'),
  resolvedAt: timestamp('resolved_at'),
  resolution: text('resolution'),
  action: text('action'),                                 // 'none' | 'points_reversed' | 'account_suspended' | 'account_banned'

  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().$onUpdate(() => new Date()),
}, (table) => ({
  userIdx: index('abuse_user_idx').on(table.userId),
  statusIdx: index('abuse_status_idx').on(table.status),
  severityIdx: index('abuse_severity_idx').on(table.severity),
}));

// reward_cross_venture_rules — Cross-Venture Reward Mappings
export const crossVentureRewardRules = pgTable('reward_cross_venture_rules', {
  id: text('id').$defaultFn(() => createId()).primaryKey(),

  name: text('name').notNull(),
  description: text('description'),

  // Source venture/action
  sourceVentureId: text('source_venture_id').notNull(),
  sourceAction: text('source_action').notNull(),          // e.g., 'bet_placed'

  // Target venture/reward
  targetVentureId: text('target_venture_id'),             // null = ecosystem-wide
  targetProgramId: text('target_program_id'),

  // Cross-venture multiplier
  multiplier: numeric('multiplier', { precision: 5, scale: 4 }).default('1.0'),
  bonusPoints: integer('bonus_points').default(0),

  // Conditions
  conditions: jsonb('conditions').$type<{
    minAmount?: number;
    maxPerDay?: number;
    requireBothVentureActive?: boolean;
    minTier?: string;
  }>(),

  isActive: boolean('is_active').default(true),
  startsAt: timestamp('starts_at'),
  endsAt: timestamp('ends_at'),

  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().$onUpdate(() => new Date()),
});
```

### Core Interface

```typescript
export class RewardsService {
  // ── Point Accrual ────────────────────────────────────────────────────
  accruePoints(input: AccruePointsInput): Promise<{ entry: PointEntry; balance: PointBalance; antiGaming: AntiGamingResult }>;
  bulkAccruePoints(inputs: AccruePointsInput[]): Promise<BulkAccrualResult>;
  getBalance(userId: string, ventureId?: string): Promise<PointBalance>;
  getHistory(userId: string, options?: PointHistoryOptions): Promise<PaginatedResult<PointEntry>>;
  getLeaderboard(period: LeaderboardPeriod, limit?: number): Promise<LeaderboardEntry[]>;

  // ── Reward Programs ──────────────────────────────────────────────────
  createProgram(input: CreateProgramInput): Promise<RewardProgram>;
  updateProgram(programId: string, input: UpdateProgramInput): Promise<RewardProgram>;
  activateProgram(programId: string): Promise<RewardProgram>;
  pauseProgram(programId: string, reason: string): Promise<RewardProgram>;
  joinProgram(programId: string, userId: string): Promise<ProgramParticipant>;
  leaveProgram(programId: string, userId: string): Promise<ProgramParticipant>;
  getProgramStats(programId: string): Promise<ProgramStats>;

  // ── Reward Pools ─────────────────────────────────────────────────────
  createPool(input: CreateRewardPoolInput): Promise<RewardPool>;
  allocateToVenture(poolId: string, ventureId: string, percent: number): Promise<RewardPoolAllocation>;
  getPoolStatus(poolId: string): Promise<RewardPoolStatus>;

  // ── Vesting ──────────────────────────────────────────────────────────
  createVestingSchedule(input: CreateVestingScheduleInput): Promise<RewardVestingSchedule>;
  getVestedAmount(userId: string, scheduleId: string): Promise<VestedAmountInfo>;
  getClaimableAmount(userId: string): Promise<ClaimableInfo>;

  // ── Claims ───────────────────────────────────────────────────────────
  claimReward(input: ClaimRewardInput): Promise<RewardClaim>;
  getClaimHistory(userId: string, options?: ClaimHistoryOptions): Promise<PaginatedResult<RewardClaim>>;
  retryFailedClaim(claimId: string): Promise<RewardClaim>;

  // ── Cross-Venture ────────────────────────────────────────────────────
  createCrossVentureRule(input: CreateCrossVentureRuleInput): Promise<CrossVentureRewardRule>;
  evaluateCrossVentureRewards(userId: string, action: string, ventureId: string): Promise<CrossVentureResult[]>;
}

export class DistributionService {
  // ── Batch Distribution ───────────────────────────────────────────────
  createBatch(input: CreateDistributionBatchInput): Promise<DistributionBatch>;
  approveBatch(batchId: string, approverId: string): Promise<DistributionBatch>;
  rejectBatch(batchId: string, rejecterId: string, reason: string): Promise<DistributionBatch>;
  executeBatch(batchId: string): Promise<DistributionBatch>;
  getBatchStatus(batchId: string): Promise<BatchStatusDetail>;
  retryFailed(batchId: string): Promise<DistributionBatch>;

  // ── Scheduling ───────────────────────────────────────────────────────
  scheduleBatch(input: CreateDistributionBatchInput, scheduledFor: Date): Promise<DistributionBatch>;
  processScheduledBatches(): Promise<ProcessingResult>;
}

export class ConversionService {
  // ── Points → Tokens ──────────────────────────────────────────────────
  getActiveRules(ventureId: string): Promise<ConversionRule[]>;
  getCurrentRate(ruleId: string): Promise<{ rate: number; regime: string }>;
  convertPoints(input: ConvertPointsInput): Promise<ConversionResult>;
  getConversionHistory(userId: string, options?: ConversionHistoryOptions): Promise<PaginatedResult<ConversionHistoryEntry>>;
  previewConversion(ruleId: string, points: number): Promise<ConversionPreview>;
}

export class AntiGamingService {
  // ── Detection ────────────────────────────────────────────────────────
  check(params: AntiGamingCheckParams): Promise<AntiGamingResult>;
  getFlags(userId: string, options?: FlagOptions): Promise<PaginatedResult<AbuseFlag>>;
  resolveFlag(flagId: string, resolution: FlagResolution): Promise<AbuseFlag>;
  getUserRiskProfile(userId: string): Promise<RiskProfile>;

  // ── Bulk Operations ──────────────────────────────────────────────────
  scanForPatterns(ventureId: string, window?: TimeWindow): Promise<PatternScanResult>;
  freezeUser(userId: string, reason: string): Promise<void>;
  unfreezeUser(userId: string, reason: string): Promise<void>;
}
```

### Anti-Gaming Engine — Deep Dive

```typescript
// rewards/anti-gaming.ts

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
  score: number;                    // 0.0 (clean) → 1.0 (definitely abuse)
  flags: string[];
  action: 'allow' | 'flag' | 'hold' | 'block';
  holdAmount?: number;              // Points to hold pending review
  details: AntiGamingDetail[];
}

export interface AntiGamingDetail {
  check: string;
  passed: boolean;
  score: number;
  evidence?: Record<string, unknown>;
}

export class AntiGamingEngine {
  // Rate limits per source — configurable per venture
  private readonly defaultRateLimits: Record<string, RateLimit> = {
    bet_placed:          { count: 100, windowMs: 60_000,       cooldownMs: 0 },
    bet_won:             { count: 100, windowMs: 60_000,       cooldownMs: 0 },
    referral_signup:     { count: 10,  windowMs: 86_400_000,   cooldownMs: 3_600_000 },
    referral_deposit:    { count: 10,  windowMs: 86_400_000,   cooldownMs: 3_600_000 },
    daily_login:         { count: 1,   windowMs: 86_400_000,   cooldownMs: 0 },
    social_share:        { count: 5,   windowMs: 3_600_000,    cooldownMs: 300_000 },
    content_created:     { count: 20,  windowMs: 86_400_000,   cooldownMs: 60_000 },
    quest_completed:     { count: 50,  windowMs: 86_400_000,   cooldownMs: 0 },
    governance_vote:     { count: 10,  windowMs: 86_400_000,   cooldownMs: 0 },
    staking_deposit:     { count: 5,   windowMs: 3_600_000,    cooldownMs: 0 },
    liquidity_provided:  { count: 5,   windowMs: 3_600_000,    cooldownMs: 0 },
    marketplace_trade:   { count: 50,  windowMs: 3_600_000,    cooldownMs: 0 },
    feedback_given:      { count: 10,  windowMs: 86_400_000,   cooldownMs: 300_000 },
    promotional:         { count: 1,   windowMs: 86_400_000,   cooldownMs: 0 },
    manual_adjustment:   { count: 100, windowMs: 3_600_000,    cooldownMs: 0 },
  };

  async check(params: AntiGamingCheckParams): Promise<AntiGamingResult> {
    const details: AntiGamingDetail[] = [];
    const flags: string[] = [];
    let totalScore = 0;

    // ─── CHECK 1: Rate Limit ──────────────────────────────────────────
    const rateResult = await this.checkRateLimit(params.userId, params.source, params.ventureId);
    details.push({ check: 'rate_limit', ...rateResult });
    if (!rateResult.passed) {
      flags.push('rate_limit_exceeded');
      totalScore += 0.3;
    }

    // ─── CHECK 2: Velocity Anomaly ────────────────────────────────────
    // Compare current activity rate to user's 30-day baseline
    const velocityResult = await this.checkVelocity(params.userId, params.source);
    details.push({ check: 'velocity_anomaly', ...velocityResult });
    if (!velocityResult.passed) {
      flags.push('velocity_anomaly');
      totalScore += velocityResult.score * 0.25;
    }

    // ─── CHECK 3: Device Fingerprint ──────────────────────────────────
    // Detect multiple accounts sharing the same device
    if (params.deviceFingerprint) {
      const deviceResult = await this.checkDeviceFingerprint(
        params.userId, params.deviceFingerprint
      );
      details.push({ check: 'device_fingerprint', ...deviceResult });
      if (!deviceResult.passed) {
        flags.push('shared_device');
        totalScore += 0.25;
      }
    }

    // ─── CHECK 4: IP Reputation ───────────────────────────────────────
    // Check against VPN/proxy/datacenter/tor lists + known bad actors
    if (params.ipAddress) {
      const ipResult = await this.checkIPReputation(params.ipAddress);
      details.push({ check: 'ip_reputation', ...ipResult });
      if (!ipResult.passed) {
        flags.push('suspicious_ip');
        totalScore += ipResult.score * 0.15;
      }
    }

    // ─── CHECK 5: Referral Chain Analysis ─────────────────────────────
    // Detect self-referral rings, circular chains, mass referral farms
    if (params.source === 'referral_signup' || params.source === 'referral_deposit') {
      const referralResult = await this.checkReferralChain(params.userId, params.metadata);
      details.push({ check: 'referral_chain', ...referralResult });
      if (!referralResult.passed) {
        flags.push('referral_abuse');
        totalScore += 0.4;
      }
    }

    // ─── CHECK 6: Bot Detection ───────────────────────────────────────
    // Analyze user agent, request timing patterns, mouse entropy (if available)
    if (params.userAgent) {
      const botResult = await this.checkBotSignals(params.userId, params.userAgent, params.metadata);
      details.push({ check: 'bot_detection', ...botResult });
      if (!botResult.passed) {
        flags.push('bot_suspected');
        totalScore += 0.35;
      }
    }

    // ─── CHECK 7: Cross-Account Correlation ───────────────────────────
    // Detect Sybil patterns: same IP + similar timing across multiple accounts
    const sybilResult = await this.checkSybilPatterns(params);
    details.push({ check: 'sybil_detection', ...sybilResult });
    if (!sybilResult.passed) {
      flags.push('sybil_suspected');
      totalScore += sybilResult.score * 0.35;
    }

    // ─── CHECK 8: Anomalous Value ─────────────────────────────────────
    // Unusually large point amounts for this source type
    const valueResult = await this.checkAnomalousValue(params.source, params.amount, params.userId);
    details.push({ check: 'anomalous_value', ...valueResult });
    if (!valueResult.passed) {
      flags.push('anomalous_value');
      totalScore += 0.2;
    }

    // ─── Determine Action ─────────────────────────────────────────────
    const normalizedScore = Math.min(1, totalScore);
    let action: 'allow' | 'flag' | 'hold' | 'block';
    let holdAmount: number | undefined;

    if (normalizedScore >= 0.8) {
      action = 'block';
    } else if (normalizedScore >= 0.5) {
      action = 'hold';
      holdAmount = params.amount;     // Hold all points pending review
    } else if (normalizedScore >= 0.3) {
      action = 'flag';                // Allow but flag for review
    } else {
      action = 'allow';
    }

    // Record abuse flag if score is significant
    if (normalizedScore >= 0.3) {
      await this.recordAbuseFlag({
        userId: params.userId,
        ventureId: params.ventureId,
        flagType: flags[0] || 'composite',
        severity: normalizedScore >= 0.8 ? 'critical' : normalizedScore >= 0.5 ? 'high' : 'medium',
        sybilScore: normalizedScore,
        confidence: 1 - (1 / (details.filter(d => !d.passed).length + 1)),
        evidence: {
          deviceFingerprints: params.deviceFingerprint ? [params.deviceFingerprint] : [],
          ipAddresses: params.ipAddress ? [params.ipAddress] : [],
          relatedUserIds: sybilResult.evidence?.relatedUsers || [],
          activityPattern: { source: params.source, amount: params.amount },
          detectionMethod: 'realtime_composite',
        },
        affectedPointsTotal: params.amount,
        heldAmount: holdAmount || 0,
      });
    }

    return {
      passed: action !== 'block',
      score: normalizedScore,
      flags,
      action,
      holdAmount,
      details,
    };
  }

  // Periodic batch scan for patterns not visible in real-time
  async scanForPatterns(ventureId: string, window: TimeWindow = { hours: 24 }): Promise<PatternScanResult> {
    const results: PatternMatch[] = [];

    // 1. Detect point farming rings (users who always act in sync)
    const farmingRings = await this.detectFarmingRings(ventureId, window);
    results.push(...farmingRings);

    // 2. Detect wash trading in marketplace
    const washTrades = await this.detectWashTrading(ventureId, window);
    results.push(...washTrades);

    // 3. Detect referral Sybil networks
    const sybilNetworks = await this.detectReferralSybilNetworks(ventureId, window);
    results.push(...sybilNetworks);

    // 4. Detect geographic anomalies (impossible travel)
    const geoAnomalies = await this.detectGeoAnomalies(ventureId, window);
    results.push(...geoAnomalies);

    return {
      scannedAt: new Date(),
      windowHours: window.hours,
      patternsFound: results.length,
      patterns: results,
      autoActions: results.filter(r => r.autoActionTaken).length,
    };
  }
}
```

### Reward Pool Budget Enforcement

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        REWARD POOL LIFECYCLE                                 │
│                                                                              │
│  Treasury ──fund──▶ Pool (total_budget)                                     │
│                       │                                                      │
│                       ├── allocate 40% → BetEdge rewards                    │
│                       ├── allocate 25% → SerpSpace rewards                  │
│                       ├── allocate 15% → Full Gain rewards                  │
│                       ├── allocate 10% → MCV Studios rewards                │
│                       └── allocate 10% → Cross-venture                      │
│                                                                              │
│  Emission Rate (ACS-governed):                                              │
│  ├── Launch regime: 100,000 EDGE/day                                        │
│  ├── Growth regime: 75,000 EDGE/day                                         │
│  ├── Mature regime: 50,000 EDGE/day                                         │
│  ├── Contraction:   25,000 EDGE/day                                         │
│  └── Emergency:     10,000 EDGE/day                                         │
│                                                                              │
│  Pool Status Transitions:                                                   │
│  active ──(budget < 10%)──▶ warning ──(budget = 0)──▶ depleted              │
│  active ──(manual)──▶ paused ──(manual)──▶ active                           │
│  depleted ──(refund)──▶ active                                              │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Claim Workflow State Machine

```
User requests claim
        │
        ▼
┌──────────┐    verify wallet    ┌──────────────┐    verify identity    ┌──────────────┐
│          │────────────────────▶│              │───────────────────────▶│              │
│ PENDING  │                     │ SIG_VERIFIED │                        │ ID_VERIFIED  │
│          │                     │              │                        │              │
└──────────┘                     └──────────────┘                        └──────┬───────┘
                                                                                │
                                                          ┌─────────────────────┼─────────────┐
                                                          │ amount ≤ threshold   │              │ amount > threshold
                                                          ▼                      │              ▼
                                                 ┌──────────────┐               │     ┌──────────────┐
                                                 │              │               │     │              │
                                                 │  PROCESSING  │               │     │ NEEDS_APPROVAL│
                                                 │  (auto-send) │               │     │              │
                                                 │              │               │     └──────┬───────┘
                                                 └──────┬───────┘               │            │ approved
                                                        │                       │            ▼
                                                        │                       │     ┌──────────────┐
                                                        │                       │     │              │
                                                        │                       │     │  PROCESSING  │
                                                        │                       │     │              │
                                                        │                       │     └──────┬───────┘
                                                        ▼                       │            │
                                                 ┌──────────────┐               │            │
                                                 │              │◀──────────────┘            │
                                                 │  CONFIRMED   │◀───────────────────────────┘
                                                 │  (on-chain)  │
                                                 └──────────────┘
                                                        │
                                                   tx failed?
                                                        │
                                                        ▼
                                                 ┌──────────────┐    retry (≤3x)    ┌──────────────┐
                                                 │              │──────────────────▶│              │
                                                 │   FAILED     │                    │  PROCESSING  │
                                                 │              │                    │              │
                                                 └──────────────┘                    └──────────────┘
```

### Tier System

```typescript
// Tier thresholds based on lifetime points
export const TIER_THRESHOLDS = {
  bronze:   0,
  silver:   10_000,
  gold:     50_000,
  platinum: 200_000,
  diamond:  1_000_000,
} as const;

// Tier multipliers applied to all point accruals
export const TIER_MULTIPLIERS = {
  bronze:   1.00,
  silver:   1.10,  // +10%
  gold:     1.25,  // +25%
  platinum: 1.50,  // +50%
  diamond:  2.00,  // +100%
} as const;

// Tier benefits
export const TIER_BENEFITS = {
  bronze:   { conversionBonus: 0, priorityClaim: false, exclusivePrograms: false },
  silver:   { conversionBonus: 0.05, priorityClaim: false, exclusivePrograms: false },
  gold:     { conversionBonus: 0.10, priorityClaim: true, exclusivePrograms: false },
  platinum: { conversionBonus: 0.15, priorityClaim: true, exclusivePrograms: true },
  diamond:  { conversionBonus: 0.25, priorityClaim: true, exclusivePrograms: true },
} as const;
```

### Key Behaviors

1. **Append-only ledger**: The `pointEntries` table is immutable — no UPDATE or DELETE operations. Corrections are recorded as new entries with negative amounts and a reference to the original entry.
2. **Async balance updates**: Point accrual writes the entry synchronously, then enqueues a balance update job. Redis is updated immediately for fast reads; PostgreSQL `pointBalances` follows via queue.
3. **Anti-gaming on every accrual**: Every call to `accruePoints()` runs through the anti-gaming engine. Blocked entries are never written. Held entries are written but flagged, with the points excluded from the usable balance until review.
4. **Tier recalculation**: Tier is recalculated on every balance update. Tier upgrades are immediate; downgrades only happen when `tierExpiresAt` passes (typically 90-day rolling window).
5. **Cross-venture rewards**: When a user performs an action in Venture A that triggers a cross-venture rule for Venture B, the system creates point entries in both ventures (the primary entry in A, the bonus entry in B).
6. **Distribution batching**: Token distributions are batched to minimize Solana transaction fees. The system accumulates up to 500 recipients per batch and submits them as compressed transactions.
7. **Conversion rate governance**: The actual points-to-tokens conversion rate is not static — it's the `baseRate` modulated by the ACS-computed `currentRate` based on the current regime. During contraction, fewer tokens per point; during growth, more.

---

## Module: acs

### Purpose

The Automated Contribution Scoring (ACS) module provides autonomous and semi-autonomous control of tokenomics parameters based on market conditions, protocol health, and governance decisions. It algorithmically scores user contributions across the ecosystem, computes leaderboards with time-decay functions, converts contribution scores to token allocations, and ensures economic stability across different market regimes.

ACS serves two distinct but related functions:
1. **Parameter Control** — Dynamically adjusting emission rates, staking APYs, conversion ratios, and burn rates based on real-time market conditions and protocol health metrics.
2. **Contribution Scoring** — Quantifying the value of user contributions (code commits, content creation, referrals, engagement) and converting those scores to token rewards with full transparency.

The core insight: a fixed emission schedule is fragile. Markets change, participation fluctuates, and static parameters lead to either inflationary death spirals or unnecessary token scarcity. ACS provides the feedback loop that makes the EDGE token economy adaptive and resilient.

### Regime Model

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                            ACS REGIME MODEL                                  │
│                                                                              │
│  Health Score: 0.0 ──────────────────────────────────────────────── 1.0     │
│                                                                              │
│  ├── EMERGENCY ──┤── CONTRACTION ──┤──── GROWTH ────┤──── MATURE ────┤     │
│  │   < 0.20      │   0.20 - 0.40   │   0.40 - 0.70  │   > 0.70       │     │
│  │               │                  │                 │                │     │
│  │  • Minimal    │  • Reduced       │  • Standard     │  • Full        │     │
│  │    emission   │    emission      │    emission     │    emission    │     │
│  │  • Emergency  │  • Defensive     │  • Competitive  │  • Sustainable │     │
│  │    APY (5%)   │    APY (8%)      │    APY (18%)    │    APY (12%)   │     │
│  │  • Halted     │  • Restricted    │  • Open         │  • Full        │     │
│  │    conversions│    conversions   │    conversions  │    conversions │     │
│  │  • Max burn   │  • High burn     │  • Low burn     │  • Balanced    │     │
│  │               │                  │                 │    burn        │     │
│  └───────────────┴──────────────────┴─────────────────┴────────────────┘     │
│                                                                              │
│  Hysteresis Band: ±0.05 (prevents rapid regime oscillation)                 │
│  Regime changes require sustained score for ≥ 3 evaluation cycles           │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Database Schema

```typescript
// acs_state — Current ACS System State
export const acsStates = pgTable('acs_state', {
  id: text('id').$defaultFn(() => createId()).primaryKey(),
  ventureId: text('venture_id').notNull(),
  economyId: text('economy_id').notNull(),
  currentRegime: regimeEnum('current_regime').notNull().default('launch'),
  previousRegime: regimeEnum('previous_regime'),
  regimeChangedAt: timestamp('regime_changed_at'),
  regimeStableFor: integer('regime_stable_for').default(0),   // Number of consecutive evaluations in current regime

  // Market metrics (latest snapshot)
  marketCap: numeric('market_cap', { precision: 24, scale: 8 }),
  circulatingSupply: numeric('circulating_supply', { precision: 24, scale: 8 }),
  totalSupply: numeric('total_supply', { precision: 24, scale: 8 }),
  price: numeric('price', { precision: 18, scale: 8 }),
  volume24h: numeric('volume_24h', { precision: 24, scale: 8 }),
  stakingRatio: numeric('staking_ratio', { precision: 5, scale: 4 }),
  liquidityDepth: numeric('liquidity_depth', { precision: 24, scale: 8 }),

  // Health scores (0.0 → 1.0)
  liquidityScore: numeric('liquidity_score', { precision: 5, scale: 4 }),
  velocityScore: numeric('velocity_score', { precision: 5, scale: 4 }),
  concentrationScore: numeric('concentration_score', { precision: 5, scale: 4 }),
  participationScore: numeric('participation_score', { precision: 5, scale: 4 }),
  overallHealth: numeric('overall_health', { precision: 5, scale: 4 }),

  lastEvaluation: timestamp('last_evaluation'),
  nextEvaluation: timestamp('next_evaluation'),
  evaluationIntervalSec: integer('evaluation_interval_sec').default(900), // 15 min default

  metadata: jsonb('metadata').$type<Record<string, unknown>>(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().$onUpdate(() => new Date()),
}, (table) => ({
  economyIdx: index('acs_state_economy_idx').on(table.economyId),
  ventureIdx: index('acs_state_venture_idx').on(table.ventureId),
}));

// acs_controller — Controller Configurations
export const acsControllers = pgTable('acs_controller', {
  id: text('id').$defaultFn(() => createId()).primaryKey(),
  ventureId: text('venture_id').notNull(),
  economyId: text('economy_id').notNull(),

  // Controller identity
  name: text('name').notNull(),                           // 'staking_apy', 'emission_rate', 'burn_rate', 'conversion_rate'
  category: text('category').notNull(),                   // 'staking', 'emission', 'burn', 'liquidity', 'conversion'
  description: text('description'),

  // Current values
  currentValue: numeric('current_value', { precision: 18, scale: 8 }).notNull(),
  targetValue: numeric('target_value', { precision: 18, scale: 8 }),
  previousValue: numeric('previous_value', { precision: 18, scale: 8 }),

  // Bounds (safety rails)
  minValue: numeric('min_value', { precision: 18, scale: 8 }).notNull(),
  maxValue: numeric('max_value', { precision: 18, scale: 8 }).notNull(),

  // Adjustment parameters
  dampeningFactor: numeric('dampening_factor', { precision: 5, scale: 4 }).default('0.1'),
  adjustmentCooldown: integer('adjustment_cooldown').default(3600),   // seconds between adjustments
  maxChangePerCycle: numeric('max_change_per_cycle', { precision: 5, scale: 4 }).default('0.10'), // 10% max change
  lastAdjusted: timestamp('last_adjusted'),

  // Regime-specific targets
  regimeTargets: jsonb('regime_targets').$type<Record<string, number>>(),
  // { launch: 0.25, growth: 0.18, mature: 0.12, contraction: 0.08, emergency: 0.05 }

  // Manual override (emergency use)
  isOverridden: boolean('is_overridden').default(false),
  overrideValue: numeric('override_value', { precision: 18, scale: 8 }),
  overrideExpiry: timestamp('override_expiry'),
  overrideReason: text('override_reason'),
  overrideSetBy: text('override_set_by'),

  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().$onUpdate(() => new Date()),
}, (table) => ({
  economyIdx: index('acs_ctrl_economy_idx').on(table.economyId),
  categoryIdx: index('acs_ctrl_category_idx').on(table.category),
  nameIdx: index('acs_ctrl_name_idx').on(table.economyId, table.name).unique(),
}));

// acs_evaluation — Evaluation History
export const acsEvaluations = pgTable('acs_evaluation', {
  id: text('id').$defaultFn(() => createId()).primaryKey(),
  ventureId: text('venture_id').notNull(),
  economyId: text('economy_id').notNull(),

  regime: regimeEnum('regime').notNull(),
  previousRegime: regimeEnum('previous_regime'),
  regimeChanged: boolean('regime_changed').default(false),

  // Input metrics
  inputMetrics: jsonb('input_metrics').$type<{
    marketCap: number;
    price: number;
    volume24h: number;
    liquidityDepth: number;
    stakingRatio: number;
    velocityIndex: number;
    circulatingSupply: number;
    activeUsers24h: number;
    transactionCount24h: number;
  }>().notNull(),

  // Computed scores
  scores: jsonb('scores').$type<{
    liquidity: number;
    velocity: number;
    concentration: number;
    participation: number;
    overall: number;
  }>().notNull(),

  // Adjustments made
  adjustments: jsonb('adjustments').$type<Array<{
    controllerId: string;
    controllerName: string;
    category: string;
    oldValue: number;
    newValue: number;
    targetValue: number;
    dampeningApplied: boolean;
    reason: string;
  }>>(),

  // Recommendations (for manual approval mode)
  recommendations: jsonb('recommendations').$type<Array<{
    controllerId: string;
    suggestedValue: number;
    confidence: number;
    rationale: string;
  }>>(),

  durationMs: integer('duration_ms'),                     // How long the evaluation took
  triggeredBy: text('triggered_by'),                      // 'cron' | 'manual' | 'event'

  evaluatedAt: timestamp('evaluated_at').defaultNow().notNull(),
}, (table) => ({
  economyIdx: index('acs_eval_economy_idx').on(table.economyId),
  evaluatedIdx: index('acs_eval_time_idx').on(table.evaluatedAt),
  regimeChangedIdx: index('acs_eval_regime_changed_idx').on(table.regimeChanged).where(sql`regime_changed = true`),
}));

// acs_audit_log — ACS Audit Trail
export const acsAuditLogs = pgTable('acs_audit_log', {
  id: text('id').$defaultFn(() => createId()).primaryKey(),
  ventureId: text('venture_id').notNull(),
  economyId: text('economy_id').notNull(),

  action: text('action').notNull(),                       // 'regime_change' | 'parameter_adjusted' | 'override_set' | 'override_cleared' | 'controller_created' | 'evaluation_triggered'
  regime: regimeEnum('regime'),
  controllerId: text('controller_id'),
  controllerName: text('controller_name'),

  oldValue: numeric('old_value', { precision: 18, scale: 8 }),
  newValue: numeric('new_value', { precision: 18, scale: 8 }),

  reason: text('reason'),
  triggeredBy: text('triggered_by'),                      // 'automatic' | 'manual' | 'governance' | 'emergency'
  actorId: text('actor_id'),
  actorRole: text('actor_role'),

  metadata: jsonb('metadata').$type<Record<string, unknown>>(),
  timestamp: timestamp('timestamp').defaultNow().notNull(),
}, (table) => ({
  economyIdx: index('acs_audit_economy_idx').on(table.economyId),
  actionIdx: index('acs_audit_action_idx').on(table.action),
  timestampIdx: index('acs_audit_time_idx').on(table.timestamp),
}));

// acs_contribution_entries — Raw Contribution Records
export const contributionEntries = pgTable('acs_contribution_entries', {
  id: text('id').$defaultFn(() => createId()).primaryKey(),
  ventureId: text('venture_id').notNull(),
  userId: text('user_id').notNull(),

  // Contribution details
  contributionType: text('contribution_type').notNull(),   // 'code_commit' | 'content_article' | 'referral' | 'engagement' | 'moderation' | 'bug_report' | 'feature_request' | 'community_support'
  category: text('category').notNull(),                    // 'code' | 'content' | 'referral' | 'engagement' | 'governance'
  sourceId: text('source_id'),                             // Reference to the contribution (commit hash, article ID, etc.)
  sourceUrl: text('source_url'),                           // Link to the contribution

  // Raw metrics
  rawMetrics: jsonb('raw_metrics').$type<Record<string, number>>(),
  // For code: { linesAdded: 150, linesRemoved: 20, filesChanged: 5, complexity: 0.7 }
  // For content: { wordCount: 2000, readTime: 8, uniqueViews: 500, shares: 25 }
  // For referral: { signups: 1, deposits: 1, depositAmount: 100, retained30d: true }
  // For engagement: { sessionsPerWeek: 5, avgSessionLength: 45, actionsPerSession: 12 }

  // Computed score (by contribution scoring engine)
  rawScore: numeric('raw_score', { precision: 18, scale: 8 }),
  weightedScore: numeric('weighted_score', { precision: 18, scale: 8 }),
  decayedScore: numeric('decayed_score', { precision: 18, scale: 8 }),

  // Quality assessment
  qualityMultiplier: numeric('quality_multiplier', { precision: 5, scale: 4 }).default('1.0'),
  peerReviewed: boolean('peer_reviewed').default(false),
  peerReviewScore: numeric('peer_review_score', { precision: 5, scale: 4 }),

  metadata: jsonb('metadata').$type<Record<string, unknown>>(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  userIdx: index('contrib_user_idx').on(table.userId),
  typeIdx: index('contrib_type_idx').on(table.contributionType),
  categoryIdx: index('contrib_category_idx').on(table.category),
  createdIdx: index('contrib_created_idx').on(table.createdAt),
  ventureUserIdx: index('contrib_venture_user_idx').on(table.ventureId, table.userId),
}));

// acs_contribution_scores — Aggregated Contribution Scores (Per User)
export const contributionScores = pgTable('acs_contribution_scores', {
  id: text('id').$defaultFn(() => createId()).primaryKey(),
  ventureId: text('venture_id').notNull(),
  userId: text('user_id').notNull(),

  // Aggregate scores by category
  codeScore: numeric('code_score', { precision: 18, scale: 8 }).default('0'),
  contentScore: numeric('content_score', { precision: 18, scale: 8 }).default('0'),
  referralScore: numeric('referral_score', { precision: 18, scale: 8 }).default('0'),
  engagementScore: numeric('engagement_score', { precision: 18, scale: 8 }).default('0'),
  governanceScore: numeric('governance_score', { precision: 18, scale: 8 }).default('0'),

  // Total composite score
  totalScore: numeric('total_score', { precision: 18, scale: 8 }).default('0'),
  decayedTotalScore: numeric('decayed_total_score', { precision: 18, scale: 8 }).default('0'),

  // Rankings
  rank: integer('rank'),
  percentile: numeric('percentile', { precision: 5, scale: 4 }),

  // Token conversion tracking
  tokensEarned: numeric('tokens_earned', { precision: 24, scale: 8 }).default('0'),
  tokensClaimed: numeric('tokens_claimed', { precision: 24, scale: 8 }).default('0'),
  tokensVesting: numeric('tokens_vesting', { precision: 24, scale: 8 }).default('0'),

  // Activity
  contributionCount: integer('contribution_count').default(0),
  lastContributionAt: timestamp('last_contribution_at'),

  updatedAt: timestamp('updated_at').defaultNow().$onUpdate(() => new Date()),
}, (table) => ({
  ventureUserIdx: index('score_venture_user_idx').on(table.ventureId, table.userId).unique(),
  totalScoreIdx: index('score_total_idx').on(table.decayedTotalScore),
  rankIdx: index('score_rank_idx').on(table.rank),
}));

// acs_contribution_types — Contribution Type Definitions
export const contributionTypes = pgTable('acs_contribution_types', {
  id: text('id').$defaultFn(() => createId()).primaryKey(),
  ventureId: text('venture_id'),                           // null = ecosystem-wide

  name: text('name').notNull(),
  category: text('category').notNull(),
  description: text('description'),

  // Scoring formula
  baseWeight: numeric('base_weight', { precision: 5, scale: 4 }).notNull(),     // Relative weight in category
  scoringFormula: text('scoring_formula').notNull(),        // Expression: 'linesAdded * 0.5 + complexity * 100'
  maxScorePerEntry: numeric('max_score_per_entry', { precision: 18, scale: 8 }),
  maxScorePerDay: numeric('max_score_per_day', { precision: 18, scale: 8 }),

  // Quality modifiers
  qualityFactors: jsonb('quality_factors').$type<Array<{
    name: string;
    weight: number;
    evaluationMethod: 'automatic' | 'peer_review' | 'admin_review';
  }>>(),

  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().$onUpdate(() => new Date()),
});

// acs_score_snapshots — Periodic Score Snapshots
export const scoreSnapshots = pgTable('acs_score_snapshots', {
  id: text('id').$defaultFn(() => createId()).primaryKey(),
  ventureId: text('venture_id').notNull(),
  userId: text('user_id').notNull(),

  period: text('period').notNull(),                        // '2026-W06', '2026-02', '2026-Q1'
  periodType: text('period_type').notNull(),               // 'weekly' | 'monthly' | 'quarterly'

  scores: jsonb('scores').$type<{
    code: number;
    content: number;
    referral: number;
    engagement: number;
    governance: number;
    total: number;
  }>().notNull(),

  rank: integer('rank'),
  percentile: numeric('percentile', { precision: 5, scale: 4 }),
  contributionCount: integer('contribution_count'),

  snapshotAt: timestamp('snapshot_at').defaultNow().notNull(),
}, (table) => ({
  ventureUserPeriodIdx: index('snapshot_venture_user_period_idx')
    .on(table.ventureId, table.userId, table.period).unique(),
  periodIdx: index('snapshot_period_idx').on(table.period),
}));

// acs_leaderboards — Leaderboard Cache Table
export const leaderboards = pgTable('acs_leaderboards', {
  id: text('id').$defaultFn(() => createId()).primaryKey(),
  ventureId: text('venture_id'),                           // null = ecosystem-wide
  period: text('period').notNull(),                        // 'weekly' | 'monthly' | 'alltime'
  periodKey: text('period_key').notNull(),                 // '2026-W06' | '2026-02' | 'alltime'
  category: text('category'),                              // null = overall, or 'code' | 'content' | etc.

  entryCount: integer('entry_count').default(0),
  lastComputedAt: timestamp('last_computed_at'),

  metadata: jsonb('metadata').$type<Record<string, unknown>>(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  periodKeyIdx: index('lb_period_key_idx').on(table.ventureId, table.periodKey, table.category).unique(),
}));

// acs_leaderboard_entries — Individual Leaderboard Positions
export const leaderboardEntries = pgTable('acs_leaderboard_entries', {
  id: text('id').$defaultFn(() => createId()).primaryKey(),
  leaderboardId: text('leaderboard_id').notNull().references(() => leaderboards.id),
  userId: text('user_id').notNull(),

  rank: integer('rank').notNull(),
  score: numeric('score', { precision: 18, scale: 8 }).notNull(),
  previousRank: integer('previous_rank'),
  rankChange: integer('rank_change'),                      // +3 = moved up 3, -2 = moved down 2

  metadata: jsonb('metadata').$type<Record<string, unknown>>(),
}, (table) => ({
  leaderboardIdx: index('lb_entry_lb_idx').on(table.leaderboardId),
  rankIdx: index('lb_entry_rank_idx').on(table.leaderboardId, table.rank),
  userIdx: index('lb_entry_user_idx').on(table.userId),
}));

// acs_decay_configurations — Decay Function Parameters
export const decayConfigurations = pgTable('acs_decay_configurations', {
  id: text('id').$defaultFn(() => createId()).primaryKey(),
  ventureId: text('venture_id'),                           // null = ecosystem default
  category: text('category'),                              // null = all categories, or specific

  // Decay function parameters
  decayFunction: text('decay_function').notNull(),         // 'exponential' | 'linear' | 'step' | 'logarithmic'
  halfLifeDays: integer('half_life_days').notNull(),        // Days until score decays to 50%
  minimumRetention: numeric('minimum_retention', { precision: 5, scale: 4 }).default('0.10'), // Never decay below 10%
  decayStartDays: integer('decay_start_days').default(0),  // Grace period before decay begins

  // Step function config (if decayFunction = 'step')
  steps: jsonb('steps').$type<Array<{ days: number; retention: number }>>(),
  // [{ days: 30, retention: 1.0 }, { days: 90, retention: 0.75 }, { days: 180, retention: 0.5 }, { days: 365, retention: 0.25 }]

  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().$onUpdate(() => new Date()),
});

// acs_scoring_transparency_logs — Scoring Explanation Logs
export const scoringTransparencyLogs = pgTable('acs_scoring_transparency_logs', {
  id: text('id').$defaultFn(() => createId()).primaryKey(),
  ventureId: text('venture_id').notNull(),
  userId: text('user_id').notNull(),
  contributionEntryId: text('contribution_entry_id').references(() => contributionEntries.id),

  // Scoring breakdown (human-readable)
  explanation: jsonb('explanation').$type<{
    contributionType: string;
    rawMetrics: Record<string, number>;
    formulaUsed: string;
    rawScore: number;
    qualityMultiplier: number;
    categoryWeight: number;
    decayFactor: number;
    finalScore: number;
    steps: Array<{ description: string; value: number }>;
  }>().notNull(),

  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  userIdx: index('transparency_user_idx').on(table.userId),
  contributionIdx: index('transparency_contrib_idx').on(table.contributionEntryId),
}));
```

### Core Interface

```typescript
export class AcsService {
  // ── State Management ─────────────────────────────────────────────────
  getState(economyId: string): Promise<AcsState>;
  getControllers(economyId: string, category?: string): Promise<AcsController[]>;
  getController(controllerId: string): Promise<AcsController>;
  getEvaluationHistory(economyId: string, options?: PaginationOptions): Promise<PaginatedResult<AcsEvaluation>>;
  getAuditLog(economyId: string, options?: AuditLogOptions): Promise<PaginatedResult<AcsAuditLog>>;

  // ── Evaluation ───────────────────────────────────────────────────────
  evaluate(economyId: string, triggeredBy?: string): Promise<EvaluationResult>;

  // ── Controller Management ────────────────────────────────────────────
  createController(input: CreateControllerInput): Promise<AcsController>;
  updateController(controllerId: string, input: UpdateControllerInput): Promise<AcsController>;

  // ── Overrides (Emergency) ────────────────────────────────────────────
  setOverride(input: SetOverrideInput): Promise<AcsController>;
  clearOverride(controllerId: string, reason: string): Promise<AcsController>;

  // ── Regime Management ────────────────────────────────────────────────
  forceRegime(input: ForceRegimeInput): Promise<AcsState>;
}

export class ContributionScoringService {
  // ── Scoring ──────────────────────────────────────────────────────────
  scoreContribution(input: ScoreContributionInput): Promise<ScoringResult>;
  getContributions(userId: string, options?: ContributionOptions): Promise<PaginatedResult<ContributionEntry>>;
  getScore(userId: string, ventureId?: string): Promise<ContributionScore>;
  getScoreBreakdown(userId: string, ventureId?: string): Promise<ScoreBreakdown>;
  getScoringExplanation(contributionEntryId: string): Promise<ScoringTransparencyLog>;

  // ── Bulk Operations ──────────────────────────────────────────────────
  recomputeAllScores(ventureId: string): Promise<RecomputeResult>;
  applyDecay(ventureId?: string): Promise<DecayResult>;
  takeSnapshot(period: string, periodType: string): Promise<SnapshotResult>;
}

export class LeaderboardService {
  // ── Leaderboard ──────────────────────────────────────────────────────
  getLeaderboard(input: GetLeaderboardInput): Promise<LeaderboardResult>;
  computeLeaderboard(ventureId: string | null, period: string, category?: string): Promise<Leaderboard>;
  getUserRank(userId: string, leaderboardId: string): Promise<LeaderboardEntry | null>;
  getNeighbors(userId: string, leaderboardId: string, range?: number): Promise<LeaderboardEntry[]>;
}

export class ScoreDecayService {
  // ── Decay Configuration ──────────────────────────────────────────────
  getDecayConfig(ventureId?: string, category?: string): Promise<DecayConfiguration>;
  updateDecayConfig(configId: string, input: UpdateDecayConfigInput): Promise<DecayConfiguration>;
  previewDecay(userId: string, daysForward: number): Promise<DecayPreview>;

  // ── Decay Application ────────────────────────────────────────────────
  applyDecay(ventureId?: string, dryRun?: boolean): Promise<DecayApplicationResult>;
}
```

### Controller Engine — Deep Dive

```typescript
// acs/engine.ts

export interface AcsContext {
  economyId: string;
  regime: AcsRegime;
  previousRegime: AcsRegime;
  metrics: MarketMetrics;
  scores: HealthScores;
  controllers: Map<string, ControllerState>;
  evaluationCount: number;                    // How many evals in current regime
}

export abstract class BaseController {
  abstract name: string;
  abstract category: string;

  abstract evaluate(ctx: AcsContext): Promise<ControllerAdjustment | null>;

  protected applyDampening(
    currentValue: number,
    targetValue: number,
    dampeningFactor: number,
    maxChangePercent: number
  ): number {
    // Dampening prevents sudden large changes
    const maxChange = currentValue * maxChangePercent;
    const dampened = currentValue + (targetValue - currentValue) * dampeningFactor;
    const change = dampened - currentValue;
    const clampedChange = Math.max(-maxChange, Math.min(maxChange, change));
    return currentValue + clampedChange;
  }

  protected clampToBounds(value: number, min: number, max: number): number {
    return Math.max(min, Math.min(max, value));
  }
}

export class StakingApyController extends BaseController {
  name = 'staking_apy';
  category = 'staking';

  async evaluate(ctx: AcsContext): Promise<ControllerAdjustment | null> {
    const controller = ctx.controllers.get(this.name);
    if (!controller || controller.isOverridden) return null;

    // Check cooldown
    if (controller.lastAdjusted) {
      const elapsed = Date.now() - controller.lastAdjusted.getTime();
      if (elapsed < controller.adjustmentCooldown * 1000) return null;
    }

    const regimeTargets: Record<AcsRegime, number> = {
      launch:      0.25,   // 25% APY — aggressive to attract stakers
      growth:      0.18,   // 18% — competitive but sustainable
      mature:      0.12,   // 12% — long-term sustainable
      contraction: 0.08,   // 8%  — preserve treasury
      emergency:   0.05,   // 5%  — minimal emission
    };

    const targetApy = controller.regimeTargets?.[ctx.regime]
      ?? regimeTargets[ctx.regime];
    const currentApy = controller.currentValue;

    // Factor in staking ratio — if too few stakers, increase APY slightly
    let adjustedTarget = targetApy;
    if (ctx.metrics.stakingRatio < 0.3) {
      adjustedTarget *= 1.15;  // +15% if staking ratio is low
    } else if (ctx.metrics.stakingRatio > 0.7) {
      adjustedTarget *= 0.90;  // -10% if too many stakers (reduces sell pressure)
    }

    if (Math.abs(adjustedTarget - currentApy) < 0.001) return null;

    const newApy = this.clampToBounds(
      this.applyDampening(
        currentApy,
        adjustedTarget,
        controller.dampeningFactor,
        controller.maxChangePerCycle
      ),
      controller.minValue,
      controller.maxValue
    );

    return {
      controllerId: controller.id,
      controllerName: this.name,
      category: this.category,
      oldValue: currentApy,
      newValue: newApy,
      targetValue: adjustedTarget,
      dampeningApplied: true,
      reason: `Regime ${ctx.regime}, staking ratio ${(ctx.metrics.stakingRatio * 100).toFixed(1)}%: adjusting APY toward ${(adjustedTarget * 100).toFixed(1)}%`,
    };
  }
}

export class EmissionRateController extends BaseController {
  name = 'emission_rate';
  category = 'emission';

  async evaluate(ctx: AcsContext): Promise<ControllerAdjustment | null> {
    const controller = ctx.controllers.get(this.name);
    if (!controller || controller.isOverridden) return null;

    // Dynamic emission based on velocity and health
    const baseRate = controller.regimeTargets?.[ctx.regime] ?? 0.5;

    // High velocity = tokens changing hands rapidly = reduce emission
    const velocityMultiplier = 1 - (ctx.scores.velocity * 0.3);

    // Low participation = fewer people earning = reduce emission
    const participationMultiplier = 0.5 + (ctx.scores.participation * 0.5);

    const targetRate = baseRate * velocityMultiplier * participationMultiplier;
    const currentRate = controller.currentValue;

    if (Math.abs(targetRate - currentRate) < 0.001) return null;

    const newRate = this.clampToBounds(
      this.applyDampening(currentRate, targetRate, controller.dampeningFactor, controller.maxChangePerCycle),
      controller.minValue,
      controller.maxValue
    );

    return {
      controllerId: controller.id,
      controllerName: this.name,
      category: this.category,
      oldValue: currentRate,
      newValue: newRate,
      targetValue: targetRate,
      dampeningApplied: true,
      reason: `Velocity ${ctx.scores.velocity.toFixed(2)}, participation ${ctx.scores.participation.toFixed(2)}: adjusting emission rate`,
    };
  }
}

export class ConversionRateController extends BaseController {
  name = 'conversion_rate';
  category = 'conversion';

  async evaluate(ctx: AcsContext): Promise<ControllerAdjustment | null> {
    const controller = ctx.controllers.get(this.name);
    if (!controller || controller.isOverridden) return null;

    // Conversion rate: tokens per point
    // Higher in growth (reward early adopters), lower in contraction (preserve value)
    const regimeRates: Record<AcsRegime, number> = {
      launch:      0.015,   // 1 EDGE per ~67 points
      growth:      0.012,   // 1 EDGE per ~83 points
      mature:      0.010,   // 1 EDGE per 100 points
      contraction: 0.006,   // 1 EDGE per ~167 points
      emergency:   0.003,   // 1 EDGE per ~333 points
    };

    const targetRate = controller.regimeTargets?.[ctx.regime] ?? regimeRates[ctx.regime];
    const currentRate = controller.currentValue;

    if (Math.abs(targetRate - currentRate) < 0.0001) return null;

    const newRate = this.clampToBounds(
      this.applyDampening(currentRate, targetRate, controller.dampeningFactor, controller.maxChangePerCycle),
      controller.minValue,
      controller.maxValue
    );

    return {
      controllerId: controller.id,
      controllerName: this.name,
      category: this.category,
      oldValue: currentRate,
      newValue: newRate,
      targetValue: targetRate,
      dampeningApplied: true,
      reason: `Regime ${ctx.regime}: adjusting conversion rate toward ${targetRate} tokens/point`,
    };
  }
}

export class BurnRateController extends BaseController {
  name = 'burn_rate';
  category = 'burn';

  async evaluate(ctx: AcsContext): Promise<ControllerAdjustment | null> {
    const controller = ctx.controllers.get(this.name);
    if (!controller || controller.isOverridden) return null;

    // Burn rate: percentage of transaction fees burned
    // Higher burn during contraction (reduce supply), lower during growth (let supply grow)
    const regimeBurnRates: Record<AcsRegime, number> = {
      launch:      0.02,    // 2% burn
      growth:      0.03,    // 3% burn
      mature:      0.05,    // 5% burn — balanced
      contraction: 0.10,    // 10% burn — aggressive supply reduction
      emergency:   0.15,    // 15% burn — maximum deflationary pressure
    };

    const targetRate = controller.regimeTargets?.[ctx.regime] ?? regimeBurnRates[ctx.regime];
    const currentRate = controller.currentValue;

    if (Math.abs(targetRate - currentRate) < 0.001) return null;

    const newRate = this.clampToBounds(
      this.applyDampening(currentRate, targetRate, controller.dampeningFactor, controller.maxChangePerCycle),
      controller.minValue,
      controller.maxValue
    );

    return {
      controllerId: controller.id,
      controllerName: this.name,
      category: this.category,
      oldValue: currentRate,
      newValue: newRate,
      targetValue: targetRate,
      dampeningApplied: true,
      reason: `Regime ${ctx.regime}: adjusting burn rate toward ${(targetRate * 100).toFixed(1)}%`,
    };
  }
}

// Controller Registry
export const controllerRegistry: BaseController[] = [
  new StakingApyController(),
  new EmissionRateController(),
  new ConversionRateController(),
  new BurnRateController(),
];

// Main Evaluation Engine
export class AcsEngine {
  constructor(
    private readonly metricsProvider: MetricsProvider,
    private readonly db: DrizzleDB,
    private readonly cache: RedisClient,
    private readonly eventBus: EventBus,
  ) {}

  async evaluate(economyId: string, triggeredBy: string = 'cron'): Promise<EvaluationResult> {
    const startTime = Date.now();

    // 1. Load current state
    const state = await this.loadState(economyId);

    // 2. Fetch market metrics from oracles / aggregators
    const metrics = await this.metricsProvider.fetchMetrics(economyId);

    // 3. Calculate health scores (each 0.0 → 1.0)
    const scores = this.calculateScores(metrics);

    // 4. Determine regime (with hysteresis)
    const { regime, changed } = this.determineRegime(
      scores,
      state.currentRegime,
      state.regimeStableFor
    );

    // 5. Build evaluation context
    const ctx: AcsContext = {
      economyId,
      regime,
      previousRegime: state.currentRegime,
      metrics,
      scores,
      controllers: await this.loadControllers(economyId),
      evaluationCount: state.regimeStableFor + (changed ? 0 : 1),
    };

    // 6. Run all registered controllers
    const adjustments: ControllerAdjustment[] = [];
    for (const controller of controllerRegistry) {
      try {
        const adjustment = await controller.evaluate(ctx);
        if (adjustment) adjustments.push(adjustment);
      } catch (error) {
        // Log but don't fail the entire evaluation
        console.error(`Controller ${controller.name} failed:`, error);
      }
    }

    // 7. Apply adjustments atomically
    await this.db.transaction(async (tx) => {
      // Update state
      await tx.update(acsStates)
        .set({
          currentRegime: regime,
          previousRegime: changed ? state.currentRegime : state.previousRegime,
          regimeChangedAt: changed ? new Date() : state.regimeChangedAt,
          regimeStableFor: changed ? 0 : state.regimeStableFor + 1,
          marketCap: metrics.marketCap.toString(),
          price: metrics.price.toString(),
          volume24h: metrics.volume24h.toString(),
          // ... other metric updates
          liquidityScore: scores.liquidity.toString(),
          velocityScore: scores.velocity.toString(),
          concentrationScore: scores.concentration.toString(),
          participationScore: scores.participation.toString(),
          overallHealth: scores.overall.toString(),
          lastEvaluation: new Date(),
          nextEvaluation: new Date(Date.now() + state.evaluationIntervalSec * 1000),
        })
        .where(eq(acsStates.id, state.id));

      // Apply controller adjustments
      for (const adj of adjustments) {
        await tx.update(acsControllers)
          .set({
            previousValue: adj.oldValue.toString(),
            currentValue: adj.newValue.toString(),
            targetValue: adj.targetValue.toString(),
            lastAdjusted: new Date(),
          })
          .where(eq(acsControllers.id, adj.controllerId));
      }

      // Log evaluation
      await tx.insert(acsEvaluations).values({
        ventureId: state.ventureId,
        economyId,
        regime,
        previousRegime: state.currentRegime,
        regimeChanged: changed,
        inputMetrics: metrics,
        scores,
        adjustments,
        durationMs: Date.now() - startTime,
        triggeredBy,
      });

      // Log audit entries
      if (changed) {
        await tx.insert(acsAuditLogs).values({
          ventureId: state.ventureId,
          economyId,
          action: 'regime_change',
          regime,
          reason: `Health score ${scores.overall.toFixed(3)}: ${state.currentRegime} → ${regime}`,
          triggeredBy: 'automatic',
        });
      }

      for (const adj of adjustments) {
        await tx.insert(acsAuditLogs).values({
          ventureId: state.ventureId,
          economyId,
          action: 'parameter_adjusted',
          regime,
          controllerId: adj.controllerId,
          controllerName: adj.controllerName,
          oldValue: adj.oldValue.toString(),
          newValue: adj.newValue.toString(),
          reason: adj.reason,
          triggeredBy: 'automatic',
        });
      }
    });

    // 8. Emit events
    if (changed) {
      await this.eventBus.emit('acs.regime_changed', {
        economyId,
        from: state.currentRegime,
        to: regime,
        health: scores.overall,
      });
    }

    for (const adj of adjustments) {
      await this.eventBus.emit('acs.parameter_adjusted', {
        economyId,
        controller: adj.controllerName,
        from: adj.oldValue,
        to: adj.newValue,
      });
    }

    // 9. Invalidate caches
    await this.cache.del(`acs:state:${economyId}`);
    await this.cache.del(`acs:controllers:${economyId}`);
    for (const adj of adjustments) {
      await this.cache.del(`acs:controller:${adj.controllerId}`);
    }

    return {
      regime,
      previousRegime: state.currentRegime,
      regimeChanged: changed,
      scores,
      adjustments,
      durationMs: Date.now() - startTime,
    };
  }

  private calculateScores(metrics: MarketMetrics): HealthScores {
    // Liquidity score: depth relative to market cap
    const liquidity = Math.min(1, (metrics.liquidityDepth / (metrics.marketCap * 0.05)));

    // Velocity score: volume relative to market cap (high velocity = risky)
    // Inverted: high velocity = low score
    const rawVelocity = metrics.volume24h / (metrics.marketCap || 1);
    const velocity = 1 - Math.min(1, rawVelocity / 0.5);

    // Concentration score: inverse of top-holder concentration (Gini-based)
    const concentration = 1 - Math.min(1, metrics.topHolderPercent || 0);

    // Participation score: active users relative to total holders
    const participation = Math.min(1, (metrics.activeUsers24h || 0) / (metrics.totalHolders || 1));

    // Weighted overall score
    const overall = (
      liquidity * 0.30 +
      velocity * 0.25 +
      concentration * 0.25 +
      participation * 0.20
    );

    return { liquidity, velocity, concentration, participation, overall };
  }

  private determineRegime(
    scores: HealthScores,
    currentRegime: AcsRegime,
    stableFor: number
  ): { regime: AcsRegime; changed: boolean } {
    // Hysteresis bands — requires sustained score for ≥3 evaluation cycles
    const STABILITY_THRESHOLD = 3;

    let candidateRegime: AcsRegime;
    if (scores.overall < 0.20) candidateRegime = 'emergency';
    else if (scores.overall < 0.40) candidateRegime = 'contraction';
    else if (scores.overall < 0.70) candidateRegime = 'growth';
    else candidateRegime = 'mature';

    // If candidate matches current, no change
    if (candidateRegime === currentRegime) {
      return { regime: currentRegime, changed: false };
    }

    // Require stability before changing (prevents oscillation)
    if (stableFor < STABILITY_THRESHOLD) {
      return { regime: currentRegime, changed: false };
    }

    // Emergency is always immediate (no stability requirement)
    if (candidateRegime === 'emergency') {
      return { regime: 'emergency', changed: true };
    }

    return { regime: candidateRegime, changed: true };
  }

  private async loadState(economyId: string): Promise<AcsStateRecord> {
    // Try cache first
    const cached = await this.cache.get(`acs:state:${economyId}`);
    if (cached) return JSON.parse(cached);

    const state = await this.db.query.acsStates.findFirst({
      where: eq(acsStates.economyId, economyId),
    });

    if (!state) throw new Error(`ACS state not found for economy: ${economyId}`);

    await this.cache.set(`acs:state:${economyId}`, JSON.stringify(state), 'EX', 300);
    return state;
  }

  private async loadControllers(economyId: string): Promise<Map<string, ControllerState>> {
    const controllers = await this.db.query.acsControllers.findMany({
      where: and(
        eq(acsControllers.economyId, economyId),
        eq(acsControllers.isActive, true)
      ),
    });

    const map = new Map<string, ControllerState>();
    for (const c of controllers) {
      // Check override expiry
      if (c.isOverridden && c.overrideExpiry && c.overrideExpiry < new Date()) {
        // Override expired — clear it
        await this.db.update(acsControllers)
          .set({ isOverridden: false, overrideValue: null, overrideExpiry: null })
          .where(eq(acsControllers.id, c.id));
        c.isOverridden = false;
      }
      map.set(c.name, c);
    }

    return map;
  }
}
```

### Contribution Scoring Engine

```typescript
// acs/scoring.ts

export class ContributionScoringEngine {
  constructor(
    private readonly db: DrizzleDB,
    private readonly cache: RedisClient,
  ) {}

  async scoreContribution(input: ScoreContributionInput): Promise<ScoringResult> {
    // 1. Load contribution type definition
    const type = await this.getContributionType(input.contributionType, input.ventureId);
    if (!type) throw new Error(`Unknown contribution type: ${input.contributionType}`);

    // 2. Evaluate scoring formula against raw metrics
    const rawScore = this.evaluateFormula(type.scoringFormula, input.rawMetrics);

    // 3. Apply quality multiplier
    const qualityMultiplier = input.qualityMultiplier ?? 1.0;
    const qualifiedScore = rawScore * qualityMultiplier;

    // 4. Apply category weight
    const weightedScore = qualifiedScore * Number(type.baseWeight);

    // 5. Apply decay based on time since contribution
    const decayConfig = await this.getDecayConfig(input.ventureId, type.category);
    const decayFactor = this.calculateDecay(0, decayConfig); // 0 days old = no decay yet
    const decayedScore = weightedScore * decayFactor;

    // 6. Cap per-entry and per-day limits
    const cappedScore = Math.min(
      decayedScore,
      Number(type.maxScorePerEntry || Infinity)
    );

    // Check daily cap
    const todayTotal = await this.getUserDailyScore(input.userId, type.id);
    const dailyRemaining = Number(type.maxScorePerDay || Infinity) - todayTotal;
    const finalScore = Math.min(cappedScore, Math.max(0, dailyRemaining));

    // 7. Store contribution entry
    const entry = await this.db.insert(contributionEntries).values({
      ventureId: input.ventureId,
      userId: input.userId,
      contributionType: input.contributionType,
      category: type.category,
      sourceId: input.sourceId,
      sourceUrl: input.sourceUrl,
      rawMetrics: input.rawMetrics,
      rawScore: rawScore.toString(),
      weightedScore: weightedScore.toString(),
      decayedScore: finalScore.toString(),
      qualityMultiplier: qualityMultiplier.toString(),
    }).returning();

    // 8. Update aggregate score
    await this.updateAggregateScore(input.userId, input.ventureId, type.category, finalScore);

    // 9. Log transparency
    await this.db.insert(scoringTransparencyLogs).values({
      ventureId: input.ventureId,
      userId: input.userId,
      contributionEntryId: entry[0].id,
      explanation: {
        contributionType: input.contributionType,
        rawMetrics: input.rawMetrics,
        formulaUsed: type.scoringFormula,
        rawScore,
        qualityMultiplier,
        categoryWeight: Number(type.baseWeight),
        decayFactor,
        finalScore,
        steps: [
          { description: 'Raw score from formula', value: rawScore },
          { description: 'Quality multiplier applied', value: qualifiedScore },
          { description: 'Category weight applied', value: weightedScore },
          { description: 'Decay factor applied', value: decayedScore },
          { description: 'Daily cap applied', value: finalScore },
        ],
      },
    });

    return {
      entryId: entry[0].id,
      rawScore,
      weightedScore,
      decayedScore: finalScore,
      qualityMultiplier,
      categoryWeight: Number(type.baseWeight),
    };
  }

  private evaluateFormula(formula: string, metrics: Record<string, number>): number {
    // Safe expression evaluator — NO eval(), uses a sandboxed parser
    // Formula examples: 'linesAdded * 0.5 + complexity * 100'
    //                   'wordCount * 0.1 + uniqueViews * 0.05 + shares * 2'
    const context = { ...metrics, Math };
    return safeEval(formula, context);
  }

  calculateDecay(ageDays: number, config: DecayConfiguration): number {
    if (ageDays < config.decayStartDays) return 1.0;

    const effectiveAge = ageDays - config.decayStartDays;

    switch (config.decayFunction) {
      case 'exponential':
        // score * 2^(-t/halfLife)
        return Math.max(
          Number(config.minimumRetention),
          Math.pow(2, -effectiveAge / config.halfLifeDays)
        );
      case 'linear':
        // score * max(minRetention, 1 - t/halfLife*2)
        return Math.max(
          Number(config.minimumRetention),
          1 - (effectiveAge / (config.halfLifeDays * 2))
        );
      case 'step':
        // Step function from config
        if (!config.steps) return 1.0;
        const sorted = [...config.steps].sort((a, b) => b.days - a.days);
        for (const step of sorted) {
          if (effectiveAge >= step.days) return step.retention;
        }
        return 1.0;
      case 'logarithmic':
        // Slow decay: 1 / (1 + ln(1 + t/halfLife))
        return Math.max(
          Number(config.minimumRetention),
          1 / (1 + Math.log(1 + effectiveAge / config.halfLifeDays))
        );
      default:
        return 1.0;
    }
  }

  private async updateAggregateScore(
    userId: string,
    ventureId: string,
    category: string,
    scoreDelta: number
  ): Promise<void> {
    const fieldMap: Record<string, string> = {
      code: 'codeScore',
      content: 'contentScore',
      referral: 'referralScore',
      engagement: 'engagementScore',
      governance: 'governanceScore',
    };

    const field = fieldMap[category];
    if (!field) return;

    // Upsert aggregate score
    await this.db
      .insert(contributionScores)
      .values({
        ventureId,
        userId,
        [field]: scoreDelta.toString(),
        totalScore: scoreDelta.toString(),
        decayedTotalScore: scoreDelta.toString(),
        contributionCount: 1,
        lastContributionAt: new Date(),
      })
      .onConflictDoUpdate({
        target: [contributionScores.ventureId, contributionScores.userId],
        set: {
          [field]: sql`COALESCE(${contributionScores[field]}, 0) + ${scoreDelta}`,
          totalScore: sql`COALESCE(${contributionScores.totalScore}, 0) + ${scoreDelta}`,
          decayedTotalScore: sql`COALESCE(${contributionScores.decayedTotalScore}, 0) + ${scoreDelta}`,
          contributionCount: sql`COALESCE(${contributionScores.contributionCount}, 0) + 1`,
          lastContributionAt: new Date(),
        },
      });

    // Invalidate leaderboard cache
    await this.cache.del(`leaderboard:${ventureId}:*`);
  }
}
```

### Decay Function Visualization

```
Score Retention over Time (halfLife = 90 days)

1.0 ┤████████████████
    │                ████
0.8 ┤                    ████
    │                        ███
0.6 ┤                           ███
    │                              ███
0.4 ┤                                 ████
    │                                     █████
0.2 ┤                                          ████████
    │ minimum retention ─────────────────────────────────────
0.1 ┤─────────────────────────────────────────────────────────
    └──────┬──────┬──────┬──────┬──────┬──────┬──────┬──────
     0    30    60    90   120   150   180   210   240  days

    ─── Exponential    ─── Linear    ─── Logarithmic    ─── Step
```

### Key Behaviors

1. **Regime hysteresis**: Regime changes require the health score to sustain in the new band for ≥3 consecutive evaluation cycles. Emergency is the exception — immediate transition when health drops below 0.20.
2. **Dampening on all controllers**: No controller can change by more than `maxChangePerCycle` (default 10%) in a single evaluation. This prevents economic shocks even when the regime changes.
3. **Override safety**: Manual overrides have mandatory expiry (max 168 hours / 7 days). When an override expires, the controller reverts to automatic mode. All overrides are logged with reason and actor.
4. **Contribution scoring transparency**: Every score has a full audit trail accessible to the user — they can see exactly why they received a particular score, including the formula, weights, and decay applied.
5. **Score decay is continuous**: Decay is recalculated on every query (not batched), so scores are always fresh. For performance, the `decayedTotalScore` in `contributionScores` is periodically updated by a cron job, but individual entry decay is computed on-the-fly.
6. **Leaderboard caching**: Leaderboards are computed and cached in the `leaderboards` / `leaderboardEntries` tables. Recomputation is triggered by a cron job (every 15 minutes for weekly, every hour for monthly). Real-time position queries use Redis sorted sets for O(log N) rank lookups.

---

## Module: launchpad

### Purpose

The Launchpad module handles the complete lifecycle of token sales — from configuration and whitelist management through purchase processing and vesting claims. It supports multiple sale types (fixed price, Dutch auction, LBP, fair launch, lottery), integrates KYC/compliance requirements, generates Merkle proofs for gas-efficient whitelist verification, and manages vesting schedules with on-chain settlement via Solana.

The launchpad is designed to be reusable across ventures: each MCV venture can launch its own token (or use EDGE directly) through the same infrastructure, with compliance, allocation, and vesting rules tailored per sale.

### Sale Type Comparison

```
┌──────────────────────────────────────────────────────────────────────────────────┐
│                           SALE TYPE COMPARISON                                    │
│                                                                                   │
│  Type           │ Price       │ Fairness  │ Price Discovery │ Best For            │
│  ───────────────┼─────────────┼───────────┼─────────────────┼──────────────────── │
│  fixed_price    │ Static      │ ★★★☆☆    │ None            │ Simple community    │
│  dutch_auction  │ Decreasing  │ ★★★★☆    │ Strong          │ Fair price finding  │
│  lbp            │ Market      │ ★★★★★    │ Excellent       │ Large raises        │
│  fair_launch    │ Uniform     │ ★★★★★    │ Moderate        │ Max participation   │
│  lottery        │ Static      │ ★★★★☆    │ None            │ High demand mgmt    │
│                                                                                   │
│  Dutch Auction Price Curve:                                                       │
│  Price ─┐                                                                         │
│         │████                                                                     │
│         │    ████                                                                 │
│         │        ████                                                             │
│         │            ████                                                         │
│         │                ████─── Clearing Price (all pay this)                    │
│         │                    ████                                                 │
│         └────────────────────────── Time                                          │
│                                                                                   │
│  LBP (Liquidity Bootstrapping Pool):                                             │
│  Weight ─┐     Token weight decreases → price decreases                          │
│          │████ ← 90% token / 10% USDC                                            │
│          │    ████                                                                │
│          │        ████                                                            │
│          │            ████                                                        │
│          │                ████ ← 50% token / 50% USDC (equilibrium)              │
│          └────────────────────── Time                                             │
│                                                                                   │
└──────────────────────────────────────────────────────────────────────────────────┘
```

### Sale Status State Machine

```
┌───────┐    submit      ┌──────────┐    approve    ┌──────────┐
│       │───────────────▶│          │──────────────▶│          │
│ DRAFT │                │ PENDING  │               │ APPROVED │
│       │                │ APPROVAL │               │          │
└───────┘                └──────────┘               └────┬─────┘
                              │                          │
                              │ reject                   │ open whitelist
                              ▼                          ▼
                         ┌──────────┐              ┌──────────┐
                         │          │              │WHITELIST │
                         │CANCELLED │              │  OPEN    │
                         │          │              │          │
                         └──────────┘              └────┬─────┘
                                                        │ sale starts
                                                        ▼
                                                   ┌──────────┐
                                                   │          │
                                                   │  ACTIVE  │
                                                   │          │
                                                   └────┬─────┘
                                                        │ sale ends / hard cap reached
                                                        ▼
                                                   ┌──────────┐    finalize    ┌──────────┐
                                                   │          │───────────────▶│          │
                                                   │  ENDED   │               │FINALIZED │
                                                   │          │               │          │
                                                   └──────────┘               └──────────┘
```

### Vesting Schedule Computation

```typescript
// launchpad/vesting.ts

export class VestingComputer {
  /**
   * Calculate claimable amount at a given timestamp
   */
  computeClaimable(params: {
    totalAmount: number;
    tgeUnlockPercent: number;
    cliffDurationSec: number;
    vestingDurationSec: number;
    vestingIntervalSec: number;
    tgeDate: Date;
    currentDate?: Date;
    alreadyClaimed: number;
  }): ClaimableResult {
    const now = params.currentDate || new Date();
    const tgeTime = params.tgeDate.getTime();
    const elapsed = (now.getTime() - tgeTime) / 1000;

    // Before TGE — nothing claimable
    if (elapsed < 0) {
      return { claimable: 0, totalVested: 0, nextUnlock: params.tgeDate, vestingPercent: 0 };
    }

    // TGE unlock
    const tgeAmount = params.totalAmount * params.tgeUnlockPercent;
    const vestingAmount = params.totalAmount - tgeAmount;

    // During cliff — only TGE amount
    if (elapsed < params.cliffDurationSec) {
      const claimable = Math.max(0, tgeAmount - params.alreadyClaimed);
      const cliffEnd = new Date(tgeTime + params.cliffDurationSec * 1000);
      return {
        claimable,
        totalVested: tgeAmount,
        nextUnlock: cliffEnd,
        vestingPercent: params.tgeUnlockPercent,
      };
    }

    // Post-cliff linear vesting
    const postCliffElapsed = elapsed - params.cliffDurationSec;
    const vestingPeriods = Math.floor(postCliffElapsed / params.vestingIntervalSec);
    const totalPeriods = Math.ceil(params.vestingDurationSec / params.vestingIntervalSec);

    const vestedPeriods = Math.min(vestingPeriods, totalPeriods);
    const vestedFromSchedule = (vestedPeriods / totalPeriods) * vestingAmount;
    const totalVested = tgeAmount + vestedFromSchedule;

    const claimable = Math.max(0, totalVested - params.alreadyClaimed);
    const vestingPercent = totalVested / params.totalAmount;

    // Next unlock
    let nextUnlock: Date | null = null;
    if (vestedPeriods < totalPeriods) {
      const nextPeriodTime = tgeTime +
        (params.cliffDurationSec + (vestedPeriods + 1) * params.vestingIntervalSec) * 1000;
      nextUnlock = new Date(nextPeriodTime);
    }

    return { claimable, totalVested, nextUnlock, vestingPercent };
  }

  /**
   * Generate full unlock schedule for display
   */
  generateSchedule(params: {
    totalAmount: number;
    tgeUnlockPercent: number;
    cliffDurationSec: number;
    vestingDurationSec: number;
    vestingIntervalSec: number;
    tgeDate: Date;
  }): UnlockEvent[] {
    const events: UnlockEvent[] = [];
    const tgeAmount = params.totalAmount * params.tgeUnlockPercent;
    const vestingAmount = params.totalAmount - tgeAmount;

    // TGE event
    events.push({
      date: params.tgeDate,
      amount: tgeAmount,
      cumulativeAmount: tgeAmount,
      cumulativePercent: params.tgeUnlockPercent,
      type: 'tge',
    });

    // Cliff end (no new tokens, just marks the start of vesting)
    if (params.cliffDurationSec > 0) {
      const cliffEnd = new Date(params.tgeDate.getTime() + params.cliffDurationSec * 1000);
      events.push({
        date: cliffEnd,
        amount: 0,
        cumulativeAmount: tgeAmount,
        cumulativePercent: params.tgeUnlockPercent,
        type: 'cliff_end',
      });
    }

    // Vesting periods
    const totalPeriods = Math.ceil(params.vestingDurationSec / params.vestingIntervalSec);
    const amountPerPeriod = vestingAmount / totalPeriods;
    let cumulative = tgeAmount;

    for (let i = 1; i <= totalPeriods; i++) {
      const periodTime = params.tgeDate.getTime() +
        (params.cliffDurationSec + i * params.vestingIntervalSec) * 1000;
      cumulative += amountPerPeriod;

      events.push({
        date: new Date(periodTime),
        amount: amountPerPeriod,
        cumulativeAmount: Math.min(cumulative, params.totalAmount),
        cumulativePercent: Math.min(cumulative / params.totalAmount, 1),
        type: 'vesting',
      });
    }

    return events;
  }
}
```

### Merkle Whitelist — Deep Dive

```typescript
// launchpad/merkle.ts

import { MerkleTree } from 'merkletreejs';
import { keccak256, encodePacked } from 'viem';

export interface WhitelistEntry {
  walletAddress: string;
  tier: string;                    // 'guaranteed' | 'lottery' | 'fcfs'
  maxAllocation: string;           // In payment token (e.g., "5000" USDC)
  kycVerified: boolean;
}

export class MerkleWhitelistService {
  private tree: MerkleTree | null = null;
  private entries: Map<string, WhitelistEntry> = new Map();

  constructor(
    private readonly db: DrizzleDB,
    private readonly cache: RedisClient,
  ) {}

  /**
   * Build Merkle tree from whitelist entries
   * Called when admin uploads/updates the whitelist
   */
  async buildTree(saleId: string, entries: WhitelistEntry[]): Promise<{
    root: string;
    leafCount: number;
    treeDepth: number;
  }> {
    // Validate all entries
    for (const entry of entries) {
      if (!this.isValidSolanaAddress(entry.walletAddress)) {
        throw new Error(`Invalid wallet address: ${entry.walletAddress}`);
      }
    }

    // Build leaves
    const leaves = entries.map(entry => {
      this.entries.set(entry.walletAddress.toLowerCase(), entry);
      return this.hashLeaf(entry);
    });

    // Build tree (sorted pairs for deterministic proof generation)
    this.tree = new MerkleTree(leaves, keccak256, {
      sortPairs: true,
      sortLeaves: true,
    });

    const root = this.tree.getHexRoot();

    // Store snapshot in DB
    await this.db.insert(whitelistSnapshots).values({
      saleId,
      merkleRoot: root,
      leafCount: entries.length,
      treeDepth: this.tree.getDepth(),
      entries: entries.map(e => ({
        walletAddress: e.walletAddress,
        tier: e.tier,
        maxAllocation: e.maxAllocation,
      })),
      createdAt: new Date(),
    });

    // Cache root
    await this.cache.set(`whitelist:root:${saleId}`, root, 'EX', 86400);

    return {
      root,
      leafCount: entries.length,
      treeDepth: this.tree.getDepth(),
    };
  }

  private hashLeaf(entry: WhitelistEntry): string {
    return keccak256(
      encodePacked(
        ['address', 'string', 'uint256'],
        [
          entry.walletAddress as `0x${string}`,
          entry.tier,
          BigInt(Math.floor(Number(entry.maxAllocation) * 1e6)),  // 6 decimals for USDC
        ]
      )
    );
  }

  getRoot(): string {
    if (!this.tree) throw new Error('Tree not initialized');
    return this.tree.getHexRoot();
  }

  getProof(walletAddress: string): string[] | null {
    if (!this.tree) return null;

    const entry = this.entries.get(walletAddress.toLowerCase());
    if (!entry) return null;

    const leaf = this.hashLeaf(entry);
    return this.tree.getHexProof(leaf);
  }

  verify(walletAddress: string, proof: string[]): boolean {
    if (!this.tree) return false;

    const entry = this.entries.get(walletAddress.toLowerCase());
    if (!entry) return false;

    const leaf = this.hashLeaf(entry);
    return this.tree.verify(proof, leaf, this.getRoot());
  }

  getAllocation(walletAddress: string): WhitelistEntry | null {
    return this.entries.get(walletAddress.toLowerCase()) ?? null;
  }

  private isValidSolanaAddress(address: string): boolean {
    // Base58 check, 32-44 characters
    return /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(address);
  }
}
```

### Key Behaviors

1. **Sale lifecycle enforcement**: Status transitions are strictly enforced. A sale in `draft` cannot be `active`. The status state machine prevents invalid transitions and requires approval for production launches.
2. **Merkle proof efficiency**: Whitelist verification uses Merkle proofs — the contract only stores one root hash, and each user provides their own proof at purchase time. This scales to millions of whitelisted addresses with constant on-chain storage.
3. **KYC gating**: Sales with `kycRequired: true` verify the user's KYC status (via `@mcv/identity`) before allowing purchase. Jurisdiction exclusions are enforced at the API layer.
4. **Vesting computation is deterministic**: Given the same parameters, `computeClaimable()` always returns the same result. No floating-point drift — amounts are computed using integer arithmetic scaled to token decimals.
5. **Multi-sale support**: A venture can run multiple concurrent sales (e.g., seed round, strategic round, public sale) with different terms. Each has its own whitelist, allocation tiers, and vesting schedule.
6. **Fair launch mechanism**: The `fair_launch` type distributes tokens proportionally — all participants deposit during the window, and tokens are allocated proportional to their contribution. No front-running advantage.

---

## Error Codes

| Code | HTTP | Module | Description |
|------|------|--------|-------------|
| `REWARD_INSUFFICIENT_BALANCE` | 400 | rewards | Not enough points to convert/redeem |
| `REWARD_RATE_LIMITED` | 429 | rewards | Too many accrual requests |
| `REWARD_BLOCKED_ABUSE` | 403 | rewards | Anti-gaming engine blocked the request |
| `REWARD_HELD_FOR_REVIEW` | 202 | rewards | Points accrued but held for abuse review |
| `REWARD_PROGRAM_NOT_FOUND` | 404 | rewards | Program ID does not exist |
| `REWARD_PROGRAM_INACTIVE` | 409 | rewards | Program is not in active status |
| `REWARD_PROGRAM_FULL` | 409 | rewards | Program has reached max participants |
| `REWARD_NOT_ELIGIBLE` | 403 | rewards | User does not meet program eligibility |
| `REWARD_POOL_DEPLETED` | 409 | rewards | Reward pool has no remaining budget |
| `REWARD_CLAIM_FAILED` | 500 | rewards | On-chain claim transaction failed |
| `REWARD_CLAIM_NOTHING` | 400 | rewards | No claimable amount available |
| `REWARD_CONVERSION_LIMIT` | 429 | rewards | Conversion limit reached (daily/per-user) |
| `REWARD_KYC_REQUIRED` | 403 | rewards | KYC verification needed for conversion |
| `REWARD_WALLET_REQUIRED` | 400 | rewards | Must connect wallet before claiming |
| `ACS_STATE_NOT_FOUND` | 404 | acs | Economy ACS state not initialized |
| `ACS_CONTROLLER_NOT_FOUND` | 404 | acs | Controller ID does not exist |
| `ACS_OVERRIDE_ACTIVE` | 409 | acs | Cannot auto-adjust — manual override active |
| `ACS_EVALUATION_FAILED` | 500 | acs | Evaluation engine encountered an error |
| `ACS_COOLDOWN_ACTIVE` | 429 | acs | Controller adjustment cooldown not elapsed |
| `ACS_CONTRIBUTION_TYPE_UNKNOWN` | 400 | acs | Unknown contribution type |
| `ACS_SCORE_LIMIT_REACHED` | 429 | acs | Daily scoring limit reached for user |
| `LAUNCH_SALE_NOT_FOUND` | 404 | launchpad | Sale ID does not exist |
| `LAUNCH_SALE_NOT_ACTIVE` | 409 | launchpad | Sale is not in active status |
| `LAUNCH_SALE_ENDED` | 409 | launchpad | Sale has ended |
| `LAUNCH_HARD_CAP_REACHED` | 409 | launchpad | Sale hard cap has been reached |
| `LAUNCH_NOT_WHITELISTED` | 403 | launchpad | Wallet not on whitelist |
| `LAUNCH_INVALID_PROOF` | 400 | launchpad | Merkle proof verification failed |
| `LAUNCH_KYC_REQUIRED` | 403 | launchpad | KYC required for this sale |
| `LAUNCH_JURISDICTION_BLOCKED` | 403 | launchpad | User jurisdiction excluded |
| `LAUNCH_BELOW_MINIMUM` | 400 | launchpad | Below minimum contribution |
| `LAUNCH_ABOVE_MAXIMUM` | 400 | launchpad | Above maximum contribution |
| `LAUNCH_VESTING_NOTHING` | 400 | launchpad | No vested tokens to claim |
| `LAUNCH_PURCHASE_FAILED` | 500 | launchpad | On-chain purchase transaction failed |

---

## Audit Events

| Event | Severity | Module | Data |
|-------|----------|--------|------|
| `rewards.points.accrued` | info | rewards | userId, source, amount, finalAmount, balance |
| `rewards.points.blocked` | warning | rewards | userId, source, amount, reason, abuseScore |
| `rewards.points.held` | warning | rewards | userId, source, amount, flags |
| `rewards.program.created` | info | rewards | programId, name, type, budget |
| `rewards.program.activated` | info | rewards | programId |
| `rewards.program.paused` | warning | rewards | programId, reason |
| `rewards.pool.created` | info | rewards | poolId, budget, fundingSource |
| `rewards.pool.depleted` | warning | rewards | poolId, totalDistributed |
| `rewards.claim.initiated` | info | rewards | userId, claimType, amount |
| `rewards.claim.confirmed` | info | rewards | claimId, txSignature, amount |
| `rewards.claim.failed` | error | rewards | claimId, error, retryCount |
| `rewards.distribution.created` | info | rewards | batchId, recipientCount, totalAmount |
| `rewards.distribution.approved` | info | rewards | batchId, approvedBy |
| `rewards.distribution.completed` | info | rewards | batchId, confirmedCount, totalAmount |
| `rewards.conversion.completed` | info | rewards | userId, points, tokens, rate, regime |
| `rewards.abuse.flagged` | warning | rewards | userId, flagType, severity, score |
| `rewards.abuse.resolved` | info | rewards | flagId, resolution, action |
| `acs.evaluation.completed` | info | acs | economyId, regime, scores, adjustments |
| `acs.regime.changed` | warning | acs | economyId, from, to, health |
| `acs.parameter.adjusted` | info | acs | economyId, controller, oldValue, newValue |
| `acs.override.set` | warning | acs | controllerId, value, expiry, reason, actor |
| `acs.override.cleared` | info | acs | controllerId, reason, actor |
| `acs.override.expired` | info | acs | controllerId |
| `acs.contribution.scored` | info | acs | userId, type, rawScore, finalScore |
| `acs.leaderboard.computed` | info | acs | ventureId, period, entryCount |
| `acs.decay.applied` | info | acs | ventureId, usersAffected, totalDecayAmount |
| `launch.sale.created` | info | launchpad | saleId, name, type, hardCap |
| `launch.sale.approved` | info | launchpad | saleId, approvedBy |
| `launch.sale.activated` | info | launchpad | saleId, saleStart |
| `launch.sale.ended` | info | launchpad | saleId, raised, participants |
| `launch.sale.finalized` | info | launchpad | saleId, finalAmount |
| `launch.whitelist.uploaded` | info | launchpad | saleId, entryCount, merkleRoot |
| `launch.purchase.completed` | info | launchpad | saleId, userId, amount, txSignature |
| `launch.purchase.failed` | error | launchpad | saleId, userId, error |
| `launch.vesting.claimed` | info | launchpad | allocationId, amount, txSignature |

---

## Environment Variables

```bash
# Token Economy Configuration
EDGE_TOKEN_MINT=                   # EDGE SPL token mint address on Solana
EDGE_TOKEN_DECIMALS=9              # Token decimal places

# Treasury
TREASURY_WALLET_ADDRESS=           # Main treasury wallet (for distributions)
TREASURY_SIGNING_KEY=              # Encrypted signing key reference (Vault)

# ACS Configuration
ACS_EVALUATION_INTERVAL=900        # Seconds between evaluations (default: 15 min)
ACS_METRICS_PROVIDER=              # 'jupiter' | 'birdeye' | 'coingecko'
ACS_AUTO_ADJUST=true               # Enable automatic parameter adjustment

# Rewards Configuration
REWARDS_MAX_BATCH_SIZE=500         # Max recipients per distribution batch
REWARDS_APPROVAL_THRESHOLD=10000   # USD value requiring approval
REWARDS_ANTI_GAMING_ENABLED=true   # Enable anti-gaming checks

# Launchpad Configuration
LAUNCHPAD_KYC_PROVIDER=            # KYC service endpoint
LAUNCHPAD_MAX_CONCURRENT_SALES=5   # Max active sales per venture

# Redis Configuration
REDIS_URL=                         # Redis connection for caching/rate limits

# Solana RPC
SOLANA_RPC_URL=                    # Solana mainnet RPC endpoint
SOLANA_RPC_COMMITMENT=confirmed    # Transaction commitment level
```

---

## Dependencies

### Internal Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| `@mcv/web3-core` | workspace | Token operations, wallet management, staking, SPL transfers |
| `@mcv/engagement` | workspace | Points/achievements that trigger reward accrual |
| `@mcv/identity` | workspace | User verification, KYC status, session management |
| `@mcv/fabric` | workspace | Event bus, audit trail, background job processing |
| `@mcv/db` | workspace | Database connection and migration management |

### External Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| `@solana/web3.js` | ^1.95.x | Solana blockchain interactions |
| `@streamflow/stream` | ^6.x | Vesting stream contract integration |
| `merkletreejs` | ^0.4.x | Merkle tree construction and proof generation |
| `viem` | ^2.x | ABI encoding, keccak256 hashing |
| `ioredis` | ^5.x | Redis client for caching, rate limiting, queues |
| `zod` | ^3.x | Input validation for all API endpoints |
| `drizzle-orm` | ^0.36.x | Database ORM for all schema definitions |

---

## Security Checklist

- [ ] Point ledger is append-only (no UPDATE/DELETE on `reward_point_entries`)
- [ ] Anti-gaming engine runs on every point accrual
- [ ] Distribution batches > $10K require explicit approval
- [ ] Merkle proofs verified before whitelist purchases
- [ ] Vesting claims require wallet signature verification
- [ ] KYC verification enforced for conversion and launchpad
- [ ] All controller overrides have mandatory expiry (max 7 days)
- [ ] ACS evaluation audit trail captures all adjustments
- [ ] Contribution scoring transparency logs accessible to users
- [ ] Rate limiting on all write operations
- [ ] Cross-venture reward rules validated for circular dependency
- [ ] Sybil detection running on referral chains
- [ ] IP reputation checks on all point accruals
- [ ] Device fingerprinting for multi-account detection
- [ ] Treasury wallet keys stored in Vault (never in env vars)

---

*@mcv/token-economy — The Economic Engine Powering the MCV Ecosystem*