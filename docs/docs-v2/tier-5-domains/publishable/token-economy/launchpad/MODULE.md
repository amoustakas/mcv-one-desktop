# @mcv/token-economy/launchpad

> **Tier 5 — Domain Module | Publishable**

**Token launch infrastructure — IDO/IEO management, whitelist allocation, fair launch mechanisms, vesting contracts, and secondary market bootstrapping.**

---

## Purpose

The launchpad module provides end-to-end infrastructure for launching new tokens within the EDGE ecosystem. Token launches are among the highest-stakes operations in any crypto platform: they involve large capital flows, strict regulatory requirements, complex timing coordination, and significant trust expectations from participants. This module codifies the entire launch lifecycle — from initial configuration and whitelist management through the sale event itself, post-sale vesting, and secondary market listing — into a deterministic, auditable pipeline that eliminates the manual coordination and ad-hoc scripting that plagues most launch platforms.

At its core, the launchpad treats each token launch as a finite state machine with well-defined phases: announcement, whitelist registration, KYC verification, allocation calculation, the sale window, token distribution, vesting schedule activation, and finally DEX/CEX listing. Each phase transition is gated by configurable preconditions, ensuring that launches proceed only when all requirements are satisfied. The module supports multiple sale mechanisms — fixed-price offerings, Dutch auctions, overflow models, and liquidity bootstrapping pools (LBPs) — allowing project teams to choose the pricing discovery method that best fits their tokenomics.

The launchpad integrates deeply with other token-economy modules: it reads staking positions from `@mcv/token-economy/staking` to calculate allocation tiers, queries KYC status from the compliance layer, coordinates with `@mcv/token-economy/liquidity` for post-launch market bootstrapping, and feeds launch analytics into the broader platform metrics pipeline. Every financial operation is double-entry recorded, every allocation decision is cryptographically attributable, and every vesting release is verifiable on-chain. The module is designed to handle launches ranging from small community token offerings (sub-$100K) to large-scale IDOs ($10M+) with thousands of participants and complex multi-tranche vesting.

---

## Exports

```typescript
// @mcv/token-economy/launchpad — public API

// ── Core Services ──────────────────────────────────────────────
export { LaunchpadService }          from './services/launchpad.service';
export { WhitelistService }          from './services/whitelist.service';
export { AllocationService }         from './services/allocation.service';
export { VestingService }            from './services/vesting.service';
export { SaleExecutionService }      from './services/sale-execution.service';
export { FairLaunchService }         from './services/fair-launch.service';
export { LaunchAnalyticsService }    from './services/launch-analytics.service';
export { RefundService }             from './services/refund.service';
export { LaunchComplianceService }   from './services/launch-compliance.service';
export { MarketBootstrapService }    from './services/market-bootstrap.service';

// ── Core Interfaces ────────────────────────────────────────────
export type { Launch }               from './interfaces/launch';
export type { LaunchConfig }         from './interfaces/launch-config';
export type { LaunchPhase }          from './interfaces/launch-phase';
export type { WhitelistEntry }       from './interfaces/whitelist-entry';
export type { AllocationTier }       from './interfaces/allocation-tier';
export type { Allocation }           from './interfaces/allocation';
export type { VestingContract }      from './interfaces/vesting-contract';
export type { VestingSchedule }      from './interfaces/vesting-schedule';
export type { VestingRelease }       from './interfaces/vesting-release';
export type { FairLaunchConfig }     from './interfaces/fair-launch-config';
export type { DutchAuctionConfig }   from './interfaces/dutch-auction-config';
export type { LBPConfig }            from './interfaces/lbp-config';
export type { OverflowConfig }       from './interfaces/overflow-config';
export type { SaleResult }           from './interfaces/sale-result';
export type { Participation }        from './interfaces/participation';
export type { RefundRecord }         from './interfaces/refund-record';
export type { LaunchMetrics }        from './interfaces/launch-metrics';
export type { ListingConfig }        from './interfaces/listing-config';
export type { MarketBootstrap }      from './interfaces/market-bootstrap';

// ── Enums ──────────────────────────────────────────────────────
export { LaunchStatus }              from './enums/launch-status';
export { LaunchType }                from './enums/launch-type';
export { SaleMechanism }            from './enums/sale-mechanism';
export { PhaseType }                 from './enums/phase-type';
export { VestingType }               from './enums/vesting-type';
export { AllocationMethod }          from './enums/allocation-method';
export { RefundReason }              from './enums/refund-reason';
export { WhitelistStatus }           from './enums/whitelist-status';

// ── DB Schemas ─────────────────────────────────────────────────
export { launches }                  from './db/schema/launches';
export { whitelistEntries }          from './db/schema/whitelist-entries';
export { allocations }               from './db/schema/allocations';
export { vestingContracts }          from './db/schema/vesting-contracts';
export { vestingReleases }           from './db/schema/vesting-releases';
export { launchPhases }              from './db/schema/launch-phases';
export { participationRecords }      from './db/schema/participation-records';
export { refundRecords }             from './db/schema/refund-records';
export { launchSnapshots }           from './db/schema/launch-snapshots';

// ── Validators ─────────────────────────────────────────────────
export { launchConfigSchema }        from './validators/launch-config.validator';
export { vestingScheduleSchema }     from './validators/vesting-schedule.validator';
export { fairLaunchConfigSchema }    from './validators/fair-launch-config.validator';
export { whitelistEntrySchema }      from './validators/whitelist-entry.validator';
export { allocationTierSchema }      from './validators/allocation-tier.validator';

// ── Events ─────────────────────────────────────────────────────
export { LaunchpadEvents }           from './events/launchpad.events';
export type { LaunchCreatedEvent }   from './events/launch-created.event';
export type { PhaseTransitionEvent } from './events/phase-transition.event';
export type { SaleCompletedEvent }   from './events/sale-completed.event';
export type { VestingClaimedEvent }  from './events/vesting-claimed.event';
export type { RefundIssuedEvent }    from './events/refund-issued.event';

// ── Utilities ──────────────────────────────────────────────────
export { calculateAllocation }       from './utils/allocation-calculator';
export { buildVestingSchedule }      from './utils/vesting-builder';
export { computeLBPPrice }           from './utils/lbp-pricing';
export { computeDutchAuctionPrice }  from './utils/dutch-auction-pricing';
export { validateLaunchTimeline }    from './utils/timeline-validator';
```

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         LAUNCHPAD MODULE                                    │
│                                                                             │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐                  │
│  │  Launch       │    │  Whitelist    │    │  Allocation   │                  │
│  │  Config       │───▶│  Management  │───▶│  Engine       │                  │
│  │              │    │              │    │              │                  │
│  │ - Token info  │    │ - KYC gate   │    │ - Tier calc  │                  │
│  │ - Sale type   │    │ - Lottery    │    │ - EDGE stake │                  │
│  │ - Timeline    │    │ - Guaranteed │    │ - ACS score  │                  │
│  │ - Hard/soft   │    │ - Waitlist   │    │ - Max alloc  │                  │
│  │   cap         │    │              │    │              │                  │
│  └──────┬───────┘    └──────────────┘    └──────┬───────┘                  │
│         │                                        │                          │
│         ▼                                        ▼                          │
│  ┌──────────────────────────────────────────────────────┐                   │
│  │                 SALE EXECUTION ENGINE                 │                   │
│  │                                                      │                   │
│  │  ┌────────────┐ ┌────────────┐ ┌────────────────┐   │                   │
│  │  │ Fixed Price│ │Dutch       │ │ LBP            │   │                   │
│  │  │ Sale       │ │Auction     │ │ (Liquidity     │   │                   │
│  │  │            │ │            │ │  Bootstrapping │   │                   │
│  │  │ FCFS /     │ │ Descending │ │  Pool)         │   │                   │
│  │  │ Guaranteed │ │ price      │ │                │   │                   │
│  │  └────────────┘ └────────────┘ └────────────────┘   │                   │
│  │  ┌────────────┐ ┌────────────┐                      │                   │
│  │  │ Overflow   │ │ Sealed Bid │                      │                   │
│  │  │ Model      │ │ Auction    │                      │                   │
│  │  │            │ │            │                      │                   │
│  │  │ Pro-rata   │ │ Commit-    │                      │                   │
│  │  │ refund     │ │ reveal     │                      │                   │
│  │  └────────────┘ └────────────┘                      │                   │
│  └──────────────────────┬───────────────────────────────┘                   │
│                         │                                                   │
│         ┌───────────────┼───────────────┐                                   │
│         ▼               ▼               ▼                                   │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐                        │
│  │  Vesting      │ │  Market       │ │  Launch       │                        │
│  │  Engine       │ │  Bootstrap    │ │  Analytics    │                        │
│  │              │ │              │ │              │                        │
│  │ - Cliff      │ │ - DEX liq    │ │ - Fill rate  │                        │
│  │ - Linear     │ │ - CEX list   │ │ - Raise amt  │                        │
│  │ - Custom     │ │ - Market     │ │ - Dist stats │                        │
│  │ - Milestone  │ │   maker      │ │ - Price perf │                        │
│  └──────────────┘ └──────────────┘ └──────────────┘                        │
│                                                                             │
│  ┌──────────────────────────────────────────────────────────────────────┐   │
│  │                         LAUNCH PHASE PIPELINE                        │   │
│  │                                                                      │   │
│  │  ANNOUNCE ──▶ WHITELIST ──▶ KYC ──▶ SNAPSHOT ──▶ SALE ──▶ SETTLE    │   │
│  │     │            │          │          │          │          │        │   │
│  │     ▼            ▼          ▼          ▼          ▼          ▼        │   │
│  │  publish      open reg   verify    calc tiers  execute   finalize   │   │
│  │  details      accept     KYC/AML   freeze      sale      results   │   │
│  │  countdown    entries    status     allocs      window    refunds   │   │
│  │                                                                      │   │
│  │  ──▶ DISTRIBUTE ──▶ VEST ──▶ LIST ──▶ COMPLETE                      │   │
│  │         │            │         │          │                           │   │
│  │         ▼            ▼         ▼          ▼                           │   │
│  │      send TGE     activate  add DEX    archive                      │   │
│  │      tokens       vesting   liquidity  launch                       │   │
│  │      to users     schedule  CEX list   data                         │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  ┌──────────────────────────────────────────────────────────────────────┐   │
│  │                        EXTERNAL INTEGRATIONS                         │   │
│  │                                                                      │   │
│  │  @mcv/staking ◄──── allocation tier calculation (EDGE staked)       │   │
│  │  @mcv/compliance ◄── KYC/AML verification, jurisdiction checks      │   │
│  │  @mcv/liquidity ◄── post-launch DEX pool provisioning               │   │
│  │  @mcv/treasury ◄── raise fund custody, fee distribution             │   │
│  │  @mcv/governance ◄── launch approval votes, parameter changes       │   │
│  │  @mcv/notifications ◄── phase transition alerts, claim reminders    │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Core Interfaces

### LaunchpadService

The primary service facade for all launchpad operations. Orchestrates the full lifecycle of token launches from creation through completion.

```typescript
interface LaunchpadService {
  // ── Launch Lifecycle ───────────────────────────────────────
  /**
   * Create a new token launch with full configuration.
   * Validates all parameters, reserves token allocation,
   * and initializes the phase pipeline.
   */
  createLaunch(config: LaunchConfig): Promise<Launch>;

  /**
   * Retrieve a launch by its unique identifier.
   * Includes current phase, participation stats, and timeline.
   */
  getLaunch(launchId: string): Promise<Launch | null>;

  /**
   * List launches with filtering and pagination.
   * Supports filtering by status, token, creator, date range.
   */
  listLaunches(params: LaunchListParams): Promise<PaginatedResult<Launch>>;

  /**
   * Update mutable launch parameters.
   * Only allowed before the sale phase begins.
   * Changes are audited and emit events.
   */
  updateLaunch(launchId: string, updates: Partial<LaunchConfig>): Promise<Launch>;

  /**
   * Cancel a launch. Only allowed before distribution.
   * Triggers full refund of all participant deposits.
   * Requires cancellation reason for audit trail.
   */
  cancelLaunch(launchId: string, reason: string): Promise<void>;

  // ── Phase Management ───────────────────────────────────────
  /**
   * Advance the launch to the next phase.
   * Validates all preconditions for the transition.
   * Returns the new phase or throws if preconditions unmet.
   */
  advancePhase(launchId: string): Promise<LaunchPhase>;

  /**
   * Get the current phase and its status details.
   * Includes time remaining, completion percentage, blockers.
   */
  getCurrentPhase(launchId: string): Promise<LaunchPhaseDetail>;

  /**
   * Get the full phase timeline with actual/projected timestamps.
   */
  getPhaseTimeline(launchId: string): Promise<LaunchPhaseTimeline>;

  // ── Participation ──────────────────────────────────────────
  /**
   * Submit a participation commitment for the sale.
   * Validates whitelist status, KYC, allocation limits.
   * Escrows the committed funds immediately.
   */
  participate(
    launchId: string,
    userId: string,
    amount: bigint,
    paymentToken: string
  ): Promise<Participation>;

  /**
   * Get a user's participation details for a specific launch.
   */
  getParticipation(launchId: string, userId: string): Promise<Participation | null>;

  /**
   * List all participations for a launch with pagination.
   */
  listParticipations(
    launchId: string,
    params: PaginationParams
  ): Promise<PaginatedResult<Participation>>;

  // ── Claims & Refunds ───────────────────────────────────────
  /**
   * Claim vested tokens for a participant.
   * Calculates claimable amount based on vesting schedule.
   */
  claimTokens(launchId: string, userId: string): Promise<VestingRelease>;

  /**
   * Get claimable token amount for a user.
   * Returns amount currently available and next unlock date.
   */
  getClaimableAmount(
    launchId: string,
    userId: string
  ): Promise<ClaimableInfo>;

  /**
   * Process refund for a participant.
   * Used for overflow refunds, cancellation refunds, failed launches.
   */
  processRefund(
    launchId: string,
    userId: string,
    reason: RefundReason
  ): Promise<RefundRecord>;

  // ── Analytics ──────────────────────────────────────────────
  /**
   * Get comprehensive metrics for a launch.
   * Includes participation rates, raise amounts, distribution stats.
   */
  getLaunchMetrics(launchId: string): Promise<LaunchMetrics>;

  /**
   * Get post-launch price performance tracking.
   * Compares current price vs launch price over time intervals.
   */
  getPricePerformance(
    launchId: string,
    intervals: TimeInterval[]
  ): Promise<PricePerformance[]>;
}
```

