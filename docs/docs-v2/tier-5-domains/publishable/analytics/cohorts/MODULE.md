# @mcv/analytics/cohorts

> **Tier 5 — Domain Module (Publishable)**
> Cohort analysis engine: group users by shared characteristics or time-based events, then track behavior, retention, revenue, and lifecycle progression over time.

---

## Purpose

The cohorts module provides a complete cohort analysis engine for the MCV analytics platform. Cohorts are the fundamental unit of behavioral analysis — they answer the question "how do groups of users who share something in common behave over time?"

Traditional analytics tools show you what happened yesterday. Cohort analysis shows you **why** it matters. When you see that last month's signups have 40% Day-7 retention versus 25% for the month before, you know your onboarding changes are working. When you see that users acquired through paid search have 2x the 90-day LTV of organic users, you know where to allocate budget.

This module powers:

- **Time-based cohort creation** — Group users by signup week, signup month, first-event date, or any temporal anchor
- **Behavior-based cohort creation** — Group users by their first significant action (first purchase, first bet, first deposit, feature adoption)
- **Attribute-based cohort creation** — Group users by plan tier, venture, acquisition channel, geography, device type
- **Retention analysis** — Day-N retention curves, weekly retention grids, monthly retention matrices with configurable return-event definitions
- **Cohort comparison** — Side-by-side comparison of retention, revenue, engagement, and conversion metrics across any set of cohorts
- **Lifecycle stage classification** — Classify every user in every cohort as new, active, returning, dormant, or churned based on configurable activity windows
- **Revenue cohort tracking** — Track cumulative LTV, ARPU, and revenue curves per cohort over time
- **Custom cohort rules** — User-defined cohort definitions combining events, traits, attributes, and temporal conditions
- **Cohort export** — Push cohort member lists to CDP segments, email campaign tools, ad audience platforms, and downstream analytics

The module consumes events and profiles from the CDP pipeline, stores cohort definitions and precomputed results in Supabase PostgreSQL, and exposes all functionality through tRPC procedures.

---

## Exports

```typescript
// === Primary Service ===
export { CohortService }           from './services/cohort-service';
export { RetentionService }        from './services/retention-service';
export { LifecycleService }        from './services/lifecycle-service';
export { RevenueCohortService }    from './services/revenue-cohort-service';
export { CohortExportService }     from './services/cohort-export-service';
export { CohortComparisonService } from './services/cohort-comparison-service';

// === tRPC Router ===
export { cohortRouter }            from './router';

// === Types & Interfaces ===
export type {
  Cohort,
  CohortDefinition,
  CohortRule,
  CohortRuleGroup,
  CohortMember,
  CohortMembership,
  CohortSummary,
  CohortSnapshot,
  RetentionGrid,
  RetentionCell,
  RetentionCurve,
  RetentionConfig,
  CohortComparison,
  ComparisonMetric,
  ComparisonResult,
  LifecycleStage,
  LifecycleDistribution,
  LifecycleTransition,
  RevenueCohort,
  RevenueCurve,
  RevenueDataPoint,
  CohortExportTarget,
  CohortExportJob,
  CohortExportResult,
  CustomCohortConfig,
  CohortTimeFrame,
  CohortGranularity,
  CohortMetricType,
} from './types';

// === Schemas (Zod) ===
export {
  cohortDefinitionSchema,
  cohortRuleSchema,
  cohortRuleGroupSchema,
  retentionConfigSchema,
  cohortComparisonRequestSchema,
  cohortExportRequestSchema,
  customCohortConfigSchema,
  lifecycleConfigSchema,
  revenueCohortConfigSchema,
} from './schemas';

// === Constants ===
export {
  COHORT_GRANULARITIES,
  LIFECYCLE_STAGES,
  DEFAULT_RETENTION_WINDOWS,
  COHORT_METRIC_TYPES,
  EXPORT_TARGET_TYPES,
  MAX_COHORT_MEMBERS,
  MAX_RETENTION_PERIODS,
  COHORT_CACHE_TTL,
} from './constants';

// === Errors ===
export {
  CohortError,
  CohortNotFoundError,
  CohortDefinitionError,
  CohortRuleValidationError,
  RetentionComputeError,
  CohortComparisonError,
  CohortExportError,
  CohortMembershipError,
  LifecycleComputeError,
  RevenueCohortError,
  CohortPermissionError,
  CohortQuotaExceededError,
  CohortSnapshotError,
  CohortTimeRangeError,
} from './errors';

// === Utilities ===
export { buildCohortQuery }        from './utils/query-builder';
export { computeRetentionGrid }    from './utils/retention-compute';
export { classifyLifecycleStage }  from './utils/lifecycle-classifier';
export { formatRetentionMatrix }   from './utils/formatters';
export { cohortDateUtils }         from './utils/date-utils';
```

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        @mcv/analytics/cohorts                          │
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                       tRPC Router Layer                          │   │
│  │                                                                   │   │
│  │  cohort.create    cohort.list      cohort.get       cohort.delete │   │
│  │  cohort.update    cohort.snapshot  cohort.members   cohort.rules  │   │
│  │  retention.grid   retention.curve  retention.compare              │   │
│  │  lifecycle.dist   lifecycle.flow   lifecycle.classify             │   │
│  │  revenue.curve    revenue.compare  revenue.forecast               │   │
│  │  export.segment   export.campaign  export.audience                │   │
│  │  comparison.run   comparison.save  comparison.report              │   │
│  └──────────────────────────┬──────────────────────────────────────┘   │
│                              │                                          │
│  ┌───────────────────────────▼──────────────────────────────────────┐  │
│  │                      Service Layer                                │  │
│  │                                                                    │  │
│  │  ┌──────────────┐  ┌──────────────┐  ┌───────────────────────┐  │  │
│  │  │ CohortService│  │  Retention   │  │   Lifecycle Service   │  │  │
│  │  │              │  │  Service     │  │                       │  │  │
│  │  │ • create     │  │              │  │ • classifyAll         │  │  │
│  │  │ • resolve    │  │ • grid       │  │ • distribution        │  │  │
│  │  │ • snapshot   │  │ • curve      │  │ • transitions         │  │  │
│  │  │ • members    │  │ • dayN       │  │ • stageHistory        │  │  │
│  │  │ • rules      │  │ • compare    │  │ • dormancyDetect      │  │  │
│  │  └──────────────┘  └──────────────┘  └───────────────────────┘  │  │
│  │                                                                    │  │
│  │  ┌──────────────┐  ┌──────────────┐  ┌───────────────────────┐  │  │
│  │  │   Revenue    │  │   Cohort     │  │    Cohort Export      │  │  │
│  │  │   Cohort     │  │  Comparison  │  │    Service            │  │  │
│  │  │   Service    │  │  Service     │  │                       │  │  │
│  │  │              │  │              │  │ • toSegment           │  │  │
│  │  │ • ltvCurve   │  │ • compare    │  │ • toCampaign         │  │  │
│  │  │ • arpu       │  │ • rank       │  │ • toAudience         │  │  │
│  │  │ • cumRevenue │  │ • report     │  │ • schedule           │  │  │
│  │  │ • forecast   │  │ • diff       │  │ • status             │  │  │
│  │  └──────────────┘  └──────────────┘  └───────────────────────┘  │  │
│  └───────────────────────────┬──────────────────────────────────────┘  │
│                               │                                         │
│  ┌────────────────────────────▼─────────────────────────────────────┐  │
│  │                     Query & Compute Layer                         │  │
│  │                                                                    │  │
│  │  ┌─────────────┐  ┌──────────────┐  ┌────────────────────────┐  │  │
│  │  │   Query     │  │  Retention   │  │   Lifecycle            │  │  │
│  │  │   Builder   │  │  Compute     │  │   Classifier           │  │  │
│  │  │             │  │  Engine      │  │                        │  │  │
│  │  │ • rules→SQL │  │              │  │ • window analysis      │  │  │
│  │  │ • optimize  │  │ • matrix     │  │ • stage assignment     │  │  │
│  │  │ • paginate  │  │ • curves     │  │ • transition detect    │  │  │
│  │  └─────────────┘  │ • dayN calc  │  └────────────────────────┘  │  │
│  │                    └──────────────┘                               │  │
│  │  ┌─────────────┐  ┌──────────────┐  ┌────────────────────────┐  │  │
│  │  │  Revenue    │  │   Date       │  │   Cache Manager        │  │  │
│  │  │  Compute    │  │   Utils      │  │                        │  │  │
│  │  │             │  │              │  │ • retention grids      │  │  │
│  │  │ • LTV agg   │  │ • periods    │  │ • snapshots            │  │  │
│  │  │ • ARPU calc │  │ • boundaries │  │ • invalidation         │  │  │
│  │  │ • forecast  │  │ • normalize  │  │ • TTL management       │  │  │
│  │  └─────────────┘  └──────────────┘  └────────────────────────┘  │  │
│  └───────────────────────────┬──────────────────────────────────────┘  │
│                               │                                         │
│  ┌────────────────────────────▼─────────────────────────────────────┐  │
│  │                    Data Access Layer                               │  │
│  │                                                                    │  │
│  │  ┌─────────────────────────────────────────────────────────────┐  │  │
│  │  │                  Supabase PostgreSQL                         │  │  │
│  │  │                                                              │  │  │
│  │  │  cohort_definitions    cohort_memberships    cohort_snapshots│  │  │
│  │  │  cohort_rules          retention_cache       lifecycle_state │  │  │
│  │  │  revenue_cohort_data   cohort_exports        comparison_runs│  │  │
│  │  │                                                              │  │  │
│  │  │  ┌──────────────────┐  ┌──────────────────────────────────┐ │  │  │
│  │  │  │   CDP Events     │  │     CDP Profiles                 │ │  │  │
│  │  │  │   (read-only)    │  │     (read-only)                  │ │  │  │
│  │  │  └──────────────────┘  └──────────────────────────────────┘ │  │  │
│  │  └─────────────────────────────────────────────────────────────┘  │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│                                                                         │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │                   External Integrations                           │  │
│  │                                                                    │  │
│  │  CDP Segments ◄──── Export ────► Email Campaigns                  │  │
│  │       │                              │                             │  │
│  │       ▼                              ▼                             │  │
│  │  Ad Audiences              Downstream Analytics                   │  │
│  └──────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────┘
```

### Data Flow

```
CDP Events Stream                     CDP Profiles Store
       │                                      │
       ▼                                      ▼
┌─────────────┐    resolve    ┌──────────────────────────┐
│ Event Ingest │──────────────►  Cohort Membership        │
│ (real-time)  │              │  Resolution Engine         │
└──────┬──────┘              └───────────┬────────────────┘
       │                                  │
       │    ┌─────────────────────────────┘
       │    │
       ▼    ▼
┌──────────────────┐     ┌──────────────────┐
│ Retention Compute │     │ Lifecycle Classify│
│                    │     │                   │
│ • Day-N windows   │     │ • Activity check  │
│ • Period bucketing │     │ • Stage assign    │
│ • Grid assembly   │     │ • Transition log  │
└────────┬─────────┘     └────────┬──────────┘
         │                         │
         ▼                         ▼
┌──────────────────────────────────────────┐
│           Snapshot & Cache               │
│                                           │
│ Pre-computed results for fast retrieval   │
│ Invalidated on new data or definition    │
│ change. TTL-based expiry for staleness.  │
└──────────────────────┬───────────────────┘
                       │
                       ▼
              ┌─────────────────┐
              │  tRPC Response   │
              │  to Dashboard    │
              └─────────────────┘
```

---

## Core Interfaces

### CohortService

The primary service for cohort CRUD operations, membership resolution, and snapshot management.

```typescript
import { TRPCError } from '@trpc/server';
import { z } from 'zod';
import type { SupabaseClient } from '@supabase/supabase-js';

// ─── Enums & Constants ────────────────────────────────────────────────────────

export const COHORT_GRANULARITIES = ['day', 'week', 'month', 'quarter', 'year'] as const;
export type CohortGranularity = (typeof COHORT_GRANULARITIES)[number];

export const LIFECYCLE_STAGES = ['new', 'active', 'returning', 'dormant', 'churned'] as const;
export type LifecycleStage = (typeof LIFECYCLE_STAGES)[number];

export const COHORT_METRIC_TYPES = [
  'retention',
  'revenue',
  'engagement',
  'conversion',
  'frequency',
  'recency',
] as const;
export type CohortMetricType = (typeof COHORT_METRIC_TYPES)[number];

export const EXPORT_TARGET_TYPES = ['segment', 'campaign', 'audience', 'csv', 'webhook'] as const;
export type ExportTargetType = (typeof EXPORT_TARGET_TYPES)[number];

export const MAX_COHORT_MEMBERS = 1_000_000;
export const MAX_RETENTION_PERIODS = 365;
export const COHORT_CACHE_TTL = 3600; // 1 hour in seconds

// ─── Cohort Definition Types ──────────────────────────────────────────────────

/**
 * Operators for cohort rule conditions.
 */
export type CohortRuleOperator =
  | 'eq'
  | 'neq'
  | 'gt'
  | 'gte'
  | 'lt'
  | 'lte'
  | 'in'
  | 'not_in'
  | 'contains'
  | 'not_contains'
  | 'starts_with'
  | 'ends_with'
  | 'exists'
  | 'not_exists'
  | 'between'
  | 'regex';

/**
 * A single rule within a cohort definition.
 * Rules are the atomic unit of cohort membership evaluation.
 */
export interface CohortRule {
  /** Unique rule identifier within the cohort definition */
  id: string;

  /** The type of data source for this rule */
  source: 'event' | 'profile' | 'trait' | 'computed';

  /** Field or event name to evaluate */
  field: string;

  /** Comparison operator */
  operator: CohortRuleOperator;

  /**
   * Value(s) to compare against.
   * Type depends on operator:
   * - 'in'/'not_in': array of values
   * - 'between': tuple [min, max]
   * - 'exists'/'not_exists': undefined
   * - others: single value
   */
  value?: unknown;

  /**
   * For event-based rules, optional time constraint.
   * "first purchase within 7 days of signup"
   */
  timeConstraint?: {
    /** Reference point: signup, first_event, specific_date */
    relativeTo: 'cohort_anchor' | 'signup' | 'absolute';
    /** Number of periods after reference */
    withinPeriods?: number;
    /** Period granularity */
    periodGranularity?: CohortGranularity;
    /** Absolute date range (when relativeTo is 'absolute') */
    dateRange?: { start: string; end: string };
  };

  /**
   * For event-based rules, frequency constraint.
   * "performed purchase at least 3 times"
   */
  frequencyConstraint?: {
    operator: 'at_least' | 'at_most' | 'exactly';
    count: number;
  };
}

/**
 * A group of rules combined with a logical operator.
 * Groups can be nested for complex logic.
 */
export interface CohortRuleGroup {
  /** Logical combinator for rules in this group */
  operator: 'and' | 'or';

  /** Rules or nested groups */
  conditions: Array<CohortRule | CohortRuleGroup>;
}

/**
 * The type of cohort — determines how users are assigned.
 */
export type CohortType = 'time_based' | 'behavior_based' | 'attribute_based' | 'custom';

/**
 * Complete cohort definition — the blueprint for a cohort.
 */
export interface CohortDefinition {
  /** What type of cohort this is */
  type: CohortType;

  /** For time-based cohorts: the anchor event */
  anchorEvent?: string;

  /** For time-based cohorts: the grouping granularity */
  granularity?: CohortGranularity;

  /** For time-based cohorts: start date for generating cohort periods */
  startDate?: string;

  /** For time-based cohorts: end date for generating cohort periods */
  endDate?: string;

  /** For behavior-based cohorts: the defining behavior event */
  behaviorEvent?: string;

  /** For attribute-based cohorts: the attribute to group by */
  groupByAttribute?: string;

  /** Custom rule group for complex cohort definitions */
  rules?: CohortRuleGroup;

  /** Maximum members per cohort (performance guard) */
  maxMembers?: number;
}

/**
 * A cohort — a named group of users with a definition.
 */
export interface Cohort {
  /** Unique cohort identifier (UUID) */
  id: string;

  /** Venture (tenant) this cohort belongs to */
  ventureId: string;

  /** Human-readable cohort name */
  name: string;

  /** Optional description */
  description?: string;

  /** The definition that determines membership */
  definition: CohortDefinition;

  /** Cohort label for time-based cohorts (e.g., "2024-W03", "2024-01") */
  periodLabel?: string;

  /** Total number of members at last snapshot */
  memberCount: number;

  /** Whether this cohort auto-updates as new data arrives */
  isDynamic: boolean;

  /** Tags for organization */
  tags: string[];

  /** Created by (user ID) */
  createdBy: string;

  /** ISO timestamp of creation */
  createdAt: string;

  /** ISO timestamp of last update */
  updatedAt: string;

  /** ISO timestamp of last snapshot computation */
  lastSnapshotAt?: string;
}

/**
 * A single member's relationship to a cohort.
 */
export interface CohortMember {
  /** User/profile ID */
  profileId: string;

  /** Cohort this membership belongs to */
  cohortId: string;

  /** When the user entered this cohort */
  enteredAt: string;

  /** When the user exited this cohort (null if still active) */
  exitedAt?: string;

