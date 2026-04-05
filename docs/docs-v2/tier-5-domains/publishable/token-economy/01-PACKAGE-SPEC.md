# @mcv/token-economy — Package Specification
## Tier 5: Domain Layer (PUBLISHABLE)

**Package:** `@mcv/token-economy`  
**Classification:** PUBLISHABLE  
**Version:** 1.0.0  
**Last Updated:** February 9, 2026

---

## Executive Summary

`@mcv/token-economy` is the comprehensive tokenomics infrastructure for building Web3-native loyalty, launch, and rewards systems. It provides three core modules: ACS (Algorithmic Control System) for dynamic parameter tuning, Launchpad for token sales and vesting, and Rewards for points, distributions, and conversions.

**This package enables any venture to launch and manage a token economy — from pre-TGE points to post-launch staking rewards.**

---

## Strategic Position

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         VENTURE APPLICATIONS                                 │
│                                                                              │
│  BetEdge Loyalty  │  SerpSpace Credits  │  Ventures Tokens  │  DAO Rewards  │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      │ uses
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                          @mcv/token-economy                                  │
│                                                                              │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │                              ACS                                       │  │
│  │  regime-detection │ controllers │ dampening │ audit │ overrides       │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
│                                                                              │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │                           LAUNCHPAD                                    │  │
│  │  sales │ vesting │ allocations │ merkle-proofs │ compliance           │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
│                                                                              │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │                            REWARDS                                     │  │
│  │  points │ programs │ distributions │ conversions │ anti-gaming        │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      │ depends on
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                          LOWER TIER PACKAGES                                 │
│                                                                              │
│  @mcv/db  │  @mcv/auth  │  @mcv/audit  │  @mcv/events  │  @mcv/queue       │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Sub-Modules Overview

| Module | Purpose | Key Features |
|--------|---------|--------------|
| **acs** | Algorithmic Control System | Regime detection, parameter tuning, dampening |
| **launchpad** | Token sales & vesting | IDO, whitelist, Merkle proofs, vesting streams |
| **rewards** | Points & distributions | Accrual, programs, on-chain distributions |

---

## Module: acs

### Purpose

The Algorithmic Control System provides autonomous and semi-autonomous control of tokenomics parameters based on market conditions, protocol health, and governance decisions. It ensures economic stability during different market regimes.

### Data Models

```typescript
// @mcv/token-economy/acs/schema.ts
import { pgTable, text, jsonb, timestamp, numeric, boolean, pgEnum } from "drizzle-orm/pg-core";
import { createId } from "@paralleldrive/cuid2";

export const regimeEnum = pgEnum('acs_regime', [
  'launch',      // Pre-TGE / early launch phase
  'growth',      // Active growth phase
  'mature',      // Stable mature phase
  'contraction', // Bear market / defensive
  'emergency'    // Critical intervention required
]);

// ACS State - Current system state
export const acsStates = pgTable('acs_state', {
  id: text('id').$defaultFn(() => createId()).primaryKey(),
  ventureId: text('venture_id').notNull(),
  economyId: text('economy_id').notNull(),
  currentRegime: regimeEnum('current_regime').notNull().default('launch'),
  previousRegime: regimeEnum('previous_regime'),
  regimeChangedAt: timestamp('regime_changed_at'),
  
  // Market metrics
  marketCap: numeric('market_cap', { precision: 24, scale: 8 }),
  circulatingSupply: numeric('circulating_supply', { precision: 24, scale: 8 }),
  price: numeric('price', { precision: 18, scale: 8 }),
  volume24h: numeric('volume_24h', { precision: 24, scale: 8 }),
  
  // Health scores
  liquidityScore: numeric('liquidity_score', { precision: 5, scale: 4 }),
  velocityScore: numeric('velocity_score', { precision: 5, scale: 4 }),
  concentrationScore: numeric('concentration_score', { precision: 5, scale: 4 }),
  overallHealth: numeric('overall_health', { precision: 5, scale: 4 }),
  
  lastEvaluation: timestamp('last_evaluation'),
  nextEvaluation: timestamp('next_evaluation'),
  
  metadata: jsonb('metadata').$type<Record<string, unknown>>(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().$onUpdate(() => new Date()),
});

// Controller Configuration
export const acsControllers = pgTable('acs_controller', {
  id: text('id').$defaultFn(() => createId()).primaryKey(),
  ventureId: text('venture_id').notNull(),
  economyId: text('economy_id').notNull(),
  
  // Controller identity
  name: text('name').notNull(), // 'staking_apy', 'emission_rate', 'burn_rate'
  category: text('category').notNull(), // 'staking', 'emission', 'burn', 'liquidity'
  description: text('description'),
  
  // Current values
  currentValue: numeric('current_value', { precision: 18, scale: 8 }).notNull(),
  targetValue: numeric('target_value', { precision: 18, scale: 8 }),
  
  // Bounds
  minValue: numeric('min_value', { precision: 18, scale: 8 }).notNull(),
  maxValue: numeric('max_value', { precision: 18, scale: 8 }).notNull(),
  
  // Adjustment parameters
  dampeningFactor: numeric('dampening_factor', { precision: 5, scale: 4 }).default('0.1'),
  adjustmentCooldown: numeric('adjustment_cooldown').default('3600'), // seconds
  lastAdjusted: timestamp('last_adjusted'),
  
  // Regime-specific targets
  regimeTargets: jsonb('regime_targets').$type<Record<string, number>>(),
  
  // Override
  isOverridden: boolean('is_overridden').default(false),
  overrideValue: numeric('override_value', { precision: 18, scale: 8 }),
  overrideExpiry: timestamp('override_expiry'),
  overrideReason: text('override_reason'),
  
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().$onUpdate(() => new Date()),
});

// Evaluation History
export const acsEvaluations = pgTable('acs_evaluation', {
  id: text('id').$defaultFn(() => createId()).primaryKey(),
  ventureId: text('venture_id').notNull(),
  economyId: text('economy_id').notNull(),
  
  regime: regimeEnum('regime').notNull(),
  regimeChanged: boolean('regime_changed').default(false),
  
  // Input metrics
  inputMetrics: jsonb('input_metrics').$type<{
    marketCap: number;
    price: number;
    volume24h: number;
    liquidityDepth: number;
    stakingRatio: number;
    velocityIndex: number;
  }>().notNull(),
  
  // Computed scores
  scores: jsonb('scores').$type<{
    liquidity: number;
    velocity: number;
    concentration: number;
    overall: number;
  }>().notNull(),
  
  // Adjustments made
  adjustments: jsonb('adjustments').$type<Array<{
    controllerId: string;
    controllerName: string;
    oldValue: number;
    newValue: number;
    reason: string;
  }>>(),
  
  // Recommendations (for manual approval)
  recommendations: jsonb('recommendations').$type<Array<{
    controllerId: string;
    suggestedValue: number;
    confidence: number;
    rationale: string;
  }>>(),
  
  evaluatedAt: timestamp('evaluated_at').defaultNow().notNull(),
});

// Audit Log
export const acsAuditLogs = pgTable('acs_audit_log', {
  id: text('id').$defaultFn(() => createId()).primaryKey(),
  ventureId: text('venture_id').notNull(),
  economyId: text('economy_id').notNull(),
  
  action: text('action').notNull(), // 'regime_change', 'parameter_adjusted', 'override_set', 'override_cleared'
  regime: regimeEnum('regime'),
  controllerId: text('controller_id'),
  controllerName: text('controller_name'),
  
  oldValue: numeric('old_value', { precision: 18, scale: 8 }),
  newValue: numeric('new_value', { precision: 18, scale: 8 }),
  
  reason: text('reason'),
  triggeredBy: text('triggered_by'), // 'automatic', 'manual', 'governance'
  actorId: text('actor_id'),
  
  metadata: jsonb('metadata').$type<Record<string, unknown>>(),
  timestamp: timestamp('timestamp').defaultNow().notNull(),
});
```

