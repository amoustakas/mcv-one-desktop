# @mcv/web3-core/staking

> **Tier 5 Domain Module — MCV-Only**
> EDGE token staking system: pools, delegation, yield, liquid staking, rewards, and governance weight.

---

## Purpose

The `@mcv/web3-core/staking` module provides the complete staking infrastructure for the EDGE token economy on Solana. Staking is the primary mechanism through which EDGE holders participate in network security, earn yield on their holdings, and gain governance influence within the MCV ecosystem. This module manages every aspect of the staking lifecycle — from pool creation and token lockup through reward accrual, distribution, and eventual unstaking with configurable cooldown periods.

Staking pools are fully configurable with distinct APY curves, lockup durations, capacity caps, and tier-based benefits. The system supports both direct staking (locking EDGE tokens in on-chain pools managed by Anchor programs) and validator delegation (delegating SOL or EDGE to network validators and tracking delegation rewards). A liquid staking derivative (stEDGE) allows stakers to maintain liquidity while their tokens remain locked, enabling participation in DeFi without sacrificing staking yield.

Beyond yield generation, staking is deeply integrated with the governance system. Staked EDGE tokens contribute voting power proportional to both the amount staked and the lockup duration, creating strong incentives for long-term commitment. The module also enforces slashing conditions for validator misbehavior, manages an insurance fund to protect delegators, and provides comprehensive analytics for TVL tracking, APY history, staker demographics, and pool utilization. All on-chain state is mirrored to Supabase PostgreSQL for fast off-chain querying via tRPC endpoints.

---

## Exports

```typescript
// @mcv/web3-core/staking — public API

// ── Core Services ──────────────────────────────────────────────────
export { StakingService }              from './services/staking.service';
export { StakePoolService }            from './services/stake-pool.service';
export { ValidatorDelegationService }  from './services/validator-delegation.service';
export { YieldCalculationService }     from './services/yield-calculation.service';
export { RewardsDistributionService }  from './services/rewards-distribution.service';
export { CooldownService }             from './services/cooldown.service';
export { LiquidStakingService }        from './services/liquid-staking.service';
export { StakingTierService }          from './services/staking-tier.service';
export { SlashingService }             from './services/slashing.service';
export { StakingAnalyticsService }     from './services/staking-analytics.service';
export { GovernanceWeightService }     from './services/governance-weight.service';

// ── Types & Interfaces ─────────────────────────────────────────────
export type {
  StakePool,
  StakePoolConfig,
  StakePoolStatus,
  StakePosition,
  StakePositionStatus,
  StakeRequest,
  UnstakeRequest,
  RewardDistribution,
  RewardClaim,
  RewardSchedule,
  CooldownPeriod,
  CooldownConfig,
  LiquidStakeToken,
  LiquidStakeExchangeRate,
  StakingTier,
  TierBenefits,
  TierThresholds,
  SlashingEvent,
  SlashingCondition,
  InsuranceFund,
  ValidatorInfo,
  DelegationRecord,
  DelegationReward,
  YieldSnapshot,
  APYCurve,
  CompoundingOption,
  StakingAnalytics,
  TVLSnapshot,
  StakerDemographics,
  PoolUtilization,
  GovernanceWeight,
  VotingPowerBreakdown,
} from './types';

// ── Schemas (Drizzle ORM) ──────────────────────────────────────────
export {
  stakePools,
  stakePositions,
  rewardDistributions,
  cooldownRecords,
  stakingTiers,
  stakingAnalytics,
  validatorDelegations,
  slashingEvents,
  liquidStakeTokens,
  insuranceFundLedger,
} from './schemas';

// ── tRPC Router ────────────────────────────────────────────────────
export { stakingRouter }               from './router';

// ── Constants ──────────────────────────────────────────────────────
export {
  STAKING_PROGRAM_ID,
  LIQUID_STAKING_MINT,
  DEFAULT_COOLDOWN_SECONDS,
  MIN_STAKE_AMOUNT,
  MAX_POOL_CAP,
  TIER_THRESHOLDS,
  SLASHING_RATE_BPS,
  INSURANCE_FUND_ADDRESS,
  REWARD_DISTRIBUTION_INTERVAL_MS,
  STAKING_ERROR_CODES,
} from './constants';

// ── Anchor IDL ─────────────────────────────────────────────────────
export { StakingIDL }                  from './idl/staking';
export { LiquidStakingIDL }           from './idl/liquid-staking';

// ── Utilities ──────────────────────────────────────────────────────
export { calculateAPY }               from './utils/yield';
export { calculateGovernanceWeight }  from './utils/governance';
export { calculateSlashAmount }       from './utils/slashing';
export { computeExchangeRate }        from './utils/liquid-staking';
export { validateStakeAmount }        from './utils/validation';
export { formatStakingDuration }      from './utils/format';
```

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                           STAKING ARCHITECTURE                                  │
│                                                                                 │
│  ┌──────────┐     ┌────────────────┐     ┌─────────────────┐                   │
│  │   User   │────▶│  tRPC Router   │────▶│ StakingService  │                   │
│  │ (Wallet) │     │  /staking.*    │     │  (Orchestrator) │                   │
│  └──────────┘     └────────────────┘     └────────┬────────┘                   │
│       │                                           │                             │
│       │  Signs TX                                 ├──────────────────┐          │
│       ▼                                           ▼                  ▼          │
│  ┌──────────────┐                    ┌──────────────────┐  ┌────────────────┐  │
│  │  Solana TX   │◀───────────────────│  StakePoolSvc    │  │ ValidatorDel.  │  │
│  │  (Anchor)    │                    │  (Pool Mgmt)     │  │ Service        │  │
│  └──────┬───────┘                    └────────┬─────────┘  └───────┬────────┘  │
│         │                                     │                     │           │
│         │  On-chain                           │                     │           │
│         ▼                                     ▼                     ▼           │
│  ┌──────────────────────────────────────────────────────────────────────────┐   │
│  │                     SOLANA BLOCKCHAIN (Anchor Programs)                  │   │
│  │                                                                          │   │
│  │  ┌──────────────┐  ┌───────────────┐  ┌──────────────┐  ┌───────────┐  │   │
│  │  │ Staking Pool │  │ Stake Account │  │ Reward Vault │  │ stEDGE    │  │   │
│  │  │ PDA          │  │ PDA           │  │ PDA          │  │ Mint PDA  │  │   │
│  │  └──────────────┘  └───────────────┘  └──────────────┘  └───────────┘  │   │
│  └──────────────────────────────────────────────────────────────────────────┘   │
│         │                                                                       │
│         │  Events / Webhooks                                                    │
│         ▼                                                                       │
│  ┌──────────────────┐     ┌──────────────────┐     ┌───────────────────────┐   │
│  │  Event Listener  │────▶│  Sync Service    │────▶│  Supabase PostgreSQL  │   │
│  │  (Helius/Geyser) │     │  (Off-chain)     │     │  (Off-chain Mirror)   │   │
│  └──────────────────┘     └──────────────────┘     └───────────┬───────────┘   │
│                                                                 │               │
│         ┌──────────────────────┬──────────────────┬────────────┘               │
│         ▼                      ▼                  ▼                             │
│  ┌──────────────┐  ┌──────────────────┐  ┌────────────────┐                   │
│  │ Yield Calc   │  │ Rewards Distrib. │  │ Analytics Svc  │                   │
│  │ Service      │  │ Service          │  │                │                   │
│  └──────┬───────┘  └────────┬─────────┘  └────────┬───────┘                   │
│         │                   │                      │                            │
│         ▼                   ▼                      ▼                            │
│  ┌──────────────┐  ┌──────────────────┐  ┌────────────────┐                   │
│  │ APY Curves   │  │ Claim Workflow   │  │ TVL / APY      │                   │
│  │ Compounding  │  │ Auto-distribute  │  │ Demographics   │                   │
│  └──────────────┘  └──────────────────┘  └────────────────┘                   │
│                                                                                 │
│  ┌──────────────────────────────────────────────────────────────────────────┐   │
│  │                        CROSS-MODULE INTEGRATION                          │   │
│  │                                                                          │   │
│  │  @mcv/web3-core/tokens ◀──▶ EDGE operations (transfer, balance)         │   │
│  │  @mcv/web3-core/governance ◀──▶ Voting power from stake                 │   │
│  │  @mcv/web3-core/treasury ◀──▶ Reward funding, insurance fund            │   │
│  └──────────────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### Staking Flow (User Perspective)

```
  User                    Frontend              StakingService             Solana
   │                         │                        │                      │
   │  1. Select pool         │                        │                      │
   │────────────────────────▶│                        │                      │
   │                         │  2. staking.stake()    │                      │
   │                         │───────────────────────▶│                      │
   │                         │                        │  3. Build TX         │
   │                         │                        │─────────────────────▶│
   │  4. Sign TX             │                        │                      │
   │◀────────────────────────│◀───────────────────────│                      │
   │─────────────────────────│───────────────────────▶│                      │
   │                         │                        │  5. Submit TX        │
   │                         │                        │─────────────────────▶│
   │                         │                        │                      │
   │                         │                        │  6. Confirmed        │
   │                         │                        │◀─────────────────────│
   │                         │                        │                      │
   │                         │  7. Position created   │  7a. Sync to DB      │
   │                         │◀───────────────────────│─────────────────────▶│
   │  8. Show staking dash   │                        │                      │
   │◀────────────────────────│                        │                      │
   │                         │                        │                      │
   │         ... time passes, rewards accrue ...      │                      │
   │                         │                        │                      │
   │  9. Claim rewards       │                        │                      │
   │────────────────────────▶│  10. rewards.claim()   │                      │
   │                         │───────────────────────▶│  11. Transfer        │
   │                         │                        │─────────────────────▶│
   │  12. Rewards received   │                        │                      │
   │◀────────────────────────│◀───────────────────────│◀─────────────────────│
   │                         │                        │                      │
```

### Unstaking / Cooldown Flow

```
  User                  StakingService          CooldownService           Solana
   │                         │                        │                      │
   │  1. Request unstake     │                        │                      │
   │────────────────────────▶│                        │                      │
   │                         │  2. Initiate cooldown  │                      │
   │                         │───────────────────────▶│                      │
   │                         │                        │  3. Lock position    │
   │                         │                        │─────────────────────▶│
   │                         │                        │                      │
   │  4. Cooldown started    │                        │  5. Set timer        │
   │◀────────────────────────│◀───────────────────────│                      │
   │                         │                        │                      │
   │     ... cooldown period (e.g., 7 days) ...       │                      │
   │                         │                        │                      │
   │  6. Cooldown complete   │                        │                      │
   │◀─ ─ ─ ─ ─ notification ─│◀───────────────────────│                      │
   │                         │                        │                      │
   │  7. Finalize unstake    │                        │                      │
   │────────────────────────▶│  8. Release tokens     │                      │
   │                         │───────────────────────▶│─────────────────────▶│
   │                         │                        │                      │
   │  9. Tokens returned     │                        │                      │
   │◀────────────────────────│                        │                      │
```

---

## Core Interfaces

### StakingService

The top-level orchestrator that coordinates all staking operations. It serves as the main entry point for the tRPC router and frontend clients.

```typescript
import { PublicKey, Transaction } from '@solana/web3.js';
import { BN } from '@coral-xyz/anchor';

/**
 * Primary staking service — orchestrates pool management, staking,
 * unstaking, rewards, and cross-module integration.
 */
interface StakingService {
  // ── Pool Management ──────────────────────────────────────────────
  
  /**
   * Create a new staking pool with the given configuration.
   * Deploys on-chain pool PDA and initializes off-chain tracking.
   */
  createPool(config: StakePoolConfig): Promise<StakePool>;
  
  /**
   * Retrieve a pool by its on-chain address or internal ID.
   */
  getPool(poolId: string): Promise<StakePool | null>;
  
  /**
   * List all active staking pools, optionally filtered.
   */
  listPools(filter?: StakePoolFilter): Promise<PaginatedResult<StakePool>>;
  
  /**
   * Update pool parameters (APY, cap, status). Requires pool authority.
   */
  updatePool(poolId: string, updates: Partial<StakePoolConfig>): Promise<StakePool>;
  
  /**
   * Pause a pool — prevents new stakes but allows unstaking.
   */
  pausePool(poolId: string, reason: string): Promise<void>;
  
  /**
   * Resume a paused pool.
   */
  resumePool(poolId: string): Promise<void>;

  // ── Staking Operations ───────────────────────────────────────────
  
  /**
   * Stake EDGE tokens into a pool. Returns an unsigned transaction
   * for the user to sign.
   */
  stake(request: StakeRequest): Promise<{
    transaction: Transaction;
    positionId: string;
    estimatedAPY: number;
  }>;
  
  /**
   * Initiate unstaking with cooldown. Returns the cooldown details.
   */
  unstake(request: UnstakeRequest): Promise<{
    transaction: Transaction;
    cooldown: CooldownPeriod;
  }>;
  
  /**
   * Finalize unstaking after cooldown period has elapsed.
   * Transfers tokens back to the user's wallet.
   */
  finalizeUnstake(positionId: string, wallet: PublicKey): Promise<Transaction>;
  
  /**
   * Emergency unstake — bypasses cooldown but incurs a penalty fee.
   */
  emergencyUnstake(positionId: string, wallet: PublicKey): Promise<{
    transaction: Transaction;
    penaltyAmount: BN;
    netReturn: BN;
  }>;
  
  /**
   * Retrieve all staking positions for a given wallet.
   */
  getPositions(wallet: PublicKey, filter?: PositionFilter): Promise<StakePosition[]>;
  
  /**
   * Get a single staking position by ID.
   */
  getPosition(positionId: string): Promise<StakePosition | null>;

  // ── Rewards ──────────────────────────────────────────────────────
  
  /**
   * Calculate pending (unclaimed) rewards for a position.
   */
  getPendingRewards(positionId: string): Promise<{
    amount: BN;
    breakdown: RewardBreakdown;
  }>;
  
  /**
   * Claim accumulated rewards for a staking position.
   */
  claimRewards(positionId: string, wallet: PublicKey): Promise<Transaction>;
  
  /**
   * Claim rewards for all positions owned by a wallet.
   */
  claimAllRewards(wallet: PublicKey): Promise<Transaction>;
  
  /**
   * Get reward history for a position or wallet.
   */
  getRewardHistory(
    query: { positionId?: string; wallet?: PublicKey },
    pagination?: PaginationParams
  ): Promise<PaginatedResult<RewardClaim>>;
  
  /**
   * Enable/disable auto-compounding for a position.
   */
  setAutoCompound(positionId: string, enabled: boolean): Promise<void>;

  // ── Liquid Staking ───────────────────────────────────────────────
  
  /**
   * Mint stEDGE tokens representing a staked position.
   */
  mintLiquidStakeToken(positionId: string, wallet: PublicKey): Promise<{
    transaction: Transaction;
    stEdgeAmount: BN;
    exchangeRate: number;
  }>;
  
  /**
   * Redeem stEDGE tokens back to EDGE (initiates unstaking).
   */
  redeemLiquidStakeToken(amount: BN, wallet: PublicKey): Promise<{
    transaction: Transaction;
    edgeAmount: BN;
    cooldown: CooldownPeriod;
  }>;
  
  /**
   * Get the current stEDGE → EDGE exchange rate.
   */
  getExchangeRate(): Promise<LiquidStakeExchangeRate>;

  // ── Governance ───────────────────────────────────────────────────
  
  /**
   * Calculate governance voting weight for a wallet based on staking.
   */
  getGovernanceWeight(wallet: PublicKey): Promise<GovernanceWeight>;

  // ── Analytics ────────────────────────────────────────────────────
  
  /**
   * Get current staking analytics snapshot.
   */
  getAnalytics(): Promise<StakingAnalytics>;
  
  /**
   * Get historical TVL data for charting.
   */
  getTVLHistory(range: TimeRange): Promise<TVLSnapshot[]>;
  
  /**
   * Get APY history for a specific pool.
   */
  getAPYHistory(poolId: string, range: TimeRange): Promise<YieldSnapshot[]>;
}
```

