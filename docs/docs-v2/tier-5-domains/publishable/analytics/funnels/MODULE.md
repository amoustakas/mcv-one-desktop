# @mcv/analytics/funnels

> **Tier 5 — Domain Module (Publishable)**
> Conversion funnel analysis: define multi-step funnels, measure drop-off, optimize conversion paths.

---

## Purpose

The `@mcv/analytics/funnels` module provides a complete conversion funnel analysis system built on top of CDP (Customer Data Platform) events. It enables product teams, marketers, and growth engineers to define multi-step conversion paths, measure where users drop off, understand time-to-convert distributions, compare funnel performance across segments, and optimize conversion rates in real time.

Funnels are the backbone of conversion optimization. Without them, teams are flying blind — they know their top-line conversion rate but have no idea *where* users abandon, *why* they leave, or *how long* each step takes. This module solves that by providing:

- **Funnel Builder** — Define ordered sequences of events that constitute a conversion path, with flexible matching rules, property filters, and step-level configuration.
- **Drop-off Analysis** — Granular visibility into where users fall off at each step, with conversion rates, absolute counts, and trend analysis between steps.
- **Time-to-Convert** — Measure how long users take between steps, with percentile distributions (p50, p75, p90, p95, p99) and outlier detection.
- **Funnel Comparison** — Compare the same funnel across different user segments, A/B test variants, time periods, or cohorts to identify what drives conversion.
- **Funnel Templates** — Pre-built funnel definitions for common flows (signup, purchase, onboarding, subscription renewal) that can be customized per tenant.
- **Strict vs Loose Ordering** — Support for both strict sequential ordering (step 1 → step 2 → step 3) and loose any-order completion where all steps must occur but sequence doesn't matter.
- **Exclusion Events** — Define events that disqualify a user from the funnel entirely (e.g., a refund event invalidates a purchase funnel completion).
- **Real-time Funnels** — Live funnel metrics powered by streaming event ingestion for active campaigns, product launches, and time-sensitive optimization.

---

## Exports

```typescript
// === Core Service ===
export { FunnelService }                    from './services/funnel.service';
export { FunnelBuilder }                    from './services/funnel-builder.service';
export { FunnelEngine }                     from './services/funnel-engine.service';
export { FunnelTemplateService }            from './services/funnel-template.service';
export { FunnelRealtimeService }            from './services/funnel-realtime.service';
export { FunnelComparisonService }          from './services/funnel-comparison.service';

// === tRPC Router ===
export { funnelRouter }                     from './router';
export type { FunnelRouter }                from './router';

// === Core Types ===
export type { Funnel }                      from './types/funnel';
export type { FunnelStep }                  from './types/funnel-step';
export type { FunnelResult }                from './types/funnel-result';
export type { FunnelStepResult }            from './types/funnel-step-result';
export type { DropOffAnalysis }             from './types/drop-off-analysis';
export type { TimeToConvert }               from './types/time-to-convert';
export type { FunnelComparison }            from './types/funnel-comparison';
export type { FunnelTemplate }              from './types/funnel-template';
export type { FunnelConfig }                from './types/funnel-config';
export type { StepFilter }                  from './types/step-filter';
export type { ExclusionRule }               from './types/exclusion-rule';
export type { FunnelSegment }               from './types/funnel-segment';

// === Enums ===
export { FunnelOrderingMode }               from './types/enums';
export { FunnelStatus }                     from './types/enums';
export { StepMatchMode }                    from './types/enums';
export { FunnelTemplateCategory }           from './types/enums';
export { FunnelErrorCode }                  from './types/enums';
export { ExclusionBehavior }                from './types/enums';

// === Schemas (Zod) ===
export { createFunnelSchema }               from './schemas/create-funnel.schema';
export { updateFunnelSchema }               from './schemas/update-funnel.schema';
export { funnelQuerySchema }                from './schemas/funnel-query.schema';
export { funnelStepSchema }                 from './schemas/funnel-step.schema';
export { funnelComparisonSchema }           from './schemas/funnel-comparison.schema';
export { funnelTemplateSchema }             from './schemas/funnel-template.schema';

// === Utilities ===
export { calculateConversionRate }          from './utils/conversion';
export { calculateDropOff }                 from './utils/drop-off';
export { computeTimePercentiles }           from './utils/percentiles';
export { validateFunnelSteps }              from './utils/validation';
export { applyExclusionRules }              from './utils/exclusion';
export { mergeFunnelResults }               from './utils/merge';
```

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        @mcv/analytics/funnels                               │
│                                                                             │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │                         tRPC Router Layer                             │  │
│  │                                                                       │  │
│  │  funnel.create  funnel.get  funnel.query  funnel.compare             │  │
│  │  funnel.delete  funnel.update  funnel.realtime  funnel.templates     │  │
│  │  funnel.dropoff  funnel.timeToConvert  funnel.export                 │  │
│  └──────────┬────────────────────┬───────────────────┬──────────────────┘  │
│             │                    │                   │                      │
│  ┌──────────▼──────────┐ ┌──────▼────────┐ ┌───────▼───────────────────┐  │
│  │   FunnelService     │ │ FunnelBuilder │ │ FunnelComparisonService   │  │
│  │                     │ │               │ │                           │  │
│  │ • CRUD operations   │ │ • Step config │ │ • Segment comparison      │  │
│  │ • Query execution   │ │ • Validation  │ │ • A/B test analysis       │  │
│  │ • Result caching    │ │ • Templates   │ │ • Time-period comparison  │  │
│  │ • Access control    │ │ • Cloning     │ │ • Statistical significance│  │
│  └──────────┬──────────┘ └──────┬────────┘ └───────┬───────────────────┘  │
│             │                    │                   │                      │
│  ┌──────────▼────────────────────▼───────────────────▼──────────────────┐  │
│  │                        FunnelEngine                                   │  │
│  │                                                                       │  │
│  │  ┌─────────────────┐  ┌──────────────────┐  ┌────────────────────┐   │  │
│  │  │  Step Matcher    │  │  Ordering Engine  │  │  Exclusion Filter  │  │  │
│  │  │                  │  │                   │  │                    │  │  │
│  │  │  • Event match   │  │  • Strict mode    │  │  • Event-based     │  │  │
│  │  │  • Property      │  │  • Loose mode     │  │  • Time-window     │  │  │
│  │  │    filters       │  │  • Hybrid mode    │  │  • Property-based  │  │  │
│  │  │  • Regex match   │  │  • Window calc    │  │  • Retroactive     │  │  │
│  │  └─────────────────┘  └──────────────────┘  └────────────────────┘   │  │
│  │                                                                       │  │
│  │  ┌─────────────────┐  ┌──────────────────┐  ┌────────────────────┐   │  │
│  │  │  Drop-off Calc  │  │  Time-to-Convert │  │  Result Aggregator │  │  │
│  │  │                  │  │                   │  │                    │  │  │
│  │  │  • Per-step      │  │  • Percentiles    │  │  • Merge results   │  │  │
│  │  │  • Cumulative    │  │  • Distributions  │  │  • Cache strategy  │  │  │
│  │  │  • Trend analysis│  │  • Outlier detect │  │  • Incremental     │  │  │
│  │  └─────────────────┘  └──────────────────┘  └────────────────────┘   │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │                    FunnelRealtimeService                             │    │
│  │                                                                     │    │
│  │  ┌──────────────┐  ┌────────────────┐  ┌──────────────────────┐    │    │
│  │  │ Event Stream  │  │ Live Aggregator│  │ WebSocket Publisher  │    │    │
│  │  │ Subscriber    │  │                │  │                      │    │    │
│  │  │              │  │ • Sliding window│  │ • Per-funnel channels│    │    │
│  │  │ • CDP events │  │ • Micro-batch  │  │ • Throttled updates  │    │    │
│  │  │ • Filtering  │  │ • State machine│  │ • Delta encoding     │    │    │
│  │  └──────────────┘  └────────────────┘  └──────────────────────┘    │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │                     Data Layer (Supabase PostgreSQL)                 │    │
│  │                                                                     │    │
│  │  funnels │ funnel_steps │ funnel_results │ funnel_step_results     │    │
│  │  funnel_exclusions │ funnel_templates │ funnel_comparisons         │    │
│  │  funnel_realtime_state │ funnel_user_progress                      │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │                        External Dependencies                        │    │
│  │                                                                     │    │
│  │  @mcv/analytics/cdp ──── CDP event stream (source events)          │    │
│  │  @mcv/analytics/segments ── User segmentation for comparison       │    │
│  │  @mcv/core/auth ──────── Tenant isolation & access control         │    │
│  │  @mcv/core/cache ─────── Result caching (Redis)                    │    │
│  │  @mcv/core/pubsub ────── Real-time event distribution              │    │
│  │  @mcv/core/jobs ──────── Background funnel computation             │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Data Flow

```
CDP Event Ingestion                          Funnel Query
       │                                          │
       ▼                                          ▼
┌──────────────┐                         ┌─────────────────┐
│ Event Stream │                         │  FunnelService   │
│ (Realtime)   │                         │  .query()        │
└──────┬───────┘                         └────────┬────────┘
       │                                          │
       ▼                                          ▼
┌──────────────┐                         ┌─────────────────┐
│ Realtime     │                         │  FunnelEngine    │
│ Service      │──── writes ────────────▶│  .execute()      │
│ (streaming)  │                         └────────┬────────┘
└──────┬───────┘                                  │
       │                                          ├──── Step Matching
       │                                          ├──── Ordering Validation
       ▼                                          ├──── Exclusion Filtering
┌──────────────┐                                  ├──── Drop-off Calculation
│ WebSocket    │                                  ├──── Time-to-Convert
│ Publisher    │                                  │
│ (live UI)    │                         ┌────────▼────────┐
└──────────────┘                         │  FunnelResult    │
                                         │  (aggregated)    │
                                         └────────┬────────┘
                                                  │
                                                  ▼
                                         ┌─────────────────┐
                                         │  Cache + Store   │
                                         │  (Redis + PG)    │
                                         └─────────────────┘
```

---

## Core Interfaces

### Enums

```typescript
/**
 * Determines how funnel steps are ordered during evaluation.
 */
export enum FunnelOrderingMode {
  /** Steps must occur in exact sequential order */
  STRICT = 'strict',
  /** All steps must complete, but in any order */
  LOOSE = 'loose',
  /** First N steps strict, remaining loose (hybrid) */
  HYBRID = 'hybrid',
}

/**
 * Lifecycle status of a funnel definition.
 */
export enum FunnelStatus {
  /** Funnel is being configured, not yet active */
  DRAFT = 'draft',
  /** Funnel is actively collecting and analyzing data */
  ACTIVE = 'active',
  /** Funnel is paused — no new data collection */
  PAUSED = 'paused',
  /** Funnel is archived — read-only historical access */
  ARCHIVED = 'archived',
}

/**
 * How a funnel step matches against incoming CDP events.
 */
export enum StepMatchMode {
  /** Exact event name match */
  EXACT = 'exact',
  /** Event name matches a regex pattern */
  REGEX = 'regex',
  /** Event name starts with the given prefix */
  PREFIX = 'prefix',
  /** Match any event from a predefined group */
  GROUP = 'group',
}

/**
 * Categories for pre-built funnel templates.
 */
export enum FunnelTemplateCategory {
  SIGNUP = 'signup',
  PURCHASE = 'purchase',
  ONBOARDING = 'onboarding',
  SUBSCRIPTION = 'subscription',
  ENGAGEMENT = 'engagement',
  RETENTION = 'retention',
  ACTIVATION = 'activation',
  REFERRAL = 'referral',
}

/**
 * Behavior when an exclusion event is detected.
 */
export enum ExclusionBehavior {
  /** Remove user from funnel entirely — they never entered */
  REMOVE = 'remove',
  /** Mark user as disqualified at their current step */
  DISQUALIFY = 'disqualify',
  /** Reset user back to step 0, allow re-entry */
  RESET = 'reset',
}

/**
 * Error codes specific to the funnels module.
 */
export enum FunnelErrorCode {
  FUNNEL_NOT_FOUND = 'FUNNEL_NOT_FOUND',
  FUNNEL_ALREADY_EXISTS = 'FUNNEL_ALREADY_EXISTS',
  FUNNEL_INVALID_STEPS = 'FUNNEL_INVALID_STEPS',
  FUNNEL_TOO_MANY_STEPS = 'FUNNEL_TOO_MANY_STEPS',
  FUNNEL_STEP_DUPLICATE_EVENT = 'FUNNEL_STEP_DUPLICATE_EVENT',
  FUNNEL_QUERY_TIMEOUT = 'FUNNEL_QUERY_TIMEOUT',
  FUNNEL_QUERY_TOO_BROAD = 'FUNNEL_QUERY_TOO_BROAD',
  FUNNEL_COMPARISON_MISMATCH = 'FUNNEL_COMPARISON_MISMATCH',
  FUNNEL_TEMPLATE_NOT_FOUND = 'FUNNEL_TEMPLATE_NOT_FOUND',
  FUNNEL_TEMPLATE_INVALID = 'FUNNEL_TEMPLATE_INVALID',
  FUNNEL_EXCLUSION_CONFLICT = 'FUNNEL_EXCLUSION_CONFLICT',
  FUNNEL_REALTIME_UNAVAILABLE = 'FUNNEL_REALTIME_UNAVAILABLE',
  FUNNEL_REALTIME_LIMIT_EXCEEDED = 'FUNNEL_REALTIME_LIMIT_EXCEEDED',
  FUNNEL_ACCESS_DENIED = 'FUNNEL_ACCESS_DENIED',
  FUNNEL_TENANT_QUOTA_EXCEEDED = 'FUNNEL_TENANT_QUOTA_EXCEEDED',
  FUNNEL_DATE_RANGE_TOO_LARGE = 'FUNNEL_DATE_RANGE_TOO_LARGE',
  FUNNEL_STEP_FILTER_INVALID = 'FUNNEL_STEP_FILTER_INVALID',
  FUNNEL_COMPUTATION_FAILED = 'FUNNEL_COMPUTATION_FAILED',
}
```

### Funnel

```typescript
/**
 * A conversion funnel definition. Represents a multi-step path that users
 * are expected to follow (e.g., signup → onboarding → first purchase).
 *
 * Funnels are tenant-scoped and can be configured with strict or loose
 * ordering, exclusion rules, and time windows.
 */
export interface Funnel {
  /** Unique funnel identifier (ULID) */
  id: string;

  /** Tenant that owns this funnel */
  tenantId: string;

  /** Human-readable funnel name */
  name: string;

  /** Detailed description of what this funnel measures */
  description: string | null;

  /** Ordered list of steps in the funnel */
  steps: FunnelStep[];

  /** How steps are ordered during evaluation */
  orderingMode: FunnelOrderingMode;

  /** Current lifecycle status */
  status: FunnelStatus;

  /** Events that disqualify users from the funnel */
  exclusionRules: ExclusionRule[];

  /** Configuration overrides */
  config: FunnelConfig;

  /**
   * Maximum time window (in seconds) for a user to complete the entire funnel.
   * null = no time limit.
   */
  conversionWindowSeconds: number | null;

  /**
   * For HYBRID ordering mode: number of initial steps that must be sequential.
   * Remaining steps can occur in any order.
   */
  strictStepCount: number | null;

  /** Tags for organization and filtering */
  tags: string[];

  /** Template this funnel was created from (if any) */
  templateId: string | null;

  /** User who created this funnel */
  createdBy: string;

  /** Timestamps */
  createdAt: Date;
  updatedAt: Date;

  /** Soft delete */
  deletedAt: Date | null;
}
```

### FunnelStep

```typescript
/**
 * A single step in a conversion funnel. Each step corresponds to one or
 * more CDP events that a user must trigger to "complete" this step.
 */
export interface FunnelStep {
  /** Unique step identifier (ULID) */
  id: string;

  /** Parent funnel ID */
  funnelId: string;

  /** Position in the funnel (0-indexed) */
  position: number;

  /** Human-readable step name (e.g., "Added to Cart") */
  name: string;

  /** Optional description */
  description: string | null;

  /** CDP event name to match (e.g., "product_added_to_cart") */
  eventName: string;

  /** How to match the event name */
  matchMode: StepMatchMode;

  /**
   * Additional property filters that must match on the CDP event.
   * All filters are ANDed together.
   */
  filters: StepFilter[];

  /**
   * Maximum time (in seconds) allowed between the previous step and this step.
   * null = no per-step time limit (funnel-level window still applies).
   */
  maxTimeFromPreviousSeconds: number | null;

  /**
   * Whether this step is optional. Users can skip optional steps
   * and still complete the funnel. They are tracked for analysis
   * but don't block progression.
   */
  optional: boolean;

  /** Timestamps */
  createdAt: Date;
  updatedAt: Date;
}

/**
 * A filter condition applied to a funnel step. Filters constrain which
 * CDP events qualify for a step beyond just the event name.
 */
export interface StepFilter {
  /** The event property to filter on (dot-notation supported) */
  property: string;

  /** Comparison operator */
  operator:
    | 'eq'       // equals
    | 'neq'      // not equals
    | 'gt'       // greater than
    | 'gte'      // greater than or equal
    | 'lt'       // less than
    | 'lte'      // less than or equal
    | 'contains' // string contains
    | 'not_contains'
    | 'starts_with'
    | 'ends_with'
    | 'in'       // value in array
    | 'not_in'   // value not in array
    | 'exists'   // property exists
    | 'not_exists'
    | 'regex';   // regex match

  /** Value to compare against (type depends on operator) */
  value: StepFilterValue;
}

export type StepFilterValue =
  | string
  | number
  | boolean
  | string[]
  | number[]
  | null;
```