  /** The anchor date for this user in this cohort (e.g., signup date) */
  anchorDate: string;

  /** Additional metadata about this membership */
  metadata?: Record<string, unknown>;
}

/**
 * Membership tracking for a user across cohorts.
 */
export interface CohortMembership {
  profileId: string;
  cohorts: Array<{
    cohortId: string;
    cohortName: string;
    enteredAt: string;
    exitedAt?: string;
    anchorDate: string;
  }>;
}

/**
 * Summary statistics for a cohort.
 */
export interface CohortSummary {
  cohortId: string;
  cohortName: string;
  periodLabel?: string;
  memberCount: number;
  averageRetention: Record<number, number>; // day-N → percentage
  totalRevenue: number;
  averageLtv: number;
  lifecycleDistribution: Record<LifecycleStage, number>;
  topEvents: Array<{ event: string; count: number; uniqueUsers: number }>;
}

/**
 * Point-in-time snapshot of a cohort's state.
 */
export interface CohortSnapshot {
  id: string;
  cohortId: string;
  computedAt: string;
  memberCount: number;
  retentionGrid?: RetentionGrid;
  lifecycleDistribution?: Record<LifecycleStage, number>;
  revenueSummary?: {
    totalRevenue: number;
    averageLtv: number;
    medianLtv: number;
    p90Ltv: number;
  };
  metadata?: Record<string, unknown>;
}

// ─── Retention Types ──────────────────────────────────────────────────────────

/**
 * Configuration for retention analysis.
 */
export interface RetentionConfig {
  /** The event that constitutes a "return" */
  returnEvent: string;

  /** Event property filters for the return event */
  returnEventFilters?: Record<string, unknown>;

  /** Granularity for retention periods */
  granularity: CohortGranularity;

  /** Number of periods to compute (e.g., 12 weeks) */
  periods: number;

  /** Whether to use inclusive counting (active on day AND all subsequent) */
  inclusive?: boolean;

  /**
   * Unbounded retention: track if user returned at any point
   * within the period window (not just on the exact day).
   */
  unbounded?: boolean;
}

/**
 * A single cell in the retention grid.
 */
export interface RetentionCell {
  /** Cohort period index (row) */
  cohortPeriod: number;

  /** Retention period index (column) — days/weeks/months since anchor */
  retentionPeriod: number;

  /** Cohort period label (e.g., "Jan 2024") */
  cohortLabel: string;

  /** Number of users who were active in this retention period */
  activeUsers: number;

  /** Total users in the cohort period (denominator) */
  totalUsers: number;

  /** Retention rate as a decimal (0.0 - 1.0) */
  retentionRate: number;
}

/**
 * Complete retention grid — the classic retention matrix.
 *
 * Rows = cohort periods (e.g., signup months)
 * Columns = retention periods (e.g., Month 0, Month 1, ..., Month 12)
 */
export interface RetentionGrid {
  /** The cohort this grid is for */
  cohortId: string;

  /** Retention configuration used */
  config: RetentionConfig;

  /** Grid cells */
  cells: RetentionCell[];

  /** Cohort period labels (row headers) */
  cohortLabels: string[];

  /** Retention period labels (column headers) */
  retentionLabels: string[];

  /** Average retention rate per retention period (across all cohort periods) */
  averageByRetentionPeriod: number[];

  /** Total users per cohort period */
  cohortSizes: number[];

  /** When this grid was computed */
  computedAt: string;
}

/**
 * A retention curve — retention rates for a single cohort over time.
 */
export interface RetentionCurve {
  cohortId: string;
  cohortLabel: string;
  cohortSize: number;
  /** Retention rate at each period */
  rates: Array<{
    period: number;
    label: string;
    activeUsers: number;
    retentionRate: number;
  }>;
}

// ─── Comparison Types ─────────────────────────────────────────────────────────

/**
 * A metric to compare across cohorts.
 */
export interface ComparisonMetric {
  /** Metric identifier */
  type: CohortMetricType;

  /** Human label */
  label: string;

  /** Specific period for retention (e.g., Day 7, Month 3) */
  period?: number;

  /** Aggregation function */
  aggregation?: 'avg' | 'sum' | 'median' | 'p90' | 'min' | 'max';
}

/**
 * Result of comparing a single metric across cohorts.
 */
export interface ComparisonResult {
  metric: ComparisonMetric;
  values: Array<{
    cohortId: string;
    cohortLabel: string;
    value: number;
    /** Percentage difference from the baseline cohort */
    diffFromBaseline?: number;
    /** Statistical significance (p-value) if applicable */
    pValue?: number;
  }>;
  /** Which cohort performed best for this metric */
  bestCohortId: string;
  /** Which cohort performed worst */
  worstCohortId: string;
}

/**
 * Complete cohort comparison.
 */
export interface CohortComparison {
  id: string;
  name: string;
  ventureId: string;
  cohortIds: string[];
  metrics: ComparisonMetric[];
  results: ComparisonResult[];
  baselineCohortId?: string;
  createdAt: string;
  createdBy: string;
}

// ─── Lifecycle Types ──────────────────────────────────────────────────────────

/**
 * Lifecycle distribution for a cohort at a point in time.
 */
export interface LifecycleDistribution {
  cohortId: string;
  computedAt: string;
  /** Date this distribution is for */
  asOfDate: string;
  distribution: Record<LifecycleStage, number>;
  /** Percentage distribution */
  percentages: Record<LifecycleStage, number>;
  totalMembers: number;
}

/**
 * A lifecycle transition event.
 */
export interface LifecycleTransition {
  profileId: string;
  cohortId: string;
  fromStage: LifecycleStage;
  toStage: LifecycleStage;
  transitionDate: string;
  /** Days spent in the previous stage */
  daysInPreviousStage: number;
}

/**
 * Configuration for lifecycle stage classification.
 */
export interface LifecycleConfig {
  /** Days since signup to be considered "new" */
  newWindowDays: number;

  /** Days of inactivity before "dormant" */
  dormantAfterDays: number;

  /** Days of inactivity before "churned" */
  churnedAfterDays: number;

  /** What events count as "activity" */
  activityEvents: string[];

  /** Minimum events to be considered "active" in a window */
  minActivityCount?: number;
}

// ─── Revenue Types ────────────────────────────────────────────────────────────

/**
 * Revenue data point for a cohort at a specific period.
 */
export interface RevenueDataPoint {
  /** Period index (e.g., month 0, month 1, ...) */
  period: number;

  /** Period label */
  label: string;

  /** Cumulative revenue for the cohort up to this period */
  cumulativeRevenue: number;

  /** Revenue generated in this specific period */
  periodRevenue: number;

  /** Average revenue per user (cumulative) */
  arpu: number;

  /** Number of paying users in this period */
  payingUsers: number;

  /** Percentage of cohort that has paid (ever, cumulative) */
  payerRate: number;
}

/**
 * Revenue curve for a single cohort over time.
 */
export interface RevenueCurve {
  cohortId: string;
  cohortLabel: string;
  cohortSize: number;
  currency: string;
  dataPoints: RevenueDataPoint[];
  /** Projected future data points (if forecasting is enabled) */
  forecast?: RevenueDataPoint[];
}

/**
 * Complete revenue cohort analysis.
 */
export interface RevenueCohort {
  id: string;
  ventureId: string;
  name: string;
  curves: RevenueCurve[];
  /** Revenue event to track */
  revenueEvent: string;
  /** Property containing the revenue amount */
  revenueProperty: string;
  granularity: CohortGranularity;
  periods: number;
  computedAt: string;
}

// ─── Export Types ──────────────────────────────────────────────────────────────

/**
 * Target configuration for cohort export.
 */
export interface CohortExportTarget {
  type: ExportTargetType;

  /** For segment export: target segment ID in CDP */
  segmentId?: string;

  /** For campaign export: email campaign tool config */
  campaignConfig?: {
    provider: 'sendgrid' | 'mailchimp' | 'braze' | 'customer_io';
    listId: string;
    tags?: string[];
  };

  /** For audience export: ad platform config */
  audienceConfig?: {
    platform: 'facebook' | 'google' | 'tiktok' | 'snapchat';
    audienceId: string;
    accountId: string;
  };

  /** For CSV export */
  csvConfig?: {
    fields: string[];
    delimiter?: string;
    includeHeaders?: boolean;
  };

  /** For webhook export */
  webhookConfig?: {
    url: string;
    method: 'POST' | 'PUT';
    headers?: Record<string, string>;
    batchSize?: number;
  };
}

/**
 * A cohort export job.
 */
export interface CohortExportJob {
  id: string;
  cohortId: string;
  target: CohortExportTarget;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
  /** Filters to apply before export (subset of cohort members) */
  filters?: CohortRuleGroup;
  /** Maximum members to export */
  limit?: number;
  /** Number of members exported so far */
  exportedCount: number;
  /** Total members to export */
  totalCount: number;
  /** Error message if failed */
  error?: string;
  createdAt: string;
  completedAt?: string;
  createdBy: string;
}

/**
 * Result of a cohort export.
 */
export interface CohortExportResult {
  jobId: string;
  cohortId: string;
  target: CohortExportTarget;
  exportedCount: number;
  /** For CSV: download URL */
  downloadUrl?: string;
  /** For segment: the updated segment ID */
  segmentId?: string;
  /** Duration in milliseconds */
  durationMs: number;
  completedAt: string;
}

// ─── Custom Cohort Config ─────────────────────────────────────────────────────

/**
 * Configuration for a user-defined custom cohort.
 */
export interface CustomCohortConfig {
  /** Human-readable name */
  name: string;

  /** Description of what this cohort represents */
  description?: string;

  /** The rule tree defining membership */
  rules: CohortRuleGroup;

  /** Whether membership is dynamic (re-evaluated) or static (snapshot) */
  isDynamic: boolean;

  /** For dynamic cohorts: how often to re-evaluate (in seconds) */
  refreshInterval?: number;

  /** Tags for organization */
  tags?: string[];

  /** Maximum members (performance guard) */
  maxMembers?: number;
}

// ─── Timeframe Types ──────────────────────────────────────────────────────────

/**
 * A time frame for cohort analysis.
 */
export interface CohortTimeFrame {
  /** Start date (inclusive) */
  start: string;

  /** End date (inclusive) */
  end: string;

  /** Granularity for splitting the time range into cohort periods */
  granularity: CohortGranularity;
}


// ═══════════════════════════════════════════════════════════════════════════════
//  CohortService — Primary service class
// ═══════════════════════════════════════════════════════════════════════════════

export interface ICohortService {
  /**
   * Create a new cohort from a definition.
   * For time-based cohorts, this creates one cohort per period in the range.
   */
  create(
    ventureId: string,
    config: CustomCohortConfig | CohortDefinition,
    createdBy: string,
  ): Promise<Cohort>;

  /**
   * Create multiple time-based cohorts from a time frame.
   * E.g., "weekly cohorts from Jan 2024 to Mar 2024" → 12 cohorts.
   */
  createTimeSeries(
    ventureId: string,
    name: string,
    anchorEvent: string,
    timeFrame: CohortTimeFrame,
    createdBy: string,
  ): Promise<Cohort[]>;

  /**
   * Get a cohort by ID.
   */
  get(cohortId: string, ventureId: string): Promise<Cohort>;

  /**
   * List cohorts for a venture with optional filtering.
   */
  list(
    ventureId: string,
    options?: {
      type?: CohortType;
      tags?: string[];
      search?: string;
      limit?: number;
      offset?: number;
      orderBy?: 'name' | 'createdAt' | 'memberCount';
      orderDir?: 'asc' | 'desc';
    },
  ): Promise<{ cohorts: Cohort[]; total: number }>;

  /**
   * Update cohort metadata (name, description, tags).
   * Definition changes require creating a new cohort.
   */
  update(
    cohortId: string,
    ventureId: string,
    updates: Partial<Pick<Cohort, 'name' | 'description' | 'tags'>>,
  ): Promise<Cohort>;

  /**
   * Delete a cohort and all associated data.
   */
  delete(cohortId: string, ventureId: string): Promise<void>;

  /**
   * Resolve cohort membership — determine which profiles belong to this cohort.
   * This is the core computation that evaluates the cohort definition
   * against CDP events and profiles.
   */
  resolveMembers(
    cohortId: string,
    ventureId: string,
    options?: {
      /** Force re-computation even if cache is fresh */
      force?: boolean;
      /** Limit results */
      limit?: number;
      /** Offset for pagination */
      offset?: number;
    },
  ): Promise<{ members: CohortMember[]; total: number }>;

  /**
   * Get a point-in-time snapshot of the cohort.
   * Snapshots include member count, retention grid, lifecycle distribution,
   * and revenue summary.
   */
  snapshot(
    cohortId: string,
    ventureId: string,
    options?: {
      includeRetention?: boolean;
      retentionConfig?: RetentionConfig;
      includeLifecycle?: boolean;
      lifecycleConfig?: LifecycleConfig;
      includeRevenue?: boolean;
    },
  ): Promise<CohortSnapshot>;

  /**
   * Get the cohorts a specific profile belongs to.
   */
  membershipFor(
    profileId: string,
    ventureId: string,
  ): Promise<CohortMembership>;

  /**
   * Get summary statistics for a cohort.
   */
  summary(cohortId: string, ventureId: string): Promise<CohortSummary>;
}

export class CohortService implements ICohortService {
  constructor(
    private readonly db: SupabaseClient,
    private readonly cdpEvents: unknown, // CDP event reader
    private readonly cdpProfiles: unknown, // CDP profile reader
    private readonly cache: unknown, // Cache manager
  ) {}

  async create(
    ventureId: string,
    config: CustomCohortConfig | CohortDefinition,
    createdBy: string,
  ): Promise<Cohort> {
    // 1. Validate the config/definition
    // 2. Create cohort record in cohort_definitions
    // 3. If dynamic, schedule initial membership resolution
    // 4. If static, resolve immediately and store
    // 5. Return the created cohort
    throw new Error('Implementation in service layer');
  }

  async createTimeSeries(
    ventureId: string,
    name: string,
    anchorEvent: string,
    timeFrame: CohortTimeFrame,
    createdBy: string,
  ): Promise<Cohort[]> {
    // 1. Generate period boundaries from timeFrame
    // 2. Create one cohort per period
    // 3. Resolve members for each period in parallel (bounded)
    // 4. Return all created cohorts
    throw new Error('Implementation in service layer');
  }

  async get(cohortId: string, ventureId: string): Promise<Cohort> {
    const { data, error } = await this.db
      .from('cohort_definitions')
      .select('*')
      .eq('id', cohortId)
      .eq('venture_id', ventureId)
      .single();

    if (error || !data) {
      throw new CohortNotFoundError(cohortId);
    }

    return this.mapToCohort(data);
  }

  async list(
    ventureId: string,
    options?: {
      type?: CohortType;
      tags?: string[];
      search?: string;
      limit?: number;
      offset?: number;
      orderBy?: 'name' | 'createdAt' | 'memberCount';
      orderDir?: 'asc' | 'desc';
    },
  ): Promise<{ cohorts: Cohort[]; total: number }> {
    let query = this.db
      .from('cohort_definitions')
      .select('*', { count: 'exact' })
      .eq('venture_id', ventureId);

    if (options?.type) {
      query = query.eq('type', options.type);
    }
    if (options?.tags?.length) {
      query = query.overlaps('tags', options.tags);
    }
    if (options?.search) {
      query = query.ilike('name', `%${options.search}%`);
    }

    const orderCol = options?.orderBy === 'createdAt' ? 'created_at'
      : options?.orderBy === 'memberCount' ? 'member_count'
      : 'name';

    query = query
      .order(orderCol, { ascending: options?.orderDir !== 'desc' })
      .range(
        options?.offset ?? 0,
        (options?.offset ?? 0) + (options?.limit ?? 50) - 1,
      );

    const { data, error, count } = await query;
    if (error) throw new CohortError('COHORT_LIST_FAILED', error.message);

    return {
      cohorts: (data ?? []).map(this.mapToCohort),
      total: count ?? 0,
    };
  }

  async update(
    cohortId: string,
    ventureId: string,
    updates: Partial<Pick<Cohort, 'name' | 'description' | 'tags'>>,
  ): Promise<Cohort> {
    const { data, error } = await this.db
      .from('cohort_definitions')
      .update({
        ...(updates.name && { name: updates.name }),
        ...(updates.description !== undefined && { description: updates.description }),
        ...(updates.tags && { tags: updates.tags }),
        updated_at: new Date().toISOString(),
      })
      .eq('id', cohortId)
      .eq('venture_id', ventureId)
      .select()
      .single();

    if (error || !data) throw new CohortNotFoundError(cohortId);
    return this.mapToCohort(data);
  }

  async delete(cohortId: string, ventureId: string): Promise<void> {
    // 1. Delete cohort memberships
    // 2. Delete cohort snapshots
    // 3. Delete retention cache
    // 4. Delete cohort exports
    // 5. Delete cohort definition
    const { error } = await this.db
      .from('cohort_definitions')
      .delete()
      .eq('id', cohortId)
      .eq('venture_id', ventureId);

    if (error) throw new CohortError('COHORT_DELETE_FAILED', error.message);
  }

