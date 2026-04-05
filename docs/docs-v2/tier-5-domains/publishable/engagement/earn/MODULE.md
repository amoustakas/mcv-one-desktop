# @mcv/engagement/earn

> **Earn Mechanics** — Event-driven reward engine that evaluates configurable earn rules to award points, XP, tokens, items, and achievements based on user actions across all MCV.ONE ventures.

**Domain:** `engagement` · **Submodule:** `earn` · **Tier:** 5 (Domain)
**Package:** `@mcv/engagement/earn`
**Since:** 0.1.0
**Status:** Stable

---

## Table of Contents

- [Purpose](#purpose)
- [Exports](#exports)
- [Architecture](#architecture)
  - [Earn Pipeline Overview](#earn-pipeline-overview)
  - [Event Flow](#event-flow)
  - [Condition Evaluation Engine](#condition-evaluation-engine)
  - [Reward Distribution](#reward-distribution)
  - [Multi-Tenant Isolation](#multi-tenant-isolation)
- [Core Interfaces](#core-interfaces)
  - [EarnService](#earnservice)
  - [EarnRule](#earnrule)
  - [EarnCondition](#earncondition)
  - [EarnReward](#earnreward)
  - [EarnEvent](#earnevent)
  - [EarnMultiplier](#earnmultiplier)
  - [EarnCap](#earncap)
  - [EarnSchedule](#earnschedule)
  - [EarnABTest](#earnabtest)
  - [EarnHistory](#earnhistory)
  - [EarnRuleVariant](#earnrulevariant)
  - [EarnBudget](#earnbudget)
  - [EarnVelocityCheck](#earnvelocitycheck)
  - [EarnDisputeResolution](#earndisputeresolution)
- [Database Schemas](#database-schemas)
  - [earn_rules](#earn_rules)
  - [earn_conditions](#earn_conditions)
  - [earn_rewards](#earn_rewards)
  - [earn_events](#earn_events)
  - [earn_multipliers](#earn_multipliers)
  - [earn_caps](#earn_caps)
  - [earn_schedules](#earn_schedules)
  - [earn_ab_tests](#earn_ab_tests)
  - [earn_history](#earn_history)
  - [Row-Level Security Policies](#row-level-security-policies)
- [Code Examples](#code-examples)
  - [1. Define a Simple Earn Rule](#1-define-a-simple-earn-rule)
  - [2. Complex Multi-Condition Rule with Multipliers](#2-complex-multi-condition-rule-with-multipliers)
  - [3. Event Matching and Pattern Processing](#3-event-matching-and-pattern-processing)
  - [4. Rate Limiting and Cap Enforcement](#4-rate-limiting-and-cap-enforcement)
  - [5. A/B Testing Earn Rules](#5-ab-testing-earn-rules)
  - [6. Cross-Venture Earn Rule Inheritance](#6-cross-venture-earn-rule-inheritance)
  - [7. Earn History Reversal and Dispute Resolution](#7-earn-history-reversal-and-dispute-resolution)
  - [8. Scheduled Boost Periods with Budget Controls](#8-scheduled-boost-periods-with-budget-controls)
- [Error Codes](#error-codes)
- [Security](#security)
  - [Multi-Tenant Isolation](#multi-tenant-isolation-1)
  - [Anti-Abuse Protections](#anti-abuse-protections)
  - [Data Privacy](#data-privacy)
  - [Audit Trail](#audit-trail)
  - [Authorization Model](#authorization-model)
- [Environment Variables](#environment-variables)
- [Dependencies](#dependencies)
- [Testing](#testing)
  - [Unit Tests](#unit-tests)
  - [Integration Tests](#integration-tests)
  - [Load Tests](#load-tests)
  - [Test Utilities](#test-utilities)

---

## Purpose

The Earn module is the central reward-granting engine of the MCV.ONE engagement platform. It bridges user activity (captured as events flowing through Redpanda) with tangible rewards — points, XP, tokens (EDGE), digital items, achievements, coupons, and custom reward types. Every venture on the platform can define its own earn rules while inheriting platform-wide defaults, creating a layered, composable reward system.

### What This Module Does

1. **Listens** to streaming events from Redpanda topics (`engagement.events.*`) and evaluates them against configured earn rules in real time.
2. **Evaluates** conditions attached to each rule — user attributes, time windows, frequency limits, segment membership, streak status, and compound boolean expressions.
3. **Calculates** rewards including base amounts, multipliers (time-based, tier-based, combo, streak), and applies rate-limiting caps before awarding.
4. **Distributes** rewards by emitting downstream events to the appropriate subsystems — the points ledger, XP tracker, token minter, item inventory, or achievement unlocker.
5. **Records** a full audit trail of every earn event, enabling reversal, dispute resolution, analytics, and compliance reporting.

### What This Module Does NOT Do

- **Does not manage point balances** — that is `@mcv/engagement/points` (the ledger).
- **Does not define quests or challenges** — that is `@mcv/engagement/quests`.
- **Does not handle tier promotions** — that is `@mcv/engagement/tiers`.
- **Does not manage leaderboards** — that is `@mcv/engagement/leaderboards`.
- **Does not process redemptions** — that is `@mcv/engagement/redeem`.

The Earn module is the **"if this, then reward"** engine. It consumes events, evaluates rules, and produces reward instructions. Other modules handle the downstream accounting and user-facing experiences.

### Design Philosophy

- **Event-driven, not request-driven:** Earn rules react to events, not API calls. This decouples reward logic from application code.
- **Configurable, not coded:** Earn rules are data (stored in PostgreSQL), not hardcoded logic. Operators configure rules through admin interfaces.
- **Composable:** Rules, conditions, multipliers, and caps are independent entities that compose together. A rule references conditions; conditions are reusable across rules.
- **Auditable:** Every reward granted has a full trace: which rule matched, which conditions were evaluated, what multipliers applied, what caps were checked, and the final amount awarded.
- **Multi-tenant by default:** Every earn rule belongs to a venture (or the platform). Row-Level Security ensures complete isolation.

---

## Exports

```typescript
// ── Service ──────────────────────────────────────────────────────────
export { EarnService }                    from './services/earn.service';
export { EarnPipeline }                   from './services/earn.pipeline';
export { ConditionEvaluator }             from './services/condition-evaluator';
export { RewardCalculator }               from './services/reward-calculator';
export { MultiplierResolver }             from './services/multiplier-resolver';
export { CapEnforcer }                    from './services/cap-enforcer';
export { EarnScheduler }                  from './services/earn-scheduler';
export { EarnABTestService }              from './services/earn-ab-test.service';
export { EarnHistoryService }             from './services/earn-history.service';
export { EarnDisputeService }             from './services/earn-dispute.service';
export { EarnBudgetService }              from './services/earn-budget.service';
export { EarnInheritanceService }         from './services/earn-inheritance.service';

// ── Router ───────────────────────────────────────────────────────────
export { earnRouter }                     from './router';
export type { EarnRouter }                from './router';

// ── Schemas (Drizzle) ────────────────────────────────────────────────
export { earnRules }                      from './schemas/earn-rules';
export { earnConditions }                 from './schemas/earn-conditions';
export { earnRewards }                    from './schemas/earn-rewards';
export { earnEvents }                     from './schemas/earn-events';
export { earnMultipliers }                from './schemas/earn-multipliers';
export { earnCaps }                       from './schemas/earn-caps';
export { earnSchedules }                  from './schemas/earn-schedules';
export { earnAbTests }                    from './schemas/earn-ab-tests';
export { earnHistory }                    from './schemas/earn-history';

// ── Types ────────────────────────────────────────────────────────────
export type { EarnRule }                  from './types/earn-rule';
export type { EarnCondition }             from './types/earn-condition';
export type { EarnConditionOperator }     from './types/earn-condition';
export type { EarnConditionType }         from './types/earn-condition';
export type { EarnReward }                from './types/earn-reward';
export type { EarnRewardType }            from './types/earn-reward';
export type { EarnEvent }                 from './types/earn-event';
export type { EarnMultiplier }            from './types/earn-multiplier';
export type { EarnMultiplierType }        from './types/earn-multiplier';
export type { EarnCap }                   from './types/earn-cap';
export type { EarnCapWindow }             from './types/earn-cap';
export type { EarnSchedule }              from './types/earn-schedule';
export type { EarnABTest }                from './types/earn-ab-test';
export type { EarnABTestVariant }         from './types/earn-ab-test';
export type { EarnHistory }               from './types/earn-history';
export type { EarnRuleVariant }           from './types/earn-rule-variant';
export type { EarnBudget }                from './types/earn-budget';
export type { EarnVelocityCheck }         from './types/earn-velocity-check';
export type { EarnDisputeResolution }     from './types/earn-dispute';
export type { EarnRuleStatus }            from './types/earn-rule';
export type { EarnEventMatchPattern }     from './types/earn-event';
export type { EarnPipelineResult }        from './types/earn-pipeline';
export type { EarnEvaluationContext }     from './types/earn-pipeline';

// ── Validators (Zod) ────────────────────────────────────────────────
export { createEarnRuleSchema }           from './validators/earn-rule.validator';
export { updateEarnRuleSchema }           from './validators/earn-rule.validator';
export { createEarnConditionSchema }      from './validators/earn-condition.validator';
export { createEarnRewardSchema }         from './validators/earn-reward.validator';
export { createEarnMultiplierSchema }     from './validators/earn-multiplier.validator';
export { createEarnCapSchema }            from './validators/earn-cap.validator';
export { createEarnScheduleSchema }       from './validators/earn-schedule.validator';
export { createEarnABTestSchema }         from './validators/earn-ab-test.validator';
export { earnDisputeSchema }              from './validators/earn-dispute.validator';

// ── Constants ────────────────────────────────────────────────────────
export { EARN_ERROR_CODES }               from './constants/error-codes';
export { EARN_DEFAULTS }                  from './constants/defaults';
export { EARN_TOPICS }                    from './constants/topics';
export { EARN_METRICS }                   from './constants/metrics';

// ── Utilities ────────────────────────────────────────────────────────
export { buildEarnEventMatcher }          from './utils/event-matcher';
export { calculateEffectiveReward }       from './utils/reward-math';
export { resolveMultiplierStack }         from './utils/multiplier-stack';
export { evaluateConditionTree }          from './utils/condition-tree';
export { earnRuleToSnapshot }             from './utils/rule-snapshot';

// ── Testing ──────────────────────────────────────────────────────────
export { createTestEarnRule }             from './testing/factories';
export { createTestEarnEvent }            from './testing/factories';
export { createTestEarnCondition }        from './testing/factories';
export { MockEarnPipeline }              from './testing/mocks';
export { EarnTestHarness }               from './testing/harness';
```

---

## Architecture

### Earn Pipeline Overview

The Earn module operates as a streaming event processor. Events flow in from Redpanda, pass through a multi-stage evaluation pipeline, and produce reward instructions that are emitted back to Redpanda for downstream consumption.

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                          EARN PIPELINE                                       │
│                                                                              │
│  ┌─────────┐    ┌──────────┐    ┌───────────┐    ┌──────────┐    ┌────────┐ │
│  │ Redpanda │───▶│  Event   │───▶│ Condition │───▶│  Reward  │───▶│ Emit   │ │
│  │ Consumer │    │ Matcher  │    │ Evaluator │    │Calculator│    │ & Log  │ │
│  └─────────┘    └──────────┘    └───────────┘    └──────────┘    └────────┘ │
│       │              │                │                │              │       │
│       │              │                │                │              │       │
│       ▼              ▼                ▼                ▼              ▼       │
│  ┌─────────┐    ┌──────────┐    ┌───────────┐    ┌──────────┐    ┌────────┐ │
│  │  Event   │    │  Rule    │    │  User     │    │Multiplier│    │Redpanda│ │
│  │  Schema  │    │  Index   │    │  Context  │    │ Resolver │    │Producer│ │
│  │Validation│    │ (Memory) │    │  (Query)  │    │          │    │        │ │
│  └─────────┘    └──────────┘    └───────────┘    └──────────┘    └────────┘ │
│                                                       │              │       │
│                                                       ▼              ▼       │
│                                                  ┌──────────┐    ┌────────┐ │
│                                                  │   Cap     │    │ Earn   │ │
│                                                  │ Enforcer  │    │History │ │
│                                                  │           │    │  (DB)  │ │
│                                                  └──────────┘    └────────┘ │
└──────────────────────────────────────────────────────────────────────────────┘
```

### Pipeline Stages

**Stage 1: Event Ingestion**
The pipeline consumes events from Redpanda topics matching the pattern `engagement.events.*`. Each event is validated against its schema, enriched with metadata (venture context, timestamp normalization), and forwarded to the matcher.

**Stage 2: Event Matching**
The Event Matcher maintains an in-memory index of all active earn rules, organized by trigger event type. When an event arrives, the matcher performs a fast lookup to find candidate rules. Matching supports:

- **Exact match:** `event.type === 'purchase.completed'`
- **Wildcard match:** `event.type matches 'purchase.*'`
- **Regex match:** `event.type matches /^social\.(like|share|comment)$/`
- **Property matching:** `event.properties.amount > 100`

**Stage 3: Condition Evaluation**
For each matched rule, the Condition Evaluator loads the rule's condition tree and evaluates it against the event and user context. Conditions can be:

- **Simple:** A single predicate (e.g., `user.tier === 'gold'`)
- **Compound:** Boolean combinations (`AND`, `OR`, `NOT`) of nested conditions
- **Contextual:** Conditions that require additional data lookups (e.g., "user has made 5+ purchases this month")

The evaluator short-circuits on the first failing `AND` branch and caches user context within the pipeline invocation to avoid redundant queries.

**Stage 4: Reward Calculation**
The Reward Calculator determines the final reward amount by:

1. Loading the base reward definition from the rule
2. Resolving all applicable multipliers (time-based, tier-based, combo, streak)
3. Stacking multipliers according to the configured strategy (additive, multiplicative, or highest-wins)
4. Applying the Cap Enforcer to ensure per-user and global budget limits are respected
5. Producing the final reward instruction

**Stage 5: Emit & Log**
The final reward instruction is:

1. Written to `earn_history` for audit trail
2. Emitted to the appropriate Redpanda topic (`engagement.rewards.points`, `engagement.rewards.xp`, etc.) for downstream processing
3. Metrics are updated (earn count, earn amount, latency)

### Event Flow

```
User Action                    Redpanda                         Earn Module
───────────                    ────────                         ───────────
User makes purchase ──▶ engagement.events.purchase ──▶ EventMatcher
                                                          │
                                                          ├─▶ Rule: "Purchase Points"
                                                          │     ConditionEvaluator
                                                          │       ├─ user.verified === true ✓
                                                          │       └─ purchase.amount >= 10 ✓
                                                          │     RewardCalculator
                                                          │       ├─ base: 1 point per $1
                                                          │       ├─ multiplier: 2x (weekend bonus)
                                                          │       ├─ multiplier: 1.5x (gold tier)
                                                          │       └─ cap check: under daily limit ✓
                                                          │     Result: 150 points
                                                          │       │
                                                          │       ├──▶ earn_history (DB)
                                                          │       └──▶ engagement.rewards.points (Redpanda)
                                                          │
                                                          └─▶ Rule: "Purchase XP"
                                                                ConditionEvaluator
                                                                  └─ (unconditional) ✓
                                                                RewardCalculator
                                                                  ├─ base: 10 XP per purchase
                                                                  └─ cap check: under daily limit ✓
                                                                Result: 10 XP
                                                                  │
                                                                  ├──▶ earn_history (DB)
                                                                  └──▶ engagement.rewards.xp (Redpanda)
```

### Condition Evaluation Engine

The condition engine supports a tree structure where each node is either a **leaf condition** (a concrete predicate) or a **branch** (a logical operator combining children).

```
                    AND
                   / | \
                  /  |  \
                OR  LEAF  NOT
               / \    |     \
             LEAF LEAF |    LEAF
              |    |   |      |
     user.   user. purchase  user.
     tier=   tier= .amount   flagged
     'gold'  'plat' >= 50    === true
              inum'
```

**Leaf condition types:**

| Type | Description | Example |
|------|-------------|---------|
| `attribute` | Check user attribute | `user.tier === 'gold'` |
| `event_property` | Check event payload property | `event.amount >= 100` |
| `time_window` | Check if current time is within window | `hour >= 17 AND hour <= 21` |
| `frequency` | Check action frequency within period | `count(purchase, 7d) >= 5` |
| `first_time` | Check if this is user's first occurrence | `first_time(purchase)` |
| `segment` | Check segment membership | `user IN segment('vip-buyers')` |
| `streak` | Check active streak status | `streak('daily-login') >= 7` |
| `cooldown` | Check time since last earn from this rule | `last_earn(rule) > 1h` |
| `geo` | Check user geography | `user.country IN ['US', 'CA']` |
| `device` | Check device type | `event.device === 'mobile'` |
| `custom` | Evaluate a custom expression | `JSONPATH $.user.metadata.level > 10` |

**Operators by type:**

| Operator | Applicable Types | Description |
|----------|------------------|-------------|
| `eq` | all | Equal |
| `neq` | all | Not equal |
| `gt` | numeric, date | Greater than |
| `gte` | numeric, date | Greater than or equal |
| `lt` | numeric, date | Less than |
| `lte` | numeric, date | Less than or equal |
| `in` | string, numeric | Value in set |
| `not_in` | string, numeric | Value not in set |
| `contains` | string, array | Contains substring or element |
| `starts_with` | string | String starts with |
| `ends_with` | string | String ends with |
| `matches` | string | Regex match |
| `exists` | any | Property exists and is not null |
| `between` | numeric, date | Value in range (inclusive) |

### Reward Distribution

When the pipeline produces a reward instruction, it does not directly modify balances. Instead, it emits structured reward events to dedicated Redpanda topics:

| Reward Type | Target Topic | Downstream Consumer |
|-------------|-------------|---------------------|
| `points` | `engagement.rewards.points` | `@mcv/engagement/points` |
| `xp` | `engagement.rewards.xp` | `@mcv/engagement/xp` |
| `tokens` | `engagement.rewards.tokens` | `@mcv/blockchain/edge` |
| `items` | `engagement.rewards.items` | `@mcv/engagement/inventory` |
| `achievements` | `engagement.rewards.achievements` | `@mcv/engagement/achievements` |
| `coupons` | `engagement.rewards.coupons` | `@mcv/commerce/coupons` |
| `custom` | `engagement.rewards.custom` | Venture-specific handler |

This decoupled architecture ensures the Earn module has a single responsibility: **evaluate rules and produce reward instructions**. Balance management, inventory updates, and achievement unlocking are handled by their respective modules.

### Multi-Tenant Isolation

Every entity in the Earn module (rules, conditions, rewards, history) is scoped to a `venture_id`. Supabase Row-Level Security (RLS) enforces that:

1. **Reads** only return rows matching the current venture context.
2. **Writes** automatically set `venture_id` from the authenticated context.
3. **Cross-venture rules** (platform-wide) use a reserved `venture_id = 'platform'` and are read-accessible by all ventures but writable only by platform admins.

The earn pipeline extracts `venture_id` from the incoming event and uses it throughout the evaluation, ensuring no cross-tenant data leakage even in shared Redpanda topics.

---

## Core Interfaces

### EarnService

The primary service facade for managing earn rules and processing earn events programmatically.

```typescript
interface EarnService {
  // ── Rule Management ────────────────────────────────────────────────
  /**
   * Create a new earn rule. Returns the created rule with generated ID.
   * The rule starts in 'draft' status and must be activated explicitly.
   */
  createRule(input: CreateEarnRuleInput): Promise<EarnRule>;

  /**
   * Update an existing earn rule. Only draft or paused rules can be edited.
   * Editing an active rule requires pausing it first.
   */
  updateRule(ruleId: string, input: UpdateEarnRuleInput): Promise<EarnRule>;

  /**
   * Activate a draft or paused rule. The rule begins matching events immediately.
   * If the rule has a schedule, activation respects the schedule windows.
   */
  activateRule(ruleId: string): Promise<EarnRule>;

  /**
   * Pause an active rule. The rule stops matching events but retains its configuration.
   * In-flight evaluations for this rule are allowed to complete.
   */
  pauseRule(ruleId: string): Promise<EarnRule>;

  /**
   * Archive a rule. Archived rules are hidden from active listings
   * but retained for audit and history queries. Irreversible.
   */
  archiveRule(ruleId: string): Promise<EarnRule>;

  /**
   * Delete a draft rule permanently. Only draft rules can be deleted.
   * Active, paused, or archived rules must be archived first.
   */
  deleteRule(ruleId: string): Promise<void>;

  /**
   * Clone an existing rule, creating a new draft with the same configuration.
   * Useful for creating variants or porting rules across ventures.
   */
  cloneRule(ruleId: string, overrides?: Partial<CreateEarnRuleInput>): Promise<EarnRule>;

  /**
   * List earn rules with filtering, pagination, and sorting.
   */
  listRules(params: ListEarnRulesParams): Promise<PaginatedResult<EarnRule>>;

  /**
   * Get a single earn rule by ID with all related entities
   * (conditions, rewards, multipliers, caps, schedule).
   */
  getRule(ruleId: string): Promise<EarnRuleWithRelations>;

  // ── Manual Evaluation ──────────────────────────────────────────────
  /**
   * Manually evaluate an event against all active rules.
   * Used for testing, backfill, or triggering earn outside the streaming pipeline.
   * Returns all earn results without actually distributing rewards unless `commit: true`.
   */
  evaluate(event: EarnEvent, options?: EarnEvaluateOptions): Promise<EarnPipelineResult[]>;

  /**
   * Dry-run evaluation: same as evaluate but never commits.
   * Useful for previewing what would happen for a given event.
   */
  dryRun(event: EarnEvent): Promise<EarnPipelineResult[]>;

  // ── History ────────────────────────────────────────────────────────
  /**
   * Query earn history with flexible filtering.
   */
  getHistory(params: EarnHistoryQueryParams): Promise<PaginatedResult<EarnHistory>>;

  /**
   * Reverse a previously granted earn event. Creates a negative entry
   * in the history and emits a reversal event to the downstream consumer.
   */
  reverse(earnHistoryId: string, reason: string): Promise<EarnHistory>;

  /**
   * Bulk reverse multiple earn events (e.g., fraud detected on a batch).
   */
  bulkReverse(earnHistoryIds: string[], reason: string): Promise<EarnHistory[]>;

  // ── Stats ──────────────────────────────────────────────────────────
  /**
   * Get aggregated statistics for a rule: total earns, total amount,
   * unique users, average reward, etc.
   */
  getRuleStats(ruleId: string, timeRange?: TimeRange): Promise<EarnRuleStats>;

  /**
   * Get earn summary for a specific user across all rules.
   */
  getUserEarnSummary(userId: string, timeRange?: TimeRange): Promise<EarnUserSummary>;
}

interface EarnEvaluateOptions {
  /** If true, commit the results (distribute rewards). Default: false. */
  commit?: boolean;
  /** Override the evaluation timestamp (for backfill). */
  evaluatedAt?: Date;
  /** Skip cap enforcement (admin override). */
  skipCaps?: boolean;
  /** Skip multiplier calculation. */
  skipMultipliers?: boolean;
  /** Force evaluation even if rule is paused (admin testing). */
  forceRuleIds?: string[];
}

interface ListEarnRulesParams {
  ventureId?: string;
  status?: EarnRuleStatus | EarnRuleStatus[];
  triggerEvent?: string;
  rewardType?: EarnRewardType;
  search?: string;
  page?: number;
  pageSize?: number;
  sortBy?: 'created_at' | 'updated_at' | 'name' | 'priority' | 'total_earns';
  sortOrder?: 'asc' | 'desc';
  includePlatformRules?: boolean;
}

interface EarnHistoryQueryParams {
  userId?: string;
  ruleId?: string;
  rewardType?: EarnRewardType;
  status?: 'granted' | 'reversed' | 'disputed' | 'pending';
  from?: Date;
  to?: Date;
  page?: number;
  pageSize?: number;
  sortBy?: 'created_at' | 'amount' | 'rule_name';
  sortOrder?: 'asc' | 'desc';
}
```

### EarnRule

Represents a single earn rule: the mapping from a trigger event to a reward, gated by conditions.

```typescript
interface EarnRule {
  /** Unique rule identifier (ULID). */
  id: string;

  /** Venture this rule belongs to. 'platform' for platform-wide rules. */
  ventureId: string;

  /** Human-readable name for admin interfaces. */
  name: string;

  /** Optional description explaining the rule's purpose. */
  description?: string;

  /** Slug for programmatic reference. Unique within a venture. */
  slug: string;

  /**
   * The event type pattern that triggers this rule.
   * Supports exact strings, wildcards (*), and regex (/pattern/).
   */
  triggerEvent: string;

  /**
   * Optional: additional event property matching patterns.
   * Applied after the trigger event type matches.
   */
  eventFilters?: EarnEventFilter[];

  /**
   * Rule evaluation priority. Lower numbers = higher priority.
   * When multiple rules match an event, they are evaluated in priority order.
   * Default: 100.
   */
  priority: number;

  /**
   * Whether this rule is exclusive: if it matches and grants a reward,
   * lower-priority rules for the same reward type are skipped.
   * Default: false.
   */
  exclusive: boolean;

  /**
   * Current status of the rule.
   * - draft: Not yet active, can be edited freely.
   * - active: Matching events and granting rewards.
   * - paused: Temporarily disabled, retains configuration.
   * - archived: Permanently disabled, retained for history.
   */
  status: EarnRuleStatus;

  /**
   * Tags for organization and filtering.
   */
  tags?: string[];

  /**
   * Optional: campaign ID this rule is linked to.
   * When the campaign ends, the rule is automatically paused.
   */
  campaignId?: string;

  /**
   * Optional: parent rule ID for inheritance.
   * Child rules inherit conditions and rewards from the parent
   * and can override specific properties.
   */
  parentRuleId?: string;

  /**
   * Version number, incremented on each update.
   * Used for optimistic concurrency control.
   */
  version: number;

  /**
   * Metadata bag for venture-specific extensions.
   */
  metadata?: Record<string, unknown>;

  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  updatedBy: string;
}

type EarnRuleStatus = 'draft' | 'active' | 'paused' | 'archived';

interface EarnEventFilter {
  /** JSONPath expression to extract the value from the event payload. */
  path: string;
  /** Comparison operator. */
  operator: EarnConditionOperator;
  /** Value to compare against. */
  value: unknown;
}
```

### EarnCondition

Represents a condition that must be satisfied for a rule to grant a reward. Conditions form a tree structure with logical operators.

```typescript
interface EarnCondition {
  /** Unique condition identifier (ULID). */
  id: string;

  /** The rule this condition belongs to. */
  ruleId: string;

  /**
   * Parent condition ID for nested conditions.
   * null for root-level conditions.
   */
  parentId?: string;

  /**
   * For branch nodes: the logical operator combining children.
   * For leaf nodes: null.
   */
  logicalOperator?: 'AND' | 'OR' | 'NOT';

  /**
   * For leaf nodes: the condition type.
   * For branch nodes: null.
   */
  type?: EarnConditionType;

  /**
   * For leaf nodes: the field/path to evaluate.
   * Interpretation depends on the condition type.
   */
  field?: string;

  /**
   * For leaf nodes: the comparison operator.
   */
  operator?: EarnConditionOperator;

  /**
   * For leaf nodes: the value(s) to compare against.
   * Type varies by operator (scalar, array, range object).
   */
  value?: unknown;

  /**
   * Evaluation order among siblings. Lower = evaluated first.
   * Useful for short-circuit optimization (put cheap checks first).
   */
  sortOrder: number;

  /**
   * Optional: cache the result of this condition for N seconds.
   * Useful for expensive lookups (segment membership, frequency counts).
   */
  cacheTtlSeconds?: number;

  /**
   * Whether this condition is negated (equivalent to wrapping in NOT).
   * Shorthand for simple negation without creating a NOT branch.
   */
  negated: boolean;

  /**
   * Optional: human-readable description for admin interfaces.
   */
  description?: string;

  createdAt: Date;
  updatedAt: Date;
}

type EarnConditionType =
  | 'attribute'       // User attribute check
  | 'event_property'  // Event payload property check
  | 'time_window'     // Current time within window
  | 'frequency'       // Action frequency within period
  | 'first_time'      // First occurrence of event for user
  | 'segment'         // User segment membership
  | 'streak'          // Active streak check
  | 'cooldown'        // Time since last earn from this rule
  | 'geo'             // Geographic check
  | 'device'          // Device type check
  | 'referral'        // User was referred by specific source
  | 'tier'            // User tier check
  | 'balance'         // User balance check (points, tokens)
  | 'custom'          // Custom expression evaluation

type EarnConditionOperator =
  | 'eq' | 'neq'
  | 'gt' | 'gte' | 'lt' | 'lte'
  | 'in' | 'not_in'
  | 'contains' | 'not_contains'
  | 'starts_with' | 'ends_with'
  | 'matches'
  | 'exists' | 'not_exists'
  | 'between' | 'not_between';
```

### EarnReward

Defines what reward is granted when a rule matches successfully.

```typescript
interface EarnReward {
  /** Unique reward identifier (ULID). */
  id: string;

  /** The rule this reward belongs to. A rule can have multiple rewards. */
  ruleId: string;

  /** Type of reward to grant. */
  type: EarnRewardType;

  /**
   * Base amount for numeric rewards (points, XP, tokens).
   * For items and achievements, this is typically 1.
   */
  baseAmount: number;

  /**
   * For points: which point type to award (e.g., 'loyalty', 'bonus', 'social').
   * For tokens: which token ('EDGE').
   * For items: the item SKU or ID.
   * For achievements: the achievement slug.
   * For coupons: the coupon template ID.
   */
  rewardIdentifier: string;

  /**
   * How to calculate the amount:
   * - 'fixed': Always award baseAmount.
   * - 'per_unit': Award baseAmount × event.quantity (e.g., 1 point per dollar).
   * - 'percentage': Award baseAmount% of event.amount.
   * - 'formula': Evaluate a custom formula.
   * - 'tiered': Use a tiered schedule (e.g., first $100 = 1x, next $100 = 1.5x).
   */
  calculationMode: EarnRewardCalculationMode;

  /**
   * For 'per_unit' mode: JSONPath to the quantity field in the event payload.
   * For 'percentage' mode: JSONPath to the amount field.
   * Default: 'event.amount'.
   */
  quantityPath?: string;

  /**
   * For 'formula' mode: the formula expression.
   * Supports basic arithmetic, min/max, floor/ceil, and variable references.
   * Example: 'floor(event.amount * 0.05) + 10'
   */
  formula?: string;

  /**
   * For 'tiered' mode: the tier schedule.
   */
  tiers?: EarnRewardTier[];

  /**
   * Minimum reward amount (floor). Ensures small events still grant something.
   * Default: 0 (no floor).
   */
  minAmount: number;

  /**
   * Maximum reward amount per single earn (ceiling).
   * Distinct from cap limits which are across multiple earns.
   * Default: Infinity (no ceiling).
   */
  maxAmount?: number;

  /**
   * Optional reason string recorded in earn history.
   * Supports template variables: {{rule.name}}, {{event.type}}, {{amount}}.
   */
  reasonTemplate?: string;

  /**
   * Sort order for multiple rewards on the same rule.
   * Lower = processed first.
   */
  sortOrder: number;

  /**
   * Optional metadata attached to the reward event (passed downstream).
   */
  metadata?: Record<string, unknown>;

  createdAt: Date;
  updatedAt: Date;
}

type EarnRewardType =
  | 'points'
  | 'xp'
  | 'tokens'
  | 'items'
  | 'achievements'
  | 'coupons'
  | 'custom';

type EarnRewardCalculationMode =
  | 'fixed'
  | 'per_unit'
  | 'percentage'
  | 'formula'
  | 'tiered';

interface EarnRewardTier {
  /** Start of the tier range (inclusive). */
  from: number;
  /** End of the tier range (exclusive). null = unlimited. */
  to?: number;
  /** Multiplier applied to the base amount within this tier. */
  multiplier: number;
}
```

### EarnEvent

Represents an incoming event that the earn pipeline evaluates against rules.

```typescript
interface EarnEvent {
  /** Unique event identifier (ULID, from the source system). */
  id: string;

  /** The event type string (e.g., 'purchase.completed', 'social.share'). */
  type: string;

  /** User who performed the action. */
  userId: string;

  /** Venture where the action occurred. */
  ventureId: string;

  /**
   * Event payload. Structure varies by event type.
   * The earn pipeline uses JSONPath to extract values for condition evaluation.
   */
  properties: Record<string, unknown>;

  /**
   * When the event occurred (source timestamp).
   * May differ from when the earn pipeline processes it.
   */
  occurredAt: Date;

  /**
   * When the earn pipeline received this event.
   */
  receivedAt: Date;

  /**
   * Source system that emitted the event.
   * Used for tracing and debugging.
   */
  source: string;

  /**
   * Optional: idempotency key. If provided, the pipeline will skip
   * this event if it has already been processed with the same key.
   */
  idempotencyKey?: string;

  /**
   * Optional: session ID for correlating related events.
   */
  sessionId?: string;

  /**
   * Optional: device information.
   */
  device?: {
    type: 'mobile' | 'tablet' | 'desktop' | 'unknown';
    os?: string;
    browser?: string;
  };

  /**
   * Optional: geographic information.
   */
  geo?: {
    country?: string;
    region?: string;
    city?: string;
    timezone?: string;
  };
}

interface EarnEventMatchPattern {
  /** Event type pattern. Supports exact, wildcard (*), regex (/pattern/). */
  typePattern: string;
  /** Compiled regex (if typePattern is a regex). Cached at rule load time. */
  compiledRegex?: RegExp;
  /** Additional property filters. */
  propertyFilters?: EarnEventFilter[];
}
```

### EarnMultiplier

Defines a multiplier that amplifies (or reduces) the base reward amount.

```typescript
interface EarnMultiplier {
  /** Unique multiplier identifier (ULID). */
  id: string;

  /** The rule this multiplier is attached to. */
  ruleId: string;

  /** Human-readable name for admin interfaces. */
  name: string;

  /** Type of multiplier. */
  type: EarnMultiplierType;

  /** The multiplier value (e.g., 2.0 = double, 0.5 = half). */
  value: number;

  /**
   * Type-specific configuration.
   */
  config: EarnMultiplierConfig;

  /**
   * Priority for multiplier stacking.
   * When multiple multipliers apply, they are resolved in priority order.
   */
  priority: number;

  /**
   * How this multiplier stacks with others:
   * - 'multiplicative': Multiply with other multipliers (2x × 1.5x = 3x).
   * - 'additive': Add to other multipliers (2x + 1.5x = 3.5x base... applies as (1 + 1 + 0.5) = 2.5x).
   * - 'highest_wins': Only the highest multiplier in this stacking group applies.
   * - 'replace': This multiplier replaces the accumulated value.
   */
  stackingMode: 'multiplicative' | 'additive' | 'highest_wins' | 'replace';

  /**
   * Optional: stacking group. Multipliers in the same group
   * are resolved together before combining with other groups.
   * Default: 'default'.
   */
  stackingGroup: string;

  /** Whether this multiplier is currently active. */
  active: boolean;

  createdAt: Date;
  updatedAt: Date;
}

type EarnMultiplierType =
  | 'time_based'    // Active during specific time windows
  | 'tier_based'    // Based on user's tier level
  | 'combo'         // Based on consecutive action count
  | 'streak'        // Based on active streak length
  | 'segment'       // Based on user segment membership
  | 'first_time'    // Bonus for first-time earners
  | 'referral'      // Bonus for referred users
  | 'campaign'      // Campaign-linked multiplier
  | 'custom';       // Custom evaluation

type EarnMultiplierConfig =
  | EarnTimeMultiplierConfig
  | EarnTierMultiplierConfig
  | EarnComboMultiplierConfig
  | EarnStreakMultiplierConfig
  | EarnSegmentMultiplierConfig
  | EarnFirstTimeMultiplierConfig
  | EarnCampaignMultiplierConfig
  | EarnCustomMultiplierConfig;

interface EarnTimeMultiplierConfig {
  type: 'time_based';
  /** Days of the week (0 = Sunday, 6 = Saturday). */
  daysOfWeek?: number[];
  /** Start hour (0-23) in the venture's timezone. */
  startHour?: number;
  /** End hour (0-23) in the venture's timezone. */
  endHour?: number;
  /** Specific date ranges (ISO 8601). */
  dateRanges?: Array<{ start: string; end: string }>;
  /** Timezone for evaluation. Default: venture's timezone. */
  timezone?: string;
}

interface EarnTierMultiplierConfig {
  type: 'tier_based';
  /** Map of tier slug → multiplier value. */
  tierMultipliers: Record<string, number>;
}

interface EarnComboMultiplierConfig {
  type: 'combo';
  /** Event type to count for combo. */
  comboEvent: string;
  /** Time window for combo counting. */
  comboWindow: string; // e.g., '1h', '24h'
  /** Combo thresholds and their multipliers. */
  thresholds: Array<{ count: number; multiplier: number }>;
}

interface EarnStreakMultiplierConfig {
  type: 'streak';
  /** Streak identifier to check. */
  streakSlug: string;
  /** Streak length thresholds and their multipliers. */
  thresholds: Array<{ days: number; multiplier: number }>;
}

interface EarnSegmentMultiplierConfig {
  type: 'segment';
  /** Map of segment slug → multiplier value. */
  segmentMultipliers: Record<string, number>;
  /** If user is in multiple segments, how to resolve: 'highest' | 'first' | 'sum'. */
  resolution: 'highest' | 'first' | 'sum';
}

interface EarnFirstTimeMultiplierConfig {
  type: 'first_time';
  /** The multiplier value for first-time earners. */
  multiplier: number;
  /** What "first time" means: first earn from this rule, or first earn ever. */
  scope: 'rule' | 'global';
}

interface EarnCampaignMultiplierConfig {
  type: 'campaign';
  /** Campaign ID to check. */
  campaignId: string;
  /** Multiplier active while campaign is running. */
  multiplier: number;
}

interface EarnCustomMultiplierConfig {
  type: 'custom';
  /** Custom evaluator function name (registered in the multiplier registry). */
  evaluator: string;
  /** Parameters passed to the custom evaluator. */
  params: Record<string, unknown>;
}
```

### EarnCap

Defines rate limits and budget caps that prevent over-rewarding.

```typescript
interface EarnCap {
  /** Unique cap identifier (ULID). */
  id: string;

  /** The rule this cap applies to. null = applies to all rules in the venture. */
  ruleId?: string;

  /** Venture this cap belongs to. */
  ventureId: string;

  /** Human-readable name for admin interfaces. */
  name: string;

  /** Type of cap. */
  type: EarnCapType;

  /** The cap limit value. */
  limit: number;

  /** Time window for the cap. */
  window: EarnCapWindow;

  /** What the cap counts: 'amount' (total rewarded) or 'count' (number of earns). */
  metric: 'amount' | 'count';

  /** Which reward type this cap applies to. null = all reward types. */
  rewardType?: EarnRewardType;

  /**
   * What happens when the cap is hit:
   * - 'block': Deny the earn entirely.
   * - 'reduce': Reduce the reward to fit within the remaining budget.
   * - 'queue': Queue the earn for later processing when budget resets.
   */
  overflowBehavior: 'block' | 'reduce' | 'queue';

  /** Whether this cap is currently active. */
  active: boolean;

  /** Optional: notification webhook when cap reaches threshold. */
  alertThreshold?: number;
  alertWebhook?: string;

  createdAt: Date;
  updatedAt: Date;
}

type EarnCapType =
  | 'per_user'     // Per-user cap
  | 'per_rule'     // Per-rule global cap (across all users)
  | 'per_venture'  // Per-venture global cap
  | 'global';      // Platform-wide cap

type EarnCapWindow =
  | 'hourly'
  | 'daily'
  | 'weekly'
  | 'monthly'
  | 'yearly'
  | 'lifetime'
  | 'rolling_1h'
  | 'rolling_24h'
  | 'rolling_7d'
  | 'rolling_30d'
  | 'custom';

interface EarnCapWindowCustom {
  window: 'custom';
  /** Duration in seconds. */
  durationSeconds: number;
  /** Anchor: 'event_time' (rolling) or 'calendar' (fixed periods). */
  anchor: 'event_time' | 'calendar';
}
```

### EarnSchedule

Controls when an earn rule is active.

```typescript
interface EarnSchedule {
  /** Unique schedule identifier (ULID). */
  id: string;

  /** The rule this schedule controls. */
  ruleId: string;

  /** Human-readable name. */
  name: string;

  /** Schedule type. */
  type: EarnScheduleType;

  /**
   * For 'one_time': start and end timestamps.
   */
  startAt?: Date;
  endAt?: Date;

  /**
   * For 'recurring': cron expression (5 or 6 fields).
   * Defines when the rule activates.
   */
  cronActivate?: string;

  /**
   * For 'recurring': cron expression for deactivation.
   * If not set, the rule stays active until the next activation cycle.
   */
  cronDeactivate?: string;

  /**
   * For 'recurring': duration in seconds the rule stays active
   * after each activation. Alternative to cronDeactivate.
   */
  activeDurationSeconds?: number;

  /**
   * Timezone for cron evaluation. Default: venture's timezone.
   */
  timezone: string;

  /**
   * Optional: link to a campaign. When the campaign ends,
   * this schedule is automatically deactivated.
   */
  campaignId?: string;

  /** Whether this schedule is currently enabled. */
  active: boolean;

  createdAt: Date;
  updatedAt: Date;
}

type EarnScheduleType =
  | 'one_time'     // Active between startAt and endAt
  | 'recurring'    // Activates/deactivates on a cron schedule
  | 'campaign';    // Tied to campaign lifecycle
```

### EarnABTest

Defines an A/B test for comparing earn rule variants.

```typescript
interface EarnABTest {
  /** Unique test identifier (ULID). */
  id: string;

  /** Venture this test belongs to. */
  ventureId: string;

  /** Human-readable name. */
  name: string;

  /** Description of the test hypothesis. */
  description?: string;

  /**
   * The base rule being tested. This rule is replaced by the variants
   * for users assigned to test groups.
   */
  baseRuleId: string;

  /** Test variants (including control). */
  variants: EarnABTestVariant[];

  /**
   * How users are assigned to variants:
   * - 'random': Random assignment, percentages must sum to 100.
   * - 'deterministic': Hash-based (consistent assignment for same user).
   * - 'segment': Assign based on user segments.
   */
  assignmentStrategy: 'random' | 'deterministic' | 'segment';

  /** Current test status. */
  status: 'draft' | 'running' | 'paused' | 'completed' | 'cancelled';

  /**
   * Primary metric to compare.
   * - 'earn_count': Number of earn events.
   * - 'earn_amount': Total reward amount.
   * - 'engagement_rate': Percentage of active users who earned.
   * - 'revenue_impact': Estimated revenue change.
   * - 'custom': Custom metric evaluator.
   */
  primaryMetric: string;

  /** Minimum sample size per variant before results are significant. */
  minSampleSize: number;

  /** Statistical confidence level required. Default: 0.95. */
  confidenceLevel: number;

  /**
   * Auto-optimization: if true, automatically shift traffic
   * to the winning variant once significance is reached.
   */
  autoOptimize: boolean;

  /** Optional: maximum test duration. Test auto-completes after this. */
  maxDurationDays?: number;

  /** Test start timestamp. */
  startedAt?: Date;

  /** Test completion timestamp. */
  completedAt?: Date;

  /** Winning variant ID (set on completion). */
  winningVariantId?: string;

  createdAt: Date;
  updatedAt: Date;
}

interface EarnABTestVariant {
  /** Unique variant identifier (ULID). */
  id: string;

  /** Test this variant belongs to. */
  testId: string;

  /** Variant name (e.g., 'control', 'variant_a', 'variant_b'). */
  name: string;

  /** Percentage of traffic assigned to this variant (0-100). */
  trafficPercentage: number;

  /** The rule ID used for this variant. */
  ruleId: string;

  /**
   * For 'segment' assignment: which segments are assigned to this variant.
   */
  segments?: string[];

  /** Current metrics snapshot. */
  metrics?: {
    sampleSize: number;
    earnCount: number;
    earnAmount: number;
    uniqueUsers: number;
    engagementRate: number;
  };
}
```

### EarnHistory

Represents a single earn event record in the audit trail.

```typescript
interface EarnHistory {
  /** Unique history entry identifier (ULID). */
  id: string;

  /** Venture where the earn occurred. */
  ventureId: string;

  /** User who earned. */
  userId: string;

  /** Rule that granted the earn. */
  ruleId: string;

  /** Rule name at the time of earn (denormalized for history stability). */
  ruleName: string;

  /** Rule version at the time of earn. */
  ruleVersion: number;

  /** The source event that triggered the earn. */
  eventId: string;

  /** Event type (denormalized). */
  eventType: string;

  /** Reward type granted. */
  rewardType: EarnRewardType;

  /** Reward identifier (point type, token, item SKU, etc.). */
  rewardIdentifier: string;

  /** Base amount before multipliers. */
  baseAmount: number;

  /** Final amount after multipliers and cap adjustments. */
  finalAmount: number;

  /** Multipliers that were applied. */
  appliedMultipliers: AppliedMultiplier[];

  /** Cap adjustments that were applied. */
  capAdjustments: CapAdjustment[];

  /** Human-readable reason string. */
  reason: string;

  /**
   * Status of this earn event:
   * - 'granted': Successfully awarded.
   * - 'reversed': Reversed (points clawed back).
   * - 'disputed': Under dispute review.
   * - 'pending': Queued (cap overflow with queue behavior).
   * - 'expired': Pending earn that expired without processing.
   */
  status: 'granted' | 'reversed' | 'disputed' | 'pending' | 'expired';

  /** If reversed: the reversal reason. */
  reversalReason?: string;

  /** If reversed: who initiated the reversal. */
  reversedBy?: string;

  /** If reversed: when the reversal occurred. */
  reversedAt?: Date;

  /** If part of an A/B test: the variant ID. */
  abTestVariantId?: string;

  /** Full evaluation context snapshot for debugging. */
  evaluationSnapshot?: EarnEvaluationSnapshot;

  /** When the earn was processed. */
  earnedAt: Date;

  createdAt: Date;
  updatedAt: Date;
}

interface AppliedMultiplier {
  multiplierId: string;
  multiplierName: string;
  type: EarnMultiplierType;
  value: number;
  stackingMode: string;
}

interface CapAdjustment {
  capId: string;
  capName: string;
  type: EarnCapType;
  originalAmount: number;
  adjustedAmount: number;
  reason: string;
}

interface EarnEvaluationSnapshot {
  /** The full event payload at evaluation time. */
  event: EarnEvent;
  /** Conditions evaluated and their results. */
  conditions: Array<{
    conditionId: string;
    type: EarnConditionType;
    result: boolean;
    evaluatedValue: unknown;
    durationMs: number;
  }>;
  /** Total evaluation duration. */
  totalDurationMs: number;
  /** Pipeline version. */
  pipelineVersion: string;
}
```

### EarnRuleVariant

Represents a variant of an earn rule used in A/B testing or cross-venture inheritance.

```typescript
interface EarnRuleVariant {
  /** Unique variant identifier (ULID). */
  id: string;

  /** The base rule this is a variant of. */
  baseRuleId: string;

  /** Human-readable name. */
  name: string;

  /**
   * Overrides applied to the base rule.
   * Only specified fields are overridden; others inherit from the base.
   */
  overrides: Partial<{
    triggerEvent: string;
    eventFilters: EarnEventFilter[];
    priority: number;
    exclusive: boolean;
    conditions: EarnCondition[];
    rewards: EarnReward[];
    multipliers: EarnMultiplier[];
    caps: EarnCap[];
    schedule: EarnSchedule;
    metadata: Record<string, unknown>;
  }>;

  /** Which venture this variant applies to (for cross-venture inheritance). */
  ventureId?: string;

  createdAt: Date;
  updatedAt: Date;
}
```

### EarnBudget

Tracks budget allocation and consumption for earn rules and ventures.

```typescript
interface EarnBudget {
  /** Unique budget identifier (ULID). */
  id: string;

  /** Venture this budget belongs to. */
  ventureId: string;

  /** Optional: specific rule this budget applies to. null = venture-wide. */
  ruleId?: string;

  /** Reward type this budget tracks. */
  rewardType: EarnRewardType;

  /** Reward identifier (e.g., 'loyalty' for loyalty points). */
  rewardIdentifier: string;

  /** Total allocated budget for the period. */
  allocatedAmount: number;

  /** Amount consumed so far. */
  consumedAmount: number;

  /** Amount reserved (in-flight earns). */
  reservedAmount: number;

  /** Budget period start. */
  periodStart: Date;

  /** Budget period end. */
  periodEnd: Date;

  /** What happens when budget is exhausted: 'block', 'alert', 'overspend'. */
  exhaustionBehavior: 'block' | 'alert' | 'overspend';

  /** Alert threshold percentage (0-100). */
  alertThreshold: number;

  /** Whether alert has been triggered for current period. */
  alertTriggered: boolean;

  createdAt: Date;
  updatedAt: Date;
}
```

### EarnVelocityCheck

Anti-abuse velocity checking configuration.

```typescript
interface EarnVelocityCheck {
  /** Unique check identifier (ULID). */
  id: string;

  /** Venture this check belongs to. */
  ventureId: string;

  /** Optional: specific rule. null = all rules. */
  ruleId?: string;

  /** Human-readable name. */
  name: string;

  /** What to measure. */
  metric: 'earn_count' | 'earn_amount' | 'event_count' | 'unique_events';

  /** Time window for measurement. */
  windowSeconds: number;

  /** Threshold that triggers the check. */
  threshold: number;

  /**
   * Action when threshold is exceeded:
   * - 'block': Block further earns for the user.
   * - 'flag': Flag for review but allow.
   * - 'reduce': Apply a penalty multiplier.
   * - 'cooldown': Force a cooldown period.
   */
  action: 'block' | 'flag' | 'reduce' | 'cooldown';

  /** For 'reduce': the penalty multiplier (e.g., 0.1 = 10% of normal). */
  penaltyMultiplier?: number;

  /** For 'cooldown': forced cooldown duration in seconds. */
  cooldownSeconds?: number;

  /**
   * Scope of velocity measurement:
   * - 'user': Per-user velocity.
   * - 'ip': Per-IP velocity (requires IP in event).
   * - 'device': Per-device velocity.
   * - 'session': Per-session velocity.
   */
  scope: 'user' | 'ip' | 'device' | 'session';

  /** Whether this check is currently active. */
  active: boolean;

  createdAt: Date;
  updatedAt: Date;
}
```

### EarnDisputeResolution

Represents a dispute against an earn event.

```typescript
interface EarnDisputeResolution {
  /** Unique dispute identifier (ULID). */
  id: string;

  /** The earn history entry being disputed. */
  earnHistoryId: string;

  /** Who filed the dispute (user ID or admin ID). */
  filedBy: string;

  /** Filing type: user disputes their earn (e.g., "I should have gotten more")
   * or admin disputes (e.g., fraud review). */
  filedByType: 'user' | 'admin' | 'system';

  /** Dispute reason. */
  reason: string;

  /** Desired resolution from the filer's perspective. */
  requestedResolution: 'reverse' | 'adjust_up' | 'adjust_down' | 'investigate';

  /** Requested adjustment amount (for adjust_up/adjust_down). */
  requestedAmount?: number;

  /** Current dispute status. */
  status: 'open' | 'investigating' | 'resolved' | 'rejected';

  /** Resolution details (set on resolution). */
  resolution?: {
    action: 'reversed' | 'adjusted' | 'upheld' | 'dismissed';
    adjustedAmount?: number;
    notes: string;
    resolvedBy: string;
    resolvedAt: Date;
  };

  /** Supporting evidence (file references, screenshots, etc.). */
  evidence?: Array<{
    type: 'text' | 'file' | 'url';
    content: string;
    addedBy: string;
    addedAt: Date;
  }>;

  createdAt: Date;
  updatedAt: Date;
}
```

---

## Database Schemas

All tables use Supabase PostgreSQL with Drizzle ORM. Every table includes `venture_id` for multi-tenant RLS, and standard audit columns (`created_at`, `updated_at`).

### earn_rules

```typescript
import { pgTable, text, integer, boolean, timestamp, jsonb, pgEnum } from 'drizzle-orm/pg-core';
import { ulid } from '@mcv/shared/id';

export const earnRuleStatusEnum = pgEnum('earn_rule_status', [
  'draft', 'active', 'paused', 'archived',
]);

export const earnRules = pgTable('earn_rules', {
  id:             text('id').primaryKey().$defaultFn(() => ulid()),
  ventureId:      text('venture_id').notNull().references(() => ventures.id),
  name:           text('name').notNull(),
  description:    text('description'),
  slug:           text('slug').notNull(),
  triggerEvent:   text('trigger_event').notNull(),
  eventFilters:   jsonb('event_filters').$type<EarnEventFilter[]>().default([]),
  priority:       integer('priority').notNull().default(100),
  exclusive:      boolean('exclusive').notNull().default(false),
  status:         earnRuleStatusEnum('status').notNull().default('draft'),
  tags:           jsonb('tags').$type<string[]>().default([]),
  campaignId:     text('campaign_id'),
  parentRuleId:   text('parent_rule_id').references(() => earnRules.id),
  version:        integer('version').notNull().default(1),
  metadata:       jsonb('metadata').$type<Record<string, unknown>>().default({}),
  createdAt:      timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt:      timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  createdBy:      text('created_by').notNull(),
  updatedBy:      text('updated_by').notNull(),
}, (table) => ({
  ventureStatusIdx:     index('earn_rules_venture_status_idx').on(table.ventureId, table.status),
  triggerEventIdx:      index('earn_rules_trigger_event_idx').on(table.triggerEvent),
  ventureSlugUnique:    unique('earn_rules_venture_slug_unique').on(table.ventureId, table.slug),
  campaignIdx:          index('earn_rules_campaign_idx').on(table.campaignId),
  parentRuleIdx:        index('earn_rules_parent_rule_idx').on(table.parentRuleId),
}));
```

### earn_conditions

```typescript
export const earnConditionTypeEnum = pgEnum('earn_condition_type', [
  'attribute', 'event_property', 'time_window', 'frequency', 'first_time',
  'segment', 'streak', 'cooldown', 'geo', 'device', 'referral', 'tier',
  'balance', 'custom',
]);

export const earnConditionOperatorEnum = pgEnum('earn_condition_operator', [
  'eq', 'neq', 'gt', 'gte', 'lt', 'lte', 'in', 'not_in',
  'contains', 'not_contains', 'starts_with', 'ends_with', 'matches',
  'exists', 'not_exists', 'between', 'not_between',
]);

export const logicalOperatorEnum = pgEnum('logical_operator', ['AND', 'OR', 'NOT']);

export const earnConditions = pgTable('earn_conditions', {
  id:               text('id').primaryKey().$defaultFn(() => ulid()),
  ruleId:           text('rule_id').notNull().references(() => earnRules.id, { onDelete: 'cascade' }),
  parentId:         text('parent_id').references(() => earnConditions.id, { onDelete: 'cascade' }),
  logicalOperator:  logicalOperatorEnum('logical_operator'),
  type:             earnConditionTypeEnum('type'),
  field:            text('field'),
  operator:         earnConditionOperatorEnum('operator'),
  value:            jsonb('value'),
  sortOrder:        integer('sort_order').notNull().default(0),
  cacheTtlSeconds:  integer('cache_ttl_seconds'),
  negated:          boolean('negated').notNull().default(false),
  description:      text('description'),
  createdAt:        timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt:        timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  ruleIdx:    index('earn_conditions_rule_idx').on(table.ruleId),
  parentIdx:  index('earn_conditions_parent_idx').on(table.parentId),
}));
```

### earn_rewards

```typescript
export const earnRewardTypeEnum = pgEnum('earn_reward_type', [
  'points', 'xp', 'tokens', 'items', 'achievements', 'coupons', 'custom',
]);

export const earnRewardCalcModeEnum = pgEnum('earn_reward_calc_mode', [
  'fixed', 'per_unit', 'percentage', 'formula', 'tiered',
]);

export const earnRewards = pgTable('earn_rewards', {
  id:                 text('id').primaryKey().$defaultFn(() => ulid()),
  ruleId:             text('rule_id').notNull().references(() => earnRules.id, { onDelete: 'cascade' }),
  type:               earnRewardTypeEnum('type').notNull(),
  baseAmount:         integer('base_amount').notNull(),
  rewardIdentifier:   text('reward_identifier').notNull(),
  calculationMode:    earnRewardCalcModeEnum('calculation_mode').notNull().default('fixed'),
  quantityPath:       text('quantity_path'),
  formula:            text('formula'),
  tiers:              jsonb('tiers').$type<EarnRewardTier[]>(),
  minAmount:          integer('min_amount').notNull().default(0),
  maxAmount:          integer('max_amount'),
  reasonTemplate:     text('reason_template'),
  sortOrder:          integer('sort_order').notNull().default(0),
  metadata:           jsonb('metadata').$type<Record<string, unknown>>().default({}),
  createdAt:          timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt:          timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  ruleIdx:  index('earn_rewards_rule_idx').on(table.ruleId),
  typeIdx:  index('earn_rewards_type_idx').on(table.type),
}));
```

### earn_events

This table stores incoming events that have been processed by the earn pipeline (for replay and debugging).

```typescript
export const earnEvents = pgTable('earn_events', {
  id:               text('id').primaryKey(),
  ventureId:        text('venture_id').notNull().references(() => ventures.id),
  userId:           text('user_id').notNull(),
  type:             text('type').notNull(),
  properties:       jsonb('properties').$type<Record<string, unknown>>().notNull(),
  source:           text('source').notNull(),
  idempotencyKey:   text('idempotency_key'),
  sessionId:        text('session_id'),
  device:           jsonb('device'),
  geo:              jsonb('geo'),
  occurredAt:       timestamp('occurred_at', { withTimezone: true }).notNull(),
  receivedAt:       timestamp('received_at', { withTimezone: true }).notNull().defaultNow(),
  processedAt:      timestamp('processed_at', { withTimezone: true }),
  rulesMatched:     integer('rules_matched').notNull().default(0),
  rewardsGranted:   integer('rewards_granted').notNull().default(0),
  createdAt:        timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  ventureUserIdx:     index('earn_events_venture_user_idx').on(table.ventureId, table.userId),
  typeIdx:            index('earn_events_type_idx').on(table.type),
  idempotencyIdx:     unique('earn_events_idempotency_idx').on(table.ventureId, table.idempotencyKey),
  occurredAtIdx:      index('earn_events_occurred_at_idx').on(table.occurredAt),
  sessionIdx:         index('earn_events_session_idx').on(table.sessionId),
}));
```

### earn_multipliers

```typescript
export const earnMultiplierTypeEnum = pgEnum('earn_multiplier_type', [
  'time_based', 'tier_based', 'combo', 'streak', 'segment',
  'first_time', 'referral', 'campaign', 'custom',
]);

export const earnMultiplierStackingEnum = pgEnum('earn_multiplier_stacking', [
  'multiplicative', 'additive', 'highest_wins', 'replace',
]);

export const earnMultipliers = pgTable('earn_multipliers', {
  id:             text('id').primaryKey().$defaultFn(() => ulid()),
  ruleId:         text('rule_id').notNull().references(() => earnRules.id, { onDelete: 'cascade' }),
  name:           text('name').notNull(),
  type:           earnMultiplierTypeEnum('type').notNull(),
  value:          real('value').notNull(),
  config:         jsonb('config').$type<EarnMultiplierConfig>().notNull(),
  priority:       integer('priority').notNull().default(0),
  stackingMode:   earnMultiplierStackingEnum('stacking_mode').notNull().default('multiplicative'),
  stackingGroup:  text('stacking_group').notNull().default('default'),
  active:         boolean('active').notNull().default(true),
  createdAt:      timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt:      timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  ruleIdx:  index('earn_multipliers_rule_idx').on(table.ruleId),
  typeIdx:  index('earn_multipliers_type_idx').on(table.type),
}));
```

### earn_caps

```typescript
export const earnCapTypeEnum = pgEnum('earn_cap_type', [
  'per_user', 'per_rule', 'per_venture', 'global',
]);

export const earnCapWindowEnum = pgEnum('earn_cap_window', [
  'hourly', 'daily', 'weekly', 'monthly', 'yearly', 'lifetime',
  'rolling_1h', 'rolling_24h', 'rolling_7d', 'rolling_30d', 'custom',
]);

export const earnCapOverflowEnum = pgEnum('earn_cap_overflow', [
  'block', 'reduce', 'queue',
]);

export const earnCaps = pgTable('earn_caps', {
  id:                text('id').primaryKey().$defaultFn(() => ulid()),
  ruleId:            text('rule_id').references(() => earnRules.id, { onDelete: 'cascade' }),
  ventureId:         text('venture_id').notNull().references(() => ventures.id),
  name:              text('name').notNull(),
  type:              earnCapTypeEnum('type').notNull(),
  limit:             integer('limit').notNull(),
  window:            earnCapWindowEnum('window').notNull(),
  metric:            text('metric').notNull().default('amount'),
  rewardType:        earnRewardTypeEnum('reward_type'),
  overflowBehavior:  earnCapOverflowEnum('overflow_behavior').notNull().default('block'),
  active:            boolean('active').notNull().default(true),
  alertThreshold:    integer('alert_threshold'),
  alertWebhook:      text('alert_webhook'),
  createdAt:         timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt:         timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  ruleIdx:     index('earn_caps_rule_idx').on(table.ruleId),
  ventureIdx:  index('earn_caps_venture_idx').on(table.ventureId),
  typeIdx:     index('earn_caps_type_idx').on(table.type),
}));
```

### earn_schedules

```typescript
export const earnScheduleTypeEnum = pgEnum('earn_schedule_type', [
  'one_time', 'recurring', 'campaign',
]);

export const earnSchedules = pgTable('earn_schedules', {
  id:                     text('id').primaryKey().$defaultFn(() => ulid()),
  ruleId:                 text('rule_id').notNull().references(() => earnRules.id, { onDelete: 'cascade' }),
  name:                   text('name').notNull(),
  type:                   earnScheduleTypeEnum('type').notNull(),
  startAt:                timestamp('start_at', { withTimezone: true }),
  endAt:                  timestamp('end_at', { withTimezone: true }),
  cronActivate:           text('cron_activate'),
  cronDeactivate:         text('cron_deactivate'),
  activeDurationSeconds:  integer('active_duration_seconds'),
  timezone:               text('timezone').notNull().default('UTC'),
  campaignId:             text('campaign_id'),
  active:                 boolean('active').notNull().default(true),
  createdAt:              timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt:              timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  ruleIdx:      index('earn_schedules_rule_idx').on(table.ruleId),
  campaignIdx:  index('earn_schedules_campaign_idx').on(table.campaignId),
}));
```

### earn_ab_tests

```typescript
export const earnAbTestStatusEnum = pgEnum('earn_ab_test_status', [
  'draft', 'running', 'paused', 'completed', 'cancelled',
]);

export const earnAbTestAssignmentEnum = pgEnum('earn_ab_test_assignment', [
  'random', 'deterministic', 'segment',
]);

export const earnAbTests = pgTable('earn_ab_tests', {
  id:                 text('id').primaryKey().$defaultFn(() => ulid()),
  ventureId:          text('venture_id').notNull().references(() => ventures.id),
  name:               text('name').notNull(),
  description:        text('description'),
  baseRuleId:         text('base_rule_id').notNull().references(() => earnRules.id),
  variants:           jsonb('variants').$type<EarnABTestVariant[]>().notNull(),
  assignmentStrategy: earnAbTestAssignmentEnum('assignment_strategy').notNull().default('deterministic'),
  status:             earnAbTestStatusEnum('status').notNull().default('draft'),
  primaryMetric:      text('primary_metric').notNull().default('earn_count'),
  minSampleSize:      integer('min_sample_size').notNull().default(1000),
  confidenceLevel:    real('confidence_level').notNull().default(0.95),
  autoOptimize:       boolean('auto_optimize').notNull().default(false),
  maxDurationDays:    integer('max_duration_days'),
  startedAt:          timestamp('started_at', { withTimezone: true }),
  completedAt:        timestamp('completed_at', { withTimezone: true }),
  winningVariantId:   text('winning_variant_id'),
  createdAt:          timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt:          timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  ventureIdx:    index('earn_ab_tests_venture_idx').on(table.ventureId),
  statusIdx:     index('earn_ab_tests_status_idx').on(table.status),
  baseRuleIdx:   index('earn_ab_tests_base_rule_idx').on(table.baseRuleId),
}));
```

### earn_history

```typescript
export const earnHistoryStatusEnum = pgEnum('earn_history_status', [
  'granted', 'reversed', 'disputed', 'pending', 'expired',
]);

export const earnHistory = pgTable('earn_history', {
  id:                 text('id').primaryKey().$defaultFn(() => ulid()),
  ventureId:          text('venture_id').notNull().references(() => ventures.id),
  userId:             text('user_id').notNull(),
  ruleId:             text('rule_id').notNull().references(() => earnRules.id),
  ruleName:           text('rule_name').notNull(),
  ruleVersion:        integer('rule_version').notNull(),
  eventId:            text('event_id').notNull(),
  eventType:          text('event_type').notNull(),
  rewardType:         earnRewardTypeEnum('reward_type').notNull(),
  rewardIdentifier:   text('reward_identifier').notNull(),
  baseAmount:         integer('base_amount').notNull(),
  finalAmount:        integer('final_amount').notNull(),
  appliedMultipliers: jsonb('applied_multipliers').$type<AppliedMultiplier[]>().default([]),
  capAdjustments:     jsonb('cap_adjustments').$type<CapAdjustment[]>().default([]),
  reason:             text('reason').notNull(),
  status:             earnHistoryStatusEnum('status').notNull().default('granted'),
  reversalReason:     text('reversal_reason'),
  reversedBy:         text('reversed_by'),
  reversedAt:         timestamp('reversed_at', { withTimezone: true }),
  abTestVariantId:    text('ab_test_variant_id'),
  evaluationSnapshot: jsonb('evaluation_snapshot').$type<EarnEvaluationSnapshot>(),
  earnedAt:           timestamp('earned_at', { withTimezone: true }).notNull(),
  createdAt:          timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt:          timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  ventureUserIdx:     index('earn_history_venture_user_idx').on(table.ventureId, table.userId),
  ruleIdx:            index('earn_history_rule_idx').on(table.ruleId),
  eventIdx:           index('earn_history_event_idx').on(table.eventId),
  statusIdx:          index('earn_history_status_idx').on(table.status),
  earnedAtIdx:        index('earn_history_earned_at_idx').on(table.earnedAt),
  rewardTypeIdx:      index('earn_history_reward_type_idx').on(table.rewardType),
  userEarnedAtIdx:    index('earn_history_user_earned_at_idx').on(table.userId, table.earnedAt),
  ventureRewardIdx:   index('earn_history_venture_reward_idx').on(table.ventureId, table.rewardType, table.earnedAt),
}));
```

### Row-Level Security Policies

```sql
-- ── earn_rules ──────────────────────────────────────────────────────
ALTER TABLE earn_rules ENABLE ROW LEVEL SECURITY;

-- Venture members can read their own rules + platform rules
CREATE POLICY "earn_rules_select" ON earn_rules
  FOR SELECT USING (
    venture_id = current_setting('app.venture_id')::text
    OR venture_id = 'platform'
  );

-- Only venture admins can insert/update/delete
CREATE POLICY "earn_rules_insert" ON earn_rules
  FOR INSERT WITH CHECK (
    venture_id = current_setting('app.venture_id')::text
    AND current_setting('app.user_role')::text IN ('admin', 'owner')
  );

CREATE POLICY "earn_rules_update" ON earn_rules
  FOR UPDATE USING (
    venture_id = current_setting('app.venture_id')::text
    AND current_setting('app.user_role')::text IN ('admin', 'owner')
  );

CREATE POLICY "earn_rules_delete" ON earn_rules
  FOR DELETE USING (
    venture_id = current_setting('app.venture_id')::text
    AND current_setting('app.user_role')::text IN ('admin', 'owner')
    AND status = 'draft'
  );

-- ── earn_history ────────────────────────────────────────────────────
ALTER TABLE earn_history ENABLE ROW LEVEL SECURITY;

-- Users can read their own earn history
CREATE POLICY "earn_history_select_user" ON earn_history
  FOR SELECT USING (
    user_id = current_setting('app.user_id')::text
    AND venture_id = current_setting('app.venture_id')::text
  );

-- Admins can read all earn history for their venture
CREATE POLICY "earn_history_select_admin" ON earn_history
  FOR SELECT USING (
    venture_id = current_setting('app.venture_id')::text
    AND current_setting('app.user_role')::text IN ('admin', 'owner')
  );

-- Only the system can insert earn history (via service role)
CREATE POLICY "earn_history_insert" ON earn_history
  FOR INSERT WITH CHECK (
    current_setting('app.service_role')::text = 'earn_pipeline'
  );

-- Only admins can update earn history (reversals, disputes)
CREATE POLICY "earn_history_update" ON earn_history
  FOR UPDATE USING (
    venture_id = current_setting('app.venture_id')::text
    AND current_setting('app.user_role')::text IN ('admin', 'owner')
  );

-- ── Similar policies for all other earn_* tables ────────────────────
-- (earn_conditions, earn_rewards, earn_multipliers, earn_caps,
--  earn_schedules, earn_ab_tests, earn_events)
-- Follow the same pattern: venture isolation + admin-only writes.
```

---

## Code Examples

### 1. Define a Simple Earn Rule

A straightforward rule: award 10 loyalty points for every purchase over $5.

```typescript
import { EarnService } from '@mcv/engagement/earn';

const earnService = container.resolve(EarnService);

// Create the rule
const rule = await earnService.createRule({
  ventureId: 'venture_abc',
  name: 'Purchase Points — Base',
  slug: 'purchase-points-base',
  description: 'Award 10 loyalty points for every purchase over $5',
  triggerEvent: 'purchase.completed',
  priority: 100,
  exclusive: false,
  tags: ['purchase', 'loyalty', 'base'],
});

// Add a condition: purchase amount >= 5
await earnService.addCondition(rule.id, {
  type: 'event_property',
  field: '$.amount',
  operator: 'gte',
  value: 5,
  sortOrder: 0,
  negated: false,
  description: 'Purchase amount must be at least $5',
});

// Add the reward: 10 loyalty points (fixed)
await earnService.addReward(rule.id, {
  type: 'points',
  baseAmount: 10,
  rewardIdentifier: 'loyalty',
  calculationMode: 'fixed',
  reasonTemplate: 'Earned {{amount}} loyalty points for purchase',
  sortOrder: 0,
});

// Activate the rule
await earnService.activateRule(rule.id);

console.log(`Rule "${rule.name}" is now active`);
// → Rule "Purchase Points — Base" is now active
```

### 2. Complex Multi-Condition Rule with Multipliers

A rule with compound conditions: award per-dollar points with tier multipliers and a weekend bonus.

```typescript
import { EarnService } from '@mcv/engagement/earn';

const earnService = container.resolve(EarnService);

// Create the rule
const rule = await earnService.createRule({
  ventureId: 'venture_abc',
  name: 'Premium Purchase Rewards',
  slug: 'premium-purchase-rewards',
  description: 'Per-dollar points for verified users with tier & weekend multipliers',
  triggerEvent: 'purchase.completed',
  priority: 50, // Higher priority than base rule
  exclusive: false,
  tags: ['purchase', 'premium', 'tiered'],
});

// Build a compound condition tree:
// AND(
//   user.verified === true,
//   OR(user.tier === 'gold', user.tier === 'platinum'),
//   purchase.amount >= 25
// )

// Root AND condition
const rootCondition = await earnService.addCondition(rule.id, {
  logicalOperator: 'AND',
  sortOrder: 0,
  description: 'All conditions must be met',
});

// Leaf: user must be verified
await earnService.addCondition(rule.id, {
  parentId: rootCondition.id,
  type: 'attribute',
  field: 'user.verified',
  operator: 'eq',
  value: true,
  sortOrder: 0,
  description: 'User must be verified',
});

// Branch: OR(gold, platinum)
const tierBranch = await earnService.addCondition(rule.id, {
  parentId: rootCondition.id,
  logicalOperator: 'OR',
  sortOrder: 1,
  description: 'User must be gold or platinum tier',
});

await earnService.addCondition(rule.id, {
  parentId: tierBranch.id,
  type: 'tier',
  field: 'user.tier',
  operator: 'eq',
  value: 'gold',
  sortOrder: 0,
});

await earnService.addCondition(rule.id, {
  parentId: tierBranch.id,
  type: 'tier',
  field: 'user.tier',
  operator: 'eq',
  value: 'platinum',
  sortOrder: 1,
});

// Leaf: minimum purchase amount
await earnService.addCondition(rule.id, {
  parentId: rootCondition.id,
  type: 'event_property',
  field: '$.amount',
  operator: 'gte',
  value: 25,
  sortOrder: 2,
  description: 'Purchase must be at least $25',
});

// Reward: 1 point per dollar spent
await earnService.addReward(rule.id, {
  type: 'points',
  baseAmount: 1,
  rewardIdentifier: 'loyalty',
  calculationMode: 'per_unit',
  quantityPath: '$.amount',
  minAmount: 5,   // At least 5 points even for small amounts
  maxAmount: 500,  // Cap at 500 per single purchase
  reasonTemplate: 'Earned {{amount}} loyalty points for ${{event.amount}} purchase',
  sortOrder: 0,
});

// Tier-based multiplier
await earnService.addMultiplier(rule.id, {
  name: 'Tier Bonus',
  type: 'tier_based',
  value: 1.0, // Default (overridden by config)
  config: {
    type: 'tier_based',
    tierMultipliers: {
      gold: 1.5,      // Gold: 1.5x points
      platinum: 2.0,   // Platinum: 2x points
    },
  },
  priority: 0,
  stackingMode: 'multiplicative',
  stackingGroup: 'tier',
  active: true,
});

// Weekend bonus multiplier
await earnService.addMultiplier(rule.id, {
  name: 'Weekend Double Points',
  type: 'time_based',
  value: 2.0,
  config: {
    type: 'time_based',
    daysOfWeek: [0, 6], // Sunday, Saturday
    timezone: 'America/New_York',
  },
  priority: 1,
  stackingMode: 'multiplicative',
  stackingGroup: 'time',
  active: true,
});

// Activate
await earnService.activateRule(rule.id);

// Simulate: Platinum user, $100 purchase on Saturday
// Base: 100 points (1 per dollar)
// Tier multiplier: 2.0x → 200 points
// Weekend multiplier: 2.0x → 400 points
// Result: 400 loyalty points
```

### 3. Event Matching and Pattern Processing

Demonstrate how the event matcher handles various pattern types and processes events through the pipeline.

```typescript
import { EarnPipeline, buildEarnEventMatcher } from '@mcv/engagement/earn';

// ── Pattern matching examples ────────────────────────────────────────

// Exact match
const exactMatcher = buildEarnEventMatcher({
  typePattern: 'purchase.completed',
});
exactMatcher.matches('purchase.completed');   // true
exactMatcher.matches('purchase.refunded');    // false

// Wildcard match
const wildcardMatcher = buildEarnEventMatcher({
  typePattern: 'social.*',
});
wildcardMatcher.matches('social.like');       // true
wildcardMatcher.matches('social.share');      // true
wildcardMatcher.matches('purchase.completed'); // false

// Regex match
const regexMatcher = buildEarnEventMatcher({
  typePattern: '/^content\\.(create|publish|update)$/',
});
regexMatcher.matches('content.create');       // true
regexMatcher.matches('content.publish');      // true
regexMatcher.matches('content.delete');       // false

// Property filters
const propertyMatcher = buildEarnEventMatcher({
  typePattern: 'purchase.completed',
  propertyFilters: [
    { path: '$.amount', operator: 'gte', value: 100 },
    { path: '$.category', operator: 'in', value: ['electronics', 'fashion'] },
  ],
});

// ── Full pipeline processing ─────────────────────────────────────────

const pipeline = container.resolve(EarnPipeline);

// Process a single event manually
const event: EarnEvent = {
  id: '01HQRS5T6V7W8X9Y0Z1A2B3C4',
  type: 'purchase.completed',
  userId: 'user_123',
  ventureId: 'venture_abc',
  properties: {
    amount: 75.50,
    currency: 'USD',
    category: 'fashion',
    itemCount: 3,
    orderId: 'order_456',
  },
  occurredAt: new Date('2025-02-08T14:30:00Z'),
  receivedAt: new Date(),
  source: 'commerce-service',
  idempotencyKey: 'order_456_earn',
};

const results = await pipeline.process(event);

console.log(`Matched ${results.length} rules:`);
for (const result of results) {
  console.log(`  - ${result.ruleName}: ${result.finalAmount} ${result.rewardType}`);
  console.log(`    Conditions: ${result.conditionsEvaluated} evaluated, ${result.conditionsPassed} passed`);
  console.log(`    Multipliers: ${result.appliedMultipliers.map(m => `${m.multiplierName}(${m.value}x)`).join(', ')}`);
}
// Matched 2 rules:
//   - Purchase Points — Base: 10 points
//     Conditions: 1 evaluated, 1 passed
//     Multipliers: (none)
//   - Premium Purchase Rewards: 226 points
//     Conditions: 3 evaluated, 3 passed
//     Multipliers: Tier Bonus(1.5x), Weekend Double Points(2.0x)

// ── Batch processing (backfill) ──────────────────────────────────────

const events = await fetchHistoricalEvents({ from: '2025-01-01', to: '2025-01-31' });

const batchResults = await pipeline.processBatch(events, {
  commit: true,
  skipCaps: false,       // Respect caps even during backfill
  concurrency: 10,       // Process 10 events in parallel
  onProgress: (processed, total) => {
    console.log(`Progress: ${processed}/${total}`);
  },
});

console.log(`Backfill complete: ${batchResults.processed} events, ${batchResults.rewarded} earns`);
```

### 4. Rate Limiting and Cap Enforcement

Configure various caps and demonstrate enforcement behavior.

```typescript
import { EarnService, CapEnforcer } from '@mcv/engagement/earn';

const earnService = container.resolve(EarnService);

// ── Per-user daily cap ───────────────────────────────────────────────
await earnService.addCap(rule.id, {
  ventureId: 'venture_abc',
  name: 'Daily User Points Cap',
  type: 'per_user',
  limit: 500,              // Max 500 points per user per day
  window: 'daily',
  metric: 'amount',
  rewardType: 'points',
  overflowBehavior: 'reduce',  // Reduce reward to fit remaining budget
  active: true,
});

// ── Per-user weekly earn count cap ──────────────────────────────────
await earnService.addCap(rule.id, {
  ventureId: 'venture_abc',
  name: 'Weekly Earn Frequency Cap',
  type: 'per_user',
  limit: 50,               // Max 50 earn events per user per week
  window: 'weekly',
  metric: 'count',
  overflowBehavior: 'block',   // Block entirely when limit reached
  active: true,
});

// ── Global daily budget cap ─────────────────────────────────────────
await earnService.addCap(null, {  // null ruleId = applies to all rules
  ventureId: 'venture_abc',
  name: 'Daily Points Budget',
  type: 'per_venture',
  limit: 1_000_000,        // Max 1M points awarded per day across all rules
  window: 'daily',
  metric: 'amount',
  rewardType: 'points',
  overflowBehavior: 'block',
  alertThreshold: 800_000,  // Alert at 80% usage
  alertWebhook: 'https://hooks.venture.com/budget-alert',
  active: true,
});

// ── Velocity check (anti-abuse) ──────────────────────────────────────
await earnService.addVelocityCheck({
  ventureId: 'venture_abc',
  name: 'Rapid Earn Detection',
  metric: 'earn_count',
  windowSeconds: 60,        // 1-minute window
  threshold: 10,            // More than 10 earns in 1 minute = suspicious
  action: 'block',
  scope: 'user',
  active: true,
});

await earnService.addVelocityCheck({
  ventureId: 'venture_abc',
  name: 'High-Value Burst Detection',
  metric: 'earn_amount',
  windowSeconds: 3600,      // 1-hour window
  threshold: 10000,         // More than 10,000 points in 1 hour
  action: 'flag',           // Flag for review but allow
  scope: 'user',
  active: true,
});

// ── Cap enforcement in action ────────────────────────────────────────

const capEnforcer = container.resolve(CapEnforcer);

// Check caps before awarding
const capResult = await capEnforcer.check({
  userId: 'user_123',
  ventureId: 'venture_abc',
  ruleId: rule.id,
  rewardType: 'points',
  requestedAmount: 200,
  timestamp: new Date(),
});

if (capResult.allowed) {
  console.log(`Award ${capResult.adjustedAmount} points (requested: 200)`);
  // If 'reduce' behavior and user has 350/500 daily cap used:
  // adjustedAmount = 150 (capped to remaining)
} else {
  console.log(`Blocked: ${capResult.reason}`);
  // "Daily User Points Cap: user has reached 500/500 daily limit"
}

// Query cap usage
const usage = await capEnforcer.getUsage({
  userId: 'user_123',
  ventureId: 'venture_abc',
  window: 'daily',
});

console.log(`Daily usage: ${usage.consumed}/${usage.limit} (${usage.percentUsed}%)`);
// Daily usage: 350/500 (70%)
```

### 5. A/B Testing Earn Rules

Set up and manage an A/B test comparing different reward amounts.

```typescript
import { EarnService, EarnABTestService } from '@mcv/engagement/earn';

const earnService = container.resolve(EarnService);
const abTestService = container.resolve(EarnABTestService);

// Create variants
const controlRule = await earnService.getRule('rule_base_purchase_points');

// Variant A: 50% more points
const variantARule = await earnService.cloneRule(controlRule.id, {
  name: 'Purchase Points — Variant A (50% more)',
  slug: 'purchase-points-variant-a',
});
// Update the cloned rule's reward to 15 points instead of 10
await earnService.updateReward(variantARule.rewards[0].id, {
  baseAmount: 15,
});

// Variant B: Double points but with a lower cap
const variantBRule = await earnService.cloneRule(controlRule.id, {
  name: 'Purchase Points — Variant B (double with cap)',
  slug: 'purchase-points-variant-b',
});
await earnService.updateReward(variantBRule.rewards[0].id, {
  baseAmount: 20,
  maxAmount: 100, // Lower per-earn cap
});

// Create the A/B test
const abTest = await abTestService.create({
  ventureId: 'venture_abc',
  name: 'Purchase Points Optimization Q1',
  description: 'Test whether higher points increase purchase frequency without overspending',
  baseRuleId: controlRule.id,
  variants: [
    {
      name: 'control',
      trafficPercentage: 34,
      ruleId: controlRule.id,
    },
    {
      name: 'variant_a',
      trafficPercentage: 33,
      ruleId: variantARule.id,
    },
    {
      name: 'variant_b',
      trafficPercentage: 33,
      ruleId: variantBRule.id,
    },
  ],
  assignmentStrategy: 'deterministic', // Same user always sees same variant
  primaryMetric: 'engagement_rate',
  minSampleSize: 5000,
  confidenceLevel: 0.95,
  autoOptimize: true,
  maxDurationDays: 30,
});

// Start the test
await abTestService.start(abTest.id);

// ── Check results after some time ────────────────────────────────────

const results = await abTestService.getResults(abTest.id);

console.log('A/B Test Results:');
for (const variant of results.variants) {
  console.log(`  ${variant.name}:`);
  console.log(`    Sample: ${variant.metrics.sampleSize}`);
  console.log(`    Earns: ${variant.metrics.earnCount}`);
  console.log(`    Total Amount: ${variant.metrics.earnAmount}`);
  console.log(`    Engagement Rate: ${(variant.metrics.engagementRate * 100).toFixed(1)}%`);
  console.log(`    Unique Users: ${variant.metrics.uniqueUsers}`);
}

console.log(`\nStatistical significance: ${results.significant ? 'YES' : 'Not yet'}`);
if (results.significant) {
  console.log(`Winner: ${results.winner.name} (p=${results.pValue.toFixed(4)})`);
}

// A/B Test Results:
//   control:
//     Sample: 5200
//     Earns: 12400
//     Total Amount: 124000
//     Engagement Rate: 42.3%
//     Unique Users: 5200
//   variant_a:
//     Sample: 5150
//     Earns: 14800
//     Total Amount: 222000
//     Engagement Rate: 48.7%
//     Unique Users: 5150
//   variant_b:
//     Sample: 5100
//     Earns: 13200
//     Total Amount: 198000
//     Engagement Rate: 45.1%
//     Unique Users: 5100
//
// Statistical significance: YES
// Winner: variant_a (p=0.0023)

// Auto-optimize promoted variant_a to 100% traffic
```

### 6. Cross-Venture Earn Rule Inheritance

Create platform-wide rules that ventures can inherit and override.

```typescript
import { EarnService, EarnInheritanceService } from '@mcv/engagement/earn';

const earnService = container.resolve(EarnService);
const inheritanceService = container.resolve(EarnInheritanceService);

// ── Platform admin creates a platform-wide rule ──────────────────────

const platformRule = await earnService.createRule({
  ventureId: 'platform',  // Special platform-level venture
  name: 'Daily Login Bonus',
  slug: 'daily-login-bonus',
  description: 'Award points for daily login across all ventures',
  triggerEvent: 'user.login',
  priority: 200,
  tags: ['platform', 'login', 'daily'],
});

// Condition: first login of the day
await earnService.addCondition(platformRule.id, {
  type: 'frequency',
  field: 'user.login',
  operator: 'eq',
  value: 1,  // Exactly the 1st login today
  sortOrder: 0,
  cacheTtlSeconds: 60,
  description: 'First login of the day',
});

// Reward: 5 loyalty points
await earnService.addReward(platformRule.id, {
  type: 'points',
  baseAmount: 5,
  rewardIdentifier: 'loyalty',
  calculationMode: 'fixed',
  reasonTemplate: 'Daily login bonus: {{amount}} loyalty points',
  sortOrder: 0,
});

// Streak multiplier: longer streaks = more points
await earnService.addMultiplier(platformRule.id, {
  name: 'Login Streak Bonus',
  type: 'streak',
  value: 1.0,
  config: {
    type: 'streak',
    streakSlug: 'daily-login',
    thresholds: [
      { days: 3, multiplier: 1.5 },   // 3-day streak: 1.5x
      { days: 7, multiplier: 2.0 },   // 7-day streak: 2x
      { days: 14, multiplier: 2.5 },  // 14-day streak: 2.5x
      { days: 30, multiplier: 3.0 },  // 30-day streak: 3x
    ],
  },
  priority: 0,
  stackingMode: 'replace', // Use the highest matching threshold
  stackingGroup: 'streak',
  active: true,
});

await earnService.activateRule(platformRule.id);

// ── Venture inherits and overrides ───────────────────────────────────

// Venture "FitLife" wants to give 10 points instead of 5
const fitLifeOverride = await inheritanceService.createOverride({
  parentRuleId: platformRule.id,
  ventureId: 'venture_fitlife',
  name: 'Daily Login Bonus (FitLife)',
  overrides: {
    rewards: [{
      type: 'points',
      baseAmount: 10,  // Override: 10 points instead of 5
      rewardIdentifier: 'fitness-points',  // Different point type
      calculationMode: 'fixed',
      reasonTemplate: 'FitLife daily login: {{amount}} fitness points',
      sortOrder: 0,
    }],
    // Inherits all conditions and multipliers from parent
  },
});

// Venture "GameZone" wants to add an extra XP reward on top
const gameZoneOverride = await inheritanceService.createOverride({
  parentRuleId: platformRule.id,
  ventureId: 'venture_gamezone',
  name: 'Daily Login Bonus (GameZone)',
  overrides: {
    rewards: [
      // Keep the base points reward (inherited)
      // Add XP reward
      {
        type: 'xp',
        baseAmount: 25,
        rewardIdentifier: 'player-xp',
        calculationMode: 'fixed',
        reasonTemplate: 'GameZone daily login: {{amount}} XP',
        sortOrder: 1,
      },
    ],
    // Add a combo multiplier specific to GameZone
    multipliers: [{
      name: 'Login Combo Bonus',
      type: 'combo',
      value: 1.0,
      config: {
        type: 'combo',
        comboEvent: 'user.login',
        comboWindow: '24h',
        thresholds: [
          { count: 2, multiplier: 1.2 },  // 2nd login today: 1.2x
          { count: 3, multiplier: 1.5 },  // 3rd login: 1.5x
        ],
      },
      priority: 1,
      stackingMode: 'multiplicative',
      stackingGroup: 'combo',
      active: true,
    }],
  },
});

// ── View effective rules for a venture ───────────────────────────────

const effectiveRules = await inheritanceService.getEffectiveRules('venture_gamezone');
console.log(`GameZone has ${effectiveRules.length} effective earn rules:`);
for (const rule of effectiveRules) {
  console.log(`  - ${rule.name} (${rule.inherited ? 'inherited' : 'own'})`);
  console.log(`    Trigger: ${rule.triggerEvent}`);
  console.log(`    Rewards: ${rule.rewards.map(r => `${r.baseAmount} ${r.rewardIdentifier}`).join(', ')}`);
}
// GameZone has 3 effective earn rules:
//   - Daily Login Bonus (GameZone) (inherited + overridden)
//     Trigger: user.login
//     Rewards: 5 loyalty, 25 player-xp
//   - Purchase Points — Base (own)
//     Trigger: purchase.completed
//     Rewards: 10 loyalty
//   ... etc
```

### 7. Earn History Reversal and Dispute Resolution

Handle reversals and process disputes against earn events.

```typescript
import { EarnService, EarnHistoryService, EarnDisputeService } from '@mcv/engagement/earn';

const earnService = container.resolve(EarnService);
const historyService = container.resolve(EarnHistoryService);
const disputeService = container.resolve(EarnDisputeService);

// ── Query earn history ───────────────────────────────────────────────

const history = await historyService.query({
  userId: 'user_123',
  ventureId: 'venture_abc',
  from: new Date('2025-02-01'),
  to: new Date('2025-02-08'),
  rewardType: 'points',
  page: 1,
  pageSize: 20,
  sortBy: 'earned_at',
  sortOrder: 'desc',
});

console.log(`User earned ${history.total} times in this period:`);
for (const entry of history.items) {
  console.log(`  [${entry.earnedAt.toISOString()}] ${entry.ruleName}: +${entry.finalAmount} ${entry.rewardIdentifier}`);
  if (entry.appliedMultipliers.length > 0) {
    console.log(`    Multipliers: ${entry.appliedMultipliers.map(m => `${m.multiplierName}(${m.value}x)`).join(', ')}`);
  }
}

// ── Single reversal (e.g., fraudulent purchase detected) ─────────────

const reversedEntry = await earnService.reverse(
  'earn_hist_abc123',  // earn history ID
  'Fraudulent purchase detected — order #456 was charged back',
);

console.log(`Reversed: -${reversedEntry.finalAmount} ${reversedEntry.rewardIdentifier}`);
console.log(`Status: ${reversedEntry.status}`);  // 'reversed'
// This emits engagement.rewards.points.reversal to Redpanda
// The points module will debit the user's balance

// ── Bulk reversal (e.g., bot detected, reverse all earns) ───────────

const botEarns = await historyService.query({
  userId: 'user_bot_suspect',
  ventureId: 'venture_abc',
  from: new Date('2025-02-01'),
  status: 'granted',
});

const reversedEntries = await earnService.bulkReverse(
  botEarns.items.map(e => e.id),
  'Automated abuse detection — account flagged as bot',
);

console.log(`Bulk reversed ${reversedEntries.length} earn events`);

// ── File a dispute (user claims they should have earned more) ────────

const dispute = await disputeService.file({
  earnHistoryId: 'earn_hist_def456',
  filedBy: 'user_123',
  filedByType: 'user',
  reason: 'I purchased $200 worth of items but only received 10 points instead of the expected 200',
  requestedResolution: 'adjust_up',
  requestedAmount: 200,
  evidence: [
    {
      type: 'text',
      content: 'Order confirmation shows $200.00 total',
      addedBy: 'user_123',
      addedAt: new Date(),
    },
    {
      type: 'url',
      content: 'https://venture.com/orders/789',
      addedBy: 'user_123',
      addedAt: new Date(),
    },
  ],
});

console.log(`Dispute filed: ${dispute.id} (status: ${dispute.status})`);

// ── Admin resolves the dispute ───────────────────────────────────────

const resolved = await disputeService.resolve(dispute.id, {
  action: 'adjusted',
  adjustedAmount: 190, // Award the missing 190 points
  notes: 'Confirmed: the per_unit calculation used wrong quantity path. Bug fix deployed. Awarding difference.',
  resolvedBy: 'admin_jane',
});

console.log(`Dispute resolved: ${resolved.resolution.action}`);
console.log(`Adjusted by: +${resolved.resolution.adjustedAmount} points`);

// ── Query disputes ──────────────────────────────────────────────────

const openDisputes = await disputeService.list({
  ventureId: 'venture_abc',
  status: 'open',
  page: 1,
  pageSize: 50,
});

console.log(`${openDisputes.total} open disputes pending review`);
```

### 8. Scheduled Boost Periods with Budget Controls

Configure a "Happy Hour" boost that runs on a recurring schedule with budget protection.

```typescript
import { EarnService, EarnScheduler, EarnBudgetService } from '@mcv/engagement/earn';

const earnService = container.resolve(EarnService);
const scheduler = container.resolve(EarnScheduler);
const budgetService = container.resolve(EarnBudgetService);

// ── Create a Happy Hour earn rule ────────────────────────────────────

const happyHourRule = await earnService.createRule({
  ventureId: 'venture_abc',
  name: 'Happy Hour — Triple Points',
  slug: 'happy-hour-triple-points',
  description: 'Triple points on all purchases during Happy Hour (5-7 PM EST weekdays)',
  triggerEvent: 'purchase.completed',
  priority: 10, // Highest priority — overrides base purchase rules
  exclusive: true, // When this matches, skip lower-priority purchase rules
  tags: ['happy-hour', 'boost', 'scheduled'],
});

// Reward: 3 points per dollar
await earnService.addReward(happyHourRule.id, {
  type: 'points',
  baseAmount: 3,
  rewardIdentifier: 'loyalty',
  calculationMode: 'per_unit',
  quantityPath: '$.amount',
  maxAmount: 1500, // Max 1500 points per purchase during happy hour
  reasonTemplate: '🎉 Happy Hour! Earned {{amount}} triple loyalty points',
  sortOrder: 0,
});

// Schedule: weekdays 5-7 PM EST
await earnService.addSchedule(happyHourRule.id, {
  name: 'Weekday Happy Hour',
  type: 'recurring',
  cronActivate: '0 17 * * 1-5',      // 5:00 PM Mon-Fri
  cronDeactivate: '0 19 * * 1-5',    // 7:00 PM Mon-Fri
  timezone: 'America/New_York',
  active: true,
});

// ── Also create a weekend boost ──────────────────────────────────────

const weekendBoostRule = await earnService.createRule({
  ventureId: 'venture_abc',
  name: 'Weekend Warrior — Double XP',
  slug: 'weekend-double-xp',
  description: 'Double XP on all activities during weekends',
  triggerEvent: '*', // All events
  priority: 20,
  exclusive: false, // Stacks with other rules
  tags: ['weekend', 'boost', 'xp'],
});

await earnService.addReward(weekendBoostRule.id, {
  type: 'xp',
  baseAmount: 2,
  rewardIdentifier: 'engagement-xp',
  calculationMode: 'per_unit',
  quantityPath: '$.baseXp', // Assumes events carry a base XP value
  reasonTemplate: '🏆 Weekend Warrior: {{amount}} bonus XP',
  sortOrder: 0,
});

await earnService.addSchedule(weekendBoostRule.id, {
  name: 'Weekend All Day',
  type: 'recurring',
  cronActivate: '0 0 * * 6',         // Saturday midnight
  cronDeactivate: '0 0 * * 1',       // Monday midnight
  timezone: 'America/New_York',
  active: true,
});

// ── Budget allocation ────────────────────────────────────────────────

// Allocate monthly budget for Happy Hour rewards
await budgetService.allocate({
  ventureId: 'venture_abc',
  ruleId: happyHourRule.id,
  rewardType: 'points',
  rewardIdentifier: 'loyalty',
  allocatedAmount: 5_000_000, // 5M points monthly budget
  periodStart: new Date('2025-02-01'),
  periodEnd: new Date('2025-03-01'),
  exhaustionBehavior: 'block', // Stop awarding when budget runs out
  alertThreshold: 80,          // Alert at 80%
});

// Allocate venture-wide monthly budget
await budgetService.allocate({
  ventureId: 'venture_abc',
  rewardType: 'points',
  rewardIdentifier: 'loyalty',
  allocatedAmount: 50_000_000, // 50M total points budget
  periodStart: new Date('2025-02-01'),
  periodEnd: new Date('2025-03-01'),
  exhaustionBehavior: 'alert', // Alert but allow overspend
  alertThreshold: 90,
});

// ── Monitor budget consumption ───────────────────────────────────────

const budgetStatus = await budgetService.getStatus({
  ventureId: 'venture_abc',
  ruleId: happyHourRule.id,
  rewardType: 'points',
});

console.log('Happy Hour Budget Status:');
console.log(`  Allocated: ${budgetStatus.allocatedAmount.toLocaleString()}`);
console.log(`  Consumed:  ${budgetStatus.consumedAmount.toLocaleString()}`);
console.log(`  Reserved:  ${budgetStatus.reservedAmount.toLocaleString()}`);
console.log(`  Remaining: ${budgetStatus.remainingAmount.toLocaleString()}`);
console.log(`  Usage:     ${budgetStatus.percentUsed.toFixed(1)}%`);
console.log(`  Alert:     ${budgetStatus.alertTriggered ? '⚠️ TRIGGERED' : '✅ OK'}`);

// Happy Hour Budget Status:
//   Allocated: 5,000,000
//   Consumed:  3,250,000
//   Reserved:  12,500
//   Remaining: 1,737,500
//   Usage:     65.3%
//   Alert:     ✅ OK

// ── View schedule state ──────────────────────────────────────────────

const scheduleState = await scheduler.getState('venture_abc');
console.log('Active scheduled rules:');
for (const active of scheduleState.activeRules) {
  console.log(`  - ${active.ruleName} (until ${active.deactivatesAt.toLocaleString()})`);
}
console.log('Upcoming activations:');
for (const upcoming of scheduleState.upcoming.slice(0, 5)) {
  console.log(`  - ${upcoming.ruleName} at ${upcoming.activatesAt.toLocaleString()}`);
}
```

---

## Error Codes

All error codes are prefixed with `EARN_` and exported from `@mcv/engagement/earn` as `EARN_ERROR_CODES`.

| Code | HTTP | Description |
|------|------|-------------|
| `EARN_RULE_NOT_FOUND` | 404 | Earn rule with the specified ID does not exist or is not accessible in the current venture context. |
| `EARN_RULE_NOT_EDITABLE` | 409 | Cannot edit a rule that is active or archived. Pause the rule first. |
| `EARN_RULE_NOT_ACTIVATABLE` | 409 | Cannot activate a rule that has validation errors (e.g., no reward defined, invalid conditions). |
| `EARN_RULE_NOT_DELETABLE` | 409 | Only draft rules can be deleted. Archive the rule instead. |
| `EARN_RULE_SLUG_CONFLICT` | 409 | A rule with this slug already exists in the venture. |
| `EARN_RULE_CIRCULAR_INHERITANCE` | 422 | Rule inheritance creates a circular dependency. |
| `EARN_CONDITION_INVALID` | 422 | Condition configuration is invalid (e.g., missing field, incompatible operator/type). |
| `EARN_CONDITION_TREE_INVALID` | 422 | Condition tree structure is invalid (e.g., NOT has multiple children, dangling references). |
| `EARN_CONDITION_EVALUATION_FAILED` | 500 | Condition evaluation encountered an unexpected error. The event is skipped for this rule. |
| `EARN_REWARD_INVALID` | 422 | Reward configuration is invalid (e.g., negative base amount, invalid formula syntax). |
| `EARN_REWARD_FORMULA_ERROR` | 422 | Reward formula could not be parsed or contains disallowed functions. |
| `EARN_MULTIPLIER_INVALID` | 422 | Multiplier configuration is invalid (e.g., negative value, invalid stacking mode). |
| `EARN_MULTIPLIER_CONFLICT` | 409 | Multiplier stacking configuration creates an irreconcilable conflict. |
| `EARN_CAP_EXCEEDED` | 429 | Earn was blocked because a cap limit was reached. |
| `EARN_CAP_INVALID` | 422 | Cap configuration is invalid (e.g., negative limit, invalid window). |
| `EARN_BUDGET_EXHAUSTED` | 429 | Earn was blocked because the budget for this rule/venture is exhausted. |
| `EARN_BUDGET_NOT_FOUND` | 404 | No budget allocation found for the specified parameters. |
| `EARN_SCHEDULE_INVALID` | 422 | Schedule configuration is invalid (e.g., invalid cron expression, end before start). |
| `EARN_SCHEDULE_CONFLICT` | 409 | Schedule overlaps with another schedule on the same rule. |
| `EARN_ABTEST_INVALID` | 422 | A/B test configuration is invalid (e.g., traffic percentages don't sum to 100). |
| `EARN_ABTEST_NOT_STARTABLE` | 409 | A/B test cannot be started (e.g., already running, base rule not active). |
| `EARN_ABTEST_NOT_FOUND` | 404 | A/B test with the specified ID does not exist. |
| `EARN_EVENT_DUPLICATE` | 409 | Event with this idempotency key has already been processed. |
| `EARN_EVENT_INVALID` | 422 | Event payload failed schema validation. |
| `EARN_EVENT_EXPIRED` | 422 | Event timestamp is too old to process (exceeds max age policy). |
| `EARN_VELOCITY_EXCEEDED` | 429 | User's earn velocity exceeds the configured threshold. Blocked or flagged. |
| `EARN_HISTORY_NOT_FOUND` | 404 | Earn history entry with the specified ID does not exist. |
| `EARN_REVERSAL_ALREADY_REVERSED` | 409 | This earn event has already been reversed. |
| `EARN_REVERSAL_EXPIRED` | 422 | Reversal window has expired. Earn events older than the configured reversal window cannot be reversed. |
| `EARN_DISPUTE_NOT_FOUND` | 404 | Dispute with the specified ID does not exist. |
| `EARN_DISPUTE_ALREADY_RESOLVED` | 409 | This dispute has already been resolved or rejected. |
| `EARN_DISPUTE_INVALID` | 422 | Dispute request is invalid (e.g., missing reason, invalid requested resolution). |
| `EARN_PIPELINE_TIMEOUT` | 504 | Earn pipeline evaluation timed out for this event. The event will be retried. |
| `EARN_PIPELINE_OVERLOADED` | 503 | Earn pipeline is experiencing backpressure. Events are being queued for later processing. |
| `EARN_INHERITANCE_NOT_FOUND` | 404 | Parent rule for inheritance does not exist or is not a platform-level rule. |
| `EARN_INHERITANCE_INCOMPATIBLE` | 422 | Override is incompatible with the parent rule (e.g., overriding a field that doesn't exist on parent). |

### Error Response Format

All errors follow the standard MCV.ONE error response format:

```typescript
interface EarnError {
  code: string;          // e.g., 'EARN_RULE_NOT_FOUND'
  message: string;       // Human-readable description
  statusCode: number;    // HTTP status code
  details?: {
    ruleId?: string;
    userId?: string;
    ventureId?: string;
    field?: string;
    constraint?: string;
    [key: string]: unknown;
  };
}

// Example error response:
// {
//   "code": "EARN_CAP_EXCEEDED",
//   "message": "Daily User Points Cap: user has reached 500/500 daily limit",
//   "statusCode": 429,
//   "details": {
//     "capId": "cap_01HQRS...",
//     "capName": "Daily User Points Cap",
//     "userId": "user_123",
//     "limit": 500,
//     "consumed": 500,
//     "window": "daily",
//     "resetsAt": "2025-02-09T00:00:00-05:00"
//   }
// }
```

---

## Security

### Multi-Tenant Isolation

All earn module data is strictly isolated per venture through Supabase Row-Level Security (RLS):

- **Every table** has a `venture_id` column that is mandatory and non-nullable.
- **RLS policies** ensure queries only return data for the authenticated venture context.
- **Platform-level rules** (`venture_id = 'platform'`) are readable by all ventures but writable only by platform administrators.
- **Service-role operations** (pipeline processing) use elevated permissions but always scope to the event's `venture_id`.
- **Cross-venture queries** are impossible through the standard API — only the platform admin dashboard can view across ventures.

### Anti-Abuse Protections

The earn module implements multiple layers of abuse prevention:

1. **Rate Limiting (Caps)**
   - Per-user caps prevent individual users from earning beyond configured limits.
   - Per-rule and per-venture caps prevent budget overruns.
   - Rolling window caps detect burst patterns.

2. **Velocity Checks**
   - Monitor earn frequency and amount over sliding windows.
   - Configurable actions: block, flag, reduce, or cooldown.
   - Multiple scopes: per-user, per-IP, per-device, per-session.

3. **Idempotency**
   - Every event has an optional `idempotencyKey`. If provided, duplicate processing is prevented.
   - The pipeline maintains a deduplication window (configurable, default 24 hours).

4. **Event Age Validation**
   - Events older than the configured maximum age (`EARN_MAX_EVENT_AGE_HOURS`) are rejected.
   - Prevents replay attacks with stale events.

5. **Formula Sandboxing**
   - Custom reward formulas are evaluated in a sandboxed expression engine.
   - Only whitelisted functions are available (`floor`, `ceil`, `min`, `max`, `round`, `abs`).
   - No access to filesystem, network, or process APIs.
   - Formula evaluation has a timeout (`EARN_FORMULA_TIMEOUT_MS`, default 100ms).

6. **Budget Controls**
   - Hard budget limits prevent overspending.
   - Alert thresholds trigger notifications before exhaustion.
   - Reserved amounts account for in-flight evaluations.

### Data Privacy

- **Earn history** contains user IDs and event details. Access is controlled by RLS:
  - Users can only see their own earn history.
  - Venture admins can see all earn history for their venture.
- **Evaluation snapshots** (stored in `earn_history.evaluation_snapshot`) contain the full event payload. These are retained for the configured audit period (`EARN_AUDIT_RETENTION_DAYS`) and then purged.
- **PII scrubbing**: Event properties containing PII markers (configurable) are redacted before being stored in the evaluation snapshot.
- **Data export**: The earn history supports GDPR data export requests through the platform's data portability API.
- **Data deletion**: User earn history can be anonymized (not deleted, for aggregate integrity) through the platform's right-to-erasure API.

### Audit Trail

Every earn event produces an immutable audit record in `earn_history`:

- **What was earned**: reward type, identifier, base amount, final amount.
- **Why it was earned**: rule ID, rule version, matched conditions, applied multipliers.
- **When it was earned**: event timestamp, processing timestamp.
- **Context**: full evaluation snapshot (optional, for debugging).
- **Modifications**: reversal details, dispute resolution details.

Audit records are append-only. Reversals create new entries; they do not modify the original record. The original record's `status` is updated to `'reversed'`, but the original amounts and details remain intact.

### Authorization Model

| Operation | Required Role | Scope |
|-----------|---------------|-------|
| View earn rules | `member` | Own venture + platform rules |
| Create/edit/delete earn rules | `admin`, `owner` | Own venture only |
| Activate/pause earn rules | `admin`, `owner` | Own venture only |
| View own earn history | `member` | Own records only |
| View all earn history | `admin`, `owner` | Own venture |
| Reverse earn events | `admin`, `owner` | Own venture |
| File dispute | `member` | Own earn events |
| Resolve dispute | `admin`, `owner` | Own venture |
| Manage A/B tests | `admin`, `owner` | Own venture |
| Manage platform rules | `platform_admin` | Platform scope |
| Manage budgets | `admin`, `owner` | Own venture |
| View pipeline metrics | `admin`, `owner` | Own venture |

---

## Environment Variables

| Variable | Type | Default | Description |
|----------|------|---------|-------------|
| `EARN_PIPELINE_ENABLED` | `boolean` | `true` | Master switch for the earn pipeline. When false, events are consumed but not evaluated. |
| `EARN_PIPELINE_CONCURRENCY` | `number` | `50` | Maximum concurrent event evaluations in the pipeline. |
| `EARN_PIPELINE_BATCH_SIZE` | `number` | `100` | Number of events consumed from Redpanda per batch. |
| `EARN_PIPELINE_POLL_INTERVAL_MS` | `number` | `100` | Redpanda consumer poll interval in milliseconds. |
| `EARN_PIPELINE_COMMIT_INTERVAL_MS` | `number` | `5000` | Redpanda consumer offset commit interval. |
| `EARN_MAX_EVENT_AGE_HOURS` | `number` | `72` | Maximum age of events accepted for processing (hours). Older events are rejected. |
| `EARN_RULE_CACHE_TTL_SECONDS` | `number` | `60` | How long to cache active rules in memory before refreshing from DB. |
| `EARN_CONDITION_CACHE_TTL_SECONDS` | `number` | `30` | Default cache TTL for condition evaluation results. |
| `EARN_CAP_CHECK_CACHE_TTL_SECONDS` | `number` | `5` | Cache TTL for cap usage lookups. Lower = more accurate, higher = better performance. |
| `EARN_FORMULA_TIMEOUT_MS` | `number` | `100` | Maximum execution time for custom reward formulas. |
| `EARN_FORMULA_MAX_DEPTH` | `number` | `10` | Maximum nesting depth for formula expressions. |
| `EARN_AUDIT_RETENTION_DAYS` | `number` | `365` | How long to retain detailed evaluation snapshots in earn_history. |
| `EARN_HISTORY_RETENTION_DAYS` | `number` | `730` | How long to retain earn_history records (without snapshots). |
| `EARN_DEDUP_WINDOW_HOURS` | `number` | `24` | Idempotency deduplication window. |
| `EARN_REVERSAL_WINDOW_DAYS` | `number` | `90` | Maximum age of earn events that can be reversed. |
| `EARN_VELOCITY_WINDOW_MAX_SECONDS` | `number` | `86400` | Maximum window size for velocity checks (24 hours). |
| `EARN_ABTEST_MIN_SAMPLE_SIZE` | `number` | `100` | Minimum sample size for A/B test significance calculations. |
| `EARN_BUDGET_RESERVATION_TTL_SECONDS` | `number` | `300` | How long budget reservations are held for in-flight evaluations. |
| `EARN_REDPANDA_CONSUMER_GROUP` | `string` | `'earn-pipeline'` | Redpanda consumer group ID. |
| `EARN_REDPANDA_TOPICS` | `string` | `'engagement.events.*'` | Redpanda topic pattern to consume. |
| `EARN_METRICS_ENABLED` | `boolean` | `true` | Enable Prometheus metrics export. |
| `EARN_METRICS_PREFIX` | `string` | `'mcv_earn_'` | Prometheus metrics prefix. |
| `EARN_LOG_LEVEL` | `string` | `'info'` | Log level for earn pipeline operations. Set to 'debug' for detailed evaluation logging. |
| `EARN_PII_FIELDS` | `string` | `'email,phone,ssn,address'` | Comma-separated list of event property names to redact from evaluation snapshots. |
| `EARN_SNAPSHOT_ENABLED` | `boolean` | `true` | Whether to store full evaluation snapshots in earn_history. Disable for storage savings. |

---

## Dependencies

### Internal Dependencies

| Package | Purpose |
|---------|---------|
| `@mcv/shared/id` | ULID generation for entity IDs. |
| `@mcv/shared/errors` | Standard error classes and error code infrastructure. |
| `@mcv/shared/validation` | Zod schema utilities and validation helpers. |
| `@mcv/shared/pagination` | Paginated result types and cursor utilities. |
| `@mcv/shared/time` | Time window calculations, cron parsing, timezone handling. |
| `@mcv/shared/cache` | In-memory and Redis-backed caching primitives. |
| `@mcv/shared/metrics` | Prometheus metric registration and export. |
| `@mcv/infra/db` | Drizzle ORM client, connection pooling, RLS context setting. |
| `@mcv/infra/redpanda` | Redpanda producer/consumer wrappers, topic management. |
| `@mcv/infra/logger` | Structured logging (Pino-based). |
| `@mcv/engagement/points` | Point type definitions (for reward identifier validation). |
| `@mcv/engagement/tiers` | Tier definitions (for tier-based multiplier lookups). |
| `@mcv/engagement/streaks` | Streak status queries (for streak-based conditions/multipliers). |
| `@mcv/engagement/segments` | Segment membership queries (for segment-based conditions). |
| `@mcv/auth/context` | Venture and user context extraction from request/event. |

### External Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| `drizzle-orm` | `^0.34.x` | ORM for type-safe database queries. |
| `@trpc/server` | `^11.x` | Type-safe API router definition. |
| `zod` | `^3.23.x` | Runtime schema validation for inputs. |
| `jsonpath-plus` | `^9.x` | JSONPath evaluation for event property extraction. |
| `cron-parser` | `^4.x` | Cron expression parsing for schedule evaluation. |
| `expr-eval` | `^2.x` | Sandboxed mathematical expression evaluation for formulas. |
| `murmurhash3js` | `^3.x` | Deterministic hashing for A/B test user assignment. |
| `luxon` | `^3.x` | Timezone-aware date/time operations. |

---

## Testing

### Unit Tests

Unit tests cover individual components in isolation:

```typescript
import { describe, it, expect, vi } from 'vitest';
import { ConditionEvaluator } from '@mcv/engagement/earn';
import { createTestEarnEvent, createTestEarnCondition } from '@mcv/engagement/earn/testing';

describe('ConditionEvaluator', () => {
  const evaluator = new ConditionEvaluator();

  describe('attribute conditions', () => {
    it('should evaluate user attribute equality', async () => {
      const condition = createTestEarnCondition({
        type: 'attribute',
        field: 'user.tier',
        operator: 'eq',
        value: 'gold',
      });

      const context = {
        user: { id: 'user_123', tier: 'gold', verified: true },
        event: createTestEarnEvent(),
      };

      const result = await evaluator.evaluate(condition, context);
      expect(result.passed).toBe(true);
      expect(result.evaluatedValue).toBe('gold');
    });

    it('should evaluate negated conditions', async () => {
      const condition = createTestEarnCondition({
        type: 'attribute',
        field: 'user.tier',
        operator: 'eq',
        value: 'gold',
        negated: true,
      });

      const context = {
        user: { id: 'user_123', tier: 'gold' },
        event: createTestEarnEvent(),
      };

      const result = await evaluator.evaluate(condition, context);
      expect(result.passed).toBe(false); // Negated: gold === gold → true → negated → false
    });
  });

  describe('event_property conditions', () => {
    it('should evaluate JSONPath expressions', async () => {
      const condition = createTestEarnCondition({
        type: 'event_property',
        field: '$.properties.amount',
        operator: 'gte',
        value: 50,
      });

      const event = createTestEarnEvent({
        properties: { amount: 75.50 },
      });

      const result = await evaluator.evaluate(condition, { event, user: {} });
      expect(result.passed).toBe(true);
      expect(result.evaluatedValue).toBe(75.50);
    });

    it('should handle nested JSONPath', async () => {
      const condition = createTestEarnCondition({
        type: 'event_property',
        field: '$.properties.items[0].category',
        operator: 'eq',
        value: 'electronics',
      });

      const event = createTestEarnEvent({
        properties: {
          items: [{ category: 'electronics', price: 299 }],
        },
      });

      const result = await evaluator.evaluate(condition, { event, user: {} });
      expect(result.passed).toBe(true);
    });
  });

  describe('compound conditions', () => {
    it('should short-circuit AND on first failure', async () => {
      const spy = vi.fn();
      const tree = {
        logicalOperator: 'AND' as const,
        children: [
          createTestEarnCondition({ type: 'attribute', field: 'user.tier', operator: 'eq', value: 'platinum' }),
          createTestEarnCondition({ type: 'event_property', field: '$.amount', operator: 'gte', value: 100 }),
        ],
      };

      const context = {
        user: { tier: 'gold' }, // Fails first condition
        event: createTestEarnEvent({ properties: { amount: 200 } }),
      };

      const result = await evaluator.evaluateTree(tree, context);
      expect(result.passed).toBe(false);
      // Second condition should not have been evaluated (short-circuit)
      expect(result.conditionsEvaluated).toBe(1);
    });
  });

  describe('frequency conditions', () => {
    it('should count events within the time window', async () => {
      const condition = createTestEarnCondition({
        type: 'frequency',
        field: 'purchase.completed',
        operator: 'gte',
        value: 5,
      });

      // Mock the frequency counter to return 5
      const mockCounter = vi.fn().mockResolvedValue(5);
      evaluator.setFrequencyCounter(mockCounter);

      const result = await evaluator.evaluate(condition, {
        user: { id: 'user_123' },
        event: createTestEarnEvent(),
      });

      expect(result.passed).toBe(true);
      expect(mockCounter).toHaveBeenCalledWith('user_123', 'purchase.completed', expect.any(Object));
    });
  });
});
```

### Integration Tests

Integration tests verify the full pipeline against a real database:

```typescript
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { EarnTestHarness } from '@mcv/engagement/earn/testing';

describe('EarnPipeline (integration)', () => {
  let harness: EarnTestHarness;

  beforeAll(async () => {
    harness = await EarnTestHarness.create({
      database: true,    // Use test database
      redpanda: false,   // Mock Redpanda (unit test the pipeline, not the transport)
    });
  });

  afterAll(async () => {
    await harness.teardown();
  });

  it('should process a purchase event and award points', async () => {
    // Setup: create rule with condition and reward
    const rule = await harness.createRule({
      triggerEvent: 'purchase.completed',
      status: 'active',
    });

    await harness.addCondition(rule.id, {
      type: 'event_property',
      field: '$.amount',
      operator: 'gte',
      value: 10,
    });

    await harness.addReward(rule.id, {
      type: 'points',
      baseAmount: 1,
      rewardIdentifier: 'loyalty',
      calculationMode: 'per_unit',
      quantityPath: '$.amount',
    });

    // Act: process event
    const results = await harness.processEvent({
      type: 'purchase.completed',
      userId: 'user_test_1',
      properties: { amount: 50, currency: 'USD' },
    });

    // Assert
    expect(results).toHaveLength(1);
    expect(results[0].rewardType).toBe('points');
    expect(results[0].finalAmount).toBe(50); // 1 point per dollar × $50

    // Verify history was recorded
    const history = await harness.getHistory({ userId: 'user_test_1' });
    expect(history.items).toHaveLength(1);
    expect(history.items[0].finalAmount).toBe(50);
    expect(history.items[0].status).toBe('granted');
  });

  it('should enforce per-user daily cap', async () => {
    const rule = await harness.createActiveRuleWithReward({
      triggerEvent: 'action.completed',
      reward: { type: 'points', baseAmount: 100, rewardIdentifier: 'loyalty', calculationMode: 'fixed' },
    });

    await harness.addCap(rule.id, {
      type: 'per_user',
      limit: 250,
      window: 'daily',
      metric: 'amount',
      rewardType: 'points',
      overflowBehavior: 'reduce',
    });

    // First earn: 100 points (within cap)
    const r1 = await harness.processEvent({ type: 'action.completed', userId: 'user_cap_test' });
    expect(r1[0].finalAmount).toBe(100);

    // Second earn: 100 points (within cap, total 200)
    const r2 = await harness.processEvent({ type: 'action.completed', userId: 'user_cap_test' });
    expect(r2[0].finalAmount).toBe(100);

    // Third earn: should be reduced to 50 (cap 250, consumed 200, remaining 50)
    const r3 = await harness.processEvent({ type: 'action.completed', userId: 'user_cap_test' });
    expect(r3[0].finalAmount).toBe(50);
    expect(r3[0].capAdjustments).toHaveLength(1);
    expect(r3[0].capAdjustments[0].originalAmount).toBe(100);
    expect(r3[0].capAdjustments[0].adjustedAmount).toBe(50);

    // Fourth earn: should be blocked (cap exhausted)
    const r4 = await harness.processEvent({ type: 'action.completed', userId: 'user_cap_test' });
    expect(r4).toHaveLength(0); // No earn granted
  });

  it('should apply multiplier stacking correctly', async () => {
    const rule = await harness.createActiveRuleWithReward({
      triggerEvent: 'purchase.completed',
      reward: { type: 'points', baseAmount: 100, rewardIdentifier: 'loyalty', calculationMode: 'fixed' },
    });

    // 2x tier multiplier (multiplicative)
    await harness.addMultiplier(rule.id, {
      type: 'tier_based',
      value: 2.0,
      config: { type: 'tier_based', tierMultipliers: { gold: 2.0 } },
      stackingMode: 'multiplicative',
      stackingGroup: 'tier',
    });

    // 1.5x time multiplier (multiplicative, different group)
    await harness.addMultiplier(rule.id, {
      type: 'time_based',
      value: 1.5,
      config: { type: 'time_based', daysOfWeek: [0, 1, 2, 3, 4, 5, 6] }, // Always active
      stackingMode: 'multiplicative',
      stackingGroup: 'time',
    });

    // Mock user as gold tier
    harness.mockUserContext('user_multi_test', { tier: 'gold' });

    const results = await harness.processEvent({
      type: 'purchase.completed',
      userId: 'user_multi_test',
      properties: { amount: 50 },
    });

    // Base: 100, × 2.0 (tier) × 1.5 (time) = 300
    expect(results[0].finalAmount).toBe(300);
    expect(results[0].appliedMultipliers).toHaveLength(2);
  });
});
```

### Load Tests

```typescript
import { describe, it } from 'vitest';
import { EarnTestHarness } from '@mcv/engagement/earn/testing';

describe('EarnPipeline (load)', () => {
  it('should process 10,000 events within performance budget', async () => {
    const harness = await EarnTestHarness.create({ database: true });

    // Setup: 50 active rules with varying complexity
    await harness.seedRules(50);

    const events = harness.generateEvents(10_000, {
      types: ['purchase.completed', 'social.like', 'content.create', 'user.login'],
      userCount: 1000,
    });

    const start = Date.now();
    const results = await harness.processEventBatch(events, { concurrency: 50 });
    const elapsed = Date.now() - start;

    console.log(`Processed ${events.length} events in ${elapsed}ms`);
    console.log(`Throughput: ${Math.round(events.length / (elapsed / 1000))} events/sec`);
    console.log(`Total earns: ${results.totalEarns}`);
    console.log(`Avg latency: ${results.avgLatencyMs.toFixed(1)}ms`);
    console.log(`P99 latency: ${results.p99LatencyMs.toFixed(1)}ms`);

    // Performance assertions
    expect(elapsed).toBeLessThan(30_000); // 10K events in under 30s
    expect(results.p99LatencyMs).toBeLessThan(100); // P99 under 100ms
    expect(results.errors).toBe(0);

    await harness.teardown();
  });
});
```

### Test Utilities

The `@mcv/engagement/earn/testing` module provides factories and helpers:

```typescript
import {
  createTestEarnRule,
  createTestEarnEvent,
  createTestEarnCondition,
  MockEarnPipeline,
  EarnTestHarness,
} from '@mcv/engagement/earn/testing';

// Factory: create a test rule with sensible defaults
const rule = createTestEarnRule({
  name: 'Test Rule',
  triggerEvent: 'test.event',
  // All other fields have reasonable defaults
});

// Factory: create a test event
const event = createTestEarnEvent({
  type: 'purchase.completed',
  userId: 'user_test',
  properties: { amount: 100 },
});

// Factory: create a test condition
const condition = createTestEarnCondition({
  type: 'event_property',
  field: '$.amount',
  operator: 'gte',
  value: 50,
});

// Mock pipeline: for testing code that depends on the earn pipeline
const mockPipeline = new MockEarnPipeline();
mockPipeline.addMockResult('purchase.completed', {
  ruleId: 'mock_rule',
  ruleName: 'Mock Rule',
  rewardType: 'points',
  finalAmount: 100,
});

const results = await mockPipeline.process(event);
expect(results[0].finalAmount).toBe(100);

// Harness: full test environment with DB and optional Redpanda
const harness = await EarnTestHarness.create({
  database: true,
  redpanda: true,  // Use testcontainers for Redpanda
  seed: true,      // Pre-populate with sample rules
});

// Use harness...
await harness.teardown();
```

---

*This module is part of the MCV.ONE engagement domain. For related modules, see:*
- *[`@mcv/engagement/points`](../points/MODULE.md) — Point balance management and ledger*
- *[`@mcv/engagement/tiers`](../tiers/MODULE.md) — Tier progression and promotion*
- *[`@mcv/engagement/streaks`](../streaks/MODULE.md) — Streak tracking and maintenance*
- *[`@mcv/engagement/quests`](../quests/MODULE.md) — Quest and challenge definitions*
- *[`@mcv/engagement/leaderboards`](../leaderboards/MODULE.md) — Leaderboard rankings*
- *[`@mcv/engagement/redeem`](../redeem/MODULE.md) — Reward redemption and fulfillment*