### API Surface

```typescript
// @mcv/token-economy/acs/router.ts
import { z } from 'zod';
import { router, protectedProcedure, superAdminProcedure } from '@mcv/api/trpc';

export const acsRouter = router({
  // Read Operations
  getState: protectedProcedure
    .input(z.object({ economyId: z.string() }))
    .query(async ({ ctx, input }) => {
      // Returns current ACS state with all metrics
    }),

  getControllers: protectedProcedure
    .input(z.object({ 
      economyId: z.string(),
      category: z.enum(['staking', 'emission', 'burn', 'liquidity']).optional()
    }))
    .query(async ({ ctx, input }) => {
      // Returns all controllers for the economy
    }),

  getEvaluationHistory: protectedProcedure
    .input(z.object({
      economyId: z.string(),
      limit: z.number().min(1).max(100).default(50),
      cursor: z.string().optional()
    }))
    .query(async ({ ctx, input }) => {
      // Returns paginated evaluation history
    }),

  getAuditLog: protectedProcedure
    .input(z.object({
      economyId: z.string(),
      action: z.string().optional(),
      startDate: z.date().optional(),
      endDate: z.date().optional(),
      limit: z.number().min(1).max(100).default(50),
      cursor: z.string().optional()
    }))
    .query(async ({ ctx, input }) => {
      // Returns paginated audit log
    }),

  // Evaluation
  evaluate: superAdminProcedure
    .input(z.object({ economyId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      // Triggers manual evaluation, returns adjustments
    }),

  // Controller Management
  updateController: superAdminProcedure
    .input(z.object({
      controllerId: z.string(),
      minValue: z.number().optional(),
      maxValue: z.number().optional(),
      dampeningFactor: z.number().min(0).max(1).optional(),
      regimeTargets: z.record(z.number()).optional()
    }))
    .mutation(async ({ ctx, input }) => {
      // Updates controller configuration
    }),

  // Overrides (Emergency)
  setOverride: superAdminProcedure
    .input(z.object({
      controllerId: z.string(),
      value: z.number(),
      expiryHours: z.number().min(1).max(168).default(24),
      reason: z.string()
    }))
    .mutation(async ({ ctx, input }) => {
      // Sets manual override on a controller
    }),

  clearOverride: superAdminProcedure
    .input(z.object({
      controllerId: z.string(),
      reason: z.string()
    }))
    .mutation(async ({ ctx, input }) => {
      // Clears manual override
    }),

  // Regime Management
  forceRegime: superAdminProcedure
    .input(z.object({
      economyId: z.string(),
      regime: z.enum(['launch', 'growth', 'mature', 'contraction', 'emergency']),
      reason: z.string()
    }))
    .mutation(async ({ ctx, input }) => {
      // Forces a regime change (emergency use)
    }),
});
```

### Controller Engine

