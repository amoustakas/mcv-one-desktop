# @mcv/cdp/segments

> **Tier 5 — MCV-Only Domain Module**
> Dynamic audience segmentation engine for the Customer Data Platform.

---

## Purpose

The **segments** module is the audience-building engine of the MCV Customer Data Platform. It enables ventures to define rule-based audience segments — such as "high-value users who purchased in the last 30 days" or "at-risk churn accounts with declining engagement" — and automatically maintains membership as profile traits evolve in real time. Segments are the connective tissue between raw customer data and actionable marketing, product, and operational workflows: every campaign target list, every personalization rule, every cohort analysis ultimately traces back to a segment definition managed by this module.

At its core, the module implements a **Rules DSL** — a composable boolean logic system supporting AND/OR/NOT operators, nested rule groups, and a rich set of comparison operators (equality, range, containment, set membership, regex, temporal windows). Segment definitions are stored as structured JSON rule trees in PostgreSQL, evaluated against the unified profile and trait data provided by `@mcv/cdp/profiles` and `@mcv/cdp/traits`. The `SegmentService` orchestrates the full lifecycle: creating and updating definitions, estimating audience size before committing, computing and caching membership sets, scheduling periodic recomputation, and pushing finalized segments to downstream destinations (email platforms, ad networks, analytics tools) via the `@mcv/cdp/sync` pipeline.

The module supports both **dynamic segments** (membership auto-updates as traits change) and **static segments** (manually curated lists via CSV upload or individual add/remove operations). Cross-venture global segments allow platform-wide audience definitions that span all tenants, while venture-specific segments remain isolated behind multi-tenant RLS policies. Segment analytics — growth/shrink trends, overlap matrices, membership velocity — provide visibility into how audiences evolve over time, enabling data-driven refinement of segmentation strategies.

---

## Exports

```typescript
// @mcv/cdp/segments — public API surface

// ── Core Service ────────────────────────────────────────────────
export { SegmentService }              from './services/segment.service';
export { SegmentEvaluator }            from './services/segment-evaluator.service';
export { SegmentEstimator }            from './services/segment-estimator.service';
export { SegmentScheduler }            from './services/segment-scheduler.service';
export { SegmentSyncService }          from './services/segment-sync.service';
export { SegmentAnalyticsService }     from './services/segment-analytics.service';
export { StaticSegmentService }        from './services/static-segment.service';

// ── Rules DSL ───────────────────────────────────────────────────
export { RuleEngine }                  from './rules/rule-engine';
export { RuleParser }                  from './rules/rule-parser';
export { RuleValidator }               from './rules/rule-validator';
export { buildRuleGroup }              from './rules/rule-builder';
export { serializeRules }              from './rules/rule-serializer';
export { deserializeRules }            from './rules/rule-serializer';

// ── Types & Interfaces ─────────────────────────────────────────
export type { SegmentDefinition }      from './types/segment-definition';
export type { SegmentRule }            from './types/segment-rule';
export type { RuleGroup }              from './types/rule-group';
export type { RuleOperator }           from './types/rule-operator';
export type { MembershipResult }       from './types/membership-result';
export type { SegmentEstimate }        from './types/segment-estimate';
export type { SegmentSyncJob }         from './types/segment-sync-job';
export type { SegmentAnalytics }       from './types/segment-analytics';
export type { SegmentOverlap }         from './types/segment-overlap';
export type { SegmentSchedule }        from './types/segment-schedule';
export type { StaticSegmentEntry }     from './types/static-segment-entry';
export type { SegmentType }            from './types/segment-type';
export type { SegmentStatus }          from './types/segment-status';
export type { ComputationMode }        from './types/computation-mode';

// ── DB Schema ───────────────────────────────────────────────────
export { segments }                    from './db/schema/segments';
export { segmentRules }                from './db/schema/segment-rules';
export { segmentMemberships }          from './db/schema/segment-memberships';
export { segmentSyncJobs }             from './db/schema/segment-sync-jobs';
export { segmentAnalytics }            from './db/schema/segment-analytics';

// ── tRPC Router ─────────────────────────────────────────────────
export { segmentRouter }               from './trpc/segment.router';

// ── Constants & Enums ───────────────────────────────────────────
export { RULE_OPERATORS }              from './constants/rule-operators';
export { SEGMENT_LIMITS }              from './constants/segment-limits';
export { COMPUTATION_MODES }           from './constants/computation-modes';
export { SegmentErrorCode }            from './constants/error-codes';

// ── Utilities ───────────────────────────────────────────────────
export { validateSegmentSlug }         from './utils/validate-slug';
export { estimateQueryCost }           from './utils/query-cost';
export { segmentToSql }               from './utils/segment-to-sql';
export { diffMembership }             from './utils/diff-membership';
```

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         @mcv/cdp/segments                                   │
│                                                                             │
│  ┌──────────────┐   ┌──────────────────┐   ┌─────────────────────────────┐ │
│  │   tRPC API   │   │  SegmentService  │   │     SegmentScheduler        │ │
│  │  (segment    │──▶│  (CRUD, lifecycle │◀──│  (cron-driven recompute,    │ │
│  │   .router)   │   │   orchestration)  │   │   hourly / daily / custom)  │ │
│  └──────┬───────┘   └────────┬─────────┘   └──────────────┬──────────────┘ │
│         │                    │                             │                │
│         │           ┌────────▼─────────┐                   │                │
│         │           │  Rules DSL Layer  │                   │                │
│         │           │  ┌─────────────┐  │                   │                │
│         │           │  │ RuleEngine   │  │                   │                │
│         │           │  │ RuleParser   │  │                   │                │
│         │           │  │ RuleValidator│  │                   │                │
│         │           │  └─────────────┘  │                   │                │
│         │           └────────┬─────────┘                   │                │
│         │                    │                             │                │
│  ┌──────▼────────────────────▼─────────────────────────────▼──────────────┐ │
│  │                        Core Processing Layer                           │ │
│  │                                                                        │ │
│  │  ┌──────────────────┐  ┌──────────────────┐  ┌─────────────────────┐  │ │
│  │  │ SegmentEvaluator │  │ SegmentEstimator │  │ StaticSegmentService│  │ │
│  │  │ (compute member- │  │ (preview audience │  │ (CSV upload, manual │  │ │
│  │  │  ship from rules)│  │  size via EXPLAIN) │  │  add/remove members)│  │ │
│  │  └────────┬─────────┘  └────────┬─────────┘  └─────────┬───────────┘  │ │
│  │           │                     │                       │              │ │
│  └───────────┼─────────────────────┼───────────────────────┼──────────────┘ │
│              │                     │                       │                │
│  ┌───────────▼─────────────────────▼───────────────────────▼──────────────┐ │
│  │                        Data / Storage Layer                            │ │
│  │                                                                        │ │
│  │  ┌─────────────┐ ┌──────────────┐ ┌───────────────┐ ┌──────────────┐  │ │
│  │  │  segments    │ │segment_rules │ │ segment_      │ │ segment_     │  │ │
│  │  │  (defs)     │ │ (rule tree)  │ │ memberships   │ │ sync_jobs    │  │ │
│  │  └─────────────┘ └──────────────┘ └───────────────┘ └──────────────┘  │ │
│  │                                                                        │ │
│  │  ┌───────────────────┐                                                │ │
│  │  │ segment_analytics │                                                │ │
│  │  │ (trends, overlaps)│                                                │ │
│  │  └───────────────────┘                                                │ │
│  └────────────────────────────────────────────────────────────────────────┘ │
│                                                                             │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │                     Integration / Sync Layer                          │  │
│  │                                                                       │  │
│  │  ┌─────────────────────┐     ┌──────────────────────────────────────┐ │  │
│  │  │ SegmentSyncService  │────▶│  @mcv/cdp/sync (push to destinations)│ │  │
│  │  └─────────────────────┘     └──────────────────────────────────────┘ │  │
│  │                                                                       │  │
│  │  ┌──────────────────────────┐                                         │  │
│  │  │ SegmentAnalyticsService  │                                         │  │
│  │  │ (growth, shrink, overlap)│                                         │  │
│  │  └──────────────────────────┘                                         │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
└──────────────────────────────┬──────────────────────────────────────────────┘
                               │
              ┌────────────────┼────────────────┐
              ▼                ▼                ▼
   ┌──────────────┐  ┌──────────────┐  ┌──────────────┐
   │ @mcv/cdp/    │  │ @mcv/cdp/    │  │ @mcv/cdp/    │
   │   profiles   │  │   traits     │  │   sync       │
   │ (unified     │  │ (trait       │  │ (destination  │
   │  profile     │  │  values &    │  │  connectors   │
   │  data)       │  │  schemas)    │  │  & pipelines) │
   └──────────────┘  └──────────────┘  └──────────────┘
```

---

## Core Interfaces

### SegmentDefinition

The root object representing a segment, including its metadata, type classification, associated rules, and scheduling configuration.

```typescript
/**
 * Represents a complete segment definition with metadata, rules,
 * and scheduling configuration. Stored in the `segments` table.
 */
interface SegmentDefinition {
  /** Unique identifier (UUIDv7). */
  id: string;

  /** Owning venture ID. Null for cross-venture global segments. */
  ventureId: string | null;

  /** Human-readable name displayed in UI. */
  name: string;

  /** URL-safe slug for API references (e.g., "high_value_users"). */
  slug: string;

  /** Optional long-form description of what this segment captures. */
  description: string | null;

  /** Segment classification. */
  type: SegmentType;

  /** Current operational status. */
  status: SegmentStatus;

  /** The root rule group defining membership criteria (null for static segments). */
  rootRuleGroup: RuleGroup | null;

  /** How membership is computed. */
  computationMode: ComputationMode;

  /** Schedule for periodic recomputation. */
  schedule: SegmentSchedule | null;

  /** Cached count of current members. */
  memberCount: number;

  /** When membership was last fully recomputed. */
  lastComputedAt: Date | null;

  /** Estimated computation cost (query complexity score 0-100). */
  computationCost: number;

  /** Tags for organizational purposes. */
  tags: string[];

  /** Whether this segment is archived (soft-deleted). */
  archived: boolean;

  /** User ID who created this segment. */
  createdBy: string;

  /** Standard timestamps. */
  createdAt: Date;
  updatedAt: Date;
}

/** Segment type classification. */
type SegmentType =
  | 'dynamic'        // Rules-based, auto-updating membership
  | 'static'         // Manually curated member list
  | 'computed'        // Derived from other segments (union, intersection, exclusion)
  | 'predictive';     // ML-powered predicted membership (future)

/** Segment operational status. */
type SegmentStatus =
  | 'draft'          // Defined but not yet computing
  | 'active'         // Actively computing and syncing
  | 'paused'         // Temporarily halted (user-initiated)
  | 'computing'      // Currently recomputing membership
  | 'error'          // Last computation failed
  | 'archived';      // Soft-deleted, membership frozen

/** How often membership is recomputed. */
type ComputationMode =
  | 'realtime'       // Evaluate on every trait change (expensive, low-latency)
  | 'streaming'      // Near-real-time via change-data-capture debounce
  | 'scheduled'      // Periodic batch recomputation
  | 'manual';        // Only recompute on explicit request
```

### SegmentRule

An individual rule within a rule group — a single comparison against a profile trait or computed property.

```typescript
/**
 * A single rule comparing a trait/property to a value using an operator.
 * Rules are always nested inside a RuleGroup.
 */
interface SegmentRule {
  /** Unique rule ID (UUIDv7). */
  id: string;

  /** The trait key or computed property being evaluated. */
  field: string;

  /**
   * The source of the field value.
   * - 'trait': A trait from cdp/traits (e.g., "ltv", "plan_tier")
   * - 'profile': A core profile property (e.g., "created_at", "email")
   * - 'event': An aggregated event metric (e.g., "event_count:purchase")
   * - 'segment': Membership in another segment (e.g., "segment:high_value")
   * - 'computed': A runtime-computed expression
   */
  fieldSource: 'trait' | 'profile' | 'event' | 'segment' | 'computed';

  /** The comparison operator. */
  operator: RuleOperator;

  /**
   * The value(s) to compare against.
   * Type depends on operator:
   * - Single value for eq, neq, gt, gte, lt, lte, contains, regex
   * - Array for in, not_in, between
   * - Null for exists, not_exists
   * - Relative date string for within_last, not_within_last
   */
  value: RuleValue;