### ExclusionRule

```typescript
/**
 * Defines an event that disqualifies a user from the funnel.
 * For example, a "refund" event might disqualify a user from
 * a purchase funnel.
 */
export interface ExclusionRule {
  /** Unique rule identifier */
  id: string;

  /** Parent funnel ID */
  funnelId: string;

  /** CDP event name that triggers exclusion */
  eventName: string;

  /** How to match the exclusion event name */
  matchMode: StepMatchMode;

  /** Additional property filters for the exclusion event */
  filters: StepFilter[];

  /** What happens when the exclusion event is detected */
  behavior: ExclusionBehavior;

  /**
   * Time window (in seconds) after funnel entry during which
   * this exclusion rule is active. null = always active.
   */
  activeWindowSeconds: number | null;

  /**
   * Whether to apply retroactively to already-completed funnels.
   * If true, a late exclusion event will invalidate historical completions.
   */
  retroactive: boolean;
}
```

### FunnelResult

```typescript
/**
 * The computed result of running a funnel query. Contains aggregate
 * metrics for the entire funnel and per-step breakdowns.
 */
export interface FunnelResult {
  /** The funnel definition that was queried */
  funnelId: string;

  /** Query parameters that produced this result */
  query: FunnelQuery;

  /** Total unique users who entered the funnel (completed step 0) */
  totalEntered: number;

  /** Total unique users who completed all steps */
  totalConverted: number;

  /** Overall conversion rate (totalConverted / totalEntered) */
  overallConversionRate: number;

  /** Per-step results, ordered by step position */
  stepResults: FunnelStepResult[];

  /** Aggregated drop-off analysis */
  dropOff: DropOffAnalysis;

  /** Time-to-convert distribution for the entire funnel */
  timeToConvert: TimeToConvert;

  /** Users excluded by exclusion rules */
  totalExcluded: number;

  /** Breakdown of exclusions by rule */
  exclusionBreakdown: ExclusionBreakdown[];

  /** When this result was computed */
  computedAt: Date;

  /** How long the computation took (ms) */
  computationTimeMs: number;

  /** Whether this result was served from cache */
  cached: boolean;

  /** Cache key (for invalidation) */
  cacheKey: string | null;
}

/**
 * Result for a single step within the funnel.
 */
export interface FunnelStepResult {
  /** Step definition */
  stepId: string;

  /** Step position (0-indexed) */
  position: number;

  /** Step name */
  name: string;

  /** Unique users who reached this step */
  usersReached: number;

  /** Unique users who completed this step and moved to the next */
  usersCompleted: number;

  /** Users who dropped off at this step (reached but didn't complete) */
  usersDroppedOff: number;

  /** Conversion rate from previous step to this step */
  stepConversionRate: number;

  /** Cumulative conversion rate from funnel entry to this step */
  cumulativeConversionRate: number;

  /** Drop-off rate at this step */
  dropOffRate: number;

  /** Time-to-convert from previous step to this step */
  timeFromPrevious: TimeToConvert;

  /** Median time from funnel entry to this step (seconds) */
  medianTimeFromEntry: number;
}

/**
 * Breakdown of an exclusion rule's impact on funnel results.
 */
export interface ExclusionBreakdown {
  /** Exclusion rule ID */
  ruleId: string;

  /** Exclusion event name */
  eventName: string;

  /** Number of users excluded by this rule */
  usersExcluded: number;

  /** The step most users were at when excluded */
  mostCommonExclusionStep: number;
}
```

### DropOffAnalysis

```typescript
/**
 * Comprehensive drop-off analysis for a funnel. Identifies where users
 * abandon the conversion path and provides actionable insights.
 */
export interface DropOffAnalysis {
  /** Per-step drop-off metrics */
  steps: StepDropOff[];

  /** The step with the highest drop-off rate */
  worstStep: {
    position: number;
    name: string;
    dropOffRate: number;
    usersLost: number;
  };

  /** The step with the lowest drop-off rate (best performing) */
  bestStep: {
    position: number;
    name: string;
    dropOffRate: number;
  };

  /** Total users lost across all steps (entered but didn't convert) */
  totalUsersLost: number;

  /** Distribution of where users drop off (which step, percentage) */
  dropOffDistribution: Array<{
    stepPosition: number;
    stepName: string;
    /** Percentage of total drop-offs that occur at this step */
    percentageOfTotalDropOff: number;
  }>;

  /**
   * Trend comparison: how drop-off has changed compared to
   * the previous equivalent time period.
   */
  trend: DropOffTrend | null;
}

/**
 * Drop-off metrics for a single step.
 */
export interface StepDropOff {
  /** Step position (0-indexed) */
  position: number;

  /** Step name */
  name: string;

  /** Users who reached this step */
  reached: number;

  /** Users who completed this step */
  completed: number;

  /** Users who dropped off at this step */
  droppedOff: number;

  /** Drop-off rate (droppedOff / reached) */
  dropOffRate: number;

  /** Conversion rate to next step (completed / reached) */
  conversionToNext: number;
}

/**
 * Trend data comparing current drop-off to a previous period.
 */
export interface DropOffTrend {
  /** The comparison period */
  comparisonPeriod: {
    start: Date;
    end: Date;
  };

  /** Per-step trend data */
  stepTrends: Array<{
    position: number;
    currentDropOffRate: number;
    previousDropOffRate: number;
    /** Positive = drop-off increased (worse), negative = decreased (better) */
    changePercentagePoints: number;
    direction: 'improved' | 'worsened' | 'stable';
  }>;

  /** Overall conversion rate change */
  overallConversionChange: number;
}
```

### TimeToConvert

```typescript
/**
 * Time-to-convert distribution analysis. Measures how long users take
 * to progress through funnel steps, with percentile breakdowns.
 */
export interface TimeToConvert {
  /** Number of users included in this measurement */
  sampleSize: number;

  /** Mean time in seconds */
  mean: number;

  /** Median time in seconds (same as p50) */
  median: number;

  /** Standard deviation in seconds */
  stdDev: number;

  /** Minimum time in seconds */
  min: number;

  /** Maximum time in seconds */
  max: number;

  /** Percentile distribution */
  percentiles: {
    p10: number;
    p25: number;
    p50: number;
    p75: number;
    p90: number;
    p95: number;
    p99: number;
  };

  /**
   * Histogram buckets for visualization. Each bucket represents
   * a time range and the count of users who fell in that range.
   */
  histogram: Array<{
    /** Lower bound of the bucket (seconds) */
    bucketStart: number;
    /** Upper bound of the bucket (seconds) */
    bucketEnd: number;
    /** Number of users in this bucket */
    count: number;
    /** Percentage of total users in this bucket */
    percentage: number;
  }>;

  /**
   * Detected outliers (users who took unusually long).
   * Defined as values beyond 3 standard deviations from the mean.
   */
  outlierCount: number;

  /** Interquartile range (p75 - p25) */
  iqr: number;
}
```

### FunnelComparison

```typescript
/**
 * Result of comparing a funnel across multiple segments, time periods,
 * or A/B test variants.
 */
export interface FunnelComparison {
  /** Comparison identifier */
  id: string;

  /** The funnel being compared */
  funnelId: string;

  /** Segments or variants being compared */
  segments: FunnelComparisonSegment[];

  /** Statistical significance test results (if applicable) */
  significance: StatisticalSignificance | null;

  /** The winning segment (highest conversion) */
  winner: {
    segmentId: string;
    segmentName: string;
    conversionRate: number;
    confidence: number;
  } | null;

  /** Generated at */
  computedAt: Date;
}

/**
 * A single segment in a funnel comparison.
 */
export interface FunnelComparisonSegment {
  /** Segment identifier */
  segmentId: string;

  /** Human-readable segment name */
  segmentName: string;

  /** Full funnel result for this segment */
  result: FunnelResult;

  /** Per-step conversion rates for easy comparison */
  stepConversionRates: number[];

  /** Overall conversion rate */
  overallConversionRate: number;

  /** Sample size (total users who entered) */
  sampleSize: number;
}

/**
 * Statistical significance analysis for funnel comparison.
 */
export interface StatisticalSignificance {
  /** Test method used (chi-square, z-test, etc.) */
  method: 'chi_square' | 'z_test' | 'bayesian';

  /** p-value (for frequentist tests) */
  pValue: number | null;

  /** Whether the result is statistically significant at the configured level */
  isSignificant: boolean;

  /** Confidence level (e.g., 0.95 for 95%) */
  confidenceLevel: number;

  /** Effect size (Cohen's h or similar) */
  effectSize: number;

  /** Minimum sample size needed for significance (if not yet significant) */
  minimumSampleNeeded: number | null;

  /** Bayesian probability of each segment being the best */
  bayesianProbabilities: Record<string, number> | null;
}
```

### FunnelConfig

```typescript
/**
 * Configuration overrides for funnel behavior.
 */
export interface FunnelConfig {
  /**
   * How to identify users across events. Defaults to user_id from CDP.
   * Can be overridden to use anonymous_id, device_id, etc.
   */
  identityProperty: string;

  /**
   * Whether to count unique users or total events.
   * 'unique' = each user counted once per step.
   * 'totals' = count all matching events.
   */
  countingMode: 'unique' | 'totals';

  /**
   * Whether to allow re-entry: can a user who completed the funnel
   * be counted again in a subsequent pass through the same funnel?
   */
  allowReentry: boolean;

  /**
   * Number of seconds to cache funnel results. 0 = no caching.
   */
  cacheTtlSeconds: number;

  /**
   * Maximum number of users to process in a single funnel query.
   * Prevents runaway queries on large datasets.
   */
  maxUsersPerQuery: number;

  /**
   * Time zone for date-based bucketing in results.
   */
  timezone: string;

  /**
   * Whether to compute time-to-convert metrics (adds computation cost).
   */
  computeTimeToConvert: boolean;

  /**
   * Whether to compute trend data by comparing to the previous period.
   */
  computeTrends: boolean;

  /**
   * Number of histogram buckets for time-to-convert distribution.
   */
  histogramBuckets: number;

  /**
   * Significance level for statistical tests in comparisons.
   * Default: 0.05 (95% confidence).
   */
  significanceLevel: number;
}

/** Default configuration values */
export const DEFAULT_FUNNEL_CONFIG: FunnelConfig = {
  identityProperty: 'user_id',
  countingMode: 'unique',
  allowReentry: false,
  cacheTtlSeconds: 300,
  maxUsersPerQuery: 1_000_000,
  timezone: 'UTC',
  computeTimeToConvert: true,
  computeTrends: true,
  histogramBuckets: 20,
  significanceLevel: 0.05,
};
```

### FunnelQuery

```typescript
/**
 * Parameters for querying a funnel.
 */
export interface FunnelQuery {
  /** Funnel to query */
  funnelId: string;

  /** Start of the analysis window */
  dateFrom: Date;

  /** End of the analysis window */
  dateTo: Date;

  /**
   * Optional segment filter. Only include users who match
   * this segment definition.
   */
  segmentId: string | null;

  /**
   * Optional property filters applied globally (all steps).
   * These are ANDed with step-level filters.
   */
  globalFilters: StepFilter[];

  /**
   * Breakdown dimension: split results by a user property.
   * For example, breakdown by 'country' or 'plan_type'.
   */
  breakdownProperty: string | null;

  /**
   * Maximum number of breakdown values to return.
   */
  breakdownLimit: number;

  /**
   * Override the funnel's config for this specific query.
   */
  configOverrides: Partial<FunnelConfig>;
}
```

### FunnelTemplate

```typescript
/**
 * A pre-built funnel template that can be cloned and customized.
 * Templates provide starting points for common conversion flows.
 */
export interface FunnelTemplate {
  /** Template identifier */
  id: string;

  /** Template name */
  name: string;

  /** Description of what this template measures */
  description: string;

  /** Template category */
  category: FunnelTemplateCategory;

  /** Pre-configured steps */
  steps: FunnelTemplateStep[];

  /** Pre-configured exclusion rules */
  exclusionRules: Omit<ExclusionRule, 'id' | 'funnelId'>[];

  /** Default configuration */
  defaultConfig: Partial<FunnelConfig>;

  /** Default ordering mode */
  defaultOrderingMode: FunnelOrderingMode;

  /** Default conversion window (seconds) */
  defaultConversionWindowSeconds: number | null;

  /** Tags for discoverability */
  tags: string[];

  /** Whether this is a system template (not deletable) */
  isSystem: boolean;

  /** Usage count across all tenants */
  usageCount: number;

  /** Timestamps */
  createdAt: Date;
  updatedAt: Date;
}

/**
 * A step in a funnel template. Uses placeholder event names
 * that can be mapped to the tenant's actual event names.
 */
export interface FunnelTemplateStep {
  /** Position in the template */
  position: number;

  /** Step name */
  name: string;

  /** Description */
  description: string;

  /** Suggested event name (tenant can override) */
  suggestedEventName: string;

  /** Whether this step is optional */
  optional: boolean;

  /** Suggested filters */
  suggestedFilters: StepFilter[];
}
```

### FunnelService

```typescript
/**
 * Primary service for funnel management and query execution.
 * Handles CRUD operations, query execution, caching, and access control.
 */
export interface FunnelService {
  // === CRUD Operations ===

  /**
   * Create a new funnel definition.
   *
   * @throws {FunnelError} FUNNEL_ALREADY_EXISTS - Name collision within tenant
   * @throws {FunnelError} FUNNEL_INVALID_STEPS - Steps validation failed
   * @throws {FunnelError} FUNNEL_TOO_MANY_STEPS - Exceeded max steps (20)
   * @throws {FunnelError} FUNNEL_TENANT_QUOTA_EXCEEDED - Tenant funnel limit reached
   */
  create(
    tenantId: string,
    input: CreateFunnelInput,
    createdBy: string,
  ): Promise<Funnel>;

  /**
   * Get a funnel by ID.
   *
   * @throws {FunnelError} FUNNEL_NOT_FOUND
   * @throws {FunnelError} FUNNEL_ACCESS_DENIED
   */
  getById(tenantId: string, funnelId: string): Promise<Funnel>;

  /**
   * List funnels for a tenant with optional filtering.
   */
  list(
    tenantId: string,
    options?: ListFunnelsOptions,
  ): Promise<PaginatedResult<Funnel>>;

  /**
   * Update a funnel definition.
   * Updating steps invalidates all cached results.
   *
   * @throws {FunnelError} FUNNEL_NOT_FOUND
   * @throws {FunnelError} FUNNEL_INVALID_STEPS
   */
  update(
    tenantId: string,
    funnelId: string,
    input: UpdateFunnelInput,
  ): Promise<Funnel>;

  /**
   * Soft-delete a funnel.
   *
   * @throws {FunnelError} FUNNEL_NOT_FOUND
   */
  delete(tenantId: string, funnelId: string): Promise<void>;

  // === Query Execution ===

  /**
   * Execute a funnel query and return aggregated results.
   * Results may be served from cache if available and not expired.
   *
   * @throws {FunnelError} FUNNEL_NOT_FOUND
   * @throws {FunnelError} FUNNEL_QUERY_TIMEOUT
   * @throws {FunnelError} FUNNEL_QUERY_TOO_BROAD
   * @throws {FunnelError} FUNNEL_DATE_RANGE_TOO_LARGE
   */
  query(tenantId: string, query: FunnelQuery): Promise<FunnelResult>;

  /**
   * Get drop-off analysis for a funnel in a time period.
   *
   * @throws {FunnelError} FUNNEL_NOT_FOUND
   */
  getDropOffAnalysis(
    tenantId: string,
    funnelId: string,
    dateFrom: Date,
    dateTo: Date,
  ): Promise<DropOffAnalysis>;

  /**
   * Get time-to-convert analysis for a funnel.
   *
   * @throws {FunnelError} FUNNEL_NOT_FOUND
   */
  getTimeToConvert(
    tenantId: string,
    funnelId: string,
    dateFrom: Date,
    dateTo: Date,
  ): Promise<TimeToConvert>;

  /**
   * Compare a funnel across multiple segments.
   *
   * @throws {FunnelError} FUNNEL_NOT_FOUND
   * @throws {FunnelError} FUNNEL_COMPARISON_MISMATCH
   */
  compare(
    tenantId: string,
    funnelId: string,
    segmentIds: string[],
    dateFrom: Date,
    dateTo: Date,
  ): Promise<FunnelComparison>;

  // === Cache Management ===

  /**
   * Invalidate cached results for a funnel.
   */
  invalidateCache(tenantId: string, funnelId: string): Promise<void>;

  /**
   * Invalidate all cached funnel results for a tenant.
   */
  invalidateAllCache(tenantId: string): Promise<void>;

  // === Export ===

  /**
   * Export funnel results as CSV.
   */
  exportCsv(
    tenantId: string,
    funnelId: string,
    query: FunnelQuery,
  ): Promise<ReadableStream<Uint8Array>>;

  /**
   * Export the list of users who dropped off at a specific step.
   */
  exportDropOffUsers(
    tenantId: string,
    funnelId: string,
    stepPosition: number,
    query: FunnelQuery,
  ): Promise<ReadableStream<Uint8Array>>;
}
```