### StakePool

```typescript
/**
 * Represents a staking pool — an on-chain program account
 * with configurable yield parameters and capacity limits.
 */
interface StakePool {
  /** Internal database ID (UUID). */
  id: string;
  
  /** On-chain pool account address (PDA). */
  address: PublicKey;
  
  /** Human-readable pool name. */
  name: string;
  
  /** Pool description / marketing copy. */
  description: string;
  
  /** Current pool status. */
  status: StakePoolStatus;
  
  /** The SPL token mint accepted for staking (EDGE mint). */
  stakeMint: PublicKey;
  
  /** Pool authority — can update parameters. */
  authority: PublicKey;
  
  /** On-chain reward vault PDA. */
  rewardVault: PublicKey;
  
  /** APY configuration. */
  apy: APYCurve;
  
  /** Current effective APY (calculated). */
  currentAPY: number;
  
  /** Minimum lockup duration in seconds. 0 = flexible. */
  minLockupSeconds: number;
  
  /** Maximum lockup duration in seconds. 0 = unlimited. */
  maxLockupSeconds: number;
  
  /** Cooldown period in seconds before unstaked tokens are released. */
  cooldownSeconds: number;
  
  /** Maximum total staked amount (pool capacity). */
  maxCapacity: BN;
  
  /** Current total staked amount. */
  totalStaked: BN;
  
  /** Number of active staking positions. */
  activePositions: number;
  
  /** Total rewards distributed to date. */
  totalRewardsDistributed: BN;
  
  /** Remaining rewards in the vault. */
  remainingRewards: BN;
  
  /** Emergency unstake penalty in basis points (e.g., 500 = 5%). */
  emergencyUnstakePenaltyBps: number;
  
  /** Whether auto-compounding is supported. */
  supportsAutoCompound: boolean;
  
  /** Whether liquid staking (stEDGE) is supported. */
  supportsLiquidStaking: boolean;
  
  /** Pool creation timestamp. */
  createdAt: Date;
  
  /** Last update timestamp. */
  updatedAt: Date;
}

type StakePoolStatus = 'active' | 'paused' | 'deprecated' | 'full';

/**
 * Configuration for creating or updating a staking pool.
 */
interface StakePoolConfig {
  name: string;
  description: string;
  stakeMint: PublicKey;
  authority: PublicKey;
  apy: APYCurve;
  minLockupSeconds: number;
  maxLockupSeconds: number;
  cooldownSeconds: number;
  maxCapacity: BN;
  emergencyUnstakePenaltyBps: number;
  supportsAutoCompound: boolean;
  supportsLiquidStaking: boolean;
  initialRewardFunding: BN;
}

/**
 * APY curve definition — supports flat, tiered, and dynamic APY.
 */
interface APYCurve {
  /** Curve type. */
  type: 'flat' | 'tiered' | 'dynamic';
  
  /** Base APY in basis points (e.g., 800 = 8%). */
  baseAPYBps: number;
  
  /** For tiered: APY breakpoints based on total staked. */
  tiers?: Array<{
    /** Total staked threshold to activate this tier. */
    threshold: BN;
    /** APY in basis points at this tier. */
    apyBps: number;
  }>;
  
  /** For dynamic: parameters for supply-based APY calculation. */
  dynamic?: {
    /** Maximum APY in bps when utilization is low. */
    maxAPYBps: number;
    /** Minimum APY in bps when utilization is high. */
    minAPYBps: number;
    /** Target utilization ratio (0-1). */
    targetUtilization: number;
    /** Curve steepness factor. */
    steepness: number;
  };
  
  /** Bonus APY in bps for longer lockup periods (per 30 days). */
  lockupBonusBpsPerMonth: number;
}

/**
 * Filter options for listing pools.
 */
interface StakePoolFilter {
  status?: StakePoolStatus[];
  minAPY?: number;
  maxLockupSeconds?: number;
  hasCapacity?: boolean;
  supportsLiquidStaking?: boolean;
  sortBy?: 'apy' | 'totalStaked' | 'createdAt';
  sortOrder?: 'asc' | 'desc';
}
```

### StakePosition

```typescript
/**
 * Represents an individual staking position — a user's stake
 * in a specific pool with tracked rewards and status.
 */
interface StakePosition {
  /** Internal database ID (UUID). */
  id: string;
  
  /** On-chain stake account PDA. */
  address: PublicKey;
  
  /** The pool this position belongs to. */
  poolId: string;
  
  /** Pool on-chain address (for convenience). */
  poolAddress: PublicKey;
  
  /** Staker's wallet address. */
  wallet: PublicKey;
  
  /** Current position status. */
  status: StakePositionStatus;
  
  /** Amount of EDGE staked (in lamports/smallest unit). */
  stakedAmount: BN;
  
  /** Lockup end timestamp (null if flexible). */
  lockupEndsAt: Date | null;
  
  /** Total rewards earned (claimed + unclaimed). */
  totalRewardsEarned: BN;
  
  /** Rewards already claimed. */
  rewardsClaimed: BN;
  
  /** Pending unclaimed rewards. */
  pendingRewards: BN;
  
  /** Last reward calculation timestamp. */
  lastRewardCalculation: Date;
  
  /** Whether auto-compounding is enabled. */
  autoCompoundEnabled: boolean;
  
  /** If liquid staked, the stEDGE amount minted. */
  liquidStakeAmount: BN | null;
  
  /** Current staking tier based on amount. */
  tier: StakingTierLevel;
  
  /** Governance voting weight from this position. */
  governanceWeight: BN;
  
  /** If in cooldown, the cooldown details. */
  cooldown: CooldownPeriod | null;
  
  /** Effective APY at time of staking (snapshot). */
  entryAPY: number;
  
  /** Current effective APY (may differ from entry). */
  currentAPY: number;
  
  /** Position creation timestamp. */
  createdAt: Date;
  
  /** Last update timestamp. */
  updatedAt: Date;
}

type StakePositionStatus = 
  | 'active'           // Currently staked and earning rewards
  | 'locked'           // In lockup period, cannot unstake
  | 'cooldown'         // Unstaking initiated, in cooldown
  | 'ready_to_claim'   // Cooldown complete, tokens can be withdrawn
  | 'withdrawn'        // Fully unstaked and withdrawn
  | 'slashed'          // Position was slashed (partial or full)
  | 'liquid_staked';   // Converted to stEDGE

/**
 * Request to stake EDGE tokens.
 */
interface StakeRequest {
  /** Wallet initiating the stake. */
  wallet: PublicKey;
  
  /** Target pool ID or address. */
  poolId: string;
  
  /** Amount of EDGE to stake (in smallest unit). */
  amount: BN;
  
  /** Desired lockup duration in seconds (0 = pool minimum). */
  lockupSeconds: number;
  
  /** Enable auto-compounding from the start. */
  autoCompound?: boolean;
  
  /** Immediately mint stEDGE (liquid staking). */
  mintLiquidToken?: boolean;
  
  /** Referral code for tracking. */
  referralCode?: string;
}

/**
 * Request to unstake EDGE tokens.
 */
interface UnstakeRequest {
  /** Position to unstake from. */
  positionId: string;
  
  /** Wallet initiating the unstake. */
  wallet: PublicKey;
  
  /** Amount to unstake (null = full position). */
  amount: BN | null;
  
  /** Force emergency unstake (incurs penalty). */
  emergency?: boolean;
}

/**
 * Filter options for listing positions.
 */
interface PositionFilter {
  status?: StakePositionStatus[];
  poolId?: string;
  minAmount?: BN;
  sortBy?: 'stakedAmount' | 'createdAt' | 'pendingRewards';
  sortOrder?: 'asc' | 'desc';
}
```

### RewardDistribution

```typescript
/**
 * Represents a reward distribution event — periodic allocation
 * of rewards to stakers in a pool.
 */
interface RewardDistribution {
  /** Distribution ID (UUID). */
  id: string;
  
  /** Pool that received the distribution. */
  poolId: string;
  
  /** Total amount distributed in this event. */
  totalAmount: BN;
  
  /** Number of positions that received rewards. */
  recipientCount: number;
  
  /** Distribution method. */
  method: 'proportional' | 'fixed' | 'tiered';
  
  /** On-chain transaction signature. */
  txSignature: string;
  
  /** Distribution timestamp. */
  distributedAt: Date;
  
  /** Distribution epoch (sequential counter). */
  epoch: number;
  
  /** Snapshot of pool state at distribution time. */
  poolSnapshot: {
    totalStaked: BN;
    activePositions: number;
    effectiveAPY: number;
  };
}

/**
 * Record of a user claiming their accumulated rewards.
 */
interface RewardClaim {
  /** Claim ID (UUID). */
  id: string;
  
  /** Position the rewards were claimed from. */
  positionId: string;
  
  /** Wallet that received the rewards. */
  wallet: PublicKey;
  
  /** Amount claimed. */
  amount: BN;
  
  /** On-chain transaction signature. */
  txSignature: string;
  
  /** Claim timestamp. */
  claimedAt: Date;
  
  /** Whether this was an auto-compound (rewards re-staked). */
  autoCompounded: boolean;
}

/**
 * Reward schedule — defines when and how rewards are distributed.
 */
interface RewardSchedule {
  /** Schedule ID. */
  id: string;
  
  /** Pool this schedule applies to. */
  poolId: string;
  
  /** Distribution frequency in milliseconds. */
  intervalMs: number;
  
  /** Amount allocated per distribution (null = calculated from APY). */
  amountPerDistribution: BN | null;
  
  /** Start date of the schedule. */
  startsAt: Date;
  
  /** End date (null = indefinite). */
  endsAt: Date | null;
  
  /** Whether the schedule is currently active. */
  active: boolean;
  
  /** Last distribution timestamp. */
  lastDistributionAt: Date | null;
  
  /** Next scheduled distribution. */
  nextDistributionAt: Date;
}

/**
 * Detailed breakdown of pending rewards.
 */
interface RewardBreakdown {
  /** Base rewards from APY. */
  baseRewards: BN;
  
  /** Bonus from lockup duration. */
  lockupBonus: BN;
  
  /** Bonus from staking tier. */
  tierBonus: BN;
  
  /** Compounded rewards (if auto-compound enabled). */
  compoundedRewards: BN;
  
  /** Total pending. */
  total: BN;
  
  /** Calculation timestamp. */
  calculatedAt: Date;
}
```

### CooldownPeriod

```typescript
/**
 * Represents an active cooldown period before tokens
 * can be withdrawn after unstaking.
 */
interface CooldownPeriod {
  /** Cooldown record ID (UUID). */
  id: string;
  
  /** Position undergoing cooldown. */
  positionId: string;
  
  /** Wallet that initiated the unstake. */
  wallet: PublicKey;
  
  /** Amount being unstaked. */
  amount: BN;
  
  /** Cooldown duration in seconds. */
  durationSeconds: number;
  
  /** When the cooldown was initiated. */
  startedAt: Date;
  
  /** When the cooldown expires and tokens become claimable. */
  expiresAt: Date;
  
  /** Current cooldown status. */
  status: CooldownStatus;
  
  /** Remaining seconds (calculated). */
  remainingSeconds: number;
  
  /** Whether the cooldown has been finalized. */
  finalized: boolean;
  
  /** Finalization TX signature (if finalized). */
  finalizeTxSignature: string | null;
}

type CooldownStatus = 'active' | 'expired' | 'finalized' | 'cancelled';

/**
 * Cooldown configuration per pool.
 */
interface CooldownConfig {
  /** Standard cooldown duration in seconds. */
  standardSeconds: number;
  
  /** Reduced cooldown for higher tiers (multiplier, e.g., 0.5 = half). */
  tierMultipliers: Record<StakingTierLevel, number>;
  
  /** Emergency unstake penalty in basis points. */
  emergencyPenaltyBps: number;
  
  /** Maximum partial unstake ratio (0-1). 1 = can unstake any amount. */
  maxPartialUnstakeRatio: number;
  
  /** Minimum time between partial unstakes in seconds. */
  partialUnstakeCooldownSeconds: number;
}
```

### LiquidStakeToken