  /**
   * Optional type coercion hint. When set, the field value is cast
   * before comparison (e.g., "number" ensures numeric comparison).
   */
  valueType: 'string' | 'number' | 'boolean' | 'date' | 'array' | null;

  /** Whether this rule is negated (NOT wrapper). */
  negated: boolean;
}

/** All supported comparison operators. */
type RuleOperator =
  // Equality
  | 'eq'              // Equal to
  | 'neq'             // Not equal to
  // Numeric / date comparison
  | 'gt'              // Greater than
  | 'gte'             // Greater than or equal to
  | 'lt'              // Less than
  | 'lte'             // Less than or equal to
  // Range
  | 'between'         // Between two values (inclusive)
  | 'not_between'     // Not between two values
  // String
  | 'contains'        // String contains substring
  | 'not_contains'    // String does not contain substring
  | 'starts_with'     // String starts with prefix
  | 'ends_with'       // String ends with suffix
  | 'regex'           // Matches regular expression
  // Set membership
  | 'in'              // Value is in array
  | 'not_in'          // Value is not in array
  // Existence
  | 'exists'          // Field is not null/undefined
  | 'not_exists'      // Field is null/undefined
  // Temporal
  | 'within_last'     // Date is within last N days/hours
  | 'not_within_last' // Date is NOT within last N days/hours
  | 'before'          // Date is before value
  | 'after'           // Date is after value
  // Array operations
  | 'array_contains'      // Array field contains value
  | 'array_contains_any'  // Array field contains any of values
  | 'array_contains_all'; // Array field contains all of values

/** Value type union for rule comparisons. */
type RuleValue =
  | string
  | number
  | boolean
  | null
  | string[]
  | number[]
  | [number, number]       // between range
  | [string, string]       // date range
  | RelativeTimeValue;

/** Relative time specification for temporal operators. */
interface RelativeTimeValue {
  amount: number;
  unit: 'minutes' | 'hours' | 'days' | 'weeks' | 'months' | 'years';
}
```

### RuleGroup

A boolean container that groups rules and/or nested rule groups under a logical operator.

```typescript
/**
 * A boolean group combining rules and nested groups with AND/OR logic.
 * Rule groups can be nested to arbitrary depth (capped at 5 levels
 * for performance).
 */
interface RuleGroup {
  /** Unique group ID (UUIDv7). */
  id: string;

  /** Boolean operator for combining children. */
  operator: 'AND' | 'OR';

  /** Whether the entire group result is negated (NOT). */
  negated: boolean;

  /**
   * Ordered list of children — either individual rules or nested groups.
   * Evaluated left to right with short-circuit semantics.
   */
  children: Array<SegmentRule | RuleGroup>;
}

/**
 * Type guard to distinguish rules from groups at runtime.
 */
function isRuleGroup(node: SegmentRule | RuleGroup): node is RuleGroup {
  return 'operator' in node && 'children' in node;
}
```

### MembershipResult

The output of a segment evaluation — the set of profile IDs that match, along with metadata about the computation.

```typescript
/**
 * Result of computing segment membership. Contains the matching
 * profile IDs and metadata about the computation run.
 */
interface MembershipResult {
  /** The segment that was evaluated. */
  segmentId: string;

  /** Total profiles that matched the rules. */
  totalMatched: number;

  /** Profile IDs added since last computation. */
  added: string[];

  /** Profile IDs removed since last computation. */
  removed: string[];

  /** Profile IDs that remained members. */
  retained: number;

  /** Net change (added.length - removed.length). */
  netChange: number;

  /** Duration of the computation in milliseconds. */
  computationTimeMs: number;

  /** The SQL query that was executed (for debugging). */
  executedQuery: string | null;

  /** Whether the result was truncated due to limits. */
  truncated: boolean;

  /** Timestamp of this computation. */
  computedAt: Date;

  /** If an error occurred during computation. */
  error: string | null;

  /**
   * Pagination cursor for large segments.
   * When truncated is true, pass this to get the next batch.
   */
  cursor: string | null;
}
```

### SegmentEstimate

A preview of how many profiles would match a segment's rules without actually persisting the membership.

```typescript
/**
 * Estimated segment size returned before committing a segment definition.
 * Uses PostgreSQL EXPLAIN for fast approximate counts.
 */
interface SegmentEstimate {
  /** The estimated number of matching profiles. */
  estimatedCount: number;

  /** Confidence level of the estimate. */
  confidence: 'exact' | 'high' | 'medium' | 'low';

  /** Lower bound of the 95% confidence interval. */
  lowerBound: number;

  /** Upper bound of the 95% confidence interval. */
  upperBound: number;

  /** Total profiles in the venture (denominator for percentage). */
  totalProfiles: number;

  /** Estimated percentage of total audience. */
  percentageOfTotal: number;

  /** Estimated query cost (complexity score 0-100). */
  queryCost: number;

  /** Estimated computation time in milliseconds. */
  estimatedComputeTimeMs: number;

  /** Whether the estimate used table sampling (for very large tables). */
  usedSampling: boolean;

  /** Sample size if sampling was used. */
  sampleSize: number | null;

  /** Any warnings about the estimate quality. */
  warnings: string[];
}
```

### SegmentService

The primary orchestration service for all segment operations.

```typescript
/**
 * Core service for segment CRUD, evaluation, and lifecycle management.
 * All methods respect multi-tenant RLS — ventureId is extracted from
 * the authenticated context.
 */
interface SegmentService {
  // ── CRUD ────────────────────────────────────────────────────

  /** Create a new segment definition. */
  create(input: CreateSegmentInput): Promise<SegmentDefinition>;

  /** Get a segment by ID. */
  getById(segmentId: string): Promise<SegmentDefinition | null>;

  /** Get a segment by slug within the current venture. */
  getBySlug(slug: string): Promise<SegmentDefinition | null>;

  /** List segments with filtering, sorting, and pagination. */
  list(params: ListSegmentsParams): Promise<PaginatedResult<SegmentDefinition>>;

  /** Update a segment's metadata or rules. */
  update(segmentId: string, input: UpdateSegmentInput): Promise<SegmentDefinition>;

  /** Archive (soft-delete) a segment. */
  archive(segmentId: string): Promise<void>;

  /** Restore an archived segment. */
  restore(segmentId: string): Promise<void>;

  /** Permanently delete a segment and all related data. */
  delete(segmentId: string): Promise<void>;

  /** Duplicate a segment with a new name/slug. */
  duplicate(segmentId: string, newSlug: string): Promise<SegmentDefinition>;

  // ── Evaluation ──────────────────────────────────────────────

  /** Compute full membership for a segment. */
  computeMembership(segmentId: string): Promise<MembershipResult>;

  /** Check if a specific profile is a member of a segment. */
  evaluateProfile(segmentId: string, profileId: string): Promise<boolean>;

  /** Evaluate which segments a profile belongs to. */
  getProfileSegments(profileId: string): Promise<SegmentDefinition[]>;

  /** Batch evaluate profiles against a segment (returns matching IDs). */
  batchEvaluate(segmentId: string, profileIds: string[]): Promise<string[]>;

  // ── Estimation ──────────────────────────────────────────────

  /** Estimate segment size without persisting membership. */
  estimate(rules: RuleGroup): Promise<SegmentEstimate>;

  /** Estimate with sampling for very large datasets. */
  estimateWithSampling(rules: RuleGroup, sampleRate: number): Promise<SegmentEstimate>;

  // ── Scheduling ──────────────────────────────────────────────

  /** Set or update the recomputation schedule for a segment. */
  setSchedule(segmentId: string, schedule: SegmentSchedule): Promise<void>;

  /** Remove the recomputation schedule (switch to manual mode). */
  removeSchedule(segmentId: string): Promise<void>;

  /** Get all segments due for recomputation. */
  getDueSegments(): Promise<SegmentDefinition[]>;

  // ── Syncing ─────────────────────────────────────────────────

  /** Trigger a sync of segment membership to a destination. */
  syncToDestination(segmentId: string, destinationId: string): Promise<SegmentSyncJob>;

  /** Get the sync status for a segment. */
  getSyncJobs(segmentId: string): Promise<SegmentSyncJob[]>;

  // ── Analytics ───────────────────────────────────────────────

  /** Get segment size over time. */
  getGrowthTrend(segmentId: string, period: DateRange): Promise<SegmentAnalytics>;

  /** Compute overlap between two segments. */
  getOverlap(segmentIdA: string, segmentIdB: string): Promise<SegmentOverlap>;

  /** Compute overlap matrix for multiple segments. */
  getOverlapMatrix(segmentIds: string[]): Promise<SegmentOverlap[]>;

  // ── Static Segments ─────────────────────────────────────────

  /** Add profiles to a static segment. */
  addMembers(segmentId: string, profileIds: string[]): Promise<number>;

  /** Remove profiles from a static segment. */
  removeMembers(segmentId: string, profileIds: string[]): Promise<number>;

  /** Import members from CSV. */
  importMembers(segmentId: string, csv: ReadableStream): Promise<ImportResult>;
}

/** Input for creating a new segment. */
interface CreateSegmentInput {
  name: string;
  slug: string;
  description?: string;
  type: SegmentType;
  rootRuleGroup?: RuleGroup;
  computationMode?: ComputationMode;
  schedule?: SegmentSchedule;
  tags?: string[];
}

/** Input for updating a segment. */
interface UpdateSegmentInput {
  name?: string;
  slug?: string;
  description?: string;
  rootRuleGroup?: RuleGroup;
  computationMode?: ComputationMode;
  schedule?: SegmentSchedule;
  tags?: string[];
  status?: 'active' | 'paused';
}

/** Parameters for listing segments. */
interface ListSegmentsParams {
  type?: SegmentType;
  status?: SegmentStatus;
  tags?: string[];
  search?: string;
  sortBy?: 'name' | 'memberCount' | 'createdAt' | 'updatedAt' | 'lastComputedAt';
  sortOrder?: 'asc' | 'desc';
  cursor?: string;
  limit?: number;
  includeArchived?: boolean;
  includeGlobal?: boolean;
}

/** Scheduling configuration. */
interface SegmentSchedule {
  /** Cron expression (standard 5-field). */
  cron: string;
  /** Human-readable label. */
  label: string;
  /** Timezone for the cron expression. */
  timezone: string;
  /** Maximum computation time before timeout (ms). */
  timeoutMs: number;
  /** Whether to skip if previous computation is still running. */
  skipIfRunning: boolean;
}

/** Result of a CSV import operation. */
interface ImportResult {
  totalRows: number;
  added: number;
  skipped: number;
  errors: Array<{ row: number; error: string }>;
}

/** Segment overlap analysis result. */
interface SegmentOverlap {
  segmentIdA: string;
  segmentIdB: string;
  segmentAName: string;
  segmentBName: string;
  segmentACount: number;
  segmentBCount: number;
  overlapCount: number;
  overlapPercentageOfA: number;
  overlapPercentageOfB: number;
  jaccardIndex: number;
  computedAt: Date;
}

/** Growth/shrink analytics for a segment. */
interface SegmentAnalytics {
  segmentId: string;
  period: DateRange;
  dataPoints: Array<{
    date: Date;
    memberCount: number;
    added: number;
    removed: number;
    netChange: number;
  }>;
  summary: {
    startCount: number;
    endCount: number;
    totalAdded: number;
    totalRemoved: number;
    netChange: number;
    growthRate: number;
    averageDailyChange: number;
    peakCount: number;
    troughCount: number;
  };
}

/** Date range for analytics queries. */
interface DateRange {
  from: Date;
  to: Date;
}

/** Paginated result wrapper. */
interface PaginatedResult<T> {
  data: T[];
  total: number;
  cursor: string | null;
  hasMore: boolean;
}
```

---

## Database Schemas

All schemas use Drizzle ORM with Supabase PostgreSQL. Multi-tenant isolation is enforced via Row-Level Security (RLS) policies on `venture_id`.

### segments

The primary table storing segment definitions and metadata.

```typescript
import { pgTable, uuid, text, timestamp, integer, boolean, jsonb, pgEnum } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// ── Enums ─────────────────────────────────────────────────────

export const segmentTypeEnum = pgEnum('segment_type', [
  'dynamic',
  'static',
  'computed',
  'predictive',
]);