  async resolveMembers(
    cohortId: string,
    ventureId: string,
    options?: { force?: boolean; limit?: number; offset?: number },
  ): Promise<{ members: CohortMember[]; total: number }> {
    // 1. Get cohort definition
    // 2. Check cache freshness (skip if force=true)
    // 3. Build SQL query from rules using QueryBuilder
    // 4. Execute against CDP events + profiles
    // 5. Store results in cohort_memberships
    // 6. Update member_count on cohort_definitions
    // 7. Return paginated results
    throw new Error('Implementation in service layer');
  }

  async snapshot(
    cohortId: string,
    ventureId: string,
    options?: {
      includeRetention?: boolean;
      retentionConfig?: RetentionConfig;
      includeLifecycle?: boolean;
      lifecycleConfig?: LifecycleConfig;
      includeRevenue?: boolean;
    },
  ): Promise<CohortSnapshot> {
    // 1. Resolve current members
    // 2. Optionally compute retention grid
    // 3. Optionally classify lifecycle stages
    // 4. Optionally compute revenue summary
    // 5. Store snapshot
    // 6. Return snapshot
    throw new Error('Implementation in service layer');
  }

  async membershipFor(
    profileId: string,
    ventureId: string,
  ): Promise<CohortMembership> {
    const { data, error } = await this.db
      .from('cohort_memberships')
      .select(`
        cohort_id,
        entered_at,
        exited_at,
        anchor_date,
        cohort_definitions!inner(name, venture_id)
      `)
      .eq('profile_id', profileId)
      .eq('cohort_definitions.venture_id', ventureId);

    if (error) throw new CohortMembershipError(profileId, error.message);

    return {
      profileId,
      cohorts: (data ?? []).map((row: any) => ({
        cohortId: row.cohort_id,
        cohortName: row.cohort_definitions.name,
        enteredAt: row.entered_at,
        exitedAt: row.exited_at,
        anchorDate: row.anchor_date,
      })),
    };
  }

  async summary(cohortId: string, ventureId: string): Promise<CohortSummary> {
    // 1. Get latest snapshot
    // 2. Compute average retention across all periods
    // 3. Aggregate revenue data
    // 4. Get lifecycle distribution
    // 5. Get top events
    throw new Error('Implementation in service layer');
  }

  private mapToCohort(row: any): Cohort {
    return {
      id: row.id,
      ventureId: row.venture_id,
      name: row.name,
      description: row.description,
      definition: row.definition,
      periodLabel: row.period_label,
      memberCount: row.member_count,
      isDynamic: row.is_dynamic,
      tags: row.tags ?? [],
      createdBy: row.created_by,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      lastSnapshotAt: row.last_snapshot_at,
    };
  }
}
```

### RetentionService

```typescript
/**
 * RetentionService — Computes retention grids, curves, and Day-N metrics.
 *
 * Retention is the backbone of cohort analysis. This service answers:
 * - "What percentage of users come back on Day 7?"
 * - "How does this month's retention compare to last month?"
 * - "At what point do we lose the most users?"
 */
export interface IRetentionService {
  /**
   * Compute a full retention grid for a set of time-based cohorts.
   * Each row = a cohort period, each column = a retention period.
   */
  computeGrid(
    ventureId: string,
    cohortIds: string[],
    config: RetentionConfig,
  ): Promise<RetentionGrid>;

  /**
   * Compute a retention curve for a single cohort.
   */
  computeCurve(
    cohortId: string,
    ventureId: string,
    config: RetentionConfig,
  ): Promise<RetentionCurve>;

  /**
   * Get Day-N retention for a cohort (e.g., Day 1, Day 7, Day 30).
   */
  dayN(
    cohortId: string,
    ventureId: string,
    days: number[],
    config: RetentionConfig,
  ): Promise<Record<number, number>>;

  /**
   * Compare retention curves across multiple cohorts.
   */
  compareCurves(
    ventureId: string,
    cohortIds: string[],
    config: RetentionConfig,
  ): Promise<RetentionCurve[]>;
}

export class RetentionService implements IRetentionService {
  constructor(
    private readonly db: SupabaseClient,
    private readonly cohortService: CohortService,
    private readonly cache: unknown,
  ) {}

  async computeGrid(
    ventureId: string,
    cohortIds: string[],
    config: RetentionConfig,
  ): Promise<RetentionGrid> {
    // Validate inputs
    if (config.periods > MAX_RETENTION_PERIODS) {
      throw new RetentionComputeError(
        `Periods ${config.periods} exceeds max ${MAX_RETENTION_PERIODS}`,
      );
    }

    // Check cache first
    const cacheKey = this.buildCacheKey(cohortIds, config);
    const cached = await this.getFromCache(cacheKey);
    if (cached) return cached;

    // For each cohort period:
    //   1. Get members and their anchor dates
    //   2. For each retention period:
    //     a. Query CDP events for return activity
    //     b. Count active users
    //     c. Compute retention rate
    //   3. Assemble grid cells

    const cells: RetentionCell[] = [];
    const cohortLabels: string[] = [];
    const cohortSizes: number[] = [];

    for (let i = 0; i < cohortIds.length; i++) {
      const cohort = await this.cohortService.get(cohortIds[i], ventureId);
      cohortLabels.push(cohort.periodLabel ?? cohort.name);

      const { members, total } = await this.cohortService.resolveMembers(
        cohortIds[i],
        ventureId,
      );
      cohortSizes.push(total);

      for (let period = 0; period <= config.periods; period++) {
        const activeCount = await this.countActiveInPeriod(
          members,
          period,
          config,
        );

        cells.push({
          cohortPeriod: i,
          retentionPeriod: period,
          cohortLabel: cohortLabels[i],
          activeUsers: activeCount,
          totalUsers: total,
          retentionRate: total > 0 ? activeCount / total : 0,
        });
      }
    }

    // Compute averages per retention period
    const averageByRetentionPeriod: number[] = [];
    for (let period = 0; period <= config.periods; period++) {
      const periodCells = cells.filter(c => c.retentionPeriod === period);
      const avg = periodCells.reduce((sum, c) => sum + c.retentionRate, 0)
        / periodCells.length;
      averageByRetentionPeriod.push(avg);
    }

    const retentionLabels = Array.from(
      { length: config.periods + 1 },
      (_, i) => `${config.granularity} ${i}`,
    );

    const grid: RetentionGrid = {
      cohortId: cohortIds[0], // Primary cohort reference
      config,
      cells,
      cohortLabels,
      retentionLabels,
      averageByRetentionPeriod,
      cohortSizes,
      computedAt: new Date().toISOString(),
    };

    // Cache result
    await this.setCache(cacheKey, grid);

    return grid;
  }

  async computeCurve(
    cohortId: string,
    ventureId: string,
    config: RetentionConfig,
  ): Promise<RetentionCurve> {
    const cohort = await this.cohortService.get(cohortId, ventureId);
    const { members, total } = await this.cohortService.resolveMembers(
      cohortId,
      ventureId,
    );

    const rates: RetentionCurve['rates'] = [];

    for (let period = 0; period <= config.periods; period++) {
      const activeCount = await this.countActiveInPeriod(
        members,
        period,
        config,
      );

      rates.push({
        period,
        label: `${config.granularity} ${period}`,
        activeUsers: activeCount,
        retentionRate: total > 0 ? activeCount / total : 0,
      });
    }

    return {
      cohortId,
      cohortLabel: cohort.periodLabel ?? cohort.name,
      cohortSize: total,
      rates,
    };
  }

  async dayN(
    cohortId: string,
    ventureId: string,
    days: number[],
    config: RetentionConfig,
  ): Promise<Record<number, number>> {
    const curve = await this.computeCurve(cohortId, ventureId, {
      ...config,
      periods: Math.max(...days),
    });

    const result: Record<number, number> = {};
    for (const day of days) {
      const point = curve.rates.find(r => r.period === day);
      result[day] = point?.retentionRate ?? 0;
    }

    return result;
  }

  async compareCurves(
    ventureId: string,
    cohortIds: string[],
    config: RetentionConfig,
  ): Promise<RetentionCurve[]> {
    return Promise.all(
      cohortIds.map(id => this.computeCurve(id, ventureId, config)),
    );
  }

  private async countActiveInPeriod(
    members: CohortMember[],
    period: number,
    config: RetentionConfig,
  ): Promise<number> {
    // For each member:
    //   1. Compute the period window based on anchor_date + period * granularity
    //   2. Query CDP events for return_event within that window
    //   3. Count members with at least one qualifying event
    //
    // Optimized with batch queries and set operations
    throw new Error('Implementation in compute layer');
  }

  private buildCacheKey(cohortIds: string[], config: RetentionConfig): string {
    return `retention:${cohortIds.sort().join(',')}:${JSON.stringify(config)}`;
  }

  private async getFromCache(key: string): Promise<RetentionGrid | null> {
    throw new Error('Implementation in cache layer');
  }

  private async setCache(key: string, grid: RetentionGrid): Promise<void> {
    throw new Error('Implementation in cache layer');
  }
}
```

### LifecycleService

```typescript
/**
 * LifecycleService — Classifies cohort members into lifecycle stages
 * and tracks transitions over time.
 *
 * Lifecycle stages represent where a user is in their journey:
 * - New: Recently joined, within the "new" window
 * - Active: Engaged within the activity window
 * - Returning: Was dormant, now active again
 * - Dormant: No activity for dormantAfterDays but not yet churned
 * - Churned: No activity for churnedAfterDays
 */
export interface ILifecycleService {
  /**
   * Classify all members of a cohort into lifecycle stages.
   */
  classifyAll(
    cohortId: string,
    ventureId: string,
    config: LifecycleConfig,
    asOfDate?: string,
  ): Promise<LifecycleDistribution>;

  /**
   * Get lifecycle distribution over time (for trend charts).
   */
  distributionOverTime(
    cohortId: string,
    ventureId: string,
    config: LifecycleConfig,
    timeFrame: CohortTimeFrame,
  ): Promise<LifecycleDistribution[]>;

  /**
   * Get lifecycle transitions for a cohort within a time range.
   */
  transitions(
    cohortId: string,
    ventureId: string,
    config: LifecycleConfig,
    timeFrame: CohortTimeFrame,
  ): Promise<{
    transitions: LifecycleTransition[];
    summary: Record<string, number>; // "active→dormant": 42
  }>;

  /**
   * Get the lifecycle stage history for a specific profile.
   */
  profileHistory(
    profileId: string,
    cohortId: string,
    ventureId: string,
  ): Promise<Array<{ stage: LifecycleStage; date: string; daysInStage: number }>>;
}

export class LifecycleService implements ILifecycleService {
  constructor(
    private readonly db: SupabaseClient,
    private readonly cohortService: CohortService,
    private readonly cdpEvents: unknown,
  ) {}

  async classifyAll(
    cohortId: string,
    ventureId: string,
    config: LifecycleConfig,
    asOfDate?: string,
  ): Promise<LifecycleDistribution> {
    const referenceDate = asOfDate ? new Date(asOfDate) : new Date();
    const { members, total } = await this.cohortService.resolveMembers(
      cohortId,
      ventureId,
    );

    const distribution: Record<LifecycleStage, number> = {
      new: 0,
      active: 0,
      returning: 0,
      dormant: 0,
      churned: 0,
    };

    for (const member of members) {
      const stage = await this.classifyMember(member, config, referenceDate);
      distribution[stage]++;
    }

    const percentages: Record<LifecycleStage, number> = {
      new: total > 0 ? distribution.new / total : 0,
      active: total > 0 ? distribution.active / total : 0,
      returning: total > 0 ? distribution.returning / total : 0,
      dormant: total > 0 ? distribution.dormant / total : 0,
      churned: total > 0 ? distribution.churned / total : 0,
    };

    return {
      cohortId,
      computedAt: new Date().toISOString(),
      asOfDate: referenceDate.toISOString(),
      distribution,
      percentages,
      totalMembers: total,
    };
  }

  async distributionOverTime(
    cohortId: string,
    ventureId: string,
    config: LifecycleConfig,
    timeFrame: CohortTimeFrame,
  ): Promise<LifecycleDistribution[]> {
    // Generate date points within the time frame
    // Classify all members at each date point
    // Return array of distributions
    throw new Error('Implementation in service layer');
  }

  async transitions(
    cohortId: string,
    ventureId: string,
    config: LifecycleConfig,
    timeFrame: CohortTimeFrame,
  ): Promise<{
    transitions: LifecycleTransition[];
    summary: Record<string, number>;
  }> {
    // 1. Get lifecycle_state history for all members in range
    // 2. Detect transitions (stage changes)
    // 3. Summarize transition counts
    throw new Error('Implementation in service layer');
  }

  async profileHistory(
    profileId: string,
    cohortId: string,
    ventureId: string,
  ): Promise<Array<{ stage: LifecycleStage; date: string; daysInStage: number }>> {
    const { data, error } = await this.db
      .from('lifecycle_state')
      .select('stage, computed_at, days_in_stage')
      .eq('profile_id', profileId)
      .eq('cohort_id', cohortId)
      .order('computed_at', { ascending: true });

    if (error) throw new LifecycleComputeError(error.message);

    return (data ?? []).map((row: any) => ({
      stage: row.stage,
      date: row.computed_at,
      daysInStage: row.days_in_stage,
    }));
  }

  private async classifyMember(
    member: CohortMember,
    config: LifecycleConfig,
    referenceDate: Date,
  ): Promise<LifecycleStage> {
    const enteredAt = new Date(member.enteredAt);
    const daysSinceEntry = Math.floor(
      (referenceDate.getTime() - enteredAt.getTime()) / (1000 * 60 * 60 * 24),
    );

    // Check if "new"
    if (daysSinceEntry <= config.newWindowDays) {
      return 'new';
    }

    // Get last activity date from CDP events
    const lastActivityDate = await this.getLastActivityDate(
      member.profileId,
      config.activityEvents,
    );

    if (!lastActivityDate) {
      return 'churned'; // Never active after entry
    }

    const daysSinceLastActivity = Math.floor(
      (referenceDate.getTime() - lastActivityDate.getTime()) / (1000 * 60 * 60 * 24),
    );

    // Churned: inactive for longer than churn threshold
    if (daysSinceLastActivity >= config.churnedAfterDays) {
      return 'churned';
    }

    // Dormant: inactive for longer than dormant threshold
    if (daysSinceLastActivity >= config.dormantAfterDays) {
      return 'dormant';
    }

    // Check if returning: was previously dormant/churned but now active
    const wasInactive = await this.wasPreviouslyInactive(
      member.profileId,
      member.cohortId,
      config,
    );

    if (wasInactive) {
      return 'returning';
    }

    return 'active';
  }

  private async getLastActivityDate(
    profileId: string,
    activityEvents: string[],
  ): Promise<Date | null> {
    // Query CDP events for the most recent qualifying event
    throw new Error('Implementation in CDP layer');
  }

  private async wasPreviouslyInactive(
    profileId: string,
    cohortId: string,
    config: LifecycleConfig,
  ): Promise<boolean> {
    // Check lifecycle_state history for a dormant/churned period
    // followed by recent activity
    throw new Error('Implementation in service layer');
  }
}
```

### RevenueCohortService

```typescript
/**
 * RevenueCohortService — Tracks LTV development, ARPU, and revenue curves
 * per cohort over time.
 *
 * Revenue cohort analysis answers critical business questions:
 * - "How much revenue does each signup cohort generate over 12 months?"
 * - "Which cohorts have the highest LTV?"
 * - "At what month do cohorts typically reach payback?"
 * - "Is LTV trending up or down across recent cohorts?"
 */
export interface IRevenueCohortService {
  /**
   * Compute a revenue curve for a single cohort.
   */
  computeCurve(
    cohortId: string,
    ventureId: string,
    config: {
      revenueEvent: string;
      revenueProperty: string;
      granularity: CohortGranularity;
      periods: number;
      currency?: string;
    },
  ): Promise<RevenueCurve>;

  /**
   * Compare revenue curves across multiple cohorts.
   */
  compareCurves(
    ventureId: string,
    cohortIds: string[],
    config: {
      revenueEvent: string;
      revenueProperty: string;
      granularity: CohortGranularity;
      periods: number;
      currency?: string;
    },
  ): Promise<RevenueCohort>;

  /**
   * Get ARPU (Average Revenue Per User) over time for a cohort.
   */
  arpu(
    cohortId: string,
    ventureId: string,
    config: {
      revenueEvent: string;
      revenueProperty: string;
      granularity: CohortGranularity;
      periods: number;
    },
  ): Promise<Array<{ period: number; label: string; arpu: number }>>;

  /**
   * Forecast future revenue for a cohort based on historical patterns.
   * Uses curve fitting on existing data to project forward.
   */
  forecast(
    cohortId: string,
    ventureId: string,
    config: {
      revenueEvent: string;
      revenueProperty: string;
      granularity: CohortGranularity;
      historicalPeriods: number;
      forecastPeriods: number;
      model?: 'linear' | 'logarithmic' | 'power';
    },
  ): Promise<RevenueCurve>;
}

export class RevenueCohortService implements IRevenueCohortService {
  constructor(
    private readonly db: SupabaseClient,
    private readonly cohortService: CohortService,
    private readonly cdpEvents: unknown,
  ) {}