```typescript
/**
 * Represents the liquid staking token (stEDGE) — a derivative
 * that represents a staked EDGE position and can be freely traded.
 */
interface LiquidStakeToken {
  /** stEDGE SPL token mint address. */
  mint: PublicKey;
  
  /** Current total stEDGE supply. */
  totalSupply: BN;
  
  /** Total EDGE backing the stEDGE supply. */
  totalBacking: BN;
  
  /** Current exchange rate (stEDGE per EDGE). */
  exchangeRate: LiquidStakeExchangeRate;
  
  /** Number of holders. */
  holderCount: number;
  
  /** Last rebase timestamp. */
  lastRebaseAt: Date;
  
  /** Next scheduled rebase. */
  nextRebaseAt: Date;
  
  /** Rebase frequency in milliseconds. */
  rebaseIntervalMs: number;
}

/**
 * Exchange rate between stEDGE and EDGE.
 * Rate increases over time as staking rewards accrue.
 */
interface LiquidStakeExchangeRate {
  /** stEDGE amount per 1 EDGE (at mint time). */
  stEdgePerEdge: number;
  
  /** EDGE amount per 1 stEDGE (at redeem time). */
  edgePerStEdge: number;
  
  /** Rate as of this timestamp. */
  asOf: Date;
  
  /** 24h rate change (percentage). */
  change24h: number;
  
  /** 7d rate change (percentage). */
  change7d: number;
}
```

### StakingTier

```typescript
/**
 * Staking tier — tiered benefits based on the amount staked.
 */
type StakingTierLevel = 'none' | 'bronze' | 'silver' | 'gold' | 'platinum';

interface StakingTier {
  /** Tier level. */
  level: StakingTierLevel;
  
  /** Display name. */
  name: string;
  
  /** Tier description. */
  description: string;
  
  /** Minimum EDGE staked to qualify. */
  minStake: BN;
  
  /** Maximum EDGE for this tier (next tier starts above). */
  maxStake: BN | null;
  
  /** Benefits granted at this tier. */
  benefits: TierBenefits;
  
  /** Number of stakers currently in this tier. */
  memberCount: number;
  
  /** Tier badge/icon URL. */
  badgeUrl: string;
  
  /** Display color (hex). */
  color: string;
}

interface TierBenefits {
  /** APY bonus in basis points. */
  apyBonusBps: number;
  
  /** Cooldown reduction multiplier (e.g., 0.75 = 25% shorter). */
  cooldownMultiplier: number;
  
  /** Governance weight multiplier (e.g., 1.5 = 50% more voting power). */
  governanceMultiplier: number;
  
  /** Priority access to new pools. */
  priorityPoolAccess: boolean;
  
  /** Reduced emergency unstake penalty (in bps). */
  emergencyPenaltyBps: number;
  
  /** Access to exclusive staking pools. */
  exclusivePoolAccess: boolean;
  
  /** Airdrop multiplier for token distributions. */
  airdropMultiplier: number;
  
  /** Custom benefits (extensible). */
  custom: Record<string, unknown>;
}

/**
 * Tier threshold configuration.
 */
interface TierThresholds {
  bronze: BN;    // e.g., 1,000 EDGE
  silver: BN;    // e.g., 10,000 EDGE
  gold: BN;      // e.g., 100,000 EDGE
  platinum: BN;  // e.g., 1,000,000 EDGE
}
```

### Slashing

```typescript
/**
 * Slashing event — records when a validator or position
 * was penalized for misbehavior.
 */
interface SlashingEvent {
  /** Event ID (UUID). */
  id: string;
  
  /** The validator that was slashed. */
  validatorAddress: PublicKey;
  
  /** Affected pool (if pool-based slashing). */
  poolId: string | null;
  
  /** Slashing condition that triggered. */
  condition: SlashingCondition;
  
  /** Total amount slashed across all affected positions. */
  totalSlashedAmount: BN;
  
  /** Number of positions affected. */
  affectedPositions: number;
  
  /** Amount sent to insurance fund. */
  insuranceFundContribution: BN;
  
  /** Amount burned. */
  burnedAmount: BN;
  
  /** On-chain TX signature. */
  txSignature: string;
  
  /** Evidence / proof data. */
  evidence: string;
  
  /** Event timestamp. */
  occurredAt: Date;
  
  /** Whether positions have been compensated from insurance. */
  insuranceClaimed: boolean;
}

/**
 * Defines conditions under which slashing occurs.
 */
interface SlashingCondition {
  /** Condition type. */
  type: 'downtime' | 'double_sign' | 'invalid_block' | 'censorship' | 'custom';
  
  /** Human-readable description. */
  description: string;
  
  /** Slash amount in basis points of staked amount. */
  slashRateBps: number;
  
  /** Whether the slash is applied immediately or after review. */
  immediate: boolean;
  
  /** Grace period in seconds before slash is applied (if not immediate). */
  gracePeriodSeconds: number;
  
  /** Minimum consecutive occurrences before slashing. */
  minOccurrences: number;
}

/**
 * Insurance fund — protects delegators from slashing losses.
 */
interface InsuranceFund {
  /** Fund address (on-chain PDA). */
  address: PublicKey;
  
  /** Current fund balance. */
  balance: BN;
  
  /** Target fund size. */
  targetBalance: BN;
  
  /** Funding rate in bps (taken from staking rewards). */
  fundingRateBps: number;
  
  /** Total claims paid out. */
  totalClaimsPaid: BN;
  
  /** Number of claims processed. */
  claimsCount: number;
  
  /** Coverage ratio (balance / total staked). */
  coverageRatio: number;
  
  /** Last top-up timestamp. */
  lastTopUpAt: Date;
}
```

### Validator Delegation

```typescript
/**
 * Information about a validator available for delegation.
 */
interface ValidatorInfo {
  /** Validator identity (vote account). */
  voteAccount: PublicKey;
  
  /** Validator name / moniker. */
  name: string;
  
  /** Validator description. */
  description: string;
  
  /** Validator website. */
  website: string | null;
  
  /** Commission rate in percentage (0-100). */
  commissionPercent: number;
  
  /** Total active stake delegated to this validator. */
  totalStake: BN;
  
  /** Validator's own stake (skin in the game). */
  selfStake: BN;
  
  /** Uptime percentage over the last epoch. */
  uptimePercent: number;
  
  /** Historical APY for delegators. */
  historicalAPY: number;
  
  /** Number of delegators. */
  delegatorCount: number;
  
  /** Whether the validator is delinquent. */
  delinquent: boolean;
  
  /** Slashing history. */
  slashingHistory: SlashingEvent[];
  
  /** Risk score (0-100, lower is safer). */
  riskScore: number;
  
  /** Last updated. */
  lastUpdatedAt: Date;
}

/**
 * A delegation record — tracking a user's delegation to a validator.
 */
interface DelegationRecord {
  /** Record ID (UUID). */
  id: string;
  
  /** Delegator's wallet. */
  wallet: PublicKey;
  
  /** On-chain stake account. */
  stakeAccount: PublicKey;
  
  /** Target validator vote account. */
  validatorVoteAccount: PublicKey;
  
  /** Delegated amount. */
  amount: BN;
  
  /** Delegation status. */
  status: 'activating' | 'active' | 'deactivating' | 'deactivated';
  
  /** Activation epoch. */
  activationEpoch: number;
  
  /** Deactivation epoch (null if still active). */
  deactivationEpoch: number | null;
  
  /** Accumulated rewards from delegation. */
  accumulatedRewards: BN;
  
  /** Delegation creation timestamp. */
  createdAt: Date;
}

/**
 * Rewards from validator delegation.
 */
interface DelegationReward {
  /** Reward ID. */
  id: string;
  
  /** Delegation record this reward belongs to. */
  delegationId: string;
  
  /** Epoch the reward was earned. */
  epoch: number;
  
  /** Reward amount (in lamports for SOL, smallest unit for EDGE). */
  amount: BN;
  
  /** Commission deducted by validator. */
  commissionDeducted: BN;
  
  /** Net reward after commission. */
  netReward: BN;
  
  /** Timestamp. */
  earnedAt: Date;
}
```

### Governance Weight

```typescript
/**
 * Governance weight — calculates voting power from staking.
 */
interface GovernanceWeight {
  /** Wallet address. */
  wallet: PublicKey;
  
  /** Total voting power (normalized units). */
  totalWeight: BN;
  
  /** Breakdown by position. */
  positions: VotingPowerBreakdown[];
  
  /** Tier-based multiplier applied. */
  tierMultiplier: number;
  
  /** Staking tier. */
  tier: StakingTierLevel;
  
  /** As of timestamp. */
  calculatedAt: Date;
}

/**
 * Per-position breakdown of voting power.
 */
interface VotingPowerBreakdown {
  /** Position ID. */
  positionId: string;
  
  /** Base weight from staked amount. */
  baseWeight: BN;
  
  /** Lockup bonus multiplier. */
  lockupMultiplier: number;
  
  /** Duration bonus (longer lockup = more power). */
  durationBonus: BN;
  
  /** Tier bonus. */
  tierBonus: BN;
  
  /** Final weight for this position. */
  finalWeight: BN;
}
```

### Analytics

```typescript
/**
 * Comprehensive staking analytics snapshot.
 */
interface StakingAnalytics {
  /** Total Value Locked across all pools. */
  tvl: BN;
  
  /** TVL in USD equivalent. */
  tvlUsd: number;
  
  /** Total number of active stakers. */
  activeStakers: number;
  
  /** Total number of staking positions. */
  totalPositions: number;
  
  /** Average stake amount. */
  averageStake: BN;
  
  /** Median stake amount. */
  medianStake: BN;
  
  /** Weighted average APY across all pools. */
  weightedAverageAPY: number;
  
  /** Total rewards distributed all-time. */
  totalRewardsDistributed: BN;
  
  /** Rewards distributed in the last 24 hours. */
  rewards24h: BN;
  
  /** Pool utilization data. */
  poolUtilization: PoolUtilization[];
  
  /** Staker demographics. */
  demographics: StakerDemographics;
  
  /** Tier distribution. */
  tierDistribution: Record<StakingTierLevel, number>;
  
  /** Liquid staking stats. */
  liquidStaking: {
    totalStEdgeSupply: BN;
    exchangeRate: number;
    holderCount: number;
  };
  
  /** Snapshot timestamp. */
  snapshotAt: Date;
}

/**
 * Total Value Locked snapshot for historical tracking.
 */
interface TVLSnapshot {
  /** Snapshot timestamp. */
  timestamp: Date;
  
  /** TVL in EDGE tokens. */
  tvlEdge: BN;
  
  /** TVL in USD. */
  tvlUsd: number;
  
  /** Number of active stakers at this point. */
  stakerCount: number;
  
  /** Number of active pools. */
  poolCount: number;
}

/**
 * APY yield snapshot for historical tracking.
 */
interface YieldSnapshot {
  /** Snapshot timestamp. */
  timestamp: Date;
  
  /** Pool ID. */
  poolId: string;
  
  /** APY at this point (in percentage). */
  apy: number;
  
  /** Total staked in the pool. */
  totalStaked: BN;
  
  /** Pool utilization ratio. */
  utilization: number;
}

/**
 * Pool utilization data.
 */
interface PoolUtilization {
  /** Pool ID. */
  poolId: string;
  
  /** Pool name. */
  poolName: string;
  
  /** Current utilization (totalStaked / maxCapacity). */
  utilization: number;
  
  /** Total staked. */
  totalStaked: BN;
  
  /** Max capacity. */
  maxCapacity: BN;
  
  /** Active positions in pool. */
  activePositions: number;
}

/**
 * Staker demographics breakdown.
 */
interface StakerDemographics {
  /** Distribution by stake size. */
  byStakeSize: {
    range: string;     // e.g., "1-1000", "1000-10000"
    count: number;
    totalStaked: BN;
    percentage: number;
  }[];
  
  /** Distribution by lockup duration. */
  byLockupDuration: {
    range: string;     // e.g., "flexible", "30d", "90d", "365d"
    count: number;
    totalStaked: BN;
    percentage: number;
  }[];
  
  /** New stakers in the last 30 days. */
  newStakers30d: number;
  
  /** Staker retention rate (30d). */
  retentionRate30d: number;
  
  /** Average staking duration. */
  averageDurationDays: number;
}

/**
 * Time range for historical queries.
 */
interface TimeRange {
  start: Date;
  end: Date;
  granularity: '1h' | '6h' | '1d' | '7d' | '30d';
}

/**
 * Compounding options for auto-compound configuration.
 */
interface CompoundingOption {
  /** Compounding frequency. */
  frequency: 'daily' | 'weekly' | 'epoch' | 'manual';
  
  /** Minimum reward threshold before compounding triggers. */
  minThreshold: BN;
  
  /** Whether to compound into the same pool or a different one. */
  targetPoolId: string | null;
}
```

### Pagination

```typescript
/**
 * Standard pagination parameters.
 */
interface PaginationParams {
  page: number;
  pageSize: number;
}

/**
 * Paginated result wrapper.
 */
interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}
```

---

## Database Schemas (Drizzle ORM)

### stake_pools

