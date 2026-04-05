# @mcv/engagement/points

> Point-based engagement engine for the MCV.ONE platform — earning, spending, balance tracking, expiration, transfers, and full point economy management.

**Package:** `@mcv/engagement/points`
**Layer:** Tier 5 — Domain Module
**Parent:** `@mcv/engagement`
**Since:** 0.1.0
**Status:** Stable
**Maintainers:** MCV Platform Team

---

## Table of Contents

- [Purpose](#purpose)
- [Exports](#exports)
- [Architecture](#architecture)
  - [Point Ledger Flow](#point-ledger-flow)
  - [Earning Pipeline](#earning-pipeline)
  - [Redemption Pipeline](#redemption-pipeline)
  - [Expiration Pipeline](#expiration-pipeline)
  - [Transfer Pipeline](#transfer-pipeline)
- [Core Interfaces](#core-interfaces)
  - [PointService](#pointservice)
  - [PointBalance](#pointbalance)
  - [PointTransaction](#pointtransaction)
  - [PointType](#pointtype)
  - [EarningRule](#earningrule)
  - [RedemptionRule](#redemptionrule)
  - [ExpirationPolicy](#expirationpolicy)
  - [PointTransfer](#pointtransfer)
  - [PointTier](#pointtier)
  - [PointHold](#pointhold)
  - [EarningCap](#earningcap)
  - [PointAnalytics](#pointanalytics)
  - [PointExchangeRate](#pointexchangerate)
  - [PointEvent](#pointevent)
- [Database Schemas](#database-schemas)
  - [point_types](#point_types)
  - [point_balances](#point_balances)
  - [point_transactions](#point_transactions)
  - [earning_rules](#earning_rules)
  - [redemption_rules](#redemption_rules)
  - [expiration_policies](#expiration_policies)
  - [point_transfers](#point_transfers)
  - [point_tiers](#point_tiers)
  - [point_holds](#point_holds)
  - [earning_caps](#earning_caps)
- [Code Examples](#code-examples)
  - [1. Configure Point Types for a Venture](#1-configure-point-types-for-a-venture)
  - [2. Award Points on Purchase](#2-award-points-on-purchase)
  - [3. Redeem Points for a Discount](#3-redeem-points-for-a-discount)
  - [4. Point Expiration Processing](#4-point-expiration-processing)
  - [5. Transfer Points Between Users](#5-transfer-points-between-users)
  - [6. Tier-Based Multiplier Earning](#6-tier-based-multiplier-earning)
  - [7. Anti-Fraud Velocity Check](#7-anti-fraud-velocity-check)
  - [8. Point Economy Analytics Dashboard](#8-point-economy-analytics-dashboard)
- [Error Codes](#error-codes)
- [Security](#security)
  - [Row-Level Security (RLS)](#row-level-security-rls)
  - [Double-Entry Integrity](#double-entry-integrity)
  - [Anti-Fraud Protections](#anti-fraud-protections)
  - [Rate Limiting](#rate-limiting)
  - [Audit Trail](#audit-trail)
- [Environment Variables](#environment-variables)
- [Dependencies](#dependencies)
- [Testing](#testing)
  - [Unit Tests](#unit-tests)
  - [Integration Tests](#integration-tests)
  - [Load Tests](#load-tests)
  - [Test Fixtures](#test-fixtures)

---

## Purpose

`@mcv/engagement/points` provides a complete point economy engine for MCV.ONE ventures. Points are the universal engagement currency — they reward user behavior, drive retention, gate access to premium features, and create a tangible value loop between the platform and its participants.

### What This Module Does

1. **Manages multiple point currencies** — Each venture can define its own point types (XP, loyalty points, karma, credits, gems, etc.) with independent rules, valuation, and expiration policies.

2. **Processes point earnings** — Listens to platform events (purchases, reviews, referrals, logins, content creation) and applies configurable earning rules with tier-based multipliers, promotional bonuses, and combo mechanics.

3. **Handles point redemption** — Converts points into tangible value: discounts, rewards, feature unlocks, or marketplace credits. Supports partial redemption, minimum balance gates, and approval workflows.

4. **Maintains a double-entry ledger** — Every point movement is recorded as a balanced transaction. Credits always equal debits. The ledger is immutable and auditable.

5. **Enforces expiration policies** — Points expire on configurable schedules (FIFO). The system sends warnings before expiration, supports grace periods, and handles forfeiture cleanly.

6. **Supports transfers and gifting** — Users can send points to other users, pool points in family/group accounts, and gift points with configurable limits and approval requirements.

7. **Prevents fraud** — Velocity limits, daily/weekly/monthly earning caps, suspicious activity detection, and manual review triggers protect the point economy from abuse.

8. **Provides analytics** — Real-time dashboards for points issued, redeemed, expired, outstanding liability, earn/burn ratios, and overall point economy health.

### Why Not Just Use a Simple Counter?

A naive `points += 10` approach breaks down immediately at scale:

- **No audit trail** — You can't explain why a balance changed
- **No atomicity** — Concurrent updates corrupt balances
- **No expiration** — Points accumulate as unbounded liability
- **No fraud protection** — Bots farm infinite points
- **No multi-currency** — One-size-fits-all kills engagement design
- **No compliance** — Point economies have real monetary value and regulatory implications

This module solves all of these with a battle-tested ledger architecture inspired by financial accounting systems, adapted for the engagement domain.

### Design Principles

| Principle | Implementation |
|---|---|
| **Ledger-first** | Every balance is derived from the transaction log. No separate "balance" mutations. |
| **Idempotent** | Every earning/spending operation carries an idempotency key. Replay-safe. |
| **Multi-tenant** | All data is scoped by `venture_id` with PostgreSQL RLS enforcement. |
| **Event-driven** | Point mutations emit events to Redpanda for downstream consumption. |
| **Eventually consistent** | Balances are cached but authoritative state lives in the ledger. |
| **Fraud-aware** | Every transaction passes through velocity checks and cap enforcement before commit. |

---

## Exports

```typescript
// === Core Service ===
export { PointService }              from './services/point.service';
export { PointServiceFactory }       from './services/point.service.factory';

// === Sub-Services ===
export { EarningService }            from './services/earning.service';
export { RedemptionService }         from './services/redemption.service';
export { ExpirationService }         from './services/expiration.service';
export { TransferService }           from './services/transfer.service';
export { BalanceService }            from './services/balance.service';
export { HoldService }               from './services/hold.service';
export { AnalyticsService }          from './services/analytics.service';
export { FraudService }              from './services/fraud.service';
export { ExchangeService }           from './services/exchange.service';
export { TierService }               from './services/tier.service';

// === tRPC Router ===
export { pointsRouter }             from './router';
export type { PointsRouter }         from './router';

// === Interfaces / Types ===
export type { PointBalance }         from './interfaces/point-balance';
export type { PointTransaction }     from './interfaces/point-transaction';
export type { PointType }            from './interfaces/point-type';
export type { PointTypeConfig }      from './interfaces/point-type';
export type { EarningRule }          from './interfaces/earning-rule';
export type { EarningRuleConfig }    from './interfaces/earning-rule';
export type { RedemptionRule }       from './interfaces/redemption-rule';
export type { RedemptionRuleConfig } from './interfaces/redemption-rule';
export type { ExpirationPolicy }     from './interfaces/expiration-policy';
export type { PointTransfer }        from './interfaces/point-transfer';
export type { PointTier }            from './interfaces/point-tier';
export type { PointHold }            from './interfaces/point-hold';
export type { EarningCap }           from './interfaces/earning-cap';
export type { PointAnalytics }       from './interfaces/point-analytics';
export type { PointExchangeRate }    from './interfaces/point-exchange-rate';
export type { PointEvent }           from './interfaces/point-event';
export type { PointEarnResult }      from './interfaces/point-earn-result';
export type { PointRedeemResult }    from './interfaces/point-redeem-result';
export type { PointTransferResult }  from './interfaces/point-transfer-result';
export type { BalanceSnapshot }      from './interfaces/balance-snapshot';
export type { LedgerEntry }          from './interfaces/ledger-entry';
export type { FraudCheckResult }     from './interfaces/fraud-check-result';
export type { EconomyHealthMetrics } from './interfaces/economy-health-metrics';

// === Enums ===
export { TransactionType }           from './enums/transaction-type';
export { TransactionStatus }         from './enums/transaction-status';
export { HoldStatus }                from './enums/hold-status';
export { TransferStatus }            from './enums/transfer-status';
export { EarningEventType }          from './enums/earning-event-type';
export { RedemptionType }            from './enums/redemption-type';
export { ExpirationStrategy }        from './enums/expiration-strategy';
export { FraudVerdict }              from './enums/fraud-verdict';
export { CapPeriod }                 from './enums/cap-period';

// === Schemas (Drizzle) ===
export { pointTypes }               from './schema/point-types';
export { pointBalances }            from './schema/point-balances';
export { pointTransactions }        from './schema/point-transactions';
export { earningRules }             from './schema/earning-rules';
export { redemptionRules }          from './schema/redemption-rules';
export { expirationPolicies }       from './schema/expiration-policies';
export { pointTransfers }           from './schema/point-transfers';
export { pointTiers }               from './schema/point-tiers';
export { pointHolds }               from './schema/point-holds';
export { earningCaps }              from './schema/earning-caps';

// === Validators (Zod) ===
export { earnPointsSchema }         from './validators/earn-points';
export { redeemPointsSchema }       from './validators/redeem-points';
export { transferPointsSchema }     from './validators/transfer-points';
export { createPointTypeSchema }    from './validators/create-point-type';
export { createEarningRuleSchema }  from './validators/create-earning-rule';
export { createRedemptionRuleSchema } from './validators/create-redemption-rule';
export { createExpirationPolicySchema } from './validators/create-expiration-policy';

// === Events ===
export { PointEvents }              from './events/point-events';
export { PointEventProducer }       from './events/point-event-producer';
export { PointEventConsumer }       from './events/point-event-consumer';

// === Constants ===
export {
  DEFAULT_POINT_PRECISION,
  MAX_TRANSFER_AMOUNT,
  MAX_HOLD_DURATION_MS,
  BALANCE_CACHE_TTL_MS,
  EXPIRATION_BATCH_SIZE,
  FRAUD_WINDOW_MS,
}                                    from './constants';

// === Utilities ===
export { calculateMultiplier }       from './utils/multiplier';
export { resolveEarningAmount }      from './utils/earning-resolver';
export { formatPointAmount }         from './utils/format';
export { validateIdempotencyKey }    from './utils/idempotency';
```

---

## Architecture

### High-Level Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                         Platform Events                             │
│   (purchase, review, referral, login, content_create, custom)       │
└──────────────────────────────┬──────────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────────┐
│                        Earning Pipeline                             │
│  ┌──────────┐  ┌──────────┐  ┌───────────┐  ┌──────────────────┐   │
│  │  Event    │→ │ Rule     │→ │ Fraud     │→ │ Multiplier       │   │
│  │  Router   │  │ Matcher  │  │ Check     │  │ Resolver         │   │
│  └──────────┘  └──────────┘  └───────────┘  └────────┬─────────┘   │
│                                                       │             │
│                                              ┌────────▼─────────┐   │
│                                              │ Cap Enforcer     │   │
│                                              └────────┬─────────┘   │
└───────────────────────────────────────────────────────┼─────────────┘
                                                        │
                                                        ▼
┌─────────────────────────────────────────────────────────────────────┐
│                         Point Ledger                                │
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────┐    │
│  │                   point_transactions                        │    │
│  │  ┌──────────┬──────────┬────────┬───────┬────────────────┐  │    │
│  │  │ tx_id    │ user_id  │ type   │amount │ balance_after   │  │    │
│  │  ├──────────┼──────────┼────────┼───────┼────────────────┤  │    │
│  │  │ tx_001   │ usr_abc  │ CREDIT │ +150  │ 1,150          │  │    │
│  │  │ tx_002   │ usr_abc  │ DEBIT  │ -200  │ 950            │  │    │
│  │  │ tx_003   │ sys_pool │ CREDIT │ +200  │ (system pool)  │  │    │
│  │  │ tx_004   │ usr_abc  │ EXPIRE │ -50   │ 900            │  │    │
│  │  └──────────┴──────────┴────────┴───────┴────────────────┘  │    │
│  └─────────────────────────────────────────────────────────────┘    │
│                               │                                     │
│                      ┌────────▼─────────┐                           │
│                      │ Balance Cache    │                           │
│                      │ (point_balances) │                           │
│                      └──────────────────┘                           │
└─────────────────────────────────────────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────────┐
│                       Redpanda Events                               │
│  points.earned │ points.redeemed │ points.expired │ points.transfer │
└─────────────────────────────────────────────────────────────────────┘
```

### Point Ledger Flow

The ledger is the single source of truth. All balances are derivable from the transaction log. The `point_balances` table is a materialized cache that is updated transactionally alongside each ledger entry.

#### Double-Entry Accounting

Every point movement involves two entries:

| Operation | User Entry | System Entry |
|---|---|---|
| **Earn** | CREDIT +N to user | DEBIT -N from issuance pool |
| **Redeem** | DEBIT -N from user | CREDIT +N to redemption pool |
| **Expire** | DEBIT -N from user | CREDIT +N to expiration pool |
| **Transfer** | DEBIT -N from sender, CREDIT +N to recipient | — |
| **Hold** | HOLD -N from available | — (reversed or converted) |
| **Void** | Reverse of original | Reverse of original |

This ensures the total points in the system always balance. The issuance pool tracks total points created; the redemption and expiration pools track points removed from circulation.

#### Transaction Lifecycle

```
PENDING → PROCESSING → COMMITTED → (VOIDED)
                    ↘ FAILED
                    ↘ HELD → COMMITTED
                           ↘ RELEASED
```

1. **PENDING** — Transaction created, awaiting fraud check
2. **PROCESSING** — Fraud check passed, acquiring balance lock
3. **COMMITTED** — Balance updated, event emitted
4. **FAILED** — Fraud check failed or insufficient balance
5. **HELD** — Points reserved but not yet committed (e.g., pending order)
6. **RELEASED** — Hold cancelled, points returned to available balance
7. **VOIDED** — Committed transaction reversed (admin action)

### Earning Pipeline

```
Platform Event
    │
    ▼
┌─────────────────────┐
│ 1. Event Router     │ Identifies event type, extracts context
│    - eventType      │ (purchase_complete, review_submitted, etc.)
│    - userId         │
│    - metadata       │
└────────┬────────────┘
         │
         ▼
┌─────────────────────┐
│ 2. Rule Matcher     │ Finds all active earning rules matching
│    - ventureId      │ this event type for this venture
│    - eventType      │ Returns: EarningRule[]
│    - conditions     │ (may be multiple rules per event)
└────────┬────────────┘
         │
         ▼
┌─────────────────────┐
│ 3. Fraud Check      │ Velocity limits, earning caps,
│    - velocity       │ suspicious pattern detection
│    - caps           │ Returns: FraudCheckResult
│    - patterns       │ (ALLOW / DENY / REVIEW)
└────────┬────────────┘
         │
         ▼ (if ALLOW)
┌─────────────────────┐
│ 4. Multiplier       │ Resolves effective multiplier:
│    Resolver         │ base × tier × promo × combo
│    - tierMultiplier │ Example: 10 × 1.5 × 2.0 × 1.2 = 36
│    - promoMultiplier│
│    - comboMultiplier│
└────────┬────────────┘
         │
         ▼
┌─────────────────────┐
│ 5. Cap Enforcer     │ Ensures earning doesn't exceed
│    - dailyCap       │ configured caps for this period
│    - weeklyCap      │ May reduce amount to fit under cap
│    - monthlyCap     │
└────────┬────────────┘
         │
         ▼
┌─────────────────────┐
│ 6. Ledger Commit    │ Writes transaction, updates balance,
│    - transaction    │ emits event to Redpanda
│    - balance update │
│    - event emit     │
└─────────────────────┘
```

### Redemption Pipeline

```
Redemption Request
    │
    ▼
┌─────────────────────┐
│ 1. Rule Validator   │ Validates redemption rule exists,
│    - ruleId         │ checks active status, min/max amounts
│    - amount         │
└────────┬────────────┘
         │
         ▼
┌─────────────────────┐
│ 2. Balance Check    │ Verifies sufficient available balance
│    - available      │ (total - held - pending_redemptions)
│    - minBalance     │ Enforces minimum balance requirement
└────────┬────────────┘
         │
         ▼
┌─────────────────────┐
│ 3. Conversion       │ Calculates value:
│    Calculator       │ points × conversion_rate = value
│    - conversionRate │ 100 pts × $0.01 = $1.00
│    - rounding       │
└────────┬────────────┘
         │
         ▼
┌─────────────────────┐
│ 4. Approval Check   │ Auto-approve if under threshold,
│    - autoApprove    │ else queue for manual review
│    - threshold      │ (configurable per venture)
└────────┬────────────┘
         │
         ▼ (if approved)
┌─────────────────────┐
│ 5. FIFO Deduction   │ Deducts from oldest point batches
│    - batchSelect    │ first (respects expiration order)
│    - deduct         │
└────────┬────────────┘
         │
         ▼
┌─────────────────────┐
│ 6. Ledger Commit    │ Writes debit transaction,
│    + Reward Trigger │ updates balance, triggers reward
│                     │ fulfillment (discount, item, etc.)
└─────────────────────┘
```

### Expiration Pipeline

The expiration pipeline runs as a scheduled job (configurable interval, default every hour) and processes expired point batches in configurable batch sizes.

```
Cron Trigger (hourly)
    │
    ▼
┌──────────────────────┐
│ 1. Scan Expiring     │ SELECT batches WHERE
│    Batches           │ expires_at <= NOW()
│    - batchSize: 1000 │ AND status = 'active'
│    - cursor-based    │ ORDER BY expires_at ASC
└────────┬─────────────┘
         │
         ▼
┌──────────────────────┐
│ 2. Grace Period      │ Check if grace period applies.
│    Check             │ If yes, send warning and skip.
│    - warningsSent    │ If warning already sent and
│    - graceExpiry     │ grace expired, proceed.
└────────┬─────────────┘
         │
         ▼
┌──────────────────────┐
│ 3. Forfeiture        │ Create EXPIRE debit transaction
│    Processing        │ for remaining batch balance.
│    - debitUser       │ Credit expiration pool.
│    - creditPool      │ Emit points.expired event.
└────────┬─────────────┘
         │
         ▼
┌──────────────────────┐
│ 4. Balance Update    │ Recalculate user balance.
│    + Notification    │ Send expiration notification.
│                      │
└──────────────────────┘
```

### Transfer Pipeline

```
Transfer Request
    │
    ▼
┌──────────────────────┐
│ 1. Eligibility       │ Both users exist, same venture
│    Check             │ (or cross-venture exchange enabled),
│    - sender exists   │ transfer enabled for point type,
│    - recipient exists│ sender not blocked
└────────┬─────────────┘
         │
         ▼
┌──────────────────────┐
│ 2. Limit Check       │ Per-transfer max, daily transfer
│    - perTransfer     │ limit, monthly transfer limit,
│    - dailyLimit      │ minimum transfer amount
│    - monthlyLimit    │
└────────┬─────────────┘
         │
         ▼
┌──────────────────────┐
│ 3. Balance Check     │ Sender has sufficient available
│    + Hold            │ balance. Place hold on sender's
│    - available >= amt│ balance for transfer amount.
└────────┬─────────────┘
         │
         ▼
┌──────────────────────┐
│ 4. Exchange Rate     │ If cross-venture or cross-type,
│    (if applicable)   │ apply exchange rate conversion.
│    - rate lookup     │ 100 XP → 75 loyalty_points
│    - conversion      │
└────────┬─────────────┘
         │
         ▼
┌──────────────────────┐
│ 5. Ledger Commit     │ DEBIT sender, CREDIT recipient
│    (atomic)          │ in single transaction.
│    - debit sender    │ Release hold. Emit event.
│    - credit recipient│
│    - release hold    │
└──────────────────────┘
```

---

## Core Interfaces

### PointService

The main entry point for all point operations. Orchestrates sub-services and provides a unified API.

```typescript
interface PointService {
  // === Point Type Management ===

  /**
   * Create a new point type for a venture.
   * Each venture can have multiple point types (e.g., XP, loyalty, credits).
   */
  createPointType(params: CreatePointTypeParams): Promise<PointType>;

  /**
   * Update an existing point type's configuration.
   * Cannot change the slug after creation. Changes to precision
   * require a migration.
   */
  updatePointType(
    pointTypeId: string,
    params: UpdatePointTypeParams,
  ): Promise<PointType>;

  /**
   * List all point types for a venture.
   */
  listPointTypes(ventureId: string): Promise<PointType[]>;

  /**
   * Get a single point type by ID or slug.
   */
  getPointType(
    ventureId: string,
    idOrSlug: string,
  ): Promise<PointType | null>;

  /**
   * Soft-delete a point type. Existing balances are preserved
   * but no new transactions can be created.
   */
  archivePointType(pointTypeId: string): Promise<void>;

  // === Balance Operations ===

  /**
   * Get the current balance for a user and point type.
   * Returns cached balance with available, held, and total amounts.
   */
  getBalance(
    userId: string,
    pointTypeId: string,
  ): Promise<PointBalance>;

  /**
   * Get all balances for a user across all point types in a venture.
   */
  getBalances(
    userId: string,
    ventureId: string,
  ): Promise<PointBalance[]>;

  /**
   * Get a full balance snapshot including expiring batches,
   * pending holds, and projected expiration timeline.
   */
  getBalanceSnapshot(
    userId: string,
    pointTypeId: string,
  ): Promise<BalanceSnapshot>;

  /**
   * Recalculate a user's balance from the transaction ledger.
   * Used for reconciliation and integrity checks.
   */
  reconcileBalance(
    userId: string,
    pointTypeId: string,
  ): Promise<PointBalance>;

  // === Earning ===

  /**
   * Award points to a user based on an earning rule.
   * The amount is calculated from the rule configuration
   * and active multipliers.
   *
   * @param idempotencyKey - Unique key to prevent duplicate awards
   */
  earn(params: EarnPointsParams): Promise<PointEarnResult>;

  /**
   * Award points directly without matching a rule.
   * Used for manual adjustments, promotions, and compensations.
   * Requires elevated permissions.
   */
  creditManual(params: ManualCreditParams): Promise<PointEarnResult>;

  /**
   * Process a batch of earning events (e.g., from event replay).
   */
  earnBatch(params: EarnPointsParams[]): Promise<PointEarnResult[]>;

  // === Redemption ===

  /**
   * Redeem points according to a redemption rule.
   * Validates balance, applies FIFO deduction, and triggers
   * the reward fulfillment.
   */
  redeem(params: RedeemPointsParams): Promise<PointRedeemResult>;

  /**
   * Preview a redemption without committing.
   * Returns the conversion value, points that would be deducted,
   * and which batches would be affected.
   */
  previewRedemption(
    params: RedeemPointsParams,
  ): Promise<RedemptionPreview>;

  /**
   * Debit points directly without a redemption rule.
   * Used for manual adjustments and corrections.
   * Requires elevated permissions.
   */
  debitManual(params: ManualDebitParams): Promise<PointRedeemResult>;

  // === Holds ===

  /**
   * Place a hold on points (reserve without spending).
   * Used for pending orders, auctions, etc.
   */
  placeHold(params: PlaceHoldParams): Promise<PointHold>;

  /**
   * Convert a hold into a committed debit transaction.
   */
  commitHold(holdId: string): Promise<PointRedeemResult>;

  /**
   * Release a hold, returning points to available balance.
   */
  releaseHold(holdId: string): Promise<void>;

  /**
   * List active holds for a user.
   */
  listHolds(
    userId: string,
    pointTypeId: string,
  ): Promise<PointHold[]>;

  // === Transfers ===

  /**
   * Transfer points from one user to another.
   * Supports same-type and cross-type transfers (with exchange rate).
   */
  transfer(params: TransferPointsParams): Promise<PointTransferResult>;

  /**
   * Preview a transfer to show exchange rate and fees.
   */
  previewTransfer(
    params: TransferPointsParams,
  ): Promise<TransferPreview>;

  // === Expiration ===

  /**
   * Process expired point batches. Typically called by a cron job.
   */
  processExpirations(ventureId: string): Promise<ExpirationResult>;

  /**
   * Get expiration forecast for a user — when and how many
   * points will expire in the next N days.
   */
  getExpirationForecast(
    userId: string,
    pointTypeId: string,
    days: number,
  ): Promise<ExpirationForecast>;

  /**
   * Send expiration warning notifications for points
   * expiring within the configured warning window.
   */
  sendExpirationWarnings(ventureId: string): Promise<number>;

  // === Transaction History ===

  /**
   * List transactions for a user with pagination and filtering.
   */
  listTransactions(
    userId: string,
    pointTypeId: string,
    params: ListTransactionsParams,
  ): Promise<PaginatedResult<PointTransaction>>;

  /**
   * Get a single transaction by ID.
   */
  getTransaction(transactionId: string): Promise<PointTransaction | null>;

  /**
   * Void a committed transaction (admin only).
   * Creates a reversal transaction.
   */
  voidTransaction(
    transactionId: string,
    reason: string,
  ): Promise<PointTransaction>;

  // === Analytics ===

  /**
   * Get point economy analytics for a venture.
   */
  getAnalytics(
    ventureId: string,
    params: AnalyticsParams,
  ): Promise<PointAnalytics>;

  /**
   * Get economy health metrics (earn/burn ratio, liability, velocity).
   */
  getEconomyHealth(ventureId: string): Promise<EconomyHealthMetrics>;
}
```

### PointBalance

Represents the current point balance for a user and point type.

```typescript
interface PointBalance {
  /** Unique balance record ID */
  id: string;

  /** User who owns this balance */
  userId: string;

  /** Point type this balance is for */
  pointTypeId: string;

  /** Venture scope */
  ventureId: string;

  /** Total points in the account (available + held) */
  total: number;

  /** Points available for spending/transfer */
  available: number;

  /** Points currently held (reserved) */
  held: number;

  /** Points pending (not yet committed) */
  pending: number;

  /** Lifetime total points earned */
  lifetimeEarned: number;

  /** Lifetime total points redeemed */
  lifetimeRedeemed: number;

  /** Lifetime total points expired */
  lifetimeExpired: number;

  /** Lifetime total points transferred out */
  lifetimeTransferredOut: number;

  /** Lifetime total points transferred in */
  lifetimeTransferredIn: number;

  /** Timestamp of last transaction affecting this balance */
  lastTransactionAt: Date | null;

  /** Nearest upcoming expiration date and amount */
  nextExpiration: {
    date: Date;
    amount: number;
  } | null;

  /** Balance last reconciled at */
  reconciledAt: Date;

  /** Record timestamps */
  createdAt: Date;
  updatedAt: Date;
}
```

### PointTransaction

Represents a single entry in the point ledger.

```typescript
interface PointTransaction {
  /** Unique transaction ID (ULID for time-ordered sorting) */
  id: string;

  /** Venture scope */
  ventureId: string;

  /** User this transaction belongs to */
  userId: string;

  /** Point type */
  pointTypeId: string;

  /** Transaction type */
  type: TransactionType;

  /** Transaction status */
  status: TransactionStatus;

  /**
   * Signed amount.
   * Positive = credit (points added).
   * Negative = debit (points removed).
   */
  amount: number;

  /** Running balance after this transaction */
  balanceAfter: number;

  /** Idempotency key to prevent duplicates */
  idempotencyKey: string;

  /** Reference to the earning/redemption rule that triggered this */
  ruleId: string | null;

  /** Reference to a related transaction (e.g., void references original) */
  relatedTransactionId: string | null;

  /** Reference to the hold (if this transaction resolved a hold) */
  holdId: string | null;

  /** Reference to the transfer record */
  transferId: string | null;

  /** Batch ID for point expiration tracking (FIFO) */
  batchId: string | null;

  /** Expiration date for this batch of points */
  expiresAt: Date | null;

  /** Remaining balance in this batch (for partial redemptions) */
  batchRemaining: number | null;

  /** Human-readable description */
  description: string;

  /** Source event that triggered this transaction */
  sourceEvent: string | null;

  /** Arbitrary metadata (event context, order ID, etc.) */
  metadata: Record<string, unknown>;

  /** Multiplier applied (if earning transaction) */
  multiplierApplied: number | null;

  /** Base amount before multiplier */
  baseAmount: number | null;

  /** IP address of the request (for audit) */
  ipAddress: string | null;

  /** User agent of the request (for audit) */
  userAgent: string | null;

  /** Admin user who initiated (for manual transactions) */
  initiatedBy: string | null;

  /** Reason for voiding (if voided) */
  voidReason: string | null;

  /** Record timestamps */
  createdAt: Date;
  updatedAt: Date;
}

enum TransactionType {
  /** Points credited to user */
  CREDIT = 'CREDIT',
  /** Points debited from user */
  DEBIT = 'DEBIT',
  /** Points expired */
  EXPIRE = 'EXPIRE',
  /** Points held (reserved) */
  HOLD = 'HOLD',
  /** Hold released */
  RELEASE = 'RELEASE',
  /** Transaction voided (reversal) */
  VOID = 'VOID',
  /** System adjustment */
  ADJUSTMENT = 'ADJUSTMENT',
}

enum TransactionStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  COMMITTED = 'COMMITTED',
  FAILED = 'FAILED',
  VOIDED = 'VOIDED',
}
```

### PointType

Defines a point currency within a venture.

```typescript
interface PointType {
  /** Unique point type ID */
  id: string;

  /** Venture this point type belongs to */
  ventureId: string;

  /** URL-safe slug (e.g., 'xp', 'loyalty-points', 'karma') */
  slug: string;

  /** Display name (e.g., 'Experience Points') */
  name: string;

  /** Short description */
  description: string;

  /** Display symbol or icon identifier (e.g., '⭐', 'XP', '💎') */
  symbol: string;

  /** Decimal precision (0 = whole numbers only, 2 = cents) */
  precision: number;

  /** Configuration */
  config: PointTypeConfig;

  /** Whether this point type is currently active */
  isActive: boolean;

  /** Soft-delete timestamp */
  archivedAt: Date | null;

  /** Record timestamps */
  createdAt: Date;
  updatedAt: Date;
}

interface PointTypeConfig {
  /** Monetary value per point (e.g., 0.01 = 1 cent per point) */
  monetaryValue: number | null;

  /** Whether points can be transferred between users */
  transferable: boolean;

  /** Whether points can be exchanged for other point types */
  exchangeable: boolean;

  /** Whether points expire */
  expires: boolean;

  /** Default TTL in days (if expires = true) */
  defaultTtlDays: number | null;

  /** Maximum balance a user can hold */
  maxBalance: number | null;

  /** Minimum redemption amount */
  minRedemption: number;

  /** Whether negative balances are allowed (typically false) */
  allowNegative: boolean;

  /** Display formatting options */
  display: {
    /** Format string (e.g., '{value} XP', '${value}') */
    format: string;
    /** Thousands separator */
    separator: string;
    /** Whether to show decimal places */
    showDecimals: boolean;
  };
}
```

### EarningRule

Defines how points are earned from platform events.

```typescript
interface EarningRule {
  /** Unique rule ID */
  id: string;

  /** Venture scope */
  ventureId: string;

  /** Point type to award */
  pointTypeId: string;

  /** Rule name (e.g., 'Purchase Earning') */
  name: string;

  /** Rule description */
  description: string;

  /** Event type that triggers this rule */
  eventType: EarningEventType;

  /** Rule configuration */
  config: EarningRuleConfig;

  /** Priority for rule ordering (lower = higher priority) */
  priority: number;

  /** Whether this rule is active */
  isActive: boolean;

  /** Effective date range (null = always) */
  startsAt: Date | null;
  endsAt: Date | null;

  /** Record timestamps */
  createdAt: Date;
  updatedAt: Date;
}

interface EarningRuleConfig {
  /** Fixed amount to award */
  fixedAmount: number | null;

  /**
   * Percentage of event value (e.g., 0.1 = 10% of purchase amount).
   * If both fixedAmount and percentageOfValue are set, they are additive.
   */
  percentageOfValue: number | null;

  /** Minimum earning per event */
  minAmount: number;

  /** Maximum earning per event */
  maxAmount: number | null;

  /**
   * Conditions that must be met for the rule to apply.
   * Evaluated against event metadata.
   */
  conditions: EarningCondition[];

  /** Cooldown between earnings from same event type (ms) */
  cooldownMs: number | null;

  /** Maximum times this rule can fire per user per period */
  maxOccurrences: {
    count: number;
    period: CapPeriod;
  } | null;

  /** Whether this rule stacks with other rules for the same event */
  stackable: boolean;

  /** Bonus multiplier for this specific rule */
  bonusMultiplier: number;
}

interface EarningCondition {
  /** Field path in event metadata (dot notation) */
  field: string;
  /** Comparison operator */
  operator: 'eq' | 'neq' | 'gt' | 'gte' | 'lt' | 'lte' | 'in' | 'contains' | 'exists';
  /** Expected value */
  value: unknown;
}

enum EarningEventType {
  PURCHASE_COMPLETE = 'purchase_complete',
  REVIEW_SUBMITTED = 'review_submitted',
  REFERRAL_CONVERTED = 'referral_converted',
  LOGIN_DAILY = 'login_daily',
  LOGIN_STREAK = 'login_streak',
  CONTENT_CREATED = 'content_created',
  CONTENT_FEATURED = 'content_featured',
  PROFILE_COMPLETED = 'profile_completed',
  SURVEY_COMPLETED = 'survey_completed',
  SOCIAL_SHARE = 'social_share',
  EVENT_ATTENDED = 'event_attended',
  MILESTONE_REACHED = 'milestone_reached',
  BIRTHDAY = 'birthday',
  ANNIVERSARY = 'anniversary',
  CUSTOM = 'custom',
}
```

### RedemptionRule

Defines how points can be redeemed for value.

```typescript
interface RedemptionRule {
  /** Unique rule ID */
  id: string;

  /** Venture scope */
  ventureId: string;

  /** Point type to deduct */
  pointTypeId: string;

  /** Rule name (e.g., '$5 Off Coupon') */
  name: string;

  /** Rule description */
  description: string;

  /** Redemption type */
  redemptionType: RedemptionType;

  /** Points required */
  pointsCost: number;

  /** Value provided in return */
  redemptionValue: RedemptionValue;

  /** Whether partial redemption is allowed */
  allowPartial: boolean;

  /** Minimum points required (for scaled redemptions) */
  minPoints: number;

  /** Maximum points per redemption */
  maxPoints: number | null;

  /** Maximum redemptions per user per period */
  maxRedemptionsPerUser: {
    count: number;
    period: CapPeriod;
  } | null;

  /** Total inventory (null = unlimited) */
  totalInventory: number | null;

  /** Remaining inventory */
  remainingInventory: number | null;

  /** Minimum user balance to keep after redemption */
  minBalanceAfter: number;

  /** Whether admin approval is required */
  requiresApproval: boolean;

  /** Auto-approve threshold (below this amount, auto-approve) */
  autoApproveThreshold: number | null;

  /** Whether this rule is active */
  isActive: boolean;

  /** Effective date range */
  startsAt: Date | null;
  endsAt: Date | null;

  /** Record timestamps */
  createdAt: Date;
  updatedAt: Date;
}

interface RedemptionValue {
  /** Type of value provided */
  type: 'discount' | 'fixed_amount' | 'percentage' | 'item' | 'feature' | 'custom';

  /** Monetary value (for discount/fixed_amount types) */
  monetaryValue: number | null;

  /** Percentage value (for percentage type) */
  percentage: number | null;

  /** Currency code (for monetary values) */
  currency: string | null;

  /** Item/feature reference (for item/feature types) */
  reference: string | null;

  /** Metadata for custom redemption types */
  metadata: Record<string, unknown>;
}

enum RedemptionType {
  DISCOUNT = 'DISCOUNT',
  REWARD_ITEM = 'REWARD_ITEM',
  FEATURE_UNLOCK = 'FEATURE_UNLOCK',
  CREDIT_CONVERSION = 'CREDIT_CONVERSION',
  DONATION = 'DONATION',
  AUCTION_BID = 'AUCTION_BID',
  CUSTOM = 'CUSTOM',
}
```

### ExpirationPolicy

Defines how and when points expire.

```typescript
interface ExpirationPolicy {
  /** Unique policy ID */
  id: string;

  /** Venture scope */
  ventureId: string;

  /** Point type this policy applies to */
  pointTypeId: string;

  /** Policy name */
  name: string;

  /** Expiration strategy */
  strategy: ExpirationStrategy;

  /** Time-to-live in days from earning date */
  ttlDays: number;

  /** Grace period in days after TTL (points still usable) */
  gracePeriodDays: number;

  /** Days before expiration to send first warning */
  warningDays: number[];

  /** Whether to send expiration warning notifications */
  sendWarnings: boolean;

  /** Whether expired points can be reinstated (within a window) */
  allowReinstatement: boolean;

  /** Reinstatement window in days after expiration */
  reinstatementWindowDays: number | null;

  /** Whether activity resets the expiration clock */
  activityResetsExpiration: boolean;

  /** What counts as "activity" for resetting */
  activityTypes: EarningEventType[];

  /** Whether this policy is active */
  isActive: boolean;

  /** Record timestamps */
  createdAt: Date;
  updatedAt: Date;
}

enum ExpirationStrategy {
  /** First-in, first-out — oldest points expire first */
  FIFO = 'FIFO',
  /** Last-in, first-out — newest points expire first */
  LIFO = 'LIFO',
  /** All points expire on a fixed date (e.g., Dec 31) */
  FIXED_DATE = 'FIXED_DATE',
  /** Points never expire */
  NEVER = 'NEVER',
  /** Rolling window — all points expire N days after last activity */
  ROLLING = 'ROLLING',
}
```

### PointTransfer

Represents a point transfer between users.

```typescript
interface PointTransfer {
  /** Unique transfer ID */
  id: string;

  /** Venture scope */
  ventureId: string;

  /** Sender user ID */
  senderId: string;

  /** Recipient user ID */
  recipientId: string;

  /** Source point type */
  sourcePointTypeId: string;

  /** Target point type (may differ for cross-type transfers) */
  targetPointTypeId: string;

  /** Amount deducted from sender */
  sourceAmount: number;

  /** Amount credited to recipient (may differ due to exchange rate) */
  targetAmount: number;

  /** Exchange rate applied (1.0 for same-type transfers) */
  exchangeRate: number;

  /** Fee deducted (if any) */
  fee: number;

  /** Transfer status */
  status: TransferStatus;

  /** Transfer type */
  transferType: 'direct' | 'gift' | 'pool_contribution' | 'pool_withdrawal';

  /** Optional message from sender */
  message: string | null;

  /** Reference to sender's debit transaction */
  senderTransactionId: string;

  /** Reference to recipient's credit transaction */
  recipientTransactionId: string;

  /** Record timestamps */
  createdAt: Date;
  updatedAt: Date;
}

enum TransferStatus {
  PENDING = 'PENDING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  REVERSED = 'REVERSED',
}
```

### PointTier

Defines tier-based multiplier levels.

```typescript
interface PointTier {
  /** Unique tier ID */
  id: string;

  /** Venture scope */
  ventureId: string;

  /** Point type used for tier calculation */
  pointTypeId: string;

  /** Tier name (e.g., 'Bronze', 'Silver', 'Gold', 'Platinum') */
  name: string;

  /** Tier slug */
  slug: string;

  /** Tier level (1 = lowest) */
  level: number;

  /** Minimum lifetime points to reach this tier */
  minLifetimePoints: number;

  /** Maximum lifetime points for this tier (null = no cap) */
  maxLifetimePoints: number | null;

  /** Earning multiplier for this tier (e.g., 1.0, 1.5, 2.0) */
  earnMultiplier: number;

  /** Redemption bonus for this tier (e.g., 1.0 = no bonus, 1.1 = 10% extra) */
  redeemBonus: number;

  /** Additional benefits/perks as structured data */
  benefits: TierBenefit[];

  /** Display configuration */
  display: {
    color: string;
    icon: string;
    badge: string | null;
  };

  /** Whether tier can be lost (demoted) on inactivity */
  canDemote: boolean;

  /** Days of inactivity before demotion check */
  demotionInactivityDays: number | null;

  /** Record timestamps */
  createdAt: Date;
  updatedAt: Date;
}

interface TierBenefit {
  /** Benefit type */
  type: 'multiplier' | 'discount' | 'access' | 'limit_increase' | 'custom';
  /** Benefit name */
  name: string;
  /** Benefit value */
  value: unknown;
  /** Description */
  description: string;
}
```

### PointHold

Represents a point reservation (points locked but not yet spent).

```typescript
interface PointHold {
  /** Unique hold ID */
  id: string;

  /** Venture scope */
  ventureId: string;

  /** User whose points are held */
  userId: string;

  /** Point type */
  pointTypeId: string;

  /** Amount held */
  amount: number;

  /** Hold status */
  status: HoldStatus;

  /** What the hold is for (e.g., 'order:ord_123') */
  reference: string;

  /** Human-readable reason */
  reason: string;

  /** When the hold expires (auto-released after this) */
  expiresAt: Date;

  /** When the hold was committed (converted to debit) */
  committedAt: Date | null;

  /** When the hold was released */
  releasedAt: Date | null;

  /** Reference to the debit transaction (if committed) */
  transactionId: string | null;

  /** Record timestamps */
  createdAt: Date;
  updatedAt: Date;
}

enum HoldStatus {
  ACTIVE = 'ACTIVE',
  COMMITTED = 'COMMITTED',
  RELEASED = 'RELEASED',
  EXPIRED = 'EXPIRED',
}
```

### EarningCap

Configures maximum earning limits per period to prevent abuse.

```typescript
interface EarningCap {
  /** Unique cap ID */
  id: string;

  /** Venture scope */
  ventureId: string;

  /** Point type this cap applies to */
  pointTypeId: string;

  /** Cap period */
  period: CapPeriod;

  /** Maximum points earnable in the period */
  maxAmount: number;

  /** Optional: cap per event type (null = applies to all events) */
  eventType: EarningEventType | null;

  /** Optional: cap per earning rule (null = applies to all rules) */
  earningRuleId: string | null;

  /** Whether exceeding the cap silently drops or returns error */
  overflowBehavior: 'drop' | 'error' | 'queue';

  /** Whether this cap is active */
  isActive: boolean;

  /** Record timestamps */
  createdAt: Date;
  updatedAt: Date;
}

enum CapPeriod {
  HOURLY = 'HOURLY',
  DAILY = 'DAILY',
  WEEKLY = 'WEEKLY',
  MONTHLY = 'MONTHLY',
  YEARLY = 'YEARLY',
  LIFETIME = 'LIFETIME',
}
```

### PointAnalytics

Aggregate analytics for point economy monitoring.

```typescript
interface PointAnalytics {
  /** Time range for these analytics */
  timeRange: {
    start: Date;
    end: Date;
  };

  /** Venture scope */
  ventureId: string;

  /** Point type (null = all types aggregated) */
  pointTypeId: string | null;

  /** Summary metrics */
  summary: {
    /** Total points issued in the period */
    totalIssued: number;
    /** Total points redeemed in the period */
    totalRedeemed: number;
    /** Total points expired in the period */
    totalExpired: number;
    /** Total points transferred in the period */
    totalTransferred: number;
    /** Total points voided in the period */
    totalVoided: number;
    /** Net points change (issued - redeemed - expired - voided) */
    netChange: number;
    /** Total outstanding balance (liability) */
    outstandingBalance: number;
    /** Monetary value of outstanding balance */
    outstandingValue: number;
    /** Unique users who earned points */
    uniqueEarners: number;
    /** Unique users who redeemed points */
    uniqueRedeemers: number;
    /** Average balance per user */
    averageBalance: number;
    /** Median balance per user */
    medianBalance: number;
  };

  /** Earn/burn ratio (< 1 means more burns than earns) */
  earnBurnRatio: number;

  /** Velocity — average time from earn to redeem (hours) */
  averageRedemptionVelocityHours: number;

  /** Time series data */
  timeSeries: {
    date: string;
    issued: number;
    redeemed: number;
    expired: number;
    netChange: number;
    outstandingBalance: number;
  }[];

  /** Top earning events */
  topEarningEvents: {
    eventType: EarningEventType;
    totalPoints: number;
    transactionCount: number;
  }[];

  /** Top redemption rules */
  topRedemptions: {
    ruleId: string;
    ruleName: string;
    totalPoints: number;
    transactionCount: number;
  }[];

  /** Tier distribution */
  tierDistribution: {
    tierId: string;
    tierName: string;
    userCount: number;
    percentage: number;
  }[];

  /** Expiration forecast (next 30/60/90 days) */
  expirationForecast: {
    next30Days: number;
    next60Days: number;
    next90Days: number;
  };

  /** Fraud metrics */
  fraudMetrics: {
    blockedTransactions: number;
    flaggedForReview: number;
    capsHit: number;
  };
}

interface EconomyHealthMetrics {
  /** Overall health score (0-100) */
  healthScore: number;

  /** Individual indicators */
  indicators: {
    /** Earn/burn ratio — healthy range: 0.3-0.7 */
    earnBurnRatio: { value: number; status: 'healthy' | 'warning' | 'critical' };
    /** Liability growth rate — healthy: < 10% month-over-month */
    liabilityGrowthRate: { value: number; status: 'healthy' | 'warning' | 'critical' };
    /** Expiration rate — healthy: < 30% */
    expirationRate: { value: number; status: 'healthy' | 'warning' | 'critical' };
    /** Active user ratio — healthy: > 20% of balance holders transacted */
    activeUserRatio: { value: number; status: 'healthy' | 'warning' | 'critical' };
    /** Fraud incident rate — healthy: < 0.1% */
    fraudRate: { value: number; status: 'healthy' | 'warning' | 'critical' };
    /** Average redemption velocity — healthy: < 90 days */
    redemptionVelocity: { value: number; status: 'healthy' | 'warning' | 'critical' };
  };

  /** Recommendations based on current health */
  recommendations: string[];

  /** Computed at */
  computedAt: Date;
}
```

### PointExchangeRate

Defines exchange rates for cross-venture or cross-type point conversion.

```typescript
interface PointExchangeRate {
  /** Unique rate ID */
  id: string;

  /** Source point type */
  sourcePointTypeId: string;

  /** Source venture */
  sourceVentureId: string;

  /** Target point type */
  targetPointTypeId: string;

  /** Target venture */
  targetVentureId: string;

  /**
   * Exchange rate. Target = Source × rate.
   * e.g., rate=0.75 means 100 source → 75 target.
   */
  rate: number;

  /** Fee percentage (0-1, e.g., 0.05 = 5% fee) */
  feePercentage: number;

  /** Minimum exchange amount (in source points) */
  minAmount: number;

  /** Maximum exchange amount per transaction */
  maxAmount: number | null;

  /** Maximum exchange amount per day */
  dailyLimit: number | null;

  /** Whether this rate is bidirectional */
  bidirectional: boolean;

  /** Whether rate adjusts dynamically based on supply/demand */
  dynamic: boolean;

  /** Dynamic rate bounds (if dynamic = true) */
  dynamicBounds: {
    minRate: number;
    maxRate: number;
  } | null;

  /** Whether this rate is active */
  isActive: boolean;

  /** Record timestamps */
  createdAt: Date;
  updatedAt: Date;
}
```

### PointEvent

Events emitted to Redpanda for downstream consumption.

```typescript
interface PointEvent {
  /** Event ID (ULID) */
  id: string;

  /** Event type */
  type: PointEventType;

  /** Venture scope */
  ventureId: string;

  /** User involved */
  userId: string;

  /** Point type */
  pointTypeId: string;

  /** Transaction ID */
  transactionId: string;

  /** Event payload (varies by type) */
  payload: PointEventPayload;

  /** Event timestamp */
  timestamp: Date;

  /** Event metadata */
  metadata: Record<string, unknown>;
}

type PointEventType =
  | 'points.earned'
  | 'points.redeemed'
  | 'points.expired'
  | 'points.transferred'
  | 'points.held'
  | 'points.released'
  | 'points.voided'
  | 'points.adjusted'
  | 'points.tier_changed'
  | 'points.expiration_warning'
  | 'points.fraud_detected'
  | 'points.cap_reached';

type PointEventPayload =
  | PointsEarnedPayload
  | PointsRedeemedPayload
  | PointsExpiredPayload
  | PointsTransferredPayload
  | PointsHeldPayload
  | PointsReleasedPayload
  | PointsVoidedPayload
  | PointsAdjustedPayload
  | TierChangedPayload
  | ExpirationWarningPayload
  | FraudDetectedPayload
  | CapReachedPayload;

interface PointsEarnedPayload {
  amount: number;
  baseAmount: number;
  multiplier: number;
  ruleId: string;
  eventType: EarningEventType;
  balanceAfter: number;
  expiresAt: Date | null;
}

interface PointsRedeemedPayload {
  amount: number;
  ruleId: string;
  redemptionType: RedemptionType;
  redemptionValue: RedemptionValue;
  balanceAfter: number;
}

interface PointsExpiredPayload {
  amount: number;
  batchId: string;
  originalEarnDate: Date;
  balanceAfter: number;
}

interface PointsTransferredPayload {
  transferId: string;
  direction: 'sent' | 'received';
  counterpartyId: string;
  amount: number;
  exchangeRate: number;
  fee: number;
  balanceAfter: number;
}

interface PointsHeldPayload {
  holdId: string;
  amount: number;
  reference: string;
  expiresAt: Date;
  availableAfter: number;
}

interface PointsReleasedPayload {
  holdId: string;
  amount: number;
  availableAfter: number;
}

interface PointsVoidedPayload {
  originalTransactionId: string;
  amount: number;
  reason: string;
  balanceAfter: number;
}

interface PointsAdjustedPayload {
  amount: number;
  reason: string;
  initiatedBy: string;
  balanceAfter: number;
}

interface TierChangedPayload {
  previousTierId: string | null;
  previousTierName: string | null;
  newTierId: string;
  newTierName: string;
  lifetimePoints: number;
}

interface ExpirationWarningPayload {
  amount: number;
  expiresAt: Date;
  daysUntilExpiration: number;
  warningNumber: number;
}

interface FraudDetectedPayload {
  verdict: FraudVerdict;
  reasons: string[];
  blockedAmount: number;
  ruleViolated: string;
}

interface CapReachedPayload {
  capId: string;
  period: CapPeriod;
  maxAmount: number;
  currentAmount: number;
  attemptedAmount: number;
  droppedAmount: number;
}
```

---

## Database Schemas

All tables are defined using Drizzle ORM and enforced with PostgreSQL Row-Level Security (RLS) scoped by `venture_id`.

### point_types

```typescript
import { pgTable, text, integer, boolean, timestamp, jsonb, uniqueIndex } from 'drizzle-orm/pg-core';

export const pointTypes = pgTable('point_types', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  ventureId: text('venture_id').notNull().references(() => ventures.id),
  slug: text('slug').notNull(),
  name: text('name').notNull(),
  description: text('description').notNull().default(''),
  symbol: text('symbol').notNull().default('⭐'),
  precision: integer('precision').notNull().default(0),
  config: jsonb('config').notNull().$type<PointTypeConfig>(),
  isActive: boolean('is_active').notNull().default(true),
  archivedAt: timestamp('archived_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  ventureSlugIdx: uniqueIndex('point_types_venture_slug_idx')
    .on(table.ventureId, table.slug),
}));
```

**RLS Policy:**
```sql
CREATE POLICY point_types_rls ON point_types
  USING (venture_id = current_setting('app.current_venture_id')::text);
```

### point_balances

```typescript
export const pointBalances = pgTable('point_balances', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  userId: text('user_id').notNull().references(() => users.id),
  pointTypeId: text('point_type_id').notNull().references(() => pointTypes.id),
  ventureId: text('venture_id').notNull().references(() => ventures.id),
  total: integer('total').notNull().default(0),
  available: integer('available').notNull().default(0),
  held: integer('held').notNull().default(0),
  pending: integer('pending').notNull().default(0),
  lifetimeEarned: integer('lifetime_earned').notNull().default(0),
  lifetimeRedeemed: integer('lifetime_redeemed').notNull().default(0),
  lifetimeExpired: integer('lifetime_expired').notNull().default(0),
  lifetimeTransferredOut: integer('lifetime_transferred_out').notNull().default(0),
  lifetimeTransferredIn: integer('lifetime_transferred_in').notNull().default(0),
  lastTransactionAt: timestamp('last_transaction_at', { withTimezone: true }),
  reconciledAt: timestamp('reconciled_at', { withTimezone: true }).notNull().defaultNow(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  userPointTypeIdx: uniqueIndex('point_balances_user_point_type_idx')
    .on(table.userId, table.pointTypeId),
  ventureIdx: index('point_balances_venture_idx').on(table.ventureId),
  availableIdx: index('point_balances_available_idx')
    .on(table.userId, table.pointTypeId, table.available),
}));
```

**RLS Policy:**
```sql
CREATE POLICY point_balances_rls ON point_balances
  USING (venture_id = current_setting('app.current_venture_id')::text);

-- Users can only read their own balance
CREATE POLICY point_balances_user_rls ON point_balances
  FOR SELECT
  USING (user_id = current_setting('app.current_user_id')::text);
```

**Check Constraints:**
```sql
ALTER TABLE point_balances
  ADD CONSTRAINT point_balances_total_check CHECK (total >= 0),
  ADD CONSTRAINT point_balances_available_check CHECK (available >= 0),
  ADD CONSTRAINT point_balances_held_check CHECK (held >= 0),
  ADD CONSTRAINT point_balances_total_equals CHECK (total = available + held);
```

### point_transactions

```typescript
export const pointTransactions = pgTable('point_transactions', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  ventureId: text('venture_id').notNull().references(() => ventures.id),
  userId: text('user_id').notNull().references(() => users.id),
  pointTypeId: text('point_type_id').notNull().references(() => pointTypes.id),
  type: text('type').notNull().$type<TransactionType>(),
  status: text('status').notNull().$type<TransactionStatus>().default('COMMITTED'),
  amount: integer('amount').notNull(),
  balanceAfter: integer('balance_after').notNull(),
  idempotencyKey: text('idempotency_key').notNull(),
  ruleId: text('rule_id'),
  relatedTransactionId: text('related_transaction_id'),
  holdId: text('hold_id'),
  transferId: text('transfer_id'),
  batchId: text('batch_id'),
  expiresAt: timestamp('expires_at', { withTimezone: true }),
  batchRemaining: integer('batch_remaining'),
  description: text('description').notNull(),
  sourceEvent: text('source_event'),
  metadata: jsonb('metadata').notNull().default({}),
  multiplierApplied: integer('multiplier_applied'),
  baseAmount: integer('base_amount'),
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
  initiatedBy: text('initiated_by'),
  voidReason: text('void_reason'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  idempotencyIdx: uniqueIndex('point_transactions_idempotency_idx')
    .on(table.ventureId, table.idempotencyKey),
  userPointTypeIdx: index('point_transactions_user_pt_idx')
    .on(table.userId, table.pointTypeId, table.createdAt),
  batchIdx: index('point_transactions_batch_idx')
    .on(table.batchId, table.batchRemaining),
  expiresAtIdx: index('point_transactions_expires_idx')
    .on(table.expiresAt)
    .where(sql`expires_at IS NOT NULL AND batch_remaining > 0`),
  statusIdx: index('point_transactions_status_idx')
    .on(table.status, table.createdAt),
  ventureIdx: index('point_transactions_venture_idx')
    .on(table.ventureId, table.createdAt),
}));
```

**RLS Policy:**
```sql
CREATE POLICY point_transactions_rls ON point_transactions
  USING (venture_id = current_setting('app.current_venture_id')::text);

-- Users see their own transactions; admins see all
CREATE POLICY point_transactions_user_rls ON point_transactions
  FOR SELECT
  USING (
    user_id = current_setting('app.current_user_id')::text
    OR current_setting('app.current_role')::text = 'admin'
  );
```

### earning_rules

```typescript
export const earningRules = pgTable('earning_rules', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  ventureId: text('venture_id').notNull().references(() => ventures.id),
  pointTypeId: text('point_type_id').notNull().references(() => pointTypes.id),
  name: text('name').notNull(),
  description: text('description').notNull().default(''),
  eventType: text('event_type').notNull().$type<EarningEventType>(),
  config: jsonb('config').notNull().$type<EarningRuleConfig>(),
  priority: integer('priority').notNull().default(0),
  isActive: boolean('is_active').notNull().default(true),
  startsAt: timestamp('starts_at', { withTimezone: true }),
  endsAt: timestamp('ends_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  ventureEventIdx: index('earning_rules_venture_event_idx')
    .on(table.ventureId, table.eventType, table.isActive),
}));
```

### redemption_rules

```typescript
export const redemptionRules = pgTable('redemption_rules', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  ventureId: text('venture_id').notNull().references(() => ventures.id),
  pointTypeId: text('point_type_id').notNull().references(() => pointTypes.id),
  name: text('name').notNull(),
  description: text('description').notNull().default(''),
  redemptionType: text('redemption_type').notNull().$type<RedemptionType>(),
  pointsCost: integer('points_cost').notNull(),
  redemptionValue: jsonb('redemption_value').notNull().$type<RedemptionValue>(),
  allowPartial: boolean('allow_partial').notNull().default(false),
  minPoints: integer('min_points').notNull().default(0),
  maxPoints: integer('max_points'),
  maxRedemptionsPerUser: jsonb('max_redemptions_per_user'),
  totalInventory: integer('total_inventory'),
  remainingInventory: integer('remaining_inventory'),
  minBalanceAfter: integer('min_balance_after').notNull().default(0),
  requiresApproval: boolean('requires_approval').notNull().default(false),
  autoApproveThreshold: integer('auto_approve_threshold'),
  isActive: boolean('is_active').notNull().default(true),
  startsAt: timestamp('starts_at', { withTimezone: true }),
  endsAt: timestamp('ends_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  ventureActiveIdx: index('redemption_rules_venture_active_idx')
    .on(table.ventureId, table.isActive),
}));
```

### expiration_policies

```typescript
export const expirationPolicies = pgTable('expiration_policies', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  ventureId: text('venture_id').notNull().references(() => ventures.id),
  pointTypeId: text('point_type_id').notNull().references(() => pointTypes.id),
  name: text('name').notNull(),
  strategy: text('strategy').notNull().$type<ExpirationStrategy>(),
  ttlDays: integer('ttl_days').notNull(),
  gracePeriodDays: integer('grace_period_days').notNull().default(0),
  warningDays: jsonb('warning_days').notNull().$type<number[]>().default([30, 7, 1]),
  sendWarnings: boolean('send_warnings').notNull().default(true),
  allowReinstatement: boolean('allow_reinstatement').notNull().default(false),
  reinstatementWindowDays: integer('reinstatement_window_days'),
  activityResetsExpiration: boolean('activity_resets_expiration').notNull().default(false),
  activityTypes: jsonb('activity_types').notNull().$type<EarningEventType[]>().default([]),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  venturePointTypeIdx: uniqueIndex('expiration_policies_venture_pt_idx')
    .on(table.ventureId, table.pointTypeId),
}));
```

### point_transfers

```typescript
export const pointTransfers = pgTable('point_transfers', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  ventureId: text('venture_id').notNull().references(() => ventures.id),
  senderId: text('sender_id').notNull().references(() => users.id),
  recipientId: text('recipient_id').notNull().references(() => users.id),
  sourcePointTypeId: text('source_point_type_id').notNull().references(() => pointTypes.id),
  targetPointTypeId: text('target_point_type_id').notNull().references(() => pointTypes.id),
  sourceAmount: integer('source_amount').notNull(),
  targetAmount: integer('target_amount').notNull(),
  exchangeRate: integer('exchange_rate').notNull().default(1),
  fee: integer('fee').notNull().default(0),
  status: text('status').notNull().$type<TransferStatus>().default('PENDING'),
  transferType: text('transfer_type').notNull().default('direct'),
  message: text('message'),
  senderTransactionId: text('sender_transaction_id').references(() => pointTransactions.id),
  recipientTransactionId: text('recipient_transaction_id').references(() => pointTransactions.id),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  senderIdx: index('point_transfers_sender_idx')
    .on(table.senderId, table.createdAt),
  recipientIdx: index('point_transfers_recipient_idx')
    .on(table.recipientId, table.createdAt),
  ventureIdx: index('point_transfers_venture_idx')
    .on(table.ventureId, table.createdAt),
}));
```

### point_tiers

```typescript
export const pointTiers = pgTable('point_tiers', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  ventureId: text('venture_id').notNull().references(() => ventures.id),
  pointTypeId: text('point_type_id').notNull().references(() => pointTypes.id),
  name: text('name').notNull(),
  slug: text('slug').notNull(),
  level: integer('level').notNull(),
  minLifetimePoints: integer('min_lifetime_points').notNull(),
  maxLifetimePoints: integer('max_lifetime_points'),
  earnMultiplier: integer('earn_multiplier').notNull().default(100), // stored as basis points (100 = 1.0x)
  redeemBonus: integer('redeem_bonus').notNull().default(100),
  benefits: jsonb('benefits').notNull().$type<TierBenefit[]>().default([]),
  display: jsonb('display').notNull().$type<{ color: string; icon: string; badge: string | null }>(),
  canDemote: boolean('can_demote').notNull().default(false),
  demotionInactivityDays: integer('demotion_inactivity_days'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  venturePtLevelIdx: uniqueIndex('point_tiers_venture_pt_level_idx')
    .on(table.ventureId, table.pointTypeId, table.level),
  ventureSlugIdx: uniqueIndex('point_tiers_venture_slug_idx')
    .on(table.ventureId, table.slug),
}));
```

### point_holds

```typescript
export const pointHolds = pgTable('point_holds', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  ventureId: text('venture_id').notNull().references(() => ventures.id),
  userId: text('user_id').notNull().references(() => users.id),
  pointTypeId: text('point_type_id').notNull().references(() => pointTypes.id),
  amount: integer('amount').notNull(),
  status: text('status').notNull().$type<HoldStatus>().default('ACTIVE'),
  reference: text('reference').notNull(),
  reason: text('reason').notNull(),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  committedAt: timestamp('committed_at', { withTimezone: true }),
  releasedAt: timestamp('released_at', { withTimezone: true }),
  transactionId: text('transaction_id').references(() => pointTransactions.id),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  userActiveIdx: index('point_holds_user_active_idx')
    .on(table.userId, table.pointTypeId, table.status)
    .where(sql`status = 'ACTIVE'`),
  expiresIdx: index('point_holds_expires_idx')
    .on(table.expiresAt)
    .where(sql`status = 'ACTIVE'`),
  referenceIdx: index('point_holds_reference_idx')
    .on(table.reference),
}));
```

### earning_caps

```typescript
export const earningCaps = pgTable('earning_caps', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  ventureId: text('venture_id').notNull().references(() => ventures.id),
  pointTypeId: text('point_type_id').notNull().references(() => pointTypes.id),
  period: text('period').notNull().$type<CapPeriod>(),
  maxAmount: integer('max_amount').notNull(),
  eventType: text('event_type').$type<EarningEventType>(),
  earningRuleId: text('earning_rule_id').references(() => earningRules.id),
  overflowBehavior: text('overflow_behavior').notNull().default('drop'),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  ventureActiveIdx: index('earning_caps_venture_active_idx')
    .on(table.ventureId, table.pointTypeId, table.isActive),
}));
```

---

## Code Examples

### 1. Configure Point Types for a Venture

Set up multiple point currencies with distinct behaviors for an e-commerce venture.

```typescript
import { PointService } from '@mcv/engagement/points';

async function configurePointTypes(pointService: PointService, ventureId: string) {
  // 1. Loyalty Points — the primary engagement currency
  const loyaltyPoints = await pointService.createPointType({
    ventureId,
    slug: 'loyalty',
    name: 'Loyalty Points',
    description: 'Earn on purchases, redeem for discounts',
    symbol: '⭐',
    precision: 0, // whole numbers only
    config: {
      monetaryValue: 0.01, // 1 point = $0.01
      transferable: true,
      exchangeable: false,
      expires: true,
      defaultTtlDays: 365, // expire after 1 year
      maxBalance: 1_000_000,
      minRedemption: 100,
      allowNegative: false,
      display: {
        format: '{value} pts',
        separator: ',',
        showDecimals: false,
      },
    },
  });

  // 2. XP — gamification currency, never expires
  const xp = await pointService.createPointType({
    ventureId,
    slug: 'xp',
    name: 'Experience Points',
    description: 'Level up through platform activity',
    symbol: 'XP',
    precision: 0,
    config: {
      monetaryValue: null, // no monetary value
      transferable: false, // can't transfer XP
      exchangeable: false,
      expires: false,
      defaultTtlDays: null,
      maxBalance: null, // no cap
      minRedemption: 0,
      allowNegative: false,
      display: {
        format: '{value} XP',
        separator: ',',
        showDecimals: false,
      },
    },
  });

  // 3. Credits — premium currency with real monetary value
  const credits = await pointService.createPointType({
    ventureId,
    slug: 'credits',
    name: 'Credits',
    description: 'Premium currency for marketplace purchases',
    symbol: '💎',
    precision: 2, // supports cents
    config: {
      monetaryValue: 0.10, // 1 credit = $0.10
      transferable: true,
      exchangeable: true,
      expires: false,
      defaultTtlDays: null,
      maxBalance: 100_000,
      minRedemption: 1,
      allowNegative: false,
      display: {
        format: '{value} 💎',
        separator: ',',
        showDecimals: true,
      },
    },
  });

  console.log('Point types configured:', {
    loyaltyPoints: loyaltyPoints.id,
    xp: xp.id,
    credits: credits.id,
  });

  return { loyaltyPoints, xp, credits };
}
```

### 2. Award Points on Purchase

Process a purchase event and award loyalty points with tier-based multipliers.

```typescript
import { PointService, EarningEventType } from '@mcv/engagement/points';
import { nanoid } from 'nanoid';

// First, set up the earning rule (done once during configuration)
async function setupPurchaseEarning(pointService: PointService, ventureId: string, pointTypeId: string) {
  return pointService.createEarningRule({
    ventureId,
    pointTypeId,
    name: 'Purchase Earning',
    description: 'Earn 10 points per dollar spent',
    eventType: EarningEventType.PURCHASE_COMPLETE,
    config: {
      fixedAmount: null,
      percentageOfValue: 10, // 10 points per dollar (1000 cents = 100 points... 10%)
      minAmount: 1,
      maxAmount: 10_000, // cap at 10k points per purchase
      conditions: [
        { field: 'order.status', operator: 'eq', value: 'completed' },
        { field: 'order.total', operator: 'gte', value: 100 }, // min $1 purchase
      ],
      cooldownMs: null,
      maxOccurrences: null,
      stackable: true,
      bonusMultiplier: 1.0,
    },
    priority: 0,
  });
}

// Then, process purchase events as they arrive
async function onPurchaseComplete(
  pointService: PointService,
  event: {
    userId: string;
    ventureId: string;
    orderId: string;
    orderTotal: number; // in cents
  },
) {
  const result = await pointService.earn({
    userId: event.userId,
    ventureId: event.ventureId,
    pointTypeSlug: 'loyalty',
    eventType: EarningEventType.PURCHASE_COMPLETE,
    eventValue: event.orderTotal, // $50.00 order = 5000 cents
    idempotencyKey: `purchase:${event.orderId}`, // prevent double-earning
    metadata: {
      orderId: event.orderId,
      orderTotal: event.orderTotal,
    },
    sourceEvent: `order:${event.orderId}`,
  });

  if (result.earned) {
    console.log(`Awarded ${result.amount} loyalty points to ${event.userId}`);
    console.log(`Multiplier: ${result.multiplierApplied}x (tier: ${result.tierName})`);
    console.log(`New balance: ${result.balanceAfter}`);
    // result.amount = 500 (base) × 1.5 (Silver tier) = 750
  } else {
    console.log(`Earning blocked: ${result.reason}`);
    // Possible reasons: fraud_detected, cap_reached, rule_inactive, duplicate
  }

  return result;
}

// Example output:
// Awarded 750 loyalty points to usr_abc123
// Multiplier: 1.5x (tier: Silver)
// New balance: 12,750
```

### 3. Redeem Points for a Discount

Redeem loyalty points for a discount on the next purchase.

```typescript
import { PointService, RedemptionType } from '@mcv/engagement/points';

// Configure redemption rule (done once)
async function setupDiscountRedemption(
  pointService: PointService,
  ventureId: string,
  pointTypeId: string,
) {
  return pointService.createRedemptionRule({
    ventureId,
    pointTypeId,
    name: '$5 Discount',
    description: 'Redeem 500 points for $5 off your next purchase',
    redemptionType: RedemptionType.DISCOUNT,
    pointsCost: 500,
    redemptionValue: {
      type: 'fixed_amount',
      monetaryValue: 5.00,
      percentage: null,
      currency: 'USD',
      reference: null,
      metadata: {},
    },
    allowPartial: true, // allow redeeming 250 points for $2.50
    minPoints: 100, // minimum 100 points ($1.00)
    maxPoints: 5000, // maximum 5000 points ($50.00)
    maxRedemptionsPerUser: { count: 3, period: 'DAILY' },
    totalInventory: null, // unlimited
    remainingInventory: null,
    minBalanceAfter: 0, // can redeem entire balance
    requiresApproval: false,
    autoApproveThreshold: 5000,
  });
}

// Process redemption request
async function redeemForDiscount(
  pointService: PointService,
  userId: string,
  ventureId: string,
  ruleId: string,
  pointsToRedeem: number,
) {
  // Preview first
  const preview = await pointService.previewRedemption({
    userId,
    ventureId,
    ruleId,
    amount: pointsToRedeem,
    idempotencyKey: `redeem:${userId}:${Date.now()}`,
  });

  console.log('Redemption preview:', {
    pointsToDeduct: preview.pointsToDeduct,
    discountValue: preview.value, // $10.00 for 1000 points
    batchesAffected: preview.batchesAffected, // FIFO: which earn batches will be deducted
    balanceAfter: preview.balanceAfter,
    expiringFirst: preview.expiringBatches, // batches expiring soonest deducted first
  });

  // Commit the redemption
  const result = await pointService.redeem({
    userId,
    ventureId,
    ruleId,
    amount: pointsToRedeem,
    idempotencyKey: `redeem:${userId}:${Date.now()}`,
    metadata: {
      appliedToCart: true,
      cartId: 'cart_xyz789',
    },
  });

  if (result.redeemed) {
    console.log(`Redeemed ${result.amount} points for $${result.value}`);
    console.log(`Coupon code: ${result.couponCode}`);
    console.log(`Balance after: ${result.balanceAfter}`);
  } else {
    console.log(`Redemption failed: ${result.reason}`);
  }

  return result;
}

// Example output:
// Redemption preview:
//   pointsToDeduct: 1000
//   discountValue: 10.00
//   batchesAffected: 2 (batch from Jan 15 and Feb 2)
//   balanceAfter: 11,750
//   expiringFirst: [{ batchId: 'batch_001', amount: 600, expiresAt: '2025-03-15' }]
//
// Redeemed 1000 points for $10.00
// Coupon code: DISC-A8F3K2
// Balance after: 11,750
```

### 4. Point Expiration Processing

Run the expiration pipeline with warnings and grace periods.

```typescript
import { PointService, ExpirationStrategy, EarningEventType } from '@mcv/engagement/points';

// Configure expiration policy (done once)
async function setupExpirationPolicy(
  pointService: PointService,
  ventureId: string,
  pointTypeId: string,
) {
  return pointService.createExpirationPolicy({
    ventureId,
    pointTypeId,
    name: 'Annual Expiration with Grace',
    strategy: ExpirationStrategy.FIFO,
    ttlDays: 365,
    gracePeriodDays: 30, // 30-day grace after TTL
    warningDays: [90, 30, 7, 1], // warn at 90, 30, 7, and 1 day(s) before
    sendWarnings: true,
    allowReinstatement: true,
    reinstatementWindowDays: 14, // can reinstate within 14 days after expiration
    activityResetsExpiration: true, // any earning activity resets the clock
    activityTypes: [
      EarningEventType.PURCHASE_COMPLETE,
      EarningEventType.LOGIN_DAILY,
    ],
  });
}

// Cron job: Process expirations (runs hourly)
async function processExpirations(pointService: PointService, ventureId: string) {
  // Step 1: Send expiration warnings
  const warningsSent = await pointService.sendExpirationWarnings(ventureId);
  console.log(`Sent ${warningsSent} expiration warnings`);

  // Step 2: Process actual expirations
  const result = await pointService.processExpirations(ventureId);

  console.log('Expiration processing complete:', {
    batchesProcessed: result.batchesProcessed,
    totalPointsExpired: result.totalPointsExpired,
    usersAffected: result.usersAffected,
    batchesInGrace: result.batchesInGrace, // still in grace period
    batchesSkipped: result.batchesSkipped, // activity reset their clock
    errors: result.errors,
    processingTimeMs: result.processingTimeMs,
  });

  return result;
}

// Get expiration forecast for a specific user
async function showExpirationForecast(
  pointService: PointService,
  userId: string,
  pointTypeId: string,
) {
  const forecast = await pointService.getExpirationForecast(userId, pointTypeId, 90);

  console.log('Your points expiration forecast:');
  for (const period of forecast.periods) {
    console.log(
      `  ${period.label}: ${period.amount} points expiring` +
      ` (${period.batches.length} batches)`,
    );
  }
  console.log(`Total expiring in 90 days: ${forecast.totalExpiring}`);
  console.log(`Current balance: ${forecast.currentBalance}`);
  console.log(`Projected balance in 90 days: ${forecast.projectedBalance}`);
}

// Example output:
// Sent 342 expiration warnings
// Expiration processing complete:
//   batchesProcessed: 156
//   totalPointsExpired: 234,500
//   usersAffected: 89
//   batchesInGrace: 43
//   batchesSkipped: 12 (activity reset)
//   errors: 0
//   processingTimeMs: 1,230
//
// Your points expiration forecast:
//   Next 7 days: 200 points expiring (1 batch)
//   Next 30 days: 1,500 points expiring (4 batches)
//   Next 90 days: 4,200 points expiring (11 batches)
// Total expiring in 90 days: 4,200
// Current balance: 12,750
// Projected balance in 90 days: 8,550
```

### 5. Transfer Points Between Users

Transfer loyalty points with limit checks and optional cross-type exchange.

```typescript
import { PointService } from '@mcv/engagement/points';

// Same-type transfer (loyalty → loyalty)
async function transferPoints(
  pointService: PointService,
  senderId: string,
  recipientId: string,
  ventureId: string,
  amount: number,
) {
  // Preview first to show the user what will happen
  const preview = await pointService.previewTransfer({
    senderId,
    recipientId,
    ventureId,
    sourcePointTypeSlug: 'loyalty',
    targetPointTypeSlug: 'loyalty',
    amount,
  });

  console.log('Transfer preview:', {
    senderDeduction: preview.senderDeduction,
    recipientCredit: preview.recipientCredit,
    fee: preview.fee, // 0 for same-type
    exchangeRate: preview.exchangeRate, // 1.0 for same-type
    senderBalanceAfter: preview.senderBalanceAfter,
  });

  // Execute the transfer
  const result = await pointService.transfer({
    senderId,
    recipientId,
    ventureId,
    sourcePointTypeSlug: 'loyalty',
    targetPointTypeSlug: 'loyalty',
    amount,
    message: 'Happy birthday! 🎉',
    idempotencyKey: `transfer:${senderId}:${recipientId}:${Date.now()}`,
    transferType: 'gift',
  });

  if (result.completed) {
    console.log(`Transfer complete: ${amount} points sent`);
    console.log(`Sender balance: ${result.senderBalanceAfter}`);
    console.log(`Recipient balance: ${result.recipientBalanceAfter}`);
  } else {
    console.log(`Transfer failed: ${result.reason}`);
    // Reasons: insufficient_balance, transfer_limit_exceeded,
    //          recipient_not_found, transfers_disabled, fraud_detected
  }

  return result;
}

// Cross-type exchange (loyalty → credits)
async function exchangePoints(
  pointService: PointService,
  userId: string,
  ventureId: string,
  loyaltyAmount: number,
) {
  const preview = await pointService.previewTransfer({
    senderId: userId,
    recipientId: userId, // self-exchange
    ventureId,
    sourcePointTypeSlug: 'loyalty',
    targetPointTypeSlug: 'credits',
    amount: loyaltyAmount,
  });

  console.log('Exchange preview:', {
    loyaltyDeducted: preview.senderDeduction, // 1000
    creditsReceived: preview.recipientCredit, // 75 (exchange rate 0.075)
    fee: preview.fee, // 5% = 3.75 credits
    exchangeRate: preview.exchangeRate, // 0.075
    effectiveRate: preview.effectiveRate, // 0.07125 (after fee)
  });

  // Execute if user confirms
  return pointService.transfer({
    senderId: userId,
    recipientId: userId,
    ventureId,
    sourcePointTypeSlug: 'loyalty',
    targetPointTypeSlug: 'credits',
    amount: loyaltyAmount,
    idempotencyKey: `exchange:${userId}:${Date.now()}`,
    transferType: 'direct',
  });
}
```

### 6. Tier-Based Multiplier Earning

Configure tiers and resolve multipliers for earning calculations.

```typescript
import { PointService, TierService } from '@mcv/engagement/points';

// Configure tier structure (done once)
async function configureTiers(
  pointService: PointService,
  ventureId: string,
  pointTypeId: string,
) {
  const tiers = [
    {
      name: 'Bronze',
      slug: 'bronze',
      level: 1,
      minLifetimePoints: 0,
      maxLifetimePoints: 999,
      earnMultiplier: 1.0,
      redeemBonus: 1.0,
      benefits: [],
      display: { color: '#CD7F32', icon: '🥉', badge: null },
      canDemote: false,
      demotionInactivityDays: null,
    },
    {
      name: 'Silver',
      slug: 'silver',
      level: 2,
      minLifetimePoints: 1_000,
      maxLifetimePoints: 4_999,
      earnMultiplier: 1.5,
      redeemBonus: 1.0,
      benefits: [
        { type: 'multiplier' as const, name: '1.5x Earning', value: 1.5, description: 'Earn 50% more points on every action' },
        { type: 'access' as const, name: 'Early Access', value: 'early_access_sales', description: 'Access sales 24h early' },
      ],
      display: { color: '#C0C0C0', icon: '🥈', badge: 'silver-shield' },
      canDemote: true,
      demotionInactivityDays: 180,
    },
    {
      name: 'Gold',
      slug: 'gold',
      level: 3,
      minLifetimePoints: 5_000,
      maxLifetimePoints: 19_999,
      earnMultiplier: 2.0,
      redeemBonus: 1.1,
      benefits: [
        { type: 'multiplier' as const, name: '2x Earning', value: 2.0, description: 'Double points on every action' },
        { type: 'discount' as const, name: 'Free Shipping', value: 'free_shipping', description: 'Free shipping on all orders' },
        { type: 'access' as const, name: 'VIP Support', value: 'vip_support', description: 'Priority customer support' },
      ],
      display: { color: '#FFD700', icon: '🥇', badge: 'gold-crown' },
      canDemote: true,
      demotionInactivityDays: 365,
    },
    {
      name: 'Platinum',
      slug: 'platinum',
      level: 4,
      minLifetimePoints: 20_000,
      maxLifetimePoints: null,
      earnMultiplier: 3.0,
      redeemBonus: 1.2,
      benefits: [
        { type: 'multiplier' as const, name: '3x Earning', value: 3.0, description: 'Triple points on every action' },
        { type: 'discount' as const, name: '10% Off Everything', value: 0.10, description: 'Permanent 10% discount' },
        { type: 'access' as const, name: 'Exclusive Events', value: 'exclusive_events', description: 'Invitations to exclusive events' },
        { type: 'limit_increase' as const, name: 'Higher Transfer Limits', value: 10_000, description: 'Transfer up to 10,000 points per day' },
      ],
      display: { color: '#E5E4E2', icon: '💎', badge: 'platinum-diamond' },
      canDemote: false,
      demotionInactivityDays: null,
    },
  ];

  for (const tier of tiers) {
    await pointService.createTier({ ventureId, pointTypeId, ...tier });
  }

  console.log('Tiers configured: Bronze → Silver → Gold → Platinum');
}

// Multiplier resolution during earning
// This happens automatically inside pointService.earn(), shown here for clarity
async function resolveMultiplier(
  tierService: TierService,
  userId: string,
  pointTypeId: string,
  ventureId: string,
) {
  const userTier = await tierService.getUserTier(userId, pointTypeId);
  const activePromos = await tierService.getActivePromotions(ventureId, pointTypeId);
  const comboMultiplier = await tierService.getComboMultiplier(userId, pointTypeId);

  const tierMultiplier = userTier?.earnMultiplier ?? 1.0;

  // Stack promotional multipliers (e.g., "Double Points Weekend")
  const promoMultiplier = activePromos.reduce(
    (acc, promo) => acc * promo.multiplier,
    1.0,
  );

  // Combo multiplier from consecutive activity (e.g., 7-day login streak = 1.2x)
  const comboValue = comboMultiplier?.multiplier ?? 1.0;

  const effectiveMultiplier = tierMultiplier * promoMultiplier * comboValue;

  console.log('Multiplier breakdown:', {
    tier: `${userTier?.name ?? 'None'} (${tierMultiplier}x)`,
    promo: `${activePromos.length} active (${promoMultiplier}x)`,
    combo: `${comboValue}x`,
    effective: `${effectiveMultiplier}x`,
  });

  // Example: Gold (2.0) × Double Weekend (2.0) × 7-day streak (1.2) = 4.8x
  return effectiveMultiplier;
}
```

### 7. Anti-Fraud Velocity Check

Detect and prevent point farming with velocity limits and suspicious patterns.

```typescript
import { FraudService, FraudVerdict, CapPeriod } from '@mcv/engagement/points';

// Configure fraud detection (done once)
async function configureFraudProtection(
  fraudService: FraudService,
  ventureId: string,
  pointTypeId: string,
) {
  // Earning caps — maximum points per period
  await fraudService.createEarningCap({
    ventureId,
    pointTypeId,
    period: CapPeriod.DAILY,
    maxAmount: 5_000,
    eventType: null, // applies to all event types
    overflowBehavior: 'drop', // silently cap, don't error
  });

  await fraudService.createEarningCap({
    ventureId,
    pointTypeId,
    period: CapPeriod.WEEKLY,
    maxAmount: 20_000,
    eventType: null,
    overflowBehavior: 'drop',
  });

  await fraudService.createEarningCap({
    ventureId,
    pointTypeId,
    period: CapPeriod.MONTHLY,
    maxAmount: 50_000,
    eventType: null,
    overflowBehavior: 'error', // monthly cap triggers an error
  });

  // Per-event-type caps
  await fraudService.createEarningCap({
    ventureId,
    pointTypeId,
    period: CapPeriod.DAILY,
    maxAmount: 500,
    eventType: 'review_submitted', // max 500 points/day from reviews
    overflowBehavior: 'drop',
  });

  // Velocity rules
  await fraudService.configureVelocityLimits({
    ventureId,
    pointTypeId,
    limits: [
      {
        name: 'rapid_fire_earning',
        description: 'More than 10 earning events in 5 minutes',
        maxEvents: 10,
        windowMs: 5 * 60 * 1000, // 5 minutes
        action: 'flag', // flag for review, don't block
      },
      {
        name: 'suspicious_earning_burst',
        description: 'More than 50 earning events in 1 hour',
        maxEvents: 50,
        windowMs: 60 * 60 * 1000, // 1 hour
        action: 'block', // block further earning
      },
      {
        name: 'rapid_transfer',
        description: 'More than 5 transfers in 10 minutes',
        maxEvents: 5,
        windowMs: 10 * 60 * 1000,
        action: 'block',
      },
    ],
  });

  // Suspicious pattern rules
  await fraudService.configurePatternDetection({
    ventureId,
    patterns: [
      {
        name: 'circular_transfer',
        description: 'A → B → C → A point transfers',
        detector: 'circular_transfer',
        action: 'flag_and_hold',
        config: {
          lookbackHours: 24,
          minChainLength: 3,
        },
      },
      {
        name: 'new_account_farming',
        description: 'High earning on accounts less than 24h old',
        detector: 'new_account_velocity',
        action: 'cap',
        config: {
          accountAgeLimitHours: 24,
          maxPointsForNewAccounts: 100,
        },
      },
      {
        name: 'same_ip_multi_account',
        description: 'Multiple accounts earning from same IP',
        detector: 'ip_correlation',
        action: 'flag',
        config: {
          maxAccountsPerIp: 3,
          windowHours: 24,
        },
      },
    ],
  });
}

// Fraud check during earning (happens automatically inside earn())
async function performFraudCheck(
  fraudService: FraudService,
  userId: string,
  ventureId: string,
  pointTypeId: string,
  amount: number,
  eventType: string,
  metadata: Record<string, unknown>,
): Promise<FraudCheckResult> {
  const result = await fraudService.check({
    userId,
    ventureId,
    pointTypeId,
    amount,
    eventType,
    metadata,
    ipAddress: metadata.ipAddress as string,
    userAgent: metadata.userAgent as string,
  });

  switch (result.verdict) {
    case FraudVerdict.ALLOW:
      // Proceed with earning
      console.log('Fraud check passed');
      break;

    case FraudVerdict.REDUCE:
      // Reduce amount to fit under cap
      console.log(`Amount reduced: ${amount} → ${result.allowedAmount} (cap reached)`);
      break;

    case FraudVerdict.DENY:
      // Block the transaction
      console.log(`Transaction blocked: ${result.reasons.join(', ')}`);
      // Emit fraud event for monitoring
      break;

    case FraudVerdict.REVIEW:
      // Allow but flag for manual review
      console.log(`Flagged for review: ${result.reasons.join(', ')}`);
      break;
  }

  return result;
}

// Example fraud check result:
// {
//   verdict: 'REDUCE',
//   allowedAmount: 3200, // originally 5000, capped at daily remaining
//   reasons: ['daily_cap: 1800 remaining of 5000'],
//   capsChecked: [
//     { period: 'DAILY', max: 5000, current: 1800, remaining: 3200 },
//     { period: 'WEEKLY', max: 20000, current: 8500, remaining: 11500 },
//   ],
//   velocityChecked: [
//     { name: 'rapid_fire', events: 3, max: 10, status: 'ok' },
//   ],
//   patternsChecked: [
//     { name: 'new_account_farming', status: 'ok' },
//   ],
// }
```

### 8. Point Economy Analytics Dashboard

Build analytics dashboards for monitoring point economy health.

```typescript
import { PointService, AnalyticsService } from '@mcv/engagement/points';

async function generateDashboard(
  pointService: PointService,
  analyticsService: AnalyticsService,
  ventureId: string,
) {
  // === Economy Health Score ===
  const health = await pointService.getEconomyHealth(ventureId);

  console.log(`\n=== Point Economy Health: ${health.healthScore}/100 ===\n`);
  for (const [key, indicator] of Object.entries(health.indicators)) {
    const emoji = indicator.status === 'healthy' ? '✅' :
                  indicator.status === 'warning' ? '⚠️' : '🔴';
    console.log(`${emoji} ${key}: ${indicator.value} (${indicator.status})`);
  }

  if (health.recommendations.length > 0) {
    console.log('\nRecommendations:');
    health.recommendations.forEach((r, i) => console.log(`  ${i + 1}. ${r}`));
  }

  // === Monthly Analytics ===
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  const analytics = await pointService.getAnalytics(ventureId, {
    startDate: thirtyDaysAgo,
    endDate: now,
    pointTypeId: null, // all types
    granularity: 'daily',
  });

  console.log('\n=== 30-Day Summary ===\n');
  console.log(`Points Issued:    ${analytics.summary.totalIssued.toLocaleString()}`);
  console.log(`Points Redeemed:  ${analytics.summary.totalRedeemed.toLocaleString()}`);
  console.log(`Points Expired:   ${analytics.summary.totalExpired.toLocaleString()}`);
  console.log(`Net Change:       ${analytics.summary.netChange.toLocaleString()}`);
  console.log(`Outstanding:      ${analytics.summary.outstandingBalance.toLocaleString()}`);
  console.log(`Liability:        $${analytics.summary.outstandingValue.toLocaleString()}`);
  console.log(`Earn/Burn Ratio:  ${analytics.earnBurnRatio.toFixed(2)}`);
  console.log(`Avg Redemption:   ${analytics.averageRedemptionVelocityHours.toFixed(0)}h`);

  // === Tier Distribution ===
  console.log('\n=== Tier Distribution ===\n');
  for (const tier of analytics.tierDistribution) {
    const bar = '█'.repeat(Math.floor(tier.percentage / 2));
    console.log(`${tier.tierName.padEnd(10)} ${bar} ${tier.percentage.toFixed(1)}% (${tier.userCount})`);
  }

  // === Top Earning Events ===
  console.log('\n=== Top Earning Events ===\n');
  for (const event of analytics.topEarningEvents.slice(0, 5)) {
    console.log(
      `${event.eventType.padEnd(25)} ` +
      `${event.totalPoints.toLocaleString().padStart(12)} pts ` +
      `(${event.transactionCount.toLocaleString()} txns)`,
    );
  }

  // === Expiration Forecast ===
  console.log('\n=== Expiration Forecast ===\n');
  console.log(`Next 30 days: ${analytics.expirationForecast.next30Days.toLocaleString()} pts`);
  console.log(`Next 60 days: ${analytics.expirationForecast.next60Days.toLocaleString()} pts`);
  console.log(`Next 90 days: ${analytics.expirationForecast.next90Days.toLocaleString()} pts`);

  // === Fraud Metrics ===
  console.log('\n=== Fraud Metrics ===\n');
  console.log(`Blocked:     ${analytics.fraudMetrics.blockedTransactions}`);
  console.log(`Flagged:     ${analytics.fraudMetrics.flaggedForReview}`);
  console.log(`Caps Hit:    ${analytics.fraudMetrics.capsHit}`);

  // === Custom Query: Liability Trend ===
  const liabilityTrend = await analyticsService.getLiabilityTrend(ventureId, {
    months: 12,
    pointTypeId: null,
  });

  console.log('\n=== 12-Month Liability Trend ===\n');
  for (const month of liabilityTrend) {
    const bar = '▓'.repeat(Math.floor(month.liability / 10_000));
    console.log(
      `${month.month} ${bar} $${month.liability.toLocaleString()}`,
    );
  }
}

// Example output:
//
// === Point Economy Health: 78/100 ===
//
// ✅ earnBurnRatio: 0.45 (healthy)
// ⚠️ liabilityGrowthRate: 0.12 (warning)
// ✅ expirationRate: 0.18 (healthy)
// ✅ activeUserRatio: 0.34 (healthy)
// ✅ fraudRate: 0.02 (healthy)
// ⚠️ redemptionVelocity: 85 (warning)
//
// Recommendations:
//   1. Liability growing 12% MoM — consider promoting redemption campaigns
//   2. Avg redemption takes 85 days — add time-limited redemption offers
//
// === 30-Day Summary ===
//
// Points Issued:    2,345,678
// Points Redeemed:  1,056,123
// Points Expired:   234,500
// Net Change:       1,055,055
// Outstanding:      15,678,900
// Liability:        $156,789.00
// Earn/Burn Ratio:  0.45
// Avg Redemption:   85h
//
// === Tier Distribution ===
//
// Bronze     ████████████████████████ 48.2% (12,340)
// Silver     ██████████████ 28.1% (7,200)
// Gold       ████████ 16.5% (4,230)
// Platinum   ███ 7.2% (1,840)
```

---

## Error Codes

All errors follow the MCV error format with the `POINTS_` prefix.

| Code | HTTP | Description | Resolution |
|---|---|---|---|
| `POINTS_INSUFFICIENT_BALANCE` | 400 | User does not have enough available points for the requested operation. | Check balance before redeeming/transferring. Adjust amount or earn more points. |
| `POINTS_TYPE_NOT_FOUND` | 404 | The specified point type does not exist or has been archived. | Verify point type ID/slug. Check if the type is active for the venture. |
| `POINTS_TYPE_ARCHIVED` | 410 | The point type has been archived and cannot accept new transactions. | Use an active point type. Contact admin to reactivate if needed. |
| `POINTS_RULE_NOT_FOUND` | 404 | The earning or redemption rule was not found. | Verify rule ID. Ensure the rule exists for this venture and point type. |
| `POINTS_RULE_INACTIVE` | 400 | The rule exists but is currently inactive or outside its effective date range. | Check rule start/end dates. Activate the rule in configuration. |
| `POINTS_DUPLICATE_TRANSACTION` | 409 | A transaction with this idempotency key already exists. | This is usually expected (replay protection). Check the existing transaction result. |
| `POINTS_DAILY_CAP_REACHED` | 429 | User has reached the daily earning cap for this point type. | Wait until the next day. Cap resets at midnight UTC by default. |
| `POINTS_WEEKLY_CAP_REACHED` | 429 | User has reached the weekly earning cap. | Wait until the next week. Consider if cap configuration is appropriate. |
| `POINTS_MONTHLY_CAP_REACHED` | 429 | User has reached the monthly earning cap. | Wait until the next month. Monthly cap triggers an error rather than silent drop. |
| `POINTS_LIFETIME_CAP_REACHED` | 429 | User has reached the lifetime earning cap. | This is a permanent cap. Contact admin for adjustment if appropriate. |
| `POINTS_VELOCITY_EXCEEDED` | 429 | Too many earning events in a short time window. Rate limited. | Slow down request rate. Wait for the velocity window to pass. |
| `POINTS_FRAUD_DETECTED` | 403 | Transaction blocked by fraud detection system. | Flagged for review. Contact support if this is a false positive. |
| `POINTS_TRANSFER_DISABLED` | 400 | Point transfers are not enabled for this point type. | Check point type configuration. Enable `transferable` flag if appropriate. |
| `POINTS_TRANSFER_LIMIT_EXCEEDED` | 400 | Transfer exceeds per-transaction, daily, or monthly transfer limits. | Reduce transfer amount. Wait for the daily/monthly limit to reset. |
| `POINTS_TRANSFER_SELF` | 400 | Cannot transfer points to yourself (except for cross-type exchange). | Use a different recipient. For cross-type, use the exchange endpoint. |
| `POINTS_TRANSFER_RECIPIENT_NOT_FOUND` | 404 | Recipient user does not exist in this venture. | Verify recipient user ID. Ensure they have an account in this venture. |
| `POINTS_HOLD_NOT_FOUND` | 404 | The specified hold does not exist. | Verify hold ID. The hold may have already been committed or released. |
| `POINTS_HOLD_EXPIRED` | 410 | The hold has expired and was automatically released. | Place a new hold if still needed. Adjust hold duration for future holds. |
| `POINTS_HOLD_ALREADY_COMMITTED` | 409 | The hold has already been committed to a transaction. | Check the associated transaction. This hold cannot be modified. |
| `POINTS_HOLD_ALREADY_RELEASED` | 409 | The hold has already been released. | Points are already back in available balance. Place a new hold if needed. |
| `POINTS_MIN_BALANCE_VIOLATION` | 400 | Redemption would reduce balance below the configured minimum. | Reduce redemption amount. The minimum balance after redemption is enforced by the rule. |
| `POINTS_MIN_REDEMPTION_NOT_MET` | 400 | Redemption amount is below the minimum required by the rule. | Increase the redemption amount to meet the minimum threshold. |
| `POINTS_MAX_REDEMPTION_EXCEEDED` | 400 | Redemption amount exceeds the maximum allowed by the rule. | Reduce the redemption amount. Split into multiple redemptions if needed. |
| `POINTS_REDEMPTION_LIMIT_EXCEEDED` | 429 | User has exceeded the maximum number of redemptions per period. | Wait for the period to reset. Check `maxRedemptionsPerUser` configuration. |
| `POINTS_REDEMPTION_INVENTORY_EXHAUSTED` | 410 | The redemption rule has no remaining inventory. | This reward is sold out. Choose a different redemption option. |
| `POINTS_REDEMPTION_REQUIRES_APPROVAL` | 202 | Redemption queued for manual approval. | Wait for admin approval. The points are held until approved or rejected. |
| `POINTS_EXCHANGE_RATE_NOT_FOUND` | 404 | No exchange rate configured between these point types. | Configure an exchange rate. Cross-type transfers require an active rate. |
| `POINTS_EXCHANGE_RATE_INACTIVE` | 400 | The exchange rate exists but is currently inactive. | Activate the exchange rate or wait for it to become active. |
| `POINTS_EXCHANGE_MIN_NOT_MET` | 400 | Exchange amount is below the minimum required. | Increase the exchange amount to meet the minimum threshold. |
| `POINTS_EXCHANGE_DAILY_LIMIT` | 429 | Daily exchange volume limit reached. | Wait until tomorrow. The daily exchange limit protects against rate manipulation. |
| `POINTS_EXPIRATION_POLICY_CONFLICT` | 409 | Only one expiration policy can be active per point type per venture. | Deactivate the existing policy before creating a new one. |
| `POINTS_RECONCILIATION_MISMATCH` | 500 | Cached balance does not match ledger-derived balance. Auto-corrected. | This is logged but auto-corrected. Investigate if recurring — may indicate a bug. |
| `POINTS_VENTURE_MISMATCH` | 403 | Operation attempted across ventures without cross-venture permission. | Ensure all entities belong to the same venture, or enable cross-venture exchange. |
| `POINTS_NEGATIVE_AMOUNT` | 400 | Transaction amount must be positive. | Provide a positive amount. The transaction type (CREDIT/DEBIT) determines direction. |
| `POINTS_PRECISION_OVERFLOW` | 400 | Amount exceeds the configured precision for this point type. | Round to the correct number of decimal places for this point type. |

---

## Security

### Row-Level Security (RLS)

All point tables enforce multi-tenant isolation through PostgreSQL RLS policies:

```sql
-- Every table has venture_id RLS
CREATE POLICY {table}_venture_rls ON {table}
  USING (venture_id = current_setting('app.current_venture_id')::text);

-- Balance and transaction tables have user-level RLS
CREATE POLICY point_balances_user_rls ON point_balances
  FOR SELECT USING (
    user_id = current_setting('app.current_user_id')::text
    OR current_setting('app.current_role')::text IN ('admin', 'service')
  );

-- Service role can bypass user-level RLS for system operations
-- (used by expiration cron, analytics aggregation, etc.)
ALTER TABLE point_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE point_balances ENABLE ROW LEVEL SECURITY;
ALTER TABLE point_transfers ENABLE ROW LEVEL SECURITY;
ALTER TABLE point_holds ENABLE ROW LEVEL SECURITY;
```

**Key RLS behaviors:**

| Role | Balance Read | Balance Write | Transaction Read | Config Read | Config Write |
|---|---|---|---|---|---|
| `user` | Own only | Never (via service) | Own only | Active rules only | Never |
| `admin` | All in venture | Via service | All in venture | All | All |
| `service` | All in venture | Yes | All in venture | All | All |

### Double-Entry Integrity

The ledger enforces double-entry accounting at the database level:

```sql
-- Trigger: Every CREDIT transaction must have a corresponding system DEBIT
CREATE OR REPLACE FUNCTION enforce_double_entry()
RETURNS TRIGGER AS $$
BEGIN
  -- For CREDIT transactions, verify the issuance pool is debited
  IF NEW.type = 'CREDIT' AND NEW.user_id NOT LIKE 'sys_%' THEN
    INSERT INTO point_transactions (
      id, venture_id, user_id, point_type_id, type, status,
      amount, balance_after, idempotency_key, description,
      related_transaction_id, created_at, updated_at
    ) VALUES (
      gen_random_ulid(), NEW.venture_id, 'sys_issuance_pool',
      NEW.point_type_id, 'DEBIT', 'COMMITTED',
      -NEW.amount, 0, NEW.idempotency_key || ':pool',
      'Issuance pool debit for ' || NEW.id,
      NEW.id, NOW(), NOW()
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

**Reconciliation checks** run periodically to verify:
1. Sum of all user balances = Sum of issuance pool debits - redemption pool credits - expiration pool credits
2. Each user's `point_balances.total` = SUM of their committed transactions
3. `available + held = total` for every balance record

### Anti-Fraud Protections

| Layer | Protection | Implementation |
|---|---|---|
| **Input validation** | Amount bounds, type checking | Zod schemas on every endpoint |
| **Idempotency** | Prevent duplicate transactions | Unique constraint on `(venture_id, idempotency_key)` |
| **Velocity limits** | Rate limit earning events | Sliding window counter in Redis/PostgreSQL |
| **Earning caps** | Max points per period | Aggregation query before each earning |
| **Pattern detection** | Circular transfers, IP correlation | Background analysis job |
| **Manual review** | Flag suspicious transactions | Admin dashboard with review queue |
| **Balance locks** | Prevent race conditions | `SELECT ... FOR UPDATE` on balance rows |
| **Audit logging** | IP, user agent, initiator | Stored on every transaction |

### Rate Limiting

Point operations are rate-limited at the tRPC layer:

```typescript
// Rate limits per endpoint
const pointsRateLimits = {
  'points.earn':        { windowMs: 60_000, maxRequests: 100 },  // 100/min
  'points.redeem':      { windowMs: 60_000, maxRequests: 20 },   // 20/min
  'points.transfer':    { windowMs: 60_000, maxRequests: 10 },   // 10/min
  'points.getBalance':  { windowMs: 60_000, maxRequests: 300 },  // 300/min
  'points.history':     { windowMs: 60_000, maxRequests: 60 },   // 60/min
};
```

### Audit Trail

Every point transaction stores:

- **Who** — `userId`, `initiatedBy` (for admin actions)
- **What** — `type`, `amount`, `description`, `metadata`
- **When** — `createdAt` (immutable)
- **Where** — `ipAddress`, `userAgent`
- **Why** — `sourceEvent`, `ruleId`, `voidReason`
- **Context** — `idempotencyKey`, `relatedTransactionId`, `holdId`, `transferId`

Transactions are **append-only**. Voids create new reversal entries; they never modify the original. The full history is always preserved.

---

## Environment Variables

| Variable | Required | Default | Description |
|---|---|---|---|
| `POINTS_DATABASE_URL` | Yes | — | PostgreSQL connection string for point tables |
| `POINTS_REDIS_URL` | No | — | Redis URL for balance caching and velocity counters |
| `POINTS_REDPANDA_BROKERS` | Yes | — | Comma-separated Redpanda broker addresses |
| `POINTS_REDPANDA_TOPIC_PREFIX` | No | `points` | Topic prefix for point events (e.g., `points.earned`) |
| `POINTS_REDPANDA_GROUP_ID` | No | `points-service` | Consumer group ID for point event processing |
| `POINTS_BALANCE_CACHE_TTL_MS` | No | `30000` | Balance cache TTL in milliseconds (0 = no cache) |
| `POINTS_EXPIRATION_CRON` | No | `0 * * * *` | Cron expression for expiration processing (default: hourly) |
| `POINTS_EXPIRATION_BATCH_SIZE` | No | `1000` | Number of batches to process per expiration run |
| `POINTS_RECONCILIATION_CRON` | No | `0 3 * * *` | Cron expression for balance reconciliation (default: 3 AM daily) |
| `POINTS_HOLD_CLEANUP_CRON` | No | `*/15 * * * *` | Cron for expired hold cleanup (default: every 15 min) |
| `POINTS_MAX_HOLD_DURATION_MS` | No | `86400000` | Maximum hold duration in ms (default: 24 hours) |
| `POINTS_FRAUD_VELOCITY_WINDOW_MS` | No | `300000` | Velocity check window in ms (default: 5 minutes) |
| `POINTS_FRAUD_ENABLED` | No | `true` | Enable/disable fraud checks (disable only in dev) |
| `POINTS_ANALYTICS_RETENTION_DAYS` | No | `730` | Days to retain detailed analytics data (default: 2 years) |
| `POINTS_LOG_LEVEL` | No | `info` | Log level for the points module |
| `POINTS_ENCRYPTION_KEY` | No | — | AES-256 key for encrypting sensitive metadata |
| `POINTS_ENABLE_CROSS_VENTURE` | No | `false` | Enable cross-venture point exchanges |

**Example `.env`:**

```env
POINTS_DATABASE_URL=postgresql://user:pass@db.supabase.co:5432/postgres
POINTS_REDIS_URL=redis://localhost:6379/2
POINTS_REDPANDA_BROKERS=localhost:9092
POINTS_REDPANDA_TOPIC_PREFIX=points
POINTS_BALANCE_CACHE_TTL_MS=30000
POINTS_EXPIRATION_BATCH_SIZE=1000
POINTS_FRAUD_ENABLED=true
POINTS_LOG_LEVEL=info
```

---

## Dependencies

### Internal Dependencies

| Package | Version | Purpose |
|---|---|---|
| `@mcv/core` | `workspace:*` | Base types, error classes, logging, config |
| `@mcv/db` | `workspace:*` | Drizzle ORM setup, migration utilities, connection pool |
| `@mcv/auth` | `workspace:*` | User context, venture scoping, permission checks |
| `@mcv/events` | `workspace:*` | Redpanda producer/consumer abstractions |
| `@mcv/cache` | `workspace:*` | Redis cache layer for balance caching |
| `@mcv/notifications` | `workspace:*` | Send expiration warnings and transaction notifications |
| `@mcv/engagement/tiers` | `workspace:*` | Tier resolution for multiplier calculation |
| `@mcv/engagement/streaks` | `workspace:*` | Combo multiplier from login/activity streaks |

### External Dependencies

| Package | Version | Purpose |
|---|---|---|
| `drizzle-orm` | `^0.34.0` | SQL query builder and ORM |
| `@trpc/server` | `^11.0.0` | tRPC router definitions |
| `zod` | `^3.23.0` | Input validation schemas |
| `ulid` | `^2.3.0` | Time-ordered unique IDs for transactions |
| `kafkajs` | `^2.2.4` | Redpanda/Kafka client for event streaming |
| `ioredis` | `^5.4.0` | Redis client for caching and counters |
| `decimal.js` | `^10.4.3` | Precise decimal arithmetic for point calculations |
| `croner` | `^8.1.0` | Cron scheduling for expiration and reconciliation jobs |
| `pino` | `^9.0.0` | Structured logging |

### Peer Dependencies

| Package | Version | Purpose |
|---|---|---|
| `@supabase/supabase-js` | `^2.45.0` | Supabase client for RLS context setting |
| `postgres` | `^3.4.0` | PostgreSQL driver |

---

## Testing

### Unit Tests

Unit tests cover all business logic in isolation with mocked dependencies.

```typescript
// __tests__/services/earning.service.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { EarningService } from '../../services/earning.service';
import { FraudService } from '../../services/fraud.service';
import { TierService } from '../../services/tier.service';

describe('EarningService', () => {
  let earningService: EarningService;
  let mockFraudService: FraudService;
  let mockTierService: TierService;
  let mockDb: any;

  beforeEach(() => {
    mockFraudService = {
      check: vi.fn().mockResolvedValue({ verdict: 'ALLOW', allowedAmount: 100 }),
    } as any;
    mockTierService = {
      getUserTier: vi.fn().mockResolvedValue({ earnMultiplier: 1.0 }),
      getActivePromotions: vi.fn().mockResolvedValue([]),
      getComboMultiplier: vi.fn().mockResolvedValue(null),
    } as any;
    mockDb = createMockDb();
    earningService = new EarningService(mockDb, mockFraudService, mockTierService);
  });

  describe('earn()', () => {
    it('should award points with correct multiplier', async () => {
      mockTierService.getUserTier = vi.fn().mockResolvedValue({
        name: 'Silver',
        earnMultiplier: 1.5,
      });

      const result = await earningService.earn({
        userId: 'usr_123',
        ventureId: 'ven_456',
        pointTypeSlug: 'loyalty',
        eventType: 'purchase_complete',
        eventValue: 5000, // $50.00
        idempotencyKey: 'purchase:ord_789',
        metadata: { orderId: 'ord_789' },
      });

      expect(result.earned).toBe(true);
      expect(result.amount).toBe(750); // 500 base × 1.5 Silver
      expect(result.multiplierApplied).toBe(1.5);
      expect(result.baseAmount).toBe(500);
    });

    it('should reject duplicate idempotency keys', async () => {
      // First earn succeeds
      await earningService.earn({
        userId: 'usr_123',
        ventureId: 'ven_456',
        pointTypeSlug: 'loyalty',
        eventType: 'purchase_complete',
        eventValue: 5000,
        idempotencyKey: 'purchase:ord_789',
        metadata: {},
      });

      // Second earn with same key returns existing result
      const result = await earningService.earn({
        userId: 'usr_123',
        ventureId: 'ven_456',
        pointTypeSlug: 'loyalty',
        eventType: 'purchase_complete',
        eventValue: 5000,
        idempotencyKey: 'purchase:ord_789',
        metadata: {},
      });

      expect(result.earned).toBe(true);
      expect(result.duplicate).toBe(true);
    });

    it('should respect earning caps', async () => {
      mockFraudService.check = vi.fn().mockResolvedValue({
        verdict: 'REDUCE',
        allowedAmount: 200, // reduced from requested 500
        reasons: ['daily_cap: 200 remaining of 5000'],
      });

      const result = await earningService.earn({
        userId: 'usr_123',
        ventureId: 'ven_456',
        pointTypeSlug: 'loyalty',
        eventType: 'purchase_complete',
        eventValue: 5000,
        idempotencyKey: 'purchase:ord_999',
        metadata: {},
      });

      expect(result.earned).toBe(true);
      expect(result.amount).toBe(200); // capped
      expect(result.capped).toBe(true);
    });

    it('should block fraudulent transactions', async () => {
      mockFraudService.check = vi.fn().mockResolvedValue({
        verdict: 'DENY',
        allowedAmount: 0,
        reasons: ['velocity_exceeded: 50+ events in 1 hour'],
      });

      const result = await earningService.earn({
        userId: 'usr_123',
        ventureId: 'ven_456',
        pointTypeSlug: 'loyalty',
        eventType: 'review_submitted',
        eventValue: 0,
        idempotencyKey: 'review:rev_999',
        metadata: {},
      });

      expect(result.earned).toBe(false);
      expect(result.reason).toContain('velocity_exceeded');
    });

    it('should stack tier + promo + combo multipliers', async () => {
      mockTierService.getUserTier = vi.fn().mockResolvedValue({
        name: 'Gold',
        earnMultiplier: 2.0,
      });
      mockTierService.getActivePromotions = vi.fn().mockResolvedValue([
        { multiplier: 2.0, name: 'Double Points Weekend' },
      ]);
      mockTierService.getComboMultiplier = vi.fn().mockResolvedValue({
        multiplier: 1.2,
        streakDays: 7,
      });

      const result = await earningService.earn({
        userId: 'usr_123',
        ventureId: 'ven_456',
        pointTypeSlug: 'loyalty',
        eventType: 'purchase_complete',
        eventValue: 1000, // $10 = 100 base points
        idempotencyKey: 'purchase:ord_combo',
        metadata: {},
      });

      // 100 base × 2.0 Gold × 2.0 promo × 1.2 combo = 480
      expect(result.amount).toBe(480);
      expect(result.multiplierApplied).toBe(4.8);
    });
  });
});
```

### Integration Tests

Integration tests run against a real PostgreSQL database (via Supabase local) and verify end-to-end flows.

```typescript
// __tests__/integration/point-lifecycle.test.ts
import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { createTestContext } from '../helpers/test-context';

describe('Point Lifecycle (Integration)', () => {
  let ctx: TestContext;

  beforeAll(async () => {
    ctx = await createTestContext();
    await ctx.migrate();
  });

  afterAll(async () => {
    await ctx.cleanup();
  });

  beforeEach(async () => {
    await ctx.truncatePointTables();
  });

  it('should complete full earn → hold → redeem lifecycle', async () => {
    const { pointService, ventureId, userId, pointTypeId } = ctx;

    // 1. Earn points
    const earnResult = await pointService.earn({
      userId,
      ventureId,
      pointTypeSlug: 'loyalty',
      eventType: 'purchase_complete',
      eventValue: 10000,
      idempotencyKey: 'test:lifecycle:earn',
      metadata: {},
    });
    expect(earnResult.earned).toBe(true);
    expect(earnResult.amount).toBe(1000);

    // 2. Verify balance
    const balance = await pointService.getBalance(userId, pointTypeId);
    expect(balance.available).toBe(1000);
    expect(balance.total).toBe(1000);
    expect(balance.held).toBe(0);

    // 3. Place hold
    const hold = await pointService.placeHold({
      userId,
      ventureId,
      pointTypeId,
      amount: 300,
      reference: 'order:test_order',
      reason: 'Pending order',
      expiresAt: new Date(Date.now() + 3600000),
    });
    expect(hold.status).toBe('ACTIVE');

    // 4. Verify balance with hold
    const balanceWithHold = await pointService.getBalance(userId, pointTypeId);
    expect(balanceWithHold.available).toBe(700);
    expect(balanceWithHold.held).toBe(300);
    expect(balanceWithHold.total).toBe(1000);

    // 5. Commit hold (redeem)
    const redeemResult = await pointService.commitHold(hold.id);
    expect(redeemResult.redeemed).toBe(true);

    // 6. Verify final balance
    const finalBalance = await pointService.getBalance(userId, pointTypeId);
    expect(finalBalance.available).toBe(700);
    expect(finalBalance.held).toBe(0);
    expect(finalBalance.total).toBe(700);

    // 7. Verify transaction history
    const txns = await pointService.listTransactions(userId, pointTypeId, {
      limit: 10,
      offset: 0,
    });
    expect(txns.items).toHaveLength(3); // CREDIT, HOLD, DEBIT (from committed hold)
  });

  it('should enforce FIFO expiration correctly', async () => {
    const { pointService, ventureId, userId, pointTypeId } = ctx;

    // Earn 3 batches at different times with 1-day TTL
    for (let i = 0; i < 3; i++) {
      await pointService.earn({
        userId,
        ventureId,
        pointTypeSlug: 'loyalty',
        eventType: 'purchase_complete',
        eventValue: 1000,
        idempotencyKey: `test:fifo:batch_${i}`,
        metadata: {},
      });
    }

    // Fast-forward batch 0 to be expired
    await ctx.expireBatch(0);

    // Process expirations
    const result = await pointService.processExpirations(ventureId);
    expect(result.totalPointsExpired).toBe(100); // first batch only
    expect(result.batchesProcessed).toBe(1);

    // Verify balance
    const balance = await pointService.getBalance(userId, pointTypeId);
    expect(balance.available).toBe(200); // 300 - 100 expired
    expect(balance.lifetimeExpired).toBe(100);
  });

  it('should handle concurrent earn requests safely', async () => {
    const { pointService, ventureId, userId, pointTypeId } = ctx;

    // Fire 10 concurrent earn requests
    const promises = Array.from({ length: 10 }, (_, i) =>
      pointService.earn({
        userId,
        ventureId,
        pointTypeSlug: 'loyalty',
        eventType: 'login_daily',
        eventValue: 0,
        idempotencyKey: `test:concurrent:${i}`,
        metadata: {},
      }),
    );

    const results = await Promise.all(promises);
    const earned = results.filter((r) => r.earned);
    expect(earned.length).toBe(10);

    // Verify final balance is correct (no double-counting)
    const balance = await pointService.getBalance(userId, pointTypeId);
    expect(balance.total).toBe(earned.reduce((sum, r) => sum + r.amount, 0));
  });
});
```

### Load Tests

Load tests verify performance under realistic concurrency using k6 or custom scripts.

```typescript
// __tests__/load/earn-throughput.test.ts
import { describe, it, expect } from 'vitest';
import { createTestContext } from '../helpers/test-context';

describe('Point Earning Throughput', () => {
  it('should handle 1000 concurrent earnings within 5 seconds', async () => {
    const ctx = await createTestContext();
    const userIds = await ctx.createTestUsers(100);

    const start = Date.now();
    const promises: Promise<any>[] = [];

    for (let i = 0; i < 1000; i++) {
      const userId = userIds[i % userIds.length];
      promises.push(
        ctx.pointService.earn({
          userId,
          ventureId: ctx.ventureId,
          pointTypeSlug: 'loyalty',
          eventType: 'purchase_complete',
          eventValue: Math.floor(Math.random() * 10000),
          idempotencyKey: `load:${i}`,
          metadata: {},
        }),
      );
    }

    const results = await Promise.allSettled(promises);
    const elapsed = Date.now() - start;

    const succeeded = results.filter((r) => r.status === 'fulfilled').length;
    const failed = results.filter((r) => r.status === 'rejected').length;

    console.log(`Throughput: ${succeeded} succeeded, ${failed} failed in ${elapsed}ms`);
    console.log(`Rate: ${(succeeded / (elapsed / 1000)).toFixed(0)} txns/sec`);

    expect(elapsed).toBeLessThan(5000);
    expect(succeeded).toBeGreaterThan(950); // allow up to 5% failure rate under load
  });
});
```

### Test Fixtures

Reusable fixtures for point testing:

```typescript
// __tests__/fixtures/point-fixtures.ts
import type { PointType, EarningRule, RedemptionRule, ExpirationPolicy } from '@mcv/engagement/points';

export const fixtures = {
  pointType: {
    loyalty: (ventureId: string): Partial<PointType> => ({
      ventureId,
      slug: 'loyalty',
      name: 'Test Loyalty Points',
      symbol: '⭐',
      precision: 0,
      config: {
        monetaryValue: 0.01,
        transferable: true,
        exchangeable: false,
        expires: true,
        defaultTtlDays: 365,
        maxBalance: 1_000_000,
        minRedemption: 100,
        allowNegative: false,
        display: { format: '{value} pts', separator: ',', showDecimals: false },
      },
    }),
  },

  earningRule: {
    purchase: (ventureId: string, pointTypeId: string): Partial<EarningRule> => ({
      ventureId,
      pointTypeId,
      name: 'Test Purchase Earning',
      eventType: 'purchase_complete' as any,
      config: {
        fixedAmount: null,
        percentageOfValue: 10,
        minAmount: 1,
        maxAmount: 10_000,
        conditions: [],
        cooldownMs: null,
        maxOccurrences: null,
        stackable: true,
        bonusMultiplier: 1.0,
      },
      priority: 0,
    }),

    login: (ventureId: string, pointTypeId: string): Partial<EarningRule> => ({
      ventureId,
      pointTypeId,
      name: 'Test Daily Login',
      eventType: 'login_daily' as any,
      config: {
        fixedAmount: 10,
        percentageOfValue: null,
        minAmount: 10,
        maxAmount: 10,
        conditions: [],
        cooldownMs: 86400000, // 24h cooldown
        maxOccurrences: { count: 1, period: 'DAILY' as any },
        stackable: false,
        bonusMultiplier: 1.0,
      },
      priority: 0,
    }),
  },

  redemptionRule: {
    discount: (ventureId: string, pointTypeId: string): Partial<RedemptionRule> => ({
      ventureId,
      pointTypeId,
      name: 'Test $5 Discount',
      redemptionType: 'DISCOUNT' as any,
      pointsCost: 500,
      redemptionValue: {
        type: 'fixed_amount',
        monetaryValue: 5.00,
        percentage: null,
        currency: 'USD',
        reference: null,
        metadata: {},
      },
      allowPartial: true,
      minPoints: 100,
      maxPoints: 5000,
      minBalanceAfter: 0,
      requiresApproval: false,
    }),
  },

  expirationPolicy: {
    annual: (ventureId: string, pointTypeId: string): Partial<ExpirationPolicy> => ({
      ventureId,
      pointTypeId,
      name: 'Test Annual Expiration',
      strategy: 'FIFO' as any,
      ttlDays: 365,
      gracePeriodDays: 30,
      warningDays: [30, 7, 1],
      sendWarnings: false, // disable in tests
      allowReinstatement: false,
      activityResetsExpiration: false,
      activityTypes: [],
    }),
  },
};

// Helper to create a fully configured test environment
export async function createTestPointEnvironment(ctx: TestContext) {
  const pointType = await ctx.pointService.createPointType(
    fixtures.pointType.loyalty(ctx.ventureId) as any,
  );

  const earningRule = await ctx.pointService.createEarningRule(
    fixtures.earningRule.purchase(ctx.ventureId, pointType.id) as any,
  );

  const redemptionRule = await ctx.pointService.createRedemptionRule(
    fixtures.redemptionRule.discount(ctx.ventureId, pointType.id) as any,
  );

  const expirationPolicy = await ctx.pointService.createExpirationPolicy(
    fixtures.expirationPolicy.annual(ctx.ventureId, pointType.id) as any,
  );

  return { pointType, earningRule, redemptionRule, expirationPolicy };
}
```

---

*Last updated: 2025-02-08*
*Module version: 0.1.0*
*Generated from source — do not edit manually.*