### FunnelEngine

```typescript
/**
 * Core computation engine for funnel analysis. Takes a funnel definition,
 * a set of user events, and produces funnel results.
 *
 * This is the heart of the module — where the actual funnel logic lives.
 */
export interface FunnelEngine {
  /**
   * Execute a funnel against CDP events and produce results.
   *
   * The engine:
   * 1. Fetches relevant CDP events for the time window
   * 2. Groups events by user identity
   * 3. For each user, evaluates step completion (strict/loose/hybrid)
   * 4. Applies exclusion rules
   * 5. Computes per-step metrics (conversion, drop-off, time)
   * 6. Aggregates into FunnelResult
   */
  execute(
    funnel: Funnel,
    query: FunnelQuery,
  ): Promise<FunnelResult>;

  /**
   * Evaluate a single user's journey through the funnel.
   * Returns the furthest step reached and timing data.
   */
  evaluateUserJourney(
    funnel: Funnel,
    userEvents: CdpEvent[],
  ): UserFunnelJourney;

  /**
   * Check if a set of events matches a funnel step.
   */
  matchStep(
    step: FunnelStep,
    event: CdpEvent,
  ): boolean;

  /**
   * Apply exclusion rules to a user's events.
   * Returns true if the user should be excluded.
   */
  checkExclusions(
    rules: ExclusionRule[],
    userEvents: CdpEvent[],
    funnelEntryTime: Date,
  ): ExclusionCheckResult;
}

/**
 * A single user's journey through the funnel.
 */
export interface UserFunnelJourney {
  /** User identifier */
  userId: string;

  /** The furthest step the user reached (0-indexed, -1 if excluded before entry) */
  furthestStep: number;

  /** Whether the user completed all steps */
  completed: boolean;

  /** Whether the user was excluded */
  excluded: boolean;

  /** Which exclusion rule triggered (if excluded) */
  exclusionRuleId: string | null;

  /** Timestamps for each step reached */
  stepTimestamps: Array<{
    stepPosition: number;
    timestamp: Date;
    /** Time in seconds from the previous step */
    timeFromPrevious: number | null;
    /** Time in seconds from funnel entry */
    timeFromEntry: number;
  }>;

  /** Total time from entry to completion (or last step reached) */
  totalTimeSeconds: number;
}

/**
 * Result of checking exclusion rules against a user's events.
 */
export interface ExclusionCheckResult {
  /** Whether the user is excluded */
  excluded: boolean;

  /** The rule that triggered exclusion (if any) */
  triggeredRule: ExclusionRule | null;

  /** The event that matched the exclusion rule (if any) */
  triggeringEvent: CdpEvent | null;

  /** Behavior to apply */
  behavior: ExclusionBehavior | null;
}
```

### FunnelRealtimeService

```typescript
/**
 * Real-time funnel monitoring service. Maintains live funnel state
 * by processing CDP events as they arrive and publishing updates
 * to connected clients.
 */
export interface FunnelRealtimeService {
  /**
   * Start real-time monitoring for a funnel.
   * Subscribes to the CDP event stream and begins maintaining live state.
   *
   * @throws {FunnelError} FUNNEL_REALTIME_LIMIT_EXCEEDED - Too many active real-time funnels
   */
  startMonitoring(
    tenantId: string,
    funnelId: string,
  ): Promise<RealtimeFunnelHandle>;

  /**
   * Stop real-time monitoring for a funnel.
   */
  stopMonitoring(
    tenantId: string,
    funnelId: string,
  ): Promise<void>;

  /**
   * Get current real-time state for a funnel.
   *
   * @throws {FunnelError} FUNNEL_REALTIME_UNAVAILABLE
   */
  getCurrentState(
    tenantId: string,
    funnelId: string,
  ): Promise<RealtimeFunnelState>;

  /**
   * Subscribe to real-time funnel updates.
   * Returns an async iterable that yields state updates.
   */
  subscribe(
    tenantId: string,
    funnelId: string,
  ): AsyncIterable<RealtimeFunnelUpdate>;

  /**
   * Process a batch of incoming CDP events against all active
   * real-time funnels for the tenant.
   */
  processEvents(
    tenantId: string,
    events: CdpEvent[],
  ): Promise<void>;

  /**
   * List all active real-time funnel monitors for a tenant.
   */
  listActive(tenantId: string): Promise<RealtimeFunnelHandle[]>;
}

/**
 * Handle for an active real-time funnel monitor.
 */
export interface RealtimeFunnelHandle {
  funnelId: string;
  tenantId: string;
  startedAt: Date;
  /** Current number of subscribers */
  subscriberCount: number;
  /** Events processed since monitoring started */
  eventsProcessed: number;
  /** Last event processed timestamp */
  lastEventAt: Date | null;
}

/**
 * Live state of a real-time funnel.
 */
export interface RealtimeFunnelState {
  funnelId: string;

  /** Window start (rolling window) */
  windowStart: Date;

  /** Current timestamp */
  currentTime: Date;

  /** Live metrics per step */
  steps: Array<{
    position: number;
    name: string;
    currentUsers: number;
    conversionRate: number;
    dropOffRate: number;
  }>;

  /** Overall live conversion rate */
  liveConversionRate: number;

  /** Users currently in the funnel (entered but not completed/excluded) */
  activeUsers: number;

  /** Total entered in this window */
  totalEntered: number;

  /** Total converted in this window */
  totalConverted: number;

  /** Events per second (rolling average) */
  eventsPerSecond: number;
}

/**
 * An incremental update to real-time funnel state.
 * Uses delta encoding to minimize data transfer.
 */
export interface RealtimeFunnelUpdate {
  funnelId: string;
  timestamp: Date;

  /** Type of update */
  type: 'step_change' | 'conversion' | 'exclusion' | 'snapshot';

  /** For step_change: which step changed */
  stepPosition?: number;

  /** Delta values (added to current state) */
  deltas?: {
    entered?: number;
    converted?: number;
    excluded?: number;
    stepUsers?: Record<number, number>;
  };

  /** Full snapshot (sent periodically to resync) */
  snapshot?: RealtimeFunnelState;
}
```

---

## Database Schema

### Table: `funnels`

The primary funnel definitions table.

```sql
CREATE TABLE funnels (
    id              TEXT PRIMARY KEY DEFAULT generate_ulid(),
    tenant_id       TEXT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    name            TEXT NOT NULL,
    description     TEXT,
    ordering_mode   TEXT NOT NULL DEFAULT 'strict'
                        CHECK (ordering_mode IN ('strict', 'loose', 'hybrid')),
    status          TEXT NOT NULL DEFAULT 'draft'
                        CHECK (status IN ('draft', 'active', 'paused', 'archived')),
    conversion_window_seconds   INTEGER,
    strict_step_count           INTEGER,
    config          JSONB NOT NULL DEFAULT '{}'::jsonb,
    tags            TEXT[] NOT NULL DEFAULT '{}',
    template_id     TEXT REFERENCES funnel_templates(id) ON DELETE SET NULL,
    created_by      TEXT NOT NULL,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at      TIMESTAMPTZ,

    -- Unique name per tenant (among non-deleted funnels)
    CONSTRAINT uq_funnels_tenant_name
        UNIQUE NULLS NOT DISTINCT (tenant_id, name, deleted_at)
);

-- Performance indexes
CREATE INDEX idx_funnels_tenant_id ON funnels(tenant_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_funnels_status ON funnels(tenant_id, status) WHERE deleted_at IS NULL;
CREATE INDEX idx_funnels_tags ON funnels USING gin(tags) WHERE deleted_at IS NULL;
CREATE INDEX idx_funnels_template_id ON funnels(template_id) WHERE template_id IS NOT NULL;
CREATE INDEX idx_funnels_created_at ON funnels(tenant_id, created_at DESC) WHERE deleted_at IS NULL;

-- Updated_at trigger
CREATE TRIGGER trg_funnels_updated_at
    BEFORE UPDATE ON funnels
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Row-level security
ALTER TABLE funnels ENABLE ROW LEVEL SECURITY;

CREATE POLICY funnels_tenant_isolation ON funnels
    USING (tenant_id = current_setting('app.tenant_id', true))
    WITH CHECK (tenant_id = current_setting('app.tenant_id', true));
```

### Table: `funnel_steps`

Individual steps within a funnel.

```sql
CREATE TABLE funnel_steps (
    id              TEXT PRIMARY KEY DEFAULT generate_ulid(),
    funnel_id       TEXT NOT NULL REFERENCES funnels(id) ON DELETE CASCADE,
    position        INTEGER NOT NULL CHECK (position >= 0),
    name            TEXT NOT NULL,
    description     TEXT,
    event_name      TEXT NOT NULL,
    match_mode      TEXT NOT NULL DEFAULT 'exact'
                        CHECK (match_mode IN ('exact', 'regex', 'prefix', 'group')),
    filters         JSONB NOT NULL DEFAULT '[]'::jsonb,
    max_time_from_previous_seconds  INTEGER,
    optional        BOOLEAN NOT NULL DEFAULT false,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),

    -- Unique position per funnel
    CONSTRAINT uq_funnel_steps_position
        UNIQUE (funnel_id, position)
);

-- Performance indexes
CREATE INDEX idx_funnel_steps_funnel_id ON funnel_steps(funnel_id);
CREATE INDEX idx_funnel_steps_event_name ON funnel_steps(event_name);
CREATE INDEX idx_funnel_steps_position ON funnel_steps(funnel_id, position);

-- Updated_at trigger
CREATE TRIGGER trg_funnel_steps_updated_at
    BEFORE UPDATE ON funnel_steps
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- RLS inherits from parent funnel via funnel_id join
ALTER TABLE funnel_steps ENABLE ROW LEVEL SECURITY;

CREATE POLICY funnel_steps_tenant_isolation ON funnel_steps
    USING (
        EXISTS (
            SELECT 1 FROM funnels
            WHERE funnels.id = funnel_steps.funnel_id
            AND funnels.tenant_id = current_setting('app.tenant_id', true)
        )
    );
```

### Table: `funnel_exclusions`

Exclusion rules that disqualify users from funnels.

```sql
CREATE TABLE funnel_exclusions (
    id                      TEXT PRIMARY KEY DEFAULT generate_ulid(),
    funnel_id               TEXT NOT NULL REFERENCES funnels(id) ON DELETE CASCADE,
    event_name              TEXT NOT NULL,
    match_mode              TEXT NOT NULL DEFAULT 'exact'
                                CHECK (match_mode IN ('exact', 'regex', 'prefix', 'group')),
    filters                 JSONB NOT NULL DEFAULT '[]'::jsonb,
    behavior                TEXT NOT NULL DEFAULT 'remove'
                                CHECK (behavior IN ('remove', 'disqualify', 'reset')),
    active_window_seconds   INTEGER,
    retroactive             BOOLEAN NOT NULL DEFAULT false,
    created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at              TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Performance indexes
CREATE INDEX idx_funnel_exclusions_funnel_id ON funnel_exclusions(funnel_id);
CREATE INDEX idx_funnel_exclusions_event_name ON funnel_exclusions(event_name);

-- Updated_at trigger
CREATE TRIGGER trg_funnel_exclusions_updated_at
    BEFORE UPDATE ON funnel_exclusions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- RLS
ALTER TABLE funnel_exclusions ENABLE ROW LEVEL SECURITY;

CREATE POLICY funnel_exclusions_tenant_isolation ON funnel_exclusions
    USING (
        EXISTS (
            SELECT 1 FROM funnels
            WHERE funnels.id = funnel_exclusions.funnel_id
            AND funnels.tenant_id = current_setting('app.tenant_id', true)
        )
    );
```

### Table: `funnel_results`

Cached funnel computation results. Stored to avoid recomputation.

```sql
CREATE TABLE funnel_results (
    id                  TEXT PRIMARY KEY DEFAULT generate_ulid(),
    funnel_id           TEXT NOT NULL REFERENCES funnels(id) ON DELETE CASCADE,
    tenant_id           TEXT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,

    -- Query parameters (for cache key matching)
    query_hash          TEXT NOT NULL,
    date_from           TIMESTAMPTZ NOT NULL,
    date_to             TIMESTAMPTZ NOT NULL,
    segment_id          TEXT,
    global_filters      JSONB NOT NULL DEFAULT '[]'::jsonb,
    breakdown_property  TEXT,
    config_overrides    JSONB NOT NULL DEFAULT '{}'::jsonb,

    -- Aggregated results
    total_entered       INTEGER NOT NULL,
    total_converted     INTEGER NOT NULL,
    total_excluded      INTEGER NOT NULL,
    overall_conversion_rate NUMERIC(10, 6) NOT NULL,
    computation_time_ms INTEGER NOT NULL,

    -- Full result payload (denormalized for fast reads)
    result_payload      JSONB NOT NULL,

    -- Step-level results (also stored in funnel_step_results for querying)
    step_results        JSONB NOT NULL,

    -- Drop-off analysis
    drop_off_analysis   JSONB NOT NULL,

    -- Time-to-convert
    time_to_convert     JSONB NOT NULL,

    -- Exclusion breakdown
    exclusion_breakdown JSONB NOT NULL DEFAULT '[]'::jsonb,

    -- Cache metadata
    cached              BOOLEAN NOT NULL DEFAULT true,
    cache_key           TEXT,
    expires_at          TIMESTAMPTZ,

    -- Timestamps
    computed_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Performance indexes
CREATE INDEX idx_funnel_results_lookup
    ON funnel_results(funnel_id, query_hash)
    WHERE expires_at > now() OR expires_at IS NULL;
CREATE INDEX idx_funnel_results_tenant
    ON funnel_results(tenant_id, computed_at DESC);
CREATE INDEX idx_funnel_results_expiry
    ON funnel_results(expires_at)
    WHERE expires_at IS NOT NULL;
CREATE INDEX idx_funnel_results_funnel_date
    ON funnel_results(funnel_id, date_from, date_to);

-- RLS
ALTER TABLE funnel_results ENABLE ROW LEVEL SECURITY;

CREATE POLICY funnel_results_tenant_isolation ON funnel_results
    USING (tenant_id = current_setting('app.tenant_id', true));

-- Auto-cleanup of expired cache entries
CREATE OR REPLACE FUNCTION cleanup_expired_funnel_results()
RETURNS void AS $$
BEGIN
    DELETE FROM funnel_results
    WHERE expires_at IS NOT NULL
    AND expires_at < now() - INTERVAL '1 hour';
END;
$$ LANGUAGE plpgsql;
```

### Table: `funnel_step_results`

Per-step results within a funnel computation. Normalized for step-level queries.

```sql
CREATE TABLE funnel_step_results (
    id                          TEXT PRIMARY KEY DEFAULT generate_ulid(),
    funnel_result_id            TEXT NOT NULL REFERENCES funnel_results(id) ON DELETE CASCADE,
    funnel_id                   TEXT NOT NULL REFERENCES funnels(id) ON DELETE CASCADE,
    step_id                     TEXT NOT NULL REFERENCES funnel_steps(id) ON DELETE CASCADE,
    position                    INTEGER NOT NULL,
    name                        TEXT NOT NULL,

    -- Metrics
    users_reached               INTEGER NOT NULL,
    users_completed             INTEGER NOT NULL,
    users_dropped_off           INTEGER NOT NULL,
    step_conversion_rate        NUMERIC(10, 6) NOT NULL,
    cumulative_conversion_rate  NUMERIC(10, 6) NOT NULL,
    drop_off_rate               NUMERIC(10, 6) NOT NULL,

    -- Time-to-convert from previous step
    time_from_previous          JSONB NOT NULL DEFAULT '{}'::jsonb,

    -- Median time from entry
    median_time_from_entry      NUMERIC(12, 2),

    -- Timestamps
    created_at                  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Performance indexes
CREATE INDEX idx_funnel_step_results_result_id
    ON funnel_step_results(funnel_result_id);
CREATE INDEX idx_funnel_step_results_funnel_step
    ON funnel_step_results(funnel_id, step_id);
CREATE INDEX idx_funnel_step_results_position
    ON funnel_step_results(funnel_result_id, position);

-- RLS (inherited through funnel_results)
ALTER TABLE funnel_step_results ENABLE ROW LEVEL SECURITY;

CREATE POLICY funnel_step_results_tenant_isolation ON funnel_step_results
    USING (
        EXISTS (
            SELECT 1 FROM funnel_results
            WHERE funnel_results.id = funnel_step_results.funnel_result_id
            AND funnel_results.tenant_id = current_setting('app.tenant_id', true)
        )
    );
```

### Table: `funnel_templates`

Pre-built funnel templates.