```typescript
import { pgTable, uuid, text, timestamp, bigint, integer, boolean, jsonb, pgEnum } from 'drizzle-orm/pg-core';

export const stakePoolStatusEnum = pgEnum('stake_pool_status', [
  'active',
  'paused',
  'deprecated',
  'full',
]);

export const stakePools = pgTable('stake_pools', {
  id: uuid('id').primaryKey().defaultRandom(),
  
  /** On-chain pool account address (base58). */
  address: text('address').notNull().unique(),
  
  /** Human-readable pool name. */
  name: text('name').notNull(),
  
  /** Pool description. */
  description: text('description').notNull().default(''),
  
  /** Pool status. */
  status: stakePoolStatusEnum('status').notNull().default('active'),
  
  /** SPL token mint for staking (base58). */
  stakeMint: text('stake_mint').notNull(),
  
  /** Pool authority public key (base58). */
  authority: text('authority').notNull(),
  
  /** On-chain reward vault PDA (base58). */
  rewardVault: text('reward_vault').notNull(),
  
  /** APY curve configuration (JSON). */
  apyCurve: jsonb('apy_curve').notNull().$type<APYCurve>(),
  
  /** Current effective APY (basis points, cached). */
  currentAPYBps: integer('current_apy_bps').notNull().default(0),
  
  /** Minimum lockup duration (seconds). 0 = flexible. */
  minLockupSeconds: integer('min_lockup_seconds').notNull().default(0),
  
  /** Maximum lockup duration (seconds). 0 = unlimited. */
  maxLockupSeconds: integer('max_lockup_seconds').notNull().default(0),
  
  /** Cooldown period (seconds) before unstaked tokens are released. */
  cooldownSeconds: integer('cooldown_seconds').notNull().default(604800), // 7 days
  
  /** Maximum total staked (string representation of BN). */
  maxCapacity: bigint('max_capacity', { mode: 'bigint' }).notNull(),
  
  /** Current total staked. */
  totalStaked: bigint('total_staked', { mode: 'bigint' }).notNull().default(0n),
  
  /** Number of active positions. */
  activePositions: integer('active_positions').notNull().default(0),
  
  /** Total rewards distributed to date. */
  totalRewardsDistributed: bigint('total_rewards_distributed', { mode: 'bigint' }).notNull().default(0n),
  
  /** Remaining reward balance in vault. */
  remainingRewards: bigint('remaining_rewards', { mode: 'bigint' }).notNull().default(0n),
  
  /** Emergency unstake penalty (basis points). */
  emergencyUnstakePenaltyBps: integer('emergency_unstake_penalty_bps').notNull().default(500),
  
  /** Whether auto-compounding is supported. */
  supportsAutoCompound: boolean('supports_auto_compound').notNull().default(false),
  
  /** Whether liquid staking (stEDGE) is supported. */
  supportsLiquidStaking: boolean('supports_liquid_staking').notNull().default(false),
  
  /** Pause reason (if paused). */
  pauseReason: text('pause_reason'),
  
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});
```

### stake_positions

```typescript
export const stakePositionStatusEnum = pgEnum('stake_position_status', [
  'active',
  'locked',
  'cooldown',
  'ready_to_claim',
  'withdrawn',
  'slashed',
  'liquid_staked',
]);

export const stakePositions = pgTable('stake_positions', {
  id: uuid('id').primaryKey().defaultRandom(),
  
  /** On-chain stake account PDA (base58). */
  address: text('address').notNull().unique(),
  
  /** Pool this position belongs to. */
  poolId: uuid('pool_id').notNull().references(() => stakePools.id),
  
  /** Pool on-chain address (denormalized for fast queries). */
  poolAddress: text('pool_address').notNull(),
  
  /** Staker's wallet address (base58). */
  wallet: text('wallet').notNull(),
  
  /** Position status. */
  status: stakePositionStatusEnum('status').notNull().default('active'),
  
  /** Staked amount (smallest unit). */
  stakedAmount: bigint('staked_amount', { mode: 'bigint' }).notNull(),
  
  /** Lockup end timestamp. Null for flexible positions. */
  lockupEndsAt: timestamp('lockup_ends_at', { withTimezone: true }),
  
  /** Total rewards earned (claimed + unclaimed). */
  totalRewardsEarned: bigint('total_rewards_earned', { mode: 'bigint' }).notNull().default(0n),
  
  /** Rewards already claimed. */
  rewardsClaimed: bigint('rewards_claimed', { mode: 'bigint' }).notNull().default(0n),
  
  /** Pending unclaimed rewards (cached, recalculated periodically). */
  pendingRewards: bigint('pending_rewards', { mode: 'bigint' }).notNull().default(0n),
  
  /** Timestamp of last reward calculation. */
  lastRewardCalculation: timestamp('last_reward_calculation', { withTimezone: true }).notNull().defaultNow(),
  
  /** Auto-compound enabled. */
  autoCompoundEnabled: boolean('auto_compound_enabled').notNull().default(false),
  
  /** stEDGE amount minted (if liquid staked). */
  liquidStakeAmount: bigint('liquid_stake_amount', { mode: 'bigint' }),
  
  /** Current tier level. */
  tier: text('tier').notNull().default('none').$type<StakingTierLevel>(),
  
  /** Governance voting weight. */
  governanceWeight: bigint('governance_weight', { mode: 'bigint' }).notNull().default(0n),
  
  /** APY at time of staking (basis points). */
  entryAPYBps: integer('entry_apy_bps').notNull(),
  
  /** Current effective APY (basis points, cached). */
  currentAPYBps: integer('current_apy_bps').notNull(),
  
  /** Referral code used (if any). */
  referralCode: text('referral_code'),
  
  /** On-chain creation TX signature. */
  createTxSignature: text('create_tx_signature').notNull(),
  
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});
```

### reward_distributions

```typescript
export const rewardMethodEnum = pgEnum('reward_method', [
  'proportional',
  'fixed',
  'tiered',
]);

export const rewardDistributions = pgTable('reward_distributions', {
  id: uuid('id').primaryKey().defaultRandom(),
  
  /** Pool receiving the distribution. */
  poolId: uuid('pool_id').notNull().references(() => stakePools.id),
  
  /** Total amount distributed. */
  totalAmount: bigint('total_amount', { mode: 'bigint' }).notNull(),
  
  /** Number of recipient positions. */
  recipientCount: integer('recipient_count').notNull(),
  
  /** Distribution method. */
  method: rewardMethodEnum('method').notNull().default('proportional'),
  
  /** On-chain TX signature. */
  txSignature: text('tx_signature').notNull(),
  
  /** Sequential epoch number. */
  epoch: integer('epoch').notNull(),
  
  /** Pool state snapshot at distribution time (JSON). */
  poolSnapshot: jsonb('pool_snapshot').notNull().$type<{
    totalStaked: string;
    activePositions: number;
    effectiveAPY: number;
  }>(),
  
  /** Per-position reward amounts (JSON array). */
  rewardAllocations: jsonb('reward_allocations').$type<Array<{
    positionId: string;
    amount: string;
    autoCompounded: boolean;
  }>>(),
  
  distributedAt: timestamp('distributed_at', { withTimezone: true }).notNull().defaultNow(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});
```

### cooldown_records

```typescript
export const cooldownStatusEnum = pgEnum('cooldown_status', [
  'active',
  'expired',
  'finalized',
  'cancelled',
]);

export const cooldownRecords = pgTable('cooldown_records', {
  id: uuid('id').primaryKey().defaultRandom(),
  
  /** Position undergoing cooldown. */
  positionId: uuid('position_id').notNull().references(() => stakePositions.id),
  
  /** Wallet that initiated the unstake. */
  wallet: text('wallet').notNull(),
  
  /** Amount being unstaked. */
  amount: bigint('amount', { mode: 'bigint' }).notNull(),
  
  /** Cooldown duration in seconds. */
  durationSeconds: integer('duration_seconds').notNull(),
  
  /** Cooldown start time. */
  startedAt: timestamp('started_at', { withTimezone: true }).notNull().defaultNow(),
  
  /** Cooldown expiration time. */
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  
  /** Current status. */
  status: cooldownStatusEnum('status').notNull().default('active'),
  
  /** Whether the unstake was an emergency unstake. */
  isEmergency: boolean('is_emergency').notNull().default(false),
  
  /** Penalty amount (for emergency unstakes). */
  penaltyAmount: bigint('penalty_amount', { mode: 'bigint' }),
  
  /** Finalization TX signature. */
  finalizeTxSignature: text('finalize_tx_signature'),
  
  /** Finalization timestamp. */
  finalizedAt: timestamp('finalized_at', { withTimezone: true }),
  
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});
```

### staking_tiers

```typescript
export const stakingTiers = pgTable('staking_tiers', {
  id: uuid('id').primaryKey().defaultRandom(),
  
  /** Tier level identifier. */
  level: text('level').notNull().unique().$type<StakingTierLevel>(),
  
  /** Display name. */
  name: text('name').notNull(),
  
  /** Tier description. */
  description: text('description').notNull(),
  
  /** Minimum stake required (smallest unit). */
  minStake: bigint('min_stake', { mode: 'bigint' }).notNull(),
  
  /** Maximum stake for this tier. Null for top tier. */
  maxStake: bigint('max_stake', { mode: 'bigint' }),
  
  /** Tier benefits configuration (JSON). */
  benefits: jsonb('benefits').notNull().$type<TierBenefits>(),
  
  /** Number of current members in this tier. */
  memberCount: integer('member_count').notNull().default(0),
  
  /** Badge/icon URL. */
  badgeUrl: text('badge_url').notNull(),
  
  /** Display color (hex string). */
  color: text('color').notNull(),
  
  /** Sort order for display. */
  sortOrder: integer('sort_order').notNull().default(0),
  
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});
```

### staking_analytics

```typescript
export const stakingAnalytics = pgTable('staking_analytics', {
  id: uuid('id').primaryKey().defaultRandom(),
  
  /** Snapshot type: hourly, daily, weekly, monthly. */
  granularity: text('granularity').notNull().$type<'hourly' | 'daily' | 'weekly' | 'monthly'>(),
  
  /** Snapshot timestamp (truncated to granularity). */
  snapshotAt: timestamp('snapshot_at', { withTimezone: true }).notNull(),
  
  /** Total Value Locked in EDGE (smallest unit). */
  tvlEdge: bigint('tvl_edge', { mode: 'bigint' }).notNull(),
  
  /** TVL in USD (stored as cents for precision). */
  tvlUsdCents: bigint('tvl_usd_cents', { mode: 'bigint' }).notNull(),
  
  /** Number of active stakers. */
  activeStakers: integer('active_stakers').notNull(),
  
  /** Total active positions. */
  totalPositions: integer('total_positions').notNull(),
  
  /** Average stake amount (smallest unit). */
  averageStake: bigint('average_stake', { mode: 'bigint' }).notNull(),
  
  /** Weighted average APY (basis points). */
  weightedAverageAPYBps: integer('weighted_average_apy_bps').notNull(),
  
  /** Rewards distributed in this period. */
  rewardsDistributed: bigint('rewards_distributed', { mode: 'bigint' }).notNull(),
  
  /** New stakers in this period. */
  newStakers: integer('new_stakers').notNull().default(0),
  
  /** Unstakes in this period. */
  unstakeCount: integer('unstake_count').notNull().default(0),
  
  /** Unstake volume. */
  unstakeVolume: bigint('unstake_volume', { mode: 'bigint' }).notNull().default(0n),
  
  /** Active pools count. */
  activePoolCount: integer('active_pool_count').notNull(),
  
  /** stEDGE total supply (liquid staking). */
  stEdgeTotalSupply: bigint('st_edge_total_supply', { mode: 'bigint' }),
  
  /** stEDGE exchange rate (stored as micro-units, 1e6 = 1.0). */
  stEdgeExchangeRateMicro: bigint('st_edge_exchange_rate_micro', { mode: 'bigint' }),
  
  /** Tier distribution (JSON). */
  tierDistribution: jsonb('tier_distribution').$type<Record<StakingTierLevel, number>>(),
  
  /** Demographics data (JSON). */
  demographics: jsonb('demographics').$type<StakerDemographics>(),
  
  /** Pool utilization data (JSON). */
  poolUtilization: jsonb('pool_utilization').$type<PoolUtilization[]>(),
  
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});
```

### validator_delegations

```typescript
export const validatorDelegationStatusEnum = pgEnum('validator_delegation_status', [
  'activating',
  'active',
  'deactivating',
  'deactivated',
]);

export const validatorDelegations = pgTable('validator_delegations', {
  id: uuid('id').primaryKey().defaultRandom(),
  
  /** Delegator wallet (base58). */
  wallet: text('wallet').notNull(),
  
  /** On-chain stake account (base58). */
  stakeAccount: text('stake_account').notNull().unique(),
  
  /** Validator vote account (base58). */
  validatorVoteAccount: text('validator_vote_account').notNull(),
  
  /** Delegated amount. */
  amount: bigint('amount', { mode: 'bigint' }).notNull(),
  
  /** Delegation status. */
  status: validatorDelegationStatusEnum('status').notNull().default('activating'),
  
  /** Activation epoch. */
  activationEpoch: integer('activation_epoch').notNull(),
  
  /** Deactivation epoch. */
  deactivationEpoch: integer('deactivation_epoch'),
  
  /** Accumulated rewards. */
  accumulatedRewards: bigint('accumulated_rewards', { mode: 'bigint' }).notNull().default(0n),
  
  /** Last reward sync epoch. */
  lastRewardEpoch: integer('last_reward_epoch'),
  
  /** Creation TX signature. */
  createTxSignature: text('create_tx_signature').notNull(),
  
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});
```

### slashing_events

```typescript
export const slashingConditionTypeEnum = pgEnum('slashing_condition_type', [
  'downtime',
  'double_sign',
  'invalid_block',
  'censorship',
  'custom',
]);

export const slashingEvents = pgTable('slashing_events', {
  id: uuid('id').primaryKey().defaultRandom(),
  
  /** Validator address (base58). */
  validatorAddress: text('validator_address').notNull(),
  
  /** Affected pool (if applicable). */
  poolId: uuid('pool_id').references(() => stakePools.id),
  
  /** Slashing condition type. */
  conditionType: slashingConditionTypeEnum('condition_type').notNull(),
  
  /** Slashing condition details (JSON). */
  condition: jsonb('condition').notNull().$type<SlashingCondition>(),
  
  /** Total amount slashed. */
  totalSlashedAmount: bigint('total_slashed_amount', { mode: 'bigint' }).notNull(),
  
  /** Number of affected positions. */
  affectedPositions: integer('affected_positions').notNull(),
  
  /** Amount sent to insurance fund. */
  insuranceFundContribution: bigint('insurance_fund_contribution', { mode: 'bigint' }).notNull(),
  
  /** Amount burned. */
  burnedAmount: bigint('burned_amount', { mode: 'bigint' }).notNull(),
  
  /** On-chain TX signature. */
  txSignature: text('tx_signature').notNull(),
  
  /** Evidence/proof. */
  evidence: text('evidence').notNull(),
  
  /** Whether insurance has been claimed. */
  insuranceClaimed: boolean('insurance_claimed').notNull().default(false),
  
  occurredAt: timestamp('occurred_at', { withTimezone: true }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});
```

### liquid_stake_tokens