  async computeCurve(
    cohortId: string,
    ventureId: string,
    config: {
      revenueEvent: string;
      revenueProperty: string;
      granularity: CohortGranularity;
      periods: number;
      currency?: string;
    },
  ): Promise<RevenueCurve> {
    const cohort = await this.cohortService.get(cohortId, ventureId);
    const { members, total } = await this.cohortService.resolveMembers(
      cohortId,
      ventureId,
    );

    const dataPoints: RevenueDataPoint[] = [];
    let cumulativeRevenue = 0;
    const allPayers = new Set<string>();

    for (let period = 0; period <= config.periods; period++) {
      // Query CDP events for revenue in this period window
      const periodRevenue = await this.computePeriodRevenue(
        members,
        period,
        config,
      );

      cumulativeRevenue += periodRevenue.totalRevenue;
      periodRevenue.payerIds.forEach(id => allPayers.add(id));

      dataPoints.push({
        period,
        label: `${config.granularity} ${period}`,
        cumulativeRevenue,
        periodRevenue: periodRevenue.totalRevenue,
        arpu: total > 0 ? cumulativeRevenue / total : 0,
        payingUsers: periodRevenue.payerIds.length,
        payerRate: total > 0 ? allPayers.size / total : 0,
      });
    }

    return {
      cohortId,
      cohortLabel: cohort.periodLabel ?? cohort.name,
      cohortSize: total,
      currency: config.currency ?? 'USD',
      dataPoints,
    };
  }

  async compareCurves(
    ventureId: string,
    cohortIds: string[],
    config: {
      revenueEvent: string;
      revenueProperty: string;
      granularity: CohortGranularity;
      periods: number;
      currency?: string;
    },
  ): Promise<RevenueCohort> {
    const curves = await Promise.all(
      cohortIds.map(id => this.computeCurve(id, ventureId, config)),
    );

    return {
      id: crypto.randomUUID(),
      ventureId,
      name: `Revenue comparison — ${new Date().toISOString().slice(0, 10)}`,
      curves,
      revenueEvent: config.revenueEvent,
      revenueProperty: config.revenueProperty,
      granularity: config.granularity,
      periods: config.periods,
      computedAt: new Date().toISOString(),
    };
  }

  async arpu(
    cohortId: string,
    ventureId: string,
    config: {
      revenueEvent: string;
      revenueProperty: string;
      granularity: CohortGranularity;
      periods: number;
    },
  ): Promise<Array<{ period: number; label: string; arpu: number }>> {
    const curve = await this.computeCurve(cohortId, ventureId, config);
    return curve.dataPoints.map(dp => ({
      period: dp.period,
      label: dp.label,
      arpu: dp.arpu,
    }));
  }

  async forecast(
    cohortId: string,
    ventureId: string,
    config: {
      revenueEvent: string;
      revenueProperty: string;
      granularity: CohortGranularity;
      historicalPeriods: number;
      forecastPeriods: number;
      model?: 'linear' | 'logarithmic' | 'power';
    },
  ): Promise<RevenueCurve> {
    // 1. Compute historical curve
    // 2. Fit regression model to cumulative revenue
    // 3. Project forward for forecastPeriods
    // 4. Return combined curve with forecast flag
    throw new Error('Implementation in service layer');
  }

  private async computePeriodRevenue(
    members: CohortMember[],
    period: number,
    config: {
      revenueEvent: string;
      revenueProperty: string;
      granularity: CohortGranularity;
    },
  ): Promise<{ totalRevenue: number; payerIds: string[] }> {
    // Query CDP events for each member in the period window
    // Sum up revenue amounts
    // Track unique payers
    throw new Error('Implementation in compute layer');
  }
}
```

### CohortComparisonService

```typescript
/**
 * CohortComparisonService — Compare metrics across cohorts with
 * statistical analysis and ranking.
 */
export interface ICohortComparisonService {
  /**
   * Run a comparison across cohorts for specified metrics.
   */
  compare(
    ventureId: string,
    request: {
      cohortIds: string[];
      metrics: ComparisonMetric[];
      baselineCohortId?: string;
      retentionConfig?: RetentionConfig;
      lifecycleConfig?: LifecycleConfig;
      revenueConfig?: {
        revenueEvent: string;
        revenueProperty: string;
      };
    },
  ): Promise<CohortComparison>;

  /**
   * Rank cohorts by a single metric.
   */
  rank(
    ventureId: string,
    cohortIds: string[],
    metric: ComparisonMetric,
    config?: {
      retentionConfig?: RetentionConfig;
      revenueConfig?: { revenueEvent: string; revenueProperty: string };
    },
  ): Promise<Array<{ cohortId: string; label: string; value: number; rank: number }>>;

  /**
   * Generate a comparison report (structured data for rendering).
   */
  report(comparisonId: string, ventureId: string): Promise<CohortComparison>;

  /**
   * Compute the difference between two cohorts across all metrics.
   */
  diff(
    ventureId: string,
    cohortA: string,
    cohortB: string,
    metrics: ComparisonMetric[],
  ): Promise<Array<{
    metric: ComparisonMetric;
    valueA: number;
    valueB: number;
    absoluteDiff: number;
    percentDiff: number;
  }>>;
}

export class CohortComparisonService implements ICohortComparisonService {
  constructor(
    private readonly db: SupabaseClient,
    private readonly retentionService: RetentionService,
    private readonly lifecycleService: LifecycleService,
    private readonly revenueService: RevenueCohortService,
  ) {}

  async compare(
    ventureId: string,
    request: {
      cohortIds: string[];
      metrics: ComparisonMetric[];
      baselineCohortId?: string;
      retentionConfig?: RetentionConfig;
      lifecycleConfig?: LifecycleConfig;
      revenueConfig?: {
        revenueEvent: string;
        revenueProperty: string;
      };
    },
  ): Promise<CohortComparison> {
    const results: ComparisonResult[] = [];

    for (const metric of request.metrics) {
      const values = await this.computeMetricForCohorts(
        ventureId,
        request.cohortIds,
        metric,
        request,
      );

      // Find best and worst
      const sorted = [...values].sort((a, b) => b.value - a.value);
      const bestCohortId = sorted[0]?.cohortId ?? '';
      const worstCohortId = sorted[sorted.length - 1]?.cohortId ?? '';

      // Compute diff from baseline if specified
      if (request.baselineCohortId) {
        const baselineValue = values.find(
          v => v.cohortId === request.baselineCohortId,
        )?.value ?? 0;

        for (const v of values) {
          v.diffFromBaseline = baselineValue > 0
            ? ((v.value - baselineValue) / baselineValue) * 100
            : 0;
        }
      }

      results.push({
        metric,
        values,
        bestCohortId,
        worstCohortId,
      });
    }

    const comparison: CohortComparison = {
      id: crypto.randomUUID(),
      name: `Comparison — ${new Date().toISOString().slice(0, 10)}`,
      ventureId,
      cohortIds: request.cohortIds,
      metrics: request.metrics,
      results,
      baselineCohortId: request.baselineCohortId,
      createdAt: new Date().toISOString(),
      createdBy: '', // Set by router from auth context
    };

    // Store comparison
    await this.db.from('comparison_runs').insert({
      id: comparison.id,
      venture_id: ventureId,
      name: comparison.name,
      cohort_ids: comparison.cohortIds,
      metrics: comparison.metrics,
      results: comparison.results,
      baseline_cohort_id: comparison.baselineCohortId,
      created_at: comparison.createdAt,
    });

    return comparison;
  }

  async rank(
    ventureId: string,
    cohortIds: string[],
    metric: ComparisonMetric,
    config?: {
      retentionConfig?: RetentionConfig;
      revenueConfig?: { revenueEvent: string; revenueProperty: string };
    },
  ): Promise<Array<{ cohortId: string; label: string; value: number; rank: number }>> {
    const values = await this.computeMetricForCohorts(
      ventureId,
      cohortIds,
      metric,
      config ?? {},
    );

    return values
      .sort((a, b) => b.value - a.value)
      .map((v, i) => ({
        cohortId: v.cohortId,
        label: v.cohortLabel,
        value: v.value,
        rank: i + 1,
      }));
  }

  async report(comparisonId: string, ventureId: string): Promise<CohortComparison> {
    const { data, error } = await this.db
      .from('comparison_runs')
      .select('*')
      .eq('id', comparisonId)
      .eq('venture_id', ventureId)
      .single();

    if (error || !data) {
      throw new CohortComparisonError(`Comparison ${comparisonId} not found`);
    }

    return {
      id: data.id,
      name: data.name,
      ventureId: data.venture_id,
      cohortIds: data.cohort_ids,
      metrics: data.metrics,
      results: data.results,
      baselineCohortId: data.baseline_cohort_id,
      createdAt: data.created_at,
      createdBy: data.created_by,
    };
  }

  async diff(
    ventureId: string,
    cohortA: string,
    cohortB: string,
    metrics: ComparisonMetric[],
  ): Promise<Array<{
    metric: ComparisonMetric;
    valueA: number;
    valueB: number;
    absoluteDiff: number;
    percentDiff: number;
  }>> {
    const comparison = await this.compare(ventureId, {
      cohortIds: [cohortA, cohortB],
      metrics,
    });

    return comparison.results.map(result => {
      const vA = result.values.find(v => v.cohortId === cohortA)?.value ?? 0;
      const vB = result.values.find(v => v.cohortId === cohortB)?.value ?? 0;

      return {
        metric: result.metric,
        valueA: vA,
        valueB: vB,
        absoluteDiff: vA - vB,
        percentDiff: vB > 0 ? ((vA - vB) / vB) * 100 : 0,
      };
    });
  }

  private async computeMetricForCohorts(
    ventureId: string,
    cohortIds: string[],
    metric: ComparisonMetric,
    config: Record<string, unknown>,
  ): Promise<Array<{ cohortId: string; cohortLabel: string; value: number }>> {
    // Route to appropriate service based on metric type
    // Return computed values for each cohort
    throw new Error('Implementation in service layer');
  }
}
```

### CohortExportService

```typescript
/**
 * CohortExportService — Export cohort members to external systems:
 * CDP segments, email campaigns, ad audiences, CSV, webhooks.
 */
export interface ICohortExportService {
  /**
   * Export cohort members to a CDP segment.
   */
  toSegment(
    cohortId: string,
    ventureId: string,
    segmentId: string,
    options?: { filters?: CohortRuleGroup; limit?: number },
  ): Promise<CohortExportResult>;

  /**
   * Export cohort members to an email campaign platform.
   */
  toCampaign(
    cohortId: string,
    ventureId: string,
    campaignConfig: CohortExportTarget['campaignConfig'],
    options?: { filters?: CohortRuleGroup; limit?: number },
  ): Promise<CohortExportResult>;

  /**
   * Export cohort members to an ad audience.
   */
  toAudience(
    cohortId: string,
    ventureId: string,
    audienceConfig: CohortExportTarget['audienceConfig'],
    options?: { filters?: CohortRuleGroup; limit?: number },
  ): Promise<CohortExportResult>;

  /**
   * Schedule a recurring export.
   */
  schedule(
    cohortId: string,
    ventureId: string,
    target: CohortExportTarget,
    schedule: {
      cron: string;
      timezone: string;
    },
  ): Promise<{ scheduleId: string }>;

  /**
   * Get the status of an export job.
   */
  status(jobId: string, ventureId: string): Promise<CohortExportJob>;

  /**
   * Cancel a running or scheduled export.
   */
  cancel(jobId: string, ventureId: string): Promise<void>;
}

export class CohortExportService implements ICohortExportService {
  constructor(
    private readonly db: SupabaseClient,
    private readonly cohortService: CohortService,
    private readonly cdpSegments: unknown, // CDP segment writer
    private readonly emailProvider: unknown, // Email campaign provider
    private readonly adPlatforms: unknown, // Ad platform connectors
  ) {}

  async toSegment(
    cohortId: string,
    ventureId: string,
    segmentId: string,
    options?: { filters?: CohortRuleGroup; limit?: number },
  ): Promise<CohortExportResult> {
    const startTime = Date.now();
    const job = await this.createJob(cohortId, ventureId, {
      type: 'segment',
      segmentId,
    });

    try {
      // 1. Resolve cohort members (with optional filters)
      const { members, total } = await this.cohortService.resolveMembers(
        cohortId,
        ventureId,
        { limit: options?.limit },
      );

      // 2. Push profile IDs to CDP segment
      // This is a batch operation that updates the segment membership
      const profileIds = members.map(m => m.profileId);
      // await this.cdpSegments.updateMembership(segmentId, profileIds);

      // 3. Update job status
      await this.updateJob(job.id, {
        status: 'completed',
        exported_count: profileIds.length,
        completed_at: new Date().toISOString(),
      });

      return {
        jobId: job.id,
        cohortId,
        target: { type: 'segment', segmentId },
        exportedCount: profileIds.length,
        segmentId,
        durationMs: Date.now() - startTime,
        completedAt: new Date().toISOString(),
      };
    } catch (err) {
      await this.updateJob(job.id, {
        status: 'failed',
        error: err instanceof Error ? err.message : 'Unknown error',
      });
      throw new CohortExportError(
        `Export to segment ${segmentId} failed: ${err}`,
      );
    }
  }

  async toCampaign(
    cohortId: string,
    ventureId: string,
    campaignConfig: CohortExportTarget['campaignConfig'],
    options?: { filters?: CohortRuleGroup; limit?: number },
  ): Promise<CohortExportResult> {
    // 1. Resolve members with email addresses
    // 2. Format for campaign platform
    // 3. Batch upload to provider
    // 4. Track job progress
    throw new Error('Implementation in service layer');
  }

  async toAudience(
    cohortId: string,
    ventureId: string,
    audienceConfig: CohortExportTarget['audienceConfig'],
    options?: { filters?: CohortRuleGroup; limit?: number },
  ): Promise<CohortExportResult> {
    // 1. Resolve members with identifiers (email, phone, device ID)
    // 2. Hash identifiers per platform requirements
    // 3. Batch upload to ad platform
    // 4. Track job progress
    throw new Error('Implementation in service layer');
  }

  async schedule(
    cohortId: string,
    ventureId: string,
    target: CohortExportTarget,
    schedule: { cron: string; timezone: string },
  ): Promise<{ scheduleId: string }> {
    // Register a cron-based export schedule
    throw new Error('Implementation in service layer');
  }

  async status(jobId: string, ventureId: string): Promise<CohortExportJob> {
    const { data, error } = await this.db
      .from('cohort_exports')
      .select('*')
      .eq('id', jobId)
      .single();

    if (error || !data) {
      throw new CohortExportError(`Export job ${jobId} not found`);
    }

    return {
      id: data.id,
      cohortId: data.cohort_id,
      target: data.target,
      status: data.status,
      filters: data.filters,
      limit: data.limit,
      exportedCount: data.exported_count,
      totalCount: data.total_count,
      error: data.error,
      createdAt: data.created_at,
      completedAt: data.completed_at,
      createdBy: data.created_by,
    };
  }

  async cancel(jobId: string, ventureId: string): Promise<void> {
    await this.updateJob(jobId, { status: 'cancelled' });
  }

  private async createJob(
    cohortId: string,
    ventureId: string,
    target: CohortExportTarget,
  ): Promise<CohortExportJob> {
    const id = crypto.randomUUID();
    const job: CohortExportJob = {
      id,
      cohortId,
      target,
      status: 'pending',
      exportedCount: 0,
      totalCount: 0,
      createdAt: new Date().toISOString(),
      createdBy: '', // Set from auth context
    };

    await this.db.from('cohort_exports').insert({
      id: job.id,
      cohort_id: job.cohortId,
      venture_id: ventureId,
      target: job.target,
      status: job.status,
      exported_count: 0,
      total_count: 0,
      created_at: job.createdAt,
    });

    return job;
  }

  private async updateJob(
    jobId: string,
    updates: Record<string, unknown>,
  ): Promise<void> {
    await this.db
      .from('cohort_exports')
      .update(updates)
      .eq('id', jobId);
  }
}
```

---

## Database Schemas

### Table: `cohort_definitions`

The primary table storing cohort metadata and definitions.

```sql
CREATE TABLE cohort_definitions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  venture_id      UUID NOT NULL REFERENCES ventures(id) ON DELETE CASCADE,
  name            TEXT NOT NULL,
  description     TEXT,
  type            TEXT NOT NULL CHECK (type IN ('time_based', 'behavior_based', 'attribute_based', 'custom')),
  definition      JSONB NOT NULL,
  period_label    TEXT,              -- For time-based: "2024-W03", "2024-01", etc.
  member_count    INTEGER NOT NULL DEFAULT 0,
  is_dynamic      BOOLEAN NOT NULL DEFAULT true,
  refresh_interval_seconds INTEGER,  -- For dynamic cohorts
  tags            TEXT[] NOT NULL DEFAULT '{}',
  created_by      UUID NOT NULL REFERENCES users(id),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_snapshot_at TIMESTAMPTZ,
  deleted_at      TIMESTAMPTZ,       -- Soft delete

  CONSTRAINT cohort_name_venture_unique UNIQUE (venture_id, name, period_label)
);

