# @mcv/token-economy — API Reference

**Package:** `@mcv/token-economy`  
**Classification:** PUBLISHABLE (Tier 5 — Domain Layer)  
**Version:** 1.0.0  
**Last Updated:** February 9, 2026

---

## Table of Contents

1. [API Overview](#api-overview)
2. [ACS — Automated Contribution Scoring](#acs--automated-contribution-scoring)
   - [ACS Service Methods](#acs-service-methods)
   - [Contribution Scoring Service Methods](#contribution-scoring-service-methods)
   - [Leaderboard Service Methods](#leaderboard-service-methods)
   - [Score Decay Service Methods](#score-decay-service-methods)
3. [Launchpad — Token Launch & IDO/ICO](#launchpad--token-launch--idoico)
   - [Launchpad Service Methods](#launchpad-service-methods)
   - [Whitelist Service Methods](#whitelist-service-methods)
   - [Vesting Service Methods](#vesting-service-methods)
   - [Launch Analytics Service Methods](#launch-analytics-service-methods)
   - [Fair Launch Service Methods](#fair-launch-service-methods)
4. [Rewards — Distribution & Redemption](#rewards--distribution--redemption)
   - [Rewards Service Methods](#rewards-service-methods)
   - [Distribution Service Methods](#distribution-service-methods)
   - [Conversion Service Methods](#conversion-service-methods)
   - [Anti-Gaming Service Methods](#anti-gaming-service-methods)
   - [Reward Pool Service Methods](#reward-pool-service-methods)
   - [Vesting Reward Service Methods](#vesting-reward-service-methods)
5. [Types](#types)
6. [Schemas](#schemas)
7. [Events](#events)
8. [Errors](#errors)
9. [Configuration](#configuration)

---

## API Overview

`@mcv/token-economy` exposes its functionality through three tRPC routers and six core service classes. All APIs use Zod for input validation and return typed responses.

### Authentication & Authorization

| Level | Description | Example Endpoints |
|-------|-------------|-------------------|
| `publicProcedure` | No authentication required | Leaderboard queries, sale info, whitelist verification |
| `protectedProcedure` | Authenticated user required (JWT) | Point accrual, balance queries, claims, purchases |
| `superAdminProcedure` | Super-admin role required | ACS evaluation, overrides, distribution batches, sale management |

### Router Hierarchy

```
tokenEconomyRouter
├── acs
│   ├── getState
│   ├── getControllers
│   ├── getEvaluationHistory
│   ├── getAuditLog
│   ├── evaluate
│   ├── updateController
│   ├── setOverride
│   ├── clearOverride
│   ├── forceRegime
│   ├── contributions
│   │   ├── score
│   │   ├── getScore
│   │   ├── getBreakdown
│   │   ├── getHistory
│   │   └── getExplanation
│   └── leaderboard
│       ├── get
│       ├── getRank
│       └── getNeighbors
├── launchpad
│   ├── sales
│   │   ├── list
│   │   ├── get
│   │   ├── create
│   │   ├── update
│   │   └── updateStatus
│   ├── whitelist
│   │   ├── upload
│   │   ├── verify
│   │   └── getProof
│   ├── participate
│   │   ├── getAllocation
│   │   ├── purchase
│   │   ├── getVestingSchedule
│   │   ├── getClaimable
│   │   └── claim
│   └── analytics
│       ├── getSaleStats
│       └── getParticipants
└── rewards
    ├── points
    │   ├── accrue
    │   ├── bulkAccrue
    │   ├── getBalance
    │   ├── getHistory
    │   └── getLeaderboard
    ├── programs
    │   ├── list
    │   ├── get
    │   ├── create
    │   ├── update
    │   ├── activate
    │   ├── pause
    │   ├── join
    │   ├── leave
    │   └── getStats
    ├── pools
    │   ├── create
    │   ├── allocateToVenture
    │   └── getStatus
    ├── distributions
    │   ├── createBatch
    │   ├── approveBatch
    │   ├── rejectBatch
    │   ├── executeBatch
    │   ├── getBatchStatus
    │   ├── retryFailed
    │   └── scheduleBatch
    ├── conversions
    │   ├── getRules
    │   ├── getCurrentRate
    │   ├── convert
    │   ├── previewConversion
    │   └── getHistory
    └── claims
        ├── claim
        ├── getHistory
        └── retryFailed
```

---

## ACS — Automated Contribution Scoring

### ACS Service Methods

#### `acsService.getState(economyId)`

Retrieves the current ACS state including regime, health scores, and market metrics.

```typescript
// Input
interface GetStateInput {
  economyId: string;
}

// Output
interface AcsState {
  id: string;
  ventureId: string;
  economyId: string;
  currentRegime: AcsRegime;          // 'launch' | 'growth' | 'mature' | 'contraction' | 'emergency'
  previousRegime: AcsRegime | null;
  regimeChangedAt: Date | null;
  regimeStableFor: number;           // Consecutive evaluations in current regime

  // Market metrics
  marketCap: string;
  circulatingSupply: string;
  totalSupply: string;
  price: string;
  volume24h: string;
  stakingRatio: string;
  liquidityDepth: string;

  // Health scores (0.0–1.0)
  liquidityScore: string;
  velocityScore: string;
  concentrationScore: string;
  participationScore: string;
  overallHealth: string;

  lastEvaluation: Date;
  nextEvaluation: Date;
  evaluationIntervalSec: number;
}

// Usage
const state = await acsService.getState('economy_main');
// state.currentRegime → 'growth'
// state.overallHealth → '0.5842'
```

**Auth:** `protectedProcedure`  
**Cache:** Redis, 5-minute TTL (`acs:state:{economyId}`)

---

#### `acsService.getControllers(economyId, category?)`

Lists all controllers for an economy, optionally filtered by category.

```typescript
// Input
interface GetControllersInput {
  economyId: string;
  category?: 'staking' | 'emission' | 'burn' | 'liquidity' | 'conversion';
}

// Output
interface AcsController {
  id: string;
  ventureId: string;
  economyId: string;
  name: string;                        // 'staking_apy', 'emission_rate', 'burn_rate', 'conversion_rate'
  category: string;
  description: string | null;
  currentValue: string;
  targetValue: string | null;
  previousValue: string | null;
  minValue: string;
  maxValue: string;
  dampeningFactor: string;             // 0.0–1.0
  adjustmentCooldown: number;          // seconds
  maxChangePerCycle: string;           // e.g., '0.10' (10%)
  lastAdjusted: Date | null;
  regimeTargets: Record<string, number> | null;
  isOverridden: boolean;
  overrideValue: string | null;
  overrideExpiry: Date | null;
  overrideReason: string | null;
  isActive: boolean;
}

// Usage
const controllers = await acsService.getControllers('economy_main', 'staking');
// → [{ name: 'staking_apy', currentValue: '0.18', ... }]
```

**Auth:** `protectedProcedure`

---

#### `acsService.evaluate(economyId, triggeredBy?)`

Triggers a manual ACS evaluation cycle. Returns the full evaluation result including regime determination and controller adjustments.

```typescript
// Input
interface EvaluateInput {
  economyId: string;
  triggeredBy?: string;  // default: 'manual'
}

// Output
interface EvaluationResult {
  regime: AcsRegime;
  previousRegime: AcsRegime;
  regimeChanged: boolean;
  scores: HealthScores;
  adjustments: ControllerAdjustment[];
  durationMs: number;
}

interface HealthScores {
  liquidity: number;
  velocity: number;
  concentration: number;
  participation: number;
  overall: number;
}

interface ControllerAdjustment {
  controllerId: string;
  controllerName: string;
  category: string;
  oldValue: number;
  newValue: number;
  targetValue: number;
  dampeningApplied: boolean;
  reason: string;
}

// Usage
const result = await acsService.evaluate('economy_main');
// result.regime → 'growth'
// result.adjustments → [{ controllerName: 'staking_apy', oldValue: 0.18, newValue: 0.175, ... }]
```

**Auth:** `superAdminProcedure`  
**Side effects:** Updates `acs_state`, `acs_controller`, inserts `acs_evaluation`, inserts `acs_audit_log`. Emits `acs.evaluation.completed` and optionally `acs.regime.changed` events.

---

#### `acsService.setOverride(input)`

Sets a manual override on a controller. The override expires after the specified duration.

```typescript
// Input
interface SetOverrideInput {
  controllerId: string;
  value: number;
  expiryHours: number;   // 1–168 (max 7 days)
  reason: string;        // Required — logged in audit trail
}

// Output: AcsController (updated)

// Usage
const ctrl = await acsService.setOverride({
  controllerId: 'ctrl_staking_apy',
  value: 0.05,
  expiryHours: 24,
  reason: 'Emergency: reducing staking yield during market crash',
});
```

**Auth:** `superAdminProcedure`  
**Emits:** `acs.override.set`

---

#### `acsService.clearOverride(controllerId, reason)`

Clears an active override on a controller, reverting to automatic mode.

```typescript
// Input
interface ClearOverrideInput {
  controllerId: string;
  reason: string;
}

// Output: AcsController (updated)
```

**Auth:** `superAdminProcedure`  
**Emits:** `acs.override.cleared`

---

#### `acsService.forceRegime(input)`

Forces an immediate regime change. For emergency use only — bypasses hysteresis and stability requirements.

```typescript
// Input
interface ForceRegimeInput {
  economyId: string;
  regime: AcsRegime;     // 'launch' | 'growth' | 'mature' | 'contraction' | 'emergency'
  reason: string;        // Required — logged in audit trail
}

// Output: AcsState (updated)

// Usage
const state = await acsService.forceRegime({
  economyId: 'economy_main',
  regime: 'emergency',
  reason: 'Critical liquidity crisis — manual intervention',
});
```

**Auth:** `superAdminProcedure`  
**Emits:** `acs.regime.changed`

---

#### `acsService.getEvaluationHistory(economyId, options?)`

Returns paginated evaluation history.

```typescript
// Input
interface GetEvaluationHistoryInput {
  economyId: string;
  limit?: number;       // 1–100, default 50
  cursor?: string;      // Pagination cursor
}

// Output
interface PaginatedResult<AcsEvaluation> {
  items: AcsEvaluation[];
  nextCursor: string | null;
  totalCount: number;
}

interface AcsEvaluation {
  id: string;
  regime: AcsRegime;
  previousRegime: AcsRegime | null;
  regimeChanged: boolean;
  inputMetrics: MarketMetrics;
  scores: HealthScores;
  adjustments: ControllerAdjustment[];
  recommendations: Recommendation[];
  durationMs: number;
  triggeredBy: string;
  evaluatedAt: Date;
}
```

**Auth:** `protectedProcedure`

---

#### `acsService.getAuditLog(economyId, options?)`

Returns paginated audit log with optional filters.

```typescript
// Input
interface GetAuditLogInput {
  economyId: string;
  action?: string;         // Filter by action type
  startDate?: Date;
  endDate?: Date;
  limit?: number;          // 1–100, default 50
  cursor?: string;
}

// Output
interface AcsAuditLog {
  id: string;
  action: string;          // 'regime_change' | 'parameter_adjusted' | 'override_set' | etc.
  regime: AcsRegime | null;
  controllerId: string | null;
  controllerName: string | null;
  oldValue: string | null;
  newValue: string | null;
  reason: string | null;
  triggeredBy: string;     // 'automatic' | 'manual' | 'governance' | 'emergency'
  actorId: string | null;
  actorRole: string | null;
  timestamp: Date;
}
```

**Auth:** `protectedProcedure`

---

### Contribution Scoring Service Methods

#### `contributionScoringService.scoreContribution(input)`

Scores a user contribution and updates aggregates.

```typescript
// Input
interface ScoreContributionInput {
  userId: string;
  ventureId: string;
  contributionType: string;     // 'code_commit' | 'content_article' | 'referral' | etc.
  sourceId?: string;            // Reference (commit hash, article ID, etc.)
  sourceUrl?: string;
  rawMetrics: Record<string, number>;
  // For code: { linesAdded: 150, linesRemoved: 20, filesChanged: 5, complexity: 0.7 }
  // For content: { wordCount: 2000, readTime: 8, uniqueViews: 500, shares: 25 }
  qualityMultiplier?: number;   // 0.0–2.0, default 1.0
}

// Output
interface ScoringResult {
  entryId: string;
  rawScore: number;
  weightedScore: number;
  decayedScore: number;
  qualityMultiplier: number;
  categoryWeight: number;
}

// Usage
const result = await contributionScoringService.scoreContribution({
  userId: 'user_abc',
  ventureId: 'serpspace',
  contributionType: 'content_article',
  sourceId: 'article_123',
  sourceUrl: 'https://serpspace.com/blog/article-123',
  rawMetrics: { wordCount: 2000, readTime: 8, uniqueViews: 500, shares: 25 },
  qualityMultiplier: 1.2,
});
// result.rawScore → 175
// result.weightedScore → 43.75  (175 × 0.25 baseWeight)
// result.decayedScore → 43.75   (0 days old, no decay)
```

**Auth:** `protectedProcedure`  
**Side effects:** Inserts `acs_contribution_entries`, upserts `acs_contribution_scores`, inserts `acs_scoring_transparency_logs`, invalidates leaderboard cache.  
**Emits:** `acs.contribution.scored`

---

#### `contributionScoringService.getScore(userId, ventureId?)`

Retrieves a user's aggregate contribution score.

```typescript
// Output
interface ContributionScore {
  userId: string;
  ventureId: string;
  codeScore: string;
  contentScore: string;
  referralScore: string;
  engagementScore: string;
  governanceScore: string;
  totalScore: string;
  decayedTotalScore: string;
  rank: number | null;
  percentile: string | null;
  tokensEarned: string;
  tokensClaimed: string;
  tokensVesting: string;
  contributionCount: number;
  lastContributionAt: Date | null;
}
```

**Auth:** `protectedProcedure`

---

#### `contributionScoringService.getScoreBreakdown(userId, ventureId?)`

Returns a detailed breakdown of a user's contribution scores by category.

```typescript
// Output
interface ScoreBreakdown {
  userId: string;
  categories: {
    code: { score: number; decayedScore: number; contributionCount: number; topContribution: string };
    content: { score: number; decayedScore: number; contributionCount: number; topContribution: string };
    referral: { score: number; decayedScore: number; contributionCount: number; topContribution: string };
    engagement: { score: number; decayedScore: number; contributionCount: number; topContribution: string };
    governance: { score: number; decayedScore: number; contributionCount: number; topContribution: string };
  };
  total: number;
  decayedTotal: number;
  rank: number;
  percentile: number;
}
```

**Auth:** `protectedProcedure`

---

#### `contributionScoringService.getScoringExplanation(contributionEntryId)`

Returns full transparency log for a specific contribution score.

```typescript
// Output
interface ScoringTransparencyLog {
  id: string;
  userId: string;
  contributionEntryId: string;
  explanation: {
    contributionType: string;
    rawMetrics: Record<string, number>;
    formulaUsed: string;
    rawScore: number;
    qualityMultiplier: number;
    categoryWeight: number;
    decayFactor: number;
    finalScore: number;
    steps: Array<{ description: string; value: number }>;
  };
  createdAt: Date;
}

// Usage
const explanation = await contributionScoringService.getScoringExplanation('entry_xyz');
// explanation.explanation.steps →
//   [{ description: 'Raw score from formula', value: 175 },
//    { description: 'Quality multiplier applied', value: 210 },
//    { description: 'Category weight applied', value: 52.5 },
//    { description: 'Decay factor applied', value: 52.5 },
//    { description: 'Daily cap applied', value: 52.5 }]
```

**Auth:** `protectedProcedure` (users can only see their own)

---

### Leaderboard Service Methods

#### `leaderboardService.getLeaderboard(input)`

Retrieves a leaderboard with pagination.

```typescript
// Input
interface GetLeaderboardInput {
  ventureId?: string;           // null = ecosystem-wide
  period: 'weekly' | 'monthly' | 'alltime';
  periodKey?: string;           // e.g., '2026-W06' (defaults to current)
  category?: string;            // null = overall, or 'code' | 'content' | etc.
  limit?: number;               // 1–100, default 50
  offset?: number;              // default 0
}

// Output
interface LeaderboardResult {
  leaderboardId: string;
  period: string;
  periodKey: string;
  category: string | null;
  entryCount: number;
  lastComputedAt: Date;
  entries: LeaderboardEntry[];
}

interface LeaderboardEntry {
  rank: number;
  userId: string;
  score: string;
  previousRank: number | null;
  rankChange: number | null;     // +3 = moved up 3, -2 = moved down 2
}
```

**Auth:** `publicProcedure`  
**Cache:** Redis sorted set + PostgreSQL cache table

---

#### `leaderboardService.getUserRank(userId, leaderboardId)`

Gets a specific user's rank on a leaderboard.

```typescript
// Output
interface LeaderboardEntry | null

// Usage
const rank = await leaderboardService.getUserRank('user_abc', 'lb_weekly_overall');
// rank?.rank → 42
// rank?.rankChange → +5
```

**Auth:** `protectedProcedure`

---

#### `leaderboardService.getNeighbors(userId, leaderboardId, range?)`

Gets users ranked near a specific user (for "see your position" UIs).

```typescript
// Input
interface GetNeighborsInput {
  userId: string;
  leaderboardId: string;
  range?: number;   // How many above and below, default 5
}

// Output: LeaderboardEntry[]  (e.g., ranks 37–47 if user is rank 42)
```

**Auth:** `protectedProcedure`

---

### Score Decay Service Methods

#### `scoreDecayService.getDecayConfig(ventureId?, category?)`

Retrieves decay configuration for a venture/category.

```typescript
// Output
interface DecayConfiguration {
  id: string;
  ventureId: string | null;
  category: string | null;
  decayFunction: 'exponential' | 'linear' | 'step' | 'logarithmic';
  halfLifeDays: number;
  minimumRetention: string;    // e.g., '0.10' (10%)
  decayStartDays: number;     // Grace period before decay begins
  steps: Array<{ days: number; retention: number }> | null;
  isActive: boolean;
}
```

**Auth:** `protectedProcedure`

---

#### `scoreDecayService.previewDecay(userId, daysForward)`

Previews how a user's score will decay over a specified time period.

```typescript
// Input
interface PreviewDecayInput {
  userId: string;
  daysForward: number;   // 1–365
}

// Output
interface DecayPreview {
  currentScore: number;
  projectedScores: Array<{
    day: number;
    score: number;
    retentionPercent: number;
  }>;
  halfLifeDay: number;
  minimumScore: number;
}
```

**Auth:** `protectedProcedure`

---

#### `scoreDecayService.applyDecay(ventureId?, dryRun?)`

Applies decay to all contribution scores. Typically called by cron.

```typescript
// Input
interface ApplyDecayInput {
  ventureId?: string;    // null = all ventures
  dryRun?: boolean;      // default false
}

// Output
interface DecayApplicationResult {
  usersAffected: number;
  totalDecayAmount: number;
  venturesProcessed: string[];
  dryRun: boolean;
}
```

**Auth:** `superAdminProcedure`  
**Emits:** `acs.decay.applied`

---

## Launchpad — Token Launch & IDO/ICO

### Launchpad Service Methods

#### `launchpadService.createSale(input)`

Creates a new token sale.

```typescript
// Input
interface CreateSaleInput {
  ventureId: string;
  economyId: string;
  tokenId: string;
  name: string;
  description?: string;
  slug: string;
  type: SaleType;                    // 'fixed_price' | 'dutch_auction' | 'lbp' | 'fair_launch' | 'lottery'
  tokenSymbol: string;
  tokenDecimals?: number;            // default 9
  totalTokens: string;              // Total tokens for sale
  price?: string;                    // Price per token in payment token (not for LBP/dutch)
  paymentToken?: string;             // default 'USDC'
  paymentTokenMint?: string;
  hardCap: string;
  softCap?: string;
  minContribution?: string;
  maxContribution?: string;
  saleStart: Date;
  saleEnd: Date;
  whitelistStart?: Date;
  whitelistEnd?: Date;
  requireWhitelist?: boolean;        // default true
  kycRequired?: boolean;             // default true
  accreditedOnly?: boolean;          // default false
  excludedJurisdictions?: string[];
  contractAddress?: string;
  treasuryAddress?: string;
}

// Output
interface TokenSale {
  id: string;
  // ... all fields from input plus:
  status: SaleStatus;                // starts as 'draft'
  raisedAmount: string;              // '0'
  soldTokens: string;               // '0'
  participantCount: string;          // '0'
  whitelistRoot: string | null;
  whitelistCount: string;
  createdAt: Date;
  updatedAt: Date;
}
```

**Auth:** `superAdminProcedure`  
**Emits:** `launch.sale.created`

---

#### `launchpadService.updateSale(input)`

Updates a sale's configuration. Only allowed in `draft` or `pending_approval` status.

```typescript
// Input
interface UpdateSaleInput {
  saleId: string;
  name?: string;
  description?: string;
  price?: string;
  hardCap?: string;
  softCap?: string;
  minContribution?: string;
  maxContribution?: string;
  saleStart?: Date;
  saleEnd?: Date;
  whitelistStart?: Date;
  whitelistEnd?: Date;
  excludedJurisdictions?: string[];
}

// Output: TokenSale (updated)
```

**Auth:** `superAdminProcedure`  
**Errors:** `LAUNCH_SALE_NOT_ACTIVE` if status is not `draft` or `pending_approval`

---

#### `launchpadService.updateSaleStatus(saleId, status, reason?)`

Transitions a sale to a new status. Enforces the state machine.

```typescript
// Input
interface UpdateSaleStatusInput {
  saleId: string;
  status: SaleStatus;
  reason?: string;
}

// Allowed transitions:
//   draft → pending_approval
//   pending_approval → approved | cancelled
//   approved → whitelist_open
//   whitelist_open → active
//   active → ended
//   ended → finalized

// Output: TokenSale (updated)
```

**Auth:** `superAdminProcedure`  
**Emits:** `launch.sale.approved`, `launch.sale.activated`, `launch.sale.ended`, `launch.sale.finalized`

---

#### `launchpadService.listSales(options?)`

Lists token sales with optional status filter.

```typescript
// Input
interface ListSalesInput {
  status?: SaleStatus[];
  limit?: number;           // 1–50, default 20
  cursor?: string;
}

// Output: PaginatedResult<TokenSale>
```

**Auth:** `protectedProcedure`

---

#### `launchpadService.getSale(saleId)`

Gets detailed sale information including vesting schedules.

```typescript
// Output
interface TokenSaleDetail extends TokenSale {
  vestingSchedules: VestingSchedule[];
  analytics: {
    totalRaised: string;
    uniqueParticipants: number;
    avgContribution: string;
    percentFilled: number;
  };
}
```

**Auth:** `protectedProcedure`

---

### Whitelist Service Methods

#### `whitelistService.upload(input)`

Batch uploads whitelist entries and generates a Merkle tree.

```typescript
// Input
interface UploadWhitelistInput {
  saleId: string;
  allocations: Array<{
    walletAddress: string;
    tier?: string;               // 'guaranteed' | 'lottery' | 'fcfs'
    maxAllocation?: string;      // In payment token (e.g., '5000' USDC)
  }>;
}

// Output
interface WhitelistUploadResult {
  saleId: string;
  merkleRoot: string;
  leafCount: number;
  treeDepth: number;
  snapshotId: string;
}

// Usage
const result = await whitelistService.upload({
  saleId: 'sale_edge_public',
  allocations: [
    { walletAddress: 'So1ana...abc', tier: 'guaranteed', maxAllocation: '5000' },
    { walletAddress: 'So1ana...def', tier: 'lottery', maxAllocation: '1000' },
    // ... up to 100,000 entries per batch
  ],
});
// result.merkleRoot → '0xabcdef...'
```

**Auth:** `superAdminProcedure`  
**Emits:** `launch.whitelist.uploaded`

---

#### `whitelistService.verify(saleId, walletAddress)`

Checks if a wallet is whitelisted and returns their tier/allocation.

```typescript
// Input
interface VerifyWhitelistInput {
  saleId: string;
  walletAddress: string;
}

// Output
interface WhitelistVerifyResult {
  isWhitelisted: boolean;
  tier: string | null;
  maxAllocation: string | null;
  kycVerified: boolean;
}
```

**Auth:** `publicProcedure`

---

#### `whitelistService.getProof(saleId, walletAddress)`

Gets the Merkle proof for a whitelisted wallet.

```typescript
// Output
interface MerkleProofResult {
  proof: string[];              // Array of hex-encoded sibling hashes
  leaf: string;                 // Hex-encoded leaf hash
  root: string;                 // Hex-encoded root hash
  verified: boolean;            // Self-verification result
}
```

**Auth:** `publicProcedure`

---

### Vesting Service Methods

#### `vestingService.getSchedule(allocationId)`

Gets the vesting schedule for a user's allocation.

```typescript
// Output
interface VestingScheduleDetail {
  schedule: VestingSchedule;
  allocation: UserAllocation;
  unlockEvents: UnlockEvent[];
  currentStatus: {
    totalVested: string;
    totalClaimed: string;
    currentlyClaimable: string;
    nextUnlockDate: Date | null;
    nextUnlockAmount: string | null;
    vestingPercent: number;
  };
}

interface UnlockEvent {
  date: Date;
  amount: number;
  cumulativeAmount: number;
  cumulativePercent: number;
  type: 'tge' | 'cliff_end' | 'vesting';
}
```

**Auth:** `protectedProcedure`

---

#### `vestingService.getClaimable(allocationId)`

Calculates the current claimable amount for a user's allocation.

```typescript
// Output
interface ClaimableResult {
  claimable: number;
  totalVested: number;
  nextUnlock: Date | null;
  vestingPercent: number;
}
```

**Auth:** `protectedProcedure`

---

#### `vestingService.claimVested(input)`

Claims vested tokens. Submits an on-chain transaction.

```typescript
// Input
interface ClaimVestedInput {
  allocationId: string;
}

// Output
interface ClaimResult {
  claimId: string;
  claimedAmount: string;
  txSignature: string | null;
  status: 'pending' | 'confirmed' | 'failed';
}
```

**Auth:** `protectedProcedure`  
**Emits:** `launch.vesting.claimed`

---

#### `vestingService.purchaseTokens(input)`

Purchases tokens in an active sale.

```typescript
// Input
interface PurchaseInput {
  saleId: string;
  amount: string;                  // Payment token amount
  proof?: string[];                // Merkle proof (required if sale has whitelist)
}

// Output
interface PurchaseResult {
  purchaseId: string;
  paymentAmount: string;
  tokenAmount: string;
  priceAtPurchase: string;
  txSignature: string | null;
  status: 'pending' | 'confirmed' | 'failed';
}
```

**Auth:** `protectedProcedure`  
**Validation:**
- Sale must be in `active` status
- KYC must be verified (if sale requires KYC)
- Jurisdiction must not be excluded
- Whitelist proof must be valid (if sale requires whitelist)
- Amount must be within min/max contribution
- Hard cap must not be exceeded
**Emits:** `launch.purchase.completed` or `launch.purchase.failed`

---

### Launch Analytics Service Methods

#### `launchAnalyticsService.getSaleStats(saleId)`

Returns comprehensive sale statistics.

```typescript
// Output
interface SaleStats {
  saleId: string;
  totalRaised: string;
  totalTokensSold: string;
  uniqueParticipants: number;
  avgContribution: string;
  medianContribution: string;
  percentFilled: number;           // raisedAmount / hardCap
  whitelistCount: number;
  whitelistParticipationRate: number;
  tierBreakdown: Record<string, {
    count: number;
    totalContributed: string;
    avgContribution: string;
  }>;
}
```

**Auth:** `protectedProcedure`

---

#### `launchAnalyticsService.getParticipants(saleId, options?)`

Lists all participants with their allocation details.

```typescript
// Input
interface GetParticipantsInput {
  saleId: string;
  limit?: number;
  cursor?: string;
}

// Output: PaginatedResult<UserAllocation>
```

**Auth:** `superAdminProcedure`

---

### Fair Launch Service Methods

#### `fairLaunchService.createFairLaunch(input)`

Configures fair launch parameters for a sale.

```typescript
// Input
interface CreateFairLaunchInput {
  saleId: string;
  depositWindowSec: number;
  minDeposit: string;
  maxDeposit: string;
  allocationFormula: 'proportional' | 'capped_proportional' | 'uniform';
}

// Output: FairLaunchConfig
```

**Auth:** `superAdminProcedure`

---

## Rewards — Distribution & Redemption

### Rewards Service Methods

#### `rewardsService.accruePoints(input)`

Records a point entry for a user. Runs anti-gaming checks, applies tier multiplier, writes immutable entry, and queues async balance update.

```typescript
// Input
interface AccruePointsInput {
  userId: string;
  ventureId: string;
  source: PointSource;
  // 'bet_placed' | 'bet_won' | 'referral_signup' | 'referral_deposit' |
  // 'quest_completed' | 'streak_bonus' | 'daily_login' | 'social_share' |
  // 'content_created' | 'governance_vote' | 'staking_deposit' |
  // 'liquidity_provided' | 'marketplace_trade' | 'education_completed' |
  // 'feedback_given' | 'community_moderation' | 'early_adopter' |
  // 'vip_bonus' | 'promotional' | 'manual_adjustment'
  amount: number;                    // Positive integer
  sourceId?: string;                 // Reference to bet, quest, order, etc.
  sourceVentureId?: string;          // Which venture originated the action
  programId?: string;
  campaignId?: string;
  poolId?: string;
  metadata?: Record<string, unknown>;
  // Anti-gaming context (captured server-side)
  deviceFingerprint?: string;
  ipAddress?: string;
  userAgent?: string;
}

// Output
interface AccrueResult {
  entry: PointEntry;
  balance: PointBalance;
  antiGaming: AntiGamingResult;
}

interface PointEntry {
  id: string;
  userId: string;
  ventureId: string;
  source: PointSource;
  sourceId: string | null;
  amount: number;
  multiplier: string;
  finalAmount: number;
  flagged: boolean;
  flagReason: string | null;
  reviewStatus: string;
  createdAt: Date;
}

// Usage
const result = await rewardsService.accruePoints({
  userId: 'user_abc',
  ventureId: 'betedge',
  source: 'bet_placed',
  amount: 100,
  sourceId: 'bet_12345',
  metadata: { betType: 'single', sport: 'nfl' },
});
// result.entry.finalAmount → 125 (with 1.25× gold tier multiplier)
// result.antiGaming.action → 'allow'
// result.balance.currentBalance → 15125
```

**Auth:** `protectedProcedure`  
**Side effects:** Insert `reward_point_entries`; update Redis balance; queue PostgreSQL balance update; evaluate cross-venture rules.  
**Emits:** `rewards.points.accrued` (or `rewards.points.blocked` / `rewards.points.held`)

---

#### `rewardsService.bulkAccruePoints(inputs)`

Batch accrual for multiple users (e.g., daily login rewards for all active users).

```typescript
// Input
interface BulkAccrueInput {
  entries: AccruePointsInput[];    // Max 1000 per batch
}

// Output
interface BulkAccrualResult {
  succeeded: number;
  failed: number;
  blocked: number;
  held: number;
  results: Array<{
    userId: string;
    status: 'success' | 'blocked' | 'held' | 'error';
    entry?: PointEntry;
    error?: string;
  }>;
}
```

**Auth:** `superAdminProcedure`

---

#### `rewardsService.getBalance(userId, ventureId?)`

Gets the current point balance for a user.

```typescript
// Output
interface PointBalance {
  id: string;
  userId: string;
  ventureId: string;
  totalEarned: number;
  totalRedeemed: number;
  totalConverted: number;
  totalExpired: number;
  totalFlagged: number;
  currentBalance: number;
  breakdown: Record<string, number>;   // e.g., { bet_placed: 5000, referral_signup: 1000 }
  lifetimePoints: number;
  currentTier: string;                 // 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond'
  tierExpiresAt: Date | null;
  tierMultiplier: string;
  lastActivity: Date | null;
}
```

**Auth:** `protectedProcedure`  
**Cache:** Redis (immediate update on accrual)

---

#### `rewardsService.getHistory(userId, options?)`

Returns paginated point history.

```typescript
// Input
interface PointHistoryOptions {
  ventureId?: string;
  source?: PointSource;
  startDate?: Date;
  endDate?: Date;
  flaggedOnly?: boolean;
  limit?: number;              // 1–100, default 50
  cursor?: string;
}

// Output: PaginatedResult<PointEntry>
```

**Auth:** `protectedProcedure` (users see only their own)

---

#### `rewardsService.createProgram(input)`

Creates a new reward program.

```typescript
// Input
interface CreateProgramInput {
  ventureId: string;
  name: string;
  slug: string;
  description?: string;
  imageUrl?: string;
  type: ProgramType;
  // 'points' | 'token_airdrop' | 'staking_yield' | 'referral' |
  // 'campaign' | 'loyalty_tier' | 'achievement'
  budget?: string;
  budgetType?: 'tokens' | 'points' | 'usd';
  emissionRate?: string;
  emissionInterval?: 'daily' | 'weekly' | 'monthly';
  decayFactor?: string;
  eligibilityRules?: EligibilityRule[];
  // [{ type: 'min_tier', value: 'silver' },
  //  { type: 'kyc_verified', value: true },
  //  { type: 'min_age_days', value: 30 }]
  earnRules?: EarnRule[];
  // [{ source: 'bet_placed', pointsPerUnit: 1, unit: 'dollar', maxPerDay: 500 }]
  startsAt?: Date;
  endsAt?: Date;
  maxParticipants?: number;
  isCrossVenture?: boolean;
  participatingVentures?: string[];
}

// Output: RewardProgram
```

**Auth:** `superAdminProcedure`  
**Emits:** `rewards.program.created`

---

#### `rewardsService.joinProgram(programId, userId)`

Enrolls a user in a reward program after checking eligibility.

```typescript
// Output
interface ProgramParticipant {
  id: string;
  programId: string;
  userId: string;
  status: string;
  joinedAt: Date;
  earnedAmount: string;
  claimedAmount: string;
  eligibilityData: Record<string, unknown>;
}
```

**Auth:** `protectedProcedure`  
**Errors:** `REWARD_NOT_ELIGIBLE` if user fails eligibility checks; `REWARD_PROGRAM_FULL` if max participants reached; `REWARD_PROGRAM_INACTIVE` if program is not active

---

#### `rewardsService.claimReward(input)`

Claims available rewards (instant, vested, conversion, or airdrop).

```typescript
// Input
interface ClaimRewardInput {
  ventureId: string;
  programId?: string;
  poolId?: string;
  vestingScheduleId?: string;
  claimType: 'instant' | 'vested' | 'conversion' | 'airdrop';
  walletAddress: string;
}

// Output
interface RewardClaim {
  id: string;
  userId: string;
  claimType: string;
  tokenAmount: string;
  tokenMint: string;
  walletAddress: string;
  txSignature: string | null;
  status: 'pending' | 'processing' | 'confirmed' | 'failed' | 'cancelled';
  signatureVerified: boolean;
  identityVerified: boolean;
  createdAt: Date;
}
```

**Auth:** `protectedProcedure`  
**Validation:** Wallet signature verification; KYC verification; sufficient claimable amount  
**Emits:** `rewards.claim.initiated`, then `rewards.claim.confirmed` or `rewards.claim.failed`

---

### Distribution Service Methods

#### `distributionService.createBatch(input)`

Creates a distribution batch for on-chain token distribution.

```typescript
// Input
interface CreateDistributionBatchInput {
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
}

// Output
interface DistributionBatch {
  id: string;
  batchNumber: string;               // e.g., 'DIST-2026-000042'
  recipientCount: number;
  totalAmount: string;
  status: string;
  requiresApproval: boolean;
  createdAt: Date;
}
```

**Auth:** `superAdminProcedure`  
**Emits:** `rewards.distribution.created`

---

#### `distributionService.approveBatch(batchId, approverId)`

Approves a distribution batch for execution.

```typescript
// Output: DistributionBatch (status: 'approved')
```

**Auth:** `superAdminProcedure`  
**Emits:** `rewards.distribution.approved`

---

#### `distributionService.executeBatch(batchId)`

Executes an approved batch — submits Solana transactions.

```typescript
// Output
interface DistributionBatch {
  // ... plus:
  processedCount: number;
  confirmedCount: number;
  failedCount: number;
  txSignatures: string[];
  startedAt: Date;
  completedAt: Date | null;
}
```

**Auth:** `superAdminProcedure`  
**Side effects:** Submits Solana SPL transfers via @mcv/web3-core; polls for confirmations.  
**Emits:** `rewards.distribution.completed`

---

#### `distributionService.scheduleBatch(input, scheduledFor)`

Schedules a batch for future execution.

```typescript
// Input: CreateDistributionBatchInput + scheduledFor: Date
// Output: DistributionBatch (status: 'pending', scheduledFor set)
```

**Auth:** `superAdminProcedure`

---

#### `distributionService.retryFailed(batchId)`

Retries all failed recipients in a batch.

```typescript
// Output: DistributionBatch (with updated processedCount/failedCount)
```

**Auth:** `superAdminProcedure`

---

### Conversion Service Methods

#### `conversionService.getActiveRules(ventureId)`

Lists active conversion rules for a venture.

```typescript
// Output
interface ConversionRule {
  id: string;
  ventureId: string;
  name: string;
  description: string | null;
  pointsRequired: number;
  tokensReceived: string;
  baseRate: string;                  // Base tokens per point
  currentRate: string | null;        // ACS-adjusted rate
  minPoints: number | null;
  maxPoints: number | null;
  maxConversionsPerUser: number | null;
  maxConversionsPerDay: number | null;
  dailyCap: string | null;
  isActive: boolean;
  startsAt: Date | null;
  endsAt: Date | null;
  totalBudget: string | null;
  usedBudget: string;
  requireKyc: boolean;
  requireMinTier: string | null;
  requireWalletConnected: boolean;
}
```

**Auth:** `protectedProcedure`

---

#### `conversionService.getCurrentRate(ruleId)`

Gets the current ACS-adjusted conversion rate.

```typescript
// Output
interface CurrentRate {
  rate: number;                      // Tokens per point
  regime: string;                    // Current ACS regime
  baseRate: number;                  // Base rate before ACS adjustment
  adjustmentFactor: number;          // ACS multiplier
}

// Usage
const rate = await conversionService.getCurrentRate('rule_betedge_convert');
// rate.rate → 0.012
// rate.regime → 'growth'
// rate.baseRate → 0.010
// rate.adjustmentFactor → 1.2
```

**Auth:** `protectedProcedure`  
**Cache:** Redis, updated on every ACS evaluation

---

#### `conversionService.previewConversion(ruleId, points)`

Previews a conversion without executing it.

```typescript
// Output
interface ConversionPreview {
  pointsToConvert: number;
  tokensToReceive: string;
  conversionRate: string;
  regime: string;
  tierBonus: string;               // Additional tokens from tier bonus
  totalTokens: string;             // tokensToReceive + tierBonus
  currentBalance: number;          // User's current point balance
  balanceAfter: number;            // Balance after conversion
  requiresKyc: boolean;
  kycVerified: boolean;
}
```

**Auth:** `protectedProcedure`

---

#### `conversionService.convertPoints(input)`

Converts points to tokens. Deducts points, creates distribution record.

```typescript
// Input
interface ConvertPointsInput {
  ruleId: string;
  points: number;                  // Points to convert
  walletAddress: string;
}

// Output
interface ConversionResult {
  conversionId: string;
  pointsConverted: number;
  tokensReceived: string;
  conversionRate: string;
  regime: string;
  status: 'pending' | 'processing' | 'confirmed' | 'failed';
  txSignature: string | null;
  balanceAfter: number;
}
```

**Auth:** `protectedProcedure`  
**Validation:** KYC required; wallet connected; sufficient balance; within limits; pool not depleted  
**Emits:** `rewards.conversion.completed`

---

#### `conversionService.getConversionHistory(userId, options?)`

Returns paginated conversion history.

```typescript
// Input
interface ConversionHistoryOptions {
  limit?: number;
  cursor?: string;
}

// Output: PaginatedResult<ConversionHistoryEntry>

interface ConversionHistoryEntry {
  id: string;
  pointsConverted: number;
  tokensReceived: string;
  conversionRate: string;
  regime: string;
  status: string;
  txSignature: string | null;
  walletAddress: string | null;
  createdAt: Date;
}
```

**Auth:** `protectedProcedure`

---

### Anti-Gaming Service Methods

#### `antiGamingService.check(params)`

Runs all anti-gaming checks on a point accrual attempt. Called internally by `rewardsService.accruePoints()`.

```typescript
// Input
interface AntiGamingCheckParams {
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

// Output
interface AntiGamingResult {
  passed: boolean;
  score: number;                     // 0.0 (clean) → 1.0 (definitely abuse)
  flags: string[];                   // e.g., ['rate_limit_exceeded', 'velocity_anomaly']
  action: 'allow' | 'flag' | 'hold' | 'block';
  holdAmount?: number;
  details: AntiGamingDetail[];
}

interface AntiGamingDetail {
  check: string;                     // 'rate_limit' | 'velocity_anomaly' | 'device_fingerprint' | etc.
  passed: boolean;
  score: number;
  evidence?: Record<string, unknown>;
}
```

---

#### `antiGamingService.getFlags(userId, options?)`

Gets abuse flags for a user.

```typescript
// Input
interface FlagOptions {
  status?: string;         // 'open' | 'investigating' | 'resolved_legitimate' | 'resolved_abuse' | 'escalated'
  severity?: string;       // 'low' | 'medium' | 'high' | 'critical'
  limit?: number;
  cursor?: string;
}

// Output: PaginatedResult<AbuseFlag>
```

**Auth:** `superAdminProcedure`

---

#### `antiGamingService.resolveFlag(flagId, resolution)`

Resolves an abuse flag.

```typescript
// Input
interface FlagResolution {
  flagId: string;
  resolution: 'resolved_legitimate' | 'resolved_abuse';
  action: 'none' | 'points_reversed' | 'account_suspended' | 'account_banned';
  reason: string;
}

// Output: AbuseFlag (updated)
```

**Auth:** `superAdminProcedure`  
**Emits:** `rewards.abuse.resolved`

---

#### `antiGamingService.getUserRiskProfile(userId)`

Gets a comprehensive risk profile for a user.

```typescript
// Output
interface RiskProfile {
  userId: string;
  overallRiskScore: number;          // 0.0–1.0
  totalFlags: number;
  openFlags: number;
  resolvedAbuse: number;
  resolvedLegitimate: number;
  topFlagTypes: Array<{ type: string; count: number }>;
  recentActivityRate: number;        // Actions per hour (last 24h)
  baselineActivityRate: number;      // Actions per hour (30-day average)
  velocityAnomaly: boolean;
  deviceCount: number;               // Unique devices used
  ipCount: number;                   // Unique IPs in last 30 days
  isFrozen: boolean;
}
```

**Auth:** `superAdminProcedure`

---

#### `antiGamingService.scanForPatterns(ventureId, window?)`

Runs batch pattern analysis for a venture.

```typescript
// Input
interface PatternScanInput {
  ventureId: string;
  window?: { hours: number };        // default 24
}

// Output
interface PatternScanResult {
  scannedAt: Date;
  windowHours: number;
  patternsFound: number;
  patterns: PatternMatch[];
  autoActions: number;
}

interface PatternMatch {
  type: 'farming_ring' | 'wash_trading' | 'sybil_network' | 'geo_anomaly';
  confidence: number;
  affectedUserIds: string[];
  evidence: Record<string, unknown>;
  autoActionTaken: boolean;
}
```

**Auth:** `superAdminProcedure`

---

### Reward Pool Service Methods

#### `rewardPoolService.createPool(input)`

Creates a new reward pool.

```typescript
// Input
interface CreateRewardPoolInput {
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
}

// Output: RewardPool
```

**Auth:** `superAdminProcedure`  
**Emits:** `rewards.pool.created`

---

#### `rewardPoolService.allocateToVenture(poolId, ventureId, percent)`

Allocates a percentage of a pool to a specific venture.

```typescript
// Output: RewardPoolAllocation
```

**Auth:** `superAdminProcedure`

---

#### `rewardPoolService.getPoolStatus(poolId)`

Gets comprehensive pool status including budget utilization.

```typescript
// Output
interface RewardPoolStatus {
  pool: RewardPool;
  allocations: RewardPoolAllocation[];
  utilizationPercent: number;
  remainingBudget: string;
  estimatedRunway: {
    daysRemaining: number;
    emissionRatePerDay: string;
  };
  recentDistributions: DistributionBatch[];
}
```

**Auth:** `protectedProcedure`

---

### Vesting Reward Service Methods

#### `vestingRewardService.createVestingSchedule(input)`

Creates a vesting schedule for reward distribution.

```typescript
// Input
interface CreateVestingScheduleInput {
  ventureId: string;
  programId?: string;
  poolId?: string;
  name: string;
  description?: string;
  vestingType: 'linear' | 'cliff_linear' | 'graded' | 'immediate';
  totalAmount: string;
  tgeUnlockPercent?: string;
  cliffDurationSec?: number;
  vestingDurationSec: number;
  vestingIntervalSec?: number;
  startDate: Date;
}

// Output: RewardVestingSchedule
```

**Auth:** `superAdminProcedure`

---

#### `vestingRewardService.getVestedAmount(userId, scheduleId)`

Gets the currently vested amount for a user.

```typescript
// Output
interface VestedAmountInfo {
  totalAmount: string;
  vestedAmount: string;
  claimedAmount: string;
  claimableAmount: string;
  vestingPercent: number;
  nextUnlockDate: Date | null;
  nextUnlockAmount: string | null;
}
```

**Auth:** `protectedProcedure`

---

#### `vestingRewardService.getClaimableAmount(userId)`

Gets total claimable amount across all vesting schedules.

```typescript
// Output
interface ClaimableInfo {
  totalClaimable: string;
  schedules: Array<{
    scheduleId: string;
    name: string;
    claimable: string;
    nextUnlock: Date | null;
  }>;
}
```

**Auth:** `protectedProcedure`

---

## Types

### Core Enums

```typescript
// ACS Regimes
type AcsRegime = 'launch' | 'growth' | 'mature' | 'contraction' | 'emergency';

// Controller Categories
type ControllerCategory = 'staking' | 'emission' | 'burn' | 'liquidity' | 'conversion';

// Point Sources
type PointSource =
  | 'bet_placed' | 'bet_won' | 'referral_signup' | 'referral_deposit'
  | 'quest_completed' | 'streak_bonus' | 'daily_login' | 'social_share'
  | 'content_created' | 'governance_vote' | 'staking_deposit'
  | 'liquidity_provided' | 'marketplace_trade' | 'education_completed'
  | 'feedback_given' | 'community_moderation' | 'early_adopter'
  | 'vip_bonus' | 'promotional' | 'manual_adjustment';

// Program Types
type ProgramType =
  | 'points' | 'token_airdrop' | 'staking_yield' | 'referral'
  | 'campaign' | 'loyalty_tier' | 'achievement';

// Program Statuses
type ProgramStatus =
  | 'draft' | 'scheduled' | 'active' | 'paused'
  | 'completed' | 'expired' | 'cancelled';

// Sale Types
type SaleType = 'fixed_price' | 'dutch_auction' | 'lbp' | 'fair_launch' | 'lottery';

// Sale Statuses
type SaleStatus =
  | 'draft' | 'pending_approval' | 'approved' | 'whitelist_open'
  | 'active' | 'ended' | 'finalized' | 'cancelled';

// Contribution Types
type ContributionType =
  | 'code_commit' | 'content_article' | 'referral' | 'engagement'
  | 'moderation' | 'bug_report' | 'feature_request' | 'community_support';

// Contribution Categories
type ContributionCategory = 'code' | 'content' | 'referral' | 'engagement' | 'governance';

// Decay Functions
type DecayFunction = 'exponential' | 'linear' | 'step' | 'logarithmic';

// Leaderboard Periods
type LeaderboardPeriod = 'weekly' | 'monthly' | 'alltime';

// Reward Tier
type RewardTier = 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond';

// Vesting Types
type VestingType = 'linear' | 'cliff_linear' | 'graded' | 'immediate';

// Abuse Flag Types
type AbuseFlagType =
  | 'rate_limit' | 'velocity' | 'shared_device' | 'suspicious_ip'
  | 'sybil' | 'referral_abuse' | 'bot_detected';

// Claim Types
type ClaimType = 'instant' | 'vested' | 'conversion' | 'airdrop';

// Distribution Statuses
type DistributionStatus =
  | 'pending' | 'approved' | 'processing' | 'submitted'
  | 'confirmed' | 'partial' | 'failed';
```

### Key Interfaces

```typescript
// Eligibility Rule (used in reward programs)
interface EligibilityRule {
  type: 'min_tier' | 'kyc_verified' | 'min_age_days' | 'venture_active' | 'min_balance' | 'max_flags';
  value: string | number | boolean | string[];
}

// Earn Rule (used in reward programs)
interface EarnRule {
  source: PointSource;
  pointsPerUnit?: number;
  unit?: 'dollar' | 'count' | 'minute';
  pointsFlat?: number;
  maxPerDay?: number;
  maxPerMonth?: number;
  multiplier?: number;
}

// Market Metrics (ACS input)
interface MarketMetrics {
  marketCap: number;
  price: number;
  volume24h: number;
  liquidityDepth: number;
  stakingRatio: number;
  velocityIndex: number;
  circulatingSupply: number;
  totalSupply: number;
  activeUsers24h: number;
  transactionCount24h: number;
  totalHolders: number;
  topHolderPercent: number;
}

// Paginated Result (generic)
interface PaginatedResult<T> {
  items: T[];
  nextCursor: string | null;
  totalCount: number;
}
```

---

## Schemas

All input schemas are defined with Zod and exported for client-side validation:

```typescript
import { z } from 'zod';

// Point accrual
export const accruePointsSchema = z.object({
  userId: z.string().min(1),
  ventureId: z.string().min(1),
  source: z.enum([
    'bet_placed', 'bet_won', 'referral_signup', 'referral_deposit',
    'quest_completed', 'streak_bonus', 'daily_login', 'social_share',
    'content_created', 'governance_vote', 'staking_deposit',
    'liquidity_provided', 'marketplace_trade', 'education_completed',
    'feedback_given', 'community_moderation', 'early_adopter',
    'vip_bonus', 'promotional', 'manual_adjustment',
  ]),
  amount: z.number().int().positive().max(1_000_000),
  sourceId: z.string().optional(),
  sourceVentureId: z.string().optional(),
  programId: z.string().optional(),
  campaignId: z.string().optional(),
  poolId: z.string().optional(),
  metadata: z.record(z.unknown()).optional(),
});

// Conversion
export const convertPointsSchema = z.object({
  ruleId: z.string().min(1),
  points: z.number().int().positive(),
  walletAddress: z.string().min(32).max(44),
});

// Contribution scoring
export const scoreContributionSchema = z.object({
  userId: z.string().min(1),
  ventureId: z.string().min(1),
  contributionType: z.enum([
    'code_commit', 'content_article', 'referral', 'engagement',
    'moderation', 'bug_report', 'feature_request', 'community_support',
  ]),
  sourceId: z.string().optional(),
  sourceUrl: z.string().url().optional(),
  rawMetrics: z.record(z.number()),
  qualityMultiplier: z.number().min(0).max(2).optional(),
});

// Create sale
export const createSaleSchema = z.object({
  ventureId: z.string().min(1),
  economyId: z.string().min(1),
  tokenId: z.string().min(1),
  name: z.string().min(1).max(100),
  slug: z.string().min(1).max(100).regex(/^[a-z0-9-]+$/),
  type: z.enum(['fixed_price', 'dutch_auction', 'lbp', 'fair_launch', 'lottery']),
  tokenSymbol: z.string().min(1).max(10),
  totalTokens: z.string(),
  price: z.string().optional(),
  hardCap: z.string(),
  softCap: z.string().optional(),
  saleStart: z.date(),
  saleEnd: z.date(),
  requireWhitelist: z.boolean().default(true),
  kycRequired: z.boolean().default(true),
});

// ACS override
export const setOverrideSchema = z.object({
  controllerId: z.string().min(1),
  value: z.number(),
  expiryHours: z.number().min(1).max(168),
  reason: z.string().min(10).max(500),
});

// Create reward program
export const createProgramSchema = z.object({
  ventureId: z.string().min(1),
  name: z.string().min(1).max(100),
  slug: z.string().min(1).max(100).regex(/^[a-z0-9-]+$/),
  type: z.enum(['points', 'token_airdrop', 'staking_yield', 'referral', 'campaign', 'loyalty_tier', 'achievement']),
  budget: z.string().optional(),
  budgetType: z.enum(['tokens', 'points', 'usd']).default('tokens'),
  startsAt: z.date().optional(),
  endsAt: z.date().optional(),
  maxParticipants: z.number().int().positive().optional(),
});
```

---

## Events

All events are emitted via `@mcv/fabric` event bus. Subscribe using standard fabric patterns:

```typescript
import { fabric } from '@mcv/fabric';

// Subscribe to point accruals
fabric.on('rewards.points.accrued', async (event) => {
  const { userId, source, amount, finalAmount, balance } = event;
  // Handle point accrual
});

// Subscribe to regime changes
fabric.on('acs.regime.changed', async (event) => {
  const { economyId, from, to, health } = event;
  // Handle regime change — e.g., update UI, notify admins
});

// Subscribe to distribution completions
fabric.on('rewards.distribution.completed', async (event) => {
  const { batchId, confirmedCount, totalAmount } = event;
  // Handle distribution completion
});
```

### Event Reference

See [Data Flow & Events in 02-TECHNICAL-ARCHITECTURE.md](./02-TECHNICAL-ARCHITECTURE.md#data-flow--events) for the complete event taxonomy with payloads and severities.

---

## Errors

All errors extend a base `TokenEconomyError` class with structured error codes:

```typescript
import { TokenEconomyError } from '@mcv/token-economy';

try {
  await rewardsService.accruePoints(input);
} catch (error) {
  if (error instanceof TokenEconomyError) {
    switch (error.code) {
      case 'REWARD_BLOCKED_ABUSE':
        // Anti-gaming engine blocked the request
        logger.warn('Abuse blocked', { userId, score: error.details.score });
        break;
      case 'REWARD_RATE_LIMITED':
        // Rate limit exceeded — respect Retry-After
        const retryAfter = error.details.retryAfterMs;
        break;
      case 'REWARD_HELD_FOR_REVIEW':
        // Points were accrued but held — accepted (202)
        break;
    }
  }
}
```

### Complete Error Code Reference

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

## Configuration

### Environment Variables

```bash
# Token Economy Configuration
EDGE_TOKEN_MINT=                     # EDGE SPL token mint address on Solana
EDGE_TOKEN_DECIMALS=9                # Token decimal places (default: 9)

# Treasury
TREASURY_WALLET_ADDRESS=             # Main treasury wallet for distributions
TREASURY_SIGNING_KEY=                # Encrypted signing key reference (Vault)

# ACS Configuration
ACS_EVALUATION_INTERVAL=900          # Seconds between evaluations (default: 15 min)
ACS_METRICS_PROVIDER=jupiter         # 'jupiter' | 'birdeye' | 'coingecko'
ACS_AUTO_ADJUST=true                 # Enable automatic parameter adjustment

# Rewards Configuration
REWARDS_MAX_BATCH_SIZE=500           # Max recipients per distribution batch
REWARDS_APPROVAL_THRESHOLD=10000     # USD value requiring admin approval
REWARDS_ANTI_GAMING_ENABLED=true     # Enable anti-gaming checks

# Launchpad Configuration
LAUNCHPAD_KYC_PROVIDER=              # KYC service endpoint
LAUNCHPAD_MAX_CONCURRENT_SALES=5     # Max active sales per venture

# Redis Configuration
REDIS_URL=                           # Redis connection for caching/rate limits

# Solana RPC
SOLANA_RPC_URL=                      # Solana mainnet RPC endpoint
SOLANA_RPC_COMMITMENT=confirmed      # Transaction commitment level
```

### Constants

```typescript
// Exported from @mcv/token-economy/constants

export const EDGE_TOKEN_DECIMALS = 9;

export const TIER_THRESHOLDS = {
  bronze:   0,
  silver:   10_000,
  gold:     50_000,
  platinum: 200_000,
  diamond:  1_000_000,
} as const;

export const TIER_MULTIPLIERS = {
  bronze:   1.00,
  silver:   1.10,
  gold:     1.25,
  platinum: 1.50,
  diamond:  2.00,
} as const;

export const DEFAULT_REGIME_THRESHOLDS = {
  emergency:   { below: 0.20 },
  contraction: { below: 0.40, above: 0.25 },
  growth:      { below: 0.70, above: 0.50 },
  mature:      { above: 0.70 },
} as const;

export const MAX_BATCH_SIZE = 500;
export const MAX_POINTS_PER_ACTION = 1_000_000;
export const DEFAULT_DECAY_HALF_LIFE = 90;  // days
export const DEFAULT_ANTI_GAMING_THRESHOLDS = {
  allow:   0.3,
  flag:    0.5,
  hold:    0.8,
  block:   1.0,
} as const;

export const VENTURE_REWARD_MULTIPLIERS = {
  betedge:    1.0,
  serpspace:   1.0,
  fullgain:   1.0,
  mcvstudios: 1.0,
  futurestate: 1.0,
} as const;
```

---

*@mcv/token-economy — Token Economy Domain*