```sql
CREATE TABLE funnel_templates (
    id                              TEXT PRIMARY KEY DEFAULT generate_ulid(),
    name                            TEXT NOT NULL UNIQUE,
    description                     TEXT NOT NULL,
    category                        TEXT NOT NULL
                                        CHECK (category IN (
                                            'signup', 'purchase', 'onboarding',
                                            'subscription', 'engagement', 'retention',
                                            'activation', 'referral'
                                        )),
    steps                           JSONB NOT NULL,
    exclusion_rules                 JSONB NOT NULL DEFAULT '[]'::jsonb,
    default_config                  JSONB NOT NULL DEFAULT '{}'::jsonb,
    default_ordering_mode           TEXT NOT NULL DEFAULT 'strict',
    default_conversion_window_seconds INTEGER,
    tags                            TEXT[] NOT NULL DEFAULT '{}',
    is_system                       BOOLEAN NOT NULL DEFAULT false,
    usage_count                     INTEGER NOT NULL DEFAULT 0,
    created_at                      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at                      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Performance indexes
CREATE INDEX idx_funnel_templates_category ON funnel_templates(category);
CREATE INDEX idx_funnel_templates_tags ON funnel_templates USING gin(tags);
CREATE INDEX idx_funnel_templates_system ON funnel_templates(is_system);
CREATE INDEX idx_funnel_templates_usage ON funnel_templates(usage_count DESC);

-- Updated_at trigger
CREATE TRIGGER trg_funnel_templates_updated_at
    BEFORE UPDATE ON funnel_templates
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
```

### Table: `funnel_comparisons`

Stored comparison results between segments.

```sql
CREATE TABLE funnel_comparisons (
    id                  TEXT PRIMARY KEY DEFAULT generate_ulid(),
    funnel_id           TEXT NOT NULL REFERENCES funnels(id) ON DELETE CASCADE,
    tenant_id           TEXT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    name                TEXT,
    segment_ids         TEXT[] NOT NULL,
    date_from           TIMESTAMPTZ NOT NULL,
    date_to             TIMESTAMPTZ NOT NULL,

    -- Comparison results
    segments_payload    JSONB NOT NULL,
    significance        JSONB,
    winner_segment_id   TEXT,
    winner_conversion_rate NUMERIC(10, 6),
    winner_confidence   NUMERIC(10, 6),

    -- Timestamps
    computed_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Performance indexes
CREATE INDEX idx_funnel_comparisons_funnel
    ON funnel_comparisons(funnel_id, computed_at DESC);
CREATE INDEX idx_funnel_comparisons_tenant
    ON funnel_comparisons(tenant_id, computed_at DESC);

-- RLS
ALTER TABLE funnel_comparisons ENABLE ROW LEVEL SECURITY;

CREATE POLICY funnel_comparisons_tenant_isolation ON funnel_comparisons
    USING (tenant_id = current_setting('app.tenant_id', true));
```

### Table: `funnel_realtime_state`

Stores the current state of real-time funnel monitors.

```sql
CREATE TABLE funnel_realtime_state (
    id                  TEXT PRIMARY KEY DEFAULT generate_ulid(),
    funnel_id           TEXT NOT NULL REFERENCES funnels(id) ON DELETE CASCADE,
    tenant_id           TEXT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,

    -- Window
    window_start        TIMESTAMPTZ NOT NULL,
    window_end          TIMESTAMPTZ,

    -- Live metrics
    step_states         JSONB NOT NULL DEFAULT '[]'::jsonb,
    active_users        INTEGER NOT NULL DEFAULT 0,
    total_entered       INTEGER NOT NULL DEFAULT 0,
    total_converted     INTEGER NOT NULL DEFAULT 0,
    total_excluded      INTEGER NOT NULL DEFAULT 0,
    events_processed    BIGINT NOT NULL DEFAULT 0,
    events_per_second   NUMERIC(10, 2) NOT NULL DEFAULT 0,

    -- Monitoring metadata
    started_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    last_event_at       TIMESTAMPTZ,
    subscriber_count    INTEGER NOT NULL DEFAULT 0,

    -- Status
    is_active           BOOLEAN NOT NULL DEFAULT true,

    -- Unique active monitor per funnel
    CONSTRAINT uq_funnel_realtime_active
        UNIQUE (funnel_id, is_active) -- Only one active monitor per funnel
);

-- Performance indexes
CREATE INDEX idx_funnel_realtime_tenant_active
    ON funnel_realtime_state(tenant_id)
    WHERE is_active = true;
CREATE INDEX idx_funnel_realtime_funnel
    ON funnel_realtime_state(funnel_id)
    WHERE is_active = true;

-- RLS
ALTER TABLE funnel_realtime_state ENABLE ROW LEVEL SECURITY;

CREATE POLICY funnel_realtime_tenant_isolation ON funnel_realtime_state
    USING (tenant_id = current_setting('app.tenant_id', true));
```

### Table: `funnel_user_progress`

Tracks individual user progress through funnels (for real-time and incremental computation).

```sql
CREATE TABLE funnel_user_progress (
    id                  TEXT PRIMARY KEY DEFAULT generate_ulid(),
    funnel_id           TEXT NOT NULL REFERENCES funnels(id) ON DELETE CASCADE,
    tenant_id           TEXT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    user_id             TEXT NOT NULL,

    -- Progress state
    current_step        INTEGER NOT NULL DEFAULT 0,
    completed           BOOLEAN NOT NULL DEFAULT false,
    excluded            BOOLEAN NOT NULL DEFAULT false,
    exclusion_rule_id   TEXT,

    -- Step timestamps (JSONB array of {position, timestamp, time_from_previous})
    step_timestamps     JSONB NOT NULL DEFAULT '[]'::jsonb,

    -- Entry and completion times
    entered_at          TIMESTAMPTZ NOT NULL,
    completed_at        TIMESTAMPTZ,
    excluded_at         TIMESTAMPTZ,

    -- Total time
    total_time_seconds  NUMERIC(12, 2),

    -- Timestamps
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now(),

    -- One active progress record per user per funnel
    CONSTRAINT uq_funnel_user_progress
        UNIQUE (funnel_id, user_id)
);

-- Performance indexes — critical for funnel computation
CREATE INDEX idx_fup_funnel_step
    ON funnel_user_progress(funnel_id, current_step)
    WHERE NOT completed AND NOT excluded;
CREATE INDEX idx_fup_funnel_completed
    ON funnel_user_progress(funnel_id)
    WHERE completed = true;
CREATE INDEX idx_fup_funnel_excluded
    ON funnel_user_progress(funnel_id)
    WHERE excluded = true;
CREATE INDEX idx_fup_tenant_user
    ON funnel_user_progress(tenant_id, user_id);
CREATE INDEX idx_fup_entered_at
    ON funnel_user_progress(funnel_id, entered_at);

-- Updated_at trigger
CREATE TRIGGER trg_fup_updated_at
    BEFORE UPDATE ON funnel_user_progress
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- RLS
ALTER TABLE funnel_user_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY fup_tenant_isolation ON funnel_user_progress
    USING (tenant_id = current_setting('app.tenant_id', true));
```

---

## tRPC Router

```typescript
import { z } from 'zod';
import { router, protectedProcedure } from '@mcv/core/trpc';
import { FunnelService } from './services/funnel.service';
import { FunnelComparisonService } from './services/funnel-comparison.service';
import { FunnelRealtimeService } from './services/funnel-realtime.service';
import { FunnelTemplateService } from './services/funnel-template.service';
import {
  createFunnelSchema,
  updateFunnelSchema,
  funnelQuerySchema,
  funnelComparisonSchema,
} from './schemas';

export const funnelRouter = router({
  // === CRUD ===

  create: protectedProcedure
    .input(createFunnelSchema)
    .mutation(async ({ ctx, input }) => {
      return ctx.services.funnel.create(
        ctx.tenantId,
        input,
        ctx.userId,
      );
    }),

  getById: protectedProcedure
    .input(z.object({ funnelId: z.string() }))
    .query(async ({ ctx, input }) => {
      return ctx.services.funnel.getById(ctx.tenantId, input.funnelId);
    }),

  list: protectedProcedure
    .input(
      z.object({
        status: z.enum(['draft', 'active', 'paused', 'archived']).optional(),
        tags: z.array(z.string()).optional(),
        search: z.string().optional(),
        page: z.number().int().min(1).default(1),
        pageSize: z.number().int().min(1).max(100).default(20),
        sortBy: z.enum(['name', 'created_at', 'updated_at']).default('created_at'),
        sortOrder: z.enum(['asc', 'desc']).default('desc'),
      }).optional(),
    )
    .query(async ({ ctx, input }) => {
      return ctx.services.funnel.list(ctx.tenantId, input);
    }),

  update: protectedProcedure
    .input(
      z.object({
        funnelId: z.string(),
        data: updateFunnelSchema,
      }),
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.services.funnel.update(
        ctx.tenantId,
        input.funnelId,
        input.data,
      );
    }),

  delete: protectedProcedure
    .input(z.object({ funnelId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      return ctx.services.funnel.delete(ctx.tenantId, input.funnelId);
    }),

  // === Query Execution ===

  query: protectedProcedure
    .input(funnelQuerySchema)
    .query(async ({ ctx, input }) => {
      return ctx.services.funnel.query(ctx.tenantId, input);
    }),

  dropOff: protectedProcedure
    .input(
      z.object({
        funnelId: z.string(),
        dateFrom: z.coerce.date(),
        dateTo: z.coerce.date(),
      }),
    )
    .query(async ({ ctx, input }) => {
      return ctx.services.funnel.getDropOffAnalysis(
        ctx.tenantId,
        input.funnelId,
        input.dateFrom,
        input.dateTo,
      );
    }),

  timeToConvert: protectedProcedure
    .input(
      z.object({
        funnelId: z.string(),
        dateFrom: z.coerce.date(),
        dateTo: z.coerce.date(),
      }),
    )
    .query(async ({ ctx, input }) => {
      return ctx.services.funnel.getTimeToConvert(
        ctx.tenantId,
        input.funnelId,
        input.dateFrom,
        input.dateTo,
      );
    }),

  // === Comparison ===

  compare: protectedProcedure
    .input(funnelComparisonSchema)
    .query(async ({ ctx, input }) => {
      return ctx.services.funnelComparison.compare(
        ctx.tenantId,
        input.funnelId,
        input.segmentIds,
        input.dateFrom,
        input.dateTo,
      );
    }),

  // === Real-time ===

  realtimeStart: protectedProcedure
    .input(z.object({ funnelId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      return ctx.services.funnelRealtime.startMonitoring(
        ctx.tenantId,
        input.funnelId,
      );
    }),

  realtimeStop: protectedProcedure
    .input(z.object({ funnelId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      return ctx.services.funnelRealtime.stopMonitoring(
        ctx.tenantId,
        input.funnelId,
      );
    }),

  realtimeState: protectedProcedure
    .input(z.object({ funnelId: z.string() }))
    .query(async ({ ctx, input }) => {
      return ctx.services.funnelRealtime.getCurrentState(
        ctx.tenantId,
        input.funnelId,
      );
    }),

  realtimeActive: protectedProcedure
    .query(async ({ ctx }) => {
      return ctx.services.funnelRealtime.listActive(ctx.tenantId);
    }),

  // === Templates ===

  templateList: protectedProcedure
    .input(
      z.object({
        category: z.enum([
          'signup', 'purchase', 'onboarding', 'subscription',
          'engagement', 'retention', 'activation', 'referral',
        ]).optional(),
        search: z.string().optional(),
      }).optional(),
    )
    .query(async ({ ctx, input }) => {
      return ctx.services.funnelTemplate.list(input);
    }),

  templateGet: protectedProcedure
    .input(z.object({ templateId: z.string() }))
    .query(async ({ ctx, input }) => {
      return ctx.services.funnelTemplate.getById(input.templateId);
    }),

  templateInstantiate: protectedProcedure
    .input(
      z.object({
        templateId: z.string(),
        name: z.string().min(1).max(200),
        eventMappings: z.record(z.string(), z.string()).optional(),
        configOverrides: z.record(z.string(), z.unknown()).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.services.funnelTemplate.instantiate(
        ctx.tenantId,
        input.templateId,
        {
          name: input.name,
          eventMappings: input.eventMappings,
          configOverrides: input.configOverrides,
        },
        ctx.userId,
      );
    }),

  // === Cache Management ===

  invalidateCache: protectedProcedure
    .input(z.object({ funnelId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      return ctx.services.funnel.invalidateCache(
        ctx.tenantId,
        input.funnelId,
      );
    }),

  // === Export ===

  exportCsv: protectedProcedure
    .input(funnelQuerySchema)
    .mutation(async ({ ctx, input }) => {
      return ctx.services.funnel.exportCsv(
        ctx.tenantId,
        input.funnelId,
        input,
      );
    }),

  exportDropOffUsers: protectedProcedure
    .input(
      z.object({
        funnelId: z.string(),
        stepPosition: z.number().int().min(0),
        query: funnelQuerySchema,
      }),
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.services.funnel.exportDropOffUsers(
        ctx.tenantId,
        input.funnelId,
        input.stepPosition,
        input.query,
      );
    }),
});

export type FunnelRouter = typeof funnelRouter;
```

---

## Code Examples

### Example 1: Creating a Purchase Funnel

```typescript
import { FunnelService } from '@mcv/analytics/funnels';
import { FunnelOrderingMode } from '@mcv/analytics/funnels';

const funnelService = container.resolve(FunnelService);

// Define a 5-step purchase funnel
const purchaseFunnel = await funnelService.create(
  tenantId,
  {
    name: 'E-Commerce Purchase Flow',
    description: 'Tracks users from product view through purchase completion',
    orderingMode: FunnelOrderingMode.STRICT,
    conversionWindowSeconds: 7 * 24 * 60 * 60, // 7-day window
    steps: [
      {
        name: 'Product Viewed',
        eventName: 'product_viewed',
        matchMode: 'exact',
        filters: [],
        optional: false,
      },
      {
        name: 'Added to Cart',
        eventName: 'product_added_to_cart',
        matchMode: 'exact',
        filters: [],
        optional: false,
      },
      {
        name: 'Checkout Started',
        eventName: 'checkout_started',
        matchMode: 'exact',
        filters: [],
        optional: false,
      },
      {
        name: 'Payment Info Entered',
        eventName: 'payment_info_entered',
        matchMode: 'exact',
        filters: [],
        optional: false,
      },
      {
        name: 'Order Completed',
        eventName: 'order_completed',
        matchMode: 'exact',
        filters: [
          {
            property: 'total',
            operator: 'gt',
            value: 0,
          },
        ],
        optional: false,
      },
    ],
    exclusionRules: [
      {
        eventName: 'order_refunded',
        matchMode: 'exact',
        filters: [],
        behavior: 'disqualify',
        activeWindowSeconds: 30 * 24 * 60 * 60, // 30-day window
        retroactive: true,
      },
    ],
    config: {
      identityProperty: 'user_id',
      countingMode: 'unique',
      allowReentry: true,
      cacheTtlSeconds: 600,
      computeTimeToConvert: true,
      computeTrends: true,
    },
    tags: ['ecommerce', 'purchase', 'revenue'],
  },
  userId,
);

console.log(`Created funnel: ${purchaseFunnel.id}`);
// Created funnel: 01HQXYZ123ABC456DEF789
```

### Example 2: Querying a Funnel and Analyzing Drop-off

```typescript
import { FunnelService } from '@mcv/analytics/funnels';

const funnelService = container.resolve(FunnelService);

// Query the funnel for the last 30 days
const result = await funnelService.query(tenantId, {
  funnelId: 'funnel_01HQXYZ123',
  dateFrom: new Date('2025-01-01'),
  dateTo: new Date('2025-01-31'),
  segmentId: null,
  globalFilters: [],
  breakdownProperty: null,
  breakdownLimit: 10,
  configOverrides: {},
});

// Overall metrics
console.log(`Entered: ${result.totalEntered}`);
console.log(`Converted: ${result.totalConverted}`);
console.log(`Conversion Rate: ${(result.overallConversionRate * 100).toFixed(2)}%`);
console.log(`Excluded: ${result.totalExcluded}`);
console.log(`Computed in: ${result.computationTimeMs}ms`);
// Entered: 45,230
// Converted: 3,617
// Conversion Rate: 8.00%
// Excluded: 142
// Computed in: 1,247ms

// Per-step analysis
for (const step of result.stepResults) {
  console.log(
    `Step ${step.position}: ${step.name} — ` +
    `${step.usersReached} reached, ` +
    `${(step.stepConversionRate * 100).toFixed(1)}% step conv, ` +
    `${(step.cumulativeConversionRate * 100).toFixed(1)}% cumulative, ` +
    `${step.usersDroppedOff} dropped off`
  );
}
// Step 0: Product Viewed — 45,230 reached, 100.0% step conv, 100.0% cumulative, 0 dropped off
// Step 1: Added to Cart — 18,092 reached, 40.0% step conv, 40.0% cumulative, 27,138 dropped off
// Step 2: Checkout Started — 9,046 reached, 50.0% step conv, 20.0% cumulative, 9,046 dropped off
// Step 3: Payment Info Entered — 5,428 reached, 60.0% step conv, 12.0% cumulative, 3,618 dropped off
// Step 4: Order Completed — 3,617 reached, 66.6% step conv, 8.0% cumulative, 1,811 dropped off

// Drop-off analysis
const { dropOff } = result;
console.log(`Worst step: ${dropOff.worstStep.name} (${(dropOff.worstStep.dropOffRate * 100).toFixed(1)}% drop-off)`);
console.log(`Best step: ${dropOff.bestStep.name} (${(dropOff.bestStep.dropOffRate * 100).toFixed(1)}% drop-off)`);
// Worst step: Product Viewed → Added to Cart (60.0% drop-off)
// Best step: Checkout Started → Payment Info Entered (40.0% drop-off)

// Time-to-convert
const { timeToConvert } = result;
console.log(`Median time to purchase: ${timeToConvert.median}s (${(timeToConvert.median / 3600).toFixed(1)}h)`);
console.log(`P90: ${timeToConvert.percentiles.p90}s (${(timeToConvert.percentiles.p90 / 3600).toFixed(1)}h)`);
console.log(`P99: ${timeToConvert.percentiles.p99}s (${(timeToConvert.percentiles.p99 / 86400).toFixed(1)}d)`);
// Median time to purchase: 14400s (4.0h)
// P90: 172800s (48.0h)
// P99: 518400s (6.0d)
```