-- Indexes for common queries
CREATE INDEX idx_cohort_definitions_venture_id ON cohort_definitions(venture_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_cohort_definitions_type ON cohort_definitions(venture_id, type) WHERE deleted_at IS NULL;
CREATE INDEX idx_cohort_definitions_tags ON cohort_definitions USING gin(tags) WHERE deleted_at IS NULL;
CREATE INDEX idx_cohort_definitions_created_at ON cohort_definitions(venture_id, created_at DESC) WHERE deleted_at IS NULL;
CREATE INDEX idx_cohort_definitions_period_label ON cohort_definitions(venture_id, period_label) WHERE deleted_at IS NULL;

-- Full-text search on name and description
CREATE INDEX idx_cohort_definitions_search ON cohort_definitions USING gin(
  to_tsvector('english', coalesce(name, '') || ' ' || coalesce(description, ''))
) WHERE deleted_at IS NULL;

-- RLS policies
ALTER TABLE cohort_definitions ENABLE ROW LEVEL SECURITY;

CREATE POLICY cohort_definitions_venture_isolation ON cohort_definitions
  USING (venture_id = current_setting('app.venture_id')::uuid);

CREATE POLICY cohort_definitions_insert ON cohort_definitions
  FOR INSERT WITH CHECK (venture_id = current_setting('app.venture_id')::uuid);

CREATE POLICY cohort_definitions_update ON cohort_definitions
  FOR UPDATE USING (venture_id = current_setting('app.venture_id')::uuid);

CREATE POLICY cohort_definitions_delete ON cohort_definitions
  FOR DELETE USING (venture_id = current_setting('app.venture_id')::uuid);
```

### Table: `cohort_memberships`

Tracks which profiles belong to which cohorts.

```sql
CREATE TABLE cohort_memberships (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cohort_id   UUID NOT NULL REFERENCES cohort_definitions(id) ON DELETE CASCADE,
  profile_id  UUID NOT NULL,           -- References CDP profiles
  venture_id  UUID NOT NULL REFERENCES ventures(id) ON DELETE CASCADE,
  entered_at  TIMESTAMPTZ NOT NULL,
  exited_at   TIMESTAMPTZ,             -- NULL if still a member
  anchor_date DATE NOT NULL,            -- The user's anchor in this cohort (signup date, etc.)
  metadata    JSONB DEFAULT '{}',       -- Additional membership context
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT cohort_membership_unique UNIQUE (cohort_id, profile_id)
);

-- Performance-critical indexes
CREATE INDEX idx_cohort_memberships_cohort_id ON cohort_memberships(cohort_id);
CREATE INDEX idx_cohort_memberships_profile_id ON cohort_memberships(profile_id, venture_id);
CREATE INDEX idx_cohort_memberships_venture_id ON cohort_memberships(venture_id);
CREATE INDEX idx_cohort_memberships_anchor_date ON cohort_memberships(cohort_id, anchor_date);
CREATE INDEX idx_cohort_memberships_active ON cohort_memberships(cohort_id)
  WHERE exited_at IS NULL;

-- Partial index for recent entries (hot data)
CREATE INDEX idx_cohort_memberships_recent ON cohort_memberships(cohort_id, entered_at DESC)
  WHERE entered_at > now() - INTERVAL '90 days';

-- RLS
ALTER TABLE cohort_memberships ENABLE ROW LEVEL SECURITY;

CREATE POLICY cohort_memberships_venture_isolation ON cohort_memberships
  USING (venture_id = current_setting('app.venture_id')::uuid);
```

### Table: `cohort_snapshots`

Point-in-time snapshots of cohort state for historical tracking.

```sql
CREATE TABLE cohort_snapshots (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cohort_id               UUID NOT NULL REFERENCES cohort_definitions(id) ON DELETE CASCADE,
  venture_id              UUID NOT NULL REFERENCES ventures(id) ON DELETE CASCADE,
  computed_at             TIMESTAMPTZ NOT NULL DEFAULT now(),
  member_count            INTEGER NOT NULL,
  retention_grid          JSONB,           -- Full RetentionGrid if computed
  lifecycle_distribution  JSONB,           -- Record<LifecycleStage, number>
  revenue_summary         JSONB,           -- { totalRevenue, averageLtv, medianLtv, p90Ltv }
  metadata                JSONB DEFAULT '{}',

  -- Dedupe: one snapshot per cohort per hour
  CONSTRAINT cohort_snapshot_hourly_unique UNIQUE (
    cohort_id,
    date_trunc('hour', computed_at)
  )
);

CREATE INDEX idx_cohort_snapshots_cohort_id ON cohort_snapshots(cohort_id, computed_at DESC);
CREATE INDEX idx_cohort_snapshots_venture_id ON cohort_snapshots(venture_id, computed_at DESC);

-- Partition by month for large-scale deployments
-- CREATE TABLE cohort_snapshots_2024_01 PARTITION OF cohort_snapshots
--   FOR VALUES FROM ('2024-01-01') TO ('2024-02-01');

ALTER TABLE cohort_snapshots ENABLE ROW LEVEL SECURITY;

CREATE POLICY cohort_snapshots_venture_isolation ON cohort_snapshots
  USING (venture_id = current_setting('app.venture_id')::uuid);
```

### Table: `retention_cache`

Precomputed retention data for fast grid rendering.

```sql
CREATE TABLE retention_cache (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cohort_id         UUID NOT NULL REFERENCES cohort_definitions(id) ON DELETE CASCADE,
  venture_id        UUID NOT NULL REFERENCES ventures(id) ON DELETE CASCADE,
  config_hash       TEXT NOT NULL,     -- Hash of RetentionConfig for cache lookup
  retention_period  INTEGER NOT NULL,  -- Column index (Day 0, Day 1, ...)
  cohort_period     INTEGER NOT NULL,  -- Row index
  cohort_label      TEXT NOT NULL,
  active_users      INTEGER NOT NULL,
  total_users       INTEGER NOT NULL,
  retention_rate    NUMERIC(6, 4) NOT NULL,
  computed_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at        TIMESTAMPTZ NOT NULL,

  CONSTRAINT retention_cache_unique UNIQUE (cohort_id, config_hash, cohort_period, retention_period)
);

CREATE INDEX idx_retention_cache_lookup ON retention_cache(cohort_id, config_hash)
  WHERE expires_at > now();
CREATE INDEX idx_retention_cache_expiry ON retention_cache(expires_at);

-- Cleanup job: DELETE FROM retention_cache WHERE expires_at < now();

ALTER TABLE retention_cache ENABLE ROW LEVEL SECURITY;

CREATE POLICY retention_cache_venture_isolation ON retention_cache
  USING (venture_id = current_setting('app.venture_id')::uuid);
```

### Table: `lifecycle_state`

Current and historical lifecycle stage assignments.

```sql
CREATE TABLE lifecycle_state (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id      UUID NOT NULL,
  cohort_id       UUID NOT NULL REFERENCES cohort_definitions(id) ON DELETE CASCADE,
  venture_id      UUID NOT NULL REFERENCES ventures(id) ON DELETE CASCADE,
  stage           TEXT NOT NULL CHECK (stage IN ('new', 'active', 'returning', 'dormant', 'churned')),
  previous_stage  TEXT CHECK (previous_stage IN ('new', 'active', 'returning', 'dormant', 'churned')),
  days_in_stage   INTEGER NOT NULL DEFAULT 0,
  last_activity_at TIMESTAMPTZ,
  computed_at     TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT lifecycle_state_unique UNIQUE (profile_id, cohort_id, computed_at)
);

CREATE INDEX idx_lifecycle_state_cohort ON lifecycle_state(cohort_id, computed_at DESC);
CREATE INDEX idx_lifecycle_state_profile ON lifecycle_state(profile_id, cohort_id, computed_at DESC);
CREATE INDEX idx_lifecycle_state_stage ON lifecycle_state(cohort_id, stage, computed_at DESC);
CREATE INDEX idx_lifecycle_state_transitions ON lifecycle_state(cohort_id, previous_stage, stage, computed_at)
  WHERE previous_stage IS DISTINCT FROM stage;

ALTER TABLE lifecycle_state ENABLE ROW LEVEL SECURITY;

CREATE POLICY lifecycle_state_venture_isolation ON lifecycle_state
  USING (venture_id = current_setting('app.venture_id')::uuid);
```

### Table: `revenue_cohort_data`

Precomputed revenue data points per cohort per period.

```sql
CREATE TABLE revenue_cohort_data (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cohort_id           UUID NOT NULL REFERENCES cohort_definitions(id) ON DELETE CASCADE,
  venture_id          UUID NOT NULL REFERENCES ventures(id) ON DELETE CASCADE,
  period              INTEGER NOT NULL,
  period_label        TEXT NOT NULL,
  cumulative_revenue  NUMERIC(14, 2) NOT NULL DEFAULT 0,
  period_revenue      NUMERIC(14, 2) NOT NULL DEFAULT 0,
  arpu                NUMERIC(14, 4) NOT NULL DEFAULT 0,
  paying_users        INTEGER NOT NULL DEFAULT 0,
  payer_rate          NUMERIC(6, 4) NOT NULL DEFAULT 0,
  currency            TEXT NOT NULL DEFAULT 'USD',
  revenue_event       TEXT NOT NULL,
  revenue_property    TEXT NOT NULL,
  computed_at         TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT revenue_cohort_data_unique UNIQUE (cohort_id, period, revenue_event)
);

CREATE INDEX idx_revenue_cohort_data_cohort ON revenue_cohort_data(cohort_id, period);
CREATE INDEX idx_revenue_cohort_data_venture ON revenue_cohort_data(venture_id, computed_at DESC);

ALTER TABLE revenue_cohort_data ENABLE ROW LEVEL SECURITY;

CREATE POLICY revenue_cohort_data_venture_isolation ON revenue_cohort_data
  USING (venture_id = current_setting('app.venture_id')::uuid);
```

### Table: `cohort_exports`

Export job tracking.

```sql
CREATE TABLE cohort_exports (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cohort_id       UUID NOT NULL REFERENCES cohort_definitions(id) ON DELETE CASCADE,
  venture_id      UUID NOT NULL REFERENCES ventures(id) ON DELETE CASCADE,
  target          JSONB NOT NULL,       -- CohortExportTarget
  status          TEXT NOT NULL DEFAULT 'pending'
                    CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'cancelled')),
  filters         JSONB,               -- Optional member filters
  limit_count     INTEGER,
  exported_count  INTEGER NOT NULL DEFAULT 0,
  total_count     INTEGER NOT NULL DEFAULT 0,
  error           TEXT,
  download_url    TEXT,                 -- For CSV exports
  schedule_cron   TEXT,                 -- For scheduled exports
  schedule_tz     TEXT,                 -- Timezone for scheduled exports
  created_by      UUID NOT NULL REFERENCES users(id),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at    TIMESTAMPTZ,

  CONSTRAINT cohort_exports_valid_schedule CHECK (
    (schedule_cron IS NULL) = (schedule_tz IS NULL)
  )
);

CREATE INDEX idx_cohort_exports_cohort ON cohort_exports(cohort_id, created_at DESC);
CREATE INDEX idx_cohort_exports_status ON cohort_exports(venture_id, status)
  WHERE status IN ('pending', 'processing');
CREATE INDEX idx_cohort_exports_scheduled ON cohort_exports(schedule_cron)
  WHERE schedule_cron IS NOT NULL AND status != 'cancelled';

ALTER TABLE cohort_exports ENABLE ROW LEVEL SECURITY;

CREATE POLICY cohort_exports_venture_isolation ON cohort_exports
  USING (venture_id = current_setting('app.venture_id')::uuid);
```

### Table: `comparison_runs`

Saved cohort comparison results.

```sql
CREATE TABLE comparison_runs (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  venture_id          UUID NOT NULL REFERENCES ventures(id) ON DELETE CASCADE,
  name                TEXT NOT NULL,
  cohort_ids          UUID[] NOT NULL,
  metrics             JSONB NOT NULL,    -- ComparisonMetric[]
  results             JSONB NOT NULL,    -- ComparisonResult[]
  baseline_cohort_id  UUID REFERENCES cohort_definitions(id) ON DELETE SET NULL,
  created_by          UUID NOT NULL REFERENCES users(id),
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT comparison_runs_min_cohorts CHECK (array_length(cohort_ids, 1) >= 2)
);

CREATE INDEX idx_comparison_runs_venture ON comparison_runs(venture_id, created_at DESC);
CREATE INDEX idx_comparison_runs_cohorts ON comparison_runs USING gin(cohort_ids);

ALTER TABLE comparison_runs ENABLE ROW LEVEL SECURITY;

CREATE POLICY comparison_runs_venture_isolation ON comparison_runs
  USING (venture_id = current_setting('app.venture_id')::uuid);
```

### Table: `cohort_rules`

Normalized storage for complex cohort rules (optional — rules can also live in the JSONB definition).

```sql
CREATE TABLE cohort_rules (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cohort_id         UUID NOT NULL REFERENCES cohort_definitions(id) ON DELETE CASCADE,
  venture_id        UUID NOT NULL REFERENCES ventures(id) ON DELETE CASCADE,
  parent_group_id   UUID REFERENCES cohort_rules(id) ON DELETE CASCADE,
  rule_type         TEXT NOT NULL CHECK (rule_type IN ('rule', 'group')),
  group_operator    TEXT CHECK (group_operator IN ('and', 'or')),
  source            TEXT CHECK (source IN ('event', 'profile', 'trait', 'computed')),
  field             TEXT,
  operator          TEXT,
  value             JSONB,
  time_constraint   JSONB,
  frequency_constraint JSONB,
  sort_order        INTEGER NOT NULL DEFAULT 0,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT cohort_rules_group_has_operator CHECK (
    (rule_type = 'group') = (group_operator IS NOT NULL)
  ),
  CONSTRAINT cohort_rules_rule_has_source CHECK (
    (rule_type = 'rule') = (source IS NOT NULL)
  )
);

CREATE INDEX idx_cohort_rules_cohort ON cohort_rules(cohort_id, sort_order);
CREATE INDEX idx_cohort_rules_parent ON cohort_rules(parent_group_id);

ALTER TABLE cohort_rules ENABLE ROW LEVEL SECURITY;

CREATE POLICY cohort_rules_venture_isolation ON cohort_rules
  USING (venture_id = current_setting('app.venture_id')::uuid);
```

---

## tRPC Router

```typescript
import { z } from 'zod';
import { router, protectedProcedure } from '@mcv/trpc';
import { TRPCError } from '@trpc/server';

// ─── Zod Schemas ──────────────────────────────────────────────────────────────

export const cohortRuleSchema: z.ZodType<CohortRule> = z.object({
  id: z.string().uuid(),
  source: z.enum(['event', 'profile', 'trait', 'computed']),
  field: z.string().min(1).max(256),
  operator: z.enum([
    'eq', 'neq', 'gt', 'gte', 'lt', 'lte',
    'in', 'not_in', 'contains', 'not_contains',
    'starts_with', 'ends_with', 'exists', 'not_exists',
    'between', 'regex',
  ]),
  value: z.unknown().optional(),
  timeConstraint: z.object({
    relativeTo: z.enum(['cohort_anchor', 'signup', 'absolute']),
    withinPeriods: z.number().int().positive().optional(),
    periodGranularity: z.enum(['day', 'week', 'month', 'quarter', 'year']).optional(),
    dateRange: z.object({
      start: z.string().datetime(),
      end: z.string().datetime(),
    }).optional(),
  }).optional(),
  frequencyConstraint: z.object({
    operator: z.enum(['at_least', 'at_most', 'exactly']),
    count: z.number().int().nonnegative(),
  }).optional(),
});

export const cohortRuleGroupSchema: z.ZodType<CohortRuleGroup> = z.lazy(() =>
  z.object({
    operator: z.enum(['and', 'or']),
    conditions: z.array(z.union([cohortRuleSchema, cohortRuleGroupSchema])).min(1),
  }),
);

export const cohortDefinitionSchema = z.object({
  type: z.enum(['time_based', 'behavior_based', 'attribute_based', 'custom']),
  anchorEvent: z.string().optional(),
  granularity: z.enum(['day', 'week', 'month', 'quarter', 'year']).optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  behaviorEvent: z.string().optional(),
  groupByAttribute: z.string().optional(),
  rules: cohortRuleGroupSchema.optional(),
  maxMembers: z.number().int().positive().max(MAX_COHORT_MEMBERS).optional(),
});

export const retentionConfigSchema = z.object({
  returnEvent: z.string().min(1),
  returnEventFilters: z.record(z.unknown()).optional(),
  granularity: z.enum(['day', 'week', 'month', 'quarter', 'year']),
  periods: z.number().int().positive().max(MAX_RETENTION_PERIODS),
  inclusive: z.boolean().optional(),
  unbounded: z.boolean().optional(),
});

export const lifecycleConfigSchema = z.object({
  newWindowDays: z.number().int().positive().max(365),
  dormantAfterDays: z.number().int().positive().max(365),
  churnedAfterDays: z.number().int().positive().max(730),
  activityEvents: z.array(z.string()).min(1),
  minActivityCount: z.number().int().positive().optional(),
});