```typescript
// @mcv/token-economy/acs/engine.ts
export interface AcsContext {
  economyId: string;
  regime: AcsRegime;
  metrics: MarketMetrics;
  scores: HealthScores;
  controllers: Map<string, ControllerState>;
}

export interface ControllerAdjustment {
  controllerId: string;
  oldValue: number;
  newValue: number;
  reason: string;
}

export abstract class BaseController {
  abstract name: string;
  abstract category: string;
  
  abstract evaluate(ctx: AcsContext): Promise<ControllerAdjustment | null>;
  
  protected applyDampening(
    currentValue: number,
    targetValue: number,
    dampeningFactor: number
  ): number {
    const maxChange = currentValue * dampeningFactor;
    const desiredChange = targetValue - currentValue;
    const actualChange = Math.max(-maxChange, Math.min(maxChange, desiredChange));
    return currentValue + actualChange;
  }
}

export class StakingApyController extends BaseController {
  name = 'staking_apy';
  category = 'staking';
  
  async evaluate(ctx: AcsContext): Promise<ControllerAdjustment | null> {
    const controller = ctx.controllers.get(this.name);
    if (!controller || controller.isOverridden) return null;
    
    // Regime-specific targets
    const regimeTargets: Record<AcsRegime, number> = {
      launch: 0.25,      // 25% APY during launch
      growth: 0.18,      // 18% during growth
      mature: 0.12,      // 12% during maturity
      contraction: 0.08, // 8% during contraction
      emergency: 0.05,   // 5% during emergency
    };
    
    const targetApy = regimeTargets[ctx.regime];
    const currentApy = controller.currentValue;
    
    // Check if adjustment needed
    if (Math.abs(targetApy - currentApy) < 0.001) return null;
    
    const newApy = this.applyDampening(
      currentApy,
      targetApy,
      controller.dampeningFactor
    );
    
    return {
      controllerId: controller.id,
      oldValue: currentApy,
      newValue: newApy,
      reason: `Regime ${ctx.regime}: adjusting APY toward ${targetApy * 100}%`
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
    const velocityMultiplier = 1 - (ctx.scores.velocity * 0.3); // Lower emission if velocity high
    const targetRate = baseRate * velocityMultiplier;
    
    const currentRate = controller.currentValue;
    if (Math.abs(targetRate - currentRate) < 0.001) return null;
    
    const newRate = this.applyDampening(
      currentRate,
      targetRate,
      controller.dampeningFactor
    );
    
    return {
      controllerId: controller.id,
      oldValue: currentRate,
      newValue: newRate,
      reason: `Velocity ${ctx.scores.velocity.toFixed(2)}: adjusting emission rate`
    };
  }
}

// Controller Registry
export const controllerRegistry: BaseController[] = [
  new StakingApyController(),
  new EmissionRateController(),
  // Add more controllers...
];

// Evaluation Engine
export class AcsEngine {
  async evaluate(economyId: string): Promise<AcsEvaluationResult> {
    // 1. Load current state
    const state = await this.loadState(economyId);
    
    // 2. Fetch market metrics
    const metrics = await this.fetchMetrics(economyId);
    
    // 3. Calculate health scores
    const scores = this.calculateScores(metrics);
    
    // 4. Determine regime
    const regime = this.determineRegime(scores, state.currentRegime);
    
    // 5. Build context
    const ctx: AcsContext = {
      economyId,
      regime,
      metrics,
      scores,
      controllers: await this.loadControllers(economyId)
    };
    
    // 6. Run all controllers
    const adjustments: ControllerAdjustment[] = [];
    for (const controller of controllerRegistry) {
      const adjustment = await controller.evaluate(ctx);
      if (adjustment) adjustments.push(adjustment);
    }
    
    // 7. Apply adjustments
    await this.applyAdjustments(adjustments);
    
    // 8. Log evaluation
    await this.logEvaluation(ctx, adjustments);
    
    return { regime, scores, adjustments };
  }
  
  private calculateScores(metrics: MarketMetrics): HealthScores {
    return {
      liquidity: this.calculateLiquidityScore(metrics),
      velocity: this.calculateVelocityScore(metrics),
      concentration: this.calculateConcentrationScore(metrics),
      overall: 0 // Computed as weighted average
    };
  }
  
  private determineRegime(scores: HealthScores, currentRegime: AcsRegime): AcsRegime {
    // Hysteresis to prevent rapid regime changes
    const thresholds = {
      emergency: { below: 0.2 },
      contraction: { below: 0.4, above: 0.25 },
      growth: { below: 0.7, above: 0.5 },
      mature: { above: 0.7 }
    };
    
    if (scores.overall < thresholds.emergency.below) return 'emergency';
    if (scores.overall < thresholds.contraction.below) return 'contraction';
    if (scores.overall > thresholds.mature.above) return 'mature';
    if (scores.overall > thresholds.growth.above) return 'growth';
    
    return currentRegime; // Stay in current regime within hysteresis band
  }
}
```

---

## Module: launchpad

### Purpose

The Launchpad module handles token sales (IDO/ICO), whitelist management with Merkle proofs, and vesting schedules. It integrates with compliance systems for KYC verification and supports multiple sale types.

### Data Models