### Launch

Represents a single token launch event with all its configuration and state.

```typescript
interface Launch {
  /** Unique launch identifier (ULID) */
  id: string;

  /** Human-readable slug for URLs: "acme-token-ido-2026" */
  slug: string;

  /** Display name: "Acme Protocol IDO" */
  name: string;

  /** Rich description with markdown support */
  description: string;

  /** Project/team that created the launch */
  projectId: string;

  /** Address/ID of the creator/admin */
  creatorId: string;

  /** Type of launch: IDO, IEO, Fair Launch, Community Sale */
  launchType: LaunchType;

  /** Sale mechanism: fixed_price, dutch_auction, lbp, overflow, sealed_bid */
  saleMechanism: SaleMechanism;

  /** Current status: draft, scheduled, active, completed, cancelled, failed */
  status: LaunchStatus;

  // ── Token Details ────────────────────────────────────────
  /** Address/ID of the token being launched */
  tokenId: string;

  /** Token symbol (e.g., "ACME") */
  tokenSymbol: string;

  /** Token decimals */
  tokenDecimals: number;

  /** Total supply of the token */
  totalSupply: bigint;

  /** Amount of tokens allocated for this launch */
  launchAllocation: bigint;

  /** Percentage of total supply being launched (basis points) */
  launchPercentageBps: number;

  // ── Pricing ──────────────────────────────────────────────
  /** Accepted payment tokens (e.g., ["USDC", "USDT", "ETH"]) */
  paymentTokens: string[];

  /** Initial token price in payment token units (for fixed price) */
  initialPrice: bigint | null;

  /** Final settled price (set after sale completes) */
  finalPrice: bigint | null;

  /** Price denomination token (e.g., "USDC") */
  priceDenomination: string;

  // ── Caps ─────────────────────────────────────────────────
  /** Soft cap — minimum raise for launch to succeed */
  softCap: bigint;

  /** Hard cap — maximum raise amount */
  hardCap: bigint;

  /** Minimum individual participation amount */
  minParticipation: bigint;

  /** Maximum individual participation amount (before tier adjustments) */
  maxParticipation: bigint;

  /** Total amount raised so far */
  totalRaised: bigint;

  /** Number of participants */
  participantCount: number;

  // ── Fair Launch Config ───────────────────────────────────
  /** Configuration for the specific sale mechanism */
  fairLaunchConfig: FairLaunchConfig | null;

  // ── Vesting ──────────────────────────────────────────────
  /** TGE (Token Generation Event) unlock percentage (basis points) */
  tgeUnlockBps: number;

  /** Vesting schedule configuration */
  vestingSchedule: VestingSchedule;

  // ── Timeline ─────────────────────────────────────────────
  /** Current phase in the pipeline */
  currentPhase: PhaseType;

  /** All phase configurations with timestamps */
  phases: LaunchPhase[];

  /** Overall launch start timestamp */
  startsAt: Date;

  /** Overall launch end timestamp (listing complete) */
  endsAt: Date | null;

  // ── Market Bootstrap ─────────────────────────────────────
  /** Post-launch liquidity configuration */
  listingConfig: ListingConfig | null;

  // ── Compliance ───────────────────────────────────────────
  /** Whether KYC is required for participation */
  requiresKyc: boolean;

  /** Restricted jurisdictions (ISO 3166-1 alpha-2 codes) */
  restrictedJurisdictions: string[];

  /** Minimum ACS score required (0 = no requirement) */
  minAcsScore: number;

  // ── Metadata ─────────────────────────────────────────────
  /** Project website URL */
  websiteUrl: string | null;

  /** Whitepaper/litepaper URL */
  whitepaperUrl: string | null;

  /** Social media links */
  socialLinks: Record<string, string>;

  /** Audit report URLs */
  auditUrls: string[];

  /** Banner image URL for launch page */
  bannerUrl: string | null;

  /** Logo URL */
  logoUrl: string | null;

  /** Tags for categorization */
  tags: string[];

  /** Creation timestamp */
  createdAt: Date;

  /** Last update timestamp */
  updatedAt: Date;

  /** Version for optimistic concurrency control */
  version: number;
}
```

### WhitelistEntry

Represents a single participant's whitelist registration for a launch.

```typescript
interface WhitelistEntry {
  /** Unique whitelist entry ID */
  id: string;

  /** Launch this entry belongs to */
  launchId: string;

  /** User/wallet who registered */
  userId: string;

  /** Wallet address for token receipt */
  walletAddress: string;

  /** Whitelist status: pending, approved, rejected, lottery_entered, lottery_won, lottery_lost */
  status: WhitelistStatus;

  /** Allocation tier assigned based on staking/ACS */
  tierId: string | null;

  /** Calculated maximum allocation for this user */
  maxAllocation: bigint | null;

  /** Whether the user has guaranteed allocation (vs lottery) */
  isGuaranteed: boolean;

  /** KYC verification status */
  kycVerified: boolean;

  /** KYC verification timestamp */
  kycVerifiedAt: Date | null;

  /** KYC provider reference */
  kycReference: string | null;

  /** Jurisdiction (ISO country code) */
  jurisdiction: string | null;

  /** User's EDGE staking amount at snapshot time */
  stakedAmount: bigint | null;

  /** User's ACS score at snapshot time */
  acsScore: number | null;

  /** Lottery ticket number (if lottery-based) */
  lotteryTicket: number | null;

  /** Registration timestamp */
  registeredAt: Date;

  /** Approval/rejection timestamp */
  processedAt: Date | null;

  /** Rejection reason (if rejected) */
  rejectionReason: string | null;

  /** Snapshot block number for staking/ACS verification */
  snapshotBlock: bigint | null;
}
```

### AllocationTier

Defines a tier level for token allocation based on staking or score thresholds.

```typescript
interface AllocationTier {
  /** Unique tier identifier */
  id: string;

  /** Launch this tier belongs to */
  launchId: string;

  /** Tier name: "Bronze", "Silver", "Gold", "Diamond", "Legendary" */
  name: string;

  /** Tier level (1 = lowest, higher = more allocation) */
  level: number;

  /** Minimum EDGE staking amount for this tier */
  minStakeAmount: bigint;

  /** Maximum EDGE staking amount (exclusive, null = unlimited) */
  maxStakeAmount: bigint | null;

  /** Minimum ACS score for this tier (alternative qualification) */
  minAcsScore: number;

  /** Allocation weight multiplier (basis points, 10000 = 1x) */
  allocationWeightBps: number;

  /** Maximum allocation amount in payment token */
  maxAllocation: bigint;

  /** Whether this tier has guaranteed allocation */
  guaranteed: boolean;

  /** Number of lottery winners for this tier (if not guaranteed) */
  lotteryWinners: number | null;

  /** Pool weight for pro-rata distribution within tier */
  poolWeightBps: number;

  /** Number of users currently in this tier */
  participantCount: number;

  /** Total allocation pool for this tier */
  totalPool: bigint;

  /** Cooldown period — how long user must have been staking (seconds) */
  stakingCooldown: number;

  /** Whether tier qualification can use ACS score as alternative */
  allowAcsAlternative: boolean;

  /** Display color for UI (hex) */
  color: string;

  /** Display icon identifier */
  icon: string;
}
```

### VestingContract

Represents a vesting agreement for a participant's token allocation.

```typescript
interface VestingContract {
  /** Unique vesting contract ID */
  id: string;

  /** Associated launch */
  launchId: string;

  /** Beneficiary user */
  userId: string;

  /** Beneficiary wallet address */
  walletAddress: string;

  /** Total token amount under vesting */
  totalAmount: bigint;

  /** Amount already claimed/released */
  claimedAmount: bigint;

  /** Amount available to claim right now */
  claimableAmount: bigint;

  /** Vesting type: linear, cliff_linear, stepped, milestone, custom */
  vestingType: VestingType;

  /** TGE unlock amount (immediate release at token generation) */
  tgeAmount: bigint;

  /** Whether TGE amount has been claimed */
  tgeClaimed: boolean;

  /** Cliff duration in seconds (0 = no cliff) */
  cliffDuration: number;

  /** Cliff end timestamp */
  cliffEndsAt: Date | null;

  /** Total vesting duration in seconds (after cliff) */
  vestingDuration: number;

  /** Vesting start timestamp (usually TGE) */
  startsAt: Date;

  /** Vesting end timestamp */
  endsAt: Date;

  /** Release frequency in seconds (e.g., 2592000 = monthly) */
  releaseFrequency: number;

  /** Number of release periods */
  totalPeriods: number;

  /** Custom release schedule (if vestingType is 'custom') */
  customSchedule: VestingMilestone[] | null;

  /** Whether the contract is revocable by the project */
  revocable: boolean;

  /** Whether the contract has been revoked */
  revoked: boolean;

  /** Revocation timestamp */
  revokedAt: Date | null;

  /** On-chain contract address (if deployed on-chain) */
  onChainAddress: string | null;

  /** On-chain transaction hash of deployment */
  deployTxHash: string | null;

  /** All releases/claims made against this contract */
  releases: VestingRelease[];

  /** Creation timestamp */
  createdAt: Date;

  /** Last update timestamp */
  updatedAt: Date;
}

interface VestingMilestone {
  /** Milestone identifier */
  id: string;

  /** Percentage to unlock at this milestone (basis points) */
  unlockBps: number;

  /** Unlock timestamp (absolute) */
  unlockAt: Date;

  /** Description of the milestone */
  description: string;

  /** Whether this milestone has been reached */
  reached: boolean;
}

interface VestingRelease {
  /** Unique release ID */
  id: string;

  /** Vesting contract this release belongs to */
  vestingContractId: string;

  /** Amount released */
  amount: bigint;

  /** Period number (1-indexed) */
  periodNumber: number;

  /** Release timestamp */
  releasedAt: Date;

  /** On-chain transaction hash */
  txHash: string | null;

  /** Claimed by user or auto-distributed */
  claimType: 'manual' | 'automatic';

  /** Destination wallet address */
  destinationAddress: string;
}
```

### LaunchPhase

Defines a single phase within the launch pipeline.

```typescript
interface LaunchPhase {
  /** Unique phase ID */
  id: string;

  /** Associated launch */
  launchId: string;

  /** Phase type in the pipeline */
  phaseType: PhaseType;

  /** Phase display name */
  name: string;

  /** Phase description */
  description: string;

  /** Phase status: pending, active, completed, skipped, failed */
  status: 'pending' | 'active' | 'completed' | 'skipped' | 'failed';

  /** Scheduled start time */
  scheduledStartAt: Date;

  /** Scheduled end time */
  scheduledEndAt: Date;

  /** Actual start time */
  actualStartAt: Date | null;

  /** Actual end time */
  actualEndAt: Date | null;

  /** Phase order in the pipeline (1-indexed) */
  order: number;

  /** Preconditions that must be met to enter this phase */
  preconditions: PhasePrecondition[];

  /** Whether all preconditions are currently satisfied */
  preconditionsMet: boolean;

  /** Phase-specific configuration */
  config: Record<string, unknown>;

  /** Phase-specific metrics collected during execution */
  metrics: Record<string, unknown>;

  /** Error details if phase failed */
  failureReason: string | null;

  /** Whether this phase can be manually advanced */
  manualAdvance: boolean;
}

interface PhasePrecondition {
  /** Precondition type */
  type: 'time' | 'kyc_complete' | 'min_participants' | 'admin_approval' |
        'soft_cap_reached' | 'token_deposited' | 'liquidity_ready' | 'custom';

  /** Human-readable description */
  description: string;

  /** Whether this precondition is currently met */
  met: boolean;

  /** When this precondition was satisfied */
  metAt: Date | null;

  /** Required value (interpretation depends on type) */
  requiredValue: string | null;

  /** Current value */
  currentValue: string | null;
}
```

### FairLaunchConfig

Union type covering all supported sale mechanism configurations.