export const segmentStatusEnum = pgEnum('segment_status', [
  'draft',
  'active',
  'paused',
  'computing',
  'error',
  'archived',
]);

export const computationModeEnum = pgEnum('computation_mode', [
  'realtime',
  'streaming',
  'scheduled',
  'manual',
]);

// ── Segments Table ────────────────────────────────────────────

export const segments = pgTable('cdp_segments', {
  id: uuid('id').primaryKey().defaultRandom(),

  /** Owning venture. NULL = global (cross-venture). */
  ventureId: uuid('venture_id').references(() => ventures.id, {
    onDelete: 'cascade',
  }),

  /** Display name. */
  name: text('name').notNull(),

  /** URL-safe unique slug within the venture. */
  slug: text('slug').notNull(),

  /** Optional description. */
  description: text('description'),

  /** Segment classification. */
  type: segmentTypeEnum('type').notNull().default('dynamic'),

  /** Operational status. */
  status: segmentStatusEnum('status').notNull().default('draft'),

  /**
   * Root rule group stored as JSONB.
   * NULL for static segments (membership managed directly).
   */
  rootRuleGroup: jsonb('root_rule_group').$type<RuleGroup | null>(),

  /** How membership is computed. */
  computationMode: computationModeEnum('computation_mode')
    .notNull()
    .default('scheduled'),

  /** Scheduling configuration as JSONB. */
  schedule: jsonb('schedule').$type<SegmentSchedule | null>(),

  /** Cached member count (updated after each computation). */
  memberCount: integer('member_count').notNull().default(0),

  /** When membership was last fully recomputed. */
  lastComputedAt: timestamp('last_computed_at', { withTimezone: true }),

  /** Query complexity score (0-100). */
  computationCost: integer('computation_cost').notNull().default(0),

  /** Organizational tags. */
  tags: jsonb('tags').$type<string[]>().notNull().default([]),

  /** Soft-delete flag. */
  archived: boolean('archived').notNull().default(false),

  /** User who created the segment. */
  createdBy: uuid('created_by').notNull(),

  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  // Unique slug per venture (NULL venture = global namespace)
  uniqueSlugPerVenture: unique().on(table.ventureId, table.slug),
  // Index for listing active segments
  statusIdx: index('idx_cdp_segments_status').on(table.status),
  // Index for venture-scoped queries
  ventureIdx: index('idx_cdp_segments_venture').on(table.ventureId),
  // GIN index on tags for array containment queries
  tagsIdx: index('idx_cdp_segments_tags').using('gin', table.tags),
}));

export const segmentsRelations = relations(segments, ({ many }) => ({
  rules: many(segmentRules),
  memberships: many(segmentMemberships),
  syncJobs: many(segmentSyncJobs),
  analyticsSnapshots: many(segmentAnalytics),
}));
```

### segment_rules

Stores individual rules in a normalized form for indexing and analysis, though the canonical rule tree lives as JSONB in the `segments` table.

```typescript
export const segmentRules = pgTable('cdp_segment_rules', {
  id: uuid('id').primaryKey().defaultRandom(),

  /** Parent segment. */
  segmentId: uuid('segment_id')
    .notNull()
    .references(() => segments.id, { onDelete: 'cascade' }),

  /** Parent group ID (from JSONB rule tree). */
  groupId: uuid('group_id').notNull(),

  /** The trait/property field being compared. */
  field: text('field').notNull(),

  /** Source of the field value. */
  fieldSource: text('field_source').notNull(), // 'trait' | 'profile' | 'event' | 'segment' | 'computed'

  /** Comparison operator. */
  operator: text('operator').notNull(),

  /** Comparison value stored as JSONB. */
  value: jsonb('value').$type<RuleValue>(),

  /** Optional type coercion hint. */
  valueType: text('value_type'),

  /** Whether this rule is negated. */
  negated: boolean('negated').notNull().default(false),

  /** Ordering within the parent group. */
  position: integer('position').notNull().default(0),

  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  segmentIdx: index('idx_cdp_segment_rules_segment').on(table.segmentId),
  fieldIdx: index('idx_cdp_segment_rules_field').on(table.field),
  fieldSourceIdx: index('idx_cdp_segment_rules_source').on(table.fieldSource),
}));

export const segmentRulesRelations = relations(segmentRules, ({ one }) => ({
  segment: one(segments, {
    fields: [segmentRules.segmentId],
    references: [segments.id],
  }),
}));
```

### segment_memberships

The materialized membership table mapping profiles to segments. Designed for fast lookups in both directions (profile→segments and segment→profiles).

```typescript
export const segmentMemberships = pgTable('cdp_segment_memberships', {
  id: uuid('id').primaryKey().defaultRandom(),

  /** The segment. */
  segmentId: uuid('segment_id')
    .notNull()
    .references(() => segments.id, { onDelete: 'cascade' }),

  /** The profile that is a member. */
  profileId: uuid('profile_id')
    .notNull()
    .references(() => profiles.id, { onDelete: 'cascade' }),

  /** Venture ID for RLS enforcement. */
  ventureId: uuid('venture_id')
    .notNull()
    .references(() => ventures.id, { onDelete: 'cascade' }),

  /**
   * How this membership was established.
   * - 'computed': Added by rule evaluation
   * - 'manual': Added manually (static segment)
   * - 'imported': Added via CSV import
   */
  source: text('source').notNull().default('computed'),

  /** When this profile first entered the segment. */
  enteredAt: timestamp('entered_at', { withTimezone: true }).notNull().defaultNow(),

  /** When membership was last confirmed by recomputation. */
  lastConfirmedAt: timestamp('last_confirmed_at', { withTimezone: true }).notNull().defaultNow(),

  /** When this profile exited the segment (null = still a member). */
  exitedAt: timestamp('exited_at', { withTimezone: true }),
}, (table) => ({
  // Fast lookup: which profiles are in this segment?
  segmentProfileIdx: index('idx_cdp_memberships_segment_profile')
    .on(table.segmentId, table.profileId),
  // Fast lookup: which segments does this profile belong to?
  profileSegmentIdx: index('idx_cdp_memberships_profile_segment')
    .on(table.profileId, table.segmentId),
  // Unique constraint: a profile can only be in a segment once
  uniqueMembership: unique().on(table.segmentId, table.profileId)
    .where(sql`exited_at IS NULL`),
  // Venture scoping for RLS
  ventureIdx: index('idx_cdp_memberships_venture')
    .on(table.ventureId),
  // For computing churn: find recently exited members
  exitedIdx: index('idx_cdp_memberships_exited')
    .on(table.segmentId, table.exitedAt)
    .where(sql`exited_at IS NOT NULL`),
}));

export const segmentMembershipsRelations = relations(segmentMemberships, ({ one }) => ({
  segment: one(segments, {
    fields: [segmentMemberships.segmentId],
    references: [segments.id],
  }),
}));
```

### segment_sync_jobs

Tracks the state of segment membership syncs to external destinations.

```typescript
export const segmentSyncJobStatusEnum = pgEnum('segment_sync_job_status', [
  'pending',
  'running',
  'completed',
  'failed',
  'cancelled',
]);

export const segmentSyncJobs = pgTable('cdp_segment_sync_jobs', {
  id: uuid('id').primaryKey().defaultRandom(),

  /** The segment being synced. */
  segmentId: uuid('segment_id')
    .notNull()
    .references(() => segments.id, { onDelete: 'cascade' }),

  /** Venture ID for RLS. */
  ventureId: uuid('venture_id')
    .notNull()
    .references(() => ventures.id, { onDelete: 'cascade' }),

  /** The destination connector ID (from cdp/sync). */
  destinationId: uuid('destination_id').notNull(),

  /** Current job status. */
  status: segmentSyncJobStatusEnum('status').notNull().default('pending'),

  /** How the sync was triggered. */
  trigger: text('trigger').notNull().default('manual'), // 'manual' | 'scheduled' | 'membership_change'

  /** Number of profiles synced (added to destination). */
  profilesSynced: integer('profiles_synced').notNull().default(0),

  /** Number of profiles removed from destination. */
  profilesRemoved: integer('profiles_removed').notNull().default(0),

  /** Number of profiles that failed to sync. */
  profilesFailed: integer('profiles_failed').notNull().default(0),

  /** Total profiles in the segment at sync time. */
  totalMembers: integer('total_members').notNull().default(0),

  /** Error message if the job failed. */
  errorMessage: text('error_message'),

  /** Detailed error log (structured). */
  errorDetails: jsonb('error_details').$type<Record<string, unknown> | null>(),

  /** When the job started processing. */
  startedAt: timestamp('started_at', { withTimezone: true }),

  /** When the job completed (success or failure). */
  completedAt: timestamp('completed_at', { withTimezone: true }),

  /** Duration in milliseconds. */
  durationMs: integer('duration_ms'),

  /** Metadata passed to the destination connector. */
  metadata: jsonb('metadata').$type<Record<string, unknown>>().notNull().default({}),

  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  segmentIdx: index('idx_cdp_sync_jobs_segment').on(table.segmentId),
  statusIdx: index('idx_cdp_sync_jobs_status').on(table.status),
  ventureIdx: index('idx_cdp_sync_jobs_venture').on(table.ventureId),
  createdAtIdx: index('idx_cdp_sync_jobs_created').on(table.createdAt),
}));

export const segmentSyncJobsRelations = relations(segmentSyncJobs, ({ one }) => ({
  segment: one(segments, {
    fields: [segmentSyncJobs.segmentId],
    references: [segments.id],
  }),
}));
```

### segment_analytics

Time-series snapshots of segment sizes and membership changes, used for trend analysis and growth/shrink charts.

```typescript
export const segmentAnalytics = pgTable('cdp_segment_analytics', {
  id: uuid('id').primaryKey().defaultRandom(),

  /** The segment being tracked. */
  segmentId: uuid('segment_id')
    .notNull()
    .references(() => segments.id, { onDelete: 'cascade' }),

  /** Venture ID for RLS. */
  ventureId: uuid('venture_id')
    .notNull()
    .references(() => ventures.id, { onDelete: 'cascade' }),

  /** Snapshot date (one row per segment per day). */
  snapshotDate: timestamp('snapshot_date', { withTimezone: true, mode: 'date' }).notNull(),

  /** Total members at snapshot time. */
  memberCount: integer('member_count').notNull(),

  /** Members added since previous snapshot. */
  membersAdded: integer('members_added').notNull().default(0),

  /** Members removed since previous snapshot. */
  membersRemoved: integer('members_removed').notNull().default(0),

  /** Net change since previous snapshot. */
  netChange: integer('net_change').notNull().default(0),

  /** Computation time for this run (ms). */
  computationTimeMs: integer('computation_time_ms'),

  /** Query complexity score at snapshot time. */
  computationCost: integer('computation_cost'),

  /** Whether the computation succeeded. */
  success: boolean('success').notNull().default(true),

  /** Optional error message if computation failed. */
  errorMessage: text('error_message'),

  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  // One snapshot per segment per day
  uniqueSnapshot: unique().on(table.segmentId, table.snapshotDate),
  // Time-series queries
  segmentDateIdx: index('idx_cdp_analytics_segment_date')
    .on(table.segmentId, table.snapshotDate),
  // Venture scoping
  ventureIdx: index('idx_cdp_analytics_venture').on(table.ventureId),
}));

export const segmentAnalyticsRelations = relations(segmentAnalytics, ({ one }) => ({
  segment: one(segments, {
    fields: [segmentAnalytics.segmentId],
    references: [segments.id],
  }),
}));
```

---

## Code Examples

### 1. Create a Dynamic Segment with Rules

Define a segment for "high-value users" — profiles with LTV over $500 who signed up more than 30 days ago and are on a paid plan.

```typescript
import { SegmentService, buildRuleGroup } from '@mcv/cdp/segments';

const segmentService = container.resolve(SegmentService);

// Build the rule tree using the fluent builder
const rules = buildRuleGroup('AND', [
  {
    field: 'ltv',
    fieldSource: 'trait',
    operator: 'gte',
    value: 500,
    valueType: 'number',
    negated: false,
  },
  {
    field: 'created_at',
    fieldSource: 'profile',
    operator: 'not_within_last',
    value: { amount: 30, unit: 'days' },
    valueType: 'date',
    negated: false,
  },
  {
    field: 'plan_tier',
    fieldSource: 'trait',
    operator: 'in',
    value: ['pro', 'enterprise', 'business'],
    valueType: 'string',
    negated: false,
  },
]);