```typescript
export const liquidStakeTokens = pgTable('liquid_stake_tokens', {
  id: uuid('id').primaryKey().defaultRandom(),
  
  /** stEDGE mint address (base58). */
  mint: text('mint').notNull().unique(),
  
  /** Total stEDGE supply (smallest unit). */
  totalSupply: bigint('total_supply', { mode: 'bigint' }).notNull().default(0n),
  
  /** Total EDGE backing the supply. */
  totalBacking: bigint('total_backing', { mode: 'bigint' }).notNull().default(0n),
  
  /** Exchange rate (stEDGE per EDGE, stored as micro-units). */
  exchangeRateMicro: bigint('exchange_rate_micro', { mode: 'bigint' }).notNull().default(1000000n),
  
  /** Number of unique holders. */
  holderCount: integer('holder_count').notNull().default(0),
  
  /** Last rebase timestamp. */
  lastRebaseAt: timestamp('last_rebase_at', { withTimezone: true }),
  
  /** Rebase interval in milliseconds. */
  rebaseIntervalMs: bigint('rebase_interval_ms', { mode: 'bigint' }).notNull().default(86400000n),
  
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});
```

### insurance_fund_ledger

```typescript
export const insuranceFundLedger = pgTable('insurance_fund_ledger', {
  id: uuid('id').primaryKey().defaultRandom(),
  
  /** Ledger entry type. */
  entryType: text('entry_type').notNull().$type<'deposit' | 'withdrawal' | 'claim' | 'slash_contribution'>(),
  
  /** Amount (positive for deposits, negative for withdrawals/claims). */
  amount: bigint('amount', { mode: 'bigint' }).notNull(),
  
  /** Running balance after this entry. */
  balanceAfter: bigint('balance_after', { mode: 'bigint' }).notNull(),
  
  /** Related slashing event (if applicable). */
  slashingEventId: uuid('slashing_event_id').references(() => slashingEvents.id),
  
  /** Description / notes. */
  description: text('description').notNull(),
  
  /** On-chain TX signature (if applicable). */
  txSignature: text('tx_signature'),
  
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});
```

### Database Indexes

```typescript
import { index, uniqueIndex } from 'drizzle-orm/pg-core';

// stake_pools indexes
export const stakePoolsIndexes = {
  statusIdx: index('stake_pools_status_idx').on(stakePools.status),
  authorityIdx: index('stake_pools_authority_idx').on(stakePools.authority),
};

// stake_positions indexes
export const stakePositionsIndexes = {
  walletIdx: index('stake_positions_wallet_idx').on(stakePositions.wallet),
  poolIdx: index('stake_positions_pool_id_idx').on(stakePositions.poolId),
  statusIdx: index('stake_positions_status_idx').on(stakePositions.status),
  walletStatusIdx: index('stake_positions_wallet_status_idx').on(
    stakePositions.wallet,
    stakePositions.status
  ),
  tierIdx: index('stake_positions_tier_idx').on(stakePositions.tier),
};

// reward_distributions indexes
export const rewardDistributionsIndexes = {
  poolIdx: index('reward_distributions_pool_id_idx').on(rewardDistributions.poolId),
  epochIdx: index('reward_distributions_epoch_idx').on(rewardDistributions.epoch),
  distributedAtIdx: index('reward_distributions_distributed_at_idx').on(
    rewardDistributions.distributedAt
  ),
};

// cooldown_records indexes
export const cooldownRecordsIndexes = {
  positionIdx: index('cooldown_records_position_id_idx').on(cooldownRecords.positionId),
  walletIdx: index('cooldown_records_wallet_idx').on(cooldownRecords.wallet),
  statusIdx: index('cooldown_records_status_idx').on(cooldownRecords.status),
  expiresAtIdx: index('cooldown_records_expires_at_idx').on(cooldownRecords.expiresAt),
};

// staking_analytics indexes
export const stakingAnalyticsIndexes = {
  snapshotIdx: index('staking_analytics_snapshot_idx').on(
    stakingAnalytics.granularity,
    stakingAnalytics.snapshotAt
  ),
};

// validator_delegations indexes
export const validatorDelegationsIndexes = {
  walletIdx: index('validator_delegations_wallet_idx').on(validatorDelegations.wallet),
  validatorIdx: index('validator_delegations_validator_idx').on(
    validatorDelegations.validatorVoteAccount
  ),
  statusIdx: index('validator_delegations_status_idx').on(validatorDelegations.status),
};

// slashing_events indexes
export const slashingEventsIndexes = {
  validatorIdx: index('slashing_events_validator_idx').on(slashingEvents.validatorAddress),
  occurredAtIdx: index('slashing_events_occurred_at_idx').on(slashingEvents.occurredAt),
};
```

---

## Code Examples

### 1. Create a Staking Pool

```typescript
import { StakingService } from '@mcv/web3-core/staking';
import { PublicKey } from '@solana/web3.js';
import { BN } from '@coral-xyz/anchor';

const stakingService = new StakingService(/* deps */);

// Create a pool with tiered APY and 30-day lockup
const pool = await stakingService.createPool({
  name: 'EDGE Genesis Pool',
  description: 'Launch pool with boosted APY for early stakers. 30-day minimum lockup with tier bonuses.',
  stakeMint: new PublicKey('EDGExxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx'),
  authority: new PublicKey('AUTHxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx'),
  apy: {
    type: 'tiered',
    baseAPYBps: 800, // 8% base APY
    tiers: [
      { threshold: new BN(0),              apyBps: 800  }, // 0-1M staked: 8%
      { threshold: new BN(1_000_000e9),    apyBps: 1000 }, // 1M-10M: 10%
      { threshold: new BN(10_000_000e9),   apyBps: 1200 }, // 10M-100M: 12%
      { threshold: new BN(100_000_000e9),  apyBps: 600  }, // 100M+: 6% (dilution)
    ],
    lockupBonusBpsPerMonth: 25, // +0.25% per month of lockup
  },
  minLockupSeconds: 30 * 24 * 60 * 60,  // 30 days
  maxLockupSeconds: 365 * 24 * 60 * 60, // 1 year max
  cooldownSeconds: 7 * 24 * 60 * 60,     // 7 day cooldown
  maxCapacity: new BN(500_000_000e9),     // 500M EDGE cap
  emergencyUnstakePenaltyBps: 500,        // 5% penalty
  supportsAutoCompound: true,
  supportsLiquidStaking: true,
  initialRewardFunding: new BN(50_000_000e9), // 50M EDGE in rewards
});

console.log('Pool created:', {
  id: pool.id,
  address: pool.address.toBase58(),
  currentAPY: `${pool.currentAPY}%`,
  capacity: `${pool.maxCapacity.toString()} / ${pool.totalStaked.toString()}`,
});
// Pool created: {
//   id: '550e8400-e29b-41d4-a716-446655440000',
//   address: 'PoLxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
//   currentAPY: '8%',
//   capacity: '500000000000000000 / 0'
// }
```

### 2. Stake Tokens into a Pool

```typescript
import { StakingService } from '@mcv/web3-core/staking';
import { PublicKey, Connection, sendAndConfirmTransaction } from '@solana/web3.js';
import { BN } from '@coral-xyz/anchor';

const stakingService = new StakingService(/* deps */);
const connection = new Connection('https://api.mainnet-beta.solana.com');

const wallet = new PublicKey('USERxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx');
const poolId = '550e8400-e29b-41d4-a716-446655440000';

// Build the stake transaction
const { transaction, positionId, estimatedAPY } = await stakingService.stake({
  wallet,
  poolId,
  amount: new BN(50_000e9), // 50,000 EDGE
  lockupSeconds: 90 * 24 * 60 * 60, // 90-day lockup
  autoCompound: true,
  mintLiquidToken: false,
  referralCode: 'EARLYBIRD2025',
});

console.log('Stake transaction built:', {
  positionId,
  estimatedAPY: `${estimatedAPY}%`,
  txSize: transaction.serialize().length,
});

// User signs and submits (frontend handles this)
// const signedTx = await walletAdapter.signTransaction(transaction);
// const txSig = await connection.sendRawTransaction(signedTx.serialize());
// await connection.confirmTransaction(txSig);

// After confirmation, check the position
const position = await stakingService.getPosition(positionId);
console.log('Position:', {
  status: position!.status,
  stakedAmount: position!.stakedAmount.toString(),
  tier: position!.tier,
  entryAPY: `${position!.entryAPY}%`,
  lockupEndsAt: position!.lockupEndsAt?.toISOString(),
  governanceWeight: position!.governanceWeight.toString(),
});
// Position: {
//   status: 'locked',
//   stakedAmount: '50000000000000',
//   tier: 'silver',
//   entryAPY: '8.75%',
//   lockupEndsAt: '2025-06-15T00:00:00.000Z',
//   governanceWeight: '75000000000000'
// }
```

### 3. Calculate and Claim Rewards

```typescript
import { StakingService, YieldCalculationService } from '@mcv/web3-core/staking';
import { PublicKey } from '@solana/web3.js';

const stakingService = new StakingService(/* deps */);
const yieldService = new YieldCalculationService(/* deps */);

const positionId = '660e8400-e29b-41d4-a716-446655440000';
const wallet = new PublicKey('USERxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx');

// ── Check pending rewards ──────────────────────────────────────────
const { amount, breakdown } = await stakingService.getPendingRewards(positionId);

console.log('Pending rewards:', {
  total: `${Number(amount) / 1e9} EDGE`,
  breakdown: {
    base: `${Number(breakdown.baseRewards) / 1e9} EDGE`,
    lockupBonus: `${Number(breakdown.lockupBonus) / 1e9} EDGE`,
    tierBonus: `${Number(breakdown.tierBonus) / 1e9} EDGE`,
    compounded: `${Number(breakdown.compoundedRewards) / 1e9} EDGE`,
  },
  calculatedAt: breakdown.calculatedAt.toISOString(),
});
// Pending rewards: {
//   total: '1234.56 EDGE',
//   breakdown: {
//     base: '1000.00 EDGE',
//     lockupBonus: '150.00 EDGE',
//     tierBonus: '50.00 EDGE',
//     compounded: '34.56 EDGE',
//   },
//   calculatedAt: '2025-03-15T12:00:00.000Z'
// }

// ── Detailed yield calculation ─────────────────────────────────────
const position = await stakingService.getPosition(positionId);
const yieldDetails = yieldService.calculateDetailedYield({
  stakedAmount: position!.stakedAmount,
  poolAPYBps: position!.currentAPYBps,
  lockupBonusBpsPerMonth: 25,
  lockupMonths: 3,
  tierBonusBps: 50,
  autoCompound: position!.autoCompoundEnabled,
  compoundFrequency: 'daily',
  durationDays: 365,
});

console.log('Projected annual yield:', {
  simpleYield: `${yieldDetails.simpleYield / 1e9} EDGE`,
  compoundedYield: `${yieldDetails.compoundedYield / 1e9} EDGE`,
  effectiveAPY: `${yieldDetails.effectiveAPY}%`,
  dailyReward: `${yieldDetails.dailyReward / 1e9} EDGE`,
});

// ── Claim rewards ──────────────────────────────────────────────────
const claimTx = await stakingService.claimRewards(positionId, wallet);
// User signs and submits...

// ── Claim all rewards across all positions ─────────────────────────
const claimAllTx = await stakingService.claimAllRewards(wallet);
// Returns a single transaction that claims from all positions

// ── View reward history ────────────────────────────────────────────
const history = await stakingService.getRewardHistory(
  { wallet },
  { page: 1, pageSize: 20 }
);

for (const claim of history.data) {
  console.log(`  ${claim.claimedAt.toISOString()} — ${Number(claim.amount) / 1e9} EDGE ${claim.autoCompounded ? '(compounded)' : '(claimed)'}`);
}
```

### 4. Unstake with Cooldown

```typescript
import { StakingService } from '@mcv/web3-core/staking';
import { PublicKey } from '@solana/web3.js';
import { BN } from '@coral-xyz/anchor';

const stakingService = new StakingService(/* deps */);

const positionId = '660e8400-e29b-41d4-a716-446655440000';
const wallet = new PublicKey('USERxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx');

// ── Standard unstake (full amount) ─────────────────────────────────
const { transaction: unstakeTx, cooldown } = await stakingService.unstake({
  positionId,
  wallet,
  amount: null, // null = full unstake
});

console.log('Unstake initiated:', {
  cooldownId: cooldown.id,
  amount: `${Number(cooldown.amount) / 1e9} EDGE`,
  duration: `${cooldown.durationSeconds / 86400} days`,
  expiresAt: cooldown.expiresAt.toISOString(),
  remainingSeconds: cooldown.remainingSeconds,
});
// Unstake initiated: {
//   cooldownId: '770e8400-...',
//   amount: '50000 EDGE',
//   duration: '7 days',
//   expiresAt: '2025-03-22T00:00:00.000Z',
//   remainingSeconds: 604800
// }

// User signs and submits the transaction...

// ── Partial unstake ────────────────────────────────────────────────
const { transaction: partialTx, cooldown: partialCooldown } = await stakingService.unstake({
  positionId: 'another-position-id',
  wallet,
  amount: new BN(10_000e9), // Unstake 10,000 EDGE, keep the rest
});

// ── Check cooldown status ──────────────────────────────────────────
const position = await stakingService.getPosition(positionId);
if (position?.cooldown) {
  const cd = position.cooldown;
  console.log(`Cooldown: ${cd.status} — ${cd.remainingSeconds}s remaining`);
  
  if (cd.status === 'expired') {
    // Cooldown complete — finalize the unstake
    const finalizeTx = await stakingService.finalizeUnstake(positionId, wallet);
    // User signs and submits...
    console.log('Tokens returned to wallet!');
  }
}

// ── Emergency unstake (bypass cooldown, incur penalty) ─────────────
const { transaction: emergencyTx, penaltyAmount, netReturn } =
  await stakingService.emergencyUnstake(positionId, wallet);

console.log('Emergency unstake:', {
  penalty: `${Number(penaltyAmount) / 1e9} EDGE (5%)`,
  netReturn: `${Number(netReturn) / 1e9} EDGE`,
});
// Emergency unstake: {
//   penalty: '2500 EDGE (5%)',
//   netReturn: '47500 EDGE'
// }
```

### 5. Liquid Staking (stEDGE)