```typescript
type FairLaunchConfig =
  | { mechanism: 'fixed_price'; config: FixedPriceConfig }
  | { mechanism: 'dutch_auction'; config: DutchAuctionConfig }
  | { mechanism: 'lbp'; config: LBPConfig }
  | { mechanism: 'overflow'; config: OverflowConfig }
  | { mechanism: 'sealed_bid'; config: SealedBidConfig };

interface FixedPriceConfig {
  /** Price per token in payment token units */
  pricePerToken: bigint;

  /** Whether it's first-come-first-served or guaranteed */
  fcfs: boolean;

  /** Maximum participants (0 = unlimited) */
  maxParticipants: number;
}

interface DutchAuctionConfig {
  /** Starting (highest) price per token */
  startPrice: bigint;

  /** Reserve (lowest) price per token */
  reservePrice: bigint;

  /** Price decay model: linear, exponential, stepped */
  decayModel: 'linear' | 'exponential' | 'stepped';

  /** Auction duration in seconds */
  duration: number;

  /** Price update interval in seconds */
  priceUpdateInterval: number;

  /** For stepped decay: price decrement per step */
  stepDecrement: bigint | null;

  /** For exponential decay: decay factor (basis points per interval) */
  decayFactorBps: number | null;

  /** Whether all participants pay the final clearing price */
  uniformPricing: boolean;
}

interface LBPConfig {
  /** Starting weight of the project token (basis points, e.g., 9000 = 90%) */
  startWeightBps: number;

  /** Ending weight of the project token (basis points, e.g., 5000 = 50%) */
  endWeightBps: number;

  /** Collateral token for the pool */
  collateralToken: string;

  /** Initial collateral amount in the pool */
  initialCollateral: bigint;

  /** Initial project token amount in the pool */
  initialProjectTokens: bigint;

  /** LBP duration in seconds */
  duration: number;

  /** Swap fee (basis points) */
  swapFeeBps: number;

  /** Whether selling (dumping) is allowed during LBP */
  allowSelling: boolean;

  /** Maximum single swap size (anti-whale) */
  maxSwapAmount: bigint | null;

  /** Weight update interval in seconds */
  weightUpdateInterval: number;

  /** DEX/AMM to deploy the LBP on */
  dexId: string;
}

interface OverflowConfig {
  /** Fixed price per token */
  pricePerToken: bigint;

  /** Maximum raise (hard cap) */
  maxRaise: bigint;

  /** Whether participants can deposit more than their allocation (pro-rata refund) */
  allowOverflow: boolean;

  /** Maximum overflow multiplier (e.g., 5x = participants can deposit 5x their allocation) */
  maxOverflowMultiplier: number;

  /** Deposit window duration in seconds */
  depositWindow: number;

  /** Refund delay after sale (seconds) */
  refundDelay: number;
}

interface SealedBidConfig {
  /** Minimum bid price per token */
  minBidPrice: bigint;

  /** Commitment phase duration (seconds) */
  commitDuration: number;

  /** Reveal phase duration (seconds) */
  revealDuration: number;

  /** Whether all winners pay the clearing price (uniform) or their bid (pay-as-bid) */
  uniformPricing: boolean;

  /** Minimum number of valid bids required */
  minBids: number;

  /** Commitment hash function identifier */
  hashFunction: 'keccak256' | 'sha256';

  /** Required deposit alongside commitment (anti-spam) */
  commitDeposit: bigint;
}
```

---

## Enums

```typescript
enum LaunchStatus {
  /** Initial state, still being configured */
  DRAFT = 'draft',
  /** Fully configured, awaiting scheduled start */
  SCHEDULED = 'scheduled',
  /** Currently in one of the active phases */
  ACTIVE = 'active',
  /** Sale completed, distribution/vesting in progress */
  DISTRIBUTING = 'distributing',
  /** Fully completed including listing */
  COMPLETED = 'completed',
  /** Cancelled by admin before completion */
  CANCELLED = 'cancelled',
  /** Failed to meet soft cap or other requirements */
  FAILED = 'failed',
  /** Paused by admin (emergency) */
  PAUSED = 'paused',
}

enum LaunchType {
  /** Initial DEX Offering — sale + DEX listing */
  IDO = 'ido',
  /** Initial Exchange Offering — sale via centralized exchange */
  IEO = 'ieo',
  /** Fair launch — no pre-sale, direct market mechanisms */
  FAIR_LAUNCH = 'fair_launch',
  /** Community sale — small raise, community-focused */
  COMMUNITY_SALE = 'community_sale',
  /** Private sale — restricted to specific participants */
  PRIVATE_SALE = 'private_sale',
  /** Seed round — early stage, higher risk/reward */
  SEED = 'seed',
}

enum SaleMechanism {
  FIXED_PRICE = 'fixed_price',
  DUTCH_AUCTION = 'dutch_auction',
  LBP = 'lbp',
  OVERFLOW = 'overflow',
  SEALED_BID = 'sealed_bid',
}

enum PhaseType {
  /** Project announcement and information publication */
  ANNOUNCEMENT = 'announcement',
  /** Whitelist registration open */
  WHITELIST = 'whitelist',
  /** KYC/AML verification period */
  KYC_VERIFICATION = 'kyc_verification',
  /** Staking/ACS snapshot for allocation tiers */
  SNAPSHOT = 'snapshot',
  /** Lottery drawing for non-guaranteed tiers */
  LOTTERY = 'lottery',
  /** Active sale/deposit window */
  SALE = 'sale',
  /** Sale settlement and result calculation */
  SETTLEMENT = 'settlement',
  /** Token distribution to participants */
  DISTRIBUTION = 'distribution',
  /** Vesting activation */
  VESTING = 'vesting',
  /** DEX/CEX listing and liquidity provisioning */
  LISTING = 'listing',
  /** Launch completed */
  COMPLETED = 'completed',
}

enum VestingType {
  /** No vesting — 100% at TGE */
  NONE = 'none',
  /** Linear unlock over time */
  LINEAR = 'linear',
  /** Cliff period then linear unlock */
  CLIFF_LINEAR = 'cliff_linear',
  /** Stepped periodic unlocks */
  STEPPED = 'stepped',
  /** Milestone-based unlocks */
  MILESTONE = 'milestone',
  /** Custom schedule with arbitrary unlock points */
  CUSTOM = 'custom',
}

enum AllocationMethod {
  /** Guaranteed allocation based on tier */
  GUARANTEED = 'guaranteed',
  /** Lottery-based with tier weighting */
  LOTTERY = 'lottery',
  /** First-come-first-served */
  FCFS = 'fcfs',
  /** Pro-rata based on deposit amount */
  PRO_RATA = 'pro_rata',
  /** Combination of guaranteed base + lottery bonus */
  HYBRID = 'hybrid',
}

enum RefundReason {
  /** Launch cancelled by admin */
  LAUNCH_CANCELLED = 'launch_cancelled',
  /** Launch failed to meet soft cap */
  SOFT_CAP_NOT_MET = 'soft_cap_not_met',
  /** Overflow model pro-rata refund */
  OVERFLOW_REFUND = 'overflow_refund',
  /** User cancelled participation before sale */
  USER_CANCELLED = 'user_cancelled',
  /** KYC verification failed */
  KYC_FAILED = 'kyc_failed',
  /** Jurisdiction restricted */
  JURISDICTION_RESTRICTED = 'jurisdiction_restricted',
  /** Partial fill — not all tokens sold */
  PARTIAL_FILL = 'partial_fill',
  /** Emergency refund triggered by admin */
  EMERGENCY = 'emergency',
  /** Dutch auction price settlement refund */
  PRICE_SETTLEMENT = 'price_settlement',
  /** Sealed bid — losing bid refund */
  LOSING_BID = 'losing_bid',
}

enum WhitelistStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  LOTTERY_ENTERED = 'lottery_entered',
  LOTTERY_WON = 'lottery_won',
  LOTTERY_LOST = 'lottery_lost',
  KYC_PENDING = 'kyc_pending',
  KYC_FAILED = 'kyc_failed',
  EXPIRED = 'expired',
}
```

---

## DB Schemas

### launches

```typescript
import { pgTable, text, timestamp, bigint, integer, jsonb, boolean, index, uniqueIndex } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

export const launches = pgTable('launchpad_launches', {
  id:                    text('id').primaryKey(),                    // ULID
  slug:                  text('slug').notNull(),
  name:                  text('name').notNull(),
  description:           text('description').notNull(),
  projectId:             text('project_id').notNull(),
  creatorId:             text('creator_id').notNull(),

  // ── Type & Mechanism ─────────────────────────────────────
  launchType:            text('launch_type').notNull(),              // LaunchType enum
  saleMechanism:         text('sale_mechanism').notNull(),           // SaleMechanism enum
  status:                text('status').notNull().default('draft'),  // LaunchStatus enum
  currentPhase:          text('current_phase').notNull().default('announcement'),

  // ── Token ────────────────────────────────────────────────
  tokenId:               text('token_id').notNull(),
  tokenSymbol:           text('token_symbol').notNull(),
  tokenDecimals:         integer('token_decimals').notNull().default(18),
  totalSupply:           bigint('total_supply', { mode: 'bigint' }).notNull(),
  launchAllocation:      bigint('launch_allocation', { mode: 'bigint' }).notNull(),
  launchPercentageBps:   integer('launch_percentage_bps').notNull(),

  // ── Pricing ──────────────────────────────────────────────
  paymentTokens:         jsonb('payment_tokens').notNull().$type<string[]>(),
  initialPrice:          bigint('initial_price', { mode: 'bigint' }),
  finalPrice:            bigint('final_price', { mode: 'bigint' }),
  priceDenomination:     text('price_denomination').notNull().default('USDC'),

  // ── Caps ─────────────────────────────────────────────────
  softCap:               bigint('soft_cap', { mode: 'bigint' }).notNull(),
  hardCap:               bigint('hard_cap', { mode: 'bigint' }).notNull(),
  minParticipation:      bigint('min_participation', { mode: 'bigint' }).notNull(),
  maxParticipation:      bigint('max_participation', { mode: 'bigint' }).notNull(),
  totalRaised:           bigint('total_raised', { mode: 'bigint' }).notNull().default(0n),
  participantCount:      integer('participant_count').notNull().default(0),

  // ── Fair Launch Config ───────────────────────────────────
  fairLaunchConfig:      jsonb('fair_launch_config').$type<FairLaunchConfig | null>(),

  // ── Vesting ──────────────────────────────────────────────
  tgeUnlockBps:          integer('tge_unlock_bps').notNull().default(10000), // 100% default
  vestingSchedule:       jsonb('vesting_schedule').notNull().$type<VestingSchedule>(),

  // ── Timeline ─────────────────────────────────────────────
  startsAt:              timestamp('starts_at', { withTimezone: true }).notNull(),
  endsAt:                timestamp('ends_at', { withTimezone: true }),

  // ── Market Bootstrap ─────────────────────────────────────
  listingConfig:         jsonb('listing_config').$type<ListingConfig | null>(),

  // ── Compliance ───────────────────────────────────────────
  requiresKyc:           boolean('requires_kyc').notNull().default(false),
  restrictedJurisdictions: jsonb('restricted_jurisdictions').notNull().$type<string[]>().default([]),
  minAcsScore:           integer('min_acs_score').notNull().default(0),

  // ── Metadata ─────────────────────────────────────────────
  websiteUrl:            text('website_url'),
  whitepaperUrl:         text('whitepaper_url'),
  socialLinks:           jsonb('social_links').notNull().$type<Record<string, string>>().default({}),
  auditUrls:             jsonb('audit_urls').notNull().$type<string[]>().default([]),
  bannerUrl:             text('banner_url'),
  logoUrl:               text('logo_url'),
  tags:                  jsonb('tags').notNull().$type<string[]>().default([]),

  // ── System ───────────────────────────────────────────────
  version:               integer('version').notNull().default(1),
  createdAt:             timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt:             timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  slugIdx:        uniqueIndex('lpad_launches_slug_idx').on(table.slug),
  statusIdx:      index('lpad_launches_status_idx').on(table.status),
  projectIdx:     index('lpad_launches_project_idx').on(table.projectId),
  creatorIdx:     index('lpad_launches_creator_idx').on(table.creatorId),
  tokenIdx:       index('lpad_launches_token_idx').on(table.tokenId),
  startsAtIdx:    index('lpad_launches_starts_at_idx').on(table.startsAt),
  typeStatusIdx:  index('lpad_launches_type_status_idx').on(table.launchType, table.status),
}));

export const launchesRelations = relations(launches, ({ many }) => ({
  whitelistEntries:    many(whitelistEntries),
  allocations:         many(allocations),
  vestingContracts:    many(vestingContracts),
  phases:              many(launchPhases),
  participations:      many(participationRecords),
  refunds:             many(refundRecords),
  snapshots:           many(launchSnapshots),
}));
```

### whitelist_entries

```typescript
export const whitelistEntries = pgTable('launchpad_whitelist_entries', {
  id:                  text('id').primaryKey(),
  launchId:            text('launch_id').notNull().references(() => launches.id, { onDelete: 'cascade' }),
  userId:              text('user_id').notNull(),
  walletAddress:       text('wallet_address').notNull(),

  // ── Status ───────────────────────────────────────────────
  status:              text('status').notNull().default('pending'),  // WhitelistStatus
  isGuaranteed:        boolean('is_guaranteed').notNull().default(false),

  // ── Tier & Allocation ────────────────────────────────────
  tierId:              text('tier_id'),
  maxAllocation:       bigint('max_allocation', { mode: 'bigint' }),

  // ── KYC ──────────────────────────────────────────────────
  kycVerified:         boolean('kyc_verified').notNull().default(false),
  kycVerifiedAt:       timestamp('kyc_verified_at', { withTimezone: true }),
  kycReference:        text('kyc_reference'),
  jurisdiction:        text('jurisdiction'),

  // ── Staking & Score ──────────────────────────────────────
  stakedAmount:        bigint('staked_amount', { mode: 'bigint' }),
  acsScore:            integer('acs_score'),
  snapshotBlock:       bigint('snapshot_block', { mode: 'bigint' }),

  // ── Lottery ──────────────────────────────────────────────
  lotteryTicket:       integer('lottery_ticket'),

  // ── Timestamps ───────────────────────────────────────────
  registeredAt:        timestamp('registered_at', { withTimezone: true }).notNull().defaultNow(),
  processedAt:         timestamp('processed_at', { withTimezone: true }),
  rejectionReason:     text('rejection_reason'),
}, (table) => ({
  launchUserIdx:       uniqueIndex('lpad_wl_launch_user_idx').on(table.launchId, table.userId),
  launchStatusIdx:     index('lpad_wl_launch_status_idx').on(table.launchId, table.status),
  userIdx:             index('lpad_wl_user_idx').on(table.userId),
  tierIdx:             index('lpad_wl_tier_idx').on(table.tierId),
  lotteryIdx:          index('lpad_wl_lottery_idx').on(table.launchId, table.lotteryTicket),
}));

export const whitelistEntriesRelations = relations(whitelistEntries, ({ one }) => ({
  launch: one(launches, {
    fields: [whitelistEntries.launchId],
    references: [launches.id],
  }),
}));
```