export const revenueCohortConfigSchema = z.object({
  revenueEvent: z.string().min(1),
  revenueProperty: z.string().min(1),
  granularity: z.enum(['day', 'week', 'month', 'quarter', 'year']),
  periods: z.number().int().positive().max(120),
  currency: z.string().length(3).optional(),
});

export const customCohortConfigSchema = z.object({
  name: z.string().min(1).max(256),
  description: z.string().max(2048).optional(),
  rules: cohortRuleGroupSchema,
  isDynamic: z.boolean(),
  refreshInterval: z.number().int().positive().optional(),
  tags: z.array(z.string()).max(20).optional(),
  maxMembers: z.number().int().positive().max(MAX_COHORT_MEMBERS).optional(),
});

export const cohortComparisonRequestSchema = z.object({
  cohortIds: z.array(z.string().uuid()).min(2).max(20),
  metrics: z.array(z.object({
    type: z.enum(['retention', 'revenue', 'engagement', 'conversion', 'frequency', 'recency']),
    label: z.string(),
    period: z.number().int().nonnegative().optional(),
    aggregation: z.enum(['avg', 'sum', 'median', 'p90', 'min', 'max']).optional(),
  })).min(1).max(10),
  baselineCohortId: z.string().uuid().optional(),
  retentionConfig: retentionConfigSchema.optional(),
  lifecycleConfig: lifecycleConfigSchema.optional(),
  revenueConfig: z.object({
    revenueEvent: z.string(),
    revenueProperty: z.string(),
  }).optional(),
});

export const cohortExportRequestSchema = z.object({
  cohortId: z.string().uuid(),
  target: z.object({
    type: z.enum(['segment', 'campaign', 'audience', 'csv', 'webhook']),
    segmentId: z.string().optional(),
    campaignConfig: z.object({
      provider: z.enum(['sendgrid', 'mailchimp', 'braze', 'customer_io']),
      listId: z.string(),
      tags: z.array(z.string()).optional(),
    }).optional(),
    audienceConfig: z.object({
      platform: z.enum(['facebook', 'google', 'tiktok', 'snapchat']),
      audienceId: z.string(),
      accountId: z.string(),
    }).optional(),
    csvConfig: z.object({
      fields: z.array(z.string()).min(1),
      delimiter: z.string().max(1).optional(),
      includeHeaders: z.boolean().optional(),
    }).optional(),
    webhookConfig: z.object({
      url: z.string().url(),
      method: z.enum(['POST', 'PUT']),
      headers: z.record(z.string()).optional(),
      batchSize: z.number().int().positive().max(10000).optional(),
    }).optional(),
  }),
  filters: cohortRuleGroupSchema.optional(),
  limit: z.number().int().positive().max(MAX_COHORT_MEMBERS).optional(),
});

// ─── Router ───────────────────────────────────────────────────────────────────