```typescript
import { StakingService, LiquidStakingService } from '@mcv/web3-core/staking';
import { PublicKey } from '@solana/web3.js';
import { BN } from '@coral-xyz/anchor';

const stakingService = new StakingService(/* deps */);
const liquidService = new LiquidStakingService(/* deps */);

const wallet = new PublicKey('USERxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx');

// ── Check current exchange rate ────────────────────────────────────
const rate = await stakingService.getExchangeRate();
console.log('stEDGE exchange rate:', {
  stEdgePerEdge: rate.stEdgePerEdge,  // e.g., 0.95 (1 EDGE = 0.95 stEDGE)
  edgePerStEdge: rate.edgePerStEdge,  // e.g., 1.053 (1 stEDGE = 1.053 EDGE)
  change24h: `${rate.change24h}%`,
  change7d: `${rate.change7d}%`,
});

// ── Stake and mint stEDGE in one step ──────────────────────────────
const { transaction: stakeTx, positionId } = await stakingService.stake({
  wallet,
  poolId: 'genesis-pool-id',
  amount: new BN(100_000e9), // 100,000 EDGE
  lockupSeconds: 180 * 24 * 60 * 60, // 180 days
  mintLiquidToken: true, // Mint stEDGE immediately
});

// User signs and submits...

// ── Or mint stEDGE from an existing position ───────────────────────
const existingPositionId = '660e8400-e29b-41d4-a716-446655440000';
const { transaction: mintTx, stEdgeAmount, exchangeRate } =
  await stakingService.mintLiquidStakeToken(existingPositionId, wallet);

console.log('stEDGE minted:', {
  stEdgeAmount: `${Number(stEdgeAmount) / 1e9} stEDGE`,
  exchangeRate: exchangeRate,
  // The stEDGE can now be freely traded, used in DeFi, etc.
});

// ── Redeem stEDGE back to EDGE ─────────────────────────────────────
const redeemAmount = new BN(50_000e9); // Redeem 50,000 stEDGE
const { transaction: redeemTx, edgeAmount, cooldown } =
  await stakingService.redeemLiquidStakeToken(redeemAmount, wallet);

console.log('stEDGE redeemed:', {
  stEdgeRedeemed: `${Number(redeemAmount) / 1e9} stEDGE`,
  edgeReceived: `${Number(edgeAmount) / 1e9} EDGE`, // More than 50k due to accrued rewards
  cooldown: `${cooldown.durationSeconds / 86400} days`,
});

// ── Track liquid staking state ─────────────────────────────────────
const stEdgeState = await liquidService.getState();
console.log('Liquid staking overview:', {
  totalSupply: `${Number(stEdgeState.totalSupply) / 1e9} stEDGE`,
  totalBacking: `${Number(stEdgeState.totalBacking) / 1e9} EDGE`,
  holders: stEdgeState.holderCount,
  nextRebase: stEdgeState.nextRebaseAt.toISOString(),
});
```

### 6. Validator Delegation

```typescript
import { ValidatorDelegationService } from '@mcv/web3-core/staking';
import { PublicKey } from '@solana/web3.js';
import { BN } from '@coral-xyz/anchor';

const delegationService = new ValidatorDelegationService(/* deps */);
const wallet = new PublicKey('USERxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx');

// ── List available validators ──────────────────────────────────────
const validators = await delegationService.listValidators({
  sortBy: 'historicalAPY',
  sortOrder: 'desc',
  minUptime: 99.0,
  maxCommission: 10,
});

for (const v of validators.slice(0, 5)) {
  console.log(`${v.name} — APY: ${v.historicalAPY}%, Commission: ${v.commissionPercent}%, Uptime: ${v.uptimePercent}%, Risk: ${v.riskScore}/100`);
}

// ── Delegate to a validator ────────────────────────────────────────
const validator = validators[0];
const delegateTx = await delegationService.delegate({
  wallet,
  validatorVoteAccount: validator.voteAccount,
  amount: new BN(100e9), // 100 SOL (native delegation)
});

// User signs and submits...

// ── Check delegation status ────────────────────────────────────────
const delegations = await delegationService.getDelegations(wallet);
for (const d of delegations) {
  console.log({
    validator: d.validatorVoteAccount.toBase58(),
    amount: `${Number(d.amount) / 1e9} SOL`,
    status: d.status,
    rewards: `${Number(d.accumulatedRewards) / 1e9} SOL`,
  });
}

// ── Claim delegation rewards ───────────────────────────────────────
const rewardsTx = await delegationService.claimRewards(delegations[0].id, wallet);
```

### 7. Staking Tiers and Governance Weight

```typescript
import { StakingService, StakingTierService, GovernanceWeightService } from '@mcv/web3-core/staking';
import { PublicKey } from '@solana/web3.js';

const tierService = new StakingTierService(/* deps */);
const govService = new GovernanceWeightService(/* deps */);

const wallet = new PublicKey('USERxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx');

// ── Check current tier ─────────────────────────────────────────────
const tiers = await tierService.getAllTiers();
for (const tier of tiers) {
  console.log(`${tier.name} (${tier.level}):`, {
    minStake: `${Number(tier.minStake) / 1e9} EDGE`,
    apyBonus: `+${tier.benefits.apyBonusBps / 100}%`,
    cooldownReduction: `${(1 - tier.benefits.cooldownMultiplier) * 100}%`,
    govMultiplier: `${tier.benefits.governanceMultiplier}x`,
    members: tier.memberCount,
  });
}
// Bronze (bronze): { minStake: '1000 EDGE', apyBonus: '+0.5%', cooldownReduction: '0%', govMultiplier: '1x', members: 5432 }
// Silver (silver): { minStake: '10000 EDGE', apyBonus: '+1%', cooldownReduction: '10%', govMultiplier: '1.25x', members: 2156 }
// Gold (gold):     { minStake: '100000 EDGE', apyBonus: '+2%', cooldownReduction: '25%', govMultiplier: '1.5x', members: 543 }
// Platinum (plat): { minStake: '1000000 EDGE', apyBonus: '+3%', cooldownReduction: '50%', govMultiplier: '2x', members: 87 }

// ── Check user's tier ──────────────────────────────────────────────
const userTier = await tierService.getUserTier(wallet);
console.log(`Your tier: ${userTier.name}`, userTier.benefits);

// ── Calculate governance weight ────────────────────────────────────
const weight = await govService.getGovernanceWeight(wallet);
console.log('Governance weight:', {
  totalWeight: weight.totalWeight.toString(),
  tier: weight.tier,
  tierMultiplier: weight.tierMultiplier,
  positions: weight.positions.map(p => ({
    positionId: p.positionId,
    baseWeight: p.baseWeight.toString(),
    lockupMultiplier: p.lockupMultiplier,
    finalWeight: p.finalWeight.toString(),
  })),
});
// Governance weight: {
//   totalWeight: '112500000000000',
//   tier: 'silver',
//   tierMultiplier: 1.25,
//   positions: [{
//     positionId: '660e...',
//     baseWeight: '50000000000000',
//     lockupMultiplier: 1.5,
//     finalWeight: '93750000000000'
//   }, ...]
// }

// ── Governance weight formula ──────────────────────────────────────
// weight = stakedAmount × lockupMultiplier × tierMultiplier
//
// lockupMultiplier:
//   - flexible (no lockup): 1.0x
//   - 30 days:  1.25x
//   - 90 days:  1.5x
//   - 180 days: 1.75x
//   - 365 days: 2.0x
//
// tierMultiplier:
//   - none:     0.5x
//   - bronze:   1.0x
//   - silver:   1.25x
//   - gold:     1.5x
//   - platinum: 2.0x
```

### 8. Staking Analytics

```typescript
import { StakingAnalyticsService } from '@mcv/web3-core/staking';

const analyticsService = new StakingAnalyticsService(/* deps */);

// ── Current analytics snapshot ─────────────────────────────────────
const analytics = await analyticsService.getAnalytics();
console.log('Staking overview:', {
  tvl: `${Number(analytics.tvl) / 1e9} EDGE`,
  tvlUsd: `$${analytics.tvlUsd.toLocaleString()}`,
  activeStakers: analytics.activeStakers,
  totalPositions: analytics.totalPositions,
  averageStake: `${Number(analytics.averageStake) / 1e9} EDGE`,
  weightedAPY: `${analytics.weightedAverageAPY}%`,
  rewards24h: `${Number(analytics.rewards24h) / 1e9} EDGE`,
  tierDistribution: analytics.tierDistribution,
});

// ── TVL history ────────────────────────────────────────────────────
const tvlHistory = await analyticsService.getTVLHistory({
  start: new Date('2025-01-01'),
  end: new Date('2025-03-15'),
  granularity: '1d',
});

for (const snapshot of tvlHistory.slice(-7)) {
  console.log(`${snapshot.timestamp.toISOString().split('T')[0]}: $${snapshot.tvlUsd.toLocaleString()} (${snapshot.stakerCount} stakers)`);
}

// ── Pool utilization ───────────────────────────────────────────────
for (const pool of analytics.poolUtilization) {
  const bar = '█'.repeat(Math.round(pool.utilization * 20));
  const empty = '░'.repeat(20 - Math.round(pool.utilization * 20));
  console.log(`${pool.poolName}: [${bar}${empty}] ${(pool.utilization * 100).toFixed(1)}%`);
}
// EDGE Genesis Pool: [████████████████░░░░] 80.5%
// EDGE Flex Pool:    [██████░░░░░░░░░░░░░░] 30.2%
// EDGE Pro Pool:     [████████████████████] 100.0%
```

---

## Error Codes

| Code | Constant | Description |
|------|----------|-------------|
| `STAKE_001` | `POOL_NOT_FOUND` | The specified staking pool does not exist or has been deprecated. |
| `STAKE_002` | `POOL_FULL` | The staking pool has reached its maximum capacity. |
| `STAKE_003` | `POOL_PAUSED` | The staking pool is currently paused and not accepting new stakes. |
| `STAKE_004` | `INSUFFICIENT_BALANCE` | Wallet does not hold enough EDGE tokens for the requested stake amount. |
| `STAKE_005` | `BELOW_MINIMUM_STAKE` | Stake amount is below the pool's minimum requirement. |
| `STAKE_006` | `POSITION_NOT_FOUND` | The specified staking position does not exist or is not owned by the caller. |
| `STAKE_007` | `POSITION_LOCKED` | Cannot unstake — the position is still within its lockup period. |
| `STAKE_008` | `COOLDOWN_ACTIVE` | An unstaking cooldown is already active for this position. Cannot initiate another. |
| `STAKE_009` | `COOLDOWN_NOT_EXPIRED` | Cooldown period has not yet elapsed. Cannot finalize the unstake. |
| `STAKE_010` | `NO_PENDING_REWARDS` | No rewards are pending for this position. Nothing to claim. |
| `STAKE_011` | `INVALID_LOCKUP_DURATION` | The requested lockup duration is outside the pool's allowed range. |
| `STAKE_012` | `LIQUID_STAKING_NOT_SUPPORTED` | This pool does not support liquid staking (stEDGE minting). |
| `STAKE_013` | `ALREADY_LIQUID_STAKED` | Position has already been converted to liquid staking. |
| `STAKE_014` | `INSUFFICIENT_STEDGE_BALANCE` | Wallet does not hold enough stEDGE tokens for redemption. |
| `STAKE_015` | `REWARD_VAULT_DEPLETED` | The pool's reward vault is empty. Contact pool authority. |
| `STAKE_016` | `UNAUTHORIZED_POOL_ACTION` | Caller is not authorized to modify this pool (not the authority). |
| `STAKE_017` | `INVALID_APY_CONFIGURATION` | The APY curve configuration is invalid or internally inconsistent. |
| `STAKE_018` | `SLASHING_IN_PROGRESS` | A slashing event is being processed. Staking/unstaking temporarily paused. |
| `STAKE_019` | `PARTIAL_UNSTAKE_COOLDOWN` | Must wait before initiating another partial unstake on this position. |
| `STAKE_020` | `VALIDATOR_NOT_FOUND` | The specified validator vote account was not found or is delinquent. |
| `STAKE_021` | `DELEGATION_FAILED` | On-chain delegation transaction failed. Check validator status and amount. |
| `STAKE_022` | `EXCHANGE_RATE_STALE` | The stEDGE exchange rate is stale. A rebase is required before minting/redeeming. |
| `STAKE_023` | `INSURANCE_FUND_INSUFFICIENT` | The insurance fund has insufficient balance to cover the slashing claim. |
| `STAKE_024` | `AUTO_COMPOUND_NOT_SUPPORTED` | This pool does not support auto-compounding. |
| `STAKE_025` | `EMERGENCY_UNSTAKE_DISABLED` | Emergency unstaking is disabled for this pool. |

```typescript
// Error code definitions
export const STAKING_ERROR_CODES = {
  POOL_NOT_FOUND:                 { code: 'STAKE_001', status: 404 },
  POOL_FULL:                      { code: 'STAKE_002', status: 409 },
  POOL_PAUSED:                    { code: 'STAKE_003', status: 403 },
  INSUFFICIENT_BALANCE:           { code: 'STAKE_004', status: 400 },
  BELOW_MINIMUM_STAKE:            { code: 'STAKE_005', status: 400 },
  POSITION_NOT_FOUND:             { code: 'STAKE_006', status: 404 },
  POSITION_LOCKED:                { code: 'STAKE_007', status: 409 },
  COOLDOWN_ACTIVE:                { code: 'STAKE_008', status: 409 },
  COOLDOWN_NOT_EXPIRED:           { code: 'STAKE_009', status: 409 },
  NO_PENDING_REWARDS:             { code: 'STAKE_010', status: 400 },
  INVALID_LOCKUP_DURATION:        { code: 'STAKE_011', status: 400 },
  LIQUID_STAKING_NOT_SUPPORTED:   { code: 'STAKE_012', status: 400 },
  ALREADY_LIQUID_STAKED:          { code: 'STAKE_013', status: 409 },
  INSUFFICIENT_STEDGE_BALANCE:    { code: 'STAKE_014', status: 400 },
  REWARD_VAULT_DEPLETED:          { code: 'STAKE_015', status: 503 },
  UNAUTHORIZED_POOL_ACTION:       { code: 'STAKE_016', status: 403 },
  INVALID_APY_CONFIGURATION:      { code: 'STAKE_017', status: 400 },
  SLASHING_IN_PROGRESS:           { code: 'STAKE_018', status: 503 },
  PARTIAL_UNSTAKE_COOLDOWN:       { code: 'STAKE_019', status: 429 },
  VALIDATOR_NOT_FOUND:            { code: 'STAKE_020', status: 404 },
  DELEGATION_FAILED:              { code: 'STAKE_021', status: 500 },
  EXCHANGE_RATE_STALE:            { code: 'STAKE_022', status: 503 },
  INSURANCE_FUND_INSUFFICIENT:    { code: 'STAKE_023', status: 503 },
  AUTO_COMPOUND_NOT_SUPPORTED:    { code: 'STAKE_024', status: 400 },
  EMERGENCY_UNSTAKE_DISABLED:     { code: 'STAKE_025', status: 403 },
} as const;
```