### allocations

```typescript
export const allocations = pgTable('launchpad_allocations', {
  id:                  text('id').primaryKey(),
  launchId:            text('launch_id').notNull().references(() => launches.id, { onDelete: 'cascade' }),
  tierId:              text('tier_id').notNull(),

  // ── Tier Definition ──────────────────────────────────────
  name:                text('name').notNull(),
  level:               integer('level').notNull(),
  minStakeAmount:      bigint('min_stake_amount', { mode: 'bigint' }).notNull(),
  maxStakeAmount:      bigint('max_stake_amount', { mode: 'bigint' }),
  minAcsScore:         integer('min_acs_score').notNull().default(0),

  // ── Allocation Parameters ────────────────────────────────
  allocationWeightBps: integer('allocation_weight_bps').notNull(),
  maxAllocation:       bigint('max_allocation', { mode: 'bigint' }).notNull(),
  guaranteed:          boolean('guaranteed').notNull().default(false),
  lotteryWinners:      integer('lottery_winners'),
  poolWeightBps:       integer('pool_weight_bps').notNull(),
  totalPool:           bigint('total_pool', { mode: 'bigint' }).notNull(),

  // ── Stats ────────────────────────────────────────────────
  participantCount:    integer('participant_count').notNull().default(0),
  stakingCooldown:     integer('staking_cooldown').notNull().default(0),
  allowAcsAlternative: boolean('allow_acs_alternative').notNull().default(false),

  // ── Display ──────────────────────────────────────────────
  color:               text('color').notNull().default('#6366f1'),
  icon:                text('icon').notNull().default('star'),

  // ── Timestamps ───────────────────────────────────────────
  createdAt:           timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt:           timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  launchIdx:           index('lpad_alloc_launch_idx').on(table.launchId),
  launchLevelIdx:      uniqueIndex('lpad_alloc_launch_level_idx').on(table.launchId, table.level),
  launchTierIdx:       uniqueIndex('lpad_alloc_launch_tier_idx').on(table.launchId, table.tierId),
}));

export const allocationsRelations = relations(allocations, ({ one }) => ({
  launch: one(launches, {
    fields: [allocations.launchId],
    references: [launches.id],
  }),
}));
```

### vesting_contracts

```typescript
export const vestingContracts = pgTable('launchpad_vesting_contracts', {
  id:                  text('id').primaryKey(),
  launchId:            text('launch_id').notNull().references(() => launches.id, { onDelete: 'cascade' }),
  userId:              text('user_id').notNull(),
  walletAddress:       text('wallet_address').notNull(),

  // ── Amounts ──────────────────────────────────────────────
  totalAmount:         bigint('total_amount', { mode: 'bigint' }).notNull(),
  claimedAmount:       bigint('claimed_amount', { mode: 'bigint' }).notNull().default(0n),
  claimableAmount:     bigint('claimable_amount', { mode: 'bigint' }).notNull().default(0n),

  // ── Vesting Type & TGE ───────────────────────────────────
  vestingType:         text('vesting_type').notNull(),               // VestingType enum
  tgeAmount:           bigint('tge_amount', { mode: 'bigint' }).notNull().default(0n),
  tgeClaimed:          boolean('tge_claimed').notNull().default(false),

  // ── Schedule ─────────────────────────────────────────────
  cliffDuration:       integer('cliff_duration').notNull().default(0),
  cliffEndsAt:         timestamp('cliff_ends_at', { withTimezone: true }),
  vestingDuration:     integer('vesting_duration').notNull(),
  startsAt:            timestamp('starts_at', { withTimezone: true }).notNull(),
  endsAt:              timestamp('ends_at', { withTimezone: true }).notNull(),
  releaseFrequency:    integer('release_frequency').notNull(),       // seconds
  totalPeriods:        integer('total_periods').notNull(),

  // ── Custom Schedule ──────────────────────────────────────
  customSchedule:      jsonb('custom_schedule').$type<VestingMilestone[] | null>(),

  // ── Revocation ───────────────────────────────────────────
  revocable:           boolean('revocable').notNull().default(false),
  revoked:             boolean('revoked').notNull().default(false),
  revokedAt:           timestamp('revoked_at', { withTimezone: true }),

  // ── On-chain ─────────────────────────────────────────────
  onChainAddress:      text('on_chain_address'),
  deployTxHash:        text('deploy_tx_hash'),

  // ── Timestamps ───────────────────────────────────────────
  createdAt:           timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt:           timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  launchUserIdx:       uniqueIndex('lpad_vest_launch_user_idx').on(table.launchId, table.userId),
  userIdx:             index('lpad_vest_user_idx').on(table.userId),
  launchIdx:           index('lpad_vest_launch_idx').on(table.launchId),
  endsAtIdx:           index('lpad_vest_ends_at_idx').on(table.endsAt),
  typeIdx:             index('lpad_vest_type_idx').on(table.vestingType),
}));

export const vestingContractsRelations = relations(vestingContracts, ({ one, many }) => ({
  launch: one(launches, {
    fields: [vestingContracts.launchId],
    references: [launches.id],
  }),
  releases: many(vestingReleases),
}));
```

### vesting_releases

```typescript
export const vestingReleases = pgTable('launchpad_vesting_releases', {
  id:                  text('id').primaryKey(),
  vestingContractId:   text('vesting_contract_id').notNull().references(() => vestingContracts.id, { onDelete: 'cascade' }),
  launchId:            text('launch_id').notNull(),
  userId:              text('user_id').notNull(),

  // ── Release Details ──────────────────────────────────────
  amount:              bigint('amount', { mode: 'bigint' }).notNull(),
  periodNumber:        integer('period_number').notNull(),
  claimType:           text('claim_type').notNull().default('manual'), // 'manual' | 'automatic'
  destinationAddress:  text('destination_address').notNull(),

  // ── On-chain ─────────────────────────────────────────────
  txHash:              text('tx_hash'),

  // ── Timestamps ───────────────────────────────────────────
  releasedAt:          timestamp('released_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  contractIdx:         index('lpad_vrel_contract_idx').on(table.vestingContractId),
  launchIdx:           index('lpad_vrel_launch_idx').on(table.launchId),
  userIdx:             index('lpad_vrel_user_idx').on(table.userId),
  contractPeriodIdx:   uniqueIndex('lpad_vrel_contract_period_idx').on(table.vestingContractId, table.periodNumber),
}));

export const vestingReleasesRelations = relations(vestingReleases, ({ one }) => ({
  vestingContract: one(vestingContracts, {
    fields: [vestingReleases.vestingContractId],
    references: [vestingContracts.id],
  }),
}));
```

### launch_phases

```typescript
export const launchPhases = pgTable('launchpad_launch_phases', {
  id:                  text('id').primaryKey(),
  launchId:            text('launch_id').notNull().references(() => launches.id, { onDelete: 'cascade' }),

  // ── Phase Definition ─────────────────────────────────────
  phaseType:           text('phase_type').notNull(),                 // PhaseType enum
  name:                text('name').notNull(),
  description:         text('description').notNull().default(''),
  status:              text('status').notNull().default('pending'),
  order:               integer('order').notNull(),

  // ── Scheduling ───────────────────────────────────────────
  scheduledStartAt:    timestamp('scheduled_start_at', { withTimezone: true }).notNull(),
  scheduledEndAt:      timestamp('scheduled_end_at', { withTimezone: true }).notNull(),
  actualStartAt:       timestamp('actual_start_at', { withTimezone: true }),
  actualEndAt:         timestamp('actual_end_at', { withTimezone: true }),

  // ── Configuration ────────────────────────────────────────
  preconditions:       jsonb('preconditions').notNull().$type<PhasePrecondition[]>().default([]),
  preconditionsMet:    boolean('preconditions_met').notNull().default(false),
  config:              jsonb('config').notNull().$type<Record<string, unknown>>().default({}),
  metrics:             jsonb('metrics').notNull().$type<Record<string, unknown>>().default({}),
  manualAdvance:       boolean('manual_advance').notNull().default(false),
  failureReason:       text('failure_reason'),

  // ── Timestamps ───────────────────────────────────────────
  createdAt:           timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt:           timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  launchIdx:           index('lpad_phases_launch_idx').on(table.launchId),
  launchOrderIdx:      uniqueIndex('lpad_phases_launch_order_idx').on(table.launchId, table.order),
  launchPhaseTypeIdx:  uniqueIndex('lpad_phases_launch_type_idx').on(table.launchId, table.phaseType),
  statusIdx:           index('lpad_phases_status_idx').on(table.status),
}));

export const launchPhasesRelations = relations(launchPhases, ({ one }) => ({
  launch: one(launches, {
    fields: [launchPhases.launchId],
    references: [launches.id],
  }),
}));
```

### participation_records

```typescript
export const participationRecords = pgTable('launchpad_participation_records', {
  id:                  text('id').primaryKey(),
  launchId:            text('launch_id').notNull().references(() => launches.id, { onDelete: 'cascade' }),
  userId:              text('user_id').notNull(),
  walletAddress:       text('wallet_address').notNull(),

  // ── Participation Details ────────────────────────────────
  committedAmount:     bigint('committed_amount', { mode: 'bigint' }).notNull(),
  paymentToken:        text('payment_token').notNull(),
  effectiveAmount:     bigint('effective_amount', { mode: 'bigint' }),      // After overflow adj
  tokenAllocation:     bigint('token_allocation', { mode: 'bigint' }),      // Tokens to receive
  pricePerToken:       bigint('price_per_token', { mode: 'bigint' }),       // Settled price

  // ── Tier ─────────────────────────────────────────────────
  tierId:              text('tier_id'),
  tierLevel:           integer('tier_level'),

  // ── Status ───────────────────────────────────────────────
  status:              text('status').notNull().default('committed'),
  // committed, settled, distributed, refunded, cancelled

  // ── Refund ───────────────────────────────────────────────
  refundAmount:        bigint('refund_amount', { mode: 'bigint' }),
  refundReason:        text('refund_reason'),
  refundedAt:          timestamp('refunded_at', { withTimezone: true }),

  // ── Distribution ─────────────────────────────────────────
  distributed:         boolean('distributed').notNull().default(false),
  distributedAt:       timestamp('distributed_at', { withTimezone: true }),
  distributionTxHash:  text('distribution_tx_hash'),

  // ── Sealed Bid (optional) ────────────────────────────────
  bidCommitHash:       text('bid_commit_hash'),
  bidRevealedPrice:    bigint('bid_revealed_price', { mode: 'bigint' }),
  bidRevealed:         boolean('bid_revealed').default(false),

  // ── Timestamps ───────────────────────────────────────────
  participatedAt:      timestamp('participated_at', { withTimezone: true }).notNull().defaultNow(),
  settledAt:           timestamp('settled_at', { withTimezone: true }),
  updatedAt:           timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  launchUserIdx:       uniqueIndex('lpad_part_launch_user_idx').on(table.launchId, table.userId),
  launchIdx:           index('lpad_part_launch_idx').on(table.launchId),
  userIdx:             index('lpad_part_user_idx').on(table.userId),
  statusIdx:           index('lpad_part_status_idx').on(table.launchId, table.status),
  tierIdx:             index('lpad_part_tier_idx').on(table.launchId, table.tierId),
  committedIdx:        index('lpad_part_committed_idx').on(table.launchId, table.committedAmount),
}));

export const participationRecordsRelations = relations(participationRecords, ({ one }) => ({
  launch: one(launches, {
    fields: [participationRecords.launchId],
    references: [launches.id],
  }),
}));
```

### refund_records

```typescript
export const refundRecords = pgTable('launchpad_refund_records', {
  id:                  text('id').primaryKey(),
  launchId:            text('launch_id').notNull().references(() => launches.id, { onDelete: 'cascade' }),
  userId:              text('user_id').notNull(),
  participationId:     text('participation_id').notNull(),

  // ── Refund Details ───────────────────────────────────────
  amount:              bigint('amount', { mode: 'bigint' }).notNull(),
  paymentToken:        text('payment_token').notNull(),
  reason:              text('reason').notNull(),                     // RefundReason enum
  description:         text('description'),

  // ── Status ───────────────────────────────────────────────
  status:              text('status').notNull().default('pending'),
  // pending, processing, completed, failed

  // ── Destination ──────────────────────────────────────────
  destinationAddress:  text('destination_address').notNull(),
  txHash:              text('tx_hash'),

  // ── Timestamps ───────────────────────────────────────────
  requestedAt:         timestamp('requested_at', { withTimezone: true }).notNull().defaultNow(),
  processedAt:         timestamp('processed_at', { withTimezone: true }),
  completedAt:         timestamp('completed_at', { withTimezone: true }),
  failedAt:            timestamp('failed_at', { withTimezone: true }),
  failureReason:       text('failure_reason'),
}, (table) => ({
  launchIdx:           index('lpad_refund_launch_idx').on(table.launchId),
  userIdx:             index('lpad_refund_user_idx').on(table.userId),
  participationIdx:    index('lpad_refund_participation_idx').on(table.participationId),
  statusIdx:           index('lpad_refund_status_idx').on(table.status),
  reasonIdx:           index('lpad_refund_reason_idx').on(table.reason),
}));

export const refundRecordsRelations = relations(refundRecords, ({ one }) => ({
  launch: one(launches, {
    fields: [refundRecords.launchId],
    references: [launches.id],
  }),
}));
```

### launch_snapshots