```typescript
// @mcv/token-economy/launchpad/schema.ts
import { pgTable, text, jsonb, timestamp, numeric, boolean, pgEnum, index } from "drizzle-orm/pg-core";
import { createId } from "@paralleldrive/cuid2";

export const saleTypeEnum = pgEnum('launchpad_sale_type', [
  'fixed_price',    // Standard fixed-price sale
  'dutch_auction',  // Price decreases over time
  'lbp',           // Liquidity Bootstrapping Pool
  'fair_launch',   // Equal distribution
  'lottery'        // Weighted lottery system
]);

export const saleStatusEnum = pgEnum('launchpad_sale_status', [
  'draft',
  'pending_approval',
  'approved',
  'whitelist_open',
  'active',
  'ended',
  'finalized',
  'cancelled'
]);

// Token Sales
export const tokenSales = pgTable('launchpad_sale', {
  id: text('id').$defaultFn(() => createId()).primaryKey(),
  ventureId: text('venture_id').notNull(),
  economyId: text('economy_id').notNull(),
  tokenId: text('token_id').notNull(),
  
  // Sale identity
  name: text('name').notNull(),
  description: text('description'),
  slug: text('slug').notNull(),
  
  // Sale configuration
  type: saleTypeEnum('type').notNull(),
  status: saleStatusEnum('status').notNull().default('draft'),
  
  // Token details
  tokenSymbol: text('token_symbol').notNull(),
  tokenDecimals: numeric('token_decimals').notNull().default('9'),
  totalTokens: numeric('total_tokens', { precision: 24, scale: 8 }).notNull(),
  
  // Pricing
  price: numeric('price', { precision: 18, scale: 8 }), // Price in payment token
  paymentToken: text('payment_token').notNull().default('USDC'),
  paymentTokenMint: text('payment_token_mint'),
  
  // Caps
  hardCap: numeric('hard_cap', { precision: 24, scale: 8 }).notNull(),
  softCap: numeric('soft_cap', { precision: 24, scale: 8 }),
  minContribution: numeric('min_contribution', { precision: 18, scale: 8 }),
  maxContribution: numeric('max_contribution', { precision: 18, scale: 8 }),
  
  // Timing
  whitelistStart: timestamp('whitelist_start'),
  whitelistEnd: timestamp('whitelist_end'),
  saleStart: timestamp('sale_start').notNull(),
  saleEnd: timestamp('sale_end').notNull(),
  
  // Whitelist
  requireWhitelist: boolean('require_whitelist').default(true),
  whitelistRoot: text('whitelist_root'), // Merkle root
  whitelistCount: numeric('whitelist_count').default('0'),
  
  // Progress
  raisedAmount: numeric('raised_amount', { precision: 24, scale: 8 }).default('0'),
  soldTokens: numeric('sold_tokens', { precision: 24, scale: 8 }).default('0'),
  participantCount: numeric('participant_count').default('0'),
  
  // Smart contract
  contractAddress: text('contract_address'),
  treasuryAddress: text('treasury_address'),
  
  // Compliance
  kycRequired: boolean('kyc_required').default(true),
  accreditedOnly: boolean('accredited_only').default(false),
  excludedJurisdictions: jsonb('excluded_jurisdictions').$type<string[]>(),
  
  metadata: jsonb('metadata').$type<Record<string, unknown>>(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().$onUpdate(() => new Date()),
}, (table) => ({
  ventureIdx: index('sale_venture_idx').on(table.ventureId),
  statusIdx: index('sale_status_idx').on(table.status),
  slugIdx: index('sale_slug_idx').on(table.slug),
}));

// Vesting Schedules
export const vestingSchedules = pgTable('launchpad_vesting_schedule', {
  id: text('id').$defaultFn(() => createId()).primaryKey(),
  ventureId: text('venture_id').notNull(),
  saleId: text('sale_id').notNull().references(() => tokenSales.id),
  
  name: text('name').notNull(), // "Seed Round", "Public Sale", "Team"
  description: text('description'),
  
  // Allocation
  totalTokens: numeric('total_tokens', { precision: 24, scale: 8 }).notNull(),
  allocatedTokens: numeric('allocated_tokens', { precision: 24, scale: 8 }).default('0'),
  
  // Schedule parameters
  tgeUnlockPercent: numeric('tge_unlock_percent', { precision: 5, scale: 4 }).notNull(), // e.g., 0.10 = 10%
  cliffDuration: numeric('cliff_duration').notNull(), // seconds
  vestingDuration: numeric('vesting_duration').notNull(), // seconds
  vestingInterval: numeric('vesting_interval').default('86400'), // seconds between releases
  
  // Computed unlock dates
  tgeDate: timestamp('tge_date'),
  cliffEndDate: timestamp('cliff_end_date'),
  vestingEndDate: timestamp('vesting_end_date'),
  
  isActive: boolean('is_active').default(true),
  metadata: jsonb('metadata').$type<Record<string, unknown>>(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().$onUpdate(() => new Date()),
});

// User Allocations
export const userAllocations = pgTable('launchpad_allocation', {
  id: text('id').$defaultFn(() => createId()).primaryKey(),
  ventureId: text('venture_id').notNull(),
  saleId: text('sale_id').notNull().references(() => tokenSales.id),
  scheduleId: text('schedule_id').references(() => vestingSchedules.id),
  
  // User identity
  userId: text('user_id'),
  walletAddress: text('wallet_address').notNull(),
  
  // Whitelist
  isWhitelisted: boolean('is_whitelisted').default(false),
  whitelistTier: text('whitelist_tier'), // 'guaranteed', 'lottery', 'fcfs'
  merkleProof: jsonb('merkle_proof').$type<string[]>(),
  
  // Allocation
  maxAllocation: numeric('max_allocation', { precision: 18, scale: 8 }),
  allocationAmount: numeric('allocation_amount', { precision: 18, scale: 8 }).default('0'),
  purchasedAmount: numeric('purchased_amount', { precision: 18, scale: 8 }).default('0'),
  paidAmount: numeric('paid_amount', { precision: 18, scale: 8 }).default('0'),
  
  // Vesting tracking
  totalVested: numeric('total_vested', { precision: 18, scale: 8 }).default('0'),
  totalClaimed: numeric('total_claimed', { precision: 18, scale: 8 }).default('0'),
  
  // KYC status
  kycVerified: boolean('kyc_verified').default(false),
  kycVerifiedAt: timestamp('kyc_verified_at'),
  
  metadata: jsonb('metadata').$type<Record<string, unknown>>(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().$onUpdate(() => new Date()),
}, (table) => ({
  saleIdx: index('allocation_sale_idx').on(table.saleId),
  walletIdx: index('allocation_wallet_idx').on(table.walletAddress),
  userIdx: index('allocation_user_idx').on(table.userId),
}));

// Purchase Transactions
export const purchaseTransactions = pgTable('launchpad_purchase', {
  id: text('id').$defaultFn(() => createId()).primaryKey(),
  ventureId: text('venture_id').notNull(),
  saleId: text('sale_id').notNull().references(() => tokenSales.id),
  allocationId: text('allocation_id').notNull().references(() => userAllocations.id),
  
  walletAddress: text('wallet_address').notNull(),
  
  // Transaction details
  paymentAmount: numeric('payment_amount', { precision: 18, scale: 8 }).notNull(),
  tokenAmount: numeric('token_amount', { precision: 18, scale: 8 }).notNull(),
  priceAtPurchase: numeric('price_at_purchase', { precision: 18, scale: 8 }).notNull(),
  
  // On-chain reference
  txSignature: text('tx_signature'),
  blockNumber: numeric('block_number'),
  
  status: text('status').notNull().default('pending'), // pending, confirmed, failed
  
  metadata: jsonb('metadata').$type<Record<string, unknown>>(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Claim Transactions
export const claimTransactions = pgTable('launchpad_claim', {
  id: text('id').$defaultFn(() => createId()).primaryKey(),
  ventureId: text('venture_id').notNull(),
  allocationId: text('allocation_id').notNull().references(() => userAllocations.id),
  
  walletAddress: text('wallet_address').notNull(),
  
  // Claim details
  claimableAmount: numeric('claimable_amount', { precision: 18, scale: 8 }).notNull(),
  claimedAmount: numeric('claimed_amount', { precision: 18, scale: 8 }).notNull(),
  vestingPeriod: numeric('vesting_period'), // Which period this claim is for
  
  // On-chain reference
  txSignature: text('tx_signature'),
  blockNumber: numeric('block_number'),
  
  status: text('status').notNull().default('pending'),
  
  metadata: jsonb('metadata').$type<Record<string, unknown>>(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});
```

### API Surface

```typescript
// @mcv/token-economy/launchpad/router.ts
export const launchpadRouter = router({
  // Sale Management
  sales: router({
    list: protectedProcedure
      .input(z.object({
        status: z.array(saleStatusSchema).optional(),
        limit: z.number().min(1).max(50).default(20),
        cursor: z.string().optional()
      }))
      .query(async ({ ctx, input }) => {
        // List sales with optional status filter
      }),

    get: protectedProcedure
      .input(z.object({ saleId: z.string() }))
      .query(async ({ ctx, input }) => {
        // Get sale details with schedules
      }),

    create: superAdminProcedure
      .input(createSaleSchema)
      .mutation(async ({ ctx, input }) => {
        // Create new token sale
      }),

    update: superAdminProcedure
      .input(updateSaleSchema)
      .mutation(async ({ ctx, input }) => {
        // Update sale configuration
      }),

    updateStatus: superAdminProcedure
      .input(z.object({
        saleId: z.string(),
        status: saleStatusSchema,
        reason: z.string().optional()
      }))
      .mutation(async ({ ctx, input }) => {
        // Transition sale status
      }),
  }),

  // Whitelist Management
  whitelist: router({
    upload: superAdminProcedure
      .input(z.object({
        saleId: z.string(),
        allocations: z.array(z.object({
          walletAddress: z.string(),
          tier: z.string().optional(),
          maxAllocation: z.number().optional()
        }))
      }))
      .mutation(async ({ ctx, input }) => {
        // Batch upload whitelist, generates Merkle tree
      }),

    verify: publicProcedure
      .input(z.object({
        saleId: z.string(),
        walletAddress: z.string()
      }))
      .query(async ({ ctx, input }) => {
        // Verify whitelist status and get Merkle proof
      }),

    getProof: publicProcedure
      .input(z.object({
        saleId: z.string(),
        walletAddress: z.string()
      }))
      .query(async ({ ctx, input }) => {
        // Get Merkle proof for wallet
      }),
  }),

  // User Participation
  participate: router({
    getAllocation: protectedProcedure
      .input(z.object({ saleId: z.string() }))
      .query(async ({ ctx, input }) => {
        // Get user's allocation for a sale
      }),

    purchase: protectedProcedure
      .input(z.object({
        saleId: z.string(),
        amount: z.number(),
        proof: z.array(z.string()).optional()
      }))
      .mutation(async ({ ctx, input }) => {
        // Purchase tokens in sale
      }),

    getVestingSchedule: protectedProcedure
      .input(z.object({ allocationId: z.string() }))
      .query(async ({ ctx, input }) => {
        // Get vesting details for allocation
      }),

    getClaimable: protectedProcedure
      .input(z.object({ allocationId: z.string() }))
      .query(async ({ ctx, input }) => {
        // Calculate current claimable amount
      }),

    claim: protectedProcedure
      .input(z.object({ allocationId: z.string() }))
      .mutation(async ({ ctx, input }) => {
        // Claim vested tokens
      }),
  }),

  // Analytics
  analytics: router({
    getSaleStats: protectedProcedure
      .input(z.object({ saleId: z.string() }))
      .query(async ({ ctx, input }) => {
        // Get sale statistics
      }),

    getParticipants: superAdminProcedure
      .input(z.object({
        saleId: z.string(),
        limit: z.number().min(1).max(100).default(50),
        cursor: z.string().optional()
      }))
      .query(async ({ ctx, input }) => {
        // List all participants with details
      }),
  }),
});
```

### Merkle Tree Service

```typescript
// @mcv/token-economy/launchpad/merkle.ts
import { MerkleTree } from 'merkletreejs';
import { keccak256 } from 'viem';

export interface WhitelistEntry {
  walletAddress: string;
  tier: string;
  maxAllocation: string;
}

export class MerkleWhitelistService {
  private tree: MerkleTree | null = null;
  private entries: Map<string, WhitelistEntry> = new Map();

  constructor(entries: WhitelistEntry[]) {
    this.buildTree(entries);
  }

  private buildTree(entries: WhitelistEntry[]): void {
    const leaves = entries.map(entry => {
      this.entries.set(entry.walletAddress.toLowerCase(), entry);
      return this.hashLeaf(entry);
    });

    this.tree = new MerkleTree(leaves, keccak256, { sortPairs: true });
  }

  private hashLeaf(entry: WhitelistEntry): string {
    return keccak256(
      `0x${Buffer.from(
        entry.walletAddress.toLowerCase() +
        entry.tier +
        entry.maxAllocation
      ).toString('hex')}`
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
}
```

---

## Module: rewards

### Purpose

The Rewards module handles point accrual, reward programs, token distributions, and conversion of pre-TGE points to tokens. It includes anti-gaming protections and supports both on-chain and off-chain reward mechanisms.

### Data Models

```typescript
// @mcv/token-economy/rewards/schema.ts
import { pgTable, text, jsonb, timestamp, numeric, boolean, integer, index, pgEnum } from "drizzle-orm/pg-core";
import { createId } from "@paralleldrive/cuid2";

export const pointSourceEnum = pgEnum('reward_point_source', [
  'bet_placed',
  'bet_won',
  'referral_signup',
  'referral_deposit',
  'quest_completed',
  'streak_bonus',
  'daily_login',
  'social_share',
  'content_created',
  'governance_vote',
  'staking_deposit',
  'liquidity_provided',
  'marketplace_trade',
  'education_completed',
  'feedback_given',
  'community_moderation',
  'early_adopter',
  'vip_bonus',
  'promotional',
  'manual_adjustment'
]);

export const programTypeEnum = pgEnum('reward_program_type', [
  'points',
  'token_airdrop',
  'staking_yield',
  'referral',
  'campaign',
  'loyalty_tier',
  'achievement'
]);

export const programStatusEnum = pgEnum('reward_program_status', [
  'draft',
  'scheduled',
  'active',
  'paused',
  'completed',
  'expired',
  'cancelled'
]);

// Point Entries (Immutable append-only ledger)
export const pointEntries = pgTable('reward_point_entries', {
  id: text('id').$defaultFn(() => createId()).primaryKey(),
  ventureId: text('venture_id').notNull(),
  userId: text('user_id').notNull(),
  
  // Source tracking
  source: pointSourceEnum('source').notNull(),
  sourceId: text('source_id'), // Reference to bet, quest, etc.
  
  // Amount (can be negative for redemptions)
  amount: integer('amount').notNull(),
  multiplier: numeric('multiplier', { precision: 5, scale: 4 }).default('1'),
  finalAmount: integer('final_amount').notNull(), // amount * multiplier
  
  // Context
  programId: text('program_id'),
  campaignId: text('campaign_id'),
  
  // Anti-gaming
  sybilScore: numeric('sybil_score', { precision: 5, scale: 4 }),
  deviceFingerprint: text('device_fingerprint'),
  ipAddress: text('ip_address'),
  flagged: boolean('flagged').default(false),
  flagReason: text('flag_reason'),
  
  metadata: jsonb('metadata').$type<Record<string, unknown>>(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  userIdx: index('points_user_idx').on(table.userId),
  ventureUserIdx: index('points_venture_user_idx').on(table.ventureId, table.userId),
  sourceIdx: index('points_source_idx').on(table.source),
  createdIdx: index('points_created_idx').on(table.createdAt),
}));

// Point Balances (Materialized view for fast queries)
export const pointBalances = pgTable('reward_point_balances', {
  id: text('id').$defaultFn(() => createId()).primaryKey(),
  ventureId: text('venture_id').notNull(),
  userId: text('user_id').notNull(),
  
  totalEarned: integer('total_earned').default(0),
  totalRedeemed: integer('total_redeemed').default(0),
  totalExpired: integer('total_expired').default(0),
  currentBalance: integer('current_balance').default(0),
  
  // Breakdown by source
  breakdown: jsonb('breakdown').$type<Record<string, number>>(),
  
  // Tier tracking
  lifetimePoints: integer('lifetime_points').default(0),
  currentTier: text('current_tier'),
  tierExpiresAt: timestamp('tier_expires_at'),
  
  lastActivity: timestamp('last_activity'),
  updatedAt: timestamp('updated_at').defaultNow().$onUpdate(() => new Date()),
}, (table) => ({
  ventureUserIdx: index('balance_venture_user_idx').on(table.ventureId, table.userId).unique(),
}));

// Reward Programs
export const rewardPrograms = pgTable('reward_programs', {
  id: text('id').$defaultFn(() => createId()).primaryKey(),
  ventureId: text('venture_id').notNull(),
  
  // Identity
  name: text('name').notNull(),
  slug: text('slug').notNull(),
  description: text('description'),
  
  // Type and status
  type: programTypeEnum('type').notNull(),
  status: programStatusEnum('status').default('draft'),
  
  // Budget
  budget: numeric('budget', { precision: 24, scale: 8 }),
  budgetType: text('budget_type').default('tokens'), // 'tokens' | 'points' | 'usd'
  spent: numeric('spent', { precision: 24, scale: 8 }).default('0'),
  
  // Emission configuration
  emissionRate: numeric('emission_rate', { precision: 18, scale: 8 }),
  emissionInterval: text('emission_interval'), // 'daily' | 'weekly' | 'monthly'
  decayFactor: numeric('decay_factor', { precision: 5, scale: 4 }),
  
  // Eligibility
  eligibilityRules: jsonb('eligibility_rules').$type<EligibilityRule[]>(),
  
  // Timing
  startsAt: timestamp('starts_at'),
  endsAt: timestamp('ends_at'),
  
  // Participation
  participantCount: integer('participant_count').default(0),
  maxParticipants: integer('max_participants'),
  
  metadata: jsonb('metadata').$type<Record<string, unknown>>(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().$onUpdate(() => new Date()),
}, (table) => ({
  ventureIdx: index('program_venture_idx').on(table.ventureId),
  statusIdx: index('program_status_idx').on(table.status),
  slugIdx: index('program_slug_idx').on(table.ventureId, table.slug).unique(),
}));

// Program Participants
export const programParticipants = pgTable('reward_program_participants', {
  id: text('id').$defaultFn(() => createId()).primaryKey(),
  programId: text('program_id').notNull().references(() => rewardPrograms.id),
  userId: text('user_id').notNull(),
  
  // Participation status
  status: text('status').default('active'), // active, completed, disqualified
  joinedAt: timestamp('joined_at').defaultNow(),
  
  // Progress
  earnedAmount: numeric('earned_amount', { precision: 18, scale: 8 }).default('0'),
  claimedAmount: numeric('claimed_amount', { precision: 18, scale: 8 }).default('0'),
  
  // Eligibility snapshot
  eligibilityData: jsonb('eligibility_data').$type<Record<string, unknown>>(),
  
  metadata: jsonb('metadata').$type<Record<string, unknown>>(),
  updatedAt: timestamp('updated_at').defaultNow().$onUpdate(() => new Date()),
}, (table) => ({
  programUserIdx: index('participant_program_user_idx').on(table.programId, table.userId).unique(),
}));

// Distribution Batches
export const distributionBatches = pgTable('reward_distribution_batches', {
  id: text('id').$defaultFn(() => createId()).primaryKey(),
  ventureId: text('venture_id').notNull(),
  programId: text('program_id'),
  
  // Batch details
  name: text('name'),
  description: text('description'),
  
  // Recipients
  recipientCount: integer('recipient_count').notNull(),
  totalAmount: numeric('total_amount', { precision: 24, scale: 8 }).notNull(),
  tokenSymbol: text('token_symbol'),
  tokenMint: text('token_mint'),
  
  // Processing
  status: text('status').default('pending'), // pending, processing, submitted, confirmed, failed
  processedCount: integer('processed_count').default(0),
  failedCount: integer('failed_count').default(0),
  
  // On-chain
  txSignatures: jsonb('tx_signatures').$type<string[]>(),
  
  // Errors
  errorMessage: text('error_message'),
  errorDetails: jsonb('error_details'),
  
  // Approval
  requiresApproval: boolean('requires_approval').default(false),
  approvedBy: text('approved_by'),
  approvedAt: timestamp('approved_at'),
  
  metadata: jsonb('metadata').$type<Record<string, unknown>>(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().$onUpdate(() => new Date()),
});

// Distribution Recipients
export const distributionRecipients = pgTable('reward_distribution_recipients', {
  id: text('id').$defaultFn(() => createId()).primaryKey(),
  batchId: text('batch_id').notNull().references(() => distributionBatches.id),
  
  userId: text('user_id'),
  walletAddress: text('wallet_address').notNull(),
  
  amount: numeric('amount', { precision: 18, scale: 8 }).notNull(),
  
  status: text('status').default('pending'), // pending, sent, confirmed, failed
  txSignature: text('tx_signature'),
  errorMessage: text('error_message'),
  
  processedAt: timestamp('processed_at'),
}, (table) => ({
  batchIdx: index('recipient_batch_idx').on(table.batchId),
}));

// Conversion Rules (Points to Tokens)
export const conversionRules = pgTable('reward_conversion_rules', {
  id: text('id').$defaultFn(() => createId()).primaryKey(),
  ventureId: text('venture_id').notNull(),
  
  name: text('name').notNull(),
  description: text('description'),
  
  // Conversion rate
  pointsRequired: integer('points_required').notNull(),
  tokensReceived: numeric('tokens_received', { precision: 18, scale: 8 }).notNull(),
  
  // Limits
  minPoints: integer('min_points'),
  maxPoints: integer('max_points'),
  maxConversionsPerUser: integer('max_conversions_per_user'),
  
  // Timing
  isActive: boolean('is_active').default(true),
  startsAt: timestamp('starts_at'),
  endsAt: timestamp('ends_at'),
  
  // Budget
  totalBudget: numeric('total_budget', { precision: 24, scale: 8 }),
  usedBudget: numeric('used_budget', { precision: 24, scale: 8 }).default('0'),
  
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().$onUpdate(() => new Date()),
});

// Conversion History
export const conversionHistory = pgTable('reward_conversion_history', {
  id: text('id').$defaultFn(() => createId()).primaryKey(),
  ventureId: text('venture_id').notNull(),
  userId: text('user_id').notNull(),
  ruleId: text('rule_id').references(() => conversionRules.id),
  
  pointsConverted: integer('points_converted').notNull(),
  tokensReceived: numeric('tokens_received', { precision: 18, scale: 8 }).notNull(),
  conversionRate: numeric('conversion_rate', { precision: 18, scale: 8 }).notNull(),
  
  status: text('status').default('pending'), // pending, confirmed, failed
  txSignature: text('tx_signature'),
  
  createdAt: timestamp('created_at').defaultNow().notNull(),
});
```

### API Surface

```typescript
// @mcv/token-economy/rewards/router.ts
export const rewardsRouter = router({
  // Points Management
  points: router({
    accrue: protectedProcedure
      .input(z.object({
        source: pointSourceSchema,
        amount: z.number().int().positive(),
        sourceId: z.string().optional(),
        metadata: z.record(z.unknown()).optional()
      }))
      .mutation(async ({ ctx, input }) => {
        // Record point entry, update balance
        // Apply multipliers based on tier/campaigns
        // Run anti-gaming checks
      }),

    getBalance: protectedProcedure
      .query(async ({ ctx }) => {
        // Get current balance with breakdown
      }),

    getHistory: protectedProcedure
      .input(z.object({
        source: pointSourceSchema.optional(),
        startDate: z.date().optional(),
        endDate: z.date().optional(),
        limit: z.number().min(1).max(100).default(50),
        cursor: z.string().optional()
      }))
      .query(async ({ ctx, input }) => {
        // Paginated point history
      }),

    getLeaderboard: publicProcedure
      .input(z.object({
        period: z.enum(['daily', 'weekly', 'monthly', 'alltime']).default('weekly'),
        limit: z.number().min(1).max(100).default(50)
      }))
      .query(async ({ ctx, input }) => {
        // Get top point earners
      }),
  }),

  // Program Management
  programs: router({
    list: protectedProcedure
      .input(z.object({
        type: programTypeSchema.optional(),
        status: programStatusSchema.optional(),
        limit: z.number().min(1).max(50).default(20),
        cursor: z.string().optional()
      }))
      .query(async ({ ctx, input }) => {
        // List programs with stats
      }),

    get: protectedProcedure
      .input(z.object({ programId: z.string() }))
      .query(async ({ ctx, input }) => {
        // Get program details
      }),

    create: superAdminProcedure
      .input(createProgramSchema)
      .mutation(async ({ ctx, input }) => {
        // Create new reward program
      }),

    update: superAdminProcedure
      .input(updateProgramSchema)
      .mutation(async ({ ctx, input }) => {
        // Update program
      }),

    join: protectedProcedure
      .input(z.object({ programId: z.string() }))
      .mutation(async ({ ctx, input }) => {
        // Join a program (checks eligibility)
      }),

    getStats: superAdminProcedure
      .input(z.object({ programId: z.string() }))
      .query(async ({ ctx, input }) => {
        // Program analytics
      }),
  }),

  // Distributions
  distributions: router({
    createBatch: superAdminProcedure
      .input(z.object({
        programId: z.string().optional(),
        recipients: z.array(z.object({
          userId: z.string().optional(),
          walletAddress: z.string(),
          amount: z.number()
        })),
        tokenMint: z.string(),
        requiresApproval: z.boolean().default(true)
      }))
      .mutation(async ({ ctx, input }) => {
        // Create distribution batch
      }),

    approveBatch: superAdminProcedure
      .input(z.object({ batchId: z.string() }))
      .mutation(async ({ ctx, input }) => {
        // Approve batch for execution
      }),

    executeBatch: superAdminProcedure
      .input(z.object({ batchId: z.string() }))
      .mutation(async ({ ctx, input }) => {
        // Execute on-chain distribution
      }),

    getBatchStatus: protectedProcedure
      .input(z.object({ batchId: z.string() }))
      .query(async ({ ctx, input }) => {
        // Get batch status with recipient details
      }),
  }),

  // Conversions (Points to Tokens)
  conversions: router({
    getRules: protectedProcedure
      .query(async ({ ctx }) => {
        // Get active conversion rules
      }),

    convert: protectedProcedure
      .input(z.object({
        ruleId: z.string(),
        points: z.number().int().positive()
      }))
      .mutation(async ({ ctx, input }) => {
        // Convert points to tokens
      }),

    getHistory: protectedProcedure
      .input(z.object({
        limit: z.number().min(1).max(100).default(50),
        cursor: z.string().optional()
      }))
      .query(async ({ ctx, input }) => {
        // Get conversion history
      }),
  }),
});
```

### Anti-Gaming Service

```typescript
// @mcv/token-economy/rewards/anti-gaming.ts
export interface AntiGamingCheck {
  passed: boolean;
  score: number; // 0-1, higher = more suspicious
  flags: string[];
  action: 'allow' | 'flag' | 'block';
}

export class AntiGamingService {
  // Rate limits per source
  private readonly rateLimits: Record<string, { count: number; windowMs: number }> = {
    bet_placed: { count: 100, windowMs: 60000 },
    referral_signup: { count: 10, windowMs: 86400000 },
    daily_login: { count: 1, windowMs: 86400000 },
    social_share: { count: 5, windowMs: 3600000 },
  };

  async check(params: {
    userId: string;
    source: string;
    amount: number;
    metadata: Record<string, unknown>;
    deviceFingerprint?: string;
    ipAddress?: string;
  }): Promise<AntiGamingCheck> {
    const flags: string[] = [];
    let score = 0;

    // 1. Rate limit check
    const rateCheck = await this.checkRateLimit(params.userId, params.source);
    if (!rateCheck.passed) {
      flags.push('rate_limit_exceeded');
      score += 0.3;
    }

    // 2. Velocity check (unusual activity patterns)
    const velocityCheck = await this.checkVelocity(params.userId);
    if (!velocityCheck.passed) {
      flags.push('high_velocity');
      score += velocityCheck.severity * 0.2;
    }

    // 3. Device fingerprint check (same device, multiple accounts)
    if (params.deviceFingerprint) {
      const deviceCheck = await this.checkDevice(params.userId, params.deviceFingerprint);
      if (!deviceCheck.passed) {
        flags.push('shared_device');
        score += 0.25;
      }
    }

    // 4. IP reputation check
    if (params.ipAddress) {
      const ipCheck = await this.checkIP(params.ipAddress);
      if (!ipCheck.passed) {
        flags.push('suspicious_ip');
        score += ipCheck.severity * 0.15;
      }
    }

    // 5. Referral chain check (self-referral detection)
    if (params.source.startsWith('referral')) {
      const referralCheck = await this.checkReferralChain(params.userId, params.metadata);
      if (!referralCheck.passed) {
        flags.push('suspicious_referral');
        score += 0.4;
      }
    }

    // Determine action
    let action: 'allow' | 'flag' | 'block';
    if (score >= 0.7) action = 'block';
    else if (score >= 0.4) action = 'flag';
    else action = 'allow';

    return { passed: action !== 'block', score, flags, action };
  }

  private async checkRateLimit(userId: string, source: string): Promise<{ passed: boolean }> {
    const limit = this.rateLimits[source];
    if (!limit) return { passed: true };

    // Check Redis for recent entries
    const count = await this.getRecentCount(userId, source, limit.windowMs);
    return { passed: count < limit.count };
  }

  private async checkVelocity(userId: string): Promise<{ passed: boolean; severity: number }> {
    // Compare current activity rate to user's baseline
    const baseline = await this.getUserBaseline(userId);
    const current = await this.getCurrentRate(userId);
    
    const ratio = current / (baseline || 1);
    if (ratio > 5) return { passed: false, severity: 1 };
    if (ratio > 3) return { passed: false, severity: 0.5 };
    return { passed: true, severity: 0 };
  }

  private async checkDevice(userId: string, fingerprint: string): Promise<{ passed: boolean }> {
    // Check if device is associated with multiple users
    const associatedUsers = await this.getDeviceUsers(fingerprint);
    return { passed: associatedUsers.length <= 1 || associatedUsers.includes(userId) };
  }

  private async checkIP(ipAddress: string): Promise<{ passed: boolean; severity: number }> {
    // Check IP against VPN/proxy lists and known bad actors
    const reputation = await this.getIPReputation(ipAddress);
    return {
      passed: reputation.score > 0.5,
      severity: 1 - reputation.score
    };
  }

  private async checkReferralChain(userId: string, metadata: Record<string, unknown>): Promise<{ passed: boolean }> {
    // Detect circular referral chains
    const referrerId = metadata.referrerId as string;
    if (!referrerId) return { passed: true };
    
    const chain = await this.getReferralChain(referrerId);
    return { passed: !chain.includes(userId) };
  }
}
```

---

## Integration Points

| Consumer | Usage |
|----------|-------|
| `@mcv/web3-core/tokens` | Token minting for distributions |
| `@mcv/web3-core/wallets` | Wallet address resolution |
| `@mcv/web3-core/staking` | Staking reward triggers |
| `@mcv/engagement/gamification` | Quest/achievement point accrual |
| `@mcv/compliance/kyc` | Sale participation eligibility |
| `@mcv/audit` | Immutable audit trail |
| `@mcv/events` | Point accrual events |
| `@mcv/queue` | Batch distribution processing |

---

## Security & Performance

### Security Requirements
- Point ledger is **append-only** — no updates or deletes allowed
- All distribution batches > $10,000 require Super Admin approval
- Merkle proofs verified on-chain before purchase
- Anti-gaming checks run on every point accrual
- Vesting claims require wallet signature verification

### Performance Requirements
| Operation | Target Latency | Notes |
|-----------|---------------|-------|
| Point accrual | < 10ms | Async balance update via queue |
| Balance query | < 50ms | Cached in Redis |
| Merkle proof generation | < 100ms | Cached after first generation |
| Batch distribution (500 recipients) | < 30s | Parallel transaction submission |
| Vesting claim calculation | < 100ms | Pre-computed unlock schedule |

### Rate Limits
| Operation | Limit |
|-----------|-------|
| Point accrual (per user) | 100/min |
| Distribution batch creation | 10/hour |
| Conversion requests | 5/hour |

---

## Dependencies

### Internal Dependencies
| Package | Version | Purpose |
|---------|---------|---------|
| `@mcv/db` | * | Database access |
| `@mcv/auth` | * | Authentication |
| `@mcv/audit` | * | Audit logging |
| `@mcv/events` | * | Event emission |
| `@mcv/queue` | * | Background job processing |
| `@mcv/cache` | * | Redis caching |

### External Dependencies
| Package | Version | Purpose |
|---------|---------|---------|
| `merkletreejs` | ^0.4.x | Merkle tree generation |
| `viem` | ^2.x | Keccak256 hashing |
| `@solana/web3.js` | ^1.x | Solana transactions |
| `@streamflow/stream` | ^6.x | Vesting streams (optional) |

---

## Related Documentation

- [ACS Module Details](./acs/MODULE.md)
- [Launchpad Module Details](./launchpad/MODULE.md)
- [Rewards Module Details](./rewards/MODULE.md)
- [Web3-Core Package](../mcv-only/web3-core/SPEC.md)

---

*@mcv/token-economy — Building the Economic Engine for Web3 Ventures*