---

## Security Considerations

Staking involves real financial assets. Every operation must be defended against manipulation, loss of funds, and exploitation.

### Transaction Security

```
┌──────────────────────────────────────────────────────────────────────┐
│                    STAKING SECURITY LAYERS                           │
│                                                                      │
│  Layer 1: Input Validation                                          │
│  ├─ Validate all amounts (BN overflow, zero-check, min/max)        │
│  ├─ Validate public keys (on-curve check, PDA derivation)          │
│  ├─ Validate pool exists and is active                              │
│  ├─ Validate wallet owns the position                               │
│  └─ Validate lockup period hasn't expired / hasn't started          │
│                                                                      │
│  Layer 2: Authorization                                              │
│  ├─ Pool authority verified for admin operations                    │
│  ├─ Position owner verified for stake/unstake/claim                 │
│  ├─ Multi-sig required for pool creation (production)               │
│  └─ Rate limiting on claim operations                               │
│                                                                      │
│  Layer 3: On-Chain Verification                                      │
│  ├─ Anchor program validates all account constraints                │
│  ├─ PDA seeds verified — no spoofing of pool/position accounts     │
│  ├─ Token account ownership verified                                │
│  ├─ Reward vault balance checked before distribution                │
│  └─ Slashing amount capped by insurance fund coverage               │
│                                                                      │
│  Layer 4: Economic Security                                          │
│  ├─ Emergency unstake penalty prevents flash-stake attacks          │
│  ├─ Cooldown period prevents timing exploitation                    │
│  ├─ APY caps prevent runaway reward emission                        │
│  ├─ Pool capacity caps prevent concentration risk                   │
│  └─ Insurance fund protects against slashing losses                 │
│                                                                      │
│  Layer 5: Operational Security                                       │
│  ├─ Off-chain state is read-only mirror (on-chain is source of truth) │
│  ├─ Sync discrepancies trigger alerts and auto-reconciliation       │
│  ├─ All admin actions are logged and auditable                      │
│  └─ Reward distribution is deterministic and verifiable             │
└──────────────────────────────────────────────────────────────────────┘
```

### Input Validation Rules

| Field | Validation | Rationale |
|-------|-----------|-----------|
| `amount` | `> 0`, `<= wallet balance`, `>= pool minimum`, `<= pool remaining capacity` | Prevent zero-stake, overdraft, underfunded positions, overcrowded pools |
| `poolId` | Must exist, must be `active` status | Prevent staking into deprecated or nonexistent pools |
| `wallet` | Must be on Ed25519 curve, must sign the transaction | Prevent spoofed wallet addresses |
| `lockupSeconds` | `>= pool.minLockupSeconds`, `<= pool.maxLockupSeconds` | Enforce pool-defined lockup range |
| `unstake amount` | `<= position.stakedAmount`, `> 0`, respects partial cooldown timer | Prevent over-withdrawal |
| `cooldown finalize` | `cooldown.expiresAt <= now()` | Prevent premature withdrawal |
| `APY config` | `baseAPYBps <= 10000` (100%), tiers must be monotonic, dynamic range valid | Prevent absurd yields or misconfigured curves |
| `slashRateBps` | `<= 10000`, `> 0` for active conditions | Prevent over-slashing (>100%) |

### Critical Security Practices

1. **On-Chain as Source of Truth**: The Supabase database is a **read-only mirror** of on-chain state. Never trust off-chain data for financial operations. All staking, unstaking, and reward claims execute through Anchor programs with full on-chain verification.

2. **PDA Derivation**: All accounts (pools, positions, vaults) use Program Derived Addresses with deterministic seeds. The staking program validates PDA derivation on every instruction — no account spoofing is possible.

3. **Reward Vault Isolation**: Each pool has its own reward vault PDA. Rewards can only flow from the vault to verified stakers through the program. The vault cannot be drained by the pool authority without going through the program's withdrawal instruction (which has its own safeguards).

4. **Cooldown Enforcement**: Cooldown periods are enforced on-chain. The `finalize_unstake` instruction checks the cooldown timestamp against the Solana clock. No off-chain bypass is possible.

5. **Slashing Limits**: Slashing is capped at the configured `slashRateBps` and cannot exceed the staked amount. Insurance fund claims are processed separately and are subject to fund balance checks.

6. **Rate Limiting**: Claim operations are rate-limited to prevent spam. Auto-compound frequency is bounded to prevent excessive transaction generation.

7. **Reentrancy Protection**: Anchor programs use account ownership checks and CPI guards to prevent reentrancy attacks during token transfers.

8. **Exchange Rate Manipulation**: The stEDGE exchange rate is calculated from total supply and total backing at rebase time. Flash-loan attacks are mitigated by the cooldown period on redemption and the rebase interval.

9. **Front-Running Protection**: Stake and unstake transactions use recent blockhash and reasonable compute budget. Critical reward calculations use on-chain snapshots, not real-time data that could be manipulated between blocks.

10. **Audit Trail**: Every state change is logged with the triggering transaction signature, enabling full auditability. Slashing events include evidence hashes for off-chain verification.

---

## Environment Variables

```bash
# ── Solana Connection ───────────────────────────────────────────────
SOLANA_RPC_URL=https://api.mainnet-beta.solana.com
SOLANA_WS_URL=wss://api.mainnet-beta.solana.com

# ── Staking Program ────────────────────────────────────────────────
STAKING_PROGRAM_ID=StKxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
LIQUID_STAKING_PROGRAM_ID=LqSxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# ── Token Mints ─────────────────────────────────────────────────────
EDGE_MINT=EDGExxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
STEDGE_MINT=stEDxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# ── Authority Keys (for server-side operations) ─────────────────────
# These are used for automated reward distribution and pool management.
# NEVER commit these to version control.
STAKING_AUTHORITY_KEYPAIR_PATH=/secrets/staking-authority.json
REWARD_DISTRIBUTOR_KEYPAIR_PATH=/secrets/reward-distributor.json

# ── Database ────────────────────────────────────────────────────────
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
DATABASE_URL=postgresql://user:pass@host:5432/mcv

# ── Event Listening ─────────────────────────────────────────────────
HELIUS_API_KEY=your-helius-api-key
HELIUS_WEBHOOK_SECRET=your-webhook-secret
GEYSER_PLUGIN_URL=grpc://geyser.your-host.com:10000

# ── Reward Distribution ────────────────────────────────────────────
REWARD_DISTRIBUTION_INTERVAL_MS=3600000        # 1 hour
REWARD_DISTRIBUTION_BATCH_SIZE=100             # Positions per TX
AUTO_COMPOUND_FREQUENCY_MS=86400000            # 24 hours

# ── Liquid Staking ──────────────────────────────────────────────────
STEDGE_REBASE_INTERVAL_MS=86400000             # 24 hours
STEDGE_EXCHANGE_RATE_CACHE_TTL_MS=60000        # 1 minute cache

# ── Analytics ───────────────────────────────────────────────────────
ANALYTICS_SNAPSHOT_INTERVAL_MS=3600000         # Hourly snapshots
TVL_PRICE_FEED_URL=https://api.coingecko.com/api/v3
EDGE_PRICE_COINGECKO_ID=edge-token

# ── Insurance Fund ──────────────────────────────────────────────────
INSURANCE_FUND_ADDRESS=InSxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
INSURANCE_FUND_TARGET_RATIO=0.05               # 5% of TVL

# ── Rate Limits ─────────────────────────────────────────────────────
CLAIM_RATE_LIMIT_PER_WALLET=10                 # Claims per hour
STAKE_RATE_LIMIT_PER_WALLET=20                 # Stake operations per hour
EMERGENCY_UNSTAKE_RATE_LIMIT=1                 # Per 24 hours

# ── Feature Flags ──────────────────────────────────────────────────
ENABLE_LIQUID_STAKING=true
ENABLE_AUTO_COMPOUND=true
ENABLE_VALIDATOR_DELEGATION=true
ENABLE_SLASHING=true
ENABLE_EMERGENCY_UNSTAKE=true
```

---

## Dependencies

### Internal Dependencies

| Module | Usage |
|--------|-------|
| `@mcv/web3-core/tokens` | EDGE token operations — balance checks, transfers, mint info |
| `@mcv/web3-core/governance` | Voting power integration — publish governance weights from staking positions |
| `@mcv/web3-core/treasury` | Reward funding — treasury authorizes reward vault replenishment; insurance fund management |
| `@mcv/web3-core/wallets` | Wallet resolution — map wallet addresses to user accounts for off-chain queries |
| `@mcv/web3-core/programs` | Anchor program management — IDL loading, program client creation |
| `@mcv/shared/db` | Database client — Drizzle ORM instance, connection pool |
| `@mcv/shared/trpc` | tRPC router registration and middleware |
| `@mcv/shared/errors` | Standardized error handling and error code registry |
| `@mcv/shared/logging` | Structured logging for staking operations |
| `@mcv/shared/cache` | Redis/in-memory caching for APY calculations, exchange rates |

### External Dependencies

| Package | Version | Usage |
|---------|---------|-------|
| `@coral-xyz/anchor` | `^0.30.x` | Anchor framework for Solana program interaction |
| `@solana/web3.js` | `^1.95.x` | Solana JSON-RPC client, transaction building |
| `@solana/spl-token` | `^0.4.x` | SPL token operations (EDGE, stEDGE) |
| `drizzle-orm` | `^0.33.x` | Database ORM for off-chain state |
| `drizzle-zod` | `^0.5.x` | Zod schema generation from Drizzle schemas |
| `zod` | `^3.23.x` | Input validation for tRPC procedures |
| `bn.js` | `^5.2.x` | Big number arithmetic for token amounts |
| `decimal.js` | `^10.4.x` | Precise decimal arithmetic for APY calculations |
| `cron` | `^3.1.x` | Scheduled reward distribution and analytics snapshots |
| `bullmq` | `^5.x` | Job queue for async reward distribution processing |

---

## Testing

### Test Strategy

```
┌──────────────────────────────────────────────────────────────────────┐
│                       TEST PYRAMID                                   │
│                                                                      │
│                        ┌────────┐                                   │
│                       │  E2E   │  Devnet integration                │
│                      │ Tests  │  Real Solana transactions           │
│                     └────────┘                                      │
│                   ┌──────────────┐                                  │
│                  │ Integration  │  Anchor test validator            │
│                 │    Tests     │  Full program + DB                 │
│                └──────────────┘                                     │
│             ┌──────────────────────┐                                │
│            │     Unit Tests       │  Pure logic, mocked deps       │
│           │  Yield calc, tiers   │  No blockchain, no DB           │
│          └──────────────────────┘                                   │
└──────────────────────────────────────────────────────────────────────┘
```

### Unit Tests

```typescript
import { describe, it, expect } from 'vitest';
import { calculateAPY } from '@mcv/web3-core/staking';
import { BN } from '@coral-xyz/anchor';

describe('calculateAPY', () => {
  it('should calculate flat APY correctly', () => {
    const apy = calculateAPY({
      type: 'flat',
      baseAPYBps: 800, // 8%
      lockupBonusBpsPerMonth: 0,
    }, {
      totalStaked: new BN(1_000_000e9),
      maxCapacity: new BN(10_000_000e9),
      lockupMonths: 0,
    });
    
    expect(apy).toBe(8.0);
  });
  
  it('should apply tiered APY based on total staked', () => {
    const apy = calculateAPY({
      type: 'tiered',
      baseAPYBps: 800,
      tiers: [
        { threshold: new BN(0), apyBps: 800 },
        { threshold: new BN(1_000_000e9), apyBps: 1000 },
      ],
      lockupBonusBpsPerMonth: 0,
    }, {
      totalStaked: new BN(5_000_000e9), // Above 1M threshold
      maxCapacity: new BN(100_000_000e9),
      lockupMonths: 0,
    });
    
    expect(apy).toBe(10.0);
  });
  
  it('should add lockup bonus', () => {
    const apy = calculateAPY({
      type: 'flat',
      baseAPYBps: 800,
      lockupBonusBpsPerMonth: 25, // +0.25% per month
    }, {
      totalStaked: new BN(1_000_000e9),
      maxCapacity: new BN(10_000_000e9),
      lockupMonths: 6, // 6 months lockup
    });
    
    // 8% base + (0.25% × 6 months) = 9.5%
    expect(apy).toBe(9.5);
  });
  
  it('should handle dynamic APY based on utilization', () => {
    const apy = calculateAPY({
      type: 'dynamic',
      baseAPYBps: 800,
      dynamic: {
        maxAPYBps: 1500,
        minAPYBps: 300,
        targetUtilization: 0.7,
        steepness: 2,
      },
      lockupBonusBpsPerMonth: 0,
    }, {
      totalStaked: new BN(3_000_000e9),  // 30% utilization
      maxCapacity: new BN(10_000_000e9),
      lockupMonths: 0,
    });
    
    // Low utilization → higher APY (closer to max)
    expect(apy).toBeGreaterThan(10.0);
    expect(apy).toBeLessThanOrEqual(15.0);
  });
});

describe('calculateGovernanceWeight', () => {
  it('should calculate weight with lockup and tier multipliers', () => {
    const weight = calculateGovernanceWeight({
      stakedAmount: new BN(50_000e9),
      lockupDays: 90,
      tierLevel: 'silver',
    });
    
    // 50,000 × 1.5 (90d lockup) × 1.25 (silver) = 93,750
    expect(weight.toString()).toBe(new BN(93_750e9).toString());
  });
  
  it('should apply minimum multiplier for no-tier stakers', () => {
    const weight = calculateGovernanceWeight({
      stakedAmount: new BN(100e9),
      lockupDays: 0,
      tierLevel: 'none',
    });
    
    // 100 × 1.0 (flexible) × 0.5 (none) = 50
    expect(weight.toString()).toBe(new BN(50e9).toString());
  });
});

describe('calculateSlashAmount', () => {
  it('should calculate slash correctly', () => {
    const result = calculateSlashAmount({
      stakedAmount: new BN(100_000e9),
      slashRateBps: 500, // 5%
    });
    
    expect(result.slashedAmount.toString()).toBe(new BN(5_000e9).toString());
    expect(result.remainingAmount.toString()).toBe(new BN(95_000e9).toString());
  });
  
  it('should cap slash at staked amount', () => {
    const result = calculateSlashAmount({
      stakedAmount: new BN(100e9),
      slashRateBps: 15000, // 150% — should cap at 100%
    });
    
    expect(result.slashedAmount.toString()).toBe(new BN(100e9).toString());
    expect(result.remainingAmount.toString()).toBe(new BN(0).toString());
  });
});
```