```typescript
export const launchSnapshots = pgTable('launchpad_launch_snapshots', {
  id:                  text('id').primaryKey(),
  launchId:            text('launch_id').notNull().references(() => launches.id, { onDelete: 'cascade' }),

  // ── Snapshot Data ────────────────────────────────────────
  snapshotType:        text('snapshot_type').notNull(),               // 'staking' | 'acs' | 'combined'
  blockNumber:         bigint('block_number', { mode: 'bigint' }),
  blockTimestamp:      timestamp('block_timestamp', { withTimezone: true }),

  // ── Results ──────────────────────────────────────────────
  totalEntries:        integer('total_entries').notNull(),
  tierDistribution:    jsonb('tier_distribution').notNull().$type<Record<string, number>>(),
  snapshotData:        jsonb('snapshot_data').notNull().$type<SnapshotEntry[]>(),

  // ── Verification ─────────────────────────────────────────
  merkleRoot:          text('merkle_root'),
  ipfsHash:            text('ipfs_hash'),

  // ── Timestamps ───────────────────────────────────────────
  takenAt:             timestamp('taken_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  launchIdx:           index('lpad_snap_launch_idx').on(table.launchId),
  launchTypeIdx:       uniqueIndex('lpad_snap_launch_type_idx').on(table.launchId, table.snapshotType),
}));

interface SnapshotEntry {
  userId: string;
  walletAddress: string;
  stakedAmount: string;       // bigint serialized as string
  acsScore: number;
  qualifiedTierId: string;
  stakingDuration: number;    // seconds staked at snapshot time
}
```

---

## Code Examples

### 1. Create a Token Launch (Fixed Price IDO)

```typescript
import { LaunchpadService, LaunchType, SaleMechanism, VestingType, PhaseType } from '@mcv/token-economy/launchpad';

const launchpad = container.resolve(LaunchpadService);

// ── Create a fixed-price IDO with 5 allocation tiers ──────────
const launch = await launchpad.createLaunch({
  name: 'Meridian Protocol IDO',
  slug: 'meridian-protocol-ido-2026',
  description: `
    Meridian Protocol is a cross-chain messaging layer enabling
    seamless communication between EVM and non-EVM chains.
    This IDO offers 5% of the total MRDN supply.
  `,
  projectId: 'proj_meridian_001',
  launchType: LaunchType.IDO,
  saleMechanism: SaleMechanism.FIXED_PRICE,

  // Token configuration
  tokenId: 'token_mrdn_001',
  tokenSymbol: 'MRDN',
  tokenDecimals: 18,
  totalSupply: 1_000_000_000n * 10n ** 18n,           // 1B tokens
  launchAllocation: 50_000_000n * 10n ** 18n,          // 50M tokens (5%)

  // Pricing
  paymentTokens: ['USDC', 'USDT'],
  priceDenomination: 'USDC',
  fairLaunchConfig: {
    mechanism: 'fixed_price',
    config: {
      pricePerToken: 200000n,                          // $0.20 USDC (6 decimals)
      fcfs: false,                                     // Tier-based, not FCFS
      maxParticipants: 0,                              // Unlimited
    },
  },

  // Caps
  softCap: 5_000_000n * 10n ** 6n,                    // $5M USDC
  hardCap: 10_000_000n * 10n ** 6n,                   // $10M USDC
  minParticipation: 100n * 10n ** 6n,                  // $100 min
  maxParticipation: 50_000n * 10n ** 6n,               // $50K max (before tier adj)

  // Vesting: 20% TGE, 3 month cliff, 12 month linear
  tgeUnlockBps: 2000,                                  // 20%
  vestingSchedule: {
    type: VestingType.CLIFF_LINEAR,
    cliffDuration: 90 * 24 * 60 * 60,                  // 90 days
    vestingDuration: 365 * 24 * 60 * 60,               // 12 months
    releaseFrequency: 30 * 24 * 60 * 60,               // Monthly
  },

  // Timeline (all dates UTC)
  startsAt: new Date('2026-03-01T12:00:00Z'),
  phases: [
    {
      phaseType: PhaseType.ANNOUNCEMENT,
      scheduledStartAt: new Date('2026-03-01T12:00:00Z'),
      scheduledEndAt: new Date('2026-03-08T12:00:00Z'),
    },
    {
      phaseType: PhaseType.WHITELIST,
      scheduledStartAt: new Date('2026-03-08T12:00:00Z'),
      scheduledEndAt: new Date('2026-03-15T12:00:00Z'),
    },
    {
      phaseType: PhaseType.KYC_VERIFICATION,
      scheduledStartAt: new Date('2026-03-15T12:00:00Z'),
      scheduledEndAt: new Date('2026-03-20T12:00:00Z'),
    },
    {
      phaseType: PhaseType.SNAPSHOT,
      scheduledStartAt: new Date('2026-03-20T12:00:00Z'),
      scheduledEndAt: new Date('2026-03-20T13:00:00Z'),
      manualAdvance: true,
    },
    {
      phaseType: PhaseType.SALE,
      scheduledStartAt: new Date('2026-03-22T14:00:00Z'),
      scheduledEndAt: new Date('2026-03-23T14:00:00Z'),        // 24-hour window
    },
    {
      phaseType: PhaseType.SETTLEMENT,
      scheduledStartAt: new Date('2026-03-23T14:00:00Z'),
      scheduledEndAt: new Date('2026-03-23T16:00:00Z'),
    },
    {
      phaseType: PhaseType.DISTRIBUTION,
      scheduledStartAt: new Date('2026-03-24T12:00:00Z'),
      scheduledEndAt: new Date('2026-03-24T14:00:00Z'),
    },
    {
      phaseType: PhaseType.LISTING,
      scheduledStartAt: new Date('2026-03-25T12:00:00Z'),
      scheduledEndAt: new Date('2026-03-25T14:00:00Z'),
    },
  ],

  // Allocation tiers
  allocationTiers: [
    {
      name: 'Bronze',
      level: 1,
      minStakeAmount: 1000n * 10n ** 18n,              // 1,000 EDGE
      maxStakeAmount: 5000n * 10n ** 18n,
      allocationWeightBps: 5000,                        // 0.5x
      maxAllocation: 500n * 10n ** 6n,                  // $500
      guaranteed: false,
      lotteryWinners: 500,
      poolWeightBps: 1000,                              // 10% of pool
      stakingCooldown: 7 * 24 * 60 * 60,                // 7 days
      color: '#cd7f32',
      icon: 'shield-bronze',
    },
    {
      name: 'Silver',
      level: 2,
      minStakeAmount: 5000n * 10n ** 18n,
      maxStakeAmount: 25000n * 10n ** 18n,
      allocationWeightBps: 10000,                       // 1x
      maxAllocation: 2000n * 10n ** 6n,                 // $2,000
      guaranteed: false,
      lotteryWinners: 300,
      poolWeightBps: 1500,                              // 15% of pool
      stakingCooldown: 14 * 24 * 60 * 60,
      color: '#c0c0c0',
      icon: 'shield-silver',
    },
    {
      name: 'Gold',
      level: 3,
      minStakeAmount: 25000n * 10n ** 18n,
      maxStakeAmount: 100000n * 10n ** 18n,
      allocationWeightBps: 20000,                       // 2x
      maxAllocation: 10000n * 10n ** 6n,                // $10,000
      guaranteed: true,
      poolWeightBps: 2500,                              // 25% of pool
      stakingCooldown: 30 * 24 * 60 * 60,
      color: '#ffd700',
      icon: 'shield-gold',
    },
    {
      name: 'Diamond',
      level: 4,
      minStakeAmount: 100000n * 10n ** 18n,
      maxStakeAmount: 500000n * 10n ** 18n,
      allocationWeightBps: 40000,                       // 4x
      maxAllocation: 25000n * 10n ** 6n,                // $25,000
      guaranteed: true,
      poolWeightBps: 2500,                              // 25% of pool
      stakingCooldown: 30 * 24 * 60 * 60,
      color: '#b9f2ff',
      icon: 'diamond',
    },
    {
      name: 'Legendary',
      level: 5,
      minStakeAmount: 500000n * 10n ** 18n,
      maxStakeAmount: null,                              // Unlimited
      allocationWeightBps: 80000,                        // 8x
      maxAllocation: 50000n * 10n ** 6n,                 // $50,000
      guaranteed: true,
      poolWeightBps: 2500,                               // 25% of pool
      stakingCooldown: 60 * 24 * 60 * 60,
      color: '#ff6b35',
      icon: 'crown',
    },
  ],

  // Compliance
  requiresKyc: true,
  restrictedJurisdictions: ['US', 'CN', 'KP', 'IR', 'CU', 'SY'],
  minAcsScore: 50,

  // Listing configuration
  listingConfig: {
    dexId: 'uniswap-v3',
    initialLiquidityPercent: 30,                         // 30% of raise
    lockDuration: 180 * 24 * 60 * 60,                    // 6 months LP lock
    listingPrice: 250000n,                               // $0.25 (25% premium)
    cexListings: ['gate.io', 'kucoin'],
  },

  // Metadata
  websiteUrl: 'https://meridian.protocol',
  whitepaperUrl: 'https://docs.meridian.protocol/whitepaper',
  socialLinks: {
    twitter: 'https://twitter.com/meridianprotocol',
    discord: 'https://discord.gg/meridian',
    telegram: 'https://t.me/meridian_official',
  },
  auditUrls: [
    'https://audits.certik.com/meridian',
    'https://audits.trail-of-bits.com/meridian',
  ],
  tags: ['defi', 'cross-chain', 'messaging', 'infrastructure'],
});

console.log(`Launch created: ${launch.id} (${launch.slug})`);
console.log(`Status: ${launch.status}`);
console.log(`Phases: ${launch.phases.length}`);
console.log(`Allocation tiers: 5`);
console.log(`Hard cap: $${Number(launch.hardCap) / 1e6}M`);
```

### 2. Manage Whitelist and Run Lottery

```typescript
import {
  WhitelistService,
  AllocationService,
  WhitelistStatus,
} from '@mcv/token-economy/launchpad';

const whitelist = container.resolve(WhitelistService);
const allocation = container.resolve(AllocationService);

// ── Register a user for the whitelist ──────────────────────────
const entry = await whitelist.register({
  launchId: 'launch_mrdn_001',
  userId: 'user_alice_001',
  walletAddress: '0x742d35Cc6634C0532925a3b844Bc9e7595f2bD28',
});

console.log(`Registered: ${entry.id}, status: ${entry.status}`);
// → Registered: wl_001, status: pending

// ── Batch register from CSV import ─────────────────────────────
const batchResult = await whitelist.batchRegister({
  launchId: 'launch_mrdn_001',
  entries: [
    { userId: 'user_bob_001', walletAddress: '0xabc...123' },
    { userId: 'user_carol_001', walletAddress: '0xdef...456' },
    { userId: 'user_dave_001', walletAddress: '0x789...abc' },
    // ... potentially thousands of entries
  ],
  skipDuplicates: true,
});

console.log(`Batch: ${batchResult.registered} registered, ${batchResult.skipped} skipped`);

// ── Take staking snapshot and calculate tiers ──────────────────
const snapshot = await allocation.takeSnapshot({
  launchId: 'launch_mrdn_001',
  snapshotType: 'combined',             // Both staking and ACS
  // blockNumber is auto-resolved to latest if not specified
});

console.log(`Snapshot taken at block ${snapshot.blockNumber}`);
console.log(`Tier distribution:`, snapshot.tierDistribution);
// → { Bronze: 1250, Silver: 800, Gold: 350, Diamond: 120, Legendary: 45 }

// ── Process KYC verifications ──────────────────────────────────
await whitelist.updateKycStatus({
  launchId: 'launch_mrdn_001',
  userId: 'user_alice_001',
  verified: true,
  reference: 'kyc_sumnsub_ref_001',
  jurisdiction: 'CA',                   // Canada
});

// ── Bulk KYC status update from provider webhook ───────────────
await whitelist.bulkUpdateKycStatus({
  launchId: 'launch_mrdn_001',
  updates: [
    { userId: 'user_bob_001', verified: true, jurisdiction: 'GB' },
    { userId: 'user_carol_001', verified: false, rejectionReason: 'Document expired' },
    { userId: 'user_dave_001', verified: true, jurisdiction: 'DE' },
  ],
});

// ── Run lottery for non-guaranteed tiers ────────────────────────
const lotteryResult = await allocation.runLottery({
  launchId: 'launch_mrdn_001',
  // Only Bronze and Silver are lottery-based in our config
  tiers: ['bronze', 'silver'],
  // Verifiable random seed (e.g., from VRF or block hash)
  randomSeed: '0xdeadbeef1234567890abcdef...',
  // Exclude users who failed KYC
  excludeKycFailed: true,
});

console.log('Lottery results:');
console.log(`  Bronze: ${lotteryResult.tiers.bronze.winners} winners / ${lotteryResult.tiers.bronze.total} entries`);
console.log(`  Silver: ${lotteryResult.tiers.silver.winners} winners / ${lotteryResult.tiers.silver.total} entries`);

// ── Check individual whitelist status ──────────────────────────
const aliceStatus = await whitelist.getEntry('launch_mrdn_001', 'user_alice_001');

console.log(`Alice status: ${aliceStatus.status}`);           // → approved
console.log(`Alice tier: ${aliceStatus.tierId}`);              // → gold
console.log(`Alice max allocation: $${Number(aliceStatus.maxAllocation) / 1e6}`);
console.log(`Alice guaranteed: ${aliceStatus.isGuaranteed}`);  // → true (Gold tier)

// ── Get full whitelist with pagination ─────────────────────────
const whitelistPage = await whitelist.list({
  launchId: 'launch_mrdn_001',
  status: WhitelistStatus.APPROVED,
  page: 1,
  pageSize: 50,
  sortBy: 'tier_level',
  sortOrder: 'desc',
});

console.log(`Total approved: ${whitelistPage.total}`);
console.log(`Page 1 entries: ${whitelistPage.items.length}`);
```