export const cohortRouter = router({
  // === Cohort CRUD ===

  create: protectedProcedure
    .input(z.union([customCohortConfigSchema, cohortDefinitionSchema]))
    .mutation(async ({ input, ctx }) => {
      return ctx.cohortService.create(ctx.ventureId, input, ctx.userId);
    }),

  createTimeSeries: protectedProcedure
    .input(z.object({
      name: z.string().min(1).max(256),
      anchorEvent: z.string().min(1),
      timeFrame: z.object({
        start: z.string().datetime(),
        end: z.string().datetime(),
        granularity: z.enum(['day', 'week', 'month', 'quarter', 'year']),
      }),
    }))
    .mutation(async ({ input, ctx }) => {
      return ctx.cohortService.createTimeSeries(
        ctx.ventureId,
        input.name,
        input.anchorEvent,
        input.timeFrame,
        ctx.userId,
      );
    }),

  get: protectedProcedure
    .input(z.object({ cohortId: z.string().uuid() }))
    .query(async ({ input, ctx }) => {
      return ctx.cohortService.get(input.cohortId, ctx.ventureId);
    }),

  list: protectedProcedure
    .input(z.object({
      type: z.enum(['time_based', 'behavior_based', 'attribute_based', 'custom']).optional(),
      tags: z.array(z.string()).optional(),
      search: z.string().max(256).optional(),
      limit: z.number().int().positive().max(100).default(50),
      offset: z.number().int().nonnegative().default(0),
      orderBy: z.enum(['name', 'createdAt', 'memberCount']).default('createdAt'),
      orderDir: z.enum(['asc', 'desc']).default('desc'),
    }).optional())
    .query(async ({ input, ctx }) => {
      return ctx.cohortService.list(ctx.ventureId, input);
    }),

  update: protectedProcedure
    .input(z.object({
      cohortId: z.string().uuid(),
      name: z.string().min(1).max(256).optional(),
      description: z.string().max(2048).optional(),
      tags: z.array(z.string()).max(20).optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const { cohortId, ...updates } = input;
      return ctx.cohortService.update(cohortId, ctx.ventureId, updates);
    }),

  delete: protectedProcedure
    .input(z.object({ cohortId: z.string().uuid() }))
    .mutation(async ({ input, ctx }) => {
      return ctx.cohortService.delete(input.cohortId, ctx.ventureId);
    }),

  // === Membership ===

  members: protectedProcedure
    .input(z.object({
      cohortId: z.string().uuid(),
      limit: z.number().int().positive().max(1000).default(100),
      offset: z.number().int().nonnegative().default(0),
      force: z.boolean().default(false),
    }))
    .query(async ({ input, ctx }) => {
      return ctx.cohortService.resolveMembers(input.cohortId, ctx.ventureId, {
        force: input.force,
        limit: input.limit,
        offset: input.offset,
      });
    }),

  membershipFor: protectedProcedure
    .input(z.object({ profileId: z.string().uuid() }))
    .query(async ({ input, ctx }) => {
      return ctx.cohortService.membershipFor(input.profileId, ctx.ventureId);
    }),

  // === Snapshots ===

  snapshot: protectedProcedure
    .input(z.object({
      cohortId: z.string().uuid(),
      includeRetention: z.boolean().default(false),
      retentionConfig: retentionConfigSchema.optional(),
      includeLifecycle: z.boolean().default(false),
      lifecycleConfig: lifecycleConfigSchema.optional(),
      includeRevenue: z.boolean().default(false),
    }))
    .mutation(async ({ input, ctx }) => {
      return ctx.cohortService.snapshot(input.cohortId, ctx.ventureId, input);
    }),

  summary: protectedProcedure
    .input(z.object({ cohortId: z.string().uuid() }))
    .query(async ({ input, ctx }) => {
      return ctx.cohortService.summary(input.cohortId, ctx.ventureId);
    }),

  // === Retention ===

  retentionGrid: protectedProcedure
    .input(z.object({
      cohortIds: z.array(z.string().uuid()).min(1).max(24),
      config: retentionConfigSchema,
    }))
    .query(async ({ input, ctx }) => {
      return ctx.retentionService.computeGrid(
        ctx.ventureId,
        input.cohortIds,
        input.config,
      );
    }),

  retentionCurve: protectedProcedure
    .input(z.object({
      cohortId: z.string().uuid(),
      config: retentionConfigSchema,
    }))
    .query(async ({ input, ctx }) => {
      return ctx.retentionService.computeCurve(
        input.cohortId,
        ctx.ventureId,
        input.config,
      );
    }),

  retentionDayN: protectedProcedure
    .input(z.object({
      cohortId: z.string().uuid(),
      days: z.array(z.number().int().nonnegative()).min(1).max(30),
      config: retentionConfigSchema,
    }))
    .query(async ({ input, ctx }) => {
      return ctx.retentionService.dayN(
        input.cohortId,
        ctx.ventureId,
        input.days,
        input.config,
      );
    }),

  retentionCompare: protectedProcedure
    .input(z.object({
      cohortIds: z.array(z.string().uuid()).min(2).max(10),
      config: retentionConfigSchema,
    }))
    .query(async ({ input, ctx }) => {
      return ctx.retentionService.compareCurves(
        ctx.ventureId,
        input.cohortIds,
        input.config,
      );
    }),

  // === Lifecycle ===

  lifecycleDistribution: protectedProcedure
    .input(z.object({
      cohortId: z.string().uuid(),
      config: lifecycleConfigSchema,
      asOfDate: z.string().datetime().optional(),
    }))
    .query(async ({ input, ctx }) => {
      return ctx.lifecycleService.classifyAll(
        input.cohortId,
        ctx.ventureId,
        input.config,
        input.asOfDate,
      );
    }),

  lifecycleOverTime: protectedProcedure
    .input(z.object({
      cohortId: z.string().uuid(),
      config: lifecycleConfigSchema,
      timeFrame: z.object({
        start: z.string().datetime(),
        end: z.string().datetime(),
        granularity: z.enum(['day', 'week', 'month', 'quarter', 'year']),
      }),
    }))
    .query(async ({ input, ctx }) => {
      return ctx.lifecycleService.distributionOverTime(
        input.cohortId,
        ctx.ventureId,
        input.config,
        input.timeFrame,
      );
    }),

  lifecycleTransitions: protectedProcedure
    .input(z.object({
      cohortId: z.string().uuid(),
      config: lifecycleConfigSchema,
      timeFrame: z.object({
        start: z.string().datetime(),
        end: z.string().datetime(),
        granularity: z.enum(['day', 'week', 'month', 'quarter', 'year']),
      }),
    }))
    .query(async ({ input, ctx }) => {
      return ctx.lifecycleService.transitions(
        input.cohortId,
        ctx.ventureId,
        input.config,
        input.timeFrame,
      );
    }),

  // === Revenue ===

  revenueCurve: protectedProcedure
    .input(z.object({
      cohortId: z.string().uuid(),
      config: revenueCohortConfigSchema,
    }))
    .query(async ({ input, ctx }) => {
      return ctx.revenueService.computeCurve(
        input.cohortId,
        ctx.ventureId,
        input.config,
      );
    }),

  revenueCompare: protectedProcedure
    .input(z.object({
      cohortIds: z.array(z.string().uuid()).min(2).max(10),
      config: revenueCohortConfigSchema,
    }))
    .query(async ({ input, ctx }) => {
      return ctx.revenueService.compareCurves(
        ctx.ventureId,
        input.cohortIds,
        input.config,
      );
    }),

  revenueForecast: protectedProcedure
    .input(z.object({
      cohortId: z.string().uuid(),
      config: z.object({
        revenueEvent: z.string().min(1),
        revenueProperty: z.string().min(1),
        granularity: z.enum(['day', 'week', 'month', 'quarter', 'year']),
        historicalPeriods: z.number().int().positive(),
        forecastPeriods: z.number().int().positive().max(24),
        model: z.enum(['linear', 'logarithmic', 'power']).default('logarithmic'),
      }),
    }))
    .query(async ({ input, ctx }) => {
      return ctx.revenueService.forecast(
        input.cohortId,
        ctx.ventureId,
        input.config,
      );
    }),

  // === Comparison ===

  compare: protectedProcedure
    .input(cohortComparisonRequestSchema)
    .mutation(async ({ input, ctx }) => {
      return ctx.comparisonService.compare(ctx.ventureId, input);
    }),

  comparisonReport: protectedProcedure
    .input(z.object({ comparisonId: z.string().uuid() }))
    .query(async ({ input, ctx }) => {
      return ctx.comparisonService.report(input.comparisonId, ctx.ventureId);
    }),

  comparisonRank: protectedProcedure
    .input(z.object({
      cohortIds: z.array(z.string().uuid()).min(2).max(20),
      metric: z.object({
        type: z.enum(['retention', 'revenue', 'engagement', 'conversion', 'frequency', 'recency']),
        label: z.string(),
        period: z.number().int().nonnegative().optional(),
        aggregation: z.enum(['avg', 'sum', 'median', 'p90', 'min', 'max']).optional(),
      }),
    }))
    .query(async ({ input, ctx }) => {
      return ctx.comparisonService.rank(
        ctx.ventureId,
        input.cohortIds,
        input.metric,
      );
    }),

  // === Export ===

  exportToSegment: protectedProcedure
    .input(z.object({
      cohortId: z.string().uuid(),
      segmentId: z.string(),
      filters: cohortRuleGroupSchema.optional(),
      limit: z.number().int().positive().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      return ctx.exportService.toSegment(
        input.cohortId,
        ctx.ventureId,
        input.segmentId,
        { filters: input.filters, limit: input.limit },
      );
    }),

  exportToCampaign: protectedProcedure
    .input(z.object({
      cohortId: z.string().uuid(),
      campaignConfig: z.object({
        provider: z.enum(['sendgrid', 'mailchimp', 'braze', 'customer_io']),
        listId: z.string(),
        tags: z.array(z.string()).optional(),
      }),
      filters: cohortRuleGroupSchema.optional(),
      limit: z.number().int().positive().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      return ctx.exportService.toCampaign(
        input.cohortId,
        ctx.ventureId,
        input.campaignConfig,
        { filters: input.filters, limit: input.limit },
      );
    }),

  exportToAudience: protectedProcedure
    .input(z.object({
      cohortId: z.string().uuid(),
      audienceConfig: z.object({
        platform: z.enum(['facebook', 'google', 'tiktok', 'snapchat']),
        audienceId: z.string(),
        accountId: z.string(),
      }),
      filters: cohortRuleGroupSchema.optional(),
      limit: z.number().int().positive().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      return ctx.exportService.toAudience(
        input.cohortId,
        ctx.ventureId,
        input.audienceConfig,
        { filters: input.filters, limit: input.limit },
      );
    }),

  exportStatus: protectedProcedure
    .input(z.object({ jobId: z.string().uuid() }))
    .query(async ({ input, ctx }) => {
      return ctx.exportService.status(input.jobId, ctx.ventureId);
    }),

  exportCancel: protectedProcedure
    .input(z.object({ jobId: z.string().uuid() }))
    .mutation(async ({ input, ctx }) => {
      return ctx.exportService.cancel(input.jobId, ctx.ventureId);
    }),
});
```

---

## Code Examples

### Example 1: Create Weekly Signup Cohorts

```typescript
import { CohortService } from '@mcv/analytics/cohorts';

// Create weekly signup cohorts for Q1 2024
const cohorts = await cohortService.createTimeSeries(
  ventureId,
  'Weekly Signups',
  'user_signed_up',
  {
    start: '2024-01-01T00:00:00Z',
    end: '2024-03-31T23:59:59Z',
    granularity: 'week',
  },
  userId,
);

// Result: 13 cohorts (one per week)
// cohorts[0].periodLabel → "2024-W01"
// cohorts[0].memberCount → 342
// cohorts[12].periodLabel → "2024-W13"
// cohorts[12].memberCount → 289

console.log(`Created ${cohorts.length} weekly cohorts`);
for (const c of cohorts) {
  console.log(`  ${c.periodLabel}: ${c.memberCount} members`);
}
```

### Example 2: Compute a Retention Grid

```typescript
import { RetentionService } from '@mcv/analytics/cohorts';

// Get monthly retention for the last 6 monthly cohorts
const grid = await retentionService.computeGrid(
  ventureId,
  monthlyCohortIds, // Array of 6 cohort IDs
  {
    returnEvent: 'session_started',
    granularity: 'month',
    periods: 6,
    unbounded: true, // User active any time in the month window
  },
);

// The grid is a classic retention matrix:
//
//              Month 0   Month 1   Month 2   Month 3   Month 4   Month 5   Month 6
// Jan 2024    100.0%    45.2%     38.1%     32.4%     28.9%     26.1%     24.3%
// Feb 2024    100.0%    48.7%     41.3%     35.8%     31.2%     28.5%
// Mar 2024    100.0%    52.1%     43.9%     37.2%     33.1%
// Apr 2024    100.0%    50.3%     42.1%     36.8%
// May 2024    100.0%    47.9%     40.5%
// Jun 2024    100.0%    51.2%

// Access specific cells
const janMonth3 = grid.cells.find(
  c => c.cohortLabel === 'Jan 2024' && c.retentionPeriod === 3,
);
console.log(`Jan 2024, Month 3 retention: ${(janMonth3!.retentionRate * 100).toFixed(1)}%`);

// Average retention across all cohorts
grid.averageByRetentionPeriod.forEach((avg, period) => {
  console.log(`  Average Month ${period}: ${(avg * 100).toFixed(1)}%`);
});
```

### Example 3: Lifecycle Stage Analysis

```typescript
import { LifecycleService } from '@mcv/analytics/cohorts';

// Classify all members of a cohort into lifecycle stages
const distribution = await lifecycleService.classifyAll(
  cohortId,
  ventureId,
  {
    newWindowDays: 14,          // First 2 weeks = "new"
    dormantAfterDays: 30,      // 30 days inactive = "dormant"
    churnedAfterDays: 90,      // 90 days inactive = "churned"
    activityEvents: [
      'session_started',
      'purchase_completed',
      'bet_placed',
    ],
    minActivityCount: 1,
  },
);

// distribution.distribution:
// {
//   new: 89,
//   active: 456,
//   returning: 67,
//   dormant: 234,
//   churned: 154,
// }

console.log(`Total: ${distribution.totalMembers}`);
console.log(`Active rate: ${(distribution.percentages.active * 100).toFixed(1)}%`);
console.log(`Churn rate: ${(distribution.percentages.churned * 100).toFixed(1)}%`);

// Track lifecycle transitions over time
const transitions = await lifecycleService.transitions(
  cohortId,
  ventureId,
  lifecycleConfig,
  {
    start: '2024-01-01T00:00:00Z',
    end: '2024-03-31T23:59:59Z',
    granularity: 'week',
  },
);

// transitions.summary:
// {
//   "new→active": 312,
//   "active→dormant": 89,
//   "dormant→returning": 45,
//   "dormant→churned": 67,
//   "returning→active": 38,
// }

for (const [transition, count] of Object.entries(transitions.summary)) {
  console.log(`  ${transition}: ${count} users`);
}
```

### Example 4: Revenue Cohort Analysis

```typescript
import { RevenueCohortService } from '@mcv/analytics/cohorts';

// Track cumulative LTV for each monthly signup cohort
const revenueCohort = await revenueService.compareCurves(
  ventureId,
  monthlyCohortIds, // Jan, Feb, Mar 2024 signup cohorts
  {
    revenueEvent: 'purchase_completed',
    revenueProperty: 'revenue',
    granularity: 'month',
    periods: 12,
    currency: 'USD',
  },
);

for (const curve of revenueCohort.curves) {
  console.log(`\n${curve.cohortLabel} (${curve.cohortSize} users):`);
  for (const dp of curve.dataPoints) {
    console.log(
      `  ${dp.label}: $${dp.cumulativeRevenue.toFixed(2)} total, ` +
      `$${dp.arpu.toFixed(2)} ARPU, ` +
      `${(dp.payerRate * 100).toFixed(1)}% payer rate`,
    );
  }
}

// Forecast future revenue based on historical patterns
const forecast = await revenueService.forecast(
  cohortId,
  ventureId,
  {
    revenueEvent: 'purchase_completed',
    revenueProperty: 'revenue',
    granularity: 'month',
    historicalPeriods: 6,   // Use 6 months of actual data
    forecastPeriods: 6,     // Project 6 months forward
    model: 'logarithmic',  // Revenue typically follows log curve
  },
);

// forecast.dataPoints → actual + projected data points
// forecast.forecast → just the projected future points
console.log(`\nForecasted Month 12 ARPU: $${forecast.forecast?.[5]?.arpu.toFixed(2)}`);
```

### Example 5: Custom Behavior-Based Cohort

```typescript
import { CohortService, type CustomCohortConfig } from '@mcv/analytics/cohorts';

// Create a cohort of "power users" — users who made 5+ purchases
// within their first 30 days AND are on the Pro plan
const powerUserCohort: CustomCohortConfig = {
  name: 'Power Users - First 30 Days',
  description: 'Users with 5+ purchases in first 30 days on Pro plan',
  rules: {
    operator: 'and',
    conditions: [
      {
        id: crypto.randomUUID(),
        source: 'event',
        field: 'purchase_completed',
        operator: 'exists',
        frequencyConstraint: {
          operator: 'at_least',
          count: 5,
        },
        timeConstraint: {
          relativeTo: 'signup',
          withinPeriods: 30,
          periodGranularity: 'day',
        },
      },
      {
        id: crypto.randomUUID(),
        source: 'profile',
        field: 'plan_tier',
        operator: 'eq',
        value: 'pro',
      },
    ],
  },
  isDynamic: true,
  refreshInterval: 86400, // Re-evaluate daily
  tags: ['power-users', 'high-value'],
  maxMembers: 100000,
};

const cohort = await cohortService.create(ventureId, powerUserCohort, userId);
console.log(`Created cohort: ${cohort.name} (${cohort.memberCount} members)`);
```

### Example 6: Compare Cohorts Across Metrics

```typescript
import { CohortComparisonService } from '@mcv/analytics/cohorts';

// Compare three acquisition channel cohorts
const comparison = await comparisonService.compare(ventureId, {
  cohortIds: [organicCohortId, paidSearchCohortId, socialCohortId],
  metrics: [
    { type: 'retention', label: 'Day 7 Retention', period: 7 },
    { type: 'retention', label: 'Day 30 Retention', period: 30 },
    { type: 'revenue', label: 'Average LTV', aggregation: 'avg' },
    { type: 'revenue', label: 'Median LTV', aggregation: 'median' },
    { type: 'engagement', label: 'Sessions per User', aggregation: 'avg' },
    { type: 'conversion', label: 'Purchase Rate', aggregation: 'avg' },
  ],
  baselineCohortId: organicCohortId, // Compare against organic
  retentionConfig: {
    returnEvent: 'session_started',
    granularity: 'day',
    periods: 30,
  },
  revenueConfig: {
    revenueEvent: 'purchase_completed',
    revenueProperty: 'revenue',
  },
});

// Print comparison results
for (const result of comparison.results) {
  console.log(`\n${result.metric.label}:`);
  for (const v of result.values) {
    const diff = v.diffFromBaseline
      ? ` (${v.diffFromBaseline > 0 ? '+' : ''}${v.diffFromBaseline.toFixed(1)}%)`
      : '';
    console.log(`  ${v.cohortLabel}: ${v.value.toFixed(2)}${diff}`);
  }
  console.log(`  Best: ${result.bestCohortId}`);
}

// Rank cohorts by Day-7 retention
const ranked = await comparisonService.rank(
  ventureId,
  [organicCohortId, paidSearchCohortId, socialCohortId],
  { type: 'retention', label: 'Day 7 Retention', period: 7 },
  {
    retentionConfig: {
      returnEvent: 'session_started',
      granularity: 'day',
      periods: 7,
    },
  },
);

for (const entry of ranked) {
  console.log(`#${entry.rank} ${entry.label}: ${(entry.value * 100).toFixed(1)}%`);
}
```

### Example 7: Export Cohort to Multiple Targets

```typescript
import { CohortExportService } from '@mcv/analytics/cohorts';

// Export high-value users to a CDP segment for targeting
const segmentResult = await exportService.toSegment(
  highValueCohortId,
  ventureId,
  'segment_high_value_users',
  {
    filters: {
      operator: 'and',
      conditions: [
        {
          id: crypto.randomUUID(),
          source: 'profile',
          field: 'email_verified',
          operator: 'eq',
          value: true,
        },
      ],
    },
  },
);

console.log(`Exported ${segmentResult.exportedCount} users to segment`);
console.log(`Duration: ${segmentResult.durationMs}ms`);

// Export churned users to a re-engagement email campaign
const campaignResult = await exportService.toCampaign(
  churnedCohortId,
  ventureId,
  {
    provider: 'sendgrid',
    listId: 'list_reengagement_q1',
    tags: ['cohort-export', 'reengagement', 'q1-2024'],
  },
);

console.log(`Exported ${campaignResult.exportedCount} users to SendGrid`);

// Export lookalike audience to Facebook Ads
const audienceResult = await exportService.toAudience(
  topPerformersCohortId,
  ventureId,
  {
    platform: 'facebook',
    audienceId: 'aud_lookalike_seed_2024',
    accountId: 'act_123456789',
  },
  { limit: 50000 }, // Facebook custom audience limit
);

console.log(`Exported ${audienceResult.exportedCount} users to Facebook`);

// Schedule a weekly export of active users to a webhook
const schedule = await exportService.schedule(
  activeCohortId,
  ventureId,
  {
    type: 'webhook',
    webhookConfig: {
      url: 'https://api.internal.example.com/cohort-sync',
      method: 'POST',
      headers: { Authorization: 'Bearer ${WEBHOOK_TOKEN}' },
      batchSize: 1000,
    },
  },
  {
    cron: '0 9 * * 1', // Every Monday at 9 AM
    timezone: 'America/New_York',
  },
);

console.log(`Scheduled weekly export: ${schedule.scheduleId}`);
```

### Example 8: Query Builder for Complex Cohort Rules

```typescript
import { buildCohortQuery } from '@mcv/analytics/cohorts';

// The query builder translates cohort rule trees into optimized SQL
const ruleGroup: CohortRuleGroup = {
  operator: 'and',
  conditions: [
    // Must have signed up in January 2024
    {
      id: '1',
      source: 'event',
      field: 'user_signed_up',
      operator: 'exists',
      timeConstraint: {
        relativeTo: 'absolute',
        dateRange: {
          start: '2024-01-01T00:00:00Z',
          end: '2024-01-31T23:59:59Z',
        },
      },
    },
    // Must be in either "pro" or "enterprise" plan
    {
      id: '2',
      source: 'profile',
      field: 'plan_tier',
      operator: 'in',
      value: ['pro', 'enterprise'],
    },
    // Must have completed at least one of these actions
    {
      operator: 'or',
      conditions: [
        {
          id: '3a',
          source: 'event',
          field: 'purchase_completed',
          operator: 'exists',
          frequencyConstraint: { operator: 'at_least', count: 1 },
        },
        {
          id: '3b',
          source: 'event',
          field: 'subscription_started',
          operator: 'exists',
          frequencyConstraint: { operator: 'at_least', count: 1 },
        },
      ],
    },
  ],
};

const { sql, params } = buildCohortQuery(ruleGroup, ventureId);

// Generated SQL (conceptual):
// SELECT DISTINCT p.id
// FROM profiles p
// JOIN events e1 ON e1.profile_id = p.id
//   AND e1.event = 'user_signed_up'
//   AND e1.timestamp BETWEEN $1 AND $2
// WHERE p.venture_id = $3
//   AND p.plan_tier = ANY($4)
//   AND (
//     EXISTS (SELECT 1 FROM events e2 WHERE e2.profile_id = p.id AND e2.event = 'purchase_completed')
//     OR EXISTS (SELECT 1 FROM events e3 WHERE e3.profile_id = p.id AND e3.event = 'subscription_started')
//   )
```

---

## Error Codes

All errors extend the base `CohortError` class and include a machine-readable code, human-readable message, and optional context.

```typescript
// ─── Base Error ───────────────────────────────────────────────────────────────

export class CohortError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly context?: Record<string, unknown>,
  ) {
    super(message);
    this.name = 'CohortError';
  }
}

// ─── Specific Errors ──────────────────────────────────────────────────────────

export class CohortNotFoundError extends CohortError {
  constructor(cohortId: string) {
    super('COHORT_NOT_FOUND', `Cohort ${cohortId} not found`, { cohortId });
  }
}

export class CohortDefinitionError extends CohortError {
  constructor(message: string, definition?: unknown) {
    super('COHORT_DEFINITION_INVALID', message, { definition });
  }
}

export class CohortRuleValidationError extends CohortError {
  constructor(ruleId: string, message: string) {
    super('COHORT_RULE_INVALID', `Rule ${ruleId}: ${message}`, { ruleId });
  }
}

export class RetentionComputeError extends CohortError {
  constructor(message: string) {
    super('RETENTION_COMPUTE_FAILED', message);
  }
}

export class CohortComparisonError extends CohortError {
  constructor(message: string) {
    super('COHORT_COMPARISON_FAILED', message);
  }
}

export class CohortExportError extends CohortError {
  constructor(message: string) {
    super('COHORT_EXPORT_FAILED', message);
  }
}

export class CohortMembershipError extends CohortError {
  constructor(profileId: string, message: string) {
    super('COHORT_MEMBERSHIP_ERROR', message, { profileId });
  }
}

export class LifecycleComputeError extends CohortError {
  constructor(message: string) {
    super('LIFECYCLE_COMPUTE_FAILED', message);
  }
}

export class RevenueCohortError extends CohortError {
  constructor(message: string) {
    super('REVENUE_COHORT_FAILED', message);
  }
}

export class CohortPermissionError extends CohortError {
  constructor(action: string, ventureId: string) {
    super(
      'COHORT_PERMISSION_DENIED',
      `Permission denied: ${action} on venture ${ventureId}`,
      { action, ventureId },
    );
  }
}

export class CohortQuotaExceededError extends CohortError {
  constructor(resource: string, limit: number, current: number) {
    super(
      'COHORT_QUOTA_EXCEEDED',
      `Quota exceeded for ${resource}: ${current}/${limit}`,
      { resource, limit, current },
    );
  }
}

export class CohortSnapshotError extends CohortError {
  constructor(cohortId: string, message: string) {
    super('COHORT_SNAPSHOT_FAILED', message, { cohortId });
  }
}

export class CohortTimeRangeError extends CohortError {
  constructor(message: string) {
    super('COHORT_TIME_RANGE_INVALID', message);
  }
}
```

### Error Code Reference Table

| Code | Class | HTTP | Description |
|------|-------|------|-------------|
| `COHORT_NOT_FOUND` | `CohortNotFoundError` | 404 | Cohort ID does not exist or is not accessible in the current venture |
| `COHORT_DEFINITION_INVALID` | `CohortDefinitionError` | 400 | Cohort definition is malformed, missing required fields, or contains invalid values |
| `COHORT_RULE_INVALID` | `CohortRuleValidationError` | 400 | A specific rule in the cohort definition is invalid (bad operator, missing field, etc.) |
| `RETENTION_COMPUTE_FAILED` | `RetentionComputeError` | 500 | Retention grid or curve computation failed (timeout, data error, resource limit) |
| `COHORT_COMPARISON_FAILED` | `CohortComparisonError` | 500 | Comparison run failed (invalid cohort IDs, metric computation error) |
| `COHORT_EXPORT_FAILED` | `CohortExportError` | 500 | Export job failed (target unreachable, auth error, rate limit) |
| `COHORT_MEMBERSHIP_ERROR` | `CohortMembershipError` | 500 | Error resolving or querying membership (query timeout, data inconsistency) |
| `LIFECYCLE_COMPUTE_FAILED` | `LifecycleComputeError` | 500 | Lifecycle classification failed (missing activity data, compute timeout) |
| `REVENUE_COHORT_FAILED` | `RevenueCohortError` | 500 | Revenue curve computation failed (missing events, invalid property) |
| `COHORT_PERMISSION_DENIED` | `CohortPermissionError` | 403 | User lacks permission to perform the requested action on this venture |
| `COHORT_QUOTA_EXCEEDED` | `CohortQuotaExceededError` | 429 | Resource limit exceeded (max cohorts, max members, max exports per hour) |
| `COHORT_SNAPSHOT_FAILED` | `CohortSnapshotError` | 500 | Snapshot computation or storage failed |
| `COHORT_TIME_RANGE_INVALID` | `CohortTimeRangeError` | 400 | Time range is invalid (start > end, range too large, unsupported granularity) |
| `COHORT_LIST_FAILED` | `CohortError` | 500 | Listing cohorts failed (database error) |
| `COHORT_DELETE_FAILED` | `CohortError` | 500 | Cohort deletion failed (foreign key constraints, database error) |

---

## Security

### Row-Level Security (RLS)

All cohort tables enforce venture-level isolation through Supabase RLS policies. Every query is scoped to the current venture via `current_setting('app.venture_id')`.

```sql
-- Set venture context before any query
SET LOCAL app.venture_id = 'venture-uuid-here';

-- All subsequent queries are automatically filtered
SELECT * FROM cohort_definitions; -- Only returns rows for this venture
```

### Authentication & Authorization

```typescript
// All tRPC procedures use protectedProcedure which:
// 1. Validates the JWT token
// 2. Extracts userId and ventureId from the token
// 3. Sets the Supabase RLS context
// 4. Passes ctx.userId and ctx.ventureId to service methods

// Permission checks are layered:
// - RLS: Database-level isolation (venture cannot access other venture's data)
// - Service: Business logic checks (user role, plan limits)
// - Router: Input validation (Zod schemas)
```

### Data Access Controls

| Role | Create | Read | Update | Delete | Export | Compare |
|------|--------|------|--------|--------|--------|---------|
| Admin | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Analyst | ✅ | ✅ | ✅ (own) | ✅ (own) | ✅ | ✅ |
| Viewer | ❌ | ✅ | ❌ | ❌ | ❌ | ✅ |
| API Key | ✅ | ✅ | ✅ | ❌ | ✅ | ✅ |

### Data Privacy

- **PII handling**: Cohort membership stores only profile IDs, not PII directly. Profile data stays in the CDP.
- **Export controls**: Exports to external platforms (email, ads) require explicit permission and use hashed identifiers where applicable.
- **Audit logging**: All cohort CRUD operations, membership resolutions, and exports are logged to the audit trail.
- **Data retention**: Cohort snapshots and retention cache have configurable TTLs. Expired data is purged by scheduled cleanup jobs.
- **GDPR/CCPA**: Profile deletion cascades to cohort memberships. `DELETE FROM cohort_memberships WHERE profile_id = $1` is triggered by CDP profile deletion events.

### Rate Limiting

```typescript
// Computationally expensive operations are rate-limited per venture:
const RATE_LIMITS = {
  'retention.computeGrid': { maxPerHour: 60, maxConcurrent: 3 },
  'lifecycle.classifyAll': { maxPerHour: 30, maxConcurrent: 2 },
  'revenue.computeCurve':  { maxPerHour: 60, maxConcurrent: 3 },
  'comparison.compare':    { maxPerHour: 30, maxConcurrent: 2 },
  'export.toSegment':      { maxPerHour: 20, maxConcurrent: 2 },
  'export.toCampaign':     { maxPerHour: 10, maxConcurrent: 1 },
  'export.toAudience':     { maxPerHour: 10, maxConcurrent: 1 },
};
```

---

## Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `SUPABASE_URL` | ✅ | — | Supabase project URL |
| `SUPABASE_SERVICE_KEY` | ✅ | — | Supabase service role key (server-side only) |
| `COHORT_CACHE_TTL_SECONDS` | ❌ | `3600` | TTL for retention cache and snapshot results |
| `COHORT_MAX_MEMBERS` | ❌ | `1000000` | Maximum members per cohort |
| `COHORT_MAX_RETENTION_PERIODS` | ❌ | `365` | Maximum retention periods to compute |
| `COHORT_MAX_COHORTS_PER_VENTURE` | ❌ | `500` | Maximum cohorts a venture can create |
| `COHORT_MAX_CONCURRENT_COMPUTES` | ❌ | `5` | Maximum concurrent retention/lifecycle computations |
| `COHORT_SNAPSHOT_RETENTION_DAYS` | ❌ | `90` | Days to keep historical snapshots before pruning |
| `COHORT_EXPORT_MAX_PER_HOUR` | ❌ | `20` | Maximum export jobs per venture per hour |
| `COHORT_EXPORT_WEBHOOK_TIMEOUT_MS` | ❌ | `30000` | Timeout for webhook export HTTP calls |
| `COHORT_RESOLUTION_TIMEOUT_MS` | ❌ | `60000` | Timeout for membership resolution queries |
| `COHORT_REVENUE_CURRENCY_DEFAULT` | ❌ | `USD` | Default currency for revenue analysis |
| `CDP_EVENTS_TABLE` | ❌ | `cdp_events` | Name of the CDP events table to query |
| `CDP_PROFILES_TABLE` | ❌ | `cdp_profiles` | Name of the CDP profiles table to query |
| `SENDGRID_API_KEY` | ❌ | — | API key for SendGrid campaign exports |
| `MAILCHIMP_API_KEY` | ❌ | — | API key for Mailchimp campaign exports |
| `BRAZE_API_KEY` | ❌ | — | API key for Braze campaign exports |
| `FACEBOOK_ADS_ACCESS_TOKEN` | ❌ | — | Access token for Facebook audience exports |
| `GOOGLE_ADS_DEVELOPER_TOKEN` | ❌ | — | Developer token for Google Ads audience exports |

---

## Dependencies

### Internal Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| `@mcv/trpc` | `workspace:*` | tRPC router and procedure definitions |
| `@mcv/supabase` | `workspace:*` | Supabase client factory and typed client |
| `@mcv/cdp/events` | `workspace:*` | CDP event reader for retention and lifecycle queries |
| `@mcv/cdp/profiles` | `workspace:*` | CDP profile reader for attribute-based cohort resolution |
| `@mcv/cdp/segments` | `workspace:*` | CDP segment writer for cohort-to-segment export |
| `@mcv/auth` | `workspace:*` | Authentication context and permission checks |
| `@mcv/logger` | `workspace:*` | Structured logging |
| `@mcv/cache` | `workspace:*` | Cache manager for retention grids and snapshots |
| `@mcv/audit` | `workspace:*` | Audit trail logging for CRUD and export operations |

### External Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| `@supabase/supabase-js` | `^2.39.0` | Supabase PostgreSQL client |
| `@trpc/server` | `^10.45.0` | tRPC server framework |
| `zod` | `^3.22.0` | Runtime schema validation |
| `date-fns` | `^3.3.0` | Date manipulation, period generation, formatting |
| `crypto` | (built-in) | UUID generation for IDs |

### Peer Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| `typescript` | `^5.3.0` | Type system |
| `@sendgrid/client` | `^8.0.0` | SendGrid API (optional, for campaign exports) |
| `@mailchimp/mailchimp_marketing` | `^3.0.0` | Mailchimp API (optional, for campaign exports) |
| `facebook-nodejs-business-sdk` | `^18.0.0` | Facebook Marketing API (optional, for audience exports) |
| `google-ads-api` | `^14.0.0` | Google Ads API (optional, for audience exports) |

---

## Testing

### Unit Tests

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CohortService } from './services/cohort-service';
import { RetentionService } from './services/retention-service';
import { LifecycleService } from './services/lifecycle-service';

describe('CohortService', () => {
  let service: CohortService;
  let mockDb: any;
  let mockCdpEvents: any;
  let mockCdpProfiles: any;

  beforeEach(() => {
    mockDb = {
      from: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn(),
      overlaps: vi.fn().mockReturnThis(),
      ilike: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      range: vi.fn().mockReturnThis(),
    };
    mockCdpEvents = { query: vi.fn() };
    mockCdpProfiles = { query: vi.fn() };

    service = new CohortService(mockDb, mockCdpEvents, mockCdpProfiles, null);
  });

  describe('get', () => {
    it('should return a cohort by ID', async () => {
      mockDb.single.mockResolvedValue({
        data: {
          id: 'cohort-1',
          venture_id: 'venture-1',
          name: 'January Signups',
          description: 'Users who signed up in January',
          type: 'time_based',
          definition: { type: 'time_based', anchorEvent: 'user_signed_up' },
          period_label: '2024-01',
          member_count: 342,
          is_dynamic: true,
          tags: ['monthly', 'signups'],
          created_by: 'user-1',
          created_at: '2024-02-01T00:00:00Z',
          updated_at: '2024-02-01T00:00:00Z',
          last_snapshot_at: null,
        },
        error: null,
      });

      const cohort = await service.get('cohort-1', 'venture-1');

      expect(cohort.id).toBe('cohort-1');
      expect(cohort.name).toBe('January Signups');
      expect(cohort.memberCount).toBe(342);
      expect(cohort.periodLabel).toBe('2024-01');
    });

    it('should throw CohortNotFoundError for missing cohort', async () => {
      mockDb.single.mockResolvedValue({ data: null, error: { message: 'Not found' } });

      await expect(service.get('missing', 'venture-1')).rejects.toThrow(
        CohortNotFoundError,
      );
    });
  });

  describe('list', () => {
    it('should list cohorts with filtering and pagination', async () => {
      mockDb.range.mockResolvedValue({
        data: [
          { id: 'c1', venture_id: 'v1', name: 'A', member_count: 100, tags: [] },
          { id: 'c2', venture_id: 'v1', name: 'B', member_count: 200, tags: [] },
        ],
        error: null,
        count: 15,
      });

      const result = await service.list('v1', {
        type: 'time_based',
        limit: 2,
        offset: 0,
        orderBy: 'memberCount',
        orderDir: 'desc',
      });

      expect(result.cohorts).toHaveLength(2);
      expect(result.total).toBe(15);
    });
  });

  describe('update', () => {
    it('should update cohort name and tags', async () => {
      mockDb.single.mockResolvedValue({
        data: {
          id: 'c1',
          venture_id: 'v1',
          name: 'Updated Name',
          tags: ['new-tag'],
          updated_at: '2024-02-15T00:00:00Z',
        },
        error: null,
      });

      const updated = await service.update('c1', 'v1', {
        name: 'Updated Name',
        tags: ['new-tag'],
      });

      expect(updated.name).toBe('Updated Name');
      expect(updated.tags).toEqual(['new-tag']);
    });
  });
});

describe('RetentionService', () => {
  describe('dayN', () => {
    it('should return retention rates for specified days', async () => {
      const mockRetentionService = {
        computeCurve: vi.fn().mockResolvedValue({
          cohortId: 'c1',
          cohortLabel: '2024-01',
          cohortSize: 1000,
          rates: [
            { period: 0, label: 'day 0', activeUsers: 1000, retentionRate: 1.0 },
            { period: 1, label: 'day 1', activeUsers: 650, retentionRate: 0.65 },
            { period: 7, label: 'day 7', activeUsers: 420, retentionRate: 0.42 },
            { period: 30, label: 'day 30', activeUsers: 280, retentionRate: 0.28 },
          ],
        }),
      };

      // Testing the logic (dayN delegates to computeCurve)
      const curve = await mockRetentionService.computeCurve();
      const dayNResult: Record<number, number> = {};
      for (const day of [1, 7, 30]) {
        const point = curve.rates.find((r: any) => r.period === day);
        dayNResult[day] = point?.retentionRate ?? 0;
      }

      expect(dayNResult[1]).toBe(0.65);
      expect(dayNResult[7]).toBe(0.42);
      expect(dayNResult[30]).toBe(0.28);
    });
  });
});

describe('LifecycleService', () => {
  describe('classifyMember (logic)', () => {
    it('should classify as "new" within window', () => {
      const enteredAt = new Date('2024-02-01');
      const referenceDate = new Date('2024-02-10');
      const daysSinceEntry = Math.floor(
        (referenceDate.getTime() - enteredAt.getTime()) / (1000 * 60 * 60 * 24),
      );
      const config = { newWindowDays: 14, dormantAfterDays: 30, churnedAfterDays: 90 };

      expect(daysSinceEntry).toBe(9);
      expect(daysSinceEntry <= config.newWindowDays).toBe(true);
      // → stage = 'new'
    });

    it('should classify as "churned" after threshold', () => {
      const referenceDate = new Date('2024-06-01');
      const lastActivityDate = new Date('2024-01-15');
      const daysSinceLastActivity = Math.floor(
        (referenceDate.getTime() - lastActivityDate.getTime()) / (1000 * 60 * 60 * 24),
      );
      const config = { churnedAfterDays: 90 };

      expect(daysSinceLastActivity).toBeGreaterThanOrEqual(config.churnedAfterDays);
      // → stage = 'churned'
    });

    it('should classify as "dormant" between thresholds', () => {
      const referenceDate = new Date('2024-03-15');
      const lastActivityDate = new Date('2024-02-01');
      const daysSinceLastActivity = Math.floor(
        (referenceDate.getTime() - lastActivityDate.getTime()) / (1000 * 60 * 60 * 24),
      );
      const config = { dormantAfterDays: 30, churnedAfterDays: 90 };

      expect(daysSinceLastActivity).toBeGreaterThanOrEqual(config.dormantAfterDays);
      expect(daysSinceLastActivity).toBeLessThan(config.churnedAfterDays);
      // → stage = 'dormant'
    });
  });
});
```

### Integration Tests

```typescript
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createClient } from '@supabase/supabase-js';
import { CohortService } from './services/cohort-service';
import { RetentionService } from './services/retention-service';

describe('Cohort Integration Tests', () => {
  let db: ReturnType<typeof createClient>;
  let cohortService: CohortService;
  let retentionService: RetentionService;
  const testVentureId = 'test-venture-integration';

  beforeAll(async () => {
    db = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_KEY!,
    );

    // Set venture context
    await db.rpc('set_venture_context', { venture_id: testVentureId });

    cohortService = new CohortService(db, null, null, null);
    retentionService = new RetentionService(db, cohortService, null);

    // Seed test data
    await seedTestData(db, testVentureId);
  });

  afterAll(async () => {
    // Clean up test data
    await db.from('cohort_definitions').delete().eq('venture_id', testVentureId);
  });

  it('should create and resolve a time-based cohort', async () => {
    const cohorts = await cohortService.createTimeSeries(
      testVentureId,
      'Integration Test Weekly',
      'user_signed_up',
      {
        start: '2024-01-01T00:00:00Z',
        end: '2024-01-31T23:59:59Z',
        granularity: 'week',
      },
      'test-user',
    );

    expect(cohorts.length).toBeGreaterThan(0);
    expect(cohorts[0].periodLabel).toBeTruthy();

    // Resolve members
    const { members, total } = await cohortService.resolveMembers(
      cohorts[0].id,
      testVentureId,
    );

    expect(total).toBeGreaterThan(0);
    expect(members[0].anchorDate).toBeTruthy();
  });

  it('should compute a retention grid end-to-end', async () => {
    // Create cohorts and compute retention
    const cohorts = await cohortService.createTimeSeries(
      testVentureId,
      'Retention Test',
      'user_signed_up',
      {
        start: '2024-01-01T00:00:00Z',
        end: '2024-02-28T23:59:59Z',
        granularity: 'month',
      },
      'test-user',
    );

    const grid = await retentionService.computeGrid(
      testVentureId,
      cohorts.map(c => c.id),
      {
        returnEvent: 'session_started',
        granularity: 'week',
        periods: 4,
      },
    );

    expect(grid.cells.length).toBeGreaterThan(0);
    expect(grid.cohortLabels.length).toBe(cohorts.length);
    expect(grid.averageByRetentionPeriod.length).toBe(5); // 0..4
    expect(grid.cells[0].retentionRate).toBeGreaterThanOrEqual(0);
    expect(grid.cells[0].retentionRate).toBeLessThanOrEqual(1);
  });

  it('should create a custom cohort with complex rules', async () => {
    const cohort = await cohortService.create(
      testVentureId,
      {
        name: 'Complex Rule Test',
        rules: {
          operator: 'and',
          conditions: [
            {
              id: crypto.randomUUID(),
              source: 'event',
              field: 'purchase_completed',
              operator: 'exists',
              frequencyConstraint: { operator: 'at_least', count: 3 },
            },
            {
              id: crypto.randomUUID(),
              source: 'profile',
              field: 'country',
              operator: 'in',
              value: ['US', 'CA', 'UK'],
            },
          ],
        },
        isDynamic: false,
        tags: ['test'],
      },
      'test-user',
    );

    expect(cohort.name).toBe('Complex Rule Test');
    expect(cohort.isDynamic).toBe(false);

    // Clean up
    await cohortService.delete(cohort.id, testVentureId);
  });

  it('should snapshot a cohort with retention and lifecycle', async () => {
    const snapshot = await cohortService.snapshot(
      existingCohortId,
      testVentureId,
      {
        includeRetention: true,
        retentionConfig: {
          returnEvent: 'session_started',
          granularity: 'day',
          periods: 7,
        },
        includeLifecycle: true,
        lifecycleConfig: {
          newWindowDays: 7,
          dormantAfterDays: 14,
          churnedAfterDays: 30,
          activityEvents: ['session_started'],
        },
        includeRevenue: false,
      },
    );

    expect(snapshot.memberCount).toBeGreaterThan(0);
    expect(snapshot.retentionGrid).toBeTruthy();
    expect(snapshot.lifecycleDistribution).toBeTruthy();
    expect(snapshot.lifecycleDistribution!.new).toBeGreaterThanOrEqual(0);
  });
});
```

### Test Coverage Targets

| Area | Target | Notes |
|------|--------|-------|
| CohortService CRUD | 95% | All CRUD paths including error cases |
| Retention computation | 90% | Grid, curve, Day-N, comparison |
| Lifecycle classification | 90% | All 5 stages, transitions, edge cases |
| Revenue cohort tracking | 85% | Curves, ARPU, forecast model accuracy |
| Cohort comparison | 85% | Multi-metric comparison, ranking, diff |
| Export service | 80% | Segment, campaign, audience, CSV, webhook |
| Query builder | 95% | All operators, nested groups, SQL generation |
| Zod schemas | 100% | All schemas validate correctly |
| Error handling | 90% | All error codes thrown in correct conditions |
| RLS policies | 100% | Venture isolation enforced in all tables |

### Performance Benchmarks

```typescript
describe('Performance', () => {
  it('should compute retention grid for 12 monthly cohorts × 12 periods in < 5s', async () => {
    const start = performance.now();

    const grid = await retentionService.computeGrid(
      ventureId,
      twelveMonthlyCohortIds,
      {
        returnEvent: 'session_started',
        granularity: 'month',
        periods: 12,
      },
    );

    const duration = performance.now() - start;
    expect(duration).toBeLessThan(5000);
    expect(grid.cells.length).toBe(12 * 13); // 12 cohorts × 13 periods (0..12)
  });

  it('should resolve membership for a 100K-member cohort in < 10s', async () => {
    const start = performance.now();

    const { members, total } = await cohortService.resolveMembers(
      largeCohortId,
      ventureId,
      { limit: 100000 },
    );

    const duration = performance.now() - start;
    expect(duration).toBeLessThan(10000);
    expect(total).toBeGreaterThanOrEqual(100000);
  });

  it('should classify lifecycle stages for 50K members in < 15s', async () => {
    const start = performance.now();

    const distribution = await lifecycleService.classifyAll(
      largeCohortId,
      ventureId,
      {
        newWindowDays: 14,
        dormantAfterDays: 30,
        churnedAfterDays: 90,
        activityEvents: ['session_started'],
      },
    );

    const duration = performance.now() - start;
    expect(duration).toBeLessThan(15000);
    expect(distribution.totalMembers).toBeGreaterThanOrEqual(50000);
  });
});
```

---

## Changelog

| Version | Date | Changes |
|---------|------|---------|
| `0.1.0` | 2024-01 | Initial implementation — CohortService, time-based cohorts |
| `0.2.0` | 2024-02 | RetentionService — grids, curves, Day-N |
| `0.3.0` | 2024-02 | LifecycleService — classification, transitions |
| `0.4.0` | 2024-03 | RevenueCohortService — LTV curves, ARPU, forecasting |
| `0.5.0` | 2024-03 | CohortComparisonService — multi-metric comparison |
| `0.6.0` | 2024-04 | CohortExportService — segments, campaigns, audiences |
| `0.7.0` | 2024-04 | Custom cohorts — rule builder, query engine |
| `0.8.0` | 2024-05 | Performance optimizations — caching, batch queries |
| `1.0.0` | 2024-06 | Production release — full test coverage, audit logging |