### Example 3: Funnel Comparison Across Segments

```typescript
import { FunnelComparisonService } from '@mcv/analytics/funnels';

const comparisonService = container.resolve(FunnelComparisonService);

// Compare the purchase funnel across user segments
const comparison = await comparisonService.compare(
  tenantId,
  'funnel_01HQXYZ123',
  [
    'segment_mobile_users',
    'segment_desktop_users',
    'segment_tablet_users',
  ],
  new Date('2025-01-01'),
  new Date('2025-01-31'),
);

// View per-segment results
for (const segment of comparison.segments) {
  console.log(
    `${segment.segmentName}: ` +
    `${(segment.overallConversionRate * 100).toFixed(2)}% conversion ` +
    `(n=${segment.sampleSize})`
  );
  
  // Step-by-step comparison
  segment.stepConversionRates.forEach((rate, i) => {
    console.log(`  Step ${i}: ${(rate * 100).toFixed(1)}%`);
  });
}
// Mobile Users: 6.20% conversion (n=22,615)
//   Step 0: 100.0%
//   Step 1: 35.0%
//   Step 2: 42.0%
//   Step 3: 55.0%
//   Step 4: 62.0%
// Desktop Users: 10.50% conversion (n=18,123)
//   Step 0: 100.0%
//   Step 1: 45.0%
//   Step 2: 55.0%
//   Step 3: 65.0%
//   Step 4: 72.0%
// Tablet Users: 7.80% conversion (n=4,492)
//   Step 0: 100.0%
//   Step 1: 38.0%
//   Step 2: 48.0%
//   Step 3: 58.0%
//   Step 4: 68.0%

// Statistical significance
if (comparison.significance) {
  console.log(`Method: ${comparison.significance.method}`);
  console.log(`p-value: ${comparison.significance.pValue}`);
  console.log(`Significant: ${comparison.significance.isSignificant}`);
  console.log(`Effect size: ${comparison.significance.effectSize}`);
}
// Method: chi_square
// p-value: 0.00001
// Significant: true
// Effect size: 0.142

// Winner
if (comparison.winner) {
  console.log(
    `Winner: ${comparison.winner.segmentName} ` +
    `(${(comparison.winner.conversionRate * 100).toFixed(2)}% at ` +
    `${(comparison.winner.confidence * 100).toFixed(1)}% confidence)`
  );
}
// Winner: Desktop Users (10.50% at 99.9% confidence)
```

### Example 4: Using Funnel Templates

```typescript
import { FunnelTemplateService } from '@mcv/analytics/funnels';

const templateService = container.resolve(FunnelTemplateService);

// List available templates
const templates = await templateService.list({
  category: 'purchase',
});

console.log(`Found ${templates.length} purchase templates:`);
for (const tpl of templates) {
  console.log(`  ${tpl.name}: ${tpl.description} (${tpl.steps.length} steps, used ${tpl.usageCount} times)`);
}
// Found 3 purchase templates:
//   SaaS Purchase Flow: Tracks users from pricing page to subscription (5 steps, used 142 times)
//   E-Commerce Checkout: Standard e-commerce cart-to-purchase flow (4 steps, used 387 times)
//   In-App Purchase: Mobile in-app purchase conversion (3 steps, used 89 times)

// Instantiate a template with custom event mappings
const funnel = await templateService.instantiate(
  tenantId,
  'template_ecommerce_checkout',
  {
    name: 'My Store Checkout Funnel',
    eventMappings: {
      // Map template's suggested events to our actual event names
      'product_viewed': 'item_detail_viewed',
      'added_to_cart': 'cart_item_added',
      'checkout_initiated': 'checkout_started',
      'purchase_completed': 'order_placed',
    },
    configOverrides: {
      conversionWindowSeconds: 3 * 24 * 60 * 60, // 3-day window
      allowReentry: true,
    },
  },
  userId,
);

console.log(`Created funnel from template: ${funnel.id}`);
console.log(`Steps:`);
for (const step of funnel.steps) {
  console.log(`  ${step.position}. ${step.name} → ${step.eventName}`);
}
// Created funnel from template: 01HRABC456DEF789GHI012
// Steps:
//   0. Product Viewed → item_detail_viewed
//   1. Added to Cart → cart_item_added
//   2. Checkout Initiated → checkout_started
//   3. Purchase Completed → order_placed
```

### Example 5: Real-time Funnel Monitoring

```typescript
import { FunnelRealtimeService } from '@mcv/analytics/funnels';

const realtimeService = container.resolve(FunnelRealtimeService);

// Start real-time monitoring for a campaign funnel
const handle = await realtimeService.startMonitoring(
  tenantId,
  'funnel_campaign_launch',
);

console.log(`Monitoring started at ${handle.startedAt}`);
console.log(`Events processed: ${handle.eventsProcessed}`);

// Get current live state
const state = await realtimeService.getCurrentState(
  tenantId,
  'funnel_campaign_launch',
);

console.log(`Live conversion rate: ${(state.liveConversionRate * 100).toFixed(2)}%`);
console.log(`Active users in funnel: ${state.activeUsers}`);
console.log(`Events/sec: ${state.eventsPerSecond}`);
// Live conversion rate: 12.34%
// Active users in funnel: 847
// Events/sec: 23.5

for (const step of state.steps) {
  console.log(
    `  Step ${step.position}: ${step.name} — ` +
    `${step.currentUsers} users, ` +
    `${(step.conversionRate * 100).toFixed(1)}% conv`
  );
}
//   Step 0: Campaign Landing — 2,340 users, 100.0% conv
//   Step 1: CTA Clicked — 1,638 users, 70.0% conv
//   Step 2: Form Started — 982 users, 59.9% conv
//   Step 3: Form Submitted — 491 users, 50.0% conv
//   Step 4: Confirmed — 289 users, 58.9% conv

// Subscribe to live updates (WebSocket-style)
const updates = realtimeService.subscribe(tenantId, 'funnel_campaign_launch');

for await (const update of updates) {
  if (update.type === 'snapshot') {
    // Full state resync
    console.log(`[SNAPSHOT] Conversion: ${(update.snapshot!.liveConversionRate * 100).toFixed(2)}%`);
  } else if (update.type === 'conversion') {
    // A user just completed the funnel
    console.log(`[CONVERSION] +${update.deltas?.converted} new conversion(s)`);
  } else if (update.type === 'step_change') {
    // A user moved to a new step
    console.log(`[STEP] Step ${update.stepPosition} user count changed`);
  }
}

// Stop monitoring when campaign ends
await realtimeService.stopMonitoring(tenantId, 'funnel_campaign_launch');
```

### Example 6: Strict vs Loose Funnel Ordering

```typescript
import { FunnelService, FunnelOrderingMode } from '@mcv/analytics/funnels';

const funnelService = container.resolve(FunnelService);

// STRICT funnel: steps must happen in exact order
const strictFunnel = await funnelService.create(
  tenantId,
  {
    name: 'Onboarding (Strict)',
    description: 'Users must complete onboarding steps in order',
    orderingMode: FunnelOrderingMode.STRICT,
    steps: [
      { name: 'Account Created', eventName: 'account_created', matchMode: 'exact', filters: [], optional: false },
      { name: 'Profile Set Up', eventName: 'profile_completed', matchMode: 'exact', filters: [], optional: false },
      { name: 'First Project', eventName: 'project_created', matchMode: 'exact', filters: [], optional: false },
      { name: 'Team Invited', eventName: 'team_invite_sent', matchMode: 'exact', filters: [], optional: false },
    ],
    exclusionRules: [],
    config: { countingMode: 'unique', allowReentry: false },
    tags: ['onboarding'],
  },
  userId,
);

// LOOSE funnel: all steps must happen, but order doesn't matter
const looseFunnel = await funnelService.create(
  tenantId,
  {
    name: 'Feature Adoption (Loose)',
    description: 'User must try all key features, any order',
    orderingMode: FunnelOrderingMode.LOOSE,
    steps: [
      { name: 'Used Search', eventName: 'feature_search_used', matchMode: 'exact', filters: [], optional: false },
      { name: 'Used Export', eventName: 'feature_export_used', matchMode: 'exact', filters: [], optional: false },
      { name: 'Used Dashboard', eventName: 'feature_dashboard_viewed', matchMode: 'exact', filters: [], optional: false },
      { name: 'Used API', eventName: 'api_key_created', matchMode: 'exact', filters: [], optional: false },
    ],
    exclusionRules: [],
    config: { countingMode: 'unique', allowReentry: false },
    tags: ['feature-adoption'],
  },
  userId,
);

// HYBRID funnel: first 2 steps strict, rest loose
const hybridFunnel = await funnelService.create(
  tenantId,
  {
    name: 'Trial Activation (Hybrid)',
    description: 'Sign up and verify in order, then complete setup tasks in any order',
    orderingMode: FunnelOrderingMode.HYBRID,
    strictStepCount: 2, // First 2 steps must be sequential
    steps: [
      { name: 'Trial Started', eventName: 'trial_started', matchMode: 'exact', filters: [], optional: false },
      { name: 'Email Verified', eventName: 'email_verified', matchMode: 'exact', filters: [], optional: false },
      // These can happen in any order after email verification:
      { name: 'Connected Integration', eventName: 'integration_connected', matchMode: 'exact', filters: [], optional: false },
      { name: 'Imported Data', eventName: 'data_imported', matchMode: 'exact', filters: [], optional: false },
      { name: 'Created Report', eventName: 'report_created', matchMode: 'exact', filters: [], optional: false },
    ],
    exclusionRules: [],
    config: { countingMode: 'unique', allowReentry: false },
    tags: ['trial', 'activation'],
  },
  userId,
);
```

### Example 7: Advanced Step Filters and Exclusion Rules

```typescript
import { FunnelService, FunnelOrderingMode, ExclusionBehavior } from '@mcv/analytics/funnels';

const funnelService = container.resolve(FunnelService);

// Create a funnel with advanced filters
const premiumPurchaseFunnel = await funnelService.create(
  tenantId,
  {
    name: 'Premium Plan Upgrade',
    description: 'Tracks upgrade flow for premium plans only (>$50/mo)',
    orderingMode: FunnelOrderingMode.STRICT,
    conversionWindowSeconds: 14 * 24 * 60 * 60, // 14-day window
    steps: [
      {
        name: 'Viewed Pricing Page',
        eventName: 'page_viewed',
        matchMode: 'exact',
        filters: [
          { property: 'page_path', operator: 'eq', value: '/pricing' },
        ],
        optional: false,
      },
      {
        name: 'Clicked Premium Plan',
        eventName: 'plan_selected',
        matchMode: 'exact',
        filters: [
          { property: 'plan_tier', operator: 'eq', value: 'premium' },
          { property: 'plan_price', operator: 'gt', value: 50 },
        ],
        optional: false,
      },
      {
        name: 'Entered Billing (optional coupon step)',
        eventName: 'coupon_applied',
        matchMode: 'exact',
        filters: [],
        optional: true, // Users can skip coupon and go straight to billing
      },
      {
        name: 'Completed Billing',
        eventName: 'billing_completed',
        matchMode: 'exact',
        filters: [
          { property: 'payment_method', operator: 'in', value: ['credit_card', 'paypal', 'bank_transfer'] },
        ],
        optional: false,
      },
      {
        name: 'Subscription Active',
        eventName: 'subscription_activated',
        matchMode: 'exact',
        filters: [
          { property: 'plan_tier', operator: 'eq', value: 'premium' },
          { property: 'status', operator: 'eq', value: 'active' },
        ],
        optional: false,
      },
    ],
    exclusionRules: [
      {
        // Exclude users who request a refund
        eventName: 'refund_requested',
        matchMode: 'exact',
        filters: [],
        behavior: ExclusionBehavior.DISQUALIFY,
        activeWindowSeconds: 30 * 24 * 60 * 60,
        retroactive: true,
      },
      {
        // Exclude users who downgrade
        eventName: 'plan_downgraded',
        matchMode: 'exact',
        filters: [
          { property: 'from_tier', operator: 'eq', value: 'premium' },
        ],
        behavior: ExclusionBehavior.DISQUALIFY,
        activeWindowSeconds: null, // Always active
        retroactive: false,
      },
      {
        // Reset users who abandon cart (let them restart)
        eventName: 'cart_abandoned',
        matchMode: 'exact',
        filters: [],
        behavior: ExclusionBehavior.RESET,
        activeWindowSeconds: 24 * 60 * 60, // Within 24 hours
        retroactive: false,
      },
    ],
    config: {
      identityProperty: 'user_id',
      countingMode: 'unique',
      allowReentry: true,
      cacheTtlSeconds: 300,
      computeTimeToConvert: true,
      computeTrends: true,
      significanceLevel: 0.05,
    },
    tags: ['premium', 'upgrade', 'revenue', 'subscription'],
  },
  userId,
);
```

### Example 8: Funnel Query with Breakdown

```typescript
import { FunnelService } from '@mcv/analytics/funnels';

const funnelService = container.resolve(FunnelService);

// Query with breakdown by country
const result = await funnelService.query(tenantId, {
  funnelId: 'funnel_01HQXYZ123',
  dateFrom: new Date('2025-01-01'),
  dateTo: new Date('2025-01-31'),
  segmentId: null,
  globalFilters: [
    // Only include users on a paid plan
    { property: 'user.plan', operator: 'neq', value: 'free' },
  ],
  breakdownProperty: 'user.country',
  breakdownLimit: 5, // Top 5 countries
  configOverrides: {
    computeTimeToConvert: true,
    cacheTtlSeconds: 600,
  },
});

// Access step-level time distribution
for (const step of result.stepResults) {
  if (step.position > 0) {
    const ttc = step.timeFromPrevious;
    console.log(
      `${step.name}: ` +
      `median ${ttc.median}s, ` +
      `p90 ${ttc.percentiles.p90}s, ` +
      `IQR ${ttc.iqr}s`
    );
  }
}
// Added to Cart: median 120s, p90 900s, IQR 300s
// Checkout Started: median 60s, p90 300s, IQR 120s
// Payment Info Entered: median 180s, p90 600s, IQR 240s
// Order Completed: median 45s, p90 120s, IQR 60s

// Histogram visualization data
const lastStep = result.stepResults[result.stepResults.length - 1];
for (const bucket of lastStep.timeFromPrevious.histogram) {
  const bar = '█'.repeat(Math.round(bucket.percentage));
  console.log(
    `${bucket.bucketStart}-${bucket.bucketEnd}s: ${bar} ${bucket.percentage.toFixed(1)}%`
  );
}
// 0-15s: ████████████████████ 20.3%
// 15-30s: ██████████████████████████ 26.1%
// 30-60s: ██████████████████ 18.5%
// 60-120s: ████████████ 12.2%
// 120-300s: ████████ 8.4%
// 300-600s: █████ 5.1%
// 600+s: █████████ 9.4%
```

---

## Error Codes