### 3. Execute Sale and Handle Participations

```typescript
import {
  LaunchpadService,
  SaleExecutionService,
  RefundService,
  PhaseType,
} from '@mcv/token-economy/launchpad';

const launchpad = container.resolve(LaunchpadService);
const saleExec = container.resolve(SaleExecutionService);
const refunds = container.resolve(RefundService);

const LAUNCH_ID = 'launch_mrdn_001';

// ── Advance to Sale phase ──────────────────────────────────────
// (Assumes all prior phases are completed)
const phase = await launchpad.advancePhase(LAUNCH_ID);
console.log(`Advanced to: ${phase.phaseType}`);  // → sale

// ── User participates in the sale ──────────────────────────────
const participation = await launchpad.participate(
  LAUNCH_ID,
  'user_alice_001',
  5000n * 10n ** 6n,                     // $5,000 USDC
  'USDC',
);

console.log(`Participation ID: ${participation.id}`);
console.log(`Committed: $${Number(participation.committedAmount) / 1e6}`);
console.log(`Status: ${participation.status}`);  // → committed
console.log(`Tier: ${participation.tierId}`);     // → gold

// ── Check allocation limits in real-time ───────────────────────
const allocationCheck = await saleExec.checkAllocation({
  launchId: LAUNCH_ID,
  userId: 'user_alice_001',
  requestedAmount: 8000n * 10n ** 6n,   // Trying another $8K
});

console.log(`Can participate: ${allocationCheck.allowed}`);
console.log(`Remaining allocation: $${Number(allocationCheck.remaining) / 1e6}`);
console.log(`Reason: ${allocationCheck.reason}`);
// → "Exceeds tier maximum allocation of $10,000"

// ── Monitor sale progress ──────────────────────────────────────
const saleProgress = await saleExec.getProgress(LAUNCH_ID);

console.log(`Total raised: $${Number(saleProgress.totalRaised) / 1e6}`);
console.log(`Soft cap: ${saleProgress.softCapReached ? '✅' : '❌'}`);
console.log(`Hard cap progress: ${saleProgress.hardCapPercentBps / 100}%`);
console.log(`Participants: ${saleProgress.participantCount}`);
console.log(`Time remaining: ${saleProgress.timeRemainingSeconds}s`);

// ── Sale ends — settle results ─────────────────────────────────
await launchpad.advancePhase(LAUNCH_ID);   // → settlement

const settlement = await saleExec.settle(LAUNCH_ID);

console.log('Settlement complete:');
console.log(`  Final price: $${Number(settlement.finalPrice) / 1e6}`);
console.log(`  Total raised: $${Number(settlement.totalRaised) / 1e6}`);
console.log(`  Tokens sold: ${Number(settlement.tokensSold) / 1e18}`);
console.log(`  Participants: ${settlement.participantCount}`);
console.log(`  Fill rate: ${settlement.fillRateBps / 100}%`);

// ── Handle case where soft cap was NOT met ─────────────────────
if (!settlement.softCapReached) {
  console.log('Soft cap not met — initiating full refunds');

  const refundBatch = await refunds.processLaunchRefunds({
    launchId: LAUNCH_ID,
    reason: RefundReason.SOFT_CAP_NOT_MET,
  });

  console.log(`Refunds processed: ${refundBatch.count}`);
  console.log(`Total refunded: $${Number(refundBatch.totalAmount) / 1e6}`);
  // Launch status automatically transitions to FAILED
}

// ── Distribute tokens (if sale succeeded) ──────────────────────
if (settlement.softCapReached) {
  await launchpad.advancePhase(LAUNCH_ID);   // → distribution

  const distribution = await saleExec.distributeTokens(LAUNCH_ID);

  console.log('Distribution complete:');
  console.log(`  TGE tokens sent: ${distribution.tgeDistributed}`);
  console.log(`  Vesting contracts created: ${distribution.vestingContractsCreated}`);
  console.log(`  Total recipients: ${distribution.recipientCount}`);

  for (const dist of distribution.distributions) {
    console.log(`  ${dist.userId}: ${Number(dist.tgeAmount) / 1e18} MRDN (TGE) + ${Number(dist.vestedAmount) / 1e18} MRDN (vesting)`);
  }
}
```

### 4. Configure and Manage Vesting

```typescript
import {
  VestingService,
  VestingType,
} from '@mcv/token-economy/launchpad';

const vesting = container.resolve(VestingService);

const LAUNCH_ID = 'launch_mrdn_001';

// ── Get a user's vesting contract ──────────────────────────────
const contract = await vesting.getContract(LAUNCH_ID, 'user_alice_001');

console.log('Vesting contract:');
console.log(`  Type: ${contract.vestingType}`);           // → cliff_linear
console.log(`  Total: ${Number(contract.totalAmount) / 1e18} MRDN`);
console.log(`  TGE (20%): ${Number(contract.tgeAmount) / 1e18} MRDN`);
console.log(`  TGE claimed: ${contract.tgeClaimed}`);
console.log(`  Cliff ends: ${contract.cliffEndsAt?.toISOString()}`);
console.log(`  Vesting ends: ${contract.endsAt.toISOString()}`);
console.log(`  Periods: ${contract.totalPeriods}`);
console.log(`  Already claimed: ${Number(contract.claimedAmount) / 1e18} MRDN`);
console.log(`  Currently claimable: ${Number(contract.claimableAmount) / 1e18} MRDN`);

// ── Claim TGE tokens ───────────────────────────────────────────
const tgeClaim = await vesting.claimTge(LAUNCH_ID, 'user_alice_001');
console.log(`TGE claimed: ${Number(tgeClaim.amount) / 1e18} MRDN`);
console.log(`TX: ${tgeClaim.txHash}`);

// ── Claim vested tokens (after cliff) ──────────────────────────
const claimable = await vesting.getClaimableAmount(LAUNCH_ID, 'user_alice_001');

console.log('Claimable breakdown:');
console.log(`  Available now: ${Number(claimable.amount) / 1e18} MRDN`);
console.log(`  Periods vested: ${claimable.periodsVested}/${claimable.totalPeriods}`);
console.log(`  Next unlock: ${claimable.nextUnlockAt?.toISOString()}`);
console.log(`  Next unlock amount: ${Number(claimable.nextUnlockAmount) / 1e18} MRDN`);

if (claimable.amount > 0n) {
  const claim = await vesting.claim(LAUNCH_ID, 'user_alice_001');
  console.log(`Claimed ${Number(claim.amount) / 1e18} MRDN — period ${claim.periodNumber}`);
}

// ── Build a custom vesting schedule ────────────────────────────
const customSchedule = await vesting.buildSchedule({
  type: VestingType.CUSTOM,
  totalAmount: 100_000n * 10n ** 18n,         // 100K tokens
  milestones: [
    { unlockBps: 1000, unlockAt: new Date('2026-03-25'), description: 'TGE - 10%' },
    { unlockBps: 500,  unlockAt: new Date('2026-06-25'), description: 'Q2 unlock - 5%' },
    { unlockBps: 1000, unlockAt: new Date('2026-09-25'), description: 'Q3 unlock - 10%' },
    { unlockBps: 1500, unlockAt: new Date('2026-12-25'), description: 'Q4 unlock - 15%' },
    { unlockBps: 2000, unlockAt: new Date('2027-03-25'), description: 'Y2 Q1 unlock - 20%' },
    { unlockBps: 2000, unlockAt: new Date('2027-06-25'), description: 'Y2 Q2 unlock - 20%' },
    { unlockBps: 2000, unlockAt: new Date('2027-09-25'), description: 'Y2 Q3 final - 20%' },
  ],
});

console.log('Custom schedule created:');
for (const m of customSchedule.milestones) {
  const tokens = Number(m.unlockBps * 100_000n) / 10000;
  console.log(`  ${m.unlockAt.toISOString().slice(0,10)}: ${tokens} tokens (${m.unlockBps / 100}%) — ${m.description}`);
}

// ── Get vesting overview for an entire launch ──────────────────
const vestingOverview = await vesting.getLaunchOverview(LAUNCH_ID);

console.log('Launch vesting overview:');
console.log(`  Total contracts: ${vestingOverview.totalContracts}`);
console.log(`  Total locked: ${Number(vestingOverview.totalLocked) / 1e18} MRDN`);
console.log(`  Total claimed: ${Number(vestingOverview.totalClaimed) / 1e18} MRDN`);
console.log(`  Total claimable: ${Number(vestingOverview.totalClaimable) / 1e18} MRDN`);
console.log(`  Claim rate: ${vestingOverview.claimRateBps / 100}%`);
console.log(`  Next bulk unlock: ${vestingOverview.nextBulkUnlock.toISOString()}`);

// ── Revoke vesting (for team/advisor tokens with revocable flag) ──
try {
  await vesting.revoke(LAUNCH_ID, 'user_teamMember_001', {
    reason: 'Team member departure',
    returnUnvestedTo: '0xTreasury...',
  });
  console.log('Vesting revoked — unvested tokens returned to treasury');
} catch (err) {
  console.error(`Cannot revoke: ${err.message}`);
  // → "Cannot revoke: vesting contract is not revocable"
}
```

### 5. Configure and Run a Liquidity Bootstrapping Pool (LBP)

```typescript
import {
  FairLaunchService,
  SaleMechanism,
  LaunchType,
} from '@mcv/token-economy/launchpad';

const fairLaunch = container.resolve(FairLaunchService);

// ── Configure an LBP (Liquidity Bootstrapping Pool) ────────────
// LBPs use a weighted pool where the project token weight decreases
// over time, creating natural price discovery. Early buyers pay more;
// the price trends downward unless buying pressure sustains it.

const lbpLaunch = await fairLaunch.createLBP({
  name: 'Nova Finance LBP',
  slug: 'nova-finance-lbp-2026',
  projectId: 'proj_nova_001',
  launchType: LaunchType.FAIR_LAUNCH,

  tokenId: 'token_nova_001',
  tokenSymbol: 'NOVA',
  tokenDecimals: 18,
  totalSupply: 500_000_000n * 10n ** 18n,

  lbpConfig: {
    // Pool starts 90% NOVA / 10% USDC
    // Ends at 50% NOVA / 50% USDC
    startWeightBps: 9000,
    endWeightBps: 5000,

    collateralToken: 'USDC',
    initialCollateral: 500_000n * 10n ** 6n,            // $500K USDC seed
    initialProjectTokens: 25_000_000n * 10n ** 18n,     // 25M NOVA (5%)

    duration: 72 * 60 * 60,                             // 72 hours
    swapFeeBps: 200,                                    // 2% swap fee
    allowSelling: false,                                // No dumping during LBP
    maxSwapAmount: 50_000n * 10n ** 6n,                 // $50K max per swap (anti-whale)
    weightUpdateInterval: 60,                           // Update weights every 60 seconds

    dexId: 'balancer-v2',
  },

  // No vesting for LBP — tokens are received immediately via swaps
  tgeUnlockBps: 10000,                                  // 100% at TGE
  vestingSchedule: { type: 'none' },

  // No KYC for fair launch (lower regulatory burden)
  requiresKyc: false,
  restrictedJurisdictions: ['US', 'KP'],
  minAcsScore: 0,

  startsAt: new Date('2026-04-01T14:00:00Z'),
});

console.log(`LBP created: ${lbpLaunch.id}`);

// ── Monitor LBP price during execution ─────────────────────────
const lbpStatus = await fairLaunch.getLBPStatus(lbpLaunch.id);

console.log('LBP Status:');
console.log(`  Current NOVA weight: ${lbpStatus.currentWeightBps / 100}%`);
console.log(`  Current USDC weight: ${(10000 - lbpStatus.currentWeightBps) / 100}%`);
console.log(`  Current price: $${lbpStatus.currentPrice.toFixed(6)}`);
console.log(`  Starting price: $${lbpStatus.startPrice.toFixed(6)}`);
console.log(`  Total volume: $${Number(lbpStatus.totalVolume) / 1e6}`);
console.log(`  Unique participants: ${lbpStatus.uniqueParticipants}`);
console.log(`  Time elapsed: ${lbpStatus.elapsedPercent}%`);
console.log(`  Pool NOVA remaining: ${Number(lbpStatus.novaBalance) / 1e18}`);
console.log(`  Pool USDC balance: $${Number(lbpStatus.usdcBalance) / 1e6}`);

// ── Simulate a swap before executing ───────────────────────────
const swapSim = await fairLaunch.simulateLBPSwap({
  launchId: lbpLaunch.id,
  inputToken: 'USDC',
  inputAmount: 10_000n * 10n ** 6n,                    // $10K USDC
});

console.log('Swap simulation:');
console.log(`  Input: $${Number(swapSim.inputAmount) / 1e6} USDC`);
console.log(`  Output: ${Number(swapSim.outputAmount) / 1e18} NOVA`);
console.log(`  Effective price: $${swapSim.effectivePrice.toFixed(6)}/NOVA`);
console.log(`  Price impact: ${swapSim.priceImpactBps / 100}%`);
console.log(`  Swap fee: $${Number(swapSim.feeAmount) / 1e6}`);
console.log(`  Slippage: ${swapSim.slippageBps / 100}%`);

// ── Execute the swap ───────────────────────────────────────────
const swap = await fairLaunch.executeLBPSwap({
  launchId: lbpLaunch.id,
  userId: 'user_alice_001',
  inputToken: 'USDC',
  inputAmount: 10_000n * 10n ** 6n,
  minOutputAmount: swapSim.outputAmount * 99n / 100n,  // 1% slippage tolerance
});

console.log(`Swap executed: ${Number(swap.outputAmount) / 1e18} NOVA received`);

// ── Get LBP price history for charting ─────────────────────────
const priceHistory = await fairLaunch.getLBPPriceHistory({
  launchId: lbpLaunch.id,
  interval: '5m',                                      // 5-minute candles
  limit: 100,
});

for (const candle of priceHistory.candles.slice(-5)) {
  console.log(
    `  ${candle.timestamp.toISOString()}: ` +
    `O:$${candle.open.toFixed(4)} H:$${candle.high.toFixed(4)} ` +
    `L:$${candle.low.toFixed(4)} C:$${candle.close.toFixed(4)} ` +
    `V:$${Number(candle.volume) / 1e6}k`
  );
}
```