### Integration Tests (Anchor Test Validator)

```typescript
import { describe, it, beforeAll, expect } from 'vitest';
import { AnchorProvider, Program, BN } from '@coral-xyz/anchor';
import { Keypair, PublicKey, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { StakingService } from '@mcv/web3-core/staking';

describe('Staking Integration', () => {
  let provider: AnchorProvider;
  let stakingService: StakingService;
  let poolId: string;
  let userKeypair: Keypair;
  let positionId: string;

  beforeAll(async () => {
    // Start local validator with staking program deployed
    provider = AnchorProvider.env();
    userKeypair = Keypair.generate();
    
    // Airdrop SOL for transaction fees
    const sig = await provider.connection.requestAirdrop(
      userKeypair.publicKey,
      10 * LAMPORTS_PER_SOL
    );
    await provider.connection.confirmTransaction(sig);
    
    // Initialize staking service with test database
    stakingService = new StakingService({
      connection: provider.connection,
      db: testDb, // Test Supabase instance
    });
    
    // Create a test pool
    const pool = await stakingService.createPool({
      name: 'Test Pool',
      description: 'Integration test pool',
      stakeMint: EDGE_MINT_DEVNET,
      authority: userKeypair.publicKey,
      apy: { type: 'flat', baseAPYBps: 1000, lockupBonusBpsPerMonth: 0 },
      minLockupSeconds: 0,
      maxLockupSeconds: 365 * 24 * 60 * 60,
      cooldownSeconds: 60, // 1 minute for testing
      maxCapacity: new BN(1_000_000e9),
      emergencyUnstakePenaltyBps: 500,
      supportsAutoCompound: true,
      supportsLiquidStaking: true,
      initialRewardFunding: new BN(100_000e9),
    });
    poolId = pool.id;
  });

  it('should stake tokens into a pool', async () => {
    const { transaction, positionId: pid } = await stakingService.stake({
      wallet: userKeypair.publicKey,
      poolId,
      amount: new BN(10_000e9),
      lockupSeconds: 0, // Flexible
    });
    positionId = pid;
    
    // Sign and send
    transaction.sign(userKeypair);
    const txSig = await provider.connection.sendRawTransaction(
      transaction.serialize()
    );
    await provider.connection.confirmTransaction(txSig);
    
    // Verify position was created
    const position = await stakingService.getPosition(positionId);
    expect(position).not.toBeNull();
    expect(position!.status).toBe('active');
    expect(position!.stakedAmount.toString()).toBe(new BN(10_000e9).toString());
  });

  it('should calculate pending rewards after time passes', async () => {
    // Fast-forward the local validator clock (or mock time)
    // In real tests, use bankrun or solana-test-validator --warp-slot
    
    const { amount } = await stakingService.getPendingRewards(positionId);
    expect(amount.gt(new BN(0))).toBe(true);
  });

  it('should unstake with cooldown', async () => {
    const { transaction, cooldown } = await stakingService.unstake({
      positionId,
      wallet: userKeypair.publicKey,
      amount: null,
    });
    
    transaction.sign(userKeypair);
    await provider.connection.sendRawTransaction(transaction.serialize());
    
    expect(cooldown.status).toBe('active');
    expect(cooldown.durationSeconds).toBe(60);
    
    // Wait for cooldown
    await new Promise(resolve => setTimeout(resolve, 65_000));
    
    // Finalize
    const finalizeTx = await stakingService.finalizeUnstake(
      positionId,
      userKeypair.publicKey
    );
    finalizeTx.sign(userKeypair);
    await provider.connection.sendRawTransaction(finalizeTx.serialize());
    
    const position = await stakingService.getPosition(positionId);
    expect(position!.status).toBe('withdrawn');
  });

  it('should enforce pool capacity limits', async () => {
    // Attempt to stake more than remaining capacity
    await expect(
      stakingService.stake({
        wallet: userKeypair.publicKey,
        poolId,
        amount: new BN(2_000_000e9), // Exceeds 1M cap
        lockupSeconds: 0,
      })
    ).rejects.toThrow('STAKE_002');
  });

  it('should prevent unstaking during lockup', async () => {
    // Create a locked position
    const { transaction, positionId: lockedId } = await stakingService.stake({
      wallet: userKeypair.publicKey,
      poolId,
      amount: new BN(1_000e9),
      lockupSeconds: 365 * 24 * 60 * 60, // 1 year
    });
    
    transaction.sign(userKeypair);
    await provider.connection.sendRawTransaction(transaction.serialize());
    
    // Attempt to unstake — should fail
    await expect(
      stakingService.unstake({
        positionId: lockedId,
        wallet: userKeypair.publicKey,
        amount: null,
      })
    ).rejects.toThrow('STAKE_007');
  });
});
```

### Running Tests

```bash
# Unit tests (fast, no blockchain)
pnpm test:unit --filter=@mcv/web3-core-staking

# Integration tests (requires local validator)
pnpm test:integration --filter=@mcv/web3-core-staking

# E2E tests (devnet, real transactions)
SOLANA_CLUSTER=devnet pnpm test:e2e --filter=@mcv/web3-core-staking

# Test coverage
pnpm test:coverage --filter=@mcv/web3-core-staking

# Watch mode during development
pnpm test:watch --filter=@mcv/web3-core-staking
```

### Test Fixtures

```typescript
// test/fixtures/pools.ts
import { BN } from '@coral-xyz/anchor';

export const TEST_POOLS = {
  flexible: {
    name: 'Test Flex Pool',
    minLockupSeconds: 0,
    maxLockupSeconds: 0,
    cooldownSeconds: 60,
    apy: { type: 'flat' as const, baseAPYBps: 500, lockupBonusBpsPerMonth: 0 },
    maxCapacity: new BN(1_000_000e9),
    emergencyUnstakePenaltyBps: 300,
  },
  locked: {
    name: 'Test Lock Pool',
    minLockupSeconds: 86400, // 1 day
    maxLockupSeconds: 2592000, // 30 days
    cooldownSeconds: 300, // 5 minutes
    apy: { type: 'flat' as const, baseAPYBps: 1200, lockupBonusBpsPerMonth: 50 },
    maxCapacity: new BN(500_000e9),
    emergencyUnstakePenaltyBps: 1000,
  },
  tiered: {
    name: 'Test Tiered Pool',
    minLockupSeconds: 0,
    maxLockupSeconds: 31536000, // 1 year
    cooldownSeconds: 120,
    apy: {
      type: 'tiered' as const,
      baseAPYBps: 800,
      tiers: [
        { threshold: new BN(0), apyBps: 800 },
        { threshold: new BN(100_000e9), apyBps: 1000 },
        { threshold: new BN(500_000e9), apyBps: 600 },
      ],
      lockupBonusBpsPerMonth: 25,
    },
    maxCapacity: new BN(2_000_000e9),
    emergencyUnstakePenaltyBps: 500,
  },
};
```

---

## tRPC Router

```typescript
import { router, protectedProcedure, publicProcedure } from '@mcv/shared/trpc';
import { z } from 'zod';

export const stakingRouter = router({
  // ── Public Endpoints ─────────────────────────────────────────────
  
  listPools: publicProcedure
    .input(z.object({
      status: z.array(z.enum(['active', 'paused', 'deprecated', 'full'])).optional(),
      minAPY: z.number().optional(),
      hasCapacity: z.boolean().optional(),
      sortBy: z.enum(['apy', 'totalStaked', 'createdAt']).optional(),
      sortOrder: z.enum(['asc', 'desc']).optional(),
      page: z.number().min(1).default(1),
      pageSize: z.number().min(1).max(100).default(20),
    }).optional())
    .query(async ({ ctx, input }) => {
      return ctx.stakingService.listPools(input);
    }),
  
  getPool: publicProcedure
    .input(z.object({ poolId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      return ctx.stakingService.getPool(input.poolId);
    }),
  
  getExchangeRate: publicProcedure
    .query(async ({ ctx }) => {
      return ctx.stakingService.getExchangeRate();
    }),
  
  getAnalytics: publicProcedure
    .query(async ({ ctx }) => {
      return ctx.stakingService.getAnalytics();
    }),
  
  getTVLHistory: publicProcedure
    .input(z.object({
      start: z.string().datetime(),
      end: z.string().datetime(),
      granularity: z.enum(['1h', '6h', '1d', '7d', '30d']),
    }))
    .query(async ({ ctx, input }) => {
      return ctx.stakingService.getTVLHistory({
        start: new Date(input.start),
        end: new Date(input.end),
        granularity: input.granularity,
      });
    }),
  
  getTiers: publicProcedure
    .query(async ({ ctx }) => {
      return ctx.stakingTierService.getAllTiers();
    }),

  // ── Protected Endpoints (require wallet auth) ────────────────────
  
  stake: protectedProcedure
    .input(z.object({
      poolId: z.string().uuid(),
      amount: z.string(), // BN as string
      lockupSeconds: z.number().min(0),
      autoCompound: z.boolean().optional(),
      mintLiquidToken: z.boolean().optional(),
      referralCode: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      return ctx.stakingService.stake({
        wallet: ctx.wallet,
        poolId: input.poolId,
        amount: new BN(input.amount),
        lockupSeconds: input.lockupSeconds,
        autoCompound: input.autoCompound,
        mintLiquidToken: input.mintLiquidToken,
        referralCode: input.referralCode,
      });
    }),
  
  unstake: protectedProcedure
    .input(z.object({
      positionId: z.string().uuid(),
      amount: z.string().nullable(), // null = full unstake
      emergency: z.boolean().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      if (input.emergency) {
        return ctx.stakingService.emergencyUnstake(input.positionId, ctx.wallet);
      }
      return ctx.stakingService.unstake({
        positionId: input.positionId,
        wallet: ctx.wallet,
        amount: input.amount ? new BN(input.amount) : null,
      });
    }),
  
  finalizeUnstake: protectedProcedure
    .input(z.object({ positionId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      return ctx.stakingService.finalizeUnstake(input.positionId, ctx.wallet);
    }),
  
  getPositions: protectedProcedure
    .input(z.object({
      status: z.array(z.enum([
        'active', 'locked', 'cooldown', 'ready_to_claim',
        'withdrawn', 'slashed', 'liquid_staked',
      ])).optional(),
      poolId: z.string().uuid().optional(),
    }).optional())
    .query(async ({ ctx, input }) => {
      return ctx.stakingService.getPositions(ctx.wallet, input);
    }),
  
  getPendingRewards: protectedProcedure
    .input(z.object({ positionId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      return ctx.stakingService.getPendingRewards(input.positionId);
    }),
  
  claimRewards: protectedProcedure
    .input(z.object({ positionId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      return ctx.stakingService.claimRewards(input.positionId, ctx.wallet);
    }),
  
  claimAllRewards: protectedProcedure
    .mutation(async ({ ctx }) => {
      return ctx.stakingService.claimAllRewards(ctx.wallet);
    }),
  
  setAutoCompound: protectedProcedure
    .input(z.object({
      positionId: z.string().uuid(),
      enabled: z.boolean(),
    }))
    .mutation(async ({ ctx, input }) => {
      return ctx.stakingService.setAutoCompound(input.positionId, input.enabled);
    }),
  
  mintLiquidStakeToken: protectedProcedure
    .input(z.object({ positionId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      return ctx.stakingService.mintLiquidStakeToken(input.positionId, ctx.wallet);
    }),
  
  redeemLiquidStakeToken: protectedProcedure
    .input(z.object({ amount: z.string() }))
    .mutation(async ({ ctx, input }) => {
      return ctx.stakingService.redeemLiquidStakeToken(new BN(input.amount), ctx.wallet);
    }),
  
  getGovernanceWeight: protectedProcedure
    .query(async ({ ctx }) => {
      return ctx.stakingService.getGovernanceWeight(ctx.wallet);
    }),
  
  getRewardHistory: protectedProcedure
    .input(z.object({
      positionId: z.string().uuid().optional(),
      page: z.number().min(1).default(1),
      pageSize: z.number().min(1).max(100).default(20),
    }))
    .query(async ({ ctx, input }) => {
      return ctx.stakingService.getRewardHistory(
        { positionId: input.positionId, wallet: ctx.wallet },
        { page: input.page, pageSize: input.pageSize }
      );
    }),
});
```

---

## Related Modules

| Module | Relationship |
|--------|-------------|
| [`@mcv/web3-core/tokens`](../tokens/MODULE.md) | EDGE token balance checks, transfers, mint info for staking operations |
| [`@mcv/web3-core/governance`](../governance/MODULE.md) | Consumes governance weights from staking to determine voting power |
| [`@mcv/web3-core/treasury`](../treasury/MODULE.md) | Funds reward vaults, manages insurance fund allocations |
| [`@mcv/web3-core/programs`](../programs/MODULE.md) | Anchor program client creation for staking and liquid staking programs |
| [`@mcv/web3-core/wallets`](../wallets/MODULE.md) | Wallet resolution for mapping on-chain addresses to platform users |

---

*Last updated: 2025-03-15 · Module owner: @web3-team · Status: Active Development*