| Code | HTTP | Description | Resolution |
|------|------|-------------|------------|
| `FUNNEL_NOT_FOUND` | 404 | The specified funnel does not exist or has been deleted. | Verify the funnel ID. Check that the funnel belongs to the current tenant. |
| `FUNNEL_ALREADY_EXISTS` | 409 | A funnel with this name already exists for the tenant. | Choose a different name or update the existing funnel. |
| `FUNNEL_INVALID_STEPS` | 400 | The funnel step configuration is invalid. Steps may have missing event names, invalid filters, or other validation errors. | Review the step definitions. Ensure all required fields are present and filter operators are valid. |
| `FUNNEL_TOO_MANY_STEPS` | 400 | The funnel exceeds the maximum allowed step count (20 steps). | Reduce the number of steps. Consider combining related events into a single step or splitting into multiple funnels. |
| `FUNNEL_STEP_DUPLICATE_EVENT` | 400 | Two or more steps reference the same event name without distinguishing filters. In strict mode, this creates ambiguity. | Add distinguishing filters to the duplicate steps, or combine them into a single step. |
| `FUNNEL_QUERY_TIMEOUT` | 408 | The funnel query exceeded the maximum execution time. | Narrow the date range, add segment filters, or reduce the `maxUsersPerQuery` config. Consider pre-computing results for large datasets. |
| `FUNNEL_QUERY_TOO_BROAD` | 400 | The query matches too many users and would consume excessive resources. | Add segment filters, reduce the date range, or increase `maxUsersPerQuery` in config (requires admin). |
| `FUNNEL_COMPARISON_MISMATCH` | 400 | The comparison segments are incompatible (e.g., overlapping segments, or segments that don't exist). | Ensure all segment IDs are valid, non-overlapping, and accessible to the current tenant. |
| `FUNNEL_TEMPLATE_NOT_FOUND` | 404 | The specified funnel template does not exist. | List available templates to find the correct ID. |
| `FUNNEL_TEMPLATE_INVALID` | 400 | The template configuration is invalid or its event mappings are incomplete. | Ensure all required event mappings are provided when instantiating the template. |
| `FUNNEL_EXCLUSION_CONFLICT` | 400 | Two exclusion rules conflict (e.g., one says REMOVE and another says RESET for the same event). | Review exclusion rules for conflicts. Each event should have at most one exclusion behavior. |
| `FUNNEL_REALTIME_UNAVAILABLE` | 503 | Real-time monitoring is not active for this funnel. | Start real-time monitoring first with `realtimeStart`, or query historical data instead. |
| `FUNNEL_REALTIME_LIMIT_EXCEEDED` | 429 | The tenant has exceeded the maximum number of concurrent real-time funnel monitors. | Stop monitoring on unused funnels before starting new ones. Default limit: 5 per tenant. |
| `FUNNEL_ACCESS_DENIED` | 403 | The current user does not have permission to access this funnel. | Verify the user has the appropriate role. Funnel access requires `analytics:funnels:read` or `analytics:funnels:write` permissions. |
| `FUNNEL_TENANT_QUOTA_EXCEEDED` | 429 | The tenant has reached the maximum number of funnel definitions. | Delete or archive unused funnels. Contact support to increase the quota. Default: 50 funnels per tenant. |
| `FUNNEL_DATE_RANGE_TOO_LARGE` | 400 | The query date range exceeds the maximum allowed (default: 365 days). | Reduce the date range. For longer analyses, break into multiple queries. |
| `FUNNEL_STEP_FILTER_INVALID` | 400 | A step filter has an invalid operator, property path, or value type. | Review the filter definition. Ensure the operator is supported for the value type and the property path uses valid dot-notation. |
| `FUNNEL_COMPUTATION_FAILED` | 500 | An unexpected error occurred during funnel computation. | Retry the query. If the error persists, check the logs for details and contact support. |

### Error Response Format

```typescript
import { TRPCError } from '@trpc/server';
import { FunnelErrorCode } from '@mcv/analytics/funnels';

/**
 * Custom error class for funnel-specific errors.
 */
export class FunnelError extends TRPCError {
  public readonly funnelErrorCode: FunnelErrorCode;
  public readonly details: Record<string, unknown>;

  constructor(opts: {
    code: FunnelErrorCode;
    message: string;
    details?: Record<string, unknown>;
    cause?: Error;
  }) {
    const httpCode = FUNNEL_ERROR_HTTP_MAP[opts.code] ?? 'INTERNAL_SERVER_ERROR';

    super({
      code: httpCode,
      message: `[${opts.code}] ${opts.message}`,
      cause: opts.cause,
    });

    this.funnelErrorCode = opts.code;
    this.details = opts.details ?? {};
  }
}

/** Mapping from funnel error codes to tRPC HTTP codes */
const FUNNEL_ERROR_HTTP_MAP: Record<FunnelErrorCode, string> = {
  [FunnelErrorCode.FUNNEL_NOT_FOUND]: 'NOT_FOUND',
  [FunnelErrorCode.FUNNEL_ALREADY_EXISTS]: 'CONFLICT',
  [FunnelErrorCode.FUNNEL_INVALID_STEPS]: 'BAD_REQUEST',
  [FunnelErrorCode.FUNNEL_TOO_MANY_STEPS]: 'BAD_REQUEST',
  [FunnelErrorCode.FUNNEL_STEP_DUPLICATE_EVENT]: 'BAD_REQUEST',
  [FunnelErrorCode.FUNNEL_QUERY_TIMEOUT]: 'TIMEOUT',
  [FunnelErrorCode.FUNNEL_QUERY_TOO_BROAD]: 'BAD_REQUEST',
  [FunnelErrorCode.FUNNEL_COMPARISON_MISMATCH]: 'BAD_REQUEST',
  [FunnelErrorCode.FUNNEL_TEMPLATE_NOT_FOUND]: 'NOT_FOUND',
  [FunnelErrorCode.FUNNEL_TEMPLATE_INVALID]: 'BAD_REQUEST',
  [FunnelErrorCode.FUNNEL_EXCLUSION_CONFLICT]: 'BAD_REQUEST',
  [FunnelErrorCode.FUNNEL_REALTIME_UNAVAILABLE]: 'PRECONDITION_FAILED',
  [FunnelErrorCode.FUNNEL_REALTIME_LIMIT_EXCEEDED]: 'TOO_MANY_REQUESTS',
  [FunnelErrorCode.FUNNEL_ACCESS_DENIED]: 'FORBIDDEN',
  [FunnelErrorCode.FUNNEL_TENANT_QUOTA_EXCEEDED]: 'TOO_MANY_REQUESTS',
  [FunnelErrorCode.FUNNEL_DATE_RANGE_TOO_LARGE]: 'BAD_REQUEST',
  [FunnelErrorCode.FUNNEL_STEP_FILTER_INVALID]: 'BAD_REQUEST',
  [FunnelErrorCode.FUNNEL_COMPUTATION_FAILED]: 'INTERNAL_SERVER_ERROR',
};

// Usage example
throw new FunnelError({
  code: FunnelErrorCode.FUNNEL_TOO_MANY_STEPS,
  message: `Funnel has ${steps.length} steps, maximum is 20`,
  details: { stepCount: steps.length, maxSteps: 20 },
});
```

---

## Security

### Tenant Isolation

All funnel data is strictly tenant-scoped. PostgreSQL Row-Level Security (RLS) policies enforce isolation at the database level:

```sql
-- Every funnel query automatically filters by tenant
-- The tenant_id is set in the session context by the auth middleware
SET LOCAL app.tenant_id = 'tenant_xyz';

-- RLS policies on all tables ensure:
-- 1. Queries only return rows belonging to the current tenant
-- 2. Inserts/updates can only target the current tenant
-- 3. Cross-tenant access is impossible at the DB layer
```

### Access Control

Funnel operations require specific permissions:

| Permission | Operations |
|------------|-----------|
| `analytics:funnels:read` | Query funnels, view results, list templates |
| `analytics:funnels:write` | Create, update, delete funnels |
| `analytics:funnels:admin` | Manage real-time monitors, export user data, manage templates |
| `analytics:funnels:export` | Export drop-off user lists (PII-sensitive) |

```typescript
// Permission check middleware
const requireFunnelPermission = (permission: string) => {
  return protectedProcedure.use(async ({ ctx, next }) => {
    const hasPermission = await ctx.services.auth.checkPermission(
      ctx.userId,
      ctx.tenantId,
      permission,
    );

    if (!hasPermission) {
      throw new FunnelError({
        code: FunnelErrorCode.FUNNEL_ACCESS_DENIED,
        message: `Missing required permission: ${permission}`,
        details: { requiredPermission: permission },
      });
    }

    return next();
  });
};
```

### Data Privacy

- **User Identity**: Funnel computations reference user IDs from CDP events. The actual user profiles are not stored in funnel tables — only aggregate metrics.
- **Drop-off User Export**: Exporting the list of users who dropped off at a specific step requires the `analytics:funnels:export` permission, as this involves PII.
- **Data Retention**: Funnel results follow the tenant's data retention policy. Results older than the retention period are automatically purged.
- **Audit Logging**: All funnel CRUD operations and sensitive queries are logged to the audit trail.

```typescript
// Audit log integration
await auditLog.record({
  tenantId,
  userId: ctx.userId,
  action: 'funnel.created',
  resourceType: 'funnel',
  resourceId: funnel.id,
  metadata: {
    funnelName: funnel.name,
    stepCount: funnel.steps.length,
    orderingMode: funnel.orderingMode,
  },
});
```

### Rate Limiting

| Operation | Limit | Window |
|-----------|-------|--------|
| `funnel.query` | 60 requests | per minute per tenant |
| `funnel.create` | 10 requests | per minute per tenant |
| `funnel.compare` | 20 requests | per minute per tenant |
| `funnel.realtime.subscribe` | 5 connections | concurrent per tenant |
| `funnel.export` | 5 requests | per hour per tenant |

### Input Validation

All inputs are validated using Zod schemas before processing:

```typescript
export const createFunnelSchema = z.object({
  name: z.string()
    .min(1, 'Funnel name is required')
    .max(200, 'Funnel name must be 200 characters or less')
    .regex(/^[a-zA-Z0-9\s\-_()]+$/, 'Funnel name contains invalid characters'),

  description: z.string().max(2000).nullable().optional(),

  orderingMode: z.nativeEnum(FunnelOrderingMode),

  conversionWindowSeconds: z.number()
    .int()
    .positive()
    .max(365 * 24 * 60 * 60) // Max 1 year
    .nullable()
    .optional(),

  strictStepCount: z.number()
    .int()
    .min(1)
    .max(20)
    .nullable()
    .optional(),

  steps: z.array(funnelStepSchema)
    .min(2, 'Funnel must have at least 2 steps')
    .max(20, 'Funnel cannot exceed 20 steps'),

  exclusionRules: z.array(exclusionRuleSchema).max(10).optional(),

  config: z.object({
    identityProperty: z.string().max(100).optional(),
    countingMode: z.enum(['unique', 'totals']).optional(),
    allowReentry: z.boolean().optional(),
    cacheTtlSeconds: z.number().int().min(0).max(86400).optional(),
    maxUsersPerQuery: z.number().int().min(1000).max(10_000_000).optional(),
    timezone: z.string().max(50).optional(),
    computeTimeToConvert: z.boolean().optional(),
    computeTrends: z.boolean().optional(),
    histogramBuckets: z.number().int().min(5).max(100).optional(),
    significanceLevel: z.number().min(0.001).max(0.5).optional(),
  }).optional(),

  tags: z.array(z.string().max(50)).max(20).optional(),
});

export const funnelStepSchema = z.object({
  name: z.string().min(1).max(200),
  eventName: z.string().min(1).max(200),
  matchMode: z.enum(['exact', 'regex', 'prefix', 'group']).default('exact'),
  filters: z.array(stepFilterSchema).max(10).optional().default([]),
  maxTimeFromPreviousSeconds: z.number().int().positive().nullable().optional(),
  optional: z.boolean().default(false),
});

export const stepFilterSchema = z.object({
  property: z.string().min(1).max(200),
  operator: z.enum([
    'eq', 'neq', 'gt', 'gte', 'lt', 'lte',
    'contains', 'not_contains', 'starts_with', 'ends_with',
    'in', 'not_in', 'exists', 'not_exists', 'regex',
  ]),
  value: z.union([
    z.string(),
    z.number(),
    z.boolean(),
    z.array(z.string()),
    z.array(z.number()),
    z.null(),
  ]),
});
```

---

## Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `FUNNEL_MAX_STEPS` | No | `20` | Maximum number of steps per funnel definition. |
| `FUNNEL_MAX_FUNNELS_PER_TENANT` | No | `50` | Maximum funnel definitions per tenant. |
| `FUNNEL_QUERY_TIMEOUT_MS` | No | `30000` | Maximum query execution time in milliseconds. |
| `FUNNEL_MAX_DATE_RANGE_DAYS` | No | `365` | Maximum allowed date range for funnel queries. |
| `FUNNEL_MAX_USERS_PER_QUERY` | No | `1000000` | Default maximum users processed per query. |
| `FUNNEL_CACHE_TTL_SECONDS` | No | `300` | Default cache TTL for funnel results. |
| `FUNNEL_CACHE_PREFIX` | No | `funnel:` | Redis cache key prefix. |
| `FUNNEL_REALTIME_MAX_PER_TENANT` | No | `5` | Maximum concurrent real-time monitors per tenant. |
| `FUNNEL_REALTIME_WINDOW_SECONDS` | No | `3600` | Default rolling window for real-time funnels. |
| `FUNNEL_REALTIME_PUBLISH_INTERVAL_MS` | No | `1000` | How often to publish real-time updates (ms). |
| `FUNNEL_REALTIME_SNAPSHOT_INTERVAL_MS` | No | `30000` | How often to send full snapshots for resync (ms). |
| `FUNNEL_HISTOGRAM_BUCKETS` | No | `20` | Default number of histogram buckets. |
| `FUNNEL_SIGNIFICANCE_LEVEL` | No | `0.05` | Default statistical significance level (alpha). |
| `FUNNEL_EXPORT_MAX_ROWS` | No | `100000` | Maximum rows in CSV export. |
| `FUNNEL_RATE_LIMIT_QUERY` | No | `60` | Rate limit for query operations per minute per tenant. |
| `FUNNEL_RATE_LIMIT_CREATE` | No | `10` | Rate limit for create operations per minute per tenant. |
| `FUNNEL_RATE_LIMIT_COMPARE` | No | `20` | Rate limit for compare operations per minute per tenant. |
| `FUNNEL_RATE_LIMIT_EXPORT` | No | `5` | Rate limit for export operations per hour per tenant. |
| `FUNNEL_BACKGROUND_COMPUTATION` | No | `true` | Whether to use background jobs for large funnel computations. |
| `FUNNEL_BACKGROUND_THRESHOLD` | No | `100000` | User count threshold above which computation is offloaded to background. |

---

## Dependencies

### Internal Dependencies

| Package | Purpose |
|---------|---------|
| `@mcv/analytics/cdp` | Source of CDP events used for funnel step matching. Provides the event stream subscription for real-time funnels. |
| `@mcv/analytics/segments` | User segment definitions used for funnel comparison. Segments filter which users are included in a funnel query. |
| `@mcv/core/auth` | Authentication and authorization. Provides tenant context, user identity, and permission checking. |
| `@mcv/core/trpc` | tRPC router infrastructure. Provides `router`, `protectedProcedure`, and middleware utilities. |
| `@mcv/core/cache` | Redis-based caching layer. Used for funnel result caching and real-time state management. |
| `@mcv/core/pubsub` | Pub/Sub messaging. Used for distributing real-time funnel updates to WebSocket subscribers. |
| `@mcv/core/jobs` | Background job processing. Used for large funnel computations that exceed the request timeout. |
| `@mcv/core/db` | Supabase PostgreSQL client. Provides query builder and connection management. |
| `@mcv/core/audit` | Audit logging. Records funnel CRUD operations and sensitive data access. |

### External Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| `zod` | `^3.22` | Schema validation for all inputs. |
| `@trpc/server` | `^10.45` | tRPC server for API layer. |
| `@supabase/supabase-js` | `^2.39` | Supabase client for PostgreSQL access. |
| `date-fns` | `^3.3` | Date manipulation for time windows and bucketing. |
| `simple-statistics` | `^7.8` | Statistical functions (percentiles, chi-square, z-test). |
| `ulid` | `^2.3` | ULID generation for entity IDs. |
| `ioredis` | `^5.3` | Redis client for caching and pub/sub. |
| `p-queue` | `^8.0` | Concurrency control for background computation. |

---

## Testing

### Unit Tests

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { FunnelEngine } from '../services/funnel-engine.service';
import { FunnelOrderingMode, StepMatchMode, ExclusionBehavior } from '../types/enums';
import type { Funnel, FunnelStep, CdpEvent } from '../types';

describe('FunnelEngine', () => {
  let engine: FunnelEngine;

  beforeEach(() => {
    engine = new FunnelEngine();
  });

  describe('matchStep', () => {
    it('should match exact event names', () => {
      const step: FunnelStep = {
        id: 'step_1',
        funnelId: 'funnel_1',
        position: 0,
        name: 'Product Viewed',
        description: null,
        eventName: 'product_viewed',
        matchMode: StepMatchMode.EXACT,
        filters: [],
        maxTimeFromPreviousSeconds: null,
        optional: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const event: CdpEvent = {
        id: 'evt_1',
        name: 'product_viewed',
        userId: 'user_1',
        timestamp: new Date(),
        properties: {},
      };

      expect(engine.matchStep(step, event)).toBe(true);
    });

    it('should not match different event names', () => {
      const step = createStep({ eventName: 'product_viewed' });
      const event = createEvent({ name: 'page_viewed' });

      expect(engine.matchStep(step, event)).toBe(false);
    });

    it('should match with regex mode', () => {
      const step = createStep({
        eventName: '^product_.*',
        matchMode: StepMatchMode.REGEX,
      });

      expect(engine.matchStep(step, createEvent({ name: 'product_viewed' }))).toBe(true);
      expect(engine.matchStep(step, createEvent({ name: 'product_added' }))).toBe(true);
      expect(engine.matchStep(step, createEvent({ name: 'cart_updated' }))).toBe(false);
    });

    it('should match with prefix mode', () => {
      const step = createStep({
        eventName: 'checkout_',
        matchMode: StepMatchMode.PREFIX,
      });

      expect(engine.matchStep(step, createEvent({ name: 'checkout_started' }))).toBe(true);
      expect(engine.matchStep(step, createEvent({ name: 'checkout_completed' }))).toBe(true);
      expect(engine.matchStep(step, createEvent({ name: 'cart_checkout' }))).toBe(false);
    });

    it('should apply property filters', () => {
      const step = createStep({
        eventName: 'product_viewed',
        filters: [
          { property: 'category', operator: 'eq', value: 'electronics' },
          { property: 'price', operator: 'gt', value: 100 },
        ],
      });

      // Matches both filters
      expect(engine.matchStep(step, createEvent({
        name: 'product_viewed',
        properties: { category: 'electronics', price: 150 },
      }))).toBe(true);

      // Fails price filter
      expect(engine.matchStep(step, createEvent({
        name: 'product_viewed',
        properties: { category: 'electronics', price: 50 },
      }))).toBe(false);

      // Fails category filter
      expect(engine.matchStep(step, createEvent({
        name: 'product_viewed',
        properties: { category: 'clothing', price: 150 },
      }))).toBe(false);
    });

    it('should support nested property paths (dot-notation)', () => {
      const step = createStep({
        eventName: 'order_completed',
        filters: [
          { property: 'shipping.method', operator: 'eq', value: 'express' },
        ],
      });

      expect(engine.matchStep(step, createEvent({
        name: 'order_completed',
        properties: { shipping: { method: 'express', cost: 15 } },
      }))).toBe(true);

      expect(engine.matchStep(step, createEvent({
        name: 'order_completed',
        properties: { shipping: { method: 'standard', cost: 5 } },
      }))).toBe(false);
    });

    it('should support "in" and "not_in" operators', () => {
      const step = createStep({
        eventName: 'plan_selected',
        filters: [
          { property: 'plan', operator: 'in', value: ['pro', 'enterprise'] },
        ],
      });

      expect(engine.matchStep(step, createEvent({
        name: 'plan_selected',
        properties: { plan: 'pro' },
      }))).toBe(true);

      expect(engine.matchStep(step, createEvent({
        name: 'plan_selected',
        properties: { plan: 'free' },
      }))).toBe(false);
    });
  });

  describe('evaluateUserJourney (strict ordering)', () => {
    const funnel = createFunnel({
      orderingMode: FunnelOrderingMode.STRICT,
      steps: [
        createStep({ position: 0, eventName: 'page_viewed' }),
        createStep({ position: 1, eventName: 'signup_started' }),
        createStep({ position: 2, eventName: 'signup_completed' }),
      ],
    });

    it('should track complete journey', () => {
      const events: CdpEvent[] = [
        createEvent({ name: 'page_viewed', timestamp: new Date('2025-01-01T10:00:00Z') }),
        createEvent({ name: 'signup_started', timestamp: new Date('2025-01-01T10:05:00Z') }),
        createEvent({ name: 'signup_completed', timestamp: new Date('2025-01-01T10:10:00Z') }),
      ];

      const journey = engine.evaluateUserJourney(funnel, events);

      expect(journey.completed).toBe(true);
      expect(journey.furthestStep).toBe(2);
      expect(journey.totalTimeSeconds).toBe(600); // 10 minutes
      expect(journey.stepTimestamps).toHaveLength(3);
    });

    it('should handle partial journey (drop-off at step 1)', () => {
      const events: CdpEvent[] = [
        createEvent({ name: 'page_viewed', timestamp: new Date('2025-01-01T10:00:00Z') }),
        // User never starts signup
      ];

      const journey = engine.evaluateUserJourney(funnel, events);

      expect(journey.completed).toBe(false);
      expect(journey.furthestStep).toBe(0);
      expect(journey.stepTimestamps).toHaveLength(1);
    });

    it('should enforce strict ordering', () => {
      const events: CdpEvent[] = [
        // Events out of order — step 2 before step 1
        createEvent({ name: 'page_viewed', timestamp: new Date('2025-01-01T10:00:00Z') }),
        createEvent({ name: 'signup_completed', timestamp: new Date('2025-01-01T10:05:00Z') }),
        createEvent({ name: 'signup_started', timestamp: new Date('2025-01-01T10:10:00Z') }),
      ];

      const journey = engine.evaluateUserJourney(funnel, events);

      // In strict mode, signup_completed before signup_started doesn't count
      // User reaches step 1 (signup_started at 10:10) but never gets step 2
      // because signup_completed happened before signup_started
      expect(journey.completed).toBe(false);
      expect(journey.furthestStep).toBe(1);
    });

    it('should respect per-step time limits', () => {
      const timedFunnel = createFunnel({
        orderingMode: FunnelOrderingMode.STRICT,
        steps: [
          createStep({ position: 0, eventName: 'cart_viewed' }),
          createStep({
            position: 1,
            eventName: 'checkout_started',
            maxTimeFromPreviousSeconds: 300, // 5-minute limit
          }),
          createStep({ position: 2, eventName: 'order_completed' }),
        ],
      });

      // User took 10 minutes between step 0 and step 1 — exceeds limit
      const events: CdpEvent[] = [
        createEvent({ name: 'cart_viewed', timestamp: new Date('2025-01-01T10:00:00Z') }),
        createEvent({ name: 'checkout_started', timestamp: new Date('2025-01-01T10:10:00Z') }),
        createEvent({ name: 'order_completed', timestamp: new Date('2025-01-01T10:15:00Z') }),
      ];

      const journey = engine.evaluateUserJourney(timedFunnel, events);

      expect(journey.completed).toBe(false);
      expect(journey.furthestStep).toBe(0); // Stuck at step 0
    });
  });

  describe('evaluateUserJourney (loose ordering)', () => {
    const funnel = createFunnel({
      orderingMode: FunnelOrderingMode.LOOSE,
      steps: [
        createStep({ position: 0, eventName: 'feature_a_used' }),
        createStep({ position: 1, eventName: 'feature_b_used' }),
        createStep({ position: 2, eventName: 'feature_c_used' }),
      ],
    });

    it('should accept any order', () => {
      const events: CdpEvent[] = [
        createEvent({ name: 'feature_c_used', timestamp: new Date('2025-01-01T10:00:00Z') }),
        createEvent({ name: 'feature_a_used', timestamp: new Date('2025-01-01T11:00:00Z') }),
        createEvent({ name: 'feature_b_used', timestamp: new Date('2025-01-01T12:00:00Z') }),
      ];

      const journey = engine.evaluateUserJourney(funnel, events);

      expect(journey.completed).toBe(true);
      expect(journey.furthestStep).toBe(2);
    });

    it('should handle partial completion in any order', () => {
      const events: CdpEvent[] = [
        createEvent({ name: 'feature_c_used', timestamp: new Date('2025-01-01T10:00:00Z') }),
        createEvent({ name: 'feature_a_used', timestamp: new Date('2025-01-01T11:00:00Z') }),
        // feature_b_used never happens
      ];

      const journey = engine.evaluateUserJourney(funnel, events);

      expect(journey.completed).toBe(false);
      // In loose mode, furthestStep reflects count of completed steps minus 1
      expect(journey.furthestStep).toBe(1); // 2 out of 3 completed
    });
  });

  describe('checkExclusions', () => {
    it('should exclude user when exclusion event matches', () => {
      const rules = [
        {
          id: 'rule_1',
          funnelId: 'funnel_1',
          eventName: 'order_refunded',
          matchMode: StepMatchMode.EXACT,
          filters: [],
          behavior: ExclusionBehavior.REMOVE,
          activeWindowSeconds: null,
          retroactive: false,
        },
      ];

      const events: CdpEvent[] = [
        createEvent({ name: 'order_completed', timestamp: new Date('2025-01-01') }),
        createEvent({ name: 'order_refunded', timestamp: new Date('2025-01-05') }),
      ];

      const result = engine.checkExclusions(
        rules,
        events,
        new Date('2025-01-01'),
      );

      expect(result.excluded).toBe(true);
      expect(result.triggeredRule?.id).toBe('rule_1');
      expect(result.behavior).toBe(ExclusionBehavior.REMOVE);
    });

    it('should respect exclusion time windows', () => {
      const rules = [
        {
          id: 'rule_1',
          funnelId: 'funnel_1',
          eventName: 'order_refunded',
          matchMode: StepMatchMode.EXACT,
          filters: [],
          behavior: ExclusionBehavior.DISQUALIFY,
          activeWindowSeconds: 7 * 24 * 60 * 60, // 7 days
          retroactive: false,
        },
      ];

      // Refund happens 30 days after entry — outside the 7-day window
      const events: CdpEvent[] = [
        createEvent({ name: 'order_refunded', timestamp: new Date('2025-01-31') }),
      ];

      const result = engine.checkExclusions(
        rules,
        events,
        new Date('2025-01-01'),
      );

      expect(result.excluded).toBe(false);
    });

    it('should apply property filters to exclusion events', () => {
      const rules = [
        {
          id: 'rule_1',
          funnelId: 'funnel_1',
          eventName: 'plan_changed',
          matchMode: StepMatchMode.EXACT,
          filters: [
            { property: 'new_plan', operator: 'eq' as const, value: 'free' },
          ],
          behavior: ExclusionBehavior.DISQUALIFY,
          activeWindowSeconds: null,
          retroactive: false,
        },
      ];

      // Upgrade to enterprise — should NOT trigger exclusion
      const upgradeEvents: CdpEvent[] = [
        createEvent({
          name: 'plan_changed',
          properties: { new_plan: 'enterprise' },
        }),
      ];

      expect(engine.checkExclusions(rules, upgradeEvents, new Date()).excluded).toBe(false);

      // Downgrade to free — SHOULD trigger exclusion
      const downgradeEvents: CdpEvent[] = [
        createEvent({
          name: 'plan_changed',
          properties: { new_plan: 'free' },
        }),
      ];

      expect(engine.checkExclusions(rules, downgradeEvents, new Date()).excluded).toBe(true);
    });
  });

  describe('conversion rate calculation', () => {
    it('should compute correct overall conversion rate', async () => {
      const funnel = createFunnel({
        orderingMode: FunnelOrderingMode.STRICT,
        steps: [
          createStep({ position: 0, eventName: 'step_a' }),
          createStep({ position: 1, eventName: 'step_b' }),
        ],
      });

      const query = createQuery({ funnelId: funnel.id });

      // Mock: 100 users entered, 25 converted
      const result = await engine.execute(funnel, query);

      expect(result.overallConversionRate).toBeGreaterThanOrEqual(0);
      expect(result.overallConversionRate).toBeLessThanOrEqual(1);
      expect(result.totalConverted).toBeLessThanOrEqual(result.totalEntered);
    });

    it('should handle zero entries gracefully', async () => {
      const funnel = createFunnel({
        steps: [
          createStep({ position: 0, eventName: 'nonexistent_event' }),
          createStep({ position: 1, eventName: 'also_nonexistent' }),
        ],
      });

      const query = createQuery({ funnelId: funnel.id });
      const result = await engine.execute(funnel, query);

      expect(result.totalEntered).toBe(0);
      expect(result.totalConverted).toBe(0);
      expect(result.overallConversionRate).toBe(0);
    });
  });

  describe('optional steps', () => {
    it('should allow skipping optional steps', () => {
      const funnel = createFunnel({
        orderingMode: FunnelOrderingMode.STRICT,
        steps: [
          createStep({ position: 0, eventName: 'step_a', optional: false }),
          createStep({ position: 1, eventName: 'step_b', optional: true }),
          createStep({ position: 2, eventName: 'step_c', optional: false }),
        ],
      });

      // User skips step_b (optional) and goes directly to step_c
      const events: CdpEvent[] = [
        createEvent({ name: 'step_a', timestamp: new Date('2025-01-01T10:00:00Z') }),
        createEvent({ name: 'step_c', timestamp: new Date('2025-01-01T10:05:00Z') }),
      ];

      const journey = engine.evaluateUserJourney(funnel, events);

      expect(journey.completed).toBe(true);
      expect(journey.furthestStep).toBe(2);
    });
  });
});

// === Test Helpers ===

function createStep(overrides: Partial<FunnelStep> = {}): FunnelStep {
  return {
    id: `step_${Math.random().toString(36).slice(2)}`,
    funnelId: 'funnel_test',
    position: 0,
    name: 'Test Step',
    description: null,
    eventName: 'test_event',
    matchMode: StepMatchMode.EXACT,
    filters: [],
    maxTimeFromPreviousSeconds: null,
    optional: false,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

function createFunnel(overrides: Partial<Funnel> = {}): Funnel {
  return {
    id: 'funnel_test',
    tenantId: 'tenant_test',
    name: 'Test Funnel',
    description: null,
    steps: [],
    orderingMode: FunnelOrderingMode.STRICT,
    status: FunnelStatus.ACTIVE,
    exclusionRules: [],
    config: { ...DEFAULT_FUNNEL_CONFIG },
    conversionWindowSeconds: null,
    strictStepCount: null,
    tags: [],
    templateId: null,
    createdBy: 'user_test',
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
    ...overrides,
  };
}

function createEvent(overrides: Partial<CdpEvent> = {}): CdpEvent {
  return {
    id: `evt_${Math.random().toString(36).slice(2)}`,
    name: 'test_event',
    userId: 'user_test',
    timestamp: new Date(),
    properties: {},
    ...overrides,
  };
}

function createQuery(overrides: Partial<FunnelQuery> = {}): FunnelQuery {
  return {
    funnelId: 'funnel_test',
    dateFrom: new Date('2025-01-01'),
    dateTo: new Date('2025-01-31'),
    segmentId: null,
    globalFilters: [],
    breakdownProperty: null,
    breakdownLimit: 10,
    configOverrides: {},
    ...overrides,
  };
}
```

### Integration Tests

```typescript
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createTestContext } from '@mcv/core/testing';
import { FunnelService } from '../services/funnel.service';
import { FunnelOrderingMode, FunnelStatus } from '../types/enums';

describe('FunnelService Integration', () => {
  let ctx: TestContext;
  let funnelService: FunnelService;
  const tenantId = 'tenant_integration_test';
  const userId = 'user_integration_test';

  beforeAll(async () => {
    ctx = await createTestContext({ modules: ['analytics/funnels', 'analytics/cdp'] });
    funnelService = ctx.resolve(FunnelService);

    // Seed CDP events for testing
    await ctx.seedCdpEvents(tenantId, [
      // 100 users: view → add_to_cart → checkout → purchase
      ...generateFunnelEvents(100, ['product_viewed', 'added_to_cart', 'checkout_started', 'order_completed']),
      // 50 users: view → add_to_cart only (drop off at checkout)
      ...generateFunnelEvents(50, ['product_viewed', 'added_to_cart']),
      // 30 users: view only (drop off immediately)
      ...generateFunnelEvents(30, ['product_viewed']),
    ]);
  });

  afterAll(async () => {
    await ctx.cleanup();
  });

  it('should create and query a funnel end-to-end', async () => {
    // Create
    const funnel = await funnelService.create(
      tenantId,
      {
        name: 'Integration Test Funnel',
        orderingMode: FunnelOrderingMode.STRICT,
        steps: [
          { name: 'View', eventName: 'product_viewed', matchMode: 'exact', filters: [], optional: false },
          { name: 'Cart', eventName: 'added_to_cart', matchMode: 'exact', filters: [], optional: false },
          { name: 'Checkout', eventName: 'checkout_started', matchMode: 'exact', filters: [], optional: false },
          { name: 'Purchase', eventName: 'order_completed', matchMode: 'exact', filters: [], optional: false },
        ],
        exclusionRules: [],
        config: {},
        tags: ['integration-test'],
      },
      userId,
    );

    expect(funnel.id).toBeDefined();
    expect(funnel.status).toBe(FunnelStatus.DRAFT);

    // Activate
    const activated = await funnelService.update(tenantId, funnel.id, {
      status: FunnelStatus.ACTIVE,
    });
    expect(activated.status).toBe(FunnelStatus.ACTIVE);

    // Query
    const result = await funnelService.query(tenantId, {
      funnelId: funnel.id,
      dateFrom: new Date('2025-01-01'),
      dateTo: new Date('2025-12-31'),
      segmentId: null,
      globalFilters: [],
      breakdownProperty: null,
      breakdownLimit: 10,
      configOverrides: {},
    });

    // Verify results match seeded data
    expect(result.totalEntered).toBe(180); // 100 + 50 + 30
    expect(result.totalConverted).toBe(100);
    expect(result.overallConversionRate).toBeCloseTo(100 / 180, 4);

    // Verify step results
    expect(result.stepResults).toHaveLength(4);
    expect(result.stepResults[0].usersReached).toBe(180);
    expect(result.stepResults[1].usersReached).toBe(150); // 100 + 50
    expect(result.stepResults[2].usersReached).toBe(100);
    expect(result.stepResults[3].usersReached).toBe(100);

    // Verify drop-off
    expect(result.dropOff.worstStep.position).toBe(0); // Biggest drop: 180→150 = 30 lost
    expect(result.dropOff.totalUsersLost).toBe(80);

    // Cleanup
    await funnelService.delete(tenantId, funnel.id);
  });

  it('should enforce tenant isolation', async () => {
    const funnel = await funnelService.create(
      tenantId,
      {
        name: 'Tenant Isolation Test',
        orderingMode: FunnelOrderingMode.STRICT,
        steps: [
          { name: 'Step 1', eventName: 'event_a', matchMode: 'exact', filters: [], optional: false },
          { name: 'Step 2', eventName: 'event_b', matchMode: 'exact', filters: [], optional: false },
        ],
        exclusionRules: [],
        config: {},
        tags: [],
      },
      userId,
    );

    // Try to access from a different tenant
    await expect(
      funnelService.getById('other_tenant', funnel.id),
    ).rejects.toThrow('FUNNEL_NOT_FOUND');

    // Cleanup
    await funnelService.delete(tenantId, funnel.id);
  });

  it('should respect funnel quotas', async () => {
    // Create funnels up to the limit
    const funnels = [];
    for (let i = 0; i < 50; i++) {
      funnels.push(
        await funnelService.create(
          tenantId,
          {
            name: `Quota Test Funnel ${i}`,
            orderingMode: FunnelOrderingMode.STRICT,
            steps: [
              { name: 'A', eventName: 'evt_a', matchMode: 'exact', filters: [], optional: false },
              { name: 'B', eventName: 'evt_b', matchMode: 'exact', filters: [], optional: false },
            ],
            exclusionRules: [],
            config: {},
            tags: [],
          },
          userId,
        ),
      );
    }

    // 51st funnel should fail
    await expect(
      funnelService.create(
        tenantId,
        {
          name: 'Quota Test Funnel 50',
          orderingMode: FunnelOrderingMode.STRICT,
          steps: [
            { name: 'A', eventName: 'evt_a', matchMode: 'exact', filters: [], optional: false },
            { name: 'B', eventName: 'evt_b', matchMode: 'exact', filters: [], optional: false },
          ],
          exclusionRules: [],
          config: {},
          tags: [],
        },
        userId,
      ),
    ).rejects.toThrow('FUNNEL_TENANT_QUOTA_EXCEEDED');

    // Cleanup
    for (const f of funnels) {
      await funnelService.delete(tenantId, f.id);
    }
  });

  it('should cache and invalidate results', async () => {
    const funnel = await funnelService.create(tenantId, {
      name: 'Cache Test Funnel',
      orderingMode: FunnelOrderingMode.STRICT,
      steps: [
        { name: 'A', eventName: 'product_viewed', matchMode: 'exact', filters: [], optional: false },
        { name: 'B', eventName: 'order_completed', matchMode: 'exact', filters: [], optional: false },
      ],
      exclusionRules: [],
      config: { cacheTtlSeconds: 3600 },
      tags: [],
    }, userId);

    await funnelService.update(tenantId, funnel.id, { status: FunnelStatus.ACTIVE });

    const query = {
      funnelId: funnel.id,
      dateFrom: new Date('2025-01-01'),
      dateTo: new Date('2025-12-31'),
      segmentId: null,
      globalFilters: [],
      breakdownProperty: null,
      breakdownLimit: 10,
      configOverrides: {},
    };

    // First query — computes fresh
    const result1 = await funnelService.query(tenantId, query);
    expect(result1.cached).toBe(false);

    // Second query — served from cache
    const result2 = await funnelService.query(tenantId, query);
    expect(result2.cached).toBe(true);
    expect(result2.computationTimeMs).toBeLessThan(result1.computationTimeMs);

    // Invalidate cache
    await funnelService.invalidateCache(tenantId, funnel.id);

    // Third query — recomputed
    const result3 = await funnelService.query(tenantId, query);
    expect(result3.cached).toBe(false);

    await funnelService.delete(tenantId, funnel.id);
  });
});

// === Integration Test Helpers ===

function generateFunnelEvents(
  userCount: number,
  eventSequence: string[],
): CdpEvent[] {
  const events: CdpEvent[] = [];
  for (let u = 0; u < userCount; u++) {
    const userId = `user_${u}_${Math.random().toString(36).slice(2)}`;
    for (let s = 0; s < eventSequence.length; s++) {
      events.push({
        id: `evt_${Math.random().toString(36).slice(2)}`,
        name: eventSequence[s],
        userId,
        timestamp: new Date(Date.now() - (eventSequence.length - s) * 60000),
        properties: {},
      });
    }
  }
  return events;
}
```

### Testing Strategy

| Test Type | Coverage Target | Focus Areas |
|-----------|----------------|-------------|
| **Unit Tests** | >90% | FunnelEngine (step matching, ordering modes, exclusions, time calculations), utility functions (percentile computation, conversion rate calculation, filter evaluation) |
| **Integration Tests** | >80% | FunnelService CRUD, query execution with real DB, tenant isolation via RLS, caching behavior, quota enforcement |
| **E2E Tests** | Critical paths | Full tRPC flow from client → router → service → DB → response, including auth, validation, and error handling |
| **Performance Tests** | Benchmarks | Query execution time with 100K/500K/1M users, real-time event processing throughput, cache hit/miss latency |
| **Load Tests** | Stress limits | Concurrent funnel queries, real-time subscription capacity, background job queue saturation |

### Performance Benchmarks

```typescript
import { bench, describe } from 'vitest';

describe('FunnelEngine Performance', () => {
  bench('evaluate 10,000 user journeys (strict, 5 steps)', async () => {
    const funnel = createBenchFunnel(5, FunnelOrderingMode.STRICT);
    const userEvents = generateBenchEvents(10_000, 5);

    for (const events of userEvents) {
      engine.evaluateUserJourney(funnel, events);
    }
  });

  bench('evaluate 10,000 user journeys (loose, 5 steps)', async () => {
    const funnel = createBenchFunnel(5, FunnelOrderingMode.LOOSE);
    const userEvents = generateBenchEvents(10_000, 5);

    for (const events of userEvents) {
      engine.evaluateUserJourney(funnel, events);
    }
  });

  bench('compute percentiles for 100,000 time values', () => {
    const times = Array.from({ length: 100_000 }, () => Math.random() * 86400);
    computeTimePercentiles(times);
  });

  bench('apply exclusion rules (10 rules, 50 events per user)', () => {
    const rules = Array.from({ length: 10 }, (_, i) => createExclusionRule(i));
    const events = Array.from({ length: 50 }, () => createEvent());

    engine.checkExclusions(rules, events, new Date());
  });
});

// Expected benchmarks (M1 MacBook Pro):
// evaluate 10,000 journeys (strict): ~45ms
// evaluate 10,000 journeys (loose): ~62ms
// compute percentiles (100K values): ~8ms
// apply exclusion rules: ~0.3ms
```

---

## Appendix: Built-in Funnel Templates

The module ships with these system templates:

### Signup Flow Template

```typescript
{
  name: 'User Signup Flow',
  category: 'signup',
  description: 'Standard user registration funnel from landing to account activation',
  steps: [
    { position: 0, name: 'Landing Page', suggestedEventName: 'page_viewed', suggestedFilters: [{ property: 'page_type', operator: 'eq', value: 'landing' }] },
    { position: 1, name: 'Signup CTA Clicked', suggestedEventName: 'cta_clicked', suggestedFilters: [{ property: 'cta_type', operator: 'eq', value: 'signup' }] },
    { position: 2, name: 'Registration Form Submitted', suggestedEventName: 'form_submitted', suggestedFilters: [{ property: 'form_type', operator: 'eq', value: 'registration' }] },
    { position: 3, name: 'Email Verified', suggestedEventName: 'email_verified', suggestedFilters: [] },
    { position: 4, name: 'Profile Completed', suggestedEventName: 'profile_completed', suggestedFilters: [], optional: true },
  ],
  defaultOrderingMode: 'strict',
  defaultConversionWindowSeconds: 7 * 24 * 60 * 60,
}
```

### E-Commerce Purchase Template

```typescript
{
  name: 'E-Commerce Purchase',
  category: 'purchase',
  description: 'Standard e-commerce flow from product discovery to order completion',
  steps: [
    { position: 0, name: 'Product Viewed', suggestedEventName: 'product_viewed', suggestedFilters: [] },
    { position: 1, name: 'Added to Cart', suggestedEventName: 'product_added_to_cart', suggestedFilters: [] },
    { position: 2, name: 'Cart Viewed', suggestedEventName: 'cart_viewed', suggestedFilters: [], optional: true },
    { position: 3, name: 'Checkout Started', suggestedEventName: 'checkout_started', suggestedFilters: [] },
    { position: 4, name: 'Payment Completed', suggestedEventName: 'payment_completed', suggestedFilters: [] },
    { position: 5, name: 'Order Confirmed', suggestedEventName: 'order_completed', suggestedFilters: [] },
  ],
  exclusionRules: [
    { eventName: 'order_refunded', behavior: 'disqualify', retroactive: true },
  ],
  defaultOrderingMode: 'strict',
  defaultConversionWindowSeconds: 14 * 24 * 60 * 60,
}
```

### SaaS Onboarding Template

```typescript
{
  name: 'SaaS Product Onboarding',
  category: 'onboarding',
  description: 'Tracks new user onboarding from signup through key activation milestones',
  steps: [
    { position: 0, name: 'Account Created', suggestedEventName: 'account_created', suggestedFilters: [] },
    { position: 1, name: 'Onboarding Started', suggestedEventName: 'onboarding_started', suggestedFilters: [] },
    { position: 2, name: 'First Integration Connected', suggestedEventName: 'integration_connected', suggestedFilters: [] },
    { position: 3, name: 'First Data Import', suggestedEventName: 'data_imported', suggestedFilters: [] },
    { position: 4, name: 'First Dashboard Created', suggestedEventName: 'dashboard_created', suggestedFilters: [] },
    { position: 5, name: 'Team Member Invited', suggestedEventName: 'team_invite_sent', suggestedFilters: [], optional: true },
  ],
  defaultOrderingMode: 'hybrid',
  defaultConversionWindowSeconds: 30 * 24 * 60 * 60,
}
```

### Subscription Renewal Template

```typescript
{
  name: 'Subscription Renewal',
  category: 'subscription',
  description: 'Tracks the subscription renewal flow from reminder to successful renewal',
  steps: [
    { position: 0, name: 'Renewal Reminder Sent', suggestedEventName: 'renewal_reminder_sent', suggestedFilters: [] },
    { position: 1, name: 'Renewal Page Viewed', suggestedEventName: 'renewal_page_viewed', suggestedFilters: [] },
    { position: 2, name: 'Plan Selected', suggestedEventName: 'plan_selected', suggestedFilters: [] },
    { position: 3, name: 'Payment Updated', suggestedEventName: 'payment_method_updated', suggestedFilters: [], optional: true },
    { position: 4, name: 'Subscription Renewed', suggestedEventName: 'subscription_renewed', suggestedFilters: [] },
  ],
  exclusionRules: [
    { eventName: 'subscription_cancelled', behavior: 'disqualify', retroactive: false },
    { eventName: 'subscription_downgraded', behavior: 'disqualify', retroactive: false },
  ],
  defaultOrderingMode: 'strict',
  defaultConversionWindowSeconds: 30 * 24 * 60 * 60,
}
```

---

## Appendix: SQL Helper Functions

### Funnel Query Execution (Optimized)

```sql
-- Optimized funnel query function that processes user journeys
-- in a single pass using window functions
CREATE OR REPLACE FUNCTION compute_funnel(
    p_funnel_id TEXT,
    p_tenant_id TEXT,
    p_date_from TIMESTAMPTZ,
    p_date_to TIMESTAMPTZ,
    p_max_users INTEGER DEFAULT 1000000
)
RETURNS TABLE (
    step_position INTEGER,
    step_name TEXT,
    users_reached BIGINT,
    users_completed BIGINT,
    users_dropped_off BIGINT,
    step_conversion_rate NUMERIC,
    cumulative_conversion_rate NUMERIC,
    median_time_from_previous NUMERIC
) AS $$
DECLARE
    v_ordering_mode TEXT;
    v_conversion_window INTEGER;
    v_step_count INTEGER;
BEGIN
    -- Get funnel configuration
    SELECT f.ordering_mode, f.conversion_window_seconds
    INTO v_ordering_mode, v_conversion_window
    FROM funnels f
    WHERE f.id = p_funnel_id
    AND f.tenant_id = p_tenant_id
    AND f.deleted_at IS NULL;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Funnel not found: %', p_funnel_id;
    END IF;

    -- Get step count
    SELECT COUNT(*) INTO v_step_count
    FROM funnel_steps WHERE funnel_id = p_funnel_id;

    -- For strict ordering, use window functions to find sequential matches
    IF v_ordering_mode = 'strict' THEN
        RETURN QUERY
        WITH step_defs AS (
            SELECT fs.position, fs.name, fs.event_name, fs.match_mode,
                   fs.filters, fs.max_time_from_previous_seconds, fs.optional
            FROM funnel_steps fs
            WHERE fs.funnel_id = p_funnel_id
            ORDER BY fs.position
        ),
        user_events AS (
            SELECT
                e.user_id,
                e.event_name,
                e.properties,
                e.timestamp,
                ROW_NUMBER() OVER (PARTITION BY e.user_id ORDER BY e.timestamp) AS event_order
            FROM cdp_events e
            WHERE e.tenant_id = p_tenant_id
            AND e.timestamp BETWEEN p_date_from AND p_date_to
            AND e.event_name IN (SELECT event_name FROM step_defs)
            LIMIT p_max_users * v_step_count * 10  -- Safety limit
        ),
        user_journeys AS (
            SELECT
                ue.user_id,
                sd.position AS step_position,
                sd.name AS step_name,
                ue.timestamp,
                LAG(ue.timestamp) OVER (PARTITION BY ue.user_id ORDER BY sd.position) AS prev_timestamp
            FROM user_events ue
            INNER JOIN step_defs sd ON ue.event_name = sd.event_name
            WHERE sd.match_mode = 'exact'  -- Simplified for exact mode
        ),
        step_metrics AS (
            SELECT
                uj.step_position,
                uj.step_name,
                COUNT(DISTINCT uj.user_id) AS users_at_step,
                PERCENTILE_CONT(0.5) WITHIN GROUP (
                    ORDER BY EXTRACT(EPOCH FROM (uj.timestamp - uj.prev_timestamp))
                ) AS median_time
            FROM user_journeys uj
            GROUP BY uj.step_position, uj.step_name
        )
        SELECT
            sm.step_position::INTEGER,
            sm.step_name,
            sm.users_at_step AS users_reached,
            COALESCE(LEAD(sm.users_at_step) OVER (ORDER BY sm.step_position), sm.users_at_step) AS users_completed,
            sm.users_at_step - COALESCE(LEAD(sm.users_at_step) OVER (ORDER BY sm.step_position), sm.users_at_step) AS users_dropped_off,
            CASE
                WHEN LAG(sm.users_at_step) OVER (ORDER BY sm.step_position) > 0
                THEN sm.users_at_step::NUMERIC / LAG(sm.users_at_step) OVER (ORDER BY sm.step_position)
                ELSE 1.0
            END AS step_conversion_rate,
            CASE
                WHEN FIRST_VALUE(sm.users_at_step) OVER (ORDER BY sm.step_position) > 0
                THEN sm.users_at_step::NUMERIC / FIRST_VALUE(sm.users_at_step) OVER (ORDER BY sm.step_position)
                ELSE 0.0
            END AS cumulative_conversion_rate,
            sm.median_time AS median_time_from_previous
        FROM step_metrics sm
        ORDER BY sm.step_position;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

---

## Appendix: Funnel Visualization Data Format

The funnel query results are designed to be directly consumed by frontend visualization libraries. Here's the expected format for common chart types:

### Bar/Waterfall Chart Data

```typescript
// Transform FunnelResult to chart data
function toWaterfallChartData(result: FunnelResult) {
  return result.stepResults.map((step) => ({
    label: step.name,
    value: step.usersReached,
    previousValue: step.position === 0 ? step.usersReached : result.stepResults[step.position - 1].usersReached,
    conversionRate: step.stepConversionRate,
    cumulativeRate: step.cumulativeConversionRate,
    color: step.dropOffRate > 0.5 ? '#ef4444' : step.dropOffRate > 0.3 ? '#f59e0b' : '#22c55e',
  }));
}
```

### Sankey Diagram Data

```typescript
// Transform for Sankey visualization (showing flow between steps)
function toSankeyData(result: FunnelResult) {
  const nodes = [
    ...result.stepResults.map((s) => ({ id: `step_${s.position}`, label: s.name })),
    { id: 'dropped_off', label: 'Dropped Off' },
    { id: 'converted', label: 'Converted' },
  ];

  const links = result.stepResults.flatMap((step, i) => {
    const links = [];

    // Flow to next step
    if (i < result.stepResults.length - 1) {
      links.push({
        source: `step_${step.position}`,
        target: `step_${step.position + 1}`,
        value: step.usersCompleted,
      });
    }

    // Flow to drop-off
    if (step.usersDroppedOff > 0) {
      links.push({
        source: `step_${step.position}`,
        target: 'dropped_off',
        value: step.usersDroppedOff,
      });
    }

    // Last step to converted
    if (i === result.stepResults.length - 1) {
      links.push({
        source: `step_${step.position}`,
        target: 'converted',
        value: step.usersCompleted,
      });
    }

    return links;
  });

  return { nodes, links };
}
```

---

*Module version: 1.0.0 | Last updated: 2026-02-08 | Maintainer: @mcv/analytics-team*