### 6. Dutch Auction Configuration and Execution

```typescript
import { FairLaunchService, LaunchpadService } from '@mcv/token-economy/launchpad';

const fairLaunch = container.resolve(FairLaunchService);
const launchpad = container.resolve(LaunchpadService);

// ── Create a Dutch Auction sale ────────────────────────────────
// Price starts high and decreases over time until all tokens sell
// or the reserve price is reached. All buyers pay the clearing price.

const dutchLaunch = await launchpad.createLaunch({
  name: 'Prism Network Dutch Auction',
  slug: 'prism-dutch-auction-2026',
  launchType: 'ido',
  saleMechanism: 'dutch_auction',
  projectId: 'proj_prism_001',

  tokenId: 'token_prism_001',
  tokenSymbol: 'PRSM',
  tokenDecimals: 18,
  totalSupply: 200_000_000n * 10n ** 18n,
  launchAllocation: 20_000_000n * 10n ** 18n,            // 10%

  paymentTokens: ['USDC'],
  priceDenomination: 'USDC',

  fairLaunchConfig: {
    mechanism: 'dutch_auction',
    config: {
      startPrice: 2_000_000n,                            // $2.00 per token
      reservePrice: 200_000n,                             // $0.20 per token (floor)
      decayModel: 'exponential',
      duration: 24 * 60 * 60,                             // 24 hours
      priceUpdateInterval: 300,                           // Every 5 minutes
      decayFactorBps: 50,                                 // 0.5% per interval
      uniformPricing: true,                               // All pay clearing price
    },
  },

  softCap: 2_000_000n * 10n ** 6n,                       // $2M
  hardCap: 40_000_000n * 10n ** 6n,                       // $40M (at start price)
  minParticipation: 500n * 10n ** 6n,                     // $500 min
  maxParticipation: 500_000n * 10n ** 6n,                 // $500K max

  tgeUnlockBps: 5000,                                     // 50% at TGE
  vestingSchedule: {
    type: 'cliff_linear',
    cliffDuration: 30 * 24 * 60 * 60,                     // 30 days cliff
    vestingDuration: 180 * 24 * 60 * 60,                   // 6 months linear
    releaseFrequency: 30 * 24 * 60 * 60,                   // Monthly
  },

  requiresKyc: true,
  restrictedJurisdictions: ['US', 'CN', 'KP'],
  minAcsScore: 25,

  startsAt: new Date('2026-05-01T14:00:00Z'),
  phases: [/* ... configured phases ... */],
});

// ── Monitor price during Dutch auction ─────────────────────────
const auctionStatus = await fairLaunch.getDutchAuctionStatus(dutchLaunch.id);

console.log('Dutch Auction Status:');
console.log(`  Current price: $${Number(auctionStatus.currentPrice) / 1e6}`);
console.log(`  Starting price: $${Number(auctionStatus.startPrice) / 1e6}`);
console.log(`  Reserve price: $${Number(auctionStatus.reservePrice) / 1e6}`);
console.log(`  Price intervals elapsed: ${auctionStatus.intervalsElapsed}`);
console.log(`  Total committed: $${Number(auctionStatus.totalCommitted) / 1e6}`);
console.log(`  Tokens committed: ${Number(auctionStatus.tokensCommitted) / 1e18}`);
console.log(`  Remaining tokens: ${Number(auctionStatus.tokensRemaining) / 1e18}`);

// ── Bid at current price ───────────────────────────────────────
const bid = await launchpad.participate(
  dutchLaunch.id,
  'user_bob_001',
  100_000n * 10n ** 6n,                                   // $100K USDC commitment
  'USDC',
);

console.log(`Bid placed at price: $${Number(bid.pricePerToken) / 1e6}`);
console.log(`Tokens reserved: ${Number(bid.tokenAllocation) / 1e18} PRSM`);

// ── After auction settles with uniform pricing ─────────────────
// All participants pay the clearing price (last price when all tokens sold)
// Those who bid at higher prices receive a refund for the difference

const settlement = await fairLaunch.settleDutchAuction(dutchLaunch.id);

console.log(`Clearing price: $${Number(settlement.clearingPrice) / 1e6}`);
console.log(`Refunds to process: ${settlement.refundsRequired}`);
console.log(`Total refund amount: $${Number(settlement.totalRefundAmount) / 1e6}`);
```

### 7. Launch Analytics and Post-Launch Monitoring

```typescript
import { LaunchAnalyticsService } from '@mcv/token-economy/launchpad';

const analytics = container.resolve(LaunchAnalyticsService);

const LAUNCH_ID = 'launch_mrdn_001';

// ── Get comprehensive launch metrics ───────────────────────────
const metrics = await analytics.getLaunchMetrics(LAUNCH_ID);

console.log('═══════════════════════════════════════════════');
console.log('    MERIDIAN PROTOCOL IDO — FINAL METRICS');
console.log('═══════════════════════════════════════════════');
console.log('');
console.log('FUNDRAISE');
console.log(`  Total raised:        $${(Number(metrics.totalRaised) / 1e6).toLocaleString()}`);
console.log(`  Hard cap:            $${(Number(metrics.hardCap) / 1e6).toLocaleString()}`);
console.log(`  Fill rate:           ${(metrics.fillRateBps / 100).toFixed(1)}%`);
console.log(`  Soft cap reached:    ${metrics.softCapReached ? '✅ Yes' : '❌ No'}`);
console.log('');
console.log('PARTICIPATION');
console.log(`  Total participants:  ${metrics.participantCount.toLocaleString()}`);
console.log(`  Unique wallets:      ${metrics.uniqueWallets.toLocaleString()}`);
console.log(`  Whitelist entries:   ${metrics.whitelistEntries.toLocaleString()}`);
console.log(`  Conversion rate:     ${(metrics.conversionRateBps / 100).toFixed(1)}%`);
console.log(`  Avg participation:   $${(Number(metrics.avgParticipation) / 1e6).toFixed(2)}`);
console.log(`  Median participation:$${(Number(metrics.medianParticipation) / 1e6).toFixed(2)}`);
console.log('');
console.log('ALLOCATION TIERS');
for (const tier of metrics.tierBreakdown) {
  console.log(`  ${tier.name.padEnd(12)} ${tier.participantCount.toString().padStart(5)} users | ` +
    `$${(Number(tier.totalRaised) / 1e6).toLocaleString().padStart(12)} raised | ` +
    `${(tier.fillRateBps / 100).toFixed(1).padStart(5)}% filled`);
}
console.log('');
console.log('TOKEN DISTRIBUTION');
console.log(`  Tokens sold:         ${(Number(metrics.tokensSold) / 1e18).toLocaleString()} MRDN`);
console.log(`  TGE distributed:     ${(Number(metrics.tgeDistributed) / 1e18).toLocaleString()} MRDN`);
console.log(`  Under vesting:       ${(Number(metrics.tokensVesting) / 1e18).toLocaleString()} MRDN`);
console.log(`  Claimed so far:      ${(Number(metrics.tokensClaimed) / 1e18).toLocaleString()} MRDN`);
console.log('');
console.log('REFUNDS');
console.log(`  Total refunds:       ${metrics.refundCount}`);
console.log(`  Refund amount:       $${(Number(metrics.totalRefunded) / 1e6).toLocaleString()}`);
console.log(`  Overflow refunds:    ${metrics.overflowRefundCount}`);
console.log(`  KYC failures:        ${metrics.kycFailureCount}`);

// ── Post-launch price performance ──────────────────────────────
const performance = await analytics.getPricePerformance(LAUNCH_ID, [
  '1h', '4h', '24h', '7d', '30d',
]);

console.log('');
console.log('POST-LAUNCH PRICE');
console.log(`  Launch price:        $${Number(performance.launchPrice) / 1e6}`);
console.log(`  Current price:       $${performance.currentPrice.toFixed(6)}`);

for (const interval of performance.intervals) {
  const direction = interval.changeBps >= 0 ? '📈' : '📉';
  console.log(`  ${interval.label.padEnd(6)} ${direction} ${(interval.changeBps / 100).toFixed(1)}% ` +
    `($${interval.price.toFixed(6)})`);
}

// ── Geographic distribution of participants ────────────────────
const geoMetrics = await analytics.getGeographicDistribution(LAUNCH_ID);

console.log('');
console.log('GEOGRAPHIC DISTRIBUTION');
for (const geo of geoMetrics.topCountries.slice(0, 10)) {
  const bar = '█'.repeat(Math.round(geo.percentBps / 500));
  console.log(`  ${geo.country.padEnd(4)} ${bar} ${(geo.percentBps / 100).toFixed(1)}% (${geo.count} users)`);
}

// ── Export full analytics report ───────────────────────────────
const report = await analytics.generateReport(LAUNCH_ID, {
  format: 'json',
  includeParticipantDetails: false,                      // GDPR-safe
  includeTimeSeries: true,
  timeSeriesInterval: '1h',
});

console.log(`Report generated: ${report.url}`);
console.log(`Report size: ${(report.sizeBytes / 1024).toFixed(0)} KB`);
```

---

## Error Codes

| Code | Constant | HTTP | Description |
|------|----------|------|-------------|
| `LPAD_001` | `LAUNCH_NOT_FOUND` | 404 | Launch with the specified ID does not exist |
| `LPAD_002` | `LAUNCH_WRONG_PHASE` | 409 | Operation not allowed in the current launch phase |
| `LPAD_003` | `LAUNCH_ALREADY_ACTIVE` | 409 | Cannot modify launch configuration after sale has started |
| `LPAD_004` | `LAUNCH_CANCELLED` | 410 | Launch has been cancelled; no further operations allowed |
| `LPAD_005` | `LAUNCH_FAILED` | 410 | Launch failed (soft cap not met); refunds in progress |
| `LPAD_010` | `WHITELIST_NOT_OPEN` | 409 | Whitelist registration is not currently open |
| `LPAD_011` | `WHITELIST_ALREADY_REGISTERED` | 409 | User is already registered for this launch's whitelist |
| `LPAD_012` | `WHITELIST_NOT_APPROVED` | 403 | User's whitelist entry is not in approved status |
| `LPAD_013` | `WHITELIST_KYC_REQUIRED` | 403 | KYC verification is required but not completed |
| `LPAD_014` | `WHITELIST_KYC_FAILED` | 403 | KYC verification failed; user cannot participate |
| `LPAD_015` | `WHITELIST_JURISDICTION_RESTRICTED` | 403 | User's jurisdiction is restricted for this launch |
| `LPAD_020` | `ALLOCATION_EXCEEDS_TIER` | 400 | Requested amount exceeds user's tier allocation limit |
| `LPAD_021` | `ALLOCATION_BELOW_MINIMUM` | 400 | Requested amount is below minimum participation threshold |
| `LPAD_022` | `ALLOCATION_TIER_NOT_FOUND` | 404 | User does not qualify for any allocation tier |
| `LPAD_023` | `ALLOCATION_INSUFFICIENT_STAKE` | 403 | User's staking amount does not meet minimum tier requirement |
| `LPAD_024` | `ALLOCATION_COOLDOWN_NOT_MET` | 403 | User has not staked for the required cooldown period |
| `LPAD_025` | `ALLOCATION_ACS_INSUFFICIENT` | 403 | User's ACS score does not meet the minimum requirement |
| `LPAD_030` | `SALE_NOT_ACTIVE` | 409 | Sale window is not currently open |
| `LPAD_031` | `SALE_HARD_CAP_REACHED` | 409 | Hard cap has been reached; no more participation accepted |
| `LPAD_032` | `SALE_ALREADY_PARTICIPATED` | 409 | User has already participated (non-overflow mechanisms) |
| `LPAD_033` | `SALE_INVALID_PAYMENT_TOKEN` | 400 | Payment token is not accepted for this launch |
| `LPAD_034` | `SALE_INSUFFICIENT_FUNDS` | 400 | User has insufficient balance of the payment token |
| `LPAD_035` | `SALE_SETTLEMENT_FAILED` | 500 | Sale settlement computation failed; manual intervention required |
| `LPAD_040` | `VESTING_NOT_STARTED` | 409 | Vesting period has not started yet |
| `LPAD_041` | `VESTING_CLIFF_ACTIVE` | 409 | Cliff period is still active; no tokens claimable yet |
| `LPAD_042` | `VESTING_NOTHING_CLAIMABLE` | 400 | No tokens are currently available to claim |
| `LPAD_043` | `VESTING_CONTRACT_NOT_FOUND` | 404 | Vesting contract not found for this user and launch |
| `LPAD_044` | `VESTING_ALREADY_CLAIMED` | 409 | This vesting period has already been claimed |
| `LPAD_045` | `VESTING_REVOKED` | 410 | Vesting contract has been revoked |
| `LPAD_046` | `VESTING_NOT_REVOCABLE` | 403 | This vesting contract is not configured as revocable |
| `LPAD_050` | `REFUND_ALREADY_PROCESSED` | 409 | Refund has already been processed for this participation |
| `LPAD_051` | `REFUND_NOT_ELIGIBLE` | 400 | Participation is not eligible for a refund |
| `LPAD_052` | `REFUND_PROCESSING_FAILED` | 500 | Refund transaction failed; retry or escalate |
| `LPAD_060` | `PHASE_PRECONDITION_NOT_MET` | 409 | One or more preconditions for phase transition are not satisfied |
| `LPAD_061` | `PHASE_CANNOT_ADVANCE` | 409 | Current phase does not allow advancement (check blockers) |
| `LPAD_062` | `PHASE_MANUAL_APPROVAL_REQUIRED` | 403 | This phase transition requires manual admin approval |
| `LPAD_070` | `LBP_SELLING_DISABLED` | 403 | Selling (swapping project tokens for collateral) is disabled during this LBP |
| `LPAD_071` | `LBP_MAX_SWAP_EXCEEDED` | 400 | Swap amount exceeds the maximum per-transaction limit (anti-whale) |
| `LPAD_072` | `LBP_EXCESSIVE_SLIPPAGE` | 400 | Swap would result in slippage exceeding the specified tolerance |
| `LPAD_073` | `DUTCH_AUCTION_BELOW_RESERVE` | 409 | Dutch auction has reached the reserve price; auction ending |
| `LPAD_080` | `LISTING_CONFIG_INVALID` | 400 | Post-launch listing configuration is invalid or incomplete |
| `LPAD_081` | `LISTING_LIQUIDITY_INSUFFICIENT` | 400 | Insufficient funds allocated for initial liquidity provision |
| `LPAD_090` | `SNAPSHOT_ALREADY_TAKEN` | 409 | Staking/ACS snapshot has already been taken for this launch |
| `LPAD_091` | `SNAPSHOT_BLOCK_UNAVAILABLE` | 500 | Requested block number is not available for snapshotting |
| `LPAD_099` | `LAUNCH_INTERNAL_ERROR` | 500 | Internal launchpad error; contact support with the error reference |