const segment = await segmentService.create({
  name: 'High Value Users',
  slug: 'high_value_users',
  description: 'Profiles with LTV ≥ $500, signed up 30+ days ago, on a paid plan',
  type: 'dynamic',
  rootRuleGroup: rules,
  computationMode: 'scheduled',
  schedule: {
    cron: '0 */6 * * *',           // Every 6 hours
    label: 'Every 6 hours',
    timezone: 'America/New_York',
    timeoutMs: 120_000,             // 2 minute timeout
    skipIfRunning: true,
  },
  tags: ['monetization', 'high-value'],
});

console.log(`Created segment: ${segment.id} (${segment.slug})`);
// → Created segment: 01924f8a-... (high_value_users)

// Trigger initial membership computation
const result = await segmentService.computeMembership(segment.id);

console.log(`Matched ${result.totalMatched} profiles`);
console.log(`Computation took ${result.computationTimeMs}ms`);
// → Matched 2,847 profiles
// → Computation took 1,245ms
```

### 2. Complex Nested Boolean Logic

Build a segment for "at-risk churn" using deeply nested boolean rules: users who haven't logged in for 14 days AND (have an open support ticket OR gave a low NPS score) AND are NOT in the "enterprise" plan.

```typescript
import { buildRuleGroup, type RuleGroup } from '@mcv/cdp/segments';

// Inner OR group: support ticket or low NPS
const engagementSignals: RuleGroup = buildRuleGroup('OR', [
  {
    field: 'open_support_tickets',
    fieldSource: 'trait',
    operator: 'gte',
    value: 1,
    valueType: 'number',
    negated: false,
  },
  {
    field: 'nps_score',
    fieldSource: 'trait',
    operator: 'lte',
    value: 6,
    valueType: 'number',
    negated: false,
  },
  // Nested group: OR also includes declining usage
  buildRuleGroup('AND', [
    {
      field: 'weekly_active_days',
      fieldSource: 'trait',
      operator: 'lte',
      value: 1,
      valueType: 'number',
      negated: false,
    },
    {
      field: 'feature_adoption_score',
      fieldSource: 'computed',
      operator: 'lt',
      value: 0.3,
      valueType: 'number',
      negated: false,
    },
  ]),
]);

// Root AND group combining all conditions
const atRiskRules = buildRuleGroup('AND', [
  // No login in 14 days
  {
    field: 'last_login_at',
    fieldSource: 'profile',
    operator: 'not_within_last',
    value: { amount: 14, unit: 'days' },
    valueType: 'date',
    negated: false,
  },
  // Engagement signals (the OR group above)
  engagementSignals,
  // NOT enterprise plan (negated rule)
  {
    field: 'plan_tier',
    fieldSource: 'trait',
    operator: 'eq',
    value: 'enterprise',
    valueType: 'string',
    negated: true,  // NOT enterprise
  },
]);

const segment = await segmentService.create({
  name: 'At-Risk Churn',
  slug: 'at_risk_churn',
  description: 'Users showing churn signals: inactive, disengaged, non-enterprise',
  type: 'dynamic',
  rootRuleGroup: atRiskRules,
  computationMode: 'scheduled',
  schedule: {
    cron: '0 8 * * *',             // Daily at 8 AM
    label: 'Daily at 8:00 AM',
    timezone: 'America/New_York',
    timeoutMs: 180_000,
    skipIfRunning: true,
  },
  tags: ['churn', 'retention', 'critical'],
});

// The generated SQL for the rule tree:
// SELECT DISTINCT p.id FROM cdp_profiles p
// LEFT JOIN cdp_trait_values tv ON tv.profile_id = p.id
// WHERE p.venture_id = $1
//   AND tv.last_login_at < NOW() - INTERVAL '14 days'
//   AND (
//     tv.open_support_tickets >= 1
//     OR tv.nps_score <= 6
//     OR (tv.weekly_active_days <= 1 AND tv.feature_adoption_score < 0.3)
//   )
//   AND NOT (tv.plan_tier = 'enterprise')
```

### 3. Estimate Segment Size Before Saving

Preview how many profiles would match a rule set without persisting anything — useful for the segment builder UI.

```typescript
import { SegmentService, buildRuleGroup } from '@mcv/cdp/segments';

const segmentService = container.resolve(SegmentService);

// Build hypothetical rules
const rules = buildRuleGroup('AND', [
  {
    field: 'country',
    fieldSource: 'trait',
    operator: 'in',
    value: ['US', 'CA', 'GB'],
    valueType: 'string',
    negated: false,
  },
  {
    field: 'total_purchases',
    fieldSource: 'trait',
    operator: 'gte',
    value: 3,
    valueType: 'number',
    negated: false,
  },
  {
    field: 'email_opt_in',
    fieldSource: 'trait',
    operator: 'eq',
    value: true,
    valueType: 'boolean',
    negated: false,
  },
]);

// Get estimate (uses EXPLAIN ANALYZE for fast approximation)
const estimate = await segmentService.estimate(rules);

console.log(`Estimated size: ${estimate.estimatedCount.toLocaleString()} profiles`);
console.log(`Confidence: ${estimate.confidence}`);
console.log(`Range: ${estimate.lowerBound.toLocaleString()} - ${estimate.upperBound.toLocaleString()}`);
console.log(`${estimate.percentageOfTotal.toFixed(1)}% of total audience`);
console.log(`Query cost: ${estimate.queryCost}/100`);
console.log(`Est. compute time: ${estimate.estimatedComputeTimeMs}ms`);

if (estimate.warnings.length > 0) {
  console.warn('Warnings:', estimate.warnings);
}

// Output:
// Estimated size: 12,450 profiles
// Confidence: high
// Range: 11,800 - 13,100
// 8.3% of total audience
// Query cost: 35/100
// Est. compute time: 890ms

// For very large datasets, use sampling
const sampledEstimate = await segmentService.estimateWithSampling(rules, 0.1); // 10% sample
console.log(`Sampled estimate: ~${sampledEstimate.estimatedCount.toLocaleString()}`);
console.log(`Sample size: ${sampledEstimate.sampleSize?.toLocaleString()}`);
console.log(`Used sampling: ${sampledEstimate.usedSampling}`);
// Output:
// Sampled estimate: ~12,200
// Sample size: 15,000
// Used sampling: true
```

### 4. Sync Segment to External Destination

Push segment membership to a Mailchimp audience list and track the sync job status.

```typescript
import { SegmentService, SegmentSyncService, type SegmentSyncJob } from '@mcv/cdp/segments';

const segmentService = container.resolve(SegmentService);
const syncService = container.resolve(SegmentSyncService);

// Trigger a sync to Mailchimp
const syncJob: SegmentSyncJob = await segmentService.syncToDestination(
  'seg_01924f8a-1234-5678-9abc-def012345678',  // segment ID
  'dest_mailchimp_audience_main',                // destination connector ID
);

console.log(`Sync job created: ${syncJob.id}`);
console.log(`Status: ${syncJob.status}`);
// → Sync job created: sync_01924f8b-...
// → Status: pending

// Poll for completion (in practice, use webhooks or SSE)
const pollJob = async (jobId: string): Promise<SegmentSyncJob> => {
  let job = await syncService.getJobStatus(jobId);

  while (job.status === 'pending' || job.status === 'running') {
    await new Promise(resolve => setTimeout(resolve, 2000));
    job = await syncService.getJobStatus(jobId);
    console.log(`  Status: ${job.status} — ${job.profilesSynced} synced`);
  }

  return job;
};

const completedJob = await pollJob(syncJob.id);

console.log('\n=== Sync Complete ===');
console.log(`Status: ${completedJob.status}`);
console.log(`Profiles synced: ${completedJob.profilesSynced}`);
console.log(`Profiles removed: ${completedJob.profilesRemoved}`);
console.log(`Profiles failed: ${completedJob.profilesFailed}`);
console.log(`Duration: ${completedJob.durationMs}ms`);

// Output:
// Status: running — 500 synced
// Status: running — 1,200 synced
// Status: running — 2,400 synced
// Status: completed — 2,847 synced
//
// === Sync Complete ===
// Status: completed
// Profiles synced: 2,847
// Profiles removed: 143
// Profiles failed: 3
// Duration: 18,420ms

// List all sync jobs for a segment
const allJobs = await segmentService.getSyncJobs(
  'seg_01924f8a-1234-5678-9abc-def012345678'
);

for (const job of allJobs) {
  console.log(`${job.id} | ${job.status} | ${job.profilesSynced} synced | ${job.createdAt}`);
}
```

### 5. Segment Overlap Analysis

Analyze audience overlap between segments to identify redundancies and optimize targeting.

```typescript
import { SegmentService, type SegmentOverlap } from '@mcv/cdp/segments';

const segmentService = container.resolve(SegmentService);

// Compare two segments
const overlap: SegmentOverlap = await segmentService.getOverlap(
  'seg_high_value_users',
  'seg_at_risk_churn',
);

console.log('=== Segment Overlap ===');
console.log(`${overlap.segmentAName}: ${overlap.segmentACount.toLocaleString()} members`);
console.log(`${overlap.segmentBName}: ${overlap.segmentBCount.toLocaleString()} members`);
console.log(`Overlap: ${overlap.overlapCount.toLocaleString()} profiles`);
console.log(`${overlap.overlapPercentageOfA.toFixed(1)}% of ${overlap.segmentAName}`);
console.log(`${overlap.overlapPercentageOfB.toFixed(1)}% of ${overlap.segmentBName}`);
console.log(`Jaccard Index: ${overlap.jaccardIndex.toFixed(3)}`);

// Output:
// === Segment Overlap ===
// High Value Users: 2,847 members
// At-Risk Churn: 1,203 members
// Overlap: 87 profiles
// 3.1% of High Value Users
// 7.2% of At-Risk Churn
// Jaccard Index: 0.022

// Matrix overlap for multiple segments
const matrix = await segmentService.getOverlapMatrix([
  'seg_high_value_users',
  'seg_at_risk_churn',
  'seg_new_signup_7d',
  'seg_email_engaged',
  'seg_mobile_power_users',
]);

// Render as a table
console.log('\n=== Overlap Matrix ===');
console.log('Overlap counts (diagonal = segment size):');

const segNames = [...new Set(matrix.flatMap(o => [o.segmentAName, o.segmentBName]))];

for (const nameA of segNames) {
  const row: string[] = [nameA.padEnd(25)];
  for (const nameB of segNames) {
    if (nameA === nameB) {
      const self = matrix.find(o => o.segmentAName === nameA);
      row.push(String(self?.segmentACount ?? '-').padStart(8));
    } else {
      const pair = matrix.find(
        o => (o.segmentAName === nameA && o.segmentBName === nameB)
          || (o.segmentAName === nameB && o.segmentBName === nameA)
      );
      row.push(String(pair?.overlapCount ?? 0).padStart(8));
    }
  }
  console.log(row.join(' | '));
}

// Output (simplified):
// High Value Users          |    2847 |      87 |      12 |    1923 |     456
// At-Risk Churn             |      87 |    1203 |       3 |      45 |      22
// New Signup 7d             |      12 |       3 |     892 |     234 |     167
// Email Engaged             |    1923 |      45 |     234 |    8901 |    2345
// Mobile Power Users        |     456 |      22 |     167 |    2345 |    3456
```

### 6. Static Segment with CSV Import

Create a manually curated segment and import members from a CSV file.

```typescript
import { SegmentService, StaticSegmentService } from '@mcv/cdp/segments';
import { createReadStream } from 'fs';

const segmentService = container.resolve(SegmentService);
const staticService = container.resolve(StaticSegmentService);

// Create a static segment (no rules — membership is manual)
const segment = await segmentService.create({
  name: 'Beta Program Invitees',
  slug: 'beta_program_invitees',
  description: 'Hand-picked users invited to the Q1 beta program',
  type: 'static',
  computationMode: 'manual',
  tags: ['beta', 'manual'],
});

// Import members from CSV
// CSV format: profile_id (or email, external_id — auto-resolved)
// ──────────────────────────────────
// profile_id
// 01924f8a-1234-5678-9abc-def012345678
// 01924f8a-2345-6789-abcd-ef0123456789
// user@example.com          ← resolved via email lookup
// ext:stripe_cus_abc123     ← resolved via external ID
// ──────────────────────────────────

const csvStream = createReadStream('/tmp/beta-invitees.csv');
const importResult = await segmentService.importMembers(segment.id, csvStream);

console.log('=== CSV Import Result ===');
console.log(`Total rows: ${importResult.totalRows}`);
console.log(`Added: ${importResult.added}`);
console.log(`Skipped: ${importResult.skipped}`);
console.log(`Errors: ${importResult.errors.length}`);

for (const err of importResult.errors) {
  console.warn(`  Row ${err.row}: ${err.error}`);
}

// Output:
// === CSV Import Result ===
// Total rows: 250
// Added: 237
// Skipped: 8 (already members)
// Errors: 5
//   Row 42: Profile not found for email "unknown@test.com"
//   Row 89: Invalid profile ID format "not-a-uuid"
//   ...

// Manually add/remove individual members
await segmentService.addMembers(segment.id, [
  '01924f8a-aaaa-bbbb-cccc-dddddddddddd',
  '01924f8a-eeee-ffff-0000-111111111111',
]);

await segmentService.removeMembers(segment.id, [
  '01924f8a-2345-6789-abcd-ef0123456789',  // Remove one member
]);

// Check segment size
const updated = await segmentService.getById(segment.id);
console.log(`Current members: ${updated?.memberCount}`);
// → Current members: 238
```

### 7. Real-Time Profile Evaluation

Check in real time which segments a profile belongs to (for personalization decisions).

```typescript
import { SegmentService, SegmentEvaluator } from '@mcv/cdp/segments';

const segmentService = container.resolve(SegmentService);
const evaluator = container.resolve(SegmentEvaluator);

const profileId = '01924f8a-1234-5678-9abc-def012345678';

// Check a single segment
const isMember = await segmentService.evaluateProfile(
  'seg_high_value_users',
  profileId,
);
console.log(`Is high-value? ${isMember}`);
// → Is high-value? true

// Get ALL segments this profile belongs to
const profileSegments = await segmentService.getProfileSegments(profileId);

console.log(`Profile belongs to ${profileSegments.length} segments:`);
for (const seg of profileSegments) {
  console.log(`  - ${seg.name} (${seg.slug})`);
}
// Output:
// Profile belongs to 4 segments:
//   - High Value Users (high_value_users)
//   - Email Engaged (email_engaged)
//   - Mobile Power Users (mobile_power_users)
//   - US Customers (us_customers)

// Batch evaluate: which of these 100 profiles match a segment?
const candidateIds = [/* ... 100 profile IDs */];
const matchingIds = await segmentService.batchEvaluate(
  'seg_at_risk_churn',
  candidateIds,
);

console.log(`${matchingIds.length} of ${candidateIds.length} profiles match "at_risk_churn"`);
// → 12 of 100 profiles match "at_risk_churn"
```

### 8. Segment Growth Trend Analytics

Retrieve time-series data showing how a segment's size changed over time.

```typescript
import { SegmentService, SegmentAnalyticsService } from '@mcv/cdp/segments';

const segmentService = container.resolve(SegmentService);
const analyticsService = container.resolve(SegmentAnalyticsService);

const analytics = await segmentService.getGrowthTrend(
  'seg_high_value_users',
  {
    from: new Date('2025-01-01'),
    to: new Date('2025-01-31'),
  },
);

console.log('=== Growth Trend: High Value Users (Jan 2025) ===');
console.log(`Start: ${analytics.summary.startCount.toLocaleString()}`);
console.log(`End: ${analytics.summary.endCount.toLocaleString()}`);
console.log(`Net change: ${analytics.summary.netChange > 0 ? '+' : ''}${analytics.summary.netChange}`);
console.log(`Growth rate: ${(analytics.summary.growthRate * 100).toFixed(1)}%`);
console.log(`Avg daily change: ${analytics.summary.averageDailyChange.toFixed(1)}`);
console.log(`Peak: ${analytics.summary.peakCount.toLocaleString()}`);
console.log(`Trough: ${analytics.summary.troughCount.toLocaleString()}`);

console.log('\nDaily breakdown:');
for (const dp of analytics.dataPoints) {
  const bar = '█'.repeat(Math.round(dp.memberCount / 100));
  console.log(
    `  ${dp.date.toISOString().slice(0, 10)} | ${String(dp.memberCount).padStart(6)} | +${dp.added} -${dp.removed} | ${bar}`
  );
}

// Output:
// === Growth Trend: High Value Users (Jan 2025) ===
// Start: 2,450
// End: 2,847
// Net change: +397
// Growth rate: 16.2%
// Avg daily change: 12.8
// Peak: 2,860
// Trough: 2,430
//
// Daily breakdown:
//   2025-01-01 |   2450 | +12 -8 | ████████████████████████
//   2025-01-02 |   2454 | +18 -3 | ████████████████████████
//   2025-01-03 |   2469 | +22 -7 | ████████████████████████
//   ...
```

### 9. Cross-Venture Global Segments

Create a segment that spans all ventures on the platform (admin-only operation).

```typescript
import { SegmentService, buildRuleGroup } from '@mcv/cdp/segments';

const segmentService = container.resolve(SegmentService);

// Cross-venture segment: ventureId is null
// Requires platform-admin permissions
const globalSegment = await segmentService.create({
  name: 'Platform Power Users',
  slug: 'platform_power_users',
  description: 'Users active across multiple ventures with high engagement',
  type: 'dynamic',
  rootRuleGroup: buildRuleGroup('AND', [
    {
      field: 'ventures_active',
      fieldSource: 'computed',
      operator: 'gte',
      value: 3,
      valueType: 'number',
      negated: false,
    },
    {
      field: 'total_sessions_30d',
      fieldSource: 'trait',
      operator: 'gte',
      value: 50,
      valueType: 'number',
      negated: false,
    },
    {
      field: 'account_status',
      fieldSource: 'profile',
      operator: 'eq',
      value: 'active',
      valueType: 'string',
      negated: false,
    },
  ]),
  computationMode: 'scheduled',
  schedule: {
    cron: '0 2 * * *',             // Daily at 2 AM
    label: 'Daily at 2:00 AM',
    timezone: 'UTC',
    timeoutMs: 300_000,            // 5 minutes (larger dataset)
    skipIfRunning: true,
  },
  tags: ['global', 'platform-ops'],
});

// Note: globalSegment.ventureId will be null
// It is visible to all ventures but only editable by platform admins
console.log(`Global segment created: ${globalSegment.id}`);
console.log(`Venture ID: ${globalSegment.ventureId ?? 'null (global)'}`);
```

### 10. Computed Segments (Union / Intersection / Exclusion)

Build a segment that is derived from combining other segments, rather than raw trait rules.

```typescript
import { SegmentService, buildRuleGroup } from '@mcv/cdp/segments';

const segmentService = container.resolve(SegmentService);

// "Campaign Target List" = (high_value_users OR email_engaged) AND NOT at_risk_churn
const campaignTarget = await segmentService.create({
  name: 'Q1 Campaign Targets',
  slug: 'q1_campaign_targets',
  description: 'High-value or engaged users who are not at risk of churning',
  type: 'computed',
  rootRuleGroup: buildRuleGroup('AND', [
    // Union: high_value OR email_engaged
    buildRuleGroup('OR', [
      {
        field: 'segment:high_value_users',
        fieldSource: 'segment',
        operator: 'eq',
        value: true,
        valueType: 'boolean',
        negated: false,
      },
      {
        field: 'segment:email_engaged',
        fieldSource: 'segment',
        operator: 'eq',
        value: true,
        valueType: 'boolean',
        negated: false,
      },
    ]),
    // Exclusion: NOT at_risk_churn
    {
      field: 'segment:at_risk_churn',
      fieldSource: 'segment',
      operator: 'eq',
      value: true,
      valueType: 'boolean',
      negated: true,  // NOT
    },
  ]),
  computationMode: 'scheduled',
  schedule: {
    cron: '30 8 * * *',           // Daily at 8:30 AM (after component segments recompute)
    label: 'Daily at 8:30 AM',
    timezone: 'America/New_York',
    timeoutMs: 120_000,
    skipIfRunning: true,
  },
  tags: ['campaign', 'q1-2025'],
});

console.log(`Computed segment: ${campaignTarget.slug}`);
// Membership is the union of high_value + email_engaged minus at_risk_churn

// Estimate to verify sizing looks right
const estimate = await segmentService.estimate(campaignTarget.rootRuleGroup!);
console.log(`Estimated: ${estimate.estimatedCount.toLocaleString()} profiles`);
// → Estimated: 9,450 profiles
```

---

## tRPC Router

The segment module exposes a tRPC router that provides the full segment API to the frontend.

```typescript
import { router, protectedProcedure, adminProcedure } from '@mcv/trpc';
import { z } from 'zod';
import {
  SegmentService,
  SegmentAnalyticsService,
  ruleGroupSchema,      // Zod schema for RuleGroup validation
  segmentScheduleSchema, // Zod schema for SegmentSchedule validation
} from '@mcv/cdp/segments';

export const segmentRouter = router({
  // ── CRUD ────────────────────────────────────────────────────

  create: protectedProcedure
    .input(z.object({
      name: z.string().min(1).max(255),
      slug: z.string().regex(/^[a-z0-9_]+$/).min(1).max(128),
      description: z.string().max(2000).optional(),
      type: z.enum(['dynamic', 'static', 'computed', 'predictive']),
      rootRuleGroup: ruleGroupSchema.optional(),
      computationMode: z.enum(['realtime', 'streaming', 'scheduled', 'manual']).optional(),
      schedule: segmentScheduleSchema.optional(),
      tags: z.array(z.string().max(64)).max(20).optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const service = ctx.container.resolve(SegmentService);
      return service.create(input);
    }),

  getById: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ input, ctx }) => {
      const service = ctx.container.resolve(SegmentService);
      return service.getById(input.id);
    }),

  getBySlug: protectedProcedure
    .input(z.object({ slug: z.string() }))
    .query(async ({ input, ctx }) => {
      const service = ctx.container.resolve(SegmentService);
      return service.getBySlug(input.slug);
    }),

  list: protectedProcedure
    .input(z.object({
      type: z.enum(['dynamic', 'static', 'computed', 'predictive']).optional(),
      status: z.enum(['draft', 'active', 'paused', 'computing', 'error', 'archived']).optional(),
      tags: z.array(z.string()).optional(),
      search: z.string().optional(),
      sortBy: z.enum(['name', 'memberCount', 'createdAt', 'updatedAt', 'lastComputedAt']).optional(),
      sortOrder: z.enum(['asc', 'desc']).optional(),
      cursor: z.string().optional(),
      limit: z.number().min(1).max(100).optional(),
      includeArchived: z.boolean().optional(),
      includeGlobal: z.boolean().optional(),
    }))
    .query(async ({ input, ctx }) => {
      const service = ctx.container.resolve(SegmentService);
      return service.list(input);
    }),

  update: protectedProcedure
    .input(z.object({
      id: z.string().uuid(),
      name: z.string().min(1).max(255).optional(),
      slug: z.string().regex(/^[a-z0-9_]+$/).max(128).optional(),
      description: z.string().max(2000).optional(),
      rootRuleGroup: ruleGroupSchema.optional(),
      computationMode: z.enum(['realtime', 'streaming', 'scheduled', 'manual']).optional(),
      schedule: segmentScheduleSchema.optional(),
      tags: z.array(z.string().max(64)).max(20).optional(),
      status: z.enum(['active', 'paused']).optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const { id, ...data } = input;
      const service = ctx.container.resolve(SegmentService);
      return service.update(id, data);
    }),

  archive: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ input, ctx }) => {
      const service = ctx.container.resolve(SegmentService);
      return service.archive(input.id);
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ input, ctx }) => {
      const service = ctx.container.resolve(SegmentService);
      return service.delete(input.id);
    }),

  duplicate: protectedProcedure
    .input(z.object({
      id: z.string().uuid(),
      newSlug: z.string().regex(/^[a-z0-9_]+$/).max(128),
    }))
    .mutation(async ({ input, ctx }) => {
      const service = ctx.container.resolve(SegmentService);
      return service.duplicate(input.id, input.newSlug);
    }),

  // ── Evaluation ──────────────────────────────────────────────

  computeMembership: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ input, ctx }) => {
      const service = ctx.container.resolve(SegmentService);
      return service.computeMembership(input.id);
    }),

  evaluateProfile: protectedProcedure
    .input(z.object({
      segmentId: z.string().uuid(),
      profileId: z.string().uuid(),
    }))
    .query(async ({ input, ctx }) => {
      const service = ctx.container.resolve(SegmentService);
      return service.evaluateProfile(input.segmentId, input.profileId);
    }),

  getProfileSegments: protectedProcedure
    .input(z.object({ profileId: z.string().uuid() }))
    .query(async ({ input, ctx }) => {
      const service = ctx.container.resolve(SegmentService);
      return service.getProfileSegments(input.profileId);
    }),

  // ── Estimation ──────────────────────────────────────────────

  estimate: protectedProcedure
    .input(z.object({ rules: ruleGroupSchema }))
    .query(async ({ input, ctx }) => {
      const service = ctx.container.resolve(SegmentService);
      return service.estimate(input.rules);
    }),

  // ── Analytics ───────────────────────────────────────────────

  growthTrend: protectedProcedure
    .input(z.object({
      segmentId: z.string().uuid(),
      from: z.date(),
      to: z.date(),
    }))
    .query(async ({ input, ctx }) => {
      const service = ctx.container.resolve(SegmentService);
      return service.getGrowthTrend(input.segmentId, { from: input.from, to: input.to });
    }),

  overlap: protectedProcedure
    .input(z.object({
      segmentIdA: z.string().uuid(),
      segmentIdB: z.string().uuid(),
    }))
    .query(async ({ input, ctx }) => {
      const service = ctx.container.resolve(SegmentService);
      return service.getOverlap(input.segmentIdA, input.segmentIdB);
    }),

  overlapMatrix: protectedProcedure
    .input(z.object({
      segmentIds: z.array(z.string().uuid()).min(2).max(20),
    }))
    .query(async ({ input, ctx }) => {
      const service = ctx.container.resolve(SegmentService);
      return service.getOverlapMatrix(input.segmentIds);
    }),

  // ── Static Members ──────────────────────────────────────────

  addMembers: protectedProcedure
    .input(z.object({
      segmentId: z.string().uuid(),
      profileIds: z.array(z.string().uuid()).min(1).max(10_000),
    }))
    .mutation(async ({ input, ctx }) => {
      const service = ctx.container.resolve(SegmentService);
      return service.addMembers(input.segmentId, input.profileIds);
    }),

  removeMembers: protectedProcedure
    .input(z.object({
      segmentId: z.string().uuid(),
      profileIds: z.array(z.string().uuid()).min(1).max(10_000),
    }))
    .mutation(async ({ input, ctx }) => {
      const service = ctx.container.resolve(SegmentService);
      return service.removeMembers(input.segmentId, input.profileIds);
    }),

  // ── Sync ────────────────────────────────────────────────────

  syncToDestination: protectedProcedure
    .input(z.object({
      segmentId: z.string().uuid(),
      destinationId: z.string().uuid(),
    }))
    .mutation(async ({ input, ctx }) => {
      const service = ctx.container.resolve(SegmentService);
      return service.syncToDestination(input.segmentId, input.destinationId);
    }),

  getSyncJobs: protectedProcedure
    .input(z.object({ segmentId: z.string().uuid() }))
    .query(async ({ input, ctx }) => {
      const service = ctx.container.resolve(SegmentService);
      return service.getSyncJobs(input.segmentId);
    }),
});
```

---

## Error Codes

All errors thrown by the segments module use structured error codes from the `SegmentErrorCode` enum, wrapped in `McvError` instances.

| Code | Constant | HTTP | Description |
|------|----------|------|-------------|
| `SEG_001` | `SEGMENT_NOT_FOUND` | 404 | The requested segment ID or slug does not exist (or is not visible to the current venture). |
| `SEG_002` | `SEGMENT_SLUG_CONFLICT` | 409 | A segment with the given slug already exists in this venture's namespace. |
| `SEG_003` | `SEGMENT_SLUG_INVALID` | 400 | Slug contains invalid characters. Must be lowercase alphanumeric with underscores only (`^[a-z0-9_]+$`). |
| `SEG_004` | `SEGMENT_RULES_INVALID` | 400 | The rule group JSON is structurally invalid — missing required fields, unknown operators, or type mismatches. |
| `SEG_005` | `SEGMENT_RULES_TOO_DEEP` | 400 | Rule group nesting exceeds the maximum depth of 5 levels. Simplify the rule tree. |
| `SEG_006` | `SEGMENT_RULES_TOO_COMPLEX` | 400 | The rule tree exceeds the maximum of 50 individual rules per segment. Consider splitting into multiple segments and using computed segment composition. |
| `SEG_007` | `SEGMENT_COMPUTATION_TIMEOUT` | 408 | Membership computation exceeded the configured timeout. The segment may be too complex or the dataset too large — consider sampling or narrowing rules. |
| `SEG_008` | `SEGMENT_COMPUTATION_FAILED` | 500 | An unexpected error occurred during membership computation. The generated SQL may have produced a database error. Details are logged. |
| `SEG_009` | `SEGMENT_ALREADY_COMPUTING` | 409 | A computation is already in progress for this segment. Wait for it to complete or enable `skipIfRunning` in the schedule. |
| `SEG_010` | `SEGMENT_STATIC_RULES_FORBIDDEN` | 400 | Cannot set `rootRuleGroup` on a static segment. Static segments use manual membership management. |
| `SEG_011` | `SEGMENT_DYNAMIC_MEMBERS_FORBIDDEN` | 400 | Cannot manually add/remove members on a dynamic segment. Membership is controlled by rules. Use a static or computed segment for manual control. |
| `SEG_012` | `SEGMENT_SYNC_DESTINATION_NOT_FOUND` | 404 | The specified destination connector ID does not exist or is not configured for this venture. |
| `SEG_013` | `SEGMENT_SYNC_IN_PROGRESS` | 409 | A sync job is already running for this segment-destination pair. Wait for it to complete. |
| `SEG_014` | `SEGMENT_ARCHIVED` | 400 | The segment is archived and cannot be modified. Restore it first with `segmentService.restore()`. |
| `SEG_015` | `SEGMENT_ESTIMATION_FAILED` | 500 | The estimation query failed — the rules may reference non-existent traits or use unsupported operators for the field type. |
| `SEG_016` | `SEGMENT_IMPORT_FORMAT_INVALID` | 400 | The CSV file format is invalid. Expected a header row with `profile_id`, `email`, or `external_id` column. |
| `SEG_017` | `SEGMENT_IMPORT_TOO_LARGE` | 413 | The CSV import exceeds the maximum of 100,000 rows per import. Split into multiple batches. |
| `SEG_018` | `SEGMENT_CIRCULAR_REFERENCE` | 400 | A computed segment references itself (directly or indirectly through a chain of segment references). |
| `SEG_019` | `SEGMENT_GLOBAL_PERMISSION_DENIED` | 403 | Cross-venture global segments can only be created or modified by platform administrators. |
| `SEG_020` | `SEGMENT_SCHEDULE_INVALID` | 400 | The cron expression is invalid or the timezone is not recognized. Use standard 5-field cron syntax and IANA timezone names. |
| `SEG_021` | `SEGMENT_OVERLAP_LIMIT_EXCEEDED` | 400 | Overlap matrix computation is limited to 20 segments at a time. Reduce the segment count. |
| `SEG_022` | `SEGMENT_TRAIT_NOT_FOUND` | 400 | A rule references a trait key that does not exist in the trait schema. Verify the trait is defined in `@mcv/cdp/traits`. |

---

## Security

### Multi-Tenant Isolation

All segment data is scoped by `venture_id` using Supabase Row-Level Security (RLS) policies. The policies enforce:

- **Venture segments:** Only visible and modifiable by users within the owning venture.
- **Global segments (ventureId = null):** Readable by all ventures, but only writable by platform administrators with the `platform:admin` role.
- **Membership data:** RLS on `segment_memberships` ensures a venture can only see memberships for their own profiles.

```sql
-- RLS policy for venture-scoped segment access
CREATE POLICY segments_venture_isolation ON cdp_segments
  USING (
    venture_id = current_setting('app.current_venture_id')::uuid
    OR venture_id IS NULL  -- global segments are readable
  )
  WITH CHECK (
    venture_id = current_setting('app.current_venture_id')::uuid
  );

-- RLS policy for membership data
CREATE POLICY memberships_venture_isolation ON cdp_segment_memberships
  USING (venture_id = current_setting('app.current_venture_id')::uuid);
```

### Permission Model

| Action | Required Permission |
|--------|-------------------|
| List/view segments | `segments:read` |
| Create/update segments | `segments:write` |
| Delete segments | `segments:delete` |
| Compute membership | `segments:compute` |
| Sync to destination | `segments:sync` + `sync:write` |
| View analytics | `segments:analytics` |
| Manage global segments | `platform:admin` |
| Import CSV members | `segments:write` + `segments:import` |

### Data Sensitivity

- **Rule definitions** may reference PII trait keys (email, phone, address). The rules themselves are metadata and do not contain raw PII.
- **Membership tables** contain profile IDs, which are pseudonymous identifiers. When combined with profile data, they constitute personal data under GDPR.
- **Segment sync jobs** may push profile data to external destinations. Ensure destination connectors are authorized under the venture's data processing agreements.
- **Audit logging** records all segment CRUD and computation operations with the acting user ID and timestamp.

### Rate Limits

| Operation | Limit |
|-----------|-------|
| Segment creation | 50 per venture per hour |
| Membership computation | 10 concurrent per venture |
| Estimation queries | 30 per venture per minute |
| Sync triggers | 5 concurrent per venture |
| CSV imports | 3 concurrent per venture |
| Overlap matrix | 5 per venture per minute |

---

## Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `CDP_SEGMENT_MAX_RULES` | No | `50` | Maximum individual rules per segment. |
| `CDP_SEGMENT_MAX_DEPTH` | No | `5` | Maximum nesting depth for rule groups. |
| `CDP_SEGMENT_COMPUTE_TIMEOUT_MS` | No | `300000` | Default timeout for membership computation (5 min). |
| `CDP_SEGMENT_ESTIMATE_TIMEOUT_MS` | No | `30000` | Timeout for estimation queries (30s). |
| `CDP_SEGMENT_BATCH_SIZE` | No | `5000` | Batch size for membership inserts/deletes during computation. |
| `CDP_SEGMENT_MAX_MEMBERS_PER_BATCH` | No | `10000` | Maximum profiles in a single `addMembers` / `removeMembers` call. |
| `CDP_SEGMENT_MAX_IMPORT_ROWS` | No | `100000` | Maximum rows in a CSV import. |
| `CDP_SEGMENT_SYNC_CONCURRENCY` | No | `3` | Maximum concurrent sync jobs per venture. |
| `CDP_SEGMENT_ANALYTICS_RETENTION_DAYS` | No | `365` | How long to retain daily analytics snapshots. |
| `CDP_SEGMENT_SCHEDULER_ENABLED` | No | `true` | Whether the built-in cron scheduler is active. Disable in test environments. |
| `CDP_SEGMENT_REALTIME_ENABLED` | No | `false` | Whether real-time segment evaluation is enabled. Requires additional infrastructure (CDC pipeline). |
| `CDP_SEGMENT_SAMPLING_THRESHOLD` | No | `1000000` | Profile count above which estimation automatically uses sampling. |
| `DATABASE_URL` | Yes | — | Supabase PostgreSQL connection string. |

---

## Dependencies

### Internal Dependencies

| Module | Relationship |
|--------|-------------|
| `@mcv/cdp/profiles` | Reads unified profile data (core fields, created_at, status) for rule evaluation against `profile` field source. |
| `@mcv/cdp/traits` | Reads trait values and trait schema definitions. Rules reference trait keys; the segment evaluator JOINs against trait value tables. |
| `@mcv/cdp/sync` | Pushes computed segment membership to external destinations. The `SegmentSyncService` delegates to sync connectors for actual data delivery. |
| `@mcv/auth` | Extracts authenticated venture context and user permissions from the request. Required for RLS and permission checks. |
| `@mcv/db` | Provides the Drizzle ORM database client and transaction utilities. |
| `@mcv/trpc` | Base tRPC router and procedure builders (`protectedProcedure`, `adminProcedure`). |
| `@mcv/errors` | `McvError` base class and error formatting utilities. |
| `@mcv/logger` | Structured logging for computation runs, sync jobs, and scheduling events. |
| `@mcv/queue` | Job queue for async computation and sync operations (BullMQ-based). |

### External Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| `drizzle-orm` | `^0.30.0` | Database ORM for schema definition and query building. |
| `zod` | `^3.22.0` | Runtime validation of rule group structures and API inputs. |
| `cron-parser` | `^4.9.0` | Parsing and validating cron expressions for segment schedules. |
| `csv-parse` | `^5.5.0` | Streaming CSV parser for member import functionality. |
| `uuid` | `^9.0.0` | UUIDv7 generation for entity IDs. |
| `lodash-es` | `^4.17.21` | Utility functions (deep cloning rule trees, array operations). |

---

## Testing

### Unit Tests

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { RuleEngine } from '@mcv/cdp/segments';
import type { RuleGroup, SegmentRule } from '@mcv/cdp/segments';

describe('RuleEngine', () => {
  let engine: RuleEngine;

  beforeEach(() => {
    engine = new RuleEngine();
  });

  describe('evaluateRule', () => {
    it('should evaluate eq operator correctly', () => {
      const rule: SegmentRule = {
        id: 'rule-1',
        field: 'plan_tier',
        fieldSource: 'trait',
        operator: 'eq',
        value: 'enterprise',
        valueType: 'string',
        negated: false,
      };

      const profile = { traits: { plan_tier: 'enterprise' } };
      expect(engine.evaluateRule(rule, profile)).toBe(true);

      const profile2 = { traits: { plan_tier: 'free' } };
      expect(engine.evaluateRule(rule, profile2)).toBe(false);
    });

    it('should handle negated rules', () => {
      const rule: SegmentRule = {
        id: 'rule-2',
        field: 'plan_tier',
        fieldSource: 'trait',
        operator: 'eq',
        value: 'free',
        valueType: 'string',
        negated: true,  // NOT free
      };

      const profile = { traits: { plan_tier: 'enterprise' } };
      expect(engine.evaluateRule(rule, profile)).toBe(true);

      const profile2 = { traits: { plan_tier: 'free' } };
      expect(engine.evaluateRule(rule, profile2)).toBe(false);
    });

    it('should evaluate between operator with numeric range', () => {
      const rule: SegmentRule = {
        id: 'rule-3',
        field: 'ltv',
        fieldSource: 'trait',
        operator: 'between',
        value: [100, 500],
        valueType: 'number',
        negated: false,
      };

      expect(engine.evaluateRule(rule, { traits: { ltv: 250 } })).toBe(true);
      expect(engine.evaluateRule(rule, { traits: { ltv: 100 } })).toBe(true);  // inclusive
      expect(engine.evaluateRule(rule, { traits: { ltv: 500 } })).toBe(true);  // inclusive
      expect(engine.evaluateRule(rule, { traits: { ltv: 501 } })).toBe(false);
      expect(engine.evaluateRule(rule, { traits: { ltv: 99 } })).toBe(false);
    });

    it('should evaluate within_last temporal operator', () => {
      const rule: SegmentRule = {
        id: 'rule-4',
        field: 'last_login_at',
        fieldSource: 'profile',
        operator: 'within_last',
        value: { amount: 7, unit: 'days' },
        valueType: 'date',
        negated: false,
      };

      const recentDate = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000); // 3 days ago
      expect(engine.evaluateRule(rule, { last_login_at: recentDate })).toBe(true);

      const oldDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // 30 days ago
      expect(engine.evaluateRule(rule, { last_login_at: oldDate })).toBe(false);
    });

    it('should evaluate array_contains_any operator', () => {
      const rule: SegmentRule = {
        id: 'rule-5',
        field: 'interests',
        fieldSource: 'trait',
        operator: 'array_contains_any',
        value: ['sports', 'music', 'tech'],
        valueType: 'array',
        negated: false,
      };

      expect(engine.evaluateRule(rule, { traits: { interests: ['sports', 'cooking'] } })).toBe(true);
      expect(engine.evaluateRule(rule, { traits: { interests: ['cooking', 'travel'] } })).toBe(false);
    });
  });

  describe('evaluateGroup', () => {
    it('should evaluate AND group (all must match)', () => {
      const group: RuleGroup = {
        id: 'group-1',
        operator: 'AND',
        negated: false,
        children: [
          {
            id: 'r1', field: 'plan_tier', fieldSource: 'trait',
            operator: 'eq', value: 'pro', valueType: 'string', negated: false,
          },
          {
            id: 'r2', field: 'ltv', fieldSource: 'trait',
            operator: 'gte', value: 100, valueType: 'number', negated: false,
          },
        ],
      };

      const match = { traits: { plan_tier: 'pro', ltv: 200 } };
      expect(engine.evaluateGroup(group, match)).toBe(true);

      const noMatch = { traits: { plan_tier: 'pro', ltv: 50 } };
      expect(engine.evaluateGroup(group, noMatch)).toBe(false);
    });

    it('should evaluate OR group (any must match)', () => {
      const group: RuleGroup = {
        id: 'group-2',
        operator: 'OR',
        negated: false,
        children: [
          {
            id: 'r1', field: 'plan_tier', fieldSource: 'trait',
            operator: 'eq', value: 'enterprise', valueType: 'string', negated: false,
          },
          {
            id: 'r2', field: 'ltv', fieldSource: 'trait',
            operator: 'gte', value: 1000, valueType: 'number', negated: false,
          },
        ],
      };

      const matchFirst = { traits: { plan_tier: 'enterprise', ltv: 50 } };
      expect(engine.evaluateGroup(group, matchFirst)).toBe(true);

      const matchSecond = { traits: { plan_tier: 'free', ltv: 2000 } };
      expect(engine.evaluateGroup(group, matchSecond)).toBe(true);

      const noMatch = { traits: { plan_tier: 'free', ltv: 50 } };
      expect(engine.evaluateGroup(group, noMatch)).toBe(false);
    });

    it('should handle negated groups', () => {
      const group: RuleGroup = {
        id: 'group-3',
        operator: 'AND',
        negated: true,  // NOT (plan_tier = free AND ltv < 10)
        children: [
          {
            id: 'r1', field: 'plan_tier', fieldSource: 'trait',
            operator: 'eq', value: 'free', valueType: 'string', negated: false,
          },
          {
            id: 'r2', field: 'ltv', fieldSource: 'trait',
            operator: 'lt', value: 10, valueType: 'number', negated: false,
          },
        ],
      };

      // NOT (free AND ltv < 10) — should be true for paid users
      const paidUser = { traits: { plan_tier: 'pro', ltv: 500 } };
      expect(engine.evaluateGroup(group, paidUser)).toBe(true);

      // NOT (free AND ltv < 10) — should be false for free users with low LTV
      const cheapFreeUser = { traits: { plan_tier: 'free', ltv: 5 } };
      expect(engine.evaluateGroup(group, cheapFreeUser)).toBe(false);
    });

    it('should short-circuit AND evaluation', () => {
      let secondRuleEvaluated = false;
      const group: RuleGroup = {
        id: 'group-sc',
        operator: 'AND',
        negated: false,
        children: [
          {
            id: 'r1', field: 'plan_tier', fieldSource: 'trait',
            operator: 'eq', value: 'nonexistent', valueType: 'string', negated: false,
          },
          // This should never be reached due to short-circuit
          {
            id: 'r2', field: 'ltv', fieldSource: 'trait',
            operator: 'gte', value: 100, valueType: 'number', negated: false,
          },
        ],
      };

      const profile = { traits: { plan_tier: 'free', ltv: 200 } };
      expect(engine.evaluateGroup(group, profile)).toBe(false);
    });
  });
});
```

### Integration Tests

```typescript
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createTestContext, seedTestData, cleanupTestData } from '@mcv/test-utils';
import { SegmentService, buildRuleGroup } from '@mcv/cdp/segments';

describe('SegmentService (integration)', () => {
  let ctx: TestContext;
  let service: SegmentService;

  beforeAll(async () => {
    ctx = await createTestContext({ modules: ['cdp/profiles', 'cdp/traits', 'cdp/segments'] });
    service = ctx.container.resolve(SegmentService);

    // Seed test profiles with traits
    await seedTestData(ctx, {
      profiles: 100,
      traits: {
        ltv: { type: 'number', range: [0, 1000] },
        plan_tier: { type: 'enum', values: ['free', 'pro', 'enterprise'] },
        country: { type: 'enum', values: ['US', 'CA', 'GB', 'DE', 'JP'] },
        last_login_at: { type: 'date', range: ['2024-01-01', '2025-01-31'] },
      },
    });
  });

  afterAll(async () => {
    await cleanupTestData(ctx);
    await ctx.dispose();
  });

  it('should create a segment and compute membership', async () => {
    const segment = await service.create({
      name: 'Test Segment',
      slug: 'test_segment_integration',
      type: 'dynamic',
      rootRuleGroup: buildRuleGroup('AND', [
        {
          field: 'ltv',
          fieldSource: 'trait',
          operator: 'gte',
          value: 500,
          valueType: 'number',
          negated: false,
        },
      ]),
      computationMode: 'manual',
    });

    expect(segment.id).toBeDefined();
    expect(segment.status).toBe('draft');

    const result = await service.computeMembership(segment.id);

    expect(result.totalMatched).toBeGreaterThan(0);
    expect(result.totalMatched).toBeLessThanOrEqual(100);
    expect(result.added.length).toBe(result.totalMatched);
    expect(result.removed.length).toBe(0);
    expect(result.error).toBeNull();

    // Verify segment member count was updated
    const updated = await service.getById(segment.id);
    expect(updated?.memberCount).toBe(result.totalMatched);
  });

  it('should estimate segment size without persisting', async () => {
    const rules = buildRuleGroup('AND', [
      {
        field: 'country',
        fieldSource: 'trait',
        operator: 'in',
        value: ['US', 'CA'],
        valueType: 'string',
        negated: false,
      },
    ]);

    const estimate = await service.estimate(rules);

    expect(estimate.estimatedCount).toBeGreaterThanOrEqual(0);
    expect(estimate.estimatedCount).toBeLessThanOrEqual(100);
    expect(estimate.confidence).toBeDefined();
    expect(estimate.totalProfiles).toBe(100);
    expect(estimate.percentageOfTotal).toBeGreaterThanOrEqual(0);
    expect(estimate.percentageOfTotal).toBeLessThanOrEqual(100);
  });

  it('should detect circular references in computed segments', async () => {
    const segA = await service.create({
      name: 'Seg A', slug: 'seg_circular_a', type: 'computed',
      rootRuleGroup: buildRuleGroup('AND', [
        { field: 'segment:seg_circular_b', fieldSource: 'segment', operator: 'eq', value: true, valueType: 'boolean', negated: false },
      ]),
      computationMode: 'manual',
    });

    await expect(
      service.create({
        name: 'Seg B', slug: 'seg_circular_b', type: 'computed',
        rootRuleGroup: buildRuleGroup('AND', [
          { field: 'segment:seg_circular_a', fieldSource: 'segment', operator: 'eq', value: true, valueType: 'boolean', negated: false },
        ]),
        computationMode: 'manual',
      })
    ).rejects.toThrow('SEGMENT_CIRCULAR_REFERENCE');
  });

  it('should enforce type constraints between static and dynamic', async () => {
    const staticSeg = await service.create({
      name: 'Static Test', slug: 'static_type_test', type: 'static',
      computationMode: 'manual',
    });

    // Cannot add rules to a static segment
    await expect(
      service.update(staticSeg.id, {
        rootRuleGroup: buildRuleGroup('AND', [
          { field: 'ltv', fieldSource: 'trait', operator: 'gte', value: 100, valueType: 'number', negated: false },
        ]),
      })
    ).rejects.toThrow('SEGMENT_STATIC_RULES_FORBIDDEN');

    const dynamicSeg = await service.create({
      name: 'Dynamic Test', slug: 'dynamic_type_test', type: 'dynamic',
      rootRuleGroup: buildRuleGroup('AND', [
        { field: 'ltv', fieldSource: 'trait', operator: 'gte', value: 100, valueType: 'number', negated: false },
      ]),
      computationMode: 'manual',
    });

    // Cannot manually add members to a dynamic segment
    await expect(
      service.addMembers(dynamicSeg.id, ['some-profile-id'])
    ).rejects.toThrow('SEGMENT_DYNAMIC_MEMBERS_FORBIDDEN');
  });

  it('should compute overlap between two segments', async () => {
    const segA = await service.create({
      name: 'Overlap A', slug: 'overlap_test_a', type: 'dynamic',
      rootRuleGroup: buildRuleGroup('AND', [
        { field: 'ltv', fieldSource: 'trait', operator: 'gte', value: 200, valueType: 'number', negated: false },
      ]),
      computationMode: 'manual',
    });

    const segB = await service.create({
      name: 'Overlap B', slug: 'overlap_test_b', type: 'dynamic',
      rootRuleGroup: buildRuleGroup('AND', [
        { field: 'country', fieldSource: 'trait', operator: 'eq', value: 'US', valueType: 'string', negated: false },
      ]),
      computationMode: 'manual',
    });

    await service.computeMembership(segA.id);
    await service.computeMembership(segB.id);

    const overlap = await service.getOverlap(segA.id, segB.id);

    expect(overlap.segmentACount).toBeGreaterThan(0);
    expect(overlap.segmentBCount).toBeGreaterThan(0);
    expect(overlap.overlapCount).toBeGreaterThanOrEqual(0);
    expect(overlap.overlapCount).toBeLessThanOrEqual(Math.min(overlap.segmentACount, overlap.segmentBCount));
    expect(overlap.jaccardIndex).toBeGreaterThanOrEqual(0);
    expect(overlap.jaccardIndex).toBeLessThanOrEqual(1);
  });
});
```

### Testing Notes

- **Test database:** Integration tests use a dedicated Supabase test project with RLS enabled. The `createTestContext` utility sets the `app.current_venture_id` session variable.
- **Seed data:** `seedTestData` generates deterministic profiles with random but reproducible trait values (seeded PRNG). This ensures consistent test results across runs.
- **Cleanup:** Each test suite creates uniquely-slugged segments to avoid conflicts. `cleanupTestData` removes all test data after the suite completes.
- **Computation tests:** When testing membership computation, seed a known dataset and assert exact counts. Avoid flaky tests by not relying on estimation confidence levels.
- **Mocking sync:** Sync integration tests mock the `@mcv/cdp/sync` connector layer to avoid hitting real external APIs. Use `vi.mock()` or test doubles.
- **Performance tests:** For segments with >10K members, add performance benchmarks using `vitest.bench()`. Track computation time regressions in CI.
- **Rule coverage:** Ensure every `RuleOperator` has at least one positive and one negative test case in the RuleEngine unit tests.
- **Edge cases to cover:**
  - Rules referencing non-existent traits (should fail validation)
  - Empty rule groups (should match all or none, depending on operator)
  - Null/undefined trait values with `exists`/`not_exists` operators
  - Unicode and special characters in string comparisons
  - Timezone edge cases in temporal operators (`within_last` at DST boundaries)
  - Maximum nesting depth (5 levels) — should succeed at exactly 5, fail at 6
  - Concurrent computation requests for the same segment

---

## Rules DSL Reference

### Operator Quick Reference

| Operator | Applies To | Value Type | Example |
|----------|-----------|------------|---------|
| `eq` | All | Single | `{ field: "plan", op: "eq", value: "pro" }` |
| `neq` | All | Single | `{ field: "status", op: "neq", value: "churned" }` |
| `gt` | Number, Date | Single | `{ field: "ltv", op: "gt", value: 500 }` |
| `gte` | Number, Date | Single | `{ field: "age", op: "gte", value: 18 }` |
| `lt` | Number, Date | Single | `{ field: "risk_score", op: "lt", value: 0.5 }` |
| `lte` | Number, Date | Single | `{ field: "days_inactive", op: "lte", value: 7 }` |
| `between` | Number, Date | Tuple | `{ field: "ltv", op: "between", value: [100, 500] }` |
| `not_between` | Number, Date | Tuple | `{ field: "age", op: "not_between", value: [13, 17] }` |
| `contains` | String | Single | `{ field: "email", op: "contains", value: "@gmail" }` |
| `not_contains` | String | Single | `{ field: "name", op: "not_contains", value: "test" }` |
| `starts_with` | String | Single | `{ field: "email", op: "starts_with", value: "admin" }` |
| `ends_with` | String | Single | `{ field: "email", op: "ends_with", value: ".edu" }` |
| `regex` | String | Single | `{ field: "phone", op: "regex", value: "^\\+1" }` |
| `in` | All | Array | `{ field: "country", op: "in", value: ["US","CA"] }` |
| `not_in` | All | Array | `{ field: "plan", op: "not_in", value: ["free","trial"] }` |
| `exists` | All | Null | `{ field: "phone", op: "exists", value: null }` |
| `not_exists` | All | Null | `{ field: "deleted_at", op: "not_exists", value: null }` |
| `within_last` | Date | Relative | `{ field: "login", op: "within_last", value: { amount: 7, unit: "days" } }` |
| `not_within_last` | Date | Relative | `{ field: "login", op: "not_within_last", value: { amount: 30, unit: "days" } }` |
| `before` | Date | Single | `{ field: "created_at", op: "before", value: "2024-01-01" }` |
| `after` | Date | Single | `{ field: "created_at", op: "after", value: "2024-06-01" }` |
| `array_contains` | Array | Single | `{ field: "tags", op: "array_contains", value: "vip" }` |
| `array_contains_any` | Array | Array | `{ field: "tags", op: "array_contains_any", value: ["vip","whale"] }` |
| `array_contains_all` | Array | Array | `{ field: "tags", op: "array_contains_all", value: ["active","paid"] }` |

### SQL Generation

The `segmentToSql` utility converts a rule group tree into a parameterized SQL WHERE clause. This is the core of the computation engine.

```typescript
import { segmentToSql } from '@mcv/cdp/segments';

const rules: RuleGroup = buildRuleGroup('AND', [
  {
    field: 'ltv',
    fieldSource: 'trait',
    operator: 'gte',
    value: 500,
    valueType: 'number',
    negated: false,
  },
  buildRuleGroup('OR', [
    {
      field: 'country',
      fieldSource: 'trait',
      operator: 'in',
      value: ['US', 'CA'],
      valueType: 'string',
      negated: false,
    },
    {
      field: 'plan_tier',
      fieldSource: 'trait',
      operator: 'eq',
      value: 'enterprise',
      valueType: 'string',
      negated: false,
    },
  ]),
]);

const { sql, params } = segmentToSql(rules, { ventureId: 'venture-123' });

console.log(sql);
// SELECT DISTINCT p.id
// FROM cdp_profiles p
// LEFT JOIN cdp_trait_values tv ON tv.profile_id = p.id AND tv.venture_id = $1
// WHERE p.venture_id = $1
//   AND (tv.value->>'ltv')::numeric >= $2
//   AND (
//     tv.value->>'country' = ANY($3)
//     OR tv.value->>'plan_tier' = $4
//   )

console.log(params);
// ['venture-123', 500, ['US', 'CA'], 'enterprise']
```

---

## Performance Considerations

### Computation Strategies

| Dataset Size | Strategy | Expected Time |
|-------------|----------|---------------|
| < 10K profiles | Direct query, full computation | < 1s |
| 10K - 100K profiles | Batched computation with cursor pagination | 1-10s |
| 100K - 1M profiles | Materialized view refresh + incremental updates | 10-60s |
| > 1M profiles | Sampling for estimates, partitioned computation | 60s+ |

### Indexing Strategy

The module relies heavily on PostgreSQL indexes for performance:

- **Trait value lookups:** GIN indexes on JSONB trait columns for containment and key-value queries.
- **Membership lookups:** Composite indexes on `(segment_id, profile_id)` and `(profile_id, segment_id)` for bidirectional queries.
- **Analytics time-series:** B-tree index on `(segment_id, snapshot_date)` for range scans.
- **Partial indexes:** Filtered indexes on active memberships (`WHERE exited_at IS NULL`) to avoid scanning historical data.

### Caching

- **Membership cache:** Computed membership sets are cached in the `segment_memberships` table. Real-time evaluation falls back to direct query only when the cache is stale.
- **Estimate cache:** Estimation results are cached for 5 minutes (keyed by rule group hash) to avoid redundant EXPLAIN queries during UI editing.
- **Segment metadata:** Active segment definitions are cached in-memory with a 60-second TTL, refreshed on mutation.

---

## Migration Notes

### Initial Migration

```sql
-- 001_create_cdp_segments.sql

-- Enums
CREATE TYPE segment_type AS ENUM ('dynamic', 'static', 'computed', 'predictive');
CREATE TYPE segment_status AS ENUM ('draft', 'active', 'paused', 'computing', 'error', 'archived');
CREATE TYPE computation_mode AS ENUM ('realtime', 'streaming', 'scheduled', 'manual');
CREATE TYPE segment_sync_job_status AS ENUM ('pending', 'running', 'completed', 'failed', 'cancelled');

-- Main segments table
CREATE TABLE cdp_segments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  venture_id UUID REFERENCES ventures(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  description TEXT,
  type segment_type NOT NULL DEFAULT 'dynamic',
  status segment_status NOT NULL DEFAULT 'draft',
  root_rule_group JSONB,
  computation_mode computation_mode NOT NULL DEFAULT 'scheduled',
  schedule JSONB,
  member_count INTEGER NOT NULL DEFAULT 0,
  last_computed_at TIMESTAMPTZ,
  computation_cost INTEGER NOT NULL DEFAULT 0,
  tags JSONB NOT NULL DEFAULT '[]'::jsonb,
  archived BOOLEAN NOT NULL DEFAULT false,
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (venture_id, slug)
);

CREATE INDEX idx_cdp_segments_status ON cdp_segments(status);
CREATE INDEX idx_cdp_segments_venture ON cdp_segments(venture_id);
CREATE INDEX idx_cdp_segments_tags ON cdp_segments USING gin(tags);

-- Memberships table
CREATE TABLE cdp_segment_memberships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  segment_id UUID NOT NULL REFERENCES cdp_segments(id) ON DELETE CASCADE,
  profile_id UUID NOT NULL REFERENCES cdp_profiles(id) ON DELETE CASCADE,
  venture_id UUID NOT NULL REFERENCES ventures(id) ON DELETE CASCADE,
  source TEXT NOT NULL DEFAULT 'computed',
  entered_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_confirmed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  exited_at TIMESTAMPTZ
);

CREATE UNIQUE INDEX idx_cdp_memberships_active
  ON cdp_segment_memberships(segment_id, profile_id)
  WHERE exited_at IS NULL;
CREATE INDEX idx_cdp_memberships_profile ON cdp_segment_memberships(profile_id, segment_id);
CREATE INDEX idx_cdp_memberships_venture ON cdp_segment_memberships(venture_id);
CREATE INDEX idx_cdp_memberships_exited ON cdp_segment_memberships(segment_id, exited_at)
  WHERE exited_at IS NOT NULL;

-- Enable RLS
ALTER TABLE cdp_segments ENABLE ROW LEVEL SECURITY;
ALTER TABLE cdp_segment_memberships ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY segments_venture_read ON cdp_segments
  FOR SELECT USING (
    venture_id = current_setting('app.current_venture_id')::uuid
    OR venture_id IS NULL
  );

CREATE POLICY segments_venture_write ON cdp_segments
  FOR ALL USING (
    venture_id = current_setting('app.current_venture_id')::uuid
  );

CREATE POLICY memberships_venture ON cdp_segment_memberships
  FOR ALL USING (
    venture_id = current_setting('app.current_venture_id')::uuid
  );
```

---

## Related Modules

| Module | Relationship |
|--------|-------------|
| [`@mcv/cdp/profiles`](../profiles/MODULE.md) | Source of core profile data for rule evaluation. |
| [`@mcv/cdp/traits`](../traits/MODULE.md) | Source of trait definitions and values — the primary data rules operate on. |
| [`@mcv/cdp/sync`](../sync/MODULE.md) | Destination for pushing computed segment membership to external platforms. |
| [`@mcv/cdp/events`](../events/MODULE.md) | Event data can be aggregated and used as rule fields (e.g., "event_count:purchase >= 5"). |
| [`@mcv/cdp/identity`](../identity/MODULE.md) | Identity resolution ensures segments operate on deduplicated, merged profiles. |
