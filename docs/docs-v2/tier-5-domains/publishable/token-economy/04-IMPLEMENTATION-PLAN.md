# @mcv/token-economy — Implementation Plan

**Package:** `@mcv/token-economy`
**Tier:** 5 (Domain — Publishable)
**Classification:** PUBLISHABLE
**Document:** 04-IMPLEMENTATION-PLAN.md
**Last Updated:** February 9, 2026

---

## Table of Contents

1. [Overview](#overview)
2. [Prerequisites](#prerequisites)
3. [Phase 1 — Foundation](#phase-1--foundation-weeks-14)
4. [Phase 2 — Core](#phase-2--core-weeks-58)
5. [Phase 3 — Advanced](#phase-3--advanced-weeks-912)
6. [Phase 4 — Polish & Hardening](#phase-4--polish--hardening-weeks-1314)
7. [Testing Strategy](#testing-strategy)
8. [Acceptance Criteria](#acceptance-criteria)
9. [Risk Matrix](#risk-matrix)
10. [Timeline & Milestones](#timeline--milestones)

---

## Overview

`@mcv/token-economy` provides the complete tokenomics infrastructure for the MCV ecosystem's EDGE token on Solana. It implements token reward distribution with anti-abuse protections, Automated Contribution Scoring (ACS) for algorithmic parameter tuning and contribution-to-token conversion, and a full-featured token launchpad with IDO/IEO management, Merkle-proof whitelists, and vesting schedules.

**This is the single source of truth for how users earn, claim, and interact with the EDGE token economy across all nine MCV ventures.**

The system bridges two worlds: **off-chain scoring** (fast, cheap, flexible — points, contributions, leaderboards) and **on-chain distribution** (immutable, verifiable, trustless — token claims, vesting streams, launchpad purchases). ACS sits at the boundary, algorithmically controlling emission rates, staking APYs, and conversion ratios based on real-time market conditions and protocol health metrics.

### Implementation Goals

- **Append-Only Point Ledger** — Immutable, tamper-proof record of every point earned across all ventures
- **Multi-Venture Reward Programs** — Each venture defines earning rules; the system unifies them
- **Automated Contribution Scoring** — Algorithmic regime detection and controller tuning
- **Anti-Sybil/Anti-Abuse** — Rate limiting, velocity checks, device fingerprinting, IP reputation
- **On-Chain Distribution** — Batched Solana SPL token transfers with verification
- **Token Launchpad** — IDO/IEO management with Merkle whitelists and vesting
- **Cross-Venture Economy** — Unified token economy spanning BetEdge, SerpSpace, Full Gain, MCV Studios, Futurestate, and more

### Submodule Summary

| # | Submodule | Core Responsibility | Tables |
|---|-----------|-------------------|--------|
| 1 | `rewards` | Point accrual, reward programs, pools, vesting, claims, distribution, anti-abuse | 16 |
| 2 | `acs` | Automated Contribution Scoring, regime detection, controllers, leaderboards, decay | 12 |
| 3 | `launchpad` | Token sales, whitelists, Merkle proofs, vesting, purchases, fair launch | 10 |

### Critical Security Invariants

> **The point ledger is append-only and immutable.** No updates, no deletes. Every point entry is a permanent record. Token economies are high-value targets — the audit trail must be tamper-proof.

> **All on-chain operations require multi-sig or verified wallet signatures.** No single service can unilaterally distribute tokens.

> **ACS regime changes emit events and require cooldown periods.** Rapid oscillation between regimes is prevented by dampening.

---

## Prerequisites

### Infrastructure Dependencies

| Dependency | Purpose | Version |
|-----------|---------|---------|
| `@mcv/kernel` | Database context, base columns, multi-tenancy | ≥1.0.0 |
| `@mcv/auth` | Authentication, RBAC, RLS policies | ≥1.0.0 |
| `@mcv/identity` | User verification, KYC for token claims | ≥1.0.0 |
| `@mcv/web3-core` | Solana wallet operations, SPL token transfers, staking | ≥1.0.0 |
| `@mcv/engagement` | Points/achievements trigger rewards (event source) | ≥1.0.0 |
| `@mcv/fabric` | Event bus (Redpanda/Kafka), audit trail | ≥1.0.0 |
| Supabase/PostgreSQL | Primary data store with RLS | 15+ |
| Drizzle ORM | Schema definitions, migrations, queries | ≥0.29.0 |
| Redis | Point balance cache, leaderboard cache, rate limits, anti-abuse windows | ≥7.0 |
| BullMQ | Distribution batch processing, decay computation, ACS evaluation | ≥4.0.0 |
| Zod | Runtime schema validation | ≥3.22.0 |

### External Dependencies

| Dependency | Submodule | Purpose |
|-----------|-----------|---------|
| `@solana/web3.js` | rewards, launchpad | Solana RPC, transaction submission, signatures |
| `merkletreejs` | launchpad | Merkle tree proof generation for whitelists |
| `@streamflow/stream` | launchpad | Vesting stream contracts on Solana |
| `ioredis` | rewards, acs | Caching, rate limiting, leaderboard sorted sets |
| Solana RPC (Helius/Quicknode) | all | Reliable Solana RPC endpoint |
| CoinGecko/Jupiter API | acs | EDGE token price, volume, market cap data |
| Pyth Network | acs | On-chain price oracle for ACS regime detection |

### Team & Skills

- 2 Backend engineers (Node.js, PostgreSQL, Drizzle ORM, BullMQ)
- 1 Blockchain engineer (Solana, SPL tokens, Anchor, Merkle proofs)
- 1 Security engineer (anti-sybil, rate limiting, fraud detection)
- 1 Frontend engineer (React, real-time dashboards, wallet integration)
- 1 QA engineer (financial accuracy testing, on-chain verification)

### Solana Program Prerequisites

- EDGE SPL token mint deployed and configured
- Token authority multi-sig wallet established
- Distribution program (Anchor) deployed and audited
- Vesting stream program deployed (Streamflow or custom)
- Launchpad program deployed with purchase + claim instructions

---

## Phase 1 — Foundation (Weeks 1–4)

### Objective

Build the foundational point system with earning, spending, and balance tracking. Establish the immutable point ledger, reward program framework, and basic anti-abuse protections. This phase focuses entirely on the **off-chain** portion of the economy.

### 1.1 — Database Schema & Migrations

**Duration:** Week 1
**Submodules:** rewards (core tables), acs (base tables)

```typescript
// Point entries — IMMUTABLE APPEND-ONLY LEDGER
import { pgTable, text, integer, decimal, jsonb, timestamp, boolean } from 'drizzle-orm/pg-core';
import { createId } from '@paralleldrive/cuid2';

export const pointEntries = pgTable('reward_point_entries', {
  id: text('id').$defaultFn(() => createId()).primaryKey(),
  ventureId: text('venture_id').notNull(),
  userId: text('user_id').notNull(),
  programId: text('program_id'),
  source: text('source').notNull(), // venture_action | referral | staking | governance | manual
  action: text('action').notNull(), // bet_placed | content_created | grant_milestone | etc.
  points: integer('points').notNull(),
  metadata: jsonb('metadata').default({}), // action-specific context
  idempotencyKey: text('idempotency_key').notNull(), // prevent double-accrual
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  // NO updatedAt — entries are IMMUTABLE
});

// CRITICAL: No UPDATE or DELETE policies on this table
// CREATE POLICY point_entries_insert_only ON reward_point_entries
//   FOR INSERT USING (venture_id = current_setting('app.venture_id')::text);
// CREATE POLICY point_entries_select ON reward_point_entries
//   FOR SELECT USING (venture_id = current_setting('app.venture_id')::text);

// Unique constraint prevents double-accrual
// CREATE UNIQUE INDEX idx_point_entries_idempotency ON reward_point_entries(idempotency_key);

export const pointBalances = pgTable('reward_point_balances', {
  id: text('id').$defaultFn(() => createId()).primaryKey(),
  ventureId: text('venture_id').notNull(),
  userId: text('user_id').notNull(),
  totalEarned: integer('total_earned').notNull().default(0),
  totalSpent: integer('total_spent').notNull().default(0),
  totalConverted: integer('total_converted').notNull().default(0),
  currentBalance: integer('current_balance').notNull().default(0),
  lastActivityAt: timestamp('last_activity_at', { withTimezone: true }),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

// UNIQUE per venture+user
// CREATE UNIQUE INDEX idx_point_balances_user ON reward_point_balances(venture_id, user_id);

export const rewardPrograms = pgTable('reward_programs', {
  id: text('id').$defaultFn(() => createId()).primaryKey(),
  ventureId: text('venture_id').notNull(),
  name: text('name').notNull(),
  type: text('type').notNull(), // earning | spending | conversion | referral
  status: text('status').notNull().default('draft'), // draft | active | paused | completed
  rules: jsonb('rules').notNull(), // EarnRule[] | SpendRule[]
  startDate: timestamp('start_date', { withTimezone: true }),
  endDate: timestamp('end_date', { withTimezone: true }),
  maxParticipants: integer('max_participants'),
  totalBudget: integer('total_budget'), // max points to distribute
  distributedAmount: integer('distributed_amount').default(0),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export const rewardAbuseFlags = pgTable('reward_abuse_flags', {
  id: text('id').$defaultFn(() => createId()).primaryKey(),
  ventureId: text('venture_id').notNull(),
  userId: text('user_id').notNull(),
  flagType: text('flag_type').notNull(), // rate_limit | velocity | device | ip | sybil
  severity: text('severity').notNull(), // warning | suspend | ban
  evidence: jsonb('evidence').notNull(), // detection details
  action: text('action').notNull(), // logged | points_held | account_suspended
  resolvedAt: timestamp('resolved_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});
```

**Tasks:**
- [ ] Create rewards schema: point_entries, point_balances, reward_programs, program_participants, reward_abuse_flags
- [ ] Create ACS base schema: acs_states, acs_controllers, contribution_types, contribution_entries
- [ ] Create launchpad base schema: token_sales (placeholder for Phase 2)
- [ ] Generate and test all migrations against Supabase
- [ ] Apply RLS policies with INSERT-ONLY on point_entries (no UPDATE/DELETE)
- [ ] Create indexes: idempotency key (unique), user+venture on balances, user+action composite
- [ ] Implement database trigger: point_entries INSERT → auto-update point_balances
- [ ] Seed development data with sample programs and point entries for each venture

### 1.2 — Point Accrual System (rewards)

**Duration:** Weeks 1–2
**Services:** `rewardsService`

```typescript
// Rewards service — point accrual with anti-abuse
export class RewardsService {
  async accruePoints(input: AccruePointsInput): Promise<PointEntry> {
    const validated = accruePointsSchema.parse(input);

    // Step 1: Idempotency check
    const existing = await this.db.select()
      .from(pointEntries)
      .where(eq(pointEntries.idempotencyKey, validated.idempotencyKey))
      .limit(1);
    if (existing.length > 0) return existing[0]; // Already processed

    // Step 2: Anti-abuse checks
    const abuseResult = await this.antiGamingService.check({
      userId: validated.userId,
      ventureId: validated.ventureId,
      action: validated.action,
      points: validated.points,
      metadata: validated.metadata,
    });
    if (abuseResult.blocked) {
      await this.recordAbuseFlag(validated, abuseResult);
      throw new FraudDetectedError(abuseResult.reason);
    }

    // Step 3: Validate against program rules
    if (validated.programId) {
      const program = await this.getProgram(validated.programId);
      this.validateProgramRules(program, validated);
    }

    // Step 4: Insert point entry (immutable)
    const entry = await this.db.insert(pointEntries).values({
      ventureId: validated.ventureId,
      userId: validated.userId,
      programId: validated.programId,
      source: validated.source,
      action: validated.action,
      points: validated.points,
      metadata: validated.metadata,
      idempotencyKey: validated.idempotencyKey,
    }).returning();

    // Step 5: Update balance (atomic)
    await this.db
      .insert(pointBalances)
      .values({
        ventureId: validated.ventureId,
        userId: validated.userId,
        totalEarned: validated.points,
        currentBalance: validated.points,
        lastActivityAt: new Date(),
      })
      .onConflictDoUpdate({
        target: [pointBalances.ventureId, pointBalances.userId],
        set: {
          totalEarned: sql`${pointBalances.totalEarned} + ${validated.points}`,
          currentBalance: sql`${pointBalances.currentBalance} + ${validated.points}`,
          lastActivityAt: new Date(),
          updatedAt: new Date(),
        },
      });

    // Step 6: Sync to Redis cache
    await this.redis.hincrby(
      `points:${validated.ventureId}:${validated.userId}`,
      'balance',
      validated.points,
    );

    // Step 7: Emit event
    await this.eventBus.emit('token-economy.points.accrued', {
      userId: validated.userId,
      ventureId: validated.ventureId,
      points: validated.points,
      action: validated.action,
      newBalance: await this.getBalance(validated.userId, validated.ventureId),
    });

    return entry[0];
  }

  async getBalance(userId: string, ventureId: string): Promise<number> {
    // Try Redis first
    const cached = await this.redis.hget(`points:${ventureId}:${userId}`, 'balance');
    if (cached !== null) return parseInt(cached, 10);

    // Fallback to DB
    const balance = await this.db.select()
      .from(pointBalances)
      .where(and(
        eq(pointBalances.userId, userId),
        eq(pointBalances.ventureId, ventureId),
      ))
      .limit(1);

    const val = balance[0]?.currentBalance ?? 0;

    // Populate cache
    await this.redis.hset(`points:${ventureId}:${userId}`, 'balance', val);
    await this.redis.expire(`points:${ventureId}:${userId}`, 3600); // 1 hour TTL

    return val;
  }

  async getHistory(
    userId: string,
    ventureId: string,
    options?: { limit?: number; cursor?: string },
  ): Promise<PaginatedResult<PointEntry>> {
    const limit = options?.limit ?? 50;

    let query = this.db.select()
      .from(pointEntries)
      .where(and(
        eq(pointEntries.userId, userId),
        eq(pointEntries.ventureId, ventureId),
      ))
      .orderBy(desc(pointEntries.createdAt))
      .limit(limit + 1);

    if (options?.cursor) {
      query = query.where(lt(pointEntries.createdAt, new Date(options.cursor)));
    }

    const results = await query;
    const hasMore = results.length > limit;
    const items = hasMore ? results.slice(0, limit) : results;

    return {
      items,
      cursor: hasMore ? items[items.length - 1].createdAt.toISOString() : null,
      hasMore,
    };
  }
}
```

**Tasks:**
- [ ] Implement `rewardsService.accruePoints()` with idempotency and 7-step pipeline
- [ ] Implement `rewardsService.getBalance()` with Redis cache + DB fallback
- [ ] Implement `rewardsService.getHistory()` with cursor-based pagination
- [ ] Build Redpanda consumer for venture action events (bet.placed, content.created, etc.)
- [ ] Implement earn rules engine (map venture actions to point amounts)
- [ ] Build `PointBalanceCard` component showing current balance
- [ ] Build `PointHistoryTable` component with paginated history
- [ ] Implement Redis cache synchronization (write-through on accrual)
- [ ] Add database trigger to auto-update `point_balances` on `point_entries` INSERT
- [ ] Write Zod validation schemas for all accrual inputs

### 1.3 — Reward Programs (rewards)

**Duration:** Weeks 2–3
**Services:** `rewardPoolService`

```typescript
// Reward program management
export class RewardPoolService {
  async createProgram(input: CreateProgramInput): Promise<RewardProgram> {
    const validated = createProgramSchema.parse(input);

    return this.db.insert(rewardPrograms).values({
      ventureId: validated.ventureId,
      name: validated.name,
      type: validated.type,
      rules: validated.rules,
      startDate: validated.startDate,
      endDate: validated.endDate,
      maxParticipants: validated.maxParticipants,
      totalBudget: validated.totalBudget,
      status: 'draft',
    }).returning();
  }

  async createPool(input: CreateRewardPoolInput): Promise<RewardPool> {
    const validated = createPoolSchema.parse(input);

    const pool = await this.db.insert(rewardPools).values({
      ventureId: validated.ventureId,
      name: validated.name,
      tokenMint: validated.tokenMint ?? EDGE_TOKEN_MINT,
      totalBudget: validated.totalBudget,
      distributedAmount: 0,
      remainingBudget: validated.totalBudget,
      distributionStrategy: validated.strategy, // proportional | fixed | tiered
      startDate: validated.startDate,
      endDate: validated.endDate,
    }).returning();

    // Allocate budget across ventures if cross-venture pool
    if (validated.ventureAllocations) {
      for (const allocation of validated.ventureAllocations) {
        await this.db.insert(rewardPoolAllocations).values({
          poolId: pool[0].id,
          ventureId: allocation.ventureId,
          percentage: allocation.percentage,
          allocatedAmount: Math.floor(validated.totalBudget * allocation.percentage / 100),
        });
      }
    }

    return pool[0];
  }

  async enrollUser(programId: string, userId: string): Promise<ProgramParticipant> {
    const program = await this.getProgram(programId);

    // Check capacity
    if (program.maxParticipants) {
      const count = await this.getParticipantCount(programId);
      if (count >= program.maxParticipants) {
        throw new ValidationError('Program is at capacity');
      }
    }

    // Check eligibility rules
    await this.checkEligibility(program, userId);

    return this.db.insert(programParticipants).values({
      programId,
      userId,
      enrolledAt: new Date(),
      status: 'active',
    }).returning();
  }
}
```

**Tasks:**
- [ ] Implement `rewardPoolService.createProgram()` with rule definitions
- [ ] Implement `rewardPoolService.createPool()` with budget management
- [ ] Build program enrollment with eligibility checking
- [ ] Implement program lifecycle (draft → active → paused → completed)
- [ ] Build venture-specific earn rules configuration
- [ ] Build `RewardProgramCard` component showing program details
- [ ] Implement program budget tracking (auto-pause when budget exhausted)
- [ ] Build cross-venture reward rules (actions in venture A earn points in venture B)
- [ ] Add program analytics (participants, points distributed, conversion rates)

### 1.4 — Anti-Abuse Engine (rewards)

**Duration:** Weeks 3–4
**Services:** `antiGamingService`

```typescript
// Anti-gaming service — multi-layer fraud detection
export class AntiGamingService {
  async check(input: AbuseCheckInput): Promise<AbuseCheckResult> {
    const checks = await Promise.all([
      this.checkRateLimit(input),
      this.checkVelocity(input),
      this.checkDeviceFingerprint(input),
      this.checkIPReputation(input),
      this.checkSybilScore(input),
    ]);

    const failedChecks = checks.filter(c => !c.passed);

    if (failedChecks.length === 0) {
      return { blocked: false };
    }

    // Determine severity based on failed checks
    const severity = this.computeSeverity(failedChecks);

    return {
      blocked: severity !== 'warning',
      reason: failedChecks.map(c => c.reason).join('; '),
      severity,
      failedChecks,
    };
  }

  private async checkRateLimit(input: AbuseCheckInput): Promise<CheckResult> {
    // Per-action rate limiting using Redis sliding window
    const key = `ratelimit:${input.ventureId}:${input.userId}:${input.action}`;
    const windowMs = this.getWindowForAction(input.action); // e.g., 24 hours
    const maxActions = this.getMaxForAction(input.action); // e.g., 500 bets/day

    const now = Date.now();
    const windowStart = now - windowMs;

    // Redis sorted set: score = timestamp, member = idempotencyKey
    await this.redis.zremrangebyscore(key, 0, windowStart);
    const count = await this.redis.zcard(key);

    if (count >= maxActions) {
      return { passed: false, reason: `Rate limit exceeded: ${count}/${maxActions} in window`, check: 'rate_limit' };
    }

    await this.redis.zadd(key, now, `${input.idempotencyKey ?? now}`);
    await this.redis.expire(key, Math.ceil(windowMs / 1000));

    return { passed: true, check: 'rate_limit' };
  }

  private async checkVelocity(input: AbuseCheckInput): Promise<CheckResult> {
    // Detect sudden spikes in activity compared to user's baseline
    const recentCount = await this.getRecentActionCount(input.userId, input.action, 3600000); // 1 hour
    const baselineHourly = await this.getBaselineHourly(input.userId, input.action);

    if (baselineHourly > 0 && recentCount > baselineHourly * 3) {
      return {
        passed: false,
        reason: `Velocity spike: ${recentCount} actions in 1h vs ${baselineHourly} baseline`,
        check: 'velocity',
      };
    }

    return { passed: true, check: 'velocity' };
  }

  private async checkSybilScore(input: AbuseCheckInput): Promise<CheckResult> {
    // Check for sybil indicators: shared devices, IP clusters, referral chains
    const sybilScore = await this.computeSybilScore(input.userId);

    if (sybilScore > DEFAULT_ANTI_GAMING_THRESHOLDS.sybilScoreMax) {
      return {
        passed: false,
        reason: `Sybil score ${sybilScore} exceeds threshold`,
        check: 'sybil',
      };
    }

    return { passed: true, check: 'sybil' };
  }
}
```

**Tasks:**
- [ ] Implement `antiGamingService.check()` with 5-layer detection pipeline
- [ ] Build rate limiting using Redis sorted sets (sliding window)
- [ ] Implement velocity detection (activity spike vs user baseline)
- [ ] Build device fingerprint tracking and clustering
- [ ] Implement IP reputation checking (shared IPs, VPN detection, geo-impossibility)
- [ ] Build sybil score computation (shared devices, rapid referral chains, IP clustering)
- [ ] Implement abuse flag recording with severity levels
- [ ] Build admin review dashboard for flagged accounts
- [ ] Add configurable thresholds per venture and action type
- [ ] Implement automatic point hold on suspicious activity (release after review)

### 1.5 — Balance Tracking & Spending (rewards)

**Duration:** Week 4

**Tasks:**
- [ ] Implement point spending (deduct from balance with validation)
- [ ] Build spending rules engine (what can points be spent on)
- [ ] Implement balance snapshot system (periodic materialized snapshots)
- [ ] Build Redis-PostgreSQL balance reconciliation job (detect drift)
- [ ] Implement cross-venture balance aggregation (total EDGE economy balance)
- [ ] Build spending transaction history
- [ ] Add balance alerts (low balance notifications)
- [ ] Implement spending limits per program

### Phase 1 Deliverables

| Deliverable | Status |
|------------|--------|
| Immutable point ledger with append-only enforcement | ⬜ |
| Point accrual pipeline with 7-step processing | ⬜ |
| Reward program management with budget tracking | ⬜ |
| 5-layer anti-abuse engine with Redis-based detection | ⬜ |
| Balance tracking with Redis cache and DB sync | ⬜ |
| Redpanda consumer for venture action events | ⬜ |
| React components: PointBalanceCard, PointHistoryTable, RewardProgramCard | ⬜ |
| RLS policies with INSERT-ONLY on point entries | ⬜ |
| Unit tests with ≥90% coverage on financial operations | ⬜ |

---

## Phase 2 — Core (Weeks 5–8)

### Objective

Build the reward pool distribution engine, vesting system, points-to-token conversion, launchpad framework, and the ACS (Automated Contribution Scoring) foundation.

### 2.1 — Distribution Engine (rewards)

**Duration:** Weeks 5–6
**Services:** `distributionService`, `conversionService`

```typescript
// Distribution service — on-chain token distribution
export class DistributionService {
  async createBatch(input: CreateDistributionBatchInput): Promise<DistributionBatch> {
    const validated = createBatchSchema.parse(input);

    // Validate all recipients have verified wallets
    const recipients = await Promise.all(
      validated.recipients.map(async (r) => {
        const wallet = await this.walletService.getVerifiedWallet(r.userId);
        if (!wallet) throw new ValidationError(`User ${r.userId} has no verified wallet`);
        return { ...r, walletAddress: wallet.address };
      })
    );

    const batch = await this.db.insert(distributionBatches).values({
      ventureId: validated.ventureId,
      poolId: validated.poolId,
      totalAmount: recipients.reduce((sum, r) => sum + r.amount, 0),
      recipientCount: recipients.length,
      tokenMint: EDGE_TOKEN_MINT,
      status: 'pending',
    }).returning();

    // Insert individual recipient records
    for (const recipient of recipients) {
      await this.db.insert(distributionRecipients).values({
        batchId: batch[0].id,
        userId: recipient.userId,
        walletAddress: recipient.walletAddress,
        amount: recipient.amount,
        status: 'pending',
      });
    }

    // Queue for processing
    await this.distributionQueue.add('process-batch', {
      batchId: batch[0].id,
    });

    return batch[0];
  }

  async processBatch(batchId: string): Promise<void> {
    const batch = await this.getBatch(batchId);
    const recipients = await this.getBatchRecipients(batchId);

    await this.db.update(distributionBatches)
      .set({ status: 'processing' })
      .where(eq(distributionBatches.id, batchId));

    // Process in chunks of 10 (Solana TX size limits)
    const chunks = this.chunk(recipients, 10);

    for (const chunk of chunks) {
      try {
        // Build Solana transaction with multiple SPL transfers
        const transfers = chunk.map(r => ({
          destination: new PublicKey(r.walletAddress),
          amount: BigInt(r.amount * 10 ** EDGE_TOKEN_DECIMALS),
        }));

        const signature = await this.web3Service.batchTransfer({
          mint: new PublicKey(EDGE_TOKEN_MINT),
          transfers,
          // Uses multi-sig authority
        });

        // Update recipient records with TX signature
        for (const recipient of chunk) {
          await this.db.update(distributionRecipients)
            .set({
              status: 'completed',
              txSignature: signature,
              completedAt: new Date(),
            })
            .where(eq(distributionRecipients.id, recipient.id));
        }
      } catch (error) {
        // Mark failed recipients for retry
        for (const recipient of chunk) {
          await this.db.update(distributionRecipients)
            .set({ status: 'failed', error: error.message })
            .where(eq(distributionRecipients.id, recipient.id));
        }
      }
    }

    // Update batch status
    const failedCount = await this.getFailedRecipientCount(batchId);
    await this.db.update(distributionBatches)
      .set({
        status: failedCount === 0 ? 'completed' : 'partial',
        completedAt: new Date(),
      })
      .where(eq(distributionBatches.id, batchId));

    await this.eventBus.emit('token-economy.distribution.completed', {
      batchId,
      totalRecipients: recipients.length,
      failedCount,
    });
  }
}

// Conversion service — points to tokens
export class ConversionService {
  async convertPoints(input: ConvertPointsInput): Promise<ConversionResult> {
    const validated = conversionSchema.parse(input);

    // Get current conversion rate from ACS
    const rate = await this.acsService.getCurrentConversionRate(validated.ventureId);

    // Calculate token amount
    const tokenAmount = Math.floor(validated.points / rate.pointsPerToken);
    if (tokenAmount === 0) {
      throw new ValidationError(`Minimum ${rate.pointsPerToken} points required for 1 EDGE token`);
    }

    // Verify user has sufficient balance
    const balance = await this.rewardsService.getBalance(validated.userId, validated.ventureId);
    if (balance < validated.points) {
      throw new ValidationError('Insufficient point balance');
    }

    // Verify user has verified wallet
    const wallet = await this.walletService.getVerifiedWallet(validated.userId);
    if (!wallet) throw new ValidationError('No verified wallet');

    return this.db.transaction(async (tx) => {
      // Deduct points
      await tx.update(pointBalances)
        .set({
          currentBalance: sql`${pointBalances.currentBalance} - ${validated.points}`,
          totalConverted: sql`${pointBalances.totalConverted} + ${validated.points}`,
          updatedAt: new Date(),
        })
        .where(and(
          eq(pointBalances.userId, validated.userId),
          eq(pointBalances.ventureId, validated.ventureId),
        ));

      // Record conversion
      const conversion = await tx.insert(conversionHistory).values({
        ventureId: validated.ventureId,
        userId: validated.userId,
        pointsSpent: validated.points,
        tokensReceived: tokenAmount,
        conversionRate: rate.pointsPerToken,
        walletAddress: wallet.address,
        status: 'pending_distribution',
      }).returning();

      // Queue token distribution
      await this.distributionQueue.add('convert-distribute', {
        conversionId: conversion[0].id,
        userId: validated.userId,
        walletAddress: wallet.address,
        tokenAmount,
      });

      // Sync Redis cache
      await this.redis.hincrby(
        `points:${validated.ventureId}:${validated.userId}`,
        'balance',
        -validated.points,
      );

      return {
        conversionId: conversion[0].id,
        pointsSpent: validated.points,
        tokensReceived: tokenAmount,
        rate: rate.pointsPerToken,
        estimatedDelivery: '5-15 minutes',
      };
    });
  }
}
```

**Tasks:**
- [ ] Implement `distributionService.createBatch()` with wallet verification
- [ ] Implement `distributionService.processBatch()` with chunked Solana transfers
- [ ] Build retry mechanism for failed transfers (exponential backoff, max 3 retries)
- [ ] Implement `conversionService.convertPoints()` with atomic balance deduction
- [ ] Build conversion rules engine (per-venture, per-program, time-based rates)
- [ ] Implement conversion rate display with real-time ACS updates
- [ ] Build `ConversionCalculator` component (input points → see EDGE tokens)
- [ ] Build `RewardClaimButton` component with wallet connection
- [ ] Implement distribution batch monitoring dashboard
- [ ] Add Solana transaction verification (confirm finality before marking complete)

### 2.2 — Vesting System (rewards, launchpad)

**Duration:** Weeks 6–7
**Services:** `vestingRewardService`, `vestingService`

```typescript
// Vesting service — time-locked token release
export class VestingRewardService {
  async createSchedule(input: CreateVestingScheduleInput): Promise<VestingSchedule> {
    const validated = vestingScheduleSchema.parse(input);

    const schedule = await this.db.insert(rewardVestingSchedules).values({
      ventureId: validated.ventureId,
      userId: validated.userId,
      totalAmount: validated.totalAmount,
      claimedAmount: 0,
      vestingType: validated.vestingType, // linear | cliff | cliff_then_linear
      startDate: validated.startDate,
      endDate: validated.endDate,
      cliffDate: validated.cliffDate,
      cliffAmount: validated.cliffAmount, // amount released at cliff
      intervalDays: validated.intervalDays ?? 30, // release interval
      walletAddress: validated.walletAddress,
      status: 'active',
    }).returning();

    await this.eventBus.emit('token-economy.vesting.created', {
      scheduleId: schedule[0].id,
      userId: validated.userId,
      totalAmount: validated.totalAmount,
    });

    return schedule[0];
  }

  async claimVested(input: ClaimRewardInput): Promise<ClaimResult> {
    const validated = claimSchema.parse(input);
    const schedule = await this.getSchedule(validated.scheduleId);

    // Calculate claimable amount
    const claimable = this.computeClaimableAmount(schedule);
    if (claimable <= 0) {
      throw new ValidationError('No tokens available to claim');
    }

    // Verify wallet ownership
    const walletVerified = await this.walletService.verifyOwnership(
      validated.userId,
      schedule.walletAddress,
      validated.signature, // signed message proving wallet ownership
    );
    if (!walletVerified) throw new AuthorizationError('Wallet verification failed');

    return this.db.transaction(async (tx) => {
      // Update claimed amount
      await tx.update(rewardVestingSchedules)
        .set({
          claimedAmount: sql`${rewardVestingSchedules.claimedAmount} + ${claimable}`,
          lastClaimAt: new Date(),
        })
        .where(eq(rewardVestingSchedules.id, schedule.id));

      // Record claim
      const claim = await tx.insert(rewardClaims).values({
        scheduleId: schedule.id,
        userId: validated.userId,
        amount: claimable,
        walletAddress: schedule.walletAddress,
        status: 'pending',
      }).returning();

      // Queue on-chain transfer
      await this.distributionQueue.add('vesting-claim', {
        claimId: claim[0].id,
        walletAddress: schedule.walletAddress,
        amount: claimable,
      });

      return {
        claimId: claim[0].id,
        amount: claimable,
        remaining: schedule.totalAmount - schedule.claimedAmount - claimable,
      };
    });
  }

  private computeClaimableAmount(schedule: VestingSchedule): number {
    const now = new Date();

    // Before start: nothing claimable
    if (now < schedule.startDate) return 0;

    // Before cliff: nothing (unless no cliff)
    if (schedule.cliffDate && now < schedule.cliffDate) return 0;

    let totalVested: number;

    switch (schedule.vestingType) {
      case 'cliff':
        totalVested = now >= schedule.cliffDate! ? schedule.totalAmount : 0;
        break;

      case 'linear': {
        const elapsed = now.getTime() - schedule.startDate.getTime();
        const total = schedule.endDate.getTime() - schedule.startDate.getTime();
        const fraction = Math.min(elapsed / total, 1);
        totalVested = Math.floor(schedule.totalAmount * fraction);
        break;
      }

      case 'cliff_then_linear': {
        if (now < schedule.cliffDate!) {
          totalVested = 0;
        } else {
          const cliffAmount = schedule.cliffAmount ?? 0;
          const remaining = schedule.totalAmount - cliffAmount;
          const elapsed = now.getTime() - schedule.cliffDate!.getTime();
          const total = schedule.endDate.getTime() - schedule.cliffDate!.getTime();
          const fraction = Math.min(elapsed / total, 1);
          totalVested = cliffAmount + Math.floor(remaining * fraction);
        }
        break;
      }

      default:
        totalVested = 0;
    }

    return Math.max(0, totalVested - schedule.claimedAmount);
  }
}
```

**Tasks:**
- [ ] Implement `vestingRewardService.createSchedule()` with 3 vesting types
- [ ] Implement `vestingRewardService.claimVested()` with wallet verification
- [ ] Build claimable amount computation (linear, cliff, cliff-then-linear)
- [ ] Implement Streamflow vesting stream integration for on-chain vesting
- [ ] Build `VestingTimeline` component showing release schedule visually
- [ ] Build `VestingClaimPanel` component with claim button and history
- [ ] Implement vesting schedule expiration handling
- [ ] Add vesting analytics (total vested, claimed, remaining across users)

### 2.3 — Launchpad Framework (launchpad)

**Duration:** Weeks 7–8
**Services:** `launchpadService`, `whitelistService`, `vestingService`

```typescript
// Launchpad service — token sale lifecycle
export class LaunchpadService {
  async createSale(input: CreateSaleInput): Promise<TokenSale> {
    const validated = createSaleSchema.parse(input);

    const sale = await this.db.insert(tokenSales).values({
      ventureId: validated.ventureId,
      name: validated.name,
      tokenMint: validated.tokenMint ?? EDGE_TOKEN_MINT,
      saleType: validated.saleType, // ido | ieo | fair_launch | community
      totalAllocation: validated.totalAllocation,
      pricePerToken: validated.pricePerToken,
      paymentTokens: validated.paymentTokens ?? ['SOL', 'USDC'],
      minPurchase: validated.minPurchase,
      maxPurchase: validated.maxPurchase,
      startDate: validated.startDate,
      endDate: validated.endDate,
      vestingParams: validated.vestingParams, // { cliff, duration, tgeUnlock }
      status: 'upcoming',
    }).returning();

    return sale[0];
  }

  async purchase(input: PurchaseInput): Promise<PurchaseTransaction> {
    const validated = purchaseSchema.parse(input);
    const sale = await this.getSale(validated.saleId);

    // Validate sale is active
    if (sale.status !== 'active') throw new ValidationError('Sale is not active');

    // Check whitelist
    if (sale.whitelistRequired) {
      const isWhitelisted = await this.whitelistService.verify(
        sale.id,
        validated.userId,
        validated.merkleProof,
      );
      if (!isWhitelisted) throw new AuthorizationError('Not whitelisted');
    }

    // Check allocation limits
    const existingPurchases = await this.getUserPurchases(validated.saleId, validated.userId);
    const totalPurchased = existingPurchases.reduce((sum, p) => sum + p.tokenAmount, 0);
    if (totalPurchased + validated.tokenAmount > sale.maxPurchase) {
      throw new ValidationError('Exceeds maximum allocation');
    }

    // Verify on-chain payment
    const paymentVerified = await this.web3Service.verifyPayment({
      txSignature: validated.paymentTxSignature,
      expectedAmount: validated.tokenAmount * sale.pricePerToken,
      expectedToken: validated.paymentToken,
      fromWallet: validated.walletAddress,
    });
    if (!paymentVerified) throw new ValidationError('Payment verification failed');

    const purchase = await this.db.insert(purchaseTransactions).values({
      saleId: validated.saleId,
      userId: validated.userId,
      walletAddress: validated.walletAddress,
      tokenAmount: validated.tokenAmount,
      paymentAmount: validated.tokenAmount * sale.pricePerToken,
      paymentToken: validated.paymentToken,
      paymentTxSignature: validated.paymentTxSignature,
      status: 'confirmed',
    }).returning();

    // Create vesting schedule for purchased tokens
    if (sale.vestingParams) {
      await this.vestingService.createSchedule({
        saleId: sale.id,
        userId: validated.userId,
        totalAmount: validated.tokenAmount,
        tgeUnlock: sale.vestingParams.tgeUnlock, // % released at TGE
        cliffDays: sale.vestingParams.cliffDays,
        vestingDays: sale.vestingParams.vestingDays,
        walletAddress: validated.walletAddress,
      });
    }

    // Update sale progress
    await this.db.update(tokenSales)
      .set({
        soldAmount: sql`${tokenSales.soldAmount} + ${validated.tokenAmount}`,
      })
      .where(eq(tokenSales.id, sale.id));

    return purchase[0];
  }
}

// Whitelist service — Merkle proof management
export class WhitelistService {
  async uploadWhitelist(input: UploadWhitelistInput): Promise<WhitelistSnapshot> {
    const validated = uploadWhitelistSchema.parse(input);

    // Store raw entries
    for (const entry of validated.entries) {
      await this.db.insert(whitelistEntries).values({
        saleId: validated.saleId,
        userId: entry.userId,
        walletAddress: entry.walletAddress,
        tier: entry.tier,
        maxAllocation: entry.maxAllocation,
      });
    }

    // Build Merkle tree
    const leaves = validated.entries.map(e =>
      keccak256(
        solidityPack(
          ['address', 'uint256'],
          [e.walletAddress, e.maxAllocation],
        )
      )
    );
    const tree = new MerkleTree(leaves, keccak256, { sortPairs: true });
    const root = tree.getHexRoot();

    // Store snapshot
    const snapshot = await this.db.insert(whitelistSnapshots).values({
      saleId: validated.saleId,
      merkleRoot: root,
      entryCount: validated.entries.length,
      treeData: tree.toString(), // serialized for proof generation
    }).returning();

    return snapshot[0];
  }

  async verify(saleId: string, userId: string, proof: string[]): Promise<boolean> {
    const entry = await this.getEntry(saleId, userId);
    if (!entry) return false;

    const snapshot = await this.getLatestSnapshot(saleId);
    const tree = MerkleTree.unmarshal(snapshot.treeData);

    const leaf = keccak256(
      solidityPack(
        ['address', 'uint256'],
        [entry.walletAddress, entry.maxAllocation],
      )
    );

    return tree.verify(proof, leaf, snapshot.merkleRoot);
  }

  async getProof(saleId: string, userId: string): Promise<MerkleProof> {
    const entry = await this.getEntry(saleId, userId);
    if (!entry) throw new NotFoundError('Not on whitelist');

    const snapshot = await this.getLatestSnapshot(saleId);
    const tree = MerkleTree.unmarshal(snapshot.treeData);

    const leaf = keccak256(
      solidityPack(
        ['address', 'uint256'],
        [entry.walletAddress, entry.maxAllocation],
      )
    );

    return {
      proof: tree.getHexProof(leaf),
      root: snapshot.merkleRoot,
      leaf: leaf.toString('hex'),
      maxAllocation: entry.maxAllocation,
    };
  }
}
```

**Tasks:**
- [ ] Implement `launchpadService.createSale()` with sale type configuration
- [ ] Implement `launchpadService.purchase()` with on-chain payment verification
- [ ] Implement `whitelistService` with Merkle tree generation and proof verification
- [ ] Build sale lifecycle management (upcoming → active → completed → settled)
- [ ] Implement user allocation tracking with per-user limits
- [ ] Build `SaleCard` component showing sale details and progress
- [ ] Build `SaleProgressBar` component with real-time sold/total
- [ ] Build `PurchaseForm` component with wallet connection and payment
- [ ] Build `WhitelistChecker` component for users to check eligibility
- [ ] Build `AllocationDetails` component showing purchase history and vesting
- [ ] Implement fair launch mechanism (price discovery via bonding curve)

### 2.4 — ACS Foundation (acs)

**Duration:** Weeks 7–8
**Services:** `acsService`, `contributionScoringService`, `leaderboardService`

```typescript
// ACS service — regime detection and controller management
export class ACSService {
  async evaluate(input?: EvaluateInput): Promise<EvaluationResult> {
    // Step 1: Fetch market metrics
    const metrics = await this.fetchMarketMetrics();

    // Step 2: Calculate health scores
    const health = this.calculateHealthScores(metrics);

    // Step 3: Determine regime
    const regime = this.determineRegime(health);

    // Step 4: Load current state
    const currentState = await this.getCurrentState();

    // Step 5: Check regime transition (with dampening)
    const shouldTransition = this.shouldTransition(currentState.regime, regime);

    if (shouldTransition) {
      // Step 6: Run controllers with new regime targets
      const controllers = await this.getControllers();
      const adjustments = this.computeAdjustments(controllers, regime, health);

      // Step 7: Apply adjustments
      await this.applyAdjustments(adjustments);

      // Step 8: Record state
      await this.db.insert(acsStates).values({
        regime,
        healthScores: health,
        marketMetrics: metrics,
        adjustments,
        triggeredBy: input?.triggeredBy ?? 'cron',
      });

      // Step 9: Audit log
      await this.db.insert(acsAuditLogs).values({
        action: 'regime_change',
        fromRegime: currentState.regime,
        toRegime: regime,
        reason: `Health score: ${health.overall}`,
      });

      await this.eventBus.emit('token-economy.acs.regime_changed', {
        from: currentState.regime,
        to: regime,
        health: health.overall,
      });
    }

    return { regime, health, metrics, transitioned: shouldTransition };
  }

  private determineRegime(health: HealthScores): AcsRegime {
    if (health.overall >= DEFAULT_REGIME_THRESHOLDS.mature) return 'mature';
    if (health.overall >= DEFAULT_REGIME_THRESHOLDS.growth) return 'growth';
    if (health.overall >= DEFAULT_REGIME_THRESHOLDS.launch) return 'launch';
    if (health.overall >= DEFAULT_REGIME_THRESHOLDS.contraction) return 'contraction';
    return 'emergency';
  }

  async getCurrentConversionRate(ventureId: string): Promise<ConversionRate> {
    const state = await this.getCurrentState();
    const controller = await this.getController('conversion_rate');

    return {
      pointsPerToken: controller.currentValue,
      regime: state.regime,
      lastUpdated: state.updatedAt,
    };
  }
}
```

**Tasks:**
- [ ] Implement `acsService.evaluate()` with 9-step evaluation pipeline
- [ ] Build market metrics fetcher (price, volume, market cap, staking ratio via CoinGecko/Pyth)
- [ ] Implement health score computation (liquidity, velocity, concentration, overall)
- [ ] Build regime detection (launch, growth, mature, contraction, emergency)
- [ ] Implement controller engine (emission rate, staking APY, burn rate, conversion rate)
- [ ] Build dampening logic (prevent rapid regime oscillation)
- [ ] Implement `contributionScoringService` for scoring user contributions
- [ ] Implement `leaderboardService` with Redis sorted sets for ranking
- [ ] Build `AcsRegimeBadge` component showing current regime
- [ ] Build `AcsControllerPanel` component for admin tuning
- [ ] Set up BullMQ cron job for periodic evaluation (every 15 minutes)

### Phase 2 Deliverables

| Deliverable | Status |
|------------|--------|
| On-chain token distribution with batched Solana transfers | ⬜ |
| Points-to-token conversion with ACS-governed rates | ⬜ |
| Vesting system with 3 schedule types and on-chain claims | ⬜ |
| Token launchpad with Merkle whitelists and purchase flow | ⬜ |
| ACS foundation with regime detection and controller engine | ⬜ |
| Contribution scoring and leaderboard system | ⬜ |
| React components: ConversionCalculator, VestingTimeline, SaleCard, PurchaseForm, LeaderboardTable | ⬜ |

---

## Phase 3 — Advanced (Weeks 9–12)

### Objective

Implement the full Solana EDGE token integration, cross-venture token economy, AI-powered reward optimization, advanced anti-sybil defences, and fair launch mechanisms.

### 3.1 — Solana EDGE Token Integration

**Duration:** Weeks 9–10

```typescript
// Full EDGE token integration with staking, governance, and LP rewards
export class EdgeTokenService {
  async getTokenMetrics(): Promise<EdgeTokenMetrics> {
    const [price, supply, staking, lp] = await Promise.all([
      this.priceOracle.getPrice(EDGE_TOKEN_MINT),
      this.web3Service.getTokenSupply(EDGE_TOKEN_MINT),
      this.web3Service.getStakingMetrics(),
      this.web3Service.getLPMetrics(),
    ]);

    return {
      price: price.usd,
      priceChange24h: price.change24h,
      marketCap: price.usd * supply.circulating,
      totalSupply: supply.total,
      circulatingSupply: supply.circulating,
      stakedAmount: staking.totalStaked,
      stakingApy: staking.currentApy,
      lpTvl: lp.totalValueLocked,
      holders: await this.web3Service.getHolderCount(EDGE_TOKEN_MINT),
    };
  }

  async processStakingRewards(): Promise<void> {
    const stakers = await this.web3Service.getActiveStakers();
    const currentApy = await this.acsService.getController('staking_apy');

    for (const staker of stakers) {
      const dailyReward = this.computeDailyStakingReward(
        staker.stakedAmount,
        currentApy.currentValue,
      );

      if (dailyReward > 0) {
        await this.rewardsService.accruePoints({
          ventureId: 'cross-venture',
          userId: staker.userId,
          source: 'staking',
          action: 'staking_reward',
          points: dailyReward,
          idempotencyKey: `staking:${staker.userId}:${format(new Date(), 'yyyy-MM-dd')}`,
          metadata: {
            stakedAmount: staker.stakedAmount,
            apy: currentApy.currentValue,
          },
        });
      }
    }
  }

  async processLPRewards(): Promise<void> {
    const lpProviders = await this.web3Service.getActiveLPProviders();
    const lpMultiplier = await this.acsService.getController('lp_reward_multiplier');

    for (const provider of lpProviders) {
      const dailyReward = this.computeDailyLPReward(
        provider.lpTokenAmount,
        provider.poolShare,
        lpMultiplier.currentValue,
      );

      if (dailyReward > 0) {
        await this.rewardsService.accruePoints({
          ventureId: 'cross-venture',
          userId: provider.userId,
          source: 'liquidity',
          action: 'lp_reward',
          points: dailyReward,
          idempotencyKey: `lp:${provider.userId}:${format(new Date(), 'yyyy-MM-dd')}`,
        });
      }
    }
  }
}
```

**Tasks:**
- [ ] Implement EDGE token metrics aggregation (price, supply, staking, LP)
- [ ] Build staking reward distribution pipeline (daily accrual via cron)
- [ ] Build LP reward distribution pipeline (daily accrual via cron)
- [ ] Implement governance vote reward tracking
- [ ] Build token burn mechanism integration (ACS-controlled burn rate)
- [ ] Implement token holder analytics (distribution, concentration, whale tracking)
- [ ] Build `TokenEconomyDashboard` component with comprehensive metrics
- [ ] Implement Pyth Network oracle integration for real-time pricing
- [ ] Add Solana transaction monitoring for claim/distribution verification
- [ ] Build wallet connection flow with Phantom/Solflare support

### 3.2 — Cross-Venture Token Economy

**Duration:** Weeks 10–11

```typescript
// Cross-venture reward rules
export class CrossVentureRewardService {
  async processAction(event: VentureActionEvent): Promise<void> {
    // Apply venture-specific multiplier
    const multiplier = VENTURE_REWARD_MULTIPLIERS[event.ventureId] ?? 1.0;
    const basePoints = this.getBasePoints(event.action);
    const adjustedPoints = Math.floor(basePoints * multiplier);

    // Check for cross-venture bonuses
    const crossVentureBonuses = await this.getCrossVentureBonuses(
      event.userId,
      event.ventureId,
    );

    // Multi-venture activity bonus: using 3+ ventures = 1.5x multiplier
    const ventureCount = await this.getActiveVentureCount(event.userId);
    const diversityBonus = ventureCount >= 3 ? 1.5 : ventureCount >= 2 ? 1.2 : 1.0;

    const totalPoints = Math.floor(adjustedPoints * diversityBonus);

    await this.rewardsService.accruePoints({
      ventureId: event.ventureId,
      userId: event.userId,
      source: 'venture_action',
      action: event.action,
      points: totalPoints,
      idempotencyKey: event.idempotencyKey,
      metadata: {
        basePoints,
        ventureMultiplier: multiplier,
        diversityBonus,
        ventureCount,
        originalEvent: event,
      },
    });

    // Apply any cross-venture bonus programs
    for (const bonus of crossVentureBonuses) {
      await this.rewardsService.accruePoints({
        ventureId: bonus.targetVentureId,
        userId: event.userId,
        source: 'cross_venture',
        action: `bonus:${bonus.programId}`,
        points: bonus.bonusPoints,
        idempotencyKey: `xv:${event.idempotencyKey}:${bonus.programId}`,
      });
    }
  }

  private async getActiveVentureCount(userId: string): Promise<number> {
    // Count ventures where user has been active in last 30 days
    const result = await this.db
      .selectDistinct({ ventureId: pointEntries.ventureId })
      .from(pointEntries)
      .where(and(
        eq(pointEntries.userId, userId),
        gte(pointEntries.createdAt, subDays(new Date(), 30)),
      ));
    return result.length;
  }
}
```

**Tasks:**
- [ ] Implement cross-venture action processing with venture multipliers
- [ ] Build multi-venture activity bonus (diversity reward)
- [ ] Implement cross-venture reward programs (earn in A, spend in B)
- [ ] Build unified economy dashboard (total points across ventures, conversion history)
- [ ] Implement cross-venture leaderboard (aggregate scores)
- [ ] Build venture reward multiplier configuration (admin-adjustable)
- [ ] Add ecosystem health metrics (active users, points velocity, conversion volume)
- [ ] Implement venture-to-venture referral reward tracking

### 3.3 — AI Reward Optimization

**Duration:** Weeks 10–11

```typescript
// AI-powered reward optimization
export class RewardOptimizer {
  async optimizeEarnRules(ventureId: string): Promise<OptimizationRecommendation[]> {
    // Analyze historical earning patterns
    const patterns = await this.analyzeEarningPatterns(ventureId);

    // Identify underperforming actions (low engagement)
    const underperforming = patterns.filter(p => p.engagementRate < 0.1);

    // Identify over-rewarded actions (high cost, low retention impact)
    const overRewarded = patterns.filter(p =>
      p.costPerRetainedUser > patterns.reduce((sum, pp) => sum + pp.costPerRetainedUser, 0) / patterns.length * 2
    );

    const recommendations: OptimizationRecommendation[] = [];

    for (const action of underperforming) {
      recommendations.push({
        action: action.name,
        currentPoints: action.pointsPerAction,
        suggestedPoints: Math.floor(action.pointsPerAction * 1.5),
        reasoning: `Low engagement (${(action.engagementRate * 100).toFixed(1)}%). Increasing reward may boost participation.`,
        expectedImpact: `+${Math.floor(action.engagementRate * 50)}% engagement`,
        confidence: 0.7,
      });
    }

    for (const action of overRewarded) {
      recommendations.push({
        action: action.name,
        currentPoints: action.pointsPerAction,
        suggestedPoints: Math.floor(action.pointsPerAction * 0.75),
        reasoning: `High cost per retained user ($${action.costPerRetainedUser.toFixed(2)}). Reducing reward maintains engagement while cutting costs.`,
        expectedImpact: `-${Math.floor(action.costPerRetainedUser * 0.25)}% cost, -5% engagement`,
        confidence: 0.6,
      });
    }

    return recommendations;
  }

  async predictChurnRisk(userId: string): Promise<ChurnPrediction> {
    const activity = await this.getUserActivityPattern(userId);
    const balanceHistory = await this.getBalanceHistory(userId);

    return {
      userId,
      churnProbability: this.computeChurnScore(activity, balanceHistory),
      riskFactors: this.identifyRiskFactors(activity),
      suggestedIntervention: this.suggestIntervention(activity, balanceHistory),
    };
  }
}
```

**Tasks:**
- [ ] Build earn rule optimization engine using historical engagement data
- [ ] Implement churn prediction model for reward program participants
- [ ] Build reward A/B testing framework (test different point amounts for same action)
- [ ] Implement dynamic reward adjustment based on budget utilization rate
- [ ] Build optimization recommendation dashboard for admins
- [ ] Add seasonal reward multiplier suggestions (holidays, events)
- [ ] Implement reward fatigue detection (diminishing returns on repeated actions)
- [ ] Build engagement correlation analysis (which rewards drive most engagement)

### 3.4 — Advanced Anti-Sybil

**Duration:** Weeks 11–12

**Tasks:**
- [ ] Implement graph-based sybil detection (analyze referral networks for suspicious patterns)
- [ ] Build device fingerprint clustering (identify multi-account operations from same device)
- [ ] Implement geo-impossibility detection (actions from impossible locations within timeframe)
- [ ] Build machine learning anomaly detection for point earning patterns
- [ ] Implement wallet clustering analysis (identify linked wallets via on-chain heuristics)
- [ ] Build progressive verification gates (higher rewards require higher verification)
- [ ] Implement automated account restriction on high-confidence sybil detection
- [ ] Add appeal workflow for false positive flags
- [ ] Build fraud analytics dashboard with network visualization
- [ ] Implement real-time fraud scoring with sub-second response time

### 3.5 — Score Decay & Leaderboards (acs)

**Duration:** Weeks 11–12
**Services:** `scoreDecayService`, `leaderboardService`

**Tasks:**
- [ ] Implement configurable score decay functions (half-life, linear, step)
- [ ] Build decay computation pipeline (daily batch via BullMQ)
- [ ] Implement leaderboard caching with Redis sorted sets
- [ ] Build venture-specific and cross-venture leaderboards
- [ ] Implement leaderboard periods (daily, weekly, monthly, all-time)
- [ ] Build `LeaderboardTable` component with real-time updates
- [ ] Build `ContributionScoreCard` component showing user's score breakdown
- [ ] Implement scoring transparency logs (explain why score changed)
- [ ] Add score snapshot system for historical trend analysis
- [ ] Build leaderboard reward distribution (top N users receive bonus)

### Phase 3 Deliverables

| Deliverable | Status |
|------------|--------|
| Full EDGE token integration with staking and LP rewards | ⬜ |
| Cross-venture token economy with diversity bonuses | ⬜ |
| AI reward optimization with earn rule recommendations | ⬜ |
| Advanced anti-sybil with graph-based detection | ⬜ |
| Score decay engine with configurable functions | ⬜ |
| Comprehensive leaderboard system with multiple periods | ⬜ |
| TokenEconomyDashboard with unified ecosystem view | ⬜ |

---

## Phase 4 — Polish & Hardening (Weeks 13–14)

### Objective

Financial accuracy validation, security audit, performance optimization, and production readiness for a high-value token economy system.

### 4.1 — Financial Accuracy & Reconciliation

**Tasks:**
- [ ] Implement daily balance reconciliation (sum of entries vs cached balance)
- [ ] Build distribution verification pipeline (confirm all Solana TXs finalized)
- [ ] Implement double-entry accounting validation (points earned = points spent + balance)
- [ ] Add automated discrepancy detection and alerting
- [ ] Build financial audit report generation (for compliance)
- [ ] Implement conversion rate verification (ACS rate matches actual distributions)
- [ ] Add point entry integrity check (verify no mutations on immutable records)
- [ ] Build transaction replay capability for disaster recovery

### 4.2 — Security Hardening

**Tasks:**
- [ ] Audit all RLS policies (especially INSERT-ONLY on point entries)
- [ ] Implement rate limiting on all public endpoints (accrual, conversion, claim, purchase)
- [ ] Add multi-sig verification for distribution batches above threshold
- [ ] Implement wallet verification for all on-chain operations
- [ ] Add Solana transaction simulation before submission (detect revert)
- [ ] Implement emergency pause capability (halt all distributions/conversions)
- [ ] Security audit of anti-abuse engine (check for bypass vectors)
- [ ] Add encryption at rest for wallet addresses and private keys
- [ ] Penetration testing focused on point manipulation and sybil attacks
- [ ] Implement admin action audit trail with immutable logging

### 4.3 — Performance Optimization

**Tasks:**
- [ ] Optimize point balance queries (Redis cache hit rate target: >95%)
- [ ] Benchmark accrual pipeline (target: 10,000 accruals/second)
- [ ] Optimize leaderboard computation (Redis sorted sets, incremental updates)
- [ ] Optimize ACS evaluation cycle (target: < 5 seconds per evaluation)
- [ ] Implement distribution batch parallelization (multiple Solana TXs concurrent)
- [ ] Add connection pooling for Solana RPC (handle rate limits)
- [ ] Optimize Merkle tree operations (pre-compute proofs, cache tree)
- [ ] Implement database partitioning for point_entries (by month)
- [ ] Add read replicas for analytics queries

### 4.4 — Documentation & Monitoring

**Tasks:**
- [ ] Write API documentation for all tRPC routes (rewards, ACS, launchpad)
- [ ] Document tokenomics parameters and ACS regime behaviour
- [ ] Write integration guide for ventures adding reward actions
- [ ] Document anti-abuse system with threshold explanations
- [ ] Add structured logging for all financial operations
- [ ] Implement Prometheus metrics (accrual rate, conversion volume, distribution latency)
- [ ] Configure alerts: balance discrepancy, distribution failure, anti-abuse spike, ACS regime change
- [ ] Build operational dashboard (economy health, active programs, distribution pipeline)
- [ ] Document disaster recovery procedures (balance reconstruction, TX replay)

---

## Testing Strategy

### Unit Tests

| Area | Target Coverage | Key Test Scenarios |
|------|---------------|--------------------|
| Point accrual pipeline | 98% | Idempotency, anti-abuse blocking, program rules, balance updates |
| Balance computation | 98% | Earn, spend, convert, Redis-DB sync, zero balance edge |
| Vesting calculation | 98% | Linear, cliff, cliff-then-linear, edge dates, full vest, partial claim |
| Anti-abuse engine | 95% | Rate limit hit/miss, velocity spikes, sybil scoring, false positives |
| ACS regime detection | 95% | All 5 regimes, transition dampening, controller adjustments |
| Conversion rate | 98% | Rate application, insufficient balance, min conversion, decimal precision |
| Merkle proof verification | 98% | Valid proof, invalid proof, non-member, tree reconstruction |
| Launchpad purchase | 95% | Whitelist check, allocation limits, payment verification, vesting creation |

### Integration Tests

```typescript
// Example: Full earn → convert → claim lifecycle
describe('Token Economy — Full Lifecycle', () => {
  it('should earn points, convert to EDGE, and claim on-chain', async () => {
    const userId = 'test-user-1';
    const ventureId = 'betedge';

    // Step 1: Earn points
    const entry = await rewardsService.accruePoints({
      ventureId,
      userId,
      source: 'venture_action',
      action: 'bet_placed',
      points: 500,
      idempotencyKey: `test:${Date.now()}`,
      metadata: { amount: 500 },
    });
    expect(entry.points).toBe(500);

    // Step 2: Check balance
    const balance = await rewardsService.getBalance(userId, ventureId);
    expect(balance).toBe(500);

    // Step 3: Convert to EDGE tokens
    const conversion = await conversionService.convertPoints({
      userId,
      ventureId,
      points: 500,
    });
    expect(conversion.tokensReceived).toBeGreaterThan(0);
    expect(conversion.pointsSpent).toBe(500);

    // Step 4: Verify balance decreased
    const newBalance = await rewardsService.getBalance(userId, ventureId);
    expect(newBalance).toBe(0);

    // Step 5: Verify distribution queued
    const jobs = await distributionQueue.getJobs(['waiting']);
    expect(jobs.some(j => j.data.conversionId === conversion.conversionId)).toBe(true);
  });

  it('should prevent double-accrual via idempotency', async () => {
    const idempotencyKey = `test:idempotent:${Date.now()}`;

    const first = await rewardsService.accruePoints({
      ventureId: 'betedge',
      userId: 'test-user-1',
      source: 'venture_action',
      action: 'bet_placed',
      points: 100,
      idempotencyKey,
    });

    const second = await rewardsService.accruePoints({
      ventureId: 'betedge',
      userId: 'test-user-1',
      source: 'venture_action',
      action: 'bet_placed',
      points: 100,
      idempotencyKey, // Same key
    });

    expect(first.id).toBe(second.id); // Returns existing entry
    const balance = await rewardsService.getBalance('test-user-1', 'betedge');
    expect(balance).toBe(100); // Not 200
  });

  it('should block sybil-suspected accounts', async () => {
    // Set up sybil indicators
    await setupSybilIndicators('suspicious-user');

    await expect(
      rewardsService.accruePoints({
        ventureId: 'betedge',
        userId: 'suspicious-user',
        source: 'venture_action',
        action: 'bet_placed',
        points: 100,
        idempotencyKey: `test:sybil:${Date.now()}`,
      })
    ).rejects.toThrow(FraudDetectedError);
  });
});
```

### End-to-End Tests

- [ ] Full earn-convert-claim lifecycle across venture action → points → EDGE tokens → wallet
- [ ] Launchpad: whitelist upload → Merkle proof → purchase → vesting → claim
- [ ] ACS cycle: market metrics → health calculation → regime change → controller adjustment → rate update
- [ ] Anti-abuse: normal user passes all checks, sybil user blocked, false positive appeal
- [ ] Cross-venture: action in BetEdge → points with diversity bonus → conversion at ACS rate
- [ ] Vesting: create schedule → cliff wait → partial claim → linear vest → full claim

### Load Tests

- [ ] Point accrual: 10,000 concurrent accruals/second sustained for 10 minutes
- [ ] Balance lookup: 50,000 concurrent lookups/second with >95% Redis hit rate
- [ ] Leaderboard query: 1,000 concurrent lookups against 1M-user leaderboard < 100ms
- [ ] Distribution batch: process 10,000 recipients in < 30 minutes
- [ ] ACS evaluation: complete full cycle in < 5 seconds

---

## Acceptance Criteria

### Phase 1 (Foundation)

- [ ] Point accrual is idempotent (same key = same result, no double-counting)
- [ ] Point ledger has no UPDATE or DELETE operations (verified by RLS policy)
- [ ] Balance equals sum of earned - spent - converted (reconciliation passes)
- [ ] Anti-abuse blocks rate-limit violations within 100ms
- [ ] Redis cache and PostgreSQL balance match within 1 point after reconciliation
- [ ] All inputs validated with Zod schemas
- [ ] Venture action events consumed from Redpanda and processed

### Phase 2 (Core)

- [ ] Token distribution batches complete with ≥99% success rate
- [ ] Points-to-EDGE conversion uses ACS-governed rate, verified on-chain
- [ ] Vesting computation is accurate for all 3 schedule types (verified against spreadsheet)
- [ ] Merkle proof verification matches on-chain contract verification
- [ ] Launchpad purchase flow verifies payment before recording allocation
- [ ] ACS regime detection matches expected regime for known market conditions

### Phase 3 (Advanced)

- [ ] Staking and LP rewards distributed daily with correct APY calculation
- [ ] Cross-venture diversity bonus applies correctly for multi-venture users
- [ ] AI optimization recommendations produce actionable insights with evidence
- [ ] Anti-sybil graph analysis detects planted test sybil accounts
- [ ] Score decay reduces inactive user scores by expected half-life
- [ ] Leaderboards update within 30 seconds of point accrual

### Phase 4 (Polish)

- [ ] Daily reconciliation runs with zero discrepancies for 7 consecutive days
- [ ] No P0 security issues in penetration test
- [ ] Accrual pipeline sustains 10K/s under load test
- [ ] Emergency pause halts all operations within 10 seconds
- [ ] API documentation covers 100% of public endpoints

---

## Risk Matrix

| Risk | Probability | Impact | Mitigation |
|------|------------|--------|------------|
| **Point balance desync (Redis ↔ DB)** | Medium | Critical | Write-through caching, daily reconciliation, automatic correction, alerting on drift |
| **Solana RPC rate limits / downtime** | High | High | Multiple RPC providers (Helius + Quicknode), fallback queue, retry with backoff |
| **Sybil attacks on point system** | High | Critical | 5-layer anti-abuse engine, progressive verification, graph analysis, human review |
| **Token price manipulation** | Medium | High | ACS dampening prevents rapid regime changes, circuit breaker on extreme price moves |
| **Double-spend on point conversion** | Low | Critical | Atomic transactions, idempotency keys, balance check + deduct in same TX |
| **Smart contract vulnerability** | Low | Critical | Third-party audit before mainnet, bug bounty program, upgradeable proxy pattern |
| **ACS regime oscillation** | Medium | Medium | Dampening coefficient, cooldown period between transitions, manual override capability |
| **Wallet key compromise** | Low | Critical | Multi-sig authority, key rotation schedule, hardware security modules, emergency pause |
| **Regulatory compliance (securities)** | Medium | Critical | Legal review of token mechanics, SAFT framework, jurisdiction analysis, utility token design |
| **Data volume scaling (point entries)** | High | Medium | Table partitioning by month, archival of old data to cold storage, read replicas for analytics |
| **Cross-venture data consistency** | Medium | Medium | Event sourcing with Redpanda, eventual consistency guarantees, reconciliation pipeline |
| **Fair launch front-running** | Medium | High | Commit-reveal scheme, anti-bot measures, random allocation in oversubscribed tiers |

---

## Timeline & Milestones

```
Week  1  ┃  2  ┃  3  ┃  4  ┃  5  ┃  6  ┃  7  ┃  8  ┃  9  ┃  10 ┃  11 ┃  12 ┃  13 ┃  14
━━━━━━━━━╋━━━━━╋━━━━━╋━━━━━╋━━━━━╋━━━━━╋━━━━━╋━━━━━╋━━━━━╋━━━━━╋━━━━━╋━━━━━╋━━━━━╋━━━━━
DB Schema ██                                                                              
Accrual   ██████████                                                                       
Programs  ░░░░░██████████                                                                  
Anti-Abuse░░░░░░░░░░██████████                                                             
Balances  ░░░░░░░░░░░░░░░█████                                                             
Distribn  ░░░░░░░░░░░░░░░░░░░░██████████                                                  
Vesting   ░░░░░░░░░░░░░░░░░░░░░░░░░██████████                                             
Launchpad ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░██████████                                       
ACS Found ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░██████████                                       
EDGE Tokn ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░██████████                              
X-Venture ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░██████████                        
AI Optim. ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░██████████                        
Anti-Sybil░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░██████████                   
Decay/Lead░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░██████████                   
Polish    ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░██████████         
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          ▲           ▲                     ▲                     ▲              ▲
          M1          M2                    M3                    M4             M5

M1 (Week 1):  Schema complete, migrations applied, RLS enforced
M2 (Week 4):  Phase 1 complete — Points, programs, anti-abuse, balances operational
M3 (Week 8):  Phase 2 complete — Distribution, vesting, launchpad, ACS foundation
M4 (Week 12): Phase 3 complete — EDGE integration, cross-venture, AI, anti-sybil
M5 (Week 14): Phase 4 complete — Reconciliation passing, security audited, production ready
```

### Key Milestones

| Milestone | Date | Criteria |
|-----------|------|----------|
| **M1 — Schema Ready** | Week 1 | All Drizzle schemas defined, migrations passing, INSERT-ONLY RLS on point_entries |
| **M2 — Points Economy Live** | Week 4 | Point accrual, programs, anti-abuse, and balance tracking operational for all ventures |
| **M3 — On-Chain Bridge** | Week 8 | Token distribution, conversion, vesting, launchpad, and ACS foundation operational |
| **M4 — Full Economy** | Week 12 | EDGE integration, cross-venture economy, AI optimization, advanced anti-sybil |
| **M5 — Production Ready** | Week 14 | Reconciliation passing, security audited, performance validated, documentation complete |

### Dependencies Between Phases

```
Phase 1 (Foundation)
  ├── point accrual → Required by ALL subsequent phases
  ├── anti-abuse → Required before any production traffic
  └── balance tracking → Required by Phase 2 conversion

Phase 2 (Core)
  ├── distribution engine → Required by Phase 3 staking/LP rewards
  ├── ACS foundation → Required by Phase 2 conversion rates
  ├── vesting → Required by launchpad purchase flow
  └── launchpad → Requires whitelist + vesting + distribution

Phase 3 (Advanced)
  ├── EDGE integration → Requires distribution + ACS from Phase 2
  ├── cross-venture → Requires accrual + programs from Phase 1
  └── AI optimization → Requires historical data from Phase 1 & 2

Phase 4 (Polish)
  └── Reconciliation → Requires all data pipelines from Phases 1-3
```

### Critical Path

The critical path runs through: **Schema → Accrual → Balance → Distribution → ACS → EDGE Integration → Reconciliation**. Any delay in the point accrual system cascades to all downstream components since every part of the economy depends on the point ledger.

---

*@mcv/token-economy — Token Economy Domain*