---

## Security Considerations

Token launches are among the highest-value targets in the crypto ecosystem. A single launch may handle millions of dollars in deposits and control token allocations that determine the initial distribution of a new asset. The launchpad module implements defense-in-depth across multiple layers.

### Financial Security

- **Escrow isolation** — All participant deposits are held in isolated escrow accounts, never commingled with operational funds. Each launch has its own escrow address, and the module enforces strict accounting reconciliation before any phase transition.

- **Double-entry accounting** — Every financial operation (deposit, allocation, refund, distribution) creates paired debit/credit entries. The system continuously validates that the sum of all entries is zero, and any imbalance immediately triggers an alert and pauses the launch.

- **Atomic settlement** — Sale settlement and token distribution use database transactions with serializable isolation to prevent race conditions. If any part of the settlement fails, the entire operation rolls back.

- **Overflow protection** — For overflow-model sales, the pro-rata calculation and refund generation happen atomically. The system guarantees that `sum(effective_amounts) + sum(refund_amounts) == sum(committed_amounts)` for every participant.

- **Rate limiting** — Participation endpoints are rate-limited per user and per IP to prevent deposit spam attacks. The module enforces configurable rate limits: default is 5 participation attempts per minute per user.

### Access Control

- **Role-based permissions** — Launch creation requires `launchpad:create` permission. Phase advancement requires `launchpad:admin`. Participation requires `launchpad:participate` and a valid whitelist entry. Vesting claims require proof of ownership.

- **Multi-sig for critical operations** — Launch cancellation, emergency pause, and manual phase advancement require multi-signature approval from at least 2 of 3 designated signers.

- **Audit trail** — Every administrative action is logged with the actor's identity, timestamp, IP address, and the before/after state. The audit log is append-only and stored separately from the operational database.

### Smart Contract Security

- **Vesting contract verification** — All vesting contracts are deployed from audited factory contracts. The module verifies bytecode matches before recording on-chain addresses.

- **Reentrancy protection** — On-chain distribution and claim functions use the checks-effects-interactions pattern and reentrancy guards.

- **Allowance management** — Token approvals are set to exact amounts, never unlimited. Approvals are revoked after distribution completes.

### Anti-Gaming

- **Sybil resistance** — KYC verification, minimum ACS score requirements, and staking cooldown periods combine to make Sybil attacks economically infeasible. The staking cooldown ensures participants can't stake just before the snapshot.

- **Frontrunning protection** — For Dutch auctions and LBPs, the module uses commit-reveal schemes or private mempools where supported. Sealed bid auctions inherently resist frontrunning.

- **Snapshot immutability** — Once a staking/ACS snapshot is taken, it is hashed (Merkle root), stored on IPFS, and the root is recorded on-chain. This prevents retroactive manipulation of tier assignments.

- **Anti-whale mechanisms** — Per-tier maximum allocations, per-transaction swap limits (LBP), and participation caps prevent concentration of token allocation.

### Data Protection

- **KYC data handling** — The module stores only KYC verification status and provider references, never raw identity documents. All KYC data is handled by external verified providers (Sumsub, Jumio, etc.) and subject to data retention policies.

- **Jurisdiction filtering** — Restricted jurisdiction checks happen at whitelist registration, KYC verification, and participation time — three independent checkpoints to prevent bypass.

---

## Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `LAUNCHPAD_DATABASE_URL` | Yes | — | PostgreSQL connection string for launchpad tables |
| `LAUNCHPAD_ESCROW_WALLET_SEED` | Yes | — | HD wallet seed for generating launch-specific escrow addresses |
| `LAUNCHPAD_KYC_PROVIDER` | Yes | — | KYC provider identifier: `sumsub`, `jumio`, `synaps` |
| `LAUNCHPAD_KYC_API_KEY` | Yes | — | API key for the KYC provider |
| `LAUNCHPAD_KYC_API_SECRET` | Yes | — | API secret for the KYC provider |
| `LAUNCHPAD_KYC_WEBHOOK_SECRET` | Yes | — | Secret for verifying KYC provider webhooks |
| `LAUNCHPAD_STAKING_SERVICE_URL` | Yes | — | URL of the staking service for snapshot queries |
| `LAUNCHPAD_ACS_SERVICE_URL` | No | — | URL of the ACS scoring service (if ACS tiers are used) |
| `LAUNCHPAD_CHAIN_RPC_URL` | Yes | — | RPC endpoint for the target blockchain |
| `LAUNCHPAD_CHAIN_ID` | Yes | — | Chain ID for on-chain operations (e.g., `1` for Ethereum mainnet) |
| `LAUNCHPAD_MULTISIG_THRESHOLD` | No | `2` | Number of signatures required for critical operations |
| `LAUNCHPAD_MULTISIG_SIGNERS` | No | — | Comma-separated list of authorized signer addresses |
| `LAUNCHPAD_RATE_LIMIT_PER_MIN` | No | `5` | Max participation attempts per user per minute |
| `LAUNCHPAD_RATE_LIMIT_GLOBAL` | No | `1000` | Max total participation attempts per minute across all users |
| `LAUNCHPAD_VESTING_FACTORY_ADDRESS` | No | — | On-chain vesting factory contract address |
| `LAUNCHPAD_IPFS_GATEWAY` | No | `https://ipfs.io` | IPFS gateway for snapshot data storage |
| `LAUNCHPAD_IPFS_API_URL` | No | — | IPFS API endpoint for pinning snapshot data |
| `LAUNCHPAD_DEX_ROUTER_ADDRESS` | No | — | DEX router address for liquidity provisioning |
| `LAUNCHPAD_LP_LOCK_CONTRACT` | No | — | LP token lock contract address |
| `LAUNCHPAD_ANALYTICS_RETENTION_DAYS` | No | `365` | Days to retain detailed analytics data |
| `LAUNCHPAD_WEBHOOK_URL` | No | — | Webhook URL for external phase transition notifications |
| `LAUNCHPAD_WEBHOOK_SECRET` | No | — | Secret for signing outbound webhook payloads |
| `LAUNCHPAD_MAX_CONCURRENT_LAUNCHES` | No | `10` | Maximum number of simultaneously active launches |
| `LAUNCHPAD_EMERGENCY_PAUSE_KEY` | Yes | — | Secret key that can trigger emergency pause on any launch |

---

## Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| `@mcv/kernel` | `workspace:*` | Core dependency injection, event bus, error handling |
| `@mcv/db` | `workspace:*` | Database connection pool and migration runner |
| `@mcv/token-economy/staking` | `workspace:*` | Staking position queries for tier calculation |
| `@mcv/token-economy/treasury` | `workspace:*` | Escrow fund custody and fee distribution |
| `@mcv/token-economy/liquidity` | `workspace:*` | Post-launch DEX liquidity provisioning |
| `@mcv/identity/compliance` | `workspace:*` | KYC/AML verification status queries |
| `@mcv/identity/acs` | `workspace:*` | ACS (Account Credit Score) queries |
| `@mcv/governance` | `workspace:*` | Launch approval voting (optional) |
| `@mcv/notifications` | `workspace:*` | Phase transition and claim reminder notifications |
| `drizzle-orm` | `^0.30.0` | Type-safe ORM for database operations |
| `drizzle-zod` | `^0.5.0` | Zod schema generation from Drizzle schemas |
| `zod` | `^3.23.0` | Runtime validation for launch configurations |
| `viem` | `^2.0.0` | Ethereum interactions (vesting contracts, distributions) |
| `@noble/hashes` | `^1.3.0` | Cryptographic hashing for commit-reveal and Merkle trees |
| `merkletreejs` | `^0.4.0` | Merkle tree construction for snapshot verification |
| `decimal.js` | `^10.4.0` | Precise decimal arithmetic for LBP weight/price calculations |
| `bullmq` | `^5.0.0` | Job queue for async distribution and refund processing |
| `ulid` | `^2.3.0` | Sortable unique identifier generation |

---

## Testing Notes

### Unit Tests

```bash
# Run all launchpad unit tests
pnpm test --filter=@mcv/token-economy/launchpad

# Run specific test suites
pnpm test -- --grep "LaunchpadService"
pnpm test -- --grep "VestingService"
pnpm test -- --grep "FairLaunchService"
pnpm test -- --grep "AllocationService"
```

### Key Test Scenarios

1. **Launch lifecycle** — Create → advance through all phases → complete. Verify state transitions and precondition enforcement at each step.

2. **Whitelist & KYC** — Register users, process KYC approvals/rejections, verify jurisdiction restrictions block participation. Test batch operations with mixed success/failure.

3. **Allocation tier calculation** — Snapshot staking positions, calculate tiers, verify tier boundaries. Test edge cases: exact boundary amounts, zero stake, ACS-only qualification.

4. **Lottery fairness** — Run lottery with known random seed. Verify winner count matches tier config. Verify deterministic results with same seed. Test with more/fewer entries than winner slots.

5. **Sale mechanics (Fixed Price)** — Participate at various amounts. Verify tier limits enforced. Verify hard cap stops new participation. Verify soft cap triggers failure on settlement.

6. **Sale mechanics (Dutch Auction)** — Verify price decay over time. Verify uniform pricing refunds. Verify reserve price floor. Test clearing price calculation with various fill levels.

7. **Sale mechanics (LBP)** — Verify weight curve over time. Verify swap output calculations match constant-product formula with weights. Verify anti-whale limits. Verify selling disabled when configured.

8. **Sale mechanics (Overflow)** — Over-subscribe by 3x. Verify pro-rata allocation. Verify refund amounts sum correctly. Verify `committed - effective == refund` for every participant.

9. **Vesting claims** — Create contracts with various schedules. Advance time. Verify claimable amounts at different points (before cliff, during cliff, after cliff, mid-period, at period boundaries, after completion).

10. **Refund processing** — Test all refund reasons. Verify refund amounts. Verify launch failure triggers automatic refunds. Test partial fill refunds.

11. **Concurrency** — Multiple simultaneous participations approaching hard cap. Verify no over-allocation. Verify atomic settlement under concurrent claim requests.

12. **Edge cases** — Zero-allocation tiers. Launch with single participant. Launch with zero participation. Vesting contract with 100% TGE. Launch cancellation mid-sale. Emergency pause and resume.

### Integration Tests

```bash
# Run with test database (requires PostgreSQL)
LAUNCHPAD_DATABASE_URL=postgres://test:test@localhost:5432/launchpad_test \
  pnpm test:integration --filter=@mcv/token-economy/launchpad
```

Integration tests cover:
- Full lifecycle with real database transactions
- Snapshot queries against staking service (mocked)
- On-chain vesting contract deployment (against local Anvil/Hardhat)
- LBP simulation with real constant-product math
- Concurrent participation stress tests (100+ simultaneous)
- Settlement and distribution with large participant sets (1000+)

### Test Fixtures

The module includes test fixtures for common scenarios:

```typescript
import {
  createTestLaunch,
  createTestWhitelist,
  createTestParticipation,
  createTestVesting,
  seedAllocationTiers,
  seedFullLaunchScenario,
} from '@mcv/token-economy/launchpad/testing';

// Seed a complete launch scenario with 5 tiers and 100 participants
const { launch, participants, whitelist } = await seedFullLaunchScenario({
  participantCount: 100,
  tierDistribution: { bronze: 40, silver: 30, gold: 15, diamond: 10, legendary: 5 },
  fillPercent: 85,
});
```

---

## Related Modules

| Module | Relationship |
|--------|-------------|
| `@mcv/token-economy/staking` | Reads staking positions for allocation tier calculation |
| `@mcv/token-economy/treasury` | Escrow custody for raised funds, fee distribution |
| `@mcv/token-economy/liquidity` | Post-launch DEX pool creation and LP management |
| `@mcv/token-economy/token` | Token metadata, supply verification, transfer operations |
| `@mcv/identity/compliance` | KYC/AML verification status for whitelist gating |
| `@mcv/identity/acs` | Account Credit Score for tier qualification |
| `@mcv/governance` | Community vote to approve/reject launch proposals |
| `@mcv/notifications` | User alerts for phase transitions, claim availability |

---

*Last updated: 2026-02-08 · Module version: 0.1.0 · Status: Architecture